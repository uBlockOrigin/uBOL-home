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

// ruleset: default

/******************************************************************************/

// Important!
// Isolate from global scope

// Start of local scope
(( ) => {

/******************************************************************************/

// Start of code to inject
const uBOL_removeNodeText = function() {

const scriptletGlobals = new Map(); // jshint ignore: line

const argsList = [["script","/getAdUnitPath|\\.then\\(eval\\)|DisplayAcceptableAdIfAdblocked|,eval\\)\\)\\)\\;/"],["script","/==undefined.*body/"],["script","style"],["script","Number.isSafeInteger"],["script","/style:last-of-type|:empty|APKM\\..+?\\.innerHTML/"],["script","Reflect"],["script","document.write"],["script","self == top"],["script","exdynsrv"],["script","/onerror|adsbygoogle|notice/i"],["script","FingerprintJS"],["script","/check_if_blocking|XMLHttpRequest|adkiller/"],["script","mdp"],["script","/document\\.createElement|\\.banner-in/"],["script","/block-adb|-0x|adblock/"],["script","ExoLoader"],["script","adblock"],["script","homad"],["script","fakeAd"],["script","alert"],["script","window.open"],["script","break;case $"],["script","Adblock"],["script","onerror"],["script","break;case $."],["style","text-decoration"],["script","/replace|adsbygoogle/"],["script","htmls"],["script","/\\[\\'push\\'\\]/"],["script","googlesyndication"],["script","numberPages"],["script","adBlockDetected"],["script","/window\\.location|Adblock/"],["script","/ConsoleBan|alert|AdBlocker/"],["script","window.top"],["script","AdBlocker"],["script","adb_detected"],["script","await fetch"],["script","/'.adsbygoogle'|text-danger|warning|Adblock|_0x/"],["script","popUnder"],["#text","/スポンサーリンク|Sponsored Link|广告/"],["#text","スポンサーリンク"],["#text","スポンサードリンク"],["#text","/\\[vkExUnit_ad area=(after|before)\\]/"],["#text","【広告】"],["#text","【PR】"],["#text","関連動画"],["script","leave_recommend"],["#text","/^Advertisement$/"],["script","zfgloaded"],["script","ai_adb"],["script","HTMLAllCollection"],["script","liedetector"],["script","/window\\.open|window\\.location\\.href|document\\.addEventListener|\\$\\(document\\)\\.ready.*show/"],["script","/typeof [a-z]\\.cmd\\.unshift/","condition","cmd.unshift"],["script","end_click"],["script","ad blocker"],["script","closeAd"],["script","/modal|popupads/"],["script","/adconfig/i"],["script","AdblockDetector"],["script","is_antiblock_refresh"],["script","/userAgent|adb|htmls/"],["script","myModal"],["script","popunder"],["script","ad_block"],["script","app_checkext"],["script","shown_at"],["script","clientHeight"],["script","/url_key|adHtml/"],["script","pop.target"],["script","axios"],["script","ad block"],["script","AdBlockEnabled"],["script","window.location.replace"],["script","/$.*open/"],["script","Brave"],["script","egoTab"],["script","abDetectorPro"],["script","/$.*(css|oncontextmenu)/"],["script","/eval.*RegExp/"],["script","adb"],["script","wwads"],["script","/adblock/i"],["script","hasAdblock"],["script","/adshow/ad"],["script","/$.*adUnits/"],["script","decodeURIComponent"],["script","admiral"],["script","RegExp"],["script","adbl"],["script","doOpen"],["script","adsBlocked"],["script","chkADB"],["script","AaDetector"],["script","AdBlock"],["script","antiAdBlockerHandler"],["script","Symbol.iterator"],["script","catch"],["script","/RegExp\\(\\'/","condition","RegExp"],["script","/_date|Date()|parseInt|banana|adblock|window.location|getElementsByClassName|google_global_correlator|window.onload|nextElementSibling|getElementsByTagName|parentNode.innerHTML/"],["script","/,\\'gger\\',/"]];

const hostnamesMap = new Map([["teltarif.de",0],["100percentfedup.com",1],["thegatewaypundit.com",1],["apkmirror.com",4],["yts.mx",6],["next-episode.net",9],["sinvida.me",10],["exeo.app",10],["searchenginereports.net",11],["trangchu.news",12],["thecustomrom.com",12],["techacode.com",12],["plc247.com",12],["freepasses.org",12],["oko.sh",13],["bigbtc.win",14],["cryptofun.space",14],["sexo5k.com",15],["theshedend.com",16],["zeroupload.com",16],["securenetsystems.net",16],["miniwebtool.com",16],["bchtechnologies.com",16],["spiegel.de",17],["mynewsmedia.co",18],["revadvert.com",18],["appnee.com",19],["smutty.com",20],["down.dataaps.com",20],["123enjoy.net",21],["kiemlua.com",22],["makefreecallsonline.com",23],["androjungle.com",23],["bookszone.in",23],["shortix.co",23],["msonglyrics.com",23],["mphealth.online",23],["app-sorteos.com",23],["appsbull.com",23],["diudemy.com",23],["maqal360.com",23],["ak.sv",24],["atglinks.com",24],["filebox.click",24],["isaidub3.co",24],["playertv.net",24],["reset-scans.com",26],["kienthucrangmieng.com",27],["coin-free.com",27],["btc25.org",27],["btcbitco.in",27],["btcsatoshi.net",27],["cempakajaya.com",27],["crypto4yu.com",27],["gainl.ink",27],["manofadan.com",27],["readbitcoin.org",27],["wiour.com",27],["bitsmagic.fun",27],["ourcoincash.xyz",27],["hynews.biz",27],["everia.club",28],["embed4u.xyz",28],["backfirstwo.site",28],["jewelavid.com",28],["nizarstream.com",28],["beatsnoop.com",29],["fetchpik.com",29],["teachoo.com",30],["cryptowidgets.net",31],["carsmania.net",32],["carstopia.net",32],["coinsvalue.net",32],["cookinguide.net",32],["freeoseocheck.com",32],["makeupguide.net",32],["topsporter.net",33],["sportshub.to",33],["ntuplay.xyz",34],["7xm.xyz",35],["tii.la",36],["hacoos.com",37],["zefoy.com",38],["vidello.net",39],["resizer.myct.jp",40],["gametohkenranbu.sakuraweb.com",41],["jisakuhibi.jp",42],["rank1-media.com",42],["lifematome.blog",43],["fm.sekkaku.net",44],["free-avx.jp",45],["dvdrev.com",46],["nft-media.net",47],["ghacks.net",48],["songspk2.info",49],["truyentranhfull.net",50],["iwatchfriendsonline.net",52],["suaurl.com",53],["allmusic.com",54],["calculator-online.net",54],["cattime.com",54],["collider.com",54],["comingsoon.net",54],["dogtime.com",54],["dualshockers.com",54],["freeconvert.com",54],["givemesport.com",54],["howtogeek.com",54],["liveandletsfly.com",54],["milestomemories.com",54],["momtastic.com",54],["nordot.app",54],["qtoptens.com",54],["sherdog.com",54],["superherohype.com",54],["thefashionspot.com",54],["timesnews.net",54],["xda-developers.com",54],["khoaiphim.com",55],["haafedk2.com",56],["fordownloader.com",56],["jovemnerd.com.br",57],["nicomanga.com",58],["totalcsgo.com",59],["moviehab.asia",60],["manysex.com",61],["gaminginfos.com",62],["tinxahoivn.com",63],["freeroms.com",64],["forums-fastunlock.com",65],["automoto.it",66],["sekaikomik.bio",67],["codelivly.com",68],["ophim.vip",69],["touguatize.monster",70],["novelhall.com",71],["hes-goal.net",72],["biblestudytools.com",73],["kuponigo.com",74],["kimcilonly.site",75],["kimcilonly.link",75],["cryptoearns.com",76],["inxxx.com",77],["ipaspot.app",78],["embedwish.com",79],["filelions.live",79],["leakslove.net",79],["jenismac.com",80],["yunjiema.top",81],["vxetable.cn",82],["snapwordz.com",83],["toolxox.com",83],["rl6mans.com",83],["idol69.net",83],["sabornutritivo.com",84],["usandoapp.com",85],["fazercurriculo.online",85],["plumbersforums.net",86],["123movies800.online",87],["cbr.com",88],["gamerant.com",88],["gulio.site",89],["mediaset.es",90],["izlekolik.net",91],["donghuaworld.com",92],["letsdopuzzles.com",93],["nopay2.info",94],["hes-goals.io",95],["sigmalinks.in",96],["rediff.com",97],["iconicblogger.com",98],["tapewithadblock.org",99],["rjno1.com",100],["djxmaza.in",101],["miuiflash.com",101],["thecubexguide.com",101]]);

const entitiesMap = new Map([["1337x",2],["kimcartoon",3],["pahe",5],["soap2day",5],["hqq",7],["waaw",7],["pixhost",8],["viprow",10],["eplayvid",21],["poplinks",23],["cricstream",24],["dropgalaxy",24],["o2tvseries",24],["o2tvseriesz",24],["kickass",25],["actvid",51]]);

const exceptionsMap = new Map([]);

/******************************************************************************/

function removeNodeText(
    nodeName,
    condition,
    ...extraArgs
) {
    replaceNodeTextCore(nodeName, '', '', 'condition', condition || '', ...extraArgs);
}

function replaceNodeTextCore(
    nodeName = '',
    pattern = '',
    replacement = ''
) {
    const safe = safeSelf();
    const reNodeName = safe.patternToRegex(nodeName, 'i');
    const rePattern = safe.patternToRegex(pattern, 'gms');
    const extraArgs = safe.getExtraArgs(Array.from(arguments), 3);
    const shouldLog = scriptletGlobals.has('canDebug') && extraArgs.log || 0;
    const reCondition = safe.patternToRegex(extraArgs.condition || '', 'gms');
    const stop = (takeRecord = true) => {
        if ( takeRecord ) {
            handleMutations(observer.takeRecords());
        }
        observer.disconnect();
        if ( shouldLog !== 0 ) {
            safe.uboLog(`replace-node-text-core.fn: quitting "${pattern}" => "${replacement}"`);
        }
    };
    let sedCount = extraArgs.sedCount || 0;
    const handleNode = node => {
        const before = node.textContent;
        if ( safe.RegExp_test.call(rePattern, before) === false ) { return true; }
        if ( safe.RegExp_test.call(reCondition, before) === false ) { return true; }
        const after = pattern !== ''
            ? before.replace(rePattern, replacement)
            : replacement;
        node.textContent = after;
        if ( shouldLog !== 0 ) {
            safe.uboLog('replace-node-text-core.fn before:\n', before);
            safe.uboLog('replace-node-text-core.fn after:\n', after);
        }
        return sedCount === 0 || (sedCount -= 1) !== 0;
    };
    const handleMutations = mutations => {
        for ( const mutation of mutations ) {
            for ( const node of mutation.addedNodes ) {
                if ( reNodeName.test(node.nodeName) === false ) { continue; }
                if ( handleNode(node) ) { continue; }
                stop(false); return;
            }
        }
    };
    const observer = new MutationObserver(handleMutations);
    observer.observe(document, { childList: true, subtree: true });
    if ( document.documentElement ) {
        const treeWalker = document.createTreeWalker(
            document.documentElement,
            NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT
        );
        let count = 0;
        for (;;) {
            const node = treeWalker.nextNode();
            count += 1;
            if ( node === null ) { break; }
            if ( reNodeName.test(node.nodeName) === false ) { continue; }
            if ( handleNode(node) ) { continue; }
            stop(); break;
        }
        if ( shouldLog !== 0 ) {
            safe.uboLog(`replace-node-text-core.fn ${count} nodes present before installing mutation observer`);
        }
    }
    if ( extraArgs.stay ) { return; }
    runAt(( ) => {
        const quitAfter = extraArgs.quitAfter || 0;
        if ( quitAfter !== 0 ) {
            setTimeout(( ) => { stop(); }, quitAfter);
        } else {
            stop();
        }
    }, 'interactive');
}

function runAt(fn, when) {
    const intFromReadyState = state => {
        const targets = {
            'loading': 1,
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
    if ( scriptletGlobals.has('safeSelf') ) {
        return scriptletGlobals.get('safeSelf');
    }
    const self = globalThis;
    const safe = {
        'Error': self.Error,
        'Math_floor': Math.floor,
        'Math_random': Math.random,
        'Object_defineProperty': Object.defineProperty.bind(Object),
        'RegExp': self.RegExp,
        'RegExp_test': self.RegExp.prototype.test,
        'RegExp_exec': self.RegExp.prototype.exec,
        'Request_clone': self.Request.prototype.clone,
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
            const expect = (options.canNegate !== true || pattern.startsWith('!') === false);
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
    try { removeNodeText(...argsList[i]); }
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
    return uBOL_removeNodeText();
}

// Firefox
{
    const page = self.wrappedJSObject;
    let script, url;
    try {
        page.uBOL_removeNodeText = cloneInto([
            [ '(', uBOL_removeNodeText.toString(), ')();' ],
            { type: 'text/javascript; charset=utf-8' },
        ], self);
        const blob = new page.Blob(...page.uBOL_removeNodeText);
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
    delete page.uBOL_removeNodeText;
}

/******************************************************************************/

// End of local scope
})();

/******************************************************************************/

void 0;
