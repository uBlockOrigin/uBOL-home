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

// ruleset: ublock-filters

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
            if ( Object.hasOwn(targets, prop) === false ) { continue; }
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
const argsList = [["script","window,\"fetch\""],["script","offsetParent"],["script","/adblock/i"],["script","location.reload"],["script","adBlockEnabled"],["script","\"Anzeige\""],["script","adserverDomain"],["script","Promise"],["script","/adbl/i"],["script","Reflect"],["script","document.write"],["script","deblocker"],["script","self == top"],["script","exdynsrv"],["script","/delete window|adserverDomain|FingerprintJS/"],["script","delete window"],["script","adsbygoogle"],["script","FingerprintJS"],["script","/h=decodeURIComponent|popundersPerIP/"],["script","/adblock.php"],["script","/adb/i"],["script","/document\\.createElement|\\.banner-in/"],["script","admbenefits"],["script","/\\badblock\\b/"],["script","myreadCookie"],["script","ExoLoader"],["script","/?key.*open/","condition","key"],["script","adblock"],["script","homad"],["script","popUnderUrl"],["script","Adblock"],["script","WebAssembly"],["script","/ABDetected|navigator.brave|fetch/"],["script","/ai_|b2a/"],["script","window.adblockDetector"],["script","DName"],["script","/bypass.php"],["script","htmls"],["script","toast"],["script","AdbModel"],["script","/popup/i"],["script","antiAdBlockerHandler"],["script","/ad\\s?block|adsBlocked|document\\.write\\(unescape\\('|devtool/i"],["script","onerror"],["script","location.assign"],["script","location.href"],["script","/checkAdBlocker|AdblockRegixFinder/"],["script","catch"],["script","/adb_detected|;break;case \\$\\./"],["script","window.open"],["script","/aclib|break;|zoneNativeSett/"],["script","/fetch|popupshow/"],["script","justDetectAdblock"],["script","/FingerprintJS|openPopup/"],["script","DisableDevtool"],["script","popUp"],["script","/adsbygoogle|detectAdBlock/"],["script","onDevToolOpen"],["script","detectAdBlock"],["script","ctrlKey"],["script","/\\);break;case|advert_|POPUNDER_URL|adblock/"],["script","DisplayAcceptableAdIfAdblocked"],["script","adslotFilledByCriteo"],["script","/==undefined.*body/"],["script","/popunder|isAdBlock|admvn.src/i"],["script","/h=decodeURIComponent|\"popundersPerIP\"/"],["script","popMagic"],["script","/popMagic|pop1stp/"],["script","/shown_at|WebAssembly/"],["script",";}}};break;case $."],["script","globalThis;break;case"],["script","{delete window["],["script","wpadmngr.com"],["script","/decodeURIComponent\\(escape|fairAdblock/"],["script","/ai_|googletag|adb/"],["script","ai_adb"],["script","\"v4ac1eiZr0\""],["script","admiral"],["script","'').split(',')[4]"],["script","/\"v4ac1eiZr0\"|\"\"\\)\\.split\\(\",\"\\)\\[4\\]|(\\.localStorage\\)|JSON\\.parse\\(\\w)\\.getItem\\(\"|[\"']_aQS0\\w+[\"']/"],["script","error-report.com"],["script","html-load.com"],["script","KCgpPT57bGV0IGU"],["script","Ad-Shield"],["script","adrecover.com"],["script","/bizx|prebid/"],["script","\"data-sdk\""],["script","/adbl|RegExp/i"],["script","/WebAssembly|forceunder/"],["script","/isAdBlocked|popUnderUrl/"],["script","/adb|offsetWidth|eval/i"],["script","contextmenu"],["script","/adblock|var Data.*];/"],["script","var Data"],["script","replace"],["style","text-decoration"],["script","/break;case|FingerprintJS/"],["script","push"],["script","AdBlocker"],["script","clicky"],["script","XV"],["script","onload"],["script","Popunder"],["script","charCodeAt"],["script","localStorage"],["script","popunder"],["script","adbl"],["script","googlesyndication"],["script","blockAdBlock"],["script","/downloadJSAtOnload|Object.prototype.toString.call/"],["script","numberPages"],["script","brave"],["script","AreLoaded"],["script","AdblockRegixFinder"],["script","/adScript|adsBlocked/"],["script","serve"],["script","?metric=transit.counter&key=fail_redirect&tags="],["script","/pushAdTag|link_click|getAds/"],["script","/\\', [0-9]{5}\\)\\]\\; \\}/"],["script","/\\\",\\\"clickp\\\"\\:\\\"[0-9]{1,2}\\\"/"],["script","/ConsoleBan|alert|AdBlocker/"],["style","body:not(.ownlist)"],["script","mdpDeblocker"],["script","alert","condition","adblock"],["script","/deblocker|chp_ad/"],["script","await fetch"],["script","AdBlock"],["script","/'.adsbygoogle'|text-danger|warning|Adblock|_0x/"],["script","insertAdjacentHTML"],["script","popUnder"],["script","adb"],["#text","/スポンサーリンク|Sponsored Link|广告/"],["#text","スポンサーリンク"],["#text","スポンサードリンク"],["#text","/\\[vkExUnit_ad area=(after|before)\\]/"],["#text","【広告】"],["#text","関連動画"],["#text","PR:"],["script","leave_recommend"],["#text","/Advertisement/"],["script","navigator.brave"],["script","popundersPerIP"],["script","liedetector"],["script","end_click"],["script","getComputedStyle"],["script","closeAd"],["script","/adconfig/i"],["script","is_antiblock_refresh"],["script","/userAgent|adb|htmls/"],["script","myModal"],["script","open"],["script","app_checkext"],["script","ad blocker"],["script","clientHeight"],["script","Brave"],["script","await"],["script","axios"],["script","/charAt|XMLHttpRequest/"],["script","AdBlockEnabled"],["script","window.location.replace"],["script","egoTab"],["script","/$.*(css|oncontextmenu)/"],["script","/eval.*RegExp/"],["script","wwads"],["script","/\\[\\'push\\'\\]/"],["script","/ads?Block/i"],["script","chkADB"],["script","Symbol.iterator"],["script","ai_cookie"],["script","/innerHTML.*appendChild/"],["script","Exo"],["script","AaDetector"],["script","/window\\[\\'open\\'\\]/"],["script","Error"],["script","/document\\.head\\.appendChild|window\\.open/"],["script","pop1stp"],["script","Number"],["script","NEXT_REDIRECT"],["script","ad-block-activated"],["script","insertBefore"],["script","pop.doEvent"],["script","Ads"],["script","detect"],["script","fetch"],["script","/hasAdblock|detect/"],["script","document.createTextNode"],["script","adsSrc"],["script","/adblock|popunder|openedPop|WebAssembly|wpadmngr/"],["script","/popMagic|nativeads|navigator\\.brave|\\.abk_msg|\\.innerHTML|ad block|manipulation/"],["script","window.warn"],["script","adBlock"],["script","adBlockDetected"],["script","/fetch|adb/i"],["script","location"],["script","showAd"],["script","imgSrc"],["script","document.createElement(\"script\")"],["script","antiAdBlock"],["script","/fairAdblock|popMagic/"],["script","/pop1stp|detectAdBlock/"],["script","aclib.runPop"],["script","mega-enlace.com/ext.php?o="],["script","Popup"],["script","displayAdsV3"],["script","adblocker"],["script","break;case"],["h2","/creeperhost/i"],["script","/interceptClickEvent|onbeforeunload|popMagic|location\\.replace/"],["script","/adserverDomain|\\);break;case /"],["script","initializeInterstitial"],["script","popupBackground"],["script","/h=decodeURIComponent|popundersPerIP|adserverDomain/"],["script","m9-ad-modal"],["script","Anzeige"],["script","blocking"],["script","HTMLAllCollection"],["script","LieDetector"],["script","advads"],["script","document.cookie"],["script","/h=decodeURIComponent|popundersPerIP|window\\.open|\\.createElement/"],["script","/_0x|brave|onerror/"],["script","window.googletag.pubads"],["script","kmtAdsData"],["script","wpadmngr"],["script","navigator.userAgent"],["script","checkAdBlock"],["script","detectedAdblock"],["script","setADBFlag"],["script","/h=decodeURIComponent|popundersPerIP|wpadmngr|popMagic/"],["script","/wpadmngr|adserverDomain/"],["script","/account_ad_blocker|tmaAB/"],["script","ads_block"],["script","/adserverDomain|delete window|FingerprintJS/"],["script","return a.split"],["script","/popundersPerIP|adserverDomain|wpadmngr/"],["script","==\"]"],["script","ads-blocked"],["script","#adbd"],["script","AdBl"],["script","/adblock|Cuba|noadb|popundersPerIP/i"],["script","/adserverDomain|ai_cookie/"],["script","/adsBlocked|\"popundersPerIP\"/"],["script","ab.php"],["script","wpquads_adblocker_check"],["script","__adblocker"],["script","/alert|brave|blocker/i"],["script","/ai_|eval|Google/"],["script","/eval|adb/i"],["script","catcher"],["script","/setADBFlag|cRAds|\\;break\\;case|adManager|const popup/"],["script","/isAdBlockActive|WebAssembly/"],["script","videoList"],["script","freestar"],["script","/admiral/i"],["script","/AdBlock/i"],["script","/andbox|adBlock|data-zone|histats|contextmenu|ConsoleBan/"],["script","closePlayer"],["script","/detect|WebAssembly/"],["script","_0x"],["script","destroyContent"],["script","advanced_ads_check_adblocker"],["script","'hidden'"],["script","/dismissAdBlock|533092QTEErr/"],["script","/join\\(\\'\\'\\)/"],["script","/join\\(\\\"\\\"\\)/"],["script","api.dataunlocker.com"],["script","/^Function\\(\\\"/"],["script","vglnk"],["script","/detect|FingerprintJS/"],["script","/RegExp\\(\\'/","condition","RegExp"]];
const hostnamesMap = new Map([["www.youtube.com",0],["poophq.com",1],["veev.to",1],["faqwiki.*",2],["snapwordz.com",2],["toolxox.com",2],["rl6mans.com",2],["nontonx.com",3],["pandadoc.com",4],["web.de",5],["skidrowreloaded.com",[6,18]],["1337x.*",[6,18]],["1stream.eu",6],["4kwebplay.xyz",6],["alldownplay.xyz",6],["anime4i.vip",6],["antennasports.ru",6],["boxingstream.me",6],["buffstreams.app",6],["claplivehdplay.ru",[6,210]],["cracksports.me",[6,17]],["cricstream.me",6],["dartsstreams.com",6],["euro2024direct.ru",6],["ext.to",6],["extrem-down.*",6],["extreme-down.*",6],["eztv.*",6],["eztvx.to",6],["f1box.me",6],["flix-wave.*",6],["flixrave.me",6],["golfstreams.me",6],["hikaritv.xyz",6],["ianimes.one",6],["jointexploit.net",[6,18]],["kenitv.me",[6,17]],["lewblivehdplay.ru",[6,210]],["mediacast.click",6],["mixdrop.*",[6,18]],["mlbbite.net",6],["mlbstreams.ai",6],["motogpstream.me",6],["nbabox.me",6],["nflbox.me",6],["nhlbox.me",6],["playcast.click",6],["qatarstreams.me",[6,17]],["qqwebplay.xyz",[6,210]],["rnbastreams.com",6],["rugbystreams.me",6],["sanet.*",6],["socceronline.me",6],["soccerworldcup.me",[6,17]],["sportshd.*",6],["streamed.su",6],["sushiscan.net",6],["topstreams.info",6],["totalsportek.to",6],["tvableon.me",[6,17]],["vibestreams.*",6],["vipstand.pm",6],["worldsports.me",6],["x1337x.*",6],["wawacity.*",6],["720pstream.*",[6,69]],["embedsports.me",[6,96]],["embedstream.me",[6,17,18,69,96]],["jumbtv.com",[6,96]],["reliabletv.me",[6,96]],["topembed.pw",[6,71,210]],["crackstreamer.net",6],["methstreamer.com",6],["vidsrc.*",[6,17,69]],["vidco.pro",[6,69]],["freestreams-live.*>>",6],["moviepilot.de",[7,61]],["userupload.*",8],["cinedesi.in",8],["intro-hd.net",8],["monacomatin.mc",8],["nodo313.net",8],["mhdtvsports.*",[8,11]],["hesgoal-tv.io",8],["hesgoal-vip.io",8],["earn.punjabworks.com",8],["mahajobwala.in",8],["solewe.com",8],["panel.play.hosting",8],["total-sportek.to",8],["hesgoal-vip.to",8],["shoot-yalla.me",8],["shoot-yalla-tv.live",8],["pahe.*",[9,18,71]],["soap2day.*",9],["yts.mx",10],["magesypro.com",11],["pinsystem.co.uk",11],["elrellano.com",11],["tinyppt.com",11],["veganab.co",11],["camdigest.com",11],["learnmany.in",11],["amanguides.com",[11,39]],["highkeyfinance.com",[11,39]],["appkamods.com",11],["techacode.com",11],["djqunjab.in",11],["downfile.site",11],["expertvn.com",11],["trangchu.news",11],["3dmodelshare.org",11],["nulleb.com",11],["asiaon.top",11],["reset-scans.*",11],["thecustomrom.com",11],["snlookup.com",11],["bingotingo.com",11],["ghior.com",11],["3dmili.com",11],["karanpc.com",11],["plc247.com",11],["apkdelisi.net",11],["freepasses.org",11],["poplinks.*",[11,43]],["tomarnarede.pt",11],["basketballbuzz.ca",11],["dribbblegraphics.com",11],["kemiox.com",11],["teksnologi.com",11],["bharathwick.com",11],["descargaspcpro.net",11],["dx-tv.com",[11,18]],["rt3dmodels.com",11],["plc4me.com",11],["blisseyhusbands.com",11],["mhdsports.*",11],["mhdsportstv.*",11],["mhdtvworld.*",11],["mhdtvmax.*",11],["mhdstream.*",11],["madaradex.org",11],["trigonevo.com",11],["franceprefecture.fr",11],["jazbaat.in",11],["aipebel.com",11],["audiotools.blog",11],["embdproxy.xyz",11],["hqq.*",12],["waaw.*",12],["pixhost.*",13],["vipbox.*",14],["telerium.*",15],["apex2nova.com",15],["hoca5.com",15],["germancarforum.com",16],["cybercityhelp.in",16],["innateblogger.com",16],["omeuemprego.online",16],["viprow.*",[17,18,69]],["bluemediadownload.*",17],["bluemediafile.*",17],["bluemedialink.*",17],["bluemediastorage.*",17],["bluemediaurls.*",17],["urlbluemedia.*",17],["bowfile.com",17],["cloudvideo.tv",[17,69]],["cloudvideotv.*",[17,69]],["coloredmanga.com",17],["exeo.app",17],["hiphopa.net",[17,18]],["megaup.net",17],["olympicstreams.co",[17,69]],["tv247.us",[17,18]],["uploadhaven.com",17],["userscloud.com",[17,69]],["streamnoads.com",[17,18,69,88]],["mlbbox.me",17],["vikingf1le.us.to",17],["neodrive.xyz",17],["mdfx9dc8n.net",18],["mdzsmutpcvykb.net",18],["mixdrop21.net",18],["mixdropjmk.pw",18],["123-movies.*",18],["123movieshd.*",18],["123movieshub.*",18],["123moviesme.*",18],["1337x.ninjaproxy1.com",18],["141jav.com",18],["141tube.com",18],["1bit.space",18],["1bitspace.com",18],["1stream.*",18],["1tamilmv.*",18],["2ddl.*",18],["2umovies.*",18],["3dporndude.com",18],["3hiidude.*",18],["4archive.org",18],["4horlover.com",18],["4stream.*",18],["560pmovie.com",18],["5movies.*",18],["7hitmovies.*",18],["85videos.com",18],["9xmovie.*",18],["aagmaal.*",[18,69]],["acefile.co",18],["actusports.eu",18],["adblockeronstape.*",[18,88]],["adblockeronstreamtape.*",18],["adblockplustape.*",[18,88]],["adblockstreamtape.*",[18,88]],["adblockstrtape.*",[18,88]],["adblockstrtech.*",[18,88]],["adblocktape.*",[18,88]],["adclickersbot.com",18],["adcorto.*",18],["adricami.com",18],["adslink.pw",18],["adultstvlive.com",18],["adz7short.space",18],["aeblender.com",18],["affordwonder.net",18],["ahdafnews.blogspot.com",18],["aiblog.tv",[18,72]],["ak47sports.com",18],["akuma.moe",18],["alexsports.*",18],["alexsportss.*",18],["alexsportz.*",18],["allplayer.tk",18],["amateurblog.tv",[18,72]],["androidadult.com",[18,236]],["anhsexjav.xyz",18],["anidl.org",18],["anime-loads.org",18],["animeblkom.net",18],["animefire.plus",18],["animelek.me",18],["animepahe.*",18],["animesanka.*",18],["animesorionvip.net",18],["animespire.net",18],["animestotais.xyz",18],["animeyt.es",18],["animixplay.*",18],["aniplay.*",18],["anroll.net",18],["antiadtape.*",[18,88]],["anymoviess.xyz",18],["aotonline.org",18],["asenshu.com",18],["asialiveaction.com",18],["asianclipdedhd.net",18],["asianclub.*",18],["ask4movie.*",18],["askim-bg.com",18],["asumsikedaishop.com",18],["atomixhq.*",[18,69]],["atomohd.*",18],["avcrempie.com",18],["avseesee.com",18],["gettapeads.com",[18,88]],["bajarjuegospcgratis.com",18],["balkanteka.net",18],["beinmatch.*",[18,26]],["belowporn.com",18],["bestgirlsexy.com",18],["bestnhl.com",18],["bestporncomix.com",18],["bhaai.*",18],["bigwarp.*",18],["bikinbayi.com",18],["bikinitryon.net",18],["birdurls.com",18],["bitsearch.to",18],["blackcockadventure.com",18],["blackcockchurch.org",18],["blackporncrazy.com",18],["blizzboygames.net",18],["blizzpaste.com",18],["blkom.com",18],["blog-peliculas.com",18],["blogtrabalhista.com",18],["blurayufr.*",18],["bobsvagene.club",18],["bokep.im",18],["bokep.top",18],["boyfuck.me",18],["brilian-news.id",18],["brupload.net",18],["buffstreams.*",18],["buzter.xyz",18],["caitlin.top",18],["camchickscaps.com",18],["camgirls.casa",18],["canalesportivo.*",18],["cashurl.in",18],["catchthrust.net",18],["ccurl.net",[18,69]],["celebrity-leaks.net",18],["cgpelis.net",18],["charexempire.com",18],["clickndownload.*",18],["clicknupload.*",[18,71]],["clik.pw",18],["coin-free.com",[18,37]],["coins100s.fun",18],["comohoy.com",18],["compucalitv.com",18],["coolcast2.com",18],["coreradio.online",18],["cosplaytab.com",18],["countylocalnews.com",18],["cpmlink.net",18],["crackstreamshd.click",18],["crespomods.com",18],["crisanimex.com",18],["crunchyscan.fr",18],["cuevana3.fan",18],["cuevana3hd.com",18],["cumception.com",18],["cutpaid.com",18],["daddylive.*",[18,69,208]],["daddylivehd.*",[18,69]],["dailyuploads.net",18],["datawav.club",18],["daughtertraining.com",18],["ddrmovies.*",18],["deepgoretube.site",18],["deltabit.co",18],["deporte-libre.top",18],["depvailon.com",18],["derleta.com",18],["desiremovies.*",18],["desivdo.com",18],["desixx.net",18],["detikkebumen.com",18],["deutschepornos.me",18],["devlib.*",18],["diasoft.xyz",18],["directupload.net",18],["divxtotal.*",18],["divxtotal1.*",18],["dixva.com",18],["dlhd.*",18],["doctormalay.com",18],["dofusports.xyz",18],["doods.cam",18],["doodskin.lat",18],["downloadrips.com",18],["downvod.com",18],["dphunters.mom",18],["dragontranslation.com",18],["dvdfullestrenos.com",18],["dvdplay.*",[18,69]],["ebookbb.com",18],["ebookhunter.net",18],["egyanime.com",18],["egygost.com",18],["ekasiwap.com",18],["electro-torrent.pl",18],["elixx.*",18],["enjoy4k.*",18],["eplayer.click",18],["erovoice.us",18],["eroxxx.us",18],["estrenosdoramas.net",18],["estrenosflix.*",18],["estrenosflux.*",18],["estrenosgo.*",18],["everia.club",18],["everythinginherenet.blogspot.com",18],["extratorrent.st",18],["extremotvplay.com",18],["f1stream.*",18],["fapinporn.com",18],["fapptime.com",18],["fastreams.live",18],["faucethero.com",18],["favoyeurtube.net",18],["fbstream.*",18],["fc2db.com",18],["femdom-joi.com",18],["fenixsite.net",18],["file4go.*",18],["filegram.to",[18,67,72]],["fileone.tv",18],["film1k.com",18],["filmeonline2023.net",18],["filmesonlinex.org",18],["filmesonlinexhd.biz",[18,69]],["filmisub.cc",18],["filmovitica.com",18],["filmymaza.blogspot.com",18],["filmyzilla.*",[18,69]],["filthy.family",18],["findav.*",18],["findporn.*",18],["flickzap.com",18],["flixmaza.*",18],["flizmovies.*",18],["flostreams.xyz",18],["flyfaucet.com",18],["footyhunter.lol",18],["forex-trnd.com",18],["forumchat.club",18],["forumlovers.club",18],["freeomovie.co.in",18],["freeomovie.to",18],["freeporncomic.net",18],["freepornhdonlinegay.com",18],["freeproxy.io",18],["freeshot.live",18],["freetvsports.*",18],["freeuse.me",18],["freeusexporn.com",18],["fsharetv.cc",18],["fsicomics.com",18],["fullymaza.*",18],["g-porno.com",18],["g-streaming.com",18],["g3g.*",18],["galinhasamurai.com",18],["gamepcfull.com",18],["gameronix.com",18],["gamesmountain.com",18],["gamesrepacks.com",18],["gamingguru.fr",18],["gamovideo.com",18],["garota.cf",18],["gaydelicious.com",18],["gaypornhdfree.com",18],["gaypornhot.com",18],["gaypornmasters.com",18],["gaysex69.net",18],["gemstreams.com",18],["get-to.link",18],["girlscanner.org",18],["giurgiuveanul.ro",18],["gledajcrtace.xyz",18],["gocast2.com",18],["gomo.to",18],["gostosa.cf",18],["gotxx.*",18],["grantorrent.*",18],["gratispaste.com",18],["gravureblog.tv",[18,72]],["haho.moe",18],["hayhd.net",18],["hdmoviesfair.*",[18,69]],["hdmoviesflix.*",18],["hdpornflix.com",18],["hdsaprevodom.com",18],["hdstreamss.club",18],["hentaiporno.xxx",18],["hentais.tube",18],["hentaistream.co",18],["hentaitk.net",18],["hentaitube.online",18],["hentaiworld.tv",18],["hesgoal.tv",18],["hexupload.net",18],["hhkungfu.tv",18],["highlanderhelp.com",18],["hiidudemoviez.*",18],["hindimovies.to",[18,69]],["hindimoviestv.com",18],["hiperdex.com",18],["hispasexy.org",18],["hitprn.com",18],["hivflix.me",18],["hoca4u.com",18],["hollymoviehd.cc",18],["hoodsite.com",18],["hopepaste.download",18],["hornylips.com",18],["hotgranny.live",18],["hotmama.live",18],["hqcelebcorner.net",18],["huren.best",18],["hwnaturkya.com",[18,69]],["hxfile.co",[18,69]],["igfap.com",18],["iklandb.com",18],["illink.net",18],["imgsen.*",18],["imgsex.xyz",18],["imgsto.*",18],["imgtraffic.com",18],["imx.to",18],["incest.*",18],["incestflix.*",18],["influencersgonewild.org",18],["infosgj.free.fr",18],["investnewsbrazil.com",18],["itdmusics.com",18],["itopmusic.*",18],["itsuseful.site",18],["itunesfre.com",18],["iwatchfriendsonline.net",[18,142]],["japangaysex.com",18],["jav-fun.cc",18],["jav-noni.cc",18],["javboys.tv",18],["javcl.com",18],["jav-coco.com",18],["javhay.net",18],["javhoho.com",18],["javhun.com",18],["javleak.com",18],["javmost.*",18],["javporn.best",18],["javsek.net",18],["javsex.to",18],["javtiful.com",[18,20]],["jimdofree.com",18],["jiofiles.org",18],["jorpetz.com",18],["jp-films.com",18],["jpop80ss3.blogspot.com",18],["jpopsingles.eu",[18,186]],["justfullporn.net",18],["kantotflix.net",18],["kantotinyo.com",18],["kaoskrew.org",18],["kaplog.com",18],["keeplinks.*",18],["keepvid.*",18],["keralahd.*",18],["keralatvbox.com",18],["khatrimazaful.*",18],["khatrimazafull.*",[18,72]],["kickassanimes.io",18],["kimochi.info",18],["kimochi.tv",18],["kinemania.tv",18],["kissasian.*",18],["koltry.life",18],["konstantinova.net",18],["koora-online.live",18],["kunmanga.com",18],["kwithsub.com",18],["lat69.me",18],["latinblog.tv",[18,72]],["latinomegahd.net",18],["leechall.*",18],["leechpremium.link",18],["legendas.dev",18],["legendei.net",18],["lighterlegend.com",18],["linclik.com",18],["linkebr.com",18],["linkrex.net",18],["linkshorts.*",18],["lulu.st",18],["lulustream.com",[18,71]],["lulustream.live",18],["luluvdo.com",18],["luluvdoo.com",18],["mangagenki.me",18],["mangahere.onl",18],["mangaweb.xyz",18],["mangoporn.net",18],["mangovideo.*",18],["manhwahentai.me",18],["masahub.com",18],["masahub.net",18],["masaporn.*",18],["maturegrannyfuck.com",18],["mdy48tn97.com",18],["mediapemersatubangsa.com",18],["mega-mkv.com",18],["megapastes.com",18],["megapornpics.com",18],["messitv.net",18],["meusanimes.net",18],["mexa.sh",18],["milfmoza.com",18],["milfnut.*",18],["milfzr.com",18],["millionscast.com",18],["mimaletamusical.blogspot.com",18],["miniurl.*",18],["mirrorace.*",18],["mitly.us",18],["mixdroop.*",18],["mixixxx000000.cyou",18],["mixixxx696969.cyou",18],["mkv-pastes.com",18],["mkvcage.*",18],["mlbstream.*",18],["mlsbd.*",18],["mmsbee.*",18],["monaskuliner.ac.id",18],["moredesi.com",18],["motogpstream.*",18],["movgotv.net",18],["movi.pk",18],["movieplex.*",18],["movierulzlink.*",18],["movies123.*",18],["moviesflix.*",18],["moviesmeta.*",18],["moviesmod.com.pl",18],["moviessources.*",18],["moviesverse.*",18],["movieswbb.com",18],["moviewatch.com.pk",18],["moviezwaphd.*",18],["mp4upload.com",18],["mrskin.live",18],["mrunblock.*",18],["multicanaistv.com",18],["mundowuxia.com",18],["myeasymusic.ir",18],["myonvideo.com",18],["myyouporn.com",18],["mzansifun.com",18],["narutoget.info",18],["naughtypiss.com",18],["nbastream.*",18],["nekopoi.*",[18,72]],["nerdiess.com",18],["netfuck.net",18],["new-fs.eu",18],["newmovierulz.*",18],["newtorrentgame.com",18],["neymartv.net",18],["nflstream.*",18],["nflstreams.me",18],["nhlstream.*",18],["nicekkk.com",18],["nicesss.com",18],["nlegs.com",18],["noblocktape.*",[18,88]],["nocensor.*",18],["noni-jav.com",18],["notformembersonly.com",18],["novamovie.net",18],["novelpdf.xyz",18],["novelssites.com",[18,69]],["novelup.top",18],["nsfwr34.com",18],["nu6i-bg-net.com",18],["nudebabesin3d.com",18],["nzbstars.com",18],["o2tvseries.com",18],["ohjav.com",18],["ojearnovelas.com",18],["okanime.xyz",18],["olweb.tv",18],["on9.stream",18],["onepiece-mangaonline.com",18],["onifile.com",18],["onionstream.live",18],["onlinesaprevodom.net",18],["onlyfams.*",18],["onlyfullporn.video",18],["onplustv.live",18],["originporn.com",18],["ouo.*",18],["ovagames.com",18],["palimas.org",18],["password69.com",18],["pastemytxt.com",18],["payskip.org",18],["pctfenix.*",[18,69]],["pctnew.*",[18,69]],["peeplink.in",18],["peliculas24.*",18],["peliculasmx.net",18],["pelisflix20.*",18],["pelisplus.*",18],["pencarian.link",18],["pendidikandasar.net",18],["pervertgirlsvideos.com",18],["pervyvideos.com",18],["phim12h.com",18],["picdollar.com",18],["picsxxxporn.com",18],["pinayscandalz.com",18],["pinkueiga.net",18],["piratebay.*",18],["piratefast.xyz",18],["piratehaven.xyz",18],["pirateiro.com",18],["playtube.co.za",18],["plugintorrent.com",18],["plyjam.*",18],["plylive.*",18],["plyvdo.*",18],["pmvzone.com",18],["porndish.com",18],["pornez.net",18],["pornfetishbdsm.com",18],["pornfits.com",18],["pornhd720p.com",18],["pornhoarder.*",[18,229]],["pornobr.club",18],["pornobr.ninja",18],["pornodominicano.net",18],["pornofaps.com",18],["pornoflux.com",18],["pornotorrent.com.br",18],["pornredit.com",18],["pornstarsyfamosas.es",18],["pornstreams.co",18],["porntn.com",18],["pornxbit.com",18],["pornxday.com",18],["portaldasnovinhas.shop",18],["portugues-fcr.blogspot.com",18],["poseyoung.com",18],["pover.org",18],["prbay.*",18],["projectfreetv.*",18],["proxybit.*",18],["proxyninja.org",18],["psarips.*",18],["pubfilmz.com",18],["publicsexamateurs.com",18],["punanihub.com",18],["pxxbay.com",18],["r18.best",18],["racaty.*",18],["ragnaru.net",18],["rapbeh.net",18],["rapelust.com",18],["rapload.org",18],["read-onepiece.net",18],["readhunters.xyz",18],["remaxhd.*",18],["reshare.pm",18],["retro-fucking.com",18],["retrotv.org",18],["rintor.*",18],["rnbxclusive.*",18],["rnbxclusive0.*",18],["rnbxclusive1.*",18],["robaldowns.com",18],["rockdilla.com",18],["rojadirecta.*",18],["rojadirectaenvivo.*",18],["rojitadirecta.blogspot.com",18],["romancetv.site",18],["rsoccerlink.site",18],["rugbystreams.*",18],["rule34.club",18],["rule34hentai.net",18],["rumahbokep-id.com",18],["sadisflix.*",18],["safego.cc",18],["safetxt.*",18],["sakurafile.com",18],["samax63.lol",18],["satoshi-win.xyz",18],["savefiles.com",[18,67]],["scat.gold",18],["scatfap.com",18],["scatkings.com",18],["scnlog.me",18],["scripts-webmasters.net",18],["serie-turche.com",18],["serijefilmovi.com",18],["sexcomics.me",18],["sexdicted.com",18],["sexgay18.com",18],["sexiezpix.com",18],["sexofilm.co",18],["sextgem.com",18],["sextubebbw.com",18],["sgpics.net",18],["shadowrangers.*",18],["shadowrangers.live",18],["shahee4u.cam",18],["shahi4u.*",18],["shahid4u1.*",18],["shahid4uu.*",18],["shahiid-anime.net",18],["shavetape.*",18],["shemale6.com",18],["shid4u.*",18],["shinden.pl",18],["short.es",18],["shortearn.*",18],["shorten.*",18],["shorttey.*",18],["shortzzy.*",18],["showmanga.blog.fc2.com",18],["shrt10.com",18],["sideplusleaks.net",18],["silverblog.tv",[18,72]],["silverpic.com",18],["sinhalasub.life",18],["sinsitio.site",18],["sinvida.me",18],["skidrowcpy.com",18],["skymovieshd.*",18],["slut.mom",18],["smallencode.me",18],["smoner.com",18],["smplace.com",18],["soccerinhd.com",[18,69]],["socceron.name",18],["socceronline.*",[18,69]],["socialblog.tv",[18,72]],["softairbay.com",18],["softarchive.*",18],["sokobj.com",18],["songsio.com",18],["souexatasmais.com",18],["sportbar.live",18],["sports-stream.*",18],["sportstream1.cfd",18],["sporttuna.*",18],["srt.am",18],["srts.me",18],["sshhaa.*",18],["stapadblockuser.*",[18,88]],["stape.*",[18,88]],["stapewithadblock.*",18],["starblog.tv",[18,72]],["starmusiq.*",18],["stbemuiptv.com",18],["stockingfetishvideo.com",18],["strcloud.*",[18,88]],["stream.crichd.vip",18],["stream.lc",18],["stream25.xyz",18],["streamadblocker.*",[18,69,88]],["streamadblockplus.*",[18,88]],["streambee.to",18],["streambucket.net",18],["streamcdn.*",18],["streamcenter.pro",18],["streamers.watch",18],["streamgo.to",18],["streamhub.*",18],["streamingclic.com",18],["streamkiste.tv",18],["streamoupload.xyz",18],["streamservicehd.click",18],["streamsport.*",18],["streamta.*",[18,88]],["streamtape.*",[18,72,88]],["streamtapeadblockuser.*",[18,88]],["streamvid.net",[18,27]],["strikeout.*",[18,71]],["strtape.*",[18,88]],["strtapeadblock.*",[18,88]],["strtapeadblocker.*",[18,88]],["strtapewithadblock.*",18],["strtpe.*",[18,88]],["subtitleporn.com",18],["subtitles.cam",18],["suicidepics.com",18],["supertelevisionhd.com",18],["supexfeeds.com",18],["swatchseries.*",18],["swiftload.io",18],["swipebreed.net",18],["swzz.xyz",18],["sxnaar.com",18],["tabooflix.*",18],["taboosex.club",18],["tapeantiads.com",[18,88]],["tapeblocker.com",[18,88]],["tapenoads.com",[18,88]],["tapewithadblock.org",[18,88,269]],["teamos.xyz",18],["teen-wave.com",18],["teenporncrazy.com",18],["telegramgroups.xyz",18],["telenovelasweb.com",18],["tennisstreams.*",18],["tensei-shitara-slime-datta-ken.com",18],["tfp.is",18],["tgo-tv.co",[18,69]],["thaihotmodels.com",18],["theblueclit.com",18],["thebussybandit.com",18],["thedaddy.*",[18,208]],["thelastdisaster.vip",18],["themoviesflix.*",18],["thepiratebay.*",18],["thepiratebay0.org",18],["thepiratebay10.info",18],["thesexcloud.com",18],["thothub.today",18],["tightsexteens.com",18],["tlnovelas.net",18],["tmearn.*",18],["tojav.net",18],["tokusatsuindo.com",18],["toonanime.*",18],["top16.net",18],["topdrama.net",18],["topvideosgay.com",18],["torlock.*",18],["tormalayalam.*",18],["torrage.info",18],["torrents.vip",18],["torrentz2eu.*",18],["torrsexvid.com",18],["tpb-proxy.xyz",18],["trannyteca.com",18],["trendytalker.com",18],["tuktukcinma.com",18],["tumanga.net",18],["turbogvideos.com",18],["turboimagehost.com",18],["turbovid.me",18],["turkishseriestv.org",18],["turksub24.net",18],["tutele.sx",18],["tutelehd.*",18],["tvglobe.me",18],["tvpclive.com",18],["tvply.*",18],["tvs-widget.com",18],["tvseries.video",18],["u4m.*",18],["ucptt.com",18],["ufaucet.online",18],["ufcfight.online",18],["ufcstream.*",18],["ultrahorny.com",18],["ultraten.net",18],["unblocknow.*",18],["unblockweb.me",18],["underhentai.net",18],["uniqueten.net",18],["uns.bio",18],["upbaam.com",18],["uploadbuzz.*",18],["upstream.to",18],["usagoals.*",18],["valhallas.click",[18,141]],["valeriabelen.com",18],["verdragonball.online",18],["vexmoviex.*",18],["vfxmed.com",18],["vidclouds.*",18],["video.az",18],["videostreaming.rocks",18],["videowood.tv",18],["vidlox.*",18],["vidorg.net",18],["vidtapes.com",18],["vidz7.com",18],["vikistream.com",18],["vinovo.to",18],["vipboxtv.*",[18,69]],["vipleague.*",[18,232]],["virpe.cc",18],["visifilmai.org",18],["viveseries.com",18],["vladrustov.sx",18],["volokit2.com",[18,208]],["vstorrent.org",18],["w-hentai.com",18],["watch-series.*",18],["watchbrooklynnine-nine.com",18],["watchelementaryonline.com",18],["watchjavidol.com",18],["watchkobestreams.info",18],["watchlostonline.net",18],["watchmodernfamilyonline.com",18],["watchmonkonline.com",18],["watchrulesofengagementonline.com",18],["watchseries.*",18],["webcamrips.com",18],["wincest.xyz",18],["wolverdon.fun",18],["wordcounter.icu",18],["worldmovies.store",18],["worldstreams.click",18],["wpdeployit.com",18],["wqstreams.tk",18],["wwwsct.com",18],["xanimeporn.com",18],["xblog.tv",[18,72]],["xclusivejams.*",18],["xmoviesforyou.*",18],["xn--verseriesespaollatino-obc.online",18],["xpornium.net",18],["xsober.com",18],["xvip.lat",18],["xxgasm.com",18],["xxvideoss.org",18],["xxx18.uno",18],["xxxdominicana.com",18],["xxxfree.watch",18],["xxxmax.net",18],["xxxwebdlxxx.top",18],["xxxxvideo.uno",18],["yabai.si",18],["yeshd.net",18],["youdbox.*",18],["youjax.com",18],["yourdailypornvideos.ws",18],["yourupload.com",18],["youswear.com",18],["ytmp3eu.*",18],["yts-subs.*",18],["yts.*",18],["ytstv.me",18],["yumeost.net",18],["zerion.cc",18],["zerocoin.top",18],["zitss.xyz",18],["zooqle.*",18],["zpaste.net",18],["fastreams.com",18],["sky-sports.store",18],["streamsoccer.site",18],["tntsports.store",18],["wowstreams.co",18],["dutchycorp.*",19],["faucet.ovh",19],["mmacore.tv",20],["nxbrew.net",20],["brawlify.com",20],["oko.sh",21],["variety.com",[22,79]],["gameskinny.com",22],["deadline.com",[22,79]],["mlive.com",[22,79]],["washingtonpost.com",23],["gosexpod.com",24],["sexo5k.com",25],["truyen-hentai.com",25],["theshedend.com",27],["zeroupload.com",27],["securenetsystems.net",27],["miniwebtool.com",27],["bchtechnologies.com",27],["eracast.cc",27],["flatai.org",27],["leeapk.com",27],["spiegel.de",28],["jacquieetmichel.net",29],["hausbau-forum.de",30],["althub.club",30],["kiemlua.com",30],["doujindesu.*",31],["atlasstudiousa.com",31],["51bonusrummy.in",[31,72]],["tea-coffee.net",32],["spatsify.com",32],["newedutopics.com",32],["getviralreach.in",32],["edukaroo.com",32],["funkeypagali.com",32],["careersides.com",32],["nayisahara.com",32],["wikifilmia.com",32],["infinityskull.com",32],["viewmyknowledge.com",32],["iisfvirtual.in",32],["starxinvestor.com",32],["jkssbalerts.com",32],["imagereviser.com",33],["labgame.io",[34,35]],["kenzo-flowertag.com",36],["mdn.lol",36],["btcbitco.in",37],["btcsatoshi.net",37],["cempakajaya.com",37],["crypto4yu.com",37],["manofadan.com",37],["readbitcoin.org",37],["wiour.com",37],["tremamnon.com",37],["bitsmagic.fun",37],["ourcoincash.xyz",37],["aylink.co",38],["sugarona.com",39],["nishankhatri.xyz",39],["cety.app",40],["exe-urls.com",40],["exego.app",40],["cutlink.net",40],["cutyurls.com",40],["cutty.app",40],["cutnet.net",40],["jixo.online",40],["tinys.click",41],["loan.creditsgoal.com",41],["rupyaworld.com",41],["vahantoday.com",41],["techawaaz.in",41],["loan.bgmi32bitapk.in",41],["formyanime.com",41],["gsm-solution.com",41],["h-donghua.com",41],["hindisubbedacademy.com",41],["hm4tech.info",41],["mydverse.*",41],["panelprograms.blogspot.com",41],["ripexbooster.xyz",41],["serial4.com",41],["tutorgaming.com",41],["everydaytechvams.com",41],["dipsnp.com",41],["cccam4sat.com",41],["diendancauduong.com",41],["zeemoontv-24.blogspot.com",41],["stitichsports.com",41],["aiimgvlog.fun",42],["appsbull.com",43],["diudemy.com",43],["maqal360.com",43],["androjungle.com",43],["bookszone.in",43],["shortix.co",43],["makefreecallsonline.com",43],["msonglyrics.com",43],["app-sorteos.com",43],["bokugents.com",43],["client.pylexnodes.net",43],["btvplus.bg",43],["listar-mc.net",43],["blog24.me",[44,45]],["coingraph.us",46],["impact24.us",46],["iconicblogger.com",47],["auto-crypto.click",47],["tpi.li",48],["oii.la",[48,71]],["shrinke.*",49],["shrinkme.*",49],["smutty.com",49],["e-sushi.fr",49],["gayforfans.com",49],["freeadultcomix.com",49],["down.dataaps.com",49],["filmweb.pl",[49,181]],["livecamrips.*",49],["safetxt.net",49],["filespayouts.com",49],["atglinks.com",50],["kbconlinegame.com",51],["hamrojaagir.com",51],["odijob.com",51],["stfly.biz",52],["airevue.net",52],["atravan.net",52],["simana.online",53],["fooak.com",53],["joktop.com",53],["evernia.site",53],["falpus.com",53],["rfiql.com",54],["gujjukhabar.in",54],["smartfeecalculator.com",54],["djxmaza.in",54],["thecubexguide.com",54],["jytechs.in",54],["financacerta.com",55],["encurtads.net",55],["mastkhabre.com",56],["weshare.is",57],["rokni.xyz",58],["keedabankingnews.com",58],["pig69.com",58],["cosplay18.pics",[58,257]],["3dsfree.org",59],["up4load.com",60],["alpin.de",61],["boersennews.de",61],["chefkoch.de",61],["chip.de",61],["clever-tanken.de",61],["desired.de",61],["donnerwetter.de",61],["fanfiktion.de",61],["focus.de",61],["formel1.de",61],["frustfrei-lernen.de",61],["gewinnspiele.tv",61],["giga.de",61],["gut-erklaert.de",61],["kino.de",61],["messen.de",61],["nickles.de",61],["nordbayern.de",61],["spielfilm.de",61],["teltarif.de",[61,62]],["unsere-helden.com",61],["weltfussball.at",61],["watson.de",61],["mactechnews.de",61],["sport1.de",61],["welt.de",61],["sport.de",61],["allthingsvegas.com",63],["100percentfedup.com",63],["beforeitsnews.com",63],["concomber.com",63],["conservativefiringline.com",63],["dailylol.com",63],["funnyand.com",63],["letocard.fr",63],["mamieastuce.com",63],["meilleurpronostic.fr",63],["patriotnationpress.com",63],["toptenz.net",63],["vitamiiin.com",63],["writerscafe.org",63],["populist.press",63],["dailytruthreport.com",63],["livinggospeldaily.com",63],["first-names-meanings.com",63],["welovetrump.com",63],["thehayride.com",63],["thelibertydaily.com",63],["thepoke.co.uk",63],["thepolitistick.com",63],["theblacksphere.net",63],["shark-tank.com",63],["naturalblaze.com",63],["greatamericanrepublic.com",63],["dailysurge.com",63],["truthlion.com",63],["flagandcross.com",63],["westword.com",63],["republicbrief.com",63],["freedomfirstnetwork.com",63],["phoenixnewtimes.com",63],["designbump.com",63],["clashdaily.com",63],["madworldnews.com",63],["reviveusa.com",63],["sonsoflibertymedia.com",63],["thedesigninspiration.com",63],["videogamesblogger.com",63],["protrumpnews.com",63],["thepalmierireport.com",63],["kresy.pl",63],["thepatriotjournal.com",63],["thegatewaypundit.com",63],["wltreport.com",63],["miaminewtimes.com",63],["politicalsignal.com",63],["rightwingnews.com",63],["bigleaguepolitics.com",63],["comicallyincorrect.com",63],["upornia.com",64],["pillowcase.su",65],["akaihentai.com",66],["cine-calidad.*",66],["fastpic.org",[66,72]],["veryfreeporn.com",66],["pornoenspanish.es",66],["theporngod.com",66],["besthdgayporn.com",67],["drivenime.com",67],["erothots1.com",67],["javup.org",67],["shemaleup.net",67],["transflix.net",67],["worthcrete.com",67],["hentaihere.com",68],["player.smashy.stream",68],["player.smashystream.com",68],["123movies.*",69],["123moviesla.*",69],["123movieweb.*",69],["2embed.*",69],["9xmovies.*",69],["adsh.cc",69],["adshort.*",69],["afilmyhouse.blogspot.com",69],["ak.sv",69],["allmovieshub.*",69],["api.webs.moe",69],["apkmody.io",69],["asianplay.*",69],["atishmkv.*",69],["backfirstwo.site",69],["bflix.*",69],["crazyblog.in",69],["cricstream.*",69],["crictime.*",69],["cuervotv.me",69],["divicast.com",69],["dood.*",[69,187]],["dooood.*",[69,187]],["embed.meomeo.pw",69],["extramovies.*",69],["faselhd.*",69],["faselhds.*",69],["filemoon.*",69],["filmeserialeonline.org",69],["filmy.*",69],["filmyhit.*",69],["filmywap.*",69],["flexyhit.com",69],["fmovies.*",69],["foreverwallpapers.com",69],["french-streams.cc",69],["gdplayer.*",69],["goku.*",69],["gomovies.*",69],["gowatchseries.*",69],["hdfungamezz.*",69],["hdtoday.to",69],["hinatasoul.com",69],["hindilinks4u.*",69],["hurawatch.*",[69,215]],["igg-games.com",69],["infinityscans.net",69],["jalshamoviezhd.*",69],["livecricket.*",69],["mangareader.to",69],["mhdsport.*",69],["mkvcinemas.*",69],["movies2watch.*",69],["moviespapa.*",69],["mp3juice.info",69],["mp4moviez.*",69],["mydownloadtube.*",69],["myflixerz.to",69],["nowmetv.net",69],["nowsportstv.com",69],["nuroflix.*",69],["nxbrew.com",69],["o2tvseries.*",69],["o2tvseriesz.*",69],["oii.io",69],["paidshitforfree.com",69],["pepperlive.info",69],["pirlotv.*",69],["playertv.net",69],["poscitech.*",69],["primewire.*",69],["redecanais.*",69],["roystream.com",69],["rssing.com",69],["s.to",69],["serienstream.*",69],["sflix.*",69],["shahed4u.*",69],["shaheed4u.*",69],["share.filesh.site",69],["sharkfish.xyz",69],["skidrowcodex.net",69],["smartermuver.com",69],["speedostream.*",69],["sportcast.*",69],["sportskart.*",69],["stream4free.live",69],["streamingcommunity.*",[69,71,108]],["tamilarasan.*",69],["tamilfreemp3songs.*",69],["tamilmobilemovies.in",69],["tamilprinthd.*",69],["tapeadsenjoyer.com",[69,88]],["thewatchseries.live",69],["tnmusic.in",69],["torrentdosfilmes.*",69],["travelplanspro.com",69],["tubemate.*",69],["tusfiles.com",69],["tutlehd4.com",69],["twstalker.com",69],["uploadrar.*",69],["uqload.*",69],["vid-guard.com",69],["vidcloud9.*",69],["vido.*",69],["vidoo.*",69],["vidsaver.net",69],["vidspeeds.com",69],["viralitytoday.com",69],["voiranime.stream",69],["vudeo.*",69],["vumoo.*",69],["watchdoctorwhoonline.com",69],["watchomovies.*",[69,105]],["watchserie.online",69],["woxikon.in",69],["www-y2mate.com",69],["yesmovies.*",69],["ylink.bid",69],["xn-----0b4asja7ccgu2b4b0gd0edbjm2jpa1b1e9zva7a0347s4da2797e8qri.xn--1ck2e1b",69],["kickassanime.*",70],["11xmovies.*",71],["cinego.tv",71],["dokoembed.pw",71],["ev01.to",71],["fojik.*",71],["fstream365.com",71],["fzmovies.*",71],["linkz.*",71],["minoplres.xyz",71],["mostream.us",71],["moviedokan.*",71],["myflixer.*",71],["prmovies.*",71],["readcomiconline.li",71],["s3embtaku.pro",71],["sflix2.to",71],["sportshub.stream",71],["streamblasters.*",71],["topcinema.cam",71],["webxzplay.cfd",71],["zonatmo.com",71],["animesaturn.cx",71],["filecrypt.*",71],["hunterscomics.com",71],["aniwave.uk",71],["dojing.net",72],["javsubindo.com",72],["krx18.com",72],["loadx.ws",72],["mangaforfree.com",72],["pornx.to",72],["savefiles.*",[72,248]],["streampoi.com",72],["strmup.to",[72,141]],["up4stream.com",[72,105]],["ups2up.fun",[72,105]],["videq.stream",72],["xmegadrive.com",72],["rahim-soft.com",72],["x-video.tube",72],["rubystm.com",72],["rubyvid.com",72],["rubyvidhub.com",72],["stmruby.com",72],["streamruby.com",72],["poophd.cc",72],["windowsreport.com",72],["fuckflix.click",72],["celebzcircle.com",73],["bi-girl.net",73],["ftuapps.*",73],["hentaiseason.com",73],["hoodtrendspredict.com",73],["marcialhub.xyz",73],["odiadance.com",73],["osteusfilmestuga.online",73],["ragnarokscanlation.opchapters.com",73],["sampledrive.org",73],["showflix.*",73],["swordalada.org",73],["tvappapk.com",73],["twobluescans.com",[73,74]],["varnascan.xyz",73],["bibliopanda.visblog.online",75],["hallofseries.com",75],["luciferdonghua.in",75],["truyentranhfull.net",75],["fcportables.com",75],["repack-games.com",75],["ibooks.to",75],["blog.tangwudi.com",75],["filecatchers.com",75],["babaktv.com",75],["samchui.com",76],["sandrarose.com",76],["sherdog.com",76],["sidereel.com",76],["silive.com",76],["simpleflying.com",76],["sloughexpress.co.uk",76],["spacenews.com",76],["sportsgamblingpodcast.com",76],["spotofteadesigns.com",76],["stacysrandomthoughts.com",76],["ssnewstelegram.com",76],["superherohype.com",[76,79]],["tablelifeblog.com",76],["thebeautysection.com",76],["thecelticblog.com",76],["thecurvyfashionista.com",76],["thefashionspot.com",76],["thegamescabin.com",76],["thenerdyme.com",76],["thenonconsumeradvocate.com",76],["theprudentgarden.com",76],["thethings.com",76],["timesnews.net",76],["topspeed.com",76],["toyotaklub.org.pl",76],["travelingformiles.com",76],["tutsnode.org",76],["viralviralvideos.com",76],["wannacomewith.com",76],["wimp.com",[76,79]],["windsorexpress.co.uk",76],["woojr.com",76],["worldoftravelswithkids.com",76],["worldsurfleague.com",76],["cheatsheet.com",77],["pwinsider.com",77],["c-span.org",78],["15min.lt",79],["247sports.com",79],["abc17news.com",79],["agrodigital.com",79],["al.com",79],["aliontherunblog.com",79],["allaboutthetea.com",79],["allmovie.com",79],["allmusic.com",79],["allthingsthrifty.com",79],["amessagewithabottle.com",79],["artforum.com",79],["artnews.com",79],["awkward.com",79],["barcablaugranes.com",79],["barnsleychronicle.com",79],["bethcakes.com",79],["betweenenglandandiowa.com",79],["bgr.com",79],["blazersedge.com",79],["blogher.com",79],["blu-ray.com",79],["bluegraygal.com",79],["briefeguru.de",79],["brobible.com",79],["cagesideseats.com",79],["cbsnews.com",79],["cbssports.com",[79,253]],["celiacandthebeast.com",79],["chaptercheats.com",79],["cleveland.com",79],["clickondetroit.com",79],["commercialcompetentedigitale.ro",79],["dailydot.com",79],["dailykos.com",79],["dailyvoice.com",79],["danslescoulisses.com",79],["decider.com",79],["didyouknowfacts.com",79],["dogtime.com",79],["ebaumsworld.com",79],["eldiariony.com",79],["fark.com",79],["femestella.com",79],["fmradiofree.com",79],["free-power-point-templates.com",79],["freeconvert.com",79],["frogsandsnailsandpuppydogtail.com",79],["funtasticlife.com",79],["fwmadebycarli.com",79],["golfdigest.com",79],["gulflive.com",79],["hollywoodreporter.com",79],["homeglowdesign.com",79],["honeygirlsworld.com",79],["ibtimes.co.in",79],["imgur.com",79],["indiewire.com",79],["intouchweekly.com",79],["jasminemaria.com",79],["kens5.com",79],["kion546.com",79],["knowyourmeme.com",79],["last.fm",79],["lehighvalleylive.com",79],["lettyskitchen.com",79],["lifeandstylemag.com",79],["lifeinleggings.com",79],["lizzieinlace.com",79],["localnews8.com",79],["lonestarlive.com",79],["madeeveryday.com",79],["maidenhead-advertiser.co.uk",79],["mandatory.com",79],["mardomreport.net",79],["masslive.com",79],["melangery.com",79],["mmamania.com",79],["momtastic.com",79],["mostlymorgan.com",79],["motherwellmag.com",79],["musicfeeds.com.au",79],["naszemiasto.pl",79],["nationalpost.com",79],["nationalreview.com",79],["nbcsports.com",79],["news.com.au",79],["ninersnation.com",79],["nj.com",79],["nordot.app",79],["nothingbutnewcastle.com",79],["nsjonline.com",79],["nypost.com",79],["observer.com",79],["oregonlive.com",79],["pagesix.com",79],["patheos.com",79],["pennlive.com",79],["playstationlifestyle.net",79],["puckermom.com",79],["reelmama.com",79],["robbreport.com",79],["rollingstone.com",79],["royalmailchat.co.uk",79],["sbnation.com",79],["sheknows.com",79],["sneakernews.com",79],["sourcingjournal.com",79],["sport-fm.gr",79],["stylecaster.com",79],["syracuse.com",79],["tastingtable.com",79],["thecw.com",79],["thedailymeal.com",79],["theflowspace.com",79],["themarysue.com",79],["tokfm.pl",79],["torontosun.com",79],["tvline.com",79],["usmagazine.com",79],["wallup.net",79],["weather.com",79],["worldstar.com",79],["worldstarhiphop.com",79],["wwd.com",79],["yourcountdown.to",79],["automobile-catalog.com",[80,81,82]],["baseballchannel.jp",[80,81]],["forum.mobilism.me",80],["gentosha-go.com",80],["hang.hu",80],["hoyme.jp",80],["motorbikecatalog.com",[80,81,82]],["pons.com",80],["wisevoter.com",80],["topstarnews.net",80],["islamicfinder.org",80],["secure-signup.net",80],["dramabeans.com",80],["dropgame.jp",[80,81]],["manta.com",80],["tportal.hr",80],["tvtropes.org",80],["convertcase.net",80],["uranai.nosv.org",81],["yakkun.com",81],["24sata.hr",81],["373news.com",81],["alc.co.jp",81],["allthetests.com",81],["animanch.com",81],["aniroleplay.com",81],["apkmirror.com",[81,185]],["areaconnect.com",81],["as-web.jp",81],["aucfree.com",81],["autoby.jp",81],["autoc-one.jp",81],["autofrage.net",81],["bab.la",81],["babla.*",81],["bien.hu",81],["carscoops.com",81],["cesoirtv.com",81],["chanto.jp.net",81],["cinetrafic.fr",81],["cocokara-next.com",81],["collinsdictionary.com",81],["computerfrage.net",81],["crosswordsolver.com",81],["cruciverba.it",81],["cults3d.com",81],["daily.co.jp",81],["dailynewshungary.com",81],["dayspedia.com",81],["dictionary.cambridge.org",81],["dictionnaire.lerobert.com",81],["dnevno.hr",81],["dreamchance.net",81],["drweil.com",81],["dziennik.pl",81],["eigachannel.jp",81],["ev-times.com",81],["finanzfrage.net",81],["footballchannel.jp",81],["forsal.pl",81],["freemcserver.net",81],["fxstreet-id.com",81],["fxstreet-vn.com",81],["fxstreet.*",81],["game8.jp",81],["gardeningsoul.com",81],["gazetaprawna.pl",81],["gesundheitsfrage.net",81],["gifu-np.co.jp",81],["gigafile.nu",81],["globalrph.com",81],["golf-live.at",81],["grapee.jp",81],["gutefrage.net",81],["hb-nippon.com",81],["heureka.cz",81],["horairesdouverture24.fr",81],["hotcopper.co.nz",81],["hotcopper.com.au",81],["idokep.hu",81],["indiatimes.com",81],["infor.pl",81],["iza.ne.jp",81],["j-cast.com",81],["j-town.net",81],["j7p.jp",81],["jablickar.cz",81],["javatpoint.com",81],["jikayosha.jp",81],["judgehype.com",81],["kinmaweb.jp",81],["km77.com",81],["kobe-journal.com",81],["kreuzwortraetsel.de",81],["kurashinista.jp",81],["kurashiru.com",81],["kyoteibiyori.com",81],["lacuarta.com",81],["lakeshowlife.com",81],["laleggepertutti.it",81],["langenscheidt.com",81],["laposte.net",81],["lawyersgunsmoneyblog.com",81],["ldoceonline.com",81],["listentotaxman.com",81],["livenewschat.eu",81],["luremaga.jp",81],["mahjongchest.com",81],["mainichi.jp",81],["maketecheasier.com",[81,82]],["malaymail.com",81],["mamastar.jp",81],["mathplayzone.com",81],["meteo60.fr",81],["midhudsonnews.com",81],["minesweeperquest.com",81],["minkou.jp",81],["modhub.us",81],["moin.de",81],["motorradfrage.net",81],["motscroises.fr",81],["muragon.com",81],["nana-press.com",81],["natalie.mu",81],["nationaltoday.com",81],["nbadraft.net",81],["news.zerkalo.io",81],["newsinlevels.com",81],["newsweekjapan.jp",81],["niketalk.com",81],["nikkan-gendai.com",81],["nouvelobs.com",81],["nyitvatartas24.hu",81],["oeffnungszeitenbuch.de",81],["onlineradiobox.com",81],["operawire.com",81],["optionsprofitcalculator.com",81],["oraridiapertura24.it",81],["oxfordlearnersdictionaries.com",81],["palabr.as",81],["pashplus.jp",81],["persoenlich.com",81],["petitfute.com",81],["play-games.com",81],["powerpyx.com",81],["pptvhd36.com",81],["profitline.hu",81],["puzzlegarage.com",81],["quefaire.be",81],["radio-australia.org",81],["radio-osterreich.at",81],["raetsel-hilfe.de",81],["ranking.net",81],["references.be",81],["reisefrage.net",81],["relevantmagazine.com",81],["reptilesmagazine.com",81],["roleplayer.me",81],["rostercon.com",81],["samsungmagazine.eu",81],["sankei.com",81],["sanspo.com",81],["scribens.com",81],["scribens.fr",81],["slashdot.org",81],["soccerdigestweb.com",81],["solitairehut.com",81],["sourceforge.net",[81,85]],["southhemitv.com",81],["sportalkorea.com",81],["sportlerfrage.net",81],["syosetu.com",81],["szamoldki.hu",81],["talkwithstranger.com",81],["the-crossword-solver.com",81],["thedigestweb.com",81],["traicy.com",81],["transparentcalifornia.com",81],["transparentnevada.com",81],["trilltrill.jp",81],["tunebat.com",81],["tvtv.ca",81],["tvtv.us",81],["tweaktown.com",81],["twn.hu",81],["tyda.se",81],["ufret.jp",81],["uptodown.com",81],["verkaufsoffener-sonntag.com",81],["vimm.net",81],["wamgame.jp",81],["watchdocumentaries.com",81],["webdesignledger.com",81],["wetteronline.de",81],["wfmz.com",81],["winfuture.de",81],["word-grabber.com",81],["worldjournal.com",81],["wort-suchen.de",81],["woxikon.*",81],["young-machine.com",81],["yugioh-starlight.com",81],["yutura.net",81],["zagreb.info",81],["zakzak.co.jp",81],["2chblog.jp",81],["2monkeys.jp",81],["46matome.net",81],["akb48glabo.com",81],["akb48matomemory.com",81],["alfalfalfa.com",81],["all-nationz.com",81],["anihatsu.com",81],["aqua2ch.net",81],["blog.esuteru.com",81],["blog.livedoor.jp",81],["blog.jp",81],["blogo.jp",81],["chaos2ch.com",81],["choco0202.work",81],["crx7601.com",81],["danseisama.com",81],["dareda.net",81],["digital-thread.com",81],["doorblog.jp",81],["exawarosu.net",81],["fgochaldeas.com",81],["football-2ch.com",81],["gekiyaku.com",81],["golog.jp",81],["hacchaka.net",81],["heartlife-matome.com",81],["liblo.jp",81],["fesoku.net",81],["fiveslot777.com",81],["gamejksokuhou.com",81],["girlsreport.net",81],["girlsvip-matome.com",81],["grasoku.com",81],["gundamlog.com",81],["honyaku-channel.net",81],["ikarishintou.com",81],["imas-cg.net",81],["imihu.net",81],["inutomo11.com",81],["itainews.com",81],["itaishinja.com",81],["jin115.com",81],["jisaka.com",81],["jnews1.com",81],["jumpsokuhou.com",81],["jyoseisama.com",81],["keyakizaka46matomemory.net",81],["kidan-m.com",81],["kijoden.com",81],["kijolariat.net",81],["kijolifehack.com",81],["kijomatomelog.com",81],["kijyokatu.com",81],["kijyomatome.com",81],["kijyomatome-ch.com",81],["kijyomita.com",81],["kirarafan.com",81],["kitimama-matome.net",81],["kitizawa.com",81],["konoyubitomare.jp",81],["kotaro269.com",81],["kyousoku.net",81],["ldblog.jp",81],["livedoor.biz",81],["livedoor.blog",81],["majikichi.com",81],["matacoco.com",81],["matomeblade.com",81],["matomelotte.com",81],["matometemitatta.com",81],["mojomojo-licarca.com",81],["morikinoko.com",81],["nandemo-uketori.com",81],["netatama.net",81],["news-buzz1.com",81],["news30over.com",81],["nishinippon.co.jp",81],["nmb48-mtm.com",81],["norisoku.com",81],["npb-news.com",81],["ocsoku.com",81],["okusama-kijyo.com",81],["onecall2ch.com",81],["onihimechan.com",81],["orusoku.com",81],["otakomu.jp",81],["otoko-honne.com",81],["oumaga-times.com",81],["outdoormatome.com",81],["pachinkopachisro.com",81],["paranormal-ch.com",81],["recosoku.com",81],["s2-log.com",81],["saikyo-jump.com",81],["shuraba-matome.com",81],["ske48matome.net",81],["squallchannel.com",81],["sukattojapan.com",81],["sumaburayasan.com",81],["sutekinakijo.com",81],["usi32.com",81],["uwakich.com",81],["uwakitaiken.com",81],["vault76.info",81],["vipnews.jp",81],["vippers.jp",81],["vipsister23.com",81],["vtubernews.jp",81],["watarukiti.com",81],["world-fusigi.net",81],["zakuzaku911.com",81],["zch-vip.com",81],["interfootball.co.kr",82],["a-ha.io",82],["cboard.net",82],["jjang0u.com",82],["joongdo.co.kr",82],["viva100.com",82],["gamingdeputy.com",82],["alle-tests.nl",82],["tweaksforgeeks.com",82],["m.inven.co.kr",82],["mlbpark.donga.com",82],["meconomynews.com",82],["brandbrief.co.kr",82],["motorgraph.com",82],["bleepingcomputer.com",83],["pravda.com.ua",83],["ap7am.com",84],["cinema.com.my",84],["dolldivine.com",84],["giornalone.it",84],["iplocation.net",84],["jamaicajawapos.com",84],["jutarnji.hr",84],["kompasiana.com",84],["mediaindonesia.com",84],["niice-woker.com",84],["slobodnadalmacija.hr",84],["upmedia.mg",84],["mentalfloss.com",86],["isgfrm.com",87],["advertisertape.com",88],["tapeadvertisement.com",88],["tapelovesads.org",88],["watchadsontape.com",88],["vosfemmes.com",89],["voyeurfrance.net",89],["hyundaitucson.info",90],["exambd.net",91],["cgtips.org",92],["freewebcart.com",93],["freemagazines.top",93],["siamblockchain.com",93],["emuenzen.de",94],["kickass.*",95],["unblocked.id",97],["listendata.com",98],["7xm.xyz",98],["fastupload.io",98],["azmath.info",98],["wouterplanet.com",99],["xenvn.com",100],["pfps.gg",101],["4kporn.xxx",102],["androidacy.com",103],["4porn4.com",104],["bestpornflix.com",105],["freeroms.com",105],["andhrafriends.com",105],["723qrh1p.fun",105],["98zero.com",106],["mediaset.es",106],["updatewallah.in",106],["hwbusters.com",106],["beatsnoop.com",107],["fetchpik.com",107],["hackerranksolution.in",107],["camsrip.com",107],["file.org",107],["btcbunch.com",109],["teachoo.com",[110,111]],["mafiatown.pl",112],["bitcotasks.com",113],["hilites.today",114],["udvl.com",115],["www.chip.de",[116,117,118,119]],["topsporter.net",120],["sportshub.to",120],["myanimelist.net",121],["unofficialtwrp.com",122],["codec.kyiv.ua",122],["kimcilonlyofc.com",122],["bitcosite.com",123],["bitzite.com",123],["teluguflix.*",124],["hacoos.com",125],["watchhentai.net",126],["hes-goals.io",126],["pkbiosfix.com",126],["casi3.xyz",126],["zefoy.com",127],["mailgen.biz",128],["tempinbox.xyz",128],["vidello.net",129],["newscon.org",130],["yunjiema.top",130],["pcgeeks-games.com",130],["resizer.myct.jp",131],["gametohkenranbu.sakuraweb.com",132],["jisakuhibi.jp",133],["rank1-media.com",133],["lifematome.blog",134],["fm.sekkaku.net",135],["dvdrev.com",136],["betweenjpandkr.blog",137],["nft-media.net",138],["ghacks.net",139],["leak.sx",140],["paste.bin.sx",140],["pornleaks.in",140],["aliezstream.pro",141],["daddy-stream.xyz",141],["daddylive1.*",141],["esportivos.*",141],["instream.pro",141],["mylivestream.pro",141],["poscitechs.*",141],["powerover.online",141],["sportea.link",141],["sportsurge.stream",141],["ufckhabib.com",141],["ustream.pro",141],["animeshqip.site",141],["apkship.shop",141],["buzter.pro",141],["enjoysports.bond",141],["filedot.to",141],["foreverquote.xyz",141],["hdstream.one",141],["kingstreamz.site",141],["live.fastsports.store",141],["livesnow.me",141],["livesports4u.pw",141],["masterpro.click",141],["nuxhallas.click",141],["papahd.info",141],["rgshows.me",141],["sportmargin.live",141],["sportmargin.online",141],["sportsloverz.xyz",141],["supertipzz.online",141],["totalfhdsport.xyz",141],["ultrastreamlinks.xyz",141],["usgate.xyz",141],["webmaal.cfd",141],["wizistreamz.xyz",141],["educ4m.com",141],["fromwatch.com",141],["visualnewshub.com",141],["khoaiphim.com",143],["haafedk2.com",144],["jovemnerd.com.br",145],["totalcsgo.com",146],["manysex.com",147],["gaminginfos.com",148],["tinxahoivn.com",149],["m.4khd.com",150],["westmanga.*",150],["automoto.it",151],["fordownloader.com",152],["codelivly.com",153],["tchatche.com",154],["cryptoearns.com",154],["lordchannel.com",155],["novelhall.com",156],["bagi.co.in",157],["keran.co",157],["biblestudytools.com",158],["christianheadlines.com",158],["ibelieve.com",158],["kuponigo.com",159],["inxxx.com",160],["bemyhole.com",160],["embedwish.com",161],["leakslove.net",161],["jenismac.com",162],["vxetable.cn",163],["nizarstream.com",164],["donghuaworld.com",165],["letsdopuzzles.com",166],["rediff.com",167],["igay69.com",168],["dzapk.com",169],["darknessporn.com",170],["familyporner.com",170],["freepublicporn.com",170],["pisshamster.com",170],["punishworld.com",170],["xanimu.com",170],["tainio-mania.online",171],["eroticmoviesonline.me",172],["series9movies.com",172],["teleclub.xyz",173],["ecamrips.com",174],["showcamrips.com",174],["tucinehd.com",175],["9animetv.to",176],["qiwi.gg",177],["jornadaperfecta.com",178],["loseart.com",179],["sousou-no-frieren.com",180],["unite-guide.com",182],["thebullspen.com",183],["receitasdaora.online",184],["hiraethtranslation.com",186],["all3do.com",187],["d0000d.com",187],["d000d.com",187],["d0o0d.com",187],["do0od.com",187],["do7go.com",187],["doods.*",187],["doodstream.*",187],["dooodster.com",187],["doply.net",187],["ds2play.com",187],["ds2video.com",187],["vidply.com",187],["vide0.net",187],["xfreehd.com",188],["freethesaurus.com",189],["thefreedictionary.com",189],["dexterclearance.com",190],["x86.co.kr",191],["onlyfaucet.com",192],["x-x-x.tube",193],["fdownloader.net",194],["thehackernews.com",195],["mielec.pl",196],["treasl.com",197],["mrbenne.com",198],["cnpics.org",[199,257]],["ovabee.com",199],["porn4f.com",199],["cnxx.me",[199,257]],["ai18.pics",[199,257]],["sportsonline.si",200],["fiuxy2.co",201],["animeunity.to",202],["tokopedia.com",203],["remixsearch.net",204],["remixsearch.es",204],["onlineweb.tools",204],["sharing.wtf",204],["2024tv.ru",205],["modrinth.com",206],["curseforge.com",206],["xnxxcom.xyz",207],["sportsurge.net",208],["joyousplay.xyz",208],["quest4play.xyz",[208,210]],["generalpill.net",208],["moneycontrol.com",209],["cookiewebplay.xyz",210],["ilovetoplay.xyz",210],["streamcaster.live",210],["weblivehdplay.ru",210],["nontongo.win",211],["m9.news",212],["callofwar.com",213],["secondhandsongs.com",214],["nohost.one",215],["vidbinge.com",215],["send.cm",216],["send.now",216],["3rooodnews.net",217],["xxxbfvideo.net",218],["filmy4wap.co.in",219],["filmy4waps.org",219],["gameshop4u.com",220],["regenzi.site",220],["historicaerials.com",221],["handirect.fr",222],["animefenix.tv",223],["fsiblog3.club",224],["kamababa.desi",224],["sat-sharing.com",224],["getfiles.co.uk",225],["genelify.com",226],["dhtpre.com",227],["xbaaz.com",228],["lineupexperts.com",230],["fearmp4.ru",231],["buffsports.*",232],["fbstreams.*",232],["wavewalt.me",232],["m.shuhaige.net",233],["streamingnow.mov",234],["thesciencetoday.com",235],["sportnews.to",235],["ghbrisk.com",237],["iplayerhls.com",237],["bacasitus.com",238],["katoikos.world",238],["abstream.to",239],["pawastreams.pro",240],["rebajagratis.com",241],["tv.latinlucha.es",241],["fetcheveryone.com",242],["reviewdiv.com",243],["laurelberninteriors.com",244],["godlike.com",245],["godlikeproductions.com",245],["bestsportslive.org",246],["bestreamsports.org",247],["streamhls.to",249],["xmalay1.net",250],["letemsvetemapplem.eu",251],["pc-builds.com",252],["watch-dbz57.funonline.co.in",254],["live4all.net",255],["pokemon-project.com",256],["3minx.com",257],["555fap.com",257],["blackwidof.org",257],["fc2ppv.stream",257],["hentai4f.com",257],["hentaipig.com",257],["javball.com",257],["javbee.vip",257],["javring.com",257],["javsunday.com",257],["kin8-av.com",257],["porn4f.org",257],["sweetie-fox.com",257],["xcamcovid.com",257],["moviesonlinefree.*",258],["fileszero.com",259],["viralharami.com",259],["bmamag.com",260],["bmacanberra.wpcomstaging.com",260],["cinemastervip.com",261],["mmsbee42.com",262],["mmsmasala.com",262],["cefirates.com",263],["comicleaks.com",263],["tapmyback.com",263],["ping.gg",263],["nookgaming.com",263],["creatordrop.com",263],["bitdomain.biz",263],["fort-shop.kiev.ua",263],["accuretawealth.com",263],["resourceya.com",263],["tracktheta.com",263],["adaptive.marketing",263],["camberlion.com",263],["trybawaryjny.pl",263],["segops.madisonspecs.com",263],["stresshelden-coaching.de",263],["controlconceptsusa.com",263],["ryaktive.com",263],["tip.etip-staging.etip.io",263],["future-fortune.com",264],["furucombo.app",264],["bolighub.dk",264],["intercity.technology",265],["freelancer.taxmachine.be",265],["adria.gg",265],["fjlaboratories.com",265],["abhijith.page",265],["helpmonks.com",265],["dataunlocker.com",266],["proboards.com",267],["winclassic.net",267],["farmersjournal.ie",268]]);
const exceptionsMap = new Map([["chatango.com",[6]],["twitter.com",[6]],["youtube.com",[6]]]);
const hasEntities = true;
const hasAncestors = true;

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
