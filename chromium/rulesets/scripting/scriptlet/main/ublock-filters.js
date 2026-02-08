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

const $scriptletFunctions$ = /* 47 */
[trustedEditInboundObject,trustedJsonEditFetchRequest,adjustSetTimeout,jsonPruneFetchResponse,jsonPruneXhrResponse,trustedReplaceXhrResponse,trustedReplaceFetchResponse,trustedPreventDomBypass,jsonPrune,jsonEdit,setConstant,jsonlEditXhrResponse,noWindowOpenIf,abortCurrentScript,trustedSetConstant,trustedSuppressNativeMethod,abortOnStackTrace,preventRequestAnimationFrame,preventXhr,preventSetTimeout,preventFetch,removeAttr,trustedReplaceArgument,trustedOverrideElementMethod,trustedReplaceOutboundText,preventAddEventListener,abortOnPropertyRead,adjustSetInterval,preventSetInterval,abortOnPropertyWrite,noWebrtc,noEvalIf,disableNewtabLinks,preventInnerHTML,trustedJsonEditXhrResponse,jsonEditXhrResponse,xmlPrune,m3uPrune,jsonEditFetchResponse,trustedPreventXhr,trustedPreventFetch,trustedJsonEdit,spoofCSS,alertBuster,preventCanvas,trustedJsonEditFetchResponse,jsonEditFetchRequest];

const $scriptletArgs$ = /* 3055 */ ["JSON.stringify","0","..client[?.clientName==\"WEB\"]+={\"clientScreen\":\"CHANNEL\"}","propsToMatch","/\\/(player|get_watch)/","[native code]","17000","0.001","adPlacements adSlots playerResponse.adPlacements playerResponse.adSlots [].playerResponse.adPlacements [].playerResponse.adSlots","","/player?","adPlacements adSlots playerResponse.adPlacements playerResponse.adSlots","/playlist?","/\\/player(?:\\?.+)?$/","\"adPlacements\"","\"no_ads\"","/playlist\\?list=|\\/player(?:\\?.+)?$|watch\\?[tv]=/","/\"adPlacements.*?([A-Z]\"\\}|\"\\}{2,4})\\}\\],/","/\"adPlacements.*?(\"adSlots\"|\"adBreakHeartbeatParams\")/gms","$1","player?","\"adSlots\"","/^\\W+$/","Node.prototype.appendChild","fetch","Request","JSON.parse","entries.[-].command.reelWatchEndpoint.adClientParams.isAd","/get_watch?","require.0.3.0.__bbox.require.[].3.1.__bbox.result.data.viewer.sideFeedUnit.nodes.[].new_adverts.nodes.[-].sponsored_data","data.viewer.sideFeedUnit.nodes.[].new_adverts.nodes.[-].sponsored_data","/graphql","..sideFeed.nodes.*[?.__typename==\"AdsSideFeedUnit\"]","Env.nxghljssj","false","require.0.3.0.__bbox.require.[].3.1.__bbox.result.data.serpResponse.results.edges.[-].rendering_strategy.view_model.story.sponsored_data.ad_id","..__bbox.result.data.node[?@.*.__typename==\"SponsoredData\"]",".data[?@.category==\"SPONSORED\"].node","..node[?.*.__typename==\"SponsoredData\"]",".data.viewer.news_feed.edges.*[?@.category==\"SPONSORED\"].node","console.clear","undefined","globalThis","break;case","WebAssembly","atob","pubadxtag","json:{\"divIds\":[]}","Document.prototype.getElementById","\"/^[A-Z][-0-9A-Z_a-z]{3,}$/\"","Document.prototype.querySelector","\"/^[#.][A-Z][-A-Z_a-z]+$/\"","\"/^\\[data-l/\"","Document.prototype.querySelectorAll","\"/^div\\[/\"","Document.prototype.getElementsByTagName","\"i\"","\"/^\\[data-[_a-z]{5,7}\\]$/\"","Array.from","\"/NodeList/\"","prevent","inlineScript","\"/^\\[d[a-z]t[a-z]?-[0-9a-z]{2,4}\\]$/\"","\"/^\\[[a-z]{2,3}-/\"","\"/^\\[data-[a-z]+src\\]$/\"","\"/^\\[[a-z]{5}-/\"","\"/^\\[[a-ce-z][a-z]+-/\"","\"/^\\[d[b-z][a-z]*-/\"","\"/[\\S\\s]*\\[[^d][\\S\\s]+\\][\\S\\s]*/\"","HTMLElement.prototype.querySelectorAll","\"/.*\\[[^imns].+\\].*/\"","Element.prototype.hasAttribute","\"/[\\S\\s]+/\"","\"*\"","Document.prototype.evaluate","\"/.*/\"","Document.prototype.createTreeWalker","aclib","/stackDepth:3\\s+get injectedScript.+inlineScript/","setTimeout","/stackDepth:3.+inlineScript:\\d{4}:1/","Date","MessageChannel","/stackDepth:2.+inlineScript/","/vast.php?","/click\\.com|preroll|native_render\\.js|acscdn/","length:10001","]();}","500","162.252.214.4","true","c.adsco.re","adsco.re:2087","/^ [-\\d]/","Math.random","parseInt(localStorage['\\x","adBlockDetected","Math","localStorage['\\x","-load.com/script/","length:101",")](this,...","3000-6000","(new Error(","/fd/ls/lsp.aspx",".offsetHeight>0","/^https:\\/\\/pagead2\\.googlesyndication\\.com\\/pagead\\/js\\/adsbygoogle\\.js\\?client=ca-pub-3497863494706299$/","data-instype","ins.adsbygoogle:has(> div#aswift_0_host)","stay","url:https://googleads.g.doubleclick.net/pagead/ads?client=ca-pub-3497863494706299 method:HEAD mode:no-cors","throttle","121","String.prototype.indexOf","json:\"/\"","condition","/premium","HTMLIFrameElement.prototype.remove","iframe[src^=\"https://googleads.g.doubleclick.net/pagead/ads?client=ca-pub-3497863494706299\"]","tick()","adblock","String.prototype.includes","json:\"gecmisi\"","googleads","json:\"googleads\"","gecmisi","++","g.doubleclick.net","length:100000","/Copyright|doubleclick$/","favicon","length:252","Headers.prototype.get","/.+/","image/png.","/^text\\/plain;charset=UTF-8$/","json:\"content-type\"","cache-control","Headers.prototype.has","summerday","length:10","{\"type\":\"cors\"}","/offsetHeight|loaded/","HTMLScriptElement.prototype.onerror","pagead2.googlesyndication.com/pagead/js/adsbygoogle.js method:HEAD","emptyStr","Node.prototype.contains","{\"className\":\"adsbygoogle\"}","abort","load","showFallbackModal","blocked","d.socdm.com","Keen","stream.insertion","/video/auth/media","akamaiDisableServerIpLookup","noopFunc","MONETIZER101.init","/outboundLink/","v.fwmrm.net/ad/g/","war:noop-vmap1.xml","DD_RUM.addAction","nads.createAd","trueFunc","t++","dvtag.getTargeting","ga","class|style","div[id^=\"los40_gpt\"]","huecosPBS.nstdX","null","config.globalInteractions.[].bsData","googlesyndication","DTM.trackAsyncPV","_satellite","{}","_satellite.getVisitorId","mobileanalytics","newPageViewSpeedtest","pubg.unload","generateGalleryAd","mediator","Object.prototype.subscribe","gbTracker","gbTracker.sendAutoSearchEvent","Object.prototype.vjsPlayer.ads","marmalade","setInterval","url:ipapi.co","doubleclick","isPeriodic","*","data-woman-ex","a[href][data-woman-ex]","data-trm-action|data-trm-category|data-trm-label",".trm_event","KeenTracking","network_user_id","cloudflare.com/cdn-cgi/trace","History","/(^(?!.*(Function|HTMLDocument).*))/","api","google.ima.OmidVerificationVendor","Object.prototype.omidAccessModeRules","googletag.cmd","skipAdSeconds","0.02","/recommendations.","_aps","/api/analytics","Object.prototype.setDisableFlashAds","DD_RUM.addTiming","chameleonVideo.adDisabledRequested","AdmostClient","analytics","native code","15000","(null)","5000","datalayer","[]","Object.prototype.isInitialLoadDisabled","lr-ingest.io","listingGoogleEETracking","dcsMultiTrack","urlStrArray","pa","Object.prototype.setConfigurations","/gtm.js","JadIds","Object.prototype.bk_addPageCtx","Object.prototype.bk_doJSTag","passFingerPrint","optimizely","optimizely.initialized","google_optimize","google_optimize.get","_gsq","_gsq.push","stmCustomEvent","_gsDevice","iom","iom.c","_conv_q","_conv_q.push","google.ima.settings.setDisableFlashAds","pa.privacy","populateClientData4RBA","YT.ImaManager","UOLPD","UOLPD.dataLayer","__configuredDFPTags","URL_VAST_YOUTUBE","Adman","dplus","dplus.track","_satellite.track","/EzoIvent|TDELAY/","google.ima.dai","/froloa.js","adv","gfkS2sExtension","gfkS2sExtension.HTML5VODExtension","click","/event_callback=function\\(\\){window\\.location=t\\.getAttribute\\(\"href\"\\)/","AnalyticsEventTrackingJS","AnalyticsEventTrackingJS.addToBasket","AnalyticsEventTrackingJS.trackErrorMessage","initializeslideshow","b()","3000","ads","fathom","fathom.trackGoal","Origami","Origami.fastclick","document.querySelector","{\"value\": \".ad-placement-interstitial\"}",".easyAdsBox","jad","hasAdblocker","Sentry","Sentry.init","TRC","TRC._taboolaClone","fp","fp.t","fp.s","initializeNewRelic","turnerAnalyticsObj","turnerAnalyticsObj.setVideoObject4AnalyticsProperty","turnerAnalyticsObj.getVideoObject4AnalyticsProperty","optimizelyDatafile","optimizelyDatafile.featureFlags","fingerprint","fingerprint.getCookie","gform.utils","gform.utils.trigger","get_fingerprint","moatPrebidApi","moatPrebidApi.getMoatTargetingForPage","readyPromise","cpd_configdata","cpd_configdata.url","yieldlove_cmd","yieldlove_cmd.push","dataLayer.push","1.1.1.1/cdn-cgi/trace","_etmc","_etmc.push","freshpaint","freshpaint.track","ShowRewards","stLight","stLight.options","DD_RUM.addError","sensorsDataAnalytic201505","sensorsDataAnalytic201505.init","sensorsDataAnalytic201505.quick","sensorsDataAnalytic201505.track","s","s.tl","taboola timeout","clearInterval(run)","smartech","/TDELAY|EzoIvent/","sensors","sensors.init","/piwik-","2200","2300","sensors.track","googleFC","adn","adn.clearDivs","_vwo_code","live.streamtheworld.com/partnerIds","gtag","_taboola","_taboola.push","clicky","clicky.goal","WURFL","_sp_.config.events.onSPPMObjectReady","gtm","gtm.trackEvent","mParticle.Identity.getCurrentUser","_omapp.scripts.geolocation","{\"value\": {\"status\":\"loaded\",\"object\":null,\"data\":{\"country\":{\"shortName\":\"\",\"longName\":\"\"},\"administrative_area_level_1\":{\"shortName\":\"\",\"longName\":\"\"},\"administrative_area_level_2\":{\"shortName\":\"\",\"longName\":\"\"},\"locality\":{\"shortName\":\"\",\"longName\":\"\"},\"original\":{\"ip\":\"\",\"ip_decimal\":null,\"country\":\"\",\"country_eu\":false,\"country_iso\":\"\",\"city\":\"\",\"latitude\":null,\"longitude\":null,\"user_agent\":{\"product\":\"\",\"version\":\"\",\"comment\":\"\",\"raw_value\":\"\"},\"zip_code\":\"\",\"time_zone\":\"\"}},\"error\":\"\"}}","JSGlobals.prebidEnabled","i||(e(),i=!0)","2500","elasticApm","elasticApm.init","ga.sendGaEvent","adConfig","ads.viralize.tv","adobe","MT","MT.track","ClickOmniPartner","adex","adex.getAdexUser","Adkit","Object.prototype.shouldExpectGoogleCMP","apntag.refresh","pa.sendEvent","Munchkin","Munchkin.init","Event","ttd_dom_ready","ramp","appInfo.snowplow.trackSelfDescribingEvent","_vwo_code.init","adobePageView","adobeSearchBox","elements",".dropdown-menu a[href]","dapTracker","dapTracker.track","newrelic","newrelic.setCustomAttribute","adobeDataLayer","adobeDataLayer.push","Object.prototype._adsDisabled","Object.defineProperty","1","json:\"_adsEnabled\"","_adsDisabled","utag","utag.link","_satellite.kpCustomEvent","Object.prototype.disablecommercials","Object.prototype._autoPlayOnlyWithPrerollAd","Sentry.addBreadcrumb","sensorsDataAnalytic201505.register","freestar.newAdSlots","ytInitialPlayerResponse.playerAds","ytInitialPlayerResponse.adPlacements","ytInitialPlayerResponse.adSlots","playerResponse.adPlacements","playerResponse.adPlacements playerResponse.playerAds playerResponse.adSlots adPlacements playerAds adSlots important","reelWatchSequenceResponse.entries.[-].command.reelWatchEndpoint.adClientParams.isAd entries.[-].command.reelWatchEndpoint.adClientParams.isAd","url:/reel_watch_sequence?","Object","fireEvent","enabled","force_disabled","hard_block","header_menu_abvs","10000","adsbygoogle","nsShowMaxCount","toiads","objVc.interstitial_web","adb","navigator.userAgent","require.0.3.0.__bbox.require.[].3.1.__bbox.result.data.serpResponse.results.edges.[-].relay_rendering_strategy.view_model.story.sponsored_data.ad_id","/\\{\"node\":\\{\"role\":\"SEARCH_ADS\"[^\\n]+?cursor\":[^}]+\\}/g","/api/graphql","/\\{\"node\":\\{\"__typename\":\"MarketplaceFeedAdStory\"[^\\n]+?\"cursor\":(?:null|\"\\{[^\\n]+?\\}\"|[^\\n]+?MarketplaceSearchFeedStoriesEdge\")\\}/g","/\\{\"node\":\\{\"__typename\":\"VideoHomeFeedUnitSectionComponent\"[^\\n]+?\"sponsored_data\":\\{\"ad_id\"[^\\n]+?\"cursor\":null\\}/","require.0.3.0.__bbox.require.[].3.1.__bbox.result.data.node","require.0.3.0.__bbox.require.[].3.1.__bbox.result.data.node.story.sponsored_data.ad_id","require.0.3.0.__bbox.require.[].3.1.__bbox.result.data.marketplace_search.feed_units.edges.[-].node.story.sponsored_data.ad_id","require.0.3.0.__bbox.require.[].3.1.__bbox.result.data.viewer.marketplace_feed_stories.edges.[-].node.story.sponsored_data.ad_id","data.viewer.instream_video_ads data.scrubber",".data.viewer.marketplace_feed_stories.edges.*[?@.node.__typename==\"MarketplaceFeedAdStory\"]","__eiPb","detector","_ml_ads_ns","jQuery","cookie","showAds","adBlockerDetected","show","SmartAdServerASMI","repl:/\"adBlockWallEnabled\":true/\"adBlockWallEnabled\":false/","adBlockWallEnabled","_sp_._networkListenerData","SZAdBlockDetection","_sp_.config","AntiAd.check","open","/^/","showNotice","_sp_","$","_sp_.mms.startMsg","retrievalService","admrlWpJsonP","yafaIt","LieDetector","ClickHandler","IsAdblockRequest","InfMediafireMobileFunc","1000","newcontent","ExoLoader.serve","Fingerprint2","request=adb","AdController","popupBlocked","/\\}\\s*\\(.*?\\b(self|this|window)\\b.*?\\)/","_0x","stop","onload","ga.length","btoa","adcashMacros","grecaptcha.ready","BACK","jwplayer.utils.Timer","adblock_added","admc","exoNoExternalUI38djdkjDDJsio96","String.prototype.charCodeAt","ai_","window.open","SBMGlobal.run.pcCallback","SBMGlobal.run.gramCallback","(!o)","(!i)","decodeURIComponent","shift","/0x|google|ecoded|==/","Object.prototype.hideAds","Object.prototype._getSalesHouseConfigurations","player-feedback","samInitDetection","decodeURI","Date.prototype.toUTCString","Adcash","lobster","openLity","ad_abblock_ad","String.fromCharCode","PopAds","AdBlocker","Adblock","addEventListener","displayMessage","runAdblock","document.createElement","TestAdBlock","ExoLoader","loadTool","cticodes","imgadbpops","document.getElementById","document.write","redirect","4000","sadbl","adblockcheck","doSecondPop","arrvast","onclick","RunAds","/^(?:click|mousedown)$/","bypassEventsInProxies","jQuery.adblock","test-block","adi","ads_block","blockAdBlock","blurred","exoOpts","doOpen","prPuShown","flashvars.adv_pre_src","showPopunder","IS_ADBLOCK","page_params.holiday_promo","__NA","ads_priv","ab_detected","adsEnabled","document.dispatchEvent","t4PP","href|target","a[href=\"https://imgprime.com/view.php\"][target=\"_blank\"]","complete","String.prototype.charAt","sc_adv_out","pbjs.libLoaded","mz","ad_blocker","AaDetector","_abb","puShown","/doOpen|popundr/","pURL","readyState","serve","stop()","Math.floor","AdBlockDetectorWorkaround","apstagLOADED","jQuery.hello","/Adb|moneyDetect/","isShowingAd","VikiPlayer.prototype.pingAbFactor","player.options.disableAds","__htapop","exopop","/^(?:load|click)$/","popMagic","script","atOptions","XMLHttpRequest","flashvars.adv_pre_vast","flashvars.adv_pre_vast_alt","x_width","getexoloader","disableDeveloper","oms.ads_detect","Blocco","2000","_site_ads_ns","hasAdBlock","pop","ltvModal","luxuretv.config","popns","pushiserve","creativeLoaded-","exoframe","/^load[A-Za-z]{12,}/","rollexzone","ALoader","Object.prototype.AdOverlay","tkn_popunder","detect","dlw","40000","ctt()","can_run_ads","test","adsBlockerDetector","NREUM","pop3","__ads","ready","popzone","FlixPop.isPopGloballyEnabled","falseFunc","/exo","ads.pop_url","checkAdblockUser","checkPub","6000","tabUnder","check_adblock","l.parentNode.insertBefore(s","_blank","ExoLoader.addZone","encodeURIComponent","isAdBlockActive","raConf","__ADX_URL_U","tabunder","RegExp","POSTBACK_PIXEL","mousedown","preventDefault","'0x","Aloader","advobj","replace","popTimes","addElementToBody","phantomPopunders","$.magnificPopup.open","adsenseadBlock","stagedPopUnder","seconds","clearInterval","CustomEvent","exoJsPop101","popjs.init","-0x","closeMyAd","smrtSP","adblockSuspected","nextFunction","250","xRds","cRAds","myTimer","1500","advertising","countdown","tiPopAction","rmVideoPlay","r3H4","disasterpingu","document.querySelectorAll","AdservingModule","backRedirect","adv_pre_duration","adv_post_duration","/^(click|mousedown|mousemove|touchstart|touchend|touchmove)/","system.popunder","ab1","ab2","hidekeep","pp12","__Y","App.views.adsView.adblock","document.createEvent","ShowAdbblock","style","clientHeight","flashvars.adv_pause_html","/^(?:click|mousedown|mousemove|touchstart|touchend|touchmove)$/","BOOTLOADER_LOADED","PerformanceLongTaskTiming","proxyLocation","Int32Array","$.fx.off","popMagic.init","/DOMContentLoaded|load/","y.readyState","document.getElementsByTagName","smrtSB","href","#opfk","byepopup","awm","location","adBlockEnabled","getCookie","history.go","dataPopUnder","/error|canplay/","(t)","EPeventFire","additional_src","300","____POP","openx","is_noadblock","window.location","()","hblocked","AdBlockUtil","css_class.show","/adbl/i","CANG","DOMContentLoaded","adlinkfly","updato-overlay","innerText","/amazon-adsystem|example\\.com/","document.cookie","|","attr","scriptSrc","SmartWallSDK","segs_pop","alert","8000","cxStartDetectionProcess","Abd_Detector","counter","paywallWrapper","isAdBlocked","/enthusiastgaming|googleoptimize|googletagmanager/","css_class","ez","path","*.adserverDomain","10","$getWin","/doubleclick|googlesyndication/","__NEXT_DATA__.props.clientConfigSettings.videoAds","blockAds","_ctrl_vt.blocked.ad_script","registerSlideshowAd","50","debugger","mm","shortener","require","/^(?!.*(einthusan\\.io|yahoo|rtnotif|ajax|quantcast|bugsnag))/","caca","getUrlParameter","trigger","Ok","given","getScriptFromCss","method:HEAD","safelink.adblock","goafricaSplashScreenAd","try","/adnxs.com|onetag-sys.com|teads.tv|google-analytics.com|rubiconproject.com|casalemedia.com/","openPopunder","0x","xhr.prototype.realSend","initializeCourier","userAgent","_0xbeb9","1800","popAdsClickCount","redirectPage","adblocker","ad_","azar","Pop","_wm","flashvars.adv_pre_url","flashvars.protect_block","flashvars.video_click_url","popunderSetup","https","popunder","preventExit","hilltop","jsPopunder","vglnk","aadblock","S9tt","popUpUrl","Notification","srcdoc","iframe","readCookieDelit","trafficjunky","checked","input#chkIsAdd","adSSetup","adblockerModal","750","adBlock","spoof","html","capapubli","Aloader.serve","mouseup","sp_ad","app_vars.force_disable_adblock","adsHeight","onmousemove","button","yuidea-","adsBlocked","_sp_.msg.displayMessage","pop_under","location.href","_0x32d5","url","blur","CaptchmeState.adb","glxopen","adverts-top-container","disable","200","/googlesyndication|outbrain/","CekAab","timeLeft","testadblock","document.addEventListener","google_ad_client","UhasAB","adbackDebug","googletag","performance","rbm_block_active","adNotificationDetected","SubmitDownload1","show()","user=null","getIfc","!bergblock","overlayBtn","adBlockRunning","htaUrl","_pop","n.trigger","CnnXt.Event.fire","_ti_update_user","&nbsp","document.body.appendChild","BetterJsPop","/.?/","vastAds","setExoCookie","adblockDetected","frg","abDetected","target","I833","urls","urls.0","Object.assign","KeepOpeningPops","bindall","ad_block","time","KillAdBlock","read_cookie","ReviveBannerInterstitial","eval","GNCA_Ad_Support","checkAdBlocker","midRoll","adBlocked","Date.now","AdBlock","iframeTestTimeMS","runInIframe","deployads","='\\x","Debugger","stackDepth:3","warning","100","_checkBait","[href*=\"ccbill\"]","close_screen","onerror","dismissAdBlock","VMG.Components.Adblock","adblock_popup","FuckAdBlock","isAdEnabled","promo","_0x311a","mockingbird","adblockDetector","crakPopInParams","console.log","hasPoped","Math.round","h1mm.w3","banner","google_jobrunner","blocker_div","onscroll","keep-ads","#rbm_block_active","checkAdblock","checkAds","#DontBloxMyAdZ","#pageWrapper","adpbtest","initDetection","check","isBlanketFound","showModal","myaabpfun","sec","adFilled","//","NativeAd","gadb","damoh.ani-stream.com","showPopup","mouseout","clientWidth","adrecover","checkadBlock","gandalfads","Tool","clientSide.adbDetect","HTMLAnchorElement.prototype.click","anchor.href","cmnnrunads","downloadJSAtOnload","run","ReactAds","phtData","adBlocker","StileApp.somecontrols.adBlockDetected","killAdBlock","innerHTML","google_tag_data","readyplayer","noAdBlock","autoRecov","adblockblock","popit","popstate","noPop","Ha","rid","[onclick^=\"window.open\"]","tick","spot","adsOk","adBlockChecker","_$","12345","flashvars.popunder_url","urlForPopup","isal","/innerHTML|AdBlock/","checkStopBlock","overlay","popad","!za.gl","document.hidden","adblockEnabled","ppu","adspot_top","is_adblocked","/offsetHeight|google|Global/","an_message","Adblocker","pogo.intermission.staticAdIntermissionPeriod","localStorage","timeoutChecker","t","my_pop","nombre_dominio",".height","!?safelink_redirect=","document.documentElement","break;case $.","time.html","block_detected","/^(?:mousedown|mouseup)$/","ckaduMobilePop","tieneAdblock","popundr","obj","ujsmediatags method:HEAD","adsAreBlocked","spr","document.oncontextmenu","document.onmousedown","document.onkeydown","compupaste","redirectURL","bait","!atomtt","TID","!/download\\/|link/","Math.pow","adsanity_ad_block_vars","pace","ai_adb","openInNewTab",".append","!!{});","runAdBlocker","setOCookie","document.getElementsByClassName","td_ad_background_click_link","initBCPopunder","flashvars.logo_url","flashvars.logo_text","nlf.custom.userCapabilities","displayCookieWallBanner","adblockinfo","JSON","pum-open","svonm","#clickfakeplayer","/\\/VisitorAPI\\.js|\\/AppMeasurement\\.js/","popjs","/adblock/i","count","LoadThisScript","showPremLite","closeBlockerModal","detector_launch","5","keydown","Popunder","ag_adBlockerDetected","document.head.appendChild","bait.css","Date.prototype.toGMTString","initPu","jsUnda","ABD","adBlockDetector.isEnabled","adtoniq","__esModule","break","myFunction_ads","areAdsDisplayed","gkAdsWerbung","pop_target","onLoadEvent","is_banner","$easyadvtblock","mfbDetect","!/^https:\\/\\/sendvid\\.com\\/[0-9a-z]+$/","Pub2a","length:2001","block","console","send","ab_cl","V4ss","popunders","visibility","show_dfp_preroll","show_youtube_preroll","brave_load_popup","pageParams.dispAds","PrivateMode","scroll","document.bridCanRunAds","doads","pu","advads_passive_ads","tmohentai","pmc_admanager.show_interrupt_ads","ai_adb_overlay","AlobaidiDetectAdBlock","showMsgAb","Advertisement","type","input[value^=\"http\"]","wutimeBotPattern","adsbytrafficjunkycontext","abp1","$REACTBASE_STATE.serverModules.push","popup_ads","ipod","pr_okvalida","scriptwz_url","enlace","Popup","$.ajax","appendChild","Exoloader","offsetWidth","zomap.de","/$|adBlock/","adblockerpopup","adblockCheck","checkVPN","cancelAdBlocker","Promise","setNptTechAdblockerCookie","for-variations","!api?call=","cnbc.canShowAds","ExoSupport","/^(?:click|mousedown|mouseup)$/","di()","getElementById","loadRunative","value.media.ad_breaks","onAdVideoStart","zonefile","pwparams","fuckAdBlock","firefaucet","unescape","uas","mark","stop-scrolling","detectAdBlock","Adv","blockUI","adsafeprotected","'\\'","oncontextmenu","Base64","disableItToContinue","google","parcelRequire","mdpDeBlocker","flashvars.adv_start_html","mobilePop","/_0x|debug/","my_inter_listen","EviPopunder","adver","tcpusher","preadvercb","document.readyState","prerollMain","popping","adsrefresh","/ai_adb|_0x/","canRunAds",".submit","mdp_deblocker","bi()","#divDownload","modal","dclm_ajax_var.disclaimer_redirect_url","$ADP","load_pop_power","MG2Loader","/SplashScreen|BannerAd/","Connext","break;","checkTarget","i--","Time_Start","blocker","adUnits","afs_ads","b2a","data.[].vast_url","deleted","MutationObserver","ezstandalone.enabled","damoh","foundation.adPlayer.bitmovin","homad-global-configs","weltConfig.switches.videoAdBlockBlocker","XMLHttpRequest.prototype.open","svonm.com","/\"enabled\":\\s*true/","\"enabled\":false","adReinsertion","window.__gv_org_tfa","Object.prototype.adReinsertion","getHomadConfig","timeupdate","testhide","getComputedStyle","doOnce","popi","googlefc","angular","detected","{r()","450","ab","go_popup","Debug","offsetHeight","length","noBlocker","/youboranqs01|spotx|springserve/","js-btn-skip","r()","adblockActivated","penci_adlbock","Number.isNaN","fabActive","gWkbAdVert","noblock","wgAffiliateEnabled","!gdrivedownload","document.onclick","daCheckManager","prompt","data-popunder-url","saveLastEvent","friendlyduck",".post.movies","purple_box","detectAdblock","adblockDetect","adsLoadable","allclick_Public","a#clickfakeplayer",".fake_player > [href][target]",".link","'\\x","initAdserver","splashpage.init","window[_0x","checkSiteNormalLoad","/blob|injectedScript/","ASSetCookieAds","___tp","STREAM_CONFIGS",".clickbutton","Detected","XF","hide","mdp",".test","backgroundBanner","interstitial","letShowAds","antiblock","ulp_noadb",".show","url:!luscious.net","Object.prototype.adblock_detected","afterOpen","AffiliateAdBlock",".appendChild","adsbygoogle.loaded","ads_unblocked","xxSetting.adBlockerDetection","ppload","RegAdBlocking","a.adm","checkABlockP","Drupal.behaviors.adBlockerPopup","ADBLOCK","fake_ad","samOverlay","!refine?search","native","koddostu_com_adblock_yok","player.ads.cuePoints","adthrive","!t.me","bADBlock","better_ads_adblock","tie","Adv_ab","ignore_adblock","$.prototype.offset","ea.add","ad_pods.0.ads.0.segments.0.media ad_pods.1.ads.1.segments.1.media ad_pods.2.ads.2.segments.2.media ad_pods.3.ads.3.segments.3.media ad_pods.4.ads.4.segments.4.media ad_pods.5.ads.5.segments.5.media ad_pods.6.ads.6.segments.6.media ad_pods.7.ads.7.segments.7.media ad_pods.8.ads.8.segments.8.media","mouseleave","NativeDisplayAdID","contador","Light.Popup.create","t()","zendplace","mouseover","event.triggered","_cpp","sgpbCanRunAds","pareAdblock","ppcnt","data-ppcnt_ads","main[onclick]","Blocker","AdBDetected","navigator.brave","document.activeElement","{ \"value\": {\"tagName\": \"IFRAME\" }}","runAt","2","clickCount","body","hasFocus","{\"value\": \"Mozilla/5.0 (iPhone14,3; U; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/602.1.50 (KHTML, like Gecko) Version/10.0 Mobile/19A346 Safari/602.1\"}","timeSec","getlink","/wpsafe|wait/","timer","/getElementById|gotoo/","tid","ppuQnty","stopCountdown","web_share_ads_adsterra_config wap_short_link_middle_page_ad wap_short_link_middle_page_show_time data.ads_cpm_info","value","Object.prototype.isAllAdClose","DOMNodeRemoved","data.meta.require_addon data.meta.require_captcha data.meta.require_notifications data.meta.require_og_ads data.meta.require_video data.meta.require_web data.meta.require_related_topics data.meta.require_custom_ad_step data.meta.og_ads_offers data.meta.addon_url data.displayAds data.linkCustomAdOffers","data.getDetailPageContent.linkCustomAdOffers.[-].title","data.getTaboolaAds.*","/chp_?ad/","/adblock|isRequestPresent/","bmcdn6","window.onload","devtools","documentElement.innerHTML","{\"type\": \"opaque\"}","document.hasFocus","/adoto|\\/ads\\/js/","htmls","?key=","isRequestPresent","xmlhttp","data-ppcnt_ads|onclick","#main","#main[onclick*=\"mainClick\"]",".btn-success.get-link","fouty","disabled",".btn-primary","focusOut","googletagmanager","shortcut","suaads","/\\$\\('|ai-close/","bypass",".MyAd > a[target=\"_blank\"]","antiAdBlockerHandler","onScriptError","php","AdbModel","protection","div_form","private","navigator.webkitTemporaryStorage.queryUsageAndQuota","contextmenu","visibilitychange","remainingSeconds","0.1","Math.random() <= 0.15","checkBrowser","bypass_url","1600","class","#rtg-snp21","adsby","showadas","submit","validateForm","throwFunc","/pagead2\\.googlesyndication\\.com|inklinkor\\.com/","EventTarget.prototype.addEventListener","delete window","/countdown--|getElementById/","SMart1","/counter|wait/","tempat.org","doTest","checkAdsBlocked",".btn","interval","navigator","FingerprintJS","!buzzheavier.com","1e3*","/veepteero|tag\\.min\\.js/","aSl.gcd","/\\/4.+ _0/","chp_ad","document.documentElement.lang.toLowerCase","[onclick^=\"pop\"]","Light.Popup","window.addEventListener","json:\"load\"","maxclick","#get-link-button","Swal.fire","surfe.pro","czilladx","adsbygoogle.js","!devuploads.com","war:googlesyndication_adsbygoogle.js","window.adLink","google_srt","json:0.61234","checkAdBlock","shouldOpenPopUp","displayAdBlockerMessage","pastepc","detectedAdblock","isTabActive","a[target=\"_blank\"]","[href*=\"survey\"]","adForm","/adsbygoogle|googletagservices/","clicked","notifyExec","fairAdblock","data.value data.redirectUrl data.bannerUrl","/admin/settings","!gcloud","script[data-domain=","push",".call(null)","ov.advertising.tisoomi.loadScript","abp","userHasAdblocker","embedAddefend","/injectedScript.*inlineScript/","/(?=.*onerror)(?=^(?!.*(https)))/","/injectedScript|blob/","hommy.mutation.mutation","hommy","hommy.waitUntil","ACtMan","video.channel","/(www\\.[a-z]{8,16}\\.com|cloudfront\\.net)\\/.+\\.(css|js)$/","/popundersPerIP[\\s\\S]*?Date[\\s\\S]*?getElementsByTagName[\\s\\S]*?insertBefore/","/www|cloudfront/","shouldShow","matchMedia","target.appendChild(s","l.appendChild(s)","/^data:/","Document.prototype.createElement","\"script\"","litespeed/js","myEl","ExoDetector","!embedy","Pub2","/loadMomoVip|loadExo|includeSpecial/","loadNeverBlock","flashvars.mlogo","adver.abFucker.serve","displayCache","vpPrerollVideo","SpecialUp","zfgloaded","parseInt","/btoa|break/","/\\st\\.[a-zA-Z]*\\s/","/(?=^(?!.*(https)))/","key in document","zfgformats","zfgstorage","zfgloadedpopup","/\\st\\.[a-zA-Z]*\\sinlineScript/","zfgcodeloaded","outbrain","/inlineScript|stackDepth:1/","wpadmngr.com","adserverDomain",".js?_=","/https|stackDepth:3/","HTMLAllCollection","shown_at","!/d/","PlayerConfig.config.CustomAdSetting","affiliate","_createCatchAllDiv","/click|mouse/","document","PlayerConfig.trusted","PlayerConfig.config.AffiliateAdViewLevel","3","univresalP","puTSstrpcht","!/prcf.fiyar|themes|pixsense|.jpg/","hold_click","focus","js_func_decode_base_64","/(?=^(?!.*(https|injectedScript)))/","jQuery.popunder","\"/chp_?ad/\"","AdDetect","ai_front","abDetectorPro","/googlesyndication|doubleclick/","{\"type\": \"cors\"}","src=atob","\"/[0-9a-f]+-modal/\"","/\\/[0-9a-f]+\\.js\\?ver=/","tie.ad_blocker_detector","admiral","__cmpGdprAppliesGlobally","..admiralScriptCode",".props[?.id==\"admiral-bootstrap\"].dangerouslySetInnerHTML","decodeURI(decodeURI","error","gnt.x.uam","interactive","g$.hp","json:{\"gnt-d-adm\":true,\"gnt-d-bt\":true}","gnt.u.z","__INITIAL_DATA__.siteData.admiralScript",".cmd.unshift","/ad\\.doubleclick\\.net|static\\.dable\\.io/","error-report.com","loader.min.js","content-loader.com","()=>","HTMLScriptElement.prototype.setAttribute","/error-report|new Promise/","ads.adthrive.com","objAd.loadAdShield","window.myAd.runAd","RT-1562-AdShield-script-on-Huffpost","{\"value\": \"(function(){let link=document.createElement('link');link.rel='stylesheet';link.href='//image.ygosu.com/style/main.css';document.head.appendChild(link)})()\"}","error-report","{\"value\": \"(function(){let link=document.createElement('link');link.rel='stylesheet';link.href='https://loawa.com/assets/css/loawa.min.css';document.head.appendChild(link)})()\"}","/07c225f3\\.online|content-loader\\.com|css-load\\.com|html-load\\.com/","html-load.com","\"data-sdk\"","abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789+/=","AHE.is_member","USER.features.ad_shield","AppBootstrapData.config.adshieldAdblockRecovery","AppState.reduxState.features.adshieldAdblockRecovery","..adshieldAdblockRecovery=false","/fetchappbootstrapdata","HTMLScriptElement.prototype.onload","__INITIAL_STATE__.config.theme.ads.isAdBlockerEnabled","generalTimeLeft","__INITIAL_STATE__.gameLists.gamesNoPrerollIds.indexOf","DoodPop","__aaZoneid","#over","document.ontouchend","Array.prototype.shift","/^.+$/s","HTMLElement.prototype.click","premium","'1'","playID","openNewTab","download-wrapper","MDCore.adblock","Please wait","pop_init","adsbyjuicy","prerolls midrolls postrolls comm_ad house_ad pause_ad block_ad end_ad exit_ad pin_ad content_pool vertical_ad elements","/detail","adClosedTimestamp","data.item.[-].business_info.ad_desc","/feed/rcmd","killads","NMAFMediaPlayerController.vastManager.vastShown","reklama-flash-body","fakeAd","adUrl",".azurewebsites.net","assets.preroll assets.prerollDebug","/stream-link","/doubleclick|ad-delivery|googlesyndication/","__NEXT_DATA__.runtimeConfig._qub_sdk.qubConfig.video.adBlockerDetectorEnabled","data.[].relationships.advert data.[].relationships.vast","offers","tampilkanUrl",".layers.*[?.metadata.name==\"POI_Ads\"]","/PCWeb_Real.json","/gaid=","war:noop-vast2.xml","consent","arePiratesOnBoard","__INIT_CONFIG__.randvar","instanceof Event","await _0x","json:\"Blog1\"","ad-top","adblock.js","adbl",".getComputedStyle","STORAGE2","app_advert","googletag._loaded_","closeBanner","NoTenia","vast popup adblock",".offsetHeight","!asyaanimeleri.",".*[?.linkurl^=\"http\"]","initPop","app._data.ads","message","adsense","reklamlar","json:[{\"sure\":\"0\"}]","/api/video","skipAdblockCheck","/srvtrck|adligature|quantserve|outbrain/","createAgeModal","Object[_0x","adsPlayer","pubAdsService","offsetLeft","config.pauseInspect","appContext.adManager.context.current.adFriendly","HTMLIFrameElement",".style","dsanity_ad_block_vars","show_download_links","downloadbtn","height","blockAdBlock._options.baitClass","/AdBlock/i","charAt","fadeIn","checkAD","latest!==","detectAdBlocker","#downloadvideo",".ready","/'shift'|break;/","document.blocked_var","____ads_js_blocked","wIsAdBlocked","WebSite.plsDisableAdBlock","css","videootv","ads_blocked","samDetected","Drupal.behaviors.agBlockAdBlock","NoAdBlock","mMCheckAgainBlock","countClicks","settings.adBlockerDetection","eabdModal","ab_root.show","gaData","wrapfabtest","fuckAdBlock._options.baitClass","$ado","/ado/i","app.js","popUnderStage","samAdBlockAction","googlebot","advert","bscheck.adblocker","qpcheck.ads","tmnramp","!sf-converter.com","clickAds.banner.urls","json:[{\"url\":{\"limit\":0,\"url\":\"\"}}]","ad","show_ads","ignielAdBlock","isContentBlocked","GetWindowHeight","/pop|wm|forceClick/","CloudflareApps.installs.Ik7rmQ4t95Qk.options.measureDomain","detectAB1",".init","ActiveXObject","uBlockOriginDetected","/_0x|localStorage\\.getItem/","google_ad_status","googletag._vars_","googletag._loadStarted_","google_unique_id","google.javascript","google.javascript.ads","google_global_correlator","ads.servers.[].apiAddress","paywallGateway.truncateContent","Constant","u_cfg","adBlockDisabled","__NEXT_DATA__.props.pageProps.adVideo","blockedElement","/ad","onpopstate","popState","adthrive.config","breaks interstitials info","interstitials","xpath(//*[name()=\"Period\"][.//*[name()=\"AdaptationSet\"][@contentType=\"video\"][not(@bitstreamSwitching=\"true\")]])",".mpd","ad_slots","plugins.dfp","lura.live/prod/","/prog.m3u8","__C","ad-block-popup","exitTimer","innerHTML.replace","ajax","abu","countDown","HTMLElement.prototype.insertAdjacentHTML","_ads","eabpDialog","TotemToolsObject","puHref","flashvars.adv_postpause_vast","/Adblock|_ad_/","advads_passive_groups","GLX_GLOBAL_UUID_RESULT","f.parentNode.removeChild(f)","swal","keepChecking","t.pt","clickAnywhere urls","a[href*=\"/ads.php\"][target=\"_blank\"]","xv_ad_block","()=>{","nitroAds","class.scroll","/showModal|isBlanketFound/","disableDeveloperTools","[onclick*=\"window.open\"]","openWindow","Check","checkCookieClick","readyToVote","12000","target|href","a[href^=\"//\"]","wpsite_clickable_data","insertBefore","offsetParent","meta.advertise","next","vidorev_jav_plugin_video_ads_object.vid_ads_m_video_ads","data.attributes.config.freewheel data.attributes.config.featureFlags.dPlayer","data.attributes.ssaiInfo.forecastTimeline data.attributes.ssaiInfo.vendorAttributes.nonLinearAds data.attributes.ssaiInfo.vendorAttributes.videoView data.attributes.ssaiInfo.vendorAttributes.breaks.[].ads.[].adMetadata data.attributes.ssaiInfo.vendorAttributes.breaks.[].ads.[].adParameters data.attributes.ssaiInfo.vendorAttributes.breaks.[].timeOffset","xpath(//*[name()=\"MPD\"][.//*[name()=\"BaseURL\" and contains(text(),'dash_clear_fmp4') and contains(text(),'/a/')]]/@mediaPresentationDuration | //*[name()=\"Period\"][./*[name()=\"BaseURL\" and contains(text(),'dash_clear_fmp4') and contains(text(),'/a/')]])","ssaiInfo","adsProvider.init","SDKLoaded","css_class.scroll","mnpwclone","0.3","7000","[href*=\"nihonjav\"]","/null|Error/","bannersRequest","vads","a[href][onclick^=\"getFullStory\"]","!newdmn","popUp","devtoolschange","rccbase_styles","POPUNDER_ENABLED","plugins.preroll","DHAntiAdBlocker","/out.php","ishop_codes","#advVid","location.replace","showada","showax","adp","__tnt","compatibility","popundrCheck","history.replaceState","rexxx.swp","constructor","p18","clickHandler","onbeforeunload","window.location.href","prebid","asc","json:{\"cmd\": [null], \"que\": [null], \"wrapperVersion\": \"6.19.0\", \"refreshQue\": {\"waitDelay\": 3000, \"que\": []}, \"isLoaded\": true, \"bidderSettings\": {}, \"libLoaded\": true, \"version\": \"v9.20.0\", \"installedModules\": [], \"adUnits\": [], \"aliasRegistry\": {}, \"medianetGlobals\": {}}","google_tag_manager","json:{ \"G-Z8CH48V654\": { \"_spx\": false, \"bootstrap\": 1704067200000, \"dataLayer\": { \"name\": \"dataLayer\" } }, \"SANDBOXED_JS_SEMAPHORE\": 0, \"dataLayer\": { \"gtmDom\": true, \"gtmLoad\": true, \"subscribers\": 1 }, \"sequence\": 1 }","ADBLOCKED","Object.prototype.adsEnabled","removeChild","ai_run_scripts","clearInterval(i)","marginheight","ospen","pu_count","mypop","adblock_use","Object.prototype.adblockFound","download","1100","createCanvas","bizpanda","Q433","/pop|_blank/","movie.advertising.ad_server playlist.movie.advertising.ad_server","unblocker","playerAdSettings.adLink","playerAdSettings.waitTime","computed","manager","window.location.href=link","moonicorn.network","/dyn\\.ads|loadAdsDelayed/","xv.sda.pp.init","onreadystatechange","skmedix.com","skmedix.pl","MediaContainer.Metadata.[].Ad","doubleclick.com","opaque","_init","href|target|data-ipshover-target|data-ipshover|data-autolink|rel","a[href^=\"https://thumpertalk.com/link/click/\"][target=\"_blank\"]","/touchstart|mousedown|click/","latest","secs","event.simulate","isAdsLoaded","adblockerAlert","/^https?:\\/\\/redirector\\.googlevideo\\.com.*/","/.*m3u8/","cuepoints","cuepoints.[].start cuepoints.[].end cuepoints.[].start_float cuepoints.[].end_float","Period[id*=\"-roll-\"][id*=\"-ad-\"]","pubads.g.doubleclick.net/ondemand","/ads/banner","reachGoal","Element.prototype.attachShadow","Adb","randStr","SPHMoverlay","#continue","ai","timer.remove","popupBlocker","afScript","Object.prototype.parseXML","Object.prototype.blackscreenDuration","Object.prototype.adPlayerId","/ads",":visible","mMcreateCookie","downloadButton","SmartPopunder.make","readystatechange","document.removeEventListener",".button[href^=\"javascript\"]","animation","status","adsblock","pub.network","timePassed","timeleft","input[id=\"button1\"][class=\"btn btn-primary\"][disabled]","t(a)",".fadeIn()","result","evolokParams.adblock","[src*=\"SPOT\"]","asap stay",".pageProps.__APOLLO_STATE__.*[?.__typename==\"AotSidebar\"]","/_next/data","pageProps.__TEMPLATE_QUERY_DATA__.aotFooterWidgets","props.pageProps.data.aotHomepageTopBar props.pageProps.data.aotHomepageTopBar props.pageProps.data.aotHeaderAdScripts props.pageProps.data.aotFooterWidgets","counter--","daadb","l-1","_htas","/width|innerHTML/","magnificPopup","skipOptions","method:HEAD url:doubleclick.net","style.display","tvid.in/log","1150","0.5","testadtags ad","document.referrer","quadsOptions","history.pushState","loadjscssfile","load_ads","/debugger|offsetParent/","/ads|imasdk/","6","__NEXT_DATA__.props.pageProps.adsConfig","make_rand_div","new_config.timedown","catch","google_ad","response.timeline.elements.[-].advertiserId","url:/api/v2/tabs/for_you","timercounter","document.location","innerHeight","cainPopUp","#timer","!bowfile.com","cloudfront.net/?","href|target|data-onclick","a[id=\"dl\"][data-onclick^=\"window.open\"]","a.getAttribute(\"data-ad-client\")||\"\"","truex","truex.client","answers","!display","/nerveheels/","No","foreverJQ","/document.createElement|stackDepth:2/","container.innerHTML","top-right","hiddenProxyDetected","SteadyWidgetSettings.adblockActive","temp","inhumanity_pop_var_name","url:googlesyndication","enforceAdStatus","app_vars.please_disable_adblock","hashchange","history.back","starPop","Element.prototype.matches","litespeed","__PoSettings","HTMLSelectElement","youtube","aTagChange","Object.prototype.ads","display","a[onclick^=\"setTimeout\"]","detectBlockAds","eb","/analytics|livestats/","/nextFunction|2000/","resource_response.data.[-].pin_promotion_id resource_response.data.results.[-].pin_promotion_id","initialReduxState.pins.{-}.pin_promotion_id initialReduxState.resources.UserHomefeedResource.*.data.[-].pin_promotion_id","player","mahimeta","__htas","chp_adblock_browser","/adb/i","tdBlock",".t-out-span [href*=\"utm_source\"]","src",".t-out-span [src*=\".gif\"]","notifier","penciBlocksArray",".panel-body > .text-center > button","modal-window","isScrexed","fallbackAds","popurl","SF.adblock","() => n(t)","() => t()","startfrom","Math.imul","checkAdsStatus","wtg-ads","/ad-","void 0","/__ez|window.location.href/","D4zz","Object.prototype.ads.nopreroll_",").show()","function","/open.*_blank/","advanced_ads_ready","loadAdBlocker","HP_Scout.adBlocked","SD_IS_BLOCKING","isBlocking","adFreePopup","Object.prototype.isPremium","__BACKPLANE_API__.renderOptions.showAdBlock",".quiver-cam-player--ad-not-running.quiver-cam-player--free video","debug","Object.prototype.isNoAds","tv3Cmp.ConsentGiven","distance","site-access","chAdblock","/,ad\\n.+?(?=#UPLYNK-SEGMENT)/gm","/uplynk\\.com\\/.*?\\.m3u8/","remaining","/ads|doubleclick/","/Ads|adbl|offsetHeight/",".innerHTML","onmousedown",".ob-dynamic-rec-link","setupSkin","/app.js","dqst.pl","PvVideoSlider","_chjeuHenj","[].data.searchResults.listings.[-].targetingSegments","noConflict","preroll_helper.advs","/show|innerHTML/","create_ad","Object.prototype.enableInterstitial","addAds","/show|document\\.createElement/","loadXMLDoc","register","MobileInGameGames","__osw","uniconsent.com","/coinzillatag|czilladx/","divWidth","Script_Manager","Script_Manager_Time","bullads","Msg","!download","/click|mousedown/","adjsData","AdService.info.abd","UABP","adBlockDetectionResult","popped","/xlirdr|hotplay\\-games|hyenadata/","document.body.insertAdjacentHTML","exo","tic","download_loading","pu_url","Click","afStorage","puShown1","onAdblockerDetected","htmlAds","second","lycos_ad","150","passthetest","checkBlock","/thaudray\\.com|putchumt\\.com/","popName","vlitag","asgPopScript","/(?=^(?!.*(jquery|turnstile|challenge-platform)))/","Object.prototype.loadCosplay","Object.prototype.loadImages","FMPoopS","/window\\['(?:\\\\x[0-9a-f]{2}){2}/","urls.length","updatePercentage","importantFunc","console.warn","sam","current()","confirm","pandaAdviewValidate","showAdBlock","aaaaa-modal","setCookie","/(?=^(?!.*(http)))/","$onet","adsRedirectPopups","canGetAds","method:/head/i","Array.prototype.includes","json:\"none\"","/brave-api|script-content|bait|real/","length:11000","goToURL","ad_blocker_active","init_welcome_ad","setinteracted",".MediaStep","data.xdt_injected_story_units.ad_media_items","dataLayer","document.body.contains","nothingCanStopMeShowThisMessage","window.focus","imasdk","TextEncoder.prototype.encode","!/^\\//","fakeElement","adEnable","ssaiInfo fallback.ssaiInfo","adtech-brightline adtech-google-pal adtech-iab-om","/playbackInfo","xpath(//*[name()=\"MPD\"]/@mediaPresentationDuration | //*[name()=\"Period\"]/@start | //*[name()=\"Period\"][not(.//*[name()=\"SegmentTimeline\"])][not(.//*[name()=\"ContentProtection\"])] | //*[name()=\"Period\"][./*[name()=\"BaseURL\"]][not(.//*[name()=\"ContentProtection\"])])","/-vod-.+\\.mpd/","htmlSectionsEncoded","event.dispatch","adx","popupurls","displayAds","cls_report?","-0x1","childNodes","wbar","[href=\"/bestporn.html\"]","_adshrink.skiptime","gclid","event","!yt1d.com","button#getlink","button#gotolink","AbleToRunAds","PreRollAd.timeCounter","result.ads","tpc.googlesyndication.com","id","#div-gpt-ad-footer","#div-gpt-ad-pagebottom","#div-gpt-ad-relatedbottom-1","#div-gpt-ad-sidebottom","goog","document.body",".downloadbtn","abpblocked","p$00a",".data?","openAdsModal","paAddUnit","gloacmug.net","items.[-].potentialActions.0.object.impressionToken items.[-].hasPart.0.potentialActions.0.object.impressionToken","context.adsIncluded","refresh","adt","Array.prototype.indexOf","interactionCount","/cloudfront|thaudray\\.com/","test_adblock","vastEnabled","/adskeeper|cloudflare/","#gotolink","detectadsbocker","c325","two_worker_data_js.js","adobeModalTestABenabled","FEATURE_DISABLE_ADOBE_POPUP_BY_COUNTRY","questpassGuard","isAdBlockerEnabled","shortConfig","akadb","eazy_ad_unblocker","json:\"\"","unlock","adswizz.com","document.onkeypress","adsSrc","sssp","emptyObj","[style*=\"background-image: url\"]","[href*=\"click?\"]","/freychang|passback|popunder|tag|banquetunarmedgrater/","google-analytics","myTestAd","/<VAST version.+VAST>/","<VAST version=\\\"4.0\\\"></VAST>","deezer.getAudiobreak","Ads","smartLoaded","..ads_audio=false","ShowAdBLockerNotice","ad_listener","!shrdsk","notify","AdB","push-allow-modal",".hide","(!0)","Delay","ima","adSession","Cookiebot","\"adsBlocked\"","/appendChild|e\\(\"/","=>","stream.insertion.adSession stream.insertion.points stream.insertion stream.sources.*.insertion pods.0.ads","ads.metadata ads.document ads.dxc ads.live ads.vod","site-access-popup","*.tanya_video_ads","deblocker","data?","script.src","/#EXT-X-DISCONTINUITY.{1,100}#EXT-X-DISCONTINUITY/gm","mixed.m3u8","feature_flags.interstitial_ads_flag","feature_flags.interstitials_every_four_slides","?","downloadToken","waldoSlotIds","Uint8Array","redirectpage","13500","adblockstatus","adScriptLoaded","/adoto|googlesyndication/","props.sponsoredAlternative","np.detect","ad-delivery","document.documentElement.lang","adSettings","banner_is_blocked","consoleLoaded?clearInterval","Object.keys","[?.context.bidRequestId].*","RegExp.prototype.test","json:\"wirtualnemedia\"","/^dobreprogramy$/","decodeURL","updateProgress","/salesPopup|mira-snackbar/","Object.prototype.adBlocked","DOMAssistant","rotator","adblock popup vast","detectImgLoad","killAdKiller","current-=1","/zefoy\\.com\\S+:3:1/",".clientHeight","googleAd","/showModal|chooseAction|doAction|callbackAdsBlocked/","cpmecs","/adlink/i","[onload^=\"window.open\"]","dontask","aoAdBlockDetected","button[onclick^=\"window.open\"]","function(e)","touchstart","Brid.A9.prototype.backfillAdUnits","adlinkfly_url","siteAccessFlag","/adblocker|alert/","doubleclick.net/instream/ad_status.js","war:doubleclick_instream_ad_status.js","redURL","/children\\('ins'\\)|Adblock|adsbygoogle/","dct","slideShow.displayInterstitial","openPopup","Object.getPrototypeOf","plugins","ai_wait_for_jquery","pbjs","tOS2","ips","Error","/stackDepth:1\\s/","tryShowVideoAdAsync","chkADB","onDetected","detectAdblocker","document.ready","a[href*=\"torrentico.top/sim/go.php\"]","success.page.spaces.player.widget_wrappers.[].widget.data.intervention_data","VAST","{\"value\": \"Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Mobile/15E148 Safari/604.1\"}","navigator.standalone","navigator.platform","{\"value\": \"iPhone\"}","Storage.prototype.setItem","searchCount","empire.pop","empire.direct","empire.directHideAds","json:\"click\"","(!1)","pagead2.googlesyndication.com","empire.mediaData.advisorMovie","empire.mediaData.advisorSerie","fuckadb","[type=\"submit\"]","setTimer","auto_safelink","!abyss.to","daadb_get_data_fetch","penci_adlbock.ad_blocker_detector","siteAccessPopup","/adsbygoogle|adblock|innerHTML|setTimeout/","/innerHTML|_0x/","Object.prototype.adblockDetector","biteDisplay","blext","/[a-z]\\(!0\\)/","800","vidorev_jav_plugin_video_ads_object","vidorev_jav_plugin_video_ads_object_post","dai_iframe","popactive","/detectAdBlocker|window.open/","S_Popup","eazy_ad_unblocker_dialog_opener","rabLimit","-1","popUnder","/GoToURL|delay/","nudgeAdBlock","/googlesyndication|ads/","/Content/_AdBlock/AdBlockDetected.html","adBlckActive","AB.html","feedBack.showAffilaePromo","ShowAdvertising","a img:not([src=\"images/main_logo_inverted.png\"])","visible","a[href][target=\"_blank\"],[src^=\"//ad.a-ads.com/\"]","avails","amazonaws.com","ima3_dai","topaz.","FAVE.settings.ads.ssai.prod.clips.enabled","FAVE.settings.ads.ssai.prod.liveAuth.enabled","FAVE.settings.ads.ssai.prod.liveUnauth.enabled","xpath(//*[name()=\"MPD\"]/@mediaPresentationDuration | //*[name()=\"Period\"]/@start | //*[name()=\"Period\"][.//*[name()=\"BaseURL\" and contains(text(),\".prd.media.\")]])","/dash.mpd","/sandbox/i","analytics.initialized","autoptimize","UserCustomPop","method:GET","data.reg","time-events","/#EXTINF:[^\\n]+\\nhttps:\\/\\/redirector\\.googlevideo\\.com[^\\n]+/gms","/\\/ondemand\\/.+\\.m3u8/","/redirector\\.googlevideo\\.com\\/videoplayback[\\s\\S]*?dclk_video_ads/",".m3u8","phxSiteConfig.gallery.ads.interstitialFrequency","loadpagecheck","popupAt","modal_blocker","art3m1sItemNames.affiliate-wrapper","\"\"","isOpened","playerResponse.adPlacements playerResponse.playerAds adPlacements playerAds","Array.prototype.find","affinity-qi","GeneratorAds","isAdBlockerActive","pop.doEvent","'shift'","bFired","scrollIncrement","di.app.WebplayerApp.Ads.Adblocks.app.AdBlockDetectApp.startWithParent","a#downloadbtn[onclick^=\"window.open\"]","alink","/ads|googletagmanager/","sharedController.adblockDetector",".redirect","sliding","a[onclick]","infoey","settings.adBlockDetectionEnabled","displayInterstitialAdConfig","response.ads","/api","checkAdBlockeraz","blockingAds","Yii2App.playbackTimeout","setC","popup","/adScriptPath|MMDConfig/","xpath(//*[name()=\"MPD\"]/@mediaPresentationDuration | //*[name()=\"Period\"]/@start | //*[name()=\"Period\"][.//*[name()=\"BaseURL\" and contains(text(),'adease')]])","[media^=\"A_D/\"]","adease adeaseBlob vmap","adease","aab","ips.controller.register","plugins.adService","QiyiPlayerProphetData.a.data","wait","/adsbygoogle|doubleclick/","adBreaks.[].startingOffset adBreaks.[].adBreakDuration adBreaks.[].ads adBreaks.[].startTime adBreak adBreakLocations","/session.json","xpath(//*[name()=\"Period\"][not(contains(@id,\"subclip\"))] | //*[name()=\"MPD\"]/@mediaPresentationDuration | //*[name()=\"Period\"]/@start)","/\\/episode\\/.+?\\.mpd\\?/","session.showAds","toggleAdBlockInfo","cachebuster","config","OpenInNewTab_Over","/native|\\{n\\(\\)/","[style^=\"background\"]","[target^=\"_\"]","bodyElement.removeChild","aipAPItag.prerollSkipped","aipAPItag.setPreRollStatus","\"ads_disabled\":false","\"ads_disabled\":true","payments","reklam_1_saniye","reklam_1_gecsaniye","reklamsayisi","reklam_1","psresimler","data","runad","url:doubleclick.net","war:googletagservices_gpt.js","[target=\"_blank\"]","\"flashtalking\"","/(?=^(?!.*(cdn-cgi)))/","criteo","war:32x32.png","HTMLImageElement.prototype.onerror","HTMLImageElement.prototype.onload","sessionStorage","createDecoy","/form\\.submit|urlToOpen/","data.home.home_timeline_urt.instructions.[].entries.[-].content.itemContent.promotedMetadata","url:/Home","data.search_by_raw_query.search_timeline.timeline.instructions.[].entries.[-].content.itemContent.promotedMetadata","url:/SearchTimeline","data.threaded_conversation_with_injections_v2.instructions.[].entries.[-].content.items.[].item.itemContent.promotedMetadata","url:/TweetDetail","data.user.result.timeline_v2.timeline.instructions.[].entries.[-].content.itemContent.promotedMetadata","url:/UserTweets","data.immersiveMedia.timeline.instructions.[].entries.[-].content.itemContent.promotedMetadata","url:/ImmersiveMedia","/\\.php\\b.*_blank/",".[?.media_entities.*.video_info.variants]..url_data.url=\"https://twitter.undefined\"","twitter.undefined","powerAPITag","playerEnhancedConfig.run","rodo.checkIsDidomiConsent","xtime","smartpop","Div_popup","EzoIvent","/doubleclick|googlesyndication|vlitag/","overlays","googleAdUrl","/googlesyndication|nitropay/","uBlockActive","/api/v1/events","Scribd.Blob.AdBlockerModal","AddAdsV2I.addBlock","xpath(//*[name()=\"Period\"][.//*[name()=\"BaseURL\" and contains(text(),'/ad/')]])","/Detect|adblock|style\\.display|\\[native code]|\\.call\\(null\\)/","/google_ad_client/","method:GET url:!/idlix|jwpcdn/","total","popCookie","/0x|sandCheck/","hasAdBlocker","ShouldShow","offset","startDownload","cloudfront","[href*=\"jump\"]","!direct","a0b","/outbrain|criteo|thisiswaldo|media\\.net|ohbayersbur|adligature|quantserve|srvtrck|\\.css|\\.js/","mode:no-cors","2000-5000","contrformpub","data.device.adsParams data.device.adSponsorshipTemplate","url:/appconfig","innerWidth","initials.yld-pdpopunder",".main-wrap","/googlesyndication|googima\\.js/","__brn_private_mode","advertisement3","start","Object.prototype.skipPreroll","/adskeeper|bidgear|googlesyndication|mgid/","fwmrm.net","/\\/ad\\/g\\/1/","adverts.breaks","result.responses.[].response.result.cards.[-].data.offers","ADB","downloadTimer","/ads|google/","injectedScript","/googlesyndication|googletagservices/","DisableDevtool","eClicked","number","sync","PlayerLogic.prototype.detectADB","ads-twitter.com","all","havenclick","VAST > Ad","/tserver","Object.prototype.prerollAds","secure.adnxs.com/ptv","war:noop-vast4.xml","notifyMe","alertmsg","/streams","adsClasses","gsecs","adtagparameter","dvsize","52","removeDLElements","/\\.append|\\.innerHTML|undefined|\\.css|blocker|flex|\\$\\('|obfuscatedMsg/","warn","adc","majorse","completed","testerli","showTrkURL","/popunder/i","readyWait","document.body.style.backgroundPosition","invoke","ssai_manifest ad_manifest playback_info.ad_info qvt.playback_info.ad_info","Object.prototype.setNeedShowAdblockWarning","load_banner","initializeChecks","HTMLDocument","video-popup","splashPage","adList","adsense-container","detect-modal","/_0x|dtaf/","this","ifmax","adRequest","nads","nitroAds.abp","adinplay.com","onloadUI","war:google-ima.js","/^data:text\\/javascript/","randomNumber","current.children","probeScript","PageLoader.DetectAb","!koyso.","adStatus","popUrl","one_time","PlaybackDetails.[].DaiVod","consentGiven","ad-block","data.searchClassifiedFeed.searchResultView.0.searchResultItemsV2.edges.[-].node.item.content.creative.clickThroughEvent.adsTrackingMetadata.metadata.adRequestId","data.me.personalizedFeed.feedItems.[-].promo.creative.clickThroughUrl.adsTrackingMetadata.metadata.adRequestId","data.me.rhrFeed.feedItems.[-].promo.creative.clickThroughUrl.adsTrackingMetadata.metadata.sponsor","mdpDeblocker","doubleclick.net","BN_CAMPAIGNS","media_place_list","...","/\\{[a-z]\\(!0\\)\\}/","canRedirect","/\\{[a-z]\\(e\\)\\}/","[].data.displayAdsV3.data.[-].__typename","[].data.TopAdsProducts.data.[-].__typename","[].data.topads.data.[-].__typename","/\\{\"id\":\\d{9,11}(?:(?!\"ads\":\\{\"id\":\"\").)+?\"ads\":\\{\"id\":\"\\d+\".+?\"__typename\":\"ProductCarouselV2\"\\},?/g","/graphql/InspirationCarousel","/\\{\"category_id\"(?:(?!\"ads\":\\{\"id\":\"\").)+?\"ads\":\\{\"id\":\"\\d+\".+?\"__typename\":\"ProductCarouselV2\"\\},?/g","/graphql/InspirationalCarousel","/\\{\"id\":\\d{9,11}(?:(?!\"isTopads\":false).)+?\"isTopads\":true.+?\"__typename\":\"recommendationItem\"\\},/g","/\\/graphql\\/productRecommendation/i","/,\\{\"id\":\\d{9,11}(?:(?!\"isTopads\":false).)+?\"isTopads\":true(?:(?!\"__typename\":\"recommendationItem\").)+?\"__typename\":\"recommendationItem\"\\}(?=\\])/","/\\{\"(?:productS|s)lashedPrice\"(?:(?!\"isTopads\":false).)+?\"isTopads\":true.+?\"__typename\":\"recommendationItem\"\\},?/g","/graphql/RecomWidget","/\\{\"appUrl\"(?:(?!\"isTopads\":false).)+?\"isTopads\":true.+?\"__typename\":\"recommendationItem\"\\},?/g","/graphql/ProductRecommendationQuery","adDetails","/secure?","data.search.products.[-].sponsored_ad.ad_source","url:/plp_search_v2?","GEMG.GPT.Interstitial","amiblock","String.prototype.concat","adBlockerDismissed","adBlockerDismissed_","karte3","18","callbackAdsBlocked","stackTrace","sandDetect","json:\"body\"",".ad-zone","showcfkModal","amodule.data","emptyArr","inner-ad","_ET","jssdks.mparticle.com","session.sessionAds session.sessionAdsRequired","/session","getComputedStyle(el)","/(?=^(?!.*(orchestrate|cloudflare)))/","Object.prototype.ADBLOCK_DETECTION",".features.*[?.slug==\"adblock-detection\"].enabled=false","/ad/","/count|verify|isCompleted/","postroll","itemList.[-].ad_info.ad_id","url:api/recommend/item_list/","/adinplay|googlesyndication/","!hidan.sh","ask","interceptClickEvent","isAdBlockDetected","pData.adblockOverlayEnabled","ad_block_detector","attached","div[class=\"share-embed-container\"]","/^\\w{11}[1-9]\\d+\\.ts/","cabdSettings","/outbrain|adligature|quantserve|adligature|srvtrck/","adsConfiguration","/vod","layout.sections.mainContentCollection.components.[].data.productTiles.[-].sponsoredCreative.adGroupId","/search","fp-screen","puURL","!vidhidepre.com","[onclick*=\"_blank\"]","[onclick=\"goToURL();\"]","leaderboardAd","#leaderboardAd","placements.processingFile","dtGonza.playeradstime","\"-1\"","EV.Dab","ablk","malisx","alim","shutterstock.com","sorts.[-].recommendationList.[].contentMetadata.EncryptedAdTrackingData","/ads|chp_?ad/","ads.[-].ad_id","wp-ad","/clarity|googlesyndication/","/aff|jump/","!/mlbbox\\.me|_self/","aclib.runPop","ADS.isBannersEnabled","ADS.STATUS_ERROR","json:\"COMPLETE\"","button[onclick*=\"open\"]","getComputedStyle(testAd)","openPopupForChapter","Object.prototype.popupOpened","src_pop","zigi_tag_id","gifs.[-].cta.link","boosted_gifs","adsbygoogle_ama_fc_has_run","doThePop","thanksgivingdelights","yes.onclick","!vidsrc.","clearTimeout","popundersPerIP","createInvisibleTrigger","jwDefaults.advertising","elimina_profilazione","elimina_pubblicita","snigelweb.com","abd","pum_popups","checkerimg","!/(flashbang\\.sh|dl\\.buzzheavier\\.com)/","!dl.buzzheavier.com","uzivo","openDirectLinkAd","!nikaplayer.com",".adsbygoogle:not(.adsbygoogle-noablate)","json:\"img\"","playlist.movie.advertising.ad_server","PopUnder","data.[].affiliate_url","cdnpk.net/v2/images/search?","cdnpk.net/Rest/Media/","war:noop.json","data.[-].inner.ctaCopy","?page=","/gampad/ads?",".adv-",".length === 0",".length === 31","window.matchMedia('(display-mode: standalone)').matches","Object.prototype.DetectByGoogleAd","a[target=\"_blank\"][style]","/adsActive|POPUNDER/i","/Executed|modal/","[breakId*=\"Roll\"]","/content.vmap","/#EXT-X-KEY:METHOD=NONE\\n#EXT(?:INF:[^\\n]+|-X-DISCONTINUITY)\\n.+?(?=#EXT-X-KEY)/gms","/media.m3u8","window.navigator.brave","showTav","document['\\x","showADBOverlay","..directLink","..props[?.children*=\"clicksCount\"].children","clicksCount","adskeeper","springserve.com","document.documentElement.clientWidth","outbrain.com","s4.cdnpc.net/front/css/style.min.css","slider--features","s4.cdnpc.net/vite-bundle/main.css","data-v-d23a26c8","cdn.taboola.com/libtrc/san1go-network/loader.js","feOffset","hasAdblock","taboola","adbEnableForPage","Dataffcecd","/adblock|isblock/i","/\\b[a-z] inlineScript:/","result.adverts","data.pinotPausedPlaybackPage","fundingchoicesmessages","isAdblock","button[id][onclick*=\".html\"]","dclk_video_ads","ads breaks cuepoints times","odabd","pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?ord=","b.google_reactive_tag_first","sbs.demdex.net/dest5.html?d_nsid=0&ord=","Demdex.canSetThirdPartyCookies","securepubads.g.doubleclick.net/pagead/ima_ppub_config?ippd=https%3A%2F%2Fwww.sbs.com.au%2Fondemand%2F&ord=","[\"4117\"]","configs.*.properties.componentConfigs.slideshowConfigs.*.interstitialNativeAds","url:/config","list.[].link.kicker","/content/v1/cms/api/amp/Document","properties.tiles.[-].isAd","/mestripewc/default/config","openPop","circle_animation","CountBack","990","/location\\.(replace|href)|stopAndExitFullscreen/","displayAdBlockedVideo","/undefined|displayAdBlockedVideo/","cns.library","json:\"#app-root\"","google_ads_iframe","data-id|data-p","[data-id],[data-p]","BJSShowUnder","BJSShowUnder.bindTo","BJSShowUnder.add","Object.prototype._parseVAST","Object.prototype.createAdBlocker","Object.prototype.isAdPeriod","breaks custom_breaks_data pause_ads video_metadata.end_credits_time","pause_ads","/playlist","breaks","breaks custom_breaks_data pause_ads","xpath(//*[name()=\"MPD\"]/@mediaPresentationDuration | //*[name()=\"Period\"][.//*[name()=\"BaseURL\" and contains(text(),\"/ads-\")]] | //*[name()=\"Period\"][starts-with(@id,\"ad\")] | //*[name()=\"Period\"][starts-with(@id,\"Ad\")] | //*[name()=\"Period\"]/@start)","MPD Period[id^=\"Ad\"i]","ABLK","_n_app.popunder","_n_app.options.ads.show_popunders","N_BetterJsPop.object","jwplayer.vast","Fingerprent2","test.remove","isAdb","/click|mouse|touch/","puOverlay","opopnso","c0ZZ","cuepointPlaylist vodPlaybackUrls.result.playbackUrls.cuepoints vodPlaylistedPlaybackUrls.result.playbackUrls.pauseBehavior vodPlaylistedPlaybackUrls.result.playbackUrls.pauseAdsResolution vodPlaylistedPlaybackUrls.result.playbackUrls.intraTitlePlaylist.[-].shouldShowOnScrubBar ads","xpath(//*[name()=\"Period\"][.//*[@value=\"Ad\"]] | /*[name()=\"MPD\"]/@mediaPresentationDuration | //*[name()=\"Period\"]/@start)","[value=\"Ad\"]","xpath(//*[name()=\"Period\"][.//*[@value=\"Draper\"]] | /*[name()=\"MPD\"]/@mediaPresentationDuration | //*[name()=\"Period\"]/@start)","[value=\"Draper\"]","xpath(//*[name()=\"Period\"][.//*[name()=\"BaseURL\" and contains(text(),\"/interstitial/\")]] | /*[name()=\"MPD\"][.//*[name()=\"BaseURL\" and contains(text(),\"/interstitial/\")]]/@mediaPresentationDuration | /*[name()=\"MPD\"][.//*[name()=\"BaseURL\" and contains(text(),\"/interstitial/\")]]/*[name()=\"Period\"]/@start)","ue_adb_chk","ad.doubleclick.net bid.g.doubleclick.net ggpht.com google.co.uk google.com googleads.g.doubleclick.net googleads4.g.doubleclick.net googleadservices.com googlesyndication.com googleusercontent.com gstatic.com gvt1.com prod.google.com pubads.g.doubleclick.net s0.2mdn.net static.doubleclick.net surveys.g.doubleclick.net youtube.com ytimg.com","lifeOnwer","jsc.mgid.com","movie.advertising",".mandatoryAdvertising=false","/player/configuration","vast_urls","show_adverts","runCheck","adsSlotRenderEndSeen","DOMTokenList.prototype.add","\"-\"","removedNodes.forEach","__NEXT_DATA__.props.pageProps.broadcastData.remainingWatchDuration","json:9999999999","/\"remainingWatchDuration\":\\d+/","\"remainingWatchDuration\":9999999999","/stream","/\"midTierRemainingAdWatchCount\":\\d+,\"showAds\":(false|true)/","\"midTierRemainingAdWatchCount\":0,\"showAds\":false","a[href][onclick^=\"openit\"]","cdgPops","json:\"1\"","pubfuture","/doubleclick|google-analytics/","flashvars.mlogo_link","'script'","/ip-acl-all.php","URLlist","adBlockNotice","aaw","aaw.processAdsOnPage","displayLayer","adId","underpop","adBlockerModal","10000-15000","/adex|loadAds|adCollapsedCount|ad-?block/i","/^function\\(\\).*requestIdleCallback.*/","/function\\([a-z]\\){[a-z]\\([a-z]\\)}/","OneTrust","OneTrust.IsAlertBoxClosed","FOXIZ_MAIN_SCRIPT.siteAccessDetector","120000","openAdBlockPopup","drama-online","zoneid","\"data-cfasync\"","Object.init","advanced_ads_check_adblocker","div[class=\"nav tabTop\"] + div > div:first-child > div:first-child > a:has(> img[src*=\"/\"][src*=\"_\"][alt]), #head + div[id] > div:last-child > div > a:has(> img[src*=\"/\"][src*=\"_\"][alt])","/(?=^(?!.*(_next)))/","[].props.slides.[-].adIndex","#ad_blocker_detector","adblockTrigger","20","Date.prototype.toISOString","insertAd","!/^\\/|_self|alexsports|nativesurge/","length:40000-60000","method:HEAD mode:no-cors","attestHasAdBlockerActivated","extInstalled","blockThisUrl","SaveFiles.add","detectSandbox","bait.remove","/rekaa","pop_tag","/HTMLDocument|blob/","=","/wp-content\\/uploads\\/[a-z]+\\/[a-z]+\\.js/","pagead2.googlesyndication.com/pagead/js/adsbygoogle.js","wbDeadHinweis","()=>{var c=Kb","0.2","fired","popupInterval","adbon","*.aurl","/cs?id=","repl:/\\.mp4$/.mp3/",".mp4","-banner","PopURL","LCI.adBlockDetectorEnabled","!y2meta","ConsoleBan","disableDevtool","ondevtoolopen","onkeydown","window.history.back","close","lastPopupTime","button#download","mode:\"no-cors\"","!magnetdl.","stoCazzo","_insertDirectAdLink","Visibility","importFAB","ast","json:1","a[href][target=\"_blank\"]","url:ad/banner.gif","window.__CONFIGURATION__.adInsertion.enabled","window.__CONFIGURATION__.features.enableAdBlockerDetection","_carbonads","_bsa","redirectOnClick","widgets.outbrain.com","2d","/googletagmanager|ip-api/","&&","json:\"0\"","timeleftlink","handlePopup","bannerad sidebar ti_sidebar","moneyDetect","play","EFFECTIVE_APPS_GCB_BLOCKED_MESSAGE","sub","checkForAdBlocker","/navigator|location\\.href/","mode:cors","!self","/createElement|addEventListener|clientHeight/","uberad_mode","data.getFinalClickoutUrl data.sendSraBid",".php","!notunmovie","handleRedirect","testAd","imasdk.googleapis.com","/topaz/api","data.availableProductCount","results.[-].advertisement","/partners/home","__aab_init","show_videoad_limited","__NATIVEADS_CANARY__","[breakId]","_VMAP_","ad_slot_recs","/doc-page/recommenders",".smartAdsForAccessNoAds=true","/doc-page/afa","Object.prototype.adOnAdBlockPreventPlayback","pre_roll_url","post_roll_url",".result.PlayAds=false","/api/get-urls","OfferwallSessionTracker","player.preroll",".redirected","promos","TNCMS.DMP","/pop?",".metadata.hideAds=true","a2d.tv/play/","adblock_detect","link.click","document.body.style.overflow","fallback","/await|clientHeight/","Function","..adTimeout=0","/api/v","!/\\/download|\\/play|cdn\\.videy\\.co/","!_self","#fab","www/delivery","/\\/js/","/\\/4\\//","prads","/googlesyndication|doubleclick|adsterra/","String.prototype.split","null,http","..searchResults.*[?.isAd==true]","..mainContentComponentsListProps.*[?.isAd==true]","/search/snippet?","cmgpbjs","displayAdblockOverlay","start_full_screen_without_ad","drupalSettings.coolmath.hide_preroll_ads","clkUnder","adsArr","onClick","..data.expectingAds=false","/profile","[href^=\"https://whulsaux.com\"]","adRendered","Object.prototype.clickAds.emit","!storiesig","openUp",".result.timeline.*[?.type==\"ad\"]","/livestitch","data.*.elements.edges.[].node.outboundLink","data.children.[].data.outbound_link","method:POST url:/logImpressions","rwt",".js","_oEa","ADMITAD","body:browser","_hjSettings","bmak.js_post","method:POST","utreon.com/pl/api/event method:POST","log-sdk.ksapisrv.com/rest/wd/common/log/collect method:POST","firebase.analytics","require.0.3.0.__bbox.define.[].2.is_linkshim_supported","/(ping|score)Url","Object.prototype.updateModifiedCommerceUrl","HTMLAnchorElement.prototype.getAttribute","json:\"class\"","data-direct-ad","fingerprintjs-pro-react","flashvars.event_reporting","dataLayer.trackingId user.trackingId","Object.prototype.has_opted_out_tracking","cX_atfr","process","process.env","/VisitorAPI|AppMeasurement/","Visitor","''","?orgRef","analytics/bulk-pixel","eventing","send_gravity_event","send_recommendation_event","window.screen.height","method:POST body:zaraz","onclick|oncontextmenu|onmouseover","a[href][onclick*=\"this.href\"]","libAnalytics","json: {\"status\":{\"dataAvailable\":false},\"data\":{}}","libAnalytics.data.get","cmp.inmobi.com/geoip","method:POST url:pfanalytics.bentasker.co.uk","discord.com/api/v9/science","a[onclick=\"fire_download_click_tracking();\"]","adthrive._components.start","url:/api/statsig/log_event method:POST",".*[?.operationName==\"TrackEvent\"]","/v1/api","ftr__startScriptLoad","url:/undefined method:POST","miner","CoinNebula","blogherads","Math.sqrt","update","/(trace|beacon)\\.qq\\.com/","splunkcloud.com/services/collector","event-router.olympics.com","hostingcloud.racing","tvid.in/log/","excess.duolingo.com/batch","/eventLog.ajax","t.wayfair.com/b.php?","navigator.sendBeacon","segment.io","mparticle.com","ceros.com/a?data","pluto.smallpdf.com","method:/post/i url:/\\/\\/chatgpt\\.com\\/ces\\/v1\\/[a-z]$/","method:/post/i url:ab.chatgpt.com/v1/rgstr","/eventhub\\.\\w+\\.miro\\.com\\/api\\/stream/","logs.netflix.com","s73cloud.com/metrics/",".cdnurl=[\"data:video/mp4;base64,AAAAHGZ0eXBNNFYgAAACAGlzb21pc28yYXZjMQAAAAhmcmVlAAAGF21kYXTeBAAAbGliZmFhYyAxLjI4AABCAJMgBDIARwAAArEGBf//rdxF6b3m2Ui3lizYINkj7u94MjY0IC0gY29yZSAxNDIgcjIgOTU2YzhkOCAtIEguMjY0L01QRUctNCBBVkMgY29kZWMgLSBDb3B5bGVmdCAyMDAzLTIwMTQgLSBodHRwOi8vd3d3LnZpZGVvbGFuLm9yZy94MjY0Lmh0bWwgLSBvcHRpb25zOiBjYWJhYz0wIHJlZj0zIGRlYmxvY2s9MTowOjAgYW5hbHlzZT0weDE6MHgxMTEgbWU9aGV4IHN1Ym1lPTcgcHN5PTEgcHN5X3JkPTEuMDA6MC4wMCBtaXhlZF9yZWY9MSBtZV9yYW5nZT0xNiBjaHJvbWFfbWU9MSB0cmVsbGlzPTEgOHg4ZGN0PTAgY3FtPTAgZGVhZHpvbmU9MjEsMTEgZmFzdF9wc2tpcD0xIGNocm9tYV9xcF9vZmZzZXQ9LTIgdGhyZWFkcz02IGxvb2thaGVhZF90aHJlYWRzPTEgc2xpY2VkX3RocmVhZHM9MCBucj0wIGRlY2ltYXRlPTEgaW50ZXJsYWNlZD0wIGJsdXJheV9jb21wYXQ9MCBjb25zdHJhaW5lZF9pbnRyYT0wIGJmcmFtZXM9MCB3ZWlnaHRwPTAga2V5aW50PTI1MCBrZXlpbnRfbWluPTI1IHNjZW5lY3V0PTQwIGludHJhX3JlZnJlc2g9MCByY19sb29rYWhlYWQ9NDAgcmM9Y3JmIG1idHJlZT0xIGNyZj0yMy4wIHFjb21wPTAuNjAgcXBtaW49MCBxcG1heD02OSBxcHN0ZXA9NCB2YnZfbWF4cmF0ZT03NjggdmJ2X2J1ZnNpemU9MzAwMCBjcmZfbWF4PTAuMCBuYWxfaHJkPW5vbmUgZmlsbGVyPTAgaXBfcmF0aW89MS40MCBhcT0xOjEuMDAAgAAAAFZliIQL8mKAAKvMnJycnJycnJycnXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXiEASZACGQAjgCEASZACGQAjgAAAAAdBmjgX4GSAIQBJkAIZACOAAAAAB0GaVAX4GSAhAEmQAhkAI4AhAEmQAhkAI4AAAAAGQZpgL8DJIQBJkAIZACOAIQBJkAIZACOAAAAABkGagC/AySEASZACGQAjgAAAAAZBmqAvwMkhAEmQAhkAI4AhAEmQAhkAI4AAAAAGQZrAL8DJIQBJkAIZACOAAAAABkGa4C/AySEASZACGQAjgCEASZACGQAjgAAAAAZBmwAvwMkhAEmQAhkAI4AAAAAGQZsgL8DJIQBJkAIZACOAIQBJkAIZACOAAAAABkGbQC/AySEASZACGQAjgCEASZACGQAjgAAAAAZBm2AvwMkhAEmQAhkAI4AAAAAGQZuAL8DJIQBJkAIZACOAIQBJkAIZACOAAAAABkGboC/AySEASZACGQAjgAAAAAZBm8AvwMkhAEmQAhkAI4AhAEmQAhkAI4AAAAAGQZvgL8DJIQBJkAIZACOAAAAABkGaAC/AySEASZACGQAjgCEASZACGQAjgAAAAAZBmiAvwMkhAEmQAhkAI4AhAEmQAhkAI4AAAAAGQZpAL8DJIQBJkAIZACOAAAAABkGaYC/AySEASZACGQAjgCEASZACGQAjgAAAAAZBmoAvwMkhAEmQAhkAI4AAAAAGQZqgL8DJIQBJkAIZACOAIQBJkAIZACOAAAAABkGawC/AySEASZACGQAjgAAAAAZBmuAvwMkhAEmQAhkAI4AhAEmQAhkAI4AAAAAGQZsAL8DJIQBJkAIZACOAAAAABkGbIC/AySEASZACGQAjgCEASZACGQAjgAAAAAZBm0AvwMkhAEmQAhkAI4AhAEmQAhkAI4AAAAAGQZtgL8DJIQBJkAIZACOAAAAABkGbgCvAySEASZACGQAjgCEASZACGQAjgAAAAAZBm6AnwMkhAEmQAhkAI4AhAEmQAhkAI4AhAEmQAhkAI4AhAEmQAhkAI4AAAAhubW9vdgAAAGxtdmhkAAAAAAAAAAAAAAAAAAAD6AAABDcAAQAAAQAAAAAAAAAAAAAAAAEAAAAAAAAAAAAAAAAAAAABAAAAAAAAAAAAAAAAAABAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAwAAAzB0cmFrAAAAXHRraGQAAAADAAAAAAAAAAAAAAABAAAAAAAAA+kAAAAAAAAAAAAAAAAAAAAAAAEAAAAAAAAAAAAAAAAAAAABAAAAAAAAAAAAAAAAAABAAAAAALAAAACQAAAAAAAkZWR0cwAAABxlbHN0AAAAAAAAAAEAAAPpAAAAAAABAAAAAAKobWRpYQAAACBtZGhkAAAAAAAAAAAAAAAAAAB1MAAAdU5VxAAAAAAALWhkbHIAAAAAAAAAAHZpZGUAAAAAAAAAAAAAAABWaWRlb0hhbmRsZXIAAAACU21pbmYAAAAUdm1oZAAAAAEAAAAAAAAAAAAAACRkaW5mAAAAHGRyZWYAAAAAAAAAAQAAAAx1cmwgAAAAAQAAAhNzdGJsAAAAr3N0c2QAAAAAAAAAAQAAAJ9hdmMxAAAAAAAAAAEAAAAAAAAAAAAAAAAAAAAAALAAkABIAAAASAAAAAAAAAABAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAGP//AAAALWF2Y0MBQsAN/+EAFWdCwA3ZAsTsBEAAAPpAADqYA8UKkgEABWjLg8sgAAAAHHV1aWRraEDyXyRPxbo5pRvPAyPzAAAAAAAAABhzdHRzAAAAAAAAAAEAAAAeAAAD6QAAABRzdHNzAAAAAAAAAAEAAAABAAAAHHN0c2MAAAAAAAAAAQAAAAEAAAABAAAAAQAAAIxzdHN6AAAAAAAAAAAAAAAeAAADDwAAAAsAAAALAAAACgAAAAoAAAAKAAAACgAAAAoAAAAKAAAACgAAAAoAAAAKAAAACgAAAAoAAAAKAAAACgAAAAoAAAAKAAAACgAAAAoAAAAKAAAACgAAAAoAAAAKAAAACgAAAAoAAAAKAAAACgAAAAoAAAAKAAAAiHN0Y28AAAAAAAAAHgAAAEYAAANnAAADewAAA5gAAAO0AAADxwAAA+MAAAP2AAAEEgAABCUAAARBAAAEXQAABHAAAASMAAAEnwAABLsAAATOAAAE6gAABQYAAAUZAAAFNQAABUgAAAVkAAAFdwAABZMAAAWmAAAFwgAABd4AAAXxAAAGDQAABGh0cmFrAAAAXHRraGQAAAADAAAAAAAAAAAAAAACAAAAAAAABDcAAAAAAAAAAAAAAAEBAAAAAAEAAAAAAAAAAAAAAAAAAAABAAAAAAAAAAAAAAAAAABAAAAAAAAAAAAAAAAAAAAkZWR0cwAAABxlbHN0AAAAAAAAAAEAAAQkAAADcAABAAAAAAPgbWRpYQAAACBtZGhkAAAAAAAAAAAAAAAAAAC7gAAAykBVxAAAAAAALWhkbHIAAAAAAAAAAHNvdW4AAAAAAAAAAAAAAABTb3VuZEhhbmRsZXIAAAADi21pbmYAAAAQc21oZAAAAAAAAAAAAAAAJGRpbmYAAAAcZHJlZgAAAAAAAAABAAAADHVybCAAAAABAAADT3N0YmwAAABnc3RzZAAAAAAAAAABAAAAV21wNGEAAAAAAAAAAQAAAAAAAAAAAAIAEAAAAAC7gAAAAAAAM2VzZHMAAAAAA4CAgCIAAgAEgICAFEAVBbjYAAu4AAAADcoFgICAAhGQBoCAgAECAAAAIHN0dHMAAAAAAAAAAgAAADIAAAQAAAAAAQAAAkAAAAFUc3RzYwAAAAAAAAAbAAAAAQAAAAEAAAABAAAAAgAAAAIAAAABAAAAAwAAAAEAAAABAAAABAAAAAIAAAABAAAABgAAAAEAAAABAAAABwAAAAIAAAABAAAACAAAAAEAAAABAAAACQAAAAIAAAABAAAACgAAAAEAAAABAAAACwAAAAIAAAABAAAADQAAAAEAAAABAAAADgAAAAIAAAABAAAADwAAAAEAAAABAAAAEAAAAAIAAAABAAAAEQAAAAEAAAABAAAAEgAAAAIAAAABAAAAFAAAAAEAAAABAAAAFQAAAAIAAAABAAAAFgAAAAEAAAABAAAAFwAAAAIAAAABAAAAGAAAAAEAAAABAAAAGQAAAAIAAAABAAAAGgAAAAEAAAABAAAAGwAAAAIAAAABAAAAHQAAAAEAAAABAAAAHgAAAAIAAAABAAAAHwAAAAQAAAABAAAA4HN0c3oAAAAAAAAAAAAAADMAAAAaAAAACQAAAAkAAAAJAAAACQAAAAkAAAAJAAAACQAAAAkAAAAJAAAACQAAAAkAAAAJAAAACQAAAAkAAAAJAAAACQAAAAkAAAAJAAAACQAAAAkAAAAJAAAACQAAAAkAAAAJAAAACQAAAAkAAAAJAAAACQAAAAkAAAAJAAAACQAAAAkAAAAJAAAACQAAAAkAAAAJAAAACQAAAAkAAAAJAAAACQAAAAkAAAAJAAAACQAAAAkAAAAJAAAACQAAAAkAAAAJAAAACQAAAAkAAACMc3RjbwAAAAAAAAAfAAAALAAAA1UAAANyAAADhgAAA6IAAAO+AAAD0QAAA+0AAAQAAAAEHAAABC8AAARLAAAEZwAABHoAAASWAAAEqQAABMUAAATYAAAE9AAABRAAAAUjAAAFPwAABVIAAAVuAAAFgQAABZ0AAAWwAAAFzAAABegAAAX7AAAGFwAAAGJ1ZHRhAAAAWm1ldGEAAAAAAAAAIWhkbHIAAAAAAAAAAG1kaXJhcHBsAAAAAAAAAAAAAAAALWlsc3QAAAAlqXRvbwAAAB1kYXRhAAAAAQAAAABMYXZmNTUuMzMuMTAw\"]","/storage-resolve/files/audio/interactive"];

const $scriptletArglists$ = /* 3636 */ "0,0,1,2;1,2,3,4;2,5,6,7;3,8,9,3,10;3,11,9,3,12;4,8,9,3,13;5,14,15,16;5,17,9,16;5,18,19,13;6,14,15,20;6,21,15,20;6,21,15,22;7,23,24;7,23,25;7,23,26;8,27;6,21,15,28;8,29;4,30,9,3,31;9,32;10,33,34;8,35;9,36;11,37,3,31;11,38,3,31;11,39,3,31;12;10,40,41;13,42,43;13,44,45;14,46,47;15,48,49;15,50,51;15,50,52;15,53,51;15,50,54;15,55,56;15,53,57;15,58,59,60,61;15,53,62;15,53,63;15,53,64;15,53,65;15,53,66;15,53,67;15,53,68;15,69,70;15,71,72,60,61;15,55,73,60,61;15,74,75,60,61;15,76,75,60,61;16,77,78;16,79,80;17,81;16,82,83;18,84;18,85,86;19,87,88;18,89,90;18,91;18,92;12,93;13,94,95;10,96,41;13,97,98;20,99,100;19,101,102;19,103,102;18,104;19,105;18,106;21,107,108,109;20,110,9,9,111,112;22,113,1,114,115,116;23,117,118;17,119;19,120;22,121,1,122,115,123;22,121,1,124,115,125;17,126;20,127,128;22,121,1,9,115,129;20,130,131;24,132,133,134,115,135;22,132,1,136,115,137;22,138,1,136,115,137;20,139,140,141;19,142;10,143,41;20,144,145;15,146,147,148;25,149,150;17,151;20,152;26,153;4,154,9,3,155;10,156,157;26,158;2,159;20,160,161;18,160,161;10,162,157;10,163,164;2,165,88;10,166,164;10,167,157;21,168,169;10,170,171;8,172;20,173;10,174,157;10,175,176;10,177,157;18,178;27;10,179,157;10,180,157;10,181,157;10,182,157;10,183,157;10,184,176;10,185,157;10,186,157;20,187;28,188;20,189;20,190;2,191,192;21,193,194;21,195,196,109;13,197;10,198,9;18,199;18,190;16,200,201;20,202;10,203,176;10,204,176;10,205,176;27,206,9,207;18,208;10,209,176;18,210;10,211,157;18,202;10,212,157;10,213,90;10,214,176;10,215,176;2,216,217,7;2,218,219,7;10,220,221;10,222,157;18,223;10,224,157;10,225,157;10,226,157;10,227,176;10,228,157;18,229;26,230;10,231,157;10,232,157;10,233,157;10,234,176;10,235,90;10,236,176;10,237,157;10,238,176;10,239,157;10,240,157;10,241,9;10,242,176;10,243,157;10,244,176;10,245,157;10,246,157;10,247,176;10,248,157;10,249,157;10,250,176;10,251,176;10,252,176;10,253,176;10,254,176;10,255,176;10,256,157;10,257,157;2,258,219;10,259,176;18,260;27,261,192;10,262,176;10,263,157;25,264,265;10,266,176;10,267,157;10,268,157;10,269,157;2,270,271;2,272,192;10,273,176;10,274,157;10,275,176;10,276,157;22,277,1,278,115,279;10,280,41;10,281,90;10,282,176;10,283,157;10,284,176;10,285,221;10,286,176;10,287,157;10,288,157;10,289,157;10,290,176;10,291,157;10,292,157;10,293,176;10,294,221;10,295,176;10,296,157;10,297,157;10,298,157;10,299,157;10,300,176;10,301,157;2,302,219,7;10,303,176;10,304,9;10,305,176;10,306,157;10,307,157;18,308;10,309,176;10,310,157;10,311,176;10,312,157;10,313,157;10,314,176;10,315,157;10,316,157;10,317,176;10,318,157;10,319,157;10,320,157;10,321,176;10,322,157;2,323,192,7;2,324,219,7;10,325,157;20,199;2,326,192,7;10,327,176;10,328,157;20,329;2,191,330,7;2,191,331,7;10,332,157;19,333;10,334,176;10,335,157;10,336,176;18,337;10,338,157;10,339,176;10,340,157;10,341,176;10,342,157;10,343,176;10,344,157;10,345,176;10,346,157;10,347,157;14,348,349;10,350,34;2,5,271,7;2,351,352,7;10,353,176;10,354,157;10,355,157;2,356,192,7;18,357;10,358,176;10,359,176;10,360,157;10,361,157;10,362,176;10,363,157;10,364,157;10,365,34;10,366,157;10,367,157;10,368,176;10,369,157;25,264,370;10,371,157;10,372,41;10,373,157;10,374,157;10,375,157;10,376,157;25,264,9,377,378;10,379,176;10,380,157;10,381,176;10,382,157;10,383,176;10,384,157;10,385,90;22,386,387,388,115,389;10,390,176;10,391,157;10,392,157;10,393,90;10,394,34;10,395,157;10,396,157;10,397,164;10,398,41;10,399,41;10,400,41;10,401,41;8,402;3,403,9,3,404;25,149,405;28,406,88;8,407,408;25,149,409;28,410,411;20,412;10,413,1;20,414;10,415,9;28,416;26,417;8,418;5,419,176,420;5,421,176,420;5,422,176,420;8,423,424;8,425;8,426;4,427,9,3,420;11,428,31;26,429;26,430;25,9,416;19,416;10,431,171;13,432,433;13,434;19,435;19,436;26,437;22,26,1,438,115,439;2,9,411;26,440;29,441;10,442,41;30;26,443;13,444;20,445;25,264,446;29,447;13,448,440;26,449;26,450;26,451;29,452;26,453;25,264,454;25,149,455;19,456,457;26,458;26,459;29,460;18,461;10,462,157;13,277,463;13,97,464;2,465,192;26,466;26,444;25,149,467;26,468;26,469;26,40;29,470;2,471,192;25,9,472;26,473;26,474;13,79,475;26,476;16,477,478;13,448,479;29,444;26,480;26,481;25,149,482;25,149,483;13,484,485;28,486;18,173;10,487,90;10,488,157;20,489;13,448,490;13,491,484;26,492;26,493;13,448,494;29,495;29,496;13,497,485;26,498;25,9,465;13,448,499;25,9,500;13,501,502;26,503;19,475;13,504,475;29,493;26,434;13,432,505;26,506;26,507;29,508;29,509;13,510,511;2,512,513;16,467,61;26,96;10,514,34;10,515,34;26,516;10,517,221;21,518;26,519;25,520,521;26,522;13,448,523;13,448,524;13,448,41;26,525;26,526;10,527,34;26,491;13,467,444;26,528;26,529;26,530;10,531,9;10,532,34;29,533;10,534,90;29,535;29,536;29,537;10,538,90;26,539;13,448,500;29,540;26,504;21,541,542,543;10,544,164;2;29,545;26,546;25,9,444;26,547;10,548,34;26,549;13,506;26,550;13,551,552;29,553;28,554;13,448,555;27,556;26,557;29,558;19,559;10,526,90;26,560;19,561;26,562;10,563,157;10,564,90;29,565;25,264,566;25,567,568;13,504,569;29,570;13,97,571;10,40,164;10,572,9;10,573,9;10,574,387;25,575;19,576;26,577;19,578,579;10,580,90;26,581;25,9,582;13,448,583;10,584,9;26,585;16,417,586;25,149,587;17,588;25,589;16,504,590;26,591;10,592,157;10,593,171;16,277,594;2,595,596;2,597,457,7;10,598,90;19,599,1;10,600,157;10,42,171;26,601;10,120,34;13,602,479;10,603,90;13,432,604;29,605;10,606,607;25,9,608;26,609;19,610,457;13,79,457;19,611,612;26,613;13,45,484;10,614,90;13,504,615;28,465;25,9,616;26,617;29,618;10,619,34;26,620;13,621;13,45,622;13,623,624;25,625,626;19,627;26,628;26,629;31,630;26,631;26,632;26,633;10,634,157;13,510,41;10,635,157;29,636;2,637;27,638;19,277,219;26,639;26,640;26,641;13,501,642;29,643;29,644;10,645,34;19,646,647;10,648,90;10,649,34;27,650,651;13,466,120;25,149,652;27,653,579;29,654;29,506;26,655;25,264,626;26,656;10,657,34;25,149,579;13,658,568;13,45;26,659;19,660;29,661;29,662;25,663,664;13,665,666;29,667;25,149,416;13,432,668;26,669;10,670,34;26,603;19,658,457;13,491,45;26,671;29,672;19,673;19,674;26,535;31,506;10,675,9;19,501,1;25,676,664;25,9,627;13,432,469;13,469,677;26,678;26,679;26,680;10,681,90;10,40,157;19,646,579;26,682;25,149,646;25,683,684;13,685,518;29,686;21,687,688;19,689,219;13,690,691;10,692,34;12,616;26,120;13,693;25,9,694;26,695;10,551,90;25,696,697;29,698;19,699,700;13,603;13,79,701;20,702;13,703,704;19,705,579;25,149,706;13,448,707;10,434,90;19,708;25,9,709;19,709;13,448,436;29,96;19,710,271;25,711,712;19,713,88;13,79,277;19,714,579;12,715;13,432,716;12,717;10,718,176;10,719,9;26,720;29,721;19,722,723;13,510,120;10,724,157;26,725;27,726,579;26,727;10,728,34;18,729;19,730;2,731,192,207;10,120,157;10,732,9;8,192,733;12,9,734;13,26,45;13,469;29,735;18,736;10,737,41;13,448,738;10,739,34;10,526,157;26,740;19,705,741;19,742;26,743;25,711,744;26,745;18,746;10,747,157;26,748;13,467,469;25,625,749;10,750,90;12,751;13,491,752;26,447;20,753;10,754,34;26,755;13,510,756;18,757;10,758,157;25,9,759;29,760;19,761,271;13,448,762;26,763;27,9,764;26,765;27,9,9,1;19,766;13,510,767;18,768;13,769,512;13,467;25,9,770;26,771;10,772,9;10,773,9;10,774,9;13,448,769;26,775;16,716,776;25,520,777;25,711,778;13,557,779;26,780;25,520,465;13,448,781;13,79,782;26,783;29,784;19,465,579;26,785;13,501,504;29,469;21,786,787;13,788;13,45,491;13,386,789;29,484;21,790,791;26,792;26,716;28,793,457;19,272,794;10,795,34;10,796,157;13,448,797;26,798;10,469,171;26,799;25,800,616;10,801,90;26,565;26,802;29,803;21,804,805;27,806,192;10,807,34;10,808,157;25,264,809;19,810,88;13,565;26,811;25,149,812;13,813;10,814,41;26,815;13,448,444;25,149,816;19,500,219;19,817,818;18,819;29,807;19,820,1;27,821;13,510,822;13,823,824;10,825,34;26,826;26,827;26,828;19,829,457;20,272;10,830,34;29,831;19,832;28,833,457;29,834;19,465;12,835,734;13,510,836;29,837;10,45,157;25,9,81;26,838;10,839,157;19,840,387;10,841,157;13,510,272;10,842,157;18,753;25,711,843;13,497,484;13,386,844;26,845;2,846,513;10,847,221;26,848;26,618;13,448,849;10,120,387;10,850,387;19,851;21,852;29,853;8,854,855;13,856,777;19,448;19,857,457;29,628;29,858;19,810;13,510,859;10,860,1;10,272,90;29,861;25,264,862;26,863;13,864,630;10,865,90;29,866;19,416,1;25,9,867;19,868;10,869,157;13,432,870;10,522,387;13,79,871;13,79,872;29,873;13,557,871;13,97,874;26,875;16,497,876;19,877,878;28,879;21,687,880;29,881;13,504,882;19,412;13,432,883;25,264,465;10,884,34;20,173,753;26,839;19,885,88;26,886;26,887;26,888;19,500;26,889;29,890;27,9,9,7;10,891,164;13,892;13,467,518;26,893;10,894,90;16,895,61;10,774,41;10,522,34;19,810,411;26,896;13,510,897;10,898,90;13,510,899;13,510,900;19,901,579;19,902,457;26,903;29,904;13,448,905;13,448,906;13,448,897;19,898;13,510,907;13,448,908;13,510,722;29,909;20,190,140,141;19,171,513;25,149,910;25,149,911;13,501,646;19,705,352;19,912,271;27,860;10,913,1;19,914,352;19,705,217;25,264,749;12,915;29,491;26,916;10,917,34;13,448,120;20,918;19,919;25,920,921;19,922;10,923,157;13,448,924;19,705,457;13,504,925;10,926,157;10,927,157;25,711,928;13,497,45;10,929,90;29,930;2,931;29,932;13,685,569;29,933;10,934,34;10,96,157;10,935,157;19,716,352;19,479;29,936;19,937;10,938,157;19,939,579;10,940,90;29,934;25,149,941;28,705,219;26,942;26,943;25,944,945;29,946;26,947;16,504,61;21,518,948;2,949;29,950;10,951,90;13,477,622;13,448,952;28,953,954;10,955,9;26,484;13,448,956;10,909,90;10,957,90;19,958;18,272;19,959;13,823,264;13,510,960;13,188,691;26,961;12,962,1;10,963,90;10,690,90;27,638,192;10,964,34;25,520,965;19,966,651;10,967,34;19,968;2,9,9,207;19,969,88;19,970,411;25,264,216;26,571;10,971,1;10,831,157;26,972;27,637;19,973;27,9,9,207;10,974,1;25,264,616;26,975;26,976;13,96;13,448,977;12,978;26,497;13,979,980;13,623,759;27,981,457;29,982;25,983,759;10,984,157;13,94,897;10,985,1;25,264,986;12,120,387,987;20,988;25,264;10,989,34;13,990;13,991;13,992;13,993;25,711,994;26,995;19,996,387;12,997;13,853;26,998;12,999;10,1000,157;26,1001;26,1002;19,1003;10,1004,157;28,1005,457;25,625,1006;10,1007,34;26,227;13,432,777;13,716,1008;29,1009;10,500,34;26,1010;13,823,1011;26,467;10,1012,9;10,1013,9;10,1014,34;16,45,61;26,904;19,1015;13,510,1016;13,45,618;13,1017,465;19,1018;18,1019;21,687,1020;18,1021;19,960,579;16,97,61;26,1022;25,711,1023;19,1023;13,448,767;19,895,457;10,1024,1;10,1025,90;10,1026,90;10,1027,34;26,1028;19,120,1029;25,1030;26,1031;19,1032;19,171;13,504,1033;13,79,1034;26,1035;26,1036;26,1037;13,623,627;29,1038;10,1039,607;26,1040;13,504,1041;13,97,1042;26,1043;10,1044,90;10,1045,90;10,1046,171;16,510,1047;10,1048,90;10,1049,34;2,949,457,7;29,1050;26,777;12,1051;26,1052;20,173,1053;19,416,612;13,510,1054;13,504,1055;13,510,1056;29,1057;26,722;13,823,646;12,445,387;26,1058;26,1059;25,445,759;28,1060,457;19,514;13,386,43;26,77;10,1061,34;10,1062,34;19,1063;26,545;26,1064;25,149,1065;25,1066,465;26,1067;10,1068,90;13,511,787;26,1069;26,82;10,1037,157;26,1070;31,1071;26,1072;29,1073;10,1074,90;29,1075;10,1076,387;31,272;21,1077,1078;13,81,874;13,1033,874;29,1079;10,96,34;19,1080;12,272;10,1081,387;26,1082;29,1083;19,1084;10,1085,90;13,469,687;26,1086;13,1087;13,823,1088;10,1089,164;13,685,1090;13,94,1091;19,1092;20,1093;13,432,41;19,1094;29,1095;29,1096;25,711,1097;29,1098;13,448,870;13,1099,960;13,504,960;26,1100;13,510,1101;12,1102,734,987;29,120;10,1103,90;29,1104;25,1105,1106;13,448,1107;19,705;26,1108;8,1109;28,1110;13,94,1111;26,1112;13,504,582;26,1113;10,1114,90;13,511,1115;10,649,90;10,1116,221;19,870;16,405,1117;19,1118;26,1119;19,1120;19,1121,579;20,1122;10,955,41;13,544;25,9,1123;26,807;21,1124;26,1125;13,618,571;13,1126;20,1127;26,1128;19,1129;10,1130,9;25,944;10,261,90;29,1131;19,1132;28,1132;25,264,1133;26,1134;13,1135;13,504,1136;25,9,479;26,1137;28,543,741;28,1138;10,1139,41;13,507,1140;25,149,1090;13,510,1141;19,1142;10,1143,90;28,1144;29,1145;19,795;19,9,387;25,9,1146;10,460,90;19,41;19,909,387;13,448,1147;29,911;13,448,1148;13,432,1113;19,807;10,1149,9;26,1150;10,1151,157;26,1152;13,432,120;27,1153;2,1153;26,1154;13,497,1155;19,646;25,9,1156;10,96,90;13,895,1111;13,432,1003;27,1157;10,1158,1;19,1159;18,190,140;26,1160;19,1161,579;28,759;28,767;26,1162;8,1163;27,9,192,1;10,526,164;19,996;25,264,777;13,448,79;13,510,1164;13,448,272;13,432,767;13,448,1165;13,97,627;13,448,94;10,1166,90;18,1167;10,1168,176;18,1169;10,1170,34;16,1171,1172;5,1173,1174,1172;8,1175;10,1176,41;10,1177,157;10,1178,157;25,1179;8,407,1180;19,1181,647;19,151;13,1182;13,79,1183;13,1184;25,1066,1107;26,1185;13,448,1186;19,1187,1;19,646,1188;25,149,41;10,1189,34;25,711,1086;10,1190,176;25,149,759;19,1191;25,711,469;13,448,1192;13,510,1193;10,1194,90;10,412,171;13,504,120;18,1195;27,1196,457;19,1197,1;26,930;28,1060;28,787;25,1198;26,1199;13,448,469;26,1200;10,1201,34;19,599,878;10,1202,90;10,1203,90;10,1204,34;10,272,171;12,1205;13,1206,777;32;29,1207;13,864,870;13,448,1208;21,1209;31,742;25,264,1210;26,1068;13,448,1211;13,97,484;13,448,467;25,264,9,377,1212;19,1213;18,412;10,1214,157;26,891;26,1215;10,1216,90;13,839;13,1217;21,687,1218;21,687,1219;21,687,1220;13,97,1221;26,1222;26,1223;13,497,1224;25,9,436;25,846,568;19,1225;16,893,1226;10,1227,171;19,759;13,658,356;26,1228;26,1229;21,852,1230;13,501,824;19,1231,88;13,277,1232;13,448,1233;19,1234;25,9,272;26,1129;13,448,1235;29,1236;25,264,1237;10,1238,90;19,1148;25,149,1239;28,412;10,1240,90;19,1241,457;20,1242;10,1243,34;13,448,1159;13,432,1159;19,1244;8,1245;19,1241;25,149,1246;10,1247,90;10,1248,90;13,467,120;19,911;13,510,646;10,1249,34;26,1184;26,1250;26,1251;13,504,1252;10,444,41;26,1253;10,1254,171;13,501,1255;13,432,264;10,1256,90;13,484,478;19,813;25,9,469;19,1257;12,1258;19,1259;27,653,192,7;26,1145;10,1260,171;10,412,164;10,1261,41;26,1262;12,1263;19,1264;19,691;10,96,171;25,711,870;10,1265,387;26,1266;26,511;10,1267,34;26,1268;26,1269;19,722;26,1270;25,149,1159;8,1271;25,1272,1273;2,1274,192,7;13,1275;19,1276,1;19,272;13,448,1277;25,1278,1279;25,711,807;16,618,61;2,9,411,1;26,470;26,1280;10,1281,90;26,1282;12,1283;21,1284,1285;13,501,1159;13,501,1286;13,501,499;13,823,807;28,937;10,963,34;29,1287;10,1288,41;14,1289,1290,1291,1292;26,1293;27,846,192,207;19,722,579;22,1181,1,1294,115,1181;10,1295,164;14,417,1296;27,726,192,207;10,1297,1;2,1298,192,7;27,1299,192,7;27,1300,192,207;2,1301,192,207;26,1287;27,846,192,7;27,1302,192,207;31,1303;25,813,1304;8,1305;2,1306,192;10,1307,90;13,501,1308;13,539,639;13,467,412;8,1309;8,1310;8,1311;31,1312;19,1313;20,1314;13,1315,1316;19,1317;20,190,9,1318;10,1319,164;13,1315,937;20,1320;25,149,1321;13,501,1316;13,501,272;12,1322;10,1323,90;26,1324;21,1325,1326;21,1325,1327,109;21,518,1328,109;10,1329,90;21,1330,1331;25,813,1332;20,1333;27,821,192,7;26,991;26,1334;16,277,1335;27,1300,192,7;2,1336,192,7;27,726,192,7;25,711,694;19,1192;25,149,1337;31,807;21,687,1338;25,711,1339;25,711,810;19,465,88;29,1340;21,1284,9,109;12,1341;10,785,41;18,777;29,1342;25,9,568;10,1343,157;2,1344;10,1345,34;10,1346,157;10,993,157;25,1347,626;25,1348,1349;2,9,192,1350;24,484,1351,34;29,1315;16,417,1352;26,1353;27,1300,457,7;27,1300,1354,7;25,264,1031;13,504,1339;21,1355,1356,109;26,992;27,1024,192,7;25,1347;19,1323;20,1357;10,1358,90;25,1359,1360;10,722,1361;18,1362;13,1363,1364;25,711,610;19,903;27,1365,192,7;2,1107,192,7;31,416;26,1366;25,813,726;27,1367,192,7;12,1368;25,149,1369;26,1370;21,518,1371;31,965;16,510,807;12,9,1029;27,1372,192;26,1288;2,846,192,7;13,1373,1374;12,1375;2,1107,192;19,1376;20,1377;12,445,734;19,9,579;19,445,457;10,1378,1;12,1379;31,1380;25,711,1381;21,518,1382;26,1383;22,1384,1,1385,115,1066;25,264,1386;25,264,9,377,1387;26,1321;26,1388;20,1389;18,1390;31,412;20,1391;12,1392;27,9,192,207;2,9,192,207;20,412,1393;10,1394,171;14,1395,1396;19,1397;25,264,479;25,264,1398;19,1399;13,658,1400;10,1401,41;25,711,444;27,653;10,1402,90;23,927,1403;21,687,1404,109;25,264,1405;27,653,457,7;20,1406;25,813;2,9,612;13,79,972;16,685,807;10,1407,1292;27,653,457;2,949,457;13,24,94;20,736;28,1322;28,1408;13,504,807;16,510,1409;4,1410,9,3,1411;12,1412;25,264,504;18,1127,140;25,711,1413;13,504,1413;19,1414,88;19,1415,734;19,1415;10,1416,157;19,218,734;10,1417,34;19,1418;26,1419;16,97,882;16,94,1420;16,94,1421;16,94,1422;13,79,1423;10,1424,176;10,1425,157;13,1426;8,1427;24,45,133,9,115,1428;25,264,568;13,45,1429;24,45,133,9,115,1430;29,839;13,448,568;13,44,1099;25,9,1431;13,79,615;13,1432,615;13,504,1433;13,504,1434;13,504,615,1435;15,1436,1437,60,1438;13,539,1439;26,1440;12,1441;26,1442;25,9,566;19,1443;16,504,1444;10,1445,9;26,1446;29,1447;28,445;10,1448,41;19,1090;29,1449;13,97,1450;13,26,980;13,1451,980;25,9,980;13,97,980;13,497,1452;16,94,1453;13,26,1099;13,1373,980;16,405,1454;13,1363,1455;26,1456;26,1457;13,1099,26;13,1099,980;13,1017,43;13,405,980;13,491,1458;16,94,1459;13,97,1460;18,1461;16,571,1462;13,44,45,1435;13,81,1463;13,42,1464,1435;13,511,1465;16,469,1466;13,24,43;13,501,1467;25,625,1468;12,1469;10,1470,221;19,1471;16,685,1472;25,1473,5,377,1474;10,1475,90;10,1476,1477;10,1478,157;25,149,1479;27,1300;12,1480;10,1481,34;25,9,1482;19,1181;19,502,579;31,1483;25,149,937;16,658,1484;26,1485;15,864,1486,60;19,1487;29,1488;13,1162,1003;13,1162,1003,1435;25,149,1489;19,478;20,1490,140,1491;18,1490,140;25,711,1492;15,50,1493,148,1494;10,1495,34;13,504,827;13,504,1496;26,1497;10,1496,157;9,1498;9,1499;13,504,1500,1435;25,1501,1159;13,1496;10,1502,41,1291,1503;14,1504,1505;10,1506,90;10,1507;33,569,1508;20,1509;19,1510;19,1511;19,1512;19,1513,219;22,1514,387,9,115,1515;18,1516;10,1517,157;10,1518,157;8,1519;22,1514,387,1520,115,1521;22,1514,387,1522,115,1521;31,1523;33,569,1524;19,5,88;15,1514,1525,148;25,149,1510;13,504,1526;10,1119,157;10,1527,387;8,1528;10,1529,34;10,1530,34;34,1531,3,1532;10,1533,41;10,1534,34;27,1535,192,7;10,1536,164;29,1537;26,1538;21,673,1539;10,1540,171;10,1206,171;24,1541,1542,9,115,776;16,1543,465;14,1544,1545;10,1546,387;16,504,1547;25,149,1548;10,1549,1;13,448,497;31,188;2,1550,192,7;13,1551;26,1552;3,1553,9,3,1554;25,711,1555;3,1556,9,3,1557;10,1558,90;10,1559,90;13,1206,1560;13,823,1561;3,1562,9,3,1563;3,1564,9,3,1565;20,1566;28,436;10,1567,34;8,1568;8,1569;25,264,1570;19,1513,271;35,1571,3,1572;20,1573,1574;19,1575;10,1576,34;10,1577,41;25,264,1578,377,1294;19,1579;22,510,1,1580,115,1581;20,1582;19,1583;25,264,758;19,758;25,149,1584;25,9,1585;25,711,1586;10,1587,90;19,1588;10,1589,34;8,1590;13,501,996;25,711,996;13,504,1591;13,623,417;12,1592;9,1593;13,823,1594;10,1595,221;16,79,467;25,1596,1597;14,1598,1599;3,272,9,3,1600;10,1601,90;20,1602;16,504,1603;12,616,387,987;13,823,1604;19,1584;13,823,1031;10,1605,41;10,1606,164;19,1607;10,1608,34;13,432,405;13,501,870;10,1609,34;26,1610;13,510,1611;26,1612;27,1613;2,1614;19,1615;28,1615;10,1616,171;19,810,457;25,149,1617;19,1618;19,904;19,1619,1;13,510,412;13,484,1620;31,436;19,432;25,520,1621;13,685,767;13,448,1622;13,386,571;19,445;28,120;21,852,1623;2,726;25,711,1624;13,497,1625;10,1626,387;10,1627,34;10,1628,34;13,504,485;10,1629,171;13,448,1630;26,1631;10,1632,34;10,1633,34;19,909;26,1622;26,1634;26,1635;26,1636;13,812,94;10,1637,1;10,1638,34;19,1639;19,1640;13,448,1241;31,870;19,1641;13,448,1642;16,448,1454;10,1643,171;13,557,511;16,1644,1645;16,504,1646;25,149,569;31,1647;13,448,1648;13,623,1649;13,448,1650;10,1651,157;10,1652,157;20,777;29,1653;12,1654;14,1655,1656;19,1657;13,467,416;13,510,1658;13,864,1659;10,1660,607;19,1208,457;26,1661;25,9,1662;10,1663,41;10,1664,157;27,726,192;19,1184;13,277,416;25,149,1054;26,1658;13,448,1665;13,571,1666;10,1667,34;25,9,1668;26,1669;10,1670,176;10,1671,90;10,1672,387;10,1673,176;10,1674,176;10,1675,387;8,1676;10,1677,157;13,79,1678;26,1679;25,711,120;31,709;10,1680,90;10,1681,41;19,1591,878;10,1682,157;28,742;10,943,34;18,1683;29,1684;19,1685;26,1686;8,1687,1688;36,1689,9,1690;8,1691;8,1692;37,1693,1694;29,1695;19,1696;19,1697;19,1698;13,467,1699;10,1700,607;27,1701;29,1702;10,653,1;13,448,1703;16,97,911;19,1704;25,264,444;10,491,157;26,1705;13,467,1706;10,1707,9;26,940;19,1597;19,1708;26,1709;26,1710;26,1033;13,97,1262;19,827;19,1711,878;19,1712,88;19,1713,457;26,1143;16,94,1714;8,1715;19,1591;25,1501;21,687,1716;10,1717,1;25,1348;19,1718;19,1719;19,1720,457;25,149,1721;19,1722;21,518,1723,109;10,1724,157;19,1725;26,1726;13,470;2,1727,1728;21,1729,1730;26,1731;19,1732;13,1009,1733;8,1734;25,264,1431;27,1735,457,7;10,1736,9;8,1737;8,1738;36,1739,9,1690;8,1740;10,1741,157;10,1742,90;19,1743;26,1744;27,9,9,1745;2,9,1746,1;28,1591;21,687,1747,109;19,1748,411;25,711,479;13,1749;25,711,45;13,510,1294;25,9,1750;21,518,1751;12,1752,387;26,1753;25,1754;26,1755;26,435;10,1756,34;10,1757,157;10,1758,90;19,1759;13,1760;13,448,1761;29,1538;31,479;25,800,484;19,1762,700;10,1763,90;10,1764,90;29,1586;26,1765;13,1766,1767;26,1768;26,1769;26,1770;13,497,1771;10,1772,41;13,386,1773;13,1774;29,551;19,1775;18,1776;14,1777,1778;14,1779,1780;10,1781,34;10,1782,34;25,9,1783;16,79,807;10,416,1;26,1784;28,1785,457;13,497,1786;29,1787;10,497,164;25,264,1788;13,1789;10,1790,34;10,1791,34;13,432,272;13,685,334;2,1792,1793;10,1794,157;26,1795;26,1796;25,1596;25,9,1797;16,94,9;10,1067,90;13,467,24;28,510,411;16,432,1003;8,1798;13,504,1799;10,1800,9;10,1801,1;25,264,1217;19,24;16,26,1802;13,97,630;20,1803;13,510,807;25,149,892;13,432,1193;19,1804;20,1805;25,711,1806;10,1807,157;13,571,1808;16,972,61;26,619;13,448,1615;24,45,1809,1810;8,1811;20,1812,9,1813;16,839,1814;21,1815,1816;13,504,1659;25,1817,1818;27,1819;25,813,216;25,813,1820;13,484,759;10,1821,90;10,1822,157;13,432,897;37,1823,1824;8,1825,1826;36,1827,9,1828;20,1829;13,497,478;19,1830;16,557,9;26,1831;19,1832;26,844;16,557,1833;26,1834;27,465;16,895,467;25,711,759;21,687,1835;19,1836;25,264,960;27,1837;13,484,45;26,898;26,1838;29,1839;10,1840,157;10,1841,387;10,1842,9;18,1843;20,1843;19,9,271;26,1537;13,716,1844;25,1066,41;13,1845;27,1846;26,1847;25,1848,1849;21,687,1850;2,1851;13,24,1852;13,510,1853;18,1854;13,823,412;27,1855;27,1856;21,1330,1857;13,448,599;25,1066,594;25,264,1858;2,1859,271;13,24,1860;26,1861;21,1077,1862,1863;18,173,140;38,1864,3,1865;3,1866,9,3,1865;8,1867;27,1868;28,1869;27,1870;13,504,1871;10,1215,157;19,1872;19,1873;27,1874;20,1875;13,510,1876;20,1877;26,26;27,1701,1878,1879;8,1880;26,1881;13,557,506;13,1882;10,673,157;10,1883,157;13,504,1884;16,97,478;2,1885;19,1886;20,1887;10,1672,1888;10,1889,41;19,964;13,504,433;16,504,1890;13,477,630;10,1891,1;25,800,1892;19,1893;25,264,1293;3,1894,9,3,1895;27,1896;27,1024,192;19,1897;16,839;19,1127;25,149,903;25,1066,1898;26,1899;26,553;27,1900;13,448,412;12,1901;20,1902;21,1903,1904,109;39,173,1905;10,1906,176;10,1907,157;19,1908;28,1909;20,1910;13,510,1911;16,1912,1913;13,823,1914;19,1915,579;10,1916,34;2,465,217;2,810,723;16,97,9;10,1917,34;16,94,1802;27,1918;16,448,61;26,1919;18,1920;19,1921;26,1922;10,1856,1;16,97,776;16,79,272;16,94,61;10,1885,164;26,1839;25,1923;26,1924;10,1925,387;13,504,416;13,501,478;16,1926,1927;13,1928;16,1929,405;12,1930;2,1931,1728;16,477,776;2,1775,192;10,1932,157;19,1933,219;16,24,61;21,518,1934;18,445;13,1162;12,445,1;20,1657;13,510,1017;13,510,466;10,1935,157;20,215;19,1936;13,448,24;13,510,594;18,1937;25,149,1938;26,551;8,1939;8,1940;29,1162;25,149,1941;18,1942;13,467,787;13,504,1943;26,1944;16,1055,467;26,25;16,504,882;19,1945;18,1657;13,685,1946;21,687,1947,109;21,1948,1949,109;18,1950;21,1330,805;27,726,9,207;10,1951,221;21,1330,1952;13,448,1953;2,1954,219;25,149,568;13,277,465;26,1955;25,264,1956;10,1957,90;2,1958,192;2,1959,192;10,1960,1;13,1961;13,511;16,24,776;26,1962;13,510,870;20,1963;18,1964;13,79,1965;2,1966,192;10,1967,157;10,1968,90;19,1969;40,173,1970,1491;25,711,1583;25,9,1971;13,623,742;25,1066;26,1972;13,1973;13,94,996;13,432,1911;10,1974,34;10,1975,34;25,9,1976;2,1977,217,207;10,1978,90;10,1979,9;25,1179,9,377,1980;28,1981;16,97,465;10,1982,176;10,1983,90;27,1984;31,120;13,501,777;19,1985;2,653;13,1986;13,97,497;8,272;37,1987,1988;2,1989,457,7;20,173,140,141;20,1990;19,1991;25,149,1992;21,1993,1994,109;10,1995,157;27,726;16,467,1996;20,1997;2,436,513;26,1998;29,1999;8,2000;13,448,2001;26,2002;19,2003;16,504,2004;27,1274;10,2005,34;13,188,2006;13,448,807;19,2007;27,1933;10,272,41;10,1010,41;26,2008;13,81,485;13,432,1873;13,504,2009;19,2010;13,497,1003;10,96,607;10,2011,41;20,2012;18,2013;10,2014,387;26,2015;26,2016;29,2017;19,2018;10,940,157;13,864,484;12,2019;25,2020,1892;13,823,2021;10,2022,157;19,2023;10,2024,41;10,2025,90;12,2026;28,272;26,2027;13,448,2028;26,2029;2,2030,192;29,1028;26,2031;28,2032;21,518,9,109;29,2033;25,416;10,2034,90;26,2035;13,504,2036;27,2037;13,511,2038;19,705,2039;2,1359,219;13,497,630;10,2040,90;26,2041;18,2042;25,264,2043;18,1341;26,1247;20,2044;26,2045;26,405;19,687;16,477,2046;26,2047;26,2048;13,1373,777;26,2049;31,777;13,97,2050;13,557,2051;13,386,1042;27,2052,878,207;13,510,937;16,504,1454;26,2053;26,2054;13,448,2055;13,504,444;27,2056;13,2057,691;10,2058,90;13,2059;19,2060;18,1490;13,448,2061;16,504,2062;19,1513;13,2063,120;26,2064;10,2065,90;20,2066;22,2067,1,2068,115,2069;20,412,2070;13,2071;10,2072,34;10,2073,157;2,2074,579;21,687,2075,109;25,711,674;8,2076;13,2077,1119;19,171,734;27,1024;29,868;10,2078,164;13,2079;25,264,2080;10,777,41;13,504,870;19,9,88;19,582;2,5,219;20,2081;22,2082,1,157,115,582;10,1984,1;12,2083;26,2033;29,1679;13,510,2084;10,1206,9;10,2085,90;8,2086;8,2087;3,2086,9,3,2088;36,2089,9,1690;36,2089,9,2090;13,26,2091;25,264,2092;25,149,120;18,1314;18,2093;25,9,97;25,711,2094;10,2095,1;18,2096;26,517;13,45,2097;19,642;28,2098;13,448,2099;13,504,1090;21,687,2100;19,1933;10,2101,1;27,653,192,207;19,2102;19,2103,271;12,2104;21,1330,2105;21,1330,2106;13,2015;10,2107,90;10,2108,1;8,2109;16,844;20,2110;21,2111,2112;21,2111,2113;21,2111,2114;21,2111,2115;25,149,571;25,149,499;25,9,911;28,2116;25,9,2116;25,9,2117;21,1330,2118;10,2119,41;29,2120;19,2121;16,448,2122;10,2123,157;20,2124;8,2125;8,2126;19,2127;10,2128,1;13,2129,777;25,9,1148;31,2130;22,277,1,157,115,120;19,810,271;20,2131;10,2132,157;10,891,157;28,1192;10,2133,34;13,722;20,2134;21,1330,2135;10,2136,34;29,2137;19,167;10,2138,221;25,264,2139;10,2140,90;10,2141,157;10,2142,34;2,2143,217;29,2144;25,813,893;26,2145;22,121,1,2146,115,2147;27,860,9,207;18,2148;19,1713;13,2149;26,1339;25,711,2150;10,2151,2152;21,673,2153,109;21,687,2154,109;20,2155;20,2156;13,432,1148;19,2157;19,264;13,557,94;6,2158,2159,2160;19,2161;10,2162,90;41,2163;19,2164;19,2165;12,2166;16,504,2167;25,9,2168;13,448,2169;28,2170;13,448,972;19,444;19,2171;19,2172;13,432,167;20,2173;25,149,2174;10,821,1;10,2175,157;15,864,2176;16,823,1927;16,1610,61;16,1451,807;19,2177;19,2178;8,2179;8,2180;13,539;19,2181;8,2182;31,2183;13,1679;19,2184;13,504,2185;37,2186,2187;13,1099,1832;10,2188,34;10,2189,34;19,610;12,2190;27,2191;31,497;10,2192,90;13,45,2193;2,2194,2195,7;19,1192,878;10,2196,34;10,2197,90;20,2198;10,964,157;8,2199;25,2200;20,2201;29,845;25,711,2202;10,2203,221;25,711,173;10,2204,34;31,1159;27,2205;0,2206,1,2207;22,2208,1,2209,115,2210;2,2211,192;27,2212,192;19,2213;13,504,479;10,2214,34;25,149,777;29,2215;29,2216;8,2217;29,2015;13,448,526;19,2218;19,1192,818;26,2219;27,2220,192,7;19,430;16,45,2221;13,504,264;10,1944,157;25,711,2222;10,2223,90;16,277,2224;12,2225;19,2226;21,467,2227;19,630;16,79,2228;26,2229;21,518,2230;25,1066,2231;19,2232;10,2233,221;25,711,2234;19,2235;19,1189;19,2236;16,45,864;20,2237,2238;19,2239;19,2240;10,2241,1;10,2242,90;19,502;13,823,2243;16,2244,2245;26,2246;29,601;10,827,90;29,2247;10,2248,2039;27,465,192,7;13,2249,416;16,2250,2251;25,149,510;28,882;10,866,157;16,972,2252;19,2253;13,501,1165;26,1397;19,2254;29,2255;29,2256;21,687,2257;8,2258;26,2259;14,417,2260;10,2261,90;14,2262,2263;15,2264,2265;27,726,457,7;10,2266,41;10,2267,41;10,2268,41;22,823,1,2269,115,1348;2,2270,192;18,2271;10,2272,387;10,2273,387;19,2274;13,623,448;19,594;16,504,807;21,518,2275;10,2276,1;29,2277;12,2278,387;25,711,2279;10,2280,1;19,2281;19,2282;17,2283;19,2144;10,2284,157;19,2285;10,2286,90;19,2287,2288;10,2289,176;10,2290,176;20,2291;19,859;25,264,2292;19,2293;19,96;10,2294,734;26,2295;26,356;10,2296,2297;19,2298;19,2299;10,2300,157;18,2301;29,726;13,277,120;13,44,465;13,510,2302;29,2303;28,2304;10,2305,157;10,2306,176;42,2307,1060,2308;42,2309,1060,2308;8,2310;3,2310,9,3,2311;20,2312;3,2081,9,3,2313;10,2314,34;10,2315,34;10,2316,34;4,2086,9,3,2088;36,2317,9,2318;19,1775,700;12,9,387;25,264,2319;28,2320;16,484,2321;16,477,448;31,2322;20,2323;25,711,1762;17,445;10,143,171;8,2324;18,2325;6,2326,2327;37,2328,2329;10,2330,2152;10,2331,157;13,432,2332;25,149,2333;10,2334,2335;25,264,2336;8,2337;22,2338,1,41,115,2339;26,2340;10,2341,157;25,625,2342;13,484,2343;13,823,870;16,504,594;2,2344,192;27,2345,192;10,2346,34;21,518,2347,109;25,264,2348;20,2349;10,2350,157;25,149,5;10,1962,157;19,2351;25,149,658;13,504,2352;21,518,2353;29,2354;31,499;29,2043;10,2355,34;10,2356,34;8,2357;3,2357,9,3,2358;25,1023;10,2359,157;19,1617;10,2360,34;27,436,457,7;13,1388;10,2361,1;2,2362;19,2363;19,2364;36,2365,2366,1690;8,2367,2368;26,2369;13,2370;3,2371;8,2371;28,897;13,501,24;10,2372,176;27,2373;20,2374;3,2375,9,3,2376;36,2377,9,2378;8,2379;10,2380,607;13,511,2381;26,2382;13,448,777;13,716,1033;13,2383;19,2384;21,673,2385,109;21,687,2386,109;16,467,2387;10,2388,90;10,2389,164;5,2390,2391,2392;10,2393,1;10,2394,1;10,2395,387;10,2396,9;19,2397;16,79,2398;26,2399;25,149,2156;20,2400,2401;21,687,2402,109;13,504,42;15,24,2403;16,277,2404;18,2405;18,2110,2406;10,2407,41;10,2408,41;25,9,2409;16,504,2410;25,264,2411;4,2412,9,3,2413;4,2414,9,3,2415;4,2416,9,3,2417;4,2418,9,3,2419;4,2420,9,3,2421;12,2422;41,2423;12,2424;10,2425,2152;26,45;19,767;10,2426,1361;10,2229,34;29,1962;10,2427,157;29,1343;10,2428,1;13,501,2429;10,2430,9;20,736,140,141;13,24,120;19,2431;20,2432,140,1491;25,711,2433;13,1370;13,448,2434;2,2297,192,7;18,2435;29,2436;20,2437;10,2438,157;10,2439,34;36,2440,9,1690;19,2441;29,143;13,823,2442;18,2443;27,1792;19,1783;2,2444,457,7;29,1143;27,9,457,7;2,653,192,7;13,448,2445;25,149,272;18,736,140;28,2446;13,42,1468;10,2447,34;25,264,2448;19,2449;2,2450,723;20,2451;21,687,2452,109;12,2453;28,2454;20,2455;20,2456;19,9,2457;19,2458;3,2459,9,3,2460;13,511,2461;10,2462,9;25,264,5,377,2463;18,2464;20,2464;2,759,192;19,749,1;26,2465;13,26,43;13,693,2061;10,2466,90;26,2467;13,448,2363;10,2468,90;18,2469;25,625,972;18,2470;20,2470;18,2471;8,2472;8,2473;19,2474;27,2475;20,2476,140,1491;16,45,2477;20,2478;10,2479,157;10,1407,90;10,2480,90;10,2481,1;10,2482,90;10,2483,157;20,2484;8,192,2485;20,2486;36,2487,9,2488;10,532,157;10,2489,221;13,448,518;20,2490,2491;10,2492,157;25,264,810;13,448,2493;3,2357,9,3,2494;10,2495,41;10,2496,1;8,2497,407;10,2498,2499;16,432,2500;19,2501;19,2502;26,2503;10,2504,90;10,2505,387;10,2506,34;13,448,1023;43;25,9,1597;16,823,1159;10,1881,9;13,864,465;13,26,2507;31,2508;19,2509;26,2510;18,412,140;27,2511,457;2,653,192;19,1181,579;8,2512;10,2513,157;27,1792,192,207;27,653,192;13,448,2514;13,1138,2515;16,24,2516;10,1635,157;19,2517;25,264,2518;26,1763;19,1214;10,2519,221;22,510,1,171,115,2520;25,149,2521;28,2522;19,1622;13,432,2523;10,2524,90;31,485;8,2525;19,2526;16,386,776;10,2527,90;18,2528;10,2529,157;22,510,1,171,115,1148;20,173,2530;13,510,2183,2531;13,823,2532;19,2533;29,2534;10,2535,1;12,2536;25,264,972;19,2537;26,2538;10,2539,387;8,2540;10,2541,90;20,173,9,141;2,1792,457,7;13,432,2542;8,2543;8,2544;8,2545;13,1138,2546;20,2547;19,2548;19,2549;19,2550,700;19,2551;25,711,2552;25,711,416;25,1501,2553;8,2554;8,2555;8,2556;6,2557,9,2558;6,2559,9,2560;6,2561,9,2562;6,2563,9,2562;6,2564,9,2565;6,2566,9,2567;3,2568,9,3,2569;13,504,43;2,1024;3,2570,9,3,2571;10,2572,157;10,2573,1;24,2574,133,2575,115,2576;10,2577,2578;13,1138,2579;19,2580;10,2581,157;22,277,1,2582,115,2583;25,149,2584;10,2585,2586;19,2587;19,2588;20,2589;3,2590,9,3,2591;19,2222;19,2592;16,510,2593;10,2594,9;41,2595;18,2596;27,2597,9,7;10,2598,41;10,1237,41;3,2599,9,3,2600;20,2601;25,264,582;12,2602;13,1774,2603;13,501,1762;13,1373,2604;19,1762;19,40;10,2605,34;10,2606,1;19,2607;13,338,120;25,264,2608,377,2609;37,2610,2329;10,2611,41;20,2612;29,1401;3,2613,9,3,2614;10,1010;3,2615,9,3,2616;25,264,2617;13,510,2618;12,2619;19,504;21,518,2620,543;21,518,2621,543;25,711,2622;13,823,2623;26,1956;8,2624;14,2625,2626;26,2627;13,510,2628;13,510,1023;10,2629,90;10,2630,90;12,2631;25,711,24;8,2632;31,2633;8,2634;13,1009,2635;20,2636;28,582;12,2637;2,9,411,7;12,2638;13,79,2639;10,2640,34;14,2641,2642;21,518,2643;19,2644;10,435,34;28,430;25,264,2645;26,2646;13,557,2647;12,2648,734,987;8,2649;8,2650;10,2651,90;25,264,2652;20,2653;16,504,2654;12,2655;13,2656,2657;28,77;16,504,2658;10,2659,176;16,510,61;10,2660,387;10,2661,387;20,2662;10,2663,176;26,2664;10,2665,157;13,79,510;12,2648;25,711,526;12,2666;12,2667;12,2668;25,264,2669;12,2670;25,149,594;22,658,1,2582,115,2671;22,658,1,2672,115,787;25,711,1883;10,1401,157;8,2673;25,711,919;13,823,777;25,264,2674;13,823,810;3,2675,9,3,2676;20,2677,2678;3,2679,9,3,2680;20,2681;19,2682;24,45,2683,2684;24,45,2685,90;10,2686,157;13,467,972;10,916,157;23,927,2687;25,264,2688;19,2689;36,2690,9,2691;6,2692,9,2693;10,2694,41;13,2695;19,2696;29,2697;9,2698;9,2699;25,264,2700;20,2701;18,2702;26,2703;39,2704,1461;39,2705,2706;39,2707,2708;39,2709,2710;19,2711;18,2712;29,2713;26,2714;19,2715;16,2656,2716;26,1586;26,2639;20,1333,140;8,2717;8,2718;13,510,479;20,2719;13,823,500;10,2720,34;21,518,2721;37,2722,2329;18,2328;8,2723;26,2724;39,2725,2726;39,2727,2728;39,2729,2730;3,2731,9,3,2732;3,192,2733,3,2734;3,2735,9,3,2736;19,1060,579;10,2737,157;27,2738;2,2739,2740;19,2741;19,2742;13,448,2743;10,2744,90;22,658,1,2745,115,2746;21,2747,2748,109;2,9,9,1;10,2749,176;10,2750,157;10,2751,157;13,0;10,2752,157;10,2753,157;10,2754,607;3,2755,2756,3,2757;3,2755,2758,3,2757;3,2759,9,3,2757;8,2759;8,2755,2756;8,2755,2758;36,2760,2761,1690;13,94,506;10,2762,34;10,2763,171;10,2764,34;10,2765,176;26,2766;29,2767;19,2768,878;10,2769,34;25,2770,465;10,2771,157;29,2772;29,2773;8,2774;36,2775,2776,1690;36,2777,2778,1690;36,2779,9,1690;10,2780,387;10,1143,387;40,2081,2781;29,2782;19,120,579;13,504,2783;4,2784,9,3,12;34,2785,2786;10,2787,176;13,510,416;8,2788;10,1701,1;10,2789,157;10,2790,90;15,2791,2792;13,1165,2793;13,504,877;14,2794,2795;6,2796,2797,2798;6,2799,2800,2798;21,518,2230,109;21,518,2801,109;13,448,2802;14,1881,2803;18,2804,140;10,911,157;25,800,444;20,2805;13,24,416;10,2806,9;13,504,2807;12,616,387;10,728,157;20,2808;10,2809,221;13,823,972;25,711,2810;13,504,1113;10,2811,176;10,2812,157;10,529,41;13,1138,807;16,504,2813;25,264,2814;13,448,2815;19,2816;13,277,2144;19,9,2817;19,2818;28,2818;25,149,2819;25,1501,2820;10,2821,176;10,2822,164;19,1193;25,711,465;31,1876;28,1945;31,1945;10,2823,157;13,77;19,45,2824;10,2825,157;16,1138,2826;25,711,594;20,736,140,1491;2,1989,9,207;13,504,2827;15,1514,2828,148;16,504,2829;31,1583;10,2830,157;42,2831,1933,1054;16,504,467;16,571,2832;8,2833;19,2834;16,2067,2835;12,616,2836;13,2837,1463;13,511,2838;12,2839;20,173,2840;20,173,2841;10,2842,90;10,2843,90;13,448,2844;10,2845,157;13,79,479;10,2846,157;25,711,1099;19,1414;13,1363,444;19,2847;20,2848;13,504,2849;19,499;16,45,2850;20,2851;10,167,164;15,2791,2792,60,2852;40,2853,1127;19,2854;19,9,411;27,2855,457,2856;19,2857;25,264,2858;10,2859,1;3,192,2860,3,2861;22,2208,1,2862,115,2863;25,711,2864;25,264,2865;10,2866,34;12,2867;26,2868;26,2869;26,2870;26,2871;26,1775;26,2872;26,993;26,2873;13,823,2874;21,518,2875,543;19,2876;12,2877,387;10,2878,90;13,501,594;25,711,866;16,557,2879;13,658,972;25,711,2880;19,2880;10,849,34;25,711,1031;10,2881,41;19,2882;14,1544,2883;23,927,2884;18,2885;10,2886,34;10,2887,34;10,2888,176;10,2889,176;31,173;13,823,996;26,2890;20,2891;19,173;44,2892;25,149,526;13,504,1023;18,2893;25,149,2894;14,2625,2895;19,2467;27,2896,457,7;25,264,2897;13,823,120;8,2898;19,2899;25,2900,758;28,2901;19,2902;29,2903;25,711,2904;20,2905;12,2906;19,2907;13,823,479;10,2908;8,2909;12,2910;12,2911;25,711,2912;31,1023;19,2913;20,2914;18,2914;3,2081,9,3,2915;4,2081,9,3,2915;8,2398,2916;25,711,188;8,2917;20,2918;10,2919,90;10,2920,157;10,2921,90;36,2922,9,2923;4,2924,9,3,2925;34,2926,3,2927;25,264,691;13,827;10,2928,34;10,2929;10,2930;45,2931,3,2932;25,711,2933;10,2934,157;25,264,687;13,1363,882;19,2935;13,823,2936;25,1596,465;25,944,1775;19,2937;12,2938;45,2939,3,2940;13,79,1181;10,2941,157;25,264,2942;19,190;19,2943;13,501,2944;13,823,2944;19,2232,457;25,149,2945;19,2946;34,2947,3,2948;12,2949;12,2950;31,2951;20,2952;20,2953;12,2954;13,188,479;10,2955,221;20,2956;22,2957,2523,9,115,2958;9,2959;9,2960;38,2960,3,2961;10,2962,34;10,2963,34;10,1127,34;10,2964,34;10,2965,90;25,264,2966;10,2967,176;16,557,2968;45,2969,3,2970;23,1543,2971;2,2972,192,7;10,2973,157;12,2974;10,2975,157;35,2976,3,2977;8,2978;8,2979;18,2980;10,2981,157;13,504,2982;26,2983;29,2984;16,469,1056;20,2985;10,2986,41;10,1779,41;10,2987,34;18,2988;26,2077;18,2989;18,2990;10,2991,157;8,2992;25,9,2993;10,2994,157;22,2995,1,2996,115,2997;18,2998;10,2999,9;8,3000;10,3001,164;17,3002;10,3003,176;10,3004,176;18,3005;10,3006,176;22,1769,1292,3007,115,3008;18,3009;20,3010;10,3011,157;10,3012,157;16,3013,79;20,3014;21,3015,3016,109;14,3017,3018;10,3019,157;18,3020;18,3021;18,3022;21,518,3023,543;10,3024,157;20,3025;46,3026,3,3027;29,3028;10,2398,90;20,3029;26,44;26,3030;29,3031;28,3032;16,3033,3034;18,3035;20,3036;20,3037;20,3038;20,3039;18,3040;18,3041;18,3042;10,3043,157;20,3044;20,3045;18,3046;20,3047;20,3048;20,3049;18,3050;20,3051;18,3052;28,24;45,3053,3,3054";

const $scriptletArglistRefs$ = /* 13284 */ "378;999,1671;1669;114;1543;26;96;441,585;26,450;2826;436,450,762,1099,1100;1625;1104,2004;1671;1276,2412,2413;26,436,437,438;1672,2077;1625;26,1473;1625;1625;1625;2661;3317,3318;28,361,476,483,1876;398,2611,2612;378,476;1350;527,1673;1625;3101;1025;1995;408,1625,1758;114;499,1100,1165;914;1625;1625;1625;2661;1625;2901,2902,2903,2904,2905,2906,2907,2908;26;26,361,419,423,424,425,426,1671;450,967,968,969,970,971,972;1625;2848;999;361;1669;450,691;645;3116,3117;1177,1178;1671;999;1799;26,361,450,1673;358;109,110;26,2278;1749;114;385;114;385,389,419,802;109,406;450,2640;194,710;1473;26,411;3612;999;346;1625;26;26,411,999,1672,1772,1773;436,450,762,1194,1670;3477;26,476;1749;26,762,1195;26,349,361;600,691;1625;358;944,1267;133,145,539,682;2648;1345;1625;791,1504;26;28,1674;1625;378,385,450,498,762,1378;114;28,29,377;221,222;2373;3394;29;632,2031;1543;1672,2077;1768,3438;1672,2077;1675,2750;385,417,418,1669;133;1139,3477;1625;653;476;26,1045;2128;3521;358;1625;1796;109;109;1625;1797;1625;1345;1625;26,450,999,1555,1556;26,109,450,1542,1543,1544,1545;589;378,385,450;1672;361,378,627;26,419,1543;806;1625;26;1800;1625;2753;450;1274,1625,2484;1625;733;3566;1625;1403;361,442,470;1625;1266;1185;1543;999;1995,1996;1673;2009;26,109,450,1542,1543,1544,1545;1277;2096;1625;393,1636;26,361,759;26,1600,1620;999;1625;2757;26,27,28,29;1049,1625;539;26,438,439,440,813;1625;144;1276;2110,2111;608;569;26,691,2425;26;26,411;3211;361,830;385;114;1473;904;3034;454;837;1104,1355;1756;1233;1673;26,378,450,541,584;1148,1189,1473,2535;443;2531,2532;589;386,999,2633;26;785;1104,1438,1673,2152;26,3029;1608,2621;999;1749;104;1749;3419;1749;355,356;411,412;589,623,1647;366;109,1737,1738,2334;2132,2949;328,1273,1625;709,2338;385;2506,2790,2791,2792,2793,2794;450;406;126,1933;1625;2011;1749;3085;2292;2303,2432,2500;1380;26,1772;26;372,591,823,824;1454;349;26,436,450,762,1194,1670;450,1192,1193,1671;367;1473;1671;1543;3219;406,2363,2364;456,611;358,1625;133,145,358,539,616;1250;385,496,999,1543;1270,1625;1345;1642;26,1329,1670;1543;26,775,1670;589,1278,2268;1671;1345;1341;1345;553;361,378,497,627,852;1205;1625;114;1738;1473;26,2997;589;29,543,589;589;1761;1149;1149;1149;589;29;26,621,1257;562;413,1107;3111;1104,1712,2152;3116,3117,3453;288,289;451;361,451,476;3064,3065;2464;1625;1543;1625;2724;713,714;26,1473;450;3510;470,589,1188;858;589,1176,1543,1647;691;1625;1473,1474,1475,1476;3422,3423;1697;1543;1673;999,1128,1129;1750;1625,1749;1625;1951;109;26,837,1672,2035;1738;911,1670;1274,1625,1631;684;2786,2787;26,438,439;1625;126,703,1995,2225,2802,2803,2804,2805;1625;3316;1543;476;26,1975;2459;172,173;136,137,2426;385,451,476,863;114;361,378,627;26;-399,-2612,-2613;26;26,390,476,573,627,709,757,772;3224;3413;1331;26,791;788,1181,1625;28,679,2898,2899,2900;29,632,1837;1473;512,1117;543;1304;1625;26;417;26,999,1672,1684;476,1543,1672;1625;1903,1904;476;1749;26,413,1676,1872;999;1543;172;450,1670;1436,1437;26,419,457,458,459;475;93;2761,2762;1670,1671,1672,1675;2554;2554;2978,2979;26,28,393,600;26;788;1600;26,1671;589;26,55,56,57,58,59,60,999,1543;459;361,378,476,627;1672;26,499,1165;499,1100;1037;113;1958,1959,1960,1961,1962;1108,1109;1670;126,3110;1738;397;1797;1697;1672;439,813;439,813;65,66,1269,1625,1749,2370;2175;380;366,1749;611,1197;358,1739,1740;489;26;26;1625;114;1473;61,62;26,999;2012;1543;1543;228,358;691,1672,1677,2796,2797;1473;589,1655;1672;450,762;589,1603;1473;61,62;26,589;589,621,725;1749;1543;999;476,541,3002,3004;653;1697;441;1104;26,450;1059;354;2809;1128;1286;464,589;1625;1355;1625;1625;29,133,589,2182,2183,2184,2185;1749;1761;1189;1549,1572,1573;2386,2387;589;26,476,1673;1473;1473;1625;358;68;26;589;358;1625;1669;791;26,589;496;1473;2681;29,589;26;1645;26;26,1697;450,1502,1503;2716;839;1672;1697;26,1697,1698;1673;2517;26,450,1104;1163;1738,3580;26,476,1670,1672;406,1723;1255;1731;1975,2686,2687;1473;496;3069;1625;3048;26,571;411;26,1543;26,55,56,58,59,60,1543;26;26,999,1772;470;1750;1092;377,385;1255;1749;1140,3477;1331;1473;95;28,999;450;1669;1543,3025;632,1610,1611;26,390,600,691;476;1991;411,953;1671;1625;450,691;999,1681;1669;328,368,1273,1626;3445,3446;1750;845;406;1672;26,1543;361,734;1646;1543,3210;2871;385,2404;361;999;999;1345;352,353,354,1266,1625;3606;1473;1625;109;2050;26,1673;451,1670;354;470,543,1029;1625;1625;3125;3125;1473;26;2864;1745;1707;940;366;866;3287,3288,3289,3290,3291,3292,3293,3294,3295,3296;419;26,413,1107,1694;436;589;426;1794,3579;26,378,546,568,569;430,568;430,568;26,571;331;2042,2043;589,2743;1669;29;3573;589;999;1672,2077;176;2210;26,1670;2477;2210;2210;635;2210;2210;2210;588;26;1473;2210;61,62;61,62;1749;1624;126,1820,3633;664,1749;1625;114;385,450,762;26;395;715,716,717;598;1731;1503,2411;26,571;476;1697;3631;26,2429;385,390,436,450,497;26,1782,1784;2615;1673;2268;109,2334;2225,2802;2661;26;419,1674;26,404,405,1670;61,62;450;1671;26,404,405,1670;26,404,405,1670;26,404,405,1670;789;2610;109;2037;26;2763;1750;331,1416,1417;358;26;1671;385;3565;2621;1502;589;496;390,476,1020,1021,1022,1672,1673;1761;26,571;378,385,450,476,584,863;734;389,1708,1709;2865,2866;662,663,1672;26,1671;985;1625,1749;26,469;377,589;451;26;61,62;1478,1479;1625;1673;361,378,1673;1625;1625;1625;1625;1625;1625;1625;1625;1625;1714;632,3236,3237,3238,3239;473;2621;1750;1934;430;632;589,1473,1643;589;413;2303;600,691;600,691;600,621,691;600,691;1683;1494;1473;2569;429,1117,1118;1543;26,361,389,476,551,552,553,554,1669;361,385,436,450,557,762,1671;496;114,1487,1488;962;3581;980,990,2313;1625;2958;1625;1059;358,1267,1625;26,413,1676,1872;653;1331;450,762;1749;29,411,512,543,589,2048,3322;1672;1671,1681;747;464;1625;1205;1672,2077;476,941;26;26,450,476,762;1043;1408;1271,3051;1750;2814;1625;26;26;1671;1562;1418;3212;76;1255;776,2515;1087;26,722,999,2078;1543,1672;368;902;361;1671,1676;26,439;1677;1670;26,1375,1700;2022,2023;1749;26;419,1670;1674,1675;26,413,476,600,999,1543,1562,1670,2947;491,492;677,678,679,680;26;395,677,678,910,1543,1672;2325;2014;26,27,28;133,145;349;1842;1842;26;126;26,1198,2333,2339;1050;1639;1670;1543;548,1179;176;476;1850;1628;1745;681;1625;2954,2956,2957,2958,2959;3454,3455;1473;450;1216;26;2286;361,830;2569;26;61,62;947,948;589;589;589;26,691,1543,2425;3543,3544,3545;1227;396,419,611;589;1670;2273;109,830;413,1543,1697;61,62;451,867;1473;143,3095;361,1003;450;1543;226,227,2130,2131,2132,2133;1499;114,444,445,446,447,448,449,450;413;26,3113,3482;2140;395,424,496,999;1543;61,62,1543;1674;61,62;999;901,2044;133,893,898,899;610,611;3316;26,470;26,1671;429,461;1473;1375,1376;61,62;691,999;61,62;543;26;26,999,1543,1876,1934;999;1324;26;26,1671;648;3003;103;716,2989,2990,2991,2992;450,497,762,1673;26;26,378,450,1670;450,762;791,1504;2525;3500;385,482;1745;3592;358;1749;1543;1671;632;361;2081;569,934,1294,1543;632;29;1853;26,2420;632;26;632;1473;1670;3463;1543;1844;1421;3522;372;1680;395,1019,1671;1672;114,1487,1489;2048;589;354,1345,1473;624;114;947,948;429,582;26,1543;1671;400,402;26,1158,1543;1669;1687;385,450;1625;1857;1473;1473;498,1670;1625;385,984;1318;2968,2969;3634;1625;2678;61,62;721,873;406;3225;1037,1038,1039,1040;331,1706;26,2694;658,959,3273;3230,3231;1749;354;1673;476;26,29,1543;1384;791,1504;589;1183;583,609;1049,1625;627,1050,1669;450,691;791;1543,1672;1672;3316;1625;686;762,909;450,762;450,1502,1503;1975,2686,2687;438;26,999;26,411,999;413;1473;902;2943;378;1670;1625;26;1473;61,62;589;26,411,999;26,411,1543;2727;999;26;26,411,1543;1543;1749;1015,1288;26;348;26;1473;589;2333;28,1725,1726;588;1738;1713;1562;385,585,739;114;999;1682;368,1625;26,999,2451,3023,3024;1657;999;999;1543;397;2968;464;582,2418,2419;589;1477,1478,1479;1670;109,3328;358;450,1479,1502,1503;397;26,1543,2496,3025;1750;589;2201;452;589;999,1672;26;1099;550;368;589;831,832,1543;26,1609;1671;703;26,999,2451,3023,3024;1543;1670;1697;1473;1671;1674;1291;2011;26,27,691,1672,2962;450;2374;237,238;2106;463;2279;1543,1643;481,589;1967,1968;430,546,569,589;1473;377,385;26;1460,1473,1561;1473;611;512,543,589;512,543,1788;1673;2871;396,398,776,1655,3486;1543;1988,3599,3600;1562,1696;1473;1672;3325;1252;1473;1671,1672;26;26;429,589;26;1677;1255;1543,3242,3243,3244,3245;450,1447;1473;928,929;61,62;1473;3298;891;1473;109;26,430,589;1543,1673;679;26,691,999,1543;2706,2707;1670;791;26,999,2451,3023,3024;589;1672;1473;1543;579;29,385,1516;61,62;1543;1543;1625;1473;1396;1671;1205;1104;589;26,1672;988;2134;819;26;1543;1473;1278;817;427;1671;2176;451;26,378,546,569,570;26,378,568,570,814;26,378,546,568,569,570,571;2069,2070,3585;26,378,546,568,569;1708;1625;785;1252;296;372;2858,2859;2153,2154,2862;397;26;1670;1625;30,31,32,33,34,35,36,37,38,39,40,41,42,43,44,45,46,47,48,49,50,51,52,53,54;589;589;543,589,1473;589,1250,1350;2442;29,543;29,571;589;29,543;1178;29,1707;589;543;476;26,1670;397;1473;1189;26,953,1056,1975;26,1670;598;1672,2077;1672,2077;198,328,1625,1627;26,600,999;589,1647;29,589,1672,2048;999;589,1473;3496;61,62;26;61,62;1474;1625;989;658;349;450;451;464,589;26,476;1473;715,716,717;3334,3335;385;1755;1670;1216;2284;106,107,109,110;1070;361,690,691,813;3554;1749;1220;361,3000;589;1036;1543,1643;1248;26,28,390,393,600,691;2479,2480;354;1473;26,952,1673;408,1625;1625;571,2243,2244,2245,2246;76;2048;26,543,621,874,1536;450,762;1137;26,1783,1784;361,1671;1671;999,1543,3169;358;785;219,220;1473;589;372;378;622;1670;26;26,474;589;1460,1473,1561;726;1473;1745,1927;1069,1625;1107,3395;600;29,551,3019;1672;1473;1625;589;999;3341;1671;1473;3617;109;2048,2333;1797;26,3482;26;2698;1473;1850;1673;1789;1473;358;496;26,361,1166,1671;1473;1255;396,464,589;26;1473;2212;999;1745;589;1897;1731;618,944,1625;26,1050,1675;1473;1625;1252;26;1745,1749;589;1543;1806,3320,3321;26,1670,1671,1672;1473;29;1477,1478,1479;589;589;26;464,589;459,746,1134,1135,1136;385;26;569;589;26;252;1625;378;1243;26;1473;2218;2677;589;450;1219;809;1625;3425;1674;2870;1496,3431,3434,3435;26,459,746;1642;26,451;543;509;2059;1477,1478,1479;1477,1478,1479;1585,1586,1587;1457;3241;3120,3121;331;3331,3332,3333;26,1499;450,762;1625;1672;1673;1647;2129;2916,2917;999;600,691;600,691;806;354,589,857;125;3415;2963,2964;1671;450,691;589;26,1178,3450,3451,3452;1473;1671;1749;1473;2621;26,476,762,1195,1669;632,2327,2606,2607;1093;450,762,1553;385,540;1473;541;1543;650,651;1677;500,1186;788;1678;1543;329,1625;833;406;2668;26;26,1543,3344;26,1543;26,413,1676,1872,1873,1874;3622;978;1477,1478,1479;29;1057,1868;1625;1670,1671,1672;361,541;965;543;1448;947,948;1466;1670;1255;1368;1148;500,501,2113;1841;26,2795;1345;1733;26,999;29,589,1978;26,114,389,1671;589;361,395;436;1477,1478,1479;61,62;216,217;1477,1478,1479;1664;589;1278;996;1625;1350;411,569,589;76;947,948;26;1473;1194;461,1008,1009;1391;589;1625;1677;450,762,1673;1762;1359;411,589;1205,1637,1638;1670,1677;2136;386;562,1669;1473;385,537;26,389;26;61,62;1673;2471;933;368,371;26;1670;26,29,411,1543;26,28,390,393,600,691,775;1643,1697;26,924,925;3281;1697;1543;1625;385,450,762,763,764;26,1543,2460;1568;450;1477,1478,1479;26,840;1473;426,678,1107;830;26;1299;-1376,-1377;1253;2766;1477,1478,1479;1477,1478,1479;26;999,1105;1473;1268;1670;26;807,1479,1481,1482,1485;3279,3280;109;397,2074;1473;1473;1642;411,569;3251;2569;464,1221;430;61,62;817;385;589;611,1197;2963,2964;1673;2048;926;26,396;1176;2110,2111;1473;569;589;589;26;26;1670;1754;1460,1473,1561;1673;3282;26,438,439;459;1672;26;791;1670;999;1738;2188;2680,3577;3576;1543;600;529;600;1672;28;26,775,1281;999;249,250,1613;1623,1706;503;2297;1945;1670,1672;1673;26;691,1673,2213;26,999;837;26,64;1473;1473;541,1672;1473;998;999;1543,1583;1625;959;589;529;26,3482;785,1969;1671;999,1543;396,430,546;589;26;3512;26,1543;459;406;999,1671;1625;26;470,1671,1934;26,3213;1138;716,2989,2990,2991,2992;26,2526,2527;406,450,543,589,999,1382,1543,2987,2988;1323;3542;691;1670;26,411,1543;26;1473;776;29;1473;26,1671;2416;599,1543;361;632;1671;1670;26,543,1543;1543,3242,3243,3244,3245;999;2273;1473;721,745;1543;543;1625;28,389,429,451,464,815,816;354,2203;406,1429,2397;1671,1672;419,1683;3634;3634;3634;3634;3634;3634;589,1562;1625;2401;1477,1478,1479;1477,1478,1479;947,948;703;543;1673;999;390,1022,1672;395;26;2835,2836;1543;1473;589;1473;451;2150;1671;3054;2467;976;450;589;1473;474;470,1674,1934;1473;26;936,937;26,1375,1700;589;26,64;1255;1513;1189,1473;589;1797;735;2353;26,430,589;29;1473,1725,1726;1473;1749;496;1672;419;2912;1749;459;1473;611,874,959,1040,1197,1662;500;611,874,876,959,1040,1197,1662;451;944;1473;1625;1756;1107,3395;526,527,528,1673;965;589;1725,1726;3316;26,627;79,109,1560,2889,2891,2892,2893,2894,2896;671;1121;2501;959,2219;785;270;1473;2631;406,1723;1625;1331,1473;1473;1216;1672,2262;3506;1670;378;589;1137;2283;589;26;451,737,738,1673;450,1502,1503;370;26,999;26;2601,2602,2603,2604;1473;386,817;26;589;1271,1625;527,528,1673;1395;109;2621;-27,-1544;109;1585,1586,1587;652;1749;758;762,1673;543;589;932;358;1672,1697;616;109;1050,1232;2773;1677,2281;1216;1477,1478,1479;1538;1671;450;2798;1045;762;762,1318,1673;450;500;588;589;2811;1672;1248;28;26,1375,1700;2501;3009,3010;1441;1671;385,476;464;2434;429;1321;1706;1473;450,1502,1503;1625;395;1670,1671,1672,1673;476;2011;1673;1335;450;1625;164,165,1314;26;496;28,29;589;69,1473,2590;988;1671;1670,1671,1672,1673;527,528,1673;26,1238;1473;1230;1359;2641,2642;26;26,589,988,1672,2448,2449,2451;26,28,589;632;589;999;1557;1670;2915;1543;999;1671;1675;26;1625;1473,1499;1749;1849;1642;3487;999;26,999,2451,3023,3024;1543,1592;1625;589;1673;1625;3384;1255;3567;26;114,450,562;1066;1670;1670;2963,2964;26,1196;1473;589;494,622,676;1104,1673,2004;548,2044;1448,1473;1473;1625;649;670;679;26;26;1619;1671;526,527,528,1673;3316;1104,2160;1712;1038;2410;1473;1473;3351;1749,1758;683;2020;999;776;2290;1255;1473;1671;632;667;1670;1255;26,542,691,999,1697;-27,-1544,-3503;1255;542;1255;1255;1255;1674;1473;361,740;3071;934;1625;2621;1625;26,2672,2673;1787;1473;1278;1625;2511;589;1205;902;385,999;453,454;28,1697;999;1670;1749;1473;372;2878,2879;26,29;26;26;589;3045;1239;857;1543;1673;1671,1672;459;589;1104;557,1454,1455;503;1473;635;26,635,1622;3529;1674;1331;589;1473;2937;1725,1726;679,2634;1642,1670;893;2041;389,1708,1709;29;389,1708,1709;2097;389,1708,1709;389,1708,1709;389,1708,1709;101;632;1473;1473;2346,2347;2632;1790;1669;1826;1745;1473;1473;1745;366;88;1125;1673;29;589;29,1707;600;589;589;589;1725,1726;589;1178;26;29,1707;589;26,28,29,3184,3185,3186;589,1473;1178;2144,2228,2229;589;600;29;637;600;589,1706;589,1351;589;589;29;512;451;589;589;29,543,733;3166;1729;1473;450;1671;1473;1625;589;1473;600;1585,1586,1587;1749;543;1625;26;26;1671;2210;26;2210;2210;1216;589;26,589,999,2451;1473;791,1898;1712;1672,2077;1672,2077;1672,2077;386;1743;992;993;361;2210;1672,2077;2210;1583;1625;846;1473;105;589;589;2210;26,64;1461,1462,1463;1473;192,193;3444;114;1670,1671;26;2015;1473;3579;2502;451;1473;2446,2447;450,762,2103,2104;26;1673;1671;2516;1672;1749;1239;1670;361;1672,2500;1499;1473;1588;1255;1750;2585;411;111,187;1625;1836;413,690;944,1625;3439;3499;308,309;29;29,543,999,1672,2048;1670;1418;1255;2085;631;109;632;2621;999;589;26;450,1574;450,762,1257;1673;450,1574;2963,2964;1107,3395;632;1749;3037;26,956;406,527,1473,1647;26;1543;3277,3278;632;411;26,937,1779;2546,2547;653;2765;543;378,498;484;543,965;26,2038;26;509;999,1671;26,999,1473,1543,2054,2590;26,1670;26,498;26;1673;462;378;26;999;26,372,1259;1330;451;1362;411,1217;411,632,1217;438,509;1697;2619;2559;958;1745,1762;389,464;3505;354,1473;1801;1672;1670;1073;1673;1189,1252;1220;847,848;1543;1674;26;1310;358;879;1758;3392;884;26,573,627,709,757,772;1283;326,1632,1761;26,1543;1543;865;1473;1670,1671;2402,2403;1625;29;1670;1473;589,1473;26;26,1393;1473,2310;-27;2623;1625;589,1196;1473;1473;2171;837,1382,1671;1675;1718;1607;366,3584;29;891;1473;897;464;1128;26;2076;406,1366,1473,1723;785;26;589;1725,1726;426;378;1730;1625;1673;1670,2852,2974;1331;1320;632;791,1504;1473;2621;485;476;1473;2214;1625;390,476,1020,1021,1022,1672,1673;1625;1503;411,569;1749;1749;1673;589;389,1708,1709;503,582,589,709;1473;-379,-386,-451,-477,-585,-864;1670;1625;2620;109;366,1625;1696;999;811;29,543,1473;1473,1543;26,55,56,57,58,59,60,999,1543;3139;1473,2846;1345;26,543,589;451;389,658,1221;26,476;589;26,377,508,509;589;569;464;589,725,2126;26,820;3143,3144;1516;396,476,543,589;476,589;477,478;26,378,390,391,3302,3303,3304,3305;26,378,390,391,3302,3303,3304,3305;26,378;26,378,390,391,3302,3303,3304,3305;26,378,390,391,3302,3303,3304,3305;26;26,378,390,391,3302,3303,3304,3305;26,378,390,391,3302,3303,3304,3305;26,378,390,391,3302,3303,3304,3305;26,378,390,391,3302,3303,3304,3305;566,1442;1530;600;26,691,2008;734;1738;1503,1625;2661;1153;1473;1516;1443,1444,1445,1446;762;1408;2187;1745,2602;1300;346,788;512,543,1697,2585;1500;366;543;1059,1473;589;1473;1140,3477;397;26;999;1473;703;3448;399;3161;721;2433;3207;1178;406,837,1396;2621;589;376;29;1516;1919;26;1562;999;397;1160;791,1504;1473;600,691;3262,3263,3264,3265,3266,3267,3268;1749,3503,3504;1098;397;589;1543;1671;1673;1189,1252;377;2509;589;959,1318;1380;543;589;589;589,2727;2108;26,114;26;999,1880;2591;589;886;385,390,450,762,1216,1992,1993;450,624;26,450,762,1026,1104;1473,1543,1617;450,762,1553;385,390,450;2085;430,1787;358;29,1648;2116;450,762,999,1564;778,779;406;2626;1543;1543,1562,1670;1473;377;1503;1104;1473;1296;1625;1625;1625;26;1674;2774,2775;354;2864;1543;1671;26,393;935;406,1723;26,413,999,1872,1873,1874;26,600,691,2159;26,413,1676,1872,1873,1874;1473;411,450,1278;1496,1497,1498;791;2094;1625;1258,1871;3098;29;868;1448;883;26,372,827;1189,2640;1355;1970;451,589;1255;2122;1543;26,723,1675;361,627;791,1559;1473;589;1670,1671,1672;679,2852;2503;500,1516;2476;632,2147,3148;1473;1115;575;361,395;419;1473;385,396;529;2186;880;3462;758;464,623;658;2958;385;1613;2220;2975;29;395;1252;26,114;1473,2624;2621;366,1749;2194;327,1273,1625;464,546;1671;3402;464;130;179,180,181,182,183;589,622,1671;999;567,656;1543;109;1697;450,1502,1593;589;1677;26,1027,1669;26,557,2257;464;1893;29,1502,1543,1688;589;1671;565,1672;114,417;26,1670;26,419,2195;999,1543;122;1473;1543;3575;26,999;1677;999;1677;1477,1478,1479;1543;999;1543;450,1456;1543;385,450,762,1670;1617;1072;2796;1677;26,451,498,541,600,653,813;1670;1670;703,830,3533;3130,3131,3132;1104,1255,1379;26,3406,3407;600;1673;26,1669;26,411,1543;450;1375,1376,1700;413,678,910,1562,1672;1714;910;26;476,3281;26,465;2448;26,411,1543;26;653;1334;1543;385,1671;127;1543;109,2768;1670;1625;1128,2863;703,2225,2802,2803;26,512,543,1697,2585;331,1605;2282;414;3102;26;1671;1562;26,426;1625,1749;26,1543;3491,3492,3493,3494;512;503,589;377,569;114,704;2963,2964;2963,2964;2963,2964;2963,2964;2560;485;3520;947,948;26,542,613,1670;589;589;26,1473;411;451;589;26;589;589;29,451;451;954,1985;589;417;2727;947,948;2645;589;2444;589;385,1672;26;1750;2621;451,1543,1672;385,1672;349,706,707;1473;1673;1671;390,589,1673,1945;464;632;1671;395;1255;1543;1187;589;26,999,2451,3023,3024;26,952,953;1750;1503;101,242;999;1697;655,776,1673;589;476,999;1672;1116;2697;1670;999,1543;476,775;385,999;1255;589,1706;26,837;281;29;999;858;1670;886;191,3193,3194;1473;26;26,2451,3023,3024;589;1429;1466;1473;1625;1028,1669;1473;624;26;26,589,637;26,2451,3023,3024;1252;999;1473;601;1543,1672;999;2005;589;1672,1706;126,283;26,3342;797;3472;29,512;1473;385,624;775;1473;496;354;653;1573;632,1597;963;1473;653;1473;354,1345,2621;611,1197;1671;844;622;26;600,691;632;622;947,948;26;29;1673;406;385,406,417,418,1670,1963;589;1543;1543,3242,3243,3244,3245,3247;1672;114,1104;2119;26,64;600,1050;26,477,2569,2659;947,948;422;1925;557,1454,1455;1473;1853;1671;450,762;653;2117;653;573,627;1473;589;1189;464;476;2621;1749;1725,1726;1230;26,28,393,476,600,923;512;1673;1671;26,476,1543;29;633;1189;378,470,793;1625;749,1625,1749;2661;109;1625;1886;1473;977;1252,1473;575;543;1473;1549,1572,1573;2150,2151;999;26;464;1625;547;421;464;1473;589;589;1669;1671;999;411,569,589;109;26;3316;1189;2161;26;406,667,1104,2300;406,1252,1473;26;543;26;589;653;1673;109,857,987,1189,1473,1482,1506,1507,1508,1509,1510;837;1473;26;406,1189;589;3570,3571;999;1707;1503;3058;703,999,1684,2232,2233,2234,2235;589;26;1677;1267,1625;240,241;653;807,1479,1480,1481,1483,1485,1486;109,406;624;589,2319;1625;1625;1473;1671;413;109;1473;389,509,611,721,722,1186;243,244,246,318;658;721;26,430,456,500,721,722,723,724,725,726;901,1473;109,1738,2334;26,64;1670,1671,1672;1473;3629,3630;358,1628;805,806;926;1681;791,1559;109;1989;2187;1673;3141;1473;354;1024;3352,3353;385,589;2548;927;29,1560,2723,2724;541,1669;527,528,1673;2426;114,361,411,545;114,1489,1511,1512;2961;354;109,2485;999;1255;1255;1543;406,1278;26,450;385,450,762;450,1502,1503;26,450,476,545,762;1593;26,1543;26,361,476,693,2425;589,3470;29;3436;1473;1473;1557,1725,1726;1477,1478,1479;378,701;331;114;1099;1734;1439;2676;26;3603;109,450,2222;1482,1518,1519;615;436;109,1473;2543;1473;65,66,1744;788;1473;3326;1473;652,748;378;441,562;1670;361;1673;2361;450,762;26,999,1772;3041;26,29,589;1543;26,378,450;506;1107;1420;385;1482,2877;1005;114,401,403;826;543;1345;1625;1473;354;694;2208,2209;666;1750;1543;26,589,2451;999;1543,1821;26,533,534,535;1921;385,450;1750;436;639,640;589;26;430,464;1359;589;349;853;26,372,476;2930,2931;1516,1653;349;450;1473;1473;28;61;2700,2701,2702;2252;589;2439;1543;2262;2864;1543;1473;26,64;1473,1929;1670;464;2971;1543,3242,3243,3244,3245;1689;26;1679,3260,3261;600;999;1672,2445,2583;632;723;1278;26;965,1691,2072;28,600;999;26;26;26;26,937,1779;1857;76;3412;624;346;361;26,1503,2987;1473;109;1543;1503;747,1670;26;1750;361;2577,2578;1473;385,1672;1645;406,1723,1724;947,948;999;26,29;1852,2615;26,637;999;703,1562,1673,2144;837;1473;1543,1592;1769,1770;1727;1625;1625;1084;1761;1625;1952;1355;503,874;589;184;1306;28;1625;2661;26,464,569;436,1670;2829,2830;1625;1749;589;26;464;76;114,1487,1488;105;3556;26;1674;1255;1255;999;1255;1218;788;1255;1672;1255;1473;26,27,541,542,543,1672;1255;1255;1473;871,1460,1473,1561;1255;1543;26;589;1672;1473;543;1808;385,783;1473;429,473,589;3099;3249;1473;2357;1255;476,1673;26;109,646,647,648;653;285,286;398,3486;1625;596;1473;635,691;732;372,476;654;1670;589;429,460;1543;429,1117;2460;589;589,1823;589;503;2822;999,1543;1671;1697;1473;1473,1684;2807,2809,2810;1669;589;747;1473;589;1107,3395;543;2390;430,723;109,2334;2587;589;589;589;26;26,2064;589;2728;1749;-27,-636;1255;26;1024;648;26,1672;1255;543;652;2691;1473;1255;3468,3469;1670;26,600;1473,3077;1429;114;26;389,1708,1709;389,1708,1709;389,1708,1709;389,1708,1709;26,378,568,569;429,430,431,432,433,434;389,1708,1709;1537;589,1599;1887;2372,2575,2576;378,411,476,573,627,736;1749;1749;1708;1173;397;1670;385,1672;1025;358;624;1670,1671,1672;589;3316;436;947,948;947,948;947,948;999,2675;589;331,512,589;589;377,396;29,512;512,1473;589;544,1516;589;397,589;29,1516;600;29;29;589;589;589;589;29;26;1473;354,2487;1050,1671;2066,2067,2068;105;450,1502,1503;1748;1697;834;1473;1750,1970;1261;589;1473;1473;1543;1608;569;263,300;1473;589;1672,2077;1473,1926;1671;691;26,406,1670,1674;691,709;26;543,571;1670;782;1625;543;1857;1473;1298;385,386,1676;569;797;2210;1255;680;1128;1473;1761;366,1297;260;1988;354;2324;2425;1499;1287;589;1865;1749;1473;2715;1669;1625;1671;999,1473;1625;450;114,624;1543;385,450,493;386;385,1671;1670;1670;450,762,2010;1473;1625;1104;436,691,1670,2850;1670;26,377;2615;411;1448;1128;26,28,1176,1257,1543,1647;26,1176,1543,1647,1697;26;3022;2155;26,1543;26,1543;1098;1426;2657;29;1473;1672,2726;29,1672,2048;589,1670;819;396,589;109;589;1676;600;1543;1670;1861;632,1543;2344;1625;1294;945;26;1625;1671;2636;3607;497,1671;1543;1059,1473;1255;999,3037;1473;450,762;476,860;632,1592;1670,1671,1672,1673;1473;26;589;88;1749;1670;26;451;26,999,2451,3023,3024;26;1220;999;3487;1543;26;999;26;26,1672;26,476,1672;1673;26,999,2590;999;1672;1674;26,691,999,1543;26;1673;1673;385,1672;1671;26,999,1543;385,1673;1671;26,2250;1671;26;891;2030;2149;1625;949;589;411,1217;358;2135;2667;999;589;26;1038,2266;1473;2011;541;589;949;1107,3395;1670,1671,1672,1673;1673;788;837;2754,2755;26;29;26;29;3255,3256,3632;589,1725,1726;632;600;1625,1752;1732;797,2416,2711,2712,2713,2714;1394;3099;1669;1670,1671,1672,1673;26,3299,3300,3301;1670,1671,1672,1673;2821;1457;388;1473;1473;2124;476;476,589;1345;1673;1076;29,1473;589;1255;26;1707;1361;999;26;999;26;539;1255;406,3479,3480,3481;76,109;26,83,84,85,86,1543,3276;1750;361;114,1675;1473;1420;1410;247,248;2617;1308;26;412;26,571;109,1495;3062;406,1723;1675;2363;3316;3584;109;1473;1473;653;1625;1749;1946;1473;2310;441,450,497,810;1822;358;3555;385,1672;26,390,476,573,627,628,1687;1252;1990;26,999;450,762,1674,1675;589;3136;589;389,1708,1709;389,1708,1709;389,1708,1709;389,1708,1709;589;2293,2294;476,734;1375,1376;1473;389,1708,1709;1708,1709,1710;1672;999;2354;2354;2354,2355;802;1670;1543;1272;1526;791;395,1382,1672;109,1738;1345;26,589,637;589;589;589;589;1010;519,520;385,429,768,769;589;621;589;589;459;2048;2574;589;26,396;589,1516;464,589;589;3383;451,589,869;545,658;589,914;589,791;464,589;589;29,589;589;26,388,569,1147,1148;26,395,1671,1672;26;26;26;543,632,1670,3553;292;1625;605,606,607;589;1473;3340;390,399,498,999,1543,1669;589;28;109,2315;470,2211;999;3316;1168;543;1671,1698,2165;29,1697;543;1473;1625;3181,3182;2913;377;26,3482;413,452;1642;1642;503,589;450;558;1675;26;1675;589;1380;2142;1473;1625;914;1543;1625;797;1473;1625;450;1670,1673;385,1672;1473;589;385;837;406,1479,1525,1526,1527,1528;29,577,3235;29,577,1543,3235;1625;114;1813;898,1247;1473;1625;575;406;413;1473;1625;674,1473;26,372,2031;26;385;600,691;600,691;2811;109;1473;1056;2333;275;354;589;385,1254;1054;1090;1473;539;2363,2933;26;1673;653;411;411,543;456,2456;451;1655;589;589;451;497,2058;589;999;1459;999;3100;26,413,999,1673,1874;385,450,476,1674;1473;1674;26,974,1670;385,1672;385,1672;703;26,464;2553;386;114;1473;3464;1368;1473;496,776;378;2763,2788,2789;3133;26,3283,3284,3285,3594,3595;26,396;1284;788;1625;2011;1672;441;999;26,378,464,589;2372;999,1670;26,1671;1926;999;361,548;26,378,388,389,390,393,3613;26,392,393;26,413,1107,3395;1331;29,577,3235;1543;385,476;1543;1672;385,863;26,589,999,2048;26,64;361,476;543,1543,3403,3404,3405;395,417,661;589;1099;1516;1431;1473;1473;2187;397;1625,1629;589;1064;1918,3084;417;3042;557;1921;1043;3519;2457;1473;1749;1473;1234;1473;114;454,2778;1625;529;974,1464,1465;974,1464,1465;1625;1473;1366;1473;1288;3316;105;2823,2824,2825;495;456;589;589;3578;3578;1750;1762,2909;450,1291,1505;2296;503,536;26;908;109;589,1672;1697;1543;271;26;1473;703,2225,2802,2803;1473;691,2258;589;589;1473;2614;1059;1473;2621;450;1441;667;503;1787;1205;2065;1279,1669;1156,1398;2175;1543;1625;632,3036;1543;2004;1881;384;-27,-1544,2901,2902,2903,2904,2905;1255;26;1670,1671,1672,1673;26;3103;2752;1255;395;1750;1473;2952;450,1502,1593;721,2324;26,331,999,1858;1671;29;960,1922,2008;1473;2198;28,385;1331;361,378,1120;1670,1671,1672;1255;767;1473;26;26;26,1375,1700;1749;1123,1749;330;109;1673;999;26,411;115;1674;1674;1671;346,1130,1131;1670;999,1673;3358,3604;26;26,865,1250,2217;411,569,589;29;109;3387,3388;426,632,1107,3188,3189,3190;476;1677;1669;999;1161;999,1543;3250;3316;1723;1835;395,1543,1562;476,652;1671;26;1473;331,1331;284;1756;999,1543;476;114;26,541,627;1205;783,1855,1856;1191;1867;26,438;1086;1745;569,2166;1675;451,571,658,959;589;1107,1543,3395;3623,3624;26,3319;450,1382,2545;1738;1473;1625;1706;632;331;589;1104;436;1862;1673;1762;1625;1543;26;589;2430;1671;26,1473,3257;3269,3270,3271,3397;29;1829;464,589;26;589;589,3011;2729;543,1787;2963,2964;2963,2964;2963,2964;2963,2964;2963,2964;2963,2964;2963,2964;2963,2964;2963,2964;2963,2964;2963,2964;2963,2964;2963,2964;2963,2964;725,726,959,2770;1669;589,3126,3127,3128,3129;2270;512;589;450,1291;389,419,544,1673;2365;26,2950;589;947,948;947,948;26,1543;1671;3427;1448;1473;26,361,476,1670,1672;1473;2230;691;1672;1473;385;15,-27,-1544;1543;26;26,2827;1671;2271,2272;1473;26,64;2569,2655;881;126;1761;377,571,1642;1670,1684;655;1697;1473;542,691,1674;26,64;950;26,1543;1473;1466;1473;1670;1673;1697;691,1670;680,951;541,2008;2210;1004;1672;1655;361,522,523;1672;26,64;1672;1655;26,64;26,64;26,64;1672;26,64;589;837;3188;589;26,1543;26;1625;26,64;3442;419,999;26,64;999;26,424,1671;26,64;1543,1671;26,64;26,64;377;26,64;589;1473;477;1672,1775,1776,1777,1778;1355;413;791,1504;902;1473;26;2011;26,64;26;1625;1749;632,1597;789;691,1107,3395;622;627,709,757,1050,1280,1642,1669;1473;331;3042;389,464,493,589;1543;377,385,430,452;1068;500,2088,2409;1473;1473;397,1050;653;837;1063;1543;1644;28;1671;1671;1543;1473;999;543;624;1473;358;26,413,1872,1874;1477,1478,1479;589;947,948;2481;2632;2396;2942;413,1543;791;543;2880;1482,1518,1519;406,2310;336;1762;114,1771;450;1908;1749;3443;29;1670;450;1473;1820,1936,1937,1938,1939,1940,1941;1473;1731;1473;26,476;1738;1625;575;1625;2621;1473;29;503,546;354;109,2334;2501;1473;1754;1473;2334;1670;1061;1408;2749;451;653;1255;1670;589;450,762;2661;589;26;2868;361,1791;1430;26,450,589,1670;406,3324;807;2093;26,64;3346;2586;1761;354;346,1130,1131;589;635,1543,1975,3344;1673;1749,1758;543;1982;1252;3226;547;2013;1543;1473;1473;1107;1255;1543;691,1670;1473;837;397;2744;785;26;1473;1749;1255;758;3272;725;873,874;658;456,500,724,725;1107,3395;837,1359;1287;1502;1128;1473;26,1107,3395;1749,1758;1966;589;2259;879;451;366;2980,2981;3316;-27,-1108,-1544,-3396;397;1749,1758;2938;89,90;1669;1516;529;988;1929;632;589;2048;529;1473;1131;600;430,464;411,569;1473;1291,1501;436,774;1473,1536,1537;109,1189;109,1738,2334;1866;1595;1750;999;331;999,1000;3593;1907,1908;26,450,762,1104,1673;1107,3395;26,450,1482;2034;26;114;450,762;1473;29;26;1255;1473;589;1625;999;1355;1299;29,464;3610;385,476,926;575;999;791,1504;2549,3124;589;29;464;1473;361;1749;105;589;1761;2849;562,563;512;1473;1625;476,497,627;992;451,464,589;634,635,1934;464;451;1750;2771;589;1473;26,1672,2248;451,589;411,569,589;1671;999;615;109;26,1674;1543;26;2115;980;589;791;588,589,1344;354,2360;2719;652,837,1132,1133,3146;476;3041;1608;1107,3395;26,1588;589;1473;26,411,999;303;1473;3621;450,837,1001;1473,2259;999;450,762;1673;2872,2873;616;1535;1473;1674;589;1473;758;26,64;2056;632,3357;26;1140,3477;3573;1473;999;168,169,170,171;589;26,2416,2417;589;548;589;109,354,1345;999;390;126;1473;358,1216;368;368;368;368;450;413;361,385,589,762;2613;1749;450,1502,1503;26,64;1549,1572,1573;1473;791;361;138;1252;1750;1749,1758;26;385,464;29;109;1671;2011;1697;600,2667;2478;512;1625;385,658;1473;1614;1671;26,1543;398;26;2372;385,450,762;1670;114,2881,2882,2883,2884,2885;1673;26;1673;1672;1473;589;1674;1273,1625;109;1508,3202;2422,3217,3218;1645;1672;1529,2168,2169,2170;126;1473;426;26;3030;999;1543;999;473,999;1460,1473,1561;785;109;397;837,2003;999;26;1750;857,2441;2513;109;1625;464;934;589;632,1485;1670;114;1419;1543;26,64;354;397;703;385,1672;664,1044;362;109,1737,1738,2334;1473,1502,2590;1769,1770;1312,1313;1671;965;785;1556;397;1473;589,1197;589,1788;476,589;1750;1255;589;539;1414;1851;632,3033;589;790;1473;1473;1877,1878;965;2521;1473;109;1543,3242,3243,3244,3245;1255;1672;999;26,372,1673;1255;1255;543;411,569,589;1255;464,1203;464;1255;1128,2886;1473;589;2008;1255;406;548;109;406,2696;26,64;1473;543;1013,1014;1012;503;1473;1473;539;251;1622;999;999;1672;1672,1677;1670;1978;2138;26;2569;2298;29,503,1642,3297;589;589;430,586;589;589;2392;2007;589;1671;26,64;571,589,1073;589;1445,1458;1473;2473;109,1216;947,948;589;-27,-636;1753,2345;1697;26,64;2630;1473;3467;396;1750;589;385,450,905,906;1642;1473;1473;597;2262;1107;1298;1408;2944;61,62;429,430,431,432,433,434;430;389,1708,1709;389,1708,1709;389,1708,1709;378;428,429,430,431,432,433,434;589;389,1708,1709;389,1708,1709;389,1708,1709;389,1708,1709;389,1708,1709;389,1708,1709;467,468;389,1708,1709;1671;389,1708,1709;377,419,464;389,1708,1709;389,1708,1709;436;589;1473;2003;394;588;406,1473,2920;544,2564,2565;1632;354;436;2262;3234;999;1745;1473;2840;1150;1473;105;411,2201;589;1516;26,27,28;29,543;26;600;29,543;1178;589;589;600;26;589;26;589;29,417,451,543,571,1441,1642;26;464;883;26,64;126;1059,1473;385,999,1671,2688;1827;2621;3456,3457;1182;589;1625;2661;26;1178;589;883;2324;1672,2077;1473,1719;114,632,1331;479,709,965,1382;2210;1672,2077;1473;411,569,589;634;361,1670;1225;999,1672;1473;1473;436;1052;2235;2483;1516;1625;361,378,1669;589;1128;2031;999;476;649,2052,2053,2054;987;1625;588;589;589;589;1473;1473;624;543;346,1130,1131;385,503,1667;451,500,503,2088;1647,3274,3275;1473;703,2225,2802,2803;1749;999;589;1902;450;1355;385,450,1674;1473;1473;372,541;304,305;1119;1625;114,632,1331;26,430,589;3532;3532;1558;1750;2325,3198,3199;999,1543;1926;1543;29,1543,1697;26,389,589,1371,1372,1516;689;510,511,512;1642;703;385,1672;1499;589;589,1670;632;512,1697;589;2427;811;1065,1674;2197;29,1672,2048;1670;26,396;496,959;1583;1671;543,1672;1473,1728;589;1414;589,1331;451;1482,1518,1519,1520,1521,1522,1523;366;1670;1026;358;2389;349;464;476;1536;354;1562,1720;466;999;26,857,1785;589;109,1621;2705;1473;589;655,692,1670;385,1670;2621;813;565,999;1473;358;1331;397;589;378;1473;543;589;1562;149,150,3389,3601;126,1331,1516;1745;1473;476,588;26,64;26,64;999,1697;411;543;1395;114;26,1672;1625;361;1671;1473;616;1536,2139;1750;589;589;1473;1460,1473,1561;995;1671;1345;476;632,3214;29;1671;999;1543;26;26;1543;589;1697;1543,1697;1670;28;476,600,1671;1690;26,999;331,1673;411,569,589;109,1738,2334;411,569;624,734,804;1671;589;833;406;464,589;1473;1255;2802;1543;1056;1473;1355,1482;26;1449;411,589;624;3589,3590;411;1252;1466;26,1697;235,236;26;1749,1758;1793;477;2289;3074,3075,3076;441,1032;1543,1671;1107;411;1473;1625;562;2608;1255;1692;1255;26,451;588;1473;2625,2626;1473;476;476,589;999;999;999;872;26,1543;589;600;406;589;589;29;2048,2522;1255;1749,1758;1255;1625;2772;718;26,64;1673;411;26,64;1355;2227;3618;385,450,909;577;411,569,589;837,2175,3146;439,589,813,2442;1473;1625;1707;589;1058;1670,1671,1672;1749;1855,2928,2929;939,1213;589;354;26;1047;1473;879;1670;1645;708;3625;26,396;3316;1724;2661;1243;406,1723,2724;627;26;3316;26;1473;419;385,1083;1543;1050;470,628,1337,1338,1339;626,1687;358,1113;1860;589;1089;2674;2398,2399;385,419,430,1516;389,1708,1709;389,1708,1709;2537;1625;947,948;1516;543;372;1408;1255;389,1708,1709;389,1708,1709;1473;389,1708,1709;389,1708,1709;389,1708,1709;1625;114;2504,2505,2506,2507;2965,2966;385,1672;2796;1670;2621;1625;1148,1189,2535;385,1083;1473;1473;1673;569;1098;117;2661;3027;1473;464,589;589;589;589;1473;1230;385,1083;26,637;1516;947,948;377,385,589;1639;547,549;385,464;1128,2724;385;589,3508,3509;459;589;464,658;758;385,503,1667,2138;589;385,503,1667,2138;429;2252;589;1318;589;26,396;589;464;589;999;406,450,1026,1473,1499;76;3306,3307,3308,3309;1473;1745;1473;1241;358;1625;1151;589;2455;1359;3067;385;378,1670;26;1670,1671;2661;1674;1889;1411;331;61,62;2386;3114;1473;632;1473;2333;589;1473;476;1159;1758;1473;1411,2646,2647,2734;1473;1625;372,385,589;3428,3429,3430,3431,3432,3433;543;26,1543;791;1675;2844;450;3048;1473;813;1750;397;377;1189;1255;1408;1671;999;946;1762;1099;1625;1104;1625;837;589;490;2802;589;1543;3080;2323;1189,1473;791;1914,1915;1473,1608;26;892;890;26,64;3316;3159;1141;589;1317;476;1205;126,3361,3362,3363,3364,3365,3366,3367;2940;1673;589;2265;589;1230;26,589;589;1255;2344;1473;26;548;543;1749;451;450,1389;809;1473;396,430,546;1477,1478,1479;385,1672;385,1672;589;616;1473;26,391;464,1230;2048;3183;3628;1255;837,1366,2561,2622;965;1750;26;1749,1758;26,476,1669;2259,2485,2922,2923,2924,2925;500,2088;496,776;26,1671;548;1473;2867;1625;1473;1473;1749;26;451;687;109,406,2590,2591,3328;109,133,354,406,1013,2588,2589,3328;1672,2262;2254;1672;616;26,937,1779;3316;346,1130,1131;1473;26;29,1697;1669;1671;361,413,1103,1104,1105,1106,1543;26;26,413,999,1543,1676,1872,1873,1874;576,577,600;1543;1749;1516;753;396,546,1642;385,1672;406,1557,1725,2280,2312;476;1104;2348,2349,2350,2351;26;354;126;600;1404,1405;834;999,1543;1216;358;1473;1189;543,589,691;3572;1482,1616,2570;1673;1671;1670;806;1013,1014,1015;1359;26,413,1543,1676,1872,1874;1670,1671,1672;1320;1473;1453;1473;1863;1251;809;1473;1625;1473;1260;1059,1473;26;2621;589;947,948;464;385,464;704;1137;1798;26;406;974,1464,1465;632,3135;974,1464,1465;543;1473;1473;575;543;1473;26,1543;26,554,1053;109,1737,1738,2334;1035;1672,2077;1670;450,762,1553;105,199,200;26;1473;397;2210;1738;721,959,2147;1395;975;818;2283;3551,3552;2747;589;210,211;947,948;999;216,217,218;1189;1128;26,372,419,476;1473;1672,2077;109,2334;361,395,1260;589;589;3587,3588;1718;354;385,396;589;589;429,841;2569;569;622;385,411;26,937,1779;509;476;1896;26,378,496,1672,1684;1994;2621;1714;1625;999;87,88;3568;385;61,62;1369;26,63,64;26,64;397;413;3040;589,2085;1473;589;785;1750;1750;109;26,999;945;1671;1671;450,1452;999,1543;1669;26,64;358,1739,1740,1741;589;1473;1625;1255;1473;3204;26,64;1255;1473;419,1671;2963,2964;26,64;1395;1473;1671,2095;600;2252;589;3215,3216;1673;2451;999;451,503;1473;589;1473;1473;557,1454,1455;28;413,678,999,1543;26,64;2226;1671;385,456,561;2621;999;411,569;725,959;395;1543;1325;589;574;26;861;1460,1473,1561;3360;912;1395;1625;1625,1745,1749,1760,3008;109;577;785;1625;26;633;109;464,589,740;797,965,2581,2582;1712;3564;1642,3179;589;589,1642;589;589;2963,2964;2963,2964;2963,2964;2963,2964;2963,2964;2963,2964;2963,2964;2963,2964;2963,2964;2963,2964;2963,2964;2963,2964;2963,2964;2963,2964;2963,2964;2963,2964;2963,2964;2963,2964;2667;509,589;396;26,589;26,2950;1230;476;451;411,569,589;26,430,589;26,396,611;26,396;26,64;1410;589;378;2332;1473;1655;459;377,503;1672;2432;509;1473;2048;1473;26,64;1608;430;2826;377,1655,1665;26;361,385;3396;728,729;1673;999;1673;476,498,1154,1669;543;226,227,2130,2131,2132;999;2379,2380;2380,2393;3188;1673;1671;1673;691,2061;1670;451,1671;999;1583;1672;1672;999;571,1944,1945,2247;999;758;1742;543;1473;635,1600;406;589;114,902;1473;1670;1473;632;26,999;589;26;999;1107,3395;26,114,436,1128;26;26,999;1621;26;1583;1473;1543;2661;1625;1625;1255;758;26,999,1872,1874;1750;406,1723;26,413,1543,1872,1874;837,1355,1479,1514,1515,1516,1517;1331;1473;3026;1541;1473;1473;750;1429,1482;361;947,948;1655;1252;1953;2227;653;2431;503,546,1212;999;397,589;406;26;406;809;632,1543;385,1672;1543,3242,3243,3244,3245;589;29;1670;1543,3242,3243,3244,3245;1543,3242,3243,3244,3245;26;3247;1543;1473;589;1473;1543;1635;1517;3634;29;2179,2486;543;1625;1128;354;1557;26,1670;837;109,114;464;1745;2357;1917;1473;397;1180,2390;3414;999;430;396,589;29,133,589,703,2182,2183,2184,2185;3398;1750;758;1473;1625;415;979;1473;1409;667;1807;366;1625;1749;2934;2562,2563;1625;2435;1739,1740;1549,1572,1573;1670;1473;430;451;451;2024;1750;589;1473;464,589;26;489;2028;1473;358;1625;1172;3369,3370,3371;1749;1473;999;109,450,837,2649;1473;1473;1473;354;589;1099;999;902;1473;464,658,1662;1128;999;1670;430;589,1189;397;589,1473;2571;2569;1886;3079;1366;1948,1949;1652;1652;1473;1562;999,1562;589;837;397;589;1332;1642,1912;1456;875,876;873,874;26,430,721,722,723;873,875;1613;1833,1834;1543;999;1107,3395;1625;1308;1252,1473;1745;1671;29,589;99,100;2752;346;983;1473;3619;2231;1473;1721,3162;2121;1189;566;566,791;566,1104;1473;1473;1473;109,965;1749,1757;1750;1671;1318;2098,2099;1543;1759;999;3153;109;1189,1575;3038;858,3511;1473;105;26,691,986,1684;1178;385;632;1331;509,592,593,594,595;377,464,1655;2316;2405;1473;649;1473;1473;361,551,1686;385,450,762,988,1222;1653;2963,2964;999;2344;2621;349;406;1120;412;1672;1230;2708;354,1345;1473;1670,2162;385,1672;589;660;1230;1473;589,3471;3473;2569;1128;797,1479,1481,1484,1485,1580;951,1473;3081,3082;583;557,1454,1455;1750;450,1502,1503;406,1479,1525,1526,1527,1528;1725,1726;26,1543;395,999,1105,2500;806;1749;1331;361;3052;1609;1255;1359;29,543;1672;589;1625;589;129;358;29,589,2376,2377;1473;785;589;464,1516;1072;1749;26;1473;636,721;1473;1674;419,775;3488;496;109;837,2367,2368,2369;26,560;1301;2657;26,411,1543,1772;1984;1543;1680;589;1549,1572,1573;1473;26,999;26,1360,1361;1750;3046;1473;632,837,1543;1473;1013,1014;543;1543,1592;28,785,1543;406,1723;1260;1473;26,863;774;1107,3395;1625;1749,1758;26;390;385,1672;406,1295;1473;1749;1006;1543;1672;26;999;26;600;1473;1255;1591;450,691;758;1473;1473;2385;465;1625;589;1473;1658;430;1473;1479,1576;368,371;450,1502,1503;1248;1625;1474;476,621;1625;1264,1265;632,1473;26;436;1140,3477;354;1473;1672;26,600;589;411;26,378,562,2973;2621;548;26,2450,2451,3023,3024;1677;1762;1672;26;589;1543;1473;1473;406,2072,2366;2307,2308;436;1473;1230;413,1503;1128;26;999;1832;1473;1473;1362;1408;243,246;1749;2605;2661;1473;2363,2364;2854,2855;1516;1473;1473;385,1672;3474;1395,2206;417,589,1104;500,2088,2409;589;589,3138;2269;464;589;430;413,1107;109,1642;999;1543;1107;947,948;947,948;543;26;26,388,429,1198,1199;1625;436;1625;2005;1543,2005;1235,1236;837,1252,2031,2685;357,1156;765;2651;1769,1770;1769,1770;385,1672;1561,1616;1473;833;999;934;589;464,589;26;1473;966;1625;1215;548;1104;26,464;109,1723;543;1625;589;1473;838;504;902;109;1601;1255;26,476,544;1671;1671;1255;26;366,1749;1355;1697;1473;1255;476;372,378,411,470,696,697,1642;649;589;589;206;624;2090;1749;1082;1255;646,647,648;1255;464;3165;450;1038;999,1672;1625;589;1672,2303;1670;1674;1677;589;589;358;1230;385;1473;2569;3536;26,2635;2996;29,2760;947,948;512,543;589;1660;1473;378,1672;3205;1625;999,1777,1778;1778;406,1328;1671;1473;1473;385,1672;411,512,1433;999;26;1473;589;1672;589;589;26,1546,1547;589;622;109,1737,1738,2334;758;589;758;643;751;999,1697;1100,1777,1778;1964;604;1379;212,213,214;397;787;721;999;758;741,742,743,1562;3286;1673;1473;1625;1408;26,1240;1240;389,1708,1709;389,1708,1709;569;389,1708,1709;389,1708,1709;389,1708,1709;428,429,430,431,432,433,434;389,1708,1709;3515;947,948;2753;366,1749;1474;26,1673;406,2927;688;2482;999;1156,1429;791,792;298;1598,2555;3541;2390;386,837;1473;999,1473;624;653;1104;450,762;947,948;589;632;26,1375,1700;923;600;589;589,2080;589,1706;589;28;600;1516;1104;2826;629;430;430;1445;354;503;1473;1059,1473;1926;1461,1462,1463;1756;1671;470;1769,1770;430;557,1454,1455;1713;346;2621;3485;1473;2040;1473;1473;1331;1473;114;635;26,554;1128,2302;1729;1749,1758;1473;451,543;975;653;1473;26;464;589;1473;2210;1256;1473;813;1473;1473;960,1191;1255;1670;1473;543;1473;1473;2075;1230;1473;785;978;1473;3107;2288;1408;1408;543;1625;419,429;1302;589;3565;1026;1683;1543;1672;999;450;450;1473;879,921;3372;1986;1078;1375,1376,1699,1700;1331;109,1583;2241;632;942;1543;26,430;390;2850;1588;450;624;959;26;1220;1255;1255;1426;3053;1473;1671;959,2414;589;464;464;2764;1200;15,320,321,322,323,324,325;1865;1406;378;1189;1673;1104;430,546;26;589;109,1738,2334;589;589;1625;396,589,2101;2492;1725,1726;589;26,657;591,1168;543;1250;543;3516;385,1672;26,464,479,480;1473;1473;543,632;543;1482,1484;1805;1750;1473,1723;1625;109;1473;1625;3196;26,1786;26;26;1026;373,374,375;703;3608;879;1124;692;1228;109;627;785;1626;1625;1549,1572,1573;2853;1625;1625;406;26,109;397,1670;1543,3242,3243,3244,3245;1013,1014,1015;1473,1543;999;999;2025;26,378,1198,2263,2264;1876;26,2429;26,2429;114,26;26;26;26;2939;426,999;2329;386;1671;1062;589;947,948;1389;1256;1749;813;1408;1034;126;430;589;1625;1473;1671;1473;1625,1761;1625;1625;1588;1671;366;385;799,1625;632,3227,3228;133,383,1625;1473;1670,2105,2468;1671;385,1672;999,1671;947,948;1670;999,1671;2251;372;390,413,999;589;1473;791;632;999;385,1672;1625;588;1749;1670,1671,1672;999;1750;1128;1749;1473;1749;1441;1124;557,1454,1455;26,29,1543;2869;1473;589;1673;464;1413;464;2180;29;817;274;2344;837,1670;3466;1702,1703,1704,1705;2621;1749;354,1345;999;2005;154;1625;188;2406;1482;331;1943;1128;632,3483;2847;395,999,1562;1473;3526;26,512,543,1697,2585;2585;1473;1713;26,413,999,1684,1872,1874;1473;1672;791;1625;788;1926;1749;1670;29;1671;1543;589;1230;459;464;1255;29;1473;1473;1255;543;120,121;1543;1884;760;775,1870;1346,1347;2191;1745;3360;1669;1625;26;1670;1473;589;1749;1749;1255;1255;791;1408;372,925;1934;26,925;1671;543,837,1649,2598,2599;1473;1473;1408;102;92;543;385,1672;26;1733;1625;2202;2508;451;627,773;28;627;1670;1675;26,390;1675;1670;3596;451;1362;653;378;389,1708,1709;429;3524;1583;26,723,1675;361,378,734,811,812;389,1708,1709;389,1708,1709;389,1708,1709;389,1708,1709;354;2808;2199;26;26;1144,1145;436;109,2334;1473;1865;900;1672;29;589;589,645;1642;1516;589;589;385;430;503,589;385,503,1667;1642;589;589;589;385,503,1667;1230;509;385;464;2138;385,503,1667;758;429,1660,1661;451,503,559;411,569,589;758;464;26,372;26,372;1230;29,632;430;411,569,589;1473;651;589;26,406,766;1745;1673;1543;1543;1625;2572;735;529;1473;377;1473;1112;1750;2839;1007;451,589;26;938;70,71,72,73,74,75;589;999,1543,3104;1477,1478,1479;1104;1911;464;1473;1473;3314,3315;1673;377;2802;1625;512;947,948;1543,2089,3232;1675;1926;3373;693;26,1299,2451,3023,3024;653;1749,1758;377;1473;2826;26,572,573,1673;1473;2433;783;476;1473;26,680,999;1100,1777,1778;1749,1758;1473;114;2913;1355;451,2317;26,464;29,1543,3235,3401;589;2511,3106;837;126;2887;589;160;385,1672;1532;589;589;464;29;26;589;1675;464;3043;464;600;114;393,396,546;243,244,245,246;436;1087;1670;1473;543;450;406,1723;1670;1673;1473,2326,2327;3116,3117;2819;1473;450;2156,2157,2158;1749;589;26;385,1672;1473;1677;406;3447;109;543;1473;791;1473;476;1672;1252;1749;259;26;26;589;702;3537;2344;1237;3047;1672;451;451;1345;632;395;413;1745;791,1504;346,1130,1131;26,1672;2011;1673;1473;2817;361;1473;1473;589;589;624;426,1543,3374,3375;999;703,809,1543;999;1838,1839;29;411,569,589;26,419,1671;1543;426;26,28,980,999,2684;1345;430;152;395;361,696,756,757;808;1473;999;947,948;476;1673;406,766,803;589;2556,2557;837;1473;1473;464;589;1321;3254;1896;1671;1672;1473;26,413,999,1872,1874;1473;575,683,1059,1548,1549;1105;1473;1261;791,1559;109;358;1673;109,406;1473;589;1473;791,1559,1560;2799;2473;919;1732,2679;3167;1408;1921;1802;1255;26;1418,1749;669,670,1671,1672;1352;1749;331;109,2334;109,2334;1612;358;1762;2488;450;589;1749;1625;253;806;1543;26;1374;377,589,1122;1448;589;3086,3087,3088,3089,3090,3091,3092,3093,3094;632,2147,3147;419;1625;411,775,776;632;575;758;1128;1377;26,937,1779;683,1549,1572,1573;3380;543;1640;1749;1429;1255;1255;837;1749;1473;758;26;1056,2844;981;1671;1697;1473;1651;622;1429;999;589;1205;26;2295;1473;1408;1255;1255;1750;589;386;2963,2964;1625;1625;1502,1688;26;1671;589;1255;1255;1366;29,1473;2181;589;2200;632,1257;430;26,999,1375,1700;207;999;1543,1697;1672;1681;651;1255;947,948;26,430;29;1107,3395;588;109;720;589;1473;1473;1675;978;2666;1473;354;354;589,1671;385,1672;2118;500,725,726,959;632,1641;999;26,361,413,498,499,1516,1543,1697;385,1672;2695;1543;1762;26;739;26;589;1869;2918;464;1243;1473;2044;2550;1255;1625;1670;1562;2953,2955;419,837,1671;26;1107;291,1738;1473;331;1625;1255;3310,3311,3312,3313;2592;659;29,1642;589;589,1104;2963,2964;2963,2964;2963,2964;2963,2964;2963,2964;2963,2964;2963,2964;614;947,948;999;26,361,378,734;999;589;830,1198;417;385,412,984,1189,1190;26;589;29;947,948;26,396;947,948;377;1543,2530;1625;26;1249;1473;1375,1376;999;26;26,1673;1174;947,948;1473;377,503,589,1655;26,589;1673;1671;1473;999;386;780,781;3252;1611;430;1543;1672;2379,2380;2380,2393;632,2275;1670;1697;1672;26;1671;691;680,999,1681;1473;26;451,1655;26,999,2235,2239,2240;1255;1673;1365;1673;1473;1473;2242;1670;464;635;464;464;1308;1473;26,450,762;1543;758;758;837;589;1107,3395;961;1655;1473;589;1670;1671;837;1749;411;2173,2174;1299;429,621,2569;791;589;548,589,959;1516;476,734;1408;1243;3570,3571;915;1473;1857,1924;1543,3242,3243,3244,3245;109;1673;419;331,1712,3345;1672;1669;3325;411;1473;1670,1671,1672;902;2175;589;2372;1725,1726;597;397;1473;406,1479,1525,1526,1527,1528;708;451;947,948;1671;109,406,2304,2305;1473;589;1749;1255;1731;2661;1234;88;588;1473;1749,1758;837,1059,1473,1531;109;1670;933;589;1473;1473;377,545,589;1473;1473;947,948;589;76,3070;396;1473;349;664;406,1479,1525,1526,1527,1528;1473;1625;406,2311;386;1148,1418,1473,1475,1482,2512;791,1504;1473;589,2063;589;1712;1656;1750;1234;1625;589;589;361;430;1040,1662,3343;479,1072;1473;1473;1107,3395;2569;947,948;1473;1473;2328;807,1479,1481,1485;109,406,2495;1107,3395;3316;1749;589;396,430;2344;134;966;1749;721;857;452;429;109,110;354;1059;1408;636;589,959;2703,2704;1408;1473;1473;1473;1473;1692;28,566,1473,2951;1408;2890;390,589,628,2100;3153;26,476;1473,2259;649;1673;797,2660;26,994;1672;470;-27,-28,-29,-1544;26,987,1684;377;1473;1473;1739,1740;3336,3337;589;496;3316;791;1625;26;832,2462;3044;1110;26;691;3164;680,1107,3395;3123;743;1473;1543;1107,3395;791,1550,1551,1552;385,2336,2337;1670;1381;1473;2698;1104;1473;114;26,725,878;2478;589;1553;806;711;1089;3059;2344;26;598,2579,2580;3156,3157,3158;3099;806;2529;2529;1543;1543;1634;419,1095;1851;562;3615;600;653;1625;406;999;589;2627,2628;1473;1749,1758;683,3379;1212;788;758;758;397;2344;747,1670;1473;26,575;397;1725,1726;960;1670;1473;1749;1255;1625;1673;1972;1482;3477;837;385;390;496;858;2089;680,999,1684,2089;1750;972,2735,2736,2737,2738,2739,2740,2741,2742;26,937,1779;1255;1473;788;589;3574;2003;543;477;358;3105;785;390;390,680;1473;1189;397;2857;947,948;26,2425;1326,1327,1670;589;999;1473;114;1671;1672;346,1130,1131;1950;837;411,569,589;999;3488;589;1260;1255;464,589;1625;1473;1473;26;3233;1126;1584;632;1670;589,1672;26;1059,1473,1529;1026,1725,1726,1727;2047;1625;589,2063;589;1473;1175;1461,1462,1463;1473;413,999,1543;26,450,589,785,1291;26,999,2451,3023,3024;1473;1473;1561,1616;1625;430;670,999,1104;397;1750;735;589;758;1128;837,3146;1473,2815;1516;2033;385,1672;2400;1473;786;2860;2811;464;26,64;26,64;61,62;26,64;26,64;26,64;26,64;26,64;26,64;26,64;589;479,947,948;636,2770;653;331;2963,2964;1473;464,1659;1769,1770;1769,1770;1769,1770;1769,1770;1769,1770;822;822;788;632;503,589;589,683,2920,3411;589;788;2127;476,1316,1543;1750;77,78,3208,3209;1408;1473;109,1505,2466;2621;26,413,1672,1872,1874;837;1473;406,1479,1525,1526,1527,1528;2629;1107,3395;1255;114,2881,2882,2883,2884,2885;632,1592;1255;1255;775;1674;1762;3421;26,691;1252;2210;1255;1255;385,1672;1255;451;1255;451;1255;791;464;378,411,696;470;2888;384;882;1585,1586,1587;1473;430;1625;1749;1445,1458;1670;1473;791;543;2621;464;1473;1625;856;1473;1670;1672;2551;26;758;893;589;589;2760;543,589;589;589;589;589;503;430,589,1787,2057;589;589;589;503,589,2415;346,1130,1131;436,1441;1671;1543,1672,3242,3243,3244,3245;589,1669,1672,1681;26,2362;758;589;999;884;1474;3160;2860;2137;589;3259;1473;417;1473;635,1602;1670;406,1383,1429,1608;406;114;397;589;931,1240;389,1708,1709;389,1708,1709;389,1708,1709;389,1708,1709;109;565,566;1604;1745,1751;1473;1473;757;3477;2253;788;1230;1749;632,2568;26,1543;1750;543;2204;667,999,1473,1643;1473;1255;1261;1934;1473;1473;589;386;500,744,1037,1978,1979;26,937,1779;1252;589;26;589;543;503,589;589;26,2745,2746;1670,1671,1672;740,954,984;476;413,1543;406,543,999,1505,1543,1573,2984,2985,2986;470;1429;589;464;26;464;543;1107;26;569;397;430;1473;1473;999,3049;1672,2077;450,1355,1482;1625;386;543;1429,2072;600;1473;785;26;29;1342;1317;1473,1653;1749;1473;653;1140,3477;529;109;1408;26,27,28,29;1128;1749;1750;589;109;1473;451;346,1130,1131;1749;589;1625;419,429;419,429;419,429;419,429;419,429;419,429;1308;105;1262;26,372,386,419,498,825;397;1449;114;649,1189;430;306,307;632;1670;1991;26,1176,1257,1647,1697;2340;1625;1625;858,1162;429;2334;76,1765,1766,1767,2982,2983;1625;1713;1670;543;1671;543;543;999;1672;632;1562,1695;589;1422;542;1625;1473;26;1059,1479,1616;1127;413;655;385,1672;655;1625;361,1642;1625;1625;1473;1408;2175;385,503,1667,2138;2653;109,1864;1473;2650;346,1130,1131;655;589;1473;451,470,680,1382;1674;837;1408;837,1059,1473,1531;1503;346;411;947,948;2621;1697;350,351;1670,1671,1672,1673;1756;2562,2563;1745;1178;385,1672;26,1543;26,109,993,2768;999;1623;1698;632,1543,1955;2963,2964;569,775;1002;348;1473;1749,1758;1473;361;589;1761;1473;2809;109;589,1197,2205;430;2045;430,2086;450;1473;1670;543;2634;1345;1255;27,1100,1672,1774;1669;1619;1473;2709;2016;998;1625;1473;2465;589;1473;3206;1749,1758;1156;1473;1473;398,530;1255;1473;26;26;3487;1408;1473;26,1825;139;476;1345;396,546;1239;712;354;939,1429;406,1723;464;806;3565;2615;1750;1671;3393;3018;1543;589;1308;1473;809;358;397;464;429,555,556,557;806;1255;1855,2928,2929;1473;1713;589;653;1473;26,396;26,377,464,479,496;1473;543,3475;1750;450;1473;1473;632,2926;1750;2799;546;1671;3513;26,1338;1671;461,477,589;461,477;589;3517;1473;2331;879;1382,1473;389,1708,1709;389,1708,1709;26,429;123,1957;1750;3063;1750;1671;1255;1255;1255;1473;1143;531,532;436;965;26,1679;27,1100,1672,1774,1777,1778;1275;26;1777,1778;26;27,1100,1774,1775,1776,1777,1778;1750;496;1345;2842,2843;658;885;589;1230;947,948;429,461,463,464;653,1727;2265;3420;430;1189,1473;589,725;543,837,2598;385,503,1667;429;385,503,1667;385,503,1667;429,1660,1661;589;589;385,429,589;385,503,1667;589;385,503,1667,2138;26,589;589;507;589;411;464;2058;947,948;1473;1473;1543;1107;1473;109,2342;1473;788;1473;3314;1473;279,280;1749;205;513,514,515,516,517;513,514,515,516,517;476;1671;1671;589;1670;1543;1252,1473;837,1059,1473,1531;396,430,546;358;2826;999,1104,1473;1749,1758;1355;1445;837;406,1429;464;377,429,493,494,495,496;3177,3178;947,948;1749;806;589;1473;589;589;496;1408;1749;2911;620;1625;1673;1473;1408;2011;26;2491;1255;2566;1749;589;1255;2187;1473;2148;3055;26,29;29,577,3235;1670,1671,1672,1673;788;2706;589;2769;28,543,632,1543,3437;1395;785;788;806;109,1723;1762;998,1669;26,476;1473;26;1473;2720;109,1738,2334;1473;406;794;1749,1758;667;26;1473;589;788;999;999;999;354,2621;589;1670,1671,1672;589,1675;26;1787;725,959;2045;411;758;589;589;26,589,1516,2689,2690;589;546,1212;430,546;476;806;1750;3220,3626;1725,1726;1543;761;500,1089;1473;2523;406;26,2084;1319;114,835;1104;26,411,450,497,1418,1671;385;1650;1255;632,1840;788;1749;589,649;1568;1255;1713;1761;1749,2638,2639;1473;543;26;1749;1255;378;2538,2539,2540,2541,2542;1331;1362,3495;2102;2454;2615;357;1625;496;29;176;837;1732;395,2453;413,999;589;1473;1473;276,277,278;2340,2548;2914;28,1714;1824;1473;3557,3558;589;26;590,591,1673;3441;1543;29,577,1543,3235;1749,1758;1724;1750;2082;361,696,756,757;1749;430;1543,3242,3243,3244,3245;1473;26;26;999;1473;2291;1885;649;1473;1543;999,1543;1543;1671;1128;3465;1625;1359;1331;2699;1473;1473;470,1671;487;2306;1671;1013,1014,1015;1886;1473;837;29;947,948;758;947,948;2935;1345;2637;999;807;2225;1167;2114;1762;366;346,1130,1131;589;1750;1543,1697;1543;470,581;1673;570,734,954;500,501;109,2334;1473;105;2113;2710;1671;1473;26;451,589,2600;1725,1726;1913;999;133,354,364,837,1013,2588,2589;589;1408;390;1749;999;354,1684,2514;473,999,1543;809;413,1543;1473;1749;589;1749;1557;589;1508,3203;1230;1749;1473;806;1408;850;1482;1625;589;2574;758;1473;26,29,937,1779;1671;3410;6,15,320,321,322,323,325;1273,1625;806;1670;1255;1473;1255;114;1473;2978,2979;960,1922,2008,2091;385,984;1255;1255;1104;1255;1255;1473,1672;1854;1445,3180;634;1890;1120;385,451;1255;1255;632,992,3151;1255;1099;26;999,2567;1671;26,1499;1543;372;389,1708,1709;1543;681,1953;1733;133,1482;727,733;26;1473;26,1375;3145;600;999;3627;589;999,1671;26;1473;1473;1473;975;3072;589;464;1104;589;1671;26,361,498,499;621,1257,1697;999,1671;26,464,479,1073;589,999;691;893;548;548,893;753,754;1672;1625;1750;109,1469,1895;589;346,1625;1056;231,232;1473;1671;1749,1758;3355;1255;1670;1473;361;1255;1255;589;406,1429;1671;436;1749;26,543,837,1503;589;589;1345;1255;26;3310,3311,3312,3313;3591;3561,3562;3122;2818;26,29,1642;451;2049;1350,1608;1516;2963,2964;2963,2964;959;2963,2964;2963,2964;1285;543,589,611;396;26,430,589;26;758;396;503;758;728,731;1642;589;611,2048;947,948;543;1473;1749;2621;683,3379;406;589;459;26;588,653;1473;464;1473;430,638;2428;109;2138;420,3056,3057;728,731;1543;476,999;26,999,1671;498;1655;464;589;1655;999;999;1543;589;1026;632;589,1516;1750;1750;791,1504;1473;397;1449;791,1473,1535;2145;1426;589;999;2421;1792;1473;1473;999;26;1543;837;589;1104,2000;589;1473;346;385,1672;385,1672;2621;1671;1473,2054;406;947,948;999;947,948;680,999;589;674;837,965;2730,2731;1725,1726;1307,1715;109,411,589;2616;896;3077;543;1671;1473;1473;1473;1473;126,2494;346;1625;1473;1473;1473;1750;649;627;3316;476;396,430,464,546;385,430,464,589;346;2767;1255;589;1230;1066;464;1673;1331;346;1473;1670,1671,1672;1473;3602;1104,1980;589;385;451;1814;837,1059,1473,1531;1255;397;1255;589;396,500,2088;346,1130,1131;653;180,181,182;588;509,589;589;1189;2223;758;1473;349;1749,1758;385,451;385,451;385,451;29,632;498,1680;635;589;377;1473;1697;1543,1562;1473;1089,1363,1364;1473;1408;1625;312,313;1750;413;361,1227;406;2371;1647;441,585;1508,1563,1589;1750;26,430,874,876;26,873,874,875;725,1977;1473;3017;346;1408;413;1479,1481,1482;3440;589;902;1473;1473;1212;2752;2011;406,1429,2171,2172;3153;178;1046;1473,1554;1482;1608;406,1723;1473;1543;1473;1473;1473;366,369;703;589;1473;1016,1017;1625,1749;783;2382;1230;1110;1983;1292;1473;1473;1473;837,1059,1473,1531;1169,1170;1473;2837;1473;1749,1758;377;589;331;450,1291;97,98,358;496;632,785,837,1653,1762,1814,1818,1819;358;464;806;788;805,806;366;1749,1758;740;3501;149,150;149,150,3601;153;1749,1758;2936;1255;1255;1473;1355;1216;698,699,700;1669;1473;569;1473;2140;1473;1473;1750;809;653;1677;589;2018,2019,2020;1473;589;1473;3563;2344;26;800;1625;406,1479,1525,1526,1527,1528;1104;1128;1549,1572,1573;1473;1255;3377;1543;1926;843;26;2372;2752;26;2463;716;26;1473;1749;331;653;1252;368;3477;3560;1672;1543;413,1562;413;1473,1716;972,2735,2736,2737,2738,2739,2740;413,1543;1583;1473;1473;1473;1148,1479,1579,1580,1581,1582;1473;1749;1750;2653,2654;999;589,2085;413;1750;390;1916;652;999;1189;3006,3007;1357;589;589;788;1926;2972;1605;26,1543;26;1673;26,439,813,1952;26;1543;1473;26,1499;26,1588;1448;1473,1499;1749;1473;3573;1625;999;1749;999;1473;1543,3242,3243,3244,3245;256;589;1749;999,1105;1473;450,997;1750;436,774;2101;361;1724;2621;1713;1473;26,396;589;1382,2259;1453;26,2648;1026,1973;1543;1107,3395;2344;26,64;26,64;26,64;26,64;26,64;758;1589;114,2881,2882,2883,2884,2885;451;1749;2004;26,29;1473;2661;922;282,1769,1770;1625;1769,1770;1769,1770;1625;372;1749;1414;1750;1395;1625;589;1429;589;397,429,863;26;1745;221,225;1625;406,1723;1255;2621;1625;3061;1625;1507;758;1516;109,2334;589;625;1255;1750;1255;758;331,1642;426;1255;1473;947,948;631;1255;1255;1255;758;947,948;1178;758;758;166,167;1473;1473;1919;1473;1473;1625;1331;1230;624;589;1625;947,948;1616;758;503;589;1671;1673;1473;456,3583;1625;1189,1583;959;589;26,28,29,589,1642,1697;464,589;2523;2812;476,1975,1976,1977;331;451,1955,1956;2045;589;589;2533;26,1323,2673,2993,2994,2995,2996;589,2017;477;589;589;1749;386;758;331;1255;406;1543;1928;1749;1473;406;813;928;974,1464,1465;438,503,796,797,798;589;396,430,546;947,948;758;2072;1750;331;1625;982;1981;589;109,1473;1473;3191;978;3191;413,1543;2558;999,1100,1777,1778;389,1708,1709;543;2646;1473;1625;1621;459;26;109;1762;109;464;406,1723;464;1672;512,543;947,948;758;2661;589;589;1178;1178;589;589;589;464;2029;1749,1758;1749;788;1473;26,27;3167;1750;28;1670,1671,1672;2874,2875,2876;788;1671;1473;2187;947,948;616;1184;3538,3539;3050;1479,2941;1926;543;600;939;1473,1717;26,1803;2661;26,1502,1597;1625;2210;1670,1671,1672;1625;1189;1670,1672;1669;354;406;528;1749;1473;3426;1473;388,1473;589;1140,3477;1708;1473;1625;2463;450;450,762;1355,1971;450;26,1543;1448;548,624,1467,1468,1469,1470,1471,1472;1473;3507;395,413,1673;999;1670,1671,1672;109;358;1408;1749,1758;1670;2327;1543;464,589,947;29,1473;1473;1473;26,27,28,29;26,1176,1257,1647;1473;1473;806;268,269,1074,1075;797;2458;2391;1671;29;589;543;589;588;589;2958;589;136;1473;833;1473;588;1750;2006;1473;109;109;76;589;26,1418,2178;26,589;1013,1014,1015;1189,1473,1543;1189,1473;406;999;1189;26,1679;999;26,1543;361,1642;361,1642;361,1642;470;1892;1255;806;1408;1625;346,1130,1131;1942;653;2621;109;543;397;2621;758;1375,1701;3109;589;589;500,501,611,1197;26,1697,1778;372,3391;26;998;1697;372,419,1670;1672;389,2039;1673;999;1671;930,931,932;1189,1473;1712;1473;1255;28,29,1562;1674;1473;1625;385,464;589;1088;430,546;361,589,1543;589;411;999;2136;430,546,1212;589;1107,3395;26;589;1333;2190;1104;377,589;1543;1749;1762;1237;358;1473;3316;1749,1758;758;999;589;109;2440;1750;26,723;1097,1625;1473;1473;26;26,450,1670,2510;1473;398,503,3486;29;1473;1712;512,543,1473;396,589;1473;354;2138;1750;589;1670;358;331;1473;1543,3489,3490;1104;2958,3461;1625;1402;2187;1050;2343;589;1473;1473;114,512,543,589,1673;1355,1482;1189;2845;1255;616,1749;447;1408;2463;26,543;2463;1997,1998,1999;413;1502,1693,1722;1473;26,438,440;361,665;61;1671;1441;575;1685;1749;589;1331;1408;105;1473;589;1569,1570,1571;1128;3155;430;389,1708,1709;3097;348;346,1130,1131;543;503,589;389,1708,1709;389,1708,1709;361;1230;2504,2505,2506,2507;26;1026;109,2334;1396,1397,1669;1749;543,837,2598;385,503,1667;758;1032;2045;464,589;426,1107,3253;589,1473;589;589;385,503,1667;503,1666,2138;385,503,1667;589;589;1104,1557;1443,1444,1445,1446;512;1429,2192,2485;28,419,999,1670;1473;1749;921;503,589;723;589;758;1107,3395;1671;1762;1473;2044;2055;2055;2055;1473;1588;406,1308;1408;1473;1479,1481,1484,1485;1473;1725,1726;476;1011;1625;406,1723;1399;1745;3028;947,948;1749,1758;1473;1295;573,1673;1625;1473;1320;2390;3099;29;1625;1618;1473;1761;1408;1104,1969;3370;837;406;1473;450,1239,1490,1491;1402;589;587;1128,1670;589;1671;2499;1697;1749;1473;2327;758;589,2727;947,948;589;2219;331;947,948;589;589;1350,2593,2594;1351;1473;1671;2008;543;589,1725,1726;2733;1473;632;2872,2873;1473;1671,1672;1674;644;28;588;470;385,1672;1473;1750;1749,1758;589;451,500,501,502;270;361;914;65,66,67;1255;1255;26,361,960;1909;1189;1230;1408;683,1543,2920;470,1749,2320;2346,2347;1473;3134;1672;1473;680;426;821;1745;2536;1670;331;1473;1473;297;2353;26,413,999,1872,1874;1345;766,1473,2280;1543;358,359,360,1625;649;1473;1473;1473;1140,3477;26;1882;1672;2771;1104;895;947,948;740,1625;1473;1473;26,413,999,1872,1874;26,413,999,1872,1874;1473;653,1473;1626;1473;109,1473,1573,2632,2831,2832,2833,2834;1974;1426;1473;1473;1473;1473;1473;450,837;1473;396;947,948;589;464;589;111,112;114,1543;1473;1473;691,1670;426,999,1562;395,1562,1670,1671,1672,1673;3359;1255;3195;155,156;1473;346;1750;2475;543,589;1473;76;1473;1749,1758;1473;632;1749;806;361,1103,1104,1105,1107;2011;109;608;589,2062;114;1670;26;1625;1409,2120;3176;1596;444;163;785;301;1473;354;1473;589,2048;589;1732;649,1473;397;1756;397;801;2800;1473;26,691,2425;1441;126;381,382,1625;1473;1408;1408;2725;2074;589;589;2777;1473,1725,1726;26,937,1779;1473;632;126;1543;26;589,2085;26,1543;1255;1749;1672;784;114,1407;1255;331;2372;2375;1749;254,255;703,837;26;26;1408;3153;1473;1749;837;1473;1408;1473;1673;26;1473;589;26,413;29,632;2960;937;589;1179;26,438;430,464;947,948;455;3031;1543;26,396;29,589;1670;26,589;26,396;1543;1670;361;26,396;406;2625,2626;589;406,1723;512,543,1697;1625;957;1473,2717,2718,2719;1473;464;1625;1473;1473;1473;450,1291;1749;354,791;1625;1473;354;1107,3395;464;947,948;888;1720;1473;0,1,2,3,4,5,7,8,9,10,11,12,13,14,15,16,320,321,322,323,325;758;76;562;1355;589;1647;109;947,948;589;569;26,396;947,948;758;758;758;1670;1749,1758;1473;1674;653;557,1454,1455;1671;366;503,589;1473;377;1931;417,500,501;15,320,321,322,323,324,325;809;1671;1473;2011;589;26,1673;3460;2187;999;464;1655;589,3348;29;26;1331;377;1438;1473;1673;290;1625;1750;377,1655;984,998;837;26,413,1676,1872;26,413,1676,1872;589;589;589;1473;758;1473;1750;1625;1670,1671,1672;1795;1795;1473,2584,2945,2946;569,1164;2267;2125;1473;1473;331;26;947,948;1414,1426,1473,2682,2683;1473;436;653;648,863,1669;947,948;1473;26;999;1255;109;1841;1473;837,1433;1408;1473;1230;637;126;1828;1473;1255;1023;955;2378;1408;1473;140;1625;999;109,2334;1473;464;1750;1189;1255;1473;653;1473;947,948;589;26,450;385;589;26;589,725;589;1761;2958,3461;223,224;887;2618;1749,1758;785;758;1735;1473;385,1244,1245;235,236;1308;1749;1625;1670;589;1473;589;512;805,806;543,725;1756;377;611,1197;1894;377;3316;1749,1758;1473;1255;837;1038;873,874,875,876;157,293;1216;744;1749,1758;26,455;1473;1671;354;589;413;385,450,1670,2256;2534;2911;1473;3316;1473;354;589;1473;1616;1625;1672;999,1543;1671;389,476;1255;1239,1473;464;1473;2260;1473;1473;589;451;589;791,1473;26;361;1750;1107,3395;1107;1107,3395;2756;2921;406,1479,1525,1526,1527,1528;837;114;354;1750;1540,1541;1252;1750;1672;109;413,1107;1473;26,398;503,589;354;1625;3570,3571;1543,3242,3243,3244,3245;1473;1104;1255;26;385;1230;1543,1697;26,1543;1750;3316;1140,3477;464;791;331;1745;1220;2661,2663;632,1473,1608;366;1672;1473;385,1672;1299,1412;1473;1749;616;109,1738,2334;916;29,1473,2259;2513;346,1130,1131;806;691;758;1543;208,209;2388;1625;1473;1311;1671;1189;29,1257,3356;426;972,2735,2736,2737,2738,2739,2740;385,1672;1473;589;346;3378;589;2472,2473,2474;358;788;1732;503,589;589;1543;1189,1473;26,545,589;109,795;450,1582,2407;546;543;1750;1385;1473;451;1620;2621;2162,2163;999;1591;947,948;695;1059,1473;1473;1745;1749;1473;554;1543;1473;450;680,1107;354;668;1473;451;589;1673;1350;758;385,1672;2051;1473;1473;543;26,396;1473;1625;1473;354;1473;1769,1770;1769,1770;1769,1770;1769,1770;1769,1770;1769,1770;1769,1770;1865;2372;1026;1473;503;1750;1625;397;1345;1749,1758;999;1473;1473;1625;1671;346,1130,1131;1930;1104;1473;354;589;1473;1543;1473;2019,2020;26,1606;1255;406,1479,1525,1526,1527,1528;1255;1473;1255;1255;947,948;1255;758;2552;1473;346,1130,1131;1761;406,1723;771;1899;1243;2138;1473;379;1749;758;589;1331,1332;837;464;26,1546,1547;1625;1749;26,2073;837,1617;1905,1906;1906;1750;685;932;947,948;758;861;1750;589;1749,1758;299;1059;1059,1573;1473;1670;1450,1451;1240;2573;1473;1350;1749;1503;1473;1750;3582;386;1749;1534,1535;1543,3242,3243,3244,3245;648;1670;589;377;589;589;589;1750;1749,1758;813;1107,3395;346,1130,1131;1429;372;1750;1671;1543;1473;1750;354;26;3614;1473;1473;589;2470;1317;1255;1255;2801;999;1749,1758;1473;902,1104,1929;1473;496,837;589,1050,2299;1750;1995,2309;1473;1697;2910;990,991;1255;589;361;512;114;346;1539;758;1697;1625;1473;1625;557,1454,1455;1473;-2851;3519;1473;1749;397;1625;543;1473;346;939;703;589;624;589;1673;1749;26,27;26;837;1007;1473;589;358;1756;1750;26,64;61,62;26,64;26,64;589;1670;758;361,1642;1473;133;1128;947,948;589;589;1473;2072;1473;1255;999;26;26;1543;1543;1473;26;999;450,762,1553;2501;1255;1473;1625;1473;234;1562;999;233;2079;426,999;366;406,1723;2932;758;1583;1749;413;1255;1473;758;758;26,396;999;26,438;947,948;1434;1415;397;1473;1926;2533;2344;358;1625;1750;1473;26;1625;653;624;464,589;589;354;785;1482;426,999;454;464;1473;411,589;589;546,589;569;3635;476;999;1155;1473;1255;1543,3242,3243,3244,3245;366;26;1473;907;2693;1473;426;1473;653;1089;1473;1749,1758;1473;406;589;1749;2806;26;813;2842,2843;29,1257,3356;2032;396,430,546;464;589;1473;76;26;464;1205,1211;758;545,1663;589;589;385;441;758;589;589;464;385,830;429,464,589;758;1642;939;1159;2072;1107,3395;653;1724,2359;1473;406,1723;358;2621;1625;1255;1987;1769,1770;94;3390;27;2621;788,1850;947,948;1473;767;1749,1758;109;999;1473;1473;1473;406,2074;788;1543;1473;1749;3349;385;1473;1473;653;3163;1749;464,589;427;1473;26;346,1130,1131;76;1473;2236,2237,2238;3569;486;1214;1395;464;1625;1142;589;947,948;1230;2046;758;947,948;758;947,948;1230;589;564;546;947,948;28;109;589;589;26;26;1473;999;589;999;385;1671;450,762;1473;1761;2011;109,2334;358;385,1672;3083;361;616;1473;1625;413;1620;2591;385,1672;26;1255;496,776;2763,2789;464,503;1473;354;105;1408;1543;1543;1390;1543;902;26;1255;26,999,2692;396;464,589;1749,1758;2187;1671;1669;1107,3395;1672;1543;1107,3395;411,569,589;26,1107;378,476,541,1673;1669;1345;26,413,1673,1676,1872,1873,1874;265,266,267;1104;229,230;589;26,3173;939;653;354;26,413,999,1872,1874;471;2044;26,450,999,1333;1445,1458;1473;837;429;1477,1478,1479;1622;1745;1713;1750;616;1395,2274;29;1615;811;105;1229;1749,1758;1671;616;589;1750;703;1473;26,999,2795;397;378,569;1333;1750;109,788,2334;1473;1749;1255;1059,1473;1749,1758;617;868;347,2196;301,302;624;624;3316;1473;1473;1013,1014,1015;114,648,2748;385;785,1128,1252;1706;1671;2621;157;1255;3240;3039;791,1550,1551;132;999;27;1473;88;1499;396;26;879;589;26,937,1779;26,1780,1781;331;2436;1473;896;1255;243,245;349;142;450,1502,1593;476,1033;2621;1255;1255;1749;3116,3117,3118;26;26,2443;1749;406,1479,1525,1526,1527,1528;26;589;569;26,2919;632,1502,2910,3200;1473;109;26;456,1662;1473;1543;1671;978;589;26,1546;26;589;26,2524;589;377,429,496,503,1071,1072,1073;26,999;385,1672;1059;1543;17,18,19,20,21,22,23,24,25,337,338,339,340,341,342,343,344,345;1148;524,525;26;397;1543;543,837,2598;109;1625;1714;1750;758;451,589;126;1473;1104;1749;1749;1473;1745,1761,1763;1733;791;126,257,258,366,1738;1255;3310,3311,3312,3313;3310,3311,3312,3313;17,18,19,20,21,22,23,24,25,337,338,339,340,341,342,343,344,345;947,948;2963,2964;589;947,948;947,948;589;947,948;947,948;377;1246,1920;543;589;589;1673;632;29;26,396;785;2083;1473;1107,3395;1473;1473;1473;386;1677;430;1749,1758;385;385,388;589;1331;1714;589;377;1750;1018;1400,1401;26,413,1672,1872,1874;1255;2621;2652;1473;1750;464;589;999;1750;2092;3068;1750;1303;109,1737,1738,2334;1473;1473;1473;589;2316;999;947,948;1543,3242,3243,3244,3245;947,948;667;1473;1178;1769,1770;406,1479,1525,1526,1527,1528;947,948;947,948;1473;3525;1750;358;653;939;1749,1758;1625;1750;261,262;346,1130,1131;1473;1749,1758;29,3381,3382;653;758;543,589;464;791,1473,1535;589;1749,1758;2896;758;26,518;589;1331,2838;529;361;762;2584;1128;2828;1473;372,1229;653;1255;589;1408;1473;26,27;413;1473;1750;1750;1749;1124;1255;947,948;1473;1473;2643;1473;2146;2779,2780,2781,2782,2783;1671;1104;2260;26,27;1473;1473;401;1673;386;999;794;239;1750;1725,1726;891;649;3246;1473;385,1672;1749;1625;622;1255;430;1750;1543;1750;1745;114,131,3546,3547,3548,3549,3550;1543;354;1477,1478,1479;1672;1473;1473;1473,1543;632,1653,1722,1815,1816,1817;806;806;755;488;797,1128;3316;310,311,346,1750;109;1749,1758;354,703;346;1625;385,503,1667;1473;703,3316;653;1473;2249;2333;294,295;1473;1140,3477;3477;1473;569;1569,1570,1571;1674;589;1672;1473;1382,2360;1672;2011;1345;1625;1473;1473;26,29,543,1257,3356,3357;1499;1750;1750;589;1473;1473;385,503,1667;2640;537;2640;972,2735,2736,2737,2738,2739,2740;2026,2027;450,999,1239,1278;1473;1713;464;758;1473;2760;346;1543;1255;999,3096;624;1750;496;385;3258;974,1464,1465;947,948;2423,2424;900;589;1386;1255;1255;980;450;758;758;26,1479;26;1725,1726;406,1479,1525,1526,1527,1528;1859;1255;653;411;589;725,726,959;406;126;3598;791,3066;464;406,1429;1110;683,837,1252,1382,2033;1473;578;464,473;411,569;377;2060;947,948;3012,3013,3014,3015;79,2889,2891,2892,2895,2897;464,589;999;1355;529;719;1408;1713;1625;999,1100,1777,1778;385;349;3323;1750;1473;1769,1770;1769,1770;430;2058;589;589,1473;1625;622;1750;503,1665;589;999;758;1255;26;1473;1473;529;1255;758;589;2072;406,1723;1473;1543;1625;1473;109,2334;346,1130,1131;1830,1831;589;947,948;1473;653;1473;1212;203,204;589;589,2017;2007;1216;1671;1749,2384;652;109;947,948;1473;3316;109;406,1543,1725,3338;1750;26;1750;497,543,1042,1091,1670;1104;126;496;653;632,3409;3221,3222,3223;3221,3222,3223;3221,3222,3223;1625;1263;26;1473;1969;1473;397;1094;26,27;1059,1473;29;947,948;589;947,948;1879;3167;1769,1770;1749;1255;1255;1255;1473;1315;1473;1473;1672,2077;589;26;2227;1473;1583;436;1473;1473;1625;1345;1625;435;1348,1349,1350;598;1473;1473;346;331,450;1473;1473;999,1543;1473;1670,1671,1672;1749;1189,1473;653;450;624;26,27;999;1204;346;2048;1473;1543;1255;947,948;1935;1750;1473;1749;503,589;758;26;2321;947,948;2011;406,1723;3316;861;758;1473;785;1747;26;1473;1724;758;109;589;758;26,64;26,64;1671;1749;1625;3330;26,3227,3228;1672;1673;1473;1473;15,320,321,322,323,324,325;1473;862;1179,1216;132;346;385;2344;1592;1473;3462;1671;758;1749;358;589;1761;2344;939;1473;451;1104;1024;385;361;1473;118,119;1473;1255;1750;472;999,1107;505;589;758;1749;893;3399;653;2314;1626;1749;1473;1625;2048;1672;1739,1740;450;2041;464;2132,2949;3153;1355;29,1697;1473;1473;653;1749,1758;1473;2461;408,409;1543;600;1227;2031;1850;849;1543;589;947,948;589;1473;2138;589;1749;1473;1473;26;1473;1062;1739,1740;806;1749;947,948;1673;788;999;1672;1473;26,450,1492;26;1445,1458;1926;1473;1473;2301;1750;1891;430;1107,3395;464;2055;2055;589;589;3327;464;1473;1333,1697,2976,2977;589;464;1750;3339;1473;947,948;806;406,1723;1026;419;1671;1473;589;1059;1255;788;1473;397;406,1479,1525,1526,1527,1528;151;2011;1473;1473;1473;2193;26;837,1460;464;589;589;1678;999;589;29,543;1473;1594;385,3611;1750;1255;1548;1473;589;1749;346,1750;837;1670;1557;1625;26,451;917,918;1107,3395;1258;1473;1343;1473;3523;1473;2489,2490;1745;1543;1749;999;1543;1107,3395;26,413,1872,1874;1107,3395;546;354;108;1382;26,395,413,999,1872;1543;1669;1543;1543;999;1473;1107;406;114;1104,1473;26,27;1897;346,1130,1131;2175;589;2221;2011;1625;791,1473,1535;1473;1473;1473;3197;2276;464;377;1434;1331;589;1473;436;1750;616;1585,1586,1587;141;2352;1761;1473;3514;1673;1673;1473;1243;1387,1388;1473;1749;1750;1473;476;1625;1477,1478,1479;868,2196;624,632;1473;109;589;2011;1473;589;26,1697,2008,2970;406,1479,1525,1526,1527,1528;589;589;26,2856;1334;758;758;1223,1473;464;3424;1625;837,1460;2227;114;1255;2984;1221,1252;791;136,137;1625;26;2777;1671;1625;413,1107;109;3385;947,948;758;758;509,589;548;1128;512,1672;1473;1712;1473;109;1750;358;1809,1810;1239;1750;693,1359;1671;1473;354;1750;589;2138;385,503,1667,1668;411,569;947,948;758;114;589;1750;758;331;1473;346;1473;3386;109,3168;2764;1671;1673;385,388,484;1473;1252;26,413,1677,1872,1874;1888;503;26,413,1543,1872,1874;1104;1473;1473;589;1189;589;426;529;1543,3242,3243,3244,3245;1473;413;1769,1770;1171;1415;147;464;758;589;1473;589;3316;398,632;1473;1750;939;1670;1750;1473;703;2341;464;3449;1473;465;589;1625;1473;758;727;1473;787;1473;1501;406,1723;1255;758;616;1473;1749,1758;785;589;758;1473;385,451;616,1749,1750;1128;1749,1758;1750;1625;1749;873,874,877;26,1708;1104;589;1725,1726;157,158;837;2283;2283;589;543;109;785;1670;2826;589;589;2167;1473;589;26,1546,1547;1889;891;406;1107,3395;1229;3472;1473;1473;861;1632;1750;1255;1473;1128;947,948;2495;632;1055,1056;185,186;1750;758;589;331;2609;1473;26,27;1104;1473;837;385,1672;1672;28,378,632;1473;109;1625;2640;2640;3586;1473;26;972,2735,2736,2737,2738,2739,2740;1473;1473;26,27;1473;366;1128;1345;999;366,616;1750;1750;1255;114,2881,2882,2883,2884,2885;1448;2597;632;833;464,595;3246;346,1130,1131;1750;653;791,839;1473;589;26;411,569,589;1473;354,837;1473;26,354,406;464;2072;999;947,948;503,589;1250;547,548;3368;2105;1473;109;1543;1255;2006;758;589;1473;788;1769,1770;1769,1770;1769,1770;1769,1770;2358;397;1345;1473;543,999,1543;1625;109,1557;788;1057;705;3201;817;1255;947,948;1473;26;26,64;26,64;26,64;758;1625;1440;1255;464;557,1454,1455;1670,1671,1672;1448;412;1427,1428;947,948;366;758;791;1584,2036;109,406,1332,1493,1494;29,451,543,2219;947,948;546;947,948;1749;758;366;1252;116;1750;1947;1750;386;2469;2074;26;2621;109;758;346,1130,1131;758;569;589;1473;1473;26;837;1473;1473;406,1954;633;1473;1473;406,1479,1525,1526,1527,1528;1524;1625;1255;1479,1576;411;1128;589,2820;148;26,27;758;947,948;26,27;987;1769,1770;26,27,28,29;543,589,1543;2287;589;2189;2048;589;1473;622;26,27,28,29;349;1672,2077;1750;758;346,1130,1131;1473;589;1761;1713;1255;1255;1140,3477;76;1625,1749;1713;840;512;1473;785;2625,2626;26,450,1577,1578;999;1625;1282;1473;3171,3172;1749;2011;1255;1473;1255;26,27;1064;349;3350;1557,1725,1726;406,1479,1525,1526,1527,1528;1746;1716;1140,3477;1625;1749;589;3154;1255;1750;88;500,2088,2409;589;2621;1473;999;947,948;589,1101;1625;1473;2724;589;1246;1473;1473;114;2004;1473;1697;1749;806;358;1671;26;397;88,3527;2300;879;377,589;1750;1403;999;546;430;2621;2621;1358;1625;1255;947,948;1473;358;947,948;2011;476;2085;1750;1473;589;602,603;588;939;1674;1255;1242;1383;1749;589;346;833;1355;543,1669;464;600;1368;569;1750;1473;1473;1473;1625;2721;591,692;1389;1926;1857;589;947,948;109;3523;26;26,1543;675;1473;3476;26,1546,1547;1503;385,503,1667;758;543;385,503,1667;828,829;416;1340;2851;616;597;385,1672;1670;1473;2777;1473;758;2386;1713;2055;2055;1094;1473;1473;3054;589;1473;1255;1429;806;1473;2221;1749,1758;589;2087;1750;26,27;109;1473;1473;1473;26,27;407,589;837,1059,1473,1531;1749,1758;1255;358,1267,1625;2020;464;397;109;26,27;26,451;947,948;589;429,430,855;758;999;589;1473;1473;346,1130,1131;1749,1758;1473;998;26,960,1922,1923;1473;1761,3149,3150;999;1473;406,1479,1525,1526,1527,1528;436;1749;2763,2788,2789;411;1107;1677;1107,3395;243,1590;1672;26,413,1872;1473;543;1255;1473;26,413,999,1872,1874;1671;1749;1473;1239;1633;385,450,762;616,1750;1749;464,589;589;1749,1758;954;653;1749;1670;1473;346,1130,1131;1625;1477,1478,1479;806;1473;1749;589;978,1102;1473;1672;361,1697,2008;473;667;589;1473;1671;1672;3587,3588;1255;1473;354;1395;589;589;1255;543,589;2354;385,1672;1745;1255;1749;1255;497;589;346,1130,1131;26;1216;529;1473;419,589,636;1749;1724;521;1434;589;1750;543,1473;758;758;195,196,197;1157,1158;1843;3140;26,413,1543,1872,1874;1543;1749;361,1671,1672;26,1671;109;1625;346,1130,1131;1749;947,948;900;1749;1309;128;999,2500;1625;1565,1566,1567;3597;3310,3311,3312,3313;26,785;109,1738,2334;1473;1473;396;947,948;947,948;2776;947,948;2706;109;1671;1473;1608;1625;902;632;653;26,413,1676,1872;893,1189;3354;1408;791,1550,1551,1552;2777;464,589;1356;589;1429;386;1670,1671,1672;396,1230;1473;589;410;1104;947,948;1672;1473;589;1674;902;26;2880;1473;436;1255;1673;1749,1758;1230;26;947,948;464;354;26;1750;406,1723;3316;891,1152;1473;1625;464;26,27;1750;758;1255;1731;3597;1445,1458;1445,1458;385,451;366;1750;26,27;124;1473;2621;26,1499;1749;589;589;1473;1473;1473;1255;2283;1473;589;400,401,402;449;451,987,1198;464;1749;3316;377;1255;589;208,209;2011;1670;1230;893;3385;1473;496;385,1672;1291;889;589;1671;1750;109;947,948;1543;1425;1749;1255;1625;589,1473;2031,2383;26,476,498;1473;1749,1758;-3574;1030;1140,3477;1473;109;2669,2670,2671;1625;1473;436;1473;608;346;999;837,1411,2646,2647;2784,2785;1750;1713;1592;1345;1345;1345;837,1059,1473,1531;1749;26,3020;693;690,2207;3174;557,1454,1455;1787;1473;2521;3067;589;837;1473;1066;26,1053;26;1674;947,948;109,2334;1543;1745;2000;622;1750;1732;109;2621;589;837;624;864;1346;569;27,1100,1672,1774;1473;758;1473;758;1625;758;464;157,177;902;758;1255;1769,1770;1769,1770;1769,1770;1769,1770;1749;1345;588;1473;785;80,81,82;1345;26,64;1255;1255;1255;346,1130,1131;1749,1758;999;1230;2141;1749,1758;3116,3117;1625;1473;1255;785;1473;1847;1473;543,1978;947,948;76,1598;1473;1473;26;1673;91,3229;1179;354;464,503;1750;1749,1758;406,1479,1525,1526,1527,1528;616;947,948;758;1750;1473;1179;451;1473;589;2107;1749,1758;1473;1473;1473;1252;361;978,1322;947,948;589;26,27;2621;1750;2189;1750;589;1255;1255;1749;1255;1474;1749,1758;758;1625;1255;1473;1750;1473;1473;406,1479,1525,1526,1527,1528;990,991;573,627,990,991;788,843;3078;1473;1749;3115;702;1104;26,27;1750;785;109;1750;1473;1473;758;589;346;2322;3616;947,948;1720;1750;1732;939;2055;589;26,27,28,29;1969;378;630;133,1216;1750;1625;2045;1473;358;1672;3528;616;396;1750;1013,1014,1015;965,2003,2071;1473;589;1906;1382;1473;464;411,569,589;589;372;436;1625;372;1062;1189;26,27;1749;555;1749;589;588;861;406,1479,1525,1526,1527,1528;589;174,175;1769,1770;3112;2808;29;2842,2843;439,813,2518;939;947,948;947,948;589;589;464,589;939;939;1059,1473;451,509;1473;1473;1460,1473,1561;589;2055;386;589;496;589;1671;1239;1761;26,27;1255;413;26,27;1543;26;1473;1230;1625;1473;575;1473;1104;1252;1473;1473;624;3192;703;2613;1473;1672,1677;1473;947,948;947,948;1473;1473;619;363,364,365,1473;2595;999;3534;1107,3395;2722;589;1749;589;1426;1107,3395;543;1473;1991;788;3459;1749,1758;1543;1255;3347;1670;26,413,1676,1872,1874;1107,3395;26,413,1676;1750;589;1673;1749;758;26,691,1672;1671;26,413,999,1872,1874;1473;331;1672;315,316;653;1749;1473;1146;1750;943;3048;806;1750;672,673;1749,1758;1671;1473;868,2196;1373;1787;1473;947,948;947,948;589;1038,2615;1749;1205,1206,1207,1208,1209,1210,1211;758;1473;346,1130,1131;1473;1104;1670;2978,2979;3032;1625;1255;1749,1758;1670,2164;859;1473;3054;1473;1749;114;1697;26;385;26;1543;1473;1625;1750;1625;1226;1255;406,1479,1525,1526,1527,1528;1738;1426;1473;385,503,1667;1189,1473;589;2045;947,948;947,948;947,948;1654;616;1749;1077;589;26;1128;26;2590;879;1473;430;777;2045;26,396;589;1473;1473;947,948;1598;1516;1516;1473;1473;1750;1104;1473;947,948;1473;26,109,436;1749,1758;386;1254;939,1910;3035;543;837,1059,1473,1531;2408;589;758;1477,1478,1479;346;385,1473;1331;1473;653,851;785;1473;653;861;26,64;589;2040;668;2621;589;589;26;1749;1473;1749,1758;1670;1750;1543;999;1473;791;1750;2011;1749,1758;1473;3021;430;999;2661;1473;27;1473;788;114;26,2496;1473;589;791;2501;1239;543;1473;109;26;1473;589;589;368,1625;999;1201,1202;653;589;3540;1750;26;503;1625;589;26,64;26,64;26,64;1750;999;346,1130,1131;26,2072;3497,3498;2112;1038;109;436;857,999;349;758;1473;1901;837;1473;354;1725,1726;1671;26,1543;1530;589;541;1473;785;1769,1770;1769,1770;1769,1770;1769,1770;1769,1770;1769,1770;964,965;1749;562;26,64;26,64;26,64;26,64;26,64;26,64;26,64;26,64;26,64;26,64;1473;854;1670;397,436;1068;589;1750;1255;1081;1671;366;1473;1473;346;589;1473;346,1130,1131;1625;464,1230;346,1130,1131;2621;1473;947,948;947,948;366;1473;1750;1625;1588;891;1671;1423,1424;346;1473;987;1750;1255;1625;1473;703;331;3477;1140,3477;1140,3477;1140,3477;2335;1473;406,1479,1525,1526,1527,1528;397;837,1059,1473,1531;346;2227;1230;3408;346,1130,1131;1448;1672;436,842;1749;-1060,1533;1059;26,27;653;1473;589;758;1255;26,27;1725,1726;1625;26,27;999;837,1059,1473,1531;947,948;939;1746;1749,1758;1625;1669;1368;1622;385,727;346;791,1473;1473;2511;436,451,589;1900;26,430,770;1750;1473;3316;1353,1354;1041;1096,1625;1625;2048;947,948;2841;1473;1750;758;758;947,948;331;806;1053;354;653;916;1289;-2902,-2903,-2904,-2905,-2906;3559;264;26,1543,2948;354;612;1473;429,1660,1661;939;624;1473;26;616;589;2055;1473;2621;26,27;450,762;1750;349,1085;331;1749,1758;1625;703,1473;26,27;368,371;1625;413;1671;1473;836;26,27;1473;346,1130,1131;430;1625;159;1750;1473;588;26;26,589;397;215;589;947,948;1107,3395;1477,1478,1479;631;411,632,934,1672,2437,2438;26,413,999;406,1479,1525,1526,1527,1528;3530,3531;1473;1473;1473,3060;616,1750;589;1473,1716;26;589;1749;29;1370;1077;1750,1986;1749;1473;1749;785;346,1130,1131;1749;589;1107;464;406,1479,1525,1526,1527,1528;88;1857;2861;1473;1379,1473;346,1130,1131;1255;1642;589,1642;385,730;377,503,589;1736;1713;788,1750;1625,1630;1243;999,3319;476;451;26;1671;788;1625;947,948;837;1749;464;1473;1673;2662;1473;1655;589;1750;758;15,-27,320,321,322,323,324,325;346,1130,1131;361,830;1473;920;1067;386;1670;2390;1625;436;1438;653;589;653;1473;2958,3461;589;589;436;1473;366;1189;1367;1255;947,948;589;126,529,3400;791,2261;1713;29;1750;1750;1749;406,1429;1749;1438;1750;26,1543;1379,2002;1799,2751;26;1473;1473;1140;1473;476;346;1725,1726;2273;589;1473;837,1059,1473,1531;1457;26,27;1473;1473;1473;2596;361;855;26,27;1345;2452;26,64;2452;26,64;589;346;2330;496;397;589;947,948;2813;758;1473;1625;397;1769,1770;1769,1770;-741,1769,1770;1769,1770;1769,1770;1769,1770;1769,1770;1769,1770;1769,1770;1769,1770;1438;1713;411,569,589;1473;616;464;1625;589;758;1625;1473;1255;1750;366;837;797;1625;1625;1473;1749;947,948;589;1473;2395;1473;1189;3001;2204;1473;406,1723;1473;978,2998,2999;987;126,133,3586;1460,1473,1561;1255;1473;1473;1255;1255;1255;891;1473;1473;622;758;947,948;1750;26,476;1255;436;2001;1650;1670;1473;1255;580;1473;26,64;26,64;2563;1750;589;1750;114,704;26,27,28,29;539,1051;1473;3458;548;2224;1473;589;1473;1672;1255;939;1104;1625;1107,3395;653;1295;1713;2109;939;2011;2721;208,317;1255;3416,3417;2055;2055;806;1543;1230;2356;1473;1750;1625;806;3519;1445,1458;1432;26,64;26,64;26,64;26,64;26,64;26,64;26,64;26,64;503,589;589;114,648;1255;1239;1713;1896;1107,3395;928;1142,1290;589;589;1473;653;1473;1473;26;1318;1543;1543;1969;1749;476;758;1473;26,413,999,1872,1874;413;572,573;1713;1473;1445,1458;913;1721;1473;3012,3013,3014;1473;1473;1749,1764;109;806;2974;26,27;1473;1230;397;1749;386;806;2150;1448;1485;589;109;758;26,27,28,29;2019,2020;3319;589;1042;26,999;589;1670;1625;1625;476;806;1625;1473;1473;3502;473;1713;622;26,364,1198;1671;412;3416,3417;411;459;785;589,999,1473;1107,3395;2914;562;1750;1746;2011;1669;727;589;1749,1750;1230;1804;870;1749;1473;589;479;1750;1749;436;791,1550,1551;1673;3108;624;1224;1750;1750;2394;1534,1535;503,589;1543;1473;26,27;589;2277;1543;1448;543;1473;1473;349;1625;653;397;320,321,323,2816;1745;947,948;430;3137;947,948;26,64;999;1473;2596;2596;939;1769,1770;1769,1770;1769,1770;1769,1770;1769,1770;2621;1625;589;450;397;1750;589;588;2656;1473;1749;1473;947,948;1749,1758;2752;589;1749;589;947,948;1255;1255;1255;785;2999;26,27;26,27,29;114,470;939;1255;1255;1255;1473;1750;26,27,28,29;1883;1305;1750;1473;1994;1255;450;1473;287;1473;2758,2759;1473;1750;785;1355;1255;1750;1473;1246;1749;406;1473;26,1670;1473;1473;947,948;1435;3316;1060;1255;916;2021;939;111,187;622;1255;1769,1770;1769,1770;2055;806;346,1130,1131;1473;589;366;1625;1713;589;1750;436;1585,1586,1587;349;1479,1576;1969;1048;1625;349;346,1130,1131;263;1848;1473;1749,1758;346;589;2967;1749;1749;1107,3395;354;1355;1328;1750;1104;109;109;1749;785,1712;221,225;2138;589,1473;913;1473;436;1625;26,1684,1874;26,27,28;785;26;26,27,28,29;26,27;377;1713;1769,1770;589;1625;2621;1769,1770;346,1130,1131;1473;2621;1625;1749,1750;3416,3417;2501;913;797;1229;3518;1473;785;632,1543;3477;-1500;346,1130,1131;589;272,273;436,479;464;1671;26,64;1473;1745;1473;1473;589,911;1750;1473;2192;1769,1770;1769,1770;1769,1770;1769,1770;1473;1625;29;1750;26,27,28,29;2751;616;26,476,1671;1473;589,2143;1255;2318;1075,1263;1669;703;346,1750;26,27;622;939;1438;310,3605;1473;3609;588;26;1749;1749;1875;785;653;1355;2285;2730,2731,2732;26,64;26,64;26,64;26,64;26,64;26,64;26,27;1255;1625;1543;1473;1625;1473;1750;529;368;589;891;1750;3175;1473;903;1255;413;1031;1750;26;26,2948;813;813;1749;1473;939;939;785;1749,1758;3478;346,1130,1131;464;109,2658;1769,1770;387;1438;1750;916;589;589;396;26,27;1713;1473;1473;1429;26,413,1872,1874;1749;1473;1473;1445,1458;1231,1625;1750;346,1130,1131;616;1473;1750;27;1299;2381;1473;785;436,1104;361;1750;1625;1473;947,948;1672;1713;3170;868;26,1079,1080;1625;2255;26,1673;653;1473;1473;1543,3187;1255;1625;1750;385;1473;1473;2648;1671;1543;589;406,1723;1473;509,622;2497;346,1473;358;1749;622;1473;1473;26;2215,2216;2544;1625;589;451;939;1473;1473;1769,1770;1769,1770;1769,1770;1769,1770;837,1331;1625;1625;1739,1740;1750;479;3416,3417;589;1473;406,1723;1671;1473;652;26,27;26,27;1769,1770;902;1625;397;1625;1670,1671,1672;947,948;1750;26,27,28;785;1625;1473;1625;1680;2621;1845,1846;1473;2841;1473;1625;538;319;26;1769,1770;449;813;1732;3535;939;627;1769,1770;386;999;1473;2621;1255;26,27;1385;624;1104;589;1438;1750;26,64;26,64;26,64;26,64;26,64;1750;1252;1634;1749;1750;346;1750;1749,1758;1473;758;2123;3152;2644;589;189,190;1671;1669;406,1479,1525,1526,1527,1528;1750;589,2085;1299;837,1059,1473,1531;354;1625;2528;1543,3242,3243,3244,3245,3246;1750;26,27,28,29;1473;1333;3416,3417;1749;406,1723;1750;1355;2318;589;386;1749;1473;2134;1473;109,2334;1243;1013,1014,1015;1932;114;1769,1770;1769,1770;1769,1770;1769,1770;1769,1770;1769,1770;146;26,27;26,27;26,27;26;1749;1750;1749;1473;1965;366;653;436;1749;2841;1625,3016;616;589;1473;1182;1750;891;1430;588;1769,1770;3142;1673;76;1473;1473;806;1473;346;1750;26,2648;470;3119;26,813;589;1749;561;88;1355;346,1130,1131;1473;1725,1726;26,641,642;2085;785;2177;1293;26,64;26,64;26,64;26,64;1769,1770;1473;624;346,1130,1131;26;1111;1473;1473;1255;1750;346;496;1336,1672,1677;1473;1473;1749;1749;3477;913;1473;1625;785;1769,1770;1769,1770;1625;135;2019,2020;496;26,27,28,29;1670,1671,1672;3416,3417;1670;3484;487;2841;1189;1769,1770;1673;1107,3395;3073;397;1713;589;2621;1625;1189;1473;366;161,162;1104;1473;2664,2665;2498;1671;1355;354;1625;1625;1750;26,27;1473;1473;314;2519,2520;1769,1770;1473;3416,3417;1473;1811,1812;385;3477;1697;1473;557;1769,1770;406,858;349;703;1473;588;785;386;3376;1473;788;1769,1770;346,1130,1131;358;332,333,348,349,3620;1107;26;26;1473;2011;1473;1473;334,335;1473;1769,1770;3416,3417;417,450,762,1673;346,1130,1131;1473;1473;361,588;3416,3417;3416,3417;624;3329;109;752;1438;109;589;27;1543;26,1198,1239,1711;785;1438;1114;3026;1473;1672;3416,3417;2493;1749;346;1393;2786,3005;1473;385,450,762;588;1355;3416,3417;1392;1543;436;3416,3417;1473;26,27,28,29;3416,3417;1673;2327;1749;1355;3416,3417;1625;785;785;26;1901;27;26;3416,3417;589;973;1473;3418;1625;1750;1473;1473;76;411,588;1769,1770;1621;894;3416,3417;27;1769,1770;476;902;3248;1473;397;3416,3417;926;797;589;3416,3417;1473;3416,3417;26,64;26,64;26,64;26,64;26,64;1473;201,202;26,64;26,64;26,64;26,64;26,64;26,64;26,64;26,64;26,64";

const $scriptletHostnames$ = /* 13284 */ ["j.gs","s.to","3sk.*","al.ly","asd.*","bc.vc","br.de","bs.to","clk.*","di.fm","fc.lc","fr.de","fzm.*","g3g.*","gmx.*","hqq.*","kat.*","lz.de","m4u.*","mt.de","nn.de","nw.de","o2.pl","op.gg","ouo.*","oxy.*","pnd.*","rp5.*","sh.st","sn.at","th.gl","tpb.*","tu.no","tz.de","ur.ly","vev.*","vz.lt","wa.de","wn.de","wp.de","wp.pl","wr.de","x.com","ytc.*","yts.*","za.gl","ze.tt","00m.in","1hd.to","2ddl.*","33sk.*","4br.me","4j.com","538.nl","74k.io","9tsu.*","a8ix.*","agf.nl","aii.sh","al.com","as.com","av01.*","bab.la","bbf.lt","bcvc.*","bde4.*","btdb.*","btv.bg","c2g.at","cbc.ca","crn.pl","d-s.io","djs.sk","dlhd.*","dna.fr","dnn.de","dodz.*","dood.*","eio.io","epe.es","ettv.*","ew.com","exe.io","eztv.*","fbgo.*","fnp.de","ft.com","geo.de","geo.fr","goo.st","gra.pl","haz.de","hbz.us","hd21.*","hdss.*","hna.de","iir.ai","iiv.pl","imx.to","ioe.vn","jav.re","jav.sb","jav.si","javx.*","kaa.mx","kat2.*","kio.ac","kkat.*","kmo.to","kwik.*","la7.it","lne.es","lvz.de","m5g.it","met.bz","mexa.*","mmm.dk","mtv.fi","nj.com","nnn.de","nos.nl","now.gg","now.us","noz.de","npo.nl","nrz.de","nto.pl","och.to","oii.io","oii.la","ok.xxx","oke.io","oko.sh","ovid.*","pahe.*","pe.com","pnn.de","poop.*","qub.ca","ran.de","rgb.vn","rgl.vn","rtl.de","rtv.de","sab.bz","sfr.fr","shz.de","siz.tv","srt.am","svz.de","tek.no","tf1.fr","tfp.is","tii.la","tio.ch","tny.so","top.gg","tpi.li","tv2.no","tvn.pl","tvtv.*","txxx.*","uii.io","upns.*","vido.*","vip.de","vod.pl","voe.sx","vox.de","vsd.fr","waaw.*","waz.de","wco.tv","web.de","xnxx.*","xup.in","xxnx.*","yts2.*","zoro.*","0xxx.ws","10gb.vn","1337x.*","1377x.*","1ink.cc","24pdd.*","5278.cc","5play.*","7mmtv.*","7xm.xyz","8tm.net","a-ha.io","adn.com","adsh.cc","adsrt.*","adsy.pw","adyou.*","adzz.in","ahri8.*","ak4eg.*","akoam.*","akw.cam","akwam.*","an1.com","an1me.*","arbsd.*","babla.*","bbc.com","bgr.com","bgsi.gg","bhg.com","bild.de","biqle.*","bunkr.*","car.com","cbr.com","cbs.com","chip.de","cine.to","clik.pw","cnn.com","cpm.icu","crn.com","ctrlv.*","dbna.de","delo.bg","dict.cc","digi.no","dirp.me","dlhd.sx","docer.*","doods.*","doood.*","elixx.*","enit.in","eska.pl","exe.app","exey.io","faz.net","ffcv.es","filmy.*","fojik.*","fomo.id","fox.com","fpo.xxx","gala.de","gala.fr","gats.io","gdtot.*","giga.de","gk24.pl","gntai.*","gnula.*","goku.sx","gomo.to","gotxx.*","govid.*","gp24.pl","grid.id","gs24.pl","gsurl.*","hdvid.*","hdzog.*","hftg.co","igram.*","inc.com","inra.bg","itv.com","jav.one","javhd.*","jizz.us","jmty.jp","joyn.at","joyn.ch","joyn.de","jpg2.su","jpg6.su","k1nk.co","k511.me","kaas.ro","kfc.com","khsm.io","kijk.nl","kino.de","kinox.*","kinoz.*","koyso.*","ksl.com","ksta.de","lato.sx","laut.de","leak.sx","link.tl","linkz.*","linx.cc","litv.tv","lnk2.cc","logi.im","lulu.st","m4uhd.*","mail.de","mdn.lol","mega.nz","mexa.sh","mlfbd.*","mlsbd.*","mlwbd.*","moco.gg","moin.de","mopo.de","more.tv","moto.it","movi.pk","mtv.com","myegy.*","n-tv.de","nba.com","nbc.com","netu.ac","news.at","news.bg","news.de","nfl.com","nmac.to","noxx.to","nuvid.*","odum.cl","oe24.at","oggi.it","oload.*","onle.co","onvid.*","opvid.*","oxy.edu","oyohd.*","pelix.*","pes6.es","pfps.gg","pngs.gg","pobre.*","prad.de","qiwi.gg","qmh.sex","rabo.no","rat.xxx","raw18.*","rmcmv.*","sat1.de","sbot.cf","seehd.*","send.cm","sflix.*","sixx.de","sms24.*","songs.*","spy.com","stape.*","stfly.*","swfr.tv","szbz.de","tlin.me","tr.link","tube8.*","tune.pk","tver.jp","tvhay.*","tvply.*","tvtv.ca","tvtv.us","u.co.uk","ujav.me","uns.bio","upi.com","upn.one","upvid.*","vcp.xxx","veev.to","vidd.se","vidhd.*","vidoo.*","vidop.*","vidup.*","vipr.im","viu.com","vix.com","viz.com","vkmp3.*","vods.tv","vox.com","vozz.vn","vpro.nl","vsrc.su","vudeo.*","waaaw.*","waaw1.*","welt.de","wgod.co","wiwo.de","wwd.com","xtits.*","ydr.com","yiv.com","yout.pw","ytmp3.*","zeit.de","zeiz.me","zien.pl","0deh.com","123mkv.*","15min.lt","1flix.to","1mov.lol","20min.ch","2embed.*","2ix2.com","3prn.com","4anime.*","4cash.me","4khd.com","519.best","58n1.com","7mmtv.sx","85po.com","9gag.com","9n8o.com","9xflix.*","a2zapk.*","aalah.me","actvid.*","adbull.*","adeth.cc","adfloz.*","adfoc.us","adsup.lk","aetv.com","afly.pro","agefi.fr","al4a.com","alpin.de","anoboy.*","arcor.de","ariva.de","asiaon.*","atxtv.co","auone.jp","ayo24.id","azsoft.*","babia.to","bbw6.com","bdiptv.*","bdix.app","bif24.pl","bigfm.de","bilan.ch","bing.com","binged.*","bjhub.me","blick.ch","blick.de","bmovie.*","bombuj.*","booru.eu","brato.bg","brevi.eu","bunkr.la","bunkrr.*","cam4.com","canna.to","capshd.*","cataz.to","cety.app","cgaa.org","chd4.com","cima4u.*","cineb.gg","cineb.rs","cinen9.*","citi.com","clk.asia","cnbc.com","cnet.com","crichd.*","crone.es","cuse.com","cwtv.com","cybar.to","cykf.net","dahh.net","dazn.com","dbna.com","deano.me","dewimg.*","dfiles.*","dlhd.*>>","doods.to","doodss.*","dooood.*","dosya.co","dotgg.gg","duden.de","dump.xxx","ecac.org","egolf.jp","eldia.es","emoji.gg","ervik.as","espn.com","exee.app","exeo.app","exyi.net","f75s.com","fastt.gg","fembed.*","files.cx","files.fm","files.im","filma1.*","finya.de","fir3.net","flixhq.*","fmovie.*","focus.de","friv.com","frvr.com","fupa.net","fxmag.pl","fzlink.*","g9r6.com","ganool.*","gaygo.tv","gdflix.*","ggjav.tv","gload.to","glodls.*","gogohd.*","gokutv.*","gol24.pl","golem.de","grok.com","gtavi.pl","gusto.at","hackr.io","haho.moe","hd44.com","hd44.net","hdbox.ws","hdfull.*","heftig.*","heise.de","hidan.co","hidan.sh","hilaw.vn","hltv.org","howdy.id","hoyme.jp","hpjav.in","hqtv.biz","html.net","huim.com","hulu.com","hydrax.*","hyhd.org","iade.com","ibbs.pro","icelz.to","idnes.cz","imgdew.*","imgsen.*","imgsto.*","imgviu.*","isi7.net","its.porn","j91.asia","janjua.*","jmanga.*","jmmv.dev","jotea.cl","kaido.to","katbay.*","kcra.com","kduk.com","keepv.id","kizi.com","kloo.com","kmed.com","kmhd.net","kmnt.com","kpnw.com","ktee.com","ktmx.pro","kukaj.io","kukni.to","kwro.com","l8e8.com","l99j.com","la3c.com","lablue.*","lared.cl","lejdd.fr","levif.be","lin-ks.*","link1s.*","linkos.*","liveon.*","lnk.news","ma-x.org","magesy.*","mail.com","mazpic.*","mcloud.*","mgeko.cc","miro.com","missav.*","mitly.us","mixdrp.*","mixed.de","mkvhub.*","mmsbee.*","moms.com","money.bg","money.pl","movidy.*","movs4u.*","my1ink.*","my4w.com","myad.biz","mycima.*","myl1nk.*","myli3k.*","mylink.*","mzee.com","n.fcd.su","ncaa.com","newdmn.*","nhl66.ir","nick.com","nikke.gg","nohat.cc","nola.com","notube.*","ogario.*","orsm.net","oui.sncf","pa1n.xyz","pahe.ink","pasend.*","payt.com","pctnew.*","picks.my","picrok.*","pingit.*","pirate.*","pixlev.*","pluto.tv","plyjam.*","plyvdo.*","pogo.com","pons.com","porn.com","porn0.tv","pornid.*","pornx.to","qa2h.com","quins.us","quoka.de","r2sa.net","racaty.*","radio.at","radio.de","radio.dk","radio.es","radio.fr","radio.it","radio.pl","radio.pt","radio.se","ralli.ee","ranoz.gg","rargb.to","rasoi.me","rdr2.org","rdxhd1.*","rintor.*","rootz.so","roshy.tv","saint.to","sanet.lc","sanet.st","sbchip.*","sbflix.*","sbplay.*","sbrulz.*","seeeed.*","senda.pl","seriu.jp","sex3.com","sexvid.*","shopr.tv","short.pe","shrink.*","shtab.su","shtms.co","shush.se","slant.co","so1.asia","sport.de","sport.es","spox.com","sptfy.be","stern.de","strtpe.*","svapo.it","swdw.net","swzz.xyz","sxsw.com","sxyprn.*","t20cup.*","t7meel.*","tasma.ru","tbib.org","tele5.de","thegay.*","thekat.*","thoptv.*","tirexo.*","tmearn.*","tobys.dk","today.it","toggo.de","tokon.gg","trakt.tv","trend.at","trrs.pro","tubeon.*","tubidy.*","tv247.us","tvepg.eu","tvn24.pl","tvnet.lv","txst.com","udvl.com","upapk.io","uproxy.*","uqload.*","urbia.de","uvnc.com","v.qq.com","vanime.*","vapley.*","vedbam.*","vedbom.*","vembed.*","venge.io","vibe.com","vid4up.*","vidlo.us","vidlox.*","vidsrc.*","viki.com","vipbox.*","viper.to","viprow.*","virpe.cc","vlive.tv","voe.sx>>","voici.fr","voxfm.pl","vozer.io","vozer.vn","vtbe.net","vtmgo.be","vtube.to","vumoo.cc","vxxx.com","wat32.tv","watch.ug","wcofun.*","wcvb.com","webbro.*","wepc.com","wetter.*","wfmz.com","wkyc.com","woman.at","work.ink","wowtv.de","wp.solar","wplink.*","wttw.com","ww9g.com","wyze.com","x1337x.*","xcum.com","xh.video","xo7c.com","xvide.me","xxf.mobi","xxr.mobi","xxu.mobi","y2mate.*","yelp.com","yepi.com","youx.xxx","yporn.tv","yt1s.com","yt5s.com","ytapi.cc","ythd.org","z4h4.com","zbporn.*","zdrz.xyz","zee5.com","zooqle.*","zshort.*","0vg9r.com","10.com.au","10short.*","123link.*","123mf9.my","18xxx.xyz","1milf.com","1stream.*","2024tv.ru","26efp.com","2conv.com","2glho.org","2kmovie.*","2ndrun.tv","3dzip.org","3movs.com","49ers.com","4share.vn","4stream.*","4tube.com","51sec.org","5flix.top","5mgz1.com","5movies.*","6jlvu.com","7bit.link","7mm003.cc","7starhd.*","9anime.pe","9hentai.*","9xbuddy.*","9xmovie.*","a-o.ninja","a2zapk.io","abcya.com","acortar.*","adcorto.*","adsfly.in","adshort.*","adurly.cc","aduzz.com","afk.guide","agar.live","ah-me.com","aikatu.jp","airtel.in","alphr.com","ampav.com","andyday.*","anidl.org","anikai.to","animekb.*","animesa.*","anitube.*","aniwave.*","anizm.net","apkmb.com","apkmody.*","apl373.me","apl374.me","apl375.me","appdoze.*","appvn.com","aram.zone","arc018.to","arcai.com","art19.com","artru.net","asd.homes","atlaq.com","atomohd.*","awafim.tv","aylink.co","azel.info","azmen.com","azrom.net","bakai.org","bdlink.pw","beeg.fund","befap.com","bflix.*>>","bhplay.me","bibme.org","bigwarp.*","biqle.com","bitfly.io","bitlk.com","blackd.de","blkom.com","blog24.me","blogk.com","bmovies.*","boerse.de","bolly4u.*","boost.ink","brainly.*","btdig.com","buffed.de","busuu.com","c1z39.com","cambabe.*","cambb.xxx","cambro.io","cambro.tv","camcam.cc","camcaps.*","camhub.cc","canela.tv","canoe.com","casi3.xyz","ccurl.net","cda-hd.cc","cdn1.site","cdn77.org","cdrab.com","cfake.com","chatta.it","chyoa.com","cinema.de","cinetux.*","cl1ca.com","clamor.pl","cloudy.pk","cmovies.*","colts.com","comunio.*","ctrl.blog","curto.win","cutdl.xyz","cutty.app","cybar.xyz","czxxx.org","d000d.com","d0o0d.com","daddyhd.*","daybuy.tw","debgen.fr","dfast.app","dfiles.eu","dflinks.*","dhd24.com","djmaza.my","djstar.in","djx10.org","dlgal.com","do0od.com","do7go.com","domaha.tv","doods.pro","doooood.*","doply.net","dotflix.*","doviz.com","dropmms.*","dropzy.io","drrtyr.mx","drtuber.*","drzna.com","dumpz.net","dvdplay.*","dx-tv.com","dz4soft.*","eater.com","echoes.gr","efhjd.com","efukt.com","eg4link.*","egybest.*","egydead.*","eltern.de","embedme.*","embedy.me","embtaku.*","emovies.*","enorme.tv","entano.jp","eodev.com","erogen.su","erome.com","eroxxx.us","erzar.xyz","europix.*","evaki.fun","evo.co.uk","exego.app","eyalo.com","f16px.com","fabtcg.gg","fap16.net","fapnado.*","faps.club","fapxl.com","faselhd.*","fast-dl.*","fc-lc.com","feet9.com","femina.ch","ffjav.com","file4go.*","fileq.net","filma24.*","filmex.to","finfang.*","flixhd.cc","flixhq.ru","flixhq.to","flixhub.*","flixtor.*","flvto.biz","flyad.vip","fmj.co.uk","fmovies.*","fooak.com","forsal.pl","foundit.*","foxhq.com","freep.com","freewp.io","frembed.*","frprn.com","fshost.me","ftopx.com","ftuapps.*","fuqer.com","furher.in","fx-22.com","gahag.net","gayck.com","gayfor.us","gayxx.net","gdirect.*","ggjav.com","gifhq.com","giize.com","globo.com","glodls.to","gm-db.com","gmanga.me","gofile.to","gojo2.com","gomov.bio","gomoviz.*","goplay.su","gosemut.*","goshow.tv","gototub.*","goved.org","gowyo.com","goyabu.us","gplinks.*","gsdn.live","gsm1x.xyz","guum5.com","gvnvh.net","hanime.tv","happi.com","haqem.com","hax.co.id","hd-xxx.me","hdfilme.*","hdgay.net","hdhub4u.*","hdrez.com","hdss-to.*","heavy.com","hellnaw.*","hentai.tv","hh3dhay.*","hhesse.de","hianime.*","hideout.*","hitomi.la","hmt6u.com","hoca2.com","hoca6.com","hoerzu.de","hojii.net","hokej.net","hothit.me","hotmovs.*","hugo3c.tw","huyamba.*","hxfile.co","i-bits.io","ibooks.to","icdrama.*","iceporn.*","ico3c.com","idpvn.com","ihow.info","ihub.live","ikaza.net","ilinks.in","imeteo.sk","img4fap.*","imgmaze.*","imgrock.*","imgtown.*","imgur.com","imgview.*","imslp.org","ingame.de","intest.tv","inwepo.co","io.google","iobit.com","iprima.cz","iqiyi.com","ireez.com","isohunt.*","janjua.tv","jappy.com","japscan.*","jasmr.net","javbob.co","javboys.*","javcl.com","javct.net","javdoe.sh","javfor.tv","javfun.me","javhat.tv","javhd.*>>","javmix.tv","javpro.cc","javup.org","javwide.*","jkanime.*","jootc.com","kali.wiki","karwan.tv","katfile.*","keepvid.*","ki24.info","kick4ss.*","kickass.*","kicker.de","kinoger.*","kissjav.*","klmanga.*","koora.vip","krx18.com","kuyhaa.me","kzjou.com","l2db.info","l455o.com","lawyex.co","lecker.de","legia.net","lenkino.*","lesoir.be","linkfly.*","liveru.sx","ljcam.net","lkc21.net","lmtos.com","lnk.parts","loader.fo","loader.to","loawa.com","lodynet.*","lookcam.*","lootup.me","los40.com","m.kuku.lu","m4ufree.*","magma.com","magmix.jp","mamadu.pl","mangaku.*","manhwas.*","maniac.de","mapple.tv","marca.com","mavplay.*","mboost.me","mc-at.org","mcrypto.*","mega4up.*","merkur.de","messen.de","mgnet.xyz","mhn.quest","mihand.ir","milfnut.*","miniurl.*","mitele.es","mixdrop.*","mkvcage.*","mkvpapa.*","mlbbox.me","mlive.com","mmo69.com","mobile.de","mod18.com","momzr.com","mov2day.*","mp3clan.*","mp3fy.com","mp3spy.cc","mp3y.info","mrgay.com","mrjav.net","msic.site","multi.xxx","mxcity.mx","mynet.com","mz-web.de","nbabox.co","ncdnstm.*","nekopoi.*","netcine.*","neuna.net","news38.de","nhentai.*","niadd.com","nikke.win","nkiri.com","nknews.jp","notion.so","nowgg.lol","nozomi.la","npodoc.nl","nxxn.live","nyaa.land","nydus.org","oatuu.org","obsev.com","ocnpj.com","ofiii.com","ofppt.net","ohmymag.*","ok-th.com","okanime.*","okblaz.me","omavs.com","oosex.net","opjav.com","orunk.com","owlzo.com","pahe.plus","palabr.as","palimas.*","pasteit.*","pastes.io","pcwelt.de","pelis28.*","pepar.net","pferde.de","phodoi.vn","phois.pro","picrew.me","pixhost.*","pkembed.*","player.pl","plylive.*","pogga.org","popjav.in","poqzn.xyz","porn720.*","porner.tv","pornfay.*","pornhat.*","pornhub.*","pornj.com","pornlib.*","porno18.*","pornuj.cz","powvdeo.*","premio.io","profil.at","psarips.*","pugam.com","pussy.org","pynck.com","q1003.com","qcheng.cc","qcock.com","qlinks.eu","qoshe.com","quizz.biz","radio.net","rarbg.how","readm.org","redd.tube","redisex.*","redtube.*","redwap.me","remaxhd.*","rentry.co","rexporn.*","rexxx.org","rezst.xyz","rezsx.xyz","rfiql.com","riveh.com","rjno1.com","rock.porn","rokni.xyz","rooter.gg","rphost.in","rshrt.com","ruhr24.de","rytmp3.io","s2dfree.*","saint2.cr","samfw.com","satdl.com","sbnmp.bar","sbplay2.*","sbplay3.*","sbsun.com","scat.gold","seazon.fr","seelen.io","seexh.com","series9.*","seulink.*","sexmv.com","sextb.*>>","sezia.com","sflix.pro","shape.com","shlly.com","shmapp.ca","shorten.*","shrdsk.me","shrib.com","shrinke.*","shrtfly.*","skardu.pk","skpb.live","skysetx.*","slate.com","slink.bid","smutr.com","son.co.za","songspk.*","spcdn.xyz","sport1.de","sssam.com","ssstik.io","staige.tv","strmup.cc","strmup.to","strmup.ws","strtape.*","study.com","swame.com","swgop.com","syosetu.*","sythe.org","szene1.at","talaba.su","tamilmv.*","taming.io","tatli.biz","tech5s.co","teensex.*","terabox.*","tgo-tv.co","themw.com","thgss.com","thothd.to","thothub.*","tinhte.vn","tnp98.xyz","to.com.pl","today.com","todaypk.*","tojav.net","topflix.*","topjav.tv","torlock.*","tpaste.io","tpayr.xyz","tpz6t.com","trutv.com","tryzt.xyz","tubev.sex","tubexo.tv","turbo1.co","tvguia.es","tvinfo.de","tvlogy.to","tvporn.cc","txori.com","txxx.asia","ucptt.com","udebut.jp","ufacw.com","uflash.tv","ujszo.com","ulsex.net","unicum.de","upbam.org","upfiles.*","upiapi.in","uplod.net","uporn.icu","upornia.*","uppit.com","uproxy2.*","upxin.net","upzone.cc","uqozy.com","urlcero.*","ustream.*","uxjvp.pro","v1kkm.com","vdtgr.com","vebo1.com","veedi.com","vg247.com","vid2faf.*","vidbm.com","vide0.net","videobb.*","vidfast.*","vidmoly.*","vidplay.*","vidsrc.cc","vidzy.org","vienna.at","vinaurl.*","vinovo.to","vip1s.top","vipurl.in","vivuq.com","vladan.fr","vnuki.net","voodc.com","vplink.in","vtlinks.*","vttpi.com","vvid30c.*","vvvvid.it","w3cub.com","waezg.xyz","waezm.xyz","webtor.io","wecast.to","weebee.me","wetter.de","wildwap.*","winporn.*","wiour.com","wired.com","woiden.id","world4.eu","wpteq.org","wvt24.top","x-tg.tube","x24.video","xbaaz.com","xbabe.com","xcafe.com","xcity.org","xcoic.com","xcums.com","xecce.com","xexle.com","xhand.com","xhbig.com","xmovies.*","xnxxw.net","xpaja.net","xtapes.me","xtapes.to","xvideos.*","xvipp.com","xxx24.vip","xxxhub.cc","xxxxxx.hu","y2down.cc","yeptube.*","yeshd.net","ygosu.com","yjiur.xyz","ymovies.*","youku.com","younetu.*","youporn.*","yt2mp3s.*","ytmp3s.nu","ytpng.net","ytsaver.*","yu2be.com","zdnet.com","zedge.net","zefoy.com","zhihu.com","zjet7.com","zojav.com","zrozz.com","0gogle.com","0gomovie.*","10starhd.*","123anime.*","123chill.*","13tv.co.il","141jav.com","18tube.sex","1apple.xyz","1bit.space","1kmovies.*","1link.club","1stream.eu","1tamilmv.*","1todaypk.*","1xanime.in","222i8x.lol","2best.club","2the.space","2umovies.*","3fnews.com","3hiidude.*","3kmovies.*","3xyaoi.com","4-liga.com","4kporn.xxx","4porn4.com","4tests.com","4tube.live","5ggyan.com","5xmovies.*","720pflix.*","8boobs.com","8muses.xxx","8xmovies.*","91porn.com","96ar.com>>","9908ww.com","9animes.ru","9kmovies.*","9monate.de","9xmovies.*","9xupload.*","a1movies.*","acefile.co","acortalo.*","adshnk.com","adslink.pw","aeonax.com","aether.mom","afdah2.com","akmcloud.*","all3do.com","allfeeds.*","ameede.com","amindi.org","anchira.to","andani.net","anime4up.*","animedb.in","animeflv.*","animeid.tv","animekai.*","animesup.*","animetak.*","animez.org","anitube.us","aniwatch.*","aniwave.uk","anodee.com","anon-v.com","anroll.net","ansuko.net","antenne.de","anysex.com","apkhex.com","apkmaven.*","apkmody.io","arabseed.*","archive.fo","archive.is","archive.li","archive.md","archive.ph","archive.vn","arcjav.com","areadvd.de","aruble.net","ashrfd.xyz","ashrff.xyz","asiansex.*","asiaon.top","asmroger.*","ate9ni.com","atishmkv.*","atomixhq.*","atomtt.com","av-cdn.xyz","av01.media","avjosa.com","awpd24.com","axporn.com","ayuka.link","babeporn.*","baikin.net","bakotv.com","bandle.app","bang14.com","bayimg.com","bblink.com","bbw.com.es","bdokan.com","bdsmx.tube","bdupload.*","beatree.cn","beeg.party","beeimg.com","bembed.net","bestcam.tv","bf0skv.org","bigten.org","bildirim.*","bloooog.it","bluetv.xyz","bnnvara.nl","boards.net","boombj.com","borwap.xxx","bos21.site","boyfuck.me","brian70.tw","brides.com","brillen.de","brmovies.*","brstej.com","btvplus.bg","byrdie.com","bztube.com","calvyn.com","camflow.tv","camfox.com","camhoes.tv","camseek.tv","capital.de","cashkar.in","cavallo.de","cboard.net","cdn256.xyz","ceesty.com","cekip.site","cerdas.com","cgtips.org","chiefs.com","ciberdvd.*","cimanow.cc","cityam.com","citynow.it","ckxsfm.com","cluset.com","codare.fun","code.world","cola16.app","colearn.id","comtasq.ca","connect.de","cookni.net","cpscan.xyz","creatur.io","cricfree.*","cricfy.net","crictime.*","crohasit.*","csrevo.com","cuatro.com","cubshq.com","cuckold.it","cuevana.is","cuevana3.*","cutnet.net","cwseed.com","d0000d.com","ddownr.com","deezer.com","demooh.com","depedlps.*","desiflix.*","desimms.co","desired.de","destyy.com","dev2qa.com","dfbplay.tv","diaobe.net","disqus.com","djamix.net","djxmaza.in","dloady.com","dnevnik.hr","do-xxx.com","dogecoin.*","dojing.net","domahi.net","donk69.com","doodle.com","dopebox.to","dorkly.com","downev.com","dpstream.*","drivebot.*","driveup.in","drphil.com","dshytb.com","dsmusic.in","dtmaga.com","du-link.in","dvm360.com","dz4up1.com","earncash.*","earnload.*","easysky.in","ebony8.com","ebookmed.*","ebuxxx.net","edmdls.com","egyup.live","elmundo.es","embed.casa","embedv.net","emsnow.com","emurom.net","epainfo.pl","eplayvid.*","eplsite.uk","erofus.com","erotom.com","eroxia.com","evileaks.*","evojav.pro","ewybory.eu","exnion.com","express.de","f1livegp.*","f1stream.*","f2movies.*","fabmx1.com","fakaza.com","fake-it.ws","falpus.com","familie.de","fandom.com","fapcat.com","fapdig.com","fapeza.com","fapset.com","faqwiki.us","fautsy.com","fboxtv.com","fbstream.*","festyy.com","ffmovies.*","fhedits.in","fikfak.net","fikiri.net","fikper.com","filedown.*","filemoon.*","fileone.tv","filesq.net","film1k.com","film4e.com","filmi7.net","filmovi.ws","filmweb.pl","filmyfly.*","filmygod.*","filmyhit.*","filmypur.*","filmywap.*","finanzen.*","finclub.in","fitbook.de","flickr.com","flixbaba.*","flixhub.co","flybid.net","fmembed.cc","forgee.xyz","formel1.de","foxnxx.com","freeload.*","freenet.de","freevpn.us","friars.com","frogogo.ru","fsplayer.*","fstore.biz","fuckdy.com","fullreal.*","fulltube.*","fullxh.com","funzen.net","funztv.com","fuxnxx.com","fxporn69.*","fzmovies.*","gadgets.es","game5s.com","gamenv.net","gamepro.de","gatcha.org","gawbne.com","gaydam.net","gcloud.cfd","gdfile.org","gdmax.site","gdplayer.*","gestyy.com","giants.com","gifans.com","giff.cloud","gigaho.com","givee.club","gkbooks.in","gkgsca.com","gleaks.pro","gmenhq.com","gnomio.com","go.tlc.com","gocast.pro","gochyu.com","goduke.com","goeags.com","goegoe.net","gofilmes.*","goflix.sbs","gogodl.com","gogoplay.*","gogriz.com","gomovies.*","google.com","gopack.com","gostream.*","goutsa.com","gozags.com","gozips.com","gplinks.co","grasta.net","gtaall.com","gunauc.net","haddoz.net","hamburg.de","hamzag.com","hanauer.de","hanime.xxx","hardsex.cc","harley.top","hartico.tv","haustec.de","haxina.com","hcbdsm.com","hclips.com","hd-tch.com","hdfriday.*","hdporn.net","hdtoday.cc","hdtoday.tv","hdzone.org","health.com","hechos.net","hentaisd.*","hextank.io","hhkungfu.*","hianime.to","himovies.*","hitprn.com","hivelr.com","hl-live.de","hoca4u.com","hoca4u.xyz","hostxy.com","hotmasti.*","hotovs.com","house.porn","how2pc.com","howifx.com","hqbang.com","hub2tv.com","hubcdn.vip","hubdrive.*","huoqwk.com","hydracdn.*","icegame.ro","iceporn.tv","idevice.me","idlix.asia","idlixvip.*","igay69.com","illink.net","ilmeteo.it","imag-r.com","imgair.net","imgbox.com","imgbqb.sbs","imginn.com","imgmgf.sbs","imgpke.sbs","imguee.sbs","indeed.com","indobo.com","inertz.org","infulo.com","ingles.com","ipamod.com","iplark.com","ironysub.*","isgfrm.com","issuya.com","itdmusic.*","iumkit.net","iusm.co.kr","iwcp.co.uk","jakondo.ru","japgay.com","japscan.ws","jav-fun.cc","jav-xx.com","jav.direct","jav247.top","jav380.com","javbee.vip","javbix.com","javboys.tv","javbull.tv","javdo.cc>>","javembed.*","javfan.one","javfav.com","javfc2.xyz","javgay.com","javhdz.*>>","javhub.net","javhun.com","javibe.net","javlab.net","javmix.app","javmvp.com","javneon.tv","javnew.net","javopen.co","javpan.net","javpas.com","javplay.me","javqis.com","javrip.net","javroi.com","javseen.tv","javsek.net","jnews5.com","jobsbd.xyz","joktop.com","joolinks.*","josemo.com","jpgames.de","jpvhub.com","jrlinks.in","jvideo.xyz","jytechs.in","kaaltv.com","kaliscan.*","kamelle.de","kaotic.com","kaplog.com","katlinks.*","kedoam.com","keepvid.pw","kejoam.com","kelaam.com","kendam.com","kenzato.uk","kerapoxy.*","keroseed.*","key-hub.eu","kiaclub.cz","kickass2.*","kickasst.*","kickassz.*","king-pes.*","kinobox.cz","kinoger.re","kinoger.ru","kinoger.to","kjmx.rocks","kkickass.*","klooam.com","klyker.com","kochbar.de","kompas.com","kompiko.pl","kotaku.com","kropic.com","kvador.com","kxbxfm.com","l1afav.net","labgame.io","lacrima.jp","larazon.es","leeapk.com","leechall.*","leet365.cc","leolist.cc","lewd.ninja","lglbmm.com","lidovky.cz","likecs.com","line25.com","link1s.com","linkbin.me","linkpoi.me","linkshub.*","linkskat.*","linksly.co","linkspy.cc","linkz.wiki","liquor.com","listatv.pl","live7v.com","livehere.*","livetvon.*","lollty.pro","lookism.me","lootdest.*","lopers.com","lorcana.gg","love4u.net","loveroms.*","lumens.com","lustich.de","lxmanga.my","m2list.com","macwelt.de","magnetdl.*","mahfda.com","mandai.com","mangago.me","mangaraw.*","mangceh.cc","manwan.xyz","mascac.org","mat6tube.*","mathdf.com","maths.news","maxicast.*","medibok.se","megadb.net","megadede.*","megaflix.*","megafly.in","megalink.*","megaup.net","megaurl.in","megaxh.com","meltol.net","meong.club","merinfo.se","mhdtvmax.*","milfzr.com","mitaku.net","mixdroop.*","mlbb.space","mma-core.*","mmnm.store","mmopeon.ru","mmtv01.xyz","molotov.tv","mongri.net","motchill.*","movibd.com","movie123.*","movie4me.*","moviegan.*","moviehdf.*","moviemad.*","movies07.*","movies2k.*","movies4u.*","movies7.to","moviflex.*","movix.blog","mozkra.com","mp3cut.net","mp3guild.*","mp3juice.*","mreader.co","mrpiracy.*","mtlurb.com","mult34.com","multics.eu","multiup.eu","multiup.io","multiup.us","musichq.cc","my-subs.co","mydaddy.cc","myjest.com","mykhel.com","mylust.com","myplexi.fr","myqqjd.com","myvideo.ge","myviid.com","naasongs.*","nackte.com","naijal.com","nakiny.com","namasce.pl","namemc.com","nbabite.to","nbaup.live","ncdnx3.xyz","negumo.com","neonmag.fr","neoteo.com","neowin.net","netfree.cc","newhome.de","newpelis.*","news18.com","newser.com","nexdrive.*","nflbite.to","ngelag.com","ngomek.com","ngomik.net","nhentai.io","nickles.de","niyaniya.*","nmovies.cc","noanyi.com","nocfsb.com","nohost.one","nosteam.ro","note1s.com","notube.com","novinky.cz","noz-cdn.de","nsfw247.to","nswrom.com","ntucgm.com","nudes7.com","nullpk.com","nuroflix.*","nxbrew.net","nxprime.in","nypost.com","odporn.com","odtmag.com","ofwork.net","ohorse.com","ohueli.net","okleak.com","okmusi.com","okteve.com","onehack.us","oneotv.com","onepace.co","onepunch.*","onezoo.net","onloop.pro","onmovies.*","onmsft.com","onvista.de","openload.*","oploverz.*","origami.me","orirom.com","otomoto.pl","owsafe.com","paminy.com","papafoot.*","parents.at","pbabes.com","pc-guru.it","pcbeta.com","pcgames.de","pctfenix.*","pcworld.es","pdfaid.com","peetube.cc","people.com","petbook.de","phc.web.id","phim85.com","picmsh.sbs","pictoa.com","pilsner.nu","pingit.com","pirlotv.mx","pixelio.de","plaion.com","planhub.ca","playboy.de","playfa.com","playgo1.cc","plc247.com","poapan.xyz","pondit.xyz","poophq.com","popcdn.day","poplinks.*","poranny.pl","porn00.org","porndr.com","pornfd.com","porngo.com","porngq.com","pornhd.com","pornhd8k.*","pornky.com","porntb.com","porntn.com","pornve.com","pornwex.tv","pornx.tube","pornxp.com","pornxp.org","pornxs.com","pouvideo.*","povvideo.*","povvldeo.*","povw1deo.*","povwideo.*","powlideo.*","powv1deo.*","powvibeo.*","powvideo.*","powvldeo.*","premid.app","progfu.com","prosongs.*","proxybit.*","proxytpb.*","prydwen.gg","psychic.de","pudelek.pl","puhutv.com","putlog.net","qqxnxx.com","qrixpe.com","qthang.net","quicomo.it","radio.zone","raenonx.cc","rakuten.tv","ranker.com","rawinu.com","rawlazy.si","realgm.com","rebahin.pw","redfea.com","redgay.net","reeell.com","regio7.cat","rencah.com","reshare.pm","rgeyyddl.*","rgmovies.*","riazor.org","rlxoff.com","rmdown.com","roblox.com","rodude.com","romsget.io","ronorp.net","roshy.tv>>","routech.ro","rsrlink.in","rule34.art","rule34.xxx","rule34.xyz","rule34ai.*","rumahit.id","s1p1cd.com","s2dfree.to","s3taku.com","sakpot.com","samash.com","savego.org","sawwiz.com","sbrity.com","sbs.com.au","scribd.com","sctoon.net","scubidu.eu","seed69.com","seeflix.to","serien.cam","seriesly.*","sevenst.us","sexato.com","sexjobs.es","sexkbj.com","sexlist.tv","sexodi.com","sexpin.net","sexpox.com","sexrura.pl","sextor.org","sextvx.com","sfile.mobi","shahid4u.*","shinden.pl","shineads.*","shlink.net","sholah.net","shorttey.*","shortx.net","shortzzy.*","showflix.*","shrinkme.*","shrt10.com","sibtok.com","sikwap.xyz","silive.com","simpcity.*","skmedix.pl","smoner.com","smsget.net","snbc13.com","snopes.com","snowmtl.ru","soap2day.*","socebd.com","sokobj.com","solewe.com","sombex.com","sourds.net","soy502.com","spiegel.de","spielen.de","sportal.de","sportbar.*","sports24.*","srvy.ninja","ssdtop.com","sshkit.com","ssyou.tube","stardima.*","stemplay.*","stiletv.it","stpm.co.uk","strcloud.*","streamsb.*","streamta.*","strefa.biz","sturls.com","suaurl.com","sumoweb.to","sunhope.it","szene38.de","tapetus.pl","target.com","taxi69.com","tcpvpn.com","tech8s.net","techhx.com","telerium.*","terafly.me","texte.work","th-cam.com","thatav.net","theacc.com","thecut.com","thedaddy.*","theproxy.*","thevidhd.*","thevouz.in","thosa.info","thothd.com","thripy.com","tickzoo.tv","tiscali.it","tktube.com","tokuvn.com","tokuzl.net","toorco.com","topito.com","toppng.com","torlock2.*","torrent9.*","tr3fit.xyz","tranny.one","trust.zone","trzpro.com","tsubasa.im","tsz.com.np","tubesex.me","tubous.com","tubsexer.*","tubtic.com","tugaflix.*","tulink.org","tumblr.com","tunein.com","turbovid.*","tutelehd.*","tutsnode.*","tutwuri.id","tuxnews.it","tv0800.com","tvline.com","tvnz.co.nz","tvtoday.de","twatis.com","uctnew.com","uindex.org","uiporn.com","unito.life","uol.com.br","up-load.io","upbaam.com","updato.com","updown.cam","updown.fun","updown.icu","upfion.com","upicsz.com","uplinkto.*","uploadev.*","uploady.io","uporno.xxx","uprafa.com","ups2up.fun","upskirt.tv","uptobhai.*","uptomega.*","urlpay.net","usagoals.*","userload.*","usgate.xyz","usnews.com","ustimz.com","ustream.to","utreon.com","uupbom.com","vadbam.com","vadbam.net","vadbom.com","vbnmll.com","vcloud.lol","vdbtm.shop","vecloud.eu","veganab.co","veplay.top","vevioz.com","vgames.fun","vgmlinks.*","vidapi.xyz","vidbam.org","vidcloud.*","vidcorn.to","vidembed.*","videyx.cam","videzz.net","vidlii.com","vidnest.io","vidohd.com","vidomo.xyz","vidoza.net","vidply.com","viewfr.com","vinomo.xyz","vipboxtv.*","vipotv.com","vipstand.*","vivatube.*","vizcloud.*","vortez.net","vrporn.com","vvide0.com","vvtlinks.*","wapkiz.com","warps.club","watch32.sx","watch4hd.*","watcho.com","watchug.to","watchx.top","wawacity.*","weather.us","web1s.asia","webcafe.bg","weloma.art","weshare.is","weszlo.com","wetter.com","wetter3.de","wikwiki.cv","wintub.com","woiden.com","wooflix.tv","woxikon.de","ww9g.com>>","www.cc.com","x-x-x.tube","xanimu.com","xasiat.com","xberuang.*","xhamster.*","xhopen.com","xhspot.com","xhtree.com","xhvid1.com","xiaopan.co","xmorex.com","xmovie.pro","xmovies8.*","xnxx.party","xpicse.com","xprime4u.*","xrares.com","xsober.com","xspiel.com","xsz-av.com","xszav.club","xvideis.cc","xxgasm.com","xxmovz.com","xxxdan.com","xxxfiles.*","xxxmax.net","xxxrip.net","xxxsex.pro","xxxtik.com","xxxtor.com","xxxxsx.com","y-porn.com","y2mate.com","y2tube.pro","ygozone.gg","ymknow.xyz","yomovies.*","youapk.net","youmath.it","youpit.xyz","youwatch.*","yseries.tv","ytanime.tv","ytboob.com","ytjar.info","ytmp4.live","yts-subs.*","yumacs.com","yuppow.com","yuvutu.com","yy1024.net","z12z0vla.*","zeefiles.*","zenless.gg","zilinak.sk","zillow.com","zoechip.cc","zoechip.gg","zpaste.net","zthots.com","0123movie.*","0gomovies.*","0rechner.de","10alert.com","111watcho.*","11xmovies.*","123animes.*","123movies.*","12thman.com","141tube.com","173.249.8.3","17track.net","18comic.vip","1movieshd.*","1xanimes.in","2gomovies.*","2rdroid.com","3bmeteo.com","3dyasan.com","3hentai.net","3ixcf45.cfd","3xfaktor.hu","423down.com","4funbox.com","4gousya.net","4players.de","4shared.com","4spaces.org","4tymode.win","5j386s9.sbs","69games.xxx","76078rb.sbs","7review.com","7starmv.com","80-talet.se","8tracks.com","9animetv.to","9goals.live","9jarock.org","a-hentai.tv","aagmaal.com","abs-cbn.com","abstream.to","ad-doge.com","ad4msan.com","adictox.com","adisann.com","adshrink.it","afilmywap.*","africue.com","afrodity.sk","ahmedmode.*","aiailah.com","aipebel.com","akirabox.to","allkpop.com","almofed.com","almursi.com","altcryp.com","alttyab.net","analdin.com","anavidz.com","andiim3.com","anibatch.me","anichin.top","anigogo.net","animahd.com","anime-i.com","anime3d.xyz","animeblix.*","animebr.org","animehay.tv","animehub.ac","animepahe.*","animesex.me","anisaga.org","anitube.vip","aniworld.to","anomize.xyz","anonymz.com","anqkdhcm.nl","anxcinema.*","anyporn.com","anysex.club","aofsoru.com","aosmark.com","apekite.com","apkdink.com","apkhihe.com","apkshrt.com","apksvip.com","aplus.my.id","app.plex.tv","apritos.com","aquipelis.*","arabstd.com","arabxnx.com","arbweb.info","area51.porn","arenabg.com","arkadmin.fr","artnews.com","asia2tv.com","asianal.xyz","asianclub.*","asiangay.tv","asianload.*","asianplay.*","ask4movie.*","asmr18.fans","asmwall.com","asumesi.com","ausfile.com","auszeit.bio","autobild.de","autokult.pl","automoto.it","autopixx.de","autoroad.cz","autosport.*","avcesar.com","avitter.net","avjamak.net","axomtube.in","ayatoon.com","azmath.info","b2bhint.com","b4ucast.com","babaktv.com","babeswp.com","babyclub.de","badjojo.com","badtaste.it","barfuck.com","batman.city","bbwfest.com","bcmanga.com","bdcraft.net","bdmusic23.*","bdmusic28.*","bdsmporn.cc","beelink.pro","beinmatch.*","bengals.com","berich8.com","berklee.edu","bfclive.com","bg-gledai.*","bi-girl.net","bigconv.com","bigojav.com","bigshare.io","bigwank.com","bitco.world","bitlinks.pw","bitzite.com","blog4nx.com","blogue.tech","blu-ray.com","blurayufr.*","bokepxv.com","bolighub.dk","bollyflix.*","book18.fans","bootdey.com","botrix.live","bowfile.com","boxporn.net","brbeast.com","brbushare.*","brigitte.de","bristan.com","bsierad.com","btcbitco.in","btvsport.bg","btvsports.*","buondua.com","buzzfeed.at","buzzfeed.de","buzzpit.net","bx-zone.com","bypass.city","bypass.link","cafenau.com","camclips.tv","camel3.live","camsclips.*","camslib.com","camwhores.*","canaltdt.es","carbuzz.com","ccyig2ub.nl","ch-play.com","chatgbt.one","chatgpt.com","chefkoch.de","chicoer.com","chochox.com","cima-club.*","cinedesi.in","civitai.com","claimrbx.gg","clapway.com","clkmein.com","club386.com","cocorip.net","coldfrm.org","collater.al","colnect.com","comicxxx.eu","commands.gg","comnuan.com","comohoy.com","converto.io","corneey.com","corriere.it","cpmlink.net","cpmlink.pro","crackle.com","crazydl.net","crdroid.net","crvsport.ru","csurams.com","cubuffs.com","cuevana.pro","cupra.forum","cut-fly.com","cutearn.net","cutlink.net","cutpaid.com","cutyion.com","daddyhd.*>>","daddylive.*","daftsex.biz","daftsex.net","daftsex.org","daij1n.info","dailyweb.pl","daozoid.com","dawenet.com","ddlvalley.*","decrypt.day","deltabit.co","devotag.com","dexerto.com","digit77.com","digitask.ru","direct-dl.*","discord.com","disheye.com","diudemy.com","divxtotal.*","dj-figo.com","djqunjab.in","dlpanda.com","dma-upd.org","dogdrip.net","dogtime.com","donlego.com","dotycat.com","doumura.com","douploads.*","downsub.com","dozarte.com","dramacool.*","dramamate.*","dramanice.*","drawize.com","droplink.co","ds2play.com","dsharer.com","dsvplay.com","dudefilms.*","dz4link.com","e-glossa.it","e2link.link","e9china.net","earnbee.xyz","earnhub.net","easy-coin.*","easybib.com","ebookdz.com","echiman.com","echodnia.eu","ecomento.de","edjerba.com","eductin.com","einthusan.*","elahmad.com","elfqrin.com","elliott.org","embasic.pro","embedmoon.*","embedpk.net","embedtv.net","empflix.com","emuenzen.de","enagato.com","endfield.gg","eoreuni.com","eporner.com","eroasmr.com","erothots.co","erowall.com","esgeeks.com","eshentai.tv","eskarock.pl","eslfast.com","europixhd.*","everand.com","everia.club","everyeye.it","exalink.fun","exeking.top","ezmanga.net","f2movies.to","f51rm.com>>","fapdrop.com","fapguru.com","faptube.com","farescd.com","fastdokan.*","fastream.to","fastssh.com","fbstreams.*","fchopin.net","fdvzg.world","feyorra.top","fffmovies.*","figtube.com","file-up.org","file4go.com","file4go.net","filecloud.*","filecrypt.*","filelions.*","filemooon.*","filepress.*","fileq.games","filesamba.*","filesus.com","filmcdn.top","filmisub.cc","films5k.com","filmy-hit.*","filmy4web.*","filmydown.*","filmygod6.*","findjav.com","firefile.cc","fit4art.com","flixrave.me","flixsix.com","fluentu.com","fluvore.com","fmovies0.cc","folkmord.se","foodxor.com","footybite.*","forumdz.com","foumovies.*","foxtube.com","fplzone.com","freenem.com","freepik.com","frpgods.com","fseries.org","fsx.monster","ftuapps.dev","fuckfuq.com","futemax.zip","g-porno.com","gal-dem.com","gamcore.com","game-2u.com","game3rb.com","gameblog.in","gameblog.jp","gamehub.cam","gamelab.com","gamer18.net","gamestar.de","gameswelt.*","gametop.com","gamewith.jp","gamezone.de","gamezop.com","garaveli.de","gaytail.com","gayvideo.me","gazzetta.gr","gazzetta.it","gcloud.live","gedichte.ws","genialne.pl","get-to.link","getmega.net","getthit.com","gevestor.de","gezondnu.nl","ggbases.com","girlmms.com","girlshd.xxx","gisarea.com","gitizle.vip","gizmodo.com","globetv.app","go.zovo.ink","goalup.live","gobison.com","gocards.com","gocast2.com","godeacs.com","godmods.com","godtube.com","goducks.com","gofilms4u.*","gofrogs.com","gogifox.com","gogoanime.*","goheels.com","gojacks.com","gokerja.net","gold-24.net","golobos.com","gomovies.pk","gomoviesc.*","goodporn.to","gooplay.net","gorating.in","gosexy.mobi","gostyn24.pl","goto.com.np","gotocam.net","gotporn.com","govexec.com","gpldose.com","grafikos.cz","gsmware.com","guhoyas.com","gulf-up.com","h-flash.com","haaretz.com","hagalil.com","hagerty.com","hardgif.com","hartziv.org","haxmaps.com","haxnode.net","hblinks.pro","hdbraze.com","hdeuropix.*","hdmotori.it","hdonline.co","hdpicsx.com","hdpornt.com","hdtodayz.to","hdtube.porn","helmiau.com","hentai20.io","hentaila.tv","herexxx.com","herzporno.*","hes-goals.*","hexload.com","hhdmovies.*","himovies.sx","hindi.trade","hiphopa.net","history.com","hitokin.net","hmanga.asia","holavid.com","hoofoot.net","hoporno.net","hornpot.net","hornyfap.tv","hotabis.com","hotbabes.tv","hotcars.com","hotfm.audio","hotgirl.biz","hotleak.vip","hotleaks.tv","hotscope.tv","hotscopes.*","hotshag.com","hotstar.com","howchoo.com","hubdrive.de","hubison.com","hubstream.*","hubzter.com","hungama.com","hurawatch.*","huskers.com","huurshe.com","hwreload.it","hygiena.com","hypesol.com","icgaels.com","idlixku.com","iegybest.co","iframejav.*","iggtech.com","iimanga.com","iklandb.com","imageweb.ws","imgbvdf.sbs","imgjjtr.sbs","imgnngr.sbs","imgoebn.sbs","imgoutlet.*","imgtaxi.com","imgyhq.shop","impact24.us","in91vip.win","infocorp.io","infokik.com","inkapelis.*","instyle.com","inverse.com","ipa-apps.me","iporntv.net","iptvbin.com","isaimini.ca","isosite.org","ispunlock.*","itpro.co.uk","itudong.com","iv-soft.com","j-pussy.com","jaguars.com","jaiefra.com","japanfuck.*","japanporn.*","japansex.me","japscan.lol","javbake.com","javball.com","javbest.xyz","javbobo.com","javboys.com","javcock.com","javdoge.com","javfull.net","javgrab.com","javhoho.com","javideo.net","javlion.xyz","javmenu.com","javmeta.com","javmilf.xyz","javpool.com","javsex.guru","javstor.com","javx357.com","javynow.com","jcutrer.com","jeep-cj.com","jetanimes.*","jetpunk.com","jezebel.com","jixo.online","jjang0u.com","jkanime.net","jnovels.com","jobsibe.com","jocooks.com","jotapov.com","jpg.fishing","jra.jpn.org","jungyun.net","jxoplay.xyz","karanpc.com","kashtanka.*","kb.arlo.com","khohieu.com","kiaporn.com","kickassgo.*","kiemlua.com","kimoitv.com","kinoking.cc","kissanime.*","kissasia.cc","kissasian.*","kisscos.net","kissmanga.*","kjanime.net","klettern.de","kmansin09.*","kochamjp.pl","kodaika.com","kolyoom.com","komikcast.*","kompoz2.com","kpkuang.org","kppk983.com","ksuowls.com","l23movies.*","l2crypt.com","labstory.in","laposte.net","lapresse.ca","lastampa.it","latimes.com","latitude.to","lbprate.com","leaknud.com","letest25.co","letras2.com","lewdweb.net","lewebde.com","lfpress.com","lgcnews.com","lgwebos.com","libertyvf.*","lifeline.de","liflix.site","ligaset.com","likemag.com","linclik.com","link-to.net","linkmake.in","linkrex.net","links-url.*","linksfire.*","linkshere.*","linksmore.*","lite-link.*","loanpapa.in","lokalo24.de","lookimg.com","lookmovie.*","losmovies.*","losporn.org","lostineu.eu","lovefap.com","lrncook.xyz","lscomic.com","luluvdo.com","luluvid.com","luxmovies.*","m.akkxs.net","m.iqiyi.com","m1xdrop.com","m1xdrop.net","m4maths.com","made-by.org","madoohd.com","madouqu.com","magesypro.*","manga1000.*","manga1001.*","mangahub.io","mangasail.*","manhwa18.cc","maths.media","mature4.net","mavanimes.*","mavavid.com","maxstream.*","mcdlpit.com","mchacks.net","mcloud.guru","mcxlive.org","medisite.fr","mega1080p.*","megafile.io","megavideo.*","mein-mmo.de","melodelaa.*","mephimtv.cc","mercari.com","messitv.net","messitv.org","metavise.in","mgoblue.com","mhdsports.*","mhscans.com","miklpro.com","mirrorace.*","mirrored.to","mlbstream.*","mmfenix.com","mmsmaza.com","mobifuq.com","moenime.com","momluck.com","momomesh.tv","momondo.com","momvids.com","moonembed.*","moonmov.pro","motohigh.pl","moviebaaz.*","movied.link","movieku.ink","movieon21.*","movieplay.*","movieruls.*","movierulz.*","movies123.*","movies4me.*","movies4u3.*","moviesda4.*","moviesden.*","movieshub.*","moviesjoy.*","moviesmod.*","moviesmon.*","moviesub.is","moviesx.org","moviewr.com","moviezwap.*","movizland.*","mp3-now.com","mp3juices.*","mp3yeni.org","mp4moviez.*","mpo-mag.com","mr9soft.com","mrunblock.*","mtb-news.de","mtlblog.com","muchfap.com","multiup.org","muthead.com","muztext.com","mycloudz.cc","myflixerz.*","mygalls.com","mymp3song.*","mytoolz.net","myunity.dev","myvalley.it","myvidmate.*","myxclip.com","narcity.com","nbabox.co>>","nbastream.*","nbch.com.ar","nbcnews.com","needbux.com","needrom.com","nekopoi.*>>","nelomanga.*","nemenlake.*","netfapx.com","netflix.com","netfuck.net","netplayz.ru","netxwatch.*","netzwelt.de","news.com.au","newscon.org","newsmax.com","nextgov.com","nflbite.com","nflstream.*","nhentai.net","nhlstream.*","nicekkk.com","nichapk.com","nimegami.id","nkreport.jp","notandor.cn","novelism.jp","novohot.com","novojoy.com","nowiny24.pl","nowmovies.*","nrj-play.fr","nsfwr34.com","nudevista.*","nulakers.ca","nunflix.org","nyahentai.*","nysainfo.pl","odiasia.sbs","ofilmywap.*","ogomovies.*","ohentai.org","ohmymag.com","okstate.com","olamovies.*","olarila.com","omuzaani.me","onepiece.gg","onhockey.tv","onifile.com","onneddy.com","ontools.net","onworks.net","optimum.net","ortograf.pl","osxinfo.net","otakudesu.*","otakuindo.*","outletpic.*","overgal.com","overtake.gg","ovester.com","oxanime.com","p2pplay.pro","packers.com","pagesix.com","paketmu.com","pantube.top","papahd.club","papalah.com","paradisi.de","parents.com","parispi.net","pasokau.com","paste1s.com","payskip.org","pcbolsa.com","pcgamer.com","pdfdrive.to","pdfsite.net","pelisplus.*","peppe8o.com","perelki.net","pesktop.com","pewgame.com","pezporn.com","phim1080.in","pianmanga.*","picbqqa.sbs","picnft.shop","picngt.shop","picuenr.sbs","pinkporno.*","pinterest.*","piratebay.*","pistona.xyz","pitiurl.com","pixjnwe.sbs","pixsera.net","pksmovies.*","pkspeed.net","play.tv3.ee","play.tv3.lt","play.tv3.lv","playrust.io","playtamil.*","playtube.tv","plus.rtl.de","pngitem.com","pngreal.com","pogolinks.*","polygon.com","pomorska.pl","porcore.com","porn3dx.com","porn77.info","porn78.info","porndaa.com","porndex.com","porndig.com","porndoe.com","porndude.tv","porngem.com","porngun.net","pornhex.com","pornhub.com","pornium.net","pornkai.com","pornken.com","pornkino.cc","pornktube.*","pornmam.com","pornmom.net","porno-365.*","pornoman.pl","pornomoll.*","pornone.com","pornovka.cz","pornpaw.com","pornsai.com","porntin.com","porntry.com","pornult.com","poscitech.*","povvvideo.*","powstream.*","powstreen.*","primewire.*","prisjakt.no","promobil.de","pronpic.org","pulpo69.com","pupuweb.com","purplex.app","putlocker.*","pvip.gratis","qdembed.com","quizack.com","quizlet.com","radamel.icu","raiders.com","rainanime.*","raw1001.net","rawkuma.com","rawkuma.net","rawkuro.net","readfast.in","readmore.de","redgifs.com","redlion.net","redporno.cz","redtub.live","redvido.com","redwap2.com","redwap3.com","reifporn.de","rekogap.xyz","repelis.net","repelisgt.*","repelishd.*","repelisxd.*","repicsx.com","resetoff.pl","rethmic.com","retrotv.org","reuters.com","reverso.net","riedberg.tv","rimondo.com","rl6mans.com","rlshort.com","roadbike.de","rocklink.in","romfast.com","romsite.org","romviet.com","rphangx.net","rpmplay.xyz","rpupdate.cc","rsgamer.app","rubystm.com","rubyvid.com","rugby365.fr","runmods.com","ryxy.online","s0ft4pc.com","saekita.com","safelist.eu","sandrives.*","sankaku.app","sansat.link","sararun.net","sat1gold.de","satcesc.com","savelinks.*","savemedia.*","savetub.com","sbbrisk.com","sbchill.com","scenedl.org","scenexe2.io","schadeck.eu","scripai.com","sdefx.cloud","seclore.com","secuhex.com","see-xxx.com","semawur.com","sembunyi.in","sendvid.com","seoworld.in","serengo.net","serially.it","seriemega.*","seriesflv.*","seselah.com","sexavgo.com","sexdiaryz.*","sexemix.com","sexetag.com","sexmoza.com","sexpuss.org","sexrura.com","sexsaoy.com","sexuhot.com","sexygirl.cc","shaheed4u.*","sharclub.in","sharedisk.*","sharing.wtf","shavetape.*","shortearn.*","shrinkus.tk","shrlink.top","simsdom.com","siteapk.net","sitepdf.com","sixsave.com","smplace.com","snaptik.app","socks24.org","soft112.com","softrop.com","solobari.it","soninow.com","sosuroda.pl","soundpark.*","souqsky.net","southpark.*","spambox.xyz","spankbang.*","speedporn.*","spinbot.com","sporcle.com","sport365.fr","sportbet.gr","sportcast.*","sportlive.*","sportshub.*","spycock.com","srcimdb.com","ssoap2day.*","ssrmovies.*","staaker.com","stagatv.com","starmusiq.*","steamplay.*","steanplay.*","sterham.net","stickers.gg","stmruby.com","strcloud.in","streamcdn.*","streamed.su","streamers.*","streamhoe.*","streamhub.*","streamio.to","streamm4u.*","streamup.ws","strikeout.*","subdivx.com","subedlc.com","submilf.com","subsvip.com","sukuyou.com","sundberg.ws","sushiscan.*","swatalk.com","t-online.de","tabootube.*","tagblatt.ch","takimag.com","tamilyogi.*","tandess.com","taodung.com","tattle.life","tcheats.com","tdtnews.com","teachoo.com","teamkong.tk","techbook.de","techforu.in","technews.tw","tecnomd.com","telenord.it","telorku.xyz","teltarif.de","tempr.email","terabox.fun","teralink.me","testedich.*","texw.online","thapcam.net","thaript.com","thelanb.com","therams.com","theroot.com","thestar.com","thisvid.com","thotcity.su","thotporn.tv","thotsbay.tv","threads.com","threads.net","tidymom.net","tikmate.app","tinys.click","titantv.com","tnaflix.com","todaypktv.*","tonspion.de","toolxox.com","toonanime.*","toonily.com","topembed.pw","topgear.com","topmovies.*","topshare.in","topsport.bg","totally.top","toxicwap.us","trahino.net","tranny6.com","trgtkls.org","tribuna.com","trickms.com","trilog3.net","tromcap.com","trxking.xyz","tryvaga.com","ttsfree.com","tubator.com","tube18.sexy","tuberel.com","tubsxxx.com","turkanime.*","turkmmo.com","tutflix.org","tutvlive.ru","tv-media.at","tv.bdix.app","tvableon.me","tvseries.in","tw-calc.net","twitchy.com","twitter.com","ubbulls.com","ucanwatch.*","ufcstream.*","uhdmovies.*","uiiumovie.*","uknip.co.uk","umterps.com","unblockit.*","unixmen.com","uozzart.com","updown.link","upfiles.app","uploadbaz.*","uploadhub.*","uploadrar.*","upns.online","uproxy2.biz","uprwssp.org","upstore.net","upstream.to","uptime4.com","uptobox.com","urdubolo.pk","usfdons.com","usgamer.net","ustvgo.live","uyeshare.cc","v2movies.me","v6embed.xyz","vague.style","variety.com","vaughn.live","vectorx.top","vedshar.com","vegamovie.*","ver-pelis.*","verizon.com","vexfile.com","vexmovies.*","vf-film.net","vgamerz.com","vidbeem.com","vidcloud9.*","videezy.com","vidello.net","videovard.*","videoxxx.cc","videplay.us","videq.cloud","vidfast.pro","vidlink.pro","vidload.net","vidshar.org","vidshare.tv","vidspeed.cc","vidstream.*","vidtube.one","vikatan.com","vikings.com","vip-box.app","vipifsa.com","vipleague.*","vipracing.*","vipstand.se","viptube.com","virabux.com","visalist.io","visible.com","viva100.com","vixcloud.co","vizcloud2.*","vkprime.com","voirfilms.*","voyeurhit.*","vrcmods.com","vstdrive.in","vulture.com","vvtplayer.*","vw-page.com","w.grapps.me","waploaded.*","watchfree.*","watchmdh.to","watchporn.*","wavewalt.me","wayfair.com","wcostream.*","weadown.com","weather.com","webcras.com","webfail.com","webmaal.cfd","webtoon.xyz","weights.com","wetsins.com","weviral.org","wgzimmer.ch","why-tech.it","wildwap.com","winshell.de","wintotal.de","wmovies.xyz","woffxxx.com","wonporn.com","wowroms.com","wupfile.com","wvt.free.nf","www.msn.com","x-x-x.video","x.ag2m2.cfd","xemales.com","xflixbd.com","xforum.live","xfreehd.com","xgroovy.com","xhamster.fm","xhamster1.*","xhamster2.*","xhamster3.*","xhamster4.*","xhamster5.*","xhamster7.*","xhamster8.*","xhmoon5.com","xhreal2.com","xhreal3.com","xhtotal.com","xhwide1.com","xhwide2.com","xhwide5.com","xmateur.com","xmovies08.*","xnxxcom.xyz","xozilla.xxx","xpicu.store","xpornzo.com","xpshort.com","xsanime.com","xubster.com","xvideos.com","xx.knit.bid","xxxmomz.com","xxxmovies.*","xztgl.com>>","y-2mate.com","y2meta.mobi","yalifin.xyz","yamsoti.com","yesmovies.*","yestech.xyz","yifysub.net","ymovies.vip","yomovies1.*","yoshare.net","youshort.me","youtube.com","yoxplay.xyz","yt1s.com.co","yt2conv.com","ytmp3cc.net","ytsubme.com","yumeost.net","z9sayu0m.nl","zedporn.com","zemporn.com","zerioncc.pl","zerogpt.com","zetporn.com","ziperto.com","zlpaste.net","zoechip.com","zyromod.com","0123movies.*","0cbcq8mu.com","0l23movies.*","0ochi8hp.com","10-train.com","1024tera.com","103.74.5.104","123-movies.*","1234movies.*","123animes.ru","123moviesc.*","123moviess.*","123unblock.*","1340kbbr.com","16honeys.com","185.53.88.15","18tubehd.com","1fichier.com","1madrasdub.*","1nmnozg1.fun","1primewire.*","2017tube.com","2btmc2r0.fun","2cf0xzdu.com","2fb9tsgn.fun","2madrasdub.*","3a38xmiv.fun","3gaytube.com","45.86.86.235","456movie.com","4archive.org","4bct9.live>>","4edtcixl.xyz","4fansites.de","4k2h4w04.xyz","4live.online","4movierulz.*","56m605zk.fun","5moviess.com","720pstream.*","723qrh1p.fun","7hitmovies.*","8mhlloqo.fun","8rm3l0i9.fun","8teenxxx.com","a6iqb4m8.xyz","ablefast.com","aboedman.com","absoluporn.*","abysscdn.com","acapellas.eu","adbypass.org","adcrypto.net","addonbiz.com","adsurfle.com","adultfun.net","aegeanews.gr","afl3ua5u.xyz","afreesms.com","airliners.de","akinator.com","akirabox.com","alcasthq.com","alexsports.*","aliancapes.*","allcalidad.*","alliptvs.com","allmusic.com","allosurf.net","alotporn.com","alphatron.tv","alrincon.com","alternet.org","amateur8.com","amnaymag.com","amtil.com.au","amyscans.com","androidaba.*","anhdep24.com","anime-jl.net","anime3rb.com","animefire.io","animeflv.net","animefreak.*","animesanka.*","animeunity.*","animexin.vip","animixplay.*","aninavi.blog","anisubindo.*","anmup.com.np","annabelle.ch","antiadtape.*","antonimos.de","anybunny.com","apetube.asia","apkcombo.com","apkdrill.com","apkmodhub.in","apkprime.org","apkship.shop","apkupload.in","apnablogs.in","app.vaia.com","appsbull.com","appsmodz.com","aranzulla.it","arcaxbydz.id","arkadium.com","arolinks.com","aroratr.club","artforum.com","asiaflix.net","asianporn.li","askim-bg.com","atglinks.com","atgstudy.com","atozmath.com","audiotools.*","audizine.com","autodime.com","autoembed.cc","autonews.com","autorevue.at","avjamack.com","az-online.de","azoranov.com","azores.co.il","b-hentai.com","babesexy.com","babiato.tech","babygaga.com","bagpipe.news","baithak.news","bamgosu.site","bandstand.ph","banned.video","baramjak.com","barchart.com","baritoday.it","batchkun.com","batporno.com","bbyhaber.com","bceagles.com","bclikeqt.com","beemtube.com","beingtek.com","benchmark.pl","bestlist.top","bestwish.lol","biletomat.pl","bilibili.com","biopills.net","birdurls.com","bitchute.com","bitssurf.com","bittools.net","bk9nmsxs.com","blog-dnz.com","blogmado.com","blogmura.com","bloground.ro","blwideas.com","bobolike.com","bollydrive.*","bollyshare.*","boltbeat.com","bookfrom.net","bookriot.com","boredbat.com","boundhub.com","boysfood.com","br0wsers.com","braflix.tube","bright-b.com","bsmaurya.com","btvsports.my","bubraves.com","buffsports.*","buffstream.*","bugswave.com","bullfrag.com","burakgoc.com","burbuja.info","burnbutt.com","buyjiocoin.*","byswiizen.fr","bz-berlin.de","calbears.com","callfuck.com","camhub.world","camlovers.tv","camporn.tube","camwhores.tv","camwhorez.tv","capoplay.net","cardiagn.com","cariskuy.com","carnewz.site","cashbux.work","casperhd.com","casthill.net","catcrave.com","catholic.com","cbt-tube.net","cctvwiki.com","celebmix.com","celibook.com","cesoirtv.com","channel4.com","chargers.com","chatango.com","chibchat.com","chopchat.com","choralia.net","chzzkban.xyz","cinedetodo.*","cinemabg.net","cinemaxxl.de","claimbits.io","claimtrx.com","clickapi.net","clicporn.com","clip-sex.biz","clix4btc.com","clockskin.us","closermag.fr","cloudrls.com","cocogals.com","cocoporn.net","coderblog.in","codesnse.com","coindice.win","coingraph.us","coinsrev.com","collider.com","compsmag.com","compu-pc.com","cookierun.gg","cool-etv.net","cosmicapp.co","couchtuner.*","coursera.org","cracking.org","crazyblog.in","cricwatch.io","cryptosh.pro","cryptowin.io","cuevana8.com","cut-urls.com","cuts-url.com","cwc.utah.gov","cyberdrop.me","cyberleaks.*","cyclones.com","cyprus.co.il","czechsex.net","da-imnetz.de","daddylive1.*","dafideff.com","dafontvn.com","daftporn.com","dailydot.com","dailysport.*","daizurin.com","darkibox.com","datacheap.io","datanodes.to","dataporn.pro","datawav.club","dawntube.com","day4news.com","ddlvalley.me","deadline.com","deadspin.com","debridup.com","deckshop.pro","decorisi.com","deepbrid.com","deephot.link","delvein.tech","derwesten.de","descarga.xyz","desi.upn.bio","desihoes.com","desiupload.*","desivideos.*","deviants.com","diethood.com","digimanie.cz","dikgames.com","dir-tech.com","dirproxy.com","dirtyfox.net","dirtyporn.cc","distanta.net","divicast.com","divxtotal1.*","djpunjab2.in","dl-protect.*","dlolcast.pro","dlupload.com","dndsearch.in","dokumen.tips","domahatv.com","dotabuff.com","doujindesu.*","downloadr.in","drakecomic.*","dreamdth.com","drivefire.co","drivemoe.com","drivers.plus","dropbang.net","dropgalaxy.*","drsnysvet.cz","drublood.com","ds2video.com","dukeofed.org","dumovies.com","duolingo.com","dutchycorp.*","dvd-flix.com","dwlinks.buzz","dz-linkk.com","eastream.net","ecamrips.com","eclypsia.com","edukaroo.com","egram.com.ng","egyanime.com","ehotpics.com","elcultura.pl","electsex.com","eljgocmn.fun","elvocero.com","embed4me.com","embedtv.best","emporda.info","endbasic.dev","eng-news.com","engvideo.net","epson.com.cn","eroclips.org","erofound.com","erogarga.com","eropaste.net","eroticmv.com","esopress.com","esportivos.*","estrenosgo.*","estudyme.com","et-invest.de","etonline.com","eurogamer.de","eurogamer.es","eurogamer.it","eurogamer.pt","evernia.site","evfancy.link","ex-foary.com","examword.com","exceljet.net","exe-urls.com","eximeuet.fun","expertvn.com","eymockup.com","ezeviral.com","f1livegp.net","factable.com","fairyhorn.cc","famivita.com","fansided.com","fansmega.com","fapality.com","fapfappy.com","fartechy.com","fastilinks.*","fat-bike.com","fbsquadx.com","fc2stream.tv","fedscoop.com","feed2all.org","fehmarn24.de","femdomtb.com","ferdroid.net","fileguard.cc","fileguru.net","filemoon.*>>","filerice.com","filescdn.com","filessrc.com","filezipa.com","filmisongs.*","filmizletv.*","filmy4wap1.*","filmygod13.*","filmyone.com","filmyzilla.*","financid.com","finevids.xxx","firstonetv.*","fitforfun.de","fivemdev.org","flashbang.sh","flaticon.com","flexy.stream","flexyhit.com","flightsim.to","flixbaba.com","flowsnet.com","flstv.online","flvto.com.co","fm-arena.com","fmoonembed.*","fmoviesto.cc","focus4ca.com","footybite.to","forexrw7.com","forogore.com","forplayx.ink","fotopixel.es","freejav.guru","freemovies.*","freemp3.tube","freeride.com","freeshib.biz","freetron.top","freewsad.com","fremdwort.de","freshbbw.com","fruitlab.com","fuckmilf.net","fullboys.com","fullcinema.*","fullhd4k.com","fuskator.com","futemais.net","g8rnyq84.fun","galaxyos.net","game-owl.com","gamebrew.org","gamefast.org","gamekult.com","gamer.com.tw","gamerant.com","gamerxyt.com","games.get.tv","games.wkb.jp","gameslay.net","gameszap.com","gametter.com","gamezizo.com","gamingsym.in","gatagata.net","gay4porn.com","gaystream.pw","gayteam.club","gcaptain.com","gculopes.com","gelbooru.com","gentside.com","getcopy.link","getitfree.cn","getmodsapk.*","gifcandy.net","gioialive.it","gksansar.com","glo-n.online","globes.co.il","globfone.com","gniewkowo.eu","gnusocial.jp","go2share.net","goanimes.vip","gobadgers.ca","gocast123.me","godzcast.com","gogoanimes.*","gogriffs.com","golancers.ca","gomuraw.blog","gonzoporn.cc","goracers.com","gosexpod.com","gottanut.com","goxavier.com","gplastra.com","grazymag.com","grigtube.com","grosnews.com","gseagles.com","gsmhamza.com","guidetnt.com","gurusiana.id","h-game18.xyz","h8jizwea.fun","habuteru.com","hachiraw.net","hackshort.me","hackstore.me","halloporno.*","harbigol.com","hbnews24.com","hbrfrance.fr","hdfcfund.com","hdhub4u.fail","hdmoviehub.*","hdmovies23.*","hdmovies4u.*","hdmovies50.*","hdpopcorns.*","hdporn92.com","hdpornos.net","hdvideo9.com","hellmoms.com","helpdice.com","hentai2w.com","hentai3z.com","hentai4k.com","hentaigo.com","hentaihd.xyz","hentaila.com","hentaimoe.me","hentais.tube","hentaitk.net","hentaizm.fun","hi0ti780.fun","highporn.net","hiperdex.com","hipsonyc.com","hivetoon.com","hmanga.world","hostmath.com","hotmilfs.pro","hqporner.com","hubdrive.com","huffpost.com","hurawatch.cc","huzi6or1.fun","hwzone.co.il","hyderone.com","hydrogen.lat","hypnohub.net","iambaker.net","ibradome.com","icutlink.com","icyporno.com","idesign.wiki","idevfast.com","idntheme.com","iguarras.com","ihdstreams.*","ilovephd.com","ilpescara.it","imagefap.com","imdpu9eq.com","imgadult.com","imgbaron.com","imgblaze.net","imgbnwe.shop","imgbyrev.sbs","imgclick.net","imgdrive.net","imgflare.com","imgfrost.net","imggune.shop","imgjajhe.sbs","imgmffmv.sbs","imgnbii.shop","imgolemn.sbs","imgprime.com","imgqbbds.sbs","imgspark.com","imgthbm.shop","imgtorrnt.in","imgxabm.shop","imgxxbdf.sbs","imintweb.com","indianxxx.us","infodani.net","infofuge.com","informer.com","interssh.com","intro-hd.net","ipacrack.com","ipatriot.com","iptvapps.net","iptvspor.com","iputitas.net","iqksisgw.xyz","isaidub6.net","itainews.com","itz-fast.com","iwanttfc.com","izzylaif.com","jaktsidan.se","jalopnik.com","japanporn.tv","japteenx.com","jav-asia.top","javboys.tv>>","javbraze.com","javguard.xyz","javhahaha.us","javhdz.today","javindo.site","javjavhd.com","javmelon.com","javplaya.com","javplayer.me","javprime.net","javquick.com","javrave.club","javtiful.com","javturbo.xyz","jenpornuj.cz","jeshoots.com","jmzkzesy.xyz","jobfound.org","jobsheel.com","jockantv.com","joymaxtr.net","joziporn.com","jsfiddle.net","juba-get.com","jujmanga.com","kabeleins.de","kafeteria.pl","kakitengah.*","kamehaus.net","kaoskrew.org","karanapk.com","katmoviehd.*","kattracker.*","kaystls.site","khaddavi.net","khatrimaza.*","khsn1230.com","kickasskat.*","kinisuru.com","kinkyporn.cc","kino-zeit.de","kiss-anime.*","kisstvshow.*","klubsports.*","knowstuff.in","kolcars.shop","kollhong.com","konten.co.id","koramaup.com","kpopjams.com","kr18plus.com","kreisbote.de","kstreaming.*","kubo-san.com","kumapoi.info","kungfutv.net","kunmanga.com","kurazone.net","kusonime.com","ladepeche.fr","landwirt.com","lanjutkeun.*","latino69.fun","ldkmanga.com","leaktube.net","learnmany.in","lectormh.com","lecturel.com","leechall.com","leprogres.fr","lesbenhd.com","lesbian8.com","lewdzone.com","liddread.com","lifestyle.bg","lifewire.com","likemanga.io","likuoo.video","linfoweb.com","linkjust.com","linksaya.com","linkshorts.*","linkvoom.com","lionsfan.net","livegore.com","livemint.com","livesport.ws","ln-online.de","lokerwfh.net","longporn.xyz","lookmovie.pn","lookmovie2.*","lootdest.com","lostsword.gg","lover937.net","lrepacks.net","lucidcam.com","lulustream.*","luluvdoo.com","luscious.net","lusthero.com","luxuretv.com","m-hentai.net","mac2sell.net","macsite.info","mamahawa.com","manga18.club","mangadna.com","mangafire.to","mangagun.net","mangakio.com","mangakita.id","mangalek.com","mangamanga.*","manganelo.tv","mangarawjp.*","mangasco.com","mangoporn.co","mangovideo.*","manhuaga.com","manhuascan.*","manhwa68.com","manhwass.com","manhwaus.net","manpeace.org","manyakan.com","manytoon.com","maqal360.com","marmiton.org","masengwa.com","mashtips.com","masslive.com","mat6tube.com","mathaeser.de","maturell.com","mavanimes.co","maxgaming.fi","mazakony.com","mc-hacks.net","mcfucker.com","mcrypto.club","mdbekjwqa.pw","mdtaiwan.com","mealcold.com","medscape.com","medytour.com","meetimgz.com","mega-mkv.com","mega-p2p.net","megafire.net","megatube.xxx","megaupto.com","meilblog.com","metabomb.net","meteolive.it","miaandme.org","micmicidol.*","microify.com","midis.com.ar","mikohub.blog","milftoon.xxx","miraculous.*","mirror.co.uk","missavtv.com","missyusa.com","mitsmits.com","mixloads.com","mjukb26l.fun","mkm7c3sm.com","mkvcinemas.*","mlbstream.tv","mmsbee47.com","mobitool.net","modcombo.com","moddroid.com","modhoster.de","modsbase.com","modsfire.com","modyster.com","mom4real.com","momo-net.com","momsdish.com","momspost.com","momxxx.video","monaco.co.il","mooonten.com","moretvtime.*","moshahda.net","motofakty.pl","movie4u.live","moviedokan.*","movieffm.net","moviefreak.*","moviekids.tv","movielair.cc","movierulzs.*","movierulzz.*","movies123.pk","movies18.net","movies4us.co","moviesapi.to","moviesbaba.*","moviesflix.*","moviesland.*","moviespapa.*","moviesrulz.*","moviesshub.*","moviesxxx.cc","movieweb.com","movstube.net","mp3fiber.com","mp3juices.su","mp4-porn.net","mpg.football","mrscript.net","multporn.net","musictip.net","mutigers.com","myesports.gg","myflixerz.to","myfxbook.com","mylinkat.com","naijafav.top","naniplay.com","nanolinks.in","napiszar.com","nar.k-ba.net","natgeotv.com","nbastream.tv","nemumemo.com","nephobox.com","netmovies.to","netoff.co.jp","netuplayer.*","newatlas.com","news.now.com","newsextv.com","newsmondo.it","nextdoor.com","nextorrent.*","neymartv.net","nflscoop.xyz","nflstream.tv","nicetube.one","nicknight.de","nifteam.info","nilesoft.org","niu-pack.com","niyaniya.moe","nkunorse.com","nonktube.com","novelasesp.*","novelbob.com","novelpub.com","novelread.co","novoglam.com","novoporn.com","nowmaxtv.com","nowsports.me","nowsportv.nl","nowtv.com.tr","nptsr.live>>","nsfwgify.com","nsfwzone.xyz","nudecams.xxx","nudedxxx.com","nudistic.com","nudogram.com","nudostar.com","nueagles.com","nugglove.com","nusports.com","nwzonline.de","nyaa.iss.ink","nzbstars.com","oaaxpgp3.xyz","octanime.net","of-model.com","oimsmosy.fun","okulsoru.com","olutposti.fi","olympics.com","oncehelp.com","oneupload.to","onlinexxx.cc","onlytech.com","onscreens.me","onyxfeed.com","op-online.de","openload.mov","opomanga.com","optifine.net","orangeink.pk","oricon.co.jp","osuskins.net","otakukan.com","otakuraw.net","ottverse.com","ottxmaza.com","ovagames.com","ovnihoje.com","oyungibi.com","pagalworld.*","pak-mcqs.net","paktech2.com","pandadoc.com","pandamovie.*","panthers.com","papunika.com","parenting.pl","parzibyte.me","paste.bin.sx","pastepvp.org","pastetot.com","patriots.com","pay4fans.com","pc-hobby.com","pdfindir.net","peekvids.com","pelisflix2.*","pelishouse.*","pelispedia.*","pelisplus2.*","pennlive.com","pentruea.com","perisxxx.com","phimmoiaz.cc","photooxy.com","photopea.com","picbaron.com","picjbet.shop","picnwqez.sbs","picyield.com","pietsmiet.de","pig-fuck.com","pilibook.com","pinayflix.me","piratebayz.*","pisatoday.it","pittband.com","pixbnab.shop","pixdfdj.shop","piximfix.com","pixkfkf.shop","pixnbrqw.sbs","pixrqqz.shop","pkw-forum.de","platinmods.*","play.max.com","play.nova.bg","play1002.com","player4u.xyz","playerfs.com","playertv.net","playfront.de","playstore.pw","playvids.com","plaza.chu.jp","plc4free.com","plusupload.*","pmvhaven.com","poki-gdn.com","politico.com","polygamia.pl","pomofocus.io","ponsel4g.com","pornabcd.com","pornachi.com","porncomics.*","pornditt.com","pornfeel.com","pornfeet.xyz","pornflip.com","porngames.tv","porngrey.com","pornhat.asia","pornhdin.com","pornhits.com","pornhost.com","pornicom.com","pornleaks.in","pornlift.com","pornlore.com","pornluck.com","pornmoms.org","porno-tour.*","pornoaid.com","pornoente.tv","pornohd.blue","pornotom.com","pornozot.com","pornpapa.com","porntape.net","porntrex.com","pornvibe.org","pornwatch.ws","pornyeah.com","pornyfap.com","pornzone.com","poscitechs.*","postazap.com","postimees.ee","powcloud.org","prensa.click","pressian.com","pricemint.in","produsat.com","programme.tv","promipool.de","proplanta.de","prothots.com","ps2-bios.com","pugliain.net","pupupul.site","pussyspace.*","putlocker9.*","putlockerc.*","putlockers.*","pysznosci.pl","q1-tdsge.com","qashbits.com","qpython.club","quizrent.com","qvzidojm.com","r3owners.net","raidrush.net","rail-log.net","rajtamil.org","ranjeet.best","rapelust.com","rapidzona.tv","raulmalea.ro","rawmanga.top","rawstory.com","razzball.com","rbs.ta36.com","recipahi.com","recipenp.com","recording.de","reddflix.com","redecanais.*","redretti.com","remilf.xyz>>","reminimod.co","repelisgoo.*","repretel.com","reqlinks.net","resplace.com","retire49.com","richhioon.eu","riftbound.gg","riotbits.com","ritzysex.com","rockmods.net","rolltide.com","romatoday.it","roms-hub.com","ronaldo7.pro","root-top.com","rosasidan.ws","rosefile.net","rot-blau.com","royalkom.com","rp-online.de","rtilinks.com","rubias19.com","rue89lyon.fr","ruidrive.com","rushporn.xxx","s2watch.link","salidzini.lv","samfirms.com","samovies.net","satkurier.pl","savefrom.net","savegame.pro","savesubs.com","savevideo.me","scamalot.com","scjhg5oh.fun","seahawks.com","seeklogo.com","seireshd.com","seksrura.net","senimovie.co","senmanga.com","senzuri.tube","servustv.com","sethphat.com","seuseriado.*","sex-pic.info","sexgames.xxx","sexgay18.com","sexroute.net","sexy-games.*","sexyhive.com","sfajacks.com","sgxnifty.org","shanurdu.com","sharedrive.*","sharetext.me","shemale6.com","shemedia.com","sheshaft.com","shorteet.com","shrtslug.biz","sieradmu.com","silkengirl.*","sinonimos.de","siteflix.org","sitekeys.net","skinnyhq.com","skinnyms.com","slawoslaw.pl","slreamplay.*","slutdump.com","slutmesh.net","smailpro.com","smallpdf.com","smcgaels.com","smgplaza.com","snlookup.com","snowbreak.gg","sobatkeren.*","sodomojo.com","solarmovie.*","sonixgvn.net","sortporn.com","sound-park.*","southfreak.*","sp-today.com","sp500-up.com","speedrun.com","spielfilm.de","spinoff.link","sport-97.com","sportico.com","sporting77.*","sportlemon.*","sportlife.es","sportnews.to","sportshub.to","sportskart.*","stardeos.com","stardima.com","stayglam.com","stbturbo.xyz","steelers.com","stevivor.com","stimotion.pl","stre4mplay.*","stream18.net","streamango.*","streambee.to","streameast.*","streampiay.*","streamtape.*","streamwish.*","strikeout.im","stylebook.de","subtaboo.com","sunbtc.space","sunporno.com","superapk.org","superpsx.com","supervideo.*","surf-trx.com","surfline.com","surrit.store","sushi-scan.*","sussytoons.*","suzihaza.com","suzylu.co.uk","svipvids.com","swiftload.io","synonyms.com","syracuse.com","system32.ink","tabering.net","tabooporn.tv","tacobell.com","tagecoin.com","tajpoint.com","tamilprint.*","tamilyogis.*","tampabay.com","tanfacil.net","tapchipi.com","tapepops.com","tatabrada.tv","tatangga.com","team-rcv.xyz","tech24us.com","tech4auto.in","techably.com","techmuzz.com","technons.com","technorj.com","techstage.de","techstwo.com","techtobo.com","techyinfo.in","techzed.info","teczpert.com","teencamx.com","teenhost.net","teensark.com","teensporn.tv","teknorizen.*","telecinco.es","telegraaf.nl","teleriumtv.*","teluguflix.*","teraearn.com","terashare.co","terashare.me","tesbox.my.id","tespedia.com","testious.com","th-world.com","theblank.net","theconomy.me","thedaddy.*>>","thefmovies.*","thegamer.com","thehindu.com","thekickass.*","thelinkbox.*","themezon.net","theonion.com","theproxy.app","thesleak.com","thesukan.net","thevalley.fm","theverge.com","thotvids.com","threezly.com","thuglink.com","thurrott.com","tigernet.com","tik-tok.porn","timestamp.fr","tioanime.com","tipranks.com","tnaflix.asia","tnhitsda.net","tntdrama.com","tokenmix.pro","top10cafe.se","topeuropix.*","topfaucet.us","topkickass.*","topspeed.com","topstreams.*","torture1.net","trahodom.com","trendyol.com","tresdaos.com","truthnews.de","tryboobs.com","ts-mpegs.com","tsmovies.com","tubedupe.com","tubewolf.com","tubxporn.com","tucinehd.com","turbobit.net","turbovid.vip","turkanime.co","turkdown.com","turkrock.com","tusfiles.com","tv247us.live","tv3monde.com","tvappapk.com","tvdigital.de","tvpclive.com","tvtropes.org","tweakers.net","twister.porn","tz7z9z0h.com","u-s-news.com","u26bekrb.fun","u9206kzt.fun","udoyoshi.com","ugreen.autos","ukchat.co.uk","ukdevilz.com","ukigmoch.com","ultraten.net","umagame.info","umamusume.gg","unefemme.net","unitystr.com","up-4ever.net","uploadbox.io","uploadmx.com","uploads.mobi","upshrink.com","uptomega.net","ur-files.com","ur70sq6j.fun","usatoday.com","usaxtube.com","userupload.*","usp-forum.de","utahutes.com","utaitebu.com","utakmice.net","uthr5j7t.com","utsports.com","uur-tech.net","uwatchfree.*","valuexh.life","vdiflcsl.fun","veganinja.hu","vegas411.com","vibehubs.com","videofilms.*","videojav.com","videos-xxx.*","videovak.com","vidsaver.net","vidsrc.click","viidshar.com","vikiporn.com","violablu.net","vipporns.com","viralxns.com","visorsmr.com","vocalley.com","voirseries.*","volokit2.com","vqjhqcfk.fun","warddogs.com","watchmovie.*","watchmygf.me","watchnow.fun","watchop.live","watchporn.cc","watchporn.to","watchtvchh.*","way2movies.*","web2.0calc.*","webcams.casa","webnovel.com","webxmaza.com","westword.com","whatgame.xyz","whyvpn.my.id","wikifeet.com","wikirise.com","winboard.org","winfuture.de","winlator.com","wishfast.top","withukor.com","wohngeld.org","wolfstream.*","worldaide.fr","worldmak.com","worldsex.com","writedroid.*","wspinanie.pl","www.google.*","x-video.tube","xculitos.com","xemphim1.top","xfantazy.com","xfantazy.org","xhaccess.com","xhadult2.com","xhadult3.com","xhadult4.com","xhadult5.com","xhamster10.*","xhamster11.*","xhamster12.*","xhamster13.*","xhamster14.*","xhamster15.*","xhamster16.*","xhamster17.*","xhamster18.*","xhamster19.*","xhamster20.*","xhamster42.*","xhdate.world","xpornium.net","xsexpics.com","xteensex.net","xvideos.name","xvideos2.com","xxporner.com","xxxfiles.com","xxxhdvideo.*","xxxonline.cc","xxxputas.net","xxxshake.com","xxxstream.me","y5vx1atg.fun","yabiladi.com","yaoiscan.com","yggtorrent.*","yhocdata.com","ynk-blog.com","yogranny.com","you-porn.com","yourlust.com","yts-subs.com","yts-subs.net","ytube2dl.com","yuatools.com","yurineko.net","yurudori.com","z1ekv717.fun","zealtyro.com","zehnporn.com","zenradio.com","zhlednito.cz","zilla-xr.xyz","zimabdko.com","zone.msn.com","zootube1.com","zplayer.live","zvision.link","01234movies.*","01fmovies.com","10convert.com","10play.com.au","10starhub.com","111.90.150.10","111.90.151.26","111movies.com","123gostream.*","123movies.net","123moviesgo.*","123movieshd.*","123moviesla.*","123moviesme.*","123movieweb.*","123multihub.*","185.53.88.104","185.53.88.204","190.115.18.20","1bitspace.com","1qwebplay.xyz","1xxx-tube.com","247sports.com","2girls1cup.ca","30kaiteki.com","360news4u.net","38.242.194.12","3dhentai.club","4download.net","4drumkits.com","4filmyzilla.*","4horlover.com","4meplayer.com","4movierulz1.*","560pmovie.com","5movierulz2.*","6hiidude.gold","7fractals.icu","7misr4day.com","7movierulz1.*","7moviesrulz.*","7vibelife.com","94.103.83.138","9filmyzilla.*","9ketsuki.info","9xmoovies.com","abczdrowie.pl","abendblatt.de","abseits-ka.de","acusports.com","acutetube.net","adblocktape.*","addapinch.com","advantien.com","advertape.net","aiimgvlog.fun","ainonline.com","aitohuman.org","ajt.xooit.org","akcartoons.in","albania.co.il","alexbacher.fr","alimaniac.com","allfaucet.xyz","allitebooks.*","allmomsex.com","alltstube.com","allusione.org","alohatube.xyz","alueviesti.fi","ambonkita.com","angelfire.com","angelgals.com","anihdplay.com","animecast.net","animefever.cc","animeflix.ltd","animefreak.to","animeheaven.*","animenexus.in","animesite.net","animesup.info","animetoast.cc","animeworld.ac","animeworld.tv","animeyabu.net","animeyabu.org","animeyubi.com","anitube22.vip","aniwatchtv.to","anonyviet.com","anusling.info","aogen-net.com","aparttent.com","appteka.store","arahdrive.com","archive.today","archivebate.*","archpaper.com","areabokep.com","areamobile.de","areascans.net","areatopik.com","arenascan.com","arenavision.*","aresmanga.com","arhplyrics.in","ariestube.com","ark-unity.com","arldeemix.com","artesacro.org","arti-flora.nl","articletz.com","artribune.com","asianboy.fans","asianhdplay.*","asianlbfm.net","asiansex.life","asiaontop.com","askattest.com","askpython.com","asssex-hd.com","astroages.com","astronews.com","at.wetter.com","audiotag.info","audiotrip.org","austiblox.net","auto-data.net","auto-swiat.pl","autobytel.com","autoextrem.de","autofrage.net","autoscout24.*","autosport.com","autotrader.nl","avpgalaxy.net","azcentral.com","aztravels.net","b-bmovies.com","babakfilm.com","babepedia.com","babestube.com","babytorrent.*","baddiehub.com","bakedbree.com","bdsm-fuck.com","beasttips.com","beegsexxx.com","besargaji.com","bestgames.com","beverfood.com","biftutech.com","bikeradar.com","bikerszene.de","bilasport.net","bilinovel.com","billboard.com","bimshares.com","bingsport.xyz","bitcosite.com","bitfaucet.net","bitlikutu.com","bitview.cloud","bizdustry.com","blasensex.com","blog.40ch.net","blogesque.net","blograffo.net","blurayufr.cam","bobs-tube.com","bokugents.com","bolly2tolly.*","bollymovies.*","boobgirlz.com","bootyexpo.net","boxylucha.com","boystube.link","bravedown.com","bravoporn.com","brawlhalla.fr","breitbart.com","breznikar.com","brighteon.com","brocoflix.com","brocoflix.xyz","bshifast.live","buffsports.io","buffstreams.*","bustyfats.com","buxfaucet.com","buydekhke.com","bymichiby.com","call4cloud.nl","camarchive.tv","camdigest.com","camgoddess.tv","camvideos.org","camwhorestv.*","camwhoria.com","canalobra.com","canlikolik.my","capo4play.com","capo5play.com","capo6play.com","caravaning.de","cardshare.biz","carryflix.icu","carscoops.com","cat-a-cat.net","cat3movie.org","cbsnews.com>>","ccthesims.com","cdiscount.com","celeb.gate.cc","celemusic.com","ceramic.or.kr","ceylonssh.com","cg-method.com","cgcosplay.org","chapteria.com","chataigpt.org","cheatcloud.cc","cheater.ninja","cheatsquad.gg","chevalmag.com","chihouban.com","chikonori.com","chimicamo.org","chloeting.com","chumplady.com","cima100fm.com","cine24.online","cinecalidad.*","cinedokan.top","cinema.com.my","cinemabaz.com","cinemitas.org","civitai.green","claim.8bit.ca","claimbits.net","claudelog.com","claydscap.com","clickhole.com","cloudvideo.tv","cloudwish.xyz","cloutgist.com","cmsdetect.com","cmtracker.net","cnnamador.com","cockmeter.com","cocomanga.com","code2care.org","codeastro.com","codesnail.com","codewebit.top","coinbaby8.com","coinfaucet.io","coinlyhub.com","coinsbomb.com","colourxh.site","comedyshow.to","comexlive.org","comparili.net","computer76.ru","condorsoft.co","configspc.com","cooksinfo.com","coolcast2.com","coolporno.net","corrector.app","courseclub.me","crackcodes.in","crackevil.com","crackfree.org","crazyporn.xxx","crazyshit.com","crazytoys.xyz","cricket12.com","criollasx.com","criticker.com","crocotube.com","crotpedia.net","crypto4yu.com","cryptonor.xyz","cryptorank.io","cumlouder.com","cureclues.com","currytrail.in","cuttlinks.com","cxissuegk.com","cybermania.ws","daddylive.*>>","daddylivehd.*","dailynews.com","dailypaws.com","dailyrevs.com","dandanzan.top","dankmemer.lol","datavaults.co","dbusports.com","dcleakers.com","ddd-smart.net","decmelfot.xyz","deepfucks.com","deichstube.de","deluxtube.com","demae-can.com","denofgeek.com","depvailon.com","derusblog.com","descargasok.*","desijugar.net","desimmshd.com","dfilmizle.com","dickclark.com","dinnerexa.com","dipprofit.com","dirtyship.com","diskizone.com","dl-protect1.*","dlapk4all.com","dldokan.store","dlhe-videa.sk","doctoraux.com","dongknows.com","donkparty.com","doofree88.com","doomovie-hd.*","dooodster.com","doramasyt.com","dorawatch.net","douploads.net","douxporno.com","downfile.site","downloader.is","downloadhub.*","dr-farfar.com","dragonball.gg","dragontea.ink","dramafren.com","dramafren.org","dramaviki.com","drivelinks.me","drivenime.com","driveup.space","drop.download","dropnudes.com","dropshipin.id","dubaitime.net","durtypass.com","e-monsite.com","e2link.link>>","eatsmarter.de","ebonybird.com","ebook-hell.to","ebook3000.com","ebooksite.org","edealinfo.com","edukamer.info","egitim.net.tr","elespanol.com","embdproxy.xyz","embed.scdn.to","embedgram.com","embedplayer.*","embedrise.com","embedwish.com","empleo.com.uy","emueagles.com","encurtads.net","encurtalink.*","enjoyfuck.com","ensenchat.com","entenpost.com","entireweb.com","ephoto360.com","epochtimes.de","eporner.video","eramuslim.com","erospots.info","eroticity.net","erreguete.gal","esladvice.com","eurogamer.net","exe-links.com","expansion.com","extratipp.com","fadedfeet.com","familyporn.tv","fanfiktion.de","fangraphs.com","fantasiku.com","fapomania.com","faresgame.com","farodevigo.es","farsinama.com","fastcars1.com","fclecteur.com","fembed9hd.com","fetish-tv.com","fetishtube.cc","file-upload.*","filegajah.com","filehorse.com","filemooon.top","filmeseries.*","filmibeat.com","filmlinks4u.*","filmy4wap.uno","filmyporno.tv","filmyworlds.*","findheman.com","firescans.xyz","firmwarex.net","firstpost.com","fivemturk.com","flexamens.com","flexxporn.com","flix-wave.lol","flixlatam.com","flyplayer.xyz","fmoviesfree.*","fontyukle.net","footeuses.com","footyload.com","forexforum.co","forlitoday.it","forum.dji.com","fossbytes.com","fosslinux.com","fotoblogia.pl","foxaholic.com","foxsports.com","foxtel.com.au","frauporno.com","free.7hd.club","freedom3d.art","freeflix.info","freegames.com","freeiphone.fr","freeomovie.to","freeporn8.com","freesex-1.com","freeshot.live","freexcafe.com","freexmovs.com","freshscat.com","freyalist.com","fromwatch.com","fsicomics.com","fsl-stream.lu","fsportshd.net","fsportshd.xyz","fuck-beeg.com","fuck-xnxx.com","fucksporn.com","fullassia.com","fullhdxxx.com","funandnews.de","fussball.news","futurezone.de","fzmovies.info","fztvseries.ng","gamearter.com","gamedrive.org","gamefront.com","gamelopte.com","gamereactor.*","games.bnd.com","games.qns.com","gamesite.info","gamesmain.xyz","gamevcore.com","gamezhero.com","gamovideo.com","garoetpos.com","gatasdatv.com","gayboyshd.com","gaysearch.com","geekering.com","generate.plus","gesundheit.de","getintopc.com","getpaste.link","getpczone.com","gfsvideos.com","ghscanner.com","gigmature.com","gipfelbuch.ch","girlnude.link","girlydrop.com","globalnews.ca","globalrph.com","globalssh.net","globlenews.in","go.linkify.ru","gobobcats.com","gogoanimetv.*","gogoplay1.com","gogoplay2.com","gohuskies.com","gol245.online","goldderby.com","gomaainfo.com","gomoviestv.to","goodriviu.com","govandals.com","grabpussy.com","grantorrent.*","graphicux.com","greatnass.com","greensmut.com","gry-online.pl","gsmturkey.net","guardaserie.*","gutefrage.net","gutekueche.at","gwusports.com","haaretz.co.il","hailstate.com","hairytwat.org","hancinema.net","haonguyen.top","haoweichi.com","harimanga.com","harzkurier.de","hdgayporn.net","hdmoviefair.*","hdmoviehubs.*","hdmovieplus.*","hdmovies2.org","hdpornzap.com","hdtubesex.net","heatworld.com","heimporno.com","hellabyte.one","hellenism.net","hellporno.com","hentaihaven.*","hentaikai.com","hentaimama.tv","hentaipaw.com","hentaiporn.me","hentairead.io","hentaiyes.com","herzporno.net","heutewelt.com","hexupload.net","hiddenleaf.to","hifi-forum.de","hihihaha1.xyz","hihihaha2.xyz","hilites.today","hindimovies.*","hindinest.com","hindishri.com","hindisite.net","hispasexy.org","hitsports.pro","hlsplayer.top","hobbykafe.com","holaporno.xxx","holymanga.net","hornbunny.com","hornyfanz.com","hosttbuzz.com","hotntubes.com","hotpress.info","howtogeek.com","hqmaxporn.com","hqpornero.com","hqsex-xxx.com","htmlgames.com","hulkshare.com","hurawatchz.to","hydraxcdn.biz","hypebeast.com","hyperdebrid.*","iammagnus.com","iceland.co.uk","ichberlin.com","icy-veins.com","ievaphone.com","iflixmovies.*","ifreefuck.com","igg-games.com","ignboards.com","iiyoutube.com","ikarianews.gr","ikz-online.de","ilpiacenza.it","imagehaha.com","imagenpic.com","imgbbnhi.shop","imgbncvnv.sbs","imgcredit.xyz","imghqqbg.shop","imgkkabm.shop","imgmyqbm.shop","imgwallet.com","imgwwqbm.shop","imleagues.com","indiafree.net","indianyug.com","indiewire.com","ineedskin.com","inextmovies.*","infidrive.net","inhabitat.com","instagram.com","instalker.org","interfans.org","investing.com","iogames.space","ipalibrary.me","iptvpulse.top","italpress.com","itdmusics.com","itmaniatv.com","itopmusic.com","itsguider.com","jadijuara.com","jagoanssh.com","jameeltips.us","japanxxx.asia","jav101.online","javenglish.cc","javguard.club","javhdporn.net","javleaked.com","javmobile.net","javporn18.com","javsaga.ninja","javstream.com","javstream.top","javsubbed.xyz","javsunday.com","jaysndees.com","jazzradio.com","jellynote.com","jennylist.xyz","jesseporn.xyz","jiocinema.com","jipinsoft.com","jizzberry.com","jk-market.com","jkdamours.com","jncojeans.com","jobzhub.store","joongdo.co.kr","jpscan-vf.com","jptorrent.org","juegos.as.com","jumboporn.xyz","junkyponk.com","jurukunci.net","justjared.com","justpaste.top","justwatch.com","juventusfc.hu","k12reader.com","kacengeng.com","kakiagune.com","kalileaks.com","kanaeblog.net","kangkimin.com","katdrive.link","katestube.com","katmoviefix.*","kayoanime.com","kckingdom.com","kenta2222.com","kfapfakes.com","kfrfansub.com","kicaunews.com","kickcharm.com","kissasian.*>>","klaustube.com","klikmanga.com","kllproject.lv","klykradio.com","kobieta.wp.pl","kolnovel.site","koreanbj.club","korsrt.eu.org","kotanopan.com","kpopjjang.com","ksusports.com","kumascans.com","kupiiline.com","kuronavi.blog","kurosuen.live","lamorgues.com","laptrinhx.com","latinabbw.xyz","latinlucha.es","laurasia.info","lavoixdux.com","law101.org.za","learn-cpp.org","learnclax.com","lecceprima.it","leccotoday.it","leermanga.net","leinetal24.de","letmejerk.com","letras.mus.br","lewdstars.com","liberation.fr","libreriamo.it","liiivideo.com","likemanga.ink","lilymanga.net","ling-online.*","link4rev.site","linkfinal.com","linkskibe.com","linkspaid.com","linovelib.com","linuxhint.com","lippycorn.com","listeamed.net","litecoin.host","litonmods.com","liveonsat.com","livestreams.*","liveuamap.com","lolcalhost.ru","lolhentai.net","longfiles.com","lookmovie2.to","loot-link.com","loptelink.com","lordpremium.*","love4porn.com","lovetofu.cyou","lowellsun.com","lrtrojans.com","lsusports.net","ludigames.com","lulacloud.com","lustesthd.lat","lustholic.com","lusttaboo.com","lustteens.net","lustylist.com","lustyspot.com","luxusmail.org","m.viptube.com","m.youtube.com","maccanismi.it","macrumors.com","macserial.com","magesypro.com","mailnesia.com","mailocal2.xyz","mainbabes.com","mainlinks.xyz","mainporno.com","makeuseof.com","mamochki.info","manga-dbs.com","manga-tube.me","manga18fx.com","mangacrab.com","mangacrab.org","mangadass.com","mangafreak.me","mangahere.onl","mangakoma01.*","mangalist.org","mangarawjp.me","mangaread.org","mangasite.org","mangoporn.net","manhastro.com","manhastro.net","manhuatop.org","manhwatop.com","manofadan.com","map.naver.com","marvel.church","mathcrave.com","mathebibel.de","mathsspot.com","matomeiru.com","maz-online.de","mconverter.eu","md3b0j6hj.com","mdfx9dc8n.net","mdy48tn97.com","medebooks.xyz","mediafire.com","mediamarkt.be","mediamarkt.de","mediapason.it","medihelp.life","mega-dvdrip.*","megagames.com","megane.com.pl","megawarez.org","megawypas.com","meineorte.com","meinestadt.de","memangbau.com","memedroid.com","menshealth.de","metalflirt.de","meteopool.org","metrolagu.cam","mettablog.com","meuanime.info","mexicogob.com","mh.baxoi.buzz","mhdsportstv.*","mhdtvsports.*","miohentai.com","miraculous.to","mirrorace.com","missav123.com","missav888.com","mitedrive.com","mixdrop21.net","mixdrop23.net","mixdropjmk.pw","mjakmama24.pl","mmastreams.me","mmorpg.org.pl","mobdi3ips.com","mobdropro.com","modelisme.com","mom-pussy.com","momxxxass.com","momxxxsex.com","moneyhouse.ch","moneyning.com","monstream.org","monzatoday.it","moonquill.com","moovitapp.com","moozpussy.com","moregirls.org","morgenpost.de","mosttechs.com","motive213.com","motofan-r.com","motor-talk.de","motorbasar.de","motortests.de","moutogami.com","moviedekho.in","moviefone.com","moviehaxx.pro","moviejones.de","movielinkbd.*","moviepilot.de","movieping.com","movierulzhd.*","moviesdaweb.*","moviesite.app","moviesverse.*","moviexxx.mobi","mp3-gratis.it","mp3fusion.net","mp3juices.icu","mp4mania1.net","mp4upload.com","mrpeepers.net","mtech4you.com","mtg-print.com","mtraffics.com","multicanais.*","musicsite.biz","musikradar.de","myadslink.com","mydomaine.com","myfernweh.com","myflixertv.to","mygolfspy.com","myhindigk.com","myhomebook.de","myicloud.info","myrecipes.com","myshopify.com","mysostech.com","mythvista.com","myvidplay.com","myvidster.com","myviptuto.com","myyouporn.com","naijahits.com","nakenprat.com","napolipiu.com","nastybulb.com","nation.africa","natomanga.com","naturalbd.com","nbcsports.com","ncdexlive.org","needrombd.com","neilpatel.com","nekolink.site","nekopoi.my.id","neoseeker.com","nesiaku.my.id","netfilmes.org","netnaijas.com","nettiauto.com","neuepresse.de","neurotray.com","nevcoins.club","neverdims.com","newstopics.in","newyorker.com","newzjunky.com","nexusgames.to","nexusmods.com","nflstreams.me","nhvnovels.com","nicematin.com","nicomanga.com","nihonkuni.com","nin10news.com","nklinks.click","noblocktape.*","noikiiki.info","noob4cast.com","noor-book.com","nordbayern.de","notevibes.com","nousdecor.com","nouvelobs.com","novamovie.net","novelcrow.com","novelroom.net","novizer.com>>","nsfwalbum.com","nsfwhowto.xyz","nudegista.com","nudistube.com","nuhuskies.com","nukibooks.com","nulledmug.com","nvimfreak.com","nwusports.com","odiafresh.com","officedepot.*","ogoplayer.xyz","ohmybrush.com","ojogos.com.br","okhatrimaza.*","onemanhua.com","online-fix.me","onlinegdb.com","onlyssh.my.id","onlystream.tv","op-marburg.de","openloadmov.*","ostreaming.tv","otakuliah.com","otakuporn.com","otonanswer.jp","ottawasun.com","ovcsports.com","owlsports.com","ozulscans.com","padovaoggi.it","pagalfree.com","pagalmovies.*","pagalworld.us","paidnaija.com","panuvideo.com","paolo9785.com","parisporn.org","parmatoday.it","pasteboard.co","pasteflash.sx","pastelink.net","patchsite.net","pawastreams.*","pc-builds.com","pc-magazin.de","pclicious.net","peacocktv.com","peladas69.com","peliculas24.*","pelisflix20.*","pelisgratis.*","pelismart.com","pelisplusgo.*","pelisplushd.*","pelisplusxd.*","pelisstar.com","perplexity.ai","pervclips.com","pg-wuming.com","pianokafe.com","pic-upload.de","picbcxvxa.sbs","pichaloca.com","pics-view.com","pienovels.com","piraproxy.app","pirateproxy.*","pixbkghxa.sbs","pixbryexa.sbs","pixnbrqwg.sbs","pixtryab.shop","pkbiosfix.com","play.aetv.com","player.stv.tv","player4me.vip","playfmovies.*","playpaste.com","plugincim.com","pocketnow.com","poco.rcccn.in","pokemundo.com","polska-ie.com","popcorntime.*","porn4fans.com","pornbaker.com","pornbimbo.com","pornblade.com","pornborne.com","pornchaos.org","pornchimp.com","porncomics.me","porncoven.com","porndollz.com","porndrake.com","pornfelix.com","pornfuzzy.com","pornloupe.com","pornmonde.com","pornoaffe.com","pornobait.com","pornocomics.*","pornoeggs.com","pornohaha.com","pornohans.com","pornohelm.com","pornokeep.com","pornoleon.com","pornomico.com","pornonline.cc","pornonote.pro","pornoplum.com","pornproxy.app","pornproxy.art","pornretro.xyz","pornslash.com","porntopic.com","porntube18.cc","posterify.net","pourcesoir.in","povaddict.com","powforums.com","pravda.com.ua","pregledaj.net","pressplay.cam","pressplay.top","prignitzer.de","proappapk.com","proboards.com","produktion.de","promiblogs.de","prostoporno.*","protestia.com","protopage.com","ptcgpocket.gg","pureleaks.net","pussy-hub.com","pussyspot.net","putlockertv.*","puzzlefry.com","pvpoke-re.com","pygodblog.com","qqwebplay.xyz","quesignifi.ca","quicasting.it","quickporn.net","rainytube.com","ranourano.xyz","rbscripts.net","read.amazon.*","readingbd.com","realbooru.com","realmadryt.pl","rechtslupe.de","redhdtube.xxx","redsexhub.com","reliabletv.me","repelisgooo.*","restorbio.com","reviewdiv.com","rexdlfile.com","rgeyyddl.skin","ridvanmau.com","riggosrag.com","ritzyporn.com","rocdacier.com","rockradio.com","rojadirecta.*","roms4ever.com","romsgames.net","romspedia.com","rossoporn.com","rottenlime.pw","roystream.com","rufiiguta.com","rumbunter.com","ruyamanga.com","s.sseluxx.com","sagewater.com","sakaiplus.com","sarapbabe.com","sassytube.com","savefiles.com","scatkings.com","scimagojr.com","scrapywar.com","scrolller.com","sendspace.com","seneporno.com","sensacine.com","seriesite.net","set.seturl.in","sex-babki.com","sexbixbox.com","sexbox.online","sexdicted.com","sexmazahd.com","sexmutant.com","sexphimhd.net","sextube-6.com","sexyscope.net","sexytrunk.com","sfastwish.com","sfirmware.com","shameless.com","share.hntv.tv","share1223.com","sharemods.com","sharkfish.xyz","sharphindi.in","shemaleup.net","short-fly.com","short1ink.com","shortlinkto.*","shortpaid.com","shorttrick.in","shownieuws.nl","shroomers.app","siimanga.cyou","simana.online","simplebits.io","sinemalar.com","sissytube.net","sitefilme.com","sitegames.net","sk8therapy.fr","skymovieshd.*","smartworld.it","smashkarts.io","snapwordz.com","socigames.com","softcobra.com","softfully.com","sohohindi.com","solarmovie.id","solarmovies.*","solotrend.net","songfacts.com","sosovalue.com","spankbang.com","spankbang.mov","speedporn.net","speedtest.net","speedweek.com","spfutures.org","spokesman.com","spontacts.com","sportbar.live","sportlemons.*","sportlemonx.*","sportowy24.pl","sportsbite.cc","sportsembed.*","sportsnest.co","sportsrec.com","sportweb.info","spring.org.uk","ssyoutube.com","stagemilk.com","stalkface.com","starsgtech.in","startpage.com","startseite.to","ster-blog.xyz","stock-rom.com","str8ongay.com","stream-69.com","stream4free.*","streambtw.com","streamcloud.*","streamfree.to","streamhd247.*","streamobs.net","streampoi.com","streamporn.cc","streamsport.*","streamta.site","streamtp1.com","streamvid.net","strefaagro.pl","striptube.net","stylist.co.uk","subtitles.cam","subtorrents.*","suedkurier.de","sufanblog.com","sulleiman.com","sunporno.club","superstream.*","supervideo.tv","supforums.com","sweetgirl.org","swisscows.com","switch520.com","sylverkat.com","sysguides.com","szexkepek.net","szexvideok.hu","t-rocforum.de","tab-maker.com","taigoforum.de","tamilarasan.*","tamilguns.org","tamilhit.tech","tapenoads.com","tatsublog.com","techacode.com","techclips.net","techdriod.com","techilife.com","techishant.in","technofino.in","techradar.com","techrecur.com","techtrim.tech","techyrick.com","teenbabe.link","tehnotone.com","tejtime24.com","teknisitv.com","temp-mail.lol","temp-mail.org","tempumail.com","tennis.stream","ternitoday.it","terrylove.com","testsieger.de","texastech.com","thejournal.ie","thelayoff.com","thememypc.net","thenation.com","thespruce.com","thetemp.email","thethings.com","thetravel.com","theuser.cloud","theweek.co.uk","thichcode.net","thiepmung.com","thotpacks.xyz","thotslife.com","thoughtco.com","tierfreund.co","tierlists.com","timescall.com","tinyzonetv.cc","tinyzonetv.se","tiz-cycling.*","tmohentai.com","to-travel.net","tok-thots.com","tokopedia.com","tokuzilla.net","topwwnews.com","torgranate.de","torrentz2eu.*","totalcsgo.com","totaldebrid.*","tourporno.com","towerofgod.me","trade2win.com","trailerhg.xyz","trangchu.news","transfaze.com","transflix.net","transtxxx.com","travelbook.de","tremamnon.com","tribeclub.com","tricksplit.io","trigonevo.com","tripsavvy.com","tsubasatr.org","tubehqxxx.com","tubemania.org","tubereader.me","tudigitale.it","tudotecno.com","tukipasti.com","tunabagel.net","tunemovie.fun","turkleech.com","tutcourse.com","tvfutbol.info","twink-hub.com","txxxporn.tube","uberhumor.com","ubuntudde.com","udemyking.com","udinetoday.it","uhcougars.com","uicflames.com","umamigirl.com","uniqueten.net","unlockapk.com","unlockxh4.com","unnuetzes.com","unterhalt.net","up4stream.com","uploadgig.com","uptoimage.com","urgayporn.com","utrockets.com","uwbadgers.com","vectorizer.io","vegamoviese.*","veoplanet.com","verhentai.top","vermoegen.org","vibestreams.*","vibraporn.com","vid-guard.com","vidaextra.com","videoplayer.*","vidora.stream","vidspeeds.com","vidstream.pro","viefaucet.com","villanova.com","vintagetube.*","vipergirls.to","vipserije.com","vipstand.pm>>","visionias.net","visnalize.com","vixenless.com","vkrovatku.com","voidtruth.com","voiranime1.fr","voirseries.io","vosfemmes.com","vpntester.org","vstplugin.net","vuinsider.com","w3layouts.com","waploaded.com","warezsite.net","watch.plex.tv","watchdirty.to","watchluna.com","watchmovies.*","watchseries.*","watchsite.net","watchtv24.com","wdpglobal.com","weatherwx.com","weirdwolf.net","wendycode.com","westmanga.org","wetpussy.sexy","wg-gesucht.de","whoreshub.com","widewifes.com","wikipekes.com","wikitechy.com","willcycle.com","windowspro.de","wkusports.com","wlz-online.de","wmoviesfree.*","wonderapk.com","workink.click","world4ufree.*","worldfree4u.*","worldsports.*","worldstar.com","worldtop2.com","wowescape.com","wunderweib.de","wvusports.com","www.amazon.de","www.seznam.cz","www.twitch.tv","x-fetish.tube","x-videos.name","xanimehub.com","xhbranch5.com","xhchannel.com","xhlease.world","xhplanet1.com","xhplanet2.com","xhvictory.com","xhwebsite.com","xmovies08.org","xnxxjapon.com","xoxocomic.com","xrivonet.info","xsportbox.com","xsportshd.com","xstory-fr.com","xxvideoss.org","xxx-image.com","xxxbunker.com","xxxcomics.org","xxxfree.watch","xxxhothub.com","xxxscenes.net","xxxvideo.asia","xxxvideor.com","y2meta-uk.com","yachtrevue.at","yandexcdn.com","yaoiotaku.com","ycongnghe.com","yesmovies.*>>","yesmovies4u.*","yeswegays.com","ymp4.download","yogitimes.com","youjizzz.club","youlife24.com","youngleak.com","youpornfm.com","youtubeai.com","yoyofilmeys.*","yumekomik.com","zamundatv.com","zerotopay.com","zigforums.com","zinkmovies.in","zmamobile.com","zoompussy.com","zorroplay.xyz","0dramacool.net","111.90.141.252","111.90.150.149","111.90.159.132","1111fullwise.*","123animehub.cc","123moviefree.*","123movierulz.*","123movies4up.*","123moviesd.com","123movieshub.*","185.193.17.214","188.166.182.72","18girlssex.com","1cloudfile.com","1pack1goal.com","1primewire.com","1shortlink.com","1stkissmanga.*","3gpterbaru.com","3rabsports.com","4everproxy.com","69hoshudaana.*","69teentube.com","90fpsconfig.in","absolugirl.com","absolutube.com","admiregirls.su","adnan-tech.com","adsafelink.com","afilmywapi.biz","agedvideos.com","airsextube.com","akumanimes.com","akutsu-san.com","alexsports.*>>","alimaniacky.cz","allbbwtube.com","allcalidad.app","allcelebs.club","allmovieshub.*","allosoccer.com","allpremium.net","allrecipes.com","alluretube.com","allwpworld.com","almezoryae.com","alphaporno.com","amanguides.com","amateurfun.net","amateurporn.co","amigosporn.top","ancensored.com","anconatoday.it","androgamer.org","androidacy.com","ani-stream.com","anime4mega.net","animeblkom.net","animefire.info","animefire.plus","animeheaven.ru","animeindo.asia","animeshqip.org","animespank.com","animesvision.*","anonymfile.com","anyxvideos.com","aozoraapps.net","appsfree4u.com","arab4media.com","arabincest.com","arabxforum.com","arealgamer.org","ariversegl.com","arlinadzgn.com","armyranger.com","articlebase.pk","artoffocas.com","ashemaletube.*","ashemaletv.com","asianporn.sexy","asianwatch.net","askpaccosi.com","askushowto.com","assesphoto.com","astro-seek.com","atlantic10.com","audiotools.pro","autocentrum.pl","autopareri.com","av1encodes.com","b3infoarena.in","balkanteka.net","bamahammer.com","bankshiksha.in","bantenexis.com","batmanstream.*","battleboats.io","bbwfuckpic.com","bcanepaltu.com","bcsnoticias.mx","bdsmstreak.com","bdsomadhan.com","bdstarshop.com","beegvideoz.com","belloporno.com","benzinpreis.de","best18porn.com","bestofarea.com","betaseries.com","bharian.com.my","bhugolinfo.com","bidersnotu.com","bildderfrau.de","bingotingo.com","bit-shares.com","bitcotasks.com","bitcrypto.info","bittukitech.in","blackcunts.org","blackteen.link","blocklayer.com","blowjobgif.net","bluearchive.gg","bluedollar.net","boersennews.de","bolly-tube.com","bollywoodx.org","bonstreams.net","boobieblog.com","boobsradar.com","boobsrealm.com","boredgiant.com","boxaoffrir.com","brainknock.net","bravoteens.com","bravotube.asia","brightpets.org","brulosophy.com","btcadspace.com","btcsatoshi.net","btvnovinite.bg","btvsports.my>>","buccaneers.com","businessua.com","bustmonkey.com","bustybloom.com","cacfutures.org","cadenadial.com","calculate.plus","calgarysun.com","camgirlbay.net","camgirlfap.com","camsstream.com","canalporno.com","caracol.com.co","cardscanner.co","carrnissan.com","casertanews.it","celebjihad.com","celebwhore.com","cellmapper.net","cesenatoday.it","chachocool.com","chanjaeblog.jp","chart.services","chatgptfree.ai","chaturflix.cam","cheatermad.com","chietitoday.it","cimanow.online","cine-calidad.*","cinelatino.net","cinemalibero.*","cinepiroca.com","citychilli.com","claimcrypto.cc","claimlite.club","clasicotas.org","clicknupload.*","clipartmax.com","cloudflare.com","cloudvideotv.*","club-flank.com","codeandkey.com","coinadpro.club","coloradoan.com","comdotgame.com","comicsarmy.com","comixzilla.com","commanders.com","compromath.com","comunio-cl.com","convert2mp3.cx","coolrom.com.au","copyseeker.net","courseboat.com","coverapi.space","coverapi.store","crackshash.com","cracksports.me","crazygames.com","crazyvidup.com","creebhills.com","crichdplays.ru","cricwatch.io>>","crm.cekresi.me","crunchyscan.fr","cryptoforu.org","cryptonetos.ru","cryptotech.fun","cryptstream.de","csgo-ranks.com","cuckoldsex.net","curseforge.com","cwtvembeds.com","cyberscoop.com","czechvideo.org","dagensnytt.com","dailylocal.com","dallasnews.com","dansmovies.com","daotranslate.*","daxfutures.org","dayuploads.com","ddwloclawek.pl","decompiler.com","defenseone.com","delcotimes.com","derstandard.at","derstandard.de","desicinema.org","desicinemas.pk","designbump.com","desiremovies.*","desktophut.com","devdrive.cloud","deviantart.com","diampokusy.com","dicariguru.com","dieblaue24.com","digipuzzle.net","direct-cloud.*","dirtytamil.com","disneyplus.com","dobletecno.com","dodgersway.com","dogsexporn.net","doseofporn.com","dotesports.com","dotfreesex.com","dotfreexxx.com","doujinnote.com","dowfutures.org","downloadming.*","drakecomic.com","dreamfancy.org","duniailkom.com","dvdgayporn.com","dvdporngay.com","e123movies.com","easytodoit.com","eatingwell.com","ecacsports.com","echo-online.de","ed-protect.org","eddiekidiw.com","eftacrypto.com","elcorreoweb.es","electomania.es","elitegoltv.org","elitetorrent.*","elmalajeno.com","emailnator.com","embedsports.me","embedstream.me","emilybites.com","empire-anime.*","emturbovid.com","emugameday.com","enryumanga.com","epicstream.com","epornstore.com","ericdraken.com","erinsakura.com","erokomiksi.com","eroprofile.com","esgentside.com","esportivos.fun","este-walks.net","estrenosflix.*","estrenosflux.*","ethiopia.co.il","examscisco.com","exbulletin.com","expertplay.net","exteenporn.com","extratorrent.*","extreme-down.*","eztvtorrent.co","f123movies.com","faaduindia.com","fairyanime.com","fakazagods.com","fakedetail.com","fanatik.com.tr","fantacalcio.it","fap-nation.org","faperplace.com","faselhdwatch.*","fastdour.store","fatxxxtube.com","faucetdump.com","fduknights.com","fetishburg.com","fettspielen.de","fhmemorial.com","fibwatch.store","filemirage.com","fileplanet.com","filesharing.io","filesupload.in","film-adult.com","filme-bune.biz","filmpertutti.*","filmy4waps.org","filmypoints.in","filmyzones.com","filtercams.com","finanztreff.de","finderporn.com","findtranny.com","fine-wings.com","firefaucet.win","fitdynamos.com","fleamerica.com","flostreams.xyz","flycutlink.com","fmoonembed.pro","foodgustoso.it","foodiesjoy.com","foodtechnos.in","football365.fr","fooxybabes.com","forex-trnd.com","fosslovers.com","foxyfolksy.com","freeforums.net","freegayporn.me","freehqtube.com","freeltc.online","freemodsapp.in","freepasses.org","freepdfcomic.*","freepreset.net","freesoccer.net","freesolana.top","freetubetv.net","freiepresse.de","freshplaza.com","freshremix.net","frostytube.com","fu-1abozhcd.nl","fu-1fbolpvq.nl","fu-4u3omzw0.nl","fu-e4nzgj78.nl","fu-m03aenr9.nl","fu-mqsng72r.nl","fu-p6pwkgig.nl","fu-pl1lqloj.nl","fu-v79xn6ct.nl","fu-ys0tjjs1.nl","fucktube4k.com","fuckundies.com","fullporner.com","fullvoyeur.com","gadgetbond.com","galleryxh.site","gamefi-mag.com","gameofporn.com","games.amny.com","games.insp.com","games.metro.us","games.metv.com","games.wtop.com","games2rule.com","games4king.com","gamesgames.com","gamesleech.com","gayforfans.com","gaypornhot.com","gayxxxtube.net","gazettenet.com","gdr-online.com","gdriveplayer.*","gearpatrol.com","gecmisi.com.tr","genovatoday.it","getintopcm.com","getintoway.com","getmaths.co.uk","gettapeads.com","gigacourse.com","gisvacancy.com","gknutshell.com","gloryshole.com","goalsport.info","gobearcats.com","gofilmizle.net","gofirmware.com","goislander.com","golightsgo.com","gomoviesfree.*","gomovieshub.io","goodreturns.in","goodstream.one","googlvideo.com","gorecenter.com","gorgeradio.com","goshockers.com","gostanford.com","gostreamon.net","goterriers.com","gotgayporn.com","gotigersgo.com","gourmandix.com","gousfbulls.com","govtportal.org","grannysex.name","grantorrent1.*","grantorrents.*","graphicget.com","grubstreet.com","guitarnick.com","gujjukhabar.in","gurbetseli.net","guruofporn.com","gutfuerdich.co","gwens-nest.com","gyanitheme.com","gyonlineng.com","hairjob.wpx.jp","haloursynow.pl","hanime1-me.top","hannibalfm.net","hardcorehd.xxx","haryanaalert.*","hausgarten.net","hawtcelebs.com","hdhub4one.pics","hdmovies23.com","hdmoviesfair.*","hdmoviesflix.*","hdmoviesmaza.*","hdpornteen.com","healthelia.com","hentai-for.net","hentai-hot.com","hentai-one.com","hentaiasmr.moe","hentaiblue.net","hentaibros.com","hentaicity.com","hentaidays.com","hentaihere.com","hentaipins.com","hentairead.com","hentaisenpai.*","hentaiteca.net","hentaiworld.tv","heysigmund.com","hidefninja.com","hilaryhahn.com","hinatasoul.com","hindilinks4u.*","hindimovies.to","hindiporno.pro","hit-erotic.com","hollymoviehd.*","homebooster.de","homeculina.com","homesports.net","hortidaily.com","hotcleaner.com","hotgirlhub.com","hotgirlpix.com","howtocivil.com","hpaudiobooks.*","hyogo.ie-t.net","hypershort.com","i123movies.net","iconmonstr.com","idealfollow.in","idlelivelink.*","ilifehacks.com","ilikecomix.com","imagetwist.com","imgjbxzjv.shop","imgjmgfgm.shop","imgjvmbbm.shop","imgnnnvbrf.sbs","inbbotlist.com","indi-share.com","indiainfo4u.in","indiatimes.com","infocycles.com","infokita17.com","infomaniakos.*","informacion.es","inhumanity.com","insidenova.com","instaporno.net","insteading.com","ios.codevn.net","iqksisgw.xyz>>","isabeleats.com","isekaitube.com","issstories.xyz","itopmusics.com","itopmusicx.com","iuhoosiers.com","jacksorrell.tv","jalshamoviez.*","janamathaya.lk","japannihon.com","japantaboo.com","javaguides.net","javbangers.com","javggvideo.xyz","javhdvideo.org","javheroine.com","javplayers.com","javsexfree.com","javsubindo.com","javtsunami.com","javxxxporn.com","jeniusplay.com","jewelry.com.my","jizzbunker.com","join2babes.com","joyousplay.xyz","jpopsingles.eu","juegoviejo.com","jugomobile.com","juicy3dsex.com","justababes.com","justembeds.xyz","kaboomtube.com","kahanighar.com","kakarotfoot.ru","kannadamasti.*","kashtanka2.com","keepkoding.com","kendralist.com","kgs-invest.com","khabarbyte.com","kickassanime.*","kickasshydra.*","kiddyshort.com","kindergeld.org","kingofdown.com","kiradream.blog","kisahdunia.com","kissmovies.net","kits4beats.com","klartext-ne.de","kokostream.net","komikmanhwa.me","kompasiana.com","kordramass.com","kurakura21.com","kuruma-news.jp","ladkibahin.com","lampungway.com","laprovincia.es","laradiobbs.net","laser-pics.com","latinatoday.it","lauradaydo.com","layardrama21.*","leaderpost.com","leahingram.com","leakedzone.com","leakshaven.com","learnospot.com","lebahmovie.com","ledauphine.com","ledgernote.com","lesboluvin.com","lesfoodies.com","letmejerk2.com","letmejerk3.com","letmejerk4.com","letmejerk5.com","letmejerk6.com","letmejerk7.com","lewdcorner.com","lifehacker.com","ligainsider.de","limetorrents.*","linemarlin.com","link.vipurl.in","linkconfig.com","livenewsof.com","lizardporn.com","login.asda.com","lokhung888.com","lookmovie186.*","ludwig-van.com","lulustream.com","m.liputan6.com","mactechnews.de","macworld.co.uk","mad4wheels.com","madchensex.com","madmaxworld.tv","mail.yahoo.com","main-spitze.de","maliekrani.com","manga4life.com","mangamovil.net","manganatos.com","mangaraw18.net","mangarawad.fit","mangareader.to","manhuascan.com","manhwaclub.net","manhwalist.com","manhwaread.com","marketbeat.com","masteranime.tv","mathepower.com","maths101.co.za","matureworld.ws","mcafee-com.com","mega-debrid.eu","megacanais.com","megalinks.info","megamovies.org","megapastes.com","mehr-tanken.de","mejortorrent.*","mercato365.com","meteologix.com","mewingzone.com","milanotoday.it","milanworld.net","milffabrik.com","minecraft.buzz","minorpatch.com","mixmods.com.br","mixrootmod.com","mjsbigblog.com","mkv-pastes.com","mobileporn.cam","mockupcity.com","modagamers.com","modapkfile.com","moddedguru.com","modenatoday.it","moderngyan.com","moegirl.org.cn","mommybunch.com","mommysucks.com","momsextube.pro","mortaltech.com","motchill29.com","motherless.com","motogpstream.*","motorgraph.com","motorsport.com","motscroises.fr","movearnpre.com","moviefree2.com","movies2watch.*","moviesapi.club","movieshd.watch","moviesjoy-to.*","moviesjoyhd.to","moviesnation.*","movingxh.world","movisubmalay.*","mtsproducoes.*","multiplayer.it","mummumtime.com","musketfire.com","mxpacgroup.com","mycoolmoviez.*","mydesibaba.com","myforecast.com","myglamwish.com","mylifetime.com","mynewsmedia.co","mypornhere.com","myporntape.com","mysexgamer.com","mysexgames.com","myshrinker.com","mytectutor.com","naasongsfree.*","naijauncut.com","nammakalvi.com","naszemiasto.pl","navysports.com","nazarickol.com","nensaysubs.net","neonxcloud.top","neservicee.com","netchimp.co.uk","new.lewd.ninja","newmovierulz.*","newsbreak24.de","newscard24.com","ngontinh24.com","nicheporno.com","nichetechy.com","nikaplayer.com","ninernoise.com","nirjonmela.com","nishankhatri.*","niteshyadav.in","nitroflare.com","niuhuskies.com","nodenspace.com","nosteam.com.ro","notunmovie.net","notunmovie.org","novaratoday.it","novel-gate.com","novelaplay.com","novelgames.com","novostrong.com","nowosci.com.pl","nudebabes.sexy","nulledbear.com","nulledteam.com","nullforums.net","nulljungle.com","nurulislam.org","nylondolls.com","ocregister.com","officedepot.fr","oggitreviso.it","ohsheglows.com","okamimiost.com","omegascans.org","onlineatlas.us","onlinekosh.com","onlineporno.cc","onlybabes.site","openstartup.tm","opentunnel.net","oregonlive.com","organismes.org","orgasmlist.com","orgyxxxhub.com","orovillemr.com","osubeavers.com","osuskinner.com","oteknologi.com","ourenseando.es","overhentai.net","palapanews.com","palofw-lab.com","pandamovies.me","pandamovies.pw","pandanote.info","pantieshub.net","pantrymama.com","panyshort.link","papafoot.click","paris-tabi.com","paste-drop.com","pathofexile.gg","paylaterin.com","peachytube.com","pelismartv.com","pelismkvhd.com","pelispedia24.*","pelispoptv.com","perfectgirls.*","perfektdamen.*","pervertium.com","perverzija.com","petitestef.com","pherotruth.com","phoneswiki.com","picgiraffe.com","picjgfjet.shop","pictryhab.shop","picturelol.com","pimylifeup.com","pinchofyum.com","pink-sluts.net","pipandebby.com","pirate4all.com","pirateblue.com","pirateblue.net","pirateblue.org","piratemods.com","pivigames.blog","planetsuzy.org","platinmods.com","play-games.com","playcast.click","player-cdn.com","player.rtl2.de","player.sbnmp.*","playermeow.com","playertv24.com","playhydrax.com","playingmtg.com","podkontrola.pl","polskatimes.pl","pop-player.com","popno-tour.net","porconocer.com","porn0video.com","pornahegao.xyz","pornasians.pro","pornerbros.com","pornflixhd.com","porngames.club","pornharlot.net","pornhd720p.com","pornincest.net","pornissimo.org","pornktubes.net","pornodavid.com","pornodoido.com","pornofelix.com","pornofisch.com","pornojenny.net","pornoperra.com","pornopics.site","pornoreino.com","pornotommy.com","pornotrack.net","pornozebra.com","pornrabbit.com","pornrewind.com","pornsocket.com","porntrex.video","porntube15.com","porntubegf.com","pornvideoq.com","pornvintage.tv","portaldoaz.org","portalyaoi.com","poscitechs.lol","powerover.site","premierftp.com","prepostseo.com","pressemedie.dk","primagames.com","primemovies.pl","primevideo.com","proapkdown.com","pruefernavi.de","puppyleaks.com","purepeople.com","pussyspace.com","pussyspace.net","pussystate.com","put-locker.com","putingfilm.com","queerdiary.com","querofilmehd.*","quest4play.xyz","questloops.com","quotesopia.com","rabbitsfun.com","radiotimes.com","radiotunes.com","rahim-soft.com","ramblinfan.com","rankersadda.in","rapid-cloud.co","ravenscans.com","rbxscripts.net","realbbwsex.com","realgfporn.com","realmoasis.com","realmomsex.com","realsimple.com","record-bee.com","recordbate.com","redfaucet.site","rednowtube.com","redpornnow.com","redtubemov.com","reggiotoday.it","reisefrage.net","resortcams.com","revealname.com","reviersport.de","revivelink.com","richtoscan.com","riminitoday.it","ringelnatz.net","ripplehub.site","rlxtech24h.com","rmacsports.org","roadtrippin.fr","robbreport.com","rokuhentai.com","rollrivers.com","rollstroll.com","romaniasoft.ro","romhustler.org","royaledudes.io","rpmplay.online","rubyvidhub.com","rugbystreams.*","ruinmyweek.com","russland.jetzt","rusteensex.com","ruyashoujo.com","safefileku.com","safemodapk.com","samaysawara.in","sanfoundry.com","saratogian.com","sat.technology","sattaguess.com","saveshared.com","savevideo.tube","sciencebe21.in","scoreland.name","scrap-blog.com","screenflash.io","screenrant.com","scriptsomg.com","scriptsrbx.com","scriptzhub.com","section215.com","seeitworks.com","seekplayer.vip","seirsanduk.com","seksualios.com","selfhacked.com","serienstream.*","series2watch.*","seriesonline.*","seriesperu.com","seriesyonkis.*","serijehaha.com","severeporn.com","sex-empire.org","sex-movies.biz","sexcams-24.com","sexgamescc.com","sexgayplus.com","sextubedot.com","sextubefun.com","sextubeset.com","sexvideos.host","sexyaporno.com","sexybabes.club","sexybabesz.com","sexynakeds.com","sgvtribune.com","shadowverse.gg","shahid.mbc.net","sharedwebs.com","shazysport.pro","sheamateur.com","shegotass.info","sheikhmovies.*","shesfreaky.com","shinobijawi.id","shooshtime.com","shop123.com.tw","short-url.link","short-zero.com","shorterall.com","shrinkearn.com","shueisharaw.tv","shupirates.com","sieutamphim.me","siliconera.com","singjupost.com","sitarchive.com","sitemini.io.vn","siusalukis.com","skat-karten.de","slickdeals.net","slideshare.net","smartinhome.pl","smarttrend.xyz","smiechawatv.pl","smoothdraw.com","snhupenmen.com","solidfiles.com","soranews24.com","soundboards.gg","spaziogames.it","speedostream.*","speedynews.xyz","speisekarte.de","spiele.bild.de","spieletipps.de","spiritword.net","spoilerplus.tv","sporteurope.tv","sportsdark.com","sportsnaut.com","sportsonline.*","sportsurge.net","spy-x-family.*","stadelahly.net","stahnivideo.cz","standard.co.uk","stardewids.com","starzunion.com","stbemuiptv.com","steamverde.net","stireazilei.eu","storiesig.info","storyblack.com","stownrusis.com","stream2watch.*","streamecho.top","streamlord.com","streamruby.com","stripehype.com","studydhaba.com","studyfinds.org","subtitleone.cc","subtorrents1.*","sugarapron.com","super-games.cz","superanimes.in","suvvehicle.com","svetserialu.io","svetserialu.to","swatchseries.*","swordalada.org","tainhanhvn.com","talkceltic.net","talkjarvis.com","tamilnaadi.com","tamilprint29.*","tamilprint30.*","tamilprint31.*","tamilprinthd.*","taradinhos.com","tarnkappe.info","taschenhirn.de","tech-blogs.com","tech-story.net","techhelpbd.com","techiestalk.in","techkeshri.com","techmyntra.net","techperiod.com","techsignin.com","techsslash.com","tecnoaldia.net","tecnobillo.com","tecnoscann.com","tecnoyfoto.com","teenager365.to","teenextrem.com","teenhubxxx.com","teensexass.com","tekkenmods.com","telemagazyn.pl","telesrbija.com","temp.modpro.co","tennisactu.net","testserver.pro","textograto.com","textovisia.com","texturecan.com","theargus.co.uk","theavtimes.com","thefantazy.com","thefitchen.com","theflixertv.to","thehesgoal.com","themeslide.com","thenetnaija.co","thepiratebay.*","theporngod.com","therichest.com","thesextube.net","thetakeout.com","thethothub.com","thetimes.co.uk","thevideome.com","thewambugu.com","thotchicks.com","titsintops.com","tojimangas.com","tomshardware.*","topcartoons.tv","topsporter.net","topwebgirls.eu","torinotoday.it","tormalayalam.*","torontosun.com","torovalley.net","torrentmac.net","totalsportek.*","tournguide.com","tous-sports.ru","towerofgod.top","toyokeizai.net","tpornstars.com","trafficnews.jp","trancehost.com","trannyline.com","trashbytes.net","traumporno.com","treehugger.com","trendflatt.com","trentonian.com","trentotoday.it","tribunnews.com","tronxminer.com","truckscout24.*","tuberzporn.com","tubesafari.com","tubexxxone.com","tukangsapu.net","turbocloud.xyz","turkish123.com","tv-films.co.uk","tv.youtube.com","tvspielfilm.de","twincities.com","u123movies.com","ucfknights.com","uciteljica.net","uclabruins.com","ufreegames.com","uiuxsource.com","uktvplay.co.uk","unblocked.name","unblocksite.pw","uncpbraves.com","uncwsports.com","unionmanga.xyz","unlvrebels.com","uoflsports.com","uploadbank.com","uploadking.net","uploadmall.com","uploadraja.com","upnewsinfo.com","uptostream.com","urlbluemedia.*","usctrojans.com","usdtoreros.com","usersdrive.com","utepminers.com","uyduportal.net","v2movies.click","vavada5com.com","vbox7-mp3.info","vedamdigi.tech","vegamovies4u.*","vegamovvies.to","vestimage.site","video-seed.xyz","video1tube.com","videogamer.com","videolyrics.in","videos1002.com","videoseyred.in","videosgays.net","vidguardto.xyz","vidhidepre.com","vidhidevip.com","vidstreams.net","view.ceros.com","viewmature.com","vikistream.com","viralpedia.pro","visortecno.com","vmorecloud.com","voiceloves.com","voipreview.org","voltupload.com","voyeurblog.net","vulgarmilf.com","vviruslove.com","wantmature.com","warefree01.com","watch-series.*","watchasians.cc","watchomovies.*","watchpornx.com","watchseries1.*","watchseries9.*","wcoanimedub.tv","wcoanimesub.tv","wcoforever.net","weatherx.co.in","webseries.club","weihnachten.me","wellplated.com","wenxuecity.com","westmanga.info","wetteronline.*","whatfontis.com","whatismyip.com","whats-new.cyou","whatshowto.com","whodatdish.com","whoisnovel.com","wiacsports.com","wifi4games.com","windbreaker.me","wizhdsports.fi","wkutickets.com","wmubroncos.com","womennaked.net","wordpredia.com","world4ufree1.*","worldofbin.com","wort-suchen.de","worthcrete.com","wow-mature.com","wowxxxtube.com","wspolczesna.pl","wsucougars.com","www-y2mate.com","www.amazon.com","www.lenovo.com","www.reddit.com","www.tiktok.com","x2download.com","xanimeporn.com","xclusivejams.*","xdld.pages.dev","xerifetech.com","xfrenchies.com","xhamster46.com","xhofficial.com","xhomealone.com","xhwebsite2.com","xhwebsite5.com","xiaomi-miui.gr","xmegadrive.com","xnxxporn.video","xxx-videos.org","xxxbfvideo.net","xxxblowjob.pro","xxxdessert.com","xxxextreme.org","xxxtubedot.com","xxxtubezoo.com","xxxvideohd.net","xxxxselfie.com","xxxymovies.com","xxxyoungtv.com","yabaisub.cloud","yakisurume.com","yarnutopia.com","yelitzonpc.com","yomucomics.com","yottachess.com","youngbelle.net","youporngay.com","youtubetomp3.*","yoututosjeff.*","yuki0918kw.com","yumstories.com","yunakhaber.com","zazzybabes.com","zertalious.xyz","zippyshare.day","zona-leros.com","zonebourse.com","zooredtube.com","10hitmovies.com","123movies-org.*","123moviesfree.*","123moviesfun.is","18-teen-sex.com","18asiantube.com","18porncomic.com","18teen-tube.com","1direct-cloud.*","1vid1shar.space","2tamilprint.pro","3xamatorszex.hu","4allprograms.me","5masterzzz.site","6indianporn.com","a-z-animals.com","acedarspoon.com","admediaflex.com","adminreboot.com","adrianoluis.net","adrinolinks.com","advicefunda.com","adz7short.space","aeroxplorer.com","aflamsexnek.com","aflizmovies.com","agrarwetter.net","ai.hubtoday.app","aitoolsfree.org","alanyapower.com","aliezstream.pro","alldeepfake.ink","alldownplay.xyz","allotech-dz.com","allpussynow.com","alltechnerd.com","amazon-love.com","amritadrino.com","anallievent.com","androidapks.biz","androidsite.net","androjungle.com","anime-sanka.com","anime7.download","animedao.com.ru","animesexbar.com","animesultra.net","animexxxsex.com","antenasports.ru","aoashimanga.com","apfelpatient.de","apkmagic.com.ar","app.blubank.com","arabshentai.com","arcadepunks.com","archivebate.com","archiwumalle.pl","argio-logic.net","asia.5ivttv.vip","asiangaysex.net","asianhdplay.net","askcerebrum.com","astrumscans.xyz","atemporal.cloud","atleticalive.it","atresplayer.com","au-di-tions.com","auto-service.de","autoindustry.ro","automat.systems","automothink.com","averiecooks.com","avoiderrors.com","awdescargas.com","azcardinals.com","babesaround.com","babesinporn.com","babesxworld.com","badgehungry.com","bangpremier.com","baylorbears.com","bdsm-photos.com","bdsmkingdom.xyz","bdsmporntub.com","bdsmwaytube.com","beammeup.com.au","bedavahesap.org","beingmelody.com","bellezashot.com","bengalisite.com","bengalxpress.in","bentasker.co.uk","best-shopme.com","best18teens.com","bestialporn.com","beurettekeh.com","bgmateriali.com","bgmi32bitapk.in","bgsufalcons.com","bibliopanda.com","big12sports.com","bigboobs.com.es","bigtitslust.com","bike-urious.com","bintangplus.com","biologianet.com","blackavelic.com","blackpornhq.com","blacksexmix.com","blogenginee.com","blogpascher.com","blowxxxtube.com","bluebuddies.com","bluedrake42.com","bluemanhoop.com","bluemediafile.*","bluemedialink.*","bluemediaurls.*","bokepsin.in.net","bolly4umovies.*","bollydrive.rest","boobs-mania.com","boobsforfun.com","bookpraiser.com","boosterx.stream","boxingstream.me","boxingvideo.org","boyfriendtv.com","braziliannr.com","bresciatoday.it","brieffreunde.de","brother-usa.com","budgetbytes.com","buffsports.io>>","buffstreamz.com","buickforums.com","bulbagarden.net","bunkr-albums.io","burningseries.*","buzzheavier.com","cafedelites.com","camwhoreshd.com","camwhorespy.com","camwhorez.video","captionpost.com","carbonite.co.za","casutalaurei.ro","cataniatoday.it","catchthrust.net","cempakajaya.com","cerberusapp.com","chatropolis.com","cheatglobal.com","check-imei.info","cheese-cake.net","cherrynudes.com","chromeready.com","cieonline.co.uk","cinemakottaga.*","cineplus123.org","citibank.com.sg","ciudadgamer.com","claimclicks.com","claimcoins.site","classicoder.com","classifarms.com","cloud9obits.com","cloudnestra.com","code-source.net","codeitworld.com","codemystery.com","codeproject.com","coloringpage.eu","comicsporno.xxx","comoinstalar.me","compucalitv.com","computerbild.de","consoleroms.com","coromon.wiki.gg","cosplaynsfw.xyz","coursewikia.com","cpomagazine.com","cracking-dz.com","crackthemes.com","crazyashwin.com","crazydeals.live","creditsgoal.com","crunchyroll.com","crunchytech.net","cryptoearns.com","cta-fansite.com","cubbiescrib.com","cumshotlist.com","cutiecomics.com","cyberlynews.com","cybertechng.com","cyclingnews.com","cycraracing.com","daemonanime.net","daily-times.com","dailyangels.com","dailybreeze.com","dailycaller.com","dailycamera.com","dailyecho.co.uk","dailyknicks.com","dailymail.co.uk","dailymotion.com","dailypost.co.uk","dailystar.co.uk","dark-gaming.com","dawindycity.com","db-creation.net","dbupatriots.com","dbupatriots.org","deathonnews.com","decomaniacos.es","definitions.net","desbloqueador.*","descargas2020.*","desirenovel.com","desixxxtube.org","detikbangka.com","deutschsex.mobi","devopslanka.com","dhankasamaj.com","digimonzone.com","digiztechno.com","diminimalis.com","direct-cloud.me","dirtybadger.com","discoveryplus.*","diversanews.com","dlouha-videa.cz","dobleaccion.xyz","docs.google.com","dollarindex.org","domainwheel.com","donnaglamour.it","donnerwetter.de","dopomininfo.com","dota2freaks.com","dotadostube.com","downphanmem.com","drake-scans.com","drakerelays.org","drama-online.tv","dramanice.video","dreamcheeky.com","drinksmixer.com","driveplayer.net","droidmirror.com","dtbps3games.com","duplex-full.lol","eaglesnovel.com","easylinkref.com","ebaticalfel.com","editorsadda.com","edmontonsun.com","edumailfree.com","eksporimpor.com","elektrikmen.com","elpasotimes.com","elperiodico.com","embed.acast.com","embed.meomeo.pw","embedcanais.com","embedsports.top","embedstreams.me","emperorscan.com","empire-stream.*","engstreams.shop","enryucomics.com","erotikclub35.pw","esportsmonk.com","esportsnext.com","exactpay.online","exam-results.in","excelchamps.com","expedition33.gg","explorecams.com","explorosity.net","exporntoons.net","exposestrat.com","extrapetite.com","extratorrents.*","fabioambrosi.it","farmeramania.de","faselhd-watch.*","faucetbravo.fun","fcportables.com","fellowsfilm.com","femdomworld.com","femjoybabes.com","feral-heart.com","fidlarmusic.com","file-upload.net","file.gocmod.com","filehost9.com>>","filespayout.com","filmesonlinex.*","filmoviplex.com","filmy4wap.co.in","filmyzilla5.com","finalnews24.com","financebolo.com","financemonk.net","financewada.com","financeyogi.net","finanzfrage.net","findnewjobz.com","fingerprint.com","firmenwissen.de","fiveyardlab.com","fizzlefakten.de","flashsports.org","flordeloto.site","flyanimes.cloud","flygbussarna.se","folgenporno.com","foodandwine.com","footyhunter.lol","forex-yours.com","foxseotools.com","framedcooks.com","freebitcoin.win","freebnbcoin.com","freecardano.com","freecourse.tech","freecricket.net","freegames44.com","freemockups.org","freeomovie.info","freepornjpg.com","freepornsex.net","freethemesy.com","freevpshere.com","freewebcart.com","french-stream.*","fsportshd.xyz>>","ftsefutures.org","fu-12qjdjqh.lol","fu-c66heipu.lol","fu-hbr4fzp4.lol","fu-hjyo3jqu.lol","fu-l6d0ptc6.lol","fuckedporno.com","fuckingfast.net","fullfilmizle.cc","fullxxxporn.net","fun-squared.com","fztvseries.live","g-streaming.com","gadgetspidy.com","gadzetomania.pl","gamecopyworld.*","gameplayneo.com","gamersglobal.de","games.macon.com","games.word.tips","gamesaktuell.de","gamestorrents.*","gaming-fans.com","gaminginfos.com","gamingsmart.com","gamingvital.com","gartendialog.de","gayboystube.top","gaypornhdfree.*","gaypornlove.net","gaypornwave.com","gayvidsclub.com","gazetaprawna.pl","geiriadur.ac.uk","geissblog.koeln","gendatabase.com","georgiadogs.com","germanvibes.org","gesund-vital.de","getexploits.com","gewinnspiele.tv","gfx-station.com","girlssexxxx.com","givemeaporn.com","givemesport.com","glavmatures.com","globaldjmix.com","gocreighton.com","godairyfree.org","goexplorers.com","gofetishsex.com","gofile.download","gogoanime.co.in","goislanders.com","gokushiteki.com","golderotica.com","golfchannel.com","gomacsports.com","gomarquette.com","gopsusports.com","goxxxvideos.com","goyoungporn.com","gradehgplus.com","grandmatube.pro","grannyfucko.com","grasshopper.com","greattopten.com","grootnovels.com","gsmfirmware.net","gsmfreezone.com","gsmmessages.com","gut-erklaert.de","hacksnation.com","handypornos.net","hanimesubth.com","hardcoreluv.com","hardwareluxx.de","hardxxxmoms.com","harshfaucet.com","hd-analporn.com","hd-easyporn.com","hdjavonline.com","hds-streaming.*","hdstreamss.club","healthfatal.com","heavyfetish.com","heidelberg24.de","helicomicro.com","hentai-moon.com","hentai-senpai.*","hentai2read.com","hentaiarena.com","hentaibatch.com","hentaibooty.com","hentaicloud.com","hentaicovid.org","hentaifreak.org","hentaigames.app","hentaihaven.com","hentaihaven.red","hentaihaven.vip","hentaihaven.xxx","hentaiporno.xxx","hentaipulse.com","hentaitube1.lol","heroine-xxx.com","hertoolbelt.com","hesgoal-live.io","hiddencamhd.com","hindinews360.in","hokiesports.com","hollaforums.com","hollymoviehd.cc","hollywoodpq.com","honeyandlime.co","hookupnovel.com","hostserverz.com","hot-cartoon.com","hotgameplus.com","hotmediahub.com","hotpornfile.org","hotsexstory.xyz","hotstunners.com","hotxxxpussy.com","hqxxxmovies.com","hscprojects.com","hummusapien.com","hypicmodapk.org","iban-rechner.de","ibcomputing.com","ibeconomist.com","ideal-teens.com","ikramlar.online","ilbassoadige.it","ilgazzettino.it","illicoporno.com","ilmessaggero.it","ilovetoplay.xyz","ilsole24ore.com","imagelovers.com","imgqnnnebrf.sbs","incgrepacks.com","indiakablog.com","infrafandub.com","inside-handy.de","instabiosai.com","insuredhome.org","interracial.com","investcrust.com","inyatrust.co.in","iptvjournal.com","italianoxxx.com","itsonsitetv.com","iwantmature.com","januflix.expert","japangaysex.com","japansporno.com","japanxxxass.com","jastrzabpost.pl","jav-torrent.org","javcensored.net","javenglish.cc>>","javindosub.site","javmoviexxx.com","javpornfull.com","javraveclub.com","javteentube.com","javtrailers.com","jaysjournal.com","jessifearon.com","jetztspielen.de","jobslampung.net","johntryopen.com","jokerscores.com","juliasalbum.com","just-upload.com","kabarportal.com","karaoketexty.cz","kasvekuvvet.net","katmoviehd4.com","kattannonser.se","kawarthanow.com","keezmovies.surf","ketoconnect.net","ketubanjiwa.com","kickass-anime.*","kickassanime.ch","kiddyearner.com","kingsleynyc.com","kisshentaiz.com","kitabmarkaz.xyz","kittycatcam.com","kodewebsite.com","komikdewasa.art","komorkomania.pl","krakenfiles.com","kreiszeitung.de","krktcountry.com","kstorymedia.com","kurierverlag.de","kyoto-kanko.net","la123movies.org","langitmovie.com","laptechinfo.com","latinluchas.com","lavozdigital.es","ldoceonline.com","learnedclub.com","lecrabeinfo.net","legionscans.com","lendrive.web.id","lesbiansex.best","levante-emv.com","libertycity.net","librasol.com.br","liga3-online.de","lightsnovel.com","link.3dmili.com","link.asiaon.top","link.cgtips.org","link.codevn.net","linksheild.site","linkss.rcccn.in","linkvertise.com","linux-talks.com","live.arynews.tv","livesport24.net","livestreames.us","livestreamtv.pk","livexscores.com","livingathome.de","livornotoday.it","lombardiave.com","lookmoviess.com","looptorrent.org","lotusgamehd.xyz","lovelynudez.com","lovingsiren.com","luchaonline.com","lucrebem.com.br","lukesitturn.com","lulustream.live","lustesthd.cloud","lycee-maroc.com","macombdaily.com","macrotrends.net","magdownload.org","maisonbrico.com","mangahentai.xyz","mangahere.today","mangakakalot.gg","mangaonline.fun","mangaraw1001.cc","mangarawjp.asia","mangaromance.eu","mangarussia.com","manhuarmmtl.com","manhwahentai.me","manoramamax.com","mantrazscan.com","marie-claire.es","marimo-info.net","marketmovers.it","marvelrivals.gg","maskinbladet.dk","mastakongo.info","mathsstudio.com","mathstutor.life","maxcheaters.com","maxjizztube.com","maxstream.video","maxtubeporn.net","me-encantas.com","medeberiya.site","medeberiya1.com","medeberiyaa.com","medeberiyas.com","medeberiyax.com","mediacast.click","mega4upload.com","mega4upload.net","mejortorrento.*","mejortorrents.*","mejortorrentt.*","memoriadatv.com","mentalfloss.com","mercerbears.com","mercurynews.com","messinatoday.it","metal-hammer.de","milliyet.com.tr","miniminiplus.pl","minutolivre.com","mirrorpoi.my.id","mixrootmods.com","mmsmasala27.com","mobility.com.ng","mockuphunts.com","modporntube.com","moflix-stream.*","molbiotools.com","mommy-pussy.com","momtubeporn.xxx","motherporno.com","mov18plus.cloud","moviemaniak.com","movierulzfree.*","movierulzlink.*","movies2watch.tv","moviescounter.*","moviesonline.fm","moviessources.*","moviessquad.com","movieuniverse.*","mp3fromyou.tube","mrdeepfakes.com","mscdroidlabs.es","msdos-games.com","msonglyrics.com","msuspartans.com","muchohentai.com","multifaucet.org","musiclutter.xyz","musikexpress.de","mybestxtube.com","mydesiboobs.com","myfreeblack.com","mysexybabes.com","mywatchseries.*","myyoungbabe.com","mzansinudes.com","naijanowell.com","naijaray.com.ng","nakedbabes.club","nangiphotos.com","nativesurge.net","nativesurge.top","naughtyza.co.za","nbareplayhd.com","nbcolympics.com","necksdesign.com","needgayporn.com","nekopoicare.*>>","netflixlife.com","networkhint.com","news-herald.com","news-leader.com","newstechone.com","newyorkjets.com","nflspinzone.com","nicexxxtube.com","nizarstream.com","noindexscan.com","noithatmyphu.vn","nokiahacking.pl","nomnompaleo.com","nosteamgames.ro","notebookcheck.*","notesformsc.org","noteshacker.com","notunmovie.link","novelssites.com","nsbtmemoir.site","nsfwmonster.com","nsfwyoutube.com","nswdownload.com","nu6i-bg-net.com","nudeslegion.com","nudismteens.com","nukedpacks.site","nullscripts.net","nursexfilme.com","nutmegnanny.com","nyaatorrent.com","oceanofmovies.*","ohmirevista.com","okiemrolnika.pl","olamovies.store","olympustaff.com","omgexploits.com","online-smss.com","onlinekosten.de","open3dmodel.com","openculture.com","openloading.com","order-order.com","orgasmatrix.com","oromedicine.com","otokukensaku.jp","otomi-games.com","ourcoincash.xyz","oyundunyasi.net","ozulscansen.com","pacersports.com","pageflutter.com","pakkotoisto.com","palermotoday.it","panda-novel.com","pandamovies.org","pandasnovel.com","paperzonevn.com","pawastreams.org","pawastreams.pro","pcgameszone.com","peliculas8k.com","peliculasmx.net","pelisflix20.*>>","pelismarthd.com","pelisxporno.net","pendekarsubs.us","pepperlive.info","perezhilton.com","perfektdamen.co","persianhive.com","perugiatoday.it","pewresearch.org","pflege-info.net","phonerotica.com","phongroblox.com","phpscripttr.com","pianetalecce.it","pics4upload.com","picxnkjkhdf.sbs","pimpandhost.com","pinoyalbums.com","pinoyrecipe.net","piratehaven.xyz","pisshamster.com","pixdfdjkkr.shop","pixkfjtrkf.shop","planetfools.com","platinporno.com","play.hbomax.com","player.msmini.*","plugincrack.com","pocket-lint.com","popcornstream.*","popdaily.com.tw","porhubvideo.com","porn-monkey.com","pornexpanse.com","pornfactors.com","porngameshd.com","pornhegemon.com","pornhoarder.net","porninblack.com","porno-porno.net","porno-rolik.com","pornohammer.com","pornohirsch.net","pornoklinge.com","pornomanoir.com","pornrusskoe.com","portable4pc.com","powergam.online","premiumporn.org","privatemoviez.*","projectfreetv.*","promimedien.com","prouddogmom.com","proxydocker.com","punishworld.com","purelyceleb.com","pussy3dporn.com","pussyhothub.com","qatarstreams.me","quiltfusion.com","quotesshine.com","r1.richtoon.top","rackusreads.com","radionatale.com","radionylive.com","radiorockon.com","railwebcams.net","rajssoid.online","rangerboard.com","ravennatoday.it","rctechsworld.in","readbitcoin.org","readhunters.xyz","readingpage.fun","redpornblog.com","remodelista.com","rennrad-news.de","renoconcrete.ca","rentbyowner.com","reportera.co.kr","restegourmet.de","retroporn.world","risingapple.com","ritacandida.com","robot-forum.com","rojadirectatv.*","rollingstone.de","romaierioggi.it","romfirmware.com","root-nation.com","route-fifty.com","rule34vault.com","runnersworld.de","rushuploads.com","ryansharich.com","saabcentral.com","salernotoday.it","samapkstore.com","sampledrive.org","samuraiscan.com","samuraiscan.org","santhoshrcf.com","satoshi-win.xyz","savealoonie.com","scatnetwork.com","schwaebische.de","sdmoviespoint.*","sekaikomik.live","serienstream.to","seriesmetro.net","seriesonline.sx","seriouseats.com","serverbd247.com","serviceemmc.com","setfucktube.com","sex-torrent.net","sexanimesex.com","sexoverdose.com","sexseeimage.com","sexwebvideo.com","sexxxanimal.com","sexy-parade.com","sexyerotica.net","seznamzpravy.cz","sfmcompile.club","shadagetech.com","shadowrangers.*","sharegdrive.com","sharinghubs.com","shemalegape.net","shomareh-yab.ir","shopkensaku.com","short-jambo.ink","showcamrips.com","showrovblog.com","shrugemojis.com","shugraithou.com","siamfishing.com","sieutamphim.org","singingdalong.*","siriusfiles.com","sitetorrent.com","sivackidrum.net","skinnytaste.com","slapthesign.com","sleazedepot.com","sleazyneasy.com","smartcharts.net","sms-anonyme.net","sms-receive.net","smsonline.cloud","smumustangs.com","soconsports.com","software-on.com","softwaresde.com","solarchaine.com","sommerporno.com","sondriotoday.it","souq-design.com","sourceforge.net","spanishdict.com","spardhanews.com","sport890.com.uy","sports-stream.*","sportsblend.net","sportsonline.si","sportsonline.so","sportsplays.com","sportsseoul.com","sportstiger.com","sportstreamtv.*","starstreams.pro","start-to-run.be","stbemuiptvn.com","sterkinekor.com","stream.bunkr.ru","streamnoads.com","stronakobiet.pl","studybullet.com","subtitlecat.com","sueddeutsche.de","suicidepics.com","sullacollina.it","sumirekeiba.com","suneelkevat.com","superdeporte.es","superembeds.com","supermarches.ca","supermovies.org","svethardware.cz","swift4claim.com","syracusefan.com","tabooanime.club","tagesspiegel.de","tamilanzone.com","tamilultra.team","tapeantiads.com","tapeblocker.com","team-octavi.com","techacrobat.com","techadvisor.com","techastuces.com","techedubyte.com","techinferno.com","technichero.com","technorozen.com","techoreview.com","techprakash.com","techsbucket.com","techyhigher.com","techymedies.com","tedenglish.site","teen-hd-sex.com","teenfucksex.com","teenpornjpg.com","teensextube.xxx","teenxxxporn.pro","telegraph.co.uk","telepisodes.org","temporeale.info","tenbaiquest.com","tenies-online.*","tennisonline.me","tennisstreams.*","teracourses.com","texassports.com","textreverse.com","thaiairways.com","the-mystery.org","the2seasons.com","the5krunner.com","theappstore.org","thebarchive.com","thebigblogs.com","theclashify.com","thedilyblog.com","thejetpress.com","thejoblives.com","themoviesflix.*","theprovince.com","thereporter.com","thestreameast.*","thetoneking.com","theusaposts.com","thewebflash.com","theyarehuge.com","thingiverse.com","thingstomen.com","thisisrussia.io","thueringen24.de","thumpertalk.com","ticketmaster.sg","tickhosting.com","ticonsiglio.com","tieba.baidu.com","tienganhedu.com","tires.costco.ca","today-obits.com","todopolicia.com","toeflgratis.com","tokyomotion.com","tokyomotion.net","toledoblade.com","topnewsshow.com","topperpoint.com","topstarnews.net","torascripts.org","tornadomovies.*","torrentgalaxy.*","torrentgame.org","torrentstatus.*","torresette.news","tradingview.com","transfermarkt.*","trendohunts.com","trevisotoday.it","triesteprima.it","true-gaming.net","trytutorial.com","tubegaytube.com","tubepornnow.com","tudongnghia.com","tuktukcinma.com","turbovidhls.com","turkeymenus.com","tusachmanga.com","tvanouvelles.ca","tvsportslive.fr","twistedporn.com","tyler-brown.com","u6lyxl0w.skin>>","ukathletics.com","ukaudiomart.com","ultramovies.org","undeniable.info","underhentai.net","unipanthers.com","updateroj24.com","uploadbeast.com","uploadcloud.pro","usaudiomart.com","user.guancha.cn","vectogravic.com","veekyforums.com","vegamovies3.org","veneziatoday.it","verpelis.gratis","veryfuntime.com","verywellfit.com","vfxdownload.net","vibezhub.com.ng","vicenzatoday.it","viciante.com.br","vidcloudpng.com","video.genyt.net","videodidixx.com","videosputas.xxx","vidsrc-embed.ru","vik1ngfile.site","ville-ideale.fr","viralharami.com","viralxvideos.es","voyageforum.com","vtplayer.online","wantedbabes.com","warmteensex.com","watch-my-gf.com","watch.sling.com","watchf1full.com","watchfreexxx.pw","watchhentai.net","watchmovieshd.*","watchporn4k.com","watchpornfree.*","watchseries8.to","watchserieshd.*","watchtvseries.*","watchxxxfree.pw","webmatrices.com","webnovelpub.com","webtoonscan.com","wegotcookies.co","welovemanga.one","weltfussball.at","wemakesites.net","wheelofgold.com","wholenotism.com","wholevideos.com","wieistmeineip.*","wikijankari.com","wikipooster.com","wikisharing.com","windowslite.net","windsorstar.com","witcherhour.com","womenshealth.de","worldgyan18.com","worldofiptv.com","worldsports.*>>","wowpornlist.xyz","wowyoungsex.com","wpgdadatong.com","wristreview.com","writeprofit.org","www.youtube.com","xfuckonline.com","xhardhempus.net","xianzhenyuan.cn","xiaomitools.com","xkeezmovies.com","xmoviesforyou.*","xn--31byd1i.net","xnudevideos.com","xnxxhamster.net","xxxindianporn.*","xxxparodyhd.net","xxxpornmilf.com","xxxtubegain.com","xxxtubenote.com","xxxtubepass.com","xxxwebdlxxx.top","yanksgoyard.com","yazilidayim.net","yesmovies123.me","yeutienganh.com","yogablogfit.com","yomoviesnow.com","yorkpress.co.uk","youlikeboys.com","youmedemblik.nl","young-pussy.com","youranshare.com","yourporngod.com","youtubekids.com","yrtourguide.com","ytconverter.app","yuramanga.my.id","zeroradio.co.uk","zonavideosx.com","zone-annuaire.*","zoominar.online","007stockchat.com","123movies-free.*","18-teen-porn.com","18-teen-tube.com","18adultgames.com","18comic-gquu.vip","1movielinkbd.com","1movierulzhd.pro","24pornvideos.com","2kspecialist.net","4fingermusic.com","8-ball-magic.com","9now.nine.com.au","about-drinks.com","acouplecooks.com","activevoyeur.com","activistpost.com","actresstoday.com","adblockstrtape.*","adblockstrtech.*","adult-empire.com","adultoffline.com","adultporn.com.es","advertafrica.net","agedtubeporn.com","aghasolution.com","aheadofthyme.com","ajaxshowtime.com","ajkalerbarta.com","alleveilingen.be","alleveilingen.nl","alliptvlinks.com","allporncomic.com","alphagames4u.com","alphapolis.co.jp","alphasource.site","altselection.com","anakteknik.co.id","analsexstars.com","analxxxvideo.com","androidadult.com","androidfacil.org","androidgreek.com","androidspill.com","anime-odcinki.pl","animesexclip.com","animetwixtor.com","animixstream.com","antennasports.ru","aopathletics.org","apkandroidhub.in","app.simracing.gp","applediagram.com","aquariumgays.com","arezzonotizie.it","articlesmania.me","asianmassage.xyz","asianpornjav.com","assettoworld.com","asyaanimeleri.pw","atlantisscan.com","auburntigers.com","audiofanzine.com","audycje.tokfm.pl","autotrader.co.uk","avellinotoday.it","azamericasat.net","azby.fmworld.net","baby-vornamen.de","backfirstwo.site","backyardboss.net","backyardpapa.com","bangyourwife.com","barbarabakes.com","barrier-free.net","bcuathletics.com","beaddiagrams.com","beritabangka.com","berlin-teltow.de","bestasiansex.pro","bestblackgay.com","bestcash2020.com","bestgamehack.top","bestgrannies.com","besthdmovies.com","bestpornflix.com","bestsextoons.com","biblegateway.com","bigbuttshub2.top","bikeportland.org","bisceglielive.it","bitchesgirls.com","blackandteal.com","blog.livedoor.jp","blowjobfucks.com","bloxinformer.com","bloxyscripts.com","bluemediafiles.*","bluerabbitrx.com","bmw-scooters.com","boardingarea.com","boerse-online.de","bollywoodfilma.*","bondagevalley.cc","booksbybunny.com","boolwowgirls.com","bootstrample.com","bostonherald.com","boysxclusive.com","brandbrief.co.kr","bravoerotica.com","bravoerotica.net","breatheheavy.com","breedingmoms.com","buffalobills.com","buffalowdown.com","businesstrend.jp","butlersports.com","butterpolish.com","call2friends.com","caminspector.net","campusfrance.org","camvideoshub.com","camwhoresbay.com","caneswarning.com","cartoonporno.xxx","catmovie.website","ccnworldtech.com","celtadigital.com","cervezaporno.com","championdrive.co","charexempire.com","chattanoogan.com","cheatography.com","chelsea24news.pl","chicagobears.com","chieflyoffer.com","choiceofmods.com","chubbyelders.com","cizzyscripts.com","claimsatoshi.xyz","clever-tanken.de","clickforhire.com","clickndownload.*","clipconverter.cc","cloudgallery.net","cmumavericks.com","coin-profits.xyz","collegehdsex.com","colliersnews.com","coloredmanga.com","comeletspray.com","cometogliere.com","comicspornos.com","comicspornow.com","comicsvalley.com","computerpedia.in","convert2mp3.club","convertinmp4.com","cookincanuck.com","courseleader.net","cr7-soccer.store","cracksports.me>>","criptologico.com","cryptoclicks.net","cryptofactss.com","cryptofaucet.xyz","cryptokinews.com","cryptomonitor.in","culinaryhill.com","cybercityhelp.in","cyberstumble.com","cyclingabout.com","cydiasources.net","dailyboulder.com","dailypudding.com","dailytips247.com","dailyuploads.net","darknessporn.com","darkwanderer.net","dasgelbeblatt.de","dataunlocker.com","dattebayo-br.com","davewigstone.com","dayoftheweek.org","daytonflyers.com","ddl-francais.com","deepfakeporn.net","deepswapnude.com","demonicscans.org","designparty.sx>>","destiny2zone.com","detroitlions.com","diariodeibiza.es","dirtytubemix.com","discoveryplus.in","djremixganna.com","doanhnghiepvn.vn","dobrapogoda24.pl","dobreprogramy.pl","donghuaworld.com","dorsetecho.co.uk","downloadapk.info","downloadbatch.me","downloadsite.org","downloadsoft.net","dpscomputing.com","drummagazine.com","dryscalpgone.com","dualshockers.com","duplichecker.com","dvdgayonline.com","earncrypto.co.in","eartheclipse.com","eastbaytimes.com","easyexploits.com","easymilftube.net","ebook-hunter.org","ecom.wixapps.net","edufileshare.com","einfachschoen.me","eleceedmanhwa.me","eletronicabr.com","elevationmap.net","eliobenedetto.it","embedseek.online","embedstreams.top","empire-anime.com","emulatorsite.com","english101.co.za","erotichunter.com","eslauthority.com","esportstales.com","everysextube.com","ewrc-results.com","exclusivomen.com","fallbrook247.com","familyminded.com","familyporner.com","famousnipple.com","fastdownload.top","fattelodasolo.it","fatwhitebutt.com","faucetcrypto.com","faucetcrypto.net","favefreeporn.com","favoyeurtube.net","feedmephoebe.com","fernsehserien.de","fessesdenfer.com","fetishshrine.com","filespayouts.com","filmestorrent.tv","filmyhitlink.xyz","filmyhitt.com.in","financacerta.com","fineasiansex.com","finofilipino.org","fitnessholic.net","fitnessscenz.com","flatpanelshd.com","footwearnews.com","footymercato.com","footystreams.net","foreverquote.xyz","forexcracked.com","forextrader.site","forgepattern.net","forum-xiaomi.com","foxsports.com.au","freegetcoins.com","freehardcore.com","freehdvideos.xxx","freelitecoin.vip","freemcserver.net","freemomstube.com","freemoviesu4.com","freeporncave.com","freevstplugins.*","freshersgold.com","fullxcinema1.com","fullxxxmovies.me","fumettologica.it","fussballdaten.de","gadgetxplore.com","gamemodsbase.com","gamers-haven.org","games.boston.com","games.kansas.com","games.modbee.com","games.puzzles.ca","games.sacbee.com","games.sltrib.com","games.usnews.com","gamesrepacks.com","gamingbeasts.com","gamingdeputy.com","gaminglariat.com","ganstamovies.com","garminrumors.com","gartenlexikon.de","gaydelicious.com","gazetalubuska.pl","gbmwolverine.com","gdrivelatino.net","gdrivemovies.xyz","gemiadamlari.org","genialetricks.de","gentlewasher.com","getdatgadget.com","getdogecoins.com","getfreecourses.*","getworkation.com","gezegenforum.com","ghettopearls.com","ghostsfreaks.com","gidplayer.online","globelempire.com","go.discovery.com","go.shortnest.com","goblackbears.com","godstoryinfo.com","goetbutigers.com","gogetadoslinks.*","gomcpanthers.com","gometrostate.com","goodyoungsex.com","gophersports.com","gopornindian.com","gourmetscans.net","greasygaming.com","greenarrowtv.com","gruene-zitate.de","gruporafa.com.br","gsm-solution.com","gtamaxprofit.com","guncelkaynak.com","gutesexfilme.com","hadakanonude.com","handelsblatt.com","happyinshape.com","hard-tubesex.com","hardfacefuck.com","hausbau-forum.de","hayatarehber.com","hd-tube-porn.com","healthylifez.com","heilpraxisnet.de","helpdeskgeek.com","hentaicomics.pro","hentaiseason.com","hentaistream.com","hentaivideos.net","homemadehome.com","hotcopper.com.au","hotdreamsxxx.com","hotpornyoung.com","hotpussyhubs.com","houstonpress.com","howsweeteats.com","hqpornstream.com","huskercorner.com","id.condenast.com","idmextension.xyz","ielts-isa.edu.vn","ignoustudhelp.in","ikindlebooks.com","imagereviser.com","imageshimage.com","imagetotext.info","imperiofilmes.co","indexsubtitle.cc","infinityfree.com","infomatricula.pt","inprogrammer.com","inspiralized.com","intellischool.id","interviewgig.com","investopedia.com","investorveda.com","isekaibrasil.com","isekaipalace.com","jalshamoviezhd.*","japaneseasmr.com","japanesefuck.com","japanfuck.com.es","javenspanish.com","javfullmovie.com","julieblanner.com","justblogbaby.com","justswallows.net","kakarotfoot.ru>>","katiescucina.com","kayifamilytv.com","khatrimazafull.*","kimscravings.com","kingdomfiles.com","kingstreamz.site","kireicosplay.com","kitchendivas.com","kitchennovel.com","kitraskimisi.com","knowyourmeme.com","kodibeginner.com","kokosovoulje.com","komikstation.com","komputerswiat.pl","kshowsubindo.org","kstatesports.com","ksuathletics.com","kurakura21.space","kuttymovies1.com","lakeshowlife.com","lampungkerja.com","larvelfaucet.com","lascelebrite.com","latesthdmovies.*","latinohentai.com","laurafuentes.com","lavanguardia.com","lawyercontact.us","lectormangaa.com","leechpremium.net","legionjuegos.org","lehighsports.com","lesbiantube.club","letmewatchthis.*","levelupalone.com","lg-firmwares.com","libramemoria.com","lifesurance.info","lightxxxtube.com","limetorrents.lol","linux-magazin.de","linuxexplain.com","live.vodafone.de","livenewsflix.com","logofootball.net","lookmovie.studio","loudountimes.com","ltpcalculator.in","luminatedata.com","lumpiastudio.com","lustaufsleben.at","lustesthd.makeup","macrocreator.com","magicseaweed.com","mahobeachcam.com","mammaebambini.it","manga-scantrad.*","mangacanblog.com","mangaforfree.com","mangaindo.web.id","marcandangel.com","markstyleall.com","masstamilans.com","mastaklomods.com","masterplayer.xyz","matshortener.xyz","mature-tube.sexy","maxisciences.com","meconomynews.com","medievalists.net","mee-6zeqsgv2.com","mee-cccdoz45.com","mee-dp6h8dp2.com","mee-s9o6p31p.com","meetdownload.com","megafilmeshd20.*","megajapansex.com","mejortorrents1.*","merlinshoujo.com","meteoetradar.com","milanreports.com","milfxxxpussy.com","milkporntube.com","mlookalporno.com","mockupgratis.com","mockupplanet.com","moto-station.com","mountaineast.org","movielinkhub.xyz","movierulz2free.*","movierulzwatch.*","movieshdwatch.to","movieshubweb.com","moviesnipipay.me","moviesrulzfree.*","moviestowatch.tv","mrproblogger.com","msmorristown.com","msumavericks.com","multimovies.tech","musiker-board.de","my-ford-focus.de","myair.resmed.com","mycivillinks.com","mydownloadtube.*","myfitnesspal.com","mylegalporno.com","mylivestream.pro","mymotherlode.com","myproplugins.com","myradioonline.pl","nakedbbw-sex.com","naruldonghua.com","nationalpost.com","nativesurge.info","nauathletics.com","naughtyblogs.xyz","neatfreeporn.com","neatpornodot.com","netflixporno.net","netizensbuzz.com","netu.frembed.lol","newanimeporn.com","newsinlevels.com","newsobserver.com","newstvonline.com","nghetruyenma.net","nguyenvanbao.com","nhentaihaven.org","niftyfutures.org","nintendolife.com","nl.hardware.info","nocrumbsleft.net","nocsummer.com.br","nonesnanking.com","notebookchat.com","notiziemusica.it","novablogitalia.*","nude-teen-18.com","nudemomshots.com","null-scripts.net","officecoach24.de","ohionowcast.info","olalivehdplay.ru","older-mature.net","oldgirlsporn.com","onestringlab.com","onlineporn24.com","onlygangbang.com","onlygayvideo.com","onlyindianporn.*","open.spotify.com","openloadmovies.*","optimizepics.com","oranhightech.com","orenoraresne.com","oswegolakers.com","otakuanimess.net","oxfordmail.co.uk","pagalworld.video","pandaatlanta.com","pandafreegames.*","parentcircle.com","parking-map.info","pawastreams.info","pdfstandards.net","pedroinnecco.com","penis-bilder.com","personefamose.it","phinphanatic.com","physics101.co.za","pigeonburger.xyz","pinsexygirls.com","play.gamezop.com","play.history.com","player.gayfor.us","player.hdgay.net","player.pop.co.uk","player4me.online","playsexgames.xxx","pleasuregirl.net","plumperstube.com","plumpxxxtube.com","pokeca-chart.com","police.community","ponselharian.com","porn-hd-tube.com","pornclassic.tube","pornclipshub.com","pornforrelax.com","porngayclips.com","pornhub-teen.com","pornobengala.com","pornoborshch.com","pornoteensex.com","pornsex-pics.com","pornstargold.com","pornuploaded.net","pornvideotop.com","pornwatchers.com","pornxxxplace.com","pornxxxxtube.net","portnywebcam.com","post-gazette.com","postermockup.com","powerover.site>>","practicequiz.com","prajwaldesai.com","praveeneditz.com","privatenudes.com","programme-tv.net","programsolve.com","prosiebenmaxx.de","purduesports.com","purposegames.com","puzzles.nola.com","pythonjobshq.com","qrcodemonkey.net","rabbitstream.net","radio-deejay.com","realityblurb.com","realjapansex.com","receptyonline.cz","recordonline.com","redbirdrants.com","rendimentibtp.it","repack-games.com","reportbangla.com","reviewmedium.com","ribbelmonster.de","rimworldbase.com","ringsidenews.com","ripplestream4u.*","riwayat-word.com","rollingstone.com","royale-games.com","rule34hentai.net","rv-ecommerce.com","sabishiidesu.com","safehomefarm.com","sainsburys.co.uk","sandandsisal.com","saradahentai.com","sarugbymag.co.za","satoshifaucet.io","savethevideo.com","savingadvice.com","schaken-mods.com","schildempire.com","schoolcheats.net","search.brave.com","seattletimes.com","secretsdujeu.com","semuanyabola.com","sensualgirls.org","serienjunkies.de","serieslandia.com","sesso-escort.com","sexanimetube.com","sexfilmkiste.com","sexflashgame.org","sexhardtubes.com","sexjapantube.com","sexlargetube.com","sexmomvideos.com","sexontheboat.xyz","sexpornasian.com","sextingforum.net","sexybabesart.com","sexyoungtube.com","sharelink-1.site","sheepesports.com","shelovesporn.com","shemalemovies.us","shemalepower.xyz","shemalestube.com","shimauma-log.com","shoot-yalla.live","short.croclix.me","shortenlinks.top","shortylink.store","showbizbites.com","shrinkforearn.in","shrinklinker.com","signupgenius.com","sikkenscolore.it","simpleflying.com","simplyvoyage.com","sitesunblocked.*","skidrowcodex.net","skidrowcrack.com","skintagsgone.com","smallseotools.ai","smart-wohnen.net","smartermuver.com","smashyplayer.top","soccershoes.blog","softwaresite.net","solution-hub.com","soonersports.com","soundpark-club.*","southpark.cc.com","soyoungteens.com","space-faucet.com","spigotunlocked.*","splinternews.com","sportpiacenza.it","sportshub.stream","sportsloverz.xyz","sportstream.live","spotifylists.com","sshconect.com.br","sssinstagram.com","stablerarena.com","stagatvfiles.com","stiflersmoms.com","stileproject.com","stillcurtain.com","stockhideout.com","stopstreamtv.net","storieswatch.com","stream.nflbox.me","stream4free.live","streamblasters.*","streamcenter.xyz","streamextreme.cc","streamingnow.mov","streamingworld.*","streamloverx.com","strefabiznesu.pl","strtapeadblock.*","suamusica.com.br","sukidesuost.info","sunshine-live.de","supremebabes.com","swiftuploads.com","sxmislandcam.com","synoniemboek.com","tamarindoyam.com","tapelovesads.org","taroot-rangi.com","teachmemicro.com","techgeek.digital","techkhulasha.com","technewslive.org","tecnotutoshd.net","teensexvideos.me","telcoinfo.online","telegratuita.com","text-compare.com","the1security.com","thebakermama.com","thecozyapron.com","thecustomrom.com","thefappening.pro","thegadgetking.in","thehiddenbay.com","theinventory.com","thejobsmovie.com","thelandryhat.com","thelosmovies.com","thelovenerds.com","thematurexxx.com","thenewcamera.com","thenewsdrill.com","thenewsglobe.net","thenextplanet1.*","theorie-musik.de","thepiratebay.org","thepoorcoder.com","thescranline.com","thesportster.com","thesportsupa.com","thestonesoup.com","thesundevils.com","thetrendverse.in","thevikingage.com","thisisfutbol.com","timesnownews.com","timesofindia.com","tires.costco.com","tiroalpaloes.com","tiroalpaloes.net","titansonline.com","tnstudycorner.in","todays-obits.com","todoandroid.live","tonanmedia.my.id","topvideosgay.com","toramemoblog.com","torrentkitty.one","totallyfuzzy.net","totalsportek.app","toureiffel.paris","towsontigers.com","tptvencore.co.uk","tradersunion.com","travel.vebma.com","travelerdoor.com","trendytalker.com","troyyourlead.com","trucosonline.com","truetrophies.com","truevpnlover.com","tube-teen-18.com","tube.shegods.com","tuotromedico.com","turbogvideos.com","turboplayers.xyz","turtleviplay.xyz","tutorialsaya.com","tweakcentral.net","twobluescans.com","typinggames.zone","uconnhuskies.com","unionpayintl.com","universegunz.net","unrealengine.com","upfiles-urls.com","urlgalleries.net","ustrendynews.com","uvmathletics.com","uwlathletics.com","vancouversun.com","vandaaginside.nl","vegamoviese.blog","veryfreeporn.com","verywellmind.com","vichitrainfo.com","videocdnal24.xyz","videodotados.com","videosection.com","vidstreaming.xyz","vikingf1le.us.to","villettt.kitchen","vinstartheme.com","viralvideotube.*","viralxxxporn.com","vivrebordeaux.fr","vodkapr3mium.com","voiranime.stream","voyeurfrance.net","voyeurxxxsex.com","vpshostplans.com","vrporngalaxy.com","vzrosliedamy.com","watchanime.video","watchfreekav.com","watchfreexxx.net","watchmovierulz.*","watchmovies2.com","wbschemenews.com","wearehunger.site","web.facebook.com","webcamsdolls.com","webcheats.com.br","webdesigndev.com","webdeyazilim.com","weblivehdplay.ru","webseriessex.com","websitesball.com","werkzeug-news.de","whentostream.com","whipperberry.com","whitexxxtube.com","wildpictures.net","windowsonarm.org","wolfgame-ar.site","womenreality.com","wonderfuldiy.com","woodmagazine.com","workxvacation.jp","worldhistory.org","wrestlinginc.com","wrzesnia.info.pl","wunderground.com","wvuathletics.com","www.amazon.co.jp","www.amazon.co.uk","www.facebook.com","xhamster-art.com","xhamsterporno.mx","xhamsterteen.com","xxxanimefuck.com","xxxlargeporn.com","xxxlesvianas.com","xxxretrofuck.com","xxxteenyporn.com","xxxvideos247.com","yellowbridge.com","yesjavplease.fun","yona-yethu.co.za","youngerporn.mobi","youtubetoany.com","youtubetowav.net","youwatch.monster","youwatchporn.com","ysokuhou.blog.jp","zdravenportal.eu","zecchino-doro.it","ziggogratis.site","ziminvestors.com","ziontutorial.com","zippyshare.cloud","zwergenstadt.com","123moviesonline.*","123strippoker.com","12thmanrising.com","1337x.unblocked.*","1337x.unblockit.*","19-days-manga.com","1movierulzhd.hair","1movierulzhd.wiki","1teentubeporn.com","2japaneseporn.com","365cincinnati.com","acapellas4u.co.uk","acdriftingpro.com","adblockplustape.*","alaskananooks.com","allcelebspics.com","alternativeto.net","altyazitube22.lat","amandascookin.com","amateur-twink.com","amateurfapper.com","amsmotoresllc.com","amybakesbread.com","ancient-origins.*","andhrafriends.com","andrewzimmern.com","androidonepro.com","androidpolice.com","animalwebcams.net","anime-torrent.com","animecenterbr.com","animeidhentai.com","animelatinohd.com","animeonline.ninja","animepornfilm.com","animesonlinecc.us","animexxxfilms.com","anonymousemail.me","apostoliclive.com","arabshentai.com>>","arcade.lemonde.fr","armypowerinfo.com","asianfucktube.com","asiansexcilps.com","assignmentdon.com","atalantini.online","atlasandboots.com","autoexpress.co.uk","babyjimaditya.com","badassoftcore.com","badgerofhonor.com","bafoeg-aktuell.de","bakedbyrachel.com","bandyforbundet.no","bargainbriana.com","bcanotesnepal.com","beargoggleson.com","bebasbokep.online","beritasulteng.com","bestanime-xxx.com","besthdgayporn.com","besthugecocks.com","bestloanoffer.net","bestpussypics.net","beyondtheflag.com","bgmiupdate.com.in","bigdickwishes.com","bigtitsxxxsex.com","black-matures.com","blackhatworld.com","bladesalvador.com","blizzboygames.net","blog.linksfire.co","blog.textpage.xyz","blogcreativos.com","blogtruyenmoi.com","bollywoodchamp.in","bostoncommons.net","bracontece.com.br","bradleybraves.com","brazzersbabes.com","brindisireport.it","brokensilenze.net","brookethoughi.com","browncrossing.net","brushednickel.biz","butterbeready.com","cadryskitchen.com","calgaryherald.com","camchickscaps.com","cameronaggies.com","candyteenporn.com","catatanonline.com","cavalierstream.fr","cdn.gledaitv.live","celebritablog.com","charbelnemnom.com","chat.tchatche.com","cheat.hax4you.net","checkfiletype.com","chicksonright.com","cindyeyefinal.com","cinecalidad5.site","cinema-sketch.com","citethisforme.com","citpekalongan.com","ciudadblogger.com","claplivehdplay.ru","classicreload.com","clickjogos.com.br","closetcooking.com","cloudhostingz.com","coatingsworld.com","codingshiksha.com","coempregos.com.br","compota-soft.work","computercrack.com","computerfrage.net","computerhilfen.de","comunidadgzone.es","conferenceusa.com","consoletarget.com","cookieandkate.com","cookiewebplay.xyz","cookingclassy.com","cool-style.com.tw","coolmathgames.com","crichd-player.top","cruisingearth.com","cryptednews.space","cryptoblog24.info","cryptowidgets.net","crystalcomics.com","curiosidadtop.com","daemon-hentai.com","dailybulletin.com","dailydemocrat.com","dailyfreebits.com","dailygeekshow.com","dailytech-news.eu","dallascowboys.com","damndelicious.net","darts-scoring.com","dawnofthedawg.com","dealsfinders.blog","dearcreatives.com","deine-tierwelt.de","deinesexfilme.com","dejongeturken.com","denverbroncos.com","descarga-animex.*","design4months.com","designtagebuch.de","desitelugusex.com","developer.arm.com","diamondfansub.com","diaridegirona.cat","diariocordoba.com","diencobacninh.com","dirtyindianporn.*","dl.apkmoddone.com","doctor-groups.com","dorohedoro.online","downloadapps.info","downloadtanku.org","downloadudemy.com","downloadwella.com","dynastyseries.com","dzienniklodzki.pl","e-hausaufgaben.de","earninginwork.com","easyjapanesee.com","easyvidplayer.com","easywithcode.tech","eatingonadime.com","eatlittlebird.com","ebonyassclips.com","eczpastpapers.net","editions-actu.org","einfachtitten.com","elamigosgames.org","elamigosgamez.com","elamigosgamez.net","empire-streamz.fr","emulatorgames.net","encurtandourl.com","encurtareidog.top","engel-horoskop.de","enormousbabes.net","entertubeporn.com","epsilonakdemy.com","eromanga-show.com","estrepublicain.fr","eternalmangas.org","etownbluejays.com","euro2024direct.ru","eurotruck2.com.br","evolvingtable.com","extreme-board.com","extremotvplay.com","faceittracker.net","fansonlinehub.com","fantasticporn.net","fastconverter.net","fatgirlskinny.net","fattubevideos.net","femalefirst.co.uk","fgcuathletics.com","fightinghawks.com","file.magiclen.org","finanzas-vida.com","fineretroporn.com","finexxxvideos.com","finish.addurl.biz","fitnakedgirls.com","fitnessplanss.com","fitnesssguide.com","flight-report.com","floridagators.com","foguinhogames.net","footballstream.tv","footfetishvid.com","footstockings.com","fordownloader.com","formatlibrary.com","forum.blu-ray.com","fplstatistics.com","freeboytwinks.com","freecodezilla.net","freecourseweb.com","freemagazines.top","freeoseocheck.com","freepdf-books.com","freepornrocks.com","freepornstream.cc","freepornvideo.sex","freepornxxxhd.com","freerealvideo.com","freethesaurus.com","freex2line.online","freexxxvideos.pro","french-streams.cc","freshstuff4u.info","friendproject.net","frkn64modding.com","frosinonetoday.it","fuerzasarmadas.eu","fuldaerzeitung.de","fullfreeimage.com","fullxxxmovies.net","futbollibrehd.com","futbolsayfasi.net","galonamission.com","games-manuals.com","games.puzzler.com","games.thestar.com","gamesofdesire.com","gaminggorilla.com","gay-streaming.com","gaypornhdfree.com","gebrauchtwagen.at","gewinde-normen.de","gimmesomeoven.com","girlsofdesire.org","girlswallowed.com","globalstreams.xyz","gobigtitsporn.com","goblueraiders.com","godriveplayer.com","gogetapast.com.br","gogueducation.com","goltelevision.com","gothunderbirds.ca","grannyfuckxxx.com","grannyxxxtube.net","graphicgoogle.com","grsprotection.com","gwiazdatalkie.com","hakunamatata5.org","hallo-muenchen.de","happy-otalife.com","hardcoregamer.com","hbculifestyle.com","hdfilmizlesen.com","hdporn-movies.com","hdvintagetube.com","headlinerpost.com","healbot.dpm15.net","healthcheckup.com","hegreartnudes.com","help.cashctrl.com","hentaibrasil.info","hentaienglish.com","hentaitube.online","hideandseek.world","hikarinoakari.com","hollywoodlife.com","hostingunlock.com","hotkitchenbag.com","hotmaturetube.com","hotspringsofbc.ca","houstontexans.com","howtoconcepts.com","hunterscomics.com","idownloadblog.com","iedprivatedqu.com","iheartnaptime.net","imgdawgknuttz.com","imperialstudy.com","independent.co.uk","indianporn365.net","indofirmware.site","indojavstream.com","infinityscans.net","infinityscans.org","infinityscans.xyz","inside-digital.de","insidermonkey.com","instantcloud.site","insurancepost.xyz","ironwinter6m.shop","isabihowto.com.ng","isekaisubs.web.id","isminiunuttum.com","jamiesamewalk.com","janammusic.in.net","japaneseholes.com","japanpornclip.com","japanxxxmovie.com","japanxxxworld.com","jardiner-malin.fr","jokersportshd.org","juegos.elpais.com","justagirlblog.com","k-statesports.com","k-statesports.net","k-statesports.org","kandisvarlden.com","kenshi.fandom.com","kh-pokemon-mc.com","khabardinbhar.net","kickasstorrents.*","kill-the-hero.com","kimcilonlyofc.com","kiuruvesilehti.fi","know-how-tree.com","kontenterabox.com","kontrolkalemi.com","koreanbeauty.club","korogashi-san.org","kreis-anzeiger.de","kurierlubelski.pl","lachainemeteo.com","lacuevadeguns.com","laksa19.github.io","lavozdegalicia.es","lebois-racing.com","lectorhub.j5z.xyz","lecturisiarome.ro","leechpremium.link","leechyscripts.net","lespartisanes.com","lewblivehdplay.ru","lheritierblog.com","libertestreamvf.*","lifesambrosia.com","limontorrents.com","line-stickers.com","link.turkdown.com","linuxsecurity.com","lisatrialidea.com","locatedinfain.com","lonely-mature.com","lovegrowswild.com","lucagrassetti.com","luciferdonghua.in","luckypatchers.com","lycoathletics.com","madhentaitube.com","malaysiastock.biz","mamainastitch.com","maps4study.com.br","marthastewart.com","mature-chicks.com","maturepussies.pro","mdzsmutpcvykb.net","media.cms.nova.cz","megajapantube.com","metaforespress.gr","mfmfinancials.com","miamidolphins.com","miaminewtimes.com","milfpussy-sex.com","minecraftwild.com","mizugigurabia.com","mlbpark.donga.com","mlbstreaming.live","mmorpgplay.com.br","mobilanyheter.net","modelsxxxtube.com","modescanlator.net","mommyporntube.com","momstube-porn.com","moon-fm43w1qv.com","moon-kg83docx.com","moonblinkwifi.com","motorradfrage.net","motorradonline.de","moviediskhd.cloud","movielinkbd4u.com","moviezaddiction.*","mp3cristianos.net","mundovideoshd.com","murtonroofing.com","music.youtube.com","musicforchoir.com","muyinteresante.es","myabandonware.com","myair2.resmed.com","myfunkytravel.com","mynakedwife.video","nasdaqfutures.org","national-park.com","negative.tboys.ro","nepalieducate.com","networklovers.com","new-xxxvideos.com","nextchessmove.com","ngin-mobility.com","nightlifeporn.com","nikkan-gendai.com","nikkeifutures.org","njwildlifecam.com","nobodycancool.com","nonsensediamond.*","novelasligera.com","nzpocketguide.com","oceanof-games.com","oceanoffgames.com","odekake-spots.com","officedepot.co.cr","officialpanda.com","olemisssports.com","onceuponachef.com","ondemandkorea.com","onepiecepower.com","onlinemschool.com","onlinesextube.com","onlineteenhub.com","ontariofarmer.com","openspeedtest.com","opensubtitles.com","oportaln10.com.br","osmanonline.co.uk","osthessen-news.de","ottawacitizen.com","ottrelease247.com","outdoorchannel.de","overwatchporn.xxx","pahaplayers.click","palmbeachpost.com","pandaznetwork.com","panel.skynode.pro","pantyhosepink.com","paramountplus.com","paraveronline.org","pghk.blogspot.com","phimlongtieng.net","phoenix-manga.com","phonefirmware.com","piazzagallura.org","pistonpowered.com","plantatreenow.com","play.aidungeon.io","player.glomex.com","playerflixapi.com","playerjavseen.com","playmyopinion.com","playporngames.com","pleated-jeans.com","pockettactics.com","popcornmovies.org","porn-sexypics.com","pornanimetube.com","porngirlstube.com","pornoenspanish.es","pornoschlange.com","pornxxxvideos.net","posturedirect.com","practicalkida.com","prague-blog.co.il","premiumporn.org>>","prensaesports.com","prescottenews.com","press-citizen.com","presstelegram.com","prettyprudent.com","primeanimesex.com","primeflix.website","progameguides.com","project-free-tv.*","projectfreetv.one","promisingapps.com","promo-visits.site","protege-liens.com","pubgaimassist.com","publicananker.com","publicdomainq.net","publicdomainr.net","publicflashing.me","pumpkinnspice.com","punisoku.blogo.jp","pussytorrents.org","qatarstreams.me>>","queenofmature.com","radiolovelive.com","radiosymphony.com","ragnarokmanga.com","randomarchive.com","rateyourmusic.com","rawindianporn.com","readallcomics.com","readcomiconline.*","readfireforce.com","realvoyeursex.com","recipetineats.com","reporterpb.com.br","reprezentacija.rs","retrosexfilms.com","reviewjournal.com","richieashbeck.com","robloxscripts.com","rojadirectatvhd.*","roms-download.com","roznamasiasat.com","rule34.paheal.net","sahlmarketing.net","samfordsports.com","sanangelolive.com","sanmiguellive.com","sarkarinaukry.com","savemoneyinfo.com","scandichotels.com","schoolsweek.co.uk","scontianastro.com","searchnsucceed.in","seasons-dlove.net","send-anywhere.com","series9movies.com","sevenjournals.com","sexmadeathome.com","sexyebonyteen.com","sexyfreepussy.com","shahiid-anime.net","share.filesh.site","shentai-anime.com","shinshi-manga.net","shittokuadult.net","shortencash.click","shrink-service.it","shugarysweets.com","sidearmsocial.com","sideplusleaks.com","sim-kichi.monster","simply-hentai.com","simplyrecipes.com","simplywhisked.com","simulatormods.com","skidrow-games.com","skillheadlines.in","skodacommunity.de","slaughtergays.com","smallseotools.com","soccerworldcup.me","softwaresblue.com","south-park-tv.biz","spectrum.ieee.org","speculationis.com","spedostream2.shop","spiritparting.com","sponsorhunter.com","sportanalytic.com","sportingsurge.com","sportlerfrage.net","sportsbuff.stream","sportsgames.today","sportzonline.site","stapadblockuser.*","stellarthread.com","stepsisterfuck.me","storefront.com.ng","stories.los40.com","straatosphere.com","streamadblocker.*","streamcaster.live","streaming-one.com","streamingunity.to","streamlivetv.site","streamonsport99.*","streamseeds24.com","streamshunters.eu","stringreveals.com","suanoticia.online","super-ethanol.com","susanhavekeep.com","tabele-kalorii.pl","tamaratattles.com","tamilbrahmins.com","tamilsexstory.net","tattoosbeauty.com","tautasdziesmas.lv","techadvisor.co.uk","techconnection.in","techiepirates.com","techlog.ta-yan.ai","technewsrooms.com","technewsworld.com","techsolveprac.com","teenpornvideo.sex","teenpornvideo.xxx","testlanguages.com","texture-packs.com","thaihotmodels.com","thangdangblog.com","theandroidpro.com","thebazaarzone.com","thecelticblog.com","thecubexguide.com","thedailybeast.com","thedigitalfix.com","thefreebieguy.com","thegamearcade.com","thehealthsite.com","theismailiusa.org","thekingavatar.com","theliveupdate.com","theouterhaven.net","theregister.co.uk","thermoprzepisy.pl","thesprucepets.com","thewoksoflife.com","theworldobits.com","thousandbabes.com","tichyseinblick.de","tiktokcounter.net","timesnowhindi.com","tiroalpaloweb.xyz","titfuckvideos.com","tmail.sys64738.at","tomatespodres.com","toplickevesti.com","topsworldnews.com","torrent-pirat.com","torrentdownload.*","tradingfact4u.com","trannylibrary.com","trannyxxxtube.net","truyen-hentai.com","truyenaudiocv.net","tubepornasian.com","tubepornstock.com","ultimate-catch.eu","ultrateenporn.com","umatechnology.org","unsere-helden.com","uptechnologys.com","urjalansanomat.fi","url.gem-flash.com","utepathletics.com","vanillatweaks.net","venusarchives.com","vide-greniers.org","video.gazzetta.it","videogameszone.de","videos.remilf.com","vietnamanswer.com","viralitytoday.com","virtualnights.com","visualnewshub.com","vitalitygames.com","voiceofdenton.com","voyeurpornsex.com","voyeurspyporn.com","voyeurxxxfree.com","wannafreeporn.com","watchanimesub.net","watchfacebook.com","watchsouthpark.tv","websiteglowgh.com","weknowconquer.com","welcometojapan.jp","wellness4live.com","wellnessbykay.com","wirralglobe.co.uk","wirtualnemedia.pl","wohnmobilforum.de","workweeklunch.com","worldfreeware.com","worldgreynews.com","worthitorwoke.com","wpsimplehacks.com","wutheringwaves.gg","xfreepornsite.com","xhamsterdeutsch.*","xnxx-sexfilme.com","xxxonlinefree.com","xxxpussyclips.com","xxxvideostrue.com","yesdownloader.com","yongfucknaked.com","yourcupofcake.com","yummysextubes.com","zeenews.india.com","zeijakunahiko.com","zeroto60times.com","zippysharecue.com","1001tracklists.com","101soundboards.com","10minuteemails.com","123moviesready.org","123moviestoday.net","1337x.unblock2.xyz","247footballnow.com","7daystodiemods.com","adblockeronstape.*","addictinggames.com","adultasianporn.com","advertisertape.com","afasiaarchzine.com","airportwebcams.net","akuebresources.com","allureamateurs.net","alternativa104.net","amateur-mature.net","anarchy-stream.com","angrybirdsnest.com","animesonliner4.com","anothergraphic.org","antenasport.online","arcade.buzzrtv.com","arcadeprehacks.com","arkadiumhosted.com","arsiv.mackolik.com","asian-teen-sex.com","asianbabestube.com","asianpornfilms.com","asiansexdiarys.com","asianstubefuck.com","atlantafalcons.com","atlasstudiousa.com","autocadcommand.com","backforseconds.com","badasshardcore.com","baixedetudo.net.br","bakeitwithlove.com","ballexclusives.com","barstoolsports.com","basic-tutorials.de","bdsmslavemovie.com","beamng.wesupply.cx","bearchasingart.com","beermoneyforum.com","beginningmanga.com","berliner-kurier.de","beruhmtemedien.com","best-xxxvideos.com","bestialitytaboo.tv","bettingexchange.it","bidouillesikea.com","bigdata-social.com","bigdata.rawlazy.si","bigpiecreative.com","bigsouthsports.com","bigtitsxxxfree.com","birdsandblooms.com","blisseyhusband.net","blogredmachine.com","blogx.almontsf.com","blowjobamateur.net","blowjobpornset.com","bluecoreinside.com","bluemediastorage.*","bombshellbling.com","bonsaiprolink.shop","bosoxinjection.com","browneyedbaker.com","businessinsider.de","campsitephotos.com","camwhorescloud.com","cararegistrasi.com","casos-aislados.com","cdimg.blog.2nt.com","cehennemstream.xyz","cerbahealthcare.it","chiangraitimes.com","chicagobearshq.com","chicagobullshq.com","chicasdesnudas.xxx","chikianimation.org","choiceappstore.xyz","cintateknologi.com","clampschoolholic.*","classicalradio.com","classicxmovies.com","clothing-mania.com","codingnepalweb.com","coleccionmovie.com","comicspornoxxx.com","comparepolicyy.com","comparteunclic.com","contractpharma.com","couponscorpion.com","cr7-soccer.store>>","creditcardrush.com","crimsonscrolls.net","cronachesalerno.it","cryptonworld.space","dallasobserver.com","dcdirtylaundry.com","dcworldscollide.gg","denverpioneers.com","depressionhurts.us","descargaspcpro.net","desifuckonline.com","deutschekanale.com","devicediary.online","diariodenavarra.es","digicol.dpm.org.cn","dinneratthezoo.com","dirtyasiantube.com","dirtygangbangs.com","discover-sharm.com","diyphotography.net","diyprojectslab.com","donaldlineelse.com","donghuanosekai.com","doublemindtech.com","downloadcursos.top","downloadgames.info","downloadmusic.info","downloadpirate.com","dragonball-zxk.com","dulichkhanhhoa.net","e-mountainbike.com","elamigos-games.com","elamigos-games.net","elconfidencial.com","elearning-cpge.com","embed-player.space","empire-streaming.*","english-dubbed.com","english-topics.com","erikcoldperson.com","evdeingilizcem.com","eveningtimes.co.uk","exactlyhowlong.com","expressbydgoski.pl","extremosports.club","familyhandyman.com","feastingathome.com","feelgoodfoodie.net","fightingillini.com","filmizlehdfilm.com","financenova.online","financialjuice.com","flacdownloader.com","flashgirlgames.com","flashingjungle.com","foodiesgallery.com","foreversparkly.com","forkknifeswoon.com","formasyonhaber.net","forum.cstalking.tv","francaisfacile.net","free-gay-clips.com","freeadultcomix.com","freeadultvideos.cc","freebiesmockup.com","freecoursesite.com","freefireupdate.com","freegogpcgames.com","freegrannyvids.com","freemockupzone.com","freemoviesfull.com","freepornasians.com","freepublicporn.com","freereceivesms.com","freeviewmovies.com","freevipservers.net","freevstplugins.net","freewoodworking.ca","freex2line.onlinex","freshwaterdell.com","friscofighters.com","fritidsmarkedet.dk","fuckhairygirls.com","fuckingsession.com","galinhasamurai.com","gamerevolution.com","games.arkadium.com","games.kentucky.com","games.mashable.com","games.thestate.com","gamingforecast.com","gaypornmasters.com","gazetakrakowska.pl","gazetazachodnia.eu","gdrivelatinohd.net","geniale-tricks.com","geniussolutions.co","girlsgogames.co.uk","go.bucketforms.com","goafricaonline.com","gobankingrates.com","gocurrycracker.com","godrakebulldog.com","gojapaneseporn.com","golf.rapidmice.com","gorro-4go5b3nj.fun","gorro-9mqnb7j2.fun","gorro-chfzoaas.fun","gorro-ry0ziftc.fun","grouppornotube.com","gruenderlexikon.de","gudangfirmwere.com","hamptonpirates.com","hard-tube-porn.com","healthfirstweb.com","healthnewsreel.com","healthy4pepole.com","heatherdisarro.com","hentaipornpics.net","hentaisexfilms.com","heraldscotland.com","hiddencamstube.com","highkeyfinance.com","hindustantimes.com","homeairquality.org","homemoviestube.com","hotanimevideos.com","hotbabeswanted.com","hotxxxjapanese.com","housingaforest.com","hqamateurtubes.com","huffingtonpost.com","huitranslation.com","humanbenchmark.com","hungrypaprikas.com","hyundaitucson.info","iamhomesteader.com","idedroidsafelink.*","idevicecentral.com","ifreemagazines.com","ikingfile.mooo.com","ilcamminodiluce.it","imagetranslator.io","indecentvideos.com","indesignskills.com","indianbestporn.com","indianpornvideos.*","indiansexbazar.com","indiasmagazine.com","infamous-scans.com","infinitehentai.com","infinityblogger.in","infojabarloker.com","informatudo.com.br","informaxonline.com","insidemarketing.it","insidememorial.com","insider-gaming.com","insurancesfact.com","intercelestial.com","investor-verlag.de","iowaconference.com","islamicpdfbook.com","italianporn.com.es","ithinkilikeyou.net","iusedtobeaboss.com","jacksonguitars.com","jamessoundcost.com","japanesemomsex.com","japanesetube.video","jasminetesttry.com","jemontremabite.com","jeux.meteocity.com","johnalwayssame.com","jojolandsmanga.com","joomlabeginner.com","jujustu-kaisen.com","justfamilyporn.com","justpicsplease.com","justtoysnoboys.com","kawaguchimaeda.com","kdramasmaza.com.pk","kellywhatcould.com","keralatelecom.info","kickasstorrents2.*","kirbiecravings.com","kittyfuckstube.com","knowyourphrase.com","kobitacocktail.com","komisanwamanga.com","kr-weathernews.com","krebs-horoskop.com","kstatefootball.net","kstatefootball.org","laopinioncoruna.es","leagueofgraphs.com","leckerschmecker.me","leo-horoscopes.com","letribunaldunet.fr","leviathanmanga.com","levismodding.co.uk","lib.hatenablog.com","lightnovelspot.com","link.paid4link.com","linkedmoviehub.top","linux-community.de","listenonrepeat.com","literarysomnia.com","littlebigsnake.com","liveandletsfly.com","localemagazine.com","longbeachstate.com","lotus-tours.com.hk","loyolaramblers.com","lukecomparetwo.com","luzernerzeitung.ch","m.timesofindia.com","maggotdrowning.com","magicgameworld.com","makeincomeinfo.com","maketecheasier.com","makotoichikawa.net","mallorcazeitung.es","manager-magazin.de","manchesterworld.uk","mangas-origines.fr","manoramaonline.com","maraudersports.com","marvelsnapzone.com","mathplayground.com","maturetubehere.com","maturexxxclips.com","mctechsolutions.in","mediascelebres.com","megafilmeshd50.com","megahentaitube.com","megapornfreehd.com","mein-wahres-ich.de","memorialnotice.com","merlininkazani.com","mespornogratis.com","mesquitaonline.com","minddesignclub.org","minhasdelicias.com","mobilelegends.shop","mobiletvshows.site","modele-facture.com","moflix-stream.fans","momdoesreviews.com","montereyherald.com","motorcyclenews.com","moviescounnter.com","moviesonlinefree.*","mygardening411.com","myhentaicomics.com","mymusicreviews.com","myneobuxportal.com","mypornstarbook.net","myquietkitchen.com","nadidetarifler.com","naijachoice.com.ng","nakedgirlsroom.com","nakedneighbour.com","nauci-engleski.com","nauci-njemacki.com","netaffiliation.com","neueroeffnung.info","nevadawolfpack.com","newjapanesexxx.com","news-geinou100.com","newyorkupstate.com","nicematureporn.com","niestatystyczny.pl","nightdreambabe.com","noodlemagazine.com","nourishedbynic.com","novacodeportal.xyz","nudebeachpussy.com","nudecelebforum.com","nuevos-mu.ucoz.com","nyharborwebcam.com","o2tvseries.website","oceanbreezenyc.org","officegamespot.com","ogrenciyegelir.com","omnicalculator.com","onepunch-manga.com","onetimethrough.com","onlinesudoku.games","onlinetutorium.com","onlinework4all.com","onlygoldmovies.com","onscreensvideo.com","openchat-review.me","pakistaniporn2.com","pancakerecipes.com","passportaction.com","pc-spiele-wiese.de","pcgamedownload.net","pcgameshardware.de","peachprintable.com","peliculas-dvdrip.*","penisbuyutucum.net","pennbookcenter.com","pestleanalysis.com","pinayviralsexx.com","plainasianporn.com","play.starsites.fun","play.watch20.space","player.euroxxx.net","playeriframe.lol>>","playretrogames.com","pliroforiki-edu.gr","policesecurity.com","policiesreview.com","polskawliczbach.pl","pornhubdeutsch.net","pornmaturetube.com","pornohubonline.com","pornovideos-hd.com","pornvideospass.com","powerthesaurus.org","premiumstream.live","present.rssing.com","printablecrush.com","problogbooster.com","productkeysite.com","projectfreetv2.com","projuktirkotha.com","proverbmeaning.com","psicotestuned.info","pussytubeebony.com","racedepartment.com","radio-en-direct.fr","radioitalylive.com","radionorthpole.com","ratemyteachers.com","realfreelancer.com","realtormontreal.ca","recherche-ebook.fr","redamateurtube.com","redbubbletools.com","redstormsports.com","replica-watch.info","reporterherald.com","rightdark-scan.com","rincondelsazon.com","ripcityproject.com","risefromrubble.com","romaniataramea.com","runtothefinish.com","ryanagoinvolve.com","sabornutritivo.com","samanarthishabd.in","samrudhiglobal.com","samurai.rzword.xyz","sandrataxeight.com","sankakucomplex.com","sattakingcharts.in","scarletandgame.com","scarletknights.com","schoener-wohnen.de","sciencechannel.com","scopateitaliane.it","seamanmemories.com","selfstudybrain.com","sethniceletter.com","sexiestpicture.com","sexteenxxxtube.com","sexy-youtubers.com","sexykittenporn.com","sexymilfsearch.com","shadowrangers.live","shemaletoonsex.com","shipseducation.com","shrivardhantech.in","shutupandgo.travel","sidelionreport.com","siirtolayhaber.com","simpledownload.net","siteunblocked.info","slowianietworza.pl","smithsonianmag.com","soccerstream100.to","sociallyindian.com","softwaredetail.com","sosyalbilgiler.net","southernliving.com","southparkstudios.*","spank-and-bang.com","sportstohfa.online","stapewithadblock.*","stream.nflbox.me>>","streamelements.com","streaming-french.*","strtapeadblocker.*","surgicaltechie.com","sweeteroticart.com","syracusecrunch.com","tamilultratv.co.in","tapeadsenjoyer.com","tcpermaculture.com","teachpreschool.org","technicalviral.com","telefullenvivo.com","telexplorer.com.ar","theblissempire.com","theendlessmeal.com","thefirearmblog.com","thehentaiworld.com","thelesbianporn.com","thepewterplank.com","thepiratebay10.org","theralphretort.com","thestarphoenix.com","thesuperdownload.*","thiagorossi.com.br","thisisourbliss.com","tiervermittlung.de","tiktokrealtime.com","times-standard.com","tiny-sparklies.com","tips-and-tricks.co","tokyo-ghoul.online","tonpornodujour.com","topbiography.co.in","torrentdosfilmes.*","torrentdownloads.*","totalsportekhd.com","traductionjeux.com","trannysexmpegs.com","transgirlslive.com","traveldesearch.com","travelplanspro.com","trendyol-milla.com","tribeathletics.com","trovapromozioni.it","truckingboards.com","truyenbanquyen.com","truyenhentai18.net","tuhentaionline.com","tulsahurricane.com","turboimagehost.com","tv3play.skaties.lv","tvonlinesports.com","tweaksforgeeks.com","txstatebobcats.com","u-createcrafts.com","ucirvinesports.com","ukrainesmodels.com","uncensoredleak.com","universfreebox.com","unlimitedfiles.xyz","urbanmilwaukee.com","urlaubspartner.net","venus-and-mars.com","vermangasporno.com","verywellhealth.com","victor-mochere.com","videos.porndig.com","videosinlevels.com","videosxxxputas.com","vincenzosplate.com","vintagepornfun.com","vintagepornnew.com","vintagesexpass.com","waitrosecellar.com","washingtonpost.com","watch.rkplayer.xyz","watch.shout-tv.com","watchadsontape.com","weakstreams.online","weatherzone.com.au","web.livecricket.is","webloadedmovie.com","websitesbridge.com","werra-rundschau.de","wheatbellyblog.com","wifemamafoodie.com","wildhentaitube.com","windowsmatters.com","winteriscoming.net","wohnungsboerse.net","woman.excite.co.jp","worldstreams.click","wormser-zeitung.de","www.apkmoddone.com","www.cloudflare.com","www.primevideo.com","xbox360torrent.com","xda-developers.com","xn--kckzb2722b.com","xpressarticles.com","xxx-asian-tube.com","xxxanimemovies.com","xxxanimevideos.com","yify-subtitles.org","youngpussyfuck.com","youwatch-serie.com","yt-downloaderz.com","ytmp4converter.com","znanemediablog.com","zxi.mytechroad.com","aachener-zeitung.de","abukabir.fawrye.com","abyssplay.pages.dev","academiadelmotor.es","adblockstreamtape.*","addtobucketlist.com","adultgamesworld.com","agrigentonotizie.it","ai.tempatwisata.pro","aliendictionary.com","allafricangirls.net","allindiaroundup.com","allporncartoons.com","alludemycourses.com","almohtarif-tech.net","altadefinizione01.*","amateur-couples.com","amaturehomeporn.com","amazingtrannies.com","androidrepublic.org","angeloyeo.github.io","animefuckmovies.com","animeonlinefree.org","animesonlineshd.com","annoncesescorts.com","anonymous-links.com","anonymousceviri.com","app.link2unlock.com","app.studysmarter.de","aprenderquechua.com","arabianbusiness.com","arizonawildcats.com","arnaqueinternet.com","arrowheadaddict.com","artificialnudes.com","asiananimaltube.org","asianfuckmovies.com","asianporntube69.com","audiobooks4soul.com","audiotruyenfull.com","awellstyledlife.com","bailbondsfinder.com","baltimoreravens.com","beautypackaging.com","beisbolinvernal.com","berliner-zeitung.de","bestmaturewomen.com","bethshouldercan.com","bible-knowledge.com","bigcockfreetube.com","bigsouthnetwork.com","blackenterprise.com","blog.cloudflare.com","blog.itijobalert.in","blog.potterworld.co","bluemediadownload.*","bordertelegraph.com","brighteyedbaker.com","brucevotewithin.com","businessinsider.com","calculascendant.com","cambrevenements.com","cancelguider.online","canuckaudiomart.com","celebritynakeds.com","celebsnudeworld.com","certificateland.com","chakrirkhabar247.in","championpeoples.com","chawomenshockey.com","chicagosportshq.com","christiantrendy.com","chubbypornmpegs.com","citationmachine.net","civilenggforall.com","classicpornbest.com","classicpornvids.com","classyyettrendy.com","clevelandbrowns.com","collegeteentube.com","columbiacougars.com","comicsxxxgratis.com","commande.rhinov.pro","commsbusiness.co.uk","comofuncionaque.com","compilationtube.xyz","comprovendolibri.it","concealednation.org","consigliatodanoi.it","couponsuniverse.com","crackedsoftware.biz","cravesandflames.com","creativebusybee.com","crossdresserhub.com","crystal-launcher.pl","curbsideclassic.com","custommapposter.com","daddyfuckmovies.com","daddylivestream.com","dailymaverick.co.za","daisiesandpie.co.uk","dartmouthsports.com","der-betze-brennt.de","descargaranimes.com","descargatepelis.com","deseneledublate.com","desktopsolution.org","detroitjockcity.com","dev.fingerprint.com","developerinsider.co","diariodemallorca.es","diarioeducacion.com","dichvureviewmap.com","diendancauduong.com","digitalfernsehen.de","digitalseoninja.com","digitalstudiome.com","dignityobituary.com","discordfastfood.com","divinelifestyle.com","divxfilmeonline.net","dktechnicalmate.com","download.megaup.net","driveteslacanada.ca","dubipc.blogspot.com","dynamicminister.net","dziennikbaltycki.pl","dziennikpolski24.pl","dziennikzachodni.pl","earn.quotesopia.com","edmontonjournal.com","elamigosedition.com","ellibrepensador.com","embed.nana2play.com","en-thunderscans.com","en.financerites.com","erotic-beauties.com","eventiavversinews.*","expresskaszubski.pl","fansubseries.com.br","fatblackmatures.com","faucetcaptcha.co.in","felicetommasino.com","femdomporntubes.com","fifaultimateteam.it","filmeonline2018.net","filmesonlinehd1.org","firstasianpussy.com","footballfancast.com","footballstreams.lol","footballtransfer.ru","fortnitetracker.com","forum-pokemon-go.fr","foxeslovelemons.com","foxvalleyfoodie.com","fplstatistics.co.uk","franceprefecture.fr","free-trannyporn.com","freecoursesites.com","freecoursesonline.*","freegamescasual.com","freeindianporn.mobi","freeindianporn2.com","freeplayervideo.com","freescorespiano.com","freesexvideos24.com","freetarotonline.com","freshsexxvideos.com","frustfrei-lernen.de","fuckmonstercock.com","fuckslutsonline.com","futura-sciences.com","gagaltotal666.my.id","gallant-matures.com","gamecocksonline.com","games.bradenton.com","games.fresnobee.com","games.heraldsun.com","games.sunherald.com","garnishandglaze.com","gazetawroclawska.pl","generacionretro.net","gesund-vital.online","gfilex.blogspot.com","global.novelpia.com","gloswielkopolski.pl","go-for-it-wgt1a.fun","goarmywestpoint.com","godrakebulldogs.com","godrakebulldogs.net","goodnewsnetwork.org","hailfloridahail.com","hamburgerinsult.com","hardcorelesbian.xyz","hardwarezone.com.sg","hardwoodhoudini.com","hartvannederland.nl","haus-garten-test.de","haveyaseenjapan.com","hawaiiathletics.com","hayamimi-gunpla.com","healthbeautybee.com","helpnetsecurity.com","hentai-mega-mix.com","hentaianimezone.com","hentaisexuality.com","hieunguyenphoto.com","highdefdiscnews.com","hindimatrashabd.com","hindimearticles.net","hindimoviesonline.*","historicaerials.com","hmc-id.blogspot.com","hobby-machinist.com","home-xxx-videos.com","hoosierhomemade.com","horseshoeheroes.com","hostingdetailer.com","hotbeautyhealth.com","hotorientalporn.com","hqhardcoreporno.com","hummingbirdhigh.com","ilbolerodiravel.org","ilforumdeibrutti.is","indianpornvideo.org","individualogist.com","ingyenszexvideok.hu","insidertracking.com","insidetheiggles.com","interculturalita.it","inventionsdaily.com","iptvxtreamcodes.com","itsecuritynews.info","iulive.blogspot.com","jacquieetmichel.net","japanesexxxporn.com","javuncensored.watch","jayservicestuff.com","joguinhosgratis.com","joyfoodsunshine.com","justcastingporn.com","justonecookbook.com","justsexpictures.com","k-statefootball.net","k-statefootball.org","keeperofthehome.org","kentstatesports.com","kenzo-flowertag.com","kingjamesgospel.com","kissmaturestube.com","klettern-magazin.de","kstateathletics.com","ladypopularblog.com","laughingspatula.com","lawweekcolorado.com","learnchannel-tv.com","learnmarketinfo.com","legionpeliculas.org","legionprogramas.org","leitesculinaria.com","lemino.docomo.ne.jp","letrasgratis.com.ar","lifeisbeautiful.com","limiteddollqjc.shop","livingstondaily.com","localizaagencia.com","lorimuchbenefit.com","louisianacookin.com","love-stoorey210.net","m.jobinmeghalaya.in","makeitdairyfree.com","marketrevolution.eu","masashi-blog418.com","massagefreetube.com","maturepornphoto.com","measuringflower.com","mediatn.cms.nova.cz","meeting.tencent.com","megajapanesesex.com","meicho.marcsimz.com","melskitchencafe.com","merriam-webster.com","miamiairportcam.com","miamibeachradio.com","migliori-escort.com","mikaylaarealike.com","mindmotion93y8.shop","minecraft-forum.net","minecraftraffle.com","minhaconexao.com.br","minimalistbaker.com","mittelbayerische.de","mobilesexgamesx.com","morinaga-office.net","motherandbaby.co.uk","movies-watch.com.pk","myhentaigallery.com","mynaturalfamily.com","myreadingmanga.info","natashaskitchen.com","noticiascripto.site","novelmultiverse.com","novelsparadise.site","nude-beach-tube.com","nudeselfiespics.com","nurparatodos.com.ar","obituaryupdates.com","oldgrannylovers.com","onlinefetishporn.cc","onlinepornushka.com","opisanie-kartin.com","orangespotlight.com","outdoor-magazin.com","painting-planet.com","parasportontario.ca","parrocchiapalata.it","paulkitchendark.com","peopleenespanol.com","perfectmomsporn.com","personalityclub.com","petitegirlsnude.com","pharmaguideline.com","phoenixnewtimes.com","phonereviewinfo.com","picspornamateur.com","platform.autods.com","play.dictionary.com","play.geforcenow.com","play.mylifetime.com","play.playkrx18.site","player.popfun.co.uk","player.uwatchfree.*","pompanobeachcam.com","popularasianxxx.com","pornjapanesesex.com","pornocolegialas.org","pornocolombiano.net","pornstarsadvice.com","portmiamiwebcam.com","porttampawebcam.com","pranarevitalize.com","protege-torrent.com","psychology-spot.com","publicidadtulua.com","quest.to-travel.net","raccontivietati.com","radiosantaclaus.com","radiotormentamx.com","rawofficethumbs.com","readcomicsonline.ru","realitybrazzers.com","redowlanalytics.com","relampagomovies.com","reneweconomy.com.au","richardsignfish.com","richmondspiders.com","ripplestream4u.shop","roberteachfinal.com","rojadirectaenhd.net","rojadirectatvlive.*","rollingglobe.online","romanticlesbian.com","rundschau-online.de","ryanmoore.marketing","rysafe.blogspot.com","samurai.wordoco.com","santoinferninho.com","savingsomegreen.com","scansatlanticos.com","scholarshiplist.org","schrauben-normen.de","secondhandsongs.com","sempredirebanzai.it","sempreupdate.com.br","serieshdpormega.com","seriezloaded.com.ng","setsuyakutoushi.com","sex-free-movies.com","sexyvintageporn.com","shogaisha-shuro.com","shogaisha-techo.com","sixsistersstuff.com","skidrowreloaded.com","smartkhabrinews.com","soap2day-online.com","soccerfullmatch.com","soccerworldcup.me>>","sociologicamente.it","somulhergostosa.com","sourcingjournal.com","sousou-no-frieren.*","sportitalialive.com","sportzonline.site>>","spotidownloader.com","ssdownloader.online","standardmedia.co.ke","stealthoptional.com","stevenuniverse.best","stormininnorman.com","storynavigation.com","stoutbluedevils.com","stream.offidocs.com","stream.pkayprek.com","streamadblockplus.*","streamshunters.eu>>","streamtapeadblock.*","stylegirlfriend.com","submissive-wife.net","summarynetworks.com","sussexexpress.co.uk","sweetadult-tube.com","tainio-mania.online","tamilfreemp3songs.*","tapewithadblock.org","teachersupdates.net","technicalline.store","techtrendmakers.com","tekniikanmaailma.fi","telecharger-igli4.*","thebalancemoney.com","theberserkmanga.com","thecrazytourist.com","thefoodieaffair.com","theglobeandmail.com","themehospital.co.uk","theoaklandpress.com","therecipecritic.com","thesimsresource.com","thesmokingcuban.com","thewatchseries.live","throwsmallstone.com","timesnowmarathi.com","tiz-cycling-live.io","tophentaicomics.com","toptenknowledge.com","totalfuckmovies.com","totalmaturefuck.com","transexuales.gratis","trendsderzukunft.de","trucs-et-astuces.co","tubepornclassic.com","tubevintageporn.com","turkishseriestv.net","turtleboysports.com","tutorialsduniya.com","tw-hkt.blogspot.com","ukmagazinesfree.com","uktvplay.uktv.co.uk","ultimate-guitar.com","usinger-anzeiger.de","utahstateaggies.com","valleyofthesuns.com","veryfastdownload.pw","vinylcollective.com","virtual-youtuber.jp","virtualdinerbot.com","vitadacelebrita.com","voetbalrotterdam.nl","wallpaperaccess.com","watch-movies.com.pk","watchlostonline.net","watchmonkonline.com","watchmoviesrulz.com","watchonlinemovie.pk","webhostingoffer.org","weristdeinfreund.de","whatjewwannaeat.com","windows-7-forum.net","winit.heatworld.com","woffordterriers.com","worldaffairinfo.com","worldstarhiphop.com","worldtravelling.com","www2.tmyinsight.net","xhamsterdeutsch.xyz","xn--nbkw38mlu2a.com","xnxx-downloader.net","xnxx-sex-videos.com","xxxhentaimovies.com","xxxpussysextube.com","xxxsexyjapanese.com","yaoimangaonline.com","yellowblissroad.com","yorkshirepost.co.uk","your-daily-girl.com","youramateurporn.com","youramateurtube.com","yourlifeupdated.net","youtubedownloader.*","zeeplayer.pages.dev","25yearslatersite.com","27-sidefire-blog.com","2adultflashgames.com","acienciasgalilei.com","adult-sex-gamess.com","adultdvdparadise.com","akatsuki-no-yona.com","allcelebritywiki.com","allcivilstandard.com","allnewindianporn.com","aman-dn.blogspot.com","amateurebonypics.com","amateuryoungpics.com","analysis-chess.io.vn","androidapkmodpro.com","androidheadlines.com","androidtunado.com.br","angolopsicologia.com","animalextremesex.com","apenasmaisumyaoi.com","aquiyahorajuegos.net","aroundthefoghorn.com","aspdotnet-suresh.com","ayobelajarbareng.com","badassdownloader.com","bailiwickexpress.com","banglachotigolpo.xyz","best-mobilegames.com","bestmp3converter.com","bestshemaleclips.com","bigtitsporn-tube.com","blackwoodacademy.org","bloggingawaydebt.com","bloggingguidance.com","boainformacao.com.br","bogowieslowianscy.pl","bollywoodshaadis.com","bouamra.blogspot.com","boxofficebusiness.in","br.nacaodamusica.com","browardpalmbeach.com","brr-69xwmut5-moo.com","bustyshemaleporn.com","cachevalleydaily.com","canberratimes.com.au","cartoonstvonline.com","cartoonvideos247.com","centralboyssp.com.br","chasingthedonkey.com","chef-in-training.com","cienagamagdalena.com","climbingtalshill.com","comandotorrenthd.org","connoisseurusveg.com","crackstreamsfree.com","crackstreamshd.click","craigretailers.co.uk","creators.nafezly.com","dailydishrecipes.com","dailygrindonline.net","dairylandexpress.com","davidsonbuilders.com","dcdlplayer8a06f4.xyz","decorativemodels.com","defienietlynotme.com","deliciousmagazine.pl","demonyslowianskie.pl","denisegrowthwide.com","descargaseriestv.com","digitalmusicnews.com","diglink.blogspot.com","divxfilmeonline.tv>>","djsofchhattisgarh.in","donna-cerca-uomo.com","downloadfilm.website","durhamopenhouses.com","ear-phone-review.com","earnfromarticles.com","edivaldobrito.com.br","educationbluesky.com","embed.hideiframe.com","encuentratutarea.com","eroticteensphoto.net","escort-in-italia.com","essen-und-trinken.de","eurostreaming.casino","extremereportbot.com","fairforexbrokers.com","famosas-desnudas.org","fastpeoplesearch.com","favfamilyrecipes.com","filmeserialegratis.*","filmpornofrancais.fr","finanznachrichten.de","finding-camellia.com","fle-2ggdmu8q-moo.com","fle-5r8dchma-moo.com","fle-rvd0i9o8-moo.com","foodfaithfitness.com","footballandress.club","foreverconscious.com","forexwikitrading.com","forge.plebmasters.de","forobasketcatala.com","forum.lolesporte.com","forum.thresholdx.net","fotbolltransfers.com","fr.streamon-sport.ru","free-sms-receive.com","freebigboobsporn.com","freecoursesonline.me","freelistenonline.com","freemagazinespdf.com","freemedicalbooks.org","freepatternsarea.com","freereadnovel.online","freeromsdownload.com","freestreams-live.*>>","freethailottery.live","freshshemaleporn.com","fullywatchonline.com","funeral-memorial.com","gaget.hatenablog.com","games.abqjournal.com","games.dallasnews.com","games.denverpost.com","games.kansascity.com","games.sixtyandme.com","games.wordgenius.com","gearingcommander.com","gesundheitsfrage.net","getfreesmsnumber.com","ghajini-04bl9y7x.lol","ghajini-1fef5bqn.lol","ghajini-1flc3i96.lol","ghajini-4urg44yg.lol","ghajini-8nz2lav9.lol","ghajini-9b3wxqbu.lol","ghajini-emtftw1o.lol","ghajini-jadxelkw.lol","ghajini-vf70yty6.lol","ghajini-y9yq0v8t.lol","giuseppegravante.com","giveawayoftheday.com","givemenbastreams.com","googledrivelinks.com","gourmetsupremacy.com","greatestshemales.com","greensnchocolate.com","griffinathletics.com","hackingwithreact.com","hds-streaming-hd.com","headlinepolitics.com","heartofvicksburg.com","heartrainbowblog.com","heresyoursavings.com","highheelstrample.com","historichorizons.com","hodgepodgehippie.com","hofheimer-zeitung.de","home-made-videos.com","homestratosphere.com","hornyconfessions.com","hostingreviews24.com","hotasianpussysex.com","hotjapaneseshows.com","huffingtonpost.co.uk","hypelifemagazine.com","ibreatheimhungry.com","immobilienscout24.de","india.marathinewz.in","inkworldmagazine.com","intereseducation.com","investnewsbrazil.com","irresistiblepets.net","italiadascoprire.net","jemontremonminou.com","juliescafebakery.com","k-stateathletics.com","kachelmannwetter.com","karaoke4download.com","karaokegratis.com.ar","keedabankingnews.com","lacronicabadajoz.com","laopiniondemalaga.es","laopiniondemurcia.es","laopiniondezamora.es","largescaleforums.com","latinatemptation.com","laweducationinfo.com","lazytranslations.com","learn.moderngyan.com","lemonsqueezyhome.com","lempaala.ideapark.fi","lesbianvideotube.com","letemsvetemapplem.eu","letsworkremotely.com","link.djbassking.live","linksdegrupos.com.br","live-tv-channels.org","liveforlivemusic.com","loan.bgmi32bitapk.in","loan.punjabworks.com","loriwithinfamily.com","luxurydreamhomes.net","mangcapquangvnpt.com","maturepornjungle.com","maturewomenfucks.com","mauiinvitational.com","maxfinishseveral.com","medicalstudyzone.com","mein-kummerkasten.de","michaelapplysome.com","mkvmoviespoint.autos","money.quotesopia.com","monkeyanimalporn.com","morganhillwebcam.com","motorbikecatalog.com","motorcitybengals.com","motorsport-total.com","movieloversworld.com","moviemakeronline.com","moviesubtitles.click","mujeresdesnudas.club","mustardseedmoney.com","mylivewallpapers.com","mypace.sasapurin.com","myperfectweather.com","mypussydischarge.com","myuploadedpremium.de","naughtymachinima.com","neighborfoodblog.com","newfreelancespot.com","neworleanssaints.com","newsonthegotoday.com","nibelungen-kurier.de","notebookcheck-ru.com","notebookcheck-tr.com","nudecelebsimages.com","nudeplayboygirls.com","nutraingredients.com","nylonstockingsex.net","onelittleproject.com","online-xxxmovies.com","onlinegrannyporn.com","originalteentube.com","pandadevelopment.net","pasadenastarnews.com","pcgamez-download.com","pesprofessionals.com","pipocamoderna.com.br","plagiarismchecker.co","planetaminecraft.com","platform.twitter.com","play.doramasplus.net","player.amperwave.net","player.smashy.stream","playstationhaber.com","popularmechanics.com","porlalibreportal.com","pornhub-sexfilme.net","portnassauwebcam.com","presentation-ppt.com","prismmarketingco.com","pro.iqsmartgames.com","psychologyjunkie.com","pussymaturephoto.com","radiocountrylive.com","ragnarokscanlation.*","ranaaclanhungary.com","rebeccaneverbase.com","recipestutorials.com","redcurrantbakery.com","redensarten-index.de","remotejobzone.online","reviewingthebrew.com","rhein-main-presse.de","rinconpsicologia.com","robertplacespace.com","rockpapershotgun.com","roemische-zahlen.net","rojadirectaenvivo.pl","roms-telecharger.com","s920221683.online.de","salamanca24horas.com","sandratableother.com","sarkariresult.social","savespendsplurge.com","schoolgirls-asia.org","schwaebische-post.de","securegames.iwin.com","seededatthetable.com","server-tutorials.net","server.satunivers.tv","sexypornpictures.org","socialmediagirls.com","socialmediaverve.com","socket.pearsoned.com","solomaxlevelnewbie.*","spicyvintageporn.com","sportstohfa.online>>","starkroboticsfrc.com","stream.nbcsports.com","streamingcommunity.*","strtapewithadblock.*","successstoryinfo.com","superfastrelease.xyz","superpackpormega.com","swietaslowianskie.pl","tainguyenmienphi.com","tasteandtellblog.com","teenamateurphoto.com","telephone-soudan.com","teluguonlinemovies.*","telugusexkathalu.com","thecraftsmanblog.com","thefappeningblog.com","thefastlaneforum.com","thegatewaypundit.com","thekitchenmagpie.com","thelavenderchair.com","thesarkariresult.net","thistlewoodfarms.com","tienichdienthoai.net","tinyqualityhomes.org","todaysthebestday.com","tomb-raider-king.com","totalsportek1000.com","toyoheadquarters.com","travellingdetail.com","trueachievements.com","tutorialforlinux.com","udemy-downloader.com","underground.tboys.ro","unityassets4free.com","utahsweetsavings.com","utepminermaniacs.com","ver-comics-porno.com","ver-mangas-porno.com","videoszoofiliahd.com","vintageporntubes.com","viralviralvideos.com","virgo-horoscopes.com","visualcapitalist.com","wallstreet-online.de","watchallchannels.com","watchcartoononline.*","watchgameofthrones.*","watchhouseonline.net","watchsuitsonline.net","watchtheofficetv.com","wegotthiscovered.com","weihnachts-filme.com","wetasiancreampie.com","whats-on-netflix.com","whitelacecottage.com","wife-home-videos.com","wirtualnynowydwor.pl","worldgirlsportal.com","www.dobreprogramy.pl","yakyufan-asobiba.com","youfreepornotube.com","youngerasiangirl.net","yourhomebasedmom.com","yourhomemadetube.com","youtube-nocookie.com","yummytummyaarthi.com","1337x.ninjaproxy1.com","3dassetcollection.com","3dprintersforum.co.uk","ableitungsrechner.net","ad-itech.blogspot.com","airportseirosafar.com","airsoftmilsimnews.com","allgemeine-zeitung.de","ar-atech.blogspot.com","arabamob.blogspot.com","arrisalah-jakarta.com","banglachoti-story.com","bestsellerforaday.com","bibliotecadecorte.com","bigbuttshubvideos.com","blackchubbymovies.com","blackmaturevideos.com","blasianluvforever.com","blog.motionisland.com","bournemouthecho.co.uk","branditechture.agency","brandstofprijzen.info","broncathleticfund.com","brutalanimalsfuck.com","bucetaspeludas.com.br","business-standard.com","calculator-online.net","cancer-horoscopes.com","celebritydeeplink.com","celebritynetworth.com","cleananddelicious.com","collinsdictionary.com","comentariodetexto.com","cordcuttingreport.com","course-downloader.com","creative-culinary.com","daddylivestream.com>>","dailyvideoreports.net","davescomputertips.com","desitab69.sextgem.com","destakenewsgospel.com","deutschpersischtv.com","diarioinformacion.com","diplomaexamcorner.com","dirtyyoungbitches.com","disneyfashionista.com","downloadcursos.gratis","dragontranslation.com","dragontranslation.net","dragontranslation.org","earn.mpscstudyhub.com","easyworldbusiness.com","edwardarriveoften.com","elcriticodelatele.com","electricalstudent.com","embraceinnerchaos.com","envato-downloader.com","eroticmoviesonline.me","errotica-archives.com","evelynthankregion.com","expressilustrowany.pl","filemoon-59t9ep5j.xyz","filemoon-ep11lgxt.xyz","filemoon-nv2xl8an.xyz","filemoon-oe4w6g0u.xyz","filmpornoitaliano.org","fitting-it-all-in.com","foodsdictionary.co.il","free-famous-toons.com","freebulksmsonline.com","freefatpornmovies.com","freeindiansextube.com","freepikdownloader.com","freshmaturespussy.com","friedrichshainblog.de","froheweihnachten.info","gadgetguideonline.com","games.bostonglobe.com","games.centredaily.com","games.dailymail.co.uk","games.greatergood.com","games.miamiherald.com","games.puzzlebaron.com","games.startribune.com","games.theadvocate.com","games.theolympian.com","games.triviatoday.com","gbadamud.blogspot.com","gemini-horoscopes.com","generalpornmovies.com","gentiluomodigitale.it","gentlemansgazette.com","giantshemalecocks.com","giessener-anzeiger.de","girlfuckgalleries.com","glamourxxx-online.com","gmuender-tagespost.de","googlearth.selva.name","goprincetontigers.com","greaterlongisland.com","guardian-series.co.uk","haber.eskisehirde.net","hackedonlinegames.com","hersfelder-zeitung.de","hochheimer-zeitung.de","hoegel-textildruck.de","hollywoodreporter.com","hot-teens-movies.mobi","hotmarathistories.com","howtoblogformoney.net","html5.gamemonetize.co","hungarianhardstyle.hu","iamflorianschulze.com","imasdk.googleapis.com","indiansexstories2.net","indratranslations.com","inmatesearchidaho.com","insideeducation.co.za","jacquieetmicheltv.net","jemontremasextape.com","journaldemontreal.com","journey.to-travel.net","jsugamecocksports.com","juninhoscripts.com.br","kana-mari-shokudo.com","kstatewomenshoops.com","kstatewomenshoops.net","kstatewomenshoops.org","labelandnarrowweb.com","lapaginadealberto.com","learnodo-newtonic.com","lebensmittelpraxis.de","lesbianfantasyxxx.com","lingeriefuckvideo.com","littlehouseliving.com","live-sport.duktek.pro","lycomingathletics.com","majalahpendidikan.com","malaysianwireless.com","mangaplus.shueisha.tv","megashare-website.com","midlandstraveller.com","midwestconference.org","mimaletadepeliculas.*","mmoovvfr.cloudfree.jp","moo-teau4c9h-mkay.com","moonfile-62es3l9z.com","motorsport.uol.com.br","mountainmamacooks.com","musvozimbabwenews.com","mybakingaddiction.com","mysflink.blogspot.com","nathanfromsubject.com","nationalgeographic.fr","netsentertainment.net","nobledicion.yoveo.xyz","note.sieuthuthuat.com","notformembersonly.com","oberschwaben-tipps.de","onepiecemangafree.com","onlinetntextbooks.com","onlinewatchmoviespk.*","ovcdigitalnetwork.com","paradiseislandcam.com","pcso-lottoresults.com","peiner-nachrichten.de","pelotalibrevivo.net>>","philippinenmagazin.de","photovoltaikforum.com","pisces-horoscopes.com","platform.adex.network","portbermudawebcam.com","primapaginamarsala.it","printablecreative.com","prod.hydra.sophos.com","quinnipiacbobcats.com","qul-de.translate.goog","radioitaliacanada.com","radioitalianmusic.com","redbluffdailynews.com","reddit-streams.online","redheaddeepthroat.com","redirect.dafontvn.com","revistaapolice.com.br","runningonrealfood.com","salzgitter-zeitung.de","santacruzsentinel.com","santafenewmexican.com","scriptgrowagarden.com","scrubson.blogspot.com","semprefi-1h3u8pkc.fun","semprefi-2tazedzl.fun","semprefi-5ut0d23g.fun","semprefi-7oliaqnr.fun","semprefi-8xp7vfr9.fun","semprefi-hdm6l8jq.fun","semprefi-uat4a3jd.fun","semprefi-wdh7eog3.fun","sex-amateur-clips.com","sexybabespictures.com","shortgoo.blogspot.com","showdownforrelief.com","sinnerclownceviri.net","skorpion-horoskop.com","smartwebsolutions.org","snapinstadownload.xyz","softwarecrackguru.com","softwaredescargas.com","solomax-levelnewbie.*","solopornoitaliani.xxx","soziologie-politik.de","space.tribuntekno.com","stablediffusionxl.com","startupjobsportal.com","steamcrackedgames.com","stream.hownetwork.xyz","streaming-community.*","streamingcommunityz.*","studyinghuman6js.shop","sublimereflection.com","supertelevisionhd.com","sweet-maturewomen.com","symboleslowianskie.pl","tapeadvertisement.com","tarjetarojaenvivo.lat","tarjetarojatvonline.*","taurus-horoscopes.com","taurus.topmanhuas.org","tech.trendingword.com","texteditor.nsspot.net","thecakeboutiquect.com","thedigitaltheater.com","thefreedictionary.com","thegnomishgazette.com","theprofoundreport.com","thetruthaboutcars.com","thewebsitesbridge.com","timesheraldonline.com","timesnewsgroup.com.au","toddpartneranimal.com","torrentdofilmeshd.net","towheaddeepthroat.com","travel-the-states.com","travelingformiles.com","tudo-para-android.com","ukiahdailyjournal.com","unsurcoenlasombra.com","utkarshonlinetest.com","vdl.np-downloader.com","videosxxxporno.gratis","virtualstudybrain.com","voyeur-pornvideos.com","walterprettytheir.com","watch.foodnetwork.com","watchcartoonsonline.*","watchfreejavonline.co","watchkobestreams.info","watchonlinemoviespk.*","watchporninpublic.com","watchseriesstream.com","weihnachts-bilder.org","wetterauer-zeitung.de","whisperingauroras.com","whittierdailynews.com","wiesbadener-kurier.de","wirtualnelegionowo.pl","worldwidestandard.net","www.dailymotion.com>>","xn--mlaregvle-02af.nu","yoima.hatenadiary.com","yoima2.hatenablog.com","zone-telechargement.*","123movies-official.net","1plus1plus1equals1.net","45er-de.translate.goog","acervodaputaria.com.br","adelaidepawnbroker.com","aimasummd.blog.fc2.com","algodaodocescan.com.br","allevertakstream.space","androidecuatoriano.xyz","appstore-discounts.com","assessmentcentrehq.com","automobile-catalog.com","batterypoweronline.com","best4hack.blogspot.com","bestialitysextaboo.com","blackamateursnaked.com","breastfeedingplace.com","brunettedeepthroat.com","bus-location.1507t.xyz","canadianunderwriter.ca","canarystreetcrafts.com","canzoni-per-bambini.it","cartoonporncomics.info","celebritymovieblog.com","chocolatewithgrace.com","cleanandscentsible.com","clixwarez.blogspot.com","cloud.majalahhewan.com","comandotorrentshds.org","cosmonova-broadcast.tv","cotravinh.blogspot.com","cpopchanelofficial.com","crayonsandcravings.com","crunchycreamysweet.com","currencyconverterx.com","currentrecruitment.com","dads-banging-teens.com","databasegdriveplayer.*","dewfuneralhomenews.com","diananatureforeign.com","digitalbeautybabes.com","downloadfreecourse.com","drakorkita73.kita.rest","drop.carbikenation.com","dtupgames.blogspot.com","ecommercewebsite.store","einewelteinezukunft.de","electriciansforums.net","elektrobike-online.com","elizabeth-mitchell.org","enciclopediaonline.com","eu-proxy.startpage.com","eurointegration.com.ua","exclusiveasianporn.com","exgirlfriendmarket.com","ezaudiobookforsoul.com","fantasticyoungporn.com","file-1bl9ruic-moon.com","filmeserialeonline.org","freelancerartistry.com","freepic-downloader.com","freepik-downloader.com","ftlauderdalewebcam.com","games.besthealthmag.ca","games.heraldonline.com","games.islandpacket.com","games.journal-news.com","games.readersdigest.ca","gewinnspiele-markt.com","gifhorner-rundschau.de","girlfriendsexphoto.com","golink.bloggerishyt.in","hairstylesthatwork.com","happyveggiekitchen.com","hentai-cosplay-xxx.com","hentai-vl.blogspot.com","hiraethtranslation.com","hockeyfantasytools.com","hollywoodhomestead.com","hopsion-consulting.com","hotanimepornvideos.com","housethathankbuilt.com","illustratemagazine.com","imagetwist.netlify.app","imperfecthomemaker.com","incontri-in-italia.com","indianpornvideo.online","insidekstatesports.com","insidekstatesports.net","insidekstatesports.org","irasutoya.blogspot.com","jacquieetmicheltv2.net","jessicaglassauthor.com","jonathansociallike.com","juegos.eleconomista.es","juneauharborwebcam.com","k-statewomenshoops.com","k-statewomenshoops.net","k-statewomenshoops.org","kenkou-maintenance.com","kingshotcalculator.com","kristiesoundsimply.com","lagacetadesalamanca.es","lecourrier-du-soir.com","littlesunnykitchen.com","livefootballempire.com","livingincebuforums.com","lonestarconference.org","m.bloggingguidance.com","marketedgeofficial.com","marketplace.nvidia.com","masterpctutoriales.com","megadrive-emulator.com","meteoregioneabruzzo.it","mexicanfoodjournal.com","mini.surveyenquete.net","moneywar2.blogspot.com","muleriderathletics.com","mycolombianrecipes.com","newbookmarkingsite.com","nilopolisonline.com.br","nosweatshakespeare.com","obutecodanet.ig.com.br","onlinetechsamadhan.com","onlinevideoconverter.*","opiniones-empresas.com","oracleerpappsguide.com","originalindianporn.com","paginadanoticia.com.br","philadelphiaeagles.com","pianetamountainbike.it","pittsburghpanthers.com","plagiarismdetector.net","play.discoveryplus.com","portstthomaswebcam.com","poweredbycovermore.com","praxis-jugendarbeit.de","principiaathletics.com","puzzles.standard.co.uk","puzzles.sunjournal.com","radioamericalatina.com","redlandsdailyfacts.com","republicain-lorrain.fr","rubyskitchenrecipes.uk","russkoevideoonline.com","salisburyjournal.co.uk","schwarzwaelder-bote.de","scorpio-horoscopes.com","sexyasianteenspics.com","shakentogetherlife.com","smallpocketlibrary.com","smartfeecalculator.com","sms-receive-online.com","stellar.quoteminia.com","strangernervousql.shop","streamhentaimovies.com","stuttgarter-zeitung.de","supermarioemulator.com","tastefullyeclectic.com","tatacommunications.com","techieway.blogspot.com","teluguhitsandflops.com","thatballsouttahere.com","the-military-guide.com","thecartoonporntube.com","thehouseofportable.com","thisishowwebingham.com","tipsandtricksjapan.com","totalsportek1000.com>>","turkishaudiocenter.com","tutoganga.blogspot.com","tvchoicemagazine.co.uk","twopeasandtheirpod.com","unity3diy.blogspot.com","universitiesonline.xyz","universityequality.com","watchdocumentaries.com","webcreator-journal.com","welsh-dictionary.ac.uk","xhamster-sexvideos.com","xn--algododoce-j5a.com","youfiles.herokuapp.com","yourdesignmagazine.com","zeeebatch.blogspot.com","aachener-nachrichten.de","adblockeronstreamtape.*","adrianmissionminute.com","ads-ti9ni4.blogspot.com","adultgamescollector.com","alejandrocenturyoil.com","alleneconomicmatter.com","allschoolboysecrets.com","aquarius-horoscopes.com","arcade.dailygazette.com","asianteenagefucking.com","auto-motor-und-sport.de","barranquillaestereo.com","bestpuzzlesandgames.com","betterbuttchallenge.com","bikyonyu-bijo-zukan.com","brasilsimulatormods.com","buerstaedter-zeitung.de","businesswritingblog.com","c--ix-de.translate.goog","careersatcouncil.com.au","cloudapps.herokuapp.com","coolsoft.altervista.org","creditcardgenerator.com","dameungrrr.videoid.baby","destinationsjourney.com","dokuo666.blog98.fc2.com","edgedeliverynetwork.com","elperiodicodearagon.com","encurtador.postazap.com","entertainment-focus.com","escortconrecensione.com","eservice.directauto.com","eskiceviri.blogspot.com","exclusiveindianporn.com","fightforthealliance.com","file-kg88oaak-embed.com","financeandinsurance.xyz","footballtransfer.com.ua","freefiremaxofficial.com","freemovies-download.com","freepornhdonlinegay.com","fromvalerieskitchen.com","funeralmemorialnews.com","gamersdiscussionhub.com","games.mercedsunstar.com","games.pressdemocrat.com","games.sanluisobispo.com","games.star-telegram.com","gamingsearchjournal.com","giessener-allgemeine.de","goctruyentranhvui17.com","healthyfitnessmeals.com","heatherwholeinvolve.com","historyofroyalwomen.com","homeschoolgiveaways.com","ilgeniodellostreaming.*","india.mplandrecord.info","influencersgonewild.com","insidekstatesports.info","integral-calculator.com","investmentwatchblog.com","iptvdroid1.blogspot.com","juegosdetiempolibre.org","julieseatsandtreats.com","kennethofficialitem.com","keysbrasil.blogspot.com","keywestharborwebcam.com","kutubistan.blogspot.com","laurelberninteriors.com","legendaryrttextures.com","linklog.tiagorangel.com","lirik3satu.blogspot.com","loldewfwvwvwewefdw.cyou","mamaslearningcorner.com","marketingaccesspass.com","megaplayer.bokracdn.run","metamani.blog15.fc2.com","miltonfriedmancores.org","ministryofsolutions.com","mobile-tracker-free.com","mobileweb.bankmellat.ir","moon-3uykdl2w-embed.com","morgan0928-5386paz2.fun","morgan0928-6v7c14vs.fun","morgan0928-8ufkpqp8.fun","morgan0928-oqdmw7bl.fun","morgan0928-t9xc5eet.fun","morganoperationface.com","morrisvillemustangs.com","mountainbike-magazin.de","movielinkbdofficial.com","mrfreemium.blogspot.com","naumburger-tageblatt.de","newlifefuneralhomes.com","newlifeonahomestead.com","news-und-nachrichten.de","northwalespioneer.co.uk","nudeblackgirlfriend.com","nutraceuticalsworld.com","onionringsandthings.com","onlinesoccermanager.com","osteusfilmestuga.online","pandajogosgratis.com.br","patriotathleticfund.com","pepperlivestream.online","phonenumber-lookup.info","platingsandpairings.com","player.bestrapeporn.com","player.smashystream.com","player.tormalayalamhd.*","player.xxxbestsites.com","playtolearnpreschool.us","portaldosreceptores.org","portcanaveralwebcam.com","portstmaartenwebcam.com","pramejarab.blogspot.com","predominantlyorange.com","premierfantasytools.com","prepared-housewives.com","privateindianmovies.com","programmingeeksclub.com","puzzles.pressherald.com","receive-sms-online.info","rppk13baru.blogspot.com","runningtothekitchen.com","searchenginereports.net","seoul-station-druid.com","sexyteengirlfriends.net","sexywomeninlingerie.com","shannonpersonalcost.com","singlehoroskop-loewe.de","snowman-information.com","spacestation-online.com","sqlserveregitimleri.com","streamtapeadblockuser.*","sweettoothsweetlife.com","talentstareducation.com","teamupinternational.com","tech.pubghighdamage.com","the-voice-of-germany.de","thebestideasforkids.com","thechroniclesofhome.com","thehappierhomemaker.com","theinternettaughtme.com","theplantbasedschool.com","tinycat-voe-fashion.com","tips97tech.blogspot.com","traderepublic.community","tutorialesdecalidad.com","valuable.hatenablog.com","verteleseriesonline.com","watchseries.unblocked.*","whatgreatgrandmaate.com","wiesbadener-tagblatt.de","windowsaplicaciones.com","xxxjapaneseporntube.com","youtube4kdownloader.com","zonamarela.blogspot.com","zone-telechargement.ing","zoomtventertainment.com","720pxmovies.blogspot.com","abendzeitung-muenchen.de","advertiserandtimes.co.uk","afilmyhouse.blogspot.com","altebwsneno.blogspot.com","anime4mega-descargas.net","aspirapolveremigliori.it","ate60vs7zcjhsjo5qgv8.com","atlantichockeyonline.com","aussenwirtschaftslupe.de","awealthofcommonsense.com","bestialitysexanimals.com","boundlessnecromancer.com","broadbottomvillage.co.uk","businesssoftwarehere.com","canonprintersdrivers.com","cardboardtranslation.com","celebrityleakednudes.com","childrenslibrarylady.com","cimbusinessevents.com.au","cle0desktop.blogspot.com","cloudcomputingtopics.net","culture-informatique.net","democratandchronicle.com","dictionary.cambridge.org","dictionnaire-medical.net","dominican-republic.co.il","downloads.wegomovies.com","downloadtwittervideo.com","dsocker1234.blogspot.com","einrichtungsbeispiele.de","fid-gesundheitswissen.de","freegrannypornmovies.com","freehdinterracialporn.in","ftlauderdalebeachcam.com","futbolenlatelevision.com","galaxytranslations10.com","games.crosswordgiant.com","games.idahostatesman.com","games.thenewstribune.com","games.tri-cityherald.com","gcertificationcourse.com","gelnhaeuser-tageblatt.de","general-anzeiger-bonn.de","greenbaypressgazette.com","healthylittlefoodies.com","hentaianimedownloads.com","hilfen-de.translate.goog","hotmaturegirlfriends.com","inlovingmemoriesnews.com","inmatefindcalifornia.com","insurancebillpayment.net","intelligence-console.com","jacquieetmichelelite.com","jasonresponsemeasure.com","josephseveralconcern.com","juegos.elnuevoherald.com","jumpmanclubbrasil.com.br","lampertheimer-zeitung.de","latribunadeautomocion.es","lauterbacher-anzeiger.de","lespassionsdechinouk.com","liveanimalporn.zooo.club","makingthymeforhealth.com","mariatheserepublican.com","mediapemersatubangsa.com","meine-anzeigenzeitung.de","mentalhealthcoaching.org","minecraft-serverlist.net","moalm-qudwa.blogspot.com","multivideodownloader.com","my-code4you.blogspot.com","noblessetranslations.com","nutraingredients-usa.com","nyangames.altervista.org","oberhessische-zeitung.de","onlinetv.planetfools.com","personality-database.com","phenomenalityuniform.com","philly.arkadiumarena.com","photos-public-domain.com","player.subespanolvip.com","playstationlifestyle.net","polseksongs.blogspot.com","portevergladeswebcam.com","programasvirtualespc.net","puzzles.centralmaine.com","quelleestladifference.fr","reddit-soccerstreams.com","renierassociatigroup.com","riprendiamocicatania.com","roadrunnersathletics.com","robertordercharacter.com","sandiegouniontribune.com","senaleszdhd.blogspot.com","shoppinglys.blogspot.com","smotret-porno-onlain.com","softdroid4u.blogspot.com","spicysouthernkitchen.com","stephenking-00qvxikv.fun","stephenking-3u491ihg.fun","stephenking-7tm3toav.fun","stephenking-c8bxyhnp.fun","stephenking-vy5hgkgu.fun","sundaysuppermovement.com","thebharatexpressnews.com","thedesigninspiration.com","theharristeeterdeals.com","themediterraneandish.com","therelaxedhomeschool.com","thewanderlustkitchen.com","thunderousintentions.com","tirumalatirupatiyatra.in","tubeinterracial-porn.com","unityassetcollection.com","upscaler.stockphotos.com","ustreasuryyieldcurve.com","verpeliculasporno.gratis","virginmediatelevision.ie","watchdoctorwhoonline.com","watchtrailerparkboys.com","workproductivityinfo.com","a-love-of-rottweilers.com","actionviewphotography.com","arabic-robot.blogspot.com","bharatsarkarijobalert.com","blog.receivefreesms.co.uk","braunschweiger-zeitung.de","businessnamegenerator.com","caroloportunidades.com.br","chocolatecoveredkatie.com","christopheruntilpoint.com","constructionplacement.org","convert-case.softbaba.com","cooldns-de.translate.goog","craftaholicsanonymous.net","ctrmarketingsolutions.com","dancearoundthekitchen.com","depo-program.blogspot.com","derivative-calculator.net","devere-group-hongkong.com","devoloperxda.blogspot.com","dictionnaire.lerobert.com","everydayhomeandgarden.com","fantasyfootballgeek.co.uk","fitnesshealtharticles.com","footballleagueworld.co.uk","fotografareindigitale.com","freeserverhostingweb.club","freewatchserialonline.com","game-kentang.blogspot.com","games.daytondailynews.com","games.gameshownetwork.com","games.lancasteronline.com","games.ledger-enquirer.com","games.moviestvnetwork.com","games.theportugalnews.com","gloucestershirelive.co.uk","graceaddresscommunity.com","heatherdiscussionwhen.com","housecardsummerbutton.com","kathleenmemberhistory.com","keepingitsimplecrafts.com","kitchenfunwithmy3sons.com","kitchentableclassroom.com","koume-in-huistenbosch.net","krankheiten-simulieren.de","lancashiretelegraph.co.uk","latribunadelpaisvasco.com","mega-hentai2.blogspot.com","newtoncustominteriors.com","nutraingredients-asia.com","oeffentlicher-dienst.info","oneessentialcommunity.com","onepiece-manga-online.net","passionatecarbloggers.com","percentagecalculator.guru","premeditatedleftovers.com","printedelectronicsnow.com","programmiedovetrovarli.it","projetomotog.blogspot.com","puzzles.independent.co.uk","realcanadiansuperstore.ca","receitasoncaseiras.online","schooltravelorganiser.com","scripcheck.great-site.net","searchmovie.wp.xdomain.jp","sentinelandenterprise.com","seogroup.bookmarking.info","silverpetticoatreview.com","simply-delicious-food.com","softwaresolutionshere.com","sofwaremania.blogspot.com","tech.unblockedgames.world","telenovelas-turcas.com.es","thebeginningaftertheend.*","theshabbycreekcottage.com","transparentcalifornia.com","truesteamachievements.com","tucsitupdate.blogspot.com","ultimateninjablazingx.com","usahealthandlifestyle.com","vercanalesdominicanos.com","vintage-erotica-forum.com","whatisareverseauction.com","xn--k9ja7fb0161b5jtgfm.jp","youtubemp3donusturucu.net","yusepjaelani.blogspot.com","a-b-f-dd-aa-bb-cc61uyj.fun","a-b-f-dd-aa-bb-ccn1nff.fun","a-b-f-dd-aa-bb-cctwd3a.fun","a-b-f-dd-aa-bb-ccyh5my.fun","arena.gamesforthebrain.com","audiobookexchangeplace.com","avengerinator.blogspot.com","barefeetonthedashboard.com","basseqwevewcewcewecwcw.xyz","bezpolitickekorektnosti.cz","bibliotecahermetica.com.br","change-ta-vie-coaching.com","collegefootballplayoff.com","cookiedoughandovenmitt.com","cornerstoneconfessions.com","cotannualconference.org.uk","cuatrolatastv.blogspot.com","dinheirocursosdownload.com","downloads.sayrodigital.net","edinburghnews.scotsman.com","eleganceandenchantment.com","elperiodicoextremadura.com","flashplayer.fullstacks.net","former-railroad-worker.com","frankfurter-wochenblatt.de","funnymadworld.blogspot.com","games.bellinghamherald.com","games.everythingzoomer.com","helmstedter-nachrichten.de","html5.gamedistribution.com","investigationdiscovery.com","istanbulescortnetworks.com","jilliandescribecompany.com","johnwardflighttraining.com","mailtool-de.translate.goog","motive213link.blogspot.com","musicbusinessworldwide.com","noticias.gospelmais.com.br","nutraingredients-latam.com","photoshopvideotutorial.com","puzzles.bestforpuzzles.com","recetas.arrozconleche.info","redditsoccerstreams.name>>","ripleyfieldworktracker.com","riverdesdelatribuna.com.ar","sagittarius-horoscopes.com","secondcomingofgluttony.com","skillmineopportunities.com","stuttgarter-nachrichten.de","sulocale.sulopachinews.com","thelastgamestandingexp.com","thetelegraphandargus.co.uk","tiendaenlinea.claro.com.ni","todoseriales1.blogspot.com","tokoasrimotedanpayet.my.id","tralhasvarias.blogspot.com","video-to-mp3-converter.com","watchimpracticaljokers.com","whowantstuffs.blogspot.com","windowcleaningforums.co.uk","wolfenbuetteler-zeitung.de","wolfsburger-nachrichten.de","aprettylifeinthesuburbs.com","brittneystandardwestern.com","celestialtributesonline.com","charlottepilgrimagetour.com","choose.kaiserpermanente.org","cloud-computing-central.com","cointiply.arkadiumarena.com","constructionmethodology.com","cool--web-de.translate.goog","domainregistrationtips.info","download.kingtecnologia.com","dramakrsubindo.blogspot.com","elperiodicomediterraneo.com","embed.nextgencloudtools.com","evlenmekisteyenbayanlar.net","flash-firmware.blogspot.com","games.myrtlebeachonline.com","ge-map-overlays.appspot.com","happypenguin.altervista.org","iphonechecker.herokuapp.com","littlepandatranslations.com","lurdchinexgist.blogspot.com","newssokuhou666.blog.fc2.com","otakuworldsite.blogspot.com","parametric-architecture.com","pasatiemposparaimprimir.com","practicalpainmanagement.com","puzzles.crosswordsolver.org","redcarpet-fashionawards.com","thewestmorlandgazette.co.uk","timesofindia.indiatimes.com","watchfootballhighlights.com","watchmalcolminthemiddle.com","watchonlyfoolsandhorses.com","your-local-pest-control.com","centrocommercialevulcano.com","conoscereilrischioclinico.it","correction-livre-scolaire.fr","economictimes.indiatimes.com","emperorscan.mundoalterno.org","games.springfieldnewssun.com","gps--cache-de.translate.goog","imagenesderopaparaperros.com","lizs-early-learning-spot.com","locurainformaticadigital.com","michiganrugcleaning.cleaning","mimaletamusical.blogspot.com","net--tools-de.translate.goog","net--tours-de.translate.goog","pekalongan-cits.blogspot.com","publicrecords.netronline.com","skibiditoilet.yourmom.eu.org","springfieldspringfield.co.uk","teachersguidetn.blogspot.com","tekken8combo.kagewebsite.com","theeminenceinshadowmanga.com","uptodatefinishconference.com","watchonlinemovies.vercel.app","www-daftarharga.blogspot.com","youkaiwatch2345.blog.fc2.com","bayaningfilipino.blogspot.com","beautypageants.indiatimes.com","counterstrike-hack.leforum.eu","dev-dark-blog.pantheonsite.io","educationtips213.blogspot.com","fun--seiten-de.translate.goog","hortonanderfarom.blogspot.com","maximumridesharingprofits.com","panlasangpinoymeatrecipes.com","pharmaceutical-technology.com","play.virginmediatelevision.ie","pressurewasherpumpdiagram.com","shorturl.unityassets4free.com","thefreedommatrix.blogspot.com","walkthrough-indo.blogspot.com","web--spiele-de.translate.goog","wojtekczytawh40k.blogspot.com","caq21harderv991gpluralplay.xyz","comousarzararadio.blogspot.com","coolsoftware-de.translate.goog","hipsteralcolico.altervista.org","jennifercertaindevelopment.com","kryptografie-de.translate.goog","mp3songsdownloadf.blogspot.com","noicetranslations.blogspot.com","oxfordlearnersdictionaries.com","pengantartidurkuh.blogspot.com","photo--alben-de.translate.goog","rheinische-anzeigenblaetter.de","thelibrarydigital.blogspot.com","touhoudougamatome.blog.fc2.com","watchcalifornicationonline.com","wwwfotografgotlin.blogspot.com","bigclatterhomesguideservice.com","bitcoinminingforex.blogspot.com","cool--domains-de.translate.goog","ibecamethewifeofthemalelead.com","pickcrackpasswords.blogspot.com","posturecorrectorshop-online.com","safeframe.googlesyndication.com","sozialversicherung-kompetent.de","the-girl-who-ate-everything.com","utilidades.ecuadjsradiocorp.com","akihabarahitorigurasiseikatu.com","deletedspeedstreams.blogspot.com","freesoftpdfdownload.blogspot.com","games.games.newsgames.parade.com","insuranceloan.akbastiloantips.in","situsberita2terbaru.blogspot.com","such--maschine-de.translate.goog","uptodatefinishconferenceroom.com","games.charlottegames.cnhinews.com","loadsamusicsarchives.blogspot.com","pythonmatplotlibtips.blogspot.com","ragnarokscanlation.opchapters.com","tw.xn--h9jepie9n6a5394exeq51z.com","papagiovannipaoloii.altervista.org","softwareengineer-de.translate.goog","rojadirecta-tv-en-vivo.blogspot.com","thenightwithoutthedawn.blogspot.com","tenseishitaraslimedattaken-manga.com","wetter--vorhersage-de.translate.goog","marketing-business-revenus-internet.fr","hardware--entwicklung-de.translate.goog","0x7jwsog5coxn1e0mk2phcaurtrmbxfpouuz.fun","279kzq8a4lqa0ddt7sfp825b0epdl922oqu6.fun","2g8rktp1fn9feqlhxexsw8o4snafapdh9dn1.fun","5rr03ujky5me3sjzvfosr6p89hk6wd34qamf.fun","jmtv4zqntu5oyprw4seqtn0dmjulf9nebif0.fun","xn--n8jwbyc5ezgnfpeyd3i0a3ow693bw65a.com","sharpen-free-design-generator.netlify.app","a-b-c-d-e-f7011d0w3j3aor0dczs5ctoo2zpz1t6bm5f49.fun","a-b-c-d-e-f9jeats0w5hf22jbbxcrpnq37qq6nbxjwypsy.fun","a-b-c-d-e-fla3m19lerkfex1z9kdr5pd4hx0338uwsvbjx.fun","a-b-f2muvhnjw63ruyhoxhhrd61eszezz6jdj4jy1-b-d-t-s.fun","a-b-f7mh86v4lirbwg7m4qiwwlk2e4za9uyngqy1u-b-d-t-s.fun","a-b-fjkt8v1pxgzrc3lqoaz8fh7pjgygf4zh3eqhl-b-d-t-s.fun","a-b-fnv7h0323ap2wfqj1ruyo8id2bcuoq4kufzon-b-d-t-s.fun","a-b-fqmze5gr05g3y4azx9adr9bd2eow7xoqwbuxg-b-d-t-s.fun","ulike-filter-sowe-canplay-rightlets-generate-themrandomlyl89u8.fun"];

const $scriptletFromRegexes$ = /* 8 */ ["-embed.c","^moon(?:-[a-z0-9]+)?-embed\\.com$","61,62","moonfile","^moonfile-[a-z0-9-]+\\.com$","61,62",".","^[0-9a-z]{5,8}\\.(art|cfd|fun|icu|info|live|pro|sbs|world)$","61,62","-mkay.co","^moo-[a-z0-9]+(-[a-z0-9]+)*-mkay\\.com$","61,62","file-","^file-[a-z0-9]+(-[a-z0-9]+)*-(moon|embed)\\.com$","61,62","-moo.com","^fle-[a-z0-9]+(-[a-z0-9]+)*-moo\\.com$","61,62","filemoon","^filemoon-[a-z0-9]+(?:-[a-z0-9]+)*\\.(?:com|xyz)$","61,62","tamilpri","(\\d{0,1})?tamilprint(\\d{1,2})?\\.[a-z]{3,7}","109,1543,2360"];

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
