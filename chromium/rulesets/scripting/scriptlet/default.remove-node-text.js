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
                    return tt.createPolicy(getRandomToken(), out);
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

function getRandomToken() {
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
        'RegExp': self.RegExp,
        'RegExp_test': self.RegExp.prototype.test,
        'RegExp_exec': self.RegExp.prototype.exec,
        'Request_clone': self.Request.prototype.clone,
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
const argsList = [["script","DisplayAcceptableAdIfAdblocked"],["script","adslotFilledByCriteo"],["script","/==undefined.*body/"],["script","\"Anzeige\""],["script","adserverDomain"],["script","Promise"],["script","/adbl/i"],["script","Reflect"],["script","document.write"],["script","deblocker"],["script","self == top"],["script","/popunder|isAdBlock|admvn.src/i"],["script","exdynsrv"],["script","adsbygoogle"],["script","FingerprintJS"],["script","/h=decodeURIComponent|popundersPerIP/"],["script","/adblock.php"],["script","/adb/i"],["script","/document\\.createElement|\\.banner-in/"],["script","admbenefits"],["script","WebAssembly"],["script","/\\badblock\\b/"],["script","myreadCookie"],["script","ExoLoader"],["script","/?key.*open/","condition","key"],["script","adblock"],["script","homad"],["script","popUnderUrl"],["script","Adblock"],["script","/ABDetected|navigator.brave|fetch/"],["script","/bypass.php"],["script","htmls"],["script","/\\/detected\\.html|Adblock/"],["script","toast"],["script","AdbModel"],["script","/popup/i"],["script","antiAdBlockerHandler"],["script","/ad\\s?block|adsBlocked|document\\.write\\(unescape\\('|devtool/i"],["script","onerror"],["script","location.assign"],["script","location.href"],["script","/checkAdBlocker|AdblockRegixFinder/"],["script","catch"],["script",";break;case $."],["script","adb_detected"],["script","window.open"],["script","/aclib|break;|zoneNativeSett/"],["script","/fetch|popupshow/"],["script","justDetectAdblock"],["script","/FingerprintJS|openPopup/"],["script","/decodeURIComponent\\(escape|fairAdblock/"],["script","/event\\.keyCode|DisableDevtool/"],["script","/adsbygoogle|detectAdBlock/"],["script","/WebAssembly|forceunder/"],["script","/isAdBlocked|popUnderUrl/"],["script","popundersPerIP"],["script","wpadmngr.com"],["script","/adb|offsetWidth/i"],["script","contextmenu"],["script","/adblock|var Data.*];/"],["script","var Data"],["script","replace"],["script",";}}};break;case $."],["script","globalThis;break;case"],["script","{delete window["],["style","text-decoration"],["script","/break;case|FingerprintJS/"],["script","push"],["script","AdBlocker"],["script","clicky"],["script","charCodeAt"],["script","/h=decodeURIComponent|\"popundersPerIP\"/"],["script","popMagic"],["script","/popMagic|pop1stp/"],["script","popunder"],["script","googlesyndication"],["script","blockAdBlock"],["script","/adblock|location\\.replace/"],["script","/downloadJSAtOnload|Object.prototype.toString.call/"],["script","numberPages"],["script","brave"],["script","error-report.com"],["script","KCgpPT57bGV0IGU"],["script","adShield"],["script","Ad-Shield"],["script",".xyz/script/"],["script","adrecover.com"],["script","html-load.com"],["script","AreLoaded"],["script","AdblockRegixFinder"],["script","/adScript|adsBlocked/"],["script","serve"],["script","?metric=transit.counter&key=fail_redirect&tags="],["script","/pushAdTag|link_click|getAds/"],["script","/\\', [0-9]{5}\\)\\]\\; \\}/"],["script","/\\\",\\\"clickp\\\"\\:\\\"[0-9]{1,2}\\\"/"],["script","/ConsoleBan|alert|AdBlocker/"],["script","runPop"],["style","body:not(.ownlist)"],["script","mdpDeblocker"],["script","alert","condition","adblock"],["script","/ai_|googletag|adb/"],["script","/deblocker|chp_ad/"],["script","await fetch"],["script","AdBlock"],["script","innerHTML"],["script","/'.adsbygoogle'|text-danger|warning|Adblock|_0x/"],["script","insertAdjacentHTML"],["script","popUnder"],["script","adb"],["#text","/スポンサーリンク|Sponsored Link|广告/"],["#text","スポンサーリンク"],["#text","スポンサードリンク"],["#text","/\\[vkExUnit_ad area=(after|before)\\]/"],["#text","【広告】"],["#text","【PR】"],["#text","関連動画"],["#text","PR:"],["script","leave_recommend"],["#text","/Advertisement/"],["script","navigator.brave"],["script","ai_adb"],["script","HTMLAllCollection"],["script","liedetector"],["script","popWin"],["script","end_click"],["script","ad blocker"],["script","closeAd"],["script","/adconfig/i"],["script","AdblockDetector"],["script","is_antiblock_refresh"],["script","/userAgent|adb|htmls/"],["script","myModal"],["script","app_checkext"],["script","clientHeight"],["script","await"],["script","Object.keys(window.adngin).length"],["script","axios"],["script","\"v4ac1eiZr0\""],["script","admiral"],["script","'').split(',')[4]"],["script","\"\").split(\",\")[4]"],["script","/\"v4ac1eiZr0\"|\"\"\\)\\.split\\(\",\"\\)\\[4\\]|(\\.localStorage\\)|JSON\\.parse\\(\\w)\\.getItem\\(\"/"],["script","/charAt|XMLHttpRequest/"],["script","AdBlockEnabled"],["script","window.location.replace"],["script","/$.*open/"],["script","Brave"],["script","egoTab"],["script","abDetectorPro"],["script","/$.*(css|oncontextmenu)/"],["script","/eval.*RegExp/"],["script","wwads"],["script","/\\[\\'push\\'\\]/"],["script","/adblock/i"],["script","/$.*adUnits/"],["script","RegExp"],["script","adbl"],["script","doOpen"],["script","/ads?Block/i"],["script","chkADB"],["script","Symbol.iterator"],["script","ai_cookie"],["script","/innerHTML.*appendChild/"],["script","Exo"],["script","detectAdBlock"],["script","AaDetector"],["script","popup"],["script","/window\\[\\'open\\'\\]/"],["script","Error"],["script","/document\\.head\\.appendChild|window\\.open/"],["script","pop1stp"],["script","Number"],["script","NEXT_REDIRECT"],["script","ad-block-activated"],["script","insertBefore"],["script","pop.doEvent"],["script","detect"],["script","fetch"],["script","/hasAdblock|detect/"],["script","document.createTextNode"],["script","/h=decodeURIComponent|popundersPerIP|adserverDomain/"],["script","/shown_at|WebAssembly/"],["script","style"],["script","shown_at"],["script","adsSrc"],["script","/adblock|popunder|openedPop|WebAssembly/"],["script","/popMagic|nativeads|navigator\\.brave|\\.abk_msg|\\.innerHTML|ad block|manipulation/"],["script","window.warn"],["script","adBlock"],["script","adBlockDetected"],["script","/fetch|adb/i"],["script","location"],["script","adblockimg"],["script","showAd"],["script","imgSrc"],["script","document.createElement(\"script\")"],["script","antiAdBlock"],["script","/fairAdblock|popMagic/"],["script","/pop1stp|detectAdBlock/"],["script","aclib.runPop"],["script","mega-enlace.com/ext.php?o="],["script","Popup"],["script","displayAdsV3"],["script","adblocker"],["script","break;case"],["h2","/creeperhost/i"],["script","/interceptClickEvent|onbeforeunload|popMagic|location\\.replace/"],["script","/adserverDomain|\\);break;case /"],["script","initializeInterstitial"],["script","popupBackground"],["script","Math.floor"],["script","m9-ad-modal"],["script","Anzeige"],["script","blocking"],["script","adBlockNotice"],["script","LieDetector"],["script","advads"],["script","document.cookie"],["script","/h=decodeURIComponent|popundersPerIP|window\\.open|\\.createElement/"],["script","/_0x|brave|onerror/"],["script","window.googletag.pubads"],["script","kmtAdsData"],["script","wpadmngr"],["script","navigator.userAgent"],["script","checkAdBlock"],["script","detectedAdblock"],["script","setADBFlag"],["script","/h=decodeURIComponent|popundersPerIP|wpadmngr|popMagic/"],["script","/wpadmngr|adserverDomain/"],["script","/account_ad_blocker|tmaAB/"],["script","ads_block"],["script","/adserverDomain|delete window|FingerprintJS/"],["script","return a.split"],["script","/popundersPerIP|adserverDomain|wpadmngr/"],["script","==\"]"],["script","ads-blocked"],["script","#adbd"],["script","AdBl"],["script","/adblock|Cuba|noadb/i"],["script","/adserverDomain|ai_cookie/"],["script","/adsBlocked|\"popundersPerIP\"/"],["script","ab.php"],["script","wpquads_adblocker_check"],["script","callbackAdsBlocked"],["script","/join\\(\\'\\'\\)/"],["script","/join\\(\\\"\\\"\\)/"],["script","api.dataunlocker.com"],["script","/^Function\\(\\\"/"],["script","vglnk"],["script","/RegExp\\(\\'/","condition","RegExp"],["script","adBlockEnabled"],["script","/stateObject|debu'|(;\\}){2}\\}\\(\\)\\)|\\({3}\\.(\\+\\)){3}/"],["script","\"data-adm-url\""],["script","NREUM"]];
const hostnamesMap = new Map([["alpin.de",0],["boersennews.de",0],["chefkoch.de",0],["chip.de",0],["clever-tanken.de",0],["desired.de",0],["donnerwetter.de",0],["fanfiktion.de",0],["focus.de",0],["formel1.de",0],["frustfrei-lernen.de",0],["gewinnspiele.tv",0],["giga.de",0],["gut-erklaert.de",0],["kino.de",0],["messen.de",0],["nickles.de",0],["nordbayern.de",0],["spielfilm.de",0],["teltarif.de",[0,1]],["unsere-helden.com",0],["weltfussball.at",0],["watson.de",0],["moviepilot.de",[0,5]],["mactechnews.de",0],["sport1.de",0],["welt.de",0],["sport.de",0],["allthingsvegas.com",2],["100percentfedup.com",2],["beforeitsnews.com",2],["concomber.com",2],["conservativebrief.com",2],["conservativefiringline.com",2],["dailylol.com",2],["funnyand.com",2],["letocard.fr",2],["mamieastuce.com",2],["meilleurpronostic.fr",2],["patriotnationpress.com",2],["toptenz.net",2],["vitamiiin.com",2],["writerscafe.org",2],["populist.press",2],["dailytruthreport.com",2],["livinggospeldaily.com",2],["first-names-meanings.com",2],["welovetrump.com",2],["thehayride.com",2],["thelibertydaily.com",2],["thepoke.co.uk",2],["thepolitistick.com",2],["theblacksphere.net",2],["shark-tank.com",2],["naturalblaze.com",2],["greatamericanrepublic.com",2],["dailysurge.com",2],["truthlion.com",2],["flagandcross.com",2],["westword.com",2],["republicbrief.com",2],["freedomfirstnetwork.com",2],["phoenixnewtimes.com",2],["designbump.com",2],["clashdaily.com",2],["madworldnews.com",2],["reviveusa.com",2],["sonsoflibertymedia.com",2],["thedesigninspiration.com",2],["videogamesblogger.com",2],["protrumpnews.com",2],["thepalmierireport.com",2],["kresy.pl",2],["thepatriotjournal.com",2],["gellerreport.com",2],["thegatewaypundit.com",2],["wltreport.com",2],["miaminewtimes.com",2],["politicalsignal.com",2],["rightwingnews.com",2],["bigleaguepolitics.com",2],["comicallyincorrect.com",2],["web.de",3],["skidrowreloaded.com",[4,15]],["wawacity.*",4],["720pstream.*",[4,62]],["embedsports.me",[4,66]],["embedstream.me",[4,14,15,62,66]],["jumbtv.com",[4,66]],["reliabletv.me",[4,66]],["topembed.pw",[4,64,210]],["crackstreamer.net",4],["methstreamer.com",4],["rnbastreams.com",4],["vidsrc.*",[4,14,62]],["1stream.eu",4],["4kwebplay.xyz",4],["anime4i.vip",4],["antennasports.ru",4],["buffsports.me",[4,62]],["buffstreams.app",4],["claplivehdplay.ru",[4,210]],["cracksports.me",[4,14]],["euro2024direct.ru",4],["ext.to",4],["extreme-down.*",4],["eztv.tf",4],["eztvx.to",4],["flix-wave.*",4],["hikaritv.xyz",4],["kenitv.me",[4,14,15]],["lewblivehdplay.ru",[4,210]],["mixdrop.*",[4,15]],["mlbbite.net",4],["mlbstreams.ai",4],["qatarstreams.me",[4,14]],["qqwebplay.xyz",[4,210]],["sanet.*",4],["soccerworldcup.me",[4,14]],["sportshd.*",4],["topstreams.info",4],["totalsportek.to",4],["viwlivehdplay.ru",4],["vidco.pro",[4,62]],["userupload.*",6],["cinedesi.in",6],["intro-hd.net",6],["monacomatin.mc",6],["nodo313.net",6],["hesgoal-tv.io",6],["hesgoal-vip.io",6],["earn.punjabworks.com",6],["mahajobwala.in",6],["solewe.com",6],["pahe.*",[7,15,64]],["soap2day.*",7],["yts.mx",8],["magesypro.com",9],["pinsystem.co.uk",9],["elrellano.com",9],["tinyppt.com",9],["veganab.co",9],["camdigest.com",9],["learnmany.in",9],["amanguides.com",[9,34]],["highkeyfinance.com",[9,34]],["appkamods.com",9],["techacode.com",9],["djqunjab.in",9],["downfile.site",9],["expertvn.com",9],["trangchu.news",9],["3dmodelshare.org",9],["nulleb.com",9],["asiaon.top",9],["reset-scans.*",9],["coursesghar.com",9],["thecustomrom.com",9],["snlookup.com",9],["bingotingo.com",9],["ghior.com",9],["3dmili.com",9],["karanpc.com",9],["plc247.com",9],["apkdelisi.net",9],["freepasses.org",9],["poplinks.*",[9,38]],["tomarnarede.pt",9],["basketballbuzz.ca",9],["dribbblegraphics.com",9],["kemiox.com",9],["teksnologi.com",9],["bharathwick.com",9],["descargaspcpro.net",9],["dx-tv.com",9],["rt3dmodels.com",9],["plc4me.com",9],["blisseyhusbands.com",9],["mhdsports.*",9],["mhdsportstv.*",9],["mhdtvsports.*",9],["mhdtvworld.*",9],["mhdtvmax.*",9],["mhdstream.*",9],["madaradex.org",9],["trigonevo.com",9],["franceprefecture.fr",9],["jazbaat.in",9],["aipebel.com",9],["audiotools.blog",9],["embdproxy.xyz",9],["hqq.*",10],["waaw.*",10],["upornia.com",11],["pixhost.*",12],["germancarforum.com",13],["cybercityhelp.in",13],["innateblogger.com",13],["omeuemprego.online",13],["viprow.*",[14,15,62]],["bluemediadownload.*",14],["bluemediafile.*",14],["bluemedialink.*",14],["bluemediastorage.*",14],["bluemediaurls.*",14],["urlbluemedia.*",14],["streamnoads.com",[14,15,53,62]],["bowfile.com",14],["cloudvideo.tv",[14,62]],["cloudvideotv.*",[14,62]],["coloredmanga.com",14],["exeo.app",14],["hiphopa.net",[14,15]],["megaup.net",14],["olympicstreams.co",[14,62]],["tv247.us",[14,15]],["uploadhaven.com",14],["userscloud.com",[14,62]],["mlbbox.me",14],["vikingf1le.us.to",14],["neodrive.xyz",14],["mdfx9dc8n.net",15],["mdzsmutpcvykb.net",15],["mixdrop21.net",15],["mixdropjmk.pw",15],["123-movies.*",15],["123movieshd.*",15],["123movieshub.*",15],["123moviesme.*",15],["1337x.*",[15,183]],["141jav.com",15],["1bit.space",15],["1bitspace.com",15],["1stream.*",15],["1tamilmv.*",15],["2ddl.*",15],["2umovies.*",15],["345movies.com",15],["3dporndude.com",15],["3hiidude.*",15],["4archive.org",15],["4horlover.com",15],["4stream.*",15],["560pmovie.com",15],["5movies.*",15],["7hitmovies.*",15],["85tube.com",15],["85videos.com",15],["9xmovie.*",15],["aagmaal.*",[15,62]],["acefile.co",15],["actusports.eu",15],["adblockeronstape.*",[15,53]],["adblockeronstreamtape.*",15],["adblockplustape.*",[15,53]],["adblockstreamtape.*",[15,53]],["adblockstrtape.*",[15,53]],["adblockstrtech.*",[15,53]],["adblocktape.*",[15,53]],["adclickersbot.com",15],["adcorto.*",15],["adricami.com",15],["adslink.pw",15],["adultstvlive.com",15],["adz7short.space",15],["aeblender.com",15],["ahdafnews.blogspot.com",15],["ak47sports.com",15],["akuma.moe",15],["alexsports.*",15],["alexsportss.*",15],["alexsportz.*",15],["allplayer.tk",15],["amateurblog.tv",15],["androidadult.com",[15,236]],["anhsexjav.xyz",15],["anidl.org",15],["anime-loads.org",15],["animeblkom.net",15],["animefire.plus",15],["animelek.me",15],["animepahe.*",15],["animesanka.*",15],["animespire.net",15],["animestotais.xyz",15],["animeyt.es",15],["animixplay.*",15],["aniplay.*",15],["anroll.net",15],["antiadtape.*",[15,53]],["anymoviess.xyz",15],["aotonline.org",15],["asenshu.com",15],["asialiveaction.com",15],["asianclipdedhd.net",15],["asianclub.*",15],["ask4movie.*",15],["askim-bg.com",15],["asumsikedaishop.com",15],["atomixhq.*",[15,62]],["atomohd.*",15],["avcrempie.com",15],["avseesee.com",15],["gettapeads.com",[15,53]],["backfirstwo.com",15],["bajarjuegospcgratis.com",15],["balkanportal.net",15],["balkanteka.net",15],["bdnewszh.com",[15,62]],["beinmatch.*",[15,24]],["belowporn.com",15],["bestgirlsexy.com",15],["bestnhl.com",15],["bestporn4free.com",15],["bestporncomix.com",15],["bet36.es",15],["bgwp.cc",[15,20]],["bhaai.*",15],["bikinitryon.net",15],["birdurls.com",15],["bitsearch.to",15],["blackcockadventure.com",15],["blackcockchurch.org",15],["blackporncrazy.com",15],["blizzboygames.net",15],["blizzpaste.com",15],["blkom.com",15],["blog-peliculas.com",15],["blogtrabalhista.com",15],["blurayufr.*",15],["bobsvagene.club",15],["bolly4umovies.click",15],["bonusharian.pro",15],["brilian-news.id",15],["brupload.net",15],["bucitana.com",15],["buffstreams.*",15],["camchickscaps.com",15],["camgirlcum.com",15],["camgirls.casa",15],["canalesportivo.*",15],["cashurl.in",15],["castingx.net",15],["ccurl.net",[15,62]],["celebrity-leaks.net",15],["cgpelis.net",15],["charexempire.com",15],["choosingnothing.com",15],["clasico.tv",15],["clickndownload.*",15],["clicknupload.*",15],["clik.pw",15],["coin-free.com",[15,31]],["coins100s.fun",15],["comicsmanics.com",15],["compucalitv.com",15],["coolcast2.com",15],["cosplaytab.com",15],["countylocalnews.com",15],["cpmlink.net",15],["crackstreamshd.click",15],["crespomods.com",15],["crisanimex.com",15],["crunchyscan.fr",15],["cuevana3.fan",15],["cuevana3hd.com",15],["cumception.com",15],["cutpaid.com",15],["daddylive.*",[15,62,208]],["daddylivehd.*",[15,62]],["dailyuploads.net",15],["datawav.club",15],["daughtertraining.com",15],["ddrmovies.*",15],["deepgoretube.site",15],["deltabit.co",15],["deporte-libre.top",15],["depvailon.com",15],["derleta.com",15],["desiremovies.*",15],["desivdo.com",15],["desixx.net",15],["detikkebumen.com",15],["deutschepornos.me",15],["devlib.*",15],["diasoft.xyz",15],["directupload.net",15],["diskusscan.com",15],["divxtotal.*",15],["divxtotal1.*",15],["dixva.com",15],["dlhd.*",15],["doctormalay.com",15],["dofusports.xyz",15],["dogemate.com",15],["doods.cam",15],["doodskin.lat",15],["downloadrips.com",15],["downvod.com",15],["dphunters.mom",15],["dragontranslation.com",15],["dvdfullestrenos.com",15],["dvdplay.*",[15,62]],["ebookbb.com",15],["ebookhunter.net",15],["egyanime.com",15],["egygost.com",15],["egyshare.cc",15],["ekasiwap.com",15],["electro-torrent.pl",15],["elil.cc",15],["elixx.*",15],["enjoy4k.*",15],["eplayer.click",15],["erovoice.us",15],["eroxxx.us",15],["estrenosdoramas.net",15],["estrenosflix.*",15],["estrenosflux.*",15],["estrenosgo.*",15],["everia.club",15],["everythinginherenet.blogspot.com",15],["extrafreetv.com",15],["extremotvplay.com",15],["f1stream.*",15],["fapinporn.com",15],["fapptime.com",15],["fashionblog.tv",15],["fastreams.live",15],["faucethero.com",15],["fbstream.*",15],["fembed.com",15],["femdom-joi.com",15],["file4go.*",15],["fileone.tv",15],["film1k.com",15],["filmeonline2023.net",15],["filmesonlinex.org",15],["filmesonlinexhd.biz",[15,62]],["filmovitica.com",15],["filmymaza.blogspot.com",15],["filmyzilla.*",[15,62]],["filthy.family",15],["findav.*",15],["findporn.*",15],["fixfinder.click",15],["flixmaza.*",15],["flizmovies.*",15],["flostreams.xyz",15],["flyfaucet.com",15],["footyhunter.lol",15],["forex-trnd.com",15],["forumchat.club",15],["forumlovers.club",15],["freemoviesonline.biz",15],["freeomovie.co.in",15],["freeomovie.to",15],["freeporncomic.net",15],["freepornhdonlinegay.com",15],["freeproxy.io",15],["freetvsports.*",15],["freeuse.me",15],["freeusexporn.com",15],["fsharetv.cc",15],["fsicomics.com",15],["fullymaza.*",15],["g3g.*",15],["galinhasamurai.com",15],["gamepcfull.com",15],["gameronix.com",15],["gamesfullx.com",15],["gameshdlive.net",15],["gamesmountain.com",15],["gamesrepacks.com",15],["gamingguru.fr",15],["gamovideo.com",15],["garota.cf",15],["gaydelicious.com",15],["gaypornmasters.com",15],["gaysex69.net",15],["gemstreams.com",15],["get-to.link",15],["girlscanner.org",15],["giurgiuveanul.ro",15],["gledajcrtace.xyz",15],["gocast2.com",15],["gomo.to",15],["gostosa.cf",15],["gotxx.*",15],["grantorrent.*",15],["gtlink.co",15],["gwiazdypornosow.pl",15],["haho.moe",15],["hatsukimanga.com",15],["hayhd.net",15],["hdmoviesfair.*",[15,62]],["hdmoviesflix.*",15],["hdsaprevodom.com",15],["hdstreamss.club",15],["hentais.tube",15],["hentaistream.co",15],["hentaitk.net",15],["hentaitube.online",15],["hentaiworld.tv",15],["hesgoal.tv",15],["hexupload.net",15],["hhkungfu.tv",15],["highlanderhelp.com",15],["hiidudemoviez.*",15],["hindimean.com",15],["hindimovies.to",[15,62]],["hiperdex.com",15],["hispasexy.org",15],["hitprn.com",15],["hoca4u.com",15],["hollymoviehd.cc",15],["hoodsite.com",15],["hopepaste.download",15],["hornylips.com",15],["hotgranny.live",15],["hotmama.live",15],["hqcelebcorner.net",15],["huren.best",15],["hwnaturkya.com",[15,62]],["hxfile.co",[15,62]],["igfap.com",15],["iklandb.com",15],["illink.net",15],["imgkings.com",15],["imgsen.*",15],["imgsex.xyz",15],["imgsto.*",15],["imx.to",15],["incest.*",15],["incestflix.*",15],["influencersgonewild.org",15],["infosgj.free.fr",15],["investnewsbrazil.com",15],["itdmusics.com",15],["itopmusic.*",15],["itsuseful.site",15],["itunesfre.com",15],["iwatchfriendsonline.net",[15,123]],["jackstreams.com",15],["jatimupdate24.com",15],["jav-fun.cc",15],["jav-noni.cc",15],["jav-scvp.com",15],["javcl.com",15],["javf.net",15],["javhay.net",15],["javhoho.com",15],["javhun.com",15],["javleak.com",15],["javmost.*",15],["javporn.best",15],["javsek.net",15],["javsex.to",15],["javtiful.com",[15,17]],["jimdofree.com",15],["jiofiles.org",15],["jorpetz.com",15],["jp-films.com",15],["jpop80ss3.blogspot.com",15],["jpopsingles.eu",[15,185]],["kantotflix.net",15],["kantotinyo.com",15],["kaoskrew.org",15],["kaplog.com",15],["keeplinks.*",15],["keepvid.*",15],["keralahd.*",15],["keralatvbox.com",15],["khatrimazaful.*",15],["khatrimazafull.*",[15,56]],["kickassanimes.io",15],["kimochi.info",15],["kimochi.tv",15],["kinemania.tv",15],["konstantinova.net",15],["koora-online.live",15],["kunmanga.com",15],["kutmoney.com",15],["kwithsub.com",15],["lat69.me",15],["latinblog.tv",15],["latinomegahd.net",15],["leechall.*",15],["leechpremium.link",15],["legendas.dev",15],["legendei.net",15],["lightdlmovies.blogspot.com",15],["lighterlegend.com",15],["linclik.com",15],["linkebr.com",15],["linkrex.net",15],["linkshorts.*",15],["lulu.st",15],["lulustream.com",[15,64]],["luluvdo.com",15],["manga-oni.com",15],["mangaboat.com",15],["mangagenki.me",15],["mangahere.onl",15],["mangaweb.xyz",15],["mangoporn.net",15],["mangovideo.*",15],["manhwahentai.me",15],["masahub.com",15],["masahub.net",15],["masaporn.*",15],["maturegrannyfuck.com",15],["mdy48tn97.com",15],["mediapemersatubangsa.com",15],["mega-mkv.com",15],["megapastes.com",15],["megapornpics.com",15],["messitv.net",15],["meusanimes.net",15],["milfmoza.com",15],["milfzr.com",15],["millionscast.com",15],["mimaletamusical.blogspot.com",15],["miniurl.*",15],["mirrorace.*",15],["mitly.us",15],["mixdroop.*",15],["mkv-pastes.com",15],["mkvcage.*",15],["mlbstream.*",15],["mlsbd.*",15],["mmsbee.*",15],["monaskuliner.ac.id",15],["moredesi.com",15],["motogpstream.*",15],["movgotv.net",15],["movi.pk",15],["movieplex.*",15],["movierulzlink.*",15],["movies123.*",15],["moviesflix.*",15],["moviesmeta.*",15],["moviessources.*",15],["moviesverse.*",15],["movieswbb.com",15],["moviewatch.com.pk",15],["moviezwaphd.*",15],["mp4upload.com",15],["mrskin.live",15],["mrunblock.*",15],["multicanaistv.com",15],["mundowuxia.com",15],["myeasymusic.ir",15],["myonvideo.com",15],["myyouporn.com",15],["narutoget.info",15],["naughtypiss.com",15],["nbastream.*",15],["nerdiess.com",15],["new-fs.eu",15],["newmovierulz.*",15],["newtorrentgame.com",15],["nflstream.*",15],["nflstreams.me",15],["nhlstream.*",15],["niaomea.me",[15,62]],["nicekkk.com",15],["nicesss.com",15],["nlegs.com",15],["noblocktape.*",[15,53]],["nocensor.*",15],["nolive.me",[15,62]],["notformembersonly.com",15],["novamovie.net",15],["novelpdf.xyz",15],["novelssites.com",[15,62]],["novelup.top",15],["nsfwr34.com",15],["nu6i-bg-net.com",15],["nudebabesin3d.com",15],["nukedfans.com",15],["nuoga.eu",15],["nzbstars.com",15],["o2tvseries.com",15],["ohjav.com",15],["ojearnovelas.com",15],["okanime.xyz",15],["olweb.tv",15],["on9.stream",15],["onepiece-mangaonline.com",15],["onifile.com",15],["onionstream.live",15],["onlinesaprevodom.net",15],["onlyfams.*",15],["onlyfullporn.video",15],["onplustv.live",15],["originporn.com",15],["ouo.*",15],["ovagames.com",15],["ovamusic.com",15],["packsporn.com",15],["pahaplayers.click",15],["palimas.org",15],["pandafiles.com",15],["password69.com",15],["pastemytxt.com",15],["payskip.org",15],["pctfenix.*",[15,62]],["pctnew.*",[15,62]],["peeplink.in",15],["peliculas24.*",15],["peliculasmx.net",15],["pelisplus.*",15],["pervertgirlsvideos.com",15],["pervyvideos.com",15],["phim12h.com",15],["picdollar.com",15],["pickteenz.com",15],["picsxxxporn.com",15],["pinayscandalz.com",15],["pinkueiga.net",15],["piratebay.*",15],["piratefast.xyz",15],["piratehaven.xyz",15],["pirateiro.com",15],["pirlotvonline.org",15],["playtube.co.za",15],["plugintorrent.com",15],["plyjam.*",15],["plylive.*",15],["plyvdo.*",15],["pmvzone.com",15],["porndish.com",15],["pornez.net",15],["pornfetishbdsm.com",15],["pornfits.com",15],["pornhd720p.com",15],["pornhoarder.*",[15,229]],["pornobr.club",15],["pornobr.ninja",15],["pornodominicano.net",15],["pornofaps.com",15],["pornoflux.com",15],["pornotorrent.com.br",15],["pornredit.com",15],["pornstarsyfamosas.es",15],["pornstreams.co",15],["porntn.com",15],["pornxbit.com",15],["pornxday.com",15],["portaldasnovinhas.shop",15],["portugues-fcr.blogspot.com",15],["poscitesch.com",[15,62]],["poseyoung.com",15],["pover.org",15],["prbay.*",15],["projectfreetv.*",15],["proxybit.*",15],["proxyninja.org",15],["psarips.*",15],["pubfilmz.com",15],["publicsexamateurs.com",15],["punanihub.com",15],["putlocker5movies.org",15],["pxxbay.com",15],["r18.best",15],["racaty.*",15],["ragnaru.net",15],["rapbeh.net",15],["rapelust.com",15],["rapload.org",15],["read-onepiece.net",15],["remaxhd.*",15],["retro-fucking.com",15],["retrotv.org",15],["rintor.*",15],["rnbxclusive.*",15],["rnbxclusive0.*",15],["rnbxclusive1.*",15],["robaldowns.com",15],["rockdilla.com",15],["rojadirecta.*",15],["rojadirectaenvivo.*",15],["rojadirectatvenvivo.com",15],["rojitadirecta.blogspot.com",15],["romancetv.site",15],["rsoccerlink.site",15],["rugbystreams.*",15],["rule34.club",15],["rule34hentai.net",15],["rumahbokep-id.com",15],["sadisflix.*",15],["safego.cc",15],["safetxt.*",15],["sakurafile.com",15],["satoshi-win.xyz",15],["scat.gold",15],["scatfap.com",15],["scatkings.com",15],["scnlog.me",15],["scripts-webmasters.net",15],["serie-turche.com",15],["serijefilmovi.com",15],["sexcomics.me",15],["sexdicted.com",15],["sexgay18.com",15],["sexofilm.co",15],["sextgem.com",15],["sextubebbw.com",15],["sgpics.net",15],["shadowrangers.*",15],["shadowrangers.live",15],["shahee4u.cam",15],["shahi4u.*",15],["shahid4u1.*",15],["shahid4uu.*",15],["shahiid-anime.net",15],["shavetape.*",15],["shemale6.com",15],["shinden.pl",15],["short.es",15],["shortearn.*",15],["shorten.*",15],["shorttey.*",15],["shortzzy.*",15],["showmanga.blog.fc2.com",15],["shrt10.com",15],["shurt.pw",15],["sideplusleaks.net",15],["silverblog.tv",15],["silverpic.com",15],["sinhalasub.life",15],["sinsitio.site",15],["sinvida.me",15],["skidrowcpy.com",15],["skidrowfull.com",15],["skymovieshd.*",15],["slut.mom",15],["smallencode.me",15],["smoner.com",15],["smplace.com",15],["soccerinhd.com",[15,62]],["socceron.name",15],["socceronline.*",[15,62]],["softairbay.com",15],["softarchive.*",15],["sokobj.com",15],["songsio.com",15],["souexatasmais.com",15],["sportbar.live",15],["sports-stream.*",15],["sportstream1.cfd",15],["sporttuna.*",15],["srt.am",15],["srts.me",15],["sshhaa.*",15],["stapadblockuser.*",[15,53]],["stape.*",[15,53]],["stapewithadblock.*",15],["starmusiq.*",15],["stbemuiptv.com",15],["stockingfetishvideo.com",15],["strcloud.*",[15,53]],["stream.crichd.vip",15],["stream.lc",15],["stream25.xyz",15],["streamadblocker.*",[15,53,62]],["streamadblockplus.*",[15,53]],["streambee.to",15],["streamcdn.*",15],["streamcenter.pro",15],["streamers.watch",15],["streamgo.to",15],["streamhub.*",15],["streamkiste.tv",15],["streamoupload.xyz",15],["streamservicehd.click",15],["streamsport.*",15],["streamta.*",[15,53]],["streamtape.*",[15,53]],["streamtapeadblockuser.*",[15,53]],["streamvid.net",[15,25]],["strikeout.*",[15,64]],["strtape.*",[15,53]],["strtapeadblock.*",[15,53]],["strtapeadblocker.*",[15,53]],["strtapewithadblock.*",15],["strtpe.*",[15,53]],["subtitleporn.com",15],["subtitles.cam",15],["suicidepics.com",15],["supertelevisionhd.com",15],["supexfeeds.com",15],["swatchseries.*",15],["swiftload.io",15],["swipebreed.net",15],["swzz.xyz",15],["sxnaar.com",15],["tabooflix.*",15],["tabooporns.com",15],["taboosex.club",15],["tapeantiads.com",[15,53]],["tapeblocker.com",[15,53]],["tapenoads.com",[15,53]],["tapewithadblock.org",[15,53,250]],["teamos.xyz",15],["teen-wave.com",15],["teenporncrazy.com",15],["telegramgroups.xyz",15],["telenovelasweb.com",15],["tennisstreams.*",15],["tensei-shitara-slime-datta-ken.com",15],["tfp.is",15],["tgo-tv.co",[15,62]],["thaihotmodels.com",15],["theblueclit.com",15],["thebussybandit.com",15],["thedaddy.to",[15,208]],["theicongenerator.com",15],["thelastdisaster.vip",15],["themoviesflix.*",15],["thepiratebay.*",15],["thepiratebay0.org",15],["thepiratebay10.info",15],["thesexcloud.com",15],["thothub.today",15],["tightsexteens.com",15],["tmearn.*",15],["tojav.net",15],["tokyoblog.tv",15],["toonanime.*",15],["top16.net",15],["topvideosgay.com",15],["torlock.*",15],["tormalayalam.*",15],["torrage.info",15],["torrents.vip",15],["torrentz2eu.*",15],["torrsexvid.com",15],["tpb-proxy.xyz",15],["trannyteca.com",15],["trendytalker.com",15],["tumanga.net",15],["turbogvideos.com",15],["turbovid.me",15],["turkishseriestv.org",15],["turksub24.net",15],["tutele.sx",15],["tutelehd.*",15],["tvglobe.me",15],["tvpclive.com",15],["tvply.*",15],["tvs-widget.com",15],["tvseries.video",15],["u4m.*",15],["ucptt.com",15],["ufaucet.online",15],["ufcfight.online",15],["ufcstream.*",15],["ultrahorny.com",15],["ultraten.net",15],["unblocknow.*",15],["unblockweb.me",15],["underhentai.net",15],["uniqueten.net",15],["upbaam.com",15],["uploadbuzz.*",15],["upstream.to",15],["usagoals.*",15],["valeriabelen.com",15],["verdragonball.online",15],["vexmoviex.*",15],["vfxmed.com",15],["vidclouds.*",15],["video.az",15],["videostreaming.rocks",15],["videowood.tv",15],["vidlox.*",15],["vidorg.net",15],["vidtapes.com",15],["vidz7.com",15],["vikistream.com",15],["vikv.net",15],["vipbox.*",[15,62]],["vipboxtv.*",[15,62]],["vipleague.*",[15,232]],["virpe.cc",15],["visifilmai.org",15],["viveseries.com",15],["vladrustov.sx",15],["volokit2.com",[15,208]],["vstorrent.org",15],["w-hentai.com",15],["watch-series.*",15],["watchbrooklynnine-nine.com",15],["watchelementaryonline.com",15],["watchjavidol.com",15],["watchkobestreams.info",15],["watchlostonline.net",15],["watchmonkonline.com",15],["watchrulesofengagementonline.com",15],["watchseries.*",15],["watchthekingofqueens.com",15],["webcamrips.com",15],["wincest.xyz",15],["wolverdon.fun",15],["wordcounter.icu",15],["worldmovies.store",15],["worldstreams.click",15],["wpdeployit.com",15],["wqstreams.tk",15],["wwwsct.com",15],["xanimeporn.com",15],["xblog.tv",15],["xclusivejams.*",15],["xmoviesforyou.*",15],["xn--verseriesespaollatino-obc.online",15],["xn--xvideos-espaol-1nb.com",15],["xpornium.net",15],["xsober.com",15],["xvip.lat",15],["xxgasm.com",15],["xxvideoss.org",15],["xxx18.uno",15],["xxxdominicana.com",15],["xxxfree.watch",15],["xxxmax.net",15],["xxxwebdlxxx.top",15],["xxxxvideo.uno",15],["y2b.wiki",15],["yabai.si",15],["yadixv.com",15],["yayanimes.net",15],["yeshd.net",15],["yodbox.com",15],["youdbox.*",15],["youjax.com",15],["yourdailypornvideos.ws",15],["yourupload.com",15],["ytmp3eu.*",15],["yts-subs.*",15],["yts.*",15],["ytstv.me",15],["zerion.cc",15],["zerocoin.top",15],["zitss.xyz",15],["zooqle.*",15],["zpaste.net",15],["1337x.ninjaproxy1.com",15],["y2tube.pro",15],["freeshot.live",15],["fastreams.com",15],["redittsports.com",15],["sky-sports.store",15],["streamsoccer.site",15],["tntsports.store",15],["wowstreams.co",15],["zdsptv.com",15],["tuktukcinma.com",15],["dutchycorp.*",16],["faucet.ovh",16],["mmacore.tv",17],["nxbrew.net",17],["oko.sh",[18,43,44]],["variety.com",19],["gameskinny.com",19],["deadline.com",19],["mlive.com",[19,138,142]],["atlasstudiousa.com",20],["51bonusrummy.in",[20,56]],["washingtonpost.com",21],["gosexpod.com",22],["sexo5k.com",23],["truyen-hentai.com",23],["theshedend.com",25],["zeroupload.com",25],["securenetsystems.net",25],["miniwebtool.com",25],["bchtechnologies.com",25],["eracast.cc",25],["flatai.org",25],["spiegel.de",26],["jacquieetmichel.net",27],["hausbau-forum.de",28],["althub.club",28],["kiemlua.com",28],["tea-coffee.net",29],["spatsify.com",29],["newedutopics.com",29],["getviralreach.in",29],["edukaroo.com",29],["funkeypagali.com",29],["careersides.com",29],["nayisahara.com",29],["wikifilmia.com",29],["infinityskull.com",29],["viewmyknowledge.com",29],["iisfvirtual.in",29],["starxinvestor.com",29],["jkssbalerts.com",29],["kenzo-flowertag.com",30],["mdn.lol",30],["btcbitco.in",31],["btcsatoshi.net",31],["cempakajaya.com",31],["crypto4yu.com",31],["gainl.ink",31],["manofadan.com",31],["readbitcoin.org",31],["wiour.com",31],["tremamnon.com",31],["bitsmagic.fun",31],["ourcoincash.xyz",31],["blog.cryptowidgets.net",32],["blog.insurancegold.in",32],["blog.wiki-topia.com",32],["blog.coinsvalue.net",32],["blog.cookinguide.net",32],["blog.freeoseocheck.com",32],["aylink.co",33],["sugarona.com",34],["nishankhatri.xyz",34],["cety.app",35],["exe-urls.com",35],["exego.app",35],["cutlink.net",35],["cutsy.net",35],["cutyurls.com",35],["cutty.app",35],["cutnet.net",35],["jixo.online",35],["tinys.click",36],["diendancauduong.com",36],["answerpython.com",36],["formyanime.com",36],["gsm-solution.com",36],["h-donghua.com",36],["hindisubbedacademy.com",36],["linksdramas2.blogspot.com",36],["mydverse.*",36],["pkgovjobz.com",36],["ripexbooster.xyz",36],["serial4.com",36],["serial412.blogspot.com",36],["sigmalinks.in",36],["tutorgaming.com",36],["everydaytechvams.com",36],["dipsnp.com",36],["cccam4sat.com",36],["zeemoontv-24.blogspot.com",36],["stitichsports.com",36],["aiimgvlog.fun",37],["appsbull.com",38],["diudemy.com",38],["maqal360.com",38],["mphealth.online",38],["makefreecallsonline.com",38],["androjungle.com",38],["bookszone.in",38],["drakescans.com",38],["shortix.co",38],["msonglyrics.com",38],["app-sorteos.com",38],["bokugents.com",38],["client.pylexnodes.net",38],["btvplus.bg",38],["blog24.me",[39,40]],["coingraph.us",41],["impact24.us",41],["iconicblogger.com",42],["auto-crypto.click",42],["tvi.la",[43,44]],["iir.la",[43,44]],["tii.la",[43,44]],["ckk.ai",[43,44]],["oei.la",[43,44]],["lnbz.la",[43,44]],["oii.la",[43,44,64]],["tpi.li",[43,44]],["shrinke.*",45],["shrinkme.*",45],["smutty.com",45],["e-sushi.fr",45],["freeadultcomix.com",45],["down.dataaps.com",45],["filmweb.pl",45],["livecamrips.*",45],["safetxt.net",45],["filespayouts.com",45],["atglinks.com",46],["kbconlinegame.com",47],["hamrojaagir.com",47],["odijob.com",47],["blogesque.net",48],["bookbucketlyst.com",48],["explorosity.net",48],["optimizepics.com",48],["stfly.*",48],["stly.*",48],["torovalley.net",48],["travize.net",48],["trekcheck.net",48],["metoza.net",48],["techlike.net",48],["snaplessons.net",48],["atravan.net",48],["transoa.net",48],["techmize.net",48],["crenue.net",48],["simana.online",49],["fooak.com",49],["joktop.com",49],["evernia.site",49],["falpus.com",49],["indiamaja.com",50],["newshuta.in",50],["celebzcircle.com",50],["bi-girl.net",50],["ftuapps.*",50],["hentaiseason.com",50],["hoodtrendspredict.com",50],["marcialhub.xyz",50],["odiadance.com",50],["osteusfilmestuga.online",50],["ragnarokscanlation.opchapters.com",50],["sampledrive.org",50],["showflix.*",50],["swordalada.org",50],["tojimangas.com",50],["tvappapk.com",50],["twobluescans.com",[50,101]],["varnascan.xyz",50],["dropgalaxy.*",51],["financemonk.net",51],["mastkhabre.com",52],["advertisertape.com",53],["tapeadsenjoyer.com",[53,62]],["tapeadvertisement.com",53],["tapelovesads.org",53],["watchadsontape.com",53],["vosfemmes.com",54],["voyeurfrance.net",54],["bollyflix.*",55],["neymartv.net",55],["streamhd247.info",55],["hindimoviestv.com",55],["buzter.xyz",55],["valhallas.click",55],["cuervotv.me",[55,62]],["aliezstream.pro",55],["daddy-stream.xyz",55],["daddylive1.*",55],["esportivos.*",55],["instream.pro",55],["mylivestream.pro",55],["poscitechs.*",55],["powerover.online",55],["sportea.link",55],["sportsurge.stream",55],["ufckhabib.com",55],["ustream.pro",55],["animeshqip.site",55],["apkship.shop",55],["buzter.pro",55],["enjoysports.bond",55],["filedot.to",55],["foreverquote.xyz",55],["hdstream.one",55],["kingstreamz.site",55],["live.fastsports.store",55],["livesnow.me",55],["livesports4u.pw",55],["masterpro.click",55],["nuxhallas.click",55],["papahd.info",55],["rgshows.me",55],["sportmargin.live",55],["sportmargin.online",55],["sportsloverz.xyz",55],["sportzlive.shop",55],["supertipzz.online",55],["totalfhdsport.xyz",55],["ultrastreamlinks.xyz",55],["usgate.xyz",55],["webmaal.cfd",55],["wizistreamz.xyz",55],["worldstreamz.shop",55],["g-porno.com",55],["g-streaming.com",55],["educ4m.com",55],["fromwatch.com",55],["visualnewshub.com",55],["bigwarp.io",55],["animeshqip.org",55],["uns.bio",55],["reshare.pm",55],["rahim-soft.com",56],["nekopoi.*",56],["x-video.tube",56],["rubystm.com",56],["rubyvid.com",56],["streamruby.com",56],["poophd.cc",56],["windowsreport.com",56],["fuckflix.click",56],["hyundaitucson.info",57],["exambd.net",58],["cgtips.org",59],["freewebcart.com",60],["siamblockchain.com",60],["emuenzen.de",61],["123movies.*",62],["123moviesla.*",62],["123movieweb.*",62],["2embed.*",62],["9xmovies.*",62],["adsh.cc",62],["adshort.*",62],["afilmyhouse.blogspot.com",62],["ak.sv",62],["allmovieshub.*",62],["animesultra.com",62],["api.webs.moe",62],["apkmody.io",62],["asianplay.*",62],["atishmkv.*",62],["attvideo.com",62],["backfirstwo.site",[62,153]],["bflix.*",62],["crazyblog.in",62],["cricstream.*",62],["crictime.*",62],["divicast.com",62],["dlhd.so",62],["dood.*",[62,186]],["dooood.*",[62,186]],["embed.meomeo.pw",62],["extramovies.*",62],["faselhd.*",62],["faselhds.*",62],["filemoon.*",62],["filmeserialeonline.org",62],["filmy.*",62],["filmyhit.*",62],["filmywap.*",62],["flexyhit.com",62],["fmovies.*",62],["foreverwallpapers.com",62],["french-streams.cc",62],["fslinks.org",62],["gdplayer.*",62],["goku.*",62],["gomovies.*",62],["gowatchseries.*",62],["hdfungamezz.*",62],["hdtoday.to",62],["hinatasoul.com",62],["hindilinks4u.*",62],["hurawatch.*",62],["igg-games.com",62],["infinityscans.net",62],["jalshamoviezhd.*",62],["livecricket.*",62],["mangareader.to",62],["membed.net",62],["mgnetu.com",62],["mhdsport.*",62],["mkvcinemas.*",[62,184]],["movies2watch.*",62],["moviespapa.*",62],["mp3juice.info",62],["mp3juices.cc",62],["mp4moviez.*",62],["mydownloadtube.*",62],["myflixerz.to",62],["nowmetv.net",62],["nowsportstv.com",62],["nuroflix.*",62],["nxbrew.com",62],["o2tvseries.*",62],["o2tvseriesz.*",62],["oii.io",62],["paidshitforfree.com",62],["pepperlive.info",62],["pirlotv.*",62],["playertv.net",62],["poscitech.*",62],["primewire.*",62],["putlocker68.com",62],["redecanais.*",62],["roystream.com",62],["rssing.com",62],["s.to",62],["serienstream.*",62],["sflix.*",62],["shahed4u.*",62],["shaheed4u.*",62],["share.filesh.site",62],["sharkfish.xyz",62],["skidrowcodex.net",62],["smartermuver.com",62],["speedostream.*",62],["sportcast.*",62],["sports-stream.site",62],["sportskart.*",62],["stream4free.live",62],["streamingcommunity.*",[62,64,76]],["tamilarasan.*",62],["tamilfreemp3songs.*",62],["tamilmobilemovies.in",62],["tamilprinthd.*",62],["thewatchseries.live",62],["tnmusic.in",62],["torrentdosfilmes.*",62],["travelplanspro.com",62],["tubemate.*",62],["tusfiles.com",62],["tutlehd4.com",62],["twstalker.com",62],["uploadrar.*",62],["uqload.*",62],["vid-guard.com",62],["vidcloud9.*",62],["vido.*",62],["vidoo.*",62],["vidsaver.net",62],["vidspeeds.com",62],["viralitytoday.com",62],["voiranime.stream",62],["vudeo.*",62],["vumoo.*",62],["watchdoctorwhoonline.com",62],["watchomovies.*",[62,74]],["watchserie.online",62],["webhostingpost.com",62],["woxikon.in",62],["www-y2mate.com",62],["yesmovies.*",62],["ylink.bid",62],["xn-----0b4asja7ccgu2b4b0gd0edbjm2jpa1b1e9zva7a0347s4da2797e8qri.xn--1ck2e1b",62],["kickassanime.*",63],["11xmovies.*",64],["buffshub.stream",64],["cinego.tv",64],["ev01.to",64],["fstream365.com",64],["fzmovies.*",64],["linkz.*",64],["minoplres.xyz",64],["mostream.us",64],["myflixer.*",64],["prmovies.*",64],["readcomiconline.li",64],["s3embtaku.pro",64],["sflix2.to",64],["sportshub.stream",64],["streamblasters.*",64],["topcinema.cam",64],["zonatmo.com",64],["animesaturn.cx",64],["filecrypt.*",64],["hunterscomics.com",64],["aniwave.uk",64],["kickass.*",65],["unblocked.id",67],["listendata.com",68],["7xm.xyz",68],["fastupload.io",68],["azmath.info",68],["wouterplanet.com",69],["androidacy.com",70],["pillowcase.su",71],["cine-calidad.*",72],["veryfreeporn.com",72],["theporngod.com",72],["besthdgayporn.com",73],["drivenime.com",73],["erothots1.com",73],["javup.org",73],["shemaleup.net",73],["transflix.net",73],["freeroms.com",74],["soap2day-online.com",74],["andhrafriends.com",74],["723qrh1p.fun",74],["beatsnoop.com",75],["fetchpik.com",75],["hackerranksolution.in",75],["camsrip.com",75],["help.sakarnewz.com",75],["austiblox.net",77],["btcbunch.com",78],["teachoo.com",[79,80]],["automobile-catalog.com",[81,82,87]],["motorbikecatalog.com",[81,82,87]],["topstarnews.net",81],["islamicfinder.org",81],["secure-signup.net",81],["dramabeans.com",81],["manta.com",81],["tportal.hr",81],["tvtropes.org",81],["wouldurather.io",81],["convertcase.net",81],["interfootball.co.kr",82],["a-ha.io",82],["cboard.net",82],["jjang0u.com",82],["joongdo.co.kr",82],["viva100.com",82],["gamingdeputy.com",82],["thesaurus.net",82],["alle-tests.nl",82],["maketecheasier.com",82],["allthekingz.com",82],["tweaksforgeeks.com",82],["m.inven.co.kr",82],["mlbpark.donga.com",82],["meconomynews.com",82],["brandbrief.co.kr",82],["motorgraph.com",82],["worldhistory.org",83],["bleepingcomputer.com",84],["lovelive-petitsoku.com",84],["pravda.com.ua",84],["mariowiki.com",85],["ap7am.com",86],["cinema.com.my",86],["dolldivine.com",86],["giornalone.it",86],["iplocation.net",86],["jamaicaobserver.com",86],["jawapos.com",86],["jutarnji.hr",86],["kompasiana.com",86],["mediaindonesia.com",86],["nmplus.hk",86],["slobodnadalmacija.hr",86],["upmedia.mg",86],["allthetests.com",87],["animanch.com",87],["aniroleplay.com",87],["apkmirror.com",[87,180]],["autoby.jp",87],["autofrage.net",87],["carscoops.com",87],["cinetrafic.fr",87],["computerfrage.net",87],["crosswordsolver.com",87],["cruciverba.it",87],["daily.co.jp",87],["dailydot.com",87],["dnevno.hr",87],["dziennik.pl",87],["forsal.pl",87],["freemcserver.net",87],["game8.jp",87],["gazetaprawna.pl",87],["globalrph.com",87],["golf-live.at",87],["heureka.cz",87],["horairesdouverture24.fr",87],["indiatimes.com",87],["infor.pl",87],["iza.ne.jp",87],["j-cast.com",87],["j-town.net",87],["jablickar.cz",87],["javatpoint.com",87],["kreuzwortraetsel.de",87],["kurashiru.com",87],["kyoteibiyori.com",87],["lacuarta.com",87],["laleggepertutti.it",87],["livenewschat.eu",87],["mamastar.jp",87],["mirrored.to",87],["modhub.us",87],["motscroises.fr",87],["nana-press.com",87],["nyitvatartas24.hu",87],["oeffnungszeitenbuch.de",87],["onecall2ch.com",87],["oraridiapertura24.it",87],["palabr.as",87],["persoenlich.com",87],["petitfute.com",87],["powerpyx.com",87],["quefaire.be",87],["raetsel-hilfe.de",87],["ranking.net",87],["roleplayer.me",87],["rostercon.com",87],["samsungmagazine.eu",87],["slashdot.org",87],["sourceforge.net",87],["syosetu.com",87],["talkwithstranger.com",87],["the-crossword-solver.com",87],["thestockmarketwatch.com",87],["transparentcalifornia.com",87],["transparentnevada.com",87],["trilltrill.jp",87],["tvtv.ca",87],["tvtv.us",87],["verkaufsoffener-sonntag.com",87],["watchdocumentaries.com",87],["webdesignledger.com",87],["wetteronline.de",87],["wfmz.com",87],["winfuture.de",87],["word-grabber.com",87],["wort-suchen.de",87],["woxikon.*",87],["yugioh-starlight.com",87],["yutura.net",87],["zagreb.info",87],["2chblog.jp",87],["2monkeys.jp",87],["46matome.net",87],["akb48glabo.com",87],["akb48matomemory.com",87],["alfalfalfa.com",87],["all-nationz.com",87],["anihatsu.com",87],["aqua2ch.net",87],["blog.esuteru.com",87],["blog.livedoor.jp",87],["blog.jp",87],["blogo.jp",87],["chaos2ch.com",87],["choco0202.work",87],["crx7601.com",87],["danseisama.com",87],["dareda.net",87],["digital-thread.com",87],["doorblog.jp",87],["exawarosu.net",87],["fgochaldeas.com",87],["football-2ch.com",87],["gekiyaku.com",87],["golog.jp",87],["hacchaka.net",87],["heartlife-matome.com",87],["liblo.jp",87],["fesoku.net",87],["fiveslot777.com",87],["gamejksokuhou.com",87],["girlsreport.net",87],["girlsvip-matome.com",87],["grasoku.com",87],["gundamlog.com",87],["honyaku-channel.net",87],["ikarishintou.com",87],["imas-cg.net",87],["imihu.net",87],["inutomo11.com",87],["itainews.com",87],["itaishinja.com",87],["jin115.com",87],["jisaka.com",87],["jnews1.com",87],["jumpsokuhou.com",87],["jyoseisama.com",87],["keyakizaka46matomemory.net",87],["kidan-m.com",87],["kijoden.com",87],["kijolariat.net",87],["kijolifehack.com",87],["kijomatomelog.com",87],["kijyokatu.com",87],["kijyomatome.com",87],["kijyomatome-ch.com",87],["kijyomita.com",87],["kirarafan.com",87],["kitimama-matome.net",87],["kitizawa.com",87],["konoyubitomare.jp",87],["kotaro269.com",87],["kyousoku.net",87],["ldblog.jp",87],["livedoor.biz",87],["livedoor.blog",87],["majikichi.com",87],["matacoco.com",87],["matomeblade.com",87],["matomelotte.com",87],["matometemitatta.com",87],["mojomojo-licarca.com",87],["morikinoko.com",87],["nandemo-uketori.com",87],["netatama.net",87],["news-buzz1.com",87],["news30over.com",87],["nmb48-mtm.com",87],["norisoku.com",87],["npb-news.com",87],["ocsoku.com",87],["okusama-kijyo.com",87],["onihimechan.com",87],["orusoku.com",87],["otakomu.jp",87],["otoko-honne.com",87],["oumaga-times.com",87],["outdoormatome.com",87],["pachinkopachisro.com",87],["paranormal-ch.com",87],["recosoku.com",87],["s2-log.com",87],["saikyo-jump.com",87],["shuraba-matome.com",87],["ske48matome.net",87],["squallchannel.com",87],["sukattojapan.com",87],["sumaburayasan.com",87],["uwakich.com",87],["uwakitaiken.com",87],["vault76.info",87],["vipnews.jp",87],["vtubernews.jp",87],["watarukiti.com",87],["world-fusigi.net",87],["zakuzaku911.com",87],["zch-vip.com",87],["mafiatown.pl",88],["bitcotasks.com",89],["hilites.today",90],["udvl.com",91],["www.chip.de",[92,93,94,95]],["topsporter.net",96],["sportshub.to",96],["streamcheck.link",97],["myanimelist.net",98],["unofficialtwrp.com",99],["codec.kyiv.ua",99],["kimcilonlyofc.com",99],["bitcosite.com",100],["bitzite.com",100],["teluguflix.*",102],["hacoos.com",103],["watchhentai.net",104],["hes-goals.io",104],["pkbiosfix.com",104],["casi3.xyz",104],["bondagevalley.cc",105],["zefoy.com",106],["mailgen.biz",107],["tempinbox.xyz",107],["vidello.net",108],["newscon.org",109],["yunjiema.top",109],["pcgeeks-games.com",109],["resizer.myct.jp",110],["gametohkenranbu.sakuraweb.com",111],["jisakuhibi.jp",112],["rank1-media.com",112],["lifematome.blog",113],["fm.sekkaku.net",114],["free-avx.jp",115],["dvdrev.com",116],["betweenjpandkr.blog",117],["nft-media.net",118],["ghacks.net",119],["leak.sx",120],["paste.bin.sx",120],["pornleaks.in",120],["truyentranhfull.net",121],["fcportables.com",121],["repack-games.com",121],["ibooks.to",121],["blog.tangwudi.com",121],["filecatchers.com",121],["actvid.*",122],["zoechip.com",122],["nohost.one",122],["vidbinge.com",122],["nectareousoverelate.com",124],["khoaiphim.com",125],["haafedk2.com",126],["fordownloader.com",126],["jovemnerd.com.br",127],["totalcsgo.com",128],["vivamax.asia",129],["manysex.com",130],["gaminginfos.com",131],["tinxahoivn.com",132],["automoto.it",133],["codelivly.com",134],["lordchannel.com",135],["client.falixnodes.net",136],["novelhall.com",137],["madeeveryday.com",138],["maidenhead-advertiser.co.uk",138],["mardomreport.net",138],["melangery.com",138],["milestomemories.com",138],["modernmom.com",138],["momtastic.com",138],["mostlymorgan.com",138],["motherwellmag.com",138],["muddybootsanddiamonds.com",138],["musicfeeds.com.au",138],["mylifefromhome.com",138],["nationalreview.com",138],["nordot.app",138],["oakvillenews.org",138],["observer.com",138],["ourlittlesliceofheaven.com",138],["palachinkablog.com",138],["patheos.com",138],["pinkonthecheek.com",138],["politicususa.com",138],["predic.ro",138],["puckermom.com",138],["qtoptens.com",138],["realgm.com",138],["reelmama.com",138],["robbreport.com",138],["royalmailchat.co.uk",138],["samchui.com",138],["sandrarose.com",138],["sherdog.com",138],["sidereel.com",138],["silive.com",138],["simpleflying.com",138],["sloughexpress.co.uk",138],["spacenews.com",138],["sportsgamblingpodcast.com",138],["spotofteadesigns.com",138],["stacysrandomthoughts.com",138],["ssnewstelegram.com",138],["superherohype.com",[138,141]],["tablelifeblog.com",138],["thebeautysection.com",138],["thecelticblog.com",138],["thecurvyfashionista.com",138],["thefashionspot.com",138],["thegamescabin.com",138],["thenerdyme.com",138],["thenonconsumeradvocate.com",138],["theprudentgarden.com",138],["thethings.com",138],["timesnews.net",138],["topspeed.com",138],["toyotaklub.org.pl",138],["travelingformiles.com",138],["tutsnode.org",138],["viralviralvideos.com",138],["wannacomewith.com",138],["wimp.com",[138,141]],["windsorexpress.co.uk",138],["woojr.com",138],["worldoftravelswithkids.com",138],["worldsurfleague.com",138],["abc17news.com",[138,141]],["adoredbyalex.com",138],["agrodigital.com",[138,141]],["al.com",[138,141]],["aliontherunblog.com",[138,141]],["allaboutthetea.com",[138,141]],["allmovie.com",[138,141]],["allmusic.com",[138,141]],["allthingsthrifty.com",[138,141]],["amessagewithabottle.com",[138,141]],["androidpolice.com",138],["antyradio.pl",138],["artforum.com",[138,141]],["artnews.com",[138,141]],["awkward.com",[138,141]],["awkwardmom.com",[138,141]],["bailiwickexpress.com",138],["barnsleychronicle.com",[138,142]],["becomingpeculiar.com",138],["bethcakes.com",[138,142]],["blogher.com",[138,142]],["bluegraygal.com",[138,142]],["briefeguru.de",[138,142]],["carmagazine.co.uk",138],["cattime.com",138],["cbr.com",138],["chaptercheats.com",[138,142]],["cleveland.com",[138,142]],["collider.com",138],["comingsoon.net",138],["commercialobserver.com",[138,142]],["competentedigitale.ro",[138,142]],["crafty.house",138],["dailyvoice.com",[138,142]],["decider.com",[138,142]],["didyouknowfacts.com",[138,142]],["dogtime.com",[138,142]],["dualshockers.com",138],["dustyoldthing.com",138],["faithhub.net",138],["femestella.com",[138,142]],["footwearnews.com",[138,142]],["freeconvert.com",[138,142]],["frogsandsnailsandpuppydogtail.com",[138,142]],["fsm-media.com",138],["funtasticlife.com",[138,142]],["fwmadebycarli.com",[138,142]],["gamerant.com",138],["gfinityesports.com",138],["givemesport.com",138],["gulflive.com",[138,142]],["helloflo.com",138],["homeglowdesign.com",[138,142]],["honeygirlsworld.com",[138,142]],["hotcars.com",138],["howtogeek.com",138],["insider-gaming.com",138],["insurancejournal.com",138],["jasminemaria.com",[138,142]],["kion546.com",[138,142]],["lehighvalleylive.com",[138,142]],["lettyskitchen.com",[138,142]],["lifeinleggings.com",[138,142]],["liveandletsfly.com",138],["lizzieinlace.com",[138,142]],["localnews8.com",[138,142]],["lonestarlive.com",[138,142]],["makeuseof.com",138],["masslive.com",[138,142,253]],["movieweb.com",138],["nj.com",[138,142]],["nothingbutnewcastle.com",[138,142]],["nsjonline.com",[138,142]],["oregonlive.com",[138,141]],["pagesix.com",[138,141,253]],["pennlive.com",[138,141,253]],["screenrant.com",138],["sheknows.com",[138,141]],["syracuse.com",[138,141,253]],["thegamer.com",138],["tvline.com",[138,141]],["cheatsheet.com",139],["pwinsider.com",139],["baeldung.com",139],["mensjournal.com",139],["c-span.org",140],["15min.lt",141],["247sports.com",[141,253]],["playstationlifestyle.net",141],["rollingstone.com",141],["sbnation.com",141],["sneakernews.com",141],["sport-fm.gr",141],["stylecaster.com",141],["tastingtable.com",141],["thecw.com",141],["thedailymeal.com",141],["theflowspace.com",141],["themarysue.com",141],["torontosun.com",141],["usmagazine.com",141],["wallup.net",141],["worldstar.com",141],["worldstarhiphop.com",141],["yourcountdown.to",141],["barcablaugranes.com",142],["betweenenglandandiowa.com",142],["bgr.com",142],["blazersedge.com",142],["blu-ray.com",142],["brobible.com",142],["cagesideseats.com",142],["cbsnews.com",[142,253]],["cbssports.com",[142,253]],["celiacandthebeast.com",142],["clickondetroit.com",142],["dailykos.com",142],["eater.com",142],["eldiariony.com",142],["fark.com",142],["free-power-point-templates.com",142],["golfdigest.com",142],["ibtimes.co.in",142],["imgur.com",142],["indiewire.com",[142,253]],["intouchweekly.com",142],["knowyourmeme.com",142],["last.fm",142],["lifeandstylemag.com",142],["mandatory.com",142],["nationalpost.com",142],["nbcsports.com",142],["news.com.au",142],["ninersnation.com",142],["nypost.com",[142,253]],["bagi.co.in",143],["keran.co",143],["biblestudytools.com",144],["christianheadlines.com",144],["ibelieve.com",144],["kuponigo.com",145],["kimcilonly.site",146],["kimcilonly.link",146],["cryptoearns.com",147],["inxxx.com",148],["bemyhole.com",148],["ipaspot.app",149],["embedwish.com",150],["filelions.live",150],["leakslove.net",150],["jenismac.com",151],["vxetable.cn",152],["jewelavid.com",153],["nizarstream.com",153],["snapwordz.com",154],["toolxox.com",154],["rl6mans.com",154],["idol69.net",154],["plumbersforums.net",155],["gulio.site",156],["mediaset.es",157],["updatewallah.in",157],["izlekolik.net",158],["donghuaworld.com",159],["letsdopuzzles.com",160],["rediff.com",161],["igay69.com",162],["dzapk.com",163],["darknessporn.com",164],["familyporner.com",164],["freepublicporn.com",164],["pisshamster.com",164],["punishworld.com",164],["xanimu.com",164],["pig69.com",165],["cosplay18.pics",165],["sexwebvideo.com",165],["sexwebvideo.net",165],["tainio-mania.online",166],["javhdo.net",167],["eroticmoviesonline.me",168],["teleclub.xyz",169],["ecamrips.com",170],["showcamrips.com",170],["tucinehd.com",171],["9animetv.to",172],["qiwi.gg",173],["jornadaperfecta.com",174],["loseart.com",175],["sousou-no-frieren.com",176],["unite-guide.com",177],["thebullspen.com",178],["receitasdaora.online",179],["streambucket.net",181],["nontongo.win",181],["player.smashy.stream",182],["player.smashystream.com",182],["hentaihere.com",182],["torrentdownload.*",184],["cineb.rs",184],["123animehub.cc",184],["tukipasti.com",184],["cataz.to",184],["hiraethtranslation.com",185],["d0000d.com",186],["d000d.com",186],["d0o0d.com",186],["do0od.com",186],["doods.pro",186],["doodstream.*",186],["dooodster.com",186],["ds2play.com",186],["ds2video.com",186],["vidply.com",186],["xfreehd.com",187],["freethesaurus.com",188],["thefreedictionary.com",188],["dexterclearance.com",189],["x86.co.kr",190],["onlyfaucet.com",191],["x-x-x.tube",192],["visionpapers.org",193],["fdownloader.net",194],["thehackernews.com",195],["mielec.pl",196],["treasl.com",197],["mrbenne.com",198],["cnpics.org",199],["ovabee.com",199],["porn4f.com",199],["cnxx.me",199],["ai18.pics",199],["sportsonline.si",200],["fiuxy2.co",201],["animeunity.to",202],["tokopedia.com",203],["remixsearch.net",204],["remixsearch.es",204],["onlineweb.tools",204],["sharing.wtf",204],["2024tv.ru",205],["modrinth.com",206],["curseforge.com",206],["xnxxcom.xyz",207],["sportsurge.net",208],["joyousplay.xyz",208],["quest4play.xyz",[208,210]],["generalpill.net",208],["moneycontrol.com",209],["cookiewebplay.xyz",210],["ilovetoplay.xyz",210],["streamcaster.live",210],["weblivehdplay.ru",210],["oaaxpgp3.xyz",211],["m9.news",212],["callofwar.com",213],["secondhandsongs.com",214],["nudezzers.org",215],["send.cm",216],["send.now",216],["3rooodnews.net",217],["xxxbfvideo.net",218],["filmy4wap.co.in",219],["filmy4waps.org",219],["gameshop4u.com",220],["regenzi.site",220],["historicaerials.com",221],["handirect.fr",222],["animefenix.tv",223],["fsiblog3.club",224],["kamababa.desi",224],["getfiles.co.uk",225],["genelify.com",226],["dhtpre.com",227],["xbaaz.com",228],["lineupexperts.com",230],["fearmp4.ru",231],["fbstreams.*",232],["m.shuhaige.net",233],["streamingnow.mov",234],["thesciencetoday.com",235],["ghbrisk.com",237],["iplayerhls.com",237],["bacasitus.com",238],["katoikos.world",238],["abstream.to",239],["pawastreams.pro",240],["rebajagratis.com",241],["tv.latinlucha.es",241],["fetcheveryone.com",242],["reviewdiv.com",243],["tojimanhwas.com",244],["botcomics.com",245],["cefirates.com",245],["chandlerorchards.com",245],["comicleaks.com",245],["marketdata.app",245],["monumentmetals.com",245],["tapmyback.com",245],["ping.gg",245],["revistaferramental.com.br",245],["hawpar.com",245],["alpacafinance.org",[245,246]],["nookgaming.com",245],["enkeleksamen.no",245],["kvest.ee",245],["creatordrop.com",245],["panpots.com",245],["cybernetman.com",245],["bitdomain.biz",245],["gerardbosch.xyz",245],["fort-shop.kiev.ua",245],["accuretawealth.com",245],["resourceya.com",245],["tracktheta.com",245],["camberlion.com",245],["replai.io",245],["trybawaryjny.pl",245],["segops.madisonspecs.com",245],["stresshelden-coaching.de",245],["controlconceptsusa.com",245],["ryaktive.com",245],["tip.etip-staging.etip.io",245],["tt.live",246],["future-fortune.com",246],["adventuretix.com",246],["bolighub.dk",246],["panprices.com",247],["intercity.technology",247],["freelancer.taxmachine.be",247],["adria.gg",247],["fjlaboratories.com",247],["emanualonline.com",247],["abhijith.page",247],["helpmonks.com",247],["dataunlocker.com",248],["proboards.com",249],["winclassic.net",249],["pandadoc.com",251],["japscan.lol",252],["abema.tv",254]]);
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
