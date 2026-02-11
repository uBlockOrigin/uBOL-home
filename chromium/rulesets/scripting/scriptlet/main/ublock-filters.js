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

function trustedPruneInboundObject(
    entryPoint = '',
    argPos = '',
    rawPrunePaths = '',
    rawNeedlePaths = ''
) {
    if ( entryPoint === '' ) { return; }
    let context = globalThis;
    let prop = entryPoint;
    for (;;) {
        const pos = prop.indexOf('.');
        if ( pos === -1 ) { break; }
        context = context[prop.slice(0, pos)];
        if ( context instanceof Object === false ) { return; }
        prop = prop.slice(pos+1);
    }
    if ( typeof context[prop] !== 'function' ) { return; }
    const argIndex = parseInt(argPos);
    if ( isNaN(argIndex) ) { return; }
    if ( argIndex < 1 ) { return; }
    const safe = safeSelf();
    const extraArgs = safe.getExtraArgs(Array.from(arguments), 4);
    const needlePaths = [];
    if ( rawPrunePaths !== '' ) {
        needlePaths.push(...safe.String_split.call(rawPrunePaths, / +/));
    }
    if ( rawNeedlePaths !== '' ) {
        needlePaths.push(...safe.String_split.call(rawNeedlePaths, / +/));
    }
    const stackNeedle = safe.initPattern(extraArgs.stackToMatch || '', { canNegate: true });
    const mustProcess = root => {
        for ( const needlePath of needlePaths ) {
            if ( objectFindOwnerFn(root, needlePath) === false ) {
                return false;
            }
        }
        return true;
    };
    context[prop] = new Proxy(context[prop], {
        apply: function(target, thisArg, args) {
            const targetArg = argIndex <= args.length
                ? args[argIndex-1]
                : undefined;
            if ( targetArg instanceof Object && mustProcess(targetArg) ) {
                let objBefore = targetArg;
                if ( extraArgs.dontOverwrite ) {
                    try {
                        objBefore = safe.JSON_parse(safe.JSON_stringify(targetArg));
                    } catch {
                        objBefore = undefined;
                    }
                }
                if ( objBefore !== undefined ) {
                    const objAfter = objectPruneFn(
                        objBefore,
                        rawPrunePaths,
                        rawNeedlePaths,
                        stackNeedle,
                        extraArgs
                    );
                    args[argIndex-1] = objAfter || objBefore;
                }
            }
            return Reflect.apply(target, thisArg, args);
        },
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

const $scriptletFunctions$ = /* 48 */
[trustedJsonEditXhrRequest,trustedJsonEditXhrResponse,trustedPruneInboundObject,adjustSetTimeout,jsonPruneFetchResponse,jsonPruneXhrResponse,trustedReplaceXhrResponse,trustedReplaceFetchResponse,trustedPreventDomBypass,jsonPrune,jsonEdit,setConstant,jsonlEditXhrResponse,noWindowOpenIf,abortCurrentScript,trustedSetConstant,trustedSuppressNativeMethod,abortOnStackTrace,preventRequestAnimationFrame,preventXhr,preventSetTimeout,preventFetch,removeAttr,trustedReplaceArgument,trustedOverrideElementMethod,trustedReplaceOutboundText,preventAddEventListener,abortOnPropertyRead,adjustSetInterval,preventSetInterval,abortOnPropertyWrite,noWebrtc,noEvalIf,disableNewtabLinks,preventInnerHTML,jsonEditXhrResponse,xmlPrune,m3uPrune,jsonEditFetchResponse,trustedPreventXhr,trustedPreventFetch,trustedJsonEdit,trustedEditInboundObject,spoofCSS,alertBuster,preventCanvas,trustedJsonEditFetchResponse,jsonEditFetchRequest];

const $scriptletArgs$ = /* 3057 */ ["[?..context.client.mainAppWebInfo.graftUrl^=\"https://www.youtube.com/watch\"]..playbackContext[?.contentPlaybackContext]+={\"adPlaybackContext\":{\"adType\":\"AD_TYPE_INSTREAM\"}}","propsToMatch","/\\/(player|get_watch)/","..playerConfig.granularVariableSpeedConfig+={\"minimumPlaybackRate\":25,\"maximumPlaybackRate\":200}","JSON.stringify","1","context.client.configInfo.appInstallData","playbackContext","playerRequest","[native code]","17000","0.001","adPlacements adSlots playerResponse.adPlacements playerResponse.adSlots [].playerResponse.adPlacements [].playerResponse.adSlots","","/player?","adPlacements adSlots playerResponse.adPlacements playerResponse.adSlots","/playlist?","/\\/player(?:\\?.+)?$/","\"adPlacements\"","\"no_ads\"","/playlist\\?list=|\\/player(?:\\?.+)?$|watch\\?[tv]=/","/\"adPlacements.*?([A-Z]\"\\}|\"\\}{2,4})\\}\\],/","/\"adPlacements.*?(\"adSlots\"|\"adBreakHeartbeatParams\")/gms","$1","player?","\"adSlots\"","/^\\W+$/","Node.prototype.appendChild","fetch","Request","JSON.parse","entries.[-].command.reelWatchEndpoint.adClientParams.isAd","/get_watch?","require.0.3.0.__bbox.require.[].3.1.__bbox.result.data.viewer.sideFeedUnit.nodes.[].new_adverts.nodes.[-].sponsored_data","data.viewer.sideFeedUnit.nodes.[].new_adverts.nodes.[-].sponsored_data","/graphql","..sideFeed.nodes.*[?.__typename==\"AdsSideFeedUnit\"]","Env.nxghljssj","false","require.0.3.0.__bbox.require.[].3.1.__bbox.result.data.serpResponse.results.edges.[-].rendering_strategy.view_model.story.sponsored_data.ad_id","..__bbox.result.data.node[?@.*.__typename==\"SponsoredData\"]",".data[?@.category==\"SPONSORED\"].node","..node[?.*.__typename==\"SponsoredData\"]",".data.viewer.news_feed.edges.*[?@.category==\"SPONSORED\"].node","console.clear","undefined","globalThis","break;case","WebAssembly","atob","pubadxtag","json:{\"divIds\":[]}","Document.prototype.getElementById","\"/^[A-Z][-0-9A-Z_a-z]{3,}$/\"","Document.prototype.querySelector","\"/^[#.][A-Z][-A-Z_a-z]+$/\"","\"/^\\[data-l/\"","Document.prototype.querySelectorAll","\"/^div\\[/\"","Document.prototype.getElementsByTagName","\"i\"","\"/^\\[data-[_a-z]{5,7}\\]$/\"","Array.from","\"/NodeList/\"","prevent","inlineScript","\"/^\\[d[a-z]t[a-z]?-[0-9a-z]{2,4}\\]$/\"","\"/^\\[[a-z]{2,3}-/\"","\"/^\\[data-[a-z]+src\\]$/\"","\"/^\\[[a-z]{5}-/\"","\"/^\\[[a-ce-z][a-z]+-/\"","\"/^\\[d[b-z][a-z]*-/\"","\"/[\\S\\s]*\\[[^d][\\S\\s]+\\][\\S\\s]*/\"","HTMLElement.prototype.querySelectorAll","\"/.*\\[[^imns].+\\].*/\"","Element.prototype.hasAttribute","\"/[\\S\\s]+/\"","Document.prototype.evaluate","\"/.*/\"","Document.prototype.createTreeWalker","aclib","/stackDepth:3\\s+get injectedScript.+inlineScript/","setTimeout","/stackDepth:3.+inlineScript:\\d{4}:1/","Date","MessageChannel","/stackDepth:2.+inlineScript/","_0x","/vast.php?","/click\\.com|preroll|native_render\\.js|acscdn/","length:10001","]();}","500","162.252.214.4","true","c.adsco.re","adsco.re:2087","/^ [-\\d]/","Math.random","parseInt(localStorage['\\x","adBlockDetected","Math","localStorage['\\x","-load.com/script/","length:101",")](this,...","3000-6000","(new Error(","/fd/ls/lsp.aspx",".offsetHeight>0","/^https:\\/\\/pagead2\\.googlesyndication\\.com\\/pagead\\/js\\/adsbygoogle\\.js\\?client=ca-pub-3497863494706299$/","data-instype","ins.adsbygoogle:has(> div#aswift_0_host)","stay","url:https://googleads.g.doubleclick.net/pagead/ads?client=ca-pub-3497863494706299 method:HEAD mode:no-cors","throttle","121","String.prototype.indexOf","0","json:\"/\"","condition","/premium","HTMLIFrameElement.prototype.remove","iframe[src^=\"https://googleads.g.doubleclick.net/pagead/ads?client=ca-pub-3497863494706299\"]","adblock","String.prototype.includes","json:\"gecmisi\"","googleads","json:\"googleads\"","gecmisi","++","g.doubleclick.net","length:100000","/Copyright|doubleclick$/","favicon","length:252","Headers.prototype.get","/.+/","image/png.","/^text\\/plain;charset=UTF-8$/","json:\"content-type\"","cache-control","Headers.prototype.has","summerday","length:10","{\"type\":\"cors\"}","/offsetHeight|loaded/","HTMLScriptElement.prototype.onerror","pagead2.googlesyndication.com/pagead/js/adsbygoogle.js method:HEAD","emptyStr","Node.prototype.contains","{\"className\":\"adsbygoogle\"}","abort","load","showFallbackModal","blocked","d.socdm.com","Keen","stream.insertion","/video/auth/media","akamaiDisableServerIpLookup","noopFunc","MONETIZER101.init","/outboundLink/","v.fwmrm.net/ad/g/","war:noop-vmap1.xml","DD_RUM.addAction","nads.createAd","trueFunc","t++","dvtag.getTargeting","ga","class|style","div[id^=\"los40_gpt\"]","huecosPBS.nstdX","null","config.globalInteractions.[].bsData","googlesyndication","DTM.trackAsyncPV","_satellite","{}","_satellite.getVisitorId","mobileanalytics","newPageViewSpeedtest","pubg.unload","generateGalleryAd","mediator","Object.prototype.subscribe","gbTracker","gbTracker.sendAutoSearchEvent","Object.prototype.vjsPlayer.ads","marmalade","setInterval","url:ipapi.co","doubleclick","isPeriodic","*","data-woman-ex","a[href][data-woman-ex]","data-trm-action|data-trm-category|data-trm-label",".trm_event","KeenTracking","network_user_id","cloudflare.com/cdn-cgi/trace","History","/(^(?!.*(Function|HTMLDocument).*))/","api","google.ima.OmidVerificationVendor","Object.prototype.omidAccessModeRules","googletag.cmd","skipAdSeconds","0.02","/recommendations.","_aps","/api/analytics","Object.prototype.setDisableFlashAds","DD_RUM.addTiming","chameleonVideo.adDisabledRequested","AdmostClient","analytics","native code","15000","(null)","5000","datalayer","[]","Object.prototype.isInitialLoadDisabled","lr-ingest.io","listingGoogleEETracking","dcsMultiTrack","urlStrArray","pa","Object.prototype.setConfigurations","/gtm.js","JadIds","Object.prototype.bk_addPageCtx","Object.prototype.bk_doJSTag","passFingerPrint","optimizely","optimizely.initialized","google_optimize","google_optimize.get","_gsq","_gsq.push","_gsDevice","iom","iom.c","_conv_q","_conv_q.push","google.ima.settings.setDisableFlashAds","pa.privacy","populateClientData4RBA","YT.ImaManager","UOLPD","UOLPD.dataLayer","__configuredDFPTags","URL_VAST_YOUTUBE","Adman","dplus","dplus.track","_satellite.track","/EzoIvent|TDELAY/","google.ima.dai","/froloa.js","adv","gfkS2sExtension","gfkS2sExtension.HTML5VODExtension","click","/event_callback=function\\(\\){window\\.location=t\\.getAttribute\\(\"href\"\\)/","AnalyticsEventTrackingJS","AnalyticsEventTrackingJS.addToBasket","AnalyticsEventTrackingJS.trackErrorMessage","initializeslideshow","b()","3000","ads","fathom","fathom.trackGoal","Origami","Origami.fastclick","document.querySelector","{\"value\": \".ad-placement-interstitial\"}",".easyAdsBox","jad","hasAdblocker","Sentry","Sentry.init","TRC","TRC._taboolaClone","fp","fp.t","fp.s","initializeNewRelic","turnerAnalyticsObj","turnerAnalyticsObj.setVideoObject4AnalyticsProperty","turnerAnalyticsObj.getVideoObject4AnalyticsProperty","optimizelyDatafile","optimizelyDatafile.featureFlags","fingerprint","fingerprint.getCookie","gform.utils","gform.utils.trigger","get_fingerprint","moatPrebidApi","moatPrebidApi.getMoatTargetingForPage","readyPromise","cpd_configdata","cpd_configdata.url","yieldlove_cmd","yieldlove_cmd.push","dataLayer.push","1.1.1.1/cdn-cgi/trace","_etmc","_etmc.push","freshpaint","freshpaint.track","ShowRewards","stLight","stLight.options","DD_RUM.addError","sensorsDataAnalytic201505","sensorsDataAnalytic201505.init","sensorsDataAnalytic201505.quick","sensorsDataAnalytic201505.track","s","s.tl","taboola timeout","clearInterval(run)","smartech","/TDELAY|EzoIvent/","sensors","sensors.init","/piwik-","2200","2300","sensors.track","googleFC","adn","adn.clearDivs","_vwo_code","live.streamtheworld.com/partnerIds","gtag","_taboola","_taboola.push","clicky","clicky.goal","WURFL","_sp_.config.events.onSPPMObjectReady","gtm","gtm.trackEvent","mParticle.Identity.getCurrentUser","_omapp.scripts.geolocation","{\"value\": {\"status\":\"loaded\",\"object\":null,\"data\":{\"country\":{\"shortName\":\"\",\"longName\":\"\"},\"administrative_area_level_1\":{\"shortName\":\"\",\"longName\":\"\"},\"administrative_area_level_2\":{\"shortName\":\"\",\"longName\":\"\"},\"locality\":{\"shortName\":\"\",\"longName\":\"\"},\"original\":{\"ip\":\"\",\"ip_decimal\":null,\"country\":\"\",\"country_eu\":false,\"country_iso\":\"\",\"city\":\"\",\"latitude\":null,\"longitude\":null,\"user_agent\":{\"product\":\"\",\"version\":\"\",\"comment\":\"\",\"raw_value\":\"\"},\"zip_code\":\"\",\"time_zone\":\"\"}},\"error\":\"\"}}","JSGlobals.prebidEnabled","i||(e(),i=!0)","2500","elasticApm","elasticApm.init","ga.sendGaEvent","adConfig","ads.viralize.tv","adobe","MT","MT.track","ClickOmniPartner","adex","adex.getAdexUser","Adkit","Object.prototype.shouldExpectGoogleCMP","apntag.refresh","pa.sendEvent","Munchkin","Munchkin.init","Event","ttd_dom_ready","ramp","appInfo.snowplow.trackSelfDescribingEvent","_vwo_code.init","adobePageView","adobeSearchBox","elements",".dropdown-menu a[href]","dapTracker","dapTracker.track","newrelic","newrelic.setCustomAttribute","adobeDataLayer","adobeDataLayer.push","Object.prototype._adsDisabled","Object.defineProperty","json:\"_adsEnabled\"","_adsDisabled","utag","utag.link","_satellite.kpCustomEvent","Object.prototype.disablecommercials","Object.prototype._autoPlayOnlyWithPrerollAd","Sentry.addBreadcrumb","sensorsDataAnalytic201505.register","freestar.newAdSlots","ytInitialPlayerResponse.playerAds","ytInitialPlayerResponse.adPlacements","ytInitialPlayerResponse.adSlots","playerResponse.adPlacements","playerResponse.adPlacements playerResponse.playerAds playerResponse.adSlots adPlacements playerAds adSlots important","reelWatchSequenceResponse.entries.[-].command.reelWatchEndpoint.adClientParams.isAd entries.[-].command.reelWatchEndpoint.adClientParams.isAd","url:/reel_watch_sequence?","Object","fireEvent","enabled","force_disabled","hard_block","header_menu_abvs","10000","adsbygoogle","nsShowMaxCount","toiads","objVc.interstitial_web","adb","navigator.userAgent","require.0.3.0.__bbox.require.[].3.1.__bbox.result.data.serpResponse.results.edges.[-].relay_rendering_strategy.view_model.story.sponsored_data.ad_id","/\\{\"node\":\\{\"role\":\"SEARCH_ADS\"[^\\n]+?cursor\":[^}]+\\}/g","/api/graphql","/\\{\"node\":\\{\"__typename\":\"MarketplaceFeedAdStory\"[^\\n]+?\"cursor\":(?:null|\"\\{[^\\n]+?\\}\"|[^\\n]+?MarketplaceSearchFeedStoriesEdge\")\\}/g","/\\{\"node\":\\{\"__typename\":\"VideoHomeFeedUnitSectionComponent\"[^\\n]+?\"sponsored_data\":\\{\"ad_id\"[^\\n]+?\"cursor\":null\\}/","require.0.3.0.__bbox.require.[].3.1.__bbox.result.data.node","require.0.3.0.__bbox.require.[].3.1.__bbox.result.data.node.story.sponsored_data.ad_id","require.0.3.0.__bbox.require.[].3.1.__bbox.result.data.marketplace_search.feed_units.edges.[-].node.story.sponsored_data.ad_id","require.0.3.0.__bbox.require.[].3.1.__bbox.result.data.viewer.marketplace_feed_stories.edges.[-].node.story.sponsored_data.ad_id","data.viewer.instream_video_ads data.scrubber",".data.viewer.marketplace_feed_stories.edges.*[?@.node.__typename==\"MarketplaceFeedAdStory\"]","__eiPb","detector","_ml_ads_ns","jQuery","cookie","showAds","adBlockerDetected","show","SmartAdServerASMI","repl:/\"adBlockWallEnabled\":true/\"adBlockWallEnabled\":false/","adBlockWallEnabled","_sp_._networkListenerData","SZAdBlockDetection","_sp_.config","AntiAd.check","open","/^/","showNotice","_sp_","$","_sp_.mms.startMsg","retrievalService","admrlWpJsonP","yafaIt","LieDetector","ClickHandler","IsAdblockRequest","InfMediafireMobileFunc","1000","newcontent","ExoLoader.serve","Fingerprint2","request=adb","AdController","popupBlocked","/\\}\\s*\\(.*?\\b(self|this|window)\\b.*?\\)/","stop","onload","ga.length","btoa","adcashMacros","grecaptcha.ready","BACK","jwplayer.utils.Timer","adblock_added","admc","exoNoExternalUI38djdkjDDJsio96","String.prototype.charCodeAt","ai_","window.open","SBMGlobal.run.pcCallback","SBMGlobal.run.gramCallback","(!o)","(!i)","decodeURIComponent","shift","/0x|google|ecoded|==/","Object.prototype.hideAds","Object.prototype._getSalesHouseConfigurations","player-feedback","samInitDetection","decodeURI","Date.prototype.toUTCString","Adcash","lobster","openLity","ad_abblock_ad","String.fromCharCode","PopAds","AdBlocker","Adblock","addEventListener","displayMessage","runAdblock","document.createElement","TestAdBlock","ExoLoader","loadTool","cticodes","imgadbpops","document.getElementById","document.write","redirect","4000","sadbl","adblockcheck","doSecondPop","arrvast","onclick","RunAds","/^(?:click|mousedown)$/","bypassEventsInProxies","jQuery.adblock","test-block","adi","ads_block","blockAdBlock","blurred","exoOpts","doOpen","prPuShown","flashvars.adv_pre_src","showPopunder","IS_ADBLOCK","page_params.holiday_promo","__NA","ads_priv","ab_detected","adsEnabled","document.dispatchEvent","t4PP","href|target","a[href=\"https://imgprime.com/view.php\"][target=\"_blank\"]","complete","String.prototype.charAt","sc_adv_out","pbjs.libLoaded","mz","ad_blocker","AaDetector","_abb","puShown","/doOpen|popundr/","pURL","readyState","serve","stop()","Math.floor","AdBlockDetectorWorkaround","apstagLOADED","jQuery.hello","/Adb|moneyDetect/","isShowingAd","VikiPlayer.prototype.pingAbFactor","player.options.disableAds","__htapop","exopop","/^(?:load|click)$/","popMagic","script","atOptions","XMLHttpRequest","flashvars.adv_pre_vast","flashvars.adv_pre_vast_alt","x_width","getexoloader","disableDeveloper","oms.ads_detect","Blocco","2000","_site_ads_ns","hasAdBlock","pop","ltvModal","luxuretv.config","popns","pushiserve","creativeLoaded-","exoframe","/^load[A-Za-z]{12,}/","rollexzone","ALoader","Object.prototype.AdOverlay","tkn_popunder","detect","dlw","40000","ctt()","can_run_ads","test","adsBlockerDetector","NREUM","pop3","__ads","ready","popzone","FlixPop.isPopGloballyEnabled","falseFunc","/exo","ads.pop_url","checkAdblockUser","checkPub","6000","tabUnder","check_adblock","l.parentNode.insertBefore(s","_blank","ExoLoader.addZone","encodeURIComponent","isAdBlockActive","raConf","__ADX_URL_U","tabunder","RegExp","POSTBACK_PIXEL","mousedown","preventDefault","'0x","Aloader","advobj","replace","popTimes","addElementToBody","phantomPopunders","$.magnificPopup.open","adsenseadBlock","stagedPopUnder","seconds","clearInterval","CustomEvent","exoJsPop101","popjs.init","-0x","closeMyAd","smrtSP","adblockSuspected","nextFunction","250","xRds","cRAds","myTimer","1500","advertising","countdown","tiPopAction","rmVideoPlay","r3H4","disasterpingu","document.querySelectorAll","AdservingModule","backRedirect","adv_pre_duration","adv_post_duration","/^(click|mousedown|mousemove|touchstart|touchend|touchmove)/","system.popunder","ab1","ab2","hidekeep","pp12","__Y","App.views.adsView.adblock","document.createEvent","ShowAdbblock","style","clientHeight","flashvars.adv_pause_html","/^(?:click|mousedown|mousemove|touchstart|touchend|touchmove)$/","BOOTLOADER_LOADED","PerformanceLongTaskTiming","proxyLocation","Int32Array","$.fx.off","popMagic.init","/DOMContentLoaded|load/","y.readyState","document.getElementsByTagName","smrtSB","href","#opfk","byepopup","awm","location","adBlockEnabled","getCookie","history.go","dataPopUnder","/error|canplay/","(t)","EPeventFire","additional_src","300","____POP","openx","is_noadblock","window.location","()","hblocked","AdBlockUtil","css_class.show","/adbl/i","CANG","DOMContentLoaded","adlinkfly","updato-overlay","innerText","/amazon-adsystem|example\\.com/","document.cookie","|","attr","scriptSrc","SmartWallSDK","segs_pop","alert","8000","cxStartDetectionProcess","Abd_Detector","counter","paywallWrapper","isAdBlocked","/enthusiastgaming|googleoptimize|googletagmanager/","css_class","ez","path","*.adserverDomain","10","$getWin","/doubleclick|googlesyndication/","__NEXT_DATA__.props.clientConfigSettings.videoAds","blockAds","_ctrl_vt.blocked.ad_script","registerSlideshowAd","50","debugger","mm","shortener","require","/^(?!.*(einthusan\\.io|yahoo|rtnotif|ajax|quantcast|bugsnag))/","caca","getUrlParameter","trigger","Ok","given","getScriptFromCss","method:HEAD","safelink.adblock","goafricaSplashScreenAd","try","/adnxs.com|onetag-sys.com|teads.tv|google-analytics.com|rubiconproject.com|casalemedia.com/","openPopunder","0x","xhr.prototype.realSend","initializeCourier","userAgent","_0xbeb9","1800","popAdsClickCount","redirectPage","adblocker","ad_","azar","Pop","_wm","flashvars.adv_pre_url","flashvars.protect_block","flashvars.video_click_url","popunderSetup","https","popunder","preventExit","hilltop","jsPopunder","vglnk","aadblock","S9tt","popUpUrl","Notification","srcdoc","iframe","readCookieDelit","trafficjunky","checked","input#chkIsAdd","adSSetup","adblockerModal","750","adBlock","spoof","html","capapubli","Aloader.serve","mouseup","sp_ad","app_vars.force_disable_adblock","adsHeight","onmousemove","button","yuidea-","adsBlocked","_sp_.msg.displayMessage","pop_under","location.href","_0x32d5","url","blur","CaptchmeState.adb","glxopen","adverts-top-container","disable","200","/googlesyndication|outbrain/","CekAab","timeLeft","testadblock","document.addEventListener","google_ad_client","UhasAB","adbackDebug","googletag","performance","rbm_block_active","adNotificationDetected","SubmitDownload1","show()","user=null","getIfc","!bergblock","overlayBtn","adBlockRunning","htaUrl","_pop","n.trigger","CnnXt.Event.fire","_ti_update_user","&nbsp","document.body.appendChild","BetterJsPop","/.?/","vastAds","setExoCookie","adblockDetected","frg","abDetected","target","I833","urls","urls.0","Object.assign","KeepOpeningPops","bindall","ad_block","time","KillAdBlock","read_cookie","ReviveBannerInterstitial","eval","GNCA_Ad_Support","checkAdBlocker","midRoll","adBlocked","Date.now","AdBlock","iframeTestTimeMS","runInIframe","deployads","='\\x","Debugger","stackDepth:3","warning","100","_checkBait","[href*=\"ccbill\"]","close_screen","onerror","dismissAdBlock","VMG.Components.Adblock","adblock_popup","FuckAdBlock","isAdEnabled","promo","_0x311a","mockingbird","adblockDetector","crakPopInParams","console.log","hasPoped","Math.round","h1mm.w3","banner","google_jobrunner","blocker_div","onscroll","keep-ads","#rbm_block_active","checkAdblock","checkAds","#DontBloxMyAdZ","#pageWrapper","adpbtest","initDetection","check","isBlanketFound","showModal","myaabpfun","sec","adFilled","//","NativeAd","gadb","damoh.ani-stream.com","showPopup","mouseout","clientWidth","adrecover","checkadBlock","gandalfads","Tool","clientSide.adbDetect","HTMLAnchorElement.prototype.click","anchor.href","cmnnrunads","downloadJSAtOnload","run","ReactAds","phtData","adBlocker","StileApp.somecontrols.adBlockDetected","killAdBlock","innerHTML","google_tag_data","readyplayer","noAdBlock","autoRecov","adblockblock","popit","popstate","noPop","Ha","rid","[onclick^=\"window.open\"]","tick","spot","adsOk","adBlockChecker","_$","12345","flashvars.popunder_url","urlForPopup","isal","/innerHTML|AdBlock/","checkStopBlock","overlay","popad","!za.gl","document.hidden","adblockEnabled","ppu","adspot_top","is_adblocked","/offsetHeight|google|Global/","an_message","Adblocker","pogo.intermission.staticAdIntermissionPeriod","localStorage","timeoutChecker","t","my_pop","nombre_dominio",".height","!?safelink_redirect=","document.documentElement","break;case $.","time.html","block_detected","/^(?:mousedown|mouseup)$/","ckaduMobilePop","tieneAdblock","popundr","obj","ujsmediatags method:HEAD","adsAreBlocked","spr","document.oncontextmenu","document.onmousedown","document.onkeydown","compupaste","redirectURL","bait","!atomtt","TID","!/download\\/|link/","Math.pow","adsanity_ad_block_vars","pace","ai_adb","openInNewTab",".append","!!{});","runAdBlocker","setOCookie","document.getElementsByClassName","td_ad_background_click_link","initBCPopunder","flashvars.logo_url","flashvars.logo_text","nlf.custom.userCapabilities","displayCookieWallBanner","adblockinfo","JSON","pum-open","svonm","#clickfakeplayer","/\\/VisitorAPI\\.js|\\/AppMeasurement\\.js/","popjs","/adblock/i","count","LoadThisScript","showPremLite","closeBlockerModal","detector_launch","5","keydown","Popunder","ag_adBlockerDetected","document.head.appendChild","bait.css","Date.prototype.toGMTString","initPu","jsUnda","ABD","adBlockDetector.isEnabled","adtoniq","__esModule","break","myFunction_ads","areAdsDisplayed","gkAdsWerbung","pop_target","onLoadEvent","is_banner","$easyadvtblock","mfbDetect","!/^https:\\/\\/sendvid\\.com\\/[0-9a-z]+$/","Pub2a","length:2001","block","console","send","ab_cl","V4ss","popunders","visibility","show_dfp_preroll","show_youtube_preroll","brave_load_popup","pageParams.dispAds","PrivateMode","scroll","document.bridCanRunAds","doads","pu","advads_passive_ads","tmohentai","pmc_admanager.show_interrupt_ads","ai_adb_overlay","AlobaidiDetectAdBlock","showMsgAb","Advertisement","type","input[value^=\"http\"]","wutimeBotPattern","adsbytrafficjunkycontext","abp1","$REACTBASE_STATE.serverModules.push","popup_ads","ipod","pr_okvalida","scriptwz_url","enlace","Popup","$.ajax","appendChild","Exoloader","offsetWidth","zomap.de","/$|adBlock/","adblockerpopup","adblockCheck","checkVPN","cancelAdBlocker","Promise","setNptTechAdblockerCookie","for-variations","!api?call=","cnbc.canShowAds","ExoSupport","/^(?:click|mousedown|mouseup)$/","di()","getElementById","loadRunative","value.media.ad_breaks","onAdVideoStart","zonefile","pwparams","fuckAdBlock","firefaucet","mark","stop-scrolling","detectAdBlock","Adv","blockUI","adsafeprotected","'\\'","oncontextmenu","Base64","disableItToContinue","google","parcelRequire","mdpDeBlocker","flashvars.adv_start_html","mobilePop","/_0x|debug/","my_inter_listen","EviPopunder","adver","tcpusher","preadvercb","document.readyState","prerollMain","popping","adsrefresh","/ai_adb|_0x/","canRunAds",".submit","mdp_deblocker","bi()","#divDownload","modal","dclm_ajax_var.disclaimer_redirect_url","$ADP","load_pop_power","MG2Loader","/SplashScreen|BannerAd/","Connext","break;","checkTarget","i--","Time_Start","blocker","adUnits","afs_ads","b2a","data.[].vast_url","deleted","MutationObserver","ezstandalone.enabled","damoh","foundation.adPlayer.bitmovin","homad-global-configs","weltConfig.switches.videoAdBlockBlocker","XMLHttpRequest.prototype.open","svonm.com","/\"enabled\":\\s*true/","\"enabled\":false","adReinsertion","window.__gv_org_tfa","Object.prototype.adReinsertion","getHomadConfig","timeupdate","testhide","getComputedStyle","doOnce","popi","googlefc","angular","detected","{r()","450","ab","go_popup","Debug","offsetHeight","length","noBlocker","/youboranqs01|spotx|springserve/","js-btn-skip","r()","adblockActivated","penci_adlbock","Number.isNaN","fabActive","gWkbAdVert","noblock","wgAffiliateEnabled","!gdrivedownload","document.onclick","daCheckManager","prompt","data-popunder-url","saveLastEvent","friendlyduck",".post.movies","purple_box","detectAdblock","adblockDetect","adsLoadable","allclick_Public","a#clickfakeplayer",".fake_player > [href][target]",".link","'\\x","initAdserver","splashpage.init","window[_0x","checkSiteNormalLoad","/blob|injectedScript/","ASSetCookieAds","___tp","STREAM_CONFIGS",".clickbutton","Detected","XF","hide","mdp",".test","backgroundBanner","interstitial","letShowAds","antiblock","ulp_noadb",".show","url:!luscious.net","Object.prototype.adblock_detected","afterOpen","AffiliateAdBlock",".appendChild","adsbygoogle.loaded","ads_unblocked","xxSetting.adBlockerDetection","ppload","RegAdBlocking","a.adm","checkABlockP","Drupal.behaviors.adBlockerPopup","ADBLOCK","fake_ad","samOverlay","!refine?search","native","koddostu_com_adblock_yok","player.ads.cuePoints","adthrive","!t.me","bADBlock","better_ads_adblock","tie","Adv_ab","ignore_adblock","$.prototype.offset","ea.add","ad_pods.0.ads.0.segments.0.media ad_pods.1.ads.1.segments.1.media ad_pods.2.ads.2.segments.2.media ad_pods.3.ads.3.segments.3.media ad_pods.4.ads.4.segments.4.media ad_pods.5.ads.5.segments.5.media ad_pods.6.ads.6.segments.6.media ad_pods.7.ads.7.segments.7.media ad_pods.8.ads.8.segments.8.media","mouseleave","NativeDisplayAdID","contador","Light.Popup.create","t()","zendplace","mouseover","event.triggered","_cpp","sgpbCanRunAds","pareAdblock","ppcnt","data-ppcnt_ads","main[onclick]","Blocker","AdBDetected","navigator.brave","document.activeElement","{ \"value\": {\"tagName\": \"IFRAME\" }}","runAt","2","clickCount","body","hasFocus","{\"value\": \"Mozilla/5.0 (iPhone14,3; U; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/602.1.50 (KHTML, like Gecko) Version/10.0 Mobile/19A346 Safari/602.1\"}","timeSec","getlink","/wpsafe|wait/","timer","/getElementById|gotoo/","tid","ppuQnty","stopCountdown","web_share_ads_adsterra_config wap_short_link_middle_page_ad wap_short_link_middle_page_show_time data.ads_cpm_info","value","Object.prototype.isAllAdClose","DOMNodeRemoved","data.meta.require_addon data.meta.require_captcha data.meta.require_notifications data.meta.require_og_ads data.meta.require_video data.meta.require_web data.meta.require_related_topics data.meta.require_custom_ad_step data.meta.og_ads_offers data.meta.addon_url data.displayAds data.linkCustomAdOffers","data.getDetailPageContent.linkCustomAdOffers.[-].title","data.getTaboolaAds.*","/chp_?ad/","/adblock|isRequestPresent/","bmcdn6","window.onload","devtools","documentElement.innerHTML","{\"type\": \"opaque\"}","document.hasFocus","/adoto|\\/ads\\/js/","htmls","?key=","isRequestPresent","xmlhttp","data-ppcnt_ads|onclick","#main","#main[onclick*=\"mainClick\"]",".btn-success.get-link","fouty","disabled",".btn-primary","focusOut","googletagmanager","shortcut","suaads","/\\$\\('|ai-close/","bypass",".MyAd > a[target=\"_blank\"]","antiAdBlockerHandler","onScriptError","php","AdbModel","protection","div_form","private","navigator.webkitTemporaryStorage.queryUsageAndQuota","contextmenu","visibilitychange","remainingSeconds","0.1","Math.random() <= 0.15","checkBrowser","bypass_url","1600","class","#rtg-snp21","adsby","showadas","submit","validateForm","throwFunc","/pagead2\\.googlesyndication\\.com|inklinkor\\.com/","EventTarget.prototype.addEventListener","delete window","/countdown--|getElementById/","SMart1","/counter|wait/","tempat.org","doTest","checkAdsBlocked",".btn","interval","navigator","FingerprintJS","!buzzheavier.com","1e3*","/veepteero|tag\\.min\\.js/","aSl.gcd","/\\/4.+ _0/","chp_ad","document.documentElement.lang.toLowerCase","[onclick^=\"pop\"]","Light.Popup","window.addEventListener","json:\"load\"","maxclick","#get-link-button","Swal.fire","surfe.pro","czilladx","adsbygoogle.js","!devuploads.com","war:googlesyndication_adsbygoogle.js","window.adLink","google_srt","json:0.61234","checkAdBlock","shouldOpenPopUp","displayAdBlockerMessage","pastepc","detectedAdblock","isTabActive","a[target=\"_blank\"]","[href*=\"survey\"]","adForm","/adsbygoogle|googletagservices/","clicked","notifyExec","fairAdblock","data.value data.redirectUrl data.bannerUrl","/admin/settings","!gcloud","script[data-domain=","push",".call(null)","ov.advertising.tisoomi.loadScript","abp","userHasAdblocker","embedAddefend","/injectedScript.*inlineScript/","/(?=.*onerror)(?=^(?!.*(https)))/","/injectedScript|blob/","hommy.mutation.mutation","hommy","hommy.waitUntil","ACtMan","video.channel","/(www\\.[a-z]{8,16}\\.com|cloudfront\\.net)\\/.+\\.(css|js)$/","/popundersPerIP[\\s\\S]*?Date[\\s\\S]*?getElementsByTagName[\\s\\S]*?insertBefore/","/www|cloudfront/","shouldShow","matchMedia","target.appendChild(s","l.appendChild(s)","/^data:/","Document.prototype.createElement","\"script\"","litespeed/js","myEl","ExoDetector","!embedy","Pub2","/loadMomoVip|loadExo|includeSpecial/","loadNeverBlock","flashvars.mlogo","adver.abFucker.serve","displayCache","vpPrerollVideo","SpecialUp","zfgloaded","parseInt","/btoa|break/","/\\st\\.[a-zA-Z]*\\s/","/(?=^(?!.*(https)))/","key in document","zfgformats","zfgstorage","zfgloadedpopup","/\\st\\.[a-zA-Z]*\\sinlineScript/","zfgcodeloaded","outbrain","/inlineScript|stackDepth:1/","wpadmngr.com","adserverDomain",".js?_=","/https|stackDepth:3/","HTMLAllCollection","shown_at","!/d/","PlayerConfig.config.CustomAdSetting","affiliate","_createCatchAllDiv","/click|mouse/","document","PlayerConfig.trusted","PlayerConfig.config.AffiliateAdViewLevel","3","univresalP","puTSstrpcht","!/prcf.fiyar|themes|pixsense|.jpg/","hold_click","focus","js_func_decode_base_64","decodeURIComponent(atob","/(?=^(?!.*(https|injectedScript)))/","jQuery.popunder","\"/chp_?ad/\"","AdDetect","ai_front","abDetectorPro","/googlesyndication|doubleclick/","{\"type\": \"cors\"}","src=atob","\"/[0-9a-f]+-modal/\"","/\\/[0-9a-f]+\\.js\\?ver=/","tie.ad_blocker_detector","admiral","__cmpGdprAppliesGlobally","..admiralScriptCode",".props[?.id==\"admiral-bootstrap\"].dangerouslySetInnerHTML","decodeURI(decodeURI","error","gnt.x.uam","interactive","g$.hp","json:{\"gnt-d-adm\":true,\"gnt-d-bt\":true}","gnt.u.z","__INITIAL_DATA__.siteData.admiralScript",".cmd.unshift","/ad\\.doubleclick\\.net|static\\.dable\\.io/","error-report.com","loader.min.js","content-loader.com","()=>","HTMLScriptElement.prototype.setAttribute","/error-report|new Promise/","ads.adthrive.com","objAd.loadAdShield","window.myAd.runAd","RT-1562-AdShield-script-on-Huffpost","{\"value\": \"(function(){let link=document.createElement('link');link.rel='stylesheet';link.href='//image.ygosu.com/style/main.css';document.head.appendChild(link)})()\"}","error-report","{\"value\": \"(function(){let link=document.createElement('link');link.rel='stylesheet';link.href='https://loawa.com/assets/css/loawa.min.css';document.head.appendChild(link)})()\"}","/07c225f3\\.online|content-loader\\.com|css-load\\.com|html-load\\.com/","html-load.com","\"data-sdk\"","abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789+/=","AHE.is_member","USER.features.ad_shield","AppBootstrapData.config.adshieldAdblockRecovery","AppState.reduxState.features.adshieldAdblockRecovery","..adshieldAdblockRecovery=false","/fetchappbootstrapdata","HTMLScriptElement.prototype.onload","__INITIAL_STATE__.config.theme.ads.isAdBlockerEnabled","generalTimeLeft","__INITIAL_STATE__.gameLists.gamesNoPrerollIds.indexOf","DoodPop","__aaZoneid","#over","document.ontouchend","Array.prototype.shift","/^.+$/s","HTMLElement.prototype.click","premium","'1'","playID","openNewTab","download-wrapper","MDCore.adblock","Please wait","pop_init","adsbyjuicy","prerolls midrolls postrolls comm_ad house_ad pause_ad block_ad end_ad exit_ad pin_ad content_pool vertical_ad elements","/detail","adClosedTimestamp","data.item.[-].business_info.ad_desc","/feed/rcmd","killads","NMAFMediaPlayerController.vastManager.vastShown","reklama-flash-body","fakeAd","adUrl",".azurewebsites.net","assets.preroll assets.prerollDebug","/stream-link","/doubleclick|ad-delivery|googlesyndication/","__NEXT_DATA__.runtimeConfig._qub_sdk.qubConfig.video.adBlockerDetectorEnabled","data.[].relationships.advert data.[].relationships.vast","offers","tampilkanUrl",".layers.*[?.metadata.name==\"POI_Ads\"]","/PCWeb_Real.json","/gaid=","war:noop-vast2.xml","consent","arePiratesOnBoard","__INIT_CONFIG__.randvar","instanceof Event","await _0x","json:\"Blog1\"","ad-top","adblock.js","adbl",".getComputedStyle","STORAGE2","app_advert","googletag._loaded_","closeBanner","NoTenia","vast popup adblock",".offsetHeight","!asyaanimeleri.",".*[?.linkurl^=\"http\"]","initPop","app._data.ads","message","adsense","reklamlar","json:[{\"sure\":\"0\"}]","/api/video","skipAdblockCheck","/srvtrck|adligature|quantserve|outbrain/","createAgeModal","Object[_0x","adsPlayer","pubAdsService","offsetLeft","config.pauseInspect","appContext.adManager.context.current.adFriendly","HTMLIFrameElement",".style","dsanity_ad_block_vars","show_download_links","downloadbtn","height","blockAdBlock._options.baitClass","/AdBlock/i","charAt","fadeIn","checkAD","latest!==","detectAdBlocker","#downloadvideo",".ready","/'shift'|break;/","document.blocked_var","____ads_js_blocked","wIsAdBlocked","WebSite.plsDisableAdBlock","css","videootv","ads_blocked","samDetected","Drupal.behaviors.agBlockAdBlock","NoAdBlock","mMCheckAgainBlock","countClicks","settings.adBlockerDetection","eabdModal","ab_root.show","gaData","wrapfabtest","fuckAdBlock._options.baitClass","$ado","/ado/i","app.js","popUnderStage","samAdBlockAction","googlebot","advert","bscheck.adblocker","qpcheck.ads","tmnramp","!sf-converter.com","clickAds.banner.urls","json:[{\"url\":{\"limit\":0,\"url\":\"\"}}]","ad","show_ads","ignielAdBlock","isContentBlocked","GetWindowHeight","/pop|wm|forceClick/","CloudflareApps.installs.Ik7rmQ4t95Qk.options.measureDomain","detectAB1",".init","ActiveXObject","uBlockOriginDetected","/_0x|localStorage\\.getItem/","google_ad_status","googletag._vars_","googletag._loadStarted_","google_unique_id","google.javascript","google.javascript.ads","google_global_correlator","ads.servers.[].apiAddress","paywallGateway.truncateContent","Constant","u_cfg","adBlockDisabled","__NEXT_DATA__.props.pageProps.adVideo","blockedElement","/ad","onpopstate","popState","adthrive.config","breaks interstitials info","interstitials","xpath(//*[name()=\"Period\"][.//*[name()=\"AdaptationSet\"][@contentType=\"video\"][not(@bitstreamSwitching=\"true\")]])",".mpd","ad_slots","plugins.dfp","lura.live/prod/","/prog.m3u8","__C","ad-block-popup","exitTimer","innerHTML.replace","ajax","abu","countDown","HTMLElement.prototype.insertAdjacentHTML","_ads","eabpDialog","TotemToolsObject","puHref","flashvars.adv_postpause_vast","/Adblock|_ad_/","advads_passive_groups","GLX_GLOBAL_UUID_RESULT","f.parentNode.removeChild(f)","swal","keepChecking","t.pt","clickAnywhere urls","a[href*=\"/ads.php\"][target=\"_blank\"]","nitroAds","class.scroll","/showModal|isBlanketFound/","disableDeveloperTools","[onclick*=\"window.open\"]","openWindow","Check","checkCookieClick","readyToVote","12000","target|href","a[href^=\"//\"]","wpsite_clickable_data","insertBefore","offsetParent","meta.advertise","next","vidorev_jav_plugin_video_ads_object.vid_ads_m_video_ads","data.attributes.config.freewheel data.attributes.config.featureFlags.dPlayer","data.attributes.ssaiInfo.forecastTimeline data.attributes.ssaiInfo.vendorAttributes.nonLinearAds data.attributes.ssaiInfo.vendorAttributes.videoView data.attributes.ssaiInfo.vendorAttributes.breaks.[].ads.[].adMetadata data.attributes.ssaiInfo.vendorAttributes.breaks.[].ads.[].adParameters data.attributes.ssaiInfo.vendorAttributes.breaks.[].timeOffset","xpath(//*[name()=\"MPD\"][.//*[name()=\"BaseURL\" and contains(text(),'dash_clear_fmp4') and contains(text(),'/a/')]]/@mediaPresentationDuration | //*[name()=\"Period\"][./*[name()=\"BaseURL\" and contains(text(),'dash_clear_fmp4') and contains(text(),'/a/')]])","ssaiInfo","adsProvider.init","SDKLoaded","css_class.scroll","mnpwclone","0.3","7000","[href*=\"nihonjav\"]","/null|Error/","bannersRequest","vads","a[href][onclick^=\"getFullStory\"]","!newdmn","popUp","devtoolschange","rccbase_styles","POPUNDER_ENABLED","plugins.preroll","DHAntiAdBlocker","/out.php","ishop_codes","#advVid","location.replace","showada","showax","adp","__tnt","compatibility","popundrCheck","history.replaceState","rexxx.swp","constructor","p18","clickHandler","onbeforeunload","window.location.href","prebid","asc","json:{\"cmd\": [null], \"que\": [null], \"wrapperVersion\": \"6.19.0\", \"refreshQue\": {\"waitDelay\": 3000, \"que\": []}, \"isLoaded\": true, \"bidderSettings\": {}, \"libLoaded\": true, \"version\": \"v9.20.0\", \"installedModules\": [], \"adUnits\": [], \"aliasRegistry\": {}, \"medianetGlobals\": {}}","google_tag_manager","json:{ \"G-Z8CH48V654\": { \"_spx\": false, \"bootstrap\": 1704067200000, \"dataLayer\": { \"name\": \"dataLayer\" } }, \"SANDBOXED_JS_SEMAPHORE\": 0, \"dataLayer\": { \"gtmDom\": true, \"gtmLoad\": true, \"subscribers\": 1 }, \"sequence\": 1 }","ADBLOCKED","Object.prototype.adsEnabled","removeChild","ai_run_scripts","clearInterval(i)","marginheight","ospen","pu_count","mypop","adblock_use","Object.prototype.adblockFound","download","1100","createCanvas","bizpanda","Q433","/pop|_blank/","movie.advertising.ad_server playlist.movie.advertising.ad_server","unblocker","playerAdSettings.adLink","playerAdSettings.waitTime","computed","manager","window.location.href=link","moonicorn.network","/dyn\\.ads|loadAdsDelayed/","xv.sda.pp.init","onreadystatechange","skmedix.com","skmedix.pl","MediaContainer.Metadata.[].Ad","doubleclick.com","opaque","_init","href|target|data-ipshover-target|data-ipshover|data-autolink|rel","a[href^=\"https://thumpertalk.com/link/click/\"][target=\"_blank\"]","/touchstart|mousedown|click/","latest","secs","event.simulate","isAdsLoaded","adblockerAlert","/^https?:\\/\\/redirector\\.googlevideo\\.com.*/","/.*m3u8/","cuepoints","cuepoints.[].start cuepoints.[].end cuepoints.[].start_float cuepoints.[].end_float","Period[id*=\"-roll-\"][id*=\"-ad-\"]","pubads.g.doubleclick.net/ondemand","/ads/banner","reachGoal","Element.prototype.attachShadow","Adb","randStr","SPHMoverlay","#continue","ai","timer.remove","popupBlocker","afScript","Object.prototype.parseXML","Object.prototype.blackscreenDuration","Object.prototype.adPlayerId","/ads",":visible","mMcreateCookie","downloadButton","SmartPopunder.make","readystatechange","document.removeEventListener",".button[href^=\"javascript\"]","animation","status","adsblock","pub.network","timePassed","timeleft","input[id=\"button1\"][class=\"btn btn-primary\"][disabled]","t(a)",".fadeIn()","result","evolokParams.adblock","[src*=\"SPOT\"]","asap stay",".pageProps.__APOLLO_STATE__.*[?.__typename==\"AotSidebar\"]","/_next/data","pageProps.__TEMPLATE_QUERY_DATA__.aotFooterWidgets","props.pageProps.data.aotHomepageTopBar props.pageProps.data.aotHomepageTopBar props.pageProps.data.aotHeaderAdScripts props.pageProps.data.aotFooterWidgets","counter--","daadb","l-1","_htas","/width|innerHTML/","magnificPopup","skipOptions","method:HEAD url:doubleclick.net","style.display","tvid.in/log","1150","0.5","testadtags ad","document.referrer","quadsOptions","history.pushState","loadjscssfile","load_ads","/debugger|offsetParent/","/ads|imasdk/","6","__NEXT_DATA__.props.pageProps.adsConfig","make_rand_div","new_config.timedown","catch","google_ad","response.timeline.elements.[-].advertiserId","url:/api/v2/tabs/for_you","timercounter","document.location","innerHeight","cainPopUp","#timer","!bowfile.com","cloudfront.net/?","href|target|data-onclick","a[id=\"dl\"][data-onclick^=\"window.open\"]","a.getAttribute(\"data-ad-client\")||\"\"","truex","truex.client","answers","!display","/nerveheels/","No","foreverJQ","/document.createElement|stackDepth:2/","container.innerHTML","top-right","hiddenProxyDetected","SteadyWidgetSettings.adblockActive","temp","inhumanity_pop_var_name","url:googlesyndication","enforceAdStatus","app_vars.please_disable_adblock","hashchange","history.back","starPop","Element.prototype.matches","litespeed","__PoSettings","HTMLSelectElement","youtube","aTagChange","Object.prototype.ads","display","a[onclick^=\"setTimeout\"]","detectBlockAds","eb","/analytics|livestats/","/nextFunction|2000/","resource_response.data.[-].pin_promotion_id resource_response.data.results.[-].pin_promotion_id","initialReduxState.pins.{-}.pin_promotion_id initialReduxState.resources.UserHomefeedResource.*.data.[-].pin_promotion_id","player","mahimeta","__htas","chp_adblock_browser","/adb/i","tdBlock",".t-out-span [href*=\"utm_source\"]","src",".t-out-span [src*=\".gif\"]","notifier","penciBlocksArray",".panel-body > .text-center > button","modal-window","isScrexed","fallbackAds","popurl","SF.adblock","() => n(t)","() => t()","startfrom","Math.imul","checkAdsStatus","wtg-ads","/ad-","void 0","/__ez|window.location.href/","D4zz","Object.prototype.ads.nopreroll_",").show()","function","/open.*_blank/","advanced_ads_ready","loadAdBlocker","HP_Scout.adBlocked","SD_IS_BLOCKING","isBlocking","adFreePopup","Object.prototype.isPremium","__BACKPLANE_API__.renderOptions.showAdBlock",".quiver-cam-player--ad-not-running.quiver-cam-player--free video","debug","Object.prototype.isNoAds","tv3Cmp.ConsentGiven","distance","site-access","chAdblock","/,ad\\n.+?(?=#UPLYNK-SEGMENT)/gm","/uplynk\\.com\\/.*?\\.m3u8/","remaining","/ads|doubleclick/","/Ads|adbl|offsetHeight/",".innerHTML","onmousedown",".ob-dynamic-rec-link","setupSkin","/app.js","dqst.pl","PvVideoSlider","_chjeuHenj","[].data.searchResults.listings.[-].targetingSegments","noConflict","preroll_helper.advs","/show|innerHTML/","create_ad","Object.prototype.enableInterstitial","addAds","/show|document\\.createElement/","loadXMLDoc","register","MobileInGameGames","__osw","uniconsent.com","/coinzillatag|czilladx/","divWidth","Script_Manager","Script_Manager_Time","bullads","Msg","!download","/click|mousedown/","adjsData","AdService.info.abd","UABP","adBlockDetectionResult","popped","/xlirdr|hotplay\\-games|hyenadata/","document.body.insertAdjacentHTML","exo","tic","download_loading","pu_url","Click","afStorage","puShown1","onAdblockerDetected","htmlAds","second","lycos_ad","150","passthetest","checkBlock","/thaudray\\.com|putchumt\\.com/","popName","vlitag","asgPopScript","/(?=^(?!.*(jquery|turnstile|challenge-platform)))/","Object.prototype.loadCosplay","Object.prototype.loadImages","FMPoopS","/window\\['(?:\\\\x[0-9a-f]{2}){2}/","urls.length","updatePercentage","importantFunc","console.warn","sam","current()","confirm","pandaAdviewValidate","showAdBlock","aaaaa-modal","setCookie","/(?=^(?!.*(http)))/","$onet","adsRedirectPopups","canGetAds","method:/head/i","Array.prototype.includes","json:\"none\"","/brave-api|script-content|bait|real/","length:11000","goToURL","ad_blocker_active","init_welcome_ad","setinteracted",".MediaStep","data.xdt_injected_story_units.ad_media_items","dataLayer","document.body.contains","nothingCanStopMeShowThisMessage","window.focus","imasdk","TextEncoder.prototype.encode","!/^\\//","fakeElement","adEnable","ssaiInfo fallback.ssaiInfo","adtech-brightline adtech-google-pal adtech-iab-om","/playbackInfo","xpath(//*[name()=\"MPD\"]/@mediaPresentationDuration | //*[name()=\"Period\"]/@start | //*[name()=\"Period\"][not(.//*[name()=\"SegmentTimeline\"])][not(.//*[name()=\"ContentProtection\"])] | //*[name()=\"Period\"][./*[name()=\"BaseURL\"]][not(.//*[name()=\"ContentProtection\"])])","/-vod-.+\\.mpd/","htmlSectionsEncoded","event.dispatch","adx","popupurls","displayAds","cls_report?","-0x1","childNodes","wbar","[href=\"/bestporn.html\"]","_adshrink.skiptime","gclid","event","!yt1d.com","button#getlink","button#gotolink","AbleToRunAds","PreRollAd.timeCounter","result.ads","tpc.googlesyndication.com","id","#div-gpt-ad-footer","#div-gpt-ad-pagebottom","#div-gpt-ad-relatedbottom-1","#div-gpt-ad-sidebottom","goog","document.body",".downloadbtn","abpblocked","p$00a",".data?","openAdsModal","paAddUnit","gloacmug.net","items.[-].potentialActions.0.object.impressionToken items.[-].hasPart.0.potentialActions.0.object.impressionToken","context.adsIncluded","refresh","adt","Array.prototype.indexOf","interactionCount","/cloudfront|thaudray\\.com/","test_adblock","vastEnabled","/adskeeper|cloudflare/","#gotolink","detectadsbocker","c325","two_worker_data_js.js","adobeModalTestABenabled","FEATURE_DISABLE_ADOBE_POPUP_BY_COUNTRY","questpassGuard","isAdBlockerEnabled","shortConfig","akadb","eazy_ad_unblocker","json:\"\"","unlock","adswizz.com","document.onkeypress","adsSrc","sssp","emptyObj","[style*=\"background-image: url\"]","[href*=\"click?\"]","/freychang|passback|popunder|tag|banquetunarmedgrater/","google-analytics","myTestAd","/<VAST version.+VAST>/","<VAST version=\\\"4.0\\\"></VAST>","deezer.getAudiobreak","Ads","smartLoaded","..ads_audio=false","ShowAdBLockerNotice","ad_listener","!shrdsk","notify","AdB","push-allow-modal",".hide","(!0)","Delay","ima","adSession","Cookiebot","\"adsBlocked\"","/appendChild|e\\(\"/","=>","stream.insertion.adSession stream.insertion.points stream.insertion stream.sources.*.insertion pods.0.ads","ads.metadata ads.document ads.dxc ads.live ads.vod","site-access-popup","*.tanya_video_ads","deblocker","data?","script.src","/#EXT-X-DISCONTINUITY.{1,100}#EXT-X-DISCONTINUITY/gm","mixed.m3u8","feature_flags.interstitial_ads_flag","feature_flags.interstitials_every_four_slides","?","downloadToken","waldoSlotIds","Uint8Array","redirectpage","13500","adblockstatus","adScriptLoaded","/adoto|googlesyndication/","props.sponsoredAlternative","np.detect","ad-delivery","document.documentElement.lang","adSettings","banner_is_blocked","consoleLoaded?clearInterval","Object.keys","[?.context.bidRequestId].*","RegExp.prototype.test","json:\"wirtualnemedia\"","/^dobreprogramy$/","decodeURL","updateProgress","/salesPopup|mira-snackbar/","Object.prototype.adBlocked","DOMAssistant","rotator","adblock popup vast","detectImgLoad","killAdKiller","current-=1","/zefoy\\.com\\S+:3:1/",".clientHeight","googleAd","/showModal|chooseAction|doAction|callbackAdsBlocked/","cpmecs","/adlink/i","[onload^=\"window.open\"]","dontask","aoAdBlockDetected","button[onclick^=\"window.open\"]","function(e)","touchstart","Brid.A9.prototype.backfillAdUnits","adlinkfly_url","siteAccessFlag","/adblocker|alert/","doubleclick.net/instream/ad_status.js","war:doubleclick_instream_ad_status.js","redURL","/children\\('ins'\\)|Adblock|adsbygoogle/","dct","slideShow.displayInterstitial","openPopup","Object.getPrototypeOf","plugins","ai_wait_for_jquery","pbjs","tOS2","ips","Error","/stackDepth:1\\s/","tryShowVideoAdAsync","chkADB","onDetected","detectAdblocker","document.ready","a[href*=\"torrentico.top/sim/go.php\"]","success.page.spaces.player.widget_wrappers.[].widget.data.intervention_data","VAST","{\"value\": \"Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Mobile/15E148 Safari/604.1\"}","navigator.standalone","navigator.platform","{\"value\": \"iPhone\"}","Storage.prototype.setItem","searchCount","empire.pop","empire.direct","empire.directHideAds","json:\"click\"","(!1)","pagead2.googlesyndication.com","empire.mediaData.advisorMovie","empire.mediaData.advisorSerie","fuckadb","[type=\"submit\"]","setTimer","auto_safelink","!abyss.to","daadb_get_data_fetch","penci_adlbock.ad_blocker_detector","siteAccessPopup","/adsbygoogle|adblock|innerHTML|setTimeout/","/innerHTML|_0x/","Object.prototype.adblockDetector","biteDisplay","blext","/[a-z]\\(!0\\)/","800","vidorev_jav_plugin_video_ads_object","vidorev_jav_plugin_video_ads_object_post","dai_iframe","popactive","/detectAdBlocker|window.open/","S_Popup","eazy_ad_unblocker_dialog_opener","rabLimit","-1","popUnder","/GoToURL|delay/","nudgeAdBlock","/googlesyndication|ads/","/Content/_AdBlock/AdBlockDetected.html","adBlckActive","AB.html","feedBack.showAffilaePromo","ShowAdvertising","a img:not([src=\"images/main_logo_inverted.png\"])","visible","a[href][target=\"_blank\"],[src^=\"//ad.a-ads.com/\"]","avails","amazonaws.com","ima3_dai","topaz.","FAVE.settings.ads.ssai.prod.clips.enabled","FAVE.settings.ads.ssai.prod.liveAuth.enabled","FAVE.settings.ads.ssai.prod.liveUnauth.enabled","xpath(//*[name()=\"MPD\"]/@mediaPresentationDuration | //*[name()=\"Period\"]/@start | //*[name()=\"Period\"][.//*[name()=\"BaseURL\" and contains(text(),\".prd.media.\")]])","/dash.mpd","/sandbox/i","analytics.initialized","autoptimize","UserCustomPop","method:GET","data.reg","time-events","/#EXTINF:[^\\n]+\\nhttps:\\/\\/redirector\\.googlevideo\\.com[^\\n]+/gms","/\\/ondemand\\/.+\\.m3u8/","/redirector\\.googlevideo\\.com\\/videoplayback[\\s\\S]*?dclk_video_ads/",".m3u8","phxSiteConfig.gallery.ads.interstitialFrequency","loadpagecheck","popupAt","modal_blocker","art3m1sItemNames.affiliate-wrapper","\"\"","isOpened","playerResponse.adPlacements playerResponse.playerAds adPlacements playerAds","Array.prototype.find","affinity-qi","GeneratorAds","isAdBlockerActive","pop.doEvent","'shift'","bFired","scrollIncrement","di.app.WebplayerApp.Ads.Adblocks.app.AdBlockDetectApp.startWithParent","a#downloadbtn[onclick^=\"window.open\"]","alink","/ads|googletagmanager/","sharedController.adblockDetector",".redirect","sliding","a[onclick]","infoey","settings.adBlockDetectionEnabled","displayInterstitialAdConfig","response.ads","/api","unescape","checkAdBlockeraz","blockingAds","Yii2App.playbackTimeout","setC","popup","/adScriptPath|MMDConfig/","xpath(//*[name()=\"MPD\"]/@mediaPresentationDuration | //*[name()=\"Period\"]/@start | //*[name()=\"Period\"][.//*[name()=\"BaseURL\" and contains(text(),'adease')]])","[media^=\"A_D/\"]","adease adeaseBlob vmap","adease","aab","ips.controller.register","plugins.adService","QiyiPlayerProphetData.a.data","wait","/adsbygoogle|doubleclick/","adBreaks.[].startingOffset adBreaks.[].adBreakDuration adBreaks.[].ads adBreaks.[].startTime adBreak adBreakLocations","/session.json","xpath(//*[name()=\"Period\"][not(contains(@id,\"subclip\"))] | //*[name()=\"MPD\"]/@mediaPresentationDuration | //*[name()=\"Period\"]/@start)","/\\/episode\\/.+?\\.mpd\\?/","session.showAds","toggleAdBlockInfo","cachebuster","config","OpenInNewTab_Over","/native|\\{n\\(\\)/","[style^=\"background\"]","[target^=\"_\"]","bodyElement.removeChild","aipAPItag.prerollSkipped","aipAPItag.setPreRollStatus","\"ads_disabled\":false","\"ads_disabled\":true","payments","reklam_1_saniye","reklam_1_gecsaniye","reklamsayisi","reklam_1","psresimler","data","runad","url:doubleclick.net","war:googletagservices_gpt.js","[target=\"_blank\"]","\"flashtalking\"","/(?=^(?!.*(cdn-cgi)))/","criteo","war:32x32.png","HTMLImageElement.prototype.onerror","HTMLImageElement.prototype.onload","sessionStorage","createDecoy","/form\\.submit|urlToOpen/","data.home.home_timeline_urt.instructions.[].entries.[-].content.itemContent.promotedMetadata","url:/Home","data.search_by_raw_query.search_timeline.timeline.instructions.[].entries.[-].content.itemContent.promotedMetadata","url:/SearchTimeline","data.threaded_conversation_with_injections_v2.instructions.[].entries.[-].content.items.[].item.itemContent.promotedMetadata","url:/TweetDetail","data.user.result.timeline_v2.timeline.instructions.[].entries.[-].content.itemContent.promotedMetadata","url:/UserTweets","data.immersiveMedia.timeline.instructions.[].entries.[-].content.itemContent.promotedMetadata","url:/ImmersiveMedia","/\\.php\\b.*_blank/",".[?.media_entities.*.video_info.variants]..url_data.url=\"https://twitter.undefined\"","twitter.undefined","powerAPITag","playerEnhancedConfig.run","rodo.checkIsDidomiConsent","xtime","smartpop","Div_popup","EzoIvent","/doubleclick|googlesyndication|vlitag/","overlays","googleAdUrl","/googlesyndication|nitropay/","uBlockActive","/api/v1/events","Scribd.Blob.AdBlockerModal","AddAdsV2I.addBlock","xpath(//*[name()=\"Period\"][.//*[name()=\"BaseURL\" and contains(text(),'/ad/')]])","/Detect|adblock|style\\.display|\\[native code]|\\.call\\(null\\)/","/google_ad_client/","method:GET url:!/idlix|jwpcdn/","total","popCookie","/0x|sandCheck/","hasAdBlocker","ShouldShow","offset","startDownload","cloudfront","[href*=\"jump\"]","!direct","a0b","/outbrain|criteo|thisiswaldo|media\\.net|ohbayersbur|adligature|quantserve|srvtrck|\\.css|\\.js/","mode:no-cors","2000-5000","contrformpub","data.device.adsParams data.device.adSponsorshipTemplate","url:/appconfig","innerWidth","initials.yld-pdpopunder",".main-wrap","/googlesyndication|googima\\.js/","__brn_private_mode","download_click","advertisement3","start","Object.prototype.skipPreroll","/adskeeper|bidgear|googlesyndication|mgid/","fwmrm.net","/\\/ad\\/g\\/1/","adverts.breaks","result.responses.[].response.result.cards.[-].data.offers","ADB","downloadTimer","/ads|google/","injectedScript","/googlesyndication|googletagservices/","DisableDevtool","eClicked","number","sync","PlayerLogic.prototype.detectADB","ads-twitter.com","all","havenclick","VAST > Ad","/tserver","Object.prototype.prerollAds","secure.adnxs.com/ptv","war:noop-vast4.xml","notifyMe","alertmsg","/streams","adsClasses","gsecs","adtagparameter","dvsize","52","removeDLElements","/\\.append|\\.innerHTML|undefined|\\.css|blocker|flex|\\$\\('|obfuscatedMsg/","warn","adc","majorse","completed","testerli","showTrkURL","/popunder/i","readyWait","document.body.style.backgroundPosition","invoke","ssai_manifest ad_manifest playback_info.ad_info qvt.playback_info.ad_info","Object.prototype.setNeedShowAdblockWarning","load_banner","initializeChecks","HTMLDocument","video-popup","splashPage","adList","adsense-container","detect-modal","/_0x|dtaf/","this","ifmax","adRequest","nads","nitroAds.abp","adinplay.com","onloadUI","war:google-ima.js","/^data:text\\/javascript/","randomNumber","current.children","probeScript","PageLoader.DetectAb","!koyso.","adStatus","popUrl","one_time","PlaybackDetails.[].DaiVod","consentGiven","ad-block","data.searchClassifiedFeed.searchResultView.0.searchResultItemsV2.edges.[-].node.item.content.creative.clickThroughEvent.adsTrackingMetadata.metadata.adRequestId","data.me.personalizedFeed.feedItems.[-].promo.creative.clickThroughUrl.adsTrackingMetadata.metadata.adRequestId","data.me.rhrFeed.feedItems.[-].promo.creative.clickThroughUrl.adsTrackingMetadata.metadata.sponsor","mdpDeblocker","doubleclick.net","BN_CAMPAIGNS","media_place_list","...","/\\{[a-z]\\(!0\\)\\}/","canRedirect","/\\{[a-z]\\(e\\)\\}/","[].data.displayAdsV3.data.[-].__typename","[].data.TopAdsProducts.data.[-].__typename","[].data.topads.data.[-].__typename","/\\{\"id\":\\d{9,11}(?:(?!\"ads\":\\{\"id\":\"\").)+?\"ads\":\\{\"id\":\"\\d+\".+?\"__typename\":\"ProductCarouselV2\"\\},?/g","/graphql/InspirationCarousel","/\\{\"category_id\"(?:(?!\"ads\":\\{\"id\":\"\").)+?\"ads\":\\{\"id\":\"\\d+\".+?\"__typename\":\"ProductCarouselV2\"\\},?/g","/graphql/InspirationalCarousel","/\\{\"id\":\\d{9,11}(?:(?!\"isTopads\":false).)+?\"isTopads\":true.+?\"__typename\":\"recommendationItem\"\\},/g","/\\/graphql\\/productRecommendation/i","/,\\{\"id\":\\d{9,11}(?:(?!\"isTopads\":false).)+?\"isTopads\":true(?:(?!\"__typename\":\"recommendationItem\").)+?\"__typename\":\"recommendationItem\"\\}(?=\\])/","/\\{\"(?:productS|s)lashedPrice\"(?:(?!\"isTopads\":false).)+?\"isTopads\":true.+?\"__typename\":\"recommendationItem\"\\},?/g","/graphql/RecomWidget","/\\{\"appUrl\"(?:(?!\"isTopads\":false).)+?\"isTopads\":true.+?\"__typename\":\"recommendationItem\"\\},?/g","/graphql/ProductRecommendationQuery","adDetails","/secure?","data.search.products.[-].sponsored_ad.ad_source","url:/plp_search_v2?","GEMG.GPT.Interstitial","amiblock","String.prototype.concat","adBlockerDismissed","adBlockerDismissed_","karte3","18","callbackAdsBlocked","stackTrace","sandDetect","json:\"body\"",".ad-zone","showcfkModal","amodule.data","emptyArr","inner-ad","_ET","jssdks.mparticle.com","session.sessionAds session.sessionAdsRequired","/session","getComputedStyle(el)","/(?=^(?!.*(orchestrate|cloudflare)))/","Object.prototype.ADBLOCK_DETECTION",".features.*[?.slug==\"adblock-detection\"].enabled=false","/ad/","/count|verify|isCompleted/","postroll","itemList.[-].ad_info.ad_id","url:api/recommend/item_list/","/adinplay|googlesyndication/","!hidan.sh","ask","interceptClickEvent","isAdBlockDetected","pData.adblockOverlayEnabled","ad_block_detector","attached","div[class=\"share-embed-container\"]","/^\\w{11}[1-9]\\d+\\.ts/","cabdSettings","/outbrain|adligature|quantserve|adligature|srvtrck/","adsConfiguration","/vod","layout.sections.mainContentCollection.components.[].data.productTiles.[-].sponsoredCreative.adGroupId","/search","fp-screen","puURL","!vidhidepre.com","[onclick*=\"_blank\"]","[onclick=\"goToURL();\"]","leaderboardAd","#leaderboardAd","placements.processingFile","dtGonza.playeradstime","\"-1\"","EV.Dab","ablk","malisx","alim","shutterstock.com","sorts.[-].recommendationList.[].contentMetadata.EncryptedAdTrackingData","/ads|chp_?ad/","ads.[-].ad_id","wp-ad","/clarity|googlesyndication/","/aff|jump/","!/mlbbox\\.me|_self/","aclib.runPop","ADS.isBannersEnabled","ADS.STATUS_ERROR","json:\"COMPLETE\"","button[onclick*=\"open\"]","getComputedStyle(testAd)","openPopupForChapter","Object.prototype.popupOpened","src_pop","zigi_tag_id","gifs.[-].cta.link","boosted_gifs","adsbygoogle_ama_fc_has_run","doThePop","thanksgivingdelights","yes.onclick","!vidsrc.","clearTimeout","popundersPerIP","createInvisibleTrigger","jwDefaults.advertising","elimina_profilazione","elimina_pubblicita","snigelweb.com","abd","pum_popups","checkerimg","!/(flashbang\\.sh|dl\\.buzzheavier\\.com)/","!dl.buzzheavier.com","uzivo","openDirectLinkAd","!nikaplayer.com",".adsbygoogle:not(.adsbygoogle-noablate)","json:\"img\"","playlist.movie.advertising.ad_server","PopUnder","data.[].affiliate_url","cdnpk.net/v2/images/search?","cdnpk.net/Rest/Media/","war:noop.json","data.[-].inner.ctaCopy","?page=","/gampad/ads?",".adv-",".length === 0",".length === 31","window.matchMedia('(display-mode: standalone)').matches","Object.prototype.DetectByGoogleAd","a[target=\"_blank\"][style]","/adsActive|POPUNDER/i","/Executed|modal/","[breakId*=\"Roll\"]","/content.vmap","/#EXT-X-KEY:METHOD=NONE\\n#EXT(?:INF:[^\\n]+|-X-DISCONTINUITY)\\n.+?(?=#EXT-X-KEY)/gms","/media.m3u8","window.navigator.brave","showTav","document['\\x","showADBOverlay","..directLink","..props[?.children*=\"clicksCount\"].children","clicksCount","adskeeper","springserve.com","document.documentElement.clientWidth","outbrain.com","s4.cdnpc.net/front/css/style.min.css","slider--features","s4.cdnpc.net/vite-bundle/main.css","data-v-d23a26c8","cdn.taboola.com/libtrc/san1go-network/loader.js","feOffset","hasAdblock","taboola","adbEnableForPage","Dataffcecd","/adblock|isblock/i","/\\b[a-z] inlineScript:/","result.adverts","data.pinotPausedPlaybackPage","fundingchoicesmessages","isAdblock","button[id][onclick*=\".html\"]","dclk_video_ads","ads breaks cuepoints times","odabd","pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?ord=","b.google_reactive_tag_first","sbs.demdex.net/dest5.html?d_nsid=0&ord=","Demdex.canSetThirdPartyCookies","securepubads.g.doubleclick.net/pagead/ima_ppub_config?ippd=https%3A%2F%2Fwww.sbs.com.au%2Fondemand%2F&ord=","[\"4117\"]","configs.*.properties.componentConfigs.slideshowConfigs.*.interstitialNativeAds","url:/config","list.[].link.kicker","/content/v1/cms/api/amp/Document","properties.tiles.[-].isAd","/mestripewc/default/config","openPop","circle_animation","CountBack","990","/location\\.(replace|href)|stopAndExitFullscreen/","displayAdBlockedVideo","/undefined|displayAdBlockedVideo/","cns.library","json:\"#app-root\"","google_ads_iframe","data-id|data-p","[data-id],[data-p]","BJSShowUnder","BJSShowUnder.bindTo","BJSShowUnder.add","Object.prototype._parseVAST","Object.prototype.createAdBlocker","Object.prototype.isAdPeriod","breaks custom_breaks_data pause_ads video_metadata.end_credits_time","pause_ads","/playlist","breaks","breaks custom_breaks_data pause_ads","xpath(//*[name()=\"MPD\"]/@mediaPresentationDuration | //*[name()=\"Period\"][.//*[name()=\"BaseURL\" and contains(text(),\"/ads-\")]] | //*[name()=\"Period\"][starts-with(@id,\"ad\")] | //*[name()=\"Period\"][starts-with(@id,\"Ad\")] | //*[name()=\"Period\"]/@start)","MPD Period[id^=\"Ad\"i]","ABLK","_n_app.popunder","_n_app.options.ads.show_popunders","N_BetterJsPop.object","jwplayer.vast","Fingerprent2","test.remove","isAdb","/click|mouse|touch/","puOverlay","opopnso","c0ZZ","cuepointPlaylist vodPlaybackUrls.result.playbackUrls.cuepoints vodPlaylistedPlaybackUrls.result.playbackUrls.pauseBehavior vodPlaylistedPlaybackUrls.result.playbackUrls.pauseAdsResolution vodPlaylistedPlaybackUrls.result.playbackUrls.intraTitlePlaylist.[-].shouldShowOnScrubBar ads","xpath(//*[name()=\"Period\"][.//*[@value=\"Ad\"]] | /*[name()=\"MPD\"]/@mediaPresentationDuration | //*[name()=\"Period\"]/@start)","[value=\"Ad\"]","xpath(//*[name()=\"Period\"][.//*[@value=\"Draper\"]] | /*[name()=\"MPD\"]/@mediaPresentationDuration | //*[name()=\"Period\"]/@start)","[value=\"Draper\"]","xpath(//*[name()=\"Period\"][.//*[name()=\"BaseURL\" and contains(text(),\"/interstitial/\")]] | /*[name()=\"MPD\"][.//*[name()=\"BaseURL\" and contains(text(),\"/interstitial/\")]]/@mediaPresentationDuration | /*[name()=\"MPD\"][.//*[name()=\"BaseURL\" and contains(text(),\"/interstitial/\")]]/*[name()=\"Period\"]/@start)","ue_adb_chk","ad.doubleclick.net bid.g.doubleclick.net ggpht.com google.co.uk google.com googleads.g.doubleclick.net googleads4.g.doubleclick.net googleadservices.com googlesyndication.com googleusercontent.com gstatic.com gvt1.com prod.google.com pubads.g.doubleclick.net s0.2mdn.net static.doubleclick.net surveys.g.doubleclick.net youtube.com ytimg.com","lifeOnwer","jsc.mgid.com","movie.advertising",".mandatoryAdvertising=false","/player/configuration","vast_urls","show_adverts","runCheck","adsSlotRenderEndSeen","DOMTokenList.prototype.add","\"-\"","removedNodes.forEach","__NEXT_DATA__.props.pageProps.broadcastData.remainingWatchDuration","json:9999999999","/\"remainingWatchDuration\":\\d+/","\"remainingWatchDuration\":9999999999","/stream","/\"midTierRemainingAdWatchCount\":\\d+,\"showAds\":(false|true)/","\"midTierRemainingAdWatchCount\":0,\"showAds\":false","a[href][onclick^=\"openit\"]","cdgPops","json:\"1\"","pubfuture","/doubleclick|google-analytics/","flashvars.mlogo_link","'script'","/ip-acl-all.php","URLlist","adBlockNotice","aaw","aaw.processAdsOnPage","displayLayer","adId","underpop","adBlockerModal","10000-15000","/adex|loadAds|adCollapsedCount|ad-?block/i","/^function\\(\\).*requestIdleCallback.*/","/function\\([a-z]\\){[a-z]\\([a-z]\\)}/","OneTrust","OneTrust.IsAlertBoxClosed","FOXIZ_MAIN_SCRIPT.siteAccessDetector","120000","openAdBlockPopup","drama-online","zoneid","\"data-cfasync\"","Object.init","advanced_ads_check_adblocker","div[class=\"nav tabTop\"] + div > div:first-child > div:first-child > a:has(> img[src*=\"/\"][src*=\"_\"][alt]), #head + div[id] > div:last-child > div > a:has(> img[src*=\"/\"][src*=\"_\"][alt])","/(?=^(?!.*(_next)))/","[].props.slides.[-].adIndex","#ad_blocker_detector","adblockTrigger","20","Date.prototype.toISOString","insertAd","!/^\\/|_self|alexsports|nativesurge/","length:40000-60000","method:HEAD mode:no-cors","attestHasAdBlockerActivated","extInstalled","blockThisUrl","SaveFiles.add","detectSandbox","bait.remove","/rekaa","pop_tag","/HTMLDocument|blob/","=","/wp-content\\/uploads\\/[a-z]+\\/[a-z]+\\.js/","pagead2.googlesyndication.com/pagead/js/adsbygoogle.js","wbDeadHinweis","()=>{var c=Kb","0.2","fired","popupInterval","adbon","*.aurl","/cs?id=","repl:/\\.mp4$/.mp3/",".mp4","-banner","PopURL","LCI.adBlockDetectorEnabled","!y2meta","ConsoleBan","disableDevtool","ondevtoolopen","onkeydown","window.history.back","close","lastPopupTime","button#download","mode:\"no-cors\"","!magnetdl.","stoCazzo","_insertDirectAdLink","Visibility","importFAB","uas","ast","json:1","a[href][target=\"_blank\"]","url:ad/banner.gif","window.__CONFIGURATION__.adInsertion.enabled","window.__CONFIGURATION__.features.enableAdBlockerDetection","_carbonads","_bsa","redirectOnClick","widgets.outbrain.com","2d","/googletagmanager|ip-api/","&&","json:\"0\"","timeleftlink","handlePopup","bannerad sidebar ti_sidebar","moneyDetect","play","EFFECTIVE_APPS_GCB_BLOCKED_MESSAGE","sub","checkForAdBlocker","/navigator|location\\.href/","mode:cors","!self","/createElement|addEventListener|clientHeight/","uberad_mode","data.getFinalClickoutUrl data.sendSraBid",".php","!notunmovie","handleRedirect","testAd","imasdk.googleapis.com","/topaz/api","data.availableProductCount","results.[-].advertisement","/partners/home","__aab_init","show_videoad_limited","__NATIVEADS_CANARY__","[breakId]","_VMAP_","ad_slot_recs","/doc-page/recommenders",".smartAdsForAccessNoAds=true","/doc-page/afa","Object.prototype.adOnAdBlockPreventPlayback","pre_roll_url","post_roll_url",".result.PlayAds=false","/api/get-urls","OfferwallSessionTracker","player.preroll",".redirected","promos","TNCMS.DMP","/pop?",".metadata.hideAds=true","a2d.tv/play/","adblock_detect","link.click","document.body.style.overflow","fallback","/await|clientHeight/","Function","..adTimeout=0","/api/v","!/\\/download|\\/play|cdn\\.videy\\.co/","!_self","#fab","www/delivery","/\\/js/","/\\/4\\//","prads","/googlesyndication|doubleclick|adsterra/","String.prototype.split","null,http","..searchResults.*[?.isAd==true]","..mainContentComponentsListProps.*[?.isAd==true]","/search/snippet?","cmgpbjs","displayAdblockOverlay","start_full_screen_without_ad","drupalSettings.coolmath.hide_preroll_ads","clkUnder","adsArr","onClick","..data.expectingAds=false","/profile","[href^=\"https://whulsaux.com\"]","adRendered","Object.prototype.clickAds.emit","!storiesig","openUp",".result.timeline.*[?.type==\"ad\"]","/livestitch","!adShown","data.*.elements.edges.[].node.outboundLink","data.children.[].data.outbound_link","method:POST url:/logImpressions","rwt",".js","_oEa","ADMITAD","body:browser","_hjSettings","bmak.js_post","method:POST","utreon.com/pl/api/event method:POST","log-sdk.ksapisrv.com/rest/wd/common/log/collect method:POST","firebase.analytics","require.0.3.0.__bbox.define.[].2.is_linkshim_supported","/(ping|score)Url","Object.prototype.updateModifiedCommerceUrl","HTMLAnchorElement.prototype.getAttribute","json:\"class\"","data-direct-ad","fingerprintjs-pro-react","flashvars.event_reporting","dataLayer.trackingId user.trackingId","Object.prototype.has_opted_out_tracking","cX_atfr","process","process.env","/VisitorAPI|AppMeasurement/","Visitor","''","?orgRef","analytics/bulk-pixel","eventing","send_gravity_event","send_recommendation_event","window.screen.height","method:POST body:zaraz","onclick|oncontextmenu|onmouseover","a[href][onclick*=\"this.href\"]","libAnalytics","json: {\"status\":{\"dataAvailable\":false},\"data\":{}}","libAnalytics.data.get","cmp.inmobi.com/geoip","method:POST url:pfanalytics.bentasker.co.uk","discord.com/api/v9/science","a[onclick=\"fire_download_click_tracking();\"]","adthrive._components.start","url:/api/statsig/log_event method:POST",".*[?.operationName==\"TrackEvent\"]","/v1/api","ftr__startScriptLoad","url:/undefined method:POST","miner","CoinNebula","blogherads","Math.sqrt","update","/(trace|beacon)\\.qq\\.com/","splunkcloud.com/services/collector","event-router.olympics.com","hostingcloud.racing","tvid.in/log/","excess.duolingo.com/batch","/eventLog.ajax","t.wayfair.com/b.php?","navigator.sendBeacon","segment.io","mparticle.com","ceros.com/a?data","pluto.smallpdf.com","method:/post/i url:/\\/\\/chatgpt\\.com\\/ces\\/v1\\/[a-z]$/","method:/post/i url:ab.chatgpt.com/v1/rgstr","/eventhub\\.\\w+\\.miro\\.com\\/api\\/stream/","logs.netflix.com","s73cloud.com/metrics/",".cdnurl=[\"data:video/mp4;base64,AAAAHGZ0eXBNNFYgAAACAGlzb21pc28yYXZjMQAAAAhmcmVlAAAGF21kYXTeBAAAbGliZmFhYyAxLjI4AABCAJMgBDIARwAAArEGBf//rdxF6b3m2Ui3lizYINkj7u94MjY0IC0gY29yZSAxNDIgcjIgOTU2YzhkOCAtIEguMjY0L01QRUctNCBBVkMgY29kZWMgLSBDb3B5bGVmdCAyMDAzLTIwMTQgLSBodHRwOi8vd3d3LnZpZGVvbGFuLm9yZy94MjY0Lmh0bWwgLSBvcHRpb25zOiBjYWJhYz0wIHJlZj0zIGRlYmxvY2s9MTowOjAgYW5hbHlzZT0weDE6MHgxMTEgbWU9aGV4IHN1Ym1lPTcgcHN5PTEgcHN5X3JkPTEuMDA6MC4wMCBtaXhlZF9yZWY9MSBtZV9yYW5nZT0xNiBjaHJvbWFfbWU9MSB0cmVsbGlzPTEgOHg4ZGN0PTAgY3FtPTAgZGVhZHpvbmU9MjEsMTEgZmFzdF9wc2tpcD0xIGNocm9tYV9xcF9vZmZzZXQ9LTIgdGhyZWFkcz02IGxvb2thaGVhZF90aHJlYWRzPTEgc2xpY2VkX3RocmVhZHM9MCBucj0wIGRlY2ltYXRlPTEgaW50ZXJsYWNlZD0wIGJsdXJheV9jb21wYXQ9MCBjb25zdHJhaW5lZF9pbnRyYT0wIGJmcmFtZXM9MCB3ZWlnaHRwPTAga2V5aW50PTI1MCBrZXlpbnRfbWluPTI1IHNjZW5lY3V0PTQwIGludHJhX3JlZnJlc2g9MCByY19sb29rYWhlYWQ9NDAgcmM9Y3JmIG1idHJlZT0xIGNyZj0yMy4wIHFjb21wPTAuNjAgcXBtaW49MCBxcG1heD02OSBxcHN0ZXA9NCB2YnZfbWF4cmF0ZT03NjggdmJ2X2J1ZnNpemU9MzAwMCBjcmZfbWF4PTAuMCBuYWxfaHJkPW5vbmUgZmlsbGVyPTAgaXBfcmF0aW89MS40MCBhcT0xOjEuMDAAgAAAAFZliIQL8mKAAKvMnJycnJycnJycnXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXiEASZACGQAjgCEASZACGQAjgAAAAAdBmjgX4GSAIQBJkAIZACOAAAAAB0GaVAX4GSAhAEmQAhkAI4AhAEmQAhkAI4AAAAAGQZpgL8DJIQBJkAIZACOAIQBJkAIZACOAAAAABkGagC/AySEASZACGQAjgAAAAAZBmqAvwMkhAEmQAhkAI4AhAEmQAhkAI4AAAAAGQZrAL8DJIQBJkAIZACOAAAAABkGa4C/AySEASZACGQAjgCEASZACGQAjgAAAAAZBmwAvwMkhAEmQAhkAI4AAAAAGQZsgL8DJIQBJkAIZACOAIQBJkAIZACOAAAAABkGbQC/AySEASZACGQAjgCEASZACGQAjgAAAAAZBm2AvwMkhAEmQAhkAI4AAAAAGQZuAL8DJIQBJkAIZACOAIQBJkAIZACOAAAAABkGboC/AySEASZACGQAjgAAAAAZBm8AvwMkhAEmQAhkAI4AhAEmQAhkAI4AAAAAGQZvgL8DJIQBJkAIZACOAAAAABkGaAC/AySEASZACGQAjgCEASZACGQAjgAAAAAZBmiAvwMkhAEmQAhkAI4AhAEmQAhkAI4AAAAAGQZpAL8DJIQBJkAIZACOAAAAABkGaYC/AySEASZACGQAjgCEASZACGQAjgAAAAAZBmoAvwMkhAEmQAhkAI4AAAAAGQZqgL8DJIQBJkAIZACOAIQBJkAIZACOAAAAABkGawC/AySEASZACGQAjgAAAAAZBmuAvwMkhAEmQAhkAI4AhAEmQAhkAI4AAAAAGQZsAL8DJIQBJkAIZACOAAAAABkGbIC/AySEASZACGQAjgCEASZACGQAjgAAAAAZBm0AvwMkhAEmQAhkAI4AhAEmQAhkAI4AAAAAGQZtgL8DJIQBJkAIZACOAAAAABkGbgCvAySEASZACGQAjgCEASZACGQAjgAAAAAZBm6AnwMkhAEmQAhkAI4AhAEmQAhkAI4AhAEmQAhkAI4AhAEmQAhkAI4AAAAhubW9vdgAAAGxtdmhkAAAAAAAAAAAAAAAAAAAD6AAABDcAAQAAAQAAAAAAAAAAAAAAAAEAAAAAAAAAAAAAAAAAAAABAAAAAAAAAAAAAAAAAABAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAwAAAzB0cmFrAAAAXHRraGQAAAADAAAAAAAAAAAAAAABAAAAAAAAA+kAAAAAAAAAAAAAAAAAAAAAAAEAAAAAAAAAAAAAAAAAAAABAAAAAAAAAAAAAAAAAABAAAAAALAAAACQAAAAAAAkZWR0cwAAABxlbHN0AAAAAAAAAAEAAAPpAAAAAAABAAAAAAKobWRpYQAAACBtZGhkAAAAAAAAAAAAAAAAAAB1MAAAdU5VxAAAAAAALWhkbHIAAAAAAAAAAHZpZGUAAAAAAAAAAAAAAABWaWRlb0hhbmRsZXIAAAACU21pbmYAAAAUdm1oZAAAAAEAAAAAAAAAAAAAACRkaW5mAAAAHGRyZWYAAAAAAAAAAQAAAAx1cmwgAAAAAQAAAhNzdGJsAAAAr3N0c2QAAAAAAAAAAQAAAJ9hdmMxAAAAAAAAAAEAAAAAAAAAAAAAAAAAAAAAALAAkABIAAAASAAAAAAAAAABAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAGP//AAAALWF2Y0MBQsAN/+EAFWdCwA3ZAsTsBEAAAPpAADqYA8UKkgEABWjLg8sgAAAAHHV1aWRraEDyXyRPxbo5pRvPAyPzAAAAAAAAABhzdHRzAAAAAAAAAAEAAAAeAAAD6QAAABRzdHNzAAAAAAAAAAEAAAABAAAAHHN0c2MAAAAAAAAAAQAAAAEAAAABAAAAAQAAAIxzdHN6AAAAAAAAAAAAAAAeAAADDwAAAAsAAAALAAAACgAAAAoAAAAKAAAACgAAAAoAAAAKAAAACgAAAAoAAAAKAAAACgAAAAoAAAAKAAAACgAAAAoAAAAKAAAACgAAAAoAAAAKAAAACgAAAAoAAAAKAAAACgAAAAoAAAAKAAAACgAAAAoAAAAKAAAAiHN0Y28AAAAAAAAAHgAAAEYAAANnAAADewAAA5gAAAO0AAADxwAAA+MAAAP2AAAEEgAABCUAAARBAAAEXQAABHAAAASMAAAEnwAABLsAAATOAAAE6gAABQYAAAUZAAAFNQAABUgAAAVkAAAFdwAABZMAAAWmAAAFwgAABd4AAAXxAAAGDQAABGh0cmFrAAAAXHRraGQAAAADAAAAAAAAAAAAAAACAAAAAAAABDcAAAAAAAAAAAAAAAEBAAAAAAEAAAAAAAAAAAAAAAAAAAABAAAAAAAAAAAAAAAAAABAAAAAAAAAAAAAAAAAAAAkZWR0cwAAABxlbHN0AAAAAAAAAAEAAAQkAAADcAABAAAAAAPgbWRpYQAAACBtZGhkAAAAAAAAAAAAAAAAAAC7gAAAykBVxAAAAAAALWhkbHIAAAAAAAAAAHNvdW4AAAAAAAAAAAAAAABTb3VuZEhhbmRsZXIAAAADi21pbmYAAAAQc21oZAAAAAAAAAAAAAAAJGRpbmYAAAAcZHJlZgAAAAAAAAABAAAADHVybCAAAAABAAADT3N0YmwAAABnc3RzZAAAAAAAAAABAAAAV21wNGEAAAAAAAAAAQAAAAAAAAAAAAIAEAAAAAC7gAAAAAAAM2VzZHMAAAAAA4CAgCIAAgAEgICAFEAVBbjYAAu4AAAADcoFgICAAhGQBoCAgAECAAAAIHN0dHMAAAAAAAAAAgAAADIAAAQAAAAAAQAAAkAAAAFUc3RzYwAAAAAAAAAbAAAAAQAAAAEAAAABAAAAAgAAAAIAAAABAAAAAwAAAAEAAAABAAAABAAAAAIAAAABAAAABgAAAAEAAAABAAAABwAAAAIAAAABAAAACAAAAAEAAAABAAAACQAAAAIAAAABAAAACgAAAAEAAAABAAAACwAAAAIAAAABAAAADQAAAAEAAAABAAAADgAAAAIAAAABAAAADwAAAAEAAAABAAAAEAAAAAIAAAABAAAAEQAAAAEAAAABAAAAEgAAAAIAAAABAAAAFAAAAAEAAAABAAAAFQAAAAIAAAABAAAAFgAAAAEAAAABAAAAFwAAAAIAAAABAAAAGAAAAAEAAAABAAAAGQAAAAIAAAABAAAAGgAAAAEAAAABAAAAGwAAAAIAAAABAAAAHQAAAAEAAAABAAAAHgAAAAIAAAABAAAAHwAAAAQAAAABAAAA4HN0c3oAAAAAAAAAAAAAADMAAAAaAAAACQAAAAkAAAAJAAAACQAAAAkAAAAJAAAACQAAAAkAAAAJAAAACQAAAAkAAAAJAAAACQAAAAkAAAAJAAAACQAAAAkAAAAJAAAACQAAAAkAAAAJAAAACQAAAAkAAAAJAAAACQAAAAkAAAAJAAAACQAAAAkAAAAJAAAACQAAAAkAAAAJAAAACQAAAAkAAAAJAAAACQAAAAkAAAAJAAAACQAAAAkAAAAJAAAACQAAAAkAAAAJAAAACQAAAAkAAAAJAAAACQAAAAkAAACMc3RjbwAAAAAAAAAfAAAALAAAA1UAAANyAAADhgAAA6IAAAO+AAAD0QAAA+0AAAQAAAAEHAAABC8AAARLAAAEZwAABHoAAASWAAAEqQAABMUAAATYAAAE9AAABRAAAAUjAAAFPwAABVIAAAVuAAAFgQAABZ0AAAWwAAAFzAAABegAAAX7AAAGFwAAAGJ1ZHRhAAAAWm1ldGEAAAAAAAAAIWhkbHIAAAAAAAAAAG1kaXJhcHBsAAAAAAAAAAAAAAAALWlsc3QAAAAlqXRvbwAAAB1kYXRhAAAAAQAAAABMYXZmNTUuMzMuMTAw\"]","/storage-resolve/files/audio/interactive"];

const $scriptletArglists$ = /* 3636 */ "0,0,1,2;1,3,1,2;2,4,5,6,7;2,4,5,6,8;3,9,10,11;4,12,13,1,14;4,15,13,1,16;5,12,13,1,17;6,18,19,20;6,21,13,20;6,22,23,17;7,18,19,24;7,25,19,24;7,25,19,26;8,27,28;8,27,29;8,27,30;9,31;7,25,19,32;9,33;5,34,13,1,35;10,36;11,37,38;9,39;10,40;12,41,1,35;12,42,1,35;12,43,1,35;13;11,44,45;14,46,47;14,48,49;15,50,51;16,52,53;16,54,55;16,54,56;16,57,55;16,54,58;16,59,60;16,57,61;16,62,63,64,65;16,57,66;16,57,67;16,57,68;16,57,69;16,57,70;16,57,71;16,57,72;16,73,74;16,75,76,64,65;16,77,78,64,65;16,79,78,64,65;17,80,81;17,82,83;18,84;17,85,86;18,87;19,88;19,89,90;20,91,92;19,93,94;19,95;19,96;13,97;14,98,99;11,100,45;14,101,102;21,103,104;20,105,106;20,107,106;19,108;20,109;19,110;22,111,112,113;21,114,13,13,115,116;23,117,118,119,120,121;24,122,123;20,124;23,125,118,126,120,127;23,125,118,128,120,129;18,130;21,131,132;23,125,118,13,120,133;21,134,135;25,136,137,138,120,139;23,136,118,140,120,141;23,142,118,140,120,141;21,143,144,145;20,146;11,147,45;21,148,149;16,150,151,152;26,153,154;18,155;21,156;27,157;5,158,13,1,159;11,160,161;27,162;3,163;21,164,165;19,164,165;11,166,161;11,167,168;3,169,92;11,170,168;11,171,161;22,172,173;11,174,175;9,176;21,177;11,178,161;11,179,180;11,181,161;19,182;28;11,183,161;11,184,161;11,185,161;11,186,161;11,187,161;11,188,180;11,189,161;11,190,161;21,191;29,192;21,193;21,194;3,195,196;22,197,198;22,199,200,113;14,201;11,202,13;19,203;19,194;17,204,205;21,206;11,207,180;11,208,180;11,209,180;28,210,13,211;19,212;11,213,180;19,214;11,215,161;19,206;11,216,161;11,217,94;11,218,180;11,219,180;3,220,221,11;3,222,223,11;11,224,225;11,226,161;19,227;11,228,161;11,229,161;11,230,161;11,231,180;11,232,161;19,233;27,234;11,235,161;11,236,161;11,237,161;11,238,180;11,239,94;11,240,180;11,241,161;11,242,180;11,243,161;11,244,13;11,245,180;11,246,161;11,247,180;11,248,161;11,249,161;11,250,180;11,251,161;11,252,161;11,253,180;11,254,180;11,255,180;11,256,180;11,257,180;11,258,180;11,259,161;11,260,161;3,261,223;11,262,180;19,263;28,264,196;11,265,180;11,266,161;26,267,268;11,269,180;11,270,161;11,271,161;11,272,161;3,273,274;3,275,196;11,276,180;11,277,161;11,278,180;11,279,161;23,280,118,281,120,282;11,283,45;11,284,94;11,285,180;11,286,161;11,287,180;11,288,225;11,289,180;11,290,161;11,291,161;11,292,161;11,293,180;11,294,161;11,295,161;11,296,180;11,297,225;11,298,180;11,299,161;11,300,161;11,301,161;11,302,161;11,303,180;11,304,161;3,305,223,11;11,306,180;11,307,13;11,308,180;11,309,161;11,310,161;19,311;11,312,180;11,313,161;11,314,180;11,315,161;11,316,161;11,317,180;11,318,161;11,319,161;11,320,180;11,321,161;11,322,161;11,323,161;11,324,180;11,325,161;3,326,196,11;3,327,223,11;11,328,161;21,203;3,329,196,11;11,330,180;11,331,161;21,332;3,195,333,11;3,195,334,11;11,335,161;20,336;11,337,180;11,338,161;11,339,180;19,340;11,341,161;11,342,180;11,343,161;11,344,180;11,345,161;11,346,180;11,347,161;11,348,180;11,349,161;11,350,161;15,351,352;11,353,38;3,9,274,11;3,354,355,11;11,356,180;11,357,161;11,358,161;3,359,196,11;19,360;11,361,180;11,362,180;11,363,161;11,364,161;11,365,180;11,366,161;11,367,161;11,368,38;11,369,161;11,370,161;11,371,180;11,372,161;26,267,373;11,374,161;11,375,45;11,376,161;11,377,161;11,378,161;11,379,161;26,267,13,380,381;11,382,180;11,383,161;11,384,180;11,385,161;11,386,180;11,387,161;11,388,94;23,389,5,390,120,391;11,392,180;11,393,161;11,394,161;11,395,94;11,396,38;11,397,161;11,398,161;11,399,168;11,400,45;11,401,45;11,402,45;11,403,45;9,404;4,405,13,1,406;26,153,407;29,408,92;9,409,410;26,153,411;29,412,413;21,414;11,415,118;21,416;11,417,13;29,418;27,419;9,420;6,421,180,422;6,423,180,422;6,424,180,422;9,425,426;9,427;9,428;5,429,13,1,422;12,430,35;27,431;27,432;26,13,418;20,418;11,433,175;14,434,435;14,436;20,437;20,438;27,439;23,30,118,440,120,441;3,13,413;27,442;30,443;11,444,45;31;27,445;14,446;21,447;26,267,448;30,449;14,450,442;27,451;27,452;27,453;30,454;27,455;26,267,456;26,153,457;20,458,459;27,460;27,461;30,462;19,463;11,464,161;14,280,465;14,101,466;3,87,196;27,467;27,446;26,153,468;27,469;27,470;27,44;30,471;3,472,196;26,13,473;27,474;27,475;14,82,476;27,477;17,478,479;14,450,480;30,446;27,481;27,482;26,153,483;26,153,484;14,485,486;29,487;19,177;11,488,94;11,489,161;21,490;14,450,491;14,492,485;27,493;27,494;14,450,495;30,496;30,497;14,498,486;27,499;26,13,87;14,450,500;26,13,501;14,502,503;27,504;20,476;14,505,476;30,494;27,436;14,434,506;27,507;27,508;30,509;30,510;14,511,512;3,513,514;17,468,65;27,100;11,515,38;11,516,38;27,517;11,518,225;22,519;27,520;26,521,522;27,523;14,450,524;14,450,525;14,450,45;27,526;27,527;11,528,38;27,492;14,468,446;27,529;27,530;27,531;11,532,13;11,533,38;30,534;11,535,94;30,536;30,537;30,538;11,539,94;27,540;14,450,501;30,541;27,505;22,542,543,544;11,545,168;3;30,546;27,547;26,13,446;27,548;11,549,38;27,550;14,507;27,551;14,552,553;30,554;29,555;14,450,556;28,557;27,558;30,559;20,560;11,527,94;27,561;20,562;27,563;11,564,161;11,565,94;30,566;26,267,567;26,568,569;14,505,570;30,571;14,101,572;11,44,168;11,573,13;11,574,13;11,575,5;26,576;20,577;27,578;20,579,580;11,581,94;27,582;26,13,583;14,450,584;11,585,13;27,586;17,419,587;26,153,588;18,589;26,590;17,505,591;27,592;11,593,161;11,594,175;17,280,595;3,596,597;3,598,459,11;11,599,94;20,600,118;11,601,161;11,46,175;27,602;11,124,38;14,603,480;11,604,94;14,434,605;30,606;11,607,608;26,13,609;27,610;20,611,459;14,82,459;20,612,613;27,614;14,49,485;11,615,94;14,505,616;29,87;26,13,617;27,618;30,619;11,620,38;27,621;14,622;14,49,623;14,624,625;26,626,627;20,628;27,629;27,630;32,631;27,632;27,633;27,634;11,635,161;14,511,45;11,636,161;30,637;3,638;28,639;20,280,223;27,640;27,641;27,642;14,502,643;30,644;30,645;11,646,38;20,647,648;11,649,94;11,650,38;28,651,652;14,467,124;26,153,653;28,654,580;30,655;30,507;27,656;26,267,627;27,657;11,658,38;26,153,580;14,659,569;14,49;27,660;20,661;30,662;30,663;26,664,665;14,666,667;30,668;26,153,418;14,434,669;27,670;11,671,38;27,604;20,659,459;14,492,49;27,672;30,673;20,674;20,675;27,536;32,507;11,676,13;20,502,118;26,677,665;26,13,628;14,434,470;14,470,678;27,679;27,680;27,681;11,682,94;11,44,161;20,647,580;27,683;26,153,647;26,684,685;14,686,519;30,687;22,688,689;20,690,223;14,691,692;11,693,38;13,617;27,124;14,694;26,13,695;27,696;11,552,94;26,697,698;30,699;20,700,701;14,604;14,82,702;21,703;14,704,705;20,706,580;26,153,707;14,450,708;11,436,94;20,709;26,13,710;20,710;14,450,438;30,100;20,711,274;26,712,713;20,714,92;14,82,280;20,715,580;13,716;14,434,717;13,718;11,719,180;11,720,13;27,721;30,722;20,723,724;14,511,124;11,725,161;27,726;28,727,580;27,728;11,729,38;19,730;20,731;3,732,196,211;11,124,161;11,733,13;9,196,734;13,13,735;14,30,49;14,470;30,736;19,737;11,738,45;14,450,739;11,740,38;11,527,161;27,741;20,706,742;20,743;27,744;26,712,745;27,746;19,747;11,748,161;27,749;14,468,470;26,626,750;11,751,94;13,752;14,492,753;27,449;21,754;11,755,38;27,756;14,511,757;19,758;11,759,161;26,13,760;30,761;20,762,274;14,450,763;27,764;28,13,765;27,766;28,13,13,118;20,767;14,511,768;19,769;14,770,513;14,468;26,13,771;27,772;11,773,13;11,774,13;11,775,13;14,450,770;27,776;17,717,777;26,521,778;26,712,779;14,558,780;27,781;26,521,87;14,450,782;14,82,783;27,784;30,785;20,87,580;27,786;14,502,505;30,470;22,787,788;14,789;14,49,492;14,389,790;30,485;22,791,792;27,793;27,717;29,794,459;20,275,795;11,796,38;11,797,161;14,450,798;27,799;11,470,175;27,800;26,801,617;11,802,94;27,566;27,803;30,804;22,805,806;28,807,196;11,808,38;11,809,161;26,267,810;20,811,92;14,566;27,812;26,153,813;14,814;11,815,45;27,816;14,450,446;26,153,817;20,501,223;20,818,819;19,820;30,808;20,821,118;28,822;14,511,823;14,824,825;11,826,38;27,827;27,828;27,829;20,830,459;21,275;11,831,38;30,832;20,833;29,834,459;30,835;20,87;13,836,735;14,511,837;30,838;11,49,161;26,13,84;27,839;11,840,161;20,841,5;11,842,161;14,511,275;11,843,161;19,754;26,712,844;14,498,485;14,389,845;27,846;3,847,514;11,848,225;27,849;27,619;14,450,850;11,124,5;11,851,5;20,852;22,853;30,854;9,855,856;14,857,778;20,450;20,858,459;30,629;30,859;20,811;14,511,860;11,861,118;11,275,94;30,862;26,267,863;27,864;14,865,631;11,866,94;30,867;20,418,118;26,13,868;20,869;11,870,161;14,434,871;11,523,5;14,82,872;14,82,873;30,874;14,558,872;14,101,875;27,876;17,498,877;20,878,879;29,880;22,688,881;30,882;14,505,883;20,414;14,434,884;26,267,87;11,885,38;21,177,754;27,840;20,886,92;27,887;27,888;27,889;20,501;27,890;30,891;28,13,13,11;11,892,168;14,893;14,468,519;27,894;11,895,94;17,896,65;11,775,45;11,523,38;20,811,413;27,897;14,511,898;11,899,94;14,511,900;14,511,901;20,902,580;20,903,459;27,904;30,905;14,450,906;14,450,907;14,450,898;20,899;14,511,908;14,450,909;14,511,723;30,910;21,194,144,145;20,175,514;26,153,911;26,153,912;14,502,647;20,706,355;20,913,274;28,861;11,914,118;20,915,355;20,706,221;26,267,750;13,916;30,492;27,917;11,918,38;14,450,124;21,919;20,920;26,921,922;20,923;11,924,161;14,450,925;20,706,459;14,505,926;11,927,161;11,928,161;26,712,929;14,498,49;11,930,94;30,931;3,932;30,933;14,686,570;30,934;11,935,38;11,100,161;11,936,161;20,717,355;20,480;30,937;20,938;11,939,161;20,940,580;11,941,94;30,935;26,153,942;29,706,223;27,943;27,944;26,945,946;30,947;27,948;17,505,65;22,519,949;3,950;30,951;11,952,94;14,478,623;14,450,953;29,954,955;11,956,13;27,485;14,450,957;11,910,94;11,958,94;20,959;19,275;20,960;14,824,267;14,511,961;14,192,692;27,962;13,963,118;11,964,94;11,691,94;28,639,196;11,965,38;26,521,966;20,967,652;11,968,38;20,969;3,13,13,211;20,970,92;20,971,413;26,267,220;27,572;11,972,118;11,832,161;27,973;28,638;20,974;28,13,13,211;11,975,118;26,267,617;27,976;27,977;14,100;14,450,978;13,979;27,498;14,980,981;14,624,760;28,982,459;30,983;26,984,760;11,985,161;14,98,898;11,986,118;26,267,987;13,124,5,988;21,989;26,267;11,990,38;14,991;14,992;14,993;14,994;26,712,995;27,996;20,997,5;13,998;14,854;27,999;13,1000;11,1001,161;27,1002;27,1003;20,1004;11,1005,161;29,1006,459;26,626,1007;11,1008,38;27,231;14,434,778;14,717,1009;30,1010;11,501,38;27,1011;14,824,1012;27,468;11,1013,13;11,1014,13;11,1015,38;17,49,65;27,905;20,1016;14,511,1017;14,49,619;14,1018,87;20,1019;19,1020;22,688,1021;19,1022;20,961,580;17,101,65;27,1023;26,712,1024;20,1024;14,450,768;20,896,459;11,1025,118;11,1026,94;11,1027,94;11,1028,38;27,1029;20,124,1030;26,1031;27,1032;20,1033;20,175;14,505,1034;14,82,1035;27,1036;27,1037;27,1038;14,624,628;30,1039;11,1040,608;27,1041;14,505,1042;14,101,1043;27,1044;11,1045,94;11,1046,94;11,1047,175;17,511,1048;11,1049,94;11,1050,38;3,950,459,11;30,1051;27,778;13,1052;27,1053;21,177,1054;20,418,613;14,511,1055;14,505,1056;14,511,1057;30,1058;27,723;14,824,647;13,447,5;27,1059;27,1060;26,447,760;29,1061,459;20,515;14,389,47;27,80;11,1062,38;11,1063,38;20,1064;27,546;27,1065;26,153,1066;26,1067,87;27,1068;11,1069,94;14,512,788;27,1070;27,85;11,1038,161;27,1071;32,1072;27,1073;30,1074;11,1075,94;30,1076;11,1077,5;32,275;22,1078,1079;14,84,875;14,1034,875;30,1080;11,100,38;20,1081;13,275;11,1082,5;27,1083;30,1084;20,1085;11,1086,94;14,470,688;27,1087;14,1088;14,824,1089;11,1090,168;14,686,1091;14,98,1092;20,1093;21,1094;14,434,45;20,1095;30,1096;30,1097;26,712,1098;30,1099;14,450,871;14,1100,961;14,505,961;27,1101;14,511,1102;13,1103,735,988;30,124;11,1104,94;30,1105;26,1106,1107;14,450,1108;20,706;27,1109;9,1110;29,1111;14,98,1112;27,1113;14,505,583;27,1114;11,1115,94;20,871;17,407,1116;20,1117;27,1118;20,1119;20,1120,580;21,1121;11,956,45;14,545;26,13,1122;27,808;22,1123;27,1124;14,619,572;14,1125;21,1126;27,1127;20,1128;11,1129,13;26,945;11,264,94;30,1130;20,1131;29,1131;26,267,1132;27,1133;14,1134;14,505,1135;26,13,480;27,1136;29,544,742;29,1137;11,1138,45;14,508,1139;26,153,1091;14,511,1140;20,1141;11,1142,94;29,1143;30,1144;20,796;20,13,5;26,13,1145;11,462,94;20,45;20,910,5;14,450,1146;30,912;14,450,1147;14,434,1114;20,808;11,1148,13;27,1149;11,1150,161;27,1151;14,434,124;28,1152;3,1152;27,1153;14,498,1154;20,647;26,13,1155;11,100,94;14,896,1112;14,434,1004;28,1156;11,1157,118;20,1158;19,194,144;27,1159;20,1160,580;29,760;29,768;27,1161;9,1162;28,13,196,118;11,527,168;20,997;26,267,778;14,450,82;14,511,1163;14,450,275;14,434,768;14,450,1164;14,101,628;14,450,98;11,1165,94;19,1166;11,1167,180;19,1168;11,1169,38;17,1170,1171;6,1172,1173,1171;9,1174;11,1175,45;11,1176,161;11,1177,161;26,1178;9,409,1179;20,1180,648;20,155;14,1181;14,82,1182;14,1183;26,1067,1108;27,1184;14,450,1185;20,1186,118;20,647,1187;26,153,45;11,1188,38;26,712,1087;11,1189,180;26,153,760;20,1190;26,712,470;14,450,1191;14,511,1192;11,1193,94;11,414,175;14,505,124;19,1194;28,1195,459;20,1196,118;27,931;29,1061;29,788;26,1197;27,1198;14,450,470;27,1199;11,1200,38;20,600,879;11,1201,94;11,1202,94;11,1203,38;11,275,175;13,1204;14,1205,778;33;30,1206;14,865,871;14,450,1207;22,1208;32,743;26,267,1209;27,1069;14,450,1210;14,101,485;14,450,468;26,267,13,380,1211;20,1212;19,414;11,1213,161;27,892;27,1214;11,1215,94;14,840;14,1216;22,688,1217;22,688,1218;22,688,1219;14,101,1220;27,1221;27,1222;14,498,1223;26,13,438;26,847,569;20,1224;17,894,1225;11,1226,175;20,760;14,659,359;27,1227;27,1228;22,853,1229;14,502,825;20,1230,92;14,280,1231;14,450,1232;20,1233;26,13,275;27,1128;14,450,1234;30,1235;26,267,1236;11,1237,94;20,1147;26,153,1238;29,414;11,1239,94;20,1240,459;21,1241;11,1242,38;14,450,1158;14,434,1158;20,1243;9,1244;20,1240;26,153,1245;11,1246,94;11,1247,94;14,468,124;20,912;14,511,647;11,1248,38;27,1183;27,1249;27,1250;14,505,1251;11,446,45;27,1252;11,1253,175;14,502,1254;14,434,267;11,1255,94;14,485,479;20,814;26,13,470;20,1256;13,1257;20,1258;28,654,196,11;27,1144;11,1259,175;11,414,168;11,1260,45;27,1261;13,1262;20,1263;20,692;11,100,175;26,712,871;11,1264,5;27,1265;27,512;11,1266,38;27,1267;27,1268;20,723;27,1269;26,153,1158;9,1270;26,1271,1272;3,1273,196,11;14,1274;20,1275,118;20,275;14,450,1276;26,1277,1278;26,712,808;17,619,65;3,13,413,118;27,471;27,1279;11,1280,94;27,1281;13,1282;22,1283,1284;14,502,1158;14,502,1285;14,502,500;14,824,808;29,938;11,964,38;30,1286;11,1287,45;15,1288,1289,1290,1291;27,1292;28,847,196,211;20,723,580;23,1180,118,1293,120,1180;11,1294,168;15,419,1295;28,727,196,211;11,1296,118;3,1297,196,11;28,1298,196,11;28,1299,196,211;3,1300,196,211;27,1286;28,847,196,11;28,1301,196,211;32,1302;26,814,1303;9,1304;3,1305,196;11,1306,94;14,502,1307;14,540,640;14,468,414;9,1308;9,1309;9,1310;32,1311;20,1312;21,1313;14,1314,1315;20,1316;21,194,13,1317;11,1318,168;14,1314,938;21,1319;26,153,1320;14,502,1315;14,502,275;13,1321;11,1322,94;27,1323;22,1324,1325;22,1324,1326,113;22,519,1327,113;11,1328,94;22,1329,1330;26,814,1331;21,1332;28,822,196,11;27,992;27,1333;17,280,1334;28,1299,196,11;3,1335,196,11;28,727,196,11;26,712,695;20,1191;26,153,1336;32,808;22,688,1337;26,712,1338;26,712,811;20,87,92;30,1339;22,1283,13,113;13,1340;11,786,45;19,778;30,1341;26,13,569;11,1342,161;3,1343;11,1344,38;11,1345,161;11,994,161;26,1346,627;26,1347,1348;3,13,196,1349;25,485,1350,38;30,1314;17,419,1351;27,1352;28,1299,459,11;28,1299,1353,11;26,267,1032;14,505,1338;22,1354,1355,113;27,993;28,1025,196,11;26,1346;20,1322;21,1356;11,1357,94;26,1358,1359;11,723,1360;19,1361;14,1362,1363;26,712,611;20,904;28,1364,196,11;3,1108,196,11;32,418;27,1365;26,814,727;28,1366,196,11;13,1367;26,153,1368;27,1369;22,519,1370;32,966;17,511,808;13,13,1030;28,1371,196;27,1287;3,847,196,11;14,1372,1373;13,1374;3,1108,196;20,1375;21,1376;13,447,735;20,13,580;20,447,459;11,1377,118;13,1378;32,1379;26,712,1380;22,519,1381;27,1382;23,1383,118,1384,120,1067;26,267,1385;26,267,13,380,1386;27,1320;27,1387;21,1388;19,1389;32,414;21,1390;13,1391;28,13,196,211;3,13,196,211;21,414,1392;11,1393,175;15,1394,1395;20,1396;26,267,480;26,267,1397;20,1398;14,659,1399;26,267,505;11,1400,45;26,712,446;28,654;11,1401,94;24,928,1402;22,688,1403,113;26,267,1404;28,654,459,11;21,1405;26,814;3,13,613;14,82,973;17,686,808;11,1406,1291;28,654,459;3,950,459;14,28,98;21,737;29,1321;29,1407;14,505,808;17,511,1408;5,1409,13,1,1410;13,1411;19,1126,144;26,712,1412;14,505,1412;20,1413,92;20,1414,735;20,1414;11,1415,161;20,222,735;11,1416,38;20,1417;27,1418;17,101,883;17,98,1419;17,98,1420;17,98,1421;14,82,1422;11,1423,180;11,1424,161;14,1425;9,1426;25,49,137,13,120,1427;26,267,569;14,49,1428;25,49,137,13,120,1429;30,840;14,450,569;14,48,1100;26,13,1430;14,82,616;14,1431,616;14,505,1432;14,505,1433;14,505,616,1434;16,1435,1436,64,1437;14,540,1438;27,1439;13,1440;27,1441;26,13,567;20,1442;17,505,1443;11,1444,13;27,1445;30,1446;29,447;11,1447,45;20,1091;30,1448;14,101,1449;14,30,981;14,1450,981;26,13,981;14,101,981;14,498,1451;17,98,1452;14,30,1100;14,1372,981;17,407,1453;14,1362,1454;27,1455;27,1456;14,1100,30;14,1100,981;14,1018,47;14,407,981;14,492,1457;17,98,1458;14,101,1459;19,1460;17,572,1461;14,48,49,1434;14,84,1462;14,46,1463,1434;14,512,1464;17,470,1465;14,28,47;14,502,1466;26,626,1467;13,1468;11,1469,225;20,1470;17,686,1471;26,1472,9,380,1473;11,1474,94;11,1475,1476;11,1477,161;26,153,1478;28,1299;13,1479;11,1480,38;26,13,1481;20,1180;20,503,580;32,1482;32,1483;26,153,938;17,659,1484;27,1485;16,865,1486,64;20,1487;30,1488;14,1161,1004;14,1161,1004,1434;26,153,1489;20,479;21,1490,144,1491;19,1490,144;26,712,1492;16,54,1493,152,1494;11,1495,38;14,505,828;14,505,1496;27,1497;11,1496,161;10,1498;10,1499;14,505,1500,1434;26,1501,1158;14,1496;11,1502,45,1290,1503;15,1504,1505;11,1506,94;11,1507;34,570,1508;21,1509;20,1510;20,1511;20,1512;20,1513,223;23,1514,5,13,120,1515;19,1516;11,1517,161;11,1518,161;9,1519;23,1514,5,1520,120,1521;23,1514,5,1522,120,1521;32,1523;34,570,1524;20,9,92;16,1514,1525,152;26,153,1510;14,505,1526;11,1118,161;11,1527,5;9,1528;11,1529,38;11,1530,38;1,1531,1,1532;11,1533,45;11,1534,38;28,1535,196,11;11,1536,168;30,1537;27,1538;22,674,1539;11,1540,175;11,1205,175;25,1541,1542,13,120,777;17,1543,87;15,1544,1545;11,1546,5;17,505,1547;26,153,1548;11,1549,118;14,450,498;32,192;3,1550,196,11;14,1551;27,1552;4,1553,13,1,1554;26,712,1555;4,1556,13,1,1557;11,1558,94;11,1559,94;14,1205,1560;14,824,1561;4,1562,13,1,1563;4,1564,13,1,1565;21,1566;29,438;11,1567,38;9,1568;9,1569;26,267,1570;20,1513,274;35,1571,1,1572;21,1573,1574;20,1575;11,1576,38;11,1577,45;26,267,1578,380,1293;20,1579;23,511,118,1580,120,1581;21,1582;20,1583;26,267,759;20,759;26,153,1584;26,13,1585;26,712,1586;11,1587,94;20,1588;11,1589,38;9,1590;14,502,997;26,712,997;14,505,1591;14,624,419;13,1592;10,1593;14,824,1594;11,1595,225;17,82,468;26,1596,1597;15,1598,1599;4,275,13,1,1600;11,1601,94;21,1602;17,505,1603;13,617,5,988;14,824,1604;20,1584;14,824,1032;11,1605,45;11,1606,168;20,1607;11,1608,38;14,434,407;14,502,871;11,1609,38;27,1610;14,511,1611;27,1612;28,1613;3,1614;20,1615;29,1615;11,1616,175;20,811,459;26,153,1617;20,1618;20,905;20,1619,118;14,511,414;14,485,1620;32,438;20,434;26,521,1621;14,686,768;14,450,1622;14,389,572;20,447;29,124;22,853,1623;3,727;26,712,1624;14,498,1625;11,1626,5;11,1627,38;11,1628,38;14,505,486;11,1629,175;14,450,1630;27,1631;11,1632,38;11,1633,38;20,910;27,1622;27,1634;27,1635;27,1636;14,813,98;11,1637,118;11,1638,38;20,1639;20,1640;14,450,1240;32,871;20,1641;14,450,1642;17,450,1453;11,1643,175;14,558,512;17,1644,1645;17,505,1646;26,153,570;32,1647;14,450,1648;14,624,1649;14,450,1650;11,1651,161;11,1652,161;21,778;30,1653;13,1654;15,1655,1656;20,1657;14,468,418;14,511,1658;14,865,1659;11,1660,608;20,1207,459;27,1661;26,13,1662;11,1663,45;11,1664,161;28,727,196;20,1183;14,280,418;26,153,1055;27,1658;14,450,1665;14,572,1666;11,1667,38;26,13,1668;27,1669;11,1670,180;11,1671,94;11,1672,5;11,1673,180;11,1674,180;11,1675,5;9,1676;11,1677,161;14,82,1678;27,1679;26,712,124;32,710;11,1680,94;11,1681,45;20,1591,879;11,1682,161;29,743;11,944,38;19,1683;30,1684;20,1685;27,1686;9,1687,1688;36,1689,13,1690;9,1691;9,1692;37,1693,1694;30,1695;20,1696;20,1697;20,1698;14,468,1699;11,1700,608;28,1701;30,1702;11,654,118;14,450,1703;17,101,912;20,1704;26,267,446;11,492,161;27,1705;14,468,1706;11,1707,13;27,941;20,1597;20,1708;27,1709;27,1710;27,1034;14,101,1261;20,828;20,1711,879;20,1712,92;20,1713,459;27,1142;17,98,1714;9,1715;20,1591;26,1501;22,688,1716;20,1717;20,1718,459;26,153,1719;20,1720;22,519,1721,113;11,1722,161;20,1723;27,1724;14,471;3,1725,1726;22,1727,1728;27,1729;20,1730;14,1010,1731;9,1732;26,267,1430;28,1733,459,11;11,1734,13;9,1735;9,1736;36,1737,13,1690;9,1738;11,1739,161;11,1740,94;20,1741;27,1742;28,13,13,1743;3,13,1744,118;29,1591;22,688,1745,113;20,1746,413;26,712,480;14,1747;26,712,49;14,511,1293;26,13,1748;22,519,1749;13,1750,5;27,1751;26,1752;27,1753;27,437;11,1754,38;11,1755,161;11,1756,94;20,1757;14,1758;14,450,1759;30,1538;32,480;26,801,485;20,1760,701;11,1761,94;11,1762,94;30,1586;27,1763;14,1764,1765;27,1766;27,1767;27,1768;14,498,1769;11,1770,45;14,389,1771;14,1772;30,552;20,1773;19,1774;15,1775,1776;15,1777,1778;11,1779,38;11,1780,38;26,13,1781;17,82,808;11,418,118;27,1782;29,1783,459;14,498,1784;30,1785;11,498,168;26,267,1786;14,1787;11,1788,38;11,1789,38;14,434,275;14,686,337;3,1790,1791;11,1792,161;27,1793;27,1794;26,1596;26,13,1795;17,98,13;11,1068,94;14,468,28;29,511,413;17,434,1004;9,1796;14,505,1797;11,1798,13;11,1799,118;26,267,1216;20,28;17,30,1800;14,101,631;21,1801;14,511,808;26,153,893;14,434,1192;20,1802;21,1803;26,712,1804;11,1805,161;14,572,1806;17,973,65;27,620;14,450,1615;25,49,1807,1808;9,1809;21,1810,13,1811;17,840,1812;22,1813,1814;14,505,1659;26,1815,1816;28,1817;26,814,220;26,814,1818;14,485,760;11,1819,94;11,1820,161;14,434,898;37,1821,1822;9,1823,1824;36,1825,13,1826;21,1827;14,498,479;20,1828;17,558,13;27,1829;20,1830;27,845;17,558,1831;27,1832;28,87;17,896,468;26,712,760;22,688,1833;20,1834;26,267,961;28,1835;14,485,49;27,899;27,1836;30,1837;11,1838,161;11,1839,5;11,1840,13;19,1841;21,1841;20,13,274;27,1537;14,717,1842;26,1067,45;14,1843;28,1844;27,1845;26,1846,1847;22,688,1848;3,1849;14,28,1850;14,511,1851;19,1852;14,824,414;28,1853;28,1854;22,1329,1855;14,450,600;26,1067,595;26,267,1856;3,1857,274;14,28,1858;27,1859;22,1078,1860,1861;19,177,144;38,1862,1,1863;4,1864,13,1,1863;9,1865;28,1866;29,1867;28,1868;14,505,1869;11,1214,161;20,1870;20,1871;28,1872;21,1873;14,511,1874;21,1875;27,30;28,1701,1876,1877;9,1878;27,1879;14,558,507;14,1880;11,674,161;11,1881,161;14,505,1882;17,101,479;3,1883;20,1884;21,1885;11,1672,1886;11,1887,45;20,965;14,505,435;17,505,1888;14,478,631;11,1889,118;26,801,1890;20,1891;26,267,1292;4,1892,13,1,1893;28,1894;28,1025,196;20,1895;17,840;20,1126;26,153,904;26,1067,1896;27,1897;27,554;28,1898;14,450,414;13,1899;21,1900;22,1901,1902,113;39,177,1903;11,1904,180;11,1905,161;20,1906;29,1907;21,1908;14,511,1909;17,1910,1911;14,824,1912;20,1913,580;11,1914,38;3,87,221;3,811,724;17,101,13;11,1915,38;17,98,1800;28,1916;17,450,65;27,1917;19,1918;20,1919;27,1920;11,1854,118;17,101,777;17,82,275;17,98,65;11,1883,168;27,1837;26,1921;27,1922;11,1923,5;14,505,418;14,502,479;17,1924,1925;14,1926;17,1927,407;13,1928;3,1929,1726;17,478,777;3,1773,196;11,1930,161;20,1931,223;17,28,65;22,519,1932;19,447;14,1161;13,447,118;21,1657;14,511,1018;14,511,467;11,1933,161;21,219;20,1934;14,450,28;14,511,595;19,1935;26,153,1936;27,552;9,1937;9,1938;30,1161;26,153,1939;19,1940;14,468,788;14,505,1941;27,1942;17,1056,468;27,29;17,505,883;20,1943;19,1657;14,686,1944;22,688,1945,113;22,1946,1947,113;19,1948;22,1329,806;28,727,13,211;11,1949,225;22,1329,1950;14,450,1951;3,1952,223;26,153,569;14,280,87;27,1953;26,267,1954;11,1955,94;3,1956,196;3,1957,196;11,1958,118;14,1959;14,512;17,28,777;27,1960;14,511,871;21,1961;19,1962;14,82,1963;3,1964,196;11,1965,161;11,1966,94;20,1967;40,177,1968,1491;26,712,1583;26,13,1969;14,624,743;26,1067;27,1970;14,1971;14,98,997;14,434,1909;11,1972,38;11,1973,38;26,13,1974;3,1975,221,211;11,1976,94;11,1977,13;26,1178,13,380,1978;29,1979;17,101,87;11,1980,180;11,1981,94;28,1982;32,124;14,502,778;20,1983;3,654;14,1984;14,101,498;9,275;37,1985,1986;3,1987,459,11;21,177,144,145;21,1988;20,1989;26,153,1990;22,1991,1992,113;11,1993,161;28,727;17,468,1994;21,1995;3,438,514;27,1996;30,1997;9,1998;14,450,1999;27,2000;20,2001;17,505,2002;28,1273;11,2003,38;14,192,2004;14,450,808;20,2005;28,1931;11,275,45;11,1011,45;27,2006;14,84,486;14,434,1871;14,505,2007;20,2008;14,498,1004;11,100,608;11,2009,45;21,2010;19,2011;11,2012,5;27,2013;27,2014;30,2015;20,2016;11,941,161;14,865,485;13,2017;26,2018,1890;14,824,2019;11,2020,161;20,2021;11,2022,45;11,2023,94;13,2024;29,275;27,2025;14,450,2026;27,2027;3,2028,196;30,1029;27,2029;29,2030;22,519,13,113;30,2031;26,418;11,2032,94;27,2033;14,505,2034;28,2035;14,512,2036;20,706,2037;3,1358,223;14,498,631;11,2038,94;27,2039;19,2040;26,267,2041;19,1340;27,1246;21,2042;27,2043;27,407;20,688;17,478,2044;27,2045;27,2046;14,1372,778;27,2047;32,778;14,101,2048;14,558,2049;14,389,1043;28,2050,879,211;14,511,938;17,505,1453;27,2051;27,2052;14,450,2053;14,505,446;28,2054;14,2055,692;11,2056,94;14,2057;20,2058;19,1490;14,450,2059;17,505,2060;20,1513;14,2061,124;27,2062;11,2063,94;21,2064;23,2065,118,2066,120,2067;21,414,2068;14,2069;11,2070,38;11,2071,161;3,2072,580;22,688,2073,113;26,712,675;9,2074;14,2075,1118;20,175,735;28,1025;30,869;11,2076,168;14,2077;26,267,2078;11,778,45;14,505,871;20,13,92;20,583;3,9,223;21,2079;23,2080,118,161,120,583;11,1982,118;13,2081;27,2031;30,1679;14,511,2082;11,1205,13;11,2083,94;9,2084;9,2085;4,2084,13,1,2086;36,2087,13,1690;36,2087,13,2088;14,30,2089;26,267,2090;26,153,124;19,1313;19,2091;26,13,101;26,712,2092;11,2093,118;19,2094;27,518;14,49,2095;20,643;29,2096;14,450,2097;14,505,1091;22,688,2098;20,1931;11,2099,118;28,654,196,211;20,2100;20,2101,274;13,2102;22,1329,2103;22,1329,2104;14,2013;11,2105,94;11,2106,118;9,2107;17,845;21,2108;22,2109,2110;22,2109,2111;22,2109,2112;22,2109,2113;26,153,572;26,153,500;26,13,912;29,2114;26,13,2114;26,13,2115;22,1329,2116;11,2117,45;30,2118;20,2119;17,450,2120;11,2121,161;21,2122;9,2123;9,2124;20,2125;11,2126,118;14,2127,778;26,13,1147;32,2128;23,280,118,161,120,124;20,811,274;21,2129;11,2130,161;11,892,161;29,1191;11,2131,38;14,723;21,2132;22,1329,2133;11,2134,38;30,2135;20,171;11,2136,225;26,267,2137;11,2138,94;11,2139,161;11,2140,38;3,2141,221;30,2142;26,814,894;27,2143;23,125,118,2144,120,2145;28,861,13,211;19,2146;20,1713;14,2147;27,1338;26,712,2148;11,2149,2150;22,674,2151,113;22,688,2152,113;21,2153;21,2154;14,434,1147;20,2155;20,267;14,558,98;7,2156,2157,2158;20,2159;11,2160,94;41,2161;20,2162;20,2163;13,2164;17,505,2165;26,13,2166;14,450,2167;29,2168;14,450,973;20,446;20,2169;20,2170;14,434,171;21,2171;26,153,2172;11,822,118;11,2173,161;16,865,2174;17,824,1925;17,1610,65;17,1450,808;20,2175;20,2176;9,2177;9,2178;14,540;20,2179;9,2180;32,2181;14,1679;20,2182;14,505,2183;37,2184,2185;14,1100,1830;11,2186,38;11,2187,38;20,611;13,2188;28,2189;32,498;11,2190,94;14,49,2191;3,2192,2193,11;20,1191,879;11,2194,38;11,2195,94;21,2196;11,965,161;9,2197;26,2198;21,2199;30,846;26,712,2200;11,2201,225;26,712,177;11,2202,38;32,1158;28,2203;42,2204,118,2205;23,2206,118,2207,120,2208;3,2209,196;28,2210,196;20,2211;14,505,480;11,2212,38;26,153,778;30,2213;30,2214;9,2215;30,2013;14,450,527;20,2216;20,1191,819;27,2217;28,2218,196,11;20,432;17,49,2219;14,505,267;11,1942,161;26,712,2220;11,2221,94;17,280,2222;13,2223;20,2224;22,468,2225;20,631;17,82,2226;27,2227;22,519,2228;26,1067,2229;20,2230;11,2231,225;26,712,2232;20,2233;20,1188;20,2234;17,49,865;21,2235,2236;20,2237;20,2238;11,2239,118;11,2240,94;20,503;14,824,2241;17,2242,2243;27,2244;30,602;11,828,94;30,2245;11,2246,2037;28,87,196,11;14,2247,418;17,2248,2249;26,153,511;29,883;11,867,161;17,973,2250;20,2251;14,502,1164;27,1396;20,2252;30,2253;30,2254;22,688,2255;9,2256;27,2257;15,419,2258;11,2259,94;15,2260,2261;16,2262,2263;28,727,459,11;11,2264,45;11,2265,45;11,2266,45;23,824,118,2267,120,1347;3,2268,196;19,2269;11,2270,5;11,2271,5;20,2272;14,624,450;20,595;17,505,808;22,519,2273;11,2274,118;30,2275;13,2276,5;26,712,2277;11,2278,118;20,2279;20,2280;18,2281;20,2142;11,2282,161;20,2283;11,2284,94;20,2285,2286;11,2287,180;11,2288,180;21,2289;20,860;26,267,2290;20,2291;20,100;11,2292,735;27,2293;27,359;11,2294,2295;20,2296;20,2297;11,2298,161;19,2299;30,727;14,280,124;14,48,87;14,511,2300;30,2301;29,2302;11,2303,161;11,2304,180;43,2305,1061,2306;43,2307,1061,2306;9,2308;4,2308,13,1,2309;21,2310;4,2079,13,1,2311;11,2312,38;11,2313,38;11,2314,38;5,2084,13,1,2086;36,2315,13,2316;20,1773,701;13,13,5;26,267,2317;29,2318;17,485,2319;17,478,450;32,2320;21,2321;26,712,1760;18,447;11,147,175;9,2322;19,2323;7,2324,2325;37,2326,2327;11,2328,2150;11,2329,161;14,434,2330;26,153,2331;11,2332,2333;26,267,2334;9,2335;23,2336,118,45,120,2337;27,2338;11,2339,161;26,626,2340;14,485,2341;14,824,871;17,505,595;3,2342,196;28,2343,196;11,2344,38;22,519,2345,113;26,267,2346;21,2347;11,2348,161;26,153,9;11,1960,161;20,2349;26,153,659;14,505,2350;22,519,2351;30,2352;32,500;30,2041;11,2353,38;11,2354,38;9,2355;4,2355,13,1,2356;14,512,2357;26,1024;11,2358,161;20,1617;11,2359,38;28,438,459,11;14,1387;11,2360,118;3,2361;20,2362;20,2363;36,2364,2365,1690;9,2366,2367;27,2368;14,2369;4,2370;9,2370;29,898;14,502,28;11,2371,180;28,2372;21,2373;4,2374,13,1,2375;36,2376,13,2377;9,2378;11,2379,608;14,512,2380;27,2381;14,450,778;14,717,1034;14,2382;20,2383;22,674,2384,113;22,688,2385,113;17,468,2386;11,2387,94;11,2388,168;6,2389,2390,2391;11,2392,118;11,2393,118;11,2394,5;11,2395,13;20,2396;17,82,2397;27,2398;26,153,2154;21,2399,2400;22,688,2401,113;14,505,46;16,28,2402;17,280,2403;19,2404;19,2108,2405;11,2406,45;11,2407,45;26,13,2408;17,505,2409;26,267,2410;5,2411,13,1,2412;5,2413,13,1,2414;5,2415,13,1,2416;5,2417,13,1,2418;5,2419,13,1,2420;13,2421;41,2422;13,2423;11,2424,2150;27,49;20,768;11,2425,1360;11,2227,38;30,1960;11,2426,161;30,1342;11,2427,118;14,502,2428;11,2429,13;21,737,144,145;14,28,124;20,2430;21,2431,144,1491;26,712,2432;14,1369;14,450,2433;3,2295,196,11;19,2434;30,2435;21,2436;11,2437,161;11,2438,38;36,2439,13,1690;20,2440;30,147;14,824,2441;19,2442;28,1790;20,1781;3,2443,459,11;30,1142;28,13,459,11;3,654,196,11;14,450,2444;26,153,275;19,737,144;29,2445;14,46,1467;11,2446,38;26,267,2447;20,2448;3,2449,724;21,2450;22,688,2451,113;13,2452;29,2453;21,2454;21,2455;20,13,2456;20,2457;4,2458,13,1,2459;14,512,2460;11,2461,13;26,267,9,380,2462;19,2463;21,2463;3,760,196;20,750,118;27,2464;14,30,47;11,2465,94;14,694,2059;11,2466,94;27,2467;14,450,2362;11,2468,94;19,2469;26,626,973;19,2470;21,2470;19,2471;9,2472;9,2473;20,2474;28,2475;21,2476,144,1491;17,49,2477;11,1400,161;21,2478;11,2479,161;11,1406,94;11,2480,94;11,2481,118;11,2482,94;11,2483,161;21,2484;9,196,2485;21,2486;36,2487,13,2488;11,533,161;11,2489,225;14,450,519;21,2490,2491;11,2492,161;26,267,811;14,450,2493;4,2355,13,1,2494;11,2495,45;11,2496,118;9,2497,409;11,2498,2499;17,434,2500;20,2501;20,2502;27,2503;11,2504,94;11,2505,5;11,2506,38;14,450,1024;44;26,13,1597;17,824,1158;11,1879,13;14,865,87;14,30,2507;32,2508;20,2509;27,2510;19,414,144;28,2511,459;3,654,196;20,1180,580;9,2512;11,2513,161;28,1790,196,211;28,654,196;14,450,2514;14,1137,2515;17,28,2516;11,1635,161;20,2517;26,267,2518;27,1761;20,1213;11,2519,225;23,511,118,175,120,2520;26,153,2521;29,2522;20,1622;14,434,2523;11,2524,94;32,486;9,2525;20,2526;17,389,777;11,2527,94;19,2528;11,2529,161;23,511,118,175,120,1147;21,177,2530;14,511,2181,2531;14,824,2532;20,2533;30,2534;11,2535,118;13,2536;26,267,973;20,2537;27,2538;11,2539,5;9,2540;11,2541,94;21,177,13,145;3,1790,459,11;14,434,2542;9,2543;9,2544;9,2545;14,1137,2546;21,2547;20,2548;20,2549;20,2550,701;20,2551;26,712,2552;26,712,418;26,1501,2553;9,2554;9,2555;9,2556;7,2557,13,2558;7,2559,13,2560;7,2561,13,2562;7,2563,13,2562;7,2564,13,2565;7,2566,13,2567;4,2568,13,1,2569;14,505,47;3,1025;4,2570,13,1,2571;11,2572,161;11,2573,118;25,2574,137,2575,120,2576;11,2577,2578;14,1137,2579;20,2580;11,2581,161;23,280,118,2582,120,2583;26,153,2584;11,2585,2586;20,2587;20,2588;21,2589;4,2590,13,1,2591;20,2220;20,2592;17,511,2593;11,2594,13;41,2595;19,2596;28,2597,13,11;11,2598,45;11,1236,45;4,2599,13,1,2600;21,2601;26,267,583;13,2602;14,1772,2603;14,502,1760;14,1372,2604;20,1760;20,44;11,2605,38;11,2606,118;20,2607;14,341,124;26,267,2608,380,2609;37,2610,2327;11,2611,45;21,2612;30,1400;4,2613,13,1,2614;11,1011;4,2615,13,1,2616;26,267,2617;14,511,2618;13,2619;20,505;22,519,2620,544;22,519,2621,544;26,712,2622;14,824,2623;27,1954;9,2624;15,2625,2626;27,2627;14,511,2628;14,511,1024;11,2629,94;11,2630,94;13,2631;26,712,28;9,2632;32,2633;9,2634;14,1010,2635;21,2636;29,583;13,2637;3,13,413,11;13,2638;14,82,2639;11,2640,38;15,2641,2642;22,519,2643;20,2644;11,437,38;29,432;26,267,2645;27,2646;14,558,2647;13,2648,735,988;9,2649;9,2650;11,2651,94;26,267,2652;21,2653;17,505,2654;13,2655;14,2656,2657;29,80;17,505,2658;11,2659,180;17,511,65;11,2660,5;11,2661,5;21,2662;11,2663,180;27,2664;11,2665,161;14,82,511;13,2648;26,712,527;13,2666;13,2667;13,2668;26,267,2669;13,2670;26,153,595;23,659,118,2582,120,2671;23,659,118,2672,120,788;26,712,1881;9,2673;26,712,920;14,824,778;26,267,2674;14,824,811;4,2675,13,1,2676;21,2677,2678;4,2679,13,1,2680;21,2681;20,2682;25,49,2683,2684;25,49,2685,94;11,2686,161;14,468,973;11,917,161;24,928,2687;26,267,2688;20,2689;36,2690,13,2691;7,2692,13,2693;11,2694,45;14,2695;20,2696;30,2697;10,2698;10,2699;26,267,2700;21,2701;19,2702;27,2703;39,2704,1460;39,2705,2706;39,2707,2708;39,2709,2710;20,2711;19,2712;30,2713;27,2714;20,2715;17,2656,2716;27,1586;27,2639;21,1332,144;9,2717;9,2718;14,511,480;21,2719;14,824,501;11,2720,38;22,519,2721;37,2722,2327;19,2326;9,2723;27,2724;39,2725,2726;39,2727,2728;39,2729,2730;4,2731,13,1,2732;4,196,2733,1,2734;4,2735,13,1,2736;20,1061,580;11,2737,161;28,2738;3,2739,2740;20,2741;20,2742;14,450,2743;11,2744,94;23,659,118,2745,120,2746;22,2747,2748,113;3,13,13,118;11,2749,180;11,2750,161;11,2751,161;14,4;11,2752,161;11,2753,161;11,2754,608;4,2755,2756,1,2757;4,2755,2758,1,2757;4,2759,13,1,2757;9,2759;9,2755,2756;9,2755,2758;36,2760,2761,1690;14,98,507;11,2762,38;11,2763,175;11,2764,38;11,2765,180;27,2766;30,2767;20,2768,879;11,2769,38;26,2770,87;11,2771,161;30,2772;30,2773;9,2774;36,2775,2776,1690;36,2777,2778,1690;36,2779,13,1690;11,2780,5;11,1142,5;40,2079,2781;30,2782;20,124,580;14,505,2783;5,2784,13,1,16;1,2785,2786;11,2787,180;14,511,418;9,2788;11,1701,118;11,2789,161;11,2790,94;16,2791,2792;14,1164,2793;14,505,878;15,2794,2795;7,2796,2797,2798;7,2799,2800,2798;22,519,2228,113;22,519,2801,113;14,450,2802;15,1879,2803;19,2804,144;11,912,161;26,801,446;21,2805;14,28,418;11,2806,13;14,505,2807;13,617,5;11,729,161;21,2808;11,2809,225;14,824,973;26,712,2810;14,505,1114;11,2811,180;11,2812,161;11,530,45;14,1137,808;17,505,2813;26,267,2814;14,450,2815;20,2816;14,280,2142;20,13,2817;20,2818;29,2818;26,153,2819;26,1501,2820;11,2821,180;11,2822,168;20,1192;26,712,87;32,1874;29,1943;32,1943;11,2823,161;14,80;20,49,2824;11,2825,161;17,1137,2826;26,712,595;21,737,144,1491;3,1987,13,211;14,505,2827;16,1514,2828,152;17,505,2829;32,1583;11,2830,161;43,2831,1931,1055;17,505,468;17,572,2832;34;9,2833;20,2834;17,2065,2835;13,617,2836;14,2837,1462;14,512,2838;13,2839;21,177,2840;21,177,2841;11,2842,94;11,2843,94;14,450,2844;11,2845,161;14,82,480;11,2846,161;26,712,1100;20,1413;14,1362,446;20,2847;21,2848;14,505,2849;20,500;17,49,2850;21,2851;11,171,168;16,2791,2792,64,2852;40,2853,1126;20,2854;20,13,413;28,2855,459,2856;20,2857;26,267,2858;11,2859,118;4,196,2860,1,2861;23,2206,118,2862,120,2863;26,712,2864;26,267,2865;11,2866,38;13,2867;27,2868;27,2869;27,2870;27,2871;27,1773;27,2872;27,994;27,2873;14,824,2874;22,519,2875,544;20,2876;13,2877,5;11,2878,94;14,502,595;26,712,867;17,558,2879;14,659,973;26,712,2880;20,2880;11,850,38;26,712,1032;11,2881,45;11,2882,225;20,2883;15,1544,2884;24,928,2885;19,2886;11,2887,38;11,2888,38;11,2889,180;11,2890,180;32,177;14,824,997;27,2891;21,2892;20,177;45,2893;26,153,527;14,505,1024;19,2894;26,153,2895;15,2625,2896;20,2467;28,2897,459,11;26,267,2898;14,824,124;9,2899;20,2900;26,2901,759;29,2902;20,2903;30,2904;26,712,2905;21,2906;13,2907;20,2908;14,824,480;11,2909;9,2910;13,2911;13,2912;26,712,2913;32,1024;20,2914;21,2915;19,2915;4,2079,13,1,2916;5,2079,13,1,2916;9,2397,2917;26,712,192;9,2918;21,2919;11,2920,94;11,2921,161;11,2922,94;36,2923,13,2924;5,2925,13,1,2926;1,2927,1,2928;26,267,692;14,828;11,2929,38;11,2930;11,2931;46,2932,1,2933;26,712,2934;11,2935,161;26,267,688;14,1362,883;20,2936;14,824,2937;26,1596,87;26,945,1773;20,2938;13,2939;46,2940,1,2941;14,82,1180;11,2942,161;26,267,2943;20,194;20,2944;14,502,2945;14,824,2945;20,2230,459;26,153,2946;20,2947;1,2948,1,2949;13,2950;13,2951;32,2952;21,2953;21,2954;13,2955;14,192,480;11,2956,225;21,2957;23,2958,2523,13,120,2959;10,2960;10,2961;38,2961,1,2962;11,2963,38;11,2964,38;11,1126,38;11,2965,38;11,2966,94;26,267,2967;11,2968,180;17,558,2969;46,2970,1,2971;24,1543,2972;3,2973,196,11;11,2974,161;13,2975;11,2976,161;35,2977,1,2978;26,267,2979;9,2980;9,2981;19,2982;11,2983,161;14,505,2984;27,2985;30,2986;17,470,1057;21,2987;11,2988,45;11,1777,45;11,2989,38;19,2990;27,2075;19,2991;19,2992;11,2993,161;9,2994;26,13,2995;11,2996,161;23,2997,118,2998,120,2999;19,3000;11,3001,13;9,3002;11,3003,168;18,3004;11,3005,180;11,3006,180;19,3007;11,3008,180;23,1767,1291,3009,120,3010;19,3011;21,3012;11,3013,161;11,3014,161;17,3015,82;21,3016;22,3017,3018,113;15,3019,3020;11,3021,161;19,3022;19,3023;19,3024;22,519,3025,544;11,3026,161;21,3027;47,3028,1,3029;30,3030;11,2397,94;21,3031;27,48;27,3032;30,3033;29,3034;17,3035,3036;19,3037;21,3038;21,3039;21,3040;21,3041;19,3042;19,3043;19,3044;11,3045,161;21,3046;21,3047;19,3048;21,3049;21,3050;21,3051;19,3052;21,3053;19,3054;29,28;46,3055,1,3056";

const $scriptletArglistRefs$ = /* 13293 */ "378;999,1668;1666;115;1540;28;97;441,585;28,450;2821;436,450,762,1099,1100;1622;1104,1999;1668;1273,2407,2408;28,436,437,438;1669,2072;1622;28,1470;1622;1622;1622;2656;3314,3315;30,361,476,483,1874;398,2606,2607;378,476;1347;527,1670;1622;3099;1025;1993;408,1622,1756;115;499,1100,1165;914;1622;1622;1622;2656;1622;2897,2898,2899,2900,2901,2902,2903,2904;28;28,361,419,423,424,425,426,1668;450,967,968,969,970,971,972;1622;2844;999;361;1666;450,691;645;3114,3115;1668;999;1797;28,361,450,1670;358;110,111;28,2273;1747;115;385;115;385,389,419,802;110,406;450,2635;194,710;1470;28,411;3612;999;346;1622;28;28,411,999,1669,1770,1771;436,450,762,1191,1667;3476;28,476;1747;28,762,1192;28,349,361;600,691;1622;358;944,1264;134,146,539,682;2643;1342;1622;791,1501;28;30,1671;1622;378,385,450,498,762,1375;115;30,31,377;221,222;2368;3392;31;632,2026;1540;1669,2072;1766,3436;1669,2072;1672,2745;385,417,418,1666;134;1139,3476;1622;653;476;28,1045;2123;3520;358;1622;1794;110;110;1622;1795;1622;1342;1622;28,450,999,1552,1553;28,110,450,1539,1540,1541,1542;589;378,385,450;1669;361,378,627;28,419,1540;806;1622;28;1798;1622;2748;450;1271,1622,2479;1622;733;3566;1622;1400;361,442,470;1622;1263;1182;1540;999;1993,1994;1670;2004;28,110,450,1539,1540,1541,1542;1274;2091;1622;393,1633;28,361,759;28,1593,1598;999;1622;2752;28,29,30,31;1049,1622;539;28,438,439,440,813;1622;145;1273;2105,2106;608;569;28,691,2420;28;28,411;2984;361,830;385;115;1470;904;3032;454;837;1104,1352;1754;1230;1670;28,378,450,541,584;1148,1186,1470,2530;443;2526,2527;589;386,999,2628;28;785;1104,1435,1670,2147;28,3027;1606,2616;999;1747;105;1747;3417;1747;355,356;411,412;589,623,1644;366;110,1735,1736,2329;2127,2945;328,1270,1622;709,2333;385;2501,2785,2786,2787,2788,2789;450;406;127,1931;1622;2006;1747;3083;2287;2298,2427,2495;1377;28,1770;28;372,591,823,824;1451;349;28,436,450,762,1191,1667;450,1189,1190,1668;367;1470;1668;1540;3216;406,2358,2359;456,611;358,1622;134,146,358,539,616;1247;385,496,999,1540;1267,1622;1342;1639;28,1326,1667;1540;28,775,1667;589,1275,2263;1668;1342;1338;1342;553;361,378,497,627,852;1202;1622;115;1736;1470;28,2995;589;31,543,589;589;1759;1149;1149;1149;589;31;28,621,1254;562;413,1107;3109;1104,1709,2147;3114,3115,3452;288,289;451;361,451,476;3062,3063;2459;1622;1540;1622;2719;713,714;28,1470;450;3509;470,589,1185;858;589,1540,1644,2839;691;1622;1470,1471,1472,1473;3420,3421;1694;1540;1670;999,1128,1129;1748;1622,1747;1622;1949;110;28,837,1669,2030;1736;911,1667;1271,1622,1628;684;2781,2782;28,438,439;1622;127,703,1993,2220,2797,2798,2799,2800;1622;3313;1540;476;28,1973;2454;172,173;137,138,2421;385,451,476,863;115;361,378,627;28;-399,-2607,-2608;28;28,390,476,573,627,709,757,772;3221;3411;1328;28,791;788,1178,1622;30,679,2894,2895,2896;31,632,1835;1470;512,1117;543;1301;1622;28;417;28,999,1669,1681;476,1540,1669;1622;1901,1902;476;1747;28,413,1673,1870;999;1540;172;450,1667;1433,1434;28,419,457,458,459;475;94;2756,2757;1667,1668,1669,1672;2549;2549;2975,2976;28,30,393,600;28;788;1598;28,1668;589;28,57,58,59,60,61,62,999,1540;459;361,378,476,627;1669;28,499,1165;499,1100;1037;114;1956,1957,1958,1959,1960;1108,1109;1667;127,3108;1736;397;1795;1694;1669;439,813;439,813;67,68,1266,1622,1747,2365;2170;380;366,1747;611,1194;358,1737,1738;489;28;28;1622;115;1470;63,64;28,999;2007;1540;1540;228,358;691,1669,1674,2791,2792;1470;589,1652;1669;450,762;589,1601;1470;63,64;28,589;589,621,725;1747;1540;999;476,541,3000,3002;653;1694;441;1104;28,450;1059;354;2804;1128;1283;464,589;1622;1352;1622;1622;632;31,134,589,2177,2178,2179,2180;1747;1759;1186;1546,1569,1570;2381,2382;589;28,476,1670;1470;1470;1622;358;70;28;589;358;1622;1666;791;28,589;496;1470;2676;31,589;28;1642;28;28,1694;450,1499,1500;2711;839;1669;1694;28,1694,1695;1670;2512;28,450,1104;1163;1736,3580;28,476,1667,1669;406,1721;1252;1729;1973,2681,2682;1470;496;3067;1622;3046;28,571;411;28,1540;28,57,58,60,61,62,1540;28;28,999,1770;470;1748;1092;377,385;1252;1747;1140,3476;1328;1470;96;30,999;450;1666;1540,3023;632,1608,1609;28,390,600,691;476;1989;411,953;1668;1622;450,691;999,1678;1666;328,368,1270,1623;3443,3444;1748;845;406;1669;28,1540;361,734;1643;1540,3208;2867;385,2399;361;999;999;1342;352,353,354,1263,1622;3606;1470;1622;110;2045;28,1670;451,1667;354;470,543,1029;1622;1622;3123;3123;1470;28;2860;1743;1704;940;366;866;3284,3285,3286,3287,3288,3289,3290,3291,3292,3293;419;28,413,1107,1691;436;589;426;1792,3579;28,378,546,568,569;430,568;430,568;28,571;331;2037,2038;589,2738;1666;31;3573;589;999;1669,2072;176;2205;28,1667;2472;2205;2205;635;2205;2205;2205;588;28;1470;2205;63,64;63,64;1747;1621;127,1818,3633;664,1747;1622;115;385,450,762;28;395;715,716,717;598;1729;1500,2406;28,571;476;1694;3631;28,2424;385,390,436,450,497;28,1780,1782;2610;1670;2263;110,2329;2220,2797;2656;28;419,1671;28,404,405,1667;63,64;450;1668;28,404,405,1667;28,404,405,1667;28,404,405,1667;789;2605;110;2032;28;2758;1748;331,1413,1414;358;28;1668;385;3565;2616;1499;589;496;390,476,1020,1021,1022,1669,1670;1759;28,571;378,385,450,476,584,863;734;389,1705,1706;2861,2862;662,663,1669;28,1668;985;1622,1747;28,469;377,589;451;28;63,64;1475,1476;1622;1670;361,378,1670;1622;1622;1622;1622;1622;1622;1622;1622;1622;1711;632,3233,3234,3235,3236;473;2616;1748;1932;430;632;589,1470,1640;589;413;2298;600,691;600,691;600,621,691;600,691;1680;1491;1470;2564;429,1117,1118;1540;28,361,389,476,551,552,553,554,1666;361,385,436,450,557,762,1668;496;115,1484,1485;962;3581;980,990,2308;1622;2954;1622;1059;358,1264,1622;28,413,1673,1870;653;1328;450,762;1747;31,411,512,543,589,2043,3319;1669;1668,1678;747;464;1622;1202;1669,2072;476,941;28;28,450,476,762;1043;1405;1268,3049;1748;2809;1622;28;28;1668;1559;1415;3209;77;1252;776,2510;1087;28,722,999,2073;1540,1669;368;902;361;1668,1673;28,439;1674;1667;28,1372,1697;2017,2018;1747;28;419,1667;1671,1672;28,413,476,600,999,1540,1559,1667,2943;491,492;677,678,679,680;28;395,677,678,910,1540,1669;2320;2009;28,29,30;134,146;349;1840;1840;28;127;28,1195,2328,2334;1050;1636;1667;1540;548,1176;176;476;1848;1625;1743;681;1622;2950,2952,2953,2954,2955;3453,3454;1470;450;1213;28;2281;361,830;2564;28;63,64;947,948;589;589;589;28,691,1540,2420;3542,3543,3544;1224;396,419,611;589;1667;2268;110,830;413,1540,1694;63,64;451,867;1470;144,3093;361,1003;450;1540;226,227,2125,2126,2127,2128;1496;115,444,445,446,447,448,449,450;413;28,3111,3481;2135;395,424,496,999;1540;63,64,1540;1671;63,64;999;901,2039;134,893,898,899;610,611;3313;28,470;28,1668;429,461;1470;1372,1373;63,64;691,999;63,64;543;28;28,999,1540,1874,1932;999;1321;28;28,1668;648;3001;104;716,2987,2988,2989,2990;450,497,762,1670;28;28,378,450,1667;450,762;791,1501;2520;3499;385,482;1743;3592;358;1747;1540;1668;632;361;2076;569,934,1291,1540;632;31;1851;28,2415;632;28;632;1470;1667;3462;1540;1842;1418;3521;372;1677;395,1019,1668;1669;115,1484,1486;2043;589;354,1342,1470;624;115;947,948;429,582;28,1540;1668;400,402;28,1158,1540;1666;1684;385,450;1622;1855;1470;1470;498,1667;1622;385,984;1315;2964,2965;3634;1622;2673;63,64;721,873;406;3222;1037,1038,1039,1040;331,1703;28,2689;658,959,3270;3227,3228;1747;354;1670;476;28,31,1540;1381;791,1501;589;1180;583,609;1049,1622;627,1050,1666;450,691;791;1540,1669;1669;3313;1622;686;762,909;450,762;450,1499,1500;1973,2681,2682;438;28,999;28,411,999;413;1470;902;2939;378;1667;1622;28;1470;63,64;589;28,411,999;28,411,1540;2722;999;28;28,411,1540;1540;1747;1015,1285;28;348;28;1470;589;2328;30,1723,1724;588;1736;1710;1559;385,585,739;115;999;1679;368,1622;28,999,2446,3021,3022;1654;999;999;1540;397;2964;464;582,2413,2414;589;1474,1475,1476;1667;110,3325;358;450,1476,1499,1500;397;28,1540,2491,3023;1748;589;2196;452;589;999,1669;28;1099;550;368;589;831,832,1540;28,1607;1668;703;28,999,2446,3021,3022;1540;1667;1694;1470;1668;1671;1288;2006;28,29,691,1669,2958;450;2369;237,238;2101;463;2274;1540,1640;481,589;1965,1966;430,546,569,589;1470;377,385;28;1457,1470,1558;1470;611;512,543,589;512,543,1786;1670;2867;396,398,776,1652,3485;1540;1986,3599,3600;1559,1693;1470;1669;3322;1249;1470;1668,1669;28;28;429,589;28;1674;1252;1540,3239,3240,3241,3242;450,1444;1470;928,929;63,64;1470;3295;891;1470;110;28,430,589;1540,1670;679;28,691,999,1540;2701,2702;1667;791;28,999,2446,3021,3022;589;1669;1470;1540;579;31,385,1513;63,64;1540;1540;1622;1470;1393;1668;1202;1104;589;28,1669;988;2129;819;28;1540;1470;1275;817;427;1668;2171;451;28,378,546,569,570;28,378,568,570,814;28,378,546,568,569,570,571;2064,2065,3585;28,378,546,568,569;1705;1622;785;1249;296;372;2854,2855;2148,2149,2858;397;28;1667;1622;32,33,34,35,36,37,38,39,40,41,42,43,44,45,46,47,48,49,50,51,52,53,54,55,56;589;589;543,589,1470;589,1247,1347;2437;31,543;31,571;589;31,543;3448;31,1704;589;543;476;28,1667;397;1470;1186;28,953,1056,1973,2967;28,1667;598;1669,2072;1669,2072;198,328,1622,1624;28,600,999;589,1644;31,589,1669,2043;999;589,1470;3495;63,64;28;63,64;1471;1622;989;658;349;450;451;464,589;28,476;1470;715,716,717;3331,3332;385;1753;1667;1213;2279;107,108,110,111;1070;361,690,691,813;3553;1747;1217;361,2998;589;1036;1540,1640;1245;28,30,390,393,600,691;2474,2475;354;1470;28,952,1670;408,1622;1622;571,2238,2239,2240,2241;77;2043;28,543,621,874,1533;450,762;1137;28,1781,1782;361,1668;1668;999,1540,3167;358;785;219,220;1470;589;372;378;622;1667;28;28,474;589;1457,1470,1558;726;1470;1743,1925;1069,1622;1107,3393;600;31,551,3017;1669;1470;1622;589;999;3338;1668;1470;3617;110;2043,2328;1795;28,3481;28;2693;1470;1848;1670;1787;1470;358;496;28,361,1166,1668;1470;1252;396,464,589;28;1470;2207;999;1743;589;1895;1729;618,944,1622;28,1050,1672;1470;1622;1249;28;1743,1747;589;1540;1804,3317,3318;28,1667,1668,1669;1470;31;1474,1475,1476;589;589;28;464,589;459,746,1134,1135,1136;385;28;569;589;28;252;1622;378;1240;28;1470;2213;2672;589;450;1216;809;1622;3423;1671;2866;1493,3429,3432,3433;28,459,746;1639;28,451;543;509;2054;1474,1475,1476;1474,1475,1476;1582,1583,1584;1454;3238;3118,3119;331;3328,3329,3330;28,1496;450,762;1622;1669;1670;1644;2124;2912,2913;999;600,691;600,691;806;354,589,857;126;3413;2959,2960;1668;450,691;589;589;28,3448,3449,3450,3451;1470;1668;1747;1470;2616;28,476,762,1192,1666;632,2322,2601,2602;1093;450,762,1550;385,540;1470;541;1540;650,651;1674;500,1183;788;1675;1540;329,1622;833;406;2663;28;28,1540,3341;28,1540;28,413,1673,1870,1871,1872;3622;978;1474,1475,1476;31;1057,1866;1622;1667,1668,1669;361,541;965;543;1445;947,948;1463;1667;1252;1365;1148;500,501,2108;1839;28,2790;1342;1731;28,999;31,589,1976;28,115,389,1668;589;361,395;436;1474,1475,1476;63,64;216,217;1474,1475,1476;1661;589;1275;996;1622;1347;411,569,589;77;947,948;28;1470;1191;461,1008,1009;1388;589;1622;1674;450,762,1670;1760;1356;411,589;1202,1634,1635;1667,1674;2131;386;562,1666;1470;385,537;28,389;28;63,64;1670;2466;933;368,371;28;28,31,1540;28,31,1540;1667;28,31,411,1540;28,30,390,393,600,691,775;1640,1694;28,924,925;3278;1694;1540;1622;385,450,762,763,764;28,1540,2455;1565;450;1474,1475,1476;28,840;1470;426,678,1107;830;28;1296;-1373,-1374;1250;2761;1474,1475,1476;1474,1475,1476;28;999,1105;1470;1265;1667;28;807,1476,1478,1479,1482;3276,3277;110;397,2069;1470;1470;1639;411,569;3248;2564;464,1218;430;63,64;817;385;589;611,1194;2959,2960;1670;2043;926;28,396;2105,2106;1470;569;589;589;28;28;1667;1752;1457,1470,1558;1670;3279;28,438,439;459;1669;28;791;1667;999;1736;2183;2675,3577;3576;1540;600;529;600;1669;30;28,775,1278;999;249,250,1611;1620,1703;503;2292;1943;1667,1669;1670;28;691,1670,2208;28,999;837;28,66;1470;1470;541,1669;1470;998;999;1540,1580;1622;959;589;529;28,3481;785,1967;1668;999,1540;396,430,546;589;28;3511;28,1540;459;406;999,1668;1622;28;470,1668,1932;28,3210;1138;716,2987,2988,2989,2990;28,2521,2522;406,450,543,589,999,1379,1540,2985,2986;1320;3541;691;1667;28,411,1540;28;1470;776;31;1470;28,1668;2411;599,1540;361;632;1668;1667;28,543,1540;1540,3239,3240,3241,3242;999;2268;1470;721,745;1540;543;1622;30,389,429,451,464,815,816;354,2198;406,1426,2392;1668,1669;419,1680;3634;3634;3634;3634;3634;3634;589,1559;1622;2396;1474,1475,1476;1474,1475,1476;947,948;703;543;1670;999;390,1022,1669;395;28;2830,2831;1540;1470;589;1470;451;2145;1668;3052;2462;976;450;589;1470;474;470,1671,1932;1470;28;936,937;28,1372,1697;589;28,66;1252;1510;1186,1470;589;1795;735;2348;28,430,589;31;1470,1723,1724;1470;1747;496;1669;419;2908;1747;459;1470;611,874,959,1040,1194,1659;500;611,874,876,959,1040,1194,1659;451;944;1470;1622;1754;1107,3393;526,527,528,1670;965;589;1723,1724;3313;28,627;80,110,1557,2885,2887,2888,2889,2890,2892;671;1121;2496;959,2214;785;270;1470;2626;406,1721;1622;1328,1470;1470;1213;1669,2257;3505;1667;378;589;1137;2278;589;28;451,737,738,1670;450,1499,1500;370;28,999;28;2596,2597,2598,2599;1470;386,817;28;589;1268,1622;527,528,1670;1392;110;2616;-29,-1541;110;1582,1583,1584;652;1747;758;762,1670;543;589;932;358;1669,1694;616;110;1050,1229;2768;1674,2276;1213;1474,1475,1476;1535;1668;450;2793;1045;762;762,1315,1670;450;500;588;589;2806;1669;1245;30;28,1372,1697;2496;3007,3008;1438;1668;385,476;464;2429;429;1318;1703;1470;450,1499,1500;1622;395;1667,1668,1669,1670;476;2006;1670;1332;450;1622;165,166,1311;28;496;30,31;589;71,1470,2585;988;1668;1667,1668,1669,1670;527,528,1670;28,1235;1470;1227;1356;2636,2637;28;28,589,988,1669,2443,2444,2446;28,30,589;632;589;999;1554;1667;2911;1540;999;1668;1672;28;1622;1470,1496;1747;1847;1639;3486;999;28,999,2446,3021,3022;1540,1589;1622;589;1670;1622;3381;1252;3567;28;115,450,562;1066;1667;1667;2959,2960;28,1193;1470;589;494,622,676;1104,1670,1999;548,2039;1445,1470;1470;1622;649;670;679;28;28;1617;1668;526,527,528,1670;3313;1104,2155;1709;1038;2405;1470;1470;3348;1747,1756;683;2015;999;776;2285;1252;1470;1668;632;667;1667;1252;28,542,691,999,1694;-29,-1541,-3502;1252;542;1252;1252;1252;1671;1470;361,740;3069;934;1622;2616;1622;28,2667,2668;1785;1470;1275;1622;2506;589;1202;902;385,999;453,454;30,1694;999;1667;1747;1470;372;2874,2875;28,31;28;28;589;3043;1236;857;1540;1670;1668,1669;459;589;1104;557,1451,1452;503;1470;635;28,635,1619;3528;1671;1328;589;1470;2933;1723,1724;679,2629;1639,1667;893;2036;389,1705,1706;31;389,1705,1706;2092;389,1705,1706;389,1705,1706;389,1705,1706;102;632;1470;1470;2341,2342;2627;1788;1666;1824;1743;1470;1470;1743;366;89;1125;1670;31;589;31,1704;600;589;589;589;1723,1724;589;3448;28;31,1704;589;28,30,31,3182,3183,3184;589,1470;3448;2139,2223,2224;589;600;31;637;600;589,1703;589,1348;589;589;31;512;451;589;589;31,543,733;3164;1727;1470;450;1668;1470;1622;589;1470;600;1582,1583,1584;1747;543;1622;28;28;1668;2205;28;2205;2205;1213;589;28,589,999,2446;1470;791,1896;1709;1669,2072;1669,2072;1669,2072;386;1741;992;993;361;2205;1669,2072;2205;1580;1622;846;1470;106;589;589;2205;28,66;1458,1459,1460;1470;192,193;3442;115;1667,1668;28;2010;1470;3579;2497;451;1470;2441,2442;450,762,2098,2099;28;1670;1668;2511;1669;1747;1236;1667;361;1669,2495;1496;1470;1585;1252;1748;2580;411;112,187;1622;1834;413,690;944,1622;3437;3498;308,309;31;31,543,999,1669,2043;1667;1415;1252;2080;631;110;632;2616;999;589;28;450,1571;450,762,1254;1670;450,1571;2959,2960;1107,3393;632;1747;3035;28,956;406,527,1128,1644;28;1540;3274,3275;632;411;28,937,1777;2541,2542;653;2760;543;378,498;484;543,965;28,2033;28;509;999,1668;28,999,1470,1540,2049,2585;28,1667;28,498;28;1670;462;378;28;999;28,372,1256;1327;451;1359;411,1214;411,632,1214;438,509;1694;2614;2554;958;1743,1760;389,464;3504;354,1470;1799;1669;1667;1073;1670;1186,1249;1217;847,848;1540;1671;28;1307;358;879;1756;3390;884;28,573,627,709,757,772;1280;326,1629,1759;28,1540;1540;865;1470;1667,1668;2397,2398;1622;31;1667;1470;589,1470;28;28,1390;1470,2305;-29;2618;1622;589,1193;1470;1470;2166;837,1379,1668;1672;1716;1605;366,3584;31;891;1470;897;464;1128;28;2071;406,1363,1470,1721;785;28;589;1723,1724;426;378;1728;1622;1670;1667,2848,2971;1328;1317;632;791,1501;1470;2616;485;476;1470;2209;1622;390,476,1020,1021,1022,1669,1670;1622;1500;411,569;1747;1747;1670;589;389,1705,1706;503,582,589,709;1470;-379,-386,-451,-477,-585,-864;1667;1622;2615;110;366,1622;1693;999;811;31,543,1470;1470,1540;28,57,58,59,60,61,62,999,1540;3137;1470,2842;1342;28,543,589;451;389,658,1218;28,476;589;28,377,508,509;589;569;464;589,725,2121;28,820;3141,3142;1513;396,476,543,589;476,589;477,478;28,378,390,391,3299,3300,3301,3302;28,378,390,391,3299,3300,3301,3302;28,378;28,378,390,391,3299,3300,3301,3302;28,378,390,391,3299,3300,3301,3302;28;28,378,390,391,3299,3300,3301,3302;28,378,390,391,3299,3300,3301,3302;28,378,390,391,3299,3300,3301,3302;28,378,390,391,3299,3300,3301,3302;566,1439;1527;600;28,691,2003;734;1736;1500,1622;2656;1153;1470;1513;1440,1441,1442,1443;762;1405;2182;1743,2597;1297;346,788;512,543,1694,2580;1497;366;543;1059,1470;589;1470;1140,3476;397;28;999;1470;703;3446;399;3159;721;2428;3205;3448;406,837,1393;2616;589;376;31;1513;1917;28;1559;999;397;1160;791,1501;1470;600,691;3259,3260,3261,3262,3263,3264,3265;1747,3502,3503;1098;397;1540;1668;1670;1186,1249;377;2504;589;959,1315;1377;543;589;589;589,2722;2103;28,115;28;999,1878;2586;589;886;385,390,450,762,1213,1990,1991;450,624;28,450,762,1026,1104;1470,1540,1615;450,762,1550;385,390,450;2080;430,1785;358;31,1645;2111;450,762,999,1561;778,779;406;2621;1540;1540,1559,1667;1470;377;1500;1104;1470;1293;1622;1622;1622;28;1671;2769,2770;354;2860;1540;1668;28,393;935;406,1721;28,413,999,1870,1871,1872;28,600,691,2154;28,413,1673,1870,1871,1872;1470;411,450,1275;1493,1494,1495;791;2089;1622;1255,1869;3096;31;868;1445;883;28,372,827;1186,2635;1352;1968;451,589;1252;2117;1540;28,723,1672;361,627;791,1556;1470;589;1667,1668,1669;679,2848;2498;500,1513;2471;632,2142,3146;1470;1115;575;361,395;419;1470;385,396;529;2181;880;3461;758;464,623;658;2954;385;1611;2215;2972;31;395;1249;28,115;1470,2619;2616;366,1747;2189;327,1270,1622;464,546;1668;3400;464;131;179,180,181,182,183;589,622,1668;999;567,656;1540;110;1694;450,1499,1590;589;1674;28,1027,1666;28,557,2252;464;1891;31,1499,1540,1685;589;1668;565,1669;115,417;28,1667;28,419,2190;999,1540;123;1470;1540;3575;28,999;1674;999;1674;1474,1475,1476;1540;999;1540;450,1453;1540;385,450,762,1667;1615;1072;2791;1674;28,451,498,541,600,653,813;1667;1667;703,830,3532;3128,3129,3130;1104,1252,1376;28,3404,3405;600;1670;28,1666;28,411,1540;450;1372,1373,1697;413,678,910,1559,1669;1711;910;28;476,3278;28,465;2443;28,411,1540;28;653;1331;1540;385,1668;128;1540;110,2763;1667;1622;1128,2859;703,2220,2797,2798;28,512,543,1694,2580;331,1603;2277;414;3100;28;1668;1559;28,426;1622,1747;28,1540;3490,3491,3492,3493;512;503,589;377,569;115,704;2959,2960;2959,2960;2959,2960;2959,2960;2555;485;3519;947,948;28,542,613,1667;589;589;28,1470;411;451;589;28;589;589;31,451;451;954,1983;589;417;2722;947,948;2640;589;2439;589;385,1669;28;1748;2616;451,1540,1669;385,1669;349,706,707;1470;1670;1668;390,589,1670,1943;464;632;1668;395;1252;1540;1184;589;28,999,2446,3021,3022;28,952,953;1748;1500;102,242;999;1694;655,776,1670;589;476,999;1669;1116;2692;1667;999,1540;476,775;385,999;1252;589,1703;28,837;281;31;999;858;1667;886;191,3191,3192;1470;28;28,2446,3021,3022;589;1426;1463;1470;1622;1028,1666;1470;624;28;28,589,637;28,2446,3021,3022;1249;999;1470;601;1540,1669;999;2000;589;1669,1703;127,283;28,3339;797;3471;31,512;1470;385,624;775;1470;496;354;653;1570;632,1595;963;1470;653;1470;354,1342,2616;611,1194;1668;844;622;28;600,691;632;622;947,948;28;31;1670;406;385,406,417,418,1667,1961;589;1540;1540,3239,3240,3241,3242,3244;1669;115,1104;2114;28,66;600,1050;28,477,2564,2654;947,948;422;1923;557,1451,1452;1470;1851;1668;450,762;653;2112;653;573,627;1470;589;1186;464;476;2616;1747;1723,1724;1227;28,30,393,476,600,923;512;1670;1668;28,476,1540;31;633;1186;378,470,793;1622;749,1622,1747;2656;110;1622;1884;1470;977;1249,1470;575;543;1470;1546,1569,1570;2145,2146;999;28;464;1622;547;421;464;1470;589;589;1666;1668;999;411,569,589;110;28;3313;1186;2156;28;406,667,1104,2295;406,1249,1470;28;543;28;589;653;1670;110,857,987,1186,1470,1479,1503,1504,1505,1506,1507;837;1470;28;406,1186;589;3570,3571;999;1704;1500;3056;703,999,1681,2227,2228,2229,2230;589;28;1674;1264,1622;240,241;653;807,1476,1477,1478,1480,1482,1483;110,406;624;589,2314;1622;1622;1470;1668;413;110;1470;389,509,611,721,722,1183;243,244,246,318;658;721;28,430,456,500,721,722,723,724,725,726;901,1470;110,1736,2329;28,66;1667,1668,1669;1470;3629,3630;358,1625;805,806;926;1678;791,1556;110;1987;2182;1670;3139;1470;354;1024;3349,3350;385,589;2543;927;31,1557,2718,2719;541,1666;527,528,1670;2421;115,361,411,545;115,1486,1508,1509;2957;354;110,2480;999;1252;1252;1540;406,1275;28,450;385,450,762;450,1499,1500;28,450,476,545,762;1590;28,1540;28,361,476,693,2420;589,3469;31;3434;1470;1470;1554,1723,1724;1474,1475,1476;378,701;331;115;1099;1732;1436;2671;28;3603;110,450,2217;1479,1515,1516;615;436;110,1470;2538;1470;67,68,1742;788;1470;3323;1470;652,748;378;441,562;1667;361;1670;2356;450,762;28,999,1770;3039;28,31,589;1540;28,378,450;506;1107;1417;385;1479,2873;1005;115,401,403;826;543;1342;1622;1470;354;694;2203,2204;666;1748;1540;28,589,2446;999;1540,1819;28,533,534,535;1919;385,450;1748;436;639,640;589;28;430,464;1356;589;349;853;28,372,476;2926,2927;1513,1650;349;450;1470;1470;30;63;2695,2696,2697;2247;589;2434;1540;2257;2860;1540;1470;28,66;1470,1927;1667;464;2968;1540,3239,3240,3241,3242;1686;28;1676,3257,3258;600;999;1669,2440,2578;632;723;1275;28;965,1688,2067;30,600;999;28;28;28;28,937,1777;1855;77;3410;624;346;361;28,1500,2985;1470;110;1540;1500;747,1667;28;1748;361;2572,2573;1470;385,1669;1642;406,1721,1722;947,948;999;28,31;1850,2610;28,637;999;703,1559,1670,2139;837;1470;1540,1589;1767,1768;1725;1622;1622;1084;1759;1622;1950;1352;503,874;589;184;1303;30;1622;2656;28,464,569;436,1667;2824,2825;1622;1747;589;28;464;77;115,1484,1485;106;3555;28;1671;1252;1252;999;1252;1215;788;1252;1669;1252;1470;28,29,541,542,543,1669;1252;1252;1470;871,1457,1470,1558;1252;1540;28;589;1669;1470;543;1806;385,783;1470;429,473,589;3097;3246;1470;2352;1252;476,1670;28;110,646,647,648;653;285,286;398,3485;1622;596;1470;635,691;732;372,476;654;1667;589;429,460;1540;429,1117;2455;589;589,1821;589;503;2817;999,1540;1668;1694;1470;1470,1681;2802,2804,2805;1666;589;747;1470;589;1107,3393;543;2385;430,723;110,2329;2582;589;589;589;28;28,2059;589;2723;1747;-29,-636;1252;28;1024;648;28,1669;1252;543;652;2686;1470;1252;3467,3468;1667;28,600;1470,3075;1426;115;28;389,1705,1706;389,1705,1706;389,1705,1706;389,1705,1706;28,378,568,569;429,430,431,432,433,434;389,1705,1706;1534;589,1597;1885;2367,2570,2571;378,411,476,573,627,736;1747;1747;1705;1173;397;1667;385,1669;1025;358;624;1667,1668,1669;589;3313;436;947,948;947,948;947,948;999,2670;589;331,512,589;589;377,396;31,512;512,1470;589;544,1513;589;397,589;31,1513;600;31;31;589;589;589;589;31;28;1470;354,2482;1050,1668;2061,2062,2063;106;450,1499,1500;1746;1694;834;1470;1748,1968;1258;589;1470;1470;1540;1606;569;263,300;1470;589;1669,2072;1470,1924;1668;691;28,406,1667,1671;691,709;28;543,571;1667;782;1622;543;1855;1470;1295;385,386,1673;569;797;2205;1252;680;1128;1470;1759;366,1294;260;1986;354;2319;2420;1496;1284;589;1863;1747;1470;2710;1666;1622;1668;999,1470;1622;450;115,624;1540;385,450,493;386;385,1668;1667;1667;450,762,2005;1470;1622;1104;436,691,1667,2846;1667;28,377;2610;411;1445;1128;28,30,1254,1540,1644,2839;28,1540,1644,1694,2839;28;3020;2150;28,1540;28,1540;1098;1423;2652;31;1470;1669,2721;31,1669,2043;589,1667;819;396,589;110;589;1673;600;1540;1667;1859;632,1540;2339;1622;1291;945;28;1622;1668;2631;3607;497,1668;1540;1059,1470;1252;999,3035;1470;450,762;476,860;632,1589;1667,1668,1669,1670;1470;28;589;89;1747;1667;28;451;28,999,2446,3021,3022;28;1217;999;3486;1540;28;999;28;28,1669;28,476,1669;1670;28,999,2585;999;1669;1671;28,691,999,1540;28;1670;1670;385,1669;1668;28,999,1540;385,1670;1668;28,2245;1668;28;891;2025;2144;1622;949;589;411,1214;358;2130;2662;999;589;28;1038,2261;1470;2006;541;589;949;1107,3393;1667,1668,1669,1670;1670;788;837;2749,2750;28;31;28;31;3252,3253,3632;589,1723,1724;632;600;1622,1750;1730;797,2411,2706,2707,2708,2709;1391;3097;1666;1667,1668,1669,1670;28,3296,3297,3298;1667,1668,1669,1670;2816;1454;388;1470;1470;2119;476;476,589;1342;1670;1076;31,1470;589;1252;28;1704;1358;999;28;999;28;539;1252;406,3478,3479,3480;77,110;28,84,85,86,87,1540,3273;1748;361;115,1672;1470;1417;1407;247,248;2612;1305;28;412;28,571;110,1492;3060;406,1721;1672;2358;3313;3584;110;1470;1470;653;1622;1747;1944;1470;2305;441,450,497,810;1820;358;3554;385,1669;28,390,476,573,627,628,1684;1249;1988;28,999;450,762,1671,1672;589;3134;589;389,1705,1706;389,1705,1706;389,1705,1706;389,1705,1706;589;2288,2289;476,734;1372,1373;1470;389,1705,1706;1705,1706,1707;1669;999;2349;2349;2349,2350;802;1667;1540;1269;1523;791;395,1379,1669;110,1736;1342;28,589,637;589;589;589;589;1010;519,520;385,429,768,769;589;621;589;589;459;2043;2569;589;28,396;589,1513;464,589;589;3380;451,589,869;545,658;589,914;589,791;464,589;589;31,589;589;28,388,569,1147,1148;28,395,1668,1669;28;28;28;543,632,1667,3552;292;1622;605,606,607;589;1470;3337;390,399,498,999,1540,1666;589;30;110,2310;470,2206;999;3313;1168;543;1668,1695,2160;31,1694;543;1470;1622;3179,3180;2909;377;28,3481;413,452;1639;1639;503,589;450;558;1672;28;1672;589;1377;2137;1470;1622;914;1540;1622;797;1470;1622;450;1667,1670;385,1669;1470;589;385;837;406,1476,1522,1523,1524,1525;31,577,3232;31,577,1540,3232;1622;115;1811;898,1244;1470;1622;575;406;413;1470;1622;674,1470;28,372,2026;28;385;600,691;600,691;2806;110;1470;1056;2328;275;354;589;385,1251;1054;1090;1470;539;2358,2929;28;1670;653;411;411,543;456,2451;451;1652;589;589;451;497,2053;589;999;1456;999;3098;28,413,999,1670,1872;385,450,476,1671;1470;1671;28,974,1667;385,1669;385,1669;703;28,464;2548;386;115;1470;3463;1365;1470;496,776;378;2758,2783,2784;3131;28,3280,3281,3282,3594,3595;28,396;1281;788;1622;2006;1669;441;999;28,378,464,589;2367;999,1667;28,1668;1924;999;361,548;28,378,388,389,390,393,3613;28,392,393;28,413,1107,3393;1328;31,577,3232;1540;385,476;1540;1669;385,863;28,589,999,2043;28,66;361,476;543,1540,3401,3402,3403;395,417,661;589;1099;1513;1428;1470;1470;2182;397;1622,1626;589;1064;1916,3082;417;3040;557;1919;1043;3518;2452;1470;1747;1470;1231;1470;115;454,2773;1622;529;974,1461,1462;974,1461,1462;1622;1470;1363;1470;1285;3313;106;2818,2819,2820;495;456;589;589;3578;3578;1748;1760,2905;450,1288,1502;2291;503,536;28;908;110;589,1669;1694;1540;271;28;1470;703,2220,2797,2798;1470;691,2253;589;589;1470;2609;1059;1470;2616;450;1438;667;503;1785;1202;2060;1276,1666;1156,1395;2170;1540;1622;632,3034;1540;1999;1879;384;-29,-1541,2897,2898,2899,2900,2901;1252;28;1667,1668,1669,1670;28;3101;2747;1252;395;1748;1470;2948;450,1499,1590;721,2319;28,331,999,1856;1668;31;960,1920,2003;1470;2193;30,385;1328;361,378,1120;1667,1668,1669;1252;767;1470;28;28;28,1372,1697;1747;1123,1747;330;110;1670;999;28,411;116;1671;1671;1668;346,1130,1131;1667;999,1670;3355,3604;28;28,865,1247,2212;411,569,589;31;110;3384,3385;426,632,1107,3186,3187,3188;476;1674;1666;999;1161;999,1540;3247;3313;1721;1833;395,1540,1559;476,652;1668;28;1470;331,1328;284;1754;999,1540;476;115;28,541,627;1202;783,1853,1854;1188;1865;28,438;1086;1743;569,2161;1672;451,571,658,959;589;1107,1540,3393;3623,3624;28,3316;450,1379,2540;1736;1470;1622;1703;632;331;589;1104;436;1860;1670;1760;1622;1540;28;589;2425;1668;28,1470,3254;3266,3267,3268,3395;31;1827;464,589;28;589;589,3009;2724;543,1785;2959,2960;2959,2960;2959,2960;2959,2960;2959,2960;2959,2960;2959,2960;2959,2960;2959,2960;2959,2960;2959,2960;2959,2960;2959,2960;2959,2960;725,726,959,2765;1666;589,3124,3125,3126,3127;2265;512;589;450,1288;389,419,544,1670;2360;28,2946;589;947,948;947,948;28,1540;1668;3425;1445;1470;28,361,476,1667,1669;1470;2225;691;1669;1470;385;17,-29,-1541;1540;28;28,2822;1668;2266,2267;1470;28,66;2564,2650;881;127;1759;377,571,1639;1667,1681;655;1694;1470;542,691,1671;28,66;950;28,1540;1470;1463;1470;1667;1670;1694;691,1667;680,951;541,2003;2205;1004;1669;1652;361,522,523;1669;28,66;1669;1652;28,66;28,66;28,66;1669;28,66;589;837;3186;589;28,1540;28;1622;28,66;3440;419,999;28,66;999;28,424,1668;28,66;1540,1668;28,66;28,66;377;28,66;589;1470;477;1669,1773,1774,1775,1776;1352;413;791,1501;902;1470;28;2006;28,66;28;1622;1747;632,1595;789;691,1107,3393;622;627,709,757,1050,1277,1639,1666;1470;331;3040;389,464,493,589;1540;377,385,430,452;1068;500,2083,2404;1470;1470;397,1050;653;837;1063;1540;1641;30;1668;1668;1540;1470;999;543;624;1470;358;28,413,1870,1872;1474,1475,1476;589;947,948;2476;2627;2391;2938;413,1540;791;543;2876;1479,1515,1516;406,2305;336;1760;115,1769;450;1906;1747;3441;31;1667;450;1470;1818,1934,1935,1936,1937,1938,1939;1470;1729;1470;28,476;1736;1622;575;1622;2616;1470;31;503,546;354;110,2329;2496;1470;1752;1470;2329;1667;1061;1405;2744;451;653;1252;1667;589;450,762;2656;589;28;2864;361,1789;1427;28,450,589,1667;406,3321;807;2088;28,66;3343;2581;1759;354;346,1130,1131;589;635,1540,1973,3341;1670;1747,1756;543;1980;1249;3223;547;2008;1540;1470;1470;1107;1252;1540;691,1667;1470;837;397;2739;785;28;1470;1747;1252;758;3269;725;873,874;658;456,500,724,725;1107,3393;837,1356;1284;1499;1128;1470;28,1107,3393;1747,1756;1964;589;2254;879;451;366;2977,2978;3313;-29,-1108,-1541,-3394;397;1747,1756;2934;90,91;1666;1513;529;988;1927;632;589;2043;529;1470;1131;600;430,464;411,569;1470;1288,1498;436,774;1470,1533,1534;110,1186;110,1736,2329;1864;1592;1748;999;331;999,1000;3593;1905,1906;28,450,762,1104,1670;1107,3393;28,450,1479;2029;28;115;450,762;1470;31;28;1252;1470;589;1622;999;1352;1296;31,464;3610;385,476,926;575;999;791,1501;2544,3122;589;31;464;1470;361;1747;106;589;1759;2845;562,563;512;1470;1622;476,497,627;992;451,464,589;634,635,1932;464;451;1748;2766;589;1470;28,1669,2243;451,589;411,569,589;1668;999;615;110;28,1671;1540;28;2110;980;589;791;588,589,1341;354,2355;2714;652,837,1132,1133,3144;476;3039;1606;1107,3393;28,1585;589;1470;28,411,999;303;1470;3621;450,837,1001;1470,2254;999;450,762;1670;2868,2869;616;1532;1470;1671;589;1470;758;28,66;2051;632,3354;28;1140,3476;3573;1470;999;169,170,171;589;28,2411,2412;589;548;589;110,354,1342;999;390;127;1470;358,1213;368;368;368;368;450;413;361,385,589,762;2608;1747;450,1499,1500;28,66;1546,1569,1570;1470;791;361;139;1249;1748;1747,1756;28;385,464;31;110;1668;2006;1694;600,2662;2473;512;1622;385,658;1470;1612;1668;28,1540;398;28;2367;385,450,762;1667;115,2877,2878,2879,2880,2881;1670;28;1670;1669;1470;589;1671;1270,1622;110;1505,3200;2417,3214,3215;1642;1669;1526,2163,2164,2165;127;1470;426;28;3028;999;1540;999;473,999;1457,1470,1558;785;110;397;837,1998;999;28;1748;857,2436;2508;110;1622;464;934;589;632,1482;1667;115;1416;1540;28,66;354;397;703;385,1669;664,1044;362;110,1735,1736,2329;1470,1499,2585;1767,1768;1309,1310;1668;965;785;1553;397;1470;589,1194;589,1786;476,589;1748;1252;589;539;1411;1849;632,3031;589;790;1470;1470;1875,1876;965;2516;1470;110;1540,3239,3240,3241,3242;1252;1669;999;28,372,1670;1252;1252;543;411,569,589;1252;464,1200;464;1252;1128,2882;1470;589;2003;1252;406;548;110;406,2691;28,66;1470;543;1013,1014;1012;503;1470;1470;539;251;1619;999;999;1669;1669,1674;1667;1976;2133;28;2564;2293;31,503,1639,3294;589;589;430,586;589;589;2387;2002;589;1668;28,66;571,589,1073;589;1442,1455;1470;2468;110,1213;947,948;589;-29,-636;1751,2340;1694;28,66;2625;1470;3466;396;1748;589;385,450,905,906;1639;1470;1470;597;2257;1107;1295;1405;2940;63,64;429,430,431,432,433,434;430;389,1705,1706;389,1705,1706;389,1705,1706;378;428,429,430,431,432,433,434;589;389,1705,1706;389,1705,1706;389,1705,1706;389,1705,1706;389,1705,1706;389,1705,1706;467,468;389,1705,1706;1668;389,1705,1706;377,419,464;389,1705,1706;389,1705,1706;436;589;1470;1998;394;588;406,1470,2916;544,2559,2560;1629;354;436;2257;3231;999;1743;1470;2835;1150;1470;106;411,2196;589;1513;28,29,30;31,543;28;600;31,543;3448;589;589;600;28;589;28;589;31,417,451,543,571,1438,1639;28;464;883;28,66;127;1059,1470;385,999,1668,2683;1825;2616;3455,3456;1179;589;1622;2656;28;3448;589;883;2319;1669,2072;1470,1717;115,632,1328;479,709,965,1379;2205;1669,2072;1470;411,569,589;634;361,1667;1222;999,1669;1470;1470;436;1052;2230;2478;1513;1622;361,378,1666;589;1128;2026;999;476;649,2047,2048,2049;987;1622;588;589;589;589;1470;1470;624;543;346,1130,1131;385,503,1664;451,500,503,2083;1644,3271,3272;1470;703,2220,2797,2798;1747;999;589;1900;450;1352;385,450,1671;1470;1470;372,541;304,305;1119;1622;115,632,1328;28,430,589;3531;3531;1555;1748;2320,3196,3197;999,1540;1924;1540;31,1540,1694;28,389,589,1368,1369,1513;689;510,511,512;1639;703;385,1669;1496;589;589,1667;632;512,1694;589;2422;811;1065,1671;2192;31,1669,2043;1667;28,396;496,959;1580;1668;543,1669;1470,1726;589;1411;589,1328;451;1479,1515,1516,1517,1518,1519,1520;366;1667;1026;358;2384;349;464;476;1533;354;1559,1718;466;999;28,857,1783;589;110,134,1618;2700;1470;589;655,692,1667;385,1667;2616;813;565,999;1470;358;1328;397;589;378;1470;543;589;1559;150,151,3387,3601;127,1328,1513;1743;1470;476,588;28,66;28,66;999,1694;411;543;1392;115;28,1669;1622;361;1668;1470;616;1533,2134;1748;589;589;1470;1457,1470,1558;995;1668;1342;476;632,3211;31;1668;999;1540;28;28;1540;589;1694;1540,1694;1667;30;476,600,1668;1687;28,999;331,1670;411,569,589;110,1736,2329;411,569;624,734,804;1668;589;833;406;464,589;1470;1252;2797;1540;1056;1470;1352,1479;28;1446;411,589;624;3589,3590;411;1249;1463;28,1694;235,236;28;1747,1756;1791;477;2284;3072,3073,3074;441,1032;1540,1668;1107;411;1470;1622;1759;562;2603;1252;1689;1252;28,451;588;1470;2620,2621;1470;476;476,589;999;999;999;872;28,1540;589;600;406;589;589;31;2043,2517;1252;1747,1756;1252;1622;2767;718;28,66;1670;411;28,66;1352;2222;3618;385,450,909;577;411,569,589;837,2170,3144;439,589,813,2437;1470;1622;1704;589;1058;1667,1668,1669;1747;1853,2924,2925;939,1210;589;354;28;1047;1470;879;1667;1642;708;3625;28,396;3313;1722;2656;1240;406,1721,2719;627;28;3313;28;1470;419;385,1083;1540;1050;470,628,1334,1335,1336;626,1684;358,1113;1858;589;1089;2669;2393,2394;385,419,430,1513;389,1705,1706;389,1705,1706;2532;1622;947,948;1513;543;372;1405;1252;389,1705,1706;389,1705,1706;1470;389,1705,1706;389,1705,1706;389,1705,1706;1622;115;2499,2500,2501,2502;2961,2962;385,1669;2791;1667;2616;1622;1148,1186,2530;385,1083;1470;1470;1670;569;1098;118;2656;3025;1470;464,589;589;589;589;1470;1227;385,1083;28,637;1513;947,948;377,385,589;1636;547,549;385,464;1128,2719;385;589,3507,3508;459;589;464,658;758;385,503,1664,2133;589;385,503,1664,2133;429;2247;589;1315;589;28,396;589;464;589;999;406,450,1026,1470,1496;77;3303,3304,3305,3306;1470;1743;1470;1238;358;1622;1151;589;2450;1356;3065;385;378,1667;28;1667,1668;2656;1671;1887;1408;331;63,64;2381;3112;1470;632;1470;2328;589;1470;476;1159;1756;1470;1408,2641,2642,2729;1470;1622;372,385,589;3426,3427,3428,3429,3430,3431;543;28,1540;791;1672;2840;450;3046;1470;813;1748;397;377;1186;1252;1405;1668;999;946;1760;1099;1622;1104;1622;837;589;490;2797;589;1540;3078;2318;1186,1470;791;1912,1913;1470,1606;28;892;890;28,66;3313;3157;1141;589;1314;476;1202;127,3358,3359,3360,3361,3362,3363,3364;2936;1670;589;2260;589;1227;28,589;589;1252;2339;1470;28;548;543;1747;451;450,1386;809;1470;396,430,546;1474,1475,1476;385,1669;385,1669;589;616;1470;28,391;464,1227;2043;3181;3628;1252;837,1363,2556,2617;965;1748;28;1747,1756;28,476,1666;2254,2480,2918,2919,2920,2921;500,2083;496,776;28,1668;548;1470;2863;1622;1470;1470;1747;28;451;687;110,406,2585,2586,3325;110,134,354,406,1013,2583,2584,3325;1669,2257;2249;1669;616;28,937,1777;3313;346,1130,1131;1470;28;31,1694;1666;1668;361,413,1103,1104,1105,1106,1540;28;28,413,999,1540,1673,1870,1871,1872;576,577,600;1540;1747;1513;753;396,546,1639;385,1669;406,1554,1723,2275,2307;476;1104;2343,2344,2345,2346;28;354;127;600;1401,1402;834;999,1540;1213;358;1470;1186;543,589,691;3572;1479,1614,2565;1670;1668;1667;806;1013,1014,1015;1356;28,413,1540,1673,1870,1872;1667,1668,1669;1317;1470;1450;1470;1861;1248;809;1470;1622;1470;1257;1059,1470;28;2616;589;947,948;464;385,464;704;1137;1796;28;406;974,1461,1462;632,3133;974,1461,1462;543;1470;1470;575;543;1470;28,1540;28,554,1053;110,1735,1736,2329;1035;1669,2072;1667;450,762,1550;106,199,200;28;1470;397;2205;1736;721,959,2142;1392;975;818;2278;3550,3551;2742;589;210,211;947,948;999;216,217,218;1186;1128;28,372,419,476;1470;1669,2072;110,2329;361,395,1257;589;589;3587,3588;1716;354;385,396;589;589;429,841;2564;569;622;385,411;28,937,1777;509;476;1894;28,378,496,1669,1681;1992;2616;1711;1622;999;88,89;3568;385;63,64;1366;28,65,66;28,66;397;413;3038;589,2080;1470;589;785;1748;1748;110;28,999;945;1668;1668;450,1449;999,1540;1666;28,66;358,1737,1738,1739;589;1470;1622;1252;1470;3202;28,66;1252;1470;419,1668;2959,2960;28,66;1392;1470;1668,2090;600;2247;589;3212,3213;1670;2446;999;451,503;1470;589;1470;1470;557,1451,1452;30;413,678,999,1540;28,66;2221;1668;385,456,561;2616;999;411,569;725,959;395;1540;1322;589;574;28;861;1457,1470,1558;3357;912;1392;1622;1622,1743,1747,1758,3006;110;577;785;1622;28;633;110;464,589,740;797,965,2576,2577;1709;3564;1639,3177;589;589,1639;589;589;2959,2960;2959,2960;2959,2960;2959,2960;2959,2960;2959,2960;2959,2960;2959,2960;2959,2960;2959,2960;2959,2960;2959,2960;2959,2960;2959,2960;2959,2960;2959,2960;2959,2960;2959,2960;2662;509,589;396;28,589;28,2946;1227;476;451;411,569,589;28,430,589;28,396,611;28,396;28,66;1407;589;378;2327;1470;1652;459;377,503;1669;2427;509;1470;2043;1470;28,66;1606;430;2821;377,1652,1662;28;361,385;3394;728,729;1670;999;1670;476,498,1154,1666;543;226,227,2125,2126,2127;999;2374,2375;2375,2388;3186;1670;1668;1670;691,2056;1667;451,1668;999;1580;1669;1669;999;571,1942,1943,2242;999;758;1740;543;1470;635,1598;406;589;115,902;1470;1667;1470;632;28,999;589;28;999;1107,3393;28,115,436,1128;28;28,999;134,1618;28;1580;1470;1540;2656;1622;1622;1252;758;28,999,1870,1872;1748;406,1721;28,413,1540,1870,1872;837,1352,1476,1511,1512,1513,1514;1328;1470;3024;1538;1470;1470;750;1426,1479;361;947,948;1652;1249;1951;2222;653;2426;503,546,1209;999;397,589;406;28;406;809;632,1540;385,1669;1540,3239,3240,3241,3242;589;31;1667;1540,3239,3240,3241,3242;1540,3239,3240,3241,3242;28;3244;1540;1470;589;1470;1540;1632;1514;3634;31;2174,2481;543;1622;1128;354;1554;28,1667;837;110,115;464;1743;2352;1915;1470;397;1177,2385;3412;999;430;396,589;31,134,589,703,2177,2178,2179,2180;3396;1748;758;1470;1622;415;979;1470;1406;667;1805;366;1622;1747;2930;2557,2558;1622;2430;1737,1738;1546,1569,1570;1667;1470;430;451;451;2019;1748;589;1470;464,589;28;489;2023;1470;358;1622;1172;3366,3367,3368;1747;1470;999;110,450,837,2644;1470;1470;1470;354;589;1099;999;902;1470;464,658,1659;1128;999;1667;430;589,1186;397;589,1470;2566;2564;1884;3077;1363;1946,1947;1649;1649;1470;1559;999,1559;589;837;397;589;1329;1639,1910;1453;875,876;873,874;28,430,721,722,723;873,875;1611;1831,1832;1540;999;1107,3393;1622;1305;1249,1470;1743;1668;31,589;100,101;2747;346;983;1470;3619;2226;1470;1719,3160;2116;1186;566;566,791;566,1104;1470;1470;1470;110,965;1747,1755;1748;1668;1315;2093,2094;1540;1757;999;3151;110;1186,1572;3036;858,3510;1470;106;28,691,986,1681;3448;385;632;1328;509,592,593,594,595;377,464,1652;2311;2400;1470;649;1470;1470;361,551,1683;385,450,762,988,1219;1650;2959,2960;999;2339;2616;349;406;1120;412;1669;1227;2703;354,1342;1470;1667,2157;385,1669;589;660;1227;1470;589,3470;3472;2564;1128;797,1476,1478,1481,1482,1577;951,1470;3079,3080;583;557,1451,1452;1748;450,1499,1500;406,1476,1522,1523,1524,1525;1723,1724;28,1540;395,999,1105,2495;806;1747;1328;361;3050;1607;1252;1356;31,543;1669;589;1622;589;130;358;31,589,2371,2372;1470;785;589;464,1513;1072;1747;28;1470;636,721;1470;1671;419,775;3487;496;110;837,2362,2363,2364;28,560;1298;2652;28,411,1540,1770;1982;1540;1677;589;1546,1569,1570;1470;28,999;28,1357,1358;1748;3044;1470;632,837,1540;1470;1013,1014;543;1540,1589;30,785,1540;406,1721;1257;1470;28,863;774;1107,3393;1622;1747,1756;28;390;385,1669;406,1292;1470;1747;1006;1540;1669;28;999;28;600;1470;1252;1588;450,691;758;1470;1470;2380;465;1622;589;1470;1655;430;1470;1476,1573;368,371;450,1499,1500;1245;1622;1471;476,621;1622;1261,1262;632,1470;28;436;1140,3476;354;1470;1669;28,600;589;411;28,378,562,2970;2616;548;28,2445,2446,3021,3022;1674;1760;1669;28;589;1540;1470;1470;406,2067,2361;2302,2303;436;1470;1227;413,1500;1128;28;999;1830;1470;1470;1359;1405;243,246;1747;2600;2656;1470;2358,2359;2850,2851;1513;1470;1470;385,1669;3473;1392,2201;417,589,1104;500,2083,2404;589;589,3136;2264;464;589;430;413,1107;110,1639;999;1540;1107;947,948;947,948;543;28;28,388,429,1195,1196;1622;436;1622;2000;1540,2000;1232,1233;837,1249,2026,2680;357,1156;765;2646;1767,1768;1767,1768;385,1669;1558,1614;1470;833;999;934;589;464,589;28;1470;966;1622;1212;548;1104;28,464;110,1721;543;1622;589;1470;838;504;902;110;1599;1252;28,476,544;1668;1668;1252;28;366,1747;1352;1694;1470;1252;476;372,378,411,470,696,697,1639;649;589;589;206;624;2085;1747;1082;1252;646,647,648;1252;464;3163;450;1038;999,1669;1622;589;1669,2298;1667;1671;1674;589;589;358;1227;385;1470;2564;3535;28,2630;2994;31,2755;947,948;512,543;589;1657;1470;378,1669;3203;1622;999,1775,1776;1776;406,1325;1668;1470;1470;385,1669;411,512,1430;999;28;1470;589;1669;589;589;28,1543,1544;589;622;110,1735,1736,2329;758;589;758;643;751;999,1694;1100,1775,1776;1962;604;1376;212,213,214;397;787;721;999;758;741,742,743,1559;3283;1670;1470;1622;1405;28,1237;1237;389,1705,1706;389,1705,1706;569;389,1705,1706;389,1705,1706;389,1705,1706;428,429,430,431,432,433,434;389,1705,1706;3514;947,948;2748;366,1747;1471;28,1670;406,2923;688;2477;999;1156,1426;791,792;298;1596,2550;3540;2385;386,837;1470;999,1470;624;653;1104;450,762;947,948;589;632;28,1372,1697;923;600;589;589,2075;589,1703;589;30;600;1513;1104;2821;629;430;430;1442;354;503;1470;1059,1470;1924;1458,1459,1460;1754;1668;470;1767,1768;430;557,1451,1452;1710;346;2616;3484;1470;2035;1470;1470;1328;1470;115;635;28,554;1128,2297;1727;1747,1756;1470;451,543;975;653;1470;28;464;589;1470;2205;1253;1470;813;1470;1470;960,1188;1252;1667;1470;543;1470;1470;2070;1227;1470;785;978;1470;3105;2283;1405;1405;543;1622;419,429;1299;589;3565;1026;1680;1540;1669;999;450;450;1470;879,921;3369;1984;1078;1372,1373,1696,1697;1328;110,1580;2236;632;942;1540;28,430;390;2846;1585;450;624;959;28;1217;1252;1252;1423;3051;1470;1668;959,2409;589;464;464;2759;1197;17,320,321,322,323,324,325;1863;1403;378;1186;1670;1104;430,546;28;589;110,1736,2329;589;589;1622;396,589,2096;2487;1723,1724;589;28,657;591,1168;543;1247;543;3515;385,1669;28,464,479,480;1470;1470;543,632;543;1479,1481;1803;1748;1470,1721;1622;110;1470;1622;3194;28,1784;28;28;1026;373,374,375;703;3608;879;1124;692;1225;110;627;785;1623;1622;1546,1569,1570;2849;1622;1622;406;28,110;397,1667;1540,3239,3240,3241,3242;1013,1014,1015;1470,1540;999;999;2020;28,378,1195,2258,2259;1874;28,2424;28,2424;115,28;28;28;28;2935;426,999;2324;386;1668;1062;589;947,948;1386;1253;1747;813;1405;1034;127;430;589;1622;1470;1668;1470;1622,1759;1622;1622;1585;1668;366;385;799,1622;632,3224,3225;134,383,1622;1470;1667,2100,2463;1668;385,1669;999,1668;947,948;1667;999,1668;2246;372;390,413,999;589;1470;791;632;999;385,1669;1622;588;1747;1667,1668,1669;999;1748;1128;1747;1470;1747;1438;1124;557,1451,1452;28,31,1540;2865;1470;589;1670;464;1410;464;2175;31;817;274;2339;837,1667;3465;1699,1700,1701,1702;2616;1747;354,1342;999;2000;155;1622;188;2401;1479;331;1941;1128;632,3482;2843;395,999,1559;1470;3525;28,512,543,1694,2580;2580;1470;1710;28,413,999,1681,1870,1872;1470;1669;791;1622;788;1924;1747;1667;31;1668;1540;589;1227;459;464;1252;31;1470;1470;1252;543;121,122;1540;1882;760;775,1868;1343,1344;2186;1743;3357;1666;1622;28;1667;1470;589;1747;1747;1252;1252;791;1405;372,925;1932;28,925;1668;543,837,1646,2593,2594;1470;1470;1405;103;93;543;385,1669;28;1731;1622;2197;2503;451;627,773;30;627;1667;1672;28,390;1672;1667;3596;451;1359;653;378;389,1705,1706;429;3523;1580;28,723,1672;361,378,734,811,812;389,1705,1706;389,1705,1706;389,1705,1706;389,1705,1706;354;2803;2194;28;28;1144,1145;436;110,2329;1470;1863;900;1669;31;589;589,645;1639;1513;589;589;385;430;503,589;385,503,1664;1639;589;589;589;385,503,1664;1227;509;385;464;2133;385,503,1664;758;429,1657,1658;451,503,559;411,569,589;758;464;28,372;28,372;1227;31,632;430;411,569,589;1470;651;589;28,406,766;1743;1670;1540;1540;1622;2567;735;529;1470;377;1470;1112;1748;2834;1007;451,589;28;938;72,73,74,75,76;589;999,1540,3102;1474,1475,1476;1104;1909;464;1470;1470;3311,3312;1670;377;2797;1622;512;947,948;1540,2084,3229;1672;1924;3370;693;28,1296,2446,3021,3022;653;1747,1756;377;1470;2821;28,572,573,1670;1470;2428;783;476;1470;28,680,999;1100,1775,1776;1747,1756;1470;115;2909;1352;451,2312;28,464;31,1540,3232,3399;589;2506,3104;837;127;2883;589;161;385,1669;450,1529;589;589;464;31;28;589;1672;464;3041;464;600;115;393,396,546;243,244,245,246;436;1087;1667;1470;543;450;406,1721;1667;1670;1470,2321,2322;3114,3115;2814;1470;450;2151,2152,2153;1747;589;28;385,1669;1470;1674;406;3445;110;543;1470;791;1470;476;1669;1249;1747;259;28;28;589;702;3536;2339;1234;3045;1669;451;451;1342;632;395;413;1743;791,1501;346,1130,1131;28,1669;2006;1670;1470;2812;361;1470;1470;589;589;624;426,1540,3371,3372;999;703,809,1540;999;1836,1837;31;411,569,589;28,419,1668;1540;426;28,30,980,999,2679;1342;430;153;395;361,696,756,757;808;1470;999;947,948;476;1670;406,766,803;589;2551,2552;837;1470;1470;464;589;1318;3251;1894;1668;1669;1470;28,413,999,1870,1872;1470;575,683,1059,1545,1546;1105;1470;1258;791,1556;110;358;1670;110,406;1470;589;1470;791,1556,1557;2794;2468;919;1730,2674;3165;1405;1919;1800;1252;28;1415,1747;669,670,1668,1669;1349;1747;331;110,2329;110,2329;1610;358;1760;2483;450;589;1747;1622;253;806;1540;28;1371;377,589,1122;1445;589;3084,3085,3086,3087,3088,3089,3090,3091,3092;632,2142,3145;419;1622;411,775,776;632;575;758;1128;1374;28,937,1777;683,1546,1569,1570;3377;543;1637;1747;1426;1252;1252;837;1747;1470;758;28;1056,2840;981;1668;1694;1470;1648;622;1426;999;589;1202;28;2290;1470;1405;1252;1252;1748;589;386;2959,2960;1622;1622;1499,1685;28;1668;589;1252;1252;1363;31,1470;2176;589;2195;632,1254;430;28,999,1372,1697;207;999;1540,1694;1669;1678;651;1252;947,948;28,430;31;1107,3393;588;110;720;589;1470;1470;1672;978;2661;1470;354;354;589,1668;385,1669;2113;500,725,726,959;632,1638;999;28,361,413,498,499,1513,1540,1694;385,1669;2690;1540;1760;28;739;28;589;1867;2914;464;1240;1470;2039;2545;1252;1622;1667;1559;2949,2951;419,837,1668;28;1107;291,1736;1470;331;1622;1252;3307,3308,3309,3310;2587;659;31,1639;589;589,1104;2959,2960;2959,2960;2959,2960;2959,2960;2959,2960;2959,2960;2959,2960;614;947,948;999;28,361,378,734;999;589;830,1195;417;385,412,984,1186,1187;28;589;31;947,948;28,396;947,948;377;1540,2525;1622;28;1246;1470;1372,1373;999;28;28,1670;1174;947,948;1470;377,503,589,1652;28,589;1670;1668;1470;999;386;780,781;3249;1609;430;1540;1669;2374,2375;2375,2388;632,2270;1667;1694;1669;28;1668;691;680,999,1678;1470;28;451,1652;28,999,2230,2234,2235;1252;1670;1362;1670;1470;1470;2237;1667;464;635;464;464;1305;1470;28,450,762;1540;758;758;837;589;1107,3393;961;1652;1470;589;1667;1668;837;1747;411;2168,2169;1296;429,621,2564;791;589;548,589,959;1513;476,734;1405;1240;3570,3571;915;1470;1855,1922;1540,3239,3240,3241,3242;110;1670;419;331,1709,3342;1669;1666;3322;411;1470;1667,1668,1669;902;2170;589;2367;1723,1724;597;397;1470;406,1476,1522,1523,1524,1525;708;451;947,948;1668;110,406,2299,2300;1470;589;1747;1252;1729;2656;1231;89;588;1470;1747,1756;837,1059,1470,1528;110;1667;933;589;1470;1470;377,545,589;1470;1470;947,948;589;77,3068;396;1470;349;664;406,1476,1522,1523,1524,1525;1470;1622;406,2306;386;1148,1415,1470,1472,1479,2507;791,1501;1470;589,2058;589;1709;1653;1748;1231;1622;589;589;361;430;1040,1659,3340;479,1072;1470;1470;1107,3393;2564;947,948;1470;1470;2323;807,1476,1478,1482;110,406,2490;1107,3393;3313;1747;589;396,430;2339;135;966;1747;721;857;452;429;110,111;354;1059;1405;636;589,959;2698,2699;1405;1470;1470;1470;1470;1689;30,566,1470,2947;1405;2886;390,589,628,2095;3151;28,476;1470,2254;649;1670;797,2655;28,994;1669;470;-29,-30,-31,-1541;28,987,1681;377;1470;1470;1737,1738;3333,3334;589;496;3313;791;1622;28;832,2457;3042;1110;28;691;3162;680,1107,3393;3121;743;1470;1540;1107,3393;791,1547,1548,1549;385,2331,2332;1667;1378;1470;2693;1104;1470;115;28,725,878;2473;589;1550;806;711;1089;3057;2339;28;598,2574,2575;3154,3155,3156;3097;806;2524;2524;1540;1540;1631;419,1095;1849;562;3615;600;653;1622;406;999;589;2622,2623;1470;1747,1756;683,3376;1209;788;758;758;397;2339;747,1667;1470;28,575;397;1723,1724;960;1667;1470;1747;1252;1622;1670;1970;1479;3476;837;385;390;496;858;2084;680,999,1681,2084;1748;972,2730,2731,2732,2733,2734,2735,2736,2737;28,937,1777;1252;1470;788;589;3574;1998;543;477;358;3103;785;390;390,680;1470;1186;397;2853;947,948;28,2420;1323,1324,1667;589;999;1470;115;1668;1669;346,1130,1131;1948;837;411,569,589;999;3487;589;1257;1252;464,589;1622;1470;1470;28;3230;1126;1581;632;1667;589,1669;28;1059,1470,1526;1026,1723,1724,1725;2042;1622;589,2058;589;1470;1175;1458,1459,1460;1470;413,999,1540;28,450,589,785,1288;28,999,2446,3021,3022;1470;1470;1558,1614;1622;430;670,999,1104;397;1748;735;589;758;1128;837,3144;1470,2810;1513;2028;385,1669;2395;1470;786;2856;2806;464;28,66;28,66;63,64;28,66;28,66;28,66;28,66;28,66;28,66;28,66;589;479,947,948;636,2765;653;331;2959,2960;1470;464,1656;1767,1768;1767,1768;1767,1768;1767,1768;1767,1768;822;822;788;632;503,589;589,683,2916,3409;589;788;2122;476,1313,1540;1748;78,79,3206,3207;1405;1470;110,1502,2461;2616;28,413,1669,1870,1872;837;1470;406,1476,1522,1523,1524,1525;2624;1107,3393;1252;115,2877,2878,2879,2880,2881;632,1589;1252;1252;775;1671;1760;3419;28,691;1249;2205;1252;1252;385,1669;1252;451;1252;451;1252;791;464;378,411,696;470;2884;384;882;1582,1583,1584;1470;430;1622;1747;1442,1455;1667;1470;791;543;2616;464;1470;1622;856;1470;1667;1669;2546;28;758;893;589;589;2755;543,589;589;589;589;589;503;430,589,1785,2052;589;589;589;503,589,2410;346,1130,1131;436,1438;1668;1540,1669,3239,3240,3241,3242;589,1666,1669,1678;28,2357;758;589;999;884;1471;3158;2856;2132;589;3256;1470;417;1470;635,1600;1667;406,1380,1426,1606;406;115;397;589;931,1237;389,1705,1706;389,1705,1706;389,1705,1706;389,1705,1706;110;565,566;1602;1743,1749;1470;1470;757;3476;2248;788;1227;1747;632,2563;28,1540;1748;543;2199;667,999,1470,1640;1470;1252;1258;1932;1470;1470;589;386;500,744,1037,1976,1977;28,937,1777;1249;589;28;589;543;503,589;589;28,2740,2741;1667,1668,1669;740,954,984;476;413,1540;406,543,999,1502,1540,1570,2981,2982,2983,2984;470;1426;589;464;28;464;543;1107;28;569;397;430;1470;1470;999,3047;1669,2072;450,1352,1479;1622;386;543;1426,2067;600;1470;785;28;31;1339;1314;1470,1650;1747;1470;653;1140,3476;529;110;1405;28,29,30,31;1128;1747;1748;589;110;1470;451;346,1130,1131;1747;589;1622;419,429;419,429;419,429;419,429;419,429;419,429;1305;106;1259;28,372,386,419,498,825;397;1446;115;649,1186;430;306,307;632;1667;1989;28,1254,1644,1694,2839;2335;1622;1622;858,1162;429;2329;77,1763,1764,1765,2979,2980;1622;1710;1667;543;1668;543;543;999;1669;632;1559,1692;589;1419;542;1622;1470;28;1059,1476,1614;1127;413;655;385,1669;655;1622;361,1639;1622;1622;1470;1405;2170;385,503,1664,2133;2648;110,1862;1470;2645;346,1130,1131;655;589;1470;451,470,680,1379;1671;837;1405;837,1059,1470,1528;1500;346;411;947,948;2616;1694;350,351;1667,1668,1669,1670;1754;2557,2558;1743;3448;385,1669;28,1540;28,110,993,2763;999;1620;1695;632,1540,1953;2959,2960;569,775;1002;348;1470;1747,1756;1470;361;589;1759;1470;2804;110;589,1194,2200;430;2040;430,2081;450;1470;1667;543;2629;1342;1252;29,1100,1669,1772;1666;1617;1470;2704;2011;998;1622;1470;2460;589;1470;3204;1747,1756;1156;1470;1470;398,530;1252;1470;28;28;3486;1405;1470;28,1823;140;476;1342;396,546;1236;712;354;939,1426;406,1721;464;806;3565;2610;1748;1668;3391;3016;1540;589;1305;1470;809;358;397;464;429,555,556,557;806;1252;1853,2924,2925;1470;1710;589;653;1470;28,396;28,377,464,479,496;1470;543,3474;1748;450;1470;1470;632,2922;1748;2794;546;1668;3512;28,1335;1668;461,477,589;461,477;589;3516;1470;2326;879;1379,1470;389,1705,1706;389,1705,1706;28,429;124,1955;1748;3061;1748;1668;1252;1252;1252;1470;1143;531,532;436;965;28,1676;29,1100,1669,1772,1775,1776;1272;28;1775,1776;28;29,1100,1772,1773,1774,1775,1776;1748;496;1342;2837,2838;658;885;589;1227;947,948;429,461,463,464;653,1725;2260;3418;430;1186,1470;589,725;543,837,2593;385,503,1664;429;385,503,1664;385,503,1664;429,1657,1658;589;589;385,429,589;385,503,1664;589;385,503,1664,2133;28,589;589;507;589;411;464;2053;947,948;1470;1470;1540;1107;1470;110,2337;1470;788;1470;3311;1470;279,280;1747;205;513,514,515,516,517;513,514,515,516,517;476;1668;1668;589;1667;1540;1249,1470;837,1059,1470,1528;396,430,546;358;2821;999,1104,1470;1747,1756;1352;1442;837;406,1426;464;377,429,493,494,495,496;3175,3176;947,948;1747;806;589;1470;589;589;496;1405;1747;2907;620;1622;1540;1670;1470;1405;2006;28;2486;1252;2561;1747;589;1252;2182;1470;2143;3053;28,31;31,577,3232;1667,1668,1669,1670;788;2701;589;2764;30,543,632,1540,3435;1392;785;788;806;110,1721;1760;998,1666;28,476;1470;28;1470;2715;110,1736,2329;1470;406;794;1747,1756;667;28;1470;589;788;999;999;999;354,2616;589;1667,1668,1669;589,1672;28;1785;725,959;2040;411;758;589;589;28,589,1513,2684,2685;589;546,1209;430,546;476;806;1748;3217,3626;1723,1724;1540;761;500,1089;1470;2518;406;28,2079;1316;115,835;1104;28,411,450,497,1415,1668;385;1647;1252;632,1838;788;1747;589,649;1565;1252;1710;1759;1747,2633,2634;1470;543;28;1747;1252;378;2533,2534,2535,2536,2537;1328;1359,3494;2097;2449;2610;357;1622;496;31;176;837;1730;395,2448;413,999;589;1470;1470;276,277,278;2335,2543;2910;30,1711;1822;1470;3556,3557;589;28;590,591,1670;3439;1540;31,577,1540,3232;1747,1756;1722;1748;2077;361,696,756,757;1747;430;1540,3239,3240,3241,3242;1470;28;28;999;1470;2286;1883;649;1470;1540;999,1540;1540;1668;1128;3464;1622;1356;1328;2694;1470;1470;470,1668;487;2301;1668;1013,1014,1015;1884;1470;837;31;947,948;758;947,948;2931;1342;2632;999;807;2220;1167;2109;1760;366;346,1130,1131;589;1748;1540,1694;1540;470,581;1670;570,734,954;500,501;110,2329;1470;106;2108;2705;1668;1470;28;451,589,2595;1723,1724;1911;999;134,354,364,837,1013,2583,2584;589;1405;390;1747;999;354,1681,2509;473,999,1540;809;413,1540;1470;1747;589;1747;1554;589;1505,3201;1227;1747;1470;806;1405;850;1479;1622;589;2569;758;1470;28,31,937,1777;1668;3408;8,17,320,321,322,323,325;1270,1622;806;1667;1252;1470;1252;115;1470;2975,2976;960,1920,2003,2086;385,984;1252;1252;1104;1252;1252;1470,1669;1852;1442,3178;634;1888;1120;385,451;1252;1252;632,992,3149;1252;1099;28;999,2562;1668;28,1496;1540;372;389,1705,1706;1540;681,1951;1731;134,1479;727,733;28;1470;28,1372;3143;600;999;3627;589;999,1668;28;1470;1470;1470;975;3070;589;464;1104;589;1668;28,361,498,499;621,1254,1694;999,1668;28,464,479,1073;589,999;691;893;548;548,893;753,754;1669;1622;1748;110,1466,1893;589;346,1622;1056;231,232;1470;1668;1747,1756;3352;1252;1667;1470;361;1252;1252;589;406,1426;1668;436;1747;28,543,837,1500;589;589;1342;1252;28;3307,3308,3309,3310;3591;3561,3562;3120;2813;28,31,1639;451;2044;1347,1606;1513;2959,2960;2959,2960;959;2959,2960;2959,2960;1282;543,589,611;396;28,430,589;28;758;396;503;758;728,731;1639;589;611,2043;947,948;543;1470;1747;2616;683,3376;406;589;459;28;588,653;1470;464;1470;430,638;2423;110;2133;420,3054,3055;728,731;1540;476,999;28,999,1668;498;1652;464;589;1652;999;999;1540;589;1026;632;589,1513;1748;1748;791,1501;1470;397;1446;791,1470,1532;2140;1423;589;999;2416;1790;1470;1470;999;28;1540;837;589;1104,1995;589;1470;346;385,1669;385,1669;2616;1668;1470,2049;406;947,948;999;947,948;680,999;589;674;837,965;2725,2726;1723,1724;1304,1713;110,411,589;2611;896;3075;543;1668;1470;1470;1470;1470;127,2489;346;1622;1470;1470;1470;1748;649;627;3313;476;396,430,464,546;385,430,464,589;346;2762;1252;589;1227;1066;464;1670;1328;346;1470;1667,1668,1669;1470;3602;1104,1978;589;385;451;1812;837,1059,1470,1528;1252;397;1252;589;396,500,2083;346,1130,1131;653;180,181,182;588;509,589;589;1186;2218;758;1470;349;1747,1756;385,451;385,451;385,451;31,632;498,1677;635;589;377;1470;1694;1540,1559;1470;1089,1360,1361;1470;1405;1622;312,313;1748;413;361,1224;406;2366;1644;441,585;1505,1560,1586;1748;28,430,874,876;28,873,874,875;725,1975;1470;3015;346;1405;413;1476,1478,1479;3438;589;902;1470;1470;1209;2747;2006;406,1426,2166,2167;3151;178;1046;1470,1551;1479;1606;406,1721;1470;1540;1470;1470;1470;366,369;703;589;1470;1016,1017;1622,1747;783;2377;1227;1110;1981;1289;1470;1470;1470;837,1059,1470,1528;1169,1170;1470;2832;1470;1747,1756;377;589;331;450,1288;98,99,358;496;632,785,837,1650,1760,1812,1816,1817;358;464;806;788;805,806;366;1747,1756;740;3500;150,151;150,151,3601;154;1747,1756;2932;1252;1252;1470;1352;1213;698,699,700;1666;1470;569;1470;2135;1470;1470;1748;809;653;1674;589;2013,2014,2015;1470;589;1470;3563;2339;28;800;1622;406,1476,1522,1523,1524,1525;1104;1128;1546,1569,1570;1470;1252;3374;1540;1924;843;28;2367;2747;28;2458;716;28;1470;1747;331;653;1249;368;3476;3559;1669;1540;413,1559;413;1470,1714;972,2730,2731,2732,2733,2734,2735;413,1540;1580;1470;1470;1470;1148,1476,1576,1577,1578,1579;1470;1747;1748;2648,2649;999;589,2080;413;1748;390;1914;652;999;1186;3004,3005;1354;589;589;788;1924;2969;1603;3560;28,1540;28;1670;28,439,813,1950;28;1540;1470;28,1496;28,1585;1445;1470,1496;1747;1470;3573;1622;999;1747;999;1470;1540,3239,3240,3241,3242;256;589;1747;999,1105;1470;450,997;1748;436,774;2096;361;1722;2616;1710;1470;28,396;589;1379,2254;1450;28,2643;1026,1971;1540;1107,3393;2339;28,66;28,66;28,66;28,66;28,66;758;1586;115,2877,2878,2879,2880,2881;451;1747;1999;28,31;1470;2656;922;282,1767,1768;1622;1767,1768;1767,1768;1622;372;1747;1411;1748;1392;1622;589;1426;589;397,429,863;28;1743;221,225;1622;406,1721;1252;2616;1622;3059;1622;1504;758;1513;110,2329;589;625;1252;1748;1252;758;331,1639;426;1252;1470;947,948;631;1252;1252;1252;758;947,948;3448;758;758;167,168;1470;1470;1917;1470;1470;1622;1328;1227;624;589;1622;947,948;1614;758;503;589;1668;1670;1470;456,3583;1622;1186,1580;959;589;28,30,31,589,1639,1694;464,589;2518;2807;476,1973,1974,1975;331;451,1953,1954;2040;589;589;2528;28,1320,2668,2991,2992,2993,2994;589,2012;477;589;589;1747;386;758;331;1252;406;1540;1926;1747;1470;406;813;928;974,1461,1462;438,503,796,797,798;589;396,430,546;947,948;758;2067;1748;331;1622;982;1979;589;110,1470;1470;3189;978;3189;413,1540;2553;999,1100,1775,1776;389,1705,1706;543;2641;1470;1622;134,1618;459;28;110;1760;110;464;406,1721;464;1669;512,543;947,948;758;2656;589;589;3448;3448;589;589;589;464;2024;1747,1756;1747;788;1470;28,29;3165;1748;30;1667,1668,1669;2870,2871,2872;788;1668;1470;2182;947,948;616;1181;3537,3538;3048;1476,2937;1924;543;600;939;1470,1715;28,1801;2656;28,1499,1595;1622;2205;1667,1668,1669;1622;1186;1667,1669;1666;354;406;528;1747;1470;3424;1470;388,1470;589;1140,3476;1705;1470;1622;2458;450;450,762;1352,1969;450;28,1540;1445;548,624,1464,1465,1466,1467,1468,1469;1470;3506;395,413,1670;999;1667,1668,1669;110;358;1405;1747,1756;1667;2322;1540;464,589,947;31,1470;1470;1470;28,29,30,31;28,1254,1644,2839;1470;1470;806;268,269,1074,1075;797;2453;2386;1668;31;589;543;589;588;589;2954;589;137;1470;833;1470;588;1748;2001;1470;110;110;77;589;28,1415,2173;28,589;1013,1014,1015;1186,1470,1540;1186,1470;406;999;1186;28,1676;999;28,1540;361,1639;361,1639;361,1639;470;1747,1756,1890;1252;806;1405;1622;346,1130,1131;1940;653;2616;110;543;397;2616;758;1372,1698;3107;589;589;500,501,611,1194;28,1694,1776;372,3389;28;998;1694;372,419,1667;1669;389,2034;1670;999;1668;930,931,932;1186,1470;1709;1470;1252;30,31,1559;1671;1470;1622;385,464;589;1088;430,546;361,589,1540;589;411;999;2131;430,546,1209;589;1107,3393;28;589;1330;2185;1104;377,589;1540;1747;1760;1234;358;1470;3313;1747,1756;758;999;589;110;2435;1748;28,723;1097,1622;1470;1470;28;28,450,1667,2505;1470;398,503,3485;31;1470;1709;512,543,1470;396,589;1470;354;2133;1748;589;1667;358;331;1470;1540,3488,3489;1104;2954,3460;1622;1399;2182;1050;2338;589;1470;1470;115,512,543,589,1670;1352,1479;1186;2841;1252;616,1747;447;1405;2458;28,543;2458;349;413;1499,1690,1720;1470;28,438,440;361,665;63;1668;1438;575;1682;1747;589;1328;1405;106;1470;589;1566,1567,1568;1128;3153;430;389,1705,1706;3095;348;346,1130,1131;543;503,589;389,1705,1706;389,1705,1706;361;1227;2499,2500,2501,2502;28;1026;110,2329;1393,1394,1666;1747;543,837,2593;385,503,1664;758;1032;2040;464,589;426,1107,3250;589,1470;589;589;385,503,1664;503,1663,2133;385,503,1664;589;589;1104,1554;1440,1441,1442,1443;512;1426,2187,2480;30,419,999,1667;1470;1747;921;503,589;723;589;758;1107,3393;1668;1760;1470;2039;2050;2050;2050;1470;1585;406,1305;1405;1470;1476,1478,1481,1482;1470;1723,1724;476;1011;1622;406,1721;1396;1743;3026;947,948;1747,1756;1470;1292;573,1670;1622;1470;1317;2385;3097;31;1622;1616;1470;1759;1405;1104,1967;3367;837;406;1470;450,1236,1487,1488;1399;589;587;1128,1667;589;1668;2494;1694;1747;1470;2322;758;589,2722;947,948;589;2214;331;947,948;589;589;1347,2588,2589;1348;1470;1668;2003;543;589,1723,1724;2728;1470;632;2868,2869;1470;1668,1669;1671;644;30;588;470;385,1669;1470;1748;1747,1756;589;451,500,501,502;270;361;914;67,68,69;1252;1252;28,361,960;1907;1186;1227;1405;683,1540,2916;470,1747,2315;2341,2342;1470;3132;1669;1470;680;426;821;1743;2531;1667;331;1470;1470;297;2348;28,413,999,1870,1872;1342;766,1470,2275;1540;358,359,360,1622;649;1470;1470;1470;1140,3476;28;1880;1669;2766;1104;895;947,948;740,1622;1470;1470;28,413,999,1870,1872;28,413,999,1870,1872;1470;653,1470;1623;1470;110,1470,1570,2627,2826,2827,2828,2829;1972;1423;1470;1470;1470;1470;1470;450,837;1470;396;947,948;589;464;589;112,113;115,1540;1470;1470;691,1667;426,999,1559;395,1559,1667,1668,1669,1670;3356;1252;3193;156,157;1470;346;1748;2470;543,589;1470;77;1470;1747,1756;1470;632;1747;806;361,1103,1104,1105,1107;2006;110;608;589,2057;115;1667;28;1622;1406,2115;3174;1594;444;164;785;301;1470;354;1470;589,2043;589;1730;649,1470;397;1754;397;801;2795;1470;28,691,2420;1438;127;381,382,1622;1470;1405;1405;2720;2069;589;589;2772;1470,1723,1724;28,937,1777;1470;632;127;1540;28;31;589,2080;28,1540;1252;1747;1669;784;115,1404;1252;331;2367;2370;1747;254,255;703,837;28;28;1405;3151;1470;1747;837;1470;1405;1470;1670;28;1470;589;28,413;31,632;2956;937;589;1176;28,438;430,464;947,948;455;3029;1540;28,396;31,589;1667;28,589;28,396;1540;1667;361;28,396;406;2620,2621;589;406,1721;512,543,1694;1622;957;1470,2712,2713,2714;1470;464;1622;1470;1470;1470;450,1288;1747;354,791;1622;1470;354;1107,3393;464;947,948;888;1718;1470;0,1,2,3,4,5,6,7,9,10,11,12,13,14,15,16,17,18,320,321,322,323,325;758;77;562;1352;589;1644;110;947,948;589;569;28,396;947,948;758;758;758;1667;1747,1756;1470;1671;653;557,1451,1452;1668;366;503,589;1470;377;1929;417,500,501;17,320,321,322,323,324,325;809;1668;1470;2006;589;28,1670;3459;2182;999;464;1652;589,3345;31;28;1328;377;1435;1470;1670;290;1622;1748;377,1652;984,998;837;28,413,1673,1870;28,413,1673,1870;589;589;589;1470;758;1470;1748;1622;1667,1668,1669;1793;1793;1470,2579,2941,2942;569,1164;2262;2120;1470;1470;331;28;947,948;1411,1423,1470,2677,2678;1470;436;653;648,863,1666;947,948;1470;28;999;1252;110;1839;1470;837,1430;1405;1470;1227;637;127;1826;1470;1252;1023;955;2373;1405;1470;141;1622;999;110,2329;1470;464;1748;1186;1252;1470;653;1470;947,948;589;28,450;385;589;28;589,725;589;1759;2954,3460;223,224;887;2613;1747,1756;785;758;1733;1470;385,1241,1242;235,236;1305;1747;1622;1667;589;1470;589;512;805,806;543,725;1754;377;611,1194;1892;377;3313;1747,1756;1470;1252;837;1038;873,874,875,876;158,293;1213;744;1747,1756;28,455;1470;1668;354;589;413;385,450,1667,2251;2529;2907;1470;3313;1470;354;589;1470;1614;1622;1669;999,1540;1668;389,476;1252;1236,1470;464;1470;2255;1470;1470;589;451;589;791,1470;28;361;1748;1107,3393;1107;1107,3393;2751;2917;406,1476,1522,1523,1524,1525;837;115;354;1748;1537,1538;1249;1748;1669;110;413,1107;1470;28,398;503,589;354;1622;3570,3571;1540,3239,3240,3241,3242;1470;1104;1252;28;385;1227;1540,1694;28,1540;1748;3313;1140,3476;464;791;331;1743;1217;2656,2658;632,1470,1606;366;1669;1470;385,1669;1296,1409;1470;1747;616;110,1736,2329;916;31,1470,2254;2508;346,1130,1131;806;691;758;1540;208,209;2383;1622;1470;1308;1668;1186;31,1254,3353;426;972,2730,2731,2732,2733,2734,2735;385,1669;1470;589;346;3375;589;2467,2468,2469;358;788;1730;503,589;589;1540;1186,1470;28,545,589;110,795;450,1579,2402;546;543;1748;1382;1470;451;1593;2616;2157,2158;999;1588;947,948;695;1059,1470;1470;1743;1747;1470;554;1540;1470;450;680,1107;354;668;1470;451;589;1670;1347;758;385,1669;2046;1470;1470;543;28,396;1470;1622;1470;28;354;1470;1767,1768;1767,1768;1767,1768;1767,1768;1767,1768;1767,1768;1767,1768;1863;2367;1026;1470;503;1748;1622;397;1342;1747,1756;999;1470;1470;1622;1668;346,1130,1131;1928;1104;1470;354;589;1470;1540;1470;2014,2015;28,1604;1252;406,1476,1522,1523,1524,1525;1252;1470;1252;1252;947,948;1252;758;2547;1470;346,1130,1131;1759;406,1721;771;1897;1240;2133;1470;379;1747;758;589;1328,1329;837;464;28,1543,1544;1622;1747;28,2068;837,1615;1903,1904;1904;1748;685;932;947,948;758;861;1748;589;1747,1756;299;1059;1059,1570;1470;1667;1447,1448;1237;2568;1470;1347;1747;1500;1470;1748;3582;386;1747;1531,1532;1540,3239,3240,3241,3242;648;1667;589;377;589;589;589;1748;1747,1756;813;1107,3393;346,1130,1131;1426;372;1748;1668;1540;1470;1748;354;28;3614;1470;1470;589;2465;1314;1252;1252;2796;999;1747,1756;1470;902,1104,1927;1470;496,837;589,1050,2294;1748;1993,2304;1470;1694;2906;990,991;1252;589;361;512;115;346;1536;758;1694;1622;1470;1622;557,1451,1452;1470;-2847;3518;1470;1747;397;1622;543;1470;346;939;703;589;624;589;1670;1747;28,29;28;837;1007;1470;589;358;1754;1748;28,66;63,64;28,66;28,66;589;1667;758;361,1639;1470;134;1128;947,948;589;589;1470;2067;1470;1252;999;28;28;1540;1540;1470;28;999;450,762,1550;2496;1252;1470;1622;1470;234;1559;999;233;2074;426,999;366;406,1721;2928;758;1580;1747;413;1252;1470;758;758;28,396;999;28,438;947,948;1431;1412;397;1470;1924;2528;2339;358;1622;1748;1470;28;1622;653;624;464,589;589;354;785;1479;426,999;454;464;1470;411,589;589;546,589;569;3635;476;999;1155;1470;1252;1540,3239,3240,3241,3242;366;28;1470;907;2688;1470;426;1470;653;1089;1470;1747,1756;1470;406;589;1747;2801;28;813;2837,2838;31,1254,3353;2027;396,430,546;464;589;1470;77;28;464;1202,1208;758;545,1660;589;589;385;441;758;589;589;464;385,830;429,464,589;758;1639;939;1159;2067;1107,3393;653;1722,2354;1470;406,1721;358;2616;1622;1252;1985;1767,1768;95;3388;29;2616;788,1848;947,948;1470;767;1747,1756;110;999;1470;1470;1470;406,2069;788;1540;1470;1470;1747;3346;385;1470;1470;653;3161;1747;464,589;427;1470;28;346,1130,1131;77;1470;2231,2232,2233;3569;486;1211;1392;464;1622;1142;589;947,948;1227;2041;758;947,948;758;947,948;1227;589;564;546;947,948;30;110;589;589;28;28;1470;999;589;999;385;1668;450,762;1470;1759;2006;110,2329;358;385,1669;3081;361;616;1470;1622;413;1593;2586;385,1669;28;1252;496,776;2758,2784;464,503;1470;354;106;1405;1540;1540;1387;1540;902;28;1252;28,999,2687;396;464,589;1747,1756;2182;1668;1666;1107,3393;1669;1540;1107,3393;411,569,589;28,1107;378,476,541,1670;1666;1342;28,413,1670,1673,1870,1871,1872;265,266,267;1104;229,230;589;28,3171;939;653;354;28,413,999,1870,1872;471;2039;28,450,999,1330;1442,1455;1470;837;429;1474,1475,1476;1619;1743;1710;1748;616;1392,2269;31;1613;811;106;1226;1747,1756;1668;616;589;1748;703;1470;28,999,2790;397;378,569;1330;1748;110,788,2329;1470;1747;1252;1059,1470;1747,1756;617;868;347,2191;301,302;624;624;3313;1470;1470;1013,1014,1015;115,648,2743;385;785,1128,1249;1703;1668;2616;158;1252;3237;3037;791,1547,1548;133;999;29;1470;89;1496;396;28;879;589;28,937,1777;28,1778,1779;331;2431;1470;896;1252;243,245;349;143;450,1499,1590;476,1033;2616;1252;1252;1747;3114,3115,3116;28;28,2438;1747;406,1476,1522,1523,1524,1525;28;589;569;28,2915;632,1499,2906,3198;1470;110;28;456,1659;1470;1540;1668;978;589;28,1543;28;589;28,2519;589;377,429,496,503,1071,1072,1073;28,999;385,1669;1059;1540;19,20,21,22,23,24,25,26,27,337,338,339,340,341,342,343,344,345;1148;524,525;28;397;1540;543,837,2593;110;1622;1711;1748;758;451,589;127;1470;1104;1747;1747;1470;1743,1759,1761;1731;791;127,257,258,366,1736;1252;3307,3308,3309,3310;3307,3308,3309,3310;19,20,21,22,23,24,25,26,27,337,338,339,340,341,342,343,344,345;947,948;2959,2960;589;947,948;947,948;589;947,948;947,948;377;1243,1918;543;589;589;1670;632;31;28,396;785;2078;1470;1107,3393;1470;1470;1470;386;1674;430;1747,1756;385;385,388;589;1328;1711;589;377;1748;1018;1397,1398;28,413,1669,1870,1872;1252;2616;2647;1470;1748;464;589;999;1748;2087;3066;1748;1300;110,1735,1736,2329;1470;1470;1470;589;2311;999;947,948;1540,3239,3240,3241,3242;947,948;667;1470;3448;1767,1768;406,1476,1522,1523,1524,1525;947,948;947,948;1470;3524;1748;358;653;939;1747,1756;1622;1748;261,262;346,1130,1131;1470;1747,1756;31,3378,3379;653;758;543,589;464;791,1470,1532;589;1747,1756;2892;758;28,518;589;1328,2833;529;361;762;2579;1128;2823;1470;372,1226;653;1252;589;1405;1470;28,29;413;1470;1748;1748;1747;1124;1252;947,948;1470;1470;2638;1470;2141;2774,2775,2776,2777,2778;1668;1104;2255;28,29;1470;1470;401;1670;386;999;794;239;1748;1723,1724;891;649;3243;1470;385,1669;1747;1622;622;1252;430;1748;1540;1748;1743;115,132,3545,3546,3547,3548,3549;1540;354;1474,1475,1476;1669;1470;1470;1470,1540;632,1650,1720,1813,1814,1815;806;806;755;488;797,1128;3313;310,311,346,1748;110;1747,1756;354,703;346;1622;385,503,1664;1470;703,3313;653;1470;2244;2328;294,295;1470;1140,3476;3476;1470;569;1566,1567,1568;1671;589;1669;1470;1379,2355;1669;2006;1342;1622;1470;1470;28,31,543,1254,3353,3354;1496;1748;1748;589;1470;1470;385,503,1664;2635;537;2635;972,2730,2731,2732,2733,2734,2735;2021,2022;450,999,1236,1275;1470;1710;464;758;1470;2755;346;1540;1252;999,3094;624;1748;496;385;3255;974,1461,1462;947,948;2418,2419;900;589;1383;1252;1252;980;450;758;758;28,1476;28;1723,1724;406,1476,1522,1523,1524,1525;1857;1252;653;411;589;725,726,959;406;127;3598;791,3064;464;406,1426;1110;683,837,1249,1379,2028;1470;578;464,473;411,569;377;2055;947,948;3010,3011,3012,3013;80,2885,2887,2888,2891,2893;464,589;999;1352;529;719;1405;1710;1622;999,1100,1775,1776;385;349;3320;1748;1470;1767,1768;1767,1768;430;2053;589;589,1470;1622;622;1748;503,1662;589;999;758;1252;28;1470;1470;529;1252;758;589;2067;406,1721;1470;1540;1622;1470;110,2329;346,1130,1131;1828,1829;589;947,948;1470;653;1470;1209;203,204;589;589,2012;2002;1213;1668;1747,2379;652;110;947,948;1470;3313;110;406,1540,1723,3335;1748;28;1748;497,543,1042,1091,1667;1104;127;496;653;632,3407;3218,3219,3220;3218,3219,3220;3218,3219,3220;1622;1260;28;1470;1967;1470;397;1094;28,29;1059,1470;31;947,948;589;947,948;1877;3165;1767,1768;1747;1252;1252;1252;1470;1312;1470;1470;1669,2072;589;28;2222;1470;1580;436;1470;1470;1622;1342;1622;435;1345,1346,1347;598;1470;1470;346;331,450;1470;1470;999,1540;1470;1667,1668,1669;1747;1186,1470;653;450;624;28,29;999;1201;346;2043;1470;1540;1252;947,948;1933;1748;1470;1747;503,589;758;28;2316;947,948;2006;406,1721;3313;861;758;1470;785;1745;28;1470;1722;758;110;589;758;28,66;28,66;1668;1747;1622;3327;28,3224,3225;1669;1670;1470;1470;17,320,321,322,323,324,325;1470;862;1176,1213;133;346;385;2339;1589;1470;3461;1668;758;1747;358;3114,3115;589;1759;2339;939;1470;451;1104;1024;385;361;1470;119,120;1470;1252;1748;472;999,1107;505;589;758;1747;893;3397;653;2309;1623;1747;1470;1622;2043;1669;1737,1738;450;2036;464;2127,2945;3151;1352;31,1694;1470;1470;653;1747,1756;1470;2456;408,409;1540;600;1224;2026;1848;849;1540;589;947,948;589;1470;2133;589;1747;1470;1470;28;1470;1062;1737,1738;806;1747;947,948;1670;788;999;1669;1470;28,450,1489;28;1442,1455;1924;1470;1470;2296;1748;1889;430;1107,3393;464;2050;2050;589;589;3324;464;1470;1330,1694,2973,2974;589;464;1748;3336;1470;947,948;806;406,1721;1026;419;1668;1470;589;1059;1252;788;1470;397;406,1476,1522,1523,1524,1525;152;2006;1470;1470;1470;2188;28;837,1457;464;589;589;1675;999;589;31,543;1470;1591;385,3611;1748;1252;1545;1470;589;1747;346,1748;837;1667;1554;1622;28,451;917,918;1107,3393;1255;1470;1340;1470;3522;1470;2484,2485;1743;1540;1747;999;1540;1107,3393;28,413,1870,1872;1107,3393;546;354;109;1379;28,395,413,999,1870;1540;1666;1540;1540;999;1470;1107;406;115;1104,1470;28,29;1895;346,1130,1131;2170;589;2216;2006;1622;791,1470,1532;1470;1470;1470;3195;2271;464;377;1431;1328;589;1470;436;1748;616;1582,1583,1584;142;2347;1759;1470;3513;1670;1670;1470;1240;1384,1385;1470;1747;1748;1470;476;1622;1474,1475,1476;868,2191;624,632;1470;110;589;2006;1470;589;28,1694,2003,2966;406,1476,1522,1523,1524,1525;589;589;28,2852;1331;758;758;1220,1470;464;3422;1622;837,1457;2222;115;1252;2981;1218,1249;791;137,138;1622;28;2772;1668;1622;413,1107;110;3382;947,948;758;758;509,589;548;1128;512,1669;1470;1709;1470;110;1748;358;1807,1808;1236;1748;693,1356;1668;1470;354;1748;589;2133;385,503,1664,1665;411,569;947,948;758;115;589;1748;758;331;1470;346;1470;3383;110,3166;2759;1668;1670;385,388,484;1470;1249;28,413,1674,1870,1872;1886;503;28,413,1540,1870,1872;1104;1470;1470;589;1186;589;426;529;1540,3239,3240,3241,3242;1470;413;1767,1768;1171;1412;148;464;758;589;1470;589;3313;398,632;1470;1748;939;1667;1748;1470;703;2336;464;3447;1470;465;589;1622;1470;758;727;1470;787;1470;1498;406,1721;1252;758;616;1470;1747,1756;785;589;758;1470;385,451;616,1747,1748;1128;1747,1756;1748;1622;1747;873,874,877;28,1705;1104;589;1723,1724;158,159;837;2278;2278;589;543;110;785;1667;2821;589;589;2162;1470;589;28,1543,1544;1887;891;406;1107,3393;1226;3471;1470;1470;861;1629;1748;1252;1470;1128;947,948;2490;632;1055,1056;185,186;1748;758;589;331;2604;1470;28,29;1104;1470;837;385,1669;1669;30,378,632;1470;110;1622;2635;2635;3586;1470;28;972,2730,2731,2732,2733,2734,2735;1470;1470;28,29;1470;366;1128;1342;999;366,616;1748;1748;1252;115,2877,2878,2879,2880,2881;1445;2592;632;833;464,595;3243;346,1130,1131;1748;653;791,839;1470;589;28;411,569,589;1470;354,837;1470;28,354,406;464;2067;999;947,948;503,589;1247;547,548;3365;2100;1470;110;1540;1252;2001;758;589;1470;788;1767,1768;1767,1768;1767,1768;1767,1768;2353;397;1342;1470;543,999,1540;1622;110,1554;788;1057;705;3199;817;1252;947,948;1470;28;28,66;28,66;28,66;758;1622;1437;1252;464;557,1451,1452;1667,1668,1669;1445;412;1424,1425;947,948;366;758;791;1581,2031;110,406,1329,1490,1491;31,451,543,2214;947,948;546;947,948;1747;758;366;1249;117;1748;1945;1748;386;2464;2069;28;2616;110;758;346,1130,1131;758;569;589;1470;1470;28;837;1470;1470;406,1952;633;1470;1470;406,1476,1522,1523,1524,1525;1521;1622;1252;1476,1573;411;1128;589,2815;149;28,29;758;947,948;28,29;987;1767,1768;28,29,30,31;543,589,1540;2282;589;2184;2043;589;1470;622;28,29,30,31;349;1669,2072;1748;758;346,1130,1131;1470;589;1759;1710;1252;1252;1140,3476;77;1622,1747;1710;840;512;1470;785;2620,2621;28,450,1574,1575;999;1622;1279;1470;3169,3170;1747;2006;1252;1470;1252;28,29;1064;349;3347;1554,1723,1724;406,1476,1522,1523,1524,1525;1744;1714;1140,3476;1622;1747;589;3152;1252;1748;89;500,2083,2404;589;2616;1470;999;947,948;589,1101;1622;1470;2719;589;1243;1470;1470;115;1999;1470;1694;1747;806;358;1668;28;397;89,3526;2295;879;377,589;1748;1400;999;546;430;2616;2616;1355;1622;1252;947,948;1470;358;947,948;2006;476;2080;1748;1470;589;602,603;588;939;1671;1252;1239;1380;1747;589;346;833;1352;543,1666;464;600;1365;569;1748;3386;1470;1470;1470;1622;2716;591,692;1386;1924;1855;589;947,948;110;3522;28;28,1540;675;1470;3475;28,1543,1544;1500;385,503,1664;758;543;385,503,1664;828,829;416;1337;2847;616;597;385,1669;1667;1470;2772;1470;758;2381;1710;2050;2050;1094;1470;1470;3052;589;1470;1252;1426;806;1470;2216;1747,1756;589;2082;1748;28,29;110;1470;1470;1470;28,29;407,589;837,1059,1470,1528;1747,1756;1252;358,1264,1622;2015;464;397;110;28,29;28,451;947,948;589;429,430,855;758;999;589;1470;1470;346,1130,1131;1747,1756;1470;998;28,960,1920,1921;1470;1759,3147,3148;999;1470;406,1476,1522,1523,1524,1525;436;1747;2758,2783,2784;411;1107;1674;1107,3393;243,1587;1669;28,413,1870;1470;543;1252;1470;28,413,999,1870,1872;1668;1747;1470;1236;1630;385,450,762;616,1748;1747;464,589;589;1747,1756;954;653;1747;1667;1470;346,1130,1131;1622;1474,1475,1476;806;1470;1747;589;978,1102;1470;1669;361,1694,2003;473;667;589;1470;1668;1669;3587,3588;1252;1470;354;1392;589;589;1252;543,589;2349;385,1669;1743;1252;1747;1252;497;589;346,1130,1131;28;1213;529;1470;419,589,636;1747;1722;521;1431;589;1748;543,1470;758;758;195,196,197;1157,1158;1841;3138;28,413,1540,1870,1872;1540;1747;361,1668,1669;28,1668;110;1622;346,1130,1131;1747;947,948;900;1747;1306;129;999,2495;1622;1562,1563,1564;3597;3307,3308,3309,3310;28,785;110,1736,2329;1470;1470;396;947,948;947,948;2771;947,948;2701;110;1668;1470;1606;1622;902;632;653;28,413,1673,1870;893,1186;3351;1405;791,1547,1548,1549;2772;464,589;1353;589;1426;386;1667,1668,1669;396,1227;1470;589;410;1104;947,948;1669;1470;589;1671;902;28;2876;1470;436;1252;1670;1747,1756;1227;28;947,948;464;354;28;1748;406,1721;3313;891,1152;1470;1622;464;28,29;1748;758;1252;1729;3597;1442,1455;1442,1455;385,451;366;1748;28,29;125;1470;2616;28,1496;1747;589;589;1470;1470;1470;1252;2278;1470;589;400,401,402;449;451,987,1195;464;1747;3313;377;1252;589;208,209;2006;1667;1227;893;3382;1470;496;385,1669;1288;889;589;1668;1748;110;947,948;1540;1422;1747;1252;1622;589,1470;2026,2378;28,476,498;1470;1747,1756;-3574;1030;1140,3476;1470;110;2664,2665,2666;1622;1470;436;1470;608;346;999;837,1408,2641,2642;2779,2780;1748;1710;1589;1342;1342;1342;837,1059,1470,1528;1747;28,3018;693;690,2202;3172;557,1451,1452;1785;1470;2516;3065;589;837;1470;1066;28,1053;28;1671;947,948;110,2329;1540;1743;1995;622;1748;1730;110;2616;589;837;624;864;1343;569;29,1100,1669,1772;1470;758;1470;758;1622;758;464;158,177;902;758;1252;1767,1768;1767,1768;1767,1768;1767,1768;1747;1342;588;1470;785;81,82,83;1342;28,66;1252;1252;1252;346,1130,1131;1747,1756;999;1227;2136;1747,1756;3114,3115;1622;1470;1252;785;1470;1845;1470;543,1976;947,948;77,1596;1470;1470;28;1670;92,3226;1176;354;464,503;1748;1747,1756;406,1476,1522,1523,1524,1525;616;947,948;758;1748;1470;1176;451;1470;589;2102;1747,1756;1470;1470;1470;1249;361;978,1319;947,948;589;28,29;2616;1748;2184;1748;589;1252;1252;1747;1252;1471;1747,1756;758;1622;1252;1470;1748;1470;1470;406,1476,1522,1523,1524,1525;990,991;573,627,990,991;788,843;3076;1470;1747;3113;702;1104;28,29;1748;785;110;1748;1470;1470;758;589;346;2317;3616;947,948;1718;1748;1730;939;2050;589;28,29,30,31;1967;378;630;134,1213;1748;1622;2040;1470;358;1669;3527;616;396;1748;1013,1014,1015;965,1998,2066;1470;589;1904;1379;1470;464;411,569,589;589;372;436;1622;372;1062;1186;28,29;1747;555;1747;589;588;861;406,1476,1522,1523,1524,1525;589;174,175;1767,1768;3110;2803;31;2837,2838;439,813,2513;939;947,948;947,948;589;589;464,589;939;939;1059,1470;451,509;1470;1470;1457,1470,1558;589;2050;386;589;496;589;1668;1236;1759;28,29;1252;413;28,29;1540;28;1470;1227;1622;1470;575;1470;1104;1249;1470;1470;624;3190;703;2608;1470;1669,1674;1470;947,948;947,948;1470;1470;619;363,364,365,1470;2590;999;3533;1107,3393;2717;589;1747;589;1423;1107,3393;543;1470;1989;788;3458;1747,1756;1540;1252;3344;1667;28,413,1673,1870,1872;1107,3393;28,413,1673;1748;589;1670;1747;758;28,691,1669;1668;28,413,999,1870,1872;1470;331;1669;315,316;653;1747;1470;1146;1748;943;3046;806;1748;672,673;1747,1756;1668;1470;868,2191;1370;1785;1470;947,948;947,948;589;1038,2610;1747;1202,1203,1204,1205,1206,1207,1208;758;1470;346,1130,1131;1470;1104;1667;2975,2976;3030;1622;1252;1747,1756;1667,2159;859;1470;3052;1470;1747;115;1694;28;385;28;1540;1470;1622;1748;1622;1223;1252;406,1476,1522,1523,1524,1525;1736;1423;1470;385,503,1664;1186,1470;589;2040;947,948;947,948;947,948;1651;616;1747;1077;589;28;1128;28;2585;879;1470;430;777;2040;28,396;589;1470;1470;947,948;1596;1513;1513;1470;1470;1748;1104;1470;947,948;1470;28,110,436;1747,1756;386;1251;939,1908;3033;543;837,1059,1470,1528;2403;589;758;1474,1475,1476;346;385,1470;1328;1470;653,851;785;1470;653;861;28,66;589;2035;668;2616;589;589;28;1747;1470;1747,1756;1667;1748;1540;999;1470;791;1748;2006;1747,1756;1470;3019;430;999;2656;1470;29;1470;788;115;28,2491;1470;589;791;2496;1236;543;1470;110;28;1470;589;589;368,1622;999;1198,1199;653;589;3539;1748;28;503;1622;589;28,66;28,66;28,66;1748;999;346,1130,1131;28,2067;3496,3497;2107;1038;110;436;857,999;349;758;1470;1899;837;1470;354;1723,1724;1668;28,1540;1527;589;541;1470;785;1767,1768;1767,1768;1767,1768;1767,1768;1767,1768;1767,1768;964,965;1747;562;28,66;28,66;28,66;28,66;28,66;28,66;28,66;28,66;28,66;28,66;1470;854;1667;397,436;1068;589;1748;1252;1081;1668;366;1470;1470;346;589;1470;346,1130,1131;1622;464,1227;346,1130,1131;2616;1470;947,948;947,948;366;1470;1748;1622;1585;891;1668;1420,1421;346;1470;987;1748;1252;1622;1470;703;331;3476;1140,3476;1140,3476;1140,3476;2330;1470;406,1476,1522,1523,1524,1525;397;837,1059,1470,1528;346;2222;1227;3406;346,1130,1131;1445;1669;436,842;1747;-1060,1530;1059;28,29;653;1470;589;758;1252;28,29;1723,1724;1622;28,29;999;837,1059,1470,1528;947,948;939;1744;1747,1756;1622;1666;1365;1619;385,727;346;791,1470;1470;2506;436,451,589;1898;28,430,770;1748;1470;3313;1350,1351;1041;1096,1622;1622;2043;947,948;2836;1470;1748;758;758;947,948;331;806;1053;354;653;916;1286;-2898,-2899,-2900,-2901,-2902;3558;264;28,1540,2944;354;612;1470;429,1657,1658;939;624;1470;28;616;589;2050;1470;2616;28,29;450,762;1748;349,1085;331;1747,1756;1622;703,1470;28,29;368,371;1622;413;1668;1470;836;28,29;1470;346,1130,1131;430;1622;160;1748;1470;588;28;28,589;397;215;589;947,948;1107,3393;1474,1475,1476;631;411,632,934,1669,2432,2433;28,413,999;406,1476,1522,1523,1524,1525;3529,3530;1470;1470;1470,3058;616,1748;589;1470,1714;28;589;1747;31;1367;1077;1748,1984;1747;1470;1747;785;346,1130,1131;1747;589;1107;464;406,1476,1522,1523,1524,1525;89;1855;2857;1470;1376,1470;346,1130,1131;1252;1639;589,1639;385,730;377,503,589;1734;1710;788,1748;1622,1627;1240;999,3316;476;451;28;1668;788;1622;947,948;837;1747;464;1470;1670;2657;1470;1652;589;1748;758;17,-29,320,321,322,323,324,325;346,1130,1131;361,830;1470;920;1067;386;1667;2385;1622;436;1435;653;589;653;1470;2954,3460;589;589;436;1470;366;1186;1364;1252;947,948;589;127,529,3398;791,2256;1710;31;1748;1748;1747;406,1426;1747;1435;1748;28,1540;1376,1997;1797,2746;28;1470;1470;1140;1470;476;346;1723,1724;2268;589;1470;837,1059,1470,1528;1454;28,29;1470;1470;1470;2591;361;855;28,29;1342;2447;28,66;2447;28,66;589;346;2325;496;397;589;947,948;2808;758;1470;1622;397;1767,1768;1767,1768;-741,1767,1768;1767,1768;1767,1768;1767,1768;1767,1768;1767,1768;1767,1768;1767,1768;1435;1710;411,569,589;1470;616;464;1622;589;758;1622;1470;1252;1748;366;837;797;1622;1622;1470;1747;947,948;589;1470;2390;1470;1186;2999;2199;1470;406,1721;1470;978,2996,2997;987;127,134,3586;1457,1470,1558;1252;1470;1470;1252;1252;1252;891;1470;1470;622;758;947,948;1748;28,476;1252;436;1996;1647;1667;1470;1252;580;1470;28,66;28,66;2558;1748;589;1748;115,704;28,29,30,31;539,1051;1470;3457;548;2219;1470;589;1470;1669;1252;939;1104;1622;1107,3393;653;1292;1710;2104;939;2006;2716;208,317;1252;3414,3415;2050;2050;806;1540;1227;2351;1470;1748;1622;806;3518;1442,1455;1429;28,66;28,66;28,66;28,66;28,66;28,66;28,66;28,66;503,589;589;115,648;1252;1236;1710;1894;1107,3393;928;1142,1287;589;589;1470;653;1470;1470;28;1315;1540;1540;1967;1747;476;758;1470;28,413,999,1870,1872;413;572,573;1710;1470;1442,1455;913;1719;1470;1712;3010,3011,3012;1470;1470;1747,1762;110;806;2971;28,29;1470;1227;397;1747;386;806;2145;1445;1482;589;110;758;28,29,30,31;2014,2015;3316;589;1042;28,999;589;1667;1622;1622;476;806;1622;1470;1470;3501;473;1710;622;28,364,1195;1668;412;3414,3415;411;459;785;589,999,1470;1107,3393;2910;562;1748;1744;2006;1666;727;589;1747,1748;1227;1802;870;1747;1470;589;479;1748;1747;436;791,1547,1548;1670;3106;624;1221;1748;1748;2389;1531,1532;503,589;1540;1470;28,29;589;2272;1540;1445;543;1470;1470;349;1622;653;397;320,321,323,2811;1743;947,948;430;3135;947,948;28,66;999;1470;2591;2591;939;1767,1768;1767,1768;1767,1768;1767,1768;1767,1768;2616;1622;589;450;397;1748;589;588;2651;1470;1747;1470;947,948;1747,1756;2747;589;1747;589;947,948;1252;1252;1252;785;2997;28,29;28,29,31;115,470;939;1252;1252;1252;1470;1748;28,29,30,31;1881;1302;1748;1470;1992;1252;450;1470;287;1470;2753,2754;1470;1748;785;1352;1252;1748;1470;1243;1747;406;1470;28,1667;1470;1470;947,948;1432;3313;1060;1252;916;2016;939;112,187;622;1252;1767,1768;1767,1768;2050;806;346,1130,1131;1470;589;366;1622;1710;589;1748;436;1582,1583,1584;349;1476,1573;1967;1048;1622;349;346,1130,1131;263;1846;1470;1747,1756;346;589;2963;1747;1747;1107,3393;354;1352;1325;1748;1104;110;110;1747;785,1709;221,225;2133;589,1470;913;1470;436;1622;28,1681,1872;28,29,30;785;28;28,29,30,31;28,29;377;1710;1767,1768;589;1622;2616;1767,1768;346,1130,1131;1470;2616;1622;1747,1748;3414,3415;2496;913;797;1226;3517;1470;785;632,1540;3476;-1497;346,1130,1131;589;272,273;436,479;464;1668;28,66;1470;1743;1470;1470;589,911;1748;1470;2187;1767,1768;1767,1768;1767,1768;1767,1768;1470;1622;31;1748;28,29,30,31;2746;616;28,476,1668;1470;589,2138;1252;2313;1075,1260;1666;703;346,1748;28,29;622;939;1435;310,3605;1470;3609;588;28;1747;1747;1873;785;653;1352;2280;2725,2726,2727;28,66;28,66;28,66;28,66;28,66;28,66;28,29;1252;1622;1540;1470;1622;1470;1748;529;368;589;891;1748;3173;1470;903;1252;413;1031;1748;28;28,2944;813;813;1747;1470;939;939;785;1747,1756;3477;346,1130,1131;464;110,2653;1767,1768;387;1435;1748;916;589;589;396;28,29;1710;1470;1470;1426;28,413,1870,1872;1747;1470;1470;1442,1455;1228,1622;1748;346,1130,1131;616;1470;1748;29;1296;2376;1470;785;436,1104;361;1748;1622;1470;947,948;1669;1710;3168;868;28,1079,1080;1622;2250;28,1670;653;1470;1470;1540,3185;1252;1622;1748;385;1470;1470;2643;1668;1540;589;406,1721;1470;509,622;2492;346,1470;358;1747;622;1470;1470;28;2210,2211;2539;1622;589;451;939;1470;1470;1767,1768;1767,1768;1767,1768;1767,1768;837,1328;1622;1622;1737,1738;1748;479;3414,3415;589;1470;406,1721;1668;1470;652;28,29;28,29;1767,1768;902;1622;397;1622;1667,1668,1669;947,948;1748;28,29,30;785;1622;1470;1622;1677;2616;1843,1844;1470;2836;1470;1622;538;319;28;1767,1768;449;813;1730;3534;939;627;1767,1768;386;999;1470;2616;1252;28,29;1382;624;1104;589;1435;1748;28,66;28,66;28,66;28,66;28,66;1748;1249;1631;1747;1748;346;1748;1747,1756;1470;758;2118;3150;2639;589;189,190;1668;1666;406,1476,1522,1523,1524,1525;1748;589,2080;1296;837,1059,1470,1528;354;1622;2523;1540,3239,3240,3241,3242,3243;1748;28,29,30,31;1470;1330;3414,3415;1747;406,1721;1748;1352;2313;589;386;1747;1470;2129;1470;110,2329;1240;1013,1014,1015;1930;115;1767,1768;1767,1768;1767,1768;1767,1768;1767,1768;1767,1768;147;28,29;28,29;28,29;28;1747;1748;1747;1470;1963;366;653;436;1747;2836;1622,3014;616;589;1470;1179;1748;891;1427;588;1767,1768;3140;1670;77;1470;1470;806;1470;346;1748;28,2643;470;3117;28,813;589;1747;561;89;1352;346,1130,1131;1470;1723,1724;28,641,642;2080;785;2172;1290;28,66;28,66;28,66;28,66;1767,1768;1470;624;346,1130,1131;28;1111;1470;1470;1252;1748;346;496;1333,1669,1674;1470;1470;1747;1747;3476;913;1470;1622;785;1767,1768;1767,1768;1622;136;2014,2015;496;28,29,30,31;1667,1668,1669;3414,3415;1667;3483;487;2836;1186;1767,1768;1670;1107,3393;3071;397;1710;2616;1622;1186;1470;366;162,163;1104;1470;2659,2660;2493;1668;1352;354;1622;1622;1748;28,29;1470;1470;314;2514,2515;1767,1768;1470;3414,3415;1470;1809,1810;385;3476;1694;1470;557;1767,1768;406,858;349;703;1470;588;785;386;3373;1470;788;1767,1768;346,1130,1131;358;332,333,348,349,3620;1107;28;28;1470;2006;1470;1470;334,335;1470;1767,1768;3414,3415;417,450,762,1670;346,1130,1131;1470;1470;361,588;3414,3415;3414,3415;624;3326;110;752;1435;110;589;29;1540;28,1195,1236,1708;785;1435;1114;3024;1470;1669;3414,3415;2488;1747;346;1390;2781,3003;1470;385,450,762;588;1352;3414,3415;1389;1540;436;3414,3415;1470;28,29,30,31;3414,3415;1670;2322;1747;1352;3414,3415;1622;785;785;28;1899;29;28;3414,3415;589;973;1470;3416;1622;1748;1470;1470;77;411,588;1767,1768;134,1618;894;3414,3415;29;1767,1768;476;902;3245;1470;397;3414,3415;926;797;589;3414,3415;1470;3414,3415;28,66;28,66;28,66;28,66;28,66;1470;201,202;28,66;28,66;28,66;28,66;28,66;28,66;28,66;28,66;28,66";

const $scriptletHostnames$ = /* 13293 */ ["j.gs","s.to","3sk.*","al.ly","asd.*","bc.vc","br.de","bs.to","clk.*","di.fm","fc.lc","fr.de","fzm.*","g3g.*","gmx.*","hqq.*","kat.*","lz.de","m4u.*","mt.de","nn.de","nw.de","o2.pl","op.gg","ouo.*","oxy.*","pnd.*","rp5.*","sh.st","sn.at","th.gl","tpb.*","tu.no","tz.de","ur.ly","vev.*","vz.lt","wa.de","wn.de","wp.de","wp.pl","wr.de","x.com","ytc.*","yts.*","za.gl","ze.tt","00m.in","1hd.to","2ddl.*","33sk.*","4br.me","4j.com","538.nl","9tsu.*","a8ix.*","agf.nl","aii.sh","al.com","as.com","av01.*","bab.la","bbf.lt","bcvc.*","bde4.*","btdb.*","btv.bg","c2g.at","cbc.ca","crn.pl","d-s.io","djs.sk","dlhd.*","dna.fr","dnn.de","dodz.*","dood.*","eio.io","epe.es","ettv.*","ew.com","exe.io","eztv.*","fbgo.*","fnp.de","ft.com","geo.de","geo.fr","goo.st","gra.pl","haz.de","hbz.us","hd21.*","hdss.*","hna.de","iir.ai","iiv.pl","imx.to","ioe.vn","jav.re","jav.sb","jav.si","javx.*","kaa.mx","kat2.*","kio.ac","kkat.*","kmo.to","kwik.*","la7.it","lne.es","lvz.de","m5g.it","met.bz","mexa.*","mmm.dk","mtv.fi","nj.com","nnn.de","nos.nl","now.gg","now.us","noz.de","npo.nl","nrz.de","nto.pl","och.to","oii.io","oii.la","ok.xxx","oke.io","oko.sh","ovid.*","pahe.*","pe.com","pnn.de","poop.*","qub.ca","ran.de","rgb.vn","rgl.vn","rtl.de","rtv.de","sab.bz","sfr.fr","shz.de","siz.tv","srt.am","svz.de","tek.no","tf1.fr","tfp.is","tii.la","tio.ch","tny.so","top.gg","tpi.li","tv2.no","tvn.pl","tvtv.*","txxx.*","uii.io","upns.*","vido.*","vip.de","vod.pl","voe.sx","vox.de","vsd.fr","waaw.*","waz.de","wco.tv","web.de","xnxx.*","xup.in","xxnx.*","yts2.*","zoro.*","0xxx.ws","10gb.vn","1337x.*","1377x.*","1ink.cc","24pdd.*","5278.cc","5play.*","7mmtv.*","7xm.xyz","8tm.net","a-ha.io","adn.com","adsh.cc","adsrt.*","adsy.pw","adyou.*","adzz.in","ahri8.*","ak4eg.*","akoam.*","akw.cam","akwam.*","an1.com","an1me.*","arbsd.*","babla.*","bbc.com","bgr.com","bgsi.gg","bhg.com","bild.de","biqle.*","bunkr.*","car.com","cbr.com","cbs.com","chip.de","cine.to","clik.pw","cnn.com","cpm.icu","crn.com","ctrlv.*","dbna.de","delo.bg","dict.cc","digi.no","dirp.me","dlhd.sx","docer.*","doods.*","doood.*","elixx.*","enit.in","eska.pl","exe.app","exey.io","faz.net","ffcv.es","filmy.*","fojik.*","fomo.id","fox.com","fpo.xxx","gala.de","gala.fr","gats.io","gdtot.*","giga.de","gk24.pl","gntai.*","gnula.*","goku.sx","gomo.to","gotxx.*","govid.*","gp24.pl","grid.id","gs24.pl","gsurl.*","hdvid.*","hdzog.*","hftg.co","igram.*","inc.com","inra.bg","itv.com","jav.one","javhd.*","jizz.us","jmty.jp","joyn.at","joyn.ch","joyn.de","jpg2.su","jpg6.su","k1nk.co","k511.me","kaas.ro","kfc.com","khsm.io","kijk.nl","kino.de","kinox.*","kinoz.*","koyso.*","ksl.com","ksta.de","lato.sx","laut.de","leak.sx","link.tl","linkz.*","linx.cc","litv.tv","lnk2.cc","logi.im","lulu.st","m4uhd.*","mail.de","mdn.lol","mega.nz","mexa.sh","mlfbd.*","mlsbd.*","mlwbd.*","moco.gg","moin.de","mopo.de","more.tv","moto.it","movi.pk","mtv.com","myegy.*","n-tv.de","nba.com","nbc.com","netu.ac","news.at","news.bg","news.de","nfl.com","nmac.to","noxx.to","nuvid.*","odum.cl","oe24.at","oggi.it","oload.*","onle.co","onvid.*","opvid.*","oxy.edu","oyohd.*","pelix.*","pes6.es","pfps.gg","pngs.gg","pobre.*","prad.de","qiwi.gg","qmh.sex","rabo.no","rat.xxx","raw18.*","rmcmv.*","sat1.de","sbot.cf","seehd.*","send.cm","sflix.*","sixx.de","sms24.*","songs.*","spy.com","stape.*","stfly.*","swfr.tv","szbz.de","tlin.me","tr.link","tube8.*","tune.pk","tver.jp","tvhay.*","tvply.*","tvtv.ca","tvtv.us","u.co.uk","ujav.me","uns.bio","upi.com","upn.one","upvid.*","vcp.xxx","veev.to","vidd.se","vidhd.*","vidoo.*","vidop.*","vidup.*","vipr.im","viu.com","vix.com","viz.com","vkmp3.*","vods.tv","vox.com","vozz.vn","vpro.nl","vsrc.su","vudeo.*","waaaw.*","waaw1.*","welt.de","wgod.co","wiwo.de","wwd.com","xtits.*","ydr.com","yiv.com","yout.pw","ytmp3.*","zeit.de","zeiz.me","zien.pl","0deh.com","123mkv.*","15min.lt","1flix.to","1mov.lol","20min.ch","2embed.*","2ix2.com","3prn.com","4anime.*","4cash.me","4khd.com","519.best","58n1.com","7mmtv.sx","85po.com","9gag.com","9n8o.com","9xflix.*","a2zapk.*","aalah.me","actvid.*","adbull.*","adeth.cc","adfloz.*","adfoc.us","adsup.lk","aetv.com","afly.pro","agefi.fr","al4a.com","alpin.de","anoboy.*","arcor.de","ariva.de","asd.pics","asiaon.*","atxtv.co","auone.jp","ayo24.id","azsoft.*","babia.to","bbw6.com","bdiptv.*","bdix.app","bif24.pl","bigfm.de","bilan.ch","bing.com","binged.*","bjhub.me","blick.ch","blick.de","bmovie.*","bombuj.*","booru.eu","brato.bg","brevi.eu","bunkr.la","bunkrr.*","cam4.com","canna.to","capshd.*","cataz.to","cety.app","cgaa.org","chd4.com","cima4u.*","cineb.gg","cineb.rs","cinen9.*","citi.com","clk.asia","cnbc.com","cnet.com","crichd.*","crone.es","cuse.com","cwtv.com","cybar.to","cykf.net","dahh.net","dazn.com","dbna.com","deano.me","dewimg.*","dfiles.*","dlhd.*>>","doods.to","doodss.*","dooood.*","dosya.co","dotgg.gg","duden.de","dump.xxx","ecac.org","egolf.jp","eldia.es","emoji.gg","ervik.as","espn.com","exee.app","exeo.app","exyi.net","f75s.com","fastt.gg","fembed.*","files.cx","files.fm","files.im","filma1.*","finya.de","fir3.net","flixhq.*","fmovie.*","focus.de","friv.com","frvr.com","fupa.net","fxmag.pl","fzlink.*","g9r6.com","ganool.*","gaygo.tv","gdflix.*","ggjav.tv","gload.to","glodls.*","gogohd.*","gokutv.*","gol24.pl","golem.de","grok.com","gtavi.pl","gusto.at","hackr.io","haho.moe","hd44.com","hd44.net","hdbox.ws","hdfull.*","heftig.*","heise.de","hidan.co","hidan.sh","hilaw.vn","hltv.org","howdy.id","hoyme.jp","hpjav.in","hqtv.biz","html.net","huim.com","hulu.com","hydrax.*","hyhd.org","iade.com","ibbs.pro","icelz.to","idnes.cz","imgdew.*","imgsen.*","imgsto.*","imgviu.*","isi7.net","its.porn","j91.asia","janjua.*","jmanga.*","jmmv.dev","jotea.cl","kaido.to","katbay.*","kcra.com","kduk.com","keepv.id","kizi.com","kloo.com","kmed.com","kmhd.net","kmnt.com","kpnw.com","ktee.com","ktmx.pro","kukaj.io","kukni.to","kwro.com","l8e8.com","l99j.com","la3c.com","lablue.*","lared.cl","lejdd.fr","levif.be","lin-ks.*","link1s.*","linkos.*","liveon.*","lnk.news","ma-x.org","magesy.*","mail.com","mazpic.*","mcloud.*","mgeko.cc","miro.com","missav.*","mitly.us","mixdrp.*","mixed.de","mkvhub.*","mmsbee.*","moms.com","money.bg","money.pl","movidy.*","movs4u.*","my1ink.*","my4w.com","myad.biz","mycima.*","myl1nk.*","myli3k.*","mylink.*","mzee.com","n.fcd.su","ncaa.com","newdmn.*","nhl66.ir","nick.com","nikke.gg","nohat.cc","nola.com","notube.*","ogario.*","orsm.net","oui.sncf","pa1n.xyz","pahe.ink","pasend.*","payt.com","pctnew.*","picks.my","picrok.*","pingit.*","pirate.*","pixlev.*","pluto.tv","plyjam.*","plyvdo.*","pogo.com","pons.com","porn.com","porn0.tv","pornid.*","pornx.to","qa2h.com","quins.us","quoka.de","r2sa.net","racaty.*","radio.at","radio.de","radio.dk","radio.es","radio.fr","radio.it","radio.pl","radio.pt","radio.se","ralli.ee","ranoz.gg","rargb.to","rasoi.me","rdr2.org","rdxhd1.*","rintor.*","rootz.so","roshy.tv","saint.to","sanet.lc","sanet.st","sbchip.*","sbflix.*","sbplay.*","sbrulz.*","seeeed.*","senda.pl","seriu.jp","sex3.com","sexvid.*","shopr.tv","short.pe","shrink.*","shtab.su","shtms.co","shush.se","slant.co","so1.asia","sport.de","sport.es","spox.com","sptfy.be","stern.de","strtpe.*","svapo.it","swdw.net","swzz.xyz","sxsw.com","sxyprn.*","t20cup.*","t7meel.*","tasma.ru","tbib.org","tele5.de","thegay.*","thekat.*","thoptv.*","tirexo.*","tmearn.*","tobys.dk","today.it","toggo.de","tokon.gg","trakt.tv","trend.at","trrs.pro","tubeon.*","tubidy.*","tv247.us","tvepg.eu","tvn24.pl","tvnet.lv","txst.com","udvl.com","upapk.io","uproxy.*","uqload.*","urbia.de","uvnc.com","v.qq.com","vanime.*","vapley.*","vedbam.*","vedbom.*","vembed.*","venge.io","vibe.com","vid4up.*","vidlo.us","vidlox.*","vidsrc.*","viki.com","vipbox.*","viper.to","viprow.*","virpe.cc","vlive.tv","voe.sx>>","voici.fr","voxfm.pl","vozer.io","vozer.vn","vtbe.net","vtmgo.be","vtube.to","vumoo.cc","vxxx.com","wat32.tv","watch.ug","wcofun.*","wcvb.com","webbro.*","wepc.com","wetter.*","wfmz.com","wkyc.com","woman.at","work.ink","wowtv.de","wp.solar","wplink.*","wttw.com","ww9g.com","wyze.com","x1337x.*","xcum.com","xh.video","xo7c.com","xvide.me","xxf.mobi","xxr.mobi","xxu.mobi","y2mate.*","yelp.com","yepi.com","youx.xxx","yporn.tv","yt1s.com","yt5s.com","ytapi.cc","ythd.org","z4h4.com","zbporn.*","zdrz.xyz","zee5.com","zooqle.*","zshort.*","0vg9r.com","10.com.au","10short.*","123link.*","123mf9.my","18xxx.xyz","1milf.com","1stream.*","2024tv.ru","26efp.com","2conv.com","2glho.org","2kmovie.*","2ndrun.tv","3dzip.org","3movs.com","49ers.com","4share.vn","4stream.*","4tube.com","51sec.org","5flix.top","5mgz1.com","5movies.*","6jlvu.com","7bit.link","7mm003.cc","7starhd.*","9anime.pe","9hentai.*","9xbuddy.*","9xmovie.*","a-o.ninja","a2zapk.io","abcya.com","acortar.*","adcorto.*","adsfly.in","adshort.*","adurly.cc","aduzz.com","afk.guide","agar.live","ah-me.com","aikatu.jp","airtel.in","alphr.com","ampav.com","andyday.*","anidl.org","anikai.to","animekb.*","animesa.*","anitube.*","aniwave.*","anizm.net","apkmb.com","apkmody.*","apl373.me","apl374.me","apl375.me","appdoze.*","appvn.com","aram.zone","arc018.to","arcai.com","art19.com","artru.net","asd.homes","atlaq.com","atomohd.*","awafim.tv","aylink.co","azel.info","azmen.com","azrom.net","bakai.org","bdlink.pw","beeg.fund","befap.com","bflix.*>>","bhplay.me","bibme.org","bigwarp.*","biqle.com","bitfly.io","bitlk.com","blackd.de","blkom.com","blog24.me","blogk.com","bmovies.*","boerse.de","bolly4u.*","boost.ink","brainly.*","btdig.com","buffed.de","busuu.com","c1z39.com","cambabe.*","cambb.xxx","cambro.io","cambro.tv","camcam.cc","camcaps.*","camhub.cc","canela.tv","canoe.com","casi3.xyz","ccurl.net","cda-hd.cc","cdn1.site","cdn77.org","cdrab.com","cfake.com","chatta.it","chyoa.com","cinema.de","cinetux.*","cl1ca.com","clamor.pl","cloudy.pk","cmovies.*","colts.com","comunio.*","ctrl.blog","curto.win","cutdl.xyz","cutty.app","cybar.xyz","czxxx.org","d000d.com","d0o0d.com","daddyhd.*","daybuy.tw","debgen.fr","dfast.app","dfiles.eu","dflinks.*","dhd24.com","djmaza.my","djstar.in","djx10.org","dlgal.com","do0od.com","do7go.com","domaha.tv","doods.pro","doooood.*","doply.net","dotflix.*","doviz.com","dropmms.*","dropzy.io","drrtyr.mx","drtuber.*","drzna.com","dumpz.net","dvdplay.*","dx-tv.com","dz4soft.*","eater.com","echoes.gr","efhjd.com","efukt.com","eg4link.*","egybest.*","egydead.*","eltern.de","embedme.*","embedy.me","embtaku.*","emovies.*","enorme.tv","entano.jp","eodev.com","erogen.su","erome.com","eroxxx.us","erzar.xyz","europix.*","evaki.fun","evo.co.uk","exego.app","eyalo.com","f16px.com","fabtcg.gg","fap16.net","fapnado.*","faps.club","fapxl.com","faselhd.*","fast-dl.*","fc-lc.com","feet9.com","femina.ch","ffjav.com","file4go.*","fileq.net","filma24.*","filmex.to","finfang.*","flixhd.cc","flixhq.ru","flixhq.to","flixhub.*","flixtor.*","flvto.biz","flyad.vip","fmj.co.uk","fmovies.*","fooak.com","forsal.pl","foundit.*","foxhq.com","freep.com","freewp.io","frembed.*","frprn.com","fshost.me","ftopx.com","ftuapps.*","fuqer.com","furher.in","fx-22.com","gahag.net","gayck.com","gayfor.us","gayxx.net","gdirect.*","ggjav.com","gifhq.com","giize.com","globo.com","glodls.to","gm-db.com","gmanga.me","gofile.to","gojo2.com","gomov.bio","gomoviz.*","goplay.su","gosemut.*","goshow.tv","gototub.*","goved.org","gowyo.com","goyabu.us","gplinks.*","gsdn.live","gsm1x.xyz","guum5.com","gvnvh.net","hanime.tv","happi.com","haqem.com","hax.co.id","hd-xxx.me","hdfilme.*","hdgay.net","hdhub4u.*","hdrez.com","hdss-to.*","heavy.com","hellnaw.*","hentai.tv","hh3dhay.*","hhesse.de","hianime.*","hideout.*","hitomi.la","hmt6u.com","hoca2.com","hoca6.com","hoerzu.de","hojii.net","hokej.net","hothit.me","hotmovs.*","hugo3c.tw","huyamba.*","hxfile.co","i-bits.io","ibooks.to","icdrama.*","iceporn.*","ico3c.com","idpvn.com","ihow.info","ihub.live","ikaza.net","ilinks.in","imeteo.sk","img4fap.*","imgmaze.*","imgrock.*","imgtown.*","imgur.com","imgview.*","imslp.org","ingame.de","intest.tv","inwepo.co","io.google","iobit.com","iprima.cz","iqiyi.com","ireez.com","isohunt.*","janjua.tv","jappy.com","japscan.*","jasmr.net","javbob.co","javboys.*","javcl.com","javct.net","javdoe.sh","javfor.tv","javfun.me","javhat.tv","javhd.*>>","javmix.tv","javpro.cc","javup.org","javwide.*","jkanime.*","jootc.com","kali.wiki","karwan.tv","katfile.*","keepvid.*","ki24.info","kick4ss.*","kickass.*","kicker.de","kinoger.*","kissjav.*","klmanga.*","koora.vip","krx18.com","kuyhaa.me","kzjou.com","l2db.info","l455o.com","lawyex.co","lecker.de","legia.net","lenkino.*","lesoir.be","linkfly.*","liveru.sx","ljcam.net","lkc21.net","lmtos.com","lnk.parts","loader.fo","loader.to","loawa.com","lodynet.*","lookcam.*","lootup.me","los40.com","m.kuku.lu","m4ufree.*","magma.com","magmix.jp","mamadu.pl","mangaku.*","manhwas.*","maniac.de","mapple.tv","marca.com","mavplay.*","mboost.me","mc-at.org","mcrypto.*","mega4up.*","merkur.de","messen.de","mgnet.xyz","mhn.quest","mihand.ir","milfnut.*","miniurl.*","mitele.es","mixdrop.*","mkvcage.*","mkvpapa.*","mlbbox.me","mlive.com","mmo69.com","mobile.de","mod18.com","momzr.com","mov2day.*","mp3clan.*","mp3fy.com","mp3spy.cc","mp3y.info","mrgay.com","mrjav.net","msic.site","multi.xxx","mxcity.mx","mynet.com","mz-web.de","nbabox.co","ncdnstm.*","nekopoi.*","netcine.*","neuna.net","news38.de","nhentai.*","niadd.com","nikke.win","nkiri.com","nknews.jp","notion.so","nowgg.lol","nozomi.la","npodoc.nl","nxxn.live","nyaa.land","nydus.org","oatuu.org","obsev.com","ocnpj.com","ofiii.com","ofppt.net","ohmymag.*","ok-th.com","okanime.*","okblaz.me","omavs.com","oosex.net","opjav.com","orunk.com","owlzo.com","pahe.plus","palabr.as","palimas.*","pasteit.*","pastes.io","pcwelt.de","pelis28.*","pepar.net","pferde.de","phodoi.vn","phois.pro","picrew.me","pixhost.*","pkembed.*","player.pl","plylive.*","pogga.org","popjav.in","poqzn.xyz","porn720.*","porner.tv","pornfay.*","pornhat.*","pornhub.*","pornj.com","pornlib.*","porno18.*","pornuj.cz","powvdeo.*","premio.io","profil.at","psarips.*","pugam.com","pussy.org","pynck.com","q1003.com","qcheng.cc","qcock.com","qlinks.eu","qoshe.com","quizz.biz","radio.net","rarbg.how","readm.org","redd.tube","redisex.*","redtube.*","redwap.me","remaxhd.*","rentry.co","rexporn.*","rexxx.org","rezst.xyz","rezsx.xyz","rfiql.com","riveh.com","rjno1.com","rock.porn","rokni.xyz","rooter.gg","rphost.in","rshrt.com","ruhr24.de","rytmp3.io","s2dfree.*","saint2.cr","samfw.com","satdl.com","sbnmp.bar","sbplay2.*","sbplay3.*","sbsun.com","scat.gold","seazon.fr","seelen.io","seexh.com","series9.*","seulink.*","sexmv.com","sexsq.com","sextb.*>>","sezia.com","sflix.pro","shape.com","shlly.com","shmapp.ca","shorten.*","shrdsk.me","shrib.com","shrinke.*","shrtfly.*","skardu.pk","skpb.live","skysetx.*","slate.com","slink.bid","smutr.com","son.co.za","songspk.*","spcdn.xyz","sport1.de","sssam.com","ssstik.io","staige.tv","strmup.cc","strmup.to","strmup.ws","strtape.*","study.com","swame.com","swgop.com","syosetu.*","sythe.org","szene1.at","talaba.su","tamilmv.*","taming.io","tatli.biz","tech5s.co","teensex.*","terabox.*","tgo-tv.co","themw.com","thgss.com","thothd.to","thothub.*","tinhte.vn","tnp98.xyz","to.com.pl","today.com","todaypk.*","tojav.net","topflix.*","topjav.tv","torlock.*","tpaste.io","tpayr.xyz","tpz6t.com","trutv.com","tryzt.xyz","tubev.sex","tubexo.tv","turbo1.co","tvguia.es","tvinfo.de","tvlogy.to","tvporn.cc","txori.com","txxx.asia","ucptt.com","udebut.jp","ufacw.com","uflash.tv","ujszo.com","ulsex.net","unicum.de","upbam.org","upfiles.*","upiapi.in","uplod.net","uporn.icu","upornia.*","uppit.com","uproxy2.*","upxin.net","upzone.cc","uqozy.com","urlcero.*","ustream.*","uxjvp.pro","v1kkm.com","vdtgr.com","vebo1.com","veedi.com","vg247.com","vid2faf.*","vidara.so","vidara.to","vidbm.com","vide0.net","videobb.*","vidfast.*","vidmoly.*","vidplay.*","vidsrc.cc","vidzy.org","vienna.at","vinaurl.*","vinovo.to","vip1s.top","vipurl.in","vivuq.com","vladan.fr","vnuki.net","voodc.com","vplink.in","vtlinks.*","vttpi.com","vvid30c.*","vvvvid.it","w3cub.com","waezg.xyz","waezm.xyz","webtor.io","wecast.to","weebee.me","wetter.de","wildwap.*","winporn.*","wiour.com","wired.com","woiden.id","world4.eu","wpteq.org","wvt24.top","x-tg.tube","x24.video","xbaaz.com","xbabe.com","xcafe.com","xcity.org","xcoic.com","xcums.com","xecce.com","xexle.com","xhand.com","xhbig.com","xmovies.*","xnxxw.net","xpaja.net","xtapes.me","xvideos.*","xvipp.com","xxx24.vip","xxxhub.cc","xxxxxx.hu","y2down.cc","yeptube.*","yeshd.net","ygosu.com","yjiur.xyz","ymovies.*","youku.com","younetu.*","youporn.*","yt2mp3s.*","ytmp3s.nu","ytpng.net","ytsaver.*","yu2be.com","zdnet.com","zedge.net","zefoy.com","zhihu.com","zjet7.com","zojav.com","zrozz.com","0gogle.com","0gomovie.*","10starhd.*","123anime.*","123chill.*","13tv.co.il","141jav.com","18tube.sex","1apple.xyz","1bit.space","1kmovies.*","1link.club","1stream.eu","1tamilmv.*","1todaypk.*","1xanime.in","222i8x.lol","2best.club","2the.space","2umovies.*","3fnews.com","3hiidude.*","3kmovies.*","3xyaoi.com","4-liga.com","4kporn.xxx","4porn4.com","4tests.com","4tube.live","5ggyan.com","5xmovies.*","720pflix.*","8boobs.com","8muses.xxx","8xmovies.*","91porn.com","96ar.com>>","9908ww.com","9animes.ru","9kmovies.*","9monate.de","9xmovies.*","9xupload.*","a1movies.*","acefile.co","acortalo.*","adshnk.com","adslink.pw","aeonax.com","aether.mom","afdah2.com","akmcloud.*","all3do.com","allfeeds.*","ameede.com","amindi.org","anchira.to","andani.net","anime4up.*","animedb.in","animeflv.*","animeid.tv","animekai.*","animesup.*","animetak.*","animez.org","anitube.us","aniwatch.*","aniwave.uk","anodee.com","anon-v.com","anroll.net","ansuko.net","antenne.de","anysex.com","apkhex.com","apkmaven.*","apkmody.io","arabseed.*","archive.fo","archive.is","archive.li","archive.md","archive.ph","archive.vn","arcjav.com","areadvd.de","aruble.net","ashrfd.xyz","ashrff.xyz","asiansex.*","asiaon.top","asmroger.*","ate9ni.com","atishmkv.*","atomixhq.*","atomtt.com","av-cdn.xyz","av01.media","avjosa.com","awpd24.com","axporn.com","ayuka.link","babeporn.*","baikin.net","bakotv.com","bandle.app","bang14.com","bayimg.com","bblink.com","bbw.com.es","bdokan.com","bdsmx.tube","bdupload.*","beatree.cn","beeg.party","beeimg.com","bembed.net","bestcam.tv","bf0skv.org","bigten.org","bildirim.*","bloooog.it","bluetv.xyz","bnnvara.nl","boards.net","boombj.com","borwap.xxx","bos21.site","boyfuck.me","brian70.tw","brides.com","brillen.de","brmovies.*","brstej.com","btvplus.bg","byrdie.com","bztube.com","calvyn.com","camflow.tv","camfox.com","camhoes.tv","camseek.tv","capital.de","cashkar.in","cavallo.de","cboard.net","cdn256.xyz","ceesty.com","cekip.site","cerdas.com","cgtips.org","chiefs.com","ciberdvd.*","cimanow.cc","cityam.com","citynow.it","ckxsfm.com","cluset.com","codare.fun","code.world","cola16.app","colearn.id","comtasq.ca","connect.de","cookni.net","cpscan.xyz","creatur.io","cricfree.*","cricfy.net","crictime.*","crohasit.*","csrevo.com","cuatro.com","cubshq.com","cuckold.it","cuevana.is","cuevana3.*","cutnet.net","cwseed.com","d0000d.com","ddownr.com","deezer.com","demooh.com","depedlps.*","desiflix.*","desimms.co","desired.de","destyy.com","dev2qa.com","dfbplay.tv","diaobe.net","disqus.com","djamix.net","djxmaza.in","dloady.com","dnevnik.hr","do-xxx.com","dogecoin.*","dojing.net","domahi.net","donk69.com","doodle.com","dopebox.to","dorkly.com","downev.com","dpstream.*","drivebot.*","driveup.in","drphil.com","dshytb.com","dsmusic.in","dtmaga.com","du-link.in","dvm360.com","dz4up1.com","earncash.*","earnload.*","easysky.in","ebony8.com","ebookmed.*","ebuxxx.net","edmdls.com","egyup.live","elmundo.es","embed.casa","embedv.net","emsnow.com","emurom.net","epainfo.pl","eplayvid.*","eplsite.uk","erofus.com","erotom.com","eroxia.com","evileaks.*","evojav.pro","ewybory.eu","exnion.com","express.de","f1livegp.*","f1stream.*","f2movies.*","fabmx1.com","fakaza.com","fake-it.ws","falpus.com","familie.de","fandom.com","fapcat.com","fapdig.com","fapeza.com","fapset.com","faqwiki.us","fautsy.com","fboxtv.com","fbstream.*","festyy.com","ffmovies.*","fhedits.in","fikfak.net","fikiri.net","fikper.com","filedown.*","filemoon.*","fileone.tv","filesq.net","film1k.com","film4e.com","filmi7.net","filmovi.ws","filmweb.pl","filmyfly.*","filmygod.*","filmyhit.*","filmypur.*","filmywap.*","finanzen.*","finclub.in","fitbook.de","flickr.com","flixbaba.*","flixhub.co","flybid.net","fmembed.cc","forgee.xyz","formel1.de","foxnxx.com","freeload.*","freenet.de","freevpn.us","friars.com","frogogo.ru","fsplayer.*","fstore.biz","fuckdy.com","fullreal.*","fulltube.*","fullxh.com","funzen.net","funztv.com","fuxnxx.com","fxporn69.*","fzmovies.*","gadgets.es","game5s.com","gamenv.net","gamepro.de","gatcha.org","gawbne.com","gaydam.net","gcloud.cfd","gdfile.org","gdmax.site","gdplayer.*","gestyy.com","giants.com","gifans.com","giff.cloud","gigaho.com","givee.club","gkbooks.in","gkgsca.com","gleaks.pro","gmenhq.com","gnomio.com","go.tlc.com","gocast.pro","gochyu.com","goduke.com","goeags.com","goegoe.net","gofilmes.*","goflix.sbs","gogodl.com","gogoplay.*","gogriz.com","gomovies.*","google.com","gopack.com","gostream.*","goutsa.com","gozags.com","gozips.com","gplinks.co","grasta.net","gtaall.com","gunauc.net","haddoz.net","hamburg.de","hamzag.com","hanauer.de","hanime.xxx","hardsex.cc","harley.top","hartico.tv","haustec.de","haxina.com","hcbdsm.com","hclips.com","hd-tch.com","hdfriday.*","hdporn.net","hdtoday.cc","hdtoday.tv","hdzone.org","health.com","hechos.net","hentaisd.*","hextank.io","hhkungfu.*","hianime.to","himovies.*","hitprn.com","hivelr.com","hl-live.de","hoca4u.com","hoca4u.xyz","hostxy.com","hotmasti.*","hotovs.com","house.porn","how2pc.com","howifx.com","hqbang.com","hub2tv.com","hubcdn.vip","hubdrive.*","huoqwk.com","hydracdn.*","icegame.ro","iceporn.tv","idevice.me","idlix.asia","idlixvip.*","igay69.com","illink.net","ilmeteo.it","imag-r.com","imgair.net","imgbox.com","imgbqb.sbs","imginn.com","imgmgf.sbs","imgpke.sbs","imguee.sbs","indeed.com","indobo.com","inertz.org","infulo.com","ingles.com","ipamod.com","iplark.com","ironysub.*","isgfrm.com","issuya.com","itdmusic.*","iumkit.net","iusm.co.kr","iwcp.co.uk","jakondo.ru","japgay.com","japscan.ws","jav-fun.cc","jav-xx.com","jav.direct","jav247.top","jav380.com","javbee.vip","javbix.com","javboys.tv","javbull.tv","javdo.cc>>","javembed.*","javfan.one","javfav.com","javfc2.xyz","javgay.com","javhdz.*>>","javhub.net","javhun.com","javibe.net","javlab.net","javmix.app","javmvp.com","javneon.tv","javnew.net","javopen.co","javpan.net","javpas.com","javplay.me","javqis.com","javrip.net","javroi.com","javseen.tv","javsek.net","jnews5.com","jobsbd.xyz","joktop.com","joolinks.*","josemo.com","jpgames.de","jpvhub.com","jrlinks.in","jvideo.xyz","jytechs.in","kaaltv.com","kaliscan.*","kamelle.de","kaotic.com","kaplog.com","katlinks.*","kedoam.com","keepvid.pw","kejoam.com","kelaam.com","kendam.com","kenzato.uk","kerapoxy.*","keroseed.*","key-hub.eu","kiaclub.cz","kickass2.*","kickasst.*","kickassz.*","king-pes.*","kinobox.cz","kinoger.re","kinoger.ru","kinoger.to","kjmx.rocks","kkickass.*","klooam.com","klyker.com","kochbar.de","kompas.com","kompiko.pl","kotaku.com","kropic.com","kvador.com","kxbxfm.com","l1afav.net","labgame.io","lacrima.jp","larazon.es","leeapk.com","leechall.*","leet365.cc","leolist.cc","lewd.ninja","lglbmm.com","lidovky.cz","likecs.com","line25.com","link1s.com","linkbin.me","linkpoi.me","linkshub.*","linkskat.*","linksly.co","linkspy.cc","linkz.wiki","liquor.com","listatv.pl","live7v.com","livehere.*","livetvon.*","lollty.pro","lookism.me","lootdest.*","lopers.com","lorcana.gg","love4u.net","loveroms.*","lumens.com","lustich.de","lxmanga.my","m2list.com","macwelt.de","magnetdl.*","mahfda.com","mandai.com","mangago.me","mangaraw.*","mangceh.cc","manwan.xyz","mascac.org","mat6tube.*","mathdf.com","maths.news","maxicast.*","medibok.se","megadb.net","megadede.*","megaflix.*","megafly.in","megalink.*","megaup.net","megaurl.in","megaxh.com","meltol.net","meong.club","merinfo.se","mhdtvmax.*","milfzr.com","mitaku.net","mixdroop.*","mlbb.space","mma-core.*","mmnm.store","mmopeon.ru","mmtv01.xyz","molotov.tv","mongri.net","motchill.*","movibd.com","movie123.*","movie4me.*","moviegan.*","moviehdf.*","moviemad.*","movies07.*","movies2k.*","movies4u.*","movies7.to","moviflex.*","movix.blog","mozkra.com","mp3cut.net","mp3guild.*","mp3juice.*","mreader.co","mrpiracy.*","mtlurb.com","mult34.com","multics.eu","multiup.eu","multiup.io","multiup.us","musichq.cc","my-subs.co","mydaddy.cc","myjest.com","mykhel.com","mylust.com","myplexi.fr","myqqjd.com","myvideo.ge","myviid.com","naasongs.*","nackte.com","naijal.com","nakiny.com","namasce.pl","namemc.com","nbabite.to","nbaup.live","ncdnx3.xyz","negumo.com","neonmag.fr","neoteo.com","neowin.net","netfree.cc","newhome.de","newpelis.*","news18.com","newser.com","nexdrive.*","nflbite.to","ngelag.com","ngomek.com","ngomik.net","nhentai.io","nickles.de","niyaniya.*","nmovies.cc","noanyi.com","nocfsb.com","nohost.one","nosteam.ro","note1s.com","notube.com","novinky.cz","noz-cdn.de","nsfw247.to","nswrom.com","ntucgm.com","nudes7.com","nullpk.com","nuroflix.*","nxbrew.net","nxprime.in","nypost.com","odporn.com","odtmag.com","ofwork.net","ohorse.com","ohueli.net","okleak.com","okmusi.com","okteve.com","onehack.us","oneotv.com","onepace.co","onepunch.*","onezoo.net","onloop.pro","onmovies.*","onmsft.com","onvista.de","openload.*","oploverz.*","origami.me","orirom.com","otomoto.pl","owsafe.com","paminy.com","papafoot.*","parents.at","pbabes.com","pc-guru.it","pcbeta.com","pcgames.de","pctfenix.*","pcworld.es","pdfaid.com","peetube.cc","people.com","petbook.de","phc.web.id","phim85.com","picmsh.sbs","pictoa.com","pilsner.nu","pingit.com","pirlotv.mx","pixelio.de","plaion.com","planhub.ca","playboy.de","playfa.com","playgo1.cc","plc247.com","poapan.xyz","pondit.xyz","poophq.com","popcdn.day","poplinks.*","poranny.pl","porn00.org","porndr.com","pornfd.com","porngo.com","porngq.com","pornhd.com","pornhd8k.*","pornky.com","porntb.com","porntn.com","pornve.com","pornwex.tv","pornx.tube","pornxp.com","pornxp.org","pornxs.com","pouvideo.*","povvideo.*","povvldeo.*","povw1deo.*","povwideo.*","powlideo.*","powv1deo.*","powvibeo.*","powvideo.*","powvldeo.*","premid.app","progfu.com","prosongs.*","proxybit.*","proxytpb.*","prydwen.gg","psychic.de","pudelek.pl","puhutv.com","putlog.net","qqxnxx.com","qrixpe.com","qthang.net","quicomo.it","radio.zone","raenonx.cc","rakuten.tv","ranker.com","rawinu.com","rawlazy.si","realgm.com","rebahin.pw","redfea.com","redgay.net","reeell.com","regio7.cat","rencah.com","reshare.pm","rgeyyddl.*","rgmovies.*","riazor.org","rlxoff.com","rmdown.com","roblox.com","rodude.com","romsget.io","ronorp.net","roshy.tv>>","routech.ro","rsrlink.in","rule34.art","rule34.xxx","rule34.xyz","rule34ai.*","rumahit.id","s1p1cd.com","s2dfree.to","s3taku.com","sakpot.com","samash.com","savego.org","sawwiz.com","sbrity.com","sbs.com.au","scribd.com","sctoon.net","scubidu.eu","seeflix.to","serien.cam","seriesly.*","sevenst.us","sexato.com","sexjobs.es","sexkbj.com","sexlist.tv","sexodi.com","sexpin.net","sexpox.com","sexrura.pl","sextor.org","sextvx.com","sfile.mobi","shahid4u.*","shinden.pl","shineads.*","shlink.net","sholah.net","shorttey.*","shortx.net","shortzzy.*","showflix.*","shrinkme.*","shrt10.com","sibtok.com","sikwap.xyz","silive.com","simpcity.*","skmedix.pl","smoner.com","smsget.net","snbc13.com","snopes.com","snowmtl.ru","soap2day.*","socebd.com","sokobj.com","solewe.com","sombex.com","sourds.net","soy502.com","spiegel.de","spielen.de","sportal.de","sportbar.*","sports24.*","srvy.ninja","ssdtop.com","sshkit.com","ssyou.tube","stardima.*","stemplay.*","stiletv.it","stpm.co.uk","strcloud.*","streamsb.*","streamta.*","strefa.biz","sturls.com","suaurl.com","sumoweb.to","sunhope.it","szene38.de","tapetus.pl","target.com","taxi69.com","tcpvpn.com","tech8s.net","techhx.com","telerium.*","terafly.me","texte.work","th-cam.com","thatav.net","theacc.com","thecut.com","thedaddy.*","theproxy.*","thevidhd.*","thevouz.in","thosa.info","thothd.com","thripy.com","tickzoo.tv","tiscali.it","tktube.com","tokuvn.com","tokuzl.net","toorco.com","topito.com","toppng.com","torlock2.*","torrent9.*","tr3fit.xyz","tranny.one","trust.zone","trzpro.com","tsubasa.im","tsz.com.np","tubesex.me","tubous.com","tubsexer.*","tubtic.com","tugaflix.*","tulink.org","tumblr.com","tunein.com","turbovid.*","tutelehd.*","tutsnode.*","tutwuri.id","tuxnews.it","tv0800.com","tvline.com","tvnz.co.nz","tvtoday.de","twatis.com","uctnew.com","uindex.org","uiporn.com","unito.life","uol.com.br","up-load.io","upbaam.com","updato.com","updown.cam","updown.fun","updown.icu","upfion.com","upicsz.com","uplinkto.*","uploadev.*","uploady.io","uporno.xxx","uprafa.com","ups2up.fun","upskirt.tv","uptobhai.*","uptomega.*","urlpay.net","usagoals.*","userload.*","usgate.xyz","usnews.com","ustimz.com","ustream.to","utreon.com","uupbom.com","vadbam.com","vadbam.net","vadbom.com","vbnmll.com","vcloud.lol","vdbtm.shop","vecloud.eu","veganab.co","veplay.top","vevioz.com","vgames.fun","vgmlinks.*","vidapi.xyz","vidbam.org","vidcloud.*","vidcorn.to","vidembed.*","videyx.cam","videzz.net","vidlii.com","vidnest.io","vidohd.com","vidomo.xyz","vidoza.net","vidply.com","viewfr.com","vinomo.xyz","vipboxtv.*","vipotv.com","vipstand.*","vivatube.*","vizcloud.*","vortez.net","vrporn.com","vvide0.com","vvtlinks.*","wapkiz.com","warps.club","watch32.sx","watch4hd.*","watcho.com","watchug.to","watchx.top","wawacity.*","weather.us","web1s.asia","webcafe.bg","weloma.art","weshare.is","weszlo.com","wetter.com","wetter3.de","wikwiki.cv","wintub.com","woiden.com","wooflix.tv","woxikon.de","ww9g.com>>","www.cc.com","x-x-x.tube","xanimu.com","xasiat.com","xberuang.*","xhamster.*","xhopen.com","xhspot.com","xhtree.com","xhvid1.com","xiaopan.co","xmorex.com","xmovie.pro","xmovies8.*","xnxx.party","xpicse.com","xprime4u.*","xrares.com","xsober.com","xspiel.com","xsz-av.com","xszav.club","xvideis.cc","xxgasm.com","xxmovz.com","xxxdan.com","xxxfiles.*","xxxmax.net","xxxrip.net","xxxsex.pro","xxxtik.com","xxxtor.com","xxxxsx.com","y-porn.com","y2mate.com","y2tube.pro","ygozone.gg","ymknow.xyz","yomovies.*","youapk.net","youmath.it","youpit.xyz","youwatch.*","yseries.tv","ytanime.tv","ytboob.com","ytjar.info","ytmp4.live","yts-subs.*","yumacs.com","yuppow.com","yuvutu.com","yy1024.net","z12z0vla.*","zeefiles.*","zenless.gg","zilinak.sk","zillow.com","zoechip.cc","zoechip.gg","zpaste.net","zthots.com","0123movie.*","0gomovies.*","0rechner.de","10alert.com","111watcho.*","11xmovies.*","123animes.*","123movies.*","12thman.com","141tube.com","173.249.8.3","17track.net","18comic.vip","1movieshd.*","1xanimes.in","2gomovies.*","2rdroid.com","3bmeteo.com","3dyasan.com","3hentai.net","3ixcf45.cfd","3xfaktor.hu","423down.com","4funbox.com","4gousya.net","4players.de","4shared.com","4spaces.org","4tymode.win","5j386s9.sbs","69games.xxx","76078rb.sbs","7review.com","7starmv.com","80-talet.se","8tracks.com","9animetv.to","9goals.live","9jarock.org","a-hentai.tv","aagmaal.com","abs-cbn.com","abstream.to","ad-doge.com","ad4msan.com","adictox.com","adisann.com","adshrink.it","afilmywap.*","africue.com","afrodity.sk","ahmedmode.*","aiailah.com","aipebel.com","akirabox.to","allkpop.com","almofed.com","almursi.com","altcryp.com","alttyab.net","analdin.com","anavidz.com","andiim3.com","anibatch.me","anichin.top","anigogo.net","animahd.com","anime-i.com","anime3d.xyz","animeblix.*","animebr.org","animehay.tv","animehub.ac","animepahe.*","animesex.me","anisaga.org","anitube.vip","aniworld.to","anomize.xyz","anonymz.com","anqkdhcm.nl","anxcinema.*","anyporn.com","anysex.club","aofsoru.com","aosmark.com","apekite.com","apkdink.com","apkhihe.com","apkshrt.com","apksvip.com","aplus.my.id","app.plex.tv","apritos.com","aquipelis.*","arabstd.com","arabxnx.com","arbweb.info","area51.porn","arenabg.com","arkadmin.fr","artnews.com","asia2tv.com","asianal.xyz","asianclub.*","asiangay.tv","asianload.*","asianplay.*","ask4movie.*","asmr18.fans","asmwall.com","asumesi.com","ausfile.com","auszeit.bio","autobild.de","autokult.pl","automoto.it","autopixx.de","autoroad.cz","autosport.*","avcesar.com","avitter.net","avjamak.net","axomtube.in","ayatoon.com","azmath.info","b2bhint.com","b4ucast.com","babaktv.com","babeswp.com","babyclub.de","badjojo.com","badtaste.it","barfuck.com","batman.city","bbwfest.com","bcmanga.com","bdcraft.net","bdmusic23.*","bdmusic28.*","bdsmporn.cc","beelink.pro","beinmatch.*","bengals.com","berich8.com","berklee.edu","bfclive.com","bg-gledai.*","bi-girl.net","bigconv.com","bigojav.com","bigshare.io","bigwank.com","bitco.world","bitlinks.pw","bitzite.com","blog4nx.com","blogue.tech","blu-ray.com","blurayufr.*","bokepxv.com","bolighub.dk","bollyflix.*","book18.fans","bootdey.com","botrix.live","bowfile.com","boxporn.net","brbeast.com","brbushare.*","brigitte.de","bristan.com","bsierad.com","btcbitco.in","btvsport.bg","btvsports.*","buondua.com","buzzfeed.at","buzzfeed.de","buzzpit.net","bx-zone.com","bypass.city","bypass.link","cafenau.com","camclips.tv","camel3.live","camsclips.*","camslib.com","camwhores.*","canaltdt.es","carbuzz.com","ccyig2ub.nl","ch-play.com","chatgbt.one","chatgpt.com","chefkoch.de","chicoer.com","chochox.com","cima-club.*","cinedesi.in","civitai.com","claimrbx.gg","clapway.com","clkmein.com","club386.com","cocorip.net","coldfrm.org","collater.al","colnect.com","comicxxx.eu","commands.gg","comnuan.com","comohoy.com","converto.io","corneey.com","corriere.it","cpmlink.net","cpmlink.pro","crackle.com","crazydl.net","crdroid.net","crvsport.ru","csurams.com","cubuffs.com","cuevana.pro","cupra.forum","cut-fly.com","cutearn.net","cutlink.net","cutpaid.com","cutyion.com","daddyhd.*>>","daddylive.*","daftsex.biz","daftsex.net","daftsex.org","daij1n.info","dailyweb.pl","daozoid.com","dawenet.com","ddlvalley.*","decrypt.day","deltabit.co","devotag.com","dexerto.com","digit77.com","digitask.ru","direct-dl.*","discord.com","disheye.com","diudemy.com","divxtotal.*","dj-figo.com","djqunjab.in","dlpanda.com","dma-upd.org","dogdrip.net","dogtime.com","donlego.com","dotycat.com","doumura.com","douploads.*","downsub.com","dozarte.com","dramacool.*","dramamate.*","dramanice.*","drawize.com","droplink.co","ds2play.com","dsharer.com","dsvplay.com","dudefilms.*","dz4link.com","e-glossa.it","e2link.link","e9china.net","earnbee.xyz","earnhub.net","easy-coin.*","easybib.com","ebookdz.com","echiman.com","echodnia.eu","ecomento.de","edjerba.com","eductin.com","einthusan.*","elahmad.com","elfqrin.com","elliott.org","embasic.pro","embedmoon.*","embedpk.net","embedtv.net","empflix.com","emuenzen.de","enagato.com","endfield.gg","eoreuni.com","eporner.com","eroasmr.com","erothots.co","erowall.com","esgeeks.com","eshentai.tv","eskarock.pl","eslfast.com","europixhd.*","everand.com","everia.club","everyeye.it","exalink.fun","exeking.top","ezmanga.net","f2movies.to","f51rm.com>>","fapdrop.com","fapguru.com","faptube.com","farescd.com","fastdokan.*","fastream.to","fastssh.com","fbstreams.*","fchopin.net","fdvzg.world","feyorra.top","fffmovies.*","figtube.com","file-up.org","file4go.com","file4go.net","filecloud.*","filecrypt.*","filelions.*","filemooon.*","filepress.*","fileq.games","filesamba.*","filesus.com","filmcdn.top","filmisub.cc","films5k.com","filmy-hit.*","filmy4web.*","filmydown.*","filmygod6.*","findjav.com","firefile.cc","fit4art.com","flixrave.me","flixsix.com","fluentu.com","fluvore.com","fmovies0.cc","folkmord.se","foodxor.com","footybite.*","forumdz.com","foumovies.*","foxtube.com","fplzone.com","freenem.com","freepik.com","frpgods.com","fseries.org","fsx.monster","ftuapps.dev","fuckfuq.com","futemax.zip","g-porno.com","gal-dem.com","gamcore.com","game-2u.com","game3rb.com","gameblog.in","gameblog.jp","gamehub.cam","gamelab.com","gamer18.net","gamestar.de","gameswelt.*","gametop.com","gamewith.jp","gamezone.de","gamezop.com","garaveli.de","gaytail.com","gayvideo.me","gazzetta.gr","gazzetta.it","gcloud.live","gedichte.ws","genialne.pl","get-to.link","getmega.net","getthit.com","gevestor.de","gezondnu.nl","ggbases.com","girlmms.com","girlshd.xxx","gisarea.com","gitizle.vip","gizmodo.com","globetv.app","go.zovo.ink","goalup.live","gobison.com","gocards.com","gocast2.com","godeacs.com","godmods.com","godtube.com","goducks.com","gofilms4u.*","gofrogs.com","gogifox.com","gogoanime.*","goheels.com","gojacks.com","gokerja.net","gold-24.net","golobos.com","gomovies.pk","gomoviesc.*","goodporn.to","gooplay.net","gorating.in","gosexy.mobi","gostyn24.pl","goto.com.np","gotocam.net","gotporn.com","govexec.com","gpldose.com","grafikos.cz","gsmware.com","guhoyas.com","gulf-up.com","h-flash.com","haaretz.com","hagalil.com","hagerty.com","hardgif.com","hartziv.org","haxmaps.com","haxnode.net","hblinks.pro","hdbraze.com","hdeuropix.*","hdmotori.it","hdonline.co","hdpicsx.com","hdpornt.com","hdtodayz.to","hdtube.porn","helmiau.com","hentai20.io","hentaila.tv","herexxx.com","herzporno.*","hes-goals.*","hexload.com","hhdmovies.*","himovies.sx","hindi.trade","hiphopa.net","history.com","hitokin.net","hmanga.asia","holavid.com","hoofoot.net","hoporno.net","hornpot.net","hornyfap.tv","hotabis.com","hotbabes.tv","hotcars.com","hotfm.audio","hotgirl.biz","hotleak.vip","hotleaks.tv","hotscope.tv","hotscopes.*","hotshag.com","hotstar.com","howchoo.com","hubdrive.de","hubison.com","hubstream.*","hubzter.com","hungama.com","hurawatch.*","huskers.com","huurshe.com","hwreload.it","hygiena.com","hypesol.com","icgaels.com","idlixku.com","iegybest.co","iframejav.*","iggtech.com","iimanga.com","iklandb.com","imageweb.ws","imgbvdf.sbs","imgjjtr.sbs","imgnngr.sbs","imgoebn.sbs","imgoutlet.*","imgtaxi.com","imgyhq.shop","impact24.us","in91vip.win","infocorp.io","infokik.com","inkapelis.*","instyle.com","inverse.com","ipa-apps.me","iporntv.net","iptvbin.com","isaimini.ca","isosite.org","ispunlock.*","itpro.co.uk","itudong.com","iv-soft.com","j-pussy.com","jaguars.com","jaiefra.com","japanfuck.*","japanporn.*","japansex.me","japscan.lol","javbake.com","javball.com","javbest.xyz","javbobo.com","javboys.com","javcock.com","javdoge.com","javfull.net","javgrab.com","javhoho.com","javideo.net","javlion.xyz","javmenu.com","javmeta.com","javmilf.xyz","javpool.com","javsex.guru","javstor.com","javx357.com","javynow.com","jcutrer.com","jeep-cj.com","jetanimes.*","jetpunk.com","jezebel.com","jixo.online","jjang0u.com","jkanime.net","jnovels.com","jobsibe.com","jocooks.com","jotapov.com","jpg.fishing","jra.jpn.org","jungyun.net","jxoplay.xyz","karanpc.com","kashtanka.*","kb.arlo.com","khohieu.com","kiaporn.com","kickassgo.*","kiemlua.com","kimoitv.com","kinoking.cc","kissanime.*","kissasia.cc","kissasian.*","kisscos.net","kissmanga.*","kjanime.net","klettern.de","kmansin09.*","kochamjp.pl","kodaika.com","kolyoom.com","komikcast.*","kompoz2.com","kpkuang.org","kppk983.com","ksuowls.com","l23movies.*","l2crypt.com","labstory.in","laposte.net","lapresse.ca","lastampa.it","latimes.com","latitude.to","lbprate.com","leaknud.com","letest25.co","letras2.com","lewdweb.net","lewebde.com","lfpress.com","lgcnews.com","lgwebos.com","libertyvf.*","lifeline.de","liflix.site","ligaset.com","likemag.com","linclik.com","link-to.net","linkmake.in","linkrex.net","links-url.*","linksfire.*","linkshere.*","linksmore.*","lite-link.*","loanpapa.in","lokalo24.de","lookimg.com","lookmovie.*","losmovies.*","losporn.org","lostineu.eu","lovefap.com","lrncook.xyz","lscomic.com","luluvdo.com","luluvid.com","luxmovies.*","m.akkxs.net","m.iqiyi.com","m1xdrop.com","m1xdrop.net","m4maths.com","made-by.org","madoohd.com","madouqu.com","magesypro.*","manga1000.*","manga1001.*","mangahub.io","mangasail.*","manhwa18.cc","maths.media","mature4.net","mavanimes.*","mavavid.com","maxstream.*","mcdlpit.com","mchacks.net","mcloud.guru","mcxlive.org","medisite.fr","mega1080p.*","megafile.io","megavideo.*","mein-mmo.de","melodelaa.*","mephimtv.cc","mercari.com","messitv.net","messitv.org","metavise.in","mgoblue.com","mhdsports.*","mhscans.com","miklpro.com","mirrorace.*","mirrored.to","mlbstream.*","mmfenix.com","mmsmaza.com","mobifuq.com","moenime.com","momluck.com","momomesh.tv","momondo.com","momvids.com","moonembed.*","moonmov.pro","motohigh.pl","moviebaaz.*","movied.link","movieku.ink","movieon21.*","movieplay.*","movieruls.*","movierulz.*","movies123.*","movies4me.*","movies4u3.*","moviesda4.*","moviesden.*","movieshub.*","moviesjoy.*","moviesmod.*","moviesmon.*","moviesub.is","moviesx.org","moviewr.com","moviezwap.*","movizland.*","mp3-now.com","mp3juices.*","mp3yeni.org","mp4moviez.*","mpo-mag.com","mr9soft.com","mrunblock.*","mtb-news.de","mtlblog.com","muchfap.com","multiup.org","muthead.com","muztext.com","mycloudz.cc","myflixerz.*","mygalls.com","mymp3song.*","mytoolz.net","myunity.dev","myvalley.it","myvidmate.*","myxclip.com","narcity.com","nbabox.co>>","nbastream.*","nbch.com.ar","nbcnews.com","needbux.com","needrom.com","nekopoi.*>>","nelomanga.*","nemenlake.*","netfapx.com","netflix.com","netfuck.net","netplayz.ru","netxwatch.*","netzwelt.de","news.com.au","newscon.org","newsmax.com","nextgov.com","nflbite.com","nflstream.*","nhentai.net","nhlstream.*","nicekkk.com","nichapk.com","nimegami.id","nkreport.jp","notandor.cn","novelism.jp","novohot.com","novojoy.com","nowiny24.pl","nowmovies.*","nrj-play.fr","nsfwr34.com","nudevista.*","nulakers.ca","nunflix.org","nyahentai.*","nysainfo.pl","odiasia.sbs","ofilmywap.*","ogomovies.*","ohentai.org","ohmymag.com","okstate.com","olamovies.*","olarila.com","omuzaani.me","onepiece.gg","onhockey.tv","onifile.com","onneddy.com","ontools.net","onworks.net","optimum.net","ortograf.pl","osxinfo.net","otakudesu.*","otakuindo.*","outletpic.*","overgal.com","overtake.gg","ovester.com","oxanime.com","p2pplay.pro","packers.com","pagesix.com","paketmu.com","pantube.top","papahd.club","papalah.com","paradisi.de","parents.com","parispi.net","pasokau.com","paste1s.com","payskip.org","pcbolsa.com","pcgamer.com","pdfdrive.to","pdfsite.net","pelisplus.*","peppe8o.com","perelki.net","pesktop.com","pewgame.com","pezporn.com","phim1080.in","pianmanga.*","picbqqa.sbs","picnft.shop","picngt.shop","picuenr.sbs","pinkporno.*","pinterest.*","piratebay.*","pistona.xyz","pitiurl.com","pixjnwe.sbs","pixsera.net","pksmovies.*","pkspeed.net","play.tv3.ee","play.tv3.lt","play.tv3.lv","playrust.io","playtamil.*","playtube.tv","plus.rtl.de","pngitem.com","pngreal.com","pogolinks.*","polygon.com","pomorska.pl","porcore.com","porn3dx.com","porn77.info","porn78.info","porndaa.com","porndex.com","porndig.com","porndoe.com","porndude.tv","porngem.com","porngun.net","pornhex.com","pornhub.com","pornium.net","pornkai.com","pornken.com","pornkino.cc","pornktube.*","pornmam.com","pornmom.net","porno-365.*","pornoman.pl","pornomoll.*","pornone.com","pornovka.cz","pornpaw.com","pornsai.com","porntin.com","porntry.com","pornult.com","poscitech.*","povvvideo.*","powstream.*","powstreen.*","primewire.*","prisjakt.no","promobil.de","pronpic.org","pulpo69.com","pupuweb.com","purplex.app","putlocker.*","pvip.gratis","qdembed.com","quizack.com","quizlet.com","radamel.icu","raiders.com","rainanime.*","raw1001.net","rawkuma.com","rawkuma.net","rawkuro.net","readfast.in","readmore.de","redgifs.com","redlion.net","redporno.cz","redtub.live","redvido.com","redwap2.com","redwap3.com","reifporn.de","rekogap.xyz","repelis.net","repelisgt.*","repelishd.*","repelisxd.*","repicsx.com","resetoff.pl","rethmic.com","retrotv.org","reuters.com","reverso.net","riedberg.tv","rimondo.com","rl6mans.com","rlshort.com","roadbike.de","rocklink.in","romfast.com","romsite.org","romviet.com","rphangx.net","rpmplay.xyz","rpupdate.cc","rsgamer.app","rubystm.com","rubyvid.com","rugby365.fr","runmods.com","ryxy.online","s0ft4pc.com","saekita.com","safelist.eu","sandrives.*","sankaku.app","sansat.link","sararun.net","sat1gold.de","satcesc.com","savelinks.*","savemedia.*","savetub.com","sbbrisk.com","sbchill.com","scenedl.org","scenexe2.io","schadeck.eu","scripai.com","sdefx.cloud","seclore.com","secuhex.com","see-xxx.com","semawur.com","sembunyi.in","sendvid.com","seoworld.in","serengo.net","serially.it","seriemega.*","seriesflv.*","seselah.com","sexavgo.com","sexdiaryz.*","sexemix.com","sexetag.com","sexmoza.com","sexpuss.org","sexrura.com","sexsaoy.com","sexuhot.com","sexygirl.cc","shaheed4u.*","sharclub.in","sharedisk.*","sharing.wtf","shavetape.*","shortearn.*","shrinkus.tk","shrlink.top","simsdom.com","siteapk.net","sitepdf.com","sixsave.com","smplace.com","snaptik.app","socks24.org","soft112.com","softrop.com","solobari.it","soninow.com","sosuroda.pl","soundpark.*","souqsky.net","southpark.*","spambox.xyz","spankbang.*","speedporn.*","spinbot.com","sporcle.com","sport365.fr","sportbet.gr","sportcast.*","sportlive.*","sportshub.*","spycock.com","srcimdb.com","ssoap2day.*","ssrmovies.*","staaker.com","stagatv.com","starmusiq.*","steamplay.*","steanplay.*","sterham.net","stickers.gg","stmruby.com","strcloud.in","streamcdn.*","streamed.su","streamers.*","streamhoe.*","streamhub.*","streamio.to","streamm4u.*","streamup.ws","strikeout.*","subdivx.com","subedlc.com","submilf.com","subsvip.com","sukuyou.com","sundberg.ws","sushiscan.*","swatalk.com","t-online.de","tabootube.*","tagblatt.ch","takimag.com","tamilyogi.*","tandess.com","taodung.com","tattle.life","tcheats.com","tdtnews.com","teachoo.com","teamkong.tk","techbook.de","techforu.in","technews.tw","tecnomd.com","telenord.it","telorku.xyz","teltarif.de","tempr.email","terabox.fun","teralink.me","testedich.*","texw.online","thapcam.net","thaript.com","thelanb.com","therams.com","theroot.com","thestar.com","thisvid.com","thotcity.su","thotporn.tv","thotsbay.tv","threads.com","threads.net","tidymom.net","tikmate.app","tinys.click","titantv.com","tnaflix.com","todaypktv.*","tonspion.de","toolxox.com","toonanime.*","toonily.com","topembed.pw","topgear.com","topmovies.*","topshare.in","topsport.bg","totally.top","toxicwap.us","trahino.net","tranny6.com","trgtkls.org","tribuna.com","trickms.com","trilog3.net","tromcap.com","trxking.xyz","tryvaga.com","ttsfree.com","tubator.com","tube18.sexy","tuberel.com","tubsxxx.com","turkanime.*","turkmmo.com","tutflix.org","tutvlive.ru","tv-media.at","tv.bdix.app","tvableon.me","tvseries.in","tw-calc.net","twitchy.com","twitter.com","ubbulls.com","ucanwatch.*","ufcstream.*","uhdmovies.*","uiiumovie.*","uknip.co.uk","umterps.com","unblockit.*","unixmen.com","uozzart.com","updown.link","upfiles.app","uploadbaz.*","uploadhub.*","uploadrar.*","upns.online","uproxy2.biz","uprwssp.org","upstore.net","upstream.to","uptime4.com","uptobox.com","urdubolo.pk","usfdons.com","usgamer.net","ustvgo.live","uyeshare.cc","v2movies.me","v6embed.xyz","vague.style","variety.com","vaughn.live","vectorx.top","vedshar.com","vegamovie.*","ver-pelis.*","verizon.com","vexfile.com","vexmovies.*","vf-film.net","vgamerz.com","vidbeem.com","vidcloud9.*","videezy.com","vidello.net","videovard.*","videoxxx.cc","videplay.us","videq.cloud","vidfast.pro","vidlink.pro","vidload.net","vidshar.org","vidshare.tv","vidspeed.cc","vidstream.*","vidtube.one","vikatan.com","vikings.com","vip-box.app","vipifsa.com","vipleague.*","vipracing.*","vipstand.se","viptube.com","virabux.com","visalist.io","visible.com","viva100.com","vixcloud.co","vizcloud2.*","vkprime.com","voirfilms.*","voyeurhit.*","vrcmods.com","vstdrive.in","vulture.com","vvtplayer.*","vw-page.com","w.grapps.me","waploaded.*","watchfree.*","watchmdh.to","watchporn.*","wavewalt.me","wayfair.com","wcostream.*","weadown.com","weather.com","webcras.com","webfail.com","webmaal.cfd","webtoon.xyz","weights.com","wetsins.com","weviral.org","wgzimmer.ch","why-tech.it","wildwap.com","winshell.de","wintotal.de","wmovies.xyz","woffxxx.com","wonporn.com","wowroms.com","wupfile.com","wvt.free.nf","www.msn.com","x-x-x.video","x.ag2m2.cfd","xemales.com","xflixbd.com","xforum.live","xfreehd.com","xgroovy.com","xhamster.fm","xhamster1.*","xhamster2.*","xhamster3.*","xhamster4.*","xhamster5.*","xhamster7.*","xhamster8.*","xhmoon5.com","xhreal2.com","xhreal3.com","xhtotal.com","xhwide1.com","xhwide2.com","xhwide5.com","xmateur.com","xmovies08.*","xnxxcom.xyz","xozilla.xxx","xpicu.store","xpornzo.com","xpshort.com","xsanime.com","xubster.com","xvideos.com","xx.knit.bid","xxxmomz.com","xxxmovies.*","xztgl.com>>","y-2mate.com","y2meta.mobi","yalifin.xyz","yamsoti.com","yesmovies.*","yestech.xyz","yifysub.net","ymovies.vip","yomovies1.*","yoshare.net","youshort.me","youtube.com","yoxplay.xyz","yt1s.com.co","yt2conv.com","ytmp3cc.net","ytsubme.com","yumeost.net","z9sayu0m.nl","zedporn.com","zemporn.com","zerioncc.pl","zerogpt.com","zetporn.com","ziperto.com","zlpaste.net","zoechip.com","zyromod.com","0123movies.*","0cbcq8mu.com","0l23movies.*","0ochi8hp.com","10-train.com","1024tera.com","103.74.5.104","123-movies.*","1234movies.*","123animes.ru","123moviesc.*","123moviess.*","123unblock.*","1340kbbr.com","16honeys.com","185.53.88.15","18tubehd.com","1fichier.com","1madrasdub.*","1nmnozg1.fun","1primewire.*","2017tube.com","2btmc2r0.fun","2cf0xzdu.com","2fb9tsgn.fun","2madrasdub.*","3a38xmiv.fun","3gaytube.com","45.86.86.235","456movie.com","4archive.org","4bct9.live>>","4edtcixl.xyz","4fansites.de","4k2h4w04.xyz","4live.online","4movierulz.*","56m605zk.fun","5moviess.com","720pstream.*","723qrh1p.fun","7hitmovies.*","8mhlloqo.fun","8rm3l0i9.fun","8teenxxx.com","a6iqb4m8.xyz","ablefast.com","aboedman.com","absoluporn.*","abysscdn.com","acapellas.eu","adbypass.org","adcrypto.net","addonbiz.com","adsurfle.com","adultfun.net","aegeanews.gr","afl3ua5u.xyz","afreesms.com","airliners.de","akinator.com","akirabox.com","alcasthq.com","alexsports.*","aliancapes.*","allcalidad.*","alliptvs.com","allmusic.com","allosurf.net","alotporn.com","alphatron.tv","alrincon.com","alternet.org","amateur8.com","amnaymag.com","amtil.com.au","amyscans.com","androidaba.*","anhdep24.com","anime-jl.net","anime3rb.com","animefire.io","animeflv.net","animefreak.*","animesanka.*","animeunity.*","animexin.vip","animixplay.*","aninavi.blog","anisubindo.*","anmup.com.np","annabelle.ch","antiadtape.*","antonimos.de","anybunny.com","apetube.asia","apkcombo.com","apkdrill.com","apkmodhub.in","apkprime.org","apkship.shop","apkupload.in","apnablogs.in","app.vaia.com","appsbull.com","appsmodz.com","aranzulla.it","arcaxbydz.id","arkadium.com","arolinks.com","aroratr.club","artforum.com","asiaflix.net","asianporn.li","askim-bg.com","atglinks.com","atgstudy.com","atozmath.com","audiotools.*","audizine.com","autodime.com","autoembed.cc","autonews.com","autorevue.at","avjamack.com","az-online.de","azoranov.com","azores.co.il","b-hentai.com","babesexy.com","babiato.tech","babygaga.com","bagpipe.news","baithak.news","bamgosu.site","bandstand.ph","banned.video","baramjak.com","barchart.com","baritoday.it","batchkun.com","batporno.com","bbyhaber.com","bceagles.com","bclikeqt.com","beemtube.com","beingtek.com","benchmark.pl","bestlist.top","bestwish.lol","biletomat.pl","bilibili.com","biopills.net","birdurls.com","bitchute.com","bitssurf.com","bittools.net","bk9nmsxs.com","blog-dnz.com","blogmado.com","blogmura.com","bloground.ro","blwideas.com","bobolike.com","bollydrive.*","bollyshare.*","boltbeat.com","bookfrom.net","bookriot.com","boredbat.com","boundhub.com","boysfood.com","br0wsers.com","braflix.tube","bright-b.com","bsmaurya.com","btvsports.my","bubraves.com","buffsports.*","buffstream.*","bugswave.com","bullfrag.com","burakgoc.com","burbuja.info","burnbutt.com","buyjiocoin.*","byswiizen.fr","bz-berlin.de","calbears.com","callfuck.com","camhub.world","camlovers.tv","camporn.tube","camwhores.tv","camwhorez.tv","capoplay.net","cardiagn.com","cariskuy.com","carnewz.site","cashbux.work","casperhd.com","casthill.net","catcrave.com","catholic.com","cbt-tube.net","cctvwiki.com","celebmix.com","celibook.com","cesoirtv.com","channel4.com","chargers.com","chatango.com","chibchat.com","chopchat.com","choralia.net","chzzkban.xyz","cinedetodo.*","cinemabg.net","cinemaxxl.de","claimbits.io","claimtrx.com","clickapi.net","clicporn.com","clip-sex.biz","clix4btc.com","clockskin.us","closermag.fr","cloudrls.com","cocogals.com","cocoporn.net","coderblog.in","codesnse.com","coindice.win","coingraph.us","coinsrev.com","collider.com","compsmag.com","compu-pc.com","cookierun.gg","cool-etv.net","cosmicapp.co","couchtuner.*","coursera.org","cracking.org","crazyblog.in","cricwatch.io","cryptosh.pro","cryptowin.io","cuevana8.com","cut-urls.com","cuts-url.com","cwc.utah.gov","cyberdrop.me","cyberleaks.*","cyclones.com","cyprus.co.il","czechsex.net","da-imnetz.de","daddylive1.*","dafideff.com","dafontvn.com","daftporn.com","dailydot.com","dailysport.*","daizurin.com","darkibox.com","datacheap.io","datanodes.to","dataporn.pro","datawav.club","dawntube.com","day4news.com","ddlvalley.me","deadline.com","deadspin.com","debridup.com","deckshop.pro","decorisi.com","deepbrid.com","deephot.link","delvein.tech","derwesten.de","descarga.xyz","desi.upn.bio","desihoes.com","desiupload.*","desivideos.*","deviants.com","diethood.com","digimanie.cz","dikgames.com","dir-tech.com","dirproxy.com","dirtyfox.net","dirtyporn.cc","distanta.net","divicast.com","divxtotal1.*","djpunjab2.in","dl-protect.*","dlolcast.pro","dlupload.com","dndsearch.in","dokumen.tips","domahatv.com","dotabuff.com","doujindesu.*","downloadr.in","drakecomic.*","dreamdth.com","drivefire.co","drivemoe.com","drivers.plus","dropbang.net","dropgalaxy.*","drsnysvet.cz","drublood.com","ds2video.com","dukeofed.org","dumovies.com","duolingo.com","dutchycorp.*","dvd-flix.com","dwlinks.buzz","dz-linkk.com","eastream.net","ecamrips.com","eclypsia.com","edukaroo.com","egram.com.ng","egyanime.com","ehotpics.com","elcultura.pl","electsex.com","eljgocmn.fun","elvocero.com","embed4me.com","embedtv.best","emporda.info","endbasic.dev","eng-news.com","engvideo.net","epson.com.cn","eroclips.org","erofound.com","erogarga.com","eropaste.net","eroticmv.com","esopress.com","esportivos.*","estrenosgo.*","estudyme.com","et-invest.de","etonline.com","eurogamer.de","eurogamer.es","eurogamer.it","eurogamer.pt","evernia.site","evfancy.link","ex-foary.com","examword.com","exceljet.net","exe-urls.com","eximeuet.fun","expertvn.com","eymockup.com","ezeviral.com","f1livegp.net","factable.com","fairyhorn.cc","famivita.com","fansided.com","fansmega.com","fapality.com","fapfappy.com","fartechy.com","fastilinks.*","fat-bike.com","fbsquadx.com","fc2stream.tv","fedscoop.com","feed2all.org","fehmarn24.de","femdomtb.com","ferdroid.net","fileguard.cc","fileguru.net","filemoon.*>>","filerice.com","filescdn.com","filessrc.com","filezipa.com","filmisongs.*","filmizletv.*","filmy4wap1.*","filmygod13.*","filmyone.com","filmyzilla.*","financid.com","finevids.xxx","firstonetv.*","fitforfun.de","fivemdev.org","flashbang.sh","flaticon.com","flexy.stream","flexyhit.com","flightsim.to","flixbaba.com","flowsnet.com","flstv.online","flvto.com.co","fm-arena.com","fmoonembed.*","fmoviesto.cc","focus4ca.com","footybite.to","forexrw7.com","forogore.com","forplayx.ink","fotopixel.es","freejav.guru","freemovies.*","freemp3.tube","freeride.com","freeshib.biz","freetron.top","freewsad.com","fremdwort.de","freshbbw.com","fruitlab.com","fuckmilf.net","fullboys.com","fullcinema.*","fullhd4k.com","fuskator.com","futemais.net","g8rnyq84.fun","galaxyos.net","game-owl.com","gamebrew.org","gamefast.org","gamekult.com","gamer.com.tw","gamerant.com","gamerxyt.com","games.get.tv","games.wkb.jp","gameslay.net","gameszap.com","gametter.com","gamezizo.com","gamingsym.in","gatagata.net","gay4porn.com","gaystream.pw","gayteam.club","gcaptain.com","gculopes.com","gelbooru.com","gentside.com","getcopy.link","getitfree.cn","getmodsapk.*","gifcandy.net","gioialive.it","gksansar.com","glo-n.online","globes.co.il","globfone.com","gniewkowo.eu","gnusocial.jp","go2share.net","goanimes.vip","gobadgers.ca","gocast123.me","godzcast.com","gogoanimes.*","gogriffs.com","golancers.ca","gomuraw.blog","gonzoporn.cc","goracers.com","gosexpod.com","gottanut.com","goxavier.com","gplastra.com","grazymag.com","grigtube.com","grosnews.com","gseagles.com","gsmhamza.com","guidetnt.com","gurusiana.id","h-game18.xyz","h8jizwea.fun","habuteru.com","hachiraw.net","hackshort.me","hackstore.me","halloporno.*","harbigol.com","hbnews24.com","hbrfrance.fr","hdfcfund.com","hdhub4u.fail","hdmoviehub.*","hdmovies23.*","hdmovies4u.*","hdmovies50.*","hdpopcorns.*","hdporn92.com","hdpornos.net","hdvideo9.com","hellmoms.com","helpdice.com","hentai2w.com","hentai3z.com","hentai4k.com","hentaigo.com","hentaihd.xyz","hentaila.com","hentaimoe.me","hentais.tube","hentaitk.net","hentaizm.fun","hi0ti780.fun","highporn.net","hiperdex.com","hipsonyc.com","hivetoon.com","hmanga.world","hostmath.com","hotmilfs.pro","hqporner.com","hubdrive.com","huffpost.com","hurawatch.cc","huzi6or1.fun","hwzone.co.il","hyderone.com","hydrogen.lat","hypnohub.net","iambaker.net","ibradome.com","icutlink.com","icyporno.com","idesign.wiki","idevfast.com","idntheme.com","iguarras.com","ihdstreams.*","ilovephd.com","ilpescara.it","imagefap.com","imdpu9eq.com","imgadult.com","imgbaron.com","imgblaze.net","imgbnwe.shop","imgbyrev.sbs","imgclick.net","imgdrive.net","imgflare.com","imgfrost.net","imggune.shop","imgjajhe.sbs","imgmffmv.sbs","imgnbii.shop","imgolemn.sbs","imgprime.com","imgqbbds.sbs","imgspark.com","imgthbm.shop","imgtorrnt.in","imgxabm.shop","imgxxbdf.sbs","imintweb.com","indianxxx.us","infodani.net","infofuge.com","informer.com","interssh.com","intro-hd.net","ipacrack.com","ipatriot.com","iptvapps.net","iptvspor.com","iputitas.net","iqksisgw.xyz","isaidub6.net","itainews.com","itz-fast.com","iwanttfc.com","izzylaif.com","jaktsidan.se","jalopnik.com","japanporn.tv","japteenx.com","jav-asia.top","javboys.tv>>","javbraze.com","javguard.xyz","javhahaha.us","javhdz.today","javindo.site","javjavhd.com","javmelon.com","javplaya.com","javplayer.me","javprime.net","javquick.com","javrave.club","javtiful.com","javturbo.xyz","jenpornuj.cz","jeshoots.com","jmzkzesy.xyz","jobfound.org","jobsheel.com","jockantv.com","joymaxtr.net","joziporn.com","jsfiddle.net","juba-get.com","jujmanga.com","kabeleins.de","kafeteria.pl","kakitengah.*","kamehaus.net","kaoskrew.org","karanapk.com","katmoviehd.*","kattracker.*","kaystls.site","khaddavi.net","khatrimaza.*","khsn1230.com","kickasskat.*","kinisuru.com","kinkyporn.cc","kino-zeit.de","kiss-anime.*","kisstvshow.*","klubsports.*","knowstuff.in","kolcars.shop","kollhong.com","konten.co.id","koramaup.com","kpopjams.com","kr18plus.com","kreisbote.de","kstreaming.*","kubo-san.com","kumapoi.info","kungfutv.net","kunmanga.com","kurazone.net","kusonime.com","ladepeche.fr","landwirt.com","lanjutkeun.*","latino69.fun","ldkmanga.com","leaktube.net","learnmany.in","lectormh.com","lecturel.com","leechall.com","leprogres.fr","lesbenhd.com","lesbian8.com","lewdzone.com","liddread.com","lifestyle.bg","lifewire.com","likemanga.io","likuoo.video","linfoweb.com","linkjust.com","linksaya.com","linkshorts.*","linkvoom.com","lionsfan.net","livegore.com","livemint.com","livesport.ws","ln-online.de","lokerwfh.net","longporn.xyz","lookmovie.pn","lookmovie2.*","lootdest.com","lostsword.gg","lover937.net","lrepacks.net","lucidcam.com","lulustream.*","luluvdoo.com","luscious.net","lusthero.com","luxuretv.com","m-hentai.net","mac2sell.net","macsite.info","mamahawa.com","manga18.club","mangadna.com","mangafire.to","mangagun.net","mangakio.com","mangakita.id","mangalek.com","mangamanga.*","manganelo.tv","mangarawjp.*","mangasco.com","mangoporn.co","mangovideo.*","manhuaga.com","manhuascan.*","manhwa68.com","manhwass.com","manhwaus.net","manpeace.org","manyakan.com","manytoon.com","maqal360.com","marmiton.org","masengwa.com","mashtips.com","masslive.com","mat6tube.com","mathaeser.de","maturell.com","mavanimes.co","maxgaming.fi","mazakony.com","mc-hacks.net","mcfucker.com","mcrypto.club","mdbekjwqa.pw","mdtaiwan.com","mealcold.com","medscape.com","medytour.com","meetimgz.com","mega-mkv.com","mega-p2p.net","megafire.net","megatube.xxx","megaupto.com","meilblog.com","metabomb.net","meteolive.it","miaandme.org","micmicidol.*","microify.com","midis.com.ar","mikohub.blog","milftoon.xxx","miraculous.*","mirror.co.uk","missavtv.com","missyusa.com","mitsmits.com","mixloads.com","mjukb26l.fun","mkm7c3sm.com","mkvcinemas.*","mlbstream.tv","mmsbee47.com","mobitool.net","modcombo.com","moddroid.com","modhoster.de","modsbase.com","modsfire.com","modyster.com","mom4real.com","momo-net.com","momsdish.com","momspost.com","momxxx.video","monaco.co.il","mooonten.com","moretvtime.*","moshahda.net","motofakty.pl","movie4u.live","moviedokan.*","movieffm.net","moviefreak.*","moviekids.tv","movielair.cc","movierulzs.*","movierulzz.*","movies123.pk","movies18.net","movies4us.co","moviesapi.to","moviesbaba.*","moviesflix.*","moviesland.*","moviespapa.*","moviesrulz.*","moviesshub.*","moviesxxx.cc","movieweb.com","movstube.net","mp3fiber.com","mp3juices.su","mp4-porn.net","mpg.football","mrscript.net","multporn.net","musictip.net","mutigers.com","myesports.gg","myflixerz.to","myfxbook.com","mylinkat.com","naijafav.top","naniplay.com","nanolinks.in","napiszar.com","nar.k-ba.net","natgeotv.com","nbastream.tv","nemumemo.com","nephobox.com","netmovies.to","netoff.co.jp","netuplayer.*","newatlas.com","news.now.com","newsextv.com","newsmondo.it","nextdoor.com","nextorrent.*","neymartv.net","nflscoop.xyz","nflstream.tv","nicetube.one","nicknight.de","nicovideo.jp","nifteam.info","nilesoft.org","niu-pack.com","niyaniya.moe","nkunorse.com","nonktube.com","novelasesp.*","novelbob.com","novelpub.com","novelread.co","novoglam.com","novoporn.com","nowmaxtv.com","nowsports.me","nowsportv.nl","nowtv.com.tr","nptsr.live>>","nsfwgify.com","nsfwzone.xyz","nudecams.xxx","nudedxxx.com","nudistic.com","nudogram.com","nudostar.com","nueagles.com","nugglove.com","nusports.com","nwzonline.de","nyaa.iss.ink","nzbstars.com","oaaxpgp3.xyz","octanime.net","of-model.com","oimsmosy.fun","okulsoru.com","olutposti.fi","olympics.com","oncehelp.com","oneupload.to","onlinexxx.cc","onlytech.com","onscreens.me","onyxfeed.com","op-online.de","openload.mov","opomanga.com","optifine.net","orangeink.pk","oricon.co.jp","osuskins.net","otakukan.com","otakuraw.net","ottverse.com","ottxmaza.com","ovagames.com","ovnihoje.com","oyungibi.com","pagalworld.*","pak-mcqs.net","paktech2.com","pandadoc.com","pandamovie.*","panthers.com","papunika.com","parenting.pl","parzibyte.me","paste.bin.sx","pastepvp.org","pastetot.com","patriots.com","pay4fans.com","pc-hobby.com","pdfindir.net","peekvids.com","pelisflix2.*","pelishouse.*","pelispedia.*","pelisplus2.*","pennlive.com","pentruea.com","perisxxx.com","phimmoiaz.cc","photooxy.com","photopea.com","picbaron.com","picjbet.shop","picnwqez.sbs","picyield.com","pietsmiet.de","pig-fuck.com","pilibook.com","pinayflix.me","piratebayz.*","pisatoday.it","pittband.com","pixbnab.shop","pixdfdj.shop","piximfix.com","pixkfkf.shop","pixnbrqw.sbs","pixrqqz.shop","pkw-forum.de","platinmods.*","play.max.com","play.nova.bg","play1002.com","player4u.xyz","playerfs.com","playertv.net","playfront.de","playstore.pw","playvids.com","plaza.chu.jp","plc4free.com","plusupload.*","pmvhaven.com","poki-gdn.com","politico.com","polygamia.pl","pomofocus.io","ponsel4g.com","pornabcd.com","pornachi.com","porncomics.*","pornditt.com","pornfeel.com","pornfeet.xyz","pornflip.com","porngames.tv","porngrey.com","pornhat.asia","pornhdin.com","pornhits.com","pornhost.com","pornicom.com","pornleaks.in","pornlift.com","pornlore.com","pornluck.com","pornmoms.org","porno-tour.*","pornoaid.com","pornoente.tv","pornohd.blue","pornotom.com","pornozot.com","pornpapa.com","porntape.net","porntrex.com","pornvibe.org","pornwatch.ws","pornyeah.com","pornyfap.com","pornzone.com","poscitechs.*","postazap.com","postimees.ee","powcloud.org","prensa.click","pressian.com","pricemint.in","produsat.com","programme.tv","promipool.de","proplanta.de","prothots.com","ps2-bios.com","pugliain.net","pupupul.site","pussyspace.*","putlocker9.*","putlockerc.*","putlockers.*","pysznosci.pl","q1-tdsge.com","qashbits.com","qpython.club","quizrent.com","qvzidojm.com","r3owners.net","raidrush.net","rail-log.net","rajtamil.org","ranjeet.best","rapelust.com","rapidzona.tv","raulmalea.ro","rawmanga.top","rawstory.com","razzball.com","rbs.ta36.com","recipahi.com","recipenp.com","recording.de","reddflix.com","redecanais.*","redretti.com","remilf.xyz>>","reminimod.co","repelisgoo.*","repretel.com","reqlinks.net","resplace.com","retire49.com","richhioon.eu","riftbound.gg","riotbits.com","ritzysex.com","rockmods.net","rolltide.com","romatoday.it","roms-hub.com","ronaldo7.pro","root-top.com","rosasidan.ws","rosefile.net","rot-blau.com","royalkom.com","rp-online.de","rtilinks.com","rubias19.com","rue89lyon.fr","ruidrive.com","rushporn.xxx","s2watch.link","salidzini.lv","samfirms.com","samovies.net","satkurier.pl","savefrom.net","savegame.pro","savesubs.com","savevideo.me","scamalot.com","scjhg5oh.fun","seahawks.com","seeklogo.com","seireshd.com","seksrura.net","senimovie.co","senmanga.com","senzuri.tube","servustv.com","sethphat.com","seuseriado.*","sex-pic.info","sexgames.xxx","sexgay18.com","sexroute.net","sexy-games.*","sexyhive.com","sfajacks.com","sgxnifty.org","shanurdu.com","sharedrive.*","sharetext.me","shemale6.com","shemedia.com","sheshaft.com","shorteet.com","shrtslug.biz","sieradmu.com","silkengirl.*","sinonimos.de","siteflix.org","sitekeys.net","skinnyhq.com","skinnyms.com","slawoslaw.pl","slreamplay.*","slutdump.com","slutmesh.net","smailpro.com","smallpdf.com","smcgaels.com","smgplaza.com","snlookup.com","snowbreak.gg","sobatkeren.*","sodomojo.com","solarmovie.*","sonixgvn.net","sortporn.com","sound-park.*","southfreak.*","sp-today.com","sp500-up.com","speedrun.com","spielfilm.de","spinoff.link","sport-97.com","sportico.com","sporting77.*","sportlemon.*","sportlife.es","sportnews.to","sportshub.to","sportskart.*","stardeos.com","stardima.com","stayglam.com","stbturbo.xyz","steelers.com","stevivor.com","stimotion.pl","stre4mplay.*","stream18.net","streamango.*","streambee.to","streameast.*","streampiay.*","streamtape.*","streamwish.*","strikeout.im","stylebook.de","subtaboo.com","sunbtc.space","sunporno.com","superapk.org","superpsx.com","supervideo.*","surf-trx.com","surfline.com","surrit.store","sushi-scan.*","sussytoons.*","suzihaza.com","suzylu.co.uk","svipvids.com","swiftload.io","synonyms.com","syracuse.com","system32.ink","tabering.net","tabooporn.tv","tacobell.com","tagecoin.com","tajpoint.com","tamilprint.*","tamilyogis.*","tampabay.com","tanfacil.net","tapchipi.com","tapepops.com","tatabrada.tv","tatangga.com","team-rcv.xyz","tech24us.com","tech4auto.in","techably.com","techmuzz.com","technons.com","technorj.com","techstage.de","techstwo.com","techtobo.com","techyinfo.in","techzed.info","teczpert.com","teencamx.com","teenhost.net","teensark.com","teensporn.tv","teknorizen.*","telecinco.es","telegraaf.nl","teleriumtv.*","teluguflix.*","teraearn.com","terashare.co","terashare.me","tesbox.my.id","tespedia.com","testious.com","th-world.com","theblank.net","theconomy.me","thedaddy.*>>","thefmovies.*","thegamer.com","thehindu.com","thekickass.*","thelinkbox.*","themezon.net","theonion.com","theproxy.app","thesleak.com","thesukan.net","thevalley.fm","theverge.com","thotvids.com","threezly.com","thuglink.com","thurrott.com","tigernet.com","tik-tok.porn","timestamp.fr","tioanime.com","tipranks.com","tnaflix.asia","tnhitsda.net","tntdrama.com","tokenmix.pro","top10cafe.se","topeuropix.*","topfaucet.us","topkickass.*","topspeed.com","topstreams.*","torture1.net","trahodom.com","trendyol.com","tresdaos.com","truthnews.de","tryboobs.com","ts-mpegs.com","tsmovies.com","tubedupe.com","tubewolf.com","tubxporn.com","tucinehd.com","turbobit.net","turbovid.vip","turkanime.co","turkdown.com","turkrock.com","tusfiles.com","tv247us.live","tv3monde.com","tvappapk.com","tvdigital.de","tvpclive.com","tvtropes.org","tweakers.net","twister.porn","tz7z9z0h.com","u-s-news.com","u26bekrb.fun","u9206kzt.fun","udoyoshi.com","ugreen.autos","ukchat.co.uk","ukdevilz.com","ukigmoch.com","ultraten.net","umagame.info","umamusume.gg","unefemme.net","unitystr.com","up-4ever.net","uploadbox.io","uploadmx.com","uploads.mobi","upshrink.com","uptomega.net","ur-files.com","ur70sq6j.fun","usatoday.com","usaxtube.com","userupload.*","usp-forum.de","utahutes.com","utaitebu.com","utakmice.net","uthr5j7t.com","utsports.com","uur-tech.net","uwatchfree.*","valuexh.life","vdiflcsl.fun","veganinja.hu","vegas411.com","vibehubs.com","videofilms.*","videojav.com","videos-xxx.*","videovak.com","vidsaver.net","vidsrc.click","viidshar.com","vikiporn.com","violablu.net","vipporns.com","viralxns.com","visorsmr.com","vocalley.com","voirseries.*","volokit2.com","vqjhqcfk.fun","warddogs.com","watchmovie.*","watchmygf.me","watchnow.fun","watchop.live","watchporn.cc","watchporn.to","watchtvchh.*","way2movies.*","web2.0calc.*","webcams.casa","webnovel.com","webxmaza.com","westword.com","whatgame.xyz","whyvpn.my.id","wikifeet.com","wikirise.com","winboard.org","winfuture.de","winlator.com","wishfast.top","withukor.com","wohngeld.org","wolfstream.*","worldaide.fr","worldmak.com","worldsex.com","writedroid.*","wspinanie.pl","www.google.*","x-video.tube","xculitos.com","xemphim1.top","xfantazy.com","xfantazy.org","xhaccess.com","xhadult2.com","xhadult3.com","xhadult4.com","xhadult5.com","xhamster10.*","xhamster11.*","xhamster12.*","xhamster13.*","xhamster14.*","xhamster15.*","xhamster16.*","xhamster17.*","xhamster18.*","xhamster19.*","xhamster20.*","xhamster42.*","xhdate.world","xpornium.net","xsexpics.com","xteensex.net","xvideos.name","xvideos2.com","xxporner.com","xxxfiles.com","xxxhdvideo.*","xxxonline.cc","xxxputas.net","xxxshake.com","xxxstream.me","y5vx1atg.fun","yabiladi.com","yaoiscan.com","yggtorrent.*","yhocdata.com","ynk-blog.com","yogranny.com","you-porn.com","yourlust.com","yts-subs.com","yts-subs.net","ytube2dl.com","yuatools.com","yurineko.net","yurudori.com","z1ekv717.fun","zealtyro.com","zehnporn.com","zenradio.com","zhlednito.cz","zilla-xr.xyz","zimabdko.com","zone.msn.com","zootube1.com","zplayer.live","zvision.link","01234movies.*","01fmovies.com","10convert.com","10play.com.au","10starhub.com","111.90.150.10","111.90.151.26","111movies.com","123gostream.*","123movies.net","123moviesgo.*","123movieshd.*","123moviesla.*","123moviesme.*","123movieweb.*","123multihub.*","185.53.88.104","185.53.88.204","190.115.18.20","1bitspace.com","1qwebplay.xyz","1xxx-tube.com","247sports.com","2girls1cup.ca","30kaiteki.com","360news4u.net","38.242.194.12","3dhentai.club","4download.net","4drumkits.com","4filmyzilla.*","4horlover.com","4meplayer.com","4movierulz1.*","560pmovie.com","5movierulz2.*","6hiidude.gold","7fractals.icu","7misr4day.com","7movierulz1.*","7moviesrulz.*","7vibelife.com","94.103.83.138","9filmyzilla.*","9ketsuki.info","9xmoovies.com","abczdrowie.pl","abendblatt.de","abseits-ka.de","acusports.com","acutetube.net","adblocktape.*","addapinch.com","advantien.com","advertape.net","aiimgvlog.fun","ainonline.com","aitohuman.org","ajt.xooit.org","akcartoons.in","albania.co.il","alexbacher.fr","alimaniac.com","allfaucet.xyz","allitebooks.*","allmomsex.com","alltstube.com","allusione.org","alohatube.xyz","alueviesti.fi","ambonkita.com","angelfire.com","angelgals.com","anihdplay.com","animecast.net","animefever.cc","animeflix.ltd","animefreak.to","animeheaven.*","animenexus.in","animesite.net","animesup.info","animetoast.cc","animeworld.ac","animeworld.tv","animeyabu.net","animeyabu.org","animeyubi.com","anitube22.vip","aniwatchtv.to","anonyviet.com","anusling.info","aogen-net.com","aparttent.com","appteka.store","arahdrive.com","archive.today","archivebate.*","archpaper.com","areabokep.com","areamobile.de","areascans.net","areatopik.com","arenascan.com","arenavision.*","aresmanga.com","arhplyrics.in","ariestube.com","ark-unity.com","arldeemix.com","artesacro.org","arti-flora.nl","articletz.com","artribune.com","asianboy.fans","asianhdplay.*","asianlbfm.net","asiansex.life","asiaontop.com","askattest.com","askpython.com","asssex-hd.com","astroages.com","astronews.com","at.wetter.com","audiotag.info","audiotrip.org","austiblox.net","auto-data.net","auto-swiat.pl","autobytel.com","autoextrem.de","autofrage.net","autoscout24.*","autosport.com","autotrader.nl","avpgalaxy.net","azcentral.com","aztravels.net","b-bmovies.com","babakfilm.com","babepedia.com","babestube.com","babytorrent.*","baddiehub.com","bakedbree.com","bdsm-fuck.com","beasttips.com","beegsexxx.com","besargaji.com","bestgames.com","beverfood.com","biftutech.com","bikeradar.com","bikerszene.de","bilasport.net","bilinovel.com","billboard.com","bimshares.com","bingsport.xyz","bitcosite.com","bitfaucet.net","bitlikutu.com","bitview.cloud","bizdustry.com","blasensex.com","blog.40ch.net","blogesque.net","blograffo.net","blurayufr.cam","bobs-tube.com","bokugents.com","bolly2tolly.*","bollymovies.*","boobgirlz.com","bootyexpo.net","boxylucha.com","boystube.link","bravedown.com","bravoporn.com","brawlhalla.fr","breitbart.com","breznikar.com","brighteon.com","brocoflix.com","brocoflix.xyz","bshifast.live","buffsports.io","buffstreams.*","bustyfats.com","buxfaucet.com","buydekhke.com","bymichiby.com","call4cloud.nl","camarchive.tv","camdigest.com","camgoddess.tv","camvideos.org","camwhorestv.*","camwhoria.com","canalobra.com","canlikolik.my","capo4play.com","capo5play.com","capo6play.com","caravaning.de","cardshare.biz","carryflix.icu","carscoops.com","cat-a-cat.net","cat3movie.org","cbsnews.com>>","ccthesims.com","cdiscount.com","celeb.gate.cc","celemusic.com","ceramic.or.kr","ceylonssh.com","cg-method.com","cgcosplay.org","chapteria.com","chataigpt.org","cheatcloud.cc","cheater.ninja","cheatsquad.gg","chevalmag.com","chihouban.com","chikonori.com","chimicamo.org","chloeting.com","chumplady.com","cima100fm.com","cine24.online","cinecalidad.*","cinedokan.top","cinema.com.my","cinemabaz.com","cinemitas.org","civitai.green","claim.8bit.ca","claimbits.net","claudelog.com","claydscap.com","clickhole.com","cloudvideo.tv","cloudwish.xyz","cloutgist.com","cmsdetect.com","cmtracker.net","cnnamador.com","cockmeter.com","cocomanga.com","code2care.org","codeastro.com","codesnail.com","codewebit.top","coinbaby8.com","coinfaucet.io","coinlyhub.com","coinsbomb.com","colourxh.site","comedyshow.to","comexlive.org","comparili.net","computer76.ru","condorsoft.co","configspc.com","cooksinfo.com","coolcast2.com","coolporno.net","corrector.app","courseclub.me","crackcodes.in","crackevil.com","crackfree.org","crazyporn.xxx","crazyshit.com","crazytoys.xyz","cricket12.com","criollasx.com","criticker.com","crocotube.com","crotpedia.net","crypto4yu.com","cryptonor.xyz","cryptorank.io","cumlouder.com","cureclues.com","currytrail.in","cuttlinks.com","cxissuegk.com","cybermania.ws","daddylive.*>>","daddylivehd.*","dailynews.com","dailypaws.com","dailyrevs.com","dandanzan.top","dankmemer.lol","datavaults.co","dbusports.com","dcleakers.com","ddd-smart.net","decmelfot.xyz","deepfucks.com","deichstube.de","deluxtube.com","demae-can.com","denofgeek.com","depvailon.com","derusblog.com","descargasok.*","desijugar.net","desimmshd.com","dfilmizle.com","dickclark.com","dinnerexa.com","dipprofit.com","dirtyship.com","diskizone.com","dl-protect1.*","dlapk4all.com","dldokan.store","dlhe-videa.sk","doctoraux.com","dongknows.com","donkparty.com","doofree88.com","doomovie-hd.*","dooodster.com","doramasyt.com","dorawatch.net","douploads.net","douxporno.com","downfile.site","downloader.is","downloadhub.*","dr-farfar.com","dragonball.gg","dragontea.ink","dramafren.com","dramafren.org","dramaviki.com","drivelinks.me","drivenime.com","driveup.space","drop.download","dropnudes.com","dropshipin.id","dubaitime.net","durtypass.com","e-monsite.com","e2link.link>>","eatsmarter.de","ebonybird.com","ebook-hell.to","ebook3000.com","ebooksite.org","edealinfo.com","edukamer.info","egitim.net.tr","elespanol.com","embdproxy.xyz","embed.scdn.to","embedgram.com","embedplayer.*","embedrise.com","embedwish.com","empleo.com.uy","emueagles.com","encurtads.net","encurtalink.*","enjoyfuck.com","ensenchat.com","entenpost.com","entireweb.com","ephoto360.com","epochtimes.de","eporner.video","eramuslim.com","erospots.info","eroticity.net","erreguete.gal","esladvice.com","eurogamer.net","exe-links.com","expansion.com","extratipp.com","fadedfeet.com","familyporn.tv","fanfiktion.de","fangraphs.com","fantasiku.com","fapomania.com","faresgame.com","farodevigo.es","farsinama.com","fastcars1.com","fclecteur.com","fembed9hd.com","fetish-tv.com","fetishtube.cc","file-upload.*","filegajah.com","filehorse.com","filemooon.top","filmeseries.*","filmibeat.com","filmlinks4u.*","filmy4wap.uno","filmyporno.tv","filmyworlds.*","findheman.com","firescans.xyz","firmwarex.net","firstpost.com","fivemturk.com","flexamens.com","flexxporn.com","flix-wave.lol","flixlatam.com","flyplayer.xyz","fmoviesfree.*","fontyukle.net","footeuses.com","footyload.com","forexforum.co","forlitoday.it","forum.dji.com","fossbytes.com","fosslinux.com","fotoblogia.pl","foxaholic.com","foxsports.com","foxtel.com.au","frauporno.com","free.7hd.club","freedom3d.art","freeflix.info","freegames.com","freeiphone.fr","freeomovie.to","freeporn8.com","freesex-1.com","freeshot.live","freexcafe.com","freexmovs.com","freshscat.com","freyalist.com","fromwatch.com","fsicomics.com","fsl-stream.lu","fsportshd.net","fsportshd.xyz","fuck-beeg.com","fuck-xnxx.com","fucksporn.com","fullassia.com","fullhdxxx.com","funandnews.de","fussball.news","futurezone.de","fzmovies.info","fztvseries.ng","gamearter.com","gamedrive.org","gamefront.com","gamelopte.com","gamereactor.*","games.bnd.com","games.qns.com","gamesite.info","gamesmain.xyz","gamevcore.com","gamezhero.com","gamovideo.com","garoetpos.com","gatasdatv.com","gayboyshd.com","gaysearch.com","geekering.com","generate.plus","gesundheit.de","getintopc.com","getpaste.link","getpczone.com","gfsvideos.com","ghscanner.com","gigmature.com","gipfelbuch.ch","girlnude.link","girlydrop.com","globalnews.ca","globalrph.com","globalssh.net","globlenews.in","go.linkify.ru","gobobcats.com","gogoanimetv.*","gogoplay1.com","gogoplay2.com","gohuskies.com","gol245.online","goldderby.com","gomaainfo.com","gomoviestv.to","goodriviu.com","govandals.com","grabpussy.com","grantorrent.*","graphicux.com","greatnass.com","greensmut.com","gry-online.pl","gsmturkey.net","guardaserie.*","gutefrage.net","gutekueche.at","gwusports.com","haaretz.co.il","hailstate.com","hairytwat.org","hancinema.net","haonguyen.top","haoweichi.com","harimanga.com","harzkurier.de","hdgayporn.net","hdmoviefair.*","hdmoviehubs.*","hdmovieplus.*","hdmovies2.org","hdpornzap.com","hdtubesex.net","heatworld.com","heimporno.com","hellabyte.one","hellenism.net","hellporno.com","hentaihaven.*","hentaikai.com","hentaimama.tv","hentaipaw.com","hentaiporn.me","hentairead.io","hentaiyes.com","herzporno.net","heutewelt.com","hexupload.net","hiddenleaf.to","hifi-forum.de","hihihaha1.xyz","hihihaha2.xyz","hilites.today","hindimovies.*","hindinest.com","hindishri.com","hindisite.net","hispasexy.org","hitsports.pro","hlsplayer.top","hobbykafe.com","holaporno.xxx","holymanga.net","hornbunny.com","hornyfanz.com","hosttbuzz.com","hotntubes.com","hotpress.info","howtogeek.com","hqmaxporn.com","hqpornero.com","hqsex-xxx.com","htmlgames.com","hulkshare.com","hurawatchz.to","hydraxcdn.biz","hypebeast.com","hyperdebrid.*","iammagnus.com","iceland.co.uk","ichberlin.com","icy-veins.com","ievaphone.com","iflixmovies.*","ifreefuck.com","igg-games.com","ignboards.com","iiyoutube.com","ikarianews.gr","ikz-online.de","ilpiacenza.it","imagehaha.com","imagenpic.com","imgbbnhi.shop","imgbncvnv.sbs","imgcredit.xyz","imghqqbg.shop","imgkkabm.shop","imgmyqbm.shop","imgwallet.com","imgwwqbm.shop","imleagues.com","indiafree.net","indianyug.com","indiewire.com","ineedskin.com","inextmovies.*","infidrive.net","inhabitat.com","instagram.com","instalker.org","interfans.org","investing.com","iogames.space","ipalibrary.me","iptvpulse.top","italpress.com","itdmusics.com","itmaniatv.com","itopmusic.com","itsguider.com","jadijuara.com","jagoanssh.com","jameeltips.us","japanxxx.asia","jav101.online","javenglish.cc","javguard.club","javhdporn.net","javleaked.com","javmobile.net","javporn18.com","javsaga.ninja","javstream.com","javstream.top","javsubbed.xyz","javsunday.com","jaysndees.com","jazzradio.com","jellynote.com","jennylist.xyz","jesseporn.xyz","jiocinema.com","jipinsoft.com","jizzberry.com","jk-market.com","jkdamours.com","jncojeans.com","jobzhub.store","joongdo.co.kr","jpscan-vf.com","jptorrent.org","juegos.as.com","jumboporn.xyz","junkyponk.com","jurukunci.net","justjared.com","justpaste.top","justwatch.com","juventusfc.hu","k12reader.com","kacengeng.com","kakiagune.com","kalileaks.com","kanaeblog.net","kangkimin.com","katdrive.link","katestube.com","katmoviefix.*","kayoanime.com","kckingdom.com","kenta2222.com","kfapfakes.com","kfrfansub.com","kicaunews.com","kickcharm.com","kissasian.*>>","klaustube.com","klikmanga.com","kllproject.lv","klykradio.com","kobieta.wp.pl","kolnovel.site","koreanbj.club","korsrt.eu.org","kotanopan.com","kpopjjang.com","ksusports.com","kumascans.com","kupiiline.com","kuronavi.blog","kurosuen.live","lamorgues.com","laptrinhx.com","latinabbw.xyz","latinlucha.es","laurasia.info","lavoixdux.com","law101.org.za","learn-cpp.org","learnclax.com","lecceprima.it","leccotoday.it","leermanga.net","leinetal24.de","letmejerk.com","letras.mus.br","lewdstars.com","liberation.fr","libreriamo.it","liiivideo.com","likemanga.ink","lilymanga.net","ling-online.*","link4rev.site","linkfinal.com","linkskibe.com","linkspaid.com","linovelib.com","linuxhint.com","lippycorn.com","listeamed.net","litecoin.host","litonmods.com","liveonsat.com","livestreams.*","liveuamap.com","lolcalhost.ru","lolhentai.net","longfiles.com","lookmovie2.to","loot-link.com","loptelink.com","lordpremium.*","love4porn.com","lovetofu.cyou","lowellsun.com","lrtrojans.com","lsusports.net","ludigames.com","lulacloud.com","lustesthd.lat","lustholic.com","lusttaboo.com","lustteens.net","lustylist.com","lustyspot.com","luxusmail.org","m.viptube.com","m.youtube.com","maccanismi.it","macrumors.com","macserial.com","magesypro.com","mailnesia.com","mailocal2.xyz","mainbabes.com","mainlinks.xyz","mainporno.com","makeuseof.com","mamochki.info","manga-dbs.com","manga-tube.me","manga18fx.com","mangacrab.com","mangacrab.org","mangadass.com","mangafreak.me","mangahere.onl","mangakoma01.*","mangalist.org","mangarawjp.me","mangaread.org","mangasite.org","mangoporn.net","manhastro.com","manhastro.net","manhuatop.org","manhwatop.com","manofadan.com","map.naver.com","marvel.church","mathcrave.com","mathebibel.de","mathsspot.com","matomeiru.com","maz-online.de","mconverter.eu","md3b0j6hj.com","mdfx9dc8n.net","mdy48tn97.com","medebooks.xyz","mediafire.com","mediamarkt.be","mediamarkt.de","mediapason.it","medihelp.life","mega-dvdrip.*","megagames.com","megane.com.pl","megawarez.org","megawypas.com","meineorte.com","meinestadt.de","memangbau.com","memedroid.com","menshealth.de","metalflirt.de","meteopool.org","metrolagu.cam","mettablog.com","meuanime.info","mexicogob.com","mh.baxoi.buzz","mhdsportstv.*","mhdtvsports.*","miohentai.com","miraculous.to","mirrorace.com","missav123.com","missav888.com","mitedrive.com","mixdrop21.net","mixdrop23.net","mixdropjmk.pw","mjakmama24.pl","mmastreams.me","mmorpg.org.pl","mobdi3ips.com","mobdropro.com","modelisme.com","mom-pussy.com","momxxxass.com","momxxxsex.com","moneyhouse.ch","moneyning.com","monstream.org","monzatoday.it","moonquill.com","moovitapp.com","moozpussy.com","moregirls.org","morgenpost.de","mosttechs.com","motive213.com","motofan-r.com","motor-talk.de","motorbasar.de","motortests.de","moutogami.com","moviedekho.in","moviefone.com","moviehaxx.pro","moviejones.de","movielinkbd.*","moviepilot.de","movieping.com","movierulzhd.*","moviesdaweb.*","moviesite.app","moviesverse.*","moviexxx.mobi","mp3-gratis.it","mp3fusion.net","mp3juices.icu","mp4mania1.net","mp4upload.com","mrpeepers.net","mtech4you.com","mtg-print.com","mtraffics.com","multicanais.*","musicsite.biz","musikradar.de","myadslink.com","mydomaine.com","myfernweh.com","myflixertv.to","mygolfspy.com","myhindigk.com","myhomebook.de","myicloud.info","myrecipes.com","myshopify.com","mysostech.com","mythvista.com","myvidplay.com","myvidster.com","myviptuto.com","myyouporn.com","naijahits.com","nakenprat.com","napolipiu.com","nastybulb.com","nation.africa","natomanga.com","naturalbd.com","nbcsports.com","ncdexlive.org","needrombd.com","neilpatel.com","nekolink.site","nekopoi.my.id","neoseeker.com","nesiaku.my.id","netfilmes.org","netnaijas.com","nettiauto.com","neuepresse.de","neurotray.com","nevcoins.club","neverdims.com","newstopics.in","newyorker.com","newzjunky.com","nexusgames.to","nexusmods.com","nflstreams.me","nhvnovels.com","nicematin.com","nicomanga.com","nihonkuni.com","nin10news.com","nklinks.click","noblocktape.*","noikiiki.info","noob4cast.com","noor-book.com","nordbayern.de","notevibes.com","nousdecor.com","nouvelobs.com","novamovie.net","novelcrow.com","novelroom.net","novizer.com>>","nsfwalbum.com","nsfwhowto.xyz","nudegista.com","nudistube.com","nuhuskies.com","nukibooks.com","nulledmug.com","nvimfreak.com","nwusports.com","odiafresh.com","officedepot.*","ogoplayer.xyz","ohmybrush.com","ojogos.com.br","okhatrimaza.*","onemanhua.com","online-fix.me","onlinegdb.com","onlyssh.my.id","onlystream.tv","op-marburg.de","openloadmov.*","ostreaming.tv","otakuliah.com","otakuporn.com","otonanswer.jp","ottawasun.com","ovcsports.com","owlsports.com","ozulscans.com","padovaoggi.it","pagalfree.com","pagalmovies.*","pagalworld.us","paidnaija.com","panuvideo.com","paolo9785.com","parisporn.org","parmatoday.it","pasteboard.co","pasteflash.sx","pastelink.net","patchsite.net","pawastreams.*","pc-builds.com","pc-magazin.de","pclicious.net","peacocktv.com","peladas69.com","peliculas24.*","pelisflix20.*","pelisgratis.*","pelismart.com","pelisplusgo.*","pelisplushd.*","pelisplusxd.*","pelisstar.com","perplexity.ai","pervclips.com","pg-wuming.com","pianokafe.com","pic-upload.de","picbcxvxa.sbs","pichaloca.com","pics-view.com","pienovels.com","piraproxy.app","pirateproxy.*","pixbkghxa.sbs","pixbryexa.sbs","pixnbrqwg.sbs","pixtryab.shop","pkbiosfix.com","play.aetv.com","player.stv.tv","player4me.vip","playfmovies.*","playpaste.com","plugincim.com","pocketnow.com","poco.rcccn.in","pokemundo.com","polska-ie.com","popcorntime.*","porn4fans.com","pornbaker.com","pornbimbo.com","pornblade.com","pornborne.com","pornchaos.org","pornchimp.com","porncomics.me","porncoven.com","porndollz.com","porndrake.com","pornfelix.com","pornfuzzy.com","pornloupe.com","pornmonde.com","pornoaffe.com","pornobait.com","pornocomics.*","pornoeggs.com","pornohaha.com","pornohans.com","pornohelm.com","pornokeep.com","pornoleon.com","pornomico.com","pornonline.cc","pornonote.pro","pornoplum.com","pornproxy.app","pornproxy.art","pornretro.xyz","pornslash.com","porntopic.com","porntube18.cc","posterify.net","pourcesoir.in","povaddict.com","powforums.com","pravda.com.ua","pregledaj.net","pressplay.cam","pressplay.top","prignitzer.de","proappapk.com","proboards.com","produktion.de","promiblogs.de","prostoporno.*","protestia.com","protopage.com","ptcgpocket.gg","pureleaks.net","pussy-hub.com","pussyspot.net","putlockertv.*","puzzlefry.com","pvpoke-re.com","pygodblog.com","qqwebplay.xyz","quesignifi.ca","quicasting.it","quickporn.net","rainytube.com","ranourano.xyz","rbscripts.net","read.amazon.*","readingbd.com","realbooru.com","realmadryt.pl","rechtslupe.de","redhdtube.xxx","redsexhub.com","reliabletv.me","repelisgooo.*","restorbio.com","reviewdiv.com","rexdlfile.com","rgeyyddl.skin","ridvanmau.com","riggosrag.com","ritzyporn.com","rocdacier.com","rockradio.com","rojadirecta.*","roms4ever.com","romsgames.net","romspedia.com","rossoporn.com","rottenlime.pw","roystream.com","rufiiguta.com","rumbunter.com","ruyamanga.com","s.sseluxx.com","sagewater.com","sakaiplus.com","sarapbabe.com","sassytube.com","savefiles.com","scatkings.com","scimagojr.com","scrapywar.com","scrolller.com","sendspace.com","seneporno.com","sensacine.com","seriesite.net","set.seturl.in","sex-babki.com","sexbixbox.com","sexbox.online","sexdicted.com","sexmazahd.com","sexmutant.com","sexphimhd.net","sextube-6.com","sexyscope.net","sexytrunk.com","sfastwish.com","sfirmware.com","shameless.com","share.hntv.tv","share1223.com","sharemods.com","sharkfish.xyz","sharphindi.in","shemaleup.net","short-fly.com","short1ink.com","shortlinkto.*","shortpaid.com","shorttrick.in","shownieuws.nl","shroomers.app","siimanga.cyou","simana.online","simplebits.io","sinemalar.com","sissytube.net","sitefilme.com","sitegames.net","sk8therapy.fr","skymovieshd.*","smartworld.it","smashkarts.io","snapwordz.com","socigames.com","softcobra.com","softfully.com","sohohindi.com","solarmovie.id","solarmovies.*","solotrend.net","songfacts.com","sosovalue.com","spankbang.com","spankbang.mov","speedporn.net","speedtest.net","speedweek.com","spfutures.org","spokesman.com","spontacts.com","sportbar.live","sportlemons.*","sportlemonx.*","sportowy24.pl","sportsbite.cc","sportsembed.*","sportsnest.co","sportsrec.com","sportweb.info","spring.org.uk","ssyoutube.com","stagemilk.com","stalkface.com","starsgtech.in","startpage.com","startseite.to","ster-blog.xyz","stock-rom.com","str8ongay.com","stream-69.com","stream4free.*","streambtw.com","streamcloud.*","streamfree.to","streamhd247.*","streamobs.net","streampoi.com","streamporn.cc","streamsport.*","streamta.site","streamtp1.com","streamvid.net","strefaagro.pl","striptube.net","stylist.co.uk","subtitles.cam","subtorrents.*","suedkurier.de","sufanblog.com","sulleiman.com","sunporno.club","superstream.*","supervideo.tv","supforums.com","sweetgirl.org","swisscows.com","switch520.com","sylverkat.com","sysguides.com","szexkepek.net","szexvideok.hu","t-rocforum.de","tab-maker.com","taigoforum.de","tamilarasan.*","tamilguns.org","tamilhit.tech","tapenoads.com","tatsublog.com","techacode.com","techclips.net","techdriod.com","techilife.com","techishant.in","technofino.in","techradar.com","techrecur.com","techtrim.tech","techyrick.com","teenbabe.link","tehnotone.com","tejtime24.com","teknisitv.com","temp-mail.lol","temp-mail.org","tempumail.com","tennis.stream","ternitoday.it","terrylove.com","testsieger.de","texastech.com","thejournal.ie","thelayoff.com","thememypc.net","thenation.com","thespruce.com","thetemp.email","thethings.com","thetravel.com","theuser.cloud","theweek.co.uk","thichcode.net","thiepmung.com","thotpacks.xyz","thotslife.com","thoughtco.com","tierfreund.co","tierlists.com","timescall.com","tinyzonetv.cc","tinyzonetv.se","tiz-cycling.*","tmohentai.com","to-travel.net","tok-thots.com","tokopedia.com","tokuzilla.net","topwwnews.com","torgranate.de","torrentz2eu.*","totalcsgo.com","totaldebrid.*","tourporno.com","towerofgod.me","trade2win.com","trailerhg.xyz","trangchu.news","transfaze.com","transflix.net","transtxxx.com","travelbook.de","tremamnon.com","tribeclub.com","tricksplit.io","trigonevo.com","tripsavvy.com","tsubasatr.org","tubehqxxx.com","tubemania.org","tubereader.me","tudigitale.it","tudotecno.com","tukipasti.com","tunabagel.net","tunemovie.fun","turkleech.com","tutcourse.com","tvfutbol.info","twink-hub.com","txxxporn.tube","uberhumor.com","ubuntudde.com","udemyking.com","udinetoday.it","uhcougars.com","uicflames.com","umamigirl.com","uniqueten.net","unlockapk.com","unlockxh4.com","unnuetzes.com","unterhalt.net","up4stream.com","uploadgig.com","uptoimage.com","urgayporn.com","utrockets.com","uwbadgers.com","vectorizer.io","vegamoviese.*","veoplanet.com","verhentai.top","vermoegen.org","vibestreams.*","vibraporn.com","vid-guard.com","vidaextra.com","videoplayer.*","vidora.stream","vidspeeds.com","vidstream.pro","viefaucet.com","villanova.com","vintagetube.*","vipergirls.to","vipserije.com","vipstand.pm>>","visionias.net","visnalize.com","vixenless.com","vkrovatku.com","voidtruth.com","voiranime1.fr","voirseries.io","vosfemmes.com","vpntester.org","vstplugin.net","vuinsider.com","w3layouts.com","waploaded.com","warezsite.net","watch.plex.tv","watchdirty.to","watchluna.com","watchmovies.*","watchseries.*","watchsite.net","watchtv24.com","wdpglobal.com","weatherwx.com","weirdwolf.net","wendycode.com","westmanga.org","wetpussy.sexy","wg-gesucht.de","whoreshub.com","widewifes.com","wikipekes.com","wikitechy.com","willcycle.com","windowspro.de","wkusports.com","wlz-online.de","wmoviesfree.*","wonderapk.com","workink.click","world4ufree.*","worldfree4u.*","worldsports.*","worldstar.com","worldtop2.com","wowescape.com","wunderweib.de","wvusports.com","www.amazon.de","www.seznam.cz","www.twitch.tv","x-fetish.tube","x-videos.name","xanimehub.com","xhbranch5.com","xhchannel.com","xhlease.world","xhplanet1.com","xhplanet2.com","xhvictory.com","xhwebsite.com","xmovies08.org","xnxxjapon.com","xoxocomic.com","xrivonet.info","xsportbox.com","xsportshd.com","xstory-fr.com","xxvideoss.org","xxx-image.com","xxxbunker.com","xxxcomics.org","xxxfree.watch","xxxhothub.com","xxxscenes.net","xxxvideo.asia","xxxvideor.com","y2meta-uk.com","yachtrevue.at","yandexcdn.com","yaoiotaku.com","ycongnghe.com","yesmovies.*>>","yesmovies4u.*","yeswegays.com","ymp4.download","yogitimes.com","youjizzz.club","youlife24.com","youngleak.com","youpornfm.com","youtubeai.com","yoyofilmeys.*","yumekomik.com","zamundatv.com","zerotopay.com","zigforums.com","zinkmovies.in","zmamobile.com","zoompussy.com","zorroplay.xyz","0dramacool.net","111.90.141.252","111.90.150.149","111.90.159.132","1111fullwise.*","123animehub.cc","123moviefree.*","123movierulz.*","123movies4up.*","123moviesd.com","123movieshub.*","185.193.17.214","188.166.182.72","18girlssex.com","1cloudfile.com","1pack1goal.com","1primewire.com","1shortlink.com","1stkissmanga.*","3gpterbaru.com","3rabsports.com","4everproxy.com","69hoshudaana.*","69teentube.com","90fpsconfig.in","absolugirl.com","absolutube.com","admiregirls.su","adnan-tech.com","adsafelink.com","afilmywapi.biz","agedvideos.com","airsextube.com","akumanimes.com","akutsu-san.com","alexsports.*>>","alimaniacky.cz","allbbwtube.com","allcalidad.app","allcelebs.club","allmovieshub.*","allosoccer.com","allpremium.net","allrecipes.com","alluretube.com","allwpworld.com","almezoryae.com","alphaporno.com","amanguides.com","amateurfun.net","amateurporn.co","amigosporn.top","ancensored.com","anconatoday.it","androgamer.org","androidacy.com","ani-stream.com","anime4mega.net","animeblkom.net","animefire.info","animefire.plus","animeheaven.ru","animeindo.asia","animeshqip.org","animespank.com","animesvision.*","anonymfile.com","anyxvideos.com","aozoraapps.net","appsfree4u.com","arab4media.com","arabincest.com","arabxforum.com","arealgamer.org","ariversegl.com","arlinadzgn.com","armyranger.com","articlebase.pk","artoffocas.com","ashemaletube.*","ashemaletv.com","asianporn.sexy","asianwatch.net","askpaccosi.com","askushowto.com","assesphoto.com","astro-seek.com","atlantic10.com","audiotools.pro","autocentrum.pl","autopareri.com","av1encodes.com","b3infoarena.in","balkanteka.net","bamahammer.com","bankshiksha.in","bantenexis.com","batmanstream.*","battleboats.io","bbwfuckpic.com","bcanepaltu.com","bcsnoticias.mx","bdsmstreak.com","bdsomadhan.com","bdstarshop.com","beegvideoz.com","belloporno.com","benzinpreis.de","best18porn.com","bestofarea.com","betaseries.com","bharian.com.my","bhugolinfo.com","bidersnotu.com","bildderfrau.de","bingotingo.com","bit-shares.com","bitcotasks.com","bitcrypto.info","bittukitech.in","blackcunts.org","blackteen.link","blocklayer.com","blowjobgif.net","bluearchive.gg","bluedollar.net","boersennews.de","bolly-tube.com","bollywoodx.org","bonstreams.net","boobieblog.com","boobsradar.com","boobsrealm.com","boredgiant.com","boxaoffrir.com","brainknock.net","bravoteens.com","bravotube.asia","brightpets.org","brulosophy.com","btcadspace.com","btcsatoshi.net","btvnovinite.bg","btvsports.my>>","buccaneers.com","businessua.com","bustmonkey.com","bustybloom.com","cacfutures.org","cadenadial.com","calculate.plus","calgarysun.com","camgirlbay.net","camgirlfap.com","camsstream.com","canalporno.com","caracol.com.co","cardscanner.co","carrnissan.com","casertanews.it","celebjihad.com","celebwhore.com","cellmapper.net","cesenatoday.it","chachocool.com","chanjaeblog.jp","chart.services","chatgptfree.ai","chaturflix.cam","cheatermad.com","chietitoday.it","cimanow.online","cine-calidad.*","cinelatino.net","cinemalibero.*","cinepiroca.com","citychilli.com","claimcrypto.cc","claimlite.club","clasicotas.org","clicknupload.*","clipartmax.com","cloudflare.com","cloudvideotv.*","club-flank.com","codeandkey.com","coinadpro.club","coloradoan.com","comdotgame.com","comicsarmy.com","comixzilla.com","commanders.com","compromath.com","comunio-cl.com","convert2mp3.cx","coolrom.com.au","copyseeker.net","courseboat.com","coverapi.space","coverapi.store","crackshash.com","cracksports.me","crazygames.com","crazyvidup.com","creebhills.com","crichdplays.ru","cricwatch.io>>","crm.cekresi.me","crunchyscan.fr","cryptoforu.org","cryptonetos.ru","cryptotech.fun","cryptstream.de","csgo-ranks.com","cuckoldsex.net","curseforge.com","cwtvembeds.com","cyberscoop.com","czechvideo.org","dagensnytt.com","dailylocal.com","dallasnews.com","dansmovies.com","daotranslate.*","daxfutures.org","dayuploads.com","ddwloclawek.pl","decompiler.com","defenseone.com","delcotimes.com","derstandard.at","derstandard.de","desicinema.org","desicinemas.pk","designbump.com","desiremovies.*","desktophut.com","devdrive.cloud","deviantart.com","diampokusy.com","dicariguru.com","dieblaue24.com","digipuzzle.net","direct-cloud.*","dirtytamil.com","disneyplus.com","dobletecno.com","dodgersway.com","dogsexporn.net","doseofporn.com","dotesports.com","dotfreesex.com","dotfreexxx.com","doujinnote.com","dowfutures.org","downloadming.*","drakecomic.com","dreamfancy.org","duniailkom.com","dvdgayporn.com","dvdporngay.com","e123movies.com","easytodoit.com","eatingwell.com","ecacsports.com","echo-online.de","ed-protect.org","eddiekidiw.com","eftacrypto.com","elcorreoweb.es","electomania.es","elitegoltv.org","elitetorrent.*","elmalajeno.com","emailnator.com","embedsports.me","embedstream.me","emilybites.com","empire-anime.*","emturbovid.com","emugameday.com","enryumanga.com","epicstream.com","epornstore.com","ericdraken.com","erinsakura.com","erokomiksi.com","eroprofile.com","esgentside.com","esportivos.fun","este-walks.net","estrenosflix.*","estrenosflux.*","ethiopia.co.il","examscisco.com","exbulletin.com","expertplay.net","exteenporn.com","extratorrent.*","extreme-down.*","eztvtorrent.co","f123movies.com","faaduindia.com","fairyanime.com","fakazagods.com","fakedetail.com","fanatik.com.tr","fantacalcio.it","fap-nation.org","faperplace.com","faselhdwatch.*","fastdour.store","fatxxxtube.com","faucetdump.com","fduknights.com","fetishburg.com","fettspielen.de","fhmemorial.com","fibwatch.store","filemirage.com","fileplanet.com","filesharing.io","filesupload.in","film-adult.com","filme-bune.biz","filmpertutti.*","filmy4waps.org","filmypoints.in","filmyzones.com","filtercams.com","finanztreff.de","finderporn.com","findtranny.com","fine-wings.com","firefaucet.win","fitdynamos.com","fleamerica.com","flostreams.xyz","flycutlink.com","fmoonembed.pro","foodgustoso.it","foodiesjoy.com","foodtechnos.in","football365.fr","fooxybabes.com","forex-trnd.com","fosslovers.com","foxyfolksy.com","freeforums.net","freegayporn.me","freehqtube.com","freeltc.online","freemodsapp.in","freepasses.org","freepdfcomic.*","freepreset.net","freesoccer.net","freesolana.top","freetubetv.net","freiepresse.de","freshplaza.com","freshremix.net","frostytube.com","fu-1abozhcd.nl","fu-1fbolpvq.nl","fu-4u3omzw0.nl","fu-e4nzgj78.nl","fu-m03aenr9.nl","fu-mqsng72r.nl","fu-p6pwkgig.nl","fu-pl1lqloj.nl","fu-v79xn6ct.nl","fu-ys0tjjs1.nl","fucktube4k.com","fuckundies.com","fullporner.com","fullvoyeur.com","gadgetbond.com","galleryxh.site","gamefi-mag.com","gameofporn.com","games.amny.com","games.insp.com","games.metro.us","games.metv.com","games.wtop.com","games2rule.com","games4king.com","gamesgames.com","gamesleech.com","gayforfans.com","gaypornhot.com","gayxxxtube.net","gazettenet.com","gdr-online.com","gdriveplayer.*","gearpatrol.com","gecmisi.com.tr","genovatoday.it","getintopcm.com","getintoway.com","getmaths.co.uk","gettapeads.com","gigacourse.com","gisvacancy.com","gknutshell.com","gloryshole.com","goalsport.info","gobearcats.com","gofilmizle.net","gofirmware.com","goislander.com","golightsgo.com","gomoviesfree.*","gomovieshub.io","goodreturns.in","goodstream.one","googlvideo.com","gorecenter.com","gorgeradio.com","goshockers.com","gostanford.com","gostreamon.net","goterriers.com","gotgayporn.com","gotigersgo.com","gourmandix.com","gousfbulls.com","govtportal.org","grannysex.name","grantorrent1.*","grantorrents.*","graphicget.com","grubstreet.com","guitarnick.com","gujjukhabar.in","gurbetseli.net","guruofporn.com","gutfuerdich.co","gwens-nest.com","gyanitheme.com","gyonlineng.com","hairjob.wpx.jp","haloursynow.pl","hanime1-me.top","hannibalfm.net","hardcorehd.xxx","haryanaalert.*","hausgarten.net","hawtcelebs.com","hdhub4one.pics","hdmovies23.com","hdmoviesfair.*","hdmoviesflix.*","hdmoviesmaza.*","hdpornteen.com","healthelia.com","hentai-for.net","hentai-hot.com","hentai-one.com","hentaiasmr.moe","hentaiblue.net","hentaibros.com","hentaicity.com","hentaidays.com","hentaihere.com","hentaipins.com","hentairead.com","hentaisenpai.*","hentaiteca.net","hentaiworld.tv","heysigmund.com","hidefninja.com","hilaryhahn.com","hinatasoul.com","hindilinks4u.*","hindimovies.to","hindiporno.pro","hit-erotic.com","hollymoviehd.*","homebooster.de","homeculina.com","homesports.net","hortidaily.com","hotcleaner.com","hotgirlhub.com","hotgirlpix.com","howtocivil.com","hpaudiobooks.*","hyogo.ie-t.net","hypershort.com","i123movies.net","iconmonstr.com","idealfollow.in","idlelivelink.*","ilifehacks.com","ilikecomix.com","imagetwist.com","imgjbxzjv.shop","imgjmgfgm.shop","imgjvmbbm.shop","imgnnnvbrf.sbs","inbbotlist.com","indi-share.com","indiainfo4u.in","indiatimes.com","infocycles.com","infokita17.com","infomaniakos.*","informacion.es","inhumanity.com","insidenova.com","instaporno.net","insteading.com","ios.codevn.net","iqksisgw.xyz>>","isabeleats.com","isekaitube.com","issstories.xyz","itopmusics.com","itopmusicx.com","iuhoosiers.com","jacksorrell.tv","jalshamoviez.*","janamathaya.lk","japannihon.com","japantaboo.com","javaguides.net","javbangers.com","javggvideo.xyz","javhdvideo.org","javheroine.com","javplayers.com","javsexfree.com","javsubindo.com","javtsunami.com","javxxxporn.com","jeniusplay.com","jewelry.com.my","jizzbunker.com","join2babes.com","joyousplay.xyz","jpopsingles.eu","juegoviejo.com","jugomobile.com","juicy3dsex.com","justababes.com","justembeds.xyz","kaboomtube.com","kahanighar.com","kakarotfoot.ru","kannadamasti.*","kashtanka2.com","keepkoding.com","kendralist.com","kgs-invest.com","khabarbyte.com","kickassanime.*","kickasshydra.*","kiddyshort.com","kindergeld.org","kingofdown.com","kiradream.blog","kisahdunia.com","kissmovies.net","kits4beats.com","klartext-ne.de","kokostream.net","komikmanhwa.me","kompasiana.com","kordramass.com","kurakura21.com","kuruma-news.jp","ladkibahin.com","lampungway.com","laprovincia.es","laradiobbs.net","laser-pics.com","latinatoday.it","lauradaydo.com","layardrama21.*","leaderpost.com","leahingram.com","leakedzone.com","leakshaven.com","learnospot.com","lebahmovie.com","ledauphine.com","ledgernote.com","lesboluvin.com","lesfoodies.com","letmejerk2.com","letmejerk3.com","letmejerk4.com","letmejerk5.com","letmejerk6.com","letmejerk7.com","lewdcorner.com","lifehacker.com","ligainsider.de","limetorrents.*","linemarlin.com","link.vipurl.in","linkconfig.com","livenewsof.com","lizardporn.com","login.asda.com","lokhung888.com","lookmovie186.*","ludwig-van.com","lulustream.com","m.liputan6.com","mactechnews.de","macworld.co.uk","mad4wheels.com","madchensex.com","madmaxworld.tv","mail.yahoo.com","main-spitze.de","maliekrani.com","manga4life.com","mangamovil.net","manganatos.com","mangaraw18.net","mangarawad.fit","mangareader.to","manhuascan.com","manhwaclub.net","manhwalist.com","manhwaread.com","marketbeat.com","masteranime.tv","mathepower.com","maths101.co.za","matureworld.ws","mcafee-com.com","mega-debrid.eu","megacanais.com","megalinks.info","megamovies.org","megapastes.com","mehr-tanken.de","mejortorrent.*","mercato365.com","meteologix.com","mewingzone.com","milanotoday.it","milanworld.net","milffabrik.com","minecraft.buzz","minorpatch.com","mixmods.com.br","mixrootmod.com","mjsbigblog.com","mkv-pastes.com","mobileporn.cam","mockupcity.com","modagamers.com","modapkfile.com","moddedguru.com","modenatoday.it","moderngyan.com","moegirl.org.cn","mommybunch.com","mommysucks.com","momsextube.pro","mortaltech.com","motchill29.com","motherless.com","motogpstream.*","motorgraph.com","motorsport.com","motscroises.fr","movearnpre.com","moviefree2.com","movies2watch.*","moviesapi.club","movieshd.watch","moviesjoy-to.*","moviesjoyhd.to","moviesnation.*","movingxh.world","movisubmalay.*","mtsproducoes.*","multiplayer.it","mummumtime.com","musketfire.com","mxpacgroup.com","mycoolmoviez.*","mydesibaba.com","myforecast.com","myglamwish.com","mylifetime.com","mynewsmedia.co","mypornhere.com","myporntape.com","mysexgamer.com","mysexgames.com","myshrinker.com","mytectutor.com","naasongsfree.*","naijauncut.com","nammakalvi.com","naszemiasto.pl","navysports.com","nazarickol.com","nensaysubs.net","neonxcloud.top","neservicee.com","netchimp.co.uk","new.lewd.ninja","newmovierulz.*","newsbreak24.de","newscard24.com","ngontinh24.com","nicheporno.com","nichetechy.com","nikaplayer.com","ninernoise.com","nirjonmela.com","nishankhatri.*","niteshyadav.in","nitroflare.com","niuhuskies.com","nodenspace.com","nosteam.com.ro","notunmovie.net","notunmovie.org","novaratoday.it","novel-gate.com","novelaplay.com","novelgames.com","novostrong.com","nowosci.com.pl","nudebabes.sexy","nulledbear.com","nulledteam.com","nullforums.net","nulljungle.com","nurulislam.org","nylondolls.com","ocregister.com","officedepot.fr","oggitreviso.it","ohsheglows.com","okamimiost.com","omegascans.org","onlineatlas.us","onlinekosh.com","onlineporno.cc","onlybabes.site","openstartup.tm","opentunnel.net","oregonlive.com","organismes.org","orgasmlist.com","orgyxxxhub.com","orovillemr.com","osubeavers.com","osuskinner.com","oteknologi.com","ourenseando.es","overhentai.net","palapanews.com","palofw-lab.com","pandamovies.me","pandamovies.pw","pandanote.info","pantieshub.net","pantrymama.com","panyshort.link","papafoot.click","paris-tabi.com","paste-drop.com","pathofexile.gg","paylaterin.com","peachytube.com","pelismartv.com","pelismkvhd.com","pelispedia24.*","pelispoptv.com","perfectgirls.*","perfektdamen.*","pervertium.com","perverzija.com","petitestef.com","pherotruth.com","phoneswiki.com","picgiraffe.com","picjgfjet.shop","pictryhab.shop","picturelol.com","pimylifeup.com","pinchofyum.com","pink-sluts.net","pipandebby.com","pirate4all.com","pirateblue.com","pirateblue.net","pirateblue.org","piratemods.com","pivigames.blog","planetsuzy.org","platinmods.com","play-games.com","playcast.click","player-cdn.com","player.rtl2.de","player.sbnmp.*","playermeow.com","playertv24.com","playhydrax.com","playingmtg.com","podkontrola.pl","polskatimes.pl","pop-player.com","popno-tour.net","porconocer.com","porn0video.com","pornahegao.xyz","pornasians.pro","pornerbros.com","pornflixhd.com","porngames.club","pornharlot.net","pornhd720p.com","pornincest.net","pornissimo.org","pornktubes.net","pornodavid.com","pornodoido.com","pornofelix.com","pornofisch.com","pornojenny.net","pornoperra.com","pornopics.site","pornoreino.com","pornotommy.com","pornotrack.net","pornozebra.com","pornrabbit.com","pornrewind.com","pornsocket.com","porntrex.video","porntube15.com","porntubegf.com","pornvideoq.com","pornvintage.tv","portaldoaz.org","portalyaoi.com","poscitechs.lol","powerover.site","premierftp.com","prepostseo.com","pressemedie.dk","primagames.com","primemovies.pl","primevideo.com","proapkdown.com","pruefernavi.de","puppyleaks.com","purepeople.com","pussyspace.com","pussyspace.net","pussystate.com","put-locker.com","putingfilm.com","queerdiary.com","querofilmehd.*","quest4play.xyz","questloops.com","quotesopia.com","rabbitsfun.com","radiotimes.com","radiotunes.com","rahim-soft.com","ramblinfan.com","rankersadda.in","rapid-cloud.co","ravenscans.com","rbxscripts.net","realbbwsex.com","realgfporn.com","realmoasis.com","realmomsex.com","realsimple.com","record-bee.com","recordbate.com","redfaucet.site","rednowtube.com","redpornnow.com","redtubemov.com","reggiotoday.it","reisefrage.net","resortcams.com","revealname.com","reviersport.de","reviewrate.net","revivelink.com","richtoscan.com","riminitoday.it","ringelnatz.net","ripplehub.site","rlxtech24h.com","rmacsports.org","roadtrippin.fr","robbreport.com","rokuhentai.com","rollrivers.com","rollstroll.com","romaniasoft.ro","romhustler.org","royaledudes.io","rpmplay.online","rubyvidhub.com","rugbystreams.*","ruinmyweek.com","russland.jetzt","rusteensex.com","ruyashoujo.com","safefileku.com","safemodapk.com","samaysawara.in","sanfoundry.com","saratogian.com","sat.technology","sattaguess.com","saveshared.com","savevideo.tube","sciencebe21.in","scoreland.name","scrap-blog.com","screenflash.io","screenrant.com","scriptsomg.com","scriptsrbx.com","scriptzhub.com","section215.com","seeitworks.com","seekplayer.vip","seirsanduk.com","seksualios.com","selfhacked.com","serienstream.*","series2watch.*","seriesonline.*","seriesperu.com","seriesyonkis.*","serijehaha.com","severeporn.com","sex-empire.org","sex-movies.biz","sexcams-24.com","sexgamescc.com","sexgayplus.com","sextubedot.com","sextubefun.com","sextubeset.com","sexvideos.host","sexyaporno.com","sexybabes.club","sexybabesz.com","sexynakeds.com","sgvtribune.com","shadowverse.gg","shahid.mbc.net","sharedwebs.com","shazysport.pro","sheamateur.com","shegotass.info","sheikhmovies.*","shesfreaky.com","shinobijawi.id","shooshtime.com","shop123.com.tw","short-url.link","short-zero.com","shorterall.com","shrinkearn.com","shueisharaw.tv","shupirates.com","sieutamphim.me","siliconera.com","singjupost.com","sitarchive.com","sitemini.io.vn","siusalukis.com","skat-karten.de","slickdeals.net","slideshare.net","smartinhome.pl","smarttrend.xyz","smiechawatv.pl","smoothdraw.com","snhupenmen.com","solidfiles.com","soranews24.com","soundboards.gg","spaziogames.it","speedostream.*","speedynews.xyz","speisekarte.de","spiele.bild.de","spieletipps.de","spiritword.net","spoilerplus.tv","sporteurope.tv","sportsdark.com","sportsnaut.com","sportsonline.*","sportsurge.net","spy-x-family.*","stadelahly.net","stahnivideo.cz","standard.co.uk","stardewids.com","starzunion.com","stbemuiptv.com","steamverde.net","stireazilei.eu","storiesig.info","storyblack.com","stownrusis.com","stream2watch.*","streamecho.top","streamlord.com","streamruby.com","stripehype.com","studydhaba.com","studyfinds.org","subtitleone.cc","subtorrents1.*","sugarapron.com","super-games.cz","superanimes.in","suvvehicle.com","svetserialu.io","svetserialu.to","swatchseries.*","swordalada.org","tainhanhvn.com","talkceltic.net","talkjarvis.com","tamilnaadi.com","tamilprint29.*","tamilprint30.*","tamilprint31.*","tamilprinthd.*","taradinhos.com","tarnkappe.info","taschenhirn.de","tech-blogs.com","tech-story.net","techhelpbd.com","techiestalk.in","techkeshri.com","techmyntra.net","techperiod.com","techsignin.com","techsslash.com","tecnoaldia.net","tecnobillo.com","tecnoscann.com","tecnoyfoto.com","teenager365.to","teenextrem.com","teenhubxxx.com","teensexass.com","tekkenmods.com","telemagazyn.pl","telesrbija.com","temp.modpro.co","tennisactu.net","testserver.pro","textograto.com","textovisia.com","texturecan.com","theargus.co.uk","theavtimes.com","thefantazy.com","thefitchen.com","theflixertv.to","thehesgoal.com","themeslide.com","thenetnaija.co","thepiratebay.*","theporngod.com","therichest.com","thesextube.net","thetakeout.com","thethothub.com","thetimes.co.uk","thevideome.com","thewambugu.com","thotchicks.com","titsintops.com","tojimangas.com","tomshardware.*","topcartoons.tv","topsporter.net","topwebgirls.eu","torinotoday.it","tormalayalam.*","torontosun.com","torovalley.net","torrentmac.net","totalsportek.*","tournguide.com","tous-sports.ru","towerofgod.top","toyokeizai.net","tpornstars.com","trafficnews.jp","trancehost.com","trannyline.com","trashbytes.net","traumporno.com","treehugger.com","trendflatt.com","trentonian.com","trentotoday.it","tribunnews.com","tronxminer.com","truckscout24.*","tuberzporn.com","tubesafari.com","tubexxxone.com","tukangsapu.net","turbocloud.xyz","turkish123.com","tv-films.co.uk","tv.youtube.com","tvspielfilm.de","twincities.com","u123movies.com","ucfknights.com","uciteljica.net","uclabruins.com","ufreegames.com","uiuxsource.com","uktvplay.co.uk","unblocked.name","unblocksite.pw","uncpbraves.com","uncwsports.com","unionmanga.xyz","unlvrebels.com","uoflsports.com","uploadbank.com","uploadking.net","uploadmall.com","uploadraja.com","upnewsinfo.com","uptostream.com","urlbluemedia.*","usctrojans.com","usdtoreros.com","usersdrive.com","utepminers.com","uyduportal.net","v2movies.click","vavada5com.com","vbox7-mp3.info","vedamdigi.tech","vegamovies4u.*","vegamovvies.to","vestimage.site","video-seed.xyz","video1tube.com","videogamer.com","videolyrics.in","videos1002.com","videoseyred.in","videosgays.net","vidguardto.xyz","vidhidepre.com","vidhidevip.com","vidstreams.net","view.ceros.com","viewmature.com","vikistream.com","viralpedia.pro","visortecno.com","vmorecloud.com","voiceloves.com","voipreview.org","voltupload.com","voyeurblog.net","vulgarmilf.com","vviruslove.com","wantmature.com","warefree01.com","watch-series.*","watchasians.cc","watchomovies.*","watchpornx.com","watchseries1.*","watchseries9.*","wcoanimedub.tv","wcoanimesub.tv","wcoforever.net","weatherx.co.in","webseries.club","weihnachten.me","wellplated.com","wenxuecity.com","westmanga.info","wetteronline.*","whatfontis.com","whatismyip.com","whats-new.cyou","whatshowto.com","whodatdish.com","whoisnovel.com","wiacsports.com","wifi4games.com","windbreaker.me","wizhdsports.fi","wkutickets.com","wmubroncos.com","womennaked.net","wordpredia.com","world4ufree1.*","worldofbin.com","wort-suchen.de","worthcrete.com","wow-mature.com","wowxxxtube.com","wspolczesna.pl","wsucougars.com","www-y2mate.com","www.amazon.com","www.lenovo.com","www.reddit.com","www.tiktok.com","x2download.com","xanimeporn.com","xclusivejams.*","xdld.pages.dev","xerifetech.com","xfrenchies.com","xhamster46.com","xhofficial.com","xhomealone.com","xhwebsite2.com","xhwebsite5.com","xiaomi-miui.gr","xmegadrive.com","xnxxporn.video","xxx-videos.org","xxxbfvideo.net","xxxblowjob.pro","xxxdessert.com","xxxextreme.org","xxxtubedot.com","xxxtubezoo.com","xxxvideohd.net","xxxxselfie.com","xxxymovies.com","xxxyoungtv.com","yabaisub.cloud","yakisurume.com","yarnutopia.com","yelitzonpc.com","yomucomics.com","yottachess.com","youngbelle.net","youporngay.com","youtubetomp3.*","yoututosjeff.*","yuki0918kw.com","yumstories.com","yunakhaber.com","zazzybabes.com","zertalious.xyz","zippyshare.day","zona-leros.com","zonebourse.com","zooredtube.com","10hitmovies.com","123movies-org.*","123moviesfree.*","123moviesfun.is","18-teen-sex.com","18asiantube.com","18porncomic.com","18teen-tube.com","1direct-cloud.*","1vid1shar.space","2tamilprint.pro","3xamatorszex.hu","4allprograms.me","5masterzzz.site","6indianporn.com","a-z-animals.com","acedarspoon.com","admediaflex.com","adminreboot.com","adrianoluis.net","adrinolinks.com","advicefunda.com","adz7short.space","aeroxplorer.com","aflamsexnek.com","aflizmovies.com","agrarwetter.net","ai.hubtoday.app","aitoolsfree.org","alanyapower.com","aliezstream.pro","alldeepfake.ink","alldownplay.xyz","allotech-dz.com","allpussynow.com","alltechnerd.com","amazon-love.com","amritadrino.com","anallievent.com","androidapks.biz","androidsite.net","androjungle.com","anime-sanka.com","anime7.download","animedao.com.ru","animesexbar.com","animesultra.net","animexxxsex.com","antenasports.ru","aoashimanga.com","apfelpatient.de","apkmagic.com.ar","app.blubank.com","arabshentai.com","arcadepunks.com","archivebate.com","archiwumalle.pl","argio-logic.net","asia.5ivttv.vip","asiangaysex.net","asianhdplay.net","askcerebrum.com","astrumscans.xyz","atemporal.cloud","atleticalive.it","atresplayer.com","au-di-tions.com","auto-service.de","autoindustry.ro","automat.systems","automothink.com","averiecooks.com","avoiderrors.com","awdescargas.com","azcardinals.com","babesaround.com","babesinporn.com","babesxworld.com","badgehungry.com","bangpremier.com","baylorbears.com","bdsm-photos.com","bdsmkingdom.xyz","bdsmporntub.com","bdsmwaytube.com","beammeup.com.au","bedavahesap.org","beingmelody.com","bellezashot.com","bengalisite.com","bengalxpress.in","bentasker.co.uk","best-shopme.com","best18teens.com","bestialporn.com","beurettekeh.com","bgmateriali.com","bgmi32bitapk.in","bgsufalcons.com","bibliopanda.com","big12sports.com","bigboobs.com.es","bigtitslust.com","bike-urious.com","bintangplus.com","biologianet.com","blackavelic.com","blackpornhq.com","blacksexmix.com","blogenginee.com","blogpascher.com","blowxxxtube.com","bluebuddies.com","bluedrake42.com","bluemanhoop.com","bluemediafile.*","bluemedialink.*","bluemediaurls.*","bokepsin.in.net","bolly4umovies.*","bollydrive.rest","boobs-mania.com","boobsforfun.com","bookpraiser.com","boosterx.stream","boxingstream.me","boxingvideo.org","boyfriendtv.com","braziliannr.com","bresciatoday.it","brieffreunde.de","brother-usa.com","budgetbytes.com","buffsports.io>>","buffstreamz.com","buickforums.com","bulbagarden.net","bunkr-albums.io","burningseries.*","buzzheavier.com","cafedelites.com","camwhoreshd.com","camwhorespy.com","camwhorez.video","captionpost.com","carbonite.co.za","casutalaurei.ro","cataniatoday.it","catchthrust.net","cempakajaya.com","cerberusapp.com","chatropolis.com","cheatglobal.com","check-imei.info","cheese-cake.net","cherrynudes.com","chromeready.com","cieonline.co.uk","cinemakottaga.*","cineplus123.org","citibank.com.sg","ciudadgamer.com","claimclicks.com","claimcoins.site","classicoder.com","classifarms.com","cloud9obits.com","cloudnestra.com","code-source.net","codeitworld.com","codemystery.com","codeproject.com","coloringpage.eu","comicsporno.xxx","comoinstalar.me","compucalitv.com","computerbild.de","consoleroms.com","coromon.wiki.gg","cosplaynsfw.xyz","coursewikia.com","cpomagazine.com","cracking-dz.com","crackthemes.com","crazyashwin.com","crazydeals.live","creditsgoal.com","crunchyroll.com","crunchytech.net","cryptoearns.com","cta-fansite.com","cubbiescrib.com","cumshotlist.com","cutiecomics.com","cyberlynews.com","cybertechng.com","cyclingnews.com","cycraracing.com","daemonanime.net","daily-times.com","dailyangels.com","dailybreeze.com","dailycaller.com","dailycamera.com","dailyecho.co.uk","dailyknicks.com","dailymail.co.uk","dailymotion.com","dailypost.co.uk","dailystar.co.uk","dark-gaming.com","dawindycity.com","db-creation.net","dbupatriots.com","dbupatriots.org","deathonnews.com","decomaniacos.es","definitions.net","desbloqueador.*","descargas2020.*","desirenovel.com","desixxxtube.org","detikbangka.com","deutschsex.mobi","devopslanka.com","dhankasamaj.com","digimonzone.com","digiztechno.com","diminimalis.com","direct-cloud.me","dirtybadger.com","discoveryplus.*","diversanews.com","dlouha-videa.cz","dobleaccion.xyz","docs.google.com","dollarindex.org","domainwheel.com","donnaglamour.it","donnerwetter.de","dopomininfo.com","dota2freaks.com","dotadostube.com","downphanmem.com","drake-scans.com","drakerelays.org","drama-online.tv","dramanice.video","dreamcheeky.com","drinksmixer.com","driveplayer.net","droidmirror.com","dtbps3games.com","duplex-full.lol","eaglesnovel.com","easylinkref.com","ebaticalfel.com","editorsadda.com","edmontonsun.com","edumailfree.com","eksporimpor.com","elektrikmen.com","elpasotimes.com","elperiodico.com","embed.acast.com","embed.meomeo.pw","embedcanais.com","embedsports.top","embedstreams.me","emperorscan.com","empire-stream.*","engstreams.shop","enryucomics.com","erotikclub35.pw","esportsmonk.com","esportsnext.com","exactpay.online","exam-results.in","excelchamps.com","expedition33.gg","explorecams.com","explorosity.net","exporntoons.net","exposestrat.com","extrapetite.com","extratorrents.*","fabioambrosi.it","farmeramania.de","faselhd-watch.*","faucetbravo.fun","fcportables.com","fellowsfilm.com","femdomworld.com","femjoybabes.com","feral-heart.com","fidlarmusic.com","file-upload.net","file.gocmod.com","filecrate.store","filehost9.com>>","filespayout.com","filmesonlinex.*","filmoviplex.com","filmy4wap.co.in","filmyzilla5.com","finalnews24.com","financebolo.com","financemonk.net","financewada.com","financeyogi.net","finanzfrage.net","findnewjobz.com","fingerprint.com","firmenwissen.de","fiveyardlab.com","fizzlefakten.de","flashsports.org","flordeloto.site","flyanimes.cloud","flygbussarna.se","folgenporno.com","foodandwine.com","footyhunter.lol","forex-yours.com","foxseotools.com","framedcooks.com","freebitcoin.win","freebnbcoin.com","freecardano.com","freecourse.tech","freecricket.net","freegames44.com","freemockups.org","freeomovie.info","freepornjpg.com","freepornsex.net","freethemesy.com","freevpshere.com","freewebcart.com","french-stream.*","fsportshd.xyz>>","ftsefutures.org","fu-12qjdjqh.lol","fu-c66heipu.lol","fu-hbr4fzp4.lol","fu-hjyo3jqu.lol","fu-l6d0ptc6.lol","fuckedporno.com","fuckingfast.net","fullfilmizle.cc","fullxxxporn.net","fun-squared.com","fztvseries.live","g-streaming.com","gadgetspidy.com","gadzetomania.pl","gamecopyworld.*","gameplayneo.com","gamersglobal.de","games.macon.com","games.word.tips","gamesaktuell.de","gamestorrents.*","gaming-fans.com","gaminginfos.com","gamingsmart.com","gamingvital.com","gartendialog.de","gayboystube.top","gaypornhdfree.*","gaypornlove.net","gaypornwave.com","gayvidsclub.com","gazetaprawna.pl","geiriadur.ac.uk","geissblog.koeln","gendatabase.com","georgiadogs.com","germanvibes.org","gesund-vital.de","getexploits.com","gewinnspiele.tv","gfx-station.com","girlssexxxx.com","givemeaporn.com","givemesport.com","glavmatures.com","globaldjmix.com","gocreighton.com","godairyfree.org","goexplorers.com","gofetishsex.com","gofile.download","gogoanime.co.in","goislanders.com","gokushiteki.com","golderotica.com","golfchannel.com","gomacsports.com","gomarquette.com","gopsusports.com","goxxxvideos.com","goyoungporn.com","gradehgplus.com","grandmatube.pro","grannyfucko.com","grasshopper.com","greattopten.com","grootnovels.com","gsmfirmware.net","gsmfreezone.com","gsmmessages.com","gut-erklaert.de","hacksnation.com","handypornos.net","hanimesubth.com","hardcoreluv.com","hardwareluxx.de","hardxxxmoms.com","harshfaucet.com","hd-analporn.com","hd-easyporn.com","hdjavonline.com","hds-streaming.*","hdstreamss.club","healthfatal.com","heavyfetish.com","heidelberg24.de","helicomicro.com","hentai-moon.com","hentai-senpai.*","hentai2read.com","hentaiarena.com","hentaibatch.com","hentaibooty.com","hentaicloud.com","hentaicovid.org","hentaifreak.org","hentaigames.app","hentaihaven.com","hentaihaven.red","hentaihaven.vip","hentaihaven.xxx","hentaiporno.xxx","hentaipulse.com","hentaitube1.lol","heroine-xxx.com","hertoolbelt.com","hesgoal-live.io","hiddencamhd.com","hindinews360.in","hokiesports.com","hollaforums.com","hollymoviehd.cc","hollywoodpq.com","honeyandlime.co","hookupnovel.com","hostserverz.com","hot-cartoon.com","hotgameplus.com","hotmediahub.com","hotpornfile.org","hotsexstory.xyz","hotstunners.com","hotxxxpussy.com","hqxxxmovies.com","hscprojects.com","hummusapien.com","hypicmodapk.org","iban-rechner.de","ibcomputing.com","ibeconomist.com","ideal-teens.com","ikramlar.online","ilbassoadige.it","ilgazzettino.it","illicoporno.com","ilmessaggero.it","ilovetoplay.xyz","ilsole24ore.com","imagelovers.com","imgqnnnebrf.sbs","incgrepacks.com","indiakablog.com","infrafandub.com","inside-handy.de","instabiosai.com","insuredhome.org","interracial.com","investcrust.com","inyatrust.co.in","iptvjournal.com","italianoxxx.com","itsonsitetv.com","iwantmature.com","januflix.expert","japangaysex.com","japansporno.com","japanxxxass.com","jastrzabpost.pl","jav-torrent.org","javcensored.net","javenglish.cc>>","javindosub.site","javmoviexxx.com","javpornfull.com","javraveclub.com","javteentube.com","javtrailers.com","jaysjournal.com","jessifearon.com","jetztspielen.de","jobslampung.net","johntryopen.com","jokerscores.com","juliasalbum.com","just-upload.com","kabarportal.com","karaoketexty.cz","kasvekuvvet.net","katmoviehd4.com","kattannonser.se","kawarthanow.com","keezmovies.surf","ketoconnect.net","ketubanjiwa.com","kickass-anime.*","kickassanime.ch","kiddyearner.com","kingsleynyc.com","kisshentaiz.com","kitabmarkaz.xyz","kittycatcam.com","kodewebsite.com","komikdewasa.art","komorkomania.pl","krakenfiles.com","kreiszeitung.de","krktcountry.com","kstorymedia.com","kurierverlag.de","kyoto-kanko.net","la123movies.org","langitmovie.com","laptechinfo.com","latinluchas.com","lavozdigital.es","ldoceonline.com","learnedclub.com","lecrabeinfo.net","legionscans.com","lendrive.web.id","lesbiansex.best","levante-emv.com","libertycity.net","librasol.com.br","liga3-online.de","lightsnovel.com","link.3dmili.com","link.asiaon.top","link.cgtips.org","link.codevn.net","linksheild.site","linkss.rcccn.in","linkvertise.com","linux-talks.com","live.arynews.tv","livesport24.net","livestreames.us","livestreamtv.pk","livexscores.com","livingathome.de","livornotoday.it","lombardiave.com","lookmoviess.com","looptorrent.org","lotusgamehd.xyz","lovelynudez.com","lovingsiren.com","luchaonline.com","lucrebem.com.br","lukesitturn.com","lulustream.live","lustesthd.cloud","lycee-maroc.com","macombdaily.com","macrotrends.net","magdownload.org","maisonbrico.com","mangahentai.xyz","mangahere.today","mangakakalot.gg","mangaonline.fun","mangaraw1001.cc","mangarawjp.asia","mangaromance.eu","mangarussia.com","manhuarmmtl.com","manhwahentai.me","manoramamax.com","mantrazscan.com","marie-claire.es","marimo-info.net","marketmovers.it","marvelrivals.gg","maskinbladet.dk","mastakongo.info","mathsstudio.com","mathstutor.life","maxcheaters.com","maxjizztube.com","maxstream.video","maxtubeporn.net","me-encantas.com","medeberiya.site","medeberiya1.com","medeberiyaa.com","medeberiyas.com","medeberiyax.com","mediacast.click","mega4upload.com","mega4upload.net","mejortorrento.*","mejortorrents.*","mejortorrentt.*","memoriadatv.com","mentalfloss.com","mercerbears.com","mercurynews.com","messinatoday.it","metal-hammer.de","milliyet.com.tr","miniminiplus.pl","minutolivre.com","mirrorpoi.my.id","mixrootmods.com","mmsmasala27.com","mobility.com.ng","mockuphunts.com","modporntube.com","moflix-stream.*","molbiotools.com","mommy-pussy.com","momtubeporn.xxx","motherporno.com","mov18plus.cloud","moviemaniak.com","movierulzfree.*","movierulzlink.*","movies2watch.tv","moviescounter.*","moviesonline.fm","moviessources.*","moviessquad.com","movieuniverse.*","mp3fromyou.tube","mrdeepfakes.com","mscdroidlabs.es","msdos-games.com","msonglyrics.com","msuspartans.com","muchohentai.com","multifaucet.org","musiclutter.xyz","musikexpress.de","mybestxtube.com","mydesiboobs.com","myfreeblack.com","mysexybabes.com","mywatchseries.*","myyoungbabe.com","mzansinudes.com","naijanowell.com","naijaray.com.ng","nakedbabes.club","nangiphotos.com","nativesurge.net","nativesurge.top","naughtyza.co.za","nbareplayhd.com","nbcolympics.com","necksdesign.com","needgayporn.com","nekopoicare.*>>","netflixlife.com","networkhint.com","news-herald.com","news-leader.com","newstechone.com","newyorkjets.com","nflspinzone.com","nicexxxtube.com","nizarstream.com","noindexscan.com","noithatmyphu.vn","nokiahacking.pl","nomnompaleo.com","nosteamgames.ro","notebookcheck.*","notesformsc.org","noteshacker.com","notunmovie.link","novelssites.com","nsbtmemoir.site","nsfwmonster.com","nsfwyoutube.com","nswdownload.com","nu6i-bg-net.com","nudeslegion.com","nudismteens.com","nukedpacks.site","nullscripts.net","nursexfilme.com","nutmegnanny.com","nyaatorrent.com","oceanofmovies.*","ohmirevista.com","okiemrolnika.pl","olamovies.store","olympustaff.com","omgexploits.com","online-smss.com","onlinekosten.de","open3dmodel.com","openculture.com","openloading.com","order-order.com","orgasmatrix.com","oromedicine.com","otokukensaku.jp","otomi-games.com","ourcoincash.xyz","oyundunyasi.net","ozulscansen.com","pacersports.com","pageflutter.com","pakkotoisto.com","palermotoday.it","panda-novel.com","pandamovies.org","pandasnovel.com","paperzonevn.com","pawastreams.org","pawastreams.pro","pcgameszone.com","peliculas8k.com","peliculasmx.net","pelisflix20.*>>","pelismarthd.com","pelisxporno.net","pendekarsubs.us","pepperlive.info","perezhilton.com","perfektdamen.co","persianhive.com","perugiatoday.it","pewresearch.org","pflege-info.net","phonerotica.com","phongroblox.com","phpscripttr.com","pianetalecce.it","pics4upload.com","picxnkjkhdf.sbs","pimpandhost.com","pinoyalbums.com","pinoyrecipe.net","piratehaven.xyz","pisshamster.com","pixdfdjkkr.shop","pixkfjtrkf.shop","planetfools.com","platinporno.com","play.hbomax.com","player.msmini.*","plugincrack.com","pocket-lint.com","popcornstream.*","popdaily.com.tw","porhubvideo.com","porn-monkey.com","pornexpanse.com","pornfactors.com","porngameshd.com","pornhegemon.com","pornhoarder.net","porninblack.com","porno-porno.net","porno-rolik.com","pornohammer.com","pornohirsch.net","pornoklinge.com","pornomanoir.com","pornrusskoe.com","portable4pc.com","powergam.online","premiumporn.org","privatemoviez.*","projectfreetv.*","promimedien.com","prouddogmom.com","proxydocker.com","punishworld.com","purelyceleb.com","pussy3dporn.com","pussyhothub.com","qatarstreams.me","quiltfusion.com","quotesshine.com","r1.richtoon.top","rackusreads.com","radionatale.com","radionylive.com","radiorockon.com","railwebcams.net","rajssoid.online","rangerboard.com","ravennatoday.it","rctechsworld.in","readbitcoin.org","readhunters.xyz","readingpage.fun","redpornblog.com","remodelista.com","rennrad-news.de","renoconcrete.ca","rentbyowner.com","reportera.co.kr","restegourmet.de","retroporn.world","risingapple.com","ritacandida.com","robot-forum.com","rojadirectatv.*","rollingstone.de","romaierioggi.it","romfirmware.com","root-nation.com","route-fifty.com","rule34vault.com","runnersworld.de","rushuploads.com","ryansharich.com","saabcentral.com","salernotoday.it","samapkstore.com","sampledrive.org","samuraiscan.com","samuraiscan.org","santhoshrcf.com","satoshi-win.xyz","savealoonie.com","scatnetwork.com","schwaebische.de","sdmoviespoint.*","sekaikomik.live","serienstream.to","seriesmetro.net","seriesonline.sx","seriouseats.com","serverbd247.com","serviceemmc.com","setfucktube.com","sex-torrent.net","sexanimesex.com","sexoverdose.com","sexseeimage.com","sexwebvideo.com","sexxxanimal.com","sexy-parade.com","sexyerotica.net","seznamzpravy.cz","sfmcompile.club","shadagetech.com","shadowrangers.*","sharegdrive.com","sharinghubs.com","shemalegape.net","shomareh-yab.ir","shopkensaku.com","short-jambo.ink","showcamrips.com","showrovblog.com","shrugemojis.com","shugraithou.com","siamfishing.com","sieutamphim.org","singingdalong.*","siriusfiles.com","sitetorrent.com","sivackidrum.net","skinnytaste.com","slapthesign.com","sleazedepot.com","sleazyneasy.com","smartcharts.net","sms-anonyme.net","sms-receive.net","smsonline.cloud","smumustangs.com","soconsports.com","software-on.com","softwaresde.com","solarchaine.com","sommerporno.com","sondriotoday.it","souq-design.com","sourceforge.net","spanishdict.com","spardhanews.com","sport890.com.uy","sports-stream.*","sportsblend.net","sportsonline.si","sportsonline.so","sportsplays.com","sportsseoul.com","sportstiger.com","sportstreamtv.*","starstreams.pro","start-to-run.be","stbemuiptvn.com","sterkinekor.com","stream.bunkr.ru","streamnoads.com","stronakobiet.pl","studybullet.com","subtitlecat.com","sueddeutsche.de","suicidepics.com","sullacollina.it","sumirekeiba.com","suneelkevat.com","superdeporte.es","superembeds.com","supermarches.ca","supermovies.org","svethardware.cz","swift4claim.com","syracusefan.com","tabooanime.club","tagesspiegel.de","tamilanzone.com","tamilultra.team","tapeantiads.com","tapeblocker.com","team-octavi.com","techacrobat.com","techadvisor.com","techastuces.com","techedubyte.com","techinferno.com","technichero.com","technorozen.com","techoreview.com","techprakash.com","techsbucket.com","techyhigher.com","techymedies.com","tedenglish.site","teen-hd-sex.com","teenfucksex.com","teenpornjpg.com","teensextube.xxx","teenxxxporn.pro","telegraph.co.uk","telepisodes.org","temporeale.info","tenbaiquest.com","tenies-online.*","tennisonline.me","tennisstreams.*","teracourses.com","texassports.com","textreverse.com","thaiairways.com","the-mystery.org","the2seasons.com","the5krunner.com","theappstore.org","thebarchive.com","thebigblogs.com","theclashify.com","thedilyblog.com","thejetpress.com","thejoblives.com","themoviesflix.*","theprovince.com","thereporter.com","thestreameast.*","thetoneking.com","theusaposts.com","thewebflash.com","theyarehuge.com","thingiverse.com","thingstomen.com","thisisrussia.io","thueringen24.de","thumpertalk.com","ticketmaster.sg","tickhosting.com","ticonsiglio.com","tieba.baidu.com","tienganhedu.com","tires.costco.ca","today-obits.com","todopolicia.com","toeflgratis.com","tokyomotion.com","tokyomotion.net","toledoblade.com","topnewsshow.com","topperpoint.com","topstarnews.net","torascripts.org","tornadomovies.*","torrentgalaxy.*","torrentgame.org","torrentstatus.*","torresette.news","tradingview.com","transfermarkt.*","trendohunts.com","trevisotoday.it","triesteprima.it","true-gaming.net","trytutorial.com","tubegaytube.com","tubepornnow.com","tudongnghia.com","tuktukcinma.com","turbovidhls.com","turkeymenus.com","tusachmanga.com","tvanouvelles.ca","tvsportslive.fr","twistedporn.com","twitchnosub.com","tyler-brown.com","u6lyxl0w.skin>>","ukathletics.com","ukaudiomart.com","ultramovies.org","undeniable.info","underhentai.net","unipanthers.com","updateroj24.com","uploadbeast.com","uploadcloud.pro","usaudiomart.com","user.guancha.cn","vectogravic.com","veekyforums.com","vegamovies3.org","veneziatoday.it","verpelis.gratis","veryfuntime.com","verywellfit.com","vfxdownload.net","vibezhub.com.ng","vicenzatoday.it","viciante.com.br","vidcloudpng.com","video.genyt.net","videodidixx.com","videosputas.xxx","vidsrc-embed.ru","vik1ngfile.site","ville-ideale.fr","viralharami.com","viralxvideos.es","voyageforum.com","vtplayer.online","wantedbabes.com","warmteensex.com","watch-my-gf.com","watch.sling.com","watchf1full.com","watchfreexxx.pw","watchhentai.net","watchmovieshd.*","watchporn4k.com","watchpornfree.*","watchseries8.to","watchserieshd.*","watchtvseries.*","watchxxxfree.pw","webmatrices.com","webnovelpub.com","webtoonscan.com","wegotcookies.co","welovemanga.one","weltfussball.at","wemakesites.net","wheelofgold.com","wholenotism.com","wholevideos.com","wieistmeineip.*","wikijankari.com","wikipooster.com","wikisharing.com","windowslite.net","windsorstar.com","witcherhour.com","womenshealth.de","worldgyan18.com","worldofiptv.com","worldsports.*>>","wowpornlist.xyz","wowyoungsex.com","wpgdadatong.com","wristreview.com","writeprofit.org","www.youtube.com","xfuckonline.com","xhardhempus.net","xianzhenyuan.cn","xiaomitools.com","xkeezmovies.com","xmoviesforyou.*","xn--31byd1i.net","xnudevideos.com","xnxxhamster.net","xxxindianporn.*","xxxparodyhd.net","xxxpornmilf.com","xxxtubegain.com","xxxtubenote.com","xxxtubepass.com","xxxwebdlxxx.top","yanksgoyard.com","yazilidayim.net","yesmovies123.me","yeutienganh.com","yogablogfit.com","yomoviesnow.com","yorkpress.co.uk","youlikeboys.com","youmedemblik.nl","young-pussy.com","youranshare.com","yourporngod.com","youtubekids.com","yrtourguide.com","ytconverter.app","yuramanga.my.id","zeroradio.co.uk","zonavideosx.com","zone-annuaire.*","zoominar.online","007stockchat.com","123movies-free.*","18-teen-porn.com","18-teen-tube.com","18adultgames.com","18comic-gquu.vip","1movielinkbd.com","1movierulzhd.pro","24pornvideos.com","2kspecialist.net","4fingermusic.com","8-ball-magic.com","9now.nine.com.au","about-drinks.com","acouplecooks.com","activevoyeur.com","activistpost.com","actresstoday.com","adblockstrtape.*","adblockstrtech.*","adult-empire.com","adultoffline.com","adultporn.com.es","advertafrica.net","agedtubeporn.com","aghasolution.com","aheadofthyme.com","ajaxshowtime.com","ajkalerbarta.com","alleveilingen.be","alleveilingen.nl","alliptvlinks.com","allporncomic.com","alphagames4u.com","alphapolis.co.jp","alphasource.site","altselection.com","anakteknik.co.id","analsexstars.com","analxxxvideo.com","androidadult.com","androidfacil.org","androidgreek.com","androidspill.com","anime-odcinki.pl","animesexclip.com","animetwixtor.com","animixstream.com","antennasports.ru","aopathletics.org","apkandroidhub.in","app.simracing.gp","applediagram.com","aquariumgays.com","arezzonotizie.it","articlesmania.me","asianmassage.xyz","asianpornjav.com","assettoworld.com","asyaanimeleri.pw","atlantisscan.com","auburntigers.com","audiofanzine.com","audycje.tokfm.pl","autotrader.co.uk","avellinotoday.it","azamericasat.net","azby.fmworld.net","baby-vornamen.de","backfirstwo.site","backyardboss.net","backyardpapa.com","bangyourwife.com","barbarabakes.com","barrier-free.net","bcuathletics.com","beaddiagrams.com","beritabangka.com","berlin-teltow.de","bestasiansex.pro","bestblackgay.com","bestcash2020.com","bestgamehack.top","bestgrannies.com","besthdmovies.com","bestpornflix.com","bestsextoons.com","biblegateway.com","bigbuttshub2.top","bikeportland.org","bisceglielive.it","bitchesgirls.com","blackandteal.com","blog.livedoor.jp","blowjobfucks.com","bloxinformer.com","bloxyscripts.com","bluemediafiles.*","bluerabbitrx.com","bmw-scooters.com","boardingarea.com","boerse-online.de","bollywoodfilma.*","bondagevalley.cc","booksbybunny.com","boolwowgirls.com","bootstrample.com","bostonherald.com","boysxclusive.com","brandbrief.co.kr","bravoerotica.com","bravoerotica.net","breatheheavy.com","breedingmoms.com","buffalobills.com","buffalowdown.com","businesstrend.jp","butlersports.com","butterpolish.com","call2friends.com","caminspector.net","campusfrance.org","camvideoshub.com","camwhoresbay.com","caneswarning.com","cartoonporno.xxx","catmovie.website","ccnworldtech.com","celtadigital.com","cervezaporno.com","championdrive.co","charexempire.com","chattanoogan.com","cheatography.com","chelsea24news.pl","chicagobears.com","chieflyoffer.com","choiceofmods.com","chubbyelders.com","cizzyscripts.com","claimsatoshi.xyz","clever-tanken.de","clickforhire.com","clickndownload.*","clipconverter.cc","cloudgallery.net","cmumavericks.com","coin-profits.xyz","collegehdsex.com","colliersnews.com","coloredmanga.com","comeletspray.com","cometogliere.com","comicspornos.com","comicspornow.com","comicsvalley.com","computerpedia.in","convert2mp3.club","convertinmp4.com","cookincanuck.com","courseleader.net","cr7-soccer.store","cracksports.me>>","criptologico.com","cryptoclicks.net","cryptofactss.com","cryptofaucet.xyz","cryptokinews.com","cryptomonitor.in","culinaryhill.com","cybercityhelp.in","cyberstumble.com","cyclingabout.com","cydiasources.net","dailyboulder.com","dailypudding.com","dailytips247.com","dailyuploads.net","darknessporn.com","darkwanderer.net","dasgelbeblatt.de","dataunlocker.com","dattebayo-br.com","davewigstone.com","dayoftheweek.org","daytonflyers.com","ddl-francais.com","deepfakeporn.net","deepswapnude.com","demonicscans.org","designparty.sx>>","destiny2zone.com","detroitlions.com","diariodeibiza.es","dirtytubemix.com","discoveryplus.in","djremixganna.com","doanhnghiepvn.vn","dobrapogoda24.pl","dobreprogramy.pl","donghuaworld.com","dorsetecho.co.uk","downloadapk.info","downloadbatch.me","downloadsite.org","downloadsoft.net","dpscomputing.com","drummagazine.com","dryscalpgone.com","dualshockers.com","duplichecker.com","dvdgayonline.com","earncrypto.co.in","eartheclipse.com","eastbaytimes.com","easyexploits.com","easymilftube.net","ebook-hunter.org","ecom.wixapps.net","edufileshare.com","einfachschoen.me","eleceedmanhwa.me","eletronicabr.com","elevationmap.net","eliobenedetto.it","embedseek.online","embedstreams.top","empire-anime.com","emulatorsite.com","english101.co.za","erotichunter.com","eslauthority.com","esportstales.com","everysextube.com","ewrc-results.com","exclusivomen.com","fallbrook247.com","familyminded.com","familyporner.com","famousnipple.com","fastdownload.top","fattelodasolo.it","fatwhitebutt.com","faucetcrypto.com","faucetcrypto.net","favefreeporn.com","favoyeurtube.net","feedmephoebe.com","fernsehserien.de","fessesdenfer.com","fetishshrine.com","filespayouts.com","filmestorrent.tv","filmyhitlink.xyz","filmyhitt.com.in","financacerta.com","fineasiansex.com","finofilipino.org","fitnessholic.net","fitnessscenz.com","flatpanelshd.com","footwearnews.com","footymercato.com","footystreams.net","foreverquote.xyz","forexcracked.com","forextrader.site","forgepattern.net","forum-xiaomi.com","foxsports.com.au","freegetcoins.com","freehardcore.com","freehdvideos.xxx","freelitecoin.vip","freemcserver.net","freemomstube.com","freemoviesu4.com","freeporncave.com","freevstplugins.*","freshersgold.com","fullxcinema1.com","fullxxxmovies.me","fumettologica.it","fussballdaten.de","gadgetxplore.com","game-repack.site","gamemodsbase.com","gamers-haven.org","games.boston.com","games.kansas.com","games.modbee.com","games.puzzles.ca","games.sacbee.com","games.sltrib.com","games.usnews.com","gamesrepacks.com","gamingbeasts.com","gamingdeputy.com","gaminglariat.com","ganstamovies.com","garminrumors.com","gartenlexikon.de","gaydelicious.com","gazetalubuska.pl","gbmwolverine.com","gdrivelatino.net","gdrivemovies.xyz","gemiadamlari.org","genialetricks.de","gentlewasher.com","getdatgadget.com","getdogecoins.com","getfreecourses.*","getworkation.com","gezegenforum.com","ghettopearls.com","ghostsfreaks.com","gidplayer.online","globelempire.com","go.discovery.com","go.shortnest.com","goblackbears.com","godstoryinfo.com","goetbutigers.com","gogetadoslinks.*","gomcpanthers.com","gometrostate.com","goodyoungsex.com","gophersports.com","gopornindian.com","gourmetscans.net","greasygaming.com","greenarrowtv.com","gruene-zitate.de","gruporafa.com.br","gsm-solution.com","gtamaxprofit.com","guncelkaynak.com","gutesexfilme.com","hadakanonude.com","handelsblatt.com","happyinshape.com","hard-tubesex.com","hardfacefuck.com","hausbau-forum.de","hayatarehber.com","hd-tube-porn.com","healthylifez.com","heilpraxisnet.de","helpdeskgeek.com","hentaicomics.pro","hentaiseason.com","hentaistream.com","hentaivideos.net","homemadehome.com","hotcopper.com.au","hotdreamsxxx.com","hotpornyoung.com","hotpussyhubs.com","houstonpress.com","howsweeteats.com","hqpornstream.com","huskercorner.com","id.condenast.com","idmextension.xyz","ielts-isa.edu.vn","ignoustudhelp.in","ikindlebooks.com","imagereviser.com","imageshimage.com","imagetotext.info","imperiofilmes.co","indexsubtitle.cc","infinityfree.com","infomatricula.pt","inprogrammer.com","inspiralized.com","intellischool.id","interviewgig.com","investopedia.com","investorveda.com","isekaibrasil.com","isekaipalace.com","jalshamoviezhd.*","japaneseasmr.com","japanesefuck.com","japanfuck.com.es","javenspanish.com","javfullmovie.com","julieblanner.com","justblogbaby.com","justswallows.net","kakarotfoot.ru>>","katiescucina.com","kayifamilytv.com","khatrimazafull.*","kimscravings.com","kingdomfiles.com","kingstreamz.site","kireicosplay.com","kitchendivas.com","kitchennovel.com","kitraskimisi.com","knowyourmeme.com","kodibeginner.com","kokosovoulje.com","komikstation.com","komputerswiat.pl","kshowsubindo.org","kstatesports.com","ksuathletics.com","kurakura21.space","kuttymovies1.com","lakeshowlife.com","lampungkerja.com","larvelfaucet.com","lascelebrite.com","latesthdmovies.*","latinohentai.com","laurafuentes.com","lavanguardia.com","lawyercontact.us","lectormangaa.com","leechpremium.net","legionjuegos.org","lehighsports.com","lesbiantube.club","letmewatchthis.*","levelupalone.com","lg-firmwares.com","libramemoria.com","lifesurance.info","lightxxxtube.com","limetorrents.lol","linux-magazin.de","linuxexplain.com","live.vodafone.de","livenewsflix.com","logofootball.net","lookmovie.studio","loudountimes.com","ltpcalculator.in","luminatedata.com","lumpiastudio.com","lustaufsleben.at","lustesthd.makeup","macrocreator.com","magicseaweed.com","mahobeachcam.com","mammaebambini.it","manga-scantrad.*","mangacanblog.com","mangaforfree.com","mangaindo.web.id","marcandangel.com","markstyleall.com","masstamilans.com","mastaklomods.com","masterplayer.xyz","matshortener.xyz","mature-tube.sexy","maxisciences.com","meconomynews.com","medievalists.net","mee-6zeqsgv2.com","mee-cccdoz45.com","mee-dp6h8dp2.com","mee-s9o6p31p.com","meetdownload.com","megafilmeshd20.*","megajapansex.com","mejortorrents1.*","merlinshoujo.com","meteoetradar.com","milanreports.com","milfxxxpussy.com","milkporntube.com","mlookalporno.com","mockupgratis.com","mockupplanet.com","moto-station.com","mountaineast.org","movielinkhub.xyz","movierulz2free.*","movierulzwatch.*","movieshdwatch.to","movieshubweb.com","moviesnipipay.me","moviesrulzfree.*","moviestowatch.tv","mrproblogger.com","msmorristown.com","msumavericks.com","multimovies.tech","musiker-board.de","my-ford-focus.de","myair.resmed.com","mycivillinks.com","mydownloadtube.*","myfitnesspal.com","mylegalporno.com","mylivestream.pro","mymotherlode.com","myproplugins.com","myradioonline.pl","nakedbbw-sex.com","naruldonghua.com","nationalpost.com","nativesurge.info","nauathletics.com","naughtyblogs.xyz","neatfreeporn.com","neatpornodot.com","netflixporno.net","netizensbuzz.com","netu.frembed.lol","newanimeporn.com","newsinlevels.com","newsobserver.com","newstvonline.com","nghetruyenma.net","nguyenvanbao.com","nhentaihaven.org","niftyfutures.org","nintendolife.com","nl.hardware.info","nocrumbsleft.net","nocsummer.com.br","nonesnanking.com","notebookchat.com","notiziemusica.it","novablogitalia.*","nude-teen-18.com","nudemomshots.com","null-scripts.net","officecoach24.de","ohionowcast.info","olalivehdplay.ru","older-mature.net","oldgirlsporn.com","onestringlab.com","onlineporn24.com","onlygangbang.com","onlygayvideo.com","onlyindianporn.*","open.spotify.com","openloadmovies.*","optimizepics.com","oranhightech.com","orenoraresne.com","oswegolakers.com","otakuanimess.net","oxfordmail.co.uk","pagalworld.video","pandaatlanta.com","pandafreegames.*","parentcircle.com","parking-map.info","pawastreams.info","pdfstandards.net","pedroinnecco.com","penis-bilder.com","personefamose.it","phinphanatic.com","physics101.co.za","pigeonburger.xyz","pinsexygirls.com","play.gamezop.com","play.history.com","player.gayfor.us","player.hdgay.net","player.pop.co.uk","player4me.online","playsexgames.xxx","pleasuregirl.net","plumperstube.com","plumpxxxtube.com","pokeca-chart.com","police.community","ponselharian.com","porn-hd-tube.com","pornclassic.tube","pornclipshub.com","pornforrelax.com","porngayclips.com","pornhub-teen.com","pornobengala.com","pornoborshch.com","pornoteensex.com","pornsex-pics.com","pornstargold.com","pornuploaded.net","pornvideotop.com","pornwatchers.com","pornxxxplace.com","pornxxxxtube.net","portnywebcam.com","post-gazette.com","postermockup.com","powerover.site>>","practicequiz.com","prajwaldesai.com","praveeneditz.com","privatenudes.com","programme-tv.net","programsolve.com","prosiebenmaxx.de","purduesports.com","purposegames.com","puzzles.nola.com","pythonjobshq.com","qrcodemonkey.net","rabbitstream.net","radio-deejay.com","realityblurb.com","realjapansex.com","receptyonline.cz","recordonline.com","redbirdrants.com","rendimentibtp.it","repack-games.com","reportbangla.com","reviewmedium.com","ribbelmonster.de","rimworldbase.com","ringsidenews.com","ripplestream4u.*","riwayat-word.com","rocketrevise.com","rollingstone.com","royale-games.com","rule34hentai.net","rv-ecommerce.com","sabishiidesu.com","safehomefarm.com","sainsburys.co.uk","sandandsisal.com","saradahentai.com","sarugbymag.co.za","satoshifaucet.io","savethevideo.com","savingadvice.com","schaken-mods.com","schildempire.com","schoolcheats.net","search.brave.com","seattletimes.com","secretsdujeu.com","semuanyabola.com","sensualgirls.org","serienjunkies.de","serieslandia.com","sesso-escort.com","sexanimetube.com","sexfilmkiste.com","sexflashgame.org","sexhardtubes.com","sexjapantube.com","sexlargetube.com","sexmomvideos.com","sexontheboat.xyz","sexpornasian.com","sextingforum.net","sexybabesart.com","sexyoungtube.com","sharelink-1.site","sheepesports.com","shelovesporn.com","shemalemovies.us","shemalepower.xyz","shemalestube.com","shimauma-log.com","shoot-yalla.live","short.croclix.me","shortenlinks.top","shortylink.store","showbizbites.com","shrinkforearn.in","shrinklinker.com","signupgenius.com","sikkenscolore.it","simpleflying.com","simplyvoyage.com","sitesunblocked.*","skidrowcodex.net","skidrowcrack.com","skintagsgone.com","smallseotools.ai","smart-wohnen.net","smartermuver.com","smashyplayer.top","soccershoes.blog","softwaresite.net","solution-hub.com","soonersports.com","soundpark-club.*","southpark.cc.com","soyoungteens.com","space-faucet.com","spigotunlocked.*","splinternews.com","sportpiacenza.it","sportshub.stream","sportsloverz.xyz","sportstream.live","spotifylists.com","sshconect.com.br","sssinstagram.com","stablerarena.com","stagatvfiles.com","stiflersmoms.com","stileproject.com","stillcurtain.com","stockhideout.com","stopstreamtv.net","storieswatch.com","stream.nflbox.me","stream4free.live","streamblasters.*","streamcenter.xyz","streamextreme.cc","streamingnow.mov","streamingworld.*","streamloverx.com","strefabiznesu.pl","strtapeadblock.*","suamusica.com.br","sukidesuost.info","sunshine-live.de","supremebabes.com","swiftuploads.com","sxmislandcam.com","synoniemboek.com","tamarindoyam.com","tapelovesads.org","taroot-rangi.com","teachmemicro.com","techgeek.digital","techkhulasha.com","technewslive.org","tecnotutoshd.net","teensexvideos.me","telcoinfo.online","telegratuita.com","text-compare.com","the1security.com","thebakermama.com","thecozyapron.com","thecustomrom.com","thefappening.pro","thegadgetking.in","thehiddenbay.com","theinventory.com","thejobsmovie.com","thelandryhat.com","thelosmovies.com","thelovenerds.com","thematurexxx.com","thenewcamera.com","thenewsdrill.com","thenewsglobe.net","thenextplanet1.*","theorie-musik.de","thepiratebay.org","thepoorcoder.com","thescranline.com","thesportster.com","thesportsupa.com","thestonesoup.com","thesundevils.com","thetrendverse.in","thevikingage.com","thisisfutbol.com","timesnownews.com","timesofindia.com","tires.costco.com","tiroalpaloes.com","tiroalpaloes.net","titansonline.com","tnstudycorner.in","todays-obits.com","todoandroid.live","tonanmedia.my.id","topvideosgay.com","toramemoblog.com","torrentkitty.one","totallyfuzzy.net","totalsportek.app","toureiffel.paris","towsontigers.com","tptvencore.co.uk","tradersunion.com","travel.vebma.com","travelerdoor.com","trendytalker.com","troyyourlead.com","trucosonline.com","truetrophies.com","truevpnlover.com","tube-teen-18.com","tube.shegods.com","tuotromedico.com","turbogvideos.com","turboplayers.xyz","turtleviplay.xyz","tutorialsaya.com","tweakcentral.net","twobluescans.com","typinggames.zone","uconnhuskies.com","unionpayintl.com","universegunz.net","unrealengine.com","upfiles-urls.com","urlgalleries.net","ustrendynews.com","uvmathletics.com","uwlathletics.com","vancouversun.com","vandaaginside.nl","vegamoviese.blog","veryfreeporn.com","verywellmind.com","vichitrainfo.com","videocdnal24.xyz","videodotados.com","videosection.com","vidstreaming.xyz","vikingf1le.us.to","villettt.kitchen","vinstartheme.com","viralvideotube.*","viralxxxporn.com","vivrebordeaux.fr","vodkapr3mium.com","voiranime.stream","voyeurfrance.net","voyeurxxxsex.com","vpshostplans.com","vrporngalaxy.com","vzrosliedamy.com","watchanime.video","watchfreekav.com","watchfreexxx.net","watchmovierulz.*","watchmovies2.com","wbschemenews.com","wearehunger.site","web.facebook.com","webcamsdolls.com","webcheats.com.br","webdesigndev.com","webdeyazilim.com","weblivehdplay.ru","webseriessex.com","websitesball.com","werkzeug-news.de","whentostream.com","whipperberry.com","whitexxxtube.com","wildpictures.net","windowsonarm.org","wolfgame-ar.site","womenreality.com","wonderfuldiy.com","woodmagazine.com","workxvacation.jp","worldhistory.org","wrestlinginc.com","wrzesnia.info.pl","wunderground.com","wvuathletics.com","www.amazon.co.jp","www.amazon.co.uk","www.facebook.com","xhamster-art.com","xhamsterporno.mx","xhamsterteen.com","xxxanimefuck.com","xxxlargeporn.com","xxxlesvianas.com","xxxretrofuck.com","xxxteenyporn.com","xxxvideos247.com","yellowbridge.com","yesjavplease.fun","yona-yethu.co.za","youngerporn.mobi","youtubetoany.com","youtubetowav.net","youwatch.monster","youwatchporn.com","ysokuhou.blog.jp","zdravenportal.eu","zecchino-doro.it","ziggogratis.site","ziminvestors.com","ziontutorial.com","zippyshare.cloud","zwergenstadt.com","123moviesonline.*","123strippoker.com","12thmanrising.com","1337x.unblocked.*","1337x.unblockit.*","19-days-manga.com","1movierulzhd.hair","1movierulzhd.wiki","1teentubeporn.com","2japaneseporn.com","365cincinnati.com","acapellas4u.co.uk","acdriftingpro.com","adblockplustape.*","alaskananooks.com","allcelebspics.com","alternativeto.net","altyazitube22.lat","amandascookin.com","amateur-twink.com","amateurfapper.com","amsmotoresllc.com","amybakesbread.com","ancient-origins.*","andhrafriends.com","andrewzimmern.com","androidonepro.com","androidpolice.com","animalwebcams.net","anime-torrent.com","animecenterbr.com","animeidhentai.com","animelatinohd.com","animeonline.ninja","animepornfilm.com","animesonlinecc.us","animexxxfilms.com","anonymousemail.me","apostoliclive.com","arabshentai.com>>","arcade.lemonde.fr","armypowerinfo.com","asianfucktube.com","asiansexcilps.com","assignmentdon.com","atalantini.online","atlasandboots.com","autoexpress.co.uk","babyjimaditya.com","badassoftcore.com","badgerofhonor.com","bafoeg-aktuell.de","bakedbyrachel.com","bandyforbundet.no","bargainbriana.com","bcanotesnepal.com","beargoggleson.com","bebasbokep.online","beritasulteng.com","bestanime-xxx.com","besthdgayporn.com","besthugecocks.com","bestloanoffer.net","bestpussypics.net","beyondtheflag.com","bgmiupdate.com.in","bigdickwishes.com","bigtitsxxxsex.com","black-matures.com","blackhatworld.com","bladesalvador.com","blizzboygames.net","blog.linksfire.co","blog.textpage.xyz","blogcreativos.com","blogtruyenmoi.com","bollywoodchamp.in","bostoncommons.net","bracontece.com.br","bradleybraves.com","brazzersbabes.com","brindisireport.it","brokensilenze.net","brookethoughi.com","browncrossing.net","brushednickel.biz","butterbeready.com","cadryskitchen.com","calgaryherald.com","camchickscaps.com","cameronaggies.com","candyteenporn.com","catatanonline.com","cavalierstream.fr","cdn.gledaitv.live","celebritablog.com","charbelnemnom.com","chat.tchatche.com","cheat.hax4you.net","checkfiletype.com","chicksonright.com","cindyeyefinal.com","cinecalidad5.site","cinema-sketch.com","citethisforme.com","citpekalongan.com","ciudadblogger.com","claplivehdplay.ru","classicreload.com","clickjogos.com.br","closetcooking.com","cloudhostingz.com","coatingsworld.com","codingshiksha.com","coempregos.com.br","compota-soft.work","computercrack.com","computerfrage.net","computerhilfen.de","comunidadgzone.es","conferenceusa.com","consoletarget.com","cookieandkate.com","cookiewebplay.xyz","cookingclassy.com","cool-style.com.tw","coolmathgames.com","crichd-player.top","cruisingearth.com","cryptednews.space","cryptoblog24.info","cryptowidgets.net","crystalcomics.com","curiosidadtop.com","daemon-hentai.com","dailybulletin.com","dailydemocrat.com","dailyfreebits.com","dailygeekshow.com","dailytech-news.eu","dallascowboys.com","damndelicious.net","darts-scoring.com","dawnofthedawg.com","dealsfinders.blog","dearcreatives.com","deine-tierwelt.de","deinesexfilme.com","dejongeturken.com","denverbroncos.com","descarga-animex.*","design4months.com","designtagebuch.de","desitelugusex.com","developer.arm.com","diamondfansub.com","diaridegirona.cat","diariocordoba.com","diencobacninh.com","dirtyindianporn.*","dl.apkmoddone.com","doctor-groups.com","dorohedoro.online","downloadapps.info","downloadtanku.org","downloadudemy.com","downloadwella.com","dynastyseries.com","dzienniklodzki.pl","e-hausaufgaben.de","earninginwork.com","easyjapanesee.com","easyvidplayer.com","easywithcode.tech","eatingonadime.com","eatlittlebird.com","ebonyassclips.com","eczpastpapers.net","editions-actu.org","einfachtitten.com","elamigosgames.org","elamigosgamez.com","elamigosgamez.net","empire-streamz.fr","emulatorgames.net","encurtandourl.com","encurtareidog.top","engel-horoskop.de","enormousbabes.net","entertubeporn.com","epsilonakdemy.com","eromanga-show.com","estrepublicain.fr","eternalmangas.org","etownbluejays.com","euro2024direct.ru","eurotruck2.com.br","evolvingtable.com","extreme-board.com","extremotvplay.com","faceittracker.net","fansonlinehub.com","fantasticporn.net","fastconverter.net","fatgirlskinny.net","fattubevideos.net","femalefirst.co.uk","fgcuathletics.com","fightinghawks.com","file.magiclen.org","finanzas-vida.com","fineretroporn.com","finexxxvideos.com","finish.addurl.biz","fitnakedgirls.com","fitnessplanss.com","fitnesssguide.com","flight-report.com","floridagators.com","foguinhogames.net","footballstream.tv","footfetishvid.com","footstockings.com","fordownloader.com","formatlibrary.com","forum.blu-ray.com","fplstatistics.com","freeboytwinks.com","freecodezilla.net","freecourseweb.com","freemagazines.top","freeoseocheck.com","freepdf-books.com","freepornrocks.com","freepornstream.cc","freepornvideo.sex","freepornxxxhd.com","freerealvideo.com","freethesaurus.com","freex2line.online","freexxxvideos.pro","french-streams.cc","freshstuff4u.info","friendproject.net","frkn64modding.com","frosinonetoday.it","fuerzasarmadas.eu","fuldaerzeitung.de","fullfreeimage.com","fullxxxmovies.net","futbollibrehd.com","futbolsayfasi.net","galonamission.com","games-manuals.com","games.puzzler.com","games.thestar.com","gamesofdesire.com","gaminggorilla.com","gay-streaming.com","gaypornhdfree.com","gebrauchtwagen.at","gewinde-normen.de","gimmesomeoven.com","girlsofdesire.org","girlswallowed.com","globalstreams.xyz","gobigtitsporn.com","goblueraiders.com","godriveplayer.com","gogetapast.com.br","gogueducation.com","goltelevision.com","gothunderbirds.ca","grannyfuckxxx.com","grannyxxxtube.net","graphicgoogle.com","grsprotection.com","gwiazdatalkie.com","hakunamatata5.org","hallo-muenchen.de","happy-otalife.com","hardcoregamer.com","hbculifestyle.com","hdfilmizlesen.com","hdporn-movies.com","hdvintagetube.com","headlinerpost.com","healbot.dpm15.net","healthcheckup.com","hegreartnudes.com","help.cashctrl.com","hentaibrasil.info","hentaienglish.com","hentaitube.online","hideandseek.world","hikarinoakari.com","hollywoodlife.com","hostingunlock.com","hotkitchenbag.com","hotmaturetube.com","hotspringsofbc.ca","houstontexans.com","howtoconcepts.com","hunterscomics.com","idownloadblog.com","iedprivatedqu.com","iheartnaptime.net","imgdawgknuttz.com","imperialstudy.com","independent.co.uk","indianporn365.net","indofirmware.site","indojavstream.com","infinityscans.net","infinityscans.org","infinityscans.xyz","inside-digital.de","insidermonkey.com","instantcloud.site","insurancepost.xyz","ironwinter6m.shop","isabihowto.com.ng","isekaisubs.web.id","isminiunuttum.com","jamiesamewalk.com","janammusic.in.net","japaneseholes.com","japanpornclip.com","japanxxxmovie.com","japanxxxworld.com","jardiner-malin.fr","jokersportshd.org","juegos.elpais.com","justagirlblog.com","k-statesports.com","k-statesports.net","k-statesports.org","kandisvarlden.com","kenshi.fandom.com","kh-pokemon-mc.com","khabardinbhar.net","kickasstorrents.*","kill-the-hero.com","kimcilonlyofc.com","kiuruvesilehti.fi","know-how-tree.com","kontenterabox.com","kontrolkalemi.com","koreanbeauty.club","korogashi-san.org","kreis-anzeiger.de","kurierlubelski.pl","lachainemeteo.com","lacuevadeguns.com","laksa19.github.io","lavozdegalicia.es","lebois-racing.com","lectorhub.j5z.xyz","lecturisiarome.ro","leechpremium.link","leechyscripts.net","lespartisanes.com","lewblivehdplay.ru","lheritierblog.com","libertestreamvf.*","lifesambrosia.com","limontorrents.com","line-stickers.com","link.turkdown.com","linuxsecurity.com","lisatrialidea.com","locatedinfain.com","lonely-mature.com","lovegrowswild.com","lucagrassetti.com","luciferdonghua.in","luckypatchers.com","lycoathletics.com","madhentaitube.com","malaysiastock.biz","mamainastitch.com","maps4study.com.br","marthastewart.com","mature-chicks.com","maturepussies.pro","mdzsmutpcvykb.net","media.cms.nova.cz","megajapantube.com","metaforespress.gr","mfmfinancials.com","miamidolphins.com","miaminewtimes.com","milfpussy-sex.com","minecraftwild.com","mizugigurabia.com","mlbpark.donga.com","mlbstreaming.live","mmorpgplay.com.br","mobilanyheter.net","modelsxxxtube.com","modescanlator.net","mommyporntube.com","momstube-porn.com","moon-fm43w1qv.com","moon-kg83docx.com","moonblinkwifi.com","motorradfrage.net","motorradonline.de","moviediskhd.cloud","movielinkbd4u.com","moviezaddiction.*","mp3cristianos.net","mundovideoshd.com","murtonroofing.com","music.youtube.com","musicforchoir.com","muyinteresante.es","myabandonware.com","myair2.resmed.com","myfunkytravel.com","mynakedwife.video","nasdaqfutures.org","national-park.com","negative.tboys.ro","nepalieducate.com","networklovers.com","new-xxxvideos.com","nextchessmove.com","ngin-mobility.com","nieuwsvandedag.nl","nightlifeporn.com","nikkan-gendai.com","nikkeifutures.org","njwildlifecam.com","nobodycancool.com","nonsensediamond.*","novelasligera.com","nzpocketguide.com","oceanof-games.com","oceanoffgames.com","odekake-spots.com","officedepot.co.cr","officialpanda.com","olemisssports.com","onceuponachef.com","ondemandkorea.com","onepiecepower.com","onlinemschool.com","onlinesextube.com","onlineteenhub.com","ontariofarmer.com","openspeedtest.com","opensubtitles.com","oportaln10.com.br","osmanonline.co.uk","osthessen-news.de","ottawacitizen.com","ottrelease247.com","outdoorchannel.de","overwatchporn.xxx","pahaplayers.click","palmbeachpost.com","pandaznetwork.com","panel.skynode.pro","pantyhosepink.com","paramountplus.com","paraveronline.org","pghk.blogspot.com","phimlongtieng.net","phoenix-manga.com","phonefirmware.com","piazzagallura.org","pistonpowered.com","plantatreenow.com","play.aidungeon.io","player.glomex.com","playerflixapi.com","playerjavseen.com","playmyopinion.com","playporngames.com","pleated-jeans.com","pockettactics.com","popcornmovies.org","porn-sexypics.com","pornanimetube.com","porngirlstube.com","pornoenspanish.es","pornoschlange.com","pornxxxvideos.net","posturedirect.com","practicalkida.com","prague-blog.co.il","premiumporn.org>>","prensaesports.com","prescottenews.com","press-citizen.com","presstelegram.com","prettyprudent.com","primeanimesex.com","primeflix.website","progameguides.com","project-free-tv.*","projectfreetv.one","promisingapps.com","promo-visits.site","protege-liens.com","pubgaimassist.com","publicananker.com","publicdomainq.net","publicdomainr.net","publicflashing.me","pumpkinnspice.com","punisoku.blogo.jp","pussytorrents.org","qatarstreams.me>>","queenofmature.com","radiolovelive.com","radiosymphony.com","ragnarokmanga.com","randomarchive.com","rateyourmusic.com","rawindianporn.com","readallcomics.com","readcomiconline.*","readfireforce.com","realvoyeursex.com","recipetineats.com","reporterpb.com.br","reprezentacija.rs","retrosexfilms.com","reviewjournal.com","richieashbeck.com","robloxscripts.com","rojadirectatvhd.*","roms-download.com","roznamasiasat.com","rule34.paheal.net","sahlmarketing.net","samfordsports.com","sanangelolive.com","sanmiguellive.com","sarkarinaukry.com","savemoneyinfo.com","scandichotels.com","schoolsweek.co.uk","scontianastro.com","searchnsucceed.in","seasons-dlove.net","send-anywhere.com","series9movies.com","sevenjournals.com","sexmadeathome.com","sexyebonyteen.com","sexyfreepussy.com","shahiid-anime.net","share.filesh.site","shentai-anime.com","shinshi-manga.net","shittokuadult.net","shortencash.click","shrink-service.it","shugarysweets.com","sidearmsocial.com","sideplusleaks.com","sim-kichi.monster","simply-hentai.com","simplyrecipes.com","simplywhisked.com","simulatormods.com","skidrow-games.com","skillheadlines.in","skodacommunity.de","slaughtergays.com","smallseotools.com","soccerworldcup.me","softwaresblue.com","south-park-tv.biz","spectrum.ieee.org","speculationis.com","spedostream2.shop","spiritparting.com","sponsorhunter.com","sportanalytic.com","sportingsurge.com","sportlerfrage.net","sportsbuff.stream","sportsgames.today","sportzonline.site","stapadblockuser.*","stellarthread.com","stepsisterfuck.me","storefront.com.ng","stories.los40.com","straatosphere.com","streamadblocker.*","streamcaster.live","streaming-one.com","streamingunity.to","streamlivetv.site","streamonsport99.*","streamseeds24.com","streamshunters.eu","stringreveals.com","suanoticia.online","super-ethanol.com","susanhavekeep.com","tabele-kalorii.pl","tamaratattles.com","tamilbrahmins.com","tamilsexstory.net","tattoosbeauty.com","tautasdziesmas.lv","techadvisor.co.uk","techconnection.in","techiepirates.com","techlog.ta-yan.ai","technewsrooms.com","technewsworld.com","techsolveprac.com","teenpornvideo.sex","teenpornvideo.xxx","testlanguages.com","texture-packs.com","thaihotmodels.com","thangdangblog.com","theandroidpro.com","thebazaarzone.com","thecelticblog.com","thecubexguide.com","thedailybeast.com","thedigitalfix.com","thefreebieguy.com","thegamearcade.com","thehealthsite.com","theismailiusa.org","thekingavatar.com","theliveupdate.com","theouterhaven.net","theregister.co.uk","thermoprzepisy.pl","thesprucepets.com","thewoksoflife.com","theworldobits.com","thousandbabes.com","tichyseinblick.de","tiktokcounter.net","timesnowhindi.com","tiroalpaloweb.xyz","titfuckvideos.com","tmail.sys64738.at","tomatespodres.com","toplickevesti.com","topsworldnews.com","torrent-pirat.com","torrentdownload.*","tradingfact4u.com","trannylibrary.com","trannyxxxtube.net","truyen-hentai.com","truyenaudiocv.net","tubepornasian.com","tubepornstock.com","ultimate-catch.eu","ultrateenporn.com","umatechnology.org","unsere-helden.com","uptechnologys.com","urjalansanomat.fi","url.gem-flash.com","utepathletics.com","vanillatweaks.net","venusarchives.com","vide-greniers.org","video.gazzetta.it","videogameszone.de","videos.remilf.com","vietnamanswer.com","viralitytoday.com","virtualnights.com","visualnewshub.com","vitalitygames.com","voiceofdenton.com","voyeurpornsex.com","voyeurspyporn.com","voyeurxxxfree.com","wannafreeporn.com","watchanimesub.net","watchfacebook.com","watchsouthpark.tv","websiteglowgh.com","weknowconquer.com","welcometojapan.jp","wellness4live.com","wellnessbykay.com","wirralglobe.co.uk","wirtualnemedia.pl","wohnmobilforum.de","workweeklunch.com","worldfreeware.com","worldgreynews.com","worthitorwoke.com","wpsimplehacks.com","wutheringwaves.gg","xfreepornsite.com","xhamsterdeutsch.*","xnxx-sexfilme.com","xxxonlinefree.com","xxxpussyclips.com","xxxvideostrue.com","yesdownloader.com","yongfucknaked.com","yourcupofcake.com","yummysextubes.com","zeenews.india.com","zeijakunahiko.com","zeroto60times.com","zippysharecue.com","1001tracklists.com","101soundboards.com","10minuteemails.com","123moviesready.org","123moviestoday.net","1337x.unblock2.xyz","247footballnow.com","7daystodiemods.com","adblockeronstape.*","addictinggames.com","adultasianporn.com","advertisertape.com","afasiaarchzine.com","airportwebcams.net","akuebresources.com","allureamateurs.net","alternativa104.net","amateur-mature.net","anarchy-stream.com","angrybirdsnest.com","animesonliner4.com","anothergraphic.org","antenasport.online","arcade.buzzrtv.com","arcadeprehacks.com","arkadiumhosted.com","arsiv.mackolik.com","asian-teen-sex.com","asianbabestube.com","asianpornfilms.com","asiansexdiarys.com","asianstubefuck.com","atlantafalcons.com","atlasstudiousa.com","autocadcommand.com","backforseconds.com","badasshardcore.com","baixedetudo.net.br","bakeitwithlove.com","ballexclusives.com","barstoolsports.com","basic-tutorials.de","bdsmslavemovie.com","beamng.wesupply.cx","bearchasingart.com","beermoneyforum.com","beginningmanga.com","berliner-kurier.de","beruhmtemedien.com","best-xxxvideos.com","bestialitytaboo.tv","bettingexchange.it","bidouillesikea.com","bigdata-social.com","bigdata.rawlazy.si","bigpiecreative.com","bigsouthsports.com","bigtitsxxxfree.com","birdsandblooms.com","blisseyhusband.net","blogredmachine.com","blogx.almontsf.com","blowjobamateur.net","blowjobpornset.com","bluecoreinside.com","bluemediastorage.*","bombshellbling.com","bonsaiprolink.shop","bosoxinjection.com","browneyedbaker.com","businessinsider.de","campsitephotos.com","camwhorescloud.com","cararegistrasi.com","casos-aislados.com","cdimg.blog.2nt.com","cehennemstream.xyz","cerbahealthcare.it","chiangraitimes.com","chicagobearshq.com","chicagobullshq.com","chicasdesnudas.xxx","chikianimation.org","choiceappstore.xyz","cintateknologi.com","clampschoolholic.*","classicalradio.com","classicxmovies.com","clothing-mania.com","codingnepalweb.com","coleccionmovie.com","comicspornoxxx.com","comparepolicyy.com","comparteunclic.com","contractpharma.com","couponscorpion.com","cr7-soccer.store>>","creditcardrush.com","crimsonscrolls.net","cronachesalerno.it","cryptonworld.space","dallasobserver.com","dcdirtylaundry.com","dcworldscollide.gg","denverpioneers.com","depressionhurts.us","descargaspcpro.net","desifuckonline.com","deutschekanale.com","devicediary.online","diariodenavarra.es","digicol.dpm.org.cn","dinneratthezoo.com","dirtyasiantube.com","dirtygangbangs.com","discover-sharm.com","diyphotography.net","diyprojectslab.com","donaldlineelse.com","donghuanosekai.com","doublemindtech.com","downloadcursos.top","downloadgames.info","downloadmusic.info","downloadpirate.com","dragonball-zxk.com","dulichkhanhhoa.net","e-mountainbike.com","elamigos-games.com","elamigos-games.net","elconfidencial.com","elearning-cpge.com","embed-player.space","empire-streaming.*","english-dubbed.com","english-topics.com","erikcoldperson.com","evdeingilizcem.com","eveningtimes.co.uk","exactlyhowlong.com","expressbydgoski.pl","extremosports.club","familyhandyman.com","feastingathome.com","feelgoodfoodie.net","fightingillini.com","filmizlehdfilm.com","financenova.online","financialjuice.com","flacdownloader.com","flashgirlgames.com","flashingjungle.com","foodiesgallery.com","foreversparkly.com","forkknifeswoon.com","formasyonhaber.net","forum.cstalking.tv","francaisfacile.net","free-gay-clips.com","freeadultcomix.com","freeadultvideos.cc","freebiesmockup.com","freecoursesite.com","freefireupdate.com","freegogpcgames.com","freegrannyvids.com","freemockupzone.com","freemoviesfull.com","freepornasians.com","freepublicporn.com","freereceivesms.com","freeviewmovies.com","freevipservers.net","freevstplugins.net","freewoodworking.ca","freex2line.onlinex","freshwaterdell.com","friscofighters.com","fritidsmarkedet.dk","fuckhairygirls.com","fuckingsession.com","galinhasamurai.com","gamerevolution.com","games.arkadium.com","games.kentucky.com","games.mashable.com","games.thestate.com","gamingforecast.com","gaypornmasters.com","gazetakrakowska.pl","gazetazachodnia.eu","gdrivelatinohd.net","geniale-tricks.com","geniussolutions.co","girlsgogames.co.uk","go.bucketforms.com","goafricaonline.com","gobankingrates.com","gocurrycracker.com","godrakebulldog.com","gojapaneseporn.com","golf.rapidmice.com","gorro-4go5b3nj.fun","gorro-9mqnb7j2.fun","gorro-chfzoaas.fun","gorro-ry0ziftc.fun","grouppornotube.com","gruenderlexikon.de","gudangfirmwere.com","hamptonpirates.com","hard-tube-porn.com","healthfirstweb.com","healthnewsreel.com","healthy4pepole.com","heatherdisarro.com","hentaipornpics.net","hentaisexfilms.com","heraldscotland.com","hiddencamstube.com","highkeyfinance.com","hindustantimes.com","homeairquality.org","homemoviestube.com","hotanimevideos.com","hotbabeswanted.com","hotxxxjapanese.com","housingaforest.com","hqamateurtubes.com","huffingtonpost.com","huitranslation.com","humanbenchmark.com","hungrypaprikas.com","hyundaitucson.info","iamhomesteader.com","idedroidsafelink.*","idevicecentral.com","ifreemagazines.com","ikingfile.mooo.com","ilcamminodiluce.it","imagetranslator.io","indecentvideos.com","indesignskills.com","indianbestporn.com","indianpornvideos.*","indiansexbazar.com","indiasmagazine.com","infamous-scans.com","infinitehentai.com","infinityblogger.in","infojabarloker.com","informatudo.com.br","informaxonline.com","insidemarketing.it","insidememorial.com","insider-gaming.com","insurancesfact.com","intercelestial.com","investor-verlag.de","iowaconference.com","islamicpdfbook.com","italianporn.com.es","ithinkilikeyou.net","iusedtobeaboss.com","jacksonguitars.com","jamessoundcost.com","japanesemomsex.com","japanesetube.video","jasminetesttry.com","jemontremabite.com","jeux.meteocity.com","johnalwayssame.com","jojolandsmanga.com","joomlabeginner.com","jujustu-kaisen.com","justfamilyporn.com","justpicsplease.com","justtoysnoboys.com","kawaguchimaeda.com","kdramasmaza.com.pk","kellywhatcould.com","keralatelecom.info","kickasstorrents2.*","kirbiecravings.com","kittyfuckstube.com","knowyourphrase.com","kobitacocktail.com","komisanwamanga.com","kr-weathernews.com","krebs-horoskop.com","kstatefootball.net","kstatefootball.org","laopinioncoruna.es","leagueofgraphs.com","leckerschmecker.me","leo-horoscopes.com","letribunaldunet.fr","leviathanmanga.com","levismodding.co.uk","lib.hatenablog.com","lightnovelspot.com","link.paid4link.com","linkedmoviehub.top","linux-community.de","listenonrepeat.com","literarysomnia.com","littlebigsnake.com","liveandletsfly.com","localemagazine.com","longbeachstate.com","lotus-tours.com.hk","loyolaramblers.com","lukecomparetwo.com","luzernerzeitung.ch","m.timesofindia.com","maggotdrowning.com","magicgameworld.com","makeincomeinfo.com","maketecheasier.com","makotoichikawa.net","mallorcazeitung.es","manager-magazin.de","manchesterworld.uk","mangas-origines.fr","manoramaonline.com","maraudersports.com","marvelsnapzone.com","mathplayground.com","maturetubehere.com","maturexxxclips.com","mctechsolutions.in","mediascelebres.com","megafilmeshd50.com","megahentaitube.com","megapornfreehd.com","mein-wahres-ich.de","memorialnotice.com","merlininkazani.com","mespornogratis.com","mesquitaonline.com","minddesignclub.org","minhasdelicias.com","mobilelegends.shop","mobiletvshows.site","modele-facture.com","moflix-stream.fans","momdoesreviews.com","montereyherald.com","motorcyclenews.com","moviescounnter.com","moviesonlinefree.*","mygardening411.com","myhentaicomics.com","mymusicreviews.com","myneobuxportal.com","mypornstarbook.net","myquietkitchen.com","nadidetarifler.com","naijachoice.com.ng","nakedgirlsroom.com","nakedneighbour.com","nauci-engleski.com","nauci-njemacki.com","netaffiliation.com","neueroeffnung.info","nevadawolfpack.com","newjapanesexxx.com","news-geinou100.com","newyorkupstate.com","nicematureporn.com","niestatystyczny.pl","nightdreambabe.com","noodlemagazine.com","nourishedbynic.com","novacodeportal.xyz","nudebeachpussy.com","nudecelebforum.com","nuevos-mu.ucoz.com","nyharborwebcam.com","o2tvseries.website","oceanbreezenyc.org","officegamespot.com","ogrenciyegelir.com","omnicalculator.com","onepunch-manga.com","onetimethrough.com","onlinesudoku.games","onlinetutorium.com","onlinework4all.com","onlygoldmovies.com","onscreensvideo.com","openchat-review.me","pakistaniporn2.com","pancakerecipes.com","panel.play.hosting","passportaction.com","pc-spiele-wiese.de","pcgamedownload.net","pcgameshardware.de","peachprintable.com","peliculas-dvdrip.*","penisbuyutucum.net","pennbookcenter.com","pestleanalysis.com","pinayviralsexx.com","plainasianporn.com","play.starsites.fun","play.watch20.space","player.euroxxx.net","playeriframe.lol>>","playretrogames.com","pliroforiki-edu.gr","policesecurity.com","policiesreview.com","polskawliczbach.pl","pornhubdeutsch.net","pornmaturetube.com","pornohubonline.com","pornovideos-hd.com","pornvideospass.com","powerthesaurus.org","premiumstream.live","present.rssing.com","printablecrush.com","problogbooster.com","productkeysite.com","projectfreetv2.com","projuktirkotha.com","proverbmeaning.com","psicotestuned.info","pussytubeebony.com","racedepartment.com","radio-en-direct.fr","radioitalylive.com","radionorthpole.com","ratemyteachers.com","realfreelancer.com","realtormontreal.ca","recherche-ebook.fr","redamateurtube.com","redbubbletools.com","redstormsports.com","replica-watch.info","reporterherald.com","rightdark-scan.com","rincondelsazon.com","ripcityproject.com","risefromrubble.com","romaniataramea.com","runtothefinish.com","ryanagoinvolve.com","sabornutritivo.com","samanarthishabd.in","samrudhiglobal.com","samurai.rzword.xyz","sandrataxeight.com","sankakucomplex.com","sattakingcharts.in","scarletandgame.com","scarletknights.com","schoener-wohnen.de","sciencechannel.com","scopateitaliane.it","seamanmemories.com","selfstudybrain.com","sethniceletter.com","sexiestpicture.com","sexteenxxxtube.com","sexy-youtubers.com","sexykittenporn.com","sexymilfsearch.com","shadowrangers.live","shemaletoonsex.com","shipseducation.com","shrivardhantech.in","shutupandgo.travel","sidelionreport.com","siirtolayhaber.com","simpledownload.net","siteunblocked.info","slowianietworza.pl","smithsonianmag.com","soccerstream100.to","sociallyindian.com","softwaredetail.com","sosyalbilgiler.net","southernliving.com","southparkstudios.*","spank-and-bang.com","sportstohfa.online","stapewithadblock.*","stream.nflbox.me>>","streamelements.com","streaming-french.*","strtapeadblocker.*","surgicaltechie.com","sweeteroticart.com","syracusecrunch.com","tamilultratv.co.in","tapeadsenjoyer.com","tcpermaculture.com","teachpreschool.org","technicalviral.com","telefullenvivo.com","telexplorer.com.ar","theblissempire.com","theendlessmeal.com","thefirearmblog.com","thehentaiworld.com","thelesbianporn.com","thepewterplank.com","thepiratebay10.org","theralphretort.com","thestarphoenix.com","thesuperdownload.*","thiagorossi.com.br","thisisourbliss.com","tiervermittlung.de","tiktokrealtime.com","times-standard.com","tiny-sparklies.com","tips-and-tricks.co","tokyo-ghoul.online","tonpornodujour.com","topbiography.co.in","torrentdosfilmes.*","torrentdownloads.*","totalsportekhd.com","traductionjeux.com","trannysexmpegs.com","transgirlslive.com","traveldesearch.com","travelplanspro.com","trendyol-milla.com","tribeathletics.com","trovapromozioni.it","truckingboards.com","truyenbanquyen.com","truyenhentai18.net","tuhentaionline.com","tulsahurricane.com","turboimagehost.com","tv3play.skaties.lv","tvonlinesports.com","tweaksforgeeks.com","txstatebobcats.com","u-createcrafts.com","ucirvinesports.com","ukrainesmodels.com","uncensoredleak.com","universfreebox.com","unlimitedfiles.xyz","urbanmilwaukee.com","urlaubspartner.net","venus-and-mars.com","vermangasporno.com","verywellhealth.com","victor-mochere.com","videos.porndig.com","videosinlevels.com","videosxxxputas.com","vincenzosplate.com","vintagepornfun.com","vintagepornnew.com","vintagesexpass.com","waitrosecellar.com","washingtonpost.com","watch.rkplayer.xyz","watch.shout-tv.com","watchadsontape.com","weakstreams.online","weatherzone.com.au","web.livecricket.is","webloadedmovie.com","websitesbridge.com","werra-rundschau.de","wheatbellyblog.com","wifemamafoodie.com","wildhentaitube.com","windowsmatters.com","winteriscoming.net","wohnungsboerse.net","woman.excite.co.jp","worldstreams.click","wormser-zeitung.de","www.apkmoddone.com","www.cloudflare.com","www.primevideo.com","xbox360torrent.com","xda-developers.com","xn--kckzb2722b.com","xpressarticles.com","xxx-asian-tube.com","xxxanimemovies.com","xxxanimevideos.com","yify-subtitles.org","youngpussyfuck.com","youwatch-serie.com","yt-downloaderz.com","ytmp4converter.com","znanemediablog.com","zxi.mytechroad.com","aachener-zeitung.de","abukabir.fawrye.com","abyssplay.pages.dev","academiadelmotor.es","adblockstreamtape.*","addtobucketlist.com","adultgamesworld.com","agrigentonotizie.it","ai.tempatwisata.pro","aliendictionary.com","allafricangirls.net","allindiaroundup.com","allporncartoons.com","alludemycourses.com","almohtarif-tech.net","altadefinizione01.*","amateur-couples.com","amaturehomeporn.com","amazingtrannies.com","androidrepublic.org","angeloyeo.github.io","animefuckmovies.com","animeonlinefree.org","animesonlineshd.com","annoncesescorts.com","anonymous-links.com","anonymousceviri.com","app.link2unlock.com","app.studysmarter.de","aprenderquechua.com","arabianbusiness.com","arizonawildcats.com","arnaqueinternet.com","arrowheadaddict.com","artificialnudes.com","asiananimaltube.org","asianfuckmovies.com","asianporntube69.com","audiobooks4soul.com","audiotruyenfull.com","awellstyledlife.com","bailbondsfinder.com","baltimoreravens.com","beautypackaging.com","beisbolinvernal.com","berliner-zeitung.de","bestmaturewomen.com","bethshouldercan.com","bible-knowledge.com","bigcockfreetube.com","bigsouthnetwork.com","blackenterprise.com","blog.cloudflare.com","blog.itijobalert.in","blog.potterworld.co","bluemediadownload.*","bordertelegraph.com","brighteyedbaker.com","brucevotewithin.com","businessinsider.com","calculascendant.com","cambrevenements.com","cancelguider.online","canuckaudiomart.com","celebritynakeds.com","celebsnudeworld.com","certificateland.com","chakrirkhabar247.in","championpeoples.com","chawomenshockey.com","chicagosportshq.com","christiantrendy.com","chubbypornmpegs.com","citationmachine.net","civilenggforall.com","classicpornbest.com","classicpornvids.com","classyyettrendy.com","clevelandbrowns.com","collegeteentube.com","columbiacougars.com","comicsxxxgratis.com","commande.rhinov.pro","commsbusiness.co.uk","comofuncionaque.com","compilationtube.xyz","comprovendolibri.it","concealednation.org","consigliatodanoi.it","couponsuniverse.com","crackedsoftware.biz","cravesandflames.com","creativebusybee.com","crossdresserhub.com","crystal-launcher.pl","curbsideclassic.com","custommapposter.com","daddyfuckmovies.com","daddylivestream.com","dailymaverick.co.za","daisiesandpie.co.uk","dartmouthsports.com","der-betze-brennt.de","descargaranimes.com","descargatepelis.com","deseneledublate.com","desktopsolution.org","detroitjockcity.com","dev.fingerprint.com","developerinsider.co","diariodemallorca.es","diarioeducacion.com","dichvureviewmap.com","diendancauduong.com","digitalfernsehen.de","digitalseoninja.com","digitalstudiome.com","dignityobituary.com","discordfastfood.com","divinelifestyle.com","divxfilmeonline.net","dktechnicalmate.com","download.megaup.net","driveteslacanada.ca","dubipc.blogspot.com","dynamicminister.net","dziennikbaltycki.pl","dziennikpolski24.pl","dziennikzachodni.pl","earn.quotesopia.com","edmontonjournal.com","elamigosedition.com","ellibrepensador.com","embed.nana2play.com","en-thunderscans.com","en.financerites.com","erotic-beauties.com","eventiavversinews.*","expresskaszubski.pl","fansubseries.com.br","fatblackmatures.com","faucetcaptcha.co.in","felicetommasino.com","femdomporntubes.com","fifaultimateteam.it","filmeonline2018.net","filmesonlinehd1.org","firstasianpussy.com","footballfancast.com","footballstreams.lol","footballtransfer.ru","fortnitetracker.com","forum-pokemon-go.fr","foxeslovelemons.com","foxvalleyfoodie.com","fplstatistics.co.uk","franceprefecture.fr","free-trannyporn.com","freecoursesites.com","freecoursesonline.*","freegamescasual.com","freeindianporn.mobi","freeindianporn2.com","freeplayervideo.com","freescorespiano.com","freesexvideos24.com","freetarotonline.com","freshsexxvideos.com","frustfrei-lernen.de","fuckmonstercock.com","fuckslutsonline.com","futura-sciences.com","gagaltotal666.my.id","gallant-matures.com","gamecocksonline.com","games.bradenton.com","games.fresnobee.com","games.heraldsun.com","games.sunherald.com","garnishandglaze.com","gazetawroclawska.pl","generacionretro.net","gesund-vital.online","gfilex.blogspot.com","global.novelpia.com","gloswielkopolski.pl","go-for-it-wgt1a.fun","goarmywestpoint.com","godrakebulldogs.com","godrakebulldogs.net","goodnewsnetwork.org","hailfloridahail.com","hamburgerinsult.com","hardcorelesbian.xyz","hardwarezone.com.sg","hardwoodhoudini.com","hartvannederland.nl","haus-garten-test.de","haveyaseenjapan.com","hawaiiathletics.com","hayamimi-gunpla.com","healthbeautybee.com","helpnetsecurity.com","hentai-mega-mix.com","hentaianimezone.com","hentaisexuality.com","hieunguyenphoto.com","highdefdiscnews.com","hindimatrashabd.com","hindimearticles.net","hindimoviesonline.*","historicaerials.com","hmc-id.blogspot.com","hobby-machinist.com","home-xxx-videos.com","hoosierhomemade.com","horseshoeheroes.com","hostingdetailer.com","hotbeautyhealth.com","hotorientalporn.com","hqhardcoreporno.com","hummingbirdhigh.com","ilbolerodiravel.org","ilforumdeibrutti.is","indianpornvideo.org","individualogist.com","ingyenszexvideok.hu","insidertracking.com","insidetheiggles.com","interculturalita.it","inventionsdaily.com","iptvxtreamcodes.com","itsecuritynews.info","iulive.blogspot.com","jacquieetmichel.net","japanesexxxporn.com","javuncensored.watch","jayservicestuff.com","joguinhosgratis.com","joyfoodsunshine.com","justcastingporn.com","justonecookbook.com","justsexpictures.com","k-statefootball.net","k-statefootball.org","keeperofthehome.org","kentstatesports.com","kenzo-flowertag.com","kingjamesgospel.com","kissmaturestube.com","klettern-magazin.de","kstateathletics.com","ladypopularblog.com","laughingspatula.com","lawweekcolorado.com","learnchannel-tv.com","learnmarketinfo.com","legionpeliculas.org","legionprogramas.org","leitesculinaria.com","lemino.docomo.ne.jp","letrasgratis.com.ar","lifeisbeautiful.com","limiteddollqjc.shop","livingstondaily.com","localizaagencia.com","lorimuchbenefit.com","louisianacookin.com","love-stoorey210.net","m.jobinmeghalaya.in","makeitdairyfree.com","marketrevolution.eu","masashi-blog418.com","massagefreetube.com","maturepornphoto.com","measuringflower.com","mediatn.cms.nova.cz","meeting.tencent.com","megajapanesesex.com","meicho.marcsimz.com","melskitchencafe.com","merriam-webster.com","miamiairportcam.com","miamibeachradio.com","migliori-escort.com","mikaylaarealike.com","mindmotion93y8.shop","minecraft-forum.net","minecraftraffle.com","minhaconexao.com.br","minimalistbaker.com","mittelbayerische.de","mobilesexgamesx.com","morinaga-office.net","motherandbaby.co.uk","movies-watch.com.pk","myhentaigallery.com","mynaturalfamily.com","myreadingmanga.info","natashaskitchen.com","noticiascripto.site","novelmultiverse.com","novelsparadise.site","nude-beach-tube.com","nudeselfiespics.com","nurparatodos.com.ar","obituaryupdates.com","oldgrannylovers.com","onlinefetishporn.cc","onlinepornushka.com","opisanie-kartin.com","orangespotlight.com","outdoor-magazin.com","painting-planet.com","parasportontario.ca","parrocchiapalata.it","paulkitchendark.com","peopleenespanol.com","perfectmomsporn.com","personalityclub.com","petitegirlsnude.com","pharmaguideline.com","phoenixnewtimes.com","phonereviewinfo.com","picspornamateur.com","platform.autods.com","play.dictionary.com","play.geforcenow.com","play.mylifetime.com","play.playkrx18.site","player.popfun.co.uk","player.uwatchfree.*","pompanobeachcam.com","popularasianxxx.com","pornjapanesesex.com","pornocolegialas.org","pornocolombiano.net","pornstarsadvice.com","portmiamiwebcam.com","porttampawebcam.com","pranarevitalize.com","protege-torrent.com","psychology-spot.com","publicidadtulua.com","quest.to-travel.net","raccontivietati.com","radiosantaclaus.com","radiotormentamx.com","rawofficethumbs.com","readcomicsonline.ru","realitybrazzers.com","redowlanalytics.com","relampagomovies.com","reneweconomy.com.au","richardsignfish.com","richmondspiders.com","ripplestream4u.shop","roberteachfinal.com","rojadirectaenhd.net","rojadirectatvlive.*","rollingglobe.online","romanticlesbian.com","rundschau-online.de","ryanmoore.marketing","rysafe.blogspot.com","samurai.wordoco.com","santoinferninho.com","savingsomegreen.com","scansatlanticos.com","scholarshiplist.org","schrauben-normen.de","secondhandsongs.com","sempredirebanzai.it","sempreupdate.com.br","serieshdpormega.com","seriezloaded.com.ng","setsuyakutoushi.com","sex-free-movies.com","sexyvintageporn.com","shogaisha-shuro.com","shogaisha-techo.com","sixsistersstuff.com","skidrowreloaded.com","smartkhabrinews.com","soap2day-online.com","soccerfullmatch.com","soccerworldcup.me>>","sociologicamente.it","somulhergostosa.com","sourcingjournal.com","sousou-no-frieren.*","sportitalialive.com","sportzonline.site>>","spotidownloader.com","ssdownloader.online","standardmedia.co.ke","stealthoptional.com","stevenuniverse.best","stormininnorman.com","storynavigation.com","stoutbluedevils.com","stream.offidocs.com","stream.pkayprek.com","streamadblockplus.*","streamshunters.eu>>","streamtapeadblock.*","stylegirlfriend.com","submissive-wife.net","summarynetworks.com","sussexexpress.co.uk","sweetadult-tube.com","tainio-mania.online","tamilfreemp3songs.*","tapewithadblock.org","teachersupdates.net","technicalline.store","techtrendmakers.com","tekniikanmaailma.fi","telecharger-igli4.*","thebalancemoney.com","theberserkmanga.com","thecrazytourist.com","thefoodieaffair.com","theglobeandmail.com","themehospital.co.uk","theoaklandpress.com","therecipecritic.com","thesimsresource.com","thesmokingcuban.com","thewatchseries.live","throwsmallstone.com","timesnowmarathi.com","tiz-cycling-live.io","tophentaicomics.com","toptenknowledge.com","totalfuckmovies.com","totalmaturefuck.com","transexuales.gratis","trendsderzukunft.de","trucs-et-astuces.co","tubepornclassic.com","tubevintageporn.com","turkishseriestv.net","turtleboysports.com","tutorialsduniya.com","tw-hkt.blogspot.com","ukmagazinesfree.com","uktvplay.uktv.co.uk","ultimate-guitar.com","usinger-anzeiger.de","utahstateaggies.com","valleyofthesuns.com","veryfastdownload.pw","vinylcollective.com","virtual-youtuber.jp","virtualdinerbot.com","vitadacelebrita.com","voetbalrotterdam.nl","wallpaperaccess.com","watch-movies.com.pk","watchlostonline.net","watchmonkonline.com","watchmoviesrulz.com","watchonlinemovie.pk","webhostingoffer.org","weristdeinfreund.de","whatjewwannaeat.com","windows-7-forum.net","winit.heatworld.com","woffordterriers.com","worldaffairinfo.com","worldstarhiphop.com","worldtravelling.com","www2.tmyinsight.net","xhamsterdeutsch.xyz","xn--nbkw38mlu2a.com","xnxx-downloader.net","xnxx-sex-videos.com","xxxhentaimovies.com","xxxpussysextube.com","xxxsexyjapanese.com","yaoimangaonline.com","yellowblissroad.com","yorkshirepost.co.uk","your-daily-girl.com","youramateurporn.com","youramateurtube.com","yourlifeupdated.net","youtubedownloader.*","zeeplayer.pages.dev","25yearslatersite.com","27-sidefire-blog.com","2adultflashgames.com","acienciasgalilei.com","adult-sex-gamess.com","adultdvdparadise.com","akatsuki-no-yona.com","allcelebritywiki.com","allcivilstandard.com","allnewindianporn.com","aman-dn.blogspot.com","amateurebonypics.com","amateuryoungpics.com","analysis-chess.io.vn","androidapkmodpro.com","androidheadlines.com","androidtunado.com.br","angolopsicologia.com","animalextremesex.com","apenasmaisumyaoi.com","aquiyahorajuegos.net","aroundthefoghorn.com","aspdotnet-suresh.com","ayobelajarbareng.com","badassdownloader.com","bailiwickexpress.com","banglachotigolpo.xyz","best-mobilegames.com","bestmp3converter.com","bestshemaleclips.com","bigtitsporn-tube.com","blackwoodacademy.org","bloggingawaydebt.com","bloggingguidance.com","boainformacao.com.br","bogowieslowianscy.pl","bollywoodshaadis.com","bouamra.blogspot.com","boxofficebusiness.in","br.nacaodamusica.com","browardpalmbeach.com","brr-69xwmut5-moo.com","bustyshemaleporn.com","cachevalleydaily.com","canberratimes.com.au","cartoonstvonline.com","cartoonvideos247.com","centralboyssp.com.br","chasingthedonkey.com","chef-in-training.com","cienagamagdalena.com","climbingtalshill.com","comandotorrenthd.org","connoisseurusveg.com","crackstreamsfree.com","crackstreamshd.click","craigretailers.co.uk","creators.nafezly.com","dailydishrecipes.com","dailygrindonline.net","dairylandexpress.com","davidsonbuilders.com","dcdlplayer8a06f4.xyz","decorativemodels.com","defienietlynotme.com","deliciousmagazine.pl","demonyslowianskie.pl","denisegrowthwide.com","descargaseriestv.com","digitalmusicnews.com","diglink.blogspot.com","divxfilmeonline.tv>>","djsofchhattisgarh.in","donna-cerca-uomo.com","downloadfilm.website","durhamopenhouses.com","ear-phone-review.com","earnfromarticles.com","edivaldobrito.com.br","educationbluesky.com","embed.hideiframe.com","encuentratutarea.com","eroticteensphoto.net","escort-in-italia.com","essen-und-trinken.de","eurostreaming.casino","extremereportbot.com","fairforexbrokers.com","famosas-desnudas.org","fastpeoplesearch.com","favfamilyrecipes.com","filmeserialegratis.*","filmpornofrancais.fr","finanznachrichten.de","finding-camellia.com","fle-2ggdmu8q-moo.com","fle-5r8dchma-moo.com","fle-rvd0i9o8-moo.com","foodfaithfitness.com","footballandress.club","foreverconscious.com","forexwikitrading.com","forge.plebmasters.de","forobasketcatala.com","forum.lolesporte.com","forum.thresholdx.net","fotbolltransfers.com","fr.streamon-sport.ru","free-sms-receive.com","freebigboobsporn.com","freecoursesonline.me","freelistenonline.com","freemagazinespdf.com","freemedicalbooks.org","freepatternsarea.com","freereadnovel.online","freeromsdownload.com","freestreams-live.*>>","freethailottery.live","freshshemaleporn.com","fullywatchonline.com","funeral-memorial.com","gaget.hatenablog.com","games.abqjournal.com","games.dallasnews.com","games.denverpost.com","games.kansascity.com","games.sixtyandme.com","games.wordgenius.com","gearingcommander.com","gesundheitsfrage.net","getfreesmsnumber.com","ghajini-04bl9y7x.lol","ghajini-1fef5bqn.lol","ghajini-1flc3i96.lol","ghajini-4urg44yg.lol","ghajini-8nz2lav9.lol","ghajini-9b3wxqbu.lol","ghajini-emtftw1o.lol","ghajini-jadxelkw.lol","ghajini-vf70yty6.lol","ghajini-y9yq0v8t.lol","giuseppegravante.com","giveawayoftheday.com","givemenbastreams.com","googledrivelinks.com","gourmetsupremacy.com","greatestshemales.com","greensnchocolate.com","griffinathletics.com","hackingwithreact.com","hds-streaming-hd.com","headlinepolitics.com","heartofvicksburg.com","heartrainbowblog.com","heresyoursavings.com","highheelstrample.com","historichorizons.com","hodgepodgehippie.com","hofheimer-zeitung.de","home-made-videos.com","homestratosphere.com","hornyconfessions.com","hostingreviews24.com","hotasianpussysex.com","hotjapaneseshows.com","huffingtonpost.co.uk","hypelifemagazine.com","ibreatheimhungry.com","immobilienscout24.de","india.marathinewz.in","inkworldmagazine.com","intereseducation.com","investnewsbrazil.com","irresistiblepets.net","italiadascoprire.net","jemontremonminou.com","juliescafebakery.com","k-stateathletics.com","kachelmannwetter.com","karaoke4download.com","karaokegratis.com.ar","keedabankingnews.com","lacronicabadajoz.com","laopiniondemalaga.es","laopiniondemurcia.es","laopiniondezamora.es","largescaleforums.com","latinatemptation.com","laweducationinfo.com","lazytranslations.com","learn.moderngyan.com","lemonsqueezyhome.com","lempaala.ideapark.fi","lesbianvideotube.com","letemsvetemapplem.eu","letsworkremotely.com","link.djbassking.live","linksdegrupos.com.br","live-tv-channels.org","liveforlivemusic.com","loan.bgmi32bitapk.in","loan.punjabworks.com","loriwithinfamily.com","luxurydreamhomes.net","mangcapquangvnpt.com","maturepornjungle.com","maturewomenfucks.com","mauiinvitational.com","maxfinishseveral.com","medicalstudyzone.com","mein-kummerkasten.de","michaelapplysome.com","mkvmoviespoint.autos","money.quotesopia.com","monkeyanimalporn.com","morganhillwebcam.com","motorbikecatalog.com","motorcitybengals.com","motorsport-total.com","movieloversworld.com","moviemakeronline.com","moviesubtitles.click","mujeresdesnudas.club","mustardseedmoney.com","mylivewallpapers.com","mypace.sasapurin.com","myperfectweather.com","mypussydischarge.com","myuploadedpremium.de","naughtymachinima.com","neighborfoodblog.com","newfreelancespot.com","neworleanssaints.com","newsonthegotoday.com","nibelungen-kurier.de","notebookcheck-ru.com","notebookcheck-tr.com","nudecelebsimages.com","nudeplayboygirls.com","nutraingredients.com","nylonstockingsex.net","onelittleproject.com","online-xxxmovies.com","onlinegrannyporn.com","originalteentube.com","pandadevelopment.net","pasadenastarnews.com","pcgamez-download.com","pesprofessionals.com","pipocamoderna.com.br","plagiarismchecker.co","planetaminecraft.com","platform.twitter.com","play.doramasplus.net","player.amperwave.net","player.smashy.stream","playstationhaber.com","popularmechanics.com","porlalibreportal.com","pornhub-sexfilme.net","portnassauwebcam.com","presentation-ppt.com","prismmarketingco.com","pro.iqsmartgames.com","psychologyjunkie.com","pussymaturephoto.com","radiocountrylive.com","ragnarokscanlation.*","ranaaclanhungary.com","rebeccaneverbase.com","recipestutorials.com","redcurrantbakery.com","redensarten-index.de","remotejobzone.online","reviewingthebrew.com","rhein-main-presse.de","rinconpsicologia.com","robertplacespace.com","rockpapershotgun.com","roemische-zahlen.net","rojadirectaenvivo.pl","roms-telecharger.com","s920221683.online.de","salamanca24horas.com","sandratableother.com","sarkariresult.social","savespendsplurge.com","schoolgirls-asia.org","schwaebische-post.de","securegames.iwin.com","seededatthetable.com","server-tutorials.net","server.satunivers.tv","sexypornpictures.org","socialmediagirls.com","socialmediaverve.com","socket.pearsoned.com","solomaxlevelnewbie.*","spicyvintageporn.com","sportstohfa.online>>","starkroboticsfrc.com","stream.nbcsports.com","streamingcommunity.*","strtapewithadblock.*","successstoryinfo.com","superfastrelease.xyz","superpackpormega.com","swietaslowianskie.pl","tainguyenmienphi.com","tasteandtellblog.com","teenamateurphoto.com","telephone-soudan.com","teluguonlinemovies.*","telugusexkathalu.com","thecraftsmanblog.com","thefappeningblog.com","thefastlaneforum.com","thegatewaypundit.com","thekitchenmagpie.com","thelavenderchair.com","thesarkariresult.net","thistlewoodfarms.com","tienichdienthoai.net","tinyqualityhomes.org","todaysthebestday.com","tomb-raider-king.com","totalsportek1000.com","toyoheadquarters.com","travellingdetail.com","trueachievements.com","tutorialforlinux.com","udemy-downloader.com","underground.tboys.ro","unityassets4free.com","utahsweetsavings.com","utepminermaniacs.com","ver-comics-porno.com","ver-mangas-porno.com","videoszoofiliahd.com","vintageporntubes.com","viralviralvideos.com","virgo-horoscopes.com","visualcapitalist.com","wallstreet-online.de","watchallchannels.com","watchcartoononline.*","watchgameofthrones.*","watchhouseonline.net","watchsuitsonline.net","watchtheofficetv.com","wegotthiscovered.com","weihnachts-filme.com","wetasiancreampie.com","whats-on-netflix.com","whitelacecottage.com","wife-home-videos.com","wirtualnynowydwor.pl","worldgirlsportal.com","www.dobreprogramy.pl","yakyufan-asobiba.com","youfreepornotube.com","youngerasiangirl.net","yourhomebasedmom.com","yourhomemadetube.com","youtube-nocookie.com","yummytummyaarthi.com","1337x.ninjaproxy1.com","3dassetcollection.com","3dprintersforum.co.uk","ableitungsrechner.net","ad-itech.blogspot.com","airportseirosafar.com","airsoftmilsimnews.com","allgemeine-zeitung.de","ar-atech.blogspot.com","arabamob.blogspot.com","arrisalah-jakarta.com","banglachoti-story.com","bestsellerforaday.com","bibliotecadecorte.com","bigbuttshubvideos.com","blackchubbymovies.com","blackmaturevideos.com","blasianluvforever.com","blog.motionisland.com","bournemouthecho.co.uk","branditechture.agency","brandstofprijzen.info","broncathleticfund.com","brutalanimalsfuck.com","bucetaspeludas.com.br","business-standard.com","calculator-online.net","cancer-horoscopes.com","celebritydeeplink.com","celebritynetworth.com","cleananddelicious.com","collinsdictionary.com","comentariodetexto.com","cordcuttingreport.com","course-downloader.com","creative-culinary.com","daddylivestream.com>>","dailyvideoreports.net","davescomputertips.com","desitab69.sextgem.com","destakenewsgospel.com","deutschpersischtv.com","diarioinformacion.com","diplomaexamcorner.com","dirtyyoungbitches.com","disneyfashionista.com","downloadcursos.gratis","dragontranslation.com","dragontranslation.net","dragontranslation.org","earn.mpscstudyhub.com","easyworldbusiness.com","edwardarriveoften.com","elcriticodelatele.com","electricalstudent.com","embraceinnerchaos.com","envato-downloader.com","eroticmoviesonline.me","errotica-archives.com","evelynthankregion.com","expressilustrowany.pl","filemoon-59t9ep5j.xyz","filemoon-ep11lgxt.xyz","filemoon-nv2xl8an.xyz","filemoon-oe4w6g0u.xyz","filmpornoitaliano.org","fitting-it-all-in.com","foodsdictionary.co.il","free-famous-toons.com","freebulksmsonline.com","freefatpornmovies.com","freeindiansextube.com","freepikdownloader.com","freshmaturespussy.com","friedrichshainblog.de","froheweihnachten.info","gadgetguideonline.com","games.bostonglobe.com","games.centredaily.com","games.dailymail.co.uk","games.greatergood.com","games.miamiherald.com","games.puzzlebaron.com","games.startribune.com","games.theadvocate.com","games.theolympian.com","games.triviatoday.com","gbadamud.blogspot.com","gemini-horoscopes.com","generalpornmovies.com","gentiluomodigitale.it","gentlemansgazette.com","giantshemalecocks.com","giessener-anzeiger.de","girlfuckgalleries.com","glamourxxx-online.com","gmuender-tagespost.de","googlearth.selva.name","goprincetontigers.com","greaterlongisland.com","guardian-series.co.uk","haber.eskisehirde.net","hackedonlinegames.com","hersfelder-zeitung.de","hochheimer-zeitung.de","hoegel-textildruck.de","hollywoodreporter.com","hot-teens-movies.mobi","hotmarathistories.com","howtoblogformoney.net","html5.gamemonetize.co","hungarianhardstyle.hu","iamflorianschulze.com","imasdk.googleapis.com","indiansexstories2.net","indratranslations.com","inmatesearchidaho.com","insideeducation.co.za","jacquieetmicheltv.net","jemontremasextape.com","journaldemontreal.com","journey.to-travel.net","jsugamecocksports.com","juninhoscripts.com.br","kana-mari-shokudo.com","kstatewomenshoops.com","kstatewomenshoops.net","kstatewomenshoops.org","labelandnarrowweb.com","lapaginadealberto.com","learnodo-newtonic.com","lebensmittelpraxis.de","lesbianfantasyxxx.com","lingeriefuckvideo.com","littlehouseliving.com","live-sport.duktek.pro","lycomingathletics.com","majalahpendidikan.com","malaysianwireless.com","mangaplus.shueisha.tv","megashare-website.com","midlandstraveller.com","midwestconference.org","mimaletadepeliculas.*","mmoovvfr.cloudfree.jp","moo-teau4c9h-mkay.com","moonfile-62es3l9z.com","motorsport.uol.com.br","mountainmamacooks.com","musvozimbabwenews.com","mybakingaddiction.com","mysflink.blogspot.com","nathanfromsubject.com","nationalgeographic.fr","netsentertainment.net","nobledicion.yoveo.xyz","note.sieuthuthuat.com","notformembersonly.com","oberschwaben-tipps.de","onepiecemangafree.com","onlinetntextbooks.com","onlinewatchmoviespk.*","ovcdigitalnetwork.com","paradiseislandcam.com","pcso-lottoresults.com","peiner-nachrichten.de","pelotalibrevivo.net>>","philippinenmagazin.de","photovoltaikforum.com","pisces-horoscopes.com","platform.adex.network","portbermudawebcam.com","primapaginamarsala.it","printablecreative.com","prod.hydra.sophos.com","quinnipiacbobcats.com","qul-de.translate.goog","radioitaliacanada.com","radioitalianmusic.com","redbluffdailynews.com","reddit-streams.online","redheaddeepthroat.com","redirect.dafontvn.com","revistaapolice.com.br","runningonrealfood.com","salzgitter-zeitung.de","santacruzsentinel.com","santafenewmexican.com","scriptgrowagarden.com","scrubson.blogspot.com","semprefi-1h3u8pkc.fun","semprefi-2tazedzl.fun","semprefi-5ut0d23g.fun","semprefi-7oliaqnr.fun","semprefi-8xp7vfr9.fun","semprefi-hdm6l8jq.fun","semprefi-uat4a3jd.fun","semprefi-wdh7eog3.fun","sex-amateur-clips.com","sexybabespictures.com","shortgoo.blogspot.com","showdownforrelief.com","sinnerclownceviri.net","skorpion-horoskop.com","smartwebsolutions.org","snapinstadownload.xyz","softwarecrackguru.com","softwaredescargas.com","solomax-levelnewbie.*","solopornoitaliani.xxx","soziologie-politik.de","space.tribuntekno.com","stablediffusionxl.com","startupjobsportal.com","steamcrackedgames.com","stream.hownetwork.xyz","streaming-community.*","streamingcommunityz.*","studyinghuman6js.shop","sublimereflection.com","supertelevisionhd.com","sweet-maturewomen.com","symboleslowianskie.pl","tapeadvertisement.com","tarjetarojaenvivo.lat","tarjetarojatvonline.*","taurus-horoscopes.com","taurus.topmanhuas.org","tech.trendingword.com","texteditor.nsspot.net","thecakeboutiquect.com","thedigitaltheater.com","thefightingcock.co.uk","thefreedictionary.com","thegnomishgazette.com","theprofoundreport.com","thetruthaboutcars.com","thewebsitesbridge.com","timesheraldonline.com","timesnewsgroup.com.au","toddpartneranimal.com","torrentdofilmeshd.net","towheaddeepthroat.com","travel-the-states.com","travelingformiles.com","tudo-para-android.com","ukiahdailyjournal.com","unsurcoenlasombra.com","utkarshonlinetest.com","vdl.np-downloader.com","videosxxxporno.gratis","virtualstudybrain.com","voyeur-pornvideos.com","walterprettytheir.com","watch.foodnetwork.com","watchcartoonsonline.*","watchfreejavonline.co","watchkobestreams.info","watchonlinemoviespk.*","watchporninpublic.com","watchseriesstream.com","weihnachts-bilder.org","wetterauer-zeitung.de","whisperingauroras.com","whittierdailynews.com","wiesbadener-kurier.de","wirtualnelegionowo.pl","worldwidestandard.net","www.dailymotion.com>>","xn--mlaregvle-02af.nu","yoima.hatenadiary.com","yoima2.hatenablog.com","zone-telechargement.*","123movies-official.net","1plus1plus1equals1.net","45er-de.translate.goog","acervodaputaria.com.br","adelaidepawnbroker.com","aimasummd.blog.fc2.com","algodaodocescan.com.br","allevertakstream.space","androidecuatoriano.xyz","appstore-discounts.com","assessmentcentrehq.com","automobile-catalog.com","batterypoweronline.com","best4hack.blogspot.com","bestialitysextaboo.com","blackamateursnaked.com","breastfeedingplace.com","brunettedeepthroat.com","bus-location.1507t.xyz","canadianunderwriter.ca","canarystreetcrafts.com","canzoni-per-bambini.it","cartoonporncomics.info","celebritymovieblog.com","chocolatewithgrace.com","cleanandscentsible.com","clixwarez.blogspot.com","cloud.majalahhewan.com","comandotorrentshds.org","cosmonova-broadcast.tv","cotravinh.blogspot.com","cpopchanelofficial.com","crayonsandcravings.com","crunchycreamysweet.com","currencyconverterx.com","currentrecruitment.com","dads-banging-teens.com","databasegdriveplayer.*","dewfuneralhomenews.com","diananatureforeign.com","digitalbeautybabes.com","downloadfreecourse.com","drakorkita73.kita.rest","drop.carbikenation.com","dtupgames.blogspot.com","ecommercewebsite.store","einewelteinezukunft.de","electriciansforums.net","elektrobike-online.com","elizabeth-mitchell.org","enciclopediaonline.com","eu-proxy.startpage.com","eurointegration.com.ua","exclusiveasianporn.com","exgirlfriendmarket.com","ezaudiobookforsoul.com","fantasticyoungporn.com","file-1bl9ruic-moon.com","filmeserialeonline.org","freelancerartistry.com","freepic-downloader.com","freepik-downloader.com","ftlauderdalewebcam.com","games.besthealthmag.ca","games.heraldonline.com","games.islandpacket.com","games.journal-news.com","games.readersdigest.ca","gewinnspiele-markt.com","gifhorner-rundschau.de","girlfriendsexphoto.com","golink.bloggerishyt.in","hairstylesthatwork.com","happyveggiekitchen.com","hentai-cosplay-xxx.com","hentai-vl.blogspot.com","hiraethtranslation.com","hockeyfantasytools.com","hollywoodhomestead.com","hopsion-consulting.com","hotanimepornvideos.com","housethathankbuilt.com","illustratemagazine.com","imagetwist.netlify.app","imperfecthomemaker.com","incontri-in-italia.com","indianpornvideo.online","insidekstatesports.com","insidekstatesports.net","insidekstatesports.org","irasutoya.blogspot.com","jacquieetmicheltv2.net","jessicaglassauthor.com","jonathansociallike.com","juegos.eleconomista.es","juneauharborwebcam.com","k-statewomenshoops.com","k-statewomenshoops.net","k-statewomenshoops.org","kenkou-maintenance.com","kingshotcalculator.com","kristiesoundsimply.com","lagacetadesalamanca.es","lecourrier-du-soir.com","littlesunnykitchen.com","livefootballempire.com","livingincebuforums.com","lonestarconference.org","m.bloggingguidance.com","marketedgeofficial.com","marketplace.nvidia.com","masterpctutoriales.com","megadrive-emulator.com","meteoregioneabruzzo.it","mexicanfoodjournal.com","mini.surveyenquete.net","moneywar2.blogspot.com","muleriderathletics.com","mycolombianrecipes.com","newbookmarkingsite.com","nilopolisonline.com.br","nosweatshakespeare.com","obutecodanet.ig.com.br","onlinetechsamadhan.com","onlinevideoconverter.*","opiniones-empresas.com","oracleerpappsguide.com","originalindianporn.com","paginadanoticia.com.br","philadelphiaeagles.com","pianetamountainbike.it","pittsburghpanthers.com","plagiarismdetector.net","play.discoveryplus.com","portstthomaswebcam.com","poweredbycovermore.com","praxis-jugendarbeit.de","principiaathletics.com","puzzles.standard.co.uk","puzzles.sunjournal.com","radioamericalatina.com","redlandsdailyfacts.com","republicain-lorrain.fr","rubyskitchenrecipes.uk","russkoevideoonline.com","salisburyjournal.co.uk","schwarzwaelder-bote.de","scorpio-horoscopes.com","sexyasianteenspics.com","shakentogetherlife.com","smallpocketlibrary.com","smartfeecalculator.com","sms-receive-online.com","stellar.quoteminia.com","strangernervousql.shop","streamhentaimovies.com","stuttgarter-zeitung.de","supermarioemulator.com","tastefullyeclectic.com","tatacommunications.com","techieway.blogspot.com","teluguhitsandflops.com","thatballsouttahere.com","the-military-guide.com","thecartoonporntube.com","thehouseofportable.com","thisishowwebingham.com","tipsandtricksjapan.com","totalsportek1000.com>>","turkishaudiocenter.com","tutoganga.blogspot.com","tvchoicemagazine.co.uk","twopeasandtheirpod.com","unity3diy.blogspot.com","universitiesonline.xyz","universityequality.com","watchdocumentaries.com","webcreator-journal.com","welsh-dictionary.ac.uk","xhamster-sexvideos.com","xn--algododoce-j5a.com","youfiles.herokuapp.com","yourdesignmagazine.com","zeeebatch.blogspot.com","aachener-nachrichten.de","adblockeronstreamtape.*","adrianmissionminute.com","ads-ti9ni4.blogspot.com","adultgamescollector.com","alejandrocenturyoil.com","alleneconomicmatter.com","allschoolboysecrets.com","aquarius-horoscopes.com","arcade.dailygazette.com","asianteenagefucking.com","auto-motor-und-sport.de","barranquillaestereo.com","bestpuzzlesandgames.com","betterbuttchallenge.com","bikyonyu-bijo-zukan.com","brasilsimulatormods.com","buerstaedter-zeitung.de","businesswritingblog.com","c--ix-de.translate.goog","careersatcouncil.com.au","cloudapps.herokuapp.com","coolsoft.altervista.org","creditcardgenerator.com","dameungrrr.videoid.baby","destinationsjourney.com","dokuo666.blog98.fc2.com","edgedeliverynetwork.com","elperiodicodearagon.com","encurtador.postazap.com","entertainment-focus.com","escortconrecensione.com","eservice.directauto.com","eskiceviri.blogspot.com","exclusiveindianporn.com","fightforthealliance.com","file-kg88oaak-embed.com","financeandinsurance.xyz","footballtransfer.com.ua","freefiremaxofficial.com","freemovies-download.com","freepornhdonlinegay.com","fromvalerieskitchen.com","funeralmemorialnews.com","gamersdiscussionhub.com","games.mercedsunstar.com","games.pressdemocrat.com","games.sanluisobispo.com","games.star-telegram.com","gamingsearchjournal.com","giessener-allgemeine.de","goctruyentranhvui17.com","healthyfitnessmeals.com","heatherwholeinvolve.com","historyofroyalwomen.com","homeschoolgiveaways.com","ilgeniodellostreaming.*","india.mplandrecord.info","influencersgonewild.com","insidekstatesports.info","integral-calculator.com","investmentwatchblog.com","iptvdroid1.blogspot.com","juegosdetiempolibre.org","julieseatsandtreats.com","kennethofficialitem.com","keysbrasil.blogspot.com","keywestharborwebcam.com","kutubistan.blogspot.com","laurelberninteriors.com","legendaryrttextures.com","linklog.tiagorangel.com","lirik3satu.blogspot.com","loldewfwvwvwewefdw.cyou","mamaslearningcorner.com","marketingaccesspass.com","megaplayer.bokracdn.run","metamani.blog15.fc2.com","miltonfriedmancores.org","ministryofsolutions.com","mobile-tracker-free.com","mobileweb.bankmellat.ir","moon-3uykdl2w-embed.com","morgan0928-5386paz2.fun","morgan0928-6v7c14vs.fun","morgan0928-8ufkpqp8.fun","morgan0928-oqdmw7bl.fun","morgan0928-t9xc5eet.fun","morganoperationface.com","morrisvillemustangs.com","mountainbike-magazin.de","movielinkbdofficial.com","mrfreemium.blogspot.com","naumburger-tageblatt.de","newlifefuneralhomes.com","newlifeonahomestead.com","news-und-nachrichten.de","northwalespioneer.co.uk","nudeblackgirlfriend.com","nutraceuticalsworld.com","onionringsandthings.com","onlinesoccermanager.com","osteusfilmestuga.online","pandajogosgratis.com.br","patriotathleticfund.com","pepperlivestream.online","phonenumber-lookup.info","platingsandpairings.com","player.bestrapeporn.com","player.smashystream.com","player.tormalayalamhd.*","player.xxxbestsites.com","playtolearnpreschool.us","portaldosreceptores.org","portcanaveralwebcam.com","portstmaartenwebcam.com","pramejarab.blogspot.com","predominantlyorange.com","premierfantasytools.com","prepared-housewives.com","privateindianmovies.com","programmingeeksclub.com","puzzles.pressherald.com","receive-sms-online.info","rppk13baru.blogspot.com","runningtothekitchen.com","searchenginereports.net","seoul-station-druid.com","sexyteengirlfriends.net","sexywomeninlingerie.com","shannonpersonalcost.com","singlehoroskop-loewe.de","snowman-information.com","spacestation-online.com","sqlserveregitimleri.com","streamtapeadblockuser.*","sweettoothsweetlife.com","talentstareducation.com","teamupinternational.com","tech.pubghighdamage.com","the-voice-of-germany.de","thebestideasforkids.com","thechroniclesofhome.com","thehappierhomemaker.com","theinternettaughtme.com","theplantbasedschool.com","tinycat-voe-fashion.com","tips97tech.blogspot.com","traderepublic.community","tutorialesdecalidad.com","valuable.hatenablog.com","verteleseriesonline.com","watchseries.unblocked.*","whatgreatgrandmaate.com","wiesbadener-tagblatt.de","windowsaplicaciones.com","xxxjapaneseporntube.com","youtube4kdownloader.com","zonamarela.blogspot.com","zone-telechargement.ing","zoomtventertainment.com","720pxmovies.blogspot.com","abendzeitung-muenchen.de","advertiserandtimes.co.uk","afilmyhouse.blogspot.com","altebwsneno.blogspot.com","anime4mega-descargas.net","aspirapolveremigliori.it","ate60vs7zcjhsjo5qgv8.com","atlantichockeyonline.com","aussenwirtschaftslupe.de","awealthofcommonsense.com","bestialitysexanimals.com","boundlessnecromancer.com","broadbottomvillage.co.uk","businesssoftwarehere.com","canonprintersdrivers.com","cardboardtranslation.com","celebrityleakednudes.com","childrenslibrarylady.com","cimbusinessevents.com.au","cle0desktop.blogspot.com","cloudcomputingtopics.net","culture-informatique.net","democratandchronicle.com","dictionary.cambridge.org","dictionnaire-medical.net","dominican-republic.co.il","downloads.wegomovies.com","downloadtwittervideo.com","dsocker1234.blogspot.com","einrichtungsbeispiele.de","fid-gesundheitswissen.de","freegrannypornmovies.com","freehdinterracialporn.in","ftlauderdalebeachcam.com","futbolenlatelevision.com","galaxytranslations10.com","games.crosswordgiant.com","games.idahostatesman.com","games.thenewstribune.com","games.tri-cityherald.com","gcertificationcourse.com","gelnhaeuser-tageblatt.de","general-anzeiger-bonn.de","greenbaypressgazette.com","healthylittlefoodies.com","hentaianimedownloads.com","hilfen-de.translate.goog","hotmaturegirlfriends.com","inlovingmemoriesnews.com","inmatefindcalifornia.com","insurancebillpayment.net","intelligence-console.com","jacquieetmichelelite.com","jasonresponsemeasure.com","josephseveralconcern.com","juegos.elnuevoherald.com","jumpmanclubbrasil.com.br","lampertheimer-zeitung.de","latribunadeautomocion.es","lauterbacher-anzeiger.de","lespassionsdechinouk.com","liveanimalporn.zooo.club","makingthymeforhealth.com","mariatheserepublican.com","mediapemersatubangsa.com","meine-anzeigenzeitung.de","mentalhealthcoaching.org","minecraft-serverlist.net","moalm-qudwa.blogspot.com","multivideodownloader.com","my-code4you.blogspot.com","noblessetranslations.com","nutraingredients-usa.com","nyangames.altervista.org","oberhessische-zeitung.de","onlinetv.planetfools.com","personality-database.com","phenomenalityuniform.com","philly.arkadiumarena.com","photos-public-domain.com","player.subespanolvip.com","playstationlifestyle.net","polseksongs.blogspot.com","portevergladeswebcam.com","programasvirtualespc.net","puzzles.centralmaine.com","quelleestladifference.fr","reddit-soccerstreams.com","renierassociatigroup.com","riprendiamocicatania.com","roadrunnersathletics.com","robertordercharacter.com","sandiegouniontribune.com","senaleszdhd.blogspot.com","shoppinglys.blogspot.com","smotret-porno-onlain.com","softdroid4u.blogspot.com","spicysouthernkitchen.com","stephenking-00qvxikv.fun","stephenking-3u491ihg.fun","stephenking-7tm3toav.fun","stephenking-c8bxyhnp.fun","stephenking-vy5hgkgu.fun","sundaysuppermovement.com","thebharatexpressnews.com","thedesigninspiration.com","theharristeeterdeals.com","themediterraneandish.com","therelaxedhomeschool.com","thewanderlustkitchen.com","thunderousintentions.com","tirumalatirupatiyatra.in","tubeinterracial-porn.com","unityassetcollection.com","upscaler.stockphotos.com","ustreasuryyieldcurve.com","verpeliculasporno.gratis","virginmediatelevision.ie","watchdoctorwhoonline.com","watchtrailerparkboys.com","workproductivityinfo.com","a-love-of-rottweilers.com","actionviewphotography.com","arabic-robot.blogspot.com","bharatsarkarijobalert.com","blog.receivefreesms.co.uk","braunschweiger-zeitung.de","businessnamegenerator.com","caroloportunidades.com.br","chocolatecoveredkatie.com","christopheruntilpoint.com","constructionplacement.org","convert-case.softbaba.com","cooldns-de.translate.goog","craftaholicsanonymous.net","ctrmarketingsolutions.com","dancearoundthekitchen.com","depo-program.blogspot.com","derivative-calculator.net","devere-group-hongkong.com","devoloperxda.blogspot.com","dictionnaire.lerobert.com","everydayhomeandgarden.com","fantasyfootballgeek.co.uk","fitnesshealtharticles.com","footballleagueworld.co.uk","fotografareindigitale.com","freeserverhostingweb.club","freewatchserialonline.com","game-kentang.blogspot.com","games.daytondailynews.com","games.gameshownetwork.com","games.lancasteronline.com","games.ledger-enquirer.com","games.moviestvnetwork.com","games.theportugalnews.com","gloucestershirelive.co.uk","graceaddresscommunity.com","heatherdiscussionwhen.com","housecardsummerbutton.com","kathleenmemberhistory.com","keepingitsimplecrafts.com","kitchenfunwithmy3sons.com","kitchentableclassroom.com","koume-in-huistenbosch.net","krankheiten-simulieren.de","lancashiretelegraph.co.uk","latribunadelpaisvasco.com","mega-hentai2.blogspot.com","newtoncustominteriors.com","nutraingredients-asia.com","oeffentlicher-dienst.info","oneessentialcommunity.com","onepiece-manga-online.net","passionatecarbloggers.com","percentagecalculator.guru","premeditatedleftovers.com","printedelectronicsnow.com","programmiedovetrovarli.it","projetomotog.blogspot.com","puzzles.independent.co.uk","realcanadiansuperstore.ca","receitasoncaseiras.online","schooltravelorganiser.com","scripcheck.great-site.net","searchmovie.wp.xdomain.jp","sentinelandenterprise.com","seogroup.bookmarking.info","silverpetticoatreview.com","simply-delicious-food.com","softwaresolutionshere.com","sofwaremania.blogspot.com","tech.unblockedgames.world","telenovelas-turcas.com.es","thebeginningaftertheend.*","theshabbycreekcottage.com","transparentcalifornia.com","truesteamachievements.com","tucsitupdate.blogspot.com","ultimateninjablazingx.com","usahealthandlifestyle.com","vercanalesdominicanos.com","vintage-erotica-forum.com","whatisareverseauction.com","xn--k9ja7fb0161b5jtgfm.jp","youtubemp3donusturucu.net","yusepjaelani.blogspot.com","a-b-f-dd-aa-bb-cc61uyj.fun","a-b-f-dd-aa-bb-ccn1nff.fun","a-b-f-dd-aa-bb-cctwd3a.fun","a-b-f-dd-aa-bb-ccyh5my.fun","arena.gamesforthebrain.com","audiobookexchangeplace.com","avengerinator.blogspot.com","barefeetonthedashboard.com","basseqwevewcewcewecwcw.xyz","bezpolitickekorektnosti.cz","bibliotecahermetica.com.br","change-ta-vie-coaching.com","collegefootballplayoff.com","cookiedoughandovenmitt.com","cornerstoneconfessions.com","cotannualconference.org.uk","cuatrolatastv.blogspot.com","dinheirocursosdownload.com","downloads.sayrodigital.net","edinburghnews.scotsman.com","eleganceandenchantment.com","elperiodicoextremadura.com","flashplayer.fullstacks.net","former-railroad-worker.com","frankfurter-wochenblatt.de","funnymadworld.blogspot.com","games.bellinghamherald.com","games.everythingzoomer.com","helmstedter-nachrichten.de","html5.gamedistribution.com","investigationdiscovery.com","istanbulescortnetworks.com","jilliandescribecompany.com","johnwardflighttraining.com","mailtool-de.translate.goog","motive213link.blogspot.com","musicbusinessworldwide.com","noticias.gospelmais.com.br","nutraingredients-latam.com","photoshopvideotutorial.com","puzzles.bestforpuzzles.com","recetas.arrozconleche.info","redditsoccerstreams.name>>","ripleyfieldworktracker.com","riverdesdelatribuna.com.ar","sagittarius-horoscopes.com","skillmineopportunities.com","stuttgarter-nachrichten.de","sulocale.sulopachinews.com","thelastgamestandingexp.com","thetelegraphandargus.co.uk","tiendaenlinea.claro.com.ni","todoseriales1.blogspot.com","tokoasrimotedanpayet.my.id","tralhasvarias.blogspot.com","video-to-mp3-converter.com","watchimpracticaljokers.com","whowantstuffs.blogspot.com","windowcleaningforums.co.uk","wolfenbuetteler-zeitung.de","wolfsburger-nachrichten.de","aprettylifeinthesuburbs.com","brittneystandardwestern.com","celestialtributesonline.com","charlottepilgrimagetour.com","choose.kaiserpermanente.org","cloud-computing-central.com","cointiply.arkadiumarena.com","constructionmethodology.com","cool--web-de.translate.goog","domainregistrationtips.info","download.kingtecnologia.com","dramakrsubindo.blogspot.com","elperiodicomediterraneo.com","embed.nextgencloudtools.com","evlenmekisteyenbayanlar.net","flash-firmware.blogspot.com","games.myrtlebeachonline.com","ge-map-overlays.appspot.com","happypenguin.altervista.org","iphonechecker.herokuapp.com","littlepandatranslations.com","lurdchinexgist.blogspot.com","newssokuhou666.blog.fc2.com","otakuworldsite.blogspot.com","parametric-architecture.com","pasatiemposparaimprimir.com","practicalpainmanagement.com","puzzles.crosswordsolver.org","redcarpet-fashionawards.com","thewestmorlandgazette.co.uk","timesofindia.indiatimes.com","watchfootballhighlights.com","watchmalcolminthemiddle.com","watchonlyfoolsandhorses.com","your-local-pest-control.com","centrocommercialevulcano.com","conoscereilrischioclinico.it","correction-livre-scolaire.fr","economictimes.indiatimes.com","emperorscan.mundoalterno.org","games.springfieldnewssun.com","gps--cache-de.translate.goog","imagenesderopaparaperros.com","lizs-early-learning-spot.com","locurainformaticadigital.com","michiganrugcleaning.cleaning","mimaletamusical.blogspot.com","net--tools-de.translate.goog","net--tours-de.translate.goog","pekalongan-cits.blogspot.com","publicrecords.netronline.com","skibiditoilet.yourmom.eu.org","springfieldspringfield.co.uk","teachersguidetn.blogspot.com","tekken8combo.kagewebsite.com","theeminenceinshadowmanga.com","uptodatefinishconference.com","watchonlinemovies.vercel.app","www-daftarharga.blogspot.com","youkaiwatch2345.blog.fc2.com","bayaningfilipino.blogspot.com","beautypageants.indiatimes.com","counterstrike-hack.leforum.eu","dev-dark-blog.pantheonsite.io","educationtips213.blogspot.com","fun--seiten-de.translate.goog","hortonanderfarom.blogspot.com","maximumridesharingprofits.com","panlasangpinoymeatrecipes.com","pharmaceutical-technology.com","play.virginmediatelevision.ie","pressurewasherpumpdiagram.com","shorturl.unityassets4free.com","thefreedommatrix.blogspot.com","walkthrough-indo.blogspot.com","web--spiele-de.translate.goog","wojtekczytawh40k.blogspot.com","caq21harderv991gpluralplay.xyz","comousarzararadio.blogspot.com","coolsoftware-de.translate.goog","hipsteralcolico.altervista.org","jennifercertaindevelopment.com","kryptografie-de.translate.goog","mp3songsdownloadf.blogspot.com","noicetranslations.blogspot.com","oxfordlearnersdictionaries.com","pengantartidurkuh.blogspot.com","photo--alben-de.translate.goog","rheinische-anzeigenblaetter.de","thelibrarydigital.blogspot.com","touhoudougamatome.blog.fc2.com","watchcalifornicationonline.com","wwwfotografgotlin.blogspot.com","bigclatterhomesguideservice.com","bitcoinminingforex.blogspot.com","cool--domains-de.translate.goog","ibecamethewifeofthemalelead.com","pickcrackpasswords.blogspot.com","posturecorrectorshop-online.com","safeframe.googlesyndication.com","sozialversicherung-kompetent.de","the-girl-who-ate-everything.com","utilidades.ecuadjsradiocorp.com","akihabarahitorigurasiseikatu.com","deletedspeedstreams.blogspot.com","freesoftpdfdownload.blogspot.com","games.games.newsgames.parade.com","insuranceloan.akbastiloantips.in","situsberita2terbaru.blogspot.com","such--maschine-de.translate.goog","uptodatefinishconferenceroom.com","games.charlottegames.cnhinews.com","loadsamusicsarchives.blogspot.com","pythonmatplotlibtips.blogspot.com","ragnarokscanlation.opchapters.com","tw.xn--h9jepie9n6a5394exeq51z.com","papagiovannipaoloii.altervista.org","softwareengineer-de.translate.goog","rojadirecta-tv-en-vivo.blogspot.com","thenightwithoutthedawn.blogspot.com","tenseishitaraslimedattaken-manga.com","wetter--vorhersage-de.translate.goog","marketing-business-revenus-internet.fr","hardware--entwicklung-de.translate.goog","0x7jwsog5coxn1e0mk2phcaurtrmbxfpouuz.fun","279kzq8a4lqa0ddt7sfp825b0epdl922oqu6.fun","2g8rktp1fn9feqlhxexsw8o4snafapdh9dn1.fun","5rr03ujky5me3sjzvfosr6p89hk6wd34qamf.fun","jmtv4zqntu5oyprw4seqtn0dmjulf9nebif0.fun","xn--n8jwbyc5ezgnfpeyd3i0a3ow693bw65a.com","sharpen-free-design-generator.netlify.app","a-b-c-d-e-f7011d0w3j3aor0dczs5ctoo2zpz1t6bm5f49.fun","a-b-c-d-e-f9jeats0w5hf22jbbxcrpnq37qq6nbxjwypsy.fun","a-b-c-d-e-fla3m19lerkfex1z9kdr5pd4hx0338uwsvbjx.fun","a-b-f2muvhnjw63ruyhoxhhrd61eszezz6jdj4jy1-b-d-t-s.fun","a-b-f7mh86v4lirbwg7m4qiwwlk2e4za9uyngqy1u-b-d-t-s.fun","a-b-fjkt8v1pxgzrc3lqoaz8fh7pjgygf4zh3eqhl-b-d-t-s.fun","a-b-fnv7h0323ap2wfqj1ruyo8id2bcuoq4kufzon-b-d-t-s.fun","a-b-fqmze5gr05g3y4azx9adr9bd2eow7xoqwbuxg-b-d-t-s.fun","ulike-filter-sowe-canplay-rightlets-generate-themrandomlyl89u8.fun"];

const $scriptletFromRegexes$ = /* 8 */ ["-embed.c","^moon(?:-[a-z0-9]+)?-embed\\.com$","63,64","moonfile","^moonfile-[a-z0-9-]+\\.com$","63,64",".","^[0-9a-z]{5,8}\\.(art|cfd|fun|icu|info|live|pro|sbs|world)$","63,64","-mkay.co","^moo-[a-z0-9]+(-[a-z0-9]+)*-mkay\\.com$","63,64","file-","^file-[a-z0-9]+(-[a-z0-9]+)*-(moon|embed)\\.com$","63,64","-moo.com","^fle-[a-z0-9]+(-[a-z0-9]+)*-moo\\.com$","63,64","filemoon","^filemoon-[a-z0-9]+(?:-[a-z0-9]+)*\\.(?:com|xyz)$","63,64","tamilpri","(\\d{0,1})?tamilprint(\\d{1,2})?\\.[a-z]{3,7}","110,1540,2355"];

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
