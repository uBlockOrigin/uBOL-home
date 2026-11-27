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
    const scriptletHostnames = /* 133 */ ["m6.fr","geo.fr","qub.ca","rtl.be","rtl.fr","tf1.fr","gala.fr","macg.co","oqee.tv","rtl2.fr","20min.ch","7sur7.be","dhnet.be","radio.fr","voici.fr","9docu.org","actu17.fr","darkino.*","flemmix.*","france.tv","japscan.*","playtv.fr","qwant.com","webflix.*","11anim.com","capital.fr","chatnow.fr","e-sushi.fr","japscan.me","planhub.ca","rmcplus.fr","rtlplay.be","rustica.fr","skyrock.fr","sudinfo.be","tf1info.fr","tv.free.fr","tvaplus.ca","allocine.fr","bleachmx.fr","cinefil.com","ebookdz.com","funradio.fr","lemanip.com","malekal.com","pianoweb.fr","skyrock.com","sudouest.fr","systemed.fr","webflix.art","webflix.bio","1jour1film.*","20minutes.fr","cookomix.com","gamekult.com","gentside.com","jeune-gay.fr","jtrouver.com","mac4ever.com","sushiscan.st","tvasports.ca","varmatin.com","webflix.surf","abcbourse.com","adala-news.fr","basketusa.com","canalplus.com","hack-life.net","iphonesoft.fr","lessentiel.lu","monumentum.fr","nakastream.tv","nicematin.com","vostfr.stream","air-journal.fr","chat.babel.com","crunchyscan.fr","ecranlarge.com","iphonetweak.fr","justarrived.lu","magicmaman.com","marieclaire.fr","monacomatin.mc","monlatuque.com","rmcbfmplay.com","1jour1film.cyou","cosmopolitan.fr","coupdepouce.com","cyclismactu.net","empire-stream.*","hollywoodpq.com","lecrabeinfo.net","lindependant.fr","linternaute.com","recreatisse.com","supersoluce.com","voyageforum.com","empire-anime.com","femmeactuelle.fr","french-anime.com","journaldunet.com","journalduweb.org","maxisciences.com","programme-tv.net","e-player-stream.*","empire-stream.net","empire-streamz.fr","jardiner-malin.fr","observalgerie.com","seriepourvous.com","super-ethanol.com","ultimate-catch.eu","vinteconto.com.br","empire-streaming.*","equinoxmagazine.fr","jaitoutcompris.com","meteo-grenoble.com","parlons-basket.com","prod-player.tf1.fr","techno-science.net","cliqueduplateau.com","commentcamarche.net","e-player-stream.app","journaldesfemmes.fr","lameteoagricole.net","signal-arnaques.com","animedigitalnetwork.fr","lecourrier-du-soir.com","occasions.decathlon.fr","benjaminellisbernard.fr","animationdigitalnetwork.fr","animationdigitalnetwork.com","player.melaniezettofrais.online"];
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
        const arglistRefs = /* 133 */ ["75,76,126,127,128,129,130","114","17","42","116","77,78,79,80,81,126,127,128,129,130","114","111","21","116","95","42","42","43","114","54","121","33","133,134","34","87,91","71,72","136","132","117","114","7","118","112,113","11","2,3","125","20,47","73","42","80,81,82,131","21","17","115","64","35","25,38","116","40","37","44","73","86","25,47","91","132","138","60","22,23,24","12","114","92","68","45","4,5,6","10","55","132","53","15,16","119","74,123,124","65","70","95","39","91,135","9,18,55","54","25","52","48,49,50,51","139","70","89","90","84","62","11","29,30","85","110","10","26,27,28","91,97,98,99,100,101,102,103,104","61","14","120","69","66","83","67","25,36,91,97,98,99,100,101,102,103,104,105,106,107","114","133,134","13","8","114","114","108","36","36,91,97,98,99,100,101,102,103,104","63","137","85","31","66","1","25,36,91,96,97,98,99,100,101,102,103,104,105,106,107","15,16","46","11","45","122","11","59","13,58","109","13,19","11","11,41","11","56,57","93,94","32","7,11","7,11","88"];
        for ( const i of todoIndices ) {
            for ( const ref of JSON.parse(`[${arglistRefs[i]}]`) ) {
                todo.add(ref);
            }
        }
    }
}

