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

const argsList = [["script","/getAdUnitPath|\\.then\\(eval\\)|DisplayAcceptableAdIfAdblocked|,eval\\)\\)\\)\\;|\\.join\\(\\'\\'\\)\\}\\;/"],["script","/==undefined.*body/"],["script","style"],["script","Number.isSafeInteger"],["script","/style:last-of-type|:empty|APKM\\..+?\\.innerHTML/"],["script","Reflect"],["script","document.write"],["script","self == top"],["script","exdynsrv"],["script","/onerror|adsbygoogle|notice|while/i"],["script","/adb/i"],["script","FingerprintJS"],["script","/check_if_blocking|XMLHttpRequest|adkiller/"],["script","mdp"],["script","/document\\.createElement|\\.banner-in/"],["script","/block-adb|-0x|adblock/"],["script","ExoLoader"],["script","adblock"],["script","homad"],["script","alert"],["script","window.open"],["script","break;case $"],["script","Adblock"],["script","onerror"],["script","toast"],["script","break;case $."],["style","text-decoration"],["script","/replace|adsbygoogle/"],["script","htmls"],["script","/\\[\\'push\\'\\]/"],["script","popunder"],["script","googlesyndication"],["script","/adblock|location\\.replace/"],["script","numberPages"],["script","KCgpPT57bGV0IGU"],["script","adBlockDetected"],["script","replaceChild"],["#text","/^AD:/"],["script","documnet.write"],["script","/window\\.location|Adblock/"],["script","/ConsoleBan|alert|AdBlocker/"],["script","AdBlocker"],["script","adb_detected"],["script","adb"],["script","await fetch"],["script","/'.adsbygoogle'|text-danger|warning|Adblock|_0x/"],["script","popUnder"],["#text","/スポンサーリンク|Sponsored Link|广告/"],["#text","スポンサーリンク"],["#text","スポンサードリンク"],["#text","/\\[vkExUnit_ad area=(after|before)\\]/"],["#text","【広告】"],["#text","【PR】"],["#text","関連動画"],["#text","PR:"],["script","leave_recommend"],["#text","/^Advertisement$/"],["script","zfgloaded"],["script","ai_adb"],["script","HTMLAllCollection"],["script","liedetector"],["script","popWin"],["script","/window\\.open|window\\.location\\.href|document\\.addEventListener|\\$\\(document\\)\\.ready.*show/"],["script","/typeof [a-z]\\.cmd\\.unshift/","condition","cmd.unshift"],["script","end_click"],["script","ad blocker"],["script","closeAd"],["script","/modal|popupads/"],["script","/adconfig/i"],["script","AdblockDetector"],["script","is_antiblock_refresh"],["script","/userAgent|adb|htmls/"],["script","myModal"],["script","ad_block"],["script","app_checkext"],["script","shown_at"],["script","clientHeight"],["script","/url_key|adHtml/"],["script","pop.target"],["script","axios"],["script","ad block"],["script","AdBlockEnabled"],["script","window.location.replace"],["script","/$.*open/"],["script","queue.addFile"],["script","Brave"],["script","egoTab"],["script","abDetectorPro"],["script","/$.*(css|oncontextmenu)/"],["script","/eval.*RegExp/"],["script","wwads"],["script","/adblock/i"],["script","/adshow/ad"],["script","/$.*adUnits/"],["script","decodeURIComponent"],["script","admiral"],["script","RegExp"],["script","adbl"],["script","doOpen"],["script","adsBlocked"],["script","chkADB"],["script","AaDetector"],["script","AdBlock"],["script","antiAdBlockerHandler"],["script","Symbol.iterator"],["script","catch"],["script","/innerHTML.*appendChild/"],["script","Exo"],["script","AdBlock Detected"],["script","detectAdBlock"],["script","deblocker"],["script","popup"],["script","/window\\[\\'open\\'\\]/"],["script","Error"],["script","document.head.appendChild"],["script","/join\\(\\'\\'\\)/"],["script","/join\\(\\\"\\\"\\)/"],["script","api.dataunlocker.com"],["script","/RegExp\\(\\'/","condition","RegExp"],["script","/,\\'gger\\',/"]];

