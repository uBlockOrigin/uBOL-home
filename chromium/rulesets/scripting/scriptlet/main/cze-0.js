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

// ruleset: cze-0

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
    const scriptletHostnames = /* 119 */ ["g.cz","cc.cz","e15.cz","auto.cz","csfd.cz","csfd.sk","dama.cz","ewrc.cz","kupi.cz","lupa.cz","root.cz","zeny.cz","zive.cz","arome.cz","blesk.cz","cnews.cz","drbna.cz","extra.cz","fzone.cz","hokej.cz","idnes.cz","kurzy.cz","libli.tv","magio.tv","onetv.cz","sauto.cz","super.cz","abicko.cz","expres.cz","fdrive.cz","fights.cz","impuls.cz","iprima.cz","reflex.cz","seznam.cz","stream.cz","tv.htn.cz","tv.nuo.sk","ctrlv.link","emimino.cz","kinobox.cz","lidovky.cz","maminka.cz","markiza.sk","nerdfix.cz","novinky.cz","tiscali.cz","tn.nova.cz","aktualne.cz","itv.satt.cz","jon.4net.tv","labuznik.cz","onlajny.com","rychlost.cz","rychlost.sk","sprintel.tv","sreality.cz","titulky.com","tv.e-max.sk","tv.tv2go.eu","tvnoviny.sk","vitalion.cz","youradio.cz","zdopravy.cz","ahaonline.cz","autorevue.cz","chip.4net.tv","indian-tv.cz","live.4net.tv","live.rete.cz","media.joj.sk","mobilenet.cz","osobnosti.cz","tv.itcity.sk","tv.sauron.cz","warforum.xyz","modnipeklo.cz","mojezdravi.cz","nasepenize.cz","pegas.4net.tv","prime.4net.tv","tv.giganet.sk","tv.maxicom.cz","tv.selfnet.cz","winet.4net.tv","zona.telly.cz","live.chiptv.cz","pamico.4net.tv","spisovatele.cz","tv.rainside.sk","karaoketexty.cz","live.kabelko.sk","live.martico.sk","live.metrotv.sk","martico.4net.tv","online.pecka.tv","seznamzpravy.cz","svetandroida.cz","tv.tes-media.sk","doubrava.4net.tv","games.tiscali.cz","live-new.4net.tv","live.rapidnet.tv","mojecelebrity.cz","profinet.4net.tv","rapidnet.4net.tv","live-rete.4net.tv","live.swan.4net.tv","prestonet.4net.tv","live.artos.4net.tv","navratdoreality.cz","podcasty.seznam.cz","tv.nejpripojeni.cz","muj.internethned.cz","parlamentnilisty.cz","media.cms.markiza.sk","sleduj.interaktivni.tv","tvadmin.pamico-czech.cz","gemnet.4net.tvhtn.4net.tv"];
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
        const arglistRefs = /* 119 */ ["42,43","1","42,43","42,43","3","3","42,43","6","42,43","12","25","42,43","37,42,43","42,43","42,43","42,43","5","42,43","17,18","8","42,43,44","11","2","13","42,43","27","30,40,41,42,43","42,43","42,43","17,18","42,43","9","42,43","42,43","28,40","40","2","2","4","42,43","42,43","42,43","42,43","14","10","40,42,43","42,43","35","42,43","2","2","42,43","21","26","26","2","29","32,33,34","2","2","14","42,43","12","38,39","42,43","42,43","2","10","2","2","15,16","17,18","42,43","2","2","36","42,43","42,43","42,43","2","2","2","2","2","2","2","2","2","42,43","2","42,43","2","2","2","2","2","40","31","2","2","7","2","2","42,43","2","2","2","2","2","2","19,20","23,24","2","2","22","15","2","2","2"];
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
    const arglists = /* 45 */ ["","19,0","3,1,2,3,4","12,5,6","19,7","12,5,8","11,9,10","19,11","11,12,13","11,14,15","22,16,17","14,18,19","33","3,20,2,3,21","1,22,23","11,24,15","11,25,26","11,27,10","11,28,15","22,29","37","12,5,30","19,6","11,31,10","11,32,33","11,34,10","26,35,36","1,37,19","31,38","25,39","17,40,41","19,42","22,43,44","11,45,2","12,46","11,47,15","12,48","12,49,50","19,51","11,52,13","22,53,54","22,53,55","22,56,57","12,58,59","12,11"];
    const args = /* 60 */ ["App.branding","ad_blocks.[-].id_program","","propsToMatch","/api/advertisement/getAllStreamAdBlocks/","$","Ads","adsAllowed","fancyBanner","checkAdsBlocked","noopFunc","HTMLIFrameElement.prototype.contentWindow","canRunAds","true","first","false","click","location","img_ab_s","3000","adBlocks.[-].id","/schedules/ads","t()","*","settings.ads","Rmp.params.genderSelectionUrl","undefined","App.pos.init","App.ft.detected","ended","PartnerRedirectAction","sssp.config","sssp","{}","Gallery.prototype.setAdsForGallery","ntmt_retest_btn_countdown_do","1000","vendor-load","Fisher","checkRods","style","body","detectAdBlocker","load","document.cookie","xmxalr","foolish_script","useSeznamAds","codeAddress","window.addEventListener",":visible","atob","hasUserActiveSubscription","message","fishing","_0x","beforeunload","()","document.createElement","adbDetect"];
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
