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

const argsList = [["script","/getAdUnitPath|\\.then\\(eval\\)|DisplayAcceptableAdIfAdblocked|,eval\\)\\)\\)\\;|\\.join\\(\\'\\'\\)\\}\\;/"],["script","/==undefined.*body/"],["script","style"],["script","Number.isSafeInteger"],["script","/style:last-of-type|:empty|APKM\\..+?\\.innerHTML/"],["script","Reflect"],["script","document.write"],["script","self == top"],["script","exdynsrv"],["script","/onerror|adsbygoogle|notice|while/i"],["script","/adb/i"],["script","FingerprintJS"],["script","/check_if_blocking|XMLHttpRequest|adkiller/"],["script","mdp"],["script","/document\\.createElement|\\.banner-in/"],["script","/block-adb|-0x|adblock/"],["script","ExoLoader"],["script","adblock"],["script","homad"],["script","alert"],["script","window.open"],["script","break;case $"],["script","Adblock"],["script","onerror"],["script","break;case $."],["style","text-decoration"],["script","/replace|adsbygoogle/"],["script","htmls"],["script","/\\[\\'push\\'\\]/"],["script","googlesyndication"],["script","numberPages"],["script","adBlockDetected"],["script","replaceChild"],["#text","/^AD:/"],["script","documnet.write"],["script","/window\\.location|Adblock/"],["script","/ConsoleBan|alert|AdBlocker/"],["script","AdBlocker"],["script","adb_detected"],["script","adb"],["script","await fetch"],["script","/'.adsbygoogle'|text-danger|warning|Adblock|_0x/"],["script","popUnder"],["#text","/スポンサーリンク|Sponsored Link|广告/"],["#text","スポンサーリンク"],["#text","スポンサードリンク"],["#text","/\\[vkExUnit_ad area=(after|before)\\]/"],["#text","【広告】"],["#text","【PR】"],["#text","関連動画"],["#text","PR:"],["script","leave_recommend"],["#text","/^Advertisement$/"],["script","zfgloaded"],["script","ai_adb"],["script","HTMLAllCollection"],["script","liedetector"],["script","popWin"],["script","/window\\.open|window\\.location\\.href|document\\.addEventListener|\\$\\(document\\)\\.ready.*show/"],["script","/typeof [a-z]\\.cmd\\.unshift/","condition","cmd.unshift"],["script","end_click"],["script","ad blocker"],["script","closeAd"],["script","/modal|popupads/"],["script","/adconfig/i"],["script","AdblockDetector"],["script","is_antiblock_refresh"],["script","/userAgent|adb|htmls/"],["script","myModal"],["script","popunder"],["script","ad_block"],["script","app_checkext"],["script","shown_at"],["script","clientHeight"],["script","/url_key|adHtml/"],["script","pop.target"],["script","axios"],["script","ad block"],["script","AdBlockEnabled"],["script","window.location.replace"],["script","/$.*open/"],["script","queue.addFile"],["script","Brave"],["script","egoTab"],["script","abDetectorPro"],["script","/$.*(css|oncontextmenu)/"],["script","/eval.*RegExp/"],["script","wwads"],["script","/adblock/i"],["script","hasAdblock"],["script","/adshow/ad"],["script","/$.*adUnits/"],["script","decodeURIComponent"],["script","admiral"],["script","RegExp"],["script","adbl"],["script","doOpen"],["script","adsBlocked"],["script","chkADB"],["script","AaDetector"],["script","AdBlock"],["script","antiAdBlockerHandler"],["script","Symbol.iterator"],["script","catch"],["script","/innerHTML.*appendChild/"],["script","Exo"],["script","AdBlock Detected"],["script","detectAdBlock"],["script","deblocker"],["script","popup"],["script","/window\\[\\'open\\'\\]/"],["script","Error"],["script","document.head.appendChild"],["script","/join\\(\\'\\'\\)/"],["script","/join\\(\\\"\\\"\\)/"],["script","api.dataunlocker.com"],["script","/RegExp\\(\\'/","condition","RegExp"],["script","/,\\'gger\\',/"]];

