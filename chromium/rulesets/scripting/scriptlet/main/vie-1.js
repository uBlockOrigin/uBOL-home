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
    const scriptletHostnames = /* 143 */ ["aoe.vn","genk.vn","soha.vn","cafef.vn","gamek.vn","hh2d.top","znews.vn","zpic.org","18tube.uk","hhtq5.vip","kenh14.vn","plcdn.xyz","qmhv3.biz","viet69.be","vndoc.com","xem20.net","xfast.sbs","xnhau.pub","afamily.vn","baomoi.com","cap3.video","gocmod.com","haysex.lat","javhd.shop","laodong.vn","onflix.lat","phimtho.cc","qmanga.art","qmh.garden","qmhsex.sbs","quykhu.com","rophimz.sh","tekora.fun","tophim.vip","tram3d.com","tram3d.mom","tuoitre.vn","buomtv.page","clipphot.co","comong.info","fcloud.live","giavang.net","giovang.uno","hhvsub1.com","misskon.com","motphimc.mx","phimhdc.com","phimmoic.id","rphang.beer","sachmoi.net","streamc.xyz","tram3d.skin","vailonxx.me","viet69vn.at","vinaurl.net","a.kvp726.com","abysscdn.com","anime47.best","checkscam.vn","cliphubs.com","imail.edu.vn","javtiful.com","lrepacks.net","motchillu.mx","ombak700.org","sayhentai.cx","sexdiaryx.to","thanhnien.vn","truyenvn.sbs","www.asu.baby","yanhh3d.chat","animesub.site","beatvn.online","cmangax18.com","haysexvn.shop","hentaivkl.pro","lxmanga.space","phim18hd.site","phimsexvp.net","quatvn.garden","sexhihi18.pro","sexviet88.cam","subnhanh.plus","truyen247.pro","vevocloud.com","z1.chinav.sex","cdn.codexa.fun","cunghocvui.com","damconuong.win","ftscontent.com","hopphim.online","ios.codevn.net","laophatgia.fit","moontruyen.com","phimchill.life","player-cdn.com","playhydrax.com","sex.javnong.cc","sexmupxinh.net","thefaplive.com","trumtruyen.xyz","truyenqqko.com","umetruyenz.org","viet69hayz.cfd","www.8phim1.net","animehay15.site","cliphot69.cloud","freetube.com.mx","lottedira.store","mv.phimmoiaz.cc","nettruyenar.com","truyenfull.live","truyensextv.com","www.iosviet.com","hoctot.hocmai.vn","linkneverdie.net","linkneverdie.top","luottruyen20.com","mv.phimbathu.one","www.gvnvh18z.com","animevietsub.sale","animevietsub9.com","demo.14412882.com","linkneverdie2.com","mv.dailyphimz.com","phimsexhayvne.com","truyensieuhay.com","www.curvegrad.com","doctruyen3qhub.fit","honghotduongpho.vn","motchilltvphim.com","phimsexsuong3x.net","player.phimapi.com","quangcaoyenbai.com","x.phimsexvn1.co.uk","audiotruyenfull.com","dualeotruyenday.com","freeplayervideo.com","nettruyenviet10.com","www.sieutamphim.top","xnxx-sex-videos.com","javgiga.wordpress.com","www.toptruyenzone13.com"];
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
        const arglistRefs = /* 143 */ ["7","11,12","11,12","11,12","11,12","26","92","45","1","19","11,12","52,53,54,55,56","21,57,58,59,60","19","78","87","45","88,89","11,12","9","13,21","24","19","31","32","49","51","19","13,21","45,75","62","63","38","68","69","70","11,12","19","15","75","44","22","23","46","19,64","63","75","63","64","45","21","71","76","19","77","2","20","3,45,75","17","15","27,28","19","39","43,44","48","19","83","11,12","19","81","74","5,45,75","10","16","25","19","19,40","19","50","19,61","75","19","67","72","19","74","14,45","17","19","19","21","29,30","33","41","75","20,21","20","65","19,66","75","28","19","19","15","19,28,79,80","4","19","45","38","45","46","45,73","74","84","45","34,35,36,37","34,35,36,37","19","75","83","71","6","19","34,35,36,37","75","19","75","82","19","75","42","19","45","75","45","8,28","18,19","20,21","47","19,21,85","90,91","45,80","86"];
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
    const arglists = /* 93 */ ["","12,0,1","47,2,3,4","14,5","19,6","11,7,8","19,9","19,10","12,0,11","31,12","12,0,13","12,14,15","11,15,16","19,17","12,18,19","12,0,20","14,21","12,0,22","12,0,23","12,24,25","12,26,27","11,22,16","15,28","7,29","12,30,31","12,0,32","12,18,33","12,34,35","12,34,36","12,30,37","12,38,39","12,0,40","12,41,42","12,43,44","12,45,46","19,47","14,48,49","14,50,51","12,18,52","12,53,54","12,18,55","12,18,22","12,30,56","22,57,17","22,57,58","19,22","12,24,59","12,60,61","19,62","22,57,63","12,41,64","12,18,65","19,1","19,66","19,67","19,68","19,69","22,57,70,71,72","22,57,73","22,57,34","22,74,73","12,41,75","12,0,76","22,57,1","12,77,78","19,79","19,80","12,18,20","22,57,20","12,45,81","12,34,82","12,83,84","12,83","11,85,8","12,0,86","19,87","12,30,88","19,89","11,90,8","12,45,91","19,75","19,92","12,93,94","11,95,16","11,96,8","31,97","12,34,22","7,98","12,0,99","22,57,100","12,34,101","17,102,103","19,104"];
    const args = /* 105 */ ["document.addEventListener","ads","/#EXT-X-DISCONTINUITY(.|\\n){1","500}#EXT-X-DISCONTINUITY/gm","index.m3u8","Adblock","popUp","maxAds","0","_0x3f9b","parseInt","ai_run","AdtimaRender","Redirect","Object.defineProperty","ADMStorageFileCDN","noopFunc","sessionStorage","$","arrDirectLink","pop","ads_num","open","popunder","WebAssembly","instantiate","document.getElementById","openPop","method:HEAD","0.default_ads_video","jQuery","popup","adx","adblock","setTimeout","ad_block","Aff","Popup","setInterval","offsetHeight","Click","window.addEventListener","AdBlock","document.getElementsByClassName","reading-content","document.createElement","optad","pushOnPage","DisplayAHTML","5001","callback","6004","aff","JSON.parse","break;case $.","PopUnder","click_time","click","links","globalThis","JSON","fromCharCode","sp","fast_link","Ads","p0pUpRandom","adsPlayer","adsPopupPlayer","adsTvc","keyPlayer","d","elements",".art-control-fullscreen","e.target","fullscreenchange","localStorage","atob","document.querySelectorAll","popMagic","Math.round","Cookies",";break;case","appendChild","eval","$._Eu","ads_show","opup","document.cookie","window.open","oneClick","seconds","script","initialAdURLs","addEvent","popu","D4zz","timer","_$_d52e","props.children.[].props.tvc","lastPopunderTime","/acquirecardedsullen|POPUNDER_INTERVAL|lastPopunderTime/","window.location","target|onclick","a[href^=\"/video/\"]","adtimaConfig"];
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
