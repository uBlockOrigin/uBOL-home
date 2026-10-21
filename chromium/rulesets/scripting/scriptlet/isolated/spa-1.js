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
    const scriptletHostnames = /* 65 */ ["1i1.in","4br.me","enrt.eu","ent4.net","fir3.net","cl1ca.com","elpais.bo","seulink.*","3xyaoi.com","animeid.tv","estacio.br","pelis1.com","canalnet.tv","fgtd.online","homecine.cc","homecine.to","homecine.tv","maxvip.site","pornhot.net","hentai-id.tv","iputitas.net","pelisflix2.*","pelismart.tv","plplayer.com","redecanais.*","encurtalink.*","pelispedia.is","smartpelis.tv","techdiniz.com","flixseries.org","guiasaude.info","infoinvest.org","malfollado.com","portalyaoi.com","redecanaistv.*","animegratis.org","beachcam.meo.pt","dev.encurta.app","devilnovels.com","gastroponto.com","metroseries.net","seriesmetro.net","trueliketop.org","cursomecanet.com","papayaseries.net","saudeecomida.com","seriesbanana.com","esportesdavez.com","guiacripto.online","meufinanceiro.org","portecnologia.com","receitastop.click","redirectnflix.com","guiavidaesaude.com","sabornutritivo.com","blog.whatsappgb.top","comidaefamilia.food","saopaulosecreto.com","nutricaohoje.website","fomedereceitas.online","www2.clubvideostv.com","receitasdocheff.online","diariodocomercio.com.br","investimentosfacil.online","receitasoncaseiras.online"];
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
        const arglistRefs = /* 65 */ ["15","23","23","23","23","23","30","23","2","31","17","32","19","4","32","32","32","13","32","24","32","16","18,32","29","5,6,7,8","23","32","32","10","32","14","13","32","25","5,6,7,8","26","20","23","3","13","32","32","10","9","32","13","32","28","11","13","22","13","28","13","11","13","13","12","21","13","1","13","27","13","21"];
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
    const arglists = /* 33 */ ["","1,0,1","1,0,2","5,3,4","8,5,6","8,7,8","8,9,6","15,10,6","5,10,6","1,0,11","8,12,13","8,14,6","11,15,16,17","5,18,19","8,20,13","8,21,13","20,22,6","8,23,6","11,24,16,25","13,26,27","13,28,29","8,14,19","8,30,6","7","11,31,32","6,33,34,35","6,36,37,38","5,39,4","15,40,41","6,42,43,13","1,0,44","1,0,45","8,46,6"];
    const args = /* 47 */ ["script","lockScreen","/_adBlockDetectorExecuted|checkForbiddenBrowsers/","/^adblock/","$remove$","unlock","1","modalVisited","true","adsCompleted","finalReloadDone","modifiedParagraphs.add","force_ad","2","visited","a[href^=\"https://adesampa.com.br/\"]","[href]","removeParam","last_ads","yes","Ads","clicked_ads","adtura","modal_promo",".download-links a[href^=\"https://unlock.uberxviral.com/#\"]","base64decode","_theme-banner-upper","html","bgPartners2019",".videoContainer > div.beachPartners + div","CLI_02_Dxxxxxxxxxxxxxxx","a[href*=\"://ouo.io/\"]","?s","a.reward_ads[data-url]","href","[data-url]","iframe[data-src]","src","[data-src]","adwallLocked","nf_done_clicks_v3_new","3","a[data-stream][target=\"_blank\"]","data-clicks","ads-popup","url_popup","player"];
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