if ( $hasRegexes$ ) {
    const scriptletFromRegexes = /* 0 */ [];
    const { hns, path } = scriptletGlobals.origins[0];
    for ( let i = 0, n = scriptletFromRegexes.length; i < n; i += 2 ) {
        const { needle, hn, pn } = scriptletFromRegexes[i+0];
        let rehn, repn;
        for ( const target of hns ) {
            if ( target.includes(needle) === false ) { continue; }
            if ( rehn === undefined ) { rehn = new RegExp(hn); }
            if ( rehn.test(target) === false ) { continue; }
            if ( pn && path ) {
                if ( repn === undefined ) { repn = new RegExp(pn); }
                if ( repn.test(path) === false ) { continue; }
            }
            for ( const ref of JSON.parse(`[${scriptletFromRegexes[i+1]}]`) ) {
                todo.add(ref);
            }
        }
    }
}

// Execute scriptlets
if ( todo.size && todo.has(0) === false ) {
    const arglists = /* 140 */ ["","12,0","14,1,2","15,3","17,4","12,5,6","14,7","14,8","14,9","14,10,11","11,12,13","15,14","14,15","7,16","11,17,18","12,19,20","11,21,13","11,22,23","22,24,25","11,26,27","11,28,29","50","36,30","11,31,32","14,33","13,14","14,34","22,24,34","22,35,34","14,36","15,37,38","12,39","17,40","15,41","15,42","11,43,29","11,44,18","15,45","17,46","12,47,48","12,49,25","11,50,32","11,51,13","17,52","11,53,54","11,55,32","11,56,57","32,58","15,59","12,60,61","12,62,63","12,64,61","27,65","12,47,66","17,67","11,68,13","27,69","22,24,69","11,26,13","12,70,71","11,72,32","11,73,13","12,74,75","11,76,13","17,77","11,78,13","12,47,79","14,69","11,80,29","7,81","17,82","11,83,23","11,84,23","11,85,29","7,86","13,87","11,88,13","11,89,13","11,90,13","11,91,13","15,92","15,93","26,94,95,96","1,97,95,96","1,98,95,96","18,99,100","1,101,95,96","14,102","22,103,104","11,105,29","1,106,95,96","10","14,107,108","11,109,29","11,110,29","1,111,95,96","18,99,112","11,113,13","11,114,18","11,115,27","11,116,27","11,117,27","11,118,27","11,119,27","11,120,27","11,121,122","11,123,54","11,124,54","11,125,57","11,126,32","1,127,95,96","22,24,128","12,129,130","12,49,131","11,132,13","11,133,23","11,134,29","17,135","11,136,32","17,137","17,138","32,139","11,140,29","11,141,13","7,142,143","7,144,145","11,146,147","11,148,147","11,149,147","11,150,147","11,151,147","11,152,13","10,153","17,154","23,155,156","26,157,95,96","7,158,159","12,155,160","18,99,161","32,137"];
    const args = /* 162 */ ["Swal.fire","offsetHeight","200","imasdk.googleapis.com","__vpx","Array.prototype.forEach","/bloqueur|amazon-adsystem\\.com/","/walled|adsbygoogle|new Image\\(\\)\\.src|\\)return;if\\(_/","getComputedStyle","/siteAccessNotification|checkBaitElement/","rhoostatus","100","__NEXT_DATA__.runtimeConfig._qub_sdk.qubConfig.ad.adBlockerDetectorEnabled","false","pagead2.googlesyndication.com","displayCookieWallBanner","siteParams.aabMessage","LCI.adNetwork","undefined","jQuery","adblocker","penci_options_set.ad_blocker_detector","ima","{}","DOMContentLoaded","adblock","integrityObserver.corrupted","0","checkAdsBlocked","noopFunc","Date.now","dAp","true","detected","isAdblock","load",".offsetParent||0===","/www3\\.doubleclick\\.net|tagger\\.opecloud\\.com|fwmrm\\.net|imasdk\\.googleapis\\.com/","emptyArr","chp_ads_blocker_detector","adsBlocked","tag.min.js","fwmrm","checkDiv","navigator.brave","js.sddan.com","ABDetector","document.getElementById","Blocking Ads","document.createElement","moneyAbovePrivacy","bAdBlocker","Object.prototype.autoRecov","noPub","1","canRunAds","adClasses","[]","dtctAB","adskeeper.co.uk","document.write","alert","setTimeout","bloqueur","Promise","window.location","msg_ab","gothamBatAdblock","adblockdetected","adsbygoogle","document.querySelector","oadbActive","window.adsapp","ujloijdkhjkwus","$","checkAds","wIsAdBlocked","mdpDeBlocker","adBlockDetected","adback","google_jobrunner","adParams siteParams.aabMessage","onload","ptv.Data.uniroll","pmd.Data.uniroll","OAS_AD","ads.enableAntiAdBlocking","v.fwmrm.net","Object.prototype.isBlockerDetected","__TF1_CONFIG__.featureFlag.contentAccess.isAdblockCheckRequired","__TF1_CONFIG__.adblock.display","__TF1_CONFIG__.adblock.serverRequest","static.adsafeprotected.com/favicon.ico","/^https:\\/\\/ads\\.stickyadstv\\.com\\/$/ method:HEAD","defaultConsentString","*","0.001","event_listener_timeout","/userConsentProcess|this===/","href","a[href]#clickfakeplayer","return t()","sessionStorage","click","Popup","advanced_ads_ready","userConsentProcessEnded","randno","25","FastClick","FastClick.attach","setTimeoutIds_",".content-propose > a[href].btn-ad-iframe","empire.isAdbActive","empire.directHideAds","empire.countpremium.film","empire.countpremium.serie","empire.countpremiumMore.film.count","empire.countpremiumMore.serie.count","empire.countpremiumaccount.film","empire.countpremiumaccount.serie","empire.mediaData.advisorDirect","","empire.mediaData.advisorMovie","empire.mediaData.advisorSerie","adsConfig","isSetupAccess","/userConsentProcessEnded|\\[0\\]\\+\"With\"/","interstitial","JSON.parse","document.createElement('script')","document.documentElement).appendChild","Object.prototype.withAds","AC.config.ads","getAudioAdUrl","zoneSett","aEteAffiche","__yget_ad_list","_adb","td_ad_background_click_link","Object.prototype.sendPauseMidrollTracking","__data.application.settings.featPlayerAds","ads.*.default ads.*.url ads.enableMidrolls","ads","applaunch.data.player.features.ad.enabled applaunch.data.player.features.ad.dai.enabled","appName","tv.freewheel.SDK.Util.pingURLWithForm","trueFunc","tv.freewheel.SDK.Util.pingURLWithImage","tv.freewheel.SDK.Util.pingURLWithScript","tv.freewheel.SDK.Util.pingURLWithXMLHTTPRequest","tv.freewheel.SDK.Util.sendAdRequestWithXMLHTTPRequest","__NEXT_DATA__.runtimeConfig.playerTF1.ads.enable","_blank","_glxPdFix","fetch","onerror","<=1?(clearInterval","data.result.items.sidebar.[-].type.[=].advertiser_ads","data.search_id","Uint8Array","#clickfakeplayer"];
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
})("53fcf4d2-49bb-4393-a71d-8b50f97f973d");

void 0;
