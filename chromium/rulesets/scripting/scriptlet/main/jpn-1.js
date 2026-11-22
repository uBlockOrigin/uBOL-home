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
    const scriptletHostnames = /* 258 */ ["asg.to","h1g.jp","wav.tv","xth.jp","blog.jp","cmnw.jp","tver.jp","380cc.cc","520cc.cc","h178.com","javmix.*","pormo.me","r326.com","rkd3.dev","crefan.jp","dotti2.jp","g-pc.info","h-ken.net","intaa.net","jprime.jp","ldblog.jp","memo.wiki","misskey.*","o-dan.net","pointi.jp","riajo.com","shico.xyz","soraraw.*","sushi.ski","tojav.net","trpger.us","2chblog.jp","520call.me","aimomo.net","coron.tech","ebitsu.net","gunauc.net","in-jpn.com","jav380.com","javcup.com","jisaka.com","knshow.com","kojodan.jp","nwknews.jp","p1.a9z.dev","pictab.art","rxlife.net","seesaa.net","twiman.net","uneune.one","vipnews.jp","beasoku.com","best-hit.tv","coolpan.net","dl.520cc.cc","doorblog.jp","egotter.com","famitsu.com","figsoku.net","gigafile.nu","gotouchi.jp","himachat.jp","jacom.or.jp","kakenhi.net","kotobank.jp","localch.net","manga1001.*","masa-web.jp","modalina.jp","nan-net.com","nkreport.jp","pc.moppy.jp","posskey.com","rawfree.top","redfuku.com","shihiro.com","slorepo.com","spotvnow.jp","wakuraw.com","warpday.net","46matome.net","agora-web.jp","ap-siken.com","collepic.net","db-siken.com","engineweb.jp","fe-siken.com","fuucdayo.com","hirotron.com","j-rugby.club","jukenbbs.com","kokopyon.net","labo.wovs.tk","livedoor.biz","mangaruu.com","mapion.co.jp","mk.yopo.work","negisoku.com","norisoku.com","nw-siken.com","oninet.ne.jp","photo-ac.com","playing.wiki","pm-siken.com","pochitto2.jp","qa.crefan.jp","realsound.jp","sc-siken.com","sg-siken.com","sokuhou.wiki","solispia.com","takusuki.com","twidouga.net","twivideo.net","youpouch.com","ac-illust.com","animesoku.com","ddd-smart.net","encount.press","ero-video.net","exploader.net","fp1-siken.com","fp2-siken.com","fp3-siken.com","gundamlog.com","klmanga.cloud","livedoor.blog","m.eskey.click","majikichi.com","motimoti3d.jp","msk.ilnk.info","musenboya.com","onagazou.info","seesaawiki.jp","si-coding.net","simplegame.jp","skebetter.com","socialxup.com","suki-kira.com","tonuriaz.info","uttaeruyo.com","vtubernews.jp","www.ohk.co.jp","yamiisoku.com","yourfones.net","zadankai.club","addchannel.net","bm.best-hit.tv","chronicle.wiki","fashionpost.jp","game-info.wiki","kantangame.com","kenshonavi.com","maidonanews.jp","misskirara.net","news.mynavi.jp","pokegonews.net","presscarry.com","trafficnews.jp","wiki.yjsnpi.nu","yomury.blog.jp","yougakumap.com","all-nationz.com","fiveslot777.com","giants-news.com","j-baseball.club","kijyomatome.com","lifematome.blog","lyrics-jpop.net","mangaraw.org.uk","mindhack2ch.com","misskeytsf.love","momoclonews.com","monhan-soku.com","pdftoshokan.com","shukatsubbs.com","stormskey.works","tokyomotion.net","yaraon-blog.com","azby.fmworld.net","blog.livedoor.jp","chibanippo.co.jp","genshin-soku.com","live-theater.net","momoiroadult.com","msk.kitamiss.com","oumaga-times.com","rocketnews24.com","shindanmaker.com","takken-siken.com","trogiupnhanh.com","www.nicovideo.jp","akibablog.blog.jp","blog.livedoor.com","empire.miyaco.moe","erommd-street.com","ikaskey.bktsk.com","j-basketball.club","j-volleyball.club","kijomatomelog.com","konoyubitomare.jp","matome-geinou.net","mekomeko-club.icu","openworldnews.net","shinshi-manga.net","silhouette-ac.com","anacap.doorblog.jp","anianierosuki.work","connect.coron.tech","digital-thread.com","fjkcircle2.cfbx.jp","misskey.secinet.jp","search.yahoo.co.jp","searchkoreanews.jp","sonae.sankei.co.jp","success-corp.co.jp","automaton-media.com","erotaredogaonly.xyz","girlsvip-matome.com","itpassportsiken.com","lemino.docomo.ne.jp","nandemo-uketori.com","travel-bookmark.net","trendynailwraps.com","vid-snap-player.com","blog-and-destroy.com","gamemod.blog.fc2.com","kledgeb.blogspot.com","mjoato3uion.ky-3.net","nogizaka.vorzent.com","pachinkopachisro.com","pointmall.aeon.co.jp","video.tv-tokyo.co.jp","yugioh-starlight.com","gakudohoiku.gaccom.jp","misskey.resonite.love","ov53i9il.blog.fc2.com","minigame.aeriagames.jp","qaacacthlive.omaww.net","xn--gckdevd5myivf.site","audio-sound-premium.com","sports.tv.rakuten.co.jp","helpsupport.blog.fc2.com","news.denfaminicogamer.jp","signalskey.signal-st.com","xn--gmq92kd2rm1kx34a.com","monte-carlo-lab.pages.dev","game.pointmall.rakuten.net","marvelousact.hatenablog.jp","onepiecelabs.tonuriaz.info","chance.enjoy.point.auone.jp","ponta.abstractpainting.work","portal.game.success-corp.jp","portal.game.sycasualgames.com","nukers-misskey.hpc-densi.f5.si","game.hiroba.dpoint.docomo.ne.jp","xn--o9j0bk1l6d1bnv1as45bb2j.com","jyankuotakarakanteidan.blogspot.com"];
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
        const arglistRefs = /* 258 */ ["91","84","91,105,106","26","92,96","115","14,15,68,138,139,157","108","42","24","97","118,119","16","9,18","64","115","60","65","61","35","96","39","88","43","37","84","90","8,9","88","11","88","92,96","42","20,21","66","96","11","26","85","94","96","63","156","92","88","77","5","39,135","136","88","96","39","24","58,59","91","92,96","38","121,158","147","19","115","17","122","39","34","24","55,56,57","1","62","83","84","11","88","8,9","88","11","2,3","5","8,9","88","96","89","55","93","55","84","55","5","1","24","24,137","153","88","96","8,9","149","88","150","96","55","26","75,143,144","135","55","115","36","84","55","55","135","126","88","76","73,74","44,45,46,47,48","75,143,144","96","142","84","101","32,33","55","55","55","92","8,9","92,96","88","95","91","88","50","77","135","12","98","141","116","125","8,9","88","96","155","10,127,128,129","27","88","39","25","135","79","135","140","84","84","88","154","22","1","84","28,29,30,31","13","84","96","96","96","24","96","81","1","116","135","88","96","10,127,128,129","123,124","24","88","99","82","148","71,92,96,100","84","10,127,128,129","88","1,103","88","96","44,45,46,47,48","78","55","8,9","151","71","120","88","72","88","24","24","92","96","130","132","96","134","143,144","86","87","67","92","6","88","145","84","104","11","146","1","13","55","40,41","92","1","91","91","49,54","51,52","11,53","102","117","96","7","23","92","152","88","102","107","102","10,127,128,129","11","68,69,70","51,52","131","88","97","1","140","1","4","140","109,110,111,112,113,114","133","80","88","140","10,127,128,129","1"];
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
    const arglists = /* 159 */ ["","11,0,1","14,2","15,3","14,4,5","15,6","15,7","15,8","15,9","11,10,11","11,12,11","15,13","14,14","14,6","15,15","14,16,17","14,18","15,19","15,20","22,21,22","11,23,24","11,25,26","37,27","15,28","22,21,29","22,21,30","11,31,32","49,33,34,35","23,36,37","14,38","49,39,40,41","49,42,43,44","12,45,46","18,47,48,49","14,50","18,51,52,49","12,53,54","17,22","11,55,56","22,57,58","7,59","13,3","11,60,1","14,61","15,62","18,63,64","18,63,65","18,63,66","18,63,67","12,53,68","12,10","14,69","15,13,1,70","12,71,72","22,21,68","14,72","15,73","12,74,72","22,75,76","11,77,56","11,78,1","11,79,1","17,80","14,81","14,82","11,22,32","18,83,84,49","12,85,86","7,87","7,88","7,89","12,90,91","12,92,93","12,71,94","22,21,95","12,96,97","22,98,99","11,100,11","26,101","11,102,24","26,103,17","18,47,104,49","27,105","14,106,5","12,107,108","11,90,32","22,109,110","22,111,112","7,113","12,114,115","17,116","10","12,85,117","26,118,17","14,119","12,120,121","14,117","12,122,123","1,124,17,125","22,57,126","12,127,128","22,57,129","37,130","12,71,131","11,132,1","11,133,32","18,134","1,135,98,125","18,136,137","1,138,139","1,140,141,142","1,140,143,144","1,140,139,145","11,146,147","11,148,147","11,149,147","10,150","18,47,151","11,152,1","22,111,153","12,90,154","7,155","7,156","11,157,32","10,158","26,159,17","22,57,160","15,161","7,162","41","12,163,164","12,165,166","18,47,167,49","26,168,17,169","22,111,170","22,57,171","14,172","12,114,173","7,174","1,175,176","1,177,178,169","14,179","11,180,32","11,181,1","11,182,1","7,183","17,184","12,92,185","11,186,187","11,188,147","22,57,189","7,190","7,191","18,47,192,49","22,57,193","18,194,195,49","18,43,196,49","50","11,197,32"];
    const args = /* 198 */ ["__ninjaAdMaxAbdLoaded","true","bait","doubleclick.net","/resolve|native/","300","adsbygoogle","adm.shinobi.jp","/geniee\\.jp|securepubads\\.g\\.doubleclick\\.net/","/\\?abg=|adsbygoogle|tpc\\.googlesyndication\\.com|doubleclick\\.net|googleadservices\\.com/","navigator.brave","undefined","YAAB","pagead2.googlesyndication.com","aswift_","d.socdm.com","null===document.getElementById","1000","intersa.aspx","/adm\\.shinobi\\.jp\\/st\\/t\\.js/ method:HEAD mode:no-cors","adsbygoogle.js","load","adBlockDetected","google_tag_manager","{}","adsbygoogle.pageState","1","広告","/pagead2\\.googlesyndication\\.com|metrics\\.streaks\\.jp|ads-twitter\\.com/","delayC","delayCheckAB","myFunc","noopFunc","ins.adsbygoogle","display","block","Function.prototype.toString","/w/load.php?lang=ja&modules=codex-search-styles%2Cjquery%2Coojs%2C&skin=vector-2022&version=L58hf","()=>k(S(4","#mw-content-text div[style] a:is([href*=\"contents.fc2.com\"],[href*=\"dmm.co.jp\"])","font-size","14px","#mw-content-text div[style] a:is([href*=\"contents.fc2.com\"],[href*=\"dmm.co.jp\"]) img","height","128px","EventTarget.prototype.addEventListener","eval","href","a[style*=\"display:\"][href^=\"https://al.dmm.co.jp\"]","stay","return","style",".js-reward-target[style]","onload","google_esf","adBlockerDetected","false","DOMContentLoaded","interstitialAd","ad_flg ad_url data.adData data.adTagUrl","all520dddaaa2022ccc","oAdChk","tpc.googlesyndication.com","id","#div-gpt-ad-sidebottom","#div-gpt-ad-footer","#div-gpt-ad-pagebottom","#div-gpt-ad-relatedbottom-1","adsCount","/adsbygoogle|clientHeight/","cors","document.getElementById","_0x","cdn.adschill.com","document.querySelector","error","adscript-error","flgDisplay","adsbygoogle.loaded","gptScriptLoaded","AdBlockLimitation","brave","objDef.resolve","class",".quigo","jQuery","decodeURIComponent","ads","result.ad_info","result.paths.[].ad_info","document.write","sitejack","document.createElement","overview","imageUrls","videoInstArea","$","google_ads_iframe_","","setTrigger","pum_vars","reward_countdown","ads_data","timerId",".cps-post-main a[href^=\"https://www.amazon.co.jp\"]","q2w3_sidebar(q2w3_sidebar_options","movie_cnt","document.referrer","gmo_bb","scroll","b.type","click","event","ads.[].imageUrl","document.currentScript","insertAdjacentHTML","fanza_link","floatingAd",".run()}","location","tag","Math.random","addEventListener","style.display","simplegameAdCountDown","0.02","window[","jmp","Math","showPopUpBanner","hoihoi","lists","geoAvailable","$.popunder","data-popup-url","aeriaGamesAdCountDown","onclick","span > a[onclick]","visibility","4000","[native code]","2000","0.3","3000","0.25","0.2","FIRST_DELAY","0","NEXT_DELAY","sec","_blank",".feedzy-rss a[href][onclick]","scPopped","ad-nex.com","rand = Math","props.pageProps.article2ndBannerData","props.allAds","doAdRedirect","/ok_|pemsrv\\.com|window\\.location\\.href/","#close-ad","SolispiaRewardedAdGate.init","method:POST","html","actress","myad","dataLayer.push","document.cookie.includes","#kk","skipcnt","0.001","waqool","/[Aa]dDiv|showVignette/","return r(!0)","IFTG","data.adData","/nrWrapper\\(\\)|n\\.setTimeoutIds_\\.has\\(i\\)/","10000","/adSkip|window\\.ADGMAD/","30000","return n(!0)","univresalP","isGGSurvey","enable_dl_after_countdown","props.initialProps.pageProps.pageData.brandingAds","wpsite_clickable_data","randomad","SU_Api.AdsTimer","-1","map_ad_bottom_height","Fixed","data.response.videoAds data.response.waku.tagRelatedBanner","kyujin_box juku",".topentry_text a","registration_guide_modal","onmousedown","a[onmousedown^=\"this.href=\\\"//widgets.taxel.jp\"]","iframe[id^=\"google_ads_iframe\"]","TagProvider.cleanup"];
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
