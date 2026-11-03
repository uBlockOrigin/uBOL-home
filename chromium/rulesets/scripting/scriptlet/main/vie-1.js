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
    const scriptletHostnames = /* 143 */ ["aoe.vn","genk.vn","soha.vn","cafef.vn","gamek.vn","hh2d.top","znews.vn","zpic.org","18tube.uk","hhtq5.vip","kenh14.vn","plcdn.xyz","qmhv3.mom","quatvn.si","viet69.be","vndoc.com","xem20.net","xfast.sbs","afamily.vn","baomoi.com","buomtv.biz","cap3.video","gocmod.com","javhd.shop","laodong.vn","onflix.lat","phimtho.cc","pxhero.net","qmanga.art","qmh.garden","quykhu.com","rophimz.li","tekora.fun","tophim.vip","tram3d.com","tram3d.mom","tuoitre.vn","xnhau.pink","yanhh3d.de","clipphot.co","comong.info","fcloud.live","giavang.net","hangngon.tv","hhvsub1.com","lxmanga.top","misskon.com","motphimc.tv","phimhdc.com","qmhsex.shop","rphang.shop","sachmoi.net","streamc.xyz","tram3d.skin","vailonxx.me","viet69vn.at","vinaurl.net","a.kvp726.com","abysscdn.com","anime47.best","checkscam.vn","cliphubs.com","giovang.love","imail.edu.vn","javtiful.com","lrepacks.net","ombak700.org","phimmoic.vip","sayhentai.cx","sexdiaryx.to","thanhnien.vn","truyenvn.sbs","ww1.8phim.cc","www.asu.baby","x.chinav.sex","animesub.site","beatvn.online","haysexvn.shop","hentaibox.top","hentaivkl.pro","motchilln.biz","phim18hd.site","sexviet88.cam","subnhanh.plus","truyen247.pro","vevocloud.com","vlsexhihi.one","cdn.codexa.fun","cliphot69.golf","cunghocvui.com","damconuong.icu","ftscontent.com","hopphim.online","ios.codevn.net","laophatgia.fit","moontruyen.com","phimchill.life","player-cdn.com","playhydrax.com","sex.javnong.cc","sexmupxinh.net","thefaplive.com","trumtruyen.xyz","truyenqqko.com","umetruyenz.org","animehay16.site","freetube.com.mx","lottedira.store","mv.phimmoiaz.cc","nettruyenar.com","truyenfull.live","truyensextv.com","www.iosviet.com","hoctot.hocmai.vn","linkneverdie.net","linkneverdie.top","luottruyen21.com","mv.phimbathu.one","viet69hayz.quest","www.gvnvh18z.com","animevietsub.news","animevietsub9.com","demo.14412882.com","linkneverdie2.com","mv.dailyphimz.com","phimsexhayvne.com","truyensieuhay.com","www.curvegrad.com","doctruyen3qhub.fit","honghotduongpho.vn","motchilltvphim.com","phimsexsuong3x.net","player.phimapi.com","quangcaoyenbai.com","x.phimsexvn1.co.uk","audiotruyenfull.com","freeplayervideo.com","nettruyenviet10.com","www.sieutamphim.top","xnxx-sex-videos.com","phimsexvietsubtv.com","javgiga.wordpress.com","www.toptruyenzone14.com"];
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
        const arglistRefs = /* 143 */ ["7","11,12","11,12","11,12","11,12","25","92","44","1","24","11,12","51,52,53,54,55","18,57,58,59,60","24,61","24","78","87","44","11,12","9","24","13,18","21","30","31","48","50","56","24","13,18","62","63","37","68","69","70","11,12","88,89","74","15","75","42","19","24","45","24,39","24,64","63","75","44,75","64","44","18","71","76","24","77","2","17","3,44,75","16","15","20","26,27","24","38","47","63","24","83","11,12","24","24,27,79,80","81","74","5,44,75","10","22","23,24","24","41,42","24","24","67","72","24","75","14,44","24","16","24","24","18","28,29","32","40","75","17,18","17","65","24,66","75","27","24","24","4","44","37","44","45","44,73","74","84","44","33,34,35,36","33,34,35,36","24","75","15","83","71","6","24","33,34,35,36","75","24","75","82","24","75","43","24","44","75","44","8,27","17,18","46","18,24,85","90,91","49","44,80","86"];
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
    const arglists = /* 93 */ ["","12,0,1","47,2,3,4","14,5","17,6","11,7,8","17,9","17,10","12,0,11","30,12","12,0,13","12,14,15","11,15,16","17,17","12,18,19","12,0,20","12,0,21","12,22,23","11,21,16","15,24","7,25","12,26,27","12,0,28","12,0,29","12,30,31","12,18,32","12,33,34","12,33,35","12,26,36","12,37,38","12,0,39","12,40,41","12,42,43","12,44,45","17,46","14,47,48","14,49,50","12,18,51","12,52,53","12,18,54","12,18,21","22,55,17","22,55,56","12,26,57","17,21","12,30,58","12,59,60","17,61","22,55,62","12,40,63","12,18,64","17,1","17,65","17,66","17,67","17,68","14,69","22,55,70,71,72","22,55,73","22,55,33","22,74,73","12,40,75","12,0,76","22,55,1","12,77,78","17,79","17,80","12,18,20","22,55,20","12,44,81","12,33,82","12,83,84","12,83","11,85,8","12,0,86","17,87","12,26,88","17,89","11,90,8","12,44,91","17,75","17,92","12,93,94","11,95,16","11,96,8","30,97","12,33,21","7,98","12,0,99","22,55,100","12,33,101","18,102,103","17,104"];
    const args = /* 105 */ ["document.addEventListener","ads","/#EXT-X-DISCONTINUITY(.|\\n){1","500}#EXT-X-DISCONTINUITY/gm","index.m3u8","Adblock","popUp","maxAds","0","_0x3f9b","parseInt","ai_run","AdtimaRender","Redirect","Object.defineProperty","ADMStorageFileCDN","noopFunc","sessionStorage","$","arrDirectLink","pop","open","document.getElementById","openPop","method:HEAD","0.default_ads_video","jQuery","popup","adx","popunder","WebAssembly","instantiate","adblock","setTimeout","ad_block","Aff","Popup","setInterval","offsetHeight","Click","window.addEventListener","AdBlock","document.getElementsByClassName","reading-content","document.createElement","optad","pushOnPage","DisplayAHTML","5001","callback","6004","aff","JSON.parse","break;case $.","PopUnder","click","links","click_time","globalThis","JSON","fromCharCode","sp","fast_link","Ads","p0pUpRandom","adsPlayer","adsPopupPlayer","adsTvc","keyPlayer","ads_num","d","elements",".art-control-fullscreen","e.target","fullscreenchange","localStorage","atob","document.querySelectorAll","popMagic","Math.round","Cookies",";break;case","appendChild","eval","$._Eu","ads_show","opup","document.cookie","window.open","oneClick","seconds","script","initialAdURLs","addEvent","popu","D4zz","timer","_$_d52e","props.children.[].props.tvc","lastPopunderTime","/acquirecardedsullen|POPUNDER_INTERVAL|lastPopunderTime/","window.location","target|onclick","a[href^=\"/video/\"]","adtimaConfig"];
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
