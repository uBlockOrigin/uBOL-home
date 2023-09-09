/*******************************************************************************

    uBlock Origin - a browser extension to block requests.
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

/* jshint esversion:11 */
/* global cloneInto */

'use strict';

// ruleset: swe-1

/******************************************************************************/

// Important!
// Isolate from global scope

// Start of local scope
(( ) => {

/******************************************************************************/

// Start of code to inject
const uBOL_jsonPrune = function() {

const scriptletGlobals = new Map(); // jshint ignore: line

const argsList = [["autoplay"],["autoplay players.*.ga acl.ads players.*.autoplay"],["payload.ads campaigns.*"],["analytics googleAnalytics theme.siteOptions.ad_links.* theme.siteOptions.casino_page_description theme.siteOptions.casino_page_partner"]];

const hostnamesMap = new Map([["alekuriren.se",0],["allas.se",0],["alltforforaldrar.se",0],["baaam.se",0],["babyhjalp.se",0],["barometern.se",0],["blt.se",0],["bt.se",0],["byrum.se",0],["cafe.se",0],["corren.se",0],["di.se",0],["ekuriren.se",0],["elle.se",0],["eposten.se",0],["expressen.se",0],["familjeliv.se",0],["femina.se",0],["folkbladet.nu",0],["folkbladet.se",0],["fragbite.se",0],["frida.se",0],["golfing.se",0],["gotlandjustnu.se",0],["hant.se",0],["helagotland.se",0],["ibnytt.se",0],["kalmarposten.se",0],["kindaposten.se",0],["kingmagazine.se",0],["kkuriren.se",0],["klt.nu",0],["kristianstadsbladet.se",0],["kuriren.nu",0],["lchfarkivet.se",0],["lokalti.se",0],["lokaltidningen.nu",0],["mabra.com",0],["mellanbygden.nu",0],["meraosterlen.se",0],["mestmotor.se",0],["mitti.se",0],["motherhood.se",0],["mvt.se",0],["nordsverige.se",0],["norrahalland.se",0],["norran.se",0],["nsd.se",0],["nsk.se",0],["nt.se",0],["nyheter24.se",0],["olandsbladet.se",0],["praktisktbatagande.se",0],["pt.se",0],["realtid.se",0],["recept.se",0],["residencemagazine.se",0],["skd.se",0],["smp.se",0],["sn.se",0],["strengnastidning.se",0],["svenskdam.se",0],["svenskgolf.se",0],["sverigespringer.se",0],["sydostran.se",0],["thelocal.se",0],["trelleborgsallehanda.se",0],["unt.se",0],["ut.se",0],["vasterastidning.se",0],["vasterbottningen.se",0],["vaxjobladet.se",0],["viivilla.se",0],["vimmerbytidning.se",0],["vk.se",0],["vt.se",0],["vxonews.se",0],["youplay.se",0],["ystadsallehanda.se",0],["alingsastidning.se",1],["bohuslaningen.se",1],["gp.se",1],["hallandsposten.se",1],["harrydaposten.se",1],["hn.se",1],["kungalvsposten.se",1],["kungsbackaposten.se",1],["lwcdn.com",1],["markposten.se",1],["molndalsposten.se",1],["partilletidning.se",1],["stromstadstidning.se",1],["sttidningen.se",1],["ttela.se",1],["matspar.se",2],["samnytt.se",3]]);

const entitiesMap = new Map([]);

const exceptionsMap = new Map([]);

/******************************************************************************/

function jsonPrune(
    rawPrunePaths = '',
    rawNeedlePaths = '',
    stackNeedle = ''
) {
    const safe = safeSelf();
    const stackNeedleDetails = safe.initPattern(stackNeedle, { canNegate: true });
    const extraArgs = safe.getExtraArgs(Array.from(arguments), 3);
    JSON.parse = new Proxy(JSON.parse, {
        apply: function(target, thisArg, args) {
            const objBefore = Reflect.apply(target, thisArg, args);
            const objAfter = objectPrune(
                objBefore,
                rawPrunePaths,
                rawNeedlePaths,
                stackNeedleDetails,
                extraArgs
           );
           return objAfter || objBefore;
        },
    });
}

function matchObjectProperties(propNeedles, ...objs) {
    if ( matchObjectProperties.extractProperties === undefined ) {
        matchObjectProperties.extractProperties = (src, des, props) => {
            for ( const p of props ) {
                const v = src[p];
                if ( v === undefined ) { continue; }
                des[p] = src[p];
            }
        };
    }
    const safe = safeSelf();
    const haystack = {};
    const props = Array.from(propNeedles.keys());
    for ( const obj of objs ) {
        if ( obj instanceof Object === false ) { continue; }
        matchObjectProperties.extractProperties(obj, haystack, props);
    }
    for ( const [ prop, details ] of propNeedles ) {
        let value = haystack[prop];
        if ( value === undefined ) { continue; }
        if ( typeof value !== 'string' ) {
            try { value = JSON.stringify(value); }
            catch(ex) { }
            if ( typeof value !== 'string' ) { continue; }
        }
        if ( safe.testPattern(details, value) ) { continue; }
        return false;
    }
    return true;
}

function objectPrune(
    obj,
    rawPrunePaths,
    rawNeedlePaths,
    stackNeedleDetails = { matchAll: true },
    extraArgs = {}
) {
    if ( typeof rawPrunePaths !== 'string' ) { return; }
    const safe = safeSelf();
    const prunePaths = rawPrunePaths !== ''
        ? rawPrunePaths.split(/ +/)
        : [];
    const needlePaths = prunePaths.length !== 0 && rawNeedlePaths !== ''
        ? rawNeedlePaths.split(/ +/)
        : [];
    const logLevel = shouldLog({ log: rawPrunePaths === '' || extraArgs.log });
    const reLogNeedle = safe.patternToRegex(logLevel === true ? rawNeedlePaths : '');
    if ( stackNeedleDetails.matchAll !== true ) {
        if ( matchesStackTrace(stackNeedleDetails, extraArgs.logstack) === false ) {
            return;
        }
    }
    if ( objectPrune.findOwner === undefined ) {
        objectPrune.findOwner = (root, path, prune = false) => {
            let owner = root;
            let chain = path;
            for (;;) {
                if ( typeof owner !== 'object' || owner === null  ) { return false; }
                const pos = chain.indexOf('.');
                if ( pos === -1 ) {
                    if ( prune === false ) {
                        return owner.hasOwnProperty(chain);
                    }
                    let modified = false;
                    if ( chain === '*' ) {
                        for ( const key in owner ) {
                            if ( owner.hasOwnProperty(key) === false ) { continue; }
                            delete owner[key];
                            modified = true;
                        }
                    } else if ( owner.hasOwnProperty(chain) ) {
                        delete owner[chain];
                        modified = true;
                    }
                    return modified;
                }
                const prop = chain.slice(0, pos);
                if (
                    prop === '[]' && Array.isArray(owner) ||
                    prop === '*' && owner instanceof Object
                ) {
                    const next = chain.slice(pos + 1);
                    let found = false;
                    for ( const key of Object.keys(owner) ) {
                        found = objectPrune.findOwner(owner[key], next, prune) || found;
                    }
                    return found;
                }
                if ( owner.hasOwnProperty(prop) === false ) { return false; }
                owner = owner[prop];
                chain = chain.slice(pos + 1);
            }
        };
        objectPrune.mustProcess = (root, needlePaths) => {
            for ( const needlePath of needlePaths ) {
                if ( objectPrune.findOwner(root, needlePath) === false ) {
                    return false;
                }
            }
            return true;
        };
        objectPrune.logJson = (json, msg, reNeedle) => {
            if ( reNeedle.test(json) === false ) { return; }
            safeSelf().uboLog(`objectPrune()`, msg, location.hostname, json);
        };
    }
    const jsonBefore = logLevel ? JSON.stringify(obj, null, 2) : '';
    if ( logLevel === true || logLevel === 'all' ) {
        objectPrune.logJson(jsonBefore, `prune:"${rawPrunePaths}" log:"${logLevel}"`, reLogNeedle);
    }
    if ( prunePaths.length === 0 ) { return; }
    let outcome = 'nomatch';
    if ( objectPrune.mustProcess(obj, needlePaths) ) {
        for ( const path of prunePaths ) {
            if ( objectPrune.findOwner(obj, path, true) ) {
                outcome = 'match';
            }
        }
    }
    if ( logLevel === outcome ) {
        objectPrune.logJson(jsonBefore, `prune:"${rawPrunePaths}" log:"${logLevel}"`, reLogNeedle);
    }
    if ( outcome === 'match' ) { return obj; }
}

function parsePropertiesToMatch(propsToMatch, implicit = '') {
    const safe = safeSelf();
    const needles = new Map();
    if ( propsToMatch === undefined || propsToMatch === '' ) { return needles; }
    const options = { canNegate: true };
    for ( const needle of propsToMatch.split(/\s+/) ) {
        const [ prop, pattern ] = needle.split(':');
        if ( prop === '' ) { continue; }
        if ( pattern !== undefined ) {
            needles.set(prop, safe.initPattern(pattern, options));
        } else if ( implicit !== '' ) {
            needles.set(implicit, safe.initPattern(prop, options));
        }
    }
    return needles;
}

function safeSelf() {
    if ( scriptletGlobals.has('safeSelf') ) {
        return scriptletGlobals.get('safeSelf');
    }
    const self = globalThis;
    const safe = {
        'Error': self.Error,
        'Object_defineProperty': Object.defineProperty.bind(Object),
        'RegExp': self.RegExp,
        'RegExp_test': self.RegExp.prototype.test,
        'RegExp_exec': self.RegExp.prototype.exec,
        'XMLHttpRequest': self.XMLHttpRequest,
        'addEventListener': self.EventTarget.prototype.addEventListener,
        'removeEventListener': self.EventTarget.prototype.removeEventListener,
        'fetch': self.fetch,
        'jsonParse': self.JSON.parse.bind(self.JSON),
        'jsonStringify': self.JSON.stringify.bind(self.JSON),
        'log': console.log.bind(console),
        uboLog(...args) {
            if ( args.length === 0 ) { return; }
            if ( `${args[0]}` === '' ) { return; }
            this.log('[uBO]', ...args);
        },
        initPattern(pattern, options = {}) {
            if ( pattern === '' ) {
                return { matchAll: true };
            }
            const expect = (options.canNegate === true && pattern.startsWith('!') === false);
            if ( expect === false ) {
                pattern = pattern.slice(1);
            }
            const match = /^\/(.+)\/([gimsu]*)$/.exec(pattern);
            if ( match !== null ) {
                return {
                    pattern,
                    re: new this.RegExp(
                        match[1],
                        match[2] || options.flags
                    ),
                    expect,
                };
            }
            return {
                pattern,
                re: new this.RegExp(pattern.replace(
                    /[.*+?^${}()|[\]\\]/g, '\\$&'),
                    options.flags
                ),
                expect,
            };
        },
        testPattern(details, haystack) {
            if ( details.matchAll ) { return true; }
            return this.RegExp_test.call(details.re, haystack) === details.expect;
        },
        patternToRegex(pattern, flags = undefined) {
            if ( pattern === '' ) { return /^/; }
            const match = /^\/(.+)\/([gimsu]*)$/.exec(pattern);
            if ( match === null ) {
                return new RegExp(pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), flags);
            }
            try {
                return new RegExp(match[1], match[2] || flags);
            }
            catch(ex) {
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
            return Object.fromEntries(entries);
        },
    };
    scriptletGlobals.set('safeSelf', safe);
    return safe;
}

function shouldLog(details) {
    if ( details instanceof Object === false ) { return false; }
    return scriptletGlobals.has('canDebug') && details.log;
}

function matchesStackTrace(
    needleDetails,
    logLevel = 0
) {
    const safe = safeSelf();
    const exceptionToken = getExceptionToken();
    const error = new safe.Error(exceptionToken);
    const docURL = new URL(self.location.href);
    docURL.hash = '';
    // Normalize stack trace
    const reLine = /(.*?@)?(\S+)(:\d+):\d+\)?$/;
    const lines = [];
    for ( let line of error.stack.split(/[\n\r]+/) ) {
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
    const r = safe.testPattern(needleDetails, stack);
    if (
        logLevel === 1 ||
        logLevel === 2 && r ||
        logLevel === 3 && !r
    ) {
        safe.uboLog(stack.replace(/\t/g, '\n'));
    }
    return r;
}

function getExceptionToken() {
    const token =
        String.fromCharCode(Date.now() % 26 + 97) +
        Math.floor(Math.random() * 982451653 + 982451653).toString(36);
    const oe = self.onerror;
    self.onerror = function(msg, ...args) {
        if ( typeof msg === 'string' && msg.includes(token) ) { return true; }
        if ( oe instanceof Function ) {
            return oe.call(this, msg, ...args);
        }
    }.bind();
    return token;
}

/******************************************************************************/

const hnParts = [];
try { hnParts.push(...document.location.hostname.split('.')); }
catch(ex) { }
const hnpartslen = hnParts.length;
if ( hnpartslen === 0 ) { return; }

const todoIndices = new Set();
const tonotdoIndices = [];

// Exceptions
if ( exceptionsMap.size !== 0 ) {
    for ( let i = 0; i < hnpartslen; i++ ) {
        const hn = hnParts.slice(i).join('.');
        const excepted = exceptionsMap.get(hn);
        if ( excepted ) { tonotdoIndices.push(...excepted); }
    }
    exceptionsMap.clear();
}

// Hostname-based
if ( hostnamesMap.size !== 0 ) {
    const collectArgIndices = hn => {
        let argsIndices = hostnamesMap.get(hn);
        if ( argsIndices === undefined ) { return; }
        if ( typeof argsIndices === 'number' ) { argsIndices = [ argsIndices ]; }
        for ( const argsIndex of argsIndices ) {
            if ( tonotdoIndices.includes(argsIndex) ) { continue; }
            todoIndices.add(argsIndex);
        }
    };
    for ( let i = 0; i < hnpartslen; i++ ) {
        const hn = hnParts.slice(i).join('.');
        collectArgIndices(hn);
    }
    collectArgIndices('*');
    hostnamesMap.clear();
}

// Entity-based
if ( entitiesMap.size !== 0 ) {
    const n = hnpartslen - 1;
    for ( let i = 0; i < n; i++ ) {
        for ( let j = n; j > i; j-- ) {
            const en = hnParts.slice(i,j).join('.');
            let argsIndices = entitiesMap.get(en);
            if ( argsIndices === undefined ) { continue; }
            if ( typeof argsIndices === 'number' ) { argsIndices = [ argsIndices ]; }
            for ( const argsIndex of argsIndices ) {
                if ( tonotdoIndices.includes(argsIndex) ) { continue; }
                todoIndices.add(argsIndex);
            }
        }
    }
    entitiesMap.clear();
}

// Apply scriplets
for ( const i of todoIndices ) {
    try { jsonPrune(...argsList[i]); }
    catch(ex) {}
}
argsList.length = 0;

/******************************************************************************/

};
// End of code to inject

/******************************************************************************/

// Inject code

// https://bugzilla.mozilla.org/show_bug.cgi?id=1736575
//   'MAIN' world not yet supported in Firefox, so we inject the code into
//   'MAIN' ourself when environment in Firefox.

// Not Firefox
if ( typeof wrappedJSObject !== 'object' ) {
    return uBOL_jsonPrune();
}

// Firefox
{
    const page = self.wrappedJSObject;
    let script, url;
    try {
        page.uBOL_jsonPrune = cloneInto([
            [ '(', uBOL_jsonPrune.toString(), ')();' ],
            { type: 'text/javascript; charset=utf-8' },
        ], self);
        const blob = new page.Blob(...page.uBOL_jsonPrune);
        url = page.URL.createObjectURL(blob);
        const doc = page.document;
        script = doc.createElement('script');
        script.async = false;
        script.src = url;
        (doc.head || doc.documentElement || doc).append(script);
    } catch (ex) {
        console.error(ex);
    }
    if ( url ) {
        if ( script ) { script.remove(); }
        page.URL.revokeObjectURL(url);
    }
    delete page.uBOL_jsonPrune;
}

/******************************************************************************/

// End of local scope
})();

/******************************************************************************/

void 0;