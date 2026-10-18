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

// ruleset: easyprivacy

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
    const scriptletHostnames = /* 131 */ ["al.com","nj.com","cbr.com","abema.tv","usaa.com","coomer.st","fedex.com","kemono.cr","mlive.com","pcwelt.de","predic.ro","nordot.app","nypost.com","realgm.com","tvline.com","artnews.com","awkward.com","blogher.com","cattime.com","cbsnews.com","decider.com","dogtime.com","hotcars.com","kion546.com","pagesix.com","samchui.com","sherdog.com","visible.com","artforum.com","baeldung.com","collider.com","crafty.house","faithhub.net","gamerant.com","gulflive.com","helloflo.com","madewell.com","movieweb.com","observer.com","pennlive.com","qtoptens.com","sheknows.com","sidereel.com","thegamer.com","topspeed.com","247sports.com","abc17news.com","bethcakes.com","briefeguru.de","cbssports.com","fsm-media.com","howtogeek.com","indiewire.com","makeuseof.com","melangery.com","modernmom.com","momtastic.com","nsjonline.com","puckermom.com","pwinsider.com","spacenews.com","thethings.com","timesnews.net","awkwardmom.com","cheatsheet.com","comingsoon.net","dailyvoice.com","femestella.com","localnews8.com","robbreport.com","sandrarose.com","screenrant.com","thenerdyme.com","bluegraygal.com","freeconvert.com","givemesport.com","dualshockers.com","footwearnews.com","jasminemaria.com","lizzieinlace.com","lonestarlive.com","madeeveryday.com","mardomreport.net","mostlymorgan.com","oakvillenews.org","simpleflying.com","carmagazine.co.uk","chaptercheats.com","dustyoldthing.com","funtasticlife.com","fwmadebycarli.com","lettyskitchen.com","motherwellmag.com","musicfeeds.com.au","superherohype.com","tablelifeblog.com","thecelticblog.com","toyotaklub.org.pl","gfinityesports.com","homeglowdesign.com","insider-gaming.com","lifeinleggings.com","liveandletsfly.com","nationalreview.com","pinkonthecheek.com","ssnewstelegram.com","thefashionspot.com","didyouknowfacts.com","honeygirlsworld.com","milestomemories.com","royalmailchat.co.uk","sloughexpress.co.uk","bailiwickexpress.com","becomingpeculiar.com","insurancejournal.com","lehighvalleylive.com","spotofteadesigns.com","thebeautysection.com","barnsleychronicle.com","competentedigitale.ro","travelingformiles.com","commercialobserver.com","official.coomer.com.co","nothingbutnewcastle.com","thecurvyfashionista.com","stacysrandomthoughts.com","muddybootsanddiamonds.com","sportsgamblingpodcast.com","thenonconsumeradvocate.com","maidenhead-advertiser.co.uk","frogsandsnailsandpuppydogtail.com"];
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
        const arglistRefs = /* 131 */ ["5","5","5","8","3","9","7","9","5","6","5","5","4","5","5","5","5","5","5","4","5","5","5","5","4,5","5","5","2","5","6","5","5","5","5","5","5","1","5","5","4,5","5","5","5","5","5","4","5","5","5","4","5","5","4","5","5","5","5","5","5","6","5","5","5","5","6","5","5","5","5","5","5","5","5","5","5","5","5","5","5","5","5","5","5","5","5","5","5","5","5","5","5","5","5","5","5","5","5","5","5","5","5","5","5","5","5","5","5","5","5","5","5","5","5","5","5","5","5","5","5","5","5","5","9","5","5","5","5","5","5","5","5"];
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
    const arglists = /* 10 */ ["","9,0","5,1,2","8,3,4,5,6,4","1,7,8","1,7,9","1,7,10","5,11,12","1,7,13","5,14,12"];
    const args = /* 15 */ ["dns_cookie","browser-ids","$remove$","GPC","1","","reload","script","\"data-adm-url\"","\"v4ac1eiZr0\"","admiral","fdx_enable_new_detail_page","true","NREUM","plausible_ignore"];
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
