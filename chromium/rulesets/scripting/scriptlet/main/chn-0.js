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
    const scriptletHostnames = /* 248 */ ["4hu.tv","8se.me","ddys.*","ebb.io","iyf.tv","le.com","msn.cn","qq.com","4gtv.tv","5278.cc","beqg.cc","cnys.tv","crxs.me","ddrk.me","jptt.tv","kubb.tv","logi.im","nnyy.in","now.com","slit.cn","wnacg.*","yfsp.tv","2urs.com","520cc.cc","69xx.one","av6k.com","avcao.cc","bde4.com","bde4.icu","huya.com","itdog.cn","jkpan.cc","koyi.pub","mxdm.xyz","nanai.tw","noy1.top","o8tv.com","poedb.tw","sohu.com","sudugu.*","t66y.com","tstrs.me","v.qq.com","xchina.*","xkyn.com","123pan.cn","233tw.com","51cg1.com","51zxw.net","akkxs.net","applnn.cc","axjbt.com","daybuy.tw","efuxs.com","fsbot.xyz","fxshu.top","ggjav.com","hboav.com","huavod.cc","iqiyi.com","linetv.tw","moeci.com","mpyit.com","nivod2.tv","nodejs.cn","playav.cc","qciss.net","rjno1.com","sssam.com","sudugu.cc","theav.xyz","wnacg1.cc","x99av.com","xvideo.cc","youku.com","123865.com","360lele.cc","445nan.com","520call.me","85tube.com","aiyifan.tv","caq98i.top","cidetxt.cc","d44t95.com","douyin.com","dqzboy.com","enhuku.com","g655p8.com","hanjuk.com","huavod.com","huavod.net","huavod.top","huoqwk.com","iplark.com","itbaoku.cn","jav777.xyz","laosu.tech","lpl.qq.com","m.86kl.com","m.lwxs.com","mcappx.com","mrds66.com","new.qq.com","nivod2.com","nivod4.com","nivod5.com","nunuju.net","pcbeta.com","pixnet.net","porn87.com","surirt.com","theporn.cc","tingfm.com","tsubasa.im","vikacg.com","wandhi.com","wnacg05.cc","www.qq.com","1090ys8.com","18comic.org","18comic.vip","3dmgame.com","69shumi.com","88files.net","91porna.com","bigpixel.cn","bingfeng.tw","bz88888.net","clp126.shop","ekamus.info","erciyan.com","free.com.tw","hsq233.shop","huanqiu.com","huaren.live","ikanbot.com","jav224.shop","jianshu.com","jkptgbf.xyz","m.13xsw.com","m.91zww.com","m.nivod2.tv","m.nivod4.tv","m.nivod5.tv","m.nivod7.tv","m.nivod8.tv","m.nivod9.tv","m.youku.com","mfulbvu.xyz","news.qq.com","nunuyy3.org","papalah.com","ttp229.shop","umbooks.com","v.ifeng.com","v.youku.com","vxetable.cn","xl02.com.de","youneed.win","youziks.com","1keydata.com","baomidou.com","bilibili.com","bukaivip.com","candylife.tw","docsmall.com","freedidi.com","gamersky.com","getitfree.cn","goodav17.com","m.nivod2.com","m.nivod4.com","ohmanhua.com","pansearch.me","pornbest.org","wikisport.cc","wxredian.com","xbeibeix.com","xiebruce.top","axu.pages.dev","axutongxue.cn","bilinovel.com","biquge321.com","biquge543.com","cocomanga.com","colamanga.com","embedrise.com","freejavbt.com","ftchinese.com","haoweichi.com","hentaicomic.*","linovelib.com","m.1024txt.com","macromicro.me","onemanhua.com","pg-wuming.com","pincong.rocks","slashlook.com","slashview.com","soft8ware.com","sports.qq.com","uptogo.com.tw","xgcartoon.com","yeshuyuan.com","zhenbuka3.com","174.127.195.98","axutongxue.com","axutongxue.net","axutongxue.vip","dianyingim.com","hanime1-me.icu","hanime1-me.top","iwatchme2u.com","javlibrary.com","m.shuhaige.net","moegirl.org.cn","ruanyifeng.com","tangdoucdn.com","v-wb.youku.com","wenxuecity.com","dogfight360.com","jmcomic-zzz.org","pokemonhubs.com","youranshare.com","axutongxue.space","foodieteller.com","haiwaishubao.com","league-funny.com","m.biqiugege8.com","player.hboav.com","banzhu1111111.com","banzhu2222222.com","banzhu3333333.com","banzhu4444444.com","banzhu5555555.com","banzhu6666666.com","banzhu7777777.com","banzhu8888888.com","banzhu9999999.com","m.biquge12345.com","wap.biqugewx.info","wap.yushuwu.cloud","work.weixin.qq.com","hamivideo.hinet.net","helper-employer.com","edc1014070.pixnet.net","axutongxue.onrender.com","taiwanlibrarysearch.herokuapp.com"];
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
        const arglistRefs = /* 248 */ ["146,147","22,195","80,81","69,70","105,106","197,198","124,125,126","215","14","93,142","180","94","161","80,81","151","105,106","45","144","96,97,98","58","136","105,106","23","19,43,115","143","179","133","141","53","196,211","38","41,59,60","49","225","199,200","28","122","68","160","169","72","11","203,212,213,214","22,195","113","104","61","153","116","100","95","133","199,200","175","14","206","140","91,92,93","6,7,8,9,10","182,210","64,65,66,67","48","14","217,218,219,220,221,222,223","25,30,31,162","16","131","47","84","169","143","136","103","123","129","104","206","20,183,184,185,186,187","19,52","114","105,106","29","170","146,147","172","15","207","146,147","150","6,7,8,9,10","6,7,8,9,10","6,7,8,9,10","206","174","41","73","2","212,213","132","100,101","17","153","214","217,218,219,220,221,222,223","217,218,219,220,221,222,223","217,218,219,220,221,222,223","169","62","137","140","18,19","143","53,56,57","76,77","145,181","26","159","214","51","32,33","32,33","99","180","104","188","41","71","169","5,156","45,46","176","199,200","5,156","39,40","6,7,8,9,10,104","148","5,156","110","188","208","107","224","224","224","224","224","224","130","188","214","111","51","5,156","104,171","177","130","34","155","86","178","37","25","216","138","199,200","25","3","152","78","127","224","224","87,88,89,90","36","108","104,157,168","4","42","79","201,202","201,202","27","180","180","44,87,88,89","44","104","104","24","83","136","54,55","209","166,167","87,88,89","85","50","53","14","1","212,213,214,-216","199,200","149","158","138","21","201,202","201,202","201,202","119","163,164,165","163,164,165","120,121","134","189,190,191,192,193","154","63","117,118","128","74","112","32,33","199,200","75","201,202","199,200","173","82,204,205","139","102","169","169","169","169","169","169","169","169","169","180","206","194,208","-216","109","12,13","135","201,202","35"];
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
    const arglists = /* 226 */ ["","14,0","22,1,2","17,3","11,4,5","14,6","23,7,8","23,9,10","12,11,10","14,12","22,1,13","14,14","15,15","49,16,17,18","15,19","12,20,21","12,22,23","23,24,25","11,26,27","11,28,29","14,30","32,31","22,32,33","17,34","14,35","11,36,5","15,37","14,38","13,39","17,40","11,41,42","11,43,29","14,44","12,45,46","12,47,48","15,49","13,41","12,9,21","14,50","11,51,5","11,52,5","11,53,29","14,54","14,55","14,56","14,57","11,58,29","22,59,60","14,61","11,62,42","27,63","17,23","11,64,65","11,66,29","22,1,67","11,68,69","11,70,29","14,68","12,24,71","12,72,73","12,74,73","14,75","23,76,77","14,78","11,79,42","13,19","15,80","11,81,5","12,22,82","11,83,5","11,84,29","12,85,86","14,87","37,88","11,41,5","12,89,90","14,91","27,91","12,22,92","22,27,93","11,94,29","11,95,29","14,96","14,41","11,34,27","12,89,97","17,98","11,99,5","11,100,29","14,101","32,102","11,103,104","11,105,106","14,107","11,108,27","37,109","11,110,42","11,111,5","11,112,5","32,113","12,114,61","12,115,61","11,116,5","11,117,42","10","23,118,119","17,120","32,121","12,72,122","11,123,65","11,124,5","12,89,125","12,115,126","11,127,5","22,1,76","14,128,129","1,130,27,131","26,132,27,131","11,133,69","11,134,65","10,135","1,136,137,131","12,115,138","11,139,29","7,140,141","7,137,142","7,143","17,144","11,145,42","1,27,27,131","11,146,42","10,69,147","17,148","17,149","12,115,150","11,151,5","12,115,152","12,153","1,154,27,131","11,155,65","12,89,144","26,156,27,131","10,157","11,158,106","48,159,160","7,161","11,162,5","14,163","10,164","23,76,165","12,76,166","11,167,42","12,168,169","11,170,5","22,1,171","12,172,173","12,115,174","22,175,176","17,177","12,178,138","7,179","12,76,180","11,181,5","17,182","23,183,184","17,185","12,89,186","12,89,187","41,188,189","12,190,189","14,191","12,74","1,192,193,194","12,115","22,1,168","12,115,195","14,196","11,197,198","14,199","12,115,200","22,201,196","10,202","26,203,204,131","11,205,206","11,207,206","11,208,206","11,209,206","11,210,206","18,211,212","14,213,204","14,213,214","12,215,128","12,216,213","12,76,217","37,218","12,89,219","11,220,42","11,221,29","11,222,29","32,223","32,224","14,225","11,226,206","7,227","7,228","11,229,206","14,230","11,231,5","22,201,232","23,76,233","7,234","18,235,236","11,237,27","11,238,27","7,34","7,239","7,240","11,241,27","11,242,27","11,243,27","11,244,27","11,245,27","11,246,27","11,247,106","57,248","12,172,249"];
    const args = /* 250 */ ["triggerAdBlockModal","DOMContentLoaded","detectAdBlocker","SPM_CONFIG.adblockOnly","checkAdScript","noopFunc","](getComputedStyle,","Element.prototype.attachShadow","Object.Score","document.querySelector","isAdblocked","MutationObserver","/bait\\.offsetHeight===0|isAdblocked|requestAnimationFrame\\(|AdBlock|AdGuard/","showModal","offsetHeight === 0","adsbygoogle.js",".adsbygoogle","display","block","pagead2.googlesyndication.com","EventTarget.prototype.addEventListener","window.getComputedStyle","document.getElementById","adBlockDetected","alert",".onerror","ad_id_for_555","","all520dddaaa2022ccc","true",".offsetHeight == 0","checkAdblock","/DOMContentLoaded|load|complete/","/check|detected/","ads",".offsetHeight","_AdBlockInit","/googlesyndication\\.com|doubleclick\\.net/","offsetHeig\\'+\\'ht\\']","/api/ads","alertadmodal","adsbygoogle","{}","adsbygoogle.loaded","float_right > div","document.dispatchEvent","/getexoloader/","decodeURIComponent","pagead","www3.doubleclick.net","adblock_tip","AD_SURVEY_Add_AdPos","AD_SURVEY_Add_AdPos_Simple","killads","/\\.height\\(\\) == 0|adsbygoogle/","myModal","loadErrorTip","ins.adsbygoogle","isAdsDisplayed","error","event.target.tagName","_0x","fuzqingAdPlus","Ad Block","all520dddaaa2022aaa","undefined","canRunAds","adBlock","adblock","0","can_run_ads","typeof(ad)","jQuery","\\u","document.writeln","发现严重BUG","document.createElement","make_rand_div","checker","google_tag_manager","/pagead2\\.googlesyndication\\.com|\\/fbevents\\.js/","google.ima.AdError","/#myModal'\\)\\.modal/","ga","google_empty_script_included","setTimeout","COOKIE_NAME","html","ADS_BLOCKED","$","adskilltest","/home/?adblock=","/!document\\.getElementById\\([\\s\\S]*?\\.style\\.display=/","showRemoveAdBlocker","Object.prototype.cnobpreroll_","Object.prototype.canobpreroll_","ad_num_show","!document.getElementById(btoa","daau_app","NativeAd","__jsadsuccess","checkSiteNormalLoad","__DOMAIN","onload","null","adbk","false","/ad block stop|warm_msg/","config.group","encodeURIComponent","preBid","preBid.displayAd","preBid.getPrerollVASTUrl","adStart","eval","document.write","player.VastADPlugin","ADSOBJET","Object.prototype.pgmp","invokeInterstitial","Object.prototype.ShouldLoadAds","delCookie","injectPops","myPlayer.adDisplay","NEWS_FEED","infoid","document.write(ad);","conone_lmg","location.href","3000","adCountDown","0.02",".s--","Object.prototype.ad_switch","dy_card_dyrun","/bit\\.ly|kbtv/","video-ad-timeout","*","tips","poped","*.*","adFeedbackData adType adServedUrls","list.*.link.ad list.*.link.kicker","configs.*.properties.slideshowWCSettings.interstitialNativeAds configs.*.properties.fullScreenSlideshowSettings.interstitialNativeAds properties.componentConfigs.slideshowConfigs.interstitialNativeAds properties.componentConfigs.slideshowConfigs.slideshowSettings.interstitialNativeAds","popunder","Object.prototype.adData","Object.prototype._adData","qciss.net","akumtagcc","myclick","/getCookie[\\s\\S]*?\\(\"\\\\x/","MM_openBrWindow","/\\.(gif|php)/","window.leave","CloseAd","lists","timerAdCountdown","88p2p.com","is_show","adjump",".m3u8","data.item data.ads","Object.prototype.getAd","getAd","_blank","mount_adsqrt_ad","new Function","player.adList","localStorage","showAd","DPLAYER_PREROLL_AD.attachPreRollAd","sponsored","Function",".map(function","/<script src=.*Math\\.floor\\(Date\\.now\\(\\)/","click","window.open","adbyunion","Math.floor","data.*.list.[-].resourceData.adData","visitUrl","adRender","addImageAd","Uint8Array","loadAd","createFixedBottomBannerWithClose","/deposit-bonus?platform=26&utm_source=","mmPopup() {","div","_mtj","document.getElementsByTagName","try{e()}catch(e){if(t[e.message])return;",".current=setTimeout","5000","0.001","position:","window.location.href","allData.safeLevel","1","ecjkox.com","ads_codes","touchend","!/external","adUI","1000","appData","[]","topData","midData","btmData","coupletData","data-ads_url","[data-ads_url]","parentNode.insertBefore","1500","navigator","Math.random","return a.split","WebSocket","adModal","adInfo","isAdLoaded","Object.prototype.noAD","__PROXY_META","__ad_unblock_id_obfuscation","/getCookie|checkCK|checkCookie|checkC00kie|checkCoookie|checkCookiiiie|document\\.cookie|buttonClose|exptime/","infoList","data.CardList.[].children_list.ad_list data.CardList.[-].params.advertiser_name","pageProps.adSystem props.pageProps.adSystem","__NEXT_DATA__.props.pageProps.adSystem","addEventListener(\"touchstart\"","adObj","clientheight","/(?=^(?![\\s\\S]*(static|jquery)))/","data.[-].ad.adScene items.*.video.*.data.[-].ad.adScene data.template.tabs.*.blocks.*.data.data.*.videos.feature_ad data.template.tabs.*.blocks.*.data.data.videos.*.ad","style","#banner[style*=\"background-image:url\"]","CreativePlayerwebPlugin.AD_EVENT.AD_DESTROY","CreativePlayerwebPlugin.AD_EVENT.AD_LOAD_START","ad","data.cm_info.ads","pageData.__banners.0.commercial.mediaUrl","pageData.__banners.0.commercial.jumpUrl","pageData.__banners.0.commercial.title","pageData.__banners.1.commercial.mediaUrl","pageData.__banners.1.commercial.jumpUrl","pageData.__banners.1.commercial.title","detailParams.is_ad_play","entity.commercial","new Function(document["];
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
