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

// ruleset: ublock-badware

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
    const scriptletHostnames = /* 40 */ ["ojworld.it","forqueen.cz","red17.co.uk","skybap.shop","tvojstyl.sk","up-shop.org","webrick.com","aptisweb.com","pentest.blog","crimsonav.com","strand-co.com","adrissa.com.co","lundracing.com","msm-wroclaw.pl","jollibee.com.vn","kitapsan.com.tr","rapidkil.com.au","yairalon.com.br","caesarjaco.co.id","joinusonline.net","mebelinovdom.com","qualityrental.com","szaszmotorshop.hu","americansoda.co.uk","https-xhamster.com","ondigitalocean.app","weightlossdiet.top","casteloforte.com.br","centerfabril.com.br","energiasolare100.it","www.cambe.pr.gov.br","igualdad.iaa.csic.es","web.core.windows.net","abogadosrosarinos.com","avene-hebergement.com","sport.elwatannews.com","workplace-products.co.uk","z13.web.core.windows.net","darumasushiantofagasta.cl","ngsingleissues.nationalgeographic.com"];
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
        const arglistRefs = /* 40 */ ["14","14","13","4,5","14","14","8","4,5","9","12","6","14","13","18","14","14","15","14","4,5","14","14","14","14","14","4,5","3","16","14","14","13","11","7","2","4,5","4,5","17","13","1","10","12"];
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
    const arglists = /* 19 */ ["","22,0,1","22,2,3","22,4,5","12,6,7,8","31,9","12,10,11","12,12,13","12,14,15","12,14,16","23,17,18","36,19","12,14,20","16,21,22,23,24,25","12,26,27","23,28,29","12,30,31","23,32,33","36,7"];
    const args = /* 34 */ ["DOMContentLoaded","fullscreenEnabled","beforeunload","/[Ww]orker/","mousemove","loadSecret","fetch","_0x","/^data:/","ai_front","document.createElement",".onerror","String.prototype.toLowerCase","Contract","atob","Uint8Array","new","Function","/bxslider|wow/","tigervip2","new Function(atob(","String.prototype.includes","0","undefined","condition","/^checkout$/","WebSocket","event.data","XMLHttpRequest","/wp-content","open","executeCode","Array.prototype.indexOf","isWin"];
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
