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

// ruleset: vie-1

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
    const scriptletHostnames = /* 144 */ ["aoe.vn","genk.vn","soha.vn","cafef.vn","gamek.vn","hh2d.top","qmhv3.cc","znews.vn","zpic.org","18tube.uk","hhtq5.vip","kenh14.vn","pixnet.cc","plcdn.xyz","viet69.be","vndoc.com","xem20.net","xfast.sbs","xnhau.pub","afamily.vn","baomoi.com","cap3.video","gocmod.com","javhd.shop","laodong.vn","mphimtv.my","onflix.lat","phimtho.cc","qmanga.art","qmh.garden","qmhsex.cfd","quykhu.com","tekora.fun","tram3d.com","tram3d.mom","tuoitre.vn","buomtv.page","clipphot.co","comong.info","fcloud.live","giavang.net","giovang.bet","hhvsub1.com","kphimsex.tv","misskon.com","motphimc.mx","phimhdc.com","phimmoic.cx","rphang.beer","sachmoi.net","streamc.xyz","tram3d.skin","vailonxx.me","viet69vn.at","vinaurl.net","a.kvp726.com","abysscdn.com","anime47.best","checkscam.vn","cliphubs.com","imail.edu.vn","javtiful.com","lrepacks.net","motchillv.cx","ombak700.org","saigon24.net","sayhentai.cx","sexdiaryx.to","sexhihi3x.cc","thanhnien.vn","truyenvn.sbs","www.asu.baby","yanhh3d.chat","animesub.site","beatvn.online","cmangax18.com","haysexvn.shop","hentaivkl.pro","lxmanga.space","phim18hd.site","quatvn.garden","sexviet62.com","sexviet88.cam","subnhanh.plus","truyen247.pro","vevocloud.com","z1.chinav.sex","cdn.codexa.fun","cunghocvui.com","damconuong.win","ftscontent.com","hopphim.online","ios.codevn.net","laophatgia.fit","moontruyen.com","phimchill.life","player-cdn.com","playhydrax.com","sex.javnong.cc","sexmupxinh.net","thefaplive.com","trumtruyen.xyz","truyenqqko.com","umetruyenz.org","viet69hayz.cfd","www.2phim1.com","animehay15.site","cliphot69.cloud","freetube.com.mx","lottedira.store","mv.phimmoiaz.cc","nettruyenar.com","truyenfull.live","truyensextv.com","www.iosviet.com","hoctot.hocmai.vn","linkneverdie.net","linkneverdie.top","luottruyen20.com","mv.phimbathu.one","www.gvnvh18z.com","animevietsub.sale","animevietsub9.com","demo.14412882.com","linkneverdie2.com","mv.dailyphimz.com","phimsexhayvne.com","truyensieuhay.com","www.curvegrad.com","doctruyen3qhub.fit","honghotduongpho.vn","motchilltvphim.com","phimsexsuong3x.net","player.phimapi.com","quangcaoyenbai.com","x.phimsexvn1.co.uk","audiotruyenfull.com","dualeotruyenbet.com","freeplayervideo.com","nettruyenviet10.com","www.sieutamphim.pro","xnxx-sex-videos.com","javgiga.wordpress.com","www.toptruyenzone13.com"];
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
        const arglistRefs = /* 144 */ ["7","11,12","11,12","11,12","11,12","26","21,58,59,60,61","93","46","1","19","11,12","52","53,54,55,56,57","19","79","88","46","89,90","11,12","9","13,21","24","31","32","45","50","51","19","13,21","46,76","63","38","70","71","11,12","19","15","76","44","22","23","47","19","19,64","52","76","52","64","46","21","72","77","19","78","2","20","3,46,76","17","15","27,28","19","39","43,44","49","65","19","84","76","11,12","19","82","75","5,46,76","10","16","25","19","19,40","19","19,62","68","19","69","73","19","75","14,46","17","19","19","21","29,30","33","41","76","20,21","20","66","19,67","76","28","19","19","15","19,28,80,81","4","19","46","38","46","47","46,74","75","85","46","34,35,36,37","34,35,36,37","19","76","84","72","6","19","34,35,36,37","76","19","76","83","19","76","42","19","46","76","46","8,28","18,19","20,21","48","19,21,86","91,92","46,81","87"];
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
    const arglists = /* 94 */ ["","12,0,1","47,2,3,4","14,5","19,6","11,7,8","19,9","19,10","12,0,11","31,12","12,0,13","12,14,15","11,15,16","19,17","12,18,19","12,0,20","14,21","12,0,22","12,0,23","12,24,25","12,26,27","11,22,16","15,28","7,29","12,30,31","12,0,32","12,18,33","12,34,35","12,34,36","12,30,37","12,38,39","12,0,40","12,41,42","12,43,44","12,45,46","19,47","14,48,49","14,50,51","12,18,52","12,53,54","12,18,55","12,18,22","12,30,56","22,57,17","22,57,58","11,59,60","19,22","12,24,61","12,62,63","19,64","22,57,65","12,18,66","22,57,1","19,1","19,67","19,68","19,69","19,70","22,57,71,72,73","22,57,74","22,57,34","22,75,74","12,41,76","12,0,77","12,78,79","12,26,80","19,81","19,82","12,41,83","12,18,20","12,45,84","12,34,85","12,86,87","12,86","11,88,8","12,0,89","19,90","12,30,91","19,92","11,93,8","12,45,94","19,76","19,95","12,96,97","11,98,16","11,99,8","31,100","12,34,22","7,101","12,0,102","22,57,103","12,34,104","17,105,106","19,107"];
    const args = /* 108 */ ["document.addEventListener","ads","/#EXT-X-DISCONTINUITY(.|\\n){1","500}#EXT-X-DISCONTINUITY/gm","index.m3u8","Adblock","popUp","maxAds","0","_0x3f9b","parseInt","ai_run","AdtimaRender","Redirect","Object.defineProperty","ADMStorageFileCDN","noopFunc","sessionStorage","$","arrDirectLink","pop","ads_num","open","popunder","WebAssembly","instantiate","document.getElementById","openPop","method:HEAD","0.default_ads_video","jQuery","popup","adx","adblock","setTimeout","ad_block","Aff","Popup","setInterval","offsetHeight","Click","window.addEventListener","AdBlock","document.getElementsByClassName","reading-content","document.createElement","optad","pushOnPage","DisplayAHTML","5001","callback","6004","aff","JSON.parse","break;case $.","PopUnder","click_time","click","links","urlAds","","globalThis","JSON","fromCharCode","sp","fast_link","p0pUpRandom","adsPlayer","adsPopupPlayer","adsTvc","keyPlayer","d","elements",".art-control-fullscreen","e.target","fullscreenchange","localStorage","atob","document.querySelectorAll","popMagic","myModal","Math.round","Cookies","Ads",";break;case","appendChild","eval","$._Eu","ads_show","opup","document.cookie","window.open","oneClick","seconds","script","initialAdURLs","addEvent","popu","D4zz","timer","_$_d52e","props.children.[].props.tvc","lastPopunderTime","/acquirecardedsullen|POPUNDER_INTERVAL|lastPopunderTime/","window.location","target|onclick","a[href^=\"/video/\"]","adtimaConfig"];
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
