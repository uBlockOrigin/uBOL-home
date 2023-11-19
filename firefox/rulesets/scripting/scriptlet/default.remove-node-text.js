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

const argsList = [["script","/getAdUnitPath|\\.then\\(eval\\)|DisplayAcceptableAdIfAdblocked|,eval\\)\\)\\)\\;|\\.join\\(\\'\\'\\)\\}\\;/"],["script","/==undefined.*body/"],["script","style"],["script","Number.isSafeInteger"],["script","/style:last-of-type|:empty|APKM\\..+?\\.innerHTML/"],["script","Reflect"],["script","document.write"],["script","self == top"],["script","mdp"],["script","exdynsrv"],["script","/onerror|adsbygoogle|notice|while/i"],["script","/adb/i"],["script","FingerprintJS"],["script","/check_if_blocking|XMLHttpRequest|adkiller/"],["script","/document\\.createElement|\\.banner-in/"],["script","/block-adb|-0x|adblock/"],["script","ExoLoader"],["script","adblock"],["script","homad"],["script","alert"],["script","/\\.onerror|document\\.write|Error|sbmt|isMobileBrowser|navigator\\.userAgent|InstallTrigger|userTimezoneOffset=userDate|div-gpt-ad-dropgalaxycom/"],["script","window.open"],["script","break;case $"],["script","Adblock"],["script","onerror"],["script","toast"],["script","break;case $."],["style","text-decoration"],["script","/replace|adsbygoogle/"],["script","htmls"],["script","/\\[\\'push\\'\\]/"],["script","popunder"],["script","googlesyndication"],["script","/adblock|location\\.replace/"],["script","numberPages"],["script","KCgpPT57bGV0IGU"],["script","adBlockDetected"],["script","replaceChild"],["#text","/^AD:/"],["script","checkifscript"],["script","/window\\.location|Adblock/"],["script","/ConsoleBan|alert|AdBlocker/"],["script","AdBlocker"],["script","adb_detected"],["script","adb"],["script","await fetch"],["script","/'.adsbygoogle'|text-danger|warning|Adblock|_0x/"],["script","popUnder"],["#text","/スポンサーリンク|Sponsored Link|广告/"],["#text","スポンサーリンク"],["#text","スポンサードリンク"],["#text","/\\[vkExUnit_ad area=(after|before)\\]/"],["#text","【広告】"],["#text","【PR】"],["#text","関連動画"],["#text","PR:"],["script","leave_recommend"],["#text","/^Advertisement$/"],["script","zfgloaded"],["script","ai_adb"],["script","HTMLAllCollection"],["script","liedetector"],["script","popWin"],["script","/window\\.open|window\\.location\\.href|document\\.addEventListener|\\$\\(document\\)\\.ready.*show/"],["script","end_click"],["script","ad blocker"],["script","closeAd"],["script","/modal|popupads/"],["script","/adconfig/i"],["script","AdblockDetector"],["script","is_antiblock_refresh"],["script","/userAgent|adb|htmls/"],["script","myModal"],["script","ad_block"],["script","app_checkext"],["script","shown_at"],["script","clientHeight"],["script","/url_key|adHtml/"],["script","pop.target"],["script","axios"],["script","ad block"],["script","/typeof [a-z]\\.cmd\\.unshift/","condition","cmd.unshift"],["script","admiral"],["script","AdBlockEnabled"],["script","window.location.replace"],["script","/$.*open/"],["script","queue.addFile"],["script","Brave"],["script","egoTab"],["script","abDetectorPro"],["script","/$.*(css|oncontextmenu)/"],["script","/eval.*RegExp/"],["script","wwads"],["script","/adblock/i"],["script","/adshow/ad"],["script","/$.*adUnits/"],["script","decodeURIComponent"],["script","RegExp"],["script","adbl"],["script","doOpen"],["script","adsBlocked"],["script","chkADB"],["script","AaDetector"],["script","AdBlock"],["script","antiAdBlockerHandler"],["script","Symbol.iterator"],["script","catch"],["script","/innerHTML.*appendChild/"],["script","Exo"],["script","AdBlock Detected"],["script","detectAdBlock"],["script","deblocker"],["script","popup"],["script","/window\\[\\'open\\'\\]/"],["script","Error"],["script","AdbModel"],["script","document.head.appendChild"],["script","/join\\(\\'\\'\\)/"],["script","/join\\(\\\"\\\"\\)/"],["script","api.dataunlocker.com"],["script","/RegExp\\(\\'/","condition","RegExp"]];

