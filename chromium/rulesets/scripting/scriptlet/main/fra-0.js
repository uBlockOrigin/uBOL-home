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

// ruleset: fra-0

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
    const scriptletHostnames = /* 127 */ ["m6.fr","geo.fr","qub.ca","rtl.be","rtl.fr","tf1.fr","gala.fr","macg.co","oqee.tv","rtl2.fr","20min.ch","7sur7.be","dhnet.be","radio.fr","voici.fr","9docu.org","actu17.fr","darkino.*","france.tv","japscan.*","playtv.fr","qwant.com","11anim.com","capital.fr","chatnow.fr","e-sushi.fr","japscan.me","planhub.ca","rmcplus.fr","rtlplay.be","rustica.fr","skyrock.fr","sudinfo.be","tf1info.fr","tv.free.fr","tvaplus.ca","allocine.fr","bleachmx.fr","cinefil.com","ebookdz.com","funradio.fr","lemanip.com","malekal.com","pianoweb.fr","skyrock.com","sudouest.fr","systemed.fr","webflix.art","1jour1film.*","20minutes.fr","cookomix.com","gamekult.com","gentside.com","jeune-gay.fr","jtrouver.com","mac4ever.com","sushiscan.st","tvasports.ca","varmatin.com","abcbourse.com","adala-news.fr","basketusa.com","canalplus.com","hack-life.net","iphonesoft.fr","lessentiel.lu","monumentum.fr","nakastream.tv","nicematin.com","vostfr.stream","air-journal.fr","chat.babel.com","crunchyscan.fr","ecranlarge.com","iphonetweak.fr","justarrived.lu","magicmaman.com","marieclaire.fr","monacomatin.mc","monlatuque.com","rmcbfmplay.com","1jour1film.cyou","cosmopolitan.fr","coupdepouce.com","cyclismactu.net","empire-stream.*","hollywoodpq.com","lecrabeinfo.net","lindependant.fr","linternaute.com","recreatisse.com","supersoluce.com","voyageforum.com","empire-anime.com","femmeactuelle.fr","journaldunet.com","journalduweb.org","maxisciences.com","programme-tv.net","e-player-stream.*","empire-stream.net","empire-streamz.fr","jardiner-malin.fr","observalgerie.com","seriepourvous.com","super-ethanol.com","ultimate-catch.eu","empire-streaming.*","equinoxmagazine.fr","jaitoutcompris.com","meteo-grenoble.com","parlons-basket.com","prod-player.tf1.fr","techno-science.net","cliqueduplateau.com","commentcamarche.net","e-player-stream.app","journaldesfemmes.fr","lameteoagricole.net","signal-arnaques.com","animedigitalnetwork.fr","lecourrier-du-soir.com","occasions.decathlon.fr","benjaminellisbernard.fr","animationdigitalnetwork.fr","animationdigitalnetwork.com","player.melaniezettofrais.online"];
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
        const arglistRefs = /* 127 */ ["74,75,125,126,127,128,129","113","16","41","115","76,77,78,79,80,125,126,127,128,129","113","110","20","115","94","41","41","42","113","53","120","32","33","86,90","70,71","132","116","113","6","117","111,112","10","1,2","124","19,46","72","41","79,80,81,130","20","16","114","63","34","24,37","115","39","36","43","72","85","24,46","90","134","59","21,22,23","11","113","91","67","44","3,4,5","9","54","52","14,15","118","73,122,123","64","69","94","38","90,131","8,17,54","53","24","51","47,48,49,50","135","69","88","89","83","61","10","28,29","84","109","9","25,26,27","90,96,97,98,99,100,101,102,103","60","13","119","68","65","82","66","24,35,90,96,97,98,99,100,101,102,103,104,105,106","113","12","7","113","113","107","35","35,90,96,97,98,99,100,101,102,103","62","133","84","30","65","24,35,90,95,96,97,98,99,100,101,102,103,104,105,106","14,15","45","10","44","121","10","58","12,57","108","12,18","10","10,40","10","55,56","92,93","31","6,10","6,10","87"];
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
    const arglists = /* 136 */ ["","14,0,1","15,2","19,3","12,4,5","14,6","14,7","14,8","14,9,10","11,11,12","15,13","14,14","7,15","11,16,17","12,18,19","11,20,12","11,21,22","22,23,24","11,25,26","11,27,28","50","35,29","11,30,31","14,32","13,13","14,33","22,23,33","22,34,33","14,35","15,36,37","12,38","19,39","15,40","15,41","11,42,28","11,43,17","15,44","19,45","12,46,47","12,48,24","11,49,31","11,50,12","19,51","11,52,53","11,54,31","11,55,56","31,57","15,58","12,59,60","12,61,62","12,63,60","24,64","12,46,65","19,66","11,67,12","24,68","22,23,68","11,25,12","12,69,70","11,71,31","11,72,12","12,73,74","11,75,12","19,76","11,77,12","12,46,78","14,68","11,79,28","7,80","19,81","11,82,22","11,83,22","11,84,28","7,85","13,86","11,87,12","11,88,12","11,89,12","11,90,12","15,91","15,92","26,93,94,95","1,96,94,95","1,97,94,95","17,98,99","1,100,94,95","14,101","22,102,103","11,104,28","1,105,94,95","10","14,106,107","11,108,28","11,109,28","1,110,94,95","17,98,111","11,112,12","11,113,17","11,114,26","11,115,26","11,116,26","11,117,26","11,118,26","11,119,26","11,120,121","11,122,53","11,123,53","11,124,56","11,125,31","1,126,94,95","22,23,127","12,128,129","12,48,130","11,131,12","11,132,22","11,133,28","19,134","11,135,31","19,136","19,137","31,138","11,139,28","11,140,12","7,141,142","7,143,144","11,145,146","11,147,146","11,148,146","11,149,146","11,150,146","11,151,12","26,152,94,95","7,153,154","12,155,156","17,98,157","31,136"];
    const args = /* 158 */ ["offsetHeight","200","imasdk.googleapis.com","__vpx","Array.prototype.forEach","/bloqueur|amazon-adsystem\\.com/","/walled|adsbygoogle|new Image\\(\\)\\.src|\\)return;if\\(_/","getComputedStyle","/siteAccessNotification|checkBaitElement/","rhoostatus","100","__NEXT_DATA__.runtimeConfig._qub_sdk.qubConfig.ad.adBlockerDetectorEnabled","false","pagead2.googlesyndication.com","displayCookieWallBanner","siteParams.aabMessage","LCI.adNetwork","undefined","jQuery","adblocker","penci_options_set.ad_blocker_detector","ima","{}","DOMContentLoaded","adblock","integrityObserver.corrupted","0","checkAdsBlocked","noopFunc","Date.now","dAp","true","detected","isAdblock","load",".offsetParent||0===","/www3\\.doubleclick\\.net|tagger\\.opecloud\\.com|fwmrm\\.net|imasdk\\.googleapis\\.com/","emptyArr","chp_ads_blocker_detector","adsBlocked","tag.min.js","fwmrm","checkDiv","navigator.brave","js.sddan.com","ABDetector","document.getElementById","Blocking Ads","document.createElement","moneyAbovePrivacy","bAdBlocker","Object.prototype.autoRecov","noPub","1","canRunAds","adClasses","[]","dtctAB","adskeeper.co.uk","document.write","alert","setTimeout","bloqueur","Promise","window.location","msg_ab","gothamBatAdblock","adblockdetected","adsbygoogle","document.querySelector","oadbActive","window.adsapp","ujloijdkhjkwus","$","checkAds","wIsAdBlocked","mdpDeBlocker","adBlockDetected","adback","google_jobrunner","adParams siteParams.aabMessage","onload","ptv.Data.uniroll","pmd.Data.uniroll","OAS_AD","ads.enableAntiAdBlocking","v.fwmrm.net","Object.prototype.isBlockerDetected","__TF1_CONFIG__.featureFlag.contentAccess.isAdblockCheckRequired","__TF1_CONFIG__.adblock.display","__TF1_CONFIG__.adblock.serverRequest","static.adsafeprotected.com/favicon.ico","/^https:\\/\\/ads\\.stickyadstv\\.com\\/$/ method:HEAD","defaultConsentString","*","0.001","event_listener_timeout","/userConsentProcess|this===/","href","a[href]#clickfakeplayer","return t()","sessionStorage","click","Popup","advanced_ads_ready","userConsentProcessEnded","randno","25","FastClick","FastClick.attach","setTimeoutIds_",".content-propose > a[href].btn-ad-iframe","empire.isAdbActive","empire.directHideAds","empire.countpremium.film","empire.countpremium.serie","empire.countpremiumMore.film.count","empire.countpremiumMore.serie.count","empire.countpremiumaccount.film","empire.countpremiumaccount.serie","empire.mediaData.advisorDirect","","empire.mediaData.advisorMovie","empire.mediaData.advisorSerie","adsConfig","isSetupAccess","/userConsentProcessEnded|\\[0\\]\\+\"With\"/","interstitial","JSON.parse","document.createElement('script')","document.documentElement).appendChild","Object.prototype.withAds","AC.config.ads","getAudioAdUrl","zoneSett","aEteAffiche","__yget_ad_list","_adb","td_ad_background_click_link","Object.prototype.sendPauseMidrollTracking","__data.application.settings.featPlayerAds","ads.*.default ads.*.url ads.enableMidrolls","ads","applaunch.data.player.features.ad.enabled applaunch.data.player.features.ad.dai.enabled","appName","tv.freewheel.SDK.Util.pingURLWithForm","trueFunc","tv.freewheel.SDK.Util.pingURLWithImage","tv.freewheel.SDK.Util.pingURLWithScript","tv.freewheel.SDK.Util.pingURLWithXMLHTTPRequest","tv.freewheel.SDK.Util.sendAdRequestWithXMLHTTPRequest","__NEXT_DATA__.runtimeConfig.playerTF1.ads.enable","<=1?(clearInterval","data.result.items.sidebar.[-].type.[=].advertiser_ads","data.search_id","fetch","Uint8Array","#clickfakeplayer"];
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
