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

const argsList = [["script","/getAdUnitPath|\\.then\\(eval\\)|DisplayAcceptableAdIfAdblocked|,eval\\)\\)\\)\\;|\\.join\\(\\'\\'\\)\\}\\;/"],["script","/==undefined.*body/"],["script","style"],["script","Number.isSafeInteger"],["script","/style:last-of-type|:empty|APKM\\..+?\\.innerHTML/"],["script","Reflect"],["script","document.write"],["script","self == top"],["script","mdp"],["script","exdynsrv"],["script","/onerror|adsbygoogle|notice|while/i"],["script","/adb/i"],["script","FingerprintJS"],["script","/check_if_blocking|XMLHttpRequest|adkiller/"],["script","/document\\.createElement|\\.banner-in/"],["script","/block-adb|-0x|adblock/"],["script","ExoLoader"],["script","adblock"],["script","homad"],["script","alert"],["script","/\\.onerror|document\\.write|Error|sbmt|isMobileBrowser|navigator\\.userAgent|InstallTrigger|userTimezoneOffset=userDate|div-gpt-ad-dropgalaxycom/"],["script","window.open"],["script","break;case $"],["script","Adblock"],["script","onerror"],["script","toast"],["script","break;case $."],["style","text-decoration"],["script","/replace|adsbygoogle/"],["script","htmls"],["script","checkifscript"],["script","/\\[\\'push\\'\\]/"],["script","popunder"],["script","googlesyndication"],["script","/adblock|location\\.replace/"],["script","/downloadJSAtOnload|Object.prototype.toString.call/"],["script","numberPages"],["script","KCgpPT57bGV0IGU"],["script","adBlockDetected"],["script","/window\\.location|Adblock/"],["script","queue.addFile"],["script","/ConsoleBan|alert|AdBlocker/"],["script","AdBlocker"],["script","fetch"],["script","adb_detected"],["script","adb"],["script","await fetch"],["script","innerHTML"],["script","/'.adsbygoogle'|text-danger|warning|Adblock|_0x/"],["script","popUnder"],["#text","/スポンサーリンク|Sponsored Link|广告/"],["#text","スポンサーリンク"],["#text","スポンサードリンク"],["#text","/\\[vkExUnit_ad area=(after|before)\\]/"],["#text","【広告】"],["#text","【PR】"],["#text","関連動画"],["#text","PR:"],["script","leave_recommend"],["#text","/^Advertisement$/"],["script","zfgloaded"],["script","ai_adb"],["script","HTMLAllCollection"],["script","liedetector"],["script","popWin"],["script","/window\\.open|window\\.location\\.href|document\\.addEventListener|\\$\\(document\\)\\.ready.*show/"],["script","end_click"],["script","ad blocker"],["script","closeAd"],["script","/modal|popupads/"],["script","/adconfig/i"],["script","AdblockDetector"],["script","is_antiblock_refresh"],["script","/userAgent|adb|htmls/"],["script","myModal"],["script","ad_block"],["script","app_checkext"],["script","shown_at"],["script","clientHeight"],["script","/url_key|adHtml/"],["script","pop.target"],["script","axios"],["script","ad block"],["script","/typeof [a-z]\\.cmd\\.unshift/","condition","cmd.unshift"],["script","admiral"],["script","AdBlockEnabled"],["script","window.location.replace"],["script","/$.*open/"],["script","Brave"],["script","egoTab"],["script","abDetectorPro"],["script","/$.*(css|oncontextmenu)/"],["script","/eval.*RegExp/"],["script","wwads"],["script","/adblock/i"],["script","/adshow/ad"],["script","/$.*adUnits/"],["script","decodeURIComponent"],["script","RegExp"],["script","adbl"],["script","doOpen"],["script","adsBlocked"],["script","chkADB"],["script","AaDetector"],["script","AdBlock"],["script","antiAdBlockerHandler"],["script","Symbol.iterator"],["script","catch"],["script","/innerHTML.*appendChild/"],["script","Exo"],["script","AdBlock Detected"],["script","detectAdBlock"],["script","deblocker"],["script","popup"],["script","/window\\[\\'open\\'\\]/"],["script","Error"],["script","AdbModel"],["script","document.head.appendChild"],["script","Number"],["script","ad-block-activated"],["script","insertBefore"],["script","pop.doEvent"],["script","/join\\(\\'\\'\\)/"],["script","/join\\(\\\"\\\"\\)/"],["script","api.dataunlocker.com"],["script","/RegExp\\(\\'/","condition","RegExp"],["script","/await\\fetch|navigator\\.userAgent/"],["script","/charAt|_0x/"]];

