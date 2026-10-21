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

// ruleset: chn-0

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
    const scriptletHostnames = /* 246 */ ["4hu.tv","8se.me","ddys.*","ebb.io","iyf.tv","le.com","msn.cn","qq.com","4gtv.tv","5278.cc","beqg.cc","cnys.tv","crxs.me","ddrk.me","jptt.tv","logi.im","now.com","slit.cn","wnacg.*","yfsp.tv","2urs.com","520cc.cc","69xx.one","av6k.com","avcao.cc","bde4.com","bde4.icu","huya.com","itdog.cn","jkpan.cc","koyi.pub","mxdm.xyz","nanai.tw","noy1.top","o8tv.com","poedb.tw","sohu.com","sudugu.*","t66y.com","tstrs.me","v.qq.com","xchina.*","xkyn.com","123pan.cn","233tw.com","51cg1.com","51zxw.net","akkxs.net","applnn.cc","axjbt.com","daybuy.tw","efuxs.com","fsbot.xyz","fxshu.top","ggjav.com","hboav.com","huavod.cc","iqiyi.com","linetv.tw","moeci.com","mpyit.com","nivod2.tv","nodejs.cn","playav.cc","qciss.net","rjno1.com","sssam.com","sudugu.cc","theav.xyz","wnacg1.cc","x99av.com","xvideo.cc","youku.com","123865.com","360lele.cc","445nan.com","520call.me","85tube.com","aiyifan.tv","caq98i.top","cidetxt.cc","d44t95.com","douyin.com","dqzboy.com","enhuku.com","g655p8.com","hanjuk.com","huavod.com","huavod.net","huavod.top","huoqwk.com","iplark.com","itbaoku.cn","jav777.xyz","laosu.tech","lpl.qq.com","m.86kl.com","m.lwxs.com","mcappx.com","mrds66.com","new.qq.com","nivod2.com","nivod4.com","nivod5.com","nunuju.net","pcbeta.com","pixnet.net","porn87.com","surirt.com","theporn.cc","tingfm.com","tsubasa.im","vikacg.com","wandhi.com","wnacg05.cc","www.qq.com","1090ys8.com","18comic.org","18comic.vip","3dmgame.com","69shumi.com","88files.net","91porna.com","bigpixel.cn","bingfeng.tw","bz88888.net","clp126.shop","ekamus.info","erciyan.com","free.com.tw","hsq233.shop","huanqiu.com","huaren.live","ikanbot.com","jav224.shop","jianshu.com","jkptgbf.xyz","m.13xsw.com","m.91zww.com","m.nivod2.tv","m.nivod4.tv","m.nivod5.tv","m.nivod7.tv","m.nivod8.tv","m.nivod9.tv","m.youku.com","mfulbvu.xyz","news.qq.com","nunuyy3.org","papalah.com","ttp229.shop","umbooks.com","v.ifeng.com","v.youku.com","vxetable.cn","xl02.com.de","youneed.win","youziks.com","1keydata.com","baomidou.com","bilibili.com","bukaivip.com","candylife.tw","docsmall.com","freedidi.com","gamersky.com","getitfree.cn","goodav17.com","m.nivod2.com","m.nivod4.com","ohmanhua.com","pansearch.me","pornbest.org","wikisport.cc","wxredian.com","xbeibeix.com","xiebruce.top","axu.pages.dev","axutongxue.cn","bilinovel.com","biquge321.com","biquge543.com","cocomanga.com","colamanga.com","embedrise.com","freejavbt.com","ftchinese.com","haoweichi.com","hentaicomic.*","linovelib.com","m.1024txt.com","macromicro.me","onemanhua.com","pg-wuming.com","pincong.rocks","slashlook.com","slashview.com","soft8ware.com","sports.qq.com","uptogo.com.tw","xgcartoon.com","yeshuyuan.com","zhenbuka3.com","174.127.195.98","axutongxue.com","axutongxue.net","axutongxue.vip","dianyingim.com","hanime1-me.icu","hanime1-me.top","iwatchme2u.com","javlibrary.com","m.shuhaige.net","moegirl.org.cn","ruanyifeng.com","tangdoucdn.com","v-wb.youku.com","wenxuecity.com","dogfight360.com","jmcomic-zzz.org","pokemonhubs.com","youranshare.com","axutongxue.space","foodieteller.com","haiwaishubao.com","league-funny.com","m.biqiugege8.com","player.hboav.com","banzhu1111111.com","banzhu2222222.com","banzhu3333333.com","banzhu4444444.com","banzhu5555555.com","banzhu6666666.com","banzhu7777777.com","banzhu8888888.com","banzhu9999999.com","m.biquge12345.com","wap.biqugewx.info","wap.yushuwu.cloud","work.weixin.qq.com","hamivideo.hinet.net","helper-employer.com","edc1014070.pixnet.net","axutongxue.onrender.com","taiwanlibrarysearch.herokuapp.com"];
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
        const arglistRefs = /* 246 */ ["145,146","22,194","80,81","69,70","105,106","196,197","124,125,126","212","14","93,142","179","94","160","80,81","150","45","96,97,98","58","136","105,106","23","19,43,115","143","178","133","141","53","195,208","38","41,59,60","49","222","198,199","28","122","68","159","168","72","11","202,209,210,211","22,194","113","104","61","152","116","100","95","133","198,199","174","14","203","140","91,92,93","6,7,8,9,10","181,207","64,65,66,67","48","14","214,215,216,217,218,219,220","25,30,31,161","16","131","47","84","168","143","136","103","123","129","104","203","20,182,183,184,185,186","19,52","114","105,106","29","169","145,146","171","15","204","145,146","149","6,7,8,9,10","6,7,8,9,10","6,7,8,9,10","203","173","41","73","2","209,210","132","100,101","17","152","211","214,215,216,217,218,219,220","214,215,216,217,218,219,220","214,215,216,217,218,219,220","168","62","137","140","18,19","143","53,56,57","76,77","144,180","26","158","211","51","32,33","32,33","99","179","104","187","41","71","168","5,155","45,46","175","198,199","5,155","39,40","6,7,8,9,10,104","147","5,155","110","187","205","107","221","221","221","221","221","221","130","187","211","111","51","5,155","104,170","176","130","34","154","86","177","37","25","213","138","198,199","25","3","151","78","127","221","221","87,88,89,90","36","108","104,156,167","4","42","79","200,201","200,201","27","179","179","44,87,88,89","44","104","104","24","83","136","54,55","206","165,166","87,88,89","85","50","53","14","1","209,210,211,-213","198,199","148","157","138","21","200,201","200,201","200,201","119","162,163,164","162,163,164","120,121","134","188,189,190,191,192","153","63","117,118","128","74","112","32,33","198,199","75","200,201","198,199","172","82","139","102","168","168","168","168","168","168","168","168","168","179","203","193,205","-213","109","12,13","135","200,201","35"];
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
    const arglists = /* 223 */ ["","14,0","22,1,2","19,3","11,4,5","14,6","23,7,8","23,9,10","12,11,10","14,12","22,1,13","14,14","15,15","49,16,17,18","15,19","12,20,21","12,22,23","23,24,25","11,26,27","11,28,29","14,30","31,31","22,32,33","19,34","14,35","11,36,5","15,37","14,38","13,39","19,40","11,41,42","11,43,29","14,44","12,45,46","12,47,48","15,49","13,41","12,9,21","14,50","11,51,5","11,52,5","11,53,29","14,54","14,55","14,56","14,57","11,58,29","22,59,60","14,61","11,62,42","24,63","19,23","11,64,65","11,66,29","22,1,67","11,68,69","11,70,29","14,68","12,24,71","12,72,73","12,74,73","14,75","23,76,77","14,78","11,79,42","13,19","15,80","11,81,5","12,22,82","11,83,5","11,84,29","12,85,86","14,87","36,88","11,41,5","12,89,90","14,91","24,91","12,22,92","22,27,93","11,94,29","11,95,29","14,96","14,41","11,34,27","12,89,97","19,98","11,99,5","11,100,29","14,101","31,102","11,103,104","11,105,106","14,107","11,108,27","36,109","11,110,42","11,111,5","11,112,5","31,113","12,114,61","12,115,61","11,116,5","11,117,42","10","23,118,119","19,120","31,121","12,72,122","11,123,65","11,124,5","12,89,125","12,115,126","11,127,5","22,1,76","14,128,129","1,130,27,131","26,132,27,131","11,133,69","11,134,65","10,135","1,136,137,131","12,115,138","11,139,29","7,140,141","7,137,142","7,143","19,144","11,145,42","1,27,27,131","11,146,42","10,69,147","19,148","19,149","12,115,150","11,151,5","12,115,152","12,153","1,154,27,131","11,155,65","12,89,144","26,156,27,131","10,157","11,158,106","7,159","11,160,5","14,161","10,162","23,76,163","12,76,164","11,165,42","12,166,167","11,168,5","22,1,169","12,170,171","12,115,172","22,173,174","19,175","12,176,138","7,177","12,76,178","11,179,5","19,180","23,181,182","19,183","12,89,184","12,89,185","25,186,187","12,188,187","14,189","12,74","1,190,191,192","12,115","22,1,166","12,115,193","14,194","11,195,196","14,197","12,115,198","22,199,194","10,200","26,201,202,131","11,203,204","11,205,204","11,206,204","11,207,204","11,208,204","17,209,210","14,211,202","14,211,212","12,213,128","12,214,211","12,76,215","36,216","12,89,217","11,218,42","11,219,29","11,220,29","31,221","31,222","14,223","11,224,204","7,225","14,226","11,227,5","22,199,228","23,76,229","7,230","17,231,232","11,233,27","11,234,27","7,34","7,235","7,236","11,237,27","11,238,27","11,239,27","11,240,27","11,241,27","11,242,27","11,243,106","57,244","12,170,245"];
    const args = /* 246 */ ["triggerAdBlockModal","DOMContentLoaded","detectAdBlocker","SPM_CONFIG.adblockOnly","checkAdScript","noopFunc","](getComputedStyle,","Element.prototype.attachShadow","Object.Score","document.querySelector","isAdblocked","MutationObserver","/bait\\.offsetHeight===0|isAdblocked|requestAnimationFrame\\(|AdBlock|AdGuard/","showModal","offsetHeight === 0","adsbygoogle.js",".adsbygoogle","display","block","pagead2.googlesyndication.com","EventTarget.prototype.addEventListener","window.getComputedStyle","document.getElementById","adBlockDetected","alert",".onerror","ad_id_for_555","","all520dddaaa2022ccc","true",".offsetHeight == 0","checkAdblock","/DOMContentLoaded|load|complete/","/check|detected/","ads",".offsetHeight","_AdBlockInit","/googlesyndication\\.com|doubleclick\\.net/","offsetHeig\\'+\\'ht\\']","/api/ads","alertadmodal","adsbygoogle","{}","adsbygoogle.loaded","float_right > div","document.dispatchEvent","/getexoloader/","decodeURIComponent","pagead","www3.doubleclick.net","adblock_tip","AD_SURVEY_Add_AdPos","AD_SURVEY_Add_AdPos_Simple","killads","/\\.height\\(\\) == 0|adsbygoogle/","myModal","loadErrorTip","ins.adsbygoogle","isAdsDisplayed","error","event.target.tagName","_0x","fuzqingAdPlus","Ad Block","all520dddaaa2022aaa","undefined","canRunAds","adBlock","adblock","0","can_run_ads","typeof(ad)","jQuery","\\u","document.writeln","发现严重BUG","document.createElement","make_rand_div","checker","google_tag_manager","/pagead2\\.googlesyndication\\.com|\\/fbevents\\.js/","google.ima.AdError","/#myModal'\\)\\.modal/","ga","google_empty_script_included","setTimeout","COOKIE_NAME","html","ADS_BLOCKED","$","adskilltest","/home/?adblock=","/!document\\.getElementById\\([\\s\\S]*?\\.style\\.display=/","showRemoveAdBlocker","Object.prototype.cnobpreroll_","Object.prototype.canobpreroll_","ad_num_show","!document.getElementById(btoa","daau_app","NativeAd","__jsadsuccess","checkSiteNormalLoad","__DOMAIN","onload","null","adbk","false","/ad block stop|warm_msg/","config.group","encodeURIComponent","preBid","preBid.displayAd","preBid.getPrerollVASTUrl","adStart","eval","document.write","player.VastADPlugin","ADSOBJET","Object.prototype.pgmp","invokeInterstitial","Object.prototype.ShouldLoadAds","delCookie","injectPops","myPlayer.adDisplay","NEWS_FEED","infoid","document.write(ad);","conone_lmg","location.href","3000","adCountDown","0.02",".s--","Object.prototype.ad_switch","dy_card_dyrun","/bit\\.ly|kbtv/","video-ad-timeout","*","tips","poped","*.*","adFeedbackData adType adServedUrls","list.*.link.ad list.*.link.kicker","configs.*.properties.slideshowWCSettings.interstitialNativeAds configs.*.properties.fullScreenSlideshowSettings.interstitialNativeAds properties.componentConfigs.slideshowConfigs.interstitialNativeAds properties.componentConfigs.slideshowConfigs.slideshowSettings.interstitialNativeAds","popunder","Object.prototype.adData","Object.prototype._adData","qciss.net","akumtagcc","myclick","/getCookie[\\s\\S]*?\\(\"\\\\x/","MM_openBrWindow","/\\.(gif|php)/","window.leave","CloseAd","lists","timerAdCountdown","88p2p.com","is_show","data.item data.ads","Object.prototype.getAd","getAd","_blank","mount_adsqrt_ad","new Function","player.adList","localStorage","showAd","DPLAYER_PREROLL_AD.attachPreRollAd","sponsored","Function",".map(function","/<script src=.*Math\\.floor\\(Date\\.now\\(\\)/","click","window.open","adbyunion","Math.floor","data.*.list.[-].resourceData.adData","visitUrl","adRender","addImageAd","Uint8Array","loadAd","createFixedBottomBannerWithClose","/deposit-bonus?platform=26&utm_source=","mmPopup() {","div","_mtj","document.getElementsByTagName","try{e()}catch(e){if(t[e.message])return;",".current=setTimeout","5000","0.001","position:","window.location.href","allData.safeLevel","1","ecjkox.com","ads_codes","touchend","!/external","adUI","1000","appData","[]","topData","midData","btmData","coupletData","data-ads_url","[data-ads_url]","parentNode.insertBefore","1500","navigator","Math.random","return a.split","WebSocket","adModal","adInfo","isAdLoaded","Object.prototype.noAD","__PROXY_META","__ad_unblock_id_obfuscation","/getCookie|checkCK|checkCookie|checkC00kie|checkCoookie|checkCookiiiie|document\\.cookie|buttonClose|exptime/","infoList","data.CardList.[].children_list.ad_list data.CardList.[-].params.advertiser_name","addEventListener(\"touchstart\"","adObj","clientheight","/(?=^(?![\\s\\S]*(static|jquery)))/","data.[-].ad.adScene items.*.video.*.data.[-].ad.adScene data.template.tabs.*.blocks.*.data.data.*.videos.feature_ad data.template.tabs.*.blocks.*.data.data.videos.*.ad","style","#banner[style*=\"background-image:url\"]","CreativePlayerwebPlugin.AD_EVENT.AD_DESTROY","CreativePlayerwebPlugin.AD_EVENT.AD_LOAD_START","ad","data.cm_info.ads","pageData.__banners.0.commercial.mediaUrl","pageData.__banners.0.commercial.jumpUrl","pageData.__banners.0.commercial.title","pageData.__banners.1.commercial.mediaUrl","pageData.__banners.1.commercial.jumpUrl","pageData.__banners.1.commercial.title","detailParams.is_ad_play","entity.commercial","new Function(document["];
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