const hostnamesMap = new Map([["teltarif.de",0],["100percentfedup.com",1],["thegatewaypundit.com",1],["apkmirror.com",[4,34]],["yts.mx",6],["next-episode.net",9],["eporner.com",10],["sinvida.me",11],["exeo.app",11],["streamnoads.com",11],["searchenginereports.net",12],["trangchu.news",13],["3dmodelshare.org",13],["nulleb.com",13],["thecustomrom.com",13],["bingotingo.com",13],["techacode.com",13],["plc247.com",13],["freepasses.org",13],["tomarnarede.pt",13],["oko.sh",14],["bigbtc.win",15],["cryptofun.space",15],["sexo5k.com",16],["truyen-hentai.com",16],["theshedend.com",17],["doods.pro",17],["ds2play.com",17],["zeroupload.com",17],["streamvid.net",17],["securenetsystems.net",17],["miniwebtool.com",17],["bchtechnologies.com",17],["nishankhatri.xyz",17],["spiegel.de",18],["appnee.com",19],["smutty.com",20],["down.dataaps.com",20],["123enjoy.net",21],["kiemlua.com",22],["makefreecallsonline.com",23],["androjungle.com",23],["bookszone.in",23],["drakescans.com",23],["shortix.co",23],["msonglyrics.com",23],["mphealth.online",23],["app-sorteos.com",23],["appsbull.com",23],["diudemy.com",23],["maqal360.com",23],["bokugents.com",23],["aylink.co",24],["ak.sv",25],["atglinks.com",25],["filebox.click",25],["isaidub3.co",25],["playertv.net",25],["reset-scans.com",27],["kienthucrangmieng.com",28],["coin-free.com",28],["btc25.org",28],["btcbitco.in",28],["btcsatoshi.net",28],["cempakajaya.com",28],["crypto4yu.com",28],["gainl.ink",28],["manofadan.com",28],["readbitcoin.org",28],["wiour.com",28],["bitsmagic.fun",28],["ourcoincash.xyz",28],["hynews.biz",28],["everia.club",29],["backfirstwo.site",29],["jewelavid.com",29],["nizarstream.com",29],["freeroms.com",30],["beatsnoop.com",31],["fetchpik.com",31],["austiblox.net",32],["teachoo.com",33],["genshinlab.com",34],["fourfourtwo.co.kr",34],["interfootball.co.kr",34],["a-ha.io",34],["cboard.net",34],["mobilitytv.co.kr",34],["mememedia.co.kr",34],["newautopost.co.kr",34],["tvreport.co.kr",34],["tenbizt.com",34],["jjang0u.com",34],["joongdo.co.kr",34],["viva100.com",34],["dotkeypress.kr",34],["viewcash.co.kr",34],["tripplus.co.kr",34],["enterdiary.com",34],["mtodayauto.com",34],["hotplacehunter.co.kr",34],["mystylezip.com",34],["majorgeeks.com",34],["cryptowidgets.net",35],["freethemesy.com",[36,37]],["mdn.lol",38],["carsmania.net",39],["carstopia.net",39],["coinsvalue.net",39],["cookinguide.net",39],["freeoseocheck.com",39],["makeupguide.net",39],["topsporter.net",40],["sportshub.to",40],["7xm.xyz",41],["fastupload.io",41],["tii.la",42],["easymc.io",43],["yunjiema.top",43],["hacoos.com",44],["zefoy.com",45],["vidello.net",46],["resizer.myct.jp",47],["gametohkenranbu.sakuraweb.com",48],["jisakuhibi.jp",49],["rank1-media.com",49],["lifematome.blog",50],["fm.sekkaku.net",51],["free-avx.jp",52],["dvdrev.com",53],["betweenjpandkr.blog",54],["nft-media.net",55],["ghacks.net",56],["songspk2.info",57],["truyentranhfull.net",58],["iwatchfriendsonline.net",60],["nectareousoverelate.com",61],["suaurl.com",62],["allmusic.com",63],["androidpolice.com",63],["calculator-online.net",63],["cattime.com",63],["collider.com",63],["comingsoon.net",63],["dogtime.com",63],["dualshockers.com",63],["freeconvert.com",63],["givemesport.com",63],["howtogeek.com",63],["insider-gaming.com",63],["liveandletsfly.com",63],["makeuseof.com",63],["milestomemories.com",63],["momtastic.com",63],["nordot.app",63],["qiwi.gg",63],["qtoptens.com",63],["screenrant.com",63],["sherdog.com",63],["superherohype.com",63],["thefashionspot.com",63],["timesnews.net",63],["xda-developers.com",63],["khoaiphim.com",64],["haafedk2.com",65],["fordownloader.com",65],["jovemnerd.com.br",66],["nicomanga.com",67],["totalcsgo.com",68],["vivamax.asia",69],["manysex.com",70],["gaminginfos.com",71],["tinxahoivn.com",72],["forums-fastunlock.com",73],["automoto.it",74],["sekaikomik.bio",75],["codelivly.com",76],["ophim.vip",77],["touguatize.monster",78],["novelhall.com",79],["hes-goal.net",80],["biblestudytools.com",81],["kuponigo.com",82],["kimcilonly.site",83],["kimcilonly.link",83],["webhostingpost.com",84],["tophostingapp.com",84],["digitalmarktrend.com",84],["cryptoearns.com",85],["inxxx.com",86],["ipaspot.app",87],["embedwish.com",88],["filelions.live",88],["leakslove.net",88],["jenismac.com",89],["vxetable.cn",90],["snapwordz.com",91],["toolxox.com",91],["rl6mans.com",91],["idol69.net",91],["usandoapp.com",92],["fazercurriculo.online",92],["plumbersforums.net",93],["123movies800.online",94],["cbr.com",95],["gamerant.com",95],["gulio.site",96],["mediaset.es",97],["izlekolik.net",98],["donghuaworld.com",99],["letsdopuzzles.com",100],["nopay2.info",101],["tainio-mania.online",101],["hes-goals.io",102],["sigmalinks.in",103],["rediff.com",104],["iconicblogger.com",105],["dzapk.com",106],["darknessporn.com",107],["familyporner.com",107],["freepublicporn.com",107],["pisshamster.com",107],["punishworld.com",107],["xanimu.com",107],["tekkenmods.com",108],["pig69.com",109],["porninblack.com",110],["javhdo.net",111],["eroticmoviesonline.me",112],["teleclub.xyz",113],["ecamrips.com",114],["showcamrips.com",114],["botcomics.com",115],["cefirates.com",115],["chandlerorchards.com",115],["comicleaks.com",115],["marketdata.app",115],["monumentmetals.com",115],["tapmyback.com",115],["ping.gg",115],["revistaferramental.com.br",115],["hawpar.com",115],["alpacafinance.org",[115,116]],["nookgaming.com",115],["enkeleksamen.no",115],["kvest.ee",115],["creatordrop.com",115],["panpots.com",115],["cybernetman.com",115],["bitdomain.biz",115],["gerardbosch.xyz",115],["fort-shop.kiev.ua",115],["accuretawealth.com",115],["resourceya.com",115],["tracktheta.com",115],["tt.live",116],["future-fortune.com",116],["abhijith.page",116],["madrigalmaps.com",116],["adventuretix.com",116],["panprices.com",117],["intercity.technology",117],["freelancer.taxmachine.be",117],["adria.gg",117],["fjlaboratories.com",117],["tapewithadblock.org",118],["djxmaza.in",119],["miuiflash.com",119],["thecubexguide.com",119]]);