const hostnamesMap = new Map([["teltarif.de",0],["100percentfedup.com",1],["thegatewaypundit.com",1],["apkmirror.com",[4,35]],["yts.mx",6],["pinsystem.co.uk",8],["downfile.site",8],["trangchu.news",8],["3dmodelshare.org",8],["nulleb.com",8],["thecustomrom.com",8],["bingotingo.com",8],["techacode.com",8],["plc247.com",8],["freepasses.org",8],["tomarnarede.pt",8],["next-episode.net",10],["eporner.com",11],["sinvida.me",12],["exeo.app",12],["streamnoads.com",12],["searchenginereports.net",13],["oko.sh",14],["bigbtc.win",15],["cryptofun.space",15],["sexo5k.com",16],["truyen-hentai.com",16],["theshedend.com",17],["doods.pro",17],["ds2play.com",17],["zeroupload.com",17],["streamvid.net",17],["securenetsystems.net",17],["miniwebtool.com",17],["bchtechnologies.com",17],["spiegel.de",18],["appnee.com",19],["smutty.com",21],["down.dataaps.com",21],["123enjoy.net",22],["kiemlua.com",23],["makefreecallsonline.com",24],["androjungle.com",24],["bookszone.in",24],["drakescans.com",24],["shortix.co",24],["msonglyrics.com",24],["mphealth.online",24],["app-sorteos.com",24],["appsbull.com",24],["diudemy.com",24],["maqal360.com",24],["bokugents.com",24],["aylink.co",25],["ak.sv",26],["atglinks.com",26],["filebox.click",26],["isaidub3.co",26],["playertv.net",26],["reset-scans.com",28],["kienthucrangmieng.com",29],["coin-free.com",29],["tremamnon.com",29],["btc25.org",29],["tron-free.com",29],["btcbitco.in",29],["btcsatoshi.net",29],["cempakajaya.com",29],["crypto4yu.com",29],["gainl.ink",29],["manofadan.com",29],["readbitcoin.org",29],["wiour.com",29],["bitsmagic.fun",29],["ourcoincash.xyz",29],["hynews.biz",29],["everia.club",30],["backfirstwo.site",30],["jewelavid.com",30],["nizarstream.com",30],["freeroms.com",31],["soap2day-online.com",31],["beatsnoop.com",32],["fetchpik.com",32],["hackerranksolution.in",32],["austiblox.net",33],["teachoo.com",34],["genshinlab.com",35],["fourfourtwo.co.kr",35],["interfootball.co.kr",35],["a-ha.io",35],["cboard.net",35],["mobilitytv.co.kr",35],["mememedia.co.kr",35],["newautopost.co.kr",35],["tvreport.co.kr",35],["tenbizt.com",35],["jjang0u.com",35],["joongdo.co.kr",35],["viva100.com",35],["dotkeypress.kr",35],["viewcash.co.kr",35],["tripplus.co.kr",35],["enterdiary.com",35],["mtodayauto.com",35],["hotplacehunter.co.kr",35],["mystylezip.com",35],["majorgeeks.com",35],["poro.gg",35],["maple.gg",35],["lolchess.gg",35],["dak.gg",35],["cryptowidgets.net",36],["freethemesy.com",[37,38]],["djxmaza.in",39],["miuiflash.com",39],["thecubexguide.com",39],["carsmania.net",40],["carstopia.net",40],["coinsvalue.net",40],["cookinguide.net",40],["freeoseocheck.com",40],["makeupguide.net",40],["topsporter.net",41],["sportshub.to",41],["7xm.xyz",42],["fastupload.io",42],["azmath.info",42],["tii.la",43],["easymc.io",44],["yunjiema.top",44],["hacoos.com",45],["zefoy.com",46],["vidello.net",47],["resizer.myct.jp",48],["gametohkenranbu.sakuraweb.com",49],["jisakuhibi.jp",50],["rank1-media.com",50],["lifematome.blog",51],["fm.sekkaku.net",52],["free-avx.jp",53],["dvdrev.com",54],["betweenjpandkr.blog",55],["nft-media.net",56],["ghacks.net",57],["songspk2.info",58],["truyentranhfull.net",59],["iwatchfriendsonline.net",61],["nectareousoverelate.com",62],["suaurl.com",63],["khoaiphim.com",64],["haafedk2.com",65],["fordownloader.com",65],["jovemnerd.com.br",66],["nicomanga.com",67],["totalcsgo.com",68],["vivamax.asia",69],["manysex.com",70],["gaminginfos.com",71],["tinxahoivn.com",72],["forums-fastunlock.com",73],["automoto.it",74],["sekaikomik.bio",75],["codelivly.com",76],["ophim.vip",77],["touguatize.monster",78],["novelhall.com",79],["hes-goal.net",80],["allmusic.com",81],["androidpolice.com",81],["calculator-online.net",81],["cattime.com",81],["collider.com",81],["comingsoon.net",81],["dogtime.com",81],["dualshockers.com",81],["freeconvert.com",81],["gfinityesports.com",81],["givemesport.com",81],["howtogeek.com",81],["insider-gaming.com",81],["liveandletsfly.com",81],["makeuseof.com",81],["milestomemories.com",81],["momtastic.com",81],["nordot.app",81],["qtoptens.com",81],["screenrant.com",81],["sherdog.com",81],["superherohype.com",81],["thefashionspot.com",81],["timesnews.net",81],["xda-developers.com",81],["chaptercheats.com",81],["cheatsheet.com",82],["gamerant.com",82],["cbr.com",82],["biblestudytools.com",83],["christianheadlines.com",83],["ibelieve.com",83],["kuponigo.com",84],["kimcilonly.site",85],["kimcilonly.link",85],["webhostingpost.com",86],["tophostingapp.com",86],["digitalmarktrend.com",86],["cryptoearns.com",87],["inxxx.com",88],["ipaspot.app",89],["embedwish.com",90],["filelions.live",90],["leakslove.net",90],["jenismac.com",91],["vxetable.cn",92],["snapwordz.com",93],["toolxox.com",93],["rl6mans.com",93],["idol69.net",93],["usandoapp.com",94],["fazercurriculo.online",94],["plumbersforums.net",95],["123movies800.online",96],["gulio.site",97],["mediaset.es",98],["izlekolik.net",99],["donghuaworld.com",100],["letsdopuzzles.com",101],["nopay2.info",102],["tainio-mania.online",102],["hes-goals.io",103],["sigmalinks.in",104],["rediff.com",105],["iconicblogger.com",106],["dzapk.com",107],["darknessporn.com",108],["familyporner.com",108],["freepublicporn.com",108],["pisshamster.com",108],["punishworld.com",108],["xanimu.com",108],["tekkenmods.com",109],["pig69.com",110],["porninblack.com",111],["javhdo.net",112],["eroticmoviesonline.me",113],["teleclub.xyz",114],["sugarona.com",115],["nishankhatri.xyz",115],["highkeyfinance.com",115],["ecamrips.com",116],["showcamrips.com",116],["botcomics.com",117],["cefirates.com",117],["chandlerorchards.com",117],["comicleaks.com",117],["marketdata.app",117],["monumentmetals.com",117],["tapmyback.com",117],["ping.gg",117],["revistaferramental.com.br",117],["hawpar.com",117],["alpacafinance.org",[117,118]],["nookgaming.com",117],["enkeleksamen.no",117],["kvest.ee",117],["creatordrop.com",117],["panpots.com",117],["cybernetman.com",117],["bitdomain.biz",117],["gerardbosch.xyz",117],["fort-shop.kiev.ua",117],["accuretawealth.com",117],["resourceya.com",117],["tracktheta.com",117],["tt.live",118],["future-fortune.com",118],["abhijith.page",118],["madrigalmaps.com",118],["adventuretix.com",118],["panprices.com",119],["intercity.technology",119],["freelancer.taxmachine.be",119],["adria.gg",119],["fjlaboratories.com",119],["tapewithadblock.org",120]]);

const entitiesMap = new Map([["1337x",2],["kimcartoon",3],["pahe",5],["soap2day",5],["hqq",7],["waaw",7],["pixhost",9],["viprow",12],["dood",17],["doodstream",17],["dooood",17],["dropgalaxy",[20,26]],["shrinke",21],["shrinkme",21],["eplayvid",22],["poplinks",24],["cricstream",26],["o2tvseries",26],["o2tvseriesz",26],["kickass",27],["watchomovies",31],["actvid",60]]);

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
