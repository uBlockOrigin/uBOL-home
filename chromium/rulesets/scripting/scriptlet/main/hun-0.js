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

// ruleset: hun-0

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
    const scriptletHostnames = /* 37 */ ["24.hu","hang.hu","hoxa.hu","life.hu","port.hu","blikk.hu","hiros.hu","liked.hu","divany.hu","femina.hu","vezess.hu","foodker.hu","jofogas.hu","naphire.hu","arcanum.com","totalcar.hu","calculat.org","hdfilmek.net","lifestory.hu","napiszar.com","rimkereso.hu","speedshop.hu","totalbike.hu","huaweiblog.hu","karpathir.com","player.rtl.hu","hazipatika.com","milestone66.hu","mindmegette.hu","paplanvilag.hu","sorozatwiki.hu","reformsziget.hu","stylemagazin.hu","myonlineradio.hu","laptophardware.hu","embed.indavideo.hu","angol-magyar-szotar.hu"];
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
        const arglistRefs = /* 37 */ ["18","28,29","3","37","31","6","7","2","14,21","14,36","11,12","15","4","17","5","21","20","16","8","10","32","1","21","26","27","33,34,35","25","15","9","15","38","15","13","30","15","22,23,24","19"];
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
    const arglists = /* 39 */ ["","11,0,1","11,2,3","11,4,5","14,6","11,7,1","17,8,9,10","31,11","17,12","17,13,14","12,15,16","22,17,18","14,19,20","22,17","22,21","11,22,1","12,23,24","22,25,26","12,27,28","11,29,30","14,31,32","12,33,34","11,35,36","11,37,36","11,38,1","12,27,39","11,40,5","31,4","12,41,42","12,43,42","11,44,45","31,46","11,47,3","11,48,49","11,50,1","11,51,1","11,52,53","17,54,55","17,8,9"];
    const args = /* 56 */ ["exitpopup_overlay","noopFunc","showVignette","falseFunc","getComputedStyle","undefined","E(!1)","show_modal","style","body","stay","oxyShowModal","oncontextmenu","href","[href*=\"ad.adverticum.net\"]","document.createElement","setTimeout","mouseleave","showFbPopup","FbExit","3000","mouseout","cookie_alert_overlay","Math.random","_0x","load","reklám blokkolókat","window._ceCTSData","hirdetések","adblock","false","adstest","4000","document.head","currentScript.remove","AdHandler.adblocked","0","AdHandler.adBlockEnabled","AdHandler.checkAdblock","a2blckLayer","tie.ad_blocker_detector","document.addEventListener","ai_run_","document.getElementById","ENABLE_PAGE_LEVEL_ADS","true","document.body.style","detect_adblock","gemiusStream","{}","gemiusStream.event","gemiusStream.init","window.ado","null","class","section[class=\"life-section l-section-main article-section l-section-article\"]"];
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