const entitiesMap = new Map([["1337x",2],["kimcartoon",3],["pahe",5],["soap2day",5],["hqq",7],["waaw",7],["pixhost",8],["viprow",11],["dood",17],["doodstream",17],["dooood",17],["shrinke",20],["shrinkme",20],["eplayvid",21],["poplinks",23],["cricstream",25],["dropgalaxy",25],["o2tvseries",25],["o2tvseriesz",25],["kickass",26],["watchomovies",30],["actvid",59]]);

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
    const reCondition = safe.patternToRegex(extraArgs.condition || '', 'ms');
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
        reCondition.lastIndex = 0;
        if ( safe.RegExp_test.call(reCondition, before) === false ) { return true; }
        rePattern.lastIndex = 0;
        if ( safe.RegExp_test.call(rePattern, before) === false ) { return true; }
        rePattern.lastIndex = 0;
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
        'Function_toStringFn': self.Function.prototype.toString,
        'Function_toString': thisArg => safe.Function_toStringFn.call(thisArg),
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
        'JSON': self.JSON,
        'JSON_parseFn': self.JSON.parse,
        'JSON_stringifyFn': self.JSON.stringify,
        'JSON_parse': (...args) => safe.JSON_parseFn.call(safe.JSON, ...args),
        'JSON_stringify': (...args) => safe.JSON_stringifyFn.call(safe.JSON, ...args),
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