const hostnamesMap = new Map([["teltarif.de",0],["100percentfedup.com",1],["thegatewaypundit.com",1],["apkmirror.com",[4,37]],["yts.mx",6],["pinsystem.co.uk",8],["downfile.site",8],["expertvn.com",8],["trangchu.news",8],["3dmodelshare.org",8],["nulleb.com",8],["thecustomrom.com",8],["bingotingo.com",8],["techacode.com",8],["plc247.com",8],["loaninsurehub.com",8],["freepasses.org",8],["tomarnarede.pt",8],["next-episode.net",10],["eporner.com",11],["sinvida.me",12],["exeo.app",12],["streamnoads.com",12],["megaup.net",12],["searchenginereports.net",13],["oko.sh",14],["bigbtc.win",15],["cryptofun.space",15],["sexo5k.com",16],["truyen-hentai.com",16],["theshedend.com",17],["doods.pro",17],["ds2play.com",17],["zeroupload.com",17],["streamvid.net",17],["securenetsystems.net",17],["miniwebtool.com",17],["bchtechnologies.com",17],["spiegel.de",18],["appnee.com",19],["smutty.com",21],["down.dataaps.com",21],["123enjoy.net",22],["kiemlua.com",23],["makefreecallsonline.com",24],["androjungle.com",24],["bookszone.in",24],["drakescans.com",24],["shortix.co",24],["msonglyrics.com",24],["mphealth.online",24],["app-sorteos.com",24],["appsbull.com",24],["diudemy.com",24],["maqal360.com",24],["bokugents.com",24],["aylink.co",25],["ak.sv",26],["atglinks.com",26],["filebox.click",26],["filmesonlinexhd.biz",26],["isaidub3.co",26],["playertv.net",26],["reset-scans.com",28],["kienthucrangmieng.com",29],["coin-free.com",29],["tremamnon.com",29],["btc25.org",29],["tron-free.com",29],["btcbitco.in",29],["btcsatoshi.net",29],["cempakajaya.com",29],["crypto4yu.com",29],["gainl.ink",29],["manofadan.com",29],["readbitcoin.org",29],["wiour.com",29],["bitsmagic.fun",29],["ourcoincash.xyz",29],["hynews.biz",29],["djxmaza.in",30],["miuiflash.com",30],["thecubexguide.com",30],["everia.club",31],["backfirstwo.site",31],["jewelavid.com",31],["nizarstream.com",31],["freeroms.com",32],["soap2day-online.com",32],["beatsnoop.com",33],["fetchpik.com",33],["hackerranksolution.in",33],["austiblox.net",34],["btcbunch.com",35],["teachoo.com",36],["genshinlab.com",37],["fourfourtwo.co.kr",37],["interfootball.co.kr",37],["a-ha.io",37],["cboard.net",37],["mobilitytv.co.kr",37],["mememedia.co.kr",37],["newautopost.co.kr",37],["tvreport.co.kr",37],["tenbizt.com",37],["jjang0u.com",37],["joongdo.co.kr",37],["viva100.com",37],["thephoblographer.com",37],["newdaily.co.kr",37],["dogdrip.net",37],["dotkeypress.kr",37],["viewcash.co.kr",37],["tripplus.co.kr",37],["enterdiary.com",37],["mtodayauto.com",37],["hotplacehunter.co.kr",37],["mystylezip.com",37],["majorgeeks.com",37],["poro.gg",37],["maple.gg",37],["lolchess.gg",37],["dak.gg",37],["meconomynews.com",37],["brandbrief.co.kr",37],["dfast.kr",37],["youtu.co",37],["cryptowidgets.net",38],["carsmania.net",39],["carstopia.net",39],["coinsvalue.net",39],["cookinguide.net",39],["freeoseocheck.com",39],["makeupguide.net",39],["webhostingpost.com",40],["tophostingapp.com",40],["digitalmarktrend.com",40],["topsporter.net",41],["sportshub.to",41],["7xm.xyz",42],["fastupload.io",42],["azmath.info",42],["claimclicks.com",43],["tii.la",44],["easymc.io",45],["yunjiema.top",45],["hacoos.com",46],["bondagevalley.cc",47],["zefoy.com",48],["vidello.net",49],["resizer.myct.jp",50],["gametohkenranbu.sakuraweb.com",51],["jisakuhibi.jp",52],["rank1-media.com",52],["lifematome.blog",53],["fm.sekkaku.net",54],["free-avx.jp",55],["dvdrev.com",56],["betweenjpandkr.blog",57],["nft-media.net",58],["ghacks.net",59],["songspk2.info",60],["truyentranhfull.net",61],["iwatchfriendsonline.net",63],["nectareousoverelate.com",64],["suaurl.com",65],["khoaiphim.com",66],["haafedk2.com",67],["fordownloader.com",67],["jovemnerd.com.br",68],["nicomanga.com",69],["totalcsgo.com",70],["vivamax.asia",71],["manysex.com",72],["gaminginfos.com",73],["tinxahoivn.com",74],["forums-fastunlock.com",75],["automoto.it",76],["sekaikomik.bio",77],["codelivly.com",78],["ophim.vip",79],["touguatize.monster",80],["novelhall.com",81],["hes-goal.net",82],["allmusic.com",83],["androidpolice.com",83],["calculator-online.net",83],["cattime.com",83],["cbssports.com",83],["collider.com",83],["comingsoon.net",83],["dogtime.com",83],["dualshockers.com",83],["freeconvert.com",83],["gfinityesports.com",83],["givemesport.com",83],["howtogeek.com",83],["insider-gaming.com",83],["liveandletsfly.com",83],["makeuseof.com",83],["milestomemories.com",83],["momtastic.com",83],["nordot.app",83],["nypost.com",83],["qtoptens.com",83],["screenrant.com",83],["sherdog.com",83],["superherohype.com",83],["thefashionspot.com",83],["timesnews.net",83],["xda-developers.com",83],["chaptercheats.com",83],["cheatsheet.com",84],["gamerant.com",84],["cbr.com",84],["biblestudytools.com",85],["christianheadlines.com",85],["ibelieve.com",85],["kuponigo.com",86],["kimcilonly.site",87],["kimcilonly.link",87],["cryptoearns.com",88],["inxxx.com",89],["ipaspot.app",90],["embedwish.com",91],["filelions.live",91],["leakslove.net",91],["jenismac.com",92],["vxetable.cn",93],["snapwordz.com",94],["toolxox.com",94],["rl6mans.com",94],["idol69.net",94],["usandoapp.com",95],["fazercurriculo.online",95],["plumbersforums.net",96],["123movies800.online",97],["gulio.site",98],["mediaset.es",99],["izlekolik.net",100],["donghuaworld.com",101],["letsdopuzzles.com",102],["nopay2.info",103],["tainio-mania.online",103],["hes-goals.io",104],["sigmalinks.in",105],["rediff.com",106],["iconicblogger.com",107],["dzapk.com",108],["darknessporn.com",109],["familyporner.com",109],["freepublicporn.com",109],["pisshamster.com",109],["punishworld.com",109],["xanimu.com",109],["tekkenmods.com",110],["pig69.com",111],["porninblack.com",112],["javhdo.net",113],["eroticmoviesonline.me",114],["teleclub.xyz",115],["sugarona.com",116],["nishankhatri.xyz",116],["highkeyfinance.com",116],["ecamrips.com",117],["showcamrips.com",117],["9animetv.to",118],["jornadaperfecta.com",119],["loseart.com",120],["sousou-no-frieren.com",121],["botcomics.com",122],["cefirates.com",122],["chandlerorchards.com",122],["comicleaks.com",122],["marketdata.app",122],["monumentmetals.com",122],["tapmyback.com",122],["ping.gg",122],["revistaferramental.com.br",122],["hawpar.com",122],["alpacafinance.org",[122,123]],["nookgaming.com",122],["enkeleksamen.no",122],["kvest.ee",122],["creatordrop.com",122],["panpots.com",122],["cybernetman.com",122],["bitdomain.biz",122],["gerardbosch.xyz",122],["fort-shop.kiev.ua",122],["accuretawealth.com",122],["resourceya.com",122],["tracktheta.com",122],["tt.live",123],["future-fortune.com",123],["abhijith.page",123],["madrigalmaps.com",123],["adventuretix.com",123],["panprices.com",124],["intercity.technology",124],["freelancer.taxmachine.be",124],["adria.gg",124],["fjlaboratories.com",124],["tapewithadblock.org",125],["infinityscans.xyz",[126,127]]]);

const entitiesMap = new Map([["1337x",2],["kimcartoon",3],["pahe",5],["soap2day",5],["hqq",7],["waaw",7],["pixhost",9],["viprow",12],["dood",17],["doodstream",17],["dooood",17],["dropgalaxy",[20,26]],["shrinke",21],["shrinkme",21],["eplayvid",22],["poplinks",24],["cricstream",26],["o2tvseries",26],["o2tvseriesz",26],["kickass",27],["watchomovies",32],["actvid",62]]);

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
        'Math_max': Math.max,
        'Math_min': Math.min,
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
