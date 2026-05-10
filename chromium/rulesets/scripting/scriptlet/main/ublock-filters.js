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
[trustedJsonEditXhrRequest,adjustSetTimeout,jsonPruneFetchResponse,jsonPruneXhrResponse,trustedReplaceXhrResponse,trustedReplaceFetchResponse,trustedPreventDomBypass,jsonPrune,jsonEdit,setConstant,jsonlEditXhrResponse,noWindowOpenIf,abortCurrentScript,trustedSuppressNativeMethod,abortOnStackTrace,preventRequestAnimationFrame,preventInnerHTML,trustedSetConstant,trustedReplaceOutboundText,trustedReplaceArgument,preventXhr,preventSetTimeout,preventFetch,removeAttr,trustedOverrideElementMethod,preventAddEventListener,abortOnPropertyRead,adjustSetInterval,preventSetInterval,abortOnPropertyWrite,noWebrtc,noEvalIf,trustedPreventFetch,disableNewtabLinks,trustedJsonEditFetchResponse,trustedJsonEdit,trustedJsonEditXhrResponse,jsonEditXhrResponse,xmlPrune,m3uPrune,jsonEditFetchResponse,trustedPreventXhr,trustedEditInboundObject,spoofCSS,alertBuster,preventCanvas,jsonEditFetchRequest];

const $scriptletArgs$ = /* 3210 */ ["[?..userAgent*=\"channel\"]..client[?.clientName==\"WEB\"]+={\"clientScreen\":\"CHANNEL\"}","propsToMatch","/player?","[?..userAgent=/adunit|channel|lactmilli|instream|eafg/]..referer=repl({\"regex\":\"$\",\"replacement\":\"#reloadxhr\"})","[native code]","17000","0.001","adPlacements adSlots playerResponse.adPlacements playerResponse.adSlots [].playerResponse.adPlacements [].playerResponse.adSlots","","adPlacements adSlots playerResponse.adPlacements playerResponse.adSlots","/playlist?","/\\/player(?:\\?.+)?$/","\"adPlacements\"","\"no_ads\"","/playlist\\?list=|\\/player(?:\\?.+)?$|watch\\?[tv]=/","/\"adPlacements.*?([A-Z]\"\\}|\"\\}{2,4})\\}\\],/","/\"adPlacements.*?(\"adSlots\"|\"adBreakHeartbeatParams\")/gms","$1","player?","\"adSlots\"","/^\\W+$/","Node.prototype.appendChild","fetch","Request","JSON.parse","entries.[-].command.reelWatchEndpoint.adClientParams.isAd","/get_watch?","require.0.3.0.__bbox.require.[].3.1.__bbox.result.data.viewer.sideFeedUnit.nodes.[].new_adverts.nodes.[-].sponsored_data","data.viewer.sideFeedUnit.nodes.[].new_adverts.nodes.[-].sponsored_data","/graphql","..data.viewer..nodes.*[?.__typename==\"AdsSideFeedUnit\"]","Env.nxghljssj","false","require.0.3.0.__bbox.require.[].3.1.__bbox.result.data.serpResponse.results.edges.[-].rendering_strategy.view_model.story.sponsored_data.ad_id","..node[?.*.__typename==\"SponsoredData\"]",".data[?.category==\"SPONSORED\"].node",".data.viewer.news_feed.edges.*[?.category==\"SPONSORED\"].node","console.clear","undefined","globalThis","break;case","WebAssembly","atob","Array.from","\"/NodeList/\"","prevent","inlineScript","Document.prototype.querySelectorAll","\"/^\\[d[a-z]t[a-z]?-[0-9a-z]{2,4}\\]$/\"","HTMLElement.prototype.querySelectorAll","\"/.*\\[[^imns].+\\].*/\"","Element.prototype.hasAttribute","\"/[\\S\\s]+/\"","Document.prototype.evaluate","\"/.*/\"","Document.prototype.createTreeWalker","aclib","/stackDepth:3\\s+get injectedScript.+inlineScript/","setTimeout","/stackDepth:3.+inlineScript:\\d{4}:1/","Date","MessageChannel","/stackDepth:2.+inlineScript/","/\\.(gif|jpe?g|png|webp)/","requestAnimationFrame","Array.prototype.join","/^[\\S\\s]{2000,6000}$/","DOMTokenList.prototype.remove","/^[\\S\\s]{3000,4000}$/","/cssText'|:'style'/","Promise.resolve","/jso\\$|\\(_0x|(['\"`]\\s*[-0-9A-Z_a-z]+\\s*['\"`],\\s*){50,}|ByDZ/","json:{\"isShowingPop\":false}","aclib.runInterstitial","{}","as","function","Function.prototype.toString","( ) => value","runInterstitial(e){if(this.#fe.interstitial)return void this.#r.error(\"interstitial zone already loaded on page\");this.#fe.interstitial=!0;const{zoneId:t,sub1:r,isAutoTag:n,collectiveZoneId:i,linkedZoneId:o,aggressivity:s,recordPageView:a,abTest:c,tagVersionSuffix:u}=e;if(!t)throw new Error(\"mandatory zoneId is not provided!\");if(!we(t))throw new Error(\"zoneId is not a string!\");this.#r.debug(\"loading interstitial on page\");const l={zoneId:t,sub1:r,isAutoTag:n,collectiveZoneId:i,linkedZoneId:o,aggressivity:s,recordPageView:a,abTest:c,tagVersionSuffix:u,adcashGlobalName:this.#xe,adserverDomain:this.#v,adblockSettings:this.#s,uniqueFingerprint:this.#C,isLoadedAsPartOfLibrary:!1};if(this.#pe.add(t),this.#Ce.Interstitial)return l.isLoadedAsPartOfLibrary=!0,void new this.#Ce.Interstitial(l);if(window.Interstitial)new Interstitial(l);else{const e=document.createElement(\"script\");e.type=\"text/javascript\",e.src=`${location.protocol}//${this.#he}/script/interstitial.js`,e.setAttribute(\"a-lib\",\"1\"),e.onload=()=>{new Interstitial(l)},e.onerror=()=>{this.#r.error(`failed loading ${e.src}`)},document.head.appendChild(e)}}","Element.prototype.getAttribute","0","json:\"class\"","condition","d-z","/vast.php?","/click\\.com|preroll|native_render\\.js|acscdn/","length:10001","]();}","500","162.252.214.4","true","c.adsco.re","adsco.re:2087","/^ [-\\d]/","Math.random","parseInt(localStorage['\\x","adBlockDetected","Math","localStorage['\\x","-load.com/script/","length:101",")](this,...","3000-6000","(new Error(","/fd/ls/lsp.aspx","document.getElementById","json:\"body\"","ad-detection-bait","document.querySelector","-id-","scriptBlocked","blocked","testUrls","[]",".offsetHeight>0","/^https:\\/\\/pagead2\\.googlesyndication\\.com\\/pagead\\/js\\/adsbygoogle\\.js\\?client=ca-pub-3497863494706299$/","data-instype","ins.adsbygoogle:has(> div#aswift_0_host)","stay","url:https://googleads.g.doubleclick.net/pagead/ads?client=ca-pub-3497863494706299 method:HEAD mode:no-cors","throttle","121","String.prototype.indexOf","json:\"/\"","/premium","HTMLIFrameElement.prototype.remove","iframe[src^=\"https://googleads.g.doubleclick.net/pagead/ads?client=ca-pub-3497863494706299\"]","adblock","4000-","++","g.doubleclick.net","length:100000","String.prototype.includes","/Copyright|doubleclick$/","favicon","length:252","Headers.prototype.get","/.+/","image/png.","/^text\\/plain;charset=UTF-8$/","json:\"content-type\"","cache-control","Headers.prototype.has","summerday","length:10","{\"type\":\"cors\"}","/offsetHeight|loaded/","HTMLScriptElement.prototype.onerror","pagead2.googlesyndication.com/pagead/js/adsbygoogle.js method:HEAD","emptyStr","Node.prototype.contains","{\"className\":\"adsbygoogle\"}","abort","load","showFallbackModal","Object.prototype.adsStrategy","json:{\"tag\":\"\",\"phase\":0,\"permaProvider\":0,\"tempoProvider\":0,\"buckets\":[],\"comment\":\"no-user\",\"rotationPaused\":true}","_adBlockState","Keen","stream.insertion","/video/auth/media","akamaiDisableServerIpLookup","noopFunc","MONETIZER101.init","/outboundLink/","v.fwmrm.net/ad/g/","war:noop-vmap1.xml","DD_RUM.addAction","nads.createAd","trueFunc","t++","dvtag.getTargeting","ga","class|style","div[id^=\"los40_gpt\"]","huecosPBS.nstdX","null","config.globalInteractions.[].bsData","googlesyndication","DTM.trackAsyncPV","_satellite","_satellite.getVisitorId","mobileanalytics","newPageViewSpeedtest","pubg.unload","generateGalleryAd","mediator","Object.prototype.subscribe","gbTracker","gbTracker.sendAutoSearchEvent","Object.prototype.vjsPlayer.ads","marmalade","setInterval","url:ipapi.co","doubleclick","isPeriodic","*","data-woman-ex","a[href][data-woman-ex]","data-trm-action|data-trm-category|data-trm-label",".trm_event","KeenTracking","network_user_id","cloudflare.com/cdn-cgi/trace","History","/(^(?!.*(Function|HTMLDocument).*))/","api","google.ima.OmidVerificationVendor","Object.prototype.omidAccessModeRules","googletag.cmd","skipAdSeconds","0.02","/recommendations.","_aps","/api/analytics","Object.prototype.setDisableFlashAds","DD_RUM.addTiming","chameleonVideo.adDisabledRequested","AdmostClient","analytics","native code","15000","(null)","5000","datalayer","Object.prototype.isInitialLoadDisabled","lr-ingest.io","listingGoogleEETracking","dcsMultiTrack","urlStrArray","pa","Object.prototype.setConfigurations","/gtm.js","JadIds","Object.prototype.bk_addPageCtx","Object.prototype.bk_doJSTag","passFingerPrint","optimizely","optimizely.initialized","google_optimize","google_optimize.get","_gsq","_gsq.push","_gsDevice","iom","iom.c","_conv_q","_conv_q.push","google.ima.settings.setDisableFlashAds","pa.privacy","populateClientData4RBA","YT.ImaManager","UOLPD","UOLPD.dataLayer","__configuredDFPTags","URL_VAST_YOUTUBE","Adman","dplus","dplus.track","_satellite.track","/EzoIvent|TDELAY/","google.ima.dai","/froloa.js","adv","gfkS2sExtension","gfkS2sExtension.HTML5VODExtension","click","/event_callback=function\\(\\){window\\.location=t\\.getAttribute\\(\"href\"\\)/","AnalyticsEventTrackingJS","AnalyticsEventTrackingJS.addToBasket","AnalyticsEventTrackingJS.trackErrorMessage","initializeslideshow","b()","3000","ads","fathom","fathom.trackGoal","Origami","Origami.fastclick","{\"value\": \".ad-placement-interstitial\"}",".easyAdsBox","jad","hasAdblocker","Sentry","Sentry.init","TRC","TRC._taboolaClone","fp","fp.t","fp.s","initializeNewRelic","turnerAnalyticsObj","turnerAnalyticsObj.setVideoObject4AnalyticsProperty","turnerAnalyticsObj.getVideoObject4AnalyticsProperty","optimizelyDatafile","optimizelyDatafile.featureFlags","fingerprint","fingerprint.getCookie","gform.utils","gform.utils.trigger","get_fingerprint","moatPrebidApi","moatPrebidApi.getMoatTargetingForPage","readyPromise","cpd_configdata","cpd_configdata.url","yieldlove_cmd","yieldlove_cmd.push","dataLayer.push","1.1.1.1/cdn-cgi/trace","_etmc","_etmc.push","freshpaint","freshpaint.track","ShowRewards","stLight","stLight.options","DD_RUM.addError","sensorsDataAnalytic201505","sensorsDataAnalytic201505.init","sensorsDataAnalytic201505.quick","sensorsDataAnalytic201505.track","s","s.tl","taboola timeout","clearInterval(run)","smartech","/TDELAY|EzoIvent/","sensors","sensors.init","/piwik-","2200","2300","sensors.track","googleFC","adn","adn.clearDivs","_vwo_code","live.streamtheworld.com/partnerIds","gtag","_taboola","_taboola.push","clicky","clicky.goal","WURFL","_sp_.config.events.onSPPMObjectReady","gtm","gtm.trackEvent","mParticle.Identity.getCurrentUser","_omapp.scripts.geolocation","{\"value\": {\"status\":\"loaded\",\"object\":null,\"data\":{\"country\":{\"shortName\":\"\",\"longName\":\"\"},\"administrative_area_level_1\":{\"shortName\":\"\",\"longName\":\"\"},\"administrative_area_level_2\":{\"shortName\":\"\",\"longName\":\"\"},\"locality\":{\"shortName\":\"\",\"longName\":\"\"},\"original\":{\"ip\":\"\",\"ip_decimal\":null,\"country\":\"\",\"country_eu\":false,\"country_iso\":\"\",\"city\":\"\",\"latitude\":null,\"longitude\":null,\"user_agent\":{\"product\":\"\",\"version\":\"\",\"comment\":\"\",\"raw_value\":\"\"},\"zip_code\":\"\",\"time_zone\":\"\"}},\"error\":\"\"}}","JSGlobals.prebidEnabled","i||(e(),i=!0)","2500","elasticApm","elasticApm.init","ga.sendGaEvent","adConfig","ads.viralize.tv","adobe","MT","MT.track","ClickOmniPartner","adex","adex.getAdexUser","Adkit","Object.prototype.shouldExpectGoogleCMP","apntag.refresh","pa.sendEvent","Munchkin","Munchkin.init","Event","ttd_dom_ready","ramp","appInfo.snowplow.trackSelfDescribingEvent","_vwo_code.init","adobePageView","adobeSearchBox","elements",".dropdown-menu a[href]","dapTracker","dapTracker.track","newrelic","newrelic.setCustomAttribute","adobeDataLayer","adobeDataLayer.push","Object.prototype._adsDisabled","Object.defineProperty","1","json:\"_adsEnabled\"","_adsDisabled","utag","utag.link","_satellite.kpCustomEvent","Object.prototype.disablecommercials","Object.prototype._autoPlayOnlyWithPrerollAd","Sentry.addBreadcrumb","freestar.newAdSlots","String.prototype.allReplace","executaGoogleAnalytics3","initJWPlayerMux","initJWPlayerMux.utils","initJWPlayerMux.utils.now","ambossAnalytics","ambossAnalytics.getUserAttribution","ytInitialPlayerResponse.playerAds","ytInitialPlayerResponse.adPlacements","ytInitialPlayerResponse.adSlots","playerResponse.adPlacements","playerResponse.adPlacements playerResponse.playerAds playerResponse.adSlots adPlacements playerAds adSlots important","reelWatchSequenceResponse.entries.[-].command.reelWatchEndpoint.adClientParams.isAd entries.[-].command.reelWatchEndpoint.adClientParams.isAd","url:/reel_watch_sequence?","Object","fireEvent","enabled","force_disabled","hard_block","header_menu_abvs","10000","adsbygoogle","nsShowMaxCount","toiads","objVc.interstitial_web","adb","navigator.userAgent","require.0.3.0.__bbox.require.[].3.1.__bbox.result.data.serpResponse.results.edges.[-].relay_rendering_strategy.view_model.story.sponsored_data.ad_id","/\\{\"node\":\\{\"role\":\"SEARCH_ADS\"[^\\n]+?cursor\":[^}]+\\}/g","/api/graphql","/\\{\"node\":\\{\"__typename\":\"MarketplaceFeedAdStory\"[^\\n]+?\"cursor\":(?:null|\"\\{[^\\n]+?\\}\"|[^\\n]+?MarketplaceSearchFeedStoriesEdge\")\\}/g","/\\{\"node\":\\{\"__typename\":\"VideoHomeFeedUnitSectionComponent\"[^\\n]+?\"sponsored_data\":\\{\"ad_id\"[^\\n]+?\"cursor\":null\\}/","require.0.3.0.__bbox.require.[].3.1.__bbox.result.data.node","require.0.3.0.__bbox.require.[].3.1.__bbox.result.data.node.story.sponsored_data.ad_id","require.0.3.0.__bbox.require.[].3.1.__bbox.result.data.marketplace_search.feed_units.edges.[-].node.story.sponsored_data.ad_id","require.0.3.0.__bbox.require.[].3.1.__bbox.result.data.viewer.marketplace_feed_stories.edges.[-].node.story.sponsored_data.ad_id","data.viewer.instream_video_ads data.scrubber","..node[?.__typename==\"MarketplaceFeedAdStory\"]","__eiPb","detector","_ml_ads_ns","jQuery","cookie","showAds","adBlockerDetected","show","SmartAdServerASMI","repl:/\"adBlockWallEnabled\":true/\"adBlockWallEnabled\":false/","adBlockWallEnabled","_sp_._networkListenerData","SZAdBlockDetection","_sp_.config","AntiAd.check","open","/^/","showNotice","_sp_","$","_sp_.mms.startMsg","retrievalService","admrlWpJsonP","yafaIt","LieDetector","ClickHandler","IsAdblockRequest","InfMediafireMobileFunc","1000","newcontent","ExoLoader.serve","Fingerprint2","request=adb","AdController","popupBlocked","/\\}\\s*\\(.*?\\b(self|this|window)\\b.*?\\)/","_0x","stop","onload","ga.length","btoa","adcashMacros","grecaptcha.ready","BACK","jwplayer.utils.Timer","puOverlay","adblock_added","admc","exoNoExternalUI38djdkjDDJsio96","String.prototype.charCodeAt","ai_","window.open","SBMGlobal.run.pcCallback","SBMGlobal.run.gramCallback","(!o)","(!i)","Object.prototype.hideAds","Object.prototype._getSalesHouseConfigurations","player-feedback","samInitDetection","decodeURI","decodeURIComponent","Date.prototype.toUTCString","Adcash","lobster","openLity","ad_abblock_ad","String.fromCharCode","shift","PopAds","AdBlocker","Adblock","addEventListener","displayMessage","runAdblock","document.createElement","TestAdBlock","ExoLoader","loadTool","cticodes","imgadbpops","document.write","redirect","4000","sadbl","adblockcheck","doSecondPop","arrvast","onclick","RunAds","/^(?:click|mousedown)$/","bypassEventsInProxies","jQuery.adblock","test-block","adi","ads_block","blockAdBlock","blurred","exoOpts","doOpen","prPuShown","flashvars.adv_pre_src","showPopunder","IS_ADBLOCK","page_params.holiday_promo","__NA","ads_priv","ab_detected","adsEnabled","document.dispatchEvent","t4PP","href|target","a[href=\"https://imgprime.com/view.php\"][target=\"_blank\"]","complete","String.prototype.charAt","sc_adv_out","mz","ad_blocker","AaDetector","_abb","puShown","/doOpen|popundr/","pURL","readyState","serve","stop()","Math.floor","AdBlockDetectorWorkaround","apstagLOADED","jQuery.hello","/Adb|moneyDetect/","isShowingAd","VikiPlayer.prototype.pingAbFactor","player.options.disableAds","__htapop","exopop","/^(?:load|click)$/","popMagic","script","atOptions","XMLHttpRequest","flashvars.adv_pre_vast","flashvars.adv_pre_vast_alt","x_width","getexoloader","disableDeveloper","oms.ads_detect","Blocco","2000","_site_ads_ns","hasAdBlock","pop","ltvModal","luxuretv.config","popns","pushiserve","creativeLoaded-","exoframe","/^load[A-Za-z]{12,}/","rollexzone","ALoader","Object.prototype.AdOverlay","tkn_popunder","detect","dlw","40000","ctt()","can_run_ads","test","adsBlockerDetector","NREUM","pop3","__ads","ready","popzone","FlixPop.isPopGloballyEnabled","falseFunc","/exo","ads.pop_url","checkAdblockUser","checkPub","6000","tabUnder","check_adblock","l.parentNode.insertBefore(s","_blank","ExoLoader.addZone","encodeURIComponent","isAdBlockActive","raConf","__ADX_URL_U","tabunder","RegExp","POSTBACK_PIXEL","mousedown","preventDefault","'0x","Aloader","advobj","replace","popTimes","addElementToBody","phantomPopunders","$.magnificPopup.open","adsenseadBlock","stagedPopUnder","seconds","clearInterval","CustomEvent","exoJsPop101","popjs.init","-0x","closeMyAd","smrtSP","adblockSuspected","nextFunction","250","xRds","cRAds","myTimer","1500","advertising","countdown","tiPopAction","rmVideoPlay","r3H4","disasterpingu","document.querySelectorAll","AdservingModule","backRedirect","adv_pre_duration","adv_post_duration","/^(click|mousedown|mousemove|touchstart|touchend|touchmove)/","system.popunder","ab1","ab2","hidekeep","pp12","__Y","App.views.adsView.adblock","document.createEvent","ShowAdbblock","style","clientHeight","flashvars.adv_pause_html","/^(?:click|mousedown|mousemove|touchstart|touchend|touchmove)$/","BOOTLOADER_LOADED","PerformanceLongTaskTiming","proxyLocation","Int32Array","$.fx.off","popMagic.init","/DOMContentLoaded|load/","y.readyState","document.getElementsByTagName","smrtSB","href","#opfk","byepopup","awm","location","adBlockEnabled","getCookie","history.go","dataPopUnder","/error|canplay/","(t)","EPeventFire","additional_src","300","____POP","openx","is_noadblock","window.location","()","hblocked","AdBlockUtil","css_class.show","/adbl/i","CANG","DOMContentLoaded","adlinkfly","updato-overlay","innerText","/amazon-adsystem|example\\.com/","document.cookie","|","attr","scriptSrc","SmartWallSDK","segs_pop","cxStartDetectionProcess","Abd_Detector","counter","paywallWrapper","isAdBlocked","/enthusiastgaming|googleoptimize|googletagmanager/","css_class","ez","path","*.adserverDomain","10","$getWin","/doubleclick|googlesyndication/","__NEXT_DATA__.props.clientConfigSettings.videoAds","blockAds","_ctrl_vt.blocked.ad_script","registerSlideshowAd","50","debugger","mm","shortener","require","/^(?!.*(einthusan\\.io|yahoo|rtnotif|ajax|quantcast|bugsnag))/","caca","getUrlParameter","trigger","Ok","given","getScriptFromCss","method:HEAD","safelink.adblock","goafricaSplashScreenAd","try","/adnxs.com|onetag-sys.com|teads.tv|google-analytics.com|rubiconproject.com|casalemedia.com/","openPopunder","0x","xhr.prototype.realSend","initializeCourier","userAgent","_0xbeb9","1800","popAdsClickCount","redirectPage","adblocker","ad_","azar","popunderSetup","https","popunder","preventExit","hilltop","jsPopunder","vglnk","aadblock","S9tt","popUpUrl","Notification","srcdoc","iframe","readCookieDelit","trafficjunky","checked","input#chkIsAdd","adSSetup","adblockerModal","750","html","capapubli","Aloader.serve","mouseup","sp_ad","app_vars.force_disable_adblock","adsHeight","onmousemove","button","yuidea-","adsBlocked","_sp_.msg.displayMessage","pop_under","location.href","_0x32d5","url","blur","CaptchmeState.adb","glxopen","adverts-top-container","disable","200","/googlesyndication|outbrain/","CekAab","timeLeft","testadblock","document.addEventListener","google_ad_client","UhasAB","adbackDebug","googletag","performance","rbm_block_active","adNotificationDetected","SubmitDownload1","show()","user=null","getIfc","!bergblock","overlayBtn","adBlockRunning","htaUrl","_pop","n.trigger","CnnXt.Event.fire","_ti_update_user","&nbsp","document.body.appendChild","BetterJsPop","/.?/","setExoCookie","adblockDetected","frg","abDetected","target","I833","urls","urls.0","Object.assign","KeepOpeningPops","bindall","ad_block","time","KillAdBlock","read_cookie","ReviveBannerInterstitial","eval","GNCA_Ad_Support","checkAdBlocker","midRoll","adBlocked","Date.now","AdBlock","iframeTestTimeMS","runInIframe","deployads","='\\x","Debugger","stackDepth:3","warning","100","_checkBait","[href*=\"ccbill\"]","close_screen","onerror","dismissAdBlock","VMG.Components.Adblock","adblock_popup","FuckAdBlock","isAdEnabled","promo","_0x311a","mockingbird","adblockDetector","crakPopInParams","console.log","hasPoped","Math.round","flashvars.protect_block","flashvars.video_click_url","h1mm.w3","banner","google_jobrunner","blocker_div","onscroll","keep-ads","#rbm_block_active","checkAdblock","checkAds","#DontBloxMyAdZ","#pageWrapper","adpbtest","initDetection","alert","check","isBlanketFound","showModal","myaabpfun","sec","_wm","adFilled","//","NativeAd","gadb","damoh.ani-stream.com","showPopup","mouseout","clientWidth","adrecover","checkadBlock","gandalfads","Tool","clientSide.adbDetect","HTMLAnchorElement.prototype.click","anchor.href","cmnnrunads","downloadJSAtOnload","run","ReactAds","phtData","adBlocker","StileApp.somecontrols.adBlockDetected","killAdBlock","innerHTML","google_tag_data","readyplayer","noAdBlock","autoRecov","adblockblock","popit","popstate","noPop","Ha","rid","[onclick^=\"window.open\"]","tick","spot","adsOk","adBlockChecker","_$","12345","flashvars.popunder_url","urlForPopup","isal","/innerHTML|AdBlock/","checkStopBlock","overlay","popad","!za.gl","document.hidden","adblockEnabled","ppu","adspot_top","is_adblocked","/offsetHeight|google|Global/","an_message","Adblocker","pogo.intermission.staticAdIntermissionPeriod","localStorage","timeoutChecker","t","my_pop","nombre_dominio",".height","!?safelink_redirect=","document.documentElement","break;case $.","time.html","block_detected","/^(?:mousedown|mouseup)$/","ckaduMobilePop","tieneAdblock","popundr","obj","ujsmediatags method:HEAD","adsAreBlocked","spr","document.oncontextmenu","document.onmousedown","document.onkeydown","compupaste","redirectURL","bait","!atomtt","TID","!/download\\/|link/","Math.pow","adsanity_ad_block_vars","pace","ai_adb","openInNewTab",".append","!!{});","runAdBlocker","setOCookie","document.getElementsByClassName","td_ad_background_click_link","initBCPopunder","flashvars.logo_url","flashvars.logo_text","nlf.custom.userCapabilities","displayCookieWallBanner","adblockinfo","JSON","pum-open","svonm","/\\/VisitorAPI\\.js|\\/AppMeasurement\\.js/","popjs","/adblock/i","count","LoadThisScript","showPremLite","closeBlockerModal","5","keydown","Popunder","ag_adBlockerDetected","document.head.appendChild","bait.css","Date.prototype.toGMTString","initPu","jsUnda","ABD","adBlockDetector.isEnabled","adtoniq","__esModule","break","myFunction_ads","areAdsDisplayed","gkAdsWerbung","pop_target","onLoadEvent","is_banner","$easyadvtblock","mfbDetect","!/^https:\\/\\/sendvid\\.com\\/[0-9a-z]+$/","Pub2a","block","console","send","ab_cl","V4ss","#clickfakeplayer","popunders","visibility","show_dfp_preroll","show_youtube_preroll","brave_load_popup","pageParams.dispAds","PrivateMode","scroll","document.bridCanRunAds","doads","pu","advads_passive_ads","tmohentai","pmc_admanager.show_interrupt_ads","ai_adb_overlay","AlobaidiDetectAdBlock","showMsgAb","Advertisement","type","input[value^=\"http\"]","wutimeBotPattern","adsbytrafficjunkycontext","abp1","$REACTBASE_STATE.serverModules.push","popup_ads","ipod","pr_okvalida","scriptwz_url","enlace","Popup","$.ajax","appendChild","Exoloader","offsetWidth","zomap.de","/$|adBlock/","adblockerpopup","adblockCheck","checkVPN","cancelAdBlocker","Promise","setNptTechAdblockerCookie","for-variations","!api?call=","cnbc.canShowAds","ExoSupport","/^(?:click|mousedown|mouseup)$/","di()","getElementById","loadRunative","value.media.ad_breaks","onAdVideoStart","zonefile","pwparams","fuckAdBlock","firefaucet","mark","stop-scrolling","detectAdBlock","Adv","blockUI","adsafeprotected","'\\'","oncontextmenu","Base64","disableItToContinue","google","parcelRequire","mdpDeBlocker","flashvars.adv_start_html","mobilePop","/_0x|debug/","my_inter_listen","EviPopunder","adver","tcpusher","preadvercb","document.readyState","prerollMain","popping","adsrefresh","/ai_adb|_0x/","canRunAds","mdp_deblocker","adBlock","bi()","#divDownload","modal","dclm_ajax_var.disclaimer_redirect_url","$ADP","load_pop_power","MG2Loader","/SplashScreen|BannerAd/","Connext","break;","checkTarget","i--","Time_Start","blocker","adUnits","afs_ads","b2a","data.[].vast_url","deleted","MutationObserver","ezstandalone.enabled","damoh","foundation.adPlayer.bitmovin","homad-global-configs","weltConfig.switches.videoAdBlockBlocker","XMLHttpRequest.prototype.open","svonm.com","/\"enabled\":\\s*true/","\"enabled\":false","adReinsertion","window.__gv_org_tfa","Object.prototype.adReinsertion","getHomadConfig","aud.springserve.com","<VAST version=\"3.0\"></VAST>","timeupdate","testhide","getComputedStyle","doOnce","popi","googlefc","angular","detected","{r()","450","ab","go_popup","Debug","offsetHeight","length","noBlocker","/youboranqs01|spotx|springserve/","js-btn-skip","r()","adblockActivated","penci_adlbock","Number.isNaN","fabActive","gWkbAdVert","noblock","wgAffiliateEnabled","!gdrivedownload","document.onclick","daCheckManager","prompt","data-popunder-url","saveLastEvent","friendlyduck",".post.movies","purple_box","detectAdblock","adblockDetect","adsLoadable","allclick_Public","a#clickfakeplayer",".fake_player > [href][target]",".link","'\\x","initAdserver","splashpage.init","window[_0x","checkSiteNormalLoad","/blob|injectedScript/","ASSetCookieAds","___tp","STREAM_CONFIGS",".clickbutton","Detected","XF","hide","mdp",".test","backgroundBanner","interstitial","letShowAds","antiblock","ulp_noadb",".show","url:!luscious.net","Object.prototype.adblock_detected","afterOpen","AffiliateAdBlock",".appendChild","adsbygoogle.loaded","ads_unblocked","xxSetting.adBlockerDetection","ppload","RegAdBlocking","a.adm","checkABlockP","Drupal.behaviors.adBlockerPopup","ADBLOCK","fake_ad","samOverlay","!refine?search","native","koddostu_com_adblock_yok","player.ads.cuePoints","adthrive","!t.me","bADBlock","better_ads_adblock","tie","Adv_ab","ignore_adblock","$.prototype.offset","ea.add","ad_pods.0.ads.0.segments.0.media ad_pods.1.ads.1.segments.1.media ad_pods.2.ads.2.segments.2.media ad_pods.3.ads.3.segments.3.media ad_pods.4.ads.4.segments.4.media ad_pods.5.ads.5.segments.5.media ad_pods.6.ads.6.segments.6.media ad_pods.7.ads.7.segments.7.media ad_pods.8.ads.8.segments.8.media","mouseleave","NativeDisplayAdID","t()","zendplace","mouseover","event.triggered","_cpp","sgpbCanRunAds","pareAdblock","ppcnt","data-ppcnt_ads","main[onclick]","Blocker","AdBDetected","navigator.brave","document.activeElement","{ \"value\": {\"tagName\": \"IFRAME\" }}","runAt","2","clickCount","body","hasFocus","{\"value\": \"Mozilla/5.0 (iPhone14,3; U; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/602.1.50 (KHTML, like Gecko) Version/10.0 Mobile/19A346 Safari/602.1\"}","timeSec","getlink","/wpsafe|wait/","timer","/getElementById|gotoo/","/visibilitychange|blur/","stopCountdown","ppuQnty","web_share_ads_adsterra_config wap_short_link_middle_page_ad wap_short_link_middle_page_show_time data.ads_cpm_info","value","Object.prototype.isAllAdClose","DOMNodeRemoved","data.meta.require_addon data.meta.require_captcha data.meta.require_notifications data.meta.require_og_ads data.meta.require_video data.meta.require_web data.meta.require_related_topics data.meta.require_custom_ad_step data.meta.og_ads_offers data.meta.addon_url data.displayAds data.linkCustomAdOffers","data.getDetailPageContent.linkCustomAdOffers.[-].title","data.getTaboolaAds.*","/chp_?ad/","/adblock|isRequestPresent/","bmcdn6","window.onload","devtools","documentElement.innerHTML","{\"type\": \"opaque\"}","document.hasFocus","/adoto|\\/ads\\/js/","htmls","?key=","isRequestPresent","xmlhttp","data-ppcnt_ads|onclick","#main","#main[onclick*=\"mainClick\"]",".btn-success.get-link","fouty","disabled",".btn-primary","focusOut","googletagmanager","suaads","/window\\.location\\.href|n/","8000","json:\"drall_Suaads_annersads_JS__randomAds\"","/randomAds|div-gpt-ad|divAdsInit/","json:\"ADs-1\"","json:\"click\"","visibilitychange","window.addEventListener","/visibilitychange|blur|pageshow|keydown|beforeunload|pagehide/","/\\$\\('|ai-close/","app_vars.please_disable_adblock","bypass",".MyAd > a[target=\"_blank\"]","antiAdBlockerHandler","onScriptError","php","div_form","private","navigator.webkitTemporaryStorage.queryUsageAndQuota","contextmenu","remainingSeconds","0.1","Math.random() <= 0.15","checkBrowser","bypass_url","1600","class","#rtg-snp21","adsby","showadas","submit","validateForm","throwFunc","/pagead2\\.googlesyndication\\.com|inklinkor\\.com/","EventTarget.prototype.addEventListener","delete window","/countdown--|getElementById/","SMart1","/outbrain\\.com|adligature\\.com|quantserve\\.com|srvtrck\\.com|googlesyndication/","{\"type\": \"cors\"}","doTest","checkAdsBlocked",".btn","http","3","document.visibilityState","hidden","1e3*","/veepteero|tag\\.min\\.js/","aSl.gcd","/\\/4.+ _0/","chp_ad","document.documentElement.lang.toLowerCase","[onclick^=\"pop\"]","Light.Popup","maxclick","#get-link-button","Swal.fire","surfe.pro","czilladx","adsbygoogle.js","!devuploads.com","war:googlesyndication_adsbygoogle.js","window.adLink","localStorage._d","blank","google_srt","json:0.61234","vizier","checkAdBlock","shouldOpenPopUp","displayAdBlockerMessage","pastepc","detectedAdblock","pagead2.googlesyndication.com/pagead/js/adsbygoogle.js","googletagservices","isTabActive","a[target=\"_blank\"]","[href*=\"survey\"]","adForm","/adsbygoogle|googletagservices/","clicked","decodeURIComponent(escape","clicksCount",".data.isAdsEnabled=false","/api/files","document.createTreeWalker","json:{\"acceptNode\": \"function() { return NodeFilter.FILTER_REJECT; }\"}","..directLink","..props[?.children*=\"clicksCount\"].children","adskeeper",".downloadbtn","zigi_tag_id","(function(","setCookie","advertisement3","start","!/(flashbang\\.sh|dl\\.buzzheavier\\.com)/","!dl.buzzheavier.com","AdLink","!buzzheavier.com","removeChild","notifyExec","fairAdblock","data.value data.redirectUrl data.bannerUrl","/admin/settings","!gcloud","/seconds--|timeLeft--/","json:\"main\"","/div-gpt-ad-dgking|\\.GoogleActiveViewElement/","/div-gpt-ad-|\\.adsbygoogle/","json:\"container\"","adblock_detected","/pub\\.clickadu|bing\\.com/","a","\"/chp_?ad/\"","/blocked|null|return/","remaining--","secondsLeft","script[data-domain=","document.body.appendChild(s)","push",".call(null)","ov.advertising.tisoomi.loadScript","abp","userHasAdblocker","embedAddefend","/injectedScript.*inlineScript/","/(?=.*onerror)(?=^(?!.*(https)))/","/injectedScript|blob/","hommy.mutation.mutation","hommy","hommy.waitUntil","ACtMan","video.channel","/(www\\.[a-z]{8,16}\\.com|cloudfront\\.net)\\/.+\\.(css|js)$/","/popundersPerIP[\\s\\S]*?Date[\\s\\S]*?getElementsByTagName[\\s\\S]*?insertBefore/","clearTimeout","/www|cloudfront/","shouldShow","matchMedia","target.appendChild(s","l.appendChild(s)","document.body.appendChild(s","no-referrer-when-downgrade","/^data:/","Document.prototype.createElement","\"script\"","litespeed/js","appendTo:","myEl","ExoDetector","!embedy","Pub2","/loadMomoVip|loadExo|includeSpecial/","loadNeverBlock","flashvars.mlogo","adver.abFucker.serve","displayCache","vpPrerollVideo","SpecialUp","zfgloaded","parseInt","/btoa|break/","/\\st\\.[a-zA-Z]*\\s/","navigator","/(?=^(?!.*(https)))/","key in document","zfgformats","zfgstorage","zfgloadedpopup","/\\st\\.[a-zA-Z]*\\sinlineScript/","zfgcodeloaded","outbrain","/inlineScript|stackDepth:1/","wpadmngr.com","adserverDomain",".js?_=","FingerprintJS","/https|stackDepth:3/","HTMLAllCollection","shown_at","!/d/","PlayerConfig.config.CustomAdSetting","affiliate","_createCatchAllDiv","/click|mouse/","document","PlayerConfig.trusted","PlayerConfig.config.AffiliateAdViewLevel","univresalP","puTSstrpcht","!/prcf.fiyar|themes|pixsense|.jpg/","hold_click","focus","js_func_decode_base_64","decodeURIComponent(atob","/(?=^(?!.*(https|injectedScript)))/","jQuery.popunder","AdDetect","ai_front","abDetectorPro","/googlesyndication|doubleclick/","src=atob","Document.prototype.querySelector","\"/[0-9a-f]+-modal/\"","/\\/[0-9a-f]+\\.js\\?ver=/","tie.ad_blocker_detector","admiral","..admiralScriptCode",".props[?.id==\"admiral-bootstrap\"].dangerouslySetInnerHTML","decodeURI(decodeURI","dc.adfree","error","gnt.x.uam","interactive","g$.hp","json:{\"gnt-d-adm\":true,\"gnt-d-bt\":true}","gnt.u.z","__INITIAL_DATA__.siteData.admiralScript",".cmd.unshift","/admiral/","runtimeConfig.AM_PATH","CACHE","..props[?.id==\"admiral-initializer\"].children","..props.children.*[?.key==\"admiral-script\"]","..props.config.ad.enabled=false","..Admiral.isEnabled=false","..admiral=false","/ad\\.doubleclick\\.net|static\\.dable\\.io/","error-report.com","loader.min.js","content-loader.com","HTMLScriptElement.prototype.setAttribute","/error-report|new Promise|;await new|:\\[?window|&&window,|void 0\\]|location\\.href|void 0\\|\\|window/","loadShield","objAd.loadAdShield","window.myAd.runAd","RT-1562-AdShield-script-on-Huffpost","{\"value\": \"(function(){let link=document.createElement('link');link.rel='stylesheet';link.href='//image.ygosu.com/style/main.css';document.head.appendChild(link)})()\"}","error-report","{\"value\": \"(function(){let link=document.createElement('link');link.rel='stylesheet';link.href='https://loawa.com/assets/css/loawa.min.css';document.head.appendChild(link)})()\"}","/07c225f3\\.online|content-loader\\.com|css-load\\.com|html-load\\.com/","html-load.com","repl:/\"$//","script[id][onerror]","asap stay","json:\"setTimeout((()=>{if(!location.pathname.startsWith('/game'))return;const t=document.getElementById('question-label');t&&(window.animation=lottie.loadAnimation({container:t,renderer:'svg',loop:!0,autoplay:!1,path:'/assets/animationsLottielab/gameDots.json'}))}),1e3);\"","__cfRLUnblockHandlers","disableAdShield","json:\"freestar-bootstrap\"","/^[A-Z][a-z]+_$/","\"data-sdk\"","abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789+/=","features.ad02 features.adshield","AHE.is_member","USER.features.ad_shield","AppBootstrapData.config.adshieldAdblockRecovery","AppBootstrapData.config.adshieldNativeAdRecovery","AppBootstrapData.__initializeFeatures__.adshieldAdblockRecovery.enabled","AppState.reduxState.features.adshieldAdblockRecovery","..adshieldAdblockRecovery=false","/fetchappbootstrapdata","..adshieldAdblockRecovery.enabled=false","__NEXT_DATA__.runtimeConfig.enableShieldScript","Object.prototype._adShieldLoaded","HTMLScriptElement.prototype.onload","..AdShield.isEnabled=false","String.prototype.match","__adblocker","__INITIAL_STATE__.config.theme.ads.isAdBlockerEnabled","generalTimeLeft","__INITIAL_STATE__.gameLists.gamesNoPrerollIds.indexOf","__aaZoneid","DoodPop",".check=false","#over","document.ontouchend","Array.prototype.shift","/^.+$/s","HTMLElement.prototype.click","premium","'1'","playID","openNewTab","download-wrapper","MDCore.adblock","Please wait","#downloadvideo","ads playerAds","pop_init","adsbyjuicy","np.detect","length:40000-60000","mode:no-cors","prerolls midrolls postrolls comm_ad house_ad pause_ad block_ad end_ad exit_ad pin_ad content_pool vertical_ad elements","/detail","adClosedTimestamp","data.item.[-].business_info.ad_desc","/feed/rcmd","killads","NMAFMediaPlayerController.vastManager.vastShown","api/v1/detail","reklama-flash-body","fakeAd","adUrl",".azurewebsites.net","assets.preroll assets.prerollDebug","/stream-link","/doubleclick|ad-delivery|googlesyndication/","__NEXT_DATA__.runtimeConfig._qub_sdk.qubConfig.video.adBlockerDetectorEnabled","data.[].relationships.advert data.[].relationships.vast","offers","/#EXT-X-DISCONTINUITY\\n(?:#EXTINF:.*,\\n.+?adType=preroll[\\s\\S]+?)(?=#EXT-X-DISCONTINUITY)/gm","/.*\\.m3u8/","tampilkanUrl","()=>{","2501-",".layers.*[?.metadata.name==\"POI_Ads\"]","/PCWeb_Real.json","/gaid=","war:noop-vast2.xml","consent","arePiratesOnBoard","__INIT_CONFIG__.randvar","instanceof Event","prebidConfig.steering.disableVideoAutoBid","xml","await _0x","json:\"Blog1\"","ad-top","adblock.js","adbl",".getComputedStyle","STORAGE2","app_advert","googletag._loaded_","closeBanner","NoTenia","breaks interstitials info","interstitials","xpath(//*[name()=\"Period\"][.//*[name()=\"BaseURL\" and contains(text(),\".mp.lura.live/prod/\")]] | //*[name()=\"MPD\"]/@mediaPresentationDuration)",".mpd","ads.policy.skipMode","/play","ad_slots","plugins.dfp","lura.live/prod/","/prog.m3u8","!embedtv.best",".offsetHeight","!asyaanimeleri.",".*[?.linkurl^=\"http\"]","initPop","app._data.ads","message","adsense","reklamlar","json:[{\"sure\":\"0\"}]","/api/video","Object.prototype.showInterstitialAd","skipAdblockCheck","/srvtrck|adligature|quantserve|outbrain/","createAgeModal","Object[_0x","adsPlayer","this","json:\"mozilla/5.0 (windows nt 10.0; win64; x64) applewebkit/537.36 (khtml, like gecko) chrome/145.0.0.0 safari/537.36\"","mozilla/5.0","popup=","()}",".art-control-fullscreen","pubAdsService","offsetLeft","config.pauseInspect","appContext.adManager.context.current.adFriendly","HTMLIFrameElement",".style","dsanity_ad_block_vars","show_download_links","downloadbtn","height","blockAdBlock._options.baitClass","/AdBlock/i","charAt","fadeIn","checkAD","latest!==","detectAdBlocker",".ready","/'shift'|break;/","document.blocked_var","____ads_js_blocked","wIsAdBlocked","WebSite.plsDisableAdBlock","css","videootv","ads_blocked","samDetected","Drupal.behaviors.agBlockAdBlock","NoAdBlock","mMCheckAgainBlock","countClicks","settings.adBlockerDetection","eabdModal","ab_root.show","gaData","wrapfabtest","fuckAdBlock._options.baitClass","$ado","/ado/i","app.js","popUnderStage","samAdBlockAction","googlebot","advert","bscheck.adblocker","qpcheck.ads","tmnramp","!sf-converter.com","clickAds.banner.urls","json:[{\"url\":{\"limit\":0,\"url\":\"\"}}]","ad","show_ads","ignielAdBlock","isContentBlocked","GetWindowHeight","/pop|wm|forceClick/","CloudflareApps.installs.Ik7rmQ4t95Qk.options.measureDomain","detectAB1",".init","ActiveXObject","uBlockOriginDetected","/_0x|localStorage\\.getItem/","google_ad_status","googletag._vars_","googletag._loadStarted_","google_unique_id","google.javascript","google.javascript.ads","google_global_correlator","ads.servers.[].apiAddress","paywallGateway.truncateContent","Constant","u_cfg","adBlockDisabled","__NEXT_DATA__.props.pageProps.adVideo","blockedElement","/ad","onpopstate","popState","adthrive.config","__C","ad-block-popup","exitTimer","innerHTML.replace","ajax","abu","countDown","HTMLElement.prototype.insertAdjacentHTML","_ads","eabpDialog","TotemToolsObject","puHref","flashvars.adv_postpause_vast","/Adblock|_ad_/","advads_passive_groups","GLX_GLOBAL_UUID_RESULT","Pop","f.parentNode.removeChild(f)","swal","keepChecking","t.pt","clickAnywhere urls","a[href*=\"/ads.php\"][target=\"_blank\"]","nitroAds","class.scroll","/showModal|isBlanketFound/","disableDeveloperTools","[onclick*=\"window.open\"]","openWindow","Check","checkCookieClick","readyToVote","12000","target|href","a[href^=\"//\"]","wpsite_clickable_data","insertBefore","offsetParent","meta.advertise","next","vidorev_jav_plugin_video_ads_object.vid_ads_m_video_ads","data.attributes.config.freewheel data.attributes.config.featureFlags.dPlayer","data.attributes.ssaiInfo.forecastTimeline data.attributes.ssaiInfo.vendorAttributes.nonLinearAds data.attributes.ssaiInfo.vendorAttributes.videoView data.attributes.ssaiInfo.vendorAttributes.breaks.[].ads.[].adMetadata data.attributes.ssaiInfo.vendorAttributes.breaks.[].ads.[].adParameters data.attributes.ssaiInfo.vendorAttributes.breaks.[].timeOffset","xpath(//*[name()=\"MPD\"][.//*[name()=\"BaseURL\" and contains(text(),'dash_clear_fmp4') and contains(text(),'/a/')]]/@mediaPresentationDuration | //*[name()=\"Period\"][./*[name()=\"BaseURL\" and contains(text(),'dash_clear_fmp4') and contains(text(),'/a/')]])","ssaiInfo","data.attributes.ssaiInfo","/videoPlaybackInfo","adsProvider.init","SDKLoaded","css_class.scroll","mnpwclone","0.3","7000","[href*=\"nihonjav\"]","/null|Error/","bannersRequest","vads","a[href][onclick^=\"getFullStory\"]","!newdmn","popUp","devtoolschange","rccbase_styles","POPUNDER_ENABLED","plugins.preroll","DHAntiAdBlocker","/out.php","ishop_codes","#advVid","location.replace","showada","showax","adp","__tnt","compatibility","popundrCheck","history.replaceState","rexxx.swp","constructor","p18","clickHandler","onbeforeunload","window.location.href","prebid","asc","json:{\"cmd\": [null], \"que\": [null], \"wrapperVersion\": \"6.19.0\", \"refreshQue\": {\"waitDelay\": 3000, \"que\": []}, \"isLoaded\": true, \"bidderSettings\": {}, \"libLoaded\": true, \"version\": \"v9.20.0\", \"installedModules\": [], \"adUnits\": [], \"aliasRegistry\": {}, \"medianetGlobals\": {}}","google_tag_manager","json:{ \"G-Z8CH48V654\": { \"_spx\": false, \"bootstrap\": 1704067200000, \"dataLayer\": { \"name\": \"dataLayer\" } }, \"SANDBOXED_JS_SEMAPHORE\": 0, \"dataLayer\": { \"gtmDom\": true, \"gtmLoad\": true, \"subscribers\": 1 }, \"sequence\": 1 }","ADBLOCKED","Object.prototype.adsEnabled","ai_run_scripts","clearInterval(i)","marginheight","ospen","pu_count","mypop","adblock_use","Object.prototype.adblockFound","download","1100","createCanvas","bizpanda","Q433","/pop|_blank/","movie.advertising.ad_server playlist.movie.advertising.ad_server","unblocker","playerAdSettings.adLink","playerAdSettings.waitTime","computed","manager","window.location.href=link","moonicorn.network","/dyn\\.ads|loadAdsDelayed/","xv.sda.pp.init","xv.conf.dyn.ads","onreadystatechange","skmedix.com","skmedix.pl","MediaContainer.Metadata.[].Ad","doubleclick.com","opaque","_init","href|target|data-ipshover-target|data-ipshover|data-autolink|rel","a[href^=\"https://thumpertalk.com/link/click/\"][target=\"_blank\"]","/touchstart|mousedown|click/","latest","secs","event.simulate","isAdsLoaded","adblockerAlert","/^https?:\\/\\/redirector\\.googlevideo\\.com.*/","/.*m3u8/","cuepoints","cuepoints.[].start cuepoints.[].end cuepoints.[].start_float cuepoints.[].end_float","Period[id*=\"-roll-\"][id*=\"-ad-\"]","pubads.g.doubleclick.net/ondemand","/ads/banner","reachGoal","Element.prototype.attachShadow","Adb","randStr","SPHMoverlay","ai","timer.remove","popupBlocker","afScript","Object.prototype.parseXML","Object.prototype.blackscreenDuration","Object.prototype.adPlayerId","/ads",":visible","mMcreateCookie","downloadButton","SmartPopunder.make","readystatechange","document.removeEventListener",".button[href^=\"javascript\"]","animation","status","adsblock","pub.network","timePassed","timeleft","input[id=\"button1\"][class=\"btn btn-primary\"][disabled]","t(a)",".fadeIn()","result","evolokParams.adblock","[src*=\"SPOT\"]",".pageProps.__APOLLO_STATE__.*[?.__typename==\"AotSidebar\"]","/_next/data","pageProps.__TEMPLATE_QUERY_DATA__.aotFooterWidgets","props.pageProps.data.aotHomepageTopBar props.pageProps.data.aotHomepageTopBar props.pageProps.data.aotHeaderAdScripts props.pageProps.data.aotFooterWidgets","counter--","daadb","l-1","_htas","magnificPopup","skipOptions","method:HEAD url:doubleclick.net","xpath(//*[name()=\"Period\"][.//*[name()=\"BaseURL\" and contains(text(),\"https:\")]])","style.display","tvid.in/log","1150","0.5","testadtags ad","document.referrer","quadsOptions","history.pushState","loadjscssfile","load_ads","/debugger|offsetParent/","/ads|imasdk/","6","__NEXT_DATA__.props.pageProps.adsConfig","make_rand_div","new_config.timedown","catch","google_ad","response.timeline.elements.[-].advertiserId","url:/api/v2/tabs/for_you","timercounter","document.location","innerHeight","cainPopUp","#timer","!bowfile.com","cloudfront.net/?","href|target|data-onclick","a[id=\"dl\"][data-onclick^=\"window.open\"]","a.getAttribute(\"data-ad-client\")||\"\"","truex","truex.client","answers","!display","/nerveheels/","No","foreverJQ","/document.createElement|stackDepth:2/","container.innerHTML","top-right","hiddenProxyDetected","SteadyWidgetSettings.adblockActive","temp","inhumanity_pop_var_name","url:googlesyndication","enforceAdStatus","hashchange","history.back","starPop","Element.prototype.matches","litespeed","__PoSettings","HTMLSelectElement","youtube","aTagChange","Object.prototype.ads","display","a[onclick^=\"setTimeout\"]","detectBlockAds","eb","/analytics|livestats/","/nextFunction|2000/","resource_response.data.[-].pin_promotion_id resource_response.data.results.[-].pin_promotion_id","initialReduxState.pins.{-}.pin_promotion_id initialReduxState.resources.UserHomefeedResource.*.data.[-].pin_promotion_id","player","mahimeta","__htas","chp_adblock_browser","/adb/i","tdBlock",".t-out-span [href*=\"utm_source\"]","src",".t-out-span [src*=\".gif\"]","notifier","penciBlocksArray",".panel-body > .text-center > button","modal-window","isScrexed","fallbackAds","popurl","SF.adblock","() => n(t)","() => t()","startfrom","Math.imul","checkAdsStatus","wtg-ads","/ad-","void 0","/__ez|window.location.href/","D4zz","Object.prototype.ads.nopreroll_",").show()","/open.*_blank/","advanced_ads_ready","loadAdBlocker","HP_Scout.adBlocked","SD_IS_BLOCKING","isBlocking","adFreePopup","Object.prototype.isPremium","__BACKPLANE_API__.renderOptions.showAdBlock",".quiver-cam-player--ad-not-running.quiver-cam-player--free video","debug","Object.prototype.isNoAds","tv3Cmp.ConsentGiven","distance","site-access","chAdblock","/,ad\\n.+?(?=#UPLYNK-SEGMENT)/gm","/uplynk\\.com\\/.*?\\.m3u8/","remaining","/ads|doubleclick/","/Ads|adbl|offsetHeight/",".innerHTML","onmousedown",".ob-dynamic-rec-link","setupSkin","/app.js","dqst.pl","PvVideoSlider","_chjeuHenj","[].data.searchResults.listings.[-].targetingSegments","noConflict","preroll_helper.advs","/show|innerHTML/","create_ad","contador","Object.prototype.enableInterstitial","addAds","/show|document\\.createElement/","loadXMLDoc","register","MobileInGameGames","__osw","uniconsent.com","/coinzillatag|czilladx/","divWidth","Script_Manager","Script_Manager_Time","bullads","Msg","!download","/click|mousedown/","adjsData","AdService.info.abd","UABP","adBlockDetectionResult","popped","/xlirdr|hotplay\\-games|hyenadata/","document.body.insertAdjacentHTML","exo","tic","download_loading","detector_launch","pu_url","Click","afStorage","puShown1","onAdblockerDetected","htmlAds","second","lycos_ad","150","passthetest","checkBlock","/thaudray\\.com|putchumt\\.com/","popName","vlitag","asgPopScript","/(?=^(?!.*(jquery|turnstile|challenge-platform)))/","Object.prototype.loadCosplay","Object.prototype.loadImages","FMPoopS","/window\\['(?:\\\\x[0-9a-f]{2}){2}/","urls.length","importantFunc","console.warn","sam","current()","confirm","pandaAdviewValidate","showAdBlock","aaaaa-modal","/(?=^(?!.*(http)))/","()=>","$onet","adsRedirectPopups","canGetAds","method:/head/i","Array.prototype.includes","json:\"none\"","/brave-api|script-content|bait|real/","length:11000","goToURL","ad_blocker_active","init_welcome_ad","setinteracted",".MediaStep","data.xdt_injected_story_units.ad_media_items","dataLayer","document.body.contains","nothingCanStopMeShowThisMessage","window.focus","imasdk","TextEncoder.prototype.encode","!/^\\//","fakeElement","adEnable","adtech-brightline adtech-google-pal adtech-iab-om","/playbackInfo","fallback.ssaiInfo manifest.url","fallback.ssaiInfo","xpath(//*[name()=\"MPD\"]/@mediaPresentationDuration | //*[name()=\"Period\"]/@start | //*[name()=\"Period\"][not(.//*[name()=\"SegmentTimeline\"])][not(.//*[name()=\"ContentProtection\"])] | //*[name()=\"Period\"][./*[name()=\"BaseURL\"]][not(.//*[name()=\"ContentProtection\"])][not(.//*[name()=\"AdaptationSet\"][@contentType=\"text\"])])","/dash.mpd","xpath(//*[name()=\"MPD\"]/@mediaPresentationDuration | //*[name()=\"Period\"]/@start | //*[name()=\"Period\"][not(.//*[name()=\"SegmentTimeline\"])][not(.//*[name()=\"ContentProtection\"])] | //*[name()=\"Period\"][./*[name()=\"BaseURL\"]][not(.//*[name()=\"ContentProtection\"])])","/-vod-.+\\.mpd/","htmlSectionsEncoded","event.dispatch","adx","popupurls","displayAds","cls_report?","-0x1","childNodes","wbar","[href=\"/bestporn.html\"]","_adshrink.skiptime","gclid","event","!yt1d.com","button#getlink","button#gotolink","AbleToRunAds","PreRollAd.timeCounter","result.ads","tpc.googlesyndication.com","id","#div-gpt-ad-footer","#div-gpt-ad-pagebottom","#div-gpt-ad-relatedbottom-1","#div-gpt-ad-sidebottom","goog","document.body","abpblocked","p$00a","openAdsModal","paAddUnit","gloacmug.net","items.[-].potentialActions.0.object.impressionToken items.[-].hasPart.0.potentialActions.0.object.impressionToken","context.adsIncluded","refresh","adt","Array.prototype.indexOf","interactionCount","/cloudfront|thaudray\\.com/","test_adblock","vastEnabled","/adskeeper|cloudflare/","#gotolink","detectadsbocker","c325","two_worker_data_js.js","adobeModalTestABenabled","FEATURE_DISABLE_ADOBE_POPUP_BY_COUNTRY","questpassGuard","isAdBlockerEnabled","shortConfig","akadb","eazy_ad_unblocker","json:\"\"","unlock","dataset.zone","adswizz.com","document.onkeypress","adsSrc","sssp","emptyObj","[style*=\"background-image: url\"]","[href*=\"click?\"]","/freychang|passback|popunder|tag|banquetunarmedgrater/","google-analytics","myTestAd","/<VAST version.+VAST>/","<VAST version=\\\"4.0\\\"></VAST>","deezer.getAudiobreak","Ads","smartLoaded","..ads_audio=false","ShowAdBLockerNotice","ad_listener","!shrdsk","notify","AdB","push-allow-modal",".hide","(!0)","Delay","ima","Cookiebot","\"adsBlocked\"","stream.insertion.adSession stream.insertion.points stream.insertion stream.sources.*.insertion pods.0.ads","ads.metadata ads.document ads.dxc ads.live ads.vod","site-access-popup","*.tanya_video_ads","deblocker","data?","script.src","/#EXT-X-DISCONTINUITY.{1,100}#EXT-X-DISCONTINUITY/gm","mixed.m3u8","feature_flags.interstitial_ads_flag","feature_flags.interstitials_every_four_slides","?","downloadToken","waldoSlotIds","Uint8Array","redirectpage","13500","adblockstatus","adScriptLoaded","/adoto|googlesyndication/","props.sponsoredAlternative","ad-delivery","document.documentElement.lang","adSettings","banner_is_blocked","consoleLoaded?clearInterval","Object.keys","[?.context.bidRequestId].*","RegExp.prototype.test","json:\"wirtualnemedia\"","/^dobreprogramy$/","decodeURL","updateProgress","/salesPopup|mira-snackbar/","Object.prototype.adBlocked","DOMAssistant","rotator","adblock popup vast","detectImgLoad","killAdKiller","current-=1","/zefoy\\.com\\S+:3:1/","/getComputedStyle|bait/","AController_3","json:\"div\"","ins",".clientHeight","googleAd","/showModal|chooseAction|doAction|callbackAdsBlocked/","_shouldProcessLink","cpmecs","/adlink/i","[onclick]","noreferrer","[onload^=\"window.open\"]","dontask","aoAdBlockDetected","button[onclick^=\"window.open\"]","function(e)","touchstart","Brid.A9.prototype.backfillAdUnits","adlinkfly_url","siteAccessFlag","/adblocker|alert/","doubleclick.net/instream/ad_status.js","war:doubleclick_instream_ad_status.js","redURL","/children\\('ins'\\)|Adblock|adsbygoogle/","dct","slideShow.displayInterstitial","openPopup","Object.getPrototypeOf","plugins","ai_wait_for_jquery","pbjs","tOS2","ips","Error","/stackDepth:1\\s/","tryShowVideoAdAsync","chkADB","onDetected","detectAdblocker","document.ready","a[href*=\"torrentico.top/sim/go.php\"]","success.page.spaces.player.widget_wrappers.[].widget.data.intervention_data","VAST","{\"value\": \"Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Mobile/15E148 Safari/604.1\"}","navigator.standalone","navigator.platform","{\"value\": \"iPhone\"}","Storage.prototype.setItem","searchCount","empire.pop","empire.direct","empire.directHideAds","(!1)","pagead2.googlesyndication.com","empire.mediaData.advisorMovie","empire.mediaData.advisorSerie","fuckadb","[type=\"submit\"]","setTimer","auto_safelink","!abyss.to","daadb_get_data_fetch","penci_adlbock.ad_blocker_detector","siteAccessPopup","/adsbygoogle|adblock|innerHTML|setTimeout/","/innerHTML|_0x/","Object.prototype.adblockDetector","biteDisplay","blext","/[a-z]\\(!0\\)/","800","vidorev_jav_plugin_video_ads_object","vidorev_jav_plugin_video_ads_object_post","dai_iframe","popactive","/detectAdBlocker|window.open/","S_Popup","eazy_ad_unblocker_dialog_opener","rabLimit","-1","popUnder","/GoToURL|delay/","nudgeAdBlock","/googlesyndication|ads/","/Content/_AdBlock/AdBlockDetected.html","adBlckActive","AB.html","feedBack.showAffilaePromo","ShowAdvertising","a img:not([src=\"images/main_logo_inverted.png\"])","visible","a[href][target=\"_blank\"],[src^=\"//ad.a-ads.com/\"]","avails","amazonaws.com","ima3_dai","topaz.","FAVE.settings.ads.ssai.prod.clips.enabled","FAVE.settings.ads.ssai.prod.liveAuth.enabled","FAVE.settings.ads.ssai.prod.liveUnauth.enabled","ssaiInfo fallback.ssaiInfo","xpath(//*[name()=\"MPD\"]/@mediaPresentationDuration | //*[name()=\"Period\"]/@start | //*[name()=\"Period\"][.//*[name()=\"BaseURL\" and contains(text(),\".prd.media.\")]])","/sandbox/i","analytics.initialized","autoptimize","UserCustomPop","method:GET","data.reg","time-events","/#EXTINF:[^\\n]+\\nhttps:\\/\\/redirector\\.googlevideo\\.com[^\\n]+/gms","/\\/ondemand\\/.+\\.m3u8/","/redirector\\.googlevideo\\.com\\/videoplayback[\\s\\S]*?dclk_video_ads/",".m3u8","phxSiteConfig.gallery.ads.interstitialFrequency","loadpagecheck","popupAt","modal_blocker","art3m1sItemNames.affiliate-wrapper","\"\"","isOpened","playerResponse.adPlacements playerResponse.playerAds adPlacements playerAds","Array.prototype.find","affinity-qi","GeneratorAds","isAdBlockerActive","pop.doEvent","'shift'","bFired","scrollIncrement","di.app.WebplayerApp.Ads.Adblocks.app.AdBlockDetectApp.startWithParent","a#downloadbtn[onclick^=\"window.open\"]","alink","/ads|googletagmanager/","sharedController.adblockDetector",".redirect","sliding","a[onclick]","infoey","settings.adBlockDetectionEnabled","displayInterstitialAdConfig","response.ads","/api","unescape","checkAdBlockeraz","blockingAds","Yii2App.playbackTimeout","setC","popup","/atob|innerHTML/","/adScriptPath|MMDConfig/","xpath(//*[name()=\"MPD\"]/@mediaPresentationDuration | //*[name()=\"Period\"]/@start | //*[name()=\"Period\"][.//*[name()=\"BaseURL\" and contains(text(),'adease')]])","[media^=\"A_D/\"]","adease adeaseBlob vmap","adease","aab","ips.controller.register","plugins.adService","QiyiPlayerProphetData.a.data","wait","/adsbygoogle|doubleclick/","adBreaks.[].startingOffset adBreaks.[].adBreakDuration adBreaks.[].ads adBreaks.[].startTime adBreak adBreakLocations","/session.json","xpath(//*[name()=\"Period\"][not(contains(@id,\"subclip\"))] | //*[name()=\"MPD\"]/@mediaPresentationDuration | //*[name()=\"Period\"]/@start)","/\\/episode\\/.+?\\.mpd\\?/","session.showAds","toggleAdBlockInfo","cachebuster","config","OpenInNewTab_Over","/native|\\{n\\(\\)/","[style^=\"background\"]","[target^=\"_\"]","bodyElement.removeChild","aipAPItag.prerollSkipped","aipAPItag.setPreRollStatus","\"ads_disabled\":false","\"ads_disabled\":true","payments","reklam_1_saniye","reklam_1_gecsaniye","reklamsayisi","reklam_1","psresimler","data","runad","url:doubleclick.net","war:googletagservices_gpt.js","[target=\"_blank\"]","\"flashtalking\"","/(?=^(?!.*(cdn-cgi)))/","criteo","war:32x32.png","HTMLImageElement.prototype.onerror","data.home.home_timeline_urt.instructions.[].entries.[-].content.itemContent.promotedMetadata","url:/Home","data.search_by_raw_query.search_timeline.timeline.instructions.[].entries.[-].content.itemContent.promotedMetadata","url:/SearchTimeline","data.threaded_conversation_with_injections_v2.instructions.[].entries.[-].content.items.[].item.itemContent.promotedMetadata","url:/TweetDetail","data.user.result.timeline_v2.timeline.instructions.[].entries.[-].content.itemContent.promotedMetadata","url:/UserTweets","data.immersiveMedia.timeline.instructions.[].entries.[-].content.itemContent.promotedMetadata","url:/ImmersiveMedia","powerAPITag","rodo.checkIsDidomiConsent","protection","xtime","smartpop","EzoIvent","/doubleclick|googlesyndication|vlitag/","overlays","googleAdUrl","/googlesyndication|nitropay/","uBlockActive","/api/v1/events","Scribd.Blob.AdBlockerModal","AddAdsV2I.addBlock","xpath(//*[name()=\"Period\"][.//*[name()=\"BaseURL\" and contains(text(),'/ad/')]])","/Detect|adblock|style\\.display|\\[native code]|\\.call\\(null\\)/","/google_ad_client/","total","popCookie","/0x|sandCheck/","hasAdBlocker","ShouldShow","offset","startDownload","cloudfront","[href*=\"jump\"]","!direct","a0b","/outbrain|criteo|thisiswaldo|media\\.net|ohbayersbur|adligature|quantserve|srvtrck|\\.css|\\.js/","2000-5000","contrformpub","data.device.adsParams data.device.adSponsorshipTemplate","url:/appconfig","innerWidth","initials.yld-pdpopunder",".main-wrap","/googlesyndication|googima\\.js/","__brn_private_mode","download_click","Object.prototype.skipPreroll","/adskeeper|bidgear|googlesyndication|mgid/","fwmrm.net","/\\/ad\\/g\\/1/","adverts.breaks","result.responses.[].response.result.cards.[-].data.offers","ADB","downloadTimer","/ads|google/","injectedScript","/googlesyndication|googletagservices/","DisableDevtool","eClicked","number","sync","PlayerLogic.prototype.detectADB","ads-twitter.com","all","havenclick","VAST > Ad","/tserver","Object.prototype.prerollAds","secure.adnxs.com/ptv","war:noop-vast4.xml","notifyMe","alertmsg","/streams","adsClasses","gsecs","adtagparameter","dvsize","52","removeDLElements","/\\.append|\\.innerHTML|undefined|\\.css|blocker|flex|\\$\\('|obfuscatedMsg/","warn","adc","majorse","completed","testerli","showTrkURL","/popunder/i","readyWait","document.body.style.backgroundPosition","invoke","ssai_manifest ad_manifest playback_info.ad_info qvt.playback_info.ad_info","Object.prototype.setNeedShowAdblockWarning","load_banner","initializeChecks","HTMLDocument","video-popup","splashPage","adList","adsense-container","detect-modal","/_0x|dtaf/","ifmax","adRequest","nads","nitroAds.abp","adinplay.com","onloadUI","war:google-ima.js","/^data:text\\/javascript/","randomNumber","current.children","tmDetectAdBlocker","probeScript","PageLoader.DetectAb","!koyso.","adStatus","popUrl","one_time","PlaybackDetails.[].DaiVod","consentGiven","ad-block","data.searchClassifiedFeed.searchResultView.0.searchResultItemsV2.edges.[-].node.item.content.creative.clickThroughEvent.adsTrackingMetadata.metadata.adRequestId","data.me.personalizedFeed.feedItems.[-].promo.creative.clickThroughUrl.adsTrackingMetadata.metadata.adRequestId","data.me.rhrFeed.feedItems.[-].promo.creative.clickThroughUrl.adsTrackingMetadata.metadata.sponsor","mdpDeblocker","doubleclick.net","BN_CAMPAIGNS","media_place_list","...","/\\{[a-z]\\(!0\\)\\}/","canRedirect","/\\{[a-z]\\(e\\)\\}/","[].data.displayAdsV3.data.[-].__typename","[].data.TopAdsProducts.data.[-].__typename","[].data.topads.data.[-].__typename","/\\{\"id\":\\d{9,11}(?:(?!\"ads\":\\{\"id\":\"\").)+?\"ads\":\\{\"id\":\"\\d+\".+?\"__typename\":\"ProductCarouselV2\"\\},?/g","/graphql/InspirationCarousel","/\\{\"category_id\"(?:(?!\"ads\":\\{\"id\":\"\").)+?\"ads\":\\{\"id\":\"\\d+\".+?\"__typename\":\"ProductCarouselV2\"\\},?/g","/graphql/InspirationalCarousel","/\\{\"id\":\\d{9,11}(?:(?!\"isTopads\":false).)+?\"isTopads\":true.+?\"__typename\":\"recommendationItem\"\\},/g","/\\/graphql\\/productRecommendation/i","/,\\{\"id\":\\d{9,11}(?:(?!\"isTopads\":false).)+?\"isTopads\":true(?:(?!\"__typename\":\"recommendationItem\").)+?\"__typename\":\"recommendationItem\"\\}(?=\\])/","/\\{\"(?:productS|s)lashedPrice\"(?:(?!\"isTopads\":false).)+?\"isTopads\":true.+?\"__typename\":\"recommendationItem\"\\},?/g","/graphql/RecomWidget","/\\{\"appUrl\"(?:(?!\"isTopads\":false).)+?\"isTopads\":true.+?\"__typename\":\"recommendationItem\"\\},?/g","/graphql/ProductRecommendationQuery","adDetails","/secure?","data.search.products.[-].sponsored_ad.ad_source","url:/plp_search_v2?","GEMG.GPT.Interstitial","amiblock","String.prototype.concat","adBlockerDismissed","adBlockerDismissed_","karte3","18","callbackAdsBlocked","sandDetect",".ad-zone","showcfkModal","amodule.data","emptyArr","inner-ad","_ET","jssdks.mparticle.com","session.sessionAds session.sessionAdsRequired","/session","getComputedStyle(el)","/(?=^(?!.*(orchestrate|cloudflare)))/","Object.prototype.ADBLOCK_DETECTION",".features.*[?.slug==\"adblock-detection\"].enabled=false","/ad/","/count|verify|isCompleted/","postroll","itemList.[-].ad_info.ad_id","url:api/recommend/item_list/","/adinplay|googlesyndication/","!hidan.sh","ask","interceptClickEvent","isAdBlockDetected","pData.adblockOverlayEnabled","ad_block_detector","attached","div[class=\"share-embed-container\"]","/^\\w{11}[1-9]\\d+\\.ts/","cabdSettings","/outbrain|adligature|quantserve|adligature|srvtrck/","adsConfiguration","/vod",".streams.*.adUnits=[]","/manifest/video","/#EXTINF[^\\n]+\\n[^\\n]+?segment[^\\n]+/gms","layout.sections.mainContentCollection.components.[].data.productTiles.[-].sponsoredCreative.adGroupId","/search","fp-screen","puURL","!vidhidepre.com","[onclick*=\"_blank\"]","[onclick=\"goToURL();\"]","a[href][onclick^=\"window.open\"]","leaderboardAd","#leaderboardAd","placements.processingFile","dtGonza.playeradstime","\"-1\"","EV.Dab","ablk","shutterstock.com","Object.prototype.adUrl","sorts.[].recommendationList.[-].contentMetadata.EncryptedAdTrackingData","/ads|chp_?ad/","ads.[-].ad_id","wp-ad","/clarity|googlesyndication/","playerEnhancedConfig.run","/aff|jump/","!/mlbbox\\.me|_self/","aclib.runPop","ADS.isBannersEnabled","ADS.STATUS_ERROR","json:\"COMPLETE\"","button[onclick*=\"open\"]","getComputedStyle(testAd)","openPopupForChapter","Object.prototype.popupOpened","src_pop","gifs.[-].cta.link","boosted_gifs","adsbygoogle_ama_fc_has_run","doThePop","thanksgivingdelights","yes.onclick","!vidsrc.","popundersPerIP","createInvisibleTrigger","jwDefaults.advertising","elimina_profilazione","elimina_pubblicita","snigelweb.com","abd","pum_popups","checkerimg","uzivo","openDirectLinkAd","!nikaplayer.com",".adsbygoogle:not(.adsbygoogle-noablate)","json:\"img\"","playlist.movie.advertising.ad_server","PopUnder","data.[].affiliate_url","cdnpk.net/v2/images/search?","cdnpk.net/Rest/Media/","war:noop.json","data.[-].inner.ctaCopy","?page=","/gampad/ads?",".adv-",".length === 0",".length === 31","window.matchMedia('(display-mode: standalone)').matches","Object.prototype.DetectByGoogleAd","a[target=\"_blank\"][style]","/adsActive|POPUNDER/i","/Executed|modal/","[breakId*=\"Roll\"]","/content.vmap","/#EXT-X-KEY:METHOD=NONE\\n#EXT(?:INF:[^\\n]+|-X-DISCONTINUITY)\\n.+?(?=#EXT-X-KEY)/gms","/media.m3u8","window.navigator.brave","showTav","document['\\x","showADBOverlay","springserve.com","document.documentElement.clientWidth","outbrain.com","s4.cdnpc.net/front/css/style.min.css","slider--features","s4.cdnpc.net/vite-bundle/main.css","data-v-d23a26c8","cdn.taboola.com/libtrc/san1go-network/loader.js","feOffset","hasAdblock","taboola","adbEnableForPage","/adblock|isblock/i","/\\b[a-z] inlineScript:/","result.adverts","data.pinotPausedPlaybackPage","fundingchoicesmessages","isAdblock","button[id][onclick*=\".html\"]","dclk_video_ads","ads breaks cuepoints times","odabd","pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?ord=","b.google_reactive_tag_first","sbs.demdex.net/dest5.html?d_nsid=0&ord=","Demdex.canSetThirdPartyCookies","securepubads.g.doubleclick.net/pagead/ima_ppub_config?ippd=https%3A%2F%2Fwww.sbs.com.au%2Fondemand%2F&ord=","[\"4117\"]","configs.*.properties.componentConfigs.slideshowConfigs.*.interstitialNativeAds","url:/config","list.[].link.kicker","/content/v1/cms/api/amp/Document","properties.tiles.[-].isAd","/mestripewc/default/config","openPop","circle_animation","CountBack","990","/location\\.(replace|href)|stopAndExitFullscreen/","displayAdBlockedVideo","/undefined|displayAdBlockedVideo/","cns.library","json:\"#app-root\"","google_ads_iframe","data-id|data-p","[data-id],[data-p]","BJSShowUnder","BJSShowUnder.bindTo","BJSShowUnder.add","JSON.stringify","Object.prototype._parseVAST","Object.prototype.createAdBlocker","Object.prototype.isAdPeriod","breaks custom_breaks_data pause_ads video_metadata.end_credits_time","pause_ads","/playlist","breaks","breaks custom_breaks_data pause_ads","xpath(//*[name()=\"MPD\"]/@mediaPresentationDuration | //*[name()=\"Period\"][.//*[name()=\"BaseURL\" and contains(text(),\"/ads-\")]] | //*[name()=\"Period\"][starts-with(@id,\"ad\")] | //*[name()=\"Period\"][starts-with(@id,\"Ad\")] | //*[name()=\"Period\"]/@start)","MPD Period[id^=\"Ad\"i]","ABLK","_n_app.popunder","_n_app.options.ads.show_popunders","N_BetterJsPop.object","jwplayer.vast","Fingerprent2","test.remove","isAdb","/click|mouse|touch/","opopnso","c0ZZ","cuepointPlaylist vodPlaybackUrls.result.playbackUrls.cuepoints vodPlaylistedPlaybackUrls.result.playbackUrls.pauseBehavior vodPlaylistedPlaybackUrls.result.playbackUrls.pauseAdsResolution vodPlaylistedPlaybackUrls.result.playbackUrls.intraTitlePlaylist.[-].shouldShowOnScrubBar ads","xpath(//*[name()=\"Period\"][.//*[@value=\"Ad\"]] | /*[name()=\"MPD\"]/@mediaPresentationDuration | //*[name()=\"Period\"]/@start)","[value=\"Ad\"]","xpath(//*[name()=\"Period\"][.//*[@value=\"Draper\"]] | /*[name()=\"MPD\"]/@mediaPresentationDuration | //*[name()=\"Period\"]/@start)","[value=\"Draper\"]","xpath(//*[name()=\"Period\"][.//*[name()=\"BaseURL\" and contains(text(),\"/interstitial/\")]] | /*[name()=\"MPD\"][.//*[name()=\"BaseURL\" and contains(text(),\"/interstitial/\")]]/@mediaPresentationDuration | /*[name()=\"MPD\"][.//*[name()=\"BaseURL\" and contains(text(),\"/interstitial/\")]]/*[name()=\"Period\"]/@start)","ue_adb_chk","ad.doubleclick.net bid.g.doubleclick.net ggpht.com google.co.uk google.com googleads.g.doubleclick.net googleads4.g.doubleclick.net googleadservices.com googlesyndication.com googleusercontent.com gstatic.com gvt1.com prod.google.com pubads.g.doubleclick.net s0.2mdn.net static.doubleclick.net surveys.g.doubleclick.net youtube.com ytimg.com","lifeOnwer","jsc.mgid.com","movie.advertising",".mandatoryAdvertising=false","/player/configuration","vast_urls","cloudflareinsights","show_adverts","runCheck","adsSlotRenderEndSeen","DOMTokenList.prototype.add","\"-\"","removedNodes.forEach","__NEXT_DATA__.props.pageProps.broadcastData.remainingWatchDuration","json:9999999999","/\"remainingWatchDuration\":\\d+/","\"remainingWatchDuration\":9999999999","/stream","/\"midTierRemainingAdWatchCount\":\\d+,\"showAds\":(false|true)/","\"midTierRemainingAdWatchCount\":0,\"showAds\":false","a[href][onclick^=\"openit\"]","cdgPops","json:\"1\"","pubfuture","/doubleclick|google-analytics/","flashvars.mlogo_link","'script'","/ip-acl-all.php","URLlist","adBlockNotice","aaw","aaw.processAdsOnPage","displayLayer","adId","underpop","adBlockerModal","10000-15000","/adex|loadAds|adCollapsedCount|ad-?block/i","location.reload","/^function\\(\\).*requestIdleCallback.*/","/function\\([a-z]\\){[a-z]\\([a-z]\\)}/","OneTrust","OneTrust.IsAlertBoxClosed","FOXIZ_MAIN_SCRIPT.siteAccessDetector","120000","openAdBlockPopup","drama-online","zoneid","\"data-cfasync\"","Object.init","advanced_ads_check_adblocker","div[class=\"nav tabTop\"] + div > div:first-child > div:first-child > a:has(> img[src*=\"/\"][src*=\"_\"][alt]), #head + div[id] > div:last-child > div > a:has(> img[src*=\"/\"][src*=\"_\"][alt])","/(?=^(?!.*(_next)))/","[].props.slides.[-].adIndex","#ad_blocker_detector","adblockTrigger","20","Date.prototype.toISOString","insertAd","!/^\\/|_self|alexsports|nativesurge/","method:HEAD mode:no-cors","attestHasAdBlockerActivated","extInstalled","blockThisUrl","SaveFiles.add","detectSandbox","bait.remove","/rekaa","pop_tag","/HTMLDocument|blob/","=","/wp-content\\/uploads\\/[a-z]+\\/[a-z]+\\.js/","google-ca-pub-4459622307906677","wbDeadHinweis","()=>{var c=Kb","0.2","fired","popupInterval","adbon","*.aurl","/cs?id=","repl:/\\.mp4$/.mp3/",".mp4","-banner","PopURL","LCI.adBlockDetectorEnabled","!y2meta","ConsoleBan","disableDevtool","ondevtoolopen","onkeydown","window.history.back","close","lastPopupTime","button#download","mode:\"no-cors\"","!magnetdl.","googlesyndication.com","repl:/blank/self/","stoCazzo","_insertDirectAdLink","Visibility","importFAB","uas","ast","json:1","a[href][target=\"_blank\"]","url:ad/banner.gif","window.__CONFIGURATION__.adInsertion.enabled","window.__CONFIGURATION__.features.enableAdBlockerDetection","_carbonads","_bsa","redirectOnClick","widgets.outbrain.com","2d","/googletagmanager|ip-api/","&&",".ads={\"movie\":false,\"series\":false,\"episode\":false,\"comments\":false,\"preroll\":false}","/settings","()=>j(e=>e-1)","timeleftlink","handlePopup","bannerad sidebar ti_sidebar","moneyDetect","play","EFFECTIVE_APPS_GCB_BLOCKED_MESSAGE","sub","checkForAdBlocker","/navigator|location\\.href/","mode:cors","!self","/createElement|addEventListener|clientHeight/","uberad_mode","data.getFinalClickoutUrl data.sendSraBid",".php","!notunmovie","handleRedirect","testAd","imasdk.googleapis.com","/topaz/api","data.availableProductCount","results.[-].advertisement","/partners/home","__aab_init","show_videoad_limited","__NATIVEADS_CANARY__","[breakId]","_VMAP_","ad_slot_recs","/doc-page/recommenders",".smartAdsForAccessNoAds=true","/doc-page/afa","Object.prototype.adOnAdBlockPreventPlayback","pre_roll_url","post_roll_url",".result.PlayAds=false","/api/get-urls","/adsbygoogle|dispatchEvent/","OfferwallSessionTracker","player.preroll",".redirected","/;if\\(!\\(|=null/","promos","TNCMS.DMP","/pop?","=>",".metadata.hideAds=true","a2d.tv/play/","adblock_detect","link.click","document.body.style.overflow","fallback","!addons.mozilla.org","rot_url","/await|clientHeight/","Function","..adTimeout=0","/api/v","!/\\/download|\\/play|cdn\\.videy\\.co/","!_self","#fab","www/delivery","/\\/js/","/\\/4\\//","prads","/googlesyndication|doubleclick|adsterra/",".adsbygoogle","/googlesyndication\\.com|offsetHeight/","String.prototype.split","null,http","..searchResults.*[?.isAd==true]","..mainContentComponentsListProps.*[?.isAd==true]","/search/snippet?","googletag.enums","json:{\"OutOfPageFormat\":{\"REWARDED\":true}}","cmgpbjs","displayAdblockOverlay","start_full_screen_without_ad","drupalSettings.coolmath.hide_preroll_ads",".submit","pbjs.libLoaded","flashvars.adv_pre_url","/!/","()&&","Object.prototype.adBlockerPop","clkUnder","adsArr","onClick","..data.expectingAds=false","/profile","[href^=\"https://whulsaux.com\"]","adRendered","Object.prototype.clickAds.emit","!storiesig","openUp",".result.timeline.*[?.type==\"ad\"]","/livestitch","protectsubrev.com","dispatchEvent(window.catchdo)","En(e-1)","!adShown","/blocker|detected/","3200-","/window\\.location\\.href/","AdProvider","AdProvider.push","ads_","ad_blocker_detector","._$",".result.items.*[?.content*=\"'+'\"]","/comments","img[onerror]","..allowAdblock=true","[style*=\"z-index\"]","/initPops|popLite|popunder/","[?.type==\"ads\"].visibility.status=\"hidden\"","/^755$/","shouldRun","ad-ipd","smartclip","window.getComputedStyle","maddenwiped","/redirect.php?","*.*","/api/banners","checkBanners","/detect|bait/i","++;break;}}}}}","__adBlockState","__revCatchInitialized","ab.dt","json:\"header\"","/^[a-zA-Z]{15}$/","data.initPlaybackSession.adScenarios data.initPlaybackSession.adExperience.adExperienceTypes",".data.initPlaybackSession.adExperience.adsEnabled=false","ConFig.config.ads","json:{\"pause\":{\"state\":{}}}","Object.prototype.adblockPlugin","initializePopupAd","fireAd","juicy_tags","!youtu","injectAd",".isAdFree=true","resumeGame","/eeea5e31|new\\s+Function/","timeLeft--","source.ads","/player",".props.pageProps.globalData.publisherFeatureFlags.enableAdBlockDetection=false",".props.pageProps.globalData.publisherFeatureFlags.enableHardAdBlockDetection=false","data.*.elements.edges.[].node.outboundLink","data.children.[].data.outbound_link","method:POST url:/logImpressions","rwt",".js","_oEa","ADMITAD","body:browser","_hjSettings","bmak.js_post","method:POST","utreon.com/pl/api/event method:POST","log-sdk.ksapisrv.com/rest/wd/common/log/collect method:POST","firebase.analytics","require.0.3.0.__bbox.define.[].2.is_linkshim_supported","/(ping|score)Url","Object.prototype.updateModifiedCommerceUrl","HTMLAnchorElement.prototype.getAttribute","data-direct-ad","fingerprintjs-pro-react","flashvars.event_reporting","dataLayer.trackingId user.trackingId","Object.prototype.has_opted_out_tracking","cX_atfr","process","process.env","/VisitorAPI|AppMeasurement/","Visitor","''","?orgRef","analytics/bulk-pixel","eventing","send_gravity_event","send_recommendation_event","window.screen.height","method:POST body:zaraz","onclick|oncontextmenu|onmouseover","a[href][onclick*=\"this.href\"]","libAnalytics","json: {\"status\":{\"dataAvailable\":false},\"data\":{}}","libAnalytics.data.get","cmp.inmobi.com/geoip","method:POST url:pfanalytics.bentasker.co.uk","discord.com/api/v9/science","a[onclick=\"fire_download_click_tracking();\"]","adthrive._components.start","method:POST body:page_view",".*[?.operationName==\"TrackEvent\"]","/v1/api","ftr__startScriptLoad","url:/undefined method:POST","linkfire.tracking","body:pageview method:POST","miner","CoinNebula","blogherads","Math.sqrt","update","/(trace|beacon)\\.qq\\.com/","splunkcloud.com/services/collector","event-router.olympics.com","hostingcloud.racing","tvid.in/log/","excess.duolingo.com/batch","/eventLog.ajax","t.wayfair.com/b.php?","navigator.sendBeacon","segment.io","mparticle.com","ceros.com/a?data","pluto.smallpdf.com","method:/post/i url:/\\/\\/chatgpt\\.com\\/ces\\/v1\\/[a-z]$/","method:/post/i url:ab.chatgpt.com/v1/rgstr","/eventhub\\.\\w+\\.miro\\.com\\/api\\/stream/","logs.netflix.com","s73cloud.com/metrics/",".cdnurl=[\"data:video/mp4;base64,AAAAHGZ0eXBNNFYgAAACAGlzb21pc28yYXZjMQAAAAhmcmVlAAAGF21kYXTeBAAAbGliZmFhYyAxLjI4AABCAJMgBDIARwAAArEGBf//rdxF6b3m2Ui3lizYINkj7u94MjY0IC0gY29yZSAxNDIgcjIgOTU2YzhkOCAtIEguMjY0L01QRUctNCBBVkMgY29kZWMgLSBDb3B5bGVmdCAyMDAzLTIwMTQgLSBodHRwOi8vd3d3LnZpZGVvbGFuLm9yZy94MjY0Lmh0bWwgLSBvcHRpb25zOiBjYWJhYz0wIHJlZj0zIGRlYmxvY2s9MTowOjAgYW5hbHlzZT0weDE6MHgxMTEgbWU9aGV4IHN1Ym1lPTcgcHN5PTEgcHN5X3JkPTEuMDA6MC4wMCBtaXhlZF9yZWY9MSBtZV9yYW5nZT0xNiBjaHJvbWFfbWU9MSB0cmVsbGlzPTEgOHg4ZGN0PTAgY3FtPTAgZGVhZHpvbmU9MjEsMTEgZmFzdF9wc2tpcD0xIGNocm9tYV9xcF9vZmZzZXQ9LTIgdGhyZWFkcz02IGxvb2thaGVhZF90aHJlYWRzPTEgc2xpY2VkX3RocmVhZHM9MCBucj0wIGRlY2ltYXRlPTEgaW50ZXJsYWNlZD0wIGJsdXJheV9jb21wYXQ9MCBjb25zdHJhaW5lZF9pbnRyYT0wIGJmcmFtZXM9MCB3ZWlnaHRwPTAga2V5aW50PTI1MCBrZXlpbnRfbWluPTI1IHNjZW5lY3V0PTQwIGludHJhX3JlZnJlc2g9MCByY19sb29rYWhlYWQ9NDAgcmM9Y3JmIG1idHJlZT0xIGNyZj0yMy4wIHFjb21wPTAuNjAgcXBtaW49MCBxcG1heD02OSBxcHN0ZXA9NCB2YnZfbWF4cmF0ZT03NjggdmJ2X2J1ZnNpemU9MzAwMCBjcmZfbWF4PTAuMCBuYWxfaHJkPW5vbmUgZmlsbGVyPTAgaXBfcmF0aW89MS40MCBhcT0xOjEuMDAAgAAAAFZliIQL8mKAAKvMnJycnJycnJycnXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXiEASZACGQAjgCEASZACGQAjgAAAAAdBmjgX4GSAIQBJkAIZACOAAAAAB0GaVAX4GSAhAEmQAhkAI4AhAEmQAhkAI4AAAAAGQZpgL8DJIQBJkAIZACOAIQBJkAIZACOAAAAABkGagC/AySEASZACGQAjgAAAAAZBmqAvwMkhAEmQAhkAI4AhAEmQAhkAI4AAAAAGQZrAL8DJIQBJkAIZACOAAAAABkGa4C/AySEASZACGQAjgCEASZACGQAjgAAAAAZBmwAvwMkhAEmQAhkAI4AAAAAGQZsgL8DJIQBJkAIZACOAIQBJkAIZACOAAAAABkGbQC/AySEASZACGQAjgCEASZACGQAjgAAAAAZBm2AvwMkhAEmQAhkAI4AAAAAGQZuAL8DJIQBJkAIZACOAIQBJkAIZACOAAAAABkGboC/AySEASZACGQAjgAAAAAZBm8AvwMkhAEmQAhkAI4AhAEmQAhkAI4AAAAAGQZvgL8DJIQBJkAIZACOAAAAABkGaAC/AySEASZACGQAjgCEASZACGQAjgAAAAAZBmiAvwMkhAEmQAhkAI4AhAEmQAhkAI4AAAAAGQZpAL8DJIQBJkAIZACOAAAAABkGaYC/AySEASZACGQAjgCEASZACGQAjgAAAAAZBmoAvwMkhAEmQAhkAI4AAAAAGQZqgL8DJIQBJkAIZACOAIQBJkAIZACOAAAAABkGawC/AySEASZACGQAjgAAAAAZBmuAvwMkhAEmQAhkAI4AhAEmQAhkAI4AAAAAGQZsAL8DJIQBJkAIZACOAAAAABkGbIC/AySEASZACGQAjgCEASZACGQAjgAAAAAZBm0AvwMkhAEmQAhkAI4AhAEmQAhkAI4AAAAAGQZtgL8DJIQBJkAIZACOAAAAABkGbgCvAySEASZACGQAjgCEASZACGQAjgAAAAAZBm6AnwMkhAEmQAhkAI4AhAEmQAhkAI4AhAEmQAhkAI4AhAEmQAhkAI4AAAAhubW9vdgAAAGxtdmhkAAAAAAAAAAAAAAAAAAAD6AAABDcAAQAAAQAAAAAAAAAAAAAAAAEAAAAAAAAAAAAAAAAAAAABAAAAAAAAAAAAAAAAAABAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAwAAAzB0cmFrAAAAXHRraGQAAAADAAAAAAAAAAAAAAABAAAAAAAAA+kAAAAAAAAAAAAAAAAAAAAAAAEAAAAAAAAAAAAAAAAAAAABAAAAAAAAAAAAAAAAAABAAAAAALAAAACQAAAAAAAkZWR0cwAAABxlbHN0AAAAAAAAAAEAAAPpAAAAAAABAAAAAAKobWRpYQAAACBtZGhkAAAAAAAAAAAAAAAAAAB1MAAAdU5VxAAAAAAALWhkbHIAAAAAAAAAAHZpZGUAAAAAAAAAAAAAAABWaWRlb0hhbmRsZXIAAAACU21pbmYAAAAUdm1oZAAAAAEAAAAAAAAAAAAAACRkaW5mAAAAHGRyZWYAAAAAAAAAAQAAAAx1cmwgAAAAAQAAAhNzdGJsAAAAr3N0c2QAAAAAAAAAAQAAAJ9hdmMxAAAAAAAAAAEAAAAAAAAAAAAAAAAAAAAAALAAkABIAAAASAAAAAAAAAABAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAGP//AAAALWF2Y0MBQsAN/+EAFWdCwA3ZAsTsBEAAAPpAADqYA8UKkgEABWjLg8sgAAAAHHV1aWRraEDyXyRPxbo5pRvPAyPzAAAAAAAAABhzdHRzAAAAAAAAAAEAAAAeAAAD6QAAABRzdHNzAAAAAAAAAAEAAAABAAAAHHN0c2MAAAAAAAAAAQAAAAEAAAABAAAAAQAAAIxzdHN6AAAAAAAAAAAAAAAeAAADDwAAAAsAAAALAAAACgAAAAoAAAAKAAAACgAAAAoAAAAKAAAACgAAAAoAAAAKAAAACgAAAAoAAAAKAAAACgAAAAoAAAAKAAAACgAAAAoAAAAKAAAACgAAAAoAAAAKAAAACgAAAAoAAAAKAAAACgAAAAoAAAAKAAAAiHN0Y28AAAAAAAAAHgAAAEYAAANnAAADewAAA5gAAAO0AAADxwAAA+MAAAP2AAAEEgAABCUAAARBAAAEXQAABHAAAASMAAAEnwAABLsAAATOAAAE6gAABQYAAAUZAAAFNQAABUgAAAVkAAAFdwAABZMAAAWmAAAFwgAABd4AAAXxAAAGDQAABGh0cmFrAAAAXHRraGQAAAADAAAAAAAAAAAAAAACAAAAAAAABDcAAAAAAAAAAAAAAAEBAAAAAAEAAAAAAAAAAAAAAAAAAAABAAAAAAAAAAAAAAAAAABAAAAAAAAAAAAAAAAAAAAkZWR0cwAAABxlbHN0AAAAAAAAAAEAAAQkAAADcAABAAAAAAPgbWRpYQAAACBtZGhkAAAAAAAAAAAAAAAAAAC7gAAAykBVxAAAAAAALWhkbHIAAAAAAAAAAHNvdW4AAAAAAAAAAAAAAABTb3VuZEhhbmRsZXIAAAADi21pbmYAAAAQc21oZAAAAAAAAAAAAAAAJGRpbmYAAAAcZHJlZgAAAAAAAAABAAAADHVybCAAAAABAAADT3N0YmwAAABnc3RzZAAAAAAAAAABAAAAV21wNGEAAAAAAAAAAQAAAAAAAAAAAAIAEAAAAAC7gAAAAAAAM2VzZHMAAAAAA4CAgCIAAgAEgICAFEAVBbjYAAu4AAAADcoFgICAAhGQBoCAgAECAAAAIHN0dHMAAAAAAAAAAgAAADIAAAQAAAAAAQAAAkAAAAFUc3RzYwAAAAAAAAAbAAAAAQAAAAEAAAABAAAAAgAAAAIAAAABAAAAAwAAAAEAAAABAAAABAAAAAIAAAABAAAABgAAAAEAAAABAAAABwAAAAIAAAABAAAACAAAAAEAAAABAAAACQAAAAIAAAABAAAACgAAAAEAAAABAAAACwAAAAIAAAABAAAADQAAAAEAAAABAAAADgAAAAIAAAABAAAADwAAAAEAAAABAAAAEAAAAAIAAAABAAAAEQAAAAEAAAABAAAAEgAAAAIAAAABAAAAFAAAAAEAAAABAAAAFQAAAAIAAAABAAAAFgAAAAEAAAABAAAAFwAAAAIAAAABAAAAGAAAAAEAAAABAAAAGQAAAAIAAAABAAAAGgAAAAEAAAABAAAAGwAAAAIAAAABAAAAHQAAAAEAAAABAAAAHgAAAAIAAAABAAAAHwAAAAQAAAABAAAA4HN0c3oAAAAAAAAAAAAAADMAAAAaAAAACQAAAAkAAAAJAAAACQAAAAkAAAAJAAAACQAAAAkAAAAJAAAACQAAAAkAAAAJAAAACQAAAAkAAAAJAAAACQAAAAkAAAAJAAAACQAAAAkAAAAJAAAACQAAAAkAAAAJAAAACQAAAAkAAAAJAAAACQAAAAkAAAAJAAAACQAAAAkAAAAJAAAACQAAAAkAAAAJAAAACQAAAAkAAAAJAAAACQAAAAkAAAAJAAAACQAAAAkAAAAJAAAACQAAAAkAAAAJAAAACQAAAAkAAACMc3RjbwAAAAAAAAAfAAAALAAAA1UAAANyAAADhgAAA6IAAAO+AAAD0QAAA+0AAAQAAAAEHAAABC8AAARLAAAEZwAABHoAAASWAAAEqQAABMUAAATYAAAE9AAABRAAAAUjAAAFPwAABVIAAAVuAAAFgQAABZ0AAAWwAAAFzAAABegAAAX7AAAGFwAAAGJ1ZHRhAAAAWm1ldGEAAAAAAAAAIWhkbHIAAAAAAAAAAG1kaXJhcHBsAAAAAAAAAAAAAAAALWlsc3QAAAAlqXRvbwAAAB1kYXRhAAAAAQAAAABMYXZmNTUuMzMuMTAw\"]","/storage-resolve/files/audio/interactive","json:\"https://\"","data:video/mp4",".state_machine.tracks.*[?.metadata.uri^=\"spotify:ad:\"].manifest.file_urls_mp3.*.file_id=1","/track-playback",".state_machine.tracks.*[?.metadata.uri^=\"spotify:ad:\"].manifest.file_urls_mp3.*.file_url=\"data:video/mp4;base64,AAAAHGZ0eXBNNFYgAAACAGlzb21pc28yYXZjMQAAAAhmcmVlAAAGF21kYXTeBAAAbGliZmFhYyAxLjI4AABCAJMgBDIARwAAArEGBf//rdxF6b3m2Ui3lizYINkj7u94MjY0IC0gY29yZSAxNDIgcjIgOTU2YzhkOCAtIEguMjY0L01QRUctNCBBVkMgY29kZWMgLSBDb3B5bGVmdCAyMDAzLTIwMTQgLSBodHRwOi8vd3d3LnZpZGVvbGFuLm9yZy94MjY0Lmh0bWwgLSBvcHRpb25zOiBjYWJhYz0wIHJlZj0zIGRlYmxvY2s9MTowOjAgYW5hbHlzZT0weDE6MHgxMTEgbWU9aGV4IHN1Ym1lPTcgcHN5PTEgcHN5X3JkPTEuMDA6MC4wMCBtaXhlZF9yZWY9MSBtZV9yYW5nZT0xNiBjaHJvbWFfbWU9MSB0cmVsbGlzPTEgOHg4ZGN0PTAgY3FtPTAgZGVhZHpvbmU9MjEsMTEgZmFzdF9wc2tpcD0xIGNocm9tYV9xcF9vZmZzZXQ9LTIgdGhyZWFkcz02IGxvb2thaGVhZF90aHJlYWRzPTEgc2xpY2VkX3RocmVhZHM9MCBucj0wIGRlY2ltYXRlPTEgaW50ZXJsYWNlZD0wIGJsdXJheV9jb21wYXQ9MCBjb25zdHJhaW5lZF9pbnRyYT0wIGJmcmFtZXM9MCB3ZWlnaHRwPTAga2V5aW50PTI1MCBrZXlpbnRfbWluPTI1IHNjZW5lY3V0PTQwIGludHJhX3JlZnJlc2g9MCByY19sb29rYWhlYWQ9NDAgcmM9Y3JmIG1idHJlZT0xIGNyZj0yMy4wIHFjb21wPTAuNjAgcXBtaW49MCBxcG1heD02OSBxcHN0ZXA9NCB2YnZfbWF4cmF0ZT03NjggdmJ2X2J1ZnNpemU9MzAwMCBjcmZfbWF4PTAuMCBuYWxfaHJkPW5vbmUgZmlsbGVyPTAgaXBfcmF0aW89MS40MCBhcT0xOjEuMDAAgAAAAFZliIQL8mKAAKvMnJycnJycnJycnXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXiEASZACGQAjgCEASZACGQAjgAAAAAdBmjgX4GSAIQBJkAIZACOAAAAAB0GaVAX4GSAhAEmQAhkAI4AhAEmQAhkAI4AAAAAGQZpgL8DJIQBJkAIZACOAIQBJkAIZACOAAAAABkGagC/AySEASZACGQAjgAAAAAZBmqAvwMkhAEmQAhkAI4AhAEmQAhkAI4AAAAAGQZrAL8DJIQBJkAIZACOAAAAABkGa4C/AySEASZACGQAjgCEASZACGQAjgAAAAAZBmwAvwMkhAEmQAhkAI4AAAAAGQZsgL8DJIQBJkAIZACOAIQBJkAIZACOAAAAABkGbQC/AySEASZACGQAjgCEASZACGQAjgAAAAAZBm2AvwMkhAEmQAhkAI4AAAAAGQZuAL8DJIQBJkAIZACOAIQBJkAIZACOAAAAABkGboC/AySEASZACGQAjgAAAAAZBm8AvwMkhAEmQAhkAI4AhAEmQAhkAI4AAAAAGQZvgL8DJIQBJkAIZACOAAAAABkGaAC/AySEASZACGQAjgCEASZACGQAjgAAAAAZBmiAvwMkhAEmQAhkAI4AhAEmQAhkAI4AAAAAGQZpAL8DJIQBJkAIZACOAAAAABkGaYC/AySEASZACGQAjgCEASZACGQAjgAAAAAZBmoAvwMkhAEmQAhkAI4AAAAAGQZqgL8DJIQBJkAIZACOAIQBJkAIZACOAAAAABkGawC/AySEASZACGQAjgAAAAAZBmuAvwMkhAEmQAhkAI4AhAEmQAhkAI4AAAAAGQZsAL8DJIQBJkAIZACOAAAAABkGbIC/AySEASZACGQAjgCEASZACGQAjgAAAAAZBm0AvwMkhAEmQAhkAI4AhAEmQAhkAI4AAAAAGQZtgL8DJIQBJkAIZACOAAAAABkGbgCvAySEASZACGQAjgCEASZACGQAjgAAAAAZBm6AnwMkhAEmQAhkAI4AhAEmQAhkAI4AhAEmQAhkAI4AhAEmQAhkAI4AAAAhubW9vdgAAAGxtdmhkAAAAAAAAAAAAAAAAAAAD6AAABDcAAQAAAQAAAAAAAAAAAAAAAAEAAAAAAAAAAAAAAAAAAAABAAAAAAAAAAAAAAAAAABAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAwAAAzB0cmFrAAAAXHRraGQAAAADAAAAAAAAAAAAAAABAAAAAAAAA+kAAAAAAAAAAAAAAAAAAAAAAAEAAAAAAAAAAAAAAAAAAAABAAAAAAAAAAAAAAAAAABAAAAAALAAAACQAAAAAAAkZWR0cwAAABxlbHN0AAAAAAAAAAEAAAPpAAAAAAABAAAAAAKobWRpYQAAACBtZGhkAAAAAAAAAAAAAAAAAAB1MAAAdU5VxAAAAAAALWhkbHIAAAAAAAAAAHZpZGUAAAAAAAAAAAAAAABWaWRlb0hhbmRsZXIAAAACU21pbmYAAAAUdm1oZAAAAAEAAAAAAAAAAAAAACRkaW5mAAAAHGRyZWYAAAAAAAAAAQAAAAx1cmwgAAAAAQAAAhNzdGJsAAAAr3N0c2QAAAAAAAAAAQAAAJ9hdmMxAAAAAAAAAAEAAAAAAAAAAAAAAAAAAAAAALAAkABIAAAASAAAAAAAAAABAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAGP//AAAALWF2Y0MBQsAN/+EAFWdCwA3ZAsTsBEAAAPpAADqYA8UKkgEABWjLg8sgAAAAHHV1aWRraEDyXyRPxbo5pRvPAyPzAAAAAAAAABhzdHRzAAAAAAAAAAEAAAAeAAAD6QAAABRzdHNzAAAAAAAAAAEAAAABAAAAHHN0c2MAAAAAAAAAAQAAAAEAAAABAAAAAQAAAIxzdHN6AAAAAAAAAAAAAAAeAAADDwAAAAsAAAALAAAACgAAAAoAAAAKAAAACgAAAAoAAAAKAAAACgAAAAoAAAAKAAAACgAAAAoAAAAKAAAACgAAAAoAAAAKAAAACgAAAAoAAAAKAAAACgAAAAoAAAAKAAAACgAAAAoAAAAKAAAACgAAAAoAAAAKAAAAiHN0Y28AAAAAAAAAHgAAAEYAAANnAAADewAAA5gAAAO0AAADxwAAA+MAAAP2AAAEEgAABCUAAARBAAAEXQAABHAAAASMAAAEnwAABLsAAATOAAAE6gAABQYAAAUZAAAFNQAABUgAAAVkAAAFdwAABZMAAAWmAAAFwgAABd4AAAXxAAAGDQAABGh0cmFrAAAAXHRraGQAAAADAAAAAAAAAAAAAAACAAAAAAAABDcAAAAAAAAAAAAAAAEBAAAAAAEAAAAAAAAAAAAAAAAAAAABAAAAAAAAAAAAAAAAAABAAAAAAAAAAAAAAAAAAAAkZWR0cwAAABxlbHN0AAAAAAAAAAEAAAQkAAADcAABAAAAAAPgbWRpYQAAACBtZGhkAAAAAAAAAAAAAAAAAAC7gAAAykBVxAAAAAAALWhkbHIAAAAAAAAAAHNvdW4AAAAAAAAAAAAAAABTb3VuZEhhbmRsZXIAAAADi21pbmYAAAAQc21oZAAAAAAAAAAAAAAAJGRpbmYAAAAcZHJlZgAAAAAAAAABAAAADHVybCAAAAABAAADT3N0YmwAAABnc3RzZAAAAAAAAAABAAAAV21wNGEAAAAAAAAAAQAAAAAAAAAAAAIAEAAAAAC7gAAAAAAAM2VzZHMAAAAAA4CAgCIAAgAEgICAFEAVBbjYAAu4AAAADcoFgICAAhGQBoCAgAECAAAAIHN0dHMAAAAAAAAAAgAAADIAAAQAAAAAAQAAAkAAAAFUc3RzYwAAAAAAAAAbAAAAAQAAAAEAAAABAAAAAgAAAAIAAAABAAAAAwAAAAEAAAABAAAABAAAAAIAAAABAAAABgAAAAEAAAABAAAABwAAAAIAAAABAAAACAAAAAEAAAABAAAACQAAAAIAAAABAAAACgAAAAEAAAABAAAACwAAAAIAAAABAAAADQAAAAEAAAABAAAADgAAAAIAAAABAAAADwAAAAEAAAABAAAAEAAAAAIAAAABAAAAEQAAAAEAAAABAAAAEgAAAAIAAAABAAAAFAAAAAEAAAABAAAAFQAAAAIAAAABAAAAFgAAAAEAAAABAAAAFwAAAAIAAAABAAAAGAAAAAEAAAABAAAAGQAAAAIAAAABAAAAGgAAAAEAAAABAAAAGwAAAAIAAAABAAAAHQAAAAEAAAABAAAAHgAAAAIAAAABAAAAHwAAAAQAAAABAAAA4HN0c3oAAAAAAAAAAAAAADMAAAAaAAAACQAAAAkAAAAJAAAACQAAAAkAAAAJAAAACQAAAAkAAAAJAAAACQAAAAkAAAAJAAAACQAAAAkAAAAJAAAACQAAAAkAAAAJAAAACQAAAAkAAAAJAAAACQAAAAkAAAAJAAAACQAAAAkAAAAJAAAACQAAAAkAAAAJAAAACQAAAAkAAAAJAAAACQAAAAkAAAAJAAAACQAAAAkAAAAJAAAACQAAAAkAAAAJAAAACQAAAAkAAAAJAAAACQAAAAkAAAAJAAAACQAAAAkAAACMc3RjbwAAAAAAAAAfAAAALAAAA1UAAANyAAADhgAAA6IAAAO+AAAD0QAAA+0AAAQAAAAEHAAABC8AAARLAAAEZwAABHoAAASWAAAEqQAABMUAAATYAAAE9AAABRAAAAUjAAAFPwAABVIAAAVuAAAFgQAABZ0AAAWwAAAFzAAABegAAAX7AAAGFwAAAGJ1ZHRhAAAAWm1ldGEAAAAAAAAAIWhkbHIAAAAAAAAAAG1kaXJhcHBsAAAAAAAAAAAAAAAALWlsc3QAAAAlqXRvbwAAAB1kYXRhAAAAAQAAAABMYXZmNTUuMzMuMTAw\""];

const $scriptletArglists$ = /* 3793 */ "0,0,1,2;0,3,1,2;1,4,5,6;2,7,8,1,2;2,9,8,1,10;3,7,8,1,11;4,12,13,14;4,15,8,14;4,16,17,11;5,12,13,18;5,19,13,18;5,19,13,20;6,21,22;6,21,23;6,21,24;7,25;5,19,13,26;7,27;3,28,8,1,29;8,30;9,31,32;7,33;8,34;10,35,1,29;10,34,1,29;10,36,1,29;11;9,37,38;12,39,40;12,41,42;13,43,44,45,46;13,47,48;13,49,50;13,51,52,45,46;13,53,54,45,46;13,55,54,45,46;14,56,57;14,58,59;15,60;14,61,62;16,8,63;15,64;12,65,66;12,67,68;12,21,69;12,70,71;17,56,72;9,73,74,75,76;18,77,78,79;19,80,81,82,83,84;20,85;20,86,87;21,88,89;20,90,91;20,92;20,93;11,94;12,95,96;9,97,38;12,98,99;22,100,101;21,102,103;21,104,103;20,105;19,106,81,107,83,108;19,109,81,107,83,110;9,111,32;9,112,32;9,113,114;21,115;20,116;23,117,118,119;22,120,8,8,121,122;19,123,81,124,83,125;24,126,127;21,128;21,8,129;15,130;22,131,132;19,133,81,8,83,134;22,135,136;18,137,138,139,83,140;19,137,81,141,83,142;19,143,81,141,83,142;22,144,145,146;21,147;9,148,38;22,149,150;13,151,152,153;25,154,155;17,156,157,75,76;9,158,38;26,159;3,160,8,1,161;9,162,163;26,164;1,165;22,166,167;20,166,167;9,168,163;9,169,170;1,171,89;9,172,170;9,173,163;23,174,175;9,176,177;7,178;22,179;9,180,163;9,181,74;9,182,163;20,183;27;9,184,163;9,185,163;9,186,163;9,187,163;9,188,163;9,189,74;9,190,163;9,191,163;22,192;28,193;22,194;22,195;1,196,197;23,198,199;23,200,201,119;12,202;9,203,8;20,204;20,195;14,205,206;22,207;9,208,74;9,209,74;9,210,74;27,211,8,212;20,213;9,214,74;20,215;9,216,163;20,207;9,217,163;9,218,91;9,219,74;9,220,74;1,221,222,6;1,223,224,6;9,225,114;9,226,163;20,227;9,228,163;9,229,163;9,230,163;9,231,74;9,232,163;20,233;26,234;9,235,163;9,236,163;9,237,163;9,238,74;9,239,91;9,240,74;9,241,163;9,242,74;9,243,163;9,244,8;9,245,74;9,246,163;9,247,74;9,248,163;9,249,163;9,250,74;9,251,163;9,252,163;9,253,74;9,254,74;9,255,74;9,256,74;9,257,74;9,258,74;9,259,163;9,260,163;1,261,224;9,262,74;20,263;27,264,197;9,265,74;9,266,163;25,267,268;9,269,74;9,270,163;9,271,163;9,272,163;1,273,274;1,275,197;9,276,74;9,277,163;9,278,74;9,279,163;19,109,81,280,83,281;9,282,38;9,283,91;9,284,74;9,285,163;9,286,74;9,287,114;9,288,74;9,289,163;9,290,163;9,291,163;9,292,74;9,293,163;9,294,163;9,295,74;9,296,114;9,297,74;9,298,163;9,299,163;9,300,163;9,301,163;9,302,74;9,303,163;1,304,224,6;9,305,74;9,306,8;9,307,74;9,308,163;9,309,163;20,310;9,311,74;9,312,163;9,313,74;9,314,163;9,315,163;9,316,74;9,317,163;9,318,163;9,319,74;9,320,163;9,321,163;9,322,163;9,323,74;9,324,163;1,325,197,6;1,326,224,6;9,327,163;22,204;1,328,197,6;9,329,74;9,330,163;22,331;1,196,332,6;1,196,333,6;9,334,163;21,335;9,336,74;9,337,163;9,338,74;20,339;9,340,163;9,341,74;9,342,163;9,343,74;9,344,163;9,345,74;9,346,163;9,347,74;9,348,163;9,349,163;17,350,351;9,352,32;1,4,274,6;1,353,354,6;9,355,74;9,356,163;9,357,163;1,358,197,6;20,359;9,360,74;9,361,74;9,362,163;9,363,163;9,364,74;9,365,163;9,366,163;9,367,32;9,368,163;9,369,163;9,370,74;9,371,163;25,267,372;9,373,163;9,374,38;9,375,163;9,376,163;9,377,163;9,378,163;25,267,8,379,380;9,381,74;9,382,163;9,383,74;9,384,163;9,385,74;9,386,163;9,387,91;19,388,389,390,83,391;9,392,74;9,393,163;9,394,163;9,395,91;9,396,32;9,397,163;9,398,170;9,399,389;9,400,163;9,401,74;9,402,74;9,403,163;9,404,74;9,405,163;9,406,38;9,407,38;9,408,38;9,409,38;7,410;2,411,8,1,412;25,154,413;28,414,89;7,415,416;25,154,417;28,418,419;22,420;9,421,81;22,422;9,423,8;28,424;26,425;7,426;4,427,74,428;4,429,74,428;4,430,74,428;7,431,432;7,433;7,434;3,435,8,1,428;8,436;10,436,1,29;26,437;26,438;25,8,424;21,424;9,439,177;12,440,441;12,442;21,443;21,444;26,445;19,24,81,446,83,447;1,8,419;26,448;29,449;9,450,38;30;26,451;12,452;22,453;25,267,454;29,455;12,456,448;26,457;26,458;26,459;29,460;26,461;25,267,462;25,154,463;21,464,465;26,466;26,467;29,468;20,469;9,470,163;12,109,471;12,98,472;1,473,197;26,474;26,452;25,154,475;26,476;26,477;26,37;29,478;1,479,197;25,8,480;26,481;26,482;26,483;12,58,484;26,485;14,486,487;12,456,488;29,452;26,489;26,490;25,154,491;25,154,492;20,179;9,493,91;9,494,163;22,495;12,456,496;12,497,498;26,499;26,500;12,456,501;29,502;29,503;12,504,505;26,506;25,8,473;12,456,507;25,8,508;12,509,510;26,511;21,484;12,512,484;29,500;26,442;12,440,513;26,514;26,515;29,516;29,517;12,106,518;1,519,520;14,475,46;26,97;9,521,32;9,522,32;26,523;9,524,114;23,525;26,526;25,527,528;26,529;12,456,530;12,456,531;12,456,38;26,532;26,533;9,534,32;26,497;12,475,452;26,535;26,536;26,537;9,538,8;9,539,32;29,540;9,541,91;29,542;29,543;29,544;9,545,91;26,546;12,456,508;29,547;26,512;23,548,549,550;9,551,170;1;29,552;25,8,452;26,553;9,554,32;26,555;12,514;26,556;12,557,558;29,559;28,560;12,456,561;27,562;26,563;29,564;21,565;9,533,91;26,566;21,567;26,568;9,569,163;9,570,91;29,571;25,267,572;25,573,574;12,512,575;29,576;12,98,577;9,37,170;9,578,8;9,579,8;9,580,389;25,581;21,582;26,583;21,584,585;9,586,91;26,587;25,8,588;12,456,589;9,590,8;26,591;14,425,592;25,154,593;15,594;25,595;14,512,596;26,597;9,598,163;9,599,177;14,109,600;1,601,602;1,603,465,6;9,604,91;21,605,81;9,606,163;9,39,177;26,607;9,128,32;12,608,488;9,609,91;12,440,610;29,611;9,612,613;25,8,614;26,615;21,616,465;12,58,465;21,617,618;26,619;12,42,498;9,620,91;12,512,621;28,473;25,8,622;26,623;29,624;9,625,32;26,626;12,627;12,42,628;12,629,630;25,631,632;21,633;26,634;26,635;31,636;26,637;26,638;26,639;9,640,163;12,106,38;9,641,163;29,642;1,643;27,644;21,109,224;26,645;26,646;26,647;12,509,648;29,649;29,650;9,651,32;21,652,653;9,654,91;9,655,32;27,656,657;12,474,128;25,154,658;27,659,585;29,660;29,514;26,661;25,267,632;26,662;9,663,32;25,154,585;12,664,574;12,42;26,665;21,666;29,667;29,668;25,669,670;12,671,672;29,673;25,154,424;12,440,674;26,675;9,676,32;26,609;21,664,465;12,497,42;26,677;29,678;21,679;21,680;26,542;31,514;9,681,8;21,509,81;25,682,670;25,8,633;12,440,477;12,477,683;26,684;26,685;26,686;9,687,91;9,37,163;21,652,585;26,688;25,154,652;25,689,690;12,691,525;29,692;23,693,694;21,695,224;12,696,697;9,698,32;11,622;26,128;12,699;25,8,700;26,701;9,557,91;25,702,703;29,704;21,705,706;12,609;12,58,707;22,708;12,709,710;21,711,585;25,154,712;12,456,713;9,442,91;21,714;25,8,715;21,715;12,456,444;29,97;21,716,274;25,717,718;21,719,89;12,58,109;21,720,585;11,721;12,440,722;11,723;9,724,74;9,725,8;26,726;29,727;12,106,128;9,728,163;26,729;27,730,585;26,731;9,732,32;20,733;21,734;1,735,197,212;9,128,163;9,736,8;7,197,737;11,8,738;12,24,42;12,477;29,739;20,740;9,741,38;12,456,742;9,743,32;9,533,163;26,744;21,711,745;21,746;26,747;25,717,748;26,749;20,750;9,751,163;26,752;12,475,477;25,631,753;9,754,91;11,755;12,497,756;26,455;22,757;9,758,32;26,759;12,106,760;20,761;9,762,163;25,8,763;29,764;21,765,274;12,456,766;26,767;27,8,768;26,769;27,8,8,81;21,770;12,106,771;20,772;12,773,519;12,456,773;26,774;14,722,775;25,527,776;25,717,777;12,563,778;26,779;25,527,473;12,456,780;12,58,781;26,782;29,783;21,473,585;26,784;12,509,512;29,477;23,785,786;12,787;12,42,497;12,475;12,388,788;29,498;23,789,790;26,791;26,722;28,792,465;21,275,793;12,456,794;26,795;9,477,177;26,796;25,797,622;9,798,91;26,571;26,799;29,800;23,801,802;27,803,197;9,804,32;9,805,163;25,267,806;21,807,89;12,571;26,808;25,154,809;12,810;9,811,38;26,812;12,456,452;25,154,813;21,508,224;21,814,815;20,816;29,804;21,817,81;27,818;12,106,819;12,820,821;9,822,32;26,823;26,824;26,825;21,826,465;22,275;9,827,32;29,828;21,829;28,830,465;29,831;21,473;11,832,738;12,106,833;29,834;9,42,163;25,8,60;26,835;9,836,163;21,837,389;9,838,163;12,106,275;9,839,163;20,757;25,717,840;12,504,498;12,388,841;26,842;1,843,520;26,844;26,624;12,456,845;9,128,389;9,846,389;21,847;23,848;29,849;7,850,851;12,852,776;21,456;21,853,465;29,634;29,854;21,807;12,106,855;9,856,81;9,275,91;29,857;25,267,858;26,859;12,860,636;9,861,91;29,862;21,424,81;25,8,863;21,864;9,865,163;12,440,866;9,529,389;12,58,867;12,58,868;29,869;12,563,867;12,98,870;26,871;14,504,872;21,873,874;28,875;23,693,876;29,877;12,512,878;21,420;12,440,879;25,267,473;9,880,32;22,179,757;26,836;21,881,89;26,882;26,883;26,884;21,508;26,885;29,886;27,8,8,6;9,887,170;12,888;12,475,525;26,889;9,890,91;14,891,46;9,892,8;9,893,38;9,529,32;21,807,419;26,894;12,106,895;9,896,91;12,106,897;12,106,898;21,899,585;21,900,465;26,901;29,902;12,456,903;12,456,904;12,456,895;21,896;12,106,905;12,456,906;12,106,907;29,908;22,195,145,146;21,177,520;25,154,909;25,154,910;12,509,652;21,711,354;21,911,274;27,856;9,912,81;26,913;21,914,354;21,711,222;25,267,753;11,915;29,497;26,916;9,917,32;12,456,128;22,918;21,919;25,920,921;21,922;9,923,163;12,456,924;21,711,465;12,512,925;9,926,163;9,927,163;25,717,928;12,504,42;9,929,91;29,930;1,931;29,932;12,691,575;29,933;9,934,32;9,97,163;9,935,163;21,722,354;21,488;29,936;21,937;9,938,163;21,939,585;9,940,91;29,934;25,154,941;28,711,224;26,942;26,943;25,944,945;29,946;26,947;14,512,46;23,525,948;1,949;29,950;9,951,91;12,486,628;12,456,952;28,953,954;9,955,8;26,498;12,456,956;9,908,91;9,957,91;21,958;20,275;21,959;12,820,267;12,106,960;12,193,697;26,961;11,962,81;9,963,91;9,696,91;27,644,197;9,964,32;25,527,965;21,966,657;9,967,32;21,968;1,8,8,212;21,969,89;21,970,419;25,267,221;26,577;9,971,81;9,828,163;26,972;27,643;21,973;27,8,8,212;9,974,81;25,267,622;26,975;26,976;12,97;12,456,977;11,978;26,504;12,979,980;12,629,763;27,981,465;29,982;25,983,763;9,984,163;12,95,895;9,985,81;25,267,986;11,128,389,987;22,988;25,267;9,989,32;12,990;12,991;12,992;12,993;25,717,994;26,995;21,996,389;11,997;12,849;26,998;11,999;9,1000,163;26,1001;26,1002;21,1003;9,1004,163;28,1005,465;25,631,1006;9,1007,32;26,231;12,440,776;12,722,1008;29,1009;9,508,32;26,1010;12,820,1011;26,475;9,1012,8;9,1013,8;9,1014,32;14,42,46;26,902;21,1015;12,106,1016;12,42,624;12,1017,473;21,1018;20,1019;20,1020;21,960,585;14,98,46;26,1021;25,717,1022;21,1022;12,456,771;21,891,465;9,1023,81;9,1024,91;9,1025,91;9,1026,32;21,128,1027;25,1028;26,1029;21,1030;21,177;12,512,1031;12,58,1032;26,1033;26,1034;26,1035;12,629,633;29,1036;9,1037,613;26,1038;12,512,1039;12,98,1040;26,1041;9,1042,91;9,1043,91;9,1044,177;14,106,1045;9,1046,91;9,1047,32;1,949,465,6;29,1048;26,776;11,1049;26,1050;25,8,420;21,424,618;12,106,1051;12,512,1052;12,106,1053;29,1054;26,907;12,820,652;11,453,389;26,1055;23,693,1056;26,1057;25,453,763;28,1058,465;21,521;12,388,40;26,56;9,1059,32;9,1060,32;21,1061;26,552;26,1062;25,154,1063;25,1064,473;26,1065;9,1066,91;12,518,786;26,1067;26,61;9,1035,163;26,1068;31,1069;26,1070;29,1071;9,1072,91;29,1073;9,1074,389;31,275;23,1075,1076;12,60,870;12,1031,870;29,1077;9,97,32;21,1078;11,275;9,1079,389;26,1080;29,1081;21,1082;9,1083,91;12,477,693;26,1084;12,1085;12,820,1086;9,1087,170;12,691,1088;12,95,1089;21,1090;22,1091;12,440,38;21,1092;29,1093;29,1094;25,717,1095;29,1096;12,456,866;12,1097,960;12,512,960;26,1098;12,106,1099;11,1100,738,987;29,128;9,1101,91;29,1102;25,1103,1104;12,456,1105;21,711;26,1106;7,1107;28,1108;12,95,1109;26,1110;12,512,588;26,1111;9,1112,91;21,866;14,413,1113;21,1114;26,1115;21,1116;21,1117,585;22,1118;9,955,38;12,551;25,8,1119;26,804;23,1120;26,1121;12,624,577;12,1122;22,1123;26,1124;21,1125;9,1126,8;25,944;9,264,91;29,1127;21,1128;28,1128;25,267,1129;26,1130;12,1131;12,512,1132;25,8,488;26,1133;28,550,745;28,1134;9,1135,38;12,515,1136;25,154,1088;12,106,1137;21,1138;9,1139,91;29,1140;21,1141;21,8,389;25,8,1142;9,468,91;21,38;21,908,389;12,456,1143;29,910;12,456,1144;12,440,1111;21,804;9,1145,8;26,1146;9,1147,163;26,1148;12,440,128;27,1149;1,1149;26,1150;12,504,1151;21,652;25,8,1152;9,97,91;12,891,1109;12,440,1003;27,1153;9,1154,81;21,1155;20,195,145;26,1156;21,1157,585;28,763;28,771;26,1158;7,1159;27,8,197,81;9,533,170;21,996;25,267,776;12,456,58;12,106,1160;12,456,275;12,440,771;12,456,1161;12,98,633;12,456,95;9,1162,91;20,1163;9,1164,74;20,1165;9,1166,32;14,1167,1168;4,1169,1170,1168;7,1171;9,1172,38;9,1173,163;9,1174,163;32,1175,1176;25,1177;7,415,1178;21,1179,653;21,112;12,1180;12,58,1181;12,1182;25,1064,1105;26,1183;12,456,1184;21,1185,81;21,652,1186;25,154,38;9,1187,32;25,717,1084;9,1188,74;25,154,763;21,1189;25,717,477;12,456,1190;12,106,1191;9,1192,91;9,420,177;12,512,128;20,1193;27,1194,465;21,1195,81;26,930;28,1058;28,786;25,1196;26,1197;12,456,477;26,1198;9,1199,32;21,605,874;9,1200,91;9,1201,91;9,1202,32;9,275,177;11,1203;12,1204,776;33;29,1205;12,860,866;12,456,1206;23,1207;31,746;25,267,1208;26,1066;12,456,1209;12,98,498;12,456,475;25,267,8,379,1210;21,1211;20,420;9,1212,163;26,887;26,1213;9,1214,91;12,836;12,1215;23,693,1216;23,693,1217;23,693,1218;12,98,1219;26,1220;26,1221;12,504,1222;25,8,444;25,843,574;21,1223;14,889,1224;9,1225,177;21,763;12,664,358;26,1226;26,1227;23,848,1228;12,509,821;21,1229,89;12,109,1230;12,456,1231;21,1232;25,8,275;26,1125;12,456,1233;29,1234;25,267,1235;9,1236,91;21,1144;25,154,1237;28,420;9,1238,91;21,1239,465;22,1240;9,1241,32;12,456,1155;12,440,1155;21,1242;7,1243;21,1239;25,154,1244;9,1245,91;9,1246,91;12,475,128;9,1247,32;26,1182;26,1248;26,1249;12,512,1250;9,452,38;26,1251;9,1252,177;12,509,1253;12,440,267;9,1254,91;12,498,487;21,810;25,8,477;21,1255;11,1256;21,1257;27,659,197,6;26,1140;9,1258,177;9,420,170;9,1259,38;26,1260;11,1261;21,1262;21,697;9,97,177;25,717,866;9,1263,389;26,1264;26,518;9,1265,32;26,1266;26,1267;12,42,473;21,907;26,1268;9,1141,32;7,1269;25,1270,1271;21,1272,81;21,275;12,456,1273;25,1274,1275;25,717,804;14,624,46;1,8,419,81;26,478;26,1276;9,1277,91;26,1278;11,1279;23,1280,1281;12,509,1155;12,509,1282;12,509,507;12,820,804;28,937;9,963,32;29,1283;9,1284,38;17,1285,1286,1287,1288;26,1289;27,843,197,212;21,907,585;19,1179,81,1290,83,1179;9,1291,170;17,425,1292;27,730,197,212;9,1293,81;1,1294,197,6;27,1295,197,6;27,1296,197,212;1,1297,197,212;26,1283;27,843,197,6;25,1298;25,810,1299;31,1300;7,1301;1,1302,197;9,1303,91;12,509,1304;12,546,645;12,475,420;7,1305;7,1306;7,1307;31,1308;21,1309;22,1310;12,1311,1312;21,1313;22,195,8,1314;9,1315,170;12,1311,937;22,1316;25,154,1317;12,509,1312;12,509,275;11,1318;9,1319,91;26,1320;23,1321,1322;23,1321,1323,119;23,525,1324,119;9,1325,91;23,1326,1327;25,810,1328;22,1329;27,818,197,6;26,991;14,109,1330;21,1331,1332;19,106,81,1333,83,1334;19,106,81,1335,83,1334;19,820,81,1336,83,1337;19,1338,81,1336,83,1339;27,1296,197,6;1,1340,197,6;27,730,197,6;25,717,700;21,1190;26,1341;25,154,1342;31,804;23,693,1343;25,717,1344;25,717,807;21,473,89;29,1345;23,1280,8,119;11,1346;9,784,38;1,1347;9,1348,32;9,1349,163;9,993,163;25,1350,632;25,1337,1351;1,8,197,1352;18,498,1353,32;29,1311;14,425,1354;26,1355;27,1296,465,6;27,1296,1356,6;25,267,1029;12,512,1344;23,1357,1358,119;26,992;27,1023,197,6;25,1350;21,1319;22,1359;9,1360,91;25,1361,1362;9,907,1363;20,1364;12,1365,1366;25,717,616;21,901;27,1367,197,6;1,1105,197,6;31,424;26,1368;22,1369,1370;27,843,197;1,843,197;25,154,1371;26,1372;23,525,1373;31,965;14,106,804;11,8,1027;1,843,197,6;14,22,1374;17,1285,1286,1287,1375;9,1376,1377;1,1105,197;21,1378;22,1379;11,453,738;21,8,585;21,453,465;9,1380,81;11,1381;31,1382;25,717,1383;23,525,1384;26,1385;25,267,1386;25,267,8,379,1387;26,1317;26,1388;22,1389;20,1390;31,420;22,1391;11,1392;27,8,197,212;1,8,197,212;22,420,1393;9,1394,177;12,24,1395;25,267,1396;17,1397,1398;9,1399,74;21,1400;25,267,488;25,267,1401;21,1402;12,664,1403;25,267,512;9,1404,38;25,717,452;22,1405;22,1406;27,659;9,1407,91;24,927,1408;23,693,1409,119;25,267,1410;27,659,465,6;22,1411;25,810;1,8,618;12,58,972;14,691,804;9,1412,1288;27,659,465;1,949,465;12,22,95;22,740;28,1318;12,58,1413;12,24,1031;25,267,452;25,267,1414;34,1415,1,1416;19,1417,1288,1418;8,1419;8,1420;22,1421;23,1326,1422;25,267,588;25,267,1088;11,1423;26,42;12,123,1424;12,699,1425;9,1426,91;26,1427;11,1428;11,1429;9,1430,8;11,1431;25,267,1432;28,1433;12,512,804;14,106,1434;3,1435,8,1,1436;11,1437;20,1123,145;11,8,738,987;27,1438,197;19,109,81,1439,83,1440;19,664,81,1439,83,1441;19,106,81,1442,83,1443;22,1444;21,1445,653;13,860,1446;21,1447;27,1448,197;21,1179;27,1449;25,1337;25,717,1450;12,512,1450;25,154,1451;21,1452,89;21,1453,738;21,1453;9,1454,163;21,223,738;9,1455,32;21,1456;26,1457;14,98,878;14,95,1458;14,95,1459;14,95,1460;12,58,1461;9,1462,74;9,1463,163;12,1464;7,1465;18,42,138,8,83,1466;25,267,574;12,42,1467;12,1468,1467;18,42,138,8,83,1469;29,836;25,8,574;12,456,574;12,41,1097;25,8,1470;12,58,621;12,1471,621;12,512,1472;12,512,1473;25,154,1474;12,512,1475;12,512,621,1476;13,1477,1478,45,1479;12,512,1480;31,621;12,546,1481;26,1482;11,1483;26,1484;25,8,572;21,1485;14,512,1486;9,1487,8;26,1488;29,1489;28,453;9,1490,38;21,1088;29,1491;12,98,1492;12,24,980;12,1493,980;25,8,980;12,98,980;12,504,1494;14,95,1495;12,24,1097;12,1496,980;14,413,1497;12,1365,1498;26,1499;26,1500;12,1097,24;12,1097,980;12,1017,40;12,497,1501;14,95,1502;12,98,1503;20,1504;14,577,1505;12,41,42,1476;12,60,1506;12,39,1507,1476;12,518,1508;12,1496,1509;14,477,1510;12,22,40;12,509,1511;25,631,1512;11,1513;9,1514,114;21,1515;14,691,1516;25,1517,4,379,1518;9,1519,91;9,1520,1375;9,1521,163;25,154,1522;25,267,1522;27,1296;11,1523;9,1524,32;25,8,1525;21,510,585;31,1526;12,512,1526;31,1527;25,154,937;14,664,1528;26,1529;13,860,1446,45;21,1530;29,1531;12,1158,1003;12,1158,1003,1476;25,154,1532;21,487;22,1533,145,1370;20,1533,145;25,717,1534;13,1535,1536,153,1537;9,1538,32;12,512,1539;9,1539,163;8,1540;8,1541;12,512,1542,1476;9,1543,91;25,1544,1155;12,1539;9,1545,38,1287,1546;17,1547,1548;9,1549,91;9,1550;16,575,1551;25,1552;9,1553,38;14,497,1554;8,1555;8,1556;35,1557;35,1558;35,1559;22,1560;21,1561;21,1562;21,1563;19,1564,389,8,83,1565;9,1566,163;9,1567,163;9,1568,163;7,1569;19,1564,389,1570,83,1571;19,1564,389,1572,83,1571;31,1573;16,575,1574;19,1564,81,1575;23,878,1576,1577;19,1564,389,1578,83,1565;9,1579,91;9,1580,91;21,4,89;19,106,81,1581,83,1582;13,1564,1583,153;25,154,1561;12,512,1584;9,1115,163;7,1585;9,1586,389;7,1587;9,1588,32;9,1588,32,1287,1546;9,1589,32;9,1589,32,1287,1546;9,1590,32;9,1590,32,1287,1546;9,1591,32;9,1591,32,1287,1546;36,1592,1,1593;36,1594,1,1593;16,575,1571;9,1595,32;9,1596,91;9,1597,38;35,1598;12,1599,1600,1476;9,1601,32;27,1602,197,6;9,1603,170;26,1604;29,1605;35,1606;23,679,1607;9,1608,177;9,1204,177;18,1609,1610,8,83,775;14,1611,473;17,1612,1613;9,1614,389;14,512,1615;25,154,1616;9,1617,81;12,456,504;31,193;1,1618,197,6;28,128;23,848,1619;1,730;7,1620;12,1621;26,1622;25,1623;22,179,1624;22,1625;22,1504;25,717,424;2,1626,8,1,1627;25,717,1628;2,1629,8,1,1630;9,1631,91;9,1632,91;2,1626,8,1,1633;12,1204,1634;12,820,1635;2,1636,8,1,1637;2,1638,8,1,1639;22,1640;28,444;9,1641,32;7,1642;7,1643;4,1644,8,1645;25,267,1646;12,820,488;21,1647,1648;37,1649,1,1650;22,1651,1652;21,1653;9,1654,32;9,1655,38;25,267,1656,379,1290;9,1657,91;21,8,874;20,1658;21,1659;19,106,81,1660,83,1661;22,1662;21,1663;25,267,762;21,762;25,154,1664;25,8,1665;25,717,1666;9,1667,91;21,1668;9,1669,32;25,717,996;7,1670,1671;38,1672,8,1673;3,275,1674,1,1675;7,1676;7,1677;39,1678,1679;11,1680;12,58,128;12,512,1681;12,629,425;11,1682;8,1683;12,820,1684;9,1685,114;14,58,475;25,1686,1687;17,1688,1689;2,275,8,1,1690;9,1691,32;9,1692,91;22,1693;14,512,1694;11,622,389,987;12,820,1695;21,1664;12,820,1029;9,1696,38;19,133,1697,1698,83,1699;11,1700;25,267,58;25,267,1701,379,1702;9,1703,170;21,1704;9,1705,32;12,440,413;12,509,866;9,1706,32;26,1707;12,106,1708;26,1709;27,1710;1,1711;21,1712;28,1712;9,1713,177;21,807,465;25,154,1714;21,1715;21,902;21,1716,81;12,106,420;12,498,1717;31,444;21,440;25,527,1718;12,691,771;12,456,1719;12,388,577;21,910;21,453;25,717,1720;12,504,1721;9,1722,389;9,1723,32;9,1724,32;12,512,505;9,1725,177;12,456,1726;26,1727;9,1728,32;9,1729,32;21,908;26,1719;26,1730;26,1731;26,1732;12,809,95;9,1733,81;9,1734,32;21,1735;21,1736;12,456,1239;31,866;21,1737;12,456,1738;14,456,1497;9,1739,177;12,563,518;14,1740,1741;14,512,1742;25,154,575;31,1743;12,456,1744;12,629,1745;12,456,1746;9,1747,163;9,1748,163;22,776;29,1749;11,1750;17,1751,1752;21,1753;12,475,424;12,106,1754;12,860,1755;9,1756,613;21,1206,465;26,1757;25,8,1758;9,1759,38;9,1760,163;27,730,197;21,1182;12,109,424;25,154,1051;26,1754;12,456,1761;12,577,1762;9,1763,32;25,8,1764;26,1765;9,1766,74;9,1767,91;9,1768,389;9,1769,74;9,1770,74;9,1771,389;7,1772;9,1773,163;12,58,1774;26,1775;25,717,128;31,715;9,1776,91;9,1777,38;21,1681,874;9,1778,163;28,746;9,943,32;20,1779;29,1780;21,1781;26,1782;29,1783;21,1784;21,1785;21,1786;12,475,1787;9,1788,613;27,1789;29,1790;9,659,81;12,456,1791;14,98,910;21,1792;9,497,163;26,1793;12,475,1794;9,1795,8;26,940;21,1687;21,1796;26,1797;26,1798;26,1031;12,98,1260;25,8,1799;21,824;21,1800,874;21,1801,89;21,1802,465;26,1139;14,95,1803;7,1804;21,1681;25,1544;23,693,1805;21,1806;21,1807,465;25,154,1808;21,1809;23,525,1810,119;9,1811,163;21,1812;26,1813;12,478;1,1814,1815;23,1816,1817;26,1818;21,1819;12,1009,1820;7,1821;25,267,1470;27,1822,465,6;9,1823,8;7,1824;7,1825;38,1826,8,1673;7,1827;3,1828,8,1,1829;9,1830,163;9,1831,91;21,1832;26,1833;27,8,8,1834;1,8,1835,81;28,1681;23,693,1836,119;21,1837,419;25,717,488;12,1838;25,717,42;12,106,1290;25,8,1839;23,525,1840;11,1841,389;26,1842;25,1843;26,1844;26,443;9,1845,32;9,1846,163;9,1847,91;21,1848;12,1849;12,456,1850;29,1604;31,488;25,797,498;21,1851,706;9,1852,91;9,1853,91;29,1666;26,1854;12,1855,1856;26,1857;26,1858;26,1859;12,504,1860;9,1861,38;12,388,1862;12,1863;29,557;21,1864;20,1865;17,1866,1867;17,1868,1869;9,1870,32;9,1871,32;25,8,1432;14,58,804;9,424,81;26,1872;28,1873,465;12,504,1874;29,1875;9,504,170;25,267,1876;12,1877;9,1878,32;9,1879,32;12,440,275;12,691,336;1,1880,1881;9,1882,163;26,1883;26,1884;25,1686;25,8,1885;14,95,8;9,1065,91;12,475,22;28,106,419;14,440,1003;7,1886;12,512,1887;9,1888,8;9,1889,81;25,267,1215;21,22;14,24,1890;12,98,636;22,1891;12,106,804;25,154,888;12,440,1191;21,1892;22,1893;25,717,1894;9,1895,163;9,1896,38;12,577,1897;14,972,46;26,625;12,456,1712;18,42,1898,1899;7,1900;22,1901,8,1902;14,836,1903;23,1904,1905;12,512,1755;25,1906,1907;27,1908;25,810,221;25,810,1909;12,498,763;9,1910,91;9,1911,163;12,440,895;39,1912,1913;7,1914,1915;38,1916,8,1917;22,1918;12,504,487;21,1919;14,563,8;26,1920;21,1921;26,841;14,563,1922;26,1923;27,473;14,891,475;25,717,763;21,1924;27,1925;12,498,42;26,896;26,1926;29,1927;9,1928,163;9,1929,389;9,1930,8;20,1931;22,1931;21,8,274;26,1605;12,820,1190;12,722,1932;25,1064,38;12,1933;27,1934;26,1935;25,1936,1937;23,693,1938;1,1939;12,22,1940;12,106,1941;20,1942;12,820,420;27,1943;27,1944;23,1326,1945;12,456,605;25,1064,600;25,267,1946;1,1947,274;12,22,1948;26,1949;23,1075,1950,1577;20,179,145;40,1951,1,1952;2,1953,8,1,1952;7,1954;27,1955;28,1956;27,1957;12,512,1958;9,1213,163;21,1959;27,1960;22,1961;38,1962,8,1673;12,106,1963;22,1964;26,24;27,1789,1965,1966;7,1967;26,1968;12,563,514;12,1969;9,679,163;9,1970,163;12,512,1971;14,98,487;1,1972;21,1973;22,1974;9,1768,1975;9,1976,38;21,964;12,512,441;14,512,1977;12,486,636;9,1978,81;25,797,1979;21,1980;25,267,1289;2,1981,8,1,1982;27,1983;27,1023,197;21,1984;14,836;21,1123;25,154,901;25,1064,1985;26,1986;26,559;27,1987;12,456,420;11,1988;22,1989;23,1990,1991,119;41,179,1992;9,1993,74;9,1994,163;21,1995;28,1996;22,1997;12,106,1998;14,1999,2000;12,820,2001;21,2002,585;9,2003,32;1,473,222;1,807,1332;14,98,8;9,2004,32;14,95,1890;27,2005;14,456,46;26,2006;20,2007;21,2008;9,1944,81;14,98,775;14,58,275;14,95,46;9,1972,170;26,1927;25,2009;26,2010;9,2011,389;12,512,424;12,509,487;14,2012,2013;12,2014;14,2015,413;11,2016;1,2017,1815;14,486,775;1,1864,197;9,2018,163;21,2019,224;14,22,46;23,525,2020;20,453;12,1158;11,453,81;22,1753;12,106,1017;12,106,474;9,2021,163;22,220;21,2022;12,456,22;12,106,600;20,2023;25,154,2024;26,557;7,2025;7,2026;29,1158;25,154,2027;20,2028;12,475,786;12,512,2029;26,2030;14,1052,475;26,23;14,512,878;21,2031;20,1753;12,691,2032;23,693,2033,119;23,2034,2035,119;20,2036;23,1326,802;27,730,8,212;9,2037,114;23,1326,2038;12,456,2039;1,2040,224;25,154,574;12,109,473;26,2041;25,267,2042;9,2043,91;1,2044,197;1,2045,197;9,2046,81;12,2047;12,518;14,22,775;26,2048;12,106,866;22,2049;20,2050;12,58,2051;1,2052,197;9,2053,163;9,2054,91;21,2055;32,179,76,1370;25,717,1663;25,8,2056;12,629,746;25,1064;26,2057;12,2058;12,95,996;12,440,1998;9,2059,32;9,2060,32;25,8,2061;1,2062,222,212;9,2063,91;9,2064,8;25,1177,8,379,2065;28,2066;14,98,473;9,2067,74;9,2068,91;27,2069;31,128;12,509,776;21,2070;1,659;12,2071;12,98,504;7,275;39,2072,2073;1,2074,465,6;22,179,145,146;22,2075;21,2076;25,154,2077;23,2078,2079,119;9,2080,163;27,730;14,475,2081;22,2082;1,444,520;26,2083;29,2084;7,2085;12,456,2086;26,2087;21,2088;14,512,2089;27,2090;9,2091,32;12,193,2092;12,456,804;21,2093;27,2019;9,275,38;9,1010,38;26,2094;12,60,505;12,440,1959;12,512,2095;21,2096;12,504,1003;9,97,613;9,2097,38;22,2098;20,2099;9,2100,389;26,2101;26,2102;29,2103;21,2104;9,940,163;12,860,498;11,2105;25,2106,1979;12,820,2107;9,2108,163;21,2109;9,2110,38;9,2111,91;11,2112;28,275;26,2113;12,456,2114;26,2115;1,2116,197;29,2117;26,2118;28,2119;23,525,8,119;29,2120;25,424;9,2121,91;26,2122;12,106,652;12,512,2123;27,2124;12,518,2125;21,711,2126;1,1361,224;12,504,636;9,2127,91;26,2128;20,2129;25,267,2130;20,1346;26,1245;22,2131;26,2132;26,413;21,693;14,486,2133;26,2134;26,2135;12,1496,776;26,2136;31,776;12,98,2137;12,563,2138;12,388,1040;12,106,937;14,512,1497;26,2139;26,2140;12,456,2141;12,512,452;27,2142;12,2143,697;9,2144,91;12,2145;21,2146;20,1533;12,456,1425;14,512,2147;21,2148;12,2149,128;26,2150;9,2151,91;22,2152;19,2153,81,2154,83,2155;22,420,2156;12,2157;9,2158,32;9,2159,163;1,2160,585;23,693,2161,119;25,717,680;7,2162;12,2163,1115;21,177,738;27,1023;29,864;9,2164,170;12,2165;25,267,2166;9,776,38;12,512,866;21,8,89;21,588;1,4,224;22,2167;19,2168,81,163,83,588;9,2069,81;11,2169;26,2120;29,1775;12,106,2170;9,1204,8;9,2171,91;7,2172;2,1827,8,1,2173;2,2174,2175,1,2173;38,2176,8,2177;38,2178,8,2179;12,24,2180;25,267,2181;25,154,128;20,1310;20,2182;25,8,98;25,717,2183;9,2184,81;20,2185;26,524;12,42,2186;21,648;28,2187;12,456,2188;12,512,1088;23,693,2189;21,2019;9,2190,81;27,659,197,212;21,2191;21,2192,274;11,2193;23,1326,2194;23,1326,2195;12,2101;9,2196,91;9,2197,81;7,2198;14,841;22,2199;23,2200,2201;23,2200,2202;23,2200,2203;23,2200,2204;25,154,577;25,154,507;25,8,910;28,2205;25,8,2205;25,8,2206;9,2207,38;29,2208;14,456,2209;9,2210,163;22,2211;7,2212;7,2213;21,2214;9,2215,81;12,2216,776;25,8,1144;31,2217;19,109,81,163,83,128;21,807,274;22,2218;9,2219,163;9,887,163;28,1190;9,2220,32;12,907;22,2221;23,1326,2222;9,2223,32;29,2224;21,173;9,2225,114;25,267,2226;9,2227,91;9,2228,163;9,2229,32;1,2230,222;29,2231;25,810,889;26,2232;19,133,81,2233,83,2234;12,512,2235;27,856,8,212;20,2236;21,1802;12,2237;26,1344;25,717,2238;9,2239,2240;23,679,2241,119;23,693,2242,119;22,2243;22,2244;12,440,1144;21,2245;21,267;12,563,95;5,2246,2247,2248;21,2249;9,2250,91;35,2251;21,2252;21,2253;11,2254;14,512,2255;25,8,2256;12,456,2257;28,2258;12,456,972;21,452;21,2259;21,2260;12,440,173;22,2261;9,818,81;9,2262,163;13,860,2263;14,820,2013;14,1707,46;14,1493,804;7,2264;7,2265;12,546;21,2266;7,2267;31,2268;12,1775;21,2269;12,512,2270;39,2271,2272;12,1097,1921;9,2273,32;9,2274,32;21,616;11,2275;27,2276;31,504;9,2277,91;12,42,2278;1,2279,2280,6;21,1190,874;9,2281,32;9,2282,91;22,2283;9,964,163;7,2284;22,2285;29,842;25,717,2286;9,2287,114;25,717,179;9,2288,32;31,1155;27,2289;42,2290,81,2291;19,2292,81,2293,83,2294;1,2295,197;27,2296,197;21,2297;12,512,488;9,2298,32;25,154,776;29,2299;29,2300;7,2301;29,2101;12,456,533;21,2302;21,1190,815;26,2303;27,2304,197,6;21,438;14,42,2305;21,2306;9,2307,163;19,512,81,2308,83,2309;12,512,267;9,2030,163;25,717,2310;9,2311,91;14,109,2312;12,504,22;25,267,2313;11,2314;21,2315;23,525,2316,550;11,2317;23,475,2318;21,636;14,58,2319;26,2320;23,525,2321;25,1064,2322;21,2323;9,2324,114;25,717,2325;21,2326;21,1187;21,2327;25,154,1155;14,42,860;22,2328,2329;21,2330;21,2331;9,2332,81;9,2333,91;21,510;12,820,2334;14,2335,2336;26,2337;29,607;9,824,91;29,2338;9,2339,2126;27,473,197,6;12,2340,424;14,2341,2342;25,154,106;28,878;9,862,163;14,972,2343;21,2344;12,509,1161;26,1400;21,2345;26,1284;29,2346;29,2347;23,693,2348;7,2349;26,2350;17,425,2351;9,2352,91;17,2353,2354;13,2355,2356;27,730,465,6;9,2357,38;9,2358,38;9,2359,38;1,2360,197;20,2361;9,2362,389;9,2363,389;21,2364;12,629,456;21,600;14,512,804;23,525,2365;9,2366,81;29,2367;11,2368,389;25,717,2369;9,2370,81;21,2371;21,2372;15,2373;21,2231;9,2374,163;21,2375;9,2376,91;21,2377,2378;9,2379,74;9,2380,74;22,2381;21,855;25,267,2382;21,2383;21,97;9,2384,738;26,2385;26,358;9,2386,2387;21,2388;21,2389;9,2390,163;20,2391;29,730;12,109,128;12,41,473;12,106,2392;29,2393;28,2394;9,2395,163;9,2396,74;43,2397,1058,2398;43,2399,1058,2398;7,2400;2,2400,8,1,2401;22,2402;2,2167,8,1,2403;9,2404,32;9,2405,32;9,2406,32;2,2407,8,1,2173;3,2407,8,1,2173;38,2408,8,2177;21,1864,706;11,8,389;25,267,2409;28,2410;14,498,2411;14,486,456;31,2412;22,2413;25,717,1851;15,453;9,148,177;7,2414;20,2415;5,2416,2417;39,2418,2419;9,2420,2240;9,2421,163;12,440,2422;25,154,2423;9,2424,2425;25,267,2426;7,2427;19,2428,81,38,83,2429;26,2430;9,2431,163;25,631,2432;12,498,2433;12,820,866;14,512,600;1,2434,197;27,2435,197;9,2436,32;23,525,2437,119;25,267,2438;22,2439;9,2440,163;25,154,4;9,2048,163;21,2441;25,154,664;12,512,2442;23,525,2443;29,2444;31,507;29,2130;9,2445,32;9,2446,32;7,2447;2,2447,8,1,2448;12,518,2449;25,1022;9,2450,163;21,1714;9,2451,32;9,893,8;27,444,465,6;12,1388;9,2452,81;1,2453;21,2454;21,2455;21,2456;38,2457,2458,1673;7,2459,2460;26,2461;12,2462;2,2463;7,2463;28,895;12,509,22;9,2464,74;27,2465;22,2466;2,2467,8,1,2468;38,2469,8,2470;7,2471;9,2472,613;12,518,2473;26,2474;12,456,776;12,722,1031;12,2475;21,2476;23,679,2477,119;23,693,2478,119;14,475,2479;9,2480,91;9,2481,170;4,2482,2483,2484;9,2485,81;9,2486,81;9,2487,389;9,2488,8;21,2489;14,58,2490;26,2491;25,154,2244;22,2492,2493;23,693,2494,119;12,512,39;13,22,2495;14,109,2496;20,2497;20,2199,2498;9,2499,38;3,2500,8,1,2501;3,2502,8,1,2503;3,2504,8,1,2505;3,2506,8,1,2507;3,2508,8,1,2509;9,2510,2240;21,771;9,2320,32;29,2048;9,2511,163;29,2512;9,2513,81;12,509,2514;22,740,145,146;12,22,128;21,2515;22,2516,145,1370;25,717,2517;12,1372;12,456,2518;1,2387,197,6;20,2519;29,2520;22,2521;9,2522,163;9,2523,32;38,2524,8,1673;21,2525;29,148;12,820,2526;27,1880;21,1432;1,2527,465,6;29,1139;27,8,465,6;1,659,197,6;12,456,2528;25,154,275;20,740,145;28,2529;12,39,1512;9,2530,32;25,267,2531;21,2532;1,2533,1332;22,2534;23,693,2535,119;11,2536;28,2537;22,2538;21,8,2539;21,2540;2,2541,8,1,2542;12,518,2543;9,2544,8;25,267,4,379,2545;20,2546;22,2546;1,763,197;21,753,81;26,2547;12,24,40;9,2548,91;12,456,2454;9,2549,91;20,2550;25,631,972;20,2551;22,2551;20,2552;7,2553;7,2554;21,2555;27,2556;22,2557,145,1370;14,42,2558;9,1404,163;22,2559;9,2560,163;9,1412,91;9,2561,91;9,2562,81;9,2563,91;9,2564,163;22,2565;7,197,2566;22,2567;38,2568,8,2569;9,539,163;9,2570,114;12,456,525;22,2571,2572;9,2573,163;25,267,807;12,456,2574;2,2447,8,1,2575;9,2576,38;9,2577,81;7,2578,415;9,2579,2580;14,440,2581;21,2582;21,2583;26,2584;9,2585,91;9,2586,389;9,2587,32;12,456,1022;44;25,8,1687;14,820,1155;12,860,473;12,24,2588;31,2589;21,2590;26,2591;20,420,145;27,2592,465;1,659,197;21,1179,585;7,2593;9,2594,163;27,1880,197,212;27,659,197;12,456,2595;12,1134,2596;14,22,2597;9,1731,163;21,2598;25,267,2599;26,1852;21,1212;9,2600,114;19,106,81,177,83,2601;25,154,2602;28,2603;21,1719;12,440,1697;9,2604,91;31,505;7,2605;21,2606;14,388,775;9,2607,91;20,2608;9,2609,163;19,106,81,177,83,1144;22,179,2610;12,106,2268,2611;12,820,2612;21,2613;9,2614,613;29,2615;9,2616,81;11,2617;25,267,972;21,2618;26,2619;9,2620,389;7,2621;9,2622,91;22,179,8,146;1,1880,465,6;12,440,2623;7,2624;7,2625;7,2626;12,1134,2627;22,2628;21,2629;21,2630;21,2631,706;21,2632;25,717,2633;25,1544,2634;7,2635;7,2636;7,2637;5,2638,8,2639;5,2640,8,2641;5,2642,8,2643;5,2644,8,2643;5,2645,8,2646;5,2647,8,2648;2,2649,8,1,2650;12,512,40;1,1023;2,2651,8,1,2652;9,2653,163;9,2654,81;18,2655,138,2656,83,2657;9,2658,2659;9,2512,163;12,1134,2660;9,2661,163;19,109,81,107,83,2662;25,154,2663;9,2664,2665;21,2666;21,2667;22,2668;2,2669,8,1,2670;21,2310;21,2671;14,106,2672;9,2673,8;35,2674;20,2675;27,2676,8,6;9,2677,38;9,1235,38;2,2678,8,1,2679;22,2680;11,2681;12,1863,2682;12,509,1851;12,1496,2683;21,1851;21,37;9,2684,32;9,2685,81;21,2686;12,340,128;25,267,2687,379,2688;39,2689,2419;9,2690,38;22,2691;29,1404;2,2692,8,1,2693;34,2694,1,2695;4,2696,8,2419;9,1010;2,2697,8,1,2698;25,267,2699;12,106,2700;11,2701;21,512;23,525,2702,550;23,525,2703,550;23,525,2704,550;25,267,960;25,717,2705;12,820,2706;26,2042;7,2707;17,2708,2709;26,2710;12,106,2711;11,2712;9,2713;7,2714;31,2715;7,2716;12,1009,2717;22,2718;9,2719,1363;28,588;11,2720;1,8,419,6;11,2721;12,58,2722;9,2723,32;17,2724,2725;23,525,2726;25,717,1191;21,2727;9,443,32;28,438;25,267,2728;26,2729;12,563,2730;11,1423,738,987;7,2731;7,2732;9,2733,91;25,267,2734;22,2735;14,512,2736;11,2737;12,1468,2738;28,56;14,512,2739;9,2740,74;14,106,46;9,2741,389;9,2742,389;22,2743;9,2744,74;26,2745;9,2746,163;12,58,106;25,717,533;11,2747;25,267,2748;11,2749;25,154,600;19,664,81,107,83,2750;19,664,81,2751,83,786;25,717,1970;7,2752;25,717,919;12,820,776;25,267,2753;12,820,807;2,2754,8,1,2755;22,2756,2757;2,2758,8,1,2759;22,2760;21,2761;18,42,2762,2763;18,42,2764,91;9,2765,163;12,475,972;9,916,163;24,927,2766;25,267,2767;21,2768;38,2769,8,2770;5,2771,8,2772;9,2773,38;12,2774;21,2775;29,2776;20,2777;26,2778;41,2779,1504;41,2780,2781;41,2782,2783;41,2784,2785;21,2786;20,2787;29,2788;21,2789;14,1468,2790;26,1666;26,2722;22,1329,145;7,2791;7,2792;12,106,488;22,2793;12,820,508;9,2794,32;23,525,2795;39,2796,2419;20,2418;7,2797;26,2798;41,2799,2800;41,2801,2802;41,2803,2804;2,2805,8,1,2806;2,197,2807,1,2808;2,2809,8,1,2810;21,1058,585;9,2811,163;27,2812;1,2813,2814;21,2815;21,2816;12,456,2817;9,2818,91;19,664,81,2819,83,2820;23,2821,2822,119;1,8,8,81;9,2823,74;9,2824,163;9,2825,163;12,2826;9,2827,163;9,2828,163;9,2829,613;2,2830,2831,1,2832;2,2830,2833,1,2832;2,2834,8,1,2832;7,2834;7,2830,2831;7,2830,2833;38,2835,2836,1673;12,95,514;9,2837,32;9,2838,177;9,2839,32;9,2840,74;26,2841;29,2842;21,2843,874;9,2844,32;25,2845,473;9,482,163;29,2846;29,2847;7,2848;38,2849,2850,1673;38,2851,2852,1673;38,2853,8,1673;9,2854,389;9,1139,389;32,2167,2855;29,2856;21,128,585;12,512,2857;3,2858,8,1,10;36,2859,2860;9,2861,74;12,106,424;20,2862;7,2863;9,1789,81;9,2864,163;9,2865,91;13,2866,2867;12,1161,2868;12,512,873;17,2869,2870;5,2871,2872,2873;5,2874,2875,2873;23,525,2321,119;23,525,2876,119;12,456,2877;17,1968,2878;20,2879,145;9,910,163;25,797,452;22,2880;12,22,424;9,2881,8;12,512,2882;11,622,389;9,732,163;22,2883;9,2884,114;12,820,972;25,717,2885;12,512,1111;9,2886,74;9,2887,163;9,536,38;12,1134,804;14,512,2888;25,267,2889;12,456,2890;21,2891;12,109,2231;21,8,2892;21,2893;28,2893;15,2894;25,154,2895;25,1544,2896;9,2897,74;9,2898,170;21,1191;25,717,473;31,1963;28,2031;31,2031;9,2899,163;12,56;21,42,2900;9,2901,163;14,1134,2902;25,717,600;22,740,145,1370;1,2074,8,212;12,512,2903;13,1564,2904,153;14,512,2905;31,1663;9,2906,163;43,2907,2019,1051;14,512,475;14,577,2908;7,2909;21,2910;14,2153,2911;11,622,2912;12,2913,1506;12,518,2914;11,2915;22,179,2916;9,2917,91;9,2918,91;12,456,2919;9,2920,163;12,58,488;9,2921,163;25,717,1097;21,1452;21,1851,874;12,1365,452;21,2922;22,2923;12,512,2924;21,507;14,42,2925;22,2926;9,173,170;13,2866,2867,45,2927;32,179,2928;21,2929;21,8,419;27,2930,465,2931;21,2932;25,267,2933;9,2934,81;2,197,2935,1,2936;19,2292,81,2937,83,2938;25,717,2939;25,267,2940;9,2941,32;11,2942;26,2943;26,2944;26,2945;26,2946;26,1864;26,2947;9,2560,38;26,993;26,2948;12,820,2949;23,525,2950,550;21,2951;11,2952,389;22,2953;19,488,389,2954;9,2955,91;12,509,600;25,717,862;14,563,2956;12,664,972;25,717,195;25,717,2957;21,2957;9,845,32;25,717,1029;9,2958,38;9,2959,114;21,2960;17,1612,2961;24,927,2962;20,2963;9,2964,32;9,2965,32;9,2966,74;9,2967,74;31,179;12,820,996;26,2968;22,2969;21,179;45,2970;25,154,533;12,512,1022;20,2971;25,154,2972;34,2973,1,2974;1,2975,197;21,1427;27,2976,465,6;25,267,2977;12,820,128;7,2978;21,2979;25,2980,762;28,2981;21,2982;29,2983;25,717,2984;22,2985;11,2986;21,2987;9,2988;7,2989;11,2990;11,2991;25,717,2992;31,1022;21,2993;22,2994;20,2994;2,2167,8,1,2995;3,2167,8,1,2995;7,2490,2996;25,717,193;7,2997;22,2998;9,2999,91;9,3000,163;9,3001,91;38,3002,8,3003;3,3004,8,1,3005;36,3006,1,3007;25,267,697;12,824;9,3008,32;9,3009;9,3010;34,3011,1,3012;21,3013;25,717,3014;9,3015,163;25,267,693;12,1365,878;21,3016;28,3017;12,820,3018;25,1686,473;25,944,1864;21,3019;11,3020;21,3021;34,3022,1,3023;12,58,1179;9,3024,163;25,267,3025;21,195;21,3026;12,509,3027;12,820,3027;21,2323,465;11,3028;7,197,3029;31,937;25,154,3030;21,3031;36,3032,1,3033;11,3034;11,3035;31,3036;22,3037;22,3038;11,3039;12,193,488;9,3040,114;22,3041;21,3042;21,3043;19,3044,1697,8,83,3045;8,3046;8,3047;40,3047,1,3048;17,3049,3050;9,3051,32;9,3052,32;9,1123,32;9,3053,32;9,3054,91;28,3055;26,3056;9,3057,8;21,3058,745;25,1064,3059;9,3060,38;9,1539,38;26,2117;25,267,3061;9,3062,74;14,563,3063;34,3064,1,3065;24,1611,3066;1,3067,197,6;9,3068,163;11,3069;9,3070,163;37,3071,1,3072;20,3073,145;25,1544,3074;21,3075;15,112;25,267,3076;12,512,3077;21,8,3078;21,3079;9,3080,163;9,3081,163;22,3082;20,3082;21,3083;25,267,836;28,488;28,3084;21,3084;40,3085,1,3086;23,878,3087,119;12,1365,488;35,3088;23,679,3089,119;21,3090;35,3091;31,508;19,2153,81,2154,83,3092;27,1955,197;12,865,3093;20,3094;20,3095;21,3096;11,3097;25,267,3098;2,3099,8,1,3100;25,717,3101;21,3102;21,3103;9,3104,38;9,3105,91;19,109,81,2154,83,275;9,3106,32;19,106,81,3107,83,3108;3,3109,8,1,29;36,3110,1,29;17,3111,3112;9,3113,38;9,3114,163;28,1179;25,267,3115;26,3116;11,3117;12,477,636;25,154,3118;22,1942;35,3119;1,3120,224,6;12,58,3121;1,3122,197;3,3123,8,1,3124;19,123,81,2154,83,2350;35,3125;35,3126;7,3127;7,3128;20,3129;9,3130,163;12,512,3131;26,3132;29,3133;14,477,1053;22,3134;9,3135,38;9,1868,38;9,3136,32;20,3137;26,2163;20,3138;20,3139;9,3140,163;7,3141;25,8,3142;9,3143,163;19,3144,81,82,83,3145;20,3146;9,3147,8;7,3148;9,3149,170;15,3150;9,3151,74;9,3152,74;20,3153;9,3154,74;19,1858,1288,3155,83,3156;20,3157;22,3158;9,3159,163;9,3160,163;14,3161,58;22,3162;23,3163,3164,119;17,3165,3166;9,3167,163;20,3168;20,3169;20,3170;23,525,3171,550;9,3172,163;22,3173;46,3174,1,3175;29,3176;9,2490,91;22,3177;9,3178,74;20,3179;26,41;26,3180;29,3181;28,3182;14,3183,3184;20,3185;22,3186;22,3187;22,3188;22,3189;20,3190;20,3191;20,3192;9,3193,163;22,3194;22,3195;20,3196;22,3197;22,3198;22,3199;20,3200;22,3201;20,3202;28,22;28,2894;34,3203,1,3204;19,2292,81,3205,83,3206;34,3207,1,3208;34,3209,1,3208";

const $scriptletArglistRefs$ = /* 13141 */ "382;994,1706;1704;112;1532;26;94;444,587;26,453;2909;439,453,756,1092,1093;1654;1098,2083;1706;1267,2491,2492;26,439,440,441;1707,2157;1654;26,1461;1654;1654;1654;2735;3382,3383;28,365,478,485,1963;403,2689,2690;382,478;1341;529,1708;1654;3173;1020;2077;411,1654,1806;112;501,1093,1159;909;1654;1654;1654;2735;1654;2983,2984,2985,2986,2987;26;26,365,422,426,427,428,429,1706;453,962,963,964,965,966,967;1654;2933;994;365;1704;453,692;647;3188,3189;1706;994;1872;26,365,453,1708;362;107,108;26,2357;1792;112;389;112;389,393,422,796;107,409;453,2715;1929,1930,1931,1932;191,711;1461;3765;994;350;1654;26;26,414,994,1707,1834,1835;439,453,756,1185,1705;3550;26,478;1792;26,756,1186;26,353,365;602,692;1654;362;939,1257;131,143,541,683,1792;2723;1336;1654;785,1497;26;28,1709;1654;382,389,453,500,756,1369;112;28,29,381;218,219;2452;3461;29;634,2111;634,3669;1532;1707,2157;1828,3506;1707,2157;1710,2832;389,420,421,1704;131;1133,3550;3762;1654;655;478;26,1040;2209;3596;362;1654;1869;107;107;1654;1870;1654;1336;26,3696;1654;26,453,994,1544,1545;26,107,453,1531,1532,1533,1534;591;382,389,453;1707;365,382,629;26,422,1532;800;1654;26;1873;1654;2835;453;1264,1654,2563,3679;1654;26,27,28,29,1836;728;3717;1654;1392;365,445,473;1654;1256;1176;1532;994;2077,2078;1708;2088;26,107,453,1531,1532,1533,1534;1268;2176;1654;397,1665;26,365,753;26,1586,1593;994;1654;2839;26,27,28,29;1044,1654;541;26,441,442,443,807;1654;142;1267;2190,2191,2192;610;571;26,692,2504;26;26,414;3059;365,823;389;112;1461;898;3106;457;830;1098,1346;1799;1223;1708;26,382,453,543,586;1142,1180,1461,2614;446;2610,2611;591;390,994,2708;26;779;1098,1426,1708,2231;26,3101;1601,2698;994;1792;102;1792;3486;1792;359,360,1792;414,415;591,625,1678;370;107,1773,1774,2413;2213,3024;331,1263,1654;710,2417;389;2872,2873,2874,2875,2876,2877;409;124,2020;1654;1792;2090;1792;3157;2371;2382,2512,2579;1371;26,414,1834,1835;26;376,593,816,817;1442;353;26,439,453,756,1185,1705;453,1183,1184,1706;1495;371;1461;1706;3289;409,2442,2443;459,613;362,1654;131,143,362,541,618;1240;389,498,994,1532;1260,1654;1336;1671;26,1320,1705;1532;26,769,1705;591,1269,2347;1706;1336;1332;1336;555;365,382,499,629,845;1196;1654;112;1774;1461;26,3070;1461;29,545,591;591;1810;1143;1143;1143;591;29;26,623,1247;564;416,1101;3183;1098,1647,2231;3188,3189,3525;285,286;454;365,454,478;3137,3138;2543;1654;1532;1654;2806;714,715;26,1461;453;3582;26,453;473,591,1179;851;591,1532,1678,2927;692;1654;1461,1462,1463,1464;3489,3490;1732;3692,3693;1532;1708;994,1122,1123;1654,1792;1654;2038;107;26,830,1707,2115;1774;906,1705;1264,1654,1660;685;2868,2869;26,441,442;1654;124,704,2077,2305,2885,2886,2887,2888;1654;3381;1532;478;26,1610;2538;169,170;134,135,2505;389,454,478,856;112;365,382,629;26;-404,-2690,-2691;26;26,394,478,575,629,710,751,766;3294;3480;1322;1775,1776;26,785;782,1172,1654;29,634,1922;1461;514,1111;545;1295;1654;26;420;26,994,1707,1719;478,1532,1707;1654;1990,1991;478;1792;26,416,1711,1850;994;1532;169;1792;453,1705;1424,1425;1732;26,422,460,461,462;477;2843,2844;1705,1706,1707,1710;1792,2631;1792,2631;3050,3051;26,28,397,602;26;782;1593;26,1706;591;26,50,51,52,53,54,55,994,1532;462;365,382,478,629;1707;26,501,1159;29,591,3476;501,1093;1032;111;1902,1903,1904,1905,1906,1907;1102,1103;1705;124,3182;1774;402;1870;1732;1707;442,807;442,807;60,61,1259,1266,1654,1792,1802,2449;2255;384;370,1792;613,1188;362,1775,1776;491;26;26;1654;112;1461;56,57;26,994;2091;1532;1532;225,362;692,1707,1712,2879,2880;1461;591,1690;1707;453,756;591,1596;1461;56,57;26,591;591,623,871;1792;3707;1532;994;478,543,3075,3077;655;1732;444;1098;26,453;1053;358;2892;1122;1277;467,591;1654;26;1346;1654;1654;634;29,131,591,2262,2263,2264,2265;1792;1810;1180;1538,1560,1561;2465,2466;591;26,478,1708;1461;1461;1654;362;63;26;591;362;1654;1704;785;26,591;498;1461;2758;29,591;1608,1628;1608,1628;26;1675;26;26,1732;453,1494,1495,1496,704;2798;832;1707;1732;26,1732,1733;1708;2596;26,453,1098;1157;1774,3731;26,3663,3664,3665,3666,3667,3668;26,478,1705,1707;409,1760;1245;1767;1610,2765,2766,2767;1461;498;3142;1654;3120;26,573;414;26,1532;26,50,51,53,54,55,1532;26;26,414,994,1834,1835;473;1085;381,389;1245;2982;1792;1134,3550;1322;1461;93;28,994;453;1704;1532,3097;634,1603,1604;26,394,602,692;478;2073;414,948;1706;1654;453,692;994,1716;1704;331,372,1263,1655;3516,3517;838;409;1707;26,1532,3097;365,729;1677;1532,3281;2957;389,2483;365;994;994;1336;356,357,358,1256,1654;1461;1654;107;2130;26,1708;454,1705;358;473,545,1024;1654;1654;3196;3196;1461;1826;26;2950;1789;1742;935;370;859;3352,3353,3354,3355,3356,3357,3358,3359,3360,3361;422;26,416,1101,1728;439;591;429;1867,3730;26,382,548,570,571;433,570;433,570;26,573;334;2122,2123;591,2825;1704;29;3724;591;994;1707,2157;173;2290;26,1705;2556;2290;1792;2290;637;2290;2290;2290;590;26;1461;2290;56,57;56,57;1792;1653;124,1898,3786;666,1792;1654;112;389,453,756;26;400;716,717,718;600;1767;1495,2490;26,573;478;1732;3784;26,2509;389,394,439,453,499;26,1845,1847;2693;1708;2347;107,2413;2305,2885;2735;26;422,1709;1705;56,57;453;1706;783;2688;107;2117;26;2845;334,1405,1406;362;26;1706;389;3716;2698;1494;591;498;394,478,1015,1016,1017,1707,1708;1810;26,573;382,389,453,478,586,856;729;393,1744,1745;2951,2952;664,665,1707;26,1706;980;1654,1792;26,472;381,591;454;26;56,57;1466,1467;1654;1708;365,382,1708;1654;1654;1654;1654;1654;1654;1654;1654;1654;1749;587,634,1608,1611,1614,1615,1616;475;2698;2021;433;587,634,1608,1612,1613;591,1461,1672,1673;591;416;2382;602,692;602,692;602,623,692,2239;602,692;1718;1482;1461;2646;432,1111,1112;26,3589;1532;26,365,393,478,553,554,555,556,1704;498;112,1475,1476;957;3732;975,985,2392;1647,3681;1654;1858;1654;1053;362,1257,1654;803,967,1549,1550,1551;26,416,1711,1850;655;1322;453,756;1792;29,414,514,545,591,2128,3387;1707;1706,1716;743;467;1654;1196;1707,2157;478,936;26;26,453,478,756;1038;1397;1261,3123;2897;1654;26;26;1706;1792;1729;1408;3282;75;1245;770,2594;26,453,756,1610;1080;26,994,2068,2158;1532,1707;372;896;365;1706,1711;26,442;1712;1705;26,1366,1735;2102,2103;1792;26;422,1705;1709,1710;26,416,478,602,994,1532,1705,1729,3022;1732;493,494;678,679,680,681;26;400,678,679,905,1532,1707;2404;2093;26,27,28,29,1836;131,143,1792;353;1927;1927;26;124;26,1189,2412,2418;1095;1668;1705;1532;550,1170;173;478;1939;1657;1789;682;1654;1858,3029,3031,3032,3033;3526,3527;1461;453;1207;2365;365,823;2646;26;56,57;942,943;591;591;591;26,692,1532,2504;3623,3624,3625;1217;3589;401,422,613;591;1705;2352;107,823;416,1532,1732;56,57;454,860;1461;141,3167;365,998;453;1532,3097;223,224,2211,2212,2213,2214;1491;112,447,448,449,450,451,452,453;416;26,3185,3555;2221;400,427,498,994;1532;56,57,1532;1709;56,57;994;895,2124;131,887,892,893;612,613;3381;26,473;26,1706;432,464;1461;1366,1367;56,57;692,994;56,57;545;26;26,994,1532,1963,2021;994;1315;26;26,1706;650;3076;409;1741;101,3705;717,3062,3063,3064,3065;453,499,756,1708;26;26,382,453,1705;453,756;785,1497;2604;3572;389,484;1789;3743;362;1792;1532;1706;634,3589;365;2161;571,929,1285,1532;634;29;1942;26,2499;634;26;634;1461;1705;3535;1532;1933;1411;3597;376;1715;400,1014,1706;1707;112,1475,1477;2128;591;358,1336,1461;626;112;942,943;432,584;26,1532;1706;405,407;26,1152,1532;1704;1721;389,453;1654;1946;1461;1461;500,1705;1654;389,979;1309;3042,3043;3787;1654;2752;56,57;741,866;409;3295;1032,1033,1034,1035;334,1741;26,2775;660,954,3338;3300,3301;1792;1708;478;26,29,1532;1373;785,1497;591;1174;585,611;1044,1654;629,1095,1704;453,692;785;1532,1707;1707;3381;1654;687;756,904;453,756;1610,2765,2766;441;26,414,994,1834,1835;26,414,994,1834,1835;416;1461;896;3018;382;1705;1654;26;1461;56,57;591;26,414,994,1834,1835;26,414,1532,1834,1835;2810;994;26;26,414,1532,1834,1835;1532;1792;1010,1279;26;352;26;1461;591;2412;28,1762,1763;590;1774;1748;389,587,734;112;994;1717;372,1654;26,994,2531,3095,3096;1692;994;994;1532;402;3042;467;584,2497,2498;591;1465,1466,1467;1705;107,3394;362;453,1467,1494,1495,1496,704;402;26,1532,2575,3097;591;2281;455;591;994,1707;26;1092;552;372;591;1532;824,825,1532;26,1602;1706;704;26,994,2531,3095,3096;1532;1705;1732;1461;1706;1709;2090;26,27,692,1707,3036;453;2453;234,235;2186;466,1775,1776;2358;1532,1672;483,591;2049,2050;433,548,571,591;1461;381,389;26;1448,1461,1548;1461;613;514,545,591;514,545,1855;1708;2957;401,403,770,1690,3558;1532;2070,3750,3751;1729,1731;1461;1707;3391;1242;1461;1706,1707;3606;3605,3606,3607;26;432,591;26;1712;1245;1532,3308,3309,3310,3311;453,1435;1461;923,924;56,57;1461;3363;885;1461;107;26,433,591;1532,1708;680;26,692,994,1532;2788,2789;1705;785;26,994,2531,3095,3096;591;1707;1461;1532;581;29,389,1676;56,57;1532;1532;1654;1461;1385;1706;1196;1098;591;26,1707;983;2215;812;26;1532;1461;1269;810;430;1706;2256;454;26,382,548,571,572;26,382,570,572,808;26,382,548,570,571,572,573;2149,2150,3736;26,382,548,570,571;1744;1654;779;1242;293;376;2944,2945;2232,2233,2948;402;26;1705;1654;30,31,32,33,34,35,36,37,38,39,40,41,42,43,44,45,46,47,48,49;591;545,591,1461;591,1240,1341;2522;29,545;29,573;591;29,545;3521;29,1742;591;3699;545;478;26,1705;402;1461;1180;26,948,1050,1610,3045;26,1705;600;1707,2157;1707,2157;195,331,1654,1656;26,602,994;591,1678;29,591,1707,2128;994;591,1461;1878,3568;56,57;26;56,57;1462;1654;984;660;353;453;454;467,591;26,478;1461;716,717,718;3400,3401;389;1798;1705;1207;2363;104,105,107,108;1063;26,1532;365,691,692,807;90,3643;1792;1210;365,3073;591;1031;1532,1672;1238;26,28,394,397,602,692;2558,2559;358;1461;26,947,1708;411,1654;1654;573,2323,2324,2325,2326;75;26,545,623,867,1525;453,756;1131;26,1846,1847;365,1706;1706;994,1532,3242;362;779;216,217;1461;591;26;376;382;624;1705;26;26,476;591;1448,1461,1548;2932;1461;2574;1789,2014;1062,1654;1101,3462;602;29,553,3092;1707;1461;1654;591;994;3407;1706;1461;3770;107;1532;2128,2412;1870;26,3555;26;2779;1461;1939;1775,1776;1708;1861,1866;1461;362,1792;498;26,365,1160,1706;1461;1245;401,467,591;26;1461;2292;3660,3661;994;1789;591;1984;1767;620,939,1654;26,1095,1710;1461;1654;1242;26;1789,1792;591;1532;1881,3385,3386;26,1705,1706,1707;1461;29;1465,1466,1467;591;591;26;467,591;462,742,1128,1129,1130;389;26;571;591;26;249;1654;382;1233;26;1461;2298;2751;591;453;1209;803;1654,3675;3492;1709;2956;1484,3498,3502,3503;26,462,742;1671;26,454;545;511;2139;1465,1466,1467;1465,1466,1467;1572,1573,1574;1445;3307;3192,3193;334;3397,3398,3399;26,1491;453,756;1654;1707;1708;1678;2210;2993,2994;994;602,692;602,692;800;358,591,850;123;3482;3037,3038;1706;453,692;591;591;26,3521,3522,3523,3524;1461;1706;1792;1461;2698;26,478,756,1186,1704;634,2406,2684,2685;1086;365,389,439,453,559,756;453,756,1542;389,542;1461;543;1532;652,653;1712;502,1177;782;1713;1532;332,1654;826;409;2742;240,1579,1580;26;26,1532,3410;26,1532;26,416,1711,1850,1851,1852;3775;3677;973;1465,1466,1467;29;1051,1957;1654;1705,1706,1707;365,543;960;545;1436;942,943;1454;453,1644;1705;1245;1359;1142;502,503,2194;1926;26,2878;1336;1768;26,994;29,591,2059;26,112,393,1706;591;365,400;439;1465,1466,1467;56,57;213,214;1465,1466,1467;1699;591;634,3222,3223;1269;991;1654;1341;414,571,591;75;942,943;26;1461;1185;464,1003,1004;1380;591;1654;1712;1708;1811;1350;414,591;1196,1666,1667;1705,1712;2217;390;564,1704;1461;389,539;26,393;26;56,57;1708;2550;928;372,375;26;26,29,1532,3655;26,29,86,1532,3655;1705;26,29,414,1532,1834,1835;26,28,394,397,602,692,769;1672,1732;26,919,920;3346;1732;1532;1654;389,453,756,757,758;26,1532,2539;1556;453;1465,1466,1467;26,833;1461;429,679,1101;453,823;26;1290;-1367,-1368;1243;2848;1465,1466,1467;1465,1466,1467;1741;26;994,1099;1461;1258;1705;26;801,1467,1469,1470,1473;3344,3345;107;402,2154;1461;1461;29,1671;414,571;3316;2646;467,1211;433;56,57;810;389;591;613,1188;3037,3038;1708;921;26,401;2190,2191,2192;1461;571;591;591;26;26;1705;1797;1448,1461,1548;1708;3347;26,441,442;462;1707;26;785;1705;994;1246;1774;2268;2754,3728;3727;1532;602;1609,1610;531;602;1707;28;26,769,1272;994;246,247,1606,1876;26,1651,1741;505;2376;2032;1705,1707;1708;26;692,1708,2293;26,994;830;1461;1461;543,1707;1762,1763;1461;993;994;1532,1570;1654;954;591;531;26,3555;779,2051;1706;994,1532;401,433,548;591;26;3585;26,1532;462;1532;409;994,1706;1654;26;473,1706,2021;26,3283;1132;717,3062,3063,3064,3065;26,2605,2606;409,453,545,591,994,1532,1960,3060,3061;1314;3622;692;1705;26,414,1532,1834,1835;26;3695;321,322;1461;770;29;1461;26,1706;2495;601,1532;365;634,3589;1706;1705;26,545,1532;1532,3308,3309,3310,3311;994;2352;1461;740,741;1532;545;1654;28,393,432,454,467,809;358,2283;409,1417,2476;1706,1707;422,1718;3787;3787;3787;3787;3787;3787;591,1729;1654;2480;1465,1466,1467;1465,1466,1467;942,943;704;545,591;1708;994;394,1017,1707;400;2918,2919;1532;3521;1461;591;1461;1676,3658,3659;454;2229;1706;3126;2546;971;453;591;1461;476;473,1709,2021;1461;26;931,932;26,1366,1735;591;1245;1506;1180,1461;591;1870;730;2432;26,433,591;29;1461,1762,1763;1461;1792;498;1707;422;107,409,2574,3238;1792;462;1461;613,867,954,1035,1188,1697;502;613,867,869,954,1035,1188,1697;454;1792;939;1792;1461;1654;1799;1101,3462;528,529,530,1708;960;591;1762,1763;3381;26,629;77,107,2807,2975,2977,2978,2979,2980,2982;3709;672;1115;2580;954,2299;779;267;1461;2706;409,1760;1654;1322,1461;1461;1207;1707,2341;3578;1705;382;591;1131;2362;591;26;454,732,733,1708;453,1494,1495,1496,704;453,1494,1495,1496,704;374;26,414,994,1834,1835;26;2679,2680,2681,2682;1461;390,810;26;591;1261,1654;529,530,1708;1384;107;2698;-27,-1533;107;1572,1573,1574;654;1792;752;756,1708;545;591;927;362;1707,1732;618;107;1095,1222;2855;1712,2360;1792;1207;1465,1466,1467;1527;1706;453;2881;1040;756;756,1309,1708;453;317;502;590;591;2894;1707;1238;28;26,1366,1735;2580;3082,3083;1429;1706;389,478;467;2514;432;1312;1741;1461;453,1494,1495,1496,704;453,1494,1495,1496,704;1654;400;1705,1706,1707,1708;478;2090;1708;1326;453;1654;162,163,1305;26;498;28,29;591;69,1461,2668;-27,-28,-29,-30,-1837;983;1706;1705,1706,1707,1708;529,530,1708;26,1228;1461;1220;1350;2716,2717;26;26,591,983,1532,1707,2528,2529,2531,3097;26,28,591;634;591;994;1546;1705;2992;1532;994;1706;1710;26;1654;1461,1491;1792;1938;1671;3559;994;994;1532,1582;1654;591;1708;1654;3451;1245;3718;26;112,453,564;1059;1705;1705;3037,3038;26,1187;1461;591;496,624,677;1098,1708,2083;550,2124;1436,1461;1461;1654;651;671;680;26;26;1635;1706;1792;528,529,530,1708;3381;1098,2240;1647;1033;2489;1461;1461;3417;64,65,66,67,68;1792,1806;684;2099,2101;994;770;2369;1245;1461;1706;634;668;1705;1245;26,544,692,994,1732;-27,-1102,-1533,-3575;1245;544;1245;1245;1245;1709;1461;365,735;3144;929;1654;2698;1654;26,2746,2747;1854;1461;1269;1654;2590;591;1196;896;389,994;456,457;28,1732;994;1705;1792;1461;28,591;376;2964,2965;26,29;26;26;591;3117;1229;850;1532;1708;1706,1707;462;591;1098;559,1442,1443;505;3694;3694;3694;1461;637;26,637,1650;3604;1709;1322;591;1461;1762,1763;680,2709;1671,1705;887;2121;393,1744,1745;29;393,1744,1745;2177;393,1744,1745;393,1744,1745;393,1744,1745;99;634;1461;1461;2425,2426;2707;1862;1704;1910;1789;1461;1461;1789;370;86;1119;1708;29;591;29,1742;602;591;591;591;1762,1763;591;3521;26;29,1742;591;26,28,29,3258,3259,3260;591,1461;3521;2225,2308,2309;591;29;639;602;591,1741;591,1342;591;591;29;514;454;591;591;29,545,728;3239;1766;1461;453;1706;1461;1654;591;1461;1572,1573,1574;1741;545;1654;26;26;1706;2290;26;2290;2290;1207;591;26,591,994,2531;1461;785,1985;1647;1707,2157;1707,2157;1707,2157;390;1779;987;988;365;2290;1707,2157;2290;1570;1654;839;1461;103;591;591;2290;1449,1450,1451;1461;189,190;545;1582,3514;112;1705,1706;26;2094;1461;3730;2581;454;1461;2526,2527;453,756,2183,2184;26;1708;1706;2595;1707;1792;1229;1705;365;1707,2579;1491;1461;1575;1245;2662;414;109,184;1654;1921;416,691;939,1654;3507;3571;305,306;29;29,545,994,1707,2128;1705;1408;1245;2165;633;107;634;2698;994;591;26;453,1562;453,756,1247;1708;453,1562;3037,3038;1101,3462;634;1792;3109;26,951;409,529,1122,1678,1688;26;1532;3342,3343;634;414;26,932,1842;2625,2626;655;2847;545;382,500;486;545,960;26,2118;26;511;994,1706;26,994,1461,1532,2134,2668;26,1705;26,500;26;1708;465;382;26;994;26,376,1249;1321;454;1353;414,1878,3632;414,634,1729,1878,3632;1732;2696;2636;953;1789,1811;393,467;3577;358,1461;1874;1707;1705;1066;1708;1180,1242;1210;840,841;1532;1709;26;1301;362;873;1806;3459;878;26,575,629,710,751,766;1274;329,1661,1810;26,1532;1532;858;1461;1705,1706;2481,2482;1654;29;1705;1461;591,1461;26;26,1382;1461,2389;-27;2700;1654;591,1187;1461;1461;2251;830,1706,1960;1710;1755;1600;370,3735;29;885;1461;891;467;1122;26;2156;409,1357,1461,1760;779;26;591;1762,1763;429;382;1654;1708;1705,2937,3046;1322;1311;634;785,1497;1461;2698;1784,1785,1786,1787,1829;487;478;1461;2294;1654;394,478,1015,1016,1017,1707,1708;1654;1495;414,571;1792;1792;1708;591;393,1744,1745;505,584,591,710;1461;-383,-390,-454,-479,-587,-857;1705;545;1654;634;2697;107;370,1654;1731;994;805;1495;29,545,1461;1461,1532;26,50,51,52,53,54,55,994,1532;3210;1461,2930;1336;26,545,591;454;393,660,1211;26,478;591;26,381,510,511;591;571;467;591,871,2207;26,813;3216,3217;1676;401,478,545,591;478,591;479,480;26,382,394,395,3367,3368,3369,3370;26,382,394,395,3367,3368,3369,3370;26,382;26,382,394,395,3367,3368,3369,3370;26,382,394,395,3367,3368,3369,3370;1784,1785,1786,1787,1829;26;26,382,394,395,3367,3368,3369,3370;26,382,394,395,3367,3368,3369,3370;26,382,394,395,3367,3368,3369,3370;26,382,394,395,3367,3368,3369,3370;568,1430;1519;602;26,692,2087;729;1774;1495,1654;2735;1147;1461;1676;1431,1432,1433,1434;756;1397;2267;1789,2680;1291;350,782,1780,1781,3635,3636,3637,3638;514,545,1732,2662;1492;370;545;1053,1461;591;1461;1134,3550;402;26;994;1461;704;3519;404;3233;741;2513;3278;3521;2698;591;380;29;1676;2006;26;1729;994;402;1154;785,1497;1461;602,692;3327,3328,3329,3330,3331,3332,3333;1792,3575,3576;1091;402;1532;1706;1708;1180,1242;381;2588;591;954,1309;1371;545;591;591;591,2810;2188;26,112;26;994,1967;2669;591;880;1784,1785,1786,1787,1829;389,394,453,756,1207,2074,2075;453,626;26,453,756,1021,1098;1461,1532,1633;365,389,439,453,559,756;453,756,1542;389,394,453;2165;433,1854;362;29,1679;2197;453,756,994,1552;772,773;409;3595;1532;1532,1705,1729;1461;1741;381;1495;1461;1287;1654;1654;1654;26;1709;2856,2857;358;2950;1532;1706;26,397;930;409,1760;26,416,994,1850,1851,1852;26,602,692,2238;26,416,1711,1850,1851,1852;1461;1484,1485,1486,1487;2174;1784,1785,1786,1787,1829;1654;1248,1961;3170;29;861;1436;877;26,376,820;1346;2052;454,591;1245;2203;1532;26,901,1710;365,629;1461;591;1705,1706,1707;680,2937;2582;502,1676;2555;634,3221,3223;1461;1109;577;365,400;422;389,401;531;2266;874;3534;752;467,625;660;1858;389;1606;2300;3047;29;400;1242;26,112;1461,2701;2698;370,1792;2273,2274;330,1263,1654;467,548;1706;3468;467;128;176,177,178,179,180;591,624,1706;994;569,658;1532;107;1732;453,704,1494,1583;591;1712;26,1022,1704;26,559,2336;467;1980;29,1494,1532,1722;591;825,1706;567,1707;112,420;26,1705;26,422,2275;994,1532;120;1461;1532;3726;26,994;1712;994;1712;1465,1466,1467;1532;994;1532;453,1444;1532;389,453,756,1705;1633;1065;2879;1712;704,1647;26,454,500,543,602,655,807;1705;1705;704,823,3611;3201,3202,3203;1098,1245,1370;26,3472,3473,3474;602;1708;26,1704;26,414,1532,1834,1835;26,1532;634,2552;453;1366,1367,1735;416,679,905,1707,1729;1749;905;26;478,3346;26,468;2528;1732;3521;26,414,1532,1834,1835;26;655;1325;1532;389,1706;125;1532;107,2850;1705;1654;1122,2949;704,2305,2885,2886;26,514,545,1732,2662,2663;334,1598;2361;417;3174;26;1706;1729;26,429;3690,3691;1654,1792;1783;26,1532;3563,3564,3565,3566;514;505,591;381,571;112,705;3037,3038;3037,3038;3037,3038;3037,3038;2637;487;3594;942,943;26,544,615,1705;591;591;26,1461;414;454;591;26;591;591;29,454;454;949,2066;591;420;2810;942,943;2720;591;2524;591;389,1707;26;2698;454,1532,1707;389,1707;353,707,708;1461;1708;1706;394,591,1708,2032;467;634;1706;400;1245;1532;1178;591;26,994,2531,3095,3096;26,947,948;1495;99,239;994;1732;657,770,1708;591;478,994;1707;1110;2778;1705;994,1532;478,769;389,994;1245;591,1741;26,830;278;29;994;26;851;1705;880;188,3267,3268;1461;26;591;1417;1454;1461;1654;1023,1704;1461;626;26;26,591,639;1242;994;1461;603;1707;994;2084;591;1707,1743;124,280;26,3408;791;3545;29,514;1461;389,626;769;1461;498;358;655;1561;634,1588,1608;958;1461;655;1461;358,1336,2698;613,1188;1706;1792;837;624;26;602,692;634;624;942,943;26;29;1920;1708;409;389,409,420,421,1705,2045;591;1532;1532,3308,3309,3310,3311,3313;1707;112,1098;2200;602,1095;26,479,2646,2733;942,943;425;2012;559,1442,1443;1461;1942;1706;453,756;655;2198;655;575,629;1461;591;3701;1180;467;478;2698;1792;1762,1763;1220;26,28,397,478,602,918;514;1708;1706;26,478,1532;29;635;1180;382,473,787;1654;745,1654,1792;2735;107;1654;1973;1461;972;1242,1461;545;1461;1538,1560,1561;1407;2229,2230;994;26;467;1654;549;424;467;1461;591;591;1704;1706;994;414,571,591;107;26;3381;1180;2241;26;409,668,1098,2379;409,1242,1461;26;545;26;591;1784,1785,1786,1787,1829;655;1708;850,982,1180,1461,1470,1499,1500,1501,1502,1503;1792;830;1461;26;409,1180;591;3721,3722;994;1742;1495;3130;704,994,1719,2312,2313,2314,2315;591;545,3698;26;1712;1257,1654;237,238;3680;655;801,1467,1468,1469,1471,1473,1474;107,409,2574;626;591,2398;1654;1654;1461;1706;416;107;1461;393,511,613,741,1177,2068;660;741;26,433,459,502,741,871,901,2068,2932,3634;895,1461;107,1774,2413;1705,1706,1707;1461;3673,3782,3783;362,1657;799,800;921;1716;3657;1893;1792;107;107;2071;2267;1708;1619,1646;1540,1541,1645;3214;1461;358;1019;3418,3419;389,591;2627;922;29,2805,2806,2807;543,1704;545;529,530,1708;2505;112,365,414,547;112,1477,1504,1505;3035;358;107,2564;994;1245;1245;1532;409,1269;26,453;389,453,756;453,1494,1495,1496,704;26,453,478,547,756;1583;26,1532;26,365,478,694,2504;591,3543;29;3504;1461;1461;3700;1546,1762,1763;1465,1466,1467;382,702;334;112;1092;1769;1427;2750;26;3754;107,453,2302;1470,1507,1508;617;439;107,1461;2622;1101;1461;60,61,1788;1461;3392;1461;654,744;382;444,564;1705;365;1708;2440;453,756;26,414,994,1834,1835;3113;3683,3684;26,29,591;1732;1532;26,382,453;508;1101;389;1470,2963;1000;112,406,408;819;545;1336;1654;1461;358;695;2288,2289;1532;1532;26,591,2531;994;1532,1899;26,535,536,537;2008;389,453;439;641,642;591;26;433,467;1350;591;353;846;26,376,478;3006,3007;1676,1686;353;453;1461;1461;56;2782,2783,2784;2332;591;2519;1532;376,2341;2950;1532;1461;1840,1841;1461,2016;1705;467;921,1609,1611;1623;1532,3308,3309,3310,3311;1723;26;1714,3325,3326;602;994;1707,2525,2660;634;901;26;960,1725,2152;28,602;994;26;26;26;26,932,1842;1946;75;3479;626;3589;26;350;365;26,1495,3060;1532;1461;107;1532;1495;743,1705;26;365;2654,2655;1461;389,1707;1675;409,1760,1761;942,943;994;26,29;1941,2693;26,639;994;704,1708,1729,2225;830;1461;1532,1582;1831,1832;1764;1654;1654;1077;1810;1654;2039;1346;505,867;591;181;1297;28;1654;2735;26,467,571;439,1705;2912,2913;1654;1792;591;26;467;75;112,1475,1476;103;3645;634,1539,1540,1541;26,1608;1709;1245;1245;994;1245;1208;782;1245;1707;1245;1461;26,27,543,544,545,1707;1245;1245;1461;864,1448,1461,1548;1245;1532;26;591;1707;1461;545;1883;389,777;1461;432,475,591;3171;1461;2436;1245;478,1708;1812;3473;26;107,648,649,650;655;282,283;403,3558;1654;598;1461;637,692;727;376,478;656;1705;591;432,463;1532;432,1111;2539;591;591;591;505;2905;994,1532;1706;1732;1461;1461,1719;2890,2892,2893;1704;591;743;1461;591;1101,3462;545;2469;433,901;107,2413;2665;591;591;591;26;26,2144;591;2811;3694;-27,-638;1245;26;1019;650;26,1707;1245;545;654;2772;1461;1245;1647,3540,3541,3542;1705;26,602;1461,3150;1417;112;26;393,1744,1745;393,1744,1745;393,1744,1745;393,1744,1745;26,382,570,571;432,433,434,435,436,437;393,1744,1745;1526;591,1592;1974;2451,2652,2653;382,414,478,575,629,731;1792;1792;1744;1167;402;1705;389,1707;1020;1792;362;626;1705,1706,1707;3381;439;942,943;942,943;942,943;994,2749;591;334,514,591;381,401;29,514;514,591,1461;591;591;546,1676;591;402,591;29,1676;602;29;29;591;591;591;591;29;26;1461;358,2566;1095,1706;2146,2147,2148;103;1732;827;803,967,1549,1550,1551;1461;2052;1251;591;1461;1461;1532;1601;571;260,297;1461;591;1707,2157;1461,2013;1706;692;26,409,1705,1709;692,710;26;545,573;1705;776;1654;545;1946;1461;1289;389,390,1711;571;791;2290;1245;681;1122;1461;1810;370,1288;257;2070;358;2403;2504;1491;1278;591;1954;1792;1461;2797;1704;1654;1706;994,1461;1654;453;112,626;1532;389,453,495;390;389,1706;1705;1705;453,756,2089;1461;1654;1098;439,692,1705,2935;1705;26,381;2693;414;1436;1122;26,28,1247,1532,1678,2927;26,1532,1678,1732,2927;26;3094;2234;26,1532;26,1532;1091;1414;2731;29;653;1461;1792;1707,2809;29,1707,2128;591,1705;812;545;514;401,591;107;591;1711;602;1532;1705;1950;634,1532;2423;1654;1285;940;26;1654;1706;2711;3758;499,1706;1532;1053,1461;1245;994,3109;1461;453,756;478,853;634,1582;1705,1706,1707,1708;1461;26;591;86;1705;26;454;26,994,2531,3095,3096;26;1210;1586;994;3559;1532;26;994;26;26,1707;26,478,1707;1708;26,994,2668;994;1707;1709;26,692,994,1532;26;1708;1708;389,1707;1706;26,994,1532;389,1708;1706;26,2330;1706;26;885;2110;1792;2228;1654;944;591;414,1878,3632;362;2216;26,403,2741;26,3589;994;591;26;1033,2345;1461;2090;543;591;944;1101,3462;1705,1706,1707,1708;1708;782;830;2836,2837;26;29;26;29;3320,3321,3785;591,1762,1763;634;602;1654,1795;791,2495,2793,2794,2795,2796;1383;3171;1704;1705,1706,1707,1708;26,3364,3365,3366;1705,1706,1707,1708;2904;1445;392;1461;1461;2205;478;478,591;1336;1708;1069;29,1461;591;1245;26;1742;1352;994;26;994;26;541;1245;409,3552,3553,3554;75,107;26,81,82,83,84,1532,3341;365;112,1710;1461;2781;1399;244,245;2695;1299;26;415;26,573;107,1483;3135;409,1760;1710;1853;3381;3735;107;1461;1461;655;1654;1792;2033;1461;444,453,499,804;1900;362,1792;3644;389,1707;26,394,478,575,629,630,1721;1242;2072;26,994;453,756,1709,1710;591;3207;591;393,1744,1745;393,1744,1745;393,1744,1745;393,1744,1745;1886;591;2372,2373;478,729;1366,1367;1461;393,1744,1745;1744,1745,1746;1707;994;2433;2433;2433,2434;796;1705;1532;1262;1515;785;400,1707,1960;1762,1763;107,1774;1336;26,3763;26,591,639;591;591;591;591;1005;521,522;389,432,762,763;591;623;591;591;462;2651;591;26,401;591,1676;467,591;591;3450;454,591,862;547,660;591,909;591,785;467,591;591;29,591;591;26,392,571,1141,1142;26,400,1706,1707;26;26;26;1792;26;545,634,1705,3642;289;1654;607,608,609;591;1461;3406;394,404,500,994,1532,1704;591;1643;28;107,2394;473,2291;994;3381;1162;545;1706,1733,2245;29,1732;545;1461;1654;1220;3255,3256;2990;381;26,3555;1671;1671;505,591;453;560;1710;26;1710;591;1371;2223;1461;1654;909;1532;1654;791,2938;1461;1654;453;1705,1708;389,1707;1461;591;389;830;409,1467,1514,1515,1516,1517;29,579,3305;29,579,1532,3305;1654;112;1891;892,1237;1461;1654;577;409;416;1461;1654;675,1461;26,376,2111;26;389;602,692;602,692;2894;107;1461;1050;2412;272;358;591;389,1244;1048;29,1083;1461;541;2442,3009;26;1708;655;414;414,545;459,2535;454;1690;591;591;454;499,2138;591;994;1447;994;3172;26,416,994,1708,1852;389,453,478,1709;1461;1709;26,969,1705;389,1707;389,1707;704;3762;26,467;2630;390;112;1461;3536;1359;1461;498,770;382;2845,2870,2871;3204;26,3348,3349,3350,3745,3746;26,401;1275;782;1654;2090;1707;444;994;26,382,467,591;2451;994,1705;26,1706;2013;994;365,550;26,382,392,393,394,397,3766;26,396,397;26,416,1101,3462;1322;29,579,3305;1532;389,478;1532;1707;389,856;26,591,994,2128;26;365,478;545,1532,3469,3470,3471;400,420,663;591;1092;1676;1419;1461;1461;2267;402;1654,1658;591;1057;1860,2005;420;3114;559;2008;1038;3593;2536;1461;1792;1461;1224;1461;112;457,2860;1654;531;969,1452,1453;969,1452,1453;1654;1461;1357;1461;1279;3381;103;1784,1785,1786,1787,1829;2906,2907,2908;497;459;591;591;3729;3729;1811,2988;1792;453,1282,1498;2375;3134;505,538;26;903;107;591,1707;1732;268;26;1461;704,2305,2885,2886;1461;692,2337;591;591;1461;2692;1053;1461;2698;453;1429;668;505;1854;1196;2145;1853;1270,1704;1150,1387;2255;1532;1654;634,3108;1532;2083;1968;388;-27,-28,-29,-30,-1533,-1837,2983,2984,2985,2986,2987;1245;26;1705,1706,1707,1708;26;3176;2834;1245;400;1461;1495,3027;453,704,1494,1583;741,2403;26,334,994,1947;994,1541,1706;29;955,2009,2087;1461;2278;28,389;1322;365,382,1114;1705,1706,1707;1245;761;1461;26;26;26,1366,1735;1792;1117,1792;333;107;1708;994;26,414;113;29,545;1709;1709;1706;350,1124,1125;1705;994,1708;3424,3755;26;26,858,1240,2297;414,571,591;29;107;3454,3455;429,634,1101,3262,3263,3264;478;1712;1704;994;1155;994,1532;3315;3381;1760;1919;400,1532,1729;478,654;453;1706;26;1461;334,1322;281;1799;994,1532,1732;478;112;26,543,629;1196;777,1944,1945;1182;1956;26,441;1079;1789;571,2246;1710;591;1101,1532,3462;3776,3777;26,3384;453,1960,2624;1774;1461;1654;634;334;591;1098;439;1951;1708;1811;1654;1532;26;591;2510;1706;26,1461,3322;3334,3335,3336,3463;29;1913;467,591;26;591;591,3084;2812;545,1854;3037,3038;3037,3038;3037,3038;3037,3038;3037,3038;3037,3038;3037,3038;3037,3038;3037,3038;3037,3038;3037,3038;3037,3038;871,954,2852,2932;1704;591,3197,3198,3199,3200;2349;514;591;453,1282;393,422,546,1708;2444;26,3025;591;942,943;942,943;26,1532;1706;3494;1436;1461;26,365,478,1705,1707;1461;2310;692;1707;1461;389;15,-27,-1533;1532;26,2910;1706;2350,2351;1461;2646,2729;875;124;1810;381,573,1671;1705,1719;657;1732;1461;544,692,1709;26,59;945;26,1532;1461;1454;1461;1705;1708;1732;692,1705;681,946;543,2087;2290;999;1707;1690;365,524,525;1707;1707;1690;26,59;26,59;1707;1532,3097;591;830;3262;591;26,1532;26;1654;26,59;3512;422,994;994;26,427,1706;1532,1706;381;26,59;591;1461;479;1707,1838,1839,1840,1841;1346;416;785,1497;896;-27,-28,-29,-30,-1837;1461;26;2090;26,59;26;1792;1732;1654;1803,1804;634,1588,1608;783;692,1101,3462;624;629,710,751,1095,1271,1671,1704;1461;334;3114;393,467,495,591;1532;381,389,433,455;1061;502,2168,2488;1461;1461;655;830;3639;1532;1674;28;1706;26,3704;1706;1532;1461;994;545;626;1461;362;26,416,1850,1852;1465,1466,1467;591;942,943;2560;2707;2475;3017;416;785;545;2966;1470,1507,1508;409,2389;339;1811;112,1833;453,823;1995;1792;3513;29;1705;453;1461;1898,2023,2024,2025,2026,2027,2028;1461;1767;1784,1785,1786,1787,1829;1461;26,478,3232;1774;1654;1654;2698;1461;29;505,548;358;107,2413;2580;1461;1797;1461;2413;1705;1055;1397;2831;454;655;1245;1705;591;453,756;2735;591;26;2954;365,1863;1418;803,967,1549,1550,1551;26,453,591,1705;409,3390;801;2173;3412;2664;1810;358;350,1124,1125;591;637,1532,1610,3410;1708;1792,1806;545;2063;1242;3296;549;2092;1532;634;1461;1792;1461;1245;1532;692,1705;1461;830;402;2826;779;26;1532,3097;1532,3097;1532,3097;1461;1792;1245;752;1792;3337;871;866,867;660;459,502,871,3634;1101,3462;830,1350;1278;1494;1122;1461;26,1101,3462;1792,1806;2048;591;2338;634;873;454;370;3052,3053;3381;-27,-1102,-1533,-3463;402;1792,1806;3013;87,88;1704;1676;531;983;2016;634;591;531;1461;1125;433,467;414,571;1461;1282,1493;439,768;1461,1525,1526;107,1180;107,1774,2413;1955;1585;994;334;994,995;3744;1994,1995;26,453,756,1098,1708;1101,3462;2114;26;112;453,756;1461;29;26;1245;1461;591;1654;994;1346;1290;29,467;3761;389,478,921;577;1246;994;785,1497;921,1617,1618,1619;591;29;467;1461;365;1792;103;591;1810;2934;564,565;514;1461;1654;478,499,629;987;454,467,591;636,637,2021;467;454;2853;591;1461;26,1707,2328;454,591;414,571,591;1706;994;617;107;26,1709;1532;26;2196;975;591;26,414,1834,1835;785;590,591,1335;358,2439;2801;654,830,1126,1127,3219;478;3113;1601;1101,3462;26,1575;591;1461;26,414,994,1834,1835;300;1461;3774;453,830,996;1461,2338;994;1708;2958,2959;618;1524;1461;1709;591;1461;752;2136;634,3423;1908;1134,3550;3724;1461;994;166,167,168;591;26,2495,2496;591;550;591;994;394;124;1461;362,1207;372;372;372;372;1792,1802;453;416;365,389,591,756;2691;1792;453,1494,1495,1496,704;1538,1560,1561;1461;785;365;-27,-28,-29,-30,-1837;136;1242;1486,1488,1489,1490;1792,1806;26;389,467;29;107;1706;2090;1732;602,2741;2557;514;1654;389,660;1461;1607;1706;26,1532;403;26;2451;389,453,756;1525,1652,1860;1705;26,1857,1858,1859;112,2967,2968,2969,2970,2971;1708;26;1708;1707;1461;591;1709;1263,1654;107;1501,1626;2501,3287,3288;1675;1707;1518,2248,2249,2250;124;1461;429;26;3102;994;994;475,994;1448,1461,1548;779;107;402;830,2082;994;26;850,2521;2592;107;1654;467;929;1671;591;634,1473;1705;112;1409;1532;545;358;402;704;389,1707;666,1039;366;107,1773,1774,2413;1461,1494,2668;1831,1832;1303,1304;1706;960;779;1545;402;1461;591,1188;591,1855;478,591;1245;29,591;541;1792;1403;1940;634,3105;591;784;1461;1461;1964,1965;960;2600;1461;107;1532,3308,3309,3310,3311;1245;1707;994;26,376,1708;1245;1245;545;414,571,591;1245;467,1194;467;1245;1122,2972;1461;591;2087;1245;3515;409;550;107;409,2777;1461;545;1008,1009;1007;505;1461;1461;541;248;1650;994;994;1707;1707,1712;1705;2059;2219;26;2646;2377;29,505,1671,3362;591;433,588;591;2471;2086;591;1706;1486,1488,1489,1490;26,59;573,591,1066;591;1433,1446;1461;2552;107,1207;942,943;591;-27,-638;1796,1805,2424;1732;2705;1461;3539;401;591;389,453,899,900;1671;1246;1461;599;2341;1101;1289;1397;2284,3019;56,57;432,433,434,435,436,437;433;393,1744,1745;393,1744,1745;393,1744,1745;382;431,432,433,434,435,436,437;591;393,1744,1745;393,1744,1745;393,1744,1745;393,1744,1745;393,1744,1745;393,1744,1745;470,471;393,1744,1745;1706;393,1744,1745;381,422,467;393,1744,1745;393,1744,1745;439;591;1461;2082;399;590;409,1461,2996;546,2641,2642;1661;358;439;2341;3304;994;1789;1461;2923;1144;1461;103;414,2281;591;1676;26,27,28,29,1836;29,545;26;602;29,545;3521;591;591;602;26;591;26;591;29,420,454,545,573,1429,1671;26;467;877;26,59;124;1053,1461;389,994,1706,2769;1911;2698;3528,3529;1775,1776;1173;591;1654;2735;26;3521;591;877;2403;1707,2157;1461,1756;112,634,1322;481,710,960,1960;2290;1707,2157;1461;414,571,591;636;365,1705;1215;994,1707;1461;1461;439;1783;1046;2315;2562;1676;1654;365,382,1704;591;1122;2111;994;478;651,2132,2133,2134;982;1654;590;591;1461;1461;626,1505;545;350,1124,1125;389,505,1702;454,502,505,2168;591,1678,3339,3340;1461;704,2305,2885,2886;1792;994;591;1989;453;1346;389,453,1709;1461;1461;376,543;301,302;1113;1654;112,634,1322;26,433,591;3610;3610;1547;2404,3272,3273;994,1532;2013;1532;29,1532,1732;29;26,393,591,1362,1363,1676;690;512,513,514;1671;704;389,1707;1491;591;591,1705;634;514,1732;591;2506;805;1058,1709;26,29;2277;29,1707,2128;1705;26,401;498,954;1570;1706;545,1707;1461,1765;591;1403;591,1322;454;1470,1507,1508,1509,1510,1511,1512;370;1705;1021;362;2468;353;467;478;1525;358;1729,1757;469;994;26,850,1848;591;107,131,1636;2787;1461;591;657,693,1705;389,1705;2698;807;567,994;1461;362;1322;402;591;382;1461;545;591;1729;147,148,3456,3752;124,1322,1676;1789;1461;478,590;26,59;994,1732;414;545;1384;112;26,1707;1654;365;1706;1461;618;1525,2220;591;591;1461;1448,1461,1548;990;1706;1336;478;634,3284;29;1706;994;1532;26;26;1532;591;1732;1532,1732;1705;28;478,602,1706;1724;26,994;334,1708;414,571,591;107,1774,2413;414,571;626,729,798;1706;591;826;409;467,591;1461;1245;2885;1532;1050;1461;26;1437;414,591;626;3740,3741;414;1242;1454;26,1732;232,233;26;1792,1806;1865;479;2368;3147,3148,3149;444,1027;1532,1706;1101;414;1461;1654;1810;564;2686;1245;1726;1245;26,454;590;1461;1461;478;478,591;994;994;994;865;26,1532;591;602;409;591;591;29;2128,2601;1245;1792,1806;1245;1654;2854;719;26,59;1708;414;26,59;1346;1749;2307;3771;389,453,904;579;414,571,591;830,2255,3219;442,591,807,2522;1461;1654;1742;591;1052;1705,1706,1707;1792;1944,3004,3005;934,1204;591;358;26;1042;1461;873;1705;1675;709;3778;26,401;3381;1761;2735;1233;409,1760,2806;629;26;3381;26;1461;1792;422;389,1076;545;545;1532;1095;473,630,1328,1329,1330;628,1721;362,1107;1949;591;1082;2748;2477,2478;389,422,433,1676;393,1744,1745;393,1744,1745;2616;1654;942,943;1676;545;376;1397;1245;393,1744,1745;393,1744,1745;1461;393,1744,1745;393,1744,1745;393,1744,1745;1654;112;3708;2583;3039,3040;389,1707;2879;1705;2698;1654;26,414,1834,1835;1142,1180,2614;389,1076;1461;1461;1708;571;1091;115;2735;3099;1461;467,591;591;591;591;1461;1220;389,1076;26,639;1676;942,943;381,389,591;1668;549,551;389,467;1122,2806;389;591,3580,3581;462;591;467,660;752;545;389,505,1702,2219;591;389,505,1702,2219;432;2332;591;1309;591;26,401;591;467;591;994;409,453,1021,1461,1491;75;3371,3372,3373,3374;1461;1789;1461;3662;1231;362,1792;1654;1145;591;2534;1350;3140;389;382,1705;26;1705,1706;2735;1709;1976;1400;334;56,57;2465;3186;1461;634;1792;1792;1461;2412;591;1856;1461;478;1153;1806;1461;1400,2721,2722,2817;1461;1654;376,389,591;853,3495,3496,3497,3498,3499,3500,3501;545;26,1532;785;1710;2928;453;3120;1461;807;402;381;1180;1245;1397;1706;994;941;1811;1092;1654;1792;1098;1654;830;591;492;2885;591;1532;3153;2402;1180,1461;785,2755,2756,2757;2001,2002;1461,1601;26;886;884;26,59;3381;3231;1135;591;1308;478;1196;124,3427,3428,3429,3430,3431,3432,3433,3434;3015;1708;591;2344;591;1220;26,591;591;1245;2423;1461;26;550;545;1792;454;453,1378;803,967,1549,1550,1551;1461;401,433,548;1465,1466,1467;389,1707;389,1707;591;618;1461;26,395;467,1220;2128;3257;3781;1245;830,1357,2638,2699;960;26;1792,1806;26,478,1704;2338,2564,2998,2999,3000,3001;502,2168;498,770;26,1706;550;1461;2953;1654;1461;1461;1792;26;454;688;107,409,2668,2669,3394;107,131,358,409,1008,2666,2667,3394;1707,2341;2334;1707,3682;618;26,932,1842;3381;350,1124,1125;1461;26,398;29,1732;1704;1706;365,416,1097,1098,1099,1100,1532;26;26,416,994,1532,1711,1850,1851,1852;578,579,602;1532;1792;1676;1410;401,548,1671;389,1707;409,1546,1762,2359,2391;478;1792;2427,2428,2429,2430;26;358;124;602;1393,1394;827;994,1532;1207;362;1461;1180;545,591,692;3723;1792;1470,1632,2647;1708;1706;1705;800;1008,1009,1010;1350;26,416,1532,1711,1850,1852;1705,1706,1707;1461;1441;1461;1952;1241;803,967,1549,1550,1551;1461;1654;1461;1250;1053,1461;26;2698;591;942,943;467;389,467;705;1131;1871;26;409;969,1452,1453;634,3206;969,1452,1453;545;1461;1461;577;545;1461;26,1532;26,556,1047;107,1773,1774,2413;1030;1707,2157;1705;453,756,1542;103,196,197;26;1461;402;2290;1774;1384;970;811;2362;3640,3641;2829;591;207,208;942,943;994;213,214,215;1853;1122;26,376,422,478;1461;1707,2157;107,2413;365,400,1250;591;591;3738,3739;1755;358;591;389,401;591;591;432,834;2646;571;624;389,414;26,932,1842;511;478;1983;26,382,498,1707,1719;2698;1749;1654;994;85,86;3719;389;56,57;1360;58;402;416;3112;591,2165;1461;591;779;107;26,994,1532;29;940;1706;1706;453,1440;994,1532;1704;362,1775,1776,1777;591;1461;1654;1245;1461;3275;1245;1461;422,1706;1384;1461;1706,2175;602;2332;591;3285,3286;26,3472,3473,3474;1708;1732;1732;2531;994;1486,1488,1489,1490;454,505;1461;591;1461;1461;559,1442,1443;28;416,679,994,1532;2306;1792;1706;389,459,563;2698;994;414,571;871,954;400;1532;1316;591;576;26;854;1448,1461,1548;3426;907;1384;1654;1654,1789,1792,1809,3081;107;579;779;1654;26;635;107;467,591,735;791,960,2658,2659;1647;3715;1671,3253;591;591,1671;591;591;3037,3038;3037,3038;3037,3038;3037,3038;3037,3038;3037,3038;3037,3038;3037,3038;3037,3038;3037,3038;3037,3038;3037,3038;3037,3038;3037,3038;3037,3038;3037,3038;2741;511,591;401;26,591;26,3025;1220;478;454;414,571,591;26,433,591;26,401,613;26,401;1399;591;382;2411;1461;1690;462;381,505;1707;2512;511;1461;1461;1601;433;2909;381,1690,1700;26;365,389;1857;723,724;1708;994;26;1708;478,500,1148,1704;545;223,224,2211,2212,2213;994;2458,2459;2459,2472;3262;1708;1706;1708;692,2141;1705;454,1706;994;1570;1707;1707;994;573,2031,2032,2327;994;752;1778;545;1461;637,1593;409;591;112,896;1461;1705;1461;634;26,994;1792;591;26;994;1101,3462;26,112,439,1122;26;26,994;131,1636;26;1570;1461;2735;1654;1654;1245;752;26,994,1850,1852;409,1760;26,416,1532,1850,1852;1322;1461;3098;1530;1461;1461;746;365;942,943;1690;1242;2040;2307;655;2511;505,548,1203;994;402,591;409;26;409;803;634,1532;389,1707;1532,3308,3309,3310,3311;591;1732;29;1705;1532,3308,3309,3310,3311;1532,3308,3309,3310,3311;26;3313;1532;26,27,28,29,1836;1461;591;1461;1532;1664;3175;3787;29;2259,2565;545;1654;1122;358;1546;26,1705;107,112;467;1789;2436;2004;1461;402;1171,2469;3481;994;433;401,591;29,131,591,704,2262,2263,2264,2265;3464;752;1461;1654;418;974;1461;1398;668;1882;370;1654;1792;1793;3010;2639,2640;1654;1436;2515;1775,1776;1538,1560,1561;1705;1461;433;454;454;2104;1461;467,591;26;491;2108;1461;362;1654;1166;3436,3437,3438;1792;1461;994;107,453,830,2724;1461;1461;1461;358;591;1092;994;896;1461;467,660,1697;1122;994;1705;433;591,1180;402;591,1461;2648;2646;1973;3152;1357;2035,2036;1683;1683;1461;1729;994,1729;591;402;591;1323;1671,1999;1444;868,869;866,867;26,433,741,901,2068;866,868;1606;1917,1918;994;1101,3462;1654;1299;1242,1461;1789;1706;29,591;97,98;2834;350;978;1461;3772;2311;1461;1758,3234;2202;1180;568;568,785;568,1098,1495;1461;1461;1461;107,960;1792,1800;1706;2178,2179;1532;1808;994;3228;107;1180,1563;3110;3583,3584;1461;103;26,692,981,1719;3521;389;634;1322;511,594,595,596,597;381,467,1690;2395;2484;1461;651;1461;1461;365,553,1720;389,453,756,983,1212;1686;994;2423;2698;353;409;1114;415;1707;1220;2790;358,1336;1461;1705,2242;389,1707;591;662;1220;1461;591,3544;3546;2646;1122;791,1467,1469,1472,1473,1567;946,1461;3154,3155;1792;585;559,1442,1443;453,1494,1495,1496,704;409,1467,1514,1515,1516,1517;1762,1763;26,1532;400,994,1099,2579;735;800;1792;1322;365;3124;1602;1245;1350;29,545;1707;591;1654;591;127;1784,1785,1786,1787,1829;362;29,591,2455,2456;1461;779;29;591;467,1676;1065;1792;26;1461;638,741;1461;1709;422,769;3560;498;1101;107;830,2446,2447,2448;26,562;1292;2731;26,414,1532,1834,1835;2065;1532;1715;591;1538,1560,1561;1461;26,994;26,1351,1352;3118;1461;26,830,1322,1532;1461;1008,1009;545;1532,1582;28,779,1532;409,1760;1250;1461;26,856;768;1101,3462;1654;1792,1806;26;394;389,1707;409,1286;1461;1792;1001;1532;1707;26;994;26;634,1853;602;1461;1245;1581;453,692;752;1461;1461;2464;468;1654;591;1461;1693;433;1461;372,375;1792;453,1494,1495,1496,704;1238;1654;1792;1462;478,623;1654;1254,1255;634,1461;26;439;1134,3550;1461;1707;26,602;591;414;26,382,564,1625;2698;550;26,2530,2531,3095,3096;1712;1811;1707;26;591;1532;1461;1461;409,2152,2445;2386,2387;439;1461;1220;416,1495;1122;26;994;1916;1461;1461;1353;1397;240,243;1792;2683;2735;1461;2442,2443;2940,2941;1676;1461;1461;389,1707;3547;1384,2286;420,591,1098;502,2168,2488;591;591,3209;2348;467;591;433;416,1101;107,1671;994;1532;1101;942,943;942,943;1576,1577,1578;545;26;26,392,432,1189,1190;1654;439;1654;2084;1532,2084;1225,1226;587,830,1242,2111,2762,2763,2764;361,1150;759;2726;1831,1832;1831,1832;389,1707;1448,1548,1632;826;994;929;591;467,591;26;1461;961;1654;1206;550;1098;26,467;107,1760;545;1654;591;1461;831;506;896;107;1594;1245;26,478,546;1706;1706;1245;26;370,1792;1346;1732;1461;1245;478;376,382,414,473,697,698,1671;651;591;591;203;626;2170;3703;1240,1792;1075;1245;648,649,650;1245;467;3237;453;1033;994,1707;1654;591;1707,2382;1705;1709;1712;591;362;1220;389;1461;2646;591;3702;3614;26,2710;3069;29,2842;942,943;514,545;591;1695;1461;382,1707;3276;1654;994,1840,1841;1841;409,1319;1706;1461;1461;1649;389,1707;414,514,1421;994;26;1461;591;1707;591;591;26,1535,1536;591;624;107,1773,1774,2413;752;591;752;645;747;994,1732;1093,1840,1841;2046;606;1370;209,210,211;402;781;741;994;752;736,737,738,1729;3351;1708;1461;1654;1397;26,1230;1230;393,1744,1745;393,1744,1745;571;393,1744,1745;393,1744,1745;393,1744,1745;393,1744,1745;431,432,433,434,435,436,437;393,1744,1745;3588;942,943;1461;2835;370,1792;1462;26,1708;409,3003;689;2561;994,1532;1150,1417;785,786;295;1591,2632;86,3619,3620,3621;2469;390,830;1461;1461;994,1461;626;655;1098;453,756;942,943;591;634;26,1366,1735;591;591,918;602;591;591,2160;591,1741;591;28;602;1676;1098;2909;631;433;433;1433;358;505;1461;1053,1461;2013;1449,1450,1451;1799;1706;473;1831,1832;433;559,1442,1443;1748;350;2698;3557;1461;2120;1461;1461;1322;1461;112;637;26,556;1122,2381;1766;1792,1806;1461;454,545;970;655;1461;26;467;591;1461;2290;1246;1461;807;1461;1461;955,1182;1245;1705;1461;545;1461;1461;2155;1220;1461;779;973;1461;3179;2367;1397;1397;545;1654;422,432;1293;591;3716;1718;1532;1707;994;453;453;453;1461;873,916;3439;2067;1071;1366,1367,1734,1735;1322;107,1570;2321;634;937;1532;26,433;394;2935;1575;1792;453;626;954;26;1210;1245;1245;1414;3125;1461;1706;954,2493;591;467;467;2846;1191;15,323,324,325,326,327,328;1954;1395;382;1180;1708;1098;433,548;26;591;107,1774,2413;591;591;1654;401,591,2181;2571;1762,1763;591;26,659;593,1162;545;1240;545;3590;389,1707;26,467,481,482;1461;1461;545,634;545;1470,1472;1880;3652,3688;1461,1760;1654;107;1461;1654;3270;26,1849;26;26;1021;377,378,379;704;3759;873;1118;693;1218;107;629;779;1655;1654;1538,1560,1561;2939;1654;1654;1792;409;26,107;402,1705;1532,3308,3309,3310,3311;1008,1009,1010;1461,1532;994;994;2105;26,382,1189,2342,2343;1963;26,2509;26,2509;112,26;26;26;26;3014;429,994;2408;390;1706;1056;591;942,943;1378;1246;807;1397;1029;124;433;591;1654;1461;1706;1461;1654,1810;1654;1654;1575;1706;370;389;793,1654;634,1684,3297,3298;131,387,1654;1461;1705,2185,2547;1706;389,1707;994,1706;942,943;1705;994,1706;2331;376;394,416,994;591;1461;785;634;994;389,1707;1654;1792;1792;590;1792;1705,1706,1707;994;1122;1792;1461;1792;1429;1118;559,1442,1443;26,29,1532;2955;1461;591;1708;467;1402;467;2260;29;810;271;2423;830,1705;3538;1737,1738,1739,1740;2698;1792;358,1336;2982;994;2084;152;1654;185;2485;1470;334;2030;1122;634,1878;2931;400,994,1729;1461;3601;26,514,545,1732,2662;2662;1461;1748;29,514,545,1461;26,416,994,1719,1850,1852;1461;1707;785;1654;782;2013;1792;1705;29;1706;1532;591;1220;462;467;1245;29;1461;1461;1245;1053,1461;545;118,119;1532;1971;754;769,1959;1337,1338;1789;3426;1704;1654;26;1705;1461;591;1792;1792;1245;1245;785;1397;376,920;2021;26,920;1706;29,514,545;545,830,1680,2676,2677;1461;1461;1397;100;3653;545;389,1707;26;1768;1654;2282;2587;454;629,767;28;629;1705;1710;26,394;1710;1705;3747;454;1353;655;382;393,1744,1745;432;3599;1570;26,901,1710;365,382,729,805,806;393,1744,1745;393,1744,1745;393,1744,1745;393,1744,1745;358;1909;2891;2279;26;26;1138,1139;439;107,2413;1461;1954;894;1707;29;591;591,647;1671;1676;591;591;389;433;505,591;389,505,1702;1671;591;591;591;389,505,1702;1220;511;389;467;2219;389,505,1702;752;432,1695,1696;454,505,561;414,571,591;752;467;26,376;26,376;1220;29,634;433;414,571,591;1461;653;591;26,409,760;1789;1708;1532;1532;1654;1853;2649;730;531;1461;381;1461;1106;2922;1002;454,591;26;933;70,71,72,73,74;591;1465,1466,1467;1098;1998;467;1461;1461;3379,3380;1708;381;2885;1654;514;942,943;1532,2169,3302;1710;2013;3440;694;655;1792,1806;381;1461;2909;26,574,575,1708;1461;2513;777;478;1461;26,681,994;1093,1840,1841;591;1792,1806;1461;112;2990;454,2396;26,467;29,1532,3305,3467;591;2590,3178;830;124;2973;591;158;389,1707;453,1521;591;591;467;29;26;591;1710;467;3115;467;602;112;397,401,548;240,241,242,243;439;1080;1705;1461;545;453;409,1760;1705;1708;1461,2405,2406;3188,3189;2902;1461;453;2235,2236,2237;409;591;26;389,1707;1461;1712;409;3518;107;545;1461;785;1461;478;1707;1242;1792;256;26;26;591;703;3615;2423;1227;3119;1707;454;454;1336;634;400;416;1789;785,1497;350,1124,1125;26,1707;2090;1708;1461;2900;365;1461;3710,3711;1461;591;26,398;591;626;429,1532,3441,3442;994;704,803,1532;994;1923,1924;29;414,571,591;26,422,1706;1532;429;26,28,975,994,2761;1336;433;150;400;365,697,750,751;802;1461;994;942,943;478;1708;409,760,797;591;2633,2634;830;1461;1461;467;591;1312;3319;29,545;1983;1706;1707;1461;26,416,994,1850,1852;1461;577,684,1053,1537,1538;1099;1461;1251;107;362;1708;107,409;1246;1461;591;1461;2882;2552;914;2753;3240;1397;2008;1875;1245;26;1408,1792;670,671,1706,1707;1343;1792;1784,1785,1786,1787,1829;334;107,2413;107,2413;1605;362;1811;2567;453;591;1792;1654;250;800;1532;26;1365;381,591,1116;1436;591;3158,3159,3160,3161,3162,3163,3164,3165,3166;634,3220,3223;422;1654;414,769,770;86,967,1489,1637,1638,1639,1640,1641,1642;634;577;752;1122;1368;26,932,1842;684,1538,1560,1561;3447;545;1669;1792;1417;1245;1245;830;1792;1461;752;26;1050,2928;976;1706;1732;1461;1682;624;1417;994;591;1532;1196;26;2374;1461;1397;1245;1245;591;390;3037,3038;1654;1654;1494,1722;453,704,1494,1583;26;1706;591;1245;1245;1357;29,1461;2261;591;2280;634,1247;433;26,994,1366,1735;204;994;1532,1732;1707;1716;653;1245;942,943;26,433;29;1101,3462;590;107;721;591;1461;1461;1710;973;2740;1461;1461;358;358;591,1706;389,1707;2199;502,871,954,2932;634,1670;994;26,365,416,500,501,1532,1676,1732;389,1707;2776;1532;1811;26;734;26;591;1958;2995;467;1233;1461;2124;2628;1245;1654;1705;1729;1792;3028,3030;422,830,1706;26;1101;288,1774;1461;334;1654;1245;3375,3376,3377,3378;2670;661;1825;29,1671;591;591,1098;3037,3038;3037,3038;3037,3038;3037,3038;3037,3038;3037,3038;3037,3038;616;942,943;994;26,365,382,729;994;591;823,1189;420;389,415,979,1180,1181;26;591;29;942,943;26,401;942,943;381;1532,2609;1654;26;1239;1461;1366,1367;994;26;26,1708;1168;942,943;1461;381,505,591,1690;26,591;1708;1706;3508,3509;1461;994;390;774,775;3317;1604;433;1532;1707;2458,2459;2459,2472;634,2354;1705;1732;1707;26;1706;692;681,994,1716;1461;26;454,1690;26,994,2315,2319,2320;1245;1708;1356;1708;1461;1461;2322;1705;467;637;467;467;1299;1461;26,453,756;1532;752;752;830;591;1101,3462;956;1690;1461;591;1705;1706;830;1792;414;2253,2254;1290;432,623,2646;785;591;550,591,954;1676;478,729;1397;1233;3721,3722;910;1461;1946,2011;1532,3308,3309,3310,3311;107;1708;422;334,1647,3411;1707;1704;3391;414;1461;634,1539,1540,1541;1705,1706,1707;896;2255;591;2451;1762,1763;599;402;1461;409,1467,1514,1515,1516,1517;709;454;942,943;1706;107,409,2383,2384;1461;591;1792;1245;2735;1224;86;590;1461;1792,1806;830,1053,1461,1520;107;1705;928;591;1461;1461;381,547,591;1461;1461;942,943;591;75,3143;401;1461;353;1246;666;409,1467,1514,1515,1516,1517;1461;1654;409,2390;390;1142,1408,1461,1463,1470,2591;785,1497;1461;591,2143;591;1647;1691;1224;1654;591;591;365;433;1035,1697,3409;481,1065;1461;1461;1101,3462;2646;942,943;1461;1461;2407;801,1467,1469,1473;107,409,2574;3381;1792;1792;591;401,433;1532,3097;1532,3097;1532,3097;1532,3097;1532,3097;1532,3097;2423;132;961;1792;741;850;455;432;107,108;358;1053;1397;638;591,954;2785,2786;1397;1461;1461;1461;1461;1726;28,568,1461,3026;1397;2976;394,591,630,2180;3228;26,478;1461,2338;1708;791,2734;26,989;1707;473;-27,-28,-29,-30,-1533,-1837,-1854;26,982,1719;381;1461;1461;1775,1776;3402,3403;591;498;3381;785;1654;26;825,2541;3116;1104;26;692;1810;3236;681,1101,3462;3195;738;1461;1532;1101,3462;1792;389,2415,2416;2768;1705;1372;1461;2779;1098;1461;112;26,871,872;2557;591;1542;800;712;1082;3131;2423;26;600,2656,2657;3171;800;2608;2608;1532;1532;1663;422,1088;1940;564;3768;602;655;1654;409;994;591;2702,2703;1461;1792,1806;684,3446;1203;782;752;752;402;2423;743,1705;1461;26,577;402;1762,1763;955;1705;1461;1792;402;1245;1654;1708;2054;1470;3550;830;389;394;498;1792;851;2169;681,994,1719,2169;967,1489,2818,2819,2820,2821,2822,2823,2824;26,932,1842;1245;1461;26,1535,1536;782;591;3725;2082;545;479;362;3177;779;394;394,681;1461;1180;402;2943;942,943;26,2504;1317,1318,1705;591;994;1461;112;1706;1707;350,1124,1125;2037;830;414,571,591;994;3560;591;1250;1245;467,591;1654;1461;1461;26;3303;1120;1571;634;1705;591,1707;26;1053,1461,1518;1021,1762,1763,1764;2127;1654;591,2143;591;1461;1169;1449,1450,1451;1461;416,994,1532;26,453,591,779,1282;994;1461;1461;1448,1548,1632;1654;433;671,994,1098;730;591;752;1122;830,3219;1461,2898;1676;2113;389,1707;2479;1461;780;2946;2894;467;56,57;591;481,942,943;638,2852;655;334;1461;467,1694;1831,1832;1831,1832;1831,1832;1831,1832;1831,1832;815;815;782;634;505,591;591,684,2996,3478;591;782;2208;478,1307,1532;76,3279,3280;1397;1461;107,1498,2545;2698;26,416,1707,1850,1852;91,3685,3686,3687;830;1461;409,1467,1514,1515,1516,1517;2704;1101,3462;1245;634,1582;1245;1245;769;1709;1811;3488;26,692;1242;2290;1245;1245;389,1707;1245;454;1245;454;1245;785;467;382,414,697;473;2974;388;876;1572,1573,1574;1461;433;1654;1433,1446;1705;1461;785;545;2698;467;1461;1654;849;1461;1705;1707;2629;26;752;887;1436;591;591;2842;545,591;591;591;591;591;505;433,591,1854,2137;591;591;505,591,2494;350,1124,1125;439,1429;1706;1532,1707,3308,3309,3310,3311;591,1704,1707,1716;26,2441;752;591;994;878;1462;2946;2218;591;3324;1461;420;1461;637,1595;1705;409,1417,1601,2508;409;112;402;591;926,1230;393,1744,1745;393,1744,1745;393,1744,1745;393,1744,1745;107;567,568;1597;1789,1794;26;1461;1461;751;3550;2333;782;1220;634,2645;26,1532;545;2284;668,994,1461,1672;1461;1245;1251;2021;1461;1461;591;390;502,739,1032,2059,2060;26,932,1842;1242;591;26;591;545;505,591;591;26,2827,2828;1705,1706,1707;735,949,979;478;416,1532;409,545,994,1498,1532,1561,3056,3057,3058,3059;473;1417;591;467;26;514;467;545;1101;26;571;402;433;1461;1461;994,3121;1707,2157;453,1346,1470;1654;390;545;1417,2152;1461;779;26;29;1333;1308;1461,1686;1792;1461;655;1134,3550;531;107;1397;26,27,28,29;1122;1792;591;107;1461;454;350,1124,1125;591;1654;422,432;422,432;422,432;422,432;422,432;422,432;1299;103;1252;26,376,390,422,500,818;402;1437;112;651,1180;433;303,304;634;1705;2073;26,1247,1678,1732,2927;2419;1792;1654;1654;851,1156;432;2413;1461;75,1815,1816,1817,1818,1819,1820,1821,1822,1823,1824,3054,3055;1654;1748;1705;545;1706;545;545;994;26,545;1707;634;1729,1730;591;1412;544;1654;1461;26;1053,1467,1632;1121;416;657;389,1707;657;1654;365,1671;1654;1654;1461;1397;2255;389,505,1702,2219;1856;107,1953;1461;2725;350,1124,1125;657;591;1461;1709;830;1397;830,1053,1461,1520;1495;350;414;942,943;2698;1732;354,355;1705,1706,1707,1708;1799;2639,2640;1789,1792;3521;389,1707;26,1532;26,107,988,2850;994;1651;1733;634,1532,2042;571,769;997;352;1461;1792,1806;1461;365;591;1810;1461;2892;107;591,1188,2285;433;2125;433,2166;453;1461;1705;545;2709;1336;1245;27,1093,1707,1837;1704;1635;1461;2791;2095;993;1654;1461;2544;591;1461;3277;1792,1806;1150;1461;1461;26;403,532;1245;1461;26;26;3559;1397;1461;26,545,1901;137;478;1336;401,548;1229;713;358;934,1417;409,1760;467;800;3716;2693;1706;3460;3091;1532;591;1299;1461;803,3389;362;402;467;432,557,558,559;800;1245;1944,3004,3005;1461;1748;591;655;1461;26,401;26,381,467,481,498;1461;545,3548;453;1461;1784,1785,1786,1787,1829;1461;634,3002;2882;548;1706;3586;26,1329;1706;464,479,591;464,479;591;3591;1784,1785,1786,1787,1829;1461;2410;873;1461,1960;393,1744,1745;1792,1807;393,1744,1745;26,432;121,2044;3136;1792;1706;1245;1245;1245;1461;1137;533,534;439;960;26,1714;27,1093,1707,1837,1840,1841;1265;26;1840,1841;26;27,1093,1837,1838,1839,1840,1841;498;1888;1336;2925,2926;660;879;591;1220;942,943;432,464,466,467;655,1764;2344;3487;433;1180,1461;591,871;545,830,2676;389,505,1702;432;389,505,1702;389,505,1702;432,1695,1696;591;591;389,432,591;389,505,1702;591;389,505,1702,2219;26,591;591;509;591;414;467;2138;942,943;1461;1461;1532;1101;1461;107,2421;1461;782;1461;26,1853;3379;1461;276,277;3126;202;515,516,517,518,519;515,516,517,518,519;478;1706;1706;591;1705;1242,1461;830,1053,1461,1520;401,433,548;362;2909;994,1461;1792,1806;1346;1433;830;409,1417;467;381,432,495,496,497,498;3251,3252;942,943;1792;800;591;853,3501;1461;591;591;498;1397;1792;2989;622;1654;1532;1708;1461;1397;2090;26;2570;1245;2643;1792;591;1245;2267;1461;2227;3127;26,29;29,579,3305;1705,1706,1707,1708;782;2788;591;2851;28,545,634,1532,3505;1384;779;782;800;107,1760;1811;993,1704;26,478;1461;26;1461;2802;107,1774,2413;1461;409;788;1792,1806;668;26;1461;591;782;994;994;994;358,2698;591;1705,1706,1707;591,1710;26;1854;871,954;2125;414;752;591;591;26,591,1676,2770,2771;591;548,1203;433,548;478;800;3290,3779;1762,1763;1532;755;502,1082;1461;2602;409;26,2164;1310;112,828;26,414,453,499,1408,1706;389;1681;1245;634,1925;782;1792;591,651;1556;1245;1748;1810;634;1792,2713,2714;1461;545;26;1245;382;2617,2618,2619,2620,2621;1322;1353,3567;2182;2693;361;1654;498;29;173;830;400,2533;416,994;591;1461;1461;273,274,275;2419,2627;2991;28,1749;28;1461;3646,3647;591;26;592,593,1708;634;3511;1532;29,579,1532,3305;1792,1806;1761;2162;365,697,750,751;433;1532,3308,3309,3310,3311;1461;26;26;994;1461;2370;1972;651;1461;1532;994,1532;1532;1706;1122;3537;1654;1350;1322;2780;1461;1461;473,1706;489;2385;1706;1008,1009,1010;1973;1461;830;29;942,943;752;942,943;3011;1336;2712;994;801;2305;1161;2195;1811;370;350,1124,1125;591;1532,1732;1532;473,583;1708;572,729,949;502,503;107,2413;1461;103;2194;2792;1706;1461;26;454,591,2678;1762,1763;2000;994;131,358,368,830,1008,2666,2667;591;1397;394;1792;994;358,1719,2593;475,994,1532;803,967,1549,1550,1551;416,1532;1461;1792;591;1792;1546;591;1501,1627;1220;1784,1785,1786,1787,1829;1792;1461;800;1397;843;1470;1654;591;2651;752;1461;26,29,932,1842;1706;3477;6,15,323,324,325,326,328;1263,1654;800;1705;1245;1461;1245;112;1461;3050,3051;955,2009,2087,2171;389,979;1245;1245;1245;1245;1461,1707;1943;1433,3254;636;1977;1114;389,454;1792;1245;1245;634,987,3226;1245;1092;26;994,2644;1706;26,1491;1532;376;514,545,779;393,1744,1745;1532;682,2040;1768;131,1470;722,728;26;1461;26,1366;3218;602;994;3780;591;994,1706;26;1461;1461;1461;970;3145;591;467;1098;591;1706;26,365,500,501;623,1247,1732;994,1706;26,467,481,1066;591,994;692;887;550;550,887;1707;1654;107,1457,1982;591;350,1654;1050;228,229;1461;1706;1792,1806;3421;1245;1705;1792;1461;365;1245;1245;591;409,1417;1706;439;26,545,830,1495;591;591;1336;1245;26;3375,3376,3377,3378;3742;3712,3713;3194;2901;26,29,1671;454;2129;1341,1601;1676;3037,3038;954;3037,3038;1276;545,591,613;401;26,433,591;26;752;401;505;752;723,726;1671;591;613,2128;942,943;545;1461;2698;684,3446;409;591;462;26;590,655;1461;467;1461;433,640;2507;107;2219;423,3128,3129;723,726;1532;478,994;26,994,1706;500;1690;467;591;1690;994;994;591;1021;634;591,1676;785,1497;1461;402;1437;785,1461,1524;1414;994;2500;1864;1461;1461;994;591;26;1532;830;591;1098,2079;1792,1806;591;1461;350;389,1707;389,1707;2698;1706;1461,2134;409;1246;942,943;994;942,943;681,994;591;675;830,960;2813,2814;1762,1763;1298,1752;107,414,591;2694;890;3150;545;1706;1461;1461;1461;1461;124,2573;350;1654;1461;1461;1461;651;629;3381;478;401,433,467,548;389,433,467,591;350;2849;1245;1220;1059;467;1708;1322;350;545,1461,1570;1705,1706,1707;1461;3753;1098,2061;591;389;591;454;1892;830,1053,1461,1520;1245;402;1245;591;401,502,2168;350,1124,1125;655;177,178,179;590;511,591;591;1180;2303;752;1461;353;1792,1806;389,454;389,454;389,454;29,634;500,1715;637;591;381;1461;1732;1532,1729;1461;1082,1354,1355;1461;1397;1654;309,310;416;365,1217;409;2450;1678;444,587;921,1501,1608,1628,1629,1630;1792;26,433,867,869;26,866,867,868;871,2058;1461;3090;350;1397;416;1467,1469,1470;3510;591;896;1461;1461;1203;2834;2090;409,1417,2251,2252;3228;175;1041;1461,1543;1601;409,1760;1461;1532,1732;1461;1461;1461;370,373;704;591;1461;1011,1012;1654,1792;777;2461;1220;2064;1283;1461;1461;1461;830,1053,1461,1520;1163,1164;1461;2920;1461;1792,1806;381;591;334;453,1282;95,96,362;498;634,779,830,1686,1811,1892,1896,1897;362;467;800;1772;799,800;370;1792,1806;735;3573;147,148;147,148,3752;151;1792,1806;3012;1245;1245;1461;1346;1207;699,700,701;1704;1461;571;1461;2221;1461;1461;803,967,1549,1550,1551;655;1712;591;2097,2098,2099;1461;591;1461;3714;2423;26;794;1654;409,1467,1514,1515,1516,1517;1098;1122;1538,1560,1561;1461;1245;3444;1532;2013;836;26;2451;2834;26;2542;717;26;1461;1792;334;655;1242;372;3550;3649;1707;1532;26,3689;416,1729;416;1461,1753;967,1489,2818,2819,2820,2821,2822;416,1532;1570;1461;1461;1461;1142,1467,1566,1567,1568,1569;1461;1856,2728;994;591,2165;416;394;2003;1461;654;994;86;1180;3079,3080;1348;591;591;782;2013;1624;1609;1598;3654;26,1532;26;1708;26,442,807,2039;26;1532;1461;26,1491;26,1575;1436;1461,1491;1792;1461;3724;1654;1122;994;1792;1792;994;1461;1532,3308,3309,3310,3311;253;1792,1806;591;1792;994,1099;1461;453,992;439,768;2181;365;1761;2698;1748;1461;26,401;591;1960,2338;1441;26,2723;1021,2055;1532;1101,3462;2423;752;454;2083;26,29;1461;2735;917;279,1831,1832;1654;1831,1832;1831,1832;1654;376;1403;1384;1654;591;1417;591;402,432,856;26;1789;218,222;1654;409,1760;1245;2698;1654;3133;1654;1500;752;1676;107,2413;591;627;453;1245;1245;752;334,1671;429;1245;1461;942,943;633;1245;1245;1245;752;942,943;3521;752;752;164,165;1461;1461;2006;1461;1461;1654;1322;1792,1806;1220;626;591;1654;942,943;1632;752;505;591;1706;1461;459,3734;1654;1180,1570;954;591;26,28,29,591,1671,1732;467,591;2602;2895;478,1610,2057,2058;334;454,2042,2043;2125;591;591;2612;26,1314,2747,3066,3067,3068,3069;591,2096;479;591;591;390;752;334;1245;409;1532;2015;1461;409;807;923;969,1452,1453;441,505,790,791,792;591;401,433,548;942,943;752;2152;334;1654;977;2062;591;107,1461;1461;3265;973;3265;2635;994,1093,1840,1841;393,1744,1745;545;2721;1461;1654;131,1636;462;26;107;1811;107;467;409,1760;467;1707;514,545;942,943;752;2735;591;3521;3521;591;591;591;467;2109;1792,1806;782;1461;1461;26,27;3240;28;1705,1706,1707;2960,2961,2962;782;1706;1461;2267;942,943;618;1175,1461;3616,3617;3122;1467,3016;2013;545;602;934;1461,1754;26,1877;2735;26,86,1494,1588,1589,1590;1654;2290;1705,1706,1707;1654;1180;1705,1707;1704;358;409;530;1792;1461;3493;1461;392,1461;591;1134,3550;1744;1461;1654;2542;453;453,756;1346,2053;453;26,1532;1436;550,626,1455,1456,1457,1458,1459,1460;1461;3579;1792;400,416,1708;994;1705,1706,1707;107;362;1397;1792,1806;1705;2406;1532;467,591,942;29,1461;1461;1461;26,27,28,29;26,1247,1678,2927;1461;1461;800;265,266,1067,1068;791;2537;2470;1706;29;591;545;591;591;1858;591;134;1461;826;1461;590;2085;1461;107;107;75;591;26,1408,2258;26,591;1008,1009,1010;1180,1461,1532;1180,1461;409;994;1180;26,1714;994;26,1532;365,1671;365,1671;365,1671;473;1784,1785,1786,1787,1829;1784,1785,1786,1787,1829;1792,1806,1979;1245;800;1397;1654;350,1124,1125;2029;655;2698;107;545;402;2698;752;1366,1736;3181;591;591;502,503,613,1188;26,1732,1841;376,3458;26;993;1732;376,422,1705;1707;393,2119;1708;994;1706;925,926,927;1180,1461;1647;1461;1245;28,29,1729;1709;1180,1461;1654;3757;389,467;591;1081;433,548;365,591,1532;591;414;994;2217;433,548,1203;591;1101,3462;26;591;1324;2270;1098;381,591;1532;1792;1792;1811;1227;362;1461;3381;1792,1806;752;1792;994;591;107;2520;26,901;1090,1654;1461;1461;26;26,453,1705,2589;1461;403,505,3558;29;1461;1647;514,545,1461;401,591;1461;358;2219;591;1705;334;1461;1532,3561,3562;1098;1858,3533;1654;1391;2267;1095;2422;591;1461;1461;112,514,545,591,1708;1346,1470,3674;1180;2929;1245;618;450;1397;2542;26,545;2542;353;1647,1648;416;1494,1727,1759;1461;26,441,443;365,667;56;1706;1429;577;1685;1792;591;1322;1397;103;1461;591;1557,1558,1559;3230;433;393,1744,1745;3169;352;350,1124,1125;545;505,591;393,1744,1745;393,1744,1745;365;1220;2583,2584,2585,2586;26;1021;107,2413;1385,1386,1704;1792;545,830,2676;389,505,1702;752;1027;2125;467,591;429,1101,3318;591,1461;591;591;389,505,1702;505,1701,2219;389,505,1702;591;591;1098,1546;1431,1432,1433,1434;514;1417,2271,2564;28,422,994,1705;1461;916;505,591;901;591;752;1101,3462;1706;1811;1461;2124;2135;2135;2135;1461;1575;591;409,1299;1397;1461;1467,1469,1472,1473;1461;1762,1763;478;1006;1654;409,1760;1388;1789;3100;942,943;1792,1806;1461;1286;575,1708;1654;1461;1311;2469;3171;29;1654;1634;1461;1810;1397;1098,2051;1762,1763,1764,3437;409;1461;453,1229,1478,1479;1391;1860;591;589;1122,1705;591;1706;2578;1732;1792;1461;2406;752;591,2810;942,943;591;2299;334;942,943;591;591;1341,2671,2672;1342;1461;1706;2087;545;591,1762,1763;2816;1461;634;2958,2959;1461;1706,1707;1709;646;28;590;473;389,1707;1461;1792,1806;1792;591;454,502,503,504;267;365;909;60,61,62;1245;1245;26,365,955;1996;1180;1220;1397;684,1532,2996;473,1792,2399;2425,2426;1461;3205;1707;1461;681;429;814;1789;2615;1705;334;1461;1461;294;2432;26,416,994,1850,1852;1336;760,1461,2359;1532;362,363,364,1654;3677;1461;1461;1461;1134,3550;26;1969;1707;2853;1098;889;942,943;735,1654;1461;1461;26,416,994,1850,1852;26,416,994,1850,1852;1792;655,1461;1655;1461;107,1461,1561,2707,2914,2915,2916,2917;2056;1414;1461;1461;1461;1461;1461;453,830;1461;401;942,943;591;467;591;109,110;112,1532;1461;1461;692,1705;429,994,1729;400,1705,1706,1707,1708,1729;3425;1245;3269;153,154;1461;350;2554;545,591;1461;75;1461;1792;1792,1806;1461;634;1792;800;365,1097,1098,1099,1101;2090;107;610;591,2142;112,1792;1705;26;1654;1398,2201;3250;1587;447;161;779;298;1461;358;1461;1853;591,2128;591;409;651,1461;402;1799;402;795;2883;1461;26,692,2504;1429;124;385,386,1654;1792;1461;1397;1397;2808;2154;591;591;2859;1461,1762,1763;26,932,1842;1461;634;124;1532;26;29,3656;591,2165;26,1532;1245;1792;1707;778;112,1396;1245;334;2451;2454;1792;251,252;704,830;26;26;1397;3228;1792;830;1397;1461;1708;26;1461;591;26,416;29,634,921,1619,1622;3034;932;591;1170;26,441;433,467;942,943;458;3103;1532;26,401;29,591;1705;26,591;26,401;1532;1705;365;26,401;1486,1488,1489,1490;409;591;409,1760;1654;952;1461,2799,2800,2801;1461;467;1654;1461;1461;1461;453,1282;1792;1792;358,785;1654;3706;1461;358;1101,3462;467;942,943;882;1757;1461;26;0,1,2,3,4,5,7,8,9,10,11,12,13,14,15,16,323,324,325,326,328;752;75;564;1346;591;1678;107;942,943;591;1792;571;26,401;942,943;752;752;752;1705;1792,1806;1461;1709;655;559,1442,1443;1706;370;505,591;1461;381;2018;420,502,503;15,323,324,325,326,327,328;803,967,1549,1550,1551;1706;1461;2090;591;26,1708;3532;2267;994;467;1690;591,3414;29;26;1322;381;1426;1461;1708;287;1654;381,1690;979,993;830;26,416,1711,1850;26,416,1711,1850;591;591;1461;752;1461;1654;1705,1706,1707;1868;1868;1461,2661,3020,3021;571,1158;2346;2206;1461;1461;334;26;942,943;1403,1414,1461,2759,2760;1461;439;655;650,856,1704;942,943;1461;26;994;1245;107;1926;1461;830,1421;1397;1461;1220;639;124;1912;1784,1785,1786,1787,1829;1461;1245;1018;950;2457;1397;1461;138;1654;994;107,2413;1461;467;1180;1792;1245;1461;655;1461;942,943;591;26,453;389;591;26;591,871;591;3678;1810;1858,3533;220,221;1792,1806;881;26;1792,1806;779;752;1770;1461;389,1234,1235;232,233;1299;1792;1654;1705;591;1461;591;514;799,800;545,871;1799;381;613,1188;1981;381;3381;1792,1806;1461;1245;830;1532,3097;1532,3097;1033;866,867,868,869;155,290;1207;739;1792,1806;26,458;1461;1706;358;591;416;389,453,1496,1705;2613;2989;1461;3381;1461;358;591;1461;1632;1654;1707;994,1532;1706;393,478;1245;1229,1461;467;1461;2339;1461;1461;591;454;591;785,1461;26;365;1101,3462;1101;1101,3462;2838;2997;409,1467,1514,1515,1516,1517;830;112;358;1529,1530;1242;1707;107;416,1101;1461;26,403;1792;505,591;358;1654;3721,3722;1532,3308,3309,3310,3311;1461;1098;1245;26;389;1220;1532,1732;26,1532;545;3381;1134,3550;467;785;334;1789;1210;2735,2736,2737;634,1461,1601;370;1707;1461;389,1707;1290,1401;1461;618;107,1774,2413;911;29,1461,2338;2592;350,1124,1125;800;752;1532;205,206;2467;1654;1461;1302;1706;1180;29,1247,3422;429;967,1489,2818,2819,2820,2821,2822;389,1707;1461;591;350;3445;591;2551,2552,2553;362;782;505,591;591;1532;1180,1461;26,547,591;107,789;453,1569,2486;548;545;1792;1374;1461;454;1586;2698;2242,2243;994;1581;942,943;696;1053,1461;1461;1789;1792;1461;556;1532;1461;453;681,1101;358;669;1461;454;591;1708;1341;752;389,1707;2131;1461;1461;545;26,401;1461;1654;1461;26;358;1461;1831,1832;1831,1832;1831,1832;1831,1832;1831,1832;1831,1832;1831,1832;1954;2451;1021;1461;505;1654;402;1336;1792,1806;994;1461;1461;1654;1706;350,1124,1125;2017;1461;358;591;1461;1532;1792,1806;1792;1461;2098,2099;26,1599;1245;409,1467,1514,1515,1516,1517;1245;1461;1245;1245;942,943;1245;752;1461;350,1124,1125;1810;409,1760;765;1986;1233;2219;1461;383;1792;752;591;1322,1323;830;467;26,1535,1536;1792;1654;1792;26,2153;830,1633;1992,1993;1993;686;927;942,943;752;854;591;1792,1806;296;1053;1053,1561;1461;1705;1438,1439;1230;2650;1461;1792;1495;1461;3733;390;1792;1523,1524;1532,3308,3309,3310,3311;650;1705;591;381;591;591;591;1792,1806;807;1101,3462;350,1124,1125;1417;376;1706;1532;1461;358;26;3767;1461;1461;591;2549;1308;1245;1245;2884;994;1792,1806;1461;896,1098,2016;1461;498,830;591,1095,2378;2077,2388;1461;1732;1621;985,986;1245;591;365;1792;514;112;350;1528;752;1732;1654;1461;1654;559,1442,1443;1461;-2936;3593;1461;1792;402;1654;545;1461;350;934;704;591;626;591;1708;26,27;26;830;1002;1461;591;362,1792;1799;56,57;591;1705;752;365,1671;1461;131;1122;942,943;591;591;1461;2152;1461;1245;994;26;26;1532;1532;1461;26;994;453,756,1542;2580;1245;1461;1654;1461;231;1729;994;230;2159;429,994;370;409,1760;3008;752;1570;1792;416;1245;1461;752;752;26,401;994;942,943;1422;1404;402;1461;2013;2612;2423;362;1654;1461;26;29;1654;655;626;467,591;591;358;779;1470;457;467;1461;414,591;591;591;548,591;571;3789,3790,3791,3792;478;994;1149;1461;1245;1532,3308,3309,3310,3311;1532;370;26;1461;902;2774;1461;1461;655;1082;1461;1792,1806;1461;409;591;1792;2889;26;807;2925,2926;29,1247,3422;2112;401,433,548;467;591;1461;75;26;467;1196,1202;752;547,1698;591;591;389;444;752;591;591;467;389,823;432,467,591;752;1671;934;1153;2152;1101,3462;655;1761,2438;1461;409,1760;362,1792;2698;1654;1245;2069;1831,1832;92;3457;27;2698;782,1939;942,943;1461;761;1792,1806;107;994,1582;1461;1461;1461;409,2154;782;1532;1792;1461;1461;1792;3415;389;1461;1461;655;3235;467,591;430;1461;26;350,1124,1125;75;1461;2316,2317,2318;1792;3720;488;1205;1384;467;1654;1136;591;942,943;1220;2126;752;942,943;752;942,943;1220;591;566;548;942,943;28;107;591;591;26;26;1461;994;591;994;389;1706;453,756;1461;1810;2090;107,2413;362;389,1707;3156;365;618;1461;1654;416;1586;2669;3674;389,1707;26;1245;498,770;2845,2871;467,505;1461;358;103;1397;1532;1532;1379;1532;896;26;1245;26,994,2773;401;467,591;1792,1806;2267;1706;1704;1101,3462;1707;1532;1101,3462;414,571,591;26,1101;382,478,543,1708;1704;1336;26,416,1708,1711,1850,1851,1852;262,263,264;1098;226,227;591;26,1611,2763,3246,3247;934;655;358;26,416,994,1850,1852;474;2124;26,453,994,1324;1433,1446;1461;830;432;1465,1466,1467;1650;634,1539,1540,1541;1789;1748;618;1384,2353;29;1631;805;103;1219;1792,1806;1706;618;591;1830;704;1461;26,994,2878;402;382,571;1324;107,782,2413;1461;1245;1053,1461;1792,1806;619;861;351,2276;298,299;626;3381;1461;1461;1008,1009,1010;112,650,2830;389;779,1122,1242;1741;1706;2698;155;1245;3306;3111;130;994;27;1461;86;1491;401;26;873;591;26,932,1842;26,1843,1844;334;2516;1461;890;1245;240,242;353;140;453,704,1494,1583;1792,1793;1793;478,1028;2698;1245;1245;1792;3188,3189,3190;26;26,2523;1792;409,1467,1514,1515,1516,1517;26;571;634,1494,1620,1621;1461;107;26;459,591,1697;1461;1532;1706;973;591;26,1535;26;591;26,2603;591;381,432,498,505,1064,1065,1066;26,994;389,1707;1053;1532;14,17,18,19,20,21,22,23,24,25,340,341,342,343,344,345,346,347,348,349;1142;526,527;26;402;545,830,2676;107;1654;1749;752;1887;454,591;26;124;1461;1098;1792;1792;1461;1789,1810,1813;1768;785;124,254,255,370,1774;1245;3375,3376,3377,3378;3375,3376,3377,3378;14,17,18,19,20,21,22,23,24,25,340,341,342,343,344,345,346,347,348,349;942,943;3037,3038;591;26;942,943;942,943;591;942,943;942,943;381;1236,2007;545;591;591;1708;634;29;26,401;779;2163;1461;1101,3462;1461;1461;1461;390;1712;433;1792,1806;389;389,392;591;1322;591;381;1013;1389,1390;26,416,1707,1850,1852;1101;1792;1245;2698;2727;1461;467;591;994;2172;3141;1294;107,1773,1774,2413;1461;1461;1461;591;2395;994;942,943;1532,3308,3309,3310,3311;942,943;668;1461;3521;1831,1832;409,1467,1514,1515,1516,1517;942,943;942,943;1461;3600;362;655;934;1792,1806;1654;258,259;350,1124,1125;1461;1792,1806;29,3448,3449;655;752;545,591;467;591;1792,1806;2982;752;26,520;591;1322,2921;531;365;756;2661;1122;2911;1461;376,1219;655;1245;591;1397;1461;26,27;416;1461;1792;1118;1245;942,943;26,1535,1536;1461;1461;2718;1461;2226;2861,2862,2863,2864,2865;1706;1098;2339;26,27;1461;1461;406;1708;390;994;788;236;1762,1763;885;651;3312;1461;389,1707;1792;1654;624;1245;433;1789;112,129,3627,3628,3629,3630,3631;1532;358;1465,1466,1467;1707;1461;1461;1461,1532;634,1686,1759,1893,1894,1895;800;800;749;490;791,1122;3381;307,308,350;107;1792,1806;358,704;350;1654;389,505,1702;1461;704,3381;655;1461;2329;2412;291,292;1461;1134,3550;3550;1461;571;1557,1558,1559;1709;591;1707;1461;1960,2439;1707;2090;1336;1654;1461;1461;26,29,545,1247,3422,3423;1491;591;1461;1461;389,505,1702;539;2715;967,1489,2818,2819,2820,2821,2822;2106,2107;453,994,1229,1269;1461;1748;467;752;1461;2842;350;1532;1245;994,3168;626;498;389;3323;969,1452,1453;942,943;2502,2503;894;591;1375;1245;1245;975;1792;453;752;752;26,1467;26;1762,1763;409,1467,1514,1515,1516,1517;1948;1245;655;414;591;871,954,2932;409;124;3749;785,3139;467;409,1417;1104;684,830,1242,1960,2113;1461;580;467,475;414,571;381;2140;942,943;3085,3086,3087,3088;77,2975,2977,2978,2981;467,591;994;1346;531;720;1397;1748;1654;994,1093,1840,1841;389;3388;1461;1831,1832;1831,1832;433;2138;591;591,1461;1654;3676;624;505,1700;591;994;752;1245;26;1461;1461;531;853;853;1245;752;591;2152;409,1760;1461;1532;1654;1461;107,2413;1750;350,1124,1125;1914,1915;942,943;1461;655;1461;1203;200,201;591;591,2096;2086;1207;1706;1792,2463;654;107;942,943;1461;1792;3381;107;409,1532,1762,3404;334;26;499,545,1037,1084,1705;1098;124;498;655;634,3476;3291,3292,3293;3291,3292,3293;3291,3292,3293;1654;1253;26;1461;1792;2051;1461;402;1087;26,27;1053,1461;29;942,943;942,943;1966;3240;1831,1832;1245;1245;1245;1461;1306;1461;1461;1707,2157;591;26;2307;1461;1570;439;1461;1461;1654;1336;1654;438;1339,1340,1341;600;1461;350;334,453;1461;1461;1461;1705,1706,1707;1180,1461;655;453;626;26,27;994;1195;350;2128;1461;1532;1245;1792;942,943;2022;1461;1792;505,591;752;26;2400;942,943;2090;409,1760;3381;854;752;1461;779;1791;26;1461;1761;752;107;591;752;1706;1792;1654;3396;26,3297,3298;1707;1708;1461;1461;15,323,324,325,326,327,328;855;1170,1207;130;350;389;591,1729;2423;1582;1461;3534;1706;752;1792;362;3188,3189;591;1810;2423;934;1461;454;1019;389;365;1461;116,117;1461;1245;1606,3633;994,1101;507;591;752;1792;887;3465;655;2393;1655;1792;1461;1654;2128;1707;1775,1776;453;2121;467;2213,3024;3228;1346;29,1732;1461;1461;655;1792,1806;1461;2540;1840,1841;411,412;3709;1532;602;1217;2111;1939;842,1792;1532;591;942,943;591;1461;2219;591;1461;1461;26;1461;1056;1775,1776;800;942,943;1708;782;994;1707;1461;26,453,1480;26;1433,1446;2013;1461;1461;2380;1978;433;1101,3462;467;2135;2135;591;1792;591;3393;467;1461;1324,1732,3048,3049;591;467;1793;3405;1461;942,943;800;409,1760;1021;422;1706;1461;591;1053;1245;782;1461;402;409,1467,1514,1515,1516,1517;1053,1461;149;2090;1461;1461;1461;2272;26;830,1448;467;591;591;1713;994;591;29,545;1461;1584;389,3764;1245;1537;1461;591;1792;350;830;1705;1546;1654;26,454;912,913;1101,3462;1248;1461;1334;1461;3598;1461;2568,2569;1789;1532;1792;994;1532;1101,3462;26,416,1850,1852;1101,3462;548;358;106;1960;26,400,416,994,1850;1704;1532;1532;994;1461;1101;409;112;1098,1461;26,27;1984;350,1124,1125;2255;591;2301;2090;1654;1461;1461;1461;1461;3271;2355;467;381;1422;1322;591;1461;439;618;1572,1573,1574;139;2431;1810;1461;3587;1708;1708;1461;1233;1376,1377;1461;1792;1461;478;1654;1465,1466,1467;861,2276;1792;1461;107;591;2090;1461;591;26,1732,2087,3044;409,1467,1514,1515,1516,1517;591;591;26,2942;1325;752;752;1213,1461;467;3491;1792,1806;1654;830,1448;2307;112;1245;3056;1211,1242;785;134,135;1654;26;2859;1706;1654;416,1101;107;3452;942,943;752;752;511,591;550;1122;514,1707;1461;1647;1461;107;362;1884,1885;1229;694,1350;1706;1461;358;591;2219;389,505,1702,1703;414,571;942,943;752;112;591;752;334;1461;350;1461;3453;107,3241;2846;1706;1708;389,392,486;1461;1242;26,416,1712,1850,1852;1975;505;26,416,1532,1850,1852;1098;1461;1461;591;1180;591;531;1532,3308,3309,3310,3311;1461;416;1831,1832;1165;1404;145;467;752;591;1461;591;3381;403,634;1461;934;1705;1461;704;2420;467;3520;1461;468;591;1654;1461;752;722;1461;781;1461;1493;409,1760;1245;752;618;1461;1792,1806;779;591;752;1461;389,454;618;1122;1792,1806;1654;1792,1801;866,867,870;3626;26,1744;1098;1792;591;1762,1763;155,156;830;2362;2362;591;545;107;779;1705;2909;591;3788;591;2247;1461;591;26,1535,1536;1976;1792;885;409;1101,3462;1219;3545;634,1539,1540,1541;1461;1461;854;634,1539,1540,1541;1792,1806;1661;1245;1461;1122;942,943;2574;634;26,27,28,29;1049,1050;182,183;752;591;334;2687;1461;26,27;1098;1461;830;389,1707;1707;28,382,634;1461;1532,3097;107;1654;3737;1461;26;967,1489,2818,2819,2820,2821,2822;1461;1461;26,27;1461;370;1122;1336;994;370,618;1853;1245;1436;2675;634;826;467,597;3312;350,1124,1125;655;785,832;1461;591;26;414,571,591;1461;358,830;1461;26,358,409;467;2152;994;942,943;505,591;1240;549,550;3435;2185;1461;107;1532;1245;2085;752;591;3672;1461;782;1831,1832;1831,1832;1831,1832;1831,1832;2437;402;1336;1461;545,994,1532;1654;107,1546;782;1051;706;3274;810;1245;942,943;1461;26;752;1654;1428;2552;1245;467;559,1442,1443;1705,1706,1707;1436;415;1415,1416;942,943;370;752;785;1571,2116;107,409,1323,1481,1482;29,454,545,2299;942,943;548;942,943;752;370;1242;114;2034;390;2548;2154;26;2698;107;752;350,1124,1125;752;571;591;1461;26;830;1461;1461;409,2041;635;1461;1461;409,1467,1514,1515,1516,1517;1513;1654;1245;414;1122;591,2903;146;26,27;752;942,943;26,27;1792;982;1831,1832;26,27,28,29;545,591,1532;2366;591;2269;2128;591;1461;624;26,27,28,29;353;1707,2157;752;350,1124,1125;1461;591;1810;1748;1245;1245;1134,3550;75;1654,1792;1748;833;514;1461;779;453;26,453,1564,1565;994;1654;1273;1461;3244,3245;1792;2090;1245;1461;1245;26,27;1057;353;3416;1546,1762,1763;409,1467,1514,1515,1516,1517;1790;1753;1134,3550;1654;1792;591;3229;1245;86,3650,3651,3652;502,2168,2488;591;2698;1461;994;942,943;591,1094;1654;1461;2806;591;1236;1461;1461;112;2083;1461;1732;800;362;1706;26;402;86,3602;2379;873;381,591;1392;994;548;433;2698;2698;1349;1654;1245;942,943;1461;362;942,943;2090;478;545;2165;1461;591;604,605;590;934;1709;1245;1232;1792;591;350;826;1346;545,1704;467;602;1359;571;1792;1461;1461;1461;1654;2803;593,693;1378;1946;591;942,943;107;3598;26;3232;26,1532;676;1461;3549;26,1535,1536;1495;389,505,1702;752;545;389,505,1702;821,822;419;1331;2936;618;599;389,1707;1705;1461;2859;1461;752;2465;1748;2135;2135;1087;1461;1461;3126;591;1461;1245;1417;800;1461;2301;1792,1806;591;2167;26,27;107;1461;1461;26,27;410,591;830,1053,1461,1520;1792,1806;1245;362,1257,1654;2099;467;402;107;26,27;26,454;942,943;591;432,433,848;752;994;591;1461;1461;350,1124,1125;1792,1806;1461;993;26,955,2009,2010;1461;1810,3224,3225;994;1461;409,1467,1514,1515,1516,1517;439;1792;2845,2870,2871;414;1101;1712;1101,3462;240,1579,1580;1707;26,416,1850;1461;545;1245;1461;26,416,994,1850,1852;1706;1461;1229;1662;389,453,756;1792,1806;618;1792;467,591;591;1792,1806;949;655;1792;1705;1461;350,1124,1125;1654;1465,1466,1467;800;1461;1792;591;973,1096;1461;1707;365,1732,2087;475;668;591;1461;1706;1707;3738,3739;1245;1461;358;1384;591;591;1245;545,591;2433;389,1707;1789;1245;1245;499;591;350,1124,1125;26;1207;531;1461;422,591,638;1792;1761;523;1422;591;545,1461;752;752;192,193,194;1151,1152;1928;3211,3212,3213;26,416,1532,1850,1852;1447;1532;1792;365,1706,1707;26,1706;107;1654;350,1124,1125;942,943;894;1792,1806;1300;126;994,2579;1654;1553,1554,1555;3748;3375,3376,3377,3378;26,779;107,1774,2413;1461;1461;401;942,943;942,943;2858;942,943;2788;107;1706;1461;1601;1654;896;634;655;26,416,1711,1850;887,1180;3420;1397;2859;467,591;1347;591;390;1705,1706,1707;401,1220;1461;591;413;1098;942,943;1707;1461;591;1709;896;26;2966;1461;439;1245;1708;1792,1806;1220;26;942,943;467;358;26;409,1760;3381;885,1146;1461;1654;467;26,27;752;1245;1767;3748;1433,1446;1433,1446;389,454;370;26,27;122;1461;2698;26,1491;1792;591;591;1461;1461;1461;1245;2362;1461;591;405,406,407;452;454,982,1189;467;3381;381;1245;591;205,206;2090;1705;1220;887;3452;1461;498;389,1707;883;591;1792;1706;107;942,943;1532;803,967,1549,1550,1551;1413;1245;1654;591,1461;2111,2462;26,478,500;1461;1792,1806;-3725;1025;1134,3550;1461;107;2743,2744,2745;1654;1461;439;1461;610;350;994;830,1400,2721,2722;2866,2867;1748;1582;1336;1336;1336;830,1053,1461,1520;1792;26,3093;694;691,2287;3248;559,1442,1443;1854;1461;2600;3140;591;830;1461;1059;26,1047;26;1709;942,943;107,2413;1532;1789;2079;107;2698;591;830;626;857;1337;571;27,1093,1707,1837;1461;752;1461;752;1654;752;467;155,174;896;752;1245;1831,1832;-736,1831,1832;1831,1832;1831,1832;1831,1832;1336;590;1461;779;78,79,80;1336;1245;1245;1245;350,1124,1125;1792,1806;994;1220;2222;1792,1806;3188,3189;1654;1461;1245;779;1461;1936;1461;545,1689,1741,2059;942,943;75,1591;1461;1461;26;1708;89,3299;1170;358;467,505;1792,1806;409,1467,1514,1515,1516,1517;618;942,943;752;26,27,28,29;1461;1170;454;1461;591;2187;1792,1806;1461;1461;1461;1242;365;973,1313;942,943;591;26,27;26,27,28,29;2698;2269;591;1245;1245;1245;1462;1792,1806;1792,1806;752;1654;1792;1245;1461;1461;1461;409,1467,1514,1515,1516,1517;985,986;575,629,985,986;782,836;3151;1461;1792;3187;1647,3697;703;1098;26,27;779;107;1447;1461;1461;752;591;350;2401;3769;942,943;1757;934;2135;591;26,27,28,29;2051;382;632;131,1207;1246;1654;2125;1792;1461;362;1707;3603;618;401;1008,1009,1010;960,2082,2151;1461;591;1993;1960;1461;467;414,571,591;591;376;439;1654;376;1056;1180;26,27;1792;1792;557;591;590;854;409,1467,1514,1515,1516,1517;1792,1807;591;171,172;1831,1832;3184;2891;29;2925,2926;442,807,2597;934;942,943;1792;942,943;591;591;545,1461;467,591;934;934;1053,1461;454,511;1461;1461;1448,1461,1548;591;2135;390;591;498;591;1706;1246,1878;1810;26,27;1245;416;26,27;1532;26;1461;1220;1654;1461;577;1461;1098;1242;1461;1461;626;3266;704;2691;1461;1707,1712;1461;942,943;942,943;1461;1461;621;367,368,369,1461;2673;994;3612;1101,3462;2804;591;1792;591;1414;1101,3462;545;1461;2073;782;3531;1792,1806;1532;1245;3413;1705;26,416,1711,1850,1852;1853;1101,3462;26,416,1711;591;1708;1792;107,409,2574;752;26,692,1707;1706;26,416,994,1850,1852;1461;334;1707;312,313;655;1792;1461;1140;938;3120;800;673,674;1792,1806;1706;1461;861,2276;26,27,28,29;1364;1854;1461;942,943;942,943;591;1033,2693;1792;1196,1197,1198,1199,1200,1201,1202;752;1461;350,1124,1125;1461;1098;1705;3050,3051;3104;1792;1654;1245;1792,1806;1705,2244;852;26;1461;3126;1461;112;1732;26;389;26;1532;1461;1532;1654;1654;1216;1245;409,1467,1514,1515,1516,1517;1774;1414;1461;389,505,1702;1180,1461;591;2125;942,943;942,943;942,943;1687;618;1792;1070;591;26;1122;26;2668;873;1461;433;771;2125;26,401;591;1461;1461;942,943;1591;1676;1676;1461;1461;1098;1461;942,943;1461;26,107,439;1792,1806;390;1244;934,1997;3107;545;830,1053,1461,1520;2487;591;752;1465,1466,1467;350;389,1461;1322;1461;655,844;1461;655;1792;854;591;2120;669;2698;591;591;26,27,28,29;26;1461;1792,1806;1705;1792;1532;994;1461;785;2090;1792,1806;1461;433;994;2735;1461;27;1461;112;26,2575;1461;-3725;591;785;2580;1229;545;1461;107;26;1461;591;591;372,1654;994;1192,1193;655;591;3618;26;505;1654;591;26,59;994;350,1124,1125;26,2152;3569,3570;2193;1033;107;439;850,994;353;752;1461;1988;830;1461;358;1762,1763;1706;26,1532;1519;591;543;1461;779;1831,1832;1831,1832;1831,1832;1831,1832;1831,1832;1831,1832;959,960;1792;564;26,59;1461;847;1705;402,439;1061;591;1245;1074;1706;370;1461;1461;350;591;1461;350,1124,1125;1654;467,1220;350,1124,1125;2698;1461;942,943;942,943;370;1461;1654;1575;885;1706;350;1461;1757;982;1792;1245;1654;1461;704;334;3550;1134,3550;1134,3550;1134,3550;2414;1461;409,1467,1514,1515,1516,1517;402;830,1053,1461,1520;350;2307;1220;3475;350,1124,1125;1436;1707;439,835;-1054,1522;1053;26,27;1782;655;1447;1461;26,27,28,29;591;752;1245;26,27;1762,1763;1654;26,27;994;830,1053,1461,1520;942,943;934;1790;1792,1806;1654;1704;1359;1650;389,722;350;785,1461;1461;2590;439,454,591;1987;26,433,764;1461;3381;1344,1345;1036;1089,1654;1654;942,943;634,1853,3670;2924;1461;1792,1806;752;752;1792;942,943;334;800;1047;358;655;911;1280;-2984,-2985,-2986,-2987,-2988;3648;261;26,1532,3023;358;614;1461;432,1695,1696;934;626;1461;26;618;591;2135;1461;2698;26,27;453,756;353,1078;334;1792,1806;1654;704,1461;26,27;372,375;1654;416;1706;829;26,27;1461;350,1124,1125;433;1654;157;1461;26;26,591;212;591;942,943;1101,3462;1465,1466,1467;633;414,634,929,1707,2517,2518;26,416,994;409,1467,1514,1515,1516,1517;3608,3609;1461;1461;1461,3132;618;591;1461,1753;26;591;29;1361;316,1070;2067;1461;1793;779;350,1124,1125;591;1101;467;409,1467,1514,1515,1516,1517;86;1946;2947;3191;1461;350,1124,1125;1245;1671;591,1671;389,725;381,505,591;1771;1748;782;1654,1659;1233;994,3384;478;454;26;1706;782;1654;942,943;830;467;1461;1708;1461;1690;591;752;15,-27,323,324,325,326,327,328;350,1124,1125;365,823;1461;915;1060;390;1705;2469;1654;439;1426;655;591;655;1461;1858,3533;591;591;439;1461;370;1180;1358;1245;942,943;591;124,531,3466;785,2340;1748;29;26,27,28,29;1792;409,1417;1792;1426;26,1532;1370,2081;1872,2833;26;1461;1461;1134;1461;478;350;1762,1763;2352;591;1461;830,1053,1461,1520;1445;26,27;1461;1461;1461;2674;365;848;26,27;1336;2532;2532;591;350;2409;498;402;591;942,943;2896;752;1461;1654;402;1831,1832;1831,1832;-736,1831,1832;1831,1832;1831,1832;1831,1832;1831,1832;1831,1832;1831,1832;1831,1832;1426;1748;414,571,591;1461;618;467;1654;591;752;1654;1461;1245;370;791;1654;1654;1461;1792;942,943;591;1461;2474;1461;1180;3074;2284;1461;409,1760;1461;973,3071,3072;982;124,131,3737;1448,1461,1548;1245;1461;1461;1245;1245;1245;885;1461;1461;624;752;942,943;26,478;1245;439;2080;1681;1792;1705;26,3671;1461;1245;582;1461;2640;591;112,705;26,27,28,29;541,1045;1461;3530;550;2304;1461;591;1461;1707;1245;934;1098;1654;1101,3462;655;1286;1792,1807;1748;2189;934;2090;2803;205,314;1245;3483,3484;2135;2135;800;1532;1220;2435;1461;1654;800;3593;1433,1446;1420;1827;505,591;591;112,650;1245;1229;1748;1983;1101,3462;923;1136,1281;591;591;1792,1806;1461;655;1461;1461;26;1309;1532;1532;2051;478;752;1461;26,416,994,1850,1852;416;574,575;1748;1461;1433,1446;908;1758;1461;1751;3085,3086,3087;1461;1461;1792,1814;107;800;3046;1792;26,27;1461;1220;402;1792;390;800;2229;1436;1473;107;752;26,27,28,29;2098,2099;3384;591;1037;26,994;591;1705;1654;1654;478;800;1654;1461;1461;3574;475;1748;624;26,368,1189;1706;415;3483,3484;414;462;779;591,994,1461;1101,3462;2991;564;1532,3097;1790;2090;1704;722;591;1220;1879;863;1461;591;481;439;1708;318,319,320;3180;626;1214;2473;1523,1524;505,591;1532;1461;26,27;591;2356;1532;1436;545;1461;1461;353;1654;655;402;323,324,326,2899;1789;942,943;433;3208;1792;942,943;994;1461;2674;2674;934;1831,1832;1831,1832;1831,1832;1831,1832;1831,1832;2698;1654;591;453;591;590;2730;1461;1461;942,943;1792,1806;2834;591;591;942,943;1245;1245;1245;779;3072;1792;26,27;26,27,29;112,473;934;1245;1245;1245;1461;26,27,28,29;1970;1296;1461;2076;1245;453;26,27,28,29;1461;284;1461;2840,2841;1461;779;1346;1245;86,1637,1639,1640,1641,1642;1461;1236;409;1792;1461;26,1705;1461;1461;942,943;1581;1423;3381;1054;1245;911;2100;934;109,184;624;1245;1831,1832;1831,1832;2135;800;350,1124,1125;1461;591;370;1654;1748;591;439;1572,1573,1574;353;2051;1043;1654;353;350,1124,1125;260;1937;1461;1792,1806;350;591;3041;1792;1792;1101,3462;358;1346;1319;1098;107;107;1792;779,1647;218,222;2219;591,1461;908;1461;439;1654;26,1719,1852;26,27,28;779;26;26,27,28,29;26,27;381;1748;1831,1832;591;1654;2698;26,27,28,29,1836;1831,1832;350,1124,1125;1461;2698;1654;3483,3484;2580;908;791;1219;3592;1461;779;634,1532;3550;-1492;350,1124,1125;591;269,270;439,481;467;1706;1461;1789;1792;1461;1461;591,906;1461;2271;1831,1832;1831,1832;1831,1832;1831,1832;1461;1654;29;26,27,28,29;2833;618;26,478,1706;1461;591,2224;1245;2397;1068,1253;1704;26,27,28,29;704;350;26,27;624;934;1426;26,27,28,29;307,3756;1461;3760;590;26;1962;779;655;1346;2364;2813,2814,2815;26,27;1245;1654;1532;1461;1654;1461;531;372;591;885;3249;1461;897;1784,1785,1786,1787,1829;1245;1749;416;1026;26;26,3023;807;807;1461;934;934;779;1792,1806;3551;350,1124,1125;467;107,2732;1831,1832;391;1426;911;591;591;401;26,27;1748;1461;1461;1417;26,416,1850,1852;1461;1461;1433,1446;1221,1654;350,1124,1125;618;1461;27;1290;2460;1461;779;439,1098;365;1654;1461;942,943;1707;1748;3243;861;26,1072,1073;1654;2335;26,1708;655;1461;1461;1532,3261;1245;1654;389;1461;1461;2723;1706;1532;591;409,1760;1461;511,624;2576;350,1461;1792;362;1792;624;1461;1461;26;2295,2296;2623;1654;591;454;934;1461;1461;1831,1832;1831,1832;1831,1832;1831,1832;830,1322;1654;1654;1775,1776;481;3483,3484;591;1461;409,1760;1706;1461;654;26,27;26,27;1831,1832;896;1654;402;1654;1705,1706,1707;942,943;26,27,28;779;1654;1461;1654;1715;2698;1934,1935;1461;2924;1461;1654;540;315;26;1831,1832;452;807;3613;934;629;1831,1832;390;994;1461;2698;1245;26,27;1374;626;1098;591;1426;1792;1242;1663;350;1792,1806;1461;752;2204;3227;2719;591;186,187;1706;1704;409,1467,1514,1515,1516,1517;591,2165;1290;830,1053,1461,1520;358;1654;2607;1532,3308,3309,3310,3311,3312;26,27,28,29;1461;1324;3483,3484;409,1760;1346;2397;591;390;1792;1461;2215;1461;107,2413;1233;1008,1009,1010;2019;112;1831,1832;1831,1832;1831,1832;1831,1832;1831,1832;1831,1832;144;26,27;26,27;26,27;26;1461;2047;370;655;439;2924;1654,3089;618;591;1461;1173;1792,1807;1792,1807;885;1418;590;1831,1832;3215;1708;75;1461;1461;800;1461;350;26,2723;473;26,807;591;563;86;1346;350,1124,1125;1461;1762,1763;26,643,644;2165;779;2257;1284;26,59;26,59;1831,1832;1461;626;350,1124,1125;26;1105;1461;1461;1245;350;498;1327,1707,1712;1461;1461;1792;3550;908;1461;1654;779;1831,1832;1831,1832;1654;133;2099,2101;498;26,27,28,29;1705,1706,1707;3483,3484;1705;3556;489;2924;1180;1831,1832;1708;1101,3462;3146;402;1748;2698;1654;1180;1461;370;159,160;1098;1461;2738,2739;2577;1706;1346;358;1654;1654;26,27;1461;1461;311;2598,2599;1831,1832;1461;3483,3484;1461;1889,1890;389;3550;1732;1461;559;1831,1832;409,851;353;704;1461;590;779;3443;1461;782;1831,1832;350,1124,1125;26,27,28,29;1461;362;335,336,352,353,3773;1101;26;26;1461;2090;1461;1461;337,338;1461;1831,1832;3483,3484;420,453,756,1708;350,1124,1125;1461;1461;365,590;3483,3484;3483,3484;626;3395;107;748;1426;107;591;27;1532;26,1189,1229,1747;779;1426;1108;3098;1461;1707;3483,3484;2572;350;1382;2868,3078;1461;590;1346;3483,3484;1381;1532;439;3483,3484;1461;26,27,28,29;3483,3484;1708;2406;1792;1346;3483,3484;1654;779;779;26;1988;27;26;3483,3484;591;968;1461;3485;1654;1461;1461;75;414,590;1831,1832;131,1636;888;3483,3484;27;1831,1832;478;896;3314;1461;402;3483,3484;921;791;591;3483,3484;1461;3483,3484;1461;198,199;26,59";

const $scriptletHostnames$ = /* 13141 */ ["j.gs","s.to","3sk.*","al.ly","asd.*","bc.vc","br.de","bs.to","clk.*","di.fm","fc.lc","fr.de","fzm.*","g3g.*","gmx.*","hqq.*","kat.*","lz.de","m4u.*","mt.de","nn.de","nw.de","o2.pl","op.gg","ouo.*","oxy.*","pnd.*","rp5.*","sh.st","sn.at","th.gl","tpb.*","tu.no","tz.de","ur.ly","vev.*","vz.lt","wa.de","wn.de","wp.de","wp.pl","wr.de","x.com","ytc.*","yts.*","za.gl","ze.tt","00m.in","1hd.to","2ddl.*","33sk.*","4br.me","4j.com","538.nl","9tsu.*","a8ix.*","agf.nl","aii.sh","al.com","as.com","av01.*","bab.la","bbf.lt","bcvc.*","bde4.*","btdb.*","btv.bg","c2g.at","cap3.*","cbc.ca","crn.pl","djs.sk","dlhd.*","dna.fr","dnn.de","dodz.*","dood.*","eio.io","epe.es","ettv.*","ew.com","exe.io","eztv.*","fbgo.*","fnp.de","ft.com","geo.de","geo.fr","goo.st","gra.pl","haz.de","hbz.us","hd21.*","hdss.*","hna.de","iir.ai","iiv.pl","imx.to","ioe.vn","jav.re","jav.sb","jav.si","javx.*","kaa.lt","kaa.mx","kat2.*","kio.ac","kkat.*","kmo.to","kwik.*","la7.it","lne.es","lnk.to","lvz.de","m5g.it","met.bz","mexa.*","mmm.dk","mtv.fi","nj.com","nnn.de","nos.nl","now.gg","now.us","noz.de","npo.nl","nrz.de","nto.pl","ntv.cx","och.to","oii.io","oii.la","ok.xxx","oke.io","oko.sh","ovid.*","pahe.*","pe.com","pnn.de","poop.*","qub.ca","ran.de","rgb.vn","rgl.vn","rtl.de","rtv.de","s.to>>","sab.bz","sfr.fr","shz.de","siz.tv","srt.am","svz.de","tek.no","tf1.fr","tfp.is","tii.la","tio.ch","tny.so","top.gg","tpi.li","tv2.no","tvn.pl","tvtv.*","txxx.*","uii.io","upns.*","vido.*","vip.de","vod.pl","voe.sx","vox.de","vsd.fr","waaw.*","waz.de","wco.tv","web.de","xnxx.*","xup.in","xxnx.*","yts2.*","zoro.*","0xxx.ws","10gb.vn","1337x.*","1377x.*","1ink.cc","24pdd.*","5278.cc","5play.*","7mmtv.*","7xm.xyz","8tm.net","a-ha.io","adn.com","adsh.cc","adsrt.*","adsy.pw","adyou.*","adzz.in","ahri8.*","ak4eg.*","akoam.*","akw.cam","akwam.*","an1.com","an1me.*","arbsd.*","babla.*","bbc.com","bgr.com","bgsi.gg","bhg.com","bild.de","biqle.*","bunkr.*","car.com","cbr.com","cbs.com","chip.de","cine.to","clik.pw","cnn.com","crn.com","ctrlv.*","dbna.de","deco.fr","delo.bg","dict.cc","digi.no","dirp.me","dlhd.sx","docer.*","doods.*","doood.*","elixx.*","enit.in","eska.pl","exe.app","exey.io","fakt.pl","faz.net","ffcv.es","filmy.*","fomo.id","fox.com","fpo.xxx","gala.de","gala.fr","gats.io","gdtot.*","giga.de","gk24.pl","gntai.*","gnula.*","goku.sx","gomo.to","gotxx.*","govid.*","gp24.pl","grid.id","gs24.pl","gsurl.*","hdvid.*","hdzog.*","hftg.co","igram.*","inc.com","inra.bg","itv.com","j5z.xyz","javhd.*","jizz.us","jmty.jp","joyn.at","joyn.ch","joyn.de","jpg2.su","jpg6.su","k1nk.co","k511.me","kaas.ro","kfc.com","khsm.io","kijk.nl","kino.de","kinox.*","kinoz.*","koyso.*","ksl.com","ksta.de","lato.sx","laut.de","leak.sx","link.tl","linkz.*","linx.cc","litv.tv","lnbz.la","lnk2.cc","logi.im","lulu.st","m4uhd.*","mail.de","mdn.lol","mega.nz","mexa.sh","mlb.com","mlfbd.*","mlsbd.*","mlwbd.*","moin.de","mopo.de","more.tv","moto.it","movi.pk","mtv.com","myegy.*","n-tv.de","nba.com","nbc.com","netu.ac","news.at","news.bg","news.de","nfl.com","nmac.to","noxx.to","nuvid.*","odum.cl","oe24.at","oggi.it","oload.*","onle.co","onvid.*","opvid.*","oxy.edu","oyohd.*","pelix.*","pes6.es","pfps.gg","pngs.gg","pnj.com","pobre.*","prad.de","qmh.sex","rabo.no","rat.xxx","raw18.*","rmcmv.*","sat1.de","sbot.cf","seehd.*","send.cm","sflix.*","sixx.de","sms24.*","songs.*","spy.com","stape.*","stfly.*","swfr.tv","szbz.de","tj.news","tlin.me","tr.link","ttks.tw","tube8.*","tune.pk","tvhay.*","tvply.*","tvtv.ca","tvtv.us","u.co.uk","ujav.me","uns.bio","upi.com","upn.one","upvid.*","vcp.xxx","veev.to","vidd.se","vidhd.*","vidoo.*","vidop.*","vids.st","vidup.*","vipr.im","viu.com","vix.com","viz.com","vkmp3.*","vods.tv","vox.com","vozz.vn","vpro.nl","vsrc.su","vudeo.*","waaaw.*","waaw1.*","welt.de","wgod.co","wiwo.de","wwd.com","xtits.*","ydr.com","yiv.com","yout.pw","ytmp3.*","zeit.de","zeiz.me","zien.pl","0deh.com","123mkv.*","15min.lt","1flix.to","1mov.lol","20min.ch","2embed.*","2ix2.com","3prn.com","4anime.*","4cash.me","4khd.com","519.best","58n1.com","7mmtv.sx","85po.com","9gag.com","9mod.com","9n8o.com","9xflix.*","a2zapk.*","aalah.me","actvid.*","adbull.*","adeth.cc","adfloz.*","adfoc.us","adsup.lk","aetv.com","afly.pro","agefi.fr","al4a.com","alpin.de","anigo.to","anoboy.*","arcor.de","ariva.de","asd.pics","asiaon.*","atxtv.co","auone.jp","ayo24.id","azsoft.*","babia.to","bbw6.com","bdiptv.*","bdix.app","bif24.pl","bigfm.de","bilan.ch","bing.com","binged.*","bjhub.me","blick.ch","blick.de","bmovie.*","bombuj.*","booru.eu","brato.bg","brevi.eu","bunkr.la","bunkrr.*","bzzhr.co","bzzhr.to","cam4.com","canna.to","capshd.*","cataz.to","cety.app","cgaa.org","chd4.com","cima4u.*","cineb.gg","cineb.rs","cinen9.*","citi.com","clk.asia","cnbc.com","cnet.com","comix.to","crichd.*","crone.es","cuse.com","cwtv.com","cybar.to","cykf.net","dahh.net","dazn.com","dbna.com","deano.me","dewimg.*","dfiles.*","dlhd.*>>","doods.to","doodss.*","dooood.*","dosya.co","duden.de","dump.xxx","ecac.org","eee1.lat","egolf.jp","eldia.es","emoji.gg","ervik.as","espn.com","exee.app","exeo.app","exyi.net","f75s.com","fastt.gg","fembed.*","files.cx","files.fm","files.im","filma1.*","finya.de","fir3.net","flixhq.*","fmovie.*","focus.de","friv.com","fupa.net","fxmag.pl","fzlink.*","g9r6.com","ganool.*","gaygo.tv","gdflix.*","ggjav.tv","gload.to","glodls.*","gogohd.*","gokutv.*","gol24.pl","golem.de","gtavi.pl","gusto.at","hackr.io","haho.moe","hd44.com","hd44.net","hdbox.ws","hdfull.*","heftig.*","heise.de","hidan.co","hidan.sh","hilaw.vn","hk01.com","hltv.org","howdy.id","hoyme.jp","hpjav.in","hqtv.biz","html.net","huim.com","hulu.com","hydrax.*","hyhd.org","iade.com","ibbs.pro","icelz.to","idnes.cz","imgdew.*","imgsen.*","imgsto.*","imgviu.*","isi7.net","its.porn","j91.asia","janjua.*","jmanga.*","jmmv.dev","jotea.cl","kaido.to","katbay.*","kcra.com","kduk.com","keepv.id","kizi.com","kloo.com","km77.com","kmed.com","kmhd.net","kmnt.com","kpnw.com","ktee.com","ktmx.pro","kukaj.io","kukni.to","kwro.com","l8e8.com","l99j.com","la3c.com","lablue.*","lared.cl","lejdd.fr","levif.be","lin-ks.*","link1s.*","linkos.*","liveon.*","lnk.news","ma-x.org","magesy.*","mail.com","mazpic.*","mcloud.*","mgeko.cc","miro.com","missav.*","mitly.us","mixdrp.*","mixed.de","mkvhub.*","mmsbee.*","moms.com","money.bg","money.pl","movidy.*","movs4u.*","my1ink.*","my4w.com","myad.biz","mycima.*","mzee.com","n.fcd.su","ncaa.com","newdmn.*","nhl66.ir","nick.com","nohat.cc","nola.com","notube.*","ogario.*","orsm.net","oui.sncf","pa1n.xyz","pahe.ink","pasend.*","payt.com","pctnew.*","picks.my","picrok.*","pingit.*","pirate.*","pixlev.*","pluto.tv","plyjam.*","plyvdo.*","pogo.com","pons.com","porn.com","porn0.tv","pornid.*","pornx.to","qa2h.com","quins.us","quoka.de","r2sa.net","racaty.*","radio.at","radio.de","radio.dk","radio.es","radio.fr","radio.it","radio.pl","radio.pt","radio.se","ralli.ee","ranoz.gg","rargb.to","rasoi.me","rdxhd1.*","rintor.*","rootz.so","roshy.tv","saint.to","sanet.lc","sanet.st","sbchip.*","sbflix.*","sbplay.*","sbrulz.*","seeeed.*","senda.pl","seriu.jp","sex3.com","sexvid.*","sflix.fi","shopr.tv","short.pe","shtab.su","shtms.co","shush.se","slant.co","so1.asia","splay.id","sport.de","sport.es","spox.com","sptfy.be","stern.de","stfly.me","strtpe.*","svapo.it","swdw.net","swzz.xyz","sxsw.com","sxyprn.*","t20cup.*","t7meel.*","tasma.ru","tbib.org","tele5.de","thegay.*","thekat.*","thoptv.*","tirexo.*","tmearn.*","tobys.dk","today.it","toggo.de","trakt.tv","trend.at","trrs.pro","tubeon.*","tubidy.*","turbo.fr","tv247.us","tvepg.eu","tvn24.pl","tvnet.lv","txst.com","udvl.com","uiil.ink","upapk.io","uproxy.*","uqload.*","urbia.de","uvnc.com","v.qq.com","vanime.*","vapley.*","vedbam.*","vedbom.*","vembed.*","venge.io","vibe.com","vid4up.*","vidlo.us","vidlox.*","vidsrc.*","vidup.to","viki.com","vipbox.*","viper.to","viprow.*","virpe.cc","vlive.tv","voe.sx>>","voici.fr","voxfm.pl","vozer.io","vozer.vn","vtbe.net","vtmgo.be","vtube.to","vumoo.cc","vxxx.com","wat32.tv","watch.ug","wcofun.*","wcvb.com","webbro.*","wepc.com","wetter.*","wfmz.com","wkyc.com","woman.at","work.ink","wowtv.de","wp.solar","wplink.*","wttw.com","wyze.com","x1337x.*","xcum.com","xh.video","xo7c.com","xvide.me","xxf.mobi","xxr.mobi","xxu.mobi","y2mate.*","yelp.com","yepi.com","yflix.to","youx.xxx","yporn.tv","yt1s.com","yt5s.com","ytapi.cc","ythd.org","z4h4.com","zbporn.*","zdrz.xyz","zee5.com","zooqle.*","zshort.*","0vg9r.com","10.com.au","10short.*","123link.*","123mf9.my","18xxx.xyz","1milf.com","1stream.*","2024tv.ru","26efp.com","2conv.com","2glho.org","2kmovie.*","2ndrun.tv","3dzip.org","3movs.com","49ers.com","4share.vn","4stream.*","4tube.com","51sec.org","5flix.top","5mgz1.com","5movies.*","6jlvu.com","7bit.link","7mm003.cc","7starhd.*","9anime.pe","9hentai.*","9xbuddy.*","9xmovie.*","a-o.ninja","a2zapk.io","aagag.com","aagmaal.*","abcya.com","acortar.*","adcorto.*","adsfly.in","adshort.*","adurly.cc","aduzz.com","afk.guide","agar.live","ah-me.com","aikatu.jp","airtel.in","alphr.com","ampav.com","andyday.*","anidl.org","anikai.to","animekb.*","animesa.*","anitube.*","aniwave.*","anizm.net","apkmb.com","apkmody.*","apl373.me","apl374.me","apl375.me","appdoze.*","appvn.com","aram.zone","arc018.to","arcai.com","art19.com","artru.net","asd.homes","atlaq.com","atomohd.*","awafim.tv","aylink.co","azel.info","azmen.com","azrom.net","bakai.org","bdlink.pw","beeg.fund","befap.com","bflix.*>>","bhplay.me","bibme.org","bigwarp.*","biqle.com","bitfly.io","bitlk.com","blackd.de","blkom.com","blog24.me","blogk.com","bmovies.*","boerse.de","bolly4u.*","boost.ink","brainly.*","btdig.com","buffed.de","busuu.com","c1z39.com","cambabe.*","cambb.xxx","cambro.io","cambro.tv","camcam.cc","camcaps.*","camhub.cc","canela.tv","canoe.com","ccurl.net","cda-hd.cc","cdn1.site","cdn77.org","cdrab.com","cfake.com","chatta.it","chyoa.com","cinema.de","cinetux.*","cl1ca.com","clamor.pl","cloudy.pk","cmovies.*","colts.com","comunio.*","ctrl.blog","curto.win","cutdl.xyz","cybar.xyz","czxxx.org","d000d.com","d0o0d.com","daddyhd.*","daybuy.tw","debgen.fr","dfast.app","dfiles.eu","dflinks.*","dhd24.com","djmaza.my","djstar.in","djx10.org","dlgal.com","do0od.com","do7go.com","domaha.tv","doods.pro","doooood.*","doply.net","dotflix.*","doviz.com","dropmms.*","dropzy.io","drrtyr.mx","drtuber.*","drzna.com","dumpz.net","dvdplay.*","dx-tv.com","dz4soft.*","eater.com","echoes.gr","efukt.com","eg4link.*","egybest.*","egydead.*","eltern.de","embedme.*","embedy.me","embtaku.*","emovies.*","enorme.tv","entano.jp","eodev.com","erogen.su","erome.com","eroxxx.us","erzar.xyz","europix.*","evaki.fun","evo.co.uk","exego.app","eyalo.com","f16px.com","fap16.net","fapnado.*","faps.club","fapxl.com","faselhd.*","fast-dl.*","fc-lc.com","feet9.com","femina.ch","ffjav.com","fifojik.*","file4go.*","fileq.net","filma24.*","filmex.to","finfang.*","flixhd.cc","flixhq.ru","flixhq.to","flixhub.*","flixtor.*","flvto.biz","fmj.co.uk","fmovies.*","fooak.com","forsal.pl","foundit.*","foxhq.com","freep.com","freewp.io","frembed.*","frprn.com","fshost.me","ftopx.com","ftuapps.*","fuqer.com","furher.in","fx-22.com","gahag.net","gayck.com","gayfor.us","gayxx.net","gdirect.*","ggjav.com","gifhq.com","giize.com","globo.com","glodls.to","gm-db.com","gmanga.me","gofile.to","gojo2.com","gomov.bio","gomoviz.*","goplay.ml","goplay.su","gosemut.*","goshow.tv","gototub.*","goved.org","gowyo.com","goyabu.us","gplinks.*","gsdn.live","gsm1x.xyz","guum5.com","gvnvh.net","hanime.tv","happi.com","haqem.com","hax.co.id","hd-xxx.me","hdfilme.*","hdgay.net","hdhub4u.*","hdrez.com","hdss-to.*","heavy.com","hellnaw.*","hentai.tv","hh3dhay.*","hhesse.de","hianime.*","hideout.*","hitomi.la","hmt6u.com","hoca2.com","hoca6.com","hoerzu.de","hojii.net","hokej.net","hothit.me","hotmovs.*","hugo3c.tw","huyamba.*","hxfile.co","i-bits.io","ibooks.to","icdrama.*","iceporn.*","ico3c.com","idpvn.com","ihow.info","ihub.live","ikaza.net","ilinks.in","imeteo.sk","img4fap.*","imgmaze.*","imgrock.*","imgtown.*","imgur.com","imgview.*","imslp.org","ingame.de","intest.tv","inwepo.co","io.google","iobit.com","iprima.cz","iqiyi.com","ireez.com","isohunt.*","janjua.tv","jappy.com","japscan.*","jasmr.net","javboys.*","javcl.com","javct.net","javdoe.sh","javfor.tv","javfun.me","javhat.tv","javhd.*>>","javmix.tv","javpro.cc","javsub.my","javup.org","javwide.*","jkanime.*","jootc.com","kali.wiki","karwan.tv","katfile.*","keepvid.*","ki24.info","kick4ss.*","kickass.*","kicker.de","kinoger.*","kissjav.*","klmanga.*","koora.vip","krx18.com","kuyhaa.me","kzjou.com","l2db.info","l455o.com","lawyex.co","lecker.de","legia.net","lenkino.*","lesoir.be","linkfly.*","liveru.sx","ljcam.net","lkc21.net","lmtos.com","lnk.parts","loader.fo","loader.to","loawa.com","lodynet.*","lookcam.*","lootup.me","los40.com","m.kuku.lu","m1xdrop.*","m4ufree.*","magma.com","magmix.jp","mamadu.pl","mangaku.*","manhwas.*","maniac.de","mapple.tv","marca.com","mavplay.*","mboost.me","mc-at.org","mcrypto.*","mega4up.*","merkur.de","messen.de","mgnet.xyz","mhn.quest","milfnut.*","miniurl.*","mitele.es","mixdrop.*","mkvcage.*","mkvpapa.*","mlbbox.me","mlive.com","mmo69.com","mobile.de","mod18.com","momzr.com","moontv.to","mov2day.*","mp3clan.*","mp3fy.com","mp3spy.cc","mp3y.info","mrgay.com","mrjav.net","msic.site","multi.xxx","mxcity.mx","myaew.com","mynet.com","mz-web.de","nbabox.co","ncdnstm.*","nekopoi.*","netcine.*","neuna.net","news38.de","nhentai.*","niadd.com","nikke.win","nkiri.com","nknews.jp","notion.so","nowgg.lol","noxx.to>>","nozomi.la","npodoc.nl","nxxn.live","nyaa.land","nydus.org","oatuu.org","obsev.com","ocala.com","ocnpj.com","ofiii.com","ofppt.net","ohmymag.*","ok-th.com","okanime.*","okblaz.me","omavs.com","oosex.net","opjav.com","orunk.com","owlzo.com","oxxfile.*","pahe.plus","palabr.as","palimas.*","pasteit.*","pastes.io","pcwelt.de","pelis28.*","pepar.net","pferde.de","phodoi.vn","phois.pro","picrew.me","pixhost.*","pkembed.*","player.pl","plylive.*","pogga.org","popjav.in","poqzn.xyz","porn720.*","porner.tv","pornfay.*","pornhat.*","pornhub.*","pornj.com","pornlib.*","porno18.*","pornuj.cz","powvdeo.*","premio.io","profil.at","psarips.*","pugam.com","pussy.org","pynck.com","q1003.com","qcheng.cc","qcock.com","qlinks.eu","qoshe.com","quizz.biz","radio.net","rarbg.how","readm.org","redd.tube","redisex.*","redtube.*","redwap.me","remaxhd.*","rentry.co","rexporn.*","rexxx.org","rezst.xyz","rezsx.xyz","rfiql.com","riveh.com","rjno1.com","rock.porn","rokni.xyz","rooter.gg","rphost.in","rshrt.com","ruhr24.de","rytmp3.io","s2dfree.*","saint2.cr","samfw.com","satdl.com","sbnmp.bar","sbplay2.*","sbplay3.*","sbsun.com","scat.gold","seazon.fr","seelen.io","seexh.com","series9.*","seulink.*","sexmv.com","sexsq.com","sextb.*>>","sezia.com","sflix.pro","shape.com","shlly.com","shmapp.ca","shorten.*","shrdsk.me","shrib.com","shrink.yt","shrinke.*","shrtfly.*","skardu.pk","skpb.live","skysetx.*","slate.com","slink.bid","smutr.com","son.co.za","songspk.*","spcdn.xyz","sport1.de","sssam.com","ssstik.io","staige.tv","strms.net","strmup.cc","strmup.to","strmup.ws","strtape.*","study.com","sulasok.*","swame.com","swgop.com","syosetu.*","sythe.org","szene1.at","talaba.su","tamilmv.*","taming.io","tatli.biz","tech5s.co","teensex.*","terabox.*","tfly.link","tgo-tv.co","themw.com","thgss.com","thothd.to","thothub.*","tinhte.vn","tnp98.xyz","to.com.pl","today.com","todaypk.*","tojav.net","topflix.*","topjav.tv","torlock.*","tpaste.io","tpayr.xyz","tpz6t.com","trutv.com","tryzt.xyz","tubev.sex","tubexo.tv","tukoz.com","turbo1.co","tvguia.es","tvinfo.de","tvlogy.to","tvporn.cc","txori.com","txxx.asia","ucptt.com","udebut.jp","ufacw.com","uflash.tv","ujszo.com","ulsex.net","unicum.de","upbam.org","upfiles.*","upiapi.in","uplod.net","uporn.icu","upornia.*","uppit.com","uproxy2.*","upxin.net","upzone.cc","uqozy.com","urlcero.*","ustream.*","uxjvp.pro","v1kkm.com","vdtgr.com","vebo1.com","veedi.com","vg247.com","vid2faf.*","vidara.so","vidara.to","vidbm.com","vide0.net","videobb.*","vidfast.*","vidmoly.*","vidplay.*","vidsrc.cc","vidzy.org","vienna.at","vinaurl.*","vinovo.to","vip1s.top","vipurl.in","vivuq.com","vladan.fr","vnuki.net","voodc.com","vplink.in","vtlinks.*","vttpi.com","vvid30c.*","vvvvid.it","w3cub.com","waezg.xyz","waezm.xyz","webmaal.*","webtor.io","wecast.to","weebee.me","wetter.de","wildwap.*","winporn.*","wiour.com","wired.com","woiden.id","world4.eu","wpteq.org","wvt24.top","x-tg.tube","x24.video","xbaaz.com","xbabe.com","xcafe.com","xcity.org","xcoic.com","xcums.com","xecce.com","xexle.com","xhand.com","xhbig.com","xmovies.*","xpaja.net","xtapes.me","xvideos.*","xvipp.com","xxx24.vip","xxxhub.cc","xxxxxx.hu","y2down.cc","yeptube.*","yeshd.net","ygosu.com","yjiur.xyz","ymovies.*","youku.com","younetu.*","youporn.*","yt2mp3s.*","ytmp3s.nu","ytpng.net","ytsaver.*","yu2be.com","zataz.com","zdnet.com","zedge.net","zefoy.com","zhihu.com","zjet7.com","zojav.com","zovo2.top","zrozz.com","0gogle.com","0gomovie.*","10starhd.*","123anime.*","123chill.*","13tv.co.il","141jav.com","18tube.sex","1apple.xyz","1bit.space","1kmovies.*","1link.club","1stream.eu","1tamilmv.*","1todaypk.*","1xanime.in","2best.club","2the.space","2umovies.*","3dzip.info","3fnews.com","3hiidude.*","3kmovies.*","3xyaoi.com","4-liga.com","4kporn.xxx","4porn4.com","4tests.com","4tube.live","5ggyan.com","5xmovies.*","720pflix.*","8boobs.com","8muses.xxx","8xmovies.*","91porn.com","96ar.com>>","9908ww.com","9anime.vip","9animes.ru","9kmovies.*","9monate.de","9xmovies.*","9xupload.*","a1movies.*","acefile.co","acortalo.*","adshnk.com","adslink.pw","aeonax.com","aether.mom","afdah2.com","akmcloud.*","all3do.com","allfeeds.*","alphatv.gr","amboss.com","ameede.com","amindi.org","anchira.to","andani.net","anime4up.*","animedb.in","animeflv.*","animeid.tv","animekai.*","animesup.*","animetak.*","animez.org","anitube.us","aniwatch.*","aniwave.uk","anodee.com","anon-v.com","anroll.net","ansuko.net","antenne.de","anysex.com","apkhex.com","apkmaven.*","apkmody.io","arabseed.*","archive.fo","archive.is","archive.li","archive.md","archive.ph","archive.vn","arcjav.com","areadvd.de","aruble.net","ashrfd.xyz","ashrff.xyz","asiansex.*","asiaon.top","asmroger.*","ate9ni.com","atishmkv.*","atomixhq.*","atomtt.com","av01.media","avjosa.com","avtub.cx>>","awpd24.com","axporn.com","ayuka.link","aznude.com","babeporn.*","baikin.net","bakotv.com","bandle.app","bang14.com","bayimg.com","bblink.com","bbw.com.es","bdokan.com","bdsmx.tube","bdupload.*","beatree.cn","beeg.party","beeimg.com","bembed.net","bestcam.tv","bigten.org","bildirim.*","bloooog.it","bluetv.xyz","bnnvara.nl","boards.net","boombj.com","borwap.xxx","bos21.site","boyfuck.me","brian70.tw","brides.com","brillen.de","brmovies.*","brstej.com","btvplus.bg","byrdie.com","bztube.com","calvyn.com","camflow.tv","camfox.com","camhoes.tv","camseek.tv","canada.com","capital.de","capital.fr","cashkar.in","cavallo.de","cboard.net","cdn256.xyz","ceesty.com","cekip.site","cerdas.com","cgtips.org","chiefs.com","ciberdvd.*","cimanow.cc","cinemar.cc","cityam.com","citynow.it","ckxsfm.com","cluset.com","codare.fun","code.world","cola16.app","colearn.id","comtasq.ca","connect.de","cookni.net","cpscan.xyz","creatur.io","cricfree.*","cricfy.net","crictime.*","crohasit.*","csrevo.com","cuatro.com","cubshq.com","cuckold.it","cuevana.is","cuevana3.*","cutnet.net","cuttty.com","cwseed.com","d0000d.com","ddownr.com","deezer.com","demooh.com","depedlps.*","desiflix.*","desimms.co","desired.de","destyy.com","dev2qa.com","dfbplay.tv","diaobe.net","disqus.com","djamix.net","djxmaza.in","dloady.com","dnevnik.hr","do-xxx.com","dogecoin.*","dojing.net","domahi.net","donk69.com","doodle.com","dopebox.to","dorkly.com","downev.com","dpstream.*","drivebot.*","driveup.in","driving.ca","drphil.com","dshytb.com","dsmusic.in","dtmaga.com","du-link.in","dvm360.com","dz4up1.com","earncash.*","earnload.*","easysky.in","ebc.com.br","ebony8.com","ebookmed.*","ebuxxx.net","edmdls.com","egyup.live","elmundo.es","embed.casa","embedv.net","emsnow.com","emurom.net","epainfo.pl","eplayvid.*","eplsite.uk","erofus.com","erotom.com","eroxia.com","evileaks.*","evojav.pro","ewybory.eu","exeygo.com","exnion.com","express.de","f1livegp.*","f1stream.*","f2movies.*","fabmx1.com","fakaza.com","fake-it.ws","falpus.com","familie.de","fandom.com","fapcat.com","fapdig.com","fapeza.com","fapset.com","faqwiki.us","fastly.net","fautsy.com","fboxtv.com","fbstream.*","festyy.com","ffmovies.*","fhedits.in","fikfak.net","fikiri.net","fikper.com","filedown.*","filemoon.*","fileone.tv","filesq.net","film1k.com","film4e.com","filmi7.net","filmovi.ws","filmweb.pl","filmyfly.*","filmygod.*","filmyhit.*","filmypur.*","filmywap.*","finanzen.*","finclub.in","fitbook.de","flickr.com","flixbaba.*","flixhub.co","flybid.net","fmembed.cc","forgee.xyz","formel1.de","foxnxx.com","freeload.*","freenet.de","freevpn.us","friars.com","frogogo.ru","fsplayer.*","fstore.biz","fuckdy.com","fullreal.*","fulltube.*","fullxh.com","funzen.net","funztv.com","fuxnxx.com","fxporn69.*","fzmovies.*","gadgets.es","game5s.com","gamenv.net","gamepro.de","gatcha.org","gawbne.com","gaydam.net","gcloud.cfd","gdfile.org","gdmax.site","gdplayer.*","gentside.*","gestyy.com","giants.com","gifans.com","giff.cloud","gigaho.com","givee.club","gkbooks.in","gkgsca.com","gleaks.pro","gledaitv.*","gmenhq.com","gnomio.com","go.tlc.com","gocast.pro","gochyu.com","goduke.com","goeags.com","goegoe.net","gofilmes.*","goflix.sbs","gogodl.com","gogoplay.*","gogriz.com","gomovies.*","google.com","gopack.com","gostream.*","goutsa.com","gozags.com","gozips.com","gplinks.co","grasta.net","gtaall.com","gunauc.net","haddoz.net","hamburg.de","hamzag.com","hanauer.de","hanime.xxx","hardsex.cc","harley.top","hartico.tv","haustec.de","haxina.com","hcbdsm.com","hclips.com","hd-tch.com","hdfriday.*","hdporn.net","hdtoday.cc","hdtoday.tv","hdzone.org","health.com","hechos.net","hentaihd.*","hentaisd.*","hextank.io","hhkungfu.*","hianime.to","himovies.*","hitprn.com","hivelr.com","hl-live.de","hoca4u.com","hoca4u.xyz","hostxy.com","hotmasti.*","hotovs.com","house.porn","how2pc.com","howifx.com","hqbang.com","huavod.com","huavod.net","huavod.top","hub2tv.com","hubcdn.vip","hubdrive.*","huoqwk.com","hydracdn.*","icegame.ro","iceporn.tv","idevice.me","idlixvip.*","igay69.com","illink.net","ilmeteo.it","imag-r.com","imgair.net","imgbox.com","imgbqb.sbs","imginn.com","imgmgf.sbs","imgpke.sbs","imguee.sbs","indeed.com","indobo.com","inertz.org","infulo.com","ingles.com","ipamod.com","iplark.com","ironysub.*","isgfrm.com","issuya.com","itdmusic.*","iumkit.net","iusm.co.kr","iwcp.co.uk","jakondo.ru","japgay.com","japscan.ws","jav-fun.cc","jav-xx.com","jav.direct","jav247.top","jav380.com","javbee.vip","javbix.com","javboys.tv","javbull.tv","javdo.cc>>","javembed.*","javfan.one","javfav.com","javfc2.xyz","javgay.com","javhdz.*>>","javhub.net","javhun.com","javlab.net","javmix.app","javmvp.com","javneon.tv","javnew.net","javopen.co","javpan.net","javpas.com","javplay.me","javqis.com","javrip.net","javroi.com","javseen.tv","javsek.net","jnews5.com","jobsbd.xyz","joktop.com","joolinks.*","josemo.com","jpgames.de","jpvhub.com","jrlinks.in","jytechs.in","kaamuu.cfd","kaliscan.*","kamelle.de","kaotic.com","kaplog.com","katlinks.*","kedoam.com","keepvid.pw","kejoam.com","kelaam.com","kendam.com","kenzato.uk","kerapoxy.*","keroseed.*","key-hub.eu","kiaclub.cz","kickass2.*","kickasst.*","kickassz.*","king-pes.*","kinobox.cz","kinoger.re","kinoger.ru","kinoger.to","kjmx.rocks","kkickass.*","klooam.com","klyker.com","kochbar.de","kompas.com","kompiko.pl","kotaku.com","kropic.com","kvador.com","kxbxfm.com","labgame.io","lacrima.jp","larazon.es","leakav.com","leeapk.com","leechall.*","leet365.cc","leolist.cc","lewd.ninja","lglbmm.com","lidovky.cz","likecs.com","line25.com","link1s.com","linkbin.me","linkpoi.me","linkshub.*","linkskat.*","linksly.co","linkspy.cc","linkz.wiki","liquor.com","listatv.pl","live7v.com","livehere.*","livetvon.*","lollty.pro","lookism.me","lootdest.*","lopers.com","love4u.net","loveroms.*","lumens.com","lustich.de","lxmanga.my","m2list.com","macwelt.de","magnetdl.*","mahfda.com","mandai.com","mangago.me","mangaraw.*","mangceh.cc","manwan.xyz","mascac.org","mat6tube.*","mathdf.com","maths.news","maxicast.*","medibok.se","megadb.net","megadede.*","megaflix.*","megafly.in","megalink.*","megaup.net","megaurl.in","megaxh.com","meltol.net","meong.club","merinfo.se","mhdtvmax.*","milfzr.com","mitaku.net","mixdroop.*","mlbb.space","mma-core.*","mmnm.store","mmopeon.ru","mmtv01.xyz","molotov.tv","mongri.net","motchill.*","movibd.com","movie123.*","movie4me.*","moviegan.*","moviehdf.*","moviemad.*","movies07.*","movies2k.*","movies4u.*","movies7.to","moviflex.*","movix.blog","mozkra.com","mp3cut.net","mp3guild.*","mp3juice.*","mreader.co","mrpiracy.*","mtlurb.com","mult34.com","multics.eu","multiup.eu","multiup.io","musichq.cc","my-subs.co","mydaddy.cc","myjest.com","mykhel.com","mylust.com","myplexi.fr","myqqjd.com","myvideo.ge","myviid.com","naasongs.*","nackte.com","naijal.com","nakiny.com","namasce.pl","namemc.com","nbabite.to","nbaup.live","ncdnx3.xyz","negumo.com","neonmag.fr","neoteo.com","neowin.net","netfree.cc","newhome.de","newpelis.*","news18.com","newser.com","nexdrive.*","nflbite.to","ngelag.com","ngomek.com","ngomik.net","nhentai.io","nickles.de","niyaniya.*","nmovies.cc","noanyi.com","nocfsb.com","nohost.one","nosteam.ro","note1s.com","notube.com","novinky.cz","noz-cdn.de","nsfw247.to","nswrom.com","ntucgm.com","nudes7.com","nullpk.com","nuroflix.*","nxbrew.net","nxprime.in","nypost.com","odporn.com","odtmag.com","ofwork.net","ohorse.com","ohueli.net","okleak.com","okmusi.com","okteve.com","onehack.us","oneotv.com","onepace.co","onepunch.*","onezoo.net","onloop.pro","onmovies.*","onvista.de","openload.*","oploverz.*","origami.me","orirom.com","otomoto.pl","owsafe.com","paminy.com","papafoot.*","parade.com","parents.at","pbabes.com","pc-guru.it","pcbeta.com","pcgames.de","pctfenix.*","pcworld.es","pdfaid.com","peetube.cc","people.com","petbook.de","phc.web.id","phim85.com","picmsh.sbs","pictoa.com","pilsner.nu","pingit.com","pirlotv.mx","pitube.net","pixelio.de","pixvid.org","plaion.com","planhub.ca","playboy.de","playfa.com","playgo1.cc","plc247.com","plejada.pl","poapan.xyz","pondit.xyz","poophq.com","popcdn.day","poplinks.*","poranny.pl","porn00.org","porndr.com","pornfd.com","porngo.com","porngq.com","pornhd.com","pornhd8k.*","pornky.com","porntb.com","porntn.com","pornve.com","pornwex.tv","pornx.tube","pornxp.com","pornxp.org","pornxs.com","pouvideo.*","povvideo.*","povvldeo.*","povw1deo.*","povwideo.*","powder.com","powlideo.*","powv1deo.*","powvibeo.*","powvideo.*","powvldeo.*","premid.app","progfu.com","prosongs.*","proxybit.*","proxytpb.*","prydwen.gg","psychic.de","pudelek.pl","puhutv.com","putlog.net","qqxnxx.com","qrixpe.com","qthang.net","quicomo.it","radio.zone","raenonx.cc","rakuten.tv","ranker.com","rawinu.com","rawlazy.si","realgm.com","rebahin.pw","redfea.com","redgay.net","reeell.com","regio7.cat","rencah.com","reshare.pm","rgeyyddl.*","rgmovies.*","riazor.org","rlxoff.com","rmdown.com","roblox.com","rodude.com","romsget.io","ronorp.net","roshy.tv>>","rsrlink.in","rule34.art","rule34.xxx","rule34.xyz","rule34ai.*","rumahit.id","s1p1cd.com","s2dfree.to","s3taku.com","sakpot.com","samash.com","savego.org","sawwiz.com","sbrity.com","sbs.com.au","scribd.com","sctoon.net","scubidu.eu","seeflix.to","serien.cam","seriesly.*","sevenst.us","sexato.com","sexjobs.es","sexkbj.com","sexlist.tv","sexodi.com","sexpin.net","sexpox.com","sexrura.pl","sextor.org","sextvx.com","sfile.mobi","shahid4u.*","shinden.pl","shineads.*","shlink.net","sholah.net","shophq.com","shorttey.*","shortx.net","shortzzy.*","showflix.*","shrink.icu","shrinkme.*","shrt10.com","sibtok.com","sikwap.xyz","silive.com","simpcity.*","skmedix.pl","smoner.com","smsget.net","snbc13.com","snopes.com","snowmtl.ru","soap2day.*","socebd.com","sohot.cyou","sokobj.com","solewe.com","sourds.net","soy502.com","spiegel.de","spielen.de","sportal.de","sportbar.*","sports24.*","srvy.ninja","ssdtop.com","sshkit.com","ssyou.tube","stardima.*","stemplay.*","stiletv.it","stpm.co.uk","strcloud.*","streamsb.*","streamta.*","strefa.biz","suaurl.com","sunhope.it","surfer.com","szene38.de","tapetus.pl","target.com","taxi69.com","tcpvpn.com","tech8s.net","techhx.com","telerium.*","texte.work","th-cam.com","thatav.net","theacc.com","thecut.com","thedaddy.*","theproxy.*","thevidhd.*","thosa.info","thothd.com","thripy.com","tickzoo.tv","tiscali.it","tktube.com","tokuvn.com","tokuzl.net","toorco.com","topito.com","toppng.com","torlock2.*","torrent9.*","tranny.one","trust.zone","trzpro.com","tsubasa.im","tsz.com.np","tubesex.me","tubous.com","tubsexer.*","tubtic.com","tugaflix.*","tulink.org","tumblr.com","tunein.com","turbovid.*","tutelehd.*","tutsnode.*","tutwuri.id","tuxnews.it","tv0800.com","tvline.com","tvnz.co.nz","tvtoday.de","twatis.com","uctnew.com","uindex.org","uiporn.com","unito.life","uol.com.br","up-load.io","upbaam.com","updato.com","updown.cam","updown.fun","updown.icu","upfion.com","upicsz.com","uplinkto.*","uploadev.*","uploady.io","uporno.xxx","uprafa.com","ups2up.fun","upskirt.tv","uptobhai.*","uptomega.*","urlpay.net","usagoals.*","userload.*","usgate.xyz","usnews.com","ustimz.com","ustream.to","utreon.com","uupbom.com","vadbam.com","vadbam.net","vadbom.com","vbnmll.com","vcloud.lol","vdbtm.shop","vecloud.eu","veganab.co","veplay.top","vevioz.com","vgames.fun","vgmlinks.*","vidapi.xyz","vidbam.org","vidbox.dev","vidcloud.*","vidcorn.to","vidembed.*","videyx.cam","videzz.net","vidlii.com","vidnest.io","vidohd.com","vidomo.xyz","vidoza.net","vidply.com","viduro.top","viduyy.com","viewfr.com","vinomo.xyz","vipboxtv.*","vipotv.com","vipstand.*","vivatube.*","vizcloud.*","vortez.net","vrporn.com","vsembed.su","vstream.id","vvide0.com","vvtlinks.*","wapkiz.com","warps.club","watch32.sx","watch4hd.*","watcho.com","watchug.to","watchx.top","wawacity.*","weather.us","web1s.asia","webcafe.bg","weloma.art","weshare.is","weszlo.com","wetter.com","wetter3.de","wikwiki.cv","wintub.com","woiden.com","wooflix.tv","worder.cat","woxikon.de","wpgh53.com","ww9g.com>>","www.cc.com","x-x-x.tube","xanimu.com","xasiat.com","xberuang.*","xhamster.*","xhopen.com","xhspot.com","xhtree.com","xhvid1.com","xiaopan.co","xmorex.com","xmovie.pro","xmovies8.*","xnxx.party","xpicse.com","xprime4u.*","xrares.com","xsober.com","xspiel.com","xsz-av.com","xszav.club","xvideis.cc","xxgasm.com","xxmovz.com","xxxdan.com","xxxfiles.*","xxxmax.net","xxxrip.net","xxxsex.pro","xxxtik.com","xxxtor.com","xxxxsx.com","y-porn.com","y2mate.com","y2tube.pro","ymknow.xyz","yomovies.*","youapk.net","youmath.it","youpit.xyz","youwatch.*","yseries.tv","ytanime.tv","ytboob.com","ytjar.info","ytmp4.live","yts-subs.*","yumacs.com","yuppow.com","yuvutu.com","yy1024.net","z12z0vla.*","zeefiles.*","zilinak.sk","zillow.com","zoechip.cc","zoechip.gg","zpaste.net","zthots.com","0123movie.*","0gomovies.*","0rechner.de","10alert.com","111watcho.*","11xmovies.*","123animes.*","123movies.*","12thman.com","141tube.com","173.249.8.3","17track.net","18comic.vip","1movieshd.*","1moviesz.to","1xanimes.in","2gomovies.*","2rdroid.com","3bmeteo.com","3dyasan.com","3hentai.net","3xfaktor.hu","423down.com","4funbox.com","4gousya.net","4players.de","4shared.com","4spaces.org","4tymode.win","5j386s9.sbs","69games.xxx","7review.com","7starmv.com","80-talet.se","8tracks.com","9animetv.to","9goals.live","9jarock.org","a-hentai.tv","aagmaal.com","abs-cbn.com","abstream.to","ad-doge.com","ad4msan.com","adictox.com","adisann.com","adshrink.it","afilmywap.*","africue.com","afrodity.sk","ahmedmode.*","aiailah.com","aipebel.com","akirabox.to","allkpop.com","almofed.com","almursi.com","altcryp.com","alttyab.net","analdin.com","anavidz.com","and-more.co","andiim3.com","anibatch.me","anichin.top","anigogo.net","animahd.com","anime-i.com","anime3d.xyz","animeblix.*","animebr.org","animecix.tv","animehay.tv","animehub.ac","animepahe.*","animesex.me","anisaga.org","anitube.vip","aniworld.to","anomize.xyz","anonymz.com","anxcinema.*","anyporn.com","anysex.club","aofsoru.com","aosmark.com","apekite.com","apkdink.com","apkhihe.com","apkshrt.com","apksvip.com","aplus.my.id","app.plex.tv","apritos.com","aquipelis.*","arabstd.com","arabxnx.com","arakpop.net","arbweb.info","area51.porn","arenabg.com","arkadmin.fr","artnews.com","asia2tv.com","asianal.xyz","asianclub.*","asiangay.tv","asianload.*","asianplay.*","ask4movie.*","asmr18.fans","asmwall.com","asumesi.com","ausfile.com","auszeit.bio","autobild.de","autokult.pl","automoto.it","autopixx.de","autoroad.cz","autosport.*","avcesar.com","avitter.net","axomtube.in","ayatoon.com","azmath.info","azmovies.to","b2bhint.com","b4ucast.com","babaktv.com","babeswp.com","babyclub.de","badjojo.com","badtaste.it","barfuck.com","batman.city","bbwfest.com","bcmanga.com","bdcraft.net","bdmusic23.*","bdmusic28.*","bdsmporn.cc","beelink.pro","beinmatch.*","bengals.com","berich8.com","berklee.edu","bfclive.com","bg-gledai.*","bi-girl.net","bigconv.com","bigojav.com","bigshare.io","bigwank.com","bikemag.com","bitco.world","bitlinks.pw","bitzite.com","blavity.com","blog4nx.com","blogue.tech","blu-ray.com","blurayufr.*","bokepxv.com","bolighub.dk","bollyflix.*","book18.fans","bootdey.com","botrix.live","bowfile.com","boxporn.net","braflix.win","brbeast.com","brbushare.*","brigitte.de","bristan.com","browser.lol","bsierad.com","btcbitco.in","btvsport.bg","btvsports.*","buondua.com","buzzfeed.at","buzzfeed.de","buzzpit.net","bx-zone.com","bypass.city","bypass.link","cafenau.com","camclips.tv","camsclips.*","camslib.com","camwhores.*","canaltdt.es","carbuzz.com","ch-play.com","chatgbt.one","chatgpt.com","chefkoch.de","chicoer.com","chochox.com","cima-club.*","cinecloud.*","cinefreak.*","civicxi.com","civitai.com","civitai.red","claimrbx.gg","clapway.com","clkmein.com","cloubix.com","cloudfam.io","club386.com","cocorip.net","coldfrm.org","collater.al","colnect.com","comicxxx.eu","commands.gg","comnuan.com","comohoy.com","converto.io","coomer1.net","corneey.com","corriere.it","cpmlink.net","cpmlink.pro","crackle.com","crazydl.net","crdroid.net","crvsport.ru","csurams.com","cubuffs.com","cuevana.pro","cupra.forum","cut-fly.com","cutearn.net","cutlink.net","cutpaid.com","cutyion.com","daddyhd.*>>","daddylive.*","daftsex.biz","daftsex.net","daftsex.org","daij1n.info","dailyweb.pl","damitv.live","daozoid.com","dawenet.com","ddlvalley.*","decrypt.day","deltabit.co","devotag.com","dexerto.com","digit77.com","digitask.ru","direct-dl.*","discord.com","disheye.com","diudemy.com","divxtotal.*","dj-figo.com","djqunjab.in","dlpanda.com","dlstreams.*","dma-upd.org","dogdrip.net","donlego.com","dotycat.com","doumura.com","douploads.*","downsub.com","dozarte.com","dramacool.*","dramamate.*","dramanice.*","drawize.com","droplink.co","ds2play.com","dsharer.com","dstat.space","dsvplay.com","duboku.info","dudefilms.*","dz4link.com","e-glossa.it","e2link.link","earnbee.xyz","earnhub.net","easy-coin.*","easybib.com","ebookdz.com","echiman.com","echodnia.eu","ecomento.de","edjerba.com","eductin.com","einthusan.*","elahmad.com","embasic.pro","embedhd.org","embedmoon.*","embedpk.net","embedtv.net","empflix.com","emuenzen.de","enagato.com","eoreuni.com","eporner.com","eroasmr.com","erothots.co","erowall.com","esgeeks.com","eshentai.tv","eskarock.pl","eslfast.com","europixhd.*","everand.com","everia.club","everyeye.it","exalink.fun","exeking.top","ezmanga.net","f51rm.com>>","fapdrop.com","fapguru.com","faptube.com","farescd.com","fastdokan.*","fastream.to","fastssh.com","fbstreams.*","fchopin.net","fembedx.top","feyorra.top","fffmovies.*","figtube.com","file-me.top","file-up.org","file4go.com","file4go.net","filecloud.*","filecrypt.*","filelions.*","filemooon.*","filepress.*","fileq.games","filesamba.*","filmcdn.top","filmisub.cc","films5k.com","filmy-hit.*","filmy4web.*","filmydown.*","filmygod6.*","findjav.com","firefile.cc","fit4art.com","flixrave.me","flixsix.com","flixtor.mov","flixzone.co","fluentu.com","fluvore.com","fmovies0.cc","fmoviesto.*","folkmord.se","foodxor.com","footybite.*","forumdz.com","foumovies.*","foxtube.com","freenem.com","freepik.com","frpgods.com","fseries.org","fsx.monster","ftuapps.dev","fuckfuq.com","futemax.zip","g-porno.com","gal-dem.com","gamcore.com","game-2u.com","game3rb.com","gameblog.in","gameblog.jp","gamehub.cam","gamelab.com","gamer18.net","gamestar.de","gameswelt.*","gametop.com","gamewith.jp","gamezone.de","gamezop.com","garaveli.de","gaytail.com","gayvideo.me","gazzetta.gr","gazzetta.it","gcloud.live","gedichte.ws","genialne.pl","get-to.link","getmega.net","getthit.com","gevestor.de","gezondnu.nl","ggbases.com","girlmms.com","girlshd.xxx","gisarea.com","gitizle.vip","gizmodo.com","globetv.app","go.fakta.id","go.zovo.ink","goalup.live","gobison.com","gocards.com","gocast2.com","godeacs.com","godmods.com","godtube.com","goducks.com","gofilms4u.*","gofrogs.com","gogifox.com","gogoanime.*","goheels.com","gojacks.com","gokerja.net","gold-24.net","golobos.com","gomovies.pk","gomoviesc.*","goodporn.to","gooplay.net","gorating.in","gosexy.mobi","gostyn24.pl","goto.com.np","gotocam.net","gotporn.com","govexec.com","grafikos.cz","gsmware.com","guhoyas.com","gulf-up.com","gumtree.com","gupload.xyz","h-flash.com","haaretz.com","hagalil.com","hagerty.com","hardgif.com","hartziv.org","haxmaps.com","haxnode.net","hblinks.pro","hdbraze.com","hdeuropix.*","hdmotori.it","hdonline.co","hdpicsx.com","hdpornt.com","hdtodayz.to","hdtube.porn","helmiau.com","hentai20.io","hentaila.tv","herexxx.com","herzporno.*","hes-goals.*","hexload.com","hhdmovies.*","himovies.sx","hindi.trade","hiphopa.net","history.com","hitokin.net","hmanga.asia","holavid.com","hoofoot.net","hoporno.net","hornpot.net","hornyfap.tv","hotabis.com","hotbabes.tv","hotcars.com","hotfm.audio","hotgirl.biz","hotleak.vip","hotleaks.tv","hotscope.tv","hotscopes.*","hotshag.com","hotstar.com","huaren.live","hubdrive.de","hubison.com","hubstream.*","hubzter.com","hungama.com","hurawatch.*","huskers.com","huurshe.com","hwreload.it","hygiena.com","hypesol.com","icgaels.com","idlixku.com","iegybest.co","iframejav.*","iggtech.com","iimanga.com","iklandb.com","imageweb.ws","imgbvdf.sbs","imgjjtr.sbs","imgnngr.sbs","imgoebn.sbs","imgoutlet.*","imgtaxi.com","imgyhq.shop","impact24.us","in91vip.win","infocorp.io","infokik.com","inkapelis.*","instyle.com","inverse.com","ipa-apps.me","iporntv.net","iptvbin.com","isaimini.ca","isosite.org","ispunlock.*","itavisen.no","itpro.co.uk","itudong.com","iv-soft.com","jaguars.com","jaiefra.com","japanfuck.*","japanporn.*","japansex.me","japscan.lol","javbake.com","javball.com","javbobo.com","javboys.com","javcock.com","javdock.com","javdoge.com","javfull.net","javgrab.com","javhoho.com","javideo.net","javlion.xyz","javmenu.com","javmeta.com","javmilf.xyz","javpool.com","javsex.guru","javstor.com","javx357.com","javynow.com","jcutrer.com","jeep-cj.com","jetanimes.*","jetpunk.com","jezebel.com","jkanime.net","jnovels.com","jobnoid.net","jobsibe.com","jocooks.com","jotapov.com","jpg.fishing","jra.jpn.org","jungyun.net","jxoplay.xyz","karanpc.com","kashtanka.*","kb.arlo.com","khohieu.com","kiaporn.com","kickassgo.*","kiemlua.com","kimoitv.com","kinoking.cc","kissanime.*","kissasia.cc","kissasian.*","kisscos.net","kissmanga.*","kjanime.net","klettern.de","kmansin09.*","kochamjp.pl","kodaika.com","kolyoom.com","komikcast.*","kompoz2.com","kpkuang.org","kppk983.com","ksuowls.com","l23movies.*","l2crypt.com","labstory.in","laposte.net","lapresse.ca","lastampa.it","latimes.com","latitude.to","lbprate.com","leaknud.com","letest25.co","letras2.com","lewdweb.net","lewebde.com","lfpress.com","lgcnews.com","lgwebos.com","libertyvf.*","lifeline.de","liflix.site","ligaset.com","likemag.com","linclik.com","link-to.net","linkmake.in","linkrex.net","links-url.*","linksfire.*","linkshere.*","linksmore.*","lite-link.*","loanpapa.in","lokalo24.de","lookimg.com","lookmovie.*","losmovies.*","losporn.org","lostineu.eu","lovefap.com","lrncook.xyz","lscomic.com","luluvdo.com","luluvid.com","luxmovies.*","m.akkxs.net","m.iqiyi.com","m1xdrop.com","m1xdrop.net","m4maths.com","made-by.org","madoohd.com","madouqu.com","magesy.blog","magesypro.*","mamastar.jp","manga1000.*","manga1001.*","mangahub.io","mangasail.*","mangatv.net","mangayy.org","manhwa18.cc","maths.media","mature4.net","mavanimes.*","mavavid.com","maxstream.*","mcdlpit.com","mchacks.net","mcloud.guru","mcxlive.org","medisite.fr","mega1080p.*","megafile.io","megavideo.*","mein-mmo.de","melodelaa.*","mephimtv.cc","mercari.com","messitv.net","messitv.org","metavise.in","mgoblue.com","mhdsports.*","mhscans.com","miklpro.com","mirrorace.*","mirrored.to","mlbstream.*","mmfenix.com","mmsmaza.com","mobifuq.com","moenime.com","momomesh.tv","momondo.com","momvids.com","moonembed.*","moonmov.pro","motohigh.pl","motphimr.io","moviebaaz.*","movied.link","movieku.ink","movieon21.*","movieplay.*","movieruls.*","movierulz.*","movies123.*","movies4me.*","movies4u3.*","moviesda4.*","moviesden.*","movieshub.*","moviesjoy.*","moviesmod.*","moviesmon.*","moviesub.is","moviesx.org","moviewr.com","moviezwap.*","movizland.*","mp3-now.com","mp3juices.*","mp3yeni.org","mp4moviez.*","mpo-mag.com","mr9soft.com","mrexcel.com","mrunblock.*","mtb-news.de","mtlblog.com","muchfap.com","multiup.org","muthead.com","muztext.com","mycloudz.cc","myflixer.bz","myflixerz.*","mygalls.com","mymp3song.*","mytoolz.net","myunity.dev","myvalley.it","myvidmate.*","myxclip.com","narcity.com","nbabox.co>>","nbastream.*","nbch.com.ar","nbcnews.com","needbux.com","needrom.com","nekopoi.*>>","nelomanga.*","nemenlake.*","netfapx.com","netflix.com","netfuck.net","netplayz.ru","netxwatch.*","netzwelt.de","newscon.org","newsmax.com","nextgov.com","nflbite.com","nflstream.*","nhentai.net","nhlstream.*","nicekkk.com","nichapk.com","nimegami.id","nkreport.jp","notandor.cn","novelism.jp","novohot.com","novojoy.com","nowiny24.pl","nowmovies.*","nrj-play.fr","nsfwr34.com","nudevista.*","nulakers.ca","nunflix.org","nyahentai.*","nysainfo.pl","odiasia.sbs","ofilmywap.*","ogomovies.*","ohentai.org","ohmymag.com","okstate.com","olamovies.*","olarila.com","omuzaani.me","onhockey.tv","onifile.com","onneddy.com","ontools.net","onworks.net","optimum.net","ortograf.pl","osxinfo.net","otakudesu.*","otakuindo.*","outletpic.*","overgal.com","overtake.gg","ovester.com","oxanime.com","p2pplay.pro","packers.com","pagesix.com","paketmu.com","pantube.top","papahd.club","papalah.com","paradisi.de","parents.com","parispi.net","pasokau.com","payskip.org","pcbolsa.com","pcgamer.com","pdfdrive.to","pdfsite.net","pelisplus.*","peppe8o.com","perelki.net","pesktop.com","pewgame.com","pezporn.com","phim1080.in","pianmanga.*","picbqqa.sbs","picnft.shop","picngt.shop","picuenr.sbs","pilot.wp.pl","pinkporno.*","pinterest.*","piratebay.*","pistona.xyz","pitiurl.com","pixjnwe.sbs","pixsera.net","pksmovies.*","pkspeed.net","play.tv3.ee","play.tv3.lt","play.tv3.lv","playrust.io","playtamil.*","playtube.tv","plus.rtl.de","pngitem.com","pngreal.com","pogolinks.*","pokopow.com","polygon.com","pomorska.pl","pooembed.eu","porcore.com","porn3dx.com","porn77.info","porn78.info","porndaa.com","porndex.com","porndig.com","porndoe.com","porndude.tv","porngem.com","porngun.net","pornhex.com","pornhub.com","pornkai.com","pornken.com","pornkino.cc","pornktube.*","pornmam.com","pornmom.net","porno-365.*","pornoman.pl","pornomoll.*","pornone.com","pornovka.cz","pornpaw.com","pornsai.com","porntin.com","porntry.com","pornult.com","poscitech.*","povvvideo.*","powstream.*","powstreen.*","ppatour.com","primesrc.me","primewire.*","prisjakt.no","promobil.de","pronpic.org","pulpo69.com","pupuweb.com","purplex.app","putlocker.*","pvip.gratis","pxtech.site","qdembed.com","quizack.com","quizlet.com","radamel.icu","raiders.com","rainanime.*","raw1001.net","rawkuma.com","rawkuma.net","rawkuro.net","readfast.in","readmore.de","realbbc.xyz","redgifs.com","redlion.net","redporno.cz","redtub.live","redwap2.com","redwap3.com","reifporn.de","rekogap.xyz","repelis.net","repelisgt.*","repelishd.*","repelisxd.*","repicsx.com","resetoff.pl","rethmic.com","retrotv.org","reuters.com","reverso.net","riedberg.tv","rimondo.com","rl6mans.com","rlshort.com","roadbike.de","rocklink.in","romfast.com","romsite.org","romviet.com","rphangx.net","rpmplay.xyz","rpupdate.cc","rsgamer.app","rubystm.com","rubyvid.com","rugby365.fr","runmods.com","ryxy.online","s0ft4pc.com","saekita.com","safelist.eu","sandrives.*","sankaku.app","sansat.link","sararun.net","sat1gold.de","satcesc.com","savelinks.*","savemedia.*","savetub.com","sbbrisk.com","sbchill.com","scenedl.org","scenexe2.io","schadeck.eu","scripai.com","sdefx.cloud","seclore.com","secuhex.com","see-xxx.com","semawur.com","sembunyi.in","sendvid.com","seoworld.in","serengo.net","serially.it","seriemega.*","seriesflv.*","seselah.com","sexavgo.com","sexdiaryz.*","sexemix.com","sexetag.com","sexmoza.com","sexpuss.org","sexrura.com","sexsaoy.com","sexuhot.com","sexygirl.cc","shaheed4u.*","sharclub.in","sharedisk.*","sharing.wtf","shavetape.*","shortearn.*","shrinkus.tk","shrlink.top","simsdom.com","siteapk.net","sitepdf.com","sixsave.com","smarturl.it","smplace.com","snaptik.app","socks24.org","soft112.com","softrop.com","solobari.it","soninow.com","sosuroda.pl","soundpark.*","souqsky.net","southpark.*","spambox.xyz","spankbang.*","speedporn.*","spinbot.com","sporcle.com","sport365.fr","sportbet.gr","sportcast.*","sportlive.*","sportshub.*","spycock.com","srcimdb.com","ssoap2day.*","ssrmovies.*","staaker.com","stagatv.com","starmusiq.*","steamplay.*","steanplay.*","sterham.net","stickers.gg","stmruby.com","strcloud.in","streamcdn.*","streamed.su","streamers.*","streamhoe.*","streamhub.*","streamix.so","streamm4u.*","streamup.ws","strikeout.*","subdivx.com","subedlc.com","submilf.com","subsvip.com","sukuyou.com","sundberg.ws","sushiscan.*","swatalk.com","t-online.de","tabootube.*","tagblatt.ch","takimag.com","tamilyogi.*","tandess.com","taodung.com","tattle.life","tcheats.com","tdtnews.com","teachoo.com","teamkong.tk","techbook.de","techforu.in","technews.tw","tecnomd.com","telenord.it","telorku.xyz","teltarif.de","tempr.email","terabox.fun","teralink.me","testedich.*","texw.online","thapcam.net","thaript.com","thelanb.com","therams.com","theroot.com","thespun.com","thestar.com","thisvid.com","thotcity.su","thotporn.tv","thotsbay.tv","threads.com","threads.net","tikmate.app","timeful.app","tinys.click","titantv.com","tmailor.com","tnaflix.com","todaypktv.*","tonspion.de","toolxox.com","toonanime.*","toonily.com","topgear.com","topmovies.*","topshare.in","topsport.bg","totally.top","toxicwap.us","trahino.net","tranny6.com","trgtkls.org","tribuna.com","trickms.com","trilog3.net","tromcap.com","trxking.xyz","tryvaga.com","ttsfree.com","tubator.com","tube18.sexy","tuberel.com","tubsxxx.com","tukoz.com>>","turkanime.*","turkmmo.com","tutflix.org","tutvlive.ru","tv-media.at","tv.bdix.app","tvableon.me","tvseries.in","tw-calc.net","twitchy.com","twitter.com","ubbulls.com","ucanwatch.*","ufcstream.*","uhdmovies.*","uiiumovie.*","uknip.co.uk","umterps.com","unblockit.*","uozzart.com","updown.link","upfiles.app","uploadbaz.*","uploadhub.*","uploadrar.*","upns.online","uproxy2.biz","uprwssp.org","upstore.net","upstream.to","uptime4.com","uptobox.com","urdubolo.pk","usfdons.com","usgamer.net","ustvgo.live","uyeshare.cc","v2movies.me","v6embed.xyz","vague.style","variety.com","vaughn.live","vectorx.top","vedshar.com","vegamovie.*","ver-pelis.*","verizon.com","veronica.uk","vexfile.com","vexmovies.*","vf-film.net","vgamerz.com","vidbeem.com","vidcloud9.*","videezy.com","vidello.net","videovard.*","videoxxx.cc","videplay.us","videq.cloud","vidfast.pro","vidlink.pro","vidload.net","vidshar.org","vidshare.tv","vidspeed.cc","vidstream.*","vidtube.one","vikatan.com","vikings.com","vip-box.app","vipifsa.com","vipleague.*","vipracing.*","vipshort.in","vipstand.se","viptube.com","virabux.com","visalist.io","visible.com","viva100.com","vixcloud.co","vizcloud2.*","vkprime.com","voirfilms.*","voyeurhit.*","vrcmods.com","vstdrive.in","vulture.com","vvtplayer.*","vw-page.com","w.grapps.me","waploaded.*","watchfree.*","watchporn.*","wavewalt.me","wayfair.com","wcostream.*","weadown.com","weather.com","webcras.com","webfail.com","webtoon.xyz","weights.com","wetsins.com","weviral.org","wgzimmer.ch","why-tech.it","wildwap.com","winshell.de","wintotal.de","wmovies.xyz","woffxxx.com","wonporn.com","wowroms.com","wupfile.com","wvt.free.nf","www.msn.com","x-x-x.video","x.ag2m2.cfd","xemales.com","xflixbd.com","xforum.live","xfreehd.com","xgroovy.com","xhamster.fm","xhamster1.*","xhamster2.*","xhamster3.*","xhamster4.*","xhamster5.*","xhamster7.*","xhamster8.*","xhmoon5.com","xhreal2.com","xhreal3.com","xhtotal.com","xhwide5.com","xmateur.com","xmovies08.*","xnxxcom.xyz","xozilla.xxx","xpicu.store","xpornzo.com","xpshort.com","xsanime.com","xubster.com","xvideos.com","xx.knit.bid","xxxmomz.com","xxxmovies.*","xztgl.com>>","y-2mate.com","y2meta.mobi","yalifin.xyz","yamsoti.com","yesmovies.*","yestech.xyz","yifysub.net","ymovies.vip","yomovies1.*","yoshare.net","youshort.me","youtube.com","yoxplay.xyz","yt2conv.com","ytmp3cc.net","ytsubme.com","yumeost.net","zedporn.com","zemporn.com","zerioncc.pl","zerogpt.com","zetporn.com","ziperto.com","zlpaste.net","zoechip.com","zyromod.com","0123movies.*","0cbcq8mu.com","0l23movies.*","0ochi8hp.com","10-train.com","1024tera.com","103.74.5.104","123-movies.*","1234movies.*","123animes.ru","123moviesc.*","123moviess.*","123unblock.*","1340kbbr.com","16honeys.com","185.53.88.15","18tubehd.com","1fichier.com","1madrasdub.*","1primewire.*","2017tube.com","2cf0xzdu.com","2fb9tsgn.fun","2madrasdub.*","398fitus.com","3gaytube.com","45.86.86.235","456movie.com","4archive.org","4bct9.live>>","4edtcixl.xyz","4fansites.de","4k2h4w04.xyz","4live.online","4movierulz.*","5moviess.com","720pstream.*","7hitmovies.*","8teenxxx.com","a6iqb4m8.xyz","ablefast.com","aboedman.com","absoluporn.*","abysscdn.com","acapellas.eu","adbypass.org","adcrypto.net","addonbiz.com","addtoany.com","adsurfle.com","adultfun.net","aegeanews.gr","afl3ua5u.xyz","afreesms.com","afrotech.com","airflix1.com","airliners.de","akinator.com","akirabox.com","alcasthq.com","alexsports.*","aliancapes.*","allcalidad.*","alliptvs.com","allmusic.com","allosurf.net","alotporn.com","alphatron.tv","alrincon.com","alternet.org","amateur8.com","amnaymag.com","amtil.com.au","androidaba.*","anhdep24.com","anime-jl.net","anime3rb.com","animefire.io","animeflv.net","animefreak.*","animelok.xyz","animesanka.*","animeunity.*","animexin.vip","animixplay.*","aninavi.blog","anisubindo.*","anmup.com.np","annabelle.ch","antiadtape.*","antonimos.de","anybunny.com","apetube.asia","apkcombo.com","apkdrill.com","apkmodhub.in","apkprime.org","apkship.shop","apkupload.in","apnablogs.in","app.vaia.com","appsbull.com","appsmodz.com","aranzulla.it","arcaxbydz.id","arkadium.com","arolinks.com","aroratr.club","artforum.com","asiaflix.net","asianporn.li","askim-bg.com","atglinks.com","atgstudy.com","atozmath.com","audiotools.*","audizine.com","autoblog.com","autodime.com","autoembed.cc","autonews.com","autorevue.at","az-online.de","azoranov.com","azores.co.il","b-hentai.com","babesexy.com","babiato.tech","babygaga.com","bagpipe.news","baithak.news","bamgosu.site","bandstand.ph","banned.video","baramjak.com","barchart.com","baritoday.it","batchkun.com","batporno.com","bbyhaber.com","bceagles.com","bclikeqt.com","beemtube.com","beingtek.com","benchmark.pl","bestlist.top","bestwish.lol","biletomat.pl","bilibili.com","biopills.net","biovetro.net","birdurls.com","bitchute.com","bitssurf.com","bittools.net","blog-dnz.com","blogmado.com","blogmura.com","bloground.ro","blwideas.com","bobolike.com","bollydrive.*","bollyshare.*","boltbeat.com","bookfrom.net","bookriot.com","boredbat.com","boundhub.com","boysfood.com","br0wsers.com","braflix.tube","brainzaps.tv","bright-b.com","bronco6g.com","bsmaurya.com","bubraves.com","buffsports.*","buffstream.*","bugswave.com","bullfrag.com","burakgoc.com","burbuja.info","burnbutt.com","buyjiocoin.*","bysebuho.com","bysekoze.com","bysewihe.com","byswiizen.fr","bz-berlin.de","calbears.com","callfuck.com","camaro7g.com","camhub.world","camlovers.tv","camporn.tube","camwhores.tv","camwhorez.tv","capoplay.net","cardiagn.com","cariskuy.com","carnewz.site","cashbux.work","casperhd.com","casthill.net","catcrave.com","catholic.com","cbt-tube.net","cctvwiki.com","cdn.vifey.de","celebmix.com","celibook.com","cesoirtv.com","channel4.com","chargers.com","chatango.com","chibchat.com","chopchat.com","choralia.net","chzzkban.xyz","cinedetodo.*","cinemabg.net","cinemaxxl.de","claimbits.io","claimtrx.com","clickapi.net","clicporn.com","clix4btc.com","clockskin.us","closermag.fr","cocogals.com","cocoporn.net","coderblog.in","codesnse.com","coindice.win","coingraph.us","coinsrev.com","collider.com","compsmag.com","compu-pc.com","cool-etv.net","cosmicapp.co","couchtuner.*","coursera.org","cracking.org","crazyblog.in","cricwatch.io","cryptowin.io","cuevana8.com","cut-urls.com","cuts-url.com","cwc.utah.gov","cyberdrop.me","cyberleaks.*","cyclones.com","cyprus.co.il","czechsex.net","da-imnetz.de","daddylive1.*","dafideff.com","dafontvn.com","daftporn.com","dailydot.com","dailysport.*","daizurin.com","daotekno.com","darkibox.com","datacheap.io","datanodes.to","dataporn.pro","datawav.club","dawntube.com","day4news.com","ddlvalley.me","deadline.com","deadspin.com","debridup.com","deckshop.pro","decorisi.com","deepbrid.com","deephot.link","delvein.tech","derwesten.de","descarga.xyz","desi.upn.bio","desihoes.com","desiupload.*","desivideos.*","deviants.com","digimanie.cz","dikgames.com","dir-tech.com","dirproxy.com","dirtyfox.net","dirtyporn.cc","distanta.net","divicast.com","divxtotal1.*","djpunjab2.in","dl-protect.*","dlolcast.pro","dlupload.com","dndsearch.in","dokumen.tips","domahatv.com","doodstream.*","dotabuff.com","doujindesu.*","downloadr.in","drakecomic.*","dreamdth.com","drivefire.co","drivemoe.com","drivers.plus","dropbang.net","dropgalaxy.*","drsnysvet.cz","drublood.com","ds2video.com","dukeofed.org","dumovies.com","duolingo.com","dutchycorp.*","dvd-flix.com","dwlinks.buzz","eastream.net","ecamrips.com","eclypsia.com","edukaroo.com","egram.com.ng","egyanime.com","ehotpics.com","elcultura.pl","electsex.com","elvocero.com","embed4me.com","embedtv.best","emporda.info","endbasic.dev","eng-news.com","engvideo.net","epson.com.cn","eroclips.org","erofound.com","erogarga.com","eropaste.net","eroticmv.com","esportivos.*","estrenosgo.*","estudyme.com","et-invest.de","etonline.com","eurogamer.de","eurogamer.es","eurogamer.it","eurogamer.pt","euronews.com","evernia.site","evfancy.link","ex-foary.com","examword.com","exceljet.net","exe-urls.com","expertvn.com","eymockup.com","ezeviral.com","f1livegp.net","facebook.com","factable.com","fairyhorn.cc","faiviral.com","fansided.com","fansmega.com","fapality.com","fapfappy.com","fartechy.com","fastilinks.*","fat-bike.com","fbsquadx.com","fc2stream.tv","fedscoop.com","feed2all.org","fehmarn24.de","femdomtb.com","ferdroid.net","fileguard.cc","fileguru.net","filemoon.*>>","filerice.com","filescdn.com","filessrc.com","filezipa.com","filmifen.com","filmisongs.*","filmizip.com","filmizletv.*","filmy4wap1.*","filmygod13.*","filmyone.com","filmyzilla.*","financid.com","finevids.xxx","firstonetv.*","fitforfun.de","fivemdev.org","flashbang.sh","flaticon.com","flexy.stream","flexyhit.com","flightsim.to","flixbaba.com","flowsnet.com","flstv.online","flvto.com.co","fm-arena.com","fmoonembed.*","focus4ca.com","footybite.to","forexrw7.com","forogore.com","forplayx.ink","fotopixel.es","freejav.guru","freemovies.*","freemp3.tube","freeshib.biz","freetron.top","freewsad.com","fremdwort.de","freshbbw.com","fruitlab.com","fsileaks.com","fuckmilf.net","fullboys.com","fullcinema.*","fullhd4k.com","fuskator.com","futemais.net","fxpornhd.com","galaxyos.net","game-owl.com","gamebrew.org","gamefast.org","gamekult.com","gamer.com.tw","gamerant.com","gamerxyt.com","games.get.tv","games.wkb.jp","gameslay.net","gameszap.com","gametter.com","gamezizo.com","gamingsym.in","gatagata.net","gay4porn.com","gaystream.pw","gayteam.club","gculopes.com","gelbooru.com","gentside.com","gerbeaud.com","getcopy.link","getitfree.cn","getmodsapk.*","gifcandy.net","gioialive.it","gksansar.com","glo-n.online","globes.co.il","globfone.com","gniewkowo.eu","gnusocial.jp","go2share.net","goanimes.vip","gobadgers.ca","gocast123.me","godzcast.com","gogoanimes.*","gogriffs.com","golancers.ca","gomuraw.blog","gonzoporn.cc","goracers.com","gosexpod.com","gottanut.com","goxavier.com","gplastra.com","grazymag.com","grigtube.com","grosnews.com","gseagles.com","gsmarena.com","gsmhamza.com","guidetnt.com","gurusiana.id","h-game18.xyz","habuteru.com","hachiraw.net","hackshort.me","hackstore.me","halloporno.*","harbigol.com","hbnews24.com","hbrfrance.fr","hdfcfund.com","hdhub4u.fail","hdmoviehub.*","hdmovies23.*","hdmovies4u.*","hdmovies50.*","hdpopcorns.*","hdporn92.com","hdpornos.net","hdvideo9.com","hellmoms.com","helpdice.com","hentai2w.com","hentai4k.com","hentaigo.com","hentaila.com","hentaimoe.me","hentais.tube","hentaitk.net","hentaizm.fun","heqviral.com","hi0ti780.fun","highporn.net","hiperdex.com","hipsonyc.com","hivetoon.com","hmanga.world","hostmath.com","hotmilfs.pro","hqporner.com","hubdrive.com","huffpost.com","hurawatch.cc","hwzone.co.il","hyderone.com","hydrogen.lat","hypnohub.net","ibradome.com","icutlink.com","icyporno.com","idealight.it","idesign.wiki","idntheme.com","iguarras.com","ihdstreams.*","ilovephd.com","ilpescara.it","imagefap.com","imdpu9eq.com","imgadult.com","imgbaron.com","imgblaze.net","imgbnwe.shop","imgbyrev.sbs","imgclick.net","imgdrive.net","imgflare.com","imgfrost.net","imggune.shop","imgjajhe.sbs","imgmffmv.sbs","imgnbii.shop","imgolemn.sbs","imgprime.com","imgqbbds.sbs","imgspark.com","imgthbm.shop","imgtorrnt.in","imgxabm.shop","imgxxbdf.sbs","imintweb.com","indianxxx.us","infodani.net","infofuge.com","informer.com","interssh.com","intro-hd.net","ipacrack.com","ipatriot.com","iptvapps.net","iptvspor.com","iputitas.net","iqksisgw.xyz","isaidub6.net","itainews.com","itz-fast.com","iwanttfc.com","izzylaif.com","jaktsidan.se","jalopnik.com","japanporn.tv","japteenx.com","jav-asia.top","javboys.tv>>","javbraze.com","javguard.xyz","javhahaha.us","javhdz.today","javindo.site","javjavhd.com","javmelon.com","javplaya.com","javplayer.me","javprime.net","javquick.com","javrave.club","javtiful.com","javturbo.xyz","jenpornuj.cz","jeshoots.com","jmzkzesy.xyz","jobfound.org","jobsheel.com","jockantv.com","joymaxtr.net","joziporn.com","jsfiddle.net","jsonline.com","juba-get.com","jujmanga.com","kabeleins.de","kafeteria.pl","kakitengah.*","kamehaus.net","kaoskrew.org","karanapk.com","katmoviehd.*","kattracker.*","kaystls.site","khaddavi.net","khatrimaza.*","khsn1230.com","kickasskat.*","kinisuru.com","kinkyporn.cc","kino-zeit.de","kiss-anime.*","kisstvshow.*","klubsports.*","knowstuff.in","kolcars.shop","kollhong.com","komonews.com","konten.co.id","koramaup.com","kpopjams.com","kr18plus.com","kreisbote.de","kstreaming.*","kubo-san.com","kumapoi.info","kungfutv.net","kunmanga.com","kurazone.net","kusonime.com","ladepeche.fr","landwirt.com","lanjutkeun.*","leaktube.net","learnmany.in","lectormh.com","lecturel.com","leechall.com","leprogres.fr","lesbenhd.com","lesbian8.com","lewdzone.com","liddread.com","lifestyle.bg","lifewire.com","likemanga.io","likuoo.video","linfoweb.com","linkjust.com","linksaya.com","linkshorts.*","linkvoom.com","lionsfan.net","livegore.com","livemint.com","livesport.ws","ln-online.de","lokerwfh.net","longporn.xyz","lookmovie.pn","lookmovie2.*","lootdest.com","lover937.net","lrepacks.net","lucidcam.com","lulustream.*","luluvdoo.com","luluvids.top","luscious.net","lusthero.com","luxuretv.com","m-hentai.net","mac2sell.net","macsite.info","mamahawa.com","manga18.club","mangadna.com","mangafire.to","mangagun.net","mangakio.com","mangakita.id","mangalek.com","mangamanga.*","manganato.gg","manganelo.tv","mangarawjp.*","mangasco.com","mangoporn.co","mangovideo.*","manhuaga.com","manhuascan.*","manhwa68.com","manhwass.com","manhwaus.net","manpeace.org","manyakan.com","manytoon.com","maqal360.com","marmiton.org","masengwa.com","mashtips.com","masslive.com","mat6tube.com","mathaeser.de","maturell.com","mavanimes.co","maxgaming.fi","mazakony.com","mc-hacks.net","mcfucker.com","mcrypto.club","mdbekjwqa.pw","mdtaiwan.com","mealcold.com","medscape.com","medytour.com","meetimgz.com","mega-mkv.com","mega-p2p.net","megafire.net","megatube.xxx","megaupto.com","meilblog.com","metabomb.net","meteolive.it","miaandme.org","micmicidol.*","microify.com","midis.com.ar","mikohub.blog","milftoon.xxx","miraculous.*","mirror.co.uk","missavtv.com","missyusa.com","mitsmits.com","mixloads.com","mjukb26l.fun","mkvcinemas.*","mlbstream.tv","mmsbee47.com","mobitool.net","modcombo.com","moddroid.com","modhoster.de","modsbase.com","modsfire.com","modyster.com","mom4real.com","momo-net.com","momspost.com","momxxx.video","monaco.co.il","mooonten.com","moretvtime.*","moshahda.net","motofakty.pl","movie4u.live","moviedokan.*","movieffm.net","moviefreak.*","moviekids.tv","movielair.cc","movierulzs.*","movierulzz.*","movies123.pk","movies18.net","movies4us.co","moviesapi.to","moviesbaba.*","moviesflix.*","moviesland.*","moviespapa.*","moviesrulz.*","moviesshub.*","moviesxxx.cc","movieweb.com","movstube.net","mp3fiber.com","mp3juices.su","mp4-porn.net","mpg.football","mrscript.net","multporn.net","musictip.net","mutigers.com","myesports.gg","myflixerz.to","myfxbook.com","mylinkat.com","naniplay.com","nanolinks.in","napiszar.com","nar.k-ba.net","natgeotv.com","nbastream.tv","nemumemo.com","nephobox.com","netmovies.to","netoff.co.jp","netuplayer.*","newatlas.com","news.now.com","newsextv.com","newsmondo.it","nextdoor.com","nextorrent.*","neymartv.net","nflscoop.xyz","nflstream.tv","nicetube.one","nicknight.de","nicovideo.jp","nifteam.info","nilesoft.org","niu-pack.com","niyaniya.moe","nkunorse.com","nonktube.com","novelasesp.*","novelbob.com","novelread.co","novoglam.com","novoporn.com","nowmaxtv.com","nowsports.me","nowsportv.nl","nowtv.com.tr","nptsr.live>>","nsfwgify.com","nsfwzone.xyz","nudecams.xxx","nudedxxx.com","nudistic.com","nudogram.com","nudostar.com","nueagles.com","nugglove.com","nusports.com","nwzonline.de","nyaa.iss.ink","nzbstars.com","oaaxpgp3.xyz","octanime.net","of-model.com","oimsmosy.fun","okulsoru.com","oldcamera.pl","olutposti.fi","olympics.com","oncehelp.com","oneupload.to","onlinexxx.cc","onlytech.com","onscreens.me","onyxfeed.com","op-online.de","openload.mov","opomanga.com","optifine.net","orangeink.pk","oricon.co.jp","osuskins.net","otakukan.com","otakuraw.net","ottverse.com","ottxmaza.com","ovagames.com","ovnihoje.com","oyungibi.com","pagalworld.*","pak-mcqs.net","paktech2.com","pandadoc.com","pandamovie.*","panthers.com","papunika.com","parenting.pl","parzibyte.me","paste.bin.sx","pastepvp.org","pastetot.com","patriots.com","pay4fans.com","pc-hobby.com","pcgamesn.com","pdfindir.net","peekvids.com","pelimeli.com","pelis182.net","pelisflix2.*","pelishouse.*","pelispedia.*","pelisplus2.*","pennlive.com","pentruea.com","perisxxx.com","phimmoiaz.cc","photooxy.com","photopea.com","picbaron.com","picjbet.shop","picnwqez.sbs","picyield.com","pietsmiet.de","pig-fuck.com","pilibook.com","pinayflix.me","piratebayz.*","pisatoday.it","pittband.com","pixbnab.shop","pixdfdj.shop","piximfix.com","pixkfkf.shop","pixnbrqw.sbs","pixrqqz.shop","pkw-forum.de","platinmods.*","play.1188.lv","play.max.com","play.nova.bg","play1002.com","player4u.xyz","playerfs.com","playertv.net","playfront.de","playmogo.com","playstore.pw","playvids.com","plaza.chu.jp","plc4free.com","plusupload.*","pmvhaven.com","poki-gdn.com","politico.com","polygamia.pl","pomofocus.io","ponsel4g.com","pornabcd.com","pornachi.com","porncomics.*","pornditt.com","pornfeel.com","pornfeet.xyz","pornflip.com","porngames.tv","porngrey.com","pornhat.asia","pornhdin.com","pornhits.com","pornhost.com","pornicom.com","pornleaks.in","pornlift.com","pornlore.com","pornluck.com","pornmoms.org","porno-tour.*","pornoaid.com","pornobae.com","pornoente.tv","pornohd.blue","pornotom.com","pornozot.com","pornpapa.com","porntape.net","porntrex.com","pornvibe.org","pornwatch.ws","pornyeah.com","pornyfap.com","pornzone.com","poscitechs.*","postazap.com","postimees.ee","powcloud.org","prensa.click","pressian.com","pricemint.in","prime4you.de","produsat.com","programme.tv","promipool.de","proplanta.de","prothots.com","ps2-bios.com","pugliain.net","pupupul.site","pussyspace.*","putlocker9.*","putlockerc.*","putlockers.*","pysznosci.pl","q1-tdsge.com","qashbits.com","qpython.club","quizrent.com","qvzidojm.com","r3owners.net","raidrush.net","rail-log.net","rajtamil.org","ranger5g.com","ranger6g.com","ranjeet.best","rapelust.com","rapidzona.tv","rarepike.com","raulmalea.ro","rawmanga.top","rawstory.com","razzball.com","rbs.ta36.com","recipahi.com","recipenp.com","recording.de","reddflix.com","redecanais.*","redretti.com","remilf.xyz>>","reminimod.co","repelisgoo.*","repretel.com","reqlinks.net","resplace.com","retire49.com","richhioon.eu","riotbits.com","ritzysex.com","rockmods.net","rolltide.com","romatoday.it","roms-hub.com","ronaldo7.pro","root-top.com","rosasidan.ws","rosefile.net","rot-blau.com","rotowire.com","royalkom.com","rp-online.de","rtilinks.com","rubias19.com","rue89lyon.fr","ruidrive.com","rushporn.xxx","s2watch.link","salidzini.lv","samfirms.com","samovies.net","satkurier.pl","savefrom.net","savegame.pro","savesubs.com","savevideo.me","scamalot.com","scjhg5oh.fun","seahawks.com","seeklogo.com","seireshd.com","seksrura.net","senimovie.co","senmanga.com","senzuri.tube","servustv.com","sethphat.com","seuseriado.*","sex-pic.info","sexgames.xxx","sexgay18.com","sexroute.net","sexy-games.*","sexyhive.com","sfajacks.com","sgxnifty.org","shanurdu.com","sharedrive.*","sharetext.me","shemale6.com","shemedia.com","sheshaft.com","shorteet.com","shrtslug.biz","sieradmu.com","silkengirl.*","sinonimos.de","siteflix.org","sitekeys.net","skinnyhq.com","skinnyms.com","slawoslaw.pl","slreamplay.*","slutdump.com","slutmesh.net","smailpro.com","smallpdf.com","smcgaels.com","smgplaza.com","snlookup.com","sobatkeren.*","sodomojo.com","solarmovie.*","sonixgvn.net","sortporn.com","sound-park.*","southfreak.*","sp-today.com","sp500-up.com","speedrun.com","spielfilm.de","spinoff.link","sport-97.com","sportico.com","sporting77.*","sportlemon.*","sportlife.es","sportnews.to","sportshub.to","sportskart.*","stardeos.com","stardima.com","stayglam.com","stbturbo.xyz","steelers.com","stevivor.com","stimotion.pl","stre4mplay.*","stream18.net","streamango.*","streambee.to","streameast.*","streampiay.*","streamtape.*","streamwish.*","strikeout.im","stylebook.de","subtaboo.com","sunbtc.space","sunporno.com","superapk.org","superpsx.com","supervideo.*","supramkv.com","surfline.com","surrit.store","sushi-scan.*","sussytoons.*","suzihaza.com","suzylu.co.uk","svipvids.com","swiftload.io","synonyms.com","syracuse.com","system32.ink","tabering.net","tabooporn.tv","tacobell.com","tacoma4g.com","tagecoin.com","tajpoint.com","tamilprint.*","tamilyogis.*","tampabay.com","tanfacil.net","tapchipi.com","tapepops.com","tatabrada.tv","team-rcv.xyz","tech24us.com","tech4auto.in","techably.com","techmuzz.com","technons.com","technorj.com","techstage.de","techstwo.com","techtobo.com","techyinfo.in","techzed.info","teczpert.com","teencamx.com","teenhost.net","teensark.com","teensporn.tv","teknorizen.*","telecinco.es","telegraaf.nl","teleriumtv.*","teluguflix.*","teraearn.com","terashare.co","terashare.me","tesbox.my.id","tespedia.com","testious.com","th-world.com","theblank.net","theconomy.me","thedaddy.*>>","thefmovies.*","thegamer.com","thehindu.com","thekickass.*","thelinkbox.*","themezon.net","theonion.com","theproxy.app","thesleak.com","thesukan.net","thevalley.fm","theverge.com","threezly.com","thuglink.com","thurrott.com","tigernet.com","tik-tok.porn","timestamp.fr","tioanime.com","tipranks.com","tnaflix.asia","tnhitsda.net","tntdrama.com","tokuzl.net>>","top10cafe.se","topeuropix.*","topfaucet.us","topkickass.*","topspeed.com","topstreams.*","torture1.net","trahodom.com","trendyol.com","tresdaos.com","truthnews.de","truyenvn.dev","tryboobs.com","ts-mpegs.com","tsmovies.com","tubedupe.com","tubewolf.com","tubxporn.com","tucinehd.com","turbobit.net","turbovid.vip","turkanime.co","turkdown.com","turkrock.com","tusfiles.com","tv3monde.com","tvappapk.com","tvdigital.de","tvpclive.com","tvtropes.org","tweakers.net","twister.porn","tz7z9z0h.com","u-s-news.com","u26bekrb.fun","udoyoshi.com","ugreen.autos","ukchat.co.uk","ukdevilz.com","ukigmoch.com","ultraten.net","umagame.info","unitystr.com","up-4ever.net","upload18.com","uploadbox.io","uploadmx.com","uploads.mobi","upshrink.com","uptomega.net","ur-files.com","usatoday.com","usaxtube.com","userupload.*","usp-forum.de","utahutes.com","utaitebu.com","utakmice.net","utsports.com","uur-tech.net","uwatchfree.*","veganinja.hu","vegas411.com","vibehubs.com","videofilms.*","videojav.com","videos-xxx.*","videovak.com","vidnest.live","vidsaver.net","vidsonic.net","vidsrc-me.su","vidsrc.click","viidshar.com","vijviral.com","vikiporn.com","violablu.net","vipporns.com","viralxns.com","visorsmr.com","vocalley.com","voirseries.*","volokit2.com","warddogs.com","wargamer.com","watchmovie.*","watchmygf.me","watchnow.fun","watchop.live","watchporn.cc","watchporn.to","watchtvchh.*","way2movies.*","web2.0calc.*","webcams.casa","webnovel.com","webxmaza.com","westword.com","whatgame.xyz","whyvpn.my.id","wikifeet.com","wikirise.com","winboard.org","winfuture.de","winlator.com","wishfast.top","withukor.com","wohngeld.org","wolfstream.*","worldaide.fr","worldmak.com","worldsex.com","writedroid.*","wspinanie.pl","www.google.*","x-video.tube","xculitos.com","xemphim1.top","xfantazy.com","xfantazy.org","xhaccess.com","xhadult2.com","xhadult3.com","xhamster10.*","xhamster11.*","xhamster12.*","xhamster13.*","xhamster14.*","xhamster15.*","xhamster16.*","xhamster17.*","xhamster18.*","xhamster19.*","xhamster20.*","xhamster42.*","xhdate.world","xpornium.net","xsexpics.com","xteensex.net","xvideos.name","xvideos2.com","xxporner.com","xxxfiles.com","xxxhdvideo.*","xxxonline.cc","xxxputas.net","xxxshake.com","xxxstream.me","yabiladi.com","yaoiscan.com","yggtorrent.*","yhocdata.com","ynk-blog.com","yogranny.com","you-porn.com","yourlust.com","yts-subs.com","yts-subs.net","ytube2dl.com","yuatools.com","yurudori.com","zealtyro.com","zehnporn.com","zenradio.com","zhlednito.cz","zilla-xr.xyz","zimabdko.com","zone.msn.com","zootube1.com","zplayer.live","zvision.link","zxcprime.icu","01234movies.*","01fmovies.com","10convert.com","10play.com.au","10starhub.com","111.90.150.10","111.90.151.26","111movies.com","123gostream.*","123movies.net","123moviesgo.*","123movieshd.*","123moviesla.*","123moviesme.*","123movieweb.*","123multihub.*","185.53.88.104","185.53.88.204","190.115.18.20","1bitspace.com","1qwebplay.xyz","1xxx-tube.com","247sports.com","2girls1cup.ca","30kaiteki.com","360news4u.net","38.242.194.12","3dhentai.club","4download.net","4drumkits.com","4filmyzilla.*","4horlover.com","4meplayer.com","4movierulz1.*","4runner6g.com","560pmovie.com","5movierulz2.*","6hiidude.gold","7fractals.icu","7misr4day.com","7movierulz1.*","7moviesrulz.*","7vibelife.com","94.103.83.138","9filmyzilla.*","9ketsuki.info","abczdrowie.pl","abendblatt.de","abseits-ka.de","acusports.com","acutetube.net","adblocktape.*","advantien.com","advertape.net","ainonline.com","aitohuman.org","ajt.xooit.org","akcartoons.in","albania.co.il","alexbacher.fr","alimaniac.com","allitebooks.*","allmomsex.com","alltstube.com","allusione.org","alohatube.xyz","alueviesti.fi","ambonkita.com","angelfire.com","angelgals.com","anihdplay.com","animecast.net","animefever.cc","animeflix.ltd","animefreak.to","animeheaven.*","animenexus.in","animesite.net","animesup.info","animetoast.cc","animeunity.so","animeworld.ac","animeworld.tv","animeyabu.net","animeyabu.org","animeyubi.com","anitube22.vip","aniwatchtv.to","aniworld.to>>","anonyviet.com","anusling.info","aogen-net.com","aparttent.com","appteka.store","arahdrive.com","archive.today","archivebate.*","archpaper.com","areabokep.com","areamobile.de","areascans.net","areatopik.com","arenascan.com","arenavision.*","arhplyrics.in","ariestube.com","ark-unity.com","arldeemix.com","artesacro.org","arti-flora.nl","articletz.com","artribune.com","asianboy.fans","asianhdplay.*","asianlbfm.net","asiansex.life","asiaontop.com","askattest.com","asssex-hd.com","astroages.com","astronews.com","at.wetter.com","audiotag.info","audiotrip.org","austiblox.net","auto-data.net","auto-swiat.pl","autobytel.com","autoextrem.de","autofrage.net","autoguide.com","autoscout24.*","autosport.com","autotrader.nl","avnsgames.com","avpgalaxy.net","azcentral.com","aztravels.net","b-bmovies.com","babakfilm.com","babepedia.com","babestube.com","babytorrent.*","baddiehub.com","beasttips.com","beegsexxx.com","besargaji.com","bestgames.com","beverfood.com","biftutech.com","bikeradar.com","bikerszene.de","bilasport.net","bilinovel.com","billboard.com","bimshares.com","bingsport.xyz","bitcosite.com","bitfaucet.net","bitlikutu.com","bitview.cloud","bizdustry.com","blasensex.com","blog.40ch.net","blogesque.net","blograffo.net","blurayufr.cam","bobs-tube.com","bokugents.com","bolly2tolly.*","bollymovies.*","boobgirlz.com","bootyexpo.net","boxylucha.com","boystube.link","bravedown.com","bravoporn.com","brawlhalla.fr","breitbart.com","breznikar.com","brighteon.com","brocoflix.com","brocoflix.xyz","bshifast.live","buffsports.io","buffstreams.*","bustyfats.com","buydekhke.com","bymichiby.com","call4cloud.nl","camarchive.tv","camdigest.com","camgoddess.tv","camvideos.org","camwhorestv.*","camwhoria.com","canalobra.com","canlikolik.my","capo5play.com","capo6play.com","caravaning.de","cardshare.biz","carryflix.icu","carscoops.com","cat-a-cat.net","cat3movie.org","cbsnews.com>>","ccthesims.com","cdiscount.com","celeb.gate.cc","celemusic.com","ceramic.or.kr","ceylonssh.com","cg-method.com","cgcosplay.org","chapteria.com","chataigpt.org","cheatcloud.cc","cheater.ninja","cheatsquad.gg","chevalmag.com","chihouban.com","chikonori.com","chimicamo.org","chloeting.com","cima100fm.com","cinecalidad.*","cinedokan.top","cinema.com.my","cinemabaz.com","cinemitas.org","civitai.green","claim.8bit.ca","claimbits.net","claudelog.com","claydscap.com","clickhole.com","cloudvideo.tv","cloudwish.xyz","cloutgist.com","cmsdetect.com","cmtracker.net","cnnamador.com","cockmeter.com","cocomanga.com","code2care.org","codeastro.com","codesnail.com","codewebit.top","coinbaby8.com","coinfaucet.io","coinlyhub.com","coinsbomb.com","comedyshow.to","comexlive.org","comparili.net","computer76.ru","condorsoft.co","configspc.com","cooksinfo.com","coolcast2.com","coolporno.net","corrector.app","courseclub.me","crackcodes.in","crackevil.com","crackfree.org","crazyporn.xxx","crazyshit.com","crazytoys.xyz","cricket12.com","criollasx.com","criticker.com","crocotube.com","crotpedia.net","crypto4yu.com","cryptonor.xyz","cryptorank.io","cuisineaz.com","cumlouder.com","cureclues.com","cuttlinks.com","cxissuegk.com","cybermania.ws","daddylive.*>>","daddylivehd.*","dailymail.com","dailynews.com","dailypaws.com","dailyrevs.com","dandanzan.top","dankmemer.lol","datavaults.co","dbusports.com","dcleakers.com","ddd-smart.net","decmelfot.xyz","deepfucks.com","deichstube.de","deluxtube.com","demae-can.com","dengarden.com","denofgeek.com","depvailon.com","derusblog.com","descargasok.*","desifakes.com","desijugar.net","desimmshd.com","dfilmizle.com","dickclark.com","dinnerexa.com","dipprofit.com","dirtyship.com","diskizone.com","dl-protect1.*","dlapk4all.com","dldokan.store","dlhe-videa.sk","dlstreams.*>>","doctoraux.com","dongknows.com","donkparty.com","doofree88.com","doomovie-hd.*","dooodster.com","doramasyt.com","dorawatch.net","douploads.net","douxporno.com","downfile.site","downloader.is","downloadhub.*","dr-farfar.com","dragontea.ink","dramafren.com","dramafren.org","dramaviki.com","drivelinks.me","drivenime.com","driveup.space","drop.download","dropnudes.com","dropshipin.id","dubaitime.net","durtypass.com","e-monsite.com","e2link.link>>","eatsmarter.de","ebonybird.com","ebook-hell.to","ebook3000.com","ebooksite.org","edealinfo.com","edukamer.info","egitim.net.tr","elespanol.com","embdproxy.xyz","embed.scdn.to","embedgram.com","embedplayer.*","embedrise.com","embedseek.xyz","embedwish.com","empleo.com.uy","emueagles.com","encurtads.net","encurtalink.*","enjoyfuck.com","ensenchat.com","entenpost.com","entireweb.com","ephoto360.com","epochtimes.de","eporner.video","eramuslim.com","erospots.info","eroticity.net","erreguete.gal","eurogamer.net","ev3forums.com","exe-links.com","expansion.com","extratipp.com","f150gen14.com","fadedfeet.com","familyporn.tv","fanfiktion.de","fangraphs.com","fantasiku.com","fapomania.com","faresgame.com","farodevigo.es","fastcars1.com","fclecteur.com","fembed9hd.com","fetish-tv.com","fetishtube.cc","file-upload.*","filegajah.com","filehorse.com","filemooon.top","filmeseries.*","filmibeat.com","filmlinks4u.*","filmy4wap.uno","filmyporno.tv","filmyworlds.*","findheman.com","firescans.xyz","firmwarex.net","firstpost.com","fivemturk.com","flexamens.com","flexxporn.com","flix-wave.lol","flixlatam.com","flyplayer.xyz","fmoviesfree.*","fontyukle.net","footeuses.com","footyload.com","forexforum.co","forlitoday.it","forum.dji.com","fossbytes.com","fosslinux.com","fotoblogia.pl","foxaholic.com","foxsports.com","foxtel.com.au","frauporno.com","free.7hd.club","freedom3d.art","freeflix.info","freegames.com","freeiphone.fr","freeomovie.to","freeporn8.com","freesex-1.com","freeshot.live","freexcafe.com","freexmovs.com","freshscat.com","freyalist.com","fromwatch.com","fsicomics.com","fsl-stream.lu","fsportshd.net","fsportshd.xyz","fuck-beeg.com","fuck-xnxx.com","fuckingfast.*","fucksporn.com","fullassia.com","fullhdxxx.com","funandnews.de","fussball.news","futurezone.de","fzmovies.info","fztvseries.ng","gamearter.com","gamedrive.org","gamefront.com","gamelopte.com","gamereactor.*","games.bnd.com","games.qns.com","gamesite.info","gamesmain.xyz","gamezhero.com","gamovideo.com","garoetpos.com","gatasdatv.com","gayboyshd.com","gaysearch.com","geekering.com","generate.plus","gesundheit.de","getintopc.com","getpaste.link","getpczone.com","gfsvideos.com","ghscanner.com","gigmature.com","gipfelbuch.ch","girlnude.link","girlydrop.com","globalnews.ca","globalrph.com","globalssh.net","globlenews.in","go.linkify.ru","gobobcats.com","gogoanimetv.*","gogoplay1.com","gogoplay2.com","gohuskies.com","gol245.online","goldderby.com","gomaainfo.com","gomoviestv.to","goodriviu.com","govandals.com","grabpussy.com","grantorrent.*","graphicux.com","greatnass.com","greensmut.com","gry-online.pl","gsmturkey.net","guardaserie.*","guessthe.game","gutefrage.net","gutekueche.at","gwusports.com","haaretz.co.il","hailstate.com","hairytwat.org","hancinema.net","haonguyen.top","haoweichi.com","harimanga.com","harzkurier.de","hdgayporn.net","hdmoviefair.*","hdmoviehubs.*","hdmovieplus.*","hdmovies2.org","hdtubesex.net","heatworld.com","heimporno.com","hellabyte.one","hellenism.net","hellporno.com","hentai-ia.com","hentaicop.com","hentaihaven.*","hentaikai.com","hentaimama.tv","hentaipaw.com","hentaiporn.me","hentairead.io","hentaiyes.com","herzporno.net","heutewelt.com","hexupload.net","hiddenleaf.to","hifi-forum.de","hihihaha1.xyz","hihihaha2.xyz","hilites.today","hindimovies.*","hindinest.com","hindishri.com","hindisink.com","hindisite.net","hispasexy.org","hitsports.pro","hlsplayer.top","hobbykafe.com","holaporno.xxx","holymanga.net","hornbunny.com","hornyfanz.com","hosttbuzz.com","hotntubes.com","hotpress.info","howtogeek.com","hqmaxporn.com","hqpornero.com","hqsex-xxx.com","htmlgames.com","hulkshare.com","hurawatchz.to","hydraxcdn.biz","hypebeast.com","hyperdebrid.*","iammagnus.com","iceland.co.uk","ichberlin.com","icy-veins.com","ievaphone.com","iflixmovies.*","ifreefuck.com","igg-games.com","ignboards.com","iiyoutube.com","ikarianews.gr","ikz-online.de","ilpiacenza.it","imagehaha.com","imagenpic.com","imgbbnhi.shop","imgbncvnv.sbs","imgcredit.xyz","imghqqbg.shop","imgkkabm.shop","imgmyqbm.shop","imgouskel.sbs","imgwallet.com","imgwwqbm.shop","imleagues.com","indiafree.net","indiamaja.com","indianyug.com","indiewire.com","ineedskin.com","inextmovies.*","infidrive.net","inhabitat.com","instagram.com","instalker.org","interfans.org","investing.com","iogames.space","ipalibrary.me","iptvpulse.top","italpress.com","itdmusics.com","itdmusicy.com","itmaniatv.com","itopmusic.com","itsguider.com","jadijuara.com","jagoanssh.com","jameeltips.us","japanxxx.asia","jav101.online","javenglish.cc","javguard.club","javhdporn.com","javhdporn.net","javleaked.com","javmobile.net","javporn18.com","javsaga.ninja","javstream.com","javstream.top","javsubbed.xyz","javsunday.com","jaysndees.com","jazzradio.com","jellynote.com","jennylist.xyz","jesseporn.xyz","jiocinema.com","jipinsoft.com","jizzberry.com","jk-market.com","jkdamours.com","jncojeans.com","jobzhub.store","joongdo.co.kr","jpscan-vf.com","jptorrent.org","juegos.as.com","jumboporn.xyz","junkyponk.com","jurukunci.net","justjared.com","justpaste.top","justwatch.com","juventusfc.hu","k12reader.com","kacengeng.com","kakiagune.com","kalileaks.com","kanaeblog.net","kangkimin.com","katdrive.link","katestube.com","katmoviefix.*","kayoanime.com","kckingdom.com","kenta2222.com","kfapfakes.com","kfrfansub.com","kicaunews.com","kickcharm.com","kissasian.*>>","klaustube.com","klikmanga.com","kllproject.lv","klykradio.com","kobieta.wp.pl","kolnovel.site","koreanbj.club","korsrt.eu.org","kotanopan.com","kpopjjang.com","ksusports.com","kumascans.com","kupiiline.com","kuronavi.blog","kurosuen.live","lamorgues.com","laptrinhx.com","latinabbw.xyz","latinlucha.es","laurasia.info","lavoixdux.com","law101.org.za","learn-cpp.org","learnclax.com","lecceprima.it","leccotoday.it","leermanga.net","leinetal24.de","letmejerk.com","letras.mus.br","lewdstars.com","liberation.fr","liiivideo.com","likemanga.ink","lilymanga.net","ling-online.*","link4rev.site","linkfinal.com","linkshortx.in","linkskibe.com","linkspaid.com","linovelib.com","linuxhint.com","lippycorn.com","listeamed.net","litecoin.host","litonmods.com","liveonsat.com","livestreams.*","liveuamap.com","lolcalhost.ru","lolhentai.net","longfiles.com","lookmovie2.to","loot-link.com","lootlemon.com","loptelink.com","lordpremium.*","love4porn.com","lovetofu.cyou","lowellsun.com","lrtrojans.com","lsusports.net","ludigames.com","lulacloud.com","lustesthd.lat","lustholic.com","lusttaboo.com","lustteens.net","lustylist.com","lustyspot.com","luxusmail.org","m.viptube.com","m.youtube.com","maccanismi.it","macrumors.com","macserial.com","magesypro.com","mailnesia.com","mailocal2.xyz","mainbabes.com","mainlinks.xyz","mainporno.com","makeuseof.com","mamochki.info","manga-dbs.com","manga-tube.me","manga18fx.com","mangacrab.com","mangacrab.org","mangadass.com","mangafreak.me","mangahere.onl","mangakoma01.*","mangalist.org","mangarawjp.me","mangaread.org","mangasite.org","mangoporn.net","manhastro.com","manhastro.net","manhuatop.org","manhwatop.com","manofadan.com","map.naver.com","math-aids.com","mathcrave.com","mathebibel.de","mathsspot.com","matomeiru.com","maz-online.de","mconverter.eu","md3b0j6hj.com","mdfx9dc8n.net","mdy48tn97.com","medebooks.xyz","mediafire.com","mediamarkt.be","mediamarkt.de","mediapason.it","medihelp.life","mega-dvdrip.*","megagames.com","megane.com.pl","megawarez.org","megawypas.com","meineorte.com","meinestadt.de","memangbau.com","memedroid.com","menshealth.de","metalflirt.de","meteocity.com","meteopool.org","metrolagu.cam","mettablog.com","meuanime.info","mexicogob.com","mh.baxoi.buzz","mhdsportstv.*","mhdtvsports.*","miohentai.com","miraculous.to","mirrorace.com","missav123.com","missav888.com","mitedrive.com","mixdrop21.net","mixdrop23.net","mixdropjmk.pw","mjakmama24.pl","mmastreams.me","mmorpg.org.pl","mobdi3ips.com","mobdropro.com","modelisme.com","mom-pussy.com","momxxxass.com","momxxxsex.com","moneyhouse.ch","monstream.org","monzatoday.it","moonquill.com","moovitapp.com","moozpussy.com","moregirls.org","morgenpost.de","mosttechs.com","motive213.com","motofan-r.com","motor-talk.de","motorbasar.de","motortests.de","moutogami.com","moviedekho.in","moviefone.com","moviehaxx.pro","moviejones.de","movielinkbd.*","moviepilot.de","movieping.com","movierulzhd.*","moviesdaweb.*","moviesite.app","moviesverse.*","moviexxx.mobi","mp3-gratis.it","mp3fusion.net","mp3juices.icu","mp4mania1.net","mp4upload.com","mrpeepers.net","mtech4you.com","mtg-print.com","mtraffics.com","multicanais.*","musicsite.biz","musikradar.de","mustang6g.com","mustang7g.com","myadslink.com","mydomaine.com","myfernweh.com","myflixertv.to","myhindigk.com","myhomebook.de","myicloud.info","myrecipes.com","myshopify.com","mysostech.com","mythvista.com","myvidplay.com","myvidster.com","myviptuto.com","myyouporn.com","naijahits.com","nakenprat.com","napolipiu.com","nastybulb.com","nation.africa","natomanga.com","naturalbd.com","nbcsports.com","ncdexlive.org","needrombd.com","neilpatel.com","nekolink.site","nekopoi.my.id","neoseeker.com","nesiaku.my.id","netcinebs.lat","netfilmes.org","netnaijas.com","nettiauto.com","neuepresse.de","neurotray.com","nevcoins.club","neverdims.com","newstopics.in","newyorker.com","newzjunky.com","nexusgames.to","nexusmods.com","nflstreams.me","nhvnovels.com","nicematin.com","nicomanga.com","nihonkuni.com","nin10news.com","nklinks.click","nlcosplay.com","noblocktape.*","noikiiki.info","noob4cast.com","noor-book.com","nordbayern.de","notevibes.com","nousdecor.com","nouvelobs.com","novamovie.net","novelcrow.com","novelroom.net","novizer.com>>","nsfwalbum.com","nsfwhowto.xyz","nudegista.com","nudistube.com","nuhuskies.com","nukibooks.com","nulledmug.com","nvimfreak.com","nwusports.com","odiadance.com","odiafresh.com","officedepot.*","ogoplayer.xyz","ohmybrush.com","ojogos.com.br","okhatrimaza.*","onemanhua.com","onlinegdb.com","onlyssh.my.id","onlystream.tv","op-marburg.de","openloadmov.*","ostreaming.tv","otakuliah.com","otakuporn.com","otonanswer.jp","ottawasun.com","ovcsports.com","owlsports.com","ozulscans.com","padovaoggi.it","pagalfree.com","pagalmovies.*","pagalworld.us","paidnaija.com","paipancon.com","panuvideo.com","paolo9785.com","parisporn.org","parmatoday.it","pasteboard.co","pasteflash.sx","pastelink.net","patchsite.net","pawastreams.*","pc-builds.com","pc-magazin.de","pclicious.net","peacocktv.com","peladas69.com","peliculas24.*","pelisflix20.*","pelisgratis.*","pelismart.com","pelisplusgo.*","pelisplushd.*","pelisplusxd.*","pelisstar.com","perplexity.ai","pervclips.com","pg-wuming.com","pianokafe.com","pic-upload.de","picbcxvxa.sbs","pichaloca.com","pics-view.com","pienovels.com","piraproxy.app","pirateproxy.*","pixbkghxa.sbs","pixbryexa.sbs","pixnbrqwg.sbs","pixtryab.shop","pkbiosfix.com","pkproject.net","play.aetv.com","player.stv.tv","player4me.vip","playfmovies.*","playpaste.com","plugincim.com","pocketnow.com","poco.rcccn.in","pokemundo.com","polska-ie.com","popcorntime.*","porn4fans.com","pornbaker.com","pornbimbo.com","pornblade.com","pornborne.com","pornchaos.org","pornchimp.com","porncomics.me","porncoven.com","porndollz.com","porndrake.com","pornfelix.com","pornfuzzy.com","pornloupe.com","pornmonde.com","pornoaffe.com","pornobait.com","pornocomics.*","pornoeggs.com","pornohaha.com","pornohans.com","pornohelm.com","pornokeep.com","pornoleon.com","pornomico.com","pornonline.cc","pornonote.pro","pornoplum.com","pornproxy.app","pornproxy.art","pornretro.xyz","pornslash.com","porntopic.com","porntube18.cc","posterify.net","pourcesoir.in","povaddict.com","powforums.com","pravda.com.ua","pregledaj.net","pressplay.cam","pressplay.top","prignitzer.de","primewire.*>>","proappapk.com","proboards.com","produktion.de","promiblogs.de","prostoporno.*","protestia.com","protopage.com","pureleaks.net","pussy-hub.com","pussyspot.net","putlockertv.*","puzzlefry.com","pvpoke-re.com","pygodblog.com","quesignifi.ca","quicasting.it","quickporn.net","rainytube.com","ranourano.xyz","rbscripts.net","read.amazon.*","readingbd.com","realbooru.com","realmadryt.pl","rechtslupe.de","redhdtube.xxx","redsexhub.com","reliabletv.me","repelisgooo.*","restorbio.com","reviewdiv.com","rexdlfile.com","ridvanmau.com","riggosrag.com","ritzyporn.com","rocdacier.com","rockradio.com","rojadirecta.*","roms4ever.com","romsgames.net","romspedia.com","rossoporn.com","rottenlime.pw","roystream.com","rufiiguta.com","rule34.jp.net","rumbunter.com","ruyamanga.com","s.sseluxx.com","sagewater.com","sarapbabe.com","sassytube.com","savefiles.com","scatkings.com","scimagojr.com","scrapywar.com","scrolller.com","sendspace.com","seneporno.com","sensacine.com","seriesite.net","set.seturl.in","sex-babki.com","sexbixbox.com","sexbox.online","sexdicted.com","sexmazahd.com","sexmutant.com","sexphimhd.net","sextube-6.com","sexyscope.net","sexytrunk.com","sfastwish.com","sfirmware.com","shameless.com","share.hntv.tv","share1223.com","sharemods.com","sharkfish.xyz","sharphindi.in","shemaleup.net","short-fly.com","short1ink.com","shortlinkto.*","shortpaid.com","shorttrick.in","shownieuws.nl","shroomers.app","siimanga.cyou","simana.online","simplebits.io","simpmusic.org","sissytube.net","sitefilme.com","sitegames.net","sk8therapy.fr","skymovieshd.*","smartworld.it","smashkarts.io","snapwordz.com","socigames.com","softcobra.com","softfully.com","sohohindi.com","solarmovie.id","solarmovies.*","solotrend.net","songfacts.com","sosovalue.com","spankbang.com","spankbang.mov","speedporn.net","speedtest.net","speedweek.com","spfutures.org","spokesman.com","spontacts.com","sportbar.live","sportlemons.*","sportlemonx.*","sportowy24.pl","sportsbite.cc","sportsembed.*","sportsnest.co","sportsrec.com","sportweb.info","spring.org.uk","ssyoutube.com","stagemilk.com","stalkface.com","starsgtech.in","startpage.com","startseite.to","ster-blog.xyz","stereogum.com","stock-rom.com","str8ongay.com","stre4mpay.one","stream-69.com","stream4free.*","streambtw.com","streamcloud.*","streamfree.to","streamhd247.*","streamobs.net","streampoi.com","streamporn.cc","streamsport.*","streamta.site","streamtp1.com","streamvid.net","strefaagro.pl","striptube.net","stylist.co.uk","subtitles.cam","subtorrents.*","suedkurier.de","sufanblog.com","sulleiman.com","sunporno.club","superstream.*","supervideo.tv","supforums.com","sweetgirl.org","swisscows.com","switch520.com","sylverkat.com","sysguides.com","szexkepek.net","szexvideok.hu","t-rocforum.de","tab-maker.com","taboodude.com","taigoforum.de","tamilarasan.*","tamilguns.org","tamilhit.tech","tapenoads.com","tatsublog.com","techacode.com","techclips.net","techdriod.com","techilife.com","technofino.in","techradar.com","techrecur.com","techtrim.tech","techybuff.com","techyrick.com","teenbabe.link","tehnotone.com","teknisitv.com","temp-mail.lol","temp-mail.org","tempumail.com","tennis.stream","ternitoday.it","terrylove.com","testsieger.de","texastech.com","thejournal.ie","thelayoff.com","thememypc.net","thenation.com","thespruce.com","thestreet.com","thetemp.email","thethings.com","thetravel.com","theuser.cloud","theweek.co.uk","thichcode.net","thiepmung.com","thotpacks.xyz","thotslife.com","thoughtco.com","tierfreund.co","tierlists.com","timescall.com","tinyzonetv.cc","tinyzonetv.se","tiz-cycling.*","tmohentai.com","to-travel.net","tok-thots.com","tokopedia.com","tokuzilla.net","topwwnews.com","torgranate.de","torrentz2eu.*","torupload.com","totalcsgo.com","totaldebrid.*","tourporno.com","towerofgod.me","trade2win.com","trailerhg.xyz","trangchu.news","transfaze.com","transflix.net","transtxxx.com","travelbook.de","tremamnon.com","tribeclub.com","tricksplit.io","trigonevo.com","tripsavvy.com","tsubasatr.org","tubehqxxx.com","tubemania.org","tubereader.me","tudigitale.it","tudotecno.com","tukipasti.com","tunabagel.net","tunemovie.fun","turkleech.com","tutcourse.com","tvfutbol.info","twink-hub.com","twstalker.com","txxxporn.tube","uberhumor.com","ubuntudde.com","udemyking.com","udinetoday.it","uhcougars.com","uicflames.com","uniqueten.net","unlockapk.com","unlockxh4.com","unnuetzes.com","unterhalt.net","up4stream.com","upfilesgo.com","uploadgig.com","uptoimage.com","urgayporn.com","utrockets.com","uwbadgers.com","vectorizer.io","vegamoviese.*","veoplanet.com","verhentai.top","vermoegen.org","vibestreams.*","vibraporn.com","vid-guard.com","vidaextra.com","videoplayer.*","vidora.stream","vidspeeds.com","vidstream.pro","viefaucet.com","villanova.com","vintagetube.*","vipergirls.to","vipserije.com","vipstand.pm>>","visionias.net","visnalize.com","vixenless.com","vkrovatku.com","voidtruth.com","voiranime1.fr","voirseries.io","vosfemmes.com","vpntester.org","vpzserver.com","vstplugin.net","vuinsider.com","w3layouts.com","waploaded.com","warezsite.net","watch.plex.tv","watchdirty.to","watchluna.com","watchmovies.*","watchseries.*","watchsite.net","watchtv24.com","wdpglobal.com","weatherwx.com","weirdwolf.net","wendycode.com","westmanga.org","wetpussy.sexy","wg-gesucht.de","whoreshub.com","widewifes.com","wikipekes.com","wikitechy.com","willcycle.com","windowspro.de","wkusports.com","wlz-online.de","wmoviesfree.*","wonderapk.com","wordshake.com","workink.click","world4ufree.*","worldfree4u.*","worldsports.*","worldstar.com","worldtop2.com","wowescape.com","wunderweib.de","wvusports.com","www.amazon.de","www.seznam.cz","www.twitch.tv","www.yahoo.com","x-fetish.tube","x-videos.name","xanimehub.com","xhbranch5.com","xhchannel.com","xhlease.world","xhplanet1.com","xhplanet2.com","xhvictory.com","xhwebsite.com","xmovies08.org","xnxxjapon.com","xoxocomic.com","xrivonet.info","xsportbox.com","xsportshd.com","xstory-fr.com","xxvideoss.org","xxx-image.com","xxxbunker.com","xxxcomics.org","xxxfree.watch","xxxhothub.com","xxxscenes.net","xxxvideo.asia","xxxvideor.com","y2meta-uk.com","yachtrevue.at","yandexcdn.com","yaoiotaku.com","ycongnghe.com","yesmovies.*>>","yesmovies4u.*","yeswegays.com","ymp4.download","yogitimes.com","youjizzz.club","youlife24.com","youngleak.com","youpornfm.com","youtubeai.com","yoyofilmeys.*","yt1s.com.co>>","yumekomik.com","zamundatv.com","zerotopay.com","zigforums.com","zinkmovies.in","zmamobile.com","zoompussy.com","zorroplay.xyz","0dramacool.net","111.90.141.252","111.90.150.149","111.90.159.132","1111fullwise.*","123animehub.cc","123moviefree.*","123movierulz.*","123movies4up.*","123moviesd.com","123movieshub.*","185.193.17.214","188.166.182.72","18girlssex.com","1cloudfile.com","1pack1goal.com","1primewire.com","1shortlink.com","1stkissmanga.*","3gpterbaru.com","3rabsports.com","4everproxy.com","69hoshudaana.*","69teentube.com","90fpsconfig.in","absolugirl.com","absolutube.com","admiregirls.su","adnan-tech.com","adsafelink.com","afilmywapi.biz","agedvideos.com","airsextube.com","akumanimes.com","akutsu-san.com","alexsports.*>>","alimaniacky.cz","allbbwtube.com","allcalidad.app","allcelebs.club","allmovieshub.*","allosoccer.com","allpremium.net","allrecipes.com","alluretube.com","allwpworld.com","almezoryae.com","alphaporno.com","amanguides.com","amateurfun.net","amateurporn.co","amigosporn.top","ancensored.com","anconatoday.it","androgamer.org","androidacy.com","ani-stream.com","anime4mega.net","animeblkom.net","animefire.info","animefire.plus","animeheaven.ru","animeindo.asia","animeshqip.org","animespank.com","animesvision.*","anonymfile.com","anyxvideos.com","aozoraapps.net","app.cekresi.me","appsfree4u.com","arab4media.com","arabincest.com","arabxforum.com","arealgamer.org","ariversegl.com","arlinadzgn.com","armyranger.com","articlebase.pk","artoffocas.com","ashemaletube.*","ashemaletv.com","asianporn.sexy","asianwatch.net","askpaccosi.com","askushowto.com","assesphoto.com","astro-seek.com","atlantic10.com","autocentrum.pl","autopareri.com","av1encodes.com","b3infoarena.in","balkanteka.net","bamahammer.com","bankshiksha.in","bantenexis.com","batmanstream.*","battleboats.io","bbwfuckpic.com","bcanepaltu.com","bcsnoticias.mx","bdsmstreak.com","bdsomadhan.com","bdstarshop.com","beegvideoz.com","belloporno.com","benzinpreis.de","best18porn.com","bestofarea.com","betaseries.com","bgmiesports.in","bharian.com.my","bhugolinfo.com","bidersnotu.com","bildderfrau.de","bingotingo.com","bit-shares.com","bitcotasks.com","bitcrypto.info","bittukitech.in","blackcunts.org","blackteen.link","blocklayer.com","blowjobgif.net","bluedollar.net","boersennews.de","bolly-tube.com","bollywoodx.org","bonstreams.net","boobieblog.com","boobsradar.com","boobsrealm.com","boredgiant.com","boxaoffrir.com","brainknock.net","bravoteens.com","bravotube.asia","brightpets.org","brulosophy.com","btcadspace.com","btcsatoshi.net","btvnovinite.bg","buccaneers.com","buchstaben.com","businessua.com","bustmonkey.com","bustybloom.com","bysefujedu.com","bysejikuar.com","byseqekaho.com","byseraguci.com","bysesukior.com","bysetayico.com","cacfutures.org","cadenadial.com","calculate.plus","calgarysun.com","camgirlbay.net","camgirlfap.com","camsstream.com","canalporno.com","caracol.com.co","cardscanner.co","carrnissan.com","casertanews.it","celebjihad.com","celebwhore.com","cellmapper.net","cesenatoday.it","chachocool.com","chanjaeblog.jp","chart.services","chatgptfree.ai","chaturflix.cam","cheatermad.com","chietitoday.it","cimanow.online","cine-calidad.*","cinelatino.net","cinemalibero.*","cinepiroca.com","claimcrypto.cc","claimlite.club","clasicotas.org","clicknupload.*","clipartmax.com","cloudflare.com","cloudvideotv.*","club-flank.com","codeandkey.com","coinadpro.club","coloradoan.com","comdotgame.com","comicsarmy.com","comixzilla.com","commanders.com","compromath.com","comunio-cl.com","convert2mp3.cx","coolrom.com.au","copyseeker.net","courseboat.com","coverapi.space","coverapi.store","cpu-monkey.com","crackshash.com","cracksports.me","crazygames.com","crazyvidup.com","creebhills.com","crichdplays.ru","cricwatch.io>>","croq-kilos.com","crunchyscan.fr","crypt.cybar.to","cryptoforu.org","cryptonetos.ru","cryptotech.fun","cryptstream.de","csgo-ranks.com","cuckoldsex.net","curseforge.com","cwtvembeds.com","cyberscoop.com","czechvideo.org","dagensnytt.com","dailylocal.com","dallasnews.com","dansmovies.com","daotranslate.*","daxfutures.org","dayuploads.com","ddwloclawek.pl","defenseone.com","delcotimes.com","derstandard.at","derstandard.de","desicinema.org","desicinemas.pk","designbump.com","desiremovies.*","desktophut.com","devdrive.cloud","deviantart.com","diampokusy.com","dicariguru.com","dieblaue24.com","digipuzzle.net","direct-cloud.*","dirtytamil.com","disneyplus.com","dobletecno.com","dodgersway.com","dogsexporn.net","doseofporn.com","dotesports.com","dotfreesex.com","dotfreexxx.com","doujinnote.com","dowfutures.org","downloadming.*","drakecomic.com","dreamfancy.org","duniailkom.com","dvdgayporn.com","dvdporngay.com","e123movies.com","easytodoit.com","eatingwell.com","ebooksyard.com","ecacsports.com","echo-online.de","ed-protect.org","eddiekidiw.com","eftacrypto.com","elcorreoweb.es","electomania.es","elitegoltv.org","elitetorrent.*","elmalajeno.com","elnacional.cat","emailnator.com","embedsports.me","embedstream.me","empire-anime.*","emturbovid.com","emugameday.com","enryumanga.com","ensuretips.com","epicstream.com","epornstore.com","ericdraken.com","erinsakura.com","erokomiksi.com","eroprofile.com","esgentside.com","esportivos.fun","este-walks.net","estrenosflix.*","estrenosflux.*","ethiopia.co.il","examscisco.com","exbulletin.com","expertplay.net","exteenporn.com","extratorrent.*","extreme-down.*","eztvtorrent.co","f123movies.com","faaduindia.com","fairyanime.com","fakazagods.com","fakedetail.com","fanatik.com.tr","fantacalcio.it","fap-nation.org","faperplace.com","faselhdwatch.*","fastdour.store","fatxxxtube.com","faucetdump.com","fduknights.com","fetishburg.com","fettspielen.de","fhmemorial.com","fibwatch.store","filemirage.com","fileplanet.com","filesharing.io","filesupload.in","film-adult.com","filme-bune.biz","filmpertutti.*","filmy4waps.org","filmypoints.in","filmyzones.com","filtercams.com","finanztreff.de","finderporn.com","findtranny.com","fine-wings.com","firefaucet.win","fitdynamos.com","fleamerica.com","flostreams.xyz","flycutlink.com","fmoonembed.pro","foodgustoso.it","foodiesjoy.com","foodtechnos.in","football365.fr","fooxybabes.com","forex-trnd.com","freeforums.net","freegayporn.me","freehqtube.com","freeltc.online","freemodsapp.in","freepasses.org","freepdfcomic.*","freepreset.net","freesoccer.net","freesolana.top","freetubetv.net","freiepresse.de","freshplaza.com","freshremix.net","frostytube.com","fu-4u3omzw0.nl","fucktube4k.com","fuckundies.com","fullporner.com","fullvoyeur.com","gadgetbond.com","gamefi-mag.com","gameofporn.com","games.amny.com","games.insp.com","games.metro.us","games.metv.com","games.wtop.com","games2rule.com","games4king.com","gamesgames.com","gamesleech.com","gayforfans.com","gaypornhot.com","gayxxxtube.net","gazettenet.com","gdr-online.com","gdriveplayer.*","gecmisi.com.tr","genovatoday.it","getintopcm.com","getintoway.com","getmaths.co.uk","gettapeads.com","getthispdf.com","gigacourse.com","gisvacancy.com","gknutshell.com","gloryshole.com","goalsport.info","gobearcats.com","gofirmware.com","goislander.com","golightsgo.com","gomoviesfree.*","gomovieshub.io","goodreturns.in","goodstream.one","googlvideo.com","gorecenter.com","gorgeradio.com","goshockers.com","gostanford.com","gostreamon.net","goterriers.com","gotgayporn.com","gotigersgo.com","gourmandix.com","gousfbulls.com","govtportal.org","grannysex.name","grantorrent1.*","grantorrents.*","graphicget.com","grubstreet.com","guitarnick.com","gujjukhabar.in","gurbetseli.net","guruofporn.com","gutfuerdich.co","gyanitheme.com","gyonlineng.com","hairjob.wpx.jp","haloursynow.pl","hanime1-me.top","hannibalfm.net","hardcorehd.xxx","haryanaalert.*","hausgarten.net","hawtcelebs.com","hdhub4one.pics","hdmovies23.com","hdmoviesfair.*","hdmoviesflix.*","hdmoviesmaza.*","hdpornteen.com","healthelia.com","healthmyst.com","hentai-for.net","hentai-hot.com","hentai-one.com","hentaiasmr.moe","hentaiblue.net","hentaibros.com","hentaicity.com","hentaidays.com","hentaihere.com","hentaipins.com","hentairead.com","hentaisenpai.*","hentaiworld.tv","heysigmund.com","hidefninja.com","hilaryhahn.com","hinatasoul.com","hindilinks4u.*","hindimovies.to","hindiporno.pro","hit-erotic.com","hollymoviehd.*","homebooster.de","homeculina.com","hortidaily.com","hotcleaner.com","hotgirlhub.com","hotgirlpix.com","howtocivil.com","hpaudiobooks.*","hyogo.ie-t.net","hypershort.com","i123movies.net","iconmonstr.com","idealfollow.in","idlelivelink.*","ilifehacks.com","ilikecomix.com","imagetwist.com","imgjbxzjv.shop","imgjmgfgm.shop","imgjvmbbm.shop","imgnnnvbrf.sbs","inbbotlist.com","indi-share.com","indiainfo4u.in","indiatimes.com","indopanas.cyou","infocycles.com","infokita17.com","infomaniakos.*","informacion.es","inhumanity.com","insidenova.com","instaporno.net","ios.codevn.net","iqksisgw.xyz>>","isekaitube.com","issstories.xyz","itopmusics.com","itopmusicx.com","iuhoosiers.com","jacksorrell.tv","jalshamoviez.*","janamathaya.lk","japannihon.com","japantaboo.com","javaguides.net","javbangers.com","javggvideo.xyz","javhdvideo.org","javheroine.com","javplayers.com","javsexfree.com","javsubindo.com","javtsunami.com","javxxxporn.com","jeniusplay.com","jewelry.com.my","jizzbunker.com","join2babes.com","joyousplay.xyz","jpopsingles.eu","juegoviejo.com","jugomobile.com","juicy3dsex.com","justababes.com","justembeds.xyz","justthegays.tv","kaboomtube.com","kahanighar.com","kakarotfoot.ru","kannadamasti.*","kashtanka2.com","keepkoding.com","kendralist.com","kgs-invest.com","khabarbyte.com","kickassanime.*","kickasshydra.*","kiddyshort.com","kindergeld.org","kingofdown.com","kiradream.blog","kisahdunia.com","kits4beats.com","klartext-ne.de","kokostream.net","komikmanhwa.me","kompasiana.com","kordramass.com","kurakura21.com","kuruma-news.jp","ladkibahin.com","lampungway.com","laprovincia.es","laradiobbs.net","laser-pics.com","latinatoday.it","lauradaydo.com","layardrama21.*","leaderpost.com","leakedzone.com","leakshaven.com","learnospot.com","lebahmovie.com","ledauphine.com","lesboluvin.com","lesfoodies.com","letmejerk2.com","letmejerk3.com","letmejerk4.com","letmejerk5.com","letmejerk6.com","letmejerk7.com","lewdcorner.com","lifehacker.com","ligainsider.de","limetorrents.*","linemarlin.com","link.vipurl.in","linkconfig.com","livenewsof.com","lizardporn.com","login.asda.com","lokhung888.com","lookmovie186.*","ludwig-van.com","lulustream.com","m.liputan6.com","macheforum.com","mactechnews.de","macworld.co.uk","mad4wheels.com","madchensex.com","madmaxworld.tv","mahitimanch.in","mail.yahoo.com","main-spitze.de","maliekrani.com","manga4life.com","mangamovil.net","manganatos.com","mangaraw18.net","mangarawad.fit","mangareader.to","manhuarmtl.com","manhuascan.com","manhwaclub.net","manhwalist.com","manhwaread.com","marketbeat.com","masteranime.tv","mathepower.com","maths101.co.za","matureworld.ws","mcafee-com.com","mega-debrid.eu","megacanais.com","megalinks.info","megamovies.org","megapastes.com","mehr-tanken.de","mejortorrent.*","mercato365.com","meteologix.com","mewingzone.com","milanotoday.it","milanworld.net","milffabrik.com","minecraft.buzz","minorpatch.com","mixmods.com.br","mixrootmod.com","mjsbigblog.com","mkv-pastes.com","mobileporn.cam","mockupcity.com","modapkfile.com","moddedguru.com","modenatoday.it","moderngyan.com","moegirl.org.cn","mommybunch.com","mommysucks.com","momsextube.pro","mortaltech.com","motchill29.com","motherless.com","motogpstream.*","motorgraph.com","motorsport.com","motscroises.fr","movearnpre.com","moviefree2.com","movies2watch.*","moviesapi.club","movieshd.watch","moviesjoy-to.*","moviesjoyhd.to","moviesnation.*","movisubmalay.*","mtsproducoes.*","multiplayer.it","mummumtime.com","musketfire.com","mxpacgroup.com","mycoolmoviez.*","mydesibaba.com","myforecast.com","myglamwish.com","mylifetime.com","mynewsmedia.co","mypornhere.com","myporntape.com","mysexgamer.com","mysexgames.com","myshrinker.com","mytectutor.com","naasongsfree.*","naijauncut.com","nammakalvi.com","naszemiasto.pl","navysports.com","nazarickol.com","nensaysubs.net","neonxcloud.top","neservicee.com","netchimp.co.uk","new.lewd.ninja","newmovierulz.*","newsbreak24.de","newscard24.com","ngontinh24.com","nicheporno.com","nichetechy.com","nikaplayer.com","ninernoise.com","nirjonmela.com","nishankhatri.*","niteshyadav.in","nitro-link.com","nitroflare.com","niuhuskies.com","nodenspace.com","nosteam.com.ro","notunmovie.net","notunmovie.org","novaratoday.it","novel-gate.com","novelaplay.com","novelgames.com","novostrong.com","nowosci.com.pl","nudebabes.sexy","nulledbear.com","nulledteam.com","nullforums.net","nulljungle.com","nurulislam.org","nylondolls.com","ocregister.com","officedepot.fr","oggitreviso.it","okamimiost.com","omegascans.org","onlineatlas.us","onlinekosh.com","onlineporno.cc","onlybabes.site","openstartup.tm","opentunnel.net","oregonlive.com","organismes.org","orgasmlist.com","orgyxxxhub.com","orovillemr.com","osubeavers.com","osuskinner.com","oteknologi.com","ourenseando.es","overhentai.net","palapanews.com","palofw-lab.com","pandamovies.me","pandamovies.pw","pandanote.info","pantieshub.net","panyshort.link","papafoot.click","paradepets.com","paris-tabi.com","paste-drop.com","paylaterin.com","peachytube.com","pelismartv.com","pelismkvhd.com","pelispedia24.*","pelispoptv.com","perfectgirls.*","perfektdamen.*","pervertium.com","perverzija.com","pethelpful.com","petitestef.com","pherotruth.com","phoneswiki.com","picgiraffe.com","picjgfjet.shop","pickleball.com","pictryhab.shop","picturelol.com","pimylifeup.com","pink-sluts.net","pinterpoin.com","pirate4all.com","pirateblue.com","pirateblue.net","pirateblue.org","piratemods.com","pivigames.blog","planetsuzy.org","platinmods.com","play-games.com","playcast.click","player-cdn.com","player.rtl2.de","player.sbnmp.*","playermeow.com","playertv24.com","playhydrax.com","podkontrola.pl","polsatsport.pl","polskatimes.pl","pop-player.com","popno-tour.net","porconocer.com","porn0video.com","pornahegao.xyz","pornasians.pro","pornerbros.com","pornflixhd.com","porngames.club","pornharlot.net","pornhd720p.com","pornincest.net","pornissimo.org","pornktubes.net","pornodavid.com","pornodoido.com","pornofelix.com","pornofisch.com","pornojenny.net","pornoperra.com","pornopics.site","pornoreino.com","pornotommy.com","pornotrack.net","pornozebra.com","pornrabbit.com","pornrewind.com","pornsocket.com","porntrex.video","porntube15.com","porntubegf.com","pornvideoq.com","pornvintage.tv","portaldoaz.org","portalyaoi.com","poscitechs.lol","powerover.site","premierftp.com","prepostseo.com","pressemedie.dk","primagames.com","primemovies.pl","primevid.click","primevideo.com","proapkdown.com","pruefernavi.de","purediablo.com","purepeople.com","pussyspace.com","pussyspace.net","pussystate.com","put-locker.com","putingfilm.com","queerdiary.com","querofilmehd.*","questloops.com","quotesopia.com","rabbitsfun.com","radiotimes.com","radiotunes.com","rahim-soft.com","ramblinfan.com","rankersadda.in","rapid-cloud.co","ravenscans.com","rbxscripts.net","realbbwsex.com","realgfporn.com","realmoasis.com","realmomsex.com","realsimple.com","record-bee.com","recordbate.com","redecanaistv.*","redfaucet.site","rednowtube.com","redpornnow.com","redtubemov.com","reggiotoday.it","reisefrage.net","resortcams.com","revealname.com","reviersport.de","reviewrate.net","revivelink.com","richtoscan.com","riminitoday.it","ringelnatz.net","ripplehub.site","rlxtech24h.com","rmacsports.org","roadtrippin.fr","robbreport.com","rokuhentai.com","rollrivers.com","rollstroll.com","romaniasoft.ro","romhustler.org","royaledudes.io","rpmplay.online","rubyvidhub.com","rugbystreams.*","ruinmyweek.com","russland.jetzt","rusteensex.com","ruyashoujo.com","safefileku.com","safemodapk.com","samaysawara.in","sanfoundry.com","saratogian.com","sat.technology","sattaguess.com","saveshared.com","savevideo.tube","sciencebe21.in","scoreland.name","scrap-blog.com","screenflash.io","screenrant.com","scriptsomg.com","scriptsrbx.com","scriptzhub.com","section215.com","seeitworks.com","seekplayer.vip","seirsanduk.com","seksualios.com","selfhacked.com","serienstream.*","series2watch.*","seriesonline.*","seriesperu.com","seriesyonkis.*","serijehaha.com","severeporn.com","sex-empire.org","sex-movies.biz","sexcams-24.com","sexgamescc.com","sexgayplus.com","sextubedot.com","sextubefun.com","sextubeset.com","sexvideos.host","sexyaporno.com","sexybabes.club","sexybabesz.com","sexynakeds.com","sgvtribune.com","shahid.mbc.net","sharedwebs.com","shazysport.pro","sheamateur.com","shegotass.info","sheikhmovies.*","shesfreaky.com","shinobijawi.id","shooshtime.com","shop123.com.tw","short-url.link","shorterall.com","shrinkearn.com","shueisharaw.tv","shupirates.com","sieutamphim.me","siliconera.com","singjupost.com","sitarchive.com","sitemini.io.vn","siusalukis.com","skat-karten.de","slickdeals.net","slidesaver.app","slideshare.net","smartinhome.pl","smarttrend.xyz","smiechawatv.pl","snhupenmen.com","solidfiles.com","soranews24.com","soundboards.gg","spaziogames.it","speedostream.*","speisekarte.de","spiele.bild.de","spieletipps.de","spiritword.net","spoilerplus.tv","sporteurope.tv","sportsdark.com","sportsonline.*","sportsurge.net","spy-x-family.*","stadelahly.net","stahnivideo.cz","standard.co.uk","stardewids.com","starzunion.com","stbemuiptv.com","steamverde.net","stireazilei.eu","storiesig.info","storyblack.com","stownrusis.com","stream2watch.*","streamdesi.com","streamecho.top","streamlord.com","streamruby.com","stripehype.com","studydhaba.com","subtitleone.cc","subtorrents1.*","super-games.cz","superanimes.in","suvvehicle.com","svetserialu.io","svetserialu.to","swatchseries.*","swordalada.org","tainhanhvn.com","talkceltic.net","talkjarvis.com","tamilnaadi.com","tamilprint29.*","tamilprint30.*","tamilprint31.*","tamilprinthd.*","taradinhos.com","tarnkappe.info","taschenhirn.de","tech-blogs.com","tech-story.net","techhelpbd.com","techiestalk.in","techkeshri.com","techmyntra.net","techperiod.com","techsignin.com","techsslash.com","tecnoaldia.net","tecnobillo.com","tecnoscann.com","tecnoyfoto.com","teenager365.to","teenextrem.com","teenhubxxx.com","teensexass.com","tekkenmods.com","telemagazyn.pl","telesrbija.com","temp.modpro.co","tennisactu.net","testserver.pro","textograto.com","textovisia.com","texturecan.com","theargus.co.uk","theavtimes.com","thefantazy.com","theflixertv.to","thehesgoal.com","themeslide.com","thenetnaija.co","thepiratebay.*","theporngod.com","therichest.com","thesextube.net","thetakeout.com","thethothub.com","thetimes.co.uk","thevideome.com","thewambugu.com","thotchicks.com","titsintops.com","tojimangas.com","tomshardware.*","topcartoons.tv","topsporter.net","topwebgirls.eu","torinotoday.it","tormalayalam.*","torontosun.com","torovalley.net","torrentmac.net","totalsportek.*","tournguide.com","tous-sports.ru","towerofgod.top","toyokeizai.net","tpornstars.com","trafficnews.jp","trancehost.com","trannyline.com","trashbytes.net","traumporno.com","travelhost.com","treehugger.com","trendflatt.com","trentonian.com","trentotoday.it","tribunnews.com","tronxminer.com","truckscout24.*","tuberzporn.com","tubesafari.com","tubexxxone.com","tukangsapu.net","turbocloud.xyz","turkish123.com","tv-films.co.uk","tv.youtube.com","tvspielfilm.de","twincities.com","u123movies.com","ucfknights.com","uciteljica.net","uclabruins.com","ufreegames.com","uiuxsource.com","uktvplay.co.uk","unblocked.name","unblocksite.pw","uncpbraves.com","uncwsports.com","unlvrebels.com","uoflsports.com","uploadbank.com","uploadking.net","uploadmall.com","uploadraja.com","upnewsinfo.com","uptostream.com","urlbluemedia.*","urldecoder.org","usctrojans.com","usdtoreros.com","usersdrive.com","utepminers.com","uyduportal.net","v2movies.click","vavada5com.com","vbox7-mp3.info","vedamdigi.tech","vegamovies4u.*","vegamovvies.to","veo-hentai.com","vestimage.site","video-seed.xyz","video1tube.com","videogamer.com","videolyrics.in","videos1002.com","videoseyred.in","videosgays.net","vidguardto.xyz","vidhidepre.com","vidhidevip.com","vidstreams.net","view.ceros.com","viewmature.com","vikistream.com","viralpedia.pro","visortecno.com","vmorecloud.com","voiceloves.com","voipreview.org","voltupload.com","voyeurblog.net","vulgarmilf.com","vviruslove.com","wantmature.com","warefree01.com","watch-series.*","watchasians.cc","watchomovies.*","watchpornx.com","watchseries1.*","watchseries9.*","wcoanimedub.tv","wcoanimesub.tv","wcoforever.net","webseries.club","weihnachten.me","wenxuecity.com","westmanga.info","wetteronline.*","whatfontis.com","whatismyip.com","whats-new.cyou","whatshowto.com","whodatdish.com","whoisnovel.com","wiacsports.com","wifi4games.com","willyweather.*","windbreaker.me","wizhdsports.fi","wkutickets.com","wmubroncos.com","womennaked.net","wordpredia.com","world4ufree1.*","worldofbin.com","worthcrete.com","wow-mature.com","wowxxxtube.com","wspolczesna.pl","wsucougars.com","www-y2mate.com","www.amazon.com","www.lenovo.com","www.reddit.com","www.tiktok.com","x2download.com","xanimeporn.com","xclusivejams.*","xdld.pages.dev","xerifetech.com","xfrenchies.com","xhofficial.com","xhomealone.com","xhwebsite5.com","xiaomi-miui.gr","xmegadrive.com","xnxxporn.video","xxx-videos.org","xxxbfvideo.net","xxxblowjob.pro","xxxdessert.com","xxxextreme.org","xxxtubedot.com","xxxtubezoo.com","xxxvideohd.net","xxxxselfie.com","xxxymovies.com","xxxyoungtv.com","yabaisub.cloud","yakisurume.com","yelitzonpc.com","yomucomics.com","yottachess.com","youngbelle.net","youporngay.com","youtubetomp3.*","yoututosjeff.*","yuki0918kw.com","yumstories.com","yunakhaber.com","zazzybabes.com","zertalious.xyz","zippyshare.day","zona-leros.com","zonebourse.com","zooredtube.com","10hitmovies.com","123movies-org.*","123moviesfree.*","123moviesfun.is","18-teen-sex.com","18asiantube.com","18porncomic.com","18teen-tube.com","1direct-cloud.*","1vid1shar.space","3xamatorszex.hu","4allprograms.me","5masterzzz.site","6indianporn.com","admediaflex.com","adminreboot.com","adrianoluis.net","adrinolinks.com","advicefunda.com","aeroxplorer.com","aflizmovies.com","agrarwetter.net","ai.hubtoday.app","aitoolsfree.org","alanyapower.com","aliezstream.pro","allclassic.porn","alldeepfake.ink","alldownplay.xyz","allotech-dz.com","allpussynow.com","alltechnerd.com","allucanheat.com","amazon-love.com","amritadrino.com","anallievent.com","androidapks.biz","androidsite.net","androjungle.com","anime-sanka.com","anime7.download","animedao.com.ru","animenew.com.br","animesexbar.com","animesultra.net","animexxxsex.com","antenasports.ru","aoashimanga.com","apfelpatient.de","apkmagic.com.ar","app.blubank.com","arabshentai.com","arcadepunks.com","archivebate.com","archiwumalle.pl","argio-logic.net","asia.5ivttv.vip","asiangaysex.net","asianhdplay.net","askcerebrum.com","astrumscans.xyz","atemporal.cloud","atleticalive.it","atresplayer.com","au-di-tions.com","auto-service.de","autoindustry.ro","automat.systems","automothink.com","avoiderrors.com","awdescargas.com","azcardinals.com","babesaround.com","babesinporn.com","babesxworld.com","badgehungry.com","bangpremier.com","baylorbears.com","bdsmkingdom.xyz","bdsmporntub.com","bdsmwaytube.com","beammeup.com.au","bedavahesap.org","beingmelody.com","bellezashot.com","bengalisite.com","bengalxpress.in","bentasker.co.uk","best-shopme.com","best18teens.com","bestialporn.com","bestjavporn.com","beurettekeh.com","bgmateriali.com","bgmi32bitapk.in","bgsufalcons.com","bibliopanda.com","big12sports.com","bigboobs.com.es","bigtitslust.com","bike-urious.com","bintangplus.com","biologianet.com","blackavelic.com","blackpornhq.com","blacksexmix.com","blogenginee.com","blogpascher.com","blowxxxtube.com","bluebuddies.com","bluedrake42.com","bluemanhoop.com","bluemediafile.*","bluemedialink.*","bluemediaurls.*","bokepsin.in.net","bolly4umovies.*","bollydrive.rest","boobs-mania.com","boobsforfun.com","bookpraiser.com","boosterx.stream","boxingstream.me","boxingvideo.org","boyfriendtv.com","braziliannr.com","bresciatoday.it","brieffreunde.de","brother-usa.com","buffsports.io>>","buffstreamz.com","buickforums.com","bulbagarden.net","bunkr-albums.io","burningseries.*","buzzheavier.com","caminteresse.fr","camwhoreshd.com","camwhorespy.com","camwhorez.video","captionpost.com","carbonite.co.za","casutalaurei.ro","cataniatoday.it","catchthrust.net","cempakajaya.com","cerberusapp.com","chatropolis.com","cheatglobal.com","check-imei.info","cheese-cake.net","cherrynudes.com","chromeready.com","cieonline.co.uk","cinemakottaga.*","cineplus123.org","citibank.com.sg","ciudadgamer.com","claimclicks.com","classicoder.com","classifarms.com","cloud9obits.com","cloudnestra.com","code-source.net","codeitworld.com","codemystery.com","codeproject.com","coloringpage.eu","comicsporno.xxx","comoinstalar.me","compucalitv.com","computerbild.de","consoleroms.com","coromon.wiki.gg","cosplaynsfw.xyz","cpomagazine.com","cracking-dz.com","crackthemes.com","crazyashwin.com","crazydeals.live","creditsgoal.com","crunchyroll.com","crunchytech.net","cryptoearns.com","cta-fansite.com","cubbiescrib.com","cumshotlist.com","cutiecomics.com","cyberlynews.com","cybertechng.com","cyclingnews.com","cycraracing.com","daemonanime.net","daily-times.com","dailyangels.com","dailybreeze.com","dailycaller.com","dailycamera.com","dailyecho.co.uk","dailyknicks.com","dailymail.co.uk","dailymotion.com","dailypost.co.uk","dailystar.co.uk","dark-gaming.com","dawindycity.com","db-creation.net","dbupatriots.com","dbupatriots.org","deathonnews.com","decomaniacos.es","definitions.net","desbloqueador.*","descargas2020.*","desirenovel.com","desixxxtube.org","detikbangka.com","deutschsex.mobi","devopslanka.com","dhankasamaj.com","digiztechno.com","diminimalis.com","direct-cloud.me","dirtybadger.com","discoveryplus.*","diversanews.com","dlouha-videa.cz","dobleaccion.xyz","docs.google.com","dollarindex.org","domainwheel.com","donnaglamour.it","donnerwetter.de","dopomininfo.com","dota2freaks.com","dotadostube.com","downphanmem.com","drake-scans.com","drakerelays.org","drama-online.tv","dramanice.video","dreamcheeky.com","drinksmixer.com","driveplayer.net","droidmirror.com","dtbps3games.com","duplex-full.lol","eaglesnovel.com","easylinkref.com","ebaticalfel.com","editorsadda.com","edmontonsun.com","edumailfree.com","eksporimpor.com","elektrikmen.com","elpasotimes.com","elperiodico.com","embed.acast.com","embed.meomeo.pw","embedcanais.com","embedplayer.xyz","embedsports.top","embedstreams.me","emperorscan.com","empire-stream.*","engstreams.shop","enryucomics.com","erotikclub35.pw","esportsmonk.com","esportsnext.com","exactpay.online","exam-results.in","explorecams.com","explorosity.net","exporntoons.net","exposestrat.com","extratorrents.*","fabioambrosi.it","fapfapgames.com","farmeramania.de","faselhd-watch.*","fastcompany.com","faucetbravo.fun","fcportables.com","fellowsfilm.com","femdomworld.com","femjoybabes.com","feral-heart.com","fidlarmusic.com","file-upload.net","file-upload.org","file.gocmod.com","filecrate.store","filehost9.com>>","filespayout.com","filmesonlinex.*","filmoviplex.com","filmy4wap.co.in","filmyzilla5.com","finalnews24.com","financebolo.com","financemonk.net","financewada.com","financeyogi.net","finanzfrage.net","findnewjobz.com","fingerprint.com","firmenwissen.de","fitnesstipz.com","fiveyardlab.com","fizzlefacts.com","fizzlefakten.de","flashsports.org","flordeloto.site","flyanimes.cloud","flygbussarna.se","flywareagle.com","folgenporno.com","foodandwine.com","footyhunter.lol","forex-yours.com","foxseotools.com","freebitcoin.win","freebnbcoin.com","freecardano.com","freecourse.tech","freecricket.net","freegames44.com","freemockups.org","freeomovie.info","freepornjpg.com","freepornsex.net","freethemesy.com","freevpshere.com","freewebcart.com","french-stream.*","fsportshd.xyz>>","ftsefutures.org","fuckedporno.com","fullxxxporn.net","fztvseries.live","g-streaming.com","gadgetspidy.com","gadzetomania.pl","gamecopyworld.*","gameplayneo.com","gamersglobal.de","games.macon.com","games.word.tips","gamesaktuell.de","gamestorrents.*","gaminginfos.com","gamingvital.com","gartendialog.de","gayboystube.top","gaypornhdfree.*","gaypornlove.net","gaypornwave.com","gayvidsclub.com","gazetaprawna.pl","geiriadur.ac.uk","geissblog.koeln","gendatabase.com","georgiadogs.com","germanvibes.org","gesund-vital.de","getexploits.com","gewinnspiele.tv","gfx-station.com","girlssexxxx.com","givemeaporn.com","givemesport.com","glavmatures.com","globaldjmix.com","go.babylinks.in","gocreighton.com","goexplorers.com","gofetishsex.com","gofile.download","gogoanime.co.in","goislanders.com","gokushiteki.com","golderotica.com","golfchannel.com","gomacsports.com","gomarquette.com","gopsusports.com","goxxxvideos.com","goyoungporn.com","gradehgplus.com","grandmatube.pro","grannyfucko.com","grasshopper.com","greattopten.com","grootnovels.com","gsmfirmware.net","gsmfreezone.com","gsmmessages.com","gut-erklaert.de","hacksnation.com","halohangout.com","handypornos.net","hanimesubth.com","hardcoreluv.com","hardwareluxx.de","hardxxxmoms.com","harshfaucet.com","hd-analporn.com","hd-easyporn.com","hdjavonline.com","hds-streaming.*","healthfatal.com","heavyfetish.com","heidelberg24.de","helicomicro.com","hentai-moon.com","hentai-senpai.*","hentai2read.com","hentaiarena.com","hentaibatch.com","hentaibooty.com","hentaicloud.com","hentaicovid.org","hentaifreak.org","hentaigames.app","hentaihaven.com","hentaihaven.red","hentaihaven.vip","hentaihaven.xxx","hentaiporno.xxx","hentaipulse.com","hentaitube1.lol","heroine-xxx.com","hesgoal-live.io","hiddencamhd.com","hindinews360.in","hokiesports.com","hollaforums.com","hollymoviehd.cc","hollywoodpq.com","hookupnovel.com","hostserverz.com","hot-cartoon.com","hotgameplus.com","hotmediahub.com","hotpornfile.org","hotsexstory.xyz","hotstunners.com","hotxxxpussy.com","hqxxxmovies.com","hscprojects.com","hypicmodapk.org","iban-rechner.de","ibcomputing.com","ibeconomist.com","ideal-teens.com","ikramlar.online","ilbassoadige.it","ilgazzettino.it","illicoporno.com","ilmessaggero.it","ilsole24ore.com","imagelovers.com","imgqnnnebrf.sbs","incgrepacks.com","indiakablog.com","infrafandub.com","inside-handy.de","instabiosai.com","insuredhome.org","interracial.com","investcrust.com","inyatrust.co.in","iptvjournal.com","italianoxxx.com","itsonsitetv.com","iwantmature.com","januflix.expert","japangaysex.com","japansporno.com","japanxxxass.com","jastrzabpost.pl","javcensored.net","javenglish.cc>>","javindosub.site","javmoviexxx.com","javpornfull.com","javraveclub.com","javteentube.com","javtrailers.com","jaysjournal.com","jetztspielen.de","jnvharidwar.org","jobslampung.net","johntryopen.com","jokerscores.com","just-upload.com","kabarportal.com","karaoketexty.cz","kasvekuvvet.net","katmoviehd4.com","kattannonser.se","kawarthanow.com","keezmovies.surf","ketoconnect.net","ketubanjiwa.com","kickass-anime.*","kickassanime.ch","kiddyearner.com","kingsleynyc.com","kisshentaiz.com","kitabmarkaz.xyz","kittycatcam.com","kodewebsite.com","komikdewasa.art","komorkomania.pl","krakenfiles.com","kreiszeitung.de","krktcountry.com","kstorymedia.com","kurierverlag.de","kyoto-kanko.net","la123movies.org","langitmovie.com","laptechinfo.com","latinluchas.com","lavozdigital.es","ldoceonline.com","learnedclub.com","lecrabeinfo.net","legionscans.com","lendrive.web.id","lesbiansex.best","levante-emv.com","libertycity.net","librasol.com.br","liga3-online.de","lightsnovel.com","link.3dmili.com","link.asiaon.top","link.cgtips.org","link.codevn.net","linksheild.site","linkss.rcccn.in","linkvertise.com","linux-talks.com","live.arynews.tv","livescience.com","livesport24.net","livestreames.us","livestreamtv.pk","livexscores.com","livingathome.de","livornotoday.it","lombardiave.com","lookmoviess.com","looptorrent.org","lotusgamehd.xyz","lovelynudez.com","lovingsiren.com","luchaonline.com","lucrebem.com.br","lukesitturn.com","lulustream.live","lustesthd.cloud","lycee-maroc.com","macombdaily.com","macrotrends.net","magdownload.org","maisonbrico.com","mangahentai.xyz","mangahere.today","mangakakalot.gg","mangaonline.fun","mangaraw1001.cc","mangarawjp.asia","mangarussia.com","manhuarmmtl.com","manhwahentai.me","manoramamax.com","mantrazscan.com","marie-claire.es","marimo-info.net","marketmovers.it","maskinbladet.dk","mastakongo.info","mathsstudio.com","mathstutor.life","maxcheaters.com","maxjizztube.com","maxstream.video","maxtubeporn.net","me-encantas.com","medeberiya.site","medeberiya1.com","medeberiyaa.com","medeberiyas.com","medeberiyax.com","mediacast.click","mega4upload.com","mega4upload.net","mejortorrento.*","mejortorrents.*","mejortorrentt.*","memoriadatv.com","mensfitness.com","mensjournal.com","mentalfloss.com","mercerbears.com","mercurynews.com","messinatoday.it","metal-hammer.de","milliyet.com.tr","miniminiplus.pl","minutolivre.com","mirrorpoi.my.id","mixrootmods.com","mmsmasala27.com","mobility.com.ng","mockuphunts.com","modporntube.com","moflix-stream.*","molbiotools.com","mommy-pussy.com","momtubeporn.xxx","motherporno.com","mov18plus.cloud","moviemaniak.com","movierulzfree.*","movierulzlink.*","movies2watch.tv","moviescounter.*","moviesonline.fm","moviessources.*","moviessquad.com","movieuniverse.*","mp3fromyou.tube","mrdeepfakes.com","mscdroidlabs.es","msdos-games.com","msonglyrics.com","msuspartans.com","muchohentai.com","multifaucet.org","musiclutter.xyz","musikexpress.de","myanimelist.net","mybestxtube.com","mydesiboobs.com","myfreeblack.com","mysexybabes.com","mywatchseries.*","myyoungbabe.com","mzansinudes.com","naijanowell.com","naijaray.com.ng","nakedbabes.club","nangiphotos.com","nativesurge.net","nativesurge.top","naughtyza.co.za","nbareplayhd.com","nbcolympics.com","necksdesign.com","needgayporn.com","nekopoicare.*>>","nemzetisport.hu","netflixlife.com","networkhint.com","news-herald.com","news-leader.com","newstechone.com","newyorkjets.com","nflspinzone.com","nicexxxtube.com","nissanzclub.com","nizarstream.com","noindexscan.com","noithatmyphu.vn","nokiahacking.pl","nosteamgames.ro","notebookcheck.*","notesformsc.org","noteshacker.com","notunmovie.link","novelssites.com","nsbtmemoir.site","nsfwmonster.com","nsfwyoutube.com","nswdownload.com","nu6i-bg-net.com","nudeslegion.com","nudismteens.com","nukedpacks.site","nullscripts.net","nursexfilme.com","nyaatorrent.com","oceanofmovies.*","okiemrolnika.pl","olamovies.store","olympustaff.com","omgexploits.com","online-smss.com","onlinekosten.de","open3dmodel.com","openculture.com","openloading.com","order-order.com","orgasmatrix.com","oromedicine.com","otokukensaku.jp","otomi-games.com","ourcoincash.xyz","oyundunyasi.net","ozulscansen.com","pacersports.com","pageflutter.com","pakkotoisto.com","palermotoday.it","panda-novel.com","pandamovies.org","pandasnovel.com","paperzonevn.com","paste4free.site","pawastreams.org","pawastreams.pro","pcgameszone.com","peliculas8k.com","peliculasmx.net","pelisflix20.*>>","pelismarthd.com","pelisxporno.net","pendekarsubs.us","pepperlive.info","perezhilton.com","perfektdamen.co","persianhive.com","perugiatoday.it","pewresearch.org","pflege-info.net","phonerotica.com","phongroblox.com","pianetalecce.it","pics4upload.com","picxnkjkhdf.sbs","pimpandhost.com","pinoyalbums.com","pinoyrecipe.net","piratehaven.xyz","pisshamster.com","pixdfdjkkr.shop","pixkfjtrkf.shop","planetfools.com","platinporno.com","play.hbomax.com","player.msmini.*","plugincrack.com","pocket-lint.com","popcornstream.*","popdaily.com.tw","porhubvideo.com","porn-monkey.com","pornexpanse.com","pornfactors.com","porngameshd.com","pornhegemon.com","pornhoarder.net","porninblack.com","porno-porno.net","porno-rolik.com","pornohammer.com","pornohirsch.net","pornoklinge.com","pornomanoir.com","pornrusskoe.com","portable4pc.com","powergam.online","premiumporn.org","privatemoviez.*","projectfreetv.*","promimedien.com","proxydocker.com","punishworld.com","purelyceleb.com","pussy3dporn.com","pussyhothub.com","qatarstreams.me","quiltfusion.com","quotesshine.com","r1.richtoon.top","rackusreads.com","radionatale.com","radionylive.com","radiorockon.com","railwebcams.net","rajssoid.online","ramdomlives.com","rangerboard.com","ravennatoday.it","rctechsworld.in","readbitcoin.org","readhunters.xyz","readingpage.fun","redpornblog.com","remodelista.com","rennrad-news.de","renoconcrete.ca","rentbyowner.com","reportera.co.kr","restegourmet.de","retroporn.world","risingapple.com","ritacandida.com","robot-forum.com","rojadirectatv.*","rollingstone.de","romaierioggi.it","romfirmware.com","root-nation.com","route-fifty.com","rule34vault.com","runnersworld.de","rushuploads.com","ryansharich.com","saabcentral.com","salernotoday.it","samapkstore.com","sampledrive.org","samuraiscan.org","santhoshrcf.com","satoshi-win.xyz","savealoonie.com","scan-hentai.net","scatnetwork.com","schwaebische.de","sdmoviespoint.*","sekaikomik.live","serienstream.to","seriesmetro.net","seriesonline.sx","seriouseats.com","serverbd247.com","serviceemmc.com","setfucktube.com","sex-torrent.net","sexanimesex.com","sexoverdose.com","sexseeimage.com","sexwebvideo.com","sexxxanimal.com","sexy-parade.com","sexyerotica.net","seznamzpravy.cz","sfmcompile.club","shadagetech.com","shadowrangers.*","sharegdrive.com","sharinghubs.com","shemalegape.net","shomareh-yab.ir","shopkensaku.com","short-jambo.ink","showcamrips.com","showrovblog.com","shrugemojis.com","shugraithou.com","siamfishing.com","sieutamphim.org","singingdalong.*","siriusfiles.com","sitetorrent.com","sivackidrum.net","slapthesign.com","slateforums.com","sleazedepot.com","sleazyneasy.com","smartcharts.net","sms-anonyme.net","sms-receive.net","smsonline.cloud","smumustangs.com","soconsports.com","software-on.com","softwaresde.com","solarchaine.com","sommerporno.com","sondriotoday.it","souq-design.com","sourceforge.net","spanishdict.com","spardhanews.com","sport890.com.uy","sports-stream.*","sportsblend.net","sportsonline.si","sportsonline.so","sportsplays.com","sportsseoul.com","sportstiger.com","sportstreamtv.*","starstreams.pro","start-to-run.be","stbemuiptvn.com","sterkinekor.com","stream.bunkr.ru","streamnoads.com","stronakobiet.pl","studybullet.com","subtitlecat.com","sueddeutsche.de","sulasokvids.net","sullacollina.it","sumirekeiba.com","suneelkevat.com","superdeporte.es","superembeds.com","supermarches.ca","supermovies.org","svethardware.cz","swift4claim.com","syracusefan.com","tabooanime.club","tagesspiegel.de","tamilanzone.com","tamilultra.team","tapeantiads.com","tapeblocker.com","taycanforum.com","techacrobat.com","techadvisor.com","techastuces.com","techedubyte.com","techinferno.com","technichero.com","technorozen.com","techoreview.com","techprakash.com","techsbucket.com","techyhigher.com","techymedies.com","tedenglish.site","teen-hd-sex.com","teenfucksex.com","teenpornjpg.com","teensextube.xxx","teenxxxporn.pro","telegraph.co.uk","telepisodes.org","temporeale.info","tenbaiquest.com","tenies-online.*","tennisonline.me","tennisstreams.*","teracourses.com","texassports.com","textreverse.com","thaiairways.com","the-mystery.org","the2seasons.com","theappstore.org","thebarchive.com","thebigblogs.com","theclashify.com","thedilyblog.com","thegrowthop.com","thejetpress.com","thejoblives.com","themoviesflix.*","theprovince.com","thereporter.com","thestreameast.*","thetoneking.com","theusaposts.com","thewebflash.com","theyarehuge.com","thingiverse.com","thingstomen.com","thisisrussia.io","thueringen24.de","thumpertalk.com","ticketmaster.sg","tickhosting.com","ticonsiglio.com","tieba.baidu.com","tienganhedu.com","tires.costco.ca","today-obits.com","todopolicia.com","toeflgratis.com","tokuzilla.net>>","tokyomotion.com","tokyomotion.net","tophostdeal.com","topnewsshow.com","topperpoint.com","topstarnews.net","torascripts.org","tornadomovies.*","torrentgalaxy.*","torrentgame.org","torrentstatus.*","torresette.news","tradingview.com","transfermarkt.*","travelnoire.com","trendohunts.com","trevisotoday.it","triesteprima.it","true-gaming.net","trytutorial.com","tubegaytube.com","tubepornnow.com","tudongnghia.com","tuktukcinma.com","turbovidhls.com","turkeymenus.com","tusachmanga.com","tvanouvelles.ca","tvsportslive.fr","twistedporn.com","twitchnosub.com","tyler-brown.com","u6lyxl0w.skin>>","ukathletics.com","ukaudiomart.com","ultramovies.org","undeniable.info","underhentai.net","unipanthers.com","updateroj24.com","uploadbeast.com","uploadcloud.pro","usaudiomart.com","user.guancha.cn","vectogravic.com","veekyforums.com","vegamovies3.org","veneziatoday.it","verpelis.gratis","verywellfit.com","vfxdownload.net","vicenzatoday.it","viciante.com.br","vidcloudpng.com","video.genyt.net","videodidixx.com","videosputas.xxx","vidsrc-embed.ru","vik1ngfile.site","ville-ideale.fr","viralharami.com","viralxvideos.es","voyageforum.com","vtplayer.online","wantedbabes.com","warmteensex.com","watch-my-gf.com","watch.sling.com","watchf1full.com","watchfreexxx.pw","watchhentai.net","watchmovieshd.*","watchporn4k.com","watchpornfree.*","watchseries8.to","watchserieshd.*","watchtvseries.*","watchxxxfree.pw","wealthcatal.com","webmatrices.com","webtoonscan.com","wegotcookies.co","weltfussball.at","wemakesites.net","wheelofgold.com","wholenotism.com","wholevideos.com","wieistmeineip.*","wikijankari.com","wikipooster.com","wikisharing.com","windowslite.net","windsorstar.com","winnipegsun.com","witcherhour.com","womenshealth.de","world-iptv.club","worldgyan18.com","worldofiptv.com","worldsports.*>>","wowpornlist.xyz","wowyoungsex.com","wpgdadatong.com","wristreview.com","writeprofit.org","wvv-fmovies.com","www.youtube.com","xfuckonline.com","xhardhempus.net","xianzhenyuan.cn","xiaomitools.com","xkeezmovies.com","xmoviesforyou.*","xn--31byd1i.net","xnudevideos.com","xnxxhamster.net","xterraforum.com","xxxindianporn.*","xxxparodyhd.net","xxxpornmilf.com","xxxtubegain.com","xxxtubenote.com","xxxtubepass.com","xxxwebdlxxx.top","yanksgoyard.com","yazilidayim.net","yesmovies123.me","yeutienganh.com","yogablogfit.com","yomoviesnow.com","yorkpress.co.uk","youlikeboys.com","youmedemblik.nl","young-pussy.com","youranshare.com","yourporngod.com","youtubekids.com","yrtourguide.com","ytconverter.app","yuramanga.my.id","zeroradio.co.uk","zonavideosx.com","zone-annuaire.*","zoominar.online","007stockchat.com","123movies-free.*","18-teen-porn.com","18-teen-tube.com","18adultgames.com","18comic-gquu.vip","1movielinkbd.com","1movierulzhd.pro","24pornvideos.com","2kspecialist.net","4fingermusic.com","8-ball-magic.com","9now.nine.com.au","about-drinks.com","activevoyeur.com","activistpost.com","actresstoday.com","adblockstrtape.*","adblockstrtech.*","adult-empire.com","adultporn.com.es","advertafrica.net","agedtubeporn.com","aghasolution.com","ajaxshowtime.com","ajkalerbarta.com","alleveilingen.be","alleveilingen.nl","alliptvlinks.com","allporncomic.com","alphagames4u.com","alphapolis.co.jp","alphasource.site","altselection.com","anakteknik.co.id","analsexstars.com","analxxxvideo.com","androidadult.com","androidfacil.org","androidgreek.com","androidspill.com","anime-odcinki.pl","animesexclip.com","animetwixtor.com","animixstream.com","antennasports.ru","aopathletics.org","apkandroidhub.in","app.simracing.gp","applediagram.com","aquariumgays.com","arezzonotizie.it","articlesmania.me","asianmassage.xyz","asianpornjav.com","assettoworld.com","asyaanimeleri.pw","athlonsports.com","atlantisscan.com","auburntigers.com","audiofanzine.com","audycje.tokfm.pl","autotrader.co.uk","avellinotoday.it","azamericasat.net","azby.fmworld.net","baby-vornamen.de","backfirstwo.site","backyardboss.net","backyardpapa.com","bangyourwife.com","barrier-free.net","base64decode.org","bcuathletics.com","beaddiagrams.com","beritabangka.com","berlin-teltow.de","bestasiansex.pro","bestblackgay.com","bestcash2020.com","bestgamehack.top","bestgrannies.com","besthdmovies.com","bestpornflix.com","bestsextoons.com","beta.plus.rtl.de","biblegateway.com","bigbuttshub2.top","bikeportland.org","birdswatcher.com","bisceglielive.it","bitchesgirls.com","blackandteal.com","blog.livedoor.jp","blowjobfucks.com","bloxinformer.com","bloxyscripts.com","bluemediafiles.*","bluerabbitrx.com","bmw-scooters.com","boardingarea.com","boerse-online.de","bollywoodfilma.*","bondagevalley.cc","booksbybunny.com","boolwowgirls.com","bootstrample.com","bostonherald.com","boysxclusive.com","brandbrief.co.kr","bravoerotica.com","bravoerotica.net","breatheheavy.com","breedingmoms.com","buffalobills.com","buffalowdown.com","businesstrend.jp","butlersports.com","butterpolish.com","bysedikamoum.com","bysesayeveum.com","call2friends.com","caminspector.net","campusfrance.org","camvideoshub.com","camwhoresbay.com","caneswarning.com","cartoonporno.xxx","catmovie.website","ccnworldtech.com","celtadigital.com","cervezaporno.com","championdrive.co","charexempire.com","chattanoogan.com","cheatography.com","chelsea24news.pl","chicagobears.com","chieflyoffer.com","choiceofmods.com","chubbyelders.com","cizzyscripts.com","claimsatoshi.xyz","clever-tanken.de","clickforhire.com","clickndownload.*","clipconverter.cc","cloudgallery.net","cmumavericks.com","coin-profits.xyz","collegehdsex.com","colliersnews.com","coloredmanga.com","comeletspray.com","cometogliere.com","comicspornos.com","comicspornow.com","comicsvalley.com","computerpedia.in","convert2mp3.club","convertinmp4.com","courseleader.net","cr7-soccer.store","cracksports.me>>","criptologico.com","cryptoclicks.net","cryptofactss.com","cryptofaucet.xyz","cryptokinews.com","cryptomonitor.in","cybercityhelp.in","cyberstumble.com","cydiasources.net","dailyboulder.com","dailypudding.com","dailytips247.com","dailyuploads.net","dakotaforums.com","darknessporn.com","darkwanderer.net","dasgelbeblatt.de","dataunlocker.com","dattebayo-br.com","davewigstone.com","dayoftheweek.org","daytonflyers.com","ddl-francais.com","deepfakeporn.net","deepswapnude.com","demonicscans.org","designparty.sx>>","desikamababa.com","detroitlions.com","diariodeibiza.es","dirtytubemix.com","discoveryplus.in","djremixganna.com","doanhnghiepvn.vn","dobrapogoda24.pl","dobreprogramy.pl","donghuaworld.com","dorsetecho.co.uk","downloadapk.info","downloadbatch.me","downloadsite.org","downloadsoft.net","dpscomputing.com","dryscalpgone.com","dualshockers.com","duplichecker.com","dvdgayonline.com","earncrypto.co.in","eartheclipse.com","eastbaytimes.com","easymilftube.net","ebook-hunter.org","ecom.wixapps.net","edufileshare.com","einfachschoen.me","eleceedmanhwa.me","eletronicabr.com","elevationmap.net","eliobenedetto.it","embedseek.online","embedstreams.top","empire-anime.com","emulatorsite.com","english101.co.za","erotichunter.com","eslauthority.com","esportstales.com","everysextube.com","ewrc-results.com","exclusivomen.com","fallbrook247.com","familyporner.com","famousnipple.com","fastdownload.top","fattelodasolo.it","fatwhitebutt.com","faucetcrypto.com","faucetcrypto.net","favefreeporn.com","favoyeurtube.net","femmeactuelle.fr","fernsehserien.de","fessesdenfer.com","fetishshrine.com","filespayouts.com","filmestorrent.tv","filmyhitlink.xyz","filmyhitt.com.in","financacerta.com","fineasiansex.com","finofilipino.org","fitnessholic.net","fitnessscenz.com","flatpanelshd.com","footwearnews.com","footymercato.com","footystreams.net","foreverquote.xyz","forexcracked.com","forextrader.site","forgepattern.net","forum-xiaomi.com","foxsports.com.au","freegetcoins.com","freehardcore.com","freehdvideos.xxx","freelitecoin.vip","freemcserver.net","freemomstube.com","freemoviesu4.com","freeporncave.com","freevstplugins.*","freshersgold.com","fullxcinema1.com","fullxxxmovies.me","fumettologica.it","fussballdaten.de","gadgetxplore.com","game-repack.site","gamemodsbase.com","gamers-haven.org","games.boston.com","games.kansas.com","games.modbee.com","games.puzzles.ca","games.sacbee.com","games.sltrib.com","games.usnews.com","gamesrepacks.com","gamingbeasts.com","gamingdeputy.com","gaminglariat.com","ganstamovies.com","gartenlexikon.de","gaydelicious.com","gazetalubuska.pl","gbmwolverine.com","gdrivelatino.net","gdrivemovies.xyz","gemiadamlari.org","genialetricks.de","gentlewasher.com","getdatgadget.com","getdogecoins.com","getworkation.com","gezegenforum.com","ghettopearls.com","ghostsfreaks.com","gidplayer.online","gigemgazette.com","girlschannel.net","globelempire.com","go.discovery.com","go.shortnest.com","goblackbears.com","godstoryinfo.com","goetbutigers.com","gogetadoslinks.*","gomcpanthers.com","gometrostate.com","goodyoungsex.com","gophersports.com","gopornindian.com","greasygaming.com","greenarrowtv.com","gruene-zitate.de","gruporafa.com.br","gsm-solution.com","gtamaxprofit.com","guncelkaynak.com","gutesexfilme.com","hadakanonude.com","handelsblatt.com","happyinshape.com","hard-tubesex.com","hardfacefuck.com","hausbau-forum.de","hayatarehber.com","hd-tube-porn.com","healthylifez.com","hechosfizzle.com","heilpraxisnet.de","helpdeskgeek.com","hentaicomics.pro","hentaiseason.com","hentaistream.com","hentaivideos.net","hotcopper.com.au","hotdreamsxxx.com","hotpornyoung.com","hotpussyhubs.com","houstonpress.com","hqpornstream.com","huskercorner.com","id.condenast.com","idmextension.xyz","ielts-isa.edu.vn","ignoustudhelp.in","ikindlebooks.com","imagereviser.com","imageshimage.com","imagetotext.info","imperiofilmes.co","infinityfree.com","infomatricula.pt","inprogrammer.com","intellischool.id","interviewgig.com","investopedia.com","investorveda.com","isekaibrasil.com","isekaipalace.com","jalshamoviezhd.*","japaneseasmr.com","japanesefuck.com","japanfuck.com.es","javenspanish.com","javfullmovie.com","justblogbaby.com","justswallows.net","kakarotfoot.ru>>","katiescucina.com","kayifamilytv.com","khatrimazafull.*","kingdomfiles.com","kingstreamz.site","kireicosplay.com","kitchennovel.com","kitraskimisi.com","knowyourmeme.com","kodibeginner.com","kokosovoulje.com","komikstation.com","komputerswiat.pl","kshowsubindo.org","kstatesports.com","ksuathletics.com","kurakura21.space","kuttymovies1.com","lakeshowlife.com","lampungkerja.com","larvelfaucet.com","lascelebrite.com","latesthdmovies.*","latinohentai.com","lavanguardia.com","lawyercontact.us","lectormangaa.com","leechpremium.net","legionjuegos.org","lehighsports.com","lesbiantube.club","letmewatchthis.*","lettersolver.com","levelupalone.com","lg-firmwares.com","libramemoria.com","lifesurance.info","lightxxxtube.com","limetorrents.lol","linux-magazin.de","linuxexplain.com","live.vodafone.de","livenewsflix.com","logofootball.net","lookmovie.studio","loudountimes.com","ltpcalculator.in","luminatedata.com","lumpiastudio.com","lustaufsleben.at","lustesthd.makeup","macrocreator.com","magicseaweed.com","mahobeachcam.com","mammaebambini.it","manga-scantrad.*","mangacanblog.com","mangaforfree.com","mangaindo.web.id","markstyleall.com","masstamilans.com","mastaklomods.com","masterplayer.xyz","matshortener.xyz","mature-tube.sexy","maxisciences.com","meconomynews.com","mee-cccdoz45.com","meetdownload.com","megafilmeshd20.*","megajapansex.com","mejortorrents1.*","merlinshoujo.com","meteoetradar.com","milanreports.com","milfxxxpussy.com","milkporntube.com","mlookalporno.com","mockupgratis.com","mockupplanet.com","moto-station.com","mountaineast.org","movielinkhub.xyz","movierulz2free.*","movierulzwatch.*","movieshdwatch.to","movieshubweb.com","moviesnipipay.me","moviesrulzfree.*","moviestowatch.tv","mrproblogger.com","msmorristown.com","msumavericks.com","multimovies.tech","musiker-board.de","my-ford-focus.de","myair.resmed.com","mycivillinks.com","mydownloadtube.*","myfitnesspal.com","mylegalporno.com","mylivestream.pro","mymotherlode.com","myproplugins.com","myradioonline.pl","nakedbbw-sex.com","naruldonghua.com","nationalpost.com","nativesurge.info","nauathletics.com","naughtyblogs.xyz","neatfreeporn.com","neatpornodot.com","netflixporno.net","netizensbuzz.com","newanimeporn.com","newsinlevels.com","newsobserver.com","newstvonline.com","nghetruyenma.net","nguyenvanbao.com","nhentaihaven.org","niftyfutures.org","nintendolife.com","nl.hardware.info","nocsummer.com.br","nonesnanking.com","nontonhentai.net","notebookchat.com","notiziemusica.it","novablogitalia.*","nude-teen-18.com","nudemomshots.com","null-scripts.net","officecoach24.de","ohionowcast.info","older-mature.net","oldgirlsporn.com","onestringlab.com","onlineporn24.com","onlyfanvideo.com","onlygangbang.com","onlygayvideo.com","onlyindianporn.*","open.spotify.com","openloadmovies.*","optimizepics.com","oranhightech.com","orenoraresne.com","oswegolakers.com","otakuanimess.net","overtakefans.com","oxfordmail.co.uk","pagalworld.video","pandaatlanta.com","pandafreegames.*","parentcircle.com","parking-map.info","pdfstandards.net","pedroinnecco.com","penis-bilder.com","personefamose.it","phinphanatic.com","physics101.co.za","pigeonburger.xyz","pinsexygirls.com","play.gamezop.com","play.history.com","player.gayfor.us","player.hdgay.net","player.pop.co.uk","player4me.online","playsexgames.xxx","pleasuregirl.net","plumperstube.com","plumpxxxtube.com","pokeca-chart.com","police.community","ponselharian.com","porn-hd-tube.com","pornclassic.tube","pornclipshub.com","pornforrelax.com","porngayclips.com","pornhub-teen.com","pornobengala.com","pornoborshch.com","pornoteensex.com","pornsex-pics.com","pornstargold.com","pornuploaded.net","pornvideotop.com","pornwatchers.com","pornxxxplace.com","pornxxxxtube.net","portnywebcam.com","post-gazette.com","postermockup.com","powerover.site>>","practicequiz.com","prajwaldesai.com","praveeneditz.com","privatenudes.com","programme-tv.net","programsolve.com","prosiebenmaxx.de","purduesports.com","purposegames.com","puzzles.nola.com","pythonjobshq.com","qrcodemonkey.net","rabbitstream.net","radio-deejay.com","realityblurb.com","realjapansex.com","receptyonline.cz","recordonline.com","redbirdrants.com","rendimentibtp.it","repack-games.com","reportbangla.com","reviewmedium.com","ribbelmonster.de","rimworldbase.com","ringsidenews.com","ripplestream4u.*","rivianforums.com","riwayat-word.com","rocketrevise.com","rollingstone.com","royale-games.com","rule34hentai.net","rv-ecommerce.com","sabishiidesu.com","safehomefarm.com","sainsburys.co.uk","saradahentai.com","sarugbymag.co.za","satoshifaucet.io","savethevideo.com","savingadvice.com","schaken-mods.com","schildempire.com","schoolcheats.net","scoutevforum.com","search.brave.com","seattletimes.com","secretsdujeu.com","semuanyabola.com","sensualgirls.org","serienjunkies.de","serieslandia.com","sesso-escort.com","sexanimetube.com","sexfilmkiste.com","sexflashgame.org","sexhardtubes.com","sexjapantube.com","sexlargetube.com","sexmomvideos.com","sexontheboat.xyz","sexpornasian.com","sextingforum.net","sexybabesart.com","sexyoungtube.com","sharelink-1.site","sheepesports.com","shelovesporn.com","shemalemovies.us","shemalepower.xyz","shemalestube.com","shimauma-log.com","shoot-yalla.live","short.croclix.me","shortenlinks.top","shortylink.store","showbizbites.com","shrinkforearn.in","shrinklinker.com","signupgenius.com","sikkenscolore.it","simpleflying.com","simplyvoyage.com","sitesunblocked.*","skidrowcodex.net","skidrowcrack.com","skintagsgone.com","smallseotools.ai","smart-wohnen.net","smartermuver.com","smashyplayer.top","soccershoes.blog","softdevelopp.com","softwaresite.net","solution-hub.com","soonersports.com","soundpark-club.*","southpark.cc.com","soyoungteens.com","space-faucet.com","spigotunlocked.*","splinternews.com","sportpiacenza.it","sportshub.stream","sportsloverz.xyz","sportstream.live","spotifylists.com","sshconect.com.br","sssinstagram.com","stablerarena.com","stagatvfiles.com","stiflersmoms.com","stileproject.com","stillcurtain.com","stockhideout.com","stopstreamtv.net","storieswatch.com","stream.nflbox.me","stream4free.live","streamblasters.*","streamcenter.xyz","streamextreme.cc","streamingnow.mov","streamingworld.*","streamloverx.com","strefabiznesu.pl","strtapeadblock.*","suamusica.com.br","sukidesuost.info","sunshine-live.de","supremebabes.com","swiftuploads.com","sxmislandcam.com","synoniemboek.com","tamarindoyam.com","tapelovesads.org","taroot-rangi.com","teachmemicro.com","techgeek.digital","techkhulasha.com","technewslive.org","tecnotutoshd.net","teensexvideos.me","telcoinfo.online","telegratuita.com","tempatwisata.pro","text-compare.com","the1security.com","thecozyapron.com","thecustomrom.com","thefappening.pro","thegadgetking.in","thehiddenbay.com","theinventory.com","thejobsmovie.com","thelandryhat.com","thelosmovies.com","thelovenerds.com","thematurexxx.com","thenerdstash.com","thenewsdrill.com","thenewsglobe.net","thenextplanet1.*","theorie-musik.de","thepiratebay.org","thepoorcoder.com","thesportster.com","thesportsupa.com","thesundevils.com","thetrendverse.in","thevikingage.com","thisisfutbol.com","timesnownews.com","timesofindia.com","tires.costco.com","tiroalpaloes.net","titansonline.com","tnstudycorner.in","todays-obits.com","todoandroid.live","tonanmedia.my.id","topvideosgay.com","toramemoblog.com","torrentkitty.one","totallyfuzzy.net","totalsportek.app","toureiffel.paris","towsontigers.com","tptvencore.co.uk","tradersunion.com","travelerdoor.com","trendytalker.com","troyyourlead.com","trucosonline.com","truetrophies.com","truevpnlover.com","tube-teen-18.com","tube.shegods.com","tuotromedico.com","turbogvideos.com","turboplayers.xyz","turtleviplay.xyz","tutorialsaya.com","tweakcentral.net","twobluescans.com","typinggames.zone","uconnhuskies.com","unionpayintl.com","universegunz.net","unrealengine.com","upfiles-urls.com","upgradedhome.com","upstyledaily.com","urlgalleries.net","ustrendynews.com","uvmathletics.com","uwlathletics.com","vancouversun.com","vandaaginside.nl","vegamoviese.blog","veryfreeporn.com","verywellmind.com","vichitrainfo.com","videocdnal24.xyz","videosection.com","vikingf1le.us.to","villettt.kitchen","vinstartheme.com","viralvideotube.*","viralxxxporn.com","vivrebordeaux.fr","vodkapr3mium.com","voiranime.stream","voyeurfrance.net","voyeurxxxsex.com","vpshostplans.com","vrporngalaxy.com","vzrosliedamy.com","watchanime.video","watchfreekav.com","watchfreexxx.net","watchmovierulz.*","watchmovies2.com","wbschemenews.com","wearehunger.site","web.facebook.com","webcamsdolls.com","webcheats.com.br","webdesigndev.com","webdeyazilim.com","webseriessex.com","websitesball.com","werkzeug-news.de","whentostream.com","whitexxxtube.com","wiadomosci.wp.pl","wildpictures.net","willow.arlen.icu","windowsonarm.org","wolfgame-ar.site","womenreality.com","woodmagazine.com","word-grabber.com","workxvacation.jp","worldhistory.org","wrestlinginc.com","wrzesnia.info.pl","wunderground.com","wvuathletics.com","www.amazon.co.jp","www.amazon.co.uk","www.facebook.com","xhamster-art.com","xhamsterporno.mx","xhamsterteen.com","xvideos-full.com","xxxanimefuck.com","xxxlargeporn.com","xxxlesvianas.com","xxxretrofuck.com","xxxteenyporn.com","xxxvideos247.com","yellowbridge.com","yesjavplease.fun","yona-yethu.co.za","youngerporn.mobi","youtubetoany.com","youtubetowav.net","youwatch.monster","youwatchporn.com","ysokuhou.blog.jp","zdravenportal.eu","zecchino-doro.it","ziggogratis.site","ziminvestors.com","ziontutorial.com","zippyshare.cloud","zwergenstadt.com","123moviesonline.*","123strippoker.com","12thmanrising.com","1337x.unblocked.*","1337x.unblockit.*","19-days-manga.com","1movierulzhd.hair","1teentubeporn.com","2japaneseporn.com","acapellas4u.co.uk","acdriftingpro.com","adblockplustape.*","adffdafdsafds.sbs","adrenaline.com.br","alaskananooks.com","allcelebspics.com","alternativeto.net","altyazitube22.lat","amateur-twink.com","amateurfapper.com","amsmotoresllc.com","ancient-origins.*","andhrafriends.com","androidonepro.com","androidpolice.com","animalwebcams.net","anime-torrent.com","animecenterbr.com","animeidhentai.com","animelatinohd.com","animeonline.ninja","animepornfilm.com","animesonlinecc.us","animexxxfilms.com","anonymousemail.me","apostoliclive.com","arabshentai.com>>","arcade.lemonde.fr","armypowerinfo.com","asianfucktube.com","asiansexcilps.com","assignmentdon.com","atalantini.online","autoexpress.co.uk","babyjimaditya.com","badassoftcore.com","badgerofhonor.com","bafoeg-aktuell.de","bandyforbundet.no","bargainbriana.com","bcanotesnepal.com","beargoggleson.com","bebasbokep.online","beritasulteng.com","bestanime-xxx.com","besthdgayporn.com","besthugecocks.com","bestpussypics.net","beyondtheflag.com","bgmiupdate.com.in","bigdickwishes.com","bigtitsxxxsex.com","black-matures.com","blackhatworld.com","bladesalvador.com","blizzboygames.net","blog.linksfire.co","blog.textpage.xyz","blogcreativos.com","blogtruyenmoi.com","bollywoodchamp.in","bostoncommons.net","bracontece.com.br","bradleybraves.com","brazzersbabes.com","brindisireport.it","brokensilenze.net","brookethoughi.com","browncrossing.net","brushednickel.biz","calgaryherald.com","camchickscaps.com","cameronaggies.com","candyteenporn.com","carensureplan.com","catatanonline.com","cavalierstream.fr","cdn.gledaitv.live","celebritablog.com","charbelnemnom.com","chat.tchatche.com","cheat.hax4you.net","checkfiletype.com","chicksonright.com","cindyeyefinal.com","cinecalidad5.site","cinema-sketch.com","citethisforme.com","citpekalongan.com","ciudadblogger.com","claplivehdplay.ru","classicreload.com","clickjogos.com.br","cloudhostingz.com","coatingsworld.com","codingshiksha.com","coempregos.com.br","compota-soft.work","computercrack.com","computerfrage.net","computerhilfen.de","comunidadgzone.es","conferenceusa.com","consoletarget.com","cool-style.com.tw","coolmathgames.com","crichd-player.top","cruisingearth.com","cryptednews.space","cryptoblog24.info","cryptowidgets.net","crystalcomics.com","curiosidadtop.com","daemon-hentai.com","dailybulletin.com","dailydemocrat.com","dailyfreebits.com","dailygeekshow.com","dailytech-news.eu","dallascowboys.com","damndelicious.net","darts-scoring.com","dawnofthedawg.com","dealsfinders.blog","dearcreatives.com","deine-tierwelt.de","deinesexfilme.com","dejongeturken.com","denverbroncos.com","descarga-animex.*","design4months.com","designtagebuch.de","desitelugusex.com","developer.arm.com","diamondfansub.com","diaridegirona.cat","diariocordoba.com","diencobacninh.com","dirtyindianporn.*","dl.apkmoddone.com","doctor-groups.com","dorohedoro.online","downloadapps.info","downloadtanku.org","downloadudemy.com","downloadwella.com","dynastyseries.com","dzienniklodzki.pl","e-hausaufgaben.de","earninginwork.com","easyjapanesee.com","easyvidplayer.com","easywithcode.tech","ebonyassclips.com","eczpastpapers.net","editions-actu.org","einfachtitten.com","elamigosgamez.com","elamigosgamez.net","empire-streamz.fr","emulatorgames.net","encurtandourl.com","encurtareidog.top","engel-horoskop.de","enormousbabes.net","entertubeporn.com","epsilonakdemy.com","eromanga-show.com","estrepublicain.fr","eternalmangas.org","etownbluejays.com","euro2024direct.ru","eurotruck2.com.br","extreme-board.com","extremotvplay.com","faceittracker.net","fansonlinehub.com","fantasticporn.net","fastconverter.net","fatgirlskinny.net","fattubevideos.net","femalefirst.co.uk","fgcuathletics.com","fightinghawks.com","file.magiclen.org","financialpost.com","finanzas-vida.com","fineretroporn.com","finexxxvideos.com","finish.addurl.biz","fitnakedgirls.com","fitnessplanss.com","fitnesssguide.com","flight-report.com","floridagators.com","foguinhogames.net","footballstream.tv","footfetishvid.com","footstockings.com","fordownloader.com","formatlibrary.com","forum.blu-ray.com","fplstatistics.com","freeboytwinks.com","freecodezilla.net","freecourseweb.com","freemagazines.top","freeoseocheck.com","freepdf-books.com","freepornrocks.com","freepornstream.cc","freepornvideo.sex","freepornxxxhd.com","freerealvideo.com","freethesaurus.com","freex2line.online","freexxxvideos.pro","french-streams.cc","freshstuff4u.info","friendproject.net","frkn64modding.com","frosinonetoday.it","fuerzasarmadas.eu","fuldaerzeitung.de","fullfreeimage.com","fullxxxmovies.net","futbolsayfasi.net","games-manuals.com","games.puzzler.com","games.thestar.com","gamesofdesire.com","gaminggorilla.com","gay-streaming.com","gaypornhdfree.com","gebrauchtwagen.at","getwallpapers.com","gewinde-normen.de","girlsofdesire.org","girlswallowed.com","globalstreams.xyz","gobigtitsporn.com","goblueraiders.com","godriveplayer.com","gogetapast.com.br","gogueducation.com","goltelevision.com","googleapis.com.de","googleapis.com.do","gothunderbirds.ca","grannyfuckxxx.com","grannyxxxtube.net","graphicgoogle.com","grsprotection.com","gwiazdatalkie.com","hakunamatata5.org","hallo-muenchen.de","happy-otalife.com","hardcoregamer.com","hardwaretimes.com","hbculifestyle.com","hdfilmizlesen.com","hdvintagetube.com","headlinerpost.com","healbot.dpm15.net","healthcheckup.com","hegreartnudes.com","help.cashctrl.com","hentaibrasil.info","hentaienglish.com","hentaitube.online","hideandseek.world","hikarinoakari.com","hollywoodlife.com","hostingunlock.com","hotkitchenbag.com","hotmaturetube.com","hotspringsofbc.ca","houseandgarden.co","houstontexans.com","howtoconcepts.com","hunterscomics.com","hyperosthemes.org","iedprivatedqu.com","imgdawgknuttz.com","imperialstudy.com","independent.co.uk","indianporn365.net","indofirmware.site","indojavstream.com","infinityscans.net","infinityscans.org","infinityscans.xyz","inside-digital.de","insidermonkey.com","instantcloud.site","insurancepost.xyz","integraforums.com","ironwinter6m.shop","isabihowto.com.ng","isekaisubs.web.id","isminiunuttum.com","jamiesamewalk.com","janammusic.in.net","japaneseholes.com","japanpornclip.com","japanxxxworld.com","jardiner-malin.fr","jokersportshd.org","juegos.elpais.com","k-statesports.com","k-statesports.net","k-statesports.org","kandisvarlden.com","kenshi.fandom.com","kh-pokemon-mc.com","khabardinbhar.net","kickasstorrents.*","kill-the-hero.com","kimcilonlyofc.com","kiuruvesilehti.fi","know-how-tree.com","kontenterabox.com","kontrolkalemi.com","koreanbeauty.club","korogashi-san.org","kreis-anzeiger.de","kurierlubelski.pl","lachainemeteo.com","lacuevadeguns.com","laksa19.github.io","lavozdegalicia.es","lebois-racing.com","lecturisiarome.ro","leechpremium.link","leechyscripts.net","lespartisanes.com","lheritierblog.com","libertestreamvf.*","limontorrents.com","line-stickers.com","link.turkdown.com","linuxsecurity.com","lisatrialidea.com","locatedinfain.com","lonely-mature.com","lovegrowswild.com","lucagrassetti.com","luciferdonghua.in","luckypatchers.com","lycoathletics.com","macanevowners.com","madhentaitube.com","malaysiastock.biz","maps4study.com.br","marthastewart.com","mature-chicks.com","maturepussies.pro","mdzsmutpcvykb.net","media.cms.nova.cz","megajapantube.com","metaforespress.gr","mfmfinancials.com","miamidolphins.com","miaminewtimes.com","milfpussy-sex.com","minecraftwild.com","mizugigurabia.com","mlbpark.donga.com","mlbstreaming.live","mmorpgplay.com.br","mobilanyheter.net","modelsxxxtube.com","modescanlator.net","mommyporntube.com","momstube-porn.com","moonblinkwifi.com","motorradfrage.net","motorradonline.de","moviediskhd.cloud","movielinkbd4u.com","moviezaddiction.*","mp3cristianos.net","mundovideoshd.com","murtonroofing.com","music.youtube.com","muyinteresante.es","myabandonware.com","myair2.resmed.com","myfunkytravel.com","mynakedwife.video","mzansixporn.co.za","nasdaqfutures.org","national-park.com","negative.tboys.ro","nepalieducate.com","networklovers.com","new-xxxvideos.com","nextchessmove.com","ngin-mobility.com","nieuwsvandedag.nl","nightlifeporn.com","nikkan-gendai.com","nikkeifutures.org","njwildlifecam.com","nobodycancool.com","nonsensediamond.*","nzpocketguide.com","oceanof-games.com","oceanoffgames.com","odekake-spots.com","officedepot.co.cr","officialpanda.com","olemisssports.com","ondemandkorea.com","onepiecepower.com","onlinemschool.com","onlinesextube.com","onlineteenhub.com","ontariofarmer.com","openspeedtest.com","opensubtitles.com","oportaln10.com.br","osmanonline.co.uk","osthessen-news.de","ottawacitizen.com","ottrelease247.com","outdoorchannel.de","overwatchporn.xxx","pahaplayers.click","palmbeachpost.com","pandaznetwork.com","panel.skynode.pro","pantyhosepink.com","paramountplus.com","paraveronline.org","pghk.blogspot.com","phimlongtieng.net","phoenix-manga.com","phonefirmware.com","piazzagallura.org","pistonpowered.com","plantatreenow.com","play.aidungeon.io","playembedapi.site","player.glomex.com","player.kinoton.cc","playerflixapi.com","playerjavseen.com","playmyopinion.com","playporngames.com","pleated-jeans.com","pockettactics.com","popcornmovies.org","porn-sexypics.com","pornanimetube.com","porngirlstube.com","pornoenspanish.es","pornoschlange.com","pornxxxvideos.net","practicalkida.com","prague-blog.co.il","premiumporn.org>>","prensaesports.com","prescottenews.com","press-citizen.com","presstelegram.com","primeanimesex.com","primeflix.website","progameguides.com","project-free-tv.*","projectfreetv.one","promisingapps.com","promo-visits.site","protege-liens.com","pubgaimassist.com","publicananker.com","publicdomainq.net","publicdomainr.net","publicflashing.me","punisoku.blogo.jp","pussytorrents.org","qatarstreams.me>>","queenofmature.com","radiolovelive.com","radiosymphony.com","ragnarokmanga.com","rancheroforum.com","randomarchive.com","rateyourmusic.com","rawindianporn.com","readallcomics.com","readcomiconline.*","readfireforce.com","realvoyeursex.com","redesigndaily.com","reporterpb.com.br","reprezentacija.rs","retrosexfilms.com","reviewjournal.com","richieashbeck.com","robloxscripts.com","rojadirectatvhd.*","roms-download.com","roznamasiasat.com","rule34.paheal.net","sahlmarketing.net","samfordsports.com","sanangelolive.com","sanmiguellive.com","sarkarinaukry.com","savemoneyinfo.com","sayphotobooth.com","scandichotels.com","schoolsweek.co.uk","scontianastro.com","searchnsucceed.in","seasons-dlove.net","send-anywhere.com","series9movies.com","sevenjournals.com","sexmadeathome.com","sexyebonyteen.com","sexyfreepussy.com","shahiid-anime.net","share.filesh.site","shentai-anime.com","shinshi-manga.net","shittokuadult.net","shortencash.click","shrink-service.it","sidearmsocial.com","sideplusleaks.com","sim-kichi.monster","simply-hentai.com","simplyrecipes.com","simplywhisked.com","simulatormods.com","skidrow-games.com","skillheadlines.in","skodacommunity.de","slaughtergays.com","smallseotools.com","soccerworldcup.me","softwaresblue.com","south-park-tv.biz","spectrum.ieee.org","speculationis.com","spedostream2.shop","spiritparting.com","sponsorhunter.com","sportanalytic.com","sportingsurge.com","sportlerfrage.net","sportsbuff.stream","sportsgames.today","sportzonline.site","stapadblockuser.*","stellarthread.com","stepsisterfuck.me","storefront.com.ng","stories.los40.com","straatosphere.com","streamadblocker.*","streaming-one.com","streamingunity.to","streamlivetv.site","streamonsport99.*","streamseeds24.com","streamshunters.eu","stringreveals.com","suanoticia.online","super-ethanol.com","susanhavekeep.com","tabele-kalorii.pl","tamaratattles.com","tamilbrahmins.com","tamilsexstory.net","tattoosbeauty.com","tautasdziesmas.lv","techadvisor.co.uk","techautomobile.in","techiepirates.com","techlog.ta-yan.ai","technewsrooms.com","technewsworld.com","techsolveprac.com","teenpornvideo.sex","teenpornvideo.xxx","testlanguages.com","texture-packs.com","thaihotmodels.com","thangdangblog.com","theandroidpro.com","thecelticblog.com","thecubexguide.com","thedailybeast.com","thedigitalfix.com","thefreebieguy.com","thegamearcade.com","thehealthsite.com","theismailiusa.org","thekingavatar.com","theliveupdate.com","theouterhaven.net","theregister.co.uk","thermoprzepisy.pl","thesprucepets.com","theworldobits.com","thousandbabes.com","tichyseinblick.de","tiktokcounter.net","timesnowhindi.com","tippsundtricks.co","titfuckvideos.com","tmail.sys64738.at","tomatespodres.com","toplickevesti.com","topsworldnews.com","torrent-pirat.com","torrentdownload.*","tradingfact4u.com","trannylibrary.com","trannyxxxtube.net","truyen-hentai.com","truyenaudiocv.net","tubepornasian.com","tubepornstock.com","ultimate-catch.eu","ultrateenporn.com","umatechnology.org","undeadwalking.com","unsere-helden.com","uptechnologys.com","urjalansanomat.fi","url.gem-flash.com","utepathletics.com","vanillatweaks.net","venusarchives.com","vide-greniers.org","video.gazzetta.it","videogameszone.de","videos.remilf.com","vietnamanswer.com","viralitytoday.com","virtualnights.com","visualnewshub.com","vitalitygames.com","voiceofdenton.com","voyeurpornsex.com","voyeurspyporn.com","voyeurxxxfree.com","wannafreeporn.com","watchanimesub.net","watchfacebook.com","watchsouthpark.tv","websiteglowgh.com","weknowconquer.com","welcometojapan.jp","wellness4live.com","wirralglobe.co.uk","wirtualnemedia.pl","wohnmobilforum.de","worldfreeware.com","worldgreynews.com","worthitorwoke.com","wpsimplehacks.com","xfreepornsite.com","xhamsterdeutsch.*","xnxx-sexfilme.com","xxxonlinefree.com","xxxpussyclips.com","xxxvideostrue.com","yesdownloader.com","yongfucknaked.com","yummysextubes.com","zeenews.india.com","zeijakunahiko.com","zeroto60times.com","zippysharecue.com","1001tracklists.com","101soundboards.com","10minuteemails.com","123moviesready.org","123moviestoday.net","1337x.unblock2.xyz","247footballnow.com","7daystodiemods.com","adblockeronstape.*","addictinggames.com","adultasianporn.com","advertisertape.com","afasiaarchzine.com","airportwebcams.net","akuebresources.com","allureamateurs.net","alternativa104.net","amateur-mature.net","angrybirdsnest.com","animesonliner4.com","anothergraphic.org","antenasport.online","arcade.buzzrtv.com","arcadeprehacks.com","arkadiumhosted.com","arsiv.mackolik.com","asian-teen-sex.com","asianbabestube.com","asianpornfilms.com","asiansexdiarys.com","asianstubefuck.com","atlantafalcons.com","atlasstudiousa.com","autocadcommand.com","badasshardcore.com","baixedetudo.net.br","ballexclusives.com","barstoolsports.com","basic-tutorials.de","bdsmslavemovie.com","beamng.wesupply.cx","bearchasingart.com","beermoneyforum.com","beginningmanga.com","berliner-kurier.de","beruhmtemedien.com","best-xxxvideos.com","bestialitytaboo.tv","bettingexchange.it","bidouillesikea.com","bigdata-social.com","bigdata.rawlazy.si","bigpiecreative.com","bigsouthsports.com","bigtitsxxxfree.com","birdsandblooms.com","blisseyhusband.net","blogredmachine.com","blogx.almontsf.com","blowjobamateur.net","blowjobpornset.com","bluecoreinside.com","bluemediastorage.*","bombshellbling.com","bonsaiprolink.shop","bosoxinjection.com","businessinsider.de","calculatorsoup.com","camwhorescloud.com","captown.capcom.com","cararegistrasi.com","casos-aislados.com","cayenneevforum.com","cdimg.blog.2nt.com","cehennemstream.xyz","cerbahealthcare.it","chiangraitimes.com","chicagobearshq.com","chicagobullshq.com","chicasdesnudas.xxx","chikianimation.org","choiceappstore.xyz","cintateknologi.com","clampschoolholic.*","classicalradio.com","classicxmovies.com","climaaovivo.com.br","clothing-mania.com","codingnepalweb.com","coleccionmovie.com","comicspornoxxx.com","comparepolicyy.com","comparteunclic.com","consejosytrucos.co","contractpharma.com","couponscorpion.com","cr7-soccer.store>>","creditcardrush.com","crimsonscrolls.net","crm.urlwebsite.com","cronachesalerno.it","cryptonworld.space","dallasobserver.com","datapendidikan.com","dawgpounddaily.com","dcdirtylaundry.com","denverpioneers.com","depressionhurts.us","descargaspcpro.net","desifuckonline.com","deutschekanale.com","devicediary.online","dianaavoidthey.com","diariodenavarra.es","digicol.dpm.org.cn","dirtyasiantube.com","dirtygangbangs.com","discover-sharm.com","diyphotography.net","diyprojectslab.com","donaldlineelse.com","donghuanosekai.com","doublemindtech.com","downloadcursos.top","downloadgames.info","downloadmusic.info","downloadpirate.com","dragonball-zxk.com","dramathical.stream","dulichkhanhhoa.net","e-mountainbike.com","elconfidencial.com","elearning-cpge.com","embed-player.space","empire-streaming.*","english-dubbed.com","english-topics.com","erikcoldperson.com","evdeingilizcem.com","eveningtimes.co.uk","exactlyhowlong.com","expressbydgoski.pl","extremosports.club","familyhandyman.com","favoyeurtube.net>>","fightingillini.com","financenova.online","financialjuice.com","flacdownloader.com","flashgirlgames.com","flashingjungle.com","foodiesgallery.com","foreversparkly.com","formasyonhaber.net","forum.cstalking.tv","francaisfacile.net","free-gay-clips.com","freeadultcomix.com","freeadultvideos.cc","freebiesmockup.com","freecoursesite.com","freefireupdate.com","freegogpcgames.com","freegrannyvids.com","freemockupzone.com","freemoviesfull.com","freepornasians.com","freepublicporn.com","freereceivesms.com","freeviewmovies.com","freevipservers.net","freevstplugins.net","freewoodworking.ca","freex2line.onlinex","freshwaterdell.com","friscofighters.com","fritidsmarkedet.dk","fuckhairygirls.com","fuckingsession.com","fullvideosporn.com","galinhasamurai.com","gamerevolution.com","games.arkadium.com","games.kentucky.com","games.mashable.com","games.thestate.com","gamingforecast.com","gaypornmasters.com","gazetakrakowska.pl","gazetazachodnia.eu","gdrivelatinohd.net","geniale-tricks.com","geniussolutions.co","girlsgogames.co.uk","go.bucketforms.com","goafricaonline.com","gobankingrates.com","gocurrycracker.com","godrakebulldog.com","gojapaneseporn.com","golf.rapidmice.com","gorro-4go5b3nj.fun","grouppornotube.com","gruenderlexikon.de","gudangfirmwere.com","guessthemovie.name","hamptonpirates.com","hard-tube-porn.com","healthfirstweb.com","healthnewsreel.com","healthy4pepole.com","heatherdisarro.com","hentaipornpics.net","hentaisexfilms.com","heraldscotland.com","hiddencamstube.com","highkeyfinance.com","hindustantimes.com","homeairquality.org","homemoviestube.com","hotanimevideos.com","hotbabeswanted.com","hotxxxjapanese.com","hqamateurtubes.com","huffingtonpost.com","huitranslation.com","humanbenchmark.com","hyundaitucson.info","idedroidsafelink.*","idevicecentral.com","ifreemagazines.com","ikingfile.mooo.com","ilcamminodiluce.it","imagetranslator.io","indecentvideos.com","indesignskills.com","indianbestporn.com","indianpornvideos.*","indiansexbazar.com","infamous-scans.com","infinitehentai.com","infinityblogger.in","infojabarloker.com","informatudo.com.br","informaxonline.com","insidemarketing.it","insidememorial.com","insider-gaming.com","insurancesfact.com","intercelestial.com","investor-verlag.de","iowaconference.com","italianporn.com.es","ithinkilikeyou.net","iusedtobeaboss.com","jacksonguitars.com","jamessoundcost.com","japanesemomsex.com","japanesetube.video","jasminetesttry.com","jeepreconforum.com","jemontremabite.com","jeux.meteocity.com","johnalwayssame.com","jojolandsmanga.com","joomlabeginner.com","jujustu-kaisen.com","justfamilyporn.com","justpicsplease.com","justtoysnoboys.com","kawaguchimaeda.com","kdramasmaza.com.pk","kellywhatcould.com","keralatelecom.info","kickasstorrents2.*","kittyfuckstube.com","knowyourphrase.com","kobitacocktail.com","komisanwamanga.com","kr-weathernews.com","krebs-horoskop.com","kstatefootball.net","kstatefootball.org","laopinioncoruna.es","leagueofgraphs.com","leckerschmecker.me","leo-horoscopes.com","letribunaldunet.fr","leviathanmanga.com","levismodding.co.uk","lib.hatenablog.com","link.get2short.com","link.paid4link.com","linkedmoviehub.top","linux-community.de","listenonrepeat.com","literarysomnia.com","littlebigsnake.com","liveandletsfly.com","localemagazine.com","longbeachstate.com","lotus-tours.com.hk","loyolaramblers.com","lukecomparetwo.com","luzernerzeitung.ch","m.timesofindia.com","maggotdrowning.com","magicgameworld.com","makeincomeinfo.com","maketecheasier.com","makotoichikawa.net","mallorcazeitung.es","manager-magazin.de","manchesterworld.uk","mangas-origines.fr","manoramaonline.com","maraudersports.com","mathplayground.com","maturetubehere.com","maturexxxclips.com","mctechsolutions.in","mediascelebres.com","megafilmeshd50.com","megahentaitube.com","megapornfreehd.com","mein-wahres-ich.de","memorialnotice.com","merlininkazani.com","mespornogratis.com","mesquitaonline.com","minddesignclub.org","minhasdelicias.com","mobilelegends.shop","mobiletvshows.site","modele-facture.com","moflix-stream.fans","montereyherald.com","motorcyclenews.com","moviescounnter.com","moviesonlinefree.*","mygardening411.com","myhentaicomics.com","mymusicreviews.com","myneobuxportal.com","mypornstarbook.net","nadidetarifler.com","naijachoice.com.ng","nakedgirlsroom.com","nakedneighbour.com","nauci-engleski.com","nauci-njemacki.com","netaffiliation.com","neueroeffnung.info","nevadawolfpack.com","newjapanesexxx.com","news-geinou100.com","newyorkupstate.com","nicematureporn.com","niestatystyczny.pl","nightdreambabe.com","nontonvidoy.online","noodlemagazine.com","novacodeportal.xyz","nudebeachpussy.com","nudecelebforum.com","nuevos-mu.ucoz.com","nyharborwebcam.com","o2tvseries.website","oceanbreezenyc.org","officegamespot.com","omnicalculator.com","onepunch-manga.com","onetimethrough.com","onlinesudoku.games","onlinetutorium.com","onlinework4all.com","onlygoldmovies.com","onscreensvideo.com","openchat-review.me","pakistaniporn2.com","passeportsante.net","passportaction.com","pc-spiele-wiese.de","pcgamedownload.net","pcgameshardware.de","peachprintable.com","peliculas-dvdrip.*","penisbuyutucum.net","pestleanalysis.com","pinayviralsexx.com","plainasianporn.com","play.starsites.fun","play.watch20.space","player.euroxxx.net","player.vidplus.pro","playeriframe.lol>>","playretrogames.com","pliroforiki-edu.gr","policesecurity.com","policiesreview.com","polskawliczbach.pl","pornhubdeutsch.net","pornmaturetube.com","pornohubonline.com","pornovideos-hd.com","pornvideospass.com","powerthesaurus.org","premiumstream.live","present.rssing.com","printablecrush.com","problogbooster.com","productkeysite.com","projectfreetv2.com","projuktirkotha.com","proverbmeaning.com","psicotestuned.info","pussytubeebony.com","racedepartment.com","radio-en-direct.fr","radioitalylive.com","radionorthpole.com","ratemyteachers.com","realfreelancer.com","realtormontreal.ca","recherche-ebook.fr","redamateurtube.com","redbubbletools.com","redstormsports.com","replica-watch.info","reporterherald.com","rightdark-scan.com","rincondelsazon.com","ripcityproject.com","risefromrubble.com","romaniataramea.com","ryanagoinvolve.com","sabornutritivo.com","samrudhiglobal.com","samurai.rzword.xyz","sandrataxeight.com","sankakucomplex.com","sattakingcharts.in","scarletandgame.com","scarletknights.com","schoener-wohnen.de","sciencechannel.com","scopateitaliane.it","seamanmemories.com","selfstudybrain.com","sethniceletter.com","sexiestpicture.com","sexteenxxxtube.com","sexy-youtubers.com","sexykittenporn.com","sexymilfsearch.com","shadowrangers.live","shemaletoonsex.com","shipseducation.com","shrivardhantech.in","shutupandgo.travel","sidelionreport.com","siirtolayhaber.com","simpledownload.net","siteunblocked.info","slowianietworza.pl","smithsonianmag.com","soccerstream100.to","sociallyindian.com","softwaredetail.com","sosyalbilgiler.net","southernliving.com","southparkstudios.*","spank-and-bang.com","sportstohfa.online","stapewithadblock.*","stream.nflbox.me>>","streamelements.com","streaming-french.*","strtapeadblocker.*","surgicaltechie.com","sweeteroticart.com","syracusecrunch.com","tamilultratv.co.in","tapeadsenjoyer.com","tcpermaculture.com","technicalviral.com","telefullenvivo.com","telexplorer.com.ar","theblissempire.com","thecelticbhoys.com","theendlessmeal.com","thefirearmblog.com","thehentaiworld.com","thelesbianporn.com","thepewterplank.com","thepiratebay10.org","theralphretort.com","thestarphoenix.com","thesuperdownload.*","thiagorossi.com.br","thisisourbliss.com","tiervermittlung.de","tiktokrealtime.com","times-standard.com","tiny-sparklies.com","tips-and-tricks.co","tokyo-ghoul.online","tonpornodujour.com","topbiography.co.in","torrentdosfilmes.*","torrentdownloads.*","totalsportekhd.com","traductionjeux.com","trannysexmpegs.com","transgirlslive.com","traveldesearch.com","travelplanspro.com","trendyol-milla.com","tribeathletics.com","trovapromozioni.it","truckingboards.com","truyenbanquyen.com","truyenhentai18.net","tuhentaionline.com","tulsahurricane.com","turboimagehost.com","tv3play.skaties.lv","tvonlinesports.com","tweaksforgeeks.com","txstatebobcats.com","ucirvinesports.com","ukrainesmodels.com","uncensoredleak.com","universfreebox.com","unlimitedfiles.xyz","urbanmilwaukee.com","urlaubspartner.net","venus-and-mars.com","vermangasporno.com","verywellhealth.com","victor-mochere.com","videos.porndig.com","videosinlevels.com","videosxxxputas.com","vintagepornfun.com","vintagepornnew.com","vintagesexpass.com","waitrosecellar.com","washingtonpost.com","watch.rkplayer.xyz","watch.shout-tv.com","watchadsontape.com","wblaxmibhandar.com","weakstreams.online","weatherzone.com.au","web.livecricket.is","webloadedmovie.com","websitesbridge.com","werra-rundschau.de","wheatbellyblog.com","wildhentaitube.com","windowsmatters.com","winteriscoming.net","wohnungsboerse.net","woman.excite.co.jp","worldstreams.click","wormser-zeitung.de","www.apkmoddone.com","www.cloudflare.com","www.primevideo.com","xbox360torrent.com","xda-developers.com","xn--kckzb2722b.com","xpressarticles.com","xxx-asian-tube.com","xxxanimemovies.com","xxxanimevideos.com","yify-subtitles.org","youngpussyfuck.com","youwatch-serie.com","yt-downloaderz.com","ytmp4converter.com","znanemediablog.com","zxi.mytechroad.com","aachener-zeitung.de","abukabir.fawrye.com","abyssplay.pages.dev","academiadelmotor.es","adblockstreamtape.*","addtobucketlist.com","adultgamesworld.com","agrigentonotizie.it","aliendictionary.com","allafricangirls.net","allindiaroundup.com","allporncartoons.com","almohtarif-tech.net","altadefinizione01.*","amateur-couples.com","amaturehomeporn.com","amazingtrannies.com","androidrepublic.org","angeloyeo.github.io","animefuckmovies.com","animeonlinefree.org","animesonlineshd.com","annoncesescorts.com","anonymous-links.com","anonymousceviri.com","app.link2unlock.com","app.studysmarter.de","aprenderquechua.com","arabianbusiness.com","arizonawildcats.com","arnaqueinternet.com","arrowheadaddict.com","artificialnudes.com","asiananimaltube.org","asianfuckmovies.com","asianporntube69.com","audiobooks4soul.com","audiotruyenfull.com","bailbondsfinder.com","baltimoreravens.com","beautypackaging.com","beisbolinvernal.com","berliner-zeitung.de","bestmaturewomen.com","bethshouldercan.com","bigcockfreetube.com","bigsouthnetwork.com","blackenterprise.com","blog.cloudflare.com","blog.itijobalert.in","blog.potterworld.co","bluemediadownload.*","bordertelegraph.com","brucevotewithin.com","businessinsider.com","calculascendant.com","cambrevenements.com","cancelguider.online","canuckaudiomart.com","celebritynakeds.com","celebsnudeworld.com","certificateland.com","chakrirkhabar247.in","championpeoples.com","chawomenshockey.com","chicagosportshq.com","christiantrendy.com","chubbypornmpegs.com","citationmachine.net","civilenggforall.com","classicpornbest.com","classicpornvids.com","clevelandbrowns.com","collegeteentube.com","columbiacougars.com","comicsxxxgratis.com","commande.rhinov.pro","commsbusiness.co.uk","comofuncionaque.com","compilationtube.xyz","comprovendolibri.it","concealednation.org","consigliatodanoi.it","couponsuniverse.com","crackedsoftware.biz","creativebusybee.com","crossdresserhub.com","crosswordsolver.com","crystal-launcher.pl","custommapposter.com","daddyfuckmovies.com","daddylivestream.com","dailyjobposting.xyz","dailymaverick.co.za","dartmouthsports.com","der-betze-brennt.de","descargaranimes.com","descargatepelis.com","deseneledublate.com","desktopsolution.org","detroitjockcity.com","dev.fingerprint.com","developerinsider.co","diariodemallorca.es","diarioeducacion.com","dichvureviewmap.com","diendancauduong.com","digitalfernsehen.de","digitalseoninja.com","digitalstudiome.com","dignityobituary.com","discordfastfood.com","divinelifestyle.com","divxfilmeonline.net","dktechnicalmate.com","download.megaup.net","dubipc.blogspot.com","dynamicminister.net","dziennikbaltycki.pl","dziennikpolski24.pl","dziennikzachodni.pl","earn.quotesopia.com","edmontonjournal.com","elamigosedition.com","ellibrepensador.com","embed.nana2play.com","en-thunderscans.com","en.financerites.com","erotic-beauties.com","eventiavversinews.*","expresskaszubski.pl","fansubseries.com.br","fatblackmatures.com","faucetcaptcha.co.in","felicetommasino.com","femdomporntubes.com","fifaultimateteam.it","filmeonline2018.net","filmesonlinehd1.org","firstasianpussy.com","footballfancast.com","footballstreams.lol","footballtransfer.ru","fortnitetracker.com","fplstatistics.co.uk","franceprefecture.fr","free-trannyporn.com","freecoursesites.com","freecoursesonline.*","freegamescasual.com","freeindianporn.mobi","freeindianporn2.com","freeplayervideo.com","freescorespiano.com","freesexvideos24.com","freetarotonline.com","freshsexxvideos.com","frustfrei-lernen.de","fuckmonstercock.com","fuckslutsonline.com","futura-sciences.com","gagaltotal666.my.id","gallant-matures.com","gamecocksonline.com","games.bradenton.com","games.dailymail.com","games.fresnobee.com","games.heraldsun.com","games.sunherald.com","gazetawroclawska.pl","generacionretro.net","gesund-vital.online","gfilex.blogspot.com","global.novelpia.com","gloswielkopolski.pl","goarmywestpoint.com","godrakebulldogs.com","godrakebulldogs.net","goodnewsnetwork.org","hailfloridahail.com","hamburgerinsult.com","hardcorelesbian.xyz","hardwarezone.com.sg","hardwoodhoudini.com","hartvannederland.nl","haus-garten-test.de","haveyaseenjapan.com","hawaiiathletics.com","hayamimi-gunpla.com","healthbeautybee.com","helpnetsecurity.com","hentai-mega-mix.com","hentaianimezone.com","hentaisexuality.com","hieunguyenphoto.com","highdefdiscnews.com","hindimatrashabd.com","hindimearticles.net","hindimoviesonline.*","historicaerials.com","hmc-id.blogspot.com","hobby-machinist.com","home-xxx-videos.com","horseshoeheroes.com","hostingdetailer.com","hotbeautyhealth.com","hotorientalporn.com","hqhardcoreporno.com","ianrequireadult.com","ilbolerodiravel.org","ilforumdeibrutti.is","indianpornvideo.org","individualogist.com","ingyenszexvideok.hu","insidertracking.com","insidetheiggles.com","interculturalita.it","inventionsdaily.com","iptvxtreamcodes.com","itsecuritynews.info","iulive.blogspot.com","jacquieetmichel.net","japanesexxxporn.com","javuncensored.watch","jayservicestuff.com","jessicaclearout.com","joguinhosgratis.com","justcastingporn.com","justsexpictures.com","k-statefootball.net","k-statefootball.org","kentstatesports.com","kenzo-flowertag.com","kingjamesgospel.com","kingsofkauffman.com","kissmaturestube.com","klettern-magazin.de","kreuzwortraetsel.de","kstateathletics.com","ladypopularblog.com","lawweekcolorado.com","learnchannel-tv.com","learnmarketinfo.com","legionpeliculas.org","legionprogramas.org","leitesculinaria.com","lemino.docomo.ne.jp","letrasgratis.com.ar","lifeisbeautiful.com","limiteddollqjc.shop","livetv.moviebite.cc","livingstondaily.com","localizaagencia.com","lorimuchbenefit.com","love-stoorey210.net","m.jobinmeghalaya.in","main.24jobalert.com","marketrevolution.eu","masashi-blog418.com","massagefreetube.com","maturepornphoto.com","measuringflower.com","mediatn.cms.nova.cz","meeting.tencent.com","megajapanesesex.com","meicho.marcsimz.com","miamiairportcam.com","miamibeachradio.com","migliori-escort.com","mikaylaarealike.com","mindmotion93y8.shop","minecraft-forum.net","minecraftraffle.com","minhaconexao.com.br","minutemirror.com.pk","mittelbayerische.de","mobilesexgamesx.com","montrealgazette.com","morinaga-office.net","motherandbaby.co.uk","movies-watch.com.pk","myhentaigallery.com","mynaturalfamily.com","myreadingmanga.info","noticiascripto.site","novelmultiverse.com","novelsparadise.site","nude-beach-tube.com","nudeselfiespics.com","nurparatodos.com.ar","obituaryupdates.com","oldgrannylovers.com","onlinefetishporn.cc","onlinepornushka.com","opisanie-kartin.com","orangespotlight.com","outdoor-magazin.com","painting-planet.com","parasportontario.ca","parrocchiapalata.it","paulkitchendark.com","pcgamebenchmark.com","peopleenespanol.com","perfectmomsporn.com","petitegirlsnude.com","pharmaguideline.com","phoenixnewtimes.com","phonereviewinfo.com","pickleballclubs.com","picspornamateur.com","platform.autods.com","play.dictionary.com","play.geforcenow.com","play.mylifetime.com","play.playkrx18.site","player.popfun.co.uk","player.uwatchfree.*","pompanobeachcam.com","popularasianxxx.com","poradyiwskazowki.pl","pornjapanesesex.com","pornocolegialas.org","pornocolombiano.net","pornosubtitula2.com","pornstarsadvice.com","portmiamiwebcam.com","porttampawebcam.com","pranarevitalize.com","protege-torrent.com","psychology-spot.com","publicidadtulua.com","quest.to-travel.net","raccontivietati.com","radiosantaclaus.com","radiotormentamx.com","rawofficethumbs.com","readcomicsonline.ru","realitybrazzers.com","redowlanalytics.com","relampagomovies.com","reneweconomy.com.au","richardsignfish.com","richmondspiders.com","ripplestream4u.shop","roberteachfinal.com","rojadirectaenhd.net","rojadirectatvlive.*","rollingglobe.online","romanticlesbian.com","rundschau-online.de","ryanmoore.marketing","rysafe.blogspot.com","samurai.wordoco.com","santoinferninho.com","savingsomegreen.com","scansatlanticos.com","scholarshiplist.org","schrauben-normen.de","secondhandsongs.com","sempredirebanzai.it","sempreupdate.com.br","serieshdpormega.com","seriezloaded.com.ng","setsuyakutoushi.com","sex-free-movies.com","sexyvintageporn.com","shogaisha-shuro.com","shogaisha-techo.com","sixsistersstuff.com","skidrowreloaded.com","smartkhabrinews.com","soap2day-online.com","soccerfullmatch.com","soccerworldcup.me>>","sociologicamente.it","somulhergostosa.com","sourcingjournal.com","sousou-no-frieren.*","sportitalialive.com","sportzonline.site>>","spotidownloader.com","ssdownloader.online","standardmedia.co.ke","stealthoptional.com","stevenuniverse.best","stormininnorman.com","storynavigation.com","stoutbluedevils.com","stream.offidocs.com","stream.pkayprek.com","streamadblockplus.*","streamcasthub.store","streamshunters.eu>>","streamtapeadblock.*","submissive-wife.net","summarynetworks.com","sussexexpress.co.uk","svetatnazdraveto.bg","sweetadult-tube.com","tainio-mania.online","tamilfreemp3songs.*","tapewithadblock.org","teachersupdates.net","technicalline.store","techtrendmakers.com","tekniikanmaailma.fi","telecharger-igli4.*","thebalancemoney.com","theberserkmanga.com","thecrazytourist.com","theglobeandmail.com","themehospital.co.uk","theoaklandpress.com","thesimsresource.com","thesmokingcuban.com","thewatchseries.live","throwsmallstone.com","timesnowmarathi.com","timmaybealready.com","tiz-cycling-live.io","tophentaicomics.com","toptenknowledge.com","totalfuckmovies.com","totalmaturefuck.com","transexuales.gratis","trendsderzukunft.de","trucs-et-astuces.co","tubepornclassic.com","tubevintageporn.com","turkishseriestv.net","turtleboysports.com","tutorialsduniya.com","tw-hkt.blogspot.com","ukmagazinesfree.com","uktvplay.uktv.co.uk","ultimate-guitar.com","urbandictionary.com","usinger-anzeiger.de","utahstateaggies.com","valleyofthesuns.com","veryfastdownload.pw","vinylcollective.com","vip.stream101.space","virtual-youtuber.jp","virtualdinerbot.com","vitadacelebrita.com","wallpaperaccess.com","watch-movies.com.pk","watchlostonline.net","watchmonkonline.com","watchmoviesrulz.com","watchonlinemovie.pk","webhostingoffer.org","weneverbeenfree.com","weristdeinfreund.de","windows-7-forum.net","winit.heatworld.com","woffordterriers.com","worldaffairinfo.com","worldstarhiphop.com","worldtravelling.com","www2.tmyinsight.net","xhamsterdeutsch.xyz","xn--nbkw38mlu2a.com","xnxx-downloader.net","xnxx-sex-videos.com","xxxhentaimovies.com","xxxpussysextube.com","xxxsexyjapanese.com","yaoimangaonline.com","yellowblissroad.com","yorkshirepost.co.uk","your-daily-girl.com","youramateurporn.com","youramateurtube.com","yourlifeupdated.net","youtubedownloader.*","zeeplayer.pages.dev","25yearslatersite.com","27-sidefire-blog.com","2adultflashgames.com","acienciasgalilei.com","adult-sex-gamess.com","adultdvdparadise.com","akatsuki-no-yona.com","allcelebritywiki.com","allcivilstandard.com","allnewindianporn.com","aman-dn.blogspot.com","amateurebonypics.com","amateuryoungpics.com","analysis-chess.io.vn","androidapkmodpro.com","androidtunado.com.br","angolopsicologia.com","animalextremesex.com","apenasmaisumyaoi.com","aquiyahorajuegos.net","aroundthefoghorn.com","aspdotnet-suresh.com","ayobelajarbareng.com","badassdownloader.com","bailiwickexpress.com","banglachotigolpo.xyz","best-mobilegames.com","bestmp3converter.com","bestshemaleclips.com","bigtitsporn-tube.com","blackwoodacademy.org","bloggingawaydebt.com","bloggingguidance.com","boainformacao.com.br","bogowieslowianscy.pl","bollywoodshaadis.com","boxofficebusiness.in","br.nacaodamusica.com","broncosportforum.com","browardpalmbeach.com","bustyshemaleporn.com","cachevalleydaily.com","canberratimes.com.au","cartoonstvonline.com","cartoonvideos247.com","centralboyssp.com.br","charlestoughrace.com","chasingthedonkey.com","cienagamagdalena.com","climbingtalshill.com","comandotorrenthd.org","consiglietrucchi.com","crackstreamsfree.com","crackstreamshd.click","craigretailers.co.uk","creators.nafezly.com","dailygrindonline.net","dairylandexpress.com","davidsonbuilders.com","decorativemodels.com","defienietlynotme.com","deliciousmagazine.pl","demonyslowianskie.pl","denisegrowthwide.com","descargaseriestv.com","diglink.blogspot.com","divxfilmeonline.tv>>","djsofchhattisgarh.in","docs.fingerprint.com","donna-cerca-uomo.com","downloadfilm.website","durhamopenhouses.com","ear-phone-review.com","earnfromarticles.com","edivaldobrito.com.br","educationbluesky.com","embed.hideiframe.com","encuentratutarea.com","eroticteensphoto.net","escort-in-italia.com","essen-und-trinken.de","eurostreaming.casino","extremereportbot.com","fairforexbrokers.com","famosas-desnudas.org","fastpeoplesearch.com","filmeserialegratis.*","filmpornofrancais.fr","finanznachrichten.de","finding-camellia.com","fle-5r8dchma-moo.com","footballandress.club","foreverconscious.com","forexwikitrading.com","forge.plebmasters.de","forobasketcatala.com","forum.lolesporte.com","forum.thresholdx.net","fotbolltransfers.com","fr.streamon-sport.ru","free-sms-receive.com","freebigboobsporn.com","freecoursesonline.me","freelistenonline.com","freemagazinespdf.com","freemedicalbooks.org","freepatternsarea.com","freereadnovel.online","freeromsdownload.com","freestreams-live.*>>","freethailottery.live","freshshemaleporn.com","fullywatchonline.com","funeral-memorial.com","gaget.hatenablog.com","games.abqjournal.com","games.dallasnews.com","games.denverpost.com","games.kansascity.com","games.sixtyandme.com","games.wordgenius.com","gearingcommander.com","gesundheitsfrage.net","getfreesmsnumber.com","ghajini-4urg44yg.lol","giuseppegravante.com","giveawayoftheday.com","givemenbastreams.com","googledrivelinks.com","gourmetsupremacy.com","greatestshemales.com","griffinathletics.com","hackingwithreact.com","hds-streaming-hd.com","headlinepolitics.com","heartofvicksburg.com","heartrainbowblog.com","heresyoursavings.com","highheelstrample.com","historichorizons.com","hodgepodgehippie.com","hofheimer-zeitung.de","home-made-videos.com","homestratosphere.com","hornyconfessions.com","hostingreviews24.com","hotasianpussysex.com","hotjapaneseshows.com","huffingtonpost.co.uk","hypelifemagazine.com","immobilienscout24.de","india.marathinewz.in","inkworldmagazine.com","intereseducation.com","irresistiblepets.net","italiadascoprire.net","itpassportgokaku.com","jemontremonminou.com","jlwranglerforums.com","k-stateathletics.com","kachelmannwetter.com","karaoke4download.com","karaokegratis.com.ar","keedabankingnews.com","lacronicabadajoz.com","laopiniondemalaga.es","laopiniondemurcia.es","laopiniondezamora.es","largescaleforums.com","latinatemptation.com","laweducationinfo.com","lazytranslations.com","learn.moderngyan.com","lemonsqueezyhome.com","lempaala.ideapark.fi","lesbianvideotube.com","letemsvetemapplem.eu","letsworkremotely.com","link.djbassking.live","linksdegrupos.com.br","live-tv-channels.org","loan.bgmi32bitapk.in","loan.punjabworks.com","loriwithinfamily.com","lostcoastoutpost.com","luxurydreamhomes.net","main.sportswordz.com","mangcapquangvnpt.com","maryspecialwatch.com","maturepornjungle.com","maturewomenfucks.com","mauiinvitational.com","maxfinishseveral.com","medicalstudyzone.com","mein-kummerkasten.de","michaelapplysome.com","mkvmoviespoint.autos","money.quotesopia.com","monkeyanimalporn.com","morganhillwebcam.com","motorbikecatalog.com","motorcitybengals.com","motorsport-total.com","movieloversworld.com","moviemakeronline.com","moviesubtitles.click","mujeresdesnudas.club","mustardseedmoney.com","mylivewallpapers.com","mypace.sasapurin.com","myperfectweather.com","mypussydischarge.com","myuploadedpremium.de","naughtymachinima.com","newfreelancespot.com","neworleanssaints.com","newsonthegotoday.com","nibelungen-kurier.de","notebookcheck-ru.com","notebookcheck-tr.com","nudeplayboygirls.com","nuovo.vidplayer.live","nutraingredients.com","nylonstockingsex.net","onechicagocenter.com","online-xxxmovies.com","onlinegrannyporn.com","oraridiapertura24.it","originalteentube.com","pandadevelopment.net","pasadenastarnews.com","pcgamez-download.com","pesprofessionals.com","pipocamoderna.com.br","plagiarismchecker.co","planetaminecraft.com","platform.twitter.com","play.doramasplus.net","player.amperwave.net","player.smashy.stream","playstationhaber.com","popularmechanics.com","porlalibreportal.com","pornhub-sexfilme.net","portnassauwebcam.com","presentation-ppt.com","prismmarketingco.com","pro.iqsmartgames.com","psychologyjunkie.com","pussymaturephoto.com","radiocountrylive.com","ragnarokscanlation.*","ranaaclanhungary.com","rebeccaneverbase.com","recipestutorials.com","redensarten-index.de","remotejobzone.online","reviewingthebrew.com","rhein-main-presse.de","rinconpsicologia.com","robertplacespace.com","rockpapershotgun.com","roemische-zahlen.net","rojadirectaenvivo.pl","roms-telecharger.com","salamanca24horas.com","sandratableother.com","sarkariresult.social","savespendsplurge.com","schoolgirls-asia.org","schwaebische-post.de","securegames.iwin.com","server-tutorials.net","sexypornpictures.org","socialmediagirls.com","socket.pearsoned.com","solomaxlevelnewbie.*","spicyvintageporn.com","sportstohfa.online>>","starkroboticsfrc.com","stream.nbcsports.com","streamingcommunity.*","strtapewithadblock.*","successstoryinfo.com","superfastrelease.xyz","superpackpormega.com","swietaslowianskie.pl","tainguyenmienphi.com","tasteandtellblog.com","teenamateurphoto.com","telephone-soudan.com","teluguonlinemovies.*","telugusexkathalu.com","thefappeningblog.com","thefastlaneforum.com","thegatewaypundit.com","thekitchenmagpie.com","thesarkariresult.net","thesimplifydaily.com","tienichdienthoai.net","tinyqualityhomes.org","tomb-raider-king.com","totalsportek1000.com","toyoheadquarters.com","travellingdetail.com","trueachievements.com","tutorialforlinux.com","udemy-downloader.com","unblockedgames.world","underground.tboys.ro","utahsweetsavings.com","utepminermaniacs.com","ver-comics-porno.com","ver-mangas-porno.com","videoszoofiliahd.com","vintageporntubes.com","viralviralvideos.com","virgo-horoscopes.com","visualcapitalist.com","wallstreet-online.de","watchallchannels.com","watchcartoononline.*","watchgameofthrones.*","watchhouseonline.net","watchsuitsonline.net","watchtheofficetv.com","wegotthiscovered.com","weihnachts-filme.com","wetasiancreampie.com","whats-on-netflix.com","wife-home-videos.com","wirtualnynowydwor.pl","worldgirlsportal.com","yakyufan-asobiba.com","youfreepornotube.com","youngerasiangirl.net","yourhomemadetube.com","youtube-nocookie.com","yummytummyaarthi.com","1337x.ninjaproxy1.com","3dassetcollection.com","3dprintersforum.co.uk","ableitungsrechner.net","ad-itech.blogspot.com","airportseirosafar.com","airsoftmilsimnews.com","allgemeine-zeitung.de","ar-atech.blogspot.com","arabamob.blogspot.com","arrisalah-jakarta.com","banglachoti-story.com","bestsellerforaday.com","bibliotecadecorte.com","bigbuttshubvideos.com","blackchubbymovies.com","blackmaturevideos.com","blasianluvforever.com","blog.motionisland.com","bournemouthecho.co.uk","branditechture.agency","brandstofprijzen.info","broncathleticfund.com","brutalanimalsfuck.com","bucetaspeludas.com.br","business-standard.com","calculator-online.net","cancer-horoscopes.com","celebritydeeplink.com","charlessheimprove.com","collinsdictionary.com","comentariodetexto.com","conselhosetruques.com","course-downloader.com","daddylivestream.com>>","dailyvideoreports.net","davescomputertips.com","desitab69.sextgem.com","destakenewsgospel.com","deutschpersischtv.com","diarioinformacion.com","diplomaexamcorner.com","dirtyyoungbitches.com","disneyfashionista.com","downloadcursos.gratis","dragontranslation.com","dragontranslation.net","dragontranslation.org","earn.mpscstudyhub.com","easyworldbusiness.com","edwardarriveoften.com","elcriticodelatele.com","electricalstudent.com","embraceinnerchaos.com","envato-downloader.com","eroticmoviesonline.me","errotica-archives.com","evelynthankregion.com","expressilustrowany.pl","filemoon-59t9ep5j.xyz","filemoon-nv2xl8an.xyz","filmpornoitaliano.org","fitting-it-all-in.com","foodsdictionary.co.il","free-famous-toons.com","freebulksmsonline.com","freefatpornmovies.com","freeindiansextube.com","freepikdownloader.com","freshmaturespussy.com","friedrichshainblog.de","froheweihnachten.info","gadgetguideonline.com","games.bostonglobe.com","games.centredaily.com","games.dailymail.co.uk","games.greatergood.com","games.miamiherald.com","games.puzzlebaron.com","games.startribune.com","games.theadvocate.com","games.theolympian.com","games.triviatoday.com","gbadamud.blogspot.com","gemini-horoscopes.com","generalpornmovies.com","gentiluomodigitale.it","gentlemansgazette.com","giantshemalecocks.com","giessener-anzeiger.de","girlfuckgalleries.com","glamourxxx-online.com","gmuender-tagespost.de","googlearth.selva.name","goprincetontigers.com","guardian-series.co.uk","hackedonlinegames.com","hersfelder-zeitung.de","hochheimer-zeitung.de","hoegel-textildruck.de","hollywoodreporter.com","hot-teens-movies.mobi","hotmarathistories.com","howtoblogformoney.net","html5.gamemonetize.co","hungarianhardstyle.hu","iamflorianschulze.com","imasdk.googleapis.com","indiansexstories2.net","indratranslations.com","inmatesearchidaho.com","insideeducation.co.za","jacquieetmicheltv.net","jemontremasextape.com","journaldemontreal.com","journey.to-travel.net","jsugamecocksports.com","juninhoscripts.com.br","kana-mari-shokudo.com","kstatewomenshoops.com","kstatewomenshoops.net","kstatewomenshoops.org","labelandnarrowweb.com","lapaginadealberto.com","learnodo-newtonic.com","lebensmittelpraxis.de","lesbianfantasyxxx.com","lingeriefuckvideo.com","live-sport.duktek.pro","lycomingathletics.com","majalahpendidikan.com","malaysianwireless.com","mangaplus.shueisha.tv","mavericktruckclub.com","megashare-website.com","meuplayeronlinehd.com","midlandstraveller.com","midwestconference.org","mimaletadepeliculas.*","mmoovvfr.cloudfree.jp","motorsport.uol.com.br","musvozimbabwenews.com","mysflink.blogspot.com","nathanfromsubject.com","nationalgeographic.fr","netsentertainment.net","nobledicion.yoveo.xyz","note.sieuthuthuat.com","notformembersonly.com","oberschwaben-tipps.de","onepiecemangafree.com","onlinetntextbooks.com","onlinewatchmoviespk.*","ovcdigitalnetwork.com","paradiseislandcam.com","pcso-lottoresults.com","peiner-nachrichten.de","pelotalibrevivo.net>>","philippinenmagazin.de","photovoltaikforum.com","pickleballleagues.com","pisces-horoscopes.com","platform.adex.network","portbermudawebcam.com","primapaginamarsala.it","printablecreative.com","prod.hydra.sophos.com","quinnipiacbobcats.com","qul-de.translate.goog","radioitaliacanada.com","radioitalianmusic.com","redbluffdailynews.com","reddit-streams.online","redheaddeepthroat.com","redirect.dafontvn.com","revistaapolice.com.br","salzgitter-zeitung.de","santacruzsentinel.com","santafenewmexican.com","scriptgrowagarden.com","scrubson.blogspot.com","scrumpoker-online.org","sex-amateur-clips.com","sexybabespictures.com","shortgoo.blogspot.com","showdownforrelief.com","sinnerclownceviri.net","skorpion-horoskop.com","smartwebsolutions.org","snapinstadownload.xyz","softwarecrackguru.com","softwaredescargas.com","solomax-levelnewbie.*","solopornoitaliani.xxx","southsideshowdown.com","soziologie-politik.de","space.tribuntekno.com","stablediffusionxl.com","startupjobsportal.com","steamcrackedgames.com","stream.hownetwork.xyz","streaming-community.*","streamingcommunityz.*","studyinghuman6js.shop","supertelevisionhd.com","sweet-maturewomen.com","symboleslowianskie.pl","tapeadvertisement.com","tarjetarojaenvivo.lat","tarjetarojatvonline.*","taurus-horoscopes.com","taurus.topmanhuas.org","tech.trendingword.com","texteditor.nsspot.net","thecakeboutiquect.com","thedigitaltheater.com","thefightingcock.co.uk","thefreedictionary.com","thegnomishgazette.com","theprofoundreport.com","thetruthaboutcars.com","thewebsitesbridge.com","timesheraldonline.com","timesnewsgroup.com.au","tipsandtricksarab.com","toddpartneranimal.com","torrentdofilmeshd.net","towheaddeepthroat.com","travel-the-states.com","travelingformiles.com","tudo-para-android.com","ukiahdailyjournal.com","unsurcoenlasombra.com","utkarshonlinetest.com","vdl.np-downloader.com","virtualstudybrain.com","voyeur-pornvideos.com","walterprettytheir.com","watch.foodnetwork.com","watchcartoonsonline.*","watchfreejavonline.co","watchkobestreams.info","watchonlinemoviespk.*","watchporninpublic.com","watchseriesstream.com","weihnachts-bilder.org","wetterauer-zeitung.de","whisperingauroras.com","whittierdailynews.com","wiesbadener-kurier.de","wirtualnelegionowo.pl","worldwidestandard.net","www.dailymotion.com>>","xn--mlaregvle-02af.nu","yoima.hatenadiary.com","yoima2.hatenablog.com","zone-telechargement.*","123movies-official.net","1plus1plus1equals1.net","45er-de.translate.goog","acervodaputaria.com.br","adelaidepawnbroker.com","aimasummd.blog.fc2.com","algodaodocescan.com.br","allevertakstream.space","androidecuatoriano.xyz","appstore-discounts.com","arbitrarydecisions.com","automobile-catalog.com","batterypoweronline.com","best4hack.blogspot.com","bestialitysextaboo.com","blackamateursnaked.com","brunettedeepthroat.com","bus-location.1507t.xyz","canadianunderwriter.ca","canzoni-per-bambini.it","cartoonporncomics.info","celebritymovieblog.com","clixwarez.blogspot.com","comandotorrentshds.org","conceptoweb-studio.com","cosmonova-broadcast.tv","cotravinh.blogspot.com","cpopchanelofficial.com","currencyconverterx.com","currentrecruitment.com","dads-banging-teens.com","databasegdriveplayer.*","dewfuneralhomenews.com","diananatureforeign.com","digitalbeautybabes.com","downloadfreecourse.com","drakorkita73.kita.rest","drop.carbikenation.com","dtupgames.blogspot.com","ecommercewebsite.store","einewelteinezukunft.de","electriciansforums.net","elektrobike-online.com","elizabeth-mitchell.org","enciclopediaonline.com","eu-proxy.startpage.com","eurointegration.com.ua","exclusiveasianporn.com","exgirlfriendmarket.com","ezaudiobookforsoul.com","f150lightningforum.com","fantasticyoungporn.com","filmeserialeonline.org","freelancerartistry.com","freepic-downloader.com","freepik-downloader.com","ftlauderdalewebcam.com","games.besthealthmag.ca","games.heraldonline.com","games.islandpacket.com","games.journal-news.com","games.readersdigest.ca","gewinnspiele-markt.com","gifhorner-rundschau.de","girlfriendsexphoto.com","golink.bloggerishyt.in","hentai-cosplay-xxx.com","hentai-vl.blogspot.com","hiraethtranslation.com","hockeyfantasytools.com","hopsion-consulting.com","hotanimepornvideos.com","housethathankbuilt.com","illustratemagazine.com","imagetwist.netlify.app","incontri-in-italia.com","indianpornvideo.online","insidekstatesports.com","insidekstatesports.net","insidekstatesports.org","irasutoya.blogspot.com","jacquieetmicheltv2.net","jeepgladiatorforum.com","jessicaglassauthor.com","jonathansociallike.com","juegos.eleconomista.es","juneauharborwebcam.com","k-statewomenshoops.com","k-statewomenshoops.net","k-statewomenshoops.org","kenkou-maintenance.com","kristiesoundsimply.com","lagacetadesalamanca.es","lecourrier-du-soir.com","livefootballempire.com","livingincebuforums.com","lonestarconference.org","m.bloggingguidance.com","marissasharecareer.com","marketedgeofficial.com","marketplace.nvidia.com","masterpctutoriales.com","megadrive-emulator.com","meteoregioneabruzzo.it","mini.surveyenquete.net","moneywar2.blogspot.com","muleriderathletics.com","nathanmichaelphoto.com","newbookmarkingsite.com","nilopolisonline.com.br","obutecodanet.ig.com.br","oeffnungszeitenbuch.de","onlinetechsamadhan.com","onlinevideoconverter.*","opiniones-empresas.com","oracleerpappsguide.com","originalindianporn.com","osint-info.netlify.app","paginadanoticia.com.br","philadelphiaeagles.com","pianetamountainbike.it","pittsburghpanthers.com","plagiarismdetector.net","play.discoveryplus.com","portstthomaswebcam.com","poweredbycovermore.com","praxis-jugendarbeit.de","principiaathletics.com","puzzles.standard.co.uk","puzzles.sunjournal.com","radioamericalatina.com","redlandsdailyfacts.com","republicain-lorrain.fr","rubyskitchenrecipes.uk","russkoevideoonline.com","salisburyjournal.co.uk","schwarzwaelder-bote.de","scorpio-horoscopes.com","sexyasianteenspics.com","smallpocketlibrary.com","smartfeecalculator.com","sms-receive-online.com","strangernervousql.shop","streamhentaimovies.com","stuttgarter-zeitung.de","supermarioemulator.com","tastefullyeclectic.com","tatacommunications.com","techieway.blogspot.com","teluguhitsandflops.com","thatballsouttahere.com","the-military-guide.com","thecartoonporntube.com","thehouseofportable.com","tipsandtricksjapan.com","tipsandtrickskorea.com","totalsportek1000.com>>","turkishaudiocenter.com","tutoganga.blogspot.com","tvchoicemagazine.co.uk","unity3diy.blogspot.com","universitiesonline.xyz","universityequality.com","watchdocumentaries.com","webcreator-journal.com","welsh-dictionary.ac.uk","xhamster-sexvideos.com","xn--algododoce-j5a.com","youfiles.herokuapp.com","yourdesignmagazine.com","zeeebatch.blogspot.com","aachener-nachrichten.de","adblockeronstreamtape.*","adrianmissionminute.com","ads-ti9ni4.blogspot.com","adultgamescollector.com","alejandrocenturyoil.com","alleneconomicmatter.com","allschoolboysecrets.com","aquarius-horoscopes.com","arcade.dailygazette.com","asianteenagefucking.com","auto-motor-und-sport.de","barranquillaestereo.com","bestbondagevideos.com>>","bestpuzzlesandgames.com","betterbuttchallenge.com","bikyonyu-bijo-zukan.com","brasilsimulatormods.com","buerstaedter-zeitung.de","c--ix-de.translate.goog","careersatcouncil.com.au","cloudapps.herokuapp.com","coolsoft.altervista.org","creditcardgenerator.com","dameungrrr.videoid.baby","destinationsjourney.com","dokuo666.blog98.fc2.com","edgedeliverynetwork.com","elperiodicodearagon.com","encurtador.postazap.com","entertainment-focus.com","escortconrecensione.com","eservice.directauto.com","eskiceviri.blogspot.com","exclusiveindianporn.com","fightforthealliance.com","financeandinsurance.xyz","footballtransfer.com.ua","fourchette-et-bikini.fr","freefiremaxofficial.com","freemovies-download.com","freepornhdonlinegay.com","funeralmemorialnews.com","gamersdiscussionhub.com","games.mercedsunstar.com","games.pressdemocrat.com","games.sanluisobispo.com","games.star-telegram.com","gamingsearchjournal.com","giessener-allgemeine.de","goctruyentranhvui17.com","heatherwholeinvolve.com","historyofroyalwomen.com","homeschoolgiveaways.com","ilgeniodellostreaming.*","india.mplandrecord.info","influencersgonewild.com","insidekstatesports.info","integral-calculator.com","investmentwatchblog.com","iptvdroid1.blogspot.com","jefferycontrolmodel.com","juegosdetiempolibre.org","julieseatsandtreats.com","kennethofficialitem.com","keysbrasil.blogspot.com","keywestharborwebcam.com","kutubistan.blogspot.com","lancewhosedifficult.com","laurelberninteriors.com","legendaryrttextures.com","linklog.tiagorangel.com","lirik3satu.blogspot.com","loldewfwvwvwewefdw.cyou","megaplayer.bokracdn.run","metamani.blog15.fc2.com","miltonfriedmancores.org","ministryofsolutions.com","mobile-tracker-free.com","mobileweb.bankmellat.ir","morganoperationface.com","morrisvillemustangs.com","mountainbike-magazin.de","movielinkbdofficial.com","mrfreemium.blogspot.com","naumburger-tageblatt.de","newlifefuneralhomes.com","news-und-nachrichten.de","northwalespioneer.co.uk","nudeblackgirlfriend.com","nutraceuticalsworld.com","onlinesoccermanager.com","osteusfilmestuga.online","pandajogosgratis.com.br","paradehomeandgarden.com","patriotathleticfund.com","pcoptimizedsettings.com","pepperlivestream.online","phonenumber-lookup.info","player.bestrapeporn.com","player.smashystream.com","player.tormalayalamhd.*","player.xxxbestsites.com","portaldosreceptores.org","portcanaveralwebcam.com","portstmaartenwebcam.com","pramejarab.blogspot.com","predominantlyorange.com","premierfantasytools.com","prepared-housewives.com","privateindianmovies.com","programmingeeksclub.com","puzzles.pressherald.com","receive-sms-online.info","rppk13baru.blogspot.com","searchenginereports.net","seoul-station-druid.com","sexyteengirlfriends.net","sexywomeninlingerie.com","shannonpersonalcost.com","singlehoroskop-loewe.de","snowman-information.com","spacestation-online.com","sqlserveregitimleri.com","streamtapeadblockuser.*","talentstareducation.com","teamupinternational.com","tech.pubghighdamage.com","the-voice-of-germany.de","thechroniclesofhome.com","thehappierhomemaker.com","theinternettaughtme.com","tinycat-voe-fashion.com","tips97tech.blogspot.com","traderepublic.community","tutorialesdecalidad.com","valuable.hatenablog.com","verteleseriesonline.com","watchseries.unblocked.*","wiesbadener-tagblatt.de","windowsaplicaciones.com","xxxjapaneseporntube.com","youtube4kdownloader.com","zonamarela.blogspot.com","zone-telechargement.ing","zoomtventertainment.com","720pxmovies.blogspot.com","abendzeitung-muenchen.de","advertiserandtimes.co.uk","afilmyhouse.blogspot.com","altebwsneno.blogspot.com","anime4mega-descargas.net","aspirapolveremigliori.it","ate60vs7zcjhsjo5qgv8.com","atlantichockeyonline.com","aussenwirtschaftslupe.de","bestialitysexanimals.com","boundlessnecromancer.com","broadbottomvillage.co.uk","businesssoftwarehere.com","canonprintersdrivers.com","cardboardtranslation.com","celebrityleakednudes.com","childrenslibrarylady.com","cimbusinessevents.com.au","cle0desktop.blogspot.com","cloudcomputingtopics.net","culture-informatique.net","cybertruckownersclub.com","democratandchronicle.com","dictionary.cambridge.org","dictionnaire-medical.net","dominican-republic.co.il","downloads.wegomovies.com","downloadtwittervideo.com","dsocker1234.blogspot.com","einrichtungsbeispiele.de","fid-gesundheitswissen.de","freegrannypornmovies.com","freehdinterracialporn.in","ftlauderdalebeachcam.com","futbolenlatelevision.com","galaxytranslations10.com","games.crosswordgiant.com","games.idahostatesman.com","games.thenewstribune.com","games.tri-cityherald.com","gcertificationcourse.com","gelnhaeuser-tageblatt.de","general-anzeiger-bonn.de","greenbaypressgazette.com","hentaianimedownloads.com","hilfen-de.translate.goog","hotmaturegirlfriends.com","inlovingmemoriesnews.com","inmatefindcalifornia.com","insurancebillpayment.net","intelligence-console.com","jacquieetmichelelite.com","jasonresponsemeasure.com","josephseveralconcern.com","juegos.elnuevoherald.com","jumpmanclubbrasil.com.br","lampertheimer-zeitung.de","latribunadeautomocion.es","lauterbacher-anzeiger.de","lespassionsdechinouk.com","liveanimalporn.zooo.club","mariatheserepublican.com","mediapemersatubangsa.com","meine-anzeigenzeitung.de","mentalhealthcoaching.org","minecraft-serverlist.net","moalm-qudwa.blogspot.com","multivideodownloader.com","my-code4you.blogspot.com","noblessetranslations.com","nutraingredients-usa.com","nyangames.altervista.org","oberhessische-zeitung.de","onlinetv.planetfools.com","personality-database.com","phenomenalityuniform.com","philly.arkadiumarena.com","photos-public-domain.com","player.subespanolvip.com","polseksongs.blogspot.com","portevergladeswebcam.com","programasvirtualespc.net","puzzles.centralmaine.com","quelleestladifference.fr","reddit-soccerstreams.com","renierassociatigroup.com","riprendiamocicatania.com","roadrunnersathletics.com","robertordercharacter.com","sandiegouniontribune.com","senaleszdhd.blogspot.com","shoppinglys.blogspot.com","smotret-porno-onlain.com","softdroid4u.blogspot.com","the-crossword-solver.com","thebharatexpressnews.com","thedesigninspiration.com","therelaxedhomeschool.com","thunderousintentions.com","tirumalatirupatiyatra.in","tubeinterracial-porn.com","unityassetcollection.com","upscaler.stockphotos.com","ustreasuryyieldcurve.com","verpeliculasporno.gratis","virginmediatelevision.ie","watchdoctorwhoonline.com","watchtrailerparkboys.com","workproductivityinfo.com","actionviewphotography.com","arabic-robot.blogspot.com","bharatsarkarijobalert.com","blog.receivefreesms.co.uk","braunschweiger-zeitung.de","businessnamegenerator.com","caroloportunidades.com.br","christopheruntilpoint.com","constructionplacement.org","convert-case.softbaba.com","cooldns-de.translate.goog","ctrmarketingsolutions.com","depo-program.blogspot.com","derivative-calculator.net","devere-group-hongkong.com","devoloperxda.blogspot.com","dictionnaire.lerobert.com","everydayhomeandgarden.com","fantasyfootballgeek.co.uk","fitnesshealtharticles.com","footballleagueworld.co.uk","fotografareindigitale.com","freeserverhostingweb.club","freewatchserialonline.com","game-kentang.blogspot.com","games.daytondailynews.com","games.gameshownetwork.com","games.lancasteronline.com","games.ledger-enquirer.com","games.moviestvnetwork.com","games.theportugalnews.com","gloucestershirelive.co.uk","graceaddresscommunity.com","heatherdiscussionwhen.com","housecardsummerbutton.com","kathleenmemberhistory.com","koume-in-huistenbosch.net","krankheiten-simulieren.de","lancashiretelegraph.co.uk","latribunadelpaisvasco.com","mega-hentai2.blogspot.com","nutraingredients-asia.com","oeffentlicher-dienst.info","oneessentialcommunity.com","onepiece-manga-online.net","passionatecarbloggers.com","percentagecalculator.guru","pickleballteamleagues.com","pickleballtournaments.com","printedelectronicsnow.com","programmiedovetrovarli.it","projetomotog.blogspot.com","puzzles.independent.co.uk","realcanadiansuperstore.ca","receitasoncaseiras.online","schooltravelorganiser.com","scripcheck.great-site.net","searchmovie.wp.xdomain.jp","sentinelandenterprise.com","seogroup.bookmarking.info","silverpetticoatreview.com","softwaresolutionshere.com","sofwaremania.blogspot.com","telenovelas-turcas.com.es","thebeginningaftertheend.*","transparentcalifornia.com","truesteamachievements.com","tucsitupdate.blogspot.com","ultimateninjablazingx.com","usahealthandlifestyle.com","vercanalesdominicanos.com","vintage-erotica-forum.com","whatisareverseauction.com","xn--k9ja7fb0161b5jtgfm.jp","youtubemp3donusturucu.net","yusepjaelani.blogspot.com","a-b-f-dd-aa-bb-cctwd3a.fun","a-b-f-dd-aa-bb-ccyh5my.fun","arena.gamesforthebrain.com","audiobookexchangeplace.com","avengerinator.blogspot.com","barefeetonthedashboard.com","basseqwevewcewcewecwcw.xyz","bezpolitickekorektnosti.cz","bibliotecahermetica.com.br","change-ta-vie-coaching.com","collegefootballplayoff.com","cornerstoneconfessions.com","cotannualconference.org.uk","cuatrolatastv.blogspot.com","dinheirocursosdownload.com","downloads.sayrodigital.net","edinburghnews.scotsman.com","elperiodicoextremadura.com","flashplayer.fullstacks.net","former-railroad-worker.com","frankfurter-wochenblatt.de","funnymadworld.blogspot.com","games.bellinghamherald.com","games.everythingzoomer.com","helmstedter-nachrichten.de","html5.gamedistribution.com","investigationdiscovery.com","istanbulescortnetworks.com","jilliandescribecompany.com","johnwardflighttraining.com","mailtool-de.translate.goog","motive213link.blogspot.com","musicbusinessworldwide.com","noticias.gospelmais.com.br","nutraingredients-latam.com","photoshopvideotutorial.com","puzzles.bestforpuzzles.com","recetas.arrozconleche.info","redditsoccerstreams.name>>","ripleyfieldworktracker.com","riverdesdelatribuna.com.ar","sagittarius-horoscopes.com","skillmineopportunities.com","stuttgarter-nachrichten.de","sulocale.sulopachinews.com","thelastgamestandingexp.com","thetelegraphandargus.co.uk","tiendaenlinea.claro.com.ni","todoseriales1.blogspot.com","tokoasrimotedanpayet.my.id","tralhasvarias.blogspot.com","video-to-mp3-converter.com","watchimpracticaljokers.com","whowantstuffs.blogspot.com","windowcleaningforums.co.uk","wolfenbuetteler-zeitung.de","wolfsburger-nachrichten.de","brittneystandardwestern.com","celestialtributesonline.com","charlottepilgrimagetour.com","choose.kaiserpermanente.org","cloud-computing-central.com","cointiply.arkadiumarena.com","constructionmethodology.com","cool--web-de.translate.goog","domainregistrationtips.info","download.kingtecnologia.com","dramakrsubindo.blogspot.com","elperiodicomediterraneo.com","embed.nextgencloudtools.com","evlenmekisteyenbayanlar.net","flash-firmware.blogspot.com","games.myrtlebeachonline.com","ge-map-overlays.appspot.com","happypenguin.altervista.org","iphonechecker.herokuapp.com","littlepandatranslations.com","lurdchinexgist.blogspot.com","newssokuhou666.blog.fc2.com","parametric-architecture.com","pasatiemposparaimprimir.com","practicalpainmanagement.com","puzzles.crosswordsolver.org","redcarpet-fashionawards.com","richardquestionbuilding.com","sztucznainteligencjablog.pl","thewestmorlandgazette.co.uk","timesofindia.indiatimes.com","watchfootballhighlights.com","watchmalcolminthemiddle.com","watchonlyfoolsandhorses.com","your-local-pest-control.com","centrocommercialevulcano.com","conoscereilrischioclinico.it","correction-livre-scolaire.fr","economictimes.indiatimes.com","emperorscan.mundoalterno.org","games.springfieldnewssun.com","gps--cache-de.translate.goog","imagenesderopaparaperros.com","lizs-early-learning-spot.com","locurainformaticadigital.com","michiganrugcleaning.cleaning","mimaletamusical.blogspot.com","net--tools-de.translate.goog","net--tours-de.translate.goog","pekalongan-cits.blogspot.com","publicrecords.netronline.com","skibiditoilet.yourmom.eu.org","springfieldspringfield.co.uk","teachersguidetn.blogspot.com","tekken8combo.kagewebsite.com","theeminenceinshadowmanga.com","uptodatefinishconference.com","watchonlinemovies.vercel.app","www-daftarharga.blogspot.com","youkaiwatch2345.blog.fc2.com","bayaningfilipino.blogspot.com","beautypageants.indiatimes.com","counterstrike-hack.leforum.eu","dev-dark-blog.pantheonsite.io","educationtips213.blogspot.com","fun--seiten-de.translate.goog","hortonanderfarom.blogspot.com","panlasangpinoymeatrecipes.com","pharmaceutical-technology.com","play.virginmediatelevision.ie","pressurewasherpumpdiagram.com","thefreedommatrix.blogspot.com","walkthrough-indo.blogspot.com","web--spiele-de.translate.goog","wojtekczytawh40k.blogspot.com","caq21harderv991gpluralplay.xyz","comousarzararadio.blogspot.com","coolsoftware-de.translate.goog","hipsteralcolico.altervista.org","jennifercertaindevelopment.com","kryptografie-de.translate.goog","mp3songsdownloadf.blogspot.com","noicetranslations.blogspot.com","oxfordlearnersdictionaries.com","pengantartidurkuh.blogspot.com","photo--alben-de.translate.goog","rheinische-anzeigenblaetter.de","thelibrarydigital.blogspot.com","touhoudougamatome.blog.fc2.com","watchcalifornicationonline.com","wwwfotografgotlin.blogspot.com","bigclatterhomesguideservice.com","bitcoinminingforex.blogspot.com","cool--domains-de.translate.goog","ibecamethewifeofthemalelead.com","pickcrackpasswords.blogspot.com","posturecorrectorshop-online.com","safeframe.googlesyndication.com","sozialversicherung-kompetent.de","utilidades.ecuadjsradiocorp.com","akihabarahitorigurasiseikatu.com","deletedspeedstreams.blogspot.com","freesoftpdfdownload.blogspot.com","games.games.newsgames.parade.com","insuranceloan.akbastiloantips.in","situsberita2terbaru.blogspot.com","such--maschine-de.translate.goog","uptodatefinishconferenceroom.com","games.charlottegames.cnhinews.com","loadsamusicsarchives.blogspot.com","pythonmatplotlibtips.blogspot.com","ragnarokscanlation.opchapters.com","tw.xn--h9jepie9n6a5394exeq51z.com","papagiovannipaoloii.altervista.org","softwareengineer-de.translate.goog","rojadirecta-tv-en-vivo.blogspot.com","thenightwithoutthedawn.blogspot.com","tenseishitaraslimedattaken-manga.com","wetter--vorhersage-de.translate.goog","marketing-business-revenus-internet.fr","hardware--entwicklung-de.translate.goog","xn--n8jwbyc5ezgnfpeyd3i0a3ow693bw65a.com","sharpen-free-design-generator.netlify.app","a-b-c-d-e-f9jeats0w5hf22jbbxcrpnq37qq6nbxjwypsy.fun"];

const $scriptletFromRegexes$ = /* 8 */ ["-embed.c","^moon(?:-[a-z0-9]+)?-embed\\.com$","56,57","moonfile","^moonfile-[a-z0-9-]+\\.com$","56,57",".","^[0-9a-z]{5,8}\\.(art|cfd|fun|icu|info|live|pro|sbs|world)$","56,57","-mkay.co","^moo-[a-z0-9]+(-[a-z0-9]+)*-mkay\\.com$","56,57","file-","^file-[a-z0-9]+(-[a-z0-9]+)*-(moon|embed)\\.com$","56,57","-moo.com","^fle-[a-z0-9]+(-[a-z0-9]+)*-moo\\.com$","56,57","filemoon","^filemoon-[a-z0-9]+(?:-[a-z0-9]+)*\\.(?:com|xyz)$","56,57","tamilpri","(\\d{0,1})?tamilprint(\\d{1,2})?\\.[a-z]{3,7}","107,1532,2439"];

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
