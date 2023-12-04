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

const argsList = [["script","/getAdUnitPath|\\.then\\(eval\\)|DisplayAcceptableAdIfAdblocked|,eval\\)\\)\\)\\;|\\.join\\(\\'\\'\\)\\}\\;/"],["script","/==undefined.*body/"],["script","style"],["script","Promise"],["script","Number.isSafeInteger"],["script","/style:last-of-type|:empty|APKM\\..+?\\.innerHTML/"],["script","Reflect"],["script","document.write"],["script","self == top"],["script","/popunder|isAdBlock|admvn.src/i"],["script","mdp"],["script","exdynsrv"],["script","/onerror|adsbygoogle|notice|while/i"],["script","/adb/i"],["script","FingerprintJS"],["script","/check_if_blocking|XMLHttpRequest|adkiller/"],["script","/document\\.createElement|\\.banner-in/"],["script","/block-adb|-0x|adblock/"],["script","ExoLoader"],["script","adblock"],["script","homad"],["script","alert"],["script","window.open"],["script","break;case $"],["script","Adblock"],["script","onerror"],["script","toast"],["script","break;case $."],["style","text-decoration"],["script","/replace|adsbygoogle/"],["script","htmls"],["#text","AD:"],["script","checkifscript"],["script","/\\[\\'push\\'\\]/"],["script","/popMagic|pop1stp/"],["script","popunder"],["script","googlesyndication"],["script","/adblock|location\\.replace/"],["script","/downloadJSAtOnload|Object.prototype.toString.call/"],["script","numberPages"],["script","KCgpPT57bGV0IGU"],["script","adBlockDetected"],["script","/window\\.location|Adblock/"],["script","googleAdUrl"],["script","queue.addFile"],["script","/ConsoleBan|alert|AdBlocker/"],["script","AdBlocker"],["script","fetch"],["script","adb_detected"],["script","adb"],["script","await fetch"],["script","innerHTML"],["script","/'.adsbygoogle'|text-danger|warning|Adblock|_0x/"],["script","popUnder"],["#text","/スポンサーリンク|Sponsored Link|广告/"],["#text","スポンサーリンク"],["#text","スポンサードリンク"],["#text","/\\[vkExUnit_ad area=(after|before)\\]/"],["#text","【広告】"],["#text","【PR】"],["#text","関連動画"],["#text","PR:"],["script","leave_recommend"],["#text","/^Advertisement$/"],["script","zfgloaded"],["script","ai_adb"],["script","HTMLAllCollection"],["script","liedetector"],["script","popWin"],["script","/window\\.open|window\\.location\\.href|document\\.addEventListener|\\$\\(document\\)\\.ready.*show/"],["script","end_click"],["script","ad blocker"],["script","closeAd"],["script","/modal|popupads/"],["script","/adconfig/i"],["script","AdblockDetector"],["script","is_antiblock_refresh"],["script","/userAgent|adb|htmls/"],["script","myModal"],["script","ad_block"],["script","app_checkext"],["script","shown_at"],["script","clientHeight"],["script","/url_key|adHtml/"],["script","pop.target"],["script","showadblock"],["script","axios"],["script","ad block"],["script","/typeof [a-z]\\.cmd\\.unshift/","condition","cmd.unshift"],["script","admiral"],["script","AdBlockEnabled"],["script","window.location.replace"],["script","/$.*open/"],["script","Brave"],["script","egoTab"],["script","abDetectorPro"],["script","/$.*(css|oncontextmenu)/"],["script","/eval.*RegExp/"],["script","wwads"],["script","/adblock/i"],["script","/adshow/ad"],["script","/$.*adUnits/"],["script","decodeURIComponent"],["script","RegExp"],["script","adbl"],["script","doOpen"],["script","adsBlocked"],["script","chkADB"],["script","AaDetector"],["script","AdBlock"],["script","antiAdBlockerHandler"],["script","Symbol.iterator"],["script","catch"],["script","/innerHTML.*appendChild/"],["script","Exo"],["script","detectAdBlock"],["script","deblocker"],["script","popup"],["script","/window\\[\\'open\\'\\]/"],["script","Error"],["script","AdbModel"],["script","document.head.appendChild"],["script","Number"],["script","ad-block-activated"],["script","insertBefore"],["script","pop.doEvent"],["script","constructor"],["script","/join\\(\\'\\'\\)/"],["script","/join\\(\\\"\\\"\\)/"],["script","api.dataunlocker.com"],["script","/RegExp\\(\\'/","condition","RegExp"]];