const hostnamesMap = new Map([["teltarif.de",0],["100percentfedup.com",1],["thegatewaypundit.com",1],["apkmirror.com",4],["yts.mx",6],["next-episode.net",9],["eporner.com",10],["sinvida.me",11],["exeo.app",11],["streamnoads.com",11],["searchenginereports.net",12],["trangchu.news",13],["thecustomrom.com",13],["techacode.com",13],["plc247.com",13],["freepasses.org",13],["oko.sh",14],["bigbtc.win",15],["cryptofun.space",15],["sexo5k.com",16],["truyen-hentai.com",16],["theshedend.com",17],["doods.pro",17],["ds2play.com",17],["zeroupload.com",17],["streamvid.net",17],["securenetsystems.net",17],["miniwebtool.com",17],["bchtechnologies.com",17],["nishankhatri.xyz",17],["spiegel.de",18],["appnee.com",19],["smutty.com",20],["down.dataaps.com",20],["123enjoy.net",21],["kiemlua.com",22],["makefreecallsonline.com",23],["androjungle.com",23],["bookszone.in",23],["shortix.co",23],["msonglyrics.com",23],["mphealth.online",23],["app-sorteos.com",23],["appsbull.com",23],["diudemy.com",23],["maqal360.com",23],["bokugents.com",23],["ak.sv",24],["atglinks.com",24],["filebox.click",24],["isaidub3.co",24],["playertv.net",24],["reset-scans.com",26],["kienthucrangmieng.com",27],["coin-free.com",27],["btc25.org",27],["btcbitco.in",27],["btcsatoshi.net",27],["cempakajaya.com",27],["crypto4yu.com",27],["gainl.ink",27],["manofadan.com",27],["readbitcoin.org",27],["wiour.com",27],["bitsmagic.fun",27],["ourcoincash.xyz",27],["hynews.biz",27],["everia.club",28],["backfirstwo.site",28],["jewelavid.com",28],["nizarstream.com",28],["beatsnoop.com",29],["fetchpik.com",29],["teachoo.com",30],["cryptowidgets.net",31],["freethemesy.com",[32,33]],["mdn.lol",34],["carsmania.net",35],["carstopia.net",35],["coinsvalue.net",35],["cookinguide.net",35],["freeoseocheck.com",35],["makeupguide.net",35],["topsporter.net",36],["sportshub.to",36],["7xm.xyz",37],["fastupload.io",37],["tii.la",38],["easymc.io",39],["yunjiema.top",39],["hacoos.com",40],["zefoy.com",41],["vidello.net",42],["resizer.myct.jp",43],["gametohkenranbu.sakuraweb.com",44],["jisakuhibi.jp",45],["rank1-media.com",45],["lifematome.blog",46],["fm.sekkaku.net",47],["free-avx.jp",48],["dvdrev.com",49],["betweenjpandkr.blog",50],["nft-media.net",51],["ghacks.net",52],["songspk2.info",53],["truyentranhfull.net",54],["iwatchfriendsonline.net",56],["nectareousoverelate.com",57],["suaurl.com",58],["allmusic.com",59],["androidpolice.com",59],["calculator-online.net",59],["cattime.com",59],["collider.com",59],["comingsoon.net",59],["dogtime.com",59],["dualshockers.com",59],["freeconvert.com",59],["givemesport.com",59],["howtogeek.com",59],["insider-gaming.com",59],["liveandletsfly.com",59],["makeuseof.com",59],["milestomemories.com",59],["momtastic.com",59],["nordot.app",59],["qtoptens.com",59],["screenrant.com",59],["sherdog.com",59],["superherohype.com",59],["thefashionspot.com",59],["timesnews.net",59],["xda-developers.com",59],["khoaiphim.com",60],["haafedk2.com",61],["fordownloader.com",61],["jovemnerd.com.br",62],["nicomanga.com",63],["totalcsgo.com",64],["vivamax.asia",65],["manysex.com",66],["gaminginfos.com",67],["tinxahoivn.com",68],["freeroms.com",69],["forums-fastunlock.com",70],["automoto.it",71],["sekaikomik.bio",72],["codelivly.com",73],["ophim.vip",74],["touguatize.monster",75],["novelhall.com",76],["hes-goal.net",77],["biblestudytools.com",78],["kuponigo.com",79],["kimcilonly.site",80],["kimcilonly.link",80],["webhostingpost.com",81],["tophostingapp.com",81],["digitalmarktrend.com",81],["cryptoearns.com",82],["inxxx.com",83],["ipaspot.app",84],["embedwish.com",85],["filelions.live",85],["leakslove.net",85],["jenismac.com",86],["vxetable.cn",87],["snapwordz.com",88],["toolxox.com",88],["rl6mans.com",88],["idol69.net",88],["sabornutritivo.com",89],["usandoapp.com",90],["fazercurriculo.online",90],["plumbersforums.net",91],["123movies800.online",92],["cbr.com",93],["gamerant.com",93],["gulio.site",94],["mediaset.es",95],["izlekolik.net",96],["donghuaworld.com",97],["letsdopuzzles.com",98],["nopay2.info",99],["tainio-mania.online",99],["hes-goals.io",100],["sigmalinks.in",101],["rediff.com",102],["iconicblogger.com",103],["dzapk.com",104],["darknessporn.com",105],["familyporner.com",105],["freepublicporn.com",105],["pisshamster.com",105],["punishworld.com",105],["xanimu.com",105],["tekkenmods.com",106],["pig69.com",107],["porninblack.com",108],["javhdo.net",109],["eroticmoviesonline.me",110],["teleclub.xyz",111],["ecamrips.com",112],["showcamrips.com",112],["botcomics.com",113],["cefirates.com",113],["chandlerorchards.com",113],["comicleaks.com",113],["marketdata.app",113],["monumentmetals.com",113],["tapmyback.com",113],["ping.gg",113],["revistaferramental.com.br",113],["hawpar.com",113],["alpacafinance.org",[113,114]],["nookgaming.com",113],["enkeleksamen.no",113],["kvest.ee",113],["creatordrop.com",113],["panpots.com",113],["cybernetman.com",113],["bitdomain.biz",113],["gerardbosch.xyz",113],["fort-shop.kiev.ua",113],["accuretawealth.com",113],["resourceya.com",113],["tracktheta.com",113],["tt.live",114],["future-fortune.com",114],["abhijith.page",114],["madrigalmaps.com",114],["adventuretix.com",114],["panprices.com",115],["intercity.technology",115],["freelancer.taxmachine.be",115],["adria.gg",115],["fjlaboratories.com",115],["tapewithadblock.org",116],["djxmaza.in",117],["miuiflash.com",117],["thecubexguide.com",117]]);

