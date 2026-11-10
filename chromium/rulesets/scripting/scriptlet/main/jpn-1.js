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

// ruleset: jpn-1

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
    const scriptletHostnames = /* 248 */ ["asg.to","h1g.jp","wav.tv","xth.jp","blog.jp","cmnw.jp","tver.jp","380cc.cc","520cc.cc","h178.com","javmix.*","pormo.me","r326.com","rkd3.dev","crefan.jp","dotti2.jp","g-pc.info","h-ken.net","intaa.net","jprime.jp","ldblog.jp","memo.wiki","misskey.*","o-dan.net","pointi.jp","riajo.com","shico.xyz","soraraw.*","sushi.ski","tojav.net","trpger.us","2chblog.jp","520call.me","aimomo.net","coron.tech","ebitsu.net","gunauc.net","in-jpn.com","jav380.com","javcup.com","jisaka.com","knshow.com","kojodan.jp","nwknews.jp","p1.a9z.dev","pictab.art","rxlife.net","seesaa.net","twiman.net","uneune.one","vipnews.jp","beasoku.com","best-hit.tv","coolpan.net","dl.520cc.cc","doorblog.jp","egotter.com","famitsu.com","figsoku.net","gigafile.nu","gotouchi.jp","himachat.jp","jacom.or.jp","kakenhi.net","kotobank.jp","localch.net","manga1001.*","modalina.jp","nan-net.com","nkreport.jp","pc.moppy.jp","posskey.com","rawfree.top","redfuku.com","shihiro.com","slorepo.com","spotvnow.jp","wakuraw.com","warpday.net","46matome.net","agora-web.jp","ap-siken.com","collepic.net","db-siken.com","engineweb.jp","fe-siken.com","fuucdayo.com","j-rugby.club","jukenbbs.com","kokopyon.net","labo.wovs.tk","livedoor.biz","mangaruu.com","mapion.co.jp","mk.yopo.work","negisoku.com","norisoku.com","nw-siken.com","oninet.ne.jp","photo-ac.com","playing.wiki","pm-siken.com","pochitto2.jp","qa.crefan.jp","realsound.jp","sc-siken.com","sg-siken.com","sokuhou.wiki","solispia.com","takusuki.com","twidouga.net","twivideo.net","youpouch.com","ac-illust.com","animesoku.com","ddd-smart.net","encount.press","ero-video.net","exploader.net","fp1-siken.com","fp2-siken.com","fp3-siken.com","gundamlog.com","klmanga.cloud","livedoor.blog","m.eskey.click","majikichi.com","motimoti3d.jp","msk.ilnk.info","musenboya.com","onagazou.info","seesaawiki.jp","si-coding.net","simplegame.jp","skebetter.com","socialxup.com","suki-kira.com","tonuriaz.info","uttaeruyo.com","vtubernews.jp","www.ohk.co.jp","yamiisoku.com","yourfones.net","zadankai.club","addchannel.net","bm.best-hit.tv","chronicle.wiki","fashionpost.jp","game-info.wiki","kantangame.com","kenshonavi.com","maidonanews.jp","misskirara.net","news.mynavi.jp","pokegonews.net","trafficnews.jp","wiki.yjsnpi.nu","yomury.blog.jp","yougakumap.com","all-nationz.com","fiveslot777.com","giants-news.com","j-baseball.club","kijyomatome.com","lifematome.blog","mindhack2ch.com","misskeytsf.love","momoclonews.com","monhan-soku.com","pdftoshokan.com","shukatsubbs.com","stormskey.works","tokyomotion.net","yaraon-blog.com","azby.fmworld.net","blog.livedoor.jp","chibanippo.co.jp","genshin-soku.com","live-theater.net","momoiroadult.com","msk.kitamiss.com","oumaga-times.com","rocketnews24.com","shindanmaker.com","takken-siken.com","trogiupnhanh.com","www.nicovideo.jp","akibablog.blog.jp","blog.livedoor.com","empire.miyaco.moe","erommd-street.com","ikaskey.bktsk.com","j-basketball.club","j-volleyball.club","kijomatomelog.com","konoyubitomare.jp","matome-geinou.net","mekomeko-club.icu","openworldnews.net","shinshi-manga.net","silhouette-ac.com","anacap.doorblog.jp","anianierosuki.work","connect.coron.tech","digital-thread.com","fjkcircle2.cfbx.jp","misskey.secinet.jp","search.yahoo.co.jp","searchkoreanews.jp","sonae.sankei.co.jp","success-corp.co.jp","automaton-media.com","girlsvip-matome.com","itpassportsiken.com","lemino.docomo.ne.jp","nandemo-uketori.com","trendynailwraps.com","vid-snap-player.com","blog-and-destroy.com","gamemod.blog.fc2.com","kledgeb.blogspot.com","mjoato3uion.ky-3.net","nogizaka.vorzent.com","pachinkopachisro.com","pointmall.aeon.co.jp","video.tv-tokyo.co.jp","yugioh-starlight.com","gakudohoiku.gaccom.jp","misskey.resonite.love","ov53i9il.blog.fc2.com","minigame.aeriagames.jp","qaacacthlive.omaww.net","xn--gckdevd5myivf.site","audio-sound-premium.com","sports.tv.rakuten.co.jp","helpsupport.blog.fc2.com","news.denfaminicogamer.jp","signalskey.signal-st.com","xn--gmq92kd2rm1kx34a.com","game.pointmall.rakuten.net","onepiecelabs.tonuriaz.info","chance.enjoy.point.auone.jp","ponta.abstractpainting.work","portal.game.success-corp.jp","portal.game.sycasualgames.com","nukers-misskey.hpc-densi.f5.si","game.hiroba.dpoint.docomo.ne.jp","xn--o9j0bk1l6d1bnv1as45bb2j.com"];
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
        const arglistRefs = /* 248 */ ["90","83","90,104,105","25","91,95","114","13,14,67,137,138,156","107","41","23","96","117,118","15","8,17","63","114","59","64","60","34","95","38","87","42","36","83","89","7,8","87","10","87","91,95","41","19,20","65","95","10","25","84","93","95","62","155","91","87","76","4","38,134","135","87","95","38","23","57,58","90","91,95","37","120,157","146","18","114","16","121","38","33","23","54,55,56","61","82","83","10","87","7,8","87","10","1,2","4","7,8","87","95","88","54","92","54","83","54","4","23","23,136","152","87","95","7,8","148","87","149","95","54","25","74,142,143","134","54","114","35","83","54","54","134","125","87","75","72,73","43,44,45,46,47","74,142,143","95","141","83","100","31,32","54","54","54","91","7,8","91,95","87","94","90","87","49","76","134","11","97","140","115","124","7,8","87","95","154","9,126,127,128","26","87","38","24","134","78","134","139","83","83","87","153","21","83","27,28,29,30","12","83","95","95","95","23","95","80","134","87","95","9,126,127,128","122,123","23","87","98","81","147","70,91,95,99","83","9,126,127,128","87","102","87","95","43,44,45,46,47","77","54","7,8","150","70","119","87","71","87","23","23","91","95","129","131","95","133","142,143","85","86","66","91","5","87","144","83","103","10","145","12","54","39,40","91","90","90","48,53","50,51","10,52","101","116","95","6","22","91","151","87","101","106","101","9,126,127,128","10","67,68,69","50,51","130","87","96","139","3","139","108,109,110,111,112,113","132","79","87","139","9,126,127,128"];
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
    const arglists = /* 158 */ ["","14,0","15,1","14,2,3","15,4","15,5","15,6","15,7","11,8,9","11,10,9","15,11","14,12","14,4","15,13","14,14,15","14,16","15,17","15,18","22,19,20","11,21,22","11,23,24","37,25","15,26","22,19,27","22,19,28","11,29,30","49,31,32,33","23,34,35","14,36","49,37,38,39","49,40,41,42","12,43,44","18,45,46,47","14,48","18,49,50,47","12,51,52","17,20","11,53,54","22,55,56","7,57","13,1","11,58,59","14,60","15,61","18,62,63","18,62,64","18,62,65","18,62,66","12,51,67","12,8","14,68","15,11,59,69","12,70,71","22,19,67","14,71","15,72","12,73,71","22,74,75","11,76,54","11,77,59","11,78,59","17,79","14,80","14,81","11,20,30","18,82,83,47","12,84,85","7,86","7,87","7,88","12,89,90","12,91,92","12,70,93","22,19,94","12,95,96","22,97,98","11,99,9","26,100","11,101,22","26,102,15","18,45,103,47","27,104","14,105,3","12,106,107","11,89,30","22,108,109","22,110,111","7,112","12,113,114","17,115","10","12,84,116","26,117,15","14,118","12,119,120","14,116","12,121,122","1,123,15,124","22,55,125","12,126,127","22,55,128","37,129","12,70,130","11,131,59","11,132,30","18,133","1,134,97,124","18,135,136","1,137,138","1,139,140,141","1,139,142,143","1,139,138,144","11,145,146","11,147,146","11,148,146","22,110,149","18,45,150","11,151,59","22,110,152","12,89,153","7,154","7,155","11,156,30","10,157","26,158,15","22,55,159","15,160","7,161","41","12,162,163","12,164,165","18,45,166,47","26,167,15,168","22,110,169","22,55,170","14,171","12,113,172","7,173","1,174,175","1,176,177,168","14,178","11,179,30","11,180,59","11,181,59","7,182","17,183","12,91,184","11,185,186","11,187,146","22,55,188","7,189","7,190","18,45,191,47","22,55,192","18,193,194,47","18,41,195,47","50","11,196,30"];
    const args = /* 197 */ ["bait","doubleclick.net","/resolve|native/","300","adsbygoogle","adm.shinobi.jp","/geniee\\.jp|securepubads\\.g\\.doubleclick\\.net/","/\\?abg=|adsbygoogle|tpc\\.googlesyndication\\.com|doubleclick\\.net|googleadservices\\.com/","navigator.brave","undefined","YAAB","pagead2.googlesyndication.com","aswift_","d.socdm.com","null===document.getElementById","1000","intersa.aspx","/adm\\.shinobi\\.jp\\/st\\/t\\.js/ method:HEAD mode:no-cors","adsbygoogle.js","load","adBlockDetected","google_tag_manager","{}","adsbygoogle.pageState","1","広告","/pagead2\\.googlesyndication\\.com|metrics\\.streaks\\.jp|ads-twitter\\.com/","delayC","delayCheckAB","myFunc","noopFunc","ins.adsbygoogle","display","block","Function.prototype.toString","/w/load.php?lang=ja&modules=codex-search-styles%2Cjquery%2Coojs%2C&skin=vector-2022&version=L58hf","()=>k(S(4","#mw-content-text div[style] a:is([href*=\"contents.fc2.com\"],[href*=\"dmm.co.jp\"])","font-size","14px","#mw-content-text div[style] a:is([href*=\"contents.fc2.com\"],[href*=\"dmm.co.jp\"]) img","height","128px","EventTarget.prototype.addEventListener","eval","href","a[style*=\"display:\"][href^=\"https://al.dmm.co.jp\"]","stay","return","style",".js-reward-target[style]","onload","google_esf","adBlockerDetected","false","DOMContentLoaded","interstitialAd","ad_flg ad_url data.adData data.adTagUrl","all520dddaaa2022ccc","true","oAdChk","tpc.googlesyndication.com","id","#div-gpt-ad-sidebottom","#div-gpt-ad-footer","#div-gpt-ad-pagebottom","#div-gpt-ad-relatedbottom-1","adsCount","/adsbygoogle|clientHeight/","cors","document.getElementById","_0x","cdn.adschill.com","document.querySelector","error","adscript-error","flgDisplay","adsbygoogle.loaded","gptScriptLoaded","AdBlockLimitation","brave","objDef.resolve","class",".quigo","jQuery","decodeURIComponent","ads","result.ad_info","result.paths.[].ad_info","document.write","sitejack","document.createElement","overview","imageUrls","videoInstArea","$","google_ads_iframe_","","setTrigger","pum_vars","reward_countdown","ads_data","timerId",".cps-post-main a[href^=\"https://www.amazon.co.jp\"]","q2w3_sidebar(q2w3_sidebar_options","movie_cnt","document.referrer","gmo_bb","scroll","b.type","click","event","ads.[].imageUrl","document.currentScript","insertAdjacentHTML","fanza_link","floatingAd",".run()}","location","tag","Math.random","addEventListener","style.display","simplegameAdCountDown","0.02","window[","jmp","Math","showPopUpBanner","hoihoi","lists","geoAvailable","$.popunder","data-popup-url","aeriaGamesAdCountDown","onclick","span > a[onclick]","visibility","4000","[native code]","2000","0.3","3000","0.25","0.2","FIRST_DELAY","0","NEXT_DELAY","sec","/\\[native code\\]|^\\s*e\\s*=>\\s*.+\\(\\s*e\\s*\\)\\s*$/",".feedzy-rss a[href][onclick]","scPopped","ad-nex.com","rand = Math","props.pageProps.article2ndBannerData","props.allAds","doAdRedirect","/ok_|pemsrv\\.com|window\\.location\\.href/","#close-ad","SolispiaRewardedAdGate.init","method:POST","html","actress","myad","dataLayer.push","document.cookie.includes","#kk","skipcnt","0.001","waqool","/[Aa]dDiv|showVignette/","return r(!0)","IFTG","data.adData","/nrWrapper\\(\\)|n\\.setTimeoutIds_\\.has\\(i\\)/","10000","/adSkip|window\\.ADGMAD/","30000","return n(!0)","univresalP","isGGSurvey","enable_dl_after_countdown","props.initialProps.pageProps.pageData.brandingAds","wpsite_clickable_data","randomad","SU_Api.AdsTimer","-1","map_ad_bottom_height","Fixed","data.response.videoAds data.response.waku.tagRelatedBanner","kyujin_box juku",".topentry_text a","registration_guide_modal","onmousedown","a[onmousedown^=\"this.href=\\\"//widgets.taxel.jp\"]","iframe[id^=\"google_ads_iframe\"]","TagProvider.cleanup"];
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
