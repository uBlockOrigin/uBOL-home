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
    const scriptletHostnames = /* 245 */ ["asg.to","h1g.jp","wav.tv","xth.jp","blog.jp","cmnw.jp","tver.jp","380cc.cc","520cc.cc","h178.com","javmix.*","pormo.me","r326.com","rkd3.dev","crefan.jp","dotti2.jp","g-pc.info","h-ken.net","intaa.net","jprime.jp","ldblog.jp","memo.wiki","misskey.*","o-dan.net","pointi.jp","riajo.com","shico.xyz","soraraw.*","sushi.ski","tojav.net","trpger.us","2chblog.jp","520call.me","aimomo.net","coron.tech","ebitsu.net","gunauc.net","in-jpn.com","jav380.com","javcup.com","jisaka.com","kojodan.jp","nwknews.jp","p1.a9z.dev","pictab.art","rxlife.net","seesaa.net","twiman.net","uneune.one","vipnews.jp","beasoku.com","best-hit.tv","coolpan.net","dl.520cc.cc","doorblog.jp","egotter.com","famitsu.com","figsoku.net","gigafile.nu","gotouchi.jp","himachat.jp","jacom.or.jp","kakenhi.net","kotobank.jp","localch.net","manga1001.*","modalina.jp","nan-net.com","nkreport.jp","pc.moppy.jp","posskey.com","rawfree.top","redfuku.com","shihiro.com","slorepo.com","spotvnow.jp","warpday.net","46matome.net","agora-web.jp","ap-siken.com","collepic.net","db-siken.com","engineweb.jp","fe-siken.com","fuucdayo.com","j-rugby.club","jukenbbs.com","kokopyon.net","labo.wovs.tk","livedoor.biz","mangaruu.com","mapion.co.jp","mk.yopo.work","negisoku.com","norisoku.com","nw-siken.com","oninet.ne.jp","photo-ac.com","playing.wiki","pm-siken.com","pochitto2.jp","qa.crefan.jp","realsound.jp","sc-siken.com","sg-siken.com","sokuhou.wiki","solispia.com","takusuki.com","twidouga.net","twivideo.net","youpouch.com","ac-illust.com","animesoku.com","ddd-smart.net","encount.press","ero-video.net","exploader.net","fp1-siken.com","fp2-siken.com","fp3-siken.com","gundamlog.com","livedoor.blog","m.eskey.click","majikichi.com","motimoti3d.jp","msk.ilnk.info","musenboya.com","onagazou.info","seesaawiki.jp","si-coding.net","simplegame.jp","skebetter.com","socialxup.com","suki-kira.com","uttaeruyo.com","vtubernews.jp","www.ohk.co.jp","yamiisoku.com","yourfones.net","zadankai.club","addchannel.net","bm.best-hit.tv","chronicle.wiki","fashionpost.jp","game-info.wiki","kantangame.com","kenshonavi.com","maidonanews.jp","misskirara.net","news.mynavi.jp","pokegonews.net","trafficnews.jp","wiki.yjsnpi.nu","yomury.blog.jp","yougakumap.com","all-nationz.com","fiveslot777.com","giants-news.com","j-baseball.club","kijyomatome.com","lifematome.blog","mindhack2ch.com","misskeytsf.love","momoclonews.com","monhan-soku.com","pdftoshokan.com","shukatsubbs.com","stormskey.works","tokyomotion.net","yaraon-blog.com","azby.fmworld.net","blog.livedoor.jp","chibanippo.co.jp","genshin-soku.com","live-theater.net","momoiroadult.com","msk.kitamiss.com","oumaga-times.com","rocketnews24.com","shindanmaker.com","takken-siken.com","trogiupnhanh.com","www.nicovideo.jp","akibablog.blog.jp","blog.livedoor.com","empire.miyaco.moe","erommd-street.com","ikaskey.bktsk.com","j-basketball.club","j-volleyball.club","kijomatomelog.com","konoyubitomare.jp","matome-geinou.net","mekomeko-club.icu","openworldnews.net","shinshi-manga.net","silhouette-ac.com","anacap.doorblog.jp","anianierosuki.work","connect.coron.tech","digital-thread.com","fjkcircle2.cfbx.jp","misskey.secinet.jp","search.yahoo.co.jp","searchkoreanews.jp","sonae.sankei.co.jp","success-corp.co.jp","automaton-media.com","girlsvip-matome.com","itpassportsiken.com","lemino.docomo.ne.jp","nandemo-uketori.com","trendynailwraps.com","vid-snap-player.com","blog-and-destroy.com","gamemod.blog.fc2.com","kledgeb.blogspot.com","mjoato3uion.ky-3.net","nogizaka.vorzent.com","pachinkopachisro.com","pointmall.aeon.co.jp","video.tv-tokyo.co.jp","yugioh-starlight.com","gakudohoiku.gaccom.jp","misskey.resonite.love","ov53i9il.blog.fc2.com","minigame.aeriagames.jp","qaacacthlive.omaww.net","xn--gckdevd5myivf.site","audio-sound-premium.com","sports.tv.rakuten.co.jp","helpsupport.blog.fc2.com","news.denfaminicogamer.jp","signalskey.signal-st.com","xn--gmq92kd2rm1kx34a.com","game.pointmall.rakuten.net","onepiecelabs.tonuriaz.info","chance.enjoy.point.auone.jp","ponta.abstractpainting.work","portal.game.success-corp.jp","portal.game.sycasualgames.com","nukers-misskey.hpc-densi.f5.si","game.hiroba.dpoint.docomo.ne.jp","xn--o9j0bk1l6d1bnv1as45bb2j.com","skyscrapers-and-urbandevelopment.com"];
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
        const arglistRefs = /* 245 */ ["89","82","89,103,104","25","90,94","113","13,14,66,136,137,155","106","41","23","95","115,116","15","8,17","62","113","59","63","60","34","94","38","86","42","36","82","88","7,8","86","10","86","90,94","41","19,20","64","94","10","25","83","92","94","154","90","86","75","3","38,133","134","86","94","38","23","57,58","89","90,94","37","119,156","145","18","113","16","120","38","33","23","54,55,56","61","81","82","10","86","7,8","86","10","1","3","86","94","87","54","91","54","82","54","3","23","23,135","151","86","94","7,8","147","86","148","94","54","25","73,141,142","133","54","113","35","82","54","54","133","124","86","74","71,72","43,44,45,46,47","73,141,142","94","140","82","99","31,32","54","54","54","90","90,94","86","93","89","86","49","75","133","11","96","139","117","123","86","94","153","9,125,126,127","26","86","38","24","133","77","133","138","82","82","86","152","21","82","27,28,29,30","12","82","94","94","94","23","94","79","133","86","94","9,125,126,127","121,122","23","86","97","80","146","69,90,94,98","82","9,125,126,127","86","101","86","94","43,44,45,46,47","76","54","7,8","149","69","118","86","70","86","23","23","90","94","128","130","94","132","141,142","84","85","65","90","4","86","143","82","102","10","144","12","54","39,40","90","89","89","48,53","50,51","10,52","100","114","94","5","22","90","150","86","100","105","100","9,125,126,127","10","66,67,68","50,51","129","86","95","138","2","138","107,108,109,110,111,112","131","78","86","138","9,125,126,127","6"];
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
    const arglists = /* 157 */ ["","15,0","14,1,2","15,3","15,4","15,5","22,6,7","15,8","11,9,10","11,11,10","15,12","14,13","14,3","15,14","14,15,16","14,17","15,18","15,19","22,20,21","11,22,23","11,24,25","36,26","15,27","22,20,28","22,20,29","11,30,31","49,32,33,34","23,35,36","14,37","49,38,39,40","49,41,42,43","12,44,45","17,46,47,48","14,49","17,50,51,48","12,52,53","19,21","11,54,55","22,6,56","7,57","13,0","11,58,59","14,60","15,61","17,62,63","17,62,64","17,62,65","17,62,66","12,52,67","12,9","14,68","15,12,59,69","12,70,71","22,20,67","14,71","15,72","12,73,71","22,74,75","11,76,55","11,77,59","11,78,59","19,79","14,80","11,21,31","17,81,82,48","12,83,84","7,85","7,86","7,87","12,88,89","12,90,91","12,70,92","22,20,93","12,94,95","22,96,97","11,98,10","26,99","11,100,23","26,101,16","17,46,102,48","25,103","14,104,2","12,105,106","11,88,31","22,107,108","22,109,110","7,111","12,112,113","19,114","10","12,83,115","26,116,16","14,117","12,118,119","14,115","12,120,121","1,122,16,123","22,6,124","12,125,126","22,6,127","36,128","12,70,129","11,130,59","11,131,31","17,132","1,133,96,123","17,134,135","1,136,137","1,138,139,140","1,138,141,142","1,138,137,143","11,144,145","11,146,145","11,147,145","17,46,148","11,149,59","22,109,150","7,151","12,88,152","7,153","7,154","11,155,31","10,156","26,157,16","22,6,158","15,159","7,160","24","12,161,162","12,163,164","17,46,165,48","26,166,16,167","22,109,168","22,6,169","14,170","12,112,171","7,172","1,173,174","1,175,176,167","14,177","11,178,31","11,179,59","11,180,59","7,181","19,182","12,90,183","11,184,185","11,186,145","22,6,187","7,188","7,189","17,46,190,48","22,6,191","17,192,193,48","17,42,194,48","50","11,195,31"];
    const args = /* 196 */ ["doubleclick.net","/resolve|native/","300","adsbygoogle","adm.shinobi.jp","/geniee\\.jp|securepubads\\.g\\.doubleclick\\.net/","DOMContentLoaded","isAllowedBrowser","/\\?abg=|adsbygoogle|tpc\\.googlesyndication\\.com|doubleclick\\.net|googleadservices\\.com/","navigator.brave","undefined","YAAB","pagead2.googlesyndication.com","aswift_","d.socdm.com","null===document.getElementById","1000","intersa.aspx","/adm\\.shinobi\\.jp\\/st\\/t\\.js/ method:HEAD mode:no-cors","adsbygoogle.js","load","adBlockDetected","google_tag_manager","{}","adsbygoogle.pageState","1","広告","/pagead2\\.googlesyndication\\.com|metrics\\.streaks\\.jp|ads-twitter\\.com/","delayC","delayCheckAB","myFunc","noopFunc","ins.adsbygoogle","display","block","Function.prototype.toString","/w/load.php?lang=ja&modules=codex-search-styles%2Cjquery%2Coojs%2C&skin=vector-2022&version=L58hf","()=>k(S(4","#mw-content-text div[style] a:is([href*=\"contents.fc2.com\"],[href*=\"dmm.co.jp\"])","font-size","14px","#mw-content-text div[style] a:is([href*=\"contents.fc2.com\"],[href*=\"dmm.co.jp\"]) img","height","128px","EventTarget.prototype.addEventListener","eval","href","a[style*=\"display:\"][href^=\"https://al.dmm.co.jp\"]","stay","return","style",".js-reward-target[style]","onload","google_esf","adBlockerDetected","false","interstitialAd","ad_flg ad_url data.adData data.adTagUrl","all520dddaaa2022ccc","true","oAdChk","tpc.googlesyndication.com","id","#div-gpt-ad-sidebottom","#div-gpt-ad-footer","#div-gpt-ad-pagebottom","#div-gpt-ad-relatedbottom-1","adsCount","/adsbygoogle|clientHeight/","cors","document.getElementById","_0x","cdn.adschill.com","document.querySelector","error","adscript-error","flgDisplay","adsbygoogle.loaded","gptScriptLoaded","AdBlockLimitation","objDef.resolve","class",".quigo","jQuery","decodeURIComponent","ads","result.ad_info","result.paths.[].ad_info","document.write","sitejack","document.createElement","overview","imageUrls","videoInstArea","$","google_ads_iframe_","","setTrigger","pum_vars","reward_countdown","ads_data","timerId",".cps-post-main a[href^=\"https://www.amazon.co.jp\"]","q2w3_sidebar(q2w3_sidebar_options","movie_cnt","document.referrer","gmo_bb","scroll","b.type","click","event","ads.[].imageUrl","document.currentScript","insertAdjacentHTML","fanza_link","floatingAd",".run()}","location","tag","Math.random","addEventListener","style.display","simplegameAdCountDown","0.02","window[","jmp","Math","showPopUpBanner","hoihoi","lists","geoAvailable","$.popunder","data-popup-url","aeriaGamesAdCountDown","onclick","span > a[onclick]","visibility","4000","[native code]","2000","0.3","3000","0.25","0.2","FIRST_DELAY","0","NEXT_DELAY","sec",".feedzy-rss a[href][onclick]","scPopped","ad-nex.com","vd","rand = Math","props.pageProps.article2ndBannerData","props.allAds","doAdRedirect","/ok_|pemsrv\\.com|window\\.location\\.href/","#close-ad","SolispiaRewardedAdGate.init","method:POST","html","actress","myad","dataLayer.push","document.cookie.includes","#kk","skipcnt","0.001","waqool","/[Aa]dDiv|showVignette/","return r(!0)","IFTG","data.adData","/nrWrapper\\(\\)|n\\.setTimeoutIds_\\.has\\(i\\)/","10000","/adSkip|window\\.ADGMAD/","30000","return n(!0)","univresalP","isGGSurvey","enable_dl_after_countdown","props.initialProps.pageProps.pageData.brandingAds","wpsite_clickable_data","randomad","SU_Api.AdsTimer","-1","map_ad_bottom_height","Fixed","data.response.videoAds data.response.waku.tagRelatedBanner","kyujin_box juku",".topentry_text a","registration_guide_modal","onmousedown","a[onmousedown^=\"this.href=\\\"//widgets.taxel.jp\"]","iframe[id^=\"google_ads_iframe\"]","TagProvider.cleanup"];
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
})("fb7f2f86-ef87-4c15-a912-62a035b1c974");

void 0;
