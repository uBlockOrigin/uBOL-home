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

// ruleset: spa-1

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
    const scriptletHostnames = /* 64 */ ["1i1.in","4br.me","enrt.eu","ent4.net","fir3.net","cl1ca.com","elpais.bo","seulink.*","3xyaoi.com","animeid.tv","estacio.br","pelis1.com","canalnet.tv","fgtd.online","homecine.cc","homecine.to","homecine.tv","maxvip.site","pornhot.net","hentai-id.tv","iputitas.net","pelisflix2.*","pelismart.tv","plplayer.com","redecanais.*","encurtalink.*","pelispedia.is","smartpelis.tv","techdiniz.com","flixseries.org","guiasaude.info","infoinvest.org","malfollado.com","portalyaoi.com","redecanaistv.*","animegratis.org","beachcam.meo.pt","dev.encurta.app","devilnovels.com","gastroponto.com","metroseries.net","seriesmetro.net","trueliketop.org","cursomecanet.com","papayaseries.net","saudeecomida.com","seriesbanana.com","esportesdavez.com","guiacripto.online","meufinanceiro.org","portecnologia.com","receitastop.click","redirectnflix.com","guiavidaesaude.com","sabornutritivo.com","blog.whatsappgb.top","comidaefamilia.food","saopaulosecreto.com","nutricaohoje.website","fomedereceitas.online","receitasdocheff.online","diariodocomercio.com.br","investimentosfacil.online","receitasoncaseiras.online"];
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
        const arglistRefs = /* 64 */ ["14","22","22","22","22","22","29","22","1","30","16","31","18","3","31","31","31","12","31","23","31","15","17,31","28","4,5,6,7","22","31","31","9","31","13","12","31","24","4,5,6,7","25","19","22","2","12","31","31","9","8","31","12","31","27","10","12","21","12","27","12","10","12","12","11","20","12","12","26","12","20"];
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
    const arglists = /* 32 */ ["","1,0,1","5,2,3","8,4,5","8,6,7","8,8,5","15,9,5","5,9,5","1,0,10","8,11,12","8,13,5","11,14,15,16","5,17,18","8,19,12","8,20,12","20,21,5","8,22,5","11,23,15,24","13,25,26","13,27,28","8,13,18","8,29,5","7","11,30,31","6,32,33,34","6,35,36,37","5,38,3","15,39,40","6,41,42,12","1,0,43","1,0,44","8,45,5"];
    const args = /* 46 */ ["script","/_adBlockDetectorExecuted|checkForbiddenBrowsers/","/^adblock/","$remove$","unlock","1","modalVisited","true","adsCompleted","finalReloadDone","modifiedParagraphs.add","force_ad","2","visited","a[href^=\"https://adesampa.com.br/\"]","[href]","removeParam","last_ads","yes","Ads","clicked_ads","adtura","modal_promo",".download-links a[href^=\"https://unlock.uberxviral.com/#\"]","base64decode","_theme-banner-upper","html","bgPartners2019",".videoContainer > div.beachPartners + div","CLI_02_Dxxxxxxxxxxxxxxx","a[href*=\"://ouo.io/\"]","?s","a.reward_ads[data-url]","href","[data-url]","iframe[data-src]","src","[data-src]","adwallLocked","nf_done_clicks_v3_new","3","a[data-stream][target=\"_blank\"]","data-clicks","ads-popup","url_popup","player"];
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
})("eb67c4fa-700a-4c20-bf4f-852ab9b7ca91");

void 0;
