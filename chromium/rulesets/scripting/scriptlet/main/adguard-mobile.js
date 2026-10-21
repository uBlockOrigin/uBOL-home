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

// ruleset: adguard-mobile

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
const $hasAncestors$ = true;
const $hasRegexes$ = false;

/******************************************************************************/

const todo = new Set();

if ( $hasHostnames$ ) {
    const scriptletHostnames = /* 132 */ ["h1g.jp","blog.jp","news.jp","delfi.lt","m.iyf.tv","tu93.org","m.nuvid.*","nbc4i.com","redd.tube","seexh.com","xhbig.com","xhvid.com","erozine.jp","fullxh.com","google.com","kbook8.com","komaki2.jp","m.hd21.com","mangaz.com","megaxh.com","newegg.com","openxh.com","pornhd.com","saveur.com","supleks.jp","usnews.com","xhopen.com","xhspot.com","xhtree.com","gamerch.com","gotporn.com","m.efuxs.com","onlytik.com","openxh1.com","oreno3d.com","pornhex.com","pornhub.com","pornhub.net","pornhub.org","rakukan.net","reuters.com","trashbox.ru","xhamster3.*","xhmoon5.com","xhtotal.com","xhwide1.com","xhwide2.com","xhwide5.com","daotekno.com","gosexpod.com","idaprikol.ru","interxh.site","momon-ga.com","planetf1.com","sht-link.com","valuexh.life","xhaccess.com","xhadult2.com","xhadult3.com","xhamster.com","xhamster.one","xhamster13.*","xhamster16.*","xhamster17.*","xhamster18.*","xhdate.world","youpouch.com","aawweb.beauty","colourxh.site","erobanach.com","m.drtuber.com","m.tnaflix.com","m.viptube.com","mangalivre.tv","mediafire.com","player4me.vip","stripchat.com","tr.usbxh.life","xhamster.desi","xhamster2.com","xhamster3.com","xhamster7.com","xhamster8.com","xhamster9.com","xhbranch5.com","xhchannel.com","xhlease.world","xhplanet2.com","galleryxh.site","m.sunporno.com","news.mynavi.jp","quiz-facts.com","soranews24.com","xhamster1.desi","xhamster10.com","xhamster12.com","xhamster14.com","xhamster15.com","xhamster19.com","xhamster2.desi","xhamster22.com","xhamster27.com","xhamster4.desi","xhamster40.com","xhamster5.desi","xhofficial.com","xhwebsite2.com","dailymotion.com","m.hellporno.com","planefinder.net","www.nytimes.com","xhamster18.desi","xhamster19.desi","xhamster20.desi","xhamster42.desi","xhamster43.desi","xhamster44.desi","xhamster46.desi","moneycontrol.com","outlook.live.com","rocketnews24.com","straitstimes.com","xhamsterporno.mx","m.livehindustan.com","m.minixiaoshuow.com","mudainodocument.com","business-standard.com","www.dailymotion.com>>","nijimen.kusuguru.co.jp","wuxianxiaoshuowang.com","nazology.kusuguru.co.jp","timesofindia.indiatimes.com"];
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
        const arglistRefs = /* 132 */ ["66","72","53,54,55,56,57","36","47","67","33,41","26","6","75","75","75","18","75","-11","60","71","33,41","58","75","65","75","51","27","45","52","75","75","75","73","48","29","62,63","75","24","13","30,31,32","30","30","68","74","61","75","75","75","75","75","75","11","59","42","75","22","15","14","75","75","75","75","75","75","75","75","75","75","75","23","75","75","34,35","41","49,50","33","16","43","64","75","75","75","75","75","75","75","75","75","75","75","75","75","38","39","28","23","75","75","75","75","75","75","75","75","75","75","75","75","75","75","8,9,20","37","12","1,2,3,4","75","75","75","75","75","75","75","46","7","23","44","75","19","69,70","40","25","10","17","21","17","5"];
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
    const arglists = /* 76 */ ["","16,0,1,2,3,4","40,5,6,7","40,8,6,7","11,9,10","11,11,10","11,12,13","11,14,15","2,16,17,6,18","3,16,17,6,19","46,20,17,21","14,22","11,23,24","14,25","15,26","19,27","22,28,22","14,29","11,30,17","22,31,32","11,33,10","19,34","22,35,36","17,37,38","11,39,40","26,41,42,43","14,44,45","17,46,47","22,28,48","11,49,24","11,50,15","1,51,42,43","12,52,53","11,54,15","22,17,55","31,56","11,57,58","11,59,58","12,60,61","22,62,63","22,64","19,65","17,66,67","11,68,24","12,69","12,70,71","11,72,24","26,73,17,74","11,75,24","11,76,77","11,78,77","19,79","11,80,24","11,81,13","11,82,24","11,83,24","11,84,24","11,85,24","26,86","31,87","23,88,89","11,90,24","11,91,77","22,92,93","31,94","2,95,17,6,96","17,97,98","12,99,17","22,28,100","11,101,10","11,102,1","12,103,104","12,105,106","19,107","17,46,108","12,99,109"];
    const args = /* 110 */ ["matchMedia.call","1","json:\"none\"","condition","max-width","..show_ads=false","propsToMatch","/statsig/initialize?","v2:$.param_stores.*./^interstitial_/.value.shouldShow=false","Object.prototype.hasAd","false","Object.prototype.isAdActive","Object.prototype.vastOptions","{}","Object.prototype.showNativeAdFormat","0","advertising","","/player/metadata",".json","[breakId]","_VMAP_","bait","Object.prototype.showInterstitialModalIfRequired","noopFunc","/AdBlock/i","adsbygoogle","freeProConfig.btnRefresh","DOMContentLoaded","adBoxEl","mobiles","scroll","adBlockerCalled","DMP_IS_AUTOPLAY_ENABLED","createApp","load","document.cookie","id","#div-gpt-ad-header","inviewstitial_fired","true","(f-1)","*","0.001","firstLoad","300","style",".tadm_ad_unit","interstitial-popup","add_h2023","abp1","continueToVideoUrl","JSON.parse","/interstitial?viewkey=","player.postitialTimeout","returnAd","hidden","adformtag","[]","customAdlistMob","$","exoMobilePop","/^(?:scroll|touchmove|wheel)$/","preventDefault","/^(?:mousewheel|touchmove)$/","mobileAdvPop","data-universal-link","body","InfCustomSTAMobileFunc","bindPostitial","document.getElementsByClassName","adBlocked","initializeInterstitial","isPeriodic","0.02","PopUnder.bindEvent","exoUrl","undefined","organicPop","popUnderUrl","Object.prototype.vjsPlayer.ads","nor","nor.pageview","nor.eventURL","nor.pageviewURL","nor.setPageData","countdown","crLoad","eval","/ddnext|ddtop/","bw_no_ad","ads_every_x_videos","click","clkUnder","cache_loader","RecommendItems.RecommendInfo.[-].DataSource.[=].spsr RecommendInfo.[-].DataSource.[=].spsr","m/product/ajax/productPersonalization","height","iframe[src=\"https://dq.h1g.jp/img/ad/ad_heigu.html\"]","document.createElement","interstitialAdDiv","showme","pcc","jmp","Math","document.write","_rand","adsbyimobile","div[class*=\"site-header__with-mobile-leaderboard\"]","window.ts"];
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
