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

// ruleset: adguard-mobile

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
    const scriptletHostnames = /* 91 */ ["mdpr.jp","hanime.tv","m.nuvid.*","seexh.com","xhbig.com","xhvid.com","fullxh.com","lepoint.fr","m.7days.ru","m.hd21.com","megaxh.com","nan-net.jp","openxh.com","tupaki.com","xhopen.com","xhspot.com","xhtree.com","m.viptube.*","mumsnet.com","nan-net.com","openxh1.com","pornhub.com","xhamster3.*","xhmoon5.com","xhtotal.com","xhwide1.com","xhwide2.com","xhwide5.com","interxh.site","kayak.com.tr","valuexh.life","www.ixbt.com","xhaccess.com","xhadult2.com","xhadult3.com","xhamster.com","xhamster.one","xhamster13.*","xhamster16.*","xhamster17.*","xhamster18.*","xhdate.world","aawweb.beauty","colourxh.site","m.proporn.com","slovoidilo.ua","stripchat.com","tr.usbxh.life","xhamster.desi","xhamster2.com","xhamster3.com","xhamster7.com","xhamster8.com","xhamster9.com","xhbranch5.com","xhchannel.com","xhlease.world","xhplanet2.com","galleryxh.site","liquipedia.net","m.dcinside.com","quotidiano.net","xhamster1.desi","xhamster10.com","xhamster12.com","xhamster14.com","xhamster15.com","xhamster19.com","xhamster2.desi","xhamster22.com","xhamster27.com","xhamster4.desi","xhamster40.com","xhamster5.desi","xhofficial.com","xhwebsite2.com","accuweather.com","fitnesslove.net","xhamster18.desi","xhamster19.desi","xhamster20.desi","xhamster42.desi","xhamster43.desi","xhamster44.desi","xhamster46.desi","xhamsterporno.mx","m.economictimes.com","upload.dcinside.com","watch.impress.co.jp","thestudentroom.co.uk","forum.donanimhaber.com"];
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
        const arglistRefs = /* 91 */ ["4,5","8","17","26","26","26","26","15","7","17","26","6","26","9","26","26","26","24","16","6","26","2,13","26","26","26","26","26","26","26","22","26","20","26","26","26","26","26","26","26","26","26","26","26","26","11,12","25","26","26","26","26","26","26","26","26","26","26","26","26","26","18","1","23","26","26","26","26","26","26","26","26","26","26","26","26","26","26","27","21","26","26","26","26","26","26","26","26","19","1","3","14","10"];
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
    const arglists = /* 28 */ ["","8,0,1,2,3,4","8,5,4","0,6,7,8","3,9,10,11","15,12,4","1,6,13","13,14,15","8,16,4","1,6,17","15,18,19","8,20,4","8,21,4","9,5","13,22,23","13,24,25","13,26,27","8,28,4","13,29,30","8,31,4","13,32,33","15,34,19","13,35,36","5,37,38","8,39,40","13,32,30","20,41,38","13,42,43"];
    const args = /* 44 */ ["_ga","OK","","reload","1","views","script","/^ipc\\.loader\\.queue\\.jquery(\\.push\\(function\\(\\)\\{\\s*ipc\\.loader\\.script\\(.+\\/ipc\\.watch\\.js.+)/","ipc.loader.queue.ready$1","#gn-rwd-target-hidden","class","rewareded","gnrwdfreq","adblock","banners-brand","#page_content","in_m4","roadblocker","pageCount","$remove$","playcnt","no_postitial_content","fixed_ad","#header.fixed_ad","hasStickyHead","body.hasStickyHead","pt-[100px]","#main-container","no_postitial_video","mobile-sticky-ad-is-active","body","inter","branding","body[id=\"pagebody\"]","imrcinstfqpv","i4It-cmp2-toaster-visible",".i4It","pwa_show","true","adv_show","3","pShowMob","has-adhesion",".header-placeholder.has-adhesion"];
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
