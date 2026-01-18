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
    const safe = safeSelf();
    const logPrefix = safe.makeLogPrefix('prevent-innerHTML', selector, pattern);
    const matcher = safe.initPattern(pattern, { canNegate: true });
    const current = safe.Object_getOwnPropertyDescriptor(Element.prototype, 'innerHTML');
    if ( current === undefined ) { return; }
    const shouldPreventSet = (elem, a) => {
        if ( selector !== '' ) {
            if ( typeof elem.matches !== 'function' ) { return false; }
            if ( elem.matches(selector) === false ) { return false; }
        }
        return safe.testPattern(matcher, `${a}`);
    };
    Object.defineProperty(Element.prototype, 'innerHTML', {
        get: function() {
            return current.get
                ? current.get.call(this)
                : current.value;
        },
        set: function(a) {
            if ( shouldPreventSet(this, a) ) {
                safe.uboLog(logPrefix, 'Prevented');
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

function trustedJsonEditFetchRequest(jsonq = '', ...args) {
    jsonEditFetchRequestFn(true, jsonq, ...args);
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

const $scriptletFunctions$ = /* 46 */
[trustedEditInboundObject,trustedJsonEditFetchRequest,adjustSetTimeout,jsonPruneFetchResponse,jsonPruneXhrResponse,trustedReplaceXhrResponse,trustedReplaceFetchResponse,trustedPreventDomBypass,jsonPrune,jsonEdit,setConstant,jsonlEditXhrResponse,noWindowOpenIf,abortCurrentScript,trustedSetConstant,trustedSuppressNativeMethod,preventXhr,preventSetTimeout,preventFetch,removeAttr,trustedReplaceArgument,trustedOverrideElementMethod,preventRequestAnimationFrame,trustedReplaceOutboundText,abortOnPropertyRead,adjustSetInterval,preventSetInterval,abortOnStackTrace,preventAddEventListener,abortOnPropertyWrite,noWebrtc,noEvalIf,disableNewtabLinks,preventInnerHTML,trustedJsonEditXhrResponse,jsonEditXhrResponse,xmlPrune,m3uPrune,jsonEditFetchResponse,trustedPreventXhr,trustedPreventFetch,trustedJsonEdit,spoofCSS,alertBuster,preventCanvas,trustedJsonEditFetchResponse];

const $scriptletArgs$ = /* 3026 */ ["JSON.stringify","0","..client[?.clientName==\"WEB\"]+={\"clientScreen\":\"CHANNEL\"}","propsToMatch","/\\/(player|get_watch)/","[native code]","17000","0.001","adPlacements adSlots playerResponse.adPlacements playerResponse.adSlots [].playerResponse.adPlacements [].playerResponse.adSlots","","/player?","adPlacements adSlots playerResponse.adPlacements playerResponse.adSlots","/playlist?","/\\/player(?:\\?.+)?$/","\"adPlacements\"","\"no_ads\"","/playlist\\?list=|\\/player(?:\\?.+)?$|watch\\?[tv]=/","/\"adPlacements.*?([A-Z]\"\\}|\"\\}{2,4})\\}\\],/","/\"adPlacements.*?(\"adSlots\"|\"adBreakHeartbeatParams\")/gms","$1","player?","\"adSlots\"","/^\\W+$/","Node.prototype.appendChild","fetch","Request","JSON.parse","entries.[-].command.reelWatchEndpoint.adClientParams.isAd","/get_watch?","require.0.3.0.__bbox.require.[].3.1.__bbox.result.data.viewer.sideFeedUnit.nodes.[].new_adverts.nodes.[-].sponsored_data","data.viewer.sideFeedUnit.nodes.[].new_adverts.nodes.[-].sponsored_data","/graphql","..sideFeed.nodes.*[?.__typename==\"AdsSideFeedUnit\"]","Env.ghljssj","false","require.0.3.0.__bbox.require.[].3.1.__bbox.result.data.serpResponse.results.edges.[-].rendering_strategy.view_model.story.sponsored_data.ad_id","..__bbox.result.data.node[?@.*.__typename==\"SponsoredData\"]",".data[?@.category==\"SPONSORED\"].node","..node[?.*.__typename==\"SponsoredData\"]",".data.viewer.news_feed.edges.*[?@.category==\"SPONSORED\"].node","console.clear","undefined","globalThis","break;case","WebAssembly","atob","pubadxtag","json:{\"divIds\":[]}","Document.prototype.getElementById","\"/^[A-Z][-0-9A-Z_a-z]{3,}$/\"","Document.prototype.querySelector","\"/^[#.][A-Z][-A-Z_a-z]+$/\"","\"/^\\[data-l/\"","Document.prototype.querySelectorAll","\"/^div\\[/\"","Document.prototype.getElementsByTagName","\"i\"","\"/^\\[data-[a-z]{5,6}\\]$/\"","Array.from","\"/NodeList/\"","prevent","inlineScript","\"/^\\[d[a-z]t[a-z]?-[a-z]{3}\\]$/\"","\"/^\\[[a-z]{2,3}-/\"","\"/^\\[data-[a-z]+src\\]$/\"","\"/^\\[[a-z]{5}-/\"","\"/^\\[[a-ce-z][a-z]+-/\"","\"/^\\[d[b-z][a-z]*-/\"","/vast.php?","/click\\.com|preroll|native_render\\.js|acscdn/","length:10001","]();}","500","162.252.214.4","true","c.adsco.re","adsco.re:2087","/^ [-\\d]/","Math.random","parseInt(localStorage['\\x","adBlockDetected","Math","localStorage['\\x","-load.com/script/","length:101",")](this,...","3000-6000","(new Error(","/fd/ls/lsp.aspx",".offsetHeight>0","/^https:\\/\\/pagead2\\.googlesyndication\\.com\\/pagead\\/js\\/adsbygoogle\\.js\\?client=ca-pub-3497863494706299$/","data-instype","ins.adsbygoogle:has(> div#aswift_0_host)","stay","url:https://googleads.g.doubleclick.net/pagead/ads?client=ca-pub-3497863494706299 method:HEAD mode:no-cors","throttle","121","String.prototype.indexOf","json:\"/\"","condition","/premium","HTMLIFrameElement.prototype.remove","iframe[src^=\"https://googleads.g.doubleclick.net/pagead/ads?client=ca-pub-3497863494706299\"]","adblock","String.prototype.includes","json:\"gecmisi\"","googleads","json:\"googleads\"","gecmisi","++","g.doubleclick.net","length:100000","/Copyright|doubleclick$/","favicon","length:252","Headers.prototype.get","/.+/","image/png.","/^text\\/plain;charset=UTF-8$/","json:\"content-type\"","cache-control","Headers.prototype.has","summerday","length:10","{\"type\":\"cors\"}","/offsetHeight|loaded/","HTMLScriptElement.prototype.onerror","pagead2.googlesyndication.com/pagead/js/adsbygoogle.js method:HEAD","emptyStr","Node.prototype.contains","{\"className\":\"adsbygoogle\"}","abort","Keen","stream.insertion","/video/auth/media","akamaiDisableServerIpLookup","noopFunc","MONETIZER101.init","/outboundLink/","v.fwmrm.net/ad/g/","war:noop-vmap1.xml","DD_RUM.addAction","nads.createAd","trueFunc","t++","dvtag.getTargeting","ga","class|style","div[id^=\"los40_gpt\"]","huecosPBS.nstdX","null","config.globalInteractions.[].bsData","googlesyndication","DTM.trackAsyncPV","_satellite","{}","_satellite.getVisitorId","mobileanalytics","newPageViewSpeedtest","pubg.unload","generateGalleryAd","mediator","Object.prototype.subscribe","gbTracker","gbTracker.sendAutoSearchEvent","Object.prototype.vjsPlayer.ads","marmalade","setInterval","url:ipapi.co","doubleclick","isPeriodic","*","data-woman-ex","a[href][data-woman-ex]","data-trm-action|data-trm-category|data-trm-label",".trm_event","KeenTracking","network_user_id","cloudflare.com/cdn-cgi/trace","History","/(^(?!.*(Function|HTMLDocument).*))/","api","google.ima.OmidVerificationVendor","Object.prototype.omidAccessModeRules","googletag.cmd","skipAdSeconds","0.02","/recommendations.","_aps","/api/analytics","Object.prototype.setDisableFlashAds","DD_RUM.addTiming","chameleonVideo.adDisabledRequested","AdmostClient","analytics","native code","15000","(null)","5000","datalayer","[]","Object.prototype.isInitialLoadDisabled","lr-ingest.io","listingGoogleEETracking","dcsMultiTrack","urlStrArray","pa","Object.prototype.setConfigurations","/gtm.js","JadIds","Object.prototype.bk_addPageCtx","Object.prototype.bk_doJSTag","passFingerPrint","optimizely","optimizely.initialized","google_optimize","google_optimize.get","_gsq","_gsq.push","stmCustomEvent","_gsDevice","iom","iom.c","_conv_q","_conv_q.push","google.ima.settings.setDisableFlashAds","pa.privacy","populateClientData4RBA","YT.ImaManager","UOLPD","UOLPD.dataLayer","__configuredDFPTags","URL_VAST_YOUTUBE","Adman","dplus","dplus.track","_satellite.track","/EzoIvent|TDELAY/","google.ima.dai","/froloa.js","adv","gfkS2sExtension","gfkS2sExtension.HTML5VODExtension","click","/event_callback=function\\(\\){window\\.location=t\\.getAttribute\\(\"href\"\\)/","AnalyticsEventTrackingJS","AnalyticsEventTrackingJS.addToBasket","AnalyticsEventTrackingJS.trackErrorMessage","initializeslideshow","b()","3000","ads","fathom","fathom.trackGoal","Origami","Origami.fastclick","document.querySelector","{\"value\": \".ad-placement-interstitial\"}",".easyAdsBox","jad","hasAdblocker","Sentry","Sentry.init","TRC","TRC._taboolaClone","fp","fp.t","fp.s","initializeNewRelic","turnerAnalyticsObj","turnerAnalyticsObj.setVideoObject4AnalyticsProperty","turnerAnalyticsObj.getVideoObject4AnalyticsProperty","optimizelyDatafile","optimizelyDatafile.featureFlags","fingerprint","fingerprint.getCookie","gform.utils","gform.utils.trigger","get_fingerprint","moatPrebidApi","moatPrebidApi.getMoatTargetingForPage","readyPromise","cpd_configdata","cpd_configdata.url","yieldlove_cmd","yieldlove_cmd.push","dataLayer.push","1.1.1.1/cdn-cgi/trace","_etmc","_etmc.push","freshpaint","freshpaint.track","ShowRewards","stLight","stLight.options","DD_RUM.addError","sensorsDataAnalytic201505","sensorsDataAnalytic201505.init","sensorsDataAnalytic201505.quick","sensorsDataAnalytic201505.track","s","s.tl","taboola timeout","clearInterval(run)","smartech","/TDELAY|EzoIvent/","sensors","sensors.init","/piwik-","2200","2300","sensors.track","googleFC","adn","adn.clearDivs","_vwo_code","live.streamtheworld.com/partnerIds","gtag","_taboola","_taboola.push","clicky","clicky.goal","WURFL","_sp_.config.events.onSPPMObjectReady","gtm","gtm.trackEvent","mParticle.Identity.getCurrentUser","_omapp.scripts.geolocation","{\"value\": {\"status\":\"loaded\",\"object\":null,\"data\":{\"country\":{\"shortName\":\"\",\"longName\":\"\"},\"administrative_area_level_1\":{\"shortName\":\"\",\"longName\":\"\"},\"administrative_area_level_2\":{\"shortName\":\"\",\"longName\":\"\"},\"locality\":{\"shortName\":\"\",\"longName\":\"\"},\"original\":{\"ip\":\"\",\"ip_decimal\":null,\"country\":\"\",\"country_eu\":false,\"country_iso\":\"\",\"city\":\"\",\"latitude\":null,\"longitude\":null,\"user_agent\":{\"product\":\"\",\"version\":\"\",\"comment\":\"\",\"raw_value\":\"\"},\"zip_code\":\"\",\"time_zone\":\"\"}},\"error\":\"\"}}","JSGlobals.prebidEnabled","i||(e(),i=!0)","2500","elasticApm","elasticApm.init","ga.sendGaEvent","adConfig","ads.viralize.tv","adobe","MT","MT.track","ClickOmniPartner","adex","adex.getAdexUser","Adkit","Object.prototype.shouldExpectGoogleCMP","apntag.refresh","pa.sendEvent","Munchkin","Munchkin.init","Event","ttd_dom_ready","ramp","appInfo.snowplow.trackSelfDescribingEvent","_vwo_code.init","adobePageView","adobeSearchBox","elements",".dropdown-menu a[href]","dapTracker","dapTracker.track","newrelic","newrelic.setCustomAttribute","adobeDataLayer","adobeDataLayer.push","Object.prototype._adsDisabled","Object.defineProperty","1","json:\"_adsEnabled\"","_adsDisabled","utag","utag.link","_satellite.kpCustomEvent","Object.prototype.disablecommercials","Object.prototype._autoPlayOnlyWithPrerollAd","Sentry.addBreadcrumb","sensorsDataAnalytic201505.register","freestar.newAdSlots","ytInitialPlayerResponse.playerAds","ytInitialPlayerResponse.adPlacements","ytInitialPlayerResponse.adSlots","playerResponse.adPlacements","playerResponse.adPlacements playerResponse.playerAds playerResponse.adSlots adPlacements playerAds adSlots important","reelWatchSequenceResponse.entries.[-].command.reelWatchEndpoint.adClientParams.isAd entries.[-].command.reelWatchEndpoint.adClientParams.isAd","url:/reel_watch_sequence?","load","Object","fireEvent","enabled","force_disabled","hard_block","header_menu_abvs","10000","adsbygoogle","nsShowMaxCount","toiads","objVc.interstitial_web","adb","navigator.userAgent","require.0.3.0.__bbox.require.[].3.1.__bbox.result.data.serpResponse.results.edges.[-].relay_rendering_strategy.view_model.story.sponsored_data.ad_id","/\\{\"node\":\\{\"role\":\"SEARCH_ADS\"[^\\n]+?cursor\":[^}]+\\}/g","/api/graphql","/\\{\"node\":\\{\"__typename\":\"MarketplaceFeedAdStory\"[^\\n]+?\"cursor\":(?:null|\"\\{[^\\n]+?\\}\"|[^\\n]+?MarketplaceSearchFeedStoriesEdge\")\\}/g","/\\{\"node\":\\{\"__typename\":\"VideoHomeFeedUnitSectionComponent\"[^\\n]+?\"sponsored_data\":\\{\"ad_id\"[^\\n]+?\"cursor\":null\\}/","require.0.3.0.__bbox.require.[].3.1.__bbox.result.data.node","require.0.3.0.__bbox.require.[].3.1.__bbox.result.data.node.story.sponsored_data.ad_id","require.0.3.0.__bbox.require.[].3.1.__bbox.result.data.marketplace_search.feed_units.edges.[-].node.story.sponsored_data.ad_id","require.0.3.0.__bbox.require.[].3.1.__bbox.result.data.viewer.marketplace_feed_stories.edges.[-].node.story.sponsored_data.ad_id","data.viewer.instream_video_ads data.scrubber",".data.viewer.marketplace_feed_stories.edges.*[?@.node.__typename==\"MarketplaceFeedAdStory\"]","__eiPb","detector","_ml_ads_ns","jQuery","cookie","showAds","adBlockerDetected","show","SmartAdServerASMI","repl:/\"adBlockWallEnabled\":true/\"adBlockWallEnabled\":false/","adBlockWallEnabled","_sp_._networkListenerData","SZAdBlockDetection","_sp_.config","AntiAd.check","open","/^/","showNotice","_sp_","$","_sp_.mms.startMsg","retrievalService","admrlWpJsonP","yafaIt","LieDetector","ClickHandler","IsAdblockRequest","InfMediafireMobileFunc","1000","newcontent","ExoLoader.serve","Fingerprint2","request=adb","AdController","popupBlocked","/\\}\\s*\\(.*?\\b(self|this|window)\\b.*?\\)/","_0x","stop","onload","ga.length","btoa","adcashMacros","grecaptcha.ready","BACK","jwplayer.utils.Timer","adblock_added","setTimeout","admc","exoNoExternalUI38djdkjDDJsio96","String.prototype.charCodeAt","ai_","window.open","SBMGlobal.run.pcCallback","SBMGlobal.run.gramCallback","(!o)","(!i)","decodeURIComponent","shift","/0x|google|ecoded|==/","Object.prototype.hideAds","Object.prototype._getSalesHouseConfigurations","player-feedback","samInitDetection","decodeURI","Date.prototype.toUTCString","Adcash","lobster","openLity","ad_abblock_ad","String.fromCharCode","PopAds","AdBlocker","Adblock","addEventListener","displayMessage","runAdblock","document.createElement","TestAdBlock","ExoLoader","loadTool","cticodes","imgadbpops","document.getElementById","document.write","redirect","4000","sadbl","adblockcheck","doSecondPop","arrvast","onclick","RunAds","/^(?:click|mousedown)$/","bypassEventsInProxies","jQuery.adblock","test-block","adi","ads_block","blockAdBlock","blurred","exoOpts","doOpen","prPuShown","flashvars.adv_pre_src","showPopunder","IS_ADBLOCK","page_params.holiday_promo","__NA","ads_priv","ab_detected","adsEnabled","document.dispatchEvent","t4PP","href|target","a[href=\"https://imgprime.com/view.php\"][target=\"_blank\"]","complete","String.prototype.charAt","sc_adv_out","pbjs.libLoaded","mz","ad_blocker","AaDetector","_abb","puShown","/doOpen|popundr/","pURL","readyState","serve","stop()","Math.floor","AdBlockDetectorWorkaround","apstagLOADED","jQuery.hello","/Adb|moneyDetect/","isShowingAd","VikiPlayer.prototype.pingAbFactor","player.options.disableAds","__htapop","exopop","/^(?:load|click)$/","popMagic","script","atOptions","XMLHttpRequest","flashvars.adv_pre_vast","flashvars.adv_pre_vast_alt","x_width","getexoloader","disableDeveloper","oms.ads_detect","Blocco","2000","_site_ads_ns","hasAdBlock","pop","ltvModal","luxuretv.config","popns","pushiserve","creativeLoaded-","exoframe","/^load[A-Za-z]{12,}/","rollexzone","ALoader","Object.prototype.AdOverlay","tkn_popunder","detect","dlw","40000","can_run_ads","test","adsBlockerDetector","NREUM","pop3","__ads","ready","popzone","FlixPop.isPopGloballyEnabled","falseFunc","/exo","ads.pop_url","checkAdblockUser","checkPub","6000","tabUnder","check_adblock","l.parentNode.insertBefore(s","_blank","ExoLoader.addZone","encodeURIComponent","isAdBlockActive","raConf","__ADX_URL_U","tabunder","RegExp","POSTBACK_PIXEL","mousedown","preventDefault","'0x","Aloader","advobj","replace","popTimes","addElementToBody","phantomPopunders","$.magnificPopup.open","adsenseadBlock","stagedPopUnder","seconds","clearInterval","CustomEvent","exoJsPop101","popjs.init","-0x","closeMyAd","smrtSP","adblockSuspected","nextFunction","250","xRds","cRAds","myTimer","1500","advertising","countdown","tiPopAction","rmVideoPlay","r3H4","disasterpingu","document.querySelectorAll","AdservingModule","backRedirect","adv_pre_duration","adv_post_duration","/^(click|mousedown|mousemove|touchstart|touchend|touchmove)/","system.popunder","ab1","ab2","hidekeep","pp12","__Y","App.views.adsView.adblock","document.createEvent","ShowAdbblock","style","clientHeight","flashvars.adv_pause_html","/^(?:click|mousedown|mousemove|touchstart|touchend|touchmove)$/","BOOTLOADER_LOADED","PerformanceLongTaskTiming","proxyLocation","Int32Array","$.fx.off","popMagic.init","/DOMContentLoaded|load/","y.readyState","document.getElementsByTagName","smrtSB","href","#opfk","byepopup","awm","location","adBlockEnabled","getCookie","history.go","dataPopUnder","/error|canplay/","(t)","EPeventFire","additional_src","300","____POP","openx","is_noadblock","window.location","()","hblocked","AdBlockUtil","css_class.show","/adbl/i","CANG","DOMContentLoaded","adlinkfly","updato-overlay","innerText","/amazon-adsystem|example\\.com/","document.cookie","|","attr","scriptSrc","SmartWallSDK","segs_pop","alert","8000","cxStartDetectionProcess","Abd_Detector","counter","paywallWrapper","isAdBlocked","/enthusiastgaming|googleoptimize|googletagmanager/","css_class","ez","path","*.adserverDomain","10","$getWin","/doubleclick|googlesyndication/","__NEXT_DATA__.props.clientConfigSettings.videoAds","blockAds","_ctrl_vt.blocked.ad_script","registerSlideshowAd","50","debugger","mm","shortener","require","/^(?!.*(einthusan\\.io|yahoo|rtnotif|ajax|quantcast|bugsnag))/","caca","getUrlParameter","trigger","Ok","given","getScriptFromCss","method:HEAD","safelink.adblock","goafricaSplashScreenAd","try","/adnxs.com|onetag-sys.com|teads.tv|google-analytics.com|rubiconproject.com|casalemedia.com/","openPopunder","0x","xhr.prototype.realSend","initializeCourier","userAgent","_0xbeb9","1800","popAdsClickCount","redirectPage","adblocker","ad_","azar","Pop","_wm","flashvars.adv_pre_url","flashvars.protect_block","flashvars.video_click_url","popunderSetup","https","popunder","preventExit","hilltop","jsPopunder","vglnk","aadblock","S9tt","popUpUrl","Notification","srcdoc","iframe","readCookieDelit","trafficjunky","checked","input#chkIsAdd","adSSetup","adblockerModal","750","adBlock","spoof","html","capapubli","Aloader.serve","mouseup","sp_ad","app_vars.force_disable_adblock","adsHeight","onmousemove","button","yuidea-","adsBlocked","_sp_.msg.displayMessage","pop_under","location.href","_0x32d5","url","blur","CaptchmeState.adb","glxopen","adverts-top-container","disable","200","/googlesyndication|outbrain/","CekAab","timeLeft","testadblock","document.addEventListener","google_ad_client","UhasAB","adbackDebug","googletag","performance","rbm_block_active","adNotificationDetected","SubmitDownload1","show()","user=null","getIfc","!bergblock","overlayBtn","adBlockRunning","Date","htaUrl","_pop","n.trigger","CnnXt.Event.fire","_ti_update_user","&nbsp","document.body.appendChild","BetterJsPop","/.?/","vastAds","setExoCookie","adblockDetected","frg","abDetected","target","I833","urls","urls.0","Object.assign","KeepOpeningPops","bindall","ad_block","time","KillAdBlock","read_cookie","ReviveBannerInterstitial","eval","GNCA_Ad_Support","checkAdBlocker","midRoll","adBlocked","Date.now","AdBlock","iframeTestTimeMS","runInIframe","deployads","='\\x","Debugger","stackDepth:3","warning","100","_checkBait","[href*=\"ccbill\"]","close_screen","onerror","dismissAdBlock","VMG.Components.Adblock","adblock_popup","FuckAdBlock","isAdEnabled","promo","_0x311a","mockingbird","adblockDetector","crakPopInParams","console.log","hasPoped","Math.round","h1mm.w3","banner","google_jobrunner","blocker_div","onscroll","keep-ads","#rbm_block_active","checkAdblock","checkAds","#DontBloxMyAdZ","#pageWrapper","adpbtest","initDetection","check","isBlanketFound","showModal","myaabpfun","sec","/chp_?ad/","adFilled","//","NativeAd","gadb","damoh.ani-stream.com","showPopup","mouseout","clientWidth","adrecover","checkadBlock","gandalfads","Tool","clientSide.adbDetect","HTMLAnchorElement.prototype.click","anchor.href","cmnnrunads","downloadJSAtOnload","run","ReactAds","phtData","adBlocker","StileApp.somecontrols.adBlockDetected","killAdBlock","innerHTML","google_tag_data","readyplayer","noAdBlock","autoRecov","adblockblock","popit","popstate","noPop","Ha","rid","[onclick^=\"window.open\"]","tick","spot","adsOk","adBlockChecker","_$","12345","flashvars.popunder_url","urlForPopup","isal","/innerHTML|AdBlock/","checkStopBlock","overlay","popad","!za.gl","document.hidden","adblockEnabled","ppu","adspot_top","is_adblocked","/offsetHeight|google|Global/","an_message","Adblocker","pogo.intermission.staticAdIntermissionPeriod","localStorage","timeoutChecker","t","my_pop","nombre_dominio",".height","!?safelink_redirect=","document.documentElement","break;case $.","time.html","block_detected","/^(?:mousedown|mouseup)$/","ckaduMobilePop","tieneAdblock","popundr","obj","ujsmediatags method:HEAD","adsAreBlocked","spr","document.oncontextmenu","document.onmousedown","document.onkeydown","compupaste","redirectURL","bait","!atomtt","TID","!/download\\/|link/","Math.pow","adsanity_ad_block_vars","pace","ai_adb","openInNewTab",".append","!!{});","runAdBlocker","setOCookie","document.getElementsByClassName","td_ad_background_click_link","initBCPopunder","flashvars.logo_url","flashvars.logo_text","nlf.custom.userCapabilities","displayCookieWallBanner","adblockinfo","JSON","pum-open","svonm","#clickfakeplayer","/\\/VisitorAPI\\.js|\\/AppMeasurement\\.js/","popjs","/adblock/i","count","LoadThisScript","showPremLite","closeBlockerModal","detector_launch","5","keydown","Popunder","ag_adBlockerDetected","document.head.appendChild","bait.css","Date.prototype.toGMTString","initPu","jsUnda","ABD","adBlockDetector.isEnabled","adtoniq","__esModule","break","myFunction_ads","areAdsDisplayed","gkAdsWerbung","pop_target","onLoadEvent","is_banner","/googlesyndication|inklinkor|ads\\/load/","inklinkor.com","$easyadvtblock","mfbDetect","!/^https:\\/\\/sendvid\\.com\\/[0-9a-z]+$/","Pub2a","length:2001","block","console","send","ab_cl","V4ss","popunders","visibility","aclib","show_dfp_preroll","show_youtube_preroll","brave_load_popup","pageParams.dispAds","PrivateMode","scroll","document.bridCanRunAds","doads","pu","MessageChannel","advads_passive_ads","tmohentai","pmc_admanager.show_interrupt_ads","ai_adb_overlay","AlobaidiDetectAdBlock","showMsgAb","Advertisement","type","input[value^=\"http\"]","wutimeBotPattern","adsbytrafficjunkycontext","abp1","$REACTBASE_STATE.serverModules.push","popup_ads","ipod","pr_okvalida","scriptwz_url","enlace","Popup","$.ajax","appendChild","Exoloader","offsetWidth","zomap.de","/$|adBlock/","adblockerpopup","adblockCheck","checkVPN","cancelAdBlocker","Promise","setNptTechAdblockerCookie","for-variations","!api?call=","cnbc.canShowAds","ExoSupport","/^(?:click|mousedown|mouseup)$/","di()","getElementById","loadRunative","value.media.ad_breaks","onAdVideoStart","zonefile","pwparams","fuckAdBlock","firefaucet","unescape","uas","mark","stop-scrolling","detectAdBlock","Adv","blockUI","adsafeprotected","'\\'","oncontextmenu","Base64","disableItToContinue","google","parcelRequire","mdpDeBlocker","flashvars.adv_start_html","mobilePop","/_0x|debug/","my_inter_listen","EviPopunder","adver","tcpusher","preadvercb","document.readyState","prerollMain","popping","base64_decode","adsrefresh","/ai_adb|_0x/","canRunAds",".submit","mdp_deblocker","bi()","#divDownload","modal","dclm_ajax_var.disclaimer_redirect_url","$ADP","load_pop_power","MG2Loader","/SplashScreen|BannerAd/","Connext","break;","checkTarget","i--","Time_Start","blocker","adUnits","afs_ads","b2a","data.[].vast_url","deleted","MutationObserver","ezstandalone.enabled","damoh","foundation.adPlayer.bitmovin","homad-global-configs","weltConfig.switches.videoAdBlockBlocker","XMLHttpRequest.prototype.open","svonm.com","/\"enabled\":\\s*true/","\"enabled\":false","adReinsertion","window.__gv_org_tfa","Object.prototype.adReinsertion","getHomadConfig","timeupdate","testhide","getComputedStyle","blocked","doOnce","popi","googlefc","angular","detected","{r()","!/ytmp3|dropbox/","450","ab","go_popup","Debug","offsetHeight","length","noBlocker","/youboranqs01|spotx|springserve/","js-btn-skip","r()","adblockActivated","penci_adlbock","Number.isNaN","fabActive","gWkbAdVert","noblock","wgAffiliateEnabled","!gdrivedownload","document.onclick","daCheckManager","prompt","data-popunder-url","saveLastEvent","friendlyduck",".post.movies","purple_box","detectAdblock","adblockDetect","adsLoadable","allclick_Public","a#clickfakeplayer",".fake_player > [href][target]",".link","'\\x","initAdserver","splashpage.init","window[_0x","checkSiteNormalLoad","/blob|injectedScript/","ASSetCookieAds","___tp","STREAM_CONFIGS",".clickbutton","Detected","XF","hide","mdp",".test","backgroundBanner","interstitial","letShowAds","antiblock","ulp_noadb",".show","url:!luscious.net","Object.prototype.adblock_detected","timeSec","afterOpen","AffiliateAdBlock",".appendChild","adsbygoogle.loaded","ads_unblocked","xxSetting.adBlockerDetection","ppload","RegAdBlocking","a.adm","checkABlockP","Drupal.behaviors.adBlockerPopup","ADBLOCK","fake_ad","samOverlay","!refine?search","native","koddostu_com_adblock_yok","player.ads.cuePoints","adthrive","!t.me","bADBlock","better_ads_adblock","tie","Adv_ab","ignore_adblock","$.prototype.offset","ea.add","ad_pods.0.ads.0.segments.0.media ad_pods.1.ads.1.segments.1.media ad_pods.2.ads.2.segments.2.media ad_pods.3.ads.3.segments.3.media ad_pods.4.ads.4.segments.4.media ad_pods.5.ads.5.segments.5.media ad_pods.6.ads.6.segments.6.media ad_pods.7.ads.7.segments.7.media ad_pods.8.ads.8.segments.8.media","mouseleave","NativeDisplayAdID","contador","Light.Popup.create","t()","zendplace","mouseover","event.triggered","_cpp","sgpbCanRunAds","pareAdblock","ppcnt","data-ppcnt_ads","main[onclick]","Blocker","AdBDetected","document.activeElement","{ \"value\": {\"tagName\": \"IFRAME\" }}","runAt","2","clickCount","body","hasFocus","{\"value\": \"Mozilla/5.0 (iPhone14,3; U; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/602.1.50 (KHTML, like Gecko) Version/10.0 Mobile/19A346 Safari/602.1\"}","getlink","/wpsafe|wait/","timer","/getElementById|gotoo/","navigator.brave","tid","ppuQnty","stopCountdown","web_share_ads_adsterra_config wap_short_link_middle_page_ad wap_short_link_middle_page_show_time data.ads_cpm_info","value","Object.prototype.isAllAdClose","DOMNodeRemoved","data.meta.require_addon data.meta.require_captcha data.meta.require_notifications data.meta.require_og_ads data.meta.require_video data.meta.require_web data.meta.require_related_topics data.meta.require_custom_ad_step data.meta.og_ads_offers data.meta.addon_url data.displayAds data.linkCustomAdOffers","data.getDetailPageContent.linkCustomAdOffers.[-].title","data.getTaboolaAds.*","/adblock|isRequestPresent/","bmcdn6","window.onload","devtools","documentElement.innerHTML","{\"type\": \"opaque\"}","document.hasFocus","/adoto|\\/ads\\/js/","htmls","?key=","isRequestPresent","xmlhttp","data-ppcnt_ads|onclick","#main","#main[onclick*=\"mainClick\"]",".btn-success.get-link","fouty","disabled",".btn-primary","focusOut","googletagmanager","shortcut","suaads","/\\$\\('|ai-close/","/handleClick|popup/","navigator","FingerprintJS","a[target=\"_blank\"][style]","bypass",".MyAd > a[target=\"_blank\"]","antiAdBlockerHandler","onScriptError","php","AdbModel","protection","div_form","private","navigator.webkitTemporaryStorage.queryUsageAndQuota","contextmenu","visibilitychange","remainingSeconds","0.1","Math.random() <= 0.15","checkBrowser","bypass_url","1600","class","#rtg-snp21","adsby","showadas","submit","validateForm","throwFunc","/pagead2\\.googlesyndication\\.com|inklinkor\\.com/","EventTarget.prototype.addEventListener","delete window","/countdown--|getElementById/","SMart1","/counter|wait/","tempat.org","doTest","checkAdsBlocked",".btn","interval","!buzzheavier.com","1e3*","/veepteero|tag\\.min\\.js/","aSl.gcd","/\\/4.+ _0/","chp_ad","document.documentElement.lang.toLowerCase","[onclick^=\"pop\"]","Light.Popup","maxclick","#get-link-button","Swal.fire","surfe.pro","czilladx","adsbygoogle.js","!devuploads.com","war:googlesyndication_adsbygoogle.js","window.adLink","google_srt","json:0.61234","checkAdBlock","shouldOpenPopUp","displayAdBlockerMessage","pastepc","detectedAdblock","isTabActive","a[target=\"_blank\"]","[href*=\"survey\"]","adForm","/adsbygoogle|googletagservices/","clicked","notifyExec","fairAdblock","data.value data.redirectUrl data.bannerUrl","/admin/settings","!gcloud","script[data-domain=","push",".call(null)","ov.advertising.tisoomi.loadScript","abp","userHasAdblocker","embedAddefend","/injectedScript.*inlineScript/","/(?=.*onerror)(?=^(?!.*(https)))/","/injectedScript|blob/","hommy.mutation.mutation","hommy","hommy.waitUntil","ACtMan","video.channel","/(www\\.[a-z]{8,16}\\.com|cloudfront\\.net)\\/.+\\.(css|js)$/","/popundersPerIP[\\s\\S]*?Date[\\s\\S]*?getElementsByTagName[\\s\\S]*?insertBefore/","/www|cloudfront/","shouldShow","matchMedia","target.appendChild(s","l.appendChild(s)","/^data:/","Document.prototype.createElement","\"script\"","litespeed/js","myEl","ExoDetector","!embedy","Pub2","/loadMomoVip|loadExo|includeSpecial/","loadNeverBlock","flashvars.mlogo","adver.abFucker.serve","displayCache","vpPrerollVideo","SpecialUp","zfgloaded","parseInt","/btoa|break/","/\\st\\.[a-zA-Z]*\\s/","/(?=^(?!.*(https)))/","key in document","zfgformats","zfgstorage","zfgloadedpopup","/\\st\\.[a-zA-Z]*\\sinlineScript/","zfgcodeloaded","outbrain","/inlineScript|stackDepth:1/","wpadmngr.com","adserverDomain",".js?_=","/https|stackDepth:3/","HTMLAllCollection","shown_at","!/d/","PlayerConfig.config.CustomAdSetting","affiliate","_createCatchAllDiv","/click|mouse/","document","PlayerConfig.trusted","PlayerConfig.config.AffiliateAdViewLevel","3","univresalP","puTSstrpcht","!/prcf.fiyar|themes|pixsense|.jpg/","hold_click","focus","js_func_decode_base_64","/(?=^(?!.*(https|injectedScript)))/","jQuery.popunder","\"/chp_?ad/\"","AdDetect","ai_front","abDetectorPro","/googlesyndication|doubleclick/","{\"type\": \"cors\"}","src=atob","\"/[0-9a-f]+-modal/\"","/\\/[0-9a-f]+\\.js\\?ver=/","tie.ad_blocker_detector","admiral","__cmpGdprAppliesGlobally","..admiralScriptCode",".props[?.id==\"admiral-bootstrap\"].dangerouslySetInnerHTML","error","gnt.x.uam","interactive","g$.hp","json:{\"gnt-d-adm\":true,\"gnt-d-bt\":true}","gnt.u.z","__INITIAL_DATA__.siteData.admiralScript",".cmd.unshift","/ad\\.doubleclick\\.net|static\\.dable\\.io/","error-report.com","loader.min.js","content-loader.com","()=>","HTMLScriptElement.prototype.setAttribute","error-report","ads.adthrive.com","objAd.loadAdShield","window.myAd.runAd","RT-1562-AdShield-script-on-Huffpost","{\"value\": \"(function(){let link=document.createElement('link');link.rel='stylesheet';link.href='//image.ygosu.com/style/main.css';document.head.appendChild(link)})()\"}","{\"value\": \"(function(){let link=document.createElement('link');link.rel='stylesheet';link.href='https://loawa.com/assets/css/loawa.min.css';document.head.appendChild(link)})()\"}","/07c225f3\\.online|content-loader\\.com|css-load\\.com|html-load\\.com/","html-load.com","\"data-sdk\"","abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789+/=","AHE.is_member","USER.features.ad_shield","AppBootstrapData.config.adshieldAdblockRecovery","AppState.reduxState.features.adshieldAdblockRecovery","..adshieldAdblockRecovery=false","/fetchappbootstrapdata","HTMLScriptElement.prototype.onload","__INITIAL_STATE__.config.theme.ads.isAdBlockerEnabled","generalTimeLeft","__INITIAL_STATE__.gameLists.gamesNoPrerollIds.indexOf","DoodPop","__aaZoneid","#over","document.ontouchend","Array.prototype.shift","/^.+$/s","HTMLElement.prototype.click","premium","'1'","playID","openNewTab","download-wrapper","MDCore.adblock","Please wait","pop_init","adsbyjuicy","prerolls midrolls postrolls comm_ad house_ad pause_ad block_ad end_ad exit_ad pin_ad content_pool vertical_ad elements","/detail","adClosedTimestamp","data.item.[-].business_info.ad_desc","/feed/rcmd","killads","NMAFMediaPlayerController.vastManager.vastShown","reklama-flash-body","fakeAd","adUrl",".azurewebsites.net","assets.preroll assets.prerollDebug","/stream-link","/doubleclick|ad-delivery|googlesyndication/","__NEXT_DATA__.runtimeConfig._qub_sdk.qubConfig.video.adBlockerDetectorEnabled","Object.prototype.advertising","data.[].relationships.advert data.[].relationships.vast","offers","tampilkanUrl",".layers.*[?.metadata.name==\"POI_Ads\"]","/PCWeb_Real.json","/gaid=","war:noop-vast2.xml","consent","arePiratesOnBoard","__INIT_CONFIG__.randvar","instanceof Event","await _0x","json:\"Blog1\"","ad-top","adblock.js","adbl",".getComputedStyle","STORAGE2","app_advert","googletag._loaded_","closeBanner","NoTenia","vast popup adblock",".offsetHeight","!asyaanimeleri.",".*[?.linkurl^=\"http\"]","initPop","app._data.ads","message","adsense","reklamlar","json:[{\"sure\":\"0\"}]","/api/video","skipAdblockCheck","/srvtrck|adligature|quantserve|outbrain/","createAgeModal","Object[_0x","adsPlayer","pubAdsService","offsetLeft","config.pauseInspect","appContext.adManager.context.current.adFriendly","HTMLIFrameElement",".style","dsanity_ad_block_vars","show_download_links","downloadbtn","height","blockAdBlock._options.baitClass","/AdBlock/i","charAt","fadeIn","checkAD","latest!==","detectAdBlocker","#downloadvideo",".ready","/'shift'|break;/","document.blocked_var","____ads_js_blocked","wIsAdBlocked","WebSite.plsDisableAdBlock","css","videootv","ads_blocked","samDetected","Drupal.behaviors.agBlockAdBlock","NoAdBlock","mMCheckAgainBlock","countClicks","settings.adBlockerDetection","eabdModal","ab_root.show","gaData","wrapfabtest","fuckAdBlock._options.baitClass","$ado","/ado/i","app.js","popUnderStage","samAdBlockAction","googlebot","advert","bscheck.adblocker","qpcheck.ads","tmnramp","!sf-converter.com","clickAds.banner.urls","json:[{\"url\":{\"limit\":0,\"url\":\"\"}}]","ad","show_ads","ignielAdBlock","isContentBlocked","GetWindowHeight","/pop|wm|forceClick/","CloudflareApps.installs.Ik7rmQ4t95Qk.options.measureDomain","detectAB1",".init","ActiveXObject","uBlockOriginDetected","/_0x|localStorage\\.getItem/","google_ad_status","googletag._vars_","googletag._loadStarted_","google_unique_id","google.javascript","google.javascript.ads","google_global_correlator","ads.servers.[].apiAddress","paywallGateway.truncateContent","Constant","u_cfg","adBlockDisabled","__NEXT_DATA__.props.pageProps.adVideo","blockedElement","/ad","onpopstate","popState","adthrive.config","breaks interstitials info","interstitials","xpath(//*[name()=\"Period\"][.//*[name()=\"AdaptationSet\"][@contentType=\"video\"][not(@bitstreamSwitching=\"true\")]])",".mpd","ad_slots","plugins.dfp","lura.live/prod/","/prog.m3u8","__C","ad-block-popup","exitTimer","innerHTML.replace","ajax","abu","countDown","HTMLElement.prototype.insertAdjacentHTML","_ads","eabpDialog","TotemToolsObject","puHref","flashvars.adv_postpause_vast","/Adblock|_ad_/","advads_passive_groups","GLX_GLOBAL_UUID_RESULT","f.parentNode.removeChild(f)","swal","keepChecking","t.pt","clickAnywhere urls","a[href*=\"/ads.php\"][target=\"_blank\"]","xv_ad_block","()=>{","nitroAds","class.scroll","/showModal|isBlanketFound/","disableDeveloperTools","[onclick*=\"window.open\"]","openWindow","Check","checkCookieClick","readyToVote","12000","target|href","a[href^=\"//\"]","wpsite_clickable_data","insertBefore","offsetParent","meta.advertise","next","vidorev_jav_plugin_video_ads_object.vid_ads_m_video_ads","data.attributes.config.freewheel data.attributes.config.featureFlags.dPlayer","data.attributes.ssaiInfo.forecastTimeline data.attributes.ssaiInfo.vendorAttributes.nonLinearAds data.attributes.ssaiInfo.vendorAttributes.videoView data.attributes.ssaiInfo.vendorAttributes.breaks.[].ads.[].adMetadata data.attributes.ssaiInfo.vendorAttributes.breaks.[].ads.[].adParameters data.attributes.ssaiInfo.vendorAttributes.breaks.[].timeOffset","xpath(//*[name()=\"MPD\"][.//*[name()=\"BaseURL\" and contains(text(),'dash_clear_fmp4') and contains(text(),'/a/')]]/@mediaPresentationDuration | //*[name()=\"Period\"][./*[name()=\"BaseURL\" and contains(text(),'dash_clear_fmp4') and contains(text(),'/a/')]])","ssaiInfo","adsProvider.init","SDKLoaded","css_class.scroll","mnpwclone","0.3","7000","[href*=\"nihonjav\"]","/null|Error/","bannersRequest","vads","a[href][onclick^=\"getFullStory\"]","!newdmn","popUp","devtoolschange","rccbase_styles","POPUNDER_ENABLED","plugins.preroll","DHAntiAdBlocker","/out.php","ishop_codes","#advVid","location.replace","showada","showax","adp","__tnt","compatibility","popundrCheck","history.replaceState","rexxx.swp","constructor","p18","clickHandler","onbeforeunload","window.location.href","prebid","asc","json:{\"cmd\": [null], \"que\": [null], \"wrapperVersion\": \"6.19.0\", \"refreshQue\": {\"waitDelay\": 3000, \"que\": []}, \"isLoaded\": true, \"bidderSettings\": {}, \"libLoaded\": true, \"version\": \"v9.20.0\", \"installedModules\": [], \"adUnits\": [], \"aliasRegistry\": {}, \"medianetGlobals\": {}}","google_tag_manager","json:{ \"G-Z8CH48V654\": { \"_spx\": false, \"bootstrap\": 1704067200000, \"dataLayer\": { \"name\": \"dataLayer\" } }, \"SANDBOXED_JS_SEMAPHORE\": 0, \"dataLayer\": { \"gtmDom\": true, \"gtmLoad\": true, \"subscribers\": 1 }, \"sequence\": 1 }","ADBLOCKED","Object.prototype.adsEnabled","removeChild","ai_run_scripts","clearInterval(i)","marginheight","ospen","pu_count","mypop","adblock_use","Object.prototype.adblockFound","download","1100","createCanvas","bizpanda","Q433","/pop|_blank/","movie.advertising.ad_server playlist.movie.advertising.ad_server","unblocker","playerAdSettings.adLink","playerAdSettings.waitTime","computed","manager","window.location.href=link","moonicorn.network","/dyn\\.ads|loadAdsDelayed/","xv.sda.pp.init","onreadystatechange","skmedix.com","skmedix.pl","MediaContainer.Metadata.[].Ad","doubleclick.com","opaque","_init","href|target|data-ipshover-target|data-ipshover|data-autolink|rel","a[href^=\"https://thumpertalk.com/link/click/\"][target=\"_blank\"]","/touchstart|mousedown|click/","latest","secs","event.simulate","isAdsLoaded","adblockerAlert","/^https?:\\/\\/redirector\\.googlevideo\\.com.*/","/.*m3u8/","cuepoints","cuepoints.[].start cuepoints.[].end cuepoints.[].start_float cuepoints.[].end_float","Period[id*=\"-roll-\"][id*=\"-ad-\"]","pubads.g.doubleclick.net/ondemand","/ads/banner","reachGoal","Element.prototype.attachShadow","Adb","randStr","SPHMoverlay","#continue","ai","timer.remove","popupBlocker","afScript","Object.prototype.parseXML","Object.prototype.blackscreenDuration","Object.prototype.adPlayerId","/ads",":visible","mMcreateCookie","downloadButton","SmartPopunder.make","readystatechange","document.removeEventListener",".button[href^=\"javascript\"]","animation","status","adsblock","pub.network","timePassed","timeleft","input[id=\"button1\"][class=\"btn btn-primary\"][disabled]","t(a)",".fadeIn()","result","evolokParams.adblock","[src*=\"SPOT\"]","asap stay",".pageProps.__APOLLO_STATE__.*[?.__typename==\"AotSidebar\"]","/_next/data","pageProps.__TEMPLATE_QUERY_DATA__.aotFooterWidgets","props.pageProps.data.aotHomepageTopBar props.pageProps.data.aotHomepageTopBar props.pageProps.data.aotHeaderAdScripts props.pageProps.data.aotFooterWidgets","counter--","daadb","l-1","_htas","/width|innerHTML/","magnificPopup","skipOptions","method:HEAD url:doubleclick.net","style.display","tvid.in/log","1150","0.5","testadtags ad","document.referrer","quadsOptions","history.pushState","loadjscssfile","load_ads","/debugger|offsetParent/","/ads|imasdk/","6","__NEXT_DATA__.props.pageProps.adsConfig","make_rand_div","new_config.timedown","catch","google_ad","response.timeline.elements.[-].advertiserId","url:/api/v2/tabs/for_you","timercounter","document.location","innerHeight","cainPopUp","#timer","!bowfile.com","cloudfront.net/?","href|target|data-onclick","a[id=\"dl\"][data-onclick^=\"window.open\"]","a.getAttribute(\"data-ad-client\")||\"\"","truex","truex.client","answers","!display","/nerveheels/","No","foreverJQ","/document.createElement|stackDepth:2/","container.innerHTML","top-right","hiddenProxyDetected","SteadyWidgetSettings.adblockActive","temp","inhumanity_pop_var_name","url:googlesyndication","enforceAdStatus","app_vars.please_disable_adblock","hashchange","history.back","starPop","Element.prototype.matches","litespeed","__PoSettings","HTMLSelectElement","youtube","aTagChange","Object.prototype.ads","display","a[onclick^=\"setTimeout\"]","detectBlockAds","eb","/analytics|livestats/","/nextFunction|2000/","resource_response.data.[-].pin_promotion_id resource_response.data.results.[-].pin_promotion_id","initialReduxState.pins.{-}.pin_promotion_id initialReduxState.resources.UserHomefeedResource.*.data.[-].pin_promotion_id","player","mahimeta","__htas","chp_adblock_browser","/adb/i","tdBlock",".t-out-span [href*=\"utm_source\"]","src",".t-out-span [src*=\".gif\"]","notifier","penciBlocksArray",".panel-body > .text-center > button","modal-window","isScrexed","fallbackAds","popurl","SF.adblock","() => n(t)","() => t()","startfrom","Math.imul","checkAdsStatus","wtg-ads","/ad-","void 0","/__ez|window.location.href/","D4zz","Object.prototype.ads.nopreroll_",").show()","function","/open.*_blank/","advanced_ads_ready","loadAdBlocker","HP_Scout.adBlocked","SD_IS_BLOCKING","isBlocking","adFreePopup","Object.prototype.isPremium","__BACKPLANE_API__.renderOptions.showAdBlock",".quiver-cam-player--ad-not-running.quiver-cam-player--free video","debug","Object.prototype.isNoAds","tv3Cmp.ConsentGiven","distance","site-access","chAdblock","/,ad\\n.+?(?=#UPLYNK-SEGMENT)/gm","/uplynk\\.com\\/.*?\\.m3u8/","remaining","/ads|doubleclick/","/Ads|adbl|offsetHeight/",".innerHTML","onmousedown",".ob-dynamic-rec-link","setupSkin","/app.js","dqst.pl","PvVideoSlider","_chjeuHenj","[].data.searchResults.listings.[-].targetingSegments","noConflict","preroll_helper.advs","/show|innerHTML/","create_ad","Object.prototype.enableInterstitial","addAds","/show|document\\.createElement/","loadXMLDoc","register","MobileInGameGames","POSTPART_prototype.ADKEY","__osw","uniconsent.com","/coinzillatag|czilladx/","divWidth","Script_Manager","Script_Manager_Time","bullads","Msg","!download","/click|mousedown/","/\\.fadeIn|\\.show\\(.?\\)/","adjsData","AdService.info.abd","UABP","adBlockDetectionResult","popped","/xlirdr|hotplay\\-games|hyenadata/","document.body.insertAdjacentHTML","exo","tic","download_loading","pu_url","Click","afStorage","puShown1","onAdblockerDetected","htmlAds","second","lycos_ad","150","passthetest","checkBlock","/thaudray\\.com|putchumt\\.com/","popName","vlitag","asgPopScript","/(?=^(?!.*(jquery|turnstile|challenge-platform)))/","Object.prototype.loadCosplay","Object.prototype.loadImages","FMPoopS","/window\\['(?:\\\\x[0-9a-f]{2}){2}/","urls.length","updatePercentage","importantFunc","console.warn","sam","current()","confirm","pandaAdviewValidate","showAdBlock","aaaaa-modal","setCookie","/(?=^(?!.*(http)))/","$onet","adsRedirectPopups","canGetAds","length:11000","goToURL","ad_blocker_active","init_welcome_ad","setinteracted",".MediaStep","data.xdt_injected_story_units.ad_media_items","dataLayer","document.body.contains","nothingCanStopMeShowThisMessage","window.focus","imasdk","TextEncoder.prototype.encode","!/^\\//","fakeElement","adEnable","ssaiInfo fallback.ssaiInfo","adtech-brightline adtech-google-pal adtech-iab-om","/playbackInfo","xpath(//*[name()=\"MPD\"]/@mediaPresentationDuration | //*[name()=\"Period\"]/@start | //*[name()=\"Period\"][not(.//*[name()=\"SegmentTimeline\"])][not(.//*[name()=\"ContentProtection\"])] | //*[name()=\"Period\"][./*[name()=\"BaseURL\"]][not(.//*[name()=\"ContentProtection\"])])","/-vod-.+\\.mpd/","htmlSectionsEncoded","event.dispatch","adx","popupurls","/(?=^(?!.*(https|Parse|Image)))/","displayAds","cls_report?","-0x1","childNodes","wbar","[href=\"/bestporn.html\"]","_adshrink.skiptime","gclid","event","!yt1d.com","button#getlink","button#gotolink","AbleToRunAds","PreRollAd.timeCounter","result.ads","tpc.googlesyndication.com","id","#div-gpt-ad-footer","#div-gpt-ad-pagebottom","#div-gpt-ad-relatedbottom-1","#div-gpt-ad-sidebottom","goog","document.body",".downloadbtn","abpblocked","p$00a",".data?","openAdsModal","paAddUnit","gloacmug.net","items.[-].potentialActions.0.object.impressionToken items.[-].hasPart.0.potentialActions.0.object.impressionToken","context.adsIncluded","refresh","adt","Array.prototype.indexOf","interactionCount","/cloudfront|thaudray\\.com/","test_adblock","vastEnabled","/adskeeper|cloudflare/","#gotolink","detectadsbocker","c325","two_worker_data_js.js","adobeModalTestABenabled","FEATURE_DISABLE_ADOBE_POPUP_BY_COUNTRY","questpassGuard","isAdBlockerEnabled","shortConfig","akadb","eazy_ad_unblocker","json:\"\"","unlock","adswizz.com","document.onkeypress","adsSrc","sssp","emptyObj","[style*=\"background-image: url\"]","[href*=\"click?\"]","/freychang|passback|popunder|tag|banquetunarmedgrater/","google-analytics","myTestAd","/<VAST version.+VAST>/","<VAST version=\\\"4.0\\\"></VAST>","deezer.getAudiobreak","Ads","smartLoaded","..ads_audio=false","ShowAdBLockerNotice","ad_listener","!shrdsk","notify","AdB","push-allow-modal",".hide","(!0)","Delay","ima","adSession","Cookiebot","\"adsBlocked\"","/appendChild|e\\(\"/","=>","stream.insertion.adSession stream.insertion.points stream.insertion stream.sources.*.insertion pods.0.ads","ads.metadata ads.document ads.dxc ads.live ads.vod","site-access-popup","*.tanya_video_ads","deblocker","data?","script.src","/#EXT-X-DISCONTINUITY.{1,100}#EXT-X-DISCONTINUITY/gm","mixed.m3u8","feature_flags.interstitial_ads_flag","feature_flags.interstitials_every_four_slides","?","downloadToken","waldoSlotIds","Uint8Array","redirectpage","13500","adblockstatus","adScriptLoaded","/adoto|googlesyndication/","props.sponsoredAlternative","np.detect","ad-delivery","document.documentElement.lang","adSettings","banner_is_blocked","consoleLoaded?clearInterval","Object.keys","[?.context.bidRequestId].*","RegExp.prototype.test","json:\"wirtualnemedia\"","/^dobreprogramy$/","decodeURL","updateProgress","/salesPopup|mira-snackbar/","Object.prototype.adBlocked","DOMAssistant","rotator","adblock popup vast","detectImgLoad","killAdKiller","current-=1","/zefoy\\.com\\S+:3:1/",".clientHeight","googleAd","/showModal|chooseAction|doAction|callbackAdsBlocked/","cpmecs","/adlink/i","[onload^=\"window.open\"]","dontask","aoAdBlockDetected","button[onclick^=\"window.open\"]","function(e)","touchstart","Brid.A9.prototype.backfillAdUnits","adlinkfly_url","siteAccessFlag","/adblocker|alert/","doubleclick.net/instream/ad_status.js","war:doubleclick_instream_ad_status.js","redURL","/children\\('ins'\\)|Adblock|adsbygoogle/","dct","slideShow.displayInterstitial","openPopup","Object.getPrototypeOf","plugins","ai_wait_for_jquery","pbjs","tOS2","ips","Error","/stackDepth:1\\s/","tryShowVideoAdAsync","chkADB","onDetected","detectAdblocker","document.ready","a[href*=\"torrentico.top/sim/go.php\"]","success.page.spaces.player.widget_wrappers.[].widget.data.intervention_data","VAST","{\"value\": \"Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Mobile/15E148 Safari/604.1\"}","navigator.standalone","navigator.platform","{\"value\": \"iPhone\"}","Storage.prototype.setItem","searchCount","empire.pop","empire.direct","empire.directHideAds","json:\"click\"","(!1)","pagead2.googlesyndication.com","empire.mediaData.advisorMovie","empire.mediaData.advisorSerie","fuckadb","[type=\"submit\"]","setTimer","auto_safelink","!abyss.to","daadb_get_data_fetch","penci_adlbock.ad_blocker_detector","siteAccessPopup","/adsbygoogle|adblock|innerHTML|setTimeout/","/innerHTML|_0x/","Object.prototype.adblockDetector","biteDisplay","blext","/[a-z]\\(!0\\)/","800","vidorev_jav_plugin_video_ads_object","vidorev_jav_plugin_video_ads_object_post","dai_iframe","popactive","/detectAdBlocker|window.open/","S_Popup","eazy_ad_unblocker_dialog_opener","rabLimit","-1","popUnder","/GoToURL|delay/","nudgeAdBlock","/googlesyndication|ads/","/Content/_AdBlock/AdBlockDetected.html","adBlckActive","AB.html","feedBack.showAffilaePromo","ShowAdvertising","a img:not([src=\"images/main_logo_inverted.png\"])","visible","a[href][target=\"_blank\"],[src^=\"//ad.a-ads.com/\"]","avails","amazonaws.com","ima3_dai","topaz.","FAVE.settings.ads.ssai.prod.clips.enabled","FAVE.settings.ads.ssai.prod.liveAuth.enabled","FAVE.settings.ads.ssai.prod.liveUnauth.enabled","xpath(//*[name()=\"MPD\"]/@mediaPresentationDuration | //*[name()=\"Period\"]/@start | //*[name()=\"Period\"][.//*[name()=\"BaseURL\" and contains(text(),\".prd.media.max.com/\")]])","/sandbox/i","analytics.initialized","autoptimize","UserCustomPop","method:GET","data.reg","time-events","/#EXTINF:[^\\n]+\\nhttps:\\/\\/redirector\\.googlevideo\\.com[^\\n]+/gms","/\\/ondemand\\/.+\\.m3u8/","/redirector\\.googlevideo\\.com\\/videoplayback[\\s\\S]*?dclk_video_ads/",".m3u8","phxSiteConfig.gallery.ads.interstitialFrequency","loadpagecheck","popupAt","modal_blocker","art3m1sItemNames.affiliate-wrapper","\"\"","isOpened","playerResponse.adPlacements playerResponse.playerAds adPlacements playerAds","Array.prototype.find","affinity-qi","GeneratorAds","isAdBlockerActive","pop.doEvent","'shift'","bFired","scrollIncrement","di.app.WebplayerApp.Ads.Adblocks.app.AdBlockDetectApp.startWithParent","a#downloadbtn[onclick^=\"window.open\"]","alink","/ads|googletagmanager/","sharedController.adblockDetector",".redirect","sliding","a[onclick]","infoey","settings.adBlockDetectionEnabled","displayInterstitialAdConfig","response.ads","/api","checkAdBlockeraz","blockingAds","Yii2App.playbackTimeout","setC","popup","/adScriptPath|MMDConfig/","xpath(//*[name()=\"MPD\"]/@mediaPresentationDuration | //*[name()=\"Period\"]/@start | //*[name()=\"Period\"][.//*[name()=\"BaseURL\" and contains(text(),'adease')]])","[media^=\"A_D/\"]","adease adeaseBlob vmap","adease","aab","ips.controller.register","plugins.adService","QiyiPlayerProphetData.a.data","wait","/adsbygoogle|doubleclick/","adBreaks.[].startingOffset adBreaks.[].adBreakDuration adBreaks.[].ads adBreaks.[].startTime adBreak adBreakLocations","/session.json","session.showAds","toggleAdBlockInfo","cachebuster","config","OpenInNewTab_Over","/native|\\{n\\(\\)/","[style^=\"background\"]","[target^=\"_\"]","bodyElement.removeChild","aipAPItag.prerollSkipped","aipAPItag.setPreRollStatus","\"ads_disabled\":false","\"ads_disabled\":true","payments","reklam_1_saniye","reklam_1_gecsaniye","reklamsayisi","reklam_1","psresimler","data","runad","url:doubleclick.net","war:googletagservices_gpt.js","[target=\"_blank\"]","\"flashtalking\"","/(?=^(?!.*(cdn-cgi)))/","criteo","war:32x32.png","HTMLImageElement.prototype.onerror","HTMLImageElement.prototype.onload","sessionStorage","createDecoy","/form\\.submit|urlToOpen/","data.home.home_timeline_urt.instructions.[].entries.[-].content.itemContent.promotedMetadata","url:/Home","data.search_by_raw_query.search_timeline.timeline.instructions.[].entries.[-].content.itemContent.promotedMetadata","url:/SearchTimeline","data.threaded_conversation_with_injections_v2.instructions.[].entries.[-].content.items.[].item.itemContent.promotedMetadata","url:/TweetDetail","data.user.result.timeline_v2.timeline.instructions.[].entries.[-].content.itemContent.promotedMetadata","url:/UserTweets","data.immersiveMedia.timeline.instructions.[].entries.[-].content.itemContent.promotedMetadata","url:/ImmersiveMedia","/\\.php\\b.*_blank/",".[?.media_entities.*.video_info.variants]..url_data.url=\"https://twitter.undefined\"","twitter.undefined","powerAPITag","playerEnhancedConfig.run","rodo.checkIsDidomiConsent","xtime","smartpop","Div_popup","EzoIvent","/doubleclick|googlesyndication|vlitag/","overlays","googleAdUrl","/googlesyndication|nitropay/","uBlockActive","/api/v1/events","Scribd.Blob.AdBlockerModal","AddAdsV2I.addBlock","xpath(//*[name()=\"Period\"][.//*[name()=\"BaseURL\" and contains(text(),'/ad/')]])","/Detect|adblock|style\\.display|\\[native code]|\\.call\\(null\\)/","/google_ad_client/","method:GET url:!/idlix|jwpcdn/","total","popCookie","/0x|sandCheck/","hasAdBlocker","ShouldShow","offset","startDownload","cloudfront","[href*=\"jump\"]","!direct","a0b","/outbrain|criteo|thisiswaldo|media\\.net|ohbayersbur|adligature|quantserve|srvtrck|\\.css|\\.js/","mode:no-cors","2000-5000","contrformpub","data.device.adsParams data.device.adSponsorshipTemplate","url:/appconfig","innerWidth","initials.yld-pdpopunder",".main-wrap","/googlesyndication|googima\\.js/","__brn_private_mode","advertisement3","start","Object.prototype.skipPreroll","/adskeeper|bidgear|googlesyndication|mgid/","fwmrm.net","/\\/ad\\/g\\/1/","adverts.breaks","result.responses.[].response.result.cards.[-].data.offers","ADB","downloadTimer","/ads|google/","injectedScript","/googlesyndication|googletagservices/","DisableDevtool","eClicked","number","sync","PlayerLogic.prototype.detectADB","ads-twitter.com","all","havenclick","VAST > Ad","/tserver","Object.prototype.prerollAds","secure.adnxs.com/ptv","war:noop-vast4.xml","notifyMe","alertmsg","/streams","adsClasses","gsecs","adtagparameter","dvsize","52","removeDLElements","/\\.append|\\.innerHTML|undefined|\\.css|blocker|flex|\\$\\('|obfuscatedMsg/","warn","adc","majorse","completed","testerli","showTrkURL","/popunder/i","document.body.style.backgroundPosition","invoke","ssai_manifest ad_manifest playback_info.ad_info qvt.playback_info.ad_info","Object.prototype.setNeedShowAdblockWarning","load_banner","initializeChecks","HTMLDocument","video-popup","splashPage","adList","adsense-container","detect-modal","/_0x|dtaf/","this","ifmax","adRequest","nads","nitroAds.abp","adinplay.com","onloadUI","war:google-ima.js","/^data:text\\/javascript/","randomNumber","current.children","probeScript","PageLoader.DetectAb","!koyso.","adStatus","popUrl","one_time","PlaybackDetails.[].DaiVod","consentGiven","ad-block","data.searchClassifiedFeed.searchResultView.0.searchResultItemsV2.edges.[-].node.item.content.creative.clickThroughEvent.adsTrackingMetadata.metadata.adRequestId","data.me.personalizedFeed.feedItems.[-].promo.creative.clickThroughUrl.adsTrackingMetadata.metadata.adRequestId","data.me.rhrFeed.feedItems.[-].promo.creative.clickThroughUrl.adsTrackingMetadata.metadata.sponsor","mdpDeblocker","doubleclick.net","BN_CAMPAIGNS","media_place_list","...","/\\{[a-z]\\(!0\\)\\}/","canRedirect","/\\{[a-z]\\(e\\)\\}/","[].data.displayAdsV3.data.[-].__typename","[].data.TopAdsProducts.data.[-].__typename","[].data.topads.data.[-].__typename","/\\{\"id\":\\d{9,11}(?:(?!\"ads\":\\{\"id\":\"\").)+?\"ads\":\\{\"id\":\"\\d+\".+?\"__typename\":\"ProductCarouselV2\"\\},?/g","/graphql/InspirationCarousel","/\\{\"category_id\"(?:(?!\"ads\":\\{\"id\":\"\").)+?\"ads\":\\{\"id\":\"\\d+\".+?\"__typename\":\"ProductCarouselV2\"\\},?/g","/graphql/InspirationalCarousel","/\\{\"id\":\\d{9,11}(?:(?!\"isTopads\":false).)+?\"isTopads\":true.+?\"__typename\":\"recommendationItem\"\\},/g","/\\/graphql\\/productRecommendation/i","/,\\{\"id\":\\d{9,11}(?:(?!\"isTopads\":false).)+?\"isTopads\":true(?:(?!\"__typename\":\"recommendationItem\").)+?\"__typename\":\"recommendationItem\"\\}(?=\\])/","/\\{\"(?:productS|s)lashedPrice\"(?:(?!\"isTopads\":false).)+?\"isTopads\":true.+?\"__typename\":\"recommendationItem\"\\},?/g","/graphql/RecomWidget","/\\{\"appUrl\"(?:(?!\"isTopads\":false).)+?\"isTopads\":true.+?\"__typename\":\"recommendationItem\"\\},?/g","/graphql/ProductRecommendationQuery","adDetails","/secure?","data.search.products.[-].sponsored_ad.ad_source","url:/plp_search_v2?","GEMG.GPT.Interstitial","amiblock","String.prototype.concat","adBlockerDismissed","adBlockerDismissed_","karte3","18","callbackAdsBlocked","stackTrace","sandDetect","json:\"body\"",".ad-zone","showcfkModal","amodule.data","emptyArr","inner-ad","_ET","jssdks.mparticle.com","session.sessionAds session.sessionAdsRequired","/session","getComputedStyle(el)","/(?=^(?!.*(orchestrate|cloudflare)))/","Object.prototype.ADBLOCK_DETECTION",".features.*[?.slug==\"adblock-detection\"].enabled=false","/ad/","/count|verify|isCompleted/","postroll","itemList.[-].ad_info.ad_id","url:api/recommend/item_list/","/adinplay|googlesyndication/","!hidan.sh","ask","interceptClickEvent","isAdBlockDetected","pData.adblockOverlayEnabled","ad_block_detector","attached","div[class=\"share-embed-container\"]","/^\\w{11}[1-9]\\d+\\.ts/","cabdSettings","/outbrain|adligature|quantserve|adligature|srvtrck/","adsConfiguration","/vod","layout.sections.mainContentCollection.components.[].data.productTiles.[-].sponsoredCreative.adGroupId","/search","fp-screen","puURL","!vidhidepre.com","[onclick*=\"_blank\"]","[onclick=\"goToURL();\"]","leaderboardAd","#leaderboardAd","placements.processingFile","dtGonza.playeradstime","\"-1\"","EV.Dab","ablk","malisx","alim","shutterstock.com","sorts.[-].recommendationList.[].contentMetadata.EncryptedAdTrackingData","/ads|chp_?ad/","ads.[-].ad_id","wp-ad","/clarity|googlesyndication/","/aff|jump/","!/mlbbox\\.me|_self/","aclib.runPop","ADS.isBannersEnabled","ADS.STATUS_ERROR","json:\"COMPLETE\"","button[onclick*=\"open\"]","getComputedStyle(testAd)","openPopupForChapter","Object.prototype.popupOpened","src_pop","zigi_tag_id","gifs.[-].cta.link","boosted_gifs","adsbygoogle_ama_fc_has_run","doThePop","thanksgivingdelights","yes.onclick","!vidsrc.","clearTimeout","popundersPerIP","createInvisibleTrigger","jwDefaults.advertising","elimina_profilazione","elimina_pubblicita","snigelweb.com","abd","pum_popups","checkerimg","!/(flashbang\\.sh|dl\\.buzzheavier\\.com)/","!dl.buzzheavier.com","uzivo","openDirectLinkAd","!nikaplayer.com",".adsbygoogle:not(.adsbygoogle-noablate)","json:\"img\"","playlist.movie.advertising.ad_server","PopUnder","data.[].affiliate_url","cdnpk.net/v2/images/search?","cdnpk.net/Rest/Media/","war:noop.json","data.[-].inner.ctaCopy","?page=","/gampad/ads?",".adv-",".length === 0",".length === 31","window.matchMedia('(display-mode: standalone)').matches","Object.prototype.DetectByGoogleAd","/adsActive|POPUNDER/i","window.onload inlineScript","/Executed|modal/","[breakId*=\"Roll\"]","/content.vmap","/#EXT-X-KEY:METHOD=NONE\\n#EXT(?:INF:[^\\n]+|-X-DISCONTINUITY)\\n.+?(?=#EXT-X-KEY)/gms","/media.m3u8","window.navigator.brave","showTav","document['\\x","showADBOverlay","..directLink","..props[?.children*=\"clicksCount\"].children","clicksCount","adskeeper","springserve.com","document.documentElement.clientWidth","outbrain.com","s4.cdnpc.net/front/css/style.min.css","slider--features","s4.cdnpc.net/vite-bundle/main.css","data-v-d23a26c8","cdn.taboola.com/libtrc/san1go-network/loader.js","feOffset","hasAdblock","taboola","adbEnableForPage","Dataffcecd","/adblock|isblock/i","/\\b[a-z] inlineScript:/","result.adverts","data.pinotPausedPlaybackPage","fundingchoicesmessages","isAdblock","button[id][onclick*=\".html\"]","dclk_video_ads","ads breaks cuepoints times","odabd","pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?ord=","b.google_reactive_tag_first","sbs.demdex.net/dest5.html?d_nsid=0&ord=","Demdex.canSetThirdPartyCookies","securepubads.g.doubleclick.net/pagead/ima_ppub_config?ippd=https%3A%2F%2Fwww.sbs.com.au%2Fondemand%2F&ord=","[\"4117\"]","configs.*.properties.componentConfigs.slideshowConfigs.*.interstitialNativeAds","url:/config","list.[].link.kicker","/content/v1/cms/api/amp/Document","properties.tiles.[-].isAd","/mestripewc/default/config","openPop","circle_animation","CountBack","990","/location\\.(replace|href)|stopAndExitFullscreen/","displayAdBlockedVideo","/undefined|displayAdBlockedVideo/","cns.library","json:\"#app-root\"","google_ads_iframe","data-id|data-p","[data-id],[data-p]","BJSShowUnder","BJSShowUnder.bindTo","BJSShowUnder.add","Object.prototype._parseVAST","Object.prototype.createAdBlocker","Object.prototype.isAdPeriod","breaks custom_breaks_data pause_ads video_metadata.end_credits_time","pause_ads","/playlist","breaks","breaks custom_breaks_data pause_ads","xpath(//*[name()=\"MPD\"]/@mediaPresentationDuration | //*[name()=\"Period\"][.//*[name()=\"BaseURL\" and contains(text(),\"/ads-\")]] | //*[name()=\"Period\"][starts-with(@id,\"ad\")] | //*[name()=\"Period\"][starts-with(@id,\"Ad\")] | //*[name()=\"Period\"]/@start)","MPD Period[id^=\"Ad\"i]","ABLK","_n_app.popunder","_n_app.options.ads.show_popunders","N_BetterJsPop.object","jwplayer.vast","Fingerprent2","test.remove","isAdb","/click|mouse|touch/","puOverlay","opopnso","c0ZZ","cuepointPlaylist vodPlaybackUrls.result.playbackUrls.cuepoints vodPlaylistedPlaybackUrls.result.playbackUrls.pauseBehavior vodPlaylistedPlaybackUrls.result.playbackUrls.pauseAdsResolution vodPlaylistedPlaybackUrls.result.playbackUrls.intraTitlePlaylist.[-].shouldShowOnScrubBar ads","xpath(//*[name()=\"Period\"][.//*[@value=\"Ad\"]] | /*[name()=\"MPD\"]/@mediaPresentationDuration | //*[name()=\"Period\"]/@start)","[value=\"Ad\"]","xpath(//*[name()=\"Period\"][.//*[@value=\"Draper\"]] | /*[name()=\"MPD\"]/@mediaPresentationDuration | //*[name()=\"Period\"]/@start)","[value=\"Draper\"]","xpath(//*[name()=\"Period\"][.//*[name()=\"BaseURL\" and contains(text(),\"/interstitial/\")]] | /*[name()=\"MPD\"][.//*[name()=\"BaseURL\" and contains(text(),\"/interstitial/\")]]/@mediaPresentationDuration | /*[name()=\"MPD\"][.//*[name()=\"BaseURL\" and contains(text(),\"/interstitial/\")]]/*[name()=\"Period\"]/@start)","ue_adb_chk","ad.doubleclick.net bid.g.doubleclick.net ggpht.com google.co.uk google.com googleads.g.doubleclick.net googleads4.g.doubleclick.net googleadservices.com googlesyndication.com googleusercontent.com gstatic.com gvt1.com prod.google.com pubads.g.doubleclick.net s0.2mdn.net static.doubleclick.net surveys.g.doubleclick.net youtube.com ytimg.com","lifeOnwer","jsc.mgid.com","movie.advertising",".mandatoryAdvertising=false","/player/configuration","vast_urls","show_adverts","runCheck","adsSlotRenderEndSeen","DOMTokenList.prototype.add","\"-\"","removedNodes.forEach","__NEXT_DATA__.props.pageProps.broadcastData.remainingWatchDuration","json:9999999999","/\"remainingWatchDuration\":\\d+/","\"remainingWatchDuration\":9999999999","/stream","/\"midTierRemainingAdWatchCount\":\\d+,\"showAds\":(false|true)/","\"midTierRemainingAdWatchCount\":0,\"showAds\":false","a[href][onclick^=\"openit\"]","cdgPops","json:\"1\"","pubfuture","/doubleclick|google-analytics/","flashvars.mlogo_link","'script'","/ip-acl-all.php","URLlist","adBlockNotice","aaw","aaw.processAdsOnPage","displayLayer","adId","underpop","adBlockerModal","10000-15000","/adex|loadAds|adCollapsedCount|ad-?block/i","/^function\\(\\).*requestIdleCallback.*/","/function\\([a-z]\\){[a-z]\\([a-z]\\)}/","OneTrust","OneTrust.IsAlertBoxClosed","FOXIZ_MAIN_SCRIPT.siteAccessDetector","120000","openAdBlockPopup","drama-online","zoneid","\"data-cfasync\"","Object.init","advanced_ads_check_adblocker","div[class=\"nav tabTop\"] + div > div:first-child > div:first-child > a:has(> img[src*=\"/\"][src*=\"_\"][alt]), #head + div[id] > div:last-child > div > a:has(> img[src*=\"/\"][src*=\"_\"][alt])","/(?=^(?!.*(_next)))/","[].props.slides.[-].adIndex","#ad_blocker_detector","Array.prototype.includes","adblockTrigger","20","Date.prototype.toISOString","insertAd","!/^\\/|_self|alexsports|nativesurge/","length:40000-60000","method:HEAD mode:no-cors","attestHasAdBlockerActivated","extInstalled","blockThisUrl","SaveFiles.add","detectSandbox","/rekaa","pop_tag","/HTMLDocument|blob/","=","/wp-content\\/uploads\\/[a-z]+\\/[a-z]+\\.js/","pagead2.googlesyndication.com/pagead/js/adsbygoogle.js","wbDeadHinweis","()=>{var c=Kb","0.2","fired","popupInterval","adbon","*.aurl","/cs?id=","repl:/\\.mp4$/.mp3/",".mp4","-banner","PopURL","LCI.adBlockDetectorEnabled","!y2meta","ConsoleBan","disableDevtool","ondevtoolopen","onkeydown","window.history.back","close","lastPopupTime","button#download","mode:\"no-cors\"","!magnetdl.","stoCazzo","_insertDirectAdLink","Visibility","importFAB","ast","json:1","a[href][target=\"_blank\"]","url:ad/banner.gif","window.__CONFIGURATION__.adInsertion.enabled","window.__CONFIGURATION__.features.enableAdBlockerDetection","_carbonads","_bsa","redirectOnClick","widgets.outbrain.com","2d","/googletagmanager|ip-api/","&&","json:\"0\"","timeleftlink","handlePopup","bannerad sidebar ti_sidebar","moneyDetect","play","EFFECTIVE_APPS_GCB_BLOCKED_MESSAGE","sub","checkForAdBlocker","/navigator|location\\.href/","mode:cors","!self","/createElement|addEventListener|clientHeight/","uberad_mode","data.getFinalClickoutUrl data.sendSraBid",".php","!notunmovie","handleRedirect","testAd","imasdk.googleapis.com","/topaz/api","method:/head/i","data.availableProductCount","results.[-].advertisement","/partners/home","__aab_init","show_videoad_limited","__NATIVEADS_CANARY__","[breakId]","_VMAP_","ad_slot_recs","/doc-page/recommenders",".smartAdsForAccessNoAds=true","/doc-page/afa","Object.prototype.adOnAdBlockPreventPlayback","pre_roll_url","post_roll_url",".result.PlayAds=false","/api/get-urls","OfferwallSessionTracker","player.preroll",".redirected","promos","TNCMS.DMP","/pop?",".metadata.hideAds=true","a2d.tv/play/","adblock_detect","link.click","document.body.style.overflow","fallback","fusetag","/await|clientHeight/","Function","..adTimeout=0","/api/v","!/\\/download|\\/play|cdn\\.videy\\.co/","!_self","#fab","www/delivery","/\\/js/","/\\/4\\//","prads","/googlesyndication|doubleclick|adsterra/","String.prototype.split","null,http","..searchResults.*[?.isAd==true]","..mainContentComponentsListProps.*[?.isAd==true]","/search/snippet?","cmgpbjs","displayAdblockOverlay","start_full_screen_without_ad","drupalSettings.coolmath.hide_preroll_ads","clkUnder","adsArr","data.*.elements.edges.[].node.outboundLink","data.children.[].data.outbound_link","method:POST url:/logImpressions","rwt",".js","_oEa","ADMITAD","body:browser","_hjSettings","bmak.js_post","method:POST","utreon.com/pl/api/event method:POST","log-sdk.ksapisrv.com/rest/wd/common/log/collect method:POST","firebase.analytics","require.0.3.0.__bbox.define.[].2.is_linkshim_supported","/(ping|score)Url","Object.prototype.updateModifiedCommerceUrl","HTMLAnchorElement.prototype.getAttribute","json:\"class\"","data-direct-ad","flashvars.event_reporting","dataLayer.trackingId user.trackingId","Object.prototype.has_opted_out_tracking","cX_atfr","process","process.env","/VisitorAPI|AppMeasurement/","Visitor","''","?orgRef","analytics/bulk-pixel","eventing","send_gravity_event","send_recommendation_event","window.screen.height","method:POST body:zaraz","onclick|oncontextmenu|onmouseover","a[href][onclick*=\"this.href\"]","libAnalytics","json: {\"status\":{\"dataAvailable\":false},\"data\":{}}","libAnalytics.data.get","cmp.inmobi.com/geoip","method:POST url:pfanalytics.bentasker.co.uk","discord.com/api/v9/science","a[onclick=\"fire_download_click_tracking();\"]","adthrive._components.start","url:/api/statsig/log_event method:POST","ftr__startScriptLoad","url:/undefined method:POST","miner","CoinNebula","blogherads","Math.sqrt","update","/(trace|beacon)\\.qq\\.com/","splunkcloud.com/services/collector","event-router.olympics.com","hostingcloud.racing","tvid.in/log/","excess.duolingo.com/batch","/eventLog.ajax","t.wayfair.com/b.php?","navigator.sendBeacon","segment.io","mparticle.com","ceros.com/a?data","pluto.smallpdf.com","method:/post/i url:/^https?:\\/\\/chatgpt\\.com\\/ces\\/v1\\/[a-z]$/","method:/post/i url:ab.chatgpt.com/v1/rgstr","/eventhub\\.\\w+\\.miro\\.com\\/api\\/stream/","logs.netflix.com","s73cloud.com/metrics/",".cdnurl=[\"data:video/mp4;base64,AAAAHGZ0eXBNNFYgAAACAGlzb21pc28yYXZjMQAAAAhmcmVlAAAGF21kYXTeBAAAbGliZmFhYyAxLjI4AABCAJMgBDIARwAAArEGBf//rdxF6b3m2Ui3lizYINkj7u94MjY0IC0gY29yZSAxNDIgcjIgOTU2YzhkOCAtIEguMjY0L01QRUctNCBBVkMgY29kZWMgLSBDb3B5bGVmdCAyMDAzLTIwMTQgLSBodHRwOi8vd3d3LnZpZGVvbGFuLm9yZy94MjY0Lmh0bWwgLSBvcHRpb25zOiBjYWJhYz0wIHJlZj0zIGRlYmxvY2s9MTowOjAgYW5hbHlzZT0weDE6MHgxMTEgbWU9aGV4IHN1Ym1lPTcgcHN5PTEgcHN5X3JkPTEuMDA6MC4wMCBtaXhlZF9yZWY9MSBtZV9yYW5nZT0xNiBjaHJvbWFfbWU9MSB0cmVsbGlzPTEgOHg4ZGN0PTAgY3FtPTAgZGVhZHpvbmU9MjEsMTEgZmFzdF9wc2tpcD0xIGNocm9tYV9xcF9vZmZzZXQ9LTIgdGhyZWFkcz02IGxvb2thaGVhZF90aHJlYWRzPTEgc2xpY2VkX3RocmVhZHM9MCBucj0wIGRlY2ltYXRlPTEgaW50ZXJsYWNlZD0wIGJsdXJheV9jb21wYXQ9MCBjb25zdHJhaW5lZF9pbnRyYT0wIGJmcmFtZXM9MCB3ZWlnaHRwPTAga2V5aW50PTI1MCBrZXlpbnRfbWluPTI1IHNjZW5lY3V0PTQwIGludHJhX3JlZnJlc2g9MCByY19sb29rYWhlYWQ9NDAgcmM9Y3JmIG1idHJlZT0xIGNyZj0yMy4wIHFjb21wPTAuNjAgcXBtaW49MCBxcG1heD02OSBxcHN0ZXA9NCB2YnZfbWF4cmF0ZT03NjggdmJ2X2J1ZnNpemU9MzAwMCBjcmZfbWF4PTAuMCBuYWxfaHJkPW5vbmUgZmlsbGVyPTAgaXBfcmF0aW89MS40MCBhcT0xOjEuMDAAgAAAAFZliIQL8mKAAKvMnJycnJycnJycnXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXiEASZACGQAjgCEASZACGQAjgAAAAAdBmjgX4GSAIQBJkAIZACOAAAAAB0GaVAX4GSAhAEmQAhkAI4AhAEmQAhkAI4AAAAAGQZpgL8DJIQBJkAIZACOAIQBJkAIZACOAAAAABkGagC/AySEASZACGQAjgAAAAAZBmqAvwMkhAEmQAhkAI4AhAEmQAhkAI4AAAAAGQZrAL8DJIQBJkAIZACOAAAAABkGa4C/AySEASZACGQAjgCEASZACGQAjgAAAAAZBmwAvwMkhAEmQAhkAI4AAAAAGQZsgL8DJIQBJkAIZACOAIQBJkAIZACOAAAAABkGbQC/AySEASZACGQAjgCEASZACGQAjgAAAAAZBm2AvwMkhAEmQAhkAI4AAAAAGQZuAL8DJIQBJkAIZACOAIQBJkAIZACOAAAAABkGboC/AySEASZACGQAjgAAAAAZBm8AvwMkhAEmQAhkAI4AhAEmQAhkAI4AAAAAGQZvgL8DJIQBJkAIZACOAAAAABkGaAC/AySEASZACGQAjgCEASZACGQAjgAAAAAZBmiAvwMkhAEmQAhkAI4AhAEmQAhkAI4AAAAAGQZpAL8DJIQBJkAIZACOAAAAABkGaYC/AySEASZACGQAjgCEASZACGQAjgAAAAAZBmoAvwMkhAEmQAhkAI4AAAAAGQZqgL8DJIQBJkAIZACOAIQBJkAIZACOAAAAABkGawC/AySEASZACGQAjgAAAAAZBmuAvwMkhAEmQAhkAI4AhAEmQAhkAI4AAAAAGQZsAL8DJIQBJkAIZACOAAAAABkGbIC/AySEASZACGQAjgCEASZACGQAjgAAAAAZBm0AvwMkhAEmQAhkAI4AhAEmQAhkAI4AAAAAGQZtgL8DJIQBJkAIZACOAAAAABkGbgCvAySEASZACGQAjgCEASZACGQAjgAAAAAZBm6AnwMkhAEmQAhkAI4AhAEmQAhkAI4AhAEmQAhkAI4AhAEmQAhkAI4AAAAhubW9vdgAAAGxtdmhkAAAAAAAAAAAAAAAAAAAD6AAABDcAAQAAAQAAAAAAAAAAAAAAAAEAAAAAAAAAAAAAAAAAAAABAAAAAAAAAAAAAAAAAABAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAwAAAzB0cmFrAAAAXHRraGQAAAADAAAAAAAAAAAAAAABAAAAAAAAA+kAAAAAAAAAAAAAAAAAAAAAAAEAAAAAAAAAAAAAAAAAAAABAAAAAAAAAAAAAAAAAABAAAAAALAAAACQAAAAAAAkZWR0cwAAABxlbHN0AAAAAAAAAAEAAAPpAAAAAAABAAAAAAKobWRpYQAAACBtZGhkAAAAAAAAAAAAAAAAAAB1MAAAdU5VxAAAAAAALWhkbHIAAAAAAAAAAHZpZGUAAAAAAAAAAAAAAABWaWRlb0hhbmRsZXIAAAACU21pbmYAAAAUdm1oZAAAAAEAAAAAAAAAAAAAACRkaW5mAAAAHGRyZWYAAAAAAAAAAQAAAAx1cmwgAAAAAQAAAhNzdGJsAAAAr3N0c2QAAAAAAAAAAQAAAJ9hdmMxAAAAAAAAAAEAAAAAAAAAAAAAAAAAAAAAALAAkABIAAAASAAAAAAAAAABAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAGP//AAAALWF2Y0MBQsAN/+EAFWdCwA3ZAsTsBEAAAPpAADqYA8UKkgEABWjLg8sgAAAAHHV1aWRraEDyXyRPxbo5pRvPAyPzAAAAAAAAABhzdHRzAAAAAAAAAAEAAAAeAAAD6QAAABRzdHNzAAAAAAAAAAEAAAABAAAAHHN0c2MAAAAAAAAAAQAAAAEAAAABAAAAAQAAAIxzdHN6AAAAAAAAAAAAAAAeAAADDwAAAAsAAAALAAAACgAAAAoAAAAKAAAACgAAAAoAAAAKAAAACgAAAAoAAAAKAAAACgAAAAoAAAAKAAAACgAAAAoAAAAKAAAACgAAAAoAAAAKAAAACgAAAAoAAAAKAAAACgAAAAoAAAAKAAAACgAAAAoAAAAKAAAAiHN0Y28AAAAAAAAAHgAAAEYAAANnAAADewAAA5gAAAO0AAADxwAAA+MAAAP2AAAEEgAABCUAAARBAAAEXQAABHAAAASMAAAEnwAABLsAAATOAAAE6gAABQYAAAUZAAAFNQAABUgAAAVkAAAFdwAABZMAAAWmAAAFwgAABd4AAAXxAAAGDQAABGh0cmFrAAAAXHRraGQAAAADAAAAAAAAAAAAAAACAAAAAAAABDcAAAAAAAAAAAAAAAEBAAAAAAEAAAAAAAAAAAAAAAAAAAABAAAAAAAAAAAAAAAAAABAAAAAAAAAAAAAAAAAAAAkZWR0cwAAABxlbHN0AAAAAAAAAAEAAAQkAAADcAABAAAAAAPgbWRpYQAAACBtZGhkAAAAAAAAAAAAAAAAAAC7gAAAykBVxAAAAAAALWhkbHIAAAAAAAAAAHNvdW4AAAAAAAAAAAAAAABTb3VuZEhhbmRsZXIAAAADi21pbmYAAAAQc21oZAAAAAAAAAAAAAAAJGRpbmYAAAAcZHJlZgAAAAAAAAABAAAADHVybCAAAAABAAADT3N0YmwAAABnc3RzZAAAAAAAAAABAAAAV21wNGEAAAAAAAAAAQAAAAAAAAAAAAIAEAAAAAC7gAAAAAAAM2VzZHMAAAAAA4CAgCIAAgAEgICAFEAVBbjYAAu4AAAADcoFgICAAhGQBoCAgAECAAAAIHN0dHMAAAAAAAAAAgAAADIAAAQAAAAAAQAAAkAAAAFUc3RzYwAAAAAAAAAbAAAAAQAAAAEAAAABAAAAAgAAAAIAAAABAAAAAwAAAAEAAAABAAAABAAAAAIAAAABAAAABgAAAAEAAAABAAAABwAAAAIAAAABAAAACAAAAAEAAAABAAAACQAAAAIAAAABAAAACgAAAAEAAAABAAAACwAAAAIAAAABAAAADQAAAAEAAAABAAAADgAAAAIAAAABAAAADwAAAAEAAAABAAAAEAAAAAIAAAABAAAAEQAAAAEAAAABAAAAEgAAAAIAAAABAAAAFAAAAAEAAAABAAAAFQAAAAIAAAABAAAAFgAAAAEAAAABAAAAFwAAAAIAAAABAAAAGAAAAAEAAAABAAAAGQAAAAIAAAABAAAAGgAAAAEAAAABAAAAGwAAAAIAAAABAAAAHQAAAAEAAAABAAAAHgAAAAIAAAABAAAAHwAAAAQAAAABAAAA4HN0c3oAAAAAAAAAAAAAADMAAAAaAAAACQAAAAkAAAAJAAAACQAAAAkAAAAJAAAACQAAAAkAAAAJAAAACQAAAAkAAAAJAAAACQAAAAkAAAAJAAAACQAAAAkAAAAJAAAACQAAAAkAAAAJAAAACQAAAAkAAAAJAAAACQAAAAkAAAAJAAAACQAAAAkAAAAJAAAACQAAAAkAAAAJAAAACQAAAAkAAAAJAAAACQAAAAkAAAAJAAAACQAAAAkAAAAJAAAACQAAAAkAAAAJAAAACQAAAAkAAAAJAAAACQAAAAkAAACMc3RjbwAAAAAAAAAfAAAALAAAA1UAAANyAAADhgAAA6IAAAO+AAAD0QAAA+0AAAQAAAAEHAAABC8AAARLAAAEZwAABHoAAASWAAAEqQAABMUAAATYAAAE9AAABRAAAAUjAAAFPwAABVIAAAVuAAAFgQAABZ0AAAWwAAAFzAAABegAAAX7AAAGFwAAAGJ1ZHRhAAAAWm1ldGEAAAAAAAAAIWhkbHIAAAAAAAAAAG1kaXJhcHBsAAAAAAAAAAAAAAAALWlsc3QAAAAlqXRvbwAAAB1kYXRhAAAAAQAAAABMYXZmNTUuMzMuMTAw\"]","/storage-resolve/files/audio/interactive"];

const $scriptletArglists$ = /* 3613 */ "0,0,1,2;1,2,3,4;2,5,6,7;3,8,9,3,10;3,11,9,3,12;4,8,9,3,13;5,14,15,16;5,17,9,16;5,18,19,13;6,14,15,20;6,21,15,20;6,21,15,22;7,23,24;7,23,25;7,23,26;8,27;6,21,15,28;8,29;4,30,9,3,31;9,32;10,33,34;8,35;9,36;11,37,3,31;11,38,3,31;11,39,3,31;12;10,40,41;13,42,43;13,44,45;14,46,47;15,48,49;15,50,51;15,50,52;15,53,51;15,50,54;15,55,56;15,53,57;15,58,59,60,61;15,53,62;15,53,63;15,53,64;15,53,65;15,53,66;15,53,67;16,68;16,69,70;17,71,72;16,73,74;16,75;16,76;12,77;13,78,79;10,80,41;13,81,82;18,83,84;17,85,86;17,87,86;16,88;17,89;16,90;19,91,92,93;18,94,9,9,95,96;20,97,1,98,99,100;21,101,102;17,103;20,104,1,105,99,106;20,104,1,107,99,108;22,109;18,110,111;20,104,1,9,99,112;18,113,114;23,115,116,117,99,118;20,115,1,119,99,120;20,121,1,119,99,120;18,122,123,124;17,125;10,126,41;18,127,128;15,129,130,131;24,132;4,133,9,3,134;10,135,136;24,137;2,138;18,139,140;16,139,140;10,141,136;10,142,143;2,144,72;10,145,143;10,146,136;19,147,148;10,149,150;8,151;18,152;10,153,136;10,154,155;10,156,136;16,157;25;10,158,136;10,159,136;10,160,136;10,161,136;10,162,136;10,163,155;10,164,136;10,165,136;18,166;26,167;18,168;18,169;2,170,171;19,172,173;19,174,175,93;13,176;10,177,9;16,178;16,169;27,179,180;18,181;10,182,155;10,183,155;10,184,155;25,185,9,186;16,187;10,188,155;16,189;10,190,136;16,181;10,191,136;10,192,74;10,193,155;10,194,155;2,195,196,7;2,197,198,7;10,199,200;10,201,136;16,202;10,203,136;10,204,136;10,205,136;10,206,155;10,207,136;16,208;24,209;10,210,136;10,211,136;10,212,136;10,213,155;10,214,74;10,215,155;10,216,136;10,217,155;10,218,136;10,219,136;10,220,9;10,221,155;10,222,136;10,223,155;10,224,136;10,225,136;10,226,155;10,227,136;10,228,136;10,229,155;10,230,155;10,231,155;10,232,155;10,233,155;10,234,155;10,235,136;10,236,136;2,237,198;10,238,155;16,239;25,240,171;10,241,155;10,242,136;28,243,244;10,245,155;10,246,136;10,247,136;10,248,136;2,249,250;2,251,171;10,252,155;10,253,136;10,254,155;10,255,136;20,256,1,257,99,258;10,259,41;10,260,74;10,261,155;10,262,136;10,263,155;10,264,200;10,265,155;10,266,136;10,267,136;10,268,136;10,269,155;10,270,136;10,271,136;10,272,155;10,273,200;10,274,155;10,275,136;10,276,136;10,277,136;10,278,136;10,279,155;10,280,136;2,281,198,7;10,282,155;10,283,9;10,284,155;10,285,136;10,286,136;16,287;10,288,155;10,289,136;10,290,155;10,291,136;10,292,136;10,293,155;10,294,136;10,295,136;10,296,155;10,297,136;10,298,136;10,299,136;10,300,155;10,301,136;2,302,171,7;2,303,198,7;10,304,136;18,178;2,305,171,7;10,306,155;10,307,136;18,308;2,170,309,7;2,170,310,7;10,311,136;17,312;10,313,155;10,314,136;10,315,155;16,316;10,317,136;10,318,155;10,319,136;10,320,155;10,321,136;10,322,155;10,323,136;10,324,155;10,325,136;10,326,136;14,327,328;10,329,34;2,5,250,7;2,330,331,7;10,332,155;10,333,136;10,334,136;2,335,171,7;16,336;10,337,155;10,338,155;10,339,136;10,340,136;10,341,155;10,342,136;10,343,136;10,344,34;10,345,136;10,346,136;10,347,155;10,348,136;28,243,349;10,350,136;10,351,41;10,352,136;10,353,136;10,354,136;10,355,136;28,243,9,356,357;10,358,155;10,359,136;10,360,155;10,361,136;10,362,155;10,363,136;10,364,74;20,365,366,367,99,368;10,369,155;10,370,136;10,371,136;10,372,74;10,373,34;10,374,136;10,375,136;10,376,143;10,377,41;10,378,41;10,379,41;10,380,41;8,381;3,382,9,3,383;28,384,385;26,386,72;8,387,388;28,384,389;26,390,391;18,392;10,393,1;18,394;10,395,9;26,396;24,397;8,398;5,399,155,400;5,401,155,400;5,402,155,400;8,403,404;8,405;8,406;4,407,9,3,400;11,408,31;24,409;24,410;28,9,396;17,396;10,411,150;13,412,413;13,414;17,415;17,416;24,417;20,26,1,418,99,419;2,9,391;24,420;29,421;10,422,41;30;24,423;13,424;18,425;28,243,426;29,427;13,428,420;24,429;24,430;24,431;29,432;24,433;28,243,434;28,384,435;17,436,437;24,438;24,439;29,440;16,441;10,442,136;13,256,443;13,81,444;2,445,171;24,446;24,424;28,384,447;24,448;24,449;24,40;29,450;2,451,171;28,9,452;24,453;24,454;13,455,456;24,457;27,458,459;13,428,460;29,424;24,461;24,462;28,384,463;28,384,464;13,465,466;26,467;16,152;10,468,74;10,469,136;18,470;13,428,471;13,472,465;24,473;24,474;13,428,475;29,476;29,477;13,478,466;24,479;28,9,445;13,428,480;28,9,481;13,482,483;24,484;17,456;13,485,456;29,474;24,414;13,412,486;24,487;24,488;29,489;29,490;13,491,492;2,493,494;27,447,61;24,80;10,495,34;10,496,34;24,497;10,498,200;19,499;24,500;28,501,502;24,503;13,428,504;13,428,505;13,428,41;24,506;24,507;10,508,34;24,472;13,447,424;24,509;24,510;24,511;10,512,9;10,513,34;29,514;10,515,74;29,516;29,517;29,518;10,519,74;24,520;13,428,481;29,521;24,485;19,522,523,524;10,525,143;2;29,526;24,527;28,9,424;24,528;10,529,34;24,530;13,487;24,531;13,532,533;29,534;26,535;13,428,536;25,537;24,538;29,539;17,540;10,507,74;24,541;17,542;24,543;10,544,136;10,545,74;29,546;28,243,547;28,548,549;13,485,550;29,551;13,81,552;10,40,143;10,553,9;10,554,9;10,555,366;28,556;17,557;24,558;17,559,560;10,561,74;24,562;28,9,563;13,428,564;10,565,9;24,566;27,397,567;28,384,568;22,569;28,570;27,485,571;24,572;10,573,136;10,574,150;27,256,575;2,576,577;10,578,74;17,579,1;10,580,136;10,42,150;24,581;10,103,34;13,582,460;10,583,74;13,412,584;29,585;10,586,587;28,9,588;24,589;17,590,437;13,455,437;17,591,592;24,593;13,45,465;10,594,74;13,485,595;26,445;28,9,596;24,597;29,598;10,599,34;24,600;13,601;13,45,602;13,603,604;28,605,606;17,607;24,608;24,609;31,610;24,611;24,612;24,613;10,614,136;13,491,41;10,615,136;29,616;2,617;25,618;17,256,198;24,619;24,620;24,621;13,482,622;29,623;29,624;10,625,34;17,626,627;10,628,74;10,629,34;25,630,631;13,446,103;28,384,632;25,633,560;29,634;29,487;24,635;28,243,606;24,636;10,637,34;28,384,560;13,638,549;13,45;24,639;17,640;29,641;29,642;28,643,644;13,645,646;29,647;28,384,396;13,412,648;24,649;10,650,34;24,583;17,638,437;13,472,45;24,651;29,652;17,653;17,654;24,516;31,487;10,655,9;17,482,1;28,656,644;28,9,607;13,412,449;13,449,657;24,658;24,659;24,660;10,661,74;10,40,136;17,626,560;24,662;28,384,626;28,663,664;13,665,499;29,666;19,667,668;17,669,198;13,670,671;10,672,34;12,596;24,103;13,673;28,9,674;24,675;10,532,74;28,676,677;29,678;17,679,680;13,583;13,455,681;18,682;13,683,684;17,685,560;28,384,686;13,428,687;10,414,74;17,688;28,9,689;17,689;13,428,416;29,80;17,690,250;28,691,692;17,693,72;13,455,256;17,694,560;12,695;13,412,696;12,697;10,698,155;10,699,9;24,700;29,701;17,702,703;13,491,103;10,704,136;24,705;25,706,560;24,707;10,708,34;16,709;17,710;2,711,171,186;10,103,136;10,712,9;8,171,713;12,9,714;13,26,45;13,449;29,715;16,716;10,717,41;13,428,718;10,719,34;10,507,136;24,720;17,685,721;17,722;24,723;28,691,724;24,725;16,726;10,727,136;24,728;13,447,449;28,605,729;10,730,74;12,731;13,472,732;24,427;18,733;10,734,34;24,735;13,491,736;16,737;10,738,136;28,9,739;29,740;17,741,250;13,428,742;24,743;25,9,744;24,745;25,9,9,1;17,746;13,491,747;16,748;13,749,493;13,447;28,9,750;24,751;10,752,9;10,753,9;10,754,9;13,428,749;24,755;27,696,756;28,501,757;28,691,758;13,538,759;24,760;28,501,445;13,428,761;13,455,762;24,763;29,764;17,445,560;24,765;13,482,485;29,449;19,766,767;13,768;13,45,472;13,365,769;29,465;19,770,771;24,772;24,696;26,773,437;17,251,774;10,775,34;10,776,136;13,428,777;24,778;10,449,150;24,779;28,780,596;10,781,74;24,546;24,782;29,783;19,784,785;25,786,171;10,787,34;10,788,136;28,243,789;17,790,72;13,546;24,791;28,384,792;13,793;10,794,41;24,795;13,428,424;28,384,796;17,481,198;17,797,798;16,799;29,787;17,800,1;25,801;13,491,802;13,803,804;10,805,34;24,806;24,807;24,808;17,809,437;18,251;10,810,34;29,811;17,812;26,813,437;29,814;17,445;12,815,714;13,491,816;29,817;10,45,136;28,9,818;24,819;10,820,136;17,821,366;10,822,136;13,491,251;10,823,136;16,733;28,691,824;13,478,465;13,365,825;24,826;2,827,494;10,828,200;24,829;24,598;13,428,830;10,103,366;10,831,366;17,832;19,833;29,834;8,835,836;13,837,757;17,428;17,838,437;29,608;29,839;17,790;13,491,840;10,841,1;10,251,74;29,842;28,243,843;24,844;13,845,610;10,846,74;29,847;17,396,1;28,9,848;17,849;10,850,136;13,412,851;10,503,366;13,455,852;13,455,853;29,854;13,538,852;13,81,855;24,856;27,478,857;17,858,859;26,860;19,667,861;29,862;13,485,863;17,392;13,412,864;28,243,445;10,865,34;18,152,733;24,820;17,866,72;24,867;24,868;24,869;17,481;24,870;29,871;25,9,9,7;10,872,143;13,873;13,447,499;24,874;10,875,74;27,876,61;10,754,41;10,503,34;17,790,391;24,877;13,491,878;10,879,74;13,491,880;13,491,881;17,882,560;17,883,437;24,884;29,885;13,428,886;13,428,887;13,428,878;17,879;13,491,888;13,428,889;13,491,702;29,890;18,169,123,124;17,150,494;28,384,891;28,384,892;13,482,626;17,685,331;17,893,250;25,841;10,894,1;25,841,331;31,895;17,896,331;17,685,196;28,243,729;12,897;29,472;24,898;10,899,34;13,428,103;18,900;17,901;28,902,903;17,904;10,905,136;13,428,906;17,685,437;13,485,907;10,908,136;10,909,136;28,691,910;13,478,45;10,911,74;29,912;2,913;29,914;13,665,550;29,915;10,916,34;10,80,136;10,917,136;17,696,331;17,460;29,918;17,919;10,920,136;17,921,560;10,922,74;29,916;28,384,923;26,685,198;24,924;24,925;28,926,927;29,928;24,929;27,485,61;19,499,930;2,931;29,932;10,933,74;13,458,602;13,428,934;26,935,936;10,937,9;24,465;13,428,938;10,890,74;10,939,74;17,940;16,251;17,941;13,803,243;13,491,942;13,167,671;24,943;12,944,1;10,945,74;10,670,74;25,618,171;10,946,34;28,501,947;17,948,631;10,949,34;17,950;2,9,9,186;17,951,72;17,952,391;28,243,195;24,552;10,953,1;10,811,136;24,954;25,617;17,955;25,9,9,186;10,956,1;28,243,596;24,957;24,958;13,80;13,428,959;12,960;24,478;13,961,962;13,603,739;25,963,437;29,964;28,965,739;10,966,136;13,78,878;10,967,1;28,243,968;12,103,366,969;18,970;28,243;10,971,34;13,972;13,973;13,974;13,975;28,691,976;24,977;17,978,366;12,979;13,834;24,980;12,981;10,982,136;24,983;24,984;17,985;10,986,136;26,987,437;28,605,988;10,989,34;24,206;13,412,757;13,696,990;29,991;10,481,34;24,992;13,803,993;24,447;10,994,9;10,995,9;10,996,34;27,45,61;24,885;17,997;13,491,998;13,45,598;13,999,445;17,1000;16,1001;19,667,1002;16,1003;17,942,560;27,81,61;24,1004;28,691,1005;17,1005;13,428,747;17,876,437;10,1006,1;10,1007,74;10,1008,74;10,1009,34;24,1010;17,103,1011;28,1012;24,1013;17,1014;17,150;13,485,1015;13,455,1016;24,1017;24,1018;24,1019;13,603,607;29,1020;10,1021,587;24,1022;13,485,1023;13,81,1024;24,1025;10,1026,74;10,1027,74;10,1028,150;27,491,1029;10,1030,74;18,1031;13,552,396;16,1032;10,1033,34;29,1034;24,757;19,499,9,93;12,1035;24,1036;18,152,1037;17,396,592;13,491,1038;13,485,1039;13,491,1040;29,1041;24,702;13,803,626;12,425,366;24,1042;24,1043;28,425,739;26,1044,437;17,495;13,365,43;24,1045;10,1046,34;10,1047,34;17,1048;24,526;24,1049;28,384,1050;28,1051,445;24,1052;10,1053,74;13,492,767;24,1054;24,1055;10,1019,136;24,1056;31,1057;24,1058;29,1059;10,1060,74;29,1061;10,1062,366;31,251;19,1063,1064;13,818,855;13,1015,855;29,1065;10,80,34;17,1066;12,251;10,1067,366;24,1068;29,1069;17,1070;10,1071,74;13,449,667;24,1072;13,1073;13,803,1074;10,1075,143;13,665,1076;13,78,1077;17,1078;18,1079;13,412,41;17,1080;29,1081;29,1082;28,691,1083;29,1084;13,428,851;13,1085,942;13,485,942;24,1086;13,491,1087;12,1088,714,969;29,103;10,1089,74;29,1090;28,1091,1092;13,428,1093;17,685;24,1094;8,1095;26,1096;13,78,1097;24,1098;13,485,563;24,1099;10,1100,74;13,492,1101;10,629,74;10,1102,200;17,851;27,385,1103;17,1104;24,1105;17,1106;17,1107,560;18,1108;10,937,41;13,525;28,9,1109;24,787;19,1110;24,1111;13,598,552;13,1112;18,1113;24,1114;17,1115;10,1116,9;28,926;10,240,74;29,1117;17,1118;26,1118;28,243,1119;24,1120;13,1121;13,485,1122;28,9,460;24,1123;26,524,721;26,1124;10,1125,41;13,488,1126;29,1127;28,384,1076;13,491,1128;17,1129;10,1130,74;26,1131;29,1132;17,775;17,9,366;28,9,1133;10,440,74;17,41;17,890,366;13,428,1134;29,892;13,428,1135;13,412,1099;17,787;10,1136,9;24,1137;10,1138,136;24,1139;13,412,103;25,1140;2,1140;24,1141;13,478,1142;17,626;28,9,1143;10,80,74;13,876,1097;13,412,985;25,1144;10,1145,1;17,1146;16,169,123;24,1147;17,1148,560;26,739;26,747;24,1149;8,1150;25,9,171,1;10,507,143;17,978;28,243,757;13,428,455;13,491,1151;13,428,251;13,412,747;13,428,1152;13,81,607;13,428,78;10,1153,74;16,1154;10,1155,155;16,1156;10,1157,34;27,1158,1159;5,1160,1161,1159;8,1162;10,1163,41;10,1164,136;10,1165,136;28,1166;8,387,1167;17,1168,627;17,1169;13,1170;13,455,1171;13,1172;28,1051,1093;24,1173;13,428,1174;17,1175,1;12,1176;17,626,1177;28,384,41;10,1178,34;28,691,1072;10,1179,155;28,384,739;17,1180;28,691,449;13,428,1181;13,491,1182;10,1183,74;10,392,150;13,485,103;16,1184;25,1185,437;17,1186,1;24,912;26,1044;26,767;28,1187;24,1188;13,428,449;24,1189;10,1190,34;17,579,859;10,1191,74;10,1192,74;10,1193,34;10,251,150;12,1194;13,1195,757;32;29,1196;13,845,851;13,428,1197;19,1198;31,722;28,243,1199;24,1053;13,428,1200;13,81,465;13,428,447;28,243,9,356,1201;17,1202;16,392;10,1203,136;24,872;24,1204;10,1205,74;13,820;13,1206;19,667,1207;19,667,1208;19,667,1209;13,81,1210;24,1211;24,1212;13,478,1213;28,9,416;28,827,549;17,1214;27,874,1215;10,1216,150;17,739;13,638,335;24,1217;24,1218;19,833,1219;13,482,804;17,1220,72;13,256,1221;13,428,1222;17,1223;28,9,251;24,1115;13,428,1224;29,1225;28,243,1226;10,1227,74;17,1135;28,384,1228;26,392;10,1229,74;17,1230,437;18,1231;10,1232,34;13,428,1146;13,412,1146;10,1233,1;17,1234;8,1235;17,1230;28,384,1236;10,1237,74;10,1238,74;13,447,103;17,892;13,491,626;10,1239,34;24,1172;24,1240;24,1241;13,485,1242;10,424,41;24,1243;10,1244,150;13,482,1245;13,412,243;10,1246,74;13,465,459;17,793;28,9,449;17,1247;12,1248;17,1249;25,633,171,7;24,1132;10,1250,150;10,392,143;10,1251,41;24,1252;12,1253;17,1254;17,671;10,80,150;28,691,851;10,1255,366;24,1256;24,492;10,1257,34;24,1258;24,1259;17,702;24,1260;28,384,1146;8,1261;28,1262,1263;2,1264,171,7;13,1265;17,1266,1;17,251;13,428,1267;28,1268,1269;28,691,787;27,598,61;2,9,391,1;24,450;24,1270;10,1271,74;24,1272;12,1273;19,1274,1275;13,482,1146;13,482,1276;13,482,480;13,803,787;26,919;10,945,34;29,1277;14,1278,1279,1280,1281;24,1282;25,827,171,186;17,702,560;20,1168,1,1283,99,1168;10,1284,143;14,397,1285;25,706,171,186;2,1286,171,7;25,1287,171,7;25,1288,171,186;2,1289,171,186;10,1290,41;25,1288,171;27,455,787;25,827,171,7;25,1291,171,186;31,1292;28,793,1293;8,1294;2,1295,171;10,1296,74;13,482,1297;13,520,619;13,447,392;8,1298;8,1299;8,1300;17,1301;18,1302;13,1303,1304;17,1305;18,169,9,1306;10,1307,143;13,1303,919;18,1308;28,384,1309;13,482,1304;13,482,251;12,1310;10,1311,74;24,1312;19,1313,1314;19,1313,1315,93;19,499,1316,93;10,1317,74;19,1318,1319;28,793,1320;18,1321;25,801,171,7;24,973;24,1322;27,256,1323;25,1288,171,7;2,1324,171,7;25,706,171,7;28,243,1325;13,1326,1327;21,909,1328;28,691,674;28,384,1329;31,787;19,667,1330;28,691,1331;28,691,790;17,445,72;29,1332;19,1274,9,93;12,1333;10,765,41;16,757;29,1334;28,9,549;10,1335,136;2,1336;10,1337,34;10,1338,136;10,975,136;28,1339,606;28,1340,1341;2,9,171,1342;23,465,1343,34;29,1303;27,397,1344;24,1345;25,1288,437,7;25,1288,1346,7;28,243,1013;13,485,1331;19,1347,1348,93;24,974;25,1006,171,7;28,1339;17,1311;18,1349;10,1350,74;28,1351,1352;10,702,1353;16,1354;13,1355,1356;28,691,590;17,884;25,1357,171,7;2,1093,171,7;31,396;24,1358;28,793,706;25,1359,171,7;12,1360;28,384,1361;24,1362;19,499,1363;31,947;27,491,787;12,9,1011;25,1364,171;24,1290;2,827,171,7;12,1365;17,1366;18,1367;12,425,714;17,9,560;17,425,437;10,1368,1;12,1369;31,1370;28,691,1371;19,499,1372;24,1373;28,243,1374;28,243,9,356,1375;24,1309;24,1376;18,1377;16,1378;31,392;18,1379;27,665,787;12,1380;25,9,171,186;2,9,171,186;18,392,1381;10,1382,150;14,1383,1384;17,1385;28,243,460;28,243,1386;17,1387;13,638,1388;10,1389,41;28,691,424;25,633;10,1390,74;21,909,1391;19,667,1392,93;28,243,1393;25,633,437,7;18,1394;28,793;2,9,592;13,455,954;10,1395,1281;25,633,437;2,931,437;13,24,78;18,716;26,1310;26,1396;13,485,787;27,491,1397;4,1398,9,3,1399;12,1400;28,243,485;28,691,1401;13,485,1401;17,1402,72;17,1403,714;17,1403;10,1404,136;17,197,714;10,1405,34;17,1406;24,1407;27,81,863;27,78,1408;27,78,1409;27,78,1410;13,455,1411;10,1412,155;10,1413,136;13,1414;8,1415;23,45,116,9,99,1416;28,243,549;13,45,1417;23,45,116,9,99,1418;29,820;13,428,549;13,44,1085;28,9,1419;13,455,595;13,1420,595;13,485,1421;13,485,1422;13,485,595,1423;15,1424,1425,60,1426;13,520,1427;24,1428;12,1429;24,1430;28,9,547;17,1431;27,485,1432;10,1433,9;24,1434;29,1435;26,425;10,1436,41;17,1076;29,1437;13,81,1438;13,26,962;13,1439,962;28,9,962;13,81,962;13,478,1440;27,78,1441;13,26,1085;13,1326,962;27,385,1442;13,1355,1443;24,1444;24,1445;13,1085,26;13,1085,962;13,999,43;13,385,962;13,472,1446;27,78,1447;13,81,1448;16,1449;27,552,1450;13,44,45,1423;13,818,1451;13,42,1452,1423;13,492,1453;27,449,1454;13,24,43;13,482,1455;28,605,1456;12,1457;10,1458,200;17,1459;27,665,1460;28,1461,5,356,1462;10,1463,74;10,1464,1465;10,1466,136;28,384,1467;25,1288;12,1468;10,1469,34;28,9,1470;17,1168;17,483,560;31,1471;28,384,919;27,638,1472;24,1473;15,845,1474,60;17,1475;29,1476;13,1149,985;13,1149,985,1423;28,384,1477;17,459;18,1478,123,1479;16,1478,123;28,691,1480;15,50,1481,131,1482;10,1483,34;13,485,807;13,485,1484;24,1485;10,1484,136;9,1486;9,1487;28,1488,1146;13,1484;10,1489,41,1280,1490;14,1491,1492;10,1493,74;10,1494;33,550,1495;18,1496;17,1497;17,1498;17,1499;17,1500,198;20,1501,366,9,99,1502;16,1503;10,1504,136;10,1505,136;8,1506;20,1501,366,1507,99,1502;20,1501,366,1508,99,1502;31,1509;33,550,1510;17,5,72;15,1501,1511,131;28,384,1497;13,485,1512;10,1105,136;10,1513,366;8,1514;10,1515,34;10,1516,34;34,1517,3,1518;10,1519,41;10,1520,34;25,1521,171,7;10,1522,143;29,1523;24,1524;19,653,1525;10,1526,150;10,1195,150;23,1527,1528,9,99,756;27,1529,445;14,1530,1531;10,1532,366;27,485,1533;28,384,1534;10,1535,1;13,428,478;31,167;2,1536,171,7;13,1537;24,1538;3,1539,9,3,1540;28,691,1541;3,1542,9,3,1543;10,1544,74;10,1545,74;13,1195,1546;13,803,1547;3,1548,9,3,1549;3,1550,9,3,1551;18,1552;26,416;10,1553,34;10,1554,155;8,1555;8,1556;28,243,1557;35,1558,3,1559;18,1560,1561;17,1562;10,1563,34;10,1564,41;28,243,1565,356,1283;17,1566;20,491,1,1567,99,1568;18,1569;17,1570;28,243,738;17,738;28,384,1571;28,9,1572;28,691,1573;10,1574,74;17,1575;10,1576,34;8,1577;13,482,978;13,485,1578;13,603,397;12,1579;9,1580;13,803,1581;10,1582,200;27,455,447;28,1583,1584;14,1585,1586;3,251,9,3,1587;10,1588,74;18,1589;27,485,1590;12,596,366,969;13,803,1591;17,1571;13,803,1013;10,1592,41;10,1593,143;17,1181;17,1594;10,1595,34;13,412,385;13,482,851;10,1596,34;24,1597;13,491,1598;24,1599;25,1600;2,1601;17,1602;26,1602;10,1603,150;17,790,437;28,384,1604;17,1605;17,885;17,1606,1;13,491,392;13,465,1607;31,416;17,412;28,501,1608;13,665,747;13,428,1609;13,365,552;17,425;26,103;19,833,1610;2,706;28,691,1611;13,478,1612;10,1613,366;10,1614,34;10,1615,34;13,485,466;10,1616,150;13,428,1617;24,1618;10,1619,34;10,1620,34;17,890;24,1609;24,1621;24,1622;24,1623;13,792,78;10,1624,1;10,1625,34;17,1626;17,1627;13,428,1230;31,851;17,1628;13,428,1629;27,428,1442;10,1630,150;13,538,492;27,1631,1632;27,485,1633;28,384,550;31,1634;13,428,1635;13,603,1636;13,428,1637;10,1638,136;10,1639,136;18,757;29,1640;12,1641;14,1642,1643;17,1644;13,447,396;13,491,1645;13,845,1646;10,1647,587;17,1197,437;24,1648;28,9,1649;10,1650,41;10,1651,136;25,706,171;17,1172;13,256,396;28,384,1038;24,1645;13,428,1652;13,552,1653;10,1654,34;28,9,1655;24,1656;10,1657,155;10,1658,74;10,1659,366;10,1660,155;10,1661,155;10,1662,366;8,1663;10,1664,136;13,455,1665;24,1666;28,691,103;31,689;10,1667,74;10,1668,41;17,1578,859;10,1669,136;26,722;10,925,34;16,1670;29,1671;17,1672;24,1673;8,1674,1675;36,1676,9,1677;8,1678;8,1679;37,1680,1681;29,1682;17,1683;17,1684;17,1685;13,447,1686;10,1687,587;25,1688;29,1689;10,633,1;13,428,1690;27,81,892;17,1691;28,243,424;10,472,136;24,1692;13,447,1693;10,1694,9;24,922;17,1584;17,1695;24,1696;24,1697;24,1015;13,81,1252;17,807;17,1698,859;17,1699,72;17,1700,437;24,1130;27,78,1701;8,1702;17,1578;28,1488;19,667,1703;10,1704,1;28,1340;17,1705;17,1706;17,1707,437;28,384,1708;17,1709;19,499,1710,93;10,1711,136;17,1712;24,1713;13,450;2,1714,1715;19,1716,1717;24,1718;17,1719;13,991,1720;8,1721;28,243,1419;25,1722,437,7;10,1723,9;8,1724;8,1725;36,1726,9,1677;8,1727;10,1728,136;10,1729,74;17,1730;24,1731;25,9,9,1732;2,9,1733,1;26,1578;19,667,1734,93;17,1735,391;28,691,460;13,1736;28,691,45;13,491,1283;28,9,1737;19,499,1738;12,1739,366;24,1740;28,1741;24,1742;24,415;10,1743,34;10,1744,136;10,1745,74;17,1746;13,1747;13,428,1748;29,1524;31,460;28,780,465;17,1749,680;10,1750,74;10,1751,74;29,1573;24,1752;13,1753,1754;24,1755;24,1756;24,1757;13,478,1758;10,1759,41;13,365,1760;13,1761;29,532;17,1762;16,1763;14,1764,1765;14,1766,1767;10,1768,34;10,1769,34;28,9,1770;10,396,1;24,1771;26,1772,437;13,478,1773;29,1774;10,478,143;28,243,1775;13,1776;10,1777,34;10,1778,34;13,412,251;13,665,313;2,1779,1780;10,1781,136;24,1782;24,1783;28,1583;28,9,1784;27,78,9;10,1052,74;13,447,24;26,491,391;27,412,985;8,1785;13,485,1786;10,1787,9;10,1788,1;28,243,1206;17,24;27,26,1789;13,81,610;18,1790;13,491,787;28,384,873;13,412,1182;17,1791;18,1792;28,691,1793;10,1794,136;13,552,1795;27,954,61;24,599;13,428,1602;23,45,1796,1797;8,1798;18,1799,9,1800;27,820,1801;19,1802,1803;13,485,1646;28,1804,1805;25,1806;28,793,195;28,793,1807;13,465,739;10,1808,74;10,1809,136;13,412,878;37,1810,1811;8,1812,1813;36,1814,9,1815;18,1816;13,478,459;17,1817;27,538,9;24,1818;17,1819;24,825;27,538,1820;24,1821;25,445;27,876,447;28,691,739;19,667,1822;17,1823;28,243,942;25,1824;13,465,45;24,879;24,1825;29,1826;10,1827,136;10,1828,366;10,1829,9;16,1830;18,1830;17,9,250;24,1523;13,696,1831;28,1051,41;13,1832;25,1833;24,1834;28,1835,1836;19,667,1837;2,1838;13,24,1839;13,491,1840;16,1841;13,803,392;25,1842;25,1843;19,1318,1844;13,428,579;28,1051,575;28,243,1845;2,1846,250;13,24,1847;24,1848;19,1063,1849,1850;16,152,123;38,1851,3,1852;3,1853,9,3,1852;8,1854;25,1855;26,1856;25,1857;13,485,1858;10,1204,136;17,1859;17,1860;25,1861;18,1862;13,491,1863;18,1864;24,26;25,1688,1865,1866;8,1867;24,1868;13,538,487;13,1869;10,653,136;10,1870,136;13,485,1871;27,81,459;2,1872;17,1873;18,1874;10,1659,1875;10,1876,41;17,946;13,485,413;27,485,1877;13,458,610;10,1878,1;28,780,1879;17,1880;28,243,1282;3,1881,9,3,1882;25,1883;25,1006,171;17,1884;27,820;17,1113;28,384,884;28,1051,1885;24,1886;24,534;25,1887;13,428,392;12,1888;18,1889;19,1890,1891,93;39,152,1892;10,1893,155;10,1894,136;17,1895;26,1896;18,1897;13,491,1898;27,1899,1900;13,803,1901;17,1902,560;10,1903,34;2,445,196;2,790,703;27,81,9;10,1904,34;27,78,1789;25,1905;27,428,61;24,1906;16,1907;17,1908;24,1909;10,1843,1;27,81,756;27,455,251;27,78,61;10,1872,143;24,1826;28,1910;24,1911;10,1912,366;13,485,396;13,482,459;27,1913,1914;13,1915;27,1916,385;12,1917;2,1918,1715;27,458,756;2,1762,171;10,1919,136;17,1920,198;27,24,61;19,499,1921;16,425;13,1149;12,425,1;18,1644;13,491,999;13,491,446;10,1922,136;18,194;17,1923;13,428,24;13,491,575;16,1924;28,384,1925;24,532;8,1926;8,1927;29,1149;28,384,1928;16,1929;13,447,767;13,485,1930;24,1931;27,1039,447;24,25;27,485,863;17,1932;16,1644;13,665,1933;19,667,1934,93;19,1935,1936,93;16,1937;19,1318,785;25,706,9,186;10,1938,200;19,1318,1939;13,428,1940;2,1941,198;28,384,549;13,256,445;24,1942;28,243,1943;10,1944,74;2,1945,171;2,1946,171;10,1947,1;13,1948;13,492;27,24,756;24,1949;13,491,851;18,1950;16,1951;13,455,1952;2,1953,171;10,1954,136;10,1955,74;17,1956;40,152,1957,1479;28,691,1570;28,9,1958;13,603,722;28,1051;24,1959;13,1960;13,78,978;13,412,1898;10,1961,34;10,1962,34;28,9,1963;2,1964,196,186;10,1965,74;10,1966,9;28,1166,9,356,1967;26,1968;27,81,445;10,1969,155;10,1970,74;25,1971;31,103;13,482,757;17,1972;2,633;13,1973;13,81,478;8,251;37,1974,1975;2,1976,437,7;18,152,123,124;18,1977;17,1978;28,384,1979;19,1980,1981,93;10,1982,136;25,706;27,447,1983;18,1984;2,416,494;24,1985;29,1986;8,1987;13,428,1988;24,1989;17,1990;27,485,1991;25,1264;10,1992,34;13,167,1993;13,428,787;17,1994;25,1920;10,251,41;10,992,41;24,1995;13,818,466;13,412,1860;13,485,1996;17,1997;13,478,985;10,1998,136;10,80,587;10,1999,41;18,2000;16,2001;10,2002,366;24,2003;24,2004;29,2005;17,2006;10,922,136;13,845,465;12,2007;28,2008,1879;13,428,2009;13,803,2010;10,2011,136;17,2012;10,2013,41;10,2014,74;12,2015;26,251;24,2016;13,428,2017;24,2018;2,2019,171;29,1010;24,2020;26,2021;29,2022;28,396;10,2023,74;24,2024;13,485,2025;25,2026;13,492,2027;17,685,2028;2,1351,198;13,478,610;10,2029,74;24,2030;16,2031;28,243,2032;16,1333;24,1237;18,2033;24,2034;24,385;17,667;27,458,2035;24,2036;24,2037;13,1326,757;24,2038;31,757;13,81,2039;13,538,2040;13,365,1024;25,2041,859,186;13,491,919;27,485,1442;24,2042;24,2043;13,428,2044;13,485,424;25,2045;13,2046,671;10,2047,74;13,2048;17,2049;16,1478;13,428,2050;27,485,2051;17,1500;13,2052,103;24,2053;10,2054,74;18,392,2055;13,2056;10,2057,34;10,2058,136;2,2059,560;19,667,2060,93;28,691,654;8,2061;13,2062,1105;17,150,714;25,1006;29,849;10,2063,143;13,2064;28,243,2065;10,757,41;13,485,851;17,9,72;17,563;2,5,198;18,2066;20,2067,1,136,99,563;10,1971,1;12,2068;24,2022;29,1666;13,491,2069;10,1195,9;10,2070,74;8,2071;8,2072;3,2071,9,3,2073;36,2074,9,1677;36,2074,9,2075;13,26,2076;28,243,2077;28,384,103;16,1302;16,2078;28,9,81;28,691,2079;27,638,2080;10,2081,1;16,2082;24,498;13,45,2083;17,622;26,2084;13,428,2085;13,485,1076;19,667,2086;17,1920;10,2087,1;25,633,171,186;17,2088;17,2089,250;12,2090;19,1318,2091;19,1318,2092;13,2003;10,2093,74;10,2094,1;8,2095;27,825;18,2096;19,2097,2098;19,2097,2099;19,2097,2100;19,2097,2101;28,384,552;28,384,480;28,9,892;26,2102;28,9,2102;28,9,2103;19,1318,2104;10,2105,41;29,2106;17,2107;27,428,2108;10,2109,136;18,2110;8,2111;8,2112;17,2113;10,2114,1;13,2115,757;28,9,1135;31,2116;20,256,1,136,99,103;17,790,250;18,2117;10,2118,136;10,872,136;26,1181;10,2119,34;13,702;18,2120;19,1318,2121;10,2122,34;29,2123;17,146;10,2124,200;28,243,2125;10,2126,74;10,2127,136;10,2128,34;2,2129,196;29,2130;28,793,874;24,2131;20,104,1,2132,99,2133;25,841,9,186;16,2134;17,1700;13,2135;24,1331;28,691,2136;10,2137,2138;19,653,2139,93;19,667,2140,93;18,2141;18,2142;13,412,1135;17,2143;17,243;13,538,78;6,2144,2145,2146;17,2147;10,2148,74;41,2149;17,2150;17,2151;12,2152;27,485,2153;28,9,2154;13,428,2155;26,2156;13,428,954;17,424;17,2157;17,2158;13,412,146;18,2159;28,384,2160;10,801,1;10,2161,136;15,845,2162;27,803,1914;27,1597,61;27,1439,787;17,2163;17,2164;8,2165;8,2166;13,520;17,2167;8,2168;31,2169;13,1666;17,2170;13,485,2171;37,2172,2173;13,1085,1819;10,2174,34;10,2175,34;17,590;12,2176;25,2177;31,478;10,2178,74;13,45,2179;2,2180,2181,7;17,1181,859;10,2182,34;10,2183,74;18,2184;10,946,136;8,2185;28,2186;18,2187;29,826;28,691,2188;10,2189,200;28,691,152;10,2190,34;31,1146;25,2191;0,2192,1,2193;20,2194,1,2195,99,2196;2,2197,171;25,2198,171;17,2199;13,485,460;10,2200,34;28,384,757;29,2201;29,2202;8,2203;29,2003;13,428,507;17,2204;17,1181,798;24,2205;25,2206,171,7;17,410;27,45,2207;13,485,243;10,1931,136;28,691,2208;10,2209,74;27,256,2210;12,2211;17,2212;19,447,2213;17,610;27,455,2214;24,2215;19,499,2216;28,1051,2217;17,2218;10,2219,200;28,691,2220;17,2221;17,1178;17,2222;27,45,845;18,2223,2224;17,2225;17,2226;10,2227,1;10,2228,74;17,483;13,803,2229;27,2230,2231;24,2232;29,581;10,807,74;29,2233;10,2234,2028;25,445,171,7;13,2235,396;27,2236,2237;28,384,491;26,863;10,847,136;27,954,2238;17,2239;13,482,1152;24,1385;17,2240;29,2241;29,2242;19,667,2243;8,2244;24,2245;14,397,2246;10,2247,74;14,2248,2249;15,2250,2251;25,706,437,7;10,2252,41;10,2253,41;10,2254,41;20,803,1,2255,99,1340;2,2256,171;16,2257;10,2258,366;10,2259,366;17,2260;13,603,428;17,575;27,485,787;19,499,2261;10,2262,1;29,2263;12,2264,366;28,691,2265;10,2266,1;17,2267;17,2268;22,2269;17,2130;10,2270,136;17,2271;10,2272,74;17,2273,2274;10,2275,155;10,2276,155;18,2277;17,840;28,243,2278;17,2279;17,80;10,2280,714;24,2281;24,335;10,2282,2283;17,2284;17,2285;10,2286,136;16,2287;29,706;13,256,103;13,44,445;13,491,2288;29,2289;26,2290;10,2291,136;10,2292,155;42,2293,1044,2294;42,2295,1044,2294;8,2296;3,2296,9,3,2297;18,2298;3,2066,9,3,2299;10,2300,34;10,2301,34;10,2302,34;4,2071,9,3,2073;36,2303,9,1677;17,1762,680;12,9,366;28,243,2304;26,2305;27,465,2306;27,458,428;31,2307;18,2308;28,691,1749;22,425;10,126,150;8,2309;16,2310;6,2311,2312;37,2313,2314;10,2315,2138;10,2316,136;13,412,2317;28,384,2318;10,2319,2320;28,243,2321;8,2322;20,2323,1,41,99,2324;24,2325;10,2326,136;28,605,2327;13,465,2328;13,803,851;27,485,575;2,2329,171;25,2330,171;10,2331,34;19,499,2332,93;28,243,2333;18,2334;10,2335,136;28,384,5;10,1949,136;17,2336;28,384,638;13,485,2337;19,499,2338;29,2339;31,480;29,2032;10,2340,34;10,2341,34;8,2342;3,2342,9,3,2343;28,1005;10,2344,136;17,1604;10,2345,34;25,416,437,7;13,1376;10,2346,1;2,2347;17,2348;17,2349;36,2350,2351,1677;8,2352,2353;24,2354;13,2355;3,2356;8,2356;26,878;13,482,24;10,2357,155;25,2358;18,2359;3,2360,9,3,2361;8,2362;10,2363,587;13,492,2364;24,2365;13,428,757;13,696,1015;13,2366;17,2367;19,653,2368,93;19,667,2369,93;27,447,2370;10,2371,74;10,2372,143;5,2373,2374,2375;10,2376,1;10,2377,1;10,2378,366;10,2379,9;17,2380;27,455,2381;24,2382;28,384,2142;18,2383,2384;19,667,2385,93;13,485,42;15,24,2386;27,256,2387;16,2388;16,2096,2389;10,2390,41;10,2391,41;28,9,2392;27,485,2393;28,243,2394;4,2395,9,3,2396;4,2397,9,3,2398;4,2399,9,3,2400;4,2401,9,3,2402;4,2403,9,3,2404;12,2405;41,2406;12,2407;10,2408,2138;24,45;17,747;10,2409,1353;10,2215,34;29,1949;10,2410,136;29,1335;10,2411,1;13,482,2412;10,2413,9;18,716,123,124;13,24,103;17,2414;18,2415,123,1479;28,691,2416;13,1362;13,428,2417;2,2283,171,7;16,2418;29,2419;18,2420;10,2421,136;10,2422,34;36,2423,9,1677;17,2424;29,126;13,803,2425;16,2426;25,1779;17,1770;2,2427,437,7;2,931,437,7;29,1130;25,9,437,7;2,633,171,7;13,428,2428;28,384,251;16,716,123;26,2429;13,42,1456;10,2430,34;28,243,2431;17,2432;2,2433,703;18,2434;19,667,2435,93;12,2436;26,2437;18,2438;18,2439;17,9,2440;17,2441;3,2442,9,3,2443;13,492,2444;10,2445,9;28,243,5,356,2446;16,2447;18,2447;2,739,171;17,729,1;24,2448;13,26,43;13,673,2050;10,2449,74;24,2450;13,428,2348;10,2451,74;16,2452;28,605,954;16,2453;18,2453;16,2454;8,2455;8,2456;17,2457;25,2458;18,2459,123,1479;27,45,2460;18,2461;10,2462,136;10,1395,74;10,2463,74;10,2464,1;10,2465,74;10,2466,136;18,2467;8,171,2468;18,2469;36,2470,9,2471;10,513,136;10,2472,200;13,428,499;18,2473,2474;10,2475,136;28,243,790;13,428,2476;3,2342,9,3,2477;10,2478,41;10,2479,1;8,2480,387;10,2481,2482;27,412,2483;17,2484;17,2485;24,2486;10,2487,74;10,2488,366;10,2489,34;13,428,1005;43;28,9,1584;27,803,1146;10,1868,9;13,845,445;13,26,2490;31,2491;24,2492;16,392,123;25,2493,437;2,633,171;17,1168,560;8,2494;10,2495,136;25,1779,171,186;25,633,171;13,428,2496;13,1124,2497;27,24,2498;10,1622,136;17,2499;28,243,2500;24,1750;17,1203;10,2501,200;20,491,1,150,99,2502;28,384,2503;26,2504;17,1609;13,412,2505;10,2506,74;31,466;8,2507;17,2508;27,365,756;10,2509,74;16,2510;10,2511,136;20,491,1,150,99,1135;18,152,2512;13,491,2169,2513;13,803,2514;17,2515;29,2516;10,2517,1;12,2518;28,243,954;17,2519;24,2520;10,2521,366;8,2522;10,2523,74;18,152,9,124;2,1779,437,7;13,412,2524;8,2525;8,2526;8,2527;13,1124,2528;18,2529;17,2530;17,2531;17,2532,680;17,2533;28,691,2534;28,691,396;28,1488,2535;8,2536;8,2537;8,2538;6,2539,9,2540;6,2541,9,2542;6,2543,9,2544;6,2545,9,2544;6,2546,9,2547;6,2548,9,2549;3,2550,9,3,2551;13,485,43;2,1006;3,2552,9,3,2553;10,2554,136;10,2555,1;23,2556,116,2557,99,2558;10,2559,2560;13,1124,2561;17,2562;10,2563,136;20,256,1,2564,99,2565;28,384,2566;10,2567,2568;17,2569;17,2570;18,2571;3,2572,9,3,2573;17,2208;17,2574;27,491,2575;10,2576,9;41,2577;16,2578;25,2579,9,7;10,2580,41;10,1226,41;3,2581,9,3,2582;18,2583;28,243,563;12,2584;13,1761,2585;13,482,1749;13,1326,2586;17,1749;17,40;10,2587,34;10,2588,1;17,2589;13,317,103;28,243,2590,356,2591;37,2592,2314;10,2593,41;18,2594;29,1389;3,2595,9,3,2596;10,992;3,2597,9,3,2598;28,243,2599;13,491,2600;12,2601;17,485;19,499,2602,524;19,499,2603,524;28,691,2604;13,803,2605;24,1943;8,2606;14,2607,2608;24,2609;13,491,2610;13,491,1005;10,2611,74;10,2612,74;12,2613;28,691,24;8,2614;31,2615;8,2616;13,991,2617;18,2618;26,563;12,2619;2,9,391,7;12,2620;13,455,2621;10,2622,34;14,2623,2624;19,499,2625;17,2626;10,415,34;26,410;28,243,2627;24,2628;13,538,2629;12,2630,714,969;8,2631;8,2632;10,2633,74;28,243,2634;18,2635;27,485,2636;12,2637;13,2638,2639;26,1045;27,485,2640;10,2641,155;27,491,61;10,2642,366;10,2643,366;18,2644;10,2645,155;24,2646;10,2647,136;13,455,491;12,2630;28,691,507;12,2648;12,2649;12,2650;28,243,2651;12,2652;28,384,575;20,638,1,2564,99,2653;20,638,1,2654,99,767;28,691,1870;10,1389,136;8,2655;28,691,901;13,803,757;28,243,2656;13,803,790;3,2657,9,3,2658;18,2659,2660;3,2661,9,3,2662;18,2663;17,2664;23,45,2665,2666;23,45,2667,74;10,2668,136;13,447,954;10,898,136;28,243,2669;27,1085,2670;17,2671;36,2672,9,2673;6,2674,9,2675;10,2676,41;13,2677;17,2678;29,2679;9,2680;9,2681;28,243,2682;18,2683;16,2684;24,2685;39,2686,1449;39,2687,2688;39,2689,2690;39,2691,2692;17,2693;16,2694;29,2695;24,2696;17,2697;27,2638,2698;24,1573;24,2621;18,1321,123;8,2699;8,2700;13,491,460;18,2701;13,803,481;10,2702,34;19,499,2703;37,2704,2314;16,2313;8,2705;24,2706;39,2707,2708;39,2709,2710;39,2711,2712;3,2713,9,3,2714;3,171,2715,3,2716;3,2717,9,3,2718;17,1044,560;10,2719,136;25,2720;2,2721,2722;17,2723;17,2724;13,428,2725;10,2726,74;20,638,1,2727,99,2728;19,2729,2730,93;2,9,9,1;10,2731,155;10,2732,136;10,2733,136;13,0;10,2734,136;10,2735,136;10,2736,587;3,2737,2738,3,2739;3,2737,2740,3,2739;3,2741,9,3,2739;8,2741;8,2737,2738;8,2737,2740;36,2742,2743,1677;13,78,487;10,2744,34;10,2745,150;10,2746,34;10,2747,155;24,2748;29,2749;17,2750,859;10,2751,34;28,2752,445;10,2753,136;29,2754;29,2755;8,2756;36,2757,2758,1677;36,2759,2760,1677;36,2761,9,1677;10,2762,366;10,1130,366;40,2066,2763;29,2764;17,103,560;13,485,2765;4,2766,9,3,12;34,2767,2768;10,2769,155;13,491,396;8,2770;10,1688,1;10,2771,136;10,2772,74;15,2773,2774;13,1152,2775;13,485,858;14,2776,2777;6,2778,2779,2780;6,2781,2782,2780;19,499,2216,93;19,499,2783,93;13,428,2784;14,1868,2785;16,2786,123;10,892,136;28,780,424;18,2787;13,24,396;10,2788,9;13,485,2789;12,596,366;10,708,136;18,2790;10,2791,200;13,803,954;28,691,2792;13,485,1099;10,2793,155;10,2794,136;10,510,41;13,1124,787;27,485,2795;28,243,2796;13,428,2797;17,2798;13,256,2130;17,9,2799;17,2800;26,2800;28,384,2801;28,1488,2802;10,2803,155;10,2804,143;17,1182;28,691,445;31,1863;26,1932;31,1932;10,2805,136;13,1045;17,45,2806;10,2807,136;27,1124,2808;28,691,575;18,716,123,1479;2,1976,9,186;13,485,2809;15,1501,2810,131;27,485,2811;31,1570;10,2812,136;42,2813,1920,1038;27,485,447;27,552,2814;8,2815;17,2816;27,2817,2818;12,596,2819;13,2820,1451;13,492,2821;12,2822;18,152,2823;18,152,2824;10,2825,74;10,2826,74;13,428,2827;10,2828,136;13,455,460;10,2829,136;28,691,1085;17,1402;13,1355,424;18,2830;13,485,2831;17,480;27,45,2832;18,2833;10,146,143;15,2773,2774,60,2834;40,2835,1113;17,2836;17,9,391;25,2837,437,2838;17,2839;28,243,2840;10,2841,1;3,171,2842,3,2843;20,2194,1,2844,99,2845;28,691,2846;28,243,2847;10,2848,34;12,2849;24,2850;24,2851;24,2852;24,2853;24,1762;24,2854;24,975;24,2855;13,803,2856;19,499,2857,524;17,2858;12,2859,366;10,2860,74;13,482,575;28,691,847;27,538,2861;13,638,954;28,691,2862;17,2862;10,830,34;28,691,1013;10,2863,41;17,2864;14,1530,2865;21,909,2866;16,2867;10,2868,34;10,2869,34;10,2870,155;10,2871,155;31,152;13,803,978;24,2872;18,2873;17,152;44,2874;28,384,507;13,485,1005;16,2875;28,384,2876;14,2607,2877;17,2450;25,2878,437,7;28,243,2879;13,803,103;8,2880;17,2881;28,2882,738;26,2883;17,2884;29,2885;28,691,2886;18,2887;12,2888;17,2889;13,803,460;10,2890;8,2891;12,2892;12,2893;28,691,2894;31,1005;17,2895;18,2896;16,2896;3,2066,9,3,2897;4,2066,9,3,2897;18,2898;8,2381,2899;28,691,167;8,2900;18,2901;10,2902,74;10,2903,136;10,2904,74;36,2905,9,2906;4,2907,9,3,2908;34,2909,3,2910;28,243,671;13,807;10,2911,34;10,2912;10,2913;45,2914,3,2915;28,691,2916;10,2917,136;28,243,667;13,1355,863;17,2918;13,803,2919;28,1583,445;28,926,1762;17,2920;12,2921;45,2922,3,2923;13,455,1168;10,2924,136;28,243,2925;17,169;17,2926;13,482,2927;10,2928,155;17,2218,437;28,384,2929;17,2930;34,2931,3,2932;12,2933;12,2934;31,2935;18,2936;18,2937;12,2938;13,167,460;10,2939,200;18,2940;20,2941,2505,9,99,2942;9,2943;9,2944;38,2944,3,2945;10,2946,34;10,2947,34;10,1113,34;10,2948,34;10,2949,74;28,243,2950;10,2951,155;8,2952;8,2953;16,2954;10,2955,136;13,485,2956;24,2957;29,2958;27,449,1040;18,2959;10,2960,41;10,1766,41;10,2961,34;16,2962;24,2062;16,2963;16,2964;10,2965,136;8,2966;28,9,2967;10,2968,136;20,2969,1,2970,99,2971;10,2972,9;8,2973;10,2974,143;22,2975;10,2976,155;10,2977,155;16,2978;10,2979,155;20,1756,1281,2980,99,2981;16,2982;18,2983;10,2984,136;10,2985,136;27,2986,455;18,2987;19,2988,2989,93;14,2990,2991;10,2992,136;16,2993;16,2994;16,2995;19,499,2996,524;10,2997,136;18,2998;29,2999;10,2381,74;18,3000;24,44;24,3001;29,3002;26,3003;27,3004,3005;16,3006;18,3007;18,3008;18,3009;18,3010;16,3011;16,3012;16,3013;10,3014,136;18,3015;18,3016;16,3017;18,3018;18,3019;18,3020;16,3021;18,3022;16,3023;26,24;45,3024,3,3025";

const $scriptletArglistRefs$ = /* 13255 */ "364;986,1661;1659;100;1537;26;82;427,570;26,436;2814;422,436,747,1089,1090;1615;1094,1993;1661;1267,2402,2403;26,422,423,424;1662,2065;1615;26,893;1615;1615;1615;2649;3304,3305;28,347,462,469,1865;384,2599,2600;364,462;1342;512,1663;1615;3088;1012;1984;394,1615,1747;100;485,1090,1155;26;901;1615;1615;1615;2649;1615;2888,2889,2890,2891,2892,2893,2894,2895;26;26,347,405,409,410,411,412,1661;436,954,955,956,957,958,959;1615;2836;986;347;1659;436,676;630;3103,3104;1167,1168;1661;986;1788;26,347,436,1663;344;95,96;26,2266;1738;100;371;100;371,375,405,787;95,392;436,2628;180,695;26,436;893;26,397;3589;986;332;1615;26;26,397,986,1662,1761,1762;422,436,747,1184,1660;3463;26,462;1738;26,747,1185;26,335,347;585,676;1615;344;931,1258;119,131,524,667;2636;1337;1615;776,1498;26;28,1664;1615;364,371,436,484,747,1371;100;28,29,363;207,208;2361;3381;29;617,2020;1537;1662,2065;1757,3424;1662,2065;1665,2738;371,403,404,1659;119;1129,3463;1615;638;462;26,1032;2116;3508;344;1615;1785;95;95;1615;1786;1615;1337;1615;26,436,986,1549,1550;26,95,436,1536,1537,1538,1539;574;364,371,436;371,436,462,853,1073,1074,1075,1662;347,364,612;26,405,1537;791;1615;26;1789;1615;2741;436;1265,1615,2471;1615;718;3545;1615;1396;347,428,456;1615;1257;1175;1537;986;1984,1985;1663;1998;26,95,436,1536,1537,1538,1539;1268;2084;1615;379,1626;26,347,744;26,1592,1611;986;1615;2745;26,27,28,29;1036,1615;524;26,424,425,426,798;1615;130;1267;2098,2099;593;554;26,676,2414;26;26,397;3198;347,815;371;100;893;889;3021;440;822;1094,1347;1745;1224;1663;26,364,436,526,569;893,1138,1179,2523;429;2519,2520;574;372,986,2621;26;770;1094,1431,1663,2140;26,3016;1576,2609;986;1738;90;1738;3405;1738;341,342;397,398;574,608,1637;352;95,1726,1727,2322;2120,2937;26;314,1264,1615;694,2326;371;2493,2778,2779,2780,2781,2782;436;392;112,1922;1496,1497;1615;2000;1738;3072;2280;2291,2421,2487;1373;26,1761;26;358,576,808,809;1367;335;26,422,436,747,1184,1660;436,1182,1183,1661;353;893;1661;1537;3206;392,2351,2352;442,596;344,1615;119,131,344,524,601;1241;371,482,986,1537;1261,1615;1337;1632;26,1321,1660;1537;26,760,1660;574,1269,2256;1661;1337;1333;1337;538;347,364,483,612,837;1195;1615;100;1727;893;26,2985;574;29,528,574;574;1750;1139;1139;1139;574;29;26,606,1248;547;399,1097;3098;1094,1702,2140;3103,3104,3439;274,275;437;347,437,462;3051,3052;2453;1615;1537;1615;2712;698,699;26,893;436;3497;456,574,1178;843;574,1166,1537,1637;676;1615;893,1466,1467,1468;3408,3409;1687;1537;1663;986,1118,1119;1739;1615,1738;1615;1940;95;26,822,1662,2024;1727;898,1660;1265,1615,1621;669;2774,2775;26,424,425;1615;112,688,1984,2213,2790,2791,2792,2793;1615;3303;1537;462;26,1964;2448;158,159;122,123,2415;371,437,462,848;100;347,364,612;26;-385,-2600,-2601;26;26,376,462,558,612,694,742,757;3211;3399;1323;26,776;773,1171,1615;28,664,2885,2886,2887;29,617,1825;893;498,1107;528;1296;1615;26;403;26,986,1662,1674;462,1537,1662;1615;1892,1893;462;1738;26,399,1666,1861;986;1537;158;436,1660;1429,1430;26,405,443,444,445;461;2749,2750;1660,1661,1662,1665;2542;2542;2966,2967;26,28,379,585;26;773;1592;26,1661;574;26,45,46,47,48,49,50,986,1537;445;347,364,462,612;1662;26,485,1155;485,1090;1024;99;1947,1948,1949,1950,1951;1098,1099;1660;112,3097;1727;383;1786;1662;425,798;425,798;55,56,1260,1615,1738,2358;2163;366;352,1738;596,1187;344,1728,1729;475;26;26;1615;100;893;51,52;26,986;2001;1537;1537;214,344;676,1662,1667,2784,2785;893;574,1645;1662;436,747;574,1595;893;51,52;26,574;574,606,710;986;462,526,2990,2992;638;1687;427;1094;26,436;1046;340;2797;1118;1277;450,574;1615;1347;1615;1615;29,119,574,2170,2171,2172,2173;1738;1750;1179;1543,1564,1565;2374,2375;574;26,462,1663;893;893;1615;344;58;26;574;344;1615;1659;776;26,574;482;893;2669;29,574;26;1635;26;26,1687;436,1494,1495,1496,1497;2704;824;1662;1687;26,1687,1688;1663;2505;26,436,1094;1153;1727,3559;26,462,1660,1662;392,1713;1246;1721;1964,2674,2675;893;482;3056;1615;3035;26,556;397;26,1537;26,45,46,48,49,50,1537;26;26,986,1761;456;1739;1082;363,371;1246;1130,3463;1323;893;81;28,986;436;1659;617,1601,1602;26,376,585,676;462;1980;397,940;1661;1615;436,676;986,1671;1659;314,354,1264,1616;3431,3432;1739;830;392;1662;26,1537;347,719;1636;1537,3197;2858;371,2393;347;986;986;1337;338,339,340,1257,1615;3584;893;1615;95;2039;26,1663;437,1660;340;456,528,1016;1615;1615;3112;3112;893;26;2852;1734;1697;927;352;851;3274,3275,3276,3277,3278,3279,3280,3281,3282,3283;405;26,399,1097,1684;422;574;412;1783,3558;26,364,531,553,554;416,553;416,553;26,556;317;2031,2032;574,2731;1659;29;3552;574;986;1662,2065;162;2198;26,1660;2464;2198;2198;620;2198;2198;2198;573;26;893;2198;51,52;51,52;1738;1614;112,1809,3610;649,1738;1615;100;371,436,747;26;381;700,701,702;583;1721;1833,2401;26,556;462;1687;3608;26,2418;371,376,422,436,483;26,1771,1773;2603;1663;2256;95,2322;2213,2790;2649;26;405,1664;26,390,391,1660;51,52;436;1661;26,390,391,1660;26,390,391,1660;26,390,391,1660;774;2598;95;2026;26;2751;1739;317,1409,1410;344;26;1661;371;3544;2609;1497;574;482;376,462,1007,1008,1009,1662,1663;1750;26,556;364,371,436,462,569,848;719;375,1698,1699;2853;647,648,1662;26,1661;972;1615,1738;26,455;363,574;437;26;51,52;1470,1471;1615;1663;347,364,1663;1615;1615;1615;1615;1615;1615;1615;1615;1615;1704;617,3223,3224,3225,3226;459;2609;1739;1923;416;617;574,893,1633;574;399;2291;585,676;585,676;585,606,676;585,676;1673;1486;893;2557;415,1107,1108;1537;26,347,375,462,536,537,538,539,1659;347,371,422,436,542,747,1661;482;100,1479,1480;949;3560;967,977,2301;1615;2946;1615;1046;344,1258,1615;26,399,1666,1861;638;1323;436,747;1738;29,397,498,528,574,2037,3309;1662;1661,1671;732;450;1615;1195;1662,2065;462,928;26;26,436,462,747;1030;1401;1262,3038;1739;2802;1615;26;26;1661;1495;1411;3199;65;1246;761,2502;2928;26,707,986,2066;1537,1662;354;887;347;1661,1666;26,425;1667;1660;26,1368,1690;2011,2012;1738;26;405,1660;1664,1665;26,399,462,585,986,1495,1537,1660,2935;477,478;662,663,664,665;26;381,662,663,897,1537,1662;2313;2003;26,27,28;119,131;335;1830;1830;26;112;26,1188,2321,2327;1037;1629;1660;1537;533,1169;162;462;1839;1618;1734;666;1615;2942,2944,2945,2946,2947;3440,3441;893;436;1207;26;2274;347,815;2557;26;51,52;26,934,935;934,935;574;574;574;26,676,1537,2414;3530,3531,3532;1218;382,405,596;574;1660;2261;95,815;399,1537;1278;51,52;437,852;893;129,3082;347,990;436;1537;212,213,2118,2119,2120,2121;1491;100,430,431,432,433,434,435,436;399;26,3100,3468;2128;381,410,482,986;1537;51,52,1537;1664;51,52;986;886,2033;119,878,883,884;595,596;26,456;26,1661;415,447;893;1368,1369;51,52;676,986;51,52;528;26;26,986,1537,1865,1923;986;1316;26;26,1661;633;2991;89;701,2977,2978,2979,2980;436,483,747,1663;26;26,364,436,1660;436,747;776,1498;2513;3487;371,468;1734;3570;344;1738;1537;1661;617;347;2069;554,921,1286,1537;617;29;1842;26,2410;617;26;617;893;1660;3449;1537;1832;1414;3509;358;1670;381,1006,1661;1662;100,1479,1481;2037;574;340,893,1337;609;100;934,935;415,567;26,1537;1661;386,388;26,1148,1537;1659;1677;371,436;1615;1846;893;893;484,1660;1615;371,971;1310;2956,2957;1615;2666;51,52;706,858;392;3212;1024,1025,1026,1027;317,1696;26,2682;643,946,3260;3217,3218;1738;340;1663;462;26,29,1537;1377;776,1498;574;1173;568,594;1036,1615;612,1037,1659;436,676;776;1537,1662;1662;1615;671;747,896;436,747;436,1494,1495;1964,2674,2675;422,424;26,986;26,397,986;399;893;887;2931;364;1660;1615;26;893;51,52;574;26,397,986;26,397,1537;2715;986;26;26,397,1537;1537;1738;26;334;26;893;574;2321;28,1715,1716;573;1727;1703;1495;371,570,724;100;986;1672;354,1615;26,986,2440,3011,3012;1647;986;986;1537;383;2956;450;567,2408,2409;574;1469,1470,1471;1660;95,3315;344;436,1471,1494,1495;383;26,1537,2483;1739;574;2189;438;574;986,1662;26;1089;535;354;574;816,817,1537;26,1600;1661;688;26,986,2440,3011,3012;1537;1660;1687;893;1661;1664;1283;2000;26,27,676,1662,2950;436;2362;223,224;2094;449;2267;1537,1633;467,574;1956,1957;416,531,554,574;893;363,371;26;893,1453,1555;893;596;498,528,574;498,528,1777;1663;2858;382,384,761,1645,3472;1537;1977,3577,3578;1495,1686;893;1662;3312;1243;893;1661,1662;26;26;415,574;26;1667;1246;1537,3229,3230,3231,3232;436,1439;893;915,916;51,52;893;3285;876;893;95;26,416,574;1537,1663;664;26,676,986,1537;2694,2695;1660;776;26,986,2440,3011,3012;574;1662;893;1537;564;29,371,1510;51,52;1537;1537;1615;893;1389;1661;1195;1094;574;26,1662;975;2122;804;26;1537;893;1269;802;413;1661;2164;437;26,364,531,554,555;26,364,553,555,799;26,364,531,553,554,555,556;2058,2059,3563;26,364,531,553,554;1698;1615;770;1243;282;358;2846,2847;2141,2142,2850;383;26;1660;1615;30,31,32,33,34,35,36,37,38,39,40,41,42,43,44;574;574;528,574,893;574,1241,1342;2431;29,528;29,556;574;29,528;1168;29,1697;574;528;462;26,1660;383;893;1179;26,940,1043,1964;26,1660;583;1662,2065;1662,2065;184,314,1615,1617;26,585,986;574,1637;29,574,1662,2037;986;574,893;3483;51,52;26;51,52;1466;1615;976;643;335;436;437;450,574;26,462;893;700,701,702;3321,3322;371;1744;1660;1207;2272;92,93,95,96;1057;347,675,676,798;1211;347,2988;574;1023;1537,1633;1239;1790;26,28,376,379,585,676;2466,2467;340;893;26,939,1663;394,1615;1615;556,2231,2232,2233,2234;65;2037;26,528,606,859,1530;436,747;1127;26,1772,1773;347,1661;1661;986,1537,3156;344;770;205,206;893;574;358;364;607;1660;26;26,460;574;893,1453,1555;711;893;1734,1916;1056,1615;1097,3382;585;29,536,3007;1662;893;1615;574;986;3328;1661;893;3594;95;2037,2321;1786;26,3468;26;2686;893;1839;1663;1778;893;344;482;26,347,1156,1661;893;1246;382,450,574;26;893;2200;986;1734;574;1886;1721;603,931,1615;26,1037,1665;893;1615;26;1243;26;1734,1738;574;1537;1795,3307,3308;26,1660,1661,1662;893;29;1469,1470,1471;574;574;26;450,574;445,731,1124,1125,1126;371;26;554;574;26;238;1615;364;1234;26;893;2206;2665;574;436;1210;794;1615;3411;1664;2857;1488,3417,3420,3421;26,445,731;1632;26,437;528;495;2048;1469,1470,1471;1469,1470,1471;1577,1578,1579;1448;3228;3107,3108;317,1046;3318,3319,3320;26,1491;436,747;1615;1662;1663;1637;2117;2903,2904;986;585,676;585,676;791;340,574,842;111;3401;2951,2952;1471;1661;436,676;574;26,1168,3436,3437,3438;893;1661;1738;893;2609;26,462,747,1185,1659;617,2315,2594,2595;1083;436,747,1547;371,525;893;526;1537;635,636;1667;486,1176;773;1668;1537;315,1615;818;392;2656;952,1537;26;26,1537,3331;26,1537;26,399,1666,1861,1862,1863;3599;965;1469,1470,1471;29;1044,1857;1615;1660,1661,1662;347,526;952;528;1440;934,935;1459;1660;1246;1360;1138;2101;1829;26,2783;1337;1723;26,986;29,574,1967;26,100,375,1661;574;347,381;422;1469,1470,1471;51,52;202,203;1469,1470,1471;1654;574;1269;983;1615;1342;397,554,574;65;934,935;26;893;1184;447,995,996;1384;574;1615;1667;436,747,1663;1751;1351;397,574;1195,1627,1628;1660,1667;2124;372;547,1659;893;371,522;26,375;26;51,52;1663;2460;920;354,357;26;1660;426,798;26,29,397,1537;26,28,376,379,585,676,760;1633,1687;26,911,912;3268;1687;1537;1615;371,436,747,748,749;26,1537,2449;1560;436;1469,1470,1471;26,825;893;412,663,1097;26;1291;-1369,-1370;1244;2754;1469,1470,1471;1469,1470,1471;26;986,1095;893;1259;1660;26;792,1471,1473,1474,1477;3266,3267;95;383,2062;893;893;1632;397,554;3238;2557;450,1212;416;51,52;802;371;574;596,1187;2951,2952;1663;2037;913;26,382;1166;2098,2099;893;554;574;574;26;26;1660;1743;893,1453,1555;1663;3269;26,424,425;445;1662;26;776;1660;986;1727;2176;2668,3556;3555;1537;585;514;585;1662;28;26,760,1272;986;235,236,1604;1613,1696;489;2285;1934;1660,1662;1663;26;676,1663,2201;26,986;822;2397;26,54;893;893;526,1662;893;985;986;1615;946;574;514;26,3468;770,1958;1661;986,1537;382,416,531;574;26;3499;26,1537;445;392;986,1661;1615;26;456,1661,1923;26,3200;1128;701,2977,2978,2979,2980;26,2514,2515;392,436,528,574,986,1375,1537,2975,2976;1315;3529;676;1660;26,397,1537;26;893;761;29;893;26,1661;2406;584,1537;347;617;1661;1660;26,528,1537;1537,3229,3230,3231,3232;986;2261;893;706,730;1537;528;1615;28,375,415,437,450,800,801;340,2191;392,1422,2386;1661,1662;405,1673;3611;3611;3611;3611;3611;574,1495;1615;2390;1469,1470,1471;1469,1470,1471;934,935;688;528;1663;986;376,1009,1662;381;26;2823,2824;1537;893;574;893;437;2138;1661;3041;2456;963;436;574;893;460;456,1664,1923;893;26;923,924;26,1368,1690;574;26,54;1246;1507;893,1179;574;1786;720;773;2341;26,416,574;29;893,1715,1716;893;1738;482;1662;405;2899;1738;445;893;596,859,946,1027,1187,1652;486;596,859,861,946,1027,1187,1652;437;931;893;1615;1745;1097,3382;511,512,513,1663;952;574;1715,1716;26,612;68,95,1554,2876,2878,2879,2880,2881,2883;656;1111;2488;946,2207;770;256;893;2619;392,1713;1615;893,1323;893;1207;1471;1662,2250;3493;1660;364;574;1127;2271;574;26;437,722,723,1663;436,1494,1495;356;26,986;26;2589,2590,2591,2592;893;372,802;26;574;1262,1615;512,513,1663;1388;95;2609;-27,-1538;95;1577,1578,1579;637;1738;743;747,1663;528;574;919;344;1662,1687;601;95;1037,1223;2761;1667,2269;1207;1469,1470,1471;1532;1661;436;2786;1032;747;747,1310,1663;436;486;573;574;2799;1662;1239;28;26,1368,1690;2488;2997,2998;1434;1661;371,462;450;2423;415;1313;1696;893;1496,1497;1615;381;1660,1661,1662,1663;462;2000;1663;1327;436;1615;150,151,1306;26;482;28,29;574;59,893,2578;975;1661;1660,1661,1662,1663;512,513,1663;26,1229;893;1221;1351;2629,2630;26;26,574,975,1662,2437,2438,2440;26,28,574;26,1025,1079;617;574;986;1551;1660;2902;1537;986;1661;1665;26;1615;893,1491;1838;1632;3473;986;26,986,2440,3011,3012;1537,1584;1615;574;1663;1615;3371;1246;3546;26;100,436,547;1053;1660;1660;2951,2952;26,1186;893;574;480,607,661;1094,1663,1993;533,2033;893,1440;893;1615;634;655;664;26;26;1610;1661;511,512,513,1663;1094,2148;1702;1025;2400;893;893;3338;1738,1747;668;2009;986;761;2278;1246;893;1661;617;652;1660;1246;26,527,676,986,1687;-27,-1538,-3490;1246;527;1246;1246;1246;1664;893;347,725;3058;921;1615;2609;1615;26,2660,2661;1776;893;1269;1615;2498;574;1195;887;371,986;439,440;28,1687;986;1660;893;358;2865,2866;26,29;26;26;574;3032;1230;842;1537;1663;1661,1662;445;574;1094;542,1367,1446;489;893;620;26,620,1612;3516;1664;1323;574;893;2924;1715,1716;664,2622;1632,1660;878;2030;375,1698,1699;29;375,1698,1699;2085;375,1698,1699;375,1698,1699;375,1698,1699;87;617;893;893;2334,2335;2620;1779;1659;1814;1734;893;893;1734;352;77;1115;1663;29;574;29,1697;585;574;574;574;1715,1716;574;1168;26;29,1697;574;26,28,29,3171,3172,3173;574,893;1168;2132,2216,2217;574;585;29;622;585;574,1696;574,1343;574;574;29;498;437;574;574;29,528,718;3153;1719;893;436;1661;893;1615;574;893;585;1577,1578,1579;1738;528;1615;26;26;1661;2198;26;2198;2198;1207;574;26,574,986,2440;893;776,1887;1702;1662,2065;1662,2065;1662,2065;372;1732;979;980;347;2198;1662,2065;2198;1574;1615;831;893;91;574;574;2198;26,54;1454,1455,1456;893;178,179;3430;100;1660,1661;26;2004;893;3558;2489;437;893;2435,2436;436,747,2091,2092;26;1663;1661;2504;1662;1738;1230;1660;347;1662,2487;1491;893;1580;1246;1739;2573;397;97,173;1615;1824;399,675;931,1615;3425;3486;294,295;29,528,986,1662,2037;1660;1411;1246;2073;616;95;617;2609;986;574;26;436,1566;436,747,1248;1663;436,1566;2951,2952;1097,3382;617;3024;26,943;392,512,893,1637;26;1537;3264,3265;617;397;26,924,1768;2534,2535;638;2753;528;364,484;470;528,952;26,2027;26;495;986,1661;26,893,986,1537,2043,2578;26,1660;26,484;1663;448;364;26;986;26,358,1250;1322;437;1354;397,1208;397,617,1208;424,495;1687;2607;2547;945;1734,1751;375,450;3492;340,893;1791;1662;1660;1060;1663;1179,1243;1211;832,833;1537;1664;26;1302;344;864;1747;3379;869;26,558,612,694,742,757;1274;312,1622,1750;26,1537;1537;850;893;1660,1661;2391,2392;1615;29;1660;893;574,893;26;26,1386;893,2298;-27;2611;1615;574,1186;893;893;2159;822,1375,1661;1665;1708;1599;352,3562;29;876;893;882;450;1118;26;2064;392,893,1358,1713;770;26;574;1715,1716;412;364;1720;1615;1663;1660,2840,2962;1312;617;776,1498;893;2609;471;462;893;2202;1615;376,462,1007,1008,1009,1662,1663;1615;1833;397,554;1738;1663;574;375,1698,1699;489,567,574,694;893;-365,-372,-437,-463,-570,-849;1660;1615;2608;95;352,1615;1686;986;796;29,528,893;893,1537;26,45,46,47,48,49,50,986,1537;3126;893,2834;1337;26,528,574;437;375,643,1212;26,462;574;26,363,494,495;574;554;450;574,710,2114;26,805;3130,3131;1510;382,462,528,574;462,574;463,464;26,364,376,377,3289,3290,3291,3292;26,364,376,377,3289,3290,3291,3292;26,364;26,364,376,377,3289,3290,3291,3292;26,364,376,377,3289,3290,3291,3292;26;26,364,376,377,3289,3290,3291,3292;26,364,376,377,3289,3290,3291,3292;26,364,376,377,3289,3290,3291,3292;26,364,376,377,3289,3290,3291,3292;551,1435;1524;585;26,676,1997;719;1727;1615,1833;2649;1143;893;1510;747;1401;2175;1734,2590;1292;332,773;498,528,1687,2573;1492;352;528;893,1046;574;893;1130,3463;383;26;986;893;688;3434;385;3148;706;2422;3194;1168;392,822,1389;2609;574;362;29;1510;1908;26;1495;986;383;1150;776,1498;893;585,676;3249,3250,3251,3252,3253,3254,3255;1738,3490,3491;1088;383;574;1537;1661;1663;1179,1243;363;2496;574;946,1310;1373;528;574;574;574,2715;2096;26,100;26;986,1869;2579;574;871;371,376,436,747,1207,1981,1982;436,609;26,436,747,1013,1094;893,1537,1608;436,747,1547;371,376,436;2073;416,1776;344;29,1638;26;2104;436,747,986;763,764;392;2614;1537;1495,1537,1660;893;363;1833;1094;893;1288;1615;1615;1615;26;1664;2762,2763;340;2852;1537;1661;26,379;922;392,1713;26,399,986,1861,1862,1863;26,585,676,2147;26,399,1666,1861,1862,1863;893;397,436,1269;1488,1489,1490;776;2082;1615;1249,1860;3085;29;853;1440;868;26,358,812;1179,2628;1347;1959;437,574;1246;2110;1537;26,708,1665;347,612;776,1553;893;574;1660,1661,1662;1471;1471;664,2840;2490;486,1510;2463;617,2135,3135;893;1105;560;347,381;405;893;371,382;514;2174;865;3448;743;450,608;643;2946;371;1604;2208;2963;29;381;1243;26,100;893,2612;2609;352,1738;2182;313,1264,1615;450,531;1661;3389;450;116;165,166,167,168,169;574,607,1661;986;552,641;1537;95;1687;436,1497,1585;574;1667;26,1014,1659;26,542,2245;450;1882;29,1497,1537,1678;574;1661;550,1662;100,403;26,1660;26,405,2183;986,1537;108;893;1537;3554;26,986;1667;986;1667;1469,1470,1471;1537;986;1537;436,1447;1537;371,436,747,1660;1608;1059;2784;1667;26,437,484,526,585,638,798;1660;1660;688,815,3520;3117,3118,3119;1094,1246,1372;26,3393;585;1663;26,1659;26,397,1537;436;1368,1369,1690;399,663,897,1495,1662;1704;897;26;462,3268;26,451;2437;26,397,1537;26;638;1326;1537;371,1661;113;1537;95,2756;1660;1615;1118,2851;688,2213,2790,2791;26,498,528,1687,2573;317,1597;2270;400;3089;1661;1495;26,412;1615,1738;26,1537;3477,3478,3479,3480;498;489,574;363,554;100,689;2951,2952;2951,2952;2951,2952;2951,2952;2548;471;3507;934,935;26,527,598,1660;574;574;26,893;397;437;574;26;574;574;29,437;437;941,1974;574;403;2715;934,935;2633;574;2433;574;371,1662;26;1739;2609;437,1537,1662;371,1662;335,691,692;893;1663;1661;376,574,1663,1934;450;617;1661;381;1246;1537;1177;574;26,986,2440,3011,3012;26,939,940;1739;1833;87,228;986;1687;640,761,1663;574;462,986;1662;1106;2685;1660;986,1537;462,760;371,986;1246;574,1696;26,822;267;29;986;843;1660;871;177,3180,3181;893;26;26,2440,3011,3012;574;1422;1459;893;1615;1015,1659;893;609;26;26,574,622;26,2440,3011,3012;1243;986;893;586;1537,1662;986;1994;574;1662,1696;112,269;26,3329;782;29,498;893;371,609;760;893;482;340;638;1565;952,1537;617,1589;950;893;638;893;340,1337,2609;596,1187;1661;829;607;26;585,676;617;607;934,935;26;29;1663;392;371,392,403,404,1660,1952;574;1537;1537,3229,3230,3231,3232,3234;1662;100,1094;2107;26,54;585,1037;26,463,2557,2647;934,935;408;1914;542,1367,1446;893;1842;1661;436,747;638;2105;638;558,612;893;574;1179;450;462;2609;1738;1715,1716;1221;26,28,379,462,585,910;498;1663;1661;26,462,1537;29;618;1179;952,1537;364,456,778;1615;734,1615,1738;2649;95;1615;1875;893;964;893,1243;560;528;893;1543,1564,1565;2138,2139;986;26;450;1615;532;407;450;893;574;574;1659;1661;986;397,554,574;95;26;1179;2149;26;392,652,1094,2288;392,893,1243;26;528;26;574;638;1663;95,842,893,974,1179,1474,1500,1501,1502,1503,1504;822;893;26;392,1179;574;986;1697;1833;3045;688,986,1674,2220,2221,2222,2223;574;26;1667;1258,1615;226,227;638;792,1471,1472,1473,1475,1477,1478;95,392;609;574,2307;1615;1615;893;1661;399;95;893;375,495,596,706,707,1176;229,230,232,304;643;706;26,416,442,486,706,707,708,709,710,711;886,893;95,1727,2322;26,54;1660,1661,1662;893;3606,3607;344,1615;790,791;913;1671;776,1553;95;1978;2175;1663;3128;893;340;1011;3339,3340;371,574;2536;914;29,1554,2711,2712;526,1659;512,513,1663;2415;100,347,397,530;100,1481,1505,1506;2949;340;95,2472;986;1246;1246;1537;392,1269;26,436;371,436,747;436,1494,1495;26,436,462,530,747;1585;26,1537;26,347,462,678,2414;574,3456;29;3422;893;893;1551,1715,1716;1469,1470,1471;364,686;317;100;1089;1724;1432;2664;26;3581;95,436,2210;1474,1512,1513;600;422;95,893;2531;893;55,56,1733;773;893;3313;893;637,733;364;427,547;1660;347;1663;2349;747;1002,1280;26,986,1761;3028;26,29,574;1537;26,364,436;1734;492;1097;1413;371;1474,2864;992;100,387,389;811;528;1337;1615;893;340;679;2196,2197;651;1739;1537;26,574,2440;986;1537,1810;26,518,519,520;1910;371,436;1739;422;624,625;574;26;416,450;1351;574;335;838;26,358,462;2917,2918;1510,1643;335;436;893;893;28;51;2688,2689,2690;2240;574;2428;1537;2250;2852;1537;893;26,54;893,1918;1660;450;2959;1537,3229,3230,3231,3232;1679;26;1669,3247,3248;585;986;1662,2434,2571;617;708;1269;26;952,1452,1681;28,585;986;26;26;26;26,924,1768;1846;65;3398;609;332;347;26,1833,2975;893;95;1537;1833;732,1660;26;1739;347;2565,2566;893;371,1662;1635;392,1713,1714;934,935;986;26,29;1841,2603;26,622;986;688,1495,1663,2132;822;893;1537,1584;1758,1759;1717;1615;1615;1071;1750;1615;1941;1347;489,859;574;170;1298;28;1615;2649;26,450,554;422,1660;2817,2818;1615;574;26;450;65;100,1479,1480;91;1664;1246;1246;986;1246;1209;773;1246;1662;1246;893;26,27,526,527,528,1662;1246;1246;893;856,893,1453,1555;1246;1537;26;574;1662;893;528;1797;371,768;893;415,459,574;3086;3236;893;2345;1246;462,1663;26;95,631,632,633;638;271,272;384,3472;1615;581;893;620,676;717;358,462;639;1660;574;415,446;1537;415,1107;2449;574;574,1812;574;489;2810;986,1537;1661;1687;893;893,1674;2795,2797,2798;1659;574;732;893;574;1097,3382;528;2378;416,708;95,2322;2575;574;574;574;26;26,2053;574;2716;1738;-27,-621;1246;26;1011;633;26,1662;1246;528;637;2679;893;1246;3454,3455;1660;26,585;893,3064;1422;100;26;375,1698,1699;375,1698,1699;375,1698,1699;375,1698,1699;26,364,553,554;415,416,417,418,419,420;375,1698,1699;1531;574,1591;1876;2360,2563,2564;364,397,462,558,612,721;1698;1163;383;1660;371,1662;1012;344;609;1660,1661,1662;574;422;934,935;934,935;934,935;986,2663;574;317,498,574;574;363,382;29,498;498,893;574;529,1510;574;383,574;29,1510;585;29;29;574;574;574;574;29;26;893;340,2474;1037,1661;2055,2056,2057;91;436,1494,1495;1737;1687;819;893;1739,1959;1252;574;893;893;585;1537;1576;554;249,286;893;574;1662,2065;893,1915;1661;676;26,392,1660,1664;676,694;26;528,556;1660;767;1615;528;1846;893;1290;371,372,1666;554;782;2198;1246;665;1118;893;1750;352,1289;246;1977;340;2312;2414;1491;1279;574;1854;1738;893;2703;1659;1615;1661;893,986;1615;436;100,609;1537;371,436,479;372;371,1661;1660;1660;436,747,1999;893;1615;1094;422,676,1660,2838;1660;26,363;2603;397;1440;1118;26,28,1166,1248,1537,1637;26,1166,1537,1637,1687;26;3010;2143;26,1537;1088;1419;2645;29;893;1662,2714;29,1662,2037;574,1660;804;382,574;95;574;1666;585;1537;1660;1850;617,1537;2332;1615;1286;932;26;1615;1661;2624;483,1661;1537;893,1046;1246;986,3024;893;436,747;462,845;617,1584;1471;1660,1661,1662,1663;893;26;574;77;1738;1660;26;437;26,986,2440,3011,3012;26;1211;986;3473;1537;26;986;26;26,1662;26,462,1662;1663;26,986,2578;986;1662;1664;26,676,986,1537;26;1663;1663;371,1662;1661;26,986,1537;371,1663;1661;26,2238;1661;26;876;2019;2137;1615;936;574;397,1208;344;2123;2655;986;574;26;1025,2254;893;2000;526;574;936;1097,3382;1660,1661,1662,1663;1663;773;822;2742,2743;26;29;26;29;3242,3243,3609;574,1715,1716;617;585;1615,1741;1722;782,2406,2699,2700,2701,2702;1387;3086;1659;1660,1661,1662,1663;26,3286,3287,3288;1660,1661,1662,1663;2809;1448;374;893;893;2112;462;462,574;1337;1663;1063;29,893;574;1246;26;1697;1353;986;26;986;26;524;1246;392,3465,3466,3467;65,95;26,72,73,74,75,1537,3263;1739;347;100,1665;893;1413;1403;233,234;2605;1300;26;398;26,556;95,1487;3049;392,1713;1665;3562;95;893;893;638;1615;1738;1935;893;2298;427,436,483,795;1811;344;371,1662;26,376,462,558,612,613,1677;1243;1979;26,986;436,747,1664,1665;574;3123;574;375,1698,1699;375,1698,1699;375,1698,1699;375,1698,1699;574;2281,2282;462,719;1368,1369;893;375,1698,1699;1698,1699,1700;1662;986;2342;2342;2342,2343;787;1660;1537;1263;1520;776;381,1375,1662;95,1727;1337;26,574,622;574;574;574;574;997;505,506;371,415,753,754;574;606;574;574;445;2037;2562;574;26,382;574,1510;450,574;574;3370;437,574,854;530,643;574,901;574,776;450,574;574;29,574;574;26,374,554,1137,1138;26,381,1661,1662;26;26;26;1660;278;1615;590,591,592;574;893;3327;376,385,484,986,1537,1659;574;28;95,2303;456,2199;986;1158;528;1661,1688,2153;29,1687;528;893;1615;3168,3169;2900;363;26,3468;399,438;1632;1632;489,574;543;1665;26;1665;574;1373;2130;893;1615;901;1537;1615;782;893;1615;436;1660,1663;371,1662;893;574;371;822;392,1471,1519,1520,1521,1522;29,562,3222;29,562,1537,3222;1615;100;1802;883,1238;893;1615;560;392;399;893;1615;659,893;26,358,2020;26;371;585,676;585,676;2799;95;893;1043;2321;261;340;574;371,1245;1041;1080;893;524;2351,2920;26;1663;638;397;397,528;442,2445;437;1645;574;574;437;483,2047;574;986;986;3087;26,399,986,1663,1863;1471;1471;371,436,462,1664;893;1664;26,961,1660;371,1662;371,1662;688;26,450;2541;372;100;893;3450;1360;893;482,761;364;2751,2776,2777;3120;26,3270,3271,3272,3572,3573;26,382;1275;773;1615;2000;1662;427;986;26,364,450,574;2360;986,1660;26,1661;1915;986;347,533;26,364,374,375,376,379,3590;26,378,379;26,399,1097,3382;1323;29,562,3222;1537;371,462;1537;1662;371,848;26,574,986,2037;26,54;347,462;528,1537,3390,3391,3392;381,403,646;574;1089;1510;1424;893;893;2175;383;1615,1619;574;1051;1907,3071;403;3029;542;1910;1030;3506;2446;893;893;1225;893;100;440,2766;1615;514;961,1457,1458;961,1457,1458;1615;893;1358;893;1280;91;2811,2812,2813;481;442;574;574;3557;3557;1739;1751,2896;436,1283,1499;2284;489,521;26;895;95;574,1662;1687;1537;257;26;893;688,2213,2790,2791;893;676,2246;574;574;893;2602;1046;893;2609;436;1434;652;489;1776;1195;2054;1270,1659;1146,1391;2163;1537;1615;617,3023;1537;1993;1870;370;-27,-1538,2888,2889,2890,2891,2892;1246;26;1660,1661,1662,1663;26;3090;2740;1246;381;1739;893;2940;436,1497,1585;706,2312;26,317,986,1847;1661;947,1911,1997;893;2186;28,371;1323;347,364,1110;1660,1661,1662;1246;752;893;26;26;26,1368,1690;1113,1738;316;95;1663;986;26,397;101;1664;1664;1661;332,1120,1121;1660;986,1663;3345,3582;26;26,850,1241,2205;397,554,574;29;95;3374,3375;412,617,1097,3175,3176,3177;462;1667;1659;986;1151;986,1537;3237;1713;1823;381,1495,1537;462,637;1661;26;893;317,1323;270;1745;986,1537;462;100;26,526,612;1195;768,1844,1845;1181;1856;26,424;1076;1734;554,2154;1665;437,556,643,946;574;1097,1537,3382;3600,3601;26,3306;436,1375,2533;1727;893;1615;1696;617;317;574;1094;422;1851;1663;1751;1615;1537;26;574;2419;1661;26,893,3244;3256,3257,3258,3384;29;1817;450,574;26;574;574,2999;2717;528,1776;2951,2952;2951,2952;2951,2952;2951,2952;2951,2952;2951,2952;2951,2952;2951,2952;2951,2952;2951,2952;2951,2952;2951,2952;2951,2952;2951,2952;710,711,946,2758;1659;574,3113,3114,3115,3116;2258;498;574;436,1283;375,405,529,1663;2353;26,2938;574;934,935;934,935;26,1537;1661;3413;1440;893;26,347,462,1660,1662;893;2218;676;1662;893;371;15,-27,-1538;1537;26;26,2815;1661;2259,2260;893;26,54;2557,2643;866;112;1750;363,556,1632;1660,1674;640;1687;893;527,676,1664;26,54;937;26,1537;893;1459;893;1660;1663;1687;676,1660;665,938;526,1997;2198;991;1662;1645;347,508;1662;26,54;1662;1645;26,54;26,54;26,54;1662;26,54;574;822;3175;574;26,1537;26;1615;26,54;3428;405,986;26,54;986;26,410,1661;26,54;1537,1661;26,54;26,54;363;26,54;574;893;463;1662,1764,1765,1766,1767;1347;399;776,1498;887;893;26;773;2000;26,54;26;1615;1738;617,1589;774;676,1097,3382;607;612,694,742,1037,1271,1632,1659;893;317;3029;375,450,479,574;1537;363,371,416,438;773,1055;486,2076,2398;893;893;383,1037;638;822;1050;1537;1634;28;1661;1661;1537;893;986;528;609;893;344;26,399,1861,1863;1469,1470,1471;574;934,935;2468;2620;2384;2930;399,1537;776;528;2867;1474,1512,1513;392,2298;322;1751;100,1760;815;1897;1738;3429;29;1660;436;893;1809,1925,1926,1927,1928,1929,1930;893;1721;893;26,462;1727;1615;560;1615;2609;893;29;489,531;340;95,2322;26;2488;893;1743;893;2322;1660;1048;1401;2737;437;638;1246;1660;574;436,747;2649;574;26;2855;347,1780;1423;26,436,574,1660;392,3311;792;2081;26,54;3333;2574;1750;340;332,1120,1121;574;620,1537,1964,3331;1663;1738,1747;528;1971;1451;1243;3213;532;2002;1537;893;893;1097;1246;1537;676,1660;893;822;383;2732;770;26;893;1246;743;3259;710;858,859;643;442,486,709,710;1097,3382;822,1351;1279;1497;1118;893;26;1738,1747;1955;574;2247;864;437;352;2968,2969;-27,-1098,-1538,-3383;383;1738,1747;2925;78,79;1659;1510;514;975;1918;617;574;2037;514;893;1121;585;416,450;397,554;893;1283,1493;422,759;893,1530,1531;95,1179;95,1727,2322;1855;1587;1739;986;317;986,987;3571;1896,1897;26,436,747,1094,1663;1471;1097,3382;26,436,1474;2023;26;100;436,747;436,1494,1495;893;29;26;1246;893;574;1615;986;1347;1291;29,450;3587;371,462,913;560;986;776,1498;2537,3111;574;29;450;893;347;1738;91;574;1750;2837;547,548;498;893;1615;462,483,612;979;437,450,574;619,620,1923;450;437;2759;574;893;26,1662,2236;437,574;397,554,574;1661;986;600;95;26,1664;1537;26;2103;967;574;776;573,574,1336;340,2348;2707;637,822,1122,1123,3133;462;3028;1576;1097,3382;26,1580;574;893;26,397,986;289;893;3598;436,822,988;893,2247;986;436,747;1663;2859,2860;601;95,893,1046,1529;893;1664;574;893;743;26,54;2045;617,3344;1130,3463;3552;893;986;154,155,156,157;574;26,2406,2407;574;533;574;95,340,1337;986;376;112;893;344,1207;354;354;354;354;436;399;347,371,574,747;2601;1738;1495;26,54;1543,1564,1565;893;776;347;124;1243;1738,1747;26;371,450;29;95;1661;2000;1687;585,2655;2465;498;1615;371,643;893;1605;1661;26,1537;384;26;2360;371,436,747;1660;100,2868,2869,2870,2871,2872;1663;26;1663;1662;893;574;1664;1264,1615;95;1502,3189;2412,3204,3205;1635;1662;1523,2156,2157,2158;112;893;412;26;3017;986;1537;986;459,986;893,1453,1555;770;95;383;822,1992;986;26;842,2430;2500;95;1615;450;921;574;617,1477;1660;100;1412;1537;26,54;340;383;688;371,1662;649,1031;348;95,1726,1727,2322;893,1497,2578;1758,1759;1304,1305;1661;952;770;1550;383;893;574,1187;574,1777;462,574;1739;1246;574;524;1407;1840;617,3020;574;775;893;893;1866,1867;952;2509;893;95;1537,3229,3230,3231,3232;1246;1662;986;26,358,1663;1246;1246;528;397,554,574;1246;450,1193;450;1246;1118,2873;893;574;1997;1246;392;533;95;392,2684;26,54;893;528;1000,1001;999;489;893;893;524;237;1612;986;986;1662;1662,1667;1660;1967;2126;26;2557;2286;29,489,1632,3284;574;574;416,571;574;574;2380;1996;574;1661;26,54;556,574,1060;574;1449,1450;893;3481;95,1207;934,935;574;-27,-621;1742,2333;1687;26,54;2618;893;3453;382;574;371,436,890,891;1632;893;893;582;2250;1097;1290;1401;2932;51,52;415,416,417,418,419,420;416;375,1698,1699;375,1698,1699;375,1698,1699;364;414,415,416,417,418,419,420;574;375,1698,1699;375,1698,1699;375,1698,1699;375,1698,1699;375,1698,1699;375,1698,1699;453,454;375,1698,1699;1661;375,1698,1699;363,405,450;375,1698,1699;375,1698,1699;422;574;893;1992;380;573;392,893,2907;529,2552,2553;1622;340;422;2250;3221;986;1734;893;2828;1140;893;91;397,2189;574;1510;26,27,28;29,528;26;585;29,528;1168;574;574;585;26;574;26;574;29,403,437,528,556,1434,1632;26;450;868;26,54;112;371,986,1661,2676;1815;2609;3442,3443;1172;574;1615;2649;26;1168;574;868;2312;1662,2065;893,1709;100,617,1323;465,694,952,1375;2198;1662,2065;893;397,554,574;619;347,1660;1216;986,1662;893;893;422;1039;2223;2470;1510;1615;347,364,1659;574;1118;2020;986;462;634,2041,2042,2043;974;1615;573;574;574;574;893;893;609;528;332,1120,1121;371,489,1657;437,486,489,2076;1637,3261,3262;893;688,2213,2790,2791;1738;986;574;1891;436;1347;371,436,1664;893;893;358,526;290,291;1109;1615;100,617,1323;26,416,574;3519;3519;1552;1739;2313,3185,3186;986,1537;1915;1537;29,1537,1687;26,375,574,1363,1364,1510;674;496,497,498;1632;688;371,1662;1491;574;574,1660;617;498,1687;574;2416;796;1052,1664;2185;397,462;29,1662,2037;1660;26,382;482,946;1574;1661;1661;893,1718;574;1407;574,1323;437;1474,1512,1513,1514,1515,1516,1517;352;1660;1013;344;2377;335;450;462;1530;340;1495,1710;452;986;26,842,1774;574;95;2693;893;574;640,677,1660;371,1660;2609;798;550,986;893;344;1323;383;574;364;893;528;574;1495;135,136,3376,3579;112,1323,1510;1734;893;462,573;26,54;26,54;986,1687;397;528;1388;100;26,1662;1615;347;1661;893;601;1530,2127;1739;574;574;893;893,1453,1555;982;1661;1337;462;617,3201;29;1661;986;1537;26;26;1537;574;1687;1537,1687;1660;28;462,585,1661;1680;26,986;317,1663;397,554,574;95,1727,2322;397,554;609,719,789;1661;574;818;392;776,893,1576;450,574;893;1246;2790;1537;1043;893;1347,1474;26;1441;397,574;609;3567,3568;397;1243;1459;26,1687;221,222;26;1738,1747;1782;463;2277;2385;3061,3062,3063;427,1019;1537,1661;1097;397;893;1615;547;2596;1246;1682;1246;26,437;573;893;2613,2614;893;462;462,574;986;986;986;857;26,1537;574;585;392;574;574;29;2037,2510;1246;1738,1747;1246;1615;2760;703;26,54;1663;397;26,54;1347;2215;3595;371,436,896;562;397,554,574;822,2163,3133;425,574,798,2431;893;1615;1697;574;1045;1660,1661,1662;1738;1844,2915,2916;926,1204;574;340;26;1034;893;864;1660;1635;693;3602;26,382;1714;2649;1234;392,1713,2712;612;26;26;893;405;371,1070;1537;1037;456,613,1329,1330,1331;611,1677;344,1103;1849;1078;2662;2387,2388;371,405,416,1510;375,1698,1699;375,1698,1699;574;2525;1615;934,935;1510;528;358;1401;1246;375,1698,1699;375,1698,1699;893;375,1698,1699;375,1698,1699;375,1698,1699;1615;100;2491,2492,2493,2494;2953,2954;371,1662;2784;1660;2609;1615;1138,1179,2523;371,1070;893;893;1663;554;1088;103;2649;3014;893;450,574;574;574;574;893;1221;371,1070;26,622;1510;934,935;363,371,574;1629;532,534;371,450;1118,2712;371;574,3495,3496;445;574;450,643;743;371,489,1657,2126;574;371,489,1657,2126;415;2240;574;1310;574;26,382;574;450;574;986;392,436,893,1013,1491;65;3293,3294,3295,3296;893;1734;893;1232;344;1615;1141;574;2444;1351;3054;371;364,1660;26;1660,1661;2649;1664;1878;1404;317;51,52;2374;3101;893;617;893;2321;574;893;462;1149;1747;893;1404,2634,2635,2722;893;1615;358,371,574;3414,3415,3416,3417,3418,3419;528;26,1537;776;1665;2832;436;3035;893;798;1739;383;363;1179;1246;1401;1661;986;933;1751;1089;1615;1094;1615;822;574;476;2790;574;1537;3067;2311;893,1179;776;1903,1904;893,1576;26;877;875;26,54;3303;3146;1131;574;1309;462;1195;112,3348,3349,3350,3351,3352,3353,3354;2927;1663;574;2253;574;1221;26,574;574;1246;2332;893;26;533;528;1738;437;436,1382;893;382,416,531;1469,1470,1471;371,1662;371,1662;574;601;893;26,377;450,1221;2037;3170;3605;1246;822,1358,2549,2610;952;1739;26;1738,1747;26,462,1659;2247,2472,2909,2910,2911,2912;486,2076;482,761;26,1661;533;893;95,893,1046;2854;1615;893;893;1738;26;437;672;95,392,2578,2579,3315;95,119,340,392,1000,2576,2577,3315;1662,2250;2242;1662;601;26,924,1768;332,1120,1121;893;26;29,1687;1659;1661;347,399,1093,1094,1095,1096,1537;26;26,399,986,1537,1666,1861,1862,1863;561,562,585;1537;1510;738;382,531,1632;371,1662;392,1551,1715,2268,2300;462;1094;2336,2337,2338,2339;26;340;112;585;1397,1398;819;986,1537;1207;344;893;1179;528,574,676;3551;1474,1607,2558;1663;1661;1660;791;1000,1001,1002;1351;26,399,1537,1666,1861,1863;1660,1661,1662;1312;893;1445;893;1852;1242;893;1615;893;1251;893,1046;26;2609;574;934,935;450;371,450;689;1127;1787;26;392;961,1457,1458;617,3122;961,1457,1458;528;893;893;560;528;893;26,1537;26,539,1040;95,1726,1727,2322;1022;1662,2065;1660;436,747,1547;91,185,186;26;893;383;2198;1727;706,946,2135;1388;962;803;2271;3538,3539;2735;574;196,197;934,935;986;202,203,204;1179;1118;26,358,405,462;893;1662,2065;95,2322;347,381,1251;574;574;3565,3566;1708;340;371,382;574;574;415,826;2557;554;607;371,397;495;462;1885;26,364,482,1662,1674;1983;2609;1704;1615;986;76,77;3547;371;51,52;1361;26,53,54;26,54;383;399;3027;574,2073;893;574,1471;770;1739;1739;95;26,986;932;1661;1661;436,1444;986,1537;1659;26,54;344,1728,1729,1730;574;893;1615;1246;893;3191;26,54;1246;893;405,1661;2951,2952;26,54;1388;893;1046;1661,2083;585;2240;574;3202,3203;1663;2440;986;437,489;893;574;893;893;542,1367,1446;26,1270,2399;28;399,663,986,1537;26,54;2214;1661;371,442,546;2609;986;397,554;710,946;381;1537;1317;574;559;26;846;893,1453,1555;3347;899;1388;1615;1615,1734,1738,1749,2996;95;562;770;1615;26;618;95;450,574,725;782,952,2569,2570;1702;3543;1632,3166;574;574,1632;574;574;2951,2952;2951,2952;2951,2952;2951,2952;2951,2952;2951,2952;2951,2952;2951,2952;2951,2952;2951,2952;2951,2952;2951,2952;2951,2952;2951,2952;2951,2952;2951,2952;2951,2952;2951,2952;2655;495,574;382;26,574;26,2938;1221;462;437;397,554,574;26,416,574;26,382,596;26,382;26,54;1403;574;364;2320;893;1645;445;363,489;1662;2421;495;893;2037;893;26,54;1576;416;2814;363,1645,1655;26;347,371;3383;713,714;1663;986;1663;462,484,1144,1659;528;212,213,2118,2119,2120;986;2367,2368;2368,2381;3175;1663;1661;1663;676,2050;1660;437,1661;986;1574;1662;1662;986;556,1933,1934,2235;986;743;1731;528;893;620,1592;392;574;100,887;893;1660;893;617;26,986;574;26;986;1097,3382;26,100,422,1118;26;26,986;26;1574;893;1537;2649;1615;1615;1246;743;26,986,1861,1863;1739;392,1713;26,399,1537,1861,1863;822,1347,1471,1508,1509,1510,1511;1323;893;3013;1535;893;893;735;1422,1474;347;934,935;1645;1243;1942;2215;638;2420;489,531,1202;986;383,574;392;26;392;794;617,1537;371,1662;1537,3229,3230,3231,3232;574;29;1660;1537,3229,3230,3231,3232;1537,3229,3230,3231,3232;26;3234;1537;893;574;893;1537;1625;1511;3611;29;2167,2473;528;1615;1118;340;1551;26,1660;822;95,100;450;1734;2345;1906;893;383;1170,2378;3400;986;416;382,574;29,119,574,688,2170,2171,2172,2173;3385;1739;743;893;1615;401;966;893;1402;652;1796;352;1615;1738;2921;2550,2551;1615;2424;1728,1729;1543,1564,1565;1660;893;416;437;437;2013;1739;574;893;450,574;26;475;2017;893;344;1615;1162;3356,3357,3358;1738;893;986;95,436,822,2637;893;893;893;340;574;1089;986;887;893;450,643,1652;1118;986;1660;416;574,1179;383;574,893;2559;2557;1875;3066;1358;1937,1938;1642;1642;893;1495;986,1495;574;822;383;574;1324;1632,1901;1447;860,861;858,859;26,416,706,707,708;858,860;1604;1821,1822;1537;986;1097,3382;1615;1300;893,1243;1734;1661;29,574;85,86;2740;332;970;893;3596;2219;893;1711,3149;2109;1179;551;551,776;551,1094;893;893;893;95,952;1738,1746;1739;1661;1310;2086,2087;1537;1748;986;3140;95;1179,1567;3025;843,3498;893;91;26,676,973,1674;1168;371;617;1323;495,577,578,579,580;363,450,1645;2304;2394;893;634;893;893;347,536,1676;371,436,747,975,1213;1643;2951,2952;986;2332;2609;335;392;1110;398;1662;1221;2696;340,1337;893;1660,2150;371,1662;574;645;1221;893;574,3457;3459;2557;1118;782,1471,1473,1476,1477,1571;893,938;3068,3069;773;568;542,1367,1446;392,1471,1519,1520,1521,1522;1715,1716;26,1537;381,986,1095,2487;791;1323;347;3039;1600;1246;1351;29,528;1662;574;1615;574;115;344;29,574,2364,2365;893;770;574;450,1510;1059;1738;26;893;621,706;893;1664;405,760;3474;482;95;822,2355,2356,2357;26,545;1293;2645;26,397,1537,1761;1973;1537;1670;574;1543,1564,1565;893;26,986;26,1352,1353;1739;3033;893;617,822,1537;893;1000,1001;528;1537,1584;28,770,1537;392,1713;1251;893;26,848;759;1097,3382;1615;1738,1747;26;376;371,1662;392,1287;893;993;1537;1662;26;986;26;585;893;1246;1583;436,676;743;893;893;2373;451;1615;574;893;1648;416;893;354,357;1239;1615;1466;462,606;1615;1255,1256;617,893;26;422;1130,3463;340;893;1662;26,585;574;397;26,364,547,2961;2609;533;26,2439,2440,3011,3012;1667;1751;1662;26;574;1537;893;893;392,1452,2354;2295,2296;422;893;1221;399,1833;1118;26;986;1820;893;893;1354;1401;229,232;1738;2593;2649;893;2351,2352;2842,2843;1510;893;893;371,1662;3460;1388,2194;403,574,1094;486,2076,2398;574;574,3125;2257;450;574;416;399,1097;95,1632;986;1537;1097;934,935;934,935;528;26;26,374,415,1188,1189;1615;422;1615;1994;1537,1994;1226,1227;822,1243,2020,2673;343,1146;750;2639;1758,1759;1758,1759;371,1662;1555,1607;893;818;986;921;574;450,574;26;893;953;1615;1206;533;1094;26,450;95,1713;528;1615;574;893;823;490;887;95;1593;1246;26,462,529;1661;1661;1246;26;352,1738;1347;1687;893;1246;462;358,364,397,456,681,682,1632;1452;634;574;574;192;609;2078;1738;1069;1246;631,632,633;1246;450;3152;436;1025;986,1662;1615;574;1662,2291;1660;1664;1667;574;574;344;1221;371;893;2557;3523;26,2623;2984;29,2748;934,935;498,528;574;1650;893;364,1662;3192;1615;986,1766,1767;1767;392,1320;1661;893;893;371,1662;397,498,1426;986;26;893;574;1662;574;574;26,1540,1541;574;607;95,1726,1727,2322;743;574;743;628;736;986,1687;1090,1766,1767;1953;589;1372;198,199,200;383;772;706;986;743;726,727,728,1495;3273;1663;893;1615;1401;26,1231;1231;375,1698,1699;375,1698,1699;554;375,1698,1699;375,1698,1699;375,1698,1699;414,415,416,417,418,419,420;375,1698,1699;3502;934,935;2741;352,1738;1466;26,1663;392,2914;673;2469;986;1146,1422;776,777;284;1590,2543;3528;2378;372,822;893;893,986;609;638;1094;436,747;934,935;574;617;26,1368,1690;910;585;574;574,2068;574,1696;574;28;585;1510;1094;2814;614;416;416;1450;340;489;893;1915;1454,1455,1456;1745;1661;456;1758,1759;416;542,1367,1446;1703;332;2609;3471;893;2029;893;893;1323;893;100;620;26,539;1118,2290;1738,1747;893;437,528;962;638;893;26;450;574;893;2198;1247;893;798;893;893;947,1181;1246;1660;893;528;893;893;2063;1221;893;770;965;893;3094;2276;1401;1401;528;1615;405,415;1294;574;3544;1013;1673;1537;1662;986;436;436;893;864,908;3359;1975;1065;1368,1369,1689,1690;1323;95,1574;2229;617;929;1537;26,416;376;2838;1580;436;609;946;26;1211;1246;1246;1419;3040;893;1661;946,2404;574;450;450;2752;1190;15,306,307,308,309,310,311;1854;1399;364;1179;1663;1094;416,531;26;574;95,1727,2322;574;574;1615;382,574,2089;2479;1715,1716;574;26,642;576,1158;528;1241;528;3503;371,1662;26,450,465,466;893;893;528,617;528;1474,1476;1794;893,1713;1615;95;893;1615;3183;26,1775;26;26;1013;359,360,361;688;3585;864;1114;677;1219;95;612;770;1616;1615;1543,1564,1565;2841;1615;1615;392;26,95;383,1660;1537,3229,3230,3231,3232;1000,1001,1002;893,1537;986;986;2014;26,364,1188,2251,2252;1865;26,2418;26,2418;100,26;26;26;26;2926;412,986;2317;372;1661;1049;574;934,935;1382;1247;1738;798;1401;1021;112;416;574;1615;893;1661;893;1615,1750;1615;1615;1580;1661;352;371;784,1615;617,1496,3214;119,369,1615;893;1660,2093,2457;1661;371,1662;986,1661;934,935;1660;986,1661;2239;358;376,399,986;574;893;776;617;986;371,1662;1615;573;1660,1661,1662;986;1739;1118;893;1738;1434;1114;542,1367,1446;29;2856;893;574;1663;450;1406;450;2168;29;802;260;2332;822,1660;3452;1692,1693,1694,1695;2609;1738;340,1337;986;1994;140;1615;174;2395;1474;317;1932;1118;617,3469;2835;381,986,1495;893;3513;26,498,528,1687,2573;2573;893;1703;26,399,986,1674,1861,1863;893;1662;776;1615;773;1915;1738;1660;29;1661;1537;574;1221;445;450;1246;29;893;893;1246;528;106,107;1537;1873;745;760,1859;1338,1339;2179;1734;3347;1659;1615;26;1660;893;574;1738;1246;1246;776;1401;358,912;1923;26,912;1661;528,822,1639,2586,2587;893;893;1401;88;528;371,1662;26;1723;1615;2190;2495;437;612,758;28;612;1660;1665;26,376;1665;1660;3574;437;1354;1471;638;364;375,1698,1699;415;3511;1574;26,708,1665;347,364,719,796,797;375,1698,1699;375,1698,1699;375,1698,1699;375,1698,1699;340;2796;2187;26;26;1134,1135;422;95,2322;893;1854;885;1662;29;574,630;1632;1510;574;574;371;416;489,574;371,489,1657;1632;574;574;574;371,489,1657;1221;495;371;450;2126;371,489,1657;743;415,1650,1651;437,489,544;397,554,574;743;450;26,358;26,358;1221;29,617;416;397,554,574;893;636;574;26,392,751;1734;1663;1537;1537;1615;2560;720;514;893;363;893;1102;1739;2827;994;437,574;26;925;60,61,62,63,64;773;574;986,1537,3091;1469,1470,1471;1094;1900;450;893;893;3301,3302;1663;363;2790;1615;498;934,935;1537,2077,3219;1665;1915;3360;678;26,1291,2440,3011,3012;638;1738,1747;363;893;2814;26,557,558,1663;893;2422;768;462;893;26,665,986;1090,1766,1767;1738,1747;893;100;2900;1347;437,2305;26,450;29,1537,3222,3388;574;2498,3093;822;112;2874;574;146;371,1662;1526;574;574;450;29;26;26;574;1665;450;3030;450;585;100;379,382,531;229,230,231,232;422;347;1660;893;528;436;392,1713;1660;1663;893,2314,2315;3103,3104;2807;893;436;2144,2145,2146;1738;574;26;371,1662;893;26,436,1094;1667;392;3433;95;528;893;776;893;462;1662;1243;1738;245;26;26;574;687;3524;2332;1228;3034;1662;437;437;1337;617;381;399;1734;776,1498;332,1120,1121;26,1662;2000;1663;893;2805;347;893;893;574;574;609;412,1537,3361,3362;986;688,794,1537;986;1826,1827;29;397,554,574;26,405,1661;1537;412;26,28,967,986,2672;1337;416;138;381;347,681,741,742;793;893;986;934,935;462;1663;392,751,788;574;2544,2545;822;893;893;450;574;1313;3241;1885;1661;1662;893;26,399,986,1861,1863;893;560,668,1046,1542,1543;1095;893;1252;776,1553;95;344;1663;95,392;26;893;574;893;776,1553,1554;2787;3481;906;1722,2667;3154;1401;1910;1792;1246;26;1411,1738;654,655,1661,1662;1344;1738;317;95,2322;95,2322;1603;344;1751;2475;436;574;1738;1615;239;791;1537;26;363,574,1112;1440;574;3073,3074,3075,3076,3077,3078,3079,3080,3081;617,2135,3134;405;1615;397,760,761;617;560;743;1118;1370;26,924,1768;668,1543,1564,1565;3367;528;1630;1738;1422;1246;1246;822;893;743;26;1043,2832;968;1661;1687;893;1641;607;1422;986;574;1195;26;2283;893;1401;1246;1246;1739;574,1471;372;2951,2952;1615;1615;1497,1678;26;1661;574;1246;1246;1358;29,893;2169;574;2188;617,1248;416;26,986,1368,1690;193;986;1537,1687;1662;1671;636;1246;934,935;26,416;29;573;95;705;574;26,1270,2399;26,1270,2399;893;893;1665;965;2654;893;340;340;574,1661;371,1662;2106;486,710,711,946;617,1631;986;26,347,399,484,485,1510,1537,1687;371,1662;2683;1537;1751;26;724;26;574;1858;2905;450;1234;893;2033;2538;1246;1615;1660;1495;2941,2943;405,822,1661;26;1097;277,1727;893;317;1615;1246;3297,3298,3299,3300;2580;644;29,1632;574;574,1094;2951,2952;2951,2952;2951,2952;2951,2952;2951,2952;2951,2952;2951,2952;599;934,935;986;26,347,364,719;986;574;815,1188;403;371,398,971,1179,1180;26;574;29;934,935;26,382;934,935;363;1537,2518;1615;26;1240;893;1368,1369;986;26;26,1663;1164;934,935;893;363,489,574,1645;26,574;1663;1661;893;986;26,892,893;372;765,766;3239;1602;416;1537;1662;2367,2368;2368,2381;617,2263;1660;1687;1662;26;1661;676;665,986,1671;893;26;437,1645;26,986,2223,2227,2228;1246;1663;1357;1663;893;893;2230;1660;450;620;450;450;1300;893;26,436,747;1537;743;743;822;574;1097,3382;948;1645;893;574;1471;1660;1661;822;1738;397;2161,2162;1291;415,606,2557;776;574;533,574,946;1510;462,719;1401;1234;688,3549,3550;902;893;1846,1913;1537,3229,3230,3231,3232;95;1663;405;317,1702,3332;1662;1659;3312;397;893;1660,1661,1662;887;2163;574;2360;1715,1716;582;383;773;893;392,1471,1519,1520,1521,1522;693;437;934,935;1661;95,392,2292,2293;893;574;1738;1246;1721;2649;1225;77;573;893;1738,1747;822,893,1046,1525;95;1660;920;574;893;893;363,530,574;893;893;934,935;574;65,3057;382;893;335;649;392,1471,1519,1520,1521,1522;893;1615;392,2299;372;893,1138,1411,1467,1474,2499;776,1498;893;574,2052;574;1702;1646;1739;1225;1615;574;574;347;416;1027,1652,3330;465,1059;893;893;1097,3382;2557;934,935;893;893;2316;792,1471,1473,1477;95,392;1097,3382;1738;574;382,416;2332;120;953;1738;706;842;438;415;95,96;340;1401;621;574,946;2691,2692;1401;893;893;893;893;1682;28,551,893,2939;1721;1401;2877;376,574,613,2088;3140;26,462;893,2247;634;1663;782,2648;26,981;1662;456;-27,-28,-29,-1538;26,974,1674;363;893;893;1728,1729;3323,3324;574;482;776;1615;26;817,2451;3031;1100;26;676;3151;665,1097,3382;3110;728;893;1537;1097,3382;776,1544,1545,1546;371,2324,2325;1660;1374;893;2686;1094;893;100;26,710,863;2465;26,574;1547;791;696;1078;3046;2332;26;583,2567,2568;3143,3144,3145;3086;791;2517;2517;1537;1537;1624;405,1085;1840;547;3592;585;638;1615;392;986;574;2615,2616;893;1738,1747;668,3366;1202;773;743;743;383;2332;732,1660;893;26,560;383;1715,1716;947;1660;893;1738;1246;1615;1663;1961;1474;3463;822;371;376;482;843;2077;665,986,1674,2077;1739;959,2723,2724,2725,2726,2727,2728,2729,2730;26,924,1768;1246;893;773;574;3553;1992;528;463;344;3092;770;376;376,665;893;1179;383;2845;934,935;26,2414;1318,1319,1660;574;986;893;100;1661;1662;332,1120,1121;1939;822;397,554,574;986;3474;574;1251;26,422,437,526;1246;450,574;1615;893;893;26;3220;1116;1575;617;1660;574,1662;26;893,1046,1523;1013,1715,1716,1717;2036;1615;574,2052;574;893;1165;1454,1455,1456;893;399,986,1537;26,436,574,770,1283;26,986,2440,3011,3012;893;893;1555,1607;1615;416;655,986,1094;383;1739;720;574;743;1118;822,3133;893,2803;1510;2022;371,1662;2389;893;771;2848;2799;450;26,54;26,54;51,52;26,54;26,54;26,54;26,54;26,54;26,54;26,54;574;465,934,935;621,2758;638;317;2951,2952;893;450,1649;1758,1759;1758,1759;1758,1759;1758,1759;1758,1759;807;807;773;617;489,574;574,668,2907,3397;574;773;2115;462,1308,1537;1739;66,67,3195,3196;1401;893;95,1499,2455;2609;26,399,1662,1861,1863;822;893;392,1471,1519,1520,1521,1522;2617;1097,3382;1246;100,2868,2869,2870,2871,2872;617,1584;1246;1246;760;1664;1751;3407;26,676;1243;2198;1246;1246;371,1662;1246;437;1246;437;1246;776;450;364,397,681;456;2875;370;867;1577,1578,1579;893;416;1615;1738;1449,1450;1660;893;776;528;2609;450;893;1615;841;893;1660;1662;2539;26;743;878;574;574;2748;528,574;574;574;574;574;489;416,574,1776,2046;574;574;574;489,574,2405;332,1120,1121;422,1434;1661;1537,1662,3229,3230,3231,3232;574,1659,1662,1671;26,2350;743;574;986;869;1466;26;3147;2848;2125;574;3246;893;403;893;620,1594;1660;392,1376,1422,1576;392;100;95,893,1046;383;574;918,1231;375,1698,1699;375,1698,1699;375,1698,1699;375,1698,1699;95;550,551;1596;1734,1740;893;893;742;3463;2241;773;1046;1221;1738;617,2556;26,1537;1739;528;2192;652,893,986,1633;893;1246;1252;1923;893;893;574;372;486,729,1024,1967,1968;26,924,1768;1243;574;26;574;528;489,574;574;26,2733,2734;1660,1661,1662;725,941,971;462;399,1537;392,528,986,1499,1537,1565,2972,2973,2974;456;1422;574;450;26;450;528;1097;26;554;383;416;893;893;986,3036;1662,2065;436,1347,1474;1615;372;528;1422,1452;585;893;770;26;29;1334;1309;893,1643;1738;893;638;1130,3463;514;95;1401;26,27,28,29;1118;1738;574;95;893;437;332,1120,1121;1738;574;1615;405,415;405,415;405,415;405,415;405,415;405,415;1300;91;1253;26,358,372,405,484,810;383;1441;100;634,1179;416;292,293;617;1660;1980;26,1166,1248,1637,1687;2328;1615;1615;843,1152;415;2322;65,1754,1755,1756,2970,2971;1615;1703;1660;528;1661;528;986;1662;617;1495,1685;574;1415;527;1615;893;26;1046,1471,1607;1117;399;640;371,1662;640;1615;347,1632;1615;1615;893;1471;1401;2163;371,489,1657,2126;2641;95,1853;893;2638;332,1120,1121;640;574;893;437,456,665,1375;1664;822;1401;822,893,1046,1525;1833;332;397;934,935;2609;1687;336,337;1660,1661,1662,1663;1745;2550,2551;1734;1168;371,1662;26,1537;26,95,980,2756;986;1613;1688;617,1537,1944;2951,2952;554,760;989;334;893;1738,1747;893;347;574;1750;893;2797;95;574,1187,2193;416;2034;416,2074;436;893;1660;528;2622;1337;1246;95,893,1046;27,1090,1662,1763;1659;1610;893;2697;2005;985;1615;893;2454;574;893;3193;1738,1747;1146;893;893;384,515;1246;893;26;26;3473;1401;893;125;462;1337;382,531;1230;697;340;926,1422;392,1713;450;791;3544;2603;1739;1661;3380;3006;1537;574;1300;893;794;344;383;450;415,540,541,542;791;1246;1844,2915,2916;893;1703;574;638;893;26,382;26,363,450,465,482;893;528,3461;1739;436;893;893;617,2913;1739;2787;531;1661;3500;26,1330;1661;447,463,574;447,463;574;3504;893;2319;864;893,1375;375,1698,1699;375,1698,1699;26,415;109,1946;1739;3050;1739;1661;1246;1246;1246;893;1133;516,517;422;952;26,1669;27,1090,1662,1763,1766,1767;1266;26;1766,1767;26;27,1090,1763,1764,1765,1766,1767;1739;482;1337;2830,2831;643;870;574;1221;934,935;415,447,449,450;638,1717;2253;3406;416;893,1179;574,710;528,822,2586;371,489,1657;415;371,489,1657;371,489,1657;415,1650,1651;574;574;371,415,574;371,489,1657;574;371,489,1657,2126;26,574;574;493;574;397;450;2047;934,935;893;893;1537;1097;893;95,2330;893;773;893;3301;893;265,266;1738;191;499,500,501,502,503;499,500,501,502,503;462;1661;1661;574;1660;1537;893,1243;822,893,1046,1525;382,416,531;344;2814;893,986,1094;1738,1747;1347;1450;822;392,1422;450;363,415,479,480,481,482;3164,3165;934,935;1738;791;574;893;574;574;482;1401;1738;2898;605;1615;1663;893;1401;2000;26;2478;1246;2554;1738;574;1246;2175;893;2136;3042;29,562,3222;1660,1661,1662,1663;773;2694;574;2757;28,528,617,1537,3423;1388;770;773;791;95,1713;1751;985,1659;26,462;893;26;893;2708;95,1727,2322;893;392;779;1738,1747;652;26;893;574;773;986;986;986;340,2609;574;1660,1661,1662;574,1665;26;1776;710,946;2034;397;743;574;574;26,574,1510,2677,2678;574;531,1202;416,531;462;791;1739;3207,3603;1715,1716;1537;746;486,1078;893;2511;392;26,2072;1311;100,820;1094;26,397,436,483,1411,1661;371;1640;1246;617,1828;773;1738;574,634;1560;1246;1703;1750;1738,2626,2627;893;528;26;1738;1246;364;2526,2527,2528,2529,2530;1323;1354,3482;2090;2443;2603;343;1615;482;29;162;822;1722;381,2442;399,986;574;893;893;262,263,264;2328,2536;2901;28,1704;1813;893;574;26;575,576,1663;3427;1537;29,562,1537,3222;1738,1747;1714;1739;2070;347,681,741,742;1738;416;1537,3229,3230,3231,3232;893;26;26;986;893;2279;1874;634;893;1537;986,1537;1537;1661;1118;3451;1615;95,893,1046;1351;1323;668,1854,2174,2687;893;893;456,1661;473;2294;1661;1000,1001,1002;1875;893;822;29;934,935;743;934,935;2922;1337;2625;986;792;2213;1157;2102;1751;352;332,1120,1121;574;1739;1537,1687;1537;456,566;1663;555,719,941;486,487;95,2322;893;91;2101;2698;1661;893;26;437,574,2588;1366;1715,1716;1902;986;1471;119,340,350,822,1000,2576,2577;574;1401;376;1738;986;340,1674,2501;459,986,1537;399,1537;893;1738;574;1551;574;1502,3190;1221;1738;893;791;1401;835;1474;1615;574;2562;743;893;26,29,924,1768;1661;3396;6,15,306,307,308,309,311;1264,1615;791;1660;1246;893;1246;100;893;2966,2967;947,1911,1997,2079;371,971;1246;1246;1094;1246;1246;893,1662;1843;1450,3167;619;1879;1110;371,437;1246;1246;617,979,3138;1246;1089;26;986,2555;1661;26,1491;1537;358;375,1698,1699;1537;666,1942;1723;119,1474;712,718;26;893;26,1368;3132;585;986;3604;574;986,1661;26;893;893;26,1270,2399;26,1270,2399;893;962;3059;574;450;1094;574;1661;26,347,484,485;606,1248,1687;986,1661;26,450,465,1060;574,986;676;878;533;533,878;738,739;1662;1615;1739;95,1462,1884;574;332,1615;1043;217,218;893;1661;1738,1747;3342;1246;1660;95,893,1046;893;347;1246;1246;574;392,1422;1661;422;1738;26,528,822,1833;574;574;1337;1246;26;3297,3298,3299,3300;3569;3540,3541;3109;2806;26,29,1632;437;2038;1342,1576;1510;2951,2952;2951,2952;946;2951,2952;2951,2952;1276;528,574,596;382;26,416,574;26;743;382;489;743;713,716;1632;574;596,2037;934,935;528;893;1738;2609;668,3366;392;574;445;26;573,638;893;450;893;416,623;2417;95;3515;2126;406,3043,3044;713,716;1537;462,986;26,986,1661;484;1645;450;574;1645;986;986;1537;574;1013;617;574,1510;1739;1739;776,1498;893;383;1441;776,893,1529;2133;1419;574;986;2411;1781;893;893;986;26;1537;822;574;1094,1989;574;893;332;371,1662;773;371,1662;2609;1661;893,2043;392;934,935;986;934,935;665,986;574;659;822,952;2718,2719;1715,1716;1299,1705;95,397,574;2604;881;3064;528;1661;893;893;893;893;112,2481;332;1615;893;893;893;1739;634;612;462;382,416,450,531;371,416,450,574;332;2755;1246;574;1221;1053;450;1663;1323;332;893;1660,1661,1662;893;3580;1094,1969;574;371;437;1803;822,893,1046,1525;1246;383;1246;574;382,486,2076;332,1120,1121;638;166,167,168;573;495,574;574;1179;2211;743;893;335;1738,1747;371,437;371,437;371,437;29,617;484,1670;620;574;363;893;1687;1495,1537;893;1078,1355,1356;893;1401;1615;298,299;1739;399;347,1218;392;2359;1637;427,570;1502,1556,1581;1739;26,416,859,861;26,858,859,860;710,1966;893;3005;95,893,1046;332;1401;399;1471,1473,1474;3426;574;887;893;893;1202;2740;2000;392,1422,2159,2160;3140;164;1033;893,1548;1474;1576;392,1713;893;1537;893;893;893;352,355;688;574;893;1003,1004;1615,1738;768;2370;1221;1100;1972;1284;893;893;893;822,893,1046,1525;1159,1160;893;2825;893;1738,1747;363;574;317;436,1283;83,84,344;482;617,770,822,1643,1751,1803,1807,1808;344;450;791;773;790,791;352;1738,1747;725;3488;135,136;135,136,3579;139;1738,1747;2923;1246;1246;893;1347;1207;683,684,685;1659;893;554;893;2128;893;893;1739;638;1667;574;2007,2008,2009;893;574;893;3542;2332;26;785;1615;392,1471,1519,1520,1521,1522;1094;1118;1543,1564,1565;893;1246;3364;1537;1915;828;26;2360;2740;26;2452;701;26;893;1738;317;638;1243;354;3463;1662;1537;399,1495;399;893,1706;959,2723,2724,2725,2726,2727,2728;399,1537;1574;893;893;893;1138,1471,1570,1571,1572,1573;893;1738;1739;2641,2642;986;574,2073;399;1739;376;1905;637;986;1179;2994,2995;1349;574;574;773;1915;2960;1597;26,1537;26;1663;26,425,798,1941;26;1537;893;26,1491;26,1580;1440;893,1491;1738;893;3552;1615;986;986;893;1537,3229,3230,3231,3232;242;574;1738;986,1095;893;436,984;1739;422,759;2089;347;1714;2609;1703;893;26,382;574;1375,2247;1445;26,2636;1013,1962;1537;1097,3382;2332;26,54;26,54;26,54;26,54;26,54;743;1581;100,2868,2869,2870,2871,2872;437;1738;1993;26,29;893;2649;909;268,1758,1759;1615;1758,1759;1758,1759;1615;358;1738;1407;1388;1615;574;1422;574;383,415,848;26;1734;207,211;1615;392,1713;1246;2609;1615;3048;1615;1501;743;1510;95,2322;574;610;1246;1739;1246;743;317,1632;412;1246;893;934,935;616;1246;1246;1246;743;934,935;1168;743;743;152,153;893;893;1908;893;893;1615;1323;1221;609;574;1615;934,935;1607;743;489;574;1661;1663;893;442,3561;1615;1179,1574;946;574;26,28,29,574,1632,1687;450,574;2511;2800;462,1964,1965,1966;317;437,1944,1945;2034;574;574;2521;26,1315,2661,2981,2982,2983,2984;574,2006;463;574;574;1738;372;743;317;1246;392;1537;1917;1738;893;392;798;915;961,1457,1458;424,489,781,782,783;574;382,416,531;934,935;743;1452;1739;317;1615;969;1970;574;95,893;893;3178;965;3178;399,1537;2546;986,1090,1766,1767;375,1698,1699;528;2634;893;1615;445;26;95;1751;95;450;392,1713;450;1662;498,528;934,935;743;2649;574;574;1168;1168;574;574;574;450;2018;1738,1747;1738;773;95,893,1046;893;26,27;3154;1739;28;1660,1661,1662;2861,2862,2863;773;1661;893;2175;934,935;601;1174;3525,3526;3037;1471,2929;1915;528;585;926;893,1707;26,1793;2649;26,1497,1589;1615;2198;1660,1661,1662;1615;1179;1660,1662;1659;340;392;513;1738;893;3412;893;374,893;574;1130,3463;1698;893;1615;2452;436;436,747;1347,1960;436;26,1537;1440;533,609,1460,1461,1462,1463,1464,1465;893;3494;381,399,1663;986;1660,1661,1662;95;344;1401;1738,1747;1660;2315;1537;450,574,934;29,893;893;893;26,27,28,29;26,1166,1248,1637;893;893;791;254,255,1061,1062;782;2447;2379;1661;29;574;528;574;573;574;2946;574;122;893;818;893;573;1739;1995;893;95;95;65;574;26,1411,2166;26,574;1000,1001,1002;893,1179,1537;893,1179;392;986;1179;26,1669;986;26,1537;347,1632;347,1632;347,1632;456;1881;1246;791;1401;1615;332,1120,1121;1931;638;2609;95;383;2609;743;1368,1691;3096;574;574;486,487,596,1187;26,1687,1767;358,3378;26;985;1687;358,405,1660;1662;375,2028;1663;986;1661;917,918,919;893,1179;1702;893;1246;28,1495;1664;893;1615;371,450;574;1077;416,531;347,574,1537;574;397;986;2124;416,531,1202;574;1097,3382;26;574;1325;2178;1094;363,574;1537;1738;1751;1228;344;893;1738,1747;743;986;574;95;2429;1739;26,708;1087,1615;893;893;26;26,436,1660,2497;893;384,489,3472;29;893;1702;498,528,893;382,574;893;340;2126;1739;574;1660;344;317;893;1537,3475,3476;1094;2946,3447;1615;1395;2175;1037;2331;574;893;893;100,498,528,574,1663;1347,1474;1179;2833;1246;601,1738;433;1401;2452;528;2452;1986,1987,1988;399;1497,1683,1712;893;26,424,426;347,650;51;1661;1434;560;1675;1738;574;1323;1401;91;893;574;1561,1562,1563;1118;3142;416;375,1698,1699;3084;334;332,1120,1121;528;489,574;574;375,1698,1699;375,1698,1699;347;1221;2491,2492,2493,2494;26;1013;95,2322;1389,1390,1659;1738;528,822,2586;371,489,1657;743;1019;2034;450,574;3240;574,893;574;574;371,489,1657;489,1656,2126;371,489,1657;574;574;1094,1551;498;1422,2180,2472;28,405,986,1660;893;1738;908;489,574;708;574;743;1097,3382;1661;1751;893;2033;2044;2044;2044;893;1580;392,1300;1401;893;1471,1473,1476,1477;893;1715,1716;462;998;1615;392,1713;1392;1734;3015;934,935;1738,1747;893;1287;558,1663;1615;893;1312;2378;3086;29;1615;1609;893;1750;1401;1094,1958;3357;822;392;893;436,1230,1482,1483;1395;574;572;1118,1660;574;1661;2486;1687;1738;893;2315;743;574,2715;934,935;574;2207;317;934,935;574;574;1342,2581,2582;1343;893;1661;1997;528;574,1715,1716;2721;893;436;2859,2860;893;1661,1662;1664;629;28;573;456;371,1662;893;1739;1738,1747;574;437,486,487,488;256;347;901;55,56,57;1246;1246;26,347,947;1898;1179;1221;1401;668,1537,2907;456,1738,2308;2334,2335;893;3121;1662;893;665;412;806;1734;2524;1660;317;893;893;283;2341;26;26,399,986,1861,1863;1337;751,893,2268;1537;344,345,346,1615;634;893;893;893;1130,3463;26;1871;1662;2759;1094;880;934,935;1046;725,1615;893;893;26,399,986,1861,1863;26,399,986,1861,1863;893;638,893;1616;893;95,893,1565,2620,2819,2820,2821,2822;1963;1419;893;893;893;893;893;436,822;893;382;934,935;574;450;574;97,98;100,1537;893;893;676,1660;412,986,1495;381,1495,1660,1661,1662,1663;3346;1246;3182;141,142;893;332;1739;2462;574;893;65;893;1738,1747;893;617;1738;791;347,1093,1094,1095,1097;2000;95;593;574,2051;100;1660;26;1615;1402,2108;3163;1588;430;149;770;287;893;340;893;574,2037;574;1722;634,893;383;1745;383;786;2788;893;26,676,2414;1434;112;367,368,1615;893;1401;1401;2713;2062;574;574;2765;893,1715,1716;26,924,1768;893;617;112;1537;26;574,2073;26,1537;1246;1738;1662;769;100,1400;1246;317;2360;2363;1738;240,241;688,822;26;26;1401;3140;893;822;893;1401;893;1663;26;893;574;26,399;29,617;2948;924;574;26,1270,2399;26,1270,2399;1169;26,424;416,450;934,935;441;3018;1537;26,382;29,574;1660;26,382;1537;1660;347;26,382;392;2613,2614;574;392,1713;498,528,1687;1615;944;893,2705,2706,2707;893;450;1615;893;893;893;436,1283;1738;340,776;1615;893;340;1097,3382;450;934,935;873;1710;893;0,1,2,3,4,5,7,8,9,10,11,12,13,14,15,16,306,307,308,309,311;743;65;547;1347;574;1637;95;934,935;574;554;26,382;934,935;743;743;743;1660;1738,1747;893;1664;638;542,1367,1446;1661;352;489,574;893;363;1920;403,486,487;15,306,307,308,309,310,311;1661;893;2000;574;26,1663;3446;2175;986;450;1645;574,3335;29;26;1323;363;1431;893;1663;276;1615;1739;363,1645;971,985;822;26,399,1666,1861;26,399,1666,1861;574;574;574;893;743;893;1739;1615;1660,1661,1662;1784;1784;893,2572,2933,2934;554,1154;2255;2113;893;893;317;26;934,935;893,1407,1419,2670,2671;893;422;638;633,848,1659;934,935;893;986;1246;95;1829;893;822,1426;1401;893;1221;622;112;1816;893;1246;1010;942;2366;1401;893;126;1615;986;95,2322;893;450;1739;1179;1471;1246;893;638;893;934,935;574;26,436;1508;371;574;26;574;574;1750;2946,3447;209,210;872;2606;1738,1747;770;743;1725;893;371,1235,1236;221,222;1300;1738;1615;1660;574;893;574;498;790,791;1745;363;596,1187;1883;363;1738,1747;893;1246;822;1025;858,859,860,861;143,279;1207;729;1738,1747;26,441;893;1661;340;574;399;371,436,1660,2244;2522;2898;893;893;340;574;893;1607;1615;1662;986,1537;1661;375,462;773;1246;893,1230;450;893;2248;893;893;574;437;574;776,893;26;347;1739;1097,3382;1097;1097,3382;2744;2908;392,1471,1519,1520,1521,1522;822;100;340;1739;1534,1535;1243;1739;1662;95;399,1097;893;26,384;489,574;340;1615;3549,3550;1537,3229,3230,3231,3232;893;1094;1246;26;371;1221;1537,1687;26,1537;1739;1130,3463;450;776;317;1734;1211;2649,2651;617,893,1576;352;1662;893;371,1662;1291,1405;893;1738;601;95,1727,2322;903;29,893,2247;2500;332,1120,1121;791;676;743;1537;194,195;2376;1615;893;1303;1661;1179;29,1248,3343;412;959,2723,2724,2725,2726,2727,2728;371,1662;893;574;332;3365;574;392,2461;344;773;1722;489,574;574;1537;893,1179;26,530,574;95,780;436,1573,2396;531;528;1739;1378;893;437;1611;2609;2150,2151;986;1583;934,935;680;893,1046;893;1734;1738;893;539;1537;893;436;665,1097;340;653;893;437;574;1663;1342;743;371,1662;2040;893;893;528;26,382;893;95,893,1046;1615;893;340;893;1758,1759;1758,1759;1758,1759;1758,1759;1758,1759;1758,1759;1758,1759;1854;2360;1013;893;489;1739;1615;383;1337;1738,1747;986;893;893;1615,1738;1661;332,1120,1121;1919;1094;95,893,1046;893;340;574;893;1537;893;2008,2009;26,1598;1246;392,1471,1519,1520,1521,1522;1246;893;1246;1246;934,935;1246;743;2540;893;332,1120,1121;1750;392,1713;756;1888;1234;2126;893;365;1738;743;574;1323,1324;822;450;26,1540,1541;1615;1738;26,2061;822,1608;1894,1895;1895;1739;670;919;934,935;743;846;1739;574;1738,1747;285;1046,1565;893;1660;1442,1443;1231;2561;893;782;1738;1833;893;1739;372;1738;1528,1529;1537,3229,3230,3231,3232;633;1660;574;363;574;574;574;1739;1738,1747;798;1097,3382;332,1120,1121;1422;358;1739;1661;26,363,1203;1537;893;1739;340;26;3591;893;893;574;2459;1309;1246;1246;2789;986;1738,1747;893;887,1094,1918;893;482,822;574,1037,2287;1739;1984,2297;893;1687;2897;977,978;1246;574;347;498;100;332;1533;743;1687;1615;893;1615;542,1367,1446;893;-2839;3506;893;1738;383;1615;528;893;332;926;688;574;609;574;1663;1738;26,27;26;822;994;893;574;344;1745;1739;26,54;51,52;26,54;26,54;574;1660;743;347,1632;893;119;1118;934,935;574;574;893;1452;893;1246;986;26;26;1537;1537;893;26;986;436,747,1547;2488;1246;893;1615;893;220;1495;986;219;2067;412,986;352;392,1713;2919;743;1574;1738;399;1246;893;743;743;26,382;986;26,424;934,935;95,893,1046;1427;1408;383;893;1915;2521;2332;344;1615;1739;893;26;1615;638;609;450,574;574;340;436,1283;770;1474;412,986;440;450;893;397,574;574;531,574;554;3612;462;986;1145;893;1246;1537,3229,3230,3231,3232;352;26;893;894;2681;893;412;893;638;1078;893;1738,1747;893;392;574;1738;2794;26;798;2830,2831;29,1248,3343;2021;382,416,531;450;574;893;65;26;450;1195,1201;743;530,1653;574;574;371;427;743;574;574;450;371,815;415,450,574;743;1632;926;1149;1452;1097,3382;638;1714,2347;893;392,1713;344;2609;1615;1246;1976;1758,1759;80;3377;27;2609;773,1839;934,935;893;752;1738,1747;95;986;893;893;893;392,2062;773;1537;893;1738;3336;371;893;893;638;3150;1738;450,574;413;893;26;332,1120,1121;65;893;2224,2225,2226;3548;472;1205;1388;450;1615;1132;574;934,935;1221;2035;743;934,935;743;934,935;1221;574;549;531;934,935;28;95;574;574;26;26;893;986;574;986;371;1661;436,747;893;1750;2000;95,2322;344;371,1662;3070;347;601;893;1615;399;1611;2579;371,1662;26;1246;482,761;2751,2777;450,489;893;340;91;1401;1537;1537;1383;1537;887;26;1246;26,986,2680;382;450,574;1738,1747;2175;1661;1659;1097,3382;1662;1537;1097,3382;397,554,574;364,462,526,1663;1659;1337;26,399,1663,1666,1861,1862,1863;251,252,253;1094;215,216;574;26,3160;926;638;340;26,399,986,1861,1863;457;2033;26,436,986,1325;1449,1450;893;822;415;1469,1470,1471;1612;1734;1703;1739;601;1388,2262;29;1471;1606;796;91;1220;1738,1747;1661;601;574;1739;688;893;26,986,2783;383;364,554;1325;95,773,2322;893;1738;1246;893,1046;1738,1747;602;853;333,2184;287,288;609;609;893;893;1000,1001,1002;100,633,2736;371;770,1118,1243;1696;1661;2609;143;1246;3227;3026;776,1544,1545;118;986;27;893;77;1491;382;26;864;574;26,924,1768;26,1769,1770;317;2425;893;881;1246;26,1270,2399;229,231;335;128;436,1497,1585;462,1020;2609;1246;1246;1738;3103,3104,3105;26;26,2432;392,1471,1519,1520,1521,1522;26;574;554;26,2906;617,1497,2897,3187;893;95;26;442,1652;893;1537;26,1270,2399;1661;965;574;26,1540;26;574;26,2512;574;363,415,482,489,1058,1059,1060;26,986;371,1662;1537;17,18,19,20,21,22,23,24,25,323,324,325,326,327,328,329,330,331;1138;509,510;26;383;1537;528,822,2586;95;1615;1704;1739;743;437,574;112;893;1094;1738;1738;893;1734,1750,1752;1723;776;112,243,244,352,1727;1246;3297,3298,3299,3300;3297,3298,3299,3300;17,18,19,20,21,22,23,24,25,323,324,325,326,327,328,329,330,331;934,935;2951,2952;574;934,935;934,935;574;934,935;934,935;363;1237,1909;528;574;574;1663;617;29;26,382;770;2071;893;1097,3382;893;893;893;372;1667;416;1738,1747;371;371,374;574;1323;1704;574;363;1738,1739;1005;1393,1394;26;26,399,1662,1861,1863;1246;2609;2640;893;1739;450;574;489,574;986;1739;2080;3055;1738,1739;1295;95,1726,1727,2322;893;893;893;574;2304;986;934,935;1537,3229,3230,3231,3232;934,935;652;893;1168;1758,1759;392,1471,1519,1520,1521,1522;934,935;934,935;893;3512;1739;344;638;926;1738,1747;1615;1739;247,248;1436,1437,1438;332,1120,1121;893;1738,1747;29,3368,3369;638;743;528,574;450;776,893,1529;574;1738,1747;2883;743;26,504;574;1323,2826;514;347;747;2572;1118;2816;893;358,1220;638;1246;574;1401;893;26,27;399;893;1739;1739;1738;1114;1246;934,935;893;893;2631;893;2134;2767,2768,2769,2770,2771;1661;1094;2248;26,27;893;893;387;1663;372;986;779;225;1739;1715,1716;876;634;3233;893;371,1662;1738;1615;607;1246;416;1739;1537;1739;1734;100,117,3533,3534,3535,3536,3537;1537;340;1469,1470,1471;1662;893;893;893,1537;617,1643,1712,1804,1805,1806;791;791;740;474;782,1118;296,297,332,1739;95;1738,1747;340,688;332;1615;371,489,1657;893;688;638;893;2237;2321;280,281;893;1130,3463;3463;893;554;1561,1562,1563;1664;574;1662;893;1375,2348;1662;2000;1337;1615;893;893;26,29,528,1248,3343,3344;1491;1739;574;893;893;371,489,1657;2628;522;2628;959,2723,2724,2725,2726,2727,2728;2015,2016;436,986,1230,1269;893;1703;450;743;893;2748;332;1537;1246;986,3083;609;1739;482;371;3245;961,1457,1458;934,935;1079,2413;885;574;1379;1246;1246;967;436;743;743;26,1471;26;1715,1716;392,1471,1519,1520,1521,1522;1848;1246;638;397;574;710,711,946;392;112;3576;776,3053;450;392,1422;1100;668,822,1243,1375,2022;893;563;450,459;397,554;363;2049;934,935;3000,3001,3002,3003;68,2876,2878,2879,2882,2884;450,574;986;1347;514;704;1401;1703;1615;986,1090,1766,1767;371;335;3310;1739;893;1758,1759;1758,1759;416;2047;574;574,893;1615;607;1739;489,1655;574;986;743;1246;26;893;893;514;1246;743;574;1452;392,1713;893;1537;1615;893;95,2322;332,1120,1121;1818,1819;574;934,935;893;638;893;1202;189,190;574;574,2006;1996;1207;1661;1738,2372;637;95;934,935;893;95;392,1537,1715,3325;26;2503;483,528,1029,1081,1660;1094;112;482;638;617,3395;3208,3209,3210;3208,3209,3210;3208,3209,3210;95,893,1046;1615;1254;26;893;1958;893;383;1084;26,27;893,1046;29;934,935;574;934,935;1868;3154;1758,1759;1738;1246;1246;1246;893;1307;893;893;1662,2065;574;26;2215;893;1574;422;893;893;1615;1337;1615;421;1340,1341,1342;583;893;893;332;317,436;893;893;986,1537;893;1660,1661,1662;1738;893,1179;638;436;609;26,27;986;1194;332;2037;893;1537;1246;934,935;1924;893;1738;489,574;743;26;2309;934,935;2000;392,1713;846;743;893;770;1736;26;893;1714;743;95;574;743;26,54;26,54;1661;1738;1615;3317;26,1496,3214;1662;1663;893;893;15,306,307,308,309,310,311;893;847;1169,1207;118;332;371;2332;1584;893;3448;1661;743;1738;344;574;1750;2332;926;893;437;1094;1011;371;347;893;104,105;893;1246;458;986,1097;491;574;743;1738;878;3386;638;2302;1616;1738;893;1615;2037;1662;1728,1729;436;2030;450;2120,2937;3140;1347;29,1687;893;893;638;1738,1747;893;2450;394,395;1537;585;1218;2020;1839;834;1537;574;934,935;574;893;2126;574;1738;893;893;26;893;1049;1728,1729;791;1738;934,935;1663;773;986;1662;893;26,436,1484;26;1449,1450;1915;893;893;2289;1739;1880;416;1097,3382;450;2044;2044;574;574;3314;450;893;1325,1687,2964,2965;574;450;3326;893;934,935;791;392,1713;1013;405;1661;893;574;1046;1246;773;893;383;392,1471,1519,1520,1521,1522;137;2000;893;893;893;2181;26;822,1453;450;574;574;1668;986;574;29,528;893;1586;371,3588;1739;1246;1542;893;574;1738;332,1739;822;26,1270,2399;1660;1551;1615;26,437;904,905;1097,3382;1249;893;1335;893;3510;893;2476,2477;1734;1537;1738;986;1537;1097,3382;26,399,1861,1863;95,893,1046;1097,3382;531;340;94;1375;26,381,399,986,1861;1537;1659;1537;1537;986;893;1097;392;100;1471;893,1094;26,27;1886;332,1120,1121;2163;574;2209;2000;1615;776,893,1529;893;893;893;3184;2264;450;363;1427;1323;574;893;422;1739;601;1577,1578,1579;127;2340;1750;893;3501;1663;1663;893;1234;1380,1381;893;1738;1739;893;462;1615;1469,1470,1471;853,2184;609,617;893;95;574;2000;893;574;26,1687,1997,2958;392,1471,1519,1520,1521,1522;574;574;26,2844;1326;743;743;26;893,1214;450;3410;1615;822,1453;2215;100;26,1270,2399;1246;26,1270,2399;26,1270,2399;2972;1212,1243;776;122,123;1615;26;2765;1661;1615;399,1097;95;3372;934,935;743;743;495,574;533;1118;498,1662;893;1702;893;95;1739;344;1798,1799;1230;1739;678,1351;1661;893;340;1739;574;2126;371,489,1657,1658;397,554;934,935;743;100;574;1739;743;317;893;332;893;3373;95,3155;2752;1661;1663;371,374,470;893;1243;26,399,1667,1861,1863;1877;489;26,399,1537,1861,1863;1094;893;893;574;1179;574;412;514;1537,3229,3230,3231,3232;893;399;1758,1759;1161;1408;133;450;743;574;893;574;384,617;893;1739;926;1660;1739;893;688;2329;450;3435;893;451;574;1615;893;743;712;893;772;893;1493;392,1713;1246;743;601;893;1738,1747;770;574;743;893;371,437;601,1738,1739;1118;1738,1747;1739;1615;1738;858,859,862;26,1698;1094;574;1715,1716;143,144;822;2271;2271;574;528;95;770;1660;2814;574;574;2155;893;574;26,1540,1541;1878;876;392;1097,3382;1220;3458;893;893;846;1622;1739;1246;893;1118;934,935;2482;617;1042,1043;171,172;1739;743;574;317;2597;893;26,27;1094;893;822;371,1662;1662;28,364,617;893;95;1615;2628;2628;3564;893;26;959,2723,2724,2725,2726,2727,2728;893;893;26,27;893;352;1118;1337;986;352,601;1739;1739;1246;100,2868,2869,2870,2871,2872;1440;2585;617;818;450,580;3233;332,1120,1121;1739;638;776,824;893;574;26;397,554,574;893;340,822;893;26,340,392;450;1452;986;934,935;489,574;1241;532,533;3355;2093;893;95;1537;1246;1995;743;574;893;773;1758,1759;1758,1759;1758,1759;1758,1759;2346;383;1337;893;528,986,1537;1615;95,1551;773;1044;690;3188;802;1246;934,935;893;26;26,54;26,54;26,54;743;1615;1433;1246;450;542,1367,1446;1660,1661,1662;1440;398;1420,1421;934,935;352;743;776;1575,2025;95,392,1324,1485,1486;29,437,528,2207;934,935;531;934,935;1738;743;352;1243;102;1739;1936;1739;372;2458;2062;26;2609;95;743;332,1120,1121;743;554;574;893;893;26;822;893;893;392,1943;618;893;893;392,1471,1519,1520,1521,1522;1518;1615;1246;397;1118;574,2808;134;26,27;743;934,935;26,27;974;1758,1759;26,27,28,29;528,574,1537;2275;574;2177;2037;574;893;607;26,27,28,29;335;1662,2065;1739;743;332,1120,1121;893;574;1750;1703;1246;1246;1130,3463;65;1615,1738;1703;825;498;893;770;2613,2614;26,436,1568,1569;986;1615;1273;893;3158,3159;1738;2000;1246;893;1246;26,27;1051;335;3337;1551,1715,1716;392,1471,1519,1520,1521,1522;1735;1706;1130,3463;1615;574;3141;1246;1739;486,2076,2398;574;2609;893;986;934,935;574,1091;1615;893;2712;574;1237;893;893;100;1993;893;1687;1738;791;344;1661;26;383;77,3514;2288;864;363,574;1396;986;531;416;2609;2609;1350;1615;1246;934,935;893;344;934,935;2000;462;2073;1739;893;574;587,588;573;926;1664;1246;1233;1376;1738;574;332;818;1347;528,1659;450;585;554;1739;893;893;893;1615;2709;576,677;1382;1915;1846;574;934,935;95;3510;26;26,1537;660;893;3462;26,1540,1541;371,489,1657;743;528;371,489,1657;813,814;402;1332;2839;601;582;371,1662;1660;893;2765;893;743;2374;1703;2044;2044;1084;893;893;3041;574;893;1246;1422;791;893;2209;1738,1747;574;2075;1739;26,27;95;893;893;893;26,27;393,574;822,893,1046,1525;1738,1747;1246;344,1258,1615;2009;450;383;95;26,27;26,437;934,935;574;415,416,840;743;986;574;893;893;332,1120,1121;1738,1747;893;985;26,947,1911,1912;893;1750,3136,3137;986;893;392,1471,1519,1520,1521,1522;422;1738;2751,2776,2777;397;1097;1667;1097,3382;229,1582;1662;26,399,1861;893;528;1246;1471;893;26,399,986,1861,1863;1661;1738;893;1230;1623;371,436,747;601,1739;1738;450,574;574;1738,1747;941;638;1738;1660;893;332,1120,1121;1615;1469,1470,1471;791;893;1738;574;965,1092;893;1662;347,1687,1997;459;652;574;893;1661;1662;3565,3566;1246;893;340;1388;574;574;1246;528,574;2342;371,1662;1734;1246;1738;1246;483;574;332,1120,1121;26;1207;514;893;405,574,621;1738;1714;507;1427;574;528,893;743;743;181,182,183;1147,1148;1831;3127;26,399,1537,1861,1863;1537;1738;347,1661,1662;26,1661;95;1615;332,1120,1121;1738;934,935;885;1738;1301;114;986,2487;1615;1557,1558,1559;3575;3297,3298,3299,3300;26,770;95,1727,2322;893;893;382;934,935;934,935;2764;26,1270,2399;934,935;2694;95;1661;893;1576;1615;887;617;638;26,399,1666,1861;878,1179;1046;3341;1401;776,1544,1545,1546;2765;450,574;1348;574;1422;372;1660,1661,1662;382,1221;893;574;396;1094;934,935;1662;893;574;1664;887;26;2867;893;422;1246;1663;1738,1747;1221;26;934,935;450;340;26;1739;392,1713;3303;876,1142;893;1615;450;26,27;1738,1739;743;1246;1721;3575;1449,1450;1449,1450;371,437;352;1739;26,27;110;893;2609;26,1491;574;574;893;893;893;1246;2271;893;574;386,387,388;435;437,974,1188;450;1738;363;1246;574;194,195;2000;1660;1221;878;3372;893;482;371,1662;1283;874;574;1661;1739;95;934,935;1537;1418;1738;1246;1615;574,893;2020,2371;26,462,484;893;1738,1747;-3553;1017;1130,3463;893;95;2657,2658,2659;1615;893;422;893;593;332;986;822,1404,2634,2635;2772,2773;1739;1703;1584;1337;1337;1337;822,893,1046,1525;1738;26,3008;678;675,2195;3161;542,1367,1446;1776;893;2509;3054;574;822;893;1053;26,1040;26;1664;934,935;95,2322;1537;1734;1989;607;1739;1722;95;2609;574;822;609;849;1338;554;27,1090,1662,1763;893;743;893;743;1615;743;450;143,163;887;743;1246;1758,1759;1758,1759;1758,1759;1758,1759;1738;1337;573;893;770;69,70,71;1337;26,54;1246;1246;1246;332,1120,1121;1738,1747;986;1221;2129;1738,1747;3103,3104;1615;893;1246;770;893;1836;893;528,1967;934,935;65,1590;893;893;26;1663;3215,3216;1169;340;450,489;1739;1738,1747;392,1471,1519,1520,1521,1522;601;934,935;743;1739;893;1169;437;893;574;2095;1738,1747;893;893;893;1243;347;965,1314;934,935;574;26,27;2609;1739;2177;1739;574;1246;1246;1738;1246;1466;1738,1747;743;1615;1246;893;893;893;392,1471,1519,1520,1521,1522;977,978;558,612,977,978;773,828;3065;893;1738;3102;687;1094;26,27;770;95;1739;893;893;743;574;332;2310;3593;934,935;1710;1739;1722;926;2044;574;26,27,28,29;1958;364;615;119,1207;1739;1615;2034;893;344;1662;601;382;1739;893;893;1000,1001,1002;952,1992,2060;574;1895;1375;893;450;397,554,574;574;358;422;1615;358;1049;1179;26,27;1738;540;1738;574;573;846;392,1471,1519,1520,1521,1522;574;160,161;1758,1759;3099;2796;29;2830,2831;425,798,2506;926;934,935;934,935;574;574;450,574;926;926;893,1046;437,495;893;893;893,1453,1555;574;2044;372;574;482;574;1661;1230;1750;26,27;1246;399;26,27;1537;26;893;1221;1615;893;560;893;1094;1243;893;893;609;3179;688;2601;893;1662,1667;893;934,935;934,935;893;893;604;349,350,351,893;2583;986;3521;1097,3382;2710;574;1738;574;1419;1097,3382;528;893;1980;773;3445;1738,1747;1537;1246;3334;1660;26,399,1666,1861,1863;1097,3382;26,399,1666;1739;574;1663;1738;743;26,676,1662;1661;26,399,986,1861,1863;893;317;1662;301,302;638;893;1136;1739;930;3035;791;1739;657,658;1738,1747;1661;893;853,2184;1365;1776;893;934,935;934,935;574;1025,2603;1195,1196,1197,1198,1199,1200,1201;743;893;332,1120,1121;893;1094;1660;2966,2967;3019;1615;1246;1738,1747;1660,2152;95,893,1046;844;893;3041;893;1738;100;1687;26;371;26;1537;893;1615;1739;1615;1217;1246;392,1471,1519,1520,1521,1522;1727;1419;893;371,489,1657;893,1179;574;2034;934,935;934,935;934,935;1644;601;1738;1064;574;26;1118;26;2578;864;893;416;762;2034;26,382;1471;574;893;893;934,935;1590;1510;1510;893;893;1739;1094;893;934,935;893;26,95,422;1738,1747;372;1245;926,1899;3022;528;822,893,1046,1525;2397;574;743;1469,1470,1471;332;371,893;1323;893;638,836;770;893;638;846;26,54;574;2029;653;2609;574;574;26;1738;893;1738,1747;1660;1537;986;893;776;1739;2000;1738,1747;893;3009;416;986;2649;893;27;893;773;100;26,2483;893;574;776;2488;1230;528;893;95;26;893;574;574;354,1615;986;1191,1192;638;574;3527;1739;26;489;1615;574;26,54;26,54;26,54;1739;986;332,1120,1121;26,1452;3484,3485;2100;1025;95;422;842,986;335;743;893;1890;822;893;340;1715,1716;1661;26,1537;1524;574;526;893;770;1758,1759;1758,1759;1758,1759;1758,1759;1758,1759;1758,1759;1471;951,952;1738;547;26,54;26,54;26,54;26,54;26,54;26,54;26,54;26,54;26,54;26,54;893;839;1660;383,422;1055;574;1739;1246;1068;1661;352;893;893;332;574;893;332,1120,1121;1615;450,1221;332,1120,1121;2609;893;934,935;934,935;352;893;1739;1615;1580;876;1661;1416,1417;332;893;974;1739;1246;1615;893;688;317,1046;3463;1130,3463;1130,3463;1130,3463;2323;893;392,1471,1519,1520,1521,1522;383;822,893,1046,1525;332;2215;1221;3394;332,1120,1121;1440;1662;422,827;1738;-1047,1527;1046;26,27;638;26,1367;893;574;743;1246;26,27;1715,1716;1615;26,1270,2399;26,27;986;822,893,1046,1525;934,935;926;1735;1738,1747;1615;1659;1360;1612;371,712;332;776,893;893;2498;422,437,574;1889;26,416,755;1739;893;1345,1346;1028;1086,1615;1615;2037;934,935;2829;893;743;743;934,935;317;791;1040;340;638;903;1281;-2889,-2890,-2891,-2892,-2893;250;26,1537,2936;340;597;893;415,1650,1651;926;609;893;601;574;2044;893;2609;26,27;436,747;1738,1739;335,1072;317;1738,1747;1615;688,893;26,27;354,357;1615;399;1661;893;821;26,27;893;332,1120,1121;416;1615;145;1739;893;573;26;26,574;383;201;574;934,935;1097,3382;1469,1470,1471;616;397,617,921,1662,2426,2427;26,399,986;392,1471,1519,1520,1521,1522;3517,3518;893;893;893,3047;601,1739;574;893,1706;26;574;1738;29;1362;1064;1739,1975;1738;893;1738;770;332,1120,1121;1738;574;1097;450;392,1471,1519,1520,1521,1522;77;1846;2849;893;893,1372;332,1120,1121;1246;1632;574,1632;371,715;363,489,574;1703;773;1615,1620;1234;986,3306;462;437;26;1661;773;1615;934,935;822;1738;450;893;1663;2650;893;1645;574;1739;743;15,-27,306,307,308,309,310,311;332,1120,1121;347,815;893;907;1054;372;1660;2378;1615;422;1431;638;773;574;638;893;2946,3447;574;574;422;893;352;1179;1359;1246;934,935;574;112,514,3387;776,2249;1703;29;1739;1738;392,1422;1738;1431;1739;26,1537;1372,1991;1788,2739;26;893;893;1130;893;462;332;1471;1715,1716;2261;574;893;822,893,1046,1525;1448;26,27;893;893;893;2584;347;840;26,27;1337;2441;26,54;2441;26,54;574;332;2318;482;383;574;934,935;2801;743;893;1615;383;1758,1759;1758,1759;-726,1758,1759;1758,1759;1758,1759;1758,1759;1758,1759;1758,1759;1758,1759;1758,1759;26,1270,2399;1431;1703;397,554,574;893;601;450;1615;574;743;1615;893;1246;1739;352;822;782;1615;1615;893;1738;934,935;574;893;2383;893;1179;2989;2192;893;392,1713;893;965,2986,2987;974;112,119,3564;893,1453,1555;1246;893;893;1246;1246;1246;876;893;893;607;743;934,935;1739;26,462;1246;422;1990;1640;1660;893;1246;565;893;26,54;26,54;2551;1739;574;1739;100,689;26,27,28,29;524,1038;893;3444;533;2212;893;574;893;1662;1246;926;1094;1615;1097,3382;638;1287;1703;2097;926;2000;2709;194,303;1246;3402,3403;2044;2044;791;1537;1221;2344;893;1739;1615;791;3506;1425;26,54;26,54;26,54;26,54;26,54;26,54;26,54;26,54;489,574;574;100,633;1246;1230;1703;1885;1097,3382;915;1132,1282;574;574;893;638;893;893;26;1310;1537;1537;1958;1738;462;743;893;26,399,986,1861,1863;399;557,558;1703;893;1449,1450;900;1711;893;3000,3001,3002;893;893;1738,1753;95;791;2962;26,27;893;1221;383;1738;372;791;2138;1440;1477;574;95;743;26,27,28,29;2008,2009;3306;574;1029;26,986;574;1660;1615;1615;462;791;1615;893;893;3489;459;1703;607;26,350,1188;1661;398;3402,3403;397;445;770;574,893,986;1097,3382;2901;547;1738,1739;1735;2000;1659;712;574;1738,1739;1221;855;1738;893;574;465;1738;422;776,1544,1545;1663;3095;609;1215;1739;1739;2382;1528,1529;489,574;1537;893;26,27;574;2265;1537;1440;528;893;893;335;1615;638;383;306,307,309,2804;1734;934,935;416;3124;934,935;26,54;986;893;2584;2584;926;1758,1759;1758,1759;1758,1759;1758,1759;1758,1759;26,1270,2399;2609;1615;574;436;383;1739;574;573;2644;893;1738;893;934,935;1738,1747;2740;574;1738;574;934,935;1246;1246;1246;770;2987;26,27;26,27,29;100,456;926;1246;1246;1246;893;1739;26,27,28,29;1872;1297;1739;1241,1342;893;1983;1246;436;893;273;893;2746,2747;893;1739;770;1347;26,1270,2399;1246;1739;893;1237;1738;392;893;26,1660;893;893;934,935;1428;1047;1246;903;2010;926;97,173;607;1246;1758,1759;1758,1759;2044;791;332,1120,1121;893;574;352;1615;1703;574;1739;422;1577,1578,1579;335;1958;1035;1615;335;332,1120,1121;249;1837;893;26,1270,2399;1738,1747;332;574;2955;1738;1738;1097,3382;340;1347;1320;1739;1094;95;95;26,1537;770,1702;207,211;2126;574,893;900;893;422;1615;26,1674,1863;26,27,28;770;26;26,27,28,29;26,27;363;1703;1758,1759;574;1615;2609;1758,1759;332,1120,1121;893;2609;1615;1738,1739;3402,3403;2488;900;782;1220;3505;893;770;617,1537;3463;-1492;332,1120,1121;574;258,259;422,465;450;1661;26,54;893;1734;893;893;574,898;1739;893;2180;1758,1759;1758,1759;1758,1759;1758,1759;893;1615;29;26,1270,2399;1739;26,27,28,29;2739;601;26,462,1661;893;574,2131;1246;2306;1062,1254;1659;688;332;26,27;607;926;1431;296,3583;893;3586;573;26;1738;1738;1864;770;638;1347;2273;2718,2719,2720;26,54;26,54;26,54;26,54;26,54;26,54;26,27;1246;1615;1537;893;1615;893;1739;514;354;574;876;1739;3162;893;888;1246;399;1018;1739;26;26,2936;798;798;1738;893;926;926;770;1738,1747;3464;332,1120,1121;450;95,2646;1758,1759;26,1270,2399;373;1431;1739;903;574;574;382;26,27;1703;893;893;1422;26,399,1861,1863;1738;893;893;1449,1450;1222,1615;1739;332,1120,1121;601;893;1739;27;1291;2369;893;770;422,1094;347;1739;1615;893;934,935;1662;1703;3157;853;26,1066,1067;1615;2243;26,1663;638;893;26,1270,2399;893;1537,3174;1246;1615;1739;371;893;893;2636;1661;1537;574;392,1713;893;495,607;2484;332,893;344;1738;607;893;893;26;2203,2204;2532;1615;574;437;926;893;893;1758,1759;1758,1759;1758,1759;1758,1759;822,1323;1615;1615;1728,1729;1739;465;3402,3403;574;893;392,1713;1661;893;637;26,27;26,27;1758,1759;887;1615;383;1615;1660,1661,1662;934,935;1739;26,27,28;770;1615;893;1615;1670;2609;1834,1835;893;2829;893;1615;523;305;26;1758,1759;435;798;1722;3522;926;612;1758,1759;372;986;893;2609;1246;26,27;1378;609;1094;574;1431;1739;26,54;26,54;26,54;26,54;26,54;1739;1243;1624;1738;1739;332;1739;1738,1747;893;743;2111;3139;2632;574;175,176;1661;1659;392,1471,1519,1520,1521,1522;1738,1739;574,2073;1291;26,1270,2399;822,893,1046,1525;340;1615;2516;1537,3229,3230,3231,3232,3233;1739;26,27,28,29;893;1325;3402,3403;1738;392,1713;773;26,1270,2399;1347;2306;574;372;1738;893;2122;893;95,2322;1234;1000,1001,1002;1921;100;1758,1759;1758,1759;1758,1759;1758,1759;1758,1759;1758,1759;132;26,27;26,1270,2399;26,27;26,27;26;1738;1738;893;1954;352;638;26,1270,2399;422;1738;2829;1615,3004;601;574;893;1172;1739;876;1423;573;1758,1759;3129;26,1270,2399;1663;65;893;893;791;893;332;1739;26,2636;456;3106;26,798;574;1738;546;77;1347;332,1120,1121;893;1715,1716;26,626,627;2073;770;2165;1285;26,1270,2399;26,54;26,54;26,54;26,54;1758,1759;893;609;332,1120,1121;26;1101;893;26,1270,2399;893;1246;332;482;1328,1662,1667;893;893;1738;1738;3463;900;893;1615;770;1758,1759;1758,1759;1615;121;2008,2009;482;26,27,28,29;1660,1661,1662;3402,3403;1660;3470;473;2829;1179;1758,1759;1663;1097,3382;3060;383;1703;574;2609;1615;1179;893;352;147,148;1094;893;2652,2653;2485;1661;1347;340;1615;1615;1739;1471;26,27;893;893;300;2507,2508;1758,1759;893;3402,3403;893;1800,1801;371;3463;893;542;1758,1759;392,843;335;688;893;573;770;372;3363;893;773;1758,1759;332,1120,1121;344;318,319,334,335,3597;1097;26;26;893;2000;893;893;320,321;893;1758,1759;3402,3403;403,436,747,1663;332,1120,1121;893;893;347,573;3402,3403;3402,3403;609;3316;95;737;1431;95;574;26,1270,2399;27;1537;26,1188,1230,1701;770;1431;1104;3013;893;1662;26,1270,2399;3402,3403;2480;26,1270,2399;1738;332;1386;2774,2993;893;371,436,747;573;1347;3402,3403;1385;26,1270,2399;26,1270,2399;1537;422;3402,3403;893;26,27,28,29;3402,3403;1663;2315;1738;1347;3402,3403;1615;770;770;26;1890;27;26;3402,3403;574;960;893;3404;1615;1739;893;893;65;397,573;1758,1759;879;3402,3403;27;1758,1759;462;887;3235;893;383;3402,3403;913;782;574;3402,3403;893;3402,3403;26,54;26,54;26,54;26,54;26,54;893;187,188;26,54;26,54;26,54;26,54;26,54;26,54;26,54;26,54;26,54";

const $scriptletHostnames$ = /* 13255 */ ["j.gs","s.to","3sk.*","al.ly","asd.*","bc.vc","br.de","bs.to","clk.*","di.fm","fc.lc","fr.de","fzm.*","g3g.*","gmx.*","hqq.*","kat.*","lz.de","m4u.*","mt.de","nn.de","nw.de","o2.pl","op.gg","ouo.*","oxy.*","pnd.*","rp5.*","sh.st","sn.at","th.gl","tpb.*","tu.no","tz.de","ur.ly","vev.*","voe.*","vz.lt","wa.de","wn.de","wp.de","wp.pl","wr.de","x.com","ytc.*","yts.*","za.gl","ze.tt","00m.in","1hd.to","2ddl.*","33sk.*","4br.me","4j.com","538.nl","74k.io","9tsu.*","a8ix.*","agf.nl","aii.sh","al.com","as.com","av01.*","bab.la","bbf.lt","bcvc.*","bde4.*","btdb.*","btv.bg","c2g.at","cbc.ca","ckk.ai","crn.pl","d-s.io","djs.sk","dlhd.*","dna.fr","dnn.de","dodz.*","dood.*","eio.io","epe.es","ettv.*","ew.com","exe.io","eztv.*","fbgo.*","fnp.de","ft.com","geo.de","geo.fr","goo.st","gra.pl","haz.de","hbz.us","hd21.*","hdss.*","hna.de","iir.ai","iiv.pl","imx.to","ioe.vn","jav.re","jav.sb","jav.si","javx.*","kaa.mx","kat2.*","kio.ac","kkat.*","kmo.to","kwik.*","la7.it","lne.es","lvz.de","m5g.it","met.bz","mexa.*","mmm.dk","mtv.fi","nj.com","nnn.de","nos.nl","now.gg","now.us","noz.de","npo.nl","nrz.de","nto.pl","och.to","oii.io","oii.la","ok.xxx","oke.io","oko.sh","ovid.*","pahe.*","pe.com","pnn.de","poop.*","qub.ca","ran.de","rgb.vn","rgl.vn","rtl.de","rtv.de","sab.bz","sfr.fr","shz.de","siz.tv","srt.am","svz.de","tek.no","tf1.fr","tfp.is","tii.la","tio.ch","tny.so","top.gg","tpi.li","tv2.no","tvn.pl","tvtv.*","txxx.*","uii.io","upns.*","vido.*","vip.de","vod.pl","voe.sx","vox.de","vsd.fr","waaw.*","waz.de","wco.tv","web.de","xnxx.*","xup.in","xxnx.*","yts2.*","zoro.*","0xxx.ws","10gb.vn","1337x.*","1377x.*","1ink.cc","24pdd.*","5278.cc","5play.*","7mmtv.*","7xm.xyz","8tm.net","a-ha.io","adn.com","adsh.cc","adsrt.*","adsy.pw","adyou.*","adzz.in","ahri8.*","ak4eg.*","akoam.*","akw.cam","akwam.*","an1.com","an1me.*","arbsd.*","babla.*","bbc.com","bgr.com","bgsi.gg","bhg.com","bild.de","biqle.*","bunkr.*","car.com","cbr.com","cbs.com","cdna.tv","chip.de","cine.to","clik.pw","cnn.com","cpm.icu","crn.com","ctrlv.*","cuty.me","dbna.de","delo.bg","dict.cc","digi.no","dirp.me","dlhd.sx","docer.*","doods.*","doood.*","elixx.*","enit.in","eska.pl","exe.app","exey.io","faz.net","ffcv.es","filmy.*","fojik.*","fomo.id","fox.com","fpo.xxx","gala.de","gala.fr","gats.io","gdtot.*","giga.de","gk24.pl","gntai.*","gnula.*","goku.sx","gomo.to","gotxx.*","govid.*","gp24.pl","grid.id","gs24.pl","gsurl.*","hdvid.*","hdzog.*","hftg.co","igram.*","inc.com","inra.bg","itv.com","jav.one","javhd.*","jizz.us","jmty.jp","joyn.at","joyn.ch","joyn.de","jpg2.su","jpg6.su","k1nk.co","k511.me","kaas.ro","kfc.com","khsm.io","kijk.nl","kino.de","kinox.*","kinoz.*","koyso.*","ksl.com","ksta.de","lato.sx","laut.de","leak.sx","link.tl","linkz.*","linx.cc","litv.tv","lnk2.cc","logi.im","lulu.st","m4uhd.*","mail.de","mdn.lol","mega.nz","mexa.sh","mlfbd.*","mlsbd.*","mlwbd.*","moco.gg","moin.de","mopo.de","more.tv","moto.it","movi.pk","mtv.com","myegy.*","n-tv.de","nba.com","nbc.com","netu.ac","news.at","news.bg","news.de","nfl.com","nmac.to","noxx.to","nuvid.*","odum.cl","oe24.at","oggi.it","oload.*","onle.co","onvid.*","opvid.*","oxy.edu","oyohd.*","pelix.*","pes6.es","pfps.gg","pngs.gg","pobre.*","prad.de","qiwi.gg","qmh.sex","rabo.no","rat.xxx","raw18.*","rmcmv.*","sat1.de","sbot.cf","seehd.*","send.cm","sflix.*","sixx.de","sms24.*","songs.*","spy.com","stape.*","stfly.*","swfr.tv","szbz.de","tlin.me","tr.link","tube8.*","tune.pk","tvhay.*","tvply.*","tvtv.ca","tvtv.us","u.co.uk","ujav.me","uns.bio","upi.com","upn.one","upvid.*","vcp.xxx","veev.to","vidd.se","vidhd.*","vidoo.*","vidop.*","vidup.*","vipr.im","viu.com","vix.com","viz.com","vkmp3.*","vods.tv","vox.com","vozz.vn","vpro.nl","vudeo.*","waaaw.*","waaw1.*","welt.de","wgod.co","wiwo.de","wwd.com","xtits.*","ydr.com","yiv.com","yout.pw","ytmp3.*","zeit.de","zeiz.me","zien.pl","0deh.com","123mkv.*","15min.lt","1flix.to","1mov.lol","20min.ch","2embed.*","2ix2.com","3prn.com","4anime.*","4cash.me","4khd.com","519.best","58n1.com","7mmtv.sx","85po.com","9xflix.*","a2zapk.*","aalah.me","actvid.*","adbull.*","adeth.cc","adfloz.*","adfoc.us","adsup.lk","aetv.com","afly.pro","agefi.fr","al4a.com","alpin.de","anoboy.*","arcor.de","ariva.de","asiaon.*","atxtv.co","auone.jp","ayo24.id","azsoft.*","babia.to","bbw6.com","bdiptv.*","bdix.app","bif24.pl","bigfm.de","bilan.ch","bing.com","binged.*","bjhub.me","blick.ch","blick.de","bmovie.*","bombuj.*","booru.eu","brato.bg","brevi.eu","bunkr.la","bunkrr.*","cam4.com","canna.to","capshd.*","cataz.to","cety.app","cgaa.org","chd4.com","cima4u.*","cineb.gg","cineb.rs","cinen9.*","citi.com","clk.asia","cnbc.com","cnet.com","crichd.*","crone.es","cuse.com","cwtv.com","cybar.to","cykf.net","dahh.net","dazn.com","dbna.com","deano.me","dewimg.*","dfiles.*","dlhd.*>>","doods.to","doodss.*","dooood.*","dosya.co","dotgg.gg","duden.de","dump.xxx","ecac.org","eldia.es","emoji.gg","ervik.as","espn.com","exee.app","exeo.app","exyi.net","fastt.gg","fembed.*","files.cx","files.fm","files.im","filma1.*","finya.de","fir3.net","flixhq.*","fmovie.*","focus.de","friv.com","frvr.com","fupa.net","fxmag.pl","fzlink.*","g9r6.com","ganool.*","gaygo.tv","gdflix.*","ggjav.tv","gload.to","glodls.*","gogohd.*","gokutv.*","gol24.pl","golem.de","grok.com","gtavi.pl","gusto.at","hackr.io","haho.moe","hd44.com","hd44.net","hdbox.ws","hdfull.*","heftig.*","heise.de","hidan.co","hidan.sh","hilaw.vn","hltv.org","howdy.id","hoyme.jp","hpjav.in","hqtv.biz","html.net","huim.com","hulu.com","hydrax.*","hyhd.org","iade.com","ibbs.pro","icelz.to","idnes.cz","imgdew.*","imgsen.*","imgsto.*","imgviu.*","isi7.net","its.porn","j91.asia","janjua.*","jmanga.*","jmmv.dev","jotea.cl","kaido.to","katbay.*","kcra.com","kduk.com","keepv.id","kizi.com","kloo.com","kmed.com","kmhd.net","kmnt.com","kpnw.com","ktee.com","ktmx.pro","kukaj.io","kukni.to","kwro.com","l8e8.com","l99j.com","la3c.com","lablue.*","lared.cl","lejdd.fr","levif.be","lin-ks.*","link1s.*","linkos.*","liveon.*","lnk.news","ma-x.org","magesy.*","mail.com","mazpic.*","mcloud.*","mgeko.cc","miro.com","missav.*","mitly.us","mixdrp.*","mixed.de","mkvhub.*","mmsbee.*","moms.com","money.bg","money.pl","movidy.*","movs4u.*","my1ink.*","my4w.com","myad.biz","mycima.*","myl1nk.*","myli3k.*","mylink.*","mzee.com","n.fcd.su","ncaa.com","newdmn.*","nhl66.ir","nick.com","nikke.gg","nohat.cc","nola.com","notube.*","ogario.*","orsm.net","oui.sncf","pa1n.xyz","pahe.ink","pasend.*","payt.com","pctnew.*","picks.my","picrok.*","pingit.*","pirate.*","pixlev.*","pluto.tv","plyjam.*","plyvdo.*","pogo.com","pons.com","porn.com","porn0.tv","pornid.*","pornx.to","qa2h.com","quins.us","quoka.de","r2sa.net","racaty.*","radio.at","radio.de","radio.dk","radio.es","radio.fr","radio.it","radio.pl","radio.pt","radio.se","ralli.ee","ranoz.gg","rargb.to","rasoi.me","rdr2.org","rdxhd1.*","rintor.*","rootz.so","roshy.tv","saint.to","sanet.lc","sanet.st","sbchip.*","sbflix.*","sbplay.*","sbrulz.*","seeeed.*","senda.pl","seriu.jp","sex3.com","sexvid.*","shopr.tv","short.pe","shrink.*","shtab.su","shtms.co","shush.se","slant.co","so1.asia","sport.de","sport.es","spox.com","sptfy.be","stern.de","strtpe.*","svapo.it","swdw.net","swzz.xyz","sxsw.com","sxyprn.*","t20cup.*","t7meel.*","tasma.ru","tbib.org","tele5.de","thegay.*","thekat.*","thoptv.*","tirexo.*","tmearn.*","tobys.dk","today.it","toggo.de","tokon.gg","trakt.tv","trend.at","trrs.pro","tubeon.*","tubidy.*","tv247.us","tvepg.eu","tvn24.pl","tvnet.lv","txst.com","udvl.com","upapk.io","uproxy.*","uqload.*","urbia.de","uvnc.com","v.qq.com","vanime.*","vapley.*","vedbam.*","vedbom.*","vembed.*","venge.io","vibe.com","vid4up.*","vidlo.us","vidlox.*","vidsrc.*","viki.com","vipbox.*","viper.to","viprow.*","virpe.cc","vlive.tv","voe.sx>>","voici.fr","voxfm.pl","vozer.io","vozer.vn","vtbe.net","vtmgo.be","vtube.to","vumoo.cc","vxxx.com","wat32.tv","watch.ug","wcofun.*","wcvb.com","webbro.*","wepc.com","wetter.*","wfmz.com","wkyc.com","woman.at","work.ink","wowtv.de","wp.solar","wplink.*","wttw.com","ww9g.com","wyze.com","x1337x.*","xcum.com","xh.video","xo7c.com","xpics.me","xvide.me","xxf.mobi","xxr.mobi","xxu.mobi","y2mate.*","yelp.com","yepi.com","youx.xxx","yporn.tv","yt1s.com","yt5s.com","ytapi.cc","ythd.org","ytmp3.cc","z4h4.com","zbporn.*","zdrz.xyz","zee5.com","zooqle.*","zshort.*","0vg9r.com","10.com.au","10short.*","123link.*","123mf9.my","18xxx.xyz","1milf.com","1stream.*","2024tv.ru","26efp.com","2conv.com","2glho.org","2kmovie.*","2ndrun.tv","3dzip.org","3movs.com","4share.vn","4stream.*","4tube.com","51sec.org","5flix.top","5mgz1.com","5movies.*","6jlvu.com","7bit.link","7mm003.cc","7starhd.*","9anime.pe","9hentai.*","9xbuddy.*","9xmovie.*","a-o.ninja","a2zapk.io","abcya.com","acortar.*","adcorto.*","adsfly.in","adshort.*","adurly.cc","aduzz.com","afk.guide","agar.live","ah-me.com","aikatu.jp","airtel.in","alphr.com","ampav.com","andyday.*","anidl.org","anikai.to","animekb.*","animesa.*","anitube.*","aniwave.*","anizm.net","apkmb.com","apkmody.*","apl373.me","apl374.me","apl375.me","appdoze.*","appvn.com","aram.zone","arc018.to","arcai.com","art19.com","artru.net","asd.homes","atlaq.com","atomohd.*","awafim.tv","aylink.co","azel.info","azmen.com","azrom.net","bakai.org","bdlink.pw","beeg.fund","befap.com","bflix.*>>","bhplay.me","bibme.org","bigwarp.*","biqle.com","bitfly.io","bitlk.com","blackd.de","blkom.com","blog24.me","blogk.com","bmovies.*","boerse.de","bolly4u.*","boost.ink","brainly.*","buffed.de","busuu.com","c1z39.com","cambabe.*","cambb.xxx","cambro.io","cambro.tv","camcam.cc","camcaps.*","camhub.cc","canela.tv","canoe.com","casi3.xyz","ccurl.net","cda-hd.cc","cdn1.site","cdn77.org","cdrab.com","cfake.com","chatta.it","chyoa.com","cinema.de","cinetux.*","cl1ca.com","clamor.pl","cloudy.pk","cmovies.*","comunio.*","ctrl.blog","curto.win","cutdl.xyz","cutty.app","cybar.xyz","czxxx.org","d000d.com","d0o0d.com","daddyhd.*","daybuy.tw","debgen.fr","dfast.app","dfiles.eu","dflinks.*","dhd24.com","djmaza.my","djstar.in","djx10.org","dlgal.com","do0od.com","do7go.com","domaha.tv","doods.pro","doooood.*","doply.net","dotflix.*","doviz.com","dropzy.io","drrtyr.mx","drtuber.*","drzna.com","dumpz.net","dvdplay.*","dx-tv.com","dz4soft.*","eater.com","echoes.gr","efhjd.com","efukt.com","eg4link.*","egybest.*","egydead.*","eltern.de","embedme.*","embedy.me","embtaku.*","emovies.*","enorme.tv","entano.jp","eodev.com","erogen.su","erome.com","eroxxx.us","erzar.xyz","europix.*","evaki.fun","evo.co.uk","exego.app","eyalo.com","f16px.com","fabtcg.gg","fap16.net","fapnado.*","faps.club","fapxl.com","faselhd.*","fast-dl.*","fc-lc.com","feet9.com","femina.ch","ffjav.com","file4go.*","fileq.net","filma24.*","filmex.to","finfang.*","flixhd.cc","flixhq.ru","flixhq.to","flixhub.*","flixtor.*","flvto.biz","flyad.vip","fmj.co.uk","fmovies.*","fooak.com","forsal.pl","foundit.*","foxhq.com","freep.com","freewp.io","frembed.*","frprn.com","fshost.me","ftopx.com","ftuapps.*","fuqer.com","furher.in","fx-22.com","gahag.net","gayck.com","gayfor.us","gayxx.net","gdirect.*","ggjav.com","gifhq.com","giize.com","globo.com","glodls.to","gm-db.com","gmanga.me","gofile.to","gojo2.com","gomov.bio","gomoviz.*","goplay.su","gosemut.*","goshow.tv","gototub.*","goved.org","gowyo.com","goyabu.us","gplinks.*","gsdn.live","gsm1x.xyz","guum5.com","gvnvh.net","hanime.tv","happi.com","haqem.com","hax.co.id","hd-xxx.me","hdfilme.*","hdgay.net","hdhub4u.*","hdrez.com","hdss-to.*","heavy.com","hellnaw.*","hentai.tv","hh3dhay.*","hhesse.de","hianime.*","hideout.*","hitomi.la","hmt6u.com","hoca2.com","hoca6.com","hoerzu.de","hojii.net","hokej.net","hothit.me","hotmovs.*","hugo3c.tw","huyamba.*","hxfile.co","i-bits.io","ibooks.to","icdrama.*","iceporn.*","ico3c.com","idpvn.com","ihow.info","ihub.live","ikaza.net","ilinks.in","imeteo.sk","img4fap.*","imgmaze.*","imgrock.*","imgtown.*","imgur.com","imgview.*","imslp.org","ingame.de","intest.tv","inwepo.co","io.google","iobit.com","iprima.cz","iqiyi.com","ireez.com","isohunt.*","janjua.tv","jappy.com","japscan.*","jasmr.net","javbob.co","javboys.*","javcl.com","javct.net","javdoe.sh","javfor.tv","javfun.me","javhat.tv","javhd.*>>","javmix.tv","javpro.cc","javup.org","javwide.*","jkanime.*","jootc.com","kali.wiki","karwan.tv","katfile.*","keepvid.*","ki24.info","kick4ss.*","kickass.*","kicker.de","kinoger.*","kissjav.*","klmanga.*","koora.vip","krx18.com","kuyhaa.me","kzjou.com","l2db.info","l455o.com","lawyex.co","lecker.de","legia.net","lenkino.*","lesoir.be","linkfly.*","liveru.sx","ljcam.net","lkc21.net","lmtos.com","lnk.parts","loader.fo","loader.to","loawa.com","lodynet.*","lookcam.*","lootup.me","los40.com","m.kuku.lu","m4ufree.*","mamadu.pl","mangaku.*","manhwas.*","maniac.de","mapple.tv","marca.com","matele.be","mavplay.*","mboost.me","mc-at.org","mcrypto.*","mega4up.*","merkur.de","messen.de","mgnet.xyz","mhn.quest","mihand.ir","milfnut.*","miniurl.*","mitele.es","mixdrop.*","mkvcage.*","mkvpapa.*","mlbbox.me","mlive.com","mmo69.com","mobile.de","mod18.com","momzr.com","mov2day.*","mp3clan.*","mp3fy.com","mp3spy.cc","mp3y.info","mrgay.com","mrjav.net","msic.site","multi.xxx","mxcity.mx","mynet.com","mz-web.de","nbabox.co","ncdnstm.*","nekopoi.*","netcine.*","neuna.net","news38.de","nhentai.*","niadd.com","nikke.win","nkiri.com","nknews.jp","notion.so","nowgg.lol","nozomi.la","npodoc.nl","nxxn.live","nyaa.land","nydus.org","oatuu.org","obsev.com","ocnpj.com","ofiii.com","ofppt.net","ohmymag.*","ok-th.com","okanime.*","okblaz.me","omavs.com","oosex.net","opjav.com","orunk.com","owlzo.com","pahe.plus","palabr.as","palimas.*","pasteit.*","pastes.io","pcwelt.de","pelis28.*","pepar.net","pferde.de","phica.net","phodoi.vn","phois.pro","picrew.me","pixhost.*","pkembed.*","player.pl","plylive.*","pogga.org","popjav.in","poqzn.xyz","porn720.*","porner.tv","pornfay.*","pornhat.*","pornhub.*","pornj.com","pornlib.*","porno18.*","pornuj.cz","powvdeo.*","premio.io","profil.at","psarips.*","pugam.com","pussy.org","pynck.com","q1003.com","qcheng.cc","qcock.com","qlinks.eu","qoshe.com","quizz.biz","radio.net","rarbg.how","readm.org","redd.tube","redisex.*","redtube.*","redwap.me","remaxhd.*","rentry.co","rexporn.*","rexxx.org","rezst.xyz","rezsx.xyz","rfiql.com","riveh.com","rjno1.com","rock.porn","rokni.xyz","rooter.gg","rphost.in","rshrt.com","ruhr24.de","rytmp3.io","s2dfree.*","saint2.cr","samfw.com","satdl.com","sbnmp.bar","sbplay2.*","sbplay3.*","sbsun.com","scat.gold","seazon.fr","seelen.io","seexh.com","seory.xyz","series9.*","seulink.*","sexmv.com","sextb.*>>","sezia.com","sflix.pro","shape.com","shlly.com","shmapp.ca","shorten.*","shrdsk.me","shrib.com","shrinke.*","shrtfly.*","skardu.pk","skpb.live","skysetx.*","slate.com","slink.bid","smutr.com","son.co.za","songspk.*","spcdn.xyz","sport1.de","sssam.com","ssstik.io","staige.tv","stfly.biz","strmup.cc","strmup.to","strmup.ws","strtape.*","study.com","swame.com","swgop.com","syosetu.*","sythe.org","szene1.at","talaba.su","tamilmv.*","taming.io","tatli.biz","tech5s.co","teensex.*","terabox.*","tgo-tv.co","themw.com","thgss.com","thothd.to","thothub.*","tinhte.vn","tnp98.xyz","to.com.pl","today.com","todaypk.*","tojav.net","topflix.*","topjav.tv","torlock.*","tpaste.io","tpayr.xyz","tpz6t.com","trutv.com","tryzt.xyz","tubev.sex","tubexo.tv","turbo1.co","tvguia.es","tvinfo.de","tvlogy.to","tvporn.cc","txori.com","txxx.asia","ucptt.com","udebut.jp","ufacw.com","uflash.tv","ujszo.com","ulsex.net","unicum.de","upbam.org","upfiles.*","upiapi.in","uplod.net","uporn.icu","upornia.*","uppit.com","uproxy2.*","upxin.net","upzone.cc","uqozy.com","urlcero.*","ustream.*","uxjvp.pro","v1kkm.com","vdtgr.com","vebo1.com","veedi.com","vg247.com","vid2faf.*","vidbm.com","vidcdn.co","vide0.net","videobb.*","vidfast.*","vidmoly.*","vidplay.*","vidsrc.cc","vidzy.org","vienna.at","vinaurl.*","vinovo.to","vip1s.top","vipurl.in","vivuq.com","vladan.fr","vnuki.net","voodc.com","vtlinks.*","vttpi.com","vvid30c.*","vvvvid.it","w3cub.com","waezg.xyz","waezm.xyz","webtor.io","wecast.to","weebee.me","wetter.de","wildwap.*","winporn.*","wiour.com","wired.com","woiden.id","world4.eu","wpteq.org","wvt24.top","x-tg.tube","x24.video","xbaaz.com","xbabe.com","xcafe.com","xcity.org","xcoic.com","xcums.com","xecce.com","xexle.com","xhand.com","xhbig.com","xmovies.*","xnxxw.net","xpaja.net","xtapes.me","xtapes.to","xvideos.*","xvipp.com","xxx24.vip","xxxhub.cc","xxxxxx.hu","y2down.cc","yeptube.*","yeshd.net","ygosu.com","yjiur.xyz","ymovies.*","youku.com","younetu.*","youporn.*","yt2mp3s.*","ytmp3s.nu","ytpng.net","ytsaver.*","yu2be.com","zdnet.com","zedge.net","zefoy.com","zhihu.com","zjet7.com","zojav.com","zrozz.com","0gogle.com","0gomovie.*","10starhd.*","123anime.*","123chill.*","13tv.co.il","141jav.com","18tube.sex","1apple.xyz","1bit.space","1kmovies.*","1link.club","1stream.eu","1tamilmv.*","1todaypk.*","1xanime.in","1ytmp3.com","222i8x.lol","2best.club","2the.space","2umovies.*","3fnews.com","3hiidude.*","3kmovies.*","4-liga.com","4kporn.xxx","4porn4.com","4tests.com","4tube.live","5ggyan.com","5xmovies.*","720pflix.*","8boobs.com","8muses.xxx","8xmovies.*","91porn.com","96ar.com>>","9908ww.com","9animes.ru","9kmovies.*","9monate.de","9xmovies.*","9xupload.*","a1movies.*","acefile.co","acortalo.*","adshnk.com","adslink.pw","aeonax.com","aether.mom","afdah2.com","akmcloud.*","all3do.com","allfeeds.*","ameede.com","amindi.org","anchira.to","andani.net","anime4up.*","animedb.in","animeflv.*","animeid.tv","animekai.*","animesup.*","animetak.*","animez.org","anitube.us","aniwatch.*","aniwave.uk","anodee.com","anon-v.com","anroll.net","ansuko.net","antenne.de","anysex.com","apkhex.com","apkmaven.*","apkmody.io","arabseed.*","archive.fo","archive.is","archive.li","archive.ph","archive.vn","arcjav.com","areadvd.de","aruble.net","ashrfd.xyz","ashrff.xyz","asiansex.*","asiaon.top","asmroger.*","ate9ni.com","atishmkv.*","atomixhq.*","atomtt.com","av-cdn.xyz","av01.media","avjosa.com","awpd24.com","axporn.com","ayuka.link","babeporn.*","baikin.net","bakotv.com","bandle.app","bang14.com","bayimg.com","bblink.com","bbw.com.es","bdokan.com","bdsmx.tube","bdupload.*","beatree.cn","beeg.party","beeimg.com","bembed.net","bestcam.tv","bf0skv.org","bigten.org","bildirim.*","bloooog.it","bluetv.xyz","bnnvara.nl","boards.net","bodytr.com","boombj.com","borwap.xxx","bos21.site","boyfuck.me","brian70.tw","brides.com","brillen.de","brmovies.*","brstej.com","btvplus.bg","byrdie.com","bztube.com","calvyn.com","camflow.tv","camfox.com","camhoes.tv","camseek.tv","capital.de","cashkar.in","cavallo.de","cboard.net","cdn256.xyz","ceesty.com","cekip.site","cerdas.com","cgtips.org","ciberdvd.*","cimanow.cc","cityam.com","citynow.it","ckxsfm.com","cluset.com","codare.fun","code.world","cola16.app","colearn.id","comtasq.ca","connect.de","cookni.net","cpscan.xyz","creatur.io","crewus.net","cricfree.*","cricfy.net","crictime.*","crohasit.*","csrevo.com","cuatro.com","cubshq.com","cuckold.it","cuevana.is","cuevana3.*","cutnet.net","cwseed.com","d0000d.com","ddownr.com","deezer.com","demooh.com","depedlps.*","desiflix.*","desimms.co","desired.de","destyy.com","dev2qa.com","dfbplay.tv","diaobe.net","disqus.com","djamix.net","djxmaza.in","dloady.com","dnevnik.hr","do-xxx.com","dogecoin.*","dojing.net","domahi.net","donk69.com","doodle.com","dopebox.to","dorkly.com","downev.com","dpstream.*","drivebot.*","driveup.in","drphil.com","dshytb.com","dsmusic.in","dtmaga.com","du-link.in","dvm360.com","dz4up1.com","earncash.*","earnload.*","easysky.in","ebony8.com","ebookmed.*","ebuxxx.net","edmdls.com","egyup.live","elmundo.es","embed.casa","embedv.net","emsnow.com","emurom.net","epainfo.pl","eplayvid.*","eplsite.uk","erofus.com","erotom.com","eroxia.com","evileaks.*","evojav.pro","ewybory.eu","exnion.com","express.de","f1livegp.*","f1stream.*","f2movies.*","fabmx1.com","fakaza.com","fake-it.ws","falpus.com","familie.de","fandom.com","fapcat.com","fapdig.com","fapeza.com","fapset.com","faqwiki.us","fautsy.com","fboxtv.com","fbstream.*","festyy.com","ffmovies.*","fhedits.in","fikfak.net","fikiri.net","fikper.com","filedown.*","filemoon.*","fileone.tv","filerio.in","filesq.net","film1k.com","film4e.com","filmi7.net","filmovi.ws","filmweb.pl","filmyfly.*","filmygod.*","filmyhit.*","filmypur.*","filmywap.*","finanzen.*","finclub.in","flickr.com","flixbaba.*","flixhub.co","flybid.net","fmembed.cc","forgee.xyz","formel1.de","foxnxx.com","freeload.*","freenet.de","freevpn.us","friars.com","frogogo.ru","fsplayer.*","fstore.biz","fuckdy.com","fullreal.*","fulltube.*","fullxh.com","funzen.net","funztv.com","fuxnxx.com","fxporn69.*","fzmovies.*","gadgets.es","game5s.com","gamenv.net","gamepro.de","gatcha.org","gawbne.com","gaydam.net","gcloud.cfd","gdfile.org","gdmax.site","gdplayer.*","gestyy.com","gifans.com","giff.cloud","gigaho.com","givee.club","gkbooks.in","gkgsca.com","gleaks.pro","gmenhq.com","gnomio.com","go.tlc.com","gocast.pro","gochyu.com","goduke.com","goeags.com","goegoe.net","gofilmes.*","goflix.sbs","gogodl.com","gogoplay.*","gogriz.com","gomovies.*","google.com","gopack.com","gostream.*","goutsa.com","gozags.com","gozips.com","gplinks.co","grasta.net","gtaall.com","gunauc.net","haddoz.net","hamburg.de","hamzag.com","hanauer.de","hanime.xxx","hardsex.cc","harley.top","hartico.tv","haustec.de","haxina.com","hcbdsm.com","hclips.com","hd-tch.com","hdfriday.*","hdporn.net","hdtoday.cc","hdtoday.tv","hdzone.org","hechos.net","hentaisd.*","hextank.io","hhkungfu.*","hianime.to","himovies.*","hitprn.com","hivelr.com","hl-live.de","hoca4u.com","hoca4u.xyz","hostxy.com","hotmasti.*","hotovs.com","house.porn","how2pc.com","howifx.com","hqbang.com","hub2tv.com","hubcdn.vip","hubdrive.*","huoqwk.com","hydracdn.*","icegame.ro","iceporn.tv","idevice.me","idlix.asia","idlixvip.*","igay69.com","illink.net","ilmeteo.it","imag-r.com","imgair.net","imgbox.com","imgbqb.sbs","imginn.com","imgmgf.sbs","imgpke.sbs","imguee.sbs","indeed.com","indobo.com","inertz.org","infulo.com","ingles.com","ipamod.com","iplark.com","ironysub.*","isgfrm.com","issuya.com","itdmusic.*","iumkit.net","iusm.co.kr","iwcp.co.uk","jakondo.ru","japgay.com","japscan.ws","jav-fun.cc","jav-xx.com","jav.direct","jav247.top","jav380.com","javbee.vip","javbix.com","javboys.tv","javbull.tv","javdo.cc>>","javembed.*","javfan.one","javfav.com","javfc2.xyz","javgay.com","javhdz.*>>","javhub.net","javhun.com","javibe.net","javlab.net","javmix.app","javmvp.com","javneon.tv","javnew.net","javopen.co","javpan.net","javpas.com","javplay.me","javqis.com","javrip.net","javroi.com","javseen.tv","javsek.net","jnews5.com","jobsbd.xyz","joktop.com","joolinks.*","josemo.com","jpgames.de","jpvhub.com","jrlinks.in","jvideo.xyz","jytechs.in","kaaltv.com","kaliscan.*","kamelle.de","kaotic.com","kaplog.com","katlinks.*","kedoam.com","keepvid.pw","kejoam.com","kelaam.com","kendam.com","kenzato.uk","kerapoxy.*","keroseed.*","key-hub.eu","kiaclub.cz","kickass2.*","kickasst.*","kickassz.*","king-pes.*","kinobox.cz","kinoger.re","kinoger.ru","kinoger.to","kjmx.rocks","kkickass.*","klooam.com","klyker.com","kochbar.de","kompas.com","kompiko.pl","kotaku.com","kropic.com","kvador.com","kxbxfm.com","l1afav.net","labgame.io","lacrima.jp","larazon.es","leeapk.com","leechall.*","leet365.cc","leolist.cc","lewd.ninja","lglbmm.com","lidovky.cz","likecs.com","line25.com","link1s.com","linkbin.me","linkpoi.me","linkshub.*","linkskat.*","linksly.co","linkspy.cc","linkz.wiki","liquor.com","listatv.pl","live7v.com","livehere.*","livetvon.*","lollty.pro","lookism.me","lootdest.*","lopers.com","lorcana.gg","love4u.net","loveroms.*","lumens.com","lustich.de","lxmanga.my","m2list.com","macwelt.de","magnetdl.*","mahfda.com","mandai.com","mangaraw.*","mangceh.cc","manwan.xyz","mascac.org","mat6tube.*","mathdf.com","maths.news","maxicast.*","medibok.se","megadb.net","megadede.*","megaflix.*","megafly.in","megalink.*","megaup.net","megaurl.in","megaxh.com","meltol.net","meong.club","mhdtvmax.*","milfzr.com","mitaku.net","mixdroop.*","mlbb.space","mma-core.*","mmnm.store","mmopeon.ru","mmtv01.xyz","molotov.tv","mongri.net","motchill.*","movibd.com","movie123.*","movie4me.*","moviegan.*","moviehdf.*","moviemad.*","movies07.*","movies2k.*","movies4u.*","movies7.to","moviflex.*","mozkra.com","mp3cut.net","mp3guild.*","mp3juice.*","mreader.co","mrpiracy.*","mtlurb.com","mult34.com","multics.eu","multiup.eu","multiup.io","multiup.us","musichq.cc","my-subs.co","mydaddy.cc","myjest.com","mykhel.com","mylust.com","myplexi.fr","myqqjd.com","myvideo.ge","myviid.com","naasongs.*","nackte.com","naijal.com","nakiny.com","namasce.pl","namemc.com","nbabite.to","nbaup.live","ncdnx3.xyz","negumo.com","neonmag.fr","neoteo.com","neowin.net","netfree.cc","newhome.de","newpelis.*","news18.com","newser.com","nexdrive.*","nflbite.to","ngelag.com","ngomek.com","ngomik.net","nhentai.io","nickles.de","niyaniya.*","nmovies.cc","noanyi.com","nocfsb.com","nohost.one","nosteam.ro","note1s.com","notube.com","novinky.cz","noz-cdn.de","nsfw247.to","nswrom.com","ntucgm.com","nudes7.com","nullpk.com","nuroflix.*","nxbrew.net","nxprime.in","nypost.com","odporn.com","odtmag.com","ofwork.net","ohorse.com","ohueli.net","okleak.com","okmusi.com","okteve.com","onehack.us","oneotv.com","onepace.co","onepunch.*","onezoo.net","onloop.pro","onmovies.*","onmsft.com","onvista.de","openload.*","oploverz.*","orirom.com","otomoto.pl","owsafe.com","paminy.com","papafoot.*","parents.at","pbabes.com","pc-guru.it","pcbeta.com","pcgames.de","pctfenix.*","pcworld.es","pdfaid.com","peetube.cc","people.com","phc.web.id","phim85.com","picmsh.sbs","pictoa.com","pilsner.nu","pingit.com","pirlotv.mx","pixelio.de","plaion.com","planhub.ca","playboy.de","playfa.com","playgo1.cc","plc247.com","poapan.xyz","pondit.xyz","poophq.com","popcdn.day","poplinks.*","poranny.pl","porn00.org","porndr.com","pornfd.com","porngo.com","porngq.com","pornhd.com","pornhd8k.*","pornky.com","porntb.com","porntn.com","pornve.com","pornwex.tv","pornx.tube","pornxp.com","pornxp.org","pornxs.com","pouvideo.*","povvideo.*","povvldeo.*","povw1deo.*","povwideo.*","powlideo.*","powv1deo.*","powvibeo.*","powvideo.*","powvldeo.*","premid.app","progfu.com","prosongs.*","proxybit.*","proxytpb.*","prydwen.gg","psychic.de","pudelek.pl","puhutv.com","putlog.net","qqxnxx.com","qthang.net","quicomo.it","radio.zone","raenonx.cc","rakuten.tv","ranker.com","rawinu.com","rawlazy.si","realgm.com","rebahin.pw","redfea.com","redgay.net","reeell.com","regio7.cat","rencah.com","reshare.pm","rgeyyddl.*","rgmovies.*","riazor.org","rlxoff.com","rmdown.com","roblox.com","rodude.com","romsget.io","ronorp.net","roshy.tv>>","routech.ro","rsrlink.in","rule34.art","rule34.xxx","rule34.xyz","rule34ai.*","rumahit.id","s1p1cd.com","s2dfree.to","s3taku.com","sakpot.com","samash.com","savego.org","sawwiz.com","sbrity.com","sbs.com.au","scribd.com","sctoon.net","scubidu.eu","seed69.com","seeflix.to","serien.cam","seriesly.*","sevenst.us","sexato.com","sexjobs.es","sexkbj.com","sexlist.tv","sexodi.com","sexpin.net","sexpox.com","sexrura.pl","sextor.org","sextvx.com","sfile.mobi","shahid4u.*","shinden.pl","shineads.*","shlink.net","sholah.net","shorttey.*","shortx.net","shortzzy.*","showflix.*","shrinkme.*","shrt10.com","sibtok.com","sikwap.xyz","silive.com","simpcity.*","skeimg.com","skmedix.pl","smoner.com","smsget.net","snbc13.com","snopes.com","snowmtl.ru","soap2day.*","socebd.com","sokobj.com","solewe.com","sombex.com","sourds.net","soy502.com","spiegel.de","spielen.de","sportal.de","sportbar.*","sports24.*","srvy.ninja","ssdtop.com","sshkit.com","ssyou.tube","stardima.*","stemplay.*","stiletv.it","stpm.co.uk","strcloud.*","streamsb.*","streamta.*","strefa.biz","sturls.com","suaurl.com","sumoweb.to","sunhope.it","szene38.de","tapetus.pl","target.com","taxi69.com","tcpvpn.com","tech8s.net","techhx.com","telerium.*","terafly.me","texte.work","th-cam.com","thatav.net","theacc.com","thecut.com","thedaddy.*","theproxy.*","thevidhd.*","thevouz.in","thosa.info","thothd.com","thripy.com","thumb8.net","thumb9.net","tickzoo.tv","tiscali.it","tktube.com","tokuvn.com","tokuzl.net","toorco.com","topito.com","toppng.com","torlock2.*","torrent9.*","tr3fit.xyz","tranny.one","trust.zone","trzpro.com","tsubasa.im","tsz.com.np","tubesex.me","tubous.com","tubsexer.*","tubtic.com","tugaflix.*","tulink.org","tumblr.com","tunein.com","turbovid.*","tutelehd.*","tutsnode.*","tutwuri.id","tuxnews.it","tv0800.com","tvline.com","tvnz.co.nz","tvtoday.de","twatis.com","uctnew.com","uindex.org","uiporn.com","unito.life","uol.com.br","up-load.io","upbaam.com","updato.com","updown.cam","updown.fun","updown.icu","upfion.com","upicsz.com","uplinkto.*","uploadev.*","uploady.io","uporno.xxx","uprafa.com","ups2up.fun","upskirt.tv","uptobhai.*","uptomega.*","urlpay.net","usagoals.*","userload.*","usgate.xyz","usnews.com","ustimz.com","ustream.to","utreon.com","uupbom.com","vadbam.com","vadbam.net","vadbom.com","vbnmll.com","vcloud.lol","vdbtm.shop","vecloud.eu","veganab.co","veplay.top","vevioz.com","vgames.fun","vgmlinks.*","vidapi.xyz","vidbam.org","vidcloud.*","vidcorn.to","vidembed.*","videyx.cam","videzz.net","vidlii.com","vidnest.io","vidohd.com","vidomo.xyz","vidoza.net","vidply.com","viewfr.com","vinomo.xyz","vipboxtv.*","vipotv.com","vipstand.*","vivatube.*","vizcloud.*","vortez.net","vrporn.com","vvide0.com","vvtlinks.*","wapkiz.com","warps.club","watch32.sx","watch4hd.*","watcho.com","watchug.to","watchx.top","wawacity.*","weather.us","web1s.asia","webcafe.bg","weloma.art","weshare.is","weszlo.com","wetter.com","wetter3.de","wintub.com","woiden.com","wooflix.tv","woxikon.de","ww9g.com>>","www.cc.com","x-x-x.tube","xanimu.com","xasiat.com","xberuang.*","xhamster.*","xhopen.com","xhspot.com","xhtree.com","xhvid1.com","xiaopan.co","xmorex.com","xmovie.pro","xmovies8.*","xnxx.party","xpicse.com","xprime4u.*","xrares.com","xsober.com","xspiel.com","xsz-av.com","xszav.club","xvideis.cc","xxgasm.com","xxmovz.com","xxxdan.com","xxxfiles.*","xxxmax.net","xxxrip.net","xxxsex.pro","xxxtik.com","xxxtor.com","xxxxsx.com","y-porn.com","y2mate.com","y2tube.pro","ygozone.gg","ymknow.xyz","yomovies.*","youapk.net","youmath.it","youpit.xyz","youwatch.*","yseries.tv","ytanime.tv","ytboob.com","ytjar.info","ytmp4.live","yts-subs.*","yumacs.com","yuppow.com","yuvutu.com","yy1024.net","z12z0vla.*","zeefiles.*","zenless.gg","zilinak.sk","zillow.com","zoechip.cc","zoechip.gg","zpaste.net","zthots.com","0123movie.*","0gomovies.*","0rechner.de","10alert.com","111watcho.*","11xmovies.*","123animes.*","123movies.*","12thman.com","141tube.com","173.249.8.3","17track.net","18comic.vip","1movieshd.*","1xanimes.in","2gomovies.*","2rdroid.com","3bmeteo.com","3dyasan.com","3hentai.net","3ixcf45.cfd","3xfaktor.hu","423down.com","4funbox.com","4gousya.net","4players.de","4shared.com","4spaces.org","4tymode.win","5j386s9.sbs","69games.xxx","76078rb.sbs","7review.com","7starmv.com","80-talet.se","8tracks.com","9animetv.to","9goals.live","9jarock.org","a-hentai.tv","aagmaal.com","abs-cbn.com","abstream.to","ad-doge.com","adictox.com","adisann.com","adshrink.it","afilmywap.*","africue.com","afrodity.sk","ahmedmode.*","aiailah.com","aipebel.com","airevue.net","akirabox.to","allkpop.com","almofed.com","almursi.com","altcryp.com","alttyab.net","analdin.com","anavidz.com","andiim3.com","anibatch.me","anichin.top","anigogo.net","animahd.com","anime-i.com","anime3d.xyz","animeblix.*","animebr.org","animehay.tv","animehub.ac","animepahe.*","animesex.me","anisaga.org","anitube.vip","aniworld.to","anomize.xyz","anonymz.com","anqkdhcm.nl","anxcinema.*","anyporn.com","anysex.club","aofsoru.com","aosmark.com","apekite.com","apkdink.com","apkhihe.com","apkshrt.com","apksvip.com","aplus.my.id","app.plex.tv","apritos.com","aquipelis.*","arabstd.com","arabxnx.com","arbweb.info","area51.porn","arenabg.com","arkadmin.fr","artnews.com","asia2tv.com","asianal.xyz","asianclub.*","asiangay.tv","asianload.*","asianplay.*","ask4movie.*","asmr18.fans","asmwall.com","asumesi.com","atravan.net","ausfile.com","auszeit.bio","autobild.de","autokult.pl","automoto.it","autopixx.de","autoroad.cz","autosport.*","avcesar.com","avitter.net","avjamak.net","axomtube.in","ayatoon.com","azmath.info","b2bhint.com","b4ucast.com","babaktv.com","babeswp.com","babyclub.de","badjojo.com","badtaste.it","barfuck.com","batman.city","bbwfest.com","bcmanga.com","bdcraft.net","bdmusic23.*","bdmusic28.*","bdsmporn.cc","beelink.pro","beinmatch.*","berich8.com","berklee.edu","bfclive.com","bg-gledai.*","bi-girl.net","bigconv.com","bigojav.com","bigshare.io","bigwank.com","bitco.world","bitlinks.pw","bitzite.com","blog4nx.com","blogue.tech","blu-ray.com","blurayufr.*","bokepxv.com","bollyflix.*","book18.fans","bootdey.com","botrix.live","bowfile.com","boxporn.net","brbeast.com","brbushare.*","brigitte.de","bristan.com","bsierad.com","btcbitco.in","btvsport.bg","btvsports.*","buondua.com","buzzfeed.at","buzzfeed.de","buzzpit.net","bx-zone.com","bypass.city","bypass.link","cafenau.com","camclips.tv","camel3.live","camsclips.*","camslib.com","camwhores.*","canaltdt.es","carbuzz.com","ccyig2ub.nl","ch-play.com","chatgbt.one","chatgpt.com","chefkoch.de","chicoer.com","chochox.com","cima-club.*","cinedesi.in","civitai.com","claimrbx.gg","clapway.com","clkmein.com","club386.com","cocorip.net","coldfrm.org","collater.al","colnect.com","comicxxx.eu","commands.gg","comnuan.com","comohoy.com","converto.io","corneey.com","corriere.it","cpmlink.net","cpmlink.pro","crackle.com","crazydl.net","crdroid.net","crvsport.ru","csurams.com","cubuffs.com","cuevana.pro","cupra.forum","cut-fly.com","cutearn.net","cutlink.net","cutpaid.com","cutyion.com","daddyhd.*>>","daddylive.*","daftsex.biz","daftsex.net","daftsex.org","daij1n.info","dailyweb.pl","daozoid.com","dawenet.com","ddlvalley.*","decrypt.day","deltabit.co","devotag.com","dexerto.com","digit77.com","digitask.ru","direct-dl.*","discord.com","disheye.com","diudemy.com","divxtotal.*","dj-figo.com","djqunjab.in","dlpanda.com","dma-upd.org","dogdrip.net","dogtime.com","donlego.com","dotycat.com","doumura.com","douploads.*","downsub.com","dozarte.com","dramacool.*","dramamate.*","dramanice.*","drawize.com","droplink.co","dropmms.com","ds2play.com","dsharer.com","dsvplay.com","dudefilms.*","dz4link.com","dziennik.pl","e-glossa.it","e2link.link","e9china.net","earnbee.xyz","earnhub.net","easy-coin.*","easybib.com","ebookdz.com","echiman.com","echodnia.eu","ecomento.de","edjerba.com","eductin.com","einthusan.*","elahmad.com","elfqrin.com","elliott.org","embasic.pro","embedmoon.*","embedpk.net","embedtv.net","empflix.com","emuenzen.de","enagato.com","endfield.gg","eoreuni.com","eporner.com","eroasmr.com","erothots.co","erowall.com","esgeeks.com","eshentai.tv","eskarock.pl","eslfast.com","europixhd.*","everand.com","everia.club","everyeye.it","exalink.fun","exeking.top","ezmanga.net","f2movies.to","f51rm.com>>","fapdrop.com","fapguru.com","faptube.com","farescd.com","fastdokan.*","fastream.to","fastssh.com","fbstreams.*","fchopin.net","fdvzg.world","feyorra.top","fffmovies.*","figtube.com","file-up.org","file4go.com","file4go.net","filecloud.*","filecrypt.*","filelions.*","filemooon.*","filepress.*","fileq.games","filesamba.*","filesus.com","filmcdn.top","filmisub.cc","films5k.com","filmy-hit.*","filmy4web.*","filmydown.*","filmygod6.*","findjav.com","firefile.cc","fit4art.com","flixrave.me","flixsix.com","fluentu.com","fluvore.com","fmovies0.cc","folkmord.se","foodxor.com","footybite.*","forumdz.com","foumovies.*","foxtube.com","fplzone.com","freenem.com","freepik.com","frpgods.com","fseries.org","fsx.monster","ftuapps.dev","fuckfuq.com","futemax.zip","g-porno.com","gal-dem.com","gamcore.com","game-2u.com","game3rb.com","gameblog.in","gameblog.jp","gamehub.cam","gamelab.com","gamer18.net","gamestar.de","gameswelt.*","gametop.com","gamewith.jp","gamezone.de","gamezop.com","garaveli.de","gaytail.com","gayvideo.me","gazzetta.gr","gazzetta.it","gcloud.live","gedichte.ws","genialne.pl","get-to.link","getmega.net","getthit.com","gevestor.de","ggbases.com","girlmms.com","girlshd.xxx","gisarea.com","gitizle.vip","gizmodo.com","goalup.live","gobison.com","gocards.com","gocast2.com","godeacs.com","godmods.com","godtube.com","goducks.com","gofilms4u.*","gofrogs.com","gogifox.com","gogoanime.*","goheels.com","gojacks.com","gokerja.net","gold-24.net","golobos.com","gomovies.pk","gomoviesc.*","goodporn.to","gooplay.net","gorating.in","gosexy.mobi","gostyn24.pl","goto.com.np","gotocam.net","gotporn.com","govexec.com","gpldose.com","grafikos.cz","gsmware.com","guhoyas.com","gulf-up.com","h-flash.com","haaretz.com","hagalil.com","hagerty.com","hardgif.com","hartziv.org","haxmaps.com","haxnode.net","hblinks.pro","hdbraze.com","hdeuropix.*","hdmotori.it","hdonline.co","hdpicsx.com","hdpornt.com","hdtodayz.to","hdtube.porn","helmiau.com","hentai20.io","hentaila.tv","herexxx.com","herzporno.*","hes-goals.*","hexload.com","hhdmovies.*","himovies.sx","hindi.trade","hiphopa.net","history.com","hitokin.net","hmanga.asia","holavid.com","hoofoot.net","hoporno.net","hornpot.net","hornyfap.tv","hotabis.com","hotbabes.tv","hotcars.com","hotfm.audio","hotgirl.biz","hotleak.vip","hotleaks.tv","hotscope.tv","hotscopes.*","hotshag.com","hotstar.com","howchoo.com","hubdrive.de","hubison.com","hubstream.*","hubzter.com","hungama.com","hurawatch.*","huskers.com","huurshe.com","hwreload.it","hygiena.com","hypesol.com","icgaels.com","idlixku.com","iegybest.co","iframejav.*","iggtech.com","iimanga.com","iklandb.com","imageweb.ws","imgbvdf.sbs","imgjjtr.sbs","imgnngr.sbs","imgoebn.sbs","imgoutlet.*","imgtaxi.com","imgyhq.shop","impact24.us","in91vip.win","infocorp.io","infokik.com","inkapelis.*","ipa-apps.me","iporntv.net","iptvbin.com","isaimini.ca","isosite.org","ispunlock.*","itpro.co.uk","itudong.com","iv-soft.com","j-pussy.com","jaiefra.com","japanfuck.*","japanporn.*","japansex.me","japscan.lol","javbake.com","javball.com","javbest.xyz","javbobo.com","javboys.com","javcock.com","javdoge.com","javfull.net","javgrab.com","javhoho.com","javideo.net","javlion.xyz","javmenu.com","javmeta.com","javmilf.xyz","javpool.com","javsex.guru","javstor.com","javx357.com","javynow.com","jcutrer.com","jeep-cj.com","jetanimes.*","jetpunk.com","jezebel.com","jixo.online","jjang0u.com","jkanime.net","jnovels.com","jobsibe.com","jocooks.com","jotapov.com","jpg.fishing","jra.jpn.org","jungyun.net","jvembed.com","jxoplay.xyz","karanpc.com","kashtanka.*","kb.arlo.com","khohieu.com","kiaporn.com","kickassgo.*","kiemlua.com","kimoitv.com","kinoking.cc","kissanime.*","kissasia.cc","kissasian.*","kisscos.net","kissmanga.*","kjanime.net","klettern.de","kmansin09.*","kochamjp.pl","kodaika.com","kolyoom.com","komikcast.*","kompoz2.com","kpkuang.org","kppk983.com","ksuowls.com","l23movies.*","l2crypt.com","labstory.in","laposte.net","lapresse.ca","lastampa.it","latimes.com","latitude.to","lbprate.com","leaknud.com","letest25.co","letras2.com","lewdweb.net","lewebde.com","lfpress.com","lgcnews.com","lgwebos.com","libertyvf.*","lifeline.de","liflix.site","ligaset.com","likemag.com","linclik.com","link-to.net","linkmake.in","linkrex.net","links-url.*","linksfire.*","linkshere.*","linksmore.*","lite-link.*","loanpapa.in","lokalo24.de","lookimg.com","lookmovie.*","losmovies.*","losporn.org","lostineu.eu","lovefap.com","lrncook.xyz","lscomic.com","luluvdo.com","luluvid.com","luxmovies.*","m.akkxs.net","m.iqiyi.com","m1xdrop.net","m4maths.com","made-by.org","madoohd.com","madouqu.com","magesypro.*","manga1000.*","manga1001.*","mangahub.io","mangasail.*","manhwa18.cc","maths.media","mature4.net","mavanimes.*","mavavid.com","maxstream.*","mcdlpit.com","mchacks.net","mcloud.guru","mcxlive.org","medisite.fr","mega1080p.*","megafile.io","megavideo.*","mein-mmo.de","melodelaa.*","mephimtv.cc","messitv.net","messitv.org","metavise.in","mgoblue.com","mhdsports.*","mhscans.com","miklpro.com","mirrorace.*","mirrored.to","misterio.ro","mlbstream.*","mmfenix.com","mmsmaza.com","mobifuq.com","moenime.com","momluck.com","momomesh.tv","momondo.com","momvids.com","moonembed.*","moonmov.pro","motohigh.pl","moviebaaz.*","movied.link","movieku.ink","movieon21.*","movieplay.*","movieruls.*","movierulz.*","movies123.*","movies4me.*","movies4u3.*","moviesda4.*","moviesden.*","movieshub.*","moviesjoy.*","moviesmod.*","moviesmon.*","moviesub.is","moviesx.org","moviewr.com","moviezwap.*","movizland.*","mp3-now.com","mp3juices.*","mp3yeni.org","mp4moviez.*","mpo-mag.com","mr9soft.com","mrunblock.*","mtb-news.de","mtlblog.com","muchfap.com","multiup.org","muthead.com","muztext.com","mycloudz.cc","myflixerz.*","mygalls.com","mymp3song.*","mytoolz.net","myunity.dev","myvalley.it","myvidmate.*","myxclip.com","narcity.com","nbabox.co>>","nbastream.*","nbch.com.ar","nbcnews.com","needbux.com","needrom.com","nekopoi.*>>","nelomanga.*","nemenlake.*","netfapx.com","netflix.com","netfuck.net","netplayz.ru","netxwatch.*","netzwelt.de","news.com.au","newscon.org","newsmax.com","nextgov.com","nflbite.com","nflstream.*","nhentai.net","nhlstream.*","nicekkk.com","nichapk.com","nimegami.id","nkreport.jp","notandor.cn","novelism.jp","novohot.com","novojoy.com","nowiny24.pl","nowmovies.*","nrj-play.fr","nsfwr34.com","nudevista.*","nulakers.ca","nunflix.org","nyahentai.*","nysainfo.pl","odiasia.sbs","ofilmywap.*","ogomovies.*","ohentai.org","ohmymag.com","okstate.com","olamovies.*","olarila.com","omuzaani.me","onepiece.gg","onhockey.tv","onifile.com","onneddy.com","ontools.net","onworks.net","optimum.net","ortograf.pl","osxinfo.net","otakudesu.*","otakuindo.*","outletpic.*","overgal.com","overtake.gg","ovester.com","oxanime.com","pagesix.com","paketmu.com","pantube.top","papahd.club","papalah.com","paradisi.de","parents.com","parispi.net","pasokau.com","paste1s.com","payskip.org","pcbolsa.com","pcgamer.com","pdfsite.net","pelisplus.*","peppe8o.com","perelki.net","pesktop.com","pewgame.com","pezporn.com","phim1080.in","pianmanga.*","picbqqa.sbs","picnft.shop","picngt.shop","picuenr.sbs","pinkporno.*","pinterest.*","piratebay.*","pistona.xyz","pitiurl.com","pixjnwe.sbs","pixsera.net","pksmovies.*","pkspeed.net","play.tv3.ee","play.tv3.lt","play.tv3.lv","playrust.io","playtamil.*","playtube.tv","plus.rtl.de","pngitem.com","pngreal.com","pogolinks.*","polygon.com","pomorska.pl","porcore.com","porn3dx.com","porn77.info","porn78.info","porndaa.com","porndex.com","porndig.com","porndoe.com","porndude.tv","porngem.com","porngun.net","pornhex.com","pornhub.com","pornium.net","pornkai.com","pornken.com","pornkino.cc","pornktube.*","pornmam.com","pornmom.net","porno-365.*","pornoman.pl","pornomoll.*","pornone.com","pornovka.cz","pornpaw.com","pornsai.com","porntin.com","porntry.com","pornult.com","poscitech.*","povvvideo.*","powstream.*","powstreen.*","primewire.*","prisjakt.no","promobil.de","pronpic.org","pulpo69.com","pupuweb.com","purplex.app","putlocker.*","pvip.gratis","qdembed.com","quizack.com","quizlet.com","radamel.icu","rainanime.*","raw1001.net","rawkuma.com","rawkuma.net","rawkuro.net","readfast.in","readmore.de","redgifs.com","redlion.net","redporno.cz","redtub.live","redvido.com","redwap2.com","redwap3.com","reifporn.de","repelis.net","repelisgt.*","repelishd.*","repelisxd.*","repicsx.com","resetoff.pl","rethmic.com","retrotv.org","reuters.com","reverso.net","riedberg.tv","rimondo.com","rl6mans.com","rlshort.com","roadbike.de","rocklink.in","romfast.com","romsite.org","romviet.com","rphangx.net","rpmplay.xyz","rpupdate.cc","rsgamer.app","rubystm.com","rubyvid.com","rugby365.fr","runmods.com","ryxy.online","s0ft4pc.com","saekita.com","safelist.eu","sandrives.*","sankaku.app","sansat.link","sararun.net","sat1gold.de","satcesc.com","savelinks.*","savemedia.*","savetub.com","sbbrisk.com","sbchill.com","scenedl.org","scenexe2.io","schadeck.eu","scripai.com","sdefx.cloud","seclore.com","secuhex.com","see-xxx.com","semawur.com","sembunyi.in","sendvid.com","seoworld.in","serengo.net","serially.it","seriemega.*","seriesflv.*","seselah.com","sexavgo.com","sexdiaryz.*","sexemix.com","sexetag.com","sexmoza.com","sexpuss.org","sexrura.com","sexsaoy.com","sexuhot.com","sexygirl.cc","shaheed4u.*","sharedisk.*","sharing.wtf","shavetape.*","shinbhu.net","shinchu.net","shortearn.*","shrinkus.tk","shrlink.top","simsdom.com","siteapk.net","sitepdf.com","sixsave.com","smplace.com","snaptik.app","socks24.org","soft112.com","softrop.com","solobari.it","soninow.com","sosuroda.pl","soundpark.*","souqsky.net","southpark.*","spambox.xyz","spankbang.*","speedporn.*","spinbot.com","sporcle.com","sport365.fr","sportbet.gr","sportcast.*","sportlive.*","sportshub.*","spycock.com","srcimdb.com","ssoap2day.*","ssrmovies.*","staaker.com","stagatv.com","starmusiq.*","steamplay.*","steanplay.*","sterham.net","stickers.gg","stmruby.com","strcloud.in","streamcdn.*","streamed.su","streamers.*","streamhoe.*","streamhub.*","streamio.to","streamm4u.*","streamup.ws","strikeout.*","subdivx.com","subedlc.com","submilf.com","subsvip.com","sukuyou.com","sundberg.ws","sushiscan.*","swatalk.com","t-online.de","tabootube.*","tagblatt.ch","takimag.com","tamilyogi.*","tandess.com","taodung.com","tattle.life","tcheats.com","tdtnews.com","teachoo.com","teamkong.tk","techforu.in","technews.tw","tecnomd.com","telenord.it","telorku.xyz","teltarif.de","tempr.email","terabox.fun","teralink.me","testedich.*","texw.online","thapcam.net","thaript.com","thelanb.com","theroot.com","thestar.com","thisvid.com","thotcity.su","thotporn.tv","thotsbay.tv","threads.com","threads.net","tidymom.net","tikmate.app","tinys.click","titantv.com","tnaflix.com","todaypktv.*","tonspion.de","toolxox.com","toonanime.*","toonily.com","topembed.pw","topgear.com","topmovies.*","topshare.in","topsport.bg","totally.top","toxicwap.us","trahino.net","tranny6.com","trgtkls.org","tribuna.com","trickms.com","trilog3.net","tromcap.com","trxking.xyz","tryvaga.com","ttsfree.com","tubator.com","tube18.sexy","tuberel.com","tubsxxx.com","turkanime.*","turkmmo.com","tutflix.org","tutvlive.ru","tv-media.at","tv.bdix.app","tvableon.me","tvseries.in","tw-calc.net","twitchy.com","twitter.com","ubbulls.com","ucanwatch.*","ufcstream.*","uhdmovies.*","uiiumovie.*","uknip.co.uk","umterps.com","unblockit.*","unixmen.com","uozzart.com","updown.link","upfiles.app","uploadbaz.*","uploadhub.*","uploadrar.*","uproxy2.biz","uprwssp.org","upstore.net","upstream.to","uptime4.com","uptobox.com","urdubolo.pk","usfdons.com","usgamer.net","ustvgo.live","uyeshare.cc","v2movies.me","v6embed.xyz","variety.com","vaughn.live","vectorx.top","vedshar.com","vegamovie.*","ver-pelis.*","verizon.com","vexfile.com","vexmovies.*","vf-film.net","vgamerz.com","vidbeem.com","vidcloud9.*","videezy.com","vidello.net","videovard.*","videoxxx.cc","videplay.us","videq.cloud","vidfast.pro","vidlink.pro","vidload.net","vidshar.org","vidshare.tv","vidspeed.cc","vidstream.*","vidtube.one","vikatan.com","vip-box.app","vipifsa.com","vipleague.*","vipracing.*","vipstand.se","viptube.com","virabux.com","visalist.io","visible.com","viva100.com","vixcloud.co","vizcloud2.*","vkprime.com","voirfilms.*","voyeurhit.*","vrcmods.com","vstdrive.in","vulture.com","vvtplayer.*","vw-page.com","w.grapps.me","waploaded.*","watchfree.*","watchmdh.to","watchporn.*","wavewalt.me","wayfair.com","wcostream.*","weadown.com","weather.com","webcras.com","webfail.com","webmaal.cfd","webtoon.xyz","weights.com","wetsins.com","weviral.org","wgzimmer.ch","why-tech.it","wildwap.com","winshell.de","wintotal.de","wmovies.xyz","woffxxx.com","wonporn.com","wowroms.com","wupfile.com","wvt.free.nf","www.msn.com","x-x-x.video","x.ag2m2.cfd","xemales.com","xflixbd.com","xforum.live","xfreehd.com","xgroovy.com","xhamster.fm","xhamster1.*","xhamster2.*","xhamster3.*","xhamster4.*","xhamster5.*","xhamster7.*","xhamster8.*","xhmoon5.com","xhreal2.com","xhreal3.com","xhtotal.com","xhwide1.com","xhwide2.com","xhwide5.com","xmateur.com","xmovies08.*","xnxxcom.xyz","xozilla.xxx","xpicu.store","xpornzo.com","xpshort.com","xsanime.com","xubster.com","xvideos.com","xx.knit.bid","xxxmomz.com","xxxmovies.*","xztgl.com>>","y-2mate.com","y2meta.mobi","yalifin.xyz","yamsoti.com","yesmovies.*","yestech.xyz","yifysub.net","ymovies.vip","yomovies1.*","yoshare.net","youshort.me","youtube.com","yoxplay.xyz","yt1s.com.co","yt2conv.com","ytmp3cc.net","ytsubme.com","yumeost.net","z9sayu0m.nl","zedporn.com","zemporn.com","zerioncc.pl","zerogpt.com","zetporn.com","ziperto.com","zlpaste.net","zoechip.com","zyromod.com","0123movies.*","0cbcq8mu.com","0l23movies.*","0ochi8hp.com","10-train.com","1024tera.com","103.74.5.104","123-movies.*","1234movies.*","123animes.ru","123moviesc.*","123moviess.*","123unblock.*","1340kbbr.com","16honeys.com","185.53.88.15","18tubehd.com","1fichier.com","1madrasdub.*","1nmnozg1.fun","1primewire.*","2017tube.com","2btmc2r0.fun","2cf0xzdu.com","2fb9tsgn.fun","2madrasdub.*","3a38xmiv.fun","3gaytube.com","45.86.86.235","456movie.com","4archive.org","4bct9.live>>","4edtcixl.xyz","4fansites.de","4k2h4w04.xyz","4live.online","4movierulz.*","56m605zk.fun","5moviess.com","720pstream.*","723qrh1p.fun","7hitmovies.*","8mhlloqo.fun","8rm3l0i9.fun","8teenxxx.com","a6iqb4m8.xyz","ablefast.com","aboedman.com","absoluporn.*","abysscdn.com","acapellas.eu","adbypass.org","adcrypto.net","addonbiz.com","adsurfle.com","adultfun.net","advocate.com","aegeanews.gr","afl3ua5u.xyz","afreesms.com","airliners.de","akinator.com","akirabox.com","alcasthq.com","alexsports.*","aliancapes.*","allcalidad.*","alliptvs.com","allmusic.com","allosurf.net","alotporn.com","alphatron.tv","alrincon.com","alternet.org","amateur8.com","amnaymag.com","amtil.com.au","amyscans.com","androidaba.*","anhdep24.com","anime-jl.net","anime3rb.com","animefire.io","animeflv.net","animefreak.*","animesanka.*","animeunity.*","animexin.vip","animixplay.*","aninavi.blog","anisubindo.*","anmup.com.np","annabelle.ch","antiadtape.*","antonimos.de","anybunny.com","apetube.asia","apkcombo.com","apkdrill.com","apkmodhub.in","apkprime.org","apkship.shop","apkupload.in","apnablogs.in","app.vaia.com","appsbull.com","appsmodz.com","aranzulla.it","arcaxbydz.id","arkadium.com","arolinks.com","aroratr.club","artforum.com","asiaflix.net","asianporn.li","askim-bg.com","atglinks.com","atgstudy.com","atozmath.com","audiotools.*","audizine.com","autodime.com","autoembed.cc","autonews.com","autorevue.at","avjamack.com","az-online.de","azoranov.com","azores.co.il","b-hentai.com","babesexy.com","babiato.tech","babygaga.com","bacakomik.co","bagpipe.news","baithak.news","bamgosu.site","bandstand.ph","banned.video","baramjak.com","barchart.com","baritoday.it","batchkun.com","batporno.com","bbyhaber.com","bceagles.com","bclikeqt.com","beemtube.com","beingtek.com","benchmark.pl","bestlist.top","bestwish.lol","biletomat.pl","bilibili.com","biopills.net","birdurls.com","bitchute.com","bitssurf.com","bittools.net","bk9nmsxs.com","blog-dnz.com","blogmado.com","blogmura.com","bloground.ro","blwideas.com","bobolike.com","bollydrive.*","bollyshare.*","boltbeat.com","bookfrom.net","bookriot.com","bookszone.in","boredbat.com","boundhub.com","boysfood.com","br0wsers.com","braflix.tube","bright-b.com","bsmaurya.com","btvsports.my","bubraves.com","buffsports.*","buffstream.*","bugswave.com","bullfrag.com","burakgoc.com","burbuja.info","burnbutt.com","buyjiocoin.*","byswiizen.fr","calbears.com","callfuck.com","camhub.world","camlovers.tv","camporn.tube","camwhores.tv","camwhorez.tv","capoplay.net","cardiagn.com","cariskuy.com","carnewz.site","cashbux.work","casperhd.com","casthill.net","catcrave.com","catholic.com","cbt-tube.net","cctvwiki.com","celebmix.com","celibook.com","cesoirtv.com","channel4.com","chatango.com","chibchat.com","chopchat.com","choralia.net","chzzkban.xyz","cinedetodo.*","cinemabg.net","cinemaxxl.de","claimbits.io","claimtrx.com","clickapi.net","clicporn.com","clip-sex.biz","clix4btc.com","clockskin.us","closermag.fr","cloudrls.com","cocogals.com","cocoporn.net","coderblog.in","codesnse.com","coindice.win","coingraph.us","coinsrev.com","collider.com","compsmag.com","compu-pc.com","cookierun.gg","cool-etv.net","cosmicapp.co","couchtuner.*","coursera.org","cracking.org","crazyblog.in","crewbase.net","cricwatch.io","cryptosh.pro","cryptowin.io","cuevana8.com","cut-urls.com","cuts-url.com","cutyurls.com","cwc.utah.gov","cyberdrop.me","cyberleaks.*","cyclones.com","cyprus.co.il","czechsex.net","da-imnetz.de","daddylive1.*","dafideff.com","dafontvn.com","daftporn.com","dailydot.com","dailysport.*","daizurin.com","darkibox.com","datacheap.io","datanodes.to","dataporn.pro","datawav.club","dawntube.com","day4news.com","ddlvalley.me","deadline.com","deadspin.com","debridup.com","deckshop.pro","decorisi.com","deepbrid.com","deephot.link","delvein.tech","derwesten.de","descarga.xyz","desi.upn.bio","desihoes.com","desiupload.*","desivideos.*","deviants.com","digimanie.cz","dikgames.com","dir-tech.com","dirproxy.com","dirtyfox.net","dirtyporn.cc","distanta.net","divicast.com","divxtotal1.*","djpunjab2.in","dl-protect.*","dlolcast.pro","dlupload.com","dndsearch.in","dokumen.tips","domahatv.com","dotabuff.com","doujindesu.*","downloadr.in","drakecomic.*","dreamdth.com","drivefire.co","drivemoe.com","drivers.plus","dropbang.net","dropgalaxy.*","drsnysvet.cz","drublood.com","ds2video.com","dukeofed.org","dumovies.com","duolingo.com","dutchycorp.*","dvd-flix.com","dwlinks.buzz","dz-linkk.com","eastream.net","ecamrips.com","eclypsia.com","edukaroo.com","egram.com.ng","egyanime.com","ehotpics.com","elcultura.pl","electsex.com","eljgocmn.fun","elvocero.com","embed4me.com","emporda.info","endbasic.dev","eng-news.com","engvideo.net","epson.com.cn","eroclips.org","erofound.com","erogarga.com","eropaste.net","eroticmv.com","esopress.com","esportivos.*","estrenosgo.*","estudyme.com","et-invest.de","etonline.com","eurogamer.de","eurogamer.es","eurogamer.it","eurogamer.pt","evernia.site","evfancy.link","ex-foary.com","examword.com","exceljet.net","exe-urls.com","eximeuet.fun","expertvn.com","eymockup.com","ezeviral.com","f1livegp.net","factable.com","fairyhorn.cc","fansided.com","fansmega.com","fapality.com","fapfappy.com","fartechy.com","fastilinks.*","fat-bike.com","fbsquadx.com","fc2stream.tv","fedscoop.com","feed2all.org","fehmarn24.de","femdomtb.com","ferdroid.net","fileguard.cc","fileguru.net","filemoon.*>>","filerice.com","filescdn.com","filessrc.com","filezipa.com","filmisongs.*","filmizletv.*","filmy4wap1.*","filmygod13.*","filmyone.com","filmyzilla.*","financid.com","finevids.xxx","firstonetv.*","fitforfun.de","fivemdev.org","flashbang.sh","flaticon.com","flexy.stream","flexyhit.com","flightsim.to","flixbaba.com","flowsnet.com","flstv.online","flvto.com.co","fm-arena.com","fmoonembed.*","fmoviesto.cc","focus4ca.com","footybite.to","forexrw7.com","forogore.com","forplayx.ink","fotopixel.es","freejav.guru","freemovies.*","freemp3.tube","freeshib.biz","freetron.top","freewsad.com","fremdwort.de","freshbbw.com","fruitlab.com","fuckmilf.net","fullboys.com","fullcinema.*","fullhd4k.com","fuskator.com","futemais.net","g8rnyq84.fun","galaxyos.net","game-owl.com","gamebrew.org","gamefast.org","gamekult.com","gamer.com.tw","gamerant.com","gamerxyt.com","games.get.tv","games.wkb.jp","gameslay.net","gameszap.com","gametter.com","gamezizo.com","gamingsym.in","gatagata.net","gay4porn.com","gaystream.pw","gayteam.club","gcaptain.com","gculopes.com","gelbooru.com","gentside.com","getcopy.link","getitfree.cn","getmodsapk.*","gifcandy.net","gioialive.it","gksansar.com","glo-n.online","globes.co.il","globfone.com","gniewkowo.eu","gnusocial.jp","go2share.net","goanimes.vip","gobadgers.ca","gocast123.me","godzcast.com","gogoanimes.*","gogriffs.com","golancers.ca","gomuraw.blog","gonzoporn.cc","goracers.com","gosexpod.com","gottanut.com","goxavier.com","gplastra.com","grazymag.com","grigtube.com","grosnews.com","gseagles.com","gsmhamza.com","guidetnt.com","gurusiana.id","h-game18.xyz","h8jizwea.fun","habuteru.com","hachiraw.net","hackshort.me","hackstore.me","halloporno.*","harbigol.com","hbnews24.com","hbrfrance.fr","hdfcfund.com","hdhub4u.fail","hdmoviehub.*","hdmovies23.*","hdmovies4u.*","hdmovies50.*","hdpopcorns.*","hdporn92.com","hdpornos.net","hdvideo9.com","hellmoms.com","helpdice.com","hentai2w.com","hentai3z.com","hentai4k.com","hentaigo.com","hentaihd.xyz","hentaila.com","hentaimoe.me","hentais.tube","hentaitk.net","hentaizm.fun","hi0ti780.fun","highporn.net","hiperdex.com","hipsonyc.com","hivetoon.com","hmanga.world","hostmath.com","hotmilfs.pro","hqporner.com","hubdrive.com","huffpost.com","hurawatch.cc","huzi6or1.fun","hwzone.co.il","hyderone.com","hydrogen.lat","hypnohub.net","ibradome.com","icutlink.com","icyporno.com","idesign.wiki","idevfast.com","idntheme.com","iguarras.com","ihdstreams.*","ilovephd.com","ilpescara.it","imagefap.com","imdpu9eq.com","imgadult.com","imgbaron.com","imgblaze.net","imgbnwe.shop","imgbyrev.sbs","imgclick.net","imgdrive.net","imgflare.com","imgfrost.net","imggune.shop","imgjajhe.sbs","imgmffmv.sbs","imgnbii.shop","imgolemn.sbs","imgprime.com","imgqbbds.sbs","imgspark.com","imgthbm.shop","imgtorrnt.in","imgxabm.shop","imgxxbdf.sbs","imintweb.com","indianxxx.us","infodani.net","infofuge.com","informer.com","interssh.com","intro-hd.net","ipacrack.com","ipatriot.com","iptvapps.net","iptvspor.com","iputitas.net","iqksisgw.xyz","isaidub6.net","itainews.com","itz-fast.com","iwanttfc.com","izzylaif.com","jaktsidan.se","jalopnik.com","japanporn.tv","japteenx.com","jav-asia.top","javboys.tv>>","javbraze.com","javguard.xyz","javhahaha.us","javhdz.today","javindo.site","javjavhd.com","javmelon.com","javplaya.com","javplayer.me","javprime.net","javquick.com","javrave.club","javtiful.com","javturbo.xyz","jenpornuj.cz","jeshoots.com","jmzkzesy.xyz","jobfound.org","jockantv.com","joymaxtr.net","joziporn.com","jsfiddle.net","juba-get.com","jujmanga.com","kabeleins.de","kafeteria.pl","kakitengah.*","kamehaus.net","kaoskrew.org","karanapk.com","katmoviehd.*","kattracker.*","kaystls.site","khaddavi.net","khatrimaza.*","khsn1230.com","kickasskat.*","kinisuru.com","kinkyporn.cc","kino-zeit.de","kiss-anime.*","kisstvshow.*","klubsports.*","knowstuff.in","kolcars.shop","kollhong.com","konten.co.id","koramaup.com","kpopjams.com","kr18plus.com","kreisbote.de","kstreaming.*","kubo-san.com","kumapoi.info","kungfutv.net","kunmanga.com","kurazone.net","kusonime.com","ladepeche.fr","landwirt.com","lanjutkeun.*","latino69.fun","ldkmanga.com","leaktube.net","learnmany.in","lectormh.com","lecturel.com","leechall.com","leprogres.fr","lesbenhd.com","lesbian8.com","lewdzone.com","liddread.com","lifestyle.bg","lifewire.com","likemanga.io","likuoo.video","linfoweb.com","linkjust.com","linksaya.com","linkshorts.*","linkvoom.com","lionsfan.net","livegore.com","livemint.com","livesport.ws","ln-online.de","lokerwfh.net","longporn.xyz","lookmovie.pn","lookmovie2.*","lootdest.com","lostsword.gg","lover937.net","lrepacks.net","lucidcam.com","lulustream.*","luluvdoo.com","luscious.net","lusthero.com","luxuretv.com","m-hentai.net","mac2sell.net","macsite.info","mamahawa.com","manga18.club","mangadna.com","mangafire.to","mangagun.net","mangakio.com","mangakita.id","mangalek.com","mangamanga.*","manganelo.tv","mangaraw.org","mangarawjp.*","mangasco.com","mangoporn.co","mangovideo.*","manhuaga.com","manhuascan.*","manhwa68.com","manhwass.com","manhwaus.net","manpeace.org","manyakan.com","manytoon.com","maqal360.com","marmiton.org","masengwa.com","mashtips.com","masslive.com","mat6tube.com","mathaeser.de","maturell.com","mavanimes.co","maxgaming.fi","mazakony.com","mc-hacks.net","mcfucker.com","mcrypto.club","mdbekjwqa.pw","mdtaiwan.com","mealcold.com","medscape.com","medytour.com","meetimgz.com","mega-mkv.com","mega-p2p.net","megafire.net","megatube.xxx","megaupto.com","meilblog.com","metabomb.net","meteolive.it","miaandme.org","micmicidol.*","microify.com","midis.com.ar","mikohub.blog","milftoon.xxx","miraculous.*","mirror.co.uk","missavtv.com","missyusa.com","mitsmits.com","mixloads.com","mjukb26l.fun","mkm7c3sm.com","mkvcinemas.*","mlbstream.tv","mmsbee47.com","mobitool.net","modcombo.com","moddroid.com","modhoster.de","modsbase.com","modsfire.com","modyster.com","mom4real.com","momo-net.com","momsdish.com","momspost.com","momxxx.video","monaco.co.il","mooonten.com","moretvtime.*","moshahda.net","motofakty.pl","movie4u.live","moviedokan.*","movieffm.net","moviefreak.*","moviekids.tv","movielair.cc","movierulzs.*","movierulzz.*","movies123.pk","movies18.net","movies4us.co","moviesapi.to","moviesbaba.*","moviesflix.*","moviesland.*","moviespapa.*","moviesrulz.*","moviesshub.*","moviesxxx.cc","movieweb.com","movstube.net","mp3fiber.com","mp3juices.su","mp4-porn.net","mpg.football","mrscript.net","mtcremix.com","multporn.net","musictip.net","mutigers.com","myesports.gg","myflixerz.to","myfxbook.com","mylinkat.com","naijafav.top","naniplay.com","nanolinks.in","napiszar.com","nar.k-ba.net","natgeotv.com","nbastream.tv","nemumemo.com","nephobox.com","netmovies.to","netoff.co.jp","netuplayer.*","newatlas.com","news.now.com","newsextv.com","newsmondo.it","newtumbl.com","nextdoor.com","nextorrent.*","neymartv.net","nflscoop.xyz","nflstream.tv","nicetube.one","nicknight.de","nifteam.info","nilesoft.org","niu-pack.com","niyaniya.moe","nkunorse.com","nonktube.com","novelasesp.*","novelbob.com","novelpub.com","novelread.co","novoglam.com","novoporn.com","nowmaxtv.com","nowsports.me","nowsportv.nl","nowtv.com.tr","nptsr.live>>","nsfwgify.com","nsfwzone.xyz","nudecams.xxx","nudedxxx.com","nudistic.com","nudogram.com","nudostar.com","nueagles.com","nugglove.com","nusports.com","nwzonline.de","nyaa.iss.ink","nzbstars.com","oaaxpgp3.xyz","octanime.net","of-model.com","oimsmosy.fun","okulsoru.com","olutposti.fi","olympics.com","oncehelp.com","oneupload.to","onlinexxx.cc","onlytech.com","onscreens.me","onyxfeed.com","op-online.de","openload.mov","opomanga.com","optifine.net","orangeink.pk","oricon.co.jp","osuskins.net","otakukan.com","otakuraw.net","ottverse.com","ottxmaza.com","ovagames.com","ovnihoje.com","oyungibi.com","pagalworld.*","pak-mcqs.net","paktech2.com","pandadoc.com","pandamovie.*","papunika.com","parenting.pl","parzibyte.me","paste.bin.sx","pastepvp.org","pastetot.com","pay4fans.com","pc-hobby.com","pdfindir.net","peekvids.com","pelisflix2.*","pelishouse.*","pelispedia.*","pelisplus2.*","pennlive.com","pentruea.com","phimmoiaz.cc","photooxy.com","photopea.com","picbaron.com","picjbet.shop","picnwqez.sbs","picsfuck.org","picyield.com","pietsmiet.de","pig-fuck.com","pilibook.com","pinayflix.me","piratebayz.*","pisatoday.it","pittband.com","pixbnab.shop","pixdfdj.shop","piximfix.com","pixkfkf.shop","pixnbrqw.sbs","pixrqqz.shop","pkw-forum.de","platinmods.*","play.max.com","play.nova.bg","play1002.com","player4u.xyz","playerfs.com","playertv.net","playfront.de","playstore.pw","playvids.com","plaza.chu.jp","plc4free.com","plusupload.*","pmvhaven.com","poki-gdn.com","politico.com","polygamia.pl","pomofocus.io","ponsel4g.com","pornabcd.com","pornachi.com","porncomics.*","pornditt.com","pornfeel.com","pornfeet.xyz","pornflip.com","porngames.tv","porngrey.com","pornhat.asia","pornhdin.com","pornhits.com","pornhost.com","pornicom.com","pornleaks.in","pornlift.com","pornlore.com","pornluck.com","pornmoms.org","porno-tour.*","pornoaid.com","pornoente.tv","pornohd.blue","pornotom.com","pornozot.com","pornpapa.com","porntape.net","porntrex.com","pornvibe.org","pornwatch.ws","pornyeah.com","pornyfap.com","pornzone.com","poscitechs.*","postazap.com","postimees.ee","powcloud.org","prensa.click","pressian.com","pricemint.in","produsat.com","programme.tv","promipool.de","proplanta.de","prothots.com","ps2-bios.com","pugliain.net","pupupul.site","pussyspace.*","putlocker9.*","putlockerc.*","putlockers.*","pysznosci.pl","q1-tdsge.com","qashbits.com","qpython.club","quizrent.com","qvzidojm.com","r3owners.net","raidrush.net","rail-log.net","rajtamil.org","ranjeet.best","rapelust.com","rapidzona.tv","raulmalea.ro","rawmanga.top","rawstory.com","razzball.com","rbs.ta36.com","recipahi.com","recipenp.com","recording.de","reddflix.com","redecanais.*","redretti.com","remilf.xyz>>","reminimod.co","repelisgoo.*","repretel.com","reqlinks.net","resplace.com","retire49.com","richhioon.eu","riftbound.gg","riotbits.com","ritzysex.com","rockmods.net","rolltide.com","romatoday.it","roms-hub.com","ronaldo7.pro","root-top.com","rosasidan.ws","rosefile.net","rot-blau.com","royalkom.com","rp-online.de","rtilinks.com","rubias19.com","rue89lyon.fr","ruidrive.com","rushporn.xxx","s2watch.link","salidzini.lv","samfirms.com","samovies.net","satkurier.pl","savefrom.net","savegame.pro","savesubs.com","savevideo.me","scamalot.com","scjhg5oh.fun","seahawks.com","seeklogo.com","seireshd.com","seksrura.net","senimovie.co","senmanga.com","senzuri.tube","servustv.com","sethphat.com","seuseriado.*","sex-pic.info","sexgames.xxx","sexgay18.com","sexroute.net","sexy-games.*","sexyhive.com","sfajacks.com","sgxnifty.org","shanurdu.com","sharedrive.*","sharetext.me","shemale6.com","shemedia.com","sheshaft.com","shorteet.com","sieradmu.com","silkengirl.*","sinonimos.de","siteflix.org","sitekeys.net","skinnyhq.com","skinnyms.com","slawoslaw.pl","slreamplay.*","slutdump.com","slutmesh.net","smailpro.com","smallpdf.com","smcgaels.com","smgplaza.com","snlookup.com","snowbreak.gg","sobatkeren.*","sodomojo.com","solarmovie.*","sonixgvn.net","sortporn.com","sound-park.*","southfreak.*","sp-today.com","sp500-up.com","spatsify.com","speedrun.com","spielfilm.de","spinoff.link","sport-97.com","sportico.com","sporting77.*","sportlemon.*","sportlife.es","sportnews.to","sportshub.to","sportskart.*","stardeos.com","stardima.com","stayglam.com","stbturbo.xyz","stevivor.com","stimotion.pl","stre4mplay.*","stream18.net","streamango.*","streambee.to","streameast.*","streampiay.*","streamtape.*","streamwish.*","strikeout.im","subtaboo.com","sunbtc.space","sunporno.com","superapk.org","superpsx.com","supervideo.*","surf-trx.com","surfline.com","surrit.store","sushi-scan.*","sussytoons.*","suzihaza.com","suzylu.co.uk","svipvids.com","swiftload.io","synonyms.com","syracuse.com","system32.ink","tabering.net","tabooporn.tv","tacobell.com","tagecoin.com","tajpoint.com","tamilprint.*","tamilyogis.*","tampabay.com","tanfacil.net","tapchipi.com","tapepops.com","tatabrada.tv","tatangga.com","team-rcv.xyz","tech24us.com","tech4auto.in","techably.com","techmuzz.com","technorj.com","techstage.de","techstwo.com","techtobo.com","techyinfo.in","techzed.info","teczpert.com","teencamx.com","teenhost.net","teensark.com","teensporn.tv","teknorizen.*","telecinco.es","telegraaf.nl","teleriumtv.*","teluguflix.*","teraearn.com","terashare.co","terashare.me","tesbox.my.id","tespedia.com","testious.com","th-world.com","theblank.net","theconomy.me","thedaddy.*>>","thefmovies.*","thegamer.com","thehindu.com","thekickass.*","thelinkbox.*","themezon.net","theonion.com","theproxy.app","thesleak.com","thesukan.net","thevalley.fm","theverge.com","thotvids.com","threezly.com","thuglink.com","thurrott.com","tigernet.com","tik-tok.porn","timestamp.fr","tioanime.com","tipranks.com","tnaflix.asia","tnhitsda.net","tntdrama.com","tokenmix.pro","top10cafe.se","topeuropix.*","topfaucet.us","topkickass.*","topspeed.com","topstreams.*","torture1.net","trahodom.com","trendyol.com","tresdaos.com","truthnews.de","tryboobs.com","ts-mpegs.com","tsmovies.com","tubedupe.com","tubewolf.com","tubxporn.com","tucinehd.com","turbobit.net","turkanime.co","turkdown.com","turkrock.com","tusfiles.com","tv247us.live","tv3monde.com","tvappapk.com","tvdigital.de","tvpclive.com","tvtropes.org","tweakers.net","twister.porn","tz7z9z0h.com","u-s-news.com","u26bekrb.fun","u9206kzt.fun","udoyoshi.com","ugreen.autos","ukchat.co.uk","ukdevilz.com","ukigmoch.com","ultraten.net","umagame.info","umamusume.gg","unefemme.net","unitystr.com","up-4ever.net","uploadbox.io","uploadmx.com","uploads.mobi","upshrink.com","uptomega.net","ur-files.com","ur70sq6j.fun","usatoday.com","usaxtube.com","userupload.*","usp-forum.de","utahutes.com","utaitebu.com","utakmice.net","uthr5j7t.com","utsports.com","uur-tech.net","uwatchfree.*","valuexh.life","vdiflcsl.fun","veganinja.hu","vegas411.com","vi-music.app","vibehubs.com","videofilms.*","videojav.com","videos-xxx.*","videovak.com","vidsaver.net","vidsrc.click","viidshar.com","vikiporn.com","violablu.net","vipporns.com","viralxns.com","visorsmr.com","vocalley.com","voeunblk.com","voirseries.*","volokit2.com","vqjhqcfk.fun","warddogs.com","watchmovie.*","watchmygf.me","watchnow.fun","watchop.live","watchporn.cc","watchporn.to","watchtvchh.*","way2movies.*","web2.0calc.*","webcams.casa","webnovel.com","webxmaza.com","westword.com","whatgame.xyz","whyvpn.my.id","wikifeet.com","wikirise.com","winboard.org","winfuture.de","winlator.com","wishfast.top","withukor.com","wohngeld.org","wolfstream.*","worldaide.fr","worldmak.com","worldsex.com","writedroid.*","wspinanie.pl","www.google.*","x-video.tube","xculitos.com","xemphim1.top","xfantazy.com","xfantazy.org","xhaccess.com","xhadult2.com","xhadult3.com","xhadult4.com","xhadult5.com","xhamster10.*","xhamster11.*","xhamster12.*","xhamster13.*","xhamster14.*","xhamster15.*","xhamster16.*","xhamster17.*","xhamster18.*","xhamster19.*","xhamster20.*","xhamster42.*","xhdate.world","xpornium.net","xsexpics.com","xteensex.net","xvideos.name","xvideos2.com","xxporner.com","xxxfiles.com","xxxhdvideo.*","xxxonline.cc","xxxputas.net","xxxshake.com","xxxstream.me","y5vx1atg.fun","yabiladi.com","yaoiscan.com","yggtorrent.*","yhocdata.com","ynk-blog.com","yogranny.com","you-porn.com","yourlust.com","yts-subs.com","yts-subs.net","ytube2dl.com","yuatools.com","yurineko.net","yurudori.com","z1ekv717.fun","zealtyro.com","zehnporn.com","zenradio.com","zhlednito.cz","zilla-xr.xyz","zimabdko.com","zone.msn.com","zootube1.com","zplayer.live","zvision.link","01234movies.*","01fmovies.com","10convert.com","10play.com.au","10starhub.com","111.90.150.10","111.90.151.26","111movies.com","123gostream.*","123movies.net","123moviesgo.*","123movieshd.*","123moviesla.*","123moviesme.*","123movieweb.*","123multihub.*","185.53.88.104","185.53.88.204","190.115.18.20","1bitspace.com","1qwebplay.xyz","1xxx-tube.com","247sports.com","2girls1cup.ca","30kaiteki.com","360news4u.net","38.242.194.12","3dhentai.club","4download.net","4drumkits.com","4filmyzilla.*","4horlover.com","4meplayer.com","4movierulz1.*","560pmovie.com","5movierulz2.*","6hiidude.gold","7fractals.icu","7misr4day.com","7movierulz1.*","7moviesrulz.*","94.103.83.138","9filmyzilla.*","9ketsuki.info","9xmoovies.com","abczdrowie.pl","abendblatt.de","abseits-ka.de","acusports.com","acutetube.net","adblocktape.*","addapinch.com","advantien.com","advertape.net","aiimgvlog.fun","ainonline.com","aitohuman.org","ajt.xooit.org","akcartoons.in","albania.co.il","alexbacher.fr","alimaniac.com","allfaucet.xyz","allitebooks.*","allmomsex.com","alltstube.com","allusione.org","alohatube.xyz","alueviesti.fi","ambonkita.com","angelfire.com","angelgals.com","anihdplay.com","animecast.net","animefever.cc","animeflix.ltd","animefreak.to","animeheaven.*","animenexus.in","animesite.net","animesup.info","animetoast.cc","animeworld.ac","animeworld.tv","animeyabu.net","animeyabu.org","animeyubi.com","anitube22.vip","aniwatchtv.to","anonyviet.com","anusling.info","aogen-net.com","aparttent.com","appteka.store","arahdrive.com","archive.today","archivebate.*","archpaper.com","areabokep.com","areamobile.de","areascans.net","areatopik.com","arenascan.com","arenavision.*","aresmanga.com","arhplyrics.in","ariestube.com","ark-unity.com","arldeemix.com","artesacro.org","arti-flora.nl","articletz.com","artribune.com","asianboy.fans","asianhdplay.*","asianlbfm.net","asiansex.life","asiaontop.com","askattest.com","askpython.com","asssex-hd.com","astroages.com","astronews.com","at.wetter.com","audiotag.info","audiotrip.org","austiblox.net","auto-data.net","auto-swiat.pl","autobytel.com","autoextrem.de","autofrage.net","autoscout24.*","autosport.com","autotrader.nl","avpgalaxy.net","azcentral.com","aztravels.net","b-bmovies.com","babakfilm.com","babepedia.com","babestube.com","babytorrent.*","baddiehub.com","bakedbree.com","bdsm-fuck.com","beasttips.com","beegsexxx.com","besargaji.com","bestgames.com","beverfood.com","biftutech.com","bikeradar.com","bikerszene.de","bilasport.net","bilinovel.com","billboard.com","bimshares.com","bingsport.xyz","bitcosite.com","bitfaucet.net","bitlikutu.com","bitview.cloud","bizdustry.com","blasensex.com","blog.40ch.net","blogesque.net","blograffo.net","blurayufr.cam","bobs-tube.com","bokugents.com","bolly2tolly.*","bollymovies.*","boobgirlz.com","bootyexpo.net","boxylucha.com","boystube.link","bravedown.com","bravoporn.com","brawlhalla.fr","breitbart.com","breznikar.com","brighteon.com","brocoflix.com","brocoflix.xyz","bshifast.live","buffsports.io","buffstreams.*","bustyfats.com","buxfaucet.com","buydekhke.com","bymichiby.com","call4cloud.nl","camarchive.tv","camdigest.com","camgoddess.tv","camvideos.org","camwhorestv.*","camwhoria.com","canalobra.com","canlikolik.my","capo4play.com","capo5play.com","capo6play.com","caravaning.de","cardshare.biz","carryflix.icu","carscoops.com","cat-a-cat.net","cat3movie.org","cbsnews.com>>","ccthesims.com","cdiscount.com","celeb.gate.cc","celemusic.com","ceramic.or.kr","ceylonssh.com","cg-method.com","cgcosplay.org","chapteria.com","chataigpt.org","cheatcloud.cc","cheater.ninja","cheatsquad.gg","chevalmag.com","chihouban.com","chikonori.com","chimicamo.org","chloeting.com","chumplady.com","cima100fm.com","cine24.online","cinecalidad.*","cinedokan.top","cinema.com.my","cinemabaz.com","cinemitas.org","civitai.green","claim.8bit.ca","claimbits.net","claudelog.com","claydscap.com","clickhole.com","cloudvideo.tv","cloudwish.xyz","cloutgist.com","cmsdetect.com","cmtracker.net","cnnamador.com","cockmeter.com","cocomanga.com","code2care.org","codeastro.com","codesnail.com","codewebit.top","coinbaby8.com","coinfaucet.io","coinlyhub.com","coinsbomb.com","colourxh.site","comedyshow.to","comexlive.org","comparili.net","computer76.ru","condorsoft.co","configspc.com","cooksinfo.com","coolcast2.com","coolporno.net","corrector.app","courseclub.me","crackcodes.in","crackevil.com","crackfree.org","crazyporn.xxx","crazyshit.com","crazytoys.xyz","cricket12.com","criollasx.com","criticker.com","crocotube.com","crotpedia.net","crypto4yu.com","cryptonor.xyz","cryptorank.io","cultofmac.com","cumlouder.com","cureclues.com","cxissuegk.com","cybermania.ws","daddylive.*>>","daddylivehd.*","dailynews.com","dailyrevs.com","dandanzan.top","dankmemer.lol","datavaults.co","dbusports.com","dcleakers.com","ddd-smart.net","decmelfot.xyz","deepfucks.com","deichstube.de","deluxtube.com","demae-can.com","denofgeek.com","depvailon.com","derusblog.com","descargasok.*","desijugar.net","desimmshd.com","dfilmizle.com","dickclark.com","dinnerexa.com","dipprofit.com","dirtyship.com","diskizone.com","dl-protect1.*","dlapk4all.com","dldokan.store","dlhe-videa.sk","doctoraux.com","dongknows.com","donkparty.com","doofree88.com","doomovie-hd.*","dooodster.com","doramasyt.com","dorawatch.net","douploads.net","douxporno.com","downfile.site","downloader.is","downloadhub.*","dr-farfar.com","dragonball.gg","dragontea.ink","dramafren.com","dramafren.org","dramaviki.com","drivelinks.me","drivenime.com","driveup.space","drop.download","dropnudes.com","dropshipin.id","dubaitime.net","durtypass.com","e-monsite.com","e2link.link>>","eatsmarter.de","ebonybird.com","ebook-hell.to","ebook3000.com","ebooksite.org","edealinfo.com","edukamer.info","elespanol.com","embdproxy.xyz","embed.scdn.to","embedgram.com","embedplayer.*","embedrise.com","embedwish.com","empleo.com.uy","emueagles.com","encurtads.net","encurtalink.*","enjoyfuck.com","ensenchat.com","entenpost.com","entireweb.com","ephoto360.com","epochtimes.de","eporner.video","eramuslim.com","erospots.info","eroticity.net","erreguete.gal","eurogamer.net","expansion.com","extratipp.com","fadedfeet.com","familyporn.tv","fanfiktion.de","fangraphs.com","fantasiku.com","fapomania.com","faresgame.com","farodevigo.es","farsinama.com","fastcars1.com","fclecteur.com","fembed9hd.com","fetish-tv.com","fetishtube.cc","file-upload.*","filegajah.com","filehorse.com","filemooon.top","filmeseries.*","filmibeat.com","filmlinks4u.*","filmy4wap.uno","filmyporno.tv","filmyworlds.*","findheman.com","firescans.xyz","firmwarex.net","firstpost.com","fivemturk.com","flexamens.com","flexxporn.com","flix-wave.lol","flixlatam.com","flyplayer.xyz","fmoviesfree.*","fontyukle.net","footeuses.com","footyload.com","forexforum.co","forlitoday.it","forum.dji.com","fossbytes.com","fosslinux.com","fotoblogia.pl","foxaholic.com","foxsports.com","foxtel.com.au","frauporno.com","free.7hd.club","freedom3d.art","freeflix.info","freegames.com","freeiphone.fr","freeomovie.to","freeporn8.com","freesex-1.com","freeshot.live","freexcafe.com","freexmovs.com","freshscat.com","freyalist.com","fromwatch.com","fsicomics.com","fsl-stream.lu","fsportshd.net","fsportshd.xyz","fuck-beeg.com","fuck-xnxx.com","fucksporn.com","fullassia.com","fullhdxxx.com","funandnews.de","fussball.news","futurezone.de","fzmovies.info","fztvseries.ng","gamearter.com","gamedrive.org","gamefront.com","gamelopte.com","gamereactor.*","games.bnd.com","games.qns.com","gamesite.info","gamesmain.xyz","gamevcore.com","gamezhero.com","gamovideo.com","garoetpos.com","gatasdatv.com","gayboyshd.com","gaysearch.com","geekering.com","generate.plus","gesundheit.de","getintopc.com","getpaste.link","getpczone.com","gfsvideos.com","ghscanner.com","gigmature.com","gipfelbuch.ch","girlnude.link","girlydrop.com","globalnews.ca","globalrph.com","globalssh.net","globlenews.in","go.linkify.ru","gobobcats.com","gogoanimetv.*","gogoplay1.com","gogoplay2.com","gohuskies.com","gol245.online","goldderby.com","gomaainfo.com","gomoviestv.to","goodriviu.com","govandals.com","grabpussy.com","grantorrent.*","graphicuv.com","graphicux.com","greatnass.com","greensmut.com","gry-online.pl","gsmturkey.net","guardaserie.*","gutefrage.net","gutekueche.at","gwusports.com","haaretz.co.il","hailstate.com","hairytwat.org","hancinema.net","haonguyen.top","haoweichi.com","harimanga.com","harzkurier.de","hdgayporn.net","hdmoviefair.*","hdmoviehubs.*","hdmovieplus.*","hdmovies2.org","hdpornzap.com","hdtubesex.net","heatworld.com","heimporno.com","hellabyte.one","hellenism.net","hellporno.com","hentaihaven.*","hentaikai.com","hentaimama.tv","hentaipaw.com","hentaiporn.me","hentairead.io","hentaiyes.com","herzporno.net","heutewelt.com","hexupload.net","hiddenleaf.to","hifi-forum.de","hihihaha1.xyz","hihihaha2.xyz","hilites.today","hindimovies.*","hindinest.com","hindishri.com","hindisite.net","hispasexy.org","hitsports.pro","hlsplayer.top","hobbykafe.com","holaporno.xxx","holymanga.net","hornbunny.com","hornyfanz.com","hosttbuzz.com","hotntubes.com","hotpress.info","howtogeek.com","hqmaxporn.com","hqpornero.com","hqsex-xxx.com","htmlgames.com","hulkshare.com","hurawatchz.to","hydraxcdn.biz","hypebeast.com","hyperdebrid.*","iammagnus.com","iceland.co.uk","ichberlin.com","icy-veins.com","ievaphone.com","iflixmovies.*","ifreefuck.com","igg-games.com","ignboards.com","iiyoutube.com","ikarianews.gr","ikz-online.de","ilpiacenza.it","imagehaha.com","imagenpic.com","imgbbnhi.shop","imgbncvnv.sbs","imgcredit.xyz","imghqqbg.shop","imgkkabm.shop","imgmyqbm.shop","imgwallet.com","imgwwqbm.shop","imleagues.com","indiafree.net","indianyug.com","indiewire.com","ineedskin.com","inextmovies.*","infidrive.net","inhabitat.com","instagram.com","instalker.org","interfans.org","investing.com","iogames.space","ipalibrary.me","iptvpulse.top","italpress.com","itdmusics.com","itmaniatv.com","itopmusic.com","itsguider.com","jadijuara.com","jagoanssh.com","jameeltips.us","japanxxx.asia","jav101.online","javenglish.cc","javguard.club","javhdporn.net","javleaked.com","javmobile.net","javporn18.com","javsaga.ninja","javstream.com","javstream.top","javsubbed.xyz","javsunday.com","jaysndees.com","jazzradio.com","jellynote.com","jennylist.xyz","jesseporn.xyz","jiocinema.com","jipinsoft.com","jizzberry.com","jk-market.com","jncojeans.com","jobzhub.store","joongdo.co.kr","jpscan-vf.com","jptorrent.org","juegos.as.com","jumboporn.xyz","junkyponk.com","jurukunci.net","justjared.com","justpaste.top","justwatch.com","juventusfc.hu","k12reader.com","kacengeng.com","kakiagune.com","kalileaks.com","kanaeblog.net","kangkimin.com","katdrive.link","katestube.com","katmoviefix.*","kckingdom.com","kenta2222.com","kfapfakes.com","kfrfansub.com","kicaunews.com","kickcharm.com","kissasian.*>>","klaustube.com","klikmanga.com","kllproject.lv","klykradio.com","kobieta.wp.pl","kolnovel.site","koreanbj.club","korsrt.eu.org","kotanopan.com","kpopjjang.com","ksusports.com","kumascans.com","kupiiline.com","kuronavi.blog","kurosuen.live","lamorgues.com","laptrinhx.com","latinabbw.xyz","latinlucha.es","laurasia.info","lavoixdux.com","law101.org.za","learn-cpp.org","learnclax.com","lecceprima.it","leccotoday.it","leermanga.net","leinetal24.de","letmejerk.com","letras.mus.br","lewdstars.com","liberation.fr","libreriamo.it","liiivideo.com","likemanga.ink","lilymanga.net","ling-online.*","link4rev.site","linkfinal.com","linkskibe.com","linkspaid.com","linovelib.com","linuxhint.com","lippycorn.com","listeamed.net","litecoin.host","litonmods.com","liveonsat.com","livestreams.*","liveuamap.com","lolcalhost.ru","lolhentai.net","longfiles.com","lookmovie2.to","loot-link.com","loptelink.com","lordpremium.*","love4porn.com","lovetofu.cyou","lowellsun.com","lrtrojans.com","lsusports.net","ludigames.com","lulacloud.com","lustesthd.lat","lustholic.com","lusttaboo.com","lustteens.net","lustylist.com","lustyspot.com","luxusmail.org","m.viptube.com","m.youtube.com","maccanismi.it","macrumors.com","macserial.com","magesypro.com","mailnesia.com","mailocal2.xyz","mainbabes.com","mainlinks.xyz","mainporno.com","makeuseof.com","mamochki.info","manga-dbs.com","manga-tube.me","manga18fx.com","mangacrab.com","mangacrab.org","mangadass.com","mangafreak.me","mangahere.onl","mangakoma01.*","mangalist.org","mangarawjp.me","mangaread.org","mangasite.org","mangoporn.net","manhastro.com","manhastro.net","manhuatop.org","manhwatop.com","manofadan.com","map.naver.com","mathcrave.com","mathebibel.de","mathsspot.com","matomeiru.com","maz-online.de","mconverter.eu","md3b0j6hj.com","mdfx9dc8n.net","mdy48tn97.com","medebooks.xyz","mediafire.com","mediamarkt.be","mediamarkt.de","mediapason.it","medihelp.life","mega-dvdrip.*","megagames.com","megane.com.pl","megawarez.org","megawypas.com","meineorte.com","meinestadt.de","memangbau.com","memedroid.com","menshealth.de","metalflirt.de","meteopool.org","metrolagu.cam","mettablog.com","meuanime.info","mexicogob.com","mh.baxoi.buzz","mhdsportstv.*","mhdtvsports.*","miohentai.com","miraculous.to","mirrorace.com","missav123.com","missav888.com","mitedrive.com","mixdrop21.net","mixdrop23.net","mixdropjmk.pw","mjakmama24.pl","mmastreams.me","mmorpg.org.pl","mobdi3ips.com","mobdropro.com","modelisme.com","mom-pussy.com","momxxxass.com","momxxxsex.com","moneyhouse.ch","moneyning.com","monstream.org","monzatoday.it","moonquill.com","moovitapp.com","moozpussy.com","moregirls.org","morgenpost.de","mosttechs.com","motive213.com","motofan-r.com","motor-talk.de","motorbasar.de","motortests.de","moutogami.com","moviedekho.in","moviefone.com","moviehaxx.pro","moviejones.de","movielinkbd.*","moviepilot.de","movieping.com","movierulzhd.*","moviesdaweb.*","moviesite.app","moviesverse.*","moviexxx.mobi","mp3-gratis.it","mp3fusion.net","mp3juices.icu","mp4mania1.net","mp4upload.com","mrpeepers.net","mtech4you.com","mtg-print.com","mtraffics.com","multicanais.*","musicsite.biz","musikradar.de","myadslink.com","myfernweh.com","myflixertv.to","mygolfspy.com","myhindigk.com","myicloud.info","myrecipes.com","myshopify.com","mysostech.com","mythvista.com","myvidplay.com","myvidster.com","myviptuto.com","myyouporn.com","naijahits.com","nakenprat.com","napolipiu.com","nastybulb.com","nation.africa","natomanga.com","naturalbd.com","nbcsports.com","ncdexlive.org","needrombd.com","neilpatel.com","nekolink.site","nekopoi.my.id","neoseeker.com","nesiaku.my.id","netfilmes.org","netnaijas.com","nettiauto.com","neuepresse.de","neurotray.com","nevcoins.club","neverdims.com","newstopics.in","newyorker.com","newzjunky.com","nexusgames.to","nexusmods.com","nflstreams.me","nhvnovels.com","nicematin.com","nicomanga.com","nihonkuni.com","nin10news.com","nklinks.click","noblocktape.*","noikiiki.info","noob4cast.com","noor-book.com","nordbayern.de","notevibes.com","nousdecor.com","nouvelobs.com","novamovie.net","novelcrow.com","novelroom.net","novizer.com>>","nsfwalbum.com","nsfwhowto.xyz","nudegista.com","nudistube.com","nuhuskies.com","nukibooks.com","nulledmug.com","nvimfreak.com","nwusports.com","odiafresh.com","officedepot.*","ogoplayer.xyz","ohmybrush.com","ojogos.com.br","okhatrimaza.*","onemanhua.com","online-fix.me","onlinegdb.com","onlyssh.my.id","onlystream.tv","op-marburg.de","openloadmov.*","ostreaming.tv","otakuliah.com","otakuporn.com","ottawasun.com","ovcsports.com","owlsports.com","ozulscans.com","padovaoggi.it","pagalfree.com","pagalmovies.*","pagalworld.us","paidnaija.com","panuvideo.com","paolo9785.com","parisporn.org","parmatoday.it","pasteboard.co","pastelink.net","patchsite.net","pawastreams.*","pc-builds.com","pc-magazin.de","pclicious.net","peacocktv.com","peladas69.com","peliculas24.*","pelisflix20.*","pelisgratis.*","pelismart.com","pelisplusgo.*","pelisplushd.*","pelisplusxd.*","pelisstar.com","perplexity.ai","pervclips.com","pg-wuming.com","phineypet.com","pianokafe.com","pic-upload.de","picbcxvxa.sbs","pichaloca.com","pics-view.com","pienovels.com","piraproxy.app","pirateproxy.*","pixbkghxa.sbs","pixbryexa.sbs","pixnbrqwg.sbs","pixtryab.shop","pkbiosfix.com","play.aetv.com","player.stv.tv","player4me.vip","playfmovies.*","playpaste.com","plugincim.com","pocketnow.com","poco.rcccn.in","pokemundo.com","polska-ie.com","popcorntime.*","porn4fans.com","pornbimbo.com","pornblade.com","pornborne.com","pornchaos.org","pornchimp.com","porncomics.me","porncoven.com","porndollz.com","porndrake.com","pornfelix.com","pornfuzzy.com","pornloupe.com","pornmonde.com","pornoaffe.com","pornobait.com","pornocomics.*","pornoeggs.com","pornohaha.com","pornohans.com","pornohelm.com","pornokeep.com","pornoleon.com","pornomico.com","pornonline.cc","pornonote.pro","pornoplum.com","pornproxy.app","pornproxy.art","pornretro.xyz","pornslash.com","porntopic.com","porntube18.cc","posterify.net","pourcesoir.in","povaddict.com","powforums.com","pravda.com.ua","pregledaj.net","pressplay.cam","pressplay.top","prignitzer.de","proappapk.com","proboards.com","produktion.de","promiblogs.de","prostoporno.*","protestia.com","protopage.com","ptcgpocket.gg","pureleaks.net","pussy-hub.com","pussyspot.net","putlockertv.*","puzzlefry.com","pvpoke-re.com","pwinsider.com","pygodblog.com","qqwebplay.xyz","quesignifi.ca","quicasting.it","quickporn.net","rainytube.com","ranourano.xyz","rbscripts.net","read.amazon.*","readingbd.com","realbooru.com","realmadryt.pl","rechtslupe.de","redhdtube.xxx","redsexhub.com","reliabletv.me","repelisgooo.*","restorbio.com","reviewdiv.com","rexdlfile.com","rgeyyddl.skin","ridvanmau.com","riggosrag.com","ritzyporn.com","rocdacier.com","rockradio.com","rojadirecta.*","roms4ever.com","romsgames.net","romspedia.com","rossoporn.com","rottenlime.pw","roystream.com","rufiiguta.com","rumbunter.com","ruyamanga.com","s.sseluxx.com","sagewater.com","sakaiplus.com","sarapbabe.com","sassytube.com","savefiles.com","scatkings.com","scimagojr.com","scrapywar.com","scrolller.com","sendspace.com","seneporno.com","sensacine.com","seriesite.net","set.seturl.in","sex-babki.com","sexbixbox.com","sexbox.online","sexdicted.com","sexgalaxy.net","sexmazahd.com","sexmutant.com","sexphimhd.net","sextube-6.com","sexyscope.net","sexytrunk.com","sfastwish.com","sfirmware.com","shameless.com","share.hntv.tv","share1223.com","sharemods.com","sharkfish.xyz","sharphindi.in","shemaleup.net","short-fly.com","short1ink.com","shortlinkto.*","shortpaid.com","shorttrick.in","shownieuws.nl","shroomers.app","siimanga.cyou","simana.online","simplebits.io","sinemalar.com","sissytube.net","sitefilme.com","sitegames.net","sk8therapy.fr","skincarie.com","skymovieshd.*","smartworld.it","smashkarts.io","snapwordz.com","socigames.com","softcobra.com","softfully.com","sohohindi.com","solarmovie.id","solarmovies.*","solotrend.net","songfacts.com","sosovalue.com","spankbang.com","spankbang.mov","speedporn.net","speedtest.net","speedweek.com","spfutures.org","spokesman.com","spontacts.com","sportbar.live","sportlemons.*","sportlemonx.*","sportowy24.pl","sportsbite.cc","sportsembed.*","sportsnest.co","sportsrec.com","sportweb.info","spring.org.uk","ssyoutube.com","stagemilk.com","stalkface.com","starsgtech.in","startpage.com","startseite.to","ster-blog.xyz","stock-rom.com","str8ongay.com","stream-69.com","stream4free.*","streambtw.com","streamcloud.*","streamfree.to","streamhd247.*","streamobs.net","streampoi.com","streamporn.cc","streamsport.*","streamta.site","streamtp1.com","streamvid.net","strefaagro.pl","striptube.net","stylist.co.uk","subtitles.cam","subtorrents.*","suedkurier.de","sufanblog.com","sulleiman.com","sunporno.club","superstream.*","supervideo.tv","supforums.com","sweetgirl.org","swisscows.com","switch520.com","sylverkat.com","sysguides.com","szexkepek.net","szexvideok.hu","t-rocforum.de","tab-maker.com","taigoforum.de","tamilarasan.*","tamilguns.org","tamilhit.tech","tapenoads.com","tatsublog.com","techacode.com","techclips.net","techdriod.com","techilife.com","techishant.in","technofino.in","techradar.com","techrecur.com","techtrim.tech","techydino.net","techyrick.com","teenbabe.link","tehnotone.com","tejtime24.com","teknisitv.com","temp-mail.lol","temp-mail.org","tempumail.com","tennis.stream","ternitoday.it","terrylove.com","testsieger.de","texastech.com","thejournal.ie","thelayoff.com","thememypc.net","thenation.com","thespruce.com","thetemp.email","thethings.com","thetravel.com","theuser.cloud","theweek.co.uk","thichcode.net","thiepmung.com","thotpacks.xyz","thotslife.com","thoughtco.com","tierfreund.co","tierlists.com","timescall.com","tinyzonetv.cc","tinyzonetv.se","tmohentai.com","to-travel.net","tok-thots.com","tokopedia.com","tokuzilla.net","topwwnews.com","torgranate.de","torrentz2eu.*","totalcsgo.com","totaldebrid.*","tourporno.com","towerofgod.me","trade2win.com","trailerhg.xyz","trangchu.news","transfaze.com","transflix.net","transtxxx.com","travelbook.de","tremamnon.com","tribeclub.com","tricksplit.io","trigonevo.com","tsubasatr.org","tubehqxxx.com","tubemania.org","tubereader.me","tudigitale.it","tudotecno.com","tukipasti.com","tunabagel.net","tunemovie.fun","turkleech.com","tutcourse.com","tvfutbol.info","twink-hub.com","txxxporn.tube","uberhumor.com","ubuntudde.com","udemyking.com","udinetoday.it","uhcougars.com","uicflames.com","umamigirl.com","uniqueten.net","unlockapk.com","unlockxh4.com","unnuetzes.com","unterhalt.net","up4stream.com","uploadgig.com","uptoimage.com","urgayporn.com","utrockets.com","uwbadgers.com","vectorizer.io","vegamoviese.*","veoplanet.com","verhentai.top","vermoegen.org","vibestreams.*","vibraporn.com","vid-guard.com","vidaextra.com","videoplayer.*","vidora.stream","vidspeeds.com","vidstream.pro","viefaucet.com","villanova.com","vintagetube.*","vipergirls.to","vipserije.com","visionias.net","visnalize.com","vixenless.com","vkrovatku.com","voe-unblock.*","voeunblck.com","voidtruth.com","voiranime1.fr","voirseries.io","vosfemmes.com","vpntester.org","vstplugin.net","vuinsider.com","w3layouts.com","waploaded.com","warezsite.net","watch.plex.tv","watchdirty.to","watchluna.com","watchmovies.*","watchseries.*","watchsite.net","watchtv24.com","wdpglobal.com","weatherwx.com","weirdwolf.net","wendycode.com","westmanga.org","wetpussy.sexy","wg-gesucht.de","whoreshub.com","widewifes.com","wikipekes.com","wikitechy.com","willcycle.com","windowspro.de","wkusports.com","wlz-online.de","wmoviesfree.*","wonderapk.com","workink.click","world4ufree.*","worldfree4u.*","worldsports.*","worldstar.com","worldtop2.com","wowescape.com","wunderweib.de","wvusports.com","www.amazon.de","www.seznam.cz","www.twitch.tv","x-fetish.tube","x-videos.name","xanimehub.com","xhbranch5.com","xhchannel.com","xhlease.world","xhplanet1.com","xhplanet2.com","xhvictory.com","xhwebsite.com","xmovies08.org","xnxxjapon.com","xoxocomic.com","xrivonet.info","xsportbox.com","xsportshd.com","xstory-fr.com","xxvideoss.org","xxx-image.com","xxxbunker.com","xxxcomics.org","xxxfree.watch","xxxhothub.com","xxxscenes.net","xxxvideo.asia","xxxvideor.com","y2meta-uk.com","yachtrevue.at","yandexcdn.com","yaoiotaku.com","ycongnghe.com","yesmovies.*>>","yesmovies4u.*","yeswegays.com","ymp4.download","yogitimes.com","youjizzz.club","youlife24.com","youngleak.com","youpornfm.com","youtubeai.com","yoyofilmeys.*","yumekomik.com","zamundatv.com","zegtrends.com","zerotopay.com","zigforums.com","zinkmovies.in","zmamobile.com","zoompussy.com","zorroplay.xyz","0dramacool.net","111.90.141.252","111.90.150.149","111.90.159.132","1111fullwise.*","123animehub.cc","123moviefree.*","123movierulz.*","123movies4up.*","123moviesd.com","123movieshub.*","185.193.17.214","188.166.182.72","18girlssex.com","1cloudfile.com","1pack1goal.com","1primewire.com","1shortlink.com","1stkissmanga.*","3gpterbaru.com","3rabsports.com","4everproxy.com","69hoshudaana.*","69teentube.com","90fpsconfig.in","absolugirl.com","absolutube.com","admiregirls.su","adnan-tech.com","adsafelink.com","afilmywapi.biz","agedvideos.com","airsextube.com","akumanimes.com","akutsu-san.com","alexsports.*>>","alimaniacky.cz","allbbwtube.com","allcalidad.app","allcelebs.club","allcryptoz.net","allmovieshub.*","allosoccer.com","allpremium.net","allrecipes.com","alluretube.com","allwpworld.com","almezoryae.com","alphaporno.com","amanguides.com","amateurfun.net","amateurporn.co","amigosporn.top","ancensored.com","anconatoday.it","androgamer.org","androidacy.com","ani-stream.com","anime4mega.net","animeblkom.net","animefire.info","animefire.plus","animeheaven.ru","animeindo.asia","animeshqip.org","animespank.com","animesvision.*","anonymfile.com","anyxvideos.com","aozoraapps.net","appsfree4u.com","arab4media.com","arabincest.com","arabxforum.com","arealgamer.org","ariversegl.com","arlinadzgn.com","armyranger.com","arobasenet.com","articlebase.pk","artoffocas.com","ashemaletube.*","ashemaletv.com","asianporn.sexy","asianwatch.net","askpaccosi.com","askushowto.com","assesphoto.com","astro-seek.com","atlantic10.com","audiotools.pro","autocentrum.pl","autopareri.com","av1encodes.com","b3infoarena.in","balkanteka.net","bamahammer.com","bankshiksha.in","bantenexis.com","batmanstream.*","battleboats.io","bbwfuckpic.com","bcanepaltu.com","bcsnoticias.mx","bdsmstreak.com","bdsomadhan.com","bdstarshop.com","beegvideoz.com","belloporno.com","benzinpreis.de","best18porn.com","bestofarea.com","betaseries.com","bharian.com.my","bhugolinfo.com","bidersnotu.com","bildderfrau.de","bingotingo.com","bit-shares.com","bitcotasks.com","bitcrypto.info","bittukitech.in","blackcunts.org","blackteen.link","blocklayer.com","blowjobgif.net","bluearchive.gg","bluedollar.net","boersennews.de","bolly-tube.com","bollywoodx.org","bonstreams.net","boobieblog.com","boobsradar.com","boobsrealm.com","boredgiant.com","boxaoffrir.com","brainknock.net","bravoteens.com","bravotube.asia","brightpets.org","brulosophy.com","btcadspace.com","btcsatoshi.net","btvnovinite.bg","btvsports.my>>","businessua.com","bustmonkey.com","bustybloom.com","cacfutures.org","cadenadial.com","calculate.plus","calgarysun.com","camgirlbay.net","camgirlfap.com","camsstream.com","canalporno.com","caracol.com.co","cardscanner.co","casertanews.it","celebjihad.com","celebwhore.com","cellmapper.net","cesenatoday.it","chachocool.com","chanjaeblog.jp","chart.services","chatgptfree.ai","chaturflix.cam","cheatermad.com","cheatsheet.com","chietitoday.it","cimanow.online","cine-calidad.*","cinelatino.net","cinemalibero.*","cinepiroca.com","citychilli.com","claimcrypto.cc","claimlite.club","clasicotas.org","clicknupload.*","clipartmax.com","cloudflare.com","cloudvideotv.*","club-flank.com","codeandkey.com","coinadpro.club","coloradoan.com","comdotgame.com","comicsarmy.com","comixzilla.com","compromath.com","comunio-cl.com","convert2mp3.cx","coolrom.com.au","copyseeker.net","courseboat.com","coverapi.space","coverapi.store","crackshash.com","cracksports.me","crazygames.com","crazyvidup.com","creebhills.com","crichdplays.ru","cricwatch.io>>","crm.cekresi.me","crunchyscan.fr","cryptoforu.org","cryptonetos.ru","cryptotech.fun","cryptstream.de","csgo-ranks.com","cuckoldsex.net","curseforge.com","cwtvembeds.com","cyberscoop.com","czechvideo.org","dagensnytt.com","dailylocal.com","dallasnews.com","dansmovies.com","daotranslate.*","daxfutures.org","dayuploads.com","ddwloclawek.pl","decompiler.com","defenseone.com","delcotimes.com","derstandard.at","derstandard.de","desicinema.org","desicinemas.pk","designbump.com","desiremovies.*","desktophut.com","devdrive.cloud","deviantart.com","diampokusy.com","dicariguru.com","dieblaue24.com","digipuzzle.net","direct-cloud.*","dirtytamil.com","disneyplus.com","dobletecno.com","dodgersway.com","dogsexporn.net","doseofporn.com","dotesports.com","dotfreesex.com","dotfreexxx.com","doujinnote.com","dowfutures.org","downloadming.*","drakecomic.com","dreamfancy.org","duniailkom.com","dvdgayporn.com","dvdporngay.com","e123movies.com","easytodoit.com","eatingwell.com","ecacsports.com","echo-online.de","ed-protect.org","eddiekidiw.com","eftacrypto.com","elcorreoweb.es","electomania.es","elitegoltv.org","elitetorrent.*","elmalajeno.com","emailnator.com","embedsports.me","embedstream.me","emilybites.com","empire-anime.*","emturbovid.com","emugameday.com","enryumanga.com","epicstream.com","epornstore.com","ericdraken.com","erinsakura.com","erokomiksi.com","eroprofile.com","esgentside.com","esportivos.fun","este-walks.net","estrenosflix.*","estrenosflux.*","ethiopia.co.il","examscisco.com","exbulletin.com","expertplay.net","exteenporn.com","extratorrent.*","extreme-down.*","eztvtorrent.co","f123movies.com","faaduindia.com","fairyanime.com","fakazagods.com","fakedetail.com","fanatik.com.tr","fantacalcio.it","fap-nation.org","faperplace.com","faselhdwatch.*","fastdour.store","fatxxxtube.com","faucetdump.com","faucethero.com","fduknights.com","fetishburg.com","fettspielen.de","fhmemorial.com","fibwatch.store","filemirage.com","fileplanet.com","filesharing.io","filesupload.in","film-adult.com","filme-bune.biz","filmpertutti.*","filmy4waps.org","filmypoints.in","filmyzones.com","filtercams.com","finanztreff.de","finderporn.com","findtranny.com","fine-wings.com","firefaucet.win","fitdynamos.com","fleamerica.com","flostreams.xyz","flycutlink.com","fmoonembed.pro","foodgustoso.it","foodiesjoy.com","foodtechnos.in","football365.fr","fooxybabes.com","forex-trnd.com","fosslovers.com","foxyfolksy.com","freeforums.net","freegayporn.me","freehqtube.com","freeltc.online","freemodsapp.in","freepasses.org","freepdfcomic.*","freepreset.net","freesoccer.net","freesolana.top","freetubetv.net","freiepresse.de","freshplaza.com","freshremix.net","frostytube.com","fu-1abozhcd.nl","fu-1fbolpvq.nl","fu-4u3omzw0.nl","fu-e4nzgj78.nl","fu-m03aenr9.nl","fu-mqsng72r.nl","fu-p6pwkgig.nl","fu-pl1lqloj.nl","fu-v79xn6ct.nl","fu-ys0tjjs1.nl","fucktube4k.com","fuckundies.com","fullporner.com","fullvoyeur.com","gadgetbond.com","galleryxh.site","gamefi-mag.com","gameofporn.com","games.amny.com","games.insp.com","games.metro.us","games.metv.com","games.wtop.com","games2rule.com","games4king.com","gamesgames.com","gamesleech.com","gayforfans.com","gaypornhot.com","gayxxxtube.net","gazettenet.com","gdr-online.com","gdriveplayer.*","gearpatrol.com","gecmisi.com.tr","genovatoday.it","getintopcm.com","getintoway.com","getmaths.co.uk","gettapeads.com","gigacourse.com","gisvacancy.com","gknutshell.com","gloryshole.com","goalsport.info","gobearcats.com","gofilmizle.net","gofirmware.com","goislander.com","golightsgo.com","gomoviesfree.*","gomovieshub.io","goodreturns.in","goodstream.one","googlvideo.com","gorecenter.com","gorgeradio.com","goshockers.com","gostanford.com","gostreamon.net","goterriers.com","gotgayporn.com","gotigersgo.com","gourmandix.com","gousfbulls.com","govtportal.org","grannysex.name","grantorrent1.*","grantorrents.*","graphicget.com","grubstreet.com","guitarnick.com","gujjukhabar.in","gurbetseli.net","guruofporn.com","gutfuerdich.co","gwens-nest.com","gyanitheme.com","gyonlineng.com","hairjob.wpx.jp","haloursynow.pl","hanime1-me.top","hannibalfm.net","hardcorehd.xxx","haryanaalert.*","hausgarten.net","hawtcelebs.com","hdhub4one.pics","hdmovies23.com","hdmoviesfair.*","hdmoviesflix.*","hdmoviesmaza.*","hdpornteen.com","healthelia.com","hentai-for.net","hentai-hot.com","hentai-one.com","hentaiasmr.moe","hentaiblue.net","hentaibros.com","hentaicity.com","hentaidays.com","hentaihere.com","hentaipins.com","hentairead.com","hentaisenpai.*","hentaiteca.net","hentaiworld.tv","heysigmund.com","hidefninja.com","hilaryhahn.com","hinatasoul.com","hindilinks4u.*","hindimovies.to","hindiporno.pro","hit-erotic.com","hollymoviehd.*","homebooster.de","homeculina.com","homemature.net","homesports.net","hortidaily.com","hotcleaner.com","hotgirlhub.com","hotgirlpix.com","howtocivil.com","hpaudiobooks.*","hyogo.ie-t.net","hypershort.com","i123movies.net","iconmonstr.com","idealfollow.in","idlelivelink.*","iisfvirtual.in","ilifehacks.com","ilikecomix.com","imagetwist.com","imgjbxzjv.shop","imgjmgfgm.shop","imgjvmbbm.shop","imgnnnvbrf.sbs","inbbotlist.com","indi-share.com","indiainfo4u.in","indiatimes.com","infocycles.com","infokita17.com","infomaniakos.*","informacion.es","inhumanity.com","insidenova.com","instanders.app","instaporno.net","insteading.com","ios.codevn.net","iqksisgw.xyz>>","isabeleats.com","isekaitube.com","issstories.xyz","itopmusics.com","itopmusicx.com","iuhoosiers.com","jacksorrell.tv","jalshamoviez.*","janamathaya.lk","japannihon.com","japantaboo.com","javaguides.net","javbangers.com","javggvideo.xyz","javhdvideo.org","javheroine.com","javplayers.com","javsexfree.com","javsubindo.com","javtsunami.com","javxxxporn.com","jeniusplay.com","jewelry.com.my","jizzbunker.com","join2babes.com","joyousplay.xyz","jpopsingles.eu","juegoviejo.com","jugomobile.com","juicy3dsex.com","justababes.com","justembeds.xyz","kaboomtube.com","kahanighar.com","kakarotfoot.ru","kannadamasti.*","kashtanka2.com","keepkoding.com","kendralist.com","kgs-invest.com","khabarbyte.com","kickassanime.*","kickasshydra.*","kiddyshort.com","kindergeld.org","kingofdown.com","kiradream.blog","kisahdunia.com","kissmovies.net","kits4beats.com","klartext-ne.de","kokostream.net","komikmanhwa.me","kompasiana.com","kordramass.com","kurakura21.com","kuruma-news.jp","ladkibahin.com","lampungway.com","laprovincia.es","laradiobbs.net","laser-pics.com","latinatoday.it","lauradaydo.com","layardrama21.*","leaderpost.com","leakedzone.com","leakshaven.com","learnospot.com","lebahmovie.com","ledauphine.com","ledgernote.com","lesboluvin.com","lesfoodies.com","letmejerk2.com","letmejerk3.com","letmejerk4.com","letmejerk5.com","letmejerk6.com","letmejerk7.com","lewdcorner.com","lifehacker.com","ligainsider.de","limetorrents.*","linemarlin.com","link.vipurl.in","linkconfig.com","livenewsof.com","lizardporn.com","login.asda.com","lokhung888.com","lookmovie186.*","ludwig-van.com","lulustream.com","m.liputan6.com","mactechnews.de","macworld.co.uk","mad4wheels.com","madchensex.com","madmaxworld.tv","mail.yahoo.com","main-spitze.de","maliekrani.com","manga4life.com","mangamovil.net","manganatos.com","mangaraw18.net","mangareader.to","manhuascan.com","manhwaclub.net","manhwalist.com","manhwaread.com","marketbeat.com","masteranime.tv","mathepower.com","maths101.co.za","matureworld.ws","mcafee-com.com","mega-debrid.eu","megacanais.com","megalinks.info","megamovies.org","megapastes.com","mehr-tanken.de","mejortorrent.*","mercato365.com","meteologix.com","mewingzone.com","midebalonu.net","milanotoday.it","milanworld.net","milffabrik.com","minecraft.buzz","minorpatch.com","mixmods.com.br","mixrootmod.com","mjsbigblog.com","mkv-pastes.com","mobileporn.cam","mockupcity.com","modagamers.com","modapkfile.com","moddedguru.com","modenatoday.it","moderngyan.com","moegirl.org.cn","mommybunch.com","mommysucks.com","momsextube.pro","mortaltech.com","motchill29.com","motherless.com","motogpstream.*","motorgraph.com","motorsport.com","motscroises.fr","movearnpre.com","moviefree2.com","movies2watch.*","moviesapi.club","movieshd.watch","moviesjoy-to.*","moviesjoyhd.to","moviesnation.*","movingxh.world","movisubmalay.*","mtsproducoes.*","multiplayer.it","mummumtime.com","musketfire.com","mxpacgroup.com","mycoolmoviez.*","mydesibaba.com","myforecast.com","myglamwish.com","mylifetime.com","mynewsmedia.co","mypornhere.com","myporntape.com","mysexgamer.com","mysexgames.com","myshrinker.com","mytectutor.com","naasongsfree.*","naijauncut.com","nammakalvi.com","naszemiasto.pl","navysports.com","nayisahara.com","nazarickol.com","nensaysubs.net","neonxcloud.top","neservicee.com","netchimp.co.uk","new.lewd.ninja","newmovierulz.*","newsbreak24.de","newscard24.com","ngontinh24.com","nicheporno.com","nichetechy.com","nikaplayer.com","ninernoise.com","nirjonmela.com","nishankhatri.*","niteshyadav.in","nitroflare.com","niuhuskies.com","nodenspace.com","nosteam.com.ro","notunmovie.net","notunmovie.org","novaratoday.it","novel-gate.com","novelgames.com","novostrong.com","nowosci.com.pl","nudebabes.sexy","nulledbear.com","nulledteam.com","nullforums.net","nulljungle.com","nurulislam.org","nylondolls.com","ocregister.com","officedepot.fr","oggitreviso.it","ohsheglows.com","okamimiost.com","omegascans.org","onlineatlas.us","onlinekosh.com","onlineporno.cc","onlybabes.site","openstartup.tm","opentunnel.net","oregonlive.com","organismes.org","orgasmlist.com","orgyxxxhub.com","orovillemr.com","osubeavers.com","osuskinner.com","oteknologi.com","ourenseando.es","overhentai.net","palapanews.com","palofw-lab.com","pandamovies.me","pandamovies.pw","pandanote.info","pantieshub.net","pantrymama.com","panyshort.link","papafoot.click","paris-tabi.com","paste-drop.com","pathofexile.gg","paylaterin.com","peachytube.com","pelismartv.com","pelismkvhd.com","pelispedia24.*","pelispoptv.com","perfectgirls.*","perfektdamen.*","pervertium.com","perverzija.com","petitestef.com","pherotruth.com","phoneswiki.com","picgiraffe.com","picjgfjet.shop","pictryhab.shop","picturelol.com","pimylifeup.com","pinchofyum.com","pink-sluts.net","pipandebby.com","pirate4all.com","pirateblue.com","pirateblue.net","pirateblue.org","piratemods.com","pivigames.blog","planetsuzy.org","platinmods.com","play-games.com","playcast.click","player-cdn.com","player.rtl2.de","player.sbnmp.*","playermeow.com","playertv24.com","playhydrax.com","playingmtg.com","podkontrola.pl","polskatimes.pl","pop-player.com","popno-tour.net","porconocer.com","porn0video.com","pornahegao.xyz","pornasians.pro","pornerbros.com","pornflixhd.com","porngames.club","pornharlot.net","pornhd720p.com","pornincest.net","pornissimo.org","pornktubes.net","pornodavid.com","pornodoido.com","pornofelix.com","pornofisch.com","pornojenny.net","pornoperra.com","pornopics.site","pornoreino.com","pornotommy.com","pornotrack.net","pornozebra.com","pornrabbit.com","pornrewind.com","pornsocket.com","porntrex.video","porntube15.com","porntubegf.com","pornvideoq.com","pornvintage.tv","portaldoaz.org","portalyaoi.com","poscitechs.lol","powerover.site","premierftp.com","prepostseo.com","pressemedie.dk","primagames.com","primemovies.pl","primevideo.com","proapkdown.com","pruefernavi.de","puppyleaks.com","purepeople.com","pussyspace.com","pussyspace.net","pussystate.com","put-locker.com","putingfilm.com","queerdiary.com","querofilmehd.*","quest4play.xyz","questloops.com","quotesopia.com","rabbitsfun.com","radiotimes.com","radiotunes.com","rahim-soft.com","ramblinfan.com","rankersadda.in","rapid-cloud.co","ravenscans.com","rbxscripts.net","realbbwsex.com","realgfporn.com","realmoasis.com","realmomsex.com","realsimple.com","record-bee.com","recordbate.com","redfaucet.site","rednowtube.com","redpornnow.com","redtubemov.com","reggiotoday.it","reisefrage.net","resortcams.com","revealname.com","reviersport.de","revivelink.com","richtoscan.com","riminitoday.it","ringelnatz.net","ripplehub.site","rlxtech24h.com","rmacsports.org","roadtrippin.fr","robbreport.com","rokuhentai.com","rollrivers.com","rollstroll.com","romaniasoft.ro","romhustler.org","royaledudes.io","rubyvidhub.com","rugbystreams.*","ruinmyweek.com","russland.jetzt","rusteensex.com","ruyashoujo.com","safefileku.com","safemodapk.com","samaysawara.in","sanfoundry.com","saratogian.com","sat.technology","sattaguess.com","saveshared.com","savevideo.tube","sciencebe21.in","scoreland.name","scrap-blog.com","screenflash.io","screenrant.com","scriptsomg.com","scriptsrbx.com","scriptzhub.com","section215.com","seeitworks.com","seekplayer.vip","seirsanduk.com","seksualios.com","selfhacked.com","serienstream.*","series2watch.*","seriesonline.*","seriesperu.com","seriesyonkis.*","serijehaha.com","severeporn.com","sex-empire.org","sex-movies.biz","sexcams-24.com","sexgamescc.com","sexgayplus.com","sextubedot.com","sextubefun.com","sextubeset.com","sexvideos.host","sexyaporno.com","sexybabes.club","sexybabesz.com","sexynakeds.com","sgvtribune.com","shadowverse.gg","shahid.mbc.net","sharedwebs.com","shazysport.pro","sheamateur.com","shegotass.info","sheikhmovies.*","shesfreaky.com","shinobijawi.id","shooshtime.com","shop123.com.tw","short-url.link","short-zero.com","shorterall.com","shrinkearn.com","shueisharaw.tv","shupirates.com","sieutamphim.me","siliconera.com","singjupost.com","sitarchive.com","sitemini.io.vn","siusalukis.com","skat-karten.de","slickdeals.net","slideshare.net","smartinhome.pl","smarttrend.xyz","smiechawatv.pl","smoothdraw.com","snhupenmen.com","solidfiles.com","soranews24.com","soundboards.gg","spaziogames.it","speedostream.*","speedynews.xyz","speisekarte.de","spiele.bild.de","spieletipps.de","spiritword.net","spoilerplus.tv","sporteurope.tv","sportsdark.com","sportsnaut.com","sportsonline.*","sportsurge.net","spy-x-family.*","stadelahly.net","stahnivideo.cz","standard.co.uk","stardewids.com","starzunion.com","stbemuiptv.com","steamverde.net","stireazilei.eu","storyblack.com","stownrusis.com","stream2watch.*","streamecho.top","streamlord.com","streamruby.com","stripehype.com","studydhaba.com","studyfinds.org","subtitleone.cc","subtorrents1.*","sugarapron.com","super-games.cz","superanimes.in","suvvehicle.com","svetserialu.io","svetserialu.to","swatchseries.*","swordalada.org","tainhanhvn.com","talkceltic.net","talkjarvis.com","tamilnaadi.com","tamilprint29.*","tamilprint30.*","tamilprint31.*","tamilprinthd.*","taradinhos.com","tarnkappe.info","taschenhirn.de","tea-coffee.net","tech-blogs.com","tech-story.net","techhelpbd.com","techiestalk.in","techkeshri.com","techmyntra.net","techperiod.com","techsignin.com","techsslash.com","tecnoaldia.net","tecnobillo.com","tecnoscann.com","tecnoyfoto.com","teenager365.to","teenextrem.com","teenhubxxx.com","teensexass.com","tekkenmods.com","telemagazyn.pl","telesrbija.com","temp.modpro.co","tennisactu.net","testserver.pro","textograto.com","textovisia.com","texturecan.com","theargus.co.uk","theavtimes.com","thefantazy.com","thefitchen.com","theflixertv.to","thehesgoal.com","themeslide.com","thenetnaija.co","thepiratebay.*","theporngod.com","therichest.com","thesextube.net","thetakeout.com","thethothub.com","thetimes.co.uk","thevideome.com","thewambugu.com","thotchicks.com","titsintops.com","tiz-cycling.io","tojimangas.com","tomshardware.*","topcartoons.tv","topcryptoz.net","topsporter.net","topwebgirls.eu","torinotoday.it","tormalayalam.*","torontosun.com","torovalley.net","torrentmac.net","totalsportek.*","tous-sports.ru","towerofgod.top","toyokeizai.net","tpornstars.com","trancehost.com","trannyline.com","trashbytes.net","traumporno.com","treehugger.com","trendflatt.com","trentonian.com","trentotoday.it","tribunnews.com","tronxminer.com","truckscout24.*","tuberzporn.com","tubesafari.com","tubexxxone.com","tukangsapu.net","turbocloud.xyz","turkish123.com","tv-films.co.uk","tv.youtube.com","tvspielfilm.de","twincities.com","u123movies.com","ucfknights.com","uciteljica.net","uclabruins.com","ufreegames.com","uiuxsource.com","uktvplay.co.uk","unblocked.name","unblocksite.pw","uncpbraves.com","uncwsports.com","unionmanga.xyz","unlvrebels.com","uoflsports.com","uploadbank.com","uploadking.net","uploadmall.com","uploadraja.com","upnewsinfo.com","uptostream.com","urlbluemedia.*","usctrojans.com","usdtoreros.com","usersdrive.com","utepminers.com","uyduportal.net","v2movies.click","vavada5com.com","vbox7-mp3.info","vedamdigi.tech","vegamovies4u.*","vegamovvies.to","vestimage.site","video-seed.xyz","video1tube.com","videogamer.com","videolyrics.in","videos1002.com","videoseyred.in","videosgays.net","vidguardto.xyz","vidhidepre.com","vidhidevip.com","vidstreams.net","view.ceros.com","viewmature.com","vikistream.com","viralpedia.pro","visortecno.com","vmorecloud.com","voeunbl0ck.com","voeunblock.com","voiceloves.com","voipreview.org","voltupload.com","voyeurblog.net","vulgarmilf.com","vviruslove.com","wantmature.com","warefree01.com","watch-series.*","watchasians.cc","watchomovies.*","watchpornx.com","watchseries1.*","watchseries9.*","wcoanimedub.tv","wcoanimesub.tv","wcoforever.net","weatherx.co.in","webseries.club","weihnachten.me","wellplated.com","wenxuecity.com","westmanga.info","wetteronline.*","whatfontis.com","whatismyip.com","whats-new.cyou","whatshowto.com","whodatdish.com","whoisnovel.com","wiacsports.com","wifi4games.com","wikifilmia.com","windbreaker.me","wizhdsports.fi","wkutickets.com","wmubroncos.com","womennaked.net","wordpredia.com","world4ufree1.*","worldofbin.com","wort-suchen.de","worthcrete.com","wow-mature.com","wowxxxtube.com","wspolczesna.pl","wsucougars.com","www-y2mate.com","www.amazon.com","www.lenovo.com","www.reddit.com","www.tiktok.com","x2download.com","xanimeporn.com","xclusivejams.*","xdld.pages.dev","xerifetech.com","xfrenchies.com","xhamster46.com","xhofficial.com","xhomealone.com","xhwebsite2.com","xhwebsite5.com","xiaomi-miui.gr","xmegadrive.com","xnxxporn.video","xxx-videos.org","xxxbfvideo.net","xxxblowjob.pro","xxxdessert.com","xxxextreme.org","xxxtubedot.com","xxxtubezoo.com","xxxvideohd.net","xxxxselfie.com","xxxymovies.com","xxxyoungtv.com","yabaisub.cloud","yakisurume.com","yarnutopia.com","yelitzonpc.com","yomucomics.com","yottachess.com","youngbelle.net","youporngay.com","youtubetomp3.*","yoututosjeff.*","yuki0918kw.com","yumstories.com","yunakhaber.com","zazzybabes.com","zertalious.xyz","zippyshare.day","zkillboard.com","zona-leros.com","zonebourse.com","zooredtube.com","10hitmovies.com","123movies-org.*","123moviesfree.*","123moviesfun.is","18-teen-sex.com","18asiantube.com","18porncomic.com","18teen-tube.com","1direct-cloud.*","1vid1shar.space","2tamilprint.pro","3xamatorszex.hu","4allprograms.me","5masterzzz.site","6indianporn.com","a-z-animals.com","acedarspoon.com","admediaflex.com","adminreboot.com","adrianoluis.net","adrinolinks.com","advicefunda.com","adz7short.space","aeroxplorer.com","aflamsexnek.com","aflizmovies.com","agrarwetter.net","ai.hubtoday.app","aitoolsfree.org","alanyapower.com","aliezstream.pro","alldeepfake.ink","alldownplay.xyz","allotech-dz.com","allpussynow.com","alltechnerd.com","amazon-love.com","amritadrino.com","anallievent.com","androidapks.biz","androidcure.com","androidsite.net","androjungle.com","anime-sanka.com","anime7.download","animedao.com.ru","animesexbar.com","animesultra.net","animexxxsex.com","antenasports.ru","aoashimanga.com","apfelpatient.de","apkmagic.com.ar","app.blubank.com","arabshentai.com","arcadepunks.com","archivebate.com","archiwumalle.pl","argio-logic.net","asia.5ivttv.vip","asiangaysex.net","asianhdplay.net","askcerebrum.com","astrumscans.xyz","atemporal.cloud","atleticalive.it","atresplayer.com","au-di-tions.com","auto-service.de","autoindustry.ro","automat.systems","automothink.com","averiecooks.com","avoiderrors.com","awdescargas.com","babesaround.com","babesinporn.com","babesxworld.com","badgehungry.com","bangpremier.com","baylorbears.com","bdsm-photos.com","bdsmkingdom.xyz","bdsmporntub.com","bdsmwaytube.com","beammeup.com.au","bedavahesap.org","beingmelody.com","bellezashot.com","bengalisite.com","bengalxpress.in","bentasker.co.uk","best-shopme.com","best18teens.com","bestialporn.com","beurettekeh.com","bgmateriali.com","bgmi32bitapk.in","bgsufalcons.com","bibliopanda.com","big12sports.com","bigboobs.com.es","bigtitslust.com","bike-urious.com","bintangplus.com","biologianet.com","blackavelic.com","blackpornhq.com","blacksexmix.com","blogenginee.com","blogpascher.com","blowxxxtube.com","bluebuddies.com","bluedrake42.com","bluemanhoop.com","bluemediafile.*","bluemedialink.*","bluemediaurls.*","bokepsin.in.net","bolly4umovies.*","bollydrive.rest","boobs-mania.com","boobsforfun.com","bookpraiser.com","boosterx.stream","boxingstream.me","boxingvideo.org","boyfriendtv.com","braziliannr.com","bresciatoday.it","brieffreunde.de","brother-usa.com","budgetbytes.com","buffsports.io>>","buffstreamz.com","buickforums.com","bulbagarden.net","bunkr-albums.io","burningseries.*","buzzheavier.com","cafedelites.com","camwhoreshd.com","camwhorespy.com","camwhorez.video","captionpost.com","carbonite.co.za","careersides.com","casutalaurei.ro","cataniatoday.it","catchthrust.net","cempakajaya.com","cerberusapp.com","chatropolis.com","cheatglobal.com","check-imei.info","cheese-cake.net","cherrynudes.com","chromeready.com","cieonline.co.uk","cinemakottaga.*","cineplus123.org","citibank.com.sg","ciudadgamer.com","claimclicks.com","claimcoins.site","classicoder.com","classifarms.com","cloud9obits.com","cloudnestra.com","code-source.net","codeitworld.com","codemystery.com","codeproject.com","coloringpage.eu","comicsporno.xxx","comoinstalar.me","compucalitv.com","computerbild.de","consoleroms.com","coromon.wiki.gg","cosplaynsfw.xyz","coursewikia.com","cpomagazine.com","cracking-dz.com","crackthemes.com","crazyashwin.com","crazydeals.live","creditsgoal.com","crunchyroll.com","crunchytech.net","cryptoearns.com","cta-fansite.com","cubbiescrib.com","cumshotlist.com","cutiecomics.com","cyberlynews.com","cybertechng.com","cyclingnews.com","cycraracing.com","daemonanime.net","daily-times.com","dailyangels.com","dailybreeze.com","dailycaller.com","dailycamera.com","dailyecho.co.uk","dailyknicks.com","dailymail.co.uk","dailymotion.com","dailypost.co.uk","dailystar.co.uk","dark-gaming.com","dawindycity.com","db-creation.net","dbupatriots.com","dbupatriots.org","deathonnews.com","decomaniacos.es","definitions.net","desbloqueador.*","descargas2020.*","desirenovel.com","desixxxtube.org","detikbangka.com","deutschsex.mobi","devopslanka.com","dhankasamaj.com","digimonzone.com","diminimalis.com","direct-cloud.me","dirtybadger.com","discoveryplus.*","diversanews.com","dlouha-videa.cz","dobleaccion.xyz","docs.google.com","dollarindex.org","domainwheel.com","donnaglamour.it","donnerwetter.de","dopomininfo.com","dota2freaks.com","dotadostube.com","downphanmem.com","drake-scans.com","drakerelays.org","drama-online.tv","dramanice.video","dreamcheeky.com","drinksmixer.com","driveplayer.net","droidmirror.com","dtbps3games.com","duplex-full.lol","eaglesnovel.com","easylinkref.com","ebaticalfel.com","editorsadda.com","edmontonsun.com","edumailfree.com","eksporimpor.com","elektrikmen.com","elpasotimes.com","elperiodico.com","embed.meomeo.pw","embedcanais.com","embedsports.top","embedstreams.me","emperorscan.com","empire-stream.*","engstreams.shop","enryucomics.com","erotikclub35.pw","esportsmonk.com","esportsnext.com","exactpay.online","exam-results.in","excelchamps.com","expedition33.gg","explorecams.com","explorosity.net","exporntoons.net","exposestrat.com","extrapetite.com","extratorrents.*","fabioambrosi.it","farmeramania.de","faselhd-watch.*","faucetbravo.fun","fcportables.com","fellowsfilm.com","femdomworld.com","femjoybabes.com","feral-heart.com","fidlarmusic.com","file-upload.net","file.gocmod.com","filehost9.com>>","filespayout.com","filmesonlinex.*","filmoviplex.com","filmy4wap.co.in","filmyzilla5.com","finalnews24.com","financebolo.com","financemonk.net","financewada.com","financeyogi.net","finanzfrage.net","findnewjobz.com","fingerprint.com","firmenwissen.de","fiveyardlab.com","flashsports.org","flordeloto.site","flyanimes.cloud","flygbussarna.se","folgenporno.com","foodandwine.com","footyhunter.lol","forex-yours.com","foxseotools.com","framedcooks.com","freebitcoin.win","freebnbcoin.com","freecardano.com","freecourse.tech","freecricket.net","freegames44.com","freemockups.org","freeomovie.info","freepornjpg.com","freepornsex.net","freethemesy.com","freevpshere.com","freewebcart.com","french-stream.*","fsportshd.xyz>>","ftsefutures.org","fu-12qjdjqh.lol","fu-c66heipu.lol","fu-hbr4fzp4.lol","fu-hjyo3jqu.lol","fu-l6d0ptc6.lol","fuckedporno.com","fuckingfast.net","fullfilmizle.cc","fullxxxporn.net","fun-squared.com","fztvseries.live","g-streaming.com","gadgetspidy.com","gadzetomania.pl","gamecopyworld.*","gameplayneo.com","gamersglobal.de","games.macon.com","games.word.tips","gamesaktuell.de","gamestorrents.*","gaming-fans.com","gaminginfos.com","gamingvital.com","gartendialog.de","gayboystube.top","gaypornhdfree.*","gaypornlove.net","gaypornwave.com","gayvidsclub.com","gazetaprawna.pl","geiriadur.ac.uk","geissblog.koeln","gendatabase.com","georgiadogs.com","germanvibes.org","gesund-vital.de","getexploits.com","gewinnspiele.tv","gfx-station.com","girlssexxxx.com","givemeaporn.com","givemesport.com","glavmatures.com","globaldjmix.com","gocreighton.com","godairyfree.org","goexplorers.com","gofetishsex.com","gofile.download","gogoanime.co.in","goislanders.com","gokushiteki.com","golderotica.com","golfchannel.com","gomacsports.com","gomarquette.com","gopsusports.com","goxxxvideos.com","goyoungporn.com","gradehgplus.com","grandmatube.pro","grannyfucko.com","grasshopper.com","greattopten.com","grootnovels.com","gsmfirmware.net","gsmfreezone.com","gsmmessages.com","gut-erklaert.de","hacksnation.com","handypornos.net","hanimesubth.com","hardcoreluv.com","hardwareluxx.de","hardxxxmoms.com","harshfaucet.com","hd-analporn.com","hd-easyporn.com","hdjavonline.com","hds-streaming.*","hdstreamss.club","healthfatal.com","heavyfetish.com","heidelberg24.de","helicomicro.com","hentai-moon.com","hentai-senpai.*","hentai2read.com","hentaiarena.com","hentaibatch.com","hentaibooty.com","hentaicloud.com","hentaicovid.org","hentaifreak.org","hentaigames.app","hentaihaven.com","hentaihaven.red","hentaihaven.vip","hentaihaven.xxx","hentaiporno.xxx","hentaipulse.com","hentaitube1.lol","heroine-xxx.com","hertoolbelt.com","hesgoal-live.io","hiddencamhd.com","hindinews360.in","hokiesports.com","hollaforums.com","hollymoviehd.cc","hollywoodpq.com","honeyandlime.co","hookupnovel.com","hostserverz.com","hot-cartoon.com","hotgameplus.com","hotmediahub.com","hotpornfile.org","hotsexstory.xyz","hotstunners.com","hotxxxpussy.com","hqxxxmovies.com","hscprojects.com","hummusapien.com","hypicmodapk.org","iban-rechner.de","ibcomputing.com","ibeconomist.com","ideal-teens.com","ikramlar.online","ilbassoadige.it","ilgazzettino.it","illicoporno.com","ilmessaggero.it","ilovetoplay.xyz","ilsole24ore.com","imagelovers.com","imgqnnnebrf.sbs","incgrepacks.com","indiakablog.com","infrafandub.com","inside-handy.de","insuredhome.org","interracial.com","investcrust.com","inyatrust.co.in","iptvjournal.com","italianoxxx.com","itsonsitetv.com","iwantmature.com","januflix.expert","japangaysex.com","japansporno.com","japanxxxass.com","jastrzabpost.pl","jav-torrent.org","javcensored.net","javenglish.cc>>","javindosub.site","javmoviexxx.com","javpornfull.com","javraveclub.com","javteentube.com","javtrailers.com","jaysjournal.com","jessifearon.com","jetztspielen.de","jkssbalerts.com","jobslampung.net","johntryopen.com","jokerscores.com","juliasalbum.com","just-upload.com","kabarportal.com","karaoketexty.cz","kasvekuvvet.net","katmoviehd4.com","kattannonser.se","kawarthanow.com","keezmovies.surf","ketoconnect.net","ketubanjiwa.com","kickass-anime.*","kickassanime.ch","kiddyearner.com","kingsleynyc.com","kisshentaiz.com","kitabmarkaz.xyz","kittycatcam.com","kodewebsite.com","komikdewasa.art","komorkomania.pl","krakenfiles.com","kreiszeitung.de","krktcountry.com","kstorymedia.com","kurierverlag.de","kyoto-kanko.net","la123movies.org","langitmovie.com","laptechinfo.com","latinluchas.com","lavozdigital.es","ldoceonline.com","learnedclub.com","lecrabeinfo.net","legionscans.com","lendrive.web.id","lesbiansex.best","levante-emv.com","libertycity.net","librasol.com.br","liga3-online.de","lightsnovel.com","link.3dmili.com","link.asiaon.top","link.cgtips.org","link.codevn.net","linksheild.site","linkss.rcccn.in","linkvertise.com","linux-talks.com","live.arynews.tv","livesport24.net","livestreames.us","livestreamtv.pk","livexscores.com","livingathome.de","livornotoday.it","lombardiave.com","lookmoviess.com","looptorrent.org","lotusgamehd.xyz","lovelynudez.com","lovingsiren.com","luchaonline.com","lucrebem.com.br","lukesitturn.com","lulustream.live","lustesthd.cloud","lycee-maroc.com","macombdaily.com","macrotrends.net","magdownload.org","maisonbrico.com","mangahentai.xyz","mangahere.today","mangakakalot.gg","mangaonline.fun","mangaraw1001.cc","mangarawjp.asia","mangaromance.eu","mangarussia.com","manhuarmmtl.com","manhwahentai.me","manoramamax.com","mantrazscan.com","marie-claire.es","marimo-info.net","marketmovers.it","marvelrivals.gg","maskinbladet.dk","mastakongo.info","mathsstudio.com","mathstutor.life","maxcheaters.com","maxjizztube.com","maxstream.video","maxtubeporn.net","me-encantas.com","medeberiya.site","medeberiya1.com","medeberiyaa.com","medeberiyas.com","medeberiyax.com","mediacast.click","mega4upload.com","mega4upload.net","mejortorrento.*","mejortorrents.*","mejortorrentt.*","memoriadatv.com","mentalfloss.com","mercerbears.com","mercurynews.com","messinatoday.it","metal-hammer.de","milliyet.com.tr","miniminiplus.pl","minutolivre.com","mirrorpoi.my.id","mixrootmods.com","mobility.com.ng","mockuphunts.com","modporntube.com","moflix-stream.*","molbiotools.com","mommy-pussy.com","momtubeporn.xxx","motherporno.com","mov18plus.cloud","moviemaniak.com","movierulzfree.*","movierulzlink.*","movies2watch.tv","moviescounter.*","moviesonline.fm","moviessources.*","moviessquad.com","movieuniverse.*","mp3fromyou.tube","mrdeepfakes.com","mscdroidlabs.es","msdos-games.com","msonglyrics.com","msuspartans.com","muchohentai.com","multifaucet.org","musiclutter.xyz","musikexpress.de","mybestxtube.com","mydesiboobs.com","myfreeblack.com","mysexybabes.com","mywatchseries.*","myyoungbabe.com","mzansinudes.com","naijanowell.com","naijaray.com.ng","nakedbabes.club","nangiphotos.com","nativesurge.net","nativesurge.top","naughtyza.co.za","nbareplayhd.com","nbcolympics.com","necksdesign.com","needgayporn.com","nekopoicare.*>>","netflixlife.com","networkhint.com","news-herald.com","news-leader.com","newstechone.com","nflspinzone.com","nicexxxtube.com","nizarstream.com","noindexscan.com","noithatmyphu.vn","nokiahacking.pl","nomnompaleo.com","nosteamgames.ro","notebookcheck.*","notesformsc.org","noteshacker.com","notunmovie.link","novelssites.com","nsbtmemoir.site","nsfwmonster.com","nsfwyoutube.com","nswdownload.com","nu6i-bg-net.com","nudeslegion.com","nudismteens.com","nukedpacks.site","nullscripts.net","nursexfilme.com","nutmegnanny.com","nyaatorrent.com","oceanofmovies.*","ohmirevista.com","okiemrolnika.pl","olamovies.store","olympustaff.com","omgexploits.com","online-smss.com","onlinekosten.de","open3dmodel.com","openculture.com","openloading.com","order-order.com","orgasmatrix.com","oromedicine.com","otokukensaku.jp","otomi-games.com","ourcoincash.xyz","oyundunyasi.net","ozulscansen.com","pacersports.com","pageflutter.com","pakkotoisto.com","palermotoday.it","panda-novel.com","pandamovies.org","pandasnovel.com","paperzonevn.com","pawastreams.org","pawastreams.pro","pcgameszone.com","peliculas8k.com","peliculasmx.net","pelisflix20.*>>","pelismarthd.com","pelisxporno.net","pendekarsubs.us","pepperlive.info","perezhilton.com","perfektdamen.co","persianhive.com","perugiatoday.it","pewresearch.org","pflege-info.net","phonerotica.com","phongroblox.com","phpscripttr.com","pianetalecce.it","pics4upload.com","picxnkjkhdf.sbs","pimpandhost.com","pinoyalbums.com","pinoyrecipe.net","piratehaven.xyz","pisshamster.com","pissingporn.com","pixdfdjkkr.shop","pixkfjtrkf.shop","planetfools.com","platinporno.com","play.hbomax.com","player.msmini.*","plugincrack.com","pocket-lint.com","popcornstream.*","popdaily.com.tw","porhubvideo.com","porn-monkey.com","pornexpanse.com","pornfactors.com","porngameshd.com","pornhegemon.com","pornhoarder.net","porninblack.com","porno-porno.net","porno-rolik.com","pornohammer.com","pornohirsch.net","pornoklinge.com","pornomanoir.com","pornrusskoe.com","portable4pc.com","premiumporn.org","privatemoviez.*","projectfreetv.*","promimedien.com","prouddogmom.com","proxydocker.com","punishworld.com","purelyceleb.com","pussy3dporn.com","pussyhothub.com","qatarstreams.me","quiltfusion.com","quotesshine.com","r1.richtoon.top","rackusreads.com","radionatale.com","radionylive.com","radiorockon.com","railwebcams.net","rajssoid.online","rangerboard.com","ravennatoday.it","rctechsworld.in","readbitcoin.org","readhunters.xyz","readingpage.fun","redpornblog.com","remodelista.com","rennrad-news.de","renoconcrete.ca","rentbyowner.com","reportera.co.kr","restegourmet.de","retroporn.world","risingapple.com","ritacandida.com","robot-forum.com","rojadirectatv.*","rollingstone.de","romaierioggi.it","romfirmware.com","root-nation.com","route-fifty.com","rule34vault.com","runnersworld.de","rushuploads.com","ryansharich.com","saabcentral.com","salernotoday.it","samapkstore.com","sampledrive.org","samuraiscan.com","samuraiscan.org","santhoshrcf.com","satoshi-win.xyz","savealoonie.com","scatnetwork.com","schwaebische.de","sdmoviespoint.*","sekaikomik.live","serienstream.to","seriesmetro.net","seriesonline.sx","seriouseats.com","serverbd247.com","serviceemmc.com","setfucktube.com","sex-torrent.net","sexanimesex.com","sexoverdose.com","sexseeimage.com","sexwebvideo.com","sexxxanimal.com","sexy-parade.com","sexyerotica.net","seznamzpravy.cz","sfmcompile.club","shadagetech.com","shadowrangers.*","sharegdrive.com","sharinghubs.com","shemalegape.net","shomareh-yab.ir","shopkensaku.com","shortxlinks.com","showcamrips.com","showrovblog.com","shrugemojis.com","shugraithou.com","siamfishing.com","sieutamphim.org","singingdalong.*","siriusfiles.com","sitetorrent.com","sivackidrum.net","skinnytaste.com","slapthesign.com","sleazedepot.com","sleazyneasy.com","smartcharts.net","sms-anonyme.net","sms-receive.net","smsonline.cloud","smumustangs.com","soconsports.com","software-on.com","softwaresde.com","solarchaine.com","sommerporno.com","sondriotoday.it","souq-design.com","sourceforge.net","spanishdict.com","spardhanews.com","sport890.com.uy","sports-stream.*","sportsblend.net","sportsonline.si","sportsonline.so","sportsplays.com","sportsseoul.com","sportstiger.com","sportstreamtv.*","starstreams.pro","start-to-run.be","stbemuiptvn.com","sterkinekor.com","stream.bunkr.ru","streamers.watch","streamnoads.com","stronakobiet.pl","studybullet.com","subtitlecat.com","sueddeutsche.de","suicidepics.com","sullacollina.it","sumirekeiba.com","suneelkevat.com","superdeporte.es","superembeds.com","supermarches.ca","supermovies.org","svethardware.cz","swift4claim.com","syracusefan.com","tabooanime.club","tackledsoul.com","tagesspiegel.de","tamilanzone.com","tamilultra.team","tapeantiads.com","tapeblocker.com","team-octavi.com","techacrobat.com","techadvisor.com","techastuces.com","techedubyte.com","techinferno.com","technichero.com","technorozen.com","techoreview.com","techprakash.com","techsbucket.com","techyhigher.com","techymedies.com","tedenglish.site","teen-hd-sex.com","teenfucksex.com","teenpornjpg.com","teensextube.xxx","teenxxxporn.pro","telegraph.co.uk","telepisodes.org","temporeale.info","tenbaiquest.com","tenies-online.*","tennisonline.me","tennisstreams.*","teracourses.com","texassports.com","textreverse.com","thaiairways.com","the-mystery.org","the2seasons.com","the5krunner.com","theappstore.org","thebarchive.com","thebigblogs.com","theclashify.com","thedilyblog.com","thejetpress.com","thejoblives.com","themoviesflix.*","theprovince.com","thereporter.com","thestreameast.*","thetoneking.com","theusaposts.com","thewebflash.com","theyarehuge.com","thingiverse.com","thingstomen.com","thisisrussia.io","thueringen24.de","thumpertalk.com","ticketmaster.sg","tickhosting.com","ticonsiglio.com","tieba.baidu.com","tienganhedu.com","tires.costco.ca","today-obits.com","todopolicia.com","toeflgratis.com","tokyomotion.com","tokyomotion.net","toledoblade.com","topnewsshow.com","topperpoint.com","topstarnews.net","torascripts.org","tornadomovies.*","torrentgalaxy.*","torrentgame.org","torrentstatus.*","torresette.news","tradingview.com","transfermarkt.*","trendohunts.com","trevisotoday.it","triesteprima.it","true-gaming.net","trytutorial.com","tubegaytube.com","tubepornnow.com","tudongnghia.com","tuktukcinma.com","turbovidhls.com","turkeymenus.com","tusachmanga.com","tvanouvelles.ca","tvsportslive.fr","twistedporn.com","tyler-brown.com","u6lyxl0w.skin>>","ukathletics.com","ukaudiomart.com","ultramovies.org","undeniable.info","underhentai.net","unipanthers.com","updateroj24.com","uploadbeast.com","uploadcloud.pro","usaudiomart.com","user.guancha.cn","vectogravic.com","veekyforums.com","vegamovies3.org","veneziatoday.it","verpelis.gratis","veryfuntime.com","vfxdownload.net","vibezhub.com.ng","vicenzatoday.it","viciante.com.br","vidcloudpng.com","video.genyt.net","videodidixx.com","videosputas.xxx","vidsrc-embed.ru","vik1ngfile.site","ville-ideale.fr","viralharami.com","viralxvideos.es","voeunblock2.com","voeunblock3.com","voyageforum.com","vtplayer.online","wantedbabes.com","warmteensex.com","watch-my-gf.com","watch.sling.com","watchf1full.com","watchfreexxx.pw","watchhentai.net","watchmovieshd.*","watchpornfree.*","watchseries8.to","watchserieshd.*","watchtvseries.*","watchxxxfree.pw","webmatrices.com","webnovelpub.com","webtoonscan.com","wegotcookies.co","welovemanga.one","weltfussball.at","wemakesites.net","wheelofgold.com","wholenotism.com","wholevideos.com","wieistmeineip.*","wikijankari.com","wikipooster.com","wikisharing.com","windowslite.net","windsorstar.com","witcherhour.com","womenshealth.de","worldgyan18.com","worldofiptv.com","worldsports.*>>","wowpornlist.xyz","wowyoungsex.com","wpgdadatong.com","wristreview.com","writeprofit.org","www.youtube.com","xfuckonline.com","xhardhempus.net","xianzhenyuan.cn","xiaomitools.com","xkeezmovies.com","xmoviesforyou.*","xn--31byd1i.net","xnudevideos.com","xnxxhamster.net","xxxindianporn.*","xxxparodyhd.net","xxxpornmilf.com","xxxtubegain.com","xxxtubenote.com","xxxtubepass.com","xxxwebdlxxx.top","yanksgoyard.com","yazilidayim.net","yesmovies123.me","yeutienganh.com","yogablogfit.com","yomoviesnow.com","yorkpress.co.uk","youlikeboys.com","youmedemblik.nl","young-pussy.com","youranshare.com","yourporngod.com","youtubekids.com","ytconverter.app","yuramanga.my.id","zeroradio.co.uk","zonavideosx.com","zone-annuaire.*","zoominar.online","007stockchat.com","123movies-free.*","18-teen-porn.com","18-teen-tube.com","18adultgames.com","18comic-gquu.vip","1movielinkbd.com","1movierulzhd.pro","24pornvideos.com","2kspecialist.net","4fingermusic.com","8-ball-magic.com","9now.nine.com.au","about-drinks.com","acouplecooks.com","activevoyeur.com","activistpost.com","actresstoday.com","adblockstrtape.*","adblockstrtech.*","adult-empire.com","adultoffline.com","adultporn.com.es","advertafrica.net","agedtubeporn.com","aghasolution.com","aheadofthyme.com","ajaxshowtime.com","ajkalerbarta.com","alleveilingen.be","alleveilingen.nl","alliptvlinks.com","allporncomic.com","alphagames4u.com","alphapolis.co.jp","alphasource.site","altselection.com","anakteknik.co.id","analsexstars.com","analxxxvideo.com","androidadult.com","androidfacil.org","androidgreek.com","androidspill.com","anime-odcinki.pl","animesexclip.com","animetwixtor.com","antennasports.ru","aopathletics.org","apkandroidhub.in","app.simracing.gp","applediagram.com","aquariumgays.com","arezzonotizie.it","articlesmania.me","asianmassage.xyz","asianpornjav.com","assettoworld.com","asyaanimeleri.pw","atlantisscan.com","auburntigers.com","audiofanzine.com","audycje.tokfm.pl","autotrader.co.uk","avellinotoday.it","azamericasat.net","azby.fmworld.net","baby-vornamen.de","backfirstwo.site","backyardboss.net","backyardpapa.com","bangyourwife.com","barbarabakes.com","barrier-free.net","batmanfactor.com","bcuathletics.com","beaddiagrams.com","beritabangka.com","berlin-teltow.de","bestasiansex.pro","bestblackgay.com","bestcash2020.com","bestclaimtrx.xyz","bestgamehack.top","bestgrannies.com","besthdmovies.com","bestpornflix.com","bestsextoons.com","biblegateway.com","bigbuttshub2.top","bikeportland.org","bisceglielive.it","bitchesgirls.com","blackandteal.com","blog.livedoor.jp","blowjobfucks.com","bloxinformer.com","bloxyscripts.com","bluemediafiles.*","bluerabbitrx.com","bmw-scooters.com","boardingarea.com","boerse-online.de","bollywoodfilma.*","bondagevalley.cc","booksbybunny.com","boolwowgirls.com","bootstrample.com","bostonherald.com","brandbrief.co.kr","bravoerotica.com","bravoerotica.net","breatheheavy.com","breedingmoms.com","buffalowdown.com","businesstrend.jp","butlersports.com","butterpolish.com","call2friends.com","caminspector.net","campusfrance.org","camvideoshub.com","camwhoresbay.com","caneswarning.com","cartoonporno.xxx","catmovie.website","ccnworldtech.com","celtadigital.com","cervezaporno.com","championdrive.co","charexempire.com","chattanoogan.com","cheatography.com","chelsea24news.pl","chieflyoffer.com","choiceofmods.com","chubbyelders.com","cizzyscripts.com","claimsatoshi.xyz","clever-tanken.de","clickforhire.com","clickndownload.*","clipconverter.cc","cloudgallery.net","clutchpoints.com","cmumavericks.com","coin-profits.xyz","collegehdsex.com","colliersnews.com","coloredmanga.com","comeletspray.com","cometogliere.com","comicspornos.com","comicspornow.com","comicsvalley.com","computerpedia.in","convert2mp3.club","convertinmp4.com","cookincanuck.com","courseleader.net","cr7-soccer.store","cracksports.me>>","criptologico.com","cryptoclicks.net","cryptofactss.com","cryptofaucet.xyz","cryptokinews.com","cryptomonitor.in","culinaryhill.com","cybercityhelp.in","cyberstumble.com","cyclingabout.com","cydiasources.net","dailyboulder.com","dailypudding.com","dailytips247.com","dailyuploads.net","darknessporn.com","darkwanderer.net","dasgelbeblatt.de","dataunlocker.com","dattebayo-br.com","davewigstone.com","dayoftheweek.org","daytonflyers.com","ddl-francais.com","deepfakeporn.net","deepswapnude.com","demonicscans.org","designparty.sx>>","destiny2zone.com","diariodeibiza.es","dirtytubemix.com","discoveryplus.in","djremixganna.com","doanhnghiepvn.vn","dobrapogoda24.pl","dobreprogramy.pl","donghuaworld.com","dorsetecho.co.uk","downloadapk.info","downloadbatch.me","downloadsite.org","downloadsoft.net","dpscomputing.com","drummagazine.com","dryscalpgone.com","dualshockers.com","duplichecker.com","dvdgayonline.com","earncrypto.co.in","eartheclipse.com","eastbaytimes.com","easyexploits.com","easymilftube.net","ebook-hunter.org","ecom.wixapps.net","edufileshare.com","einfachschoen.me","eleceedmanhwa.me","eletronicabr.com","elevationmap.net","eliobenedetto.it","embedseek.online","embedstreams.top","empire-anime.com","emulatorsite.com","english101.co.za","erotichunter.com","eslauthority.com","esportstales.com","everysextube.com","ewrc-results.com","exclusivomen.com","fallbrook247.com","familyminded.com","familyporner.com","famousnipple.com","fastdownload.top","fattelodasolo.it","fatwhitebutt.com","faucetcrypto.com","faucetcrypto.net","favefreeporn.com","favoyeurtube.net","feedmephoebe.com","fernsehserien.de","fessesdenfer.com","fetishshrine.com","filespayouts.com","filmestorrent.tv","filmyhitlink.xyz","filmyhitt.com.in","financacerta.com","fineasiansex.com","finofilipino.org","fitnessholic.net","fitnessscenz.com","flatpanelshd.com","footwearnews.com","footymercato.com","footystreams.net","foreverquote.xyz","forexcracked.com","forextrader.site","forgepattern.net","forum-xiaomi.com","foxsports.com.au","freegetcoins.com","freehardcore.com","freehdvideos.xxx","freelitecoin.vip","freemcserver.net","freemomstube.com","freemoviesu4.com","freeporncave.com","freevstplugins.*","freshersgold.com","fullxcinema1.com","fullxxxmovies.me","fumettologica.it","funkeypagali.com","fussballdaten.de","gadgetxplore.com","gamemodsbase.com","gamers-haven.org","games.boston.com","games.kansas.com","games.modbee.com","games.puzzles.ca","games.sacbee.com","games.sltrib.com","games.usnews.com","gamesrepacks.com","gamingbeasts.com","gamingdeputy.com","gaminglariat.com","ganstamovies.com","garminrumors.com","gartenlexikon.de","gaydelicious.com","gazetalubuska.pl","gbmwolverine.com","gdrivelatino.net","gdrivemovies.xyz","gemiadamlari.org","genialetricks.de","gentlewasher.com","getdatgadget.com","getdogecoins.com","getfreecourses.*","getviralreach.in","getworkation.com","gezegenforum.com","ghettopearls.com","ghostsfreaks.com","gidplayer.online","globelempire.com","go.discovery.com","go.shortnest.com","goblackbears.com","godstoryinfo.com","goetbutigers.com","gogetadoslinks.*","gomcpanthers.com","gometrostate.com","goodyoungsex.com","gophersports.com","gopornindian.com","gourmetscans.net","greasygaming.com","greenarrowtv.com","gruene-zitate.de","gruporafa.com.br","gsm-solution.com","gtamaxprofit.com","guncelkaynak.com","gutesexfilme.com","hadakanonude.com","handelsblatt.com","happyinshape.com","hard-tubesex.com","hardfacefuck.com","hausbau-forum.de","hayatarehber.com","hd-tube-porn.com","healthylifez.com","heilpraxisnet.de","helpdeskgeek.com","hentaicomics.pro","hentaiseason.com","hentaistream.com","hentaivideos.net","homemadehome.com","hotcopper.com.au","hotdreamsxxx.com","hotpornyoung.com","hotpussyhubs.com","houstonpress.com","howsweeteats.com","hqpornstream.com","huskercorner.com","id.condenast.com","ielts-isa.edu.vn","ignoustudhelp.in","ikindlebooks.com","imagereviser.com","imageshimage.com","imagetotext.info","imperiofilmes.co","indexsubtitle.cc","infinityfree.com","infomatricula.pt","inprogrammer.com","inspiralized.com","interviewgig.com","investopedia.com","investorveda.com","isekaibrasil.com","isekaipalace.com","jalshamoviezhd.*","japaneseasmr.com","japanesefuck.com","japanfuck.com.es","javenspanish.com","javfullmovie.com","julieblanner.com","justblogbaby.com","justswallows.net","kakarotfoot.ru>>","katiescucina.com","kayifamilytv.com","khatrimazafull.*","kimscravings.com","kingdomfiles.com","kingsofteens.com","kingstreamz.site","kireicosplay.com","kitchendivas.com","kitchennovel.com","kitraskimisi.com","knowyourmeme.com","kodibeginner.com","kokosovoulje.com","komikstation.com","komputerswiat.pl","kshowsubindo.org","kstatesports.com","ksuathletics.com","kurakura21.space","kuttymovies1.com","lakeshowlife.com","lampungkerja.com","larvelfaucet.com","lascelebrite.com","latesthdmovies.*","latinohentai.com","laurafuentes.com","lavanguardia.com","lawyercontact.us","lectormangaa.com","leechpremium.net","legionjuegos.org","lehighsports.com","lesbiantube.club","letmewatchthis.*","levelupalone.com","lg-firmwares.com","libramemoria.com","lifesurance.info","lightxxxtube.com","limetorrents.lol","linux-magazin.de","linuxexplain.com","live.vodafone.de","livenewsflix.com","logofootball.net","lookmovie.studio","loudountimes.com","ltpcalculator.in","luminatedata.com","lumpiastudio.com","lustaufsleben.at","lustesthd.makeup","macrocreator.com","magicseaweed.com","mahobeachcam.com","mammaebambini.it","manga-scantrad.*","mangacanblog.com","mangaforfree.com","mangaindo.web.id","marcandangel.com","markstyleall.com","masstamilans.com","mastaklomods.com","masterplayer.xyz","matshortener.xyz","mature-tube.sexy","maxisciences.com","meconomynews.com","medievalists.net","mee-6zeqsgv2.com","mee-cccdoz45.com","mee-dp6h8dp2.com","mee-s9o6p31p.com","meetdownload.com","megafilmeshd20.*","megajapansex.com","mejortorrents1.*","merlinshoujo.com","meteoetradar.com","milanreports.com","milfxxxpussy.com","milkporntube.com","mlookalporno.com","mockupgratis.com","mockupplanet.com","moto-station.com","mountaineast.org","movielinkhub.xyz","movierulz2free.*","movierulzwatch.*","movieshdwatch.to","movieshubweb.com","moviesnipipay.me","moviesrulzfree.*","moviestowatch.tv","mrproblogger.com","msmorristown.com","msumavericks.com","multimovies.tech","musiker-board.de","my-ford-focus.de","myair.resmed.com","mycivillinks.com","mydownloadtube.*","myfitnesspal.com","mylegalporno.com","mylivestream.pro","mymotherlode.com","myproplugins.com","myradioonline.pl","nakedbbw-sex.com","naruldonghua.com","nationalpost.com","nativesurge.info","nauathletics.com","naughtyblogs.xyz","neatfreeporn.com","neatpornodot.com","netflixporno.net","netizensbuzz.com","netu.frembed.lol","newanimeporn.com","newedutopics.com","newsinlevels.com","newsobserver.com","newstvonline.com","nghetruyenma.net","nguyenvanbao.com","nhentaihaven.org","niftyfutures.org","nintendolife.com","nl.hardware.info","nocrumbsleft.net","nocsummer.com.br","nonesnanking.com","notebookchat.com","notiziemusica.it","novablogitalia.*","nude-teen-18.com","nudemomshots.com","null-scripts.net","odisha-remix.com","officecoach24.de","ohionowcast.info","olalivehdplay.ru","older-mature.net","oldgirlsporn.com","onestringlab.com","onlineporn24.com","onlygangbang.com","onlygayvideo.com","onlyindianporn.*","open.spotify.com","openloadmovies.*","optimizepics.com","oranhightech.com","orenoraresne.com","oswegolakers.com","otakuanimess.net","oxfordmail.co.uk","pagalworld.video","pandaatlanta.com","pandafreegames.*","parentcircle.com","parking-map.info","pawastreams.info","pdfstandards.net","pedroinnecco.com","penis-bilder.com","personefamose.it","phinphanatic.com","physics101.co.za","pigeonburger.xyz","pinsexygirls.com","play.gamezop.com","play.history.com","player.gayfor.us","player.hdgay.net","player.pop.co.uk","player4me.online","playsexgames.xxx","pleasuregirl.net","plumperstube.com","plumpxxxtube.com","pokeca-chart.com","police.community","ponselharian.com","porn-hd-tube.com","pornclassic.tube","pornclipshub.com","pornforrelax.com","porngayclips.com","pornhub-teen.com","pornobengala.com","pornoborshch.com","pornoteensex.com","pornsex-pics.com","pornstargold.com","pornuploaded.net","pornvideotop.com","pornwatchers.com","pornxxxplace.com","pornxxxxtube.net","portnywebcam.com","post-gazette.com","postermockup.com","powerover.site>>","practicequiz.com","prajwaldesai.com","praveeneditz.com","privatenudes.com","programme-tv.net","programsolve.com","prosiebenmaxx.de","purduesports.com","purposegames.com","puzzles.nola.com","pythonjobshq.com","qrcodemonkey.net","rabbitstream.net","radio-deejay.com","realityblurb.com","realjapansex.com","receptyonline.cz","recordonline.com","redbirdrants.com","rendimentibtp.it","repack-games.com","reportbangla.com","reviewmedium.com","ribbelmonster.de","rimworldbase.com","ringsidenews.com","ripplestream4u.*","riwayat-word.com","rollingstone.com","royale-games.com","rule34hentai.net","rv-ecommerce.com","sabishiidesu.com","safehomefarm.com","sainsburys.co.uk","sandandsisal.com","saradahentai.com","sarugbymag.co.za","satoshifaucet.io","savethevideo.com","savingadvice.com","schaken-mods.com","schildempire.com","schoolcheats.net","search.brave.com","seattletimes.com","secretsdujeu.com","semuanyabola.com","sensualgirls.org","serienjunkies.de","serieslandia.com","sesso-escort.com","sexanimetube.com","sexfilmkiste.com","sexflashgame.org","sexhardtubes.com","sexjapantube.com","sexlargetube.com","sexmomvideos.com","sexontheboat.xyz","sexpornasian.com","sextingforum.net","sexybabesart.com","sexyoungtube.com","sharelink-1.site","sheepesports.com","shelovesporn.com","shemalemovies.us","shemalepower.xyz","shemalestube.com","shimauma-log.com","shoot-yalla.live","short.croclix.me","shortenlinks.top","shortylink.store","showbizbites.com","shrinkforearn.in","shrinklinker.com","signupgenius.com","sikkenscolore.it","simpleflying.com","simplyvoyage.com","sitesunblocked.*","skidrowcodex.net","skidrowcrack.com","skintagsgone.com","smallseotools.ai","smart-wohnen.net","smartermuver.com","smashyplayer.top","soccershoes.blog","softwaresite.net","solution-hub.com","soonersports.com","soundpark-club.*","southpark.cc.com","soyoungteens.com","space-faucet.com","spigotunlocked.*","splinternews.com","sportpiacenza.it","sportshub.stream","sportsloverz.xyz","sportstream.live","spotifylists.com","sshconect.com.br","sssinstagram.com","stablerarena.com","stagatvfiles.com","stiflersmoms.com","stileproject.com","stillcurtain.com","stockhideout.com","stopstreamtv.net","storieswatch.com","stream.nflbox.me","stream4free.live","streamblasters.*","streamcenter.xyz","streamextreme.cc","streamingworld.*","streamloverx.com","strefabiznesu.pl","strtapeadblock.*","suamusica.com.br","sukidesuost.info","sunshine-live.de","supremebabes.com","swiftuploads.com","sxmislandcam.com","synoniemboek.com","tamarindoyam.com","tapelovesads.org","taroot-rangi.com","teachmemicro.com","techgeek.digital","techkhulasha.com","technewslive.org","tecnotutoshd.net","teensexvideos.me","telcoinfo.online","telegratuita.com","text-compare.com","the1security.com","thebakermama.com","thecozyapron.com","thecustomrom.com","thefappening.pro","thefitbrit.co.uk","thegadgetking.in","thehiddenbay.com","theinventory.com","thejobsmovie.com","thelandryhat.com","thelosmovies.com","thelovenerds.com","thematurexxx.com","thenewcamera.com","thenewsdrill.com","thenewsglobe.net","thenextplanet1.*","theorie-musik.de","thepiratebay.org","thepoorcoder.com","thesportster.com","thesportsupa.com","thestonesoup.com","thesundevils.com","thetrendverse.in","thevikingage.com","thisisfutbol.com","timesnownews.com","timesofindia.com","tires.costco.com","tiroalpaloes.com","tiroalpaloes.net","tnstudycorner.in","todays-obits.com","todoandroid.live","tonanmedia.my.id","topvideosgay.com","toramemoblog.com","torrentkitty.one","totallyfuzzy.net","totalsportek.app","toureiffel.paris","towsontigers.com","tptvencore.co.uk","tradersunion.com","travel.vebma.com","travelerdoor.com","trendytalker.com","troyyourlead.com","trucosonline.com","truetrophies.com","truevpnlover.com","tube-teen-18.com","tube.shegods.com","tuotromedico.com","turbogvideos.com","turboplayers.xyz","turtleviplay.xyz","tutorialsaya.com","tweakcentral.net","twobluescans.com","typinggames.zone","uconnhuskies.com","un-block-voe.net","unionpayintl.com","universegunz.net","unrealengine.com","upfiles-urls.com","urlgalleries.net","ustrendynews.com","uvmathletics.com","uwlathletics.com","vancouversun.com","vandaaginside.nl","vegamoviese.blog","veryfreeporn.com","vichitrainfo.com","videocdnal24.xyz","videodotados.com","videosection.com","vidstreaming.xyz","vikingf1le.us.to","villettt.kitchen","vinstartheme.com","viralvideotube.*","viralxxxporn.com","vivrebordeaux.fr","vodkapr3mium.com","voe-un-block.com","voiranime.stream","voyeurfrance.net","voyeurxxxsex.com","vpshostplans.com","vrporngalaxy.com","vzrosliedamy.com","watchanime.video","watchfreekav.com","watchfreexxx.net","watchmovierulz.*","watchmovies2.com","wearehunger.site","web.facebook.com","webcamsdolls.com","webcheats.com.br","webdesigndev.com","webdeyazilim.com","weblivehdplay.ru","webseriessex.com","websitesball.com","werkzeug-news.de","whentostream.com","whipperberry.com","whitexxxtube.com","wildpictures.net","windowsonarm.org","wolfgame-ar.site","womenreality.com","wonderfuldiy.com","woodmagazine.com","workxvacation.jp","worldhistory.org","wrestlinginc.com","wrzesnia.info.pl","wunderground.com","wvuathletics.com","www.amazon.co.jp","www.amazon.co.uk","www.facebook.com","xhamster-art.com","xhamsterporno.mx","xhamsterteen.com","xxxanimefuck.com","xxxlargeporn.com","xxxlesvianas.com","xxxretrofuck.com","xxxteenyporn.com","xxxvideos247.com","yellowbridge.com","yesjavplease.fun","yona-yethu.co.za","youngerporn.mobi","youtubetoany.com","youtubetowav.net","youwatch.monster","youwatchporn.com","ysokuhou.blog.jp","zdravenportal.eu","zecchino-doro.it","ziggogratis.site","ziminvestors.com","ziontutorial.com","zippyshare.cloud","zwergenstadt.com","123moviesonline.*","123strippoker.com","12thmanrising.com","1337x.unblocked.*","1337x.unblockit.*","19-days-manga.com","1movierulzhd.hair","1movierulzhd.wiki","1teentubeporn.com","2japaneseporn.com","365cincinnati.com","acapellas4u.co.uk","acdriftingpro.com","acrackstreams.com","adblockplustape.*","alaskananooks.com","allcelebspics.com","alternativeto.net","altyazitube22.lat","amandascookin.com","amateur-twink.com","amateurfapper.com","amateurs-fuck.com","amsmotoresllc.com","amybakesbread.com","ancient-origins.*","andhrafriends.com","andrewzimmern.com","androidonepro.com","androidpolice.com","animalwebcams.net","anime-torrent.com","animecenterbr.com","animeidhentai.com","animelatinohd.com","animeonline.ninja","animepornfilm.com","animesonlinecc.us","animexxxfilms.com","anonymousemail.me","apostoliclive.com","arabshentai.com>>","arcade.lemonde.fr","armypowerinfo.com","asianfucktube.com","asiansexcilps.com","assignmentdon.com","atalantini.online","atlasandboots.com","autoexpress.co.uk","babyjimaditya.com","badassoftcore.com","badgerofhonor.com","bafoeg-aktuell.de","bakedbyrachel.com","bandyforbundet.no","banglagolpo.co.in","bargainbriana.com","bcanotesnepal.com","beargoggleson.com","bebasbokep.online","beritasulteng.com","bestanime-xxx.com","besthdgayporn.com","besthugecocks.com","bestloanoffer.net","bestpussypics.net","beyondtheflag.com","bgmiupdate.com.in","bigdickwishes.com","bigtitsxxxsex.com","black-matures.com","blackhatworld.com","bladesalvador.com","blizzboygames.net","blog.linksfire.co","blog.textpage.xyz","blogcreativos.com","blogtruyenmoi.com","bollywoodchamp.in","bostoncommons.net","bracontece.com.br","bradleybraves.com","brazzersbabes.com","brindisireport.it","brokensilenze.net","brookethoughi.com","browncrossing.net","brushednickel.biz","butterbeready.com","cadryskitchen.com","calgaryherald.com","camchickscaps.com","cameronaggies.com","candyteenporn.com","catatanonline.com","cavalierstream.fr","cdn.gledaitv.live","celebritablog.com","charbelnemnom.com","chat.tchatche.com","cheat.hax4you.net","checkfiletype.com","chicksonright.com","cindyeyefinal.com","cinecalidad5.site","cinema-sketch.com","citethisforme.com","citpekalongan.com","ciudadblogger.com","claplivehdplay.ru","classicreload.com","clickjogos.com.br","closetcooking.com","cloudhostingz.com","coatingsworld.com","codingshiksha.com","coempregos.com.br","compota-soft.work","computercrack.com","computerfrage.net","computerhilfen.de","comunidadgzone.es","conferenceusa.com","consoletarget.com","cookieandkate.com","cookiewebplay.xyz","cookingclassy.com","cool-style.com.tw","coolmathgames.com","crichd-player.top","cruisingearth.com","cryptednews.space","cryptoblog24.info","cryptowidgets.net","crystalcomics.com","curiosidadtop.com","daemon-hentai.com","dailybulletin.com","dailydemocrat.com","dailyfreebits.com","dailygeekshow.com","dailytech-news.eu","damndelicious.net","darts-scoring.com","dawnofthedawg.com","dealsfinders.blog","dearcreatives.com","deine-tierwelt.de","deinesexfilme.com","dejongeturken.com","denverbroncos.com","descarga-animex.*","design4months.com","designtagebuch.de","desitelugusex.com","developer.arm.com","diamondfansub.com","diaridegirona.cat","diariocordoba.com","diencobacninh.com","dirtyindianporn.*","dl.apkmoddone.com","doctor-groups.com","dorohedoro.online","downloadapps.info","downloadtanku.org","downloadudemy.com","downloadwella.com","dynastyseries.com","dzienniklodzki.pl","e-hausaufgaben.de","earninginwork.com","easyjapanesee.com","easyvidplayer.com","easywithcode.tech","eatlittlebird.com","ebonyassclips.com","eczpastpapers.net","editions-actu.org","einfachtitten.com","elamigosgames.org","elamigosgamez.com","elamigosgamez.net","empire-streamz.fr","emulatorgames.net","encurtandourl.com","encurtareidog.top","engel-horoskop.de","enormousbabes.net","entertubeporn.com","epsilonakdemy.com","eromanga-show.com","estrepublicain.fr","eternalmangas.org","etownbluejays.com","euro2024direct.ru","eurotruck2.com.br","evolvingtable.com","extreme-board.com","extremotvplay.com","faceittracker.net","fansonlinehub.com","fantasticporn.net","fastconverter.net","fatgirlskinny.net","fattubevideos.net","femalefirst.co.uk","fgcuathletics.com","fightinghawks.com","file.magiclen.org","finanzas-vida.com","fineretroporn.com","finexxxvideos.com","finish.addurl.biz","fitnakedgirls.com","fitnessplanss.com","fitnesssguide.com","flight-report.com","floridagators.com","foguinhogames.net","footballstream.tv","footfetishvid.com","footstockings.com","fordownloader.com","formatlibrary.com","forum.blu-ray.com","fplstatistics.com","freeboytwinks.com","freecodezilla.net","freecourseweb.com","freemagazines.top","freeoseocheck.com","freepdf-books.com","freepornrocks.com","freepornstream.cc","freepornvideo.sex","freepornxxxhd.com","freerealvideo.com","freethesaurus.com","freex2line.online","freexxxvideos.pro","french-streams.cc","freshstuff4u.info","friendproject.net","frkn64modding.com","frosinonetoday.it","fuerzasarmadas.eu","fuldaerzeitung.de","fullfreeimage.com","fullxxxmovies.net","futbollibrehd.com","futbolsayfasi.net","galonamission.com","games-manuals.com","games.puzzler.com","games.thestar.com","gamesofdesire.com","gaminggorilla.com","gay-streaming.com","gaypornhdfree.com","gebrauchtwagen.at","gewinde-normen.de","gimmesomeoven.com","girlsofdesire.org","girlswallowed.com","globalstreams.xyz","gobigtitsporn.com","goblueraiders.com","godriveplayer.com","gogetapast.com.br","gogueducation.com","goltelevision.com","gothunderbirds.ca","grannyfuckxxx.com","grannyxxxtube.net","graphicgoogle.com","grsprotection.com","gwiazdatalkie.com","hakunamatata5.org","hallo-muenchen.de","happy-otalife.com","hardcoregamer.com","hbculifestyle.com","hdfilmizlesen.com","hdporn-movies.com","hdvintagetube.com","headlinerpost.com","healbot.dpm15.net","healthcheckup.com","hegreartnudes.com","help.cashctrl.com","hentaibrasil.info","hentaienglish.com","hentaitube.online","hideandseek.world","hikarinoakari.com","hollywoodlife.com","hostingunlock.com","hotkitchenbag.com","hotmaturetube.com","hotspringsofbc.ca","howtoconcepts.com","hunterscomics.com","iedprivatedqu.com","imageupscaler.com","imgdawgknuttz.com","imperialstudy.com","independent.co.uk","indianporn365.net","indofirmware.site","indojavstream.com","infinityscans.net","infinityscans.org","infinityscans.xyz","infinityskull.com","inside-digital.de","insidermonkey.com","instantcloud.site","insurancepost.xyz","ironwinter6m.shop","isabihowto.com.ng","isekaisubs.web.id","isminiunuttum.com","jamiesamewalk.com","janammusic.in.net","japaneseholes.com","japanpornclip.com","japanxxxmovie.com","japanxxxworld.com","jardiner-malin.fr","jokersportshd.org","juegos.elpais.com","justagirlblog.com","k-statesports.com","k-statesports.net","k-statesports.org","kandisvarlden.com","kenshi.fandom.com","kh-pokemon-mc.com","khabardinbhar.net","kickasstorrents.*","kill-the-hero.com","kimcilonlyofc.com","kiuruvesilehti.fi","know-how-tree.com","kontenterabox.com","kontrolkalemi.com","koreanbeauty.club","korogashi-san.org","kreis-anzeiger.de","kurierlubelski.pl","lachainemeteo.com","lacuevadeguns.com","laksa19.github.io","lavozdegalicia.es","lebois-racing.com","lectorhub.j5z.xyz","lecturisiarome.ro","leechpremium.link","leechyscripts.net","lespartisanes.com","lewblivehdplay.ru","lheritierblog.com","libertestreamvf.*","lifesambrosia.com","limontorrents.com","line-stickers.com","link.turkdown.com","linuxsecurity.com","lisatrialidea.com","locatedinfain.com","lonely-mature.com","lovegrowswild.com","lucagrassetti.com","luciferdonghua.in","luckypatchers.com","lycoathletics.com","madhentaitube.com","malaysiastock.biz","maps4study.com.br","marthastewart.com","mature-chicks.com","maturepussies.pro","mdzsmutpcvykb.net","media.cms.nova.cz","megajapantube.com","metaforespress.gr","mfmfinancials.com","miaminewtimes.com","milfpussy-sex.com","minecraftwild.com","mizugigurabia.com","mlbpark.donga.com","mlbstreaming.live","mmorpgplay.com.br","mobilanyheter.net","modelsxxxtube.com","modescanlator.net","mommyporntube.com","momstube-porn.com","moon-fm43w1qv.com","moon-kg83docx.com","moonblinkwifi.com","motorradfrage.net","motorradonline.de","moviediskhd.cloud","movielinkbd4u.com","moviezaddiction.*","mp3cristianos.net","mundovideoshd.com","murtonroofing.com","music.youtube.com","musicforchoir.com","muyinteresante.es","myabandonware.com","myair2.resmed.com","myfunkytravel.com","mynakedwife.video","nasdaqfutures.org","national-park.com","negative.tboys.ro","nepalieducate.com","networklovers.com","new-xxxvideos.com","nextchessmove.com","ngin-mobility.com","nightlifeporn.com","nikkan-gendai.com","nikkeifutures.org","njwildlifecam.com","nobodycancool.com","nonsensediamond.*","novelasligera.com","nzpocketguide.com","oceanof-games.com","oceanoffgames.com","odekake-spots.com","officedepot.co.cr","officialpanda.com","olemisssports.com","ondemandkorea.com","onepiecepower.com","onlinemschool.com","onlinesextube.com","onlineteenhub.com","ontariofarmer.com","openspeedtest.com","opensubtitles.com","oportaln10.com.br","osmanonline.co.uk","osthessen-news.de","ottawacitizen.com","ottrelease247.com","outdoorchannel.de","overwatchporn.xxx","pahaplayers.click","palmbeachpost.com","pandaznetwork.com","panel.skynode.pro","pantyhosepink.com","paramountplus.com","paraveronline.org","pghk.blogspot.com","phimlongtieng.net","phoenix-manga.com","phonefirmware.com","piazzagallura.org","pistonpowered.com","plantatreenow.com","play.aidungeon.io","player.glomex.com","playerflixapi.com","playerjavseen.com","playmyopinion.com","playporngames.com","pleated-jeans.com","pockettactics.com","popcornmovies.org","porn-sexypics.com","pornanimetube.com","porngirlstube.com","pornoenspanish.es","pornoschlange.com","pornxxxvideos.net","posturedirect.com","practicalkida.com","prague-blog.co.il","premiumporn.org>>","prensaesports.com","prescottenews.com","press-citizen.com","presstelegram.com","prettyprudent.com","primeanimesex.com","primeflix.website","progameguides.com","project-free-tv.*","projectfreetv.one","promisingapps.com","promo-visits.site","protege-liens.com","pubgaimassist.com","publicananker.com","publicdomainq.net","publicdomainr.net","publicflashing.me","pumpkinnspice.com","punisoku.blogo.jp","pussytorrents.org","qatarstreams.me>>","queenofmature.com","radiolovelive.com","radiosymphony.com","ragnarokmanga.com","randomarchive.com","rateyourmusic.com","rawindianporn.com","readallcomics.com","readcomiconline.*","readfireforce.com","realvoyeursex.com","reporterpb.com.br","reprezentacija.rs","retrosexfilms.com","reviewjournal.com","richieashbeck.com","robloxscripts.com","rojadirectatvhd.*","roms-download.com","roznamasiasat.com","rule34.paheal.net","sahlmarketing.net","samfordsports.com","sanangelolive.com","sanmiguellive.com","sarkarinaukry.com","savemoneyinfo.com","scandichotels.com","schoolsweek.co.uk","scontianastro.com","searchnsucceed.in","seasons-dlove.net","send-anywhere.com","series9movies.com","sevenjournals.com","sexmadeathome.com","sexyebonyteen.com","sexyfreepussy.com","shahiid-anime.net","share.filesh.site","shentai-anime.com","shinshi-manga.net","shittokuadult.net","shortencash.click","shrink-service.it","shugarysweets.com","sidearmsocial.com","sideplusleaks.com","sim-kichi.monster","simply-hentai.com","simplyrecipes.com","simplywhisked.com","simulatormods.com","sizyreelingly.com","skidrow-games.com","skillheadlines.in","skodacommunity.de","slaughtergays.com","smallseotools.com","soccerworldcup.me","softwaresblue.com","south-park-tv.biz","spectrum.ieee.org","speculationis.com","spedostream2.shop","spiritparting.com","sponsorhunter.com","sportanalytic.com","sportingsurge.com","sportlerfrage.net","sportsbuff.stream","sportsgames.today","sportzonline.site","stapadblockuser.*","starxinvestor.com","stellarthread.com","stepsisterfuck.me","storefront.com.ng","stories.los40.com","straatosphere.com","streamadblocker.*","streamcaster.live","streaming-one.com","streamingunity.to","streamlivetv.site","streamonsport99.*","streamseeds24.com","streamshunters.eu","stringreveals.com","suanoticia.online","substitutefor.com","super-ethanol.com","susanhavekeep.com","tabele-kalorii.pl","tamaratattles.com","tamilbrahmins.com","tamilsexstory.net","tattoosbeauty.com","tautasdziesmas.lv","techadvisor.co.uk","techconnection.in","techiepirates.com","techlog.ta-yan.ai","technewsrooms.com","technewsworld.com","techsolveprac.com","teenpornvideo.sex","teenpornvideo.xxx","testlanguages.com","texture-packs.com","thaihotmodels.com","thangdangblog.com","theandroidpro.com","thebazaarzone.com","thecelticblog.com","thecubexguide.com","thedailybeast.com","thedigitalfix.com","thefreebieguy.com","thegamearcade.com","thehealthsite.com","theismailiusa.org","thekingavatar.com","theliveupdate.com","theouterhaven.net","theregister.co.uk","thermoprzepisy.pl","thesprucepets.com","thewoksoflife.com","theworldobits.com","thousandbabes.com","tichyseinblick.de","tiktokcounter.net","timesnowhindi.com","tiroalpaloweb.xyz","titfuckvideos.com","tmail.sys64738.at","tomatespodres.com","toplickevesti.com","topsworldnews.com","torrent-pirat.com","torrentdownload.*","tradingfact4u.com","trannylibrary.com","trannyxxxtube.net","truyen-hentai.com","truyenaudiocv.net","tubepornasian.com","tubepornstock.com","tutorialspots.com","ultimate-catch.eu","ultrateenporn.com","umatechnology.org","unsere-helden.com","uptechnologys.com","urjalansanomat.fi","url.gem-flash.com","urochsunloath.com","utepathletics.com","v-o-e-unblock.com","valeronevijao.com","vanillatweaks.net","venusarchives.com","vide-greniers.org","video.gazzetta.it","videogameszone.de","videos.remilf.com","vietnamanswer.com","viralitytoday.com","virtualnights.com","visualnewshub.com","vitalitygames.com","voiceofdenton.com","voyeurpornsex.com","voyeurspyporn.com","voyeurxxxfree.com","wannafreeporn.com","watchanimesub.net","watchfacebook.com","watchsouthpark.tv","websiteglowgh.com","weknowconquer.com","welcometojapan.jp","wellness4live.com","wellnessbykay.com","wirralglobe.co.uk","wirtualnemedia.pl","wohnmobilforum.de","workweeklunch.com","worldfreeware.com","worldgreynews.com","worthitorwoke.com","wpsimplehacks.com","wutheringwaves.gg","xfreepornsite.com","xhamsterdeutsch.*","xnxx-sexfilme.com","xxxonlinefree.com","xxxpussyclips.com","xxxvideostrue.com","yesdownloader.com","yongfucknaked.com","yourcupofcake.com","yummysextubes.com","zeenews.india.com","zeijakunahiko.com","zeroto60times.com","zippysharecue.com","1001tracklists.com","101soundboards.com","10minuteemails.com","123moviesready.org","123moviestoday.net","1337x.unblock2.xyz","247footballnow.com","7daystodiemods.com","adblockeronstape.*","addictinggames.com","adultasianporn.com","advertisertape.com","afasiaarchzine.com","airportwebcams.net","akuebresources.com","allureamateurs.net","alternativa104.net","amateur-mature.net","anarchy-stream.com","angrybirdsnest.com","animesonliner4.com","anothergraphic.org","antenasport.online","arcade.buzzrtv.com","arcadeprehacks.com","arkadiumhosted.com","arsiv.mackolik.com","asian-teen-sex.com","asianbabestube.com","asianpornfilms.com","asiansexdiarys.com","asianstubefuck.com","atlasstudiousa.com","autocadcommand.com","backforseconds.com","badasshardcore.com","baixedetudo.net.br","bakeitwithlove.com","ballexclusives.com","barstoolsports.com","basic-tutorials.de","bdsmslavemovie.com","beamng.wesupply.cx","bearchasingart.com","beermoneyforum.com","beginningmanga.com","berliner-kurier.de","beruhmtemedien.com","best-xxxvideos.com","bestialitytaboo.tv","bettingexchange.it","bidouillesikea.com","bigdata-social.com","bigdata.rawlazy.si","bigpiecreative.com","bigsouthsports.com","bigtitsxxxfree.com","birdsandblooms.com","blisseyhusband.net","blogredmachine.com","blogx.almontsf.com","blowjobamateur.net","blowjobpornset.com","bluecoreinside.com","bluemediastorage.*","bombshellbling.com","bonsaiprolink.shop","bosoxinjection.com","browneyedbaker.com","businessinsider.de","campsitephotos.com","camwhorescloud.com","cararegistrasi.com","casos-aislados.com","cdimg.blog.2nt.com","cehennemstream.xyz","cerbahealthcare.it","chiangraitimes.com","chicagobearshq.com","chicagobullshq.com","chicasdesnudas.xxx","chikianimation.org","choiceappstore.xyz","cintateknologi.com","clampschoolholic.*","classicalradio.com","classicxmovies.com","clothing-mania.com","codingnepalweb.com","coleccionmovie.com","comicspornoxxx.com","comparepolicyy.com","comparteunclic.com","contractpharma.com","couponscorpion.com","cr7-soccer.store>>","creditcardrush.com","crimsonscrolls.net","cronachesalerno.it","cryptonworld.space","dallasobserver.com","dcdirtylaundry.com","dcworldscollide.gg","denverpioneers.com","depressionhurts.us","descargaspcpro.net","desifuckonline.com","deutschekanale.com","devicediary.online","diariodenavarra.es","digicol.dpm.org.cn","dinneratthezoo.com","dirtyasiantube.com","dirtygangbangs.com","discover-sharm.com","diyphotography.net","diyprojectslab.com","donaldlineelse.com","donghuanosekai.com","doublemindtech.com","downloadcursos.top","downloadgames.info","downloadmusic.info","downloadpirate.com","dragonball-zxk.com","dulichkhanhhoa.net","e-mountainbike.com","elamigos-games.com","elamigos-games.net","elconfidencial.com","elearning-cpge.com","embed-player.space","empire-streaming.*","english-dubbed.com","english-topics.com","erikcoldperson.com","evdeingilizcem.com","eveningtimes.co.uk","exactlyhowlong.com","expressbydgoski.pl","extremosports.club","familyhandyman.com","feastingathome.com","feelgoodfoodie.net","fightingillini.com","filmizlehdfilm.com","financenova.online","financialjuice.com","flacdownloader.com","flashgirlgames.com","flashingjungle.com","foodiesgallery.com","foreversparkly.com","forkknifeswoon.com","formasyonhaber.net","forum.cstalking.tv","francaisfacile.net","free-gay-clips.com","freeadultcomix.com","freeadultvideos.cc","freebiesmockup.com","freecoursesite.com","freefireupdate.com","freegogpcgames.com","freegrannyvids.com","freemockupzone.com","freemoviesfull.com","freepornasians.com","freepublicporn.com","freereceivesms.com","freeviewmovies.com","freevipservers.net","freevstplugins.net","freewoodworking.ca","freex2line.onlinex","freshwaterdell.com","friscofighters.com","fritidsmarkedet.dk","fuckhairygirls.com","fuckingsession.com","galinhasamurai.com","gamerevolution.com","games.arkadium.com","games.kentucky.com","games.mashable.com","games.thestate.com","gamingforecast.com","gaypornmasters.com","gazetakrakowska.pl","gazetazachodnia.eu","gdrivelatinohd.net","geniale-tricks.com","geniussolutions.co","girlsgogames.co.uk","go.bucketforms.com","goafricaonline.com","gobankingrates.com","gocurrycracker.com","godrakebulldog.com","gojapaneseporn.com","golf.rapidmice.com","gorro-4go5b3nj.fun","gorro-9mqnb7j2.fun","gorro-chfzoaas.fun","gorro-ry0ziftc.fun","grouppornotube.com","gruenderlexikon.de","gudangfirmwere.com","hamptonpirates.com","hard-tube-porn.com","healthfirstweb.com","healthnewsreel.com","healthy4pepole.com","heatherdisarro.com","hentaipornpics.net","hentaisexfilms.com","heraldscotland.com","hiddencamstube.com","highkeyfinance.com","hindustantimes.com","homeairquality.org","homemoviestube.com","hotanimevideos.com","hotbabeswanted.com","hotxxxjapanese.com","housingaforest.com","hqamateurtubes.com","huffingtonpost.com","huitranslation.com","humanbenchmark.com","hungrypaprikas.com","hyundaitucson.info","iamhomesteader.com","idedroidsafelink.*","idevicecentral.com","ifreemagazines.com","ikingfile.mooo.com","ilcamminodiluce.it","imagetranslator.io","indecentvideos.com","indesignskills.com","indianbestporn.com","indianpornvideos.*","indiansexbazar.com","indiasmagazine.com","infamous-scans.com","infinitehentai.com","infinityblogger.in","infojabarloker.com","informatudo.com.br","informaxonline.com","insidemarketing.it","insidememorial.com","insider-gaming.com","insurancesfact.com","intercelestial.com","investor-verlag.de","iowaconference.com","italianporn.com.es","ithinkilikeyou.net","iusedtobeaboss.com","jacksonguitars.com","jamessoundcost.com","japanesemomsex.com","japanesetube.video","jasminetesttry.com","jemontremabite.com","jeux.meteocity.com","johnalwayssame.com","jojolandsmanga.com","joomlabeginner.com","jujustu-kaisen.com","justfamilyporn.com","justpicsplease.com","justtoysnoboys.com","kawaguchimaeda.com","kdramasmaza.com.pk","kellywhatcould.com","keralatelecom.info","kickasstorrents2.*","kirbiecravings.com","kittyfuckstube.com","knowyourphrase.com","kobitacocktail.com","komisanwamanga.com","kr-weathernews.com","krebs-horoskop.com","kstatefootball.net","kstatefootball.org","laopinioncoruna.es","leagueofgraphs.com","leckerschmecker.me","leo-horoscopes.com","letribunaldunet.fr","leviathanmanga.com","levismodding.co.uk","lib.hatenablog.com","lightnovelspot.com","link.paid4link.com","linkedmoviehub.top","linux-community.de","listenonrepeat.com","literarysomnia.com","littlebigsnake.com","liveandletsfly.com","localemagazine.com","longbeachstate.com","lotus-tours.com.hk","loyolaramblers.com","lukecomparetwo.com","luzernerzeitung.ch","m.timesofindia.com","maggotdrowning.com","magicgameworld.com","makeincomeinfo.com","maketecheasier.com","makotoichikawa.net","mallorcazeitung.es","manager-magazin.de","mangas-origines.fr","manoramaonline.com","maraudersports.com","marvelsnapzone.com","maturetubehere.com","maturexxxclips.com","mctechsolutions.in","mediascelebres.com","megafilmeshd50.com","megahentaitube.com","megapornfreehd.com","mein-wahres-ich.de","memorialnotice.com","merlininkazani.com","mespornogratis.com","mesquitaonline.com","minddesignclub.org","minhasdelicias.com","mobilelegends.shop","mobiletvshows.site","modele-facture.com","moflix-stream.fans","momdoesreviews.com","montereyherald.com","motorcyclenews.com","moviescounnter.com","moviesonlinefree.*","mygardening411.com","myhentaicomics.com","mymusicreviews.com","myneobuxportal.com","mypornstarbook.net","nadidetarifler.com","naijachoice.com.ng","nakedgirlsroom.com","nakedneighbour.com","nauci-engleski.com","nauci-njemacki.com","netaffiliation.com","neueroeffnung.info","nevadawolfpack.com","newjapanesexxx.com","news-geinou100.com","newyorkupstate.com","nicematureporn.com","niestatystyczny.pl","nightdreambabe.com","noodlemagazine.com","nourishedbynic.com","novacodeportal.xyz","nudebeachpussy.com","nudecelebforum.com","nuevos-mu.ucoz.com","nyharborwebcam.com","o2tvseries.website","oceanbreezenyc.org","officegamespot.com","ogrenciyegelir.com","omnicalculator.com","onepunch-manga.com","onetimethrough.com","onlinesudoku.games","onlinetutorium.com","onlinework4all.com","onlygoldmovies.com","onscreensvideo.com","pakistaniporn2.com","pancakerecipes.com","passportaction.com","pc-spiele-wiese.de","pcgamedownload.net","pcgameshardware.de","peachprintable.com","peliculas-dvdrip.*","penisbuyutucum.net","pennbookcenter.com","pestleanalysis.com","pinayviralsexx.com","plainasianporn.com","play.starsites.fun","play.watch20.space","player.euroxxx.net","playeriframe.lol>>","playretrogames.com","pliroforiki-edu.gr","policesecurity.com","policiesreview.com","pornhubdeutsch.net","pornmaturetube.com","pornohubonline.com","pornovideos-hd.com","pornvideospass.com","powerthesaurus.org","premiumstream.live","present.rssing.com","printablecrush.com","problogbooster.com","productkeysite.com","projectfreetv2.com","projuktirkotha.com","proverbmeaning.com","psicotestuned.info","pussytubeebony.com","racedepartment.com","radio-en-direct.fr","radioitalylive.com","radionorthpole.com","ratemyteachers.com","realfreelancer.com","realtormontreal.ca","recherche-ebook.fr","redamateurtube.com","redbubbletools.com","redstormsports.com","replica-watch.info","reporterherald.com","rightdark-scan.com","rincondelsazon.com","ripcityproject.com","risefromrubble.com","romaniataramea.com","runtothefinish.com","ryanagoinvolve.com","sabornutritivo.com","samanarthishabd.in","samrudhiglobal.com","samurai.rzword.xyz","sandrataxeight.com","sankakucomplex.com","sattakingcharts.in","scarletandgame.com","scarletknights.com","schoener-wohnen.de","sciencechannel.com","scopateitaliane.it","seamanmemories.com","selfstudybrain.com","sethniceletter.com","sexiestpicture.com","sexteenxxxtube.com","sexy-youtubers.com","sexykittenporn.com","sexymilfsearch.com","shadowrangers.live","shemaletoonsex.com","shipseducation.com","shrivardhantech.in","shutupandgo.travel","sidelionreport.com","siirtolayhaber.com","simpledownload.net","siteunblocked.info","slowianietworza.pl","smithsonianmag.com","soccerstream100.to","sociallyindian.com","softwaredetail.com","sosyalbilgiler.net","southernliving.com","southparkstudios.*","spank-and-bang.com","sportstohfa.online","stapewithadblock.*","stream.nflbox.me>>","streamelements.com","streaming-french.*","strtapeadblocker.*","surgicaltechie.com","sweeteroticart.com","syracusecrunch.com","talkforfitness.com","tamilultratv.co.in","tapeadsenjoyer.com","tcpermaculture.com","teachpreschool.org","technicalviral.com","telefullenvivo.com","telexplorer.com.ar","theblissempire.com","theendlessmeal.com","thefirearmblog.com","thehentaiworld.com","thelesbianporn.com","thepewterplank.com","thepiratebay10.org","theralphretort.com","thestarphoenix.com","thesuperdownload.*","thiagorossi.com.br","thisisourbliss.com","tiervermittlung.de","tiktokrealtime.com","times-standard.com","tiny-sparklies.com","tips-and-tricks.co","tokyo-ghoul.online","tonpornodujour.com","topbiography.co.in","torrentdosfilmes.*","torrentdownloads.*","totalsportekhd.com","traductionjeux.com","trannysexmpegs.com","transgirlslive.com","traveldesearch.com","travelplanspro.com","trendyol-milla.com","tribeathletics.com","trovapromozioni.it","truckingboards.com","truyenbanquyen.com","truyenhentai18.net","tuhentaionline.com","tulsahurricane.com","turboimagehost.com","tv3play.skaties.lv","tvonlinesports.com","tweaksforgeeks.com","txstatebobcats.com","u-createcrafts.com","ucirvinesports.com","ukrainesmodels.com","uncensoredleak.com","universfreebox.com","unlimitedfiles.xyz","urbanmilwaukee.com","urlaubspartner.net","venus-and-mars.com","vermangasporno.com","verywellhealth.com","victor-mochere.com","videos.porndig.com","videosinlevels.com","videosxxxputas.com","vintagepornfun.com","vintagepornnew.com","vintagesexpass.com","waitrosecellar.com","washingtonpost.com","watch.rkplayer.xyz","watch.shout-tv.com","watchadsontape.com","weakstreams.online","weatherzone.com.au","web.livecricket.is","webloadedmovie.com","websitesbridge.com","werra-rundschau.de","wheatbellyblog.com","wifemamafoodie.com","wildhentaitube.com","windowsmatters.com","winteriscoming.net","wohnungsboerse.net","woman.excite.co.jp","worldstreams.click","wormser-zeitung.de","www.apkmoddone.com","www.cloudflare.com","www.primevideo.com","xbox360torrent.com","xda-developers.com","xn--kckzb2722b.com","xpressarticles.com","xxx-asian-tube.com","xxxanimemovies.com","xxxanimevideos.com","yify-subtitles.org","yodelswartlike.com","youngpussyfuck.com","youwatch-serie.com","yt-downloaderz.com","ytmp4converter.com","znanemediablog.com","zxi.mytechroad.com","aachener-zeitung.de","abukabir.fawrye.com","abyssplay.pages.dev","academiadelmotor.es","adblockstreamtape.*","addtobucketlist.com","adrino1.bonloan.xyz","adultgamesworld.com","agrigentonotizie.it","ai.tempatwisata.pro","aliendictionary.com","allafricangirls.net","allindiaroundup.com","allporncartoons.com","alludemycourses.com","almohtarif-tech.net","altadefinizione01.*","amateur-couples.com","amaturehomeporn.com","amazingtrannies.com","androidrepublic.org","angeloyeo.github.io","animefuckmovies.com","animeonlinefree.org","animesonlineshd.com","annoncesescorts.com","anonymous-links.com","anonymousceviri.com","app.link2unlock.com","app.studysmarter.de","aprenderquechua.com","arabianbusiness.com","arizonawildcats.com","arnaqueinternet.com","arrowheadaddict.com","artificialnudes.com","asiananimaltube.org","asianfuckmovies.com","asianporntube69.com","audiobooks4soul.com","audiotruyenfull.com","awellstyledlife.com","bailbondsfinder.com","baltimoreravens.com","beautypackaging.com","beisbolinvernal.com","berliner-zeitung.de","bestmaturewomen.com","bethshouldercan.com","bible-knowledge.com","bigcockfreetube.com","bigsouthnetwork.com","blackenterprise.com","blog.cloudflare.com","blog.itijobalert.in","blog.potterworld.co","bluemediadownload.*","bordertelegraph.com","brighteyedbaker.com","brucevotewithin.com","businessinsider.com","calculascendant.com","cambrevenements.com","cancelguider.online","celebritynakeds.com","celebsnudeworld.com","certificateland.com","chakrirkhabar247.in","championpeoples.com","chawomenshockey.com","chicagosportshq.com","christiantrendy.com","chubbypornmpegs.com","citationmachine.net","civilenggforall.com","classicpornbest.com","classicpornvids.com","classyyettrendy.com","collegeteentube.com","columbiacougars.com","comicsxxxgratis.com","commande.rhinov.pro","commsbusiness.co.uk","comofuncionaque.com","compilationtube.xyz","comprovendolibri.it","concealednation.org","consigliatodanoi.it","couponsuniverse.com","crackedsoftware.biz","cravesandflames.com","creativebusybee.com","crossdresserhub.com","crystal-launcher.pl","curbsideclassic.com","custommapposter.com","daddyfuckmovies.com","daddylivestream.com","dailymaverick.co.za","daisiesandpie.co.uk","dartmouthsports.com","der-betze-brennt.de","descargaranimes.com","descargatepelis.com","deseneledublate.com","desktopsolution.org","detroitjockcity.com","dev.fingerprint.com","developerinsider.co","diariodemallorca.es","diarioeducacion.com","dichvureviewmap.com","diendancauduong.com","digitalfernsehen.de","digitalseoninja.com","digitalstudiome.com","dignityobituary.com","discordfastfood.com","divinelifestyle.com","divxfilmeonline.net","dktechnicalmate.com","download.megaup.net","driveteslacanada.ca","dubipc.blogspot.com","dynamicminister.net","dziennikbaltycki.pl","dziennikpolski24.pl","dziennikzachodni.pl","earn.quotesopia.com","edmontonjournal.com","elamigosedition.com","ellibrepensador.com","embed.nana2play.com","en-thunderscans.com","en.financerites.com","erotic-beauties.com","eventiavversinews.*","expresskaszubski.pl","fansubseries.com.br","fatblackmatures.com","faucetcaptcha.co.in","felicetommasino.com","femdomporntubes.com","fifaultimateteam.it","filmeonline2018.net","filmesonlinehd1.org","firstasianpussy.com","footballfancast.com","footballstreams.lol","footballtransfer.ru","fortnitetracker.com","forum-pokemon-go.fr","foxeslovelemons.com","foxvalleyfoodie.com","fplstatistics.co.uk","franceprefecture.fr","free-trannyporn.com","freecoursesites.com","freecoursesonline.*","freegamescasual.com","freeindianporn.mobi","freeindianporn2.com","freeplayervideo.com","freescorespiano.com","freesexvideos24.com","freetarotonline.com","freshsexxvideos.com","frustfrei-lernen.de","fuckmonstercock.com","fuckslutsonline.com","futura-sciences.com","gagaltotal666.my.id","gallant-matures.com","gamecocksonline.com","games.bradenton.com","games.fresnobee.com","games.heraldsun.com","games.sunherald.com","garnishandglaze.com","gazetawroclawska.pl","generacionretro.net","gesund-vital.online","gfilex.blogspot.com","global.novelpia.com","gloswielkopolski.pl","go-for-it-wgt1a.fun","goarmywestpoint.com","godrakebulldogs.com","godrakebulldogs.net","goodnewsnetwork.org","hailfloridahail.com","hamburgerinsult.com","hardcorelesbian.xyz","hardwarezone.com.sg","hardwoodhoudini.com","hartvannederland.nl","haus-garten-test.de","haveyaseenjapan.com","hawaiiathletics.com","hayamimi-gunpla.com","healthbeautybee.com","helpnetsecurity.com","hentai-mega-mix.com","hentaianimezone.com","hentaisexuality.com","hieunguyenphoto.com","highdefdiscnews.com","hindimatrashabd.com","hindimearticles.net","hindimoviesonline.*","historicaerials.com","hmc-id.blogspot.com","hobby-machinist.com","home-xxx-videos.com","hoosierhomemade.com","horseshoeheroes.com","hostingdetailer.com","hotbeautyhealth.com","hotorientalporn.com","hqhardcoreporno.com","hummingbirdhigh.com","ilbolerodiravel.org","ilforumdeibrutti.is","indianpornvideo.org","individualogist.com","ingyenszexvideok.hu","insidertracking.com","insidetheiggles.com","interculturalita.it","inventionsdaily.com","iptvxtreamcodes.com","itsecuritynews.info","iulive.blogspot.com","jacquieetmichel.net","japanesexxxporn.com","javuncensored.watch","jayservicestuff.com","joguinhosgratis.com","joyfoodsunshine.com","justcastingporn.com","justonecookbook.com","justsexpictures.com","k-statefootball.net","k-statefootball.org","keeperofthehome.org","kentstatesports.com","kenzo-flowertag.com","kingjamesgospel.com","kissmaturestube.com","klettern-magazin.de","kstateathletics.com","ladypopularblog.com","lawweekcolorado.com","learnchannel-tv.com","learnmarketinfo.com","legionpeliculas.org","legionprogramas.org","leitesculinaria.com","lemino.docomo.ne.jp","letrasgratis.com.ar","lifeisbeautiful.com","limiteddollqjc.shop","livingstondaily.com","localizaagencia.com","lorimuchbenefit.com","love-stoorey210.net","m.jobinmeghalaya.in","makeitdairyfree.com","marketrevolution.eu","masashi-blog418.com","massagefreetube.com","maturepornphoto.com","measuringflower.com","mediatn.cms.nova.cz","meeting.tencent.com","megajapanesesex.com","meicho.marcsimz.com","melskitchencafe.com","merriam-webster.com","miamiairportcam.com","miamibeachradio.com","migliori-escort.com","mikaylaarealike.com","mindmotion93y8.shop","minecraft-forum.net","minecraftraffle.com","minhaconexao.com.br","minimalistbaker.com","mittelbayerische.de","mobilesexgamesx.com","morinaga-office.net","motherandbaby.co.uk","movies-watch.com.pk","mynaturalfamily.com","myreadingmanga.info","natashaskitchen.com","neo.usachannel.info","nepaljobvacancy.com","noticiascripto.site","novelmultiverse.com","nude-beach-tube.com","nudeselfiespics.com","nurparatodos.com.ar","obituaryupdates.com","oldgrannylovers.com","onlinefetishporn.cc","onlinepornushka.com","opisanie-kartin.com","orangespotlight.com","outdoor-magazin.com","painting-planet.com","parasportontario.ca","parrocchiapalata.it","paulkitchendark.com","peopleenespanol.com","perfectmomsporn.com","personalityclub.com","petitegirlsnude.com","pharmaguideline.com","phoenixnewtimes.com","phonereviewinfo.com","picspornamateur.com","platform.autods.com","play.dictionary.com","play.geforcenow.com","play.mylifetime.com","play.playkrx18.site","player.popfun.co.uk","player.uwatchfree.*","pompanobeachcam.com","popularasianxxx.com","pornjapanesesex.com","pornocolegialas.org","pornocolombiano.net","pornstarsadvice.com","portmiamiwebcam.com","porttampawebcam.com","pranarevitalize.com","protege-torrent.com","psychology-spot.com","publicidadtulua.com","quest.to-travel.net","raccontivietati.com","radiosantaclaus.com","radiotormentamx.com","rawofficethumbs.com","readcomicsonline.ru","realitybrazzers.com","redowlanalytics.com","relampagomovies.com","reneweconomy.com.au","richardsignfish.com","richmondspiders.com","ripplestream4u.shop","roberteachfinal.com","rojadirectaenhd.net","rojadirectatvlive.*","rollingglobe.online","romanticlesbian.com","rundschau-online.de","ryanmoore.marketing","rysafe.blogspot.com","samurai.wordoco.com","santoinferninho.com","savingsomegreen.com","scansatlanticos.com","scholarshiplist.org","schrauben-normen.de","secondhandsongs.com","sempredirebanzai.it","sempreupdate.com.br","serieshdpormega.com","seriezloaded.com.ng","setsuyakutoushi.com","sex-free-movies.com","sexyvintageporn.com","shogaisha-shuro.com","shogaisha-techo.com","sixsistersstuff.com","skidrowreloaded.com","smartkhabrinews.com","soap2day-online.com","soccerfullmatch.com","soccerworldcup.me>>","sociologicamente.it","somulhergostosa.com","sourcingjournal.com","sousou-no-frieren.*","sportitalialive.com","sportzonline.site>>","spotidownloader.com","ssdownloader.online","standardmedia.co.ke","stealthoptional.com","stevenuniverse.best","stormininnorman.com","storynavigation.com","stoutbluedevils.com","stream.offidocs.com","stream.pkayprek.com","streamadblockplus.*","streamshunters.eu>>","streamtapeadblock.*","stylegirlfriend.com","submissive-wife.net","summarynetworks.com","sussexexpress.co.uk","sweetadult-tube.com","tainio-mania.online","tamilfreemp3songs.*","tapewithadblock.org","teachersupdates.net","technicalline.store","techtrendmakers.com","tekniikanmaailma.fi","telecharger-igli4.*","theberserkmanga.com","thecrazytourist.com","thefoodieaffair.com","theglobeandmail.com","themehospital.co.uk","theoaklandpress.com","therecipecritic.com","thesimsresource.com","thesmokingcuban.com","thewatchseries.live","throwsmallstone.com","timesnowmarathi.com","tiz-cycling-live.io","tophentaicomics.com","toptenknowledge.com","totalfuckmovies.com","totalmaturefuck.com","transexuales.gratis","trendsderzukunft.de","tubepornclassic.com","tubevintageporn.com","turkishseriestv.net","turtleboysports.com","tutorialsduniya.com","tw-hkt.blogspot.com","ukmagazinesfree.com","uktvplay.uktv.co.uk","ultimate-guitar.com","usinger-anzeiger.de","utahstateaggies.com","valleyofthesuns.com","veryfastdownload.pw","viewmyknowledge.com","vinylcollective.com","virtual-youtuber.jp","virtualdinerbot.com","vitadacelebrita.com","voetbalrotterdam.nl","wallpaperaccess.com","watch-movies.com.pk","watchlostonline.net","watchmonkonline.com","watchmoviesrulz.com","watchonlinemovie.pk","webhostingoffer.org","weristdeinfreund.de","whatjewwannaeat.com","windows-7-forum.net","winit.heatworld.com","woffordterriers.com","worldaffairinfo.com","worldstarhiphop.com","worldtravelling.com","www2.tmyinsight.net","xhamsterdeutsch.xyz","xn--nbkw38mlu2a.com","xnxx-downloader.net","xnxx-sex-videos.com","xxxhentaimovies.com","xxxpussysextube.com","xxxsexyjapanese.com","yaoimangaonline.com","yellowblissroad.com","yorkshirepost.co.uk","your-daily-girl.com","youramateurporn.com","youramateurtube.com","yourlifeupdated.net","youtubedownloader.*","zeeplayer.pages.dev","25yearslatersite.com","27-sidefire-blog.com","2adultflashgames.com","acienciasgalilei.com","adult-sex-gamess.com","adultdvdparadise.com","advertisingexcel.com","akatsuki-no-yona.com","allcelebritywiki.com","allcivilstandard.com","allnewindianporn.com","aman-dn.blogspot.com","amateurebonypics.com","amateuryoungpics.com","analysis-chess.io.vn","androidapkmodpro.com","androidheadlines.com","androidtunado.com.br","angolopsicologia.com","animalextremesex.com","apenasmaisumyaoi.com","aquiyahorajuegos.net","aroundthefoghorn.com","aspdotnet-suresh.com","ayobelajarbareng.com","badassdownloader.com","bailiwickexpress.com","banglachotigolpo.xyz","best-mobilegames.com","bestmp3converter.com","bestshemaleclips.com","bigtitsporn-tube.com","blackwoodacademy.org","bloggingawaydebt.com","bloggingguidance.com","boainformacao.com.br","bogowieslowianscy.pl","bollywoodshaadis.com","bouamra.blogspot.com","boxofficebusiness.in","br.nacaodamusica.com","browardpalmbeach.com","brr-69xwmut5-moo.com","bustyshemaleporn.com","cachevalleydaily.com","canberratimes.com.au","cartoonstvonline.com","cartoonvideos247.com","centralboyssp.com.br","chasingthedonkey.com","chef-in-training.com","cienagamagdalena.com","climbingtalshill.com","comandotorrenthd.org","crackstreamsfree.com","crackstreamshd.click","craigretailers.co.uk","creators.nafezly.com","dailydishrecipes.com","dailygrindonline.net","dairylandexpress.com","davidsonbuilders.com","dcdlplayer8a06f4.xyz","decorativemodels.com","defienietlynotme.com","deliciousmagazine.pl","demonyslowianskie.pl","denisegrowthwide.com","descargaseriestv.com","digitalmusicnews.com","diglink.blogspot.com","divxfilmeonline.tv>>","djsofchhattisgarh.in","donna-cerca-uomo.com","downloadfilm.website","durhamopenhouses.com","ear-phone-review.com","earnfromarticles.com","edivaldobrito.com.br","educationbluesky.com","embed.hideiframe.com","encuentratutarea.com","eroticteensphoto.net","escort-in-italia.com","essen-und-trinken.de","eurostreaming.casino","extremereportbot.com","fairforexbrokers.com","famosas-desnudas.org","fastpeoplesearch.com","favfamilyrecipes.com","filmeserialegratis.*","filmpornofrancais.fr","finanznachrichten.de","finding-camellia.com","fle-2ggdmu8q-moo.com","fle-5r8dchma-moo.com","fle-rvd0i9o8-moo.com","foodfaithfitness.com","footballandress.club","foreverconscious.com","forexwikitrading.com","forge.plebmasters.de","forobasketcatala.com","forum.lolesporte.com","forum.thresholdx.net","fotbolltransfers.com","fr.streamon-sport.ru","free-sms-receive.com","freebigboobsporn.com","freecoursesonline.me","freelistenonline.com","freemagazinespdf.com","freemedicalbooks.org","freepatternsarea.com","freereadnovel.online","freeromsdownload.com","freestreams-live.*>>","freethailottery.live","freshshemaleporn.com","fullywatchonline.com","funeral-memorial.com","gaget.hatenablog.com","games.abqjournal.com","games.dallasnews.com","games.denverpost.com","games.kansascity.com","games.sixtyandme.com","games.wordgenius.com","gametechreviewer.com","gearingcommander.com","gesundheitsfrage.net","getfreesmsnumber.com","ghajini-04bl9y7x.lol","ghajini-1fef5bqn.lol","ghajini-1flc3i96.lol","ghajini-4urg44yg.lol","ghajini-8nz2lav9.lol","ghajini-9b3wxqbu.lol","ghajini-emtftw1o.lol","ghajini-jadxelkw.lol","ghajini-vf70yty6.lol","ghajini-y9yq0v8t.lol","giuseppegravante.com","giveawayoftheday.com","givemenbastreams.com","googledrivelinks.com","gourmetsupremacy.com","greatestshemales.com","greensnchocolate.com","griffinathletics.com","hackingwithreact.com","hds-streaming-hd.com","headlinepolitics.com","heartofvicksburg.com","heartrainbowblog.com","heresyoursavings.com","highheelstrample.com","historichorizons.com","hodgepodgehippie.com","hofheimer-zeitung.de","home-made-videos.com","homestratosphere.com","hornyconfessions.com","hostingreviews24.com","hotasianpussysex.com","hotjapaneseshows.com","huffingtonpost.co.uk","hypelifemagazine.com","ibreatheimhungry.com","immobilienscout24.de","india.marathinewz.in","inkworldmagazine.com","intereseducation.com","investnewsbrazil.com","irresistiblepets.net","italiadascoprire.net","jemontremonminou.com","juliescafebakery.com","k-stateathletics.com","kachelmannwetter.com","karaoke4download.com","karaokegratis.com.ar","keedabankingnews.com","lacronicabadajoz.com","laopiniondemalaga.es","laopiniondemurcia.es","laopiniondezamora.es","largescaleforums.com","latinatemptation.com","laweducationinfo.com","lazytranslations.com","learn.moderngyan.com","lemonsqueezyhome.com","lempaala.ideapark.fi","lesbianvideotube.com","letemsvetemapplem.eu","letsworkremotely.com","link.djbassking.live","linksdegrupos.com.br","live-tv-channels.org","liveforlivemusic.com","loan.bgmi32bitapk.in","loan.punjabworks.com","loriwithinfamily.com","luxurydreamhomes.net","makemoneywithurl.com","mangcapquangvnpt.com","maturepornjungle.com","maturewomenfucks.com","mauiinvitational.com","maxfinishseveral.com","medicalstudyzone.com","mein-kummerkasten.de","metagnathtuggers.com","michaelapplysome.com","mkvmoviespoint.autos","money.quotesopia.com","monkeyanimalporn.com","morganhillwebcam.com","motorbikecatalog.com","motorcitybengals.com","motorsport-total.com","movieloversworld.com","moviemakeronline.com","moviesubtitles.click","mujeresdesnudas.club","mustardseedmoney.com","mylivewallpapers.com","mypace.sasapurin.com","myperfectweather.com","mypussydischarge.com","myuploadedpremium.de","naughtymachinima.com","neighborfoodblog.com","newfreelancespot.com","newsonthegotoday.com","nibelungen-kurier.de","notebookcheck-ru.com","notebookcheck-tr.com","nudecelebsimages.com","nudeplayboygirls.com","nutraingredients.com","nylonstockingsex.net","online-xxxmovies.com","onlinegrannyporn.com","originalteentube.com","pandadevelopment.net","pasadenastarnews.com","pcgamez-download.com","pesprofessionals.com","pipocamoderna.com.br","plagiarismchecker.co","planetaminecraft.com","platform.twitter.com","player.amperwave.net","player.smashy.stream","playstationhaber.com","popularmechanics.com","porlalibreportal.com","pornhub-sexfilme.net","portnassauwebcam.com","presentation-ppt.com","prismmarketingco.com","psychologyjunkie.com","pussymaturephoto.com","radiocountrylive.com","ragnarokscanlation.*","ranaaclanhungary.com","rebeccaneverbase.com","recipestutorials.com","redcurrantbakery.com","redensarten-index.de","remotejobzone.online","reviewingthebrew.com","rhein-main-presse.de","rinconpsicologia.com","robertplacespace.com","rockpapershotgun.com","roemische-zahlen.net","rojadirectaenvivo.pl","roms-telecharger.com","s920221683.online.de","salamanca24horas.com","sandratableother.com","sarkariresult.social","savespendsplurge.com","schoolgirls-asia.org","schwaebische-post.de","securegames.iwin.com","seededatthetable.com","server-tutorials.net","server.satunivers.tv","sexypornpictures.org","socialmediagirls.com","socialmediaverve.com","socket.pearsoned.com","solomaxlevelnewbie.*","spicyvintageporn.com","sportstohfa.online>>","starkroboticsfrc.com","stream.nbcsports.com","streamingcommunity.*","strtapewithadblock.*","successstoryinfo.com","superfastrelease.xyz","superpackpormega.com","swietaslowianskie.pl","tainguyenmienphi.com","tasteandtellblog.com","teenamateurphoto.com","telephone-soudan.com","teluguonlinemovies.*","telugusexkathalu.com","thecraftsmanblog.com","thefappeningblog.com","thefastlaneforum.com","thegatewaypundit.com","thekitchenmagpie.com","thelavenderchair.com","thesarkariresult.net","thistlewoodfarms.com","tienichdienthoai.net","tinyqualityhomes.org","todaysthebestday.com","tomb-raider-king.com","totalsportek1000.com","toyoheadquarters.com","travellingdetail.com","trueachievements.com","tutorialforlinux.com","udemy-downloader.com","underground.tboys.ro","unityassets4free.com","utahsweetsavings.com","utepminermaniacs.com","ver-comics-porno.com","ver-mangas-porno.com","videoszoofiliahd.com","vintageporntubes.com","virgo-horoscopes.com","visualcapitalist.com","wallstreet-online.de","watchallchannels.com","watchcartoononline.*","watchgameofthrones.*","watchhouseonline.net","watchsuitsonline.net","watchtheofficetv.com","wegotthiscovered.com","weihnachts-filme.com","wetasiancreampie.com","whats-on-netflix.com","whitelacecottage.com","wife-home-videos.com","wirtualnynowydwor.pl","worldgirlsportal.com","www.dobreprogramy.pl","yakyufan-asobiba.com","youfreepornotube.com","youngerasiangirl.net","yourhomebasedmom.com","yourhomemadetube.com","youtube-nocookie.com","yummytummyaarthi.com","1337x.ninjaproxy1.com","3dassetcollection.com","3dprintersforum.co.uk","ableitungsrechner.net","ad-itech.blogspot.com","airportseirosafar.com","airsoftmilsimnews.com","allgemeine-zeitung.de","ar-atech.blogspot.com","arabamob.blogspot.com","arrisalah-jakarta.com","attackofthefanboy.com","banglachoti-story.com","bestsellerforaday.com","bibliotecadecorte.com","bigbuttshubvideos.com","blackchubbymovies.com","blackmaturevideos.com","blasianluvforever.com","blog.motionisland.com","bournemouthecho.co.uk","branditechture.agency","brandstofprijzen.info","broncathleticfund.com","brutalanimalsfuck.com","bucetaspeludas.com.br","business-standard.com","calculator-online.net","cancer-horoscopes.com","celebritydeeplink.com","celebritynetworth.com","collinsdictionary.com","comentariodetexto.com","cordcuttingreport.com","course-downloader.com","creative-culinary.com","daddylivestream.com>>","dailyvideoreports.net","davescomputertips.com","desitab69.sextgem.com","destakenewsgospel.com","deutschpersischtv.com","diarioinformacion.com","diplomaexamcorner.com","dirtyyoungbitches.com","disneyfashionista.com","documentaryplanet.xyz","downloadcursos.gratis","dragontranslation.com","dragontranslation.net","dragontranslation.org","earn.mpscstudyhub.com","easyworldbusiness.com","edwardarriveoften.com","elcriticodelatele.com","electricalstudent.com","embraceinnerchaos.com","envato-downloader.com","eroticmoviesonline.me","errotica-archives.com","evelynthankregion.com","expressilustrowany.pl","filemoon-59t9ep5j.xyz","filemoon-ep11lgxt.xyz","filemoon-nv2xl8an.xyz","filemoon-oe4w6g0u.xyz","filmpornoitaliano.org","fitting-it-all-in.com","foodsdictionary.co.il","free-famous-toons.com","freebulksmsonline.com","freefatpornmovies.com","freeindiansextube.com","freepikdownloader.com","freshmaturespussy.com","friedrichshainblog.de","froheweihnachten.info","gadgetguideonline.com","games.bostonglobe.com","games.centredaily.com","games.dailymail.co.uk","games.greatergood.com","games.miamiherald.com","games.puzzlebaron.com","games.startribune.com","games.theadvocate.com","games.theolympian.com","games.triviatoday.com","gamoneinterrupted.com","gbadamud.blogspot.com","gemini-horoscopes.com","generalpornmovies.com","gentiluomodigitale.it","gentlemansgazette.com","giantshemalecocks.com","giessener-anzeiger.de","girlfuckgalleries.com","glamourxxx-online.com","gmuender-tagespost.de","googlearth.selva.name","goprincetontigers.com","greaterlongisland.com","guardian-series.co.uk","haber.eskisehirde.net","hackedonlinegames.com","hersfelder-zeitung.de","hochheimer-zeitung.de","hoegel-textildruck.de","hollywoodreporter.com","hot-teens-movies.mobi","hotmarathistories.com","howtoblogformoney.net","html5.gamemonetize.co","hungarianhardstyle.hu","iamflorianschulze.com","imasdk.googleapis.com","indiansexstories2.net","indratranslations.com","inmatesearchidaho.com","insideeducation.co.za","jacquieetmicheltv.net","jemontremasextape.com","journaldemontreal.com","journey.to-travel.net","jsugamecocksports.com","juninhoscripts.com.br","kana-mari-shokudo.com","kstatewomenshoops.com","kstatewomenshoops.net","kstatewomenshoops.org","labelandnarrowweb.com","lapaginadealberto.com","learnodo-newtonic.com","lebensmittelpraxis.de","lesbianfantasyxxx.com","lingeriefuckvideo.com","littlehouseliving.com","live-sport.duktek.pro","lycomingathletics.com","majalahpendidikan.com","malaysianwireless.com","mangaplus.shueisha.tv","megashare-website.com","midlandstraveller.com","midwestconference.org","mimaletadepeliculas.*","mmoovvfr.cloudfree.jp","moo-teau4c9h-mkay.com","moonfile-62es3l9z.com","motorsport.uol.com.br","mountainmamacooks.com","musvozimbabwenews.com","mybakingaddiction.com","mysflink.blogspot.com","nathanfromsubject.com","nationalgeographic.fr","netsentertainment.net","nobledicion.yoveo.xyz","note.sieuthuthuat.com","notformembersonly.com","oberschwaben-tipps.de","onepiecemangafree.com","onlinetntextbooks.com","onlinewatchmoviespk.*","ovcdigitalnetwork.com","paradiseislandcam.com","pcso-lottoresults.com","peiner-nachrichten.de","pelotalibrevivo.net>>","philippinenmagazin.de","photovoltaikforum.com","pisces-horoscopes.com","platform.adex.network","portbermudawebcam.com","primapaginamarsala.it","printablecreative.com","prod.hydra.sophos.com","quinnipiacbobcats.com","qul-de.translate.goog","radioitaliacanada.com","radioitalianmusic.com","redbluffdailynews.com","reddit-streams.online","redheaddeepthroat.com","redirect.dafontvn.com","revistaapolice.com.br","runningonrealfood.com","salzgitter-zeitung.de","santacruzsentinel.com","santafenewmexican.com","scrubson.blogspot.com","semprefi-1h3u8pkc.fun","semprefi-2tazedzl.fun","semprefi-5ut0d23g.fun","semprefi-7oliaqnr.fun","semprefi-8xp7vfr9.fun","semprefi-hdm6l8jq.fun","semprefi-uat4a3jd.fun","semprefi-wdh7eog3.fun","sex-amateur-clips.com","sexybabespictures.com","shortgoo.blogspot.com","showdownforrelief.com","sinnerclownceviri.net","skorpion-horoskop.com","smartwebsolutions.org","snapinstadownload.xyz","softwarecrackguru.com","softwaredescargas.com","solomax-levelnewbie.*","solopornoitaliani.xxx","soziologie-politik.de","space.tribuntekno.com","stablediffusionxl.com","startupjobsportal.com","steamcrackedgames.com","stream.hownetwork.xyz","streaming-community.*","streamingcommunityz.*","studyinghuman6js.shop","sublimereflection.com","supertelevisionhd.com","sweet-maturewomen.com","symboleslowianskie.pl","tapeadvertisement.com","tarjetarojaenvivo.lat","tarjetarojatvonline.*","taurus-horoscopes.com","taurus.topmanhuas.org","tech.trendingword.com","texteditor.nsspot.net","thecakeboutiquect.com","thedigitaltheater.com","thefreedictionary.com","thegnomishgazette.com","theprofoundreport.com","thetruthaboutcars.com","thewebsitesbridge.com","timesheraldonline.com","timesnewsgroup.com.au","toddpartneranimal.com","torrentdofilmeshd.net","towheaddeepthroat.com","travel-the-states.com","travelingformiles.com","tudo-para-android.com","ukiahdailyjournal.com","unsurcoenlasombra.com","utkarshonlinetest.com","vdl.np-downloader.com","videosxxxporno.gratis","virtualstudybrain.com","voyeur-pornvideos.com","walterprettytheir.com","watch.foodnetwork.com","watchcartoonsonline.*","watchfreejavonline.co","watchkobestreams.info","watchonlinemoviespk.*","watchporninpublic.com","watchseriesstream.com","weihnachts-bilder.org","wetterauer-zeitung.de","whisperingauroras.com","whittierdailynews.com","wiesbadener-kurier.de","wirtualnelegionowo.pl","worldwidestandard.net","www.dailymotion.com>>","xn--mlaregvle-02af.nu","yoima.hatenadiary.com","yoima2.hatenablog.com","zone-telechargement.*","123movies-official.net","1plus1plus1equals1.net","45er-de.translate.goog","acervodaputaria.com.br","adelaidepawnbroker.com","aimasummd.blog.fc2.com","algodaodocescan.com.br","allevertakstream.space","androidecuatoriano.xyz","appstore-discounts.com","assessmentcentrehq.com","automobile-catalog.com","batterypoweronline.com","best4hack.blogspot.com","bestialitysextaboo.com","blackamateursnaked.com","breastfeedingplace.com","brunettedeepthroat.com","canadianunderwriter.ca","canarystreetcrafts.com","canzoni-per-bambini.it","cartoonporncomics.info","celebritymovieblog.com","cleanandscentsible.com","clixwarez.blogspot.com","cloud.majalahhewan.com","comandotorrentshds.org","cosmonova-broadcast.tv","cotravinh.blogspot.com","cpopchanelofficial.com","crayonsandcravings.com","crunchycreamysweet.com","currencyconverterx.com","currentrecruitment.com","dads-banging-teens.com","databasegdriveplayer.*","dewfuneralhomenews.com","diananatureforeign.com","digitalbeautybabes.com","downloadfreecourse.com","drakorkita73.kita.rest","drop.carbikenation.com","dtupgames.blogspot.com","ecommercewebsite.store","einewelteinezukunft.de","electriciansforums.net","elektrobike-online.com","elizabeth-mitchell.org","enciclopediaonline.com","eu-proxy.startpage.com","eurointegration.com.ua","exclusiveasianporn.com","exgirlfriendmarket.com","ezaudiobookforsoul.com","fantasticyoungporn.com","file-1bl9ruic-moon.com","filmeserialeonline.org","freelancerartistry.com","freepic-downloader.com","freepik-downloader.com","ftlauderdalewebcam.com","games.besthealthmag.ca","games.heraldonline.com","games.islandpacket.com","games.journal-news.com","games.readersdigest.ca","generatesnitrosate.com","gewinnspiele-markt.com","gifhorner-rundschau.de","girlfriendsexphoto.com","golink.bloggerishyt.in","hairstylesthatwork.com","happyveggiekitchen.com","hentai-cosplay-xxx.com","hentai-vl.blogspot.com","hiraethtranslation.com","hockeyfantasytools.com","hollywoodhomestead.com","hopsion-consulting.com","hotanimepornvideos.com","housethathankbuilt.com","illustratemagazine.com","imagetwist.netlify.app","imperfecthomemaker.com","incontri-in-italia.com","indianpornvideo.online","insidekstatesports.com","insidekstatesports.net","insidekstatesports.org","irasutoya.blogspot.com","jacquieetmicheltv2.net","jessicaglassauthor.com","jonathansociallike.com","juegos.eleconomista.es","juneauharborwebcam.com","k-statewomenshoops.com","k-statewomenshoops.net","k-statewomenshoops.org","kenkou-maintenance.com","kingshotcalculator.com","kristiesoundsimply.com","lagacetadesalamanca.es","lecourrier-du-soir.com","littlesunnykitchen.com","live.dragaoconnect.net","livefootballempire.com","livingincebuforums.com","lonestarconference.org","m.bloggingguidance.com","marketedgeofficial.com","marketplace.nvidia.com","masterpctutoriales.com","megadrive-emulator.com","meteoregioneabruzzo.it","mexicanfoodjournal.com","mini.surveyenquete.net","moneywar2.blogspot.com","monorhinouscassaba.com","muleriderathletics.com","mycolombianrecipes.com","newbookmarkingsite.com","nilopolisonline.com.br","nosweatshakespeare.com","obutecodanet.ig.com.br","onlinetechsamadhan.com","onlinevideoconverter.*","opiniones-empresas.com","oracleerpappsguide.com","originalindianporn.com","paginadanoticia.com.br","pianetamountainbike.it","pittsburghpanthers.com","plagiarismdetector.net","play.discoveryplus.com","portstthomaswebcam.com","poweredbycovermore.com","praxis-jugendarbeit.de","principiaathletics.com","puzzles.standard.co.uk","puzzles.sunjournal.com","radioamericalatina.com","redlandsdailyfacts.com","republicain-lorrain.fr","rubyskitchenrecipes.uk","russkoevideoonline.com","salisburyjournal.co.uk","schwarzwaelder-bote.de","scorpio-horoscopes.com","sexyasianteenspics.com","shakentogetherlife.com","smallpocketlibrary.com","smartfeecalculator.com","sms-receive-online.com","strangernervousql.shop","streamhentaimovies.com","stuttgarter-zeitung.de","supermarioemulator.com","tastefullyeclectic.com","tatacommunications.com","techieway.blogspot.com","teluguhitsandflops.com","telyn610zoanthropy.com","thatballsouttahere.com","the-military-guide.com","thecartoonporntube.com","thehouseofportable.com","thisishowwebingham.com","tipsandtricksjapan.com","totalsportek1000.com>>","turkishaudiocenter.com","tutoganga.blogspot.com","tvchoicemagazine.co.uk","twopeasandtheirpod.com","unity3diy.blogspot.com","universitiesonline.xyz","universityequality.com","watchserieshd.stream>>","webcreator-journal.com","welsh-dictionary.ac.uk","xhamster-sexvideos.com","xn--algododoce-j5a.com","youfiles.herokuapp.com","yourdesignmagazine.com","zeeebatch.blogspot.com","aachener-nachrichten.de","adblockeronstreamtape.*","adrianmissionminute.com","ads-ti9ni4.blogspot.com","adultgamescollector.com","alejandrocenturyoil.com","alleneconomicmatter.com","allschoolboysecrets.com","aquarius-horoscopes.com","arcade.dailygazette.com","asianteenagefucking.com","auto-motor-und-sport.de","barranquillaestereo.com","bestpuzzlesandgames.com","betterbuttchallenge.com","bikyonyu-bijo-zukan.com","brasilsimulatormods.com","buerstaedter-zeitung.de","businesswritingblog.com","c--ix-de.translate.goog","careersatcouncil.com.au","cloudapps.herokuapp.com","coolsoft.altervista.org","creditcardgenerator.com","dameungrrr.videoid.baby","destinationsjourney.com","dokuo666.blog98.fc2.com","edgedeliverynetwork.com","elperiodicodearagon.com","encurtador.postazap.com","entertainment-focus.com","escortconrecensione.com","eservice.directauto.com","eskiceviri.blogspot.com","exclusiveindianporn.com","fightforthealliance.com","file-kg88oaak-embed.com","financeandinsurance.xyz","footballtransfer.com.ua","freefiremaxofficial.com","freemovies-download.com","freepornhdonlinegay.com","fromvalerieskitchen.com","funeralmemorialnews.com","gamersdiscussionhub.com","games.mercedsunstar.com","games.pressdemocrat.com","games.sanluisobispo.com","games.star-telegram.com","gamingsearchjournal.com","giessener-allgemeine.de","goctruyentranhvui17.com","guidon40hyporadius9.com","healthyfitnessmeals.com","heatherwholeinvolve.com","historyofroyalwomen.com","homeschoolgiveaways.com","ilgeniodellostreaming.*","india.mplandrecord.info","influencersgonewild.com","insidekstatesports.info","integral-calculator.com","investmentwatchblog.com","iptvdroid1.blogspot.com","juegosdetiempolibre.org","julieseatsandtreats.com","kennethofficialitem.com","keysbrasil.blogspot.com","keywestharborwebcam.com","kutubistan.blogspot.com","laurelberninteriors.com","legendaryrttextures.com","linklog.tiagorangel.com","lirik3satu.blogspot.com","loldewfwvwvwewefdw.cyou","mamaslearningcorner.com","marketingaccesspass.com","megaplayer.bokracdn.run","metamani.blog15.fc2.com","miltonfriedmancores.org","ministryofsolutions.com","mobile-tracker-free.com","mobileweb.bankmellat.ir","moon-3uykdl2w-embed.com","morgan0928-5386paz2.fun","morgan0928-6v7c14vs.fun","morgan0928-8ufkpqp8.fun","morgan0928-oqdmw7bl.fun","morgan0928-t9xc5eet.fun","morganoperationface.com","morrisvillemustangs.com","mountainbike-magazin.de","movielinkbdofficial.com","mrfreemium.blogspot.com","naumburger-tageblatt.de","newlifefuneralhomes.com","newlifeonahomestead.com","news-und-nachrichten.de","northwalespioneer.co.uk","nudeblackgirlfriend.com","nutraceuticalsworld.com","onionringsandthings.com","onlinesoccermanager.com","osteusfilmestuga.online","pandajogosgratis.com.br","patriotathleticfund.com","pepperlivestream.online","phonenumber-lookup.info","platingsandpairings.com","player.bestrapeporn.com","player.smashystream.com","player.tormalayalamhd.*","player.xxxbestsites.com","playtolearnpreschool.us","portaldosreceptores.org","portcanaveralwebcam.com","portstmaartenwebcam.com","pramejarab.blogspot.com","predominantlyorange.com","premierfantasytools.com","prepared-housewives.com","privateindianmovies.com","programmingeeksclub.com","puzzles.pressherald.com","rationalityaloelike.com","receive-sms-online.info","rppk13baru.blogspot.com","runningtothekitchen.com","searchenginereports.net","seoul-station-druid.com","sexyteengirlfriends.net","sexywomeninlingerie.com","shannonpersonalcost.com","singlehoroskop-loewe.de","snowman-information.com","spacestation-online.com","sqlserveregitimleri.com","streamtapeadblockuser.*","sweettoothsweetlife.com","talentstareducation.com","teamupinternational.com","tech.pubghighdamage.com","the-voice-of-germany.de","thebestideasforkids.com","thechroniclesofhome.com","thehappierhomemaker.com","theinternettaughtme.com","theplantbasedschool.com","tinycat-voe-fashion.com","tips97tech.blogspot.com","traderepublic.community","tutorialesdecalidad.com","valuable.hatenablog.com","verteleseriesonline.com","watchseries.unblocked.*","whatgreatgrandmaate.com","wiesbadener-tagblatt.de","windowsaplicaciones.com","xxxjapaneseporntube.com","youtube4kdownloader.com","zonamarela.blogspot.com","zone-telechargement.ing","zoomtventertainment.com","720pxmovies.blogspot.com","abendzeitung-muenchen.de","advertiserandtimes.co.uk","afilmyhouse.blogspot.com","altebwsneno.blogspot.com","anime4mega-descargas.net","antecoxalbobbing1010.com","aspirapolveremigliori.it","ate60vs7zcjhsjo5qgv8.com","atlantichockeyonline.com","aussenwirtschaftslupe.de","awealthofcommonsense.com","bestialitysexanimals.com","boundlessnecromancer.com","broadbottomvillage.co.uk","businesssoftwarehere.com","canonprintersdrivers.com","cardboardtranslation.com","celebrityleakednudes.com","childrenslibrarylady.com","cimbusinessevents.com.au","cle0desktop.blogspot.com","cloudcomputingtopics.net","culture-informatique.net","democratandchronicle.com","dictionary.cambridge.org","dictionnaire-medical.net","dominican-republic.co.il","downloads.wegomovies.com","downloadtwittervideo.com","dsocker1234.blogspot.com","einrichtungsbeispiele.de","fid-gesundheitswissen.de","freegrannypornmovies.com","freehdinterracialporn.in","ftlauderdalebeachcam.com","futbolenlatelevision.com","galaxytranslations10.com","games.crosswordgiant.com","games.idahostatesman.com","games.thenewstribune.com","games.tri-cityherald.com","gcertificationcourse.com","gelnhaeuser-tageblatt.de","general-anzeiger-bonn.de","greenbaypressgazette.com","healthylittlefoodies.com","hentaianimedownloads.com","hilfen-de.translate.goog","hotmaturegirlfriends.com","inlovingmemoriesnews.com","inmatefindcalifornia.com","insurancebillpayment.net","intelligence-console.com","jacquieetmichelelite.com","jasonresponsemeasure.com","josephseveralconcern.com","juegos.elnuevoherald.com","jumpmanclubbrasil.com.br","lampertheimer-zeitung.de","latribunadeautomocion.es","lauterbacher-anzeiger.de","lespassionsdechinouk.com","liveanimalporn.zooo.club","makingthymeforhealth.com","mariatheserepublican.com","mediapemersatubangsa.com","meine-anzeigenzeitung.de","mentalhealthcoaching.org","minecraft-serverlist.net","moalm-qudwa.blogspot.com","multivideodownloader.com","my-code4you.blogspot.com","noblessetranslations.com","nutraingredients-usa.com","nyangames.altervista.org","oberhessische-zeitung.de","onlinetv.planetfools.com","personality-database.com","phenomenalityuniform.com","philly.arkadiumarena.com","photos-public-domain.com","player.subespanolvip.com","playstationlifestyle.net","polseksongs.blogspot.com","portevergladeswebcam.com","programasvirtualespc.net","puzzles.centralmaine.com","quelleestladifference.fr","reddit-soccerstreams.com","renierassociatigroup.com","riprendiamocicatania.com","roadrunnersathletics.com","robertordercharacter.com","sandiegouniontribune.com","senaleszdhd.blogspot.com","shoppinglys.blogspot.com","smotret-porno-onlain.com","softdroid4u.blogspot.com","spicysouthernkitchen.com","stephenking-00qvxikv.fun","stephenking-3u491ihg.fun","stephenking-7tm3toav.fun","stephenking-c8bxyhnp.fun","stephenking-vy5hgkgu.fun","sundaysuppermovement.com","thebharatexpressnews.com","thedesigninspiration.com","theharristeeterdeals.com","themediterraneandish.com","therelaxedhomeschool.com","thewanderlustkitchen.com","thunderousintentions.com","tirumalatirupatiyatra.in","tubeinterracial-porn.com","unityassetcollection.com","upscaler.stockphotos.com","ustreasuryyieldcurve.com","verpeliculasporno.gratis","virginmediatelevision.ie","watchdoctorwhoonline.com","watchtrailerparkboys.com","workproductivityinfo.com","a-love-of-rottweilers.com","actionviewphotography.com","arabic-robot.blogspot.com","audaciousdefaulthouse.com","bharatsarkarijobalert.com","blog.receivefreesms.co.uk","braunschweiger-zeitung.de","businessnamegenerator.com","caroloportunidades.com.br","chocolatecoveredkatie.com","christopheruntilpoint.com","constructionplacement.org","convert-case.softbaba.com","cooldns-de.translate.goog","craftaholicsanonymous.net","ctrmarketingsolutions.com","currentaffairs.gktoday.in","cyamidpulverulence530.com","depo-program.blogspot.com","derivative-calculator.net","devere-group-hongkong.com","devoloperxda.blogspot.com","dictionnaire.lerobert.com","everydayhomeandgarden.com","fantasyfootballgeek.co.uk","fitnesshealtharticles.com","footballleagueworld.co.uk","fotografareindigitale.com","freeserverhostingweb.club","freewatchserialonline.com","game-kentang.blogspot.com","games.daytondailynews.com","games.gameshownetwork.com","games.lancasteronline.com","games.ledger-enquirer.com","games.moviestvnetwork.com","games.theportugalnews.com","gloucestershirelive.co.uk","graceaddresscommunity.com","greaseball6eventual20.com","heatherdiscussionwhen.com","housecardsummerbutton.com","kathleenmemberhistory.com","keepingitsimplecrafts.com","kitchentableclassroom.com","koume-in-huistenbosch.net","krankheiten-simulieren.de","lancashiretelegraph.co.uk","latribunadelpaisvasco.com","matriculant401merited.com","mega-hentai2.blogspot.com","newtoncustominteriors.com","nutraingredients-asia.com","oeffentlicher-dienst.info","oneessentialcommunity.com","onepiece-manga-online.net","passionatecarbloggers.com","percentagecalculator.guru","premeditatedleftovers.com","printedelectronicsnow.com","programmiedovetrovarli.it","projetomotog.blogspot.com","puzzles.independent.co.uk","realcanadiansuperstore.ca","realfinanceblogcenter.com","receitasoncaseiras.online","schooltravelorganiser.com","scripcheck.great-site.net","searchmovie.wp.xdomain.jp","sentinelandenterprise.com","seogroup.bookmarking.info","silverpetticoatreview.com","simply-delicious-food.com","softwaresolutionshere.com","sofwaremania.blogspot.com","tech.unblockedgames.world","telenovelas-turcas.com.es","thebeginningaftertheend.*","theshabbycreekcottage.com","transparentcalifornia.com","truesteamachievements.com","tucsitupdate.blogspot.com","ultimateninjablazingx.com","usahealthandlifestyle.com","vercanalesdominicanos.com","vintage-erotica-forum.com","whatisareverseauction.com","xn--k9ja7fb0161b5jtgfm.jp","youtubemp3donusturucu.net","yusepjaelani.blogspot.com","30sensualizeexpression.com","a-b-f-dd-aa-bb-cc61uyj.fun","a-b-f-dd-aa-bb-ccn1nff.fun","a-b-f-dd-aa-bb-cctwd3a.fun","a-b-f-dd-aa-bb-ccyh5my.fun","arena.gamesforthebrain.com","audiobookexchangeplace.com","avengerinator.blogspot.com","barefeetonthedashboard.com","basseqwevewcewcewecwcw.xyz","bezpolitickekorektnosti.cz","bibliotecahermetica.com.br","boonlessbestselling244.com","change-ta-vie-coaching.com","collegefootballplayoff.com","cornerstoneconfessions.com","cotannualconference.org.uk","cuatrolatastv.blogspot.com","dinheirocursosdownload.com","downloads.sayrodigital.net","edinburghnews.scotsman.com","eleganceandenchantment.com","elperiodicoextremadura.com","flashplayer.fullstacks.net","former-railroad-worker.com","frankfurter-wochenblatt.de","funnymadworld.blogspot.com","games.bellinghamherald.com","games.everythingzoomer.com","helmstedter-nachrichten.de","html5.gamedistribution.com","investigationdiscovery.com","istanbulescortnetworks.com","jilliandescribecompany.com","johnwardflighttraining.com","mailtool-de.translate.goog","motive213link.blogspot.com","musicbusinessworldwide.com","noticias.gospelmais.com.br","nutraingredients-latam.com","photoshopvideotutorial.com","puzzles.bestforpuzzles.com","recetas.arrozconleche.info","redditsoccerstreams.name>>","ripleyfieldworktracker.com","riverdesdelatribuna.com.ar","sagittarius-horoscopes.com","secondcomingofgluttony.com","skillmineopportunities.com","stuttgarter-nachrichten.de","sulocale.sulopachinews.com","thelastgamestandingexp.com","thetelegraphandargus.co.uk","tiendaenlinea.claro.com.ni","todoseriales1.blogspot.com","tokoasrimotedanpayet.my.id","tralhasvarias.blogspot.com","video-to-mp3-converter.com","watchimpracticaljokers.com","whowantstuffs.blogspot.com","windowcleaningforums.co.uk","wolfenbuetteler-zeitung.de","wolfsburger-nachrichten.de","aprettylifeinthesuburbs.com","beautifulfashionnailart.com","brittneystandardwestern.com","celestialtributesonline.com","charlottepilgrimagetour.com","choose.kaiserpermanente.org","cloud-computing-central.com","cointiply.arkadiumarena.com","constructionmethodology.com","cool--web-de.translate.goog","domainregistrationtips.info","download.kingtecnologia.com","dramakrsubindo.blogspot.com","elperiodicomediterraneo.com","evlenmekisteyenbayanlar.net","flash-firmware.blogspot.com","games.myrtlebeachonline.com","ge-map-overlays.appspot.com","happypenguin.altervista.org","iphonechecker.herokuapp.com","littlepandatranslations.com","lurdchinexgist.blogspot.com","newssokuhou666.blog.fc2.com","otakuworldsite.blogspot.com","parametric-architecture.com","pasatiemposparaimprimir.com","practicalpainmanagement.com","puzzles.crosswordsolver.org","redcarpet-fashionawards.com","thewestmorlandgazette.co.uk","timesofindia.indiatimes.com","watchfootballhighlights.com","watchmalcolminthemiddle.com","watchonlyfoolsandhorses.com","your-local-pest-control.com","centrocommercialevulcano.com","conoscereilrischioclinico.it","correction-livre-scolaire.fr","economictimes.indiatimes.com","emperorscan.mundoalterno.org","games.springfieldnewssun.com","gps--cache-de.translate.goog","imagenesderopaparaperros.com","lizs-early-learning-spot.com","locurainformaticadigital.com","michiganrugcleaning.cleaning","mimaletamusical.blogspot.com","net--tools-de.translate.goog","net--tours-de.translate.goog","pekalongan-cits.blogspot.com","publicrecords.netronline.com","skibiditoilet.yourmom.eu.org","springfieldspringfield.co.uk","teachersguidetn.blogspot.com","tekken8combo.kagewebsite.com","theeminenceinshadowmanga.com","toxitabellaeatrebates306.com","uptodatefinishconference.com","watchonlinemovies.vercel.app","www-daftarharga.blogspot.com","youkaiwatch2345.blog.fc2.com","bayaningfilipino.blogspot.com","beautypageants.indiatimes.com","counterstrike-hack.leforum.eu","dev-dark-blog.pantheonsite.io","educationtips213.blogspot.com","fittingcentermondaysunday.com","fun--seiten-de.translate.goog","hortonanderfarom.blogspot.com","launchreliantcleaverriver.com","maximumridesharingprofits.com","panlasangpinoymeatrecipes.com","pharmaceutical-technology.com","play.virginmediatelevision.ie","pressurewasherpumpdiagram.com","shorturl.unityassets4free.com","thefreedommatrix.blogspot.com","walkthrough-indo.blogspot.com","web--spiele-de.translate.goog","wojtekczytawh40k.blogspot.com","20demidistance9elongations.com","449unceremoniousnasoseptal.com","caq21harderv991gpluralplay.xyz","comousarzararadio.blogspot.com","coolsoftware-de.translate.goog","hipsteralcolico.altervista.org","jennifercertaindevelopment.com","kryptografie-de.translate.goog","mp3songsdownloadf.blogspot.com","noicetranslations.blogspot.com","oxfordlearnersdictionaries.com","pengantartidurkuh.blogspot.com","photo--alben-de.translate.goog","rheinische-anzeigenblaetter.de","thelibrarydigital.blogspot.com","touhoudougamatome.blog.fc2.com","watchcalifornicationonline.com","wwwfotografgotlin.blogspot.com","bigclatterhomesguideservice.com","bitcoinminingforex.blogspot.com","cool--domains-de.translate.goog","ibecamethewifeofthemalelead.com","pickcrackpasswords.blogspot.com","posturecorrectorshop-online.com","safeframe.googlesyndication.com","sozialversicherung-kompetent.de","the-girl-who-ate-everything.com","utilidades.ecuadjsradiocorp.com","akihabarahitorigurasiseikatu.com","deletedspeedstreams.blogspot.com","freesoftpdfdownload.blogspot.com","games.games.newsgames.parade.com","situsberita2terbaru.blogspot.com","such--maschine-de.translate.goog","uptodatefinishconferenceroom.com","games.charlottegames.cnhinews.com","loadsamusicsarchives.blogspot.com","pythonmatplotlibtips.blogspot.com","ragnarokscanlation.opchapters.com","tw.xn--h9jepie9n6a5394exeq51z.com","papagiovannipaoloii.altervista.org","softwareengineer-de.translate.goog","rojadirecta-tv-en-vivo.blogspot.com","thenightwithoutthedawn.blogspot.com","tenseishitaraslimedattaken-manga.com","wetter--vorhersage-de.translate.goog","marketing-business-revenus-internet.fr","hardware--entwicklung-de.translate.goog","0x7jwsog5coxn1e0mk2phcaurtrmbxfpouuz.fun","279kzq8a4lqa0ddt7sfp825b0epdl922oqu6.fun","2g8rktp1fn9feqlhxexsw8o4snafapdh9dn1.fun","5rr03ujky5me3sjzvfosr6p89hk6wd34qamf.fun","jmtv4zqntu5oyprw4seqtn0dmjulf9nebif0.fun","xn--n8jwbyc5ezgnfpeyd3i0a3ow693bw65a.com","sharpen-free-design-generator.netlify.app","a-b-c-d-e-f7011d0w3j3aor0dczs5ctoo2zpz1t6bm5f49.fun","a-b-c-d-e-f9jeats0w5hf22jbbxcrpnq37qq6nbxjwypsy.fun","a-b-c-d-e-fla3m19lerkfex1z9kdr5pd4hx0338uwsvbjx.fun","a-b-f2muvhnjw63ruyhoxhhrd61eszezz6jdj4jy1-b-d-t-s.fun","a-b-f7mh86v4lirbwg7m4qiwwlk2e4za9uyngqy1u-b-d-t-s.fun","a-b-fjkt8v1pxgzrc3lqoaz8fh7pjgygf4zh3eqhl-b-d-t-s.fun","a-b-fnv7h0323ap2wfqj1ruyo8id2bcuoq4kufzon-b-d-t-s.fun","a-b-fqmze5gr05g3y4azx9adr9bd2eow7xoqwbuxg-b-d-t-s.fun","ulike-filter-sowe-canplay-rightlets-generate-themrandomlyl89u8.fun"];

const $scriptletFromRegexes$ = /* 8 */ ["-embed.c","^moon(?:-[a-z0-9]+)?-embed\\.com$","51,52","moonfile","^moonfile-[a-z0-9-]+\\.com$","51,52",".","^[0-9a-z]{5,8}\\.(art|cfd|fun|icu|info|live|pro|sbs|world)$","51,52","-mkay.co","^moo-[a-z0-9]+(-[a-z0-9]+)*-mkay\\.com$","51,52","file-","^file-[a-z0-9]+(-[a-z0-9]+)*-(moon|embed)\\.com$","51,52","-moo.com","^fle-[a-z0-9]+(-[a-z0-9]+)*-moo\\.com$","51,52","filemoon","^filemoon-[a-z0-9]+(?:-[a-z0-9]+)*\\.(?:com|xyz)$","51,52","tamilpri","(\\d{0,1})?tamilprint(\\d{1,2})?\\.[a-z]{3,7}","95,1537,2348"];

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
