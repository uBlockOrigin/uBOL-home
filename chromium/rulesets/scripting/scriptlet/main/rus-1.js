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

// ruleset: rus-1

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
    const scriptletHostnames = /* 70 */ ["ya.*","eda.*","wmj.*","ya.ru","4pda.*","dzen.*","ivi.ru","quto.*","auto.ru","dzen.ru","motor.*","anilib.*","lenta.ru","yandex.*","gazeta.ru","innal.top","letidor.*","meteum.ai","naylo.top","passion.*","rambler.*","rutr.life","shakko.ru","animelib.*","lenta.news","moslenta.*","naydex.net","tv.mail.ru","yandex.net","periskop.su","shedevrum.*","championat.*","game4you.top","gazeta.press","kino.mail.ru","mail.ukr.net","rustorka.com","rustorka.net","rustorka.top","rutracker.nl","sportmail.ru","sportsdzen.*","www.afisha.*","www.google.*","yastatic.net","id.rambler.ru","mail.yandex.*","otvet.mail.ru","rutracker.lib","rutracker.net","rutracker.org","shiro-kino.ru","sportsdzen.ru","vp.rambler.ru","mail.rambler.*","nova.rambler.*","pogoda.mail.ru","search.ukr.net","livejournal.com","music.youtube.*","quiz.rambler.ru","rustorkacom.lib","vadimrazumov.ru","www.kinopoisk.*","olegmakarenko.ru","games.s3.yandex.net","lenta.news.lenta.ru","horoscopes.rambler.*","widgets.kinopoisk.ru","frontend.vh.yandex.ru"];
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
        const arglistRefs = /* 70 */ ["23,26,27,28,29,30,31","13,14","13,14","32,33,34,35,36","37,38","15,22,23","10,11","13,14","21","32,33,34,35","13,14","12","13","23,26,27,28,29,30,31","13,14","2","13,14","26","2","13,14","13,14","7","8,9","12","13","13,14","15","4","-24,-27,-28,-30,-31,-32","8,9","19","13,14","2","13,14","4","6","2","2","2","7","4","22","13,14","1","15","-14,-15","24,25,-27,-30,-31","3","7","7","7","8,9","32,33,34,35","-14,-15","-14","18","4","5","8,9","17","-14,-15","2","8,9","20","8,9","-29","14","16","15","15"];
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
    const arglists = /* 39 */ ["","17,0,1,2","23,3,4","22,5,6","7,7","17,8,9,2","17,10,11,2","11,12,13","11,14,15","11,16,17","11,18,19","11,20,19","3,21,22,23,24","23,25,4","7,26","11,27,28","11,29,28","15,30","19,31","11,32,15","11,33,34","19,35","19,36","7,37","17,38,11,2","11,39,15","31,40","17,41,42","13,43","19,44","11,45,15","11,46,15","22,47,48","22,49,48,50","22,51,52","14,53","11,54,15","14,55,56","23,57,58"];
    const args = /* 59 */ ["jsaction","#islsp c-wiz a[href^=\"http\"][data-ved][target]","stay","document.head.appendChild","inlineScript","click","externalLink","is_vpn","data-cturl",".searchresults a","data-safe-proxy-url","a","BB.disableRefLinks","true","Object.prototype.Begun","undefined","Object.prototype.antiadblock","false","Object.prototype.canShowMoreAds","noopFunc","Object.prototype.hasAdv","meta.country","","propsToMatch","/api/anime","Object.prototype.getBaseFingerprint","Blocks","Object.prototype.hasPreroll","null","Object.prototype.needShowAlicePopup","/generate_204","Object.prototype.AdvManager","Object.prototype.isNonEmptyString","history.replaceState","trueFunc","Object.prototype.renderTrackingUrl","Object.prototype.setBlockId","direct rtb seatbid data.*.attributes.blockId","data-link-id","Object.prototype.DirectLine","__pcodeAllActiveTestIds","data-counter","#search-result > .serp-item a","yabs.yandex.ru/count/","__activeTestIds","Object.prototype.initPcode","Object.prototype.Rtb","/beforeunload|pagehide/","0x","DOMContentLoaded","document","beforeunload","defaultPrevented||this.setCookies","/BLOCKERS|NOT_BLOCKED/","Object.prototype.AdblockCookieMatchingType","removeAttr","setTimeout","document.referrer","https://4pda.to/"];
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
