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

// ruleset: kor-1

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
const $hasRegexes$ = true;

/******************************************************************************/

const todo = new Set();

if ( $hasHostnames$ ) {
    const scriptletHostnames = /* 142 */ ["asdn.kr","cpsp.kr","heye.kr","zum.com","dfast.kr","fafan.kr","hasha.in","imbc.com","meeco.kr","pping.kr","te31.com","youtu.co","zzzz.lol","cfnews.kr","enuri.com","jootc.com","kilho.net","nesin.com","noonnu.cc","sbs.co.kr","sogirl.so","x86.co.kr","deokhu.com","laftel.net","mjmedi.com","newneek.co","yachuk.com","333aaa.site","3dpchip.com","domin.co.kr","ehpub.co.kr","hub.zum.com","inven.co.kr","keela.co.kr","newsn24.com","plankim.com","remiz.co.kr","ssulwar.com","tistory.com","untitle.org","zuzunza.com","cheatdot.com","chzzkban.xyz","klauncher.kr","koreapas.com","love.asdn.kr","lover932.net","lover933.net","lover934.net","lover935.net","lover936.net","lover937.net","lover938.net","lover939.net","lover940.net","lover941.net","momkim.co.kr","namechart.kr","poketory.com","sajuplus.net","sysnet.pe.kr","tvchosun.com","withukor.com","blackkiwi.net","etoland.co.kr","jiwootube.com","m.fmkorea.com","map.naver.com","skysky138.com","tv.jtbc.co.kr","www.naver.com","bikesell.co.kr","blog.dalso.org","dpg.danawa.com","eftlibrary.com","errornight.com","filetender.com","m.dcinside.com","mplay.mk.co.kr","spotvnow.co.kr","stockinfo7.com","10000recipe.com","auto.danawa.com","digitstar77.com","doctornow.co.kr","fun-iyagi.co.kr","iphonedev.co.kr","kyobobook.co.kr","m.humoruniv.com","mememedia.co.kr","mvod.jtbc.co.kr","news.jtbc.co.kr","picknpicker.com","stock.naver.com","windowsforum.kr","aannm.cafe24.com","actingbaum.co.kr","healthfeed.co.kr","itinformation.kr","mylocation.co.kr","onair.jtbc.co.kr","platformgreat.kr","postincome.co.kr","smartinpress.com","sotrychatter.com","timecoffee.co.kr","vod.sooplive.com","whathappen.co.kr","dinfo.3dpchip.com","enjoytaiwan.co.kr","gall.dcinside.com","goodmorningcc.com","hub.weirdhost.xyz","humors.zigcou.com","m.place.naver.com","moneyissues.co.kr","moneytoring.co.kr","search.11st.co.kr","stdpay.inicis.com","detegice.github.io","news.ssongyi.co.kr","thelabyrinth.co.kr","focuskr.tistory.com","genshin.gamedot.org","hashnews.cafe24.com","ilsangt.tistory.com","minipol.tistory.com","seo-marketing.co.kr","enjoyplan.tistory.com","pcmap.place.naver.com","shoppinghow.kakao.com","watchfreejavonline.co","www.cultureland.co.kr","beomil09121.cafe24.com","shopping.interpark.com","xn--wh1b751afvcpsb.com","checkwhoiam.tistory.com","luckyquiz3.blogspot.com","1004lucifer.blogspot.com","search.shopping.naver.com","msearch.shopping.naver.com","singingdalong.blogspot.com"];
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
        const arglistRefs = /* 142 */ ["70","82","19","1","33","72","118","65","78","60","74,75","33","68","58","18,49","77","24,66","52","81","39,50","113","75","104","27,56","55","20","43","46","104,105,106","51","77","32","47","45","41","76","70,94","110","70,71,72,73,74,75,117","70","71","91","87","100","64","70","119","119","119","119","119","119","119","119","119","119","42","98","70","117","107","57","70","98","90","45","12","21","45","92","15","70","72","62,63","98","109","59","83,84,85","25","79,80,81,82","116","29","120","37","28","46","71","53,54","3,4,5,6,7,8,9,10,11","34","92","96","45","17","89","44","45","70","37","93","92,96","23","37","41","45","46","16","42","99","70","86","14","101,102","36","22","45","37","30","13","111","45","88","114","108","48","112","97","70","26","22","61","2","31","44","38","45","95","103","75","40","35","115"];
        for ( const i of todoIndices ) {
            for ( const ref of JSON.parse(`[${arglistRefs[i]}]`) ) {
                todo.add(ref);
            }
        }
    }
}

