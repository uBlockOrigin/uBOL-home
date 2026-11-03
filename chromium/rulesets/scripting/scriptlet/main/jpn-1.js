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
    const scriptletHostnames = /* 246 */ ["asg.to","h1g.jp","wav.tv","xth.jp","blog.jp","cmnw.jp","tver.jp","380cc.cc","520cc.cc","h178.com","javmix.*","pormo.me","r326.com","rkd3.dev","crefan.jp","dotti2.jp","g-pc.info","h-ken.net","intaa.net","jprime.jp","ldblog.jp","memo.wiki","misskey.*","o-dan.net","pointi.jp","riajo.com","shico.xyz","soraraw.*","sushi.ski","tojav.net","trpger.us","2chblog.jp","520call.me","aimomo.net","coron.tech","ebitsu.net","gunauc.net","in-jpn.com","jav380.com","javcup.com","jisaka.com","kojodan.jp","nwknews.jp","p1.a9z.dev","pictab.art","rxlife.net","seesaa.net","twiman.net","uneune.one","vipnews.jp","beasoku.com","best-hit.tv","coolpan.net","dl.520cc.cc","doorblog.jp","egotter.com","famitsu.com","figsoku.net","gigafile.nu","gotouchi.jp","himachat.jp","jacom.or.jp","kakenhi.net","kotobank.jp","localch.net","manga1001.*","modalina.jp","nan-net.com","nkreport.jp","pc.moppy.jp","posskey.com","rawfree.top","redfuku.com","shihiro.com","slorepo.com","spotvnow.jp","wakuraw.com","warpday.net","46matome.net","agora-web.jp","ap-siken.com","collepic.net","db-siken.com","engineweb.jp","fe-siken.com","fuucdayo.com","j-rugby.club","jukenbbs.com","kokopyon.net","labo.wovs.tk","livedoor.biz","mangaruu.com","mapion.co.jp","mk.yopo.work","negisoku.com","norisoku.com","nw-siken.com","oninet.ne.jp","photo-ac.com","playing.wiki","pm-siken.com","pochitto2.jp","qa.crefan.jp","realsound.jp","sc-siken.com","sg-siken.com","sokuhou.wiki","solispia.com","takusuki.com","twidouga.net","twivideo.net","youpouch.com","ac-illust.com","animesoku.com","ddd-smart.net","encount.press","ero-video.net","exploader.net","fp1-siken.com","fp2-siken.com","fp3-siken.com","gundamlog.com","klmanga.cloud","livedoor.blog","m.eskey.click","majikichi.com","motimoti3d.jp","msk.ilnk.info","musenboya.com","onagazou.info","seesaawiki.jp","si-coding.net","simplegame.jp","skebetter.com","suki-kira.com","uttaeruyo.com","vtubernews.jp","www.ohk.co.jp","yamiisoku.com","yourfones.net","zadankai.club","addchannel.net","bm.best-hit.tv","chronicle.wiki","fashionpost.jp","game-info.wiki","kantangame.com","kenshonavi.com","maidonanews.jp","misskirara.net","news.mynavi.jp","pokegonews.net","trafficnews.jp","wiki.yjsnpi.nu","yomury.blog.jp","yougakumap.com","all-nationz.com","fiveslot777.com","giants-news.com","j-baseball.club","kijyomatome.com","lifematome.blog","mindhack2ch.com","misskeytsf.love","momoclonews.com","monhan-soku.com","pdftoshokan.com","shukatsubbs.com","stormskey.works","tokyomotion.net","yaraon-blog.com","azby.fmworld.net","blog.livedoor.jp","chibanippo.co.jp","genshin-soku.com","live-theater.net","momoiroadult.com","msk.kitamiss.com","oumaga-times.com","rocketnews24.com","shindanmaker.com","takken-siken.com","trogiupnhanh.com","www.nicovideo.jp","akibablog.blog.jp","blog.livedoor.com","empire.miyaco.moe","erommd-street.com","ikaskey.bktsk.com","j-basketball.club","j-volleyball.club","kijomatomelog.com","konoyubitomare.jp","matome-geinou.net","mekomeko-club.icu","openworldnews.net","shinshi-manga.net","silhouette-ac.com","anacap.doorblog.jp","anianierosuki.work","connect.coron.tech","digital-thread.com","fjkcircle2.cfbx.jp","misskey.secinet.jp","search.yahoo.co.jp","searchkoreanews.jp","sonae.sankei.co.jp","success-corp.co.jp","automaton-media.com","girlsvip-matome.com","itpassportsiken.com","lemino.docomo.ne.jp","nandemo-uketori.com","trendynailwraps.com","vid-snap-player.com","blog-and-destroy.com","gamemod.blog.fc2.com","kledgeb.blogspot.com","mjoato3uion.ky-3.net","nogizaka.vorzent.com","pachinkopachisro.com","pointmall.aeon.co.jp","video.tv-tokyo.co.jp","yugioh-starlight.com","gakudohoiku.gaccom.jp","misskey.resonite.love","ov53i9il.blog.fc2.com","minigame.aeriagames.jp","qaacacthlive.omaww.net","xn--gckdevd5myivf.site","audio-sound-premium.com","sports.tv.rakuten.co.jp","helpsupport.blog.fc2.com","news.denfaminicogamer.jp","signalskey.signal-st.com","xn--gmq92kd2rm1kx34a.com","game.pointmall.rakuten.net","onepiecelabs.tonuriaz.info","chance.enjoy.point.auone.jp","ponta.abstractpainting.work","portal.game.success-corp.jp","portal.game.sycasualgames.com","nukers-misskey.hpc-densi.f5.si","game.hiroba.dpoint.docomo.ne.jp","xn--o9j0bk1l6d1bnv1as45bb2j.com","skyscrapers-and-urbandevelopment.com"];
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
        const arglistRefs = /* 246 */ ["90","83","90,104,105","26","91,95","114","14,15,67,136,137,155","107","42","24","96","116,117","16","9,18","63","114","60","64","61","35","95","39","87","43","37","83","89","8,9","87","11","87","91,95","42","20,21","65","95","11","26","84","93","95","154","91","87","76","4","39,133","134","87","95","39","24","58,59","90","91,95","38","119,156","145","19","114","17","120","39","34","24","55,56,57","62","82","83","11","87","8,9","87","11","1,2","4","8,9","87","95","88","55","92","55","83","55","4","24","24,135","151","87","95","8,9","147","87","148","95","55","26","74,141,142","133","55","114","36","83","55","55","133","124","87","75","72,73","44,45,46,47,48","74,141,142","95","140","83","100","32,33","55","55","55","91","8,9","91,95","87","94","90","87","50","76","133","12","97","139","123","87","95","153","10,125,126,127","27","87","39","25","133","78","133","138","83","83","87","152","22","83","28,29,30,31","13","83","95","95","95","24","95","80","133","87","95","10,125,126,127","121,122","24","87","98","81","146","70,91,95,99","83","10,125,126,127","87","102","87","95","44,45,46,47,48","77","55","8,9","149","70","118","87","71","87","24","24","91","95","128","130","95","132","141,142","85","86","66","91","5","87","143","83","103","11","144","13","55","40,41","91","90","90","49,54","51,52","11,53","101","115","95","6","23","91","150","87","101","106","101","10,125,126,127","11","67,68,69","51,52","129","87","96","138","3","138","108,109,110,111,112,113","131","79","87","138","10,125,126,127","7"];
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
    const arglists = /* 157 */ ["","14,0","15,1","14,2,3","15,4","15,5","15,6","22,7,8","15,9","11,10,11","11,12,11","15,13","14,14","14,4","15,15","14,16,17","14,18","15,19","15,20","22,21,22","11,23,24","11,25,26","35,27","15,28","22,21,29","22,21,30","11,31,32","49,33,34,35","23,36,37","14,38","49,39,40,41","49,42,43,44","12,45,46","18,47,48,49","14,50","18,51,52,49","12,53,54","17,22","11,55,56","22,7,57","7,58","13,1","11,59,60","14,61","15,62","18,63,64","18,63,65","18,63,66","18,63,67","12,53,68","12,10","14,69","15,13,60,70","12,71,72","22,21,68","14,72","15,73","12,74,72","22,75,76","11,77,56","11,78,60","11,79,60","17,80","14,81","11,22,32","18,82,83,49","12,84,85","7,86","7,87","7,88","12,89,90","12,91,92","12,71,93","22,21,94","12,95,96","22,97,98","11,99,11","24,100","11,101,24","24,102,17","18,47,103,49","25,104","14,105,3","12,106,107","11,89,32","22,108,109","22,110,111","7,112","12,113,114","17,115","10","12,84,116","24,117,17","14,118","12,119,120","14,116","12,121,122","1,123,17,124","22,7,125","12,126,127","22,7,128","35,129","12,71,130","11,131,60","11,132,32","18,133","1,134,97,124","18,135,136","1,137,138","1,139,140,141","1,139,142,143","1,139,138,144","11,145,146","11,147,146","11,148,146","18,47,149","11,150,60","22,110,151","12,89,152","7,153","7,154","11,155,32","10,156","24,157,17","22,7,158","15,159","7,160","40","12,161,162","12,163,164","18,47,165,49","24,166,17,167","22,110,168","22,7,169","14,170","12,113,171","7,172","1,173,174","1,175,176,167","14,177","11,178,32","11,179,60","11,180,60","7,181","17,182","12,91,183","11,184,185","11,186,146","22,7,187","7,188","7,189","18,47,190,49","22,7,191","18,192,193,49","18,43,194,49","50","11,195,32"];
    const args = /* 196 */ ["bait","doubleclick.net","/resolve|native/","300","adsbygoogle","adm.shinobi.jp","/geniee\\.jp|securepubads\\.g\\.doubleclick\\.net/","DOMContentLoaded","isAllowedBrowser","/\\?abg=|adsbygoogle|tpc\\.googlesyndication\\.com|doubleclick\\.net|googleadservices\\.com/","navigator.brave","undefined","YAAB","pagead2.googlesyndication.com","aswift_","d.socdm.com","null===document.getElementById","1000","intersa.aspx","/adm\\.shinobi\\.jp\\/st\\/t\\.js/ method:HEAD mode:no-cors","adsbygoogle.js","load","adBlockDetected","google_tag_manager","{}","adsbygoogle.pageState","1","広告","/pagead2\\.googlesyndication\\.com|metrics\\.streaks\\.jp|ads-twitter\\.com/","delayC","delayCheckAB","myFunc","noopFunc","ins.adsbygoogle","display","block","Function.prototype.toString","/w/load.php?lang=ja&modules=codex-search-styles%2Cjquery%2Coojs%2C&skin=vector-2022&version=L58hf","()=>k(S(4","#mw-content-text div[style] a:is([href*=\"contents.fc2.com\"],[href*=\"dmm.co.jp\"])","font-size","14px","#mw-content-text div[style] a:is([href*=\"contents.fc2.com\"],[href*=\"dmm.co.jp\"]) img","height","128px","EventTarget.prototype.addEventListener","eval","href","a[style*=\"display:\"][href^=\"https://al.dmm.co.jp\"]","stay","return","style",".js-reward-target[style]","onload","google_esf","adBlockerDetected","false","interstitialAd","ad_flg ad_url data.adData data.adTagUrl","all520dddaaa2022ccc","true","oAdChk","tpc.googlesyndication.com","id","#div-gpt-ad-sidebottom","#div-gpt-ad-footer","#div-gpt-ad-pagebottom","#div-gpt-ad-relatedbottom-1","adsCount","/adsbygoogle|clientHeight/","cors","document.getElementById","_0x","cdn.adschill.com","document.querySelector","error","adscript-error","flgDisplay","adsbygoogle.loaded","gptScriptLoaded","AdBlockLimitation","objDef.resolve","class",".quigo","jQuery","decodeURIComponent","ads","result.ad_info","result.paths.[].ad_info","document.write","sitejack","document.createElement","overview","imageUrls","videoInstArea","$","google_ads_iframe_","","setTrigger","pum_vars","reward_countdown","ads_data","timerId",".cps-post-main a[href^=\"https://www.amazon.co.jp\"]","q2w3_sidebar(q2w3_sidebar_options","movie_cnt","document.referrer","gmo_bb","scroll","b.type","click","event","ads.[].imageUrl","document.currentScript","insertAdjacentHTML","fanza_link","floatingAd",".run()}","location","tag","Math.random","addEventListener","style.display","simplegameAdCountDown","0.02","window[","jmp","Math","showPopUpBanner","hoihoi","lists","geoAvailable","$.popunder","data-popup-url","aeriaGamesAdCountDown","onclick","span > a[onclick]","visibility","4000","[native code]","2000","0.3","3000","0.25","0.2","FIRST_DELAY","0","NEXT_DELAY","sec",".feedzy-rss a[href][onclick]","scPopped","ad-nex.com","rand = Math","props.pageProps.article2ndBannerData","props.allAds","doAdRedirect","/ok_|pemsrv\\.com|window\\.location\\.href/","#close-ad","SolispiaRewardedAdGate.init","method:POST","html","actress","myad","dataLayer.push","document.cookie.includes","#kk","skipcnt","0.001","waqool","/[Aa]dDiv|showVignette/","return r(!0)","IFTG","data.adData","/nrWrapper\\(\\)|n\\.setTimeoutIds_\\.has\\(i\\)/","10000","/adSkip|window\\.ADGMAD/","30000","return n(!0)","univresalP","isGGSurvey","enable_dl_after_countdown","props.initialProps.pageProps.pageData.brandingAds","wpsite_clickable_data","randomad","SU_Api.AdsTimer","-1","map_ad_bottom_height","Fixed","data.response.videoAds data.response.waku.tagRelatedBanner","kyujin_box juku",".topentry_text a","registration_guide_modal","onmousedown","a[onmousedown^=\"this.href=\\\"//widgets.taxel.jp\"]","iframe[id^=\"google_ads_iframe\"]","TagProvider.cleanup"];
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
