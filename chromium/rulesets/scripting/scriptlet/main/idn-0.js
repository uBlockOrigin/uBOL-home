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

// ruleset: idn-0

// Important!
// Isolate from global scope

// Start of local scope
(function uBOL_scriptlets($SECRET_ID$) {

/******************************************************************************/

const scriptletGlobals = self[$SECRET_ID$];

if ( scriptletGlobals.origins.length === 0 ) { return; }

/******************************************************************************/

const $hasHostnames$ = true;
const $hasEntities$ = true;
const $hasAncestors$ = false;
const $hasRegexes$ = false;

/******************************************************************************/

const todo = new Set();

if ( $hasHostnames$ ) {
    const scriptletHostnames = /* 64 */ ["netq.me","dodz.pro","mudah.my","01ntn.top","123av.com","doroni.me","kiryuu.id","kuyhaa.me","91porn.com","dicrotin.*","igodesu.tv","indobo.com","kiryuu.org","kiryuu02.*","lk21semi.*","nimegami.*","njavtv.com","nokephub.*","sukasex.tv","tutwuri.id","anichin.moe","anichin.top","i-jav.space","kingbokep.*","moenime.com","pemersatu.*","semprot.com","sukasex.net","westmanga.*","5.253.86.213","animekompi.*","asalunik.com","brobokep.org","jenismac.com","kimcilonly.*","kiryuu01.com","okepindo.com","simontokx.tv","ainzscans.net","bokepindo69.*","cosmicscans.*","moutogami.com","moviekhhd.biz","streamget.win","3gpterbaru.com","info.vebma.com","kawanfilm21.co","193.142.147.230","bokepindo24.com","komikcast02.com","komikdewasa.art","ngicstream.site","indoporntube.com","info-menarik.net","jurnalistekno.id","tantecentil.fans","websitebokep.com","02.cosmicscans.to","luciferdonghua.in","bahasteknologi.com","thejakartapost.com","tv1.lk21official.*","gudangmovies21.chat","kisahterlarang.site"];
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
        const arglistRefs = /* 64 */ ["20,25","27,28","18","9","27","8","27","7","9","2","27","27","27","27","6","27","27","2","27","22","27","27","16","4,27","21","16","1","27","27","24","3","23","27","17,24","27","27","9","15,27","24","27","27","13","26","27","14","10","27","24","9","27","12","27","5,27","29","22,27","27","11","9","9","17","19","27","2","27"];
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
    const arglists = /* 30 */ ["","12,0,1","19,2","31,3","12,4","12,5,6","12,7","12,8,9","12,10,11,12","22","22,13,14","22,13,15","22,13,16","22,17,18","19,19","19,20","31,21","26","15,22","15,6","15,23","15,24","13,25","37","36,26","14,27","14,28,29","10","11,30,31","31,32"];
    const args = /* 33 */ ["Math.random","arv_24","SGPB_POPUP_PARAMS","MutationObserver","checkAdsStatus","document.querySelector","adsbygoogle","chp_ads_blocker_detector","document.addEventListener","window.open","getComputedStyle","","cpm","click","linkOpened","player.seeking","tampilkanUrl","load","/adblock/i","LieDetector","ujiPopups","document.body.innerHTML","ads.google.com","clarity.ms","trafficbass.com","googlesyndication","/chp_?ad/","console","location.href","3000","bait_b3j4hu231","true","ai_front"];
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
})("fb7f2f86-ef87-4c15-a912-62a035b1c974");

void 0;