if ( $hasRegexes$ ) {
    const scriptletFromRegexes = /* 1 */ ["lover","lover[0-9]\\.net","67,69"];
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
    const arglists = /* 121 */ ["","11,0,1","12,2","11,3,4","11,5,4","11,6,4","11,7,4","11,8,4","14,9","11,10,4","23,11,12","12,11,13","7,14,15","10,16","10,17","11,18,19","3,20,21,22","11,23,4","11,24,4","10,25","13,26","3,27,21,28,29","7,30","11,31,32","12,33,34","13,35,36","14,37","24,38,39","7,40,41","14,42","7,43,44","23,45,46","11,47,21,21,48","22,49,50","11,51,21,48","7,52","11,53,54","14,55","11,56,4","11,57,4","7,58","12,59,60","22,61,62","12,33,62","12,33,63","12,64,60","11,65,32","17,66,67","19,68","7,69","11,70,32","11,71,4","12,72,73","17,66,74","17,66,75","12,71","13,76","11,77,1","12,78,79","14,21,80","17,66,81,82","7,83","12,84,85","12,84,86","11,87,4","11,88,32","11,89,4","22,90,91","24,92","1,93,21,94","12,95,96","14,97","37","58","33","19,98","12,99","12,100","11,101,4","13,102","15,102","13,103","15,103","14,104","22,105,106","13,104,107","11,108,21","15,109,107","15,110","22,111,112","15,113","14,114","14,115","14,116","49,34,117,118","11,119,4","49,120,117,118","11,121,32","15,122","11,123,1","22,111,124","15,125","15,126","13,127","12,128","13,129,107","31,130","14,131","14,132","23,133,134","12,135,136","19,137","12,84,138","11,139,1","12,140,141","12,84,142","14,143","11,144,4","15,145","14,146","11,147,4"];
    const args = /* 148 */ ["_ads_zum_main_initbanner_750_zum_main_br_widget_336","true","popMagic.init","list_end_run_read_top_boom","noopFunc","list_end_run_pds_notice_boom","list_end_run_comment_bottom_boom","list_end_run_center_boom","list_end_run_list_bottom_boom","height && 1 <= height && height <= 20","list_end_run","$.prototype.html","_boom","/\\/images\\/[A-z0-9-_]+\\.?(jpg|gif)/","tpl apply","tpl.[].c","ds-cdn.inicis.com/ad/","bannerpop/popup.html","EAGER-DATA.CAS-MINICONTENT-PC-WHALE-BANNER-BOTTOM","null","data.adballoon","","station/video/a/view","MobileDetect","getPowerLink","pandalive.co.kr/evt/","api-v2.adrop.io/request","layers.[-].metadata.name.{=}.POI_Ads","propsToMatch","url:/PCWeb_Real.json","[].data.poiRecommendations.recommendations.[].items.[-].adClickLog.clickUrl","commonTrailer","undefined","jQuery",".adsbygoogle","ad.smartmediarep.com/NetInsight/video/smr","length:300","coupangAd","[native code]","1000","data","data.getBannerAdExchange","popup_goods","powerLink","powerLink.ads","String.prototype.substring","/checkCookie.+main\\.do/","Math.uuid","asFunction","hashchange","#viewus-explore-more","jQuery.fn.getUrlParameter","adRecommend.adUnits.[]","window.__NEXT_DATA__.props.pageProps.initialState.post.adhistory","{}","piBlock","$is.powerLink.loadPowerLink","SbsHtml5PlayerContainer.prototype.renderAdSequence","data.BrandAd","jQuery.prototype.load","is_coupang","DOMContentLoaded","link.coupang.com","coupang_dont_show_prompty_interval","jQuery.prototype.on","pum_vars","placeholder","#webzineHeadmenuF1 input[placeholder][autocomplete=\"off\"]","pum_popups","data.supertopADNos","player.renderAdSequence","bannerpop.popup","open","/\\/popup\\//","input#searchMainKeyword","input#searchKeyword","api/avods/v1/advertisement","player.advertisement_finished","window.open","/gears/popup/default.aspx","15000","input.search_input","asap stay","ads","$","/danawa-dpg-common-sponsorBanner-/","myScript[myScript.length - 1 ]","random_imglink","vrixadsdk","hahaha","click","'opMagic","animationEffects[settings.animation.effect]","closeBtn.innerHTML","0.001","document.addEventListener","/adscale_slot_id/","/\\.displayMessage\\(/","adBlockDetected","ai_adb.init","ai_run_scripts","adsBlocked","imasdk.googleapis.com/js/sdkloader/ima3.js","pagead2.googlesyndication.com/pagead/js/adsbygoogle.js","addc.dcinside.com","pageshow","/\\.persisted *&& *interval_Ad *&& *clearInterval\\( *interval_Ad *\\)/","emptyStr","blockedState","pagead2.googlesyndication.com/pagead/js/adsbygoogle.js method:HEAD","pagead2.googlesyndication.com method:HEAD","load","banner.offsetHeight","/pagead2.googlesyndication.com|googleads.g.doubleclick.net|googletagservices.com|securepubads.g.doubleclick.net|googleads.g.doubleclick.net|google-analytics.com|googlesyndication.com|doubleclick.net/","window.getComputedStyle(t).display","getComputedStyle(t).getPropertyValue(\"visibility\")","detectAdBlockByStructure","display","block","adblockChecker",".ad-banner.adsbox.ad-unit.ad-zone","checkAdBlock","www3.doubleclick.net","linkPass","_0x","adblockanalytics.com","adsbygoogle.js","adsbygoogle","chp_ads_blocker_detector","/compass.adop.cc|adsbygoogle|taboola/","HTMLAnchorElement.prototype.onclick","banner_book","blockCheck2022","alert","chk_adBlock","document.getElementById","adblock","$.prototype.fadeIn",".adsense-area","DHAntiAdBlocker","addEventListener","fuckadblock.min.js","#ad_center","ad.innerHTML.replace","checkAds","adManager.js","document[_0x","NAVER_ADPOST_V2"];
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