const entitiesMap = new Map([["1337x",2],["kimcartoon",3],["pahe",5],["soap2day",5],["hqq",7],["waaw",7],["pixhost",8],["viprow",11],["dood",17],["doodstream",17],["dooood",17],["eplayvid",21],["poplinks",23],["cricstream",24],["dropgalaxy",24],["o2tvseries",24],["o2tvseriesz",24],["kickass",25],["actvid",55]]);

const exceptionsMap = new Map([]);

/******************************************************************************/

function removeNodeText(
    nodeName,
    condition,
    ...extraArgs
) {
    replaceNodeTextFn(nodeName, '', '', 'condition', condition || '', ...extraArgs);
}

function replaceNodeTextFn(
    nodeName = '',
    pattern = '',
    replacement = ''
) {
    const safe = safeSelf();
    const reNodeName = safe.patternToRegex(nodeName, 'i', true);
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
            safe.uboLog('replace-node-text.fn before:\n', before);
            safe.uboLog('replace-node-text.fn after:\n', after);
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
        'Array_from': Array.from,
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
        'JSON_parse': self.JSON.parse.bind(self.JSON),
        'JSON_stringify': self.JSON.stringify.bind(self.JSON),
        'log': console.log.bind(console),
        uboLog(...args) {
            if ( scriptletGlobals.has('canDebug') === false ) { return; }
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
        patternToRegex(pattern, flags = undefined, verbatim = false) {
            if ( pattern === '' ) { return /^/; }
            const match = /^\/(.+)\/([gimsu]*)$/.exec(pattern);
            if ( match === null ) {
                const reStr = pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                return new RegExp(verbatim ? `^${reStr}$` : reStr, flags);
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

const targetWorld = 'ISOLATED';

// Not Firefox
if ( typeof wrappedJSObject !== 'object' || targetWorld === 'ISOLATED' ) {
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
