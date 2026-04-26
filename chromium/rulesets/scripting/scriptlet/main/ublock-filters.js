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

function freezeElementProperty(
    property = '',
    selector = '',
    pattern = ''
) {
    const safe = safeSelf();
    const logPrefix = safe.makeLogPrefix('freeze-element-property', property, selector, pattern);
    const matcher = safe.initPattern(pattern, { canNegate: true });
    const owner = (( ) => {
        if ( Object.hasOwn(Element.prototype, property) ) {
            return Element.prototype;
        }
        if ( Object.hasOwn(HTMLElement.prototype, property) ) {
            return HTMLElement.prototype;
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
[trustedJsonEditXhrRequest,adjustSetTimeout,jsonPruneFetchResponse,jsonPruneXhrResponse,trustedReplaceXhrResponse,trustedReplaceFetchResponse,trustedPreventDomBypass,jsonPrune,jsonEdit,setConstant,jsonlEditXhrResponse,noWindowOpenIf,abortCurrentScript,trustedSuppressNativeMethod,abortOnStackTrace,preventRequestAnimationFrame,preventInnerHTML,trustedSetConstant,trustedReplaceOutboundText,trustedReplaceArgument,preventXhr,preventSetTimeout,preventFetch,removeAttr,trustedOverrideElementMethod,preventAddEventListener,abortOnPropertyRead,adjustSetInterval,preventSetInterval,abortOnPropertyWrite,noWebrtc,noEvalIf,disableNewtabLinks,trustedJsonEditFetchResponse,trustedJsonEdit,trustedJsonEditXhrResponse,jsonEditXhrResponse,xmlPrune,m3uPrune,jsonEditFetchResponse,trustedPreventXhr,trustedPreventFetch,trustedEditInboundObject,spoofCSS,alertBuster,preventCanvas,jsonEditFetchRequest];

const $scriptletArgs$ = /* 3166 */ ["[?..userAgent*=\"channel\"]..client[?.clientName==\"WEB\"]+={\"clientScreen\":\"CHANNEL\"}","propsToMatch","/player?","[?..userAgent=/adunit|channel|lactmilli|instream|eafg/]..referer=repl({\"regex\":\"$\",\"replacement\":\"#reloadxhr\"})","[native code]","17000","0.001","adPlacements adSlots playerResponse.adPlacements playerResponse.adSlots [].playerResponse.adPlacements [].playerResponse.adSlots","","adPlacements adSlots playerResponse.adPlacements playerResponse.adSlots","/playlist?","/\\/player(?:\\?.+)?$/","\"adPlacements\"","\"no_ads\"","/playlist\\?list=|\\/player(?:\\?.+)?$|watch\\?[tv]=/","/\"adPlacements.*?([A-Z]\"\\}|\"\\}{2,4})\\}\\],/","/\"adPlacements.*?(\"adSlots\"|\"adBreakHeartbeatParams\")/gms","$1","player?","\"adSlots\"","/^\\W+$/","Node.prototype.appendChild","fetch","Request","JSON.parse","entries.[-].command.reelWatchEndpoint.adClientParams.isAd","/get_watch?","require.0.3.0.__bbox.require.[].3.1.__bbox.result.data.viewer.sideFeedUnit.nodes.[].new_adverts.nodes.[-].sponsored_data","data.viewer.sideFeedUnit.nodes.[].new_adverts.nodes.[-].sponsored_data","/graphql","..data.viewer..nodes.*[?.__typename==\"AdsSideFeedUnit\"]","Env.nxghljssj","false","require.0.3.0.__bbox.require.[].3.1.__bbox.result.data.serpResponse.results.edges.[-].rendering_strategy.view_model.story.sponsored_data.ad_id","..__bbox.result.data.node[?@.*.__typename==\"SponsoredData\"]",".data[?@.category==\"SPONSORED\"].node","..node[?.*.__typename==\"SponsoredData\"]",".data.viewer.news_feed.edges.*[?@.category==\"SPONSORED\"].node","console.clear","undefined","globalThis","break;case","WebAssembly","atob","Array.from","\"/NodeList/\"","prevent","inlineScript","Document.prototype.querySelectorAll","\"/^\\[d[a-z]t[a-z]?-[0-9a-z]{2,4}\\]$/\"","HTMLElement.prototype.querySelectorAll","\"/.*\\[[^imns].+\\].*/\"","Element.prototype.hasAttribute","\"/[\\S\\s]+/\"","Document.prototype.evaluate","\"/.*/\"","Document.prototype.createTreeWalker","aclib","/stackDepth:3\\s+get injectedScript.+inlineScript/","setTimeout","/stackDepth:3.+inlineScript:\\d{4}:1/","Date","MessageChannel","/stackDepth:2.+inlineScript/","/\\.(gif|jpe?g|png|webp)/","requestAnimationFrame","Array.prototype.join","/^[\\S\\s]{2000,6000}$/","DOMTokenList.prototype.remove","/^[\\S\\s]{3000,4000}$/","/cssText'|:'style'/","Promise.resolve","/jso\\$|\\(_0x|(['\"`]\\s*[-0-9A-Z_a-z]+\\s*['\"`],\\s*){50,}|ByDZ/","json:{\"isShowingPop\":false}","aclib.runInterstitial","{}","as","function","Function.prototype.toString","( ) => value","runInterstitial(e){if(this.#fe.interstitial)return void this.#r.error(\"interstitial zone already loaded on page\");this.#fe.interstitial=!0;const{zoneId:t,sub1:r,isAutoTag:n,collectiveZoneId:i,linkedZoneId:o,aggressivity:s,recordPageView:a,abTest:c,tagVersionSuffix:u}=e;if(!t)throw new Error(\"mandatory zoneId is not provided!\");if(!we(t))throw new Error(\"zoneId is not a string!\");this.#r.debug(\"loading interstitial on page\");const l={zoneId:t,sub1:r,isAutoTag:n,collectiveZoneId:i,linkedZoneId:o,aggressivity:s,recordPageView:a,abTest:c,tagVersionSuffix:u,adcashGlobalName:this.#xe,adserverDomain:this.#v,adblockSettings:this.#s,uniqueFingerprint:this.#C,isLoadedAsPartOfLibrary:!1};if(this.#pe.add(t),this.#Ce.Interstitial)return l.isLoadedAsPartOfLibrary=!0,void new this.#Ce.Interstitial(l);if(window.Interstitial)new Interstitial(l);else{const e=document.createElement(\"script\");e.type=\"text/javascript\",e.src=`${location.protocol}//${this.#he}/script/interstitial.js`,e.setAttribute(\"a-lib\",\"1\"),e.onload=()=>{new Interstitial(l)},e.onerror=()=>{this.#r.error(`failed loading ${e.src}`)},document.head.appendChild(e)}}","Element.prototype.getAttribute","0","json:\"class\"","condition","d-z","/vast.php?","/click\\.com|preroll|native_render\\.js|acscdn/","length:10001","]();}","500","162.252.214.4","true","c.adsco.re","adsco.re:2087","/^ [-\\d]/","Math.random","parseInt(localStorage['\\x","adBlockDetected","Math","localStorage['\\x","-load.com/script/","length:101",")](this,...","3000-6000","(new Error(","/fd/ls/lsp.aspx","document.getElementById","json:\"body\"","ad-detection-bait","document.querySelector","-id-","scriptBlocked","blocked","testUrls","[]",".offsetHeight>0","/^https:\\/\\/pagead2\\.googlesyndication\\.com\\/pagead\\/js\\/adsbygoogle\\.js\\?client=ca-pub-3497863494706299$/","data-instype","ins.adsbygoogle:has(> div#aswift_0_host)","stay","url:https://googleads.g.doubleclick.net/pagead/ads?client=ca-pub-3497863494706299 method:HEAD mode:no-cors","throttle","121","String.prototype.indexOf","json:\"/\"","/premium","HTMLIFrameElement.prototype.remove","iframe[src^=\"https://googleads.g.doubleclick.net/pagead/ads?client=ca-pub-3497863494706299\"]","adblock","4000-","++","g.doubleclick.net","length:100000","String.prototype.includes","/Copyright|doubleclick$/","favicon","length:252","Headers.prototype.get","/.+/","image/png.","/^text\\/plain;charset=UTF-8$/","json:\"content-type\"","cache-control","Headers.prototype.has","summerday","length:10","{\"type\":\"cors\"}","/offsetHeight|loaded/","HTMLScriptElement.prototype.onerror","pagead2.googlesyndication.com/pagead/js/adsbygoogle.js method:HEAD","emptyStr","Node.prototype.contains","{\"className\":\"adsbygoogle\"}","abort","load","showFallbackModal","Object.prototype.adsStrategy","json:{\"tag\":\"\",\"phase\":0,\"permaProvider\":0,\"tempoProvider\":0,\"buckets\":[],\"comment\":\"no-user\",\"rotationPaused\":true}","Keen","stream.insertion","/video/auth/media","akamaiDisableServerIpLookup","noopFunc","MONETIZER101.init","/outboundLink/","v.fwmrm.net/ad/g/","war:noop-vmap1.xml","DD_RUM.addAction","nads.createAd","trueFunc","t++","dvtag.getTargeting","ga","class|style","div[id^=\"los40_gpt\"]","huecosPBS.nstdX","null","config.globalInteractions.[].bsData","googlesyndication","DTM.trackAsyncPV","_satellite","_satellite.getVisitorId","mobileanalytics","newPageViewSpeedtest","pubg.unload","generateGalleryAd","mediator","Object.prototype.subscribe","gbTracker","gbTracker.sendAutoSearchEvent","Object.prototype.vjsPlayer.ads","marmalade","setInterval","url:ipapi.co","doubleclick","isPeriodic","*","data-woman-ex","a[href][data-woman-ex]","data-trm-action|data-trm-category|data-trm-label",".trm_event","KeenTracking","network_user_id","cloudflare.com/cdn-cgi/trace","History","/(^(?!.*(Function|HTMLDocument).*))/","api","google.ima.OmidVerificationVendor","Object.prototype.omidAccessModeRules","googletag.cmd","skipAdSeconds","0.02","/recommendations.","_aps","/api/analytics","Object.prototype.setDisableFlashAds","DD_RUM.addTiming","chameleonVideo.adDisabledRequested","AdmostClient","analytics","native code","15000","(null)","5000","datalayer","Object.prototype.isInitialLoadDisabled","lr-ingest.io","listingGoogleEETracking","dcsMultiTrack","urlStrArray","pa","Object.prototype.setConfigurations","/gtm.js","JadIds","Object.prototype.bk_addPageCtx","Object.prototype.bk_doJSTag","passFingerPrint","optimizely","optimizely.initialized","google_optimize","google_optimize.get","_gsq","_gsq.push","_gsDevice","iom","iom.c","_conv_q","_conv_q.push","google.ima.settings.setDisableFlashAds","pa.privacy","populateClientData4RBA","YT.ImaManager","UOLPD","UOLPD.dataLayer","__configuredDFPTags","URL_VAST_YOUTUBE","Adman","dplus","dplus.track","_satellite.track","/EzoIvent|TDELAY/","google.ima.dai","/froloa.js","adv","gfkS2sExtension","gfkS2sExtension.HTML5VODExtension","click","/event_callback=function\\(\\){window\\.location=t\\.getAttribute\\(\"href\"\\)/","AnalyticsEventTrackingJS","AnalyticsEventTrackingJS.addToBasket","AnalyticsEventTrackingJS.trackErrorMessage","initializeslideshow","b()","3000","ads","fathom","fathom.trackGoal","Origami","Origami.fastclick","{\"value\": \".ad-placement-interstitial\"}",".easyAdsBox","jad","hasAdblocker","Sentry","Sentry.init","TRC","TRC._taboolaClone","fp","fp.t","fp.s","initializeNewRelic","turnerAnalyticsObj","turnerAnalyticsObj.setVideoObject4AnalyticsProperty","turnerAnalyticsObj.getVideoObject4AnalyticsProperty","optimizelyDatafile","optimizelyDatafile.featureFlags","fingerprint","fingerprint.getCookie","gform.utils","gform.utils.trigger","get_fingerprint","moatPrebidApi","moatPrebidApi.getMoatTargetingForPage","readyPromise","cpd_configdata","cpd_configdata.url","yieldlove_cmd","yieldlove_cmd.push","dataLayer.push","1.1.1.1/cdn-cgi/trace","_etmc","_etmc.push","freshpaint","freshpaint.track","ShowRewards","stLight","stLight.options","DD_RUM.addError","sensorsDataAnalytic201505","sensorsDataAnalytic201505.init","sensorsDataAnalytic201505.quick","sensorsDataAnalytic201505.track","s","s.tl","taboola timeout","clearInterval(run)","smartech","/TDELAY|EzoIvent/","sensors","sensors.init","/piwik-","2200","2300","sensors.track","googleFC","adn","adn.clearDivs","_vwo_code","live.streamtheworld.com/partnerIds","gtag","_taboola","_taboola.push","clicky","clicky.goal","WURFL","_sp_.config.events.onSPPMObjectReady","gtm","gtm.trackEvent","mParticle.Identity.getCurrentUser","_omapp.scripts.geolocation","{\"value\": {\"status\":\"loaded\",\"object\":null,\"data\":{\"country\":{\"shortName\":\"\",\"longName\":\"\"},\"administrative_area_level_1\":{\"shortName\":\"\",\"longName\":\"\"},\"administrative_area_level_2\":{\"shortName\":\"\",\"longName\":\"\"},\"locality\":{\"shortName\":\"\",\"longName\":\"\"},\"original\":{\"ip\":\"\",\"ip_decimal\":null,\"country\":\"\",\"country_eu\":false,\"country_iso\":\"\",\"city\":\"\",\"latitude\":null,\"longitude\":null,\"user_agent\":{\"product\":\"\",\"version\":\"\",\"comment\":\"\",\"raw_value\":\"\"},\"zip_code\":\"\",\"time_zone\":\"\"}},\"error\":\"\"}}","JSGlobals.prebidEnabled","i||(e(),i=!0)","2500","elasticApm","elasticApm.init","ga.sendGaEvent","adConfig","ads.viralize.tv","adobe","MT","MT.track","ClickOmniPartner","adex","adex.getAdexUser","Adkit","Object.prototype.shouldExpectGoogleCMP","apntag.refresh","pa.sendEvent","Munchkin","Munchkin.init","Event","ttd_dom_ready","ramp","appInfo.snowplow.trackSelfDescribingEvent","_vwo_code.init","adobePageView","adobeSearchBox","elements",".dropdown-menu a[href]","dapTracker","dapTracker.track","newrelic","newrelic.setCustomAttribute","adobeDataLayer","adobeDataLayer.push","Object.prototype._adsDisabled","Object.defineProperty","1","json:\"_adsEnabled\"","_adsDisabled","utag","utag.link","_satellite.kpCustomEvent","Object.prototype.disablecommercials","Object.prototype._autoPlayOnlyWithPrerollAd","Sentry.addBreadcrumb","sensorsDataAnalytic201505.register","freestar.newAdSlots","String.prototype.allReplace","executaGoogleAnalytics3","initJWPlayerMux","initJWPlayerMux.utils","initJWPlayerMux.utils.now","ytInitialPlayerResponse.playerAds","ytInitialPlayerResponse.adPlacements","ytInitialPlayerResponse.adSlots","playerResponse.adPlacements","playerResponse.adPlacements playerResponse.playerAds playerResponse.adSlots adPlacements playerAds adSlots important","reelWatchSequenceResponse.entries.[-].command.reelWatchEndpoint.adClientParams.isAd entries.[-].command.reelWatchEndpoint.adClientParams.isAd","url:/reel_watch_sequence?","Object","fireEvent","enabled","force_disabled","hard_block","header_menu_abvs","10000","adsbygoogle","nsShowMaxCount","toiads","objVc.interstitial_web","adb","navigator.userAgent","require.0.3.0.__bbox.require.[].3.1.__bbox.result.data.serpResponse.results.edges.[-].relay_rendering_strategy.view_model.story.sponsored_data.ad_id","/\\{\"node\":\\{\"role\":\"SEARCH_ADS\"[^\\n]+?cursor\":[^}]+\\}/g","/api/graphql","/\\{\"node\":\\{\"__typename\":\"MarketplaceFeedAdStory\"[^\\n]+?\"cursor\":(?:null|\"\\{[^\\n]+?\\}\"|[^\\n]+?MarketplaceSearchFeedStoriesEdge\")\\}/g","/\\{\"node\":\\{\"__typename\":\"VideoHomeFeedUnitSectionComponent\"[^\\n]+?\"sponsored_data\":\\{\"ad_id\"[^\\n]+?\"cursor\":null\\}/","require.0.3.0.__bbox.require.[].3.1.__bbox.result.data.node","require.0.3.0.__bbox.require.[].3.1.__bbox.result.data.node.story.sponsored_data.ad_id","require.0.3.0.__bbox.require.[].3.1.__bbox.result.data.marketplace_search.feed_units.edges.[-].node.story.sponsored_data.ad_id","require.0.3.0.__bbox.require.[].3.1.__bbox.result.data.viewer.marketplace_feed_stories.edges.[-].node.story.sponsored_data.ad_id","data.viewer.instream_video_ads data.scrubber",".data.viewer.marketplace_feed_stories.edges.*[?@.node.__typename==\"MarketplaceFeedAdStory\"]","__eiPb","detector","_ml_ads_ns","jQuery","cookie","showAds","adBlockerDetected","show","SmartAdServerASMI","repl:/\"adBlockWallEnabled\":true/\"adBlockWallEnabled\":false/","adBlockWallEnabled","_sp_._networkListenerData","SZAdBlockDetection","_sp_.config","AntiAd.check","open","/^/","showNotice","_sp_","$","_sp_.mms.startMsg","retrievalService","admrlWpJsonP","yafaIt","LieDetector","ClickHandler","IsAdblockRequest","InfMediafireMobileFunc","1000","newcontent","ExoLoader.serve","Fingerprint2","request=adb","AdController","popupBlocked","/\\}\\s*\\(.*?\\b(self|this|window)\\b.*?\\)/","_0x","stop","onload","ga.length","btoa","adcashMacros","grecaptcha.ready","BACK","jwplayer.utils.Timer","puOverlay","adblock_added","admc","exoNoExternalUI38djdkjDDJsio96","String.prototype.charCodeAt","ai_","window.open","SBMGlobal.run.pcCallback","SBMGlobal.run.gramCallback","(!o)","(!i)","Object.prototype.hideAds","Object.prototype._getSalesHouseConfigurations","player-feedback","samInitDetection","decodeURI","decodeURIComponent","Date.prototype.toUTCString","Adcash","lobster","openLity","ad_abblock_ad","String.fromCharCode","shift","PopAds","AdBlocker","Adblock","addEventListener","displayMessage","runAdblock","document.createElement","TestAdBlock","ExoLoader","loadTool","cticodes","imgadbpops","document.write","redirect","4000","sadbl","adblockcheck","doSecondPop","arrvast","onclick","RunAds","/^(?:click|mousedown)$/","bypassEventsInProxies","jQuery.adblock","test-block","adi","ads_block","blockAdBlock","blurred","exoOpts","doOpen","prPuShown","flashvars.adv_pre_src","showPopunder","IS_ADBLOCK","page_params.holiday_promo","__NA","ads_priv","ab_detected","adsEnabled","document.dispatchEvent","t4PP","href|target","a[href=\"https://imgprime.com/view.php\"][target=\"_blank\"]","complete","String.prototype.charAt","sc_adv_out","mz","ad_blocker","AaDetector","_abb","puShown","/doOpen|popundr/","pURL","readyState","serve","stop()","Math.floor","AdBlockDetectorWorkaround","apstagLOADED","jQuery.hello","/Adb|moneyDetect/","isShowingAd","VikiPlayer.prototype.pingAbFactor","player.options.disableAds","__htapop","exopop","/^(?:load|click)$/","popMagic","script","atOptions","XMLHttpRequest","flashvars.adv_pre_vast","flashvars.adv_pre_vast_alt","x_width","getexoloader","disableDeveloper","oms.ads_detect","Blocco","2000","_site_ads_ns","hasAdBlock","pop","ltvModal","luxuretv.config","popns","pushiserve","creativeLoaded-","exoframe","/^load[A-Za-z]{12,}/","rollexzone","ALoader","Object.prototype.AdOverlay","tkn_popunder","detect","dlw","40000","ctt()","can_run_ads","test","adsBlockerDetector","NREUM","pop3","__ads","ready","popzone","FlixPop.isPopGloballyEnabled","falseFunc","/exo","ads.pop_url","checkAdblockUser","checkPub","6000","tabUnder","check_adblock","l.parentNode.insertBefore(s","_blank","ExoLoader.addZone","encodeURIComponent","isAdBlockActive","raConf","__ADX_URL_U","tabunder","RegExp","POSTBACK_PIXEL","mousedown","preventDefault","'0x","Aloader","advobj","replace","popTimes","addElementToBody","phantomPopunders","$.magnificPopup.open","adsenseadBlock","stagedPopUnder","seconds","clearInterval","CustomEvent","exoJsPop101","popjs.init","-0x","closeMyAd","smrtSP","adblockSuspected","nextFunction","250","xRds","cRAds","myTimer","1500","advertising","countdown","tiPopAction","rmVideoPlay","r3H4","disasterpingu","document.querySelectorAll","AdservingModule","backRedirect","adv_pre_duration","adv_post_duration","/^(click|mousedown|mousemove|touchstart|touchend|touchmove)/","system.popunder","ab1","ab2","hidekeep","pp12","__Y","App.views.adsView.adblock","document.createEvent","ShowAdbblock","style","clientHeight","flashvars.adv_pause_html","/^(?:click|mousedown|mousemove|touchstart|touchend|touchmove)$/","BOOTLOADER_LOADED","PerformanceLongTaskTiming","proxyLocation","Int32Array","$.fx.off","popMagic.init","/DOMContentLoaded|load/","y.readyState","document.getElementsByTagName","smrtSB","href","#opfk","byepopup","awm","location","adBlockEnabled","getCookie","history.go","dataPopUnder","/error|canplay/","(t)","EPeventFire","additional_src","300","____POP","openx","is_noadblock","window.location","()","hblocked","AdBlockUtil","css_class.show","/adbl/i","CANG","DOMContentLoaded","adlinkfly","updato-overlay","innerText","/amazon-adsystem|example\\.com/","document.cookie","|","attr","scriptSrc","SmartWallSDK","segs_pop","cxStartDetectionProcess","Abd_Detector","counter","paywallWrapper","isAdBlocked","/enthusiastgaming|googleoptimize|googletagmanager/","css_class","ez","path","*.adserverDomain","10","$getWin","/doubleclick|googlesyndication/","__NEXT_DATA__.props.clientConfigSettings.videoAds","blockAds","_ctrl_vt.blocked.ad_script","registerSlideshowAd","50","debugger","mm","shortener","require","/^(?!.*(einthusan\\.io|yahoo|rtnotif|ajax|quantcast|bugsnag))/","caca","getUrlParameter","trigger","Ok","given","getScriptFromCss","method:HEAD","safelink.adblock","goafricaSplashScreenAd","try","/adnxs.com|onetag-sys.com|teads.tv|google-analytics.com|rubiconproject.com|casalemedia.com/","openPopunder","0x","xhr.prototype.realSend","initializeCourier","userAgent","_0xbeb9","1800","popAdsClickCount","redirectPage","adblocker","ad_","azar","popunderSetup","https","popunder","preventExit","hilltop","jsPopunder","vglnk","aadblock","S9tt","popUpUrl","Notification","srcdoc","iframe","readCookieDelit","trafficjunky","checked","input#chkIsAdd","adSSetup","adblockerModal","750","html","capapubli","Aloader.serve","mouseup","sp_ad","app_vars.force_disable_adblock","adsHeight","onmousemove","button","yuidea-","adsBlocked","_sp_.msg.displayMessage","pop_under","location.href","_0x32d5","url","blur","CaptchmeState.adb","glxopen","adverts-top-container","disable","200","/googlesyndication|outbrain/","CekAab","timeLeft","testadblock","document.addEventListener","google_ad_client","UhasAB","adbackDebug","googletag","performance","rbm_block_active","adNotificationDetected","SubmitDownload1","show()","user=null","getIfc","!bergblock","overlayBtn","adBlockRunning","htaUrl","_pop","n.trigger","CnnXt.Event.fire","_ti_update_user","&nbsp","document.body.appendChild","BetterJsPop","/.?/","setExoCookie","adblockDetected","frg","abDetected","target","I833","urls","urls.0","Object.assign","KeepOpeningPops","bindall","ad_block","time","KillAdBlock","read_cookie","ReviveBannerInterstitial","eval","GNCA_Ad_Support","checkAdBlocker","midRoll","adBlocked","Date.now","AdBlock","iframeTestTimeMS","runInIframe","deployads","='\\x","Debugger","stackDepth:3","warning","100","_checkBait","[href*=\"ccbill\"]","close_screen","onerror","dismissAdBlock","VMG.Components.Adblock","adblock_popup","FuckAdBlock","isAdEnabled","promo","_0x311a","mockingbird","adblockDetector","crakPopInParams","console.log","hasPoped","Math.round","flashvars.protect_block","flashvars.video_click_url","h1mm.w3","banner","google_jobrunner","blocker_div","onscroll","keep-ads","#rbm_block_active","checkAdblock","checkAds","#DontBloxMyAdZ","#pageWrapper","adpbtest","initDetection","alert","check","isBlanketFound","showModal","myaabpfun","sec","_wm","adFilled","//","NativeAd","gadb","damoh.ani-stream.com","showPopup","mouseout","clientWidth","adrecover","checkadBlock","gandalfads","Tool","clientSide.adbDetect","HTMLAnchorElement.prototype.click","anchor.href","cmnnrunads","downloadJSAtOnload","run","ReactAds","phtData","adBlocker","StileApp.somecontrols.adBlockDetected","killAdBlock","innerHTML","google_tag_data","readyplayer","noAdBlock","autoRecov","adblockblock","popit","popstate","noPop","Ha","rid","[onclick^=\"window.open\"]","tick","spot","adsOk","adBlockChecker","_$","12345","flashvars.popunder_url","urlForPopup","isal","/innerHTML|AdBlock/","checkStopBlock","overlay","popad","!za.gl","document.hidden","adblockEnabled","ppu","adspot_top","is_adblocked","/offsetHeight|google|Global/","an_message","Adblocker","pogo.intermission.staticAdIntermissionPeriod","localStorage","timeoutChecker","t","my_pop","nombre_dominio",".height","!?safelink_redirect=","document.documentElement","break;case $.","time.html","block_detected","/^(?:mousedown|mouseup)$/","ckaduMobilePop","tieneAdblock","popundr","obj","ujsmediatags method:HEAD","adsAreBlocked","spr","document.oncontextmenu","document.onmousedown","document.onkeydown","compupaste","redirectURL","bait","!atomtt","TID","!/download\\/|link/","Math.pow","adsanity_ad_block_vars","pace","ai_adb","openInNewTab",".append","!!{});","runAdBlocker","setOCookie","document.getElementsByClassName","td_ad_background_click_link","initBCPopunder","flashvars.logo_url","flashvars.logo_text","nlf.custom.userCapabilities","displayCookieWallBanner","adblockinfo","JSON","pum-open","svonm","/\\/VisitorAPI\\.js|\\/AppMeasurement\\.js/","popjs","/adblock/i","count","LoadThisScript","showPremLite","closeBlockerModal","5","keydown","Popunder","ag_adBlockerDetected","document.head.appendChild","bait.css","Date.prototype.toGMTString","initPu","jsUnda","ABD","adBlockDetector.isEnabled","adtoniq","__esModule","break","myFunction_ads","areAdsDisplayed","gkAdsWerbung","pop_target","onLoadEvent","is_banner","$easyadvtblock","mfbDetect","!/^https:\\/\\/sendvid\\.com\\/[0-9a-z]+$/","Pub2a","length:40000-60000","block","console","send","ab_cl","V4ss","#clickfakeplayer","popunders","visibility","show_dfp_preroll","show_youtube_preroll","brave_load_popup","pageParams.dispAds","PrivateMode","scroll","document.bridCanRunAds","doads","pu","advads_passive_ads","tmohentai","pmc_admanager.show_interrupt_ads","ai_adb_overlay","AlobaidiDetectAdBlock","showMsgAb","Advertisement","type","input[value^=\"http\"]","wutimeBotPattern","adsbytrafficjunkycontext","abp1","$REACTBASE_STATE.serverModules.push","popup_ads","ipod","pr_okvalida","scriptwz_url","enlace","Popup","$.ajax","appendChild","Exoloader","offsetWidth","zomap.de","/$|adBlock/","adblockerpopup","adblockCheck","checkVPN","cancelAdBlocker","Promise","setNptTechAdblockerCookie","for-variations","!api?call=","cnbc.canShowAds","ExoSupport","/^(?:click|mousedown|mouseup)$/","di()","getElementById","loadRunative","value.media.ad_breaks","onAdVideoStart","zonefile","pwparams","fuckAdBlock","firefaucet","mark","stop-scrolling","detectAdBlock","Adv","blockUI","adsafeprotected","'\\'","oncontextmenu","Base64","disableItToContinue","google","parcelRequire","mdpDeBlocker","flashvars.adv_start_html","mobilePop","/_0x|debug/","my_inter_listen","EviPopunder","adver","tcpusher","preadvercb","document.readyState","prerollMain","popping","adsrefresh","/ai_adb|_0x/","canRunAds","mdp_deblocker","adBlock","bi()","#divDownload","modal","dclm_ajax_var.disclaimer_redirect_url","$ADP","load_pop_power","MG2Loader","/SplashScreen|BannerAd/","Connext","break;","checkTarget","i--","Time_Start","blocker","adUnits","afs_ads","b2a","data.[].vast_url","deleted","MutationObserver","ezstandalone.enabled","damoh","foundation.adPlayer.bitmovin","homad-global-configs","weltConfig.switches.videoAdBlockBlocker","XMLHttpRequest.prototype.open","svonm.com","/\"enabled\":\\s*true/","\"enabled\":false","adReinsertion","window.__gv_org_tfa","Object.prototype.adReinsertion","getHomadConfig","timeupdate","testhide","getComputedStyle","doOnce","popi","googlefc","angular","detected","{r()","450","ab","go_popup","Debug","offsetHeight","length","noBlocker","/youboranqs01|spotx|springserve/","js-btn-skip","r()","adblockActivated","penci_adlbock","Number.isNaN","fabActive","gWkbAdVert","noblock","wgAffiliateEnabled","!gdrivedownload","document.onclick","daCheckManager","prompt","data-popunder-url","saveLastEvent","friendlyduck",".post.movies","purple_box","detectAdblock","adblockDetect","adsLoadable","allclick_Public","a#clickfakeplayer",".fake_player > [href][target]",".link","'\\x","initAdserver","splashpage.init","window[_0x","checkSiteNormalLoad","/blob|injectedScript/","ASSetCookieAds","___tp","STREAM_CONFIGS",".clickbutton","Detected","XF","hide","mdp",".test","backgroundBanner","interstitial","letShowAds","antiblock","ulp_noadb",".show","url:!luscious.net","Object.prototype.adblock_detected","afterOpen","AffiliateAdBlock",".appendChild","adsbygoogle.loaded","ads_unblocked","xxSetting.adBlockerDetection","ppload","RegAdBlocking","a.adm","checkABlockP","Drupal.behaviors.adBlockerPopup","ADBLOCK","fake_ad","samOverlay","!refine?search","native","koddostu_com_adblock_yok","player.ads.cuePoints","adthrive","!t.me","bADBlock","better_ads_adblock","tie","Adv_ab","ignore_adblock","$.prototype.offset","ea.add","ad_pods.0.ads.0.segments.0.media ad_pods.1.ads.1.segments.1.media ad_pods.2.ads.2.segments.2.media ad_pods.3.ads.3.segments.3.media ad_pods.4.ads.4.segments.4.media ad_pods.5.ads.5.segments.5.media ad_pods.6.ads.6.segments.6.media ad_pods.7.ads.7.segments.7.media ad_pods.8.ads.8.segments.8.media","mouseleave","NativeDisplayAdID","t()","zendplace","mouseover","event.triggered","_cpp","sgpbCanRunAds","pareAdblock","ppcnt","data-ppcnt_ads","main[onclick]","Blocker","AdBDetected","navigator.brave","document.activeElement","{ \"value\": {\"tagName\": \"IFRAME\" }}","runAt","2","clickCount","body","hasFocus","{\"value\": \"Mozilla/5.0 (iPhone14,3; U; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/602.1.50 (KHTML, like Gecko) Version/10.0 Mobile/19A346 Safari/602.1\"}","timeSec","getlink","/wpsafe|wait/","timer","/getElementById|gotoo/","/visibilitychange|blur/","stopCountdown","ppuQnty","web_share_ads_adsterra_config wap_short_link_middle_page_ad wap_short_link_middle_page_show_time data.ads_cpm_info","value","Object.prototype.isAllAdClose","DOMNodeRemoved","data.meta.require_addon data.meta.require_captcha data.meta.require_notifications data.meta.require_og_ads data.meta.require_video data.meta.require_web data.meta.require_related_topics data.meta.require_custom_ad_step data.meta.og_ads_offers data.meta.addon_url data.displayAds data.linkCustomAdOffers","data.getDetailPageContent.linkCustomAdOffers.[-].title","data.getTaboolaAds.*","/chp_?ad/","/adblock|isRequestPresent/","bmcdn6","window.onload","devtools","documentElement.innerHTML","{\"type\": \"opaque\"}","document.hasFocus","/adoto|\\/ads\\/js/","htmls","?key=","isRequestPresent","xmlhttp","data-ppcnt_ads|onclick","#main","#main[onclick*=\"mainClick\"]",".btn-success.get-link","fouty","disabled",".btn-primary","focusOut","googletagmanager","shortcut","suaads","/\\$\\('|ai-close/","app_vars.please_disable_adblock","bypass",".MyAd > a[target=\"_blank\"]","antiAdBlockerHandler","onScriptError","php","div_form","private","navigator.webkitTemporaryStorage.queryUsageAndQuota","contextmenu","visibilitychange","remainingSeconds","0.1","Math.random() <= 0.15","checkBrowser","bypass_url","1600","class","#rtg-snp21","adsby","showadas","submit","validateForm","throwFunc","/pagead2\\.googlesyndication\\.com|inklinkor\\.com/","EventTarget.prototype.addEventListener","delete window","/countdown--|getElementById/","SMart1","/outbrain\\.com|adligature\\.com|quantserve\\.com|srvtrck\\.com|googlesyndication/","{\"type\": \"cors\"}","doTest","checkAdsBlocked",".btn","http","3","document.visibilityState","hidden","1e3*","/veepteero|tag\\.min\\.js/","aSl.gcd","/\\/4.+ _0/","chp_ad","document.documentElement.lang.toLowerCase","[onclick^=\"pop\"]","Light.Popup","window.addEventListener","json:\"load\"","maxclick","#get-link-button","Swal.fire","surfe.pro","czilladx","adsbygoogle.js","!devuploads.com","war:googlesyndication_adsbygoogle.js","window.adLink","localStorage._d","blank","google_srt","json:0.61234","vizier","checkAdBlock","shouldOpenPopUp","displayAdBlockerMessage","pastepc","detectedAdblock","pagead2.googlesyndication.com/pagead/js/adsbygoogle.js","googletagservices","isTabActive","a[target=\"_blank\"]","[href*=\"survey\"]","adForm","/adsbygoogle|googletagservices/","clicked","clicksCount",".data.isAdsEnabled=false","/api/files","document.createTreeWalker","json:{\"acceptNode\": \"function() { return NodeFilter.FILTER_REJECT; }\"}","decodeURIComponent(escape","..directLink","..props[?.children*=\"clicksCount\"].children","adskeeper",".downloadbtn","zigi_tag_id","setCookie","advertisement3","start","!/(flashbang\\.sh|dl\\.buzzheavier\\.com)/","!dl.buzzheavier.com","!buzzheavier.com","removeChild","notifyExec","fairAdblock","data.value data.redirectUrl data.bannerUrl","/admin/settings","!gcloud","/seconds--|timeLeft--/","json:\"click\"","json:\"main\"","/div-gpt-ad-dgking|\\.GoogleActiveViewElement/","/div-gpt-ad-|\\.adsbygoogle/","json:\"container\"","adblock_detected","/pub\\.clickadu|bing\\.com/","a","\"/chp_?ad/\"","/blocked|null|return/","remaining--","script[data-domain=","document.body.appendChild(s)","push",".call(null)","ov.advertising.tisoomi.loadScript","abp","userHasAdblocker","embedAddefend","/injectedScript.*inlineScript/","/(?=.*onerror)(?=^(?!.*(https)))/","/injectedScript|blob/","hommy.mutation.mutation","hommy","hommy.waitUntil","ACtMan","video.channel","/(www\\.[a-z]{8,16}\\.com|cloudfront\\.net)\\/.+\\.(css|js)$/","/popundersPerIP[\\s\\S]*?Date[\\s\\S]*?getElementsByTagName[\\s\\S]*?insertBefore/","clearTimeout","/www|cloudfront/","shouldShow","matchMedia","target.appendChild(s","l.appendChild(s)","document.body.appendChild(s","no-referrer-when-downgrade","/^data:/","Document.prototype.createElement","\"script\"","litespeed/js","appendTo:","myEl","ExoDetector","!embedy","Pub2","/loadMomoVip|loadExo|includeSpecial/","loadNeverBlock","flashvars.mlogo","adver.abFucker.serve","displayCache","vpPrerollVideo","SpecialUp","zfgloaded","parseInt","/btoa|break/","/\\st\\.[a-zA-Z]*\\s/","navigator","/(?=^(?!.*(https)))/","key in document","zfgformats","zfgstorage","zfgloadedpopup","/\\st\\.[a-zA-Z]*\\sinlineScript/","zfgcodeloaded","outbrain","/inlineScript|stackDepth:1/","wpadmngr.com","adserverDomain",".js?_=","FingerprintJS","/https|stackDepth:3/","HTMLAllCollection","shown_at","!/d/","PlayerConfig.config.CustomAdSetting","affiliate","_createCatchAllDiv","/click|mouse/","document","PlayerConfig.trusted","PlayerConfig.config.AffiliateAdViewLevel","univresalP","puTSstrpcht","!/prcf.fiyar|themes|pixsense|.jpg/","hold_click","focus","js_func_decode_base_64","decodeURIComponent(atob","/(?=^(?!.*(https|injectedScript)))/","jQuery.popunder","AdDetect","ai_front","abDetectorPro","/googlesyndication|doubleclick/","src=atob","Document.prototype.querySelector","\"/[0-9a-f]+-modal/\"","/\\/[0-9a-f]+\\.js\\?ver=/","tie.ad_blocker_detector","admiral","..admiralScriptCode",".props[?.id==\"admiral-bootstrap\"].dangerouslySetInnerHTML","decodeURI(decodeURI","dc.adfree","error","gnt.x.uam","interactive","g$.hp","json:{\"gnt-d-adm\":true,\"gnt-d-bt\":true}","gnt.u.z","__INITIAL_DATA__.siteData.admiralScript",".cmd.unshift","/admiral/","runtimeConfig.AM_PATH","..props[?.id==\"admiral-initializer\"].children","..props.children.*[?.key==\"admiral-script\"]","..props.config.ad.enabled=false","..Admiral.isEnabled=false","..admiral=false","/ad\\.doubleclick\\.net|static\\.dable\\.io/","error-report.com","loader.min.js","content-loader.com","HTMLScriptElement.prototype.setAttribute","/error-report|new Promise|;await new|:window|&&window,|void 0\\]/","objAd.loadAdShield","window.myAd.runAd","RT-1562-AdShield-script-on-Huffpost","{\"value\": \"(function(){let link=document.createElement('link');link.rel='stylesheet';link.href='//image.ygosu.com/style/main.css';document.head.appendChild(link)})()\"}","error-report","{\"value\": \"(function(){let link=document.createElement('link');link.rel='stylesheet';link.href='https://loawa.com/assets/css/loawa.min.css';document.head.appendChild(link)})()\"}","/07c225f3\\.online|content-loader\\.com|css-load\\.com|html-load\\.com/","html-load.com","repl:/\"$//","json:\"setTimeout((()=>{if(!location.pathname.startsWith('/game'))return;const t=document.getElementById('question-label');t&&(window.animation=lottie.loadAnimation({container:t,renderer:'svg',loop:!0,autoplay:!1,path:'/assets/animationsLottielab/gameDots.json'}))}),1e3);\"","__cfRLUnblockHandlers","disableAdShield","json:\"freestar-bootstrap\"","/^[A-Z][a-z]+_$/","\"data-sdk\"","abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789+/=","AHE.is_member","USER.features.ad_shield","AppBootstrapData.config.adshieldAdblockRecovery","AppBootstrapData.config.adshieldNativeAdRecovery","AppBootstrapData.__initializeFeatures__.adshieldAdblockRecovery.enabled","AppState.reduxState.features.adshieldAdblockRecovery","..adshieldAdblockRecovery=false","/fetchappbootstrapdata","..adshieldAdblockRecovery.enabled=false","__NEXT_DATA__.runtimeConfig.enableShieldScript","HT.features.ad_shield.enabled","HTMLScriptElement.prototype.onload","..AdShield.isEnabled=false","String.prototype.match","__adblocker","__INITIAL_STATE__.config.theme.ads.isAdBlockerEnabled","generalTimeLeft","__INITIAL_STATE__.gameLists.gamesNoPrerollIds.indexOf","DoodPop","__aaZoneid","#over","document.ontouchend","Array.prototype.shift","/^.+$/s","HTMLElement.prototype.click","premium","'1'","playID","openNewTab","download-wrapper","MDCore.adblock","Please wait","#downloadvideo","ads playerAds","pop_init","adsbyjuicy","mode:no-cors","prerolls midrolls postrolls comm_ad house_ad pause_ad block_ad end_ad exit_ad pin_ad content_pool vertical_ad elements","/detail","adClosedTimestamp","data.item.[-].business_info.ad_desc","/feed/rcmd","killads","NMAFMediaPlayerController.vastManager.vastShown","reklama-flash-body","fakeAd","adUrl",".azurewebsites.net","assets.preroll assets.prerollDebug","/stream-link","/doubleclick|ad-delivery|googlesyndication/","__NEXT_DATA__.runtimeConfig._qub_sdk.qubConfig.video.adBlockerDetectorEnabled","data.[].relationships.advert data.[].relationships.vast","offers","tampilkanUrl","()=>","2900-3100",".layers.*[?.metadata.name==\"POI_Ads\"]","/PCWeb_Real.json","/gaid=","war:noop-vast2.xml","consent","arePiratesOnBoard","__INIT_CONFIG__.randvar","instanceof Event","prebidConfig.steering.disableVideoAutoBid","xml","await _0x","json:\"Blog1\"","ad-top","adblock.js","adbl",".getComputedStyle","STORAGE2","app_advert","googletag._loaded_","closeBanner","NoTenia","breaks interstitials info","interstitials","xpath(//*[name()=\"Period\"][.//*[name()=\"BaseURL\" and contains(text(),\".mp.lura.live/prod/\")]] | //*[name()=\"MPD\"]/@mediaPresentationDuration)",".mpd","ads.policy.skipMode","/play","ad_slots","plugins.dfp","lura.live/prod/","/prog.m3u8","!embedtv.best",".offsetHeight","!asyaanimeleri.",".*[?.linkurl^=\"http\"]","initPop","app._data.ads","message","adsense","reklamlar","json:[{\"sure\":\"0\"}]","/api/video","Object.prototype.showInterstitialAd","skipAdblockCheck","/srvtrck|adligature|quantserve|outbrain/","createAgeModal","Object[_0x","adsPlayer","this","json:\"mozilla/5.0 (windows nt 10.0; win64; x64) applewebkit/537.36 (khtml, like gecko) chrome/145.0.0.0 safari/537.36\"","mozilla/5.0","popup=","()}",".art-control-fullscreen","pubAdsService","offsetLeft","config.pauseInspect","appContext.adManager.context.current.adFriendly","HTMLIFrameElement",".style","dsanity_ad_block_vars","show_download_links","downloadbtn","height","blockAdBlock._options.baitClass","/AdBlock/i","charAt","fadeIn","checkAD","latest!==","detectAdBlocker",".ready","/'shift'|break;/","document.blocked_var","____ads_js_blocked","wIsAdBlocked","WebSite.plsDisableAdBlock","css","videootv","ads_blocked","samDetected","Drupal.behaviors.agBlockAdBlock","NoAdBlock","mMCheckAgainBlock","countClicks","settings.adBlockerDetection","eabdModal","ab_root.show","gaData","wrapfabtest","fuckAdBlock._options.baitClass","$ado","/ado/i","app.js","popUnderStage","samAdBlockAction","googlebot","advert","bscheck.adblocker","qpcheck.ads","tmnramp","!sf-converter.com","clickAds.banner.urls","json:[{\"url\":{\"limit\":0,\"url\":\"\"}}]","ad","show_ads","ignielAdBlock","isContentBlocked","GetWindowHeight","/pop|wm|forceClick/","CloudflareApps.installs.Ik7rmQ4t95Qk.options.measureDomain","detectAB1",".init","ActiveXObject","uBlockOriginDetected","/_0x|localStorage\\.getItem/","google_ad_status","googletag._vars_","googletag._loadStarted_","google_unique_id","google.javascript","google.javascript.ads","google_global_correlator","ads.servers.[].apiAddress","paywallGateway.truncateContent","Constant","u_cfg","adBlockDisabled","__NEXT_DATA__.props.pageProps.adVideo","blockedElement","/ad","onpopstate","popState","adthrive.config","__C","ad-block-popup","exitTimer","innerHTML.replace","ajax","abu","countDown","HTMLElement.prototype.insertAdjacentHTML","_ads","eabpDialog","TotemToolsObject","puHref","flashvars.adv_postpause_vast","/Adblock|_ad_/","advads_passive_groups","GLX_GLOBAL_UUID_RESULT","Pop","f.parentNode.removeChild(f)","swal","keepChecking","t.pt","clickAnywhere urls","a[href*=\"/ads.php\"][target=\"_blank\"]","nitroAds","class.scroll","/showModal|isBlanketFound/","disableDeveloperTools","[onclick*=\"window.open\"]","openWindow","Check","checkCookieClick","readyToVote","12000","target|href","a[href^=\"//\"]","wpsite_clickable_data","insertBefore","offsetParent","meta.advertise","next","vidorev_jav_plugin_video_ads_object.vid_ads_m_video_ads","data.attributes.config.freewheel data.attributes.config.featureFlags.dPlayer","data.attributes.ssaiInfo.forecastTimeline data.attributes.ssaiInfo.vendorAttributes.nonLinearAds data.attributes.ssaiInfo.vendorAttributes.videoView data.attributes.ssaiInfo.vendorAttributes.breaks.[].ads.[].adMetadata data.attributes.ssaiInfo.vendorAttributes.breaks.[].ads.[].adParameters data.attributes.ssaiInfo.vendorAttributes.breaks.[].timeOffset","xpath(//*[name()=\"MPD\"][.//*[name()=\"BaseURL\" and contains(text(),'dash_clear_fmp4') and contains(text(),'/a/')]]/@mediaPresentationDuration | //*[name()=\"Period\"][./*[name()=\"BaseURL\" and contains(text(),'dash_clear_fmp4') and contains(text(),'/a/')]])","ssaiInfo","adsProvider.init","SDKLoaded","css_class.scroll","mnpwclone","0.3","7000","[href*=\"nihonjav\"]","/null|Error/","bannersRequest","vads","a[href][onclick^=\"getFullStory\"]","!newdmn","popUp","devtoolschange","rccbase_styles","POPUNDER_ENABLED","plugins.preroll","DHAntiAdBlocker","/out.php","ishop_codes","#advVid","location.replace","showada","showax","adp","__tnt","compatibility","popundrCheck","history.replaceState","rexxx.swp","constructor","p18","clickHandler","onbeforeunload","window.location.href","prebid","asc","json:{\"cmd\": [null], \"que\": [null], \"wrapperVersion\": \"6.19.0\", \"refreshQue\": {\"waitDelay\": 3000, \"que\": []}, \"isLoaded\": true, \"bidderSettings\": {}, \"libLoaded\": true, \"version\": \"v9.20.0\", \"installedModules\": [], \"adUnits\": [], \"aliasRegistry\": {}, \"medianetGlobals\": {}}","google_tag_manager","json:{ \"G-Z8CH48V654\": { \"_spx\": false, \"bootstrap\": 1704067200000, \"dataLayer\": { \"name\": \"dataLayer\" } }, \"SANDBOXED_JS_SEMAPHORE\": 0, \"dataLayer\": { \"gtmDom\": true, \"gtmLoad\": true, \"subscribers\": 1 }, \"sequence\": 1 }","ADBLOCKED","Object.prototype.adsEnabled","ai_run_scripts","clearInterval(i)","marginheight","ospen","pu_count","mypop","adblock_use","Object.prototype.adblockFound","download","1100","createCanvas","bizpanda","Q433","/pop|_blank/","movie.advertising.ad_server playlist.movie.advertising.ad_server","unblocker","playerAdSettings.adLink","playerAdSettings.waitTime","computed","manager","window.location.href=link","moonicorn.network","/dyn\\.ads|loadAdsDelayed/","xv.sda.pp.init","onreadystatechange","skmedix.com","skmedix.pl","MediaContainer.Metadata.[].Ad","doubleclick.com","opaque","_init","href|target|data-ipshover-target|data-ipshover|data-autolink|rel","a[href^=\"https://thumpertalk.com/link/click/\"][target=\"_blank\"]","/touchstart|mousedown|click/","latest","secs","event.simulate","isAdsLoaded","adblockerAlert","/^https?:\\/\\/redirector\\.googlevideo\\.com.*/","/.*m3u8/","cuepoints","cuepoints.[].start cuepoints.[].end cuepoints.[].start_float cuepoints.[].end_float","Period[id*=\"-roll-\"][id*=\"-ad-\"]","pubads.g.doubleclick.net/ondemand","/ads/banner","reachGoal","Element.prototype.attachShadow","Adb","randStr","SPHMoverlay","ai","timer.remove","popupBlocker","afScript","Object.prototype.parseXML","Object.prototype.blackscreenDuration","Object.prototype.adPlayerId","/ads",":visible","mMcreateCookie","downloadButton","SmartPopunder.make","readystatechange","document.removeEventListener",".button[href^=\"javascript\"]","animation","status","adsblock","pub.network","timePassed","timeleft","input[id=\"button1\"][class=\"btn btn-primary\"][disabled]","t(a)",".fadeIn()","result","evolokParams.adblock","[src*=\"SPOT\"]","asap stay",".pageProps.__APOLLO_STATE__.*[?.__typename==\"AotSidebar\"]","/_next/data","pageProps.__TEMPLATE_QUERY_DATA__.aotFooterWidgets","props.pageProps.data.aotHomepageTopBar props.pageProps.data.aotHomepageTopBar props.pageProps.data.aotHeaderAdScripts props.pageProps.data.aotFooterWidgets","counter--","daadb","l-1","_htas","magnificPopup","skipOptions","method:HEAD url:doubleclick.net","xpath(//*[name()=\"Period\"][.//*[name()=\"BaseURL\" and contains(text(),\"https:\")]])","style.display","tvid.in/log","1150","0.5","testadtags ad","document.referrer","quadsOptions","history.pushState","loadjscssfile","load_ads","/debugger|offsetParent/","/ads|imasdk/","6","__NEXT_DATA__.props.pageProps.adsConfig","make_rand_div","new_config.timedown","catch","google_ad","response.timeline.elements.[-].advertiserId","url:/api/v2/tabs/for_you","timercounter","document.location","innerHeight","cainPopUp","#timer","!bowfile.com","cloudfront.net/?","href|target|data-onclick","a[id=\"dl\"][data-onclick^=\"window.open\"]","a.getAttribute(\"data-ad-client\")||\"\"","truex","truex.client","answers","!display","/nerveheels/","No","foreverJQ","/document.createElement|stackDepth:2/","container.innerHTML","top-right","hiddenProxyDetected","8000","SteadyWidgetSettings.adblockActive","temp","inhumanity_pop_var_name","url:googlesyndication","enforceAdStatus","hashchange","history.back","starPop","Element.prototype.matches","litespeed","__PoSettings","HTMLSelectElement","youtube","aTagChange","Object.prototype.ads","display","a[onclick^=\"setTimeout\"]","detectBlockAds","eb","/analytics|livestats/","/nextFunction|2000/","resource_response.data.[-].pin_promotion_id resource_response.data.results.[-].pin_promotion_id","initialReduxState.pins.{-}.pin_promotion_id initialReduxState.resources.UserHomefeedResource.*.data.[-].pin_promotion_id","player","mahimeta","__htas","chp_adblock_browser","/adb/i","tdBlock",".t-out-span [href*=\"utm_source\"]","src",".t-out-span [src*=\".gif\"]","notifier","penciBlocksArray",".panel-body > .text-center > button","modal-window","isScrexed","fallbackAds","popurl","SF.adblock","() => n(t)","() => t()","startfrom","Math.imul","checkAdsStatus","wtg-ads","/ad-","void 0","/__ez|window.location.href/","D4zz","Object.prototype.ads.nopreroll_",").show()","/open.*_blank/","advanced_ads_ready","loadAdBlocker","HP_Scout.adBlocked","SD_IS_BLOCKING","isBlocking","adFreePopup","Object.prototype.isPremium","__BACKPLANE_API__.renderOptions.showAdBlock",".quiver-cam-player--ad-not-running.quiver-cam-player--free video","debug","Object.prototype.isNoAds","tv3Cmp.ConsentGiven","distance","site-access","chAdblock","/,ad\\n.+?(?=#UPLYNK-SEGMENT)/gm","/uplynk\\.com\\/.*?\\.m3u8/","remaining","/ads|doubleclick/","/Ads|adbl|offsetHeight/",".innerHTML","onmousedown",".ob-dynamic-rec-link","setupSkin","/app.js","dqst.pl","PvVideoSlider","_chjeuHenj","[].data.searchResults.listings.[-].targetingSegments","noConflict","preroll_helper.advs","/show|innerHTML/","create_ad","contador","Object.prototype.enableInterstitial","addAds","/show|document\\.createElement/","loadXMLDoc","register","MobileInGameGames","__osw","uniconsent.com","/coinzillatag|czilladx/","divWidth","Script_Manager","Script_Manager_Time","bullads","Msg","!download","/click|mousedown/","adjsData","AdService.info.abd","UABP","adBlockDetectionResult","popped","/xlirdr|hotplay\\-games|hyenadata/","document.body.insertAdjacentHTML","exo","tic","download_loading","detector_launch","pu_url","Click","afStorage","puShown1","onAdblockerDetected","htmlAds","second","lycos_ad","150","passthetest","checkBlock","/thaudray\\.com|putchumt\\.com/","popName","vlitag","asgPopScript","/(?=^(?!.*(jquery|turnstile|challenge-platform)))/","Object.prototype.loadCosplay","Object.prototype.loadImages","FMPoopS","/window\\['(?:\\\\x[0-9a-f]{2}){2}/","urls.length","importantFunc","console.warn","sam","current()","confirm","pandaAdviewValidate","showAdBlock","aaaaa-modal","/(?=^(?!.*(http)))/","$onet","adsRedirectPopups","canGetAds","method:/head/i","Array.prototype.includes","json:\"none\"","/brave-api|script-content|bait|real/","length:11000","goToURL","ad_blocker_active","init_welcome_ad","setinteracted",".MediaStep","data.xdt_injected_story_units.ad_media_items","dataLayer","document.body.contains","nothingCanStopMeShowThisMessage","window.focus","imasdk","TextEncoder.prototype.encode","!/^\\//","fakeElement","adEnable","ssaiInfo fallback.ssaiInfo","adtech-brightline adtech-google-pal adtech-iab-om","/playbackInfo","xpath(//*[name()=\"MPD\"]/@mediaPresentationDuration | //*[name()=\"Period\"]/@start | //*[name()=\"Period\"][not(.//*[name()=\"SegmentTimeline\"])][not(.//*[name()=\"ContentProtection\"])] | //*[name()=\"Period\"][./*[name()=\"BaseURL\"]][not(.//*[name()=\"ContentProtection\"])])","/-vod-.+\\.mpd/","htmlSectionsEncoded","event.dispatch","adx","popupurls","displayAds","cls_report?","-0x1","childNodes","wbar","[href=\"/bestporn.html\"]","_adshrink.skiptime","gclid","event","!yt1d.com","button#getlink","button#gotolink","AbleToRunAds","PreRollAd.timeCounter","result.ads","tpc.googlesyndication.com","id","#div-gpt-ad-footer","#div-gpt-ad-pagebottom","#div-gpt-ad-relatedbottom-1","#div-gpt-ad-sidebottom","goog","document.body","abpblocked","p$00a","openAdsModal","paAddUnit","gloacmug.net","items.[-].potentialActions.0.object.impressionToken items.[-].hasPart.0.potentialActions.0.object.impressionToken","context.adsIncluded","refresh","adt","Array.prototype.indexOf","interactionCount","/cloudfront|thaudray\\.com/","test_adblock","vastEnabled","/adskeeper|cloudflare/","#gotolink","detectadsbocker","c325","two_worker_data_js.js","adobeModalTestABenabled","FEATURE_DISABLE_ADOBE_POPUP_BY_COUNTRY","questpassGuard","isAdBlockerEnabled","shortConfig","akadb","eazy_ad_unblocker","json:\"\"","unlock","dataset.zone","adswizz.com","document.onkeypress","adsSrc","sssp","emptyObj","[style*=\"background-image: url\"]","[href*=\"click?\"]","/freychang|passback|popunder|tag|banquetunarmedgrater/","google-analytics","myTestAd","/<VAST version.+VAST>/","<VAST version=\\\"4.0\\\"></VAST>","deezer.getAudiobreak","Ads","smartLoaded","..ads_audio=false","ShowAdBLockerNotice","ad_listener","!shrdsk","notify","AdB","push-allow-modal",".hide","(!0)","Delay","ima","Cookiebot","\"adsBlocked\"","stream.insertion.adSession stream.insertion.points stream.insertion stream.sources.*.insertion pods.0.ads","ads.metadata ads.document ads.dxc ads.live ads.vod","site-access-popup","*.tanya_video_ads","deblocker","data?","script.src","/#EXT-X-DISCONTINUITY.{1,100}#EXT-X-DISCONTINUITY/gm","mixed.m3u8","feature_flags.interstitial_ads_flag","feature_flags.interstitials_every_four_slides","?","downloadToken","waldoSlotIds","Uint8Array","redirectpage","13500","adblockstatus","adScriptLoaded","/adoto|googlesyndication/","props.sponsoredAlternative","np.detect","ad-delivery","document.documentElement.lang","adSettings","banner_is_blocked","consoleLoaded?clearInterval","Object.keys","[?.context.bidRequestId].*","RegExp.prototype.test","json:\"wirtualnemedia\"","/^dobreprogramy$/","decodeURL","updateProgress","/salesPopup|mira-snackbar/","Object.prototype.adBlocked","DOMAssistant","rotator","adblock popup vast","detectImgLoad","killAdKiller","current-=1","/zefoy\\.com\\S+:3:1/","/getComputedStyle|bait/","AController_3","json:\"div\"","ins",".clientHeight","googleAd","/showModal|chooseAction|doAction|callbackAdsBlocked/","_shouldProcessLink","cpmecs","/adlink/i","[onclick]","noreferrer","[onload^=\"window.open\"]","dontask","aoAdBlockDetected","button[onclick^=\"window.open\"]","function(e)","touchstart","Brid.A9.prototype.backfillAdUnits","adlinkfly_url","siteAccessFlag","/adblocker|alert/","doubleclick.net/instream/ad_status.js","war:doubleclick_instream_ad_status.js","redURL","/children\\('ins'\\)|Adblock|adsbygoogle/","dct","slideShow.displayInterstitial","openPopup","Object.getPrototypeOf","plugins","ai_wait_for_jquery","pbjs","tOS2","ips","Error","/stackDepth:1\\s/","tryShowVideoAdAsync","chkADB","onDetected","detectAdblocker","document.ready","a[href*=\"torrentico.top/sim/go.php\"]","success.page.spaces.player.widget_wrappers.[].widget.data.intervention_data","VAST","{\"value\": \"Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Mobile/15E148 Safari/604.1\"}","navigator.standalone","navigator.platform","{\"value\": \"iPhone\"}","Storage.prototype.setItem","searchCount","empire.pop","empire.direct","empire.directHideAds","(!1)","pagead2.googlesyndication.com","empire.mediaData.advisorMovie","empire.mediaData.advisorSerie","fuckadb","[type=\"submit\"]","setTimer","auto_safelink","!abyss.to","daadb_get_data_fetch","penci_adlbock.ad_blocker_detector","siteAccessPopup","/adsbygoogle|adblock|innerHTML|setTimeout/","/innerHTML|_0x/","Object.prototype.adblockDetector","biteDisplay","blext","/[a-z]\\(!0\\)/","800","vidorev_jav_plugin_video_ads_object","vidorev_jav_plugin_video_ads_object_post","dai_iframe","popactive","/detectAdBlocker|window.open/","S_Popup","eazy_ad_unblocker_dialog_opener","rabLimit","-1","popUnder","/GoToURL|delay/","nudgeAdBlock","/googlesyndication|ads/","/Content/_AdBlock/AdBlockDetected.html","adBlckActive","AB.html","feedBack.showAffilaePromo","ShowAdvertising","a img:not([src=\"images/main_logo_inverted.png\"])","visible","a[href][target=\"_blank\"],[src^=\"//ad.a-ads.com/\"]","avails","amazonaws.com","ima3_dai","topaz.","FAVE.settings.ads.ssai.prod.clips.enabled","FAVE.settings.ads.ssai.prod.liveAuth.enabled","FAVE.settings.ads.ssai.prod.liveUnauth.enabled","xpath(//*[name()=\"MPD\"]/@mediaPresentationDuration | //*[name()=\"Period\"]/@start | //*[name()=\"Period\"][.//*[name()=\"BaseURL\" and contains(text(),\".prd.media.\")]])","/dash.mpd","/sandbox/i","analytics.initialized","autoptimize","UserCustomPop","method:GET","data.reg","time-events","/#EXTINF:[^\\n]+\\nhttps:\\/\\/redirector\\.googlevideo\\.com[^\\n]+/gms","/\\/ondemand\\/.+\\.m3u8/","/redirector\\.googlevideo\\.com\\/videoplayback[\\s\\S]*?dclk_video_ads/",".m3u8","phxSiteConfig.gallery.ads.interstitialFrequency","loadpagecheck","popupAt","modal_blocker","art3m1sItemNames.affiliate-wrapper","\"\"","isOpened","playerResponse.adPlacements playerResponse.playerAds adPlacements playerAds","Array.prototype.find","affinity-qi","GeneratorAds","isAdBlockerActive","pop.doEvent","'shift'","bFired","scrollIncrement","di.app.WebplayerApp.Ads.Adblocks.app.AdBlockDetectApp.startWithParent","a#downloadbtn[onclick^=\"window.open\"]","alink","/ads|googletagmanager/","sharedController.adblockDetector",".redirect","sliding","a[onclick]","infoey","settings.adBlockDetectionEnabled","displayInterstitialAdConfig","response.ads","/api","unescape","checkAdBlockeraz","blockingAds","Yii2App.playbackTimeout","setC","popup","/atob|innerHTML/","/adScriptPath|MMDConfig/","xpath(//*[name()=\"MPD\"]/@mediaPresentationDuration | //*[name()=\"Period\"]/@start | //*[name()=\"Period\"][.//*[name()=\"BaseURL\" and contains(text(),'adease')]])","[media^=\"A_D/\"]","adease adeaseBlob vmap","adease","aab","ips.controller.register","plugins.adService","QiyiPlayerProphetData.a.data","wait","/adsbygoogle|doubleclick/","adBreaks.[].startingOffset adBreaks.[].adBreakDuration adBreaks.[].ads adBreaks.[].startTime adBreak adBreakLocations","/session.json","xpath(//*[name()=\"Period\"][not(contains(@id,\"subclip\"))] | //*[name()=\"MPD\"]/@mediaPresentationDuration | //*[name()=\"Period\"]/@start)","/\\/episode\\/.+?\\.mpd\\?/","session.showAds","toggleAdBlockInfo","cachebuster","config","OpenInNewTab_Over","/native|\\{n\\(\\)/","[style^=\"background\"]","[target^=\"_\"]","bodyElement.removeChild","aipAPItag.prerollSkipped","aipAPItag.setPreRollStatus","\"ads_disabled\":false","\"ads_disabled\":true","payments","reklam_1_saniye","reklam_1_gecsaniye","reklamsayisi","reklam_1","psresimler","data","runad","url:doubleclick.net","war:googletagservices_gpt.js","[target=\"_blank\"]","\"flashtalking\"","/(?=^(?!.*(cdn-cgi)))/","criteo","war:32x32.png","HTMLImageElement.prototype.onerror","data.home.home_timeline_urt.instructions.[].entries.[-].content.itemContent.promotedMetadata","url:/Home","data.search_by_raw_query.search_timeline.timeline.instructions.[].entries.[-].content.itemContent.promotedMetadata","url:/SearchTimeline","data.threaded_conversation_with_injections_v2.instructions.[].entries.[-].content.items.[].item.itemContent.promotedMetadata","url:/TweetDetail","data.user.result.timeline_v2.timeline.instructions.[].entries.[-].content.itemContent.promotedMetadata","url:/UserTweets","data.immersiveMedia.timeline.instructions.[].entries.[-].content.itemContent.promotedMetadata","url:/ImmersiveMedia","powerAPITag","playerEnhancedConfig.run","rodo.checkIsDidomiConsent","protection","xtime","smartpop","EzoIvent","/doubleclick|googlesyndication|vlitag/","overlays","googleAdUrl","/googlesyndication|nitropay/","uBlockActive","/api/v1/events","Scribd.Blob.AdBlockerModal","AddAdsV2I.addBlock","xpath(//*[name()=\"Period\"][.//*[name()=\"BaseURL\" and contains(text(),'/ad/')]])","/Detect|adblock|style\\.display|\\[native code]|\\.call\\(null\\)/","/google_ad_client/","total","popCookie","/0x|sandCheck/","hasAdBlocker","ShouldShow","offset","startDownload","cloudfront","[href*=\"jump\"]","!direct","a0b","/outbrain|criteo|thisiswaldo|media\\.net|ohbayersbur|adligature|quantserve|srvtrck|\\.css|\\.js/","2000-5000","contrformpub","data.device.adsParams data.device.adSponsorshipTemplate","url:/appconfig","innerWidth","initials.yld-pdpopunder",".main-wrap","/googlesyndication|googima\\.js/","__brn_private_mode","download_click","Object.prototype.skipPreroll","/adskeeper|bidgear|googlesyndication|mgid/","fwmrm.net","/\\/ad\\/g\\/1/","adverts.breaks","result.responses.[].response.result.cards.[-].data.offers","ADB","downloadTimer","/ads|google/","injectedScript","/googlesyndication|googletagservices/","DisableDevtool","eClicked","number","sync","PlayerLogic.prototype.detectADB","ads-twitter.com","all","havenclick","VAST > Ad","/tserver","Object.prototype.prerollAds","secure.adnxs.com/ptv","war:noop-vast4.xml","notifyMe","alertmsg","/streams","adsClasses","gsecs","adtagparameter","dvsize","52","removeDLElements","/\\.append|\\.innerHTML|undefined|\\.css|blocker|flex|\\$\\('|obfuscatedMsg/","warn","adc","majorse","completed","testerli","showTrkURL","/popunder/i","readyWait","document.body.style.backgroundPosition","invoke","ssai_manifest ad_manifest playback_info.ad_info qvt.playback_info.ad_info","Object.prototype.setNeedShowAdblockWarning","load_banner","initializeChecks","HTMLDocument","video-popup","splashPage","adList","adsense-container","detect-modal","/_0x|dtaf/","ifmax","adRequest","nads","nitroAds.abp","adinplay.com","onloadUI","war:google-ima.js","/^data:text\\/javascript/","randomNumber","current.children","probeScript","PageLoader.DetectAb","!koyso.","adStatus","popUrl","one_time","PlaybackDetails.[].DaiVod","consentGiven","ad-block","data.searchClassifiedFeed.searchResultView.0.searchResultItemsV2.edges.[-].node.item.content.creative.clickThroughEvent.adsTrackingMetadata.metadata.adRequestId","data.me.personalizedFeed.feedItems.[-].promo.creative.clickThroughUrl.adsTrackingMetadata.metadata.adRequestId","data.me.rhrFeed.feedItems.[-].promo.creative.clickThroughUrl.adsTrackingMetadata.metadata.sponsor","mdpDeblocker","doubleclick.net","BN_CAMPAIGNS","media_place_list","...","/\\{[a-z]\\(!0\\)\\}/","canRedirect","/\\{[a-z]\\(e\\)\\}/","[].data.displayAdsV3.data.[-].__typename","[].data.TopAdsProducts.data.[-].__typename","[].data.topads.data.[-].__typename","/\\{\"id\":\\d{9,11}(?:(?!\"ads\":\\{\"id\":\"\").)+?\"ads\":\\{\"id\":\"\\d+\".+?\"__typename\":\"ProductCarouselV2\"\\},?/g","/graphql/InspirationCarousel","/\\{\"category_id\"(?:(?!\"ads\":\\{\"id\":\"\").)+?\"ads\":\\{\"id\":\"\\d+\".+?\"__typename\":\"ProductCarouselV2\"\\},?/g","/graphql/InspirationalCarousel","/\\{\"id\":\\d{9,11}(?:(?!\"isTopads\":false).)+?\"isTopads\":true.+?\"__typename\":\"recommendationItem\"\\},/g","/\\/graphql\\/productRecommendation/i","/,\\{\"id\":\\d{9,11}(?:(?!\"isTopads\":false).)+?\"isTopads\":true(?:(?!\"__typename\":\"recommendationItem\").)+?\"__typename\":\"recommendationItem\"\\}(?=\\])/","/\\{\"(?:productS|s)lashedPrice\"(?:(?!\"isTopads\":false).)+?\"isTopads\":true.+?\"__typename\":\"recommendationItem\"\\},?/g","/graphql/RecomWidget","/\\{\"appUrl\"(?:(?!\"isTopads\":false).)+?\"isTopads\":true.+?\"__typename\":\"recommendationItem\"\\},?/g","/graphql/ProductRecommendationQuery","adDetails","/secure?","data.search.products.[-].sponsored_ad.ad_source","url:/plp_search_v2?","GEMG.GPT.Interstitial","amiblock","String.prototype.concat","adBlockerDismissed","adBlockerDismissed_","karte3","18","callbackAdsBlocked","sandDetect",".ad-zone","showcfkModal","amodule.data","emptyArr","inner-ad","_ET","jssdks.mparticle.com","session.sessionAds session.sessionAdsRequired","/session","getComputedStyle(el)","/(?=^(?!.*(orchestrate|cloudflare)))/","Object.prototype.ADBLOCK_DETECTION",".features.*[?.slug==\"adblock-detection\"].enabled=false","/ad/","/count|verify|isCompleted/","postroll","itemList.[-].ad_info.ad_id","url:api/recommend/item_list/","/adinplay|googlesyndication/","!hidan.sh","ask","interceptClickEvent","isAdBlockDetected","pData.adblockOverlayEnabled","ad_block_detector","attached","div[class=\"share-embed-container\"]","/^\\w{11}[1-9]\\d+\\.ts/","cabdSettings","/outbrain|adligature|quantserve|adligature|srvtrck/","adsConfiguration","/vod",".streams.*.adUnits=[]","/manifest/video","/#EXTINF[^\\n]+\\n[^\\n]+?segment[^\\n]+/gms","layout.sections.mainContentCollection.components.[].data.productTiles.[-].sponsoredCreative.adGroupId","/search","fp-screen","puURL","!vidhidepre.com","[onclick*=\"_blank\"]","[onclick=\"goToURL();\"]","a[href][onclick^=\"window.open\"]","leaderboardAd","#leaderboardAd","placements.processingFile","dtGonza.playeradstime","\"-1\"","EV.Dab","ablk","shutterstock.com","Object.prototype.adUrl","sorts.[].recommendationList.[-].contentMetadata.EncryptedAdTrackingData","/ads|chp_?ad/","ads.[-].ad_id","wp-ad","/clarity|googlesyndication/","/aff|jump/","!/mlbbox\\.me|_self/","aclib.runPop","ADS.isBannersEnabled","ADS.STATUS_ERROR","json:\"COMPLETE\"","button[onclick*=\"open\"]","getComputedStyle(testAd)","openPopupForChapter","Object.prototype.popupOpened","src_pop","gifs.[-].cta.link","boosted_gifs","adsbygoogle_ama_fc_has_run","doThePop","thanksgivingdelights","yes.onclick","!vidsrc.","popundersPerIP","createInvisibleTrigger","jwDefaults.advertising","elimina_profilazione","elimina_pubblicita","snigelweb.com","abd","pum_popups","checkerimg","uzivo","openDirectLinkAd","!nikaplayer.com",".adsbygoogle:not(.adsbygoogle-noablate)","json:\"img\"","playlist.movie.advertising.ad_server","PopUnder","data.[].affiliate_url","cdnpk.net/v2/images/search?","cdnpk.net/Rest/Media/","war:noop.json","data.[-].inner.ctaCopy","?page=","/gampad/ads?",".adv-",".length === 0",".length === 31","window.matchMedia('(display-mode: standalone)').matches","Object.prototype.DetectByGoogleAd","a[target=\"_blank\"][style]","/adsActive|POPUNDER/i","/Executed|modal/","[breakId*=\"Roll\"]","/content.vmap","/#EXT-X-KEY:METHOD=NONE\\n#EXT(?:INF:[^\\n]+|-X-DISCONTINUITY)\\n.+?(?=#EXT-X-KEY)/gms","/media.m3u8","window.navigator.brave","showTav","document['\\x","showADBOverlay","springserve.com","document.documentElement.clientWidth","outbrain.com","s4.cdnpc.net/front/css/style.min.css","slider--features","s4.cdnpc.net/vite-bundle/main.css","data-v-d23a26c8","cdn.taboola.com/libtrc/san1go-network/loader.js","feOffset","hasAdblock","taboola","adbEnableForPage","/adblock|isblock/i","/\\b[a-z] inlineScript:/","result.adverts","data.pinotPausedPlaybackPage","fundingchoicesmessages","isAdblock","button[id][onclick*=\".html\"]","dclk_video_ads","ads breaks cuepoints times","odabd","pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?ord=","b.google_reactive_tag_first","sbs.demdex.net/dest5.html?d_nsid=0&ord=","Demdex.canSetThirdPartyCookies","securepubads.g.doubleclick.net/pagead/ima_ppub_config?ippd=https%3A%2F%2Fwww.sbs.com.au%2Fondemand%2F&ord=","[\"4117\"]","configs.*.properties.componentConfigs.slideshowConfigs.*.interstitialNativeAds","url:/config","list.[].link.kicker","/content/v1/cms/api/amp/Document","properties.tiles.[-].isAd","/mestripewc/default/config","openPop","circle_animation","CountBack","990","/location\\.(replace|href)|stopAndExitFullscreen/","displayAdBlockedVideo","/undefined|displayAdBlockedVideo/","cns.library","json:\"#app-root\"","google_ads_iframe","data-id|data-p","[data-id],[data-p]","BJSShowUnder","BJSShowUnder.bindTo","BJSShowUnder.add","JSON.stringify","Object.prototype._parseVAST","Object.prototype.createAdBlocker","Object.prototype.isAdPeriod","breaks custom_breaks_data pause_ads video_metadata.end_credits_time","pause_ads","/playlist","breaks","breaks custom_breaks_data pause_ads","xpath(//*[name()=\"MPD\"]/@mediaPresentationDuration | //*[name()=\"Period\"][.//*[name()=\"BaseURL\" and contains(text(),\"/ads-\")]] | //*[name()=\"Period\"][starts-with(@id,\"ad\")] | //*[name()=\"Period\"][starts-with(@id,\"Ad\")] | //*[name()=\"Period\"]/@start)","MPD Period[id^=\"Ad\"i]","ABLK","_n_app.popunder","_n_app.options.ads.show_popunders","N_BetterJsPop.object","jwplayer.vast","Fingerprent2","test.remove","isAdb","/click|mouse|touch/","opopnso","c0ZZ","cuepointPlaylist vodPlaybackUrls.result.playbackUrls.cuepoints vodPlaylistedPlaybackUrls.result.playbackUrls.pauseBehavior vodPlaylistedPlaybackUrls.result.playbackUrls.pauseAdsResolution vodPlaylistedPlaybackUrls.result.playbackUrls.intraTitlePlaylist.[-].shouldShowOnScrubBar ads","xpath(//*[name()=\"Period\"][.//*[@value=\"Ad\"]] | /*[name()=\"MPD\"]/@mediaPresentationDuration | //*[name()=\"Period\"]/@start)","[value=\"Ad\"]","xpath(//*[name()=\"Period\"][.//*[@value=\"Draper\"]] | /*[name()=\"MPD\"]/@mediaPresentationDuration | //*[name()=\"Period\"]/@start)","[value=\"Draper\"]","xpath(//*[name()=\"Period\"][.//*[name()=\"BaseURL\" and contains(text(),\"/interstitial/\")]] | /*[name()=\"MPD\"][.//*[name()=\"BaseURL\" and contains(text(),\"/interstitial/\")]]/@mediaPresentationDuration | /*[name()=\"MPD\"][.//*[name()=\"BaseURL\" and contains(text(),\"/interstitial/\")]]/*[name()=\"Period\"]/@start)","ue_adb_chk","ad.doubleclick.net bid.g.doubleclick.net ggpht.com google.co.uk google.com googleads.g.doubleclick.net googleads4.g.doubleclick.net googleadservices.com googlesyndication.com googleusercontent.com gstatic.com gvt1.com prod.google.com pubads.g.doubleclick.net s0.2mdn.net static.doubleclick.net surveys.g.doubleclick.net youtube.com ytimg.com","lifeOnwer","jsc.mgid.com","movie.advertising",".mandatoryAdvertising=false","/player/configuration","vast_urls","show_adverts","runCheck","adsSlotRenderEndSeen","DOMTokenList.prototype.add","\"-\"","removedNodes.forEach","__NEXT_DATA__.props.pageProps.broadcastData.remainingWatchDuration","json:9999999999","/\"remainingWatchDuration\":\\d+/","\"remainingWatchDuration\":9999999999","/stream","/\"midTierRemainingAdWatchCount\":\\d+,\"showAds\":(false|true)/","\"midTierRemainingAdWatchCount\":0,\"showAds\":false","a[href][onclick^=\"openit\"]","cdgPops","json:\"1\"","pubfuture","/doubleclick|google-analytics/","flashvars.mlogo_link","'script'","/ip-acl-all.php","URLlist","adBlockNotice","aaw","aaw.processAdsOnPage","displayLayer","adId","underpop","adBlockerModal","10000-15000","/adex|loadAds|adCollapsedCount|ad-?block/i","/^function\\(\\).*requestIdleCallback.*/","/function\\([a-z]\\){[a-z]\\([a-z]\\)}/","OneTrust","OneTrust.IsAlertBoxClosed","FOXIZ_MAIN_SCRIPT.siteAccessDetector","120000","openAdBlockPopup","drama-online","zoneid","\"data-cfasync\"","Object.init","advanced_ads_check_adblocker","div[class=\"nav tabTop\"] + div > div:first-child > div:first-child > a:has(> img[src*=\"/\"][src*=\"_\"][alt]), #head + div[id] > div:last-child > div > a:has(> img[src*=\"/\"][src*=\"_\"][alt])","/(?=^(?!.*(_next)))/","[].props.slides.[-].adIndex","#ad_blocker_detector","adblockTrigger","20","Date.prototype.toISOString","insertAd","!/^\\/|_self|alexsports|nativesurge/","method:HEAD mode:no-cors","attestHasAdBlockerActivated","extInstalled","blockThisUrl","SaveFiles.add","detectSandbox","bait.remove","/rekaa","pop_tag","/HTMLDocument|blob/","=","/wp-content\\/uploads\\/[a-z]+\\/[a-z]+\\.js/","google-ca-pub-4459622307906677","wbDeadHinweis","()=>{var c=Kb","0.2","fired","popupInterval","adbon","*.aurl","/cs?id=","repl:/\\.mp4$/.mp3/",".mp4","-banner","PopURL","LCI.adBlockDetectorEnabled","!y2meta","ConsoleBan","disableDevtool","ondevtoolopen","onkeydown","window.history.back","close","lastPopupTime","button#download","mode:\"no-cors\"","!magnetdl.","stoCazzo","_insertDirectAdLink","Visibility","importFAB","uas","ast","json:1","a[href][target=\"_blank\"]","url:ad/banner.gif","window.__CONFIGURATION__.adInsertion.enabled","window.__CONFIGURATION__.features.enableAdBlockerDetection","_carbonads","_bsa","redirectOnClick","widgets.outbrain.com","2d","/googletagmanager|ip-api/","&&",".ads={\"movie\":false,\"series\":false,\"episode\":false,\"comments\":false,\"preroll\":false}","/settings","()=>j(e=>e-1)","timeleftlink","handlePopup","bannerad sidebar ti_sidebar","moneyDetect","play","EFFECTIVE_APPS_GCB_BLOCKED_MESSAGE","style.setProperty","=null","sub","checkForAdBlocker","/navigator|location\\.href/","mode:cors","!self","/createElement|addEventListener|clientHeight/","uberad_mode","data.getFinalClickoutUrl data.sendSraBid",".php","!notunmovie","handleRedirect","testAd","imasdk.googleapis.com","/topaz/api","data.availableProductCount","results.[-].advertisement","/partners/home","__aab_init","show_videoad_limited","__NATIVEADS_CANARY__","[breakId]","_VMAP_","ad_slot_recs","/doc-page/recommenders",".smartAdsForAccessNoAds=true","/doc-page/afa","Object.prototype.adOnAdBlockPreventPlayback","pre_roll_url","post_roll_url",".result.PlayAds=false","/api/get-urls","/adsbygoogle|dispatchEvent/","OfferwallSessionTracker","player.preroll",".redirected",";if(!(","promos","TNCMS.DMP","/pop?","=>",".metadata.hideAds=true","a2d.tv/play/","adblock_detect","link.click","document.body.style.overflow","fallback","!addons.mozilla.org","rot_url","/await|clientHeight/","Function","..adTimeout=0","/api/v","!/\\/download|\\/play|cdn\\.videy\\.co/","!_self","#fab","www/delivery","/\\/js/","/\\/4\\//","prads","/googlesyndication|doubleclick|adsterra/",".adsbygoogle","/googlesyndication\\.com|offsetHeight/","String.prototype.split","null,http","..searchResults.*[?.isAd==true]","..mainContentComponentsListProps.*[?.isAd==true]","/search/snippet?","googletag.enums","json:{\"OutOfPageFormat\":{\"REWARDED\":true}}","cmgpbjs","displayAdblockOverlay","start_full_screen_without_ad","drupalSettings.coolmath.hide_preroll_ads",".submit","pbjs.libLoaded","flashvars.adv_pre_url","/!/","()&&","Object.prototype.adBlockerPop","clkUnder","adsArr","onClick","..data.expectingAds=false","/profile","[href^=\"https://whulsaux.com\"]","adRendered","Object.prototype.clickAds.emit","!storiesig","openUp",".result.timeline.*[?.type==\"ad\"]","/livestitch","protectsubrev.com","dispatchEvent(window.catchdo)","En(e-1)","!adShown","/blocker|detected/","3200-","/window\\.location\\.href/","AdProvider","AdProvider.push","ads_","ad_blocker_detector",".result.items.*[?.content*=\"'+'\"]","/comments","img[onerror]","..allowAdblock=true","/initPops|popLite|popunder/","[?.type==\"ads\"].visibility.status=\"hidden\"","/^755$/","shouldRun","ad-ipd","window.getComputedStyle","maddenwiped","/redirect.php?","*.*","/api/banners","checkBanners","/detect|bait/i","++;break;}}}}}","__adBlockState","__revCatchInitialized","ab.dt","json:\"header\"","/^[a-zA-Z]{15}$/","data.initPlaybackSession.adScenarios data.initPlaybackSession.adExperience.adExperienceTypes",".data.initPlaybackSession.adExperience.adsEnabled=false","ConFig.config.ads","json:{\"pause\":{\"state\":{}}}","Object.prototype.adblockPlugin","initializePopupAd","fireAd","juicy_tags","!youtu","data.*.elements.edges.[].node.outboundLink","data.children.[].data.outbound_link","method:POST url:/logImpressions","rwt",".js","_oEa","ADMITAD","body:browser","_hjSettings","bmak.js_post","method:POST","utreon.com/pl/api/event method:POST","log-sdk.ksapisrv.com/rest/wd/common/log/collect method:POST","firebase.analytics","require.0.3.0.__bbox.define.[].2.is_linkshim_supported","/(ping|score)Url","Object.prototype.updateModifiedCommerceUrl","HTMLAnchorElement.prototype.getAttribute","data-direct-ad","fingerprintjs-pro-react","flashvars.event_reporting","dataLayer.trackingId user.trackingId","Object.prototype.has_opted_out_tracking","cX_atfr","process","process.env","/VisitorAPI|AppMeasurement/","Visitor","''","?orgRef","analytics/bulk-pixel","eventing","send_gravity_event","send_recommendation_event","window.screen.height","method:POST body:zaraz","onclick|oncontextmenu|onmouseover","a[href][onclick*=\"this.href\"]","libAnalytics","json: {\"status\":{\"dataAvailable\":false},\"data\":{}}","libAnalytics.data.get","cmp.inmobi.com/geoip","method:POST url:pfanalytics.bentasker.co.uk","discord.com/api/v9/science","a[onclick=\"fire_download_click_tracking();\"]","adthrive._components.start","method:POST body:page_view",".*[?.operationName==\"TrackEvent\"]","/v1/api","ftr__startScriptLoad","url:/undefined method:POST","linkfire.tracking","miner","CoinNebula","blogherads","Math.sqrt","update","/(trace|beacon)\\.qq\\.com/","splunkcloud.com/services/collector","event-router.olympics.com","hostingcloud.racing","tvid.in/log/","excess.duolingo.com/batch","/eventLog.ajax","t.wayfair.com/b.php?","navigator.sendBeacon","segment.io","mparticle.com","ceros.com/a?data","pluto.smallpdf.com","method:/post/i url:/\\/\\/chatgpt\\.com\\/ces\\/v1\\/[a-z]$/","method:/post/i url:ab.chatgpt.com/v1/rgstr","/eventhub\\.\\w+\\.miro\\.com\\/api\\/stream/","logs.netflix.com","s73cloud.com/metrics/","location.reload",".cdnurl=[\"data:video/mp4;base64,AAAAHGZ0eXBNNFYgAAACAGlzb21pc28yYXZjMQAAAAhmcmVlAAAGF21kYXTeBAAAbGliZmFhYyAxLjI4AABCAJMgBDIARwAAArEGBf//rdxF6b3m2Ui3lizYINkj7u94MjY0IC0gY29yZSAxNDIgcjIgOTU2YzhkOCAtIEguMjY0L01QRUctNCBBVkMgY29kZWMgLSBDb3B5bGVmdCAyMDAzLTIwMTQgLSBodHRwOi8vd3d3LnZpZGVvbGFuLm9yZy94MjY0Lmh0bWwgLSBvcHRpb25zOiBjYWJhYz0wIHJlZj0zIGRlYmxvY2s9MTowOjAgYW5hbHlzZT0weDE6MHgxMTEgbWU9aGV4IHN1Ym1lPTcgcHN5PTEgcHN5X3JkPTEuMDA6MC4wMCBtaXhlZF9yZWY9MSBtZV9yYW5nZT0xNiBjaHJvbWFfbWU9MSB0cmVsbGlzPTEgOHg4ZGN0PTAgY3FtPTAgZGVhZHpvbmU9MjEsMTEgZmFzdF9wc2tpcD0xIGNocm9tYV9xcF9vZmZzZXQ9LTIgdGhyZWFkcz02IGxvb2thaGVhZF90aHJlYWRzPTEgc2xpY2VkX3RocmVhZHM9MCBucj0wIGRlY2ltYXRlPTEgaW50ZXJsYWNlZD0wIGJsdXJheV9jb21wYXQ9MCBjb25zdHJhaW5lZF9pbnRyYT0wIGJmcmFtZXM9MCB3ZWlnaHRwPTAga2V5aW50PTI1MCBrZXlpbnRfbWluPTI1IHNjZW5lY3V0PTQwIGludHJhX3JlZnJlc2g9MCByY19sb29rYWhlYWQ9NDAgcmM9Y3JmIG1idHJlZT0xIGNyZj0yMy4wIHFjb21wPTAuNjAgcXBtaW49MCBxcG1heD02OSBxcHN0ZXA9NCB2YnZfbWF4cmF0ZT03NjggdmJ2X2J1ZnNpemU9MzAwMCBjcmZfbWF4PTAuMCBuYWxfaHJkPW5vbmUgZmlsbGVyPTAgaXBfcmF0aW89MS40MCBhcT0xOjEuMDAAgAAAAFZliIQL8mKAAKvMnJycnJycnJycnXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXiEASZACGQAjgCEASZACGQAjgAAAAAdBmjgX4GSAIQBJkAIZACOAAAAAB0GaVAX4GSAhAEmQAhkAI4AhAEmQAhkAI4AAAAAGQZpgL8DJIQBJkAIZACOAIQBJkAIZACOAAAAABkGagC/AySEASZACGQAjgAAAAAZBmqAvwMkhAEmQAhkAI4AhAEmQAhkAI4AAAAAGQZrAL8DJIQBJkAIZACOAAAAABkGa4C/AySEASZACGQAjgCEASZACGQAjgAAAAAZBmwAvwMkhAEmQAhkAI4AAAAAGQZsgL8DJIQBJkAIZACOAIQBJkAIZACOAAAAABkGbQC/AySEASZACGQAjgCEASZACGQAjgAAAAAZBm2AvwMkhAEmQAhkAI4AAAAAGQZuAL8DJIQBJkAIZACOAIQBJkAIZACOAAAAABkGboC/AySEASZACGQAjgAAAAAZBm8AvwMkhAEmQAhkAI4AhAEmQAhkAI4AAAAAGQZvgL8DJIQBJkAIZACOAAAAABkGaAC/AySEASZACGQAjgCEASZACGQAjgAAAAAZBmiAvwMkhAEmQAhkAI4AhAEmQAhkAI4AAAAAGQZpAL8DJIQBJkAIZACOAAAAABkGaYC/AySEASZACGQAjgCEASZACGQAjgAAAAAZBmoAvwMkhAEmQAhkAI4AAAAAGQZqgL8DJIQBJkAIZACOAIQBJkAIZACOAAAAABkGawC/AySEASZACGQAjgAAAAAZBmuAvwMkhAEmQAhkAI4AhAEmQAhkAI4AAAAAGQZsAL8DJIQBJkAIZACOAAAAABkGbIC/AySEASZACGQAjgCEASZACGQAjgAAAAAZBm0AvwMkhAEmQAhkAI4AhAEmQAhkAI4AAAAAGQZtgL8DJIQBJkAIZACOAAAAABkGbgCvAySEASZACGQAjgCEASZACGQAjgAAAAAZBm6AnwMkhAEmQAhkAI4AhAEmQAhkAI4AhAEmQAhkAI4AhAEmQAhkAI4AAAAhubW9vdgAAAGxtdmhkAAAAAAAAAAAAAAAAAAAD6AAABDcAAQAAAQAAAAAAAAAAAAAAAAEAAAAAAAAAAAAAAAAAAAABAAAAAAAAAAAAAAAAAABAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAwAAAzB0cmFrAAAAXHRraGQAAAADAAAAAAAAAAAAAAABAAAAAAAAA+kAAAAAAAAAAAAAAAAAAAAAAAEAAAAAAAAAAAAAAAAAAAABAAAAAAAAAAAAAAAAAABAAAAAALAAAACQAAAAAAAkZWR0cwAAABxlbHN0AAAAAAAAAAEAAAPpAAAAAAABAAAAAAKobWRpYQAAACBtZGhkAAAAAAAAAAAAAAAAAAB1MAAAdU5VxAAAAAAALWhkbHIAAAAAAAAAAHZpZGUAAAAAAAAAAAAAAABWaWRlb0hhbmRsZXIAAAACU21pbmYAAAAUdm1oZAAAAAEAAAAAAAAAAAAAACRkaW5mAAAAHGRyZWYAAAAAAAAAAQAAAAx1cmwgAAAAAQAAAhNzdGJsAAAAr3N0c2QAAAAAAAAAAQAAAJ9hdmMxAAAAAAAAAAEAAAAAAAAAAAAAAAAAAAAAALAAkABIAAAASAAAAAAAAAABAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAGP//AAAALWF2Y0MBQsAN/+EAFWdCwA3ZAsTsBEAAAPpAADqYA8UKkgEABWjLg8sgAAAAHHV1aWRraEDyXyRPxbo5pRvPAyPzAAAAAAAAABhzdHRzAAAAAAAAAAEAAAAeAAAD6QAAABRzdHNzAAAAAAAAAAEAAAABAAAAHHN0c2MAAAAAAAAAAQAAAAEAAAABAAAAAQAAAIxzdHN6AAAAAAAAAAAAAAAeAAADDwAAAAsAAAALAAAACgAAAAoAAAAKAAAACgAAAAoAAAAKAAAACgAAAAoAAAAKAAAACgAAAAoAAAAKAAAACgAAAAoAAAAKAAAACgAAAAoAAAAKAAAACgAAAAoAAAAKAAAACgAAAAoAAAAKAAAACgAAAAoAAAAKAAAAiHN0Y28AAAAAAAAAHgAAAEYAAANnAAADewAAA5gAAAO0AAADxwAAA+MAAAP2AAAEEgAABCUAAARBAAAEXQAABHAAAASMAAAEnwAABLsAAATOAAAE6gAABQYAAAUZAAAFNQAABUgAAAVkAAAFdwAABZMAAAWmAAAFwgAABd4AAAXxAAAGDQAABGh0cmFrAAAAXHRraGQAAAADAAAAAAAAAAAAAAACAAAAAAAABDcAAAAAAAAAAAAAAAEBAAAAAAEAAAAAAAAAAAAAAAAAAAABAAAAAAAAAAAAAAAAAABAAAAAAAAAAAAAAAAAAAAkZWR0cwAAABxlbHN0AAAAAAAAAAEAAAQkAAADcAABAAAAAAPgbWRpYQAAACBtZGhkAAAAAAAAAAAAAAAAAAC7gAAAykBVxAAAAAAALWhkbHIAAAAAAAAAAHNvdW4AAAAAAAAAAAAAAABTb3VuZEhhbmRsZXIAAAADi21pbmYAAAAQc21oZAAAAAAAAAAAAAAAJGRpbmYAAAAcZHJlZgAAAAAAAAABAAAADHVybCAAAAABAAADT3N0YmwAAABnc3RzZAAAAAAAAAABAAAAV21wNGEAAAAAAAAAAQAAAAAAAAAAAAIAEAAAAAC7gAAAAAAAM2VzZHMAAAAAA4CAgCIAAgAEgICAFEAVBbjYAAu4AAAADcoFgICAAhGQBoCAgAECAAAAIHN0dHMAAAAAAAAAAgAAADIAAAQAAAAAAQAAAkAAAAFUc3RzYwAAAAAAAAAbAAAAAQAAAAEAAAABAAAAAgAAAAIAAAABAAAAAwAAAAEAAAABAAAABAAAAAIAAAABAAAABgAAAAEAAAABAAAABwAAAAIAAAABAAAACAAAAAEAAAABAAAACQAAAAIAAAABAAAACgAAAAEAAAABAAAACwAAAAIAAAABAAAADQAAAAEAAAABAAAADgAAAAIAAAABAAAADwAAAAEAAAABAAAAEAAAAAIAAAABAAAAEQAAAAEAAAABAAAAEgAAAAIAAAABAAAAFAAAAAEAAAABAAAAFQAAAAIAAAABAAAAFgAAAAEAAAABAAAAFwAAAAIAAAABAAAAGAAAAAEAAAABAAAAGQAAAAIAAAABAAAAGgAAAAEAAAABAAAAGwAAAAIAAAABAAAAHQAAAAEAAAABAAAAHgAAAAIAAAABAAAAHwAAAAQAAAABAAAA4HN0c3oAAAAAAAAAAAAAADMAAAAaAAAACQAAAAkAAAAJAAAACQAAAAkAAAAJAAAACQAAAAkAAAAJAAAACQAAAAkAAAAJAAAACQAAAAkAAAAJAAAACQAAAAkAAAAJAAAACQAAAAkAAAAJAAAACQAAAAkAAAAJAAAACQAAAAkAAAAJAAAACQAAAAkAAAAJAAAACQAAAAkAAAAJAAAACQAAAAkAAAAJAAAACQAAAAkAAAAJAAAACQAAAAkAAAAJAAAACQAAAAkAAAAJAAAACQAAAAkAAAAJAAAACQAAAAkAAACMc3RjbwAAAAAAAAAfAAAALAAAA1UAAANyAAADhgAAA6IAAAO+AAAD0QAAA+0AAAQAAAAEHAAABC8AAARLAAAEZwAABHoAAASWAAAEqQAABMUAAATYAAAE9AAABRAAAAUjAAAFPwAABVIAAAVuAAAFgQAABZ0AAAWwAAAFzAAABegAAAX7AAAGFwAAAGJ1ZHRhAAAAWm1ldGEAAAAAAAAAIWhkbHIAAAAAAAAAAG1kaXJhcHBsAAAAAAAAAAAAAAAALWlsc3QAAAAlqXRvbwAAAB1kYXRhAAAAAQAAAABMYXZmNTUuMzMuMTAw\"]","/storage-resolve/files/audio/interactive"];

const $scriptletArglists$ = /* 3750 */ "0,0,1,2;0,3,1,2;1,4,5,6;2,7,8,1,2;2,9,8,1,10;3,7,8,1,11;4,12,13,14;4,15,8,14;4,16,17,11;5,12,13,18;5,19,13,18;5,19,13,20;6,21,22;6,21,23;6,21,24;7,25;5,19,13,26;7,27;3,28,8,1,29;8,30;9,31,32;7,33;8,34;10,35,1,29;10,36,1,29;10,37,1,29;11;9,38,39;12,40,41;12,42,43;13,44,45,46,47;13,48,49;13,50,51;13,52,53,46,47;13,54,55,46,47;13,56,55,46,47;14,57,58;14,59,60;15,61;14,62,63;16,8,64;15,65;12,66,67;12,68,69;12,21,70;12,71,72;17,57,73;9,74,75,76,77;18,78,79,80;19,81,82,83,84,85;20,86;20,87,88;21,89,90;20,91,92;20,93;20,94;11,95;12,96,97;9,98,39;12,99,100;22,101,102;21,103,104;21,105,104;20,106;19,107,82,108,84,109;19,110,82,108,84,111;9,112,32;9,113,32;9,114,115;21,116;20,117;23,118,119,120;22,121,8,8,122,123;19,124,82,125,84,126;24,127,128;21,129;21,8,130;15,131;22,132,133;19,134,82,8,84,135;22,136,137;18,138,139,140,84,141;19,138,82,142,84,143;19,144,82,142,84,143;22,145,146,147;21,148;9,149,39;22,150,151;13,152,153,154;25,155,156;17,157,158,76,77;26,159;3,160,8,1,161;9,162,163;26,164;1,165;22,166,167;20,166,167;9,168,163;9,169,170;1,171,90;9,172,170;9,173,163;23,174,175;9,176,177;7,178;22,179;9,180,163;9,181,75;9,182,163;20,183;27;9,184,163;9,185,163;9,186,163;9,187,163;9,188,163;9,189,75;9,190,163;9,191,163;22,192;28,193;22,194;22,195;1,196,197;23,198,199;23,200,201,120;12,202;9,203,8;20,204;20,195;14,205,206;22,207;9,208,75;9,209,75;9,210,75;27,211,8,212;20,213;9,214,75;20,215;9,216,163;20,207;9,217,163;9,218,92;9,219,75;9,220,75;1,221,222,6;1,223,224,6;9,225,115;9,226,163;20,227;9,228,163;9,229,163;9,230,163;9,231,75;9,232,163;20,233;26,234;9,235,163;9,236,163;9,237,163;9,238,75;9,239,92;9,240,75;9,241,163;9,242,75;9,243,163;9,244,8;9,245,75;9,246,163;9,247,75;9,248,163;9,249,163;9,250,75;9,251,163;9,252,163;9,253,75;9,254,75;9,255,75;9,256,75;9,257,75;9,258,75;9,259,163;9,260,163;1,261,224;9,262,75;20,263;27,264,197;9,265,75;9,266,163;25,267,268;9,269,75;9,270,163;9,271,163;9,272,163;1,273,274;1,275,197;9,276,75;9,277,163;9,278,75;9,279,163;19,110,82,280,84,281;9,282,39;9,283,92;9,284,75;9,285,163;9,286,75;9,287,115;9,288,75;9,289,163;9,290,163;9,291,163;9,292,75;9,293,163;9,294,163;9,295,75;9,296,115;9,297,75;9,298,163;9,299,163;9,300,163;9,301,163;9,302,75;9,303,163;1,304,224,6;9,305,75;9,306,8;9,307,75;9,308,163;9,309,163;20,310;9,311,75;9,312,163;9,313,75;9,314,163;9,315,163;9,316,75;9,317,163;9,318,163;9,319,75;9,320,163;9,321,163;9,322,163;9,323,75;9,324,163;1,325,197,6;1,326,224,6;9,327,163;22,204;1,328,197,6;9,329,75;9,330,163;22,331;1,196,332,6;1,196,333,6;9,334,163;21,335;9,336,75;9,337,163;9,338,75;20,339;9,340,163;9,341,75;9,342,163;9,343,75;9,344,163;9,345,75;9,346,163;9,347,75;9,348,163;9,349,163;17,350,351;9,352,32;1,4,274,6;1,353,354,6;9,355,75;9,356,163;9,357,163;1,358,197,6;20,359;9,360,75;9,361,75;9,362,163;9,363,163;9,364,75;9,365,163;9,366,163;9,367,32;9,368,163;9,369,163;9,370,75;9,371,163;25,267,372;9,373,163;9,374,39;9,375,163;9,376,163;9,377,163;9,378,163;25,267,8,379,380;9,381,75;9,382,163;9,383,75;9,384,163;9,385,75;9,386,163;9,387,92;19,388,389,390,84,391;9,392,75;9,393,163;9,394,163;9,395,92;9,396,32;9,397,163;9,398,163;9,399,170;9,400,389;9,401,163;9,402,75;9,403,75;9,404,163;9,405,39;9,406,39;9,407,39;9,408,39;7,409;2,410,8,1,411;25,155,412;28,413,90;7,414,415;25,155,416;28,417,418;22,419;9,420,82;22,421;9,422,8;28,423;26,424;7,425;4,426,75,427;4,428,75,427;4,429,75,427;7,430,431;7,432;7,433;3,434,8,1,427;10,435,29;26,436;26,437;25,8,423;21,423;9,438,177;12,439,440;12,441;21,442;21,443;26,444;19,24,82,445,84,446;1,8,418;26,447;29,448;9,449,39;30;26,450;12,451;22,452;25,267,453;29,454;12,455,447;26,456;26,457;26,458;29,459;26,460;25,267,461;25,155,462;21,463,464;26,465;26,466;29,467;20,468;9,469,163;12,110,470;12,99,471;1,472,197;26,473;26,451;25,155,474;26,475;26,476;26,38;29,477;1,478,197;25,8,479;26,480;26,481;26,482;12,59,483;26,484;14,485,486;12,455,487;29,451;26,488;26,489;25,155,490;25,155,491;20,179;9,492,92;9,493,163;22,494;12,455,495;12,496,497;26,498;26,499;12,455,500;29,501;29,502;12,503,504;26,505;25,8,472;12,455,506;25,8,507;12,508,509;26,510;21,483;12,511,483;29,499;26,441;12,439,512;26,513;26,514;29,515;29,516;12,107,517;1,518,519;14,474,47;26,98;9,520,32;9,521,32;26,522;9,523,115;23,524;26,525;25,526,527;26,528;12,455,529;12,455,530;12,455,39;26,531;26,532;9,533,32;26,496;12,474,451;26,534;26,535;26,536;9,537,8;9,538,32;29,539;9,540,92;29,541;29,542;29,543;9,544,92;26,545;12,455,507;29,546;26,511;23,547,548,549;9,550,170;1;29,551;25,8,451;26,552;9,553,32;26,554;12,513;26,555;12,556,557;29,558;28,559;12,455,560;27,561;26,562;29,563;21,564;9,532,92;26,565;21,566;26,567;9,568,163;9,569,92;29,570;25,267,571;25,572,573;12,511,574;29,575;12,99,576;9,38,170;9,577,8;9,578,8;9,579,389;25,580;21,581;26,582;21,583,584;9,585,92;26,586;25,8,587;12,455,588;9,589,8;26,590;14,424,591;25,155,592;15,593;25,594;14,511,595;26,596;9,597,163;9,598,177;14,110,599;1,600,601;1,602,464,6;9,603,92;21,604,82;9,605,163;9,40,177;26,606;9,129,32;12,607,487;9,608,92;12,439,609;29,610;9,611,612;25,8,613;26,614;21,615,464;12,59,464;21,616,617;26,618;12,43,497;9,619,92;12,511,620;28,472;25,8,621;26,622;29,623;9,624,32;26,625;12,626;12,43,627;12,628,629;25,630,631;21,632;26,633;26,634;31,635;26,636;26,637;26,638;9,639,163;12,107,39;9,640,163;29,641;1,642;27,643;21,110,224;26,644;26,645;26,646;12,508,647;29,648;29,649;9,650,32;21,651,652;9,653,92;9,654,32;27,655,656;12,473,129;25,155,657;27,658,584;29,659;29,513;26,660;25,267,631;26,661;9,662,32;25,155,584;12,663,573;12,43;26,664;21,665;29,666;29,667;25,668,669;12,670,671;29,672;25,155,423;12,439,673;26,674;9,675,32;26,608;21,663,464;12,496,43;26,676;29,677;21,678;21,679;26,541;31,513;9,680,8;21,508,82;25,681,669;25,8,632;12,439,476;12,476,682;26,683;26,684;26,685;9,686,92;9,38,163;21,651,584;26,687;25,155,651;25,688,689;12,690,524;29,691;23,692,693;21,694,224;12,695,696;9,697,32;11,621;26,129;12,698;25,8,699;26,700;9,556,92;25,701,702;29,703;21,704,705;12,608;12,59,706;22,707;12,708,709;21,710,584;25,155,711;12,455,712;9,441,92;21,713;25,8,714;21,714;12,455,443;29,98;21,715,274;25,716,717;21,718,90;12,59,110;21,719,584;11,720;12,439,721;11,722;9,723,75;9,724,8;26,725;29,726;12,107,129;9,727,163;26,728;27,729,584;26,730;9,731,32;20,732;21,733;1,734,197,212;9,129,163;9,735,8;7,197,736;11,8,737;12,24,43;12,476;29,738;20,739;9,740,39;12,455,741;9,742,32;9,532,163;26,743;21,710,744;21,745;26,746;25,716,747;26,748;20,749;9,750,163;26,751;12,474,476;25,630,752;9,753,92;11,754;12,496,755;26,454;22,756;9,757,32;26,758;12,107,759;20,760;9,761,163;25,8,762;29,763;21,764,274;12,455,765;26,766;27,8,767;26,768;27,8,8,82;21,769;12,107,770;20,771;12,772,518;12,455,772;26,773;14,721,774;25,526,775;25,716,776;12,562,777;26,778;25,526,472;12,455,779;12,59,780;26,781;29,782;21,472,584;26,783;12,508,511;29,476;23,784,785;12,786;12,43,496;12,474;12,388,787;29,497;23,788,789;26,790;26,721;28,791,464;21,275,792;12,455,793;26,794;9,476,177;26,795;25,796,621;9,797,92;26,570;26,798;29,799;23,800,801;27,802,197;9,803,32;9,804,163;25,267,805;21,806,90;12,570;26,807;25,155,808;12,809;9,810,39;26,811;12,455,451;25,155,812;21,507,224;21,813,814;20,815;29,803;21,816,82;27,817;12,107,818;12,819,820;9,821,32;26,822;26,823;26,824;21,825,464;22,275;9,826,32;29,827;21,828;28,829,464;29,830;21,472;11,831,737;12,107,832;29,833;9,43,163;25,8,61;26,834;9,835,163;21,836,389;9,837,163;12,107,275;9,838,163;20,756;25,716,839;12,503,497;12,388,840;26,841;1,842,519;26,843;26,623;12,455,844;9,129,389;9,845,389;21,846;23,847;29,848;7,849,850;12,851,775;21,455;21,852,464;29,633;29,853;21,806;12,107,854;9,855,82;9,275,92;29,856;25,267,857;26,858;12,859,635;9,860,92;29,861;21,423,82;25,8,862;21,863;9,864,163;12,439,865;9,528,389;12,59,866;12,59,867;29,868;12,562,866;12,99,869;26,870;14,503,871;21,872,873;28,874;23,692,875;29,876;12,511,877;21,419;12,439,878;25,267,472;9,879,32;22,179,756;26,835;21,880,90;26,881;26,882;26,883;21,507;26,884;29,885;27,8,8,6;9,886,170;12,887;12,474,524;26,888;9,889,92;14,890,47;9,891,8;9,892,39;9,528,32;21,806,418;26,893;12,107,894;9,895,92;12,107,896;12,107,897;21,898,584;21,899,464;26,900;29,901;12,455,902;12,455,903;12,455,894;21,895;12,107,904;12,455,905;12,107,906;29,907;22,195,146,147;21,177,519;25,155,908;25,155,909;12,508,651;21,710,354;21,910,274;27,855;9,911,82;26,912;21,913,354;21,710,222;25,267,752;11,914;29,496;26,915;9,916,32;12,455,129;22,917;21,918;25,919,920;21,921;9,922,163;12,455,923;21,710,464;12,511,924;9,925,163;9,926,163;25,716,927;12,503,43;9,928,92;29,929;1,930;29,931;12,690,574;29,932;9,933,32;9,98,163;9,934,163;21,721,354;21,487;29,935;21,936;9,937,163;21,938,584;9,939,92;29,933;25,155,940;28,710,224;26,941;26,942;25,943,944;29,945;26,946;14,511,47;23,524,947;1,948;29,949;9,950,92;12,485,627;12,455,951;28,952,953;9,954,8;26,497;12,455,955;9,907,92;9,956,92;21,957;20,275;21,958;12,819,267;12,107,959;12,193,696;26,960;11,961,82;9,962,92;9,695,92;27,643,197;9,963,32;25,526,964;21,965,656;9,966,32;21,967;1,8,8,212;21,968,90;21,969,418;25,267,221;26,576;9,970,82;9,827,163;26,971;27,642;21,972;27,8,8,212;9,973,82;25,267,621;26,974;26,975;12,98;12,455,976;11,977;26,503;12,978,979;12,628,762;27,980,464;29,981;25,982,762;9,983,163;12,96,894;9,984,82;25,267,985;11,129,389,986;22,987;25,267;9,988,32;12,989;12,990;12,991;12,992;25,716,993;26,994;21,995,389;11,996;12,848;26,997;11,998;9,999,163;26,1000;26,1001;21,1002;9,1003,163;28,1004,464;25,630,1005;9,1006,32;26,231;12,439,775;12,721,1007;29,1008;9,507,32;26,1009;12,819,1010;26,474;9,1011,8;9,1012,8;9,1013,32;14,43,47;26,901;21,1014;12,107,1015;12,43,623;12,1016,472;21,1017;20,1018;20,1019;21,959,584;14,99,47;26,1020;25,716,1021;21,1021;12,455,770;21,890,464;9,1022,82;9,1023,92;9,1024,92;9,1025,32;21,129,1026;25,1027;26,1028;21,1029;21,177;12,511,1030;12,59,1031;26,1032;26,1033;26,1034;12,628,632;29,1035;9,1036,612;26,1037;12,511,1038;12,99,1039;26,1040;9,1041,92;9,1042,92;9,1043,177;14,107,1044;9,1045,92;9,1046,32;1,948,464,6;29,1047;26,775;11,1048;26,1049;22,179,1050;25,716,419;21,423,617;12,107,1051;12,511,1052;12,107,1053;29,1054;26,906;12,819,651;11,452,389;26,1055;23,692,1056;26,1057;25,452,762;28,1058,464;21,520;12,388,41;26,57;9,1059,32;9,1060,32;21,1061;26,551;26,1062;25,155,1063;25,1064,472;26,1065;9,1066,92;12,517,785;26,1067;26,62;9,1034,163;26,1068;31,1069;26,1070;29,1071;9,1072,92;29,1073;9,1074,389;31,275;23,1075,1076;12,61,869;12,1030,869;29,1077;9,98,32;21,1078;11,275;9,1079,389;26,1080;29,1081;21,1082;9,1083,92;12,476,692;26,1084;12,1085;12,819,1086;9,1087,170;12,690,1088;12,96,1089;21,1090;22,1091;12,439,39;21,1092;29,1093;29,1094;25,716,1095;29,1096;12,455,865;12,1097,959;12,511,959;26,1098;12,107,1099;11,1100,737,986;29,129;9,1101,92;29,1102;25,1103,1104;12,455,1105;21,710;26,1106;7,1107;28,1108;12,96,1109;26,1110;12,511,587;26,1111;9,1112,92;21,865;14,412,1113;21,1114;26,1115;21,1116;21,1117,584;22,1118;9,954,39;12,550;25,8,1119;26,803;23,1120;26,1121;12,623,576;12,1122;22,1123;26,1124;21,1125;9,1126,8;25,943;9,264,92;29,1127;21,1128;28,1128;25,267,1129;26,1130;12,1131;12,511,1132;25,8,487;26,1133;28,549,744;28,1134;9,1135,39;12,514,1136;25,155,1088;12,107,1137;21,1138;9,1139,92;29,1140;21,1141;21,8,389;25,8,1142;9,467,92;21,39;21,907,389;12,455,1143;29,909;12,455,1144;12,439,1111;21,803;9,1145,8;26,1146;9,1147,163;26,1148;12,439,129;27,1149;1,1149;26,1150;12,503,1151;21,651;25,8,1152;9,98,92;12,890,1109;12,439,1002;27,1153;9,1154,82;21,1155;20,195,146;26,1156;21,1157,584;28,762;28,770;26,1158;7,1159;27,8,197,82;9,532,170;21,995;25,267,775;12,455,59;12,107,1160;12,455,275;12,439,770;12,455,1161;12,99,632;12,455,96;9,1162,92;20,1163;9,1164,75;20,1165;9,1166,32;14,1167,1168;4,1169,1170,1168;7,1171;9,1172,39;9,1173,163;9,1174,163;25,1175;7,414,1176;21,1177,652;21,113;12,1178;12,59,1179;12,1180;25,1064,1105;26,1181;12,455,1182;21,1183,82;21,651,1184;25,155,39;9,1185,32;25,716,1084;9,1186,75;25,155,762;21,1187;25,716,476;12,455,1188;12,107,1189;9,1190,92;9,419,177;12,511,129;20,1191;27,1192,464;21,1193,82;26,929;28,1058;28,785;25,1194;26,1195;12,455,476;26,1196;9,1197,32;21,604,873;9,1198,92;9,1199,92;9,1200,32;9,275,177;11,1201;12,1202,775;32;29,1203;12,859,865;12,455,1204;23,1205;31,745;25,267,1206;26,1066;12,455,1207;12,99,497;12,455,474;25,267,8,379,1208;21,1209;20,419;9,1210,163;26,886;26,1211;9,1212,92;12,835;12,1213;23,692,1214;23,692,1215;23,692,1216;12,99,1217;26,1218;26,1219;12,503,1220;25,8,443;25,842,573;21,1221;14,888,1222;9,1223,177;21,762;12,663,358;26,1224;26,1225;23,847,1226;12,508,820;21,1227,90;12,110,1228;12,455,1229;21,1230;25,8,275;26,1125;12,455,1231;29,1232;25,267,1233;9,1234,92;21,1144;25,155,1235;28,419;9,1236,92;21,1237,464;22,1238;9,1239,32;12,455,1155;12,439,1155;21,1240;7,1241;21,1237;25,155,1242;9,1243,92;9,1244,92;12,474,129;9,1245,32;26,1180;26,1246;26,1247;12,511,1248;9,451,39;26,1249;9,1250,177;12,508,1251;12,439,267;9,1252,92;12,497,486;21,809;25,8,476;21,1253;11,1254;21,1255;27,658,197,6;26,1140;9,1256,177;9,419,170;9,1257,39;26,1258;11,1259;21,1260;21,696;9,98,177;25,716,865;9,1261,389;26,1262;26,517;9,1263,32;26,1264;26,1265;12,43,472;21,906;26,1266;9,1141,32;7,1267;25,1268,1269;21,1270,82;21,275;12,455,1271;25,1272,1273;25,716,803;14,623,47;1,8,418,82;26,477;26,1274;9,1275,92;26,1276;11,1277;23,1278,1279;12,508,1155;12,508,1280;12,508,506;12,819,803;28,936;9,962,32;29,1281;9,1282,39;17,1283,1284,1285,1286;26,1287;27,842,197,212;21,906,584;19,1177,82,1288,84,1177;9,1289,170;17,424,1290;27,729,197,212;9,1291,82;1,1292,197,6;27,1293,197,6;27,1294,197,212;1,1295,197,212;26,1281;27,842,197,6;25,1296;25,809,1297;31,1298;7,1299;1,1300,197;9,1301,92;12,508,1302;12,545,644;12,474,419;7,1303;7,1304;7,1305;31,1306;21,1307;22,1308;12,1309,1310;21,1311;22,195,8,1312;9,1313,170;12,1309,936;22,1314;25,155,1315;12,508,1310;12,508,275;11,1316;9,1317,92;26,1318;23,1319,1320;23,1319,1321,120;23,524,1322,120;9,1323,92;23,1324,1325;25,809,1326;22,1327;27,817,197,6;26,990;26,1328;14,110,1329;27,1294,197,6;1,1330,197,6;27,729,197,6;25,716,699;21,1188;26,1331;25,155,1332;31,803;23,692,1333;25,716,1334;25,716,806;21,472,90;29,1335;23,1278,8,120;11,1336;9,783,39;1,1337;9,1338,32;9,1339,163;9,992,163;25,1340,631;25,1341,1342;1,8,197,1343;18,497,1344,32;29,1309;14,424,1345;26,1346;27,1294,464,6;27,1294,1347,6;25,267,1028;12,511,1334;23,1348,1349,120;26,991;27,1022,197,6;25,1340;21,1317;22,1350;9,1351,92;25,1352,1353;9,906,1354;20,1355;12,1356,1357;25,716,615;21,900;27,1358,197,6;1,1105,197,6;31,423;26,1359;22,1360,1361;27,842,197;1,842,197;25,155,1362;26,1363;23,524,1364;31,964;14,107,803;11,8,1026;1,842,197,6;14,22,1365;17,1283,1284,1285,1366;9,1367,1368;1,1105,197;21,1369;22,1370;11,452,737;21,8,584;21,452,464;9,1371,82;11,1372;31,1373;25,716,1374;23,524,1375;26,1376;19,1377,82,1378,84,1064;25,267,1379;25,267,8,379,1380;26,1315;26,1381;22,1382;20,1383;31,419;22,1384;11,1385;27,8,197,212;1,8,197,212;22,419,1386;9,1387,177;12,24,1388;25,267,1389;17,1390,1391;9,1392,75;21,1393;25,267,487;25,267,1394;21,1395;12,663,1396;25,267,511;9,1397,39;25,716,451;22,1398;22,1399;27,658;9,1400,92;24,926,1401;23,692,1402,120;25,267,1403;27,658,464,6;22,1404;25,809;1,8,617;12,59,971;14,690,803;9,1405,1286;27,658,464;1,948,464;12,22,96;22,739;28,1316;12,24,1030;25,267,451;25,267,1406;33,1407,1,1408;19,1409,1286,1410;12,59,1411;8,1412;8,1413;22,1414;23,1324,1415;25,267,587;25,267,1088;11,1416;26,43;12,698,1417;9,1418,92;26,1419;11,1420;11,1421;11,1422;25,267,1423;28,1424;12,511,803;14,107,1425;3,1426,8,1,1427;11,1428;20,1123,146;11,8,737,986;27,1429,197;19,819,82,1430,84,1341;19,110,82,1431,84,1432;19,663,82,1431,84,1433;19,107,82,1434,84,1435;22,1436;21,1437,652;13,859,1438;21,1439;27,1440,197;25,716,1441;12,511,1441;25,155,1442;21,1443,90;21,1444,737;21,1444;9,1445,163;21,223,737;9,1446,32;21,1447;26,1448;14,99,877;14,96,1449;14,96,1450;14,96,1451;12,59,1452;9,1453,75;9,1454,163;12,1455;7,1456;18,43,139,8,84,1457;25,267,573;12,43,1458;12,1459,1458;18,43,139,8,84,1460;29,835;25,8,573;12,455,573;12,42,1097;25,8,1461;12,59,620;12,1462,620;12,511,1463;12,511,1464;25,155,1465;12,511,1466;12,511,620,1467;13,1468,1469,46,1470;12,511,1471;31,620;12,545,1472;26,1473;11,1474;26,1475;25,8,571;21,1476;14,511,1477;9,1478,8;26,1479;29,1480;28,452;9,1481,39;21,1088;29,1482;12,99,1483;12,24,979;12,1484,979;25,8,979;12,99,979;12,503,1485;14,96,1486;12,24,1097;12,1487,979;14,412,1488;12,1356,1489;26,1490;26,1491;12,1097,24;12,1097,979;12,1016,41;12,496,1492;14,96,1493;12,99,1494;20,1495;14,576,1496;12,42,43,1467;12,61,1497;12,40,1498,1467;12,517,1499;12,1487,1500;14,476,1501;12,22,41;12,508,1502;25,630,1503;11,1504;9,1505,115;21,1506;14,690,1507;25,1508,4,379,1509;9,1510,92;9,1511,1366;9,1512,163;25,155,1513;27,1294;11,1514;9,1515,32;25,8,1516;21,1177;21,509,584;31,1517;12,511,1517;31,1518;25,155,936;14,663,1519;26,1520;13,859,1438,46;21,1521;29,1522;12,1158,1002;12,1158,1002,1467;25,155,1523;21,486;22,1524,146,1361;20,1524,146;25,716,1525;13,1526,1527,154,1528;9,1529,32;12,511,1530;9,1530,163;8,1531;8,1532;12,511,1533,1467;9,1534,92;25,1535,1155;12,1530;9,1536,39,1285,1537;17,1538,1539;9,1540,92;9,1541;16,574,1542;25,1543;9,1544,39;8,1545;8,1546;34,1547;34,1548;34,1549;22,1550;21,1551;21,1552;21,1553;19,1554,389,8,84,1555;9,1556,163;9,1557,163;7,1558;19,1554,389,1559,84,1560;19,1554,389,1561,84,1560;31,1562;16,574,1563;19,1554,82,1564;19,1554,389,1565,84,1555;9,1566,92;9,1567,92;21,4,90;19,107,82,1568,84,1569;13,1554,1570,154;25,155,1551;12,511,1571;9,1115,163;9,1572,389;7,1573;9,1574,32;9,1574,32,1285,1537;9,1575,32;9,1575,32,1285,1537;9,1576,32;9,1576,32,1285,1537;9,1577,32;9,1577,32,1285,1537;35,1578,1,1579;35,1580,1,1579;16,574,1560;9,1581,32;9,1582,82;9,1583,39;34,1584;12,1585,1586,1467;9,1587,32;27,1588,197,6;9,1589,170;29,1590;26,1591;23,678,1592;9,1593,177;9,1202,177;18,1594,1595,8,84,774;14,1596,472;17,1597,1598;9,1599,389;14,511,1600;25,155,1601;9,1602,82;12,455,503;31,193;1,1603,197,6;28,129;23,847,1604;1,729;7,1605;12,1606;26,1607;22,1608;22,1495;25,716,423;2,1609,8,1,1610;25,716,1611;2,1612,8,1,1613;9,1614,92;9,1615,92;12,1202,1616;12,819,1617;2,1618,8,1,1619;2,1620,8,1,1621;22,1622;28,443;9,1623,32;7,1624;7,1625;25,267,1626;21,1627,1628;36,1629,1,1630;22,1631,1632;21,1633;9,1634,32;9,1635,39;25,267,1636,379,1288;9,1637,92;21,8,873;20,1638;21,1639;19,107,82,1640,84,1641;22,1642;21,1643;25,267,761;21,761;25,155,1644;25,8,1645;25,716,1646;9,1647,92;21,1648;9,1649,32;25,716,995;7,1650,1651;37,1652,8,1653;3,275,1654,1,1655;7,1656;7,1657;38,1658,1659;11,1660;12,59,129;12,511,1661;12,628,424;11,1662;8,1663;12,819,1664;9,1665,115;14,59,474;25,1666,1667;17,1668,1669;2,275,8,1,1670;9,1671,32;9,1672,92;22,1673;14,511,1674;11,621,389,986;12,819,1675;21,1644;12,819,1028;9,1676,39;19,134,1677,1678,84,1679;11,1680;25,267,59;25,267,1681,379,1682;9,1683,170;21,1684;9,1685,32;12,439,412;12,508,865;9,1686,32;26,1687;12,107,1688;26,1689;27,1690;1,1691;21,1692;28,1692;9,1693,177;21,806,464;25,155,1694;21,1695;21,901;21,1696,82;12,107,419;12,497,1697;31,443;21,439;25,526,1698;12,690,770;12,455,1699;12,388,576;21,909;21,452;25,716,1700;12,503,1701;9,1702,389;9,1703,32;9,1704,32;12,511,504;9,1705,177;12,455,1706;26,1707;9,1708,32;9,1709,32;21,907;26,1699;26,1710;26,1711;26,1712;12,808,96;9,1713,82;9,1714,32;21,1715;21,1716;12,455,1237;31,865;21,1717;12,455,1718;14,455,1488;9,1719,177;12,562,517;14,1720,1721;14,511,1722;25,155,574;31,1723;12,455,1724;12,628,1725;12,455,1726;9,1727,163;9,1728,163;22,775;29,1729;11,1730;17,1731,1732;21,1733;12,474,423;12,107,1734;12,859,1735;9,1736,612;21,1204,464;26,1737;25,8,1738;9,1739,39;9,1740,163;27,729,197;21,1180;12,110,423;25,155,1051;26,1734;12,455,1741;12,576,1742;9,1743,32;25,8,1744;26,1745;9,1746,75;9,1747,92;9,1748,389;9,1749,75;9,1750,75;9,1751,389;7,1752;9,1753,163;12,59,1754;26,1755;25,716,129;31,714;9,1756,92;9,1757,39;21,1661,873;9,1758,163;28,745;9,942,32;20,1759;29,1760;21,1761;26,1762;29,1763;21,1764;21,1765;21,1766;12,474,1767;9,1768,612;27,1769;29,1770;9,658,82;12,455,1771;14,99,909;21,1772;9,496,163;26,1773;12,474,1774;9,1775,8;26,939;21,1667;21,1776;26,1777;26,1778;26,1030;12,99,1258;25,8,1779;21,823;21,1780,873;21,1781,90;21,1782,464;26,1139;14,96,1783;7,1784;21,1661;25,1535;23,692,1785;21,1786;21,1787,464;25,155,1788;21,1789;23,524,1790,120;9,1791,163;21,1792;26,1793;12,477;1,1794,1795;23,1796,1797;26,1798;21,1799;12,1008,1800;7,1801;25,267,1461;27,1802,464,6;9,1803,8;7,1804;7,1805;37,1806,8,1653;7,1807;9,1808,163;9,1809,92;21,1810;26,1811;27,8,8,1812;1,8,1813,82;28,1661;23,692,1814,120;21,1815,418;25,716,487;12,1816;25,716,43;12,107,1288;25,8,1817;23,524,1818;11,1819,389;26,1820;25,1821;26,1822;26,442;9,1823,32;9,1824,163;9,1825,92;21,1826;12,1827;12,455,1828;29,1591;31,487;25,796,497;21,1829,705;9,1830,92;9,1831,92;29,1646;26,1832;12,1833,1834;26,1835;26,1836;26,1837;12,503,1838;9,1839,39;12,388,1840;12,1841;29,556;21,1842;20,1843;17,1844,1845;17,1846,1847;9,1848,32;9,1849,32;25,8,1423;14,59,803;9,423,82;26,1850;28,1851,464;12,503,1852;29,1853;9,503,170;25,267,1854;12,1855;9,1856,32;9,1857,32;12,439,275;12,690,336;1,1858,1859;9,1860,163;26,1861;26,1862;25,1666;25,8,1863;14,96,8;9,1065,92;12,474,22;28,107,418;14,439,1002;7,1864;12,511,1865;9,1866,8;9,1867,82;25,267,1213;21,22;14,24,1868;12,99,635;22,1869;12,107,803;25,155,887;12,439,1189;21,1870;22,1871;25,716,1872;9,1873,163;12,576,1874;14,971,47;26,624;12,455,1692;18,43,1875,1876;7,1877;22,1878,8,1879;14,835,1880;23,1881,1882;12,511,1735;25,1883,1884;27,1885;25,809,221;25,809,1886;12,497,762;9,1887,92;9,1888,163;12,439,894;38,1889,1890;7,1891,1892;37,1893,8,1894;22,1895;12,503,486;21,1896;14,562,8;26,1897;21,1898;26,840;14,562,1899;26,1900;27,472;14,890,474;25,716,762;21,1901;27,1902;12,497,43;26,895;26,1903;29,1904;9,1905,163;9,1906,389;9,1907,8;20,1908;22,1908;21,8,274;26,1590;12,819,1188;12,721,1909;25,1064,39;12,1910;27,1911;26,1912;25,1913,1914;23,692,1915;1,1916;12,22,1917;12,107,1918;20,1919;12,819,419;27,1920;27,1921;23,1324,1922;12,455,604;25,1064,599;25,267,1923;1,1924,274;12,22,1925;26,1926;23,1075,1927,1928;20,179,146;39,1929,1,1930;2,1931,8,1,1930;7,1932;27,1933;28,1934;27,1935;12,511,1936;9,1211,163;21,1937;27,1938;22,1939;37,1940,8,1653;12,107,1941;22,1942;26,24;27,1769,1943,1944;7,1945;26,1946;12,562,513;12,1947;9,678,163;9,1948,163;12,511,1949;14,99,486;1,1950;21,1951;22,1952;9,1748,1953;9,1954,39;21,963;12,511,440;14,511,1955;12,485,635;9,1956,82;25,796,1957;21,1958;25,267,1287;2,1959,8,1,1960;27,1961;27,1022,197;21,1962;14,835;21,1123;25,155,900;25,1064,1963;26,1964;26,558;27,1965;12,455,419;11,1966;22,1967;23,1968,1969,120;40,179,1970;9,1971,75;9,1972,163;21,1973;28,1974;22,1975;12,107,1976;14,1977,1978;12,819,1979;21,1980,584;9,1981,32;1,472,222;1,806,1982;14,99,8;9,1983,32;14,96,1868;27,1984;14,455,47;26,1985;20,1986;21,1987;9,1921,82;14,99,774;14,59,275;14,96,47;9,1950,170;26,1904;25,1988;26,1989;9,1990,389;12,511,423;12,508,486;14,1991,1992;12,1993;14,1994,412;11,1995;1,1996,1795;14,485,774;1,1842,197;9,1997,163;21,1998,224;14,22,47;23,524,1999;20,452;12,1158;11,452,82;22,1733;12,107,1016;12,107,473;9,2000,163;22,220;21,2001;12,455,22;12,107,599;20,2002;25,155,2003;26,556;7,2004;7,2005;29,1158;25,155,2006;20,2007;12,474,785;12,511,2008;26,2009;14,1052,474;26,23;14,511,877;21,2010;20,1733;12,690,2011;23,692,2012,120;23,2013,2014,120;20,2015;23,1324,801;27,729,8,212;9,2016,115;23,1324,2017;12,455,2018;1,2019,224;25,155,573;12,110,472;26,2020;25,267,2021;9,2022,92;1,2023,197;1,2024,197;9,2025,82;12,2026;12,517;14,22,774;26,2027;12,107,865;22,2028;20,2029;12,59,2030;1,2031,197;9,2032,163;9,2033,92;21,2034;41,179,77,1361;25,716,1643;25,8,2035;12,628,745;25,1064;26,2036;12,2037;12,96,995;12,439,1976;9,2038,32;9,2039,32;25,8,2040;1,2041,222,212;9,2042,92;9,2043,8;25,1175,8,379,2044;28,2045;14,99,472;9,2046,75;9,2047,92;27,2048;31,129;12,508,775;21,2049;1,658;12,2050;12,99,503;7,275;38,2051,2052;1,2053,464,6;22,179,146,147;22,2054;21,2055;25,155,2056;23,2057,2058,120;9,2059,163;27,729;14,474,2060;22,2061;1,443,519;26,2062;29,2063;7,2064;12,455,2065;26,2066;21,2067;14,511,2068;27,2069;9,2070,32;12,193,2071;12,455,803;21,2072;27,1998;9,275,39;9,1009,39;26,2073;12,61,504;12,439,1937;12,511,2074;21,2075;12,503,1002;9,98,612;9,2076,39;22,2077;20,2078;9,2079,389;26,2080;26,2081;29,2082;21,2083;9,939,163;12,859,497;11,2084;25,2085,1957;12,819,2086;9,2087,163;21,2088;9,2089,39;9,2090,92;11,2091;28,275;26,2092;12,455,2093;26,2094;1,2095,197;29,2096;26,2097;28,2098;23,524,8,120;29,2099;25,423;9,2100,92;26,2101;12,107,651;12,511,2102;27,2103;12,517,2104;21,710,2105;1,1352,224;12,503,635;9,2106,92;26,2107;20,2108;25,267,2109;20,1336;26,1243;22,2110;26,2111;26,412;21,692;14,485,2112;26,2113;26,2114;12,1487,775;26,2115;31,775;12,99,2116;12,562,2117;12,388,1039;12,107,936;14,511,1488;26,2118;26,2119;12,455,2120;12,511,451;27,2121;12,2122,696;9,2123,92;12,2124;21,2125;20,1524;12,455,1417;14,511,2126;21,1627;12,2127,129;26,2128;9,2129,92;22,2130;19,2131,82,2132,84,2133;22,419,2134;12,2135;9,2136,32;9,2137,163;1,2138,584;23,692,2139,120;25,716,679;7,2140;12,2141,1115;21,177,737;27,1022;29,863;9,2142,170;12,2143;25,267,2144;9,775,39;12,511,865;21,8,90;21,587;1,4,224;22,2145;19,2146,82,163,84,587;9,2048,82;11,2147;26,2099;29,1755;12,107,2148;9,1202,8;9,2149,92;7,2150;7,2151;2,2150,8,1,2152;37,2153,8,1653;37,2153,8,2154;12,24,2155;25,267,2156;25,155,129;20,1308;20,2157;25,8,99;25,716,2158;9,2159,82;20,2160;26,523;12,43,2161;21,647;28,2162;12,455,2163;12,511,1088;23,692,2164;21,1998;9,2165,82;27,658,197,212;21,2166;21,2167,274;11,2168;23,1324,2169;23,1324,2170;12,2080;9,2171,92;9,2172,82;7,2173;14,840;22,2174;23,2175,2176;23,2175,2177;23,2175,2178;23,2175,2179;25,155,576;25,155,506;25,8,909;28,2180;25,8,2180;25,8,2181;9,2182,39;29,2183;14,455,2184;9,2185,163;22,2186;7,2187;7,2188;21,2189;9,2190,82;12,2191,775;25,8,1144;31,2192;19,110,82,163,84,129;21,806,274;22,2193;9,2194,163;9,886,163;28,1188;9,2195,32;12,906;22,2196;23,1324,2197;9,2198,32;29,2199;21,173;9,2200,115;25,267,2201;9,2202,92;9,2203,163;9,2204,32;1,2205,222;29,2206;25,809,888;26,2207;19,134,82,2208,84,2209;12,511,2210;27,855,8,212;20,2211;21,1782;12,2212;26,1334;25,716,2213;9,2214,2215;23,678,2216,120;23,692,2217,120;22,2218;22,2219;12,439,1144;21,2220;21,267;12,562,96;5,2221,2222,2223;21,2224;9,2225,92;34,2226;21,2227;21,2228;11,2229;14,511,2230;25,8,2231;12,455,2232;28,2233;12,455,971;21,451;21,2234;21,2235;12,439,173;22,2236;9,817,82;9,2237,163;13,859,2238;14,819,1992;14,1687,47;14,1484,803;7,2239;7,2240;12,545;21,2241;7,2242;31,2243;12,1755;21,2244;12,511,2245;38,2246,2247;12,1097,1898;9,2248,32;9,2249,32;21,615;11,2250;27,2251;31,503;9,2252,92;12,43,2253;1,2254,2255,6;21,1188,873;9,2256,32;9,2257,92;22,2258;9,963,163;7,2259;25,2260;22,2261;29,841;25,716,2262;9,2263,115;25,716,179;9,2264,32;31,1155;27,2265;42,2266,82,2267;19,2268,82,2269,84,2270;1,2271,197;27,2272,197;21,2273;12,511,487;9,2274,32;25,155,775;29,2275;29,2276;7,2277;29,2080;12,455,532;21,2278;21,1188,814;26,2279;27,2280,197,6;21,437;14,43,2281;21,2282;9,2283,163;19,511,82,2284,84,2285;12,511,267;9,2009,163;25,716,2286;9,2287,92;14,110,2288;12,503,22;25,267,2289;11,2290;21,2291;23,524,2292,549;11,2293;23,474,2294;21,635;14,59,2295;26,2296;23,524,2297;25,1064,2298;21,2299;9,2300,115;25,716,2301;21,2302;21,1185;21,2303;25,155,1155;14,43,859;22,2304,2305;21,2306;21,2307;9,2308,82;9,2309,92;21,509;12,819,2310;14,2311,2312;26,2313;29,606;9,823,92;29,2314;9,2315,2105;27,472,197,6;12,2316,423;14,2317,2318;25,155,107;28,877;9,861,163;14,971,2319;21,2320;12,508,1161;26,1393;21,2321;26,1282;29,2322;29,2323;23,692,2324;7,2325;26,2326;17,424,2327;9,2328,92;17,2329,2330;13,2331,2332;27,729,464,6;9,2333,39;9,2334,39;9,2335,39;1,2336,197;20,2337;9,2338,389;9,2339,389;21,2340;12,628,455;21,599;14,511,803;23,524,2341;9,2342,82;29,2343;11,2344,389;25,716,2345;9,2346,82;21,2347;21,2348;15,2349;21,2206;9,2350,163;21,2351;9,2352,92;21,2353,2354;9,2355,75;9,2356,75;22,2357;21,854;25,267,2358;21,2359;21,98;9,2360,737;26,2361;26,358;9,2362,2363;21,2364;21,2365;9,2366,163;20,2367;29,729;12,110,129;12,42,472;12,107,2368;29,2369;28,2370;9,2371,163;9,2372,75;43,2373,1058,2374;43,2375,1058,2374;7,2376;2,2376,8,1,2377;22,2378;2,2145,8,1,2379;9,2380,32;9,2381,32;9,2382,32;3,2150,8,1,2152;37,2383,8,2384;21,1842,705;11,8,389;25,267,2385;28,2386;14,497,2387;14,485,455;31,2388;22,2389;25,716,1829;15,452;9,149,177;7,2390;20,2391;5,2392,2393;38,2394,2395;9,2396,2215;9,2397,163;12,439,2398;25,155,2399;9,2400,2401;25,267,2402;7,2403;19,2404,82,39,84,2405;26,2406;9,2407,163;25,630,2408;12,497,2409;12,819,865;14,511,599;1,2410,197;27,2411,197;9,2412,32;23,524,2413,120;25,267,2414;22,2415;9,2416,163;25,155,4;9,2027,163;21,2417;25,155,663;12,511,2418;23,524,2419;29,2420;31,506;29,2109;9,2421,32;9,2422,32;7,2423;2,2423,8,1,2424;12,517,2425;25,1021;9,2426,163;21,1694;9,2427,32;9,892,8;27,443,464,6;12,1381;9,2428,82;1,2429;21,2430;21,2431;21,2432;37,2433,2434,1653;7,2435,2436;26,2437;12,2438;2,2439;7,2439;28,894;12,508,22;9,2440,75;27,2441;22,2442;2,2443,8,1,2444;37,2445,8,2446;7,2447;9,2448,612;12,517,2449;26,2450;12,455,775;12,721,1030;12,2451;21,2452;23,678,2453,120;23,692,2454,120;14,474,2455;9,2456,92;9,2457,170;4,2458,2459,2460;9,2461,82;9,2462,82;9,2463,389;9,2464,8;21,2465;14,59,2466;26,2467;25,155,2219;22,2468,2469;23,692,2470,120;12,511,40;13,22,2471;14,110,2472;20,2473;20,2174,2474;9,2475,39;3,2476,8,1,2477;3,2478,8,1,2479;3,2480,8,1,2481;3,2482,8,1,2483;3,2484,8,1,2485;9,2486,2215;21,770;9,2487,1354;9,2296,32;29,2027;9,2488,163;29,2489;9,2490,82;12,508,2491;22,739,146,147;12,22,129;21,2492;22,2493,146,1361;25,716,2494;12,1363;12,455,2495;1,2363,197,6;20,2496;29,2497;22,2498;9,2499,163;9,2500,32;37,2501,8,1653;21,2502;29,149;12,819,2503;27,1858;21,1423;1,2504,464,6;29,1139;27,8,464,6;1,658,197,6;12,455,2505;25,155,275;20,739,146;28,2506;12,40,1503;9,2507,32;25,267,2508;21,2509;1,2510,1982;22,2511;23,692,2512,120;11,2513;28,2514;22,2515;21,8,2516;21,2517;2,2518,8,1,2519;12,517,2520;9,2521,8;25,267,4,379,2522;20,2523;22,2523;1,762,197;21,752,82;26,2524;12,24,41;9,2525,92;12,455,2430;9,2526,92;20,2527;25,630,971;20,2528;22,2528;20,2529;7,2530;7,2531;21,2532;27,2533;22,2534,146,1361;14,43,2535;9,1397,163;22,2536;9,2537,163;9,1405,92;9,2538,92;9,2539,82;9,2540,92;9,2541,163;22,2542;7,197,2543;22,2544;37,2545,8,2546;9,538,163;9,2547,115;12,455,524;22,2548,2549;9,2550,163;25,267,806;12,455,2551;2,2423,8,1,2552;9,2553,39;9,2554,82;7,2555,414;9,2556,2557;14,439,2558;21,2559;21,2560;26,2561;9,2562,92;9,2563,389;9,2564,32;12,455,1021;44;25,8,1667;14,819,1155;12,859,472;12,24,2565;31,2566;21,2567;26,2568;20,419,146;27,2569,464;1,658,197;21,1177,584;7,2570;9,2571,163;27,1858,197,212;27,658,197;12,455,2572;12,1134,2573;14,22,2574;9,1711,163;21,2575;25,267,2576;26,1830;21,1210;9,2577,115;19,107,82,177,84,2578;25,155,2579;28,2580;21,1699;12,439,1677;9,2581,92;31,504;7,2582;21,2583;14,388,774;9,2584,92;20,2585;9,2586,163;19,107,82,177,84,1144;22,179,2587;12,107,2243,2588;12,819,2589;21,2590;29,2591;9,2592,82;11,2593;25,267,971;21,2594;26,2595;9,2596,389;7,2597;9,2598,92;22,179,8,147;1,1858,464,6;12,439,2599;7,2600;7,2601;7,2602;12,1134,2603;22,2604;21,2605;21,2606;21,2607,705;21,2608;25,716,2609;25,1535,2610;7,2611;7,2612;7,2613;5,2614,8,2615;5,2616,8,2617;5,2618,8,2619;5,2620,8,2619;5,2621,8,2622;5,2623,8,2624;2,2625,8,1,2626;12,511,41;1,1022;2,2627,8,1,2628;9,2629,163;9,2630,82;18,2631,139,2632,84,2633;9,2634,2635;9,2489,163;12,1134,2636;9,2637,163;19,110,82,108,84,2638;25,155,2639;9,2640,2641;21,2642;21,2643;22,2644;2,2645,8,1,2646;21,2286;21,2647;14,107,2648;9,2649,8;34,2650;20,2651;27,2652,8,6;9,2653,39;9,1233,39;2,2654,8,1,2655;22,2656;11,2657;12,1841,2658;12,508,1829;12,1487,2659;21,1829;21,38;9,2660,32;9,2661,82;21,2662;12,340,129;25,267,2663,379,2664;38,2665,2395;9,2666,39;22,2667;29,1397;2,2668,8,1,2669;33,2670,1,2671;4,2672,8,2395;9,1009;2,2673,8,1,2674;25,267,2675;12,107,2676;11,2677;21,511;23,524,2678,549;23,524,2679,549;23,524,2680,549;25,267,959;25,716,2681;12,819,2682;26,2021;7,2683;17,2684,2685;26,2686;12,107,2687;11,2688;9,2689;7,2690;31,2691;7,2692;12,1008,2693;22,2694;28,587;11,2695;1,8,418,6;11,2696;12,59,2697;9,2698,32;17,2699,2700;23,524,2701;25,716,1189;21,2702;9,442,32;28,437;25,267,2703;26,2704;12,562,2705;11,1416,737,986;7,2706;7,2707;9,2708,92;25,267,2709;22,2710;14,511,2711;11,2712;12,1459,2713;28,57;14,511,2714;9,2715,75;14,107,47;9,2716,389;9,2717,389;22,2718;9,2719,75;26,2720;9,2721,163;12,59,107;25,716,532;11,2722;25,267,2723;11,2724;25,155,599;19,663,82,108,84,2725;19,663,82,2726,84,785;25,716,1948;7,2727;25,716,918;12,819,775;25,267,2728;12,819,806;2,2729,8,1,2730;22,2731,2732;2,2733,8,1,2734;22,2735;21,2736;18,43,2737,2738;18,43,2739,92;9,2740,163;12,474,971;9,915,163;24,926,2741;25,267,2742;21,2743;37,2744,8,2745;5,2746,8,2747;9,2748,39;12,2749;21,2750;29,2751;20,2752;26,2753;40,2754,1495;40,2755,2756;40,2757,2758;40,2759,2760;21,2761;20,2762;29,2763;21,2764;14,1459,2765;26,1646;26,2697;22,1327,146;7,2766;7,2767;12,107,487;22,2768;12,819,507;9,2769,32;23,524,2770;38,2771,2395;20,2394;7,2772;26,2773;40,2774,2775;40,2776,2777;40,2778,2779;2,2780,8,1,2781;2,197,2782,1,2783;2,2784,8,1,2785;21,1058,584;9,2786,163;27,2787;1,2788,2789;21,2790;21,2791;12,455,2792;9,2793,92;19,663,82,2794,84,2795;23,2796,2797,120;1,8,8,82;9,2798,75;9,2799,163;9,2800,163;12,2801;9,2802,163;9,2803,163;9,2804,612;2,2805,2806,1,2807;2,2805,2808,1,2807;2,2809,8,1,2807;7,2809;7,2805,2806;7,2805,2808;37,2810,2811,1653;12,96,513;9,2812,32;9,2813,177;9,2814,32;9,2815,75;26,2816;29,2817;21,2818,873;9,2819,32;25,2820,472;9,481,163;29,2821;29,2822;7,2823;37,2824,2825,1653;37,2826,2827,1653;37,2828,8,1653;9,2829,389;9,1139,389;41,2145,2830;29,2831;21,129,584;12,511,2832;3,2833,8,1,10;35,2834,2835;9,2836,75;12,107,423;7,2837;9,1769,82;9,2838,163;9,2839,92;13,2840,2841;12,1161,2842;12,511,872;17,2843,2844;5,2845,2846,2847;5,2848,2849,2847;23,524,2297,120;23,524,2850,120;12,455,2851;17,1946,2852;20,2853,146;9,909,163;25,796,451;22,2854;12,22,423;9,2855,8;12,511,2856;11,621,389;9,731,163;22,2857;9,2858,115;12,819,971;25,716,2859;12,511,1111;9,2860,75;9,2861,163;9,535,39;12,1134,803;14,511,2862;25,267,2863;12,455,2864;21,2865;12,110,2206;21,8,2866;21,2867;28,2867;25,155,2868;25,1535,2869;9,2870,75;9,2871,170;21,1189;25,716,472;31,1941;28,2010;31,2010;9,2872,163;12,57;21,43,2873;9,2874,163;14,1134,2875;25,716,599;22,739,146,1361;1,2053,8,212;12,511,2876;13,1554,2877,154;14,511,2878;31,1643;9,2879,163;43,2880,1998,1051;14,511,474;14,576,2881;7,2882;21,2883;14,2131,2884;11,621,2885;12,2886,1497;12,517,2887;11,2888;22,179,2889;9,2890,92;9,2891,92;12,455,2892;9,2893,163;12,59,487;9,2894,163;25,716,1097;21,1443;21,1829,873;12,1356,451;21,2895;22,2896;12,511,2897;21,506;14,43,2898;22,2899;9,173,170;13,2840,2841,46,2900;41,179,2901;21,2902;21,8,418;27,2903,464,2904;21,2905;25,267,2906;9,2907,82;2,197,2908,1,2909;19,2268,82,2910,84,2911;25,716,2912;25,267,2913;9,2914,32;11,2915;26,2916;26,2917;26,2918;26,2919;26,1842;26,2920;9,2537,39;26,992;26,2921;12,819,2922;23,524,2923,549;21,2924;11,2925,389;9,2926,92;12,508,599;25,716,861;14,562,2927;12,663,971;25,716,195;25,716,2928;21,2928;9,844,32;25,716,1028;9,2929,39;9,2930,115;21,2931;17,1597,2932;24,926,2933;20,2934;9,2935,32;9,2936,32;9,2937,75;9,2938,75;31,179;12,819,995;26,2939;22,2940;21,179;45,2941;25,155,532;12,511,1021;20,2942;25,155,2943;33,2944,1,2945;1,2946,197;21,1419;27,2947,464,6;25,267,2948;12,819,129;7,2949;21,2950;25,2951,761;28,2952;12,96,2953;28,2954;21,2955;29,2956;25,716,2957;22,2958;11,2959;21,2960;12,819,487;9,2961;7,2962;11,2963;11,2964;25,716,2965;31,1021;21,2966;22,2967;20,2967;2,2145,8,1,2968;3,2145,8,1,2968;7,2466,2969;25,716,193;7,2970;22,2971;9,2972,92;9,2973,163;9,2974,92;37,2975,8,2976;3,2977,8,1,2978;35,2979,1,2980;25,267,696;12,823;9,2981,32;9,2982;9,2983;33,2984,1,2985;21,2986;25,716,2987;9,2988,163;25,267,692;12,1356,877;21,2989;28,2990;12,819,2991;25,1666,472;25,943,1842;21,2992;11,2993;21,2994;33,2995,1,2996;12,59,1177;9,2997,163;25,267,2998;21,195;21,2999;12,508,3000;12,819,3000;21,2299,464;11,3001;7,197,3002;31,936;25,155,3003;21,3004;35,3005,1,3006;11,3007;11,3008;31,3009;22,3010;22,3011;11,3012;12,193,487;9,3013,115;22,3014;21,3015;21,3016;19,3017,1677,8,84,3018;8,3019;8,3020;39,3020,1,3021;17,3022,3023;9,3024,32;9,3025,32;9,1123,32;9,3026,32;9,3027,92;28,3028;26,3029;9,3030,8;21,3031,744;25,1064,3032;9,3033,39;9,1530,39;26,2096;25,267,3034;9,3035,75;14,562,3036;33,3037,1,3038;24,1596,3039;1,3040,197,6;9,3041,163;11,3042;9,3043,163;36,3044,1,3045;20,3046,146;25,1535,3047;21,3048;15,113;25,267,3049;12,511,3050;21,8,3051;21,3052;9,3053,163;9,3054,163;22,3055;20,3055;21,3056;25,267,835;28,487;39,3057,1,3058;23,877,3059,120;12,1356,487;34,3060;21,3061;34,3062;31,507;19,2131,82,2132,84,3063;27,1933,197;12,864,3064;20,3065;21,3066;11,3067;25,267,3068;2,3069,8,1,3070;25,716,3071;21,3072;21,3073;9,3074,39;9,3075,92;19,110,82,2132,84,275;9,3076,32;19,107,82,3077,84,3078;3,3079,8,1,29;35,3080,1,29;17,3081,3082;9,3083,39;9,3084,163;28,1177;25,267,3085;26,3086;11,3087;7,3088;7,3089;20,3090;9,3091,163;12,511,3092;26,3093;29,3094;14,476,1053;22,3095;9,3096,39;9,1846,39;9,3097,32;20,3098;26,2141;20,3099;20,3100;9,3101,163;7,3102;25,8,3103;9,3104,163;19,3105,82,83,84,3106;20,3107;9,3108,8;7,3109;9,3110,170;15,3111;9,3112,75;9,3113,75;20,3114;9,3115,75;19,1836,1286,3116,84,3117;20,3118;22,3119;9,3120,163;9,3121,163;14,3122,59;22,3123;23,3124,3125,120;17,3126,3127;9,3128,163;20,3129;20,3130;20,3131;23,524,3132,549;9,3133,163;22,3134;46,3135,1,3136;29,3137;9,2466,92;22,3138;9,3139,75;26,42;26,3140;29,3141;28,3142;14,3143,3144;20,3145;22,3146;22,3147;22,3148;22,3149;20,3150;20,3151;20,3152;9,3153,163;22,3154;22,3155;20,3156;22,3157;22,3158;22,3159;20,3160;22,3161;20,3162;28,22;28,3163;33,3164,1,3165";

const $scriptletArglistRefs$ = /* 13117 */ "379;991,1696;1694;111;1525;26;93;441,584;26,450;2887;436,450,753,1090,1091;1644;1096,2063;1696;1264,2469,2470;26,436,437,438;1697,2136;1644;26,1458;1644;1644;1644;2714;3359,3360;28,362,475,482,1943;400,2667,2668;379,475;1338;526,1698;1644;3151;1017;2057;408,1644,1793;111;498,1091,1157;906;1644;1644;1644;2714;1644;2961,2962,2963,2964,2965;26;26,362,419,423,424,425,426,1696;450,959,960,961,962,963,964;1644;2911;991;362;1694;450,689;644;3166,3167;1696;991;1854;26,362,450,1698;359;106,107;26,2335;1781;111;386;111;386,390,419,793;106,406;450,2693;1909,1910,1911,1912;190,708;1458;26,411;3725;991;347;1644;26;26,411,991,1697,1820,1821;436,450,753,1183,1695;3525;26,475;1781;26,753,1184;26,350,362;599,689;1644;359;936,1255;130,142,538,680,1781;2701;1333;1644;782,1490;26;28,1699;1644;379,386,450,497,753,1366;111;28,29,378;217,218;2430;3436;29;631,2090;631,3643;1525;1697,2136;1814,3481;1697,2136;1700,2811;386,417,418,1694;130;1131,3525;3723;1644;652;475;26,1037;2187;3572;359;1644;1851;106;106;1644;1852;1644;1333;26,3668;1644;26,450,991,1537,1538;26,106,450,1524,1525,1526,1527;588;379,386,450;1697;362,379,626;26,419,1525;797;1644;26;1855;1644;2814;450;1262,1644,2541;1644;26,27,28,29;725;3678;1644;1389;362,442,470;1644;1254;1174;1525;991;2057,2058;1698;2068;26,106,450,1524,1525,1526,1527;1265;2155;1644;394,1655;26,362,750;26,1580,1587;991;1644;2818;26,27,28,29;1041,1644;538;26,438,439,440,804;1644;141;1264;2169,2170;607;568;26,689,2482;26;26,411;3038;362,820;386;111;1458;895;3085;454;827;1096,1343;1787;1221;1698;26,379,450,540,583;1140,1178,1458,2592;443;2588,2589;588;387,991,2686;26;776;1096,1423,1698,2209;26,3080;1595,2676;991;1781;101;1781;3461;1781;356,357;411,412;588,622,1668;367;106,1763,1764,2391;2191,3003;329,1261,1644;707,2395;386;2563,2851,2852,2853,2854,2855;406;123,2000;1644;2070;1781;3135;2349;2360,2490,2557;1368;26,1820;26;373,590,813,814;1439;350;26,436,450,753,1183,1695;450,1181,1182,1696;1488;368;1458;1696;3266;406,2420,2421;456,610;359,1644;130,142,359,538,615;1238;386,495,991,1525;1258,1644;1333;1661;26,1317,1695;1525;26,766,1695;588,1266,2325;1696;1333;1329;1333;552;362,379,496,626,842;1194;1644;111;1764;1458;26,3049;1458;588;29,542,588;588;1797;1141;1141;1141;588;29;26,620,1245;561;413,1099;3161;1096,1737,2209;3166,3167,3498;284,285;451;362,451,475;3115,3116;2521;1644;1525;1644;2785;711,712;26,1458;450;3558;26,450;470,588,1177;848;588,1525,1668,2905;689;1644;1458,1459,1460,1461;3464,3465;1722;3664,3665;1525;1698;991,1120,1121;1644,1781;1644;2018;106;26,827,1697,2094;1764;903,1695;1262,1644,1650;682;2847,2848;26,438,439;1644;123,701,2057,2283,2863,2864,2865,2866;1644;3358;1525;475;26,1603;2516;168,169;133,134,2483;386,451,475,853;111;362,379,626;26;-401,-2668,-2669;26;26,391,475,572,626,707,748,763;3271;3455;1319;1765,1766;26,782;779,1170,1644;29,631,1902;1458;511,1109;542;1292;1644;26;417;26,991,1697,1709;475,1525,1697;1644;1970,1971;475;1781;26,413,1701,1835;991;1525;168;1781;450,1695;1421,1422;1722;26,419,457,458,459;474;2822,2823;1695,1696,1697,1700;1781,2609;1781,2609;3029,3030;26,28,394,599;26;779;1587;26,1696;588;26,50,51,52,53,54,55,991,1525;459;362,379,475,626;1697;26,498,1157;498,1091;1029;110;1882,1883,1884,1885,1886,1887;1100,1101;1695;123,3160;1764;399;1852;1722;1697;439,804;439,804;60,61,1257,1644,1781,2427;2233;381;367,1781;610,1186;359,1765,1766;488;26;26;1644;111;1458;56,57;26,991;2071;1525;1525;224,359;689,1697,1702,2857,2858;1458;588,1680;1697;450,753;588,1590;1458;56,57;26,588;588,620,868;1781;1525;991;475,540,3054,3056;652;1722;441;1096;26,450;1050;355;2870;1120;1274;464,588;1644;26;1343;1644;1644;631;29,130,588,2240,2241,2242,2243;1781;1797;1178;1531,1553,1554;2443,2444;588;26,475,1698;1458;1458;1644;359;63;26;588;359;1644;1694;782;26,588;495;1458;2737;29,588;1607;26;1665;26;26,1722;450,1487,1488,1489,701;2777;829;1697;1722;26,1722,1723;1698;2574;26,450,1096;1155;1764,3692;26,3639,3640,3641,3642;26,475,1695,1697;406,1750;1243;1757;1603,2744,2745,2746;1458;495;3120;1644;3099;26,570;411;26,1525;26,50,51,53,54,55,1525;26;26,991,1820;470;1082,1083;378,386;1243;2960;1781;1132,3525;1319;1458;92;28,991;450;1694;1525,3076;631,1597,1598;26,391,599,689;475;2053;411,945;1696;1644;450,689;991,1706;1694;329,369,1261,1645;3489,3490;835;406;1697;26,1525;362,726;1667;1525,3258;2935;386,2461;362;991;991;1333;353,354,355,1254,1644;1458;1644;106;2109;26,1698;451,1695;355;470,542,1021;1644;1644;3174;3174;1458;1812;26;2928;1778;1732;932;367;856;3329,3330,3331,3332,3333,3334,3335,3336,3337,3338;419;26,413,1099,1718;436;588;426;1849,3691;26,379,545,567,568;430,567;430,567;26,570;332;2101,2102;588,2804;1694;29;3685;588;991;1697,2136;172;2268;26,1695;2534;2268;1781;2268;634;2268;2268;2268;587;26;1458;2268;56,57;56,57;1781;1643;123,1878,3746;663,1781;1644;111;386,450,753;26;397;713,714,715;597;1757;1488,2468;26,570;475;1722;3744;26,2487;386,391,436,450,496;26,1830,1832;2671;1698;2325;106,2391;2283,2863;2714;26;419,1699;1695;56,57;450;1696;780;2666;106;2096;26;2824;332,1402,1403;359;26;1696;386;3677;2676;1487;588;495;391,475,1012,1013,1014,1697,1698;1797;26,570;379,386,450,475,583,853;726;390,1733,1734;2929,2930;661,662,1697;26,1696;977;1644,1781;26,469;378,588;451;26;56,57;1463,1464;1644;1698;362,379,1698;1644;1644;1644;1644;1644;1644;1644;1644;1644;1739;584,631,1604,1607,1608,1609,1610;472;2676;2001;430;584,631,1605,1606,1607;588,1458,1662,1663;588;413;2360;599,689;599,689;599,620,689,2217;599,689;1708;1479;1458;2624;429,1109,1110;26;1525;26,362,390,475,550,551,552,553,1694;495;111,1472,1473;954;3693;972,982,2370;1737,3653;1644;1841;1644;1050;359,1255,1644;800,964,1542,1543,1544;26,413,1701,1835;652;1319;450,753;1781;29,411,511,542,588,2107,3364;1697;1696,1706;740;464;1644;1194;1697,2136;475,933;26;26,450,475,753;1035;1394;1259,3102;2875;1644;26;26;1696;1719;1405;3259;75;1243;767,2572;26,450,753,1603;1077;26,991,2048,2137;1525,1697;369;893;362;1696,1701;26,439;1702;1695;26,1363,1725;2081,2082;1781;26;419,1695;1699,1700;26,413,475,599,991,1525,1695,1719,3001;1722;490,491;675,676,677,678;26;397,675,676,902,1525,1697;2382;2073;26,27,28,29;130,142;350;1907;1907;26;123;26,1187,2390,2396;1093;1658;1695;1525;547,1168;172;475;1919;1647;1778;679;1644;1841,3008,3010,3011,3012;3499,3500;1458;450;1205;26;2343;362,820;2624;26;56,57;939,940;588;588;588;26,689,1525,2482;3599,3600,3601;1215;398,419,610;588;1695;2330;106,820;413,1525,1722;56,57;451,857;1458;140,3145;362,995;450;1525;222,223,2189,2190,2191,2192;1484;111,444,445,446,447,448,449,450;413;26,3163,3530;2199;397,424,495,991;1525;56,57,1525;1699;56,57;991;892,2103;130,884,889,890;609,610;3358;26,470;26,1696;429,461;1458;1363,1364;56,57;689,991;56,57;542;26;26,991,1525,1943,2001;991;1312;26;26,1696;647;3055;406;100;714,3041,3042,3043,3044;450,496,753,1698;26;26,379,450,1695;450,753;782,1490;2582;3548;386,481;1778;3704;359;1781;1525;1696;631,3565;362;2140;568,926,1282,1525;631;29;1922;26,2477;631;26;631;1458;1695;3508;1525;1913;1408;3573;373;1705;397,1011,1696;1697;111,1472,1474;2107;588;355,1333,1458;623;111;939,940;429,581;26,1525;1696;402,404;26,1150,1525;1694;1711;386,450;1644;1926;1458;1458;497,1695;1644;386,976;1306;3021,3022;3747;1644;2731;56,57;738,863;406;3272;1029,1030,1031,1032;332,1731;26,2754;657,951,3315;3277,3278;1781;1698;475;26,29,1525;1370;782,1490;588;1172;582,608;1041,1644;626,1093,1694;450,689;782;1525,1697;1697;3358;1644;684;753,901;450,753;1603,2744,2745;438;26,991;26,411,991;413;1458;893;2997;379;1695;1644;26;1458;56,57;588;26,411,991;26,411,1525;2789;991;26;26,411,1525;1525;1781;1007,1276;26;349;26;1458;588;2390;28,1752,1753;587;1764;1738;386,584,731;111;991;1707;369,1644;26,991,2509,3074,3075;1682;991;991;1525;399;3021;464;581,2475,2476;588;1462,1463,1464;1695;106,3370;359;450,1464,1487,1488,1489,701;399;26,1525,2553,3076;588;2259;452;588;991,1697;26;1090;549;369;588;1525;821,822,1525;26,1596;1696;701;26,991,2509,3074,3075;1525;1695;1722;1458;1696;1699;2070;26,27,689,1697,3015;450;2431;233,234;2165;463,1765,1766;2336;1525,1662;480,588;2029,2030;430,545,568,588;1458;378,386;26;1445,1458,1541;1458;610;511,542,588;511,542,1840;1698;2935;398,400,767,1680,3534;1525;2050,3711,3712;1719,1721;1458;1697;3367;1240;1458;1696,1697;3582;3581,3582,3583;26;429,588;26;1702;1243;1525,3285,3286,3287,3288;450,1432;1458;920,921;56,57;1458;3340;882;1458;106;26,430,588;1525,1698;677;26,689,991,1525;2767,2768;1695;782;26,991,2509,3074,3075;588;1697;1458;1525;578;29,386,1666;56,57;1525;1525;1644;1458;1382;1696;1194;1096;588;26,1697;980;2193;809;26;1525;1458;1266;807;427;1696;2234;451;26,379,545,568,569;26,379,567,569,805;26,379,545,567,568,569,570;2128,2129,3697;26,379,545,567,568;1733;1644;776;1240;292;373;2922,2923;2210,2211,2926;399;26;1695;1644;30,31,32,33,34,35,36,37,38,39,40,41,42,43,44,45,46,47,48,49;588;588;542,588,1458;588,1238,1338;2500;29,542;29,570;588;29,542;3494;29,1732;588;3671;542;475;26,1695;399;1458;1178;26,945,1047,1603,3024;26,1695;597;1697,2136;1697,2136;194,329,1644,1646;26,599,991;588,1668;29,588,1697,2107;991;588,1458;3544;56,57;26;56,57;1459;1644;981;657;350;450;451;464,588;26,475;1458;713,714,715;3376,3377;386;1786;1695;1205;2341;103,104,106,107;1060;26,1525;362,688,689,804;90,3619;1781;1208;362,3052;588;1028;1525,1662;1236;26,28,391,394,599,689;2536,2537;355;1458;26,944,1698;408,1644;1644;570,2301,2302,2303,2304;75;26,542,620,864,1518;450,753;1129;26,1831,1832;362,1696;1696;991,1525,3219;359;776;215,216;1458;588;26;373;379;621;1695;26;26,473;588;1445,1458,1541;2910;1458;2552;1778,1994;1059,1644;1099,3437;599;29,550,3071;1697;1458;1644;588;991;3383;1696;1458;3730;106;1525;2107,2390;1852;26,3530;26;2758;1458;1919;1765,1766;1698;1844;1458;359;495;26,362,1158,1696;1458;1243;398,464,588;26;1458;2270;3636,3637;991;1778;588;1964;1757;617,936,1644;26,1093,1700;1458;1644;1240;26;1778,1781;588;1525;1861,3362,3363;26,1695,1696,1697;1458;29;1462,1463,1464;588;588;26;464,588;459,739,1126,1127,1128;386;26;568;588;26;248;1644;379;1231;26;1458;2276;2730;588;450;1207;800;1644,3648;3467;1699;2934;1481,3473,3477,3478;26,459,739;1661;26,451;542;508;2118;1462,1463,1464;1462,1463,1464;1566,1567,1568;1442;3284;3170,3171;332;3373,3374,3375;26,1484;450,753;1644;1697;1698;1668;2188;2972,2973;991;599,689;599,689;797;355,588,847;122;3457;3016,3017;1696;450,689;588;588;26,3494,3495,3496,3497;1458;1696;1781;1458;2676;26,475,753,1184,1694;631,2384,2662,2663;1084;362,386,436,450,556,753;450,753,1535;386,539;1458;540;1525;649,650;1702;499,1175;779;1703;1525;330,1644;823;406;2721;239,1573,1574;26;26,1525,3386;26,1525;26,413,1701,1835,1836,1837;3735;3650;970;1462,1463,1464;29;1048,1937;1644;1695,1696,1697;362,540;957;542;1433;939,940;1451;450,1637;1695;1243;1356;1140;499,500,2172;1906;26,2856;1333;1758;26,991;29,588,2039;26,111,390,1696;588;362,397;436;1462,1463,1464;56,57;212,213;1462,1463,1464;1689;588;631,3200,3201;1266;988;1644;1338;411,568,588;75;939,940;26;1458;1183;461,1000,1001;1377;588;1644;1702;1698;1798;1347;411,588;1194,1656,1657;1695,1702;2195;387;561,1694;1458;386,536;26,390;26;56,57;1698;2528;925;369,372;26;26,29,1525,3631;26,29,86,1525,3631;1695;26,29,411,1525;26,28,391,394,599,689,766;1662,1722;26,916,917;3323;1722;1525;1644;386,450,753,754,755;26,1525,2517;1549;450;1462,1463,1464;26,830;1458;426,676,1099;450,820;26;1287;-1364,-1365;1241;2827;1462,1463,1464;1462,1463,1464;26;991,1097;1458;1256;1695;26;798,1464,1466,1467,1470;3321,3322;106;399,2133;1458;1458;1661;411,568;3293;2624;464,1209;430;56,57;807;386;588;610,1186;3016,3017;1698;918;26,398;2169,2170;1458;568;588;588;26;26;1695;1785;1445,1458,1541;1698;3324;26,438,439;459;1697;26;782;1695;991;1244;1764;2246;2733,3689;3688;1525;599;1602,1603;528;599;1697;28;26,766,1269;991;245,246,1600;26,1641,1731;502;2354;2012;1695,1697;1698;26;689,1698,2271;26,991;827;1458;1458;540,1697;1752,1753;1458;990;991;1525,1564;1644;951;588;528;26,3530;776,2031;1696;991,1525;398,430,545;588;26;3561;26,1525;459;1525;406;991,1696;1644;26;470,1696,2001;26,3260;1130;714,3041,3042,3043,3044;26,2583,2584;406,450,542,588,991,1525,1940,3039,3040;1311;3598;689;1695;26,411,1525;26;3667;1458;767;29;1458;26,1696;2473;598,1525;362;631,3524;1696;1695;26,542,1525;1525,3285,3286,3287,3288;991;2330;1458;737,738;1525;542;1644;28,390,429,451,464,806;355,2261;406,1414,2454;1696,1697;419,1708;3747;3747;3747;3747;3747;3747;588,1719;1644;2458;1462,1463,1464;1462,1463,1464;939,940;701;542,588;1698;991;391,1014,1697;397;2896,2897;1525;3494;1458;588;1458;1666,3634,3635;451;2207;1696;3105;2524;968;450;588;1458;473;470,1699,2001;1458;26;928,929;26,1363,1725;588;26,59;1243;1499;1178,1458;588;1852;727;2410;26,430,588;29;1458,1752,1753;1458;1781;495;1697;419;2968;1781;459;1458;610,864,951,1032,1186,1687;499;610,864,866,951,1032,1186,1687;451;1781;936;1458;1644;1787;1099,3437;525,526,527,1698;957;588;1752,1753;3358;26,626;77,106,2786,2953,2955,2956,2957,2958,2960;669;1113;2558;951,2277;776;266;1458;2684;406,1750;1644;1319,1458;1458;1205;1697,2319;3554;1695;379;588;1129;2340;588;26;451,729,730,1698;450,1487,1488,1489,701;371;26,991;26;2657,2658,2659,2660;1458;387,807;26;588;1259,1644;526,527,1698;1381;106;2676;-27,-1526;106;1566,1567,1568;651;1781;749;753,1698;542;588;924;359;1697,1722;615;106;1093,1220;2834;1702,2338;1781;1205;1462,1463,1464;1520;1696;450;2859;1037;753;753,1306,1698;450;317;499;587;588;2872;1697;1236;28;26,1363,1725;2558;3061,3062;1426;1696;386,475;464;2492;429;1309;1731;1458;450,1487,1488,1489,701;450,1487,1488,1489,701;1644;397;1695,1696,1697,1698;475;2070;1698;1323;450;1644;161,162,1302;26;495;28,29;588;69,1458,2646;-27,-28,-29,-30;980;1696;1695,1696,1697,1698;526,527,1698;26,1226;1458;1218;1347;2694,2695;26;26,588,980,1697,2506,2507,2509;26,28,588;631;588;991;1539;1695;2971;1525;991;1696;1700;26;1644;1458,1484;1781;1918;1661;3535;991;26,991,2509,3074,3075;1525,1576;1644;588;1698;1644;3426;1243;3679;26;111,450,561;1056;1695;1695;3016,3017;26,1185;1458;588;493,621,674;1096,1698,2063;547,2103;1433,1458;1458;1644;648;668;677;26;26;1627;1696;525,526,527,1698;3358;1096,2218;1737;1030;2467;1458;1458;3393;64,65,66,67,68;1781,1793;681;2079;991;767;2347;1243;1458;1696;631;665;1695;1243;26,541,689,991,1722;-27,-1100,-1526,-3551;1243;541;1243;1243;1243;1699;1458;362,732;3122;926;1644;2676;1644;26,2725,2726;1839;1458;1266;1644;2568;588;1194;893;386,991;453,454;28,1722;991;1695;1781;1458;28,588;373;2942,2943;26,29;26;26;588;3096;1227;847;1525;1698;1696,1697;459;588;1096;556,1439,1440;502;3666;3666;3666;1458;634;26,634,1640;3580;1699;1319;588;1458;1752,1753;677,2687;1661,1695;884;2100;390,1733,1734;29;390,1733,1734;2156;390,1733,1734;390,1733,1734;390,1733,1734;98;631;1458;1458;2403,2404;2685;1845;1694;1890;1778;1458;1458;1778;367;86;1117;1698;29;588;29,1732;599;588;588;588;1752,1753;588;3494;26;29,1732;588;26,28,29,3235,3236,3237;588,1458;3494;2203,2286,2287;588;29;636;599;588,1731;588,1339;588;588;29;511;451;588;588;29,542,725;3216;1756;1458;450;1696;1458;1644;588;1458;1566,1567,1568;542;1644;26;26;1696;2268;26;2268;2268;1205;588;26,588,991,2509;1458;782,1965;1737;1697,2136;1697,2136;1697,2136;387;1769;984;985;362;2268;1697,2136;2268;1564;1644;836;1458;102;588;588;2268;26,59;1446,1447,1448;1458;188,189;1576,3487;111;1695,1696;26;2074;1458;3691;2559;451;1458;2504,2505;450,753,2162,2163;26;1698;1696;2573;1697;1781;1227;1695;362;1697,2557;1484;1458;1569;1243;2640;411;108,183;1644;1901;413,688;936,1644;3482;3547;304,305;29;29,542,991,1697,2107;1695;1405;1243;2144;630;106;631;2676;991;588;26;450,1555;450,753,1245;1698;450,1555;3016,3017;1099,3437;631;1781;3088;26,948;406,526,1120,1668,1678;26;1525;3319,3320;631;411;26,929,1827;2603,2604;652;2826;542;379,497;483;542,957;26,2097;26;508;991,1696;26,991,1458,1525,2113,2646;26,1695;26,497;26;1698;462;379;26;991;26,373,1247;1318;451;1350;411,3531,3608;411,631,1719,3531,3608;1722;2674;2614;950;1778,1798;390,464;3553;355,1458;1856;1697;1695;1063;1698;1178,1240;1208;837,838;1525;1699;26;1298;359;870;1793;3434;875;26,572,626,707,748,763;1271;327,1651,1797;26,1525;1525;855;1458;1695,1696;2459,2460;1644;29;1695;1458;588,1458;26;26,1379;1458,2367;-27;2678;1644;588,1185;1458;1458;2229;827,1696,1940;1700;1745;1594;367,3696;29;882;1458;888;464;1120;26;2135;406,1354,1458,1750;776;26;588;1752,1753;426;379;1644;1698;1695,2915,3025;1319;1308;631;782,1490;1458;2676;1773,1774,1775,1776,1815;484;475;1458;2272;1644;391,475,1012,1013,1014,1697,1698;1644;1488;411,568;1781;1781;1698;588;390,1733,1734;502,581,588,707;1458;-380,-387,-451,-476,-584,-854;1695;542;1644;631;2675;106;367,1644;1721;991;802;1488;29,542,1458;1458,1525;26,50,51,52,53,54,55,991,1525;3188;1458,2908;1333;26,542,588;451;390,657,1209;26,475;588;26,378,507,508;588;568;464;588,868,2185;26,810;3194,3195;1666;398,475,542,588;475,588;476,477;26,379,391,392,3344,3345,3346,3347;26,379,391,392,3344,3345,3346,3347;26,379;26,379,391,392,3344,3345,3346,3347;26,379,391,392,3344,3345,3346,3347;1773,1774,1775,1776,1815;26;26,379,391,392,3344,3345,3346,3347;26,379,391,392,3344,3345,3346,3347;26,379,391,392,3344,3345,3346,3347;26,379,391,392,3344,3345,3346,3347;565,1427;1512;599;26,689,2067;726;1764;1488,1644;2714;1145;1458;1666;1428,1429,1430,1431;753;1394;2245;1778,2658;1288;347,779,1770,1771,3611,3612,3613,3614;511,542,1722,2640;1485;367;542;1050,1458;588;1458;1132,3525;399;26;991;1458;701;3492;401;3211;738;2491;3255;3494;2676;588;377;29;1666;1986;26;1719;991;399;1152;782,1490;1458;599,689;3304,3305,3306,3307,3308,3309,3310;1781,3551,3552;1089;399;1525;1696;1698;1178,1240;378;2566;588;951,1306;1368;542;588;588;588,2789;2167;26,111;26;991,1947;2647;588;877;1773,1774,1775,1776,1815;386,391,450,753,1205,2054,2055;450,623;26,450,753,1018,1096;1458,1525,1625;362,386,436,450,556,753;450,753,1535;386,391,450;2144;430,1839;359;29,1669;2175;450,753,991,1545;769,770;406;3571;1525;1525,1695,1719;1458;378;1488;1458;1284;1644;1644;1644;26;1699;2835,2836;355;2928;1525;1696;26,394;927;406,1750;26,413,991,1835,1836,1837;26,599,689,2216;26,413,1701,1835,1836,1837;1458;1481,1482,1483;2153;1773,1774,1775,1776,1815;1644;1246,1941;3148;29;858;1433;874;26,373,817;1343;2032;451,588;1243;2181;1525;26,898,1700;362,626;1458;588;1695,1696,1697;677,2915;2560;499,1666;2533;631,3199,3201;1458;1107;574;362,397;419;386,398;528;2244;871;3507;749;464,622;657;1841;386;1600;2278;3026;29;397;1240;26,111;1458,2679;2676;367,1781;2251,2252;328,1261,1644;464,545;1696;3443;464;127;175,176,177,178,179;588,621,1696;991;566,655;1525;106;1722;450,701,1487,1577;588;1702;26,1019,1694;26,556,2314;464;1960;29,1487,1525,1712;588;822,1696;564,1697;111,417;26,1695;26,419,2253;991,1525;119;1458;1525;3687;26,991;1702;991;1702;1462,1463,1464;1525;991;1525;450,1441;1525;386,450,753,1695;1625;1062;2857;1702;26,451,497,540,599,652,804;1695;1695;701,820,3587;3179,3180,3181;1096,1243,1367;26,3447,3448,3449;599;1698;26,1694;26,411,1525;26,1525;631,2530;450;1363,1364,1725;413,676,902,1697,1719;1739;902;26;475,3323;26,465;2506;1722;3494;26,411,1525;26;652;1322;1525;386,1696;124;1525;106,2829;1695;1644;1120,2927;701,2283,2863,2864;26,511,542,1722,2640,2641;332,1592;2339;414;3152;26;1696;1719;26,426;3662,3663;1644,1781;1772;26,1525;3539,3540,3541,3542;511;502,588;378,568;111,702;3016,3017;3016,3017;3016,3017;3016,3017;2615;484;3570;939,940;26,541,612,1695;588;588;26,1458;411;451;588;26;588;588;29,451;451;946,2046;588;417;2789;939,940;2698;588;2502;588;386,1697;26;2676;451,1525,1697;386,1697;350,704,705;1458;1698;1696;391,588,1698,2012;464;631;1696;397;1243;1525;1176;588;26,991,2509,3074,3075;26,944,945;1488;98,238;991;1722;654,767,1698;588;475,991;1697;1108;2757;1695;991,1525;475,766;386,991;1243;588,1731;26,827;277;29;991;26;848;1695;877;187,3244,3245;1458;26;26,2509,3074,3075;588;1414;1451;1458;1644;1020,1694;1458;623;26;26,588,636;26,2509,3074,3075;1240;991;1458;600;1697;991;2064;588;1697,1731;123,279;26,3384;788;3518;29,511;1458;386,623;766;1458;495;355;652;1554;631,1582,1607;955;1458;652;1458;355,1333,2676;610,1186;1696;834;621;26;599,689;631;621;939,940;26;29;1900;1698;406;386,406,417,418,1695,2025;588;1525;1525,3285,3286,3287,3288,3290;1697;111,1096;2178;26,59;599,1093;26,476,2624,2712;939,940;422;1992;556,1439,1440;1458;1922;1696;450,753;652;2176;652;572,626;1458;588;1178;464;475;2676;1781;1752,1753;1218;26,28,394,475,599,915;511;1698;1696;26,475,1525;29;632;1178;379,470,784;1644;742,1644,1781;2714;106;1644;1953;1458;969;1240,1458;542;1458;1531,1553,1554;1404;2207,2208;991;26;464;1644;546;421;464;1458;588;588;1694;1696;991;411,568,588;106;26;3358;1178;2219;26;406,665,1096,2357;406,1240,1458;26;542;26;588;1773,1774,1775,1776,1815;652;1698;847,979,1178,1458,1467,1492,1493,1494,1495,1496;827;1458;26;406,1178;588;3682,3683;991;1732;1488;3109;701,991,1709,2290,2291,2292,2293;588;542,3670;26;1702;1255,1644;236,237;3652;652;798,1464,1465,1466,1468,1470,1471;106,406,2552;623;588,2376;1644;1644;1458;1696;413;106;1458;390,508,610,738,1175,2048;239,240,242,314;657;738;26,430,456,499,738,868,898,2048,2910,3610;892,1458;106,1764,2391;26,59;1695,1696,1697;1458;3646,3742,3743;359,1647;796,797;918;1706;3633;1873;106;106;2051;2245;1698;1613,1639;1533,1534,1638;3192;1458;355;1016;3394,3395;386,588;2605;919;29,2784,2785,2786;540,1694;542;526,527,1698;2483;111,362,411,544;111,1474,1497,1498;3014;355;106,2542;991;1243;1243;1525;406,1266;26,450;386,450,753;450,1487,1488,1489,701;26,450,475,544,753;1577;26,1525;26,362,475,691,2482;588,3516;29;3479;1458;1458;3672;1539,1752,1753;1462,1463,1464;379,699;332;111;1090;1759;1424;2729;26;3715;106,450,2280;1467,1500,1501;614;436;106,1458;2600;1099;1458;60,61,1777;1458;3368;1458;651,741;379;441,561;1695;362;1698;2418;450,753;26,991,1820;3092;3655,3656;26,29,588;1722;1525;26,379,450;505;1099;386;1467,2941;997;111,403,405;816;542;1333;1644;1458;355;692;2266,2267;1525;26,588,2509;991;1525,1879;26,532,533,534;1988;386,450;436;638,639;588;26;430,464;1347;588;350;843;26,373,475;2985,2986;1666,1676;350;450;1458;1458;56;2761,2762,2763;2310;588;2497;1525;373,2319;2928;1525;1458;26,59;1825,1826;1458,1996;1695;464;918,1602,1604;1616;1525,3285,3286,3287,3288;1713;26;1704,3302,3303;599;991;1697,2503,2638;631;898;26;957,1715,2131;28,599;991;26;26;26;26,929,1827;1926;75;3454;623;26;347;362;26,1488,3039;1525;1458;106;1525;1488;740,1695;26;362;2632,2633;1458;386,1697;1665;406,1750,1751;939,940;991;26,29;1921,2671;26,636;991;701,1698,1719,2203;827;1458;1525,1576;1817,1818;1754;1644;1644;1074;1797;1644;2019;1343;502,864;588;180;1294;28;1644;2714;26,464,568;436,1695;2890,2891;1644;1781;588;26;464;75;111,1472,1473;102;3621;631,1532,1533,1534;26;1699;1243;1243;991;1243;1206;779;1243;1697;1243;1458;26,27,540,541,542,1697;1243;1243;1458;861,1445,1458,1541;1243;1525;26;588;1697;1458;542;1863;386,774;1458;429,472,588;3149;1458;2414;1243;475,1698;3448;26;106,645,646,647;652;281,282;400,3534;1644;595;1458;634,689;724;373,475;653;1695;588;429,460;1525;429,1109;2517;588;588;588;502;2883;991,1525;1696;1722;1458;1458,1709;2868,2870,2871;1694;588;740;1458;588;1099,3437;542;2447;430,898;106,2391;2643;588;588;588;26;26,2123;588;2790;3666;-27,-635;1243;26;1016;647;26,1697;1243;542;651;2751;1458;1243;1737,3513,3514,3515;1695;26,599;1458,3128;1414;111;26;390,1733,1734;390,1733,1734;390,1733,1734;390,1733,1734;26,379,567,568;429,430,431,432,433,434;390,1733,1734;1519;588,1586;1954;2429,2630,2631;379,411,475,572,626,728;1781;1781;1733;1165;399;1695;386,1697;1017;359;623;1695,1696,1697;588;3358;436;939,940;939,940;939,940;991,2728;588;332,511,588;588;378,398;29,511;511,588,1458;588;543,1666;588;399,588;29,1666;599;29;29;588;588;588;588;29;26;1458;355,2544;1093,1696;2125,2126,2127;102;1722;824;1458;2032;1249;588;1458;1458;1525;1595;568;259,296;1458;588;1697,2136;1458,1993;1696;689;26,406,1695,1699;689,707;26;542,570;1695;773;1644;542;1926;1458;1286;386,387,1701;568;788;2268;1243;678;1120;1458;1797;367,1285;256;2050;355;2381;2482;1484;1275;588;1934;1781;1458;2776;1694;1644;1696;991,1458;1644;450;111,623;1525;386,450,492;387;386,1696;1695;1695;450,753,2069;1458;1644;1096;436,689,1695,2913;1695;26,378;2671;411;1433;1120;26,28,1245,1525,1668,2905;26,1525,1668,1722,2905;26;3073;2212;26,1525;26,1525;1089;1411;2710;29;650;1458;1781;1697,2788;29,1697,2107;588,1695;809;542;511;398,588;106;588;1701;599;1525;1695;1930;631,1525;2401;1644;1282;937;26;1644;1696;2689;3719;496,1696;1525;1050,1458;1243;991,3088;1458;450,753;475,850;631,1576;1695,1696,1697,1698;1458;26;588;86;1695;26;451;26,991,2509,3074,3075;26;1208;1580;991;3535;1525;26;991;26;26,1697;26,475,1697;1698;26,991,2646;991;1697;1699;26,689,991,1525;26;1698;1698;386,1697;1696;26,991,1525;386,1698;1696;26,2308;1696;26;882;2089;1781;2206;1644;941;588;411,3531,3608;359;2194;26,400,2720;26;991;588;26;1030,2323;1458;2070;540;588;941;1099,3437;1695,1696,1697,1698;1698;779;827;2815,2816;26;29;26;29;3297,3298,3745;588,1752,1753;631;599;1644,1783;788,2473,2772,2773,2774,2775;1380;3149;1694;1695,1696,1697,1698;26,3341,3342,3343;1695,1696,1697,1698;2882;1442;389;1458;1458;2183;475;475,588;1333;1698;1066;29,1458;588;1243;26;1732;1349;991;26;991;26;538;1243;406,3527,3528,3529;75,106;26,81,82,83,84,1525,3318;362;111,1700;1458;2760;1396;243,244;2673;1296;26;412;26,570;106,1480;3113;406,1750;1700;1838;3358;3696;106;1458;1458;652;1644;1781;2013;1458;441,450,496,801;1880;359;3620;386,1697;26,391,475,572,626,627,1711;1240;2052;26,991;450,753,1699,1700;588;3185;588;390,1733,1734;390,1733,1734;390,1733,1734;390,1733,1734;1866;588;2350,2351;475,726;1363,1364;1458;390,1733,1734;1733,1734,1735;1697;991;2411;2411;2411,2412;793;1695;1525;1260;1508;782;397,1697,1940;1752,1753;106,1764;1333;26,588,636;588;588;588;588;1002;518,519;386,429,759,760;588;620;588;588;459;2629;588;26,398;588,1666;464,588;588;3425;451,588,859;544,657;588,906;588,782;464,588;588;29,588;588;26,389,568,1139,1140;26,397,1696,1697;26;26;26;1781;26;542,631,1695,3618;288;1644;604,605,606;588;1458;3382;391,401,497,991,1525,1694;588;1636;28;106,2372;470,2269;991;3358;1160;542;1696,1723,2223;29,1722;542;1458;1644;1218;3232,3233;2969;378;26,3530;1661;1661;502,588;450;557;1700;26;1700;588;1368;2201;1458;1644;906;1525;1644;788,2916;1458;1644;450;1695,1698;386,1697;1458;588;386;827;406,1464,1507,1508,1509,1510;29,576,3282;29,576,1525,3282;1644;111;1871;889,1235;1458;1644;574;406;413;1458;1644;672,1458;26,373,2090;26;386;599,689;599,689;2872;106;1458;1047;2390;271;355;588;386,1242;1045;1080;1458;538;2420,2988;26;1698;652;411;411,542;456,2513;451;1680;588;588;451;496,2117;588;991;1444;991;3150;26,413,991,1698,1837;386,450,475,1699;1458;1699;26,966,1695;386,1697;386,1697;701;3723;26,464;2608;387;111;1458;3509;1356;1458;495,767;379;2824,2849,2850;3182;26,3325,3326,3327,3706,3707;26,398;1272;779;1644;2070;1697;441;991;26,379,464,588;2429;991,1695;26,1696;1993;991;362,547;26,379,389,390,391,394,3726;26,393,394;26,413,1099,3437;1319;29,576,3282;1525;386,475;1525;1697;386,853;26,588,991,2107;26,59;26;362,475;542,1525,3444,3445,3446;397,417,660;588;1090;1666;1416;1458;1458;2245;399;1644,1648;588;1054;1843,1985;417;3093;556;1988;1035;3569;2514;1458;1781;1458;1222;1458;111;454,2839;1644;528;966,1449,1450;966,1449,1450;1644;1458;1354;1458;1276;3358;102;1773,1774,1775,1776,1815;2884,2885,2886;494;456;588;588;3690;3690;1798,2966;450,1279,1491;2353;502,535;26;900;106;588,1697;1722;267;26;1458;701,2283,2863,2864;1458;689,2315;588;588;1458;2670;1050;1458;2676;450;1426;665;502;1839;1194;2124;1838;1267,1694;1148,1384;2233;1525;1644;631,3087;1525;2063;1948;385;-27,-28,-29,-30,-1526,2961,2962,2963,2964,2965;1243;26;1695,1696,1697,1698;26;3154;2813;1243;397;1458;1488,3006;450,701,1487,1577;738,2381;26,332,991,1927;991,1534,1696;29;952,1989,2067;1458;2256;28,386;1319;362,379,1112;1695,1696,1697;1243;758;1458;26;26;26,1363,1725;1781;1115,1781;331;106;1698;991;26,411;112;29,542;1699;1699;1696;347,1122,1123;1695;991,1698;3400,3716;26;26,855,1238,2275;411,568,588;29;106;3429,3430;426,631,1099,3239,3240,3241;475;1702;1694;991;1153;991,1525;3292;3358;1750;1899;397,1525,1719;475,651;450;1696;26;1458;332,1319;280;1787;991,1525,1722;475;111;26,540,626;1194;774,1924,1925;1180;1936;26,438;1076;1778;568,2224;1700;588;1099,1525,3437;3736,3737;26,3361;450,1940,2602;1764;1458;1644;1731;631;332;588;1096;436;1931;1698;1798;1644;1525;26;588;2488;1696;26,1458,3299;3311,3312,3313,3438;29;1893;464,588;26;588;588,3063;2791;542,1839;3016,3017;3016,3017;3016,3017;3016,3017;3016,3017;3016,3017;3016,3017;3016,3017;3016,3017;3016,3017;3016,3017;3016,3017;868,951,2831,2910;1694;588,3175,3176,3177,3178;2327;511;588;450,1279;390,419,543,1698;2422;26,3004;588;939,940;939,940;26,1525;1696;3469;1433;1458;26,362,475,1695,1697;1458;2288;689;1697;1458;386;15,-27,-1526;1525;26,2888;1696;2328,2329;1458;26,59;2624,2708;872;123;1797;378,570,1661;1695,1709;654;1722;1458;541,689,1699;26,59;942;26,1525;1458;1451;1458;1695;1698;1722;689,1695;678,943;540,2067;2268;996;1697;1680;362,521,522;1697;1697;1680;26,59;26,59;26,59;1697;1525;26,59;588;827;3239;588;26,1525;26;1644;26,59;3485;419,991;26,59;991;26,424,1696;26,59;1525,1696;26,59;26,59;378;26,59;588;1458;476;1697,1823,1824,1825,1826;1343;413;782,1490;893;-27,-28,-29,-30;1458;26;2070;26,59;26;1644;1790,1791;631,1582,1607;780;689,1099,3437;621;626,707,748,1093,1268,1661,1694;1458;332;3093;390,464,492,588;1525;378,386,430,452;1058;499,2147,2466;1458;1458;652;827;3615;1525;1664;28;1696;1696;1525;1458;991;542;623;1458;359;26,413,1835,1837;1462,1463,1464;588;939,940;2538;2685;2453;2996;413;782;542;2944;1467,1500,1501;406,2367;337;1798;111,1819;450,820;1975;1781;3486;29;1695;450;1458;1878,2003,2004,2005,2006,2007,2008;1458;1757;1773,1774,1775,1776,1815;1458;26,475,3210;1764;1644;1644;2676;1458;29;502,545;355;106,2391;2558;1458;1785;1458;2391;1695;1052;1394;2810;451;652;1243;1695;588;450,753;2714;588;26;2932;362,1846;1415;800,964,1542,1543,1544;26,450,588,1695;406,3366;798;2152;26,59;3388;2642;1797;355;347,1122,1123;588;634,1525,1603,3386;1698;1781,1793;542;2043;1240;3273;546;2072;1525;631;1458;1458;1243;1525;689,1695;1458;827;399;2805;776;26;1458;1781;1243;749;3314;868;863,864;657;456,499,868,3610;1099,3437;827,1347;1275;1487;1120;1458;26,1099,3437;1781,1793;2028;588;2316;870;451;367;3031,3032;3358;-27,-1100,-1526,-3438;399;1781,1793;2992;87,88;1694;1666;528;980;1996;631;588;528;1458;1123;430,464;411,568;1458;1279,1486;436,765;1458,1518,1519;106,1178;106,1764,2391;1935;1579;991;332;991,992;3705;1974,1975;26,450,753,1096,1698;1099,3437;2093;26;111;450,753;1458;29;26;1243;1458;588;1644;991;1343;1287;29,464;3722;386,475,918;574;1244;991;782,1490;918,1611,1612,1613;588;29;464;1458;362;1781;102;588;1797;2912;561,562;511;1458;1644;475,496,626;984;451,464,588;633,634,2001;464;451;2832;588;1458;26,1697,2306;451,588;411,568,588;1696;991;614;106;26,1699;1525;26;2174;972;588;782;587,588,1332;355,2417;2780;651,827,1124,1125,3197;475;3092;1595;1099,3437;26,1569;588;1458;26,411,991;299;1458;3734;450,827,993;1458,2316;991;1698;2936,2937;615;1517;1458;1699;588;1458;749;26,59;2115;631,3399;1888;1132,3525;3685;1458;991;165,166,167;588;26,2473,2474;588;547;588;991;391;123;1458;359,1205;369;369;369;369;450;413;362,386,588,753;2669;1781;450,1487,1488,1489,701;26,59;1531,1553,1554;1458;782;362;-27,-28,-29,-30;135;1240;1781,1793;26;386,464;29;106;1696;2070;1722;599,2720;2535;511;1644;386,657;1458;1601;1696;26,1525;400;26;2429;386,450,753;1518,1642,1843;1695;26,1082,1841,1842;111,2945,2946,2947,2948,2949;1698;26;1698;1697;1458;588;1699;1261,1644;106;1494,1619;2479,3264,3265;1665;1697;1511,2226,2227,2228;123;1458;426;26;3081;991;991;472,991;1445,1458,1541;776;106;399;827,2062;991;26;847,2499;2570;106;1644;464;926;1661;588;631,1470;1695;111;1406;1525;26,59;355;399;701;386,1697;663,1036;363;106,1763,1764,2391;1458,1487,2646;1817,1818;1300,1301;1696;957;776;1538;399;1458;588,1186;588,1840;475,588;1243;588;538;1400;1920;631,3084;588;781;1458;1458;1944,1945;957;2578;1458;106;1525,3285,3286,3287,3288;1243;1697;991;26,373,1698;1243;1243;542;411,568,588;1243;464,1192;464;1243;1120,2950;1458;588;2067;1243;3488;406;547;106;406,2756;26,59;1458;542;1005,1006;1004;502;1458;1458;538;247;1640;991;991;1697;1697,1702;1695;2039;2197;26;2624;2355;29,502,1661,3339;588;430,585;588;2449;2066;588;1696;26,59;570,588,1063;588;1430,1443;1458;2530;106,1205;939,940;588;-27,-635;1784,1792,2402;1722;26,59;2683;1458;3512;398;588;386,450,896,897;1661;1244;1458;596;2319;1099;1286;1394;2262,2998;56,57;429,430,431,432,433,434;430;390,1733,1734;390,1733,1734;390,1733,1734;379;428,429,430,431,432,433,434;588;390,1733,1734;390,1733,1734;390,1733,1734;390,1733,1734;390,1733,1734;390,1733,1734;467,468;390,1733,1734;1696;390,1733,1734;378,419,464;390,1733,1734;390,1733,1734;436;588;1458;2062;396;587;406,1458,2975;543,2619,2620;1651;355;436;2319;3281;991;1778;1458;2901;1142;1458;102;411,2259;588;1666;26,27,28,29;29,542;26;599;29,542;3494;588;588;599;26;588;26;588;29,417,451,542,570,1426,1661;26;464;874;26,59;123;1050,1458;386,991,1696,2748;1891;2676;3501,3502;1765,1766;1171;588;1644;2714;26;3494;588;874;2381;1697,2136;1458,1746;111,631,1319;478,707,957,1940;2268;1697,2136;1458;411,568,588;633;362,1695;1213;991,1697;1458;1458;436;1772;1043;2293;2540;1666;1644;362,379,1694;588;1120;2090;991;475;648,2111,2112,2113;979;1644;587;588;588;588;1458;1458;623,1498;542;347,1122,1123;386,502,1692;451,499,502,2147;1668,3316,3317;1458;701,2283,2863,2864;1781;991;588;1969;450;1343;386,450,1699;1458;1458;373,540;300,301;1111;1644;111,631,1319;26,430,588;3586;3586;1540;2382,3249,3250;991,1525;1993;1525;29,1525,1722;29;26,390,588,1359,1360,1666;687;509,510,511;1661;701;386,1697;1484;588;588,1695;631;511,1722;588;2484;802;1055,1699;26,29;2255;29,1697,2107;1695;26,398;495,951;1564;1696;542,1697;1458,1755;588;1400;588,1319;451;1467,1500,1501,1502,1503,1504,1505;367;1695;1018;359;2446;350;464;475;1518;355;1719,1747;466;991;26,847,1833;588;106,130,1628;2766;1458;588;654,690,1695;386,1695;2676;804;564,991;1458;359;1319;399;588;379;1458;542;588;1719;146,147,3431,3713;123,1319,1666;1778;1458;475,587;26,59;26,59;991,1722;411;542;1381;111;26,1697;1644;362;1696;1458;615;1518,2198;588;588;1458;1445,1458,1541;987;1696;1333;475;631,3261;29;1696;991;1525;26;26;1525;588;1722;1525,1722;1695;28;475,599,1696;1714;26,991;332,1698;411,568,588;106,1764,2391;411,568;623,726,795;1696;588;823;406;464,588;1458;1243;2863;1525;1047;1458;26;1434;411,588;623;3701,3702;411;1240;1451;26,1722;231,232;26;1781,1793;1848;476;2346;3125,3126,3127;441,1024;1525,1696;1099;411;1458;1644;1797;561;2664;1243;1716;1243;26,451;587;1458;1458;475;475,588;991;991;991;862;26,1525;588;599;406;588;588;29;2107,2579;1243;1781,1793;1243;1644;2833;716;26,59;1698;411;26,59;1343;1739;2285;3731;386,450,901;576;411,568,588;827,2233,3197;439,588,804,2500;1458;1644;1732;588;1049;1695,1696,1697;1781;1924,2983,2984;931,1202;588;355;26;1039;1458;870;1695;1665;706;3738;26,398;3358;1751;2714;1231;406,1750,2785;626;26;3358;26;1458;1781;419;386,1073;542;542;1525;1093;470,627,1325,1326,1327;625,1711;359,1105;1929;588;1079;2727;2455,2456;386,419,430,1666;390,1733,1734;390,1733,1734;2594;1644;939,940;1666;542;373;1394;1243;390,1733,1734;390,1733,1734;1458;390,1733,1734;390,1733,1734;390,1733,1734;1644;111;2561,2562,2563,2564;3018,3019;386,1697;2857;1695;2676;1644;1140,1178,2592;386,1073;1458;1458;1698;568;1089;114;2714;3078;1458;464,588;588;588;588;1458;1218;386,1073;26,636;1666;939,940;378,386,588;1658;546,548;386,464;1120,2785;386;588,3556,3557;459;588;464,657;749;386,502,1692,2197;588;386,502,1692,2197;429;2310;588;1306;588;26,398;588;464;588;991;406,450,1018,1458,1484;75;3348,3349,3350,3351;1458;1778;1458;3638;1229;359;1644;1143;588;2512;1347;3118;386;379,1695;26;1695,1696;2714;1699;1956;1397;332;56,57;2443;3164;1458;631;1458;2390;588;1458;475;1151;1793;1458;1397,2699,2700,2796;1458;1644;373,386,588;850,3470,3471,3472,3473,3474,3475,3476;542;26,1525;782;1700;2906;450;3099;1458;804;399;378;1178;1243;1394;1696;991;938;1798;1090;1644;1781;1096;1644;827;588;489;2863;588;1525;3131;2380;1178,1458;782,2734,2735,2736;1981,1982;1458,1595;26;883;881;26,59;3358;3209;1133;588;1305;475;1194;123,3403,3404,3405,3406,3407,3408,3409;2994;1698;588;2322;588;1218;26,588;588;1243;2401;1458;26;547;542;1781;451;450,1375;800,964,1542,1543,1544;1458;398,430,545;1462,1463,1464;386,1697;386,1697;588;615;1458;26,392;464,1218;2107;3234;3741;1243;827,1354,2616,2677;957;26;1781,1793;26,475,1694;2316,2542,2977,2978,2979,2980;499,2147;495,767;26,1696;547;1458;2931;1644;1458;1458;1781;26;451;685;106,406,2646,2647,3370;106,130,355,406,1005,2644,2645,3370;1697,2319;2312;1697,3654;615;26,929,1827;3358;347,1122,1123;1458;26,395;29,1722;1694;1696;362,413,1095,1096,1097,1098,1525;26;26,413,991,1525,1701,1835,1836,1837;575,576,599;1525;1781;1666;1407;398,545,1661;386,1697;406,1539,1752,2337,2369;475;2405,2406,2407,2408;26;355;123;599;1390,1391;824;991,1525;1205;359;1458;1178;542,588,689;3684;1467,1624,2625;1698;1696;1695;797;1005,1006,1007;1347;26,413,1525,1701,1835,1837;1695,1696,1697;1458;1438;1458;1932;1239;800,964,1542,1543,1544;1458;1644;1458;1248;1050,1458;26;2676;588;939,940;464;386,464;702;1129;1853;26;406;966,1449,1450;631,3184;966,1449,1450;542;1458;1458;574;542;1458;26,1525;26,553,1044;106,1763,1764,2391;1027;1697,2136;1695;450,753,1535;102,195,196;26;1458;399;2268;1764;1381;967;808;2340;3616,3617;2808;588;206,207;939,940;991;212,213,214;1838;1120;26,373,419,475;1458;1697,2136;106,2391;362,397,1248;588;588;3699,3700;1745;355;386,398;588;588;429,831;2624;568;621;386,411;26,929,1827;508;475;1963;26,379,495,1697,1709;2676;1739;1644;991;85,86;3680;386;56,57;1357;26,58,59;26,59;399;413;3091;588,2144;1458;588;776;106;26,991,1525;29;937;1696;1696;450,1437;991,1525;1694;26,59;359,1765,1766,1767;588;1458;1644;1243;1458;3252;26,59;1243;1458;419,1696;26,59;1381;1458;1696,2154;599;2310;588;3262,3263;26,3447,3448,3449;1698;1722;1722;2509;991;451,502;1458;588;1458;1458;556,1439,1440;28;413,676,991,1525;26,59;2284;1781;1696;386,456,560;2676;991;411,568;868,951;397;1525;1313;588;573;26;851;1445,1458,1541;3402;904;1381;1644;1644,1778,1781,1796,3060;106;576;776;1644;26;632;106;464,588,732;788,957,2636,2637;1737;3676;1661,3230;588;588,1661;588;588;3016,3017;3016,3017;3016,3017;3016,3017;3016,3017;3016,3017;3016,3017;3016,3017;3016,3017;3016,3017;3016,3017;3016,3017;3016,3017;3016,3017;3016,3017;3016,3017;2720;508,588;398;26,588;26,3004;1218;475;451;411,568,588;26,430,588;26,398,610;26,398;26,59;1396;588;379;2389;1458;1680;459;378,502;1697;2490;508;1458;1458;26,59;1595;430;2887;378,1680,1690;26;362,386;1082;720,721;1698;991;1698;475,497,1146,1694;542;222,223,2189,2190,2191;991;2436,2437;2437,2450;3239;1698;1696;1698;689,2120;1695;451,1696;991;1564;1697;1697;991;570,2011,2012,2305;991;749;1768;542;1458;634,1587;406;588;111,893;1458;1695;1458;631;26,991;588;26;991;1099,3437;26,111,436,1120;26;26,991;130,1628;26;1564;1458;2714;1644;1644;1243;749;26,991,1835,1837;406,1750;26,413,1525,1835,1837;1319;1458;3077;1523;1458;1458;743;362;939,940;1680;1240;2020;2285;652;2489;502,545,1201;991;399,588;406;26;406;800;631,1525;386,1697;1525,3285,3286,3287,3288;588;1722;29;1695;1525,3285,3286,3287,3288;1525,3285,3286,3287,3288;26;3290;1525;26,27,28,29;1458;588;1458;1525;1654;3153;3747;29;2237,2543;542;1644;1120;355;1539;26,1695;106,111;464;1778;2414;1984;1458;399;1169,2447;3456;991;430;398,588;29,130,588,701,2240,2241,2242,2243;3439;749;1458;1644;415;971;1458;1395;665;1862;367;1644;1781;2989;2617,2618;1644;2493;1765,1766;1531,1553,1554;1695;1458;430;451;451;2083;588;1458;464,588;26;488;2087;1458;359;1644;1164;3411,3412,3413;1781;1458;991;106,450,827,2702;1458;1458;1458;355;588;1090;991;893;1458;464,657,1687;1120;991;1695;430;588,1178;399;588,1458;2626;2624;1953;3130;1354;2015,2016;1673;1673;1458;1719;991,1719;588;399;588;1320;1661,1979;1441;865,866;863,864;26,430,738,898,2048;863,865;1600;1897,1898;991;1099,3437;1644;1296;1240,1458;1778;1696;29,588;96,97;2813;347;975;1458;3732;2289;1458;1748,3212;2180;1178;565;565,782;565,1096,1488;1458;1458;1458;106,957;1781,1788;1696;2157,2158;1525;1795;991;3206;106;1178,1556;3089;3559,3560;1458;102;26,689,978,1709;3494;386;631;1319;508,591,592,593,594;378,464,1680;2373;2462;1458;648;1458;1458;362,550,1710;386,450,753,980,1210;1676;991;2401;2676;350;406;1112;412;1697;1218;2769;355,1333;1458;1695,2220;386,1697;588;659;1218;1458;588,3517;3519;2624;1120;788,1464,1466,1469,1470,1561;943,1458;3132,3133;582;556,1439,1440;450,1487,1488,1489,701;406,1464,1507,1508,1509,1510;1752,1753;26,1525;397,991,1097,2557;797;1781;1319;362;3103;1596;1243;1347;29,542;1697;588;1644;588;126;1773,1774,1775,1776,1815;359;29,588,2433,2434;1458;776;29;588;464,1666;1062;1781;26;1458;635,738;1458;1699;419,766;3536;495;1099;106;827,2424,2425,2426;26,559;1289;2710;26,411,1525,1820;2045;1525;1705;588;1531,1553,1554;1458;26,991;26,1348,1349;3097;1458;26,827,1319,1525;1458;1005,1006;542;1525,1576;28,776,1525;406,1750;1248;1458;26,853;765;1099,3437;1644;1781,1793;26;391;386,1697;406,1283;1458;1781;998;1525;1697;26;991;26;631,1838;599;1458;1243;1575;450,689;749;1458;1458;2442;465;1644;588;1458;1683;430;1458;1464,1557;369,372;450,1487,1488,1489,701;1236;1644;1459;475,620;1644;1252,1253;631,1458;26;436;1132,3525;1458;1697;26,599;588;411;26,379,561,1618;2676;547;26,2508,2509,3074,3075;1702;1798;1697;26;588;1525;1458;1458;406,2131,2423;2364,2365;436;1458;1218;413,1488;1120;26;991;1896;1458;1458;1350;1394;239,242;1781;2661;2714;1458;2420,2421;2918,2919;1666;1458;1458;386,1697;3520;1381,2264;417,588,1096;499,2147,2466;588;588,3187;2326;464;588;430;413,1099;106,1661;991;1525;1099;939,940;939,940;1570,1571,1572;542;26;26,389,429,1187,1188;1644;436;1644;2064;1525,2064;1223,1224;584,827,1240,2090,2741,2742,2743;358,1148;756;2704;1817,1818;1817,1818;386,1697;1445,1541,1624;823;991;926;588;464,588;26;1458;958;1644;1204;547;1096;26,464;106,1750;542;1644;588;1458;828;503;893;106;1588;1243;26,475,543;1696;1696;1243;26;367,1781;1343;1722;1458;1243;475;373,379,411,470,694,695,1661;648;588;588;202;623;2149;1238,1781;1072;1243;645,646,647;1243;464;3215;450;1030;991,1697;1644;588;1697,2360;1695;1699;1702;588;359;1218;386;1458;2624;588;3590;26,2688;3048;29,2821;939,940;511,542;588;1685;1458;379,1697;3253;1644;991,1825,1826;1826;406,1316;1696;1458;1458;386,1697;411,511,1418;991;26;1458;588;1697;588;588;26,1528,1529;588;621;106,1763,1764,2391;749;588;749;642;744;991,1722;1091,1825,1826;2026;603;1367;208,209,210;399;778;738;991;749;733,734,735,1719;3328;1698;1458;1644;1394;26,1228;1228;390,1733,1734;390,1733,1734;568;390,1733,1734;390,1733,1734;390,1733,1734;390,1733,1734;428,429,430,431,432,433,434;390,1733,1734;3564;939,940;1458;2814;367,1781;1459;26,1698;406,2982;686;2539;991,1525;1148,1414;782,783;294;1585,2610;86,3595,3596,3597;2447;387,827;1458;1458;991,1458;623;652;1096;450,753;939,940;588;631;26,1363,1725;915;599;588;588,2139;588,1731;588;28;599;1666;1096;2887;628;430;430;1430;355;502;1458;1050,1458;1993;1446,1447,1448;1787;1696;470;1817,1818;430;556,1439,1440;1738;347;2676;3533;1458;2099;1458;1458;1319;1458;111;634;26,553;1120,2359;1756;1781,1793;1458;451,542;967;652;1458;26;464;588;1458;2268;1244;1458;804;1458;1458;952,1180;1243;1695;1458;542;1458;1458;2134;1218;1458;776;970;1458;3157;2345;1394;1394;542;1644;419,429;1290;588;3677;1708;1525;1697;991;450;450;1458;870,913;3414;2047;1068;1363,1364,1724,1725;1319;106,1564;2299;631;934;1525;26,430;391;2913;1569;1781;450;623;951;26;1208;1243;1243;1411;3104;1458;1696;951,2471;588;464;464;2825;1189;15,321,322,323,324,325,326;1934;1392;379;1178;1698;1096;430,545;26;588;106,1764,2391;588;588;1644;398,588,2160;2549;1752,1753;588;26,656;590,1160;542;1238;542;3566;386,1697;26,464,478,479;1458;1458;542,631;542;1467,1469;1860;3628,3660;1458,1750;1644;106;1458;1644;3247;26,1834;26;26;1018;374,375,376;701;3720;870;1116;690;1216;106;626;776;1645;1644;1531,1553,1554;2917;1644;1644;406;26,106;399,1695;1525,3285,3286,3287,3288;1005,1006,1007;1458,1525;991;991;2084;26,379,1187,2320,2321;1943;26,2487;26,2487;111,26;26;26;26;2993;426,991;2386;387;1696;1053;588;939,940;1375;1244;804;1394;1026;123;430;588;1644;1458;1696;1458;1644,1797;1644;1644;1569;1696;367;386;790,1644;631,1674,3274,3275;130,384,1644;1458;1695,2164,2525;1696;386,1697;991,1696;939,940;1695;991,1696;2309;373;391,413,991;588;1458;782;631;991;386,1697;1644;587;1781;1695,1696,1697;991;1120;1781;1458;1781;1426;1116;556,1439,1440;26,29,1525;2933;1458;588;1698;464;1399;464;2238;29;807;270;2401;827,1695;3511;1727,1728,1729,1730;2676;1781;355,1333;2960;991;2064;151;1644;184;2463;1467;332;2010;1120;631,3531;2909;397,991,1719;1458;3577;26,511,542,1722,2640;2640;1458;1738;29,511,542,1458;26,413,991,1709,1835,1837;1458;1697;782;1644;779;1993;1781;1695;29;1696;1525;588;1218;459;464;1243;29;1458;1458;1243;1050,1458;542;117,118;1525;1951;751;766,1939;1334,1335;1778;3402;1694;1644;26;1695;1458;588;1781;1781;1243;1243;782;1394;373,917;2001;26,917;1696;29,511,542;542,827,1670,2654,2655;1458;1458;1394;99;3629;542;386,1697;26;1758;1644;2260;2565;451;626,764;28;626;1695;1700;26,391;1700;1695;3708;451;1350;652;379;390,1733,1734;429;3575;1564;26,898,1700;362,379,726,802,803;390,1733,1734;390,1733,1734;390,1733,1734;390,1733,1734;355;1889;2869;2257;26;26;1136,1137;436;106,2391;1458;1934;891;1697;29;588;588,644;1661;1666;588;588;386;430;502,588;386,502,1692;1661;588;588;588;386,502,1692;1218;508;386;464;2197;386,502,1692;749;429,1685,1686;451,502,558;411,568,588;749;464;26,373;26,373;1218;29,631;430;411,568,588;1458;650;588;26,406,757;1778;1698;1525;1525;1644;1838;2627;727;528;1458;378;1458;1104;2900;999;451,588;26;930;70,71,72,73,74;588;1462,1463,1464;1096;1978;464;1458;1458;3356,3357;1698;378;349,2863;1644;511;939,940;1525,2148,3279;1700;1993;3415;691;26,1287,2509,3074,3075;652;1781,1793;378;1458;2887;26,571,572,1698;1458;2491;774;475;1458;26,678,991;1091,1825,1826;588;1781,1793;1458;111;2969;451,2374;26,464;29,1525,3282,3442;588;2568,3156;827;123;2951;588;157;386,1697;450,1514;588;588;464;29;26;588;1700;464;3094;464;599;111;394,398,545;239,240,241,242;436;1077;1695;1458;542;450;406,1750;1695;1698;1458,2383,2384;3166,3167;2880;1458;450;2213,2214,2215;406;588;26;386,1697;1458;1702;406;3491;106;542;1458;782;1458;475;1697;1240;1781;255;26;26;588;700;3591;2401;1225;3098;1697;451;451;1333;631;397;413;1778;782,1490;347,1122,1123;26,1697;2070;1698;1458;2878;362;1458;1458;588;26,395;588;623;426,1525,3416,3417;991;701,800,1525;991;1903,1904;29;411,568,588;26,419,1696;1525;426;26,28,972,991,2740;1333;430;149;397;362,694,747,748;799;1458;991;939,940;475;1698;406,757,794;588;2611,2612;827;1458;1458;464;588;1309;3296;29,542;1963;1696;1697;1458;26,413,991,1835,1837;1458;574,681,1050,1530,1531;1097;1458;1249;106;359;1698;106,406;1244;1458;588;1458;2860;2530;911;2732;3217;1394;1988;1857;1243;26;1405,1781;667,668,1696,1697;1340;1781;1773,1774,1775,1776,1815;332;106,2391;106,2391;1599;359;1798;2545;450;588;1781;1644;249;797;1525;26;1362;378,588,1114;1433;588;3136,3137,3138,3139,3140,3141,3142,3143,3144;631,3198,3201;419;1644;411,766,767;86,964,1629,1630,1631,1632,1633,1634,1635;631;574;749;1120;1365;26,929,1827;681,1531,1553,1554;3422;542;1659;1781;1414;1243;1243;827;1781;1458;749;26;1047,2906;973;1696;1722;1458;1672;621;1414;991;588;1525;1194;26;2352;1458;1394;1243;1243;588;387;3016,3017;1644;1644;1487,1712;450,701,1487,1577;26;1696;588;1243;1243;1354;29,1458;2239;588;2258;631,1245;430;26,991,1363,1725;203;991;1525,1722;1697;1706;650;1243;939,940;26,430;29;1099,3437;587;106;718;588;1458;1458;1700;970;2719;1458;1458;355;355;588,1696;386,1697;2177;499,868,951,2910;631,1660;991;26,362,413,497,498,1525,1666,1722;386,1697;2755;1525;1798;26;731;26;588;1938;2974;464;1231;1458;2103;2606;1243;1644;1695;1719;1781;3007,3009;419,827,1696;26;1099;287,1764;1458;332;1644;1243;3352,3353,3354,3355;2648;658;1811;29,1661;588;588,1096;3016,3017;3016,3017;3016,3017;3016,3017;3016,3017;3016,3017;3016,3017;613;939,940;991;26,362,379,726;991;588;820,1187;417;386,412,976,1178,1179;26;588;29;939,940;26,398;939,940;378;1525,2587;1644;26;1237;1458;1363,1364;991;26;26,1698;1166;939,940;1458;378,502,588,1680;26,588;1698;1696;26;1458;991;387;771,772;3294;1598;430;1525;1697;2436,2437;2437,2450;631,2332;1695;1722;1697;26;1696;689;678,991,1706;1458;26;451,1680;26,991,2293,2297,2298;1243;1698;1353;1698;1458;1458;2300;1695;464;634;464;464;1296;1458;26,450,753;1525;749;749;827;588;1099,3437;953;1680;1458;588;1695;1696;827;1781;411;2231,2232;1287;429,620,2624;782;588;547,588,951;1666;475,726;1394;1231;3682,3683;907;1458;1926,1991;1525,3285,3286,3287,3288;106;1698;419;332,1737,3387;1697;1694;3367;411;1458;631,1532,1533,1534;1695,1696,1697;893;2233;588;2429;1752,1753;596;399;1458;406,1464,1507,1508,1509,1510;706;451;939,940;1696;106,406,2361,2362;1458;588;1781;1243;2714;1222;86;587;1458;1781,1793;827,1050,1458,1513;106;1695;925;588;1458;1458;378,544,588;1458;1458;939,940;588;75,3121;398;1458;350;663;406,1464,1507,1508,1509,1510;1458;1644;406,2368;387;1140,1405,1458,1460,1467,2569;782,1490;1458;588,2122;588;1737;1681;1222;1644;588;588;362;430;1032,1687,3385;478,1062;1458;1458;1099,3437;2624;939,940;1458;1458;2385;798,1464,1466,1470;106,406,2552;3358;1781;1781;588;398,430;2401;131;958;1781;738;847;452;429;106,107;355;1050;1394;635;588,951;2764,2765;1394;1458;1458;1458;1458;1716;28,565,1458,3005;1394;2954;391,588,627,2159;3206;26,475;1458,2316;1698;788,2713;26,986;1697;470;-27,-28,-29,-30,-1526,-1839;26,979,1709;378;1458;1458;1765,1766;3378,3379;588;495;3358;782;1644;26;822,2519;3095;1102;26;689;3214;678,1099,3437;3173;735;1458;1525;1099,3437;386,2393,2394;2747;1695;1369;1458;2758;1096;1458;111;26,868,869;2535;588;1535;797;709;1079;3110;2401;26;597,2634,2635;3149;797;2586;2586;1525;1525;1653;419,1086;1920;561;3728;599;652;1644;406;991;588;2680,2681;1458;1781,1793;681,3421;1201;779;749;749;399;2401;740,1695;1458;26,574;399;1752,1753;952;1695;1458;1781;399;1243;1644;1698;2034;1467;3525;827;386;391;495;1781;848;2148;678,991,1709,2148;964,1631,2797,2798,2799,2800,2801,2802,2803;26,929,1827;1243;1458;26,1528,1529;779;588;3686;2062;542;476;359;3155;776;391;391,678;1458;1178;399;2921;939,940;26,2482;1314,1315,1695;588;991;1458;111;1696;1697;347,1122,1123;2017;827;411,568,588;991;3536;588;1248;1243;464,588;1644;1458;1458;26;3280;1118;1565;631;1695;588,1697;26;1050,1458,1511;1018,1752,1753,1754;2106;1644;588,2122;588;1458;1167;1446,1447,1448;1458;413,991,1525;26,450,588,776,1279;26,991,2509,3074,3075;1458;1458;1445,1541,1624;1644;430;668,991,1096;727;588;749;1120;827,3197;1458,2876;1666;2092;386,1697;2457;1458;777;2924;2872;464;26,59;26,59;56,57;26,59;26,59;26,59;26,59;26,59;26,59;26,59;588;478,939,940;635,2831;652;332;1458;464,1684;1817,1818;1817,1818;1817,1818;1817,1818;1817,1818;812;812;779;631;502,588;588,681,2975,3453;588;779;2186;475,1304,1525;76,3256,3257;1394;1458;106,1491,2523;2676;26,413,1697,1835,1837;3657,3658,3659;827;1458;406,1464,1507,1508,1509,1510;2682;1099,3437;1243;631,1576;1243;1243;766;1699;1798;3463;26,689;1240;2268;1243;1243;386,1697;1243;451;1243;451;1243;782;464;379,411,694;470;2952;385;873;1566,1567,1568;1458;430;1644;1430,1443;1695;1458;782;542;2676;464;1458;1644;846;1458;1695;1697;2607;26;749;884;1433;588;588;2821;542,588;588;588;588;588;502;430,588,1839,2116;588;588;502,588,2472;347,1122,1123;436,1426;1696;1525,1697,3285,3286,3287,3288;588,1694,1697,1706;26,2419;749;588;991;875;1459;2924;2196;588;3301;1458;417;1458;634,1589;1695;406,1414,1595,2486;406;111;399;588;923,1228;390,1733,1734;390,1733,1734;390,1733,1734;390,1733,1734;106;564,565;1591;1778,1782;26;1458;1458;748;3525;2311;779;1218;631,2623;26,1525;542;2262;665,991,1458,1662;1458;1243;1249;2001;1458;1458;588;387;499,736,1029,2039,2040;26,929,1827;1240;588;26;588;542;502,588;588;26,2806,2807;1695,1696,1697;732,946,976;475;413,1525;406,542,991,1491,1525,1554,3035,3036,3037,3038;470;1414;588;464;26;511;464;542;1099;26;568;399;430;1458;1458;991,3100;1697,2136;450,1343,1467;1644;387;542;1414,2131;1458;776;26;29;1330;1305;1458,1676;1781;1458;652;1132,3525;528;106;1394;26,27,28,29;1120;1781;588;106;1458;451;347,1122,1123;588;1644;419,429;419,429;419,429;419,429;419,429;419,429;1296;102;1250;26,373,387,419,497,815;399;1434;111;648,1178;430;302,303;631;1695;2053;26,1245,1668,1722,2905;2397;1644;1644;848,1154;429;2391;1458;75,1801,1802,1803,1804,1805,1806,1807,1808,1809,1810,3033,3034;1644;1738;1695;542;1696;542;542;991;26,542;1697;631;1719,1720;588;1409;541;1644;1458;26;1050,1464,1624;1119;413;654;386,1697;654;1644;362,1661;1644;1644;1458;1394;2233;386,502,1692,2197;2706;106,1933;1458;2703;347,1122,1123;654;588;1458;1699;827;1394;827,1050,1458,1513;1488;347;411;939,940;2676;1722;351,352;1695,1696,1697,1698;1787;2617,2618;1778,1781;3494;386,1697;26,1525;26,106,985,2829;991;1641;1723;631,1525,2022;568,766;994;349;1458;1781,1793;1458;362;588;1797;1458;2870;106;588,1186,2263;430;2104;430,2145;450;1458;1695;542;2687;1333;1243;27,1091,1697,1822;1694;1627;1458;2770;2075;990;1644;1458;2522;588;1458;3254;1781,1793;1148;1458;1458;26;400,529;1243;1458;26;26;3535;1394;1458;26,542,1881;136;475;1333;398,545;1227;710;355;931,1414;406,1750;464;797;3677;2671;1696;3435;3070;1525;588;1296;1458;800;359;399;464;429,554,555,556;797;1243;1924,2983,2984;1458;1738;588;652;1458;26,398;26,378,464,478,495;1458;542,3521;450;1458;1773,1774,1775,1776,1815;1458;631,2981;2860;545;1696;3562;26,1326;1696;461,476,588;461,476;588;3567;1773,1774,1775,1776,1815;1458;2388;870;1458,1940;390,1733,1734;1781,1794;390,1733,1734;26,429;120,2024;3114;1781;1696;1243;1243;1243;1458;1135;530,531;436;957;26,1704;27,1091,1697,1822,1825,1826;1263;26;1825,1826;26;27,1091,1822,1823,1824,1825,1826;495;1868;1333;2903,2904;657;876;588;1218;939,940;429,461,463,464;652,1754;2322;3462;430;1178,1458;588,868;542,827,2654;386,502,1692;429;386,502,1692;386,502,1692;429,1685,1686;588;588;386,429,588;386,502,1692;588;386,502,1692,2197;26,588;588;506;588;411;464;2117;939,940;1458;1458;1525;1099;1458;106,2399;1458;779;1458;26,1838;3356;1458;275,276;201;512,513,514,515,516;512,513,514,515,516;475;1696;1696;588;1695;1240,1458;827,1050,1458,1513;398,430,545;359;2887;991,1458;1781,1793;1343;1430;827;406,1414;464;378,429,492,493,494,495;3228,3229;939,940;1781;797;588;850,3476;1458;588;588;495;1394;1781;2967;619;1644;1525;1698;1458;1394;2070;26;2548;1243;2621;1781;588;1243;2245;1458;2205;3106;26,29;29,576,3282;1695,1696,1697,1698;779;2767;588;2830;28,542,631,1525,3480;1381;776;779;797;106,1750;1798;990,1694;26,475;1458;26;1458;2781;106,1764,2391;1458;406;785;1781,1793;665;26;1458;588;779;991;991;991;355,2676;588;1695,1696,1697;588,1700;26;1839;868,951;2104;411;749;588;588;26,588,1666,2749,2750;588;545,1201;430,545;475;797;3267,3739;1752,1753;1525;752;499,1079;1458;2580;406;26,2143;1307;111,825;26,411,450,496,1405,1696;386;1671;1243;631,1905;779;1781;588,648;1549;1243;1738;1797;1781,2691,2692;1458;542;26;1243;379;2595,2596,2597,2598,2599;1319;1350,3543;2161;2671;358;1644;495;29;172;827;397,2511;413,991;588;1458;1458;272,273,274;2397,2605;2970;28,1739;28;1458;3622,3623;588;26;589,590,1698;631;3484;1525;29,576,1525,3282;1781,1793;1751;2141;362,694,747,748;430;1525,3285,3286,3287,3288;1458;26;26;991;1458;2348;1952;648;1458;1525;991,1525;1525;1696;1120;3510;1644;1347;1319;2759;1458;1458;470,1696;486;2363;1696;1005,1006,1007;1953;1458;827;29;939,940;749;939,940;2990;1333;2690;991;798;2283;1159;2173;1798;367;347,1122,1123;588;1525,1722;1525;470,580;1698;569,726,946;499,500;106,2391;1458;102;2172;2771;1696;1458;26;451,588,2656;1752,1753;1980;991;130,355,365,827,1005,2644,2645;588;1394;391;1781;991;355,1709,2571;472,991,1525;800,964,1542,1543,1544;413,1525;1458;1781;588;1781;1539;588;1494,1620;1218;1773,1774,1775,1776,1815;1781;1458;797;1394;840;1467;1644;588;2629;749;1458;26,29,929,1827;1696;3452;6,15,321,322,323,324,326;1261,1644;797;1695;1243;1458;1243;111;1458;3029,3030;952,1989,2067,2150;386,976;1243;1243;1243;1243;1458,1697;1923;1430,3231;633;1957;1112;386,451;1781;1243;1243;631,984,3204;1243;1090;26;991,2622;1696;26,1484;1525;373;511,542,776;390,1733,1734;1525;679,2020;1758;130,1467;719,725;26;1458;26,1363;3196;599;991;3740;588;991,1696;26;1458;1458;1458;967;3123;588;464;1096;588;1696;26,362,497,498;620,1245,1722;991,1696;26,464,478,1063;588,991;689;884;547;547,884;1697;1644;106,1454,1962;588;347,1644;1047;227,228;1458;1696;1781,1793;3397;1243;1695;1458;362;1243;1243;588;406,1414;1696;436;26,542,827,1488;588;588;1333;1243;26;3352,3353,3354,3355;3703;3673,3674;3172;2879;26,29,1661;451;2108;1338,1595;1666;3016,3017;951;3016,3017;1273;542,588,610;398;26,430,588;26;749;398;502;749;720,723;1661;588;610,2107;939,940;542;1458;2676;681,3421;406;588;459;26;587,652;1458;464;1458;430,637;2485;106;2197;420,3107,3108;720,723;1525;475,991;26,991,1696;497;1680;464;588;1680;991;991;588;1018;631;588,1666;782,1490;1458;399;1434;782,1458,1517;1411;991;2478;1847;1458;1458;991;588;26;1525;827;588;1096,2059;1781,1793;588;1458;347;386,1697;386,1697;2676;1696;1458,2113;406;1244;939,940;991;939,940;678,991;588;672;827,957;2792,2793;1752,1753;1295,1742;106,411,588;2672;887;3128;542;1696;1458;1458;1458;1458;123,2551;347;1644;1458;1458;1458;648;626;3358;475;398,430,464,545;386,430,464,588;347;2828;1243;588;1218;1056;464;1698;1319;347;542,1458,1564;1695,1696,1697;1458;3714;1096,2041;588;386;451;1872;827,1050,1458,1513;1243;399;1243;588;398,499,2147;347,1122,1123;652;176,177,178;587;508,588;588;1178;2281;749;1458;350;1781,1793;386,451;386,451;386,451;29,631;497,1705;634;588;378;1458;1722;1525,1719;1458;1079,1351,1352;1458;1394;1644;308,309;413;362,1215;406;2428;1668;441,584;918,1494,1570,1607,1621,1622;26,430,864,866;26,863,864,865;868,2038;1458;3069;347;1394;413;1464,1466,1467;3483;588;893;1458;1458;1201;2813;2070;406,1414,2229,2230;3206;174;1038;1458,1536;1595;406,1750;1458;1525,1722;1458;1458;1458;367,370;701;588;1458;1008,1009;1644,1781;774;2439;1218;2044;1280;1458;1458;1458;827,1050,1458,1513;1161,1162;1458;2898;1458;1781,1793;378;588;332;450,1279;94,95,359;495;631,776,827,1676,1798,1872,1876,1877;359;464;797;1762;796,797;367;1781,1793;732;3549;146,147;146,147,3713;150;1781,1793;2991;1243;1243;1458;1343;1205;696,697,698;1694;1458;568;1458;2199;1458;1458;800,964,1542,1543,1544;652;1702;588;2077,2078,2079;1458;588;1458;3675;2401;26;791;1644;406,1464,1507,1508,1509,1510;1096;1120;1531,1553,1554;1458;1243;3419;1525;1993;833;26;2429;2813;26;2520;714;26;1458;1781;332;652;1240;369;3525;3625;1697;1525;26,3661;413,1719;413;1458,1743;964,1631,2797,2798,2799,2800,2801;413,1525;1564;1458;1458;1458;1140,1464,1560,1561,1562,1563;1458;2706,2707;991;588,2144;413;391;1983;1458;651;991;86;1178;3058,3059;1345;588;588;779;1993;1617;1602;1592;3630;26,1525;26;1698;26,439,804,2019;26;1525;1458;26,1484;26,1569;1433;1458,1484;1781;1458;3685;1644;1120;991;1781;1781;991;1458;1525,3285,3286,3287,3288;252;1781,1793;588;1781;991,1097;1458;450,989;436,765;2160;362;1751;2676;1738;1458;26,398;588;1940,2316;1438;26,2701;1018,2035;1525;1099,3437;2401;26,59;26,59;26,59;26,59;26,59;749;451;2063;26,29;1458;2714;914;278,1817,1818;1644;1817,1818;1817,1818;1644;373;1400;1381;1644;588;1414;588;399,429,853;26;1778;217,221;1644;406,1750;1243;2676;1644;3112;1644;1493;749;1666;106,2391;588;624;450;1243;1243;749;332,1661;426;1243;1458;939,940;630;1243;1243;1243;749;939,940;3494;749;749;163,164;1458;1458;1986;1458;1458;1644;1319;1781,1793;1218;623;588;1644;939,940;1624;749;502;588;1696;1458;456,3695;1644;1178,1564;951;588;26,28,29,588,1661,1722;464,588;2580;2873;475,1603,2037,2038;332;451,2022,2023;2104;588;588;2590;26,1311,2726,3045,3046,3047,3048;588,2076;476;588;588;387;749;332;1243;406;1525;1995;1458;406;804;920;966,1449,1450;438,502,787,788,789;588;398,430,545;939,940;749;2131;332;1644;974;2042;588;106,1458;1458;3242;970;3242;2613;991,1091,1825,1826;390,1733,1734;542;2699;1458;1644;130,1628;459;26;106;1798;106;464;406,1750;464;1697;511,542;939,940;749;2714;588;588;3494;3494;588;588;588;464;2088;1781,1793;779;1458;1458;26,27;3217;28;1695,1696,1697;2938,2939,2940;779;1696;1458;2245;939,940;615;1173;3592,3593;3101;1464,2995;1993;542;599;931;1458,1744;26,1858;2714;26,86,1487,1582,1583,1584;1644;2268;1695,1696,1697;1644;1178;1695,1697;1694;355;406;527;1781;1458;3468;1458;389,1458;588;1132,3525;1733;1458;1644;2520;450;450,753;1343,2033;450;26,1525;1433;547,623,1452,1453,1454,1455,1456,1457;1458;3555;1781;397,413,1698;991;1695,1696,1697;106;359;1394;1781,1793;1695;2384;1525;464,588,939;29,1458;1458;1458;26,27,28,29;26,1245,1668,2905;1458;1458;797;264,265,1064,1065;788;2515;2448;1696;29;588;542;588;588;1841;588;133;1458;823;1458;587;2065;1458;106;106;75;588;26,1405,2236;26,588;1005,1006,1007;1178,1458,1525;1178,1458;406;991;1178;26,1704;991;26,1525;362,1661;362,1661;362,1661;470;1773,1774,1775,1776,1815;1773,1774,1775,1776,1815;1781,1793,1959;1243;797;1394;1644;347,1122,1123;2009;652;2676;106;542;399;2676;749;1363,1726;3159;588;588;499,500,610,1186;26,1722,1826;373,3433;26;990;1722;373,419,1695;1697;390,2098;1698;991;1696;922,923,924;1178,1458;1737;1458;1243;28,29,1719;1699;1178,1458;1644;3718;386,464;588;1078;430,545;362,588,1525;588;411;991;2195;430,545,1201;588;1099,3437;26;588;1321;2248;1096;378,588;1525;1781;1781;1798;1225;359;1458;3358;1781,1793;749;991;588;106;2498;26,898;1088,1644;1458;1458;26;26,450,1695,2567;1458;400,502,3534;29;1458;1737;511,542,1458;398,588;1458;355;2197;588;1695;332;1458;1525,3537,3538;1096;1841,3506;1644;1388;2245;1093;2400;588;1458;1458;111,511,542,588,1698;1343,1467,3647;1178;2907;1243;615;447;1394;2520;26,542;2520;350;413;1487,1717,1749;1458;26,438,440;362,664;56;1696;1426;574;1675;1781;588;1319;1394;102;1458;588;1550,1551,1552;3208;430;390,1733,1734;3147;349;347,1122,1123;542;502,588;390,1733,1734;390,1733,1734;362;1218;2561,2562,2563,2564;26;1018;106,2391;1382,1383,1694;1781;542,827,2654;386,502,1692;749;1024;2104;464,588;426,1099,3295;588,1458;588;588;386,502,1692;502,1691,2197;386,502,1692;588;588;1096,1539;1428,1429,1430,1431;511;1414,2249,2542;28,419,991,1695;1458;913;502,588;898;588;749;1099,3437;1696;1798;1458;2103;2114;2114;2114;1458;1569;406,1296;1394;1458;1464,1466,1469,1470;1458;1752,1753;475;1003;1644;406,1750;1385;1778;3079;939,940;1781,1793;1458;1283;572,1698;1644;1458;1308;2447;3149;29;1644;1626;1458;1797;1394;1096,2031;3412;406;1458;450,1227,1475,1476;1388;1843;588;586;1120,1695;588;1696;2556;1722;1781;1458;2384;749;588,2789;939,940;588;2277;332;939,940;588;588;1338,2649,2650;1339;1458;1696;2067;542;588,1752,1753;2795;1458;631;2936,2937;1458;1696,1697;1699;643;28;587;470;386,1697;1458;1781,1793;588;451,499,500,501;266;362;906;60,61,62;1243;1243;26,362,952;1976;1178;1218;1394;681,1525,2975;470,1781,2377;2403,2404;1458;3183;1697;1458;678;426;811;1778;2593;1695;332;1458;1458;293;2410;26,413,991,1835,1837;1333;757,1458,2337;1525;359,360,361,1644;3650;1458;1458;1458;1132,3525;26;1949;1697;2832;1096;886;939,940;732,1644;1458;1458;26,413,991,1835,1837;26,413,991,1835,1837;652,1458;1645;1458;106,1458,1554,2685,2892,2893,2894,2895;2036;1411;1458;1458;1458;1458;1458;450,827;1458;398;939,940;588;464;588;108,109;111,1525;1458;1458;689,1695;426,991,1719;397,1695,1696,1697,1698,1719;3401;1243;3246;152,153;1458;347;2532;542,588;1458;75;1458;1781;1781,1793;1458;631;1781;797;362,1095,1096,1097,1099;2070;106;607;588,2121;111,1781;1695;26;1644;1395,2179;3227;1581;444;160;776;297;1458;355;1458;1838;588,2107;588;406;648,1458;399;1787;399;792;2861;1458;26,689,2482;1426;123;382,383,1644;1458;1394;1394;2787;2133;588;588;2838;1458,1752,1753;26,929,1827;1458;631;123;1525;26;29,3632;588,2144;26,1525;1243;1781;1697;775;111,1393;1243;332;2429;2432;1781;250,251;701,827;26;26;1394;3206;1781;827;1394;1458;1698;26;1458;588;26,413;29,631,918,1607,1613;3013;929;588;1168;26,438;430,464;939,940;455;3082;1525;26,398;29,588;1695;26,588;26,398;1525;1695;362;26,398;406;588;406,1750;1644;949;1458,2778,2779,2780;1458;464;1644;1458;1458;1458;450,1279;1781;1781;355,782;1644;1458;355;1099,3437;464;939,940;879;1747;1458;26;0,1,2,3,4,5,7,8,9,10,11,12,13,14,15,16,321,322,323,324,326;749;75;561;1343;588;1668;106;939,940;588;568;26,398;939,940;749;749;749;1695;1781,1793;1458;1699;652;556,1439,1440;1696;367;502,588;1458;378;1998;417,499,500;15,321,322,323,324,325,326;800,964,1542,1543,1544;1696;1458;2070;588;26,1698;3505;2245;991;464;1680;588,3390;29;26;1319;378;1423;1458;1698;286;1644;378,1680;976,990;827;26,413,1701,1835;26,413,1701,1835;588;588;1458;749;1458;1644;1695,1696,1697;1850;1850;1458,2639,2999,3000;568,1156;2324;2184;1458;1458;332;26;939,940;1400,1411,1458,2738,2739;1458;436;652;647,853,1694;939,940;1458;26;991;1243;106;1906;1458;827,1418;1394;1458;1218;636;123;1892;1773,1774,1775,1776,1815;1458;1243;1015;947;2435;1394;1458;137;1644;991;106,2391;1458;464;1178;1781;1243;1458;652;1458;939,940;588;26,450;386;588;26;588,868;588;3651;1797;1841,3506;219,220;1781,1793;878;26;1781,1793;776;749;1760;1458;386,1232,1233;231,232;1296;1781;1644;1695;588;1458;588;511;796,797;542,868;1787;378;610,1186;1961;378;3358;1781,1793;1458;1243;827;1030;863,864,865,866;154,289;1205;736;1781,1793;26,455;1458;1696;355;588;413;386,450,1489,1695;2591;2967;1458;3358;1458;355;588;1458;1624;1644;1697;991,1525;1696;390,475;1243;1227,1458;464;1458;2317;1458;1458;588;451;588;782,1458;26;362;1099,3437;1099;1099,3437;2817;2976;406,1464,1507,1508,1509,1510;827;111;355;1522,1523;1240;1697;106;413,1099;1458;26,400;502,588;355;1644;3682,3683;1525,3285,3286,3287,3288;1458;1096;1243;26;386;1218;1525,1722;26,1525;542;3358;1132,3525;464;782;332;1778;1208;2714,2715,2716;631,1458,1595;367;1697;1458;386,1697;1287,1398;1458;615;106,1764,2391;908;29,1458,2316;2570;347,1122,1123;797;749;1525;204,205;2445;1644;1458;1299;1696;1178;29,1245,3398;426;964,1631,2797,2798,2799,2800,2801;386,1697;1458;588;347;3420;588;2529,2530,2531;359;779;502,588;588;1525;1178,1458;26,544,588;106,786;450,1563,2464;545;542;1371;1458;451;1580;2676;2220,2221;991;1575;939,940;693;1050,1458;1458;1778;1781;1458;553;1525;1458;450;678,1099;355;666;1458;451;588;1698;1338;749;386,1697;2110;1458;1458;542;26,398;1458;1644;1458;26;355;1458;1817,1818;1817,1818;1817,1818;1817,1818;1817,1818;1817,1818;1817,1818;1934;2429;1018;1458;502;1644;399;1333;1781,1793;991;1458;1458;1644;1696;347,1122,1123;1997;1458;355;588;1458;1525;1781,1793;1781;1458;2078,2079;26,1593;1243;406,1464,1507,1508,1509,1510;1243;1458;1243;1243;939,940;1243;749;1458;347,1122,1123;1797;406,1750;762;1966;1231;2197;1458;380;1781;749;588;1319,1320;827;464;26,1528,1529;1781;1644;1781;26,2132;827,1625;1972,1973;1973;683;924;939,940;749;851;588;1781,1793;295;1050;1050,1554;1458;1695;1435,1436;1228;2628;1458;3523;1781;1488;1458;3694;387;1781;1516,1517;1525,3285,3286,3287,3288;647;1695;588;378;588;588;588;1781,1793;804;1099,3437;347,1122,1123;1414;373;1696;1525;1458;355;26;3727;1458;1458;588;2527;1305;1243;1243;2862;991;1781,1793;1458;893,1096,1996;1458;495,827;588,1093,2356;2057,2366;1458;1722;1615;982,983;1243;588;362;1781;511;111;347;1521;749;1722;1644;1458;1644;556,1439,1440;1458;-2914;3569;1458;1781;399;1644;542;1458;347;931;701;588;623;588;1698;26,27;26;827;999;1458;588;359;1787;26,59;56,57;26,59;26,59;588;1695;749;362,1661;1458;130;1120;939,940;588;588;1458;2131;1458;1243;991;26;26;1525;1525;1458;26;991;450,753,1535;2558;1243;1458;1644;1458;230;1719;991;229;2138;426,991;367;406,1750;2987;749;1564;1781;413;1243;1458;749;749;26,398;991;939,940;1419;1401;399;1458;1993;2590;2401;359;1644;1458;26;1644;652;623;464,588;588;355;776;1467;454;464;1458;411,588;588;588;545,588;568;3749;475;991;1147;1458;1243;1525,3285,3286,3287,3288;367;26;1458;899;2753;1458;1458;652;1079;1458;1781,1793;1458;406;588;1781;2867;26;804;2903,2904;29,1245,3398;2091;398,430,545;464;588;1458;75;26;464;1194,1200;749;544,1688;588;588;386;441;749;588;588;464;386,820;429,464,588;749;1661;931;1151;2131;1099,3437;652;1751,2416;1458;406,1750;359,1781;2676;1644;1243;2049;1817,1818;91;3432;27;2676;779,1919;939,940;1458;758;1781,1793;106;991,1576;1458;1458;1458;406,2133;779;1525;1458;1458;1781;3391;386;1458;1458;652;3213;464,588;427;1458;26;347,1122,1123;75;1458;2294,2295,2296;3681;485;1203;1381;464;1644;1134;588;939,940;1218;2105;749;939,940;749;939,940;1218;588;563;545;939,940;28;106;588;588;26;26;1458;991;588;991;386;1696;450,753;1458;1797;2070;106,2391;359;386,1697;3134;362;615;1458;1644;413;1580;2647;3647;386,1697;26;1243;495,767;2824,2850;464,502;1458;355;102;1394;1525;1525;1376;1525;893;26;1243;26,991,2752;398;464,588;1781,1793;2245;1696;1694;1099,3437;1697;1525;1099,3437;411,568,588;26,1099;379,475,540,1698;1694;1333;26,413,1698,1701,1835,1836,1837;261,262,263;1096;225,226;588;26,1604,2742,3223,3224;931;652;355;26,413,991,1835,1837;471;2103;26,450,991,1321;1430,1443;1458;827;429;1462,1463,1464;1640;631,1532,1533,1534;1778;1738;615;1381,2331;29;1623;802;102;1217;1781,1793;1696;615;588;1816;701;1458;26,991,2856;399;379,568;1321;106,779,2391;1458;1243;1050,1458;1781,1793;616;858;348,2254;297,298;623;3358;1458;1458;1005,1006,1007;111,647,2809;386;776,1120,1240;1731;1696;2676;154;1243;3283;3090;129;991;27;1458;86;1484;398;26;870;588;26,929,1827;26,1828,1829;332;2494;1458;887;1243;239,241;350;139;450,701,1487,1577;1781,1813;1813;475,1025;2676;1243;1243;1781;3166,3167,3168;26;26,2501;1781;406,1464,1507,1508,1509,1510;26;568;631,1487,1614,1615;1458;106;26;456,588,1687;1458;1525;1696;970;588;26,1528;26;588;26,2581;588;378,429,495,502,1061,1062,1063;26,991;386,1697;1050;1525;17,18,19,20,21,22,23,24,25,338,339,340,341,342,343,344,345,346;1140;523,524;26;399;542,827,2654;106;1644;1739;749;1867;451,588;26;123;1458;1096;1781;1781;1458;1778,1797,1799;1758;782;123,253,254,367,1764;1243;3352,3353,3354,3355;3352,3353,3354,3355;17,18,19,20,21,22,23,24,25,338,339,340,341,342,343,344,345,346;939,940;3016,3017;588;26;939,940;939,940;588;939,940;939,940;378;1234,1987;542;588;588;1698;631;29;26,398;776;2142;1458;1099,3437;1458;1458;1458;387;1702;430;1781,1793;386;386,389;588;1319;588;378;1010;1386,1387;26,413,1697,1835,1837;1099;1243;2676;2705;1458;464;588;991;2151;3119;1291;106,1763,1764,2391;1458;1458;1458;588;2373;991;939,940;1525,3285,3286,3287,3288;939,940;665;1458;3494;1817,1818;406,1464,1507,1508,1509,1510;939,940;939,940;1458;3576;359;652;931;1781,1793;1644;257,258;347,1122,1123;1458;1781,1793;29,3423,3424;652;749;542,588;464;588;1781,1793;2960;749;26,517;588;1319,2899;528;362;753;2639;1120;2889;1458;373,1217;652;1243;588;1394;1458;26,27;413;1458;1781;1116;1243;939,940;26,1528,1529;1458;1458;2696;1458;2204;2840,2841,2842,2843,2844;1696;1096;2317;26,27;1458;1458;403;1698;387;991;785;235;1752,1753;882;648;3289;1458;386,1697;1781;1644;621;1243;430;1778;111,128,3603,3604,3605,3606,3607;1525;355;1462,1463,1464;1697;1458;1458;1458,1525;631,1676,1749,1873,1874,1875;797;797;746;487;788,1120;3358;306,307,347;106;1781,1793;355,701;347;1644;386,502,1692;1458;701,3358;652;1458;2307;2390;290,291;1458;1132,3525;3525;1458;568;1550,1551,1552;1699;588;1697;1458;1940,2417;1697;2070;1333;1644;1458;1458;26,29,542,1245,3398,3399;1484;588;1458;1458;386,502,1692;536;2693;964,1631,2797,2798,2799,2800,2801;2085,2086;450,991,1227,1266;1458;1738;464;749;1458;2821;347;1525;1243;991,3146;623;495;386;3300;966,1449,1450;939,940;2480,2481;891;588;1372;1243;1243;972;1781;450;749;749;26,1464;26;1752,1753;406,1464,1507,1508,1509,1510;1928;1243;652;411;588;868,951,2910;406;123;3710;782,3117;464;406,1414;1102;681,827,1240,1940,2092;1458;577;464,472;411,568;378;2119;939,940;3064,3065,3066,3067;77,2953,2955,2956,2959;464,588;991;1343;528;717;1394;1738;1644;991,1091,1825,1826;386;3365;1458;1817,1818;1817,1818;430;2117;588;588,1458;1644;3649;621;502,1690;588;991;749;1243;26;1458;1458;528;850;850;1243;749;588;2131;406,1750;1458;1525;1644;1458;106,2391;1740;347,1122,1123;1894,1895;939,940;1458;652;1458;1201;199,200;588;588,2076;2066;1205;1696;1781,2441;651;106;939,940;1458;1781;3358;106;406,1525,1752,3380;26;496,542,1034,1081,1695;1096;123;495;652;631,3451;3268,3269,3270;3268,3269,3270;3268,3269,3270;1644;1251;26;1458;2031;1458;399;1085;26,27;1050,1458;29;939,940;588;939,940;1946;3217;1817,1818;1243;1243;1243;1458;1303;1458;1458;1697,2136;588;26;2285;1458;1564;436;1458;1458;1644;1333;1644;435;1336,1337,1338;597;1458;347;332,450;1458;1458;1458;1695,1696,1697;1178,1458;652;450;623;26,27;991;1193;347;2107;1458;1525;1243;939,940;2002;1458;1781;502,588;749;26;2378;939,940;2070;406,1750;3358;851;749;1458;776;1780;26;1458;1751;749;106;588;749;26,59;26,59;1696;1781;1644;3372;26,3274,3275;1697;1698;1458;1458;15,321,322,323,324,325,326;852;1168,1205;129;347;386;588,1719;2401;1576;1458;3507;1696;749;1781;359;3166,3167;588;1797;2401;931;1458;451;1016;386;362;1458;115,116;1458;1243;1600,3609;991,1099;504;588;749;1781;884;3440;652;2371;1645;1781;1458;1644;2107;1697;1765,1766;450;2100;464;2191,3003;3206;1343;29,1722;1458;1458;652;1781,1793;1458;2518;1825,1826;408,409;1525;599;1215;2090;1919;839,1781;1525;588;939,940;588;1458;2197;588;1458;1458;26;1458;1053;1765,1766;797;939,940;1698;779;991;1697;1458;26,450,1477;26;1430,1443;1993;1458;1458;2358;1958;430;1099,3437;464;2114;2114;588;588;3369;464;1458;1321,1722,3027,3028;588;464;3381;1458;939,940;797;406,1750;1018;419;1696;1458;588;1050;1243;779;1458;399;406,1464,1507,1508,1509,1510;1050,1458;148;2070;1458;1458;1458;2250;26;827,1445;464;588;588;1703;991;588;29,542;1458;1578;386,3724;1243;1530;1458;588;1781;347;827;1695;1539;1644;26,451;909,910;1099,3437;1246;1458;1331;1458;3574;1458;2546,2547;1778;1525;1781;991;1525;1099,3437;26,413,1835,1837;1099,3437;545;355;105;1940;26,397,413,991,1835;1694;1525;1525;991;1458;1099;406;111;1096,1458;26,27;1964;347,1122,1123;2233;588;2279;2070;1644;1458;1458;1458;1458;3248;2333;464;378;1419;1319;588;1458;436;615;1566,1567,1568;138;2409;1797;1458;3563;1698;1698;1458;1231;1373,1374;1458;1781;1458;475;1644;1462,1463,1464;858,2254;1781;1458;106;588;2070;1458;588;26,1722,2067,3023;406,1464,1507,1508,1509,1510;588;588;26,2920;1322;749;749;1211,1458;464;3466;1781,1793;1644;827,1445;2285;111;1243;3035;1209,1240;782;133,134;1644;26;2838;1696;1644;413,1099;106;3427;939,940;749;749;508,588;547;1120;511,1697;1458;1737;1458;106;359;1864,1865;1227;691,1347;1696;1458;355;588;2197;386,502,1692,1693;411,568;939,940;749;111;588;749;332;1458;347;1458;3428;106,3218;2825;1696;1698;386,389,483;1458;1240;26,413,1702,1835,1837;1955;502;26,413,1525,1835,1837;1096;1458;1458;588;1178;588;528;1525,3285,3286,3287,3288;1458;413;1817,1818;1163;1401;144;464;749;588;1458;588;3358;400,631;1458;931;1695;1458;701;2398;464;3493;1458;465;588;1644;1458;749;719;1458;778;1458;1486;406,1750;1243;749;615;1458;1781,1793;776;588;749;1458;386,451;615;1120;1781,1793;1644;1781,1789;863,864,867;3602;26,1733;1096;588;1752,1753;154,155;827;2340;2340;588;542;106;776;1695;2887;588;3748;588;2225;1458;588;26,1528,1529;1956;882;406;1099,3437;1217;3518;631,1532,1533,1534;1458;1458;851;631,1532,1533,1534;1781,1793;1651;1243;1458;1120;939,940;2552;631;26,27,28,29;1046,1047;181,182;749;588;332;2665;1458;26,27;1096;1458;827;386,1697;1697;28,379,631;1458;106;1644;3698;1458;26;964,1631,2797,2798,2799,2800,2801;1458;1458;26,27;1458;367;1120;1333;991;367,615;1838;1243;1433;2653;631;823;464,594;3289;347,1122,1123;652;782,829;1458;588;26;411,568,588;1458;355,827;1458;26,355,406;464;2131;991;939,940;502,588;1238;546,547;3410;2164;1458;106;1525;1243;2065;749;588;3645;1458;779;1817,1818;1817,1818;1817,1818;1817,1818;2415;399;1333;1458;542,991,1525;1644;106,1539;779;1048;703;3251;807;1243;939,940;1458;26;26,59;26,59;26,59;749;1644;1425;2530;1243;464;556,1439,1440;1695,1696,1697;1433;412;1412,1413;939,940;367;749;782;1565,2095;106,406,1320,1478,1479;29,451,542,2277;939,940;545;939,940;749;367;1240;113;2014;387;2526;2133;26;2676;106;749;347,1122,1123;749;568;588;1458;26;827;1458;1458;406,2021;632;1458;1458;406,1464,1507,1508,1509,1510;1506;1644;1243;1464,1557;411;1120;588,2881;145;26,27;749;939,940;26,27;979;1817,1818;26,27,28,29;542,588,1525;2344;588;2247;2107;588;1458;621;26,27,28,29;350;1697,2136;749;347,1122,1123;1458;588;1797;1738;1243;1243;1132,3525;75;1644,1781;1738;830;511;1458;776;450;26,450,1558,1559;991;1644;1270;1458;3221,3222;1781;2070;1243;1458;1243;26,27;1054;350;3392;1539,1752,1753;406,1464,1507,1508,1509,1510;1779;1743;1132,3525;1644;1781;588;3207;1243;86,3626,3627,3628;499,2147,2466;588;2676;1458;991;939,940;588,1092;1644;1458;2785;588;1234;1458;1458;111;2063;1458;1722;797;359;1696;26;399;86,3578;2357;870;378,588;1389;991;545;430;2676;2676;1346;1644;1243;939,940;1458;359;939,940;2070;475;542;2144;1458;588;601,602;587;931;1699;1243;1230;1781;588;347;823;1343;542,1694;464;599;1356;568;1458;1458;1458;1644;2782;590,690;1375;1926;588;939,940;106;3574;26;3210;26,1525;673;1458;3522;26,1528,1529;1488;386,502,1692;749;542;386,502,1692;818,819;416;1328;2914;615;596;386,1697;1695;1458;2838;1458;749;2443;1738;2114;2114;1085;1458;1458;3105;588;1458;1243;1414;797;1458;2279;1781,1793;588;2146;26,27;106;1458;1458;26,27;407,588;827,1050,1458,1513;1781,1793;1243;359,1255,1644;2079;464;399;106;26,27;26,451;939,940;588;429,430,845;749;991;588;1458;1458;347,1122,1123;1781,1793;1458;990;26,952,1989,1990;1458;1797,3202,3203;991;1458;406,1464,1507,1508,1509,1510;436;1781;2824,2849,2850;411;1099;1702;1099,3437;239,1573,1574;1697;26,413,1835;1458;542;1243;1458;26,413,991,1835,1837;1696;1458;1227;1652;386,450,753;1781,1793;615;1781;464,588;588;1781,1793;946;652;1781;1695;1458;347,1122,1123;1644;1462,1463,1464;797;1458;1781;588;970,1094;1458;1697;362,1722,2067;472;665;588;1458;1696;1697;3699,3700;1243;1458;355;1381;588;588;1243;542,588;2411;386,1697;1778;1243;1243;496;588;347,1122,1123;26;1205;528;1458;419,588,635;1781;1751;520;1419;588;542,1458;749;749;191,192,193;1149,1150;1908;3189,3190,3191;26,413,1525,1835,1837;1444;1525;1781;362,1696,1697;26,1696;106;1644;347,1122,1123;939,940;891;1781,1793;1297;125;991,2557;1644;1546,1547,1548;3709;3352,3353,3354,3355;26,776;106,1764,2391;1458;1458;398;939,940;939,940;2837;939,940;2767;106;1696;1458;1595;1644;893;631;652;26,413,1701,1835;884,1178;3396;1394;2838;464,588;1344;588;387;1695,1696,1697;398,1218;1458;588;410;1096;939,940;1697;1458;588;1699;893;26;2944;1458;436;1243;1698;1781,1793;1218;26;939,940;464;355;26;406,1750;3358;882,1144;1458;1644;464;26,27;749;1243;1757;3709;1430,1443;1430,1443;386,451;367;26,27;121;1458;2676;26,1484;1781;588;588;1458;1458;1458;1243;2340;1458;588;402,403,404;449;451,979,1187;464;3358;378;1243;588;204,205;2070;1695;1218;884;3427;1458;495;386,1697;880;588;1781;1696;106;939,940;1525;800,964,1542,1543,1544;1410;1243;1644;588,1458;2090,2440;26,475,497;1458;1781,1793;-3686;1022;1132,3525;1458;106;2722,2723,2724;1644;1458;436;1458;607;347;991;827,1397,2699,2700;2845,2846;1738;1576;1333;1333;1333;827,1050,1458,1513;1781;26,3072;691;688,2265;3225;556,1439,1440;1839;1458;2578;3118;588;827;1458;1056;26,1044;26;1699;939,940;106,2391;1525;1778;2059;106;2676;588;827;623;854;1334;568;27,1091,1697,1822;1458;749;1458;749;1644;749;464;154,173;893;749;1243;1817,1818;1817,1818;1817,1818;1817,1818;1333;587;1458;776;78,79,80;1333;26,59;1243;1243;1243;347,1122,1123;1781,1793;991;1218;2200;1781,1793;3166,3167;1644;1458;1243;776;1458;1916;1458;542,1679,1731,2039;939,940;75,1585;1458;1458;26;1698;89,3276;1168;355;464,502;1781,1793;406,1464,1507,1508,1509,1510;615;939,940;749;26,27,28,29;1458;1168;451;1458;588;2166;1781,1793;1458;1458;1458;1240;362;970,1310;939,940;588;26,27;26,27,28,29;2676;2247;588;1243;1243;1243;1459;1781,1793;1781,1793;749;1644;1781;1243;1458;1458;1458;406,1464,1507,1508,1509,1510;982,983;572,626,982,983;779,833;3129;1458;1781;3165;1737,3669;700;1096;26,27;776;106;1444;1458;1458;749;588;347;2379;3729;939,940;1747;931;2114;588;26,27,28,29;2031;379;629;130,1205;1244;1644;2104;1781;1458;359;1697;3579;615;398;1005,1006,1007;957,2062,2130;1458;588;1973;1940;1458;464;411,568,588;588;373;436;1644;373;1053;1178;26,27;1781;554;588;587;851;406,1464,1507,1508,1509,1510;1781,1794;588;170,171;1817,1818;3162;2869;29;2903,2904;439,804,2575;931;939,940;1781;939,940;588;588;542,1458;464,588;931;931;1050,1458;451,508;1458;1458;1445,1458,1541;588;2114;387;588;495;588;1696;1227;1797;26,27;1243;413;26,27;1525;26;1458;1218;1644;1458;574;1458;1096;1240;1458;1458;623;3243;701;2669;1458;1697,1702;1458;939,940;939,940;1458;1458;618;364,365,366,1458;2651;991;3588;1099,3437;2783;588;1781;588;1411;1099,3437;542;1458;2053;779;3504;1781,1793;1525;1243;3389;1695;26,413,1701,1835,1837;1838;1099,3437;26,413,1701;588;1698;1781;106,406,2552;749;26,689,1697;1696;26,413,991,1835,1837;1458;332;1697;311,312;652;1781;1458;1138;935;3099;797;670,671;1781,1793;1696;1458;858,2254;26,27,28,29;1361;1839;1458;939,940;939,940;588;1030,2671;1781;1194,1195,1196,1197,1198,1199,1200;749;1458;347,1122,1123;1458;1096;1695;3029,3030;3083;1644;1243;1781,1793;1695,2222;849;26;1458;3105;1458;111;1722;26;386;26;1525;1458;1525;1644;1644;1214;1243;406,1464,1507,1508,1509,1510;1764;1411;1458;386,502,1692;1178,1458;588;2104;939,940;939,940;939,940;1677;615;1781;1067;588;26;1120;26;2646;870;1458;430;768;2104;26,398;588;1458;1458;939,940;1585;1666;1666;1458;1458;1096;1458;939,940;1458;26,106,436;1781,1793;387;1242;931,1977;3086;542;827,1050,1458,1513;2465;588;749;1462,1463,1464;347;386,1458;1319;1458;652,841;1458;652;851;26,59;588;2099;666;2676;588;588;26,27,28,29;26;1458;1781,1793;1695;1781;1525;991;1458;782;2070;1781,1793;1458;430;991;2714;1458;27;1458;111;26,2553;1458;-3686;588;782;2558;1227;542;1458;106;26;1458;588;588;369,1644;991;1190,1191;652;588;3594;26;502;1644;588;26,59;26,59;26,59;991;347,1122,1123;26,2131;3545,3546;2171;1030;106;436;847,991;350;749;1458;1968;827;1458;355;1752,1753;1696;26,1525;1512;588;540;1458;776;1817,1818;1817,1818;1817,1818;1817,1818;1817,1818;1817,1818;956,957;1781;561;26,59;1458;844;1695;399,436;1058;588;1243;1071;1696;367;1458;1458;347;588;1458;347,1122,1123;1644;464,1218;347,1122,1123;2676;1458;939,940;939,940;367;1458;1644;1569;882;1696;347;1458;1747;979;1243;1644;1458;701;332;3525;1132,3525;1132,3525;1132,3525;2392;1458;406,1464,1507,1508,1509,1510;399;827,1050,1458,1513;347;2285;1218;3450;347,1122,1123;1433;1697;436,832;-1051,1515;1050;26,27;652;1444;1458;588;749;1243;26,27;1752,1753;1644;26,27;991;827,1050,1458,1513;939,940;931;1779;1781,1793;1644;1694;1356;1640;386,719;347;782,1458;1458;2568;436,451,588;1967;26,430,761;1458;3358;1341,1342;1033;1087,1644;1644;939,940;631,1838,3644;2902;1458;1781,1793;749;749;1781;939,940;332;797;1044;355;652;908;1277;-2962,-2963,-2964,-2965,-2966;3624;260;26,1525,3002;355;611;1458;429,1685,1686;931;623;1458;26;615;588;2114;1458;2676;26,27;450,753;350,1075;332;1781,1793;1644;701,1458;26,27;369,372;1644;413;1696;826;26,27;1458;347,1122,1123;430;1644;156;1458;26;26,588;211;588;939,940;1099,3437;1462,1463,1464;630;411,631,926,1697,2495,2496;26,413,991;406,1464,1507,1508,1509,1510;3584,3585;1458;1458;1458,3111;615;588;1458,1743;26;588;29;1358;316,1067;2047;1458;776;347,1122,1123;588;1099;464;406,1464,1507,1508,1509,1510;86;1926;2925;1458;347,1122,1123;1243;1661;588,1661;386,722;378,502,588;1761;1738;779;1644,1649;1231;991,3361;475;451;26;1696;779;1644;939,940;827;464;1458;1698;1458;1680;588;749;15,-27,321,322,323,324,325,326;347,1122,1123;362,820;1458;912;1057;387;1695;2447;1644;436;1423;652;588;652;1458;1841,3506;588;588;436;1458;367;1178;1355;1243;939,940;588;123,528,3441;782,2318;1738;29;1781;406,1414;1781;1423;26,1525;1367,2061;1854,2812;26;1458;1458;1132;1458;475;347;1752,1753;2330;588;1458;827,1050,1458,1513;1442;26,27;1458;1458;1458;2652;362;845;26,27;1333;2510;2510;26,59;588;347;2387;495;399;588;939,940;2874;749;1458;1644;399;1817,1818;1817,1818;-733,1817,1818;1817,1818;1817,1818;1817,1818;1817,1818;1817,1818;1817,1818;1817,1818;1423;1738;411,568,588;1458;615;464;1644;588;749;1644;1458;1243;367;788;1644;1644;1458;1781;939,940;588;1458;2452;1458;1178;3053;2262;1458;406,1750;1458;970,3050,3051;979;123,130,3698;1445,1458,1541;1243;1458;1458;1243;1243;1243;882;1458;1458;621;749;939,940;26,475;1243;436;2060;1671;1695;26;1458;1243;579;1458;26,59;26,59;2618;588;111,702;26,27,28,29;538,1042;1458;3503;547;2282;1458;588;1458;1697;1243;931;1096;1644;1099,3437;652;1283;1781,1794;1738;2168;931;2070;2782;204,313;1243;3458,3459;2114;2114;797;1525;1218;2413;1458;1644;797;3569;1430,1443;1417;26,59;26,59;26,59;26,59;26,59;26,59;26,59;26,59;502,588;588;111,647;1243;1227;1738;1963;1099,3437;920;1134,1278;588;588;1781,1793;1458;652;1458;1458;26;1306;1525;1525;2031;475;749;1458;26,413,991,1835,1837;413;571,572;1738;1458;1430,1443;905;1748;1458;1741;3064,3065,3066;1458;1458;1781,1800;106;797;3025;1781;26,27;1458;1218;399;1781;387;797;2207;1433;1470;106;749;26,27,28,29;2078,2079;3361;588;1034;26,991;588;1695;1644;1644;475;797;1644;1458;1458;3550;472;1738;621;26,365,1187;1696;412;3458,3459;411;459;776;588,991,1458;1099,3437;2970;561;1779;2070;1694;719;588;1218;1859;860;1458;588;478;436;1698;318,319,320;3158;623;1212;2451;1516,1517;502,588;1525;1458;26,27;588;2334;1525;1433;542;1458;1458;350;1644;652;399;321,322,324,2877;1778;939,940;430;3186;939,940;26,59;991;1458;2652;2652;931;1817,1818;1817,1818;1817,1818;1817,1818;1817,1818;2676;1644;588;450;588;587;2709;1458;1458;939,940;1781,1793;2813;588;588;939,940;1243;1243;1243;776;3051;26,27;26,27,29;111,470;931;1243;1243;1243;1458;26,27,28,29;1950;1293;1458;2056;1243;450;26,27,28,29;1458;283;1458;2819,2820;1458;776;1343;1243;86,1629,1632,1633,1634,1635;1458;1234;406;1781;1458;26,1695;1458;1458;939,940;1575;1420;3358;1051;1243;908;2080;931;108,183;621;1243;1817,1818;1817,1818;2114;797;347,1122,1123;1458;588;367;1644;1738;588;436;1566,1567,1568;350;1464,1557;2031;1040;1644;350;347,1122,1123;259;1917;1458;1781,1793;347;588;3020;1781;1781;1099,3437;355;1343;1316;1096;106;106;1781;776,1737;217,221;2197;588,1458;905;1458;436;1644;26,1709,1837;26,27,28;776;26;26,27,28,29;26,27;378;1738;1817,1818;588;1644;2676;1817,1818;347,1122,1123;1458;2676;1644;3458,3459;2558;905;788;1217;3568;1458;776;631,1525;3525;-1485;347,1122,1123;588;268,269;436,478;464;1696;1458;1778;1458;1458;588,903;1458;2249;1817,1818;1817,1818;1817,1818;1817,1818;1458;1644;29;26,27,28,29;2812;615;26,475,1696;1458;588,2202;1243;2375;1065,1251;1694;26,27,28,29;701;347;26,27;621;931;1423;26,27,28,29;306,3717;1458;3721;587;26;1942;776;652;1343;2342;2792,2793,2794;26,59;26,59;26,59;26,59;26,59;26,59;26,27;1243;1644;1525;1458;1644;1458;528;369;588;882;3226;1458;894;1773,1774,1775,1776,1815;1243;1739;413;1023;26;26,3002;804;804;1458;931;931;776;1781,1793;3526;347,1122,1123;464;106,2711;1817,1818;388;1423;908;588;588;398;26,27;1738;1458;1458;1414;26,413,1835,1837;1458;1458;1430,1443;1219,1644;347,1122,1123;615;1458;27;1287;2438;1458;776;436,1096;362;1644;1458;939,940;1697;1738;3220;858;26,1069,1070;1644;2313;26,1698;652;1458;1458;1525,3238;1243;1644;386;1458;1458;2701;1696;1525;588;406,1750;1458;508,621;2554;347,1458;359;1781;621;1458;1458;26;2273,2274;2601;1644;588;451;931;1458;1458;1817,1818;1817,1818;1817,1818;1817,1818;827,1319;1644;1644;1765,1766;478;3458,3459;588;1458;406,1750;1696;1458;651;26,27;26,27;1817,1818;893;1644;399;1644;1695,1696,1697;939,940;26,27,28;776;1644;1458;1644;1705;2676;1914,1915;1458;2902;1458;1644;537;315;26;1817,1818;449;804;3589;931;626;1817,1818;387;991;1458;2676;1243;26,27;1371;623;1096;588;1423;26,59;26,59;26,59;26,59;26,59;1781;1240;1653;347;1781,1793;1458;749;2182;3205;2697;588;185,186;1696;1694;406,1464,1507,1508,1509,1510;588,2144;1287;827,1050,1458,1513;355;1644;2585;1525,3285,3286,3287,3288,3289;26,27,28,29;1458;1321;3458,3459;406,1750;1343;2375;588;387;1781;1458;2193;1458;106,2391;1231;1005,1006,1007;1999;111;1817,1818;1817,1818;1817,1818;1817,1818;1817,1818;1817,1818;143;26,27;26,27;26,27;26;1458;2027;367;652;436;2902;1644,3068;615;588;1458;1171;1781,1794;1781,1794;882;1415;587;1817,1818;3193;1698;75;1458;1458;797;1458;347;26,2701;470;3169;26,804;588;560;86;1343;347,1122,1123;1458;1752,1753;26,640,641;2144;776;2235;1281;26,59;26,59;26,59;26,59;1817,1818;1458;623;347,1122,1123;26;1103;1458;1458;1243;347;495;1324,1697,1702;1458;1458;1781;3525;905;1458;1644;776;1817,1818;1817,1818;1644;132;2078,2079;495;26,27,28,29;1695,1696,1697;3458,3459;1695;3532;486;2902;1178;1817,1818;1698;1099,3437;3124;399;1738;2676;1644;1178;1458;367;158,159;1096;1458;2717,2718;2555;1696;1343;355;1644;1644;26,27;1458;1458;310;2576,2577;1817,1818;1458;3458,3459;1458;1869,1870;386;3525;1722;1458;556;1817,1818;406,848;350;701;1458;587;776;3418;1458;779;1817,1818;347,1122,1123;1458;359;333,334,349,350,3733;1099;26;26;1458;2070;1458;1458;335,336;1458;1817,1818;3458,3459;417,450,753,1698;347,1122,1123;1458;1458;362,587;3458,3459;3458,3459;623;3371;106;745;1423;106;588;27;1525;26,1187,1227,1736;776;1423;1106;3077;1458;1697;3458,3459;2550;347;1379;2847,3057;1458;587;1343;3458,3459;1378;1525;436;3458,3459;1458;26,27,28,29;3458,3459;1698;2384;1781;1343;3458,3459;1644;776;776;26;1968;27;26;3458,3459;588;965;1458;3460;1644;1458;1458;75;411,587;1817,1818;130,1628;885;3458,3459;27;1817,1818;475;893;3291;1458;399;3458,3459;918;788;588;3458,3459;1458;3458,3459;26,59;26,59;26,59;1458;197,198;26,59;26,59;26,59;26,59;26,59;26,59;26,59;26,59;26,59";

const $scriptletHostnames$ = /* 13117 */ ["j.gs","s.to","3sk.*","al.ly","asd.*","bc.vc","br.de","bs.to","clk.*","di.fm","fc.lc","fr.de","fzm.*","g3g.*","gmx.*","hqq.*","kat.*","lz.de","m4u.*","mt.de","nn.de","nw.de","o2.pl","op.gg","ouo.*","oxy.*","pnd.*","rp5.*","sh.st","sn.at","th.gl","tpb.*","tu.no","tz.de","ur.ly","vev.*","vz.lt","wa.de","wn.de","wp.de","wp.pl","wr.de","x.com","ytc.*","yts.*","za.gl","ze.tt","00m.in","1hd.to","2ddl.*","33sk.*","4br.me","4j.com","538.nl","9tsu.*","a8ix.*","agf.nl","aii.sh","al.com","as.com","av01.*","bab.la","bbf.lt","bcvc.*","bde4.*","btdb.*","btv.bg","c2g.at","cap3.*","cbc.ca","crn.pl","d-s.io","djs.sk","dlhd.*","dna.fr","dnn.de","dodz.*","dood.*","eio.io","epe.es","ettv.*","ew.com","exe.io","eztv.*","fbgo.*","fnp.de","ft.com","geo.de","geo.fr","goo.st","gra.pl","haz.de","hbz.us","hd21.*","hdss.*","hna.de","iir.ai","iiv.pl","imx.to","ioe.vn","jav.re","jav.sb","jav.si","javx.*","kaa.lt","kaa.mx","kat2.*","kio.ac","kkat.*","kmo.to","kwik.*","la7.it","lne.es","lnk.to","lvz.de","m5g.it","met.bz","mexa.*","mmm.dk","mtv.fi","nj.com","nnn.de","nos.nl","now.gg","now.us","noz.de","npo.nl","nrz.de","nto.pl","ntv.cx","och.to","oii.io","oii.la","ok.xxx","oke.io","oko.sh","ovid.*","pahe.*","pe.com","pnn.de","poop.*","qub.ca","ran.de","rgb.vn","rgl.vn","rtl.de","rtv.de","s.to>>","sab.bz","sfr.fr","shz.de","siz.tv","srt.am","svz.de","tek.no","tf1.fr","tfp.is","tii.la","tio.ch","tny.so","top.gg","tpi.li","tv2.no","tvn.pl","tvtv.*","txxx.*","uii.io","upns.*","vido.*","vip.de","vod.pl","voe.sx","vox.de","vsd.fr","waaw.*","waz.de","wco.tv","web.de","xnxx.*","xup.in","xxnx.*","yts2.*","zoro.*","0xxx.ws","10gb.vn","1337x.*","1377x.*","1ink.cc","24pdd.*","5278.cc","5play.*","7mmtv.*","7xm.xyz","8tm.net","a-ha.io","adn.com","adsh.cc","adsrt.*","adsy.pw","adyou.*","adzz.in","ahri8.*","ak4eg.*","akoam.*","akw.cam","akwam.*","an1.com","an1me.*","arbsd.*","babla.*","bbc.com","bgr.com","bgsi.gg","bhg.com","bild.de","biqle.*","bunkr.*","car.com","cbr.com","cbs.com","chip.de","cine.to","clik.pw","cnn.com","crn.com","ctrlv.*","dbna.de","delo.bg","dict.cc","digi.no","dirp.me","dlhd.sx","docer.*","doods.*","doood.*","elixx.*","enit.in","eska.pl","exe.app","exey.io","fakt.pl","faz.net","ffcv.es","filmy.*","fomo.id","fox.com","fpo.xxx","gala.de","gala.fr","gats.io","gdtot.*","giga.de","gk24.pl","gntai.*","gnula.*","goku.sx","gomo.to","gotxx.*","govid.*","gp24.pl","grid.id","gs24.pl","gsurl.*","hdvid.*","hdzog.*","hftg.co","igram.*","inc.com","inra.bg","itv.com","j5z.xyz","jav.one","javhd.*","jizz.us","jmty.jp","joyn.at","joyn.ch","joyn.de","jpg2.su","jpg6.su","k1nk.co","k511.me","kaas.ro","kfc.com","khsm.io","kijk.nl","kino.de","kinox.*","kinoz.*","koyso.*","ksl.com","ksta.de","lato.sx","laut.de","leak.sx","link.tl","linkz.*","linx.cc","litv.tv","lnbz.la","lnk2.cc","logi.im","lulu.st","m4uhd.*","mail.de","mdn.lol","mega.nz","mexa.sh","mlb.com","mlfbd.*","mlsbd.*","mlwbd.*","moin.de","mopo.de","more.tv","moto.it","movi.pk","mtv.com","myegy.*","n-tv.de","nba.com","nbc.com","netu.ac","news.at","news.bg","news.de","nfl.com","nmac.to","noxx.to","nuvid.*","odum.cl","oe24.at","oggi.it","oload.*","onle.co","onvid.*","opvid.*","oxy.edu","oyohd.*","pelix.*","pes6.es","pfps.gg","pngs.gg","pnj.com","pobre.*","prad.de","qmh.sex","rabo.no","rat.xxx","raw18.*","rmcmv.*","sat1.de","sbot.cf","seehd.*","send.cm","sflix.*","sixx.de","sms24.*","songs.*","spy.com","stape.*","stfly.*","swfr.tv","szbz.de","tj.news","tlin.me","tr.link","ttks.tw","tube8.*","tune.pk","tvhay.*","tvply.*","tvtv.ca","tvtv.us","u.co.uk","ujav.me","uns.bio","upi.com","upn.one","upvid.*","vcp.xxx","veev.to","vidd.se","vidhd.*","vidoo.*","vidop.*","vidup.*","vipr.im","viu.com","vix.com","viz.com","vkmp3.*","vods.tv","vox.com","vozz.vn","vpro.nl","vsrc.su","vudeo.*","waaaw.*","waaw1.*","welt.de","wgod.co","wiwo.de","wwd.com","xtits.*","ydr.com","yiv.com","yout.pw","ytmp3.*","zeit.de","zeiz.me","zien.pl","0deh.com","123mkv.*","15min.lt","1flix.to","1mov.lol","20min.ch","2embed.*","2ix2.com","3prn.com","4anime.*","4cash.me","4khd.com","519.best","58n1.com","7mmtv.sx","85po.com","9gag.com","9n8o.com","9xflix.*","a2zapk.*","aalah.me","actvid.*","adbull.*","adeth.cc","adfloz.*","adfoc.us","adsup.lk","aetv.com","afly.pro","agefi.fr","al4a.com","alpin.de","anigo.to","anoboy.*","arcor.de","ariva.de","asd.pics","asiaon.*","atxtv.co","auone.jp","ayo24.id","azsoft.*","babia.to","bbw6.com","bdiptv.*","bdix.app","bif24.pl","bigfm.de","bilan.ch","bing.com","binged.*","bjhub.me","blick.ch","blick.de","bmovie.*","bombuj.*","booru.eu","brato.bg","brevi.eu","bunkr.la","bunkrr.*","bzzhr.co","cam4.com","canna.to","capshd.*","cataz.to","cety.app","cgaa.org","chd4.com","cima4u.*","cineb.gg","cineb.rs","cinen9.*","citi.com","clk.asia","cnbc.com","cnet.com","comix.to","crichd.*","crone.es","cuse.com","cwtv.com","cybar.to","cykf.net","dahh.net","dazn.com","dbna.com","deano.me","dewimg.*","dfiles.*","dlhd.*>>","doods.to","doodss.*","dooood.*","dosya.co","duden.de","dump.xxx","ecac.org","eee1.lat","egolf.jp","eldia.es","emoji.gg","ervik.as","espn.com","exee.app","exeo.app","exyi.net","f75s.com","fastt.gg","fembed.*","files.cx","files.fm","files.im","filma1.*","finya.de","fir3.net","flixhq.*","fmovie.*","focus.de","friv.com","fupa.net","fxmag.pl","fzlink.*","g9r6.com","ganool.*","gaygo.tv","gdflix.*","ggjav.tv","gload.to","glodls.*","gogohd.*","gokutv.*","gol24.pl","golem.de","gtavi.pl","gusto.at","hackr.io","haho.moe","hd44.com","hd44.net","hdbox.ws","hdfull.*","heftig.*","heise.de","hidan.co","hidan.sh","hilaw.vn","hk01.com","hltv.org","howdy.id","hoyme.jp","hpjav.in","hqtv.biz","html.net","huim.com","hulu.com","hydrax.*","hyhd.org","iade.com","ibbs.pro","icelz.to","idnes.cz","imgdew.*","imgsen.*","imgsto.*","imgviu.*","isi7.net","its.porn","j91.asia","janjua.*","jmanga.*","jmmv.dev","jotea.cl","kaido.to","katbay.*","kcra.com","kduk.com","keepv.id","kizi.com","kloo.com","km77.com","kmed.com","kmhd.net","kmnt.com","kpnw.com","ktee.com","ktmx.pro","kukaj.io","kukni.to","kwro.com","l8e8.com","l99j.com","la3c.com","lablue.*","lared.cl","lejdd.fr","levif.be","lin-ks.*","link1s.*","linkos.*","liveon.*","lnk.news","ma-x.org","magesy.*","mail.com","mazpic.*","mcloud.*","mgeko.cc","miro.com","missav.*","mitly.us","mixdrp.*","mixed.de","mkvhub.*","mmsbee.*","moms.com","money.bg","money.pl","movidy.*","movs4u.*","my1ink.*","my4w.com","myad.biz","mycima.*","mzee.com","n.fcd.su","ncaa.com","newdmn.*","nhl66.ir","nick.com","nohat.cc","nola.com","notube.*","ogario.*","orsm.net","oui.sncf","pa1n.xyz","pahe.ink","pasend.*","payt.com","pctnew.*","picks.my","picrok.*","pingit.*","pirate.*","pixlev.*","pluto.tv","plyjam.*","plyvdo.*","pogo.com","pons.com","porn.com","porn0.tv","pornid.*","pornx.to","qa2h.com","quins.us","quoka.de","r2sa.net","racaty.*","radio.at","radio.de","radio.dk","radio.es","radio.fr","radio.it","radio.pl","radio.pt","radio.se","ralli.ee","ranoz.gg","rargb.to","rasoi.me","rdxhd1.*","rintor.*","rootz.so","roshy.tv","saint.to","sanet.lc","sanet.st","sbchip.*","sbflix.*","sbplay.*","sbrulz.*","seeeed.*","senda.pl","seriu.jp","sex3.com","sexvid.*","sflix.fi","shopr.tv","short.pe","shtab.su","shtms.co","shush.se","slant.co","so1.asia","splay.id","sport.de","sport.es","spox.com","sptfy.be","stern.de","stfly.me","strtpe.*","svapo.it","swdw.net","swzz.xyz","sxsw.com","sxyprn.*","t20cup.*","t7meel.*","tasma.ru","tbib.org","tele5.de","thegay.*","thekat.*","thoptv.*","tirexo.*","tmearn.*","tobys.dk","today.it","toggo.de","trakt.tv","trend.at","trrs.pro","tubeon.*","tubidy.*","tv247.us","tvepg.eu","tvn24.pl","tvnet.lv","txst.com","udvl.com","uiil.ink","upapk.io","uproxy.*","uqload.*","urbia.de","uvnc.com","v.qq.com","vanime.*","vapley.*","vedbam.*","vedbom.*","vembed.*","venge.io","vibe.com","vid4up.*","vidlo.us","vidlox.*","vidsrc.*","vidup.to","viki.com","vipbox.*","viper.to","viprow.*","virpe.cc","vlive.tv","voe.sx>>","voici.fr","voxfm.pl","vozer.io","vozer.vn","vtbe.net","vtmgo.be","vtube.to","vumoo.cc","vxxx.com","wat32.tv","watch.ug","wcofun.*","wcvb.com","webbro.*","wepc.com","wetter.*","wfmz.com","wkyc.com","woman.at","work.ink","wowtv.de","wp.solar","wplink.*","wttw.com","ww9g.com","wyze.com","x1337x.*","xcum.com","xh.video","xo7c.com","xvide.me","xxf.mobi","xxr.mobi","xxu.mobi","y2mate.*","yelp.com","yepi.com","youx.xxx","yporn.tv","yt1s.com","yt5s.com","ytapi.cc","ythd.org","z4h4.com","zbporn.*","zdrz.xyz","zee5.com","zooqle.*","zshort.*","0vg9r.com","10.com.au","10short.*","123link.*","123mf9.my","18xxx.xyz","1milf.com","1stream.*","2024tv.ru","26efp.com","2conv.com","2glho.org","2kmovie.*","2ndrun.tv","3dzip.org","3movs.com","49ers.com","4share.vn","4stream.*","4tube.com","51sec.org","5flix.top","5mgz1.com","5movies.*","6jlvu.com","7bit.link","7mm003.cc","7starhd.*","9anime.pe","9hentai.*","9xbuddy.*","9xmovie.*","a-o.ninja","a2zapk.io","aagag.com","abcya.com","acortar.*","adcorto.*","adsfly.in","adshort.*","adurly.cc","aduzz.com","afk.guide","agar.live","ah-me.com","aikatu.jp","airtel.in","alphr.com","ampav.com","andyday.*","anidl.org","anikai.to","animekb.*","animesa.*","anitube.*","aniwave.*","anizm.net","apkmb.com","apkmody.*","apl373.me","apl374.me","apl375.me","appdoze.*","appvn.com","aram.zone","arc018.to","arcai.com","art19.com","artru.net","asd.homes","atlaq.com","atomohd.*","awafim.tv","aylink.co","azel.info","azmen.com","azrom.net","bakai.org","bdlink.pw","beeg.fund","befap.com","bflix.*>>","bhplay.me","bibme.org","bigwarp.*","biqle.com","bitfly.io","bitlk.com","blackd.de","blkom.com","blog24.me","blogk.com","bmovies.*","boerse.de","bolly4u.*","boost.ink","brainly.*","btdig.com","buffed.de","busuu.com","c1z39.com","cambabe.*","cambb.xxx","cambro.io","cambro.tv","camcam.cc","camcaps.*","camhub.cc","canela.tv","canoe.com","ccurl.net","cda-hd.cc","cdn1.site","cdn77.org","cdrab.com","cfake.com","chatta.it","chyoa.com","cinema.de","cinetux.*","cl1ca.com","clamor.pl","cloudy.pk","cmovies.*","colts.com","comunio.*","ctrl.blog","curto.win","cutdl.xyz","cybar.xyz","czxxx.org","d000d.com","d0o0d.com","daddyhd.*","daybuy.tw","debgen.fr","dfast.app","dfiles.eu","dflinks.*","dhd24.com","djmaza.my","djstar.in","djx10.org","dlgal.com","do0od.com","do7go.com","domaha.tv","doods.pro","doooood.*","doply.net","dotflix.*","doviz.com","dropmms.*","dropzy.io","drrtyr.mx","drtuber.*","drzna.com","dumpz.net","dvdplay.*","dx-tv.com","dz4soft.*","eater.com","echoes.gr","efukt.com","eg4link.*","egybest.*","egydead.*","eltern.de","embedme.*","embedy.me","embtaku.*","emovies.*","enorme.tv","entano.jp","eodev.com","erogen.su","erome.com","eroxxx.us","erzar.xyz","europix.*","evaki.fun","evo.co.uk","exego.app","eyalo.com","f16px.com","fap16.net","fapnado.*","faps.club","fapxl.com","faselhd.*","fast-dl.*","fc-lc.com","feet9.com","femina.ch","ffjav.com","fifojik.*","file4go.*","fileq.net","filma24.*","filmex.to","finfang.*","flixhd.cc","flixhq.ru","flixhq.to","flixhub.*","flixtor.*","flvto.biz","fmj.co.uk","fmovies.*","fooak.com","forsal.pl","foundit.*","foxhq.com","freep.com","freewp.io","frembed.*","frprn.com","fshost.me","ftopx.com","ftuapps.*","fuqer.com","furher.in","fx-22.com","gahag.net","gayck.com","gayfor.us","gayxx.net","gdirect.*","ggjav.com","gifhq.com","giize.com","globo.com","glodls.to","gm-db.com","gmanga.me","gofile.to","gojo2.com","gomov.bio","gomoviz.*","goplay.ml","goplay.su","gosemut.*","goshow.tv","gototub.*","goved.org","gowyo.com","goyabu.us","gplinks.*","gsdn.live","gsm1x.xyz","guum5.com","gvnvh.net","hanime.tv","happi.com","haqem.com","hax.co.id","hd-xxx.me","hdfilme.*","hdgay.net","hdhub4u.*","hdrez.com","hdss-to.*","heavy.com","hellnaw.*","hentai.tv","hh3dhay.*","hhesse.de","hianime.*","hideout.*","hitomi.la","hmt6u.com","hoca2.com","hoca6.com","hoerzu.de","hojii.net","hokej.net","hothit.me","hotmovs.*","hugo3c.tw","huyamba.*","hxfile.co","i-bits.io","ibooks.to","icdrama.*","iceporn.*","ico3c.com","idpvn.com","ihow.info","ihub.live","ikaza.net","ilinks.in","imeteo.sk","img4fap.*","imgmaze.*","imgrock.*","imgtown.*","imgur.com","imgview.*","imslp.org","ingame.de","intest.tv","inwepo.co","io.google","iobit.com","iprima.cz","iqiyi.com","ireez.com","isohunt.*","janjua.tv","jappy.com","japscan.*","jasmr.net","javbob.co","javboys.*","javcl.com","javct.net","javdoe.sh","javfor.tv","javfun.me","javhat.tv","javhd.*>>","javmix.tv","javpro.cc","javsub.my","javup.org","javwide.*","jkanime.*","jootc.com","kali.wiki","karwan.tv","katfile.*","keepvid.*","ki24.info","kick4ss.*","kickass.*","kicker.de","kinoger.*","kissjav.*","klmanga.*","koora.vip","krx18.com","kuyhaa.me","kzjou.com","l2db.info","l455o.com","lawyex.co","lecker.de","legia.net","lenkino.*","lesoir.be","linkfly.*","liveru.sx","ljcam.net","lkc21.net","lmtos.com","lnk.parts","loader.fo","loader.to","loawa.com","lodynet.*","lookcam.*","lootup.me","los40.com","m.kuku.lu","m1xdrop.*","m4ufree.*","magma.com","magmix.jp","mamadu.pl","mangaku.*","manhwas.*","maniac.de","mapple.tv","marca.com","mavplay.*","mboost.me","mc-at.org","mcrypto.*","mega4up.*","merkur.de","messen.de","mgnet.xyz","mhn.quest","milfnut.*","miniurl.*","mitele.es","mixdrop.*","mkvcage.*","mkvpapa.*","mlbbox.me","mlive.com","mmo69.com","mobile.de","mod18.com","momzr.com","moontv.to","mov2day.*","mp3clan.*","mp3fy.com","mp3spy.cc","mp3y.info","mrgay.com","mrjav.net","msic.site","multi.xxx","mxcity.mx","myaew.com","mynet.com","mz-web.de","nbabox.co","ncdnstm.*","nekopoi.*","netcine.*","neuna.net","news38.de","nhentai.*","niadd.com","nikke.win","nkiri.com","nknews.jp","notion.so","nowgg.lol","noxx.to>>","nozomi.la","npodoc.nl","nxxn.live","nyaa.land","nydus.org","oatuu.org","obsev.com","ocala.com","ocnpj.com","ofiii.com","ofppt.net","ohmymag.*","ok-th.com","okanime.*","okblaz.me","omavs.com","oosex.net","opjav.com","orunk.com","owlzo.com","oxxfile.*","pahe.plus","palabr.as","palimas.*","pasteit.*","pastes.io","pcwelt.de","pelis28.*","pepar.net","pferde.de","phodoi.vn","phois.pro","picrew.me","pixhost.*","pkembed.*","player.pl","plylive.*","pogga.org","popjav.in","poqzn.xyz","porn720.*","porner.tv","pornfay.*","pornhat.*","pornhub.*","pornj.com","pornlib.*","porno18.*","pornuj.cz","powvdeo.*","premio.io","profil.at","psarips.*","pugam.com","pussy.org","pynck.com","q1003.com","qcheng.cc","qcock.com","qlinks.eu","qoshe.com","quizz.biz","radio.net","rarbg.how","readm.org","redd.tube","redisex.*","redtube.*","redwap.me","remaxhd.*","rentry.co","rexporn.*","rexxx.org","rezst.xyz","rezsx.xyz","rfiql.com","riveh.com","rjno1.com","rock.porn","rokni.xyz","rooter.gg","rphost.in","rshrt.com","ruhr24.de","rytmp3.io","s2dfree.*","saint2.cr","samfw.com","satdl.com","sbnmp.bar","sbplay2.*","sbplay3.*","sbsun.com","scat.gold","seazon.fr","seelen.io","seexh.com","series9.*","seulink.*","sexmv.com","sexsq.com","sextb.*>>","sezia.com","sflix.pro","shape.com","shlly.com","shmapp.ca","shorten.*","shrdsk.me","shrib.com","shrink.yt","shrinke.*","shrtfly.*","skardu.pk","skpb.live","skysetx.*","slate.com","slink.bid","smutr.com","son.co.za","songspk.*","spcdn.xyz","sport1.de","sssam.com","ssstik.io","staige.tv","strms.net","strmup.cc","strmup.to","strmup.ws","strtape.*","study.com","sulasok.*","swame.com","swgop.com","syosetu.*","sythe.org","szene1.at","talaba.su","tamilmv.*","taming.io","tatli.biz","tech5s.co","teensex.*","terabox.*","tfly.link","tgo-tv.co","themw.com","thgss.com","thothd.to","thothub.*","tinhte.vn","tnp98.xyz","to.com.pl","today.com","todaypk.*","tojav.net","topflix.*","topjav.tv","torlock.*","tpaste.io","tpayr.xyz","tpz6t.com","trutv.com","tryzt.xyz","tubev.sex","tubexo.tv","tukoz.com","turbo1.co","tvguia.es","tvinfo.de","tvlogy.to","tvporn.cc","txori.com","txxx.asia","ucptt.com","udebut.jp","ufacw.com","uflash.tv","ujszo.com","ulsex.net","unicum.de","upbam.org","upfiles.*","upiapi.in","uplod.net","uporn.icu","upornia.*","uppit.com","uproxy2.*","upxin.net","upzone.cc","uqozy.com","urlcero.*","ustream.*","uxjvp.pro","v1kkm.com","vdtgr.com","vebo1.com","veedi.com","vg247.com","vid2faf.*","vidara.so","vidara.to","vidbm.com","vide0.net","videobb.*","vidfast.*","vidmoly.*","vidplay.*","vidsrc.cc","vidzy.org","vienna.at","vinaurl.*","vinovo.to","vip1s.top","vipurl.in","vivuq.com","vladan.fr","vnuki.net","voodc.com","vplink.in","vtlinks.*","vttpi.com","vvid30c.*","vvvvid.it","w3cub.com","waezg.xyz","waezm.xyz","webtor.io","wecast.to","weebee.me","wetter.de","wildwap.*","winporn.*","wiour.com","wired.com","woiden.id","world4.eu","wpteq.org","wvt24.top","x-tg.tube","x24.video","xbaaz.com","xbabe.com","xcafe.com","xcity.org","xcoic.com","xcums.com","xecce.com","xexle.com","xhand.com","xhbig.com","xmovies.*","xpaja.net","xtapes.me","xvideos.*","xvipp.com","xxx24.vip","xxxhub.cc","xxxxxx.hu","y2down.cc","yeptube.*","yeshd.net","ygosu.com","yjiur.xyz","ymovies.*","youku.com","younetu.*","youporn.*","yt2mp3s.*","ytmp3s.nu","ytpng.net","ytsaver.*","yu2be.com","zataz.com","zdnet.com","zedge.net","zefoy.com","zhihu.com","zjet7.com","zojav.com","zovo2.top","zrozz.com","0gogle.com","0gomovie.*","10starhd.*","123anime.*","123chill.*","13tv.co.il","141jav.com","18tube.sex","1apple.xyz","1bit.space","1kmovies.*","1link.club","1stream.eu","1tamilmv.*","1todaypk.*","1xanime.in","2best.club","2the.space","2umovies.*","3dzip.info","3fnews.com","3hiidude.*","3kmovies.*","3xyaoi.com","4-liga.com","4kporn.xxx","4porn4.com","4tests.com","4tube.live","5ggyan.com","5xmovies.*","720pflix.*","8boobs.com","8muses.xxx","8xmovies.*","91porn.com","96ar.com>>","9908ww.com","9anime.vip","9animes.ru","9kmovies.*","9monate.de","9xmovies.*","9xupload.*","a1movies.*","acefile.co","acortalo.*","adshnk.com","adslink.pw","aeonax.com","aether.mom","afdah2.com","akmcloud.*","all3do.com","allfeeds.*","alphatv.gr","ameede.com","amindi.org","anchira.to","andani.net","anime4up.*","animedb.in","animeflv.*","animeid.tv","animekai.*","animesup.*","animetak.*","animez.org","anitube.us","aniwatch.*","aniwave.uk","anodee.com","anon-v.com","anroll.net","ansuko.net","antenne.de","anysex.com","apkhex.com","apkmaven.*","apkmody.io","arabseed.*","archive.fo","archive.is","archive.li","archive.md","archive.ph","archive.vn","arcjav.com","areadvd.de","aruble.net","ashrfd.xyz","ashrff.xyz","asiansex.*","asiaon.top","asmroger.*","ate9ni.com","atishmkv.*","atomixhq.*","atomtt.com","av01.media","avjosa.com","avtub.cx>>","awpd24.com","axporn.com","ayuka.link","aznude.com","babeporn.*","baikin.net","bakotv.com","bandle.app","bang14.com","bayimg.com","bblink.com","bbw.com.es","bdokan.com","bdsmx.tube","bdupload.*","beatree.cn","beeg.party","beeimg.com","bembed.net","bestcam.tv","bf0skv.org","bigten.org","bildirim.*","bloooog.it","bluetv.xyz","bnnvara.nl","boards.net","boombj.com","borwap.xxx","bos21.site","boyfuck.me","brian70.tw","brides.com","brillen.de","brmovies.*","brstej.com","btvplus.bg","byrdie.com","bztube.com","calvyn.com","camflow.tv","camfox.com","camhoes.tv","camseek.tv","canada.com","capital.de","cashkar.in","cavallo.de","cboard.net","cdn256.xyz","ceesty.com","cekip.site","cerdas.com","cgtips.org","chiefs.com","ciberdvd.*","cimanow.cc","cityam.com","citynow.it","ckxsfm.com","cluset.com","codare.fun","code.world","cola16.app","colearn.id","comtasq.ca","connect.de","cookni.net","cpscan.xyz","creatur.io","cricfree.*","cricfy.net","crictime.*","crohasit.*","csrevo.com","cuatro.com","cubshq.com","cuckold.it","cuevana.is","cuevana3.*","cutnet.net","cwseed.com","d0000d.com","ddownr.com","deezer.com","demooh.com","depedlps.*","desiflix.*","desimms.co","desired.de","destyy.com","dev2qa.com","dfbplay.tv","diaobe.net","disqus.com","djamix.net","djxmaza.in","dloady.com","dnevnik.hr","do-xxx.com","dogecoin.*","dojing.net","domahi.net","donk69.com","doodle.com","dopebox.to","dorkly.com","downev.com","dpstream.*","drivebot.*","driveup.in","driving.ca","drphil.com","dshytb.com","dsmusic.in","dtmaga.com","du-link.in","dvm360.com","dz4up1.com","earncash.*","earnload.*","easysky.in","ebc.com.br","ebony8.com","ebookmed.*","ebuxxx.net","edmdls.com","egyup.live","elmundo.es","embed.casa","embedv.net","emsnow.com","emurom.net","epainfo.pl","eplayvid.*","eplsite.uk","erofus.com","erotom.com","eroxia.com","evileaks.*","evojav.pro","ewybory.eu","exeygo.com","exnion.com","express.de","f1livegp.*","f1stream.*","f2movies.*","fabmx1.com","fakaza.com","fake-it.ws","falpus.com","familie.de","fandom.com","fapcat.com","fapdig.com","fapeza.com","fapset.com","faqwiki.us","fastly.net","fautsy.com","fboxtv.com","fbstream.*","festyy.com","ffmovies.*","fhedits.in","fikfak.net","fikiri.net","fikper.com","filedown.*","filemoon.*","fileone.tv","filesq.net","film1k.com","film4e.com","filmi7.net","filmovi.ws","filmweb.pl","filmyfly.*","filmygod.*","filmyhit.*","filmypur.*","filmywap.*","finanzen.*","finclub.in","fitbook.de","flickr.com","flixbaba.*","flixhub.co","flybid.net","fmembed.cc","forgee.xyz","formel1.de","foxnxx.com","freeload.*","freenet.de","freevpn.us","friars.com","frogogo.ru","fsplayer.*","fstore.biz","fuckdy.com","fullreal.*","fulltube.*","fullxh.com","funzen.net","funztv.com","fuxnxx.com","fxporn69.*","fzmovies.*","gadgets.es","game5s.com","gamenv.net","gamepro.de","gatcha.org","gawbne.com","gaydam.net","gcloud.cfd","gdfile.org","gdmax.site","gdplayer.*","gestyy.com","giants.com","gifans.com","giff.cloud","gigaho.com","givee.club","gkbooks.in","gkgsca.com","gleaks.pro","gledaitv.*","gmenhq.com","gnomio.com","go.tlc.com","gocast.pro","gochyu.com","goduke.com","goeags.com","goegoe.net","gofilmes.*","goflix.sbs","gogodl.com","gogoplay.*","gogriz.com","gomovies.*","google.com","gopack.com","gostream.*","goutsa.com","gozags.com","gozips.com","gplinks.co","grasta.net","gtaall.com","gunauc.net","haddoz.net","hamburg.de","hamzag.com","hanauer.de","hanime.xxx","hardsex.cc","harley.top","hartico.tv","haustec.de","haxina.com","hcbdsm.com","hclips.com","hd-tch.com","hdfriday.*","hdporn.net","hdtoday.cc","hdtoday.tv","hdzone.org","health.com","hechos.net","hentaihd.*","hentaisd.*","hextank.io","hhkungfu.*","hianime.to","himovies.*","hitprn.com","hivelr.com","hl-live.de","hoca4u.com","hoca4u.xyz","hostxy.com","hotmasti.*","hotovs.com","house.porn","how2pc.com","howifx.com","hqbang.com","huavod.com","huavod.net","huavod.top","hub2tv.com","hubcdn.vip","hubdrive.*","huoqwk.com","hydracdn.*","icegame.ro","iceporn.tv","idevice.me","idlixvip.*","igay69.com","illink.net","ilmeteo.it","imag-r.com","imgair.net","imgbox.com","imgbqb.sbs","imginn.com","imgmgf.sbs","imgpke.sbs","imguee.sbs","indeed.com","indobo.com","inertz.org","infulo.com","ingles.com","ipamod.com","iplark.com","ironysub.*","isgfrm.com","issuya.com","itdmusic.*","iumkit.net","iusm.co.kr","iwcp.co.uk","jakondo.ru","japgay.com","japscan.ws","jav-fun.cc","jav-xx.com","jav.direct","jav247.top","jav380.com","javbee.vip","javbix.com","javboys.tv","javbull.tv","javdo.cc>>","javembed.*","javfan.one","javfav.com","javfc2.xyz","javgay.com","javhdz.*>>","javhub.net","javhun.com","javlab.net","javmix.app","javmvp.com","javneon.tv","javnew.net","javopen.co","javpan.net","javpas.com","javplay.me","javqis.com","javrip.net","javroi.com","javseen.tv","javsek.net","jnews5.com","jobsbd.xyz","joktop.com","joolinks.*","josemo.com","jpgames.de","jpvhub.com","jrlinks.in","jytechs.in","kaliscan.*","kamelle.de","kaotic.com","kaplog.com","katlinks.*","kedoam.com","keepvid.pw","kejoam.com","kelaam.com","kendam.com","kenzato.uk","kerapoxy.*","keroseed.*","key-hub.eu","kiaclub.cz","kickass2.*","kickasst.*","kickassz.*","king-pes.*","kinobox.cz","kinoger.re","kinoger.ru","kinoger.to","kjmx.rocks","kkickass.*","klooam.com","klyker.com","kochbar.de","kompas.com","kompiko.pl","kotaku.com","kropic.com","kvador.com","kxbxfm.com","l1afav.net","labgame.io","lacrima.jp","larazon.es","leeapk.com","leechall.*","leet365.cc","leolist.cc","lewd.ninja","lglbmm.com","lidovky.cz","likecs.com","line25.com","link1s.com","linkbin.me","linkpoi.me","linkshub.*","linkskat.*","linksly.co","linkspy.cc","linkz.wiki","liquor.com","listatv.pl","live7v.com","livehere.*","livetvon.*","lollty.pro","lookism.me","lootdest.*","lopers.com","love4u.net","loveroms.*","lumens.com","lustich.de","lxmanga.my","m2list.com","macwelt.de","magnetdl.*","mahfda.com","mandai.com","mangago.me","mangaraw.*","mangceh.cc","manwan.xyz","mascac.org","mat6tube.*","mathdf.com","maths.news","maxicast.*","medibok.se","megadb.net","megadede.*","megaflix.*","megafly.in","megalink.*","megaup.net","megaurl.in","megaxh.com","meltol.net","meong.club","merinfo.se","mhdtvmax.*","milfzr.com","mitaku.net","mixdroop.*","mlbb.space","mma-core.*","mmnm.store","mmopeon.ru","mmtv01.xyz","molotov.tv","mongri.net","motchill.*","movibd.com","movie123.*","movie4me.*","moviegan.*","moviehdf.*","moviemad.*","movies07.*","movies2k.*","movies4u.*","movies7.to","moviflex.*","movix.blog","mozkra.com","mp3cut.net","mp3guild.*","mp3juice.*","mreader.co","mrpiracy.*","mtlurb.com","mult34.com","multics.eu","multiup.eu","multiup.io","musichq.cc","my-subs.co","mydaddy.cc","myjest.com","mykhel.com","mylust.com","myplexi.fr","myqqjd.com","myvideo.ge","myviid.com","naasongs.*","nackte.com","naijal.com","nakiny.com","namasce.pl","namemc.com","nbabite.to","nbaup.live","ncdnx3.xyz","negumo.com","neonmag.fr","neoteo.com","neowin.net","netfree.cc","newhome.de","newpelis.*","news18.com","newser.com","nexdrive.*","nflbite.to","ngelag.com","ngomek.com","ngomik.net","nhentai.io","nickles.de","niyaniya.*","nmovies.cc","noanyi.com","nocfsb.com","nohost.one","nosteam.ro","note1s.com","notube.com","novinky.cz","noz-cdn.de","nsfw247.to","nswrom.com","ntucgm.com","nudes7.com","nullpk.com","nuroflix.*","nxbrew.net","nxprime.in","nypost.com","odporn.com","odtmag.com","ofwork.net","ohorse.com","ohueli.net","okleak.com","okmusi.com","okteve.com","onehack.us","oneotv.com","onepace.co","onepunch.*","onezoo.net","onloop.pro","onmovies.*","onvista.de","openload.*","oploverz.*","origami.me","orirom.com","otomoto.pl","owsafe.com","paminy.com","papafoot.*","parade.com","parents.at","pbabes.com","pc-guru.it","pcbeta.com","pcgames.de","pctfenix.*","pcworld.es","pdfaid.com","peetube.cc","people.com","petbook.de","phc.web.id","phim85.com","picmsh.sbs","pictoa.com","pilsner.nu","pingit.com","pirlotv.mx","pitube.net","pixelio.de","pixvid.org","plaion.com","planhub.ca","playboy.de","playfa.com","playgo1.cc","plc247.com","plejada.pl","poapan.xyz","pondit.xyz","poophq.com","popcdn.day","poplinks.*","poranny.pl","porn00.org","porndr.com","pornfd.com","porngo.com","porngq.com","pornhd.com","pornhd8k.*","pornky.com","porntb.com","porntn.com","pornve.com","pornwex.tv","pornx.tube","pornxp.com","pornxp.org","pornxs.com","pouvideo.*","povvideo.*","povvldeo.*","povw1deo.*","povwideo.*","powder.com","powlideo.*","powv1deo.*","powvibeo.*","powvideo.*","powvldeo.*","premid.app","progfu.com","prosongs.*","proxybit.*","proxytpb.*","prydwen.gg","psychic.de","pudelek.pl","puhutv.com","putlog.net","qqxnxx.com","qrixpe.com","qthang.net","quicomo.it","radio.zone","raenonx.cc","rakuten.tv","ranker.com","rawinu.com","rawlazy.si","realgm.com","rebahin.pw","redfea.com","redgay.net","reeell.com","regio7.cat","rencah.com","reshare.pm","rgeyyddl.*","rgmovies.*","riazor.org","rlxoff.com","rmdown.com","roblox.com","rodude.com","romsget.io","ronorp.net","roshy.tv>>","rsrlink.in","rule34.art","rule34.xxx","rule34.xyz","rule34ai.*","rumahit.id","s1p1cd.com","s2dfree.to","s3taku.com","sakpot.com","samash.com","savego.org","sawwiz.com","sbrity.com","sbs.com.au","scribd.com","sctoon.net","scubidu.eu","seeflix.to","serien.cam","seriesly.*","sevenst.us","sexato.com","sexjobs.es","sexkbj.com","sexlist.tv","sexodi.com","sexpin.net","sexpox.com","sexrura.pl","sextor.org","sextvx.com","sfile.mobi","shahid4u.*","shinden.pl","shineads.*","shlink.net","sholah.net","shophq.com","shorttey.*","shortx.net","shortzzy.*","showflix.*","shrink.icu","shrinkme.*","shrt10.com","sibtok.com","sikwap.xyz","silive.com","simpcity.*","skmedix.pl","smoner.com","smsget.net","snbc13.com","snopes.com","snowmtl.ru","soap2day.*","socebd.com","sokobj.com","solewe.com","sourds.net","soy502.com","spiegel.de","spielen.de","sportal.de","sportbar.*","sports24.*","srvy.ninja","ssdtop.com","sshkit.com","ssyou.tube","stardima.*","stemplay.*","stiletv.it","stpm.co.uk","strcloud.*","streamsb.*","streamta.*","strefa.biz","suaurl.com","sunhope.it","surfer.com","szene38.de","tapetus.pl","target.com","taxi69.com","tcpvpn.com","tech8s.net","techhx.com","telerium.*","texte.work","th-cam.com","thatav.net","theacc.com","thecut.com","thedaddy.*","theproxy.*","thevidhd.*","thosa.info","thothd.com","thripy.com","tickzoo.tv","tiscali.it","tktube.com","tokuvn.com","tokuzl.net","toorco.com","topito.com","toppng.com","torlock2.*","torrent9.*","tranny.one","trust.zone","trzpro.com","tsubasa.im","tsz.com.np","tubesex.me","tubous.com","tubsexer.*","tubtic.com","tugaflix.*","tulink.org","tumblr.com","tunein.com","turbovid.*","tutelehd.*","tutsnode.*","tutwuri.id","tuxnews.it","tv0800.com","tvline.com","tvnz.co.nz","tvtoday.de","twatis.com","uctnew.com","uindex.org","uiporn.com","unito.life","uol.com.br","up-load.io","upbaam.com","updato.com","updown.cam","updown.fun","updown.icu","upfion.com","upicsz.com","uplinkto.*","uploadev.*","uploady.io","uporno.xxx","uprafa.com","ups2up.fun","upskirt.tv","uptobhai.*","uptomega.*","urlpay.net","usagoals.*","userload.*","usgate.xyz","usnews.com","ustimz.com","ustream.to","utreon.com","uupbom.com","vadbam.com","vadbam.net","vadbom.com","vbnmll.com","vcloud.lol","vdbtm.shop","vecloud.eu","veganab.co","veplay.top","vevioz.com","vgames.fun","vgmlinks.*","vidapi.xyz","vidbam.org","vidcloud.*","vidcorn.to","vidembed.*","videyx.cam","videzz.net","vidlii.com","vidnest.io","vidohd.com","vidomo.xyz","vidoza.net","vidply.com","viduro.top","viduyy.com","viewfr.com","vinomo.xyz","vipboxtv.*","vipotv.com","vipstand.*","vivatube.*","vizcloud.*","vortez.net","vrporn.com","vsembed.su","vstream.id","vvide0.com","vvtlinks.*","wapkiz.com","warps.club","watch32.sx","watch4hd.*","watcho.com","watchug.to","watchx.top","wawacity.*","weather.us","web1s.asia","webcafe.bg","weloma.art","weshare.is","weszlo.com","wetter.com","wetter3.de","wikwiki.cv","wintub.com","woiden.com","wooflix.tv","worder.cat","woxikon.de","wpgh53.com","ww9g.com>>","www.cc.com","x-x-x.tube","xanimu.com","xasiat.com","xberuang.*","xhamster.*","xhopen.com","xhspot.com","xhtree.com","xhvid1.com","xiaopan.co","xmorex.com","xmovie.pro","xmovies8.*","xnxx.party","xpicse.com","xprime4u.*","xrares.com","xsober.com","xspiel.com","xsz-av.com","xszav.club","xvideis.cc","xxgasm.com","xxmovz.com","xxxdan.com","xxxfiles.*","xxxmax.net","xxxrip.net","xxxsex.pro","xxxtik.com","xxxtor.com","xxxxsx.com","y-porn.com","y2mate.com","y2tube.pro","ymknow.xyz","yomovies.*","youapk.net","youmath.it","youpit.xyz","youwatch.*","yseries.tv","ytanime.tv","ytboob.com","ytjar.info","ytmp4.live","yts-subs.*","yumacs.com","yuppow.com","yuvutu.com","yy1024.net","z12z0vla.*","zeefiles.*","zilinak.sk","zillow.com","zoechip.cc","zoechip.gg","zpaste.net","zthots.com","0123movie.*","0gomovies.*","0rechner.de","10alert.com","111watcho.*","11xmovies.*","123animes.*","123movies.*","12thman.com","141tube.com","173.249.8.3","17track.net","18comic.vip","1movieshd.*","1moviesz.to","1xanimes.in","2gomovies.*","2rdroid.com","3bmeteo.com","3dyasan.com","3hentai.net","3ixcf45.cfd","3xfaktor.hu","423down.com","4funbox.com","4gousya.net","4players.de","4shared.com","4spaces.org","4tymode.win","5j386s9.sbs","69games.xxx","76078rb.sbs","7review.com","7starmv.com","80-talet.se","8tracks.com","9animetv.to","9goals.live","9jarock.org","a-hentai.tv","aagmaal.com","abs-cbn.com","abstream.to","ad-doge.com","ad4msan.com","adictox.com","adisann.com","adshrink.it","afilmywap.*","africue.com","afrodity.sk","ahmedmode.*","aiailah.com","aipebel.com","akirabox.to","allkpop.com","almofed.com","almursi.com","altcryp.com","alttyab.net","analdin.com","anavidz.com","andiim3.com","anibatch.me","anichin.top","anigogo.net","animahd.com","anime-i.com","anime3d.xyz","animeblix.*","animebr.org","animecix.tv","animehay.tv","animehub.ac","animepahe.*","animesex.me","anisaga.org","anitube.vip","aniworld.to","anomize.xyz","anonymz.com","anqkdhcm.nl","anxcinema.*","anyporn.com","anysex.club","aofsoru.com","aosmark.com","apekite.com","apkdink.com","apkhihe.com","apkshrt.com","apksvip.com","aplus.my.id","app.plex.tv","apritos.com","aquipelis.*","arabstd.com","arabxnx.com","arbweb.info","area51.porn","arenabg.com","arkadmin.fr","artnews.com","asia2tv.com","asianal.xyz","asianclub.*","asiangay.tv","asianload.*","asianplay.*","ask4movie.*","asmr18.fans","asmwall.com","asumesi.com","ausfile.com","auszeit.bio","autobild.de","autokult.pl","automoto.it","autopixx.de","autoroad.cz","autosport.*","avcesar.com","avitter.net","axomtube.in","ayatoon.com","azmath.info","azmovies.to","b2bhint.com","b4ucast.com","babaktv.com","babeswp.com","babyclub.de","badjojo.com","badtaste.it","barfuck.com","batman.city","bbwfest.com","bcmanga.com","bdcraft.net","bdmusic23.*","bdmusic28.*","bdsmporn.cc","beelink.pro","beinmatch.*","bengals.com","berich8.com","berklee.edu","bfclive.com","bg-gledai.*","bi-girl.net","bigconv.com","bigojav.com","bigshare.io","bigwank.com","bikemag.com","bitco.world","bitlinks.pw","bitzite.com","blog4nx.com","blogue.tech","blu-ray.com","blurayufr.*","bokepxv.com","bolighub.dk","bollyflix.*","book18.fans","bootdey.com","botrix.live","bowfile.com","boxporn.net","braflix.win","brbeast.com","brbushare.*","brigitte.de","bristan.com","browser.lol","bsierad.com","btcbitco.in","btvsport.bg","btvsports.*","buondua.com","buzzfeed.at","buzzfeed.de","buzzpit.net","bx-zone.com","bypass.city","bypass.link","cafenau.com","camclips.tv","camel3.live","camsclips.*","camslib.com","camwhores.*","canaltdt.es","carbuzz.com","ccyig2ub.nl","ch-play.com","chatgbt.one","chatgpt.com","chefkoch.de","chicoer.com","chochox.com","cima-club.*","cinecloud.*","cinefreak.*","civitai.com","civitai.red","claimrbx.gg","clapway.com","clkmein.com","cloubix.com","cloudfam.io","club386.com","cocorip.net","coldfrm.org","collater.al","colnect.com","comicxxx.eu","commands.gg","comnuan.com","comohoy.com","converto.io","coomer1.net","corneey.com","corriere.it","cpmlink.net","cpmlink.pro","crackle.com","crazydl.net","crdroid.net","crvsport.ru","csurams.com","cubuffs.com","cuevana.pro","cupra.forum","cut-fly.com","cutearn.net","cutlink.net","cutpaid.com","cutyion.com","daddyhd.*>>","daddylive.*","daftsex.biz","daftsex.net","daftsex.org","daij1n.info","dailyweb.pl","damitv.live","daozoid.com","dawenet.com","ddlvalley.*","decrypt.day","deltabit.co","devotag.com","dexerto.com","digit77.com","digitask.ru","direct-dl.*","discord.com","disheye.com","diudemy.com","divxtotal.*","dj-figo.com","djqunjab.in","dlpanda.com","dlstreams.*","dma-upd.org","dogdrip.net","donlego.com","dotycat.com","doumura.com","douploads.*","downsub.com","dozarte.com","dramacool.*","dramamate.*","dramanice.*","drawize.com","droplink.co","ds2play.com","dsharer.com","dstat.space","dsvplay.com","duboku.info","dudefilms.*","dz4link.com","e-glossa.it","e2link.link","earnbee.xyz","earnhub.net","easy-coin.*","easybib.com","ebookdz.com","echiman.com","echodnia.eu","ecomento.de","edjerba.com","eductin.com","einthusan.*","elahmad.com","embasic.pro","embedmoon.*","embedpk.net","embedtv.net","empflix.com","emuenzen.de","enagato.com","eoreuni.com","eporner.com","eroasmr.com","erothots.co","erowall.com","esgeeks.com","eshentai.tv","eskarock.pl","eslfast.com","europixhd.*","everand.com","everia.club","everyeye.it","exalink.fun","exeking.top","ezmanga.net","f51rm.com>>","fapdrop.com","fapguru.com","faptube.com","farescd.com","fastdokan.*","fastream.to","fastssh.com","fbstreams.*","fchopin.net","fdvzg.world","fembedx.top","feyorra.top","fffmovies.*","figtube.com","file-me.top","file-up.org","file4go.com","file4go.net","filecloud.*","filecrypt.*","filelions.*","filemooon.*","filepress.*","fileq.games","filesamba.*","filmcdn.top","filmisub.cc","films5k.com","filmy-hit.*","filmy4web.*","filmydown.*","filmygod6.*","findjav.com","firefile.cc","fit4art.com","flixrave.me","flixsix.com","flixzone.co","fluentu.com","fluvore.com","fmovies0.cc","fmoviesto.*","folkmord.se","foodxor.com","footybite.*","forumdz.com","foumovies.*","foxtube.com","freenem.com","freepik.com","frpgods.com","fseries.org","fsx.monster","ftuapps.dev","fuckfuq.com","futemax.zip","g-porno.com","gal-dem.com","gamcore.com","game-2u.com","game3rb.com","gameblog.in","gameblog.jp","gamehub.cam","gamelab.com","gamer18.net","gamestar.de","gameswelt.*","gametop.com","gamewith.jp","gamezone.de","gamezop.com","garaveli.de","gaytail.com","gayvideo.me","gazzetta.gr","gazzetta.it","gcloud.live","gedichte.ws","genialne.pl","get-to.link","getmega.net","getthit.com","gevestor.de","gezondnu.nl","ggbases.com","girlmms.com","girlshd.xxx","gisarea.com","gitizle.vip","gizmodo.com","globetv.app","go.fakta.id","go.zovo.ink","goalup.live","gobison.com","gocards.com","gocast2.com","godeacs.com","godmods.com","godtube.com","goducks.com","gofilms4u.*","gofrogs.com","gogifox.com","gogoanime.*","goheels.com","gojacks.com","gokerja.net","gold-24.net","golobos.com","gomovies.pk","gomoviesc.*","goodporn.to","gooplay.net","gorating.in","gosexy.mobi","gostyn24.pl","goto.com.np","gotocam.net","gotporn.com","govexec.com","grafikos.cz","gsmware.com","guhoyas.com","gulf-up.com","gupload.xyz","h-flash.com","haaretz.com","hagalil.com","hagerty.com","hardgif.com","hartziv.org","haxmaps.com","haxnode.net","hblinks.pro","hdbraze.com","hdeuropix.*","hdmotori.it","hdonline.co","hdpicsx.com","hdpornt.com","hdtodayz.to","hdtube.porn","helmiau.com","hentai20.io","hentaila.tv","herexxx.com","herzporno.*","hes-goals.*","hexload.com","hhdmovies.*","himovies.sx","hindi.trade","hiphopa.net","history.com","hitokin.net","hmanga.asia","holavid.com","hoofoot.net","hoporno.net","hornpot.net","hornyfap.tv","hotabis.com","hotbabes.tv","hotcars.com","hotfm.audio","hotgirl.biz","hotleak.vip","hotleaks.tv","hotscope.tv","hotscopes.*","hotshag.com","hotstar.com","huaren.live","hubdrive.de","hubison.com","hubstream.*","hubzter.com","hungama.com","hurawatch.*","huskers.com","huurshe.com","hwreload.it","hygiena.com","hypesol.com","icgaels.com","idlixku.com","iegybest.co","iframejav.*","iggtech.com","iimanga.com","iklandb.com","imageweb.ws","imgbvdf.sbs","imgjjtr.sbs","imgnngr.sbs","imgoebn.sbs","imgoutlet.*","imgtaxi.com","imgyhq.shop","impact24.us","in91vip.win","infocorp.io","infokik.com","inkapelis.*","instyle.com","inverse.com","ipa-apps.me","iporntv.net","iptvbin.com","isaimini.ca","isosite.org","ispunlock.*","itpro.co.uk","itudong.com","iv-soft.com","j-pussy.com","jaguars.com","jaiefra.com","japanfuck.*","japanporn.*","japansex.me","japscan.lol","javbake.com","javball.com","javbest.xyz","javbobo.com","javboys.com","javcock.com","javdoge.com","javfull.net","javgrab.com","javhoho.com","javideo.net","javlion.xyz","javmenu.com","javmeta.com","javmilf.xyz","javpool.com","javsex.guru","javstor.com","javx357.com","javynow.com","jcutrer.com","jeep-cj.com","jetanimes.*","jetpunk.com","jezebel.com","jkanime.net","jnovels.com","jobsibe.com","jocooks.com","jotapov.com","jpg.fishing","jra.jpn.org","jungyun.net","jxoplay.xyz","karanpc.com","kashtanka.*","kb.arlo.com","khohieu.com","kiaporn.com","kickassgo.*","kiemlua.com","kimoitv.com","kinoking.cc","kissanime.*","kissasia.cc","kissasian.*","kisscos.net","kissmanga.*","kjanime.net","klettern.de","kmansin09.*","kochamjp.pl","kodaika.com","kolyoom.com","komikcast.*","kompoz2.com","kpkuang.org","kppk983.com","ksuowls.com","l23movies.*","l2crypt.com","labstory.in","laposte.net","lapresse.ca","lastampa.it","latimes.com","latitude.to","lbprate.com","leaknud.com","letest25.co","letras2.com","lewdweb.net","lewebde.com","lfpress.com","lgcnews.com","lgwebos.com","libertyvf.*","lifeline.de","liflix.site","ligaset.com","likemag.com","linclik.com","link-to.net","linkmake.in","linkrex.net","links-url.*","linksfire.*","linkshere.*","linksmore.*","lite-link.*","loanpapa.in","lokalo24.de","lookimg.com","lookmovie.*","losmovies.*","losporn.org","lostineu.eu","lovefap.com","lrncook.xyz","lscomic.com","luluvdo.com","luluvid.com","luxmovies.*","m.akkxs.net","m.iqiyi.com","m1xdrop.com","m1xdrop.net","m4maths.com","made-by.org","madoohd.com","madouqu.com","magesy.blog","magesypro.*","mamastar.jp","manga1000.*","manga1001.*","mangahub.io","mangasail.*","mangatv.net","mangayy.org","manhwa18.cc","maths.media","mature4.net","mavanimes.*","mavavid.com","maxstream.*","mcdlpit.com","mchacks.net","mcloud.guru","mcxlive.org","medisite.fr","mega1080p.*","megafile.io","megavideo.*","mein-mmo.de","melodelaa.*","mephimtv.cc","mercari.com","messitv.net","messitv.org","metavise.in","mgoblue.com","mhdsports.*","mhscans.com","miklpro.com","mirrorace.*","mirrored.to","mlbstream.*","mmfenix.com","mmsmaza.com","mobifuq.com","moenime.com","momomesh.tv","momondo.com","momvids.com","moonembed.*","moonmov.pro","motohigh.pl","motphimr.io","moviebaaz.*","movied.link","movieku.ink","movieon21.*","movieplay.*","movieruls.*","movierulz.*","movies123.*","movies4me.*","movies4u3.*","moviesda4.*","moviesden.*","movieshub.*","moviesjoy.*","moviesmod.*","moviesmon.*","moviesub.is","moviesx.org","moviewr.com","moviezwap.*","movizland.*","mp3-now.com","mp3juices.*","mp3yeni.org","mp4moviez.*","mpo-mag.com","mr9soft.com","mrexcel.com","mrunblock.*","mtb-news.de","mtlblog.com","muchfap.com","multiup.org","muthead.com","muztext.com","mycloudz.cc","myflixer.bz","myflixerz.*","mygalls.com","mymp3song.*","mytoolz.net","myunity.dev","myvalley.it","myvidmate.*","myxclip.com","narcity.com","nbabox.co>>","nbastream.*","nbch.com.ar","nbcnews.com","needbux.com","needrom.com","nekopoi.*>>","nelomanga.*","nemenlake.*","netfapx.com","netflix.com","netfuck.net","netplayz.ru","netxwatch.*","netzwelt.de","newscon.org","newsmax.com","nextgov.com","nflbite.com","nflstream.*","nhentai.net","nhlstream.*","nicekkk.com","nichapk.com","nimegami.id","nkreport.jp","notandor.cn","novelism.jp","novohot.com","novojoy.com","nowiny24.pl","nowmovies.*","nrj-play.fr","nsfwr34.com","nudevista.*","nulakers.ca","nunflix.org","nyahentai.*","nysainfo.pl","odiasia.sbs","ofilmywap.*","ogomovies.*","ohentai.org","ohmymag.com","okstate.com","olamovies.*","olarila.com","omuzaani.me","onhockey.tv","onifile.com","onneddy.com","ontools.net","onworks.net","optimum.net","ortograf.pl","osxinfo.net","otakudesu.*","otakuindo.*","outletpic.*","overgal.com","overtake.gg","ovester.com","oxanime.com","p2pplay.pro","packers.com","pagesix.com","paketmu.com","pantube.top","papahd.club","papalah.com","paradisi.de","parents.com","parispi.net","pasokau.com","payskip.org","pcbolsa.com","pcgamer.com","pdfdrive.to","pdfsite.net","pelisplus.*","peppe8o.com","perelki.net","pesktop.com","pewgame.com","pezporn.com","phim1080.in","pianmanga.*","picbqqa.sbs","picnft.shop","picngt.shop","picuenr.sbs","pilot.wp.pl","pinkporno.*","pinterest.*","piratebay.*","pistona.xyz","pitiurl.com","pixjnwe.sbs","pixsera.net","pksmovies.*","pkspeed.net","play.tv3.ee","play.tv3.lt","play.tv3.lv","playrust.io","playtamil.*","playtube.tv","plus.rtl.de","pngitem.com","pngreal.com","pogolinks.*","pokopow.com","polygon.com","pomorska.pl","porcore.com","porn3dx.com","porn77.info","porn78.info","porndaa.com","porndex.com","porndig.com","porndoe.com","porndude.tv","porngem.com","porngun.net","pornhex.com","pornhub.com","pornkai.com","pornken.com","pornkino.cc","pornktube.*","pornmam.com","pornmom.net","porno-365.*","pornoman.pl","pornomoll.*","pornone.com","pornovka.cz","pornpaw.com","pornsai.com","porntin.com","porntry.com","pornult.com","poscitech.*","povvvideo.*","powstream.*","powstreen.*","ppatour.com","primesrc.me","primewire.*","prisjakt.no","promobil.de","pronpic.org","pulpo69.com","pupuweb.com","purplex.app","putlocker.*","pvip.gratis","pxtech.site","qdembed.com","quizack.com","quizlet.com","radamel.icu","raiders.com","rainanime.*","raw1001.net","rawkuma.com","rawkuma.net","rawkuro.net","readfast.in","readmore.de","realbbc.xyz","redgifs.com","redlion.net","redporno.cz","redtub.live","redwap2.com","redwap3.com","reifporn.de","rekogap.xyz","repelis.net","repelisgt.*","repelishd.*","repelisxd.*","repicsx.com","resetoff.pl","rethmic.com","retrotv.org","reuters.com","reverso.net","riedberg.tv","rimondo.com","rl6mans.com","rlshort.com","roadbike.de","rocklink.in","romfast.com","romsite.org","romviet.com","rphangx.net","rpmplay.xyz","rpupdate.cc","rsgamer.app","rubystm.com","rubyvid.com","rugby365.fr","runmods.com","ryxy.online","s0ft4pc.com","saekita.com","safelist.eu","sandrives.*","sankaku.app","sansat.link","sararun.net","sat1gold.de","satcesc.com","savelinks.*","savemedia.*","savetub.com","sbbrisk.com","sbchill.com","scenedl.org","scenexe2.io","schadeck.eu","scripai.com","sdefx.cloud","seclore.com","secuhex.com","see-xxx.com","semawur.com","sembunyi.in","sendvid.com","seoworld.in","serengo.net","serially.it","seriemega.*","seriesflv.*","seselah.com","sexavgo.com","sexdiaryz.*","sexemix.com","sexetag.com","sexmoza.com","sexpuss.org","sexrura.com","sexsaoy.com","sexuhot.com","sexygirl.cc","shaheed4u.*","sharclub.in","sharedisk.*","sharing.wtf","shavetape.*","shortearn.*","shrinkus.tk","shrlink.top","simsdom.com","siteapk.net","sitepdf.com","sixsave.com","smarturl.it","smplace.com","snaptik.app","socks24.org","soft112.com","softrop.com","solobari.it","soninow.com","sosuroda.pl","soundpark.*","souqsky.net","southpark.*","spambox.xyz","spankbang.*","speedporn.*","spinbot.com","sporcle.com","sport365.fr","sportbet.gr","sportcast.*","sportlive.*","sportshub.*","spycock.com","srcimdb.com","ssoap2day.*","ssrmovies.*","staaker.com","stagatv.com","starmusiq.*","steamplay.*","steanplay.*","sterham.net","stickers.gg","stmruby.com","strcloud.in","streamcdn.*","streamed.su","streamers.*","streamhoe.*","streamhub.*","streamio.to","streamix.so","streamm4u.*","streamup.ws","strikeout.*","subdivx.com","subedlc.com","submilf.com","subsvip.com","sukuyou.com","sundberg.ws","sushiscan.*","swatalk.com","t-online.de","tabootube.*","tagblatt.ch","takimag.com","tamilyogi.*","tandess.com","taodung.com","tattle.life","tcheats.com","tdtnews.com","teachoo.com","teamkong.tk","techbook.de","techforu.in","technews.tw","tecnomd.com","telenord.it","telorku.xyz","teltarif.de","tempr.email","terabox.fun","teralink.me","testedich.*","texw.online","thapcam.net","thaript.com","thelanb.com","therams.com","theroot.com","thespun.com","thestar.com","thisvid.com","thotcity.su","thotporn.tv","thotsbay.tv","threads.com","threads.net","tikmate.app","tinys.click","titantv.com","tnaflix.com","todaypktv.*","tonspion.de","toolxox.com","toonanime.*","toonily.com","topgear.com","topmovies.*","topshare.in","topsport.bg","totally.top","toxicwap.us","trahino.net","tranny6.com","trgtkls.org","tribuna.com","trickms.com","trilog3.net","tromcap.com","trxking.xyz","tryvaga.com","ttsfree.com","tubator.com","tube18.sexy","tuberel.com","tubsxxx.com","tukoz.com>>","turkanime.*","turkmmo.com","tutflix.org","tutvlive.ru","tv-media.at","tv.bdix.app","tvableon.me","tvseries.in","tw-calc.net","twitchy.com","twitter.com","ubbulls.com","ucanwatch.*","ufcstream.*","uhdmovies.*","uiiumovie.*","uknip.co.uk","umterps.com","unblockit.*","uozzart.com","updown.link","upfiles.app","uploadbaz.*","uploadhub.*","uploadrar.*","upns.online","uproxy2.biz","uprwssp.org","upstore.net","upstream.to","uptime4.com","uptobox.com","urdubolo.pk","usfdons.com","usgamer.net","ustvgo.live","uyeshare.cc","v2movies.me","v6embed.xyz","vague.style","variety.com","vaughn.live","vectorx.top","vedshar.com","vegamovie.*","ver-pelis.*","verizon.com","veronica.uk","vexfile.com","vexmovies.*","vf-film.net","vgamerz.com","vidbeem.com","vidcloud9.*","videezy.com","vidello.net","videovard.*","videoxxx.cc","videplay.us","videq.cloud","vidfast.pro","vidlink.pro","vidload.net","vidshar.org","vidshare.tv","vidspeed.cc","vidstream.*","vidtube.one","vikatan.com","vikings.com","vip-box.app","vipifsa.com","vipleague.*","vipracing.*","vipshort.in","vipstand.se","viptube.com","virabux.com","visalist.io","visible.com","viva100.com","vixcloud.co","vizcloud2.*","vkprime.com","voirfilms.*","voyeurhit.*","vrcmods.com","vstdrive.in","vulture.com","vvtplayer.*","vw-page.com","w.grapps.me","waploaded.*","watchfree.*","watchporn.*","wavewalt.me","wayfair.com","wcostream.*","weadown.com","weather.com","webcras.com","webfail.com","webmaal.cfd","webtoon.xyz","weights.com","wetsins.com","weviral.org","wgzimmer.ch","why-tech.it","wildwap.com","winshell.de","wintotal.de","wmovies.xyz","woffxxx.com","wonporn.com","wowroms.com","wupfile.com","wvt.free.nf","www.msn.com","x-x-x.video","x.ag2m2.cfd","xemales.com","xflixbd.com","xforum.live","xfreehd.com","xgroovy.com","xhamster.fm","xhamster1.*","xhamster2.*","xhamster3.*","xhamster4.*","xhamster5.*","xhamster7.*","xhamster8.*","xhmoon5.com","xhreal2.com","xhreal3.com","xhtotal.com","xhwide5.com","xmateur.com","xmovies08.*","xnxxcom.xyz","xozilla.xxx","xpicu.store","xpornzo.com","xpshort.com","xsanime.com","xubster.com","xvideos.com","xx.knit.bid","xxxmomz.com","xxxmovies.*","xztgl.com>>","y-2mate.com","y2meta.mobi","yalifin.xyz","yamsoti.com","yesmovies.*","yestech.xyz","yifysub.net","ymovies.vip","yomovies1.*","yoshare.net","youshort.me","youtube.com","yoxplay.xyz","yt2conv.com","ytmp3cc.net","ytsubme.com","yumeost.net","z9sayu0m.nl","zedporn.com","zemporn.com","zerioncc.pl","zerogpt.com","zetporn.com","ziperto.com","zlpaste.net","zoechip.com","zyromod.com","0123movies.*","0cbcq8mu.com","0l23movies.*","0ochi8hp.com","10-train.com","1024tera.com","103.74.5.104","123-movies.*","1234movies.*","123animes.ru","123moviesc.*","123moviess.*","123unblock.*","1340kbbr.com","16honeys.com","185.53.88.15","18tubehd.com","1fichier.com","1madrasdub.*","1primewire.*","2017tube.com","2btmc2r0.fun","2cf0xzdu.com","2fb9tsgn.fun","2madrasdub.*","398fitus.com","3a38xmiv.fun","3gaytube.com","45.86.86.235","456movie.com","4archive.org","4bct9.live>>","4edtcixl.xyz","4fansites.de","4k2h4w04.xyz","4live.online","4movierulz.*","56m605zk.fun","5moviess.com","720pstream.*","723qrh1p.fun","7hitmovies.*","8mhlloqo.fun","8rm3l0i9.fun","8teenxxx.com","a6iqb4m8.xyz","ablefast.com","aboedman.com","absoluporn.*","abysscdn.com","acapellas.eu","adbypass.org","adcrypto.net","addonbiz.com","addtoany.com","adsurfle.com","adultfun.net","aegeanews.gr","afl3ua5u.xyz","afreesms.com","airliners.de","akinator.com","akirabox.com","alcasthq.com","alexsports.*","aliancapes.*","allcalidad.*","alliptvs.com","allmusic.com","allosurf.net","alotporn.com","alphatron.tv","alrincon.com","alternet.org","amateur8.com","amnaymag.com","amtil.com.au","androidaba.*","anhdep24.com","anime-jl.net","anime3rb.com","animefire.io","animeflv.net","animefreak.*","animesanka.*","animeunity.*","animexin.vip","animixplay.*","aninavi.blog","anisubindo.*","anmup.com.np","annabelle.ch","antiadtape.*","antonimos.de","anybunny.com","apetube.asia","apkcombo.com","apkdrill.com","apkmodhub.in","apkprime.org","apkship.shop","apkupload.in","apnablogs.in","app.vaia.com","appsbull.com","appsmodz.com","aranzulla.it","arcaxbydz.id","arkadium.com","arolinks.com","aroratr.club","artforum.com","asiaflix.net","asianporn.li","askim-bg.com","atglinks.com","atgstudy.com","atozmath.com","audiotools.*","audizine.com","autoblog.com","autodime.com","autoembed.cc","autonews.com","autorevue.at","az-online.de","azoranov.com","azores.co.il","b-hentai.com","babesexy.com","babiato.tech","babygaga.com","bagpipe.news","baithak.news","bamgosu.site","bandstand.ph","banned.video","baramjak.com","barchart.com","baritoday.it","batchkun.com","batporno.com","bbyhaber.com","bceagles.com","bclikeqt.com","beemtube.com","beingtek.com","benchmark.pl","bestlist.top","bestwish.lol","biletomat.pl","bilibili.com","biopills.net","biovetro.net","birdurls.com","bitchute.com","bitssurf.com","bittools.net","bk9nmsxs.com","blog-dnz.com","blogmado.com","blogmura.com","bloground.ro","blwideas.com","bobolike.com","bollydrive.*","bollyshare.*","boltbeat.com","bookfrom.net","bookriot.com","boredbat.com","boundhub.com","boysfood.com","br0wsers.com","braflix.tube","brainzaps.tv","bright-b.com","bsmaurya.com","bubraves.com","buffsports.*","buffstream.*","bugswave.com","bullfrag.com","burakgoc.com","burbuja.info","burnbutt.com","buyjiocoin.*","byswiizen.fr","bz-berlin.de","calbears.com","callfuck.com","camhub.world","camlovers.tv","camporn.tube","camwhores.tv","camwhorez.tv","capoplay.net","cardiagn.com","cariskuy.com","carnewz.site","cashbux.work","casperhd.com","casthill.net","catcrave.com","catholic.com","cbt-tube.net","cctvwiki.com","celebmix.com","celibook.com","cesoirtv.com","channel4.com","chargers.com","chatango.com","chibchat.com","chopchat.com","choralia.net","chzzkban.xyz","cinedetodo.*","cinemabg.net","cinemaxxl.de","claimbits.io","claimtrx.com","clickapi.net","clicporn.com","clix4btc.com","clockskin.us","closermag.fr","cocogals.com","cocoporn.net","coderblog.in","codesnse.com","coindice.win","coingraph.us","coinsrev.com","collider.com","compsmag.com","compu-pc.com","cool-etv.net","cosmicapp.co","couchtuner.*","coursera.org","cracking.org","crazyblog.in","cricwatch.io","cryptowin.io","cuevana8.com","cut-urls.com","cuts-url.com","cwc.utah.gov","cyberdrop.me","cyberleaks.*","cyclones.com","cyprus.co.il","czechsex.net","da-imnetz.de","daddylive1.*","dafideff.com","dafontvn.com","daftporn.com","dailydot.com","dailysport.*","daizurin.com","daotekno.com","darkibox.com","datacheap.io","datanodes.to","dataporn.pro","datawav.club","dawntube.com","day4news.com","ddlvalley.me","deadline.com","deadspin.com","debridup.com","deckshop.pro","decorisi.com","deepbrid.com","deephot.link","delvein.tech","derwesten.de","descarga.xyz","desi.upn.bio","desihoes.com","desiupload.*","desivideos.*","deviants.com","digimanie.cz","dikgames.com","dir-tech.com","dirproxy.com","dirtyfox.net","dirtyporn.cc","distanta.net","divicast.com","divxtotal1.*","djpunjab2.in","dl-protect.*","dlolcast.pro","dlupload.com","dndsearch.in","dokumen.tips","domahatv.com","dotabuff.com","doujindesu.*","downloadr.in","drakecomic.*","dreamdth.com","drivefire.co","drivemoe.com","drivers.plus","dropbang.net","dropgalaxy.*","drsnysvet.cz","drublood.com","ds2video.com","dukeofed.org","dumovies.com","duolingo.com","dutchycorp.*","dvd-flix.com","dwlinks.buzz","eastream.net","ecamrips.com","eclypsia.com","edukaroo.com","egram.com.ng","egyanime.com","ehotpics.com","elcultura.pl","electsex.com","eljgocmn.fun","elvocero.com","embed4me.com","embedtv.best","emporda.info","endbasic.dev","eng-news.com","engvideo.net","epson.com.cn","eroclips.org","erofound.com","erogarga.com","eropaste.net","eroticmv.com","esportivos.*","estrenosgo.*","estudyme.com","et-invest.de","etonline.com","eurogamer.de","eurogamer.es","eurogamer.it","eurogamer.pt","evernia.site","evfancy.link","ex-foary.com","examword.com","exceljet.net","exe-urls.com","eximeuet.fun","expertvn.com","eymockup.com","ezeviral.com","f1livegp.net","facebook.com","factable.com","fairyhorn.cc","fansided.com","fansmega.com","fapality.com","fapfappy.com","fartechy.com","fastilinks.*","fat-bike.com","fbsquadx.com","fc2stream.tv","fedscoop.com","feed2all.org","fehmarn24.de","femdomtb.com","ferdroid.net","fileguard.cc","fileguru.net","filemoon.*>>","filerice.com","filescdn.com","filessrc.com","filezipa.com","filmifen.com","filmisongs.*","filmizip.com","filmizletv.*","filmy4wap1.*","filmygod13.*","filmyone.com","filmyzilla.*","financid.com","finevids.xxx","firstonetv.*","fitforfun.de","fivemdev.org","flashbang.sh","flaticon.com","flexy.stream","flexyhit.com","flightsim.to","flixbaba.com","flowsnet.com","flstv.online","flvto.com.co","fm-arena.com","fmoonembed.*","focus4ca.com","footybite.to","forexrw7.com","forogore.com","forplayx.ink","fotopixel.es","freejav.guru","freemovies.*","freemp3.tube","freeshib.biz","freetron.top","freewsad.com","fremdwort.de","freshbbw.com","fruitlab.com","fsileaks.com","fuckmilf.net","fullboys.com","fullcinema.*","fullhd4k.com","fuskator.com","futemais.net","g8rnyq84.fun","galaxyos.net","game-owl.com","gamebrew.org","gamefast.org","gamekult.com","gamer.com.tw","gamerant.com","gamerxyt.com","games.get.tv","games.wkb.jp","gameslay.net","gameszap.com","gametter.com","gamezizo.com","gamingsym.in","gatagata.net","gay4porn.com","gaystream.pw","gayteam.club","gculopes.com","gelbooru.com","gentside.com","getcopy.link","getitfree.cn","getmodsapk.*","gifcandy.net","gioialive.it","gksansar.com","glo-n.online","globes.co.il","globfone.com","gniewkowo.eu","gnusocial.jp","go2share.net","goanimes.vip","gobadgers.ca","gocast123.me","godzcast.com","gogoanimes.*","gogriffs.com","golancers.ca","gomuraw.blog","gonzoporn.cc","goracers.com","gosexpod.com","gottanut.com","goxavier.com","gplastra.com","grazymag.com","grigtube.com","grosnews.com","gseagles.com","gsmarena.com","gsmhamza.com","guidetnt.com","gurusiana.id","h-game18.xyz","h8jizwea.fun","habuteru.com","hachiraw.net","hackshort.me","hackstore.me","halloporno.*","harbigol.com","hbnews24.com","hbrfrance.fr","hdfcfund.com","hdhub4u.fail","hdmoviehub.*","hdmovies23.*","hdmovies4u.*","hdmovies50.*","hdpopcorns.*","hdporn92.com","hdpornos.net","hdvideo9.com","hellmoms.com","helpdice.com","hentai2w.com","hentai4k.com","hentaigo.com","hentaila.com","hentaimoe.me","hentais.tube","hentaitk.net","hentaizm.fun","hi0ti780.fun","highporn.net","hiperdex.com","hipsonyc.com","hivetoon.com","hmanga.world","hostmath.com","hotmilfs.pro","hqporner.com","hubdrive.com","huffpost.com","hurawatch.cc","huzi6or1.fun","hwzone.co.il","hyderone.com","hydrogen.lat","hypnohub.net","ibradome.com","icutlink.com","icyporno.com","idealight.it","idesign.wiki","idntheme.com","iguarras.com","ihdstreams.*","ilovephd.com","ilpescara.it","imagefap.com","imdpu9eq.com","imgadult.com","imgbaron.com","imgblaze.net","imgbnwe.shop","imgbyrev.sbs","imgclick.net","imgdrive.net","imgflare.com","imgfrost.net","imggune.shop","imgjajhe.sbs","imgmffmv.sbs","imgnbii.shop","imgolemn.sbs","imgprime.com","imgqbbds.sbs","imgspark.com","imgthbm.shop","imgtorrnt.in","imgxabm.shop","imgxxbdf.sbs","imintweb.com","indianxxx.us","infodani.net","infofuge.com","informer.com","interssh.com","intro-hd.net","ipacrack.com","ipatriot.com","iptvapps.net","iptvspor.com","iputitas.net","iqksisgw.xyz","isaidub6.net","itainews.com","itz-fast.com","iwanttfc.com","izzylaif.com","jaktsidan.se","jalopnik.com","japanporn.tv","japteenx.com","jav-asia.top","javboys.tv>>","javbraze.com","javguard.xyz","javhahaha.us","javhdz.today","javindo.site","javjavhd.com","javmelon.com","javplaya.com","javplayer.me","javprime.net","javquick.com","javrave.club","javtiful.com","javturbo.xyz","jenpornuj.cz","jeshoots.com","jmzkzesy.xyz","jobfound.org","jobsheel.com","jockantv.com","joymaxtr.net","joziporn.com","jsfiddle.net","jsonline.com","juba-get.com","jujmanga.com","kabeleins.de","kafeteria.pl","kakitengah.*","kamehaus.net","kaoskrew.org","karanapk.com","katmoviehd.*","kattracker.*","kaystls.site","khaddavi.net","khatrimaza.*","khsn1230.com","kickasskat.*","kinisuru.com","kinkyporn.cc","kino-zeit.de","kiss-anime.*","kisstvshow.*","klubsports.*","knowstuff.in","kolcars.shop","kollhong.com","komonews.com","konten.co.id","koramaup.com","kpopjams.com","kr18plus.com","kreisbote.de","kstreaming.*","kubo-san.com","kumapoi.info","kungfutv.net","kunmanga.com","kurazone.net","kusonime.com","ladepeche.fr","landwirt.com","lanjutkeun.*","latino69.fun","ldkmanga.com","leaktube.net","learnmany.in","lectormh.com","lecturel.com","leechall.com","leprogres.fr","lesbenhd.com","lesbian8.com","lewdzone.com","liddread.com","lifestyle.bg","lifewire.com","likemanga.io","likuoo.video","linfoweb.com","linkjust.com","linksaya.com","linkshorts.*","linkvoom.com","lionsfan.net","livegore.com","livemint.com","livesport.ws","ln-online.de","lokerwfh.net","longporn.xyz","lookmovie.pn","lookmovie2.*","lootdest.com","lover937.net","lrepacks.net","lucidcam.com","lulustream.*","luluvdoo.com","luluvids.top","luscious.net","lusthero.com","luxuretv.com","m-hentai.net","mac2sell.net","macsite.info","mamahawa.com","manga18.club","mangadna.com","mangafire.to","mangagun.net","mangakio.com","mangakita.id","mangalek.com","mangamanga.*","manganato.gg","manganelo.tv","mangarawjp.*","mangasco.com","mangoporn.co","mangovideo.*","manhuaga.com","manhuascan.*","manhwa68.com","manhwass.com","manhwaus.net","manpeace.org","manyakan.com","manytoon.com","maqal360.com","marmiton.org","masengwa.com","mashtips.com","masslive.com","mat6tube.com","mathaeser.de","maturell.com","mavanimes.co","maxgaming.fi","mazakony.com","mc-hacks.net","mcfucker.com","mcrypto.club","mdbekjwqa.pw","mdtaiwan.com","mealcold.com","medscape.com","medytour.com","meetimgz.com","mega-mkv.com","mega-p2p.net","megafire.net","megatube.xxx","megaupto.com","meilblog.com","metabomb.net","meteolive.it","miaandme.org","micmicidol.*","microify.com","midis.com.ar","mikohub.blog","milftoon.xxx","miraculous.*","mirror.co.uk","missavtv.com","missyusa.com","mitsmits.com","mixloads.com","mjukb26l.fun","mkm7c3sm.com","mkvcinemas.*","mlbstream.tv","mmsbee47.com","mobitool.net","modcombo.com","moddroid.com","modhoster.de","modsbase.com","modsfire.com","modyster.com","mom4real.com","momo-net.com","momspost.com","momxxx.video","monaco.co.il","mooonten.com","moretvtime.*","moshahda.net","motofakty.pl","movie4u.live","moviedokan.*","movieffm.net","moviefreak.*","moviekids.tv","movielair.cc","movierulzs.*","movierulzz.*","movies123.pk","movies18.net","movies4us.co","moviesapi.to","moviesbaba.*","moviesflix.*","moviesland.*","moviespapa.*","moviesrulz.*","moviesshub.*","moviesxxx.cc","movieweb.com","movstube.net","mp3fiber.com","mp3juices.su","mp4-porn.net","mpg.football","mrscript.net","multporn.net","musictip.net","mutigers.com","myesports.gg","myflixerz.to","myfxbook.com","mylinkat.com","naniplay.com","nanolinks.in","napiszar.com","nar.k-ba.net","natgeotv.com","nbastream.tv","nemumemo.com","nephobox.com","netmovies.to","netoff.co.jp","netuplayer.*","newatlas.com","news.now.com","newsextv.com","newsmondo.it","nextdoor.com","nextorrent.*","neymartv.net","nflscoop.xyz","nflstream.tv","nicetube.one","nicknight.de","nicovideo.jp","nifteam.info","nilesoft.org","niu-pack.com","niyaniya.moe","nkunorse.com","nonktube.com","novelasesp.*","novelbob.com","novelread.co","novoglam.com","novoporn.com","nowmaxtv.com","nowsports.me","nowsportv.nl","nowtv.com.tr","nptsr.live>>","nsfwgify.com","nsfwzone.xyz","nudecams.xxx","nudedxxx.com","nudistic.com","nudogram.com","nudostar.com","nueagles.com","nugglove.com","nusports.com","nwzonline.de","nyaa.iss.ink","nzbstars.com","oaaxpgp3.xyz","octanime.net","of-model.com","oimsmosy.fun","okulsoru.com","oldcamera.pl","olutposti.fi","olympics.com","oncehelp.com","oneupload.to","onlinexxx.cc","onlytech.com","onscreens.me","onyxfeed.com","op-online.de","openload.mov","opomanga.com","optifine.net","orangeink.pk","oricon.co.jp","osuskins.net","otakukan.com","otakuraw.net","ottverse.com","ottxmaza.com","ovagames.com","ovnihoje.com","oyungibi.com","pagalworld.*","pak-mcqs.net","paktech2.com","pandadoc.com","pandamovie.*","panthers.com","papunika.com","parenting.pl","parzibyte.me","paste.bin.sx","pastepvp.org","pastetot.com","patriots.com","pay4fans.com","pc-hobby.com","pcgamesn.com","pdfindir.net","peekvids.com","pelimeli.com","pelis182.net","pelisflix2.*","pelishouse.*","pelispedia.*","pelisplus2.*","pennlive.com","pentruea.com","perisxxx.com","phimmoiaz.cc","photooxy.com","photopea.com","picbaron.com","picjbet.shop","picnwqez.sbs","picyield.com","pietsmiet.de","pig-fuck.com","pilibook.com","pinayflix.me","piratebayz.*","pisatoday.it","pittband.com","pixbnab.shop","pixdfdj.shop","piximfix.com","pixkfkf.shop","pixnbrqw.sbs","pixrqqz.shop","pkw-forum.de","platinmods.*","play.max.com","play.nova.bg","play1002.com","player4u.xyz","playerfs.com","playertv.net","playfront.de","playstore.pw","playvids.com","plaza.chu.jp","plc4free.com","plusupload.*","pmvhaven.com","poki-gdn.com","politico.com","polygamia.pl","pomofocus.io","ponsel4g.com","pornabcd.com","pornachi.com","porncomics.*","pornditt.com","pornfeel.com","pornfeet.xyz","pornflip.com","porngames.tv","porngrey.com","pornhat.asia","pornhdin.com","pornhits.com","pornhost.com","pornicom.com","pornleaks.in","pornlift.com","pornlore.com","pornluck.com","pornmoms.org","porno-tour.*","pornoaid.com","pornoente.tv","pornohd.blue","pornotom.com","pornozot.com","pornpapa.com","porntape.net","porntrex.com","pornvibe.org","pornwatch.ws","pornyeah.com","pornyfap.com","pornzone.com","poscitechs.*","postazap.com","postimees.ee","powcloud.org","prensa.click","pressian.com","pricemint.in","prime4you.de","produsat.com","programme.tv","promipool.de","proplanta.de","prothots.com","ps2-bios.com","pugliain.net","pupupul.site","pussyspace.*","putlocker9.*","putlockerc.*","putlockers.*","pysznosci.pl","q1-tdsge.com","qashbits.com","qpython.club","quizrent.com","qvzidojm.com","r3owners.net","raidrush.net","rail-log.net","rajtamil.org","ranjeet.best","rapelust.com","rapidzona.tv","raulmalea.ro","rawmanga.top","rawstory.com","razzball.com","rbs.ta36.com","recipahi.com","recipenp.com","recording.de","reddflix.com","redecanais.*","redretti.com","remilf.xyz>>","reminimod.co","repelisgoo.*","repretel.com","reqlinks.net","resplace.com","retire49.com","richhioon.eu","riotbits.com","ritzysex.com","rockmods.net","rolltide.com","romatoday.it","roms-hub.com","ronaldo7.pro","root-top.com","rosasidan.ws","rosefile.net","rot-blau.com","rotowire.com","royalkom.com","rp-online.de","rtilinks.com","rubias19.com","rue89lyon.fr","ruidrive.com","rushporn.xxx","s2watch.link","salidzini.lv","samfirms.com","samovies.net","satkurier.pl","savefrom.net","savegame.pro","savesubs.com","savevideo.me","scamalot.com","scjhg5oh.fun","seahawks.com","seeklogo.com","seireshd.com","seksrura.net","senimovie.co","senmanga.com","senzuri.tube","servustv.com","sethphat.com","seuseriado.*","sex-pic.info","sexgames.xxx","sexgay18.com","sexroute.net","sexy-games.*","sexyhive.com","sfajacks.com","sgxnifty.org","shanurdu.com","sharedrive.*","sharetext.me","shemale6.com","shemedia.com","sheshaft.com","shorteet.com","shrtslug.biz","sieradmu.com","silkengirl.*","sinonimos.de","siteflix.org","sitekeys.net","skinnyhq.com","skinnyms.com","slawoslaw.pl","slreamplay.*","slutdump.com","slutmesh.net","smailpro.com","smallpdf.com","smcgaels.com","smgplaza.com","snlookup.com","sobatkeren.*","sodomojo.com","solarmovie.*","sonixgvn.net","sortporn.com","sound-park.*","southfreak.*","sp-today.com","sp500-up.com","speedrun.com","spielfilm.de","spinoff.link","sport-97.com","sportico.com","sporting77.*","sportlemon.*","sportlife.es","sportnews.to","sportshub.to","sportskart.*","stardeos.com","stardima.com","stayglam.com","stbturbo.xyz","steelers.com","stevivor.com","stimotion.pl","stre4mplay.*","stream18.net","streamango.*","streambee.to","streameast.*","streampiay.*","streamtape.*","streamwish.*","strikeout.im","stylebook.de","subtaboo.com","sunbtc.space","sunporno.com","superapk.org","superpsx.com","supervideo.*","surfline.com","surrit.store","sushi-scan.*","sussytoons.*","suzihaza.com","suzylu.co.uk","svipvids.com","swiftload.io","synonyms.com","syracuse.com","system32.ink","tabering.net","tabooporn.tv","tacobell.com","tagecoin.com","tajpoint.com","tamilprint.*","tamilyogis.*","tampabay.com","tanfacil.net","tapchipi.com","tapepops.com","tatabrada.tv","team-rcv.xyz","tech24us.com","tech4auto.in","techably.com","techmuzz.com","technons.com","technorj.com","techstage.de","techstwo.com","techtobo.com","techyinfo.in","techzed.info","teczpert.com","teencamx.com","teenhost.net","teensark.com","teensporn.tv","teknorizen.*","telecinco.es","telegraaf.nl","teleriumtv.*","teluguflix.*","teraearn.com","terashare.co","terashare.me","tesbox.my.id","tespedia.com","testious.com","th-world.com","theblank.net","theconomy.me","thedaddy.*>>","thefmovies.*","thegamer.com","thehindu.com","thekickass.*","thelinkbox.*","themezon.net","theonion.com","theproxy.app","thesleak.com","thesukan.net","thevalley.fm","theverge.com","threezly.com","thuglink.com","thurrott.com","tigernet.com","tik-tok.porn","timestamp.fr","tioanime.com","tipranks.com","tnaflix.asia","tnhitsda.net","tntdrama.com","tokuzl.net>>","top10cafe.se","topeuropix.*","topfaucet.us","topkickass.*","topspeed.com","topstreams.*","torture1.net","trahodom.com","trendyol.com","tresdaos.com","truthnews.de","tryboobs.com","ts-mpegs.com","tsmovies.com","tubedupe.com","tubewolf.com","tubxporn.com","tucinehd.com","turbobit.net","turbovid.vip","turkanime.co","turkdown.com","turkrock.com","tusfiles.com","tv3monde.com","tvappapk.com","tvdigital.de","tvpclive.com","tvtropes.org","tweakers.net","twister.porn","tz7z9z0h.com","u-s-news.com","u26bekrb.fun","u9206kzt.fun","udoyoshi.com","ugreen.autos","ukchat.co.uk","ukdevilz.com","ukigmoch.com","ultraten.net","umagame.info","unitystr.com","up-4ever.net","upload18.com","uploadbox.io","uploadmx.com","uploads.mobi","upshrink.com","uptomega.net","ur-files.com","ur70sq6j.fun","usatoday.com","usaxtube.com","userupload.*","usp-forum.de","utahutes.com","utaitebu.com","utakmice.net","uthr5j7t.com","utsports.com","uur-tech.net","uwatchfree.*","vdiflcsl.fun","veganinja.hu","vegas411.com","vibehubs.com","videofilms.*","videojav.com","videos-xxx.*","videovak.com","vidnest.live","vidsaver.net","vidsonic.net","vidsrc-me.su","vidsrc.click","viidshar.com","vikiporn.com","violablu.net","vipporns.com","viralxns.com","visorsmr.com","vocalley.com","voirseries.*","volokit2.com","vqjhqcfk.fun","warddogs.com","wargamer.com","watchmovie.*","watchmygf.me","watchnow.fun","watchop.live","watchporn.cc","watchporn.to","watchtvchh.*","way2movies.*","web2.0calc.*","webcams.casa","webnovel.com","webxmaza.com","westword.com","whatgame.xyz","whyvpn.my.id","wikifeet.com","wikirise.com","winboard.org","winfuture.de","winlator.com","wishfast.top","withukor.com","wohngeld.org","wolfstream.*","worldaide.fr","worldmak.com","worldsex.com","writedroid.*","wspinanie.pl","www.google.*","x-video.tube","xculitos.com","xemphim1.top","xfantazy.com","xfantazy.org","xhaccess.com","xhadult2.com","xhadult3.com","xhamster10.*","xhamster11.*","xhamster12.*","xhamster13.*","xhamster14.*","xhamster15.*","xhamster16.*","xhamster17.*","xhamster18.*","xhamster19.*","xhamster20.*","xhamster42.*","xhdate.world","xpornium.net","xsexpics.com","xteensex.net","xvideos.name","xvideos2.com","xxporner.com","xxxfiles.com","xxxhdvideo.*","xxxonline.cc","xxxputas.net","xxxshake.com","xxxstream.me","y5vx1atg.fun","yabiladi.com","yaoiscan.com","yggtorrent.*","yhocdata.com","ynk-blog.com","yogranny.com","you-porn.com","yourlust.com","yts-subs.com","yts-subs.net","ytube2dl.com","yuatools.com","yurudori.com","z1ekv717.fun","zealtyro.com","zehnporn.com","zenradio.com","zhlednito.cz","zilla-xr.xyz","zimabdko.com","zone.msn.com","zootube1.com","zplayer.live","zvision.link","01234movies.*","01fmovies.com","10convert.com","10play.com.au","10starhub.com","111.90.150.10","111.90.151.26","111movies.com","123gostream.*","123movies.net","123moviesgo.*","123movieshd.*","123moviesla.*","123moviesme.*","123movieweb.*","123multihub.*","185.53.88.104","185.53.88.204","190.115.18.20","1bitspace.com","1qwebplay.xyz","1xxx-tube.com","247sports.com","2girls1cup.ca","30kaiteki.com","360news4u.net","38.242.194.12","3dhentai.club","4download.net","4drumkits.com","4filmyzilla.*","4horlover.com","4meplayer.com","4movierulz1.*","560pmovie.com","5movierulz2.*","6hiidude.gold","7fractals.icu","7misr4day.com","7movierulz1.*","7moviesrulz.*","7vibelife.com","94.103.83.138","9filmyzilla.*","9ketsuki.info","abczdrowie.pl","abendblatt.de","abseits-ka.de","acusports.com","acutetube.net","adblocktape.*","advantien.com","advertape.net","ainonline.com","aitohuman.org","ajt.xooit.org","akcartoons.in","albania.co.il","alexbacher.fr","alimaniac.com","allitebooks.*","allmomsex.com","alltstube.com","allusione.org","alohatube.xyz","alueviesti.fi","ambonkita.com","angelfire.com","angelgals.com","anihdplay.com","animecast.net","animefever.cc","animeflix.ltd","animefreak.to","animeheaven.*","animenexus.in","animesite.net","animesup.info","animetoast.cc","animeunity.so","animeworld.ac","animeworld.tv","animeyabu.net","animeyabu.org","animeyubi.com","anitube22.vip","aniwatchtv.to","aniworld.to>>","anonyviet.com","anusling.info","aogen-net.com","aparttent.com","appteka.store","arahdrive.com","archive.today","archivebate.*","archpaper.com","areabokep.com","areamobile.de","areascans.net","areatopik.com","arenascan.com","arenavision.*","arhplyrics.in","ariestube.com","ark-unity.com","arldeemix.com","artesacro.org","arti-flora.nl","articletz.com","artribune.com","asianboy.fans","asianhdplay.*","asianlbfm.net","asiansex.life","asiaontop.com","askattest.com","asssex-hd.com","astroages.com","astronews.com","at.wetter.com","audiotag.info","audiotrip.org","austiblox.net","auto-data.net","auto-swiat.pl","autobytel.com","autoextrem.de","autofrage.net","autoscout24.*","autosport.com","autotrader.nl","avpgalaxy.net","azcentral.com","aztravels.net","b-bmovies.com","babakfilm.com","babepedia.com","babestube.com","babytorrent.*","baddiehub.com","bdsm-fuck.com","beasttips.com","beegsexxx.com","besargaji.com","bestgames.com","beverfood.com","biftutech.com","bikeradar.com","bikerszene.de","bilasport.net","bilinovel.com","billboard.com","bimshares.com","bingsport.xyz","bitcosite.com","bitfaucet.net","bitlikutu.com","bitview.cloud","bizdustry.com","blasensex.com","blog.40ch.net","blogesque.net","blograffo.net","blurayufr.cam","bobs-tube.com","bokugents.com","bolly2tolly.*","bollymovies.*","boobgirlz.com","bootyexpo.net","boxylucha.com","boystube.link","bravedown.com","bravoporn.com","brawlhalla.fr","breitbart.com","breznikar.com","brighteon.com","brocoflix.com","brocoflix.xyz","bshifast.live","buffsports.io","buffstreams.*","bustyfats.com","buydekhke.com","bymichiby.com","call4cloud.nl","camarchive.tv","camdigest.com","camgoddess.tv","camvideos.org","camwhorestv.*","camwhoria.com","canalobra.com","canlikolik.my","capo5play.com","capo6play.com","caravaning.de","cardshare.biz","carryflix.icu","carscoops.com","cat-a-cat.net","cat3movie.org","cbsnews.com>>","ccthesims.com","cdiscount.com","celeb.gate.cc","celemusic.com","ceramic.or.kr","ceylonssh.com","cg-method.com","cgcosplay.org","chapteria.com","chataigpt.org","cheatcloud.cc","cheater.ninja","cheatsquad.gg","chevalmag.com","chihouban.com","chikonori.com","chimicamo.org","chloeting.com","cima100fm.com","cinecalidad.*","cinedokan.top","cinema.com.my","cinemabaz.com","cinemitas.org","civitai.green","claim.8bit.ca","claimbits.net","claudelog.com","claydscap.com","clickhole.com","cloudvideo.tv","cloudwish.xyz","cloutgist.com","cmsdetect.com","cmtracker.net","cnnamador.com","cockmeter.com","cocomanga.com","code2care.org","codeastro.com","codesnail.com","codewebit.top","coinbaby8.com","coinfaucet.io","coinlyhub.com","coinsbomb.com","comedyshow.to","comexlive.org","comparili.net","computer76.ru","condorsoft.co","configspc.com","cooksinfo.com","coolcast2.com","coolporno.net","corrector.app","courseclub.me","crackcodes.in","crackevil.com","crackfree.org","crazyporn.xxx","crazyshit.com","crazytoys.xyz","cricket12.com","criollasx.com","criticker.com","crocotube.com","crotpedia.net","crypto4yu.com","cryptonor.xyz","cryptorank.io","cumlouder.com","cureclues.com","cuttlinks.com","cxissuegk.com","cybermania.ws","daddylive.*>>","daddylivehd.*","dailynews.com","dailypaws.com","dailyrevs.com","dandanzan.top","dankmemer.lol","datavaults.co","dbusports.com","dcleakers.com","ddd-smart.net","decmelfot.xyz","deepfucks.com","deichstube.de","deluxtube.com","demae-can.com","dengarden.com","denofgeek.com","depvailon.com","derusblog.com","descargasok.*","desifakes.com","desijugar.net","desimmshd.com","dfilmizle.com","dickclark.com","dinnerexa.com","dipprofit.com","dirtyship.com","diskizone.com","dl-protect1.*","dlapk4all.com","dldokan.store","dlhe-videa.sk","dlstreams.*>>","doctoraux.com","dongknows.com","donkparty.com","doofree88.com","doomovie-hd.*","dooodster.com","doramasyt.com","dorawatch.net","douploads.net","douxporno.com","downfile.site","downloader.is","downloadhub.*","dr-farfar.com","dragontea.ink","dramafren.com","dramafren.org","dramaviki.com","drivelinks.me","drivenime.com","driveup.space","drop.download","dropnudes.com","dropshipin.id","dubaitime.net","durtypass.com","e-monsite.com","e2link.link>>","eatsmarter.de","ebonybird.com","ebook-hell.to","ebook3000.com","ebooksite.org","edealinfo.com","edukamer.info","egitim.net.tr","elespanol.com","embdproxy.xyz","embed.scdn.to","embedgram.com","embedplayer.*","embedrise.com","embedseek.xyz","embedwish.com","empleo.com.uy","emueagles.com","encurtads.net","encurtalink.*","enjoyfuck.com","ensenchat.com","entenpost.com","entireweb.com","ephoto360.com","epochtimes.de","eporner.video","eramuslim.com","erospots.info","eroticity.net","erreguete.gal","esladvice.com","eurogamer.net","exe-links.com","expansion.com","extratipp.com","fadedfeet.com","familyporn.tv","fanfiktion.de","fangraphs.com","fantasiku.com","fapomania.com","faresgame.com","farodevigo.es","fastcars1.com","fclecteur.com","fembed9hd.com","fetish-tv.com","fetishtube.cc","file-upload.*","filegajah.com","filehorse.com","filemooon.top","filmeseries.*","filmibeat.com","filmlinks4u.*","filmy4wap.uno","filmyporno.tv","filmyworlds.*","findheman.com","firescans.xyz","firmwarex.net","firstpost.com","fivemturk.com","flexamens.com","flexxporn.com","flix-wave.lol","flixlatam.com","flyplayer.xyz","fmoviesfree.*","fontyukle.net","footeuses.com","footyload.com","forexforum.co","forlitoday.it","forum.dji.com","fossbytes.com","fosslinux.com","fotoblogia.pl","foxaholic.com","foxsports.com","foxtel.com.au","frauporno.com","free.7hd.club","freedom3d.art","freeflix.info","freegames.com","freeiphone.fr","freeomovie.to","freeporn8.com","freesex-1.com","freeshot.live","freexcafe.com","freexmovs.com","freshscat.com","freyalist.com","fromwatch.com","fsicomics.com","fsl-stream.lu","fsportshd.net","fsportshd.xyz","fuck-beeg.com","fuck-xnxx.com","fuckingfast.*","fucksporn.com","fullassia.com","fullhdxxx.com","funandnews.de","fussball.news","futurezone.de","fzmovies.info","fztvseries.ng","gamearter.com","gamedrive.org","gamefront.com","gamelopte.com","gamereactor.*","games.bnd.com","games.qns.com","gamesite.info","gamesmain.xyz","gamezhero.com","gamovideo.com","garoetpos.com","gatasdatv.com","gayboyshd.com","gaysearch.com","geekering.com","generate.plus","gesundheit.de","getintopc.com","getpaste.link","getpczone.com","gfsvideos.com","ghscanner.com","gigmature.com","gipfelbuch.ch","girlnude.link","girlydrop.com","globalnews.ca","globalrph.com","globalssh.net","globlenews.in","go.linkify.ru","gobobcats.com","gogoanimetv.*","gogoplay1.com","gogoplay2.com","gohuskies.com","gol245.online","goldderby.com","gomaainfo.com","gomoviestv.to","goodriviu.com","govandals.com","grabpussy.com","grantorrent.*","graphicux.com","greatnass.com","greensmut.com","gry-online.pl","gsmturkey.net","guardaserie.*","gutefrage.net","gutekueche.at","gwusports.com","haaretz.co.il","hailstate.com","hairytwat.org","hancinema.net","haonguyen.top","haoweichi.com","harimanga.com","harzkurier.de","hdgayporn.net","hdmoviefair.*","hdmoviehubs.*","hdmovieplus.*","hdmovies2.org","hdtubesex.net","heatworld.com","heimporno.com","hellabyte.one","hellenism.net","hellporno.com","hentai-ia.com","hentaihaven.*","hentaikai.com","hentaimama.tv","hentaipaw.com","hentaiporn.me","hentairead.io","hentaiyes.com","herzporno.net","heutewelt.com","hexupload.net","hiddenleaf.to","hifi-forum.de","hihihaha1.xyz","hihihaha2.xyz","hilites.today","hindimovies.*","hindinest.com","hindishri.com","hindisite.net","hispasexy.org","hitsports.pro","hlsplayer.top","hobbykafe.com","holaporno.xxx","holymanga.net","hornbunny.com","hornyfanz.com","hosttbuzz.com","hotntubes.com","hotpress.info","howtogeek.com","hqmaxporn.com","hqpornero.com","hqsex-xxx.com","htmlgames.com","hulkshare.com","hurawatchz.to","hydraxcdn.biz","hypebeast.com","hyperdebrid.*","iammagnus.com","iceland.co.uk","ichberlin.com","icy-veins.com","ievaphone.com","iflixmovies.*","ifreefuck.com","igg-games.com","ignboards.com","iiyoutube.com","ikarianews.gr","ikz-online.de","ilpiacenza.it","imagehaha.com","imagenpic.com","imgbbnhi.shop","imgbncvnv.sbs","imgcredit.xyz","imghqqbg.shop","imgkkabm.shop","imgmyqbm.shop","imgouskel.sbs","imgwallet.com","imgwwqbm.shop","imleagues.com","indiafree.net","indiamaja.com","indianyug.com","indiewire.com","ineedskin.com","inextmovies.*","infidrive.net","inhabitat.com","instagram.com","instalker.org","interfans.org","investing.com","iogames.space","ipalibrary.me","iptvpulse.top","italpress.com","itdmusics.com","itdmusicy.com","itmaniatv.com","itopmusic.com","itsguider.com","jadijuara.com","jagoanssh.com","jameeltips.us","japanxxx.asia","jav101.online","javenglish.cc","javguard.club","javhdporn.net","javleaked.com","javmobile.net","javporn18.com","javsaga.ninja","javstream.com","javstream.top","javsubbed.xyz","javsunday.com","jaysndees.com","jazzradio.com","jellynote.com","jennylist.xyz","jesseporn.xyz","jiocinema.com","jipinsoft.com","jizzberry.com","jk-market.com","jkdamours.com","jncojeans.com","jobzhub.store","joongdo.co.kr","jpscan-vf.com","jptorrent.org","juegos.as.com","jumboporn.xyz","junkyponk.com","jurukunci.net","justjared.com","justpaste.top","justwatch.com","juventusfc.hu","k12reader.com","kacengeng.com","kakiagune.com","kalileaks.com","kanaeblog.net","kangkimin.com","katdrive.link","katestube.com","katmoviefix.*","kayoanime.com","kckingdom.com","kenta2222.com","kfapfakes.com","kfrfansub.com","kicaunews.com","kickcharm.com","kissasian.*>>","klaustube.com","klikmanga.com","kllproject.lv","klykradio.com","kobieta.wp.pl","kolnovel.site","koreanbj.club","korsrt.eu.org","kotanopan.com","kpopjjang.com","ksusports.com","kumascans.com","kupiiline.com","kuronavi.blog","kurosuen.live","lamorgues.com","laptrinhx.com","latinabbw.xyz","latinlucha.es","laurasia.info","lavoixdux.com","law101.org.za","learn-cpp.org","learnclax.com","lecceprima.it","leccotoday.it","leermanga.net","leinetal24.de","letmejerk.com","letras.mus.br","lewdstars.com","liberation.fr","liiivideo.com","likemanga.ink","lilymanga.net","ling-online.*","link4rev.site","linkfinal.com","linkskibe.com","linkspaid.com","linovelib.com","linuxhint.com","lippycorn.com","listeamed.net","litecoin.host","litonmods.com","liveonsat.com","livestreams.*","liveuamap.com","lolcalhost.ru","lolhentai.net","longfiles.com","lookmovie2.to","loot-link.com","lootlemon.com","loptelink.com","lordpremium.*","love4porn.com","lovetofu.cyou","lowellsun.com","lrtrojans.com","lsusports.net","ludigames.com","lulacloud.com","lustesthd.lat","lustholic.com","lusttaboo.com","lustteens.net","lustylist.com","lustyspot.com","luxusmail.org","m.viptube.com","m.youtube.com","maccanismi.it","macrumors.com","macserial.com","magesypro.com","mailnesia.com","mailocal2.xyz","mainbabes.com","mainlinks.xyz","mainporno.com","makeuseof.com","mamochki.info","manga-dbs.com","manga-tube.me","manga18fx.com","mangacrab.com","mangacrab.org","mangadass.com","mangafreak.me","mangahere.onl","mangakoma01.*","mangalist.org","mangarawjp.me","mangaread.org","mangasite.org","mangoporn.net","manhastro.com","manhastro.net","manhuatop.org","manhwatop.com","manofadan.com","map.naver.com","math-aids.com","mathcrave.com","mathebibel.de","mathsspot.com","matomeiru.com","maz-online.de","mconverter.eu","md3b0j6hj.com","mdfx9dc8n.net","mdy48tn97.com","medebooks.xyz","mediafire.com","mediamarkt.be","mediamarkt.de","mediapason.it","medihelp.life","mega-dvdrip.*","megagames.com","megane.com.pl","megawarez.org","megawypas.com","meineorte.com","meinestadt.de","memangbau.com","memedroid.com","menshealth.de","metalflirt.de","meteopool.org","metrolagu.cam","mettablog.com","meuanime.info","mexicogob.com","mh.baxoi.buzz","mhdsportstv.*","mhdtvsports.*","miohentai.com","miraculous.to","mirrorace.com","missav123.com","missav888.com","mitedrive.com","mixdrop21.net","mixdrop23.net","mixdropjmk.pw","mjakmama24.pl","mmastreams.me","mmorpg.org.pl","mobdi3ips.com","mobdropro.com","modelisme.com","mom-pussy.com","momxxxass.com","momxxxsex.com","moneyhouse.ch","monstream.org","monzatoday.it","moonquill.com","moovitapp.com","moozpussy.com","moregirls.org","morgenpost.de","mosttechs.com","motive213.com","motofan-r.com","motor-talk.de","motorbasar.de","motortests.de","moutogami.com","moviedekho.in","moviefone.com","moviehaxx.pro","moviejones.de","movielinkbd.*","moviepilot.de","movieping.com","movierulzhd.*","moviesdaweb.*","moviesite.app","moviesverse.*","moviexxx.mobi","mp3-gratis.it","mp3fusion.net","mp3juices.icu","mp4mania1.net","mp4upload.com","mrpeepers.net","mtech4you.com","mtg-print.com","mtraffics.com","multicanais.*","musicsite.biz","musikradar.de","myadslink.com","mydomaine.com","myfernweh.com","myflixertv.to","myhindigk.com","myhomebook.de","myicloud.info","myrecipes.com","myshopify.com","mysostech.com","mythvista.com","myvidplay.com","myvidster.com","myviptuto.com","myyouporn.com","naijahits.com","nakenprat.com","napolipiu.com","nastybulb.com","nation.africa","natomanga.com","naturalbd.com","nbcsports.com","ncdexlive.org","needrombd.com","neilpatel.com","nekolink.site","nekopoi.my.id","neoseeker.com","nesiaku.my.id","netcinebs.lat","netfilmes.org","netnaijas.com","nettiauto.com","neuepresse.de","neurotray.com","nevcoins.club","neverdims.com","newstopics.in","newyorker.com","newzjunky.com","nexusgames.to","nexusmods.com","nflstreams.me","nhvnovels.com","nicematin.com","nicomanga.com","nihonkuni.com","nin10news.com","nklinks.click","nlcosplay.com","noblocktape.*","noikiiki.info","noob4cast.com","noor-book.com","nordbayern.de","notevibes.com","nousdecor.com","nouvelobs.com","novamovie.net","novelcrow.com","novelroom.net","novizer.com>>","nsfwalbum.com","nsfwhowto.xyz","nudegista.com","nudistube.com","nuhuskies.com","nukibooks.com","nulledmug.com","nvimfreak.com","nwusports.com","odiadance.com","odiafresh.com","officedepot.*","ogoplayer.xyz","ohmybrush.com","ojogos.com.br","okhatrimaza.*","onemanhua.com","onlinegdb.com","onlyssh.my.id","onlystream.tv","op-marburg.de","openloadmov.*","ostreaming.tv","otakuliah.com","otakuporn.com","otonanswer.jp","ottawasun.com","ovcsports.com","owlsports.com","ozulscans.com","padovaoggi.it","pagalfree.com","pagalmovies.*","pagalworld.us","paidnaija.com","paipancon.com","panuvideo.com","paolo9785.com","parisporn.org","parmatoday.it","pasteboard.co","pasteflash.sx","pastelink.net","patchsite.net","pawastreams.*","pc-builds.com","pc-magazin.de","pclicious.net","peacocktv.com","peladas69.com","peliculas24.*","pelisflix20.*","pelisgratis.*","pelismart.com","pelisplusgo.*","pelisplushd.*","pelisplusxd.*","pelisstar.com","perplexity.ai","pervclips.com","pg-wuming.com","pianokafe.com","pic-upload.de","picbcxvxa.sbs","pichaloca.com","pics-view.com","pienovels.com","piraproxy.app","pirateproxy.*","pixbkghxa.sbs","pixbryexa.sbs","pixnbrqwg.sbs","pixtryab.shop","pkbiosfix.com","pkproject.net","play.aetv.com","player.stv.tv","player4me.vip","playfmovies.*","playpaste.com","plugincim.com","pocketnow.com","poco.rcccn.in","pokemundo.com","polska-ie.com","popcorntime.*","porn4fans.com","pornbaker.com","pornbimbo.com","pornblade.com","pornborne.com","pornchaos.org","pornchimp.com","porncomics.me","porncoven.com","porndollz.com","porndrake.com","pornfelix.com","pornfuzzy.com","pornloupe.com","pornmonde.com","pornoaffe.com","pornobait.com","pornocomics.*","pornoeggs.com","pornohaha.com","pornohans.com","pornohelm.com","pornokeep.com","pornoleon.com","pornomico.com","pornonline.cc","pornonote.pro","pornoplum.com","pornproxy.app","pornproxy.art","pornretro.xyz","pornslash.com","porntopic.com","porntube18.cc","posterify.net","pourcesoir.in","povaddict.com","powforums.com","pravda.com.ua","pregledaj.net","pressplay.cam","pressplay.top","prignitzer.de","primewire.*>>","proappapk.com","proboards.com","produktion.de","promiblogs.de","prostoporno.*","protestia.com","protopage.com","pureleaks.net","pussy-hub.com","pussyspot.net","putlockertv.*","puzzlefry.com","pvpoke-re.com","pygodblog.com","quesignifi.ca","quicasting.it","quickporn.net","rainytube.com","ranourano.xyz","rbscripts.net","read.amazon.*","readingbd.com","realbooru.com","realmadryt.pl","rechtslupe.de","redhdtube.xxx","redsexhub.com","reliabletv.me","repelisgooo.*","restorbio.com","reviewdiv.com","rexdlfile.com","rgeyyddl.skin","ridvanmau.com","riggosrag.com","ritzyporn.com","rocdacier.com","rockradio.com","rojadirecta.*","roms4ever.com","romsgames.net","romspedia.com","rossoporn.com","rottenlime.pw","roystream.com","rufiiguta.com","rule34.jp.net","rumbunter.com","ruyamanga.com","s.sseluxx.com","sagewater.com","sarapbabe.com","sassytube.com","savefiles.com","scatkings.com","scimagojr.com","scrapywar.com","scrolller.com","sendspace.com","seneporno.com","sensacine.com","seriesite.net","set.seturl.in","sex-babki.com","sexbixbox.com","sexbox.online","sexdicted.com","sexmazahd.com","sexmutant.com","sexphimhd.net","sextube-6.com","sexyscope.net","sexytrunk.com","sfastwish.com","sfirmware.com","shameless.com","share.hntv.tv","share1223.com","sharemods.com","sharkfish.xyz","sharphindi.in","shemaleup.net","short-fly.com","short1ink.com","shortlinkto.*","shortpaid.com","shorttrick.in","shownieuws.nl","shroomers.app","siimanga.cyou","simana.online","simplebits.io","simpmusic.org","sissytube.net","sitefilme.com","sitegames.net","sk8therapy.fr","skymovieshd.*","smartworld.it","smashkarts.io","snapwordz.com","socigames.com","softcobra.com","softfully.com","sohohindi.com","solarmovie.id","solarmovies.*","solotrend.net","songfacts.com","sosovalue.com","spankbang.com","spankbang.mov","speedporn.net","speedtest.net","speedweek.com","spfutures.org","spokesman.com","spontacts.com","sportbar.live","sportlemons.*","sportlemonx.*","sportowy24.pl","sportsbite.cc","sportsembed.*","sportsnest.co","sportsrec.com","sportweb.info","spring.org.uk","ssyoutube.com","stagemilk.com","stalkface.com","starsgtech.in","startpage.com","startseite.to","ster-blog.xyz","stock-rom.com","str8ongay.com","stre4mpay.one","stream-69.com","stream4free.*","streambtw.com","streamcloud.*","streamfree.to","streamhd247.*","streamobs.net","streampoi.com","streamporn.cc","streamsport.*","streamta.site","streamtp1.com","streamvid.net","strefaagro.pl","striptube.net","stylist.co.uk","subtitles.cam","subtorrents.*","suedkurier.de","sufanblog.com","sulleiman.com","sunporno.club","superstream.*","supervideo.tv","supforums.com","sweetgirl.org","swisscows.com","switch520.com","sylverkat.com","sysguides.com","szexkepek.net","szexvideok.hu","t-rocforum.de","tab-maker.com","taboodude.com","taigoforum.de","tamilarasan.*","tamilguns.org","tamilhit.tech","tapenoads.com","tatsublog.com","techacode.com","techclips.net","techdriod.com","techilife.com","technofino.in","techradar.com","techrecur.com","techtrim.tech","techybuff.com","techyrick.com","teenbabe.link","tehnotone.com","teknisitv.com","temp-mail.lol","temp-mail.org","tempumail.com","tennis.stream","ternitoday.it","terrylove.com","testsieger.de","texastech.com","thejournal.ie","thelayoff.com","thememypc.net","thenation.com","thespruce.com","thestreet.com","thetemp.email","thethings.com","thetravel.com","theuser.cloud","theweek.co.uk","thichcode.net","thiepmung.com","thotpacks.xyz","thotslife.com","thoughtco.com","tierfreund.co","tierlists.com","timescall.com","tinyzonetv.cc","tinyzonetv.se","tiz-cycling.*","tmohentai.com","to-travel.net","tok-thots.com","tokopedia.com","tokuzilla.net","topwwnews.com","torgranate.de","torrentz2eu.*","torupload.com","totalcsgo.com","totaldebrid.*","tourporno.com","towerofgod.me","trade2win.com","trailerhg.xyz","trangchu.news","transfaze.com","transflix.net","transtxxx.com","travelbook.de","tremamnon.com","tribeclub.com","tricksplit.io","trigonevo.com","tripsavvy.com","tsubasatr.org","tubehqxxx.com","tubemania.org","tubereader.me","tudigitale.it","tudotecno.com","tukipasti.com","tunabagel.net","tunemovie.fun","turkleech.com","tutcourse.com","tvfutbol.info","twink-hub.com","twstalker.com","txxxporn.tube","uberhumor.com","ubuntudde.com","udemyking.com","udinetoday.it","uhcougars.com","uicflames.com","uniqueten.net","unlockapk.com","unlockxh4.com","unnuetzes.com","unterhalt.net","up4stream.com","upfilesgo.com","uploadgig.com","uptoimage.com","urgayporn.com","utrockets.com","uwbadgers.com","vectorizer.io","vegamoviese.*","veoplanet.com","verhentai.top","vermoegen.org","vibestreams.*","vibraporn.com","vid-guard.com","vidaextra.com","videoplayer.*","vidora.stream","vidspeeds.com","vidstream.pro","viefaucet.com","villanova.com","vintagetube.*","vipergirls.to","vipserije.com","vipstand.pm>>","visionias.net","visnalize.com","vixenless.com","vkrovatku.com","voidtruth.com","voiranime1.fr","voirseries.io","vosfemmes.com","vpntester.org","vpzserver.com","vstplugin.net","vuinsider.com","w3layouts.com","waploaded.com","warezsite.net","watch.plex.tv","watchdirty.to","watchluna.com","watchmovies.*","watchseries.*","watchsite.net","watchtv24.com","wdpglobal.com","weatherwx.com","weirdwolf.net","wendycode.com","westmanga.org","wetpussy.sexy","wg-gesucht.de","whoreshub.com","widewifes.com","wikipekes.com","wikitechy.com","willcycle.com","windowspro.de","wkusports.com","wlz-online.de","wmoviesfree.*","wonderapk.com","wordshake.com","workink.click","world4ufree.*","worldfree4u.*","worldsports.*","worldstar.com","worldtop2.com","wowescape.com","wunderweib.de","wvusports.com","www.amazon.de","www.seznam.cz","www.twitch.tv","www.yahoo.com","x-fetish.tube","x-videos.name","xanimehub.com","xhbranch5.com","xhchannel.com","xhlease.world","xhplanet1.com","xhplanet2.com","xhvictory.com","xhwebsite.com","xmovies08.org","xnxxjapon.com","xoxocomic.com","xrivonet.info","xsportbox.com","xsportshd.com","xstory-fr.com","xxvideoss.org","xxx-image.com","xxxbunker.com","xxxcomics.org","xxxfree.watch","xxxhothub.com","xxxscenes.net","xxxvideo.asia","xxxvideor.com","y2meta-uk.com","yachtrevue.at","yandexcdn.com","yaoiotaku.com","ycongnghe.com","yesmovies.*>>","yesmovies4u.*","yeswegays.com","ymp4.download","yogitimes.com","youjizzz.club","youlife24.com","youngleak.com","youpornfm.com","youtubeai.com","yoyofilmeys.*","yt1s.com.co>>","yumekomik.com","zamundatv.com","zerotopay.com","zigforums.com","zinkmovies.in","zmamobile.com","zoompussy.com","zorroplay.xyz","0dramacool.net","111.90.141.252","111.90.150.149","111.90.159.132","1111fullwise.*","123animehub.cc","123moviefree.*","123movierulz.*","123movies4up.*","123moviesd.com","123movieshub.*","185.193.17.214","188.166.182.72","18girlssex.com","1cloudfile.com","1pack1goal.com","1primewire.com","1shortlink.com","1stkissmanga.*","3gpterbaru.com","3rabsports.com","4everproxy.com","69hoshudaana.*","69teentube.com","90fpsconfig.in","absolugirl.com","absolutube.com","admiregirls.su","adnan-tech.com","adsafelink.com","afilmywapi.biz","agedvideos.com","airsextube.com","akumanimes.com","akutsu-san.com","alexsports.*>>","alimaniacky.cz","allbbwtube.com","allcalidad.app","allcelebs.club","allmovieshub.*","allosoccer.com","allpremium.net","allrecipes.com","alluretube.com","allwpworld.com","almezoryae.com","alphaporno.com","amanguides.com","amateurfun.net","amateurporn.co","amigosporn.top","ancensored.com","anconatoday.it","androgamer.org","androidacy.com","ani-stream.com","anime4mega.net","animeblkom.net","animefire.info","animefire.plus","animeheaven.ru","animeindo.asia","animeshqip.org","animespank.com","animesvision.*","anonymfile.com","anyxvideos.com","aozoraapps.net","app.cekresi.me","appsfree4u.com","arab4media.com","arabincest.com","arabxforum.com","arealgamer.org","ariversegl.com","arlinadzgn.com","armyranger.com","articlebase.pk","artoffocas.com","ashemaletube.*","ashemaletv.com","asianporn.sexy","asianwatch.net","askpaccosi.com","askushowto.com","assesphoto.com","astro-seek.com","atlantic10.com","autocentrum.pl","autopareri.com","av1encodes.com","b3infoarena.in","balkanteka.net","bamahammer.com","bankshiksha.in","bantenexis.com","batmanstream.*","battleboats.io","bbwfuckpic.com","bcanepaltu.com","bcsnoticias.mx","bdsmstreak.com","bdsomadhan.com","bdstarshop.com","beegvideoz.com","belloporno.com","benzinpreis.de","best18porn.com","bestofarea.com","betaseries.com","bharian.com.my","bhugolinfo.com","bidersnotu.com","bildderfrau.de","bingotingo.com","bit-shares.com","bitcotasks.com","bitcrypto.info","bittukitech.in","blackcunts.org","blackteen.link","blocklayer.com","blowjobgif.net","bluedollar.net","boersennews.de","bolly-tube.com","bollywoodx.org","bonstreams.net","boobieblog.com","boobsradar.com","boobsrealm.com","boredgiant.com","boxaoffrir.com","brainknock.net","bravoteens.com","bravotube.asia","brightpets.org","brulosophy.com","btcadspace.com","btcsatoshi.net","btvnovinite.bg","buccaneers.com","buchstaben.com","businessua.com","bustmonkey.com","bustybloom.com","cacfutures.org","cadenadial.com","calculate.plus","calgarysun.com","camgirlbay.net","camgirlfap.com","camsstream.com","canalporno.com","caracol.com.co","cardscanner.co","carrnissan.com","casertanews.it","celebjihad.com","celebwhore.com","cellmapper.net","cesenatoday.it","chachocool.com","chanjaeblog.jp","chart.services","chatgptfree.ai","chaturflix.cam","cheatermad.com","chietitoday.it","cimanow.online","cine-calidad.*","cinelatino.net","cinemalibero.*","cinepiroca.com","claimcrypto.cc","claimlite.club","clasicotas.org","clicknupload.*","clipartmax.com","cloudflare.com","cloudvideotv.*","club-flank.com","codeandkey.com","coinadpro.club","coloradoan.com","comdotgame.com","comicsarmy.com","comixzilla.com","commanders.com","compromath.com","comunio-cl.com","convert2mp3.cx","coolrom.com.au","copyseeker.net","courseboat.com","coverapi.space","coverapi.store","crackshash.com","cracksports.me","crazygames.com","crazyvidup.com","creebhills.com","crichdplays.ru","cricwatch.io>>","crunchyscan.fr","crypt.cybar.to","cryptoforu.org","cryptonetos.ru","cryptotech.fun","cryptstream.de","csgo-ranks.com","cuckoldsex.net","curseforge.com","cwtvembeds.com","cyberscoop.com","czechvideo.org","dagensnytt.com","dailylocal.com","dallasnews.com","dansmovies.com","daotranslate.*","daxfutures.org","dayuploads.com","ddwloclawek.pl","defenseone.com","delcotimes.com","derstandard.at","derstandard.de","desicinema.org","desicinemas.pk","designbump.com","desiremovies.*","desktophut.com","devdrive.cloud","deviantart.com","diampokusy.com","dicariguru.com","dieblaue24.com","digipuzzle.net","direct-cloud.*","dirtytamil.com","disneyplus.com","dobletecno.com","dodgersway.com","dogsexporn.net","doseofporn.com","dotesports.com","dotfreesex.com","dotfreexxx.com","doujinnote.com","dowfutures.org","downloadming.*","drakecomic.com","dreamfancy.org","duniailkom.com","dvdgayporn.com","dvdporngay.com","e123movies.com","easytodoit.com","eatingwell.com","ebooksyard.com","ecacsports.com","echo-online.de","ed-protect.org","eddiekidiw.com","eftacrypto.com","elcorreoweb.es","electomania.es","elitegoltv.org","elitetorrent.*","elmalajeno.com","elnacional.cat","emailnator.com","embedsports.me","embedstream.me","empire-anime.*","emturbovid.com","emugameday.com","enryumanga.com","ensuretips.com","epicstream.com","epornstore.com","ericdraken.com","erinsakura.com","erokomiksi.com","eroprofile.com","esgentside.com","esportivos.fun","este-walks.net","estrenosflix.*","estrenosflux.*","ethiopia.co.il","examscisco.com","exbulletin.com","expertplay.net","exteenporn.com","extratorrent.*","extreme-down.*","eztvtorrent.co","f123movies.com","faaduindia.com","fairyanime.com","fakazagods.com","fakedetail.com","fanatik.com.tr","fantacalcio.it","fap-nation.org","faperplace.com","faselhdwatch.*","fastdour.store","fatxxxtube.com","faucetdump.com","fduknights.com","fetishburg.com","fettspielen.de","fhmemorial.com","fibwatch.store","filemirage.com","fileplanet.com","filesharing.io","filesupload.in","film-adult.com","filme-bune.biz","filmpertutti.*","filmy4waps.org","filmypoints.in","filmyzones.com","filtercams.com","finanztreff.de","finderporn.com","findtranny.com","fine-wings.com","firefaucet.win","fitdynamos.com","fleamerica.com","flostreams.xyz","flycutlink.com","fmoonembed.pro","foodgustoso.it","foodiesjoy.com","foodtechnos.in","football365.fr","fooxybabes.com","forex-trnd.com","freeforums.net","freegayporn.me","freehqtube.com","freeltc.online","freemodsapp.in","freepasses.org","freepdfcomic.*","freepreset.net","freesoccer.net","freesolana.top","freetubetv.net","freiepresse.de","freshplaza.com","freshremix.net","frostytube.com","fu-1abozhcd.nl","fu-1fbolpvq.nl","fu-4u3omzw0.nl","fu-e4nzgj78.nl","fu-m03aenr9.nl","fu-mqsng72r.nl","fu-p6pwkgig.nl","fu-pl1lqloj.nl","fu-v79xn6ct.nl","fu-ys0tjjs1.nl","fucktube4k.com","fuckundies.com","fullporner.com","fullvoyeur.com","gadgetbond.com","gamefi-mag.com","gameofporn.com","games.amny.com","games.insp.com","games.metro.us","games.metv.com","games.wtop.com","games2rule.com","games4king.com","gamesgames.com","gamesleech.com","gayforfans.com","gaypornhot.com","gayxxxtube.net","gazettenet.com","gdr-online.com","gdriveplayer.*","gecmisi.com.tr","genovatoday.it","getintopcm.com","getintoway.com","getmaths.co.uk","gettapeads.com","getthispdf.com","gigacourse.com","gisvacancy.com","gknutshell.com","gloryshole.com","goalsport.info","gobearcats.com","gofirmware.com","goislander.com","golightsgo.com","gomoviesfree.*","gomovieshub.io","goodreturns.in","goodstream.one","googlvideo.com","gorecenter.com","gorgeradio.com","goshockers.com","gostanford.com","gostreamon.net","goterriers.com","gotgayporn.com","gotigersgo.com","gourmandix.com","gousfbulls.com","govtportal.org","grannysex.name","grantorrent1.*","grantorrents.*","graphicget.com","grubstreet.com","guitarnick.com","gujjukhabar.in","gurbetseli.net","guruofporn.com","gutfuerdich.co","gyanitheme.com","gyonlineng.com","hairjob.wpx.jp","haloursynow.pl","hanime1-me.top","hannibalfm.net","hardcorehd.xxx","haryanaalert.*","hausgarten.net","hawtcelebs.com","hdhub4one.pics","hdmovies23.com","hdmoviesfair.*","hdmoviesflix.*","hdmoviesmaza.*","hdpornteen.com","healthelia.com","healthmyst.com","hentai-for.net","hentai-hot.com","hentai-one.com","hentaiasmr.moe","hentaiblue.net","hentaibros.com","hentaicity.com","hentaidays.com","hentaihere.com","hentaipins.com","hentairead.com","hentaisenpai.*","hentaiworld.tv","heysigmund.com","hidefninja.com","hilaryhahn.com","hinatasoul.com","hindilinks4u.*","hindimovies.to","hindiporno.pro","hit-erotic.com","hollymoviehd.*","homebooster.de","homeculina.com","hortidaily.com","hotcleaner.com","hotgirlhub.com","hotgirlpix.com","howtocivil.com","hpaudiobooks.*","hyogo.ie-t.net","hypershort.com","i123movies.net","iconmonstr.com","idealfollow.in","idlelivelink.*","ilifehacks.com","ilikecomix.com","imagetwist.com","imgjbxzjv.shop","imgjmgfgm.shop","imgjvmbbm.shop","imgnnnvbrf.sbs","inbbotlist.com","indi-share.com","indiainfo4u.in","indiatimes.com","indopanas.cyou","infocycles.com","infokita17.com","infomaniakos.*","informacion.es","inhumanity.com","insidenova.com","instaporno.net","ios.codevn.net","iqksisgw.xyz>>","isekaitube.com","issstories.xyz","itopmusics.com","itopmusicx.com","iuhoosiers.com","jacksorrell.tv","jalshamoviez.*","janamathaya.lk","japannihon.com","japantaboo.com","javaguides.net","javbangers.com","javggvideo.xyz","javhdvideo.org","javheroine.com","javplayers.com","javsexfree.com","javsubindo.com","javtsunami.com","javxxxporn.com","jeniusplay.com","jewelry.com.my","jizzbunker.com","join2babes.com","joyousplay.xyz","jpopsingles.eu","juegoviejo.com","jugomobile.com","juicy3dsex.com","justababes.com","justembeds.xyz","justthegays.tv","kaboomtube.com","kahanighar.com","kakarotfoot.ru","kannadamasti.*","kashtanka2.com","keepkoding.com","kendralist.com","kgs-invest.com","khabarbyte.com","kickassanime.*","kickasshydra.*","kiddyshort.com","kindergeld.org","kingofdown.com","kiradream.blog","kisahdunia.com","kits4beats.com","klartext-ne.de","kokostream.net","komikmanhwa.me","kompasiana.com","kordramass.com","kurakura21.com","kuruma-news.jp","ladkibahin.com","lampungway.com","laprovincia.es","laradiobbs.net","laser-pics.com","latinatoday.it","lauradaydo.com","layardrama21.*","leaderpost.com","leakedzone.com","leakshaven.com","learnospot.com","lebahmovie.com","ledauphine.com","lesboluvin.com","lesfoodies.com","letmejerk2.com","letmejerk3.com","letmejerk4.com","letmejerk5.com","letmejerk6.com","letmejerk7.com","lewdcorner.com","lifehacker.com","ligainsider.de","limetorrents.*","linemarlin.com","link.vipurl.in","linkconfig.com","livenewsof.com","lizardporn.com","login.asda.com","lokhung888.com","lookmovie186.*","ludwig-van.com","lulustream.com","m.liputan6.com","mactechnews.de","macworld.co.uk","mad4wheels.com","madchensex.com","madmaxworld.tv","mahitimanch.in","mail.yahoo.com","main-spitze.de","maliekrani.com","manga4life.com","mangamovil.net","manganatos.com","mangaraw18.net","mangarawad.fit","mangareader.to","manhuarmtl.com","manhuascan.com","manhwaclub.net","manhwalist.com","manhwaread.com","marketbeat.com","masteranime.tv","mathepower.com","maths101.co.za","matureworld.ws","mcafee-com.com","mega-debrid.eu","megacanais.com","megalinks.info","megamovies.org","megapastes.com","mehr-tanken.de","mejortorrent.*","mercato365.com","meteologix.com","mewingzone.com","milanotoday.it","milanworld.net","milffabrik.com","minecraft.buzz","minorpatch.com","mixmods.com.br","mixrootmod.com","mjsbigblog.com","mkv-pastes.com","mobileporn.cam","mockupcity.com","modapkfile.com","moddedguru.com","modenatoday.it","moderngyan.com","moegirl.org.cn","mommybunch.com","mommysucks.com","momsextube.pro","mortaltech.com","motchill29.com","motherless.com","motogpstream.*","motorgraph.com","motorsport.com","motscroises.fr","movearnpre.com","moviefree2.com","movies2watch.*","moviesapi.club","movieshd.watch","moviesjoy-to.*","moviesjoyhd.to","moviesnation.*","movisubmalay.*","mtsproducoes.*","multiplayer.it","mummumtime.com","musketfire.com","mxpacgroup.com","mycoolmoviez.*","mydesibaba.com","myforecast.com","myglamwish.com","mylifetime.com","mynewsmedia.co","mypornhere.com","myporntape.com","mysexgamer.com","mysexgames.com","myshrinker.com","mytectutor.com","naasongsfree.*","naijauncut.com","nammakalvi.com","naszemiasto.pl","navysports.com","nazarickol.com","nensaysubs.net","neonxcloud.top","neservicee.com","netchimp.co.uk","new.lewd.ninja","newmovierulz.*","newsbreak24.de","newscard24.com","ngontinh24.com","nicheporno.com","nichetechy.com","nikaplayer.com","ninernoise.com","nirjonmela.com","nishankhatri.*","niteshyadav.in","nitro-link.com","nitroflare.com","niuhuskies.com","nodenspace.com","nosteam.com.ro","notunmovie.net","notunmovie.org","novaratoday.it","novel-gate.com","novelaplay.com","novelgames.com","novostrong.com","nowosci.com.pl","nudebabes.sexy","nulledbear.com","nulledteam.com","nullforums.net","nulljungle.com","nurulislam.org","nylondolls.com","ocregister.com","officedepot.fr","oggitreviso.it","okamimiost.com","omegascans.org","onlineatlas.us","onlinekosh.com","onlineporno.cc","onlybabes.site","openstartup.tm","opentunnel.net","oregonlive.com","organismes.org","orgasmlist.com","orgyxxxhub.com","orovillemr.com","osubeavers.com","osuskinner.com","oteknologi.com","ourenseando.es","overhentai.net","palapanews.com","palofw-lab.com","pandamovies.me","pandamovies.pw","pandanote.info","pantieshub.net","panyshort.link","papafoot.click","paradepets.com","paris-tabi.com","paste-drop.com","paylaterin.com","peachytube.com","pelismartv.com","pelismkvhd.com","pelispedia24.*","pelispoptv.com","perfectgirls.*","perfektdamen.*","pervertium.com","perverzija.com","pethelpful.com","petitestef.com","pherotruth.com","phoneswiki.com","picgiraffe.com","picjgfjet.shop","pickleball.com","pictryhab.shop","picturelol.com","pimylifeup.com","pink-sluts.net","pinterpoin.com","pirate4all.com","pirateblue.com","pirateblue.net","pirateblue.org","piratemods.com","pivigames.blog","planetsuzy.org","platinmods.com","play-games.com","playcast.click","player-cdn.com","player.rtl2.de","player.sbnmp.*","playermeow.com","playertv24.com","playhydrax.com","podkontrola.pl","polsatsport.pl","polskatimes.pl","pop-player.com","popno-tour.net","porconocer.com","porn0video.com","pornahegao.xyz","pornasians.pro","pornerbros.com","pornflixhd.com","porngames.club","pornharlot.net","pornhd720p.com","pornincest.net","pornissimo.org","pornktubes.net","pornodavid.com","pornodoido.com","pornofelix.com","pornofisch.com","pornojenny.net","pornoperra.com","pornopics.site","pornoreino.com","pornotommy.com","pornotrack.net","pornozebra.com","pornrabbit.com","pornrewind.com","pornsocket.com","porntrex.video","porntube15.com","porntubegf.com","pornvideoq.com","pornvintage.tv","portaldoaz.org","portalyaoi.com","poscitechs.lol","powerover.site","premierftp.com","prepostseo.com","pressemedie.dk","primagames.com","primemovies.pl","primevid.click","primevideo.com","proapkdown.com","pruefernavi.de","purepeople.com","pussyspace.com","pussyspace.net","pussystate.com","put-locker.com","putingfilm.com","queerdiary.com","querofilmehd.*","questloops.com","quotesopia.com","rabbitsfun.com","radiotimes.com","radiotunes.com","rahim-soft.com","ramblinfan.com","rankersadda.in","rapid-cloud.co","ravenscans.com","rbxscripts.net","realbbwsex.com","realgfporn.com","realmoasis.com","realmomsex.com","realsimple.com","record-bee.com","recordbate.com","redecanaistv.*","redfaucet.site","rednowtube.com","redpornnow.com","redtubemov.com","reggiotoday.it","reisefrage.net","resortcams.com","revealname.com","reviersport.de","reviewrate.net","revivelink.com","richtoscan.com","riminitoday.it","ringelnatz.net","ripplehub.site","rlxtech24h.com","rmacsports.org","roadtrippin.fr","robbreport.com","rokuhentai.com","rollrivers.com","rollstroll.com","romaniasoft.ro","romhustler.org","royaledudes.io","rpmplay.online","rubyvidhub.com","rugbystreams.*","ruinmyweek.com","russland.jetzt","rusteensex.com","ruyashoujo.com","safefileku.com","safemodapk.com","samaysawara.in","sanfoundry.com","saratogian.com","sat.technology","sattaguess.com","saveshared.com","savevideo.tube","sciencebe21.in","scoreland.name","scrap-blog.com","screenflash.io","screenrant.com","scriptsomg.com","scriptsrbx.com","scriptzhub.com","section215.com","seeitworks.com","seekplayer.vip","seirsanduk.com","seksualios.com","selfhacked.com","serienstream.*","series2watch.*","seriesonline.*","seriesperu.com","seriesyonkis.*","serijehaha.com","severeporn.com","sex-empire.org","sex-movies.biz","sexcams-24.com","sexgamescc.com","sexgayplus.com","sextubedot.com","sextubefun.com","sextubeset.com","sexvideos.host","sexyaporno.com","sexybabes.club","sexybabesz.com","sexynakeds.com","sgvtribune.com","shahid.mbc.net","sharedwebs.com","shazysport.pro","sheamateur.com","shegotass.info","sheikhmovies.*","shesfreaky.com","shinobijawi.id","shooshtime.com","shop123.com.tw","short-url.link","shorterall.com","shrinkearn.com","shueisharaw.tv","shupirates.com","sieutamphim.me","siliconera.com","singjupost.com","sitarchive.com","sitemini.io.vn","siusalukis.com","skat-karten.de","slickdeals.net","slideshare.net","smartinhome.pl","smarttrend.xyz","smiechawatv.pl","snhupenmen.com","solidfiles.com","soranews24.com","soundboards.gg","spaziogames.it","speedostream.*","speisekarte.de","spiele.bild.de","spieletipps.de","spiritword.net","spoilerplus.tv","sporteurope.tv","sportsdark.com","sportsonline.*","sportsurge.net","spy-x-family.*","stadelahly.net","stahnivideo.cz","standard.co.uk","stardewids.com","starzunion.com","stbemuiptv.com","steamverde.net","stireazilei.eu","storiesig.info","storyblack.com","stownrusis.com","stream2watch.*","streamdesi.com","streamecho.top","streamlord.com","streamruby.com","stripehype.com","studydhaba.com","subtitleone.cc","subtorrents1.*","super-games.cz","superanimes.in","suvvehicle.com","svetserialu.io","svetserialu.to","swatchseries.*","swordalada.org","tainhanhvn.com","talkceltic.net","talkjarvis.com","tamilnaadi.com","tamilprint29.*","tamilprint30.*","tamilprint31.*","tamilprinthd.*","taradinhos.com","tarnkappe.info","taschenhirn.de","tech-blogs.com","tech-story.net","techhelpbd.com","techiestalk.in","techkeshri.com","techmyntra.net","techperiod.com","techsignin.com","techsslash.com","tecnoaldia.net","tecnobillo.com","tecnoscann.com","tecnoyfoto.com","teenager365.to","teenextrem.com","teenhubxxx.com","teensexass.com","tekkenmods.com","telemagazyn.pl","telesrbija.com","temp.modpro.co","tennisactu.net","testserver.pro","textograto.com","textovisia.com","texturecan.com","theargus.co.uk","theavtimes.com","thefantazy.com","theflixertv.to","thehesgoal.com","themeslide.com","thenetnaija.co","thepiratebay.*","theporngod.com","therichest.com","thesextube.net","thetakeout.com","thethothub.com","thetimes.co.uk","thevideome.com","thewambugu.com","thotchicks.com","titsintops.com","tojimangas.com","tomshardware.*","topcartoons.tv","topsporter.net","topwebgirls.eu","torinotoday.it","tormalayalam.*","torontosun.com","torovalley.net","torrentmac.net","totalsportek.*","tournguide.com","tous-sports.ru","towerofgod.top","toyokeizai.net","tpornstars.com","trafficnews.jp","trancehost.com","trannyline.com","trashbytes.net","traumporno.com","travelhost.com","treehugger.com","trendflatt.com","trentonian.com","trentotoday.it","tribunnews.com","tronxminer.com","truckscout24.*","tuberzporn.com","tubesafari.com","tubexxxone.com","tukangsapu.net","turbocloud.xyz","turkish123.com","tv-films.co.uk","tv.youtube.com","tvspielfilm.de","twincities.com","u123movies.com","ucfknights.com","uciteljica.net","uclabruins.com","ufreegames.com","uiuxsource.com","uktvplay.co.uk","unblocked.name","unblocksite.pw","uncpbraves.com","uncwsports.com","unlvrebels.com","uoflsports.com","uploadbank.com","uploadking.net","uploadmall.com","uploadraja.com","upnewsinfo.com","uptostream.com","urlbluemedia.*","urldecoder.org","usctrojans.com","usdtoreros.com","usersdrive.com","utepminers.com","uyduportal.net","v2movies.click","vavada5com.com","vbox7-mp3.info","vedamdigi.tech","vegamovies4u.*","vegamovvies.to","veo-hentai.com","vestimage.site","video-seed.xyz","video1tube.com","videogamer.com","videolyrics.in","videos1002.com","videoseyred.in","videosgays.net","vidguardto.xyz","vidhidepre.com","vidhidevip.com","vidstreams.net","view.ceros.com","viewmature.com","vikistream.com","viralpedia.pro","visortecno.com","vmorecloud.com","voiceloves.com","voipreview.org","voltupload.com","voyeurblog.net","vulgarmilf.com","vviruslove.com","wantmature.com","warefree01.com","watch-series.*","watchasians.cc","watchomovies.*","watchpornx.com","watchseries1.*","watchseries9.*","wcoanimedub.tv","wcoanimesub.tv","wcoforever.net","webseries.club","weihnachten.me","wenxuecity.com","westmanga.info","wetteronline.*","whatfontis.com","whatismyip.com","whats-new.cyou","whatshowto.com","whodatdish.com","whoisnovel.com","wiacsports.com","wifi4games.com","windbreaker.me","wizhdsports.fi","wkutickets.com","wmubroncos.com","womennaked.net","wordpredia.com","world4ufree1.*","worldofbin.com","worthcrete.com","wow-mature.com","wowxxxtube.com","wspolczesna.pl","wsucougars.com","www-y2mate.com","www.amazon.com","www.lenovo.com","www.reddit.com","www.tiktok.com","x2download.com","xanimeporn.com","xclusivejams.*","xdld.pages.dev","xerifetech.com","xfrenchies.com","xhofficial.com","xhomealone.com","xhwebsite5.com","xiaomi-miui.gr","xmegadrive.com","xnxxporn.video","xxx-videos.org","xxxbfvideo.net","xxxblowjob.pro","xxxdessert.com","xxxextreme.org","xxxtubedot.com","xxxtubezoo.com","xxxvideohd.net","xxxxselfie.com","xxxymovies.com","xxxyoungtv.com","yabaisub.cloud","yakisurume.com","yelitzonpc.com","yomucomics.com","yottachess.com","youngbelle.net","youporngay.com","youtubetomp3.*","yoututosjeff.*","yuki0918kw.com","yumstories.com","yunakhaber.com","zazzybabes.com","zertalious.xyz","zippyshare.day","zona-leros.com","zonebourse.com","zooredtube.com","10hitmovies.com","123movies-org.*","123moviesfree.*","123moviesfun.is","18-teen-sex.com","18asiantube.com","18porncomic.com","18teen-tube.com","1direct-cloud.*","1vid1shar.space","3xamatorszex.hu","4allprograms.me","5masterzzz.site","6indianporn.com","admediaflex.com","adminreboot.com","adrianoluis.net","adrinolinks.com","advicefunda.com","aeroxplorer.com","aflizmovies.com","agrarwetter.net","ai.hubtoday.app","aitoolsfree.org","alanyapower.com","aliezstream.pro","allclassic.porn","alldeepfake.ink","alldownplay.xyz","allotech-dz.com","allpussynow.com","alltechnerd.com","allucanheat.com","amazon-love.com","amritadrino.com","anallievent.com","androidapks.biz","androidsite.net","androjungle.com","anime-sanka.com","anime7.download","animedao.com.ru","animenew.com.br","animesexbar.com","animesultra.net","animexxxsex.com","antenasports.ru","aoashimanga.com","apfelpatient.de","apkmagic.com.ar","app.blubank.com","arabshentai.com","arcadepunks.com","archivebate.com","archiwumalle.pl","argio-logic.net","asia.5ivttv.vip","asiangaysex.net","asianhdplay.net","askcerebrum.com","astrumscans.xyz","atemporal.cloud","atleticalive.it","atresplayer.com","au-di-tions.com","auto-service.de","autoindustry.ro","automat.systems","automothink.com","avoiderrors.com","awdescargas.com","azcardinals.com","babesaround.com","babesinporn.com","babesxworld.com","badgehungry.com","bangpremier.com","baylorbears.com","bdsm-photos.com","bdsmkingdom.xyz","bdsmporntub.com","bdsmwaytube.com","beammeup.com.au","bedavahesap.org","beingmelody.com","bellezashot.com","bengalisite.com","bengalxpress.in","bentasker.co.uk","best-shopme.com","best18teens.com","bestialporn.com","beurettekeh.com","bgmateriali.com","bgmi32bitapk.in","bgsufalcons.com","bibliopanda.com","big12sports.com","bigboobs.com.es","bigtitslust.com","bike-urious.com","bintangplus.com","biologianet.com","blackavelic.com","blackpornhq.com","blacksexmix.com","blogenginee.com","blogpascher.com","blowxxxtube.com","bluebuddies.com","bluedrake42.com","bluemanhoop.com","bluemediafile.*","bluemedialink.*","bluemediaurls.*","bokepsin.in.net","bolly4umovies.*","bollydrive.rest","boobs-mania.com","boobsforfun.com","bookpraiser.com","boosterx.stream","boxingstream.me","boxingvideo.org","boyfriendtv.com","braziliannr.com","bresciatoday.it","brieffreunde.de","brother-usa.com","buffsports.io>>","buffstreamz.com","buickforums.com","bulbagarden.net","bunkr-albums.io","burningseries.*","buzzheavier.com","camwhoreshd.com","camwhorespy.com","camwhorez.video","captionpost.com","carbonite.co.za","casutalaurei.ro","cataniatoday.it","catchthrust.net","cempakajaya.com","cerberusapp.com","chatropolis.com","cheatglobal.com","check-imei.info","cheese-cake.net","cherrynudes.com","chromeready.com","cieonline.co.uk","cinemakottaga.*","cineplus123.org","citibank.com.sg","ciudadgamer.com","claimclicks.com","classicoder.com","classifarms.com","cloud9obits.com","cloudnestra.com","code-source.net","codeitworld.com","codemystery.com","codeproject.com","coloringpage.eu","comicsporno.xxx","comoinstalar.me","compucalitv.com","computerbild.de","consoleroms.com","coromon.wiki.gg","cosplaynsfw.xyz","cpomagazine.com","cracking-dz.com","crackthemes.com","crazyashwin.com","crazydeals.live","creditsgoal.com","crunchyroll.com","crunchytech.net","cryptoearns.com","cta-fansite.com","cubbiescrib.com","cumshotlist.com","cutiecomics.com","cyberlynews.com","cybertechng.com","cyclingnews.com","cycraracing.com","daemonanime.net","daily-times.com","dailyangels.com","dailybreeze.com","dailycaller.com","dailycamera.com","dailyecho.co.uk","dailyknicks.com","dailymail.co.uk","dailymotion.com","dailypost.co.uk","dailystar.co.uk","dark-gaming.com","dawindycity.com","db-creation.net","dbupatriots.com","dbupatriots.org","deathonnews.com","decomaniacos.es","definitions.net","desbloqueador.*","descargas2020.*","desirenovel.com","desixxxtube.org","detikbangka.com","deutschsex.mobi","devopslanka.com","dhankasamaj.com","digiztechno.com","diminimalis.com","direct-cloud.me","dirtybadger.com","discoveryplus.*","diversanews.com","dlouha-videa.cz","dobleaccion.xyz","docs.google.com","dollarindex.org","domainwheel.com","donnaglamour.it","donnerwetter.de","dopomininfo.com","dota2freaks.com","dotadostube.com","downphanmem.com","drake-scans.com","drakerelays.org","drama-online.tv","dramanice.video","dreamcheeky.com","drinksmixer.com","driveplayer.net","droidmirror.com","dtbps3games.com","duplex-full.lol","eaglesnovel.com","easylinkref.com","ebaticalfel.com","editorsadda.com","edmontonsun.com","edumailfree.com","eksporimpor.com","elektrikmen.com","elpasotimes.com","elperiodico.com","embed.acast.com","embed.meomeo.pw","embedcanais.com","embedplayer.xyz","embedsports.top","embedstreams.me","emperorscan.com","empire-stream.*","engstreams.shop","enryucomics.com","erotikclub35.pw","esportsmonk.com","esportsnext.com","exactpay.online","exam-results.in","explorecams.com","explorosity.net","exporntoons.net","exposestrat.com","extratorrents.*","fabioambrosi.it","fapfapgames.com","farmeramania.de","faselhd-watch.*","fastcompany.com","faucetbravo.fun","fcportables.com","fellowsfilm.com","femdomworld.com","femjoybabes.com","feral-heart.com","fidlarmusic.com","file-upload.net","file-upload.org","file.gocmod.com","filecrate.store","filehost9.com>>","filespayout.com","filmesonlinex.*","filmoviplex.com","filmy4wap.co.in","filmyzilla5.com","finalnews24.com","financebolo.com","financemonk.net","financewada.com","financeyogi.net","finanzfrage.net","findnewjobz.com","fingerprint.com","firmenwissen.de","fitnesstipz.com","fiveyardlab.com","fizzlefacts.com","fizzlefakten.de","flashsports.org","flordeloto.site","flyanimes.cloud","flygbussarna.se","flywareagle.com","folgenporno.com","foodandwine.com","footyhunter.lol","forex-yours.com","foxseotools.com","freebitcoin.win","freebnbcoin.com","freecardano.com","freecourse.tech","freecricket.net","freegames44.com","freemockups.org","freeomovie.info","freepornjpg.com","freepornsex.net","freethemesy.com","freevpshere.com","freewebcart.com","french-stream.*","fsportshd.xyz>>","ftsefutures.org","fu-12qjdjqh.lol","fu-c66heipu.lol","fu-hbr4fzp4.lol","fu-hjyo3jqu.lol","fu-l6d0ptc6.lol","fuckedporno.com","fullxxxporn.net","fztvseries.live","g-streaming.com","gadgetspidy.com","gadzetomania.pl","gamecopyworld.*","gameplayneo.com","gamersglobal.de","games.macon.com","games.word.tips","gamesaktuell.de","gamestorrents.*","gaminginfos.com","gamingvital.com","gartendialog.de","gayboystube.top","gaypornhdfree.*","gaypornlove.net","gaypornwave.com","gayvidsclub.com","gazetaprawna.pl","geiriadur.ac.uk","geissblog.koeln","gendatabase.com","georgiadogs.com","germanvibes.org","gesund-vital.de","getexploits.com","gewinnspiele.tv","gfx-station.com","girlssexxxx.com","givemeaporn.com","givemesport.com","glavmatures.com","globaldjmix.com","go.babylinks.in","gocreighton.com","goexplorers.com","gofetishsex.com","gofile.download","gogoanime.co.in","goislanders.com","gokushiteki.com","golderotica.com","golfchannel.com","gomacsports.com","gomarquette.com","gopsusports.com","goxxxvideos.com","goyoungporn.com","gradehgplus.com","grandmatube.pro","grannyfucko.com","grasshopper.com","greattopten.com","grootnovels.com","gsmfirmware.net","gsmfreezone.com","gsmmessages.com","gut-erklaert.de","hacksnation.com","halohangout.com","handypornos.net","hanimesubth.com","hardcoreluv.com","hardwareluxx.de","hardxxxmoms.com","harshfaucet.com","hd-analporn.com","hd-easyporn.com","hdjavonline.com","hds-streaming.*","healthfatal.com","heavyfetish.com","heidelberg24.de","helicomicro.com","hentai-moon.com","hentai-senpai.*","hentai2read.com","hentaiarena.com","hentaibatch.com","hentaibooty.com","hentaicloud.com","hentaicovid.org","hentaifreak.org","hentaigames.app","hentaihaven.com","hentaihaven.red","hentaihaven.vip","hentaihaven.xxx","hentaiporno.xxx","hentaipulse.com","hentaitube1.lol","heroine-xxx.com","hesgoal-live.io","hiddencamhd.com","hindinews360.in","hokiesports.com","hollaforums.com","hollymoviehd.cc","hollywoodpq.com","hookupnovel.com","hostserverz.com","hot-cartoon.com","hotgameplus.com","hotmediahub.com","hotpornfile.org","hotsexstory.xyz","hotstunners.com","hotxxxpussy.com","hqxxxmovies.com","hscprojects.com","hypicmodapk.org","iban-rechner.de","ibcomputing.com","ibeconomist.com","ideal-teens.com","ikramlar.online","ilbassoadige.it","ilgazzettino.it","illicoporno.com","ilmessaggero.it","ilsole24ore.com","imagelovers.com","imgqnnnebrf.sbs","incgrepacks.com","indiakablog.com","infrafandub.com","inside-handy.de","instabiosai.com","insuredhome.org","interracial.com","investcrust.com","inyatrust.co.in","iptvjournal.com","italianoxxx.com","itsonsitetv.com","iwantmature.com","januflix.expert","japangaysex.com","japansporno.com","japanxxxass.com","jastrzabpost.pl","jav-torrent.org","javcensored.net","javenglish.cc>>","javindosub.site","javmoviexxx.com","javpornfull.com","javraveclub.com","javteentube.com","javtrailers.com","jaysjournal.com","jetztspielen.de","jnvharidwar.org","jobslampung.net","johntryopen.com","jokerscores.com","just-upload.com","kabarportal.com","karaoketexty.cz","kasvekuvvet.net","katmoviehd4.com","kattannonser.se","kawarthanow.com","keezmovies.surf","ketoconnect.net","ketubanjiwa.com","kickass-anime.*","kickassanime.ch","kiddyearner.com","kingsleynyc.com","kisshentaiz.com","kitabmarkaz.xyz","kittycatcam.com","kodewebsite.com","komikdewasa.art","komorkomania.pl","krakenfiles.com","kreiszeitung.de","krktcountry.com","kstorymedia.com","kurierverlag.de","kyoto-kanko.net","la123movies.org","langitmovie.com","laptechinfo.com","latinluchas.com","lavozdigital.es","ldoceonline.com","learnedclub.com","lecrabeinfo.net","legionscans.com","lendrive.web.id","lesbiansex.best","levante-emv.com","libertycity.net","librasol.com.br","liga3-online.de","lightsnovel.com","link.3dmili.com","link.asiaon.top","link.cgtips.org","link.codevn.net","linksheild.site","linkss.rcccn.in","linkvertise.com","linux-talks.com","live.arynews.tv","livescience.com","livesport24.net","livestreames.us","livestreamtv.pk","livexscores.com","livingathome.de","livornotoday.it","lombardiave.com","lookmoviess.com","looptorrent.org","lotusgamehd.xyz","lovelynudez.com","lovingsiren.com","luchaonline.com","lucrebem.com.br","lukesitturn.com","lulustream.live","lustesthd.cloud","lycee-maroc.com","macombdaily.com","macrotrends.net","magdownload.org","maisonbrico.com","mangahentai.xyz","mangahere.today","mangakakalot.gg","mangaonline.fun","mangaraw1001.cc","mangarawjp.asia","mangarussia.com","manhuarmmtl.com","manhwahentai.me","manoramamax.com","mantrazscan.com","marie-claire.es","marimo-info.net","marketmovers.it","maskinbladet.dk","mastakongo.info","mathsstudio.com","mathstutor.life","maxcheaters.com","maxjizztube.com","maxstream.video","maxtubeporn.net","me-encantas.com","medeberiya.site","medeberiya1.com","medeberiyaa.com","medeberiyas.com","medeberiyax.com","mediacast.click","mega4upload.com","mega4upload.net","mejortorrento.*","mejortorrents.*","mejortorrentt.*","memoriadatv.com","mensfitness.com","mensjournal.com","mentalfloss.com","mercerbears.com","mercurynews.com","messinatoday.it","metal-hammer.de","milliyet.com.tr","miniminiplus.pl","minutolivre.com","mirrorpoi.my.id","mixrootmods.com","mmsmasala27.com","mobility.com.ng","mockuphunts.com","modporntube.com","moflix-stream.*","molbiotools.com","mommy-pussy.com","momtubeporn.xxx","motherporno.com","mov18plus.cloud","moviemaniak.com","movierulzfree.*","movierulzlink.*","movies2watch.tv","moviescounter.*","moviesonline.fm","moviessources.*","moviessquad.com","movieuniverse.*","mp3fromyou.tube","mrdeepfakes.com","mscdroidlabs.es","msdos-games.com","msonglyrics.com","msuspartans.com","muchohentai.com","multifaucet.org","musiclutter.xyz","musikexpress.de","myanimelist.net","mybestxtube.com","mydesiboobs.com","myfreeblack.com","mysexybabes.com","mywatchseries.*","myyoungbabe.com","mzansinudes.com","naijanowell.com","naijaray.com.ng","nakedbabes.club","nangiphotos.com","nativesurge.net","nativesurge.top","naughtyza.co.za","nbareplayhd.com","nbcolympics.com","necksdesign.com","needgayporn.com","nekopoicare.*>>","nemzetisport.hu","netflixlife.com","networkhint.com","news-herald.com","news-leader.com","newstechone.com","newyorkjets.com","nflspinzone.com","nicexxxtube.com","nizarstream.com","noindexscan.com","noithatmyphu.vn","nokiahacking.pl","nosteamgames.ro","notebookcheck.*","notesformsc.org","noteshacker.com","notunmovie.link","novelssites.com","nsbtmemoir.site","nsfwmonster.com","nsfwyoutube.com","nswdownload.com","nu6i-bg-net.com","nudeslegion.com","nudismteens.com","nukedpacks.site","nullscripts.net","nursexfilme.com","nyaatorrent.com","oceanofmovies.*","okiemrolnika.pl","olamovies.store","olympustaff.com","omgexploits.com","online-smss.com","onlinekosten.de","open3dmodel.com","openculture.com","openloading.com","order-order.com","orgasmatrix.com","oromedicine.com","otokukensaku.jp","otomi-games.com","ourcoincash.xyz","oyundunyasi.net","ozulscansen.com","pacersports.com","pageflutter.com","pakkotoisto.com","palermotoday.it","panda-novel.com","pandamovies.org","pandasnovel.com","paperzonevn.com","pawastreams.org","pawastreams.pro","pcgameszone.com","peliculas8k.com","peliculasmx.net","pelisflix20.*>>","pelismarthd.com","pelisxporno.net","pendekarsubs.us","pepperlive.info","perezhilton.com","perfektdamen.co","persianhive.com","perugiatoday.it","pewresearch.org","pflege-info.net","phonerotica.com","phongroblox.com","pianetalecce.it","pics4upload.com","picxnkjkhdf.sbs","pimpandhost.com","pinoyalbums.com","pinoyrecipe.net","piratehaven.xyz","pisshamster.com","pixdfdjkkr.shop","pixkfjtrkf.shop","planetfools.com","platinporno.com","play.hbomax.com","player.msmini.*","plugincrack.com","pocket-lint.com","popcornstream.*","popdaily.com.tw","porhubvideo.com","porn-monkey.com","pornexpanse.com","pornfactors.com","porngameshd.com","pornhegemon.com","pornhoarder.net","porninblack.com","porno-porno.net","porno-rolik.com","pornohammer.com","pornohirsch.net","pornoklinge.com","pornomanoir.com","pornrusskoe.com","portable4pc.com","powergam.online","premiumporn.org","privatemoviez.*","projectfreetv.*","promimedien.com","proxydocker.com","punishworld.com","purelyceleb.com","pussy3dporn.com","pussyhothub.com","qatarstreams.me","quiltfusion.com","quotesshine.com","r1.richtoon.top","rackusreads.com","radionatale.com","radionylive.com","radiorockon.com","railwebcams.net","rajssoid.online","rangerboard.com","ravennatoday.it","rctechsworld.in","readbitcoin.org","readhunters.xyz","readingpage.fun","redpornblog.com","remodelista.com","rennrad-news.de","renoconcrete.ca","rentbyowner.com","reportera.co.kr","restegourmet.de","retroporn.world","risingapple.com","ritacandida.com","robot-forum.com","rojadirectatv.*","rollingstone.de","romaierioggi.it","romfirmware.com","root-nation.com","route-fifty.com","rule34vault.com","runnersworld.de","rushuploads.com","ryansharich.com","saabcentral.com","salernotoday.it","samapkstore.com","sampledrive.org","samuraiscan.org","santhoshrcf.com","satoshi-win.xyz","savealoonie.com","scan-hentai.net","scatnetwork.com","schwaebische.de","sdmoviespoint.*","sekaikomik.live","serienstream.to","seriesmetro.net","seriesonline.sx","seriouseats.com","serverbd247.com","serviceemmc.com","setfucktube.com","sex-torrent.net","sexanimesex.com","sexoverdose.com","sexseeimage.com","sexwebvideo.com","sexxxanimal.com","sexy-parade.com","sexyerotica.net","seznamzpravy.cz","sfmcompile.club","shadagetech.com","shadowrangers.*","sharegdrive.com","sharinghubs.com","shemalegape.net","shomareh-yab.ir","shopkensaku.com","short-jambo.ink","showcamrips.com","showrovblog.com","shrugemojis.com","shugraithou.com","siamfishing.com","sieutamphim.org","singingdalong.*","siriusfiles.com","sitetorrent.com","sivackidrum.net","slapthesign.com","sleazedepot.com","sleazyneasy.com","smartcharts.net","sms-anonyme.net","sms-receive.net","smsonline.cloud","smumustangs.com","soconsports.com","software-on.com","softwaresde.com","solarchaine.com","sommerporno.com","sondriotoday.it","souq-design.com","sourceforge.net","spanishdict.com","spardhanews.com","sport890.com.uy","sports-stream.*","sportsblend.net","sportsonline.si","sportsonline.so","sportsplays.com","sportsseoul.com","sportstiger.com","sportstreamtv.*","starstreams.pro","start-to-run.be","stbemuiptvn.com","sterkinekor.com","stream.bunkr.ru","streamnoads.com","stronakobiet.pl","studybullet.com","subtitlecat.com","sueddeutsche.de","sulasokvids.net","sullacollina.it","sumirekeiba.com","suneelkevat.com","superdeporte.es","superembeds.com","supermarches.ca","supermovies.org","svethardware.cz","swift4claim.com","syracusefan.com","tabooanime.club","tagesspiegel.de","tamilanzone.com","tamilultra.team","tapeantiads.com","tapeblocker.com","techacrobat.com","techadvisor.com","techastuces.com","techedubyte.com","techinferno.com","technichero.com","technorozen.com","techoreview.com","techprakash.com","techsbucket.com","techyhigher.com","techymedies.com","tedenglish.site","teen-hd-sex.com","teenfucksex.com","teenpornjpg.com","teensextube.xxx","teenxxxporn.pro","telegraph.co.uk","telepisodes.org","temporeale.info","tenbaiquest.com","tenies-online.*","tennisonline.me","tennisstreams.*","teracourses.com","texassports.com","textreverse.com","thaiairways.com","the-mystery.org","the2seasons.com","theappstore.org","thebarchive.com","thebigblogs.com","theclashify.com","thedilyblog.com","thegrowthop.com","thejetpress.com","thejoblives.com","themoviesflix.*","theprovince.com","thereporter.com","thestreameast.*","thetoneking.com","theusaposts.com","thewebflash.com","theyarehuge.com","thingiverse.com","thingstomen.com","thisisrussia.io","thueringen24.de","thumpertalk.com","ticketmaster.sg","tickhosting.com","ticonsiglio.com","tieba.baidu.com","tienganhedu.com","tires.costco.ca","today-obits.com","todopolicia.com","toeflgratis.com","tokuzilla.net>>","tokyomotion.com","tokyomotion.net","tophostdeal.com","topnewsshow.com","topperpoint.com","topstarnews.net","torascripts.org","tornadomovies.*","torrentgalaxy.*","torrentgame.org","torrentstatus.*","torresette.news","tradingview.com","transfermarkt.*","trendohunts.com","trevisotoday.it","triesteprima.it","true-gaming.net","trytutorial.com","tubegaytube.com","tubepornnow.com","tudongnghia.com","tuktukcinma.com","turbovidhls.com","turkeymenus.com","tusachmanga.com","tvanouvelles.ca","tvsportslive.fr","twistedporn.com","twitchnosub.com","tyler-brown.com","u6lyxl0w.skin>>","ukathletics.com","ukaudiomart.com","ultramovies.org","undeniable.info","underhentai.net","unipanthers.com","updateroj24.com","uploadbeast.com","uploadcloud.pro","usaudiomart.com","user.guancha.cn","vectogravic.com","veekyforums.com","vegamovies3.org","veneziatoday.it","verpelis.gratis","verywellfit.com","vfxdownload.net","vicenzatoday.it","viciante.com.br","vidcloudpng.com","video.genyt.net","videodidixx.com","videosputas.xxx","vidsrc-embed.ru","vik1ngfile.site","ville-ideale.fr","viralharami.com","viralxvideos.es","voyageforum.com","vtplayer.online","wantedbabes.com","warmteensex.com","watch-my-gf.com","watch.sling.com","watchf1full.com","watchfreexxx.pw","watchhentai.net","watchmovieshd.*","watchporn4k.com","watchpornfree.*","watchseries8.to","watchserieshd.*","watchtvseries.*","watchxxxfree.pw","webmatrices.com","webtoonscan.com","wegotcookies.co","weltfussball.at","wemakesites.net","wheelofgold.com","wholenotism.com","wholevideos.com","wieistmeineip.*","wikijankari.com","wikipooster.com","wikisharing.com","windowslite.net","windsorstar.com","winnipegsun.com","witcherhour.com","womenshealth.de","worldgyan18.com","worldofiptv.com","worldsports.*>>","wowpornlist.xyz","wowyoungsex.com","wpgdadatong.com","wristreview.com","writeprofit.org","wvv-fmovies.com","www.youtube.com","xfuckonline.com","xhardhempus.net","xianzhenyuan.cn","xiaomitools.com","xkeezmovies.com","xmoviesforyou.*","xn--31byd1i.net","xnudevideos.com","xnxxhamster.net","xxxindianporn.*","xxxparodyhd.net","xxxpornmilf.com","xxxtubegain.com","xxxtubenote.com","xxxtubepass.com","xxxwebdlxxx.top","yanksgoyard.com","yazilidayim.net","yesmovies123.me","yeutienganh.com","yogablogfit.com","yomoviesnow.com","yorkpress.co.uk","youlikeboys.com","youmedemblik.nl","young-pussy.com","youranshare.com","yourporngod.com","youtubekids.com","yrtourguide.com","ytconverter.app","yuramanga.my.id","zeroradio.co.uk","zonavideosx.com","zone-annuaire.*","zoominar.online","007stockchat.com","123movies-free.*","18-teen-porn.com","18-teen-tube.com","18adultgames.com","18comic-gquu.vip","1movielinkbd.com","1movierulzhd.pro","24pornvideos.com","2kspecialist.net","4fingermusic.com","8-ball-magic.com","9now.nine.com.au","about-drinks.com","activevoyeur.com","activistpost.com","actresstoday.com","adblockstrtape.*","adblockstrtech.*","adult-empire.com","adultporn.com.es","advertafrica.net","agedtubeporn.com","aghasolution.com","ajaxshowtime.com","ajkalerbarta.com","alleveilingen.be","alleveilingen.nl","alliptvlinks.com","allporncomic.com","alphagames4u.com","alphapolis.co.jp","alphasource.site","altselection.com","anakteknik.co.id","analsexstars.com","analxxxvideo.com","androidadult.com","androidfacil.org","androidgreek.com","androidspill.com","anime-odcinki.pl","animesexclip.com","animetwixtor.com","animixstream.com","antennasports.ru","aopathletics.org","apkandroidhub.in","app.simracing.gp","applediagram.com","aquariumgays.com","arezzonotizie.it","articlesmania.me","asianmassage.xyz","asianpornjav.com","assettoworld.com","asyaanimeleri.pw","athlonsports.com","atlantisscan.com","auburntigers.com","audiofanzine.com","audycje.tokfm.pl","autotrader.co.uk","avellinotoday.it","azamericasat.net","azby.fmworld.net","baby-vornamen.de","backfirstwo.site","backyardboss.net","backyardpapa.com","bangyourwife.com","barrier-free.net","base64decode.org","bcuathletics.com","beaddiagrams.com","beritabangka.com","berlin-teltow.de","bestasiansex.pro","bestblackgay.com","bestcash2020.com","bestgamehack.top","bestgrannies.com","besthdmovies.com","bestpornflix.com","bestsextoons.com","beta.plus.rtl.de","biblegateway.com","bigbuttshub2.top","bikeportland.org","birdswatcher.com","bisceglielive.it","bitchesgirls.com","blackandteal.com","blog.livedoor.jp","blowjobfucks.com","bloxinformer.com","bloxyscripts.com","bluemediafiles.*","bluerabbitrx.com","bmw-scooters.com","boardingarea.com","boerse-online.de","bollywoodfilma.*","bondagevalley.cc","booksbybunny.com","boolwowgirls.com","bootstrample.com","bostonherald.com","boysxclusive.com","brandbrief.co.kr","bravoerotica.com","bravoerotica.net","breatheheavy.com","breedingmoms.com","buffalobills.com","buffalowdown.com","businesstrend.jp","butlersports.com","butterpolish.com","call2friends.com","caminspector.net","campusfrance.org","camvideoshub.com","camwhoresbay.com","caneswarning.com","cartoonporno.xxx","catmovie.website","ccnworldtech.com","celtadigital.com","cervezaporno.com","championdrive.co","charexempire.com","chattanoogan.com","cheatography.com","chelsea24news.pl","chicagobears.com","chieflyoffer.com","choiceofmods.com","chubbyelders.com","cizzyscripts.com","claimsatoshi.xyz","clever-tanken.de","clickforhire.com","clickndownload.*","clipconverter.cc","cloudgallery.net","cmumavericks.com","coin-profits.xyz","collegehdsex.com","colliersnews.com","coloredmanga.com","comeletspray.com","cometogliere.com","comicspornos.com","comicspornow.com","comicsvalley.com","computerpedia.in","convert2mp3.club","convertinmp4.com","courseleader.net","cr7-soccer.store","cracksports.me>>","criptologico.com","cryptoclicks.net","cryptofactss.com","cryptofaucet.xyz","cryptokinews.com","cryptomonitor.in","cybercityhelp.in","cyberstumble.com","cydiasources.net","dailyboulder.com","dailypudding.com","dailytips247.com","dailyuploads.net","darknessporn.com","darkwanderer.net","dasgelbeblatt.de","dataunlocker.com","dattebayo-br.com","davewigstone.com","dayoftheweek.org","daytonflyers.com","ddl-francais.com","deepfakeporn.net","deepswapnude.com","demonicscans.org","designparty.sx>>","desikamababa.com","detroitlions.com","diariodeibiza.es","dirtytubemix.com","discoveryplus.in","djremixganna.com","doanhnghiepvn.vn","dobrapogoda24.pl","dobreprogramy.pl","donghuaworld.com","dorsetecho.co.uk","downloadapk.info","downloadbatch.me","downloadsite.org","downloadsoft.net","dpscomputing.com","dryscalpgone.com","dualshockers.com","duplichecker.com","dvdgayonline.com","earncrypto.co.in","eartheclipse.com","eastbaytimes.com","easymilftube.net","ebook-hunter.org","ecom.wixapps.net","edufileshare.com","einfachschoen.me","eleceedmanhwa.me","eletronicabr.com","elevationmap.net","eliobenedetto.it","embedseek.online","embedstreams.top","empire-anime.com","emulatorsite.com","english101.co.za","erotichunter.com","eslauthority.com","esportstales.com","everysextube.com","ewrc-results.com","exclusivomen.com","fallbrook247.com","familyporner.com","famousnipple.com","fastdownload.top","fattelodasolo.it","fatwhitebutt.com","faucetcrypto.com","faucetcrypto.net","favefreeporn.com","favoyeurtube.net","fernsehserien.de","fessesdenfer.com","fetishshrine.com","filespayouts.com","filmestorrent.tv","filmyhitlink.xyz","filmyhitt.com.in","financacerta.com","fineasiansex.com","finofilipino.org","fitnessholic.net","fitnessscenz.com","flatpanelshd.com","footwearnews.com","footymercato.com","footystreams.net","foreverquote.xyz","forexcracked.com","forextrader.site","forgepattern.net","forum-xiaomi.com","foxsports.com.au","freegetcoins.com","freehardcore.com","freehdvideos.xxx","freelitecoin.vip","freemcserver.net","freemomstube.com","freemoviesu4.com","freeporncave.com","freevstplugins.*","freshersgold.com","fullxcinema1.com","fullxxxmovies.me","fumettologica.it","fussballdaten.de","gadgetxplore.com","game-repack.site","gamemodsbase.com","gamers-haven.org","games.boston.com","games.kansas.com","games.modbee.com","games.puzzles.ca","games.sacbee.com","games.sltrib.com","games.usnews.com","gamesrepacks.com","gamingbeasts.com","gamingdeputy.com","gaminglariat.com","ganstamovies.com","gartenlexikon.de","gaydelicious.com","gazetalubuska.pl","gbmwolverine.com","gdrivelatino.net","gdrivemovies.xyz","gemiadamlari.org","genialetricks.de","gentlewasher.com","getdatgadget.com","getdogecoins.com","getworkation.com","gezegenforum.com","ghettopearls.com","ghostsfreaks.com","gidplayer.online","gigemgazette.com","girlschannel.net","globelempire.com","go.discovery.com","go.shortnest.com","goblackbears.com","godstoryinfo.com","goetbutigers.com","gogetadoslinks.*","gomcpanthers.com","gometrostate.com","goodyoungsex.com","gophersports.com","gopornindian.com","greasygaming.com","greenarrowtv.com","gruene-zitate.de","gruporafa.com.br","gsm-solution.com","gtamaxprofit.com","guncelkaynak.com","gutesexfilme.com","hadakanonude.com","handelsblatt.com","happyinshape.com","hard-tubesex.com","hardfacefuck.com","hausbau-forum.de","hayatarehber.com","hd-tube-porn.com","healthylifez.com","hechosfizzle.com","heilpraxisnet.de","helpdeskgeek.com","hentaicomics.pro","hentaiseason.com","hentaistream.com","hentaivideos.net","hotcopper.com.au","hotdreamsxxx.com","hotpornyoung.com","hotpussyhubs.com","houstonpress.com","hqpornstream.com","huskercorner.com","id.condenast.com","idmextension.xyz","ielts-isa.edu.vn","ignoustudhelp.in","ikindlebooks.com","imagereviser.com","imageshimage.com","imagetotext.info","imperiofilmes.co","indexsubtitle.cc","infinityfree.com","infomatricula.pt","inprogrammer.com","intellischool.id","interviewgig.com","investopedia.com","investorveda.com","isekaibrasil.com","isekaipalace.com","jalshamoviezhd.*","japaneseasmr.com","japanesefuck.com","japanfuck.com.es","javenspanish.com","javfullmovie.com","justblogbaby.com","justswallows.net","kakarotfoot.ru>>","katiescucina.com","kayifamilytv.com","khatrimazafull.*","kingdomfiles.com","kingstreamz.site","kireicosplay.com","kitchennovel.com","kitraskimisi.com","knowyourmeme.com","kodibeginner.com","kokosovoulje.com","komikstation.com","komputerswiat.pl","kshowsubindo.org","kstatesports.com","ksuathletics.com","kurakura21.space","kuttymovies1.com","lakeshowlife.com","lampungkerja.com","larvelfaucet.com","lascelebrite.com","latesthdmovies.*","latinohentai.com","lavanguardia.com","lawyercontact.us","lectormangaa.com","leechpremium.net","legionjuegos.org","lehighsports.com","lesbiantube.club","letmewatchthis.*","lettersolver.com","levelupalone.com","lg-firmwares.com","libramemoria.com","lifesurance.info","lightxxxtube.com","limetorrents.lol","linux-magazin.de","linuxexplain.com","live.vodafone.de","livenewsflix.com","logofootball.net","lookmovie.studio","loudountimes.com","ltpcalculator.in","luminatedata.com","lumpiastudio.com","lustaufsleben.at","lustesthd.makeup","macrocreator.com","magicseaweed.com","mahobeachcam.com","mammaebambini.it","manga-scantrad.*","mangacanblog.com","mangaforfree.com","mangaindo.web.id","markstyleall.com","masstamilans.com","mastaklomods.com","masterplayer.xyz","matshortener.xyz","mature-tube.sexy","maxisciences.com","meconomynews.com","mee-6zeqsgv2.com","mee-cccdoz45.com","mee-dp6h8dp2.com","mee-s9o6p31p.com","meetdownload.com","megafilmeshd20.*","megajapansex.com","mejortorrents1.*","merlinshoujo.com","meteoetradar.com","milanreports.com","milfxxxpussy.com","milkporntube.com","mlookalporno.com","mockupgratis.com","mockupplanet.com","moto-station.com","mountaineast.org","movielinkhub.xyz","movierulz2free.*","movierulzwatch.*","movieshdwatch.to","movieshubweb.com","moviesnipipay.me","moviesrulzfree.*","moviestowatch.tv","mrproblogger.com","msmorristown.com","msumavericks.com","multimovies.tech","musiker-board.de","my-ford-focus.de","myair.resmed.com","mycivillinks.com","mydownloadtube.*","myfitnesspal.com","mylegalporno.com","mylivestream.pro","mymotherlode.com","myproplugins.com","myradioonline.pl","nakedbbw-sex.com","naruldonghua.com","nationalpost.com","nativesurge.info","nauathletics.com","naughtyblogs.xyz","neatfreeporn.com","neatpornodot.com","netflixporno.net","netizensbuzz.com","newanimeporn.com","newsinlevels.com","newsobserver.com","newstvonline.com","nghetruyenma.net","nguyenvanbao.com","nhentaihaven.org","niftyfutures.org","nintendolife.com","nl.hardware.info","nocsummer.com.br","nonesnanking.com","notebookchat.com","notiziemusica.it","novablogitalia.*","nude-teen-18.com","nudemomshots.com","null-scripts.net","officecoach24.de","ohionowcast.info","older-mature.net","oldgirlsporn.com","onestringlab.com","onlineporn24.com","onlyfanvideo.com","onlygangbang.com","onlygayvideo.com","onlyindianporn.*","open.spotify.com","openloadmovies.*","optimizepics.com","oranhightech.com","orenoraresne.com","oswegolakers.com","otakuanimess.net","oxfordmail.co.uk","pagalworld.video","pandaatlanta.com","pandafreegames.*","parentcircle.com","parking-map.info","pdfstandards.net","pedroinnecco.com","penis-bilder.com","personefamose.it","phinphanatic.com","physics101.co.za","pigeonburger.xyz","pinsexygirls.com","play.gamezop.com","play.history.com","player.gayfor.us","player.hdgay.net","player.pop.co.uk","player4me.online","playsexgames.xxx","pleasuregirl.net","plumperstube.com","plumpxxxtube.com","pokeca-chart.com","police.community","ponselharian.com","porn-hd-tube.com","pornclassic.tube","pornclipshub.com","pornforrelax.com","porngayclips.com","pornhub-teen.com","pornobengala.com","pornoborshch.com","pornoteensex.com","pornsex-pics.com","pornstargold.com","pornuploaded.net","pornvideotop.com","pornwatchers.com","pornxxxplace.com","pornxxxxtube.net","portnywebcam.com","post-gazette.com","postermockup.com","powerover.site>>","practicequiz.com","prajwaldesai.com","praveeneditz.com","privatenudes.com","programme-tv.net","programsolve.com","prosiebenmaxx.de","purduesports.com","purposegames.com","puzzles.nola.com","pythonjobshq.com","qrcodemonkey.net","rabbitstream.net","radio-deejay.com","realityblurb.com","realjapansex.com","receptyonline.cz","recordonline.com","redbirdrants.com","rendimentibtp.it","repack-games.com","reportbangla.com","reviewmedium.com","ribbelmonster.de","rimworldbase.com","ringsidenews.com","ripplestream4u.*","riwayat-word.com","rocketrevise.com","rollingstone.com","royale-games.com","rule34hentai.net","rv-ecommerce.com","sabishiidesu.com","safehomefarm.com","sainsburys.co.uk","saradahentai.com","sarugbymag.co.za","satoshifaucet.io","savethevideo.com","savingadvice.com","schaken-mods.com","schildempire.com","schoolcheats.net","search.brave.com","seattletimes.com","secretsdujeu.com","semuanyabola.com","sensualgirls.org","serienjunkies.de","serieslandia.com","sesso-escort.com","sexanimetube.com","sexfilmkiste.com","sexflashgame.org","sexhardtubes.com","sexjapantube.com","sexlargetube.com","sexmomvideos.com","sexontheboat.xyz","sexpornasian.com","sextingforum.net","sexybabesart.com","sexyoungtube.com","sharelink-1.site","sheepesports.com","shelovesporn.com","shemalemovies.us","shemalepower.xyz","shemalestube.com","shimauma-log.com","shoot-yalla.live","short.croclix.me","shortenlinks.top","shortylink.store","showbizbites.com","shrinkforearn.in","shrinklinker.com","signupgenius.com","sikkenscolore.it","simpleflying.com","simplyvoyage.com","sitesunblocked.*","skidrowcodex.net","skidrowcrack.com","skintagsgone.com","smallseotools.ai","smart-wohnen.net","smartermuver.com","smashyplayer.top","soccershoes.blog","softdevelopp.com","softwaresite.net","solution-hub.com","soonersports.com","soundpark-club.*","southpark.cc.com","soyoungteens.com","space-faucet.com","spigotunlocked.*","splinternews.com","sportpiacenza.it","sportshub.stream","sportsloverz.xyz","sportstream.live","spotifylists.com","sshconect.com.br","sssinstagram.com","stablerarena.com","stagatvfiles.com","stiflersmoms.com","stileproject.com","stillcurtain.com","stockhideout.com","stopstreamtv.net","storieswatch.com","stream.nflbox.me","stream4free.live","streamblasters.*","streamcenter.xyz","streamextreme.cc","streamingnow.mov","streamingworld.*","streamloverx.com","strefabiznesu.pl","strtapeadblock.*","suamusica.com.br","sukidesuost.info","sunshine-live.de","supremebabes.com","swiftuploads.com","sxmislandcam.com","synoniemboek.com","tamarindoyam.com","tapelovesads.org","taroot-rangi.com","teachmemicro.com","techgeek.digital","techkhulasha.com","technewslive.org","tecnotutoshd.net","teensexvideos.me","telcoinfo.online","telegratuita.com","tempatwisata.pro","text-compare.com","the1security.com","thecozyapron.com","thecustomrom.com","thefappening.pro","thegadgetking.in","thehiddenbay.com","theinventory.com","thejobsmovie.com","thelandryhat.com","thelosmovies.com","thelovenerds.com","thematurexxx.com","thenerdstash.com","thenewsdrill.com","thenewsglobe.net","thenextplanet1.*","theorie-musik.de","thepiratebay.org","thepoorcoder.com","thesportster.com","thesportsupa.com","thesundevils.com","thetrendverse.in","thevikingage.com","thisisfutbol.com","timesnownews.com","timesofindia.com","tires.costco.com","tiroalpaloes.net","titansonline.com","tnstudycorner.in","todays-obits.com","todoandroid.live","tonanmedia.my.id","topvideosgay.com","toramemoblog.com","torrentkitty.one","totallyfuzzy.net","totalsportek.app","toureiffel.paris","towsontigers.com","tptvencore.co.uk","tradersunion.com","travelerdoor.com","trendytalker.com","troyyourlead.com","trucosonline.com","truetrophies.com","truevpnlover.com","tube-teen-18.com","tube.shegods.com","tuotromedico.com","turbogvideos.com","turboplayers.xyz","turtleviplay.xyz","tutorialsaya.com","tweakcentral.net","twobluescans.com","typinggames.zone","uconnhuskies.com","unionpayintl.com","universegunz.net","unrealengine.com","upfiles-urls.com","upgradedhome.com","upstyledaily.com","urlgalleries.net","ustrendynews.com","uvmathletics.com","uwlathletics.com","vancouversun.com","vandaaginside.nl","vegamoviese.blog","veryfreeporn.com","verywellmind.com","vichitrainfo.com","videocdnal24.xyz","videosection.com","vikingf1le.us.to","villettt.kitchen","vinstartheme.com","viralvideotube.*","viralxxxporn.com","vivrebordeaux.fr","vodkapr3mium.com","voiranime.stream","voyeurfrance.net","voyeurxxxsex.com","vpshostplans.com","vrporngalaxy.com","vzrosliedamy.com","watchanime.video","watchfreekav.com","watchfreexxx.net","watchmovierulz.*","watchmovies2.com","wbschemenews.com","wearehunger.site","web.facebook.com","webcamsdolls.com","webcheats.com.br","webdesigndev.com","webdeyazilim.com","webseriessex.com","websitesball.com","werkzeug-news.de","whentostream.com","whitexxxtube.com","wiadomosci.wp.pl","wildpictures.net","willow.arlen.icu","windowsonarm.org","wolfgame-ar.site","womenreality.com","woodmagazine.com","word-grabber.com","workxvacation.jp","worldhistory.org","wrestlinginc.com","wrzesnia.info.pl","wunderground.com","wvuathletics.com","www.amazon.co.jp","www.amazon.co.uk","www.facebook.com","xhamster-art.com","xhamsterporno.mx","xhamsterteen.com","xvideos-full.com","xxxanimefuck.com","xxxlargeporn.com","xxxlesvianas.com","xxxretrofuck.com","xxxteenyporn.com","xxxvideos247.com","yellowbridge.com","yesjavplease.fun","yona-yethu.co.za","youngerporn.mobi","youtubetoany.com","youtubetowav.net","youwatch.monster","youwatchporn.com","ysokuhou.blog.jp","zdravenportal.eu","zecchino-doro.it","ziggogratis.site","ziminvestors.com","ziontutorial.com","zippyshare.cloud","zwergenstadt.com","123moviesonline.*","123strippoker.com","12thmanrising.com","1337x.unblocked.*","1337x.unblockit.*","19-days-manga.com","1movierulzhd.hair","1teentubeporn.com","2japaneseporn.com","acapellas4u.co.uk","acdriftingpro.com","adblockplustape.*","adffdafdsafds.sbs","alaskananooks.com","allcelebspics.com","alternativeto.net","altyazitube22.lat","amateur-twink.com","amateurfapper.com","amsmotoresllc.com","ancient-origins.*","andhrafriends.com","androidonepro.com","androidpolice.com","animalwebcams.net","anime-torrent.com","animecenterbr.com","animeidhentai.com","animelatinohd.com","animeonline.ninja","animepornfilm.com","animesonlinecc.us","animexxxfilms.com","anonymousemail.me","apostoliclive.com","arabshentai.com>>","arcade.lemonde.fr","armypowerinfo.com","asianfucktube.com","asiansexcilps.com","assignmentdon.com","atalantini.online","autoexpress.co.uk","babyjimaditya.com","badassoftcore.com","badgerofhonor.com","bafoeg-aktuell.de","bandyforbundet.no","bargainbriana.com","bcanotesnepal.com","beargoggleson.com","bebasbokep.online","beritasulteng.com","bestanime-xxx.com","besthdgayporn.com","besthugecocks.com","bestpussypics.net","beyondtheflag.com","bgmiupdate.com.in","bigdickwishes.com","bigtitsxxxsex.com","black-matures.com","blackhatworld.com","bladesalvador.com","blizzboygames.net","blog.linksfire.co","blog.textpage.xyz","blogcreativos.com","blogtruyenmoi.com","bollywoodchamp.in","bostoncommons.net","bracontece.com.br","bradleybraves.com","brazzersbabes.com","brindisireport.it","brokensilenze.net","brookethoughi.com","browncrossing.net","brushednickel.biz","calgaryherald.com","camchickscaps.com","cameronaggies.com","candyteenporn.com","carensureplan.com","catatanonline.com","cavalierstream.fr","cdn.gledaitv.live","celebritablog.com","charbelnemnom.com","chat.tchatche.com","cheat.hax4you.net","checkfiletype.com","chicksonright.com","cindyeyefinal.com","cinecalidad5.site","cinema-sketch.com","citethisforme.com","citpekalongan.com","ciudadblogger.com","claplivehdplay.ru","classicreload.com","clickjogos.com.br","cloudhostingz.com","coatingsworld.com","codingshiksha.com","coempregos.com.br","compota-soft.work","computercrack.com","computerfrage.net","computerhilfen.de","comunidadgzone.es","conferenceusa.com","consoletarget.com","cool-style.com.tw","coolmathgames.com","crichd-player.top","cruisingearth.com","cryptednews.space","cryptoblog24.info","cryptowidgets.net","crystalcomics.com","curiosidadtop.com","daemon-hentai.com","dailybulletin.com","dailydemocrat.com","dailyfreebits.com","dailygeekshow.com","dailytech-news.eu","dallascowboys.com","damndelicious.net","darts-scoring.com","dawnofthedawg.com","dealsfinders.blog","dearcreatives.com","deine-tierwelt.de","deinesexfilme.com","dejongeturken.com","denverbroncos.com","descarga-animex.*","design4months.com","designtagebuch.de","desitelugusex.com","developer.arm.com","diamondfansub.com","diaridegirona.cat","diariocordoba.com","diencobacninh.com","dirtyindianporn.*","dl.apkmoddone.com","doctor-groups.com","dorohedoro.online","downloadapps.info","downloadtanku.org","downloadudemy.com","downloadwella.com","dynastyseries.com","dzienniklodzki.pl","e-hausaufgaben.de","earninginwork.com","easyjapanesee.com","easyvidplayer.com","easywithcode.tech","ebonyassclips.com","eczpastpapers.net","editions-actu.org","einfachtitten.com","elamigosgamez.com","elamigosgamez.net","empire-streamz.fr","emulatorgames.net","encurtandourl.com","encurtareidog.top","engel-horoskop.de","enormousbabes.net","entertubeporn.com","epsilonakdemy.com","eromanga-show.com","estrepublicain.fr","eternalmangas.org","etownbluejays.com","euro2024direct.ru","eurotruck2.com.br","extreme-board.com","extremotvplay.com","faceittracker.net","fansonlinehub.com","fantasticporn.net","fastconverter.net","fatgirlskinny.net","fattubevideos.net","femalefirst.co.uk","fgcuathletics.com","fightinghawks.com","file.magiclen.org","financialpost.com","finanzas-vida.com","fineretroporn.com","finexxxvideos.com","finish.addurl.biz","fitnakedgirls.com","fitnessplanss.com","fitnesssguide.com","flight-report.com","floridagators.com","foguinhogames.net","footballstream.tv","footfetishvid.com","footstockings.com","fordownloader.com","formatlibrary.com","forum.blu-ray.com","fplstatistics.com","freeboytwinks.com","freecodezilla.net","freecourseweb.com","freemagazines.top","freeoseocheck.com","freepdf-books.com","freepornrocks.com","freepornstream.cc","freepornvideo.sex","freepornxxxhd.com","freerealvideo.com","freethesaurus.com","freex2line.online","freexxxvideos.pro","french-streams.cc","freshstuff4u.info","friendproject.net","frkn64modding.com","frosinonetoday.it","fuerzasarmadas.eu","fuldaerzeitung.de","fullfreeimage.com","fullxxxmovies.net","futbolsayfasi.net","games-manuals.com","games.puzzler.com","games.thestar.com","gamesofdesire.com","gaminggorilla.com","gay-streaming.com","gaypornhdfree.com","gebrauchtwagen.at","getwallpapers.com","gewinde-normen.de","girlsofdesire.org","girlswallowed.com","globalstreams.xyz","gobigtitsporn.com","goblueraiders.com","godriveplayer.com","gogetapast.com.br","gogueducation.com","goltelevision.com","googleapis.com.de","googleapis.com.do","gothunderbirds.ca","grannyfuckxxx.com","grannyxxxtube.net","graphicgoogle.com","grsprotection.com","gwiazdatalkie.com","hakunamatata5.org","hallo-muenchen.de","happy-otalife.com","hardcoregamer.com","hardwaretimes.com","hbculifestyle.com","hdfilmizlesen.com","hdvintagetube.com","headlinerpost.com","healbot.dpm15.net","healthcheckup.com","hegreartnudes.com","help.cashctrl.com","hentaibrasil.info","hentaienglish.com","hentaitube.online","hideandseek.world","hikarinoakari.com","hollywoodlife.com","hostingunlock.com","hotkitchenbag.com","hotmaturetube.com","hotspringsofbc.ca","houseandgarden.co","houstontexans.com","howtoconcepts.com","hunterscomics.com","iedprivatedqu.com","imgdawgknuttz.com","imperialstudy.com","independent.co.uk","indianporn365.net","indofirmware.site","indojavstream.com","infinityscans.net","infinityscans.org","infinityscans.xyz","inside-digital.de","insidermonkey.com","instantcloud.site","insurancepost.xyz","ironwinter6m.shop","isabihowto.com.ng","isekaisubs.web.id","isminiunuttum.com","jamiesamewalk.com","janammusic.in.net","japaneseholes.com","japanpornclip.com","japanxxxmovie.com","japanxxxworld.com","jardiner-malin.fr","jokersportshd.org","juegos.elpais.com","k-statesports.com","k-statesports.net","k-statesports.org","kandisvarlden.com","kenshi.fandom.com","kh-pokemon-mc.com","khabardinbhar.net","kickasstorrents.*","kill-the-hero.com","kimcilonlyofc.com","kiuruvesilehti.fi","know-how-tree.com","kontenterabox.com","kontrolkalemi.com","koreanbeauty.club","korogashi-san.org","kreis-anzeiger.de","kurierlubelski.pl","lachainemeteo.com","lacuevadeguns.com","laksa19.github.io","lavozdegalicia.es","lebois-racing.com","lecturisiarome.ro","leechpremium.link","leechyscripts.net","lespartisanes.com","lheritierblog.com","libertestreamvf.*","limontorrents.com","line-stickers.com","link.turkdown.com","linuxsecurity.com","lisatrialidea.com","locatedinfain.com","lonely-mature.com","lovegrowswild.com","lucagrassetti.com","luciferdonghua.in","luckypatchers.com","lycoathletics.com","madhentaitube.com","malaysiastock.biz","maps4study.com.br","marthastewart.com","mature-chicks.com","maturepussies.pro","mdzsmutpcvykb.net","media.cms.nova.cz","megajapantube.com","metaforespress.gr","mfmfinancials.com","miamidolphins.com","miaminewtimes.com","milfpussy-sex.com","minecraftwild.com","mizugigurabia.com","mlbpark.donga.com","mlbstreaming.live","mmorpgplay.com.br","mobilanyheter.net","modelsxxxtube.com","modescanlator.net","mommyporntube.com","momstube-porn.com","moon-fm43w1qv.com","moon-kg83docx.com","moonblinkwifi.com","motorradfrage.net","motorradonline.de","moviediskhd.cloud","movielinkbd4u.com","moviezaddiction.*","mp3cristianos.net","mundovideoshd.com","murtonroofing.com","music.youtube.com","muyinteresante.es","myabandonware.com","myair2.resmed.com","myfunkytravel.com","mynakedwife.video","mzansixporn.co.za","nasdaqfutures.org","national-park.com","negative.tboys.ro","nepalieducate.com","networklovers.com","new-xxxvideos.com","nextchessmove.com","ngin-mobility.com","nieuwsvandedag.nl","nightlifeporn.com","nikkan-gendai.com","nikkeifutures.org","njwildlifecam.com","nobodycancool.com","nonsensediamond.*","nzpocketguide.com","oceanof-games.com","oceanoffgames.com","odekake-spots.com","officedepot.co.cr","officialpanda.com","olemisssports.com","ondemandkorea.com","onepiecepower.com","onlinemschool.com","onlinesextube.com","onlineteenhub.com","ontariofarmer.com","openspeedtest.com","opensubtitles.com","oportaln10.com.br","osmanonline.co.uk","osthessen-news.de","ottawacitizen.com","ottrelease247.com","outdoorchannel.de","overwatchporn.xxx","pahaplayers.click","palmbeachpost.com","pandaznetwork.com","panel.skynode.pro","pantyhosepink.com","paramountplus.com","paraveronline.org","pghk.blogspot.com","phimlongtieng.net","phoenix-manga.com","phonefirmware.com","piazzagallura.org","pistonpowered.com","plantatreenow.com","play.aidungeon.io","playembedapi.site","player.glomex.com","playerflixapi.com","playerjavseen.com","playmyopinion.com","playporngames.com","pleated-jeans.com","pockettactics.com","popcornmovies.org","porn-sexypics.com","pornanimetube.com","porngirlstube.com","pornoenspanish.es","pornoschlange.com","pornxxxvideos.net","practicalkida.com","prague-blog.co.il","premiumporn.org>>","prensaesports.com","prescottenews.com","press-citizen.com","presstelegram.com","primeanimesex.com","primeflix.website","progameguides.com","project-free-tv.*","projectfreetv.one","promisingapps.com","promo-visits.site","protege-liens.com","pubgaimassist.com","publicananker.com","publicdomainq.net","publicdomainr.net","publicflashing.me","punisoku.blogo.jp","pussytorrents.org","qatarstreams.me>>","queenofmature.com","radiolovelive.com","radiosymphony.com","ragnarokmanga.com","randomarchive.com","rateyourmusic.com","rawindianporn.com","readallcomics.com","readcomiconline.*","readfireforce.com","realvoyeursex.com","reporterpb.com.br","reprezentacija.rs","retrosexfilms.com","reviewjournal.com","richieashbeck.com","robloxscripts.com","rojadirectatvhd.*","roms-download.com","roznamasiasat.com","rule34.paheal.net","sahlmarketing.net","samfordsports.com","sanangelolive.com","sanmiguellive.com","sarkarinaukry.com","savemoneyinfo.com","sayphotobooth.com","scandichotels.com","schoolsweek.co.uk","scontianastro.com","searchnsucceed.in","seasons-dlove.net","send-anywhere.com","series9movies.com","sevenjournals.com","sexmadeathome.com","sexyebonyteen.com","sexyfreepussy.com","shahiid-anime.net","share.filesh.site","shentai-anime.com","shinshi-manga.net","shittokuadult.net","shortencash.click","shrink-service.it","sidearmsocial.com","sideplusleaks.com","sim-kichi.monster","simply-hentai.com","simplyrecipes.com","simplywhisked.com","simulatormods.com","skidrow-games.com","skillheadlines.in","skodacommunity.de","slaughtergays.com","smallseotools.com","soccerworldcup.me","softwaresblue.com","south-park-tv.biz","spectrum.ieee.org","speculationis.com","spedostream2.shop","spiritparting.com","sponsorhunter.com","sportanalytic.com","sportingsurge.com","sportlerfrage.net","sportsbuff.stream","sportsgames.today","sportzonline.site","stapadblockuser.*","stellarthread.com","stepsisterfuck.me","storefront.com.ng","stories.los40.com","straatosphere.com","streamadblocker.*","streaming-one.com","streamingunity.to","streamlivetv.site","streamonsport99.*","streamseeds24.com","streamshunters.eu","stringreveals.com","suanoticia.online","super-ethanol.com","susanhavekeep.com","tabele-kalorii.pl","tamaratattles.com","tamilbrahmins.com","tamilsexstory.net","tattoosbeauty.com","tautasdziesmas.lv","techadvisor.co.uk","techautomobile.in","techiepirates.com","techlog.ta-yan.ai","technewsrooms.com","technewsworld.com","techsolveprac.com","teenpornvideo.sex","teenpornvideo.xxx","testlanguages.com","texture-packs.com","thaihotmodels.com","thangdangblog.com","theandroidpro.com","thecelticblog.com","thecubexguide.com","thedailybeast.com","thedigitalfix.com","thefreebieguy.com","thegamearcade.com","thehealthsite.com","theismailiusa.org","thekingavatar.com","theliveupdate.com","theouterhaven.net","theregister.co.uk","thermoprzepisy.pl","thesprucepets.com","theworldobits.com","thousandbabes.com","tichyseinblick.de","tiktokcounter.net","timesnowhindi.com","tippsundtricks.co","titfuckvideos.com","tmail.sys64738.at","tomatespodres.com","toplickevesti.com","topsworldnews.com","torrent-pirat.com","torrentdownload.*","tradingfact4u.com","trannylibrary.com","trannyxxxtube.net","truyen-hentai.com","truyenaudiocv.net","tubepornasian.com","tubepornstock.com","ultimate-catch.eu","ultrateenporn.com","umatechnology.org","undeadwalking.com","unsere-helden.com","uptechnologys.com","urjalansanomat.fi","url.gem-flash.com","utepathletics.com","vanillatweaks.net","venusarchives.com","vide-greniers.org","video.gazzetta.it","videogameszone.de","videos.remilf.com","vietnamanswer.com","viralitytoday.com","virtualnights.com","visualnewshub.com","vitalitygames.com","voiceofdenton.com","voyeurpornsex.com","voyeurspyporn.com","voyeurxxxfree.com","wannafreeporn.com","watchanimesub.net","watchfacebook.com","watchsouthpark.tv","websiteglowgh.com","weknowconquer.com","welcometojapan.jp","wellness4live.com","wirralglobe.co.uk","wirtualnemedia.pl","wohnmobilforum.de","worldfreeware.com","worldgreynews.com","worthitorwoke.com","wpsimplehacks.com","xfreepornsite.com","xhamsterdeutsch.*","xnxx-sexfilme.com","xxxonlinefree.com","xxxpussyclips.com","xxxvideostrue.com","yesdownloader.com","yongfucknaked.com","yummysextubes.com","zeenews.india.com","zeijakunahiko.com","zeroto60times.com","zippysharecue.com","1001tracklists.com","101soundboards.com","10minuteemails.com","123moviesready.org","123moviestoday.net","1337x.unblock2.xyz","247footballnow.com","7daystodiemods.com","adblockeronstape.*","addictinggames.com","adultasianporn.com","advertisertape.com","afasiaarchzine.com","airportwebcams.net","akuebresources.com","allureamateurs.net","alternativa104.net","amateur-mature.net","angrybirdsnest.com","animesonliner4.com","anothergraphic.org","antenasport.online","arcade.buzzrtv.com","arcadeprehacks.com","arkadiumhosted.com","arsiv.mackolik.com","asian-teen-sex.com","asianbabestube.com","asianpornfilms.com","asiansexdiarys.com","asianstubefuck.com","atlantafalcons.com","atlasstudiousa.com","autocadcommand.com","badasshardcore.com","baixedetudo.net.br","ballexclusives.com","barstoolsports.com","basic-tutorials.de","bdsmslavemovie.com","beamng.wesupply.cx","bearchasingart.com","beermoneyforum.com","beginningmanga.com","berliner-kurier.de","beruhmtemedien.com","best-xxxvideos.com","bestialitytaboo.tv","bettingexchange.it","bidouillesikea.com","bigdata-social.com","bigdata.rawlazy.si","bigpiecreative.com","bigsouthsports.com","bigtitsxxxfree.com","birdsandblooms.com","blisseyhusband.net","blogredmachine.com","blogx.almontsf.com","blowjobamateur.net","blowjobpornset.com","bluecoreinside.com","bluemediastorage.*","bombshellbling.com","bonsaiprolink.shop","bosoxinjection.com","businessinsider.de","calculatorsoup.com","camwhorescloud.com","captown.capcom.com","cararegistrasi.com","casos-aislados.com","cdimg.blog.2nt.com","cehennemstream.xyz","cerbahealthcare.it","chiangraitimes.com","chicagobearshq.com","chicagobullshq.com","chicasdesnudas.xxx","chikianimation.org","choiceappstore.xyz","cintateknologi.com","clampschoolholic.*","classicalradio.com","classicxmovies.com","climaaovivo.com.br","clothing-mania.com","codingnepalweb.com","coleccionmovie.com","comicspornoxxx.com","comparepolicyy.com","comparteunclic.com","contractpharma.com","couponscorpion.com","cr7-soccer.store>>","creditcardrush.com","crimsonscrolls.net","crm.urlwebsite.com","cronachesalerno.it","cryptonworld.space","dallasobserver.com","datapendidikan.com","dawgpounddaily.com","dcdirtylaundry.com","denverpioneers.com","depressionhurts.us","descargaspcpro.net","desifuckonline.com","deutschekanale.com","devicediary.online","dianaavoidthey.com","diariodenavarra.es","digicol.dpm.org.cn","dirtyasiantube.com","dirtygangbangs.com","discover-sharm.com","diyphotography.net","diyprojectslab.com","donaldlineelse.com","donghuanosekai.com","doublemindtech.com","downloadcursos.top","downloadgames.info","downloadmusic.info","downloadpirate.com","dragonball-zxk.com","dulichkhanhhoa.net","e-mountainbike.com","elconfidencial.com","elearning-cpge.com","embed-player.space","empire-streaming.*","english-dubbed.com","english-topics.com","erikcoldperson.com","evdeingilizcem.com","eveningtimes.co.uk","exactlyhowlong.com","expressbydgoski.pl","extremosports.club","familyhandyman.com","favoyeurtube.net>>","fightingillini.com","financenova.online","financialjuice.com","flacdownloader.com","flashgirlgames.com","flashingjungle.com","foodiesgallery.com","foreversparkly.com","formasyonhaber.net","forum.cstalking.tv","francaisfacile.net","free-gay-clips.com","freeadultcomix.com","freeadultvideos.cc","freebiesmockup.com","freecoursesite.com","freefireupdate.com","freegogpcgames.com","freegrannyvids.com","freemockupzone.com","freemoviesfull.com","freepornasians.com","freepublicporn.com","freereceivesms.com","freeviewmovies.com","freevipservers.net","freevstplugins.net","freewoodworking.ca","freex2line.onlinex","freshwaterdell.com","friscofighters.com","fritidsmarkedet.dk","fuckhairygirls.com","fuckingsession.com","fullvideosporn.com","galinhasamurai.com","gamerevolution.com","games.arkadium.com","games.kentucky.com","games.mashable.com","games.thestate.com","gamingforecast.com","gaypornmasters.com","gazetakrakowska.pl","gazetazachodnia.eu","gdrivelatinohd.net","geniale-tricks.com","geniussolutions.co","girlsgogames.co.uk","go.bucketforms.com","goafricaonline.com","gobankingrates.com","gocurrycracker.com","godrakebulldog.com","gojapaneseporn.com","golf.rapidmice.com","gorro-4go5b3nj.fun","gorro-9mqnb7j2.fun","gorro-chfzoaas.fun","gorro-ry0ziftc.fun","grouppornotube.com","gruenderlexikon.de","gudangfirmwere.com","guessthemovie.name","hamptonpirates.com","hard-tube-porn.com","healthfirstweb.com","healthnewsreel.com","healthy4pepole.com","heatherdisarro.com","hentaipornpics.net","hentaisexfilms.com","heraldscotland.com","hiddencamstube.com","highkeyfinance.com","hindustantimes.com","homeairquality.org","homemoviestube.com","hotanimevideos.com","hotbabeswanted.com","hotxxxjapanese.com","hqamateurtubes.com","huffingtonpost.com","huitranslation.com","humanbenchmark.com","hyundaitucson.info","idedroidsafelink.*","idevicecentral.com","ifreemagazines.com","ikingfile.mooo.com","ilcamminodiluce.it","imagetranslator.io","indecentvideos.com","indesignskills.com","indianbestporn.com","indianpornvideos.*","indiansexbazar.com","infamous-scans.com","infinitehentai.com","infinityblogger.in","infojabarloker.com","informatudo.com.br","informaxonline.com","insidemarketing.it","insidememorial.com","insider-gaming.com","insurancesfact.com","intercelestial.com","investor-verlag.de","iowaconference.com","islamicpdfbook.com","italianporn.com.es","ithinkilikeyou.net","iusedtobeaboss.com","jacksonguitars.com","jamessoundcost.com","japanesemomsex.com","japanesetube.video","jasminetesttry.com","jemontremabite.com","jeux.meteocity.com","johnalwayssame.com","jojolandsmanga.com","joomlabeginner.com","jujustu-kaisen.com","justfamilyporn.com","justpicsplease.com","justtoysnoboys.com","kawaguchimaeda.com","kdramasmaza.com.pk","kellywhatcould.com","keralatelecom.info","kickasstorrents2.*","kittyfuckstube.com","knowyourphrase.com","kobitacocktail.com","komisanwamanga.com","kr-weathernews.com","krebs-horoskop.com","kstatefootball.net","kstatefootball.org","laopinioncoruna.es","leagueofgraphs.com","leckerschmecker.me","leo-horoscopes.com","letribunaldunet.fr","leviathanmanga.com","levismodding.co.uk","lib.hatenablog.com","link.get2short.com","link.paid4link.com","linkedmoviehub.top","linux-community.de","listenonrepeat.com","literarysomnia.com","littlebigsnake.com","liveandletsfly.com","localemagazine.com","longbeachstate.com","lotus-tours.com.hk","loyolaramblers.com","lukecomparetwo.com","luzernerzeitung.ch","m.timesofindia.com","maggotdrowning.com","magicgameworld.com","makeincomeinfo.com","maketecheasier.com","makotoichikawa.net","mallorcazeitung.es","manager-magazin.de","manchesterworld.uk","mangas-origines.fr","manoramaonline.com","maraudersports.com","mathplayground.com","maturetubehere.com","maturexxxclips.com","mctechsolutions.in","mediascelebres.com","megafilmeshd50.com","megahentaitube.com","megapornfreehd.com","mein-wahres-ich.de","memorialnotice.com","merlininkazani.com","mespornogratis.com","mesquitaonline.com","minddesignclub.org","minhasdelicias.com","mobilelegends.shop","mobiletvshows.site","modele-facture.com","moflix-stream.fans","montereyherald.com","motorcyclenews.com","moviescounnter.com","moviesonlinefree.*","mygardening411.com","myhentaicomics.com","mymusicreviews.com","myneobuxportal.com","mypornstarbook.net","nadidetarifler.com","naijachoice.com.ng","nakedgirlsroom.com","nakedneighbour.com","nauci-engleski.com","nauci-njemacki.com","netaffiliation.com","neueroeffnung.info","nevadawolfpack.com","newjapanesexxx.com","news-geinou100.com","newyorkupstate.com","nicematureporn.com","niestatystyczny.pl","nightdreambabe.com","nontonvidoy.online","noodlemagazine.com","novacodeportal.xyz","nudebeachpussy.com","nudecelebforum.com","nuevos-mu.ucoz.com","nyharborwebcam.com","o2tvseries.website","oceanbreezenyc.org","officegamespot.com","omnicalculator.com","onepunch-manga.com","onetimethrough.com","onlinesudoku.games","onlinetutorium.com","onlinework4all.com","onlygoldmovies.com","onscreensvideo.com","openchat-review.me","pakistaniporn2.com","passportaction.com","pc-spiele-wiese.de","pcgamedownload.net","pcgameshardware.de","peachprintable.com","peliculas-dvdrip.*","penisbuyutucum.net","pestleanalysis.com","pinayviralsexx.com","plainasianporn.com","play.starsites.fun","play.watch20.space","player.euroxxx.net","player.vidplus.pro","playeriframe.lol>>","playretrogames.com","pliroforiki-edu.gr","policesecurity.com","policiesreview.com","polskawliczbach.pl","pornhubdeutsch.net","pornmaturetube.com","pornohubonline.com","pornovideos-hd.com","pornvideospass.com","powerthesaurus.org","premiumstream.live","present.rssing.com","printablecrush.com","problogbooster.com","productkeysite.com","projectfreetv2.com","projuktirkotha.com","proverbmeaning.com","psicotestuned.info","pussytubeebony.com","racedepartment.com","radio-en-direct.fr","radioitalylive.com","radionorthpole.com","ratemyteachers.com","realfreelancer.com","realtormontreal.ca","recherche-ebook.fr","redamateurtube.com","redbubbletools.com","redstormsports.com","replica-watch.info","reporterherald.com","rightdark-scan.com","rincondelsazon.com","ripcityproject.com","risefromrubble.com","romaniataramea.com","ryanagoinvolve.com","sabornutritivo.com","samrudhiglobal.com","samurai.rzword.xyz","sandrataxeight.com","sankakucomplex.com","sattakingcharts.in","scarletandgame.com","scarletknights.com","schoener-wohnen.de","sciencechannel.com","scopateitaliane.it","seamanmemories.com","selfstudybrain.com","sethniceletter.com","sexiestpicture.com","sexteenxxxtube.com","sexy-youtubers.com","sexykittenporn.com","sexymilfsearch.com","shadowrangers.live","shemaletoonsex.com","shipseducation.com","shrivardhantech.in","shutupandgo.travel","sidelionreport.com","siirtolayhaber.com","simpledownload.net","siteunblocked.info","slowianietworza.pl","smithsonianmag.com","soccerstream100.to","sociallyindian.com","softwaredetail.com","sosyalbilgiler.net","southernliving.com","southparkstudios.*","spank-and-bang.com","sportstohfa.online","stapewithadblock.*","stream.nflbox.me>>","streamelements.com","streaming-french.*","strtapeadblocker.*","surgicaltechie.com","sweeteroticart.com","syracusecrunch.com","tamilultratv.co.in","tapeadsenjoyer.com","tcpermaculture.com","technicalviral.com","telefullenvivo.com","telexplorer.com.ar","theblissempire.com","thecelticbhoys.com","theendlessmeal.com","thefirearmblog.com","thehentaiworld.com","thelesbianporn.com","thepewterplank.com","thepiratebay10.org","theralphretort.com","thestarphoenix.com","thesuperdownload.*","thiagorossi.com.br","thisisourbliss.com","tiervermittlung.de","tiktokrealtime.com","times-standard.com","tiny-sparklies.com","tips-and-tricks.co","tokyo-ghoul.online","tonpornodujour.com","topbiography.co.in","torrentdosfilmes.*","torrentdownloads.*","totalsportekhd.com","traductionjeux.com","trannysexmpegs.com","transgirlslive.com","traveldesearch.com","travelplanspro.com","trendyol-milla.com","tribeathletics.com","trovapromozioni.it","truckingboards.com","truyenbanquyen.com","truyenhentai18.net","tuhentaionline.com","tulsahurricane.com","turboimagehost.com","tv3play.skaties.lv","tvonlinesports.com","tweaksforgeeks.com","txstatebobcats.com","ucirvinesports.com","ukrainesmodels.com","uncensoredleak.com","universfreebox.com","unlimitedfiles.xyz","urbanmilwaukee.com","urlaubspartner.net","venus-and-mars.com","vermangasporno.com","verywellhealth.com","victor-mochere.com","videos.porndig.com","videosinlevels.com","videosxxxputas.com","vintagepornfun.com","vintagepornnew.com","vintagesexpass.com","waitrosecellar.com","washingtonpost.com","watch.rkplayer.xyz","watch.shout-tv.com","watchadsontape.com","wblaxmibhandar.com","weakstreams.online","weatherzone.com.au","web.livecricket.is","webloadedmovie.com","websitesbridge.com","werra-rundschau.de","wheatbellyblog.com","wildhentaitube.com","windowsmatters.com","winteriscoming.net","wohnungsboerse.net","woman.excite.co.jp","worldstreams.click","wormser-zeitung.de","www.apkmoddone.com","www.cloudflare.com","www.primevideo.com","xbox360torrent.com","xda-developers.com","xn--kckzb2722b.com","xpressarticles.com","xxx-asian-tube.com","xxxanimemovies.com","xxxanimevideos.com","yify-subtitles.org","youngpussyfuck.com","youwatch-serie.com","yt-downloaderz.com","ytmp4converter.com","znanemediablog.com","zxi.mytechroad.com","aachener-zeitung.de","abukabir.fawrye.com","abyssplay.pages.dev","academiadelmotor.es","adblockstreamtape.*","addtobucketlist.com","adultgamesworld.com","agrigentonotizie.it","aliendictionary.com","allafricangirls.net","allindiaroundup.com","allporncartoons.com","almohtarif-tech.net","altadefinizione01.*","amateur-couples.com","amaturehomeporn.com","amazingtrannies.com","androidrepublic.org","angeloyeo.github.io","animefuckmovies.com","animeonlinefree.org","animesonlineshd.com","annoncesescorts.com","anonymous-links.com","anonymousceviri.com","app.link2unlock.com","app.studysmarter.de","aprenderquechua.com","arabianbusiness.com","arizonawildcats.com","arnaqueinternet.com","arrowheadaddict.com","artificialnudes.com","asiananimaltube.org","asianfuckmovies.com","asianporntube69.com","audiobooks4soul.com","audiotruyenfull.com","bailbondsfinder.com","baltimoreravens.com","beautypackaging.com","beisbolinvernal.com","berliner-zeitung.de","bestmaturewomen.com","bethshouldercan.com","bigcockfreetube.com","bigsouthnetwork.com","blackenterprise.com","blog.cloudflare.com","blog.itijobalert.in","blog.potterworld.co","bluemediadownload.*","bordertelegraph.com","brucevotewithin.com","businessinsider.com","calculascendant.com","cambrevenements.com","cancelguider.online","canuckaudiomart.com","celebritynakeds.com","celebsnudeworld.com","certificateland.com","chakrirkhabar247.in","championpeoples.com","chawomenshockey.com","chicagosportshq.com","christiantrendy.com","chubbypornmpegs.com","citationmachine.net","civilenggforall.com","classicpornbest.com","classicpornvids.com","clevelandbrowns.com","collegeteentube.com","columbiacougars.com","comicsxxxgratis.com","commande.rhinov.pro","commsbusiness.co.uk","comofuncionaque.com","compilationtube.xyz","comprovendolibri.it","concealednation.org","consigliatodanoi.it","couponsuniverse.com","crackedsoftware.biz","creativebusybee.com","crossdresserhub.com","crosswordsolver.com","crystal-launcher.pl","custommapposter.com","daddyfuckmovies.com","daddylivestream.com","dailyjobposting.xyz","dailymaverick.co.za","dartmouthsports.com","der-betze-brennt.de","descargaranimes.com","descargatepelis.com","deseneledublate.com","desktopsolution.org","detroitjockcity.com","dev.fingerprint.com","developerinsider.co","diariodemallorca.es","diarioeducacion.com","dichvureviewmap.com","diendancauduong.com","digitalfernsehen.de","digitalseoninja.com","digitalstudiome.com","dignityobituary.com","discordfastfood.com","divinelifestyle.com","divxfilmeonline.net","dktechnicalmate.com","download.megaup.net","dubipc.blogspot.com","dynamicminister.net","dziennikbaltycki.pl","dziennikpolski24.pl","dziennikzachodni.pl","earn.quotesopia.com","edmontonjournal.com","elamigosedition.com","ellibrepensador.com","embed.nana2play.com","en-thunderscans.com","en.financerites.com","erotic-beauties.com","eventiavversinews.*","expresskaszubski.pl","fansubseries.com.br","fatblackmatures.com","faucetcaptcha.co.in","felicetommasino.com","femdomporntubes.com","fifaultimateteam.it","filmeonline2018.net","filmesonlinehd1.org","firstasianpussy.com","footballfancast.com","footballstreams.lol","footballtransfer.ru","fortnitetracker.com","fplstatistics.co.uk","franceprefecture.fr","free-trannyporn.com","freecoursesites.com","freecoursesonline.*","freegamescasual.com","freeindianporn.mobi","freeindianporn2.com","freeplayervideo.com","freescorespiano.com","freesexvideos24.com","freetarotonline.com","freshsexxvideos.com","frustfrei-lernen.de","fuckmonstercock.com","fuckslutsonline.com","futura-sciences.com","gagaltotal666.my.id","gallant-matures.com","gamecocksonline.com","games.bradenton.com","games.fresnobee.com","games.heraldsun.com","games.sunherald.com","gazetawroclawska.pl","generacionretro.net","gesund-vital.online","gfilex.blogspot.com","global.novelpia.com","gloswielkopolski.pl","go-for-it-wgt1a.fun","goarmywestpoint.com","godrakebulldogs.com","godrakebulldogs.net","goodnewsnetwork.org","hailfloridahail.com","hamburgerinsult.com","hardcorelesbian.xyz","hardwarezone.com.sg","hardwoodhoudini.com","hartvannederland.nl","haus-garten-test.de","haveyaseenjapan.com","hawaiiathletics.com","hayamimi-gunpla.com","healthbeautybee.com","helpnetsecurity.com","hentai-mega-mix.com","hentaianimezone.com","hentaisexuality.com","hieunguyenphoto.com","highdefdiscnews.com","hindimatrashabd.com","hindimearticles.net","hindimoviesonline.*","historicaerials.com","hmc-id.blogspot.com","hobby-machinist.com","home-xxx-videos.com","horseshoeheroes.com","hostingdetailer.com","hotbeautyhealth.com","hotorientalporn.com","hqhardcoreporno.com","ianrequireadult.com","ilbolerodiravel.org","ilforumdeibrutti.is","indianpornvideo.org","individualogist.com","ingyenszexvideok.hu","insidertracking.com","insidetheiggles.com","interculturalita.it","inventionsdaily.com","iptvxtreamcodes.com","itsecuritynews.info","iulive.blogspot.com","jacquieetmichel.net","japanesexxxporn.com","javuncensored.watch","jayservicestuff.com","jessicaclearout.com","joguinhosgratis.com","justcastingporn.com","justsexpictures.com","k-statefootball.net","k-statefootball.org","kentstatesports.com","kenzo-flowertag.com","kingjamesgospel.com","kingsofkauffman.com","kissmaturestube.com","klettern-magazin.de","kreuzwortraetsel.de","kstateathletics.com","ladypopularblog.com","lawweekcolorado.com","learnchannel-tv.com","learnmarketinfo.com","legionpeliculas.org","legionprogramas.org","leitesculinaria.com","lemino.docomo.ne.jp","letrasgratis.com.ar","lifeisbeautiful.com","limiteddollqjc.shop","livetv.moviebite.cc","livingstondaily.com","localizaagencia.com","lorimuchbenefit.com","love-stoorey210.net","m.jobinmeghalaya.in","main.24jobalert.com","marketrevolution.eu","masashi-blog418.com","massagefreetube.com","maturepornphoto.com","measuringflower.com","mediatn.cms.nova.cz","meeting.tencent.com","megajapanesesex.com","meicho.marcsimz.com","miamiairportcam.com","miamibeachradio.com","migliori-escort.com","mikaylaarealike.com","mindmotion93y8.shop","minecraft-forum.net","minecraftraffle.com","minhaconexao.com.br","minutemirror.com.pk","mittelbayerische.de","mobilesexgamesx.com","montrealgazette.com","morinaga-office.net","motherandbaby.co.uk","movies-watch.com.pk","myhentaigallery.com","mynaturalfamily.com","myreadingmanga.info","noticiascripto.site","novelmultiverse.com","novelsparadise.site","nude-beach-tube.com","nudeselfiespics.com","nurparatodos.com.ar","obituaryupdates.com","oldgrannylovers.com","onlinefetishporn.cc","onlinepornushka.com","opisanie-kartin.com","orangespotlight.com","outdoor-magazin.com","painting-planet.com","parasportontario.ca","parrocchiapalata.it","paulkitchendark.com","peopleenespanol.com","perfectmomsporn.com","petitegirlsnude.com","pharmaguideline.com","phoenixnewtimes.com","phonereviewinfo.com","pickleballclubs.com","picspornamateur.com","platform.autods.com","play.dictionary.com","play.geforcenow.com","play.mylifetime.com","play.playkrx18.site","player.popfun.co.uk","player.uwatchfree.*","pompanobeachcam.com","popularasianxxx.com","poradyiwskazowki.pl","pornjapanesesex.com","pornocolegialas.org","pornocolombiano.net","pornosubtitula2.com","pornstarsadvice.com","portmiamiwebcam.com","porttampawebcam.com","pranarevitalize.com","protege-torrent.com","psychology-spot.com","publicidadtulua.com","quest.to-travel.net","raccontivietati.com","radiosantaclaus.com","radiotormentamx.com","rawofficethumbs.com","readcomicsonline.ru","realitybrazzers.com","redowlanalytics.com","relampagomovies.com","reneweconomy.com.au","richardsignfish.com","richmondspiders.com","ripplestream4u.shop","roberteachfinal.com","rojadirectaenhd.net","rojadirectatvlive.*","rollingglobe.online","romanticlesbian.com","rundschau-online.de","ryanmoore.marketing","rysafe.blogspot.com","samurai.wordoco.com","santoinferninho.com","savingsomegreen.com","scansatlanticos.com","scholarshiplist.org","schrauben-normen.de","secondhandsongs.com","sempredirebanzai.it","sempreupdate.com.br","serieshdpormega.com","seriezloaded.com.ng","setsuyakutoushi.com","sex-free-movies.com","sexyvintageporn.com","shogaisha-shuro.com","shogaisha-techo.com","sixsistersstuff.com","skidrowreloaded.com","smartkhabrinews.com","soap2day-online.com","soccerfullmatch.com","soccerworldcup.me>>","sociologicamente.it","somulhergostosa.com","sourcingjournal.com","sousou-no-frieren.*","sportitalialive.com","sportzonline.site>>","spotidownloader.com","ssdownloader.online","standardmedia.co.ke","stealthoptional.com","stevenuniverse.best","stormininnorman.com","storynavigation.com","stoutbluedevils.com","stream.offidocs.com","stream.pkayprek.com","streamadblockplus.*","streamcasthub.store","streamshunters.eu>>","streamtapeadblock.*","submissive-wife.net","summarynetworks.com","sussexexpress.co.uk","svetatnazdraveto.bg","sweetadult-tube.com","tainio-mania.online","tamilfreemp3songs.*","tapewithadblock.org","teachersupdates.net","technicalline.store","techtrendmakers.com","tekniikanmaailma.fi","telecharger-igli4.*","thebalancemoney.com","theberserkmanga.com","thecrazytourist.com","theglobeandmail.com","themehospital.co.uk","theoaklandpress.com","thesimsresource.com","thesmokingcuban.com","thewatchseries.live","throwsmallstone.com","timesnowmarathi.com","timmaybealready.com","tiz-cycling-live.io","tophentaicomics.com","toptenknowledge.com","totalfuckmovies.com","totalmaturefuck.com","transexuales.gratis","trendsderzukunft.de","trucs-et-astuces.co","tubepornclassic.com","tubevintageporn.com","turkishseriestv.net","turtleboysports.com","tutorialsduniya.com","tw-hkt.blogspot.com","ukmagazinesfree.com","uktvplay.uktv.co.uk","ultimate-guitar.com","usinger-anzeiger.de","utahstateaggies.com","valleyofthesuns.com","veryfastdownload.pw","vinylcollective.com","vip.stream101.space","virtual-youtuber.jp","virtualdinerbot.com","vitadacelebrita.com","wallpaperaccess.com","watch-movies.com.pk","watchlostonline.net","watchmonkonline.com","watchmoviesrulz.com","watchonlinemovie.pk","webhostingoffer.org","weneverbeenfree.com","weristdeinfreund.de","windows-7-forum.net","winit.heatworld.com","woffordterriers.com","worldaffairinfo.com","worldstarhiphop.com","worldtravelling.com","www2.tmyinsight.net","xhamsterdeutsch.xyz","xn--nbkw38mlu2a.com","xnxx-downloader.net","xnxx-sex-videos.com","xxxhentaimovies.com","xxxpussysextube.com","xxxsexyjapanese.com","yaoimangaonline.com","yellowblissroad.com","yorkshirepost.co.uk","your-daily-girl.com","youramateurporn.com","youramateurtube.com","yourlifeupdated.net","youtubedownloader.*","zeeplayer.pages.dev","25yearslatersite.com","27-sidefire-blog.com","2adultflashgames.com","acienciasgalilei.com","adult-sex-gamess.com","adultdvdparadise.com","akatsuki-no-yona.com","allcelebritywiki.com","allcivilstandard.com","allnewindianporn.com","aman-dn.blogspot.com","amateurebonypics.com","amateuryoungpics.com","analysis-chess.io.vn","androidapkmodpro.com","androidtunado.com.br","angolopsicologia.com","animalextremesex.com","apenasmaisumyaoi.com","aquiyahorajuegos.net","aroundthefoghorn.com","aspdotnet-suresh.com","ayobelajarbareng.com","badassdownloader.com","bailiwickexpress.com","banglachotigolpo.xyz","best-mobilegames.com","bestmp3converter.com","bestshemaleclips.com","bigtitsporn-tube.com","blackwoodacademy.org","bloggingawaydebt.com","bloggingguidance.com","boainformacao.com.br","bogowieslowianscy.pl","bollywoodshaadis.com","boxofficebusiness.in","br.nacaodamusica.com","browardpalmbeach.com","brr-69xwmut5-moo.com","bustyshemaleporn.com","cachevalleydaily.com","canberratimes.com.au","cartoonstvonline.com","cartoonvideos247.com","centralboyssp.com.br","charlestoughrace.com","chasingthedonkey.com","cienagamagdalena.com","climbingtalshill.com","comandotorrenthd.org","consiglietrucchi.com","crackstreamsfree.com","crackstreamshd.click","craigretailers.co.uk","creators.nafezly.com","dailygrindonline.net","dairylandexpress.com","davidsonbuilders.com","decorativemodels.com","defienietlynotme.com","deliciousmagazine.pl","demonyslowianskie.pl","denisegrowthwide.com","descargaseriestv.com","diglink.blogspot.com","divxfilmeonline.tv>>","djsofchhattisgarh.in","docs.fingerprint.com","donna-cerca-uomo.com","downloadfilm.website","durhamopenhouses.com","ear-phone-review.com","earnfromarticles.com","edivaldobrito.com.br","educationbluesky.com","embed.hideiframe.com","encuentratutarea.com","eroticteensphoto.net","escort-in-italia.com","essen-und-trinken.de","eurostreaming.casino","extremereportbot.com","fairforexbrokers.com","famosas-desnudas.org","fastpeoplesearch.com","filmeserialegratis.*","filmpornofrancais.fr","finanznachrichten.de","finding-camellia.com","fle-2ggdmu8q-moo.com","fle-5r8dchma-moo.com","fle-rvd0i9o8-moo.com","footballandress.club","foreverconscious.com","forexwikitrading.com","forge.plebmasters.de","forobasketcatala.com","forum.lolesporte.com","forum.thresholdx.net","fotbolltransfers.com","fr.streamon-sport.ru","free-sms-receive.com","freebigboobsporn.com","freecoursesonline.me","freelistenonline.com","freemagazinespdf.com","freemedicalbooks.org","freepatternsarea.com","freereadnovel.online","freeromsdownload.com","freestreams-live.*>>","freethailottery.live","freshshemaleporn.com","fullywatchonline.com","funeral-memorial.com","gaget.hatenablog.com","games.abqjournal.com","games.dallasnews.com","games.denverpost.com","games.kansascity.com","games.sixtyandme.com","games.wordgenius.com","gearingcommander.com","gesundheitsfrage.net","getfreesmsnumber.com","ghajini-4urg44yg.lol","giuseppegravante.com","giveawayoftheday.com","givemenbastreams.com","googledrivelinks.com","gourmetsupremacy.com","greatestshemales.com","griffinathletics.com","hackingwithreact.com","hds-streaming-hd.com","headlinepolitics.com","heartofvicksburg.com","heartrainbowblog.com","heresyoursavings.com","highheelstrample.com","historichorizons.com","hodgepodgehippie.com","hofheimer-zeitung.de","home-made-videos.com","homestratosphere.com","hornyconfessions.com","hostingreviews24.com","hotasianpussysex.com","hotjapaneseshows.com","huffingtonpost.co.uk","hypelifemagazine.com","immobilienscout24.de","india.marathinewz.in","inkworldmagazine.com","intereseducation.com","irresistiblepets.net","italiadascoprire.net","itpassportgokaku.com","jemontremonminou.com","k-stateathletics.com","kachelmannwetter.com","karaoke4download.com","karaokegratis.com.ar","keedabankingnews.com","lacronicabadajoz.com","laopiniondemalaga.es","laopiniondemurcia.es","laopiniondezamora.es","largescaleforums.com","latinatemptation.com","laweducationinfo.com","lazytranslations.com","learn.moderngyan.com","lemonsqueezyhome.com","lempaala.ideapark.fi","lesbianvideotube.com","letemsvetemapplem.eu","letsworkremotely.com","link.djbassking.live","linksdegrupos.com.br","live-tv-channels.org","loan.bgmi32bitapk.in","loan.punjabworks.com","loriwithinfamily.com","luxurydreamhomes.net","main.sportswordz.com","mangcapquangvnpt.com","maturepornjungle.com","maturewomenfucks.com","mauiinvitational.com","maxfinishseveral.com","medicalstudyzone.com","mein-kummerkasten.de","michaelapplysome.com","mkvmoviespoint.autos","money.quotesopia.com","monkeyanimalporn.com","morganhillwebcam.com","motorbikecatalog.com","motorcitybengals.com","motorsport-total.com","movieloversworld.com","moviemakeronline.com","moviesubtitles.click","mujeresdesnudas.club","mustardseedmoney.com","mylivewallpapers.com","mypace.sasapurin.com","myperfectweather.com","mypussydischarge.com","myuploadedpremium.de","naughtymachinima.com","newfreelancespot.com","neworleanssaints.com","newsonthegotoday.com","nibelungen-kurier.de","notebookcheck-ru.com","notebookcheck-tr.com","nudeplayboygirls.com","nuovo.vidplayer.live","nutraingredients.com","nylonstockingsex.net","onechicagocenter.com","online-xxxmovies.com","onlinegrannyporn.com","oraridiapertura24.it","originalteentube.com","pandadevelopment.net","pasadenastarnews.com","pcgamez-download.com","pesprofessionals.com","pipocamoderna.com.br","plagiarismchecker.co","planetaminecraft.com","platform.twitter.com","play.doramasplus.net","player.amperwave.net","player.smashy.stream","playstationhaber.com","popularmechanics.com","porlalibreportal.com","pornhub-sexfilme.net","portnassauwebcam.com","presentation-ppt.com","prismmarketingco.com","pro.iqsmartgames.com","psychologyjunkie.com","pussymaturephoto.com","radiocountrylive.com","ragnarokscanlation.*","ranaaclanhungary.com","rebeccaneverbase.com","recipestutorials.com","redensarten-index.de","remotejobzone.online","reviewingthebrew.com","rhein-main-presse.de","rinconpsicologia.com","robertplacespace.com","rockpapershotgun.com","roemische-zahlen.net","rojadirectaenvivo.pl","roms-telecharger.com","salamanca24horas.com","sandratableother.com","sarkariresult.social","savespendsplurge.com","schoolgirls-asia.org","schwaebische-post.de","securegames.iwin.com","server-tutorials.net","sexypornpictures.org","socialmediagirls.com","socket.pearsoned.com","solomaxlevelnewbie.*","spicyvintageporn.com","sportstohfa.online>>","starkroboticsfrc.com","stream.nbcsports.com","streamingcommunity.*","strtapewithadblock.*","successstoryinfo.com","superfastrelease.xyz","superpackpormega.com","swietaslowianskie.pl","tainguyenmienphi.com","tasteandtellblog.com","teenamateurphoto.com","telephone-soudan.com","teluguonlinemovies.*","telugusexkathalu.com","thefappeningblog.com","thefastlaneforum.com","thegatewaypundit.com","thekitchenmagpie.com","thesarkariresult.net","tienichdienthoai.net","tinyqualityhomes.org","tomb-raider-king.com","totalsportek1000.com","toyoheadquarters.com","travellingdetail.com","trueachievements.com","tutorialforlinux.com","udemy-downloader.com","underground.tboys.ro","utahsweetsavings.com","utepminermaniacs.com","ver-comics-porno.com","ver-mangas-porno.com","videoszoofiliahd.com","vintageporntubes.com","viralviralvideos.com","virgo-horoscopes.com","visualcapitalist.com","wallstreet-online.de","watchallchannels.com","watchcartoononline.*","watchgameofthrones.*","watchhouseonline.net","watchsuitsonline.net","watchtheofficetv.com","wegotthiscovered.com","weihnachts-filme.com","wetasiancreampie.com","whats-on-netflix.com","wife-home-videos.com","wirtualnynowydwor.pl","worldgirlsportal.com","yakyufan-asobiba.com","youfreepornotube.com","youngerasiangirl.net","yourhomemadetube.com","youtube-nocookie.com","yummytummyaarthi.com","1337x.ninjaproxy1.com","3dassetcollection.com","3dprintersforum.co.uk","ableitungsrechner.net","ad-itech.blogspot.com","airportseirosafar.com","airsoftmilsimnews.com","allgemeine-zeitung.de","ar-atech.blogspot.com","arabamob.blogspot.com","arrisalah-jakarta.com","banglachoti-story.com","bestsellerforaday.com","bibliotecadecorte.com","bigbuttshubvideos.com","blackchubbymovies.com","blackmaturevideos.com","blasianluvforever.com","blog.motionisland.com","bournemouthecho.co.uk","branditechture.agency","brandstofprijzen.info","broncathleticfund.com","brutalanimalsfuck.com","bucetaspeludas.com.br","business-standard.com","calculator-online.net","cancer-horoscopes.com","celebritydeeplink.com","collinsdictionary.com","comentariodetexto.com","conselhosetruques.com","course-downloader.com","daddylivestream.com>>","dailyvideoreports.net","davescomputertips.com","desitab69.sextgem.com","destakenewsgospel.com","deutschpersischtv.com","diarioinformacion.com","diplomaexamcorner.com","dirtyyoungbitches.com","disneyfashionista.com","downloadcursos.gratis","dragontranslation.com","dragontranslation.net","dragontranslation.org","earn.mpscstudyhub.com","easyworldbusiness.com","edwardarriveoften.com","elcriticodelatele.com","electricalstudent.com","embraceinnerchaos.com","envato-downloader.com","eroticmoviesonline.me","errotica-archives.com","evelynthankregion.com","expressilustrowany.pl","filemoon-59t9ep5j.xyz","filemoon-nv2xl8an.xyz","filemoon-oe4w6g0u.xyz","filmpornoitaliano.org","fitting-it-all-in.com","foodsdictionary.co.il","free-famous-toons.com","freebulksmsonline.com","freefatpornmovies.com","freeindiansextube.com","freepikdownloader.com","freshmaturespussy.com","friedrichshainblog.de","froheweihnachten.info","gadgetguideonline.com","games.bostonglobe.com","games.centredaily.com","games.dailymail.co.uk","games.greatergood.com","games.miamiherald.com","games.puzzlebaron.com","games.startribune.com","games.theadvocate.com","games.theolympian.com","games.triviatoday.com","gbadamud.blogspot.com","gemini-horoscopes.com","generalpornmovies.com","gentiluomodigitale.it","gentlemansgazette.com","giantshemalecocks.com","giessener-anzeiger.de","girlfuckgalleries.com","glamourxxx-online.com","gmuender-tagespost.de","googlearth.selva.name","goprincetontigers.com","guardian-series.co.uk","hackedonlinegames.com","hersfelder-zeitung.de","hochheimer-zeitung.de","hoegel-textildruck.de","hollywoodreporter.com","hot-teens-movies.mobi","hotmarathistories.com","howtoblogformoney.net","html5.gamemonetize.co","hungarianhardstyle.hu","iamflorianschulze.com","imasdk.googleapis.com","indiansexstories2.net","indratranslations.com","inmatesearchidaho.com","insideeducation.co.za","jacquieetmicheltv.net","jemontremasextape.com","journaldemontreal.com","journey.to-travel.net","jsugamecocksports.com","juninhoscripts.com.br","kana-mari-shokudo.com","kstatewomenshoops.com","kstatewomenshoops.net","kstatewomenshoops.org","labelandnarrowweb.com","lapaginadealberto.com","learnodo-newtonic.com","lebensmittelpraxis.de","lesbianfantasyxxx.com","lingeriefuckvideo.com","live-sport.duktek.pro","lycomingathletics.com","majalahpendidikan.com","malaysianwireless.com","mangaplus.shueisha.tv","megashare-website.com","meuplayeronlinehd.com","midlandstraveller.com","midwestconference.org","mimaletadepeliculas.*","mmoovvfr.cloudfree.jp","moo-teau4c9h-mkay.com","moonfile-62es3l9z.com","motorsport.uol.com.br","musvozimbabwenews.com","mysflink.blogspot.com","nathanfromsubject.com","nationalgeographic.fr","netsentertainment.net","nobledicion.yoveo.xyz","note.sieuthuthuat.com","notformembersonly.com","oberschwaben-tipps.de","onepiecemangafree.com","onlinetntextbooks.com","onlinewatchmoviespk.*","ovcdigitalnetwork.com","paradiseislandcam.com","pcso-lottoresults.com","peiner-nachrichten.de","pelotalibrevivo.net>>","philippinenmagazin.de","photovoltaikforum.com","pickleballleagues.com","pisces-horoscopes.com","platform.adex.network","portbermudawebcam.com","primapaginamarsala.it","printablecreative.com","prod.hydra.sophos.com","quinnipiacbobcats.com","qul-de.translate.goog","radioitaliacanada.com","radioitalianmusic.com","redbluffdailynews.com","reddit-streams.online","redheaddeepthroat.com","redirect.dafontvn.com","revistaapolice.com.br","salzgitter-zeitung.de","santacruzsentinel.com","santafenewmexican.com","scriptgrowagarden.com","scrubson.blogspot.com","semprefi-1h3u8pkc.fun","semprefi-2tazedzl.fun","semprefi-5ut0d23g.fun","semprefi-7oliaqnr.fun","semprefi-8xp7vfr9.fun","semprefi-hdm6l8jq.fun","semprefi-uat4a3jd.fun","semprefi-wdh7eog3.fun","sex-amateur-clips.com","sexybabespictures.com","shortgoo.blogspot.com","showdownforrelief.com","sinnerclownceviri.net","skorpion-horoskop.com","smartwebsolutions.org","snapinstadownload.xyz","softwarecrackguru.com","softwaredescargas.com","solomax-levelnewbie.*","solopornoitaliani.xxx","southsideshowdown.com","soziologie-politik.de","space.tribuntekno.com","stablediffusionxl.com","startupjobsportal.com","steamcrackedgames.com","stream.hownetwork.xyz","streaming-community.*","streamingcommunityz.*","studyinghuman6js.shop","supertelevisionhd.com","sweet-maturewomen.com","symboleslowianskie.pl","tapeadvertisement.com","tarjetarojaenvivo.lat","tarjetarojatvonline.*","taurus-horoscopes.com","taurus.topmanhuas.org","tech.trendingword.com","texteditor.nsspot.net","thecakeboutiquect.com","thedigitaltheater.com","thefightingcock.co.uk","thefreedictionary.com","thegnomishgazette.com","theprofoundreport.com","thetruthaboutcars.com","thewebsitesbridge.com","timesheraldonline.com","timesnewsgroup.com.au","tipsandtricksarab.com","toddpartneranimal.com","torrentdofilmeshd.net","towheaddeepthroat.com","travel-the-states.com","travelingformiles.com","tudo-para-android.com","ukiahdailyjournal.com","unsurcoenlasombra.com","utkarshonlinetest.com","vdl.np-downloader.com","virtualstudybrain.com","voyeur-pornvideos.com","walterprettytheir.com","watch.foodnetwork.com","watchcartoonsonline.*","watchfreejavonline.co","watchkobestreams.info","watchonlinemoviespk.*","watchporninpublic.com","watchseriesstream.com","weihnachts-bilder.org","wetterauer-zeitung.de","whisperingauroras.com","whittierdailynews.com","wiesbadener-kurier.de","wirtualnelegionowo.pl","worldwidestandard.net","www.dailymotion.com>>","xn--mlaregvle-02af.nu","yoima.hatenadiary.com","yoima2.hatenablog.com","zone-telechargement.*","123movies-official.net","1plus1plus1equals1.net","45er-de.translate.goog","acervodaputaria.com.br","adelaidepawnbroker.com","aimasummd.blog.fc2.com","algodaodocescan.com.br","allevertakstream.space","androidecuatoriano.xyz","appstore-discounts.com","automobile-catalog.com","batterypoweronline.com","best4hack.blogspot.com","bestialitysextaboo.com","blackamateursnaked.com","brunettedeepthroat.com","bus-location.1507t.xyz","canadianunderwriter.ca","canzoni-per-bambini.it","cartoonporncomics.info","celebritymovieblog.com","clixwarez.blogspot.com","comandotorrentshds.org","conceptoweb-studio.com","cosmonova-broadcast.tv","cotravinh.blogspot.com","cpopchanelofficial.com","currencyconverterx.com","currentrecruitment.com","dads-banging-teens.com","databasegdriveplayer.*","dewfuneralhomenews.com","diananatureforeign.com","digitalbeautybabes.com","downloadfreecourse.com","drakorkita73.kita.rest","drop.carbikenation.com","dtupgames.blogspot.com","ecommercewebsite.store","einewelteinezukunft.de","electriciansforums.net","elektrobike-online.com","elizabeth-mitchell.org","enciclopediaonline.com","eu-proxy.startpage.com","eurointegration.com.ua","exclusiveasianporn.com","exgirlfriendmarket.com","ezaudiobookforsoul.com","fantasticyoungporn.com","file-1bl9ruic-moon.com","filmeserialeonline.org","freelancerartistry.com","freepic-downloader.com","freepik-downloader.com","ftlauderdalewebcam.com","games.besthealthmag.ca","games.heraldonline.com","games.islandpacket.com","games.journal-news.com","games.readersdigest.ca","gewinnspiele-markt.com","gifhorner-rundschau.de","girlfriendsexphoto.com","golink.bloggerishyt.in","hentai-cosplay-xxx.com","hentai-vl.blogspot.com","hiraethtranslation.com","hockeyfantasytools.com","hopsion-consulting.com","hotanimepornvideos.com","housethathankbuilt.com","illustratemagazine.com","imagetwist.netlify.app","incontri-in-italia.com","indianpornvideo.online","insidekstatesports.com","insidekstatesports.net","insidekstatesports.org","irasutoya.blogspot.com","jacquieetmicheltv2.net","jessicaglassauthor.com","jonathansociallike.com","juegos.eleconomista.es","juneauharborwebcam.com","k-statewomenshoops.com","k-statewomenshoops.net","k-statewomenshoops.org","kenkou-maintenance.com","kristiesoundsimply.com","lagacetadesalamanca.es","lecourrier-du-soir.com","livefootballempire.com","livingincebuforums.com","lonestarconference.org","m.bloggingguidance.com","marissasharecareer.com","marketedgeofficial.com","marketplace.nvidia.com","masterpctutoriales.com","megadrive-emulator.com","meteoregioneabruzzo.it","mini.surveyenquete.net","moneywar2.blogspot.com","muleriderathletics.com","nathanmichaelphoto.com","newbookmarkingsite.com","nilopolisonline.com.br","obutecodanet.ig.com.br","oeffnungszeitenbuch.de","onlinetechsamadhan.com","onlinevideoconverter.*","opiniones-empresas.com","oracleerpappsguide.com","originalindianporn.com","osint-info.netlify.app","paginadanoticia.com.br","philadelphiaeagles.com","pianetamountainbike.it","pittsburghpanthers.com","plagiarismdetector.net","play.discoveryplus.com","portstthomaswebcam.com","poweredbycovermore.com","praxis-jugendarbeit.de","principiaathletics.com","puzzles.standard.co.uk","puzzles.sunjournal.com","radioamericalatina.com","redlandsdailyfacts.com","republicain-lorrain.fr","rubyskitchenrecipes.uk","russkoevideoonline.com","salisburyjournal.co.uk","schwarzwaelder-bote.de","scorpio-horoscopes.com","sexyasianteenspics.com","smallpocketlibrary.com","smartfeecalculator.com","sms-receive-online.com","stellar.quoteminia.com","strangernervousql.shop","streamhentaimovies.com","stuttgarter-zeitung.de","supermarioemulator.com","tastefullyeclectic.com","tatacommunications.com","techieway.blogspot.com","teluguhitsandflops.com","thatballsouttahere.com","the-military-guide.com","thecartoonporntube.com","thehouseofportable.com","tipsandtricksjapan.com","tipsandtrickskorea.com","totalsportek1000.com>>","turkishaudiocenter.com","tutoganga.blogspot.com","tvchoicemagazine.co.uk","unity3diy.blogspot.com","universitiesonline.xyz","universityequality.com","watchdocumentaries.com","webcreator-journal.com","welsh-dictionary.ac.uk","xhamster-sexvideos.com","xn--algododoce-j5a.com","youfiles.herokuapp.com","yourdesignmagazine.com","zeeebatch.blogspot.com","aachener-nachrichten.de","adblockeronstreamtape.*","adrianmissionminute.com","ads-ti9ni4.blogspot.com","adultgamescollector.com","alejandrocenturyoil.com","alleneconomicmatter.com","allschoolboysecrets.com","aquarius-horoscopes.com","arcade.dailygazette.com","asianteenagefucking.com","auto-motor-und-sport.de","barranquillaestereo.com","bestpuzzlesandgames.com","betterbuttchallenge.com","bikyonyu-bijo-zukan.com","brasilsimulatormods.com","buerstaedter-zeitung.de","c--ix-de.translate.goog","careersatcouncil.com.au","cloudapps.herokuapp.com","coolsoft.altervista.org","creditcardgenerator.com","dameungrrr.videoid.baby","destinationsjourney.com","dokuo666.blog98.fc2.com","edgedeliverynetwork.com","elperiodicodearagon.com","encurtador.postazap.com","entertainment-focus.com","escortconrecensione.com","eservice.directauto.com","eskiceviri.blogspot.com","exclusiveindianporn.com","fightforthealliance.com","financeandinsurance.xyz","footballtransfer.com.ua","freefiremaxofficial.com","freemovies-download.com","freepornhdonlinegay.com","funeralmemorialnews.com","gamersdiscussionhub.com","games.mercedsunstar.com","games.pressdemocrat.com","games.sanluisobispo.com","games.star-telegram.com","gamingsearchjournal.com","giessener-allgemeine.de","goctruyentranhvui17.com","heatherwholeinvolve.com","historyofroyalwomen.com","homeschoolgiveaways.com","ilgeniodellostreaming.*","india.mplandrecord.info","influencersgonewild.com","insidekstatesports.info","integral-calculator.com","investmentwatchblog.com","iptvdroid1.blogspot.com","jefferycontrolmodel.com","juegosdetiempolibre.org","julieseatsandtreats.com","kennethofficialitem.com","keysbrasil.blogspot.com","keywestharborwebcam.com","kutubistan.blogspot.com","lancewhosedifficult.com","laurelberninteriors.com","legendaryrttextures.com","linklog.tiagorangel.com","lirik3satu.blogspot.com","loldewfwvwvwewefdw.cyou","megaplayer.bokracdn.run","metamani.blog15.fc2.com","miltonfriedmancores.org","ministryofsolutions.com","mobile-tracker-free.com","mobileweb.bankmellat.ir","moon-3uykdl2w-embed.com","morgan0928-5386paz2.fun","morgan0928-6v7c14vs.fun","morgan0928-8ufkpqp8.fun","morgan0928-oqdmw7bl.fun","morgan0928-t9xc5eet.fun","morganoperationface.com","morrisvillemustangs.com","mountainbike-magazin.de","movielinkbdofficial.com","mrfreemium.blogspot.com","naumburger-tageblatt.de","newlifefuneralhomes.com","news-und-nachrichten.de","northwalespioneer.co.uk","nudeblackgirlfriend.com","nutraceuticalsworld.com","onlinesoccermanager.com","osteusfilmestuga.online","pandajogosgratis.com.br","paradehomeandgarden.com","patriotathleticfund.com","pcoptimizedsettings.com","pepperlivestream.online","phonenumber-lookup.info","player.bestrapeporn.com","player.smashystream.com","player.tormalayalamhd.*","player.xxxbestsites.com","portaldosreceptores.org","portcanaveralwebcam.com","portstmaartenwebcam.com","pramejarab.blogspot.com","predominantlyorange.com","premierfantasytools.com","prepared-housewives.com","privateindianmovies.com","programmingeeksclub.com","puzzles.pressherald.com","receive-sms-online.info","rppk13baru.blogspot.com","searchenginereports.net","seoul-station-druid.com","sexyteengirlfriends.net","sexywomeninlingerie.com","shannonpersonalcost.com","singlehoroskop-loewe.de","snowman-information.com","spacestation-online.com","sqlserveregitimleri.com","streamtapeadblockuser.*","talentstareducation.com","teamupinternational.com","tech.pubghighdamage.com","the-voice-of-germany.de","thechroniclesofhome.com","thehappierhomemaker.com","theinternettaughtme.com","tinycat-voe-fashion.com","tips97tech.blogspot.com","traderepublic.community","tutorialesdecalidad.com","valuable.hatenablog.com","verteleseriesonline.com","watchseries.unblocked.*","wiesbadener-tagblatt.de","windowsaplicaciones.com","xxxjapaneseporntube.com","youtube4kdownloader.com","zonamarela.blogspot.com","zone-telechargement.ing","zoomtventertainment.com","720pxmovies.blogspot.com","abendzeitung-muenchen.de","advertiserandtimes.co.uk","afilmyhouse.blogspot.com","altebwsneno.blogspot.com","anime4mega-descargas.net","aspirapolveremigliori.it","ate60vs7zcjhsjo5qgv8.com","atlantichockeyonline.com","aussenwirtschaftslupe.de","bestialitysexanimals.com","boundlessnecromancer.com","broadbottomvillage.co.uk","businesssoftwarehere.com","canonprintersdrivers.com","cardboardtranslation.com","celebrityleakednudes.com","childrenslibrarylady.com","cimbusinessevents.com.au","cle0desktop.blogspot.com","cloudcomputingtopics.net","culture-informatique.net","democratandchronicle.com","dictionary.cambridge.org","dictionnaire-medical.net","dominican-republic.co.il","downloads.wegomovies.com","downloadtwittervideo.com","dsocker1234.blogspot.com","einrichtungsbeispiele.de","fid-gesundheitswissen.de","freegrannypornmovies.com","freehdinterracialporn.in","ftlauderdalebeachcam.com","futbolenlatelevision.com","galaxytranslations10.com","games.crosswordgiant.com","games.idahostatesman.com","games.thenewstribune.com","games.tri-cityherald.com","gcertificationcourse.com","gelnhaeuser-tageblatt.de","general-anzeiger-bonn.de","greenbaypressgazette.com","hentaianimedownloads.com","hilfen-de.translate.goog","hotmaturegirlfriends.com","inlovingmemoriesnews.com","inmatefindcalifornia.com","insurancebillpayment.net","intelligence-console.com","jacquieetmichelelite.com","jasonresponsemeasure.com","josephseveralconcern.com","juegos.elnuevoherald.com","jumpmanclubbrasil.com.br","lampertheimer-zeitung.de","latribunadeautomocion.es","lauterbacher-anzeiger.de","lespassionsdechinouk.com","liveanimalporn.zooo.club","mariatheserepublican.com","mediapemersatubangsa.com","meine-anzeigenzeitung.de","mentalhealthcoaching.org","minecraft-serverlist.net","moalm-qudwa.blogspot.com","multivideodownloader.com","my-code4you.blogspot.com","noblessetranslations.com","nutraingredients-usa.com","nyangames.altervista.org","oberhessische-zeitung.de","onlinetv.planetfools.com","personality-database.com","phenomenalityuniform.com","philly.arkadiumarena.com","photos-public-domain.com","player.subespanolvip.com","polseksongs.blogspot.com","portevergladeswebcam.com","programasvirtualespc.net","puzzles.centralmaine.com","quelleestladifference.fr","reddit-soccerstreams.com","renierassociatigroup.com","riprendiamocicatania.com","roadrunnersathletics.com","robertordercharacter.com","sandiegouniontribune.com","senaleszdhd.blogspot.com","shoppinglys.blogspot.com","smotret-porno-onlain.com","softdroid4u.blogspot.com","stephenking-00qvxikv.fun","stephenking-3u491ihg.fun","stephenking-7tm3toav.fun","stephenking-c8bxyhnp.fun","stephenking-vy5hgkgu.fun","the-crossword-solver.com","thebharatexpressnews.com","thedesigninspiration.com","therelaxedhomeschool.com","thunderousintentions.com","tirumalatirupatiyatra.in","tubeinterracial-porn.com","unityassetcollection.com","upscaler.stockphotos.com","ustreasuryyieldcurve.com","verpeliculasporno.gratis","virginmediatelevision.ie","watchdoctorwhoonline.com","watchtrailerparkboys.com","workproductivityinfo.com","actionviewphotography.com","arabic-robot.blogspot.com","bharatsarkarijobalert.com","blog.receivefreesms.co.uk","braunschweiger-zeitung.de","businessnamegenerator.com","caroloportunidades.com.br","christopheruntilpoint.com","constructionplacement.org","convert-case.softbaba.com","cooldns-de.translate.goog","ctrmarketingsolutions.com","depo-program.blogspot.com","derivative-calculator.net","devere-group-hongkong.com","devoloperxda.blogspot.com","dictionnaire.lerobert.com","everydayhomeandgarden.com","fantasyfootballgeek.co.uk","fitnesshealtharticles.com","footballleagueworld.co.uk","fotografareindigitale.com","freeserverhostingweb.club","freewatchserialonline.com","game-kentang.blogspot.com","games.daytondailynews.com","games.gameshownetwork.com","games.lancasteronline.com","games.ledger-enquirer.com","games.moviestvnetwork.com","games.theportugalnews.com","gloucestershirelive.co.uk","graceaddresscommunity.com","heatherdiscussionwhen.com","housecardsummerbutton.com","kathleenmemberhistory.com","koume-in-huistenbosch.net","krankheiten-simulieren.de","lancashiretelegraph.co.uk","latribunadelpaisvasco.com","mega-hentai2.blogspot.com","nutraingredients-asia.com","oeffentlicher-dienst.info","oneessentialcommunity.com","onepiece-manga-online.net","passionatecarbloggers.com","percentagecalculator.guru","pickleballteamleagues.com","pickleballtournaments.com","printedelectronicsnow.com","programmiedovetrovarli.it","projetomotog.blogspot.com","puzzles.independent.co.uk","realcanadiansuperstore.ca","receitasoncaseiras.online","schooltravelorganiser.com","scripcheck.great-site.net","searchmovie.wp.xdomain.jp","sentinelandenterprise.com","seogroup.bookmarking.info","silverpetticoatreview.com","softwaresolutionshere.com","sofwaremania.blogspot.com","tech.unblockedgames.world","telenovelas-turcas.com.es","thebeginningaftertheend.*","transparentcalifornia.com","truesteamachievements.com","tucsitupdate.blogspot.com","ultimateninjablazingx.com","usahealthandlifestyle.com","vercanalesdominicanos.com","vintage-erotica-forum.com","whatisareverseauction.com","xn--k9ja7fb0161b5jtgfm.jp","youtubemp3donusturucu.net","yusepjaelani.blogspot.com","a-b-f-dd-aa-bb-cc61uyj.fun","a-b-f-dd-aa-bb-ccn1nff.fun","a-b-f-dd-aa-bb-cctwd3a.fun","a-b-f-dd-aa-bb-ccyh5my.fun","arena.gamesforthebrain.com","audiobookexchangeplace.com","avengerinator.blogspot.com","barefeetonthedashboard.com","basseqwevewcewcewecwcw.xyz","bezpolitickekorektnosti.cz","bibliotecahermetica.com.br","change-ta-vie-coaching.com","collegefootballplayoff.com","cornerstoneconfessions.com","cotannualconference.org.uk","cuatrolatastv.blogspot.com","dinheirocursosdownload.com","downloads.sayrodigital.net","edinburghnews.scotsman.com","elperiodicoextremadura.com","flashplayer.fullstacks.net","former-railroad-worker.com","frankfurter-wochenblatt.de","funnymadworld.blogspot.com","games.bellinghamherald.com","games.everythingzoomer.com","helmstedter-nachrichten.de","html5.gamedistribution.com","investigationdiscovery.com","istanbulescortnetworks.com","jilliandescribecompany.com","johnwardflighttraining.com","mailtool-de.translate.goog","motive213link.blogspot.com","musicbusinessworldwide.com","noticias.gospelmais.com.br","nutraingredients-latam.com","photoshopvideotutorial.com","puzzles.bestforpuzzles.com","recetas.arrozconleche.info","redditsoccerstreams.name>>","ripleyfieldworktracker.com","riverdesdelatribuna.com.ar","sagittarius-horoscopes.com","skillmineopportunities.com","stuttgarter-nachrichten.de","sulocale.sulopachinews.com","thelastgamestandingexp.com","thetelegraphandargus.co.uk","tiendaenlinea.claro.com.ni","todoseriales1.blogspot.com","tokoasrimotedanpayet.my.id","tralhasvarias.blogspot.com","video-to-mp3-converter.com","watchimpracticaljokers.com","whowantstuffs.blogspot.com","windowcleaningforums.co.uk","wolfenbuetteler-zeitung.de","wolfsburger-nachrichten.de","brittneystandardwestern.com","celestialtributesonline.com","charlottepilgrimagetour.com","choose.kaiserpermanente.org","cloud-computing-central.com","cointiply.arkadiumarena.com","constructionmethodology.com","cool--web-de.translate.goog","domainregistrationtips.info","download.kingtecnologia.com","dramakrsubindo.blogspot.com","elperiodicomediterraneo.com","embed.nextgencloudtools.com","evlenmekisteyenbayanlar.net","flash-firmware.blogspot.com","games.myrtlebeachonline.com","ge-map-overlays.appspot.com","happypenguin.altervista.org","iphonechecker.herokuapp.com","littlepandatranslations.com","lurdchinexgist.blogspot.com","newssokuhou666.blog.fc2.com","parametric-architecture.com","pasatiemposparaimprimir.com","practicalpainmanagement.com","puzzles.crosswordsolver.org","redcarpet-fashionawards.com","sztucznainteligencjablog.pl","thewestmorlandgazette.co.uk","timesofindia.indiatimes.com","watchfootballhighlights.com","watchmalcolminthemiddle.com","watchonlyfoolsandhorses.com","your-local-pest-control.com","centrocommercialevulcano.com","conoscereilrischioclinico.it","correction-livre-scolaire.fr","economictimes.indiatimes.com","emperorscan.mundoalterno.org","games.springfieldnewssun.com","gps--cache-de.translate.goog","imagenesderopaparaperros.com","lizs-early-learning-spot.com","locurainformaticadigital.com","michiganrugcleaning.cleaning","mimaletamusical.blogspot.com","net--tools-de.translate.goog","net--tours-de.translate.goog","pekalongan-cits.blogspot.com","publicrecords.netronline.com","skibiditoilet.yourmom.eu.org","springfieldspringfield.co.uk","teachersguidetn.blogspot.com","tekken8combo.kagewebsite.com","theeminenceinshadowmanga.com","uptodatefinishconference.com","watchonlinemovies.vercel.app","www-daftarharga.blogspot.com","youkaiwatch2345.blog.fc2.com","bayaningfilipino.blogspot.com","beautypageants.indiatimes.com","counterstrike-hack.leforum.eu","dev-dark-blog.pantheonsite.io","educationtips213.blogspot.com","fun--seiten-de.translate.goog","hortonanderfarom.blogspot.com","panlasangpinoymeatrecipes.com","pharmaceutical-technology.com","play.virginmediatelevision.ie","pressurewasherpumpdiagram.com","thefreedommatrix.blogspot.com","walkthrough-indo.blogspot.com","web--spiele-de.translate.goog","wojtekczytawh40k.blogspot.com","caq21harderv991gpluralplay.xyz","comousarzararadio.blogspot.com","coolsoftware-de.translate.goog","hipsteralcolico.altervista.org","jennifercertaindevelopment.com","kryptografie-de.translate.goog","mp3songsdownloadf.blogspot.com","noicetranslations.blogspot.com","oxfordlearnersdictionaries.com","pengantartidurkuh.blogspot.com","photo--alben-de.translate.goog","rheinische-anzeigenblaetter.de","thelibrarydigital.blogspot.com","touhoudougamatome.blog.fc2.com","watchcalifornicationonline.com","wwwfotografgotlin.blogspot.com","bigclatterhomesguideservice.com","bitcoinminingforex.blogspot.com","cool--domains-de.translate.goog","ibecamethewifeofthemalelead.com","pickcrackpasswords.blogspot.com","posturecorrectorshop-online.com","safeframe.googlesyndication.com","sozialversicherung-kompetent.de","utilidades.ecuadjsradiocorp.com","akihabarahitorigurasiseikatu.com","deletedspeedstreams.blogspot.com","freesoftpdfdownload.blogspot.com","games.games.newsgames.parade.com","insuranceloan.akbastiloantips.in","situsberita2terbaru.blogspot.com","such--maschine-de.translate.goog","uptodatefinishconferenceroom.com","games.charlottegames.cnhinews.com","loadsamusicsarchives.blogspot.com","pythonmatplotlibtips.blogspot.com","ragnarokscanlation.opchapters.com","tw.xn--h9jepie9n6a5394exeq51z.com","papagiovannipaoloii.altervista.org","softwareengineer-de.translate.goog","rojadirecta-tv-en-vivo.blogspot.com","thenightwithoutthedawn.blogspot.com","tenseishitaraslimedattaken-manga.com","wetter--vorhersage-de.translate.goog","marketing-business-revenus-internet.fr","hardware--entwicklung-de.translate.goog","2g8rktp1fn9feqlhxexsw8o4snafapdh9dn1.fun","5rr03ujky5me3sjzvfosr6p89hk6wd34qamf.fun","jmtv4zqntu5oyprw4seqtn0dmjulf9nebif0.fun","xn--n8jwbyc5ezgnfpeyd3i0a3ow693bw65a.com","sharpen-free-design-generator.netlify.app","a-b-c-d-e-f7011d0w3j3aor0dczs5ctoo2zpz1t6bm5f49.fun","a-b-c-d-e-f9jeats0w5hf22jbbxcrpnq37qq6nbxjwypsy.fun","a-b-c-d-e-fla3m19lerkfex1z9kdr5pd4hx0338uwsvbjx.fun","a-b-f2muvhnjw63ruyhoxhhrd61eszezz6jdj4jy1-b-d-t-s.fun","a-b-f7mh86v4lirbwg7m4qiwwlk2e4za9uyngqy1u-b-d-t-s.fun","a-b-fjkt8v1pxgzrc3lqoaz8fh7pjgygf4zh3eqhl-b-d-t-s.fun","a-b-fnv7h0323ap2wfqj1ruyo8id2bcuoq4kufzon-b-d-t-s.fun","a-b-fqmze5gr05g3y4azx9adr9bd2eow7xoqwbuxg-b-d-t-s.fun","ulike-filter-sowe-canplay-rightlets-generate-themrandomlyl89u8.fun"];

const $scriptletFromRegexes$ = /* 8 */ ["-embed.c","^moon(?:-[a-z0-9]+)?-embed\\.com$","56,57","moonfile","^moonfile-[a-z0-9-]+\\.com$","56,57",".","^[0-9a-z]{5,8}\\.(art|cfd|fun|icu|info|live|pro|sbs|world)$","56,57","-mkay.co","^moo-[a-z0-9]+(-[a-z0-9]+)*-mkay\\.com$","56,57","file-","^file-[a-z0-9]+(-[a-z0-9]+)*-(moon|embed)\\.com$","56,57","-moo.com","^fle-[a-z0-9]+(-[a-z0-9]+)*-moo\\.com$","56,57","filemoon","^filemoon-[a-z0-9]+(?:-[a-z0-9]+)*\\.(?:com|xyz)$","56,57","tamilpri","(\\d{0,1})?tamilprint(\\d{1,2})?\\.[a-z]{3,7}","106,1525,2417"];

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