const hostnamesMap = new Map([["teltarif.de",0],["100percentfedup.com",1],["thegatewaypundit.com",1],["moviepilot.de",3],["apkmirror.com",[5,40]],["yts.mx",7],["upornia.com",9],["pinsystem.co.uk",10],["tinyppt.com",10],["downfile.site",10],["expertvn.com",10],["trangchu.news",10],["3dmodelshare.org",10],["nulleb.com",10],["thecustomrom.com",10],["bingotingo.com",10],["3dmili.com",10],["techacode.com",10],["plc247.com",10],["loaninsurehub.com",10],["freepasses.org",10],["tomarnarede.pt",10],["next-episode.net",12],["eporner.com",13],["sinvida.me",14],["exeo.app",14],["streamnoads.com",14],["megaup.net",14],["searchenginereports.net",15],["oko.sh",16],["bigbtc.win",17],["cryptofun.space",17],["sexo5k.com",18],["truyen-hentai.com",18],["theshedend.com",19],["doods.pro",19],["ds2play.com",19],["zeroupload.com",19],["streamvid.net",19],["securenetsystems.net",19],["miniwebtool.com",19],["bchtechnologies.com",19],["spiegel.de",20],["appnee.com",21],["smutty.com",22],["down.dataaps.com",22],["filmweb.pl",22],["123enjoy.net",23],["kiemlua.com",24],["makefreecallsonline.com",25],["androjungle.com",25],["bookszone.in",25],["drakescans.com",25],["shortix.co",25],["msonglyrics.com",25],["mphealth.online",25],["app-sorteos.com",25],["appsbull.com",25],["diudemy.com",25],["maqal360.com",25],["bokugents.com",25],["btvplus.bg",25],["aylink.co",26],["ak.sv",27],["atglinks.com",27],["filebox.click",27],["filmesonlinexhd.biz",27],["isaidub3.co",27],["playertv.net",27],["reset-scans.com",29],["kienthucrangmieng.com",30],["coin-free.com",30],["tremamnon.com",30],["btc25.org",30],["tron-free.com",30],["btcbitco.in",30],["btcsatoshi.net",30],["cempakajaya.com",30],["crypto4yu.com",30],["gainl.ink",30],["manofadan.com",30],["readbitcoin.org",30],["wiour.com",30],["bitsmagic.fun",30],["ourcoincash.xyz",30],["hynews.biz",30],["tech24us.com",31],["freethemesy.com",31],["djxmaza.in",32],["miuiflash.com",32],["thecubexguide.com",32],["everia.club",33],["backfirstwo.site",33],["jewelavid.com",33],["nizarstream.com",33],["besthdgayporn.com",34],["freeroms.com",35],["soap2day-online.com",35],["beatsnoop.com",36],["fetchpik.com",36],["hackerranksolution.in",36],["austiblox.net",37],["btcbunch.com",38],["teachoo.com",39],["genshinlab.com",40],["fourfourtwo.co.kr",40],["interfootball.co.kr",40],["a-ha.io",40],["cboard.net",40],["mobilitytv.co.kr",40],["mememedia.co.kr",40],["newautopost.co.kr",40],["tvreport.co.kr",40],["tenbizt.com",40],["jjang0u.com",40],["joongdo.co.kr",40],["viva100.com",40],["thephoblographer.com",40],["newdaily.co.kr",40],["dogdrip.net",40],["golf-live.at",40],["gamingdeputy.com",40],["dotkeypress.kr",40],["viewcash.co.kr",40],["tripplus.co.kr",40],["enterdiary.com",40],["mtodayauto.com",40],["hotplacehunter.co.kr",40],["mystylezip.com",40],["majorgeeks.com",40],["poro.gg",40],["maple.gg",40],["lolchess.gg",40],["dak.gg",40],["meconomynews.com",40],["brandbrief.co.kr",40],["dfast.kr",40],["youtu.co",40],["mlbpark.donga.com",40],["capress.kr",40],["carandmore.co.kr",40],["maxmovie.kr",40],["motorgraph.com",40],["newsbell.co.kr",40],["tminews.co.kr",40],["thehousemagazine.kr",40],["hardreset.info",40],["metabattle.com",40],["golf-meconomynews.com",40],["cryptowidgets.net",41],["carsmania.net",42],["carstopia.net",42],["coinsvalue.net",42],["cookinguide.net",42],["freeoseocheck.com",42],["makeupguide.net",42],["iisfvirtual.in",43],["starxinvestor.com",43],["webhostingpost.com",44],["tophostingapp.com",44],["digitalmarktrend.com",44],["topsporter.net",45],["sportshub.to",45],["7xm.xyz",46],["fastupload.io",46],["azmath.info",46],["claimclicks.com",47],["tii.la",48],["easymc.io",49],["yunjiema.top",49],["hacoos.com",50],["bondagevalley.cc",51],["zefoy.com",52],["vidello.net",53],["resizer.myct.jp",54],["gametohkenranbu.sakuraweb.com",55],["jisakuhibi.jp",56],["rank1-media.com",56],["lifematome.blog",57],["fm.sekkaku.net",58],["free-avx.jp",59],["dvdrev.com",60],["betweenjpandkr.blog",61],["nft-media.net",62],["ghacks.net",63],["songspk2.info",64],["truyentranhfull.net",65],["iwatchfriendsonline.net",67],["nectareousoverelate.com",68],["suaurl.com",69],["khoaiphim.com",70],["haafedk2.com",71],["fordownloader.com",71],["jovemnerd.com.br",72],["nicomanga.com",73],["totalcsgo.com",74],["vivamax.asia",75],["manysex.com",76],["gaminginfos.com",77],["tinxahoivn.com",78],["forums-fastunlock.com",79],["automoto.it",80],["sekaikomik.bio",81],["codelivly.com",82],["ophim.vip",83],["touguatize.monster",84],["client.falixnodes.net",85],["novelhall.com",86],["hes-goal.net",87],["allmusic.com",88],["androidpolice.com",88],["calculator-online.net",88],["cattime.com",88],["cbssports.com",88],["collider.com",88],["comingsoon.net",88],["dogtime.com",88],["dualshockers.com",88],["freeconvert.com",88],["gfinityesports.com",88],["givemesport.com",88],["howtogeek.com",88],["insider-gaming.com",88],["liveandletsfly.com",88],["makeuseof.com",88],["milestomemories.com",88],["momtastic.com",88],["nordot.app",88],["nypost.com",88],["qtoptens.com",88],["screenrant.com",88],["sherdog.com",88],["superherohype.com",88],["thefashionspot.com",88],["timesnews.net",88],["xda-developers.com",88],["chaptercheats.com",88],["cheatsheet.com",89],["gamerant.com",89],["cbr.com",89],["pwinsider.com",89],["biblestudytools.com",90],["christianheadlines.com",90],["ibelieve.com",90],["kuponigo.com",91],["kimcilonly.site",92],["kimcilonly.link",92],["cryptoearns.com",93],["inxxx.com",94],["ipaspot.app",95],["embedwish.com",96],["filelions.live",96],["leakslove.net",96],["jenismac.com",97],["vxetable.cn",98],["snapwordz.com",99],["toolxox.com",99],["rl6mans.com",99],["idol69.net",99],["usandoapp.com",100],["fazercurriculo.online",100],["plumbersforums.net",101],["123movies800.online",102],["gulio.site",103],["mediaset.es",104],["izlekolik.net",105],["donghuaworld.com",106],["letsdopuzzles.com",107],["nopay2.info",108],["tainio-mania.online",108],["hes-goals.io",109],["sigmalinks.in",110],["rediff.com",111],["iconicblogger.com",112],["dzapk.com",113],["darknessporn.com",114],["familyporner.com",114],["freepublicporn.com",114],["pisshamster.com",114],["punishworld.com",114],["xanimu.com",114],["pig69.com",115],["porninblack.com",116],["javhdo.net",117],["eroticmoviesonline.me",118],["teleclub.xyz",119],["sugarona.com",120],["nishankhatri.xyz",120],["highkeyfinance.com",120],["ecamrips.com",121],["showcamrips.com",121],["9animetv.to",122],["jornadaperfecta.com",123],["loseart.com",124],["sousou-no-frieren.com",125],["veev.to",126],["botcomics.com",127],["cefirates.com",127],["chandlerorchards.com",127],["comicleaks.com",127],["marketdata.app",127],["monumentmetals.com",127],["tapmyback.com",127],["ping.gg",127],["revistaferramental.com.br",127],["hawpar.com",127],["alpacafinance.org",[127,128]],["nookgaming.com",127],["enkeleksamen.no",127],["kvest.ee",127],["creatordrop.com",127],["panpots.com",127],["cybernetman.com",127],["bitdomain.biz",127],["gerardbosch.xyz",127],["fort-shop.kiev.ua",127],["accuretawealth.com",127],["resourceya.com",127],["tracktheta.com",127],["tt.live",128],["future-fortune.com",128],["abhijith.page",128],["madrigalmaps.com",128],["adventuretix.com",128],["panprices.com",129],["intercity.technology",129],["freelancer.taxmachine.be",129],["adria.gg",129],["fjlaboratories.com",129],["tapewithadblock.org",130]]);

const entitiesMap = new Map([["1337x",2],["kimcartoon",4],["pahe",6],["soap2day",6],["hqq",8],["waaw",8],["teluguflix",10],["pixhost",11],["viprow",14],["dood",19],["doodstream",19],["dooood",19],["shrinke",22],["shrinkme",22],["eplayvid",23],["poplinks",25],["cricstream",27],["dropgalaxy",27],["o2tvseries",27],["o2tvseriesz",27],["kickass",28],["watchomovies",35],["actvid",66]]);

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
