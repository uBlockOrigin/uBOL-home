/*******************************************************************************

    uBlock Origin - a browser extension to block requests.
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

/* jshint esversion:11 */
/* global cloneInto */

'use strict';

// ruleset: annoyances-others

/******************************************************************************/

// Important!
// Isolate from global scope

// Start of local scope
(( ) => {

/******************************************************************************/

// Start of code to inject
const uBOL_abortOnPropertyRead = function() {

const scriptletGlobals = new Map(); // jshint ignore: line

const argsList = [["videoIds"],["Object.prototype.autoplay_position"],["Object.prototype.videoAdvertisingMode"],["disable_copy"],["getSelection"],["disableSelection"],["clipboard_addLink"],["addCopy"],["wccp_pro_iscontenteditable"],["drag_off"],["clear_body_at_all_for_extentions"],["UnGrabber"],["ready"],["sccopytext"],["contentprotector"],["wp_copy"],["disableselect"],["document.oncontextmenu"],["nocontext"],["clickIE4"],["copyToClipboard"],["disable_copy_ie"],["disable_hot_keys"],["mousedwn"],["stopPrntScr"],["addMultiEventListener"],["addLink"],["mousehandler"]];

const hostnamesMap = new Map([["marriedgames.com.br",0],["media.eagleplatform.com",1],["dailymail.co.uk",2],["pabrikarang.com",3],["novatoscans.top",3],["senpaiediciones.com",3],["truelovejapan.com",3],["neo-blood.co.jp",3],["machow2.com",3],["rawneix.in",3],["mangacrab.com",3],["metalnaveia66.com",3],["bollywoodhindi.in",3],["kdramasurdu.net",3],["theturtleislandnews.com",3],["audiotools.in",3],["audiobookcup.com",3],["lapandilladelarejilla.es",3],["7misr4day.com",3],["michaelemad.com",3],["lazytranslations.com",3],["wartaterkini.news",3],["foxaholic.com",3],["koreanaddict.net",3],["jstranslations1.com",3],["baltasar5010purohentai.com",3],["clockks.com",3],["iptv4best.com",3],["reinodekovel.com",3],["elektrikmen.com",3],["world4.eu",3],["activationkeys.co",3],["samuraiscan.com",3],["digitalsynopsis.com",[3,20]],["easyayurveda.com",[3,8,18,22]],["tunovelaligera.com",[3,21,22]],["fakazaduo.com",4],["sports-g.com",4],["chungnamilbo.co.kr",4],["jejusori.net",4],["incheonilbo.com",4],["ggilbo.com",4],["newsnjoy.or.kr",4],["mediaus.co.kr",4],["lec.co.kr",4],["spotvnews.co.kr",4],["ibric.org",4],["footballist.co.kr",4],["hankooki.com",4],["gametoc.hankyung.com",4],["digitaltoday.co.kr",4],["globale.co.kr",4],["veritas-a.com",4],["shinailbo.co.kr",4],["ksilbo.co.kr",4],["health.chosun.com",4],["gukjenews.com",4],["seoulfn.com",4],["labortoday.co.kr",4],["aitimes.kr",4],["salgoonews.com",4],["postshare.co.kr",4],["rbc.ru",4],["epnc.co.kr",4],["wolyo.co.kr",4],["hinfomax.co.kr",4],["outdoornews.co.kr",4],["anekdoty.ru",4],["championat.com",4],["bloombergquint.com",4],["bigcinema-online.net",4],["bigcinema-tv.club",4],["gidonline-kino.club",4],["kinogo-2017.com",4],["kinogo-720.club",4],["kinogoonline.club",4],["season-var.net",4],["topcinema.tv",4],["kino-kingdom.com",4],["hd-kinogo.co",4],["skidrowreloaded.com",[5,19]],["allaboutshaving.kr",5],["allturkserials.com",5],["victorytale.com",5],["osomatsusan.hatenablog.com",5],["iembra2or.com",[5,18]],["battle-one.com",[5,17]],["terbit21.online",5],["wizardsubs.com",[5,18]],["audio-sound-premium.com",5],["sysnettechsolutions.com",5],["mustafabukulmez.com",[5,19]],["ifdreamscametrue.com",5],["e-marineeducation.com",5],["waktusehat.xyz",[5,23]],["viralogic.xyz",[5,23]],["anisubindo.video",5],["portalwrc.pl",5],["lyrsense.com",6],["braziljournal.com",7],["humoruniv.com",9],["mangarose.com",[10,18]],["nullpress.net",11],["plantaomaringa.com",12],["blisseyhusband.in",[13,14]],["nubng.com",14],["blitzrechner.de",15],["theasianparent.com",16],["tutoganga.blogspot.com",16],["texte.work",16],["procrackerz.org",18],["davidbaptistechirot.blogspot.com",19],["clujust.ro",22],["secondlifetranslations.com",22],["kusonime.com",23],["exlyrics.com",24],["moviesrush.one",24],["skidrowcodex.net",24],["ahstudios.net",25],["crunchyscan.fr",25],["picallow.com",25],["thecustomrom.com",25],["muharebetarihi.com",25],["psycabi.net",26],["hatauzmani.com",27],["kurosave.com",27]]);

const entitiesMap = new Map([]);

const exceptionsMap = new Map([]);

/******************************************************************************/

function abortOnPropertyRead(
    chain = ''
) {
    if ( typeof chain !== 'string' ) { return; }
    if ( chain === '' ) { return; }
    const exceptionToken = getExceptionToken();
    const abort = function() {
        throw new ReferenceError(exceptionToken);
    };
    const makeProxy = function(owner, chain) {
        const pos = chain.indexOf('.');
        if ( pos === -1 ) {
            const desc = Object.getOwnPropertyDescriptor(owner, chain);
            if ( !desc || desc.get !== abort ) {
                Object.defineProperty(owner, chain, {
                    get: abort,
                    set: function(){}
                });
            }
            return;
        }
        const prop = chain.slice(0, pos);
        let v = owner[prop];
        chain = chain.slice(pos + 1);
        if ( v ) {
            makeProxy(v, chain);
            return;
        }
        const desc = Object.getOwnPropertyDescriptor(owner, prop);
        if ( desc && desc.set !== undefined ) { return; }
        Object.defineProperty(owner, prop, {
            get: function() { return v; },
            set: function(a) {
                v = a;
                if ( a instanceof Object ) {
                    makeProxy(a, chain);
                }
            }
        });
    };
    const owner = window;
    makeProxy(owner, chain);
}

function getExceptionToken() {
    const token =
        String.fromCharCode(Date.now() % 26 + 97) +
        Math.floor(Math.random() * 982451653 + 982451653).toString(36);
    const oe = self.onerror;
    self.onerror = function(msg, ...args) {
        if ( typeof msg === 'string' && msg.includes(token) ) { return true; }
        if ( oe instanceof Function ) {
            return oe.call(this, msg, ...args);
        }
    }.bind();
    return token;
}

/******************************************************************************/

const hnParts = [];
try { hnParts.push(...document.location.hostname.split('.')); }
catch(ex) { }
const hnpartslen = hnParts.length;
if ( hnpartslen === 0 ) { return; }

const todoIndices = new Set();
const tonotdoIndices = [];

// Exceptions
if ( exceptionsMap.size !== 0 ) {
    for ( let i = 0; i < hnpartslen; i++ ) {
        const hn = hnParts.slice(i).join('.');
        const excepted = exceptionsMap.get(hn);
        if ( excepted ) { tonotdoIndices.push(...excepted); }
    }
    exceptionsMap.clear();
}

// Hostname-based
if ( hostnamesMap.size !== 0 ) {
    const collectArgIndices = hn => {
        let argsIndices = hostnamesMap.get(hn);
        if ( argsIndices === undefined ) { return; }
        if ( typeof argsIndices === 'number' ) { argsIndices = [ argsIndices ]; }
        for ( const argsIndex of argsIndices ) {
            if ( tonotdoIndices.includes(argsIndex) ) { continue; }
            todoIndices.add(argsIndex);
        }
    };
    for ( let i = 0; i < hnpartslen; i++ ) {
        const hn = hnParts.slice(i).join('.');
        collectArgIndices(hn);
    }
    collectArgIndices('*');
    hostnamesMap.clear();
}

// Entity-based
if ( entitiesMap.size !== 0 ) {
    const n = hnpartslen - 1;
    for ( let i = 0; i < n; i++ ) {
        for ( let j = n; j > i; j-- ) {
            const en = hnParts.slice(i,j).join('.');
            let argsIndices = entitiesMap.get(en);
            if ( argsIndices === undefined ) { continue; }
            if ( typeof argsIndices === 'number' ) { argsIndices = [ argsIndices ]; }
            for ( const argsIndex of argsIndices ) {
                if ( tonotdoIndices.includes(argsIndex) ) { continue; }
                todoIndices.add(argsIndex);
            }
        }
    }
    entitiesMap.clear();
}

// Apply scriplets
for ( const i of todoIndices ) {
    try { abortOnPropertyRead(...argsList[i]); }
    catch(ex) {}
}
argsList.length = 0;

/******************************************************************************/

};
// End of code to inject

/******************************************************************************/

// Inject code

// https://bugzilla.mozilla.org/show_bug.cgi?id=1736575
//   `MAIN` world not yet supported in Firefox, so we inject the code into
//   'MAIN' ourself when enviroment in Firefox.

// Not Firefox
if ( typeof wrappedJSObject !== 'object' ) {
    return uBOL_abortOnPropertyRead();
}

// Firefox
{
    const page = self.wrappedJSObject;
    let script, url;
    try {
        page.uBOL_abortOnPropertyRead = cloneInto([
            [ '(', uBOL_abortOnPropertyRead.toString(), ')();' ],
            { type: 'text/javascript; charset=utf-8' },
        ], self);
        const blob = new page.Blob(...page.uBOL_abortOnPropertyRead);
        url = page.URL.createObjectURL(blob);
        const doc = page.document;
        script = doc.createElement('script');
        script.async = false;
        script.src = url;
        (doc.head || doc.documentElement || doc).append(script);
    } catch (ex) {
        console.error(ex);
    }
    if ( url ) {
        if ( script ) { script.remove(); }
        page.URL.revokeObjectURL(url);
    }
    delete page.uBOL_abortOnPropertyRead;
}

/******************************************************************************/

// End of local scope
})();

/******************************************************************************/

void 0;
