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

// ruleset: pol-0

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
    const scriptletHostnames = /* 84 */ ["wp.pl","v10.pl","gala.pl","iitv.pl","open.fm","money.pl","otube.pl","tv.wp.pl","cda-tv.pl","garnek.pl","gry.wp.pl","purepc.pl","raptu.com","www.wp.pl","bankier.pl","ebd.cda.pl","filiser.tv","film.wp.pl","filmweb.pl","filmy69.pl","kobieta.pl","komixxy.pl","otomoto.pl","pcworld.pl","pudelek.pl","tech.wp.pl","anyfiles.pl","autokult.pl","dziennik.pl","ekino-tv.pl","facet.wp.pl","pilot.wp.pl","playpuls.pl","streamin.to","wideo.wp.pl","animezone.pl","eurogamer.pl","kafeteria.pl","naekranie.pl","parenting.pl","poczta.wp.pl","pogoda.wp.pl","polygamia.pl","profil.wp.pl","abczdrowie.pl","czasdzieci.pl","echirurgia.pl","fitness.wp.pl","fotoblogia.pl","gry-online.pl","gwiazdy.wp.pl","jegostrona.pl","kobieta.wp.pl","medycyna24.pl","menshealth.pl","tubagliwic.pl","twojeip.wp.pl","autocentrum.pl","calcoolator.pl","hdtvpolska.com","horoskop.wp.pl","joemonster.org","teleshow.wp.pl","transfery.info","wawalove.wp.pl","www.interia.pl","demotywatory.pl","gadzetomania.pl","komorkomania.pl","swiatfilmow.com","tubawyszkowa.pl","womenshealth.pl","dobreprogramy.pl","facetemjestem.pl","filmowakraina.tv","pl.vpnmentor.com","runners-world.pl","wiadomosci.wp.pl","www.elektroda.pl","opensubtitles.org","motocykl-online.pl","sportowefakty.wp.pl","www.dobreprogramy.pl","auto-motor-i-sport.pl"];
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
        const arglistRefs = /* 84 */ ["8,20","3","3","25","14,18,19,-15","13,14,15,21","53","21","52","3","21","33,47","25","10,11,12,21","29","1","30","21","6,7","51","3","3","54","39","18,19","21","32","21","3","43","9","-9","2","31","21","34","36","18,19","26,27,28","21","-9","21","18,19","17","21,-24","45","21","21","21","3","9,21","3","21","21","50","48","21","3","35","46","21","3","9,21","3","21","40,41","3","21","21","44","48","50","-25","3","49","38","50","21","42","37","50","-9,16,21,22","4,5","50"];
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
    const arglists = /* 55 */ ["","10","31,0","31,1","17,2,3,4","14,5,6","12,7,8","12,9,10","19,11","31,12","19,13","11,14,15","23,16,17","11,18,19","11,20,19","11,21,19","11,22,15","11,23,15","14,24,25","22,26,27","14,28","23,29,30","19,31","14,32,33","19,34","30","24,35,36,37,38,39","14,40,41","12,42,43","31,44","31,45","36,46","19,47","14,48","19,49","14,50","31,51","11,52,53","14,54","19,55","17,56,57,4","1,58,59,60","11,61,15","1","1,62,41,60","12,63","12,64,65","17,2,66","12,42,67","26","26,68","12,69,70","1,71","12,72","10,73"];
    const args = /* 74 */ ["ads","ub_ct_load","style","#phContent_avastBadge","stay","PrebidDamOpen","800","decodeURIComponent","newAdblockBoardDisplayed","addEventListener","/faBar[\\s\\S]*?insertAdjacentElement/","WP.inline","iaqExt","__headpayload","WP.gaf.loadBunch","noopFunc","WP","r https","Object.prototype.rekids","undefined","Object.prototype.gafSlot","Object.prototype.advViewability","Object.prototype.loadBunch","Object.prototype.loadAndRunBunch","HubAPI","3000","message","t.origin===k","/getComputedStyle[\\s\\S]*?style\\.display=\"none\"[\\s\\S]*?styleBlocked[\\s\\S]*?detected/","WP.prebid","onLoad","Object.prototype.bodyCode","visibility","0","wp_consent_color","function neTick(){neTickCounter++;if(neTickCounter<=neTickCountLimit){neTickAjax=$.ajax({type:\"POST\"","url:adminAjaxUrl+\"?action=ne_tick\"","dataType:\"json\"","success:function(data){neTickResponseAction(data)}})}}","10000","function check(){console.log(\"checked\");if($(\".adform\").children().length>3){console.log(\"its more\");$(\".adform\").children(\".adform-banner\").show();clearTimeout(check)}}","1000","$","/loadData|halfpage|welcome|screening|placement|adtitle/","detectAB","_yhbog","RTCPeerConnection","launchOpenWindow","ubfix()","o6c6e","no-ads-info","yafaIt","displayed","false","bioEp.showPopup","uabpd3","scrolling","iframe#sg-iframe[scrolling=\"no\"]","#iwa_source=timeout","15000","0.02","loadElement","function","billboard750","jQuery","#sdWelcomeScreen","[href^=\"https://www.purepc.pl/red1r.php\"]","#AdPopup","redirectId","document.querySelectorAll","popMagic","TheLink","Math.random","_blank"];
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
