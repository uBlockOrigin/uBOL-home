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
    const scriptletHostnames = /* 140 */ ["aoe.vn","genk.vn","soha.vn","cafef.vn","gamek.vn","hh2d.top","znews.vn","zpic.org","18tube.uk","hhtq5.vip","kenh14.vn","plcdn.xyz","qmhv3.lol","viet69.be","vndoc.com","xem20.net","xfast.sbs","afamily.vn","baomoi.com","buomtv.biz","cap3.video","gocmod.com","hopdem.net","javhd.shop","laodong.vn","onflix.lat","pxhero.net","qmanga.art","qmh.garden","quykhu.com","rophimz.cv","tekora.fun","tram3d.com","tram3d.mom","tuoitre.vn","xnhau.moda","clipphot.co","comong.info","fcloud.live","giavang.net","hhvsub1.com","lxmanga.top","misskon.com","motphimz.to","phimhdc.com","phimmoic.vc","qmhsex.wiki","rphang.bike","sachmoi.net","streamc.xyz","tram3d.skin","vailonxx.me","viet69vn.at","vinaurl.net","a.kvp726.com","abysscdn.com","anime47.best","checkscam.vn","cliphubs.com","giovang.gold","javtiful.com","lrepacks.net","motchillw.ac","ombak700.org","sayhentai.cx","sexdiaryx.to","thanhnien.vn","tophim.click","truyenvn.sbs","www.asu.baby","x.chinav.sex","yanhh3d.baby","animesub.site","beatvn.online","haysexvn.shop","hentaibox.top","hentaivkl.pro","phim18hd.site","quatvn.stream","sexviet88.cam","subnhanh.plus","truyen247.pro","vevocloud.com","xxsexhihi.com","cdn.codexa.fun","cliphot69.golf","cunghocvui.com","ftscontent.com","hopphim.online","ios.codevn.net","laophatgia.fit","moontruyen.com","phimchill.life","phimsex10x.com","player-cdn.com","playhydrax.com","sex.javnong.cc","sexmupxinh.net","thefaplive.com","trumtruyen.xyz","truyenqqko.com","umetruyenz.org","animehay17.site","damconuong.tech","freetube.com.mx","lottedira.store","mv.phimmoiaz.cc","nettruyenar.com","truyenfull.live","truyensextv.com","viet69hayz.blog","www.iosviet.com","animevietsub.bid","hoctot.hocmai.vn","linkneverdie.net","linkneverdie.top","luottruyen21.com","mv.phimbathu.one","ww2.motphimy.com","www.gvnvh18z.com","demo.14412882.com","linkneverdie2.com","mv.dailyphimz.com","phimsexhayvne.com","truyensieuhay.com","www.pumpcrate.com","honghotduongpho.vn","motchilltvphim.com","phimsexsuong3x.net","player.phimapi.com","quangcaoyenbai.com","x.phimsexvn1.co.uk","audiotruyenfull.com","doctruyen3qhub.club","freeplayervideo.com","nettruyenviet10.com","xnxx-sex-videos.com","javgiga.wordpress.com","www.sieutamphim.cloud","www.toptruyenzone15.com"];
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
        const arglistRefs = /* 140 */ ["6","10,11","10,11","10,11","10,11","24","89","41","1","23","10,11","47,48,49,50,51","17,53,54,55,56","23","74","84","41","10,11","8","23","12,17","20","23","27","28","45","52","23","12,17","58","59","34","65","66","10,11","85,86","14","71","40","18","42","23,36","23,60","59","71","59","41,71","60","41","17","67","72","23","73","2","16","3,41,71","15","14","19","23","35","39,40","44","23","79","10,11","64","23","78","70","70","5,41,71","9","21","22,23","23","23","23,57","23","63","68","23","71","13,41","23","15","23","17","25,26","29","37","71","46","16,17","16","61","23,62","71","77","23","23","4","23","41","34","41","42","41,69","70","14","80","67","41","30,31,32,33","30,31,32,33","23","71","23,75,76,77","79","23","30,31,32,33","71","23","71","81","71","38","23","41","71","41","7,77","23","16,17","43","87,88","41,76","17,23,82","83"];
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
    const arglists = /* 90 */ ["","12,0,1","48,2,3,4","14,5","17,6","11,7,8","17,9","12,0,10","32,11","12,0,12","12,13,14","11,14,15","17,16","12,17,18","12,0,19","12,0,20","12,21,22","11,20,15","15,23","7,24","12,25,26","12,0,27","12,0,28","12,29,30","12,17,31","12,25,32","12,33,34","12,0,35","12,36,37","12,38,39","12,40,41","17,42","14,43,44","14,45,46","12,17,47","12,48,49","12,17,50","12,17,20","12,25,51","22,52,16","22,52,53","17,20","12,29,54","12,55,56","17,57","22,52,58","12,36,59","17,1","17,60","17,61","17,62","17,63","14,64","22,52,65,66,67","22,52,68","22,52,69","22,70,68","12,36,71","12,0,72","22,52,1","12,73,74","17,75","17,76","12,17,19","22,52,19","12,40,77","12,69,78","12,79,80","12,79","11,81,8","12,0,82","17,83","12,25,84","17,85","11,86,8","12,40,87","17,71","12,69,88","17,89","11,90,15","11,91,8","12,92,93","32,94","12,69,20","7,95","12,0,96","22,52,97","12,69,98","18,99,100","17,101"];
    const args = /* 102 */ ["document.addEventListener","ads","/#EXT-X-DISCONTINUITY(.|\\n){1","500}#EXT-X-DISCONTINUITY/gm","index.m3u8","Adblock","popUp","maxAds","0","parseInt","ai_run","AdtimaRender","Redirect","Object.defineProperty","ADMStorageFileCDN","noopFunc","sessionStorage","$","arrDirectLink","pop","open","document.getElementById","openPop","method:HEAD","0.default_ads_video","jQuery","popup","adx","popunder","WebAssembly","instantiate","adblock","Popup","setInterval","offsetHeight","Click","window.addEventListener","AdBlock","document.getElementsByClassName","reading-content","document.createElement","optad","pushOnPage","DisplayAHTML","5001","callback","6004","aff","JSON.parse","break;case $.","PopUnder","click_time","click","links","globalThis","JSON","fromCharCode","sp","fast_link","Ads","adsPlayer","adsPopupPlayer","adsTvc","keyPlayer","ads_num","d","elements",".art-control-fullscreen","e.target","setTimeout","fullscreenchange","localStorage","atob","document.querySelectorAll","popMagic","Math.round","Cookies",";break;case","appendChild","eval","$._Eu","ads_show","opup","document.cookie","window.open","oneClick","seconds","script","Aff","initialAdURLs","D4zz","timer","addEvent","popu","_$_d52e","props.children.[].props.tvc","lastPopunderTime","/acquirecardedsullen|POPUNDER_INTERVAL|lastPopunderTime/","window.location","target|onclick","a[href^=\"/video/\"]","adtimaConfig"];
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
