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
    const scriptletHostnames = /* 144 */ ["aoe.vn","genk.vn","soha.vn","cafef.vn","gamek.vn","hh2d.top","znews.vn","zpic.org","18tube.uk","hhtq5.vip","javnhe.tv","kenh14.vn","plcdn.xyz","qmhv3.fit","viet69.be","vndoc.com","xem20.net","xfast.sbs","xnhau.foo","afamily.vn","baomoi.com","buomtv.diy","cap3.video","gocmod.com","javhd.shop","laodong.vn","mphimtv.my","onflix.lat","phimtho.cc","qmanga.art","qmh.garden","qmhsex.fun","quatvn.diy","quykhu.com","rophim.moe","rphang.now","tekora.fun","tram3d.com","tram3d.mom","tuoitre.vn","clipphot.co","comong.info","fcloud.live","giavang.net","giovang.tax","hhvsub1.com","misskon.com","motphimc.pw","phimhdc.com","phimmoic.nl","sachmoi.net","streamc.xyz","tram3d.skin","vailonxx.me","viet69vn.at","vinaurl.net","vsexhihi.cc","abysscdn.com","anime47.best","checkscam.vn","cliphubs.com","imail.edu.vn","javtiful.com","lrepacks.net","motchillv.fm","ombak700.org","saigon24.net","sayhentai.cx","sexdiaryx.to","thanhnien.vn","truyenvn.sbs","www.asu.baby","yanhh3d.chat","animesub.site","beatvn.online","cmangax18.com","haysexvn.shop","hentaivkl.pro","lxmanga.space","phim18hd.site","sexviet88.cam","subnhanh.plus","truyen247.pro","vevocloud.com","z1.chinav.sex","cdn.codexa.fun","cunghocvui.com","damconuong.pet","ftscontent.com","hopphim.online","ios.codevn.net","laophatgia.fit","moontruyen.com","phimchill.life","player-cdn.com","playhydrax.com","rophimss.co.uk","sex.javnong.cc","sexmupxinh.net","thefaplive.com","trumtruyen.xyz","truyenqqko.com","umetruyenz.org","viet69hayz.lat","animehay14.site","animevietsub.nl","cliphot69.space","freetube.com.mx","lottedira.store","mv.phimmoiaz.cc","nettruyenar.com","truyenfull.live","truyensextv.com","www.1phim38.com","www.iosviet.com","hoctot.hocmai.vn","linkneverdie.net","linkneverdie.top","luottruyen19.com","mv.phimbathu.one","www.gvnvh18z.com","animevietsub9.com","demo.14412882.com","linkneverdie2.com","mv.dailyphimz.com","phimlongtieng.net","phimsexhayvne.com","truyensieuhay.com","doctruyen3qhub.fit","honghotduongpho.vn","motchilltvphim.com","phimsexsuong3x.net","player.phimapi.com","quangcaoyenbai.com","x.phimsexvn1.co.uk","audiotruyenfull.com","dualeotruyenvie.com","freeplayervideo.com","nettruyenviet10.com","phimsexsinhvien.com","www.sieutamphim.pro","xnxx-sex-videos.com","javgiga.wordpress.com","www.toptruyenzone12.com"];
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
        const arglistRefs = /* 144 */ ["6","10,11","10,11","10,11","10,11","25","92","45","1","18","18","10,11","53,54,55,56,57","20,58,59,60,61","18","80","87","45","88,89","10,11","8","18","12,20","23","30","31","44","49","52","18","12,20","45,77","18,62","63","64","66","37","71","72","10,11","14","77","43","21","22","46","18,66","65","77","65","45","20","73","78","18","79","77","19","2,45,77","16","14","26,27","18","38","42,43","48","67","18","83","10,11","18","82","76","4,45,77","9","15","24","18","18,39","18","18","70","74","18","76","13,45","16","18","18","20","28,29","32","40","77","19,20","19","65","68","18,69","77","27","18","18","14","3","73","18","45","37","45","46","45,75","76","27,81","84","45","33,34,35,36","33,34,35,36","18","77","83","5","18","33,34,35,36","77","18,50","18","77","18","77","41","18","45","77","45","7,27","17,18","19,20","47","51","18,20,85","90,91","45,81","86"];
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
    const arglists = /* 93 */ ["","12,0,1","14,2","19,3","11,4,5","19,6","19,7","12,0,8","31,9","12,0,10","12,11,12","11,12,13","19,14","12,15,16","12,0,17","14,18","12,0,19","12,0,20","12,21,22","12,23,24","11,19,13","15,25","7,26","12,27,28","12,0,29","12,15,30","12,31,32","12,31,33","12,27,34","12,35,36","12,0,37","12,38,39","12,40,41","12,42,43","19,44","14,45,46","14,47,48","12,15,49","12,50,51","12,15,52","12,15,19","12,27,53","22,54,14","22,54,55","11,56,57","19,19","12,21,58","12,59,60","19,61","22,54,62","12,42,63","12,38,64","12,15,65","19,1","19,66","19,67","19,68","19,69","22,54,70,71,72","22,54,73","22,54,31","22,74,73","12,38,75","12,0,76","12,77,78","22,54,1","12,79,80","12,23,81","19,82","19,83","12,15,17","12,42,84","12,31,85","12,86,87","12,86","11,88,5","12,0,89","19,90","12,27,91","19,92","11,93,5","19,75","19,94","11,95,13","11,96,5","31,97","12,31,19","7,98","12,0,99","22,54,100","12,31,101","17,102,103","19,104"];
    const args = /* 105 */ ["document.addEventListener","ads","Adblock","popUp","maxAds","0","_0x3f9b","parseInt","ai_run","AdtimaRender","Redirect","Object.defineProperty","ADMStorageFileCDN","noopFunc","sessionStorage","$","arrDirectLink","pop","ads_num","open","popunder","WebAssembly","instantiate","document.getElementById","openPop","method:HEAD","0.default_ads_video","jQuery","popup","adx","adblock","setTimeout","ad_block","Aff","Popup","setInterval","offsetHeight","Click","window.addEventListener","AdBlock","document.getElementsByClassName","reading-content","document.createElement","optad","pushOnPage","DisplayAHTML","5001","callback","6004","aff","JSON.parse","break;case $.","PopUnder","click_time","click","links","urlAds","","globalThis","JSON","fromCharCode","sp","fast_link","script","Ads","p0pUpRandom","adsPlayer","adsPopupPlayer","adsTvc","keyPlayer","d","elements",".art-control-fullscreen","e.target","fullscreenchange","localStorage","atob","addEvent","popu","document.querySelectorAll","popMagic","myModal","Math.round","Cookies",";break;case","appendChild","eval","$._Eu","ads_show","opup","document.cookie","window.open","oneClick","seconds","initialAdURLs","D4zz","timer","_$_d52e","props.children.[].props.tvc","lastPopunderTime","/acquirecardedsullen|POPUNDER_INTERVAL|lastPopunderTime/","window.location","target|onclick","a[href^=\"/video/\"]","adtimaConfig"];
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
})("eb67c4fa-700a-4c20-bf4f-852ab9b7ca91");

void 0;
