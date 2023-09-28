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

const argsList = [["script","/getAdUnitPath|\\.then\\(eval\\)/"],["script","/==undefined.*body/"],["script","style"],["script","Number.isSafeInteger"],["script","/style:last-of-type|:empty|APKM\\..+?\\.innerHTML/"],["script","Reflect"],["script","document.write"],["script","self == top"],["script","exdynsrv"],["script","/onerror|adsbygoogle|pop|function displayNotice/"],["script","FingerprintJS"],["script","/check_if_blocking|XMLHttpRequest|adkiller/"],["script","mdp"],["script","/document\\.createElement|\\.banner-in/"],["script","/block-adb|-0x|adblock/"],["script","ExoLoader"],["script","adblock"],["script","homad"],["script","fakeAd"],["script","alert"],["script","window.open"],["script","break;case $"],["script","Adblock"],["script","onerror"],["script","break;case $."],["style","text-decoration"],["script","/replace|adsbygoogle/"],["script","htmls"],["script","/\\[\\'push\\'\\]/"],["script","googlesyndication"],["script","numberPages"],["script","adBlockDetected"],["script","/window\\.location|Adblock/"],["script","window.top"],["script","AdBlocker"],["script","adb_detected"],["script","await fetch"],["script","/'.adsbygoogle'|text-danger|warning|Adblock|_0x/"],["script","popUnder"],["#text","/スポンサーリンク|Sponsored Link|广告/"],["#text","スポンサーリンク"],["#text","スポンサードリンク"],["#text","/\\[vkExUnit_ad area=(after|before)\\]/"],["#text","【広告】"],["#text","【PR】"],["#text","関連動画"],["script","leave_recommend"],["#text","/^Advertisement$/"],["script","zfgloaded"],["script","ai_adb"],["script","HTMLAllCollection"],["script","liedetector"],["script","/window\\.open|window\\.location\\.href|document\\.addEventListener|\\$\\(document\\)\\.ready.*show/"],["script","/typeof [a-z]\\.cmd\\.unshift/","condition","cmd.unshift"],["script","end_click"],["script","ad blocker"],["script","closeAd"],["script","/modal|popupads/"],["script","/adconfig/i"],["script","AdblockDetector"],["script","is_antiblock_refresh"],["script","/userAgent|adb|htmls/"],["script","myModal"],["script","popunder"],["script","ad_block"],["script","app_checkext"],["script","shown_at"],["script","clientHeight"],["script","/url_key|adHtml/"],["script","pop.target"],["script","axios"],["script","ad block"],["script","AdBlockEnabled"],["script","window.location.replace"],["script","/$.*open/"],["script","Brave"],["script","egoTab"],["script","abDetectorPro"],["script","/$.*(css|oncontextmenu)/"],["script","/eval.*RegExp/"],["script","adb"],["script","wwads"],["script","/adblock/i"],["script","hasAdblock"],["script","/adshow/ad"],["script","/$.*adUnits/"],["script","decodeURIComponent"],["script","admiral"],["script","RegExp"],["script","adbl"],["script","doOpen"],["script","chkADB"],["script","AaDetector"],["script","AdBlock"],["script","antiAdBlockerHandler"],["script","Symbol.iterator"],["script","/RegExp\\(\\'/","condition","RegExp"],["script","/_date|Date()|parseInt|banana|adblock|window.location|getElementsByClassName|google_global_correlator|window.onload|nextElementSibling|getElementsByTagName|parentNode.innerHTML/"],["script","/charAt|innerHTML|appendChild|contains|join|jQuery.*length|jQuery\\S+?\\.html|\\$\\S+?\\.html/"]];

