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

// ruleset: annoyances-others

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
    const scriptletHostnames = /* 101 */ ["x.com","wiz.io","abc.com","ajc.com","10tv.com","4399.com","abc7.com","cbs8.com","kark.com","khou.com","ksdk.com","ktla.com","ktsm.com","temu.com","wavy.com","wbir.com","wcnc.com","wfaa.com","wgrz.com","wkyc.com","wltx.com","wnep.com","wqad.com","wsvn.com","wthr.com","wtol.com","wtsp.com","9news.com","abc10.com","abc11.com","abc13.com","abc15.com","abc30.com","fox61.com","kens5.com","king5.com","nbc4i.com","sushi.ski","wusa9.com","wwltv.com","12news.com","abc7ny.com","clarin.com","dhgate.com","kare11.com","nbcdfw.com","news10.com","whas11.com","wzzm13.com","zippia.com","11alive.com","alibaba.com","fox2now.com","thehill.com","abc7news.com","banistmo.com","buttersc.one","mivatter.com","mk.yopo.work","nijimiss.moe","theverge.com","13newsnow.com","aliexpress.us","gmarket.co.kr","m.youtube.com","nbcboston.com","wfmynews2.com","aliexpress.com","nbcbayarea.com","nbcchicago.com","nbcnewyork.com","oekakiskey.com","tekinvestor.no","5newsonline.com","abc7chicago.com","gp.tsukimi.club","misskey.systems","msk.kitazawa.me","myarklamiss.com","mytwintiers.com","nbcsandiego.com","nwahomepage.com","telemundopr.com","tradingview.com","voskey.icalo.net","finance.yahoo.com","music.youtube.com","nbclosangeles.com","firstcoastnews.com","nbcconnecticut.com","analyticsvidhya.com","gadgetizedpanda.com","nbcphiladelphia.com","newscentermaine.com","misskey.gamelore.fun","novelskey.tarbin.net","flightconnections.com","winnipegfreepress.com","invillage-outvillage.com","side.misskey.productions","timesofindia.indiatimes.com"];
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
        const arglistRefs = /* 101 */ ["12","11","10","11","11","6","10","11","10","11","11","10","10","12","10","11","11","11","11","11","11","11","11","11","11","11","11","10,11","11","10","10","11","10","11","11","11","10","17","11","11","11","10","1","12","11","10","10","11","11","2","10,11","12","11","10","10","13","17","17","17","17","10","11","12","7,8","9","10","11","12","10","10","10","17","5","11","10","17","17","17","10","10","10","10","10","4","17","10","14","10","11","10","16","15","10","11","17","17","3","11","17","17","11"];
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
    const arglists = /* 18 */ ["","14,0","24,1","14,2","14,3","14,4","19,5","11,6,7","11,8,7","7,9,10","22,11","22,12","22,13","17,14","7,15","14,16","14,17","7,18"];
    const args = /* 19 */ ["_waitingAuth0Counter","/onGatedSignupPopupTrigger|zippia-popup/","premiumShown","window.loginStateChange.subscribe","custom-modal-create-account-link","defaultbackgroundimg","document.oncontextmenu","noopFunc","document.onmousedown","overlay.bottomSheetOverlayRenderer","overlay.bottomSheetOverlayRenderer.displayImmediately","scroll","/^(mouseout|mouseleave)$/","mouseleave","oncontextmenu|onselectstart|ondragstart|oncopy|oncut|onpaste|onbeforecopy","playerResponse.messages.[].youThereRenderer messages.[].youThereRenderer","isOpen","loginModal","ads.[].imageUrl"];
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
