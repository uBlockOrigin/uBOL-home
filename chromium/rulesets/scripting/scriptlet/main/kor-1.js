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
    const scriptletHostnames = /* 143 */ ["asdn.kr","cpsp.kr","heye.kr","zum.com","dfast.kr","fafan.kr","hasha.in","imbc.com","meeco.kr","pping.kr","te31.com","youtu.co","zzzz.lol","cfnews.kr","enuri.com","jootc.com","kilho.net","nesin.com","noonnu.cc","sbs.co.kr","sogirl.so","x86.co.kr","deokhu.com","laftel.net","mjmedi.com","newneek.co","yachuk.com","333aaa.site","3dpchip.com","domin.co.kr","ehpub.co.kr","hub.zum.com","inven.co.kr","keela.co.kr","newsn24.com","plankim.com","remiz.co.kr","ssulwar.com","tistory.com","untitle.org","zuzunza.com","cheatdot.com","chzzkban.xyz","klauncher.kr","koreapas.com","love.asdn.kr","lover932.net","lover933.net","lover934.net","lover935.net","lover936.net","lover937.net","lover938.net","lover939.net","lover940.net","lover941.net","momkim.co.kr","namechart.kr","poketory.com","sajuplus.net","sysnet.pe.kr","tvchosun.com","withukor.com","blackkiwi.net","etoland.co.kr","jiwootube.com","m.fmkorea.com","map.naver.com","skysky138.com","tv.jtbc.co.kr","www.naver.com","bikesell.co.kr","blog.dalso.org","dpg.danawa.com","eftlibrary.com","errornight.com","filetender.com","m.dcinside.com","mplay.mk.co.kr","spotvnow.co.kr","stockinfo7.com","10000recipe.com","auto.danawa.com","digitstar77.com","doctornow.co.kr","fun-iyagi.co.kr","iphonedev.co.kr","kyobobook.co.kr","m.humoruniv.com","mememedia.co.kr","mvod.jtbc.co.kr","news.jtbc.co.kr","picknpicker.com","stock.naver.com","windowsforum.kr","aannm.cafe24.com","actingbaum.co.kr","healthfeed.co.kr","itinformation.kr","mylocation.co.kr","onair.jtbc.co.kr","platformgreat.kr","playvod.imbc.com","postincome.co.kr","smartinpress.com","sotrychatter.com","timecoffee.co.kr","vod.sooplive.com","whathappen.co.kr","dinfo.3dpchip.com","enjoytaiwan.co.kr","gall.dcinside.com","goodmorningcc.com","hub.weirdhost.xyz","humors.zigcou.com","m.place.naver.com","moneyissues.co.kr","moneytoring.co.kr","search.11st.co.kr","stdpay.inicis.com","detegice.github.io","news.ssongyi.co.kr","thelabyrinth.co.kr","focuskr.tistory.com","genshin.gamedot.org","hashnews.cafe24.com","ilsangt.tistory.com","minipol.tistory.com","seo-marketing.co.kr","enjoyplan.tistory.com","pcmap.place.naver.com","shoppinghow.kakao.com","watchfreejavonline.co","www.cultureland.co.kr","beomil09121.cafe24.com","shopping.interpark.com","xn--wh1b751afvcpsb.com","checkwhoiam.tistory.com","luckyquiz3.blogspot.com","1004lucifer.blogspot.com","search.shopping.naver.com","msearch.shopping.naver.com","singingdalong.blogspot.com"];
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
        const arglistRefs = /* 143 */ ["72","84","20","1","34","74","120","66","80","61","76,77","34","70","59","19,50","79","25,67","53","83","40,51","115","77","106","28,57","56","21","44","47","106,107,108","52","79","33","48","46","42","78","72,96","112","72,73,74,75,76,77,119","72","73","93","89","102","65","72","121","121","121","121","121","121","121","121","121","121","43","100","72","119","109","58","72","100","92","46","12","22","46","94","16","72","74","63,64","100","111","60","85,86,87","26","81,82,83,84","118","30","122","38","29","47","73","54,55","3,4,5,6,7,8,9,10,11","35","94","98","46","18","91","45","46","72","38","95","94,98","24","13","38","42","46","47","17","43","101","72","88","15","103,104","37","23","46","38","31","14","113","46","90","116","110","49","114","99","72","27","23","62","2,68","32","45","39","46","97","105","77","41","36","117"];
        for ( const i of todoIndices ) {
            for ( const ref of JSON.parse(`[${arglistRefs[i]}]`) ) {
                todo.add(ref);
            }
        }
    }
}