const hostnamesMap = new Map([["teltarif.de",0],["100percentfedup.com",1],["thegatewaypundit.com",1],["apkmirror.com",4],["yts.mx",6],["next-episode.net",9],["searchenginereports.net",11],["trangchu.news",12],["thecustomrom.com",12],["techacode.com",12],["plc247.com",12],["freepasses.org",12],["oko.sh",13],["bigbtc.win",14],["cryptofun.space",14],["sexo5k.com",15],["theshedend.com",16],["zeroupload.com",16],["securenetsystems.net",16],["miniwebtool.com",16],["bchtechnologies.com",16],["spiegel.de",17],["mynewsmedia.co",18],["revadvert.com",18],["appnee.com",19],["smutty.com",20],["down.dataaps.com",20],["123enjoy.net",21],["kiemlua.com",22],["makefreecallsonline.com",23],["bookszone.in",23],["shortix.co",23],["msonglyrics.com",23],["mphealth.online",23],["app-sorteos.com",23],["ak.sv",24],["atglinks.com",24],["filebox.click",24],["isaidub3.co",24],["playertv.net",24],["reset-scans.com",26],["kienthucrangmieng.com",27],["coin-free.com",27],["btc25.org",27],["btcbitco.in",27],["btcsatoshi.net",27],["cempakajaya.com",27],["crypto4yu.com",27],["gainl.ink",27],["manofadan.com",27],["readbitcoin.org",27],["wiour.com",27],["bitsmagic.fun",27],["ourcoincash.xyz",27],["hynews.biz",27],["everia.club",28],["embed4u.xyz",28],["backfirstwo.site",28],["jewelavid.com",28],["nizarstream.com",28],["beatsnoop.com",29],["fetchpik.com",29],["teachoo.com",30],["cryptowidgets.net",31],["carsmania.net",32],["carstopia.net",32],["coinsvalue.net",32],["cookinguide.net",32],["freeoseocheck.com",32],["makeupguide.net",32],["ntuplay.xyz",33],["7xm.xyz",34],["tii.la",35],["hacoos.com",36],["zefoy.com",37],["vidello.net",38],["resizer.myct.jp",39],["gametohkenranbu.sakuraweb.com",40],["jisakuhibi.jp",41],["rank1-media.com",41],["lifematome.blog",42],["fm.sekkaku.net",43],["free-avx.jp",44],["dvdrev.com",45],["nft-media.net",46],["ghacks.net",47],["songspk2.info",48],["truyentranhfull.net",49],["iwatchfriendsonline.net",51],["suaurl.com",52],["calculator-online.net",53],["cattime.com",53],["comingsoon.net",53],["dogtime.com",53],["givemesport.com",53],["howtogeek.com",53],["liveandletsfly.com",53],["milestomemories.com",53],["momtastic.com",53],["nordot.app",53],["qtoptens.com",53],["sherdog.com",53],["superherohype.com",53],["thefashionspot.com",53],["timesnews.net",53],["xda-developers.com",53],["khoaiphim.com",54],["haafedk2.com",55],["fordownloader.com",55],["jovemnerd.com.br",56],["nicomanga.com",57],["totalcsgo.com",58],["moviehab.asia",59],["manysex.com",60],["gaminginfos.com",61],["tinxahoivn.com",62],["freeroms.com",63],["forums-fastunlock.com",64],["automoto.it",65],["sekaikomik.bio",66],["codelivly.com",67],["ophim.vip",68],["touguatize.monster",69],["novelhall.com",70],["hes-goal.net",71],["biblestudytools.com",72],["kuponigo.com",73],["kimcilonly.site",74],["cryptoearns.com",75],["inxxx.com",76],["ipaspot.app",77],["embedwish.com",78],["filelions.live",78],["leakslove.net",78],["jenismac.com",79],["yunjiema.top",80],["vxetable.cn",81],["snapwordz.com",82],["toolxox.com",82],["sabornutritivo.com",83],["usandoapp.com",84],["fazercurriculo.online",84],["plumbersforums.net",85],["123movies800.online",86],["cbr.com",87],["gulio.site",88],["mediaset.es",89],["izlekolik.net",90],["letsdopuzzles.com",91],["nopay2.info",92],["hes-goals.io",93],["sigmalinks.in",94],["rediff.com",95],["tapewithadblock.org",96],["rjno1.com",97],["lifestyle.bg",98],["money.bg",98],["news.bg",98],["topsport.bg",98],["webcafe.bg",98]]);

const entitiesMap = new Map([["1337x",2],["kimcartoon",3],["pahe",5],["soap2day",5],["hqq",7],["waaw",7],["pixhost",8],["viprow",10],["eplayvid",21],["poplinks",23],["cricstream",24],["dropgalaxy",24],["o2tvseries",24],["o2tvseriesz",24],["kickass",25],["actvid",50]]);

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
