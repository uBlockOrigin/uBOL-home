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
[trustedJsonEditXhrRequest,adjustSetTimeout,jsonPruneFetchResponse,jsonPruneXhrResponse,trustedReplaceXhrResponse,trustedReplaceFetchResponse,trustedPreventDomBypass,jsonPrune,jsonEdit,setConstant,jsonlEditXhrResponse,noWindowOpenIf,abortCurrentScript,trustedSetConstant,trustedSuppressNativeMethod,abortOnStackTrace,preventRequestAnimationFrame,preventInnerHTML,abortOnPropertyRead,preventXhr,preventSetTimeout,preventFetch,removeAttr,trustedReplaceArgument,trustedOverrideElementMethod,trustedReplaceOutboundText,preventAddEventListener,adjustSetInterval,preventSetInterval,abortOnPropertyWrite,noWebrtc,noEvalIf,disableNewtabLinks,spoofCSS,trustedJsonEdit,trustedJsonEditXhrResponse,jsonEditXhrResponse,xmlPrune,m3uPrune,jsonEditFetchResponse,trustedPreventXhr,trustedPreventFetch,trustedEditInboundObject,alertBuster,preventCanvas,trustedJsonEditFetchResponse,jsonEditFetchRequest];

const $scriptletArgs$ = /* 3105 */ ["[?..userAgent*=\"channel\"]..client[?.clientName==\"WEB\"]+={\"clientScreen\":\"CHANNEL\"}","propsToMatch","/player?","[?..userAgent=/adunit|channel|lactmilli|instream|eafg/]..referer=repl({\"regex\":\"$\",\"replacement\":\"#reloadxhr\"})","[native code]","17000","0.001","adPlacements adSlots playerResponse.adPlacements playerResponse.adSlots [].playerResponse.adPlacements [].playerResponse.adSlots","","adPlacements adSlots playerResponse.adPlacements playerResponse.adSlots","/playlist?","/\\/player(?:\\?.+)?$/","\"adPlacements\"","\"no_ads\"","/playlist\\?list=|\\/player(?:\\?.+)?$|watch\\?[tv]=/","/\"adPlacements.*?([A-Z]\"\\}|\"\\}{2,4})\\}\\],/","/\"adPlacements.*?(\"adSlots\"|\"adBreakHeartbeatParams\")/gms","$1","player?","\"adSlots\"","/^\\W+$/","Node.prototype.appendChild","fetch","Request","JSON.parse","entries.[-].command.reelWatchEndpoint.adClientParams.isAd","/get_watch?","require.0.3.0.__bbox.require.[].3.1.__bbox.result.data.viewer.sideFeedUnit.nodes.[].new_adverts.nodes.[-].sponsored_data","data.viewer.sideFeedUnit.nodes.[].new_adverts.nodes.[-].sponsored_data","/graphql","..sideFeed.nodes.*[?.__typename==\"AdsSideFeedUnit\"]","Env.nxghljssj","false","require.0.3.0.__bbox.require.[].3.1.__bbox.result.data.serpResponse.results.edges.[-].rendering_strategy.view_model.story.sponsored_data.ad_id","..__bbox.result.data.node[?@.*.__typename==\"SponsoredData\"]",".data[?@.category==\"SPONSORED\"].node","..node[?.*.__typename==\"SponsoredData\"]",".data.viewer.news_feed.edges.*[?@.category==\"SPONSORED\"].node","console.clear","undefined","globalThis","break;case","WebAssembly","atob","pubadxtag","json:{\"divIds\":[]}","Document.prototype.querySelector","\"/^\\[data-l/\"","Document.prototype.querySelectorAll","\"/^[#.][A-Z][-A-Z_a-z]+$/\"","\"/^div\\[/\"","Document.prototype.getElementsByTagName","\"i\"","\"/^\\[data-[_a-z]{5,7}\\]$/\"","Array.from","\"/NodeList/\"","prevent","inlineScript","\"/^\\[d[a-z]t[a-z]?-[0-9a-z]{2,4}\\]$/\"","\"/^\\[[a-z]{2,3}-/\"","\"/^\\[data-[a-z]+src\\]$/\"","\"/^\\[[a-z]{5}-/\"","\"/^\\[[a-ce-z][a-z]+-/\"","\"/^\\[d[b-z][a-z]*-/\"","\"/[\\S\\s]*\\[[^d][\\S\\s]+\\][\\S\\s]*/\"","HTMLElement.prototype.querySelectorAll","\"/.*\\[[^imns].+\\].*/\"","Element.prototype.hasAttribute","\"/[\\S\\s]+/\"","Document.prototype.evaluate","\"/.*/\"","Document.prototype.createTreeWalker","aclib","/stackDepth:3\\s+get injectedScript.+inlineScript/","setTimeout","/stackDepth:3.+inlineScript:\\d{4}:1/","Date","MessageChannel","/stackDepth:2.+inlineScript/","/\\.(gif|jpe?g|png|webp)/","Element.prototype.textContent","requestAnimationFrame","Document.prototype.createElement","\"span\"","abort","/apply in.+[0-9A-Za-z]{8,10} inlineScript/","\"p\"","Element.prototype.getElementsByTagName","\"div\"","performance.now","/\\s[0-9A-Za-z]{8,10} inlineScript:1/","Array.prototype.push","/^([\\S\\s]{2500,4000}|[\\S\\s]{4500,5000})$/","Array.prototype.join","/^[\\S\\s]{2000,6000}$/","DOMTokenList.prototype.remove","/^[\\S\\s]{3000,4000}$/","/vast.php?","/click\\.com|preroll|native_render\\.js|acscdn/","length:10001","]();}","500","162.252.214.4","true","c.adsco.re","adsco.re:2087","/^ [-\\d]/","Math.random","parseInt(localStorage['\\x","adBlockDetected","Math","localStorage['\\x","-load.com/script/","length:101",")](this,...","3000-6000","(new Error(","/fd/ls/lsp.aspx",".offsetHeight>0","/^https:\\/\\/pagead2\\.googlesyndication\\.com\\/pagead\\/js\\/adsbygoogle\\.js\\?client=ca-pub-3497863494706299$/","data-instype","ins.adsbygoogle:has(> div#aswift_0_host)","stay","url:https://googleads.g.doubleclick.net/pagead/ads?client=ca-pub-3497863494706299 method:HEAD mode:no-cors","throttle","121","String.prototype.indexOf","0","json:\"/\"","condition","/premium","HTMLIFrameElement.prototype.remove","iframe[src^=\"https://googleads.g.doubleclick.net/pagead/ads?client=ca-pub-3497863494706299\"]","adblock","4000-","++","g.doubleclick.net","length:100000","String.prototype.includes","/Copyright|doubleclick$/","favicon","length:252","Headers.prototype.get","/.+/","image/png.","/^text\\/plain;charset=UTF-8$/","json:\"content-type\"","cache-control","Headers.prototype.has","summerday","length:10","{\"type\":\"cors\"}","/offsetHeight|loaded/","HTMLScriptElement.prototype.onerror","pagead2.googlesyndication.com/pagead/js/adsbygoogle.js method:HEAD","emptyStr","Node.prototype.contains","{\"className\":\"adsbygoogle\"}","load","showFallbackModal","Object.prototype.adsStrategy","json:{\"tag\":\"\",\"phase\":0,\"permaProvider\":0,\"tempoProvider\":0,\"buckets\":[],\"comment\":\"no-user\",\"rotationPaused\":true}","as","function","Keen","stream.insertion","/video/auth/media","akamaiDisableServerIpLookup","noopFunc","MONETIZER101.init","/outboundLink/","v.fwmrm.net/ad/g/","war:noop-vmap1.xml","DD_RUM.addAction","nads.createAd","trueFunc","t++","dvtag.getTargeting","ga","class|style","div[id^=\"los40_gpt\"]","huecosPBS.nstdX","null","config.globalInteractions.[].bsData","googlesyndication","DTM.trackAsyncPV","_satellite","{}","_satellite.getVisitorId","mobileanalytics","newPageViewSpeedtest","pubg.unload","generateGalleryAd","mediator","Object.prototype.subscribe","gbTracker","gbTracker.sendAutoSearchEvent","Object.prototype.vjsPlayer.ads","marmalade","setInterval","url:ipapi.co","doubleclick","isPeriodic","*","data-woman-ex","a[href][data-woman-ex]","data-trm-action|data-trm-category|data-trm-label",".trm_event","KeenTracking","network_user_id","cloudflare.com/cdn-cgi/trace","History","/(^(?!.*(Function|HTMLDocument).*))/","api","google.ima.OmidVerificationVendor","Object.prototype.omidAccessModeRules","googletag.cmd","skipAdSeconds","0.02","/recommendations.","_aps","/api/analytics","Object.prototype.setDisableFlashAds","DD_RUM.addTiming","chameleonVideo.adDisabledRequested","AdmostClient","analytics","native code","15000","(null)","5000","datalayer","[]","Object.prototype.isInitialLoadDisabled","lr-ingest.io","listingGoogleEETracking","dcsMultiTrack","urlStrArray","pa","Object.prototype.setConfigurations","/gtm.js","JadIds","Object.prototype.bk_addPageCtx","Object.prototype.bk_doJSTag","passFingerPrint","optimizely","optimizely.initialized","google_optimize","google_optimize.get","_gsq","_gsq.push","_gsDevice","iom","iom.c","_conv_q","_conv_q.push","google.ima.settings.setDisableFlashAds","pa.privacy","populateClientData4RBA","YT.ImaManager","UOLPD","UOLPD.dataLayer","__configuredDFPTags","URL_VAST_YOUTUBE","Adman","dplus","dplus.track","_satellite.track","/EzoIvent|TDELAY/","google.ima.dai","/froloa.js","adv","gfkS2sExtension","gfkS2sExtension.HTML5VODExtension","click","/event_callback=function\\(\\){window\\.location=t\\.getAttribute\\(\"href\"\\)/","AnalyticsEventTrackingJS","AnalyticsEventTrackingJS.addToBasket","AnalyticsEventTrackingJS.trackErrorMessage","initializeslideshow","b()","3000","ads","fathom","fathom.trackGoal","Origami","Origami.fastclick","document.querySelector","{\"value\": \".ad-placement-interstitial\"}",".easyAdsBox","jad","hasAdblocker","Sentry","Sentry.init","TRC","TRC._taboolaClone","fp","fp.t","fp.s","initializeNewRelic","turnerAnalyticsObj","turnerAnalyticsObj.setVideoObject4AnalyticsProperty","turnerAnalyticsObj.getVideoObject4AnalyticsProperty","optimizelyDatafile","optimizelyDatafile.featureFlags","fingerprint","fingerprint.getCookie","gform.utils","gform.utils.trigger","get_fingerprint","moatPrebidApi","moatPrebidApi.getMoatTargetingForPage","readyPromise","cpd_configdata","cpd_configdata.url","yieldlove_cmd","yieldlove_cmd.push","dataLayer.push","1.1.1.1/cdn-cgi/trace","_etmc","_etmc.push","freshpaint","freshpaint.track","ShowRewards","stLight","stLight.options","DD_RUM.addError","sensorsDataAnalytic201505","sensorsDataAnalytic201505.init","sensorsDataAnalytic201505.quick","sensorsDataAnalytic201505.track","s","s.tl","taboola timeout","clearInterval(run)","smartech","/TDELAY|EzoIvent/","sensors","sensors.init","/piwik-","2200","2300","sensors.track","googleFC","adn","adn.clearDivs","_vwo_code","live.streamtheworld.com/partnerIds","gtag","_taboola","_taboola.push","clicky","clicky.goal","WURFL","_sp_.config.events.onSPPMObjectReady","gtm","gtm.trackEvent","mParticle.Identity.getCurrentUser","_omapp.scripts.geolocation","{\"value\": {\"status\":\"loaded\",\"object\":null,\"data\":{\"country\":{\"shortName\":\"\",\"longName\":\"\"},\"administrative_area_level_1\":{\"shortName\":\"\",\"longName\":\"\"},\"administrative_area_level_2\":{\"shortName\":\"\",\"longName\":\"\"},\"locality\":{\"shortName\":\"\",\"longName\":\"\"},\"original\":{\"ip\":\"\",\"ip_decimal\":null,\"country\":\"\",\"country_eu\":false,\"country_iso\":\"\",\"city\":\"\",\"latitude\":null,\"longitude\":null,\"user_agent\":{\"product\":\"\",\"version\":\"\",\"comment\":\"\",\"raw_value\":\"\"},\"zip_code\":\"\",\"time_zone\":\"\"}},\"error\":\"\"}}","JSGlobals.prebidEnabled","i||(e(),i=!0)","2500","elasticApm","elasticApm.init","ga.sendGaEvent","adConfig","ads.viralize.tv","adobe","MT","MT.track","ClickOmniPartner","adex","adex.getAdexUser","Adkit","Object.prototype.shouldExpectGoogleCMP","apntag.refresh","pa.sendEvent","Munchkin","Munchkin.init","Event","ttd_dom_ready","ramp","appInfo.snowplow.trackSelfDescribingEvent","_vwo_code.init","adobePageView","adobeSearchBox","elements",".dropdown-menu a[href]","dapTracker","dapTracker.track","newrelic","newrelic.setCustomAttribute","adobeDataLayer","adobeDataLayer.push","Object.prototype._adsDisabled","Object.defineProperty","1","json:\"_adsEnabled\"","_adsDisabled","utag","utag.link","_satellite.kpCustomEvent","Object.prototype.disablecommercials","Object.prototype._autoPlayOnlyWithPrerollAd","Sentry.addBreadcrumb","sensorsDataAnalytic201505.register","freestar.newAdSlots","ytInitialPlayerResponse.playerAds","ytInitialPlayerResponse.adPlacements","ytInitialPlayerResponse.adSlots","playerResponse.adPlacements","playerResponse.adPlacements playerResponse.playerAds playerResponse.adSlots adPlacements playerAds adSlots important","reelWatchSequenceResponse.entries.[-].command.reelWatchEndpoint.adClientParams.isAd entries.[-].command.reelWatchEndpoint.adClientParams.isAd","url:/reel_watch_sequence?","Object","fireEvent","enabled","force_disabled","hard_block","header_menu_abvs","10000","adsbygoogle","nsShowMaxCount","toiads","objVc.interstitial_web","adb","navigator.userAgent","require.0.3.0.__bbox.require.[].3.1.__bbox.result.data.serpResponse.results.edges.[-].relay_rendering_strategy.view_model.story.sponsored_data.ad_id","/\\{\"node\":\\{\"role\":\"SEARCH_ADS\"[^\\n]+?cursor\":[^}]+\\}/g","/api/graphql","/\\{\"node\":\\{\"__typename\":\"MarketplaceFeedAdStory\"[^\\n]+?\"cursor\":(?:null|\"\\{[^\\n]+?\\}\"|[^\\n]+?MarketplaceSearchFeedStoriesEdge\")\\}/g","/\\{\"node\":\\{\"__typename\":\"VideoHomeFeedUnitSectionComponent\"[^\\n]+?\"sponsored_data\":\\{\"ad_id\"[^\\n]+?\"cursor\":null\\}/","require.0.3.0.__bbox.require.[].3.1.__bbox.result.data.node","require.0.3.0.__bbox.require.[].3.1.__bbox.result.data.node.story.sponsored_data.ad_id","require.0.3.0.__bbox.require.[].3.1.__bbox.result.data.marketplace_search.feed_units.edges.[-].node.story.sponsored_data.ad_id","require.0.3.0.__bbox.require.[].3.1.__bbox.result.data.viewer.marketplace_feed_stories.edges.[-].node.story.sponsored_data.ad_id","data.viewer.instream_video_ads data.scrubber",".data.viewer.marketplace_feed_stories.edges.*[?@.node.__typename==\"MarketplaceFeedAdStory\"]","__eiPb","detector","_ml_ads_ns","jQuery","cookie","showAds","adBlockerDetected","show","SmartAdServerASMI","repl:/\"adBlockWallEnabled\":true/\"adBlockWallEnabled\":false/","adBlockWallEnabled","_sp_._networkListenerData","SZAdBlockDetection","_sp_.config","AntiAd.check","open","/^/","showNotice","_sp_","$","_sp_.mms.startMsg","retrievalService","admrlWpJsonP","yafaIt","LieDetector","ClickHandler","IsAdblockRequest","InfMediafireMobileFunc","1000","newcontent","ExoLoader.serve","Fingerprint2","request=adb","AdController","popupBlocked","/\\}\\s*\\(.*?\\b(self|this|window)\\b.*?\\)/","_0x","stop","onload","ga.length","btoa","adcashMacros","grecaptcha.ready","BACK","jwplayer.utils.Timer","adblock_added","admc","exoNoExternalUI38djdkjDDJsio96","String.prototype.charCodeAt","ai_","window.open","SBMGlobal.run.pcCallback","SBMGlobal.run.gramCallback","(!o)","(!i)","decodeURIComponent","shift","/0x|google|ecoded|==/","Object.prototype.hideAds","Object.prototype._getSalesHouseConfigurations","player-feedback","samInitDetection","decodeURI","Date.prototype.toUTCString","Adcash","lobster","openLity","ad_abblock_ad","String.fromCharCode","PopAds","AdBlocker","Adblock","addEventListener","displayMessage","runAdblock","document.createElement","TestAdBlock","ExoLoader","loadTool","cticodes","imgadbpops","document.getElementById","document.write","redirect","4000","sadbl","adblockcheck","doSecondPop","arrvast","onclick","RunAds","/^(?:click|mousedown)$/","bypassEventsInProxies","jQuery.adblock","test-block","adi","ads_block","blockAdBlock","blurred","exoOpts","doOpen","prPuShown","flashvars.adv_pre_src","showPopunder","IS_ADBLOCK","page_params.holiday_promo","__NA","ads_priv","ab_detected","adsEnabled","document.dispatchEvent","t4PP","href|target","a[href=\"https://imgprime.com/view.php\"][target=\"_blank\"]","complete","String.prototype.charAt","sc_adv_out","pbjs.libLoaded","mz","ad_blocker","AaDetector","_abb","puShown","/doOpen|popundr/","pURL","readyState","serve","stop()","Math.floor","AdBlockDetectorWorkaround","apstagLOADED","jQuery.hello","/Adb|moneyDetect/","isShowingAd","VikiPlayer.prototype.pingAbFactor","player.options.disableAds","__htapop","exopop","/^(?:load|click)$/","popMagic","script","atOptions","XMLHttpRequest","flashvars.adv_pre_vast","flashvars.adv_pre_vast_alt","x_width","getexoloader","disableDeveloper","oms.ads_detect","Blocco","2000","_site_ads_ns","hasAdBlock","pop","ltvModal","luxuretv.config","popns","pushiserve","creativeLoaded-","exoframe","/^load[A-Za-z]{12,}/","rollexzone","ALoader","Object.prototype.AdOverlay","tkn_popunder","detect","dlw","40000","ctt()","can_run_ads","test","adsBlockerDetector","NREUM","pop3","__ads","ready","popzone","FlixPop.isPopGloballyEnabled","falseFunc","/exo","ads.pop_url","checkAdblockUser","checkPub","6000","tabUnder","check_adblock","l.parentNode.insertBefore(s","_blank","ExoLoader.addZone","encodeURIComponent","isAdBlockActive","raConf","__ADX_URL_U","tabunder","RegExp","POSTBACK_PIXEL","mousedown","preventDefault","'0x","Aloader","advobj","replace","popTimes","addElementToBody","phantomPopunders","$.magnificPopup.open","adsenseadBlock","stagedPopUnder","seconds","clearInterval","CustomEvent","exoJsPop101","popjs.init","-0x","closeMyAd","smrtSP","adblockSuspected","nextFunction","250","xRds","cRAds","myTimer","1500","advertising","countdown","tiPopAction","rmVideoPlay","r3H4","disasterpingu","document.querySelectorAll","AdservingModule","backRedirect","adv_pre_duration","adv_post_duration","/^(click|mousedown|mousemove|touchstart|touchend|touchmove)/","system.popunder","ab1","ab2","hidekeep","pp12","__Y","App.views.adsView.adblock","document.createEvent","ShowAdbblock","style","clientHeight","flashvars.adv_pause_html","/^(?:click|mousedown|mousemove|touchstart|touchend|touchmove)$/","BOOTLOADER_LOADED","PerformanceLongTaskTiming","proxyLocation","Int32Array","$.fx.off","popMagic.init","/DOMContentLoaded|load/","y.readyState","document.getElementsByTagName","smrtSB","href","#opfk","byepopup","awm","location","adBlockEnabled","getCookie","history.go","dataPopUnder","/error|canplay/","(t)","EPeventFire","additional_src","300","____POP","openx","is_noadblock","window.location","()","hblocked","AdBlockUtil","css_class.show","/adbl/i","CANG","DOMContentLoaded","adlinkfly","updato-overlay","innerText","/amazon-adsystem|example\\.com/","document.cookie","|","attr","scriptSrc","SmartWallSDK","segs_pop","alert","8000","cxStartDetectionProcess","Abd_Detector","counter","paywallWrapper","isAdBlocked","/enthusiastgaming|googleoptimize|googletagmanager/","css_class","ez","path","*.adserverDomain","10","$getWin","/doubleclick|googlesyndication/","__NEXT_DATA__.props.clientConfigSettings.videoAds","blockAds","_ctrl_vt.blocked.ad_script","registerSlideshowAd","50","debugger","mm","shortener","require","/^(?!.*(einthusan\\.io|yahoo|rtnotif|ajax|quantcast|bugsnag))/","caca","getUrlParameter","trigger","Ok","given","getScriptFromCss","method:HEAD","safelink.adblock","goafricaSplashScreenAd","try","/adnxs.com|onetag-sys.com|teads.tv|google-analytics.com|rubiconproject.com|casalemedia.com/","openPopunder","0x","xhr.prototype.realSend","initializeCourier","userAgent","_0xbeb9","1800","popAdsClickCount","redirectPage","adblocker","ad_","azar","Pop","_wm","flashvars.adv_pre_url","flashvars.protect_block","flashvars.video_click_url","popunderSetup","https","popunder","preventExit","hilltop","jsPopunder","vglnk","aadblock","S9tt","popUpUrl","Notification","srcdoc","iframe","readCookieDelit","trafficjunky","checked","input#chkIsAdd","adSSetup","adblockerModal","750","adBlock","spoof","html","capapubli","Aloader.serve","mouseup","sp_ad","app_vars.force_disable_adblock","adsHeight","onmousemove","button","yuidea-","adsBlocked","_sp_.msg.displayMessage","pop_under","location.href","_0x32d5","url","blur","CaptchmeState.adb","glxopen","adverts-top-container","disable","200","/googlesyndication|outbrain/","CekAab","timeLeft","testadblock","document.addEventListener","google_ad_client","UhasAB","adbackDebug","googletag","performance","rbm_block_active","adNotificationDetected","SubmitDownload1","show()","user=null","getIfc","!bergblock","overlayBtn","adBlockRunning","htaUrl","_pop","n.trigger","CnnXt.Event.fire","_ti_update_user","&nbsp","document.body.appendChild","BetterJsPop","/.?/","setExoCookie","adblockDetected","frg","abDetected","target","I833","urls","urls.0","Object.assign","KeepOpeningPops","bindall","ad_block","time","KillAdBlock","read_cookie","ReviveBannerInterstitial","eval","GNCA_Ad_Support","checkAdBlocker","midRoll","adBlocked","Date.now","AdBlock","iframeTestTimeMS","runInIframe","deployads","='\\x","Debugger","stackDepth:3","warning","100","_checkBait","[href*=\"ccbill\"]","close_screen","onerror","dismissAdBlock","VMG.Components.Adblock","adblock_popup","FuckAdBlock","isAdEnabled","promo","_0x311a","mockingbird","adblockDetector","crakPopInParams","console.log","hasPoped","Math.round","h1mm.w3","banner","google_jobrunner","blocker_div","onscroll","keep-ads","#rbm_block_active","checkAdblock","checkAds","#DontBloxMyAdZ","#pageWrapper","adpbtest","initDetection","check","isBlanketFound","showModal","myaabpfun","sec","adFilled","//","NativeAd","gadb","damoh.ani-stream.com","showPopup","mouseout","clientWidth","adrecover","checkadBlock","gandalfads","Tool","clientSide.adbDetect","HTMLAnchorElement.prototype.click","anchor.href","cmnnrunads","downloadJSAtOnload","run","ReactAds","phtData","adBlocker","StileApp.somecontrols.adBlockDetected","killAdBlock","innerHTML","google_tag_data","readyplayer","noAdBlock","autoRecov","adblockblock","popit","popstate","noPop","Ha","rid","[onclick^=\"window.open\"]","tick","spot","adsOk","adBlockChecker","_$","12345","flashvars.popunder_url","urlForPopup","isal","/innerHTML|AdBlock/","checkStopBlock","overlay","popad","!za.gl","document.hidden","adblockEnabled","ppu","adspot_top","is_adblocked","/offsetHeight|google|Global/","an_message","Adblocker","pogo.intermission.staticAdIntermissionPeriod","localStorage","timeoutChecker","t","my_pop","nombre_dominio",".height","!?safelink_redirect=","document.documentElement","break;case $.","time.html","block_detected","/^(?:mousedown|mouseup)$/","ckaduMobilePop","tieneAdblock","popundr","obj","ujsmediatags method:HEAD","adsAreBlocked","spr","document.oncontextmenu","document.onmousedown","document.onkeydown","compupaste","redirectURL","bait","!atomtt","TID","!/download\\/|link/","Math.pow","adsanity_ad_block_vars","pace","ai_adb","openInNewTab",".append","!!{});","runAdBlocker","setOCookie","document.getElementsByClassName","td_ad_background_click_link","initBCPopunder","flashvars.logo_url","flashvars.logo_text","nlf.custom.userCapabilities","displayCookieWallBanner","adblockinfo","JSON","pum-open","svonm","#clickfakeplayer","/\\/VisitorAPI\\.js|\\/AppMeasurement\\.js/","popjs","/adblock/i","count","LoadThisScript","showPremLite","closeBlockerModal","detector_launch","5","keydown","Popunder","ag_adBlockerDetected","document.head.appendChild","bait.css","Date.prototype.toGMTString","initPu","jsUnda","ABD","adBlockDetector.isEnabled","adtoniq","__esModule","break","myFunction_ads","areAdsDisplayed","gkAdsWerbung","pop_target","onLoadEvent","is_banner","$easyadvtblock","mfbDetect","!/^https:\\/\\/sendvid\\.com\\/[0-9a-z]+$/","Pub2a","length:2001","block","console","send","ab_cl","V4ss","popunders","visibility","show_dfp_preroll","show_youtube_preroll","brave_load_popup","pageParams.dispAds","PrivateMode","scroll","document.bridCanRunAds","doads","pu","advads_passive_ads","tmohentai","pmc_admanager.show_interrupt_ads","ai_adb_overlay","AlobaidiDetectAdBlock","showMsgAb","Advertisement","type","input[value^=\"http\"]","wutimeBotPattern","adsbytrafficjunkycontext","abp1","$REACTBASE_STATE.serverModules.push","popup_ads","ipod","pr_okvalida","scriptwz_url","enlace","Popup","$.ajax","appendChild","Exoloader","offsetWidth","zomap.de","/$|adBlock/","adblockerpopup","adblockCheck","checkVPN","cancelAdBlocker","Promise","setNptTechAdblockerCookie","for-variations","!api?call=","cnbc.canShowAds","ExoSupport","/^(?:click|mousedown|mouseup)$/","di()","getElementById","loadRunative","value.media.ad_breaks","onAdVideoStart","zonefile","pwparams","fuckAdBlock","firefaucet","mark","stop-scrolling","detectAdBlock","Adv","blockUI","adsafeprotected","'\\'","oncontextmenu","Base64","disableItToContinue","google","parcelRequire","mdpDeBlocker","flashvars.adv_start_html","mobilePop","/_0x|debug/","my_inter_listen","EviPopunder","adver","tcpusher","preadvercb","document.readyState","prerollMain","popping","adsrefresh","/ai_adb|_0x/","canRunAds","mdp_deblocker","bi()","#divDownload","modal","dclm_ajax_var.disclaimer_redirect_url","$ADP","load_pop_power","MG2Loader","/SplashScreen|BannerAd/","Connext","break;","checkTarget","i--","Time_Start","blocker","adUnits","afs_ads","b2a","data.[].vast_url","deleted","MutationObserver","ezstandalone.enabled","damoh","foundation.adPlayer.bitmovin","homad-global-configs","weltConfig.switches.videoAdBlockBlocker","XMLHttpRequest.prototype.open","svonm.com","/\"enabled\":\\s*true/","\"enabled\":false","adReinsertion","window.__gv_org_tfa","Object.prototype.adReinsertion","getHomadConfig","timeupdate","testhide","getComputedStyle","blocked","doOnce","popi","googlefc","angular","detected","{r()","450","ab","go_popup","Debug","offsetHeight","length","noBlocker","/youboranqs01|spotx|springserve/","js-btn-skip","r()","adblockActivated","penci_adlbock","Number.isNaN","fabActive","gWkbAdVert","noblock","wgAffiliateEnabled","!gdrivedownload","document.onclick","daCheckManager","prompt","data-popunder-url","saveLastEvent","friendlyduck",".post.movies","purple_box","detectAdblock","adblockDetect","adsLoadable","allclick_Public","a#clickfakeplayer",".fake_player > [href][target]",".link","'\\x","initAdserver","splashpage.init","window[_0x","checkSiteNormalLoad","/blob|injectedScript/","ASSetCookieAds","___tp","STREAM_CONFIGS",".clickbutton","Detected","XF","hide","mdp",".test","backgroundBanner","interstitial","letShowAds","antiblock","ulp_noadb",".show","url:!luscious.net","Object.prototype.adblock_detected","afterOpen","AffiliateAdBlock",".appendChild","adsbygoogle.loaded","ads_unblocked","xxSetting.adBlockerDetection","ppload","RegAdBlocking","a.adm","checkABlockP","Drupal.behaviors.adBlockerPopup","ADBLOCK","fake_ad","samOverlay","!refine?search","native","koddostu_com_adblock_yok","player.ads.cuePoints","adthrive","!t.me","bADBlock","better_ads_adblock","tie","Adv_ab","ignore_adblock","$.prototype.offset","ea.add","ad_pods.0.ads.0.segments.0.media ad_pods.1.ads.1.segments.1.media ad_pods.2.ads.2.segments.2.media ad_pods.3.ads.3.segments.3.media ad_pods.4.ads.4.segments.4.media ad_pods.5.ads.5.segments.5.media ad_pods.6.ads.6.segments.6.media ad_pods.7.ads.7.segments.7.media ad_pods.8.ads.8.segments.8.media","mouseleave","NativeDisplayAdID","contador","Light.Popup.create","t()","zendplace","mouseover","event.triggered","_cpp","sgpbCanRunAds","pareAdblock","ppcnt","data-ppcnt_ads","main[onclick]","Blocker","AdBDetected","navigator.brave","document.activeElement","{ \"value\": {\"tagName\": \"IFRAME\" }}","runAt","2","clickCount","body","hasFocus","{\"value\": \"Mozilla/5.0 (iPhone14,3; U; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/602.1.50 (KHTML, like Gecko) Version/10.0 Mobile/19A346 Safari/602.1\"}","timeSec","getlink","/wpsafe|wait/","timer","/getElementById|gotoo/","/visibilitychange|blur/","stopCountdown","ppuQnty","web_share_ads_adsterra_config wap_short_link_middle_page_ad wap_short_link_middle_page_show_time data.ads_cpm_info","value","Object.prototype.isAllAdClose","DOMNodeRemoved","data.meta.require_addon data.meta.require_captcha data.meta.require_notifications data.meta.require_og_ads data.meta.require_video data.meta.require_web data.meta.require_related_topics data.meta.require_custom_ad_step data.meta.og_ads_offers data.meta.addon_url data.displayAds data.linkCustomAdOffers","data.getDetailPageContent.linkCustomAdOffers.[-].title","data.getTaboolaAds.*","/chp_?ad/","/adblock|isRequestPresent/","bmcdn6","window.onload","devtools","documentElement.innerHTML","{\"type\": \"opaque\"}","document.hasFocus","/adoto|\\/ads\\/js/","htmls","?key=","isRequestPresent","xmlhttp","data-ppcnt_ads|onclick","#main","#main[onclick*=\"mainClick\"]",".btn-success.get-link","fouty","disabled",".btn-primary","focusOut","googletagmanager","shortcut","suaads","/\\$\\('|ai-close/","app_vars.please_disable_adblock","bypass",".MyAd > a[target=\"_blank\"]","antiAdBlockerHandler","onScriptError","php","AdbModel","protection","div_form","private","navigator.webkitTemporaryStorage.queryUsageAndQuota","contextmenu","visibilitychange","remainingSeconds","0.1","Math.random() <= 0.15","checkBrowser","bypass_url","1600","class","#rtg-snp21","adsby","showadas","submit","validateForm","throwFunc","/pagead2\\.googlesyndication\\.com|inklinkor\\.com/","EventTarget.prototype.addEventListener","delete window","/countdown--|getElementById/","SMart1","/outbrain\\.com|adligature\\.com|quantserve\\.com|srvtrck\\.com|googlesyndication/","{\"type\": \"cors\"}","doTest","checkAdsBlocked",".btn","!/(flashbang\\.sh|dl\\.buzzheavier\\.com)/","!dl.buzzheavier.com","window.adLink","!buzzheavier.com","1e3*","/veepteero|tag\\.min\\.js/","aSl.gcd","/\\/4.+ _0/","chp_ad","document.documentElement.lang.toLowerCase","[onclick^=\"pop\"]","Light.Popup","window.addEventListener","json:\"load\"","maxclick","#get-link-button","Swal.fire","surfe.pro","czilladx","adsbygoogle.js","!devuploads.com","war:googlesyndication_adsbygoogle.js","localStorage._d","google_srt","json:0.61234","vizier","checkAdBlock","shouldOpenPopUp","displayAdBlockerMessage","pastepc","detectedAdblock","pagead2.googlesyndication.com/pagead/js/adsbygoogle.js","googletagservices","#myadbox","display","visible","isTabActive","a[target=\"_blank\"]","[href*=\"survey\"]","adForm","/adsbygoogle|googletagservices/","clicked","notifyExec","fairAdblock","data.value data.redirectUrl data.bannerUrl","/admin/settings","!gcloud","seconds--","yes","hiddenCount","isAdblockActive","pub.clickadu","bing.com","a","clicksCount","\"/chp_?ad/\"","script[data-domain=","push",".call(null)","ov.advertising.tisoomi.loadScript","abp","userHasAdblocker","embedAddefend","/injectedScript.*inlineScript/","/(?=.*onerror)(?=^(?!.*(https)))/","/injectedScript|blob/","hommy.mutation.mutation","hommy","hommy.waitUntil","ACtMan","video.channel","/(www\\.[a-z]{8,16}\\.com|cloudfront\\.net)\\/.+\\.(css|js)$/","/popundersPerIP[\\s\\S]*?Date[\\s\\S]*?getElementsByTagName[\\s\\S]*?insertBefore/","/www|cloudfront/","shouldShow","matchMedia","target.appendChild(s","l.appendChild(s)","/^data:/","\"script\"","litespeed/js","myEl","ExoDetector","!embedy","Pub2","/loadMomoVip|loadExo|includeSpecial/","loadNeverBlock","flashvars.mlogo","adver.abFucker.serve","displayCache","vpPrerollVideo","SpecialUp","zfgloaded","parseInt","/btoa|break/","/\\st\\.[a-zA-Z]*\\s/","navigator","/(?=^(?!.*(https)))/","key in document","zfgformats","zfgstorage","zfgloadedpopup","/\\st\\.[a-zA-Z]*\\sinlineScript/","zfgcodeloaded","outbrain","/inlineScript|stackDepth:1/","wpadmngr.com","adserverDomain",".js?_=","FingerprintJS","/https|stackDepth:3/","HTMLAllCollection","shown_at","!/d/","PlayerConfig.config.CustomAdSetting","affiliate","_createCatchAllDiv","/click|mouse/","document","PlayerConfig.trusted","PlayerConfig.config.AffiliateAdViewLevel","3","univresalP","puTSstrpcht","!/prcf.fiyar|themes|pixsense|.jpg/","hold_click","focus","js_func_decode_base_64","decodeURIComponent(atob","/(?=^(?!.*(https|injectedScript)))/","jQuery.popunder","AdDetect","ai_front","abDetectorPro","/googlesyndication|doubleclick/","src=atob","\"/[0-9a-f]+-modal/\"","/\\/[0-9a-f]+\\.js\\?ver=/","tie.ad_blocker_detector","admiral","__cmpGdprAppliesGlobally","..admiralScriptCode",".props[?.id==\"admiral-bootstrap\"].dangerouslySetInnerHTML","decodeURI(decodeURI","dc.adfree","error","gnt.x.uam","interactive","g$.hp","json:{\"gnt-d-adm\":true,\"gnt-d-bt\":true}","gnt.u.z","__INITIAL_DATA__.siteData.admiralScript",".cmd.unshift","..props[?.id==\"admiral-initializer\"].children","..props.children.*[?.key==\"admiral-script\"]","..props.config.ad.enabled=false","/ad\\.doubleclick\\.net|static\\.dable\\.io/","error-report.com","loader.min.js","content-loader.com","()=>","HTMLScriptElement.prototype.setAttribute","/error-report|new Promise/","ads.adthrive.com","objAd.loadAdShield","window.myAd.runAd","RT-1562-AdShield-script-on-Huffpost","{\"value\": \"(function(){let link=document.createElement('link');link.rel='stylesheet';link.href='//image.ygosu.com/style/main.css';document.head.appendChild(link)})()\"}","error-report","{\"value\": \"(function(){let link=document.createElement('link');link.rel='stylesheet';link.href='https://loawa.com/assets/css/loawa.min.css';document.head.appendChild(link)})()\"}","/07c225f3\\.online|content-loader\\.com|css-load\\.com|html-load\\.com/","html-load.com","repl:/\"$//","disableAdShield","json:\"freestar-bootstrap\"","/^[A-Z][a-z]+_$/","\"data-sdk\"","abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789+/=","AHE.is_member","USER.features.ad_shield","AppBootstrapData.config.adshieldAdblockRecovery","AppState.reduxState.features.adshieldAdblockRecovery","..adshieldAdblockRecovery=false","/fetchappbootstrapdata","__NEXT_DATA__.runtimeConfig.enableShieldScript","HT.features.ad_shield.enabled","HTMLScriptElement.prototype.onload","String.prototype.match","__adblocker","__INITIAL_STATE__.config.theme.ads.isAdBlockerEnabled","generalTimeLeft","__INITIAL_STATE__.gameLists.gamesNoPrerollIds.indexOf","DoodPop","__aaZoneid","#over","document.ontouchend","Array.prototype.shift","/^.+$/s","HTMLElement.prototype.click","premium","'1'","playID","openNewTab","download-wrapper","MDCore.adblock","Please wait","pop_init","adsbyjuicy","length:40000-60000","prerolls midrolls postrolls comm_ad house_ad pause_ad block_ad end_ad exit_ad pin_ad content_pool vertical_ad elements","/detail","adClosedTimestamp","data.item.[-].business_info.ad_desc","/feed/rcmd","killads","NMAFMediaPlayerController.vastManager.vastShown","reklama-flash-body","fakeAd","adUrl",".azurewebsites.net","assets.preroll assets.prerollDebug","/stream-link","/doubleclick|ad-delivery|googlesyndication/","__NEXT_DATA__.runtimeConfig._qub_sdk.qubConfig.video.adBlockerDetectorEnabled","data.[].relationships.advert data.[].relationships.vast","offers","tampilkanUrl",".layers.*[?.metadata.name==\"POI_Ads\"]","/PCWeb_Real.json","/gaid=","war:noop-vast2.xml","consent","arePiratesOnBoard","__INIT_CONFIG__.randvar","instanceof Event","prebidConfig.steering.disableVideoAutoBid","await _0x","json:\"Blog1\"","ad-top","adblock.js","adbl",".getComputedStyle","STORAGE2","app_advert","googletag._loaded_","closeBanner","NoTenia","vast popup adblock","breaks interstitials info","interstitials","xpath(//*[name()=\"Period\"][.//*[name()=\"BaseURL\" and contains(text(),\".mp.lura.live/prod/\")]] | //*[name()=\"MPD\"]/@mediaPresentationDuration)",".mpd","ads.policy.skipMode","/play","ad_slots","plugins.dfp","lura.live/prod/","/prog.m3u8","!embedtv.best",".offsetHeight","!asyaanimeleri.",".*[?.linkurl^=\"http\"]","initPop","app._data.ads","message","adsense","reklamlar","json:[{\"sure\":\"0\"}]","/api/video","Object.prototype.showInterstitialAd","skipAdblockCheck","/srvtrck|adligature|quantserve|outbrain/","createAgeModal","Object[_0x","adsPlayer","this","json:\"mozilla/5.0 (windows nt 10.0; win64; x64) applewebkit/537.36 (khtml, like gecko) chrome/145.0.0.0 safari/537.36\"","mozilla/5.0","popup=","()}",".art-control-fullscreen","pubAdsService","offsetLeft","config.pauseInspect","appContext.adManager.context.current.adFriendly","HTMLIFrameElement",".style","dsanity_ad_block_vars","show_download_links","downloadbtn","height","blockAdBlock._options.baitClass","/AdBlock/i","charAt","fadeIn","checkAD","latest!==","detectAdBlocker","#downloadvideo",".ready","/'shift'|break;/","document.blocked_var","____ads_js_blocked","wIsAdBlocked","WebSite.plsDisableAdBlock","css","videootv","ads_blocked","samDetected","Drupal.behaviors.agBlockAdBlock","NoAdBlock","mMCheckAgainBlock","countClicks","settings.adBlockerDetection","eabdModal","ab_root.show","gaData","wrapfabtest","fuckAdBlock._options.baitClass","$ado","/ado/i","app.js","popUnderStage","samAdBlockAction","googlebot","advert","bscheck.adblocker","qpcheck.ads","tmnramp","!sf-converter.com","clickAds.banner.urls","json:[{\"url\":{\"limit\":0,\"url\":\"\"}}]","ad","show_ads","ignielAdBlock","isContentBlocked","GetWindowHeight","/pop|wm|forceClick/","CloudflareApps.installs.Ik7rmQ4t95Qk.options.measureDomain","detectAB1",".init","ActiveXObject","uBlockOriginDetected","/_0x|localStorage\\.getItem/","google_ad_status","googletag._vars_","googletag._loadStarted_","google_unique_id","google.javascript","google.javascript.ads","google_global_correlator","ads.servers.[].apiAddress","paywallGateway.truncateContent","Constant","u_cfg","adBlockDisabled","__NEXT_DATA__.props.pageProps.adVideo","blockedElement","/ad","onpopstate","popState","adthrive.config","__C","ad-block-popup","exitTimer","innerHTML.replace","ajax","abu","countDown","HTMLElement.prototype.insertAdjacentHTML","_ads","eabpDialog","TotemToolsObject","puHref","flashvars.adv_postpause_vast","/Adblock|_ad_/","advads_passive_groups","GLX_GLOBAL_UUID_RESULT","f.parentNode.removeChild(f)","swal","keepChecking","t.pt","clickAnywhere urls","a[href*=\"/ads.php\"][target=\"_blank\"]","nitroAds","class.scroll","/showModal|isBlanketFound/","disableDeveloperTools","[onclick*=\"window.open\"]","openWindow","Check","checkCookieClick","readyToVote","12000","target|href","a[href^=\"//\"]","wpsite_clickable_data","insertBefore","offsetParent","meta.advertise","next","vidorev_jav_plugin_video_ads_object.vid_ads_m_video_ads","data.attributes.config.freewheel data.attributes.config.featureFlags.dPlayer","data.attributes.ssaiInfo.forecastTimeline data.attributes.ssaiInfo.vendorAttributes.nonLinearAds data.attributes.ssaiInfo.vendorAttributes.videoView data.attributes.ssaiInfo.vendorAttributes.breaks.[].ads.[].adMetadata data.attributes.ssaiInfo.vendorAttributes.breaks.[].ads.[].adParameters data.attributes.ssaiInfo.vendorAttributes.breaks.[].timeOffset","xpath(//*[name()=\"MPD\"][.//*[name()=\"BaseURL\" and contains(text(),'dash_clear_fmp4') and contains(text(),'/a/')]]/@mediaPresentationDuration | //*[name()=\"Period\"][./*[name()=\"BaseURL\" and contains(text(),'dash_clear_fmp4') and contains(text(),'/a/')]])","ssaiInfo","adsProvider.init","SDKLoaded","css_class.scroll","mnpwclone","0.3","7000","[href*=\"nihonjav\"]","/null|Error/","bannersRequest","vads","a[href][onclick^=\"getFullStory\"]","!newdmn","popUp","devtoolschange","rccbase_styles","POPUNDER_ENABLED","plugins.preroll","DHAntiAdBlocker","/out.php","ishop_codes","#advVid","location.replace","showada","showax","adp","__tnt","compatibility","popundrCheck","history.replaceState","rexxx.swp","constructor","p18","clickHandler","onbeforeunload","window.location.href","prebid","asc","json:{\"cmd\": [null], \"que\": [null], \"wrapperVersion\": \"6.19.0\", \"refreshQue\": {\"waitDelay\": 3000, \"que\": []}, \"isLoaded\": true, \"bidderSettings\": {}, \"libLoaded\": true, \"version\": \"v9.20.0\", \"installedModules\": [], \"adUnits\": [], \"aliasRegistry\": {}, \"medianetGlobals\": {}}","google_tag_manager","json:{ \"G-Z8CH48V654\": { \"_spx\": false, \"bootstrap\": 1704067200000, \"dataLayer\": { \"name\": \"dataLayer\" } }, \"SANDBOXED_JS_SEMAPHORE\": 0, \"dataLayer\": { \"gtmDom\": true, \"gtmLoad\": true, \"subscribers\": 1 }, \"sequence\": 1 }","ADBLOCKED","Object.prototype.adsEnabled","removeChild","ai_run_scripts","clearInterval(i)","marginheight","ospen","pu_count","mypop","adblock_use","Object.prototype.adblockFound","download","1100","createCanvas","bizpanda","Q433","/pop|_blank/","movie.advertising.ad_server playlist.movie.advertising.ad_server","unblocker","playerAdSettings.adLink","playerAdSettings.waitTime","computed","manager","window.location.href=link","moonicorn.network","/dyn\\.ads|loadAdsDelayed/","xv.sda.pp.init","onreadystatechange","skmedix.com","skmedix.pl","MediaContainer.Metadata.[].Ad","doubleclick.com","opaque","_init","href|target|data-ipshover-target|data-ipshover|data-autolink|rel","a[href^=\"https://thumpertalk.com/link/click/\"][target=\"_blank\"]","/touchstart|mousedown|click/","latest","secs","event.simulate","isAdsLoaded","adblockerAlert","/^https?:\\/\\/redirector\\.googlevideo\\.com.*/","/.*m3u8/","cuepoints","cuepoints.[].start cuepoints.[].end cuepoints.[].start_float cuepoints.[].end_float","Period[id*=\"-roll-\"][id*=\"-ad-\"]","pubads.g.doubleclick.net/ondemand","/ads/banner","reachGoal","Element.prototype.attachShadow","Adb","randStr","SPHMoverlay","ai","timer.remove","popupBlocker","afScript","Object.prototype.parseXML","Object.prototype.blackscreenDuration","Object.prototype.adPlayerId","/ads",":visible","mMcreateCookie","downloadButton","SmartPopunder.make","readystatechange","document.removeEventListener",".button[href^=\"javascript\"]","animation","status","adsblock","pub.network","timePassed","timeleft","input[id=\"button1\"][class=\"btn btn-primary\"][disabled]","t(a)",".fadeIn()","result","evolokParams.adblock","[src*=\"SPOT\"]","asap stay",".pageProps.__APOLLO_STATE__.*[?.__typename==\"AotSidebar\"]","/_next/data","pageProps.__TEMPLATE_QUERY_DATA__.aotFooterWidgets","props.pageProps.data.aotHomepageTopBar props.pageProps.data.aotHomepageTopBar props.pageProps.data.aotHeaderAdScripts props.pageProps.data.aotFooterWidgets","counter--","daadb","l-1","_htas","/width|innerHTML/","magnificPopup","skipOptions","method:HEAD url:doubleclick.net","style.display","tvid.in/log","1150","0.5","testadtags ad","document.referrer","quadsOptions","history.pushState","loadjscssfile","load_ads","/debugger|offsetParent/","/ads|imasdk/","6","__NEXT_DATA__.props.pageProps.adsConfig","make_rand_div","new_config.timedown","catch","google_ad","response.timeline.elements.[-].advertiserId","url:/api/v2/tabs/for_you","timercounter","document.location","innerHeight","cainPopUp","#timer","!bowfile.com","cloudfront.net/?","href|target|data-onclick","a[id=\"dl\"][data-onclick^=\"window.open\"]","a.getAttribute(\"data-ad-client\")||\"\"","truex","truex.client","answers","!display","/nerveheels/","No","foreverJQ","/document.createElement|stackDepth:2/","container.innerHTML","top-right","hiddenProxyDetected","SteadyWidgetSettings.adblockActive","temp","inhumanity_pop_var_name","url:googlesyndication","enforceAdStatus","hashchange","history.back","starPop","Element.prototype.matches","litespeed","__PoSettings","HTMLSelectElement","youtube","aTagChange","Object.prototype.ads","a[onclick^=\"setTimeout\"]","detectBlockAds","eb","/analytics|livestats/","/nextFunction|2000/","resource_response.data.[-].pin_promotion_id resource_response.data.results.[-].pin_promotion_id","initialReduxState.pins.{-}.pin_promotion_id initialReduxState.resources.UserHomefeedResource.*.data.[-].pin_promotion_id","player","mahimeta","__htas","chp_adblock_browser","/adb/i","tdBlock",".t-out-span [href*=\"utm_source\"]","src",".t-out-span [src*=\".gif\"]","notifier","penciBlocksArray",".panel-body > .text-center > button","modal-window","isScrexed","fallbackAds","popurl","SF.adblock","() => n(t)","() => t()","startfrom","Math.imul","checkAdsStatus","wtg-ads","/ad-","void 0","/__ez|window.location.href/","D4zz","Object.prototype.ads.nopreroll_",").show()","/open.*_blank/","advanced_ads_ready","loadAdBlocker","HP_Scout.adBlocked","SD_IS_BLOCKING","isBlocking","adFreePopup","Object.prototype.isPremium","__BACKPLANE_API__.renderOptions.showAdBlock",".quiver-cam-player--ad-not-running.quiver-cam-player--free video","debug","Object.prototype.isNoAds","tv3Cmp.ConsentGiven","distance","site-access","chAdblock","/,ad\\n.+?(?=#UPLYNK-SEGMENT)/gm","/uplynk\\.com\\/.*?\\.m3u8/","remaining","/ads|doubleclick/","/Ads|adbl|offsetHeight/",".innerHTML","onmousedown",".ob-dynamic-rec-link","setupSkin","/app.js","dqst.pl","PvVideoSlider","_chjeuHenj","[].data.searchResults.listings.[-].targetingSegments","noConflict","preroll_helper.advs","/show|innerHTML/","create_ad","Object.prototype.enableInterstitial","addAds","/show|document\\.createElement/","loadXMLDoc","register","MobileInGameGames","__osw","uniconsent.com","/coinzillatag|czilladx/","divWidth","Script_Manager","Script_Manager_Time","bullads","Msg","!download","/click|mousedown/","adjsData","AdService.info.abd","UABP","adBlockDetectionResult","popped","/xlirdr|hotplay\\-games|hyenadata/","document.body.insertAdjacentHTML","exo","tic","download_loading","pu_url","Click","afStorage","puShown1","onAdblockerDetected","htmlAds","second","lycos_ad","150","passthetest","checkBlock","/thaudray\\.com|putchumt\\.com/","popName","vlitag","asgPopScript","/(?=^(?!.*(jquery|turnstile|challenge-platform)))/","Object.prototype.loadCosplay","Object.prototype.loadImages","FMPoopS","/window\\['(?:\\\\x[0-9a-f]{2}){2}/","urls.length","updatePercentage","importantFunc","console.warn","sam","current()","confirm","pandaAdviewValidate","showAdBlock","aaaaa-modal","setCookie","/(?=^(?!.*(http)))/","$onet","adsRedirectPopups","canGetAds","method:/head/i","Array.prototype.includes","json:\"none\"","/brave-api|script-content|bait|real/","length:11000","goToURL","ad_blocker_active","init_welcome_ad","setinteracted",".MediaStep","data.xdt_injected_story_units.ad_media_items","dataLayer","document.body.contains","nothingCanStopMeShowThisMessage","window.focus","imasdk","TextEncoder.prototype.encode","!/^\\//","fakeElement","adEnable","ssaiInfo fallback.ssaiInfo","adtech-brightline adtech-google-pal adtech-iab-om","/playbackInfo","xpath(//*[name()=\"MPD\"]/@mediaPresentationDuration | //*[name()=\"Period\"]/@start | //*[name()=\"Period\"][not(.//*[name()=\"SegmentTimeline\"])][not(.//*[name()=\"ContentProtection\"])] | //*[name()=\"Period\"][./*[name()=\"BaseURL\"]][not(.//*[name()=\"ContentProtection\"])])","/-vod-.+\\.mpd/","htmlSectionsEncoded","event.dispatch","adx","popupurls","displayAds","cls_report?","-0x1","childNodes","wbar","[href=\"/bestporn.html\"]","_adshrink.skiptime","gclid","event","!yt1d.com","button#getlink","button#gotolink","AbleToRunAds","PreRollAd.timeCounter","result.ads","tpc.googlesyndication.com","id","#div-gpt-ad-footer","#div-gpt-ad-pagebottom","#div-gpt-ad-relatedbottom-1","#div-gpt-ad-sidebottom","goog","document.body","abpblocked","p$00a",".data?","openAdsModal","paAddUnit","gloacmug.net","items.[-].potentialActions.0.object.impressionToken items.[-].hasPart.0.potentialActions.0.object.impressionToken","context.adsIncluded","refresh","adt","Array.prototype.indexOf","interactionCount","/cloudfront|thaudray\\.com/","test_adblock","vastEnabled","/adskeeper|cloudflare/","#gotolink","detectadsbocker","c325","two_worker_data_js.js","adobeModalTestABenabled","FEATURE_DISABLE_ADOBE_POPUP_BY_COUNTRY","questpassGuard","isAdBlockerEnabled","shortConfig","akadb","eazy_ad_unblocker","json:\"\"","unlock","adswizz.com","document.onkeypress","adsSrc","sssp","emptyObj","[style*=\"background-image: url\"]","[href*=\"click?\"]","/freychang|passback|popunder|tag|banquetunarmedgrater/","google-analytics","myTestAd","/<VAST version.+VAST>/","<VAST version=\\\"4.0\\\"></VAST>","deezer.getAudiobreak","Ads","smartLoaded","..ads_audio=false","ShowAdBLockerNotice","ad_listener","!shrdsk","notify","AdB","push-allow-modal",".hide","(!0)","Delay","ima","Cookiebot","\"adsBlocked\"","stream.insertion.adSession stream.insertion.points stream.insertion stream.sources.*.insertion pods.0.ads","ads.metadata ads.document ads.dxc ads.live ads.vod","site-access-popup","*.tanya_video_ads","deblocker","data?","script.src","/#EXT-X-DISCONTINUITY.{1,100}#EXT-X-DISCONTINUITY/gm","mixed.m3u8","feature_flags.interstitial_ads_flag","feature_flags.interstitials_every_four_slides","?","downloadToken","waldoSlotIds","Uint8Array","redirectpage","13500","adblockstatus","adScriptLoaded","/adoto|googlesyndication/","props.sponsoredAlternative","np.detect","ad-delivery","document.documentElement.lang","adSettings","banner_is_blocked","consoleLoaded?clearInterval","Object.keys","[?.context.bidRequestId].*","RegExp.prototype.test","json:\"wirtualnemedia\"","/^dobreprogramy$/","decodeURL","updateProgress","/salesPopup|mira-snackbar/","Object.prototype.adBlocked","DOMAssistant","rotator","adblock popup vast","detectImgLoad","killAdKiller","current-=1","/zefoy\\.com\\S+:3:1/",".clientHeight","googleAd","/showModal|chooseAction|doAction|callbackAdsBlocked/","_shouldProcessLink","cpmecs","/adlink/i","[onclick]","noreferrer","[onload^=\"window.open\"]","dontask","aoAdBlockDetected","button[onclick^=\"window.open\"]","function(e)","touchstart","Brid.A9.prototype.backfillAdUnits","adlinkfly_url","siteAccessFlag","/adblocker|alert/","doubleclick.net/instream/ad_status.js","war:doubleclick_instream_ad_status.js","redURL","/children\\('ins'\\)|Adblock|adsbygoogle/","dct","slideShow.displayInterstitial","openPopup","Object.getPrototypeOf","plugins","ai_wait_for_jquery","pbjs","tOS2","ips","Error","/stackDepth:1\\s/","tryShowVideoAdAsync","chkADB","onDetected","detectAdblocker","document.ready","a[href*=\"torrentico.top/sim/go.php\"]","success.page.spaces.player.widget_wrappers.[].widget.data.intervention_data","VAST","{\"value\": \"Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Mobile/15E148 Safari/604.1\"}","navigator.standalone","navigator.platform","{\"value\": \"iPhone\"}","Storage.prototype.setItem","searchCount","empire.pop","empire.direct","empire.directHideAds","json:\"click\"","(!1)","pagead2.googlesyndication.com","empire.mediaData.advisorMovie","empire.mediaData.advisorSerie","fuckadb","[type=\"submit\"]","setTimer","auto_safelink","!abyss.to","daadb_get_data_fetch","penci_adlbock.ad_blocker_detector","siteAccessPopup","/adsbygoogle|adblock|innerHTML|setTimeout/","/innerHTML|_0x/","Object.prototype.adblockDetector","biteDisplay","blext","/[a-z]\\(!0\\)/","800","vidorev_jav_plugin_video_ads_object","vidorev_jav_plugin_video_ads_object_post","dai_iframe","popactive","/detectAdBlocker|window.open/","S_Popup","eazy_ad_unblocker_dialog_opener","rabLimit","-1","popUnder","/GoToURL|delay/","nudgeAdBlock","/googlesyndication|ads/","/Content/_AdBlock/AdBlockDetected.html","adBlckActive","AB.html","feedBack.showAffilaePromo","ShowAdvertising","a img:not([src=\"images/main_logo_inverted.png\"])","a[href][target=\"_blank\"],[src^=\"//ad.a-ads.com/\"]","avails","amazonaws.com","ima3_dai","topaz.","FAVE.settings.ads.ssai.prod.clips.enabled","FAVE.settings.ads.ssai.prod.liveAuth.enabled","FAVE.settings.ads.ssai.prod.liveUnauth.enabled","xpath(//*[name()=\"MPD\"]/@mediaPresentationDuration | //*[name()=\"Period\"]/@start | //*[name()=\"Period\"][.//*[name()=\"BaseURL\" and contains(text(),\".prd.media.\")]])","/dash.mpd","/sandbox/i","analytics.initialized","autoptimize","UserCustomPop","method:GET","data.reg","time-events","/#EXTINF:[^\\n]+\\nhttps:\\/\\/redirector\\.googlevideo\\.com[^\\n]+/gms","/\\/ondemand\\/.+\\.m3u8/","/redirector\\.googlevideo\\.com\\/videoplayback[\\s\\S]*?dclk_video_ads/",".m3u8","phxSiteConfig.gallery.ads.interstitialFrequency","loadpagecheck","popupAt","modal_blocker","art3m1sItemNames.affiliate-wrapper","\"\"","isOpened","playerResponse.adPlacements playerResponse.playerAds adPlacements playerAds","Array.prototype.find","affinity-qi","GeneratorAds","isAdBlockerActive","pop.doEvent","'shift'","bFired","scrollIncrement","di.app.WebplayerApp.Ads.Adblocks.app.AdBlockDetectApp.startWithParent","a#downloadbtn[onclick^=\"window.open\"]","alink","/ads|googletagmanager/","sharedController.adblockDetector",".redirect","sliding","a[onclick]","infoey","settings.adBlockDetectionEnabled","displayInterstitialAdConfig","response.ads","/api","unescape","checkAdBlockeraz","blockingAds","Yii2App.playbackTimeout","setC","popup","/atob|innerHTML/","/adScriptPath|MMDConfig/","xpath(//*[name()=\"MPD\"]/@mediaPresentationDuration | //*[name()=\"Period\"]/@start | //*[name()=\"Period\"][.//*[name()=\"BaseURL\" and contains(text(),'adease')]])","[media^=\"A_D/\"]","adease adeaseBlob vmap","adease","aab","ips.controller.register","plugins.adService","QiyiPlayerProphetData.a.data","wait","/adsbygoogle|doubleclick/","adBreaks.[].startingOffset adBreaks.[].adBreakDuration adBreaks.[].ads adBreaks.[].startTime adBreak adBreakLocations","/session.json","xpath(//*[name()=\"Period\"][not(contains(@id,\"subclip\"))] | //*[name()=\"MPD\"]/@mediaPresentationDuration | //*[name()=\"Period\"]/@start)","/\\/episode\\/.+?\\.mpd\\?/","session.showAds","toggleAdBlockInfo","cachebuster","config","OpenInNewTab_Over","/native|\\{n\\(\\)/","[style^=\"background\"]","[target^=\"_\"]","bodyElement.removeChild","aipAPItag.prerollSkipped","aipAPItag.setPreRollStatus","\"ads_disabled\":false","\"ads_disabled\":true","payments","reklam_1_saniye","reklam_1_gecsaniye","reklamsayisi","reklam_1","psresimler","data","runad","url:doubleclick.net","war:googletagservices_gpt.js","[target=\"_blank\"]","\"flashtalking\"","/(?=^(?!.*(cdn-cgi)))/","criteo","war:32x32.png","HTMLImageElement.prototype.onerror","data.home.home_timeline_urt.instructions.[].entries.[-].content.itemContent.promotedMetadata","url:/Home","data.search_by_raw_query.search_timeline.timeline.instructions.[].entries.[-].content.itemContent.promotedMetadata","url:/SearchTimeline","data.threaded_conversation_with_injections_v2.instructions.[].entries.[-].content.items.[].item.itemContent.promotedMetadata","url:/TweetDetail","data.user.result.timeline_v2.timeline.instructions.[].entries.[-].content.itemContent.promotedMetadata","url:/UserTweets","data.immersiveMedia.timeline.instructions.[].entries.[-].content.itemContent.promotedMetadata","url:/ImmersiveMedia","/\\.php\\b.*_blank/","powerAPITag","playerEnhancedConfig.run","rodo.checkIsDidomiConsent","xtime","smartpop","EzoIvent","/doubleclick|googlesyndication|vlitag/","overlays","googleAdUrl","/googlesyndication|nitropay/","uBlockActive","/api/v1/events","Scribd.Blob.AdBlockerModal","AddAdsV2I.addBlock","xpath(//*[name()=\"Period\"][.//*[name()=\"BaseURL\" and contains(text(),'/ad/')]])","/Detect|adblock|style\\.display|\\[native code]|\\.call\\(null\\)/","/google_ad_client/","total","popCookie","/0x|sandCheck/","hasAdBlocker","ShouldShow","offset","startDownload","cloudfront","[href*=\"jump\"]","!direct","a0b","/outbrain|criteo|thisiswaldo|media\\.net|ohbayersbur|adligature|quantserve|srvtrck|\\.css|\\.js/","mode:no-cors","2000-5000","contrformpub","data.device.adsParams data.device.adSponsorshipTemplate","url:/appconfig","innerWidth","initials.yld-pdpopunder",".main-wrap","/googlesyndication|googima\\.js/","__brn_private_mode","download_click","advertisement3","start","Object.prototype.skipPreroll","/adskeeper|bidgear|googlesyndication|mgid/","fwmrm.net","/\\/ad\\/g\\/1/","adverts.breaks","result.responses.[].response.result.cards.[-].data.offers","ADB","downloadTimer","/ads|google/","injectedScript","/googlesyndication|googletagservices/","DisableDevtool","eClicked","number","sync","PlayerLogic.prototype.detectADB","ads-twitter.com","all","havenclick","VAST > Ad","/tserver","Object.prototype.prerollAds","secure.adnxs.com/ptv","war:noop-vast4.xml","notifyMe","alertmsg","/streams","adsClasses","gsecs","adtagparameter","dvsize","52","removeDLElements","/\\.append|\\.innerHTML|undefined|\\.css|blocker|flex|\\$\\('|obfuscatedMsg/","warn","adc","majorse","completed","testerli","showTrkURL","/popunder/i","readyWait","document.body.style.backgroundPosition","invoke","ssai_manifest ad_manifest playback_info.ad_info qvt.playback_info.ad_info","Object.prototype.setNeedShowAdblockWarning","load_banner","initializeChecks","HTMLDocument","video-popup","splashPage","adList","adsense-container","detect-modal","/_0x|dtaf/","ifmax","adRequest","nads","nitroAds.abp","adinplay.com","onloadUI","war:google-ima.js","/^data:text\\/javascript/","randomNumber","current.children","probeScript","PageLoader.DetectAb","!koyso.","adStatus","popUrl","one_time","PlaybackDetails.[].DaiVod","consentGiven","ad-block","data.searchClassifiedFeed.searchResultView.0.searchResultItemsV2.edges.[-].node.item.content.creative.clickThroughEvent.adsTrackingMetadata.metadata.adRequestId","data.me.personalizedFeed.feedItems.[-].promo.creative.clickThroughUrl.adsTrackingMetadata.metadata.adRequestId","data.me.rhrFeed.feedItems.[-].promo.creative.clickThroughUrl.adsTrackingMetadata.metadata.sponsor","mdpDeblocker","doubleclick.net","BN_CAMPAIGNS","media_place_list","...","/\\{[a-z]\\(!0\\)\\}/","canRedirect","/\\{[a-z]\\(e\\)\\}/","[].data.displayAdsV3.data.[-].__typename","[].data.TopAdsProducts.data.[-].__typename","[].data.topads.data.[-].__typename","/\\{\"id\":\\d{9,11}(?:(?!\"ads\":\\{\"id\":\"\").)+?\"ads\":\\{\"id\":\"\\d+\".+?\"__typename\":\"ProductCarouselV2\"\\},?/g","/graphql/InspirationCarousel","/\\{\"category_id\"(?:(?!\"ads\":\\{\"id\":\"\").)+?\"ads\":\\{\"id\":\"\\d+\".+?\"__typename\":\"ProductCarouselV2\"\\},?/g","/graphql/InspirationalCarousel","/\\{\"id\":\\d{9,11}(?:(?!\"isTopads\":false).)+?\"isTopads\":true.+?\"__typename\":\"recommendationItem\"\\},/g","/\\/graphql\\/productRecommendation/i","/,\\{\"id\":\\d{9,11}(?:(?!\"isTopads\":false).)+?\"isTopads\":true(?:(?!\"__typename\":\"recommendationItem\").)+?\"__typename\":\"recommendationItem\"\\}(?=\\])/","/\\{\"(?:productS|s)lashedPrice\"(?:(?!\"isTopads\":false).)+?\"isTopads\":true.+?\"__typename\":\"recommendationItem\"\\},?/g","/graphql/RecomWidget","/\\{\"appUrl\"(?:(?!\"isTopads\":false).)+?\"isTopads\":true.+?\"__typename\":\"recommendationItem\"\\},?/g","/graphql/ProductRecommendationQuery","adDetails","/secure?","data.search.products.[-].sponsored_ad.ad_source","url:/plp_search_v2?","GEMG.GPT.Interstitial","amiblock","String.prototype.concat","adBlockerDismissed","adBlockerDismissed_","karte3","18","callbackAdsBlocked","stackTrace","sandDetect","json:\"body\"",".ad-zone","showcfkModal","amodule.data","emptyArr","inner-ad","_ET","jssdks.mparticle.com","session.sessionAds session.sessionAdsRequired","/session","getComputedStyle(el)","/(?=^(?!.*(orchestrate|cloudflare)))/","Object.prototype.ADBLOCK_DETECTION",".features.*[?.slug==\"adblock-detection\"].enabled=false","/ad/","/count|verify|isCompleted/","postroll","itemList.[-].ad_info.ad_id","url:api/recommend/item_list/","/adinplay|googlesyndication/",".downloadbtn","!hidan.sh","ask","interceptClickEvent","isAdBlockDetected","pData.adblockOverlayEnabled","ad_block_detector","attached","div[class=\"share-embed-container\"]","/^\\w{11}[1-9]\\d+\\.ts/","cabdSettings","/outbrain|adligature|quantserve|adligature|srvtrck/","adsConfiguration","/vod","layout.sections.mainContentCollection.components.[].data.productTiles.[-].sponsoredCreative.adGroupId","/search","fp-screen","puURL","!vidhidepre.com","[onclick*=\"_blank\"]","[onclick=\"goToURL();\"]","leaderboardAd","#leaderboardAd","placements.processingFile","dtGonza.playeradstime","\"-1\"","EV.Dab","ablk","shutterstock.com","Object.prototype.adUrl","sorts.[].recommendationList.[-].contentMetadata.EncryptedAdTrackingData","/ads|chp_?ad/","ads.[-].ad_id","wp-ad","/clarity|googlesyndication/","/aff|jump/","!/mlbbox\\.me|_self/","aclib.runPop","ADS.isBannersEnabled","ADS.STATUS_ERROR","json:\"COMPLETE\"","button[onclick*=\"open\"]","getComputedStyle(testAd)","openPopupForChapter","Object.prototype.popupOpened","src_pop","zigi_tag_id","gifs.[-].cta.link","boosted_gifs","adsbygoogle_ama_fc_has_run","doThePop","thanksgivingdelights","yes.onclick","!vidsrc.","clearTimeout","popundersPerIP","createInvisibleTrigger","jwDefaults.advertising","elimina_profilazione","elimina_pubblicita","snigelweb.com","abd","pum_popups","checkerimg","uzivo","openDirectLinkAd","!nikaplayer.com",".adsbygoogle:not(.adsbygoogle-noablate)","json:\"img\"","playlist.movie.advertising.ad_server","PopUnder","data.[].affiliate_url","cdnpk.net/v2/images/search?","cdnpk.net/Rest/Media/","war:noop.json","data.[-].inner.ctaCopy","?page=","/gampad/ads?",".adv-",".length === 0",".length === 31","window.matchMedia('(display-mode: standalone)').matches","Object.prototype.DetectByGoogleAd","a[target=\"_blank\"][style]","/adsActive|POPUNDER/i","/Executed|modal/","[breakId*=\"Roll\"]","/content.vmap","/#EXT-X-KEY:METHOD=NONE\\n#EXT(?:INF:[^\\n]+|-X-DISCONTINUITY)\\n.+?(?=#EXT-X-KEY)/gms","/media.m3u8","window.navigator.brave","showTav","document['\\x","showADBOverlay","..directLink","..props[?.children*=\"clicksCount\"].children","adskeeper","springserve.com","document.documentElement.clientWidth","outbrain.com","s4.cdnpc.net/front/css/style.min.css","slider--features","s4.cdnpc.net/vite-bundle/main.css","data-v-d23a26c8","cdn.taboola.com/libtrc/san1go-network/loader.js","feOffset","hasAdblock","taboola","adbEnableForPage","Dataffcecd","/adblock|isblock/i","/\\b[a-z] inlineScript:/","result.adverts","data.pinotPausedPlaybackPage","fundingchoicesmessages","isAdblock","button[id][onclick*=\".html\"]","dclk_video_ads","ads breaks cuepoints times","odabd","pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?ord=","b.google_reactive_tag_first","sbs.demdex.net/dest5.html?d_nsid=0&ord=","Demdex.canSetThirdPartyCookies","securepubads.g.doubleclick.net/pagead/ima_ppub_config?ippd=https%3A%2F%2Fwww.sbs.com.au%2Fondemand%2F&ord=","[\"4117\"]","configs.*.properties.componentConfigs.slideshowConfigs.*.interstitialNativeAds","url:/config","list.[].link.kicker","/content/v1/cms/api/amp/Document","properties.tiles.[-].isAd","/mestripewc/default/config","openPop","circle_animation","CountBack","990","/location\\.(replace|href)|stopAndExitFullscreen/","displayAdBlockedVideo","/undefined|displayAdBlockedVideo/","cns.library","json:\"#app-root\"","google_ads_iframe","data-id|data-p","[data-id],[data-p]","BJSShowUnder","BJSShowUnder.bindTo","BJSShowUnder.add","JSON.stringify","Object.prototype._parseVAST","Object.prototype.createAdBlocker","Object.prototype.isAdPeriod","breaks custom_breaks_data pause_ads video_metadata.end_credits_time","pause_ads","/playlist","breaks","breaks custom_breaks_data pause_ads","xpath(//*[name()=\"MPD\"]/@mediaPresentationDuration | //*[name()=\"Period\"][.//*[name()=\"BaseURL\" and contains(text(),\"/ads-\")]] | //*[name()=\"Period\"][starts-with(@id,\"ad\")] | //*[name()=\"Period\"][starts-with(@id,\"Ad\")] | //*[name()=\"Period\"]/@start)","MPD Period[id^=\"Ad\"i]","ABLK","_n_app.popunder","_n_app.options.ads.show_popunders","N_BetterJsPop.object","jwplayer.vast","Fingerprent2","test.remove","isAdb","/click|mouse|touch/","puOverlay","opopnso","c0ZZ","cuepointPlaylist vodPlaybackUrls.result.playbackUrls.cuepoints vodPlaylistedPlaybackUrls.result.playbackUrls.pauseBehavior vodPlaylistedPlaybackUrls.result.playbackUrls.pauseAdsResolution vodPlaylistedPlaybackUrls.result.playbackUrls.intraTitlePlaylist.[-].shouldShowOnScrubBar ads","xpath(//*[name()=\"Period\"][.//*[@value=\"Ad\"]] | /*[name()=\"MPD\"]/@mediaPresentationDuration | //*[name()=\"Period\"]/@start)","[value=\"Ad\"]","xpath(//*[name()=\"Period\"][.//*[@value=\"Draper\"]] | /*[name()=\"MPD\"]/@mediaPresentationDuration | //*[name()=\"Period\"]/@start)","[value=\"Draper\"]","xpath(//*[name()=\"Period\"][.//*[name()=\"BaseURL\" and contains(text(),\"/interstitial/\")]] | /*[name()=\"MPD\"][.//*[name()=\"BaseURL\" and contains(text(),\"/interstitial/\")]]/@mediaPresentationDuration | /*[name()=\"MPD\"][.//*[name()=\"BaseURL\" and contains(text(),\"/interstitial/\")]]/*[name()=\"Period\"]/@start)","ue_adb_chk","ad.doubleclick.net bid.g.doubleclick.net ggpht.com google.co.uk google.com googleads.g.doubleclick.net googleads4.g.doubleclick.net googleadservices.com googlesyndication.com googleusercontent.com gstatic.com gvt1.com prod.google.com pubads.g.doubleclick.net s0.2mdn.net static.doubleclick.net surveys.g.doubleclick.net youtube.com ytimg.com","lifeOnwer","jsc.mgid.com","movie.advertising",".mandatoryAdvertising=false","/player/configuration","vast_urls","show_adverts","runCheck","adsSlotRenderEndSeen","DOMTokenList.prototype.add","\"-\"","removedNodes.forEach","__NEXT_DATA__.props.pageProps.broadcastData.remainingWatchDuration","json:9999999999","/\"remainingWatchDuration\":\\d+/","\"remainingWatchDuration\":9999999999","/stream","/\"midTierRemainingAdWatchCount\":\\d+,\"showAds\":(false|true)/","\"midTierRemainingAdWatchCount\":0,\"showAds\":false","a[href][onclick^=\"openit\"]","cdgPops","json:\"1\"","pubfuture","/doubleclick|google-analytics/","flashvars.mlogo_link","'script'","/ip-acl-all.php","URLlist","adBlockNotice","aaw","aaw.processAdsOnPage","displayLayer","adId","underpop","adBlockerModal","10000-15000","/adex|loadAds|adCollapsedCount|ad-?block/i","/^function\\(\\).*requestIdleCallback.*/","/function\\([a-z]\\){[a-z]\\([a-z]\\)}/","OneTrust","OneTrust.IsAlertBoxClosed","FOXIZ_MAIN_SCRIPT.siteAccessDetector","120000","openAdBlockPopup","drama-online","zoneid","\"data-cfasync\"","Object.init","advanced_ads_check_adblocker","div[class=\"nav tabTop\"] + div > div:first-child > div:first-child > a:has(> img[src*=\"/\"][src*=\"_\"][alt]), #head + div[id] > div:last-child > div > a:has(> img[src*=\"/\"][src*=\"_\"][alt])","/(?=^(?!.*(_next)))/","[].props.slides.[-].adIndex","#ad_blocker_detector","adblockTrigger","20","Date.prototype.toISOString","insertAd","!/^\\/|_self|alexsports|nativesurge/","method:HEAD mode:no-cors","attestHasAdBlockerActivated","extInstalled","blockThisUrl","SaveFiles.add","detectSandbox","bait.remove","/rekaa","pop_tag","/HTMLDocument|blob/","=","/wp-content\\/uploads\\/[a-z]+\\/[a-z]+\\.js/","wbDeadHinweis","()=>{var c=Kb","0.2","fired","popupInterval","adbon","*.aurl","/cs?id=","repl:/\\.mp4$/.mp3/",".mp4","-banner","PopURL","LCI.adBlockDetectorEnabled","!y2meta","ConsoleBan","disableDevtool","ondevtoolopen","onkeydown","window.history.back","close","lastPopupTime","button#download","mode:\"no-cors\"","!magnetdl.","stoCazzo","_insertDirectAdLink","Visibility","importFAB","uas","ast","json:1","a[href][target=\"_blank\"]","url:ad/banner.gif","window.__CONFIGURATION__.adInsertion.enabled","window.__CONFIGURATION__.features.enableAdBlockerDetection","_carbonads","_bsa","redirectOnClick","widgets.outbrain.com","2d","/googletagmanager|ip-api/","&&","json:\"0\"","timeleftlink","handlePopup","bannerad sidebar ti_sidebar","moneyDetect","play","EFFECTIVE_APPS_GCB_BLOCKED_MESSAGE","sub","checkForAdBlocker","/navigator|location\\.href/","mode:cors","!self","/createElement|addEventListener|clientHeight/","uberad_mode","data.getFinalClickoutUrl data.sendSraBid",".php","!notunmovie","handleRedirect","testAd","imasdk.googleapis.com","/topaz/api","data.availableProductCount","results.[-].advertisement","/partners/home","__aab_init","show_videoad_limited","__NATIVEADS_CANARY__","[breakId]","_VMAP_","ad_slot_recs","/doc-page/recommenders",".smartAdsForAccessNoAds=true","/doc-page/afa","Object.prototype.adOnAdBlockPreventPlayback","pre_roll_url","post_roll_url",".result.PlayAds=false","/api/get-urls","/adsbygoogle|dispatchEvent/","OfferwallSessionTracker","player.preroll",".redirected","promos","TNCMS.DMP","/pop?","=>",".metadata.hideAds=true","a2d.tv/play/","adblock_detect","link.click","document.body.style.overflow","fallback","/await|clientHeight/","Function","..adTimeout=0","/api/v","!/\\/download|\\/play|cdn\\.videy\\.co/","!_self","#fab","www/delivery","/\\/js/","/\\/4\\//","prads","/googlesyndication|doubleclick|adsterra/",".adsbygoogle","String.prototype.split","null,http","..searchResults.*[?.isAd==true]","..mainContentComponentsListProps.*[?.isAd==true]","/search/snippet?","googletag.enums","json:{\"OutOfPageFormat\":{\"REWARDED\":true}}","cmgpbjs","displayAdblockOverlay","start_full_screen_without_ad","drupalSettings.coolmath.hide_preroll_ads",".submit","clkUnder","adsArr","onClick","..data.expectingAds=false","/profile","[href^=\"https://whulsaux.com\"]","adRendered","Object.prototype.clickAds.emit","!storiesig","openUp",".result.timeline.*[?.type==\"ad\"]","/livestitch","protectsubrev.com","dispatchEvent(window.catchdo)","!adShown","/blocker|detected/","3200-","/window\\.location\\.href/","AdProvider","AdProvider.push","ads_","ad_blocker_detector","..allowAdblock=true","ads playerAds","/initPops|popLite|popunder/","[?.type==\"ads\"].visibility.status=\"hidden\"","/^755$/","data.*.elements.edges.[].node.outboundLink","data.children.[].data.outbound_link","method:POST url:/logImpressions","rwt",".js","_oEa","ADMITAD","body:browser","_hjSettings","bmak.js_post","method:POST","utreon.com/pl/api/event method:POST","log-sdk.ksapisrv.com/rest/wd/common/log/collect method:POST","firebase.analytics","require.0.3.0.__bbox.define.[].2.is_linkshim_supported","/(ping|score)Url","Object.prototype.updateModifiedCommerceUrl","HTMLAnchorElement.prototype.getAttribute","json:\"class\"","data-direct-ad","fingerprintjs-pro-react","flashvars.event_reporting","dataLayer.trackingId user.trackingId","Object.prototype.has_opted_out_tracking","cX_atfr","process","process.env","/VisitorAPI|AppMeasurement/","Visitor","''","?orgRef","analytics/bulk-pixel","eventing","send_gravity_event","send_recommendation_event","window.screen.height","method:POST body:zaraz","onclick|oncontextmenu|onmouseover","a[href][onclick*=\"this.href\"]","libAnalytics","json: {\"status\":{\"dataAvailable\":false},\"data\":{}}","libAnalytics.data.get","cmp.inmobi.com/geoip","method:POST url:pfanalytics.bentasker.co.uk","discord.com/api/v9/science","a[onclick=\"fire_download_click_tracking();\"]","adthrive._components.start",".*[?.operationName==\"TrackEvent\"]","/v1/api","ftr__startScriptLoad","url:/undefined method:POST","miner","CoinNebula","blogherads","Math.sqrt","update","/(trace|beacon)\\.qq\\.com/","splunkcloud.com/services/collector","event-router.olympics.com","hostingcloud.racing","tvid.in/log/","excess.duolingo.com/batch","/eventLog.ajax","t.wayfair.com/b.php?","navigator.sendBeacon","segment.io","mparticle.com","ceros.com/a?data","pluto.smallpdf.com","method:/post/i url:/\\/\\/chatgpt\\.com\\/ces\\/v1\\/[a-z]$/","method:/post/i url:ab.chatgpt.com/v1/rgstr","/eventhub\\.\\w+\\.miro\\.com\\/api\\/stream/","logs.netflix.com","s73cloud.com/metrics/",".cdnurl=[\"data:video/mp4;base64,AAAAHGZ0eXBNNFYgAAACAGlzb21pc28yYXZjMQAAAAhmcmVlAAAGF21kYXTeBAAAbGliZmFhYyAxLjI4AABCAJMgBDIARwAAArEGBf//rdxF6b3m2Ui3lizYINkj7u94MjY0IC0gY29yZSAxNDIgcjIgOTU2YzhkOCAtIEguMjY0L01QRUctNCBBVkMgY29kZWMgLSBDb3B5bGVmdCAyMDAzLTIwMTQgLSBodHRwOi8vd3d3LnZpZGVvbGFuLm9yZy94MjY0Lmh0bWwgLSBvcHRpb25zOiBjYWJhYz0wIHJlZj0zIGRlYmxvY2s9MTowOjAgYW5hbHlzZT0weDE6MHgxMTEgbWU9aGV4IHN1Ym1lPTcgcHN5PTEgcHN5X3JkPTEuMDA6MC4wMCBtaXhlZF9yZWY9MSBtZV9yYW5nZT0xNiBjaHJvbWFfbWU9MSB0cmVsbGlzPTEgOHg4ZGN0PTAgY3FtPTAgZGVhZHpvbmU9MjEsMTEgZmFzdF9wc2tpcD0xIGNocm9tYV9xcF9vZmZzZXQ9LTIgdGhyZWFkcz02IGxvb2thaGVhZF90aHJlYWRzPTEgc2xpY2VkX3RocmVhZHM9MCBucj0wIGRlY2ltYXRlPTEgaW50ZXJsYWNlZD0wIGJsdXJheV9jb21wYXQ9MCBjb25zdHJhaW5lZF9pbnRyYT0wIGJmcmFtZXM9MCB3ZWlnaHRwPTAga2V5aW50PTI1MCBrZXlpbnRfbWluPTI1IHNjZW5lY3V0PTQwIGludHJhX3JlZnJlc2g9MCByY19sb29rYWhlYWQ9NDAgcmM9Y3JmIG1idHJlZT0xIGNyZj0yMy4wIHFjb21wPTAuNjAgcXBtaW49MCBxcG1heD02OSBxcHN0ZXA9NCB2YnZfbWF4cmF0ZT03NjggdmJ2X2J1ZnNpemU9MzAwMCBjcmZfbWF4PTAuMCBuYWxfaHJkPW5vbmUgZmlsbGVyPTAgaXBfcmF0aW89MS40MCBhcT0xOjEuMDAAgAAAAFZliIQL8mKAAKvMnJycnJycnJycnXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXiEASZACGQAjgCEASZACGQAjgAAAAAdBmjgX4GSAIQBJkAIZACOAAAAAB0GaVAX4GSAhAEmQAhkAI4AhAEmQAhkAI4AAAAAGQZpgL8DJIQBJkAIZACOAIQBJkAIZACOAAAAABkGagC/AySEASZACGQAjgAAAAAZBmqAvwMkhAEmQAhkAI4AhAEmQAhkAI4AAAAAGQZrAL8DJIQBJkAIZACOAAAAABkGa4C/AySEASZACGQAjgCEASZACGQAjgAAAAAZBmwAvwMkhAEmQAhkAI4AAAAAGQZsgL8DJIQBJkAIZACOAIQBJkAIZACOAAAAABkGbQC/AySEASZACGQAjgCEASZACGQAjgAAAAAZBm2AvwMkhAEmQAhkAI4AAAAAGQZuAL8DJIQBJkAIZACOAIQBJkAIZACOAAAAABkGboC/AySEASZACGQAjgAAAAAZBm8AvwMkhAEmQAhkAI4AhAEmQAhkAI4AAAAAGQZvgL8DJIQBJkAIZACOAAAAABkGaAC/AySEASZACGQAjgCEASZACGQAjgAAAAAZBmiAvwMkhAEmQAhkAI4AhAEmQAhkAI4AAAAAGQZpAL8DJIQBJkAIZACOAAAAABkGaYC/AySEASZACGQAjgCEASZACGQAjgAAAAAZBmoAvwMkhAEmQAhkAI4AAAAAGQZqgL8DJIQBJkAIZACOAIQBJkAIZACOAAAAABkGawC/AySEASZACGQAjgAAAAAZBmuAvwMkhAEmQAhkAI4AhAEmQAhkAI4AAAAAGQZsAL8DJIQBJkAIZACOAAAAABkGbIC/AySEASZACGQAjgCEASZACGQAjgAAAAAZBm0AvwMkhAEmQAhkAI4AhAEmQAhkAI4AAAAAGQZtgL8DJIQBJkAIZACOAAAAABkGbgCvAySEASZACGQAjgCEASZACGQAjgAAAAAZBm6AnwMkhAEmQAhkAI4AhAEmQAhkAI4AhAEmQAhkAI4AhAEmQAhkAI4AAAAhubW9vdgAAAGxtdmhkAAAAAAAAAAAAAAAAAAAD6AAABDcAAQAAAQAAAAAAAAAAAAAAAAEAAAAAAAAAAAAAAAAAAAABAAAAAAAAAAAAAAAAAABAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAwAAAzB0cmFrAAAAXHRraGQAAAADAAAAAAAAAAAAAAABAAAAAAAAA+kAAAAAAAAAAAAAAAAAAAAAAAEAAAAAAAAAAAAAAAAAAAABAAAAAAAAAAAAAAAAAABAAAAAALAAAACQAAAAAAAkZWR0cwAAABxlbHN0AAAAAAAAAAEAAAPpAAAAAAABAAAAAAKobWRpYQAAACBtZGhkAAAAAAAAAAAAAAAAAAB1MAAAdU5VxAAAAAAALWhkbHIAAAAAAAAAAHZpZGUAAAAAAAAAAAAAAABWaWRlb0hhbmRsZXIAAAACU21pbmYAAAAUdm1oZAAAAAEAAAAAAAAAAAAAACRkaW5mAAAAHGRyZWYAAAAAAAAAAQAAAAx1cmwgAAAAAQAAAhNzdGJsAAAAr3N0c2QAAAAAAAAAAQAAAJ9hdmMxAAAAAAAAAAEAAAAAAAAAAAAAAAAAAAAAALAAkABIAAAASAAAAAAAAAABAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAGP//AAAALWF2Y0MBQsAN/+EAFWdCwA3ZAsTsBEAAAPpAADqYA8UKkgEABWjLg8sgAAAAHHV1aWRraEDyXyRPxbo5pRvPAyPzAAAAAAAAABhzdHRzAAAAAAAAAAEAAAAeAAAD6QAAABRzdHNzAAAAAAAAAAEAAAABAAAAHHN0c2MAAAAAAAAAAQAAAAEAAAABAAAAAQAAAIxzdHN6AAAAAAAAAAAAAAAeAAADDwAAAAsAAAALAAAACgAAAAoAAAAKAAAACgAAAAoAAAAKAAAACgAAAAoAAAAKAAAACgAAAAoAAAAKAAAACgAAAAoAAAAKAAAACgAAAAoAAAAKAAAACgAAAAoAAAAKAAAACgAAAAoAAAAKAAAACgAAAAoAAAAKAAAAiHN0Y28AAAAAAAAAHgAAAEYAAANnAAADewAAA5gAAAO0AAADxwAAA+MAAAP2AAAEEgAABCUAAARBAAAEXQAABHAAAASMAAAEnwAABLsAAATOAAAE6gAABQYAAAUZAAAFNQAABUgAAAVkAAAFdwAABZMAAAWmAAAFwgAABd4AAAXxAAAGDQAABGh0cmFrAAAAXHRraGQAAAADAAAAAAAAAAAAAAACAAAAAAAABDcAAAAAAAAAAAAAAAEBAAAAAAEAAAAAAAAAAAAAAAAAAAABAAAAAAAAAAAAAAAAAABAAAAAAAAAAAAAAAAAAAAkZWR0cwAAABxlbHN0AAAAAAAAAAEAAAQkAAADcAABAAAAAAPgbWRpYQAAACBtZGhkAAAAAAAAAAAAAAAAAAC7gAAAykBVxAAAAAAALWhkbHIAAAAAAAAAAHNvdW4AAAAAAAAAAAAAAABTb3VuZEhhbmRsZXIAAAADi21pbmYAAAAQc21oZAAAAAAAAAAAAAAAJGRpbmYAAAAcZHJlZgAAAAAAAAABAAAADHVybCAAAAABAAADT3N0YmwAAABnc3RzZAAAAAAAAAABAAAAV21wNGEAAAAAAAAAAQAAAAAAAAAAAAIAEAAAAAC7gAAAAAAAM2VzZHMAAAAAA4CAgCIAAgAEgICAFEAVBbjYAAu4AAAADcoFgICAAhGQBoCAgAECAAAAIHN0dHMAAAAAAAAAAgAAADIAAAQAAAAAAQAAAkAAAAFUc3RzYwAAAAAAAAAbAAAAAQAAAAEAAAABAAAAAgAAAAIAAAABAAAAAwAAAAEAAAABAAAABAAAAAIAAAABAAAABgAAAAEAAAABAAAABwAAAAIAAAABAAAACAAAAAEAAAABAAAACQAAAAIAAAABAAAACgAAAAEAAAABAAAACwAAAAIAAAABAAAADQAAAAEAAAABAAAADgAAAAIAAAABAAAADwAAAAEAAAABAAAAEAAAAAIAAAABAAAAEQAAAAEAAAABAAAAEgAAAAIAAAABAAAAFAAAAAEAAAABAAAAFQAAAAIAAAABAAAAFgAAAAEAAAABAAAAFwAAAAIAAAABAAAAGAAAAAEAAAABAAAAGQAAAAIAAAABAAAAGgAAAAEAAAABAAAAGwAAAAIAAAABAAAAHQAAAAEAAAABAAAAHgAAAAIAAAABAAAAHwAAAAQAAAABAAAA4HN0c3oAAAAAAAAAAAAAADMAAAAaAAAACQAAAAkAAAAJAAAACQAAAAkAAAAJAAAACQAAAAkAAAAJAAAACQAAAAkAAAAJAAAACQAAAAkAAAAJAAAACQAAAAkAAAAJAAAACQAAAAkAAAAJAAAACQAAAAkAAAAJAAAACQAAAAkAAAAJAAAACQAAAAkAAAAJAAAACQAAAAkAAAAJAAAACQAAAAkAAAAJAAAACQAAAAkAAAAJAAAACQAAAAkAAAAJAAAACQAAAAkAAAAJAAAACQAAAAkAAAAJAAAACQAAAAkAAACMc3RjbwAAAAAAAAAfAAAALAAAA1UAAANyAAADhgAAA6IAAAO+AAAD0QAAA+0AAAQAAAAEHAAABC8AAARLAAAEZwAABHoAAASWAAAEqQAABMUAAATYAAAE9AAABRAAAAUjAAAFPwAABVIAAAVuAAAFgQAABZ0AAAWwAAAFzAAABegAAAX7AAAGFwAAAGJ1ZHRhAAAAWm1ldGEAAAAAAAAAIWhkbHIAAAAAAAAAAG1kaXJhcHBsAAAAAAAAAAAAAAAALWlsc3QAAAAlqXRvbwAAAB1kYXRhAAAAAQAAAABMYXZmNTUuMzMuMTAw\"]","/storage-resolve/files/audio/interactive"];

const $scriptletArglists$ = /* 3692 */ "0,0,1,2;0,3,1,2;1,4,5,6;2,7,8,1,2;2,9,8,1,10;3,7,8,1,11;4,12,13,14;4,15,8,14;4,16,17,11;5,12,13,18;5,19,13,18;5,19,13,20;6,21,22;6,21,23;6,21,24;7,25;5,19,13,26;7,27;3,28,8,1,29;8,30;9,31,32;7,33;8,34;10,35,1,29;10,36,1,29;10,37,1,29;11;9,38,39;12,40,41;12,42,43;13,44,45;14,46,47;14,48,49;14,46,50;14,51,52;14,48,53;14,54,55,56,57;14,48,58;14,48,59;14,48,60;14,48,61;14,48,62;14,48,63;14,48,64;14,65,66;14,67,68,56,57;14,69,70,56,57;14,71,70,56,57;15,72,73;15,74,75;16,76;15,77,78;17,8,79;18,80;16,81;14,82,83,84,85;14,82,52,84,85;14,82,86,84,85;18,72;14,87,88,84,85;15,89,90;12,91,92;12,93,94;12,95,96;19,97;19,98,99;20,100,101;19,102,103;19,104;19,105;11,106;12,107,108;9,109,39;12,110,111;21,112,113;20,114,115;20,116,115;19,117;20,118;19,119;22,120,121,122;21,123,8,8,124,125;23,126,127,128,129,130;24,131,132;20,133;20,8,134;16,135;21,136,137;23,138,127,8,129,139;21,140,141;25,142,143,144,129,145;23,142,127,146,129,147;23,148,127,146,129,147;21,149,150,151;20,152;9,153,39;21,154,155;14,156,157,84;26,158,159;13,160,161,162,163;18,164;3,165,8,1,166;9,167,168;18,169;1,170;21,171,172;19,171,172;9,173,168;9,174,175;1,176,101;9,177,175;9,178,168;22,179,180;9,181,182;7,183;21,184;9,185,168;9,186,187;9,188,168;19,189;27;9,190,168;9,191,168;9,192,168;9,193,168;9,194,168;9,195,187;9,196,168;9,197,168;21,198;28,199;21,200;21,201;1,202,203;22,204,205;22,206,207,122;12,208;9,209,8;19,210;19,201;15,211,212;21,213;9,214,187;9,215,187;9,216,187;27,217,8,218;19,219;9,220,187;19,221;9,222,168;19,213;9,223,168;9,224,103;9,225,187;9,226,187;1,227,228,6;1,229,230,6;9,231,232;9,233,168;19,234;9,235,168;9,236,168;9,237,168;9,238,187;9,239,168;19,240;18,241;9,242,168;9,243,168;9,244,168;9,245,187;9,246,103;9,247,187;9,248,168;9,249,187;9,250,168;9,251,8;9,252,187;9,253,168;9,254,187;9,255,168;9,256,168;9,257,187;9,258,168;9,259,168;9,260,187;9,261,187;9,262,187;9,263,187;9,264,187;9,265,187;9,266,168;9,267,168;1,268,230;9,269,187;19,270;27,271,203;9,272,187;9,273,168;26,274,275;9,276,187;9,277,168;9,278,168;9,279,168;1,280,281;1,282,203;9,283,187;9,284,168;9,285,187;9,286,168;23,287,127,288,129,289;9,290,39;9,291,103;9,292,187;9,293,168;9,294,187;9,295,232;9,296,187;9,297,168;9,298,168;9,299,168;9,300,187;9,301,168;9,302,168;9,303,187;9,304,232;9,305,187;9,306,168;9,307,168;9,308,168;9,309,168;9,310,187;9,311,168;1,312,230,6;9,313,187;9,314,8;9,315,187;9,316,168;9,317,168;19,318;9,319,187;9,320,168;9,321,187;9,322,168;9,323,168;9,324,187;9,325,168;9,326,168;9,327,187;9,328,168;9,329,168;9,330,168;9,331,187;9,332,168;1,333,203,6;1,334,230,6;9,335,168;21,210;1,336,203,6;9,337,187;9,338,168;21,339;1,202,340,6;1,202,341,6;9,342,168;20,343;9,344,187;9,345,168;9,346,187;19,347;9,348,168;9,349,187;9,350,168;9,351,187;9,352,168;9,353,187;9,354,168;9,355,187;9,356,168;9,357,168;13,358,359;9,360,32;1,4,281,6;1,361,362,6;9,363,187;9,364,168;9,365,168;1,366,203,6;19,367;9,368,187;9,369,187;9,370,168;9,371,168;9,372,187;9,373,168;9,374,168;9,375,32;9,376,168;9,377,168;9,378,187;9,379,168;26,274,380;9,381,168;9,382,39;9,383,168;9,384,168;9,385,168;9,386,168;26,274,8,387,388;9,389,187;9,390,168;9,391,187;9,392,168;9,393,187;9,394,168;9,395,103;23,396,397,398,129,399;9,400,187;9,401,168;9,402,168;9,403,103;9,404,32;9,405,168;9,406,168;9,407,175;9,408,39;9,409,39;9,410,39;9,411,39;7,412;2,413,8,1,414;26,158,415;28,416,101;7,417,418;26,158,419;28,420,421;21,422;9,423,127;21,424;9,425,8;28,426;18,427;7,428;4,429,187,430;4,431,187,430;4,432,187,430;7,433,434;7,435;7,436;3,437,8,1,430;10,438,29;18,439;18,440;26,8,426;20,426;9,441,182;12,442,443;12,444;20,445;20,446;18,447;23,24,127,448,129,449;1,8,421;18,450;29,451;9,452,39;30;18,453;12,454;21,455;26,274,456;29,457;12,458,450;18,459;18,460;18,461;29,462;18,463;26,274,464;26,158,465;20,466,467;18,468;18,469;29,470;19,471;9,472,168;12,287,473;12,110,474;1,475,203;18,476;18,454;26,158,477;18,478;18,479;18,38;29,480;1,481,203;26,8,482;18,483;18,484;12,74,485;18,486;15,487,488;12,458,489;29,454;18,490;18,491;26,158,492;26,158,493;12,494,495;28,496;19,184;9,497,103;9,498,168;21,499;12,458,500;12,501,494;18,502;18,503;12,458,504;29,505;29,506;12,507,495;18,508;26,8,475;12,458,509;26,8,510;12,511,512;18,513;20,485;12,514,485;29,503;18,444;12,442,515;18,516;18,517;29,518;29,519;12,520,521;1,522,523;15,477,57;18,109;9,524,32;9,525,32;18,526;9,527,232;22,528;18,529;26,530,531;18,532;12,458,533;12,458,534;12,458,39;18,535;18,536;9,537,32;18,501;12,477,454;18,538;18,539;18,540;9,541,8;9,542,32;29,543;9,544,103;29,545;29,546;29,547;9,548,103;18,549;12,458,510;29,550;18,514;22,551,552,553;9,554,175;1;29,555;18,556;26,8,454;18,557;9,558,32;18,559;12,516;18,560;12,561,562;29,563;28,564;12,458,565;27,566;18,567;29,568;20,569;9,536,103;18,570;20,571;18,572;9,573,168;9,574,103;29,575;26,274,576;26,577,578;12,514,579;29,580;12,110,581;9,38,175;9,582,8;9,583,8;9,584,397;26,585;20,586;18,587;20,588,589;9,590,103;18,591;26,8,592;12,458,593;9,594,8;18,595;15,427,596;26,158,597;16,598;26,599;15,514,600;18,601;9,602,168;9,603,182;15,287,604;1,605,606;1,607,467,6;9,608,103;20,609,127;9,610,168;9,40,182;18,611;9,133,32;12,612,489;9,613,103;12,442,614;29,615;9,616,617;26,8,618;18,619;20,620,467;12,74,467;20,621,622;18,623;12,43,494;9,624,103;12,514,625;28,475;26,8,626;18,627;29,628;9,629,32;18,630;12,631;12,43,632;12,633,634;26,635,636;20,637;18,638;18,639;31,640;18,641;18,642;18,643;9,644,168;12,520,39;9,645,168;29,646;1,647;27,648;20,287,230;18,649;18,650;18,651;12,511,652;29,653;29,654;9,655,32;20,656,657;9,658,103;9,659,32;27,660,661;12,476,133;26,158,662;27,663,589;29,664;29,516;18,665;26,274,636;18,666;9,667,32;26,158,589;12,668,578;12,43;18,669;20,670;29,671;29,672;26,673,674;12,675,676;29,677;26,158,426;12,442,678;18,679;9,680,32;18,613;20,668,467;12,501,43;18,681;29,682;20,683;20,684;18,545;31,516;9,685,8;20,511,127;26,686,674;26,8,637;12,442,479;12,479,687;18,688;18,689;18,690;9,691,103;9,38,168;20,656,589;18,692;26,158,656;26,693,694;12,695,528;29,696;22,697,698;20,699,230;12,700,701;9,702,32;11,626;18,133;12,703;26,8,704;18,705;9,561,103;26,706,707;29,708;20,709,710;12,613;12,74,711;21,712;12,713,714;20,715,589;26,158,716;12,458,717;9,444,103;20,718;26,8,719;20,719;12,458,446;29,109;20,720,281;26,721,722;20,723,101;12,74,287;20,724,589;11,725;12,442,726;11,727;9,728,187;9,729,8;18,730;29,731;20,732,733;12,520,133;9,734,168;18,735;27,736,589;18,737;9,738,32;19,739;20,740;1,741,203,218;9,133,168;9,742,8;7,203,743;11,8,744;12,24,43;12,479;29,745;19,746;9,747,39;12,458,748;9,749,32;9,536,168;18,750;20,715,751;20,752;18,753;26,721,754;18,755;19,756;9,757,168;18,758;12,477,479;26,635,759;9,760,103;11,761;12,501,762;18,457;21,763;9,764,32;18,765;12,520,766;19,767;9,768,168;26,8,769;29,770;20,771,281;12,458,772;18,773;27,8,774;18,775;27,8,8,127;20,776;12,520,777;19,778;12,779,522;12,477;26,8,780;18,781;9,782,8;9,783,8;9,784,8;12,458,779;18,785;15,726,786;26,530,787;26,721,788;12,567,789;18,790;26,530,475;12,458,791;12,74,792;18,793;29,794;20,475,589;18,795;12,511,514;29,479;22,796,797;12,798;12,43,501;12,396,799;29,494;22,800,801;18,802;18,726;28,803,467;20,282,804;9,805,32;9,806,168;12,458,807;18,808;9,479,182;18,809;26,810,626;9,811,103;18,575;18,812;29,813;22,814,815;27,816,203;9,817,32;9,818,168;26,274,819;20,820,101;12,575;18,821;26,158,822;12,823;9,824,39;18,825;12,458,454;26,158,826;20,510,230;20,827,828;19,829;29,817;20,830,127;27,831;12,520,832;12,833,834;9,835,32;18,836;18,837;18,838;20,839,467;21,282;9,840,32;29,841;20,842;28,843,467;29,844;20,475;11,845,744;12,520,846;29,847;9,43,168;26,8,76;18,848;9,849,168;20,850,397;9,851,168;12,520,282;9,852,168;19,763;26,721,853;12,507,494;12,396,854;18,855;1,856,523;18,857;18,628;12,458,858;9,133,397;9,859,397;20,860;22,861;29,862;7,863,864;12,865,787;20,458;20,866,467;29,638;29,867;20,820;12,520,868;9,869,127;9,282,103;29,870;26,274,871;18,872;12,873,640;9,874,103;29,875;20,426,127;26,8,876;20,877;9,878,168;12,442,879;9,532,397;12,74,880;12,74,881;29,882;12,567,880;12,110,883;18,884;15,507,885;20,886,887;28,888;22,697,889;29,890;12,514,891;20,422;12,442,892;26,274,475;9,893,32;21,184,763;18,849;20,894,101;18,895;18,896;18,897;20,510;18,898;29,899;27,8,8,6;9,900,175;12,901;12,477,528;18,902;9,903,103;15,904,57;9,784,39;9,532,32;20,820,421;18,905;12,520,906;9,907,103;12,520,908;12,520,909;20,910,589;20,911,467;18,912;29,913;12,458,914;12,458,915;12,458,906;20,907;12,520,916;12,458,917;12,520,732;29,918;21,201,150,151;20,182,523;26,158,919;26,158,920;12,511,656;20,715,362;20,921,281;27,869;9,922,127;20,923,362;20,715,228;26,274,759;11,924;29,501;18,925;9,926,32;12,458,133;21,927;20,928;26,929,930;20,931;9,932,168;12,458,933;20,715,467;12,514,934;9,935,168;9,936,168;26,721,937;12,507,43;9,938,103;29,939;1,940;29,941;12,695,579;29,942;9,943,32;9,109,168;9,944,168;20,726,362;20,489;29,945;20,946;9,947,168;20,948,589;9,949,103;29,943;26,158,950;28,715,230;18,951;18,952;26,953,954;29,955;18,956;15,514,57;22,528,957;1,958;29,959;9,960,103;12,487,632;12,458,961;28,962,963;9,964,8;18,494;12,458,965;9,918,103;9,966,103;20,967;19,282;20,968;12,833,274;12,520,969;12,199,701;18,970;11,971,127;9,972,103;9,700,103;27,648,203;9,973,32;26,530,974;20,975,661;9,976,32;20,977;1,8,8,218;20,978,101;20,979,421;26,274,227;18,581;9,980,127;9,841,168;18,981;27,647;20,982;27,8,8,218;9,983,127;26,274,626;18,984;18,985;12,109;12,458,986;11,987;18,507;12,988,989;12,633,769;27,990,467;29,991;26,992,769;9,993,168;12,107,906;9,994,127;26,274,995;11,133,397,996;21,997;26,274;9,998,32;12,999;12,1000;12,1001;12,1002;26,721,1003;18,1004;20,1005,397;11,1006;12,862;18,1007;11,1008;9,1009,168;18,1010;18,1011;20,1012;9,1013,168;28,1014,467;26,635,1015;9,1016,32;18,238;12,442,787;12,726,1017;29,1018;9,510,32;18,1019;12,833,1020;18,477;9,1021,8;9,1022,8;9,1023,32;15,43,57;18,913;20,1024;12,520,1025;12,43,628;12,1026,475;20,1027;19,1028;22,697,1029;19,1030;20,969,589;15,110,57;18,1031;26,721,1032;20,1032;12,458,777;20,904,467;9,1033,127;9,1034,103;9,1035,103;9,1036,32;18,1037;20,133,1038;26,1039;18,1040;20,1041;20,182;12,514,1042;12,74,1043;18,1044;18,1045;18,1046;12,633,637;29,1047;9,1048,617;18,1049;12,514,1050;12,110,1051;18,1052;9,1053,103;9,1054,103;9,1055,182;15,520,1056;9,1057,103;9,1058,32;1,958,467,6;29,1059;18,787;11,1060;18,1061;21,184,1062;20,426,622;12,520,1063;12,514,1064;12,520,1065;29,1066;18,732;12,833,656;11,455,397;18,1067;18,1068;26,455,769;28,1069,467;20,524;12,396,41;9,1070,32;9,1071,32;20,1072;18,555;18,1073;26,158,1074;26,1075,475;18,1076;9,1077,103;12,521,797;18,1078;18,77;9,1046,168;18,1079;31,1080;18,1081;29,1082;9,1083,103;29,1084;9,1085,397;31,282;22,1086,1087;12,76,883;12,1042,883;29,1088;9,109,32;20,1089;11,282;9,1090,397;18,1091;29,1092;20,1093;9,1094,103;12,479,697;18,1095;12,1096;12,833,1097;9,1098,175;12,695,1099;12,107,1100;20,1101;21,1102;12,442,39;20,1103;29,1104;29,1105;26,721,1106;29,1107;12,458,879;12,1108,969;12,514,969;18,1109;12,520,1110;11,1111,744,996;29,133;9,1112,103;29,1113;26,1114,1115;12,458,1116;20,715;18,1117;7,1118;28,1119;12,107,1120;18,1121;12,514,592;18,1122;9,1123,103;20,879;15,415,1124;20,1125;18,1126;20,1127;20,1128,589;21,1129;9,964,39;12,554;26,8,1130;18,817;22,1131;18,1132;12,628,581;12,1133;21,1134;18,1135;20,1136;9,1137,8;26,953;9,271,103;29,1138;20,1139;28,1139;26,274,1140;18,1141;12,1142;12,514,1143;26,8,489;18,1144;28,553,751;28,1145;9,1146,39;12,517,1147;26,158,1099;12,520,1148;20,1149;9,1150,103;29,1151;20,805;20,8,397;26,8,1152;9,470,103;20,39;20,918,397;12,458,1153;29,920;12,458,1154;12,442,1122;20,817;9,1155,8;18,1156;9,1157,168;18,1158;12,442,133;27,1159;1,1159;18,1160;12,507,1161;20,656;26,8,1162;9,109,103;12,904,1120;12,442,1012;27,1163;9,1164,127;20,1165;19,201,150;18,1166;20,1167,589;28,769;28,777;18,1168;7,1169;27,8,203,127;9,536,175;20,1005;26,274,787;12,458,74;12,520,1170;12,458,282;12,442,777;12,458,1171;12,110,637;12,458,107;9,1172,103;19,1173;9,1174,187;19,1175;9,1176,32;15,1177,1178;4,1179,1180,1178;7,1181;9,1182,39;9,1183,168;9,1184,168;26,1185;7,417,1186;20,1187,657;20,1188;12,1189;12,74,1190;12,1191;26,1075,1116;18,1192;12,458,1193;20,1194,127;20,656,1195;26,158,39;9,1196,32;26,721,1095;9,1197,187;26,158,769;20,1198;26,721,479;12,458,1199;12,520,1200;9,1201,103;9,422,182;12,514,133;19,1202;27,1203,467;20,1204,127;18,939;28,1069;28,797;26,1205;18,1206;12,458,479;18,1207;9,1208,32;20,609,887;9,1209,103;9,1210,103;9,1211,32;9,282,182;11,1212;12,1213,787;32;29,1214;12,873,879;12,458,1215;22,1216;31,752;26,274,1217;18,1077;12,458,1218;12,110,494;12,458,477;26,274,8,387,1219;20,1220;19,422;9,1221,168;18,900;18,1222;9,1223,103;12,849;12,1224;22,697,1225;22,697,1226;22,697,1227;12,110,1228;18,1229;18,1230;12,507,1231;26,8,446;26,856,578;20,1232;15,902,1233;9,1234,182;20,769;12,668,366;18,1235;18,1236;22,861,1237;12,511,834;20,1238,101;12,287,1239;12,458,1240;20,1241;26,8,282;18,1136;12,458,1242;29,1243;26,274,1244;9,1245,103;20,1154;26,158,1246;28,422;9,1247,103;20,1248,467;21,1249;9,1250,32;12,458,1165;12,442,1165;20,1251;7,1252;20,1248;26,158,1253;9,1254,103;9,1255,103;12,477,133;20,920;12,520,656;9,1256,32;18,1191;18,1257;18,1258;12,514,1259;9,454,39;18,1260;9,1261,182;12,511,1262;12,442,274;9,1263,103;12,494,488;20,823;26,8,479;20,1264;11,1265;20,1266;27,663,203,6;18,1151;9,1267,182;9,422,175;9,1268,39;18,1269;11,1270;20,1271;20,701;9,109,182;26,721,879;9,1272,397;18,1273;18,521;9,1274,32;18,1275;18,1276;20,732;18,1277;26,158,1165;7,1278;26,1279,1280;1,1281,203,6;12,1282;20,1283,127;20,282;12,458,1284;26,1285,1286;26,721,817;15,628,57;1,8,421,127;18,480;18,1287;9,1288,103;18,1289;11,1290;22,1291,1292;12,511,1165;12,511,1293;12,511,509;12,833,817;28,946;9,972,32;29,1294;9,1295,39;13,1296,1297,1298,1299;18,1300;27,856,203,218;20,732,589;23,1187,127,1301,129,1187;9,1302,175;13,427,1303;27,736,203,218;9,1304,127;1,1305,203,6;27,1306,203,6;27,1307,203,218;1,1308,203,218;18,1294;27,856,203,6;26,1309;26,823,1310;31,1311;7,1312;1,1313,203;9,1314,103;12,511,1315;12,549,649;12,477,422;7,1316;7,1317;7,1318;31,1319;20,1320;21,1321;12,1322,1323;20,1324;21,201,8,1325;9,1326,175;12,1322,946;21,1327;26,158,1328;12,511,1323;12,511,282;11,1329;9,1330,103;18,1331;22,1332,1333;22,1332,1334,122;22,528,1335,122;9,1336,103;22,1337,1338;26,823,1339;21,1340;27,831,203,6;18,1000;18,1341;15,287,1342;27,1307,203,6;1,1343,203,6;27,736,203,6;26,721,704;20,1199;18,1344;26,158,1345;31,817;22,697,1346;26,721,1347;26,721,820;20,475,101;29,1348;22,1291,8,122;11,1349;9,795,39;19,787;29,1350;26,8,578;9,1351,168;1,1352;9,1353,32;9,1354,168;9,1002,168;26,1355,636;26,1356,1357;1,8,203,1358;25,494,1359,32;29,1322;15,427,1360;18,1361;27,1307,467,6;27,1307,1362,6;26,274,1040;12,514,1347;22,1363,1364,122;18,1001;27,1033,203,6;26,1355;20,1330;21,1365;9,1366,103;26,1367,1368;9,732,1369;19,1370;12,1371,1372;26,721,620;20,912;27,1373,203,6;1,1116,203,6;31,426;18,1374;21,1375,1376;27,856,203;1,856,203;26,158,1377;18,1378;22,528,1379;31,974;15,520,817;11,8,1038;1,856,203,6;11,1380;11,1381;9,1382,182;11,1383;1,1116,203;20,1384;21,1385;11,455,744;20,8,589;20,455,467;9,1386,127;11,1387;31,1388;26,721,1389;22,528,1390;18,1391;23,1392,127,1393,129,1075;26,274,1394;26,274,8,387,1395;18,1328;18,1396;21,1397;19,1398;31,422;21,1399;11,1400;27,8,203,218;1,8,203,218;21,422,1401;12,24,1402;13,1403,1404;9,1405,187;20,1406;26,274,489;26,274,1407;20,1408;12,668,1409;26,274,514;9,1410,39;26,721,454;21,1411;21,1412;33,1413,1414,1063,1069,1415;27,663;9,1416,103;24,936,1417;22,697,1418,122;26,274,1419;27,663,467,6;21,1420;26,823;1,8,622;12,74,981;15,695,817;9,1421,1299;27,663,467;1,958,467;12,22,107;21,746;28,1329;12,24,1042;28,1422;12,514,817;15,520,1423;3,1424,8,1,1425;11,1426;19,1134,150;27,1427,203;9,282,1428;9,1429,127;9,1430,32;21,1431;21,1432;20,1433,657;26,274,1434;26,274,454;14,873,1435;26,721,1436;12,514,1436;20,1437,101;20,1438,744;20,1438;9,1439,168;20,229,744;9,1440,32;20,1441;18,1442;15,110,891;15,107,1443;15,107,1444;15,107,1445;12,74,1446;9,1447,187;9,1448,168;12,1449;7,1450;25,43,143,8,129,1451;26,274,578;12,43,1452;25,43,143,8,129,1453;29,849;12,458,578;12,42,1108;26,8,1454;12,74,625;12,1455,625;12,514,1456;12,514,1457;12,514,625,1458;14,82,1459,56,1460;12,549,1461;18,1462;11,1463;18,1464;26,8,576;20,1465;15,514,1466;9,1467,8;18,1468;29,1469;28,455;9,1470,39;20,1099;29,1471;12,110,1472;12,24,989;12,1473,989;26,8,989;12,110,989;12,507,1474;15,107,1475;12,24,1108;12,1476,989;15,415,1477;12,1371,1478;18,1479;18,1480;12,1108,24;12,1108,989;12,1026,41;12,415,989;12,501,1481;15,107,1482;12,110,1483;19,1484;15,581,1485;12,42,43,1458;12,76,1486;12,40,1487,1458;12,521,1488;12,1476,1489;15,479,1490;12,22,41;12,511,1491;26,635,1492;11,1493;9,1494,232;20,1495;15,695,1496;26,1497,4,387,1498;9,1499,103;9,1500,1501;9,1502,168;26,158,1503;27,1307;11,1504;9,1505,32;26,8,1506;20,1187;20,512,589;31,1507;12,514,1507;31,1508;26,158,946;15,668,1509;18,1510;14,873,1435,56;20,1511;29,1512;12,1168,1012;12,1168,1012,1458;26,158,1513;20,488;21,1514,150,1376;19,1514,150;26,721,1515;14,46,1516,84,1517;9,1518,32;12,514,837;12,514,1519;18,1520;9,1519,168;8,1521;8,1522;12,514,1523,1458;9,1524,103;26,1525,1165;12,1519;9,1526,39,1298,1527;13,1528,1529;9,1530,103;9,1531;17,579,1532;8,1533;8,1534;34,1535;21,1536;20,1537;20,1538;20,1539;20,1540,230;23,1541,397,8,129,1542;19,1543;9,1544,168;9,1545,168;7,1546;23,1541,397,1547,129,1548;23,1541,397,1549,129,1548;31,1550;17,579,1551;23,1541,127,1552;9,1553,103;20,4,101;23,520,127,1554,129,1555;14,1541,1556,84;26,158,1537;12,514,1557;9,1126,168;9,1558,397;7,1559;9,1560,32;9,1561,32;9,1560,32,1298,1527;9,1561,32,1298,1527;35,1562,1,1563;17,579,1548;9,1564,32;9,1565,127;9,1566,39;12,1567,1568,1458;9,1569,32;27,1570,203,6;9,1571,175;29,1572;18,1573;22,683,1574;9,1575,182;9,1213,182;25,1576,1577,8,129,786;15,1578,475;13,1579,1580;9,1581,397;15,514,1582;26,158,1583;9,1584,127;12,458,507;31,199;1,1585,203,6;12,1586;18,1587;21,184,1588;2,1589,8,1,1590;26,721,1591;2,1592,8,1,1593;9,1594,103;9,1595,103;12,1213,1596;12,833,1597;2,1598,8,1,1599;2,1600,8,1,1601;21,1602;28,446;9,1603,32;7,1604;7,1605;26,274,1606;20,1540,281;36,1607,1,1608;21,1609,1610;20,1611;9,1612,32;9,1613,39;26,274,1614,387,1301;9,1615,103;20,8,887;20,1616;23,520,127,1617,129,1618;21,1619;20,1620;26,274,768;20,768;26,158,1621;26,8,1622;26,721,1623;9,1624,103;20,1625;9,1626,32;7,1627;12,511,1005;26,721,1005;7,1628,1629;37,1630,8,1631;3,282,1632,1,1633;7,1634;7,1635;38,1636,1637;11,1638;12,74,133;12,514,1639;12,633,427;11,1640;8,1641;12,833,1642;9,1643,232;15,74,477;26,1644,1645;13,1646,1647;2,282,8,1,1648;9,1649,32;9,1650,103;21,1651;15,514,1652;11,626,397,996;12,833,1653;20,1621;12,833,1040;9,1654,39;23,138,1655,1656,129,1657;11,1658;26,274,74;26,274,1659,387,1660;9,1661,175;20,1662;9,1663,32;12,442,415;12,511,879;9,1664,32;18,1665;12,520,1666;18,1667;27,1668;1,1669;20,1670;28,1670;9,1671,182;20,820,467;26,158,1672;20,1673;20,913;20,1674,127;12,520,422;12,494,1675;31,446;20,442;26,530,1676;12,695,777;12,458,1677;12,396,581;20,455;28,133;22,861,1678;1,736;26,721,1679;12,507,1680;9,1681,397;9,1682,32;9,1683,32;12,514,495;9,1684,182;12,458,1685;18,1686;9,1687,32;9,1688,32;20,918;18,1677;18,1689;18,1690;18,1691;12,822,107;9,1692,127;9,1693,32;20,1694;20,1695;12,458,1248;31,879;20,1696;12,458,1697;15,458,1477;9,1698,182;12,567,521;15,1699,1700;15,514,1701;26,158,579;31,1702;12,458,1703;12,633,1704;12,458,1705;9,1706,168;9,1707,168;21,787;29,1708;11,1709;13,1710,1711;20,1712;12,477,426;12,520,1713;12,873,1714;9,1715,617;20,1215,467;18,1716;26,8,1717;9,1718,39;9,1719,168;27,736,203;20,1191;12,287,426;26,158,1063;18,1713;12,458,1720;12,581,1721;9,1722,32;26,8,1723;18,1724;9,1725,187;9,1726,103;9,1727,397;9,1728,187;9,1729,187;9,1730,397;7,1731;9,1732,168;12,74,1733;18,1734;26,721,133;31,719;9,1735,103;9,1736,39;20,1639,887;9,1737,168;28,752;9,952,32;19,1738;29,1739;20,1740;18,1741;29,1742;20,1743;20,1744;20,1745;12,477,1746;9,1747,617;27,1748;29,1749;9,663,127;12,458,1750;15,110,920;20,1751;9,501,168;18,1752;12,477,1753;9,1754,8;18,949;20,1645;20,1755;18,1756;18,1757;18,1042;12,110,1269;20,837;20,1758,887;20,1759,101;20,1760,467;18,1150;15,107,1761;7,1762;20,1639;26,1525;22,697,1763;20,1764;20,1765,467;26,158,1766;20,1767;22,528,1768,122;9,1769,168;20,1770;18,1771;12,480;1,1772,1773;22,1774,1775;18,1776;20,1777;12,1018,1778;7,1779;26,274,1454;27,1780,467,6;9,1781,8;7,1782;7,1783;37,1784,8,1631;7,1785;9,1786,168;9,1787,103;20,1788;18,1789;27,8,8,1790;1,8,1791,127;28,1639;22,697,1792,122;20,1793,421;26,721,489;12,1794;26,721,43;12,520,1301;26,8,1795;22,528,1796;11,1797,397;18,1798;26,1799;18,1800;18,445;9,1801,32;9,1802,168;9,1803,103;20,1804;12,1805;12,458,1806;29,1573;31,489;26,810,494;20,1807,710;9,1808,103;9,1809,103;29,1623;18,1810;12,1811,1812;18,1813;18,1814;18,1815;12,507,1816;9,1817,39;12,396,1818;12,1819;29,561;20,1820;19,1821;13,1822,1823;13,1824,1825;9,1826,32;9,1827,32;26,8,1828;15,74,817;9,426,127;18,1829;28,1830,467;12,507,1831;29,1832;9,507,175;26,274,1833;12,1834;9,1835,32;9,1836,32;12,442,282;12,695,344;1,1837,1838;9,1839,168;18,1840;18,1841;26,1644;26,8,1842;15,107,8;9,1076,103;12,477,22;28,520,421;15,442,1012;7,1843;12,514,1844;9,1845,8;9,1846,127;26,274,1224;20,22;15,24,1847;12,110,640;21,1848;12,520,817;26,158,901;12,442,1200;20,1849;21,1850;26,721,1851;9,1852,168;12,581,1853;15,981,57;18,629;12,458,1670;25,43,1854,1855;7,1856;21,1857,8,1858;15,849,1859;22,1860,1861;12,514,1714;26,1862,1863;27,1864;26,823,227;26,823,1865;12,494,769;9,1866,103;9,1867,168;12,442,906;38,1868,1869;7,1870,1871;37,1872,8,1873;21,1874;12,507,488;20,1875;15,567,8;18,1876;20,1877;18,854;15,567,1878;18,1879;27,475;15,904,477;26,721,769;20,1880;27,1881;12,494,43;18,907;18,1882;29,1883;9,1884,168;9,1885,397;9,1886,8;19,1887;21,1887;20,8,281;18,1572;12,726,1888;26,1075,39;12,1889;27,1890;18,1891;26,1892,1893;22,697,1894;1,1895;12,22,1896;12,520,1897;19,1898;12,833,422;27,1899;27,1900;22,1337,1901;12,458,609;26,1075,604;26,274,1902;1,1903,281;12,22,1904;18,1905;22,1086,1906,1907;19,184,150;39,1908,1,1909;2,1910,8,1,1909;7,1911;27,1912;28,1913;27,1914;12,514,1915;9,1222,168;20,1916;20,1917;27,1918;21,1919;12,520,1920;21,1921;18,24;27,1748,1922,1923;7,1924;18,1925;12,567,516;12,1926;9,683,168;9,1927,168;12,514,1928;15,110,488;1,1929;20,1930;21,1931;9,1727,1932;9,1933,39;20,973;12,514,443;15,514,1934;12,487,640;9,1935,127;26,810,1936;20,1937;26,274,1300;2,1938,8,1,1939;27,1940;27,1033,203;20,1941;15,849;20,1134;26,158,912;26,1075,1942;18,1943;18,563;27,1944;12,458,422;11,1945;21,1946;22,1947,1948,122;40,184,1949;9,1950,187;9,1951,168;20,1952;28,1953;21,1954;12,520,1955;15,1956,1957;12,833,1958;20,1959,589;9,1960,32;1,475,228;1,820,733;15,110,8;9,1961,32;15,107,1847;27,1962;15,458,57;18,1963;19,1964;20,1965;9,1900,127;15,110,786;15,74,282;15,107,57;9,1929,175;18,1883;26,1966;18,1967;9,1968,397;12,514,426;12,511,488;15,1969,1970;12,1971;15,1972,415;11,1973;1,1974,1773;15,487,786;1,1820,203;9,1975,168;20,1414,230;15,22,57;22,528,1976;19,455;12,1168;11,455,127;21,1712;12,520,1026;12,520,476;9,1977,168;21,226;20,1978;12,458,22;12,520,604;19,1979;26,158,1980;18,561;7,1981;7,1982;29,1168;26,158,1983;19,1984;12,477,797;12,514,1985;18,1986;15,1064,477;18,23;15,514,891;20,1987;19,1712;12,695,1988;22,697,1989,122;22,1990,1991,122;19,1992;22,1337,815;27,736,8,218;9,1993,232;22,1337,1994;12,458,1995;1,1996,230;26,158,578;12,287,475;18,1997;26,274,1998;9,1999,103;1,2000,203;1,2001,203;9,2002,127;12,2003;12,521;15,22,786;18,2004;12,520,879;21,2005;19,2006;12,74,2007;1,2008,203;9,2009,168;9,2010,103;20,2011;41,184,163,1376;26,721,1620;26,8,2012;12,633,752;26,1075;18,2013;12,2014;12,107,1005;12,442,1955;9,2015,32;9,2016,32;26,8,2017;1,2018,228,218;9,2019,103;9,2020,8;26,1185,8,387,2021;28,2022;15,110,475;9,2023,187;9,2024,103;27,2025;31,133;12,511,787;20,2026;1,663;12,2027;12,110,507;7,282;38,2028,2029;1,2030,467,6;21,184,150,151;21,2031;20,2032;26,158,2033;22,2034,2035,122;9,2036,168;27,736;15,477,2037;21,2038;1,446,523;18,2039;29,2040;7,2041;12,458,2042;18,2043;20,2044;15,514,2045;27,1281;9,2046,32;12,199,2047;12,458,817;20,2048;27,1414;9,282,39;9,1019,39;18,2049;12,76,495;12,442,1917;12,514,2050;20,2051;12,507,1012;9,109,617;9,2052,39;21,2053;19,2054;9,2055,397;18,2056;18,2057;29,2058;20,2059;9,949,168;12,873,494;11,2060;26,2061,1936;12,833,2062;9,2063,168;20,2064;9,2065,39;9,2066,103;11,2067;28,282;18,2068;12,458,2069;18,2070;1,2071,203;29,1037;18,2072;28,2073;22,528,8,122;29,2074;26,426;9,2075,103;18,2076;12,514,2077;27,2078;12,521,2079;20,715,2080;1,1367,230;12,507,640;9,2081,103;18,2082;19,2083;26,274,2084;19,1349;18,1254;21,2085;18,2086;18,415;20,697;15,487,2087;18,2088;18,2089;12,1476,787;18,2090;31,787;12,110,2091;12,567,2092;12,396,1051;27,2093,887,218;12,520,946;15,514,1477;18,2094;18,2095;12,458,2096;12,514,454;27,2097;12,2098,701;9,2099,103;12,2100;20,2101;19,1514;12,458,2102;15,514,2103;20,1540;12,2104,133;18,2105;9,2106,103;21,2107;23,2108,127,2109,129,2110;21,422,2111;12,2112;9,2113,32;9,2114,168;1,2115,589;22,697,2116,122;26,721,684;7,2117;12,2118,1126;20,182,744;27,1033;29,877;9,2119,175;12,2120;26,274,2121;9,787,39;12,514,879;20,8,101;20,592;1,4,230;21,2122;23,2123,127,168,129,592;9,2025,127;11,2124;18,2074;29,1734;12,520,2125;9,1213,8;9,2126,103;7,2127;7,2128;2,2127,8,1,2129;37,2130,8,1631;37,2130,8,2131;12,24,2132;26,274,2133;26,158,133;19,1321;19,2134;26,8,110;26,721,2135;9,2136,127;19,2137;18,527;12,43,2138;20,652;28,2139;12,458,2140;12,514,1099;22,697,2141;20,1414;9,2142,127;27,663,203,218;20,2143;20,2144,281;11,2145;22,1337,2146;22,1337,2147;12,2056;9,2148,103;9,2149,127;7,2150;15,854;21,2151;22,2152,2153;22,2152,2154;22,2152,2155;22,2152,2156;26,158,581;26,158,509;26,8,920;28,2157;26,8,2157;26,8,2158;9,2159,39;29,2160;20,2161;15,458,2162;9,2163,168;21,2164;7,2165;7,2166;20,2167;9,2168,127;12,2169,787;26,8,1154;31,2170;23,287,127,168,129,133;20,820,281;21,2171;9,2172,168;9,900,168;28,1199;9,2173,32;12,732;21,2174;22,1337,2175;9,2176,32;29,2177;20,178;9,2178,232;26,274,2179;9,2180,103;9,2181,168;9,2182,32;1,2183,228;29,2184;26,823,902;18,2185;23,138,127,2186,129,2187;27,869,8,218;19,2188;20,1760;12,2189;18,1347;26,721,2190;9,2191,2192;22,683,2193,122;22,697,2194,122;21,2195;21,2196;12,442,1154;20,2197;20,274;12,567,107;5,2198,2199,2200;20,2201;9,2202,103;34,2203;20,2204;20,2205;11,2206;15,514,2207;26,8,2208;12,458,2209;28,2210;12,458,981;20,454;20,2211;20,2212;12,442,178;21,2213;9,831,127;9,2214,168;14,873,2215;15,833,1970;15,1665,57;15,1473,817;7,2216;7,2217;12,549;20,2218;7,2219;31,2220;12,1734;20,2221;12,514,2222;38,2223,2224;12,1108,1877;9,2225,32;9,2226,32;20,620;11,2227;27,2228;31,507;9,2229,103;12,43,2230;1,2231,2232,6;20,1199,887;9,2233,32;9,2234,103;21,2235;9,973,168;7,2236;26,2237;21,2238;29,855;26,721,2239;9,2240,232;26,721,184;9,2241,32;31,1165;27,2242;42,2243,127,2244;23,2245,127,2246,129,2247;1,2248,203;27,2249,203;20,2250;12,514,489;9,2251,32;26,158,787;29,2252;29,2253;7,2254;29,2056;12,458,536;20,2255;20,1199,828;18,2256;27,2257,203,6;20,440;15,43,2258;12,514,274;9,1986,168;26,721,2259;9,2260,103;15,287,2261;26,274,2262;12,507,22;11,2263;20,2264;22,528,2265,553;11,2266;22,477,2267;20,640;15,74,2268;18,2269;22,528,2270;26,1075,2271;20,2272;9,2273,232;26,721,2274;20,2275;20,1196;20,2276;15,43,873;21,2277,2278;20,2279;20,2280;9,2281,127;9,2282,103;20,512;12,833,2283;15,2284,2285;18,2286;29,611;9,837,103;29,2287;9,2288,2080;27,475,203,6;12,2289,426;15,2290,2291;26,158,520;28,891;9,875,168;15,981,2292;20,2293;12,511,1171;18,1406;20,2294;18,1295;29,2295;29,2296;22,697,2297;7,2298;18,2299;13,427,2300;9,2301,103;13,2302,2303;14,2304,2305;27,736,467,6;9,2306,39;9,2307,39;9,2308,39;23,833,127,2309,129,1356;1,2310,203;19,2311;9,2312,397;9,2313,397;20,2314;12,633,458;20,604;15,514,817;22,528,2315;9,2316,127;29,2317;11,2318,397;26,721,2319;9,2320,127;20,2321;20,2322;16,2323;20,2184;9,2324,168;20,2325;9,2326,103;20,2327,2328;9,2329,187;9,2330,187;21,2331;20,868;26,274,2332;20,2333;20,109;9,2334,744;18,2335;18,366;9,2336,2337;20,2338;20,2339;9,2340,168;19,2341;29,736;12,287,133;12,42,475;12,520,2342;29,2343;28,2344;9,2345,168;9,2346,187;33,2347,1069,1415;33,2348,1069,1415;7,2349;2,2349,8,1,2350;21,2351;2,2122,8,1,2352;9,2353,32;9,2354,32;9,2355,32;3,2127,8,1,2129;37,2356,8,2357;20,1820,710;11,8,397;26,274,2358;28,2359;15,494,2360;15,487,458;31,2361;21,2362;26,721,1807;16,455;9,153,182;7,2363;19,2364;5,2365,2366;38,2367,2368;9,2369,2192;9,2370,168;12,442,2371;26,158,2372;9,2373,2374;26,274,2375;7,2376;23,2377,127,39,129,2378;18,2379;9,2380,168;26,635,2381;12,494,2382;12,833,879;15,514,604;1,2383,203;27,2384,203;9,2385,32;22,528,2386,122;26,274,2387;21,2388;9,2389,168;26,158,4;9,2004,168;20,2390;26,158,668;12,514,2391;22,528,2392;29,2393;31,509;29,2084;9,2394,32;9,2395,32;7,2396;2,2396,8,1,2397;12,521,2398;26,1032;9,2399,168;20,1672;9,2400,32;27,446,467,6;12,1396;9,2401,127;1,2402;20,2403;20,2404;20,2405;37,2406,2407,1631;7,2408,2409;18,2410;12,2411;2,2412;7,2412;28,906;12,511,22;9,2413,187;27,2414;21,2415;2,2416,8,1,2417;37,2418,8,2419;7,2420;9,2421,617;12,521,2422;18,2423;12,458,787;12,726,1042;12,2424;20,2425;22,683,2426,122;22,697,2427,122;15,477,2428;9,2429,103;9,2430,175;4,2431,2432,2433;9,2434,127;9,2435,127;9,2436,397;9,2437,8;20,2438;15,74,2439;18,2440;26,158,2196;21,2441,2442;22,697,2443,122;12,514,40;14,22,2444;15,287,2445;19,2446;19,2151,2447;9,2448,39;3,2449,8,1,2450;3,2451,8,1,2452;3,2453,8,1,2454;3,2455,8,1,2456;3,2457,8,1,2458;11,2459;9,2460,2192;18,43;20,777;9,2461,1369;9,2269,32;29,2004;9,2462,168;29,1351;9,2463,127;12,511,2464;21,746,150,151;12,22,133;20,2465;21,2466,150,1376;26,721,2467;12,1378;12,458,2468;1,2337,203,6;19,2469;29,2470;21,2471;9,2472,168;9,2473,32;37,2474,8,1631;20,2475;29,153;12,833,2476;27,1837;20,1828;1,2477,467,6;29,1150;27,8,467,6;1,663,203,6;12,458,2478;26,158,282;19,746,150;28,2479;12,40,1492;9,2480,32;26,274,2481;20,2482;1,2483,733;21,2484;22,697,2485,122;11,2486;28,2487;21,2488;21,2489;20,8,2490;20,2491;2,2492,8,1,2493;12,521,2494;9,2495,8;26,274,4,387,2496;19,2497;21,2497;1,769,203;20,759,127;18,2498;12,24,41;9,2499,103;12,703,2102;9,2500,103;18,2501;12,458,2403;9,2502,103;19,2503;26,635,981;19,2504;21,2504;19,2505;7,2506;7,2507;20,2508;27,2509;21,2510,150,1376;15,43,2511;9,1410,168;21,2512;9,2513,168;9,1421,103;9,2514,103;9,2515,127;9,2516,103;9,2517,168;21,2518;7,203,2519;21,2520;37,2521,8,2522;9,542,168;9,2523,232;12,458,528;21,2524,2525;9,2526,168;26,274,820;12,458,2527;2,2396,8,1,2528;9,2529,39;9,2530,127;7,2531,417;9,2532,2533;15,442,2534;20,2535;20,2536;18,2537;9,2538,103;9,2539,397;9,2540,32;12,458,1032;43;26,8,1645;15,833,1165;9,1925,8;12,873,475;12,24,2541;31,2542;20,2543;18,2544;19,422,150;27,2545,467;1,663,203;20,1187,589;7,2546;9,2547,168;27,1837,203,218;27,663,203;12,458,2548;12,1145,2549;15,22,2550;9,1690,168;20,2551;26,274,2552;18,1808;20,1221;9,2553,232;23,520,127,182,129,2554;26,158,2555;28,2556;20,1677;12,442,1655;9,2557,103;31,495;7,2558;20,2559;15,396,786;9,2560,103;19,2561;9,2562,168;23,520,127,182,129,1154;21,184,2563;12,520,2220,2564;12,833,2565;20,2566;29,2567;9,2568,127;11,2569;26,274,981;20,2570;18,2571;9,2572,397;7,2573;9,2574,103;21,184,8,151;1,1837,467,6;12,442,2575;7,2576;7,2577;7,2578;12,1145,2579;21,2580;20,2581;20,2582;20,2583,710;20,2584;26,721,2585;26,721,426;26,1525,2586;7,2587;7,2588;7,2589;5,2590,8,2591;5,2592,8,2593;5,2594,8,2595;5,2596,8,2595;5,2597,8,2598;5,2599,8,2600;2,2601,8,1,2602;12,514,41;1,1033;2,2603,8,1,2604;9,2605,168;9,2606,127;25,2607,143,2608,129,2609;9,2610,2611;12,1145,2612;20,2613;9,2614,168;23,287,127,2615,129,2616;26,158,2617;9,2618,2619;20,2620;20,2621;21,2622;2,2623,8,1,2624;20,2259;20,2625;15,520,2626;9,2627,8;34,2628;19,2629;27,2630,8,6;9,2631,39;9,1244,39;2,2632,8,1,2633;21,2634;22,1337,2635;26,274,592;11,2636;12,1819,2637;12,511,1807;12,1476,2638;20,1807;20,38;9,2639,32;9,2640,127;20,2641;12,348,133;26,274,2642,387,2643;38,2644,2368;9,2645,39;21,2646;29,1410;2,2647,8,1,2648;9,1019;2,2649,8,1,2650;26,274,2651;12,520,2652;11,2653;20,514;22,528,2654,553;22,528,2655,553;26,274,969;26,721,2656;12,833,2657;18,1998;7,2658;13,2659,2660;18,2661;12,520,2662;12,520,1032;11,2663;26,721,22;9,2664;7,2665;31,2666;7,2667;12,1018,2668;21,2669;28,592;11,2670;1,8,421,6;11,2671;12,74,2672;9,2673,32;13,2674,2675;22,528,2676;20,2677;9,445,32;28,440;26,274,2678;18,2679;12,567,2680;11,2681,744,996;7,2682;7,2683;9,2684,103;26,274,2685;21,2686;15,514,2687;11,2688;12,2689,2690;28,72;15,514,2691;9,2692,187;15,520,57;9,2693,397;9,2694,397;21,2695;9,2696,187;18,2697;9,2698,168;12,74,520;11,2681;26,721,536;11,2699;26,274,2700;11,2701;26,158,604;23,668,127,2615,129,2702;23,668,127,2703,129,797;26,721,1927;7,2704;26,721,928;12,833,787;26,274,2705;12,833,820;2,2706,8,1,2707;21,2708,2709;2,2710,8,1,2711;21,2712;20,2713;25,43,2714,2715;25,43,2716,103;9,2717,168;12,477,981;9,925,168;24,936,2718;26,274,2719;20,2720;37,2721,8,2722;5,2723,8,2724;9,2725,39;12,2726;20,2727;29,2728;8,2729;8,2730;21,2731;19,2732;18,2733;40,2734,1484;40,2735,2736;40,2737,2738;40,2739,2740;20,2741;19,2742;29,2743;18,2744;20,2745;15,2689,2746;18,1623;18,2672;21,1340,150;7,2747;7,2748;12,520,489;21,2749;12,833,510;9,2750,32;22,528,2751;38,2752,2368;19,2367;7,2753;18,2754;40,2755,2756;40,2757,2758;40,2759,2760;2,2761,8,1,2762;2,203,2763,1,2764;2,2765,8,1,2766;20,1069,589;9,2767,168;27,2768;1,2769,2770;20,2771;20,2772;12,458,2773;9,2774,103;23,668,127,2775,129,2776;22,2777,2778,122;1,8,8,127;9,2779,187;9,2780,168;9,2781,168;12,2782;9,2783,168;9,2784,168;9,2785,617;2,2786,2787,1,2788;2,2786,2789,1,2788;2,2790,8,1,2788;7,2790;7,2786,2787;7,2786,2789;37,2791,2792,1631;12,107,516;9,2793,32;9,2794,182;9,2795,32;9,2796,187;18,2797;29,2798;20,2799,887;9,2800,32;26,2801,475;9,2802,168;29,2803;29,2804;7,2805;37,2806,2807,1631;37,2808,2809,1631;37,2810,8,1631;9,2811,397;9,1150,397;41,2122,2812;29,2813;20,133,589;12,514,2814;3,2815,8,1,10;35,2816,2817;9,2818,187;12,520,426;7,2819;9,1748,127;9,2820,168;9,2821,103;14,2822,2823;12,1171,2824;12,514,886;13,2825,2826;5,2827,2828,2829;5,2830,2831,2829;22,528,2270,122;22,528,2832,122;12,458,2833;13,1925,2834;19,2835,150;9,920,168;26,810,454;21,2836;12,22,426;9,2837,8;12,514,2838;11,626,397;9,738,168;21,2839;9,2840,232;12,833,981;26,721,2841;12,514,1122;9,2842,187;9,2843,168;9,539,39;12,1145,817;15,514,2844;26,274,2845;12,458,2846;20,2847;12,287,2184;20,8,2848;20,2849;28,2849;26,158,2850;26,1525,2851;9,2852,187;9,2853,175;20,1200;26,721,475;31,1920;28,1987;31,1987;9,2854,168;12,72;20,43,2855;9,2856,168;15,1145,2857;26,721,604;21,746,150,1376;1,2030,8,218;12,514,2858;14,1541,2859,84;15,514,2860;31,1620;9,2861,168;33,2862,1414,1063;15,514,477;15,581,2863;7,2864;20,2865;15,2108,2866;11,626,2867;12,2868,1486;12,521,2869;11,2870;21,184,2871;9,2872,103;9,2873,103;12,458,2874;9,2875,168;12,74,489;9,2876,168;26,721,1108;20,1437;20,1807,887;12,1371,454;20,2877;21,2878;12,514,2879;20,509;15,43,2880;21,2881;9,178,175;14,2822,2823,56,2882;41,1411,1134;20,2883;20,8,421;27,2884,467,2885;20,2886;26,274,2887;9,2888,127;2,203,2889,1,2890;23,2245,127,2891,129,2892;26,721,2893;26,274,2894;9,2895,32;11,2896;18,2897;18,2898;18,2899;18,2900;18,1820;18,2901;9,2513,39;18,1002;18,2902;12,833,2903;22,528,2904,553;20,2905;11,2906,397;9,2907,103;12,511,604;26,721,875;15,567,2908;12,668,981;26,721,2909;20,2909;9,858,32;26,721,1040;9,2910,39;9,2911,232;20,2912;13,1579,2913;24,936,2914;19,2915;9,2916,32;9,2917,32;9,2918,187;9,2919,187;31,184;12,833,1005;18,2920;21,2921;20,184;44,2922;26,158,536;12,514,1032;19,2923;26,158,2924;13,2659,2925;20,2501;27,2926,467,6;26,274,2927;12,833,133;7,2928;20,2929;26,2930,768;28,2931;20,2932;29,2933;26,721,2934;21,2935;11,2936;20,2937;12,833,489;9,2938;7,2939;11,2940;11,2941;26,721,2942;31,1032;20,2943;21,2944;19,2944;2,2122,8,1,2945;3,2122,8,1,2945;7,2439,2946;26,721,199;7,2947;21,2948;9,2949,103;9,2950,168;9,2951,103;37,2952,8,2953;3,2954,8,1,2955;35,2956,1,2957;26,274,701;12,837;9,2958,32;9,2959;9,2960;45,2961,1,2962;20,2963;26,721,2964;9,2965,168;26,274,697;12,1371,891;20,2966;12,833,2967;26,1644,475;26,953,1820;20,2968;11,2969;20,2970;45,2971,1,2972;12,74,1187;9,2973,168;26,274,2974;20,201;20,2975;12,511,2976;12,833,2976;20,2272,467;26,158,2977;20,2978;35,2979,1,2980;11,2981;11,2982;31,2983;21,2984;21,2985;11,2986;12,199,489;9,2987,232;21,2988;20,2989;23,2990,1655,8,129,2991;8,2992;8,2993;39,2993,1,2994;13,2995,2996;9,2997,32;9,2998,32;9,1134,32;9,2999,32;9,3000,103;28,3001;26,274,3002;9,3003,187;15,567,3004;45,3005,1,3006;24,1578,3007;1,3008,203,6;9,3009,168;11,3010;9,3011,168;36,3012,1,3013;19,3014,150;26,1525,3015;16,1188;26,274,3016;12,514,3017;20,8,3018;20,3019;9,3020,168;9,3021,168;21,3022;19,3022;20,3023;26,274,849;12,1371,489;34,3024;7,3025;20,3026;34,3027;31,510;23,2108,127,2109,129,3028;27,1912,203;7,3029;7,3030;19,3031;9,3032,168;12,514,3033;18,3034;29,3035;15,479,1065;21,3036;9,3037,39;9,1824,39;9,3038,32;19,3039;18,2118;19,3040;19,3041;9,3042,168;7,3043;26,8,3044;9,3045,168;23,3046,127,3047,129,3048;19,3049;9,3050,8;7,3051;9,3052,175;16,3053;9,3054,187;9,3055,187;19,3056;9,3057,187;23,1814,1299,3058,129,3059;19,3060;21,3061;9,3062,168;9,3063,168;15,3064,74;21,3065;22,3066,3067,122;13,3068,3069;9,3070,168;19,3071;19,3072;19,3073;22,528,3074,553;9,3075,168;46,3076,1,3077;29,3078;9,2439,103;21,3079;18,42;18,3080;29,3081;28,3082;15,3083,3084;19,3085;21,3086;21,3087;21,3088;21,3089;19,3090;19,3091;19,3092;9,3093,168;21,3094;21,3095;19,3096;21,3097;21,3098;21,3099;19,3100;21,3101;19,3102;28,22;45,3103,1,3104";

const $scriptletArglistRefs$ = /* 13157 */ "383;1003,1686;1684;120;1543;26;102;446,590;26,455;2862;441,455,767,1103,1104;1640;1108,2042;1686;1275,2447,2448;26,441,442,443;1687,2115;1640;26,1472;1640;1640;1640;2692;3346,3347;28,366,481,488,1923;403,2645,2646;383,481;1349;532,1688;1640;3133;1029;2036;413,1640,1782;120;504,1104,1168;918;1640;1640;1640;2692;1640;2935,2936,2937,2938,2939,2940;26;26,366,424,428,429,430,431,1686;455,971,972,973,974,975,976;1640;2885;1003;366;1684;455,696;650;3148,3149;1686;1003;1831;26,366,455,1688;363;115,116;26,2313;1771;120;390;120;390,394,424,807;115,411;455,2671;1887,1888,1889,1890;199,715;1472;26,416;3668;1003;351;1640;26;26,416,1003,1687,1803,1804;441,455,767,1194,1685;3508;26,481;1771;26,767,1195;26,354,366;605,696;1640;363;948,1266;139,151,544,687;2679;1344;1640;796,1504;26;28,1689;1640;383,390,455,503,767,1377;120;28,29,382;226,227;2408;3423;29;637,2069;637,3610;1543;1687,2115;1798,3468;1687,2115;1690,2786;390,422,423,1684;139;1142,3508;1640;658;481;26,1049;2166;3554;363;1640;1828;115;115;1640;1829;1640;1344;1640;26,455,1003,1555,1556;26,115,455,1542,1543,1544,1545;594;383,390,455;1687;366,383,632;26,424,1543;811;1640;26;1832;1640;2789;455;1273,1640,2519;1640;26,27,28,29;738;3623;1640;1402;366,447,475;1640;1265;1185;1543;1003;2036,2037;1688;2047;26,115,455,1542,1543,1544,1545;1276;2134;1640;398,1651;26,366,764;26,1597,1605;1003;1640;2793;26,27,28,29;1053,1640;544;26,443,444,445,818;1640;150;1275;2148,2149;613;574;26,696,2460;26;26,416;3018;366,834;390;120;1472;908;3066;459;841;1108,1354;1778;1232;1688;26,383,455,546,589;1151,1189,1472,2570;448;2566,2567;594;391,1003,2664;26;790;1108,1437,1688,2188;26,3061;1613,2654;1003;1771;110;1771;3448;1771;360,361;416,417;594,628,1662;371;115,1756,1757,2369;2170,2979;333,1272,1640;714,2373;390;2541,2826,2827,2828,2829,2830;455;411;132,1980;1640;2049;1771;3117;2327;2338,2467,2535;1379;26,1803;26;377,596,827,828;1453;354;26,441,455,767,1194,1685;455,1192,1193,1686;372;1472;1686;3249;411,2398,2399;461,616;363,1640;139,151,363,544,621;1249;390,501,1003,1543;1269,1640;1344;1657;26,1328,1685;1543;26,780,1685;594,1277,2303;1686;1344;1340;1344;558;366,383,502,632,856;1205;1640;120;1757;1472;26,3029;1472;594;29,548,594;594;1786;1152;1152;1152;594;29;26,626,1256;567;58,418;3143;1108,1728,2188;3148,3149,3484;293,294;456;366,456,481;3096,3097;2499;1640;1543;1640;2759;718,719;26,1472;455;3541;26,455;475,594,1188;862;594,1543,1662,2880;696;1640;1472,1473,1474,1475;3451,3452;1713;1543;1688;1003,1131,1132;1640,1771;1640;1998;115;26,841,1687,2073;1757;915,1685;1273,1640,1646;689;2822,2823;26,443,444;1640;132,708,2036,2261,2838,2839,2840,2841;1640;3345;1543;481;26,1635;2494;177,178;142,143,2461;390,456,481,867;120;366,383,632;26;-404,-2646,-2647;26;26,395,481,578,632,714,762,777;3254;3442;1330;1758,1759;26,796;793,1181,1640;29,637,1880;1472;517,1120;548;1303;1640;26;422;26,1003,1687,1699;481,1543,1687;1640;1950,1951;481;1771;26,418,1691,1919;1003;1543;177;1771;455,1685;1435,1436;1713;26,424,462,463,464;480;2797,2798;1685,1686,1687,1690;1771,2588;1771,2588;3009,3010;26,28,398,605;26;793;1605;26,1686;594;26,64,65,66,67,68,69,1003,1543;464;366,383,481,632;1687;26,504,1168;504,1104;1041;119;1860,1861,1862,1863,1864,1865;1111,1112;1685;132,3142;1757;402;1829;1713;1687;444,818;444,818;74,75,1268,1640,1771,2405;2211;385;371,1771;616,1197;363,1758,1759;494;26;26;1640;120;1472;70,71;26,1003;2050;1543;1543;233,363;696,1687,1692,2832,2833;1472;594,1670;1687;455,767;594,1608;1472;70,71;26,594;594,626,730;1771;1543;1003;481,546,3034,3036;658;1713;446;1108;26,455;1063;359;2845;1131;1285;469,594;1640;1354;1640;1640;637;29,139,594,2218,2219,2220,2221;1771;1786;1189;1549,1572,1573;2421,2422;594;26,481,1688;1472;1472;1640;363;77;26;594;363;1640;1684;796;26,594;501;1472;2712;29,594;26;1660;26;26,1713;455,1501,1502,1503,708;2751;843;1687;1713;26,1713,1714;1688;2552;26,455,1108;1166;1757,3637;26,3609;26,481,1685,1687;411,1741;1254;1749;1635,2719,2720,2721;1472;501;3101;1640;3080;26,576;416;26,1543;26,64,65,67,68,69,1543;26;26,1003,1803;475;1096;382,390;1254;2934;1771;1143,3508;1330;1472;101;28,1003;455;1684;1543,3057;637,1615,1616;26,395,605,696;481;2032;416,957;1686;1640;455,696;1003,1696;1684;333,373,1272,1641;3475,3476;849;411;1687;26,1543;366,739;1661;1543,3241;2909;390,2439;366;1003;1003;1344;357,358,359,1265,1640;1472;1640;115;2088;26,1688;456,1685;359;475,548,1033;1640;1640;3158;3158;1472;1796;26;2902;1767;1723;944;371;870;3316,3317,3318,3319,3320,3321,3322,3323,3324,3325;424;26,58,418,1709;441;594;431;1826,3636;26,383,551,573,574;435,573;435,573;26,576;336;2080,2081;594,2779;1684;29;3630;594;1003;1687,2115;181;2246;26,1685;2512;2246;2246;640;2246;2246;2246;593;26;1472;2246;70,71;70,71;1771;1639;132,1854,3689;669,1771;1640;120;390,455,767;26;400;720,721,722;603;1749;1502,2446;26,576;481;1713;3687;26,2464;390,395,441,455,502;26,1813,1815;2649;1688;2303;115,2369;2261,2838;2692;26;424,1689;26,409,410,1685;70,71;455;1686;26,409,410,1685;26,409,410,1685;26,409,410,1685;794;2644;115;2075;26;2799;336,1415,1416;363;26;1686;390;3622;2654;1501;594;501;395,481,1024,1025,1026,1687,1688;1786;26,576;383,390,455,481,589,867;739;394,1724,1725;2903,2904;667,668,1687;26,1686;989;1640,1771;26,474;382,594;456;26;70,71;1477,1478;1640;1688;366,383,1688;1640;1640;1640;1640;1640;1640;1640;1640;1640;1730;590,637,1634,3266,3267,3268;478;2654;1981;435;590,637;594,1472,1658;594;418;2338;605,696;605,696;605,626,696;605,696;1698;1493;1472;2603;434,1120,1121;26;1543;26,366,394,481,556,557,558,559,1684;501;120,1486,1487;966;3638;984,994,2348;1640;2988;1640;1063;363,1266,1640;26,418,1691,1919;658;1330;455,767;1771;29,416,517,548,594,2086,3351;1687;1686,1696;752;469;1640;1205;1687,2115;481,945;26;26,455,481,767;1047;1407;1270,3083;1772;2850;1640;26;26;1686;1710;1417;3242;84;1254;781,2550;26,455,767,1635;1091;26,727,1003,2116;1543,1687;373;906;366;1686,1691;26,444;1692;1685;26,1374,1716;2060,2061;1771;26;424,1685;1689,1690;26,418,481,605,1003,1543,1685,1710,2977;1713;496,497;682,683,684,685;26;400,682,683,914,1543,1687;2360;2052;26,27,28,29;139,151;354;1885;1885;26;132;26,1198,2368,2374;1054;1654;1685;1543;553,1179;181;481;1897;1643;1767;686;1640;2984,2986,2987,2988,2989;3485,3486;1472;455;1216;26;2321;366,834;2603;26;70,71;951,952;594;594;594;26,696,1543,2460;3577,3578,3579;1226;401,424,616;594;1685;2308;115,834;418,1543,1713;70,71;456,871;1472;149,3127;366,1007;455;1543;231,232,2168,2169,2170,2171;1498;120,449,450,451,452,453,454,455;418;26,3145,3513;2178;400,429,501,1003;1543;70,71,1543;1689;70,71;1003;905,2082;139,897,902,903;615,616;3345;26,475;26,1686;434,466;1472;1374,1375;70,71;696,1003;70,71;548;26;26,1003,1543,1923,1981;1003;1323;26;26,1686;653;3035;411;109;721,3021,3022,3023,3024;455,502,767,1688;26;26,383,455,1685;455,767;796,1504;2560;3531;390,487;1767;3649;363;1771;1543;1686;637;366;2119;574,938,1293,1543;637;29;1900;26,2455;637;26;637;1472;1685;3494;1543;1891;1420;3555;377;1695;400,1023,1686;1687;120,1486,1488;2086;594;359,1344,1472;629;120;951,952;434,587;26,1543;1686;405,407;26,1161,1543;1684;1702;390,455;1640;1904;1472;1472;503,1685;1640;390,988;1317;2998,2999;3690;1640;2709;70,71;726,877;411;3255;1041,1042,1043,1044;336,1722;26,2729;663,963,3302;3260,3261;1771;1688;481;26,29,1543;1383;796,1504;594;1183;588,614;1053,1640;632,1054,1684;455,696;796;1543,1687;1687;3345;1640;691;767,913;455,767;455,1501,1502,1503,708;1635,2719,2720;443;26,1003;26,416,1003;418;1472;906;2973;383;1685;1640;26;1472;70,71;594;26,416,1003;26,416,1543;2763;1003;26;26,416,1543;1543;1771;1019,1287;26;353;26;1472;594;2368;28,1743,1744;593;1757;1729;390,590,744;120;1003;1697;373,1640;26,1003,2486,3055,3056;1672;1003;1003;1543;402;2998;469;587,2453,2454;594;1476,1477,1478;1685;115,3357;363;455,1478,1501,1502,1503,708;402;26,1543,2531,3057;594;2237;457;594;1003,1687;26;1103;555;373;594;1543;835,836,1543;26,1614;1686;708;26,1003,2486,3055,3056;1543;1685;1713;1472;1686;1689;2049;26,27,696,1687,2992;455;2409;242,243;2144;468,1758,1759;2314;1543,1658;486,594;2009,2010;435,551,574,594;1472;382,390;26;1459,1472,1559;1472;616;517,548,594;517,548,1819;1688;2909;401,403,781,1670,3517;1543;2029,3656,3657;1710,1712;1472;1687;3354;1251;1472;1686,1687;26;26;434,594;26;1692;1254;1543,3271,3272,3273,3274;455,1446;1472;932,933;70,71;1472;3327;895;1472;115;26,435,594;1543,1688;684;26,696,1003,1543;2741,2742;1685;796;26,1003,2486,3055,3056;594;1687;1472;1543;584;29,390,1516;70,71;1543;1543;1640;1472;1395;1686;1205;1108;594;26,1687;992;2172;823;26;1543;1472;1277;821;432;1686;2212;456;26,383,551,574,575;26,383,573,575,819;26,383,551,573,574,575,576;2107,2108,3642;26,383,551,573,574;1724;1640;790;1251;301;377;2896,2897;2189,2190,2900;402;26;1685;1640;30,31,32,33,34,35,36,37,38,39,40,41,42,43,44,45,46,47,48,49,50,51,52,53,54,55,56,57,58,59,60,61,62,63;594;594;548,594,1472;594,1249,1349;2477;29,548;29,576;594;29,548;3480;29,1723;594;548;481;26,1685;402;1472;1189;26,957,1060,1635,3001;26,1685;603;1687,2115;1687,2115;203,333,1640,1642;26,605,1003;594,1662;29,594,1687,2086;1003;594,1472;3527;70,71;26;70,71;1473;1640;993;663;354;455;456;469,594;26,481;1472;720,721,722;3363,3364;390;1777;1685;1216;2319;112,113,115,116;1074;366,695,696,818;99,3590;1771;1219;366,3032;594;1040;1543,1658;1247;26,28,395,398,605,696;2514,2515;359;1472;26,956,1688;413,1640;1640;576,2279,2280,2281,2282;84;26,548,626,878,1536;455,767;1140;26,1814,1815;366,1686;1686;1003,1543,3202;363;790;224,225;1472;594;26;377;383;627;1685;26;26,479;594;1459,1472,1559;731;1472;2530;1767,1974;1073,1640;58,3424;605;29,556,3051;1687;1472;1640;594;1003;3370;1686;1472;3673;115;2086,2368;1829;26,3513;26;2733;1472;1897;1758,1759;1688;1821;1472;363;501;26,366,1169,1686;1472;1254;401,469,594;26;1472;2248;3606,3607;1003;1767;594;1944;1749;623,948,1640;26,1054,1690;1472;1640;1251;26;1767,1771;594;1543;1838,3349,3350;26,1685,1686,1687;1472;29;1476,1477,1478;594;594;26;469,594;464,751,1137,1138,1139;390;26;574;594;26;257;1640;383;1242;26;1472;2254;2708;594;455;1218;814;1640,3616;3454;1689;2908;1495,3460,3464,3465;26,464,751;1657;26,456;548;514;2097;1476,1477,1478;1476,1477,1478;1585,1586,1587;1456;3270;3152,3153;336;3360,3361,3362;26,1498;455,767;1640;1687;1688;1662;2167;2948,2949;1003;605,696;605,696;811;359,594,861;131;3444;2993,2994;1686;455,696;594;594;26,3480,3481,3482,3483;1472;1686;1771;1472;2654;26,481,767,1195,1684;637,2362,2640,2641;1097;366,390,441,455,562,767;455,767,1553;390,545;1472;546;1543;655,656;1692;505,1186;793;1693;1543;334,1640;837;411;2699;248,1590,1591;26;26,1543,3373;26,1543;26,418,1691,1919,1920,1921;3678;982;1476,1477,1478;29;1061,1915;1640;1685,1686,1687;366,546;969;548;1447;951,952;1465;455,1636;1685;1254;1367;1151;505,506,2151;1884;26,2831;1344;1751;26,1003;29,594,2019;26,120,394,1686;594;366,400;441;1476,1477,1478;70,71;221,222;1476,1477,1478;1679;594;1277;1000;1640;1349;416,574,594;84;951,952;26;1472;1194;466,1012,1013;1390;594;1640;1692;1688;1787;1358;416,594;1205,1652,1653;1685,1692;2174;391;567,1684;1472;390,542;26,394;26;70,71;1688;2506;937;373,376;26;26,29,1543,3601;26,29,95,1543,3601;1685;26,29,416,1543;26,28,395,398,605,696,780;1658,1713;26,928,929;3310;1713;1543;1640;390,455,767,768,769;26,1543,2495;1568;455;1476,1477,1478;26,844;1472;58,431,683;455,834;26;1298;-1375,-1376;1252;2802;1476,1477,1478;1476,1477,1478;26;1003,1109;1472;1267;1685;26;812,1478,1480,1481,1484;3308,3309;115;402,2112;1472;1472;1657;416,574;3280;2603;469,1220;435;70,71;821;390;594;616,1197;2993,2994;1688;930;26,401;2148,2149;1472;574;594;594;26;26;1685;1776;1459,1472,1559;1688;3311;26,443,444;464;1687;26;796;1685;1003;1255;1757;2224;2711,3634;3633;1543;605;1620;534;605;1687;28;26,780,1280;1003;254,255,1618;1638,1722;508;2332;1992;1685,1687;1688;26;696,1688,2249;26,1003;841;26,73;1472;1472;546,1687;1743,1744;1472;1002;1003;1543,1583;1640;963;594;534;26,3513;790,2011;1686;1003,1543;401,435,551;594;26;3544;26,1543;464;411;1003,1686;1640;26;475,1686,1981;26,3243;1141;721,3021,3022,3023,3024;26,2561,2562;411,455,548,594,1003,1381,1543,3019,3020;1322;3576;696;1685;26,416,1543;26;1472;781;29;1472;26,1686;2451;604,1543;366;637;1686;1685;26,548,1543;1543,3271,3272,3273,3274;1003;2308;1472;726,750;1543;548;1640;28,394,434,456,469,820;359,2239;411,1428,2432;1686,1687;424,1698;3690;3690;3690;3690;3690;3690;594,1710;1640;2436;1476,1477,1478;1476,1477,1478;951,952;708;548;1688;1003;395,1026,1687;400;2871,2872;1543;1472;594;1472;1516,3604,3605;456;2186;1686;3086;2502;980;455;594;1472;479;475,1689,1981;1472;26;940,941;26,1374,1716;594;26,73;1254;1513;1189,1472;594;1829;740;2388;26,435,594;29;1472,1743,1744;1472;1771;501;1687;424;2944;1771;464;1472;616,878,963,1044,1197,1677;505;616,878,880,963,1044,1197,1677;456;1771;948;1472;1640;1778;58,3424;531,532,533,1688;969;594;1743,1744;3345;26,632;86,115,2760,2927,2929,2930,2931,2932,2934;676;1124;2536;963,2255;790;275;1472;2662;411,1741;1640;1330,1472;1472;1216;1687,2297;3537;1685;383;594;1140;2318;594;26;456,742,743,1688;455,1501,1502,1503,708;375;26,1003;26;2635,2636,2637,2638;1472;391,821;26;594;1270,1640;532,533,1688;1394;115;2654;-27,-1544;115;1585,1586,1587;657;1771;763;767,1688;548;594;936;363;1687,1713;621;115;1054,1231;2809;1692,2316;1771;1216;1476,1477,1478;1538;1686;455;2834;1049;767;767,1317,1688;455;505;593;594;2847;1687;1247;28;26,1374,1716;2536;3041,3042;1440;1686;390,481;469;2469;434;1320;1722;1472;455,1501,1502,1503,708;455,1501,1502,1503,708;1640;400;1685,1686,1687,1688;481;2049;1688;1334;455;1640;170,171,1313;26;501;28,29;594;78,1472,2624;992;1686;1685,1686,1687,1688;532,533,1688;26,1237;1472;1229;1358;2672,2673;26;26,594,992,1687,2483,2484,2486;26,28,594;637;594;1003;1557;1685;2947;1543;1003;1686;1690;26;1640;1472,1498;1771;1896;1657;3518;1003;26,1003,2486,3055,3056;1543,1593;1640;594;1688;1640;3413;1254;3624;26;120,455,567;1070;1685;1685;2993,2994;26,1196;1472;594;499,627,681;1108,1688,2042;553,2082;1447,1472;1472;1640;654;675;684;26;26;1625;1686;531,532,533,1688;3345;1108,2196;1728;1042;2445;1472;1472;3380;1771,1782;688;2058;1003;781;2325;1254;1472;1686;637;672;1685;1254;26,547,696,1003,1713;-27,-59,-1544,-3534;1254;547;1254;1254;1254;1689;1472;366,745;3103;938;1640;2654;1640;26,2703,2704;1818;1472;1277;1640;2546;594;1205;906;390,1003;458,459;28,1713;1003;1685;1771;1472;28,594;377;2916,2917;26,29;26;26;594;3077;1238;861;1543;1688;1686,1687;464;594;1108;562,1453,1454;508;1472;640;26,640,1637;3562;1689;1330;594;1472;1743,1744;684,2665;1657,1685;897;2079;394,1724,1725;29;394,1724,1725;2135;394,1724,1725;394,1724,1725;394,1724,1725;107;637;1472;1472;2381,2382;2663;1822;1684;1868;1767;1472;1472;1767;371;95;1128;1688;29;594;29,1723;605;594;594;594;1743,1744;594;3480;26;29,1723;594;26,28,29,3217,3218,3219;594,1472;3480;2182,2264,2265;594;29;642;605;594,1722;594,1350;594;594;29;517;456;594;594;29,548,738;3199;1747;1472;455;1686;1472;1640;594;1472;1585,1586,1587;548;1640;26;26;1686;2246;26;2246;2246;1216;594;26,594,1003,2486;1472;796,1945;1728;1687,2115;1687,2115;1687,2115;391;1762;996;997;366;2246;1687,2115;2246;1583;1640;850;1472;111;594;594;2246;26,73;1460,1461,1462;1472;197,198;3474;120;1685,1686;26;2053;1472;3636;2537;456;1472;2481,2482;455,767,2141,2142;26;1688;1686;2551;1687;1771;1238;1685;366;1687,2535;1498;1472;1588;1254;2619;416;117,192;1640;1879;26,1543;418,695;948,1640;3469;3530;313,314;29;29,548,1003,1687,2086;1685;1417;1254;2123;636;115;637;2654;1003;594;26;455,1574;455,767,1256;1688;455,1574;2993,2994;58,3424;637;1771;3069;26,960;411,532,1131,1662;26;1543;3306,3307;637;416;26,941,1810;2581,2582;658;2801;548;383,503;489;548,969;26,2076;26;514;1003,1686;26,1003,1472,1543,2092,2624;26,1685;26,503;26;1688;467;383;26;1003;26,377,1258;1329;456;1361;416,3514,3586;416,637,1710,3514,3586;443,514;1713;2652;2593;962;1767,1787;394,469;3536;359,1472;1833;1687;1685;1077;1688;1189,1251;1219;851,852;1543;1689;26;1309;363;883;1782;3421;888;26,578,632,714,762,777;1282;331,1647,1786;26,1543;1543;869;1472;1685,1686;2437,2438;1640;29;1685;1472;594,1472;26;26,1392;1472,2345;-27;2656;1640;594,1196;1472;1472;2207;841,1381,1686;1690;1736;1612;371,3641;29;895;1472;901;469;1131;26;2114;411,1365,1472,1741;790;26;594;1743,1744;431;383;1748;1640;1688;1685,2889,3005;1330;1319;637;796,1504;1472;2654;1764,1765;490;481;1472;2250;1640;395,481,1024,1025,1026,1687,1688;1640;1502;416,574;1771;1771;1688;594;394,1724,1725;508,587,594,714;1472;-384,-391,-456,-482,-590,-868;1685;1640;637;2653;115;371,1640;1712;1003;816;29,548,1472;1472,1543;26,64,65,66,67,68,69,1003,1543;3172;1472,2883;1344;26,548,594;456;394,663,1220;26,481;594;26,382,513,514;594;574;469;594,730,2164;26,824;3176,3177;1516;401,481,548,594;481,594;482,483;26,383,395,396,3331,3332,3333,3334;26,383,395,396,3331,3332,3333,3334;26,383;26,383,395,396,3331,3332,3333,3334;26,383,395,396,3331,3332,3333,3334;1764,1765;26;26,383,395,396,3331,3332,3333,3334;26,383,395,396,3331,3332,3333,3334;26,383,395,396,3331,3332,3333,3334;26,383,395,396,3331,3332,3333,3334;571,1441;1530;605;26,696,2046;739;1757;1502,1640;2692;1156;1472;1516;1442,1443,1444,1445;767;1407;2223;1767,2636;1299;351,793;517,548,1713,2619;1499;371;548;1063,1472;594;1472;1143,3508;402;26;1003;1472;708;3478;404;3194;726;2468;3238;3480;2654;594;381;29;1516;1966;26;1710;1003;402;1163;796,1504;1472;605,696;3291,3292,3293,3294,3295,3296,3297;1771,3534,3535;1102;402;1543;1686;1688;1189,1251;382;2544;594;963,1317;1379;548;594;594;594,2763;2146;26,120;26;1003,1927;2625;594;890;1764,1765;390,395,455,767,1216,2033,2034;455,629;26,455,767,1030,1108;1472,1543,1623;366,390,441,455,562,767;455,767,1553;390,395,455;2123;435,1818;363;29,1663;2154;455,767,1003,1564;783,784;411;3553;1543;1543,1685,1710;1472;382;1502;1108;1472;1295;1640;1640;1640;26;1689;2810,2811;359;2902;1543;1686;26,398;939;411,1741;26,418,1003,1919,1920,1921;26,605,696,2195;26,418,1691,1919,1920,1921;1472;416,455,1277;1495,1496,1497;2132;1764,1765;1640;1257,1918;3130;29;872;1447;887;26,377,831;1354;2012;456,594;1254;2160;1543;26,728,1690;366,632;1472;594;1685,1686,1687;684,2889;2538;505,1516;2511;637,3181,3182;1472;1118;580;366,400;424;1472;390,401;534;2222;884;3493;763;469,628;663;2988;390;1618;2256;3006;29;400;1251;26,120;1472,2657;2654;371,1771;2230;332,1272,1640;469,551;1686;3430;469;136;184,185,186,187,188;594,627,1686;1003;572,661;1543;115;1713;455,708,1501,1594;594;1692;26,1031,1684;26,562,2292;469;1940;29,1501,1543,1703;594;1686;570,1687;120,422;26,1685;26,424,2231;1003,1543;128;1472;1543;3632;26,1003;1692;1003;1692;1476,1477,1478;1543;1003;1543;455,1455;1543;390,455,767,1685;1623;1076;2832;1692;26,456,503,546,605,658,818;1685;1685;708,834,3566;3163,3164,3165;1108,1254,1378;26,3434,3435,3436;605;1688;26,1684;26,416,1543;637,2508;455;1374,1375,1716;418,683,914,1687,1710;1730;914;26;481,3310;26,470;2483;1713;26,416,1543;26;658;1333;1543;390,1686;133;1543;115,2804;1685;1640;1131,2901;708,2261,2838,2839;26,517,548,1713,2619;336,1610;2317;419;3134;26;1686;1710;26,431;1640,1771;1763;26,1543;3522,3523,3524,3525;517;508,594;382,574;120,709;2993,2994;2993,2994;2993,2994;2993,2994;2594;490;3552;951,952;26,547,618,1685;594;594;26,1472;416;456;594;26;594;594;29,456;456;958,2026;594;422;2763;951,952;2676;594;2479;594;390,1687;26;1772;2654;456,1543,1687;390,1687;354,711,712;1472;1688;1686;395,594,1688,1992;469;637;1686;400;1254;1543;1187;594;26,1003,2486,3055,3056;26,956,957;1772;1502;107,247;1003;1713;660,781,1688;594;481,1003;1687;1119;2732;1685;1003,1543;481,780;390,1003;1254;594,1722;26,841;286;29;1003;862;1685;890;196,3226,3227;1472;26;26,2486,3055,3056;594;1428;1465;1472;1640;1032,1684;1472;629;26;26,594,642;26,2486,3055,3056;1251;1003;1472;606;1543,1687;1003;2043;594;1687,1722;132,288;26,3371;802;3503;29,517;1472;390,629;780;1472;501;359;658;1573;637,1599;967;1472;658;1472;359,1344,2654;616,1197;1686;848;627;26;605,696;637;627;951,952;26;29;1878;1688;411;390,411,422,423,1685,2005;594;1543;1543,3271,3272,3273,3274,3276;1687;120,1108;2157;26,73;605,1054;26,482,2603,2690;951,952;427;1972;562,1453,1454;1472;1900;1686;455,767;658;2155;658;578,632;1472;594;1189;469;481;2654;1771;1743,1744;1229;26,28,398,481,605,927;517;1688;1686;26,481,1543;29;638;1189;383,475,798;1640;754,1640,1771;2692;115;1640;1933;1472;981;1251,1472;580;548;1472;1549,1572,1573;2186,2187;1003;26;469;1640;552;426;469;1472;594;594;1684;1686;1003;416,574,594;115;26;3345;1189;2197;26;411,672,1108,2335;411,1251,1472;26;548;26;594;1764,1765;658;1688;861,991,1189,1472,1481,1506,1507,1508,1509,1510;841;1472;26;411,1189;594;3627,3628;1003;1723;1502;3090;708,1003,1699,2268,2269,2270,2271;594;26;1692;1266,1640;245,246;658;812,1478,1479,1480,1482,1484,1485;115,411,2530;629;594,2354;1640;1640;1472;1686;418;115;1472;394,514,616,726,727,1186;248,249,251,323;663;726;26,435,461,505,726,727,728,729,730,731;905,1472;115,1757,2369;26,73;1685,1686,1687;1472;3614,3685,3686;363,1643;810,811;930;1696;3603;1849;115;2030;2223;1688;3174;1472;359;1028;3381,3382;390,594;2583;931;29,2758,2759,2760;546,1684;548;532,533,1688;2461;120,366,416,550;120,1488,1511,1512;2991;359;115,2520;1003;1254;1254;1543;411,1277;26,455;390,455,767;455,1501,1502,1503,708;26,455,481,550,767;1594;26,1543;26,366,481,698,2460;594,3501;29;3466;1472;1472;1557,1743,1744;1476,1477,1478;383,706;336;120;1103;1752;1438;2707;26;3660;115,455,2258;1481,1518,1519;620;441;115,1472;2578;1472;74,75,1766;1472;3355;1472;657,753;383;446,567;1685;366;1688;2396;455,767;26,1003,1803;3073;26,29,594;1543;26,383,455;511;58;1419;390;1481,2915;1009;120,406,408;830;548;1344;1640;1472;359;699;2244,2245;671;1543;26,594,2486;1003;1543,1855;26,538,539,540;1968;390,455;441;644,645;594;26;435,469;1358;594;354;857;26,377,481;2961,2962;1516,1668;354;455;1472;1472;70;2735,2736,2737;2288;594;2474;1543;377,2297;2902;1543;1472;26,73;1808,1809;1472,1976;1685;469;930,1620,1634;3002;1543,3271,3272,3273,3274;1704;26;1694,3289,3290;605;1003;1687,2480,2617;637;728;1277;26;969,1706,2110;28,605;1003;26;26;26;26,941,1810;1904;84;3441;629;351;366;26,1502,3019;1543;1472;115;1543;1502;752,1685;26;1772;366;2611,2612;1472;390,1687;1660;411,1741,1742;951,952;1003;26,29;1899,2649;26,642;1003;708,1688,1710,2182;841;1472;1543,1593;1800,1801;1745;1640;1640;1088;1786;1640;1999;1354;508,878;594;189;1305;28;1640;2692;26,469,574;441,1685;2865,2866;1640;1771;594;26;469;84;120,1486,1487;111;3592;26;1689;1254;1254;1003;1254;1217;793;1254;1687;1254;1472;26,27,546,547,548,1687;1254;1254;1472;875,1459,1472,1559;1254;1543;26;594;1687;1472;548;1840;390,788;1472;434,478,594;3131;3278;1472;2392;1254;481,1688;3435;26;115,651,652,653;658;290,291;403,3517;1640;601;1472;640,696;737;377,481;659;1685;594;434,465;1543;434,1120;2495;594;594,1857;594;508;2858;1003,1543;1686;1713;1472;1472,1699;2843,2845,2846;1684;594;752;1472;594;58,3424;548;2425;435,728;115,2369;2621;594;594;594;26;26,2102;594;2764;-27,-641;1254;26;1028;653;26,1687;1254;548;657;2726;1472;1254;3499,3500;1685;26,605;1472,3109;1428;120;26;394,1724,1725;394,1724,1725;394,1724,1725;394,1724,1725;26,383,573,574;434,435,436,437,438,439;394,1724,1725;1537;594,1604;1934;2407,2609,2610;383,416,481,578,632,741;1771;1771;1724;1176;402;1685;390,1687;1029;363;629;1685,1686,1687;594;3345;441;951,952;951,952;951,952;1003,2706;594;336,517,594;594;382,401;29,517;517,594,1472;594;549,1516;594;402,594;29,1516;605;29;29;594;594;594;594;29;26;1472;359,2522;1054,1686;2104,2105,2106;111;1770;1713;838;1472;2012;1260;594;1472;1472;1543;1613;574;268,305;1472;594;1687,2115;1472,1973;1686;696;26,411,1685,1689;696,714;26;548,576;1685;787;1640;548;1904;1472;1297;390,391,1691;574;802;2246;1254;685;1131;1472;1786;371,1296;265;2029;359;2359;2460;1498;1286;594;1912;1771;1472;2750;1684;1640;1686;1003,1472;1640;455;120,629;1543;390,455,498;391;390,1686;1685;1685;455,767,2048;1472;1640;1108;441,696,1685,2887;1685;26,382;2649;416;1447;1131;26,28,1256,1543,1662,2880;26,1543,1662,1713,2880;26;3054;2191;26,1543;26,1543;1102;1425;2688;29;656;1472;1771;1687,2762;29,1687,2086;594,1685;823;401,594;115;594;1691;605;1543;1685;1908;637,1543;2379;1640;1293;949;26;1640;1686;2667;3663;502,1686;1543;1063,1472;1254;1003,3069;1472;455,767;481,864;637,1593;1685,1686,1687,1688;1472;26;594;95;1685;26;456;26,1003,2486,3055,3056;26;1219;1003;3518;1543;26;1003;26;26,1687;26,481,1687;1688;26,1003,2624;1003;1687;1689;26,696,1003,1543;26;1688;1688;390,1687;1686;26,1003,1543;390,1688;1686;26,2286;1686;26;895;2068;2185;1640;953;594;416,3514,3586;363;2173;2698;1003;594;26;1042,2301;1472;2049;546;594;953;58,3424;1685,1686,1687,1688;1688;793;841;2790,2791;26;29;26;29;3284,3285,3688;594,1743,1744;637;605;1640,1774;1750;802,2451,2746,2747,2748,2749;1393;3131;1684;1685,1686,1687,1688;26,3328,3329,3330;1685,1686,1687,1688;2857;1456;393;1472;1472;2162;481;481,594;1344;1688;1080;29,1472;594;1254;26;1723;1360;1003;26;1003;26;544;1254;411,3510,3511,3512;84,115;26,90,91,92,93,1543,3305;366;120,1690;1472;1419;1409;252,253;2651;1307;26;417;26,576;115,1494;3094;411,1741;1690;2398;3345;3641;115;1472;1472;658;1640;1771;1993;1472;2345;446,455,502,815;1856;363;3591;390,1687;26,395,481,578,632,633,1702;1251;2031;26,1003;455,767,1689,1690;594;3169;594;394,1724,1725;394,1724,1725;394,1724,1725;394,1724,1725;1843;594;2328,2329;481,739;1374,1375;1472;394,1724,1725;1724,1725,1726;1687;1003;2389;2389;2389,2390;807;1685;1543;1271;1526;796;400,1381,1687;115,1757;1344;26,594,642;594;594;594;594;1014;524,525;390,434,773,774;594;626;594;594;464;2608;594;26,401;594,1516;469,594;594;3412;456,594,873;550,663;594,918;594,796;469,594;594;29,594;594;26,393,574,1150,1151;26,400,1686,1687;26;26;26;1771;26;548,637,1685,3589;297;1640;610,611,612;594;1472;3369;395,404,503,1003,1543,1684;594;1633;28;115,2350;475,2247;1003;3345;1171;548;1686,1714,2201;29,1713;548;1472;1640;3214,3215;2945;382;26,3513;418,457;1657;1657;508,594;455;563;1690;26;1690;594;1379;2180;1472;1640;918;1543;1640;802,2890;1472;1640;455;1685,1688;390,1687;1472;594;390;841;411,1478,1525,1526,1527,1528;29,582,3265;29,582,1543,3265;1640;120;1847;902,1246;1472;1640;580;411;418;1472;1640;679,1472;26,377,2069;26;390;605,696;605,696;2847;115;1472;1060;2368;280;359;594;390,1253;1058;1094;1472;544;2398,2964;26;1688;658;416;416,548;461,2491;456;1670;594;594;456;502,2096;594;1003;1458;1003;3132;26,418,1003,1688,1921;390,455,481,1689;1472;1689;26,978,1685;390,1687;390,1687;708;26,469;2587;391;120;1472;3495;1367;1472;501,781;383;2799,2824,2825;3166;26,3312,3313,3314,3651,3652;26,401;1283;793;1640;2049;1687;446;1003;26,383,469,594;2407;814;1003,1685;26,1686;1973;1003;366,553;26,383,393,394,395,398,3669;26,397,398;26,58,418,3424;1330;29,582,3265;1543;390,481;1543;1687;390,867;26,594,1003,2086;26,73;26;366,481;548,1543,3431,3432,3433;400,422,666;594;1103;1516;1430;1472;1472;2223;402;1640,1644;594;1068;1965,3116;422;3074;562;1968;1047;3551;2492;1472;1771;1472;1233;1472;120;459,2814;1640;534;978,1463,1464;978,1463,1464;1640;1472;1365;1472;1287;3345;111;1764,1765;2859,2860,2861;500;461;594;594;3635;3635;1772;1787,2941;455,1290,1505;2331;508,541;26;912;115;594,1687;1713;1543;276;26;1472;708,2261,2838,2839;1472;696,2293;594;594;1472;2648;1063;1472;2654;455;1440;672;508;1818;1205;2103;1278,1684;1159,1397;2211;1543;1640;637,3068;1543;2042;1928;389;-27,-1544,2935,2936,2937,2938,2939;1254;26;1685,1686,1687,1688;26;3135;2788;1254;400;1772;1472;1502,2982;455,708,1501,1594;726,2359;26,336,1003,1905;1003,1552,1686;29;964,1969,2046;1472;2234;28,390;1330;366,383,1123;1685,1686,1687;1254;772;1472;26;26;26,1374,1716;1771;1126,1771;335;115;1688;1003;26,416;121;1689;1689;1686;351,1133,1134;1685;1003,1688;3387,3661;26;26,869,1249,2253;416,574,594;29;115;3416,3417;58,431,637,3221,3222,3223;481;1692;1684;1003;1164;1003,1543;3279;3345;1741;1877;400,1543,1710;481,657;1686;26;1472;336,1330;289;1778;1003,1543,1713;481;120;26,546,632;1205;788,1902,1903;1191;1914;26,443;1090;1767;574,2202;1690;594;58,1543,3424;3679,3680;26,3348;455,1381,2580;1757;1472;1640;1722;637;336;594;1108;441;1909;1688;1787;1640;1543;26;594;2465;1686;26,1472,3286;3298,3299,3300,3425;29;1871;469,594;26;594;594,3043;2765;548,1818;2993,2994;2993,2994;2993,2994;2993,2994;2993,2994;2993,2994;2993,2994;2993,2994;2993,2994;2993,2994;2993,2994;2993,2994;730,731,963,2806;1684;594,3159,3160,3161,3162;2305;517;594;455,1290;394,424,549,1688;2400;26,2980;594;951,952;951,952;26,1543;1686;3456;1447;1472;26,366,481,1685,1687;1472;2266;696;1687;1472;390;15,-27,-1544;1543;26,2863;1686;2306,2307;1472;26,73;2603,2686;885;132;1786;382,576,1657;1685,1699;660;1713;1472;547,696,1689;26,73;954;26,1543;1472;1465;1472;1685;1688;1713;696,1685;685,955;546,2046;2246;1008;1687;1670;366,527,528;1687;26,73;1687;1670;26,73;26,73;26,73;1687;26,73;594;841;3221;594;26,1543;26;1640;26,73;3472;424,1003;26,73;1003;26,429,1686;26,73;1543,1686;26,73;26,73;382;26,73;594;1472;482;1687,1806,1807,1808,1809;1354;418;796,1504;906;-27,-28,-29,-30;1472;26;2049;26,73;26;1640;1771;637,1599;794;58,696,3424;627;632,714,762,1054,1279,1657,1684;1472;336;3074;394,469,498,594;1543;382,390,435,457;1072;505,2126,2444;1472;1472;402,1054;658;841;1067;1543;1659;28;1686;1686;1543;1472;1003;548;629;1472;363;26,418,1919,1921;1476,1477,1478;594;951,952;2516;2663;2431;2972;418,1543;796;548;2918;1481,1518,1519;411,2345;341;1787;120,1802;455,834;1955;1771;3473;29;1685;455;1472;1854,1983,1984,1985,1986,1987,1988;1472;1749;1764,1765;1472;26,481,3193;1757;1640;580;1640;2654;1472;29;508,551;359;115,2369;2536;1472;1776;1472;2369;1685;1065;1407;2785;456;658;1254;1685;594;455,767;2692;594;26;2906;366,1823;1429;814;26,455,594,1685;411,3353;812;2131;26,73;3375;2620;1786;359;351,1133,1134;594;640,1543,1635,3373;1688;1771,1782;548;2023;1251;3256;552;2051;1543;1472;1472;58;1254;1543;696,1685;1472;841;402;2780;790;26;1472;1771;1254;763;3301;730;877,878;663;461,505,729,730;58,3424;841,1358;1286;1501;1131;1472;26,58,3424;1771,1782;2008;594;2294;883;456;371;3011,3012;3345;-27,-59,-1544,-3425;402;1771,1782;2968;96,97;1684;1516;534;992;1976;637;594;534;1472;1134;435,469;416,574;1472;1290,1500;441,779;1472,1536,1537;115,1189;115,1757,2369;1913;1596;1003;336;1003,1004;3650;1954,1955;26,455,767,1108,1688;58,3424;2072;26;120;455,767;1472;29;26;1254;1472;594;1640;1003;1354;1298;29,469;3666;390,481,930;580;1003;796,1504;930,3156,3157;594;29;469;1472;366;1771;111;594;1786;2886;567,568;517;1472;1640;481,502,632;996;456,469,594;639,640,1981;469;456;2807;594;1472;26,1687,2284;456,594;416,574,594;1686;1003;620;115;26,1689;1543;26;2153;984;594;796;593,594,1343;359,2395;2754;657,841,1135,1136,3179;481;3073;1613;58,3424;26,1588;594;1472;26,416,1003;308;1472;3677;455,841,1005;1472,2294;1003;1688;2910,2911;621;1535;1472;1689;594;1472;763;26,73;2094;637,3386;1866;1143,3508;3630;1472;1003;174,175,176;594;26,2451,2452;594;553;594;1003;395;132;1472;363,1216;373;373;373;373;455;418;366,390,594,767;2647;1771;455,1501,1502,1503,708;26,73;1549,1572,1573;1472;796;366;144;1251;1771,1782;26;390,469;29;115;1686;2049;1713;605,2698;2513;517;1640;390,663;1472;1619;1686;26,1543;403;26;2407;390,455,767;1685;26,1820;120,2919,2920,2921,2922,2923;1688;26;1688;1687;1472;594;1689;1272,1640;115;1508,1560;2457,3247,3248;1660;1687;1529,2204,2205,2206;132;1472;431;26;3062;1003;1003;478,1003;1459,1472,1559;790;115;402;841,2041;1003;26;861,2476;2548;115;1640;469;938;1657;594;637,1484;1685;120;1418;1543;26,73;359;402;708;390,1687;669,1048;367;115,1756,1757,2369;1472,1501,2624;1800,1801;1311,1312;1686;969;790;1556;402;1472;594,1197;594,1819;481,594;1254;594;544;1413;1898;637,3065;594;795;1472;1472;1924,1925;969;2556;1472;115;1543,3271,3272,3273,3274;1254;1687;1003;26,377,1688;1254;1254;548;416,574,594;1254;469,1203;469;1254;1131,2924;1472;594;2046;1254;411;553;115;411,2731;26,73;1472;548;1017,1018;1016;508;1472;1472;544;256;1637;1003;1003;1687;1687,1692;1685;2019;2176;26;2603;2333;29,508,1657,3326;594;435,591;594;2427;2045;594;1686;26,73;576,594,1077;594;1444,1457;1472;2508;115,1216;951,952;594;-27,-641;1775,1781,2380;1713;26,73;2661;1472;3498;401;594;390,455,909,910;1657;1255;1472;1472;602;2297;58;1297;1407;2974;70,71;434,435,436,437,438,439;435;394,1724,1725;394,1724,1725;394,1724,1725;383;433,434,435,436,437,438,439;594;394,1724,1725;394,1724,1725;394,1724,1725;394,1724,1725;394,1724,1725;394,1724,1725;472,473;394,1724,1725;1686;394,1724,1725;382,424,469;394,1724,1725;394,1724,1725;441;594;1472;2041;399;593;411,1472,2951;549,2598,2599;1647;359;441;2297;3264;1003;1767;1472;2876;1153;1472;111;416,2237;594;1516;26,27,28,29;29,548;26;605;29,548;3480;594;594;605;26;594;26;594;29,422,456,548,576,1440,1657;26;469;887;26,73;132;1063,1472;390,1003,1686,2723;1869;2654;3487,3488;1758,1759;1182;594;1640;2692;26;3480;594;887;2359;1687,2115;1472,1737;120,637,1330;484,714,969,1381;2246;1687,2115;1472;416,574,594;639;366,1685;1224;1003,1687;1472;1472;441;1763;1056;2271;2518;1516;1640;366,383,1684;594;1131;2069;1003;481;654,2090,2091,2092;991;1640;593;594;594;594;1472;1472;629,1512;548;351,1133,1134;390,508,1682;456,505,508,2126;1662,3303,3304;1472;708,2261,2838,2839;1771;1003;594;1949;455;1354;390,455,1689;1472;1472;377,546;309,310;1122;1640;120,637,1330;26,435,594;3565;3565;1558;2360,3231,3232;1003,1543;1973;1543;29,1543,1713;29;26,394,594,1370,1371,1516;694;515,516,517;1657;708;390,1687;1498;594;594,1685;637;517,1713;594;2462;816;1069,1689;26,29;2233;29,1687,2086;1685;26,401;501,963;1583;1686;548,1687;1472,1746;594;1413;594,1330;456;1481,1518,1519,1520,1521,1522,1523;371;1685;1030;363;2424;354;469;481;1536;359;1710,1738;471;1003;26,861,1816;594;115,139,1626;2740;1472;594;660,697,1685;390,1685;2654;818;570,1003;1472;363;1330;402;594;383;1472;548;594;1710;155,156,3418,3658;132,1330,1516;1767;1472;481,593;26,73;26,73;1003,1713;416;548;1394;120;26,1687;1640;366;1686;1472;621;1536,2177;594;594;1472;1459,1472,1559;999;1686;1344;481;637,3244;29;1686;1003;1543;26;26;1543;594;1713;1543,1713;1685;28;481,605,1686;1705;26,1003;336,1688;416,574,594;115,1757,2369;416,574;629,739,809;1686;594;837;411;469,594;1472;1254;2838;1543;1060;1472;26;1448;416,594;629;3646,3647;416;1251;1465;26,1713;240,241;26;1771,1782;1825;482;2324;3106,3107,3108;446,1036;1543,1686;58;416;1472;1640;1786;567;2642;1254;1707;1254;26,456;593;1472;1472;481;481,594;1003;1003;1003;876;26,1543;594;605;411;594;594;29;2086,2557;1254;1771,1782;1254;1640;2808;723;26,73;1688;416;26,73;1354;1730;2263;3674;390,455,913;582;416,574,594;841,2211,3179;444,594,818,2477;1472;1640;1723;594;1062;1685,1686,1687;1771;1902,2959,2960;943,1213;594;359;26;1051;1472;883;1685;1660;713;3681;26,401;3345;1742;2692;1242;411,1741,2759;632;26;3345;26;1472;424;390,1087;548;548;1543;1054;475,633,1336,1337,1338;631,1702;363,1116;1907;594;1093;2705;2433,2434;390,424,435,1516;394,1724,1725;394,1724,1725;2572;1640;951,952;1516;548;377;1407;1254;394,1724,1725;394,1724,1725;1472;394,1724,1725;394,1724,1725;394,1724,1725;1640;120;2539,2540,2541,2542;2995,2996;390,1687;2832;1685;2654;1640;1151,1189,2570;390,1087;1472;1472;1688;574;1102;123;2692;3059;1472;469,594;594;594;594;1472;1229;390,1087;26,642;1516;951,952;382,390,594;1654;552,554;390,469;1131,2759;390;594,3539,3540;464;594;469,663;763;390,508,1682,2176;594;390,508,1682,2176;434;2288;594;1317;594;26,401;594;469;594;1003;411,455,1030,1472,1498;84;3335,3336,3337,3338;1472;1767;1472;3608;1240;363;1640;1154;594;2490;1358;3099;390;383,1685;26;1685,1686;2692;1689;1936;1410;336;70,71;2421;3146;1472;637;1472;2368;594;1472;481;1162;1782;1472;1410,2677,2678,2770;1472;1640;377,390,594;3457,3458,3459,3460,3461,3462,3463;548;26,1543;796;1690;2881;455;3080;1472;818;402;382;1189;1254;1407;1686;1003;950;1787;1103;1640;1771;1108;1640;841;594;495;2838;594;1543;3112;2358;1189,1472;796;1961,1962;1472,1613;26;896;894;26,73;3345;3191;1144;594;1316;481;1205;132,3390,3391,3392,3393,3394,3395,3396;2970;1688;594;2300;594;1229;26,594;594;1254;2379;1472;26;553;548;1771;456;455,1388;814;1472;401,435,551;1476,1477,1478;390,1687;390,1687;594;621;1472;26,396;469,1229;2086;3216;3684;1254;841,1365,2595,2655;969;26;1771,1782;26,481,1684;2294,2520,2953,2954,2955,2956;505,2126;501,781;26,1686;553;1472;2905;1640;1472;1472;1771;26;456;692;115,411,2624,2625,3357;115,139,359,411,1017,2622,2623,3357;1687,2297;2290;1687;621;26,941,1810;3345;351,1133,1134;1472;26;29,1713;1684;1686;366,418,1107,1108,1109,1110,1543;26;26,418,1003,1543,1691,1919,1920,1921;581,582,605;1543;1771;1516;758;401,551,1657;390,1687;411,1557,1743,2315,2347;481;1108;2383,2384,2385,2386;26;359;132;605;1403,1404;838;1003,1543;1216;363;1472;1189;548,594,696;3629;1481,1622,2604;1688;1686;1685;811;1017,1018,1019;1358;26,418,1543,1691,1919,1921;1685,1686,1687;1319;1472;1452;1472;1910;1250;814;1472;1640;1472;1259;1063,1472;26;2654;594;951,952;469;390,469;709;1140;1830;26;411;978,1463,1464;637,3168;978,1463,1464;548;1472;1472;580;548;1472;26,1543;26,559,1057;115,1756,1757,2369;1039;1687,2115;1685;455,767,1553;111,204,205;26;1472;402;2246;1757;1394;979;822,1772;2318;3587,3588;2783;594;215,216;951,952;1003;221,222,223;1131;26,377,424,481;1472;1687,2115;115,2369;366,400,1259;594;594;3644,3645;1736;359;390,401;594;594;434,845;2603;574;627;390,416;26,941,1810;514;481;1943;26,383,501,1687,1699;2035;2654;1730;1640;1003;94,95;3625;390;70,71;1368;26,72,73;26,73;402;418;3072;594,2123;1472;594;790;1772;1772;115;26,1003,1543;29;949;1686;1686;455,1451;1003,1543;1684;26,73;363,1758,1759,1760;594;1472;1640;1254;1472;3235;26,73;1254;1472;424,1686;26,73;1394;1472;1686,2133;605;2288;594;3245,3246;26,3434,3435,3436;1688;1713;1713;2486;1003;456,508;1472;594;1472;1472;562,1453,1454;28;418,683,1003,1543;26,73;2262;1686;390,461,566;2654;1003;416,574;730,963;400;1543;1324;594;579;26;865;1459,1472,1559;3389;916;1394;1640;1640,1767,1771,1785,3040;115;582;790;1640;26;638;115;469,594,745;802,969,2615,2616;1728;3621;1657,3212;594;594,1657;594;594;2993,2994;2993,2994;2993,2994;2993,2994;2993,2994;2993,2994;2993,2994;2993,2994;2993,2994;2993,2994;2993,2994;2993,2994;2993,2994;2993,2994;2993,2994;2993,2994;2698;514,594;401;26,594;26,2980;1229;481;456;416,574,594;26,435,594;26,401,616;26,401;26,73;1409;594;383;2367;1472;1670;464;382,508;1687;2467;514;1472;1472;26,73;1613;435;2862;382,1670,1680;26;366,390;1820;733,734;1688;1003;1688;481,503,1157,1684;548;231,232,2168,2169,2170;1003;2414,2415;2415,2428;3221;1688;1686;1688;696,2099;1685;456,1686;1003;1583;1687;1687;1003;576,1991,1992,2283;1003;763;1761;548;1472;640,1605;411;594;120,906;1472;1685;1472;637;26,1003;594;26;1003;58,3424;26,120,441,1131;26;26,1003;139,1626;26;1583;1472;1543;2692;1640;1640;1254;763;26,1003,1919,1921;411,1741;26,418,1543,1919,1921;841,1354,1478,1514,1515,1516,1517;1330;1472;3058;1541;1472;1472;755;366;951,952;1670;1251;2000;2263;658;2466;508,551,1212;1003;402,594;411;26;411;814;637,1543;390,1687;1543,3271,3272,3273,3274;594;1713;29;1685;1543,3271,3272,3273,3274;1543,3271,3272,3273,3274;26;3276;1543;1472;594;1472;1543;1650;1517;3690;29;2215,2521;548;1640;1131;359;1557;26,1685;841;115,120;469;1767;2392;1964;1472;402;1180,2425;3443;1003;435;401,594;29,139,594,708,2218,2219,2220,2221;3426;763;1472;1640;420;983;1472;1408;672;1839;371;1640;1771;2965;2596,2597;1640;2470;1758,1759;1549,1572,1573;1685;1472;435;456;456;2062;594;1472;469,594;26;494;2066;1472;363;1640;1175;3398,3399,3400;1771;1472;1003;115,455,841,2680;1472;1472;1472;359;594;1103;1003;906;1472;469,663,1677;1131;1003;1685;435;594,1189;402;594,1472;2605;2603;1933;3111;1365;1995,1996;1667;1667;1472;1710;1003,1710;594;402;594;1331;1657,1959;1455;879,880;877,878;26,435,726,727,728;877,879;1618;1875,1876;1543;1003;58,3424;1640;1307;1251,1472;1767;1686;29,594;105,106;2788;351;987;1472;3675;2267;1472;1739,3195;2159;1189;571;571,796;571,1108,1502;1472;1472;1472;115,969;1771,1779;1686;2136,2137;1543;1784;1003;3187;115;1189,1575;3070;3542,3543;1472;111;26,696,990,1699;3480;390;637;1330;514,597,598,599,600;382,469,1670;2351;2440;1472;654;1472;1472;366,556,1701;390,455,767,992,1221;1668;1003;2379;2654;354;411;1123;417;1687;1229;2743;359,1344;1472;1685,2198;390,1687;594;665;1229;1472;594,3502;3504;2603;1131;802,1478,1480,1483,1484,1580;955,1472;3113,3114;588;562,1453,1454;455,1501,1502,1503,708;411,1478,1525,1526,1527,1528;1743,1744;26,1543;400,1003,1109,2535;811;1771;1330;366;3084;1614;1254;1358;29,548;1687;594;1640;594;135;1764,1765;363;29,594,2411,2412;1472;790;594;469,1516;1076;1771;26;1472;641,726;1472;1689;424,780;3519;501;58;115;841,2402,2403,2404;26,565;1300;2688;26,416,1543,1803;2025;1543;1695;594;1549,1572,1573;1472;26,1003;26,1359,1360;3078;1472;26,841,1330,1543;1472;1017,1018;548;1543,1593;28,790,1543;411,1741;1259;1472;26,867;779;58,3424;1640;1771,1782;26;395;390,1687;411,1294;1472;1771;1010;1543;1687;26;1003;26;605;1472;1254;1592;455,696;763;1472;1472;2420;470;1640;594;1472;1673;435;1472;1478,1576;373,376;455,1501,1502,1503,708;1247;1640;1473;481,626;1640;1263,1264;637,1472;26;441;1143,3508;1472;1687;26,605;594;416;26,383,567,3004;2654;553;26,2485,2486,3055,3056;1692;1787;1687;26;594;1543;1472;1472;411,2110,2401;2342,2343;441;1472;1229;418,1502;1131;26;1003;1874;1472;1472;1361;1407;248,251;1771;2639;2692;1472;2398,2399;2892,2893;1516;1472;1472;390,1687;3505;1394,2242;422,594,1108;505,2126,2444;594;594,3171;2304;469;594;435;58,418;115,1657;1003;1543;58;951,952;951,952;1562,1589;548;26;26,393,434,1198,1199;1640;441;1640;2043;1543,2043;1234,1235;841,1251,2069,2716,2717,2718;362,1159;770;2682;1800,1801;1800,1801;390,1687;1459,1559,1622;1472;837;1003;938;594;469,594;26;1472;970;1640;1215;553;1108;26,469;115,1741;548;1640;594;1472;842;509;906;115;1606;1254;26,481,549;1686;1686;1254;26;371,1771;1354;1713;1472;1254;481;377,383,416,475,701,702,1657;654;594;594;211;629;2128;1771;1086;1254;651,652,653;1254;469;3198;455;1042;1003,1687;1640;594;1687,2338;1685;1689;1692;594;363;1229;390;1472;2603;594;3569;26,2666;3028;29,2796;951,952;517,548;594;1675;1472;383,1687;3236;1640;1003,1808,1809;1809;411,1327;1686;1472;1472;390,1687;416,517,1432;1003;26;1472;594;1687;594;594;26,1546,1547;594;627;115,1756,1757,2369;763;594;763;648;756;1003,1713;1104,1808,1809;2006;609;1378;217,218,219;402;792;726;1003;763;746,747,748,1710;3315;1688;1472;1640;1407;26,1239;1239;394,1724,1725;394,1724,1725;574;394,1724,1725;394,1724,1725;394,1724,1725;433,434,435,436,437,438,439;394,1724,1725;3547;951,952;1472;2789;371,1771;1473;26,1688;411,2958;693;2517;1003;1159,1428;796,797;303;1603,2589;3574,3575;2425;391,841;1472;1003,1472;629;658;1108;455,767;951,952;594;637;26,1374,1716;927;605;594;594,2118;594,1722;594;28;605;1516;1108;2862;634;435;435;1444;359;508;1472;1063,1472;1973;1460,1461,1462;1778;1686;475;1800,1801;435;562,1453,1454;1729;351;2654;3516;1472;2078;1472;1472;1330;1472;120;640;26,559;1131,2337;1747;1771,1782;1472;456,548;979;658;1472;26;469;594;1472;2246;1255;1472;818;1472;1472;964,1191;1254;1685;1472;548;1472;1472;2113;1229;1472;790;982;1472;3139;2323;1407;1407;548;1640;424,434;1301;594;3622;1030;1698;1543;1687;1003;455;455;1472;883,925;3401;2027;1082;1374,1375,1715,1716;1330;115,1583;2277;637;946;1543;26,435;395;2887;1588;1771;455;629;963;26;1219;1254;1254;1425;3085;1472;1686;963,2449;594;469;469;2800;1200;15,325,326,327,328,329,330;1912;1405;383;1189;1688;1108;435,551;26;594;115,1757,2369;594;594;1640;401,594,2139;2527;1743,1744;594;26,662;596,1171;548;1249;548;3548;390,1687;26,469,484,485;1472;1472;548,637;548;1481,1483;1837;1472,1741;1640;115;1472;1640;3229;26,1817;26;26;1030;378,379,380;708;3664;883;1127;697;1227;115;632;790;1641;1640;1549,1572,1573;2891;1640;1640;411;26,115;402,1685;1543,3271,3272,3273,3274;1017,1018,1019;1472,1543;1003;1003;2063;26,383,1198,2298,2299;1923;26,2464;26,2464;120,26;26;26;26;2969;431,1003;2364;391;1686;1066;594;951,952;1388;1255;818;1407;1038;132;435;594;1640;1472;1686;1472;1640,1786;1640;1640;1588;1686;371;390;804,1640;637,3257,3258;139,388,1640;1472;1685,2143,2503;1686;390,1687;1003,1686;951,952;1685;1003,1686;2287;377;395,418,1003;594;1472;796;637;1003;390,1687;1640;593;1771;1685,1686,1687;1003;1131;1771;1472;1771;1440;1127;562,1453,1454;26,29,1543;2907;1472;594;1688;469;1412;469;2216;29;821;279;2379;841,1685;3497;1718,1719,1720,1721;2654;1771;359,1344;2934;1003;2043;160;1640;193;2441;1481;336;1990;1131;637,3514;2884;400,1003,1710;1472;3559;26,517,548,1713,2619;2619;1472;1729;26,418,1003,1699,1919,1921;1472;1687;796;1640;793;1973;1771;1685;29;1686;1543;594;1229;464;469;1254;29;1472;1472;1254;1063,1472;548;126,127;1543;1931;765;780,1917;1345,1346;2227;1767;3389;1684;1640;26;1685;1472;594;1771;1771;1254;1254;796;1407;377,929;1981;26,929;1686;29,517,548;548,841,1664,2632,2633;1472;1472;1407;108;3599;548;390,1687;26;1751;1640;2238;2543;456;632,778;28;632;1685;1690;26,395;1690;1685;3653;456;1361;658;383;394,1724,1725;434;3557;1583;26,728,1690;366,383,739,816,817;394,1724,1725;394,1724,1725;394,1724,1725;394,1724,1725;359;1867;2844;2235;26;26;1147,1148;441;115,2369;1472;1912;904;1687;29;594;594,650;1657;1516;594;594;390;435;508,594;390,508,1682;1657;594;594;594;390,508,1682;1229;514;390;469;2176;390,508,1682;763;434,1675,1676;456,508,564;416,574,594;763;469;26,377;26,377;1229;29,637;435;416,574,594;1472;656;594;26,411,771;1767;1688;1543;1543;1640;2606;740;534;1472;382;1472;1115;2875;1011;456,594;26;942;79,80,81,82,83;594;1003,1543,3136;1476,1477,1478;1108;1958;469;1472;1472;3343,3344;1688;382;2838;1640;517;951,952;1543,2127,3262;1690;1973;3402;698;26,1298,2486,3055,3056;658;1771,1782;382;1472;2862;26,577,578,1688;1472;2468;788;481;1472;26,685,1003;1104,1808,1809;594;1771,1782;1472;120;2945;1354;456,2352;26,469;29,1543,3265,3429;594;2546,3138;841;132;2925;594;166;390,1687;455,1532;594;594;469;29;26;594;1690;469;3075;469;605;120;398,401,551;248,249,250,251;441;1091;1685;1472;548;455;411,1741;1685;1688;1472,2361,2362;3148,3149;2855;1472;455;2192,2193,2194;411;594;26;390,1687;1472;1692;411;3477;115;548;1472;796;1472;481;1687;1251;1771;264;26;26;594;707;3570;2379;1236;3079;1687;456;456;1344;637;400;418;1767;796,1504;351,1133,1134;26,1687;2049;1688;1472;2853;366;1472;1472;594;594;629;431,1543,3403,3404;1003;708,814,1543;1003;1881,1882;29;416,574,594;26,424,1686;1543;431;26,28,984,1003,2715;1344;435;158;400;366,701,761,762;813;1472;1003;951,952;481;1688;411,771,808;594;2590,2591;841;1472;1472;469;594;1320;3283;29,548;1943;1686;1687;1472;26,418,1003,1919,1921;1472;580,688,1063,1548,1549;1109;1472;1260;115;363;1688;115,411;1472;594;1472;2835;2508;923;1750,2710;3200;1407;1968;1834;1254;26;1417,1771;674,675,1686,1687;1351;1771;1764,1765;336;115,2369;115,2369;1617;363;1787;2523;455;594;1771;1640;258;811;1543;26;1373;382,594,1125;1447;594;3118,3119,3120,3121,3122,3123,3124,3125,3126;637,3180,3182;424;1640;416,780,781;95,1627,1628,1629,1630,1631,1632;637;580;763;1131;1376;26,941,1810;688,1549,1572,1573;3409;548;1655;1771;1428;1254;1254;841;1771;1472;763;26;1060,2881;985;1686;1713;1472;1666;627;1428;1003;594;1205;26;2330;1472;1407;1254;1254;1772;594;391;2993,2994;1640;1640;1501,1703;455,708,1501,1594;26;1686;594;1254;1254;1365;29,1472;2217;594;2236;637,1256;435;26,1003,1374,1716;212;1003;1543,1713;1687;1696;656;1254;951,952;26,435;29;58,3424;593;115;725;594;1472;1472;1690;982;2697;1472;359;359;594,1686;390,1687;2156;505,730,731,963;637,1656;1003;26,366,418,503,504,1516,1543,1713;390,1687;2730;1543;1787;26;744;26;594;1916;2950;469;1242;1472;2082;2584;1254;1640;1685;1710;2983,2985;424,841,1686;26;58;296,1757;1472;336;1640;1254;3339,3340,3341,3342;2626;664;1795;29,1657;594;594,1108;2993,2994;2993,2994;2993,2994;2993,2994;2993,2994;2993,2994;2993,2994;619;951,952;1003;26,366,383,739;1003;594;834,1198;422;390,417,988,1189,1190;26;594;29;951,952;26,401;951,952;382;1543,2565;1640;26;1248;1472;1374,1375;1003;26;26,1688;1177;951,952;1472;382,508,594,1670;26,594;1688;1686;26;1472;1003;391;785,786;3281;1616;435;1543;1687;2414,2415;2415,2428;637,2310;1685;1713;1687;26;1686;696;685,1003,1696;1472;26;456,1670;26,1003,2271,2275,2276;1254;1688;1364;1688;1472;1472;2278;1685;469;640;469;469;1307;1472;26,455,767;1543;763;763;841;594;58,3424;965;1670;1472;594;1685;1686;841;1771;416;2209,2210;1298;434,626,2603;796;594;553,594,963;1516;481,739;1407;1242;3627,3628;919;1472;1904,1971;1543,3271,3272,3273,3274;115;1688;424;336,1728,3374;1687;1684;3354;416;1472;637,1550,1551,1552;1685,1686,1687;906;2211;594;2407;1743,1744;602;402;1472;411,1478,1525,1526,1527,1528;713;456;951,952;1686;115,411,2339,2340;1472;594;1771;1254;1749;2692;1233;95;593;1472;1771,1782;841,1063,1472,1531;115;1685;937;594;1472;1472;382,550,594;1472;1472;951,952;594;84,3102;401;1472;354;669;411,1478,1525,1526,1527,1528;1472;1640;411,2346;391;1151,1417,1472,1474,1481,2547;796,1504;1472;594,2101;594;1728;1671;1233;1640;594;594;366;435;1044,1677,3372;484,1076;1472;1472;58,3424;2603;951,952;1472;1472;2363;812,1478,1480,1484;115,411,2530;58,3424;3345;1771;594;401,435;2379;140;970;1771;726;861;457;434;115,116;359;1063;1407;641;594,963;2738,2739;1407;1472;1472;1472;1472;1707;28,571,1472,2981;1407;2928;395,594,633,2138;3187;26,481;1472,2294;1688;802,2691;26,998;1687;475;-27,-28,-29,-30,-1544;26,991,1699;382;1472;1472;1758,1759;3365,3366;594;501;3345;796;1640;26;836,2497;3076;1113;26;696;3197;58,685,3424;3155;748;1472;1543;58,3424;390,2371,2372;2722;1685;1380;1472;2733;1108;1472;120;26,730,882;2513;594;1553;811;716;1093;3091;2379;26;603,2613,2614;3190;3131;811;2564;2564;1543;1543;1649;424,1099;1898;567;3671;605;658;1640;411;1003;594;2658,2659;1472;1771,1782;688,3408;1212;793;763;763;402;2379;752,1685;1472;26,580;402;1743,1744;964;1685;1472;1771;1254;1640;1688;2014;1481;3508;841;390;395;501;862;2127;685,1003,1699,2127;976,2771,2772,2773,2774,2775,2776,2777,2778;26,941,1810;1254;1472;26,1546,1547;793;594;3631;2041;548;482;363;3137;790;395;395,685;1472;1189;402;2895;951,952;26,2460;1325,1326,1685;594;1003;1472;120;1686;1687;351,1133,1134;1997;841;416,574,594;1003;3519;594;1259;1254;469,594;1640;1472;1472;26;3263;1129;1584;637;1685;594,1687;26;1063,1472,1529;1030,1743,1744,1745;2085;1640;594,2101;594;1472;1178;1460,1461,1462;1472;418,1003,1543;26,455,594,790,1290;26,1003,2486,3055,3056;1472;1472;1459,1559,1622;1640;435;675,1003,1108;402;740;594;763;1131;841,3179;1472,2851;1516;2071;390,1687;2435;1472;791;2898;2847;469;26,73;26,73;70,71;26,73;26,73;26,73;26,73;26,73;26,73;26,73;594;484,951,952;641,2806;658;336;1472;469,1674;1800,1801;1800,1801;1800,1801;1800,1801;1800,1801;826;826;793;637;508,594;594,688,2951,3440;594;793;2165;481,1315,1543;85,3239,3240;1407;1472;115,1505,2501;2654;26,418,1687,1919,1921;841;1472;411,1478,1525,1526,1527,1528;2660;58,3424;1254;637,1593;1254;1254;780;1689;1787;3450;26,696;1251;2246;1254;1254;390,1687;1254;456;1254;456;1254;796;469;383,416,701;475;2926;389;886;1585,1586,1587;1472;435;1640;1444,1457;1685;1472;796;548;2654;469;1472;1640;860;1472;1685;1687;2585;26;763;897;1447;594;594;2796;548,594;594;594;594;594;508;435,594,1818,2095;594;594;508,594,2450;351,1133,1134;441,1440;1686;1543,1687,3271,3272,3273,3274;594,1684,1687,1696;26,2397;763;594;1003;888;1473;3192;2898;2175;594;3288;1472;422;1472;640,1607;1685;411,1382,1428,1613;411;120;402;594;935,1239;394,1724,1725;394,1724,1725;394,1724,1725;394,1724,1725;115;570,571;1609;1767,1773;26;1472;1472;762;3508;2289;793;1229;637,2602;26,1543;548;2240;672,1003,1472,1658;1472;1254;1260;1981;1472;1472;594;391;505,749,1041,2019,2020;26,941,1810;1251;594;26;594;548;508,594;594;26,2781,2782;1685,1686,1687;745,958,988;481;418,1543;411,548,1003,1505,1543,1573,3015,3016,3017,3018;475;1428;594;469;26;517;469;548;58;26;574;402;435;1472;1472;1003,3081;1687,2115;455,1354,1481;1640;391;548;1428,2110;1472;790;26;29;1341;1316;1472,1668;1771;1472;658;1143,3508;534;115;1407;26,27,28,29;1131;1771;594;115;1472;456;351,1133,1134;594;1640;424,434;424,434;424,434;424,434;424,434;424,434;1307;111;1261;26,377,391,424,503,829;402;1448;120;654,1189;435;311,312;637;1685;2032;26,1256,1662,1713,2880;2375;1640;1640;862,1165;434;2369;1472;84,1790,1791,1792,1793,1794,3013,3014;1640;1729;1685;548;1686;548;548;1003;26,548;1687;637;1710,1711;594;1421;547;1640;1472;26;1063,1478,1622;1130;418;660;390,1687;660;1640;366,1657;1640;1640;1472;1407;2211;390,508,1682,2176;2684;115,1911;1472;2681;351,1133,1134;660;594;1472;456,475,685,1381;1689;841;1407;841,1063,1472,1531;1502;351;416;951,952;2654;1713;355,356;1685,1686,1687,1688;1778;2596,2597;1767;3480;390,1687;26,1543;26,115,997,2804;1003;1638;1714;637,1543,2002;574,780;1006;353;1472;1771,1782;1472;366;594;1786;1472;2845;115;594,1197,2241;435;2083;435,2124;455;1472;1685;548;2665;1344;1254;27,1104,1687,1805;1684;1625;1472;2744;2054;1002;1640;1472;2500;594;1472;3237;1771,1782;1159;1472;1472;26;403,535;1254;1472;26;26;3518;1407;1472;26,1859;145;481;1344;401,551;1238;717;359;943,1428;411,1741;469;811;3622;2649;1686;3422;3050;1543;594;1307;1472;814;363;402;469;434,560,561,562;811;1254;1902,2959,2960;1472;1729;594;658;1472;26,401;26,382,469,484,501;1472;548,3506;455;1472;1764,1765;1472;637,2957;2835;551;1686;3545;26,1337;1686;466,482,594;466,482;594;3549;1764,1765;1472;2366;883;1381,1472;394,1724,1725;1771,1783;394,1724,1725;26,434;129,2004;3095;1686;1254;1254;1254;1472;1146;536,537;441;969;26,1694;27,1104,1687,1805,1808,1809;1274;26;1808,1809;26;27,1104,1805,1806,1807,1808,1809;501;1344;2878,2879;663;889;594;1229;951,952;434,466,468,469;658,1745;2300;3449;435;1189,1472;594,730;548,841,2632;390,508,1682;434;390,508,1682;390,508,1682;434,1675,1676;594;594;390,434,594;390,508,1682;594;390,508,1682,2176;26,594;594;512;594;416;469;2096;951,952;1472;1472;1543;58;1472;115,2377;1472;793;1472;26;3343;1472;284,285;210;518,519,520,521,522;518,519,520,521,522;481;1686;1686;594;1685;1543;1251,1472;841,1063,1472,1531;401,435,551;363;2862;1003,1472;1771,1782;1354;1444;841;411,1428;469;382,434,498,499,500,501;3210,3211;951,952;1771;811;594;3463;1472;594;594;501;1407;1771;2943;625;1640;1543;1688;1472;1407;2049;26;2526;1254;2600;1771;594;1254;2223;1472;2184;3087;26,29;29,582,3265;1685,1686,1687,1688;793;2741;594;2805;28,548,637,1543,3467;1394;790;793;811;115,1741;1787;1002,1684;26,481;1472;26;1472;2755;115,1757,2369;1472;411;799;1771,1782;672;26;1472;594;793;1003;1003;1003;359,2654;594;1685,1686,1687;594,1690;26;1818;730,963;2083;416;763;594;594;26,594,1516,2724,2725;594;551,1212;435,551;481;811;3250,3682;1743,1744;1543;766;505,1093;1472;2558;411;26,2122;1318;120,839;26,416,455,502,1417,1686;390;1665;1254;637,1883;793;1771;594,654;1568;1254;1729;1786;1771,2669,2670;1472;548;26;1254;383;2573,2574,2575,2576,2577;1330;1361,3526;2140;2489;2649;362;1640;501;29;181;841;1750;400,2488;418,1003;594;1472;1472;281,282,283;2375,2583;2946;28,1730;1858;1472;3593,3594;594;26;595,596,1688;637;3471;1543;29,582,1543,3265;1771,1782;1742;2120;366,701,761,762;435;1543,3271,3272,3273,3274;1472;26;26;1003;1472;2326;1932;654;1472;1543;1003,1543;1543;1686;1131;3496;1640;1358;1330;2734;1472;1472;475,1686;492;2341;1686;1017,1018,1019;1933;1472;841;29;951,952;763;951,952;2966;1344;2668;1003;812;2261;1170;2152;1787;371;351,1133,1134;594;1772;1543,1713;1543;475,586;1688;575,739,958;505,506;115,2369;1472;111;2151;2745;1686;1472;26;456,594,2634;1743,1744;1960;1003;139,359,369,841,1017,2622,2623;594;1407;395;1771;1003;359,1699,2549;478,1003,1543;814;418,1543;1472;1771;594;1771;1557;594;1508,1561;1229;1764,1765;1771;1472;811;1407;854;1481;1640;594;2608;763;1472;26,29,941,1810;1686;3439;6,15,325,326,327,328,330;1272,1640;811;1685;1254;1472;1254;120;1472;3009,3010;964,1969,2046,2129;390,988;1254;1254;1108;1254;1254;1472,1687;1901;1444,3213;639;1937;1123;390,456;1771;1254;1254;637,996,3185;1254;1103;26;1003,2601;1686;26,1498;1543;377;517,548,790;394,1724,1725;1543;686,2000;1751;139,1481;732,738;26;1472;26,1374;3178;605;1003;3683;594;1003,1686;26;1472;1472;1472;979;3104;594;469;1108;594;1686;26,366,503,504;626,1256,1713;1003,1686;26,469,484,1077;594,1003;696;897;553;553,897;758,759;1687;1640;1772;115,1468,1942;594;351,1640;1060;236,237;1472;1686;1771,1782;3384;1254;1685;1472;366;1254;1254;594;411,1428;1686;441;1771;26,548,841,1502;594;594;1344;1254;26;3339,3340,3341,3342;3648;3618,3619;3154;2854;26,29,1657;456;2087;1349,1613;1516;2993,2994;963;2993,2994;1284;548,594,616;401;26,435,594;26;763;401;508;763;733,736;1657;594;616,2086;951,952;548;1472;1771;2654;688,3408;411;594;464;26;593,658;1472;469;1472;435,643;2463;115;2176;425,3088,3089;733,736;1543;481,1003;26,1003,1686;503;1670;469;594;1670;1003;1003;1543;594;1030;637;594,1516;796,1504;1472;402;1448;796,1472,1535;1425;594;1003;2456;1824;1472;1472;1003;26;1543;841;594;1108,2038;1771,1782;594;1472;351;390,1687;390,1687;2654;1686;1472,2092;411;1255;951,952;1003;951,952;685,1003;594;679;841,969;2766,2767;1743,1744;1306,1733;115,416,594;2650;900;3109;548;1686;1472;1472;1472;1472;132,2529;351;1640;1472;1472;1472;654;632;3345;481;401,435,469,551;390,435,469,594;351;2803;1254;594;1229;1070;469;1688;1330;351;548,1472,1583;1685,1686,1687;1472;3659;1108,2021;594;390;456;1848;841,1063,1472,1531;1254;402;1254;594;401,505,2126;351,1133,1134;658;185,186,187;593;514,594;594;1189;2259;763;1472;354;1771,1782;390,456;390,456;390,456;29,637;503,1695;640;594;382;1472;1713;1543,1710;1472;1093,1362,1363;1472;1407;1640;317,318;418;366,1226;411;2406;1662;446,590;930,1508,1562,1563;26,435,878,880;26,877,878,879;730,2018;1472;3049;351;1407;418;1478,1480,1481;3470;594;906;1472;1472;1212;2788;2049;411,1428,2207,2208;3187;183;1050;1472,1554;1613;411,1741;1472;1543;1472;1472;1472;371,374;708;594;1472;1020,1021;1640,1771;788;2417;1229;1113;2024;1291;1472;1472;1472;841,1063,1472,1531;1172,1173;1472;2873;1472;1771,1782;382;594;336;455,1290;103,104,363;501;637,790,841,1668,1787,1848,1852,1853;363;469;811;1755;810,811;371;1771,1782;745;3532;155,156;155,156,3658;159;1771,1782;2967;1254;1254;1472;1354;1216;703,704,705;1684;1472;574;1472;2178;1472;1472;1772;814;658;1692;594;2056,2057,2058;1472;594;58;1472;3620;2379;26;805;1640;411,1478,1525,1526,1527,1528;1108;1131;1549,1572,1573;1472;1254;3406;1543;1973;847;26;2407;2788;26;2498;721;26;1472;1771;336;658;1251;373;3508;3596;1687;1543;418,1710;418;1472,1734;976,2771,2772,2773,2774,2775,2776;418,1543;1583;1472;1472;1472;1151,1478,1579,1580,1581,1582;1472;2684,2685;1003;594,2123;418;395;1963;1472;657;1003;95;1189;3038,3039;1356;594;594;793;1973;3003;1620;1610;3600;26,1543;26;1688;26,444,818,1999;26;1543;1472;26,1498;26,1588;1447;1472,1498;1771;1472;3630;1640;1131;1003;1771;1771;1003;1472;1543,3271,3272,3273,3274;261;594;1771;1003,1109;1472;455,1001;441,779;2139;366;1742;2654;1729;1472;26,401;594;1381,2294;1452;26,2679;1030,2015;1543;58,3424;2379;26,73;26,73;26,73;26,73;26,73;763;456;2042;26,29;1472;2692;926;287,1800,1801;1640;1800,1801;1800,1801;1640;377;1413;1394;1640;594;1428;594;402,434,867;26;1767;226,230;1640;411,1741;1254;2654;1640;3093;1640;1507;763;1516;115,2369;594;630;455;1254;1254;763;336,1657;431;1254;1472;951,952;636;1254;1254;1254;763;951,952;3480;763;763;172,173;1472;1472;1966;1472;1472;1640;1330;1229;629;594;1640;951,952;1622;763;508;594;1686;1472;461,3640;1640;1189,1583;963;594;26,28,29,594,1657,1713;469,594;2558;2848;481,1635,2017,2018;336;456,2002,2003;2083;594;594;2568;26,1322,2704,3025,3026,3027,3028;594,2055;482;594;594;391;763;336;1254;411;1543;1975;1472;411;818;932;978,1463,1464;443,508,801,802,803;594;401,435,551;951,952;763;2110;336;1640;986;2022;594;115,1472;1472;3224;982;3224;418,1543;2592;1003,1104,1808,1809;394,1724,1725;548;2677;1472;1640;139,1626;464;26;115;1787;115;469;411,1741;469;1687;517,548;951,952;763;2692;594;594;3480;3480;594;594;594;469;2067;1771,1782;793;1472;1472;26,27;3200;28;1685,1686,1687;2912,2913,2914;793;1686;1472;2223;951,952;621;1184;3571,3572;3082;1478,2971;1973;548;605;943;1472,1735;26,1835;2692;26,95,1501,1599,1600,1601,1602;1640;2246;1685,1686,1687;1640;1189;1685,1687;1684;359;411;533;1771;1472;3455;1472;393,1472;594;1143,3508;1724;1472;1640;2498;455;455,767;1354,2013;455;26,1543;1447;553,629,1466,1467,1468,1469,1470,1471;1472;3538;400,418,1688;1003;1685,1686,1687;115;363;1407;1771,1782;1685;2362;1543;469,594,951;29,1472;1472;1472;26,27,28,29;26,1256,1662,2880;1472;1472;811;273,274,1078,1079;802;2493;2426;1686;29;594;548;594;593;594;2988;594;142;1472;837;1472;593;2044;1472;115;115;84;594;26,1417,2214;26,594;1017,1018,1019;1189,1472,1543;1189,1472;411;1003;1189;26,1694;1003;26,1543;366,1657;366,1657;366,1657;475;1764,1765;1764,1765;1771,1782,1939;1254;811;1407;1640;351,1133,1134;1989;658;2654;115;548;402;2654;763;1374,1717;3141;594;594;505,506,616,1197;26,1713,1809;377,3420;26;1002;1713;377,424,1685;1687;394,2077;1688;1003;1686;934,935,936;1189,1472;1728;1472;1254;28,29,1710;1689;1189,1472;1640;390,469;594;1092;435,551;366,594,1543;594;416;1003;2174;435,551,1212;594;58,3424;26;594;1332;2226;1108;382,594;1543;1771;1787;1236;363;1472;3345;1771,1782;763;1003;594;115;2475;26,728;1101,1640;1472;1472;26;26,455,1685,2545;1472;403,508,3517;29;1472;1728;517,548,1472;401,594;1472;359;2176;594;1685;363;336;1472;1543,3520,3521;1108;2988,3492;1640;1401;2223;1054;2378;594;1472;1472;120,517,548,594,1688;1354,1481,3615;1189;2882;1254;621;452;1407;2498;26,548;2498;354;418;1501,1708,1740;1472;26,443,445;366,670;70;1686;1440;580;1700;1771;594;1330;1407;111;1472;594;1569,1570,1571;1131;3189;435;394,1724,1725;3129;353;351,1133,1134;548;508,594;394,1724,1725;394,1724,1725;366;1229;2539,2540,2541,2542;26;1030;115,2369;1395,1396,1684;1771;548,841,2632;390,508,1682;763;1036;2083;469,594;58,431,3282;594,1472;594;594;390,508,1682;508,1681,2176;390,508,1682;594;594;1108,1557;1442,1443,1444,1445;517;1428,2228,2520;28,424,1003,1685;1472;925;508,594;728;594;763;58,3424;1686;1787;1472;2082;2093;2093;2093;1472;1588;411,1307;1407;1472;1478,1480,1483,1484;1472;1743,1744;481;1015;1640;411,1741;1398;1767;3060;951,952;1771,1782;1472;1294;578,1688;1640;1472;1319;2425;3131;29;1640;1624;1472;1786;1407;1108,2011;3399;841;411;1472;455,1238,1489,1490;1401;594;592;1131,1685;594;1686;2534;1713;1771;1472;2362;763;594,2763;951,952;594;2255;336;951,952;594;594;1349,2627,2628;1350;1472;1686;2046;548;594,1743,1744;2769;1472;637;2910,2911;1472;1686,1687;1689;649;28;593;475;390,1687;1472;1771,1782;594;456,505,506,507;275;366;918;74,75,76;1254;1254;26,366,964;1956;1189;1229;1407;688,1543,2951;475,1771,2355;2381,2382;1472;3167;1687;1472;685;431;825;1767;2571;1685;336;1472;1472;302;2388;26,418,1003,1919,1921;1344;771,1472,2315;1543;363,364,365,1640;1472;1472;1472;1143,3508;26;1929;1687;2807;1108;899;951,952;745,1640;1472;1472;26,418,1003,1919,1921;26,418,1003,1919,1921;1472;658,1472;1641;1472;115,1472,1573,2663,2867,2868,2869,2870;2016;1425;1472;1472;1472;1472;1472;455,841;1472;401;951,952;594;469;594;117,118;120,1543;1472;1472;696,1685;431,1003,1710;400,1685,1686,1687,1688,1710;3388;1254;3228;161,162;1472;351;1772;2510;548,594;1472;84;1472;1771;1771,1782;1472;637;1771;811;58,366,1107,1108,1109;2049;115;613;594,2100;120;1685;26;1640;1408,2158;3209;1598;449;169;790;306;1472;359;1472;594,2086;594;1750;654,1472;402;1778;402;806;2836;1472;26,696,2460;1440;132;386,387,1640;1472;1407;1407;2761;2112;594;594;2813;1472,1743,1744;26,941,1810;1472;637;132;1543;26;29,3602;594,2123;26,1543;1254;1771;1687;789;120,1406;1254;336;2407;2410;1771;259,260;708,841;26;26;1407;3187;1472;1771;841;1472;1407;1472;1688;26;1472;594;26,418;29,637,930;2990;941;594;1179;26,443;435,469;951,952;460;3063;1543;26,401;29,594;1685;26,594;26,401;1543;1685;366;26,401;411;594;411,1741;517,548,1713;1640;961;1472,2752,2753,2754;1472;469;1640;1472;1472;1472;455,1290;1771;1771;359,796;1640;1472;359;58,3424;469;951,952;892;1738;1472;26;0,1,2,3,4,5,7,8,9,10,11,12,13,14,15,16,325,326,327,328,330;763;84;567;1354;594;1662;115;951,952;594;574;26,401;951,952;763;763;763;1685;1771,1782;1472;1689;658;562,1453,1454;1686;371;508,594;1472;382;1978;422,505,506;15,325,326,327,328,329,330;814;1686;1472;2049;594;26,1688;3491;2223;1003;469;1670;594,3377;29;26;1330;382;1437;1472;1688;295;1640;382,1670;988,1002;841;26,418,1691,1919;26,418,1691,1919;594;594;594;1472;763;1472;1640;1685,1686,1687;1827;1827;1472,2618,2975,2976;574,1167;2302;2163;1472;1472;336;26;951,952;1413,1425,1472,2713,2714;1472;441;658;653,867,1684;951,952;1472;26;1003;1254;115;1884;1472;841,1432;1407;1472;1229;642;132;1870;1764,1765;1472;1254;1027;959;2413;1407;1472;146;1640;1003;115,2369;1472;469;1189;1771;1254;1472;658;1472;951,952;594;26,455;390;594;26;594,730;594;1786;2988,3492;228,229;1771,1782;891;26;1771,1782;790;763;1753;1472;390,1243,1244;240,241;1307;1771;1640;1685;594;1472;594;517;810,811;548,730;1778;382;616,1197;1941;382;3345;1771,1782;1472;1254;841;1042;877,878,879,880;163,298;1216;749;1771,1782;26,460;1472;1686;359;594;418;390,455,1503,1685;2569;2943;1472;3345;1472;359;594;1472;1622;1640;1687;1003,1543;1686;394,481;1254;1238,1472;469;1472;2295;1472;1472;594;456;594;796,1472;26;366;58,3424;58;58,3424;2792;2952;411,1478,1525,1526,1527,1528;841;120;359;1540,1541;1251;1687;115;58,418;1472;26,403;508,594;359;1640;3627,3628;1543,3271,3272,3273,3274;1472;1108;1254;26;390;1229;1543,1713;26,1543;3345;1143,3508;469;796;336;1767;1219;2692,2693,2694;637,1472,1613;371;1687;1472;390,1687;1298,1411;1472;621;115,1757,2369;920;29,1472,2294;2548;351,1133,1134;811;696;763;1543;213,214;2423;1640;1472;1310;1686;1189;29,1256,3385;431;976,2771,2772,2773,2774,2775,2776;390,1687;1472;594;351;3407;594;2507,2508,2509;363;793;1750;508,594;594;1543;1189,1472;26,550,594;115,800;455,1582,2442;551;548;1384;1472;456;1597;2654;2198,2199;1003;1592;951,952;700;1063,1472;1472;1767;1771;1472;559;1543;1472;455;58,685;359;673;1472;456;594;1688;1349;763;390,1687;2089;1472;1472;548;26,401;1472;1640;1472;26;359;1472;1800,1801;1800,1801;1800,1801;1800,1801;1800,1801;1800,1801;1800,1801;1912;2407;1030;1472;508;1640;402;1344;1771,1782;1003;1472;1472;1640;1686;351,1133,1134;1977;1108;1472;359;594;1472;1543;1771,1782;1771;1472;2057,2058;26,1611;1254;411,1478,1525,1526,1527,1528;1254;1472;1254;1254;951,952;1254;763;2586;1472;351,1133,1134;1786;411,1741;776;1946;1242;2176;1472;384;1771;763;594;1330,1331;841;469;26,1546,1547;1771;1640;1771;26,2111;841,1623;1952,1953;1953;690;936;951,952;763;865;594;1771,1782;304;1063;1063,1573;1472;1685;1449,1450;1239;2607;1472;1349;1771;1502;1472;3639;391;1771;1534,1535;1543,3271,3272,3273,3274;653;1685;594;382;594;594;594;1771,1782;818;58,3424;351,1133,1134;1428;377;1686;1543;1472;359;26;3670;1472;1472;594;2505;1316;1254;1254;2837;1003;1771,1782;1472;906,1108,1976;1472;501,841;594,1054,2334;2036,2344;1472;1713;2942;994,995;1254;594;366;1771;517;120;351;1539;763;1713;1640;1472;1640;562,1453,1454;1472;-2888;3551;1472;1771;402;1640;548;1472;351;943;708;594;629;594;1688;26,27;26;841;1011;1472;594;363;1778;26,73;70,71;26,73;26,73;594;1685;763;366,1657;1472;139;1131;951,952;594;594;1472;2110;1472;1254;1003;26;26;1543;1543;1472;26;1003;455,767,1553;2536;1254;1472;1640;1472;239;1710;1003;238;2117;431,1003;371;411,1741;2963;763;1583;1771;418;1254;1472;763;763;26,401;1003;951,952;1433;1414;402;1472;1973;2568;2379;363;1640;1472;26;1640;658;629;469,594;594;359;790;1481;431,1003;459;469;1472;416,594;594;594;551,594;574;3691;481;1003;1158;1472;1254;1543,3271,3272,3273,3274;371;26;1472;911;2728;1472;431;1472;658;1093;1472;1771,1782;1472;411;594;1771;2842;26;818;2878,2879;29,1256,3385;2070;401,435,551;469;594;1472;84;26;469;1205,1211;763;550,1678;594;594;390;446;763;594;594;469;390,834;434,469,594;763;1657;943;1162;2110;58,3424;658;1742,2394;1472;411,1741;363,1771;2654;1640;1254;2028;1800,1801;100;3419;27;2654;793,1897;951,952;1472;772;1771,1782;115;1003;1472;1472;1472;411,2112;793;1543;1472;1472;1771;3378;390;1472;1472;658;3196;469,594;432;1472;26;351,1133,1134;84;1472;2272,2273,2274;3626;491;1214;1394;469;1640;1145;594;951,952;1229;2084;763;951,952;763;951,952;1229;594;569;551;951,952;28;115;594;594;26;26;1472;1003;594;1003;390;1686;455,767;1472;1786;2049;115,2369;363;390,1687;3115;366;621;1472;1640;418;1597;2625;3615;390,1687;26;1254;501,781;2799,2825;469,508;1472;359;111;1407;1543;1543;1389;1543;906;26;1254;26,1003,2727;401;469,594;1771,1782;2223;1686;1684;58,3424;1687;1543;58,3424;416,574,594;26,58;383,481,546,1688;1684;1344;26,418,1688,1691,1919,1920,1921;270,271,272;1108;234,235;594;26,1634,2718,3206;943;658;359;26,418,1003,1919,1921;476;2082;26,455,1003,1332;1444,1457;1472;841;434;1476,1477,1478;1637;637,1550,1551,1552;1767;1729;1772;621;1394,2309;29;1621;816;111;1228;1771,1782;1686;621;594;1799;1772;708;1472;26,1003,2831;402;383,574;1332;1772;115,793,2369;1472;1771;1254;1063,1472;1771,1782;622;872;352,2232;306,307;629;629;3345;1472;1472;1017,1018,1019;120,653,2784;390;790,1131,1251;1722;1686;2654;163;1254;3269;3071;138;1003;27;1472;95;1498;401;26;883;594;26,941,1810;26,1811,1812;336;2471;1472;900;1254;248,250;354;148;455,708,1501,1594;1771,1797;1797;481,1037;2654;1254;1254;1771;3148,3149,3150;26;26,2478;1771;411,1478,1525,1526,1527,1528;26;574;637,1501,2942,3233;1472;115;26;461,594,1677;1472;1543;1686;982;594;26,1546;26;594;26,2559;594;382,434,501,508,1075,1076,1077;26,1003;390,1687;1063;1543;17,18,19,20,21,22,23,24,25,342,343,344,345,346,347,348,349,350;1151;529,530;26;402;1543;548,841,2632;115;1640;1730;1772;763;1844;456,594;26;132;1472;1108;1771;1771;1472;1767,1786,1788;1751;796;132,262,263,371,1757;1254;3339,3340,3341,3342;3339,3340,3341,3342;17,18,19,20,21,22,23,24,25,342,343,344,345,346,347,348,349,350;951,952;2993,2994;594;951,952;951,952;594;951,952;951,952;382;1245,1967;548;594;594;1688;637;29;26,401;790;2121;1472;58,3424;1472;1472;1472;391;1692;435;1771,1782;390;390,393;594;1330;594;382;1022;1399,1400;26,418,1687,1919,1921;58;1254;2654;2683;1472;469;594;1003;2130;3100;1302;115,1756,1757,2369;1472;1472;1472;594;2351;1003;951,952;1543,3271,3272,3273,3274;951,952;672;1472;3480;1800,1801;411,1478,1525,1526,1527,1528;951,952;951,952;1472;3558;363;658;943;1771,1782;1640;266,267;351,1133,1134;1472;1771,1782;29,3410,3411;658;763;548,594;469;796,1472,1535;594;1771,1782;2934;763;26,523;594;1330,2874;534;366;767;2618;1131;2864;1472;377,1228;658;1254;594;1407;1472;26,27;418;1472;1771;1127;1254;951,952;26,1546,1547;1472;1472;2674;1472;2183;2815,2816,2817,2818,2819;1686;1108;2295;26,27;1472;1472;406;1688;391;1003;799;244;1743,1744;895;654;3275;1472;390,1687;1771;1640;627;1254;435;1543;1767;120,137,3581,3582,3583,3584,3585;1543;359;1476,1477,1478;1687;1472;1472;1472,1543;637,1668,1740,1849,1850,1851;811;811;760;493;802,1131;3345;315,316,351;115;1771,1782;359,708;351;1640;390,508,1682;1472;708,3345;658;1472;2285;2368;299,300;1472;1143,3508;3508;1472;574;1569,1570,1571;1689;594;1687;1472;1381,2395;1687;2049;1344;1640;1472;1472;26,29,548,1256,3385,3386;1498;594;1472;1472;390,508,1682;542;2671;976,2771,2772,2773,2774,2775,2776;2064,2065;455,1003,1238,1277;1472;1729;469;763;1472;2796;351;1543;1254;1003,3128;629;501;390;3287;978,1463,1464;951,952;2458,2459;904;594;1385;1254;1254;984;1771;455;763;763;26,1478;26;1743,1744;411,1478,1525,1526,1527,1528;1906;1254;658;416;594;730,731,963;411;132;3655;796,3098;469;411,1428;1113;688,841,1251,1381,2071;1472;583;469,478;416,574;382;2098;951,952;3044,3045,3046,3047;86,2927,2929,2930,2933;469,594;1003;1354;534;724;1407;1729;1640;1003,1104,1808,1809;390;3352;1472;1800,1801;1800,1801;435;2096;594;594,1472;1640;3617;627;508,1680;594;1003;763;1254;26;1472;1472;534;1254;763;594;2110;411,1741;1472;1543;1640;1472;115,2369;1731;351,1133,1134;1872,1873;951,952;1472;658;1472;1212;208,209;594;594,2055;2045;1216;1686;1771,2419;657;115;951,952;1472;1771;3345;115;411,1543,1743,3367;26;502,548,1046,1095,1685;1108;132;501;658;637,3438;3251,3252,3253;3251,3252,3253;3251,3252,3253;1640;1262;26;1472;2011;1472;402;1098;26,27;1063,1472;29;951,952;594;951,952;1926;3200;1800,1801;1254;1254;1254;1472;1314;1472;1472;1687,2115;594;26;2263;1472;1583;441;1472;1472;1640;1344;1640;440;1347,1348,1349;603;1472;351;336,455;1472;1472;1003,1543;1472;1685,1686,1687;1189,1472;658;455;629;26,27;1003;1204;351;2086;1472;1543;1254;951,952;1982;1472;1771;508,594;763;26;2356;951,952;2049;411,1741;3345;865;763;1472;790;1769;26;1472;1742;763;115;594;763;26,73;26,73;1686;1771;1640;3359;26,3257,3258;1687;1688;1472;1472;15,325,326,327,328,329,330;1472;866;1179,1216;138;351;390;594,1710;2379;1593;1472;3493;1686;763;1771;363;3148,3149;594;1786;2379;943;1472;456;1108;1028;390;366;1472;124,125;1472;1254;477;58,1003;510;594;763;1771;897;3427;658;2349;1641;1771;1472;1640;2086;1687;1758,1759;455;2079;469;2170,2979;3187;1354;29,1713;1472;1472;658;1771,1782;1472;2496;1808,1809;413,414;1543;605;1226;2069;1897;853;1543;594;951,952;594;1472;2176;594;1472;1472;26;1472;1066;1758,1759;811;951,952;1688;793;1003;1687;1472;26,455,1491;26;1444,1457;1973;1472;1472;2336;1938;435;58,3424;469;2093;2093;594;594;3356;469;1472;1332,1713,3007,3008;594;469;3368;1472;951,952;811;411,1741;1030;424;1686;1472;594;1063;1254;793;1472;402;411,1478,1525,1526,1527,1528;1063,1472;157;2049;1472;1472;1472;2229;26;841,1459;469;594;594;1693;1003;594;29,548;1472;1595;390,3667;1254;1548;1472;594;1771;351;841;1685;1557;1640;26,456;921,922;58,3424;1257;1472;1342;1472;3556;1472;2524,2525;1767;1543;1771;1003;1543;58,3424;26,418,1919,1921;58,3424;551;359;114;1381;26,400,418,1003,1919;1543;1684;1543;1543;1003;1472;58;411;120;1108,1472;26,27;1944;351,1133,1134;2211;594;2257;2049;1640;1472;796,1472,1535;1472;1472;1472;3230;2311;469;382;1433;1330;594;1472;441;1772;621;1585,1586,1587;147;2387;1786;1472;3546;1688;1688;1472;1242;1386,1387;1472;1771;1772;1472;481;1640;1476,1477,1478;872,2232;629,637;1472;115;594;2049;1472;594;26,1713,2046,3000;411,1478,1525,1526,1527,1528;594;594;26,2894;1333;763;763;1222,1472;469;3453;1771,1782;1640;841,1459;2263;120;1254;3015;1220,1251;796;142,143;1640;26;2813;1686;1640;58,418;115;3414;951,952;763;763;514,594;553;1131;517,1687;1472;1728;1472;115;1772;363;1841,1842;1238;1772;698,1358;1686;1472;359;1772;594;2176;390,508,1682,1683;416,574;951,952;763;120;594;1772;763;336;1472;351;1472;3415;115,3201;2800;1686;1688;390,393,489;1472;1251;26,418,1692,1919,1921;1935;508;26,418,1543,1919,1921;1108;1472;1472;594;1189;594;431;534;1543,3271,3272,3273,3274;1472;418;1800,1801;1174;1414;153;469;763;594;1472;594;3345;403,637;1472;943;1685;1472;708;2376;469;3479;1472;470;594;1640;1472;763;732;1472;792;1472;1500;411,1741;1254;763;621;1472;1771,1782;790;594;763;1472;390,456;621;1131;1771,1782;1640;1771,1780;877,878,881;3580;26,1724;1108;594;1743,1744;163,164;841;2318;2318;594;548;115;790;1685;2862;594;594;2203;1472;594;26,1546,1547;1936;895;411;58,3424;1228;3503;1472;1472;865;637,1550,1551,1552;1647;1254;1472;1131;951,952;2530;637;26,27,28,29;1059,1060;190,191;763;594;336;2643;1472;26,27;1108;1472;841;390,1687;1687;28,383,637;1472;115;1640;3643;1472;26;976,2771,2772,2773,2774,2775,2776;1472;1472;26,27;1472;371;1131;1344;1003;371,621;1254;1447;2631;637;837;469,600;3275;351,1133,1134;658;796,843;1472;594;26;416,574,594;1472;359,841;1472;26,359,411;469;2110;1003;951,952;508,594;1249;552,553;3397;2143;1472;115;1543;1254;2044;763;594;3613;1472;793;1800,1801;1800,1801;1800,1801;1800,1801;2393;402;1344;1472;548,1003,1543;1640;115,1557;793;1061;710;3234;821;1254;951,952;1472;26;26,73;26,73;26,73;763;1640;1439;1254;469;562,1453,1454;1685,1686,1687;1447;417;1426,1427;951,952;371;763;796;1584,2074;115,411,1331,1492,1493;29,456,548,2255;951,952;551;951,952;763;371;1251;122;1994;391;2504;2112;26;2654;115;763;351,1133,1134;763;574;594;1472;1472;26;841;1472;1472;411,2001;638;1472;1472;411,1478,1525,1526,1527,1528;1524;1640;1254;1478,1576;416;1131;594,2856;154;26,27;763;951,952;26,27;991;1800,1801;26,27,28,29;548,594,1543;2322;594;2225;2086;594;1472;627;26,27,28,29;354;1687,2115;763;351,1133,1134;1472;594;1786;1729;1254;1254;1143,3508;84;1640,1771;1729;844;517;1472;790;455;26,455,1577,1578;1003;1640;1281;1472;3204,3205;1771;2049;1254;1472;1254;26,27;1068;354;3379;1557,1743,1744;411,1478,1525,1526,1527,1528;1768;1734;1143,3508;1640;1771;594;3188;1254;95,3597,3598;505,2126,2444;594;2654;1472;1003;951,952;594,1105;1640;1472;2759;594;1245;1472;1472;120;2042;1472;1713;811;363;1686;26;402;95,3560;2335;883;382,594;1402;1003;551;435;2654;2654;1357;1640;1254;951,952;1472;363;951,952;2049;481;548;2123;1472;594;607,608;593;943;1689;1254;1241;1382;1771;594;351;837;1354;548,1684;469;605;1367;574;1472;1472;1472;1640;2756;596,697;1388;1973;1904;594;951,952;115;3556;26;3193;26,1543;680;1472;3507;26,1546,1547;1502;390,508,1682;763;548;390,508,1682;832,833;421;1339;2888;621;602;390,1687;1685;1472;2813;1472;763;2421;1729;2093;2093;1098;1472;1472;3086;594;1472;1254;1428;811;1472;2257;1771,1782;594;2125;26,27;115;1472;1472;1472;26,27;412,594;841,1063,1472,1531;1771,1782;1254;363,1266,1640;2058;469;402;115;26,27;26,456;951,952;594;434,435,859;763;1003;594;1472;1472;351,1133,1134;1771,1782;1472;1002;26,964,1969,1970;1472;1786,3183,3184;1003;1472;411,1478,1525,1526,1527,1528;441;1771;2799,2824,2825;416;58;1692;58,3424;248,1590,1591;1687;26,418,1919;1472;548;1254;1472;26,418,1003,1919,1921;1686;1771;1472;1238;1648;390,455,767;621,1772;1771;469,594;594;1771,1782;958;658;1771;1685;1472;351,1133,1134;1640;1476,1477,1478;811;1472;1771;594;982,1106;1472;1687;366,1713,2046;478;672;594;1472;1686;1687;3644,3645;1254;1472;359;1394;594;594;1254;548,594;2389;390,1687;1767;1254;1771;1254;502;594;351,1133,1134;26;1216;534;1472;424,594,641;1771;1742;526;1433;594;1772;548,1472;763;763;200,201,202;1160,1161;1886;3173;26,418,1543,1919,1921;1458;1543;1771;366,1686,1687;26,1686;115;1640;351,1133,1134;1771;951,952;904;1771;1308;134;1003,2535;1640;1565,1566,1567;3654;3339,3340,3341,3342;26,790;115,1757,2369;1472;1472;401;951,952;951,952;2812;951,952;2741;115;1686;1472;1613;1640;906;637;658;26,418,1691,1919;897,1189;3383;1407;2813;469,594;1355;594;1428;391;1685,1686,1687;401,1229;1472;594;415;1108;951,952;1687;1472;594;1689;906;26;2918;1472;441;1254;1688;1771,1782;1229;26;951,952;469;359;26;411,1741;3345;895,1155;1472;1640;469;26,27;763;1254;1749;3654;1444,1457;1444,1457;390,456;371;26,27;130;1472;2654;26,1498;1771;594;594;1472;1472;1472;1254;2318;1472;594;405,406,407;454;456,991,1198;469;3345;382;1254;594;213,214;2049;1685;1229;897;3414;1472;501;390,1687;1290;893;594;1771;1686;115;951,952;1543;1424;1254;1640;594,1472;2069,2418;26,481,503;1472;1771,1782;-3631;1034;1143,3508;1472;115;2700,2701,2702;1640;1472;441;1472;613;351;1003;841,1410,2677,2678;2820,2821;1729;1593;1344;1344;1344;841,1063,1472,1531;1771;26,3052;698;695,2243;3207;562,1453,1454;1818;1472;2556;3099;594;841;1472;1070;26,1057;26;1689;951,952;115,2369;1543;1767;2038;627;1750;115;2654;594;841;629;868;1345;574;27,1104,1687,1805;1472;763;1472;763;1640;763;469;163,182;906;763;1254;1800,1801;1800,1801;1800,1801;1800,1801;1344;593;1472;790;87,88,89;1344;26,73;1254;1254;1254;351,1133,1134;1771,1782;1003;1229;2179;1771,1782;3148,3149;1640;1472;1254;790;1472;1894;1472;548,1722,2019;951,952;84,1603;1472;1472;26;1688;98,3259;1179;359;469,508;1771,1782;411,1478,1525,1526,1527,1528;621;951,952;763;1472;1179;456;1472;594;2145;1771,1782;1472;1472;1472;1251;366;982,1321;951,952;594;26,27;2654;2225;594;1254;1254;1254;1473;1771,1782;763;1640;1771;1254;1472;1472;1472;411,1478,1525,1526,1527,1528;994,995;578,632,994,995;793,847;3110;1472;1771;3147;707;1108;26,27;790;115;1458;1472;1472;763;594;351;2357;3672;951,952;1738;1750;943;2093;594;26,27,28,29;2011;383;635;139,1216;1640;2083;1771;1472;363;1687;3561;621;401;1017,1018,1019;969,2041,2109;1472;594;1953;1381;1472;469;416,574,594;594;377;441;1640;377;1066;1189;26,27;1771;560;594;593;865;411,1478,1525,1526,1527,1528;1771,1783;594;179,180;1800,1801;3144;2844;29;2878,2879;444,818,2553;943;951,952;1771;951,952;594;594;469,594;943;943;1063,1472;456,514;1472;1472;1459,1472,1559;594;2093;391;594;501;594;1686;1238;1786;26,27;1254;418;26,27;1543;26;1472;1229;1640;1472;580;1472;1108;1251;1472;1472;629;3225;708;2647;1472;1687,1692;1472;951,952;951,952;1472;1472;624;368,369,370,1472;2629;1003;3567;58,3424;2757;594;1771;594;1425;58,3424;548;1472;2032;793;3490;1771,1782;1543;1254;3376;1685;26,418,1691,1919,1921;58,3424;26,418,1691;594;1688;1771;115,411,2530;763;26,696,1687;1686;26,418,1003,1919,1921;1472;336;1687;320,321;658;1771;1472;1149;1772;947;3080;811;1772;677,678;1771,1782;1686;1472;872,2232;1372;1818;1472;951,952;951,952;594;1042,2649;1771;1205,1206,1207,1208,1209,1210,1211;763;1472;351,1133,1134;1472;1108;1685;3009,3010;3064;1640;1254;1771,1782;1685,2200;863;26;1472;3086;1472;1771;120;1713;26;390;26;1543;1472;1640;1772;1640;1225;1254;411,1478,1525,1526,1527,1528;1757;1425;1472;390,508,1682;1189,1472;594;2083;951,952;951,952;951,952;1669;621;1771;1081;594;26;1131;26;2624;883;1472;435;782;2083;26,401;594;1472;1472;951,952;1603;1516;1516;1472;1472;1108;1472;951,952;1472;26,115,441;1771,1782;391;1253;943,1957;3067;548;841,1063,1472,1531;2443;594;763;1476,1477,1478;351;390,1472;1330;1472;658,855;790;1472;658;865;26,73;594;2078;673;2654;594;594;26;1472;1771,1782;1685;1771;1543;1003;1472;796;2049;1771,1782;1472;3053;435;1003;2692;1472;27;1472;120;26,2531;1472;-3631;594;796;2536;1238;548;1472;115;26;1472;594;594;373,1640;1003;1201,1202;658;594;3573;26;508;1640;594;26,73;26,73;26,73;1003;351,1133,1134;26,2110;3528,3529;2150;1042;115;441;861,1003;354;763;1472;1948;841;1472;359;1743,1744;1686;26,1543;1530;594;546;1472;790;1800,1801;1800,1801;1800,1801;1800,1801;1800,1801;1800,1801;968,969;1771;567;26,73;26,73;26,73;26,73;26,73;26,73;26,73;26,73;26,73;26,73;1472;858;1685;402,441;1072;594;1254;1085;1686;371;1472;1472;351;594;1472;351,1133,1134;1640;469,1229;351,1133,1134;2654;1472;951,952;951,952;371;1472;1640;1588;895;1686;1422,1423;351;1472;991;1254;1640;1472;708;336;3508;1143,3508;1143,3508;1143,3508;2370;1472;411,1478,1525,1526,1527,1528;402;841,1063,1472,1531;351;2263;1229;3437;351,1133,1134;1447;1687;441,846;-1064,1533;1063;26,27;658;1458;1472;594;763;1254;26,27;1743,1744;1640;26,27;1003;841,1063,1472,1531;951,952;943;1768;1771,1782;1640;1684;1367;1637;390,732;351;796,1472;1472;2546;441,456,594;1947;26,435,775;1472;3345;1352,1353;1045;1100,1640;1640;951,952;637,3611,3612;2877;1472;1771,1782;763;763;951,952;336;811;1057;359;658;920;1288;-2936,-2937,-2938,-2939,-2940;3595;269;26,1543,2978;359;617;1472;434,1675,1676;943;629;1472;26;621;594;2093;1472;2654;26,27;455,767;354,1089;336;1771,1782;1640;708,1472;26,27;373,376;1640;418;1686;1472;840;26,27;1472;351,1133,1134;435;1640;165;1472;593;26;26,594;402;220;594;951,952;58,3424;1476,1477,1478;636;416,637,938,1687,2472,2473;26,418,1003;411,1478,1525,1526,1527,1528;3563,3564;1472;1472;1472,3092;621,1772;594;1472,1734;26;594;1771;29;1369;1081;1772,2027;1771;1472;1771;790;351,1133,1134;1771;594;58;469;411,1478,1525,1526,1527,1528;95;1904;2899;1472;1378,1472;351,1133,1134;1254;1657;594,1657;390,735;382,508,594;1754;1729;793,1772;1640,1645;1242;1003,3348;481;456;26;1686;793;1640;951,952;841;1771;469;1472;1688;1472;1670;594;1772;763;15,-27,325,326,327,328,329,330;351,1133,1134;366,834;1472;924;1071;391;1685;2425;1640;441;1437;658;594;658;1472;2988,3492;594;594;441;1472;371;1189;1366;1254;951,952;594;132,534,3428;796,2296;1729;29;1771;411,1428;1437;26,1543;1378,2040;1831,2787;26;1472;1472;1143;1472;481;351;1743,1744;2308;594;1472;841,1063,1472,1531;1456;26,27;1472;1472;1472;2630;366;859;26,27;1344;2487;26,73;2487;26,73;594;351;2365;501;402;594;951,952;2849;763;1472;1640;402;1800,1801;1800,1801;-746,1800,1801;1800,1801;1800,1801;1800,1801;1800,1801;1800,1801;1800,1801;1800,1801;1437;1729;416,574,594;1472;621;469;1640;594;763;1640;1472;1254;371;802;1640;1640;1472;1771;951,952;594;1472;2430;1472;1189;3033;2240;1472;411,1741;1472;982,3030,3031;991;132,139,3643;1459,1472,1559;1254;1472;1472;1254;1254;1254;895;1472;1472;627;763;951,952;26,481;1254;441;2039;1665;1685;26;1472;1254;585;1472;26,73;26,73;2597;594;120,709;26,27,28,29;544,1055;1472;3489;553;2260;1472;594;1472;1687;1254;943;1108;1640;58,3424;658;1294;1771,1783;1729;2147;943;2049;2756;213,322;1254;3445,3446;2093;2093;811;1543;1229;2391;1472;1640;811;3551;1444,1457;1431;26,73;26,73;26,73;26,73;26,73;26,73;26,73;26,73;508,594;594;120,653;1254;1238;1729;1943;58,3424;932;1145,1289;594;594;1472;658;1472;1472;26;1317;1543;1543;2011;481;763;1472;26,418,1003,1919,1921;418;577,578;1729;1472;1444,1457;917;1739;1472;1732;3044,3045,3046;1472;1472;1771,1789;115;811;3005;1771;26,27;1472;1229;402;1771;391;811;2186;1447;1484;115;763;26,27,28,29;2057,2058;3348;594;1046;26,1003;594;1685;1640;1640;481;811;1640;1472;1472;3533;478;1729;627;26,369,1198;1686;417;3445,3446;416;464;790;594,1003,1472;58,3424;2946;567;1768;2049;1684;732;594;1229;1836;874;1472;594;484;441;1688;3140;629;1223;2429;1534,1535;508,594;1543;1472;26,27;594;2312;1543;1447;548;1472;1472;354;1640;658;402;325,326,328,2852;1767;951,952;435;3170;951,952;26,73;1003;1472;2630;2630;943;1800,1801;1800,1801;1800,1801;1800,1801;1800,1801;2654;1640;594;455;402;594;593;2687;1472;1472;951,952;1771,1782;2788;594;594;951,952;1254;1254;1254;790;3031;26,27;26,27,29;120,475;943;1254;1254;1254;1472;26,27,28,29;1930;1304;1472;2035;1254;455;1472;292;1472;2794,2795;1472;790;1354;1254;95,1628,1629,1630,1631,1632;1472;1245;411;1472;26,1685;1472;1472;951,952;1434;3345;1064;1254;920;2059;943;117,192;627;1254;1800,1801;1800,1801;2093;811;351,1133,1134;1472;594;371;1640;1729;594;441;1585,1586,1587;354;1478,1576;2011;1052;1640;354;351,1133,1134;268;1895;1472;1771,1782;351;594;2997;1771;1771;1771;58,3424;359;1354;1327;1772;1108;115;115;1771;790,1728;226,230;2176;594,1472;917;1472;441;1640;26,1699,1921;26,27,28;790;26;26,27,28,29;26,27;382;1729;1800,1801;594;1640;2654;1800,1801;351,1133,1134;1472;2654;1640;3445,3446;2536;917;802;1228;3550;1472;790;637,1543;3508;-1499;351,1133,1134;594;277,278;441,484;469;1686;26,73;1472;1767;1472;1472;594,915;1472;2228;1800,1801;1800,1801;1800,1801;1800,1801;1472;1640;29;26,27,28,29;2787;621;26,481,1686;1472;594,2181;1254;2353;1079,1262;1684;708;351;26,27;627;943;1437;26,27,28,29;315,3662;1472;3665;593;26;1922;790;658;1354;2320;2766,2767,2768;26,73;26,73;26,73;26,73;26,73;26,73;26,27;1254;1640;1543;1472;1640;1472;534;373;594;895;3208;1472;907;1764,1765;1254;1730;418;1035;26;26,2978;818;818;1472;943;943;790;1771,1782;3509;351,1133,1134;469;115,2689;1800,1801;392;1437;920;594;594;401;26,27;1729;1472;1472;1428;26,418,1919,1921;1472;1472;1444,1457;1230,1640;1772;351,1133,1134;621;1472;1772;27;1298;2416;1472;790;441,1108;366;1772;1640;1472;951,952;1687;1729;3203;872;26,1083,1084;1640;2291;26,1688;658;1472;1472;1543,3220;1254;1640;390;1472;1472;2679;1686;1543;594;411,1741;1472;514,627;2532;351,1472;363;1771;627;1472;1472;26;2251,2252;2579;1640;594;456;943;1472;1472;1800,1801;1800,1801;1800,1801;1800,1801;841,1330;1640;1640;1758,1759;484;3445,3446;594;1472;411,1741;1686;1472;657;26,27;26,27;1800,1801;906;1640;402;1640;1685,1686,1687;951,952;26,27,28;790;1640;1472;1640;1695;2654;1892,1893;1472;2877;1472;1640;543;324;26;1800,1801;454;818;1750;3568;943;632;1800,1801;391;1003;1472;2654;1254;26,27;1384;629;1108;594;1437;26,73;26,73;26,73;26,73;26,73;1771;1251;1649;1771;1772;351;1772;1771,1782;1472;763;2161;3186;2675;594;194,195;1686;1684;411,1478,1525,1526,1527,1528;594,2123;1298;841,1063,1472,1531;359;1640;2563;1543,3271,3272,3273,3274,3275;26,27,28,29;1472;1332;3445,3446;411,1741;1354;2353;594;391;1771;1472;2172;1472;115,2369;1242;1017,1018,1019;1979;120;1800,1801;1800,1801;1800,1801;1800,1801;1800,1801;1800,1801;152;26,27;26,27;26,27;26;1472;2007;371;658;441;2877;1640,3048;621;594;1472;1182;1771,1783;1771,1783;895;1429;593;1800,1801;3175;1688;84;1472;1472;811;1472;351;26,2679;475;3151;26,818;594;1771;566;95;1354;351,1133,1134;1472;1743,1744;26,646,647;2123;790;2213;1292;26,73;26,73;26,73;26,73;1800,1801;1472;629;351,1133,1134;26;1114;1472;1472;1254;351;501;1335,1687,1692;1472;1472;1771;3508;917;1472;1640;790;1800,1801;1800,1801;1640;141;2057,2058;501;26,27,28,29;1685,1686,1687;3445,3446;1685;3515;492;2877;1189;1800,1801;1688;58,3424;3105;402;1729;2654;1640;1189;1472;371;167,168;1108;1472;2695,2696;2533;1686;1354;359;1640;1640;26,27;1472;1472;319;2554,2555;1800,1801;1472;3445,3446;1472;1845,1846;390;3508;1713;1472;562;1800,1801;411,862;354;708;1472;593;790;391;3405;1472;793;1800,1801;351,1133,1134;363;337,338,353,354,3676;58;26;26;1472;2049;1472;1472;339,340;1472;1800,1801;3445,3446;422,455,767,1688;351,1133,1134;1472;1472;366,593;3445,3446;3445,3446;629;3358;115;757;1437;115;594;27;1543;26,1198,1238,1727;790;1437;1117;3058;1472;1687;3445,3446;2528;351;1392;2822,3037;1472;390,455,767;593;1354;3445,3446;1391;1543;441;3445,3446;1472;26,27,28,29;3445,3446;1688;2362;1771;1354;3445,3446;1640;790;790;26;1948;27;26;3445,3446;594;977;1472;3447;1640;1772;1472;1472;84;416,593;1800,1801;139,1626;898;3445,3446;27;1800,1801;481;906;3277;1472;402;3445,3446;930;802;594;3445,3446;1472;3445,3446;26,73;26,73;26,73;26,73;26,73;1472;206,207;26,73;26,73;26,73;26,73;26,73;26,73;26,73;26,73;26,73";

const $scriptletHostnames$ = /* 13157 */ ["j.gs","s.to","3sk.*","al.ly","asd.*","bc.vc","br.de","bs.to","clk.*","di.fm","fc.lc","fr.de","fzm.*","g3g.*","gmx.*","hqq.*","kat.*","lz.de","m4u.*","mt.de","nn.de","nw.de","o2.pl","op.gg","ouo.*","oxy.*","pnd.*","rp5.*","sh.st","sn.at","th.gl","tpb.*","tu.no","tz.de","ur.ly","vev.*","vz.lt","wa.de","wn.de","wp.de","wp.pl","wr.de","x.com","ytc.*","yts.*","za.gl","ze.tt","00m.in","1hd.to","2ddl.*","33sk.*","4br.me","4j.com","538.nl","9tsu.*","a8ix.*","agf.nl","aii.sh","al.com","as.com","av01.*","bab.la","bbf.lt","bcvc.*","bde4.*","btdb.*","btv.bg","c2g.at","cap3.*","cbc.ca","crn.pl","d-s.io","djs.sk","dlhd.*","dna.fr","dnn.de","dodz.*","dood.*","eio.io","epe.es","ettv.*","ew.com","exe.io","eztv.*","fbgo.*","fnp.de","ft.com","geo.de","geo.fr","goo.st","gra.pl","haz.de","hbz.us","hd21.*","hdss.*","hna.de","iir.ai","iiv.pl","imx.to","ioe.vn","jav.re","jav.sb","jav.si","javx.*","kaa.lt","kaa.mx","kat2.*","kio.ac","kkat.*","kmo.to","kwik.*","la7.it","lne.es","lvz.de","m5g.it","met.bz","mexa.*","mmm.dk","mtv.fi","nj.com","nnn.de","nos.nl","now.gg","now.us","noz.de","npo.nl","nrz.de","nto.pl","och.to","oii.io","oii.la","ok.xxx","oke.io","oko.sh","ovid.*","pahe.*","pe.com","pnn.de","poop.*","qub.ca","ran.de","rgb.vn","rgl.vn","rtl.de","rtv.de","s.to>>","sab.bz","sfr.fr","shz.de","siz.tv","srt.am","svz.de","tek.no","tf1.fr","tfp.is","tii.la","tio.ch","tny.so","top.gg","tpi.li","tv2.no","tvn.pl","tvtv.*","txxx.*","uii.io","upns.*","vido.*","vip.de","vod.pl","voe.sx","vox.de","vsd.fr","waaw.*","waz.de","wco.tv","web.de","xnxx.*","xup.in","xxnx.*","yts2.*","zoro.*","0xxx.ws","10gb.vn","1337x.*","1377x.*","1ink.cc","24pdd.*","5278.cc","5play.*","7mmtv.*","7xm.xyz","8tm.net","a-ha.io","adn.com","adsh.cc","adsrt.*","adsy.pw","adyou.*","adzz.in","ahri8.*","ak4eg.*","akoam.*","akw.cam","akwam.*","an1.com","an1me.*","arbsd.*","babla.*","bbc.com","bgr.com","bgsi.gg","bhg.com","bild.de","biqle.*","bunkr.*","car.com","cbr.com","cbs.com","chip.de","cine.to","clik.pw","cnn.com","cpm.icu","crn.com","ctrlv.*","dbna.de","delo.bg","dict.cc","digi.no","dirp.me","dlhd.sx","docer.*","doods.*","doood.*","elixx.*","enit.in","eska.pl","exe.app","exey.io","faz.net","ffcv.es","filmy.*","fomo.id","fox.com","fpo.xxx","gala.de","gala.fr","gats.io","gdtot.*","giga.de","gk24.pl","gntai.*","gnula.*","goku.sx","gomo.to","gotxx.*","govid.*","gp24.pl","grid.id","gs24.pl","gsurl.*","hdvid.*","hdzog.*","hftg.co","igram.*","inc.com","inra.bg","itv.com","j5z.xyz","jav.one","javhd.*","jizz.us","jmty.jp","joyn.at","joyn.ch","joyn.de","jpg2.su","jpg6.su","k1nk.co","k511.me","kaas.ro","kfc.com","khsm.io","kijk.nl","kino.de","kinox.*","kinoz.*","koyso.*","ksl.com","ksta.de","lato.sx","laut.de","leak.sx","link.tl","linkz.*","linx.cc","litv.tv","lnbz.la","lnk2.cc","logi.im","lulu.st","m4uhd.*","mail.de","mdn.lol","mega.nz","mexa.sh","mlfbd.*","mlsbd.*","mlwbd.*","moin.de","mopo.de","more.tv","moto.it","movi.pk","mtv.com","myegy.*","n-tv.de","nba.com","nbc.com","netu.ac","news.at","news.bg","news.de","nfl.com","nmac.to","noxx.to","nuvid.*","odum.cl","oe24.at","oggi.it","oload.*","onle.co","onvid.*","opvid.*","oxy.edu","oyohd.*","pelix.*","pes6.es","pfps.gg","pngs.gg","pnj.com","pobre.*","prad.de","qmh.sex","rabo.no","rat.xxx","raw18.*","rmcmv.*","sat1.de","sbot.cf","seehd.*","send.cm","sflix.*","sixx.de","sms24.*","songs.*","spy.com","stape.*","stfly.*","swfr.tv","szbz.de","tj.news","tlin.me","tr.link","ttks.tw","tube8.*","tune.pk","tvhay.*","tvply.*","tvtv.ca","tvtv.us","u.co.uk","ujav.me","uns.bio","upi.com","upn.one","upvid.*","vcp.xxx","veev.to","vidd.se","vidhd.*","vidoo.*","vidop.*","vidup.*","vipr.im","viu.com","vix.com","viz.com","vkmp3.*","vods.tv","vox.com","vozz.vn","vpro.nl","vsrc.su","vudeo.*","waaaw.*","waaw1.*","welt.de","wgod.co","wiwo.de","wwd.com","xtits.*","ydr.com","yiv.com","yout.pw","ytmp3.*","zeit.de","zeiz.me","zien.pl","0deh.com","123mkv.*","15min.lt","1flix.to","1mov.lol","20min.ch","2embed.*","2ix2.com","3prn.com","4anime.*","4cash.me","4khd.com","519.best","58n1.com","7mmtv.sx","85po.com","9gag.com","9n8o.com","9xflix.*","a2zapk.*","aalah.me","actvid.*","adbull.*","adeth.cc","adfloz.*","adfoc.us","adsup.lk","aetv.com","afly.pro","agefi.fr","al4a.com","alpin.de","anoboy.*","arcor.de","ariva.de","asd.pics","asiaon.*","atxtv.co","auone.jp","ayo24.id","azsoft.*","babia.to","bbw6.com","bdiptv.*","bdix.app","bif24.pl","bigfm.de","bilan.ch","bing.com","binged.*","bjhub.me","blick.ch","blick.de","bmovie.*","bombuj.*","booru.eu","brato.bg","brevi.eu","bunkr.la","bunkrr.*","cam4.com","canna.to","capshd.*","cataz.to","cety.app","cgaa.org","chd4.com","cima4u.*","cineb.gg","cineb.rs","cinen9.*","citi.com","clk.asia","cnbc.com","cnet.com","comix.to","crichd.*","crone.es","cuse.com","cwtv.com","cybar.to","cykf.net","dahh.net","dazn.com","dbna.com","deano.me","dewimg.*","dfiles.*","dlhd.*>>","doods.to","doodss.*","dooood.*","dosya.co","duden.de","dump.xxx","ecac.org","eee1.lat","egolf.jp","eldia.es","emoji.gg","ervik.as","espn.com","exee.app","exeo.app","exyi.net","f75s.com","fastt.gg","fembed.*","files.cx","files.fm","files.im","filma1.*","finya.de","fir3.net","flixhq.*","fmovie.*","focus.de","friv.com","fupa.net","fxmag.pl","fzlink.*","g9r6.com","ganool.*","gaygo.tv","gdflix.*","ggjav.tv","gload.to","glodls.*","gogohd.*","gokutv.*","gol24.pl","golem.de","gtavi.pl","gusto.at","hackr.io","haho.moe","hd44.com","hd44.net","hdbox.ws","hdfull.*","heftig.*","heise.de","hidan.co","hidan.sh","hilaw.vn","hk01.com","hltv.org","howdy.id","hoyme.jp","hpjav.in","hqtv.biz","html.net","huim.com","hulu.com","hydrax.*","hyhd.org","iade.com","ibbs.pro","icelz.to","idnes.cz","imgdew.*","imgsen.*","imgsto.*","imgviu.*","isi7.net","its.porn","j91.asia","janjua.*","jmanga.*","jmmv.dev","jotea.cl","kaido.to","katbay.*","kcra.com","kduk.com","keepv.id","kizi.com","kloo.com","kmed.com","kmhd.net","kmnt.com","kpnw.com","ktee.com","ktmx.pro","kukaj.io","kukni.to","kwro.com","l8e8.com","l99j.com","la3c.com","lablue.*","lared.cl","lejdd.fr","levif.be","lin-ks.*","link1s.*","linkos.*","liveon.*","lnk.news","ma-x.org","magesy.*","mail.com","mazpic.*","mcloud.*","mgeko.cc","miro.com","missav.*","mitly.us","mixdrp.*","mixed.de","mkvhub.*","mmsbee.*","moms.com","money.bg","money.pl","movidy.*","movs4u.*","my1ink.*","my4w.com","myad.biz","mycima.*","myl1nk.*","myli3k.*","mylink.*","mzee.com","n.fcd.su","ncaa.com","newdmn.*","nhl66.ir","nick.com","nohat.cc","nola.com","notube.*","ogario.*","orsm.net","oui.sncf","pa1n.xyz","pahe.ink","pasend.*","payt.com","pctnew.*","picks.my","picrok.*","pingit.*","pirate.*","pixlev.*","pluto.tv","plyjam.*","plyvdo.*","pogo.com","pons.com","porn.com","porn0.tv","pornid.*","pornx.to","qa2h.com","quins.us","quoka.de","r2sa.net","racaty.*","radio.at","radio.de","radio.dk","radio.es","radio.fr","radio.it","radio.pl","radio.pt","radio.se","ralli.ee","ranoz.gg","rargb.to","rasoi.me","rdxhd1.*","rintor.*","rootz.so","roshy.tv","saint.to","sanet.lc","sanet.st","sbchip.*","sbflix.*","sbplay.*","sbrulz.*","seeeed.*","senda.pl","seriu.jp","sex3.com","sexvid.*","sflix.fi","shopr.tv","short.pe","shtab.su","shtms.co","shush.se","slant.co","so1.asia","sport.de","sport.es","spox.com","sptfy.be","stern.de","strtpe.*","svapo.it","swdw.net","swzz.xyz","sxsw.com","sxyprn.*","t20cup.*","t7meel.*","tasma.ru","tbib.org","tele5.de","thegay.*","thekat.*","thoptv.*","tirexo.*","tmearn.*","tobys.dk","today.it","toggo.de","tokon.gg","trakt.tv","trend.at","trrs.pro","tubeon.*","tubidy.*","tv247.us","tvepg.eu","tvn24.pl","tvnet.lv","txst.com","udvl.com","uiil.ink","upapk.io","uproxy.*","uqload.*","urbia.de","uvnc.com","v.qq.com","vanime.*","vapley.*","vedbam.*","vedbom.*","vembed.*","venge.io","vibe.com","vid4up.*","vidlo.us","vidlox.*","vidsrc.*","vidup.to","viki.com","vipbox.*","viper.to","viprow.*","virpe.cc","vlive.tv","voe.sx>>","voici.fr","voxfm.pl","vozer.io","vozer.vn","vtbe.net","vtmgo.be","vtube.to","vumoo.cc","vxxx.com","wat32.tv","watch.ug","wcofun.*","wcvb.com","webbro.*","wepc.com","wetter.*","wfmz.com","wkyc.com","woman.at","work.ink","wowtv.de","wp.solar","wplink.*","wttw.com","ww9g.com","wyze.com","x1337x.*","xcum.com","xh.video","xo7c.com","xvide.me","xxf.mobi","xxr.mobi","xxu.mobi","y2mate.*","yelp.com","yepi.com","youx.xxx","yporn.tv","yt1s.com","yt5s.com","ytapi.cc","ythd.org","z4h4.com","zbporn.*","zdrz.xyz","zee5.com","zooqle.*","zshort.*","0vg9r.com","10.com.au","10short.*","123link.*","123mf9.my","18xxx.xyz","1milf.com","1stream.*","2024tv.ru","26efp.com","2conv.com","2glho.org","2kmovie.*","2ndrun.tv","3dzip.org","3movs.com","49ers.com","4share.vn","4stream.*","4tube.com","51sec.org","5flix.top","5mgz1.com","5movies.*","6jlvu.com","7bit.link","7mm003.cc","7starhd.*","9anime.pe","9hentai.*","9xbuddy.*","9xmovie.*","a-o.ninja","a2zapk.io","aagag.com","abcya.com","acortar.*","adcorto.*","adsfly.in","adshort.*","adurly.cc","aduzz.com","afk.guide","agar.live","ah-me.com","aikatu.jp","airtel.in","alphr.com","ampav.com","andyday.*","anidl.org","anikai.to","animekb.*","animesa.*","anitube.*","aniwave.*","anizm.net","apkmb.com","apkmody.*","apl373.me","apl374.me","apl375.me","appdoze.*","appvn.com","aram.zone","arc018.to","arcai.com","art19.com","artru.net","asd.homes","atlaq.com","atomohd.*","awafim.tv","aylink.co","azel.info","azmen.com","azrom.net","bakai.org","bdlink.pw","beeg.fund","befap.com","bflix.*>>","bhplay.me","bibme.org","bigwarp.*","biqle.com","bitfly.io","bitlk.com","blackd.de","blkom.com","blog24.me","blogk.com","bmovies.*","boerse.de","bolly4u.*","boost.ink","brainly.*","btdig.com","buffed.de","busuu.com","c1z39.com","cambabe.*","cambb.xxx","cambro.io","cambro.tv","camcam.cc","camcaps.*","camhub.cc","canela.tv","canoe.com","ccurl.net","cda-hd.cc","cdn1.site","cdn77.org","cdrab.com","cfake.com","chatta.it","chyoa.com","cinema.de","cinetux.*","cl1ca.com","clamor.pl","cloudy.pk","cmovies.*","colts.com","comunio.*","ctrl.blog","curto.win","cutdl.xyz","cutty.app","cybar.xyz","czxxx.org","d000d.com","d0o0d.com","daddyhd.*","daybuy.tw","debgen.fr","dfast.app","dfiles.eu","dflinks.*","dhd24.com","djmaza.my","djstar.in","djx10.org","dlgal.com","do0od.com","do7go.com","domaha.tv","doods.pro","doooood.*","doply.net","dotflix.*","doviz.com","dropmms.*","dropzy.io","drrtyr.mx","drtuber.*","drzna.com","dumpz.net","dvdplay.*","dx-tv.com","dz4soft.*","eater.com","echoes.gr","efukt.com","eg4link.*","egybest.*","egydead.*","eltern.de","embedme.*","embedy.me","embtaku.*","emovies.*","enorme.tv","entano.jp","eodev.com","erogen.su","erome.com","eroxxx.us","erzar.xyz","europix.*","evaki.fun","evo.co.uk","exego.app","eyalo.com","f16px.com","fap16.net","fapnado.*","faps.club","fapxl.com","faselhd.*","fast-dl.*","fc-lc.com","feet9.com","femina.ch","ffjav.com","fifojik.*","file4go.*","fileq.net","filma24.*","filmex.to","finfang.*","flixhd.cc","flixhq.ru","flixhq.to","flixhub.*","flixtor.*","flvto.biz","fmj.co.uk","fmovies.*","fooak.com","forsal.pl","foundit.*","foxhq.com","freep.com","freewp.io","frembed.*","frprn.com","fshost.me","ftopx.com","ftuapps.*","fuqer.com","furher.in","fx-22.com","gahag.net","gayck.com","gayfor.us","gayxx.net","gdirect.*","ggjav.com","gifhq.com","giize.com","globo.com","glodls.to","gm-db.com","gmanga.me","gofile.to","gojo2.com","gomov.bio","gomoviz.*","goplay.su","gosemut.*","goshow.tv","gototub.*","goved.org","gowyo.com","goyabu.us","gplinks.*","gsdn.live","gsm1x.xyz","guum5.com","gvnvh.net","hanime.tv","happi.com","haqem.com","hax.co.id","hd-xxx.me","hdfilme.*","hdgay.net","hdhub4u.*","hdrez.com","hdss-to.*","heavy.com","hellnaw.*","hentai.tv","hh3dhay.*","hhesse.de","hianime.*","hideout.*","hitomi.la","hmt6u.com","hoca2.com","hoca6.com","hoerzu.de","hojii.net","hokej.net","hothit.me","hotmovs.*","hugo3c.tw","huyamba.*","hxfile.co","i-bits.io","ibooks.to","icdrama.*","iceporn.*","ico3c.com","idpvn.com","ihow.info","ihub.live","ikaza.net","ilinks.in","imeteo.sk","img4fap.*","imgmaze.*","imgrock.*","imgtown.*","imgur.com","imgview.*","imslp.org","ingame.de","intest.tv","inwepo.co","io.google","iobit.com","iprima.cz","iqiyi.com","ireez.com","isohunt.*","janjua.tv","jappy.com","japscan.*","jasmr.net","javbob.co","javboys.*","javcl.com","javct.net","javdoe.sh","javfor.tv","javfun.me","javhat.tv","javhd.*>>","javmix.tv","javpro.cc","javup.org","javwide.*","jkanime.*","jootc.com","kali.wiki","karwan.tv","katfile.*","keepvid.*","ki24.info","kick4ss.*","kickass.*","kicker.de","kinoger.*","kissjav.*","klmanga.*","koora.vip","krx18.com","kuyhaa.me","kzjou.com","l2db.info","l455o.com","lawyex.co","lecker.de","legia.net","lenkino.*","lesoir.be","linkfly.*","liveru.sx","ljcam.net","lkc21.net","lmtos.com","lnk.parts","loader.fo","loader.to","loawa.com","lodynet.*","lookcam.*","lootup.me","los40.com","m.kuku.lu","m4ufree.*","magma.com","magmix.jp","mamadu.pl","mangaku.*","manhwas.*","maniac.de","mapple.tv","marca.com","mavplay.*","mboost.me","mc-at.org","mcrypto.*","mega4up.*","merkur.de","messen.de","mgnet.xyz","mhn.quest","milfnut.*","miniurl.*","mitele.es","mixdrop.*","mkvcage.*","mkvpapa.*","mlbbox.me","mlive.com","mmo69.com","mobile.de","mod18.com","momzr.com","moontv.to","mov2day.*","mp3clan.*","mp3fy.com","mp3spy.cc","mp3y.info","mrgay.com","mrjav.net","msic.site","multi.xxx","mxcity.mx","myaew.com","mynet.com","mz-web.de","nbabox.co","ncdnstm.*","nekopoi.*","netcine.*","neuna.net","news38.de","nhentai.*","niadd.com","nikke.win","nkiri.com","nknews.jp","notion.so","nowgg.lol","nozomi.la","npodoc.nl","nxxn.live","nyaa.land","nydus.org","oatuu.org","obsev.com","ocala.com","ocnpj.com","ofiii.com","ofppt.net","ohmymag.*","ok-th.com","okanime.*","okblaz.me","omavs.com","oosex.net","opjav.com","orunk.com","owlzo.com","oxxfile.*","pahe.plus","palabr.as","palimas.*","pasteit.*","pastes.io","pcwelt.de","pelis28.*","pepar.net","pferde.de","phodoi.vn","phois.pro","picrew.me","pixhost.*","pkembed.*","player.pl","plylive.*","pogga.org","popjav.in","poqzn.xyz","porn720.*","porner.tv","pornfay.*","pornhat.*","pornhub.*","pornj.com","pornlib.*","porno18.*","pornuj.cz","powvdeo.*","premio.io","profil.at","psarips.*","pugam.com","pussy.org","pynck.com","q1003.com","qcheng.cc","qcock.com","qlinks.eu","qoshe.com","quizz.biz","radio.net","rarbg.how","readm.org","redd.tube","redisex.*","redtube.*","redwap.me","remaxhd.*","rentry.co","rexporn.*","rexxx.org","rezst.xyz","rezsx.xyz","rfiql.com","riveh.com","rjno1.com","rock.porn","rokni.xyz","rooter.gg","rphost.in","rshrt.com","ruhr24.de","rytmp3.io","s2dfree.*","saint2.cr","samfw.com","satdl.com","sbnmp.bar","sbplay2.*","sbplay3.*","sbsun.com","scat.gold","seazon.fr","seelen.io","seexh.com","series9.*","seulink.*","sexmv.com","sexsq.com","sextb.*>>","sezia.com","sflix.pro","shape.com","shlly.com","shmapp.ca","shorten.*","shrdsk.me","shrib.com","shrink.yt","shrinke.*","shrtfly.*","skardu.pk","skpb.live","skysetx.*","slate.com","slink.bid","smutr.com","son.co.za","songspk.*","spcdn.xyz","sport1.de","sssam.com","ssstik.io","staige.tv","strms.net","strmup.cc","strmup.to","strmup.ws","strtape.*","study.com","swame.com","swgop.com","syosetu.*","sythe.org","szene1.at","talaba.su","tamilmv.*","taming.io","tatli.biz","tech5s.co","teensex.*","terabox.*","tfly.link","tgo-tv.co","themw.com","thgss.com","thothd.to","thothub.*","tinhte.vn","tnp98.xyz","to.com.pl","today.com","todaypk.*","tojav.net","topflix.*","topjav.tv","torlock.*","tpaste.io","tpayr.xyz","tpz6t.com","trutv.com","tryzt.xyz","tubev.sex","tubexo.tv","turbo1.co","tvguia.es","tvinfo.de","tvlogy.to","tvporn.cc","txori.com","txxx.asia","ucptt.com","udebut.jp","ufacw.com","uflash.tv","ujszo.com","ulsex.net","unicum.de","upbam.org","upfiles.*","upiapi.in","uplod.net","uporn.icu","upornia.*","uppit.com","uproxy2.*","upxin.net","upzone.cc","uqozy.com","urlcero.*","ustream.*","uxjvp.pro","v1kkm.com","vdtgr.com","vebo1.com","veedi.com","vg247.com","vid2faf.*","vidara.so","vidara.to","vidbm.com","vide0.net","videobb.*","vidfast.*","vidmoly.*","vidplay.*","vidsrc.cc","vidzy.org","vienna.at","vinaurl.*","vinovo.to","vip1s.top","vipurl.in","vivuq.com","vladan.fr","vnuki.net","voodc.com","vplink.in","vtlinks.*","vttpi.com","vvid30c.*","vvvvid.it","w3cub.com","waezg.xyz","waezm.xyz","webtor.io","wecast.to","weebee.me","wetter.de","wildwap.*","winporn.*","wiour.com","wired.com","woiden.id","world4.eu","wpteq.org","wvt24.top","x-tg.tube","x24.video","xbaaz.com","xbabe.com","xcafe.com","xcity.org","xcoic.com","xcums.com","xecce.com","xexle.com","xhand.com","xhbig.com","xmovies.*","xpaja.net","xtapes.me","xvideos.*","xvipp.com","xxx24.vip","xxxhub.cc","xxxxxx.hu","y2down.cc","yeptube.*","yeshd.net","ygosu.com","yjiur.xyz","ymovies.*","youku.com","younetu.*","youporn.*","yt2mp3s.*","ytmp3s.nu","ytpng.net","ytsaver.*","yu2be.com","zataz.com","zdnet.com","zedge.net","zefoy.com","zhihu.com","zjet7.com","zojav.com","zovo2.top","zrozz.com","0gogle.com","0gomovie.*","10starhd.*","123anime.*","123chill.*","13tv.co.il","141jav.com","18tube.sex","1apple.xyz","1bit.space","1kmovies.*","1link.club","1stream.eu","1tamilmv.*","1todaypk.*","1xanime.in","222i8x.lol","2best.club","2the.space","2umovies.*","3dzip.info","3fnews.com","3hiidude.*","3kmovies.*","3xyaoi.com","4-liga.com","4kporn.xxx","4porn4.com","4tests.com","4tube.live","5ggyan.com","5xmovies.*","720pflix.*","8boobs.com","8muses.xxx","8xmovies.*","91porn.com","96ar.com>>","9908ww.com","9animes.ru","9kmovies.*","9monate.de","9xmovies.*","9xupload.*","a1movies.*","acefile.co","acortalo.*","adshnk.com","adslink.pw","aeonax.com","aether.mom","afdah2.com","akmcloud.*","all3do.com","allfeeds.*","ameede.com","amindi.org","anchira.to","andani.net","anime4up.*","animedb.in","animeflv.*","animeid.tv","animekai.*","animesup.*","animetak.*","animez.org","anitube.us","aniwatch.*","aniwave.uk","anodee.com","anon-v.com","anroll.net","ansuko.net","antenne.de","anysex.com","apkhex.com","apkmaven.*","apkmody.io","arabseed.*","archive.fo","archive.is","archive.li","archive.md","archive.ph","archive.vn","arcjav.com","areadvd.de","aruble.net","ashrfd.xyz","ashrff.xyz","asiansex.*","asiaon.top","asmroger.*","ate9ni.com","atishmkv.*","atomixhq.*","atomtt.com","av01.media","avjosa.com","awpd24.com","axporn.com","ayuka.link","aznude.com","babeporn.*","baikin.net","bakotv.com","bandle.app","bang14.com","bayimg.com","bblink.com","bbw.com.es","bdokan.com","bdsmx.tube","bdupload.*","beatree.cn","beeg.party","beeimg.com","bembed.net","bestcam.tv","bf0skv.org","bigten.org","bildirim.*","bloooog.it","bluetv.xyz","bnnvara.nl","boards.net","boombj.com","borwap.xxx","bos21.site","boyfuck.me","brian70.tw","brides.com","brillen.de","brmovies.*","brstej.com","btvplus.bg","byrdie.com","bztube.com","calvyn.com","camflow.tv","camfox.com","camhoes.tv","camseek.tv","canada.com","capital.de","cashkar.in","cavallo.de","cboard.net","cdn256.xyz","ceesty.com","cekip.site","cerdas.com","cgtips.org","chiefs.com","ciberdvd.*","cimanow.cc","cityam.com","citynow.it","ckxsfm.com","cluset.com","codare.fun","code.world","cola16.app","colearn.id","comtasq.ca","connect.de","cookni.net","cpscan.xyz","creatur.io","cricfree.*","cricfy.net","crictime.*","crohasit.*","csrevo.com","cuatro.com","cubshq.com","cuckold.it","cuevana.is","cuevana3.*","cutnet.net","cwseed.com","d0000d.com","ddownr.com","deezer.com","demooh.com","depedlps.*","desiflix.*","desimms.co","desired.de","destyy.com","dev2qa.com","dfbplay.tv","diaobe.net","disqus.com","djamix.net","djxmaza.in","dloady.com","dnevnik.hr","do-xxx.com","dogecoin.*","dojing.net","domahi.net","donk69.com","doodle.com","dopebox.to","dorkly.com","downev.com","dpstream.*","drivebot.*","driveup.in","driving.ca","drphil.com","dshytb.com","dsmusic.in","dtmaga.com","du-link.in","dvm360.com","dz4up1.com","earncash.*","earnload.*","easysky.in","ebony8.com","ebookmed.*","ebuxxx.net","edmdls.com","egyup.live","elmundo.es","embed.casa","embedv.net","emsnow.com","emurom.net","epainfo.pl","eplayvid.*","eplsite.uk","erofus.com","erotom.com","eroxia.com","evileaks.*","evojav.pro","ewybory.eu","exeygo.com","exnion.com","express.de","f1livegp.*","f1stream.*","f2movies.*","fabmx1.com","fakaza.com","fake-it.ws","falpus.com","familie.de","fandom.com","fapcat.com","fapdig.com","fapeza.com","fapset.com","faqwiki.us","fautsy.com","fboxtv.com","fbstream.*","festyy.com","ffmovies.*","fhedits.in","fikfak.net","fikiri.net","fikper.com","filedown.*","filemoon.*","fileone.tv","filesq.net","film1k.com","film4e.com","filmi7.net","filmovi.ws","filmweb.pl","filmyfly.*","filmygod.*","filmyhit.*","filmypur.*","filmywap.*","finanzen.*","finclub.in","fitbook.de","flickr.com","flixbaba.*","flixhub.co","flybid.net","fmembed.cc","forgee.xyz","formel1.de","foxnxx.com","freeload.*","freenet.de","freevpn.us","friars.com","frogogo.ru","fsplayer.*","fstore.biz","fuckdy.com","fullreal.*","fulltube.*","fullxh.com","funzen.net","funztv.com","fuxnxx.com","fxporn69.*","fzmovies.*","gadgets.es","game5s.com","gamenv.net","gamepro.de","gatcha.org","gawbne.com","gaydam.net","gcloud.cfd","gdfile.org","gdmax.site","gdplayer.*","gestyy.com","giants.com","gifans.com","giff.cloud","gigaho.com","givee.club","gkbooks.in","gkgsca.com","gleaks.pro","gmenhq.com","gnomio.com","go.tlc.com","gocast.pro","gochyu.com","goduke.com","goeags.com","goegoe.net","gofilmes.*","goflix.sbs","gogodl.com","gogoplay.*","gogriz.com","gomovies.*","google.com","gopack.com","gostream.*","goutsa.com","gozags.com","gozips.com","gplinks.co","grasta.net","gtaall.com","gunauc.net","haddoz.net","hamburg.de","hamzag.com","hanauer.de","hanime.xxx","hardsex.cc","harley.top","hartico.tv","haustec.de","haxina.com","hcbdsm.com","hclips.com","hd-tch.com","hdfriday.*","hdporn.net","hdtoday.cc","hdtoday.tv","hdzone.org","health.com","hechos.net","hentaihd.*","hentaisd.*","hextank.io","hhkungfu.*","hianime.to","himovies.*","hitprn.com","hivelr.com","hl-live.de","hoca4u.com","hoca4u.xyz","hostxy.com","hotmasti.*","hotovs.com","house.porn","how2pc.com","howifx.com","hqbang.com","hub2tv.com","hubcdn.vip","hubdrive.*","huoqwk.com","hydracdn.*","icegame.ro","iceporn.tv","idevice.me","idlixvip.*","igay69.com","illink.net","ilmeteo.it","imag-r.com","imgair.net","imgbox.com","imgbqb.sbs","imginn.com","imgmgf.sbs","imgpke.sbs","imguee.sbs","indeed.com","indobo.com","inertz.org","infulo.com","ingles.com","ipamod.com","iplark.com","ironysub.*","isgfrm.com","issuya.com","itdmusic.*","iumkit.net","iusm.co.kr","iwcp.co.uk","jakondo.ru","japgay.com","japscan.ws","jav-fun.cc","jav-xx.com","jav.direct","jav247.top","jav380.com","javbee.vip","javbix.com","javboys.tv","javbull.tv","javdo.cc>>","javembed.*","javfan.one","javfav.com","javfc2.xyz","javgay.com","javhdz.*>>","javhub.net","javhun.com","javlab.net","javmix.app","javmvp.com","javneon.tv","javnew.net","javopen.co","javpan.net","javpas.com","javplay.me","javqis.com","javrip.net","javroi.com","javseen.tv","javsek.net","jnews5.com","jobsbd.xyz","joktop.com","joolinks.*","josemo.com","jpgames.de","jpvhub.com","jrlinks.in","jytechs.in","kaliscan.*","kamelle.de","kaotic.com","kaplog.com","katlinks.*","kedoam.com","keepvid.pw","kejoam.com","kelaam.com","kendam.com","kenzato.uk","kerapoxy.*","keroseed.*","key-hub.eu","kiaclub.cz","kickass2.*","kickasst.*","kickassz.*","king-pes.*","kinobox.cz","kinoger.re","kinoger.ru","kinoger.to","kjmx.rocks","kkickass.*","klooam.com","klyker.com","kochbar.de","kompas.com","kompiko.pl","kotaku.com","kropic.com","kvador.com","kxbxfm.com","l1afav.net","labgame.io","lacrima.jp","larazon.es","leeapk.com","leechall.*","leet365.cc","leolist.cc","lewd.ninja","lglbmm.com","lidovky.cz","likecs.com","line25.com","link1s.com","linkbin.me","linkpoi.me","linkshub.*","linkskat.*","linksly.co","linkspy.cc","linkz.wiki","liquor.com","listatv.pl","live7v.com","livehere.*","livetvon.*","lollty.pro","lookism.me","lootdest.*","lopers.com","love4u.net","loveroms.*","lumens.com","lustich.de","lxmanga.my","m1xdrop.bz","m2list.com","macwelt.de","magnetdl.*","mahfda.com","mandai.com","mangago.me","mangaraw.*","mangceh.cc","manwan.xyz","mascac.org","mat6tube.*","mathdf.com","maths.news","maxicast.*","medibok.se","megadb.net","megadede.*","megaflix.*","megafly.in","megalink.*","megaup.net","megaurl.in","megaxh.com","meltol.net","meong.club","merinfo.se","mhdtvmax.*","milfzr.com","mitaku.net","mixdroop.*","mlbb.space","mma-core.*","mmnm.store","mmopeon.ru","mmtv01.xyz","molotov.tv","mongri.net","motchill.*","movibd.com","movie123.*","movie4me.*","moviegan.*","moviehdf.*","moviemad.*","movies07.*","movies2k.*","movies4u.*","movies7.to","moviflex.*","movix.blog","mozkra.com","mp3cut.net","mp3guild.*","mp3juice.*","mreader.co","mrpiracy.*","mtlurb.com","mult34.com","multics.eu","multiup.eu","multiup.io","multiup.us","musichq.cc","my-subs.co","mydaddy.cc","myjest.com","mykhel.com","mylust.com","myplexi.fr","myqqjd.com","myvideo.ge","myviid.com","naasongs.*","nackte.com","naijal.com","nakiny.com","namasce.pl","namemc.com","nbabite.to","nbaup.live","ncdnx3.xyz","negumo.com","neonmag.fr","neoteo.com","neowin.net","netfree.cc","newhome.de","newpelis.*","news18.com","newser.com","nexdrive.*","nflbite.to","ngelag.com","ngomek.com","ngomik.net","nhentai.io","nickles.de","niyaniya.*","nmovies.cc","noanyi.com","nocfsb.com","nohost.one","nosteam.ro","note1s.com","notube.com","novinky.cz","noz-cdn.de","nsfw247.to","nswrom.com","ntucgm.com","nudes7.com","nullpk.com","nuroflix.*","nxbrew.net","nxprime.in","nypost.com","odporn.com","odtmag.com","ofwork.net","ohorse.com","ohueli.net","okleak.com","okmusi.com","okteve.com","onehack.us","oneotv.com","onepace.co","onepunch.*","onezoo.net","onloop.pro","onmovies.*","onmsft.com","onvista.de","openload.*","oploverz.*","origami.me","orirom.com","otomoto.pl","owsafe.com","paminy.com","papafoot.*","parade.com","parents.at","pbabes.com","pc-guru.it","pcbeta.com","pcgames.de","pctfenix.*","pcworld.es","pdfaid.com","peetube.cc","people.com","petbook.de","phc.web.id","phim85.com","picmsh.sbs","pictoa.com","pilsner.nu","pingit.com","pirlotv.mx","pixelio.de","pixvid.org","plaion.com","planhub.ca","playboy.de","playfa.com","playgo1.cc","plc247.com","poapan.xyz","pondit.xyz","poophq.com","popcdn.day","poplinks.*","poranny.pl","porn00.org","porndr.com","pornfd.com","porngo.com","porngq.com","pornhd.com","pornhd8k.*","pornky.com","porntb.com","porntn.com","pornve.com","pornwex.tv","pornx.tube","pornxp.com","pornxp.org","pornxs.com","pouvideo.*","povvideo.*","povvldeo.*","povw1deo.*","povwideo.*","powder.com","powlideo.*","powv1deo.*","powvibeo.*","powvideo.*","powvldeo.*","premid.app","progfu.com","prosongs.*","proxybit.*","proxytpb.*","prydwen.gg","psychic.de","pudelek.pl","puhutv.com","putlog.net","qqxnxx.com","qrixpe.com","qthang.net","quicomo.it","radio.zone","raenonx.cc","rakuten.tv","ranker.com","rawinu.com","rawlazy.si","realgm.com","rebahin.pw","redfea.com","redgay.net","reeell.com","regio7.cat","rencah.com","reshare.pm","rgeyyddl.*","rgmovies.*","riazor.org","rlxoff.com","rmdown.com","roblox.com","rodude.com","romsget.io","ronorp.net","roshy.tv>>","rsrlink.in","rule34.art","rule34.xxx","rule34.xyz","rule34ai.*","rumahit.id","s1p1cd.com","s2dfree.to","s3taku.com","sakpot.com","samash.com","savego.org","sawwiz.com","sbrity.com","sbs.com.au","scribd.com","sctoon.net","scubidu.eu","seeflix.to","serien.cam","seriesly.*","sevenst.us","sexato.com","sexjobs.es","sexkbj.com","sexlist.tv","sexodi.com","sexpin.net","sexpox.com","sexrura.pl","sextor.org","sextvx.com","sfile.mobi","shahid4u.*","shinden.pl","shineads.*","shlink.net","sholah.net","shophq.com","shorttey.*","shortx.net","shortzzy.*","showflix.*","shrink.icu","shrinkme.*","shrt10.com","sibtok.com","sikwap.xyz","silive.com","simpcity.*","skmedix.pl","smoner.com","smsget.net","snbc13.com","snopes.com","snowmtl.ru","soap2day.*","socebd.com","sokobj.com","solewe.com","sombex.com","sourds.net","soy502.com","spiegel.de","spielen.de","sportal.de","sportbar.*","sports24.*","srvy.ninja","ssdtop.com","sshkit.com","ssyou.tube","stardima.*","stemplay.*","stiletv.it","stpm.co.uk","strcloud.*","streamsb.*","streamta.*","strefa.biz","sturls.com","suaurl.com","sunhope.it","surfer.com","szene38.de","tapetus.pl","target.com","taxi69.com","tcpvpn.com","tech8s.net","techhx.com","telerium.*","texte.work","th-cam.com","thatav.net","theacc.com","thecut.com","thedaddy.*","theproxy.*","thevidhd.*","thosa.info","thothd.com","thripy.com","tickzoo.tv","tiscali.it","tktube.com","tokuvn.com","tokuzl.net","toorco.com","topito.com","toppng.com","torlock2.*","torrent9.*","tr3fit.xyz","tranny.one","trust.zone","trzpro.com","tsubasa.im","tsz.com.np","tubesex.me","tubous.com","tubsexer.*","tubtic.com","tugaflix.*","tulink.org","tumblr.com","tunein.com","turbovid.*","tutelehd.*","tutsnode.*","tutwuri.id","tuxnews.it","tv0800.com","tvline.com","tvnz.co.nz","tvtoday.de","twatis.com","uctnew.com","uindex.org","uiporn.com","unito.life","uol.com.br","up-load.io","upbaam.com","updato.com","updown.cam","updown.fun","updown.icu","upfion.com","upicsz.com","uplinkto.*","uploadev.*","uploady.io","uporno.xxx","uprafa.com","ups2up.fun","upskirt.tv","uptobhai.*","uptomega.*","urlpay.net","usagoals.*","userload.*","usgate.xyz","usnews.com","ustimz.com","ustream.to","utreon.com","uupbom.com","vadbam.com","vadbam.net","vadbom.com","vbnmll.com","vcloud.lol","vdbtm.shop","vecloud.eu","veganab.co","veplay.top","vevioz.com","vgames.fun","vgmlinks.*","vidapi.xyz","vidbam.org","vidcloud.*","vidcorn.to","vidembed.*","videyx.cam","videzz.net","vidlii.com","vidnest.io","vidohd.com","vidomo.xyz","vidoza.net","vidply.com","viduyy.com","viewfr.com","vinomo.xyz","vipboxtv.*","vipotv.com","vipstand.*","vivatube.*","vizcloud.*","vortez.net","vrporn.com","vsembed.su","vvide0.com","vvtlinks.*","wapkiz.com","warps.club","watch32.sx","watch4hd.*","watcho.com","watchug.to","watchx.top","wawacity.*","weather.us","web1s.asia","webcafe.bg","weloma.art","weshare.is","weszlo.com","wetter.com","wetter3.de","wikwiki.cv","wintub.com","woiden.com","wooflix.tv","woxikon.de","wpgh53.com","ww9g.com>>","www.cc.com","x-x-x.tube","xanimu.com","xasiat.com","xberuang.*","xhamster.*","xhopen.com","xhspot.com","xhtree.com","xhvid1.com","xiaopan.co","xmorex.com","xmovie.pro","xmovies8.*","xnxx.party","xpicse.com","xprime4u.*","xrares.com","xsober.com","xspiel.com","xsz-av.com","xszav.club","xvideis.cc","xxgasm.com","xxmovz.com","xxxdan.com","xxxfiles.*","xxxmax.net","xxxrip.net","xxxsex.pro","xxxtik.com","xxxtor.com","xxxxsx.com","y-porn.com","y2mate.com","y2tube.pro","ygozone.gg","ymknow.xyz","yomovies.*","youapk.net","youmath.it","youpit.xyz","youwatch.*","yseries.tv","ytanime.tv","ytboob.com","ytjar.info","ytmp4.live","yts-subs.*","yumacs.com","yuppow.com","yuvutu.com","yy1024.net","z12z0vla.*","zeefiles.*","zenless.gg","zilinak.sk","zillow.com","zoechip.cc","zoechip.gg","zpaste.net","zthots.com","0123movie.*","0gomovies.*","0rechner.de","10alert.com","111watcho.*","11xmovies.*","123animes.*","123movies.*","12thman.com","141tube.com","173.249.8.3","17track.net","18comic.vip","1movieshd.*","1xanimes.in","2gomovies.*","2rdroid.com","3bmeteo.com","3dyasan.com","3hentai.net","3ixcf45.cfd","3xfaktor.hu","423down.com","4funbox.com","4gousya.net","4players.de","4shared.com","4spaces.org","4tymode.win","5j386s9.sbs","69games.xxx","76078rb.sbs","7review.com","7starmv.com","80-talet.se","8tracks.com","9animetv.to","9goals.live","9jarock.org","a-hentai.tv","aagmaal.com","abs-cbn.com","abstream.to","ad-doge.com","ad4msan.com","adictox.com","adisann.com","adshrink.it","afilmywap.*","africue.com","afrodity.sk","ahmedmode.*","aiailah.com","aipebel.com","akirabox.to","allkpop.com","almofed.com","almursi.com","altcryp.com","alttyab.net","analdin.com","anavidz.com","andiim3.com","anibatch.me","anichin.top","anigogo.net","animahd.com","anime-i.com","anime3d.xyz","animeblix.*","animebr.org","animecix.tv","animehay.tv","animehub.ac","animepahe.*","animesex.me","anisaga.org","anitube.vip","aniworld.to","anomize.xyz","anonymz.com","anqkdhcm.nl","anxcinema.*","anyporn.com","anysex.club","aofsoru.com","aosmark.com","apekite.com","apkdink.com","apkhihe.com","apkshrt.com","apksvip.com","aplus.my.id","app.plex.tv","apritos.com","aquipelis.*","arabstd.com","arabxnx.com","arbweb.info","area51.porn","arenabg.com","arkadmin.fr","artnews.com","asia2tv.com","asianal.xyz","asianclub.*","asiangay.tv","asianload.*","asianplay.*","ask4movie.*","asmr18.fans","asmwall.com","asumesi.com","ausfile.com","auszeit.bio","autobild.de","autokult.pl","automoto.it","autopixx.de","autoroad.cz","autosport.*","avcesar.com","avitter.net","avjamak.net","axomtube.in","ayatoon.com","azmath.info","b2bhint.com","b4ucast.com","babaktv.com","babeswp.com","babyclub.de","badjojo.com","badtaste.it","barfuck.com","batman.city","bbwfest.com","bcmanga.com","bdcraft.net","bdmusic23.*","bdmusic28.*","bdsmporn.cc","beelink.pro","beinmatch.*","bengals.com","berich8.com","berklee.edu","bfclive.com","bg-gledai.*","bi-girl.net","bigconv.com","bigojav.com","bigshare.io","bigwank.com","bikemag.com","bitco.world","bitlinks.pw","bitzite.com","blog4nx.com","blogue.tech","blu-ray.com","blurayufr.*","bokepxv.com","bolighub.dk","bollyflix.*","book18.fans","bootdey.com","botrix.live","bowfile.com","boxporn.net","brbeast.com","brbushare.*","brigitte.de","bristan.com","bsierad.com","btcbitco.in","btvsport.bg","btvsports.*","buondua.com","buzzfeed.at","buzzfeed.de","buzzpit.net","bx-zone.com","bypass.city","bypass.link","cafenau.com","camclips.tv","camel3.live","camsclips.*","camslib.com","camwhores.*","canaltdt.es","carbuzz.com","ccyig2ub.nl","ch-play.com","chatgbt.one","chatgpt.com","chefkoch.de","chicoer.com","chochox.com","cima-club.*","cinecloud.*","cinefreak.*","civitai.com","claimrbx.gg","clapway.com","clkmein.com","club386.com","cocorip.net","coldfrm.org","collater.al","colnect.com","comicxxx.eu","commands.gg","comnuan.com","comohoy.com","converto.io","coomer1.net","corneey.com","corriere.it","cpmlink.net","cpmlink.pro","crackle.com","crazydl.net","crdroid.net","crvsport.ru","csurams.com","cubuffs.com","cuevana.pro","cupra.forum","cut-fly.com","cutearn.net","cutlink.net","cutpaid.com","cutyion.com","daddyhd.*>>","daddylive.*","daftsex.biz","daftsex.net","daftsex.org","daij1n.info","dailyweb.pl","daozoid.com","dawenet.com","ddlvalley.*","decrypt.day","deltabit.co","devotag.com","dexerto.com","digit77.com","digitask.ru","direct-dl.*","discord.com","disheye.com","diudemy.com","divxtotal.*","dj-figo.com","djqunjab.in","dlpanda.com","dma-upd.org","dogdrip.net","donlego.com","dotycat.com","doumura.com","douploads.*","downsub.com","dozarte.com","dramacool.*","dramamate.*","dramanice.*","drawize.com","droplink.co","ds2play.com","dsharer.com","dsvplay.com","dudefilms.*","dz4link.com","e-glossa.it","e2link.link","e9china.net","earnbee.xyz","earnhub.net","easy-coin.*","easybib.com","ebookdz.com","echiman.com","echodnia.eu","ecomento.de","edjerba.com","eductin.com","einthusan.*","elahmad.com","elfqrin.com","embasic.pro","embedmoon.*","embedpk.net","embedtv.net","empflix.com","emuenzen.de","enagato.com","eoreuni.com","eporner.com","eroasmr.com","erothots.co","erowall.com","esgeeks.com","eshentai.tv","eskarock.pl","eslfast.com","europixhd.*","everand.com","everia.club","everyeye.it","exalink.fun","exeking.top","ezmanga.net","f51rm.com>>","fapdrop.com","fapguru.com","faptube.com","farescd.com","fastdokan.*","fastream.to","fastssh.com","fbstreams.*","fchopin.net","fdvzg.world","fembedx.top","feyorra.top","fffmovies.*","figtube.com","file-me.top","file-up.org","file4go.com","file4go.net","filecloud.*","filecrypt.*","filelions.*","filemooon.*","filepress.*","fileq.games","filesamba.*","filesus.com","filmcdn.top","filmisub.cc","films5k.com","filmy-hit.*","filmy4web.*","filmydown.*","filmygod6.*","findjav.com","firefile.cc","fit4art.com","flixrave.me","flixsix.com","fluentu.com","fluvore.com","fmovies0.cc","fmoviesto.*","folkmord.se","foodxor.com","footybite.*","forumdz.com","foumovies.*","foxtube.com","fplzone.com","freenem.com","freepik.com","frpgods.com","fseries.org","fsx.monster","ftuapps.dev","fuckfuq.com","futemax.zip","g-porno.com","gal-dem.com","gamcore.com","game-2u.com","game3rb.com","gameblog.in","gameblog.jp","gamehub.cam","gamelab.com","gamer18.net","gamestar.de","gameswelt.*","gametop.com","gamewith.jp","gamezone.de","gamezop.com","garaveli.de","gaytail.com","gayvideo.me","gazzetta.gr","gazzetta.it","gcloud.live","gedichte.ws","genialne.pl","get-to.link","getmega.net","getthit.com","gevestor.de","gezondnu.nl","ggbases.com","girlmms.com","girlshd.xxx","gisarea.com","gitizle.vip","gizmodo.com","globetv.app","go.zovo.ink","goalup.live","gobison.com","gocards.com","gocast2.com","godeacs.com","godmods.com","godtube.com","goducks.com","gofilms4u.*","gofrogs.com","gogifox.com","gogoanime.*","goheels.com","gojacks.com","gokerja.net","gold-24.net","golobos.com","gomovies.pk","gomoviesc.*","goodporn.to","gooplay.net","gorating.in","gosexy.mobi","gostyn24.pl","goto.com.np","gotocam.net","gotporn.com","govexec.com","gpldose.com","grafikos.cz","gsmware.com","guhoyas.com","gulf-up.com","gupload.xyz","h-flash.com","haaretz.com","hagalil.com","hagerty.com","hardgif.com","hartziv.org","haxmaps.com","haxnode.net","hblinks.pro","hdbraze.com","hdeuropix.*","hdmotori.it","hdonline.co","hdpicsx.com","hdpornt.com","hdtodayz.to","hdtube.porn","helmiau.com","hentai20.io","hentaila.tv","herexxx.com","herzporno.*","hes-goals.*","hexload.com","hhdmovies.*","himovies.sx","hindi.trade","hiphopa.net","history.com","hitokin.net","hmanga.asia","holavid.com","hoofoot.net","hoporno.net","hornpot.net","hornyfap.tv","hotabis.com","hotbabes.tv","hotcars.com","hotfm.audio","hotgirl.biz","hotleak.vip","hotleaks.tv","hotscope.tv","hotscopes.*","hotshag.com","hotstar.com","hubdrive.de","hubison.com","hubstream.*","hubzter.com","hungama.com","hurawatch.*","huskers.com","huurshe.com","hwreload.it","hygiena.com","hypesol.com","icgaels.com","idlixku.com","iegybest.co","iframejav.*","iggtech.com","iimanga.com","iklandb.com","imageweb.ws","imgbvdf.sbs","imgjjtr.sbs","imgnngr.sbs","imgoebn.sbs","imgoutlet.*","imgtaxi.com","imgyhq.shop","impact24.us","in91vip.win","infocorp.io","infokik.com","inkapelis.*","instyle.com","inverse.com","ipa-apps.me","iporntv.net","iptvbin.com","isaimini.ca","isosite.org","ispunlock.*","itpro.co.uk","itudong.com","iv-soft.com","j-pussy.com","jaguars.com","jaiefra.com","japanfuck.*","japanporn.*","japansex.me","japscan.lol","javbake.com","javball.com","javbest.xyz","javbobo.com","javboys.com","javcock.com","javdoge.com","javfull.net","javgrab.com","javhoho.com","javideo.net","javlion.xyz","javmenu.com","javmeta.com","javmilf.xyz","javpool.com","javsex.guru","javstor.com","javx357.com","javynow.com","jcutrer.com","jeep-cj.com","jetanimes.*","jetpunk.com","jezebel.com","jjang0u.com","jkanime.net","jnovels.com","jobsibe.com","jocooks.com","jotapov.com","jpg.fishing","jra.jpn.org","jungyun.net","jxoplay.xyz","karanpc.com","kashtanka.*","kb.arlo.com","khohieu.com","kiaporn.com","kickassgo.*","kiemlua.com","kimoitv.com","kinoking.cc","kissanime.*","kissasia.cc","kissasian.*","kisscos.net","kissmanga.*","kjanime.net","klettern.de","kmansin09.*","kochamjp.pl","kodaika.com","kolyoom.com","komikcast.*","kompoz2.com","kpkuang.org","kppk983.com","ksuowls.com","l23movies.*","l2crypt.com","labstory.in","laposte.net","lapresse.ca","lastampa.it","latimes.com","latitude.to","lbprate.com","leaknud.com","letest25.co","letras2.com","lewdweb.net","lewebde.com","lfpress.com","lgcnews.com","lgwebos.com","libertyvf.*","lifeline.de","liflix.site","ligaset.com","likemag.com","linclik.com","link-to.net","linkmake.in","linkrex.net","links-url.*","linksfire.*","linkshere.*","linksmore.*","lite-link.*","loanpapa.in","lokalo24.de","lookimg.com","lookmovie.*","losmovies.*","losporn.org","lostineu.eu","lovefap.com","lrncook.xyz","lscomic.com","luluvdo.com","luluvid.com","luxmovies.*","m.akkxs.net","m.iqiyi.com","m1xdrop.com","m1xdrop.net","m4maths.com","made-by.org","madoohd.com","madouqu.com","magesy.blog","magesypro.*","mamastar.jp","manga1000.*","manga1001.*","mangahub.io","mangasail.*","manhwa18.cc","maths.media","mature4.net","mavanimes.*","mavavid.com","maxstream.*","mcdlpit.com","mchacks.net","mcloud.guru","mcxlive.org","medisite.fr","mega1080p.*","megafile.io","megavideo.*","mein-mmo.de","melodelaa.*","mephimtv.cc","mercari.com","messitv.net","messitv.org","metavise.in","mgoblue.com","mhdsports.*","mhscans.com","miklpro.com","mirrorace.*","mirrored.to","mlbstream.*","mmfenix.com","mmsmaza.com","mobifuq.com","moenime.com","momomesh.tv","momondo.com","momvids.com","moonembed.*","moonmov.pro","motohigh.pl","moviebaaz.*","movied.link","movieku.ink","movieon21.*","movieplay.*","movieruls.*","movierulz.*","movies123.*","movies4me.*","movies4u3.*","moviesda4.*","moviesden.*","movieshub.*","moviesjoy.*","moviesmod.*","moviesmon.*","moviesub.is","moviesx.org","moviewr.com","moviezwap.*","movizland.*","mp3-now.com","mp3juices.*","mp3yeni.org","mp4moviez.*","mpo-mag.com","mr9soft.com","mrunblock.*","mtb-news.de","mtlblog.com","muchfap.com","multiup.org","muthead.com","muztext.com","mycloudz.cc","myflixerz.*","mygalls.com","mymp3song.*","mytoolz.net","myunity.dev","myvalley.it","myvidmate.*","myxclip.com","narcity.com","nbabox.co>>","nbastream.*","nbch.com.ar","nbcnews.com","needbux.com","needrom.com","nekopoi.*>>","nelomanga.*","nemenlake.*","netfapx.com","netflix.com","netfuck.net","netplayz.ru","netxwatch.*","netzwelt.de","news.com.au","newscon.org","newsmax.com","nextgov.com","nflbite.com","nflstream.*","nhentai.net","nhlstream.*","nicekkk.com","nichapk.com","nimegami.id","nkreport.jp","notandor.cn","novelism.jp","novohot.com","novojoy.com","nowiny24.pl","nowmovies.*","nrj-play.fr","nsfwr34.com","nudevista.*","nulakers.ca","nunflix.org","nyahentai.*","nysainfo.pl","odiasia.sbs","ofilmywap.*","ogomovies.*","ohentai.org","ohmymag.com","okstate.com","olamovies.*","olarila.com","omuzaani.me","onhockey.tv","onifile.com","onneddy.com","ontools.net","onworks.net","optimum.net","ortograf.pl","osxinfo.net","otakudesu.*","otakuindo.*","outletpic.*","overgal.com","overtake.gg","ovester.com","oxanime.com","p2pplay.pro","packers.com","pagesix.com","paketmu.com","pantube.top","papahd.club","papalah.com","paradisi.de","parents.com","parispi.net","pasokau.com","paste1s.com","payskip.org","pcbolsa.com","pcgamer.com","pdfdrive.to","pdfsite.net","pelisplus.*","peppe8o.com","perelki.net","pesktop.com","pewgame.com","pezporn.com","phim1080.in","pianmanga.*","picbqqa.sbs","picnft.shop","picngt.shop","picuenr.sbs","pilot.wp.pl","pinkporno.*","pinterest.*","piratebay.*","pistona.xyz","pitiurl.com","pixjnwe.sbs","pixsera.net","pksmovies.*","pkspeed.net","play.tv3.ee","play.tv3.lt","play.tv3.lv","playrust.io","playtamil.*","playtube.tv","plus.rtl.de","pngitem.com","pngreal.com","pogolinks.*","polygon.com","pomorska.pl","porcore.com","porn3dx.com","porn77.info","porn78.info","porndaa.com","porndex.com","porndig.com","porndoe.com","porndude.tv","porngem.com","porngun.net","pornhex.com","pornhub.com","pornkai.com","pornken.com","pornkino.cc","pornktube.*","pornmam.com","pornmom.net","porno-365.*","pornoman.pl","pornomoll.*","pornone.com","pornovka.cz","pornpaw.com","pornsai.com","porntin.com","porntry.com","pornult.com","poscitech.*","povvvideo.*","powstream.*","powstreen.*","ppatour.com","primesrc.me","primewire.*","prisjakt.no","promobil.de","pronpic.org","pulpo69.com","pupuweb.com","purplex.app","putlocker.*","pvip.gratis","pxtech.site","qdembed.com","quizack.com","quizlet.com","radamel.icu","raiders.com","rainanime.*","raw1001.net","rawkuma.com","rawkuma.net","rawkuro.net","readfast.in","readmore.de","redgifs.com","redlion.net","redporno.cz","redtub.live","redvido.com","redwap2.com","redwap3.com","reifporn.de","rekogap.xyz","repelis.net","repelisgt.*","repelishd.*","repelisxd.*","repicsx.com","resetoff.pl","rethmic.com","retrotv.org","reuters.com","reverso.net","riedberg.tv","rimondo.com","rl6mans.com","rlshort.com","roadbike.de","rocklink.in","romfast.com","romsite.org","romviet.com","rphangx.net","rpmplay.xyz","rpupdate.cc","rsgamer.app","rubystm.com","rubyvid.com","rugby365.fr","runmods.com","ryxy.online","s0ft4pc.com","saekita.com","safelist.eu","sandrives.*","sankaku.app","sansat.link","sararun.net","sat1gold.de","satcesc.com","savelinks.*","savemedia.*","savetub.com","sbbrisk.com","sbchill.com","scenedl.org","scenexe2.io","schadeck.eu","scripai.com","sdefx.cloud","seclore.com","secuhex.com","see-xxx.com","semawur.com","sembunyi.in","sendvid.com","seoworld.in","serengo.net","serially.it","seriemega.*","seriesflv.*","seselah.com","sexavgo.com","sexdiaryz.*","sexemix.com","sexetag.com","sexmoza.com","sexpuss.org","sexrura.com","sexsaoy.com","sexuhot.com","sexygirl.cc","shaheed4u.*","sharclub.in","sharedisk.*","sharing.wtf","shavetape.*","shortearn.*","shrinkus.tk","shrlink.top","simsdom.com","siteapk.net","sitepdf.com","sixsave.com","smplace.com","snaptik.app","socks24.org","soft112.com","softrop.com","solobari.it","soninow.com","sosuroda.pl","soundpark.*","souqsky.net","southpark.*","spambox.xyz","spankbang.*","speedporn.*","spinbot.com","sporcle.com","sport365.fr","sportbet.gr","sportcast.*","sportlive.*","sportshub.*","spycock.com","srcimdb.com","srtslug.biz","ssoap2day.*","ssrmovies.*","staaker.com","stagatv.com","starmusiq.*","steamplay.*","steanplay.*","sterham.net","stickers.gg","stmruby.com","strcloud.in","streamcdn.*","streamed.su","streamers.*","streamhoe.*","streamhub.*","streamio.to","streamix.so","streamm4u.*","streamup.ws","strikeout.*","subdivx.com","subedlc.com","submilf.com","subsvip.com","sukuyou.com","sundberg.ws","sushiscan.*","swatalk.com","t-online.de","tabootube.*","tagblatt.ch","takimag.com","tamilyogi.*","tandess.com","taodung.com","tattle.life","tcheats.com","tdtnews.com","teachoo.com","teamkong.tk","techbook.de","techforu.in","technews.tw","tecnomd.com","telenord.it","telorku.xyz","teltarif.de","tempr.email","terabox.fun","teralink.me","testedich.*","texw.online","thapcam.net","thaript.com","thelanb.com","therams.com","theroot.com","thespun.com","thestar.com","thisvid.com","thotcity.su","thotporn.tv","thotsbay.tv","threads.com","threads.net","tidymom.net","tikmate.app","tinys.click","titantv.com","tnaflix.com","todaypktv.*","tonspion.de","toolxox.com","toonanime.*","toonily.com","topembed.pw","topgear.com","topmovies.*","topshare.in","topsport.bg","totally.top","toxicwap.us","trahino.net","tranny6.com","trgtkls.org","tribuna.com","trickms.com","trilog3.net","tromcap.com","trxking.xyz","tryvaga.com","ttsfree.com","tubator.com","tube18.sexy","tuberel.com","tubsxxx.com","turkanime.*","turkmmo.com","tutflix.org","tutvlive.ru","tv-media.at","tv.bdix.app","tvableon.me","tvseries.in","tw-calc.net","twitchy.com","twitter.com","ubbulls.com","ucanwatch.*","ufcstream.*","uhdmovies.*","uiiumovie.*","uknip.co.uk","umterps.com","unblockit.*","unixmen.com","uozzart.com","updown.link","upfiles.app","uploadbaz.*","uploadhub.*","uploadrar.*","upns.online","uproxy2.biz","uprwssp.org","upstore.net","upstream.to","uptime4.com","uptobox.com","urdubolo.pk","usfdons.com","usgamer.net","ustvgo.live","uyeshare.cc","v2movies.me","v6embed.xyz","vague.style","variety.com","vaughn.live","vectorx.top","vedshar.com","vegamovie.*","ver-pelis.*","verizon.com","vexfile.com","vexmovies.*","vf-film.net","vgamerz.com","vidbeem.com","vidcloud9.*","videezy.com","vidello.net","videovard.*","videoxxx.cc","videplay.us","videq.cloud","vidfast.pro","vidlink.pro","vidload.net","vidshar.org","vidshare.tv","vidspeed.cc","vidstream.*","vidtube.one","vikatan.com","vikings.com","vip-box.app","vipifsa.com","vipleague.*","vipracing.*","vipstand.se","viptube.com","virabux.com","visalist.io","visible.com","viva100.com","vixcloud.co","vizcloud2.*","vkprime.com","voirfilms.*","voyeurhit.*","vrcmods.com","vstdrive.in","vulture.com","vvtplayer.*","vw-page.com","w.grapps.me","waploaded.*","watchfree.*","watchporn.*","wavewalt.me","wayfair.com","wcostream.*","weadown.com","weather.com","webcras.com","webfail.com","webmaal.cfd","webtoon.xyz","weights.com","wetsins.com","weviral.org","wgzimmer.ch","why-tech.it","wildwap.com","winshell.de","wintotal.de","wmovies.xyz","woffxxx.com","wonporn.com","wowroms.com","wupfile.com","wvt.free.nf","www.msn.com","x-x-x.video","x.ag2m2.cfd","xemales.com","xflixbd.com","xforum.live","xfreehd.com","xgroovy.com","xhamster.fm","xhamster1.*","xhamster2.*","xhamster3.*","xhamster4.*","xhamster5.*","xhamster7.*","xhamster8.*","xhmoon5.com","xhreal2.com","xhreal3.com","xhtotal.com","xhwide5.com","xmateur.com","xmovies08.*","xnxxcom.xyz","xozilla.xxx","xpicu.store","xpornzo.com","xpshort.com","xsanime.com","xubster.com","xvideos.com","xx.knit.bid","xxxmomz.com","xxxmovies.*","xztgl.com>>","y-2mate.com","y2meta.mobi","yalifin.xyz","yamsoti.com","yesmovies.*","yestech.xyz","yifysub.net","ymovies.vip","yomovies1.*","yoshare.net","youshort.me","youtube.com","yoxplay.xyz","yt2conv.com","ytmp3cc.net","ytsubme.com","yumeost.net","z9sayu0m.nl","zedporn.com","zemporn.com","zerioncc.pl","zerogpt.com","zetporn.com","ziperto.com","zlpaste.net","zoechip.com","zyromod.com","0123movies.*","0cbcq8mu.com","0l23movies.*","0ochi8hp.com","10-train.com","1024tera.com","103.74.5.104","123-movies.*","1234movies.*","123animes.ru","123moviesc.*","123moviess.*","123unblock.*","1340kbbr.com","16honeys.com","185.53.88.15","18tubehd.com","1fichier.com","1madrasdub.*","1nmnozg1.fun","1primewire.*","2017tube.com","2btmc2r0.fun","2cf0xzdu.com","2fb9tsgn.fun","2madrasdub.*","3a38xmiv.fun","3gaytube.com","45.86.86.235","456movie.com","4archive.org","4bct9.live>>","4edtcixl.xyz","4fansites.de","4k2h4w04.xyz","4live.online","4movierulz.*","56m605zk.fun","5moviess.com","720pstream.*","723qrh1p.fun","7hitmovies.*","8mhlloqo.fun","8rm3l0i9.fun","8teenxxx.com","a6iqb4m8.xyz","ablefast.com","aboedman.com","absoluporn.*","abysscdn.com","acapellas.eu","adbypass.org","adcrypto.net","addonbiz.com","addtoany.com","adsurfle.com","adultfun.net","aegeanews.gr","afl3ua5u.xyz","afreesms.com","airliners.de","akinator.com","akirabox.com","alcasthq.com","alexsports.*","aliancapes.*","allcalidad.*","alliptvs.com","allmusic.com","allosurf.net","alotporn.com","alphatron.tv","alrincon.com","alternet.org","amateur8.com","amnaymag.com","amtil.com.au","amyscans.com","androidaba.*","anhdep24.com","anime-jl.net","anime3rb.com","animefire.io","animeflv.net","animefreak.*","animesanka.*","animeunity.*","animexin.vip","animixplay.*","aninavi.blog","anisubindo.*","anmup.com.np","annabelle.ch","antiadtape.*","antonimos.de","anybunny.com","apetube.asia","apkcombo.com","apkdrill.com","apkmodhub.in","apkprime.org","apkship.shop","apkupload.in","apnablogs.in","app.vaia.com","appsbull.com","appsmodz.com","aranzulla.it","arcaxbydz.id","arkadium.com","arolinks.com","aroratr.club","artforum.com","asiaflix.net","asianporn.li","askim-bg.com","atglinks.com","atgstudy.com","atozmath.com","audiotools.*","audizine.com","autoblog.com","autodime.com","autoembed.cc","autonews.com","autorevue.at","avjamack.com","az-online.de","azoranov.com","azores.co.il","b-hentai.com","babesexy.com","babiato.tech","babygaga.com","bagpipe.news","baithak.news","bamgosu.site","bandstand.ph","banned.video","baramjak.com","barchart.com","baritoday.it","batchkun.com","batporno.com","bbyhaber.com","bceagles.com","bclikeqt.com","beemtube.com","beingtek.com","benchmark.pl","bestlist.top","bestwish.lol","biletomat.pl","bilibili.com","biopills.net","biovetro.net","birdurls.com","bitchute.com","bitssurf.com","bittools.net","bk9nmsxs.com","blog-dnz.com","blogmado.com","blogmura.com","bloground.ro","blwideas.com","bobolike.com","bollydrive.*","bollyshare.*","boltbeat.com","bookfrom.net","bookriot.com","boredbat.com","boundhub.com","boysfood.com","br0wsers.com","braflix.tube","bright-b.com","bsmaurya.com","btvsports.my","bubraves.com","buffsports.*","buffstream.*","bugswave.com","bullfrag.com","burakgoc.com","burbuja.info","burnbutt.com","buyjiocoin.*","byswiizen.fr","bz-berlin.de","calbears.com","callfuck.com","camhub.world","camlovers.tv","camporn.tube","camwhores.tv","camwhorez.tv","capoplay.net","cardiagn.com","cariskuy.com","carnewz.site","cashbux.work","casperhd.com","casthill.net","catcrave.com","catholic.com","cbt-tube.net","cctvwiki.com","celebmix.com","celibook.com","cesoirtv.com","channel4.com","chargers.com","chatango.com","chibchat.com","chopchat.com","choralia.net","chzzkban.xyz","cinedetodo.*","cinemabg.net","cinemaxxl.de","claimbits.io","claimtrx.com","clickapi.net","clicporn.com","clix4btc.com","clockskin.us","closermag.fr","cocogals.com","cocoporn.net","coderblog.in","codesnse.com","coindice.win","coingraph.us","coinsrev.com","collider.com","compsmag.com","compu-pc.com","cool-etv.net","cosmicapp.co","couchtuner.*","coursera.org","cracking.org","crazyblog.in","cricwatch.io","cryptowin.io","cuevana8.com","cut-urls.com","cuts-url.com","cwc.utah.gov","cyberdrop.me","cyberleaks.*","cyclones.com","cyprus.co.il","czechsex.net","da-imnetz.de","daddylive1.*","dafideff.com","dafontvn.com","daftporn.com","dailydot.com","dailysport.*","daizurin.com","darkibox.com","datacheap.io","datanodes.to","dataporn.pro","datawav.club","dawntube.com","day4news.com","ddlvalley.me","deadline.com","deadspin.com","debridup.com","deckshop.pro","decorisi.com","deepbrid.com","deephot.link","delvein.tech","derwesten.de","descarga.xyz","desi.upn.bio","desihoes.com","desiupload.*","desivideos.*","deviants.com","digimanie.cz","dikgames.com","dir-tech.com","dirproxy.com","dirtyfox.net","dirtyporn.cc","distanta.net","divicast.com","divxtotal1.*","djpunjab2.in","dl-protect.*","dlolcast.pro","dlupload.com","dndsearch.in","dokumen.tips","domahatv.com","dotabuff.com","doujindesu.*","downloadr.in","drakecomic.*","dreamdth.com","drivefire.co","drivemoe.com","drivers.plus","dropbang.net","dropgalaxy.*","drsnysvet.cz","drublood.com","ds2video.com","dukeofed.org","dumovies.com","duolingo.com","dutchycorp.*","dvd-flix.com","dwlinks.buzz","eastream.net","ecamrips.com","eclypsia.com","edukaroo.com","egram.com.ng","egyanime.com","ehotpics.com","elcultura.pl","electsex.com","eljgocmn.fun","elvocero.com","embed4me.com","embedtv.best","emporda.info","endbasic.dev","eng-news.com","engvideo.net","epson.com.cn","eroclips.org","erofound.com","erogarga.com","eropaste.net","eroticmv.com","esportivos.*","estrenosgo.*","estudyme.com","et-invest.de","etonline.com","eurogamer.de","eurogamer.es","eurogamer.it","eurogamer.pt","evernia.site","evfancy.link","ex-foary.com","examword.com","exceljet.net","exe-urls.com","eximeuet.fun","expertvn.com","eymockup.com","ezeviral.com","f1livegp.net","factable.com","fairyhorn.cc","fansided.com","fansmega.com","fapality.com","fapfappy.com","fartechy.com","fastilinks.*","fat-bike.com","fbsquadx.com","fc2stream.tv","fedscoop.com","feed2all.org","fehmarn24.de","femdomtb.com","ferdroid.net","fileguard.cc","fileguru.net","filemoon.*>>","filerice.com","filescdn.com","filessrc.com","filezipa.com","filmisongs.*","filmizip.com","filmizletv.*","filmy4wap1.*","filmygod13.*","filmyone.com","filmyzilla.*","financid.com","finevids.xxx","firstonetv.*","fitforfun.de","fivemdev.org","flashbang.sh","flaticon.com","flexy.stream","flexyhit.com","flightsim.to","flixbaba.com","flowsnet.com","flstv.online","flvto.com.co","fm-arena.com","fmoonembed.*","focus4ca.com","footybite.to","forexrw7.com","forogore.com","forplayx.ink","fotopixel.es","freejav.guru","freemovies.*","freemp3.tube","freeshib.biz","freetron.top","freewsad.com","fremdwort.de","freshbbw.com","fruitlab.com","fsileaks.com","fuckmilf.net","fullboys.com","fullcinema.*","fullhd4k.com","fuskator.com","futemais.net","g8rnyq84.fun","galaxyos.net","game-owl.com","gamebrew.org","gamefast.org","gamekult.com","gamer.com.tw","gamerant.com","gamerxyt.com","games.get.tv","games.wkb.jp","gameslay.net","gameszap.com","gametter.com","gamezizo.com","gamingsym.in","gatagata.net","gay4porn.com","gaystream.pw","gayteam.club","gculopes.com","gelbooru.com","gentside.com","getcopy.link","getitfree.cn","getmodsapk.*","gifcandy.net","gioialive.it","gksansar.com","glo-n.online","globes.co.il","globfone.com","gniewkowo.eu","gnusocial.jp","go2share.net","goanimes.vip","gobadgers.ca","gocast123.me","godzcast.com","gogoanimes.*","gogriffs.com","golancers.ca","gomuraw.blog","gonzoporn.cc","goracers.com","gosexpod.com","gottanut.com","goxavier.com","gplastra.com","grazymag.com","grigtube.com","grosnews.com","gseagles.com","gsmhamza.com","guidetnt.com","gurusiana.id","h-game18.xyz","h8jizwea.fun","habuteru.com","hachiraw.net","hackshort.me","hackstore.me","halloporno.*","harbigol.com","hbnews24.com","hbrfrance.fr","hdfcfund.com","hdhub4u.fail","hdmoviehub.*","hdmovies23.*","hdmovies4u.*","hdmovies50.*","hdpopcorns.*","hdporn92.com","hdpornos.net","hdvideo9.com","hellmoms.com","helpdice.com","hentai2w.com","hentai4k.com","hentaigo.com","hentaila.com","hentaimoe.me","hentais.tube","hentaitk.net","hentaizm.fun","hi0ti780.fun","highporn.net","hiperdex.com","hipsonyc.com","hivetoon.com","hmanga.world","hostmath.com","hotmilfs.pro","hqporner.com","hubdrive.com","huffpost.com","hurawatch.cc","huzi6or1.fun","hwzone.co.il","hyderone.com","hydrogen.lat","hypnohub.net","ibradome.com","icutlink.com","icyporno.com","idealight.it","idesign.wiki","idevfast.com","idntheme.com","iguarras.com","ihdstreams.*","ilovephd.com","ilpescara.it","imagefap.com","imdpu9eq.com","imgadult.com","imgbaron.com","imgblaze.net","imgbnwe.shop","imgbyrev.sbs","imgclick.net","imgdrive.net","imgflare.com","imgfrost.net","imggune.shop","imgjajhe.sbs","imgmffmv.sbs","imgnbii.shop","imgolemn.sbs","imgprime.com","imgqbbds.sbs","imgspark.com","imgthbm.shop","imgtorrnt.in","imgxabm.shop","imgxxbdf.sbs","imintweb.com","indianxxx.us","infodani.net","infofuge.com","informer.com","interssh.com","intro-hd.net","ipacrack.com","ipatriot.com","iptvapps.net","iptvspor.com","iputitas.net","iqksisgw.xyz","isaidub6.net","itainews.com","itz-fast.com","iwanttfc.com","izzylaif.com","jaktsidan.se","jalopnik.com","japanporn.tv","japteenx.com","jav-asia.top","javboys.tv>>","javbraze.com","javguard.xyz","javhahaha.us","javhdz.today","javindo.site","javjavhd.com","javmelon.com","javplaya.com","javplayer.me","javprime.net","javquick.com","javrave.club","javtiful.com","javturbo.xyz","jenpornuj.cz","jeshoots.com","jmzkzesy.xyz","jobfound.org","jobsheel.com","jockantv.com","joymaxtr.net","joziporn.com","jsfiddle.net","jsonline.com","juba-get.com","jujmanga.com","kabeleins.de","kafeteria.pl","kakitengah.*","kamehaus.net","kaoskrew.org","karanapk.com","katmoviehd.*","kattracker.*","kaystls.site","khaddavi.net","khatrimaza.*","khsn1230.com","kickasskat.*","kinisuru.com","kinkyporn.cc","kino-zeit.de","kiss-anime.*","kisstvshow.*","klubsports.*","knowstuff.in","kolcars.shop","kollhong.com","komonews.com","konten.co.id","koramaup.com","kpopjams.com","kr18plus.com","kreisbote.de","kstreaming.*","kubo-san.com","kumapoi.info","kungfutv.net","kunmanga.com","kurazone.net","kusonime.com","ladepeche.fr","landwirt.com","lanjutkeun.*","latino69.fun","ldkmanga.com","leaktube.net","learnmany.in","lectormh.com","lecturel.com","leechall.com","leprogres.fr","lesbenhd.com","lesbian8.com","lewdzone.com","liddread.com","lifestyle.bg","lifewire.com","likemanga.io","likuoo.video","linfoweb.com","linkjust.com","linksaya.com","linkshorts.*","linkvoom.com","lionsfan.net","livegore.com","livemint.com","livesport.ws","ln-online.de","lokerwfh.net","longporn.xyz","lookmovie.pn","lookmovie2.*","lootdest.com","lover937.net","lrepacks.net","lucidcam.com","lulustream.*","luluvdoo.com","luluvids.top","luscious.net","lusthero.com","luxuretv.com","m-hentai.net","mac2sell.net","macsite.info","mamahawa.com","manga18.club","mangadna.com","mangafire.to","mangagun.net","mangakio.com","mangakita.id","mangalek.com","mangamanga.*","manganato.gg","manganelo.tv","mangarawjp.*","mangasco.com","mangoporn.co","mangovideo.*","manhuaga.com","manhuascan.*","manhwa68.com","manhwass.com","manhwaus.net","manpeace.org","manyakan.com","manytoon.com","maqal360.com","marmiton.org","masengwa.com","mashtips.com","masslive.com","mat6tube.com","mathaeser.de","maturell.com","mavanimes.co","maxgaming.fi","mazakony.com","mc-hacks.net","mcfucker.com","mcrypto.club","mdbekjwqa.pw","mdtaiwan.com","mealcold.com","medscape.com","medytour.com","meetimgz.com","mega-mkv.com","mega-p2p.net","megafire.net","megatube.xxx","megaupto.com","meilblog.com","metabomb.net","meteolive.it","miaandme.org","micmicidol.*","microify.com","midis.com.ar","mikohub.blog","milftoon.xxx","miraculous.*","mirror.co.uk","missavtv.com","missyusa.com","mitsmits.com","mixloads.com","mjukb26l.fun","mkm7c3sm.com","mkvcinemas.*","mlbstream.tv","mmsbee47.com","mobitool.net","modcombo.com","moddroid.com","modhoster.de","modsbase.com","modsfire.com","modyster.com","mom4real.com","momo-net.com","momspost.com","momxxx.video","monaco.co.il","mooonten.com","moretvtime.*","moshahda.net","motofakty.pl","movie4u.live","moviedokan.*","movieffm.net","moviefreak.*","moviekids.tv","movielair.cc","movierulzs.*","movierulzz.*","movies123.pk","movies18.net","movies4us.co","moviesapi.to","moviesbaba.*","moviesflix.*","moviesland.*","moviespapa.*","moviesrulz.*","moviesshub.*","moviesxxx.cc","movieweb.com","movstube.net","mp3fiber.com","mp3juices.su","mp4-porn.net","mpg.football","mrscript.net","multporn.net","musictip.net","mutigers.com","myesports.gg","myflixerz.to","myfxbook.com","mylinkat.com","naniplay.com","nanolinks.in","napiszar.com","nar.k-ba.net","natgeotv.com","nbastream.tv","nemumemo.com","nephobox.com","netmovies.to","netoff.co.jp","netuplayer.*","newatlas.com","news.now.com","newsextv.com","newsmondo.it","nextdoor.com","nextorrent.*","neymartv.net","nflscoop.xyz","nflstream.tv","nicetube.one","nicknight.de","nicovideo.jp","nifteam.info","nilesoft.org","niu-pack.com","niyaniya.moe","nkunorse.com","nonktube.com","novelasesp.*","novelbob.com","novelread.co","novoglam.com","novoporn.com","nowmaxtv.com","nowsports.me","nowsportv.nl","nowtv.com.tr","nptsr.live>>","nsfwgify.com","nsfwzone.xyz","nudecams.xxx","nudedxxx.com","nudistic.com","nudogram.com","nudostar.com","nueagles.com","nugglove.com","nusports.com","nwzonline.de","nyaa.iss.ink","nzbstars.com","oaaxpgp3.xyz","octanime.net","of-model.com","oimsmosy.fun","okulsoru.com","oldcamera.pl","olutposti.fi","olympics.com","oncehelp.com","oneupload.to","onlinexxx.cc","onlytech.com","onscreens.me","onyxfeed.com","op-online.de","openload.mov","opomanga.com","optifine.net","orangeink.pk","oricon.co.jp","osuskins.net","otakukan.com","otakuraw.net","ottverse.com","ottxmaza.com","ovagames.com","ovnihoje.com","oyungibi.com","pagalworld.*","pak-mcqs.net","paktech2.com","pandadoc.com","pandamovie.*","panthers.com","papunika.com","parenting.pl","parzibyte.me","paste.bin.sx","pastepvp.org","pastetot.com","patriots.com","pay4fans.com","pc-hobby.com","pdfindir.net","peekvids.com","pelimeli.com","pelis182.net","pelisflix2.*","pelishouse.*","pelispedia.*","pelisplus2.*","pennlive.com","pentruea.com","perisxxx.com","phimmoiaz.cc","photooxy.com","photopea.com","picbaron.com","picjbet.shop","picnwqez.sbs","picyield.com","pietsmiet.de","pig-fuck.com","pilibook.com","pinayflix.me","piratebayz.*","pisatoday.it","pittband.com","pixbnab.shop","pixdfdj.shop","piximfix.com","pixkfkf.shop","pixnbrqw.sbs","pixrqqz.shop","pkw-forum.de","platinmods.*","play.max.com","play.nova.bg","play1002.com","player4u.xyz","playerfs.com","playertv.net","playfront.de","playstore.pw","playvids.com","plaza.chu.jp","plc4free.com","plusupload.*","pmvhaven.com","poki-gdn.com","politico.com","polygamia.pl","pomofocus.io","ponsel4g.com","pornabcd.com","pornachi.com","porncomics.*","pornditt.com","pornfeel.com","pornfeet.xyz","pornflip.com","porngames.tv","porngrey.com","pornhat.asia","pornhdin.com","pornhits.com","pornhost.com","pornicom.com","pornleaks.in","pornlift.com","pornlore.com","pornluck.com","pornmoms.org","porno-tour.*","pornoaid.com","pornoente.tv","pornohd.blue","pornotom.com","pornozot.com","pornpapa.com","porntape.net","porntrex.com","pornvibe.org","pornwatch.ws","pornyeah.com","pornyfap.com","pornzone.com","poscitechs.*","postazap.com","postimees.ee","powcloud.org","prensa.click","pressian.com","pricemint.in","prime4you.de","produsat.com","programme.tv","promipool.de","proplanta.de","prothots.com","ps2-bios.com","pugliain.net","pupupul.site","pussyspace.*","putlocker9.*","putlockerc.*","putlockers.*","pysznosci.pl","q1-tdsge.com","qashbits.com","qpython.club","quizrent.com","qvzidojm.com","r3owners.net","raidrush.net","rail-log.net","rajtamil.org","ranjeet.best","rapelust.com","rapidzona.tv","raulmalea.ro","rawmanga.top","rawstory.com","razzball.com","rbs.ta36.com","recipahi.com","recipenp.com","recording.de","reddflix.com","redecanais.*","redretti.com","remilf.xyz>>","reminimod.co","repelisgoo.*","repretel.com","reqlinks.net","resplace.com","retire49.com","richhioon.eu","riotbits.com","ritzysex.com","rockmods.net","rolltide.com","romatoday.it","roms-hub.com","ronaldo7.pro","root-top.com","rosasidan.ws","rosefile.net","rot-blau.com","rotowire.com","royalkom.com","rp-online.de","rtilinks.com","rubias19.com","rue89lyon.fr","ruidrive.com","rushporn.xxx","s2watch.link","salidzini.lv","samfirms.com","samovies.net","satkurier.pl","savefrom.net","savegame.pro","savesubs.com","savevideo.me","scamalot.com","scjhg5oh.fun","seahawks.com","seeklogo.com","seireshd.com","seksrura.net","senimovie.co","senmanga.com","senzuri.tube","servustv.com","sethphat.com","seuseriado.*","sex-pic.info","sexgames.xxx","sexgay18.com","sexroute.net","sexy-games.*","sexyhive.com","sfajacks.com","sgxnifty.org","shanurdu.com","sharedrive.*","sharetext.me","shemale6.com","shemedia.com","sheshaft.com","shorteet.com","shrtslug.biz","sieradmu.com","silkengirl.*","sinonimos.de","siteflix.org","sitekeys.net","skinnyhq.com","skinnyms.com","slawoslaw.pl","slreamplay.*","slutdump.com","slutmesh.net","smailpro.com","smallpdf.com","smcgaels.com","smgplaza.com","snlookup.com","sobatkeren.*","sodomojo.com","solarmovie.*","sonixgvn.net","sortporn.com","sound-park.*","southfreak.*","sp-today.com","sp500-up.com","speedrun.com","spielfilm.de","spinoff.link","sport-97.com","sportico.com","sporting77.*","sportlemon.*","sportlife.es","sportnews.to","sportshub.to","sportskart.*","stardeos.com","stardima.com","stayglam.com","stbturbo.xyz","steelers.com","stevivor.com","stimotion.pl","stre4mplay.*","stream18.net","streamango.*","streambee.to","streameast.*","streampiay.*","streamtape.*","streamwish.*","strikeout.im","stylebook.de","subtaboo.com","sunbtc.space","sunporno.com","superapk.org","superpsx.com","supervideo.*","surf-trx.com","surfline.com","surrit.store","sushi-scan.*","sussytoons.*","suzihaza.com","suzylu.co.uk","svipvids.com","swiftload.io","synonyms.com","syracuse.com","system32.ink","tabering.net","tabooporn.tv","tacobell.com","tagecoin.com","tajpoint.com","tamilprint.*","tamilyogis.*","tampabay.com","tanfacil.net","tapchipi.com","tapepops.com","tatabrada.tv","tatangga.com","team-rcv.xyz","tech24us.com","tech4auto.in","techably.com","techmuzz.com","technons.com","technorj.com","techstage.de","techstwo.com","techtobo.com","techyinfo.in","techzed.info","teczpert.com","teencamx.com","teenhost.net","teensark.com","teensporn.tv","teknorizen.*","telecinco.es","telegraaf.nl","teleriumtv.*","teluguflix.*","teraearn.com","terashare.co","terashare.me","tesbox.my.id","tespedia.com","testious.com","th-world.com","theblank.net","theconomy.me","thedaddy.*>>","thefmovies.*","thegamer.com","thehindu.com","thekickass.*","thelinkbox.*","themezon.net","theonion.com","theproxy.app","thesleak.com","thesukan.net","thevalley.fm","theverge.com","threezly.com","thuglink.com","thurrott.com","tigernet.com","tik-tok.porn","timestamp.fr","tioanime.com","tipranks.com","tnaflix.asia","tnhitsda.net","tntdrama.com","top10cafe.se","topeuropix.*","topfaucet.us","topkickass.*","topspeed.com","topstreams.*","torture1.net","trahodom.com","trendyol.com","tresdaos.com","truthnews.de","tryboobs.com","ts-mpegs.com","tsmovies.com","tubedupe.com","tubewolf.com","tubxporn.com","tucinehd.com","turbobit.net","turbovid.vip","turkanime.co","turkdown.com","turkrock.com","tusfiles.com","tv247us.live","tv3monde.com","tvappapk.com","tvdigital.de","tvpclive.com","tvtropes.org","tweakers.net","twister.porn","tz7z9z0h.com","u-s-news.com","u26bekrb.fun","u9206kzt.fun","udoyoshi.com","ugreen.autos","ukchat.co.uk","ukdevilz.com","ukigmoch.com","ultraten.net","umagame.info","umamusume.gg","unefemme.net","unitystr.com","up-4ever.net","upload18.com","uploadbox.io","uploadmx.com","uploads.mobi","upshrink.com","uptomega.net","ur-files.com","ur70sq6j.fun","usatoday.com","usaxtube.com","userupload.*","usp-forum.de","utahutes.com","utaitebu.com","utakmice.net","uthr5j7t.com","utsports.com","uur-tech.net","uwatchfree.*","vdiflcsl.fun","veganinja.hu","vegas411.com","vibehubs.com","videofilms.*","videojav.com","videos-xxx.*","videovak.com","vidnest.live","vidsaver.net","vidsonic.net","vidsrc-me.su","vidsrc.click","viidshar.com","vikiporn.com","violablu.net","vipporns.com","viralxns.com","visorsmr.com","vocalley.com","voirseries.*","volokit2.com","vqjhqcfk.fun","warddogs.com","watchmovie.*","watchmygf.me","watchnow.fun","watchop.live","watchporn.cc","watchporn.to","watchtvchh.*","way2movies.*","web2.0calc.*","webcams.casa","webnovel.com","webxmaza.com","westword.com","whatgame.xyz","whyvpn.my.id","wikifeet.com","wikirise.com","winboard.org","winfuture.de","winlator.com","wishfast.top","withukor.com","wohngeld.org","wolfstream.*","worldaide.fr","worldmak.com","worldsex.com","writedroid.*","wspinanie.pl","www.google.*","x-video.tube","xculitos.com","xemphim1.top","xfantazy.com","xfantazy.org","xhaccess.com","xhadult2.com","xhadult3.com","xhamster10.*","xhamster11.*","xhamster12.*","xhamster13.*","xhamster14.*","xhamster15.*","xhamster16.*","xhamster17.*","xhamster18.*","xhamster19.*","xhamster20.*","xhamster42.*","xhdate.world","xpornium.net","xsexpics.com","xteensex.net","xvideos.name","xvideos2.com","xxporner.com","xxxfiles.com","xxxhdvideo.*","xxxonline.cc","xxxputas.net","xxxshake.com","xxxstream.me","y5vx1atg.fun","yabiladi.com","yaoiscan.com","yggtorrent.*","yhocdata.com","ynk-blog.com","yogranny.com","you-porn.com","yourlust.com","yts-subs.com","yts-subs.net","ytube2dl.com","yuatools.com","yurudori.com","z1ekv717.fun","zealtyro.com","zehnporn.com","zenradio.com","zhlednito.cz","zilla-xr.xyz","zimabdko.com","zone.msn.com","zootube1.com","zplayer.live","zvision.link","01234movies.*","01fmovies.com","10convert.com","10play.com.au","10starhub.com","111.90.150.10","111.90.151.26","111movies.com","123gostream.*","123movies.net","123moviesgo.*","123movieshd.*","123moviesla.*","123moviesme.*","123movieweb.*","123multihub.*","185.53.88.104","185.53.88.204","190.115.18.20","1bitspace.com","1qwebplay.xyz","1xxx-tube.com","247sports.com","2girls1cup.ca","30kaiteki.com","360news4u.net","38.242.194.12","3dhentai.club","4download.net","4drumkits.com","4filmyzilla.*","4horlover.com","4meplayer.com","4movierulz1.*","560pmovie.com","5movierulz2.*","6hiidude.gold","7fractals.icu","7misr4day.com","7movierulz1.*","7moviesrulz.*","7vibelife.com","94.103.83.138","9filmyzilla.*","9ketsuki.info","9xmoovies.com","abczdrowie.pl","abendblatt.de","abseits-ka.de","acusports.com","acutetube.net","adblocktape.*","advantien.com","advertape.net","aiimgvlog.fun","ainonline.com","aitohuman.org","ajt.xooit.org","akcartoons.in","albania.co.il","alexbacher.fr","alimaniac.com","allitebooks.*","allmomsex.com","alltstube.com","allusione.org","alohatube.xyz","alueviesti.fi","ambonkita.com","angelfire.com","angelgals.com","anihdplay.com","animecast.net","animefever.cc","animeflix.ltd","animefreak.to","animeheaven.*","animenexus.in","animesite.net","animesup.info","animetoast.cc","animeunity.so","animeworld.ac","animeworld.tv","animeyabu.net","animeyabu.org","animeyubi.com","anitube22.vip","aniwatchtv.to","anonyviet.com","anusling.info","aogen-net.com","aparttent.com","appteka.store","arahdrive.com","archive.today","archivebate.*","archpaper.com","areabokep.com","areamobile.de","areascans.net","areatopik.com","arenascan.com","arenavision.*","aresmanga.com","arhplyrics.in","ariestube.com","ark-unity.com","arldeemix.com","artesacro.org","arti-flora.nl","articletz.com","artribune.com","asianboy.fans","asianhdplay.*","asianlbfm.net","asiansex.life","asiaontop.com","askattest.com","asssex-hd.com","astroages.com","astronews.com","at.wetter.com","audiotag.info","audiotrip.org","austiblox.net","auto-data.net","auto-swiat.pl","autobytel.com","autoextrem.de","autofrage.net","autoscout24.*","autosport.com","autotrader.nl","avpgalaxy.net","azcentral.com","aztravels.net","b-bmovies.com","babakfilm.com","babepedia.com","babestube.com","babytorrent.*","baddiehub.com","bdsm-fuck.com","beasttips.com","beegsexxx.com","besargaji.com","bestgames.com","beverfood.com","biftutech.com","bikeradar.com","bikerszene.de","bilasport.net","bilinovel.com","billboard.com","bimshares.com","bingsport.xyz","bitcosite.com","bitfaucet.net","bitlikutu.com","bitview.cloud","bizdustry.com","blasensex.com","blog.40ch.net","blogesque.net","blograffo.net","blurayufr.cam","bobs-tube.com","bokugents.com","bolly2tolly.*","bollymovies.*","boobgirlz.com","bootyexpo.net","boxylucha.com","boystube.link","bravedown.com","bravoporn.com","brawlhalla.fr","breitbart.com","breznikar.com","brighteon.com","brocoflix.com","brocoflix.xyz","bshifast.live","buffsports.io","buffstreams.*","bustyfats.com","buydekhke.com","bymichiby.com","call4cloud.nl","camarchive.tv","camdigest.com","camgoddess.tv","camvideos.org","camwhorestv.*","camwhoria.com","canalobra.com","canlikolik.my","capo4play.com","capo5play.com","capo6play.com","caravaning.de","cardshare.biz","carryflix.icu","carscoops.com","cat-a-cat.net","cat3movie.org","cbsnews.com>>","ccthesims.com","cdiscount.com","celeb.gate.cc","celemusic.com","ceramic.or.kr","ceylonssh.com","cg-method.com","cgcosplay.org","chapteria.com","chataigpt.org","cheatcloud.cc","cheater.ninja","cheatsquad.gg","chevalmag.com","chihouban.com","chikonori.com","chimicamo.org","chloeting.com","cima100fm.com","cinecalidad.*","cinedokan.top","cinema.com.my","cinemabaz.com","cinemitas.org","civitai.green","claim.8bit.ca","claimbits.net","claudelog.com","claydscap.com","clickhole.com","cloudvideo.tv","cloudwish.xyz","cloutgist.com","cmsdetect.com","cmtracker.net","cnnamador.com","cockmeter.com","cocomanga.com","code2care.org","codeastro.com","codesnail.com","codewebit.top","coinbaby8.com","coinfaucet.io","coinlyhub.com","coinsbomb.com","comedyshow.to","comexlive.org","comparili.net","computer76.ru","condorsoft.co","configspc.com","cooksinfo.com","coolcast2.com","coolporno.net","corrector.app","courseclub.me","crackcodes.in","crackevil.com","crackfree.org","crazyporn.xxx","crazyshit.com","crazytoys.xyz","cricket12.com","criollasx.com","criticker.com","crocotube.com","crotpedia.net","crypto4yu.com","cryptonor.xyz","cryptorank.io","cumlouder.com","cureclues.com","cuttlinks.com","cxissuegk.com","cybermania.ws","daddylive.*>>","daddylivehd.*","dailynews.com","dailypaws.com","dailyrevs.com","dandanzan.top","dankmemer.lol","datavaults.co","dbusports.com","dcleakers.com","ddd-smart.net","decmelfot.xyz","deepfucks.com","deichstube.de","deluxtube.com","demae-can.com","dengarden.com","denofgeek.com","depvailon.com","derusblog.com","descargasok.*","desijugar.net","desimmshd.com","dfilmizle.com","dickclark.com","dinnerexa.com","dipprofit.com","dirtyship.com","diskizone.com","dl-protect1.*","dlapk4all.com","dldokan.store","dlhe-videa.sk","dlstreams.top","doctoraux.com","dongknows.com","donkparty.com","doofree88.com","doomovie-hd.*","dooodster.com","doramasyt.com","dorawatch.net","douploads.net","douxporno.com","downfile.site","downloader.is","downloadhub.*","dr-farfar.com","dragontea.ink","dramafren.com","dramafren.org","dramaviki.com","drivelinks.me","drivenime.com","driveup.space","drop.download","dropnudes.com","dropshipin.id","dubaitime.net","durtypass.com","e-monsite.com","e2link.link>>","eatsmarter.de","ebonybird.com","ebook-hell.to","ebook3000.com","ebooksite.org","edealinfo.com","edukamer.info","egitim.net.tr","elespanol.com","embdproxy.xyz","embed.scdn.to","embedgram.com","embedplayer.*","embedrise.com","embedwish.com","empleo.com.uy","emueagles.com","encurtads.net","encurtalink.*","enjoyfuck.com","ensenchat.com","entenpost.com","entireweb.com","ephoto360.com","epochtimes.de","eporner.video","eramuslim.com","erospots.info","eroticity.net","erreguete.gal","esladvice.com","eurogamer.net","exe-links.com","expansion.com","extratipp.com","fadedfeet.com","familyporn.tv","fanfiktion.de","fangraphs.com","fantasiku.com","fapomania.com","faresgame.com","farodevigo.es","fastcars1.com","fclecteur.com","fembed9hd.com","fetish-tv.com","fetishtube.cc","file-upload.*","filegajah.com","filehorse.com","filemooon.top","filmeseries.*","filmibeat.com","filmlinks4u.*","filmy4wap.uno","filmyporno.tv","filmyworlds.*","findheman.com","firescans.xyz","firmwarex.net","firstpost.com","fivemturk.com","flexamens.com","flexxporn.com","flix-wave.lol","flixlatam.com","flyplayer.xyz","fmoviesfree.*","fontyukle.net","footeuses.com","footyload.com","forexforum.co","forlitoday.it","forum.dji.com","fossbytes.com","fosslinux.com","fotoblogia.pl","foxaholic.com","foxsports.com","foxtel.com.au","frauporno.com","free.7hd.club","freedom3d.art","freeflix.info","freegames.com","freeiphone.fr","freeomovie.to","freeporn8.com","freesex-1.com","freeshot.live","freexcafe.com","freexmovs.com","freshscat.com","freyalist.com","fromwatch.com","fsicomics.com","fsl-stream.lu","fsportshd.net","fsportshd.xyz","fuck-beeg.com","fuck-xnxx.com","fuckingfast.*","fucksporn.com","fullassia.com","fullhdxxx.com","funandnews.de","fussball.news","futurezone.de","fzmovies.info","fztvseries.ng","gamearter.com","gamedrive.org","gamefront.com","gamelopte.com","gamereactor.*","games.bnd.com","games.qns.com","gamesite.info","gamesmain.xyz","gamevcore.com","gamezhero.com","gamovideo.com","garoetpos.com","gatasdatv.com","gayboyshd.com","gaysearch.com","geekering.com","generate.plus","gesundheit.de","getintopc.com","getpaste.link","getpczone.com","gfsvideos.com","ghscanner.com","gigmature.com","gipfelbuch.ch","girlnude.link","girlydrop.com","globalnews.ca","globalrph.com","globalssh.net","globlenews.in","go.linkify.ru","gobobcats.com","gogoanimetv.*","gogoplay1.com","gogoplay2.com","gohuskies.com","gol245.online","goldderby.com","gomaainfo.com","gomoviestv.to","goodriviu.com","govandals.com","grabpussy.com","grantorrent.*","graphicux.com","greatnass.com","greensmut.com","gry-online.pl","gsmturkey.net","guardaserie.*","gutefrage.net","gutekueche.at","gwusports.com","haaretz.co.il","hailstate.com","hairytwat.org","hancinema.net","haonguyen.top","haoweichi.com","harimanga.com","harzkurier.de","hdgayporn.net","hdmoviefair.*","hdmoviehubs.*","hdmovieplus.*","hdmovies2.org","hdtubesex.net","heatworld.com","heimporno.com","hellabyte.one","hellenism.net","hellporno.com","hentai-ia.com","hentaihaven.*","hentaikai.com","hentaimama.tv","hentaipaw.com","hentaiporn.me","hentairead.io","hentaiyes.com","herzporno.net","heutewelt.com","hexupload.net","hiddenleaf.to","hifi-forum.de","hihihaha1.xyz","hihihaha2.xyz","hilites.today","hindimovies.*","hindinest.com","hindishri.com","hindisite.net","hispasexy.org","hitsports.pro","hlsplayer.top","hobbykafe.com","holaporno.xxx","holymanga.net","hornbunny.com","hornyfanz.com","hosttbuzz.com","hotntubes.com","hotpress.info","howtogeek.com","hqmaxporn.com","hqpornero.com","hqsex-xxx.com","htmlgames.com","hulkshare.com","hurawatchz.to","hydraxcdn.biz","hypebeast.com","hyperdebrid.*","iammagnus.com","iceland.co.uk","ichberlin.com","icy-veins.com","ievaphone.com","iflixmovies.*","ifreefuck.com","igg-games.com","ignboards.com","iiyoutube.com","ikarianews.gr","ikz-online.de","ilpiacenza.it","imagehaha.com","imagenpic.com","imgbbnhi.shop","imgbncvnv.sbs","imgcredit.xyz","imghqqbg.shop","imgkkabm.shop","imgmyqbm.shop","imgwallet.com","imgwwqbm.shop","imleagues.com","indiafree.net","indiamaja.com","indianyug.com","indiewire.com","ineedskin.com","inextmovies.*","infidrive.net","inhabitat.com","instagram.com","instalker.org","interfans.org","investing.com","iogames.space","ipalibrary.me","iptvpulse.top","italpress.com","itdmusics.com","itmaniatv.com","itopmusic.com","itsguider.com","jadijuara.com","jagoanssh.com","jameeltips.us","japanxxx.asia","jav101.online","javenglish.cc","javguard.club","javhdporn.net","javleaked.com","javmobile.net","javporn18.com","javsaga.ninja","javstream.com","javstream.top","javsubbed.xyz","javsunday.com","jaysndees.com","jazzradio.com","jellynote.com","jennylist.xyz","jesseporn.xyz","jiocinema.com","jipinsoft.com","jizzberry.com","jk-market.com","jkdamours.com","jncojeans.com","jobzhub.store","joongdo.co.kr","jpscan-vf.com","jptorrent.org","juegos.as.com","jumboporn.xyz","junkyponk.com","jurukunci.net","justjared.com","justpaste.top","justwatch.com","juventusfc.hu","k12reader.com","kacengeng.com","kakiagune.com","kalileaks.com","kanaeblog.net","kangkimin.com","katdrive.link","katestube.com","katmoviefix.*","kayoanime.com","kckingdom.com","kenta2222.com","kfapfakes.com","kfrfansub.com","kicaunews.com","kickcharm.com","kissasian.*>>","klaustube.com","klikmanga.com","kllproject.lv","klykradio.com","kobieta.wp.pl","kolnovel.site","koreanbj.club","korsrt.eu.org","kotanopan.com","kpopjjang.com","ksusports.com","kumascans.com","kupiiline.com","kuronavi.blog","kurosuen.live","lamorgues.com","laptrinhx.com","latinabbw.xyz","latinlucha.es","laurasia.info","lavoixdux.com","law101.org.za","learn-cpp.org","learnclax.com","lecceprima.it","leccotoday.it","leermanga.net","leinetal24.de","letmejerk.com","letras.mus.br","lewdstars.com","liberation.fr","libreriamo.it","liiivideo.com","likemanga.ink","lilymanga.net","ling-online.*","link4rev.site","linkfinal.com","linkskibe.com","linkspaid.com","linovelib.com","linuxhint.com","lippycorn.com","listeamed.net","litecoin.host","litonmods.com","liveonsat.com","livestreams.*","liveuamap.com","lolcalhost.ru","lolhentai.net","longfiles.com","lookmovie2.to","loot-link.com","lootlemon.com","loptelink.com","lordpremium.*","love4porn.com","lovetofu.cyou","lowellsun.com","lrtrojans.com","lsusports.net","ludigames.com","lulacloud.com","lustesthd.lat","lustholic.com","lusttaboo.com","lustteens.net","lustylist.com","lustyspot.com","luxusmail.org","m.viptube.com","m.youtube.com","maccanismi.it","macrumors.com","macserial.com","magesypro.com","mailnesia.com","mailocal2.xyz","mainbabes.com","mainlinks.xyz","mainporno.com","makeuseof.com","mamochki.info","manga-dbs.com","manga-tube.me","manga18fx.com","mangacrab.com","mangacrab.org","mangadass.com","mangafreak.me","mangahere.onl","mangakoma01.*","mangalist.org","mangarawjp.me","mangaread.org","mangasite.org","mangoporn.net","manhastro.com","manhastro.net","manhuatop.org","manhwatop.com","manofadan.com","map.naver.com","mathcrave.com","mathebibel.de","mathsspot.com","matomeiru.com","maz-online.de","mconverter.eu","md3b0j6hj.com","mdfx9dc8n.net","mdy48tn97.com","medebooks.xyz","mediafire.com","mediamarkt.be","mediamarkt.de","mediapason.it","medihelp.life","mega-dvdrip.*","megagames.com","megane.com.pl","megawarez.org","megawypas.com","meineorte.com","meinestadt.de","memangbau.com","memedroid.com","menshealth.de","metalflirt.de","meteopool.org","metrolagu.cam","mettablog.com","meuanime.info","mexicogob.com","mh.baxoi.buzz","mhdsportstv.*","mhdtvsports.*","miohentai.com","miraculous.to","mirrorace.com","missav123.com","missav888.com","mitedrive.com","mixdrop21.net","mixdrop23.net","mixdropjmk.pw","mjakmama24.pl","mmastreams.me","mmorpg.org.pl","mobdi3ips.com","mobdropro.com","modelisme.com","mom-pussy.com","momxxxass.com","momxxxsex.com","moneyhouse.ch","monstream.org","monzatoday.it","moonquill.com","moovitapp.com","moozpussy.com","moregirls.org","morgenpost.de","mosttechs.com","motive213.com","motofan-r.com","motor-talk.de","motorbasar.de","motortests.de","moutogami.com","moviedekho.in","moviefone.com","moviehaxx.pro","moviejones.de","movielinkbd.*","moviepilot.de","movieping.com","movierulzhd.*","moviesdaweb.*","moviesite.app","moviesverse.*","moviexxx.mobi","mp3-gratis.it","mp3fusion.net","mp3juices.icu","mp4mania1.net","mp4upload.com","mrpeepers.net","mtech4you.com","mtg-print.com","mtraffics.com","multicanais.*","musicsite.biz","musikradar.de","myadslink.com","mydomaine.com","myfernweh.com","myflixertv.to","myhindigk.com","myhomebook.de","myicloud.info","myrecipes.com","myshopify.com","mysostech.com","mythvista.com","myvidplay.com","myvidster.com","myviptuto.com","myyouporn.com","naijahits.com","nakenprat.com","napolipiu.com","nastybulb.com","nation.africa","natomanga.com","naturalbd.com","nbcsports.com","ncdexlive.org","needrombd.com","neilpatel.com","nekolink.site","nekopoi.my.id","neoseeker.com","nesiaku.my.id","netcinebs.lat","netfilmes.org","netnaijas.com","nettiauto.com","neuepresse.de","neurotray.com","nevcoins.club","neverdims.com","newstopics.in","newyorker.com","newzjunky.com","nexusgames.to","nexusmods.com","nflstreams.me","nhvnovels.com","nicematin.com","nicomanga.com","nihonkuni.com","nin10news.com","nklinks.click","noblocktape.*","noikiiki.info","noob4cast.com","noor-book.com","nordbayern.de","notevibes.com","nousdecor.com","nouvelobs.com","novamovie.net","novelcrow.com","novelroom.net","novizer.com>>","nsfwalbum.com","nsfwhowto.xyz","nudegista.com","nudistube.com","nuhuskies.com","nukibooks.com","nulledmug.com","nvimfreak.com","nwusports.com","odiadance.com","odiafresh.com","officedepot.*","ogoplayer.xyz","ohmybrush.com","ojogos.com.br","okhatrimaza.*","onemanhua.com","online-fix.me","onlinegdb.com","onlyssh.my.id","onlystream.tv","op-marburg.de","openloadmov.*","ostreaming.tv","otakuliah.com","otakuporn.com","otonanswer.jp","ottawasun.com","ovcsports.com","owlsports.com","ozulscans.com","padovaoggi.it","pagalfree.com","pagalmovies.*","pagalworld.us","paidnaija.com","paipancon.com","panuvideo.com","paolo9785.com","parisporn.org","parmatoday.it","pasteboard.co","pasteflash.sx","pastelink.net","patchsite.net","pawastreams.*","pc-builds.com","pc-magazin.de","pclicious.net","peacocktv.com","peladas69.com","peliculas24.*","pelisflix20.*","pelisgratis.*","pelismart.com","pelisplusgo.*","pelisplushd.*","pelisplusxd.*","pelisstar.com","perplexity.ai","pervclips.com","pg-wuming.com","pianokafe.com","pic-upload.de","picbcxvxa.sbs","pichaloca.com","pics-view.com","pienovels.com","piraproxy.app","pirateproxy.*","pixbkghxa.sbs","pixbryexa.sbs","pixnbrqwg.sbs","pixtryab.shop","pkbiosfix.com","pkproject.net","play.aetv.com","player.stv.tv","player4me.vip","playfmovies.*","playpaste.com","plugincim.com","pocketnow.com","poco.rcccn.in","pokemundo.com","polska-ie.com","popcorntime.*","porn4fans.com","pornbaker.com","pornbimbo.com","pornblade.com","pornborne.com","pornchaos.org","pornchimp.com","porncomics.me","porncoven.com","porndollz.com","porndrake.com","pornfelix.com","pornfuzzy.com","pornloupe.com","pornmonde.com","pornoaffe.com","pornobait.com","pornocomics.*","pornoeggs.com","pornohaha.com","pornohans.com","pornohelm.com","pornokeep.com","pornoleon.com","pornomico.com","pornonline.cc","pornonote.pro","pornoplum.com","pornproxy.app","pornproxy.art","pornretro.xyz","pornslash.com","porntopic.com","porntube18.cc","posterify.net","pourcesoir.in","povaddict.com","powforums.com","pravda.com.ua","pregledaj.net","pressplay.cam","pressplay.top","prignitzer.de","proappapk.com","proboards.com","produktion.de","promiblogs.de","prostoporno.*","protestia.com","protopage.com","pureleaks.net","pussy-hub.com","pussyspot.net","putlockertv.*","puzzlefry.com","pvpoke-re.com","pygodblog.com","qqwebplay.xyz","quesignifi.ca","quicasting.it","quickporn.net","rainytube.com","ranourano.xyz","rbscripts.net","read.amazon.*","readingbd.com","realbooru.com","realmadryt.pl","rechtslupe.de","redhdtube.xxx","redsexhub.com","reliabletv.me","repelisgooo.*","restorbio.com","reviewdiv.com","rexdlfile.com","rgeyyddl.skin","ridvanmau.com","riggosrag.com","ritzyporn.com","rocdacier.com","rockradio.com","rojadirecta.*","roms4ever.com","romsgames.net","romspedia.com","rossoporn.com","rottenlime.pw","roystream.com","rufiiguta.com","rule34.jp.net","rumbunter.com","ruyamanga.com","s.sseluxx.com","sagewater.com","sakaiplus.com","sarapbabe.com","sassytube.com","savefiles.com","scatkings.com","scimagojr.com","scrapywar.com","scrolller.com","sendspace.com","seneporno.com","sensacine.com","seriesite.net","set.seturl.in","sex-babki.com","sexbixbox.com","sexbox.online","sexdicted.com","sexmazahd.com","sexmutant.com","sexphimhd.net","sextube-6.com","sexyscope.net","sexytrunk.com","sfastwish.com","sfirmware.com","shameless.com","share.hntv.tv","share1223.com","sharemods.com","sharkfish.xyz","sharphindi.in","shemaleup.net","short-fly.com","short1ink.com","shortlinkto.*","shortpaid.com","shorttrick.in","shownieuws.nl","shroomers.app","siimanga.cyou","simana.online","simplebits.io","simpmusic.org","sissytube.net","sitefilme.com","sitegames.net","sk8therapy.fr","skymovieshd.*","smartworld.it","smashkarts.io","snapwordz.com","socigames.com","softcobra.com","softfully.com","sohohindi.com","solarmovie.id","solarmovies.*","solotrend.net","songfacts.com","sosovalue.com","spankbang.com","spankbang.mov","speedporn.net","speedtest.net","speedweek.com","spfutures.org","spokesman.com","spontacts.com","sportbar.live","sportlemons.*","sportlemonx.*","sportowy24.pl","sportsbite.cc","sportsembed.*","sportsnest.co","sportsrec.com","sportweb.info","spring.org.uk","ssyoutube.com","stagemilk.com","stalkface.com","starsgtech.in","startpage.com","startseite.to","ster-blog.xyz","stock-rom.com","str8ongay.com","stream-69.com","stream4free.*","streambtw.com","streamcloud.*","streamfree.to","streamhd247.*","streamobs.net","streampoi.com","streamporn.cc","streamsport.*","streamta.site","streamtp1.com","streamvid.net","strefaagro.pl","striptube.net","stylist.co.uk","subtitles.cam","subtorrents.*","suedkurier.de","sufanblog.com","sulleiman.com","sunporno.club","superstream.*","supervideo.tv","supforums.com","sweetgirl.org","swisscows.com","switch520.com","sylverkat.com","sysguides.com","szexkepek.net","szexvideok.hu","t-rocforum.de","tab-maker.com","taboodude.com","taigoforum.de","tamilarasan.*","tamilguns.org","tamilhit.tech","tapenoads.com","tatsublog.com","techacode.com","techclips.net","techdriod.com","techilife.com","technofino.in","techradar.com","techrecur.com","techtrim.tech","techyrick.com","teenbabe.link","tehnotone.com","teknisitv.com","temp-mail.lol","temp-mail.org","tempumail.com","tennis.stream","ternitoday.it","terrylove.com","testsieger.de","texastech.com","thejournal.ie","thelayoff.com","thememypc.net","thenation.com","thespruce.com","thestreet.com","thetemp.email","thethings.com","thetravel.com","theuser.cloud","theweek.co.uk","thichcode.net","thiepmung.com","thotpacks.xyz","thotslife.com","thoughtco.com","tierfreund.co","tierlists.com","timescall.com","tinyzonetv.cc","tinyzonetv.se","tiz-cycling.*","tmohentai.com","to-travel.net","tok-thots.com","tokopedia.com","tokuzilla.net","topwwnews.com","torgranate.de","torrentz2eu.*","torupload.com","totalcsgo.com","totaldebrid.*","tourporno.com","towerofgod.me","trade2win.com","trailerhg.xyz","trangchu.news","transfaze.com","transflix.net","transtxxx.com","travelbook.de","tremamnon.com","tribeclub.com","tricksplit.io","trigonevo.com","tripsavvy.com","tsubasatr.org","tubehqxxx.com","tubemania.org","tubereader.me","tudigitale.it","tudotecno.com","tukipasti.com","tunabagel.net","tunemovie.fun","turkleech.com","tutcourse.com","tvfutbol.info","twink-hub.com","txxxporn.tube","uberhumor.com","ubuntudde.com","udemyking.com","udinetoday.it","uhcougars.com","uicflames.com","umamigirl.com","uniqueten.net","unlockapk.com","unlockxh4.com","unnuetzes.com","unterhalt.net","up4stream.com","upfilesgo.com","uploadgig.com","uptoimage.com","urgayporn.com","utrockets.com","uwbadgers.com","vectorizer.io","vegamoviese.*","veoplanet.com","verhentai.top","vermoegen.org","vibestreams.*","vibraporn.com","vid-guard.com","vidaextra.com","videoplayer.*","vidora.stream","vidspeeds.com","vidstream.pro","viefaucet.com","villanova.com","vintagetube.*","vipergirls.to","vipserije.com","vipstand.pm>>","visionias.net","visnalize.com","vixenless.com","vkrovatku.com","voidtruth.com","voiranime1.fr","voirseries.io","vosfemmes.com","vpntester.org","vstplugin.net","vuinsider.com","w3layouts.com","waploaded.com","warezsite.net","watch.plex.tv","watchdirty.to","watchluna.com","watchmovies.*","watchseries.*","watchsite.net","watchtv24.com","wdpglobal.com","weatherwx.com","weirdwolf.net","wendycode.com","westmanga.org","wetpussy.sexy","wg-gesucht.de","whoreshub.com","widewifes.com","wikipekes.com","wikitechy.com","willcycle.com","windowspro.de","wkusports.com","wlz-online.de","wmoviesfree.*","wonderapk.com","workink.click","world4ufree.*","worldfree4u.*","worldsports.*","worldstar.com","worldtop2.com","wowescape.com","wunderweib.de","wvusports.com","www.amazon.de","www.seznam.cz","www.twitch.tv","www.yahoo.com","x-fetish.tube","x-videos.name","xanimehub.com","xhbranch5.com","xhchannel.com","xhlease.world","xhplanet1.com","xhplanet2.com","xhvictory.com","xhwebsite.com","xmovies08.org","xnxxjapon.com","xoxocomic.com","xrivonet.info","xsportbox.com","xsportshd.com","xstory-fr.com","xxvideoss.org","xxx-image.com","xxxbunker.com","xxxcomics.org","xxxfree.watch","xxxhothub.com","xxxscenes.net","xxxvideo.asia","xxxvideor.com","y2meta-uk.com","yachtrevue.at","yandexcdn.com","yaoiotaku.com","ycongnghe.com","yesmovies.*>>","yesmovies4u.*","yeswegays.com","ymp4.download","yogitimes.com","youjizzz.club","youlife24.com","youngleak.com","youpornfm.com","youtubeai.com","yoyofilmeys.*","yt1s.com.co>>","yumekomik.com","zamundatv.com","zerotopay.com","zigforums.com","zinkmovies.in","zmamobile.com","zoompussy.com","zorroplay.xyz","0dramacool.net","111.90.141.252","111.90.150.149","111.90.159.132","1111fullwise.*","123animehub.cc","123moviefree.*","123movierulz.*","123movies4up.*","123moviesd.com","123movieshub.*","185.193.17.214","188.166.182.72","18girlssex.com","1cloudfile.com","1pack1goal.com","1primewire.com","1shortlink.com","1stkissmanga.*","3gpterbaru.com","3rabsports.com","4everproxy.com","69hoshudaana.*","69teentube.com","90fpsconfig.in","absolugirl.com","absolutube.com","admiregirls.su","adnan-tech.com","adsafelink.com","afilmywapi.biz","agedvideos.com","airsextube.com","akumanimes.com","akutsu-san.com","alexsports.*>>","alimaniacky.cz","allbbwtube.com","allcalidad.app","allcelebs.club","allmovieshub.*","allosoccer.com","allpremium.net","allrecipes.com","alluretube.com","allwpworld.com","almezoryae.com","alphaporno.com","amanguides.com","amateurfun.net","amateurporn.co","amigosporn.top","ancensored.com","anconatoday.it","androgamer.org","androidacy.com","ani-stream.com","anime4mega.net","animeblkom.net","animefire.info","animefire.plus","animeheaven.ru","animeindo.asia","animeshqip.org","animespank.com","animesvision.*","anonymfile.com","anyxvideos.com","aozoraapps.net","app.cekresi.me","appsfree4u.com","arab4media.com","arabincest.com","arabxforum.com","arealgamer.org","ariversegl.com","arlinadzgn.com","armyranger.com","articlebase.pk","artoffocas.com","ashemaletube.*","ashemaletv.com","asianporn.sexy","asianwatch.net","askpaccosi.com","askushowto.com","assesphoto.com","astro-seek.com","atlantic10.com","audiotools.pro","autocentrum.pl","autopareri.com","av1encodes.com","b3infoarena.in","balkanteka.net","bamahammer.com","bankshiksha.in","bantenexis.com","batmanstream.*","battleboats.io","bbwfuckpic.com","bcanepaltu.com","bcsnoticias.mx","bdsmstreak.com","bdsomadhan.com","bdstarshop.com","beegvideoz.com","belloporno.com","benzinpreis.de","best18porn.com","bestofarea.com","betaseries.com","bharian.com.my","bhugolinfo.com","bidersnotu.com","bildderfrau.de","bingotingo.com","bit-shares.com","bitcotasks.com","bitcrypto.info","bittukitech.in","blackcunts.org","blackteen.link","blocklayer.com","blowjobgif.net","bluedollar.net","boersennews.de","bolly-tube.com","bollywoodx.org","bonstreams.net","boobieblog.com","boobsradar.com","boobsrealm.com","boredgiant.com","boxaoffrir.com","brainknock.net","bravoteens.com","bravotube.asia","brightpets.org","brulosophy.com","btcadspace.com","btcsatoshi.net","btvnovinite.bg","btvsports.my>>","buccaneers.com","businessua.com","bustmonkey.com","bustybloom.com","cacfutures.org","cadenadial.com","calculate.plus","calgarysun.com","camgirlbay.net","camgirlfap.com","camsstream.com","canalporno.com","caracol.com.co","cardscanner.co","carrnissan.com","casertanews.it","celebjihad.com","celebwhore.com","cellmapper.net","cesenatoday.it","chachocool.com","chanjaeblog.jp","chart.services","chatgptfree.ai","chaturflix.cam","cheatermad.com","chietitoday.it","cimanow.online","cine-calidad.*","cinelatino.net","cinemalibero.*","cinepiroca.com","claimcrypto.cc","claimlite.club","clasicotas.org","clicknupload.*","clipartmax.com","cloudflare.com","cloudvideotv.*","club-flank.com","codeandkey.com","coinadpro.club","coloradoan.com","comdotgame.com","comicsarmy.com","comixzilla.com","commanders.com","compromath.com","comunio-cl.com","convert2mp3.cx","coolrom.com.au","copyseeker.net","courseboat.com","coverapi.space","coverapi.store","crackshash.com","cracksports.me","crazygames.com","crazyvidup.com","creebhills.com","crichdplays.ru","cricwatch.io>>","crunchyscan.fr","crypt.cybar.to","cryptoforu.org","cryptonetos.ru","cryptotech.fun","cryptstream.de","csgo-ranks.com","cuckoldsex.net","curseforge.com","cwtvembeds.com","cyberscoop.com","czechvideo.org","dagensnytt.com","dailylocal.com","dallasnews.com","dansmovies.com","daotranslate.*","daxfutures.org","dayuploads.com","ddwloclawek.pl","decompiler.com","defenseone.com","delcotimes.com","derstandard.at","derstandard.de","desicinema.org","desicinemas.pk","designbump.com","desiremovies.*","desktophut.com","devdrive.cloud","deviantart.com","diampokusy.com","dicariguru.com","dieblaue24.com","digipuzzle.net","direct-cloud.*","dirtytamil.com","disneyplus.com","dobletecno.com","dodgersway.com","dogsexporn.net","doseofporn.com","dotesports.com","dotfreesex.com","dotfreexxx.com","doujinnote.com","dowfutures.org","downloadming.*","drakecomic.com","dreamfancy.org","duniailkom.com","dvdgayporn.com","dvdporngay.com","e123movies.com","easytodoit.com","eatingwell.com","ecacsports.com","echo-online.de","ed-protect.org","eddiekidiw.com","eftacrypto.com","elcorreoweb.es","electomania.es","elitegoltv.org","elitetorrent.*","elmalajeno.com","emailnator.com","embedsports.me","embedstream.me","empire-anime.*","emturbovid.com","emugameday.com","enryumanga.com","ensuretips.com","epicstream.com","epornstore.com","ericdraken.com","erinsakura.com","erokomiksi.com","eroprofile.com","esgentside.com","esportivos.fun","este-walks.net","estrenosflix.*","estrenosflux.*","ethiopia.co.il","examscisco.com","exbulletin.com","expertplay.net","exteenporn.com","extratorrent.*","extreme-down.*","eztvtorrent.co","f123movies.com","faaduindia.com","fairyanime.com","fakazagods.com","fakedetail.com","fanatik.com.tr","fantacalcio.it","fap-nation.org","faperplace.com","faselhdwatch.*","fastdour.store","fatxxxtube.com","faucetdump.com","fduknights.com","fetishburg.com","fettspielen.de","fhmemorial.com","fibwatch.store","filemirage.com","fileplanet.com","filesharing.io","filesupload.in","film-adult.com","filme-bune.biz","filmpertutti.*","filmy4waps.org","filmypoints.in","filmyzones.com","filtercams.com","finanztreff.de","finderporn.com","findtranny.com","fine-wings.com","firefaucet.win","fitdynamos.com","fleamerica.com","flostreams.xyz","flycutlink.com","fmoonembed.pro","foodgustoso.it","foodiesjoy.com","foodtechnos.in","football365.fr","fooxybabes.com","forex-trnd.com","fosslovers.com","freeforums.net","freegayporn.me","freehqtube.com","freeltc.online","freemodsapp.in","freepasses.org","freepdfcomic.*","freepreset.net","freesoccer.net","freesolana.top","freetubetv.net","freiepresse.de","freshplaza.com","freshremix.net","frostytube.com","fu-1abozhcd.nl","fu-1fbolpvq.nl","fu-4u3omzw0.nl","fu-e4nzgj78.nl","fu-m03aenr9.nl","fu-mqsng72r.nl","fu-p6pwkgig.nl","fu-pl1lqloj.nl","fu-v79xn6ct.nl","fu-ys0tjjs1.nl","fucktube4k.com","fuckundies.com","fullporner.com","fullvoyeur.com","gadgetbond.com","gamefi-mag.com","gameofporn.com","games.amny.com","games.insp.com","games.metro.us","games.metv.com","games.wtop.com","games2rule.com","games4king.com","gamesgames.com","gamesleech.com","gayforfans.com","gaypornhot.com","gayxxxtube.net","gazettenet.com","gdr-online.com","gdriveplayer.*","gecmisi.com.tr","genovatoday.it","getintopcm.com","getintoway.com","getmaths.co.uk","gettapeads.com","gigacourse.com","gisvacancy.com","gknutshell.com","gloryshole.com","goalsport.info","gobearcats.com","gofirmware.com","goislander.com","golightsgo.com","gomoviesfree.*","gomovieshub.io","goodreturns.in","goodstream.one","googlvideo.com","gorecenter.com","gorgeradio.com","goshockers.com","gostanford.com","gostreamon.net","goterriers.com","gotgayporn.com","gotigersgo.com","gourmandix.com","gousfbulls.com","govtportal.org","grannysex.name","grantorrent1.*","grantorrents.*","graphicget.com","grubstreet.com","guitarnick.com","gujjukhabar.in","gurbetseli.net","guruofporn.com","gutfuerdich.co","gyanitheme.com","gyonlineng.com","hairjob.wpx.jp","haloursynow.pl","hanime1-me.top","hannibalfm.net","hardcorehd.xxx","haryanaalert.*","hausgarten.net","hawtcelebs.com","hdhub4one.pics","hdmovies23.com","hdmoviesfair.*","hdmoviesflix.*","hdmoviesmaza.*","hdpornteen.com","healthelia.com","healthmyst.com","hentai-for.net","hentai-hot.com","hentai-one.com","hentaiasmr.moe","hentaiblue.net","hentaibros.com","hentaicity.com","hentaidays.com","hentaihere.com","hentaipins.com","hentairead.com","hentaisenpai.*","hentaiworld.tv","heysigmund.com","hidefninja.com","hilaryhahn.com","hinatasoul.com","hindilinks4u.*","hindimovies.to","hindiporno.pro","hit-erotic.com","hollymoviehd.*","homebooster.de","homeculina.com","homesports.net","hortidaily.com","hotcleaner.com","hotgirlhub.com","hotgirlpix.com","howtocivil.com","hpaudiobooks.*","hyogo.ie-t.net","hypershort.com","i123movies.net","iconmonstr.com","idealfollow.in","idlelivelink.*","ilifehacks.com","ilikecomix.com","imagetwist.com","imgjbxzjv.shop","imgjmgfgm.shop","imgjvmbbm.shop","imgnnnvbrf.sbs","inbbotlist.com","indi-share.com","indiainfo4u.in","indiatimes.com","indopanas.cyou","infocycles.com","infokita17.com","infomaniakos.*","informacion.es","inhumanity.com","insidenova.com","instaporno.net","ios.codevn.net","iqksisgw.xyz>>","isekaitube.com","issstories.xyz","itopmusics.com","itopmusicx.com","iuhoosiers.com","jacksorrell.tv","jalshamoviez.*","janamathaya.lk","japannihon.com","japantaboo.com","javaguides.net","javbangers.com","javggvideo.xyz","javhdvideo.org","javheroine.com","javplayers.com","javsexfree.com","javsubindo.com","javtsunami.com","javxxxporn.com","jeniusplay.com","jewelry.com.my","jizzbunker.com","join2babes.com","joyousplay.xyz","jpopsingles.eu","juegoviejo.com","jugomobile.com","juicy3dsex.com","justababes.com","justembeds.xyz","justthegays.tv","kaboomtube.com","kahanighar.com","kakarotfoot.ru","kannadamasti.*","kashtanka2.com","keepkoding.com","kendralist.com","kgs-invest.com","khabarbyte.com","kickassanime.*","kickasshydra.*","kiddyshort.com","kindergeld.org","kingofdown.com","kiradream.blog","kisahdunia.com","kits4beats.com","klartext-ne.de","kokostream.net","komikmanhwa.me","kompasiana.com","kordramass.com","kurakura21.com","kuruma-news.jp","ladkibahin.com","lampungway.com","laprovincia.es","laradiobbs.net","laser-pics.com","latinatoday.it","lauradaydo.com","layardrama21.*","leaderpost.com","leakedzone.com","leakshaven.com","learnospot.com","lebahmovie.com","ledauphine.com","lesboluvin.com","lesfoodies.com","letmejerk2.com","letmejerk3.com","letmejerk4.com","letmejerk5.com","letmejerk6.com","letmejerk7.com","lewdcorner.com","lifehacker.com","ligainsider.de","limetorrents.*","linemarlin.com","link.vipurl.in","linkconfig.com","livenewsof.com","lizardporn.com","login.asda.com","lokhung888.com","lookmovie186.*","ludwig-van.com","lulustream.com","m.liputan6.com","mactechnews.de","macworld.co.uk","mad4wheels.com","madchensex.com","madmaxworld.tv","mahitimanch.in","mail.yahoo.com","main-spitze.de","maliekrani.com","manga4life.com","mangamovil.net","manganatos.com","mangaraw18.net","mangarawad.fit","mangareader.to","manhuarmtl.com","manhuascan.com","manhwaclub.net","manhwalist.com","manhwaread.com","marketbeat.com","masteranime.tv","mathepower.com","maths101.co.za","matureworld.ws","mcafee-com.com","mega-debrid.eu","megacanais.com","megalinks.info","megamovies.org","megapastes.com","mehr-tanken.de","mejortorrent.*","mercato365.com","meteologix.com","mewingzone.com","milanotoday.it","milanworld.net","milffabrik.com","minecraft.buzz","minorpatch.com","mixmods.com.br","mixrootmod.com","mjsbigblog.com","mkv-pastes.com","mobileporn.cam","mockupcity.com","modagamers.com","modapkfile.com","moddedguru.com","modenatoday.it","moderngyan.com","moegirl.org.cn","mommybunch.com","mommysucks.com","momsextube.pro","mortaltech.com","motchill29.com","motherless.com","motogpstream.*","motorgraph.com","motorsport.com","motscroises.fr","movearnpre.com","moviefree2.com","movies2watch.*","moviesapi.club","movieshd.watch","moviesjoy-to.*","moviesjoyhd.to","moviesnation.*","movisubmalay.*","mtsproducoes.*","multiplayer.it","mummumtime.com","musketfire.com","mxpacgroup.com","mycoolmoviez.*","mydesibaba.com","myforecast.com","myglamwish.com","mylifetime.com","mynewsmedia.co","mypornhere.com","myporntape.com","mysexgamer.com","mysexgames.com","myshrinker.com","mytectutor.com","naasongsfree.*","naijauncut.com","nammakalvi.com","naszemiasto.pl","navysports.com","nazarickol.com","nensaysubs.net","neonxcloud.top","neservicee.com","netchimp.co.uk","new.lewd.ninja","newmovierulz.*","newsbreak24.de","newscard24.com","ngontinh24.com","nicheporno.com","nichetechy.com","nikaplayer.com","ninernoise.com","nirjonmela.com","nishankhatri.*","niteshyadav.in","nitro-link.com","nitroflare.com","niuhuskies.com","nodenspace.com","nosteam.com.ro","notunmovie.net","notunmovie.org","novaratoday.it","novel-gate.com","novelaplay.com","novelgames.com","novostrong.com","nowosci.com.pl","nudebabes.sexy","nulledbear.com","nulledteam.com","nullforums.net","nulljungle.com","nurulislam.org","nylondolls.com","ocregister.com","officedepot.fr","oggitreviso.it","okamimiost.com","omegascans.org","onlineatlas.us","onlinekosh.com","onlineporno.cc","onlybabes.site","openstartup.tm","opentunnel.net","oregonlive.com","organismes.org","orgasmlist.com","orgyxxxhub.com","orovillemr.com","osubeavers.com","osuskinner.com","oteknologi.com","ourenseando.es","overhentai.net","palapanews.com","palofw-lab.com","pandamovies.me","pandamovies.pw","pandanote.info","pantieshub.net","panyshort.link","papafoot.click","paradepets.com","paris-tabi.com","paste-drop.com","paylaterin.com","peachytube.com","pelismartv.com","pelismkvhd.com","pelispedia24.*","pelispoptv.com","perfectgirls.*","perfektdamen.*","pervertium.com","perverzija.com","pethelpful.com","petitestef.com","pherotruth.com","phoneswiki.com","picgiraffe.com","picjgfjet.shop","pickleball.com","pictryhab.shop","picturelol.com","pimylifeup.com","pink-sluts.net","pirate4all.com","pirateblue.com","pirateblue.net","pirateblue.org","piratemods.com","pivigames.blog","planetsuzy.org","platinmods.com","play-games.com","playcast.click","player-cdn.com","player.rtl2.de","player.sbnmp.*","playermeow.com","playertv24.com","playhydrax.com","podkontrola.pl","polskatimes.pl","pop-player.com","popno-tour.net","porconocer.com","porn0video.com","pornahegao.xyz","pornasians.pro","pornerbros.com","pornflixhd.com","porngames.club","pornharlot.net","pornhd720p.com","pornincest.net","pornissimo.org","pornktubes.net","pornodavid.com","pornodoido.com","pornofelix.com","pornofisch.com","pornojenny.net","pornoperra.com","pornopics.site","pornoreino.com","pornotommy.com","pornotrack.net","pornozebra.com","pornrabbit.com","pornrewind.com","pornsocket.com","porntrex.video","porntube15.com","porntubegf.com","pornvideoq.com","pornvintage.tv","portaldoaz.org","portalyaoi.com","poscitechs.lol","powerover.site","premierftp.com","prepostseo.com","pressemedie.dk","primagames.com","primemovies.pl","primevid.click","primevideo.com","proapkdown.com","pruefernavi.de","purepeople.com","pussyspace.com","pussyspace.net","pussystate.com","put-locker.com","putingfilm.com","queerdiary.com","querofilmehd.*","quest4play.xyz","questloops.com","quotesopia.com","rabbitsfun.com","radiotimes.com","radiotunes.com","rahim-soft.com","ramblinfan.com","rankersadda.in","rapid-cloud.co","ravenscans.com","rbxscripts.net","realbbwsex.com","realgfporn.com","realmoasis.com","realmomsex.com","realsimple.com","record-bee.com","recordbate.com","redecanaistv.*","redfaucet.site","rednowtube.com","redpornnow.com","redtubemov.com","reggiotoday.it","reisefrage.net","resortcams.com","revealname.com","reviersport.de","reviewrate.net","revivelink.com","richtoscan.com","riminitoday.it","ringelnatz.net","ripplehub.site","rlxtech24h.com","rmacsports.org","roadtrippin.fr","robbreport.com","rokuhentai.com","rollrivers.com","rollstroll.com","romaniasoft.ro","romhustler.org","royaledudes.io","rpmplay.online","rubyvidhub.com","rugbystreams.*","ruinmyweek.com","russland.jetzt","rusteensex.com","ruyashoujo.com","safefileku.com","safemodapk.com","samaysawara.in","sanfoundry.com","saratogian.com","sat.technology","sattaguess.com","saveshared.com","savevideo.tube","sciencebe21.in","scoreland.name","scrap-blog.com","screenflash.io","screenrant.com","scriptsomg.com","scriptsrbx.com","scriptzhub.com","section215.com","seeitworks.com","seekplayer.vip","seirsanduk.com","seksualios.com","selfhacked.com","serienstream.*","series2watch.*","seriesonline.*","seriesperu.com","seriesyonkis.*","serijehaha.com","severeporn.com","sex-empire.org","sex-movies.biz","sexcams-24.com","sexgamescc.com","sexgayplus.com","sextubedot.com","sextubefun.com","sextubeset.com","sexvideos.host","sexyaporno.com","sexybabes.club","sexybabesz.com","sexynakeds.com","sgvtribune.com","shahid.mbc.net","sharedwebs.com","shazysport.pro","sheamateur.com","shegotass.info","sheikhmovies.*","shesfreaky.com","shinobijawi.id","shooshtime.com","shop123.com.tw","short-url.link","shorterall.com","shrinkearn.com","shueisharaw.tv","shupirates.com","sieutamphim.me","siliconera.com","singjupost.com","sitarchive.com","sitemini.io.vn","siusalukis.com","skat-karten.de","slickdeals.net","slideshare.net","smartinhome.pl","smarttrend.xyz","smiechawatv.pl","snhupenmen.com","solidfiles.com","soranews24.com","soundboards.gg","spaziogames.it","speedostream.*","speedynews.xyz","speisekarte.de","spiele.bild.de","spieletipps.de","spiritword.net","spoilerplus.tv","sporteurope.tv","sportsdark.com","sportsnaut.com","sportsonline.*","sportsurge.net","spy-x-family.*","stadelahly.net","stahnivideo.cz","standard.co.uk","stardewids.com","starzunion.com","stbemuiptv.com","steamverde.net","stireazilei.eu","storiesig.info","storyblack.com","stownrusis.com","stream2watch.*","streamdesi.com","streamecho.top","streamlord.com","streamruby.com","stripehype.com","studydhaba.com","subtitleone.cc","subtorrents1.*","super-games.cz","superanimes.in","suvvehicle.com","svetserialu.io","svetserialu.to","swatchseries.*","swordalada.org","tainhanhvn.com","talkceltic.net","talkjarvis.com","tamilnaadi.com","tamilprint29.*","tamilprint30.*","tamilprint31.*","tamilprinthd.*","taradinhos.com","tarnkappe.info","taschenhirn.de","tech-blogs.com","tech-story.net","techhelpbd.com","techiestalk.in","techkeshri.com","techmyntra.net","techperiod.com","techsignin.com","techsslash.com","tecnoaldia.net","tecnobillo.com","tecnoscann.com","tecnoyfoto.com","teenager365.to","teenextrem.com","teenhubxxx.com","teensexass.com","tekkenmods.com","telemagazyn.pl","telesrbija.com","temp.modpro.co","tennisactu.net","testserver.pro","textograto.com","textovisia.com","texturecan.com","theargus.co.uk","theavtimes.com","thefantazy.com","thefitchen.com","theflixertv.to","thehesgoal.com","themeslide.com","thenetnaija.co","thepiratebay.*","theporngod.com","therichest.com","thesextube.net","thetakeout.com","thethothub.com","thetimes.co.uk","thevideome.com","thewambugu.com","thotchicks.com","titsintops.com","tojimangas.com","tomshardware.*","topcartoons.tv","topsporter.net","topwebgirls.eu","torinotoday.it","tormalayalam.*","torontosun.com","torovalley.net","torrentmac.net","totalsportek.*","tournguide.com","tous-sports.ru","towerofgod.top","toyokeizai.net","tpornstars.com","trafficnews.jp","trancehost.com","trannyline.com","trashbytes.net","traumporno.com","travelhost.com","treehugger.com","trendflatt.com","trentonian.com","trentotoday.it","tribunnews.com","tronxminer.com","truckscout24.*","tuberzporn.com","tubesafari.com","tubexxxone.com","tukangsapu.net","turbocloud.xyz","turkish123.com","tv-films.co.uk","tv.youtube.com","tvspielfilm.de","twincities.com","u123movies.com","ucfknights.com","uciteljica.net","uclabruins.com","ufreegames.com","uiuxsource.com","uktvplay.co.uk","unblocked.name","unblocksite.pw","uncpbraves.com","uncwsports.com","unionmanga.xyz","unlvrebels.com","uoflsports.com","uploadbank.com","uploadking.net","uploadmall.com","uploadraja.com","upnewsinfo.com","uptostream.com","urlbluemedia.*","urldecoder.org","usctrojans.com","usdtoreros.com","usersdrive.com","utepminers.com","uyduportal.net","v2movies.click","vavada5com.com","vbox7-mp3.info","vedamdigi.tech","vegamovies4u.*","vegamovvies.to","veo-hentai.com","vestimage.site","video-seed.xyz","video1tube.com","videogamer.com","videolyrics.in","videos1002.com","videoseyred.in","videosgays.net","vidguardto.xyz","vidhidepre.com","vidhidevip.com","vidstreams.net","view.ceros.com","viewmature.com","vikistream.com","viralpedia.pro","visortecno.com","vmorecloud.com","voiceloves.com","voipreview.org","voltupload.com","voyeurblog.net","vulgarmilf.com","vviruslove.com","wantmature.com","warefree01.com","watch-series.*","watchasians.cc","watchomovies.*","watchpornx.com","watchseries1.*","watchseries9.*","wcoanimedub.tv","wcoanimesub.tv","wcoforever.net","weatherx.co.in","webseries.club","weihnachten.me","wellplated.com","wenxuecity.com","westmanga.info","wetteronline.*","whatfontis.com","whatismyip.com","whats-new.cyou","whatshowto.com","whodatdish.com","whoisnovel.com","wiacsports.com","wifi4games.com","windbreaker.me","wizhdsports.fi","wkutickets.com","wmubroncos.com","womennaked.net","wordpredia.com","world4ufree1.*","worldofbin.com","wort-suchen.de","worthcrete.com","wow-mature.com","wowxxxtube.com","wspolczesna.pl","wsucougars.com","www-y2mate.com","www.amazon.com","www.lenovo.com","www.reddit.com","www.tiktok.com","x2download.com","xanimeporn.com","xclusivejams.*","xdld.pages.dev","xerifetech.com","xfrenchies.com","xhofficial.com","xhomealone.com","xhwebsite5.com","xiaomi-miui.gr","xmegadrive.com","xnxxporn.video","xxx-videos.org","xxxbfvideo.net","xxxblowjob.pro","xxxdessert.com","xxxextreme.org","xxxtubedot.com","xxxtubezoo.com","xxxvideohd.net","xxxxselfie.com","xxxymovies.com","xxxyoungtv.com","yabaisub.cloud","yakisurume.com","yarnutopia.com","yelitzonpc.com","yomucomics.com","yottachess.com","youngbelle.net","youporngay.com","youtubetomp3.*","yoututosjeff.*","yuki0918kw.com","yumstories.com","yunakhaber.com","zazzybabes.com","zertalious.xyz","zippyshare.day","zona-leros.com","zonebourse.com","zooredtube.com","10hitmovies.com","123movies-org.*","123moviesfree.*","123moviesfun.is","18-teen-sex.com","18asiantube.com","18porncomic.com","18teen-tube.com","1direct-cloud.*","1vid1shar.space","2tamilprint.pro","3xamatorszex.hu","4allprograms.me","5masterzzz.site","6indianporn.com","admediaflex.com","adminreboot.com","adrianoluis.net","adrinolinks.com","advicefunda.com","aeroxplorer.com","aflamsexnek.com","aflizmovies.com","agrarwetter.net","ai.hubtoday.app","aitoolsfree.org","alanyapower.com","aliezstream.pro","alldeepfake.ink","alldownplay.xyz","allotech-dz.com","allpussynow.com","alltechnerd.com","allucanheat.com","amazon-love.com","amritadrino.com","anallievent.com","androidapks.biz","androidsite.net","androjungle.com","anime-sanka.com","anime7.download","animedao.com.ru","animenew.com.br","animesexbar.com","animesultra.net","animexxxsex.com","antenasports.ru","aoashimanga.com","apfelpatient.de","apkmagic.com.ar","app.blubank.com","arabshentai.com","arcadepunks.com","archivebate.com","archiwumalle.pl","argio-logic.net","asia.5ivttv.vip","asiangaysex.net","asianhdplay.net","askcerebrum.com","astrumscans.xyz","atemporal.cloud","atleticalive.it","atresplayer.com","au-di-tions.com","auto-service.de","autoindustry.ro","automat.systems","automothink.com","avoiderrors.com","awdescargas.com","azcardinals.com","babesaround.com","babesinporn.com","babesxworld.com","badgehungry.com","bangpremier.com","baylorbears.com","bdsm-photos.com","bdsmkingdom.xyz","bdsmporntub.com","bdsmwaytube.com","beammeup.com.au","bedavahesap.org","beingmelody.com","bellezashot.com","bengalisite.com","bengalxpress.in","bentasker.co.uk","best-shopme.com","best18teens.com","bestialporn.com","beurettekeh.com","bgmateriali.com","bgmi32bitapk.in","bgsufalcons.com","bibliopanda.com","big12sports.com","bigboobs.com.es","bigtitslust.com","bike-urious.com","bintangplus.com","biologianet.com","blackavelic.com","blackpornhq.com","blacksexmix.com","blogenginee.com","blogpascher.com","blowxxxtube.com","bluebuddies.com","bluedrake42.com","bluemanhoop.com","bluemediafile.*","bluemedialink.*","bluemediaurls.*","bokepsin.in.net","bolly4umovies.*","bollydrive.rest","boobs-mania.com","boobsforfun.com","bookpraiser.com","boosterx.stream","boxingstream.me","boxingvideo.org","boyfriendtv.com","braziliannr.com","bresciatoday.it","brieffreunde.de","brother-usa.com","buffsports.io>>","buffstreamz.com","buickforums.com","bulbagarden.net","bunkr-albums.io","burningseries.*","buzzheavier.com","camwhoreshd.com","camwhorespy.com","camwhorez.video","captionpost.com","carbonite.co.za","casutalaurei.ro","cataniatoday.it","catchthrust.net","cempakajaya.com","cerberusapp.com","chatropolis.com","cheatglobal.com","check-imei.info","cheese-cake.net","cherrynudes.com","chromeready.com","cieonline.co.uk","cinemakottaga.*","cineplus123.org","citibank.com.sg","ciudadgamer.com","claimclicks.com","classicoder.com","classifarms.com","cloud9obits.com","cloudnestra.com","code-source.net","codeitworld.com","codemystery.com","codeproject.com","coloringpage.eu","comicsporno.xxx","comoinstalar.me","compucalitv.com","computerbild.de","consoleroms.com","coromon.wiki.gg","cosplaynsfw.xyz","coursewikia.com","cpomagazine.com","cracking-dz.com","crackthemes.com","crazyashwin.com","crazydeals.live","creditsgoal.com","crunchyroll.com","crunchytech.net","cryptoearns.com","cta-fansite.com","cubbiescrib.com","cumshotlist.com","cutiecomics.com","cyberlynews.com","cybertechng.com","cyclingnews.com","cycraracing.com","daemonanime.net","daily-times.com","dailyangels.com","dailybreeze.com","dailycaller.com","dailycamera.com","dailyecho.co.uk","dailyknicks.com","dailymail.co.uk","dailymotion.com","dailypost.co.uk","dailystar.co.uk","dark-gaming.com","dawindycity.com","db-creation.net","dbupatriots.com","dbupatriots.org","deathonnews.com","decomaniacos.es","definitions.net","desbloqueador.*","descargas2020.*","desirenovel.com","desixxxtube.org","detikbangka.com","deutschsex.mobi","devopslanka.com","dhankasamaj.com","digimonzone.com","digiztechno.com","diminimalis.com","direct-cloud.me","dirtybadger.com","discoveryplus.*","diversanews.com","dlouha-videa.cz","dlstreams.top>>","dobleaccion.xyz","docs.google.com","dollarindex.org","domainwheel.com","donnaglamour.it","donnerwetter.de","dopomininfo.com","dota2freaks.com","dotadostube.com","downphanmem.com","drake-scans.com","drakerelays.org","drama-online.tv","dramanice.video","dreamcheeky.com","drinksmixer.com","driveplayer.net","droidmirror.com","dtbps3games.com","duplex-full.lol","eaglesnovel.com","easylinkref.com","ebaticalfel.com","editorsadda.com","edmontonsun.com","edumailfree.com","eksporimpor.com","elektrikmen.com","elpasotimes.com","elperiodico.com","embed.acast.com","embed.meomeo.pw","embedcanais.com","embedsports.top","embedstreams.me","emperorscan.com","empire-stream.*","engstreams.shop","enryucomics.com","erotikclub35.pw","esportsmonk.com","esportsnext.com","exactpay.online","exam-results.in","explorecams.com","explorosity.net","exporntoons.net","exposestrat.com","extratorrents.*","fabioambrosi.it","fapfapgames.com","farmeramania.de","faselhd-watch.*","fastcompany.com","faucetbravo.fun","fcportables.com","fellowsfilm.com","femdomworld.com","femjoybabes.com","feral-heart.com","fidlarmusic.com","file-upload.net","file-upload.org","file.gocmod.com","filecrate.store","filehost9.com>>","filespayout.com","filmesonlinex.*","filmoviplex.com","filmy4wap.co.in","filmyzilla5.com","finalnews24.com","financebolo.com","financemonk.net","financewada.com","financeyogi.net","finanzfrage.net","findnewjobz.com","fingerprint.com","firmenwissen.de","fitnesstipz.com","fiveyardlab.com","fizzlefacts.com","fizzlefakten.de","flashsports.org","flordeloto.site","flyanimes.cloud","flygbussarna.se","folgenporno.com","foodandwine.com","footyhunter.lol","forex-yours.com","foxseotools.com","freebitcoin.win","freebnbcoin.com","freecardano.com","freecourse.tech","freecricket.net","freegames44.com","freemockups.org","freeomovie.info","freepornjpg.com","freepornsex.net","freethemesy.com","freevpshere.com","freewebcart.com","french-stream.*","fsportshd.xyz>>","ftsefutures.org","fu-12qjdjqh.lol","fu-c66heipu.lol","fu-hbr4fzp4.lol","fu-hjyo3jqu.lol","fu-l6d0ptc6.lol","fuckedporno.com","fullxxxporn.net","fztvseries.live","g-streaming.com","gadgetspidy.com","gadzetomania.pl","gamecopyworld.*","gameplayneo.com","gamersglobal.de","games.macon.com","games.word.tips","gamesaktuell.de","gamestorrents.*","gaminginfos.com","gamingvital.com","gartendialog.de","gayboystube.top","gaypornhdfree.*","gaypornlove.net","gaypornwave.com","gayvidsclub.com","gazetaprawna.pl","geiriadur.ac.uk","geissblog.koeln","gendatabase.com","georgiadogs.com","germanvibes.org","gesund-vital.de","getexploits.com","gewinnspiele.tv","gfx-station.com","girlssexxxx.com","givemeaporn.com","givemesport.com","glavmatures.com","globaldjmix.com","go.babylinks.in","gocreighton.com","goexplorers.com","gofetishsex.com","gofile.download","gogoanime.co.in","goislanders.com","gokushiteki.com","golderotica.com","golfchannel.com","gomacsports.com","gomarquette.com","gopsusports.com","goxxxvideos.com","goyoungporn.com","gradehgplus.com","grandmatube.pro","grannyfucko.com","grasshopper.com","greattopten.com","grootnovels.com","gsmfirmware.net","gsmfreezone.com","gsmmessages.com","gut-erklaert.de","hacksnation.com","handypornos.net","hanimesubth.com","hardcoreluv.com","hardwareluxx.de","hardxxxmoms.com","harshfaucet.com","hd-analporn.com","hd-easyporn.com","hdjavonline.com","hds-streaming.*","healthfatal.com","heavyfetish.com","heidelberg24.de","helicomicro.com","hentai-moon.com","hentai-senpai.*","hentai2read.com","hentaiarena.com","hentaibatch.com","hentaibooty.com","hentaicloud.com","hentaicovid.org","hentaifreak.org","hentaigames.app","hentaihaven.com","hentaihaven.red","hentaihaven.vip","hentaihaven.xxx","hentaiporno.xxx","hentaipulse.com","hentaitube1.lol","heroine-xxx.com","hesgoal-live.io","hiddencamhd.com","hindinews360.in","hokiesports.com","hollaforums.com","hollymoviehd.cc","hollywoodpq.com","hookupnovel.com","hostserverz.com","hot-cartoon.com","hotgameplus.com","hotmediahub.com","hotpornfile.org","hotsexstory.xyz","hotstunners.com","hotxxxpussy.com","hqxxxmovies.com","hscprojects.com","hypicmodapk.org","iban-rechner.de","ibcomputing.com","ibeconomist.com","ideal-teens.com","ikramlar.online","ilbassoadige.it","ilgazzettino.it","illicoporno.com","ilmessaggero.it","ilovetoplay.xyz","ilsole24ore.com","imagelovers.com","imgqnnnebrf.sbs","incgrepacks.com","indiakablog.com","infrafandub.com","inside-handy.de","instabiosai.com","insuredhome.org","interracial.com","investcrust.com","inyatrust.co.in","iptvjournal.com","italianoxxx.com","itsonsitetv.com","iwantmature.com","januflix.expert","japangaysex.com","japansporno.com","japanxxxass.com","jastrzabpost.pl","jav-torrent.org","javcensored.net","javenglish.cc>>","javindosub.site","javmoviexxx.com","javpornfull.com","javraveclub.com","javteentube.com","javtrailers.com","jaysjournal.com","jetztspielen.de","jnvharidwar.org","jobslampung.net","johntryopen.com","jokerscores.com","just-upload.com","kabarportal.com","karaoketexty.cz","kasvekuvvet.net","katmoviehd4.com","kattannonser.se","kawarthanow.com","keezmovies.surf","ketoconnect.net","ketubanjiwa.com","kickass-anime.*","kickassanime.ch","kiddyearner.com","kingsleynyc.com","kisshentaiz.com","kitabmarkaz.xyz","kittycatcam.com","kodewebsite.com","komikdewasa.art","komorkomania.pl","krakenfiles.com","kreiszeitung.de","krktcountry.com","kstorymedia.com","kurierverlag.de","kyoto-kanko.net","la123movies.org","langitmovie.com","laptechinfo.com","latinluchas.com","lavozdigital.es","ldoceonline.com","learnedclub.com","lecrabeinfo.net","legionscans.com","lendrive.web.id","lesbiansex.best","levante-emv.com","libertycity.net","librasol.com.br","liga3-online.de","lightsnovel.com","link.3dmili.com","link.asiaon.top","link.cgtips.org","link.codevn.net","linksheild.site","linkss.rcccn.in","linkvertise.com","linux-talks.com","live.arynews.tv","livesport24.net","livestreames.us","livestreamtv.pk","livexscores.com","livingathome.de","livornotoday.it","lombardiave.com","lookmoviess.com","looptorrent.org","lotusgamehd.xyz","lovelynudez.com","lovingsiren.com","luchaonline.com","lucrebem.com.br","lukesitturn.com","lulustream.live","lustesthd.cloud","lycee-maroc.com","macombdaily.com","macrotrends.net","magdownload.org","maisonbrico.com","mangahentai.xyz","mangahere.today","mangakakalot.gg","mangaonline.fun","mangaraw1001.cc","mangarawjp.asia","mangaromance.eu","mangarussia.com","manhuarmmtl.com","manhwahentai.me","manoramamax.com","mantrazscan.com","marie-claire.es","marimo-info.net","marketmovers.it","maskinbladet.dk","mastakongo.info","mathsstudio.com","mathstutor.life","maxcheaters.com","maxjizztube.com","maxstream.video","maxtubeporn.net","me-encantas.com","medeberiya.site","medeberiya1.com","medeberiyaa.com","medeberiyas.com","medeberiyax.com","mediacast.click","mega4upload.com","mega4upload.net","mejortorrento.*","mejortorrents.*","mejortorrentt.*","memoriadatv.com","mensfitness.com","mensjournal.com","mentalfloss.com","mercerbears.com","mercurynews.com","messinatoday.it","metal-hammer.de","milliyet.com.tr","miniminiplus.pl","minutolivre.com","mirrorpoi.my.id","mixrootmods.com","mmsmasala27.com","mobility.com.ng","mockuphunts.com","modporntube.com","moflix-stream.*","molbiotools.com","mommy-pussy.com","momtubeporn.xxx","motherporno.com","mov18plus.cloud","moviemaniak.com","movierulzfree.*","movierulzlink.*","movies2watch.tv","moviescounter.*","moviesonline.fm","moviessources.*","moviessquad.com","movieuniverse.*","mp3fromyou.tube","mrdeepfakes.com","mscdroidlabs.es","msdos-games.com","msonglyrics.com","msuspartans.com","muchohentai.com","multifaucet.org","musiclutter.xyz","musikexpress.de","mybestxtube.com","mydesiboobs.com","myfreeblack.com","mysexybabes.com","mywatchseries.*","myyoungbabe.com","mzansinudes.com","naijanowell.com","naijaray.com.ng","nakedbabes.club","nangiphotos.com","nativesurge.net","nativesurge.top","naughtyza.co.za","nbareplayhd.com","nbcolympics.com","necksdesign.com","needgayporn.com","nekopoicare.*>>","netflixlife.com","networkhint.com","news-herald.com","news-leader.com","newstechone.com","newyorkjets.com","nflspinzone.com","nicexxxtube.com","nizarstream.com","noindexscan.com","noithatmyphu.vn","nokiahacking.pl","nosteamgames.ro","notebookcheck.*","notesformsc.org","noteshacker.com","notunmovie.link","novelssites.com","nsbtmemoir.site","nsfwmonster.com","nsfwyoutube.com","nswdownload.com","nu6i-bg-net.com","nudeslegion.com","nudismteens.com","nukedpacks.site","nullscripts.net","nursexfilme.com","nyaatorrent.com","oceanofmovies.*","ohmirevista.com","okiemrolnika.pl","olamovies.store","olympustaff.com","omgexploits.com","online-smss.com","onlinekosten.de","open3dmodel.com","openculture.com","openloading.com","order-order.com","orgasmatrix.com","oromedicine.com","otokukensaku.jp","otomi-games.com","ourcoincash.xyz","oyundunyasi.net","ozulscansen.com","pacersports.com","pageflutter.com","pakkotoisto.com","palermotoday.it","panda-novel.com","pandamovies.org","pandasnovel.com","paperzonevn.com","pawastreams.org","pawastreams.pro","pcgameszone.com","peliculas8k.com","peliculasmx.net","pelisflix20.*>>","pelismarthd.com","pelisxporno.net","pendekarsubs.us","pepperlive.info","perezhilton.com","perfektdamen.co","persianhive.com","perugiatoday.it","pewresearch.org","pflege-info.net","phonerotica.com","phongroblox.com","phpscripttr.com","pianetalecce.it","pics4upload.com","picxnkjkhdf.sbs","pimpandhost.com","pinoyalbums.com","pinoyrecipe.net","piratehaven.xyz","pisshamster.com","pixdfdjkkr.shop","pixkfjtrkf.shop","planetfools.com","platinporno.com","play.hbomax.com","player.msmini.*","plugincrack.com","pocket-lint.com","popcornstream.*","popdaily.com.tw","porhubvideo.com","porn-monkey.com","pornexpanse.com","pornfactors.com","porngameshd.com","pornhegemon.com","pornhoarder.net","porninblack.com","porno-porno.net","porno-rolik.com","pornohammer.com","pornohirsch.net","pornoklinge.com","pornomanoir.com","pornrusskoe.com","portable4pc.com","powergam.online","premiumporn.org","privatemoviez.*","projectfreetv.*","promimedien.com","proxydocker.com","punishworld.com","purelyceleb.com","pussy3dporn.com","pussyhothub.com","qatarstreams.me","quiltfusion.com","quotesshine.com","r1.richtoon.top","rackusreads.com","radionatale.com","radionylive.com","radiorockon.com","railwebcams.net","rajssoid.online","rangerboard.com","ravennatoday.it","rctechsworld.in","readbitcoin.org","readhunters.xyz","readingpage.fun","redpornblog.com","remodelista.com","rennrad-news.de","renoconcrete.ca","rentbyowner.com","reportera.co.kr","restegourmet.de","retroporn.world","risingapple.com","ritacandida.com","robot-forum.com","rojadirectatv.*","rollingstone.de","romaierioggi.it","romfirmware.com","root-nation.com","route-fifty.com","rule34vault.com","runnersworld.de","rushuploads.com","ryansharich.com","saabcentral.com","salernotoday.it","samapkstore.com","sampledrive.org","samuraiscan.com","samuraiscan.org","santhoshrcf.com","satoshi-win.xyz","savealoonie.com","scatnetwork.com","schwaebische.de","sdmoviespoint.*","sekaikomik.live","serienstream.to","seriesmetro.net","seriesonline.sx","seriouseats.com","serverbd247.com","serviceemmc.com","setfucktube.com","sex-torrent.net","sexanimesex.com","sexoverdose.com","sexseeimage.com","sexwebvideo.com","sexxxanimal.com","sexy-parade.com","sexyerotica.net","seznamzpravy.cz","sfmcompile.club","shadagetech.com","shadowrangers.*","sharegdrive.com","sharinghubs.com","shemalegape.net","shomareh-yab.ir","shopkensaku.com","short-jambo.ink","showcamrips.com","showrovblog.com","shrugemojis.com","shugraithou.com","siamfishing.com","sieutamphim.org","singingdalong.*","siriusfiles.com","sitetorrent.com","sivackidrum.net","slapthesign.com","sleazedepot.com","sleazyneasy.com","smartcharts.net","sms-anonyme.net","sms-receive.net","smsonline.cloud","smumustangs.com","soconsports.com","software-on.com","softwaresde.com","solarchaine.com","sommerporno.com","sondriotoday.it","souq-design.com","sourceforge.net","spanishdict.com","spardhanews.com","sport890.com.uy","sports-stream.*","sportsblend.net","sportsonline.si","sportsonline.so","sportsplays.com","sportsseoul.com","sportstiger.com","sportstreamtv.*","starstreams.pro","start-to-run.be","stbemuiptvn.com","sterkinekor.com","stream.bunkr.ru","streamnoads.com","stronakobiet.pl","studybullet.com","subtitlecat.com","sueddeutsche.de","sullacollina.it","sumirekeiba.com","suneelkevat.com","superdeporte.es","superembeds.com","supermarches.ca","supermovies.org","svethardware.cz","swift4claim.com","syracusefan.com","tabooanime.club","tagesspiegel.de","tamilanzone.com","tamilultra.team","tapeantiads.com","tapeblocker.com","team-octavi.com","techacrobat.com","techadvisor.com","techastuces.com","techedubyte.com","techinferno.com","technichero.com","technorozen.com","techoreview.com","techprakash.com","techsbucket.com","techyhigher.com","techymedies.com","tedenglish.site","teen-hd-sex.com","teenfucksex.com","teenpornjpg.com","teensextube.xxx","teenxxxporn.pro","telegraph.co.uk","telepisodes.org","temporeale.info","tenbaiquest.com","tenies-online.*","tennisonline.me","tennisstreams.*","teracourses.com","texassports.com","textreverse.com","thaiairways.com","the-mystery.org","the2seasons.com","the5krunner.com","theappstore.org","thebarchive.com","thebigblogs.com","theclashify.com","thedilyblog.com","thegrowthop.com","thejetpress.com","thejoblives.com","themoviesflix.*","theprovince.com","thereporter.com","thestreameast.*","thetoneking.com","theusaposts.com","thewebflash.com","theyarehuge.com","thingiverse.com","thingstomen.com","thisisrussia.io","thueringen24.de","thumpertalk.com","ticketmaster.sg","tickhosting.com","ticonsiglio.com","tieba.baidu.com","tienganhedu.com","tires.costco.ca","today-obits.com","todopolicia.com","toeflgratis.com","tokyomotion.com","tokyomotion.net","toledoblade.com","topnewsshow.com","topperpoint.com","topstarnews.net","torascripts.org","tornadomovies.*","torrentgalaxy.*","torrentgame.org","torrentstatus.*","torresette.news","tradingview.com","transfermarkt.*","trendohunts.com","trevisotoday.it","triesteprima.it","true-gaming.net","trytutorial.com","tubegaytube.com","tubepornnow.com","tudongnghia.com","tuktukcinma.com","turbovidhls.com","turkeymenus.com","tusachmanga.com","tvanouvelles.ca","tvsportslive.fr","twistedporn.com","twitchnosub.com","tyler-brown.com","u6lyxl0w.skin>>","ukathletics.com","ukaudiomart.com","ultramovies.org","undeniable.info","underhentai.net","unipanthers.com","updateroj24.com","uploadbeast.com","uploadcloud.pro","usaudiomart.com","user.guancha.cn","vectogravic.com","veekyforums.com","vegamovies3.org","veneziatoday.it","verpelis.gratis","veryfuntime.com","verywellfit.com","vfxdownload.net","vibezhub.com.ng","vicenzatoday.it","viciante.com.br","vidcloudpng.com","video.genyt.net","videodidixx.com","videosputas.xxx","vidsrc-embed.ru","vik1ngfile.site","ville-ideale.fr","viralharami.com","viralxvideos.es","voyageforum.com","vtplayer.online","wantedbabes.com","warmteensex.com","watch-my-gf.com","watch.sling.com","watchf1full.com","watchfreexxx.pw","watchhentai.net","watchmovieshd.*","watchporn4k.com","watchpornfree.*","watchseries8.to","watchserieshd.*","watchtvseries.*","watchxxxfree.pw","webmatrices.com","webtoonscan.com","wegotcookies.co","welovemanga.one","weltfussball.at","wemakesites.net","wheelofgold.com","wholenotism.com","wholevideos.com","wieistmeineip.*","wikijankari.com","wikipooster.com","wikisharing.com","windowslite.net","windsorstar.com","winnipegsun.com","witcherhour.com","womenshealth.de","worldgyan18.com","worldofiptv.com","worldsports.*>>","wowpornlist.xyz","wowyoungsex.com","wpgdadatong.com","wristreview.com","writeprofit.org","wvv-fmovies.com","www.youtube.com","xfuckonline.com","xhardhempus.net","xianzhenyuan.cn","xiaomitools.com","xkeezmovies.com","xmoviesforyou.*","xn--31byd1i.net","xnudevideos.com","xnxxhamster.net","xxxindianporn.*","xxxparodyhd.net","xxxpornmilf.com","xxxtubegain.com","xxxtubenote.com","xxxtubepass.com","xxxwebdlxxx.top","yanksgoyard.com","yazilidayim.net","yesmovies123.me","yeutienganh.com","yogablogfit.com","yomoviesnow.com","yorkpress.co.uk","youlikeboys.com","youmedemblik.nl","young-pussy.com","youranshare.com","yourporngod.com","youtubekids.com","yrtourguide.com","ytconverter.app","yuramanga.my.id","zeroradio.co.uk","zonavideosx.com","zone-annuaire.*","zoominar.online","007stockchat.com","123movies-free.*","18-teen-porn.com","18-teen-tube.com","18adultgames.com","18comic-gquu.vip","1movielinkbd.com","1movierulzhd.pro","24pornvideos.com","2kspecialist.net","4fingermusic.com","8-ball-magic.com","9now.nine.com.au","about-drinks.com","activevoyeur.com","activistpost.com","actresstoday.com","adblockstrtape.*","adblockstrtech.*","adult-empire.com","adultoffline.com","adultporn.com.es","advertafrica.net","agedtubeporn.com","aghasolution.com","ajaxshowtime.com","ajkalerbarta.com","alleveilingen.be","alleveilingen.nl","alliptvlinks.com","allporncomic.com","alphagames4u.com","alphapolis.co.jp","alphasource.site","altselection.com","anakteknik.co.id","analsexstars.com","analxxxvideo.com","androidadult.com","androidfacil.org","androidgreek.com","androidspill.com","anime-odcinki.pl","animesexclip.com","animetwixtor.com","animixstream.com","antennasports.ru","aopathletics.org","apkandroidhub.in","app.simracing.gp","applediagram.com","aquariumgays.com","arezzonotizie.it","articlesmania.me","asianmassage.xyz","asianpornjav.com","assettoworld.com","asyaanimeleri.pw","athlonsports.com","atlantisscan.com","auburntigers.com","audiofanzine.com","audycje.tokfm.pl","autotrader.co.uk","avellinotoday.it","azamericasat.net","azby.fmworld.net","baby-vornamen.de","backfirstwo.site","backyardboss.net","backyardpapa.com","bangyourwife.com","barrier-free.net","base64decode.org","bcuathletics.com","beaddiagrams.com","beritabangka.com","berlin-teltow.de","bestasiansex.pro","bestblackgay.com","bestcash2020.com","bestgamehack.top","bestgrannies.com","besthdmovies.com","bestpornflix.com","bestsextoons.com","biblegateway.com","bigbuttshub2.top","bikeportland.org","birdswatcher.com","bisceglielive.it","bitchesgirls.com","blackandteal.com","blog.livedoor.jp","blowjobfucks.com","bloxinformer.com","bloxyscripts.com","bluemediafiles.*","bluerabbitrx.com","bmw-scooters.com","boardingarea.com","boerse-online.de","bollywoodfilma.*","bondagevalley.cc","booksbybunny.com","boolwowgirls.com","bootstrample.com","bostonherald.com","boysxclusive.com","brandbrief.co.kr","bravoerotica.com","bravoerotica.net","breatheheavy.com","breedingmoms.com","buffalobills.com","buffalowdown.com","businesstrend.jp","butlersports.com","butterpolish.com","call2friends.com","caminspector.net","campusfrance.org","camvideoshub.com","camwhoresbay.com","caneswarning.com","cartoonporno.xxx","catmovie.website","ccnworldtech.com","celtadigital.com","cervezaporno.com","championdrive.co","charexempire.com","chattanoogan.com","cheatography.com","chelsea24news.pl","chicagobears.com","chieflyoffer.com","choiceofmods.com","chubbyelders.com","cizzyscripts.com","claimsatoshi.xyz","clever-tanken.de","clickforhire.com","clickndownload.*","clipconverter.cc","cloudgallery.net","cmumavericks.com","coin-profits.xyz","collegehdsex.com","colliersnews.com","coloredmanga.com","comeletspray.com","cometogliere.com","comicspornos.com","comicspornow.com","comicsvalley.com","computerpedia.in","convert2mp3.club","convertinmp4.com","courseleader.net","cr7-soccer.store","cracksports.me>>","criptologico.com","cryptoclicks.net","cryptofactss.com","cryptofaucet.xyz","cryptokinews.com","cryptomonitor.in","cybercityhelp.in","cyberstumble.com","cydiasources.net","dailyboulder.com","dailypudding.com","dailytips247.com","dailyuploads.net","darknessporn.com","darkwanderer.net","dasgelbeblatt.de","dataunlocker.com","dattebayo-br.com","davewigstone.com","dayoftheweek.org","daytonflyers.com","ddl-francais.com","deepfakeporn.net","deepswapnude.com","demonicscans.org","designparty.sx>>","detroitlions.com","diariodeibiza.es","dirtytubemix.com","discoveryplus.in","djremixganna.com","doanhnghiepvn.vn","dobrapogoda24.pl","dobreprogramy.pl","donghuaworld.com","dorsetecho.co.uk","downloadapk.info","downloadbatch.me","downloadsite.org","downloadsoft.net","dpscomputing.com","dryscalpgone.com","dualshockers.com","duplichecker.com","dvdgayonline.com","earncrypto.co.in","eartheclipse.com","eastbaytimes.com","easyexploits.com","easymilftube.net","ebook-hunter.org","ecom.wixapps.net","edufileshare.com","einfachschoen.me","eleceedmanhwa.me","eletronicabr.com","elevationmap.net","eliobenedetto.it","embedseek.online","embedstreams.top","empire-anime.com","emulatorsite.com","english101.co.za","erotichunter.com","eslauthority.com","esportstales.com","everysextube.com","ewrc-results.com","exclusivomen.com","fallbrook247.com","familyminded.com","familyporner.com","famousnipple.com","fastdownload.top","fattelodasolo.it","fatwhitebutt.com","faucetcrypto.com","faucetcrypto.net","favefreeporn.com","favoyeurtube.net","fernsehserien.de","fessesdenfer.com","fetishshrine.com","filespayouts.com","filmestorrent.tv","filmyhitlink.xyz","filmyhitt.com.in","financacerta.com","fineasiansex.com","finofilipino.org","fitnessholic.net","fitnessscenz.com","flatpanelshd.com","footwearnews.com","footymercato.com","footystreams.net","foreverquote.xyz","forexcracked.com","forextrader.site","forgepattern.net","forum-xiaomi.com","foxsports.com.au","freegetcoins.com","freehardcore.com","freehdvideos.xxx","freelitecoin.vip","freemcserver.net","freemomstube.com","freemoviesu4.com","freeporncave.com","freevstplugins.*","freshersgold.com","fullxcinema1.com","fullxxxmovies.me","fumettologica.it","fussballdaten.de","gadgetxplore.com","game-repack.site","gamemodsbase.com","gamers-haven.org","games.boston.com","games.kansas.com","games.modbee.com","games.puzzles.ca","games.sacbee.com","games.sltrib.com","games.usnews.com","gamesrepacks.com","gamingbeasts.com","gamingdeputy.com","gaminglariat.com","ganstamovies.com","gartenlexikon.de","gaydelicious.com","gazetalubuska.pl","gbmwolverine.com","gdrivelatino.net","gdrivemovies.xyz","gemiadamlari.org","genialetricks.de","gentlewasher.com","getdatgadget.com","getdogecoins.com","getfreecourses.*","getworkation.com","gezegenforum.com","ghettopearls.com","ghostsfreaks.com","gidplayer.online","gigemgazette.com","girlschannel.net","globelempire.com","go.discovery.com","go.shortnest.com","goblackbears.com","godstoryinfo.com","goetbutigers.com","gogetadoslinks.*","gomcpanthers.com","gometrostate.com","goodyoungsex.com","gophersports.com","gopornindian.com","gourmetscans.net","greasygaming.com","greenarrowtv.com","gruene-zitate.de","gruporafa.com.br","gsm-solution.com","gtamaxprofit.com","guncelkaynak.com","gutesexfilme.com","hadakanonude.com","handelsblatt.com","happyinshape.com","hard-tubesex.com","hardfacefuck.com","hausbau-forum.de","hayatarehber.com","hd-tube-porn.com","healthylifez.com","hechosfizzle.com","heilpraxisnet.de","helpdeskgeek.com","hentaicomics.pro","hentaiseason.com","hentaistream.com","hentaivideos.net","hotcopper.com.au","hotdreamsxxx.com","hotpornyoung.com","hotpussyhubs.com","houstonpress.com","hqpornstream.com","huskercorner.com","id.condenast.com","idmextension.xyz","ielts-isa.edu.vn","ignoustudhelp.in","ikindlebooks.com","imagereviser.com","imageshimage.com","imagetotext.info","imperiofilmes.co","indexsubtitle.cc","infinityfree.com","infomatricula.pt","inprogrammer.com","intellischool.id","interviewgig.com","investopedia.com","investorveda.com","isekaibrasil.com","isekaipalace.com","jalshamoviezhd.*","japaneseasmr.com","japanesefuck.com","japanfuck.com.es","javenspanish.com","javfullmovie.com","justblogbaby.com","justswallows.net","kakarotfoot.ru>>","katiescucina.com","kayifamilytv.com","khatrimazafull.*","kingdomfiles.com","kingstreamz.site","kireicosplay.com","kitchennovel.com","kitraskimisi.com","knowyourmeme.com","kodibeginner.com","kokosovoulje.com","komikstation.com","komputerswiat.pl","kshowsubindo.org","kstatesports.com","ksuathletics.com","kurakura21.space","kuttymovies1.com","lakeshowlife.com","lampungkerja.com","larvelfaucet.com","lascelebrite.com","latesthdmovies.*","latinohentai.com","lavanguardia.com","lawyercontact.us","lectormangaa.com","leechpremium.net","legionjuegos.org","lehighsports.com","lesbiantube.club","letmewatchthis.*","lettersolver.com","levelupalone.com","lg-firmwares.com","libramemoria.com","lifesurance.info","lightxxxtube.com","limetorrents.lol","linux-magazin.de","linuxexplain.com","live.vodafone.de","livenewsflix.com","logofootball.net","lookmovie.studio","loudountimes.com","ltpcalculator.in","luminatedata.com","lumpiastudio.com","lustaufsleben.at","lustesthd.makeup","macrocreator.com","magicseaweed.com","mahobeachcam.com","mammaebambini.it","manga-scantrad.*","mangacanblog.com","mangaforfree.com","mangaindo.web.id","markstyleall.com","masstamilans.com","mastaklomods.com","masterplayer.xyz","matshortener.xyz","mature-tube.sexy","maxisciences.com","meconomynews.com","mee-6zeqsgv2.com","mee-cccdoz45.com","mee-dp6h8dp2.com","mee-s9o6p31p.com","meetdownload.com","megafilmeshd20.*","megajapansex.com","mejortorrents1.*","merlinshoujo.com","meteoetradar.com","milanreports.com","milfxxxpussy.com","milkporntube.com","mlookalporno.com","mockupgratis.com","mockupplanet.com","moto-station.com","mountaineast.org","movielinkhub.xyz","movierulz2free.*","movierulzwatch.*","movieshdwatch.to","movieshubweb.com","moviesnipipay.me","moviesrulzfree.*","moviestowatch.tv","mrproblogger.com","msmorristown.com","msumavericks.com","multimovies.tech","musiker-board.de","my-ford-focus.de","myair.resmed.com","mycivillinks.com","mydownloadtube.*","myfitnesspal.com","mylegalporno.com","mylivestream.pro","mymotherlode.com","myproplugins.com","myradioonline.pl","nakedbbw-sex.com","naruldonghua.com","nationalpost.com","nativesurge.info","nauathletics.com","naughtyblogs.xyz","neatfreeporn.com","neatpornodot.com","netflixporno.net","netizensbuzz.com","newanimeporn.com","newsinlevels.com","newsobserver.com","newstvonline.com","nghetruyenma.net","nguyenvanbao.com","nhentaihaven.org","niftyfutures.org","nintendolife.com","nl.hardware.info","nocsummer.com.br","nonesnanking.com","notebookchat.com","notiziemusica.it","novablogitalia.*","nude-teen-18.com","nudemomshots.com","null-scripts.net","officecoach24.de","ohionowcast.info","olalivehdplay.ru","older-mature.net","oldgirlsporn.com","onestringlab.com","onlineporn24.com","onlyfanvideo.com","onlygangbang.com","onlygayvideo.com","onlyindianporn.*","open.spotify.com","openloadmovies.*","optimizepics.com","oranhightech.com","orenoraresne.com","oswegolakers.com","otakuanimess.net","oxfordmail.co.uk","pagalworld.video","pandaatlanta.com","pandafreegames.*","parentcircle.com","parking-map.info","pawastreams.info","pdfstandards.net","pedroinnecco.com","penis-bilder.com","personefamose.it","phinphanatic.com","physics101.co.za","pigeonburger.xyz","pinsexygirls.com","play.gamezop.com","play.history.com","player.gayfor.us","player.hdgay.net","player.pop.co.uk","player4me.online","playsexgames.xxx","pleasuregirl.net","plumperstube.com","plumpxxxtube.com","pokeca-chart.com","police.community","ponselharian.com","porn-hd-tube.com","pornclassic.tube","pornclipshub.com","pornforrelax.com","porngayclips.com","pornhub-teen.com","pornobengala.com","pornoborshch.com","pornoteensex.com","pornsex-pics.com","pornstargold.com","pornuploaded.net","pornvideotop.com","pornwatchers.com","pornxxxplace.com","pornxxxxtube.net","portnywebcam.com","post-gazette.com","postermockup.com","powerover.site>>","practicequiz.com","prajwaldesai.com","praveeneditz.com","privatenudes.com","programme-tv.net","programsolve.com","prosiebenmaxx.de","purduesports.com","purposegames.com","puzzles.nola.com","pythonjobshq.com","qrcodemonkey.net","rabbitstream.net","radio-deejay.com","realityblurb.com","realjapansex.com","receptyonline.cz","recordonline.com","redbirdrants.com","rendimentibtp.it","repack-games.com","reportbangla.com","reviewmedium.com","ribbelmonster.de","rimworldbase.com","ringsidenews.com","ripplestream4u.*","riwayat-word.com","rocketrevise.com","rollingstone.com","royale-games.com","rule34hentai.net","rv-ecommerce.com","sabishiidesu.com","safehomefarm.com","sainsburys.co.uk","saradahentai.com","sarugbymag.co.za","satoshifaucet.io","savethevideo.com","savingadvice.com","schaken-mods.com","schildempire.com","schoolcheats.net","search.brave.com","seattletimes.com","secretsdujeu.com","semuanyabola.com","sensualgirls.org","serienjunkies.de","serieslandia.com","sesso-escort.com","sexanimetube.com","sexfilmkiste.com","sexflashgame.org","sexhardtubes.com","sexjapantube.com","sexlargetube.com","sexmomvideos.com","sexontheboat.xyz","sexpornasian.com","sextingforum.net","sexybabesart.com","sexyoungtube.com","sharelink-1.site","sheepesports.com","shelovesporn.com","shemalemovies.us","shemalepower.xyz","shemalestube.com","shimauma-log.com","shoot-yalla.live","short.croclix.me","shortenlinks.top","shortylink.store","showbizbites.com","shrinkforearn.in","shrinklinker.com","signupgenius.com","sikkenscolore.it","simpleflying.com","simplyvoyage.com","sitesunblocked.*","skidrowcodex.net","skidrowcrack.com","skintagsgone.com","smallseotools.ai","smart-wohnen.net","smartermuver.com","smashyplayer.top","soccershoes.blog","softdevelopp.com","softwaresite.net","solution-hub.com","soonersports.com","soundpark-club.*","southpark.cc.com","soyoungteens.com","space-faucet.com","spigotunlocked.*","splinternews.com","sportpiacenza.it","sportshub.stream","sportsloverz.xyz","sportstream.live","spotifylists.com","sshconect.com.br","sssinstagram.com","stablerarena.com","stagatvfiles.com","stiflersmoms.com","stileproject.com","stillcurtain.com","stockhideout.com","stopstreamtv.net","storieswatch.com","stream.nflbox.me","stream4free.live","streamblasters.*","streamcenter.xyz","streamextreme.cc","streamingnow.mov","streamingworld.*","streamloverx.com","strefabiznesu.pl","strtapeadblock.*","suamusica.com.br","sukidesuost.info","sunshine-live.de","supremebabes.com","swiftuploads.com","sxmislandcam.com","synoniemboek.com","tamarindoyam.com","tapelovesads.org","taroot-rangi.com","teachmemicro.com","techgeek.digital","techkhulasha.com","technewslive.org","tecnotutoshd.net","teensexvideos.me","telcoinfo.online","telegratuita.com","tempatwisata.pro","text-compare.com","the1security.com","thebakermama.com","thecozyapron.com","thecustomrom.com","thefappening.pro","thegadgetking.in","thehiddenbay.com","theinventory.com","thejobsmovie.com","thelandryhat.com","thelosmovies.com","thelovenerds.com","thematurexxx.com","thenerdstash.com","thenewcamera.com","thenewsdrill.com","thenewsglobe.net","thenextplanet1.*","theorie-musik.de","thepiratebay.org","thepoorcoder.com","thescranline.com","thesportster.com","thesportsupa.com","thestonesoup.com","thesundevils.com","thetrendverse.in","thevikingage.com","thisisfutbol.com","timesnownews.com","timesofindia.com","tires.costco.com","tiroalpaloes.com","tiroalpaloes.net","titansonline.com","tnstudycorner.in","todays-obits.com","todoandroid.live","tonanmedia.my.id","topvideosgay.com","toramemoblog.com","torrentkitty.one","totallyfuzzy.net","totalsportek.app","toureiffel.paris","towsontigers.com","tptvencore.co.uk","tradersunion.com","travelerdoor.com","trendytalker.com","troyyourlead.com","trucosonline.com","truetrophies.com","truevpnlover.com","tube-teen-18.com","tube.shegods.com","tuotromedico.com","turbogvideos.com","turboplayers.xyz","turtleviplay.xyz","tutorialsaya.com","tweakcentral.net","twobluescans.com","typinggames.zone","uconnhuskies.com","unionpayintl.com","universegunz.net","unrealengine.com","upfiles-urls.com","upgradedhome.com","upstyledaily.com","urlgalleries.net","ustrendynews.com","uvmathletics.com","uwlathletics.com","vancouversun.com","vandaaginside.nl","vegamoviese.blog","veryfreeporn.com","verywellmind.com","vichitrainfo.com","videocdnal24.xyz","videosection.com","vikingf1le.us.to","villettt.kitchen","vinstartheme.com","viralvideotube.*","viralxxxporn.com","vivrebordeaux.fr","vodkapr3mium.com","voiranime.stream","voyeurfrance.net","voyeurxxxsex.com","vpshostplans.com","vrporngalaxy.com","vzrosliedamy.com","watchanime.video","watchfreekav.com","watchfreexxx.net","watchmovierulz.*","watchmovies2.com","wbschemenews.com","wearehunger.site","web.facebook.com","webcamsdolls.com","webcheats.com.br","webdesigndev.com","webdeyazilim.com","weblivehdplay.ru","webseriessex.com","websitesball.com","werkzeug-news.de","whentostream.com","whipperberry.com","whitexxxtube.com","wiadomosci.wp.pl","wildpictures.net","willow.arlen.icu","windowsonarm.org","wolfgame-ar.site","womenreality.com","wonderfuldiy.com","woodmagazine.com","workxvacation.jp","worldhistory.org","wrestlinginc.com","wrzesnia.info.pl","wunderground.com","wvuathletics.com","www.amazon.co.jp","www.amazon.co.uk","www.facebook.com","xhamster-art.com","xhamsterporno.mx","xhamsterteen.com","xxxanimefuck.com","xxxlargeporn.com","xxxlesvianas.com","xxxretrofuck.com","xxxteenyporn.com","xxxvideos247.com","yellowbridge.com","yesjavplease.fun","yona-yethu.co.za","youngerporn.mobi","youtubetoany.com","youtubetowav.net","youwatch.monster","youwatchporn.com","ysokuhou.blog.jp","zdravenportal.eu","zecchino-doro.it","ziggogratis.site","ziminvestors.com","ziontutorial.com","zippyshare.cloud","zwergenstadt.com","123moviesonline.*","123strippoker.com","12thmanrising.com","1337x.unblocked.*","1337x.unblockit.*","19-days-manga.com","1movierulzhd.hair","1teentubeporn.com","2japaneseporn.com","acapellas4u.co.uk","acdriftingpro.com","adblockplustape.*","adffdafdsafds.sbs","alaskananooks.com","allcelebspics.com","alternativeto.net","altyazitube22.lat","amateur-twink.com","amateurfapper.com","amsmotoresllc.com","ancient-origins.*","andhrafriends.com","androidonepro.com","androidpolice.com","animalwebcams.net","anime-torrent.com","animecenterbr.com","animeidhentai.com","animelatinohd.com","animeonline.ninja","animepornfilm.com","animesonlinecc.us","animexxxfilms.com","anonymousemail.me","apostoliclive.com","arabshentai.com>>","arcade.lemonde.fr","armypowerinfo.com","asianfucktube.com","asiansexcilps.com","assignmentdon.com","atalantini.online","autoexpress.co.uk","babyjimaditya.com","badassoftcore.com","badgerofhonor.com","bafoeg-aktuell.de","bandyforbundet.no","bargainbriana.com","bcanotesnepal.com","beargoggleson.com","bebasbokep.online","beritasulteng.com","bestanime-xxx.com","besthdgayporn.com","besthugecocks.com","bestloanoffer.net","bestpussypics.net","beyondtheflag.com","bgmiupdate.com.in","bigdickwishes.com","bigtitsxxxsex.com","black-matures.com","blackhatworld.com","bladesalvador.com","blizzboygames.net","blog.linksfire.co","blog.textpage.xyz","blogcreativos.com","blogtruyenmoi.com","bollywoodchamp.in","bostoncommons.net","bracontece.com.br","bradleybraves.com","brazzersbabes.com","brindisireport.it","brokensilenze.net","brookethoughi.com","browncrossing.net","brushednickel.biz","calgaryherald.com","camchickscaps.com","cameronaggies.com","candyteenporn.com","carensureplan.com","catatanonline.com","cavalierstream.fr","cdn.gledaitv.live","celebritablog.com","charbelnemnom.com","chat.tchatche.com","cheat.hax4you.net","checkfiletype.com","chicksonright.com","cindyeyefinal.com","cinecalidad5.site","cinema-sketch.com","citethisforme.com","citpekalongan.com","ciudadblogger.com","claplivehdplay.ru","classicreload.com","clickjogos.com.br","cloudhostingz.com","coatingsworld.com","codingshiksha.com","coempregos.com.br","compota-soft.work","computercrack.com","computerfrage.net","computerhilfen.de","comunidadgzone.es","conferenceusa.com","consoletarget.com","cookiewebplay.xyz","cool-style.com.tw","coolmathgames.com","crichd-player.top","cruisingearth.com","cryptednews.space","cryptoblog24.info","cryptowidgets.net","crystalcomics.com","curiosidadtop.com","daemon-hentai.com","dailybulletin.com","dailydemocrat.com","dailyfreebits.com","dailygeekshow.com","dailytech-news.eu","dallascowboys.com","damndelicious.net","darts-scoring.com","dawnofthedawg.com","dealsfinders.blog","dearcreatives.com","deine-tierwelt.de","deinesexfilme.com","dejongeturken.com","denverbroncos.com","descarga-animex.*","design4months.com","designtagebuch.de","desitelugusex.com","developer.arm.com","diamondfansub.com","diaridegirona.cat","diariocordoba.com","diencobacninh.com","dirtyindianporn.*","dl.apkmoddone.com","doctor-groups.com","dorohedoro.online","downloadapps.info","downloadtanku.org","downloadudemy.com","downloadwella.com","dynastyseries.com","dzienniklodzki.pl","e-hausaufgaben.de","earninginwork.com","easyjapanesee.com","easyvidplayer.com","easywithcode.tech","ebonyassclips.com","eczpastpapers.net","editions-actu.org","einfachtitten.com","elamigosgamez.com","elamigosgamez.net","empire-streamz.fr","emulatorgames.net","encurtandourl.com","encurtareidog.top","engel-horoskop.de","enormousbabes.net","entertubeporn.com","epsilonakdemy.com","eromanga-show.com","estrepublicain.fr","eternalmangas.org","etownbluejays.com","euro2024direct.ru","eurotruck2.com.br","extreme-board.com","extremotvplay.com","faceittracker.net","fansonlinehub.com","fantasticporn.net","fastconverter.net","fatgirlskinny.net","fattubevideos.net","femalefirst.co.uk","fgcuathletics.com","fightinghawks.com","file.magiclen.org","financialpost.com","finanzas-vida.com","fineretroporn.com","finexxxvideos.com","finish.addurl.biz","fitnakedgirls.com","fitnessplanss.com","fitnesssguide.com","flight-report.com","floridagators.com","foguinhogames.net","footballstream.tv","footfetishvid.com","footstockings.com","fordownloader.com","formatlibrary.com","forum.blu-ray.com","fplstatistics.com","freeboytwinks.com","freecodezilla.net","freecourseweb.com","freemagazines.top","freeoseocheck.com","freepdf-books.com","freepornrocks.com","freepornstream.cc","freepornvideo.sex","freepornxxxhd.com","freerealvideo.com","freethesaurus.com","freex2line.online","freexxxvideos.pro","french-streams.cc","freshstuff4u.info","friendproject.net","frkn64modding.com","frosinonetoday.it","fuerzasarmadas.eu","fuldaerzeitung.de","fullfreeimage.com","fullxxxmovies.net","futbolsayfasi.net","games-manuals.com","games.puzzler.com","games.thestar.com","gamesofdesire.com","gaminggorilla.com","gay-streaming.com","gaypornhdfree.com","gebrauchtwagen.at","getwallpapers.com","gewinde-normen.de","girlsofdesire.org","girlswallowed.com","globalstreams.xyz","gobigtitsporn.com","goblueraiders.com","godriveplayer.com","gogetapast.com.br","gogueducation.com","goltelevision.com","gothunderbirds.ca","grannyfuckxxx.com","grannyxxxtube.net","graphicgoogle.com","grsprotection.com","gwiazdatalkie.com","hakunamatata5.org","hallo-muenchen.de","happy-otalife.com","hardcoregamer.com","hardwaretimes.com","hbculifestyle.com","hdfilmizlesen.com","hdvintagetube.com","headlinerpost.com","healbot.dpm15.net","healthcheckup.com","hegreartnudes.com","help.cashctrl.com","hentaibrasil.info","hentaienglish.com","hentaitube.online","hideandseek.world","hikarinoakari.com","hollywoodlife.com","hostingunlock.com","hotkitchenbag.com","hotmaturetube.com","hotspringsofbc.ca","houseandgarden.co","houstontexans.com","howtoconcepts.com","hunterscomics.com","iedprivatedqu.com","imgdawgknuttz.com","imperialstudy.com","independent.co.uk","indianporn365.net","indofirmware.site","indojavstream.com","infinityscans.net","infinityscans.org","infinityscans.xyz","inside-digital.de","insidermonkey.com","instantcloud.site","insurancepost.xyz","ironwinter6m.shop","isabihowto.com.ng","isekaisubs.web.id","isminiunuttum.com","jamiesamewalk.com","janammusic.in.net","japaneseholes.com","japanpornclip.com","japanxxxmovie.com","japanxxxworld.com","jardiner-malin.fr","jokersportshd.org","juegos.elpais.com","k-statesports.com","k-statesports.net","k-statesports.org","kandisvarlden.com","kenshi.fandom.com","kh-pokemon-mc.com","khabardinbhar.net","kickasstorrents.*","kill-the-hero.com","kimcilonlyofc.com","kiuruvesilehti.fi","know-how-tree.com","kontenterabox.com","kontrolkalemi.com","koreanbeauty.club","korogashi-san.org","kreis-anzeiger.de","kurierlubelski.pl","lachainemeteo.com","lacuevadeguns.com","laksa19.github.io","lavozdegalicia.es","lebois-racing.com","lecturisiarome.ro","leechpremium.link","leechyscripts.net","lespartisanes.com","lewblivehdplay.ru","lheritierblog.com","libertestreamvf.*","limontorrents.com","line-stickers.com","link.turkdown.com","linuxsecurity.com","lisatrialidea.com","locatedinfain.com","lonely-mature.com","lovegrowswild.com","lucagrassetti.com","luciferdonghua.in","luckypatchers.com","lycoathletics.com","madhentaitube.com","malaysiastock.biz","maps4study.com.br","marthastewart.com","mature-chicks.com","maturepussies.pro","mdzsmutpcvykb.net","media.cms.nova.cz","megajapantube.com","metaforespress.gr","mfmfinancials.com","miamidolphins.com","miaminewtimes.com","milfpussy-sex.com","minecraftwild.com","mizugigurabia.com","mlbpark.donga.com","mlbstreaming.live","mmorpgplay.com.br","mobilanyheter.net","modelsxxxtube.com","modescanlator.net","mommyporntube.com","momstube-porn.com","moon-fm43w1qv.com","moon-kg83docx.com","moonblinkwifi.com","motorradfrage.net","motorradonline.de","moviediskhd.cloud","movielinkbd4u.com","moviezaddiction.*","mp3cristianos.net","mundovideoshd.com","murtonroofing.com","music.youtube.com","musicforchoir.com","muyinteresante.es","myabandonware.com","myair2.resmed.com","myfunkytravel.com","mynakedwife.video","mzansixporn.co.za","nasdaqfutures.org","national-park.com","negative.tboys.ro","nepalieducate.com","networklovers.com","new-xxxvideos.com","nextchessmove.com","ngin-mobility.com","nieuwsvandedag.nl","nightlifeporn.com","nikkan-gendai.com","nikkeifutures.org","njwildlifecam.com","nobodycancool.com","nonsensediamond.*","novelasligera.com","nzpocketguide.com","oceanof-games.com","oceanoffgames.com","odekake-spots.com","officedepot.co.cr","officialpanda.com","olemisssports.com","ondemandkorea.com","onepiecepower.com","onlinemschool.com","onlinesextube.com","onlineteenhub.com","ontariofarmer.com","openspeedtest.com","opensubtitles.com","oportaln10.com.br","osmanonline.co.uk","osthessen-news.de","ottawacitizen.com","ottrelease247.com","outdoorchannel.de","overwatchporn.xxx","pahaplayers.click","palmbeachpost.com","pandaznetwork.com","panel.skynode.pro","pantyhosepink.com","paramountplus.com","paraveronline.org","pghk.blogspot.com","phimlongtieng.net","phoenix-manga.com","phonefirmware.com","piazzagallura.org","pistonpowered.com","plantatreenow.com","play.aidungeon.io","playembedapi.site","player.glomex.com","playerflixapi.com","playerjavseen.com","playmyopinion.com","playporngames.com","pleated-jeans.com","pockettactics.com","popcornmovies.org","porn-sexypics.com","pornanimetube.com","porngirlstube.com","pornoenspanish.es","pornoschlange.com","pornxxxvideos.net","practicalkida.com","prague-blog.co.il","premiumporn.org>>","prensaesports.com","prescottenews.com","press-citizen.com","presstelegram.com","primeanimesex.com","primeflix.website","progameguides.com","project-free-tv.*","projectfreetv.one","promisingapps.com","promo-visits.site","protege-liens.com","pubgaimassist.com","publicananker.com","publicdomainq.net","publicdomainr.net","publicflashing.me","punisoku.blogo.jp","pussytorrents.org","qatarstreams.me>>","queenofmature.com","radiolovelive.com","radiosymphony.com","ragnarokmanga.com","randomarchive.com","rateyourmusic.com","rawindianporn.com","readallcomics.com","readcomiconline.*","readfireforce.com","realvoyeursex.com","reporterpb.com.br","reprezentacija.rs","retrosexfilms.com","reviewjournal.com","richieashbeck.com","robloxscripts.com","rojadirectatvhd.*","roms-download.com","roznamasiasat.com","rule34.paheal.net","sahlmarketing.net","samfordsports.com","sanangelolive.com","sanmiguellive.com","sarkarinaukry.com","savemoneyinfo.com","sayphotobooth.com","scandichotels.com","schoolsweek.co.uk","scontianastro.com","searchnsucceed.in","seasons-dlove.net","send-anywhere.com","series9movies.com","sevenjournals.com","sexmadeathome.com","sexyebonyteen.com","sexyfreepussy.com","shahiid-anime.net","share.filesh.site","shentai-anime.com","shinshi-manga.net","shittokuadult.net","shortencash.click","shrink-service.it","sidearmsocial.com","sideplusleaks.com","sim-kichi.monster","simply-hentai.com","simplyrecipes.com","simplywhisked.com","simulatormods.com","skidrow-games.com","skillheadlines.in","skodacommunity.de","slaughtergays.com","smallseotools.com","soccerworldcup.me","softwaresblue.com","south-park-tv.biz","spectrum.ieee.org","speculationis.com","spedostream2.shop","spiritparting.com","sponsorhunter.com","sportanalytic.com","sportingsurge.com","sportlerfrage.net","sportsbuff.stream","sportsgames.today","sportzonline.site","stapadblockuser.*","stellarthread.com","stepsisterfuck.me","storefront.com.ng","stories.los40.com","straatosphere.com","streamadblocker.*","streamcaster.live","streaming-one.com","streamingunity.to","streamlivetv.site","streamonsport99.*","streamseeds24.com","streamshunters.eu","stringreveals.com","suanoticia.online","super-ethanol.com","susanhavekeep.com","tabele-kalorii.pl","tamaratattles.com","tamilbrahmins.com","tamilsexstory.net","tattoosbeauty.com","tautasdziesmas.lv","techadvisor.co.uk","techautomobile.in","techconnection.in","techiepirates.com","techlog.ta-yan.ai","technewsrooms.com","technewsworld.com","techsolveprac.com","teenpornvideo.sex","teenpornvideo.xxx","testlanguages.com","texture-packs.com","thaihotmodels.com","thangdangblog.com","theandroidpro.com","thebazaarzone.com","thecelticblog.com","thecubexguide.com","thedailybeast.com","thedigitalfix.com","thefreebieguy.com","thegamearcade.com","thehealthsite.com","theismailiusa.org","thekingavatar.com","theliveupdate.com","theouterhaven.net","theregister.co.uk","thermoprzepisy.pl","thesprucepets.com","thewoksoflife.com","theworldobits.com","thousandbabes.com","tichyseinblick.de","tiktokcounter.net","timesnowhindi.com","tiroalpaloweb.xyz","titfuckvideos.com","tmail.sys64738.at","tomatespodres.com","toplickevesti.com","topsworldnews.com","torrent-pirat.com","torrentdownload.*","tradingfact4u.com","trannylibrary.com","trannyxxxtube.net","truyen-hentai.com","truyenaudiocv.net","tubepornasian.com","tubepornstock.com","ultimate-catch.eu","ultrateenporn.com","umatechnology.org","undeadwalking.com","unsere-helden.com","uptechnologys.com","urjalansanomat.fi","url.gem-flash.com","utepathletics.com","vanillatweaks.net","venusarchives.com","vide-greniers.org","video.gazzetta.it","videogameszone.de","videos.remilf.com","vietnamanswer.com","viralitytoday.com","virtualnights.com","visualnewshub.com","vitalitygames.com","voiceofdenton.com","voyeurpornsex.com","voyeurspyporn.com","voyeurxxxfree.com","wannafreeporn.com","watchanimesub.net","watchfacebook.com","watchsouthpark.tv","websiteglowgh.com","weknowconquer.com","welcometojapan.jp","wellness4live.com","wellnessbykay.com","wirralglobe.co.uk","wirtualnemedia.pl","wohnmobilforum.de","workweeklunch.com","worldfreeware.com","worldgreynews.com","worthitorwoke.com","wpsimplehacks.com","wutheringwaves.gg","xfreepornsite.com","xhamsterdeutsch.*","xnxx-sexfilme.com","xxxonlinefree.com","xxxpussyclips.com","xxxvideostrue.com","yesdownloader.com","yongfucknaked.com","yourcupofcake.com","yummysextubes.com","zeenews.india.com","zeijakunahiko.com","zeroto60times.com","zippysharecue.com","1001tracklists.com","101soundboards.com","10minuteemails.com","123moviesready.org","123moviestoday.net","1337x.unblock2.xyz","247footballnow.com","7daystodiemods.com","adblockeronstape.*","addictinggames.com","adultasianporn.com","advertisertape.com","afasiaarchzine.com","airportwebcams.net","akuebresources.com","allureamateurs.net","alternativa104.net","amateur-mature.net","anarchy-stream.com","angrybirdsnest.com","animesonliner4.com","anothergraphic.org","antenasport.online","arcade.buzzrtv.com","arcadeprehacks.com","arkadiumhosted.com","arsiv.mackolik.com","asian-teen-sex.com","asianbabestube.com","asianpornfilms.com","asiansexdiarys.com","asianstubefuck.com","atlantafalcons.com","atlasstudiousa.com","autocadcommand.com","badasshardcore.com","baixedetudo.net.br","ballexclusives.com","barstoolsports.com","basic-tutorials.de","bdsmslavemovie.com","beamng.wesupply.cx","bearchasingart.com","beermoneyforum.com","beginningmanga.com","berliner-kurier.de","beruhmtemedien.com","best-xxxvideos.com","bestialitytaboo.tv","bettingexchange.it","bidouillesikea.com","bigdata-social.com","bigdata.rawlazy.si","bigpiecreative.com","bigsouthsports.com","bigtitsxxxfree.com","birdsandblooms.com","blisseyhusband.net","blogredmachine.com","blogx.almontsf.com","blowjobamateur.net","blowjobpornset.com","bluecoreinside.com","bluemediastorage.*","bombshellbling.com","bonsaiprolink.shop","bosoxinjection.com","businessinsider.de","calculatorsoup.com","camwhorescloud.com","captown.capcom.com","cararegistrasi.com","casos-aislados.com","cdimg.blog.2nt.com","cehennemstream.xyz","cerbahealthcare.it","chiangraitimes.com","chicagobearshq.com","chicagobullshq.com","chicasdesnudas.xxx","chikianimation.org","choiceappstore.xyz","cintateknologi.com","clampschoolholic.*","classicalradio.com","classicxmovies.com","clothing-mania.com","codingnepalweb.com","coleccionmovie.com","comicspornoxxx.com","comparepolicyy.com","comparteunclic.com","contractpharma.com","couponscorpion.com","cr7-soccer.store>>","creditcardrush.com","crimsonscrolls.net","cronachesalerno.it","cryptonworld.space","dallasobserver.com","datapendidikan.com","dcdirtylaundry.com","denverpioneers.com","depressionhurts.us","descargaspcpro.net","desifuckonline.com","deutschekanale.com","devicediary.online","dianaavoidthey.com","diariodenavarra.es","digicol.dpm.org.cn","dirtyasiantube.com","dirtygangbangs.com","discover-sharm.com","diyphotography.net","diyprojectslab.com","donaldlineelse.com","donghuanosekai.com","doublemindtech.com","downloadcursos.top","downloadgames.info","downloadmusic.info","downloadpirate.com","dragonball-zxk.com","dulichkhanhhoa.net","e-mountainbike.com","elconfidencial.com","elearning-cpge.com","embed-player.space","empire-streaming.*","english-dubbed.com","english-topics.com","erikcoldperson.com","evdeingilizcem.com","eveningtimes.co.uk","exactlyhowlong.com","expressbydgoski.pl","extremosports.club","familyhandyman.com","fightingillini.com","financenova.online","financialjuice.com","flacdownloader.com","flashgirlgames.com","flashingjungle.com","foodiesgallery.com","foreversparkly.com","formasyonhaber.net","forum.cstalking.tv","francaisfacile.net","free-gay-clips.com","freeadultcomix.com","freeadultvideos.cc","freebiesmockup.com","freecoursesite.com","freefireupdate.com","freegogpcgames.com","freegrannyvids.com","freemockupzone.com","freemoviesfull.com","freepornasians.com","freepublicporn.com","freereceivesms.com","freeviewmovies.com","freevipservers.net","freevstplugins.net","freewoodworking.ca","freex2line.onlinex","freshwaterdell.com","friscofighters.com","fritidsmarkedet.dk","fuckhairygirls.com","fuckingsession.com","fullvideosporn.com","galinhasamurai.com","gamerevolution.com","games.arkadium.com","games.kentucky.com","games.mashable.com","games.thestate.com","gamingforecast.com","gaypornmasters.com","gazetakrakowska.pl","gazetazachodnia.eu","gdrivelatinohd.net","geniale-tricks.com","geniussolutions.co","girlsgogames.co.uk","go.bucketforms.com","goafricaonline.com","gobankingrates.com","gocurrycracker.com","godrakebulldog.com","gojapaneseporn.com","golf.rapidmice.com","gorro-4go5b3nj.fun","gorro-9mqnb7j2.fun","gorro-chfzoaas.fun","gorro-ry0ziftc.fun","grouppornotube.com","gruenderlexikon.de","gudangfirmwere.com","hamptonpirates.com","hard-tube-porn.com","healthfirstweb.com","healthnewsreel.com","healthy4pepole.com","heatherdisarro.com","hentaipornpics.net","hentaisexfilms.com","heraldscotland.com","hiddencamstube.com","highkeyfinance.com","hindustantimes.com","homeairquality.org","homemoviestube.com","hotanimevideos.com","hotbabeswanted.com","hotxxxjapanese.com","hqamateurtubes.com","huffingtonpost.com","huitranslation.com","humanbenchmark.com","hyundaitucson.info","idedroidsafelink.*","idevicecentral.com","ifreemagazines.com","ikingfile.mooo.com","ilcamminodiluce.it","imagetranslator.io","indecentvideos.com","indesignskills.com","indianbestporn.com","indianpornvideos.*","indiansexbazar.com","indiasmagazine.com","infamous-scans.com","infinitehentai.com","infinityblogger.in","infojabarloker.com","informatudo.com.br","informaxonline.com","insidemarketing.it","insidememorial.com","insider-gaming.com","insurancesfact.com","intercelestial.com","investor-verlag.de","iowaconference.com","islamicpdfbook.com","italianporn.com.es","ithinkilikeyou.net","iusedtobeaboss.com","jacksonguitars.com","jamessoundcost.com","japanesemomsex.com","japanesetube.video","jasminetesttry.com","jemontremabite.com","jeux.meteocity.com","johnalwayssame.com","jojolandsmanga.com","joomlabeginner.com","jujustu-kaisen.com","justfamilyporn.com","justpicsplease.com","justtoysnoboys.com","kawaguchimaeda.com","kdramasmaza.com.pk","kellywhatcould.com","keralatelecom.info","kickasstorrents2.*","kittyfuckstube.com","knowyourphrase.com","kobitacocktail.com","komisanwamanga.com","kr-weathernews.com","krebs-horoskop.com","kstatefootball.net","kstatefootball.org","laopinioncoruna.es","leagueofgraphs.com","leckerschmecker.me","leo-horoscopes.com","letribunaldunet.fr","leviathanmanga.com","levismodding.co.uk","lib.hatenablog.com","link.get2short.com","link.paid4link.com","linkedmoviehub.top","linux-community.de","listenonrepeat.com","literarysomnia.com","littlebigsnake.com","liveandletsfly.com","localemagazine.com","longbeachstate.com","lotus-tours.com.hk","loyolaramblers.com","lukecomparetwo.com","luzernerzeitung.ch","m.timesofindia.com","maggotdrowning.com","magicgameworld.com","makeincomeinfo.com","maketecheasier.com","makotoichikawa.net","mallorcazeitung.es","manager-magazin.de","manchesterworld.uk","mangas-origines.fr","manoramaonline.com","maraudersports.com","mathplayground.com","maturetubehere.com","maturexxxclips.com","mctechsolutions.in","mediascelebres.com","megafilmeshd50.com","megahentaitube.com","megapornfreehd.com","mein-wahres-ich.de","memorialnotice.com","merlininkazani.com","mespornogratis.com","mesquitaonline.com","minddesignclub.org","minhasdelicias.com","mobilelegends.shop","mobiletvshows.site","modele-facture.com","moflix-stream.fans","montereyherald.com","motorcyclenews.com","moviescounnter.com","moviesonlinefree.*","mygardening411.com","myhentaicomics.com","mymusicreviews.com","myneobuxportal.com","mypornstarbook.net","nadidetarifler.com","naijachoice.com.ng","nakedgirlsroom.com","nakedneighbour.com","nauci-engleski.com","nauci-njemacki.com","netaffiliation.com","neueroeffnung.info","nevadawolfpack.com","newjapanesexxx.com","news-geinou100.com","newyorkupstate.com","nicematureporn.com","niestatystyczny.pl","nightdreambabe.com","nontonvidoy.online","noodlemagazine.com","novacodeportal.xyz","nudebeachpussy.com","nudecelebforum.com","nuevos-mu.ucoz.com","nyharborwebcam.com","o2tvseries.website","oceanbreezenyc.org","officegamespot.com","ogrenciyegelir.com","omnicalculator.com","onepunch-manga.com","onetimethrough.com","onlinesudoku.games","onlinetutorium.com","onlinework4all.com","onlygoldmovies.com","onscreensvideo.com","openchat-review.me","pakistaniporn2.com","passportaction.com","pc-spiele-wiese.de","pcgamedownload.net","pcgameshardware.de","peachprintable.com","peliculas-dvdrip.*","penisbuyutucum.net","pennbookcenter.com","pestleanalysis.com","pinayviralsexx.com","plainasianporn.com","play.starsites.fun","play.watch20.space","player.euroxxx.net","player.vidplus.pro","playeriframe.lol>>","playretrogames.com","pliroforiki-edu.gr","policesecurity.com","policiesreview.com","polskawliczbach.pl","pornhubdeutsch.net","pornmaturetube.com","pornohubonline.com","pornovideos-hd.com","pornvideospass.com","powerthesaurus.org","premiumstream.live","present.rssing.com","printablecrush.com","problogbooster.com","productkeysite.com","projectfreetv2.com","projuktirkotha.com","proverbmeaning.com","psicotestuned.info","pussytubeebony.com","racedepartment.com","radio-en-direct.fr","radioitalylive.com","radionorthpole.com","ratemyteachers.com","realfreelancer.com","realtormontreal.ca","recherche-ebook.fr","redamateurtube.com","redbubbletools.com","redstormsports.com","replica-watch.info","reporterherald.com","rightdark-scan.com","rincondelsazon.com","ripcityproject.com","risefromrubble.com","romaniataramea.com","ryanagoinvolve.com","sabornutritivo.com","samanarthishabd.in","samrudhiglobal.com","samurai.rzword.xyz","sandrataxeight.com","sankakucomplex.com","sattakingcharts.in","scarletandgame.com","scarletknights.com","schoener-wohnen.de","sciencechannel.com","scopateitaliane.it","seamanmemories.com","selfstudybrain.com","sethniceletter.com","sexiestpicture.com","sexteenxxxtube.com","sexy-youtubers.com","sexykittenporn.com","sexymilfsearch.com","shadowrangers.live","shemaletoonsex.com","shipseducation.com","shrivardhantech.in","shutupandgo.travel","sidelionreport.com","siirtolayhaber.com","simpledownload.net","siteunblocked.info","slowianietworza.pl","smithsonianmag.com","soccerstream100.to","sociallyindian.com","softwaredetail.com","sosyalbilgiler.net","southernliving.com","southparkstudios.*","spank-and-bang.com","sportstohfa.online","stapewithadblock.*","stream.nflbox.me>>","streamelements.com","streaming-french.*","strtapeadblocker.*","surgicaltechie.com","sweeteroticart.com","syracusecrunch.com","tamilultratv.co.in","tapeadsenjoyer.com","tcpermaculture.com","teachpreschool.org","technicalviral.com","telefullenvivo.com","telexplorer.com.ar","theblissempire.com","theendlessmeal.com","thefirearmblog.com","thehentaiworld.com","thelesbianporn.com","thepewterplank.com","thepiratebay10.org","theralphretort.com","thestarphoenix.com","thesuperdownload.*","thiagorossi.com.br","thisisourbliss.com","tiervermittlung.de","tiktokrealtime.com","times-standard.com","tiny-sparklies.com","tips-and-tricks.co","tokyo-ghoul.online","tonpornodujour.com","topbiography.co.in","torrentdosfilmes.*","torrentdownloads.*","totalsportekhd.com","traductionjeux.com","trannysexmpegs.com","transgirlslive.com","traveldesearch.com","travelplanspro.com","trendyol-milla.com","tribeathletics.com","trovapromozioni.it","truckingboards.com","truyenbanquyen.com","truyenhentai18.net","tuhentaionline.com","tulsahurricane.com","turboimagehost.com","tv3play.skaties.lv","tvonlinesports.com","tweaksforgeeks.com","txstatebobcats.com","u-createcrafts.com","ucirvinesports.com","ukrainesmodels.com","uncensoredleak.com","universfreebox.com","unlimitedfiles.xyz","urbanmilwaukee.com","urlaubspartner.net","venus-and-mars.com","vermangasporno.com","verywellhealth.com","victor-mochere.com","videos.porndig.com","videosinlevels.com","videosxxxputas.com","vincenzosplate.com","vintagepornfun.com","vintagepornnew.com","vintagesexpass.com","waitrosecellar.com","washingtonpost.com","watch.rkplayer.xyz","watch.shout-tv.com","watchadsontape.com","wblaxmibhandar.com","weakstreams.online","weatherzone.com.au","web.livecricket.is","webloadedmovie.com","websitesbridge.com","werra-rundschau.de","wheatbellyblog.com","wifemamafoodie.com","wildhentaitube.com","windowsmatters.com","winteriscoming.net","wohnungsboerse.net","woman.excite.co.jp","worldstreams.click","wormser-zeitung.de","www.apkmoddone.com","www.cloudflare.com","www.primevideo.com","xbox360torrent.com","xda-developers.com","xn--kckzb2722b.com","xpressarticles.com","xxx-asian-tube.com","xxxanimemovies.com","xxxanimevideos.com","yify-subtitles.org","youngpussyfuck.com","youwatch-serie.com","yt-downloaderz.com","ytmp4converter.com","znanemediablog.com","zxi.mytechroad.com","aachener-zeitung.de","abukabir.fawrye.com","abyssplay.pages.dev","academiadelmotor.es","adblockstreamtape.*","addtobucketlist.com","adultgamesworld.com","agrigentonotizie.it","aliendictionary.com","allafricangirls.net","allindiaroundup.com","allporncartoons.com","alludemycourses.com","almohtarif-tech.net","altadefinizione01.*","amateur-couples.com","amaturehomeporn.com","amazingtrannies.com","androidrepublic.org","angeloyeo.github.io","animefuckmovies.com","animeonlinefree.org","animesonlineshd.com","annoncesescorts.com","anonymous-links.com","anonymousceviri.com","app.link2unlock.com","app.studysmarter.de","aprenderquechua.com","arabianbusiness.com","arizonawildcats.com","arnaqueinternet.com","arrowheadaddict.com","artificialnudes.com","asiananimaltube.org","asianfuckmovies.com","asianporntube69.com","audiobooks4soul.com","audiotruyenfull.com","bailbondsfinder.com","baltimoreravens.com","beautypackaging.com","beisbolinvernal.com","berliner-zeitung.de","bestmaturewomen.com","bethshouldercan.com","bigcockfreetube.com","bigsouthnetwork.com","blackenterprise.com","blog.cloudflare.com","blog.itijobalert.in","blog.potterworld.co","bluemediadownload.*","bordertelegraph.com","brucevotewithin.com","businessinsider.com","calculascendant.com","cambrevenements.com","cancelguider.online","canuckaudiomart.com","celebritynakeds.com","celebsnudeworld.com","certificateland.com","chakrirkhabar247.in","championpeoples.com","chawomenshockey.com","chicagosportshq.com","christiantrendy.com","chubbypornmpegs.com","citationmachine.net","civilenggforall.com","classicpornbest.com","classicpornvids.com","clevelandbrowns.com","collegeteentube.com","columbiacougars.com","comicsxxxgratis.com","commande.rhinov.pro","commsbusiness.co.uk","comofuncionaque.com","compilationtube.xyz","comprovendolibri.it","concealednation.org","consigliatodanoi.it","couponsuniverse.com","crackedsoftware.biz","cravesandflames.com","creativebusybee.com","crossdresserhub.com","crosswordsolver.com","crystal-launcher.pl","custommapposter.com","daddyfuckmovies.com","daddylivestream.com","dailymaverick.co.za","dartmouthsports.com","der-betze-brennt.de","descargaranimes.com","descargatepelis.com","deseneledublate.com","desktopsolution.org","detroitjockcity.com","dev.fingerprint.com","developerinsider.co","diariodemallorca.es","diarioeducacion.com","dichvureviewmap.com","diendancauduong.com","digitalfernsehen.de","digitalseoninja.com","digitalstudiome.com","dignityobituary.com","discordfastfood.com","divinelifestyle.com","divxfilmeonline.net","dktechnicalmate.com","download.megaup.net","dubipc.blogspot.com","dynamicminister.net","dziennikbaltycki.pl","dziennikpolski24.pl","dziennikzachodni.pl","earn.quotesopia.com","edmontonjournal.com","elamigosedition.com","ellibrepensador.com","embed.nana2play.com","en-thunderscans.com","en.financerites.com","erotic-beauties.com","eventiavversinews.*","expresskaszubski.pl","fansubseries.com.br","fatblackmatures.com","faucetcaptcha.co.in","felicetommasino.com","femdomporntubes.com","fifaultimateteam.it","filmeonline2018.net","filmesonlinehd1.org","firstasianpussy.com","footballfancast.com","footballstreams.lol","footballtransfer.ru","fortnitetracker.com","forum-pokemon-go.fr","foxvalleyfoodie.com","fplstatistics.co.uk","franceprefecture.fr","free-trannyporn.com","freecoursesites.com","freecoursesonline.*","freegamescasual.com","freeindianporn.mobi","freeindianporn2.com","freeplayervideo.com","freescorespiano.com","freesexvideos24.com","freetarotonline.com","freshsexxvideos.com","frustfrei-lernen.de","fuckmonstercock.com","fuckslutsonline.com","futura-sciences.com","gagaltotal666.my.id","gallant-matures.com","gamecocksonline.com","games.bradenton.com","games.fresnobee.com","games.heraldsun.com","games.sunherald.com","gazetawroclawska.pl","generacionretro.net","gesund-vital.online","gfilex.blogspot.com","global.novelpia.com","gloswielkopolski.pl","go-for-it-wgt1a.fun","goarmywestpoint.com","godrakebulldogs.com","godrakebulldogs.net","goodnewsnetwork.org","hailfloridahail.com","hamburgerinsult.com","hardcorelesbian.xyz","hardwarezone.com.sg","hardwoodhoudini.com","hartvannederland.nl","haus-garten-test.de","haveyaseenjapan.com","hawaiiathletics.com","hayamimi-gunpla.com","healthbeautybee.com","helpnetsecurity.com","hentai-mega-mix.com","hentaianimezone.com","hentaisexuality.com","hieunguyenphoto.com","highdefdiscnews.com","hindimatrashabd.com","hindimearticles.net","hindimoviesonline.*","historicaerials.com","hmc-id.blogspot.com","hobby-machinist.com","home-xxx-videos.com","horseshoeheroes.com","hostingdetailer.com","hotbeautyhealth.com","hotorientalporn.com","hqhardcoreporno.com","ilbolerodiravel.org","ilforumdeibrutti.is","indianpornvideo.org","individualogist.com","ingyenszexvideok.hu","insidertracking.com","insidetheiggles.com","interculturalita.it","inventionsdaily.com","iptvxtreamcodes.com","itsecuritynews.info","iulive.blogspot.com","jacquieetmichel.net","japanesexxxporn.com","javuncensored.watch","jayservicestuff.com","joguinhosgratis.com","justcastingporn.com","justsexpictures.com","k-statefootball.net","k-statefootball.org","kentstatesports.com","kenzo-flowertag.com","kingjamesgospel.com","kissmaturestube.com","klettern-magazin.de","kreuzwortraetsel.de","kstateathletics.com","ladypopularblog.com","lawweekcolorado.com","learnchannel-tv.com","learnmarketinfo.com","legionpeliculas.org","legionprogramas.org","leitesculinaria.com","lemino.docomo.ne.jp","letrasgratis.com.ar","lifeisbeautiful.com","limiteddollqjc.shop","livingstondaily.com","localizaagencia.com","lorimuchbenefit.com","love-stoorey210.net","m.jobinmeghalaya.in","main.24jobalert.com","marketrevolution.eu","masashi-blog418.com","massagefreetube.com","maturepornphoto.com","measuringflower.com","mediatn.cms.nova.cz","meeting.tencent.com","megajapanesesex.com","meicho.marcsimz.com","merriam-webster.com","miamiairportcam.com","miamibeachradio.com","migliori-escort.com","mikaylaarealike.com","mindmotion93y8.shop","minecraft-forum.net","minecraftraffle.com","minhaconexao.com.br","mittelbayerische.de","mobilesexgamesx.com","montrealgazette.com","morinaga-office.net","motherandbaby.co.uk","movies-watch.com.pk","myhentaigallery.com","mynaturalfamily.com","myreadingmanga.info","noticiascripto.site","novelmultiverse.com","novelsparadise.site","nude-beach-tube.com","nudeselfiespics.com","nurparatodos.com.ar","obituaryupdates.com","oldgrannylovers.com","onlinefetishporn.cc","onlinepornushka.com","opisanie-kartin.com","orangespotlight.com","outdoor-magazin.com","painting-planet.com","parasportontario.ca","parrocchiapalata.it","paulkitchendark.com","peopleenespanol.com","perfectmomsporn.com","petitegirlsnude.com","pharmaguideline.com","phoenixnewtimes.com","phonereviewinfo.com","pickleballclubs.com","picspornamateur.com","platform.autods.com","play.dictionary.com","play.geforcenow.com","play.mylifetime.com","play.playkrx18.site","player.popfun.co.uk","player.uwatchfree.*","pompanobeachcam.com","popularasianxxx.com","poradyiwskazowki.pl","pornjapanesesex.com","pornocolegialas.org","pornocolombiano.net","pornstarsadvice.com","portmiamiwebcam.com","porttampawebcam.com","pranarevitalize.com","protege-torrent.com","psychology-spot.com","publicidadtulua.com","quest.to-travel.net","raccontivietati.com","radiosantaclaus.com","radiotormentamx.com","rawofficethumbs.com","readcomicsonline.ru","realitybrazzers.com","redowlanalytics.com","relampagomovies.com","reneweconomy.com.au","richardsignfish.com","richmondspiders.com","ripplestream4u.shop","roberteachfinal.com","rojadirectaenhd.net","rojadirectatvlive.*","rollingglobe.online","romanticlesbian.com","rundschau-online.de","ryanmoore.marketing","rysafe.blogspot.com","samurai.wordoco.com","santoinferninho.com","savingsomegreen.com","scansatlanticos.com","scholarshiplist.org","schrauben-normen.de","secondhandsongs.com","sempredirebanzai.it","sempreupdate.com.br","serieshdpormega.com","seriezloaded.com.ng","setsuyakutoushi.com","sex-free-movies.com","sexyvintageporn.com","shogaisha-shuro.com","shogaisha-techo.com","sixsistersstuff.com","skidrowreloaded.com","smartkhabrinews.com","soap2day-online.com","soccerfullmatch.com","soccerworldcup.me>>","sociologicamente.it","somulhergostosa.com","sourcingjournal.com","sousou-no-frieren.*","sportitalialive.com","sportzonline.site>>","spotidownloader.com","ssdownloader.online","standardmedia.co.ke","stealthoptional.com","stevenuniverse.best","stormininnorman.com","storynavigation.com","stoutbluedevils.com","stream.offidocs.com","stream.pkayprek.com","streamadblockplus.*","streamshunters.eu>>","streamtapeadblock.*","submissive-wife.net","summarynetworks.com","sussexexpress.co.uk","svetatnazdraveto.bg","sweetadult-tube.com","tainio-mania.online","tamilfreemp3songs.*","tapewithadblock.org","teachersupdates.net","technicalline.store","techtrendmakers.com","tekniikanmaailma.fi","telecharger-igli4.*","thebalancemoney.com","theberserkmanga.com","thecrazytourist.com","thefoodieaffair.com","theglobeandmail.com","themehospital.co.uk","theoaklandpress.com","therecipecritic.com","thesimsresource.com","thesmokingcuban.com","thewatchseries.live","throwsmallstone.com","timesnowmarathi.com","tiz-cycling-live.io","tophentaicomics.com","toptenknowledge.com","totalfuckmovies.com","totalmaturefuck.com","transexuales.gratis","trendsderzukunft.de","trucs-et-astuces.co","tubepornclassic.com","tubevintageporn.com","turkishseriestv.net","turtleboysports.com","tutorialsduniya.com","tw-hkt.blogspot.com","ukmagazinesfree.com","uktvplay.uktv.co.uk","ultimate-guitar.com","usinger-anzeiger.de","utahstateaggies.com","valleyofthesuns.com","veryfastdownload.pw","vinylcollective.com","vip.stream101.space","virtual-youtuber.jp","virtualdinerbot.com","vitadacelebrita.com","voetbalrotterdam.nl","wallpaperaccess.com","watch-movies.com.pk","watchlostonline.net","watchmonkonline.com","watchmoviesrulz.com","watchonlinemovie.pk","webhostingoffer.org","weristdeinfreund.de","whatjewwannaeat.com","windows-7-forum.net","winit.heatworld.com","woffordterriers.com","worldaffairinfo.com","worldstarhiphop.com","worldtravelling.com","www2.tmyinsight.net","xhamsterdeutsch.xyz","xn--nbkw38mlu2a.com","xnxx-downloader.net","xnxx-sex-videos.com","xxxhentaimovies.com","xxxpussysextube.com","xxxsexyjapanese.com","yaoimangaonline.com","yellowblissroad.com","yorkshirepost.co.uk","your-daily-girl.com","youramateurporn.com","youramateurtube.com","yourlifeupdated.net","youtubedownloader.*","zeeplayer.pages.dev","25yearslatersite.com","27-sidefire-blog.com","2adultflashgames.com","acienciasgalilei.com","adult-sex-gamess.com","adultdvdparadise.com","akatsuki-no-yona.com","allcelebritywiki.com","allcivilstandard.com","allnewindianporn.com","aman-dn.blogspot.com","amateurebonypics.com","amateuryoungpics.com","analysis-chess.io.vn","androidapkmodpro.com","androidtunado.com.br","angolopsicologia.com","animalextremesex.com","apenasmaisumyaoi.com","aquiyahorajuegos.net","aroundthefoghorn.com","aspdotnet-suresh.com","ayobelajarbareng.com","badassdownloader.com","bailiwickexpress.com","banglachotigolpo.xyz","best-mobilegames.com","bestmp3converter.com","bestshemaleclips.com","bigtitsporn-tube.com","blackwoodacademy.org","bloggingawaydebt.com","bloggingguidance.com","boainformacao.com.br","bogowieslowianscy.pl","bollywoodshaadis.com","bouamra.blogspot.com","boxofficebusiness.in","br.nacaodamusica.com","browardpalmbeach.com","brr-69xwmut5-moo.com","bustyshemaleporn.com","cachevalleydaily.com","canberratimes.com.au","cartoonstvonline.com","cartoonvideos247.com","centralboyssp.com.br","chasingthedonkey.com","cienagamagdalena.com","climbingtalshill.com","comandotorrenthd.org","consiglietrucchi.com","crackstreamsfree.com","crackstreamshd.click","craigretailers.co.uk","creators.nafezly.com","dailygrindonline.net","dairylandexpress.com","davidsonbuilders.com","dcdlplayer8a06f4.xyz","decorativemodels.com","defienietlynotme.com","deliciousmagazine.pl","demonyslowianskie.pl","denisegrowthwide.com","descargaseriestv.com","diglink.blogspot.com","divxfilmeonline.tv>>","djsofchhattisgarh.in","docs.fingerprint.com","donna-cerca-uomo.com","downloadfilm.website","durhamopenhouses.com","ear-phone-review.com","earnfromarticles.com","edivaldobrito.com.br","educationbluesky.com","embed.hideiframe.com","encuentratutarea.com","eroticteensphoto.net","escort-in-italia.com","essen-und-trinken.de","eurostreaming.casino","extremereportbot.com","fairforexbrokers.com","famosas-desnudas.org","fastpeoplesearch.com","filmeserialegratis.*","filmpornofrancais.fr","finanznachrichten.de","finding-camellia.com","fle-2ggdmu8q-moo.com","fle-5r8dchma-moo.com","fle-rvd0i9o8-moo.com","footballandress.club","foreverconscious.com","forexwikitrading.com","forge.plebmasters.de","forobasketcatala.com","forum.lolesporte.com","forum.thresholdx.net","fotbolltransfers.com","fr.streamon-sport.ru","free-sms-receive.com","freebigboobsporn.com","freecoursesonline.me","freelistenonline.com","freemagazinespdf.com","freemedicalbooks.org","freepatternsarea.com","freereadnovel.online","freeromsdownload.com","freestreams-live.*>>","freethailottery.live","freshshemaleporn.com","fullywatchonline.com","funeral-memorial.com","gaget.hatenablog.com","games.abqjournal.com","games.dallasnews.com","games.denverpost.com","games.kansascity.com","games.sixtyandme.com","games.wordgenius.com","gearingcommander.com","gesundheitsfrage.net","getfreesmsnumber.com","ghajini-04bl9y7x.lol","ghajini-1fef5bqn.lol","ghajini-1flc3i96.lol","ghajini-4urg44yg.lol","ghajini-8nz2lav9.lol","ghajini-9b3wxqbu.lol","ghajini-emtftw1o.lol","ghajini-jadxelkw.lol","ghajini-vf70yty6.lol","ghajini-y9yq0v8t.lol","giuseppegravante.com","giveawayoftheday.com","givemenbastreams.com","googledrivelinks.com","gourmetsupremacy.com","greatestshemales.com","griffinathletics.com","hackingwithreact.com","hds-streaming-hd.com","headlinepolitics.com","heartofvicksburg.com","heartrainbowblog.com","heresyoursavings.com","highheelstrample.com","historichorizons.com","hodgepodgehippie.com","hofheimer-zeitung.de","home-made-videos.com","homestratosphere.com","hornyconfessions.com","hostingreviews24.com","hotasianpussysex.com","hotjapaneseshows.com","huffingtonpost.co.uk","hypelifemagazine.com","immobilienscout24.de","india.marathinewz.in","inkworldmagazine.com","intereseducation.com","investnewsbrazil.com","irresistiblepets.net","italiadascoprire.net","jemontremonminou.com","k-stateathletics.com","kachelmannwetter.com","karaoke4download.com","karaokegratis.com.ar","keedabankingnews.com","lacronicabadajoz.com","laopiniondemalaga.es","laopiniondemurcia.es","laopiniondezamora.es","largescaleforums.com","latinatemptation.com","laweducationinfo.com","lazytranslations.com","learn.moderngyan.com","lemonsqueezyhome.com","lempaala.ideapark.fi","lesbianvideotube.com","letemsvetemapplem.eu","letsworkremotely.com","link.djbassking.live","linksdegrupos.com.br","live-tv-channels.org","loan.bgmi32bitapk.in","loan.punjabworks.com","loriwithinfamily.com","luxurydreamhomes.net","main.sportswordz.com","mangcapquangvnpt.com","maturepornjungle.com","maturewomenfucks.com","mauiinvitational.com","maxfinishseveral.com","medicalstudyzone.com","mein-kummerkasten.de","michaelapplysome.com","mkvmoviespoint.autos","money.quotesopia.com","monkeyanimalporn.com","morganhillwebcam.com","motorbikecatalog.com","motorcitybengals.com","motorsport-total.com","movieloversworld.com","moviemakeronline.com","moviesubtitles.click","mujeresdesnudas.club","mustardseedmoney.com","mylivewallpapers.com","mypace.sasapurin.com","myperfectweather.com","mypussydischarge.com","myuploadedpremium.de","naughtymachinima.com","newfreelancespot.com","neworleanssaints.com","newsonthegotoday.com","nibelungen-kurier.de","notebookcheck-ru.com","notebookcheck-tr.com","nudeplayboygirls.com","nuovo.vidplayer.live","nutraingredients.com","nylonstockingsex.net","onechicagocenter.com","online-xxxmovies.com","onlinegrannyporn.com","originalteentube.com","pandadevelopment.net","pasadenastarnews.com","pcgamez-download.com","pesprofessionals.com","pipocamoderna.com.br","plagiarismchecker.co","planetaminecraft.com","platform.twitter.com","play.doramasplus.net","player.amperwave.net","player.smashy.stream","playstationhaber.com","popularmechanics.com","porlalibreportal.com","pornhub-sexfilme.net","portnassauwebcam.com","presentation-ppt.com","prismmarketingco.com","pro.iqsmartgames.com","psychologyjunkie.com","pussymaturephoto.com","radiocountrylive.com","ragnarokscanlation.*","ranaaclanhungary.com","rebeccaneverbase.com","recipestutorials.com","redensarten-index.de","remotejobzone.online","reviewingthebrew.com","rhein-main-presse.de","rinconpsicologia.com","robertplacespace.com","rockpapershotgun.com","roemische-zahlen.net","rojadirectaenvivo.pl","roms-telecharger.com","s920221683.online.de","salamanca24horas.com","sandratableother.com","sarkariresult.social","savespendsplurge.com","schoolgirls-asia.org","schwaebische-post.de","securegames.iwin.com","server-tutorials.net","server.satunivers.tv","sexypornpictures.org","socialmediagirls.com","socialmediaverve.com","socket.pearsoned.com","solomaxlevelnewbie.*","spicyvintageporn.com","sportstohfa.online>>","starkroboticsfrc.com","stream.nbcsports.com","streamingcommunity.*","strtapewithadblock.*","successstoryinfo.com","superfastrelease.xyz","superpackpormega.com","swietaslowianskie.pl","tainguyenmienphi.com","tasteandtellblog.com","teenamateurphoto.com","telephone-soudan.com","teluguonlinemovies.*","telugusexkathalu.com","thecraftsmanblog.com","thefappeningblog.com","thefastlaneforum.com","thegatewaypundit.com","thekitchenmagpie.com","thelavenderchair.com","thesarkariresult.net","thistlewoodfarms.com","tienichdienthoai.net","tinyqualityhomes.org","todaysthebestday.com","tomb-raider-king.com","totalsportek1000.com","toyoheadquarters.com","travellingdetail.com","trueachievements.com","tutorialforlinux.com","udemy-downloader.com","underground.tboys.ro","unityassets4free.com","utahsweetsavings.com","utepminermaniacs.com","ver-comics-porno.com","ver-mangas-porno.com","videoszoofiliahd.com","vintageporntubes.com","viralviralvideos.com","virgo-horoscopes.com","visualcapitalist.com","wallstreet-online.de","watchallchannels.com","watchcartoononline.*","watchgameofthrones.*","watchhouseonline.net","watchsuitsonline.net","watchtheofficetv.com","wegotthiscovered.com","weihnachts-filme.com","wetasiancreampie.com","whats-on-netflix.com","whitelacecottage.com","wife-home-videos.com","wirtualnynowydwor.pl","worldgirlsportal.com","yakyufan-asobiba.com","youfreepornotube.com","youngerasiangirl.net","yourhomebasedmom.com","yourhomemadetube.com","youtube-nocookie.com","yummytummyaarthi.com","1337x.ninjaproxy1.com","3dassetcollection.com","3dprintersforum.co.uk","ableitungsrechner.net","ad-itech.blogspot.com","airportseirosafar.com","airsoftmilsimnews.com","allgemeine-zeitung.de","ar-atech.blogspot.com","arabamob.blogspot.com","arrisalah-jakarta.com","banglachoti-story.com","bestsellerforaday.com","bibliotecadecorte.com","bigbuttshubvideos.com","blackchubbymovies.com","blackmaturevideos.com","blasianluvforever.com","blog.motionisland.com","bournemouthecho.co.uk","branditechture.agency","brandstofprijzen.info","broncathleticfund.com","brutalanimalsfuck.com","bucetaspeludas.com.br","business-standard.com","calculator-online.net","cancer-horoscopes.com","celebritydeeplink.com","collinsdictionary.com","comentariodetexto.com","course-downloader.com","daddylivestream.com>>","dailyvideoreports.net","davescomputertips.com","desitab69.sextgem.com","destakenewsgospel.com","deutschpersischtv.com","diarioinformacion.com","diplomaexamcorner.com","dirtyyoungbitches.com","disneyfashionista.com","downloadcursos.gratis","dragontranslation.com","dragontranslation.net","dragontranslation.org","earn.mpscstudyhub.com","easyworldbusiness.com","edwardarriveoften.com","elcriticodelatele.com","electricalstudent.com","embraceinnerchaos.com","envato-downloader.com","eroticmoviesonline.me","errotica-archives.com","evelynthankregion.com","expressilustrowany.pl","filemoon-59t9ep5j.xyz","filemoon-ep11lgxt.xyz","filemoon-nv2xl8an.xyz","filemoon-oe4w6g0u.xyz","filmpornoitaliano.org","fitting-it-all-in.com","foodsdictionary.co.il","free-famous-toons.com","freebulksmsonline.com","freefatpornmovies.com","freeindiansextube.com","freepikdownloader.com","freshmaturespussy.com","friedrichshainblog.de","froheweihnachten.info","gadgetguideonline.com","games.bostonglobe.com","games.centredaily.com","games.dailymail.co.uk","games.greatergood.com","games.miamiherald.com","games.puzzlebaron.com","games.startribune.com","games.theadvocate.com","games.theolympian.com","games.triviatoday.com","gbadamud.blogspot.com","gemini-horoscopes.com","generalpornmovies.com","gentiluomodigitale.it","gentlemansgazette.com","giantshemalecocks.com","giessener-anzeiger.de","girlfuckgalleries.com","glamourxxx-online.com","gmuender-tagespost.de","googlearth.selva.name","goprincetontigers.com","guardian-series.co.uk","hackedonlinegames.com","hersfelder-zeitung.de","hochheimer-zeitung.de","hoegel-textildruck.de","hollywoodreporter.com","hot-teens-movies.mobi","hotmarathistories.com","howtoblogformoney.net","html5.gamemonetize.co","hungarianhardstyle.hu","iamflorianschulze.com","imasdk.googleapis.com","indiansexstories2.net","indratranslations.com","inmatesearchidaho.com","insideeducation.co.za","jacquieetmicheltv.net","jemontremasextape.com","journaldemontreal.com","journey.to-travel.net","jsugamecocksports.com","juninhoscripts.com.br","kana-mari-shokudo.com","kstatewomenshoops.com","kstatewomenshoops.net","kstatewomenshoops.org","labelandnarrowweb.com","lapaginadealberto.com","learnodo-newtonic.com","lebensmittelpraxis.de","lesbianfantasyxxx.com","lingeriefuckvideo.com","live-sport.duktek.pro","lycomingathletics.com","majalahpendidikan.com","malaysianwireless.com","mangaplus.shueisha.tv","megashare-website.com","meuplayeronlinehd.com","midlandstraveller.com","midwestconference.org","mimaletadepeliculas.*","mmoovvfr.cloudfree.jp","moo-teau4c9h-mkay.com","moonfile-62es3l9z.com","motorsport.uol.com.br","musvozimbabwenews.com","mysflink.blogspot.com","nathanfromsubject.com","nationalgeographic.fr","netsentertainment.net","nobledicion.yoveo.xyz","note.sieuthuthuat.com","notformembersonly.com","oberschwaben-tipps.de","onepiecemangafree.com","onlinetntextbooks.com","onlinewatchmoviespk.*","ovcdigitalnetwork.com","paradiseislandcam.com","pcso-lottoresults.com","peiner-nachrichten.de","pelotalibrevivo.net>>","philippinenmagazin.de","photovoltaikforum.com","pickleballleagues.com","pisces-horoscopes.com","platform.adex.network","portbermudawebcam.com","primapaginamarsala.it","printablecreative.com","prod.hydra.sophos.com","quinnipiacbobcats.com","qul-de.translate.goog","radioitaliacanada.com","radioitalianmusic.com","redbluffdailynews.com","reddit-streams.online","redheaddeepthroat.com","redirect.dafontvn.com","revistaapolice.com.br","salzgitter-zeitung.de","santacruzsentinel.com","santafenewmexican.com","scriptgrowagarden.com","scrubson.blogspot.com","semprefi-1h3u8pkc.fun","semprefi-2tazedzl.fun","semprefi-5ut0d23g.fun","semprefi-7oliaqnr.fun","semprefi-8xp7vfr9.fun","semprefi-hdm6l8jq.fun","semprefi-uat4a3jd.fun","semprefi-wdh7eog3.fun","sex-amateur-clips.com","sexybabespictures.com","shortgoo.blogspot.com","showdownforrelief.com","sinnerclownceviri.net","skorpion-horoskop.com","smartwebsolutions.org","snapinstadownload.xyz","softwarecrackguru.com","softwaredescargas.com","solomax-levelnewbie.*","solopornoitaliani.xxx","soziologie-politik.de","space.tribuntekno.com","stablediffusionxl.com","startupjobsportal.com","steamcrackedgames.com","stream.hownetwork.xyz","streaming-community.*","streamingcommunityz.*","studyinghuman6js.shop","supertelevisionhd.com","sweet-maturewomen.com","symboleslowianskie.pl","tapeadvertisement.com","tarjetarojaenvivo.lat","tarjetarojatvonline.*","taurus-horoscopes.com","taurus.topmanhuas.org","tech.trendingword.com","texteditor.nsspot.net","thecakeboutiquect.com","thedigitaltheater.com","thefightingcock.co.uk","thefreedictionary.com","thegnomishgazette.com","theprofoundreport.com","thetruthaboutcars.com","thewebsitesbridge.com","timesheraldonline.com","timesnewsgroup.com.au","tipsandtricksarab.com","toddpartneranimal.com","torrentdofilmeshd.net","towheaddeepthroat.com","travel-the-states.com","travelingformiles.com","tudo-para-android.com","ukiahdailyjournal.com","unsurcoenlasombra.com","utkarshonlinetest.com","vdl.np-downloader.com","virtualstudybrain.com","voyeur-pornvideos.com","walterprettytheir.com","watch.foodnetwork.com","watchcartoonsonline.*","watchfreejavonline.co","watchkobestreams.info","watchonlinemoviespk.*","watchporninpublic.com","watchseriesstream.com","weihnachts-bilder.org","wetterauer-zeitung.de","whisperingauroras.com","whittierdailynews.com","wiesbadener-kurier.de","wirtualnelegionowo.pl","worldwidestandard.net","www.dailymotion.com>>","xn--mlaregvle-02af.nu","yoima.hatenadiary.com","yoima2.hatenablog.com","zone-telechargement.*","123movies-official.net","1plus1plus1equals1.net","45er-de.translate.goog","acervodaputaria.com.br","adelaidepawnbroker.com","aimasummd.blog.fc2.com","algodaodocescan.com.br","allevertakstream.space","androidecuatoriano.xyz","appstore-discounts.com","automobile-catalog.com","batterypoweronline.com","best4hack.blogspot.com","bestialitysextaboo.com","blackamateursnaked.com","brunettedeepthroat.com","bus-location.1507t.xyz","canadianunderwriter.ca","canzoni-per-bambini.it","cartoonporncomics.info","celebritymovieblog.com","clixwarez.blogspot.com","comandotorrentshds.org","cosmonova-broadcast.tv","cotravinh.blogspot.com","cpopchanelofficial.com","currencyconverterx.com","currentrecruitment.com","dads-banging-teens.com","databasegdriveplayer.*","dewfuneralhomenews.com","diananatureforeign.com","digitalbeautybabes.com","downloadfreecourse.com","drakorkita73.kita.rest","drop.carbikenation.com","dtupgames.blogspot.com","ecommercewebsite.store","einewelteinezukunft.de","electriciansforums.net","elektrobike-online.com","elizabeth-mitchell.org","enciclopediaonline.com","eu-proxy.startpage.com","eurointegration.com.ua","exclusiveasianporn.com","exgirlfriendmarket.com","ezaudiobookforsoul.com","fantasticyoungporn.com","file-1bl9ruic-moon.com","filmeserialeonline.org","freelancerartistry.com","freepic-downloader.com","freepik-downloader.com","ftlauderdalewebcam.com","games.besthealthmag.ca","games.heraldonline.com","games.islandpacket.com","games.journal-news.com","games.readersdigest.ca","gewinnspiele-markt.com","gifhorner-rundschau.de","girlfriendsexphoto.com","golink.bloggerishyt.in","hairstylesthatwork.com","hentai-cosplay-xxx.com","hentai-vl.blogspot.com","hiraethtranslation.com","hockeyfantasytools.com","hopsion-consulting.com","hotanimepornvideos.com","housethathankbuilt.com","illustratemagazine.com","imagetwist.netlify.app","incontri-in-italia.com","indianpornvideo.online","insidekstatesports.com","insidekstatesports.net","insidekstatesports.org","irasutoya.blogspot.com","jacquieetmicheltv2.net","jessicaglassauthor.com","jonathansociallike.com","juegos.eleconomista.es","juneauharborwebcam.com","k-statewomenshoops.com","k-statewomenshoops.net","k-statewomenshoops.org","kenkou-maintenance.com","kristiesoundsimply.com","lagacetadesalamanca.es","lecourrier-du-soir.com","livefootballempire.com","livingincebuforums.com","lonestarconference.org","m.bloggingguidance.com","marketedgeofficial.com","marketplace.nvidia.com","masterpctutoriales.com","megadrive-emulator.com","meteoregioneabruzzo.it","mini.surveyenquete.net","moneywar2.blogspot.com","muleriderathletics.com","nathanmichaelphoto.com","newbookmarkingsite.com","nilopolisonline.com.br","obutecodanet.ig.com.br","onlinetechsamadhan.com","onlinevideoconverter.*","opiniones-empresas.com","oracleerpappsguide.com","originalindianporn.com","paginadanoticia.com.br","philadelphiaeagles.com","pianetamountainbike.it","pittsburghpanthers.com","plagiarismdetector.net","play.discoveryplus.com","portstthomaswebcam.com","poweredbycovermore.com","praxis-jugendarbeit.de","principiaathletics.com","puzzles.standard.co.uk","puzzles.sunjournal.com","radioamericalatina.com","redlandsdailyfacts.com","republicain-lorrain.fr","rubyskitchenrecipes.uk","russkoevideoonline.com","salisburyjournal.co.uk","schwarzwaelder-bote.de","scorpio-horoscopes.com","sexyasianteenspics.com","smallpocketlibrary.com","smartfeecalculator.com","sms-receive-online.com","stellar.quoteminia.com","strangernervousql.shop","streamhentaimovies.com","stuttgarter-zeitung.de","supermarioemulator.com","tastefullyeclectic.com","tatacommunications.com","techieway.blogspot.com","teluguhitsandflops.com","thatballsouttahere.com","the-military-guide.com","thecartoonporntube.com","thehouseofportable.com","thisishowwebingham.com","tipsandtricksjapan.com","tipsandtrickskorea.com","totalsportek1000.com>>","turkishaudiocenter.com","tutoganga.blogspot.com","tvchoicemagazine.co.uk","twopeasandtheirpod.com","unity3diy.blogspot.com","universitiesonline.xyz","universityequality.com","watchdocumentaries.com","webcreator-journal.com","welsh-dictionary.ac.uk","xhamster-sexvideos.com","xn--algododoce-j5a.com","youfiles.herokuapp.com","yourdesignmagazine.com","zeeebatch.blogspot.com","aachener-nachrichten.de","adblockeronstreamtape.*","adrianmissionminute.com","ads-ti9ni4.blogspot.com","adultgamescollector.com","alejandrocenturyoil.com","alleneconomicmatter.com","allschoolboysecrets.com","aquarius-horoscopes.com","arcade.dailygazette.com","asianteenagefucking.com","auto-motor-und-sport.de","barranquillaestereo.com","bestpuzzlesandgames.com","betterbuttchallenge.com","bikyonyu-bijo-zukan.com","brasilsimulatormods.com","buerstaedter-zeitung.de","c--ix-de.translate.goog","careersatcouncil.com.au","cloudapps.herokuapp.com","coolsoft.altervista.org","creditcardgenerator.com","dameungrrr.videoid.baby","destinationsjourney.com","dokuo666.blog98.fc2.com","edgedeliverynetwork.com","elperiodicodearagon.com","encurtador.postazap.com","entertainment-focus.com","escortconrecensione.com","eservice.directauto.com","eskiceviri.blogspot.com","exclusiveindianporn.com","fightforthealliance.com","file-kg88oaak-embed.com","financeandinsurance.xyz","footballtransfer.com.ua","freefiremaxofficial.com","freemovies-download.com","freepornhdonlinegay.com","funeralmemorialnews.com","gamersdiscussionhub.com","games.mercedsunstar.com","games.pressdemocrat.com","games.sanluisobispo.com","games.star-telegram.com","gamingsearchjournal.com","giessener-allgemeine.de","goctruyentranhvui17.com","heatherwholeinvolve.com","historyofroyalwomen.com","homeschoolgiveaways.com","ilgeniodellostreaming.*","india.mplandrecord.info","influencersgonewild.com","insidekstatesports.info","integral-calculator.com","investmentwatchblog.com","iptvdroid1.blogspot.com","juegosdetiempolibre.org","julieseatsandtreats.com","kennethofficialitem.com","keysbrasil.blogspot.com","keywestharborwebcam.com","kutubistan.blogspot.com","lancewhosedifficult.com","laurelberninteriors.com","legendaryrttextures.com","linklog.tiagorangel.com","lirik3satu.blogspot.com","loldewfwvwvwewefdw.cyou","megaplayer.bokracdn.run","metamani.blog15.fc2.com","miltonfriedmancores.org","ministryofsolutions.com","mobile-tracker-free.com","mobileweb.bankmellat.ir","moon-3uykdl2w-embed.com","morgan0928-5386paz2.fun","morgan0928-6v7c14vs.fun","morgan0928-8ufkpqp8.fun","morgan0928-oqdmw7bl.fun","morgan0928-t9xc5eet.fun","morganoperationface.com","morrisvillemustangs.com","mountainbike-magazin.de","movielinkbdofficial.com","mrfreemium.blogspot.com","naumburger-tageblatt.de","newlifefuneralhomes.com","news-und-nachrichten.de","northwalespioneer.co.uk","nudeblackgirlfriend.com","nutraceuticalsworld.com","onlinesoccermanager.com","osteusfilmestuga.online","pandajogosgratis.com.br","paradehomeandgarden.com","patriotathleticfund.com","pcoptimizedsettings.com","pepperlivestream.online","phonenumber-lookup.info","player.bestrapeporn.com","player.smashystream.com","player.tormalayalamhd.*","player.xxxbestsites.com","portaldosreceptores.org","portcanaveralwebcam.com","portstmaartenwebcam.com","pramejarab.blogspot.com","predominantlyorange.com","premierfantasytools.com","prepared-housewives.com","privateindianmovies.com","programmingeeksclub.com","puzzles.pressherald.com","receive-sms-online.info","rppk13baru.blogspot.com","searchenginereports.net","seoul-station-druid.com","sexyteengirlfriends.net","sexywomeninlingerie.com","shannonpersonalcost.com","singlehoroskop-loewe.de","snowman-information.com","spacestation-online.com","sqlserveregitimleri.com","streamtapeadblockuser.*","talentstareducation.com","teamupinternational.com","tech.pubghighdamage.com","the-voice-of-germany.de","thebestideasforkids.com","thechroniclesofhome.com","thehappierhomemaker.com","theinternettaughtme.com","theplantbasedschool.com","tinycat-voe-fashion.com","tips97tech.blogspot.com","traderepublic.community","tutorialesdecalidad.com","valuable.hatenablog.com","verteleseriesonline.com","watchseries.unblocked.*","whatgreatgrandmaate.com","wiesbadener-tagblatt.de","windowsaplicaciones.com","xxxjapaneseporntube.com","youtube4kdownloader.com","zonamarela.blogspot.com","zone-telechargement.ing","zoomtventertainment.com","720pxmovies.blogspot.com","abendzeitung-muenchen.de","advertiserandtimes.co.uk","afilmyhouse.blogspot.com","altebwsneno.blogspot.com","anime4mega-descargas.net","aspirapolveremigliori.it","ate60vs7zcjhsjo5qgv8.com","atlantichockeyonline.com","aussenwirtschaftslupe.de","bestialitysexanimals.com","boundlessnecromancer.com","broadbottomvillage.co.uk","businesssoftwarehere.com","canonprintersdrivers.com","cardboardtranslation.com","celebrityleakednudes.com","childrenslibrarylady.com","cimbusinessevents.com.au","cle0desktop.blogspot.com","cloudcomputingtopics.net","culture-informatique.net","democratandchronicle.com","dictionary.cambridge.org","dictionnaire-medical.net","dominican-republic.co.il","downloads.wegomovies.com","downloadtwittervideo.com","dsocker1234.blogspot.com","einrichtungsbeispiele.de","fid-gesundheitswissen.de","freegrannypornmovies.com","freehdinterracialporn.in","ftlauderdalebeachcam.com","futbolenlatelevision.com","galaxytranslations10.com","games.crosswordgiant.com","games.idahostatesman.com","games.thenewstribune.com","games.tri-cityherald.com","gcertificationcourse.com","gelnhaeuser-tageblatt.de","general-anzeiger-bonn.de","greenbaypressgazette.com","hentaianimedownloads.com","hilfen-de.translate.goog","hotmaturegirlfriends.com","inlovingmemoriesnews.com","inmatefindcalifornia.com","insurancebillpayment.net","intelligence-console.com","jacquieetmichelelite.com","jasonresponsemeasure.com","josephseveralconcern.com","juegos.elnuevoherald.com","jumpmanclubbrasil.com.br","lampertheimer-zeitung.de","latribunadeautomocion.es","lauterbacher-anzeiger.de","lespassionsdechinouk.com","liveanimalporn.zooo.club","mariatheserepublican.com","mediapemersatubangsa.com","meine-anzeigenzeitung.de","mentalhealthcoaching.org","minecraft-serverlist.net","moalm-qudwa.blogspot.com","multivideodownloader.com","my-code4you.blogspot.com","noblessetranslations.com","nutraingredients-usa.com","nyangames.altervista.org","oberhessische-zeitung.de","onlinetv.planetfools.com","personality-database.com","phenomenalityuniform.com","philly.arkadiumarena.com","photos-public-domain.com","player.subespanolvip.com","playstationlifestyle.net","polseksongs.blogspot.com","portevergladeswebcam.com","programasvirtualespc.net","puzzles.centralmaine.com","quelleestladifference.fr","reddit-soccerstreams.com","renierassociatigroup.com","riprendiamocicatania.com","roadrunnersathletics.com","robertordercharacter.com","sandiegouniontribune.com","senaleszdhd.blogspot.com","shoppinglys.blogspot.com","smotret-porno-onlain.com","softdroid4u.blogspot.com","stephenking-00qvxikv.fun","stephenking-3u491ihg.fun","stephenking-7tm3toav.fun","stephenking-c8bxyhnp.fun","stephenking-vy5hgkgu.fun","the-crossword-solver.com","thebharatexpressnews.com","thedesigninspiration.com","theharristeeterdeals.com","themediterraneandish.com","therelaxedhomeschool.com","thewanderlustkitchen.com","thunderousintentions.com","tirumalatirupatiyatra.in","tubeinterracial-porn.com","unityassetcollection.com","upscaler.stockphotos.com","ustreasuryyieldcurve.com","verpeliculasporno.gratis","virginmediatelevision.ie","watchdoctorwhoonline.com","watchtrailerparkboys.com","workproductivityinfo.com","actionviewphotography.com","arabic-robot.blogspot.com","bharatsarkarijobalert.com","blog.receivefreesms.co.uk","braunschweiger-zeitung.de","businessnamegenerator.com","caroloportunidades.com.br","christopheruntilpoint.com","constructionplacement.org","convert-case.softbaba.com","cooldns-de.translate.goog","ctrmarketingsolutions.com","depo-program.blogspot.com","derivative-calculator.net","devere-group-hongkong.com","devoloperxda.blogspot.com","dictionnaire.lerobert.com","everydayhomeandgarden.com","fantasyfootballgeek.co.uk","fitnesshealtharticles.com","footballleagueworld.co.uk","fotografareindigitale.com","freeserverhostingweb.club","freewatchserialonline.com","game-kentang.blogspot.com","games.daytondailynews.com","games.gameshownetwork.com","games.lancasteronline.com","games.ledger-enquirer.com","games.moviestvnetwork.com","games.theportugalnews.com","gloucestershirelive.co.uk","graceaddresscommunity.com","heatherdiscussionwhen.com","housecardsummerbutton.com","kathleenmemberhistory.com","koume-in-huistenbosch.net","krankheiten-simulieren.de","lancashiretelegraph.co.uk","latribunadelpaisvasco.com","mega-hentai2.blogspot.com","nutraingredients-asia.com","oeffentlicher-dienst.info","oneessentialcommunity.com","onepiece-manga-online.net","passionatecarbloggers.com","percentagecalculator.guru","pickleballteamleagues.com","pickleballtournaments.com","printedelectronicsnow.com","programmiedovetrovarli.it","projetomotog.blogspot.com","puzzles.independent.co.uk","realcanadiansuperstore.ca","receitasoncaseiras.online","schooltravelorganiser.com","scripcheck.great-site.net","searchmovie.wp.xdomain.jp","sentinelandenterprise.com","seogroup.bookmarking.info","silverpetticoatreview.com","softwaresolutionshere.com","sofwaremania.blogspot.com","tech.unblockedgames.world","telenovelas-turcas.com.es","thebeginningaftertheend.*","theshabbycreekcottage.com","transparentcalifornia.com","truesteamachievements.com","tucsitupdate.blogspot.com","ultimateninjablazingx.com","usahealthandlifestyle.com","vercanalesdominicanos.com","vintage-erotica-forum.com","whatisareverseauction.com","xn--k9ja7fb0161b5jtgfm.jp","youtubemp3donusturucu.net","yusepjaelani.blogspot.com","a-b-f-dd-aa-bb-cc61uyj.fun","a-b-f-dd-aa-bb-ccn1nff.fun","a-b-f-dd-aa-bb-cctwd3a.fun","a-b-f-dd-aa-bb-ccyh5my.fun","arena.gamesforthebrain.com","audiobookexchangeplace.com","avengerinator.blogspot.com","barefeetonthedashboard.com","basseqwevewcewcewecwcw.xyz","bezpolitickekorektnosti.cz","bibliotecahermetica.com.br","change-ta-vie-coaching.com","collegefootballplayoff.com","cornerstoneconfessions.com","cotannualconference.org.uk","cuatrolatastv.blogspot.com","dinheirocursosdownload.com","downloads.sayrodigital.net","edinburghnews.scotsman.com","elperiodicoextremadura.com","flashplayer.fullstacks.net","former-railroad-worker.com","frankfurter-wochenblatt.de","funnymadworld.blogspot.com","games.bellinghamherald.com","games.everythingzoomer.com","helmstedter-nachrichten.de","html5.gamedistribution.com","investigationdiscovery.com","istanbulescortnetworks.com","jilliandescribecompany.com","johnwardflighttraining.com","mailtool-de.translate.goog","motive213link.blogspot.com","musicbusinessworldwide.com","noticias.gospelmais.com.br","nutraingredients-latam.com","photoshopvideotutorial.com","puzzles.bestforpuzzles.com","recetas.arrozconleche.info","redditsoccerstreams.name>>","ripleyfieldworktracker.com","riverdesdelatribuna.com.ar","sagittarius-horoscopes.com","skillmineopportunities.com","stuttgarter-nachrichten.de","sulocale.sulopachinews.com","thelastgamestandingexp.com","thetelegraphandargus.co.uk","tiendaenlinea.claro.com.ni","todoseriales1.blogspot.com","tokoasrimotedanpayet.my.id","tralhasvarias.blogspot.com","video-to-mp3-converter.com","watchimpracticaljokers.com","whowantstuffs.blogspot.com","windowcleaningforums.co.uk","wolfenbuetteler-zeitung.de","wolfsburger-nachrichten.de","brittneystandardwestern.com","celestialtributesonline.com","charlottepilgrimagetour.com","choose.kaiserpermanente.org","cloud-computing-central.com","cointiply.arkadiumarena.com","constructionmethodology.com","cool--web-de.translate.goog","domainregistrationtips.info","download.kingtecnologia.com","dramakrsubindo.blogspot.com","elperiodicomediterraneo.com","embed.nextgencloudtools.com","evlenmekisteyenbayanlar.net","flash-firmware.blogspot.com","games.myrtlebeachonline.com","ge-map-overlays.appspot.com","happypenguin.altervista.org","iphonechecker.herokuapp.com","littlepandatranslations.com","lurdchinexgist.blogspot.com","newssokuhou666.blog.fc2.com","otakuworldsite.blogspot.com","parametric-architecture.com","pasatiemposparaimprimir.com","practicalpainmanagement.com","puzzles.crosswordsolver.org","redcarpet-fashionawards.com","thewestmorlandgazette.co.uk","timesofindia.indiatimes.com","watchfootballhighlights.com","watchmalcolminthemiddle.com","watchonlyfoolsandhorses.com","your-local-pest-control.com","centrocommercialevulcano.com","conoscereilrischioclinico.it","correction-livre-scolaire.fr","economictimes.indiatimes.com","emperorscan.mundoalterno.org","games.springfieldnewssun.com","gps--cache-de.translate.goog","imagenesderopaparaperros.com","lizs-early-learning-spot.com","locurainformaticadigital.com","michiganrugcleaning.cleaning","mimaletamusical.blogspot.com","net--tools-de.translate.goog","net--tours-de.translate.goog","pekalongan-cits.blogspot.com","publicrecords.netronline.com","skibiditoilet.yourmom.eu.org","springfieldspringfield.co.uk","teachersguidetn.blogspot.com","tekken8combo.kagewebsite.com","theeminenceinshadowmanga.com","uptodatefinishconference.com","watchonlinemovies.vercel.app","www-daftarharga.blogspot.com","youkaiwatch2345.blog.fc2.com","bayaningfilipino.blogspot.com","beautypageants.indiatimes.com","counterstrike-hack.leforum.eu","dev-dark-blog.pantheonsite.io","educationtips213.blogspot.com","fun--seiten-de.translate.goog","hortonanderfarom.blogspot.com","panlasangpinoymeatrecipes.com","pharmaceutical-technology.com","play.virginmediatelevision.ie","pressurewasherpumpdiagram.com","shorturl.unityassets4free.com","thefreedommatrix.blogspot.com","walkthrough-indo.blogspot.com","web--spiele-de.translate.goog","wojtekczytawh40k.blogspot.com","caq21harderv991gpluralplay.xyz","comousarzararadio.blogspot.com","coolsoftware-de.translate.goog","hipsteralcolico.altervista.org","jennifercertaindevelopment.com","kryptografie-de.translate.goog","mp3songsdownloadf.blogspot.com","noicetranslations.blogspot.com","oxfordlearnersdictionaries.com","pengantartidurkuh.blogspot.com","photo--alben-de.translate.goog","rheinische-anzeigenblaetter.de","thelibrarydigital.blogspot.com","touhoudougamatome.blog.fc2.com","watchcalifornicationonline.com","wwwfotografgotlin.blogspot.com","bigclatterhomesguideservice.com","bitcoinminingforex.blogspot.com","cool--domains-de.translate.goog","ibecamethewifeofthemalelead.com","pickcrackpasswords.blogspot.com","posturecorrectorshop-online.com","safeframe.googlesyndication.com","sozialversicherung-kompetent.de","the-girl-who-ate-everything.com","utilidades.ecuadjsradiocorp.com","akihabarahitorigurasiseikatu.com","deletedspeedstreams.blogspot.com","freesoftpdfdownload.blogspot.com","games.games.newsgames.parade.com","insuranceloan.akbastiloantips.in","situsberita2terbaru.blogspot.com","such--maschine-de.translate.goog","uptodatefinishconferenceroom.com","games.charlottegames.cnhinews.com","loadsamusicsarchives.blogspot.com","pythonmatplotlibtips.blogspot.com","ragnarokscanlation.opchapters.com","tw.xn--h9jepie9n6a5394exeq51z.com","papagiovannipaoloii.altervista.org","softwareengineer-de.translate.goog","rojadirecta-tv-en-vivo.blogspot.com","thenightwithoutthedawn.blogspot.com","tenseishitaraslimedattaken-manga.com","wetter--vorhersage-de.translate.goog","marketing-business-revenus-internet.fr","hardware--entwicklung-de.translate.goog","0x7jwsog5coxn1e0mk2phcaurtrmbxfpouuz.fun","279kzq8a4lqa0ddt7sfp825b0epdl922oqu6.fun","2g8rktp1fn9feqlhxexsw8o4snafapdh9dn1.fun","5rr03ujky5me3sjzvfosr6p89hk6wd34qamf.fun","jmtv4zqntu5oyprw4seqtn0dmjulf9nebif0.fun","xn--n8jwbyc5ezgnfpeyd3i0a3ow693bw65a.com","sharpen-free-design-generator.netlify.app","a-b-c-d-e-f7011d0w3j3aor0dczs5ctoo2zpz1t6bm5f49.fun","a-b-c-d-e-f9jeats0w5hf22jbbxcrpnq37qq6nbxjwypsy.fun","a-b-c-d-e-fla3m19lerkfex1z9kdr5pd4hx0338uwsvbjx.fun","a-b-f2muvhnjw63ruyhoxhhrd61eszezz6jdj4jy1-b-d-t-s.fun","a-b-f7mh86v4lirbwg7m4qiwwlk2e4za9uyngqy1u-b-d-t-s.fun","a-b-fjkt8v1pxgzrc3lqoaz8fh7pjgygf4zh3eqhl-b-d-t-s.fun","a-b-fnv7h0323ap2wfqj1ruyo8id2bcuoq4kufzon-b-d-t-s.fun","a-b-fqmze5gr05g3y4azx9adr9bd2eow7xoqwbuxg-b-d-t-s.fun","ulike-filter-sowe-canplay-rightlets-generate-themrandomlyl89u8.fun"];

const $scriptletFromRegexes$ = /* 8 */ ["-embed.c","^moon(?:-[a-z0-9]+)?-embed\\.com$","70,71","moonfile","^moonfile-[a-z0-9-]+\\.com$","70,71",".","^[0-9a-z]{5,8}\\.(art|cfd|fun|icu|info|live|pro|sbs|world)$","70,71","-mkay.co","^moo-[a-z0-9]+(-[a-z0-9]+)*-mkay\\.com$","70,71","file-","^file-[a-z0-9]+(-[a-z0-9]+)*-(moon|embed)\\.com$","70,71","-moo.com","^fle-[a-z0-9]+(-[a-z0-9]+)*-moo\\.com$","70,71","filemoon","^filemoon-[a-z0-9]+(?:-[a-z0-9]+)*\\.(?:com|xyz)$","70,71","tamilpri","(\\d{0,1})?tamilprint(\\d{1,2})?\\.[a-z]{3,7}","115,1543,2395"];

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
