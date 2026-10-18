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

// ruleset: irn-0

// Important!
// Isolate from global scope

// Start of local scope
(function uBOL_scriptlets($SECRET_ID$) {

/******************************************************************************/

const scriptletGlobals = self[$SECRET_ID$];

if ( scriptletGlobals.origins.length === 0 ) { return; }

/******************************************************************************/

const $hasHostnames$ = true;
const $hasEntities$ = false;
const $hasAncestors$ = false;
const $hasRegexes$ = false;

/******************************************************************************/

const todo = new Set();

if ( $hasHostnames$ ) {
    const scriptletHostnames = /* 22 */ ["rasm.io","tgju.org","kihanb.ir","aparat.com","sclinic.ir","vaamfaa.ir","virgool.io","fontchi.com","tamasha.com","delta3da.cam","najiremix.ir","hamtamovie.nl","musiceman.net","offerdaily.ir","persian-fa.ir","tarafdari.com","uploadboy.com","web.eitaa.com","iran-music.com","shahanmusic.ir","search.bertina.ir","public-psychology.ir"];
    const collectArglistRefIndices = (out, hn, r) => {
        let l = 0, i = 0, d = 0;
        let candidate = '';
        while ( l < r ) {
            i = l + r >>> 1;
            candidate = scriptletHostnames[i];
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
        let r = scriptletHostnames.length;
        for ( const hn of hnDetails.hns ) {
            r = collectArglistRefIndices(out, `${hn}${suffix}`, r);
        }
        if ( $hasEntities$ ) {
            let r = scriptletHostnames.length;
            for ( const en of hnDetails.ens ) {
                r = collectArglistRefIndices(out, `${en}${suffix}`, r);
            }
        }
    };
    const todoIndices = new Set();
    indicesFromHostname(todoIndices, scriptletGlobals.origins[0]);
    if ( $hasAncestors$ ) {
        for ( const entry of scriptletGlobals.origins ) {
            if ( entry.i === 0 ) { continue; }
            indicesFromHostname(todoIndices, entry, '>>');
        }
    }
    // Collect arglist references
    if ( todoIndices.size ) {
        const arglistRefs = /* 22 */ ["8","12","4","17,18","1","15","16","2","10","1","6","3","5","20,21","7","13","14","22","11","9","19","1"];
        for ( const i of todoIndices ) {
            for ( const ref of JSON.parse(`[${arglistRefs[i]}]`) ) {
                todo.add(ref);
            }
        }
    }
}

if ( $hasRegexes$ ) {
    const scriptletFromRegexes = /* 0 */ [];
    const { hns } = scriptletGlobals.origins[0];
    for ( let i = 0, n = scriptletFromRegexes.length; i < n; i += 3 ) {
        const needle = scriptletFromRegexes[i+0];
        let regex;
        for ( const hn of hns ) {
            if ( hn.includes(needle) === false ) { continue; }
            if ( regex === undefined ) {
                regex = new RegExp(scriptletFromRegexes[i+1]);
            }
            if ( regex.test(hn) === false ) { continue; }
            for ( const ref of JSON.parse(`[${scriptletFromRegexes[i+2]}]`) ) {
                todo.add(ref);
            }
        }
    }
}

// Execute scriptlets
if ( todo.size && todo.has(0) === false ) {
    const arglists = /* 23 */ ["","1,0,1","11,2,3","11,4,5","1,0,6","1,0,7","1,0,8","1,0,9","5,10,11","6,12,13,14","9,15","1,0,16","1,0,17","1,0,18","9,19","1,0,20","11,21,22","5,23,11","15,24,11","11,25,26","11,27,28","11,29,30","11,31,5"];
    const args = /* 32 */ ["script","document.oncontextmenu =","a[href^=\"/goto/\"]","?url -base64","a[href^=\"https://hamtamovie.nl/dl/?url=\"]","?url","document.oncontextmenu=","/popTimes_|document\\.onkeydown|'contextmenu'/","window.location=","displayCountryInConsole","VisitedCompanies","$remove$","img[data-src]","src","[data-src]","tracker_visitor_id","popTimes_","ad.setAttribute","showScrollAlert","/captcha_key|last_file|_scrs_/","Event.MOUSEDOWN","a[href^=\"https://l.vrgl.ir/r?\"][href*=\"&l=http\"]","?l","videoPlayedCount","videoWatchCount","a[href^=\"/api/click?dest=\"]","?dest -base64","a[href^=\"https://offerdaily.ir/index.php?do=go&url=\"]","?url -base64 ?b64 -base64","a[href^=\"https://dgkl.io/api/v1/Click/b/\"][href*=\"?b64=\"]","?b64 -base64","a[data-original-url]"];
    const { functionRefs } = scriptletGlobals;
    for ( const ref of todo ) {
        if ( ref < 0 ) { continue; }
        if ( todo.has(~ref) ) { continue; }
        const arglist = JSON.parse(`[${arglists[ref]}]`);
        const fn = functionRefs[arglist[0]];
        try { fn(...arglist.slice(1).map(a => args[a])); }
        catch { }
    }
}

/******************************************************************************/

// End of local scope
})("74f9600a-13a3-47bc-b856-40c6da158b89");

void 0;
