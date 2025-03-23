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

// ruleset: default

// Important!
// Isolate from global scope

// Start of local scope
(function uBOL_removeNodeText() {

/******************************************************************************/

function removeNodeText(
    nodeName,
    includes,
    ...extraArgs
) {
    replaceNodeTextFn(nodeName, '', '', 'includes', includes || '', ...extraArgs);
}

function replaceNodeTextFn(
    nodeName = '',
    pattern = '',
    replacement = ''
) {
    const safe = safeSelf();
    const logPrefix = safe.makeLogPrefix('replace-node-text.fn', ...Array.from(arguments));
    const reNodeName = safe.patternToRegex(nodeName, 'i', true);
    const rePattern = safe.patternToRegex(pattern, 'gms');
    const extraArgs = safe.getExtraArgs(Array.from(arguments), 3);
    const reIncludes = extraArgs.includes || extraArgs.condition
        ? safe.patternToRegex(extraArgs.includes || extraArgs.condition, 'ms')
        : null;
    const reExcludes = extraArgs.excludes
        ? safe.patternToRegex(extraArgs.excludes, 'ms')
        : null;
    const stop = (takeRecord = true) => {
        if ( takeRecord ) {
            handleMutations(observer.takeRecords());
        }
        observer.disconnect();
        if ( safe.logLevel > 1 ) {
            safe.uboLog(logPrefix, 'Quitting');
        }
    };
    const textContentFactory = (( ) => {
        const out = { createScript: s => s };
        const { trustedTypes: tt } = self;
        if ( tt instanceof Object ) {
            if ( typeof tt.getPropertyType === 'function' ) {
                if ( tt.getPropertyType('script', 'textContent') === 'TrustedScript' ) {
                    return tt.createPolicy(getRandomTokenFn(), out);
                }
            }
        }
        return out;
    })();
    let sedCount = extraArgs.sedCount || 0;
    const handleNode = node => {
        const before = node.textContent;
        if ( reIncludes ) {
            reIncludes.lastIndex = 0;
            if ( safe.RegExp_test.call(reIncludes, before) === false ) { return true; }
        }
        if ( reExcludes ) {
            reExcludes.lastIndex = 0;
            if ( safe.RegExp_test.call(reExcludes, before) ) { return true; }
        }
        rePattern.lastIndex = 0;
        if ( safe.RegExp_test.call(rePattern, before) === false ) { return true; }
        rePattern.lastIndex = 0;
        const after = pattern !== ''
            ? before.replace(rePattern, replacement)
            : replacement;
        node.textContent = node.nodeName === 'SCRIPT'
            ? textContentFactory.createScript(after)
            : after;
        if ( safe.logLevel > 1 ) {
            safe.uboLog(logPrefix, `Text before:\n${before.trim()}`);
        }
        safe.uboLog(logPrefix, `Text after:\n${after.trim()}`);
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
            if ( node === document.currentScript ) { continue; }
            if ( handleNode(node) ) { continue; }
            stop(); break;
        }
        safe.uboLog(logPrefix, `${count} nodes present before installing mutation observer`);
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

function getRandomTokenFn() {
    const safe = safeSelf();
    return safe.String_fromCharCode(Date.now() % 26 + 97) +
        safe.Math_floor(safe.Math_random() * 982451653 + 982451653).toString(36);
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
        'Object_hasOwn': Object.hasOwn.bind(Object),
        'RegExp': self.RegExp,
        'RegExp_test': self.RegExp.prototype.test,
        'RegExp_exec': self.RegExp.prototype.exec,
        'Request_clone': self.Request.prototype.clone,
        'String': self.String,
        'String_fromCharCode': String.fromCharCode,
        'String_split': String.prototype.split,
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
            catch {
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
    safe.logLevel = scriptletGlobals.logLevel || 1;
    let lastLogType = '';
    let lastLogText = '';
    let lastLogTime = 0;
    safe.toLogText = (type, ...args) => {
        if ( args.length === 0 ) { return; }
        const text = `[${document.location.hostname || document.location.href}]${args.join(' ')}`;
        if ( text === lastLogText && type === lastLogType ) {
            if ( (Date.now() - lastLogTime) < 5000 ) { return; }
        }
        lastLogType = type;
        lastLogText = text;
        lastLogTime = Date.now();
        return text;
    };
    try {
        const bc = new self.BroadcastChannel(scriptletGlobals.bcSecret);
        let bcBuffer = [];
        safe.sendToLogger = (type, ...args) => {
            const text = safe.toLogText(type, ...args);
            if ( text === undefined ) { return; }
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
    } catch {
        safe.sendToLogger = (type, ...args) => {
            const text = safe.toLogText(type, ...args);
            if ( text === undefined ) { return; }
            safe.log(`uBO ${text}`);
        };
    }
    return safe;
}

/******************************************************************************/

const scriptletGlobals = {}; // eslint-disable-line
const argsList = [["script","DisplayAcceptableAdIfAdblocked"],["script","adslotFilledByCriteo"],["script","/==undefined.*body/"],["script","\"Anzeige\""],["script","adserverDomain"],["script","Promise"],["script","/adbl/i"],["script","Reflect"],["script","document.write"],["script","deblocker"],["script","self == top"],["script","/popunder|isAdBlock|admvn.src/i"],["script","exdynsrv"],["script","/delete window|adserverDomain|FingerprintJS/"],["script","adsbygoogle"],["script","FingerprintJS"],["script","/h=decodeURIComponent|popundersPerIP/"],["script","/adblock.php"],["script","/adb/i"],["script","/document\\.createElement|\\.banner-in/"],["script","admbenefits"],["script","WebAssembly"],["script","/\\badblock\\b/"],["script","myreadCookie"],["script","ExoLoader"],["script","/?key.*open/","condition","key"],["script","adblock"],["script","homad"],["script","popUnderUrl"],["script","Adblock"],["script","/ABDetected|navigator.brave|fetch/"],["script","/ai_|b2a/"],["script","window.adblockDetector"],["script","DName"],["script","/bypass.php"],["script","htmls"],["script","/\\/detected\\.html|Adblock/"],["script","toast"],["script","AdbModel"],["script","/popup/i"],["script","antiAdBlockerHandler"],["script","/ad\\s?block|adsBlocked|document\\.write\\(unescape\\('|devtool/i"],["script","onerror"],["script","location.assign"],["script","location.href"],["script","/checkAdBlocker|AdblockRegixFinder/"],["script","catch"],["script",";break;case $."],["script","adb_detected"],["script","window.open"],["script","/aclib|break;|zoneNativeSett/"],["script","/fetch|popupshow/"],["script","justDetectAdblock"],["script","/FingerprintJS|openPopup/"],["script","DisableDevtool"],["script","/adsbygoogle|detectAdBlock/"],["script","onDevToolOpen"],["script","/WebAssembly|forceunder/"],["script","/isAdBlocked|popUnderUrl/"],["script","popundersPerIP"],["script","wpadmngr.com"],["script","/adb|offsetWidth/i"],["script","contextmenu"],["script","/adblock|var Data.*];/"],["script","var Data"],["script","replace"],["script",";}}};break;case $."],["script","globalThis;break;case"],["script","{delete window["],["style","text-decoration"],["script","/break;case|FingerprintJS/"],["script","push"],["script","AdBlocker"],["script","clicky"],["script","charCodeAt"],["script","/h=decodeURIComponent|\"popundersPerIP\"/"],["script","popMagic"],["script","/popMagic|pop1stp/"],["script","localStorage"],["script","popunder"],["script","adbl"],["script","googlesyndication"],["script","blockAdBlock"],["script","/adblock|location\\.replace/"],["script","/downloadJSAtOnload|Object.prototype.toString.call/"],["script","numberPages"],["script","brave"],["script","error-report.com"],["script","KCgpPT57bGV0IGU"],["script","adShield"],["script","Ad-Shield"],["script",".xyz/script/"],["script","adrecover.com"],["script","html-load.com"],["script","AreLoaded"],["script","AdblockRegixFinder"],["script","/adScript|adsBlocked/"],["script","serve"],["script","?metric=transit.counter&key=fail_redirect&tags="],["script","/pushAdTag|link_click|getAds/"],["script","/\\', [0-9]{5}\\)\\]\\; \\}/"],["script","/\\\",\\\"clickp\\\"\\:\\\"[0-9]{1,2}\\\"/"],["script","/ConsoleBan|alert|AdBlocker/"],["script","runPop"],["style","body:not(.ownlist)"],["script","mdpDeblocker"],["script","alert","condition","adblock"],["script","/decodeURIComponent\\(escape|fairAdblock/"],["script","/ai_|googletag|adb/"],["script","/deblocker|chp_ad/"],["script","await fetch"],["script","AdBlock"],["script","innerHTML"],["script","/'.adsbygoogle'|text-danger|warning|Adblock|_0x/"],["script","insertAdjacentHTML"],["script","popUnder"],["script","adb"],["#text","/スポンサーリンク|Sponsored Link|广告/"],["#text","スポンサーリンク"],["#text","スポンサードリンク"],["#text","/\\[vkExUnit_ad area=(after|before)\\]/"],["#text","【広告】"],["#text","【PR】"],["#text","関連動画"],["#text","PR:"],["script","leave_recommend"],["#text","/Advertisement/"],["script","navigator.brave"],["script","ai_adb"],["script","HTMLAllCollection"],["script","liedetector"],["script","popWin"],["script","end_click"],["script","ad blocker"],["script","closeAd"],["script","/adconfig/i"],["script","AdblockDetector"],["script","is_antiblock_refresh"],["script","/userAgent|adb|htmls/"],["script","myModal"],["script","app_checkext"],["script","clientHeight"],["script","Brave"],["script","await"],["script","Object.keys(window.adngin).length"],["script","axios"],["script","\"v4ac1eiZr0\""],["script","admiral"],["script","'').split(',')[4]"],["script","\"\").split(\",\")[4]"],["script","/\"v4ac1eiZr0\"|\"\"\\)\\.split\\(\",\"\\)\\[4\\]|(\\.localStorage\\)|JSON\\.parse\\(\\w)\\.getItem\\(\"/"],["script","/charAt|XMLHttpRequest/"],["script","AdBlockEnabled"],["script","window.location.replace"],["script","egoTab"],["script","abDetectorPro"],["script","/$.*(css|oncontextmenu)/"],["script","/eval.*RegExp/"],["script","wwads"],["script","/\\[\\'push\\'\\]/"],["script","/adblock/i"],["script","/ads?Block/i"],["script","chkADB"],["script","Symbol.iterator"],["script","ai_cookie"],["script","/$.*open/"],["script","/innerHTML.*appendChild/"],["script","Exo"],["script","detectAdBlock"],["script","AaDetector"],["script","/window\\[\\'open\\'\\]/"],["script","Error"],["script","/document\\.head\\.appendChild|window\\.open/"],["script","pop1stp"],["script","Number"],["script","NEXT_REDIRECT"],["script","ad-block-activated"],["script","insertBefore"],["script","pop.doEvent"],["script","detect"],["script","fetch"],["script","/hasAdblock|detect/"],["script","document.createTextNode"],["script","/h=decodeURIComponent|popundersPerIP|adserverDomain/"],["script","/shown_at|WebAssembly/"],["script","style"],["script","shown_at"],["script","adsSrc"],["script","/adblock|popunder|openedPop|WebAssembly/"],["script","/popMagic|nativeads|navigator\\.brave|\\.abk_msg|\\.innerHTML|ad block|manipulation/"],["script","window.warn"],["script","adBlock"],["script","adBlockDetected"],["script","/fetch|adb/i"],["script","location"],["script","showAd"],["script","imgSrc"],["script","document.createElement(\"script\")"],["script","antiAdBlock"],["script","/fairAdblock|popMagic/"],["script","/pop1stp|detectAdBlock/"],["script","aclib.runPop"],["script","mega-enlace.com/ext.php?o="],["script","Popup"],["script","displayAdsV3"],["script","adblocker"],["script","break;case"],["h2","/creeperhost/i"],["script","/interceptClickEvent|onbeforeunload|popMagic|location\\.replace/"],["script","/adserverDomain|\\);break;case /"],["script","initializeInterstitial"],["script","popupBackground"],["script","Math.floor"],["script","m9-ad-modal"],["script","Anzeige"],["script","blocking"],["script","adBlockNotice"],["script","LieDetector"],["script","advads"],["script","document.cookie"],["script","/h=decodeURIComponent|popundersPerIP|window\\.open|\\.createElement/"],["script","/_0x|brave|onerror/"],["script","window.googletag.pubads"],["script","kmtAdsData"],["script","wpadmngr"],["script","navigator.userAgent"],["script","checkAdBlock"],["script","detectedAdblock"],["script","setADBFlag"],["script","/h=decodeURIComponent|popundersPerIP|wpadmngr|popMagic/"],["script","/wpadmngr|adserverDomain/"],["script","/account_ad_blocker|tmaAB/"],["script","ads_block"],["script","/adserverDomain|delete window|FingerprintJS/"],["script","return a.split"],["script","/popundersPerIP|adserverDomain|wpadmngr/"],["script","==\"]"],["script","ads-blocked"],["script","#adbd"],["script","AdBl"],["script","/adblock|Cuba|noadb/i"],["script","/adserverDomain|ai_cookie/"],["script","/adsBlocked|\"popundersPerIP\"/"],["script","ab.php"],["script","wpquads_adblocker_check"],["script","callbackAdsBlocked"],["script","__adblocker"],["script","/alert|brave|blocker/i"],["script","/join\\(\\'\\'\\)/"],["script","/join\\(\\\"\\\"\\)/"],["script","api.dataunlocker.com"],["script","/^Function\\(\\\"/"],["script","vglnk"],["script","/detect|FingerprintJS/"],["script","/RegExp\\(\\'/","condition","RegExp"],["script","adBlockEnabled"],["script","\"data-adm-url\""],["script","NREUM"]];
const hostnamesMap = new Map([["alpin.de",0],["boersennews.de",0],["chefkoch.de",0],["chip.de",0],["clever-tanken.de",0],["desired.de",0],["donnerwetter.de",0],["fanfiktion.de",0],["focus.de",0],["formel1.de",0],["frustfrei-lernen.de",0],["gewinnspiele.tv",0],["giga.de",0],["gut-erklaert.de",0],["kino.de",0],["messen.de",0],["nickles.de",0],["nordbayern.de",0],["spielfilm.de",0],["teltarif.de",[0,1]],["unsere-helden.com",0],["weltfussball.at",0],["watson.de",0],["moviepilot.de",[0,5]],["mactechnews.de",0],["sport1.de",0],["welt.de",0],["sport.de",0],["allthingsvegas.com",2],["100percentfedup.com",2],["beforeitsnews.com",2],["concomber.com",2],["conservativebrief.com",2],["conservativefiringline.com",2],["dailylol.com",2],["funnyand.com",2],["letocard.fr",2],["mamieastuce.com",2],["meilleurpronostic.fr",2],["patriotnationpress.com",2],["toptenz.net",2],["vitamiiin.com",2],["writerscafe.org",2],["populist.press",2],["dailytruthreport.com",2],["livinggospeldaily.com",2],["first-names-meanings.com",2],["welovetrump.com",2],["thehayride.com",2],["thelibertydaily.com",2],["thepoke.co.uk",2],["thepolitistick.com",2],["theblacksphere.net",2],["shark-tank.com",2],["naturalblaze.com",2],["greatamericanrepublic.com",2],["dailysurge.com",2],["truthlion.com",2],["flagandcross.com",2],["westword.com",2],["republicbrief.com",2],["freedomfirstnetwork.com",2],["phoenixnewtimes.com",2],["designbump.com",2],["clashdaily.com",2],["madworldnews.com",2],["reviveusa.com",2],["sonsoflibertymedia.com",2],["thedesigninspiration.com",2],["videogamesblogger.com",2],["protrumpnews.com",2],["thepalmierireport.com",2],["kresy.pl",2],["thepatriotjournal.com",2],["gellerreport.com",2],["thegatewaypundit.com",2],["wltreport.com",2],["miaminewtimes.com",2],["politicalsignal.com",2],["rightwingnews.com",2],["bigleaguepolitics.com",2],["comicallyincorrect.com",2],["web.de",3],["skidrowreloaded.com",[4,16]],["wawacity.*",4],["720pstream.*",[4,66]],["embedsports.me",[4,70]],["embedstream.me",[4,15,16,66,70]],["jumbtv.com",[4,70]],["reliabletv.me",[4,70]],["topembed.pw",[4,68,211]],["crackstreamer.net",4],["methstreamer.com",4],["rnbastreams.com",4],["vidsrc.*",[4,15,66]],["1stream.eu",4],["4kwebplay.xyz",4],["anime4i.vip",4],["antennasports.ru",4],["buffsports.me",[4,66]],["buffstreams.app",4],["claplivehdplay.ru",[4,211]],["cracksports.me",[4,15]],["euro2024direct.ru",4],["ext.to",4],["extreme-down.*",4],["eztv.tf",4],["eztvx.to",4],["flix-wave.*",4],["hikaritv.xyz",4],["kenitv.me",[4,15,16]],["lewblivehdplay.ru",[4,211]],["mixdrop.*",[4,16]],["mlbbite.net",4],["mlbstreams.ai",4],["qatarstreams.me",[4,15]],["qqwebplay.xyz",[4,211]],["sanet.*",4],["soccerworldcup.me",[4,15]],["sportshd.*",4],["topstreams.info",4],["totalsportek.to",4],["viwlivehdplay.ru",4],["vidco.pro",[4,66]],["userupload.*",6],["cinedesi.in",6],["intro-hd.net",6],["monacomatin.mc",6],["nodo313.net",6],["hesgoal-tv.io",6],["hesgoal-vip.io",6],["earn.punjabworks.com",6],["mahajobwala.in",6],["solewe.com",6],["panel.play.hosting",6],["pahe.*",[7,16,68]],["soap2day.*",7],["yts.mx",8],["magesypro.com",9],["pinsystem.co.uk",9],["elrellano.com",9],["tinyppt.com",9],["veganab.co",9],["camdigest.com",9],["learnmany.in",9],["amanguides.com",[9,38]],["highkeyfinance.com",[9,38]],["appkamods.com",9],["techacode.com",9],["djqunjab.in",9],["downfile.site",9],["expertvn.com",9],["trangchu.news",9],["3dmodelshare.org",9],["nulleb.com",9],["asiaon.top",9],["reset-scans.*",9],["coursesghar.com",9],["thecustomrom.com",9],["snlookup.com",9],["bingotingo.com",9],["ghior.com",9],["3dmili.com",9],["karanpc.com",9],["plc247.com",9],["apkdelisi.net",9],["freepasses.org",9],["poplinks.*",[9,42]],["tomarnarede.pt",9],["basketballbuzz.ca",9],["dribbblegraphics.com",9],["kemiox.com",9],["teksnologi.com",9],["bharathwick.com",9],["descargaspcpro.net",9],["dx-tv.com",9],["rt3dmodels.com",9],["plc4me.com",9],["blisseyhusbands.com",9],["mhdsports.*",9],["mhdsportstv.*",9],["mhdtvsports.*",9],["mhdtvworld.*",9],["mhdtvmax.*",9],["mhdstream.*",9],["madaradex.org",9],["trigonevo.com",9],["franceprefecture.fr",9],["jazbaat.in",9],["aipebel.com",9],["audiotools.blog",9],["embdproxy.xyz",9],["hqq.*",10],["waaw.*",10],["upornia.com",11],["pixhost.*",12],["vipbox.*",13],["germancarforum.com",14],["cybercityhelp.in",14],["innateblogger.com",14],["omeuemprego.online",14],["viprow.*",[15,16,66]],["bluemediadownload.*",15],["bluemediafile.*",15],["bluemedialink.*",15],["bluemediastorage.*",15],["bluemediaurls.*",15],["urlbluemedia.*",15],["streamnoads.com",[15,16,57,66]],["bowfile.com",15],["cloudvideo.tv",[15,66]],["cloudvideotv.*",[15,66]],["coloredmanga.com",15],["exeo.app",15],["hiphopa.net",[15,16]],["megaup.net",15],["olympicstreams.co",[15,66]],["tv247.us",[15,16]],["uploadhaven.com",15],["userscloud.com",[15,66]],["mlbbox.me",15],["vikingf1le.us.to",15],["neodrive.xyz",15],["mdfx9dc8n.net",16],["mdzsmutpcvykb.net",16],["mixdrop21.net",16],["mixdropjmk.pw",16],["123-movies.*",16],["123movieshd.*",16],["123movieshub.*",16],["123moviesme.*",16],["1337x.*",[16,185]],["141jav.com",16],["1bit.space",16],["1bitspace.com",16],["1stream.*",16],["1tamilmv.*",16],["2ddl.*",16],["2umovies.*",16],["345movies.com",16],["3dporndude.com",16],["3hiidude.*",16],["4archive.org",16],["4horlover.com",16],["4stream.*",16],["560pmovie.com",16],["5movies.*",16],["7hitmovies.*",16],["85tube.com",16],["85videos.com",16],["9xmovie.*",16],["aagmaal.*",[16,66]],["acefile.co",16],["actusports.eu",16],["adblockeronstape.*",[16,57]],["adblockeronstreamtape.*",16],["adblockplustape.*",[16,57]],["adblockstreamtape.*",[16,57]],["adblockstrtape.*",[16,57]],["adblockstrtech.*",[16,57]],["adblocktape.*",[16,57]],["adclickersbot.com",16],["adcorto.*",16],["adricami.com",16],["adslink.pw",16],["adultstvlive.com",16],["adz7short.space",16],["aeblender.com",16],["ahdafnews.blogspot.com",16],["ak47sports.com",16],["akuma.moe",16],["alexsports.*",16],["alexsportss.*",16],["alexsportz.*",16],["allplayer.tk",16],["amateurblog.tv",16],["androidadult.com",[16,237]],["anhsexjav.xyz",16],["anidl.org",16],["anime-loads.org",16],["animeblkom.net",16],["animefire.plus",16],["animelek.me",16],["animepahe.*",16],["animesanka.*",16],["animespire.net",16],["animestotais.xyz",16],["animeyt.es",16],["animixplay.*",16],["aniplay.*",16],["anroll.net",16],["antiadtape.*",[16,57]],["anymoviess.xyz",16],["aotonline.org",16],["asenshu.com",16],["asialiveaction.com",16],["asianclipdedhd.net",16],["asianclub.*",16],["ask4movie.*",16],["askim-bg.com",16],["asumsikedaishop.com",16],["atomixhq.*",[16,66]],["atomohd.*",16],["avcrempie.com",16],["avseesee.com",16],["gettapeads.com",[16,57]],["backfirstwo.com",16],["bajarjuegospcgratis.com",16],["balkanportal.net",16],["balkanteka.net",16],["bdnewszh.com",[16,66]],["beinmatch.*",[16,25]],["belowporn.com",16],["bestgirlsexy.com",16],["bestnhl.com",16],["bestporn4free.com",16],["bestporncomix.com",16],["bet36.es",16],["bgwp.cc",[16,21]],["bhaai.*",16],["bikinitryon.net",16],["birdurls.com",16],["bitsearch.to",16],["blackcockadventure.com",16],["blackcockchurch.org",16],["blackporncrazy.com",16],["blizzboygames.net",16],["blizzpaste.com",16],["blkom.com",16],["blog-peliculas.com",16],["blogtrabalhista.com",16],["blurayufr.*",16],["bobsvagene.club",16],["bolly4umovies.click",16],["bonusharian.pro",16],["brilian-news.id",16],["brupload.net",16],["bucitana.com",16],["buffstreams.*",16],["camchickscaps.com",16],["camgirlcum.com",16],["camgirls.casa",16],["canalesportivo.*",16],["cashurl.in",16],["castingx.net",16],["ccurl.net",[16,66]],["celebrity-leaks.net",16],["cgpelis.net",16],["charexempire.com",16],["choosingnothing.com",16],["clasico.tv",16],["clickndownload.*",16],["clicknupload.*",16],["clik.pw",16],["coin-free.com",[16,35]],["coins100s.fun",16],["comicsmanics.com",16],["compucalitv.com",16],["coolcast2.com",16],["cosplaytab.com",16],["countylocalnews.com",16],["cpmlink.net",16],["crackstreamshd.click",16],["crespomods.com",16],["crisanimex.com",16],["crunchyscan.fr",16],["cuevana3.fan",16],["cuevana3hd.com",16],["cumception.com",16],["cutpaid.com",16],["daddylive.*",[16,66,209]],["daddylivehd.*",[16,66]],["dailyuploads.net",16],["datawav.club",16],["daughtertraining.com",16],["ddrmovies.*",16],["deepgoretube.site",16],["deltabit.co",16],["deporte-libre.top",16],["depvailon.com",16],["derleta.com",16],["desiremovies.*",16],["desivdo.com",16],["desixx.net",16],["detikkebumen.com",16],["deutschepornos.me",16],["devlib.*",16],["diasoft.xyz",16],["directupload.net",16],["diskusscan.com",16],["divxtotal.*",16],["divxtotal1.*",16],["dixva.com",16],["dlhd.*",16],["doctormalay.com",16],["dofusports.xyz",16],["dogemate.com",16],["doods.cam",16],["doodskin.lat",16],["downloadrips.com",16],["downvod.com",16],["dphunters.mom",16],["dragontranslation.com",16],["dvdfullestrenos.com",16],["dvdplay.*",[16,66]],["ebookbb.com",16],["ebookhunter.net",16],["egyanime.com",16],["egygost.com",16],["egyshare.cc",16],["ekasiwap.com",16],["electro-torrent.pl",16],["elil.cc",16],["elixx.*",16],["enjoy4k.*",16],["eplayer.click",16],["erovoice.us",16],["eroxxx.us",16],["estrenosdoramas.net",16],["estrenosflix.*",16],["estrenosflux.*",16],["estrenosgo.*",16],["everia.club",16],["everythinginherenet.blogspot.com",16],["extrafreetv.com",16],["extremotvplay.com",16],["f1stream.*",16],["fapinporn.com",16],["fapptime.com",16],["fashionblog.tv",16],["fastreams.live",16],["faucethero.com",16],["fbstream.*",16],["fembed.com",16],["femdom-joi.com",16],["file4go.*",16],["fileone.tv",16],["film1k.com",16],["filmeonline2023.net",16],["filmesonlinex.org",16],["filmesonlinexhd.biz",[16,66]],["filmovitica.com",16],["filmymaza.blogspot.com",16],["filmyzilla.*",[16,66]],["filthy.family",16],["findav.*",16],["findporn.*",16],["fixfinder.click",16],["flixmaza.*",16],["flizmovies.*",16],["flostreams.xyz",16],["flyfaucet.com",16],["footyhunter.lol",16],["forex-trnd.com",16],["forumchat.club",16],["forumlovers.club",16],["freemoviesonline.biz",16],["freeomovie.co.in",16],["freeomovie.to",16],["freeporncomic.net",16],["freepornhdonlinegay.com",16],["freeproxy.io",16],["freetvsports.*",16],["freeuse.me",16],["freeusexporn.com",16],["fsharetv.cc",16],["fsicomics.com",16],["fullymaza.*",16],["g3g.*",16],["galinhasamurai.com",16],["gamepcfull.com",16],["gameronix.com",16],["gamesfullx.com",16],["gameshdlive.net",16],["gamesmountain.com",16],["gamesrepacks.com",16],["gamingguru.fr",16],["gamovideo.com",16],["garota.cf",16],["gaydelicious.com",16],["gaypornmasters.com",16],["gaysex69.net",16],["gemstreams.com",16],["get-to.link",16],["girlscanner.org",16],["giurgiuveanul.ro",16],["gledajcrtace.xyz",16],["gocast2.com",16],["gomo.to",16],["gostosa.cf",16],["gotxx.*",16],["grantorrent.*",16],["gtlink.co",16],["gwiazdypornosow.pl",16],["haho.moe",16],["hatsukimanga.com",16],["hayhd.net",16],["hdmoviesfair.*",[16,66]],["hdmoviesflix.*",16],["hdsaprevodom.com",16],["hdstreamss.club",16],["hentais.tube",16],["hentaistream.co",16],["hentaitk.net",16],["hentaitube.online",16],["hentaiworld.tv",16],["hesgoal.tv",16],["hexupload.net",16],["hhkungfu.tv",16],["highlanderhelp.com",16],["hiidudemoviez.*",16],["hindimean.com",16],["hindimovies.to",[16,66]],["hiperdex.com",16],["hispasexy.org",16],["hitprn.com",16],["hoca4u.com",16],["hollymoviehd.cc",16],["hoodsite.com",16],["hopepaste.download",16],["hornylips.com",16],["hotgranny.live",16],["hotmama.live",16],["hqcelebcorner.net",16],["huren.best",16],["hwnaturkya.com",[16,66]],["hxfile.co",[16,66]],["igfap.com",16],["iklandb.com",16],["illink.net",16],["imgkings.com",16],["imgsen.*",16],["imgsex.xyz",16],["imgsto.*",16],["imx.to",16],["incest.*",16],["incestflix.*",16],["influencersgonewild.org",16],["infosgj.free.fr",16],["investnewsbrazil.com",16],["itdmusics.com",16],["itopmusic.*",16],["itsuseful.site",16],["itunesfre.com",16],["iwatchfriendsonline.net",[16,130]],["jackstreams.com",16],["jatimupdate24.com",16],["jav-fun.cc",16],["jav-noni.cc",16],["jav-scvp.com",16],["javcl.com",16],["javf.net",16],["javhay.net",16],["javhoho.com",16],["javhun.com",16],["javleak.com",16],["javmost.*",16],["javporn.best",16],["javsek.net",16],["javsex.to",16],["javtiful.com",[16,18]],["jimdofree.com",16],["jiofiles.org",16],["jorpetz.com",16],["jp-films.com",16],["jpop80ss3.blogspot.com",16],["jpopsingles.eu",[16,187]],["kantotflix.net",16],["kantotinyo.com",16],["kaoskrew.org",16],["kaplog.com",16],["keeplinks.*",16],["keepvid.*",16],["keralahd.*",16],["keralatvbox.com",16],["khatrimazaful.*",16],["khatrimazafull.*",[16,60]],["kickassanimes.io",16],["kimochi.info",16],["kimochi.tv",16],["kinemania.tv",16],["konstantinova.net",16],["koora-online.live",16],["kunmanga.com",16],["kutmoney.com",16],["kwithsub.com",16],["lat69.me",16],["latinblog.tv",16],["latinomegahd.net",16],["leechall.*",16],["leechpremium.link",16],["legendas.dev",16],["legendei.net",16],["lightdlmovies.blogspot.com",16],["lighterlegend.com",16],["linclik.com",16],["linkebr.com",16],["linkrex.net",16],["linkshorts.*",16],["lulu.st",16],["lulustream.com",[16,68]],["luluvdo.com",16],["manga-oni.com",16],["mangaboat.com",16],["mangagenki.me",16],["mangahere.onl",16],["mangaweb.xyz",16],["mangoporn.net",16],["mangovideo.*",16],["manhwahentai.me",16],["masahub.com",16],["masahub.net",16],["masaporn.*",16],["maturegrannyfuck.com",16],["mdy48tn97.com",16],["mediapemersatubangsa.com",16],["mega-mkv.com",16],["megapastes.com",16],["megapornpics.com",16],["messitv.net",16],["meusanimes.net",16],["milfmoza.com",16],["milfzr.com",16],["millionscast.com",16],["mimaletamusical.blogspot.com",16],["miniurl.*",16],["mirrorace.*",16],["mitly.us",16],["mixdroop.*",16],["mkv-pastes.com",16],["mkvcage.*",16],["mlbstream.*",16],["mlsbd.*",16],["mmsbee.*",16],["monaskuliner.ac.id",16],["moredesi.com",16],["motogpstream.*",16],["movgotv.net",16],["movi.pk",16],["movieplex.*",16],["movierulzlink.*",16],["movies123.*",16],["moviesflix.*",16],["moviesmeta.*",16],["moviessources.*",16],["moviesverse.*",16],["movieswbb.com",16],["moviewatch.com.pk",16],["moviezwaphd.*",16],["mp4upload.com",16],["mrskin.live",16],["mrunblock.*",16],["multicanaistv.com",16],["mundowuxia.com",16],["myeasymusic.ir",16],["myonvideo.com",16],["myyouporn.com",16],["narutoget.info",16],["naughtypiss.com",16],["nbastream.*",16],["nerdiess.com",16],["new-fs.eu",16],["newmovierulz.*",16],["newtorrentgame.com",16],["nflstream.*",16],["nflstreams.me",16],["nhlstream.*",16],["niaomea.me",[16,66]],["nicekkk.com",16],["nicesss.com",16],["nlegs.com",16],["noblocktape.*",[16,57]],["nocensor.*",16],["nolive.me",[16,66]],["notformembersonly.com",16],["novamovie.net",16],["novelpdf.xyz",16],["novelssites.com",[16,66]],["novelup.top",16],["nsfwr34.com",16],["nu6i-bg-net.com",16],["nudebabesin3d.com",16],["nukedfans.com",16],["nuoga.eu",16],["nzbstars.com",16],["o2tvseries.com",16],["ohjav.com",16],["ojearnovelas.com",16],["okanime.xyz",16],["olweb.tv",16],["on9.stream",16],["onepiece-mangaonline.com",16],["onifile.com",16],["onionstream.live",16],["onlinesaprevodom.net",16],["onlyfams.*",16],["onlyfullporn.video",16],["onplustv.live",16],["originporn.com",16],["ouo.*",16],["ovagames.com",16],["ovamusic.com",16],["packsporn.com",16],["pahaplayers.click",16],["palimas.org",16],["password69.com",16],["pastemytxt.com",16],["payskip.org",16],["pctfenix.*",[16,66]],["pctnew.*",[16,66]],["peeplink.in",16],["peliculas24.*",16],["peliculasmx.net",16],["pelisplus.*",16],["pervertgirlsvideos.com",16],["pervyvideos.com",16],["phim12h.com",16],["picdollar.com",16],["pickteenz.com",16],["picsxxxporn.com",16],["pinayscandalz.com",16],["pinkueiga.net",16],["piratebay.*",16],["piratefast.xyz",16],["piratehaven.xyz",16],["pirateiro.com",16],["pirlotvonline.org",16],["playtube.co.za",16],["plugintorrent.com",16],["plyjam.*",16],["plylive.*",16],["plyvdo.*",16],["pmvzone.com",16],["porndish.com",16],["pornez.net",16],["pornfetishbdsm.com",16],["pornfits.com",16],["pornhd720p.com",16],["pornhoarder.*",[16,230]],["pornobr.club",16],["pornobr.ninja",16],["pornodominicano.net",16],["pornofaps.com",16],["pornoflux.com",16],["pornotorrent.com.br",16],["pornredit.com",16],["pornstarsyfamosas.es",16],["pornstreams.co",16],["porntn.com",16],["pornxbit.com",16],["pornxday.com",16],["portaldasnovinhas.shop",16],["portugues-fcr.blogspot.com",16],["poscitesch.com",[16,66]],["poseyoung.com",16],["pover.org",16],["prbay.*",16],["projectfreetv.*",16],["proxybit.*",16],["proxyninja.org",16],["psarips.*",16],["pubfilmz.com",16],["publicsexamateurs.com",16],["punanihub.com",16],["putlocker5movies.org",16],["pxxbay.com",16],["r18.best",16],["racaty.*",16],["ragnaru.net",16],["rapbeh.net",16],["rapelust.com",16],["rapload.org",16],["read-onepiece.net",16],["remaxhd.*",16],["retro-fucking.com",16],["retrotv.org",16],["rintor.*",16],["rnbxclusive.*",16],["rnbxclusive0.*",16],["rnbxclusive1.*",16],["robaldowns.com",16],["rockdilla.com",16],["rojadirecta.*",16],["rojadirectaenvivo.*",16],["rojadirectatvenvivo.com",16],["rojitadirecta.blogspot.com",16],["romancetv.site",16],["rsoccerlink.site",16],["rugbystreams.*",16],["rule34.club",16],["rule34hentai.net",16],["rumahbokep-id.com",16],["sadisflix.*",16],["safego.cc",16],["safetxt.*",16],["sakurafile.com",16],["satoshi-win.xyz",16],["scat.gold",16],["scatfap.com",16],["scatkings.com",16],["scnlog.me",16],["scripts-webmasters.net",16],["serie-turche.com",16],["serijefilmovi.com",16],["sexcomics.me",16],["sexdicted.com",16],["sexgay18.com",16],["sexofilm.co",16],["sextgem.com",16],["sextubebbw.com",16],["sgpics.net",16],["shadowrangers.*",16],["shadowrangers.live",16],["shahee4u.cam",16],["shahi4u.*",16],["shahid4u1.*",16],["shahid4uu.*",16],["shahiid-anime.net",16],["shavetape.*",16],["shemale6.com",16],["shid4u.*",16],["shinden.pl",16],["short.es",16],["shortearn.*",16],["shorten.*",16],["shorttey.*",16],["shortzzy.*",16],["showmanga.blog.fc2.com",16],["shrt10.com",16],["shurt.pw",16],["sideplusleaks.net",16],["silverblog.tv",16],["silverpic.com",16],["sinhalasub.life",16],["sinsitio.site",16],["sinvida.me",16],["skidrowcpy.com",16],["skidrowfull.com",16],["skymovieshd.*",16],["slut.mom",16],["smallencode.me",16],["smoner.com",16],["smplace.com",16],["soccerinhd.com",[16,66]],["socceron.name",16],["socceronline.*",[16,66]],["softairbay.com",16],["softarchive.*",16],["sokobj.com",16],["songsio.com",16],["souexatasmais.com",16],["sportbar.live",16],["sports-stream.*",16],["sportstream1.cfd",16],["sporttuna.*",16],["srt.am",16],["srts.me",16],["sshhaa.*",16],["stapadblockuser.*",[16,57]],["stape.*",[16,57]],["stapewithadblock.*",16],["starmusiq.*",16],["stbemuiptv.com",16],["stockingfetishvideo.com",16],["strcloud.*",[16,57]],["stream.crichd.vip",16],["stream.lc",16],["stream25.xyz",16],["streamadblocker.*",[16,57,66]],["streamadblockplus.*",[16,57]],["streambee.to",16],["streamcdn.*",16],["streamcenter.pro",16],["streamers.watch",16],["streamgo.to",16],["streamhub.*",16],["streamkiste.tv",16],["streamoupload.xyz",16],["streamservicehd.click",16],["streamsport.*",16],["streamta.*",[16,57]],["streamtape.*",[16,57]],["streamtapeadblockuser.*",[16,57]],["streamvid.net",[16,26]],["strikeout.*",[16,68]],["strtape.*",[16,57]],["strtapeadblock.*",[16,57]],["strtapeadblocker.*",[16,57]],["strtapewithadblock.*",16],["strtpe.*",[16,57]],["subtitleporn.com",16],["subtitles.cam",16],["suicidepics.com",16],["supertelevisionhd.com",16],["supexfeeds.com",16],["swatchseries.*",16],["swiftload.io",16],["swipebreed.net",16],["swzz.xyz",16],["sxnaar.com",16],["tabooflix.*",16],["tabooporns.com",16],["taboosex.club",16],["tapeantiads.com",[16,57]],["tapeblocker.com",[16,57]],["tapenoads.com",[16,57]],["tapewithadblock.org",[16,57,254]],["teamos.xyz",16],["teen-wave.com",16],["teenporncrazy.com",16],["telegramgroups.xyz",16],["telenovelasweb.com",16],["tennisstreams.*",16],["tensei-shitara-slime-datta-ken.com",16],["tfp.is",16],["tgo-tv.co",[16,66]],["thaihotmodels.com",16],["theblueclit.com",16],["thebussybandit.com",16],["thedaddy.to",[16,209]],["theicongenerator.com",16],["thelastdisaster.vip",16],["themoviesflix.*",16],["thepiratebay.*",16],["thepiratebay0.org",16],["thepiratebay10.info",16],["thesexcloud.com",16],["thothub.today",16],["tightsexteens.com",16],["tmearn.*",16],["tojav.net",16],["tokyoblog.tv",16],["toonanime.*",16],["top16.net",16],["topvideosgay.com",16],["torlock.*",16],["tormalayalam.*",16],["torrage.info",16],["torrents.vip",16],["torrentz2eu.*",16],["torrsexvid.com",16],["tpb-proxy.xyz",16],["trannyteca.com",16],["trendytalker.com",16],["tumanga.net",16],["turbogvideos.com",16],["turbovid.me",16],["turkishseriestv.org",16],["turksub24.net",16],["tutele.sx",16],["tutelehd.*",16],["tvglobe.me",16],["tvpclive.com",16],["tvply.*",16],["tvs-widget.com",16],["tvseries.video",16],["u4m.*",16],["ucptt.com",16],["ufaucet.online",16],["ufcfight.online",16],["ufcstream.*",16],["ultrahorny.com",16],["ultraten.net",16],["unblocknow.*",16],["unblockweb.me",16],["underhentai.net",16],["uniqueten.net",16],["upbaam.com",16],["uploadbuzz.*",16],["upstream.to",16],["usagoals.*",16],["valeriabelen.com",16],["verdragonball.online",16],["vexmoviex.*",16],["vfxmed.com",16],["vidclouds.*",16],["video.az",16],["videostreaming.rocks",16],["videowood.tv",16],["vidlox.*",16],["vidorg.net",16],["vidtapes.com",16],["vidz7.com",16],["vikistream.com",16],["vikv.net",16],["vipboxtv.*",[16,66]],["vipleague.*",[16,233]],["virpe.cc",16],["visifilmai.org",16],["viveseries.com",16],["vladrustov.sx",16],["volokit2.com",[16,209]],["vstorrent.org",16],["w-hentai.com",16],["watch-series.*",16],["watchbrooklynnine-nine.com",16],["watchelementaryonline.com",16],["watchjavidol.com",16],["watchkobestreams.info",16],["watchlostonline.net",16],["watchmonkonline.com",16],["watchrulesofengagementonline.com",16],["watchseries.*",16],["watchthekingofqueens.com",16],["webcamrips.com",16],["wincest.xyz",16],["wolverdon.fun",16],["wordcounter.icu",16],["worldmovies.store",16],["worldstreams.click",16],["wpdeployit.com",16],["wqstreams.tk",16],["wwwsct.com",16],["xanimeporn.com",16],["xblog.tv",16],["xclusivejams.*",16],["xmoviesforyou.*",16],["xn--verseriesespaollatino-obc.online",16],["xn--xvideos-espaol-1nb.com",16],["xpornium.net",16],["xsober.com",16],["xvip.lat",16],["xxgasm.com",16],["xxvideoss.org",16],["xxx18.uno",16],["xxxdominicana.com",16],["xxxfree.watch",16],["xxxmax.net",16],["xxxwebdlxxx.top",16],["xxxxvideo.uno",16],["y2b.wiki",16],["yabai.si",16],["yadixv.com",16],["yayanimes.net",16],["yeshd.net",16],["yodbox.com",16],["youdbox.*",16],["youjax.com",16],["yourdailypornvideos.ws",16],["yourupload.com",16],["ytmp3eu.*",16],["yts-subs.*",16],["yts.*",16],["ytstv.me",16],["zerion.cc",16],["zerocoin.top",16],["zitss.xyz",16],["zooqle.*",16],["zpaste.net",16],["1337x.ninjaproxy1.com",16],["y2tube.pro",16],["freeshot.live",16],["fastreams.com",16],["redittsports.com",16],["sky-sports.store",16],["streamsoccer.site",16],["tntsports.store",16],["wowstreams.co",16],["zdsptv.com",16],["tuktukcinma.com",16],["dutchycorp.*",17],["faucet.ovh",17],["mmacore.tv",18],["nxbrew.net",18],["oko.sh",[19,47,48]],["variety.com",20],["gameskinny.com",20],["deadline.com",20],["mlive.com",[20,146,150]],["atlasstudiousa.com",21],["51bonusrummy.in",[21,60]],["washingtonpost.com",22],["gosexpod.com",23],["sexo5k.com",24],["truyen-hentai.com",24],["theshedend.com",26],["zeroupload.com",26],["securenetsystems.net",26],["miniwebtool.com",26],["bchtechnologies.com",26],["eracast.cc",26],["flatai.org",26],["spiegel.de",27],["jacquieetmichel.net",28],["hausbau-forum.de",29],["althub.club",29],["kiemlua.com",29],["tea-coffee.net",30],["spatsify.com",30],["newedutopics.com",30],["getviralreach.in",30],["edukaroo.com",30],["funkeypagali.com",30],["careersides.com",30],["nayisahara.com",30],["wikifilmia.com",30],["infinityskull.com",30],["viewmyknowledge.com",30],["iisfvirtual.in",30],["starxinvestor.com",30],["jkssbalerts.com",30],["imagereviser.com",31],["labgame.io",[32,33]],["kenzo-flowertag.com",34],["mdn.lol",34],["btcbitco.in",35],["btcsatoshi.net",35],["cempakajaya.com",35],["crypto4yu.com",35],["gainl.ink",35],["manofadan.com",35],["readbitcoin.org",35],["wiour.com",35],["tremamnon.com",35],["bitsmagic.fun",35],["ourcoincash.xyz",35],["blog.cryptowidgets.net",36],["blog.insurancegold.in",36],["blog.wiki-topia.com",36],["blog.coinsvalue.net",36],["blog.cookinguide.net",36],["blog.freeoseocheck.com",36],["aylink.co",37],["sugarona.com",38],["nishankhatri.xyz",38],["cety.app",39],["exe-urls.com",39],["exego.app",39],["cutlink.net",39],["cutsy.net",39],["cutyurls.com",39],["cutty.app",39],["cutnet.net",39],["jixo.online",39],["tinys.click",40],["diendancauduong.com",40],["formyanime.com",40],["gsm-solution.com",40],["h-donghua.com",40],["hindisubbedacademy.com",40],["mydverse.*",40],["ripexbooster.xyz",40],["serial4.com",40],["tutorgaming.com",40],["everydaytechvams.com",40],["dipsnp.com",40],["cccam4sat.com",40],["zeemoontv-24.blogspot.com",40],["stitichsports.com",40],["aiimgvlog.fun",41],["appsbull.com",42],["diudemy.com",42],["maqal360.com",42],["mphealth.online",42],["makefreecallsonline.com",42],["androjungle.com",42],["bookszone.in",42],["drakescans.com",42],["shortix.co",42],["msonglyrics.com",42],["app-sorteos.com",42],["bokugents.com",42],["client.pylexnodes.net",42],["btvplus.bg",42],["blog24.me",[43,44]],["coingraph.us",45],["impact24.us",45],["iconicblogger.com",46],["auto-crypto.click",46],["tvi.la",[47,48]],["iir.la",[47,48]],["tii.la",[47,48]],["ckk.ai",[47,48]],["oei.la",[47,48]],["lnbz.la",[47,48]],["oii.la",[47,48,68]],["tpi.li",[47,48]],["shrinke.*",49],["shrinkme.*",49],["smutty.com",49],["e-sushi.fr",49],["freeadultcomix.com",49],["down.dataaps.com",49],["filmweb.pl",49],["livecamrips.*",49],["safetxt.net",49],["filespayouts.com",49],["atglinks.com",50],["kbconlinegame.com",51],["hamrojaagir.com",51],["odijob.com",51],["blogesque.net",52],["bookbucketlyst.com",52],["explorosity.net",52],["optimizepics.com",52],["stfly.*",52],["stly.*",52],["torovalley.net",52],["travize.net",52],["trekcheck.net",52],["metoza.net",52],["techlike.net",52],["snaplessons.net",52],["atravan.net",52],["transoa.net",52],["techmize.net",52],["crenue.net",52],["simana.online",53],["fooak.com",53],["joktop.com",53],["evernia.site",53],["falpus.com",53],["rfiql.com",54],["gujjukhabar.in",54],["smartfeecalculator.com",54],["djxmaza.in",54],["thecubexguide.com",54],["jytechs.in",54],["mastkhabre.com",55],["weshare.is",56],["advertisertape.com",57],["tapeadsenjoyer.com",[57,66]],["tapeadvertisement.com",57],["tapelovesads.org",57],["watchadsontape.com",57],["vosfemmes.com",58],["voyeurfrance.net",58],["bollyflix.*",59],["neymartv.net",59],["streamhd247.info",59],["samax63.lol",59],["hindimoviestv.com",59],["buzter.xyz",59],["valhallas.click",59],["cuervotv.me",[59,66]],["aliezstream.pro",59],["daddy-stream.xyz",59],["daddylive1.*",59],["esportivos.*",59],["instream.pro",59],["mylivestream.pro",59],["poscitechs.*",59],["powerover.online",59],["sportea.link",59],["sportsurge.stream",59],["ufckhabib.com",59],["ustream.pro",59],["animeshqip.site",59],["apkship.shop",59],["buzter.pro",59],["enjoysports.bond",59],["filedot.to",59],["foreverquote.xyz",59],["hdstream.one",59],["kingstreamz.site",59],["live.fastsports.store",59],["livesnow.me",59],["livesports4u.pw",59],["masterpro.click",59],["nuxhallas.click",59],["papahd.info",59],["rgshows.me",59],["sportmargin.live",59],["sportmargin.online",59],["sportsloverz.xyz",59],["sportzlive.shop",59],["supertipzz.online",59],["totalfhdsport.xyz",59],["ultrastreamlinks.xyz",59],["usgate.xyz",59],["webmaal.cfd",59],["wizistreamz.xyz",59],["worldstreamz.shop",59],["g-porno.com",59],["g-streaming.com",59],["educ4m.com",59],["fromwatch.com",59],["visualnewshub.com",59],["bigwarp.*",59],["animeshqip.org",59],["uns.bio",59],["reshare.pm",59],["videograbber.cc",59],["rahim-soft.com",60],["nekopoi.*",60],["x-video.tube",60],["rubystm.com",60],["rubyvid.com",60],["streamruby.com",60],["poophd.cc",60],["windowsreport.com",60],["fuckflix.click",60],["hyundaitucson.info",61],["exambd.net",62],["cgtips.org",63],["freewebcart.com",64],["freemagazines.top",64],["siamblockchain.com",64],["emuenzen.de",65],["123movies.*",66],["123moviesla.*",66],["123movieweb.*",66],["2embed.*",66],["9xmovies.*",66],["adsh.cc",66],["adshort.*",66],["afilmyhouse.blogspot.com",66],["ak.sv",66],["allmovieshub.*",66],["animesultra.com",66],["api.webs.moe",66],["apkmody.io",66],["asianplay.*",66],["atishmkv.*",66],["attvideo.com",66],["backfirstwo.site",66],["bflix.*",66],["crazyblog.in",66],["cricstream.*",66],["crictime.*",66],["divicast.com",66],["dlhd.so",66],["dood.*",[66,188]],["dooood.*",[66,188]],["embed.meomeo.pw",66],["extramovies.*",66],["faselhd.*",66],["faselhds.*",66],["filemoon.*",66],["filmeserialeonline.org",66],["filmy.*",66],["filmyhit.*",66],["filmywap.*",66],["flexyhit.com",66],["fmovies.*",66],["foreverwallpapers.com",66],["french-streams.cc",66],["fslinks.org",66],["gdplayer.*",66],["goku.*",66],["gomovies.*",66],["gowatchseries.*",66],["hdfungamezz.*",66],["hdtoday.to",66],["hinatasoul.com",66],["hindilinks4u.*",66],["hurawatch.*",66],["igg-games.com",66],["infinityscans.net",66],["jalshamoviezhd.*",66],["livecricket.*",66],["mangareader.to",66],["membed.net",66],["mgnetu.com",66],["mhdsport.*",66],["mkvcinemas.*",[66,186]],["movies2watch.*",66],["moviespapa.*",66],["mp3juice.info",66],["mp3juices.cc",66],["mp4moviez.*",66],["mydownloadtube.*",66],["myflixerz.to",66],["nowmetv.net",66],["nowsportstv.com",66],["nuroflix.*",66],["nxbrew.com",66],["o2tvseries.*",66],["o2tvseriesz.*",66],["oii.io",66],["paidshitforfree.com",66],["pepperlive.info",66],["pirlotv.*",66],["playertv.net",66],["poscitech.*",66],["primewire.*",66],["putlocker68.com",66],["redecanais.*",66],["roystream.com",66],["rssing.com",66],["s.to",66],["serienstream.*",66],["sflix.*",66],["shahed4u.*",66],["shaheed4u.*",66],["share.filesh.site",66],["sharkfish.xyz",66],["skidrowcodex.net",66],["smartermuver.com",66],["speedostream.*",66],["sportcast.*",66],["sports-stream.site",66],["sportskart.*",66],["stream4free.live",66],["streamingcommunity.*",[66,68,82]],["tamilarasan.*",66],["tamilfreemp3songs.*",66],["tamilmobilemovies.in",66],["tamilprinthd.*",66],["thewatchseries.live",66],["tnmusic.in",66],["torrentdosfilmes.*",66],["travelplanspro.com",66],["tubemate.*",66],["tusfiles.com",66],["tutlehd4.com",66],["twstalker.com",66],["uploadrar.*",66],["uqload.*",66],["vid-guard.com",66],["vidcloud9.*",66],["vido.*",66],["vidoo.*",66],["vidsaver.net",66],["vidspeeds.com",66],["viralitytoday.com",66],["voiranime.stream",66],["vudeo.*",66],["vumoo.*",66],["watchdoctorwhoonline.com",66],["watchomovies.*",[66,79]],["watchserie.online",66],["webhostingpost.com",66],["woxikon.in",66],["www-y2mate.com",66],["yesmovies.*",66],["ylink.bid",66],["xn-----0b4asja7ccgu2b4b0gd0edbjm2jpa1b1e9zva7a0347s4da2797e8qri.xn--1ck2e1b",66],["kickassanime.*",67],["11xmovies.*",68],["buffshub.stream",68],["cinego.tv",68],["ev01.to",68],["fstream365.com",68],["fzmovies.*",68],["linkz.*",68],["minoplres.xyz",68],["mostream.us",68],["myflixer.*",68],["prmovies.*",68],["readcomiconline.li",68],["s3embtaku.pro",68],["sflix2.to",68],["sportshub.stream",68],["streamblasters.*",68],["topcinema.cam",68],["zonatmo.com",68],["animesaturn.cx",68],["filecrypt.*",68],["hunterscomics.com",68],["aniwave.uk",68],["kickass.*",69],["unblocked.id",71],["listendata.com",72],["7xm.xyz",72],["fastupload.io",72],["azmath.info",72],["wouterplanet.com",73],["androidacy.com",74],["pillowcase.su",75],["cine-calidad.*",76],["veryfreeporn.com",76],["theporngod.com",76],["besthdgayporn.com",77],["drivenime.com",77],["erothots1.com",77],["javup.org",77],["shemaleup.net",77],["transflix.net",77],["4porn4.com",78],["bestpornflix.com",79],["freeroms.com",79],["andhrafriends.com",79],["723qrh1p.fun",79],["98zero.com",80],["mediaset.es",80],["updatewallah.in",80],["hwbusters.com",80],["beatsnoop.com",81],["fetchpik.com",81],["hackerranksolution.in",81],["camsrip.com",81],["help.sakarnewz.com",81],["austiblox.net",83],["btcbunch.com",84],["teachoo.com",[85,86]],["automobile-catalog.com",[87,88,93]],["motorbikecatalog.com",[87,88,93]],["topstarnews.net",87],["islamicfinder.org",87],["secure-signup.net",87],["dramabeans.com",87],["manta.com",87],["tportal.hr",87],["tvtropes.org",87],["wouldurather.io",87],["convertcase.net",87],["interfootball.co.kr",88],["a-ha.io",88],["cboard.net",88],["jjang0u.com",88],["joongdo.co.kr",88],["viva100.com",88],["gamingdeputy.com",88],["thesaurus.net",88],["alle-tests.nl",88],["maketecheasier.com",88],["tweaksforgeeks.com",88],["m.inven.co.kr",88],["mlbpark.donga.com",88],["meconomynews.com",88],["brandbrief.co.kr",88],["motorgraph.com",88],["worldhistory.org",89],["bleepingcomputer.com",90],["lovelive-petitsoku.com",90],["pravda.com.ua",90],["mariowiki.com",91],["ap7am.com",92],["cinema.com.my",92],["dolldivine.com",92],["giornalone.it",92],["iplocation.net",92],["jamaicaobserver.com",92],["jawapos.com",92],["jutarnji.hr",92],["kompasiana.com",92],["mediaindonesia.com",92],["nmplus.hk",92],["slobodnadalmacija.hr",92],["upmedia.mg",92],["allthetests.com",93],["animanch.com",93],["aniroleplay.com",93],["apkmirror.com",[93,182]],["autoby.jp",93],["autofrage.net",93],["carscoops.com",93],["cinetrafic.fr",93],["cocokara-next.com",93],["computerfrage.net",93],["crosswordsolver.com",93],["cruciverba.it",93],["daily.co.jp",93],["dailydot.com",93],["dnevno.hr",93],["drweil.com",93],["dziennik.pl",93],["forsal.pl",93],["freemcserver.net",93],["game8.jp",93],["gardeningsoul.com",93],["gazetaprawna.pl",93],["globalrph.com",93],["golf-live.at",93],["heureka.cz",93],["horairesdouverture24.fr",93],["indiatimes.com",93],["infor.pl",93],["iza.ne.jp",93],["j-cast.com",93],["j-town.net",93],["jablickar.cz",93],["javatpoint.com",93],["kinmaweb.jp",93],["kreuzwortraetsel.de",93],["kurashiru.com",93],["kyoteibiyori.com",93],["lacuarta.com",93],["laleggepertutti.it",93],["livenewschat.eu",93],["malaymail.com",93],["mamastar.jp",93],["mirrored.to",93],["modhub.us",93],["motscroises.fr",93],["nana-press.com",93],["nikkan-gendai.com",93],["nyitvatartas24.hu",93],["oeffnungszeitenbuch.de",93],["onecall2ch.com",93],["oraridiapertura24.it",93],["palabr.as",93],["persoenlich.com",93],["petitfute.com",93],["powerpyx.com",93],["quefaire.be",93],["raetsel-hilfe.de",93],["ranking.net",93],["roleplayer.me",93],["rostercon.com",93],["samsungmagazine.eu",93],["slashdot.org",93],["sourceforge.net",93],["syosetu.com",93],["talkwithstranger.com",93],["the-crossword-solver.com",93],["thestockmarketwatch.com",93],["transparentcalifornia.com",93],["transparentnevada.com",93],["trilltrill.jp",93],["tvtv.ca",93],["tvtv.us",93],["ufret.jp",93],["verkaufsoffener-sonntag.com",93],["watchdocumentaries.com",93],["webdesignledger.com",93],["wetteronline.de",93],["wfmz.com",93],["winfuture.de",93],["word-grabber.com",93],["wort-suchen.de",93],["woxikon.*",93],["yugioh-starlight.com",93],["yutura.net",93],["zagreb.info",93],["2chblog.jp",93],["2monkeys.jp",93],["46matome.net",93],["akb48glabo.com",93],["akb48matomemory.com",93],["alfalfalfa.com",93],["all-nationz.com",93],["anihatsu.com",93],["aqua2ch.net",93],["blog.esuteru.com",93],["blog.livedoor.jp",93],["blog.jp",93],["blogo.jp",93],["chaos2ch.com",93],["choco0202.work",93],["crx7601.com",93],["danseisama.com",93],["dareda.net",93],["digital-thread.com",93],["doorblog.jp",93],["exawarosu.net",93],["fgochaldeas.com",93],["football-2ch.com",93],["gekiyaku.com",93],["golog.jp",93],["hacchaka.net",93],["heartlife-matome.com",93],["liblo.jp",93],["fesoku.net",93],["fiveslot777.com",93],["gamejksokuhou.com",93],["girlsreport.net",93],["girlsvip-matome.com",93],["grasoku.com",93],["gundamlog.com",93],["honyaku-channel.net",93],["ikarishintou.com",93],["imas-cg.net",93],["imihu.net",93],["inutomo11.com",93],["itainews.com",93],["itaishinja.com",93],["jin115.com",93],["jisaka.com",93],["jnews1.com",93],["jumpsokuhou.com",93],["jyoseisama.com",93],["keyakizaka46matomemory.net",93],["kidan-m.com",93],["kijoden.com",93],["kijolariat.net",93],["kijolifehack.com",93],["kijomatomelog.com",93],["kijyokatu.com",93],["kijyomatome.com",93],["kijyomatome-ch.com",93],["kijyomita.com",93],["kirarafan.com",93],["kitimama-matome.net",93],["kitizawa.com",93],["konoyubitomare.jp",93],["kotaro269.com",93],["kyousoku.net",93],["ldblog.jp",93],["livedoor.biz",93],["livedoor.blog",93],["majikichi.com",93],["matacoco.com",93],["matomeblade.com",93],["matomelotte.com",93],["matometemitatta.com",93],["mojomojo-licarca.com",93],["morikinoko.com",93],["nandemo-uketori.com",93],["netatama.net",93],["news-buzz1.com",93],["news30over.com",93],["nmb48-mtm.com",93],["norisoku.com",93],["npb-news.com",93],["ocsoku.com",93],["okusama-kijyo.com",93],["onihimechan.com",93],["orusoku.com",93],["otakomu.jp",93],["otoko-honne.com",93],["oumaga-times.com",93],["outdoormatome.com",93],["pachinkopachisro.com",93],["paranormal-ch.com",93],["recosoku.com",93],["s2-log.com",93],["saikyo-jump.com",93],["shuraba-matome.com",93],["ske48matome.net",93],["squallchannel.com",93],["sukattojapan.com",93],["sumaburayasan.com",93],["usi32.com",93],["uwakich.com",93],["uwakitaiken.com",93],["vault76.info",93],["vipnews.jp",93],["vippers.jp",93],["vtubernews.jp",93],["watarukiti.com",93],["world-fusigi.net",93],["zakuzaku911.com",93],["zch-vip.com",93],["mafiatown.pl",94],["bitcotasks.com",95],["hilites.today",96],["udvl.com",97],["www.chip.de",[98,99,100,101]],["topsporter.net",102],["sportshub.to",102],["streamcheck.link",103],["myanimelist.net",104],["unofficialtwrp.com",105],["codec.kyiv.ua",105],["kimcilonlyofc.com",105],["bitcosite.com",106],["bitzite.com",106],["celebzcircle.com",107],["bi-girl.net",107],["ftuapps.*",107],["hentaiseason.com",107],["hoodtrendspredict.com",107],["marcialhub.xyz",107],["odiadance.com",107],["osteusfilmestuga.online",107],["ragnarokscanlation.opchapters.com",107],["sampledrive.org",107],["showflix.*",107],["swordalada.org",107],["tojimangas.com",107],["tvappapk.com",107],["twobluescans.com",[107,108]],["varnascan.xyz",107],["teluguflix.*",109],["hacoos.com",110],["watchhentai.net",111],["hes-goals.io",111],["pkbiosfix.com",111],["casi3.xyz",111],["bondagevalley.cc",112],["zefoy.com",113],["mailgen.biz",114],["tempinbox.xyz",114],["vidello.net",115],["newscon.org",116],["yunjiema.top",116],["pcgeeks-games.com",116],["resizer.myct.jp",117],["gametohkenranbu.sakuraweb.com",118],["jisakuhibi.jp",119],["rank1-media.com",119],["lifematome.blog",120],["fm.sekkaku.net",121],["free-avx.jp",122],["dvdrev.com",123],["betweenjpandkr.blog",124],["nft-media.net",125],["ghacks.net",126],["leak.sx",127],["paste.bin.sx",127],["pornleaks.in",127],["truyentranhfull.net",128],["fcportables.com",128],["repack-games.com",128],["ibooks.to",128],["blog.tangwudi.com",128],["filecatchers.com",128],["actvid.*",129],["zoechip.com",129],["nohost.one",129],["vidbinge.com",129],["nectareousoverelate.com",131],["khoaiphim.com",132],["haafedk2.com",133],["fordownloader.com",133],["jovemnerd.com.br",134],["totalcsgo.com",135],["vivamax.asia",136],["manysex.com",137],["gaminginfos.com",138],["tinxahoivn.com",139],["automoto.it",140],["codelivly.com",141],["tchatche.com",142],["cryptoearns.com",142],["lordchannel.com",143],["client.falixnodes.net",144],["novelhall.com",145],["madeeveryday.com",146],["maidenhead-advertiser.co.uk",146],["mardomreport.net",146],["melangery.com",146],["milestomemories.com",146],["modernmom.com",146],["momtastic.com",146],["mostlymorgan.com",146],["motherwellmag.com",146],["muddybootsanddiamonds.com",146],["musicfeeds.com.au",146],["mylifefromhome.com",146],["nationalreview.com",146],["nordot.app",146],["oakvillenews.org",146],["observer.com",146],["ourlittlesliceofheaven.com",146],["palachinkablog.com",146],["patheos.com",146],["pinkonthecheek.com",146],["politicususa.com",146],["predic.ro",146],["puckermom.com",146],["qtoptens.com",146],["realgm.com",146],["reelmama.com",146],["robbreport.com",146],["royalmailchat.co.uk",146],["samchui.com",146],["sandrarose.com",146],["sherdog.com",146],["sidereel.com",146],["silive.com",146],["simpleflying.com",146],["sloughexpress.co.uk",146],["spacenews.com",146],["sportsgamblingpodcast.com",146],["spotofteadesigns.com",146],["stacysrandomthoughts.com",146],["ssnewstelegram.com",146],["superherohype.com",[146,150]],["tablelifeblog.com",146],["thebeautysection.com",146],["thecelticblog.com",146],["thecurvyfashionista.com",146],["thefashionspot.com",146],["thegamescabin.com",146],["thenerdyme.com",146],["thenonconsumeradvocate.com",146],["theprudentgarden.com",146],["thethings.com",146],["timesnews.net",146],["topspeed.com",146],["toyotaklub.org.pl",146],["travelingformiles.com",146],["tutsnode.org",146],["viralviralvideos.com",146],["wannacomewith.com",146],["wimp.com",[146,150]],["windsorexpress.co.uk",146],["woojr.com",146],["worldoftravelswithkids.com",146],["worldsurfleague.com",146],["abc17news.com",[146,149]],["adoredbyalex.com",146],["agrodigital.com",[146,149]],["al.com",[146,149]],["aliontherunblog.com",[146,149]],["allaboutthetea.com",[146,149]],["allmovie.com",[146,149]],["allmusic.com",[146,149]],["allthingsthrifty.com",[146,149]],["amessagewithabottle.com",[146,149]],["androidpolice.com",146],["antyradio.pl",146],["artforum.com",[146,149]],["artnews.com",[146,149]],["awkward.com",[146,149]],["awkwardmom.com",[146,149]],["bailiwickexpress.com",146],["barnsleychronicle.com",[146,150]],["becomingpeculiar.com",146],["bethcakes.com",[146,150]],["blogher.com",[146,150]],["bluegraygal.com",[146,150]],["briefeguru.de",[146,150]],["carmagazine.co.uk",146],["cattime.com",146],["cbr.com",146],["chaptercheats.com",[146,150]],["cleveland.com",[146,150]],["collider.com",146],["comingsoon.net",146],["commercialobserver.com",[146,150]],["competentedigitale.ro",[146,150]],["crafty.house",146],["dailyvoice.com",[146,150]],["decider.com",[146,150]],["didyouknowfacts.com",[146,150]],["dogtime.com",[146,150]],["dualshockers.com",146],["dustyoldthing.com",146],["faithhub.net",146],["femestella.com",[146,150]],["footwearnews.com",[146,150]],["freeconvert.com",[146,150]],["frogsandsnailsandpuppydogtail.com",[146,150]],["fsm-media.com",146],["funtasticlife.com",[146,150]],["fwmadebycarli.com",[146,150]],["gamerant.com",146],["gfinityesports.com",146],["givemesport.com",146],["gulflive.com",[146,150]],["helloflo.com",146],["homeglowdesign.com",[146,150]],["honeygirlsworld.com",[146,150]],["hotcars.com",146],["howtogeek.com",146],["insider-gaming.com",146],["insurancejournal.com",146],["jasminemaria.com",[146,150]],["kion546.com",[146,150]],["lehighvalleylive.com",[146,150]],["lettyskitchen.com",[146,150]],["lifeinleggings.com",[146,150]],["liveandletsfly.com",146],["lizzieinlace.com",[146,150]],["localnews8.com",[146,150]],["lonestarlive.com",[146,150]],["makeuseof.com",146],["masslive.com",[146,150,256]],["movieweb.com",146],["nj.com",[146,150]],["nothingbutnewcastle.com",[146,150]],["nsjonline.com",[146,150]],["oregonlive.com",[146,150]],["pagesix.com",[146,150,256]],["pennlive.com",[146,150,256]],["screenrant.com",146],["sheknows.com",[146,150]],["syracuse.com",[146,150,256]],["thegamer.com",146],["tvline.com",[146,150]],["cheatsheet.com",147],["pwinsider.com",147],["baeldung.com",147],["mensjournal.com",147],["c-span.org",148],["15min.lt",149],["247sports.com",[149,256]],["barcablaugranes.com",150],["betweenenglandandiowa.com",150],["bgr.com",150],["blazersedge.com",150],["blu-ray.com",150],["brobible.com",150],["cagesideseats.com",150],["cbsnews.com",[150,256]],["cbssports.com",[150,256]],["celiacandthebeast.com",150],["clickondetroit.com",150],["dailykos.com",150],["eater.com",150],["eldiariony.com",150],["fark.com",150],["free-power-point-templates.com",150],["golfdigest.com",150],["ibtimes.co.in",150],["imgur.com",150],["indiewire.com",[150,256]],["intouchweekly.com",150],["knowyourmeme.com",150],["last.fm",150],["lifeandstylemag.com",150],["mandatory.com",150],["naszemiasto.pl",150],["nationalpost.com",150],["nbcsports.com",150],["news.com.au",150],["ninersnation.com",150],["nypost.com",[150,256]],["playstationlifestyle.net",150],["rollingstone.com",150],["sbnation.com",150],["sneakernews.com",150],["sport-fm.gr",150],["stylecaster.com",150],["tastingtable.com",150],["thecw.com",150],["thedailymeal.com",150],["theflowspace.com",150],["themarysue.com",150],["tokfm.pl",150],["torontosun.com",150],["usmagazine.com",150],["wallup.net",150],["worldstar.com",150],["worldstarhiphop.com",150],["yourcountdown.to",150],["bagi.co.in",151],["keran.co",151],["biblestudytools.com",152],["christianheadlines.com",152],["ibelieve.com",152],["kuponigo.com",153],["inxxx.com",154],["bemyhole.com",154],["ipaspot.app",155],["embedwish.com",156],["filelions.live",156],["leakslove.net",156],["jenismac.com",157],["vxetable.cn",158],["nizarstream.com",159],["snapwordz.com",160],["toolxox.com",160],["rl6mans.com",160],["donghuaworld.com",161],["letsdopuzzles.com",162],["rediff.com",163],["igay69.com",164],["kimcilonly.link",165],["dzapk.com",166],["darknessporn.com",167],["familyporner.com",167],["freepublicporn.com",167],["pisshamster.com",167],["punishworld.com",167],["xanimu.com",167],["pig69.com",168],["cosplay18.pics",168],["sexwebvideo.com",168],["sexwebvideo.net",168],["tainio-mania.online",169],["eroticmoviesonline.me",170],["teleclub.xyz",171],["ecamrips.com",172],["showcamrips.com",172],["tucinehd.com",173],["9animetv.to",174],["qiwi.gg",175],["jornadaperfecta.com",176],["loseart.com",177],["sousou-no-frieren.com",178],["unite-guide.com",179],["thebullspen.com",180],["receitasdaora.online",181],["streambucket.net",183],["nontongo.win",183],["player.smashy.stream",184],["player.smashystream.com",184],["hentaihere.com",184],["torrentdownload.*",186],["cineb.rs",186],["123animehub.cc",186],["tukipasti.com",186],["cataz.to",186],["netmovies.to",186],["hiraethtranslation.com",187],["all3do.com",188],["do7go.com",188],["d0000d.com",188],["d000d.com",188],["d0o0d.com",188],["do0od.com",188],["doods.pro",188],["doodstream.*",188],["dooodster.com",188],["ds2play.com",188],["ds2video.com",188],["vidply.com",188],["xfreehd.com",189],["freethesaurus.com",190],["thefreedictionary.com",190],["dexterclearance.com",191],["x86.co.kr",192],["onlyfaucet.com",193],["x-x-x.tube",194],["fdownloader.net",195],["thehackernews.com",196],["mielec.pl",197],["treasl.com",198],["mrbenne.com",199],["cnpics.org",200],["ovabee.com",200],["porn4f.com",200],["cnxx.me",200],["ai18.pics",200],["sportsonline.si",201],["fiuxy2.co",202],["animeunity.to",203],["tokopedia.com",204],["remixsearch.net",205],["remixsearch.es",205],["onlineweb.tools",205],["sharing.wtf",205],["2024tv.ru",206],["modrinth.com",207],["curseforge.com",207],["xnxxcom.xyz",208],["sportsurge.net",209],["joyousplay.xyz",209],["quest4play.xyz",[209,211]],["generalpill.net",209],["moneycontrol.com",210],["cookiewebplay.xyz",211],["ilovetoplay.xyz",211],["streamcaster.live",211],["weblivehdplay.ru",211],["oaaxpgp3.xyz",212],["m9.news",213],["callofwar.com",214],["secondhandsongs.com",215],["nudezzers.org",216],["send.cm",217],["send.now",217],["3rooodnews.net",218],["xxxbfvideo.net",219],["filmy4wap.co.in",220],["filmy4waps.org",220],["gameshop4u.com",221],["regenzi.site",221],["historicaerials.com",222],["handirect.fr",223],["animefenix.tv",224],["fsiblog3.club",225],["kamababa.desi",225],["getfiles.co.uk",226],["genelify.com",227],["dhtpre.com",228],["xbaaz.com",229],["lineupexperts.com",231],["fearmp4.ru",232],["fbstreams.*",233],["m.shuhaige.net",234],["streamingnow.mov",235],["thesciencetoday.com",236],["sportnews.to",236],["ghbrisk.com",238],["iplayerhls.com",238],["bacasitus.com",239],["katoikos.world",239],["abstream.to",240],["pawastreams.pro",241],["rebajagratis.com",242],["tv.latinlucha.es",242],["fetcheveryone.com",243],["reviewdiv.com",244],["tojimanhwas.com",245],["laurelberninteriors.com",246],["godlike.com",247],["godlikeproductions.com",247],["botcomics.com",248],["cefirates.com",248],["chandlerorchards.com",248],["comicleaks.com",248],["marketdata.app",248],["monumentmetals.com",248],["tapmyback.com",248],["ping.gg",248],["revistaferramental.com.br",248],["hawpar.com",248],["alpacafinance.org",[248,249]],["nookgaming.com",248],["enkeleksamen.no",248],["kvest.ee",248],["creatordrop.com",248],["panpots.com",248],["cybernetman.com",248],["bitdomain.biz",248],["gerardbosch.xyz",248],["fort-shop.kiev.ua",248],["accuretawealth.com",248],["resourceya.com",248],["tracktheta.com",248],["camberlion.com",248],["replai.io",248],["trybawaryjny.pl",248],["segops.madisonspecs.com",248],["stresshelden-coaching.de",248],["controlconceptsusa.com",248],["ryaktive.com",248],["tip.etip-staging.etip.io",248],["tt.live",249],["future-fortune.com",249],["adventuretix.com",249],["bolighub.dk",249],["panprices.com",250],["intercity.technology",250],["freelancer.taxmachine.be",250],["adria.gg",250],["fjlaboratories.com",250],["emanualonline.com",250],["abhijith.page",250],["helpmonks.com",250],["dataunlocker.com",251],["proboards.com",252],["winclassic.net",252],["farmersjournal.ie",253],["pandadoc.com",255],["abema.tv",257]]);
const exceptionsMap = new Map([]);
const hasEntities = true;
const hasAncestors = false;

const collectArgIndices = (hn, map, out) => {
    let argsIndices = map.get(hn);
    if ( argsIndices === undefined ) { return; }
    if ( typeof argsIndices !== 'number' ) {
        for ( const argsIndex of argsIndices ) {
            out.add(argsIndex);
        }
    } else {
        out.add(argsIndices);
    }
};

const indicesFromHostname = (hostname, suffix = '') => {
    const hnParts = hostname.split('.');
    const hnpartslen = hnParts.length;
    if ( hnpartslen === 0 ) { return; }
    for ( let i = 0; i < hnpartslen; i++ ) {
        const hn = `${hnParts.slice(i).join('.')}${suffix}`;
        collectArgIndices(hn, hostnamesMap, todoIndices);
        collectArgIndices(hn, exceptionsMap, tonotdoIndices);
    }
    if ( hasEntities ) {
        const n = hnpartslen - 1;
        for ( let i = 0; i < n; i++ ) {
            for ( let j = n; j > i; j-- ) {
                const en = `${hnParts.slice(i,j).join('.')}.*${suffix}`;
                collectArgIndices(en, hostnamesMap, todoIndices);
                collectArgIndices(en, exceptionsMap, tonotdoIndices);
            }
        }
    }
};

const entries = (( ) => {
    const docloc = document.location;
    const origins = [ docloc.origin ];
    if ( docloc.ancestorOrigins ) {
        origins.push(...docloc.ancestorOrigins);
    }
    return origins.map((origin, i) => {
        const beg = origin.lastIndexOf('://');
        if ( beg === -1 ) { return; }
        const hn = origin.slice(beg+3)
        const end = hn.indexOf(':');
        return { hn: end === -1 ? hn : hn.slice(0, end), i };
    }).filter(a => a !== undefined);
})();
if ( entries.length === 0 ) { return; }

const todoIndices = new Set();
const tonotdoIndices = new Set();

indicesFromHostname(entries[0].hn);
if ( hasAncestors ) {
    for ( const entry of entries ) {
        if ( entry.i === 0 ) { continue; }
        indicesFromHostname(entry.hn, '>>');
    }
}

// Apply scriplets
for ( const i of todoIndices ) {
    if ( tonotdoIndices.has(i) ) { continue; }
    try { removeNodeText(...argsList[i]); }
    catch { }
}

/******************************************************************************/

// End of local scope
})();

void 0;
