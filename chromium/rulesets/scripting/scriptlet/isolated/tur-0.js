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

// ruleset: tur-0

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
const $hasRegexes$ = true;

/******************************************************************************/

const todo = new Set();

if ( $hasHostnames$ ) {
    const scriptletHostnames = /* 87 */ ["kgrt.net","sinema.*","halk54.com","turkanime.co","burdurweb.com","dizilla40.com","efullizle.com","flatscher.net","kanald.com.tr","diziyiizle.com","eksisozluk.com","gazeterize.com","haberlisin.com","macboxtv29.xyz","bugunkibris.com","cizgivedizi.com","bursahaberdar.com","hdfilmcehennemi.*","klasikfilmler.net","turkporoclub1.sbs","turkporoclub2.sbs","turkporoclub3.sbs","turkporoclub4.sbs","turkporoclub5.sbs","turkporoclub6.sbs","turkporoclub7.sbs","turkporoclub8.sbs","turkporoclub9.sbs","yabancidiziio.com","birsenaltuntas.com","eskisehirhaber.com","turkifsalife70.lat","turkporoclub10.sbs","turkporoclub11.sbs","turkporoclub12.sbs","turkporoclub13.sbs","turkporoclub14.sbs","turkporoclub15.sbs","turkporoclub16.sbs","turkporoclub17.sbs","turkporoclub18.sbs","turkporoclub19.sbs","turkporoclub20.sbs","turkporoclub21.sbs","turkporoclub22.sbs","turkporoclub23.sbs","turkporoclub24.sbs","turkporoclub25.sbs","turkporoclub26.sbs","turkporoclub27.sbs","turkporoclub28.sbs","turkporoclub29.sbs","turkporoclub30.sbs","doedaturkifsa6.blog","doedaturkifsa7.blog","doedaturkifsa8.blog","doedaturkifsa9.blog","erotizmfilmleri1.cc","filmseyretizlet.com","sinefilmizlesem.com","doedaturkifsa10.blog","doedaturkifsa11.blog","doedaturkifsa12.blog","doedaturkifsa13.blog","doedaturkifsa14.blog","doedaturkifsa15.blog","doedaturkifsa16.blog","doedaturkifsa17.blog","doedaturkifsa18.blog","doedaturkifsa19.blog","doedaturkifsa20.blog","doedaturkifsa21.blog","doedaturkifsa22.blog","doedaturkifsa23.blog","doedaturkifsa24.blog","doedaturkifsa25.blog","doedaturkifsa26.blog","doedaturkifsa27.blog","doedaturkifsa28.blog","doedaturkifsa29.blog","doedaturkifsa30.blog","doedaturkifsa31.blog","doedaturkifsa32.blog","doedaturkifsa33.blog","doedaturkifsa34.blog","doedaturkifsa35.blog","mobile.donanimhaber.com"];
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
        const arglistRefs = /* 87 */ ["4","14","4","3","19","9","18","9","8","10","5","4","4","20","13","11,15,16","4","12","17","22","22","22","22","22","22","22","22","22","9","1","4","24","22","22","22","22","22","22","22","22","22","22","22","22","22","22","22","22","22","22","22","22","22","21","21","21","21","17","2","7","21","21","21","21","21","21","21","21","21","21","21","21","21","21","21","21","21","21","21","21","21","21","21","21","21","21","6"];
        for ( const i of todoIndices ) {
            for ( const ref of JSON.parse(`[${arglistRefs[i]}]`) ) {
                todo.add(ref);
            }
        }
    }
}

if ( $hasRegexes$ ) {
    const scriptletFromRegexes = /* 5 */ ["macboxtv","macboxtv\\d+\\.xyz$","20","doedatur","doedaturkifsa\\d+\\.blog$","21","turkporo","turkporoclub\\d+\\.sbs$","22","turkifsa","turkifsa(lar)?\\d*\\.(site|art)$","23","turkifsa","^turkifsalife\\d+\\.(blog|lat)$","24"];
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
    const arglists = /* 25 */ ["","1,0,1","8,2,3","5,4,5","8,6,7","8,8,5","15,9,10","13,11,12","6,13,14,15","9,16","5,17,18","1,0,19","5,20,21","1,22,23","1,0,24","5,25,18","5,26,18","8,27,5","1,0,28","7","6,29,30,10","1,0,31","1,0,32","15,33,34","1,0,35"];
    const args = /* 36 */ ["script","ad_block","popundr0","7","lscache-pop","1","modalads","yes","notheme","pageCount","0","yildiz-pageskin","body",".player-container","data-ad","false","showAllDaFull","redirected_to_home","true","/lastAdTime|openPopup/","/^totalPlayTime/","$remove$","#text","reklam_linki","pbrk","adShown","adSkipped","mrr_1","openRandomSite",".player-box","data-preroll-enabled","popUnder","LAST_POP","preroll_view_count","4","reklamAcildi"];
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