if ( $hasRegexes$ ) {
    const scriptletFromRegexes = /* 1 */ ["lover","lover[0-9]+\\.net","69,71"];
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
    const arglists = /* 123 */ ["","11,0,1","12,2","11,3,4","11,5,4","11,6,4","11,7,4","11,8,4","14,9","11,10,4","23,11,12","12,11,13","7,14,15","3,16,17,18,19","10,20","10,21","11,22,23","3,24,25,26","11,27,4","11,28,4","10,29","13,30","3,31,25,18,32","7,33","11,34,35","12,36,37","13,38,39","14,40","25,41,42","7,43,44","14,45","7,46,47","23,48,49","11,50,25,25,51","22,52,53","11,54,25,51","7,55","11,56,57","14,58","11,59,4","11,60,4","7,61","12,62,63","22,64,65","12,36,65","12,36,66","12,67,63","11,68,35","18,69,70","17,71","7,72","11,73,35","11,74,4","12,75,76","18,69,77","18,69,78","12,74","13,79","11,80,1","12,81,82","14,25,83","18,69,84,85","7,86","12,87,88","12,87,89","11,90,4","11,91,35","11,92,4","10,93","22,94,95","25,96","1,97,25,98","12,99,100","14,101","36","58","32","17,102","12,103","12,104","11,105,4","13,106","15,106","13,107","15,107","14,108","22,109,110","13,108,111","11,112,25","15,113,111","15,114","22,115,116","15,117","14,118","14,119","14,120","49,37,121,122","11,123,4","49,124,121,122","11,125,35","15,126","11,127,1","22,115,128","15,129","15,130","13,131","12,132","13,133,111","30,134","14,135","14,136","23,137,138","12,139,140","17,141","12,87,142","11,143,1","12,144,145","12,87,146","14,147","11,148,4","15,149","14,150","11,151,4"];
    const args = /* 152 */ ["_ads_zum_main_initbanner_750_zum_main_br_widget_336","true","popMagic.init","list_end_run_read_top_boom","noopFunc","list_end_run_pds_notice_boom","list_end_run_comment_bottom_boom","list_end_run_center_boom","list_end_run_list_bottom_boom","height && 1 <= height && height <= 20","list_end_run","$.prototype.html","_boom","/\\/images\\/[A-z0-9-_]+\\.?(jpg|gif)/","tpl apply","tpl.[].c","AdInfo","AdInfo.adtype","propsToMatch","url:Player/PlayerUtil","ds-cdn.inicis.com/ad/","bannerpop/popup.html","EAGER-DATA.CAS-MINICONTENT-PC-WHALE-BANNER-BOTTOM","null","data.adballoon","","station/video/a/view","MobileDetect","getPowerLink","pandalive.co.kr/evt/","api-v2.adrop.io/request","layers.[-].metadata.name.{=}.POI_Ads","url:/PCWeb_Real.json","[].data.poiRecommendations.recommendations.[].items.[-].adClickLog.clickUrl","commonTrailer","undefined","jQuery",".adsbygoogle","ad.smartmediarep.com/NetInsight/video/smr","length:300","coupangAd","[native code]","1000","data","data.getBannerAdExchange","popup_goods","powerLink","powerLink.ads","String.prototype.substring","/checkCookie.+main\\.do/","Math.uuid","asFunction","hashchange","#viewus-explore-more","jQuery.fn.getUrlParameter","adRecommend.adUnits.[]","window.__NEXT_DATA__.props.pageProps.initialState.post.adhistory","{}","piBlock","$is.powerLink.loadPowerLink","SbsHtml5PlayerContainer.prototype.renderAdSequence","data.BrandAd","jQuery.prototype.load","is_coupang","DOMContentLoaded","link.coupang.com","coupang_dont_show_prompty_interval","jQuery.prototype.on","pum_vars","placeholder","#webzineHeadmenuF1 input[placeholder][autocomplete=\"off\"]","pum_popups","data.supertopADNos","player.renderAdSequence","bannerpop.popup","open","/\\/popup\\//","input#searchMainKeyword","input#searchKeyword","api/avods/v1/advertisement","player.advertisement_finished","window.open","/gears/popup/default.aspx","15000","input.search_input","asap stay","ads","$","/danawa-dpg-common-sponsorBanner-/","myScript[myScript.length - 1 ]","random_imglink","vrixadsdk","hahaha","!watchfreejavonline.co","click","'opMagic","animationEffects[settings.animation.effect]","closeBtn.innerHTML","0.001","document.addEventListener","/adscale_slot_id/","/\\.displayMessage\\(/","adBlockDetected","ai_adb.init","ai_run_scripts","adsBlocked","imasdk.googleapis.com/js/sdkloader/ima3.js","pagead2.googlesyndication.com/pagead/js/adsbygoogle.js","addc.dcinside.com","pageshow","/\\.persisted *&& *interval_Ad *&& *clearInterval\\( *interval_Ad *\\)/","emptyStr","blockedState","pagead2.googlesyndication.com/pagead/js/adsbygoogle.js method:HEAD","pagead2.googlesyndication.com method:HEAD","load","banner.offsetHeight","/pagead2.googlesyndication.com|googleads.g.doubleclick.net|googletagservices.com|securepubads.g.doubleclick.net|googleads.g.doubleclick.net|google-analytics.com|googlesyndication.com|doubleclick.net/","window.getComputedStyle(t).display","getComputedStyle(t).getPropertyValue(\"visibility\")","detectAdBlockByStructure","display","block","adblockChecker",".ad-banner.adsbox.ad-unit.ad-zone","checkAdBlock","www3.doubleclick.net","linkPass","_0x","adblockanalytics.com","adsbygoogle.js","adsbygoogle","chp_ads_blocker_detector","/compass.adop.cc|adsbygoogle|taboola/","HTMLAnchorElement.prototype.onclick","banner_book","blockCheck2022","alert","chk_adBlock","document.getElementById","adblock","$.prototype.fadeIn",".adsense-area","DHAntiAdBlocker","addEventListener","fuckadblock.min.js","#ad_center","ad.innerHTML.replace","checkAds","adManager.js","document[_0x","NAVER_ADPOST_V2"];
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
})("dc258953-addd-43ba-88a8-66e22006432e");

void 0;
