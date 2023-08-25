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
const uBOL_nanoSetTimeoutBooster = function() {

const scriptletGlobals = new Map(); // jshint ignore: line

const argsList = [["counter","","0.02"],["show()","*","0.001"],["DOWNLOAD","*","0.001"],["Download","*","0.001"],["div_form"],["value","*","0.001"],["e(t-1)","*","0.001"],["window.location.href","*","0.02"],["counter","*","0.02"],["download_loading","*","0.02"],["autoload-wait","*","0.02"],["content","*","0.02"],["/HideTimerID|clsname/","*","0.02"],["countdowntimer","*","0.02"],["updateClock","","0.02"],["seconds","*","0.02"],["myTimer","*","0.02"],["goLink(","3000"],["get-link","*","0.02"],["getlink","*","0.02"],["download","*","0.02"],["/Please wait|myTime--/","*","0.02"],["updateClock","*","0.02"],["/_0x|gotoo/","*","0.02"],["status.innerHTML","*","0.02"],["document[_0x","*","0.02"],["countDown","","0.02"],["#counter","","0.02"],["count","","0.02"],["#download-loading","*","0.02"],["Tick","","0.02"],["submit","5000","0.02"],["wpsafe","*","0.02"],["_0x","*","0.02"],["redirect","4000","0.02"],["tick","1000"],["grecaptcha","*","0.02"],["run()","","0.02"],["#proceed","*","0.02"],["timer","1000","0.02"],["/waiting|\\.classList\\.remove|gotoo/","*","0.02"],["seconds","","0.02"],["countdown()","","0.02"],["TheLink","","0.02"],["st2","","0.02"],["startTimer","*","0.02"],["goVideoJS","*","0.02"],["Please wait","*","0.02"],["showText","*","0.02"],["checkclick","*","0.02"],["getlink","*","0.001"],["/gotoo|pop-button|stickyadin/","*","0.02"],["#download_ad_addon","10000","0.02"],["$('.skip-btn').","*","0.02"],["download_file","","0.02"],["waitting_download","","0.02"],["CountBack","990","0.02"],["timeUpdater","","0.02"],["btn","3000","0.02"],["clsname","5000","0.02"],["#download","10000","0.02"],["#download","11000","0.02"],["/get-link","5000","0.02"],["fade","5000","0.02"],["timer_end","20000","0.02"],["disabled","","0.02"],["gotoo","22000","0.02"],["gotoo","17000","0.02"],["download link","","0.02"],["link","1100","0.02"],["tick","1000","0.02"],["countdown","1400","0.02"],["updateinfo","1000","0.02"],["count--","1000","0.02"],["window.location.href","10000","0.02"],["params.redirect","5000","0.02"],["timers","","0.02"],["timers","4000","0.02"],["doRedirect","3000","0.02"],["timer--","","0.02"],["timers","1500","0.02"],["var _0x","","0.02"],[".eg-manually-get","7000","0.02"],["downloadbtn","","0.02"],["link_button","","0.02"],["#get_btn","","0.02"],["counter","2000","0.02"],["adFreePopup","15000","0.02"],["go_url","15000","0.3"],["window.location.href=t,clearTimeout","10000"],["adpop-content-left","","0.02"],["#ad .timer","","0.02"],["setSeconds","","0.02"],["updateReloj","","0.02"],["countdown","","0.02"],["dlcntdwn","","0.02"],["tick()","","0.02"],["startCountdown","","0.02"],["contador","","0.02"],["/action-downloadFile?"],["#freebtn","","0.02"],["download()"]];

const hostnamesMap = new Map([["antiadtape.com",0],["tapewithadblock.org",0],["adblockstrtape.link",0],["adblockstrtech.link",0],["stape.fun",0],["strcloud.link",0],["moviessoul.com",0],["1fichier.com",1],["pling.com",3],["maqal360.com",4],["diudemy.com",4],["hotmediahub.com",5],["easymc.io",6],["iggtech.com",7],["ipamod.com",7],["apkmody.fun",9],["apkmody.io",9],["vsthemes.org",10],["comohoy.com",11],["indilinks.xyz",12],["blogtechh.com",13],["coins-town.com",14],["upapk.io",15],["bakenor.com",16],["prod.danawa.com",17],["blogmado.com",18],["vavada5com.com",19],["financerites.in",19],["financerites.com",19],["apkmaza.co",20],["bakeput.com",21],["bakemain.com",21],["bakeleft.com",21],["link-descarga.site",22],["kinemaster.cc",23],["zertalious.xyz",24],["hashhackers.com",25],["katdrive.net",25],["newsongs.co.in",25],["course-downloader.com",26],["123lnk.xyz",26],["universalfreecourse.com",26],["freenulledworld.com",26],["downloadfreecourse.com",26],["aapks.com",26],["pvpcorme.com",26],["dosya.co",26],["ishort.xyz",26],["fmoviesdl.com",27],["solotakus-tv.ml",27],["uncensored-hentai.com",27],["curimovie.com",27],["malzero.xyz",28],["modyolo.com",29],["uploadmaza.com",30],["uptomega.me",30],["dlfiles.online",30],["hubfiles.ws",30],["romsget.io",31],["romsgames.net",31],["mcrypto.club",32],["spantechie.com",33],["imgadult.com",34],["imgdrive.net",34],["imgtaxi.com",34],["imgwallet.com",34],["uploadrar.com",35],["steampiay.cc",36],["pouvideo.cc",36],["pomvideo.cc",36],["top1iq.com",37],["downfile.site",38],["memangbau.com",38],["trangchu.news",38],["techacode.com",38],["azmath.info",38],["freetp.org",39],["online-fix.me",39],["technoashwath.com",40],["uploadflix.org",41],["uploadbaz.me",41],["downloadr.in",42],["freetraderdownload.com.br",42],["appofmirror.com",42],["egyshare.cc",43],["samfirms.com",45],["4shared.com",46],["themehits.com",48],["atlai.club",49],["yogablogfit.com",50],["vocalley.com",50],["howifx.com",50],["enit.in",50],["skincarie.com",50],["imperialstudy.com",50],["techymedies.com",51],["noltrt.com",52],["getthot.com",53],["videezy.com",54],["fdocuments.in",55],["tgsup.group",56],["kutub3lpdf.com",56],["movie4k.dev",57],["itscybertech.com",58],["newzflix.xyz",59],["moviesfi.net",[60,61]],["shareappscrack.com",62],["policiesforyou.com",63],["gamemodding.com",64],["mixdrop.sx",65],["moddedguru.com",[66,67]],["upvideo.to",68],["techoow.com",69],["sama-share.com",70],["zeefiles.download",70],["apkdone.com",71],["jptorrent.org",72],["pinsystem.co.uk",73],["gamefront.com",74],["render-state.to",75],["respuestadetarea.com",76],["asistente-de-estudio.com",76],["edurespuestas.com",77],["c.newsnow.co.uk",78],["pentafaucet.com",79],["getitall.top",79],["ihomeworkhelper.com",80],["hdfull.lv",81],["emulatorgames.net",82],["desiupload.co",83],["bdupload.asia",83],["indishare.org",83],["onlinefreecourse.net",83],["uploadking.net",83],["w4files.ws",84],["easylinks.in",85],["novafusion.pl",86],["surfline.com",87],["catcut.net",88],["apkshki.com",89],["pngitem.com",90],["world-sms.org",91],["pulsemens.com",92],["verteleseriesonline.com",93],["hentaisd.tv",93],["memoriadatv.com",94],["filehorse.com",95],["filerio.in",96],["worldofmods.com",96],["subdowns.com",97],["tudogamesbr.com",98],["videouroki.net",99],["katfile.com",100],["coolrom.com.au",101],["freeroms.com",101]]);

const entitiesMap = new Map([["shavetape",0],["adblockstreamtape",0],["streamtape",0],["mixdroop",2],["flixhub",8],["premiumebooks",44],["mixdrop",47]]);

const exceptionsMap = new Map([]);

/******************************************************************************/

function nanoSetTimeoutBooster(
    needleArg = '',
    delayArg = '',
    boostArg = ''
) {
    if ( typeof needleArg !== 'string' ) { return; }
    const safe = safeSelf();
    const reNeedle = safe.patternToRegex(needleArg);
    let delay = delayArg !== '*' ? parseInt(delayArg, 10) : -1;
    if ( isNaN(delay) || isFinite(delay) === false ) { delay = 1000; }
    let boost = parseFloat(boostArg);
    boost = isNaN(boost) === false && isFinite(boost)
        ? Math.min(Math.max(boost, 0.02), 50)
        : 0.05;
    self.setTimeout = new Proxy(self.setTimeout, {
        apply: function(target, thisArg, args) {
            const [ a, b ] = args;
            if (
                (delay === -1 || b === delay) &&
                reNeedle.test(a.toString())
            ) {
                args[1] = b * boost;
            }
            return target.apply(thisArg, args);
        }
    });
}

function safeSelf() {
    if ( scriptletGlobals.has('safeSelf') ) {
        return scriptletGlobals.get('safeSelf');
    }
    const self = globalThis;
    const safe = {
        'Error': self.Error,
        'Object_defineProperty': Object.defineProperty.bind(Object),
        'RegExp': self.RegExp,
        'RegExp_test': self.RegExp.prototype.test,
        'RegExp_exec': self.RegExp.prototype.exec,
        'XMLHttpRequest': self.XMLHttpRequest,
        'addEventListener': self.EventTarget.prototype.addEventListener,
        'removeEventListener': self.EventTarget.prototype.removeEventListener,
        'fetch': self.fetch,
        'jsonParse': self.JSON.parse.bind(self.JSON),
        'jsonStringify': self.JSON.stringify.bind(self.JSON),
        'log': console.log.bind(console),
        uboLog(...args) {
            if ( args.length === 0 ) { return; }
            if ( `${args[0]}` === '' ) { return; }
            this.log('[uBO]', ...args);
        },
        initPattern(pattern, options = {}) {
            if ( pattern === '' ) {
                return { matchAll: true };
            }
            const expect = (options.canNegate === true && pattern.startsWith('!') === false);
            if ( expect === false ) {
                pattern = pattern.slice(1);
            }
            const match = /^\/(.+)\/([gimsu]*)$/.exec(pattern);
            if ( match !== null ) {
                return {
                    pattern,
                    re: new this.RegExp(
                        match[1],
                        match[2] || options.flags
                    ),
                    expect,
                };
            }
            return {
                pattern,
                re: new this.RegExp(pattern.replace(
                    /[.*+?^${}()|[\]\\]/g, '\\$&'),
                    options.flags
                ),
                expect,
            };
        },
        testPattern(details, haystack) {
            if ( details.matchAll ) { return true; }
            return this.RegExp_test.call(details.re, haystack) === details.expect;
        },
        patternToRegex(pattern, flags = undefined) {
            if ( pattern === '' ) { return /^/; }
            const match = /^\/(.+)\/([gimsu]*)$/.exec(pattern);
            if ( match === null ) {
                return new RegExp(pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), flags);
            }
            try {
                return new RegExp(match[1], match[2] || flags);
            }
            catch(ex) {
            }
            return /^/;
        },
        getExtraArgs(args, offset = 0) {
            const entries = args.slice(offset).reduce((out, v, i, a) => {
                if ( (i & 1) === 0 ) {
                    const rawValue = a[i+1];
                    const value = /^\d+$/.test(rawValue)
                        ? parseInt(rawValue, 10)
                        : rawValue;
                    out.push([ a[i], value ]);
                }
                return out;
            }, []);
            return Object.fromEntries(entries);
        },
    };
    scriptletGlobals.set('safeSelf', safe);
    return safe;
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
    try { nanoSetTimeoutBooster(...argsList[i]); }
    catch(ex) {}
}
argsList.length = 0;

/******************************************************************************/

};
// End of code to inject

/******************************************************************************/

// Inject code

// https://bugzilla.mozilla.org/show_bug.cgi?id=1736575
//   'MAIN' world not yet supported in Firefox, so we inject the code into
//   'MAIN' ourself when environment in Firefox.

// Not Firefox
if ( typeof wrappedJSObject !== 'object' ) {
    return uBOL_nanoSetTimeoutBooster();
}

// Firefox
{
    const page = self.wrappedJSObject;
    let script, url;
    try {
        page.uBOL_nanoSetTimeoutBooster = cloneInto([
            [ '(', uBOL_nanoSetTimeoutBooster.toString(), ')();' ],
            { type: 'text/javascript; charset=utf-8' },
        ], self);
        const blob = new page.Blob(...page.uBOL_nanoSetTimeoutBooster);
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
    delete page.uBOL_nanoSetTimeoutBooster;
}

/******************************************************************************/

// End of local scope
})();

/******************************************************************************/

void 0;
