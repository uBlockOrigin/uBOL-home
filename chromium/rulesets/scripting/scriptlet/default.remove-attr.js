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

/* eslint-disable indent */
/* global cloneInto */

// ruleset: default

/******************************************************************************/

// Important!
// Isolate from global scope

// Start of local scope
(( ) => {

/******************************************************************************/

// Start of code to inject
const uBOL_removeAttr = function() {

const scriptletGlobals = {}; // eslint-disable-line

const argsList = [["data-id|data-p","[data-id],[data-p]","stay"],["onclick"],["href|target","a[href=\"https://imgprime.com/view.php\"][target=\"_blank\"]","complete"],["href","a[href=\"https://vpn-choice.com\"]"],["src","iframe#claimAd"],["href","#opfk"],["srcdoc","iframe"],["checked","input#chkIsAdd"],["onmousemove","button"],["onclick","button[id][onclick*=\".html\"]"],["onclick","button[name=\"imgContinue\"][onclick]"],["target","#continuetoimage > [href]"],["href|target","#continuetoimage > [href][onclick], #overlayera > #ajax_load_indicator > #page_effect > [href][onclick]"],["target"],["href","[href*=\"ccbill\"]"],["onclick","[onclick^=\"window.open\"]"],["href","#clickfakeplayer"],["onclick","","stay"],["type","input[value^=\"http\"]"],["oncontextmenu"],["data-ivad-preroll-adtag","video","stay"],["href","a#clickfakeplayer"],["href",".fake_player > [href][target]"],["href",".link"],["target",".clickbutton"],["oncontextmenu","body"],["disabled","button"],["data-ppcnt_ads","main[onclick]"],["href","[href*=\"jump\"]","stay"],["style","#over"],["class","div.intAdX"],["class","div[class^=\"img\"][class$=\"ad\"]"],["onclick","button[onclick*=\"open\"]"],["disabled","#tp-snp2"],["data-ppcnt_ads|onclick","#main"],["onclick",".btn-success.get-link","stay"],["disabled",".btn-primary"],["href",".MyAd > a[target=\"_blank\"]"],["data-ppcnt_ads","","stay"],["onclick","button[onclick^=\"window.open\"]"],["onclick",".btn"],["onclick","[onclick^=\"pop\"]"],["href","[href^=\"https://aj2218.online/\"]","stay"],["target","#downloadvideo"],["data-item","a[href='']"],["href","a[href*=\"/ads.php\"][target=\"_blank\"]"],["onclick","[onclick*=\"window.open\"]"],["target|href","a[href^=\"//\"]"],["onclick","a[href^=\"magnet:\"][onclick]"],["target","#SafelinkGenerate"],["onclick","a[href][onclick^=\"getFullStory\"]"],["onclick","body"],["onclick",".previewhd > a"],["href|target|data-ipshover-target|data-ipshover|data-autolink|rel","a[href^=\"https://thumpertalk.com/link/click/\"][target=\"_blank\"]"],["href","#continue"],["href",".button[href^=\"javascript\"]"],["disabled","input[id=\"button1\"][class=\"btn btn-primary\"][disabled]"],["type","[src*=\"SPOT\"]","asap stay"],["class","div#player"],["href|target|data-onclick","a[id=\"dl\"][data-onclick^=\"window.open\"]","stay"],["href","a#clickfkplayer"],["onclick","a[onclick^=\"setTimeout\"]"],["href",".mvi-cover"],["href",".t-out-span [href*=\"utm_source\"]","stay"],["src",".t-out-span [src*=\".gif\"]","stay"],["disabled",".panel-body > .text-center > button"],["href","[onclick]","stay"],["onmousedown",".ob-dynamic-rec-link","stay"],["disabled","a#redirect-btn"],["href",".unlock-step-link"],["href","[href*=\"discord\"]"],["href",".MediaStep","stay"],["href","[href=\"/bestporn.html\"]"],["disabled","button#getlink"],["disabled","button#gotolink"],["id","#div-gpt-ad-footer"],["id","#div-gpt-ad-pagebottom"],["id","#div-gpt-ad-relatedbottom-1"],["id","#div-gpt-ad-sidebottom"],["disabled",".downloadbtn"],["onclick","#direct_link > a[onclick]"],["href","[onclick^=\"pop\"]"],["disabled","#gotolink"],["style","[style*=\"background-image: url\"]","stay"],["href","[href*=\"click?\"]","stay"],["href",".atas > a[href*=\"/redirect\"][onclick]"],["onload","[onload^=\"window.open\"]"],["href","a[href*=\"torrentico.top/sim/go.php\"]"],["onclick","[type=\"submit\"]"],["onclick","a#downloadbtn[onclick^=\"window.open\"]","stay"],["onclick","a[onclick]"],["onclick","a[onclick*=\"window.open\"]"],["style","[style^=\"background\"]","stay"],["href","[target^=\"_\"]","stay"],["class|style","div[id^=\"los40_gpt\"]"],["data-woman-ex","a[href][data-woman-ex]"],["data-trm-action|data-trm-category|data-trm-label",".trm_event","stay"]];

const hostnamesMap = new Map([["mcloud.bz",0],["vidstream.pro",0],["bs.to",1],["payskip.org",1],["dozarte.com",1],["goalup.live",1],["pornoborshch.com",1],["imgprime.com",2],["magnetdl.com",3],["magnetdl.org",3],["moondoge.co.in",4],["igg-games.com",6],["crazyvidup.com",6],["22pixx.xyz",[10,11,12]],["games2rule.com",13],["games4king.com",13],["sexykittenporn.com",14],["errotica-archives.com",14],["shon.xyz",15],["amyscans.com",16],["dvdgayonline.com",16],["supergoku.com",16],["streampourvous.com",16],["openloading.com",16],["dvdgayporn.com",16],["latinohentai.com",16],["vumoo.cc",16],["eegybest.xyz",16],["animesgratis.org",16],["filerio.in",17],["fastconverter.net",17],["xxx-image.com",19],["desired.de",20],["premiumstream.live",23],["newsonthegotoday.com",24],["findandfound.ga",25],["18kalebettv.xyz",25],["19kalebettv.xyz",25],["apps2app.com",26],["appsmodz.com",26],["note1s.com",26],["paste1s.com",26],["tr.link",27],["work.ink",28],["freeplayervideo.com",29],["nazarickol.com",29],["player-cdn.com",29],["playhydrax.com",29],["1001tracklists.com",[30,31]],["swiftuploads.com",32],["myprivatejobs.com",33],["wikitraveltips.com",33],["amritadrino.com",33],["aylink.co",34],["gitizle.vip",34],["shtms.co",34],["satoshi-win.xyz",35],["promo-visits.site",36],["bitzite.com",37],["cpmlink.pro",38],["host-buzz.com",39],["insmyst.com",39],["wp2host.com",39],["blogtechh.com",39],["lnbz.la",39],["techbixby.com",39],["blogmyst.com",39],["stagatvfiles.com",39],["oii.io",40],["megaurl.in",41],["megafly.in",41],["donpelis.com",41],["smutty.com",42],["iseekgirls.com",44],["tio.ch",45],["ondebaixo.com",48],["ondebaixa.com",48],["ondeeubaixo.org",48],["torrentool.org",48],["egao.in",49],["hindustantimes.com",50],["e-sushi.fr",51],["itsfuck.com",52],["stilltube.com",52],["thumpertalk.com",53],["adz7short.space",54],["allwpworld.com",56],["veoplanet.com",57],["blogdatecnologia.net",58],["diariodecasamento.com",58],["eusaudavel.net",58],["modaestiloeafins.com",58],["portalmundocurioso.com",58],["receitasabores.com",58],["turismoeviagem.com",58],["bowfile.com",59],["av01.tv",61],["film01stream.ws",62],["firstpost.com",[63,64]],["so1.asia",65],["methodspoint.com",66],["welt.de",67],["top1iq.com",68],["sub1s.com",69],["utopiascans.com",70],["mboost.me",71],["watchanime.video",72],["adzz.in",[73,74,82]],["soranews24.com",[75,76,77,78]],["datanodes.to",79],["mega4upload.com",80],["javchill.com",81],["proappapk.com",82],["seznamzpravy.cz",[83,84]],["link.idblog.eu.org",85],["jockantv.com",86],["domaha.tv",87],["xxxrip.net",87],["sextor.org",87],["sex-torrent.net",87],["timestamp.fr",88],["yt2conv.com",89],["av01.media",90],["flixtor2.to",91],["karaoketexty.cz",[92,93]],["los40.com",94],["woman.excite.co.jp",95],["demae-can.com",96]]);

const entitiesMap = new Map([["vidplay",0],["vizcloud",0],["adbull",1],["burningseries",1],["nextorrent",1],["sportlive",1],["pelisplus",5],["pelispedia",[5,21,22]],["cine-calidad",5],["douploads",7],["vinaurl",8],["filecrypt",9],["mega4up",15],["zeefiles",15],["cinetux",16],["dpstream",16],["allcalidad",16],["pelis28",16],["jetanimes",16],["anxcinema",16],["hdmovie5",16],["pelishouse",16],["mlwbd",18],["pelispedia24",21],["strcloud",43],["streamtape",43],["streamta",43],["strtape",43],["strtapeadblock",43],["fzm",46],["fzmovies",46],["lite-link",47],["waploaded",55],["onionplay",60]]);

const exceptionsMap = new Map([]);

/******************************************************************************/

function removeAttr(
    rawToken = '',
    rawSelector = '',
    behavior = ''
) {
    if ( typeof rawToken !== 'string' ) { return; }
    if ( rawToken === '' ) { return; }
    const safe = safeSelf();
    const logPrefix = safe.makeLogPrefix('remove-attr', rawToken, rawSelector, behavior);
    const tokens = rawToken.split(/\s*\|\s*/);
    const selector = tokens
        .map(a => `${rawSelector}[${CSS.escape(a)}]`)
        .join(',');
    if ( safe.logLevel > 1 ) {
        safe.uboLog(logPrefix, `Target selector:\n\t${selector}`);
    }
    const asap = /\basap\b/.test(behavior);
    let timerId;
    const rmattrAsync = ( ) => {
        if ( timerId !== undefined ) { return; }
        timerId = safe.onIdle(( ) => {
            timerId = undefined;
            rmattr();
        }, { timeout: 17 });
    };
    const rmattr = ( ) => {
        if ( timerId !== undefined ) {
            safe.offIdle(timerId);
            timerId = undefined;
        }
        try {
            const nodes = document.querySelectorAll(selector);
            for ( const node of nodes ) {
                for ( const attr of tokens ) {
                    if ( node.hasAttribute(attr) === false ) { continue; }
                    node.removeAttribute(attr);
                    safe.uboLog(logPrefix, `Removed attribute '${attr}'`);
                }
            }
        } catch(ex) {
        }
    };
    const mutationHandler = mutations => {
        if ( timerId !== undefined ) { return; }
        let skip = true;
        for ( let i = 0; i < mutations.length && skip; i++ ) {
            const { type, addedNodes, removedNodes } = mutations[i];
            if ( type === 'attributes' ) { skip = false; }
            for ( let j = 0; j < addedNodes.length && skip; j++ ) {
                if ( addedNodes[j].nodeType === 1 ) { skip = false; break; }
            }
            for ( let j = 0; j < removedNodes.length && skip; j++ ) {
                if ( removedNodes[j].nodeType === 1 ) { skip = false; break; }
            }
        }
        if ( skip ) { return; }
        asap ? rmattr() : rmattrAsync();
    };
    const start = ( ) => {
        rmattr();
        if ( /\bstay\b/.test(behavior) === false ) { return; }
        const observer = new MutationObserver(mutationHandler);
        observer.observe(document, {
            attributes: true,
            attributeFilter: tokens,
            childList: true,
            subtree: true,
        });
    };
    runAt(( ) => { start(); }, behavior.split(/\s+/));
}

function runAt(fn, when) {
    const intFromReadyState = state => {
        const targets = {
            'loading': 1, 'asap': 1,
            'interactive': 2, 'end': 2, '2': 2,
            'complete': 3, 'idle': 3, '3': 3,
        };
        const tokens = Array.isArray(state) ? state : [ state ];
        for ( const token of tokens ) {
            const prop = `${token}`;
            if ( targets.hasOwnProperty(prop) === false ) { continue; }
            return targets[prop];
        }
        return 0;
    };
    const runAt = intFromReadyState(when);
    if ( intFromReadyState(document.readyState) >= runAt ) {
        fn(); return;
    }
    const onStateChange = ( ) => {
        if ( intFromReadyState(document.readyState) < runAt ) { return; }
        fn();
        safe.removeEventListener.apply(document, args);
    };
    const safe = safeSelf();
    const args = [ 'readystatechange', onStateChange, { capture: true } ];
    safe.addEventListener.apply(document, args);
}

function safeSelf() {
    if ( scriptletGlobals.safeSelf ) {
        return scriptletGlobals.safeSelf;
    }
    const self = globalThis;
    const safe = {
        'Array_from': Array.from,
        'Error': self.Error,
        'Function_toStringFn': self.Function.prototype.toString,
        'Function_toString': thisArg => safe.Function_toStringFn.call(thisArg),
        'Math_floor': Math.floor,
        'Math_max': Math.max,
        'Math_min': Math.min,
        'Math_random': Math.random,
        'Object': Object,
        'Object_defineProperty': Object.defineProperty.bind(Object),
        'Object_defineProperties': Object.defineProperties.bind(Object),
        'Object_fromEntries': Object.fromEntries.bind(Object),
        'Object_getOwnPropertyDescriptor': Object.getOwnPropertyDescriptor.bind(Object),
        'RegExp': self.RegExp,
        'RegExp_test': self.RegExp.prototype.test,
        'RegExp_exec': self.RegExp.prototype.exec,
        'Request_clone': self.Request.prototype.clone,
        'String_fromCharCode': String.fromCharCode,
        'XMLHttpRequest': self.XMLHttpRequest,
        'addEventListener': self.EventTarget.prototype.addEventListener,
        'removeEventListener': self.EventTarget.prototype.removeEventListener,
        'fetch': self.fetch,
        'JSON': self.JSON,
        'JSON_parseFn': self.JSON.parse,
        'JSON_stringifyFn': self.JSON.stringify,
        'JSON_parse': (...args) => safe.JSON_parseFn.call(safe.JSON, ...args),
        'JSON_stringify': (...args) => safe.JSON_stringifyFn.call(safe.JSON, ...args),
        'log': console.log.bind(console),
        // Properties
        logLevel: 0,
        // Methods
        makeLogPrefix(...args) {
            return this.sendToLogger && `[${args.join(' \u205D ')}]` || '';
        },
        uboLog(...args) {
            if ( this.sendToLogger === undefined ) { return; }
            if ( args === undefined || args[0] === '' ) { return; }
            return this.sendToLogger('info', ...args);
            
        },
        uboErr(...args) {
            if ( this.sendToLogger === undefined ) { return; }
            if ( args === undefined || args[0] === '' ) { return; }
            return this.sendToLogger('error', ...args);
        },
        escapeRegexChars(s) {
            return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        },
        initPattern(pattern, options = {}) {
            if ( pattern === '' ) {
                return { matchAll: true, expect: true };
            }
            const expect = (options.canNegate !== true || pattern.startsWith('!') === false);
            if ( expect === false ) {
                pattern = pattern.slice(1);
            }
            const match = /^\/(.+)\/([gimsu]*)$/.exec(pattern);
            if ( match !== null ) {
                return {
                    re: new this.RegExp(
                        match[1],
                        match[2] || options.flags
                    ),
                    expect,
                };
            }
            if ( options.flags !== undefined ) {
                return {
                    re: new this.RegExp(this.escapeRegexChars(pattern),
                        options.flags
                    ),
                    expect,
                };
            }
            return { pattern, expect };
        },
        testPattern(details, haystack) {
            if ( details.matchAll ) { return true; }
            if ( details.re ) {
                return this.RegExp_test.call(details.re, haystack) === details.expect;
            }
            return haystack.includes(details.pattern) === details.expect;
        },
        patternToRegex(pattern, flags = undefined, verbatim = false) {
            if ( pattern === '' ) { return /^/; }
            const match = /^\/(.+)\/([gimsu]*)$/.exec(pattern);
            if ( match === null ) {
                const reStr = this.escapeRegexChars(pattern);
                return new RegExp(verbatim ? `^${reStr}$` : reStr, flags);
            }
            try {
                return new RegExp(match[1], match[2] || undefined);
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
            return this.Object_fromEntries(entries);
        },
        onIdle(fn, options) {
            if ( self.requestIdleCallback ) {
                return self.requestIdleCallback(fn, options);
            }
            return self.requestAnimationFrame(fn);
        },
        offIdle(id) {
            if ( self.requestIdleCallback ) {
                return self.cancelIdleCallback(id);
            }
            return self.cancelAnimationFrame(id);
        }
    };
    scriptletGlobals.safeSelf = safe;
    if ( scriptletGlobals.bcSecret === undefined ) { return safe; }
    // This is executed only when the logger is opened
    const bc = new self.BroadcastChannel(scriptletGlobals.bcSecret);
    let bcBuffer = [];
    safe.logLevel = scriptletGlobals.logLevel || 1;
    let lastLogType = '';
    let lastLogText = '';
    let lastLogTime = 0;
    safe.sendToLogger = (type, ...args) => {
        if ( args.length === 0 ) { return; }
        const text = `[${document.location.hostname || document.location.href}]${args.join(' ')}`;
        if ( text === lastLogText && type === lastLogType ) {
            if ( (Date.now() - lastLogTime) < 5000 ) { return; }
        }
        lastLogType = type;
        lastLogText = text;
        lastLogTime = Date.now();
        if ( bcBuffer === undefined ) {
            return bc.postMessage({ what: 'messageToLogger', type, text });
        }
        bcBuffer.push({ type, text });
    };
    bc.onmessage = ev => {
        const msg = ev.data;
        switch ( msg ) {
        case 'iamready!':
            if ( bcBuffer === undefined ) { break; }
            bcBuffer.forEach(({ type, text }) =>
                bc.postMessage({ what: 'messageToLogger', type, text })
            );
            bcBuffer = undefined;
            break;
        case 'setScriptletLogLevelToOne':
            safe.logLevel = 1;
            break;
        case 'setScriptletLogLevelToTwo':
            safe.logLevel = 2;
            break;
        }
    };
    bc.postMessage('areyouready?');
    return safe;
}

/******************************************************************************/

const hnParts = [];
try {
    let origin = document.location.origin;
    if ( origin === 'null' ) {
        const origins = document.location.ancestorOrigins;
        for ( let i = 0; i < origins.length; i++ ) {
            origin = origins[i];
            if ( origin !== 'null' ) { break; }
        }
    }
    const pos = origin.lastIndexOf('://');
    if ( pos === -1 ) { return; }
    hnParts.push(...origin.slice(pos+3).split('.'));
}
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
    try { removeAttr(...argsList[i]); }
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

const targetWorld = 'MAIN';

// Not Firefox
if ( typeof wrappedJSObject !== 'object' || targetWorld === 'ISOLATED' ) {
    return uBOL_removeAttr();
}

// Firefox
{
    const page = self.wrappedJSObject;
    let script, url;
    try {
        page.uBOL_removeAttr = cloneInto([
            [ '(', uBOL_removeAttr.toString(), ')();' ],
            { type: 'text/javascript; charset=utf-8' },
        ], self);
        const blob = new page.Blob(...page.uBOL_removeAttr);
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
    delete page.uBOL_removeAttr;
}

/******************************************************************************/

// End of local scope
})();

/******************************************************************************/

void 0;
