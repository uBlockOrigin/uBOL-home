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

// ruleset: fin-0

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
    const scriptletHostnames = /* 12 */ ["mtv.fi","dawn.fi","high.fi","telsu.fi","findit.fi","download.fi","s-kaupat.fi","afterdawn.com","mtvuutiset.fi","happypancake.fi","muropaketti.com","keskustelu.suomi24.fi"];
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
        const arglistRefs = /* 12 */ ["10,11,12","1","1","6,7,8,9","2","1","5","1","10,11,12","3","1","4"];
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
    const arglists = /* 13 */ ["","14,0,1","12,2","19,3","11,4,5","7,6","22,7,8,9,10","23,11,12","35,13","14,14,15","2,16,8,17,18","46,19,8,20","46,21,8,22"];
    const args = /* 23 */ ["f.parentNode.removeChild(f)","100","testPrebid","Object.prototype.adUnits","Object.prototype.useAds","false","props.pageProps.contentfulState.frontPage.sections.[].fields.hasCitrusAdSlot props.pageProps.contentfulState.frontPage.sections.[].fields.isCitrusAdGrid","transitionend","","elements","div[style*=\"-9999px\"][style*=\"outline-offset\"]","Animation.prototype.finished","/telsu\\.fi\\/js\\/[a-z\\d]+\\.js\\?v=\\d+/","/const\\s+([$\\w]+)=[$\\w]+\\(\\)-[$\\w]+;if\\(\\1>=[\\s\\S]*?\\x2C\\1>=[\\s\\S]*?\\)\\{[$\\w]+\\(\\);return;\\}window\\[[^\\]]+\\]\\([$\\w]+\\);/","/const\\s+([$\\w]+)=\\[(?:[$\\w]+\\x2C){3}[$\\w]+\\];for\\(let\\s+([$\\w]+)=[^;]+;\\2<\\1\\[[^\\]]+\\];\\2\\+\\+\\)if\\(!\\1\\[\\2\\]\\)return;[$\\w]+\\(\\);/","2600-3399","bumpers playbackItem.isStitched","propsToMatch","a2d.tv/play/","Ad","/fwmrm.net\\/ad\\/g/","MediaFile","fi-mtv3.videoplaza.tv/proxy/distributor"];
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
