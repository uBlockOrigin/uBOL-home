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
    const scriptletHostnames = /* 241 */ ["asg.to","h1g.jp","wav.tv","xth.jp","blog.jp","cmnw.jp","tver.jp","380cc.cc","520cc.cc","h178.com","javmix.*","pormo.me","r326.com","rkd3.dev","crefan.jp","dotti2.jp","g-pc.info","h-ken.net","intaa.net","jprime.jp","ldblog.jp","memo.wiki","misskey.*","o-dan.net","pointi.jp","riajo.com","shico.xyz","soraraw.*","sushi.ski","tojav.net","trpger.us","2chblog.jp","520call.me","aimomo.net","coron.tech","ebitsu.net","gunauc.net","in-jpn.com","jav380.com","javcup.com","jisaka.com","kojodan.jp","nwknews.jp","p1.a9z.dev","pictab.art","rxlife.net","seesaa.net","twiman.net","uneune.one","vipnews.jp","beasoku.com","best-hit.tv","coolpan.net","dl.520cc.cc","doorblog.jp","egotter.com","famitsu.com","figsoku.net","gigafile.nu","gotouchi.jp","himachat.jp","jacom.or.jp","kakenhi.net","kotobank.jp","localch.net","manga1001.*","modalina.jp","nan-net.com","nkreport.jp","pc.moppy.jp","posskey.com","rawfree.top","redfuku.com","shihiro.com","spotvnow.jp","warpday.net","46matome.net","agora-web.jp","ap-siken.com","collepic.net","db-siken.com","engineweb.jp","fe-siken.com","fuucdayo.com","j-rugby.club","jukenbbs.com","kokopyon.net","labo.wovs.tk","livedoor.biz","mangaruu.com","mapion.co.jp","mk.yopo.work","negisoku.com","norisoku.com","nw-siken.com","oninet.ne.jp","photo-ac.com","playing.wiki","pm-siken.com","pochitto2.jp","qa.crefan.jp","realsound.jp","sc-siken.com","sg-siken.com","sokuhou.wiki","solispia.com","takusuki.com","twidouga.net","twivideo.net","youpouch.com","ac-illust.com","animesoku.com","ddd-smart.net","encount.press","ero-video.net","exploader.net","fp1-siken.com","fp2-siken.com","fp3-siken.com","gundamlog.com","livedoor.blog","m.eskey.click","majikichi.com","motimoti3d.jp","msk.ilnk.info","musenboya.com","onagazou.info","seesaawiki.jp","si-coding.net","simplegame.jp","skebetter.com","socialxup.com","suki-kira.com","uttaeruyo.com","vtubernews.jp","www.ohk.co.jp","yamiisoku.com","yourfones.net","zadankai.club","addchannel.net","bm.best-hit.tv","chronicle.wiki","fashionpost.jp","game-info.wiki","kantangame.com","kenshonavi.com","maidonanews.jp","misskirara.net","news.mynavi.jp","pokegonews.net","trafficnews.jp","wiki.yjsnpi.nu","yomury.blog.jp","yougakumap.com","all-nationz.com","fiveslot777.com","giants-news.com","j-baseball.club","kijyomatome.com","lifematome.blog","mindhack2ch.com","misskeytsf.love","momoclonews.com","monhan-soku.com","pdftoshokan.com","shukatsubbs.com","stormskey.works","tokyomotion.net","yaraon-blog.com","azby.fmworld.net","blog.livedoor.jp","chibanippo.co.jp","genshin-soku.com","live-theater.net","momoiroadult.com","msk.kitamiss.com","oumaga-times.com","rocketnews24.com","shindanmaker.com","takken-siken.com","uraaka-joshi.com","www.nicovideo.jp","akibablog.blog.jp","blog.livedoor.com","empire.miyaco.moe","erommd-street.com","ikaskey.bktsk.com","j-basketball.club","j-volleyball.club","kijomatomelog.com","konoyubitomare.jp","matome-geinou.net","mekomeko-club.icu","openworldnews.net","shinshi-manga.net","silhouette-ac.com","anacap.doorblog.jp","anianierosuki.work","connect.coron.tech","digital-thread.com","fjkcircle2.cfbx.jp","misskey.secinet.jp","search.yahoo.co.jp","searchkoreanews.jp","sonae.sankei.co.jp","success-corp.co.jp","automaton-media.com","girlsvip-matome.com","itpassportsiken.com","lemino.docomo.ne.jp","nandemo-uketori.com","trendynailwraps.com","blog-and-destroy.com","gamemod.blog.fc2.com","kledgeb.blogspot.com","mjoato3uion.ky-3.net","pachinkopachisro.com","pointmall.aeon.co.jp","video.tv-tokyo.co.jp","yugioh-starlight.com","gakudohoiku.gaccom.jp","misskey.resonite.love","ov53i9il.blog.fc2.com","minigame.aeriagames.jp","qaacacthlive.omaww.net","xn--gckdevd5myivf.site","audio-sound-premium.com","sports.tv.rakuten.co.jp","helpsupport.blog.fc2.com","news.denfaminicogamer.jp","signalskey.signal-st.com","xn--gmq92kd2rm1kx34a.com","game.pointmall.rakuten.net","onepiecelabs.tonuriaz.info","chance.enjoy.point.auone.jp","ponta.abstractpainting.work","portal.game.success-corp.jp","portal.game.sycasualgames.com","nukers-misskey.hpc-densi.f5.si","game.hiroba.dpoint.docomo.ne.jp","skyscrapers-and-urbandevelopment.com"];
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
        const arglistRefs = /* 241 */ ["82","81","82,103,104","24","89,94","113","12,13,65,135,136,154","106","40","22","95","114,115","14","7,16","61","113","58","62","59","33","94","37","86","41","35","81","88","6,7","86","9","86","89,94","40","18,19","63","94","9","24","83","92","94","153","89","86","74","2","37,132","133","86","94","37","22","56,57","82","89,94","36","118,155","144","17","113","15","119","37","32","22","53,54,55","60","80","81","9","86","6,7","86","9","2","86","94","87","53","91","53","81","53","2","22","22,134","150","86","94","6,7","146","86","147","94","53","24","72,140,141","132","53","113","34","81","53","53","132","123","86","73","70,71","42,43,44,45,46","72,140,141","94","139","81","99","30,31","53","53","53","89","89,94","86","93","82","86","48","74","132","10","96","138","116","122","86","94","152","8,124,125,126","25","86","37","23","132","76","132","137","81","81","86","151","20","81","26,27,28,29","11","81","94","94","94","22","94","78","132","86","94","8,124,125,126","120,121","22","86","97","79","145","68,89,94,98","81","8,124,125,126","86","101","86","94","42,43,44,45,46","75","53","82,90","148","68","117","86","69","86","22","22","89","94","127","129","94","131","140,141","84","85","64","89","3","86","142","81","102","9","143","11","53","38,39","89","82","47,52","49,50","9,51","100","94","4","21","89","149","86","100","105","100","8,124,125,126","9","65,66,67","49,50","128","86","95","137","1","137","107,108,109,110,111,112","130","77","86","137","5"];
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
    const arglists = /* 156 */ ["","14,0,1","15,2","15,3","15,4","22,5,6","15,7","11,8,9","11,10,9","15,11","14,12","14,2","15,13","14,14,15","14,16","15,17","15,18","22,19,20","11,21,22","11,23,24","36,25","15,26","22,19,27","22,19,28","11,29,30","49,31,32,33","23,34,35","14,36","49,37,38,39","49,40,41,42","12,43,44","17,45,46,47","14,48","17,49,50,47","12,51,52","19,20","11,53,54","22,5,55","7,56","13,57","11,58,59","14,60","15,61","17,62,63","17,62,64","17,62,65","17,62,66","12,51,67","12,8","14,68","15,11,59,69","12,70,71","22,19,67","14,71","15,72","12,73,71","22,74,75","11,76,54","11,77,59","11,78,59","19,79","14,80","11,20,30","17,81,82,47","12,83,84","7,85","7,86","7,87","12,88,89","12,90,91","12,70,92","22,19,93","12,94,95","22,96,97","11,98,9","26,99","11,100,22","26,101,15","17,45,102,47","24,103","14,104,1","12,105,106","10","11,88,30","22,107,108","22,109,110","7,111","12,112,113","19,114","12,83,115","22,116,117","26,118,15","14,119","12,120,121","14,115","12,122,123","1,124,15,125","22,5,126","12,127,128","22,5,129","36,130","12,70,131","11,132,59","11,133,30","17,134","1,135,96,125","17,136,137","1,138,139","1,140,141,142","1,140,143,144","1,140,139,145","11,146,147","11,148,147","11,149,147","11,150,59","22,109,151","7,152","12,88,153","7,154","7,155","11,156,30","10,157","26,158,15","22,5,159","15,160","7,161","25","12,162,163","12,164,165","17,45,166,47","26,167,15,168","22,109,169","22,5,170","14,171","12,112,172","7,173","1,174,175","1,176,177,168","14,178","11,179,30","11,180,59","11,181,59","7,182","19,183","12,90,184","11,185,186","11,187,147","22,5,188","7,189","7,190","17,45,191,47","22,5,192","17,193,194,47","17,41,195,47","50","11,196,30"];
    const args = /* 197 */ ["/resolve|native/","300","adsbygoogle","adm.shinobi.jp","/geniee\\.jp|securepubads\\.g\\.doubleclick\\.net/","DOMContentLoaded","isAllowedBrowser","?abg=","navigator.brave","undefined","YAAB","pagead2.googlesyndication.com","aswift_","d.socdm.com","null===document.getElementById","1000","intersa.aspx","/adm\\.shinobi\\.jp\\/st\\/t\\.js/ method:HEAD mode:no-cors","adsbygoogle.js","load","adBlockDetected","google_tag_manager","{}","adsbygoogle.pageState","1","広告","/pagead2\\.googlesyndication\\.com|metrics\\.streaks\\.jp|ads-twitter\\.com/","delayC","delayCheckAB","myFunc","noopFunc","ins.adsbygoogle","display","block","Function.prototype.toString","/w/load.php?lang=ja&modules=codex-search-styles%2Cjquery%2Coojs%2C&skin=vector-2022&version=L58hf","()=>k(S(4","#mw-content-text div[style] a:is([href*=\"contents.fc2.com\"],[href*=\"dmm.co.jp\"])","font-size","14px","#mw-content-text div[style] a:is([href*=\"contents.fc2.com\"],[href*=\"dmm.co.jp\"]) img","height","128px","EventTarget.prototype.addEventListener","eval","href","a[style*=\"display:\"][href^=\"https://al.dmm.co.jp\"]","stay","return","style",".js-reward-target[style]","onload","google_esf","adBlockerDetected","false","interstitialAd","ad_flg ad_url data.adData data.adTagUrl","doubleclick.net","all520dddaaa2022ccc","true","oAdChk","tpc.googlesyndication.com","id","#div-gpt-ad-sidebottom","#div-gpt-ad-footer","#div-gpt-ad-pagebottom","#div-gpt-ad-relatedbottom-1","adsCount","/adsbygoogle|clientHeight/","cors","document.getElementById","_0x","cdn.adschill.com","document.querySelector","error","adscript-error","flgDisplay","adsbygoogle.loaded","gptScriptLoaded","AdBlockLimitation","objDef.resolve","class",".quigo","jQuery","decodeURIComponent","ads","result.ad_info","result.paths.[].ad_info","document.write","sitejack","document.createElement","overview","imageUrls","videoInstArea","$","google_ads_iframe_","","setTrigger","pum_vars","reward_countdown","ads_data","timerId",".cps-post-main a[href^=\"https://www.amazon.co.jp\"]","q2w3_sidebar(q2w3_sidebar_options","movie_cnt","document.referrer","gmo_bb","scroll","b.type","click","event","ads.[].imageUrl","document.currentScript","insertAdjacentHTML","fanza_link","floatingAd","playing","VAST_TARGET",".run()}","location","tag","Math.random","addEventListener","style.display","simplegameAdCountDown","0.02","window[","jmp","Math","showPopUpBanner","hoihoi","lists","geoAvailable","$.popunder","data-popup-url","aeriaGamesAdCountDown","onclick","span > a[onclick]","visibility","4000","[native code]","2000","0.3","3000","0.25","0.2","FIRST_DELAY","0","NEXT_DELAY","sec","scPopped","ad-nex.com","vd","rand = Math","props.pageProps.article2ndBannerData","props.allAds","doAdRedirect","/ok_|pemsrv\\.com|window\\.location\\.href/","#close-ad","SolispiaRewardedAdGate.init","method:POST","html","actress","myad","dataLayer.push","document.cookie.includes","#kk","skipcnt","0.001","waqool","/[Aa]dDiv|showVignette/","return r(!0)","IFTG","data.adData","/nrWrapper\\(\\)|n\\.setTimeoutIds_\\.has\\(i\\)/","10000","/adSkip|window\\.ADGMAD/","30000","return n(!0)","univresalP","isGGSurvey","enable_dl_after_countdown","props.initialProps.pageProps.pageData.brandingAds","wpsite_clickable_data","randomad","SU_Api.AdsTimer","-1","map_ad_bottom_height","Fixed","data.response.videoAds data.response.waku.tagRelatedBanner","kyujin_box juku",".topentry_text a","registration_guide_modal","onmousedown","a[onmousedown^=\"this.href=\\\"//widgets.taxel.jp\"]","iframe[id^=\"google_ads_iframe\"]","TagProvider.cleanup"];
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
})("74f9600a-13a3-47bc-b856-40c6da158b89");

void 0;
