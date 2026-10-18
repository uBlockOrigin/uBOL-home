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

// ruleset: swe-1

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
    const scriptletHostnames = /* 40 */ ["m3.se","elle.se","hant.se","inet.se","leta.se","allas.se","femina.se","mabra.com","norpan.se","rodeo.net","fempers.se","medibok.se","pilsner.nu","bio-link.se","byggahus.se","macworld.se","expressen.se","golflivet.se","pcforalla.se","svenskdam.se","synonymer.se","web-tools.se","byggipedia.se","dinbyggare.se","familjeliv.se","motherhood.se","vitaestilo.se","aftonbladet.se","destination.se","galamagasin.se","landetsfria.se","sistaminuten.se","inredningsvis.se","skrattsajten.com","tidningensyre.se","kandisvarlden.com","husbilskompisar.se","tidningenglobal.se","residencemagazine.se","internetodontologi.se"];
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
        const arglistRefs = /* 40 */ ["22","1,2,8","2","14","21","2","1,2","2","20","1","26,27,28","23","23","29","1","22","1,8,9,10,11,12","1","22","1,2","24,25","29","3,4","6,7","1","2","1","1","5","1","26,27,28","5","1,15,16,17,18,19","20","26,27,28","23","13","26,27,28","2","20"];
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
    const arglists = /* 30 */ ["","11,0,1","11,2,3","1,4,5","1,4,6","8,7,8","1,9","1,4,10","11,11,1","11,12,13","11,14,15","11,16,3","11,17,3","5,18,19","8,20,8","8,21,22","8,23,24","8,25,26","8,27,26","8,28,26","1,4,29","11,30,31","11,32,1","1,4,33","9,34","5,34,35","9,36","9,37","9,38","1,4,39"];
    const args = /* 40 */ ["a[href*=\"/t?a=\"]","?url","a[href*=\".io/c/\"]","?u","script","contextmenu","e.keyCode","CM_cookieConsent","0","noscript","/wccp_pro/","a[href*=\"/click\"]","a[href*=\"&amp;u\"]","?amp;u","a[href*=\"&ued=\"]","?ued","a[href*=\".pxf.io\"]","a[href*=\".sjv.io\"]","cookie_consent","denied","allow-marketing-cookies","cmplz_banner-status","dismissed","cmplz_functional","allow","cmplz_marketing","deny","cmplz_preferences","cmplz_statistics","e.preventDefault","a[href*=\"&cpdir\"]","?cpdir","a[href*=\"/idg.digidip.net/\"]","decodeURIComponent","/^ev_did|ev_sid/","$remove$","article_count","read_articles","wordpress_sezz_id","request_ads_to_display"];
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
