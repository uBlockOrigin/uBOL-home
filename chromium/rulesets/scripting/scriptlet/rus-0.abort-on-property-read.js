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

// ruleset: rus-0

/******************************************************************************/

// Important!
// Isolate from global scope

// Start of local scope
(( ) => {

/******************************************************************************/

// Start of code to inject
const uBOL_abortOnPropertyRead = function() {

const scriptletGlobals = new Map(); // jshint ignore: line

const argsList = [["AdbBanner"],["CTRManager.host3"],["ClickUndercookie"],["Date.prototype.toUTCString"],["Groups.showDisclaimer"],["Light.Popup"],["Object.prototype.AdfoxXhrRequestPrepared"],["Object.prototype.Metrika"],["Object.prototype.YA_TURBO_PAGES"],["Object.prototype._getBanner"],["Object.prototype._isAutostartQueueSet"],["Object.prototype.bannerOptions"],["Object.prototype.brandingBlock"],["Object.prototype.direct"],["Object.prototype.fakeDetect"],["Object.prototype.getAdUsageStorage"],["Object.prototype.initOnPlay"],["Object.prototype.isApplySticky"],["Object.prototype.loadBanner"],["Object.prototype.render"],["Object.prototype.scriptsViaXhr"],["Object.prototype.yaContextCb"],["PUM.getPopup"],["PageBottomBanners"],["SIN.AdsLoader"],["TotemToolsObject"],["Unauthorized2"],["WebSocket"],["XMLHttpRequest"],["Ya"],["__vasActiveTestIds"],["a_urls"],["aab"],["abl"],["adblock_availability_check"],["adcashMacros"],["admiral"],["ads"],["advFirstClickOpenNewTab"],["advanced_ads_ready"],["anOptions"],["antiadblockCallback"],["app_vars.force_disable_adblock"],["atob"],["bannersBillboard"],["blocked_action"],["brblob"],["cardinals"],["clickNS4"],["createAds"],["creepyVideo"],["disable_copy"],["disable_hot_keys"],["document.addEventListener"],["document.body.oncopy"],["document.getElementById","mdl_adb"],["document.oncontextmenu"],["document.oncopy"],["document.ondragend"],["document.ondragstart"],["document.ondrop"],["document.onkeydown"],["document.onpaste"],["document.onselectstart"],["eaglePlayerPlugins.autoplay_position"],["echelon"],["flat_pm_arr"],["forTheFreeVideo.css"],["getSelection"],["get_ya_browser"],["goTolink"],["helpUsImproveSite"],["initsnow"],["kav_cn"],["lftrght"],["m205"],["mdpDeBlocker"],["move_string"],["myatu_bgm"],["nocontext"],["onload"],["open"],["preventSelection"],["setsnow"],["sparkle"],["stopPrntScr"],["t364_initPopup"],["target_script"],["td_ad_background_click_target"],["tingle"],["tnAdditionalParams"],["unSelect"],["updateDownloadLinks"],["utarget_script"],["video.preroll"],["vpb"],["web_script"],["weekCallbacks"],["window.alert"],["window.block"],["yaContextCb"],["zfgformats"],["bc_blocks"],["OK.hooks"],["globalAuthLoginPopupCounter"],["u_global_data"]];

const hostnamesMap = new Map([["htmlweb.ru",0],["fapreactor.com",1],["joyreactor.cc",1],["pornreactor.cc",1],["reactor.cc",1],["anifap.com",2],["anipoisk.org",2],["anitokyo.tv",2],["hcdn.online",2],["kinofilm.co",2],["relax-fm.ru",[3,30]],["rg.ru",[3,100]],["sm.news",[3,29,32,82]],["ura.news",[3,100]],["www.e1.ru",[3,12]],["vk.com",[4,23,26]],["vk.ru",[4,23,26]],["rutor.org",5],["drive2.ru",[6,21]],["liveinternet.ru",[7,8]],["yap.ru",7],["yaplakal.com",7],["lena-miro.ru",9],["levik.blog",9],["livejournal.com",9],["olegmakarenko.ru",9],["periskop.su",9],["shakko.ru",9],["shiro-kino.ru",9],["vadimrazumov.ru",9],["rbc.ru",[10,17,68]],["www.kinopoisk.ru",11],["gorodrabot.by",13],["gorodrabot.ru",13],["fishki.net",14],["reshuct.by",15],["reshuent.kz",15],["reshuolymp.ru",15],["sdamgia.ru",15],["gdespaces.com",16],["gdespaces.net",16],["google-cloud.services",16],["spac.me",16],["spac.run",16],["spac.wtf",16],["spac1.com",16],["spac1.info",16],["spac1.me",16],["spac1.net",16],["spac1.org",16],["spac1.ru",16],["spaces-blogs.com",16],["spaces.im",16],["spcs-files.xyz",16],["spcs.bio",16],["spcs.global",16],["spcs.life",16],["spcs.me",16],["spcs.network",16],["spcs.news",16],["spcs.pro",16],["spcs.pub",16],["spcs.reviews",16],["spcs.social",16],["strip2.in",16],["strip2.xxx",16],["usersporn.com",16],["e1.ru",18],["nova.rambler.ru",18],["pikabu.ru",18],["24smi.org",19],["gismeteo.by",20],["gismeteo.kz",20],["gismeteo.md",20],["gismeteo.ru",20],["razlozhi.ru",21],["f1comp.ru",22],["tagaev.com",22],["times.zt.ua",22],["sinoptik.ua",[24,95]],["porngames.su",25],["rintor.info",25],["rintor.net",25],["castle-tv.com",27],["100popugaev.ru",28],["coderlessons.com",28],["fixx.one",28],["its-kids.ru",28],["molitvy.guru",28],["nizhny.ru",28],["pro100hobbi.ru",28],["publy.ru",28],["samelectric.ru",28],["svadba.expert",28],["tehnobzor.ru",[28,76]],["vibir.ru",28],["3dnews.kz",29],["3dnews.ru",29],["avtovzglyad.ru",29],["baby.ru",29],["dni.ru",29],["mamba.ru",29],["sports.ru",[29,41]],["www.goha.ru",29],["forum.overclockers.ua",31],["bstudy.net",33],["ozlib.com",33],["studbooks.net",33],["studme.org",33],["studref.com",33],["studwood.net",33],["vuzlit.com",33],["xstud.org",33],["vgtimes.ru",34],["upload.ee",35],["footboom.com",[36,65]],["footboom.kz",[36,65]],["electric-house.ru",37],["stroi-help.ru",37],["freehat.cc",[38,81]],["agroreview.com",39],["amazinghis.ru",40],["moj-pes.ru",40],["shrlink.top",42],["friends.in.ua",[43,53]],["gidonline.eu",[43,87]],["vprognoze.ru",44],["medicina.ua",45],["anidub.vip",46],["anidubonline.com",46],["overclockers.ru",47],["zaruba.fun",48],["vesti.ua",49],["gazeta.ru",[50,64,70]],["kolizhanka.com.ua",[51,52,79]],["gra-prestoliv.in.ua",53],["simpsonsua.tv",53],["pravvest.ru",54],["dclans.ru",55],["animevost.org",56],["animevost.site",56],["animevost.top",56],["doefiratv.info",56],["payeer-gift.ru",56],["sinema.top",56],["smotret-anime-365.ru",56],["turkish-tv-series.ru",[56,61,68]],["ufchgu.ru",56],["vost.pw",56],["xn--b1aew.xn--p1ai",[56,57,58,59,60,62,63]],["my-expert.ru",59],["7ogorod.ru",66],["autonevod.ru",66],["shtrafsud.ru",66],["zazloo.ru",66],["kinozapas.co",67],["livesx.online",67],["xn--80aikhbrhr.xn--j1amh",67],["championat.com",68],["doramy.club",68],["sportrbc.ru",68],["musify.club",69],["dota2.ru",71],["elitesnooker.com",72],["artfile.me",73],["artfile.ru",73],["astrakhan.ru",73],["myjane.ru",73],["omskpress.ru",73],["tambovnet.org",73],["daz3d.ru",74],["studizba.com",75],["asteriatm.ru",76],["sudya-dredd.ru",[76,85]],["anime-chan.me",[77,84]],["city.ogo.ua",78],["it-actual.ru",80],["hlamer.ru",81],["lostpix.com",81],["oveg.ru",81],["potokcdn.com",81],["prostoporno.help",81],["saltday.ru",81],["uploadimagex.com",81],["wowskill.ru",81],["xittv.net",81],["tapochek.net",[83,96]],["bryansknovosti.ru",85],["novozybkov.su",85],["moremania.info",86],["kinogo.eu",87],["1informer.com",88],["fainaidea.com",88],["itech.co.ua",88],["mediasat.info",88],["root-nation.com",88],["fssp.gov.ru",89],["liveforums.ru",90],["onlineclass.space",91],["nsportal.ru",92],["animekun.ru",93],["doramakun.ru",93],["vestivrn.ru",94],["www.ukr.net",95],["4studio.com.ua",97],["cikavosti.com",97],["dialogs.org.ua",97],["fakty.ua",97],["gorodkiev.com.ua",97],["informator.ua",97],["kriminal.tv",97],["pingvin.pro",97],["technoportal.com.ua",97],["u-news.com.ua",97],["uanews.org.ua",97],["versii.if.ua",97],["volynpost.com",97],["bombardir.ru",98],["comp-service.kiev.ua",98],["softportal.com",99],["80-e.ru",100],["examenpdd.com",100],["animedia.tv",101],["animedub.ru",101],["vsetut.su",101],["ok.ru",[103,104]],["3dn.ru",105],["a-point.info",105],["addfiles.ru",105],["akkordam.ru",105],["all-for-kompa.ru",105],["asia-tv.su",105],["at.ua",105],["autosimgames.ru",105],["chernobyl-soul.com",105],["clan.su",105],["cliphq.ru",105],["coop-lands.ru",105],["db-energo.ru",105],["devdrivers.ru",105],["do.am",105],["dtva-it-rus.gq",105],["elegos.ru",105],["elektronika56.ru",105],["elektrosat.ru",105],["fon-ki.com",105],["for-gsm.ru",105],["free-dream.ru",105],["ftechedu.ru",105],["fukushima-news.ru",105],["gals.md",105],["gamesdendy.ru",105],["giginfo.ru",105],["gloria-cedric.ru",105],["goldformat.ru",105],["greenflash.su",105],["hero-empire.com",105],["igrul-ka.ru",105],["jetvis.ru",105],["krasnickij.ru",105],["krolmen.ru",105],["megaclips.net",105],["mod-rus.ru",105],["mow-portal.ru",105],["moy.su",105],["mp3songs.ru",105],["mp4android.ru",105],["musiklip.ru",105],["my1.ru",105],["narod.ru",105],["newgames.com.ua",105],["novospasskoe-city.ru",105],["obschestvo-9999.gq",105],["omsimclub.ru",105],["online-supernatural.ru",105],["onlinestargate.ru",105],["only-paper.ru",105],["others.name",105],["pidru4nik.com",105],["pkrc.ru",105],["play-force.ru",105],["pohoronnoe-byuro.com",105],["pokatushki-pmr.ru",105],["pro-zakupki.ru",105],["project-ss.ru",105],["psxworld.ru",105],["radiodom.org",105],["rocketdockfree.ru",105],["sdr-deluxe.com",105],["skidrowcrack.ru",105],["soft-game.net",105],["stalker-gsc.ru",105],["stalker-zone.info",105],["stalkermods.ru",105],["svadbatomsk.ru",105],["techmusic.ru",105],["tes-game.ru",105],["torfiles.ru",105],["torm-egan.ru",105],["torrent-file.top",105],["ucoz.club",105],["ucoz.com",105],["ucoz.net",105],["ucoz.org",105],["ucoz.ru",105],["ucoz.ua",105],["usite.pro",105],["vodopads.ru",105],["vsthouse.ru",105],["warcraftda.ru",105],["xakevsoft.ru",105],["xn--80aeshkkbdj.xn--p1ai",105],["yaminecraft.ru",105],["zona-stalkera.ru",105]]);

const entitiesMap = new Map([["porno365",102]]);

const exceptionsMap = new Map([["m.vk.com",[4,23,26]]]);

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
