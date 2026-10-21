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

// ruleset: ukr-0

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
const $hasRegexes$ = true;

/******************************************************************************/

const todo = new Set();

if ( $hasHostnames$ ) {
    const scriptletHostnames = /* 63 */ ["kvk.pub","3ivi.com","rezka.ag","rezka.fi","rezka.si","drezka.pl","hdrezka.ag","hdrezka.cm","hdrezka.co","hdrezka.in","hdrezka.la","hdrezka.me","hdrezka.pl","hdrezka.sh","hdrezka.tv","kinopub.me","tochka.net","hdrezka.inc","hdrezka.kim","hdrezka.vip","rezka-ua.co","rezka-ua.in","rezka-ua.tv","rezka.space","rezkery.com","rezkify.com","www.ukr.net","hdrezka.club","hdrezka.fans","hdrezka.name","hdrezka.rest","hdrezka.site","omnirezka.tv","rezka-ag.net","rezka-tv.org","rezka-ua.org","rezka-ua.pub","hdrezka.today","pravda.com.ua","flymaterez.net","hdrezkayou.com","hello-rezka.tv","inforesist.org","metaratings.by","metaratings.ru","noworries.news","champion.com.ua","hdrezka-home.tv","hdrezka.website","meta-ratings.kz","hdrezka19139.org","standby-rezka.tv","hdrezka1twwpb.org","hdrezka2tepnm.org","hdrezka2vmmty.org","hdrezka720dhh.org","hdrezka8bdhtq.org","hdrezka9bsbhq.org","hdrezka9fmskj.org","hdrezkaonline.com","bestofkinopoisk.com","hdrezka-sex-city.net","punisher-hdrezka.net"];
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
        const arglistRefs = /* 63 */ ["5","5","5","5","5","5","5","5","5","5","5","5","5","5","5","5","3","5","5","5","5","5","5","5","5","5","1","5","5","5","5","5","5","5","5","5","5","5","2","5","5","5","3","4","4","6","7","5","5","4","5","5","5","5","5","5","5","5","5","5","5","5","5"];
        for ( const i of todoIndices ) {
            for ( const ref of JSON.parse(`[${arglistRefs[i]}]`) ) {
                todo.add(ref);
            }
        }
    }
}

if ( $hasRegexes$ ) {
    const scriptletFromRegexes = /* 1 */ ["rezka","rezka","5"];
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
    const arglists = /* 8 */ ["","1,0,1","1,0,2","1,0,3","13,4","13,5,6","5,7,8","13,9,10"];
    const args = /* 11 */ ["script","!function(r,n,t,e)",",mr=function(r,","attachShadow","MatchCarousel-module-scss-module__WcuM7G__hasBranding","active-brand","body","banner_closed","true","header_rg_2026","header"];
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
})("18a6405d-4634-4b3a-ae38-e2d275e6b586");

void 0;
