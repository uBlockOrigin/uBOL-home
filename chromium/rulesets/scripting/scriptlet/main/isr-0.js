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

// ruleset: isr-0

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
    const scriptletHostnames = /* 59 */ ["inn.co.il","jmusic.me","n12.co.il","one.co.il","13tv.co.il","mako.co.il","yad2.co.il","ynet.co.il","sheee.co.il","tvbee.co.il","walla.co.il","13news.co.il","globes.co.il","hwzone.co.il","morfix.co.il","sport5.co.il","tech12.co.il","b.walla.co.il","e.walla.co.il","haaretz.co.il","isramedia.net","themarker.com","calcalist.co.il","mag.walla.co.il","vod.walla.co.il","www.walla.co.il","cars.walla.co.il","euro.walla.co.il","food.walla.co.il","home.walla.co.il","kids.walla.co.il","news.walla.co.il","nick.walla.co.il","tags.walla.co.il","tech.walla.co.il","viva.walla.co.il","6days.walla.co.il","buzzit.walla.co.il","celebs.walla.co.il","movies.walla.co.il","nadlan.walla.co.il","sports.walla.co.il","travel.walla.co.il","animals.walla.co.il","fashion.walla.co.il","finance.walla.co.il","healthy.walla.co.il","judaism.walla.co.il","mundial.walla.co.il","weather.walla.co.il","olympics.walla.co.il","tv-guide.walla.co.il","astrology.walla.co.il","elections.walla.co.il","foodsdictionary.co.il","usaelections.walla.co.il","www-globes-co-il.eu1.proxy.openathens.net","www-haaretz-co-il.eu1.proxy.openathens.net","www-themarker-com.eu1.proxy.openathens.net"];
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
        const arglistRefs = /* 59 */ ["5,6,12,13","17,18","5","5","5,8,9,10,11","5,6","5,6","5,6,7","5","5","2,3,4,5","5,8,9,10,11","6","5","16","5","5","1","1","5,14,15","5","5,14,15","5,6","1","1","1","1","1","1","1","1","1","1","1","1","1","1","1","1","1","1","1","1","1","1","1","1","1","1","1","1","1","1","1","5","1","19,20","5,14,15,21,22","5,14,15"];
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
    const arglists = /* 23 */ ["","19,0","19,1","32","14,2,3","15,4","31,5","14,6","15,7","15,8","1,9,10,11","1,12,13,11","14,14","10","22,15,16","11,17,18","12,19,20","19,21","14,22","11,23,24","11,25,26","22,27,16","12,28,29"];
    const args = /* 30 */ ["btoa","isMobileasokita","()","1500","adsbygoogle","upManager","offsetHeight","doubleclick","googlesyndication","taboola timeout","*","0.001","clearInterval(run)","5000","popup","","hblocked","showAds","true","document.createElement","admiral","mdp_deblocker","mdpDeBlocker","document.blocked_var","1","____ads_js_blocked","false","load","$","AdBlockUtil"];
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
