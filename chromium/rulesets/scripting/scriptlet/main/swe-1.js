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
    const scriptletHostnames = /* 188 */ ["bt.se","di.se","fz.se","gp.se","hn.se","m3.se","nt.se","pt.se","sn.se","tv.nu","ut.se","vf.se","vk.se","vt.se","blt.se","klt.nu","mvt.se","nkp.se","nlt.se","nsd.se","nsk.se","nvp.se","nwt.se","skd.se","sla.se","smp.se","svd.se","tv4.se","unt.se","cafe.se","elle.se","hant.se","nyan.ax","allas.se","feber.se","klart.se","koket.se","mitti.se","tjock.se","ttela.se","conpot.se","corren.se","femina.se","findit.se","guiden.se","ibnytt.se","illvet.se","kurera.se","lwcdn.com","mabra.com","norran.se","recept.se","boktugg.se","eposten.se","golfing.se","kamrat.com","kuriren.nu","lokalti.se","matspar.se","realtid.se","stallet.se","thatsup.se","tinyurl.se","tv4play.se","byggahus.se","ekuriren.se","fragbite.se","fssweden.se","kkuriren.se","kritiker.se","macworld.se","stadshem.se","swedroid.se","thelocal.se","viivilla.se","babyhjalp.se","expressen.se","fotosidan.se","hejaolika.se","lundagard.se","matsafari.nu","nyheter24.se","ordbokpro.se","pcforalla.se","recipify.com","rocknytt.net","sexpacket.se","streamio.com","svenskdam.se","sydostran.se","alekuriren.se","barometern.se","byggipedia.se","familjeliv.se","folkbladet.nu","folkbladet.se","kt-kuriren.se","markposten.se","morotsliv.com","motherhood.se","naringsliv.ax","skogsforum.se","svenskgolf.se","villalivet.se","aftonbladet.se","aktieskolan.se","enkelteknik.se","etunawebben.se","gamereactor.se","helagotland.se","lchfarkivet.se","nordsverige.se","nuosteraker.se","pricerunner.se","sttidningen.se","trafikskola.se","vaxjobladet.se","affarsstaden.se","allagodating.se","classicmotor.se","datormagazin.se","happypancake.se","husbilsplats.se","jobsinsweden.se","kattannonser.se","kingmagazine.se","mellanbygden.nu","norrahalland.se","nyadagbladet.se","olandsbladet.se","utslappsratt.se","arvikanyheter.se","bohuslaningen.se","dalslanningen.se","densistavilan.se","harrydaposten.se","heleneholmsif.se","passioneffect.se","upphandling24.se","zeinaskitchen.se","automotorsport.se","computersweden.se","embed.viaplay.com","hallandsposten.se","kandisvarlden.com","kungalvsposten.se","lakartidningen.se","lokaltidningen.nu","mobilanyheter.net","molndalsposten.se","polistidningen.se","tidningencurie.se","trafiksakerhet.se","alingsastidning.se","fotbollskanalen.se","fryksdalsbygden.se","husbilskompisar.se","modernpsykologi.se","partilletidning.se","saffletidningen.se","sverigespringer.se","vasterastidning.se","vimmerbytidning.se","vinochmatguiden.se","www.aftonbladet.se","ystadsallehanda.se","alltforforaldrar.se","idrottensaffarer.se","kungsbackaposten.se","mellerudsnyheter.se","provinstidningen.se","skaraborgsbygden.se","strengnastidning.se","varldenshistoria.se","vasterbottningen.se","dagensarbetsmiljo.se","fastighetsvarlden.se","filipstadstidning.se","livsmedelsnyheter.se","residencemagazine.se","stromstadstidning.se","vadhanderisverige.se","praktisktbatagande.se","kristianstadsbladet.se","mariestadstidningen.se","trelleborgsallehanda.se","discoveringtheplanet.com","melodifestivalklubben.se"];
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
        const arglistRefs = /* 188 */ ["14","13,14","19","32","32","33","14","14","14","1","14","14","53,54","14","14","14","14","14","14","14","14","14","14","14","14","14","1","48,49","14","14","2,3","2,3","44","2,3","15,16","1","48,49","14,35","15,16","32","7,8","14","2,3","17","58,59","14","44","60","31,32","2,3","14","14","56,57,60","14","14","27,28","14","14","34","14","43","46","19","48,49","4","14","14","19","14","30","33","61","45","14","14","14","12,13,14","18","22","60","56,57","14","38","33","40","58,59","41","44","2,3","14","14","14","5","14","14,53,54","14","14","32","50,51,60","2,3","37","42","14","56,57,58,59","1","56,57","58,59","11","20","14","14","53,54","14","39","32","50,51","14","60","60","58,59","58,59","21","25","26","29","14","53,54","14","50,51,58,59","14","50,51","14","32","14","58,59","32","50,51","58,59","58,59","56,57","14","6,33","49","32","9,25","32","56,57","53,54","36","32","58,59","47","56,57","32","48,49","14","23,24","58,59","32","14","14","14","14","52","55","14","14","14","32","32","14","14","14","44","53,54","62","56,57","14","58,59","2,3","32","58,59","14,35","14","14","14","9,10","50,51"];
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
    const arglists = /* 63 */ ["","11,0,1","22,2,3","22,4,5","22,6","11,7,8","17,9","11,10,11","11,12,11","12,13","12,14","14,15","22,16,17,18,19","22,20,21","7,22","11,23,24","11,25,8","11,26,8","22,20,27,28","11,29,24","11,30,31","17,32","12,33","7,34","14,35","12,36","11,37,11","11,38,24","11,39,8","37,40","13,41","22,42","2,22,27,43,44","12,45,46","7,47","22,4,48","11,49,8","14,50","11,51,8","7,52","22,53,54","22,55","12,56","51","22,20","11,57,8","11,58,1","14,59","2,60,27,43,61","47,62,27,63","11,64,24","11,65,66","11,67,68","7,69","11,70,8","14,71","12,72","11,73,24","12,74","12,75","22,53","22,53,4","22,53,76"];
    const args = /* 77 */ ["advertoryFluepapir","true","blur","i.focusPlayerElement","scroll","t.view.updateBounds","/adblockDetector|adsInserted|partnerExternalLinkClick/","ai_set_cookie","noopFunc","_sp_","square_array1","null","square_arraytop","disableEnterKey","document.ondragstart","ad","click","e.preventDefault","elements","a.js-ct","contextmenu",".disabled","autoplay","B.ab","false","dovideostuffAD","testPrebid","","showCopyrightBox","adblock","adblockEnabled","falseFunc","Object.prototype.adUnits","advads_passive_placements","props.initialAds","ad_location","document.oncontextmenu","eazy_ad_unblocker","showAds","trap","adbEnableForPage","adsbygoogle","/^(?:adBlocker|contextmenu)$/","propsToMatch","url:ljsp.lwcdn.com","document.createElement","admiral","payload.ads campaigns.*","helpers.scroll(id)","ai_run_scripts","popup","ab_disp","__SETTINGS__.siteSettings.ads_settings","wheel","window.height","/contextmenu|cut|copy|paste/","AB_AP1","checkAdsBlocked","canShowAds",".showModal","playbackItem.isStitched","url:a2d.tv/play","Ad","/fwmrm.net\\/ad\\/g/","em_track_user","exactmetrics_frontend","undefined","window.WURFL","1","uesUrlFallback","manualAutoplay_","TAKEOVER","monsterinsights_frontend","mi_track_user","advads","advanced_ads","e.defaultPrevented"];
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
})("05723a46-3114-4ba9-ac80-1c775003e606");

void 0;
