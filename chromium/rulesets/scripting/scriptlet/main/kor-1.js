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
const $hasRegexes$ = false;

/******************************************************************************/

const todo = new Set();

if ( $hasHostnames$ ) {
    const scriptletHostnames = /* 133 */ ["asdn.kr","cpsp.kr","heye.kr","zum.com","dfast.kr","fafan.kr","hasha.in","imbc.com","meeco.kr","pping.kr","te31.com","youtu.co","zzzz.lol","cfnews.kr","enuri.com","jootc.com","kilho.net","nesin.com","noonnu.cc","sbs.co.kr","sogirl.so","x86.co.kr","deokhu.com","laftel.net","mjmedi.com","newneek.co","yachuk.com","0gichul.com","333aaa.site","3dpchip.com","domin.co.kr","ehpub.co.kr","hub.zum.com","inven.co.kr","keela.co.kr","newsn24.com","plankim.com","remiz.co.kr","ssulwar.com","tistory.com","untitle.org","zuzunza.com","cheatdot.com","chzzkban.xyz","klauncher.kr","koreapas.com","love.asdn.kr","momkim.co.kr","namechart.kr","poketory.com","sajuplus.net","sysnet.pe.kr","tvchosun.com","withukor.com","blackkiwi.net","etoland.co.kr","jiwootube.com","m.fmkorea.com","map.naver.com","skysky138.com","tv.jtbc.co.kr","www.naver.com","bikesell.co.kr","blog.dalso.org","dpg.danawa.com","eftlibrary.com","errornight.com","filetender.com","m.dcinside.com","mplay.mk.co.kr","spotvnow.co.kr","stockinfo7.com","10000recipe.com","auto.danawa.com","digitstar77.com","doctornow.co.kr","fun-iyagi.co.kr","iphonedev.co.kr","kyobobook.co.kr","m.humoruniv.com","mememedia.co.kr","mvod.jtbc.co.kr","news.jtbc.co.kr","picknpicker.com","stock.naver.com","windowsforum.kr","aannm.cafe24.com","actingbaum.co.kr","healthfeed.co.kr","itinformation.kr","mylocation.co.kr","onair.jtbc.co.kr","platformgreat.kr","postincome.co.kr","smartinpress.com","sotrychatter.com","timecoffee.co.kr","vod.sooplive.com","whathappen.co.kr","dinfo.3dpchip.com","enjoytaiwan.co.kr","gall.dcinside.com","goodmorningcc.com","hub.weirdhost.xyz","humors.zigcou.com","m.place.naver.com","moneyissues.co.kr","moneytoring.co.kr","search.11st.co.kr","stdpay.inicis.com","detegice.github.io","news.ssongyi.co.kr","thelabyrinth.co.kr","focuskr.tistory.com","genshin.gamedot.org","hashnews.cafe24.com","ilsangt.tistory.com","minipol.tistory.com","seo-marketing.co.kr","enjoyplan.tistory.com","pcmap.place.naver.com","shoppinghow.kakao.com","watchfreejavonline.co","www.cultureland.co.kr","beomil09121.cafe24.com","shopping.interpark.com","xn--wh1b751afvcpsb.com","checkwhoiam.tistory.com","luckyquiz3.blogspot.com","1004lucifer.blogspot.com","search.shopping.naver.com","msearch.shopping.naver.com","singingdalong.blogspot.com"];
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
        const arglistRefs = /* 133 */ ["71","83","21","1","35","73","121","14,67","79","62","75,76","35","70","60","20,51","78","26,68","54","82","41,52","116","76","107","29,58","57","22","45","89,90","48","107,108,109","53","78","34","49","47","43","77","71,97","113","71,72,73,74,75,76,120","71","72","94","88","103","66","71","44","101","71","120","110","59","71","101","93","47","12,13","23","47","95","17","71","73","64,65","101","112","61","84,85,86","27","80,81,82,83","119","31","122","39","30","48","72","55,56","3,4,5,6,7,8,9,10,11","36","95","99","47","19","92","46","47","71","39","96","95,99","25","39","43","47","48","18","44","102","71","87","16","104,105","38","24","47","39","32","15","114","47","91","117","111","50","115","100","71","28","24","63","2,69","33","46","40","47","98","106","76","42","37","118"];
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
    const arglists = /* 123 */ ["","11,0,1","12,2","11,3,4","11,5,4","11,6,4","11,7,4","11,8,4","14,9","11,10,4","23,11,12","12,11,13","7,14,15","8,16","3,17,18,19,20","10,21","10,22","11,23,24","3,25,26,27","11,28,4","11,29,4","10,30","13,31","3,32,26,19,33","7,34","11,35,36","12,37,38","13,39,40","14,41","27,42,43","7,44,45","14,46","7,47,48","23,49,50","11,51,26,26,52","22,53,54","11,55,26,52","7,56","11,57,58","14,59","11,60,4","11,61,4","7,62","12,63,64","22,65,66","12,37,66","12,37,67","12,68,64","11,69,36","18,70,71","17,72","7,73","11,74,36","11,75,4","12,76,77","18,70,78","18,70,79","12,75","13,80","11,81,1","12,82,83","14,26,84","18,70,85,86","7,87","12,88,89","12,88,90","11,91,4","11,92,36","11,93,4","10,94","27,95","12,96,97","14,98","38","58","34","17,99","12,100","12,101","11,102,4","13,103","15,103","13,104","15,104","14,105","22,106,107","13,105,108","11,109,26","15,110,108","14,111","22,112,111","15,113","22,112,114","15,115","14,116","14,117","14,118","49,38,119,120","11,121,4","49,122,119,120","11,123,36","15,124","11,125,1","22,112,126","15,127","15,128","13,129","12,130","13,131,108","32,132","14,133","14,134","23,135,136","12,137,138","17,139","12,88,140","11,141,1","12,142,143","12,88,144","14,145","11,146,4","15,147","11,148,4"];
    const args = /* 149 */ ["_ads_zum_main_initbanner_750_zum_main_br_widget_336","true","popMagic.init","list_end_run_read_top_boom","noopFunc","list_end_run_pds_notice_boom","list_end_run_comment_bottom_boom","list_end_run_center_boom","list_end_run_list_bottom_boom","height && 1 <= height && height <= 20","list_end_run","$.prototype.html","_boom","/\\/images\\/[A-z0-9-_]+\\.?(jpg|gif)/","tpl apply","tpl.[].c","$..[?@.c=/YWRlci5uYXZlci5j|ZXIubmF2ZXIuY29t|ZGVyLm5hdmVyLmNv/];$./^(apply|tpl|bt)$/","AdInfo","AdInfo.adtype","propsToMatch","url:/Player\\/PlayerUtil|Player\\/MbicPlayerUtil/","ds-cdn.inicis.com/ad/","bannerpop/popup.html","EAGER-DATA.CAS-MINICONTENT-PC-WHALE-BANNER-BOTTOM","null","data.adballoon","","station/video/a/view","MobileDetect","getPowerLink","pandalive.co.kr/evt/","api-v2.adrop.io/request","layers.[-].metadata.name.{=}.POI_Ads","url:/PCWeb_Real.json","[].data.poiRecommendations.recommendations.[].items.[-].adClickLog.clickUrl","commonTrailer","undefined","jQuery",".adsbygoogle","ad.smartmediarep.com/NetInsight/video/smr","length:300","coupangAd","[native code]","1000","data","data.getBannerAdExchange","popup_goods","powerLink","powerLink.ads","String.prototype.substring","/checkCookie.+main\\.do/","Math.uuid","asFunction","hashchange","#viewus-explore-more","jQuery.fn.getUrlParameter","adRecommend.adUnits.[]","window.__NEXT_DATA__.props.pageProps.initialState.post.adhistory","{}","piBlock","$is.powerLink.loadPowerLink","SbsHtml5PlayerContainer.prototype.renderAdSequence","data.BrandAd","jQuery.prototype.load","is_coupang","DOMContentLoaded","link.coupang.com","coupang_dont_show_prompty_interval","jQuery.prototype.on","pum_vars","placeholder","#webzineHeadmenuF1 input[placeholder][autocomplete=\"off\"]","pum_popups","data.supertopADNos","player.renderAdSequence","bannerpop.popup","open","/\\/popup\\//","input#searchMainKeyword","input#searchKeyword","api/avods/v1/advertisement","player.advertisement_finished","window.open","/gears/popup/default.aspx","15000","input.search_input","asap stay","ads","$","/danawa-dpg-common-sponsorBanner-/","myScript[myScript.length - 1 ]","random_imglink","vrixadsdk","hahaha","!watchfreejavonline.co","animationEffects[settings.animation.effect]","document.addEventListener","/adscale_slot_id/","/\\.displayMessage\\(/","adBlockDetected","ai_adb.init","ai_run_scripts","adsBlocked","imasdk.googleapis.com/js/sdkloader/ima3.js","pagead2.googlesyndication.com/pagead/js/adsbygoogle.js","addc.dcinside.com","pageshow","/\\.persisted *&& *interval_Ad *&& *clearInterval\\( *interval_Ad *\\)/","emptyStr","blockedState","pagead2.googlesyndication.com/pagead/js/adsbygoogle.js method:HEAD","loadGichulAdScripts","load","pagead2.googlesyndication.com method:HEAD","banner.offsetHeight","/pagead2.googlesyndication.com|googleads.g.doubleclick.net|googletagservices.com|securepubads.g.doubleclick.net|googleads.g.doubleclick.net|google-analytics.com|googlesyndication.com|doubleclick.net/","window.getComputedStyle(t).display","getComputedStyle(t).getPropertyValue(\"visibility\")","detectAdBlockByStructure","display","block","adblockChecker",".ad-banner.adsbox.ad-unit.ad-zone","checkAdBlock","www3.doubleclick.net","linkPass","_0x","adblockanalytics.com","adsbygoogle.js","adsbygoogle","chp_ads_blocker_detector","/compass.adop.cc|adsbygoogle|taboola/","HTMLAnchorElement.prototype.onclick","banner_book","blockCheck2022","alert","chk_adBlock","document.getElementById","adblock","$.prototype.fadeIn",".adsense-area","DHAntiAdBlocker","addEventListener","fuckadblock.min.js","#ad_center","ad.innerHTML.replace","checkAds","adManager.js","NAVER_ADPOST_V2"];
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
})("28049053-2f06-4210-9323-9d4634fd8974");

void 0;
