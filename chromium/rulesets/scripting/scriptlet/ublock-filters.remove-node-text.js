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
const argsList = [["script","window,\"fetch\""],["script","offsetParent"],["script","/adblock/i"],["script","location.reload"],["script","adBlockEnabled"],["script","\"Anzeige\""],["script","adserverDomain"],["script","Promise"],["script","/adbl/i"],["script","Reflect"],["script","document.write"],["script","self == top"],["script","exdynsrv"],["script","/delete window|adserverDomain|FingerprintJS/"],["script","delete window"],["script","adsbygoogle"],["script","FingerprintJS"],["script","/h=decodeURIComponent|popundersPerIP/"],["script","/adblock.php"],["script","/adb/i"],["script","/document\\.createElement|\\.banner-in/"],["script","admbenefits"],["script","/\\badblock\\b/"],["script","myreadCookie"],["script","ExoLoader"],["script","/?key.*open/","condition","key"],["script","adblock"],["script","homad"],["script","popUnderUrl"],["script","Adblock"],["script","WebAssembly"],["script","/ABDetected|navigator.brave|fetch/"],["script","/ai_|b2a/"],["script","deblocker"],["script","window.adblockDetector"],["script","DName"],["script","/bypass.php"],["script","htmls"],["script","toast"],["script","AdbModel"],["script","/popup/i"],["script","antiAdBlockerHandler"],["script","/ad\\s?block|adsBlocked|document\\.write\\(unescape\\('|devtool/i"],["script","onerror"],["script","location.assign"],["script","location.href"],["script","/checkAdBlocker|AdblockRegixFinder/"],["script","catch"],["script","/adb_detected|;break;case \\$\\./"],["script","window.open"],["script","/aclib|break;|zoneNativeSett/"],["script","/fetch|popupshow/"],["script","justDetectAdblock"],["script","/FingerprintJS|openPopup/"],["script","DisableDevtool"],["script","popUp"],["script","/adsbygoogle|detectAdBlock/"],["script","onDevToolOpen"],["script","detectAdBlock"],["script","ctrlKey"],["script","/\\);break;case|advert_|POPUNDER_URL|adblock/"],["script","DisplayAcceptableAdIfAdblocked"],["script","adslotFilledByCriteo"],["script","/==undefined.*body/"],["script","/popunder|isAdBlock|admvn.src/i"],["script","/h=decodeURIComponent|\"popundersPerIP\"/"],["script","popMagic"],["script","pop1stp"],["script","/popMagic|pop1stp/"],["script","/shown_at|WebAssembly/"],["script",";}}};break;case $."],["script","globalThis;break;case"],["script","{delete window["],["script","wpadmngr.com"],["script","/decodeURIComponent\\(escape|fairAdblock/"],["script","/ai_|googletag|adb/"],["script","ai_adb"],["script","\"v4ac1eiZr0\""],["script","admiral"],["script","'').split(',')[4]"],["script","/\"v4ac1eiZr0\"|\"\"\\)\\.split\\(\",\"\\)\\[4\\]|(\\.localStorage\\)|JSON\\.parse\\(\\w)\\.getItem\\(\"|[\"']_aQS0\\w+[\"']/"],["script","error-report.com"],["script","html-load.com"],["script","KCgpPT57bGV0IGU"],["script","Ad-Shield"],["script","adrecover.com"],["script","/bizx|prebid/"],["script","\"data-sdk\""],["script","_ADX_"],["script","/adbl|RegExp/i"],["script","/WebAssembly|forceunder/"],["script","/isAdBlocked|popUnderUrl/"],["script","/adb|offsetWidth|eval/i"],["script","contextmenu"],["script","/adblock|var Data.*];/"],["script","var Data"],["script","replace"],["style","text-decoration"],["script","/break;case|FingerprintJS/"],["script","push"],["script","AdBlocker"],["script","clicky"],["script","XV"],["script","onload"],["script","Popunder"],["script","charCodeAt"],["script","localStorage"],["script","popunder"],["script","adbl"],["script","googlesyndication"],["script","blockAdBlock"],["script","/downloadJSAtOnload|Object.prototype.toString.call/"],["script","numberPages"],["script","brave"],["script","AreLoaded"],["script","AdblockRegixFinder"],["script","/adScript|adsBlocked/"],["script","serve"],["script","?metric=transit.counter&key=fail_redirect&tags="],["script","/pushAdTag|link_click|getAds/"],["script","/\\', [0-9]{5}\\)\\]\\; \\}/"],["script","/\\\",\\\"clickp\\\"\\:\\\"[0-9]{1,2}\\\"/"],["script","/ConsoleBan|alert|AdBlocker/"],["style","body:not(.ownlist)"],["script","mdpDeblocker"],["script","alert","condition","adblock"],["script","/deblocker|chp_ad/"],["script","await fetch"],["script","AdBlock"],["script","/'.adsbygoogle'|text-danger|warning|Adblock|_0x/"],["script","insertAdjacentHTML"],["script","popUnder"],["script","adb"],["#text","/スポンサーリンク|Sponsored Link|广告/"],["#text","スポンサーリンク"],["#text","スポンサードリンク"],["#text","/\\[vkExUnit_ad area=(after|before)\\]/"],["#text","【広告】"],["#text","関連動画"],["#text","PR:"],["script","leave_recommend"],["#text","/Advertisement/"],["script","navigator.brave"],["script","popundersPerIP"],["script","liedetector"],["script","end_click"],["script","getComputedStyle"],["script","closeAd"],["script","/adconfig/i"],["script","is_antiblock_refresh"],["script","/userAgent|adb|htmls/"],["script","myModal"],["script","open"],["script","app_checkext"],["script","ad blocker"],["script","clientHeight"],["script","Brave"],["script","await"],["script","axios"],["script","/charAt|XMLHttpRequest/"],["script","AdBlockEnabled"],["script","window.location.replace"],["script","egoTab"],["script","/$.*(css|oncontextmenu)/"],["script","/eval.*RegExp/"],["script","wwads"],["script","/\\[\\'push\\'\\]/"],["script","/ads?Block/i"],["script","chkADB"],["script","Symbol.iterator"],["script","ai_cookie"],["script","/innerHTML.*appendChild/"],["script","Exo"],["script","AaDetector"],["script","/window\\[\\'open\\'\\]/"],["script","Error"],["script","/document\\.head\\.appendChild|window\\.open/"],["script","Number"],["script","NEXT_REDIRECT"],["script","ad-block-activated"],["script","insertBefore"],["script","pop.doEvent"],["script","Ads"],["script","detect"],["script","fetch"],["script","/hasAdblock|detect/"],["script","document.createTextNode"],["script","adsSrc"],["script","/adblock|popunder|openedPop|WebAssembly|wpadmngr/"],["script","/popMagic|nativeads|navigator\\.brave|\\.abk_msg|\\.innerHTML|ad block|manipulation/"],["script","window.warn"],["script","adBlock"],["script","adBlockDetected"],["script","/fetch|adb/i"],["script","location"],["script","showAd"],["script","imgSrc"],["script","document.createElement(\"script\")"],["script","antiAdBlock"],["script","/fairAdblock|popMagic/"],["script","/pop1stp|detectAdBlock/"],["script","aclib.runPop"],["script","mega-enlace.com/ext.php?o="],["script","Popup"],["script","displayAdsV3"],["script","adblocker"],["script","break;case"],["h2","/creeperhost/i"],["script","/interceptClickEvent|onbeforeunload|popMagic|location\\.replace/"],["script","/adserverDomain|\\);break;case /"],["script","initializeInterstitial"],["script","popupBackground"],["script","/h=decodeURIComponent|popundersPerIP|adserverDomain/"],["script","m9-ad-modal"],["script","Anzeige"],["script","blocking"],["script","HTMLAllCollection"],["script","LieDetector"],["script","advads"],["script","document.cookie"],["script","/h=decodeURIComponent|popundersPerIP|window\\.open|\\.createElement/"],["script","/_0x|brave|onerror/"],["script","window.googletag.pubads"],["script","kmtAdsData"],["script","wpadmngr"],["script","navigator.userAgent"],["script","checkAdBlock"],["script","detectedAdblock"],["script","setADBFlag"],["script","/h=decodeURIComponent|popundersPerIP|wpadmngr|popMagic/"],["script","/wpadmngr|adserverDomain/"],["script","/account_ad_blocker|tmaAB/"],["script","ads_block"],["script","/adserverDomain|delete window|FingerprintJS/"],["script","return a.split"],["script","/popundersPerIP|adserverDomain|wpadmngr/"],["script","==\"]"],["script","ads-blocked"],["script","#adbd"],["script","AdBl"],["script","/adblock|Cuba|noadb|popundersPerIP/i"],["script","/adserverDomain|ai_cookie/"],["script","/adsBlocked|\"popundersPerIP\"/"],["script","ab.php"],["script","wpquads_adblocker_check"],["script","__adblocker"],["script","/alert|brave|blocker/i"],["script","/ai_|eval|Google/"],["script","/eval|adb/i"],["script","catcher"],["script","/setADBFlag|cRAds|\\;break\\;case|adManager|const popup/"],["script","/isAdBlockActive|WebAssembly/"],["script","videoList"],["script","freestar"],["script","/admiral/i"],["script","/AdBlock/i"],["script","/andbox|adBlock|data-zone|histats|contextmenu|ConsoleBan/"],["script","closePlayer"],["script","/detect|WebAssembly/"],["script","_0x"],["script","destroyContent"],["script","advanced_ads_check_adblocker"],["script","'hidden'"],["script","/dismissAdBlock|533092QTEErr/"],["script","debugger"],["script","/join\\(\\'\\'\\)/"],["script","/join\\(\\\"\\\"\\)/"],["script","api.dataunlocker.com"],["script","/^Function\\(\\\"/"],["script","vglnk"],["script","/detect|FingerprintJS/"],["script","/RegExp\\(\\'/","condition","RegExp"]];
const hostnamesMap = new Map([["www.youtube.com",0],["poophq.com",1],["veev.to",1],["faqwiki.*",2],["snapwordz.com",2],["toolxox.com",2],["rl6mans.com",2],["nontonx.com",3],["pandadoc.com",4],["web.de",5],["skidrowreloaded.com",[6,17]],["1337x.*",[6,17]],["1stream.eu",6],["4kwebplay.xyz",6],["alldownplay.xyz",6],["anime4i.vip",6],["antennasports.ru",6],["boxingstream.me",6],["buffstreams.app",6],["claplivehdplay.ru",[6,211]],["cracksports.me",[6,16]],["cricstream.me",6],["cricstreams.re",[6,16]],["dartsstreams.com",6],["eurekaddl.baby",6],["euro2024direct.ru",6],["ext.to",6],["extrem-down.*",6],["extreme-down.*",6],["eztv.*",6],["eztvx.to",6],["f1box.me",6],["flix-wave.*",6],["flixrave.me",6],["golfstreams.me",6],["hikaritv.xyz",6],["ianimes.one",6],["jointexploit.net",[6,17]],["kenitv.me",[6,16]],["lewblivehdplay.ru",[6,211]],["mediacast.click",6],["mixdrop.*",[6,17]],["mlbbite.net",6],["mlbstreams.ai",6],["motogpstream.me",6],["nbabox.me",6],["nflbox.me",6],["nhlbox.me",6],["playcast.click",6],["qatarstreams.me",[6,16]],["qqwebplay.xyz",[6,211]],["rnbastreams.com",6],["rugbystreams.me",6],["sanet.*",6],["socceronline.me",6],["soccerworldcup.me",[6,16]],["sportshd.*",6],["sportzonline.si",6],["streamed.su",6],["sushiscan.net",6],["topstreams.info",6],["totalsportek.to",6],["tvableon.me",[6,16]],["vecloud.eu",6],["vibestreams.*",6],["vipstand.pm",6],["worldsports.me",6],["x1337x.*",6],["wawacity.*",6],["720pstream.*",[6,70]],["embedsports.me",[6,98]],["embedstream.me",[6,16,17,70,98]],["jumbtv.com",[6,98]],["reliabletv.me",[6,98]],["topembed.pw",[6,72,211]],["crackstreamer.net",6],["methstreamer.com",6],["vidsrc.*",[6,16,70]],["vidco.pro",[6,70]],["freestreams-live.*>>",6],["moviepilot.de",[7,61]],["userupload.*",8],["cinedesi.in",8],["intro-hd.net",8],["monacomatin.mc",8],["nodo313.net",8],["mhdtvsports.*",[8,33]],["hesgoal-tv.io",8],["hesgoal-vip.io",8],["earn.punjabworks.com",8],["mahajobwala.in",8],["solewe.com",8],["panel.play.hosting",8],["total-sportek.to",8],["hesgoal-vip.to",8],["shoot-yalla.me",8],["shoot-yalla-tv.live",8],["pahe.*",[9,17,72]],["soap2day.*",9],["yts.mx",10],["hqq.*",11],["waaw.*",11],["pixhost.*",12],["vipbox.*",13],["telerium.*",14],["apex2nova.com",14],["hoca5.com",14],["germancarforum.com",15],["cybercityhelp.in",15],["innateblogger.com",15],["omeuemprego.online",15],["viprow.*",[16,17,70]],["bluemediadownload.*",16],["bluemediafile.*",16],["bluemedialink.*",16],["bluemediastorage.*",16],["bluemediaurls.*",16],["urlbluemedia.*",16],["bowfile.com",16],["cloudvideo.tv",[16,70]],["cloudvideotv.*",[16,70]],["coloredmanga.com",16],["exeo.app",16],["hiphopa.net",[16,17]],["megaup.net",16],["olympicstreams.co",[16,70]],["tv247.us",[16,17]],["uploadhaven.com",16],["userscloud.com",[16,70]],["streamnoads.com",[16,17,70,90]],["mlbbox.me",16],["vikingf1le.us.to",16],["neodrive.xyz",16],["mdfx9dc8n.net",17],["mdzsmutpcvykb.net",17],["mixdrop21.net",17],["mixdropjmk.pw",17],["123-movies.*",17],["123movieshd.*",17],["123movieshub.*",17],["123moviesme.*",17],["1337x.ninjaproxy1.com",17],["141jav.com",17],["141tube.com",17],["1bit.space",17],["1bitspace.com",17],["1stream.*",17],["1tamilmv.*",17],["2ddl.*",17],["2umovies.*",17],["3dporndude.com",17],["3hiidude.*",17],["4archive.org",17],["4horlover.com",17],["4stream.*",17],["560pmovie.com",17],["5movies.*",17],["7hitmovies.*",17],["85videos.com",17],["9xmovie.*",17],["aagmaal.*",[17,70]],["acefile.co",17],["actusports.eu",17],["adblockeronstape.*",[17,90]],["adblockeronstreamtape.*",17],["adblockplustape.*",[17,90]],["adblockstreamtape.*",[17,90]],["adblockstrtape.*",[17,90]],["adblockstrtech.*",[17,90]],["adblocktape.*",[17,90]],["adclickersbot.com",17],["adcorto.*",17],["adricami.com",17],["adslink.pw",17],["adultstvlive.com",17],["adz7short.space",17],["aeblender.com",17],["affordwonder.net",17],["ahdafnews.blogspot.com",17],["aiblog.tv",[17,73]],["ak47sports.com",17],["akuma.moe",17],["alexsports.*",17],["alexsportss.*",17],["alexsportz.*",17],["allplayer.tk",17],["amateurblog.tv",[17,73]],["androidadult.com",[17,237]],["anhsexjav.xyz",17],["anidl.org",17],["anime-loads.org",17],["animeblkom.net",17],["animefire.plus",17],["animelek.me",17],["animepahe.*",17],["animesanka.*",17],["animesorionvip.net",17],["animespire.net",17],["animestotais.xyz",17],["animeyt.es",17],["animixplay.*",17],["aniplay.*",17],["anroll.net",17],["antiadtape.*",[17,90]],["anymoviess.xyz",17],["aotonline.org",17],["asenshu.com",17],["asialiveaction.com",17],["asianclipdedhd.net",17],["asianclub.*",17],["ask4movie.*",17],["askim-bg.com",17],["asumsikedaishop.com",17],["atomixhq.*",[17,70]],["atomohd.*",17],["avcrempie.com",17],["avseesee.com",17],["gettapeads.com",[17,90]],["bajarjuegospcgratis.com",17],["balkanteka.net",17],["beinmatch.*",[17,25]],["belowporn.com",17],["bestgirlsexy.com",17],["bestnhl.com",17],["bestporncomix.com",17],["bhaai.*",17],["bigwarp.*",17],["bikinbayi.com",17],["bikinitryon.net",17],["birdurls.com",17],["bitsearch.to",17],["blackcockadventure.com",17],["blackcockchurch.org",17],["blackporncrazy.com",17],["blizzboygames.net",17],["blizzpaste.com",17],["blkom.com",17],["blog-peliculas.com",17],["blogtrabalhista.com",17],["blurayufr.*",17],["bobsvagene.club",17],["bokep.im",17],["bokep.top",17],["boyfuck.me",17],["brilian-news.id",17],["brupload.net",17],["buffstreams.*",17],["buzter.xyz",17],["caitlin.top",17],["camchickscaps.com",17],["camgirls.casa",17],["canalesportivo.*",17],["cashurl.in",17],["ccurl.net",[17,70]],["cgpelis.net",17],["charexempire.com",17],["clickndownload.*",17],["clicknupload.*",[17,72]],["clik.pw",17],["coin-free.com",[17,37]],["coins100s.fun",17],["comohoy.com",17],["compucalitv.com",17],["coolcast2.com",17],["cordneutral.net",17],["coreradio.online",17],["cosplaytab.com",17],["countylocalnews.com",17],["cpmlink.net",17],["crackstreamshd.click",17],["crespomods.com",17],["crisanimex.com",17],["crunchyscan.fr",17],["cuevana3.fan",17],["cuevana3hd.com",17],["cumception.com",17],["cutpaid.com",17],["daddylive.*",[17,70,209]],["daddylivehd.*",[17,70]],["dailyuploads.net",17],["datawav.club",17],["daughtertraining.com",17],["ddrmovies.*",17],["deepgoretube.site",17],["deltabit.co",17],["deporte-libre.top",17],["depvailon.com",17],["derleta.com",17],["desiremovies.*",17],["desivdo.com",17],["desixx.net",17],["detikkebumen.com",17],["deutschepornos.me",17],["devlib.*",17],["diasoft.xyz",17],["directupload.net",17],["divxtotal.*",17],["divxtotal1.*",17],["dixva.com",17],["dlhd.*",[17,209]],["doctormalay.com",17],["dofusports.xyz",17],["doods.cam",17],["doodskin.lat",17],["downloadrips.com",17],["downvod.com",17],["dphunters.mom",17],["dragontranslation.com",17],["dvdfullestrenos.com",17],["dvdplay.*",[17,70]],["dx-tv.com",[17,33]],["ebookbb.com",17],["ebookhunter.net",17],["egyanime.com",17],["egygost.com",17],["ekasiwap.com",17],["electro-torrent.pl",17],["elixx.*",17],["enjoy4k.*",17],["eplayer.click",17],["erovoice.us",17],["eroxxx.us",17],["estrenosdoramas.net",17],["estrenosflix.*",17],["estrenosflux.*",17],["estrenosgo.*",17],["everia.club",17],["everythinginherenet.blogspot.com",17],["extratorrent.st",17],["extremotvplay.com",17],["f1stream.*",17],["fapinporn.com",17],["fapptime.com",17],["fastreams.live",17],["faucethero.com",17],["favoyeurtube.net",17],["fbstream.*",17],["fc2db.com",17],["femdom-joi.com",17],["fenixsite.net",17],["file4go.*",17],["filegram.to",[17,68,73]],["fileone.tv",17],["film1k.com",17],["filmeonline2023.net",17],["filmesonlinex.org",17],["filmesonlinexhd.biz",[17,70]],["filmisub.cc",17],["filmovitica.com",17],["filmymaza.blogspot.com",17],["filmyzilla.*",[17,70]],["filthy.family",17],["findav.*",17],["findporn.*",17],["flickzap.com",17],["flixmaza.*",17],["flizmovies.*",17],["flostreams.xyz",17],["flyfaucet.com",17],["footyhunter.lol",17],["forex-trnd.com",17],["forumchat.club",17],["forumlovers.club",17],["freeomovie.co.in",17],["freeomovie.to",17],["freeporncomic.net",17],["freepornhdonlinegay.com",17],["freeproxy.io",17],["freeshot.live",17],["freetvsports.*",17],["freeuse.me",17],["freeusexporn.com",17],["fsharetv.cc",17],["fsicomics.com",17],["fullymaza.*",17],["g-porno.com",17],["g3g.*",17],["galinhasamurai.com",17],["gamepcfull.com",17],["gamesmountain.com",17],["gamesrepacks.com",17],["gamingguru.fr",17],["gamovideo.com",17],["garota.cf",17],["gaydelicious.com",17],["gaypornhdfree.com",17],["gaypornhot.com",17],["gaypornmasters.com",17],["gaysex69.net",17],["gemstreams.com",17],["get-to.link",17],["girlscanner.org",17],["giurgiuveanul.ro",17],["gledajcrtace.xyz",17],["gocast2.com",17],["gomo.to",17],["gostosa.cf",17],["gotxx.*",17],["grantorrent.*",17],["gratispaste.com",17],["gravureblog.tv",[17,73]],["gupload.xyz",17],["haho.moe",17],["hayhd.net",17],["hdmoviesfair.*",[17,70]],["hdmoviesflix.*",17],["hdpornflix.com",17],["hdsaprevodom.com",17],["hdstreamss.club",17],["hentaiporno.xxx",17],["hentais.tube",17],["hentaistream.co",17],["hentaitk.net",17],["hentaitube.online",17],["hentaiworld.tv",17],["hesgoal.tv",17],["hexupload.net",17],["hhkungfu.tv",17],["highlanderhelp.com",17],["hiidudemoviez.*",17],["hindimovies.to",[17,70]],["hindimoviestv.com",17],["hiperdex.com",17],["hispasexy.org",17],["hitprn.com",17],["hivflix.me",17],["hoca4u.com",17],["hollymoviehd.cc",17],["hoodsite.com",17],["hopepaste.download",17],["hornylips.com",17],["hotgranny.live",17],["hotmama.live",17],["hqcelebcorner.net",17],["huren.best",17],["hwnaturkya.com",[17,70]],["hxfile.co",[17,70]],["igfap.com",17],["iklandb.com",17],["illink.net",17],["imgsen.*",17],["imgsex.xyz",17],["imgsto.*",17],["imgtraffic.com",17],["imx.to",17],["incest.*",17],["incestflix.*",17],["influencersgonewild.org",17],["infosgj.free.fr",17],["investnewsbrazil.com",17],["itdmusics.com",17],["itopmusic.*",17],["itsuseful.site",17],["itunesfre.com",17],["iwatchfriendsonline.net",[17,144]],["japangaysex.com",17],["jav-fun.cc",17],["jav-noni.cc",17],["javboys.tv",17],["javcl.com",17],["jav-coco.com",17],["javhay.net",17],["javhoho.com",17],["javhun.com",17],["javleak.com",17],["javmost.*",17],["javporn.best",17],["javsek.net",17],["javsex.to",17],["javtiful.com",[17,19]],["jimdofree.com",17],["jiofiles.org",17],["jorpetz.com",17],["jp-films.com",17],["jpop80ss3.blogspot.com",17],["jpopsingles.eu",[17,187]],["justfullporn.net",17],["kantotflix.net",17],["kaplog.com",17],["keeplinks.*",17],["keepvid.*",17],["keralahd.*",17],["keralatvbox.com",17],["khatrimazaful.*",17],["khatrimazafull.*",[17,73]],["kickassanimes.io",17],["kimochi.info",17],["kimochi.tv",17],["kinemania.tv",17],["kissasian.*",17],["kolnovel.site",17],["koltry.life",17],["konstantinova.net",17],["koora-online.live",17],["kunmanga.com",17],["kwithsub.com",17],["lat69.me",17],["latinblog.tv",[17,73]],["latinomegahd.net",17],["leechall.*",17],["leechpremium.link",17],["legendas.dev",17],["legendei.net",17],["lighterlegend.com",17],["linclik.com",17],["linkebr.com",17],["linkrex.net",17],["linkshorts.*",17],["lulu.st",17],["lulustream.com",[17,72]],["lulustream.live",17],["luluvdo.com",17],["luluvdoo.com",17],["mangaweb.xyz",17],["mangovideo.*",17],["masahub.com",17],["masahub.net",17],["masaporn.*",17],["maturegrannyfuck.com",17],["mdy48tn97.com",17],["mediapemersatubangsa.com",17],["mega-mkv.com",17],["megapastes.com",17],["megapornpics.com",17],["messitv.net",17],["meusanimes.net",17],["mexa.sh",17],["milfmoza.com",17],["milfnut.*",17],["milfzr.com",17],["millionscast.com",17],["mimaletamusical.blogspot.com",17],["miniurl.*",17],["mirrorace.*",17],["mitly.us",17],["mixdroop.*",17],["mixixxx000000.cyou",17],["mixixxx696969.cyou",17],["mkv-pastes.com",17],["mkvcage.*",17],["mlbstream.*",17],["mlsbd.*",17],["mmsbee.*",17],["monaskuliner.ac.id",17],["moredesi.com",17],["motogpstream.*",17],["moutogami.com",17],["movgotv.net",17],["movi.pk",17],["movieplex.*",17],["movierulzlink.*",17],["movies123.*",17],["moviesflix.*",17],["moviesmeta.*",17],["moviesmod.com.pl",17],["moviessources.*",17],["moviesverse.*",17],["movieswbb.com",17],["moviewatch.com.pk",17],["moviezwaphd.*",17],["mp4upload.com",17],["mrskin.live",17],["mrunblock.*",17],["multicanaistv.com",17],["mundowuxia.com",17],["multicanais.*",17],["myeasymusic.ir",17],["myonvideo.com",17],["myyouporn.com",17],["mzansifun.com",17],["narutoget.info",17],["naughtypiss.com",17],["nbastream.*",17],["nekopoi.*",[17,73]],["nerdiess.com",17],["netfuck.net",17],["new-fs.eu",17],["newmovierulz.*",17],["newtorrentgame.com",17],["neymartv.net",17],["nflstream.*",17],["nflstreams.me",17],["nhlstream.*",17],["nicekkk.com",17],["nicesss.com",17],["nlegs.com",17],["noblocktape.*",[17,90]],["nocensor.*",17],["noni-jav.com",17],["notformembersonly.com",17],["novamovie.net",17],["novelpdf.xyz",17],["novelssites.com",[17,70]],["novelup.top",17],["nsfwr34.com",17],["nu6i-bg-net.com",17],["nudebabesin3d.com",17],["nzbstars.com",17],["o2tvseries.com",17],["ohjav.com",17],["ojearnovelas.com",17],["okanime.xyz",17],["olweb.tv",17],["on9.stream",17],["onepiece-mangaonline.com",17],["onifile.com",17],["onionstream.live",17],["onlinesaprevodom.net",17],["onlyfams.*",17],["onlyfullporn.video",17],["onplustv.live",17],["originporn.com",17],["ouo.*",17],["ovagames.com",17],["palimas.org",17],["password69.com",17],["pastemytxt.com",17],["payskip.org",17],["pctfenix.*",[17,70]],["pctnew.*",[17,70]],["peeplink.in",17],["peliculas24.*",17],["peliculasmx.net",17],["pelisflix20.*",17],["pelisplus.*",17],["pencarian.link",17],["pendidikandasar.net",17],["pervertgirlsvideos.com",17],["pervyvideos.com",17],["phim12h.com",17],["picdollar.com",17],["picsxxxporn.com",17],["pinayscandalz.com",17],["pinkueiga.net",17],["piratebay.*",17],["piratefast.xyz",17],["piratehaven.xyz",17],["pirateiro.com",17],["playtube.co.za",17],["plugintorrent.com",17],["plyjam.*",17],["plylive.*",17],["plyvdo.*",17],["pmvzone.com",17],["porndish.com",17],["pornez.net",17],["pornfetishbdsm.com",17],["pornfits.com",17],["pornhd720p.com",17],["pornhoarder.*",[17,230]],["pornobr.club",17],["pornobr.ninja",17],["pornodominicano.net",17],["pornofaps.com",17],["pornoflux.com",17],["pornotorrent.com.br",17],["pornredit.com",17],["pornstarsyfamosas.es",17],["pornstreams.co",17],["porntn.com",17],["pornxbit.com",17],["pornxday.com",17],["portaldasnovinhas.shop",17],["portugues-fcr.blogspot.com",17],["poseyoung.com",17],["pover.org",17],["prbay.*",17],["projectfreetv.*",17],["proxybit.*",17],["proxyninja.org",17],["psarips.*",17],["pubfilmz.com",17],["publicsexamateurs.com",17],["punanihub.com",17],["pxxbay.com",17],["r18.best",17],["racaty.*",17],["ragnaru.net",17],["rapbeh.net",17],["rapelust.com",17],["rapload.org",17],["read-onepiece.net",17],["readhunters.xyz",17],["remaxhd.*",17],["reshare.pm",17],["retro-fucking.com",17],["retrotv.org",17],["rintor.*",17],["rnbxclusive.*",17],["rnbxclusive0.*",17],["rnbxclusive1.*",17],["robaldowns.com",17],["rockdilla.com",17],["rojadirecta.*",17],["rojadirectaenvivo.*",17],["rojitadirecta.blogspot.com",17],["romancetv.site",17],["rsoccerlink.site",17],["rugbystreams.*",17],["rule34.club",17],["rule34hentai.net",17],["rumahbokep-id.com",17],["sadisflix.*",17],["safego.cc",17],["safetxt.*",17],["sakurafile.com",17],["samax63.lol",17],["satoshi-win.xyz",17],["savefiles.com",[17,68]],["scat.gold",17],["scatfap.com",17],["scatkings.com",17],["serie-turche.com",17],["serijefilmovi.com",17],["sexcomics.me",17],["sexdicted.com",17],["sexgay18.com",17],["sexiezpix.com",17],["sexofilm.co",17],["sextgem.com",17],["sextubebbw.com",17],["sgpics.net",17],["shadowrangers.*",17],["shadowrangers.live",17],["shahee4u.cam",17],["shahi4u.*",17],["shahid4u1.*",17],["shahid4uu.*",17],["shahiid-anime.net",17],["shavetape.*",17],["shemale6.com",17],["shid4u.*",17],["shinden.pl",17],["short.es",17],["shortearn.*",17],["shorten.*",17],["shorttey.*",17],["shortzzy.*",17],["showmanga.blog.fc2.com",17],["shrt10.com",17],["sideplusleaks.net",17],["silverblog.tv",[17,73]],["silverpic.com",17],["sinhalasub.life",17],["sinsitio.site",17],["sinvida.me",17],["skidrowcpy.com",17],["skymovieshd.*",17],["slut.mom",17],["smallencode.me",17],["smoner.com",17],["smplace.com",17],["soccerinhd.com",[17,70]],["socceron.name",17],["socceronline.*",[17,70]],["socialblog.tv",[17,73]],["softairbay.com",17],["softarchive.*",17],["sokobj.com",17],["songsio.com",17],["souexatasmais.com",17],["sportbar.live",17],["sports-stream.*",17],["sportstream1.cfd",17],["sporttuna.*",17],["sporttunatv.*",17],["srt.am",17],["srts.me",17],["sshhaa.*",17],["stapadblockuser.*",[17,90]],["stape.*",[17,90]],["stapewithadblock.*",17],["starblog.tv",[17,73]],["starmusiq.*",17],["stbemuiptv.com",17],["stockingfetishvideo.com",17],["strcloud.*",[17,90]],["stream.crichd.vip",17],["stream.lc",17],["stream25.xyz",17],["streamadblocker.*",[17,70,90]],["streamadblockplus.*",[17,90]],["streambee.to",17],["streambucket.net",17],["streamcdn.*",17],["streamcenter.pro",17],["streamers.watch",17],["streamgo.to",17],["streamhub.*",17],["streamingclic.com",17],["streamkiste.tv",17],["streamoupload.xyz",17],["streamservicehd.click",17],["streamsport.*",17],["streamta.*",[17,90]],["streamtape.*",[17,73,90]],["streamtapeadblockuser.*",[17,90]],["streamvid.net",[17,26]],["strikeout.*",[17,72]],["strtape.*",[17,90]],["strtapeadblock.*",[17,90]],["strtapeadblocker.*",[17,90]],["strtapewithadblock.*",17],["strtpe.*",[17,90]],["subtitleporn.com",17],["subtitles.cam",17],["suicidepics.com",17],["supertelevisionhd.com",17],["supexfeeds.com",17],["swatchseries.*",17],["swiftload.io",17],["swipebreed.net",17],["swzz.xyz",17],["sxnaar.com",17],["tabooflix.*",17],["taboosex.club",17],["tapeantiads.com",[17,90]],["tapeblocker.com",[17,90]],["tapenoads.com",[17,90]],["tapewithadblock.org",[17,90,271]],["teamos.xyz",17],["teen-wave.com",17],["teenporncrazy.com",17],["telegramgroups.xyz",17],["telenovelasweb.com",17],["tennisstreams.*",17],["tensei-shitara-slime-datta-ken.com",17],["tfp.is",17],["tgo-tv.co",[17,70]],["thaihotmodels.com",17],["theblueclit.com",17],["thebussybandit.com",17],["thedaddy.*",[17,209]],["thelastdisaster.vip",17],["themoviesflix.*",17],["thepiratebay.*",17],["thepiratebay0.org",17],["thepiratebay10.info",17],["thesexcloud.com",17],["thothub.today",17],["tightsexteens.com",17],["tlnovelas.net",17],["tmearn.*",17],["tojav.net",17],["tokusatsuindo.com",17],["toonanime.*",17],["top16.net",17],["topdrama.net",17],["topvideosgay.com",17],["torlock.*",17],["tormalayalam.*",17],["torrage.info",17],["torrents.vip",17],["torrentz2eu.*",17],["torrsexvid.com",17],["tpb-proxy.xyz",17],["trannyteca.com",17],["trendytalker.com",17],["tuktukcinma.com",17],["tumanga.net",17],["turbogvideos.com",17],["turboimagehost.com",17],["turbovid.me",17],["turkishseriestv.org",17],["turksub24.net",17],["tutele.sx",17],["tutelehd.*",17],["tvglobe.me",17],["tvpclive.com",17],["tvply.*",17],["tvs-widget.com",17],["tvseries.video",17],["u4m.*",17],["ucptt.com",17],["ufaucet.online",17],["ufcfight.online",17],["ufcstream.*",17],["ultrahorny.com",17],["ultraten.net",17],["unblocknow.*",17],["unblockweb.me",17],["underhentai.net",17],["uniqueten.net",17],["uns.bio",17],["upbaam.com",17],["uploadbuzz.*",17],["upstream.to",17],["usagoals.*",17],["ustream.to",17],["valhallas.click",[17,143]],["valeriabelen.com",17],["verdragonball.online",17],["vexmoviex.*",17],["vfxmed.com",17],["vidclouds.*",17],["video.az",17],["videostreaming.rocks",17],["videowood.tv",17],["vidlox.*",17],["vidorg.net",17],["vidtapes.com",17],["vidz7.com",17],["vikistream.com",17],["vinovo.to",17],["vipboxtv.*",[17,70]],["vipleague.*",[17,233]],["virpe.cc",17],["visifilmai.org",17],["viveseries.com",17],["vladrustov.sx",17],["volokit2.com",[17,209]],["vstorrent.org",17],["w-hentai.com",17],["watch-series.*",17],["watchbrooklynnine-nine.com",17],["watchelementaryonline.com",17],["watchjavidol.com",17],["watchkobestreams.info",17],["watchlostonline.net",17],["watchmodernfamilyonline.com",17],["watchmonkonline.com",17],["watchrulesofengagementonline.com",17],["watchseries.*",17],["webcamrips.com",17],["wincest.xyz",17],["wolverdon.fun",17],["wordcounter.icu",17],["worldmovies.store",17],["worldstreams.click",17],["wpdeployit.com",17],["wqstreams.tk",17],["wwwsct.com",17],["xanimeporn.com",17],["xblog.tv",[17,73]],["xclusivejams.*",17],["xmoviesforyou.*",17],["xn--verseriesespaollatino-obc.online",17],["xpornium.net",17],["xsober.com",17],["xvip.lat",17],["xxgasm.com",17],["xxvideoss.org",17],["xxx18.uno",17],["xxxdominicana.com",17],["xxxfree.watch",17],["xxxmax.net",17],["xxxwebdlxxx.top",17],["xxxxvideo.uno",17],["yabai.si",17],["yeshd.net",17],["youdbox.*",17],["youjax.com",17],["yourdailypornvideos.ws",17],["yourupload.com",17],["youswear.com",17],["ytmp3eu.*",17],["yts-subs.*",17],["yts.*",17],["ytstv.me",17],["yumeost.net",17],["zerion.cc",17],["zerocoin.top",17],["zitss.xyz",17],["zooqle.*",17],["zpaste.net",17],["fastreams.com",17],["sky-sports.store",17],["streamsoccer.site",17],["tntsports.store",17],["wowstreams.co",17],["dutchycorp.*",18],["faucet.ovh",18],["mmacore.tv",19],["nxbrew.net",19],["brawlify.com",19],["oko.sh",20],["variety.com",[21,80]],["gameskinny.com",21],["deadline.com",[21,80]],["mlive.com",[21,80]],["washingtonpost.com",22],["gosexpod.com",23],["sexo5k.com",24],["truyen-hentai.com",24],["theshedend.com",26],["zeroupload.com",26],["securenetsystems.net",26],["miniwebtool.com",26],["bchtechnologies.com",26],["eracast.cc",26],["flatai.org",26],["leeapk.com",26],["spiegel.de",27],["jacquieetmichel.net",28],["hausbau-forum.de",29],["althub.club",29],["kiemlua.com",29],["doujindesu.*",30],["atlasstudiousa.com",30],["51bonusrummy.in",[30,73]],["tea-coffee.net",31],["spatsify.com",31],["newedutopics.com",31],["getviralreach.in",31],["edukaroo.com",31],["funkeypagali.com",31],["careersides.com",31],["nayisahara.com",31],["wikifilmia.com",31],["infinityskull.com",31],["viewmyknowledge.com",31],["iisfvirtual.in",31],["starxinvestor.com",31],["jkssbalerts.com",31],["imagereviser.com",32],["veganab.co",33],["camdigest.com",33],["learnmany.in",33],["amanguides.com",[33,39]],["highkeyfinance.com",[33,39]],["appkamods.com",33],["techacode.com",33],["djqunjab.in",33],["downfile.site",33],["expertvn.com",33],["trangchu.news",33],["shemaleraw.com",33],["thecustomrom.com",33],["nulleb.com",33],["snlookup.com",33],["bingotingo.com",33],["ghior.com",33],["3dmili.com",33],["karanpc.com",33],["plc247.com",33],["apkdelisi.net",33],["freepasses.org",33],["poplinks.*",[33,43]],["tomarnarede.pt",33],["basketballbuzz.ca",33],["dribbblegraphics.com",33],["kemiox.com",33],["teksnologi.com",33],["bharathwick.com",33],["descargaspcpro.net",33],["rt3dmodels.com",33],["plc4me.com",33],["blisseyhusbands.com",33],["mhdsports.*",33],["mhdsportstv.*",33],["mhdtvworld.*",33],["mhdtvmax.*",33],["mhdstream.*",33],["madaradex.org",33],["trigonevo.com",33],["franceprefecture.fr",33],["jazbaat.in",33],["aipebel.com",33],["audiotools.blog",33],["embdproxy.xyz",33],["labgame.io",[34,35]],["kenzo-flowertag.com",36],["mdn.lol",36],["btcbitco.in",37],["btcsatoshi.net",37],["cempakajaya.com",37],["crypto4yu.com",37],["manofadan.com",37],["readbitcoin.org",37],["wiour.com",37],["tremamnon.com",37],["bitsmagic.fun",37],["ourcoincash.xyz",37],["aylink.co",38],["sugarona.com",39],["nishankhatri.xyz",39],["cety.app",40],["exe-urls.com",40],["exego.app",40],["cutlink.net",40],["cutyurls.com",40],["cutty.app",40],["cutnet.net",40],["jixo.online",40],["tinys.click",41],["loan.creditsgoal.com",41],["rupyaworld.com",41],["vahantoday.com",41],["techawaaz.in",41],["loan.bgmi32bitapk.in",41],["formyanime.com",41],["gsm-solution.com",41],["h-donghua.com",41],["hindisubbedacademy.com",41],["hm4tech.info",41],["mydverse.*",41],["panelprograms.blogspot.com",41],["ripexbooster.xyz",41],["serial4.com",41],["tutorgaming.com",41],["everydaytechvams.com",41],["dipsnp.com",41],["cccam4sat.com",41],["diendancauduong.com",41],["zeemoontv-24.blogspot.com",41],["stitichsports.com",41],["aiimgvlog.fun",42],["appsbull.com",43],["diudemy.com",43],["maqal360.com",43],["androjungle.com",43],["bookszone.in",43],["shortix.co",43],["makefreecallsonline.com",43],["msonglyrics.com",43],["app-sorteos.com",43],["bokugents.com",43],["client.pylexnodes.net",43],["btvplus.bg",43],["listar-mc.net",43],["blog24.me",[44,45]],["coingraph.us",46],["impact24.us",46],["iconicblogger.com",47],["auto-crypto.click",47],["tpi.li",48],["oii.la",[48,72]],["shrinke.*",49],["shrinkme.*",49],["smutty.com",49],["e-sushi.fr",49],["gayforfans.com",49],["freeadultcomix.com",49],["down.dataaps.com",49],["filmweb.pl",[49,182]],["livecamrips.*",49],["safetxt.net",49],["filespayouts.com",49],["atglinks.com",50],["kbconlinegame.com",51],["hamrojaagir.com",51],["odijob.com",51],["stfly.biz",52],["airevue.net",52],["atravan.net",52],["simana.online",53],["fooak.com",53],["joktop.com",53],["evernia.site",53],["falpus.com",53],["rfiql.com",54],["gujjukhabar.in",54],["smartfeecalculator.com",54],["djxmaza.in",54],["thecubexguide.com",54],["jytechs.in",54],["financacerta.com",55],["encurtads.net",55],["mastkhabre.com",56],["weshare.is",57],["vi-music.app",58],["instanders.app",58],["rokni.xyz",58],["keedabankingnews.com",58],["pig69.com",58],["cosplay18.pics",[58,258]],["3dsfree.org",59],["up4load.com",60],["alpin.de",61],["boersennews.de",61],["chefkoch.de",61],["chip.de",61],["clever-tanken.de",61],["desired.de",61],["donnerwetter.de",61],["fanfiktion.de",61],["focus.de",61],["formel1.de",61],["frustfrei-lernen.de",61],["gewinnspiele.tv",61],["giga.de",61],["gut-erklaert.de",61],["kino.de",61],["messen.de",61],["nickles.de",61],["nordbayern.de",61],["spielfilm.de",61],["teltarif.de",[61,62]],["unsere-helden.com",61],["weltfussball.at",61],["watson.de",61],["mactechnews.de",61],["sport1.de",61],["welt.de",61],["sport.de",61],["allthingsvegas.com",63],["100percentfedup.com",63],["beforeitsnews.com",63],["concomber.com",63],["conservativefiringline.com",63],["dailylol.com",63],["funnyand.com",63],["letocard.fr",63],["mamieastuce.com",63],["meilleurpronostic.fr",63],["patriotnationpress.com",63],["toptenz.net",63],["vitamiiin.com",63],["writerscafe.org",63],["populist.press",63],["dailytruthreport.com",63],["livinggospeldaily.com",63],["first-names-meanings.com",63],["welovetrump.com",63],["thehayride.com",63],["thelibertydaily.com",63],["thepoke.co.uk",63],["thepolitistick.com",63],["theblacksphere.net",63],["shark-tank.com",63],["naturalblaze.com",63],["greatamericanrepublic.com",63],["dailysurge.com",63],["truthlion.com",63],["flagandcross.com",63],["westword.com",63],["republicbrief.com",63],["freedomfirstnetwork.com",63],["phoenixnewtimes.com",63],["designbump.com",63],["clashdaily.com",63],["madworldnews.com",63],["reviveusa.com",63],["sonsoflibertymedia.com",63],["thedesigninspiration.com",63],["videogamesblogger.com",63],["protrumpnews.com",63],["thepalmierireport.com",63],["kresy.pl",63],["thepatriotjournal.com",63],["thegatewaypundit.com",63],["wltreport.com",63],["miaminewtimes.com",63],["politicalsignal.com",63],["rightwingnews.com",63],["bigleaguepolitics.com",63],["comicallyincorrect.com",63],["upornia.com",64],["pillowcase.su",65],["akaihentai.com",66],["cine-calidad.*",66],["fastpic.org",[66,73]],["forums.socialmediagirls.com",[66,73]],["monoschino2.com",66],["veryfreeporn.com",66],["pornoenspanish.es",66],["theporngod.com",66],["madouqu.com",67],["tucinehd.com",67],["besthdgayporn.com",68],["drivenime.com",68],["erothots1.com",68],["javup.org",68],["shemaleup.net",68],["transflix.net",68],["worthcrete.com",68],["hentaihere.com",69],["player.smashy.stream",69],["player.smashystream.com",69],["123movies.*",70],["123moviesla.*",70],["123movieweb.*",70],["2embed.*",70],["9xmovies.*",70],["adsh.cc",70],["adshort.*",70],["afilmyhouse.blogspot.com",70],["ak.sv",70],["allmovieshub.*",70],["api.webs.moe",70],["apkmody.io",70],["asianplay.*",70],["atishmkv.*",70],["backfirstwo.site",70],["bflix.*",70],["crazyblog.in",70],["cricstream.*",70],["crictime.*",70],["cuervotv.me",70],["divicast.com",70],["dood.*",[70,188]],["dooood.*",[70,188]],["embed.meomeo.pw",70],["extramovies.*",70],["faselhd.*",70],["faselhds.*",70],["filemoon.*",70],["filmeserialeonline.org",70],["filmy.*",70],["filmyhit.*",70],["filmywap.*",70],["flexyhit.com",70],["fmovies.*",70],["foreverwallpapers.com",70],["french-streams.cc",70],["gdplayer.*",70],["goku.*",70],["gomovies.*",70],["gowatchseries.*",70],["hdfungamezz.*",70],["hdtoday.to",70],["hinatasoul.com",70],["hindilinks4u.*",70],["hurawatch.*",[70,216]],["igg-games.com",70],["infinityscans.net",70],["jalshamoviezhd.*",70],["livecricket.*",70],["mangareader.to",70],["mhdsport.*",70],["mkvcinemas.*",70],["movies2watch.*",70],["moviespapa.*",70],["mp3juice.info",70],["mp4moviez.*",70],["mydownloadtube.*",70],["myflixerz.to",70],["nowmetv.net",70],["nowsportstv.com",70],["nuroflix.*",70],["nxbrew.com",70],["o2tvseries.*",70],["o2tvseriesz.*",70],["oii.io",70],["paidshitforfree.com",70],["pepperlive.info",70],["pirlotv.*",70],["playertv.net",70],["poscitech.*",70],["primewire.*",70],["redecanais.*",70],["roystream.com",70],["rssing.com",70],["s.to",70],["serienstream.*",70],["sflix.*",70],["shahed4u.*",70],["shaheed4u.*",70],["share.filesh.site",70],["sharkfish.xyz",70],["skidrowcodex.net",70],["smartermuver.com",70],["speedostream.*",70],["sportcast.*",70],["sportskart.*",70],["stream4free.live",70],["streamingcommunity.*",[70,72,110]],["tamilarasan.*",70],["tamilfreemp3songs.*",70],["tamilmobilemovies.in",70],["tamilprinthd.*",70],["tapeadsenjoyer.com",[70,90]],["thewatchseries.live",70],["tnmusic.in",70],["torrentdosfilmes.*",70],["travelplanspro.com",70],["tubemate.*",70],["tusfiles.com",70],["tutlehd4.com",70],["twstalker.com",70],["uploadrar.*",70],["uqload.*",70],["vid-guard.com",70],["vidcloud9.*",70],["vido.*",70],["vidoo.*",70],["vidsaver.net",70],["vidspeeds.com",70],["viralitytoday.com",70],["voiranime.stream",70],["vudeo.*",70],["vumoo.*",70],["watchdoctorwhoonline.com",70],["watchomovies.*",[70,107]],["watchserie.online",70],["woxikon.in",70],["www-y2mate.com",70],["yesmovies.*",70],["ylink.bid",70],["xn-----0b4asja7ccgu2b4b0gd0edbjm2jpa1b1e9zva7a0347s4da2797e8qri.xn--1ck2e1b",70],["kickassanime.*",71],["11xmovies.*",72],["cinego.tv",72],["dokoembed.pw",72],["ev01.to",72],["fojik.*",72],["fstream365.com",72],["fzmovies.*",72],["linkz.*",72],["minoplres.xyz",72],["mostream.us",72],["moviedokan.*",72],["myflixer.*",72],["prmovies.*",72],["readcomiconline.li",72],["s3embtaku.pro",72],["sflix2.to",72],["sportshub.stream",72],["streamblasters.*",72],["topcinema.cam",72],["webxzplay.cfd",72],["zonatmo.com",72],["animesaturn.cx",72],["filecrypt.*",72],["hunterscomics.com",72],["aniwave.uk",72],["dojing.net",73],["javsubindo.com",73],["krx18.com",73],["loadx.ws",73],["mangaforfree.com",73],["pornx.to",73],["savefiles.*",[73,249]],["streampoi.com",73],["strmup.to",[73,143]],["up4stream.com",[73,107]],["ups2up.fun",[73,107]],["videq.stream",73],["xmegadrive.com",73],["rahim-soft.com",73],["x-video.tube",73],["rubystm.com",73],["rubyvid.com",73],["rubyvidhub.com",73],["stmruby.com",73],["streamruby.com",73],["poophd.cc",73],["windowsreport.com",73],["fuckflix.click",73],["bi-girl.net",74],["ftuapps.*",74],["hentaiseason.com",74],["hoodtrendspredict.com",74],["marcialhub.xyz",74],["odiadance.com",74],["osteusfilmestuga.online",74],["ragnarokscanlation.opchapters.com",74],["sampledrive.org",74],["showflix.*",74],["swordalada.org",74],["tvappapk.com",74],["twobluescans.com",[74,75]],["varnascan.xyz",74],["bibliopanda.visblog.online",76],["hallofseries.com",76],["luciferdonghua.in",76],["truyentranhfull.net",76],["fcportables.com",76],["repack-games.com",76],["ibooks.to",76],["blog.tangwudi.com",76],["filecatchers.com",76],["babaktv.com",76],["samchui.com",77],["sandrarose.com",77],["sherdog.com",77],["sidereel.com",77],["silive.com",77],["simpleflying.com",77],["sloughexpress.co.uk",77],["spacenews.com",77],["sportsgamblingpodcast.com",77],["spotofteadesigns.com",77],["stacysrandomthoughts.com",77],["ssnewstelegram.com",77],["superherohype.com",[77,80]],["tablelifeblog.com",77],["thebeautysection.com",77],["thecelticblog.com",77],["thecurvyfashionista.com",77],["thefashionspot.com",77],["thegamescabin.com",77],["thenerdyme.com",77],["thenonconsumeradvocate.com",77],["theprudentgarden.com",77],["thethings.com",77],["timesnews.net",77],["topspeed.com",77],["toyotaklub.org.pl",77],["travelingformiles.com",77],["tutsnode.org",77],["viralviralvideos.com",77],["wannacomewith.com",77],["wimp.com",[77,80]],["windsorexpress.co.uk",77],["woojr.com",77],["worldoftravelswithkids.com",77],["worldsurfleague.com",77],["cheatsheet.com",78],["pwinsider.com",78],["c-span.org",79],["15min.lt",80],["247sports.com",80],["abc17news.com",80],["agrodigital.com",80],["al.com",80],["aliontherunblog.com",80],["allaboutthetea.com",80],["allmovie.com",80],["allmusic.com",80],["allthingsthrifty.com",80],["amessagewithabottle.com",80],["artforum.com",80],["artnews.com",80],["awkward.com",80],["barcablaugranes.com",80],["barnsleychronicle.com",80],["bethcakes.com",80],["betweenenglandandiowa.com",80],["bgr.com",80],["blazersedge.com",80],["blogher.com",80],["blu-ray.com",80],["bluegraygal.com",80],["briefeguru.de",80],["brobible.com",80],["cagesideseats.com",80],["cbsnews.com",80],["cbssports.com",[80,254]],["celiacandthebeast.com",80],["chaptercheats.com",80],["cleveland.com",80],["clickondetroit.com",80],["commercialcompetentedigitale.ro",80],["dailydot.com",80],["dailykos.com",80],["dailyvoice.com",80],["danslescoulisses.com",80],["decider.com",80],["didyouknowfacts.com",80],["dogtime.com",80],["dpreview.com",80],["ebaumsworld.com",80],["eldiariony.com",80],["fark.com",80],["femestella.com",80],["fmradiofree.com",80],["free-power-point-templates.com",80],["freeconvert.com",80],["frogsandsnailsandpuppydogtail.com",80],["funtasticlife.com",80],["fwmadebycarli.com",80],["golfdigest.com",80],["gulflive.com",80],["hollywoodreporter.com",80],["homeglowdesign.com",80],["honeygirlsworld.com",80],["ibtimes.co.in",80],["imgur.com",80],["indiewire.com",80],["intouchweekly.com",80],["jasminemaria.com",80],["kens5.com",80],["kion546.com",80],["knowyourmeme.com",80],["last.fm",80],["lehighvalleylive.com",80],["lettyskitchen.com",80],["lifeandstylemag.com",80],["lifeinleggings.com",80],["lizzieinlace.com",80],["localnews8.com",80],["lonestarlive.com",80],["madeeveryday.com",80],["maidenhead-advertiser.co.uk",80],["mandatory.com",80],["mardomreport.net",80],["masslive.com",80],["melangery.com",80],["miamiherald.com",80],["mmamania.com",80],["momtastic.com",80],["mostlymorgan.com",80],["motherwellmag.com",80],["musicfeeds.com.au",80],["naszemiasto.pl",80],["nationalpost.com",80],["nationalreview.com",80],["nbcsports.com",80],["news.com.au",80],["ninersnation.com",80],["nj.com",80],["nordot.app",80],["nothingbutnewcastle.com",80],["nsjonline.com",80],["nypost.com",80],["observer.com",80],["oregonlive.com",80],["pagesix.com",80],["patheos.com",80],["pennlive.com",80],["pep.ph",[80,85]],["playstationlifestyle.net",80],["puckermom.com",80],["reelmama.com",80],["robbreport.com",80],["rollingstone.com",80],["royalmailchat.co.uk",80],["sbnation.com",80],["sheknows.com",80],["sneakernews.com",80],["sourcingjournal.com",80],["sport-fm.gr",80],["stylecaster.com",80],["syracuse.com",80],["tastingtable.com",80],["thedailymeal.com",80],["theflowspace.com",80],["themarysue.com",80],["tokfm.pl",80],["torontosun.com",80],["tvline.com",80],["usmagazine.com",80],["wallup.net",80],["weather.com",80],["worldstar.com",80],["worldstarhiphop.com",80],["wwd.com",80],["wzzm13.com",80],["yourcountdown.to",80],["automobile-catalog.com",[81,82,83]],["baseballchannel.jp",[81,82]],["forum.mobilism.me",81],["gentosha-go.com",81],["hang.hu",81],["hoyme.jp",81],["motorbikecatalog.com",[81,82,83]],["pons.com",81],["wisevoter.com",81],["topstarnews.net",81],["islamicfinder.org",81],["secure-signup.net",81],["dramabeans.com",81],["dropgame.jp",[81,82]],["manta.com",81],["tportal.hr",81],["tvtropes.org",81],["convertcase.net",81],["uranai.nosv.org",82],["yakkun.com",82],["24sata.hr",82],["373news.com",82],["alc.co.jp",82],["allthetests.com",82],["animanch.com",82],["aniroleplay.com",82],["apkmirror.com",[82,186]],["areaconnect.com",82],["as-web.jp",82],["aucfree.com",82],["autoby.jp",82],["autoc-one.jp",82],["autofrage.net",82],["bab.la",82],["babla.*",82],["bien.hu",82],["boredpanda.com",82],["carscoops.com",82],["cesoirtv.com",82],["chanto.jp.net",82],["cinetrafic.fr",82],["cocokara-next.com",82],["collinsdictionary.com",82],["computerfrage.net",82],["crosswordsolver.com",82],["cruciverba.it",82],["cults3d.com",82],["daily.co.jp",82],["dailynewshungary.com",82],["dayspedia.com",82],["dictionary.cambridge.org",82],["dictionnaire.lerobert.com",82],["dnevno.hr",82],["dreamchance.net",82],["drweil.com",82],["dziennik.pl",82],["eigachannel.jp",82],["ev-times.com",82],["finanzfrage.net",82],["footballchannel.jp",82],["forsal.pl",82],["freemcserver.net",82],["fxstreet-id.com",82],["fxstreet-vn.com",82],["fxstreet.*",82],["game8.jp",82],["gardeningsoul.com",82],["gazetaprawna.pl",82],["gesundheitsfrage.net",82],["gifu-np.co.jp",82],["gigafile.nu",82],["globalrph.com",82],["golf-live.at",82],["grapee.jp",82],["gutefrage.net",82],["hb-nippon.com",82],["heureka.cz",82],["horairesdouverture24.fr",82],["hotcopper.co.nz",82],["hotcopper.com.au",82],["idokep.hu",82],["indiatimes.com",82],["infor.pl",82],["iza.ne.jp",82],["j-cast.com",82],["j-town.net",82],["j7p.jp",82],["jablickar.cz",82],["javatpoint.com",82],["jikayosha.jp",82],["judgehype.com",82],["kinmaweb.jp",82],["km77.com",82],["kobe-journal.com",82],["kreuzwortraetsel.de",82],["kurashinista.jp",82],["kurashiru.com",82],["kyoteibiyori.com",82],["lacuarta.com",82],["lakeshowlife.com",82],["laleggepertutti.it",82],["langenscheidt.com",82],["laposte.net",82],["lawyersgunsmoneyblog.com",82],["ldoceonline.com",82],["listentotaxman.com",82],["livenewschat.eu",82],["luremaga.jp",82],["mahjongchest.com",82],["mainichi.jp",82],["maketecheasier.com",[82,83]],["malaymail.com",82],["mamastar.jp",82],["mathplayzone.com",82],["meteo60.fr",82],["midhudsonnews.com",82],["minesweeperquest.com",82],["minkou.jp",82],["modhub.us",82],["moin.de",82],["motorradfrage.net",82],["motscroises.fr",82],["muragon.com",82],["nana-press.com",82],["natalie.mu",82],["nationaltoday.com",82],["nbadraft.net",82],["news.zerkalo.io",82],["newsinlevels.com",82],["newsweekjapan.jp",82],["niketalk.com",82],["nikkan-gendai.com",82],["nouvelobs.com",82],["nyitvatartas24.hu",82],["oeffnungszeitenbuch.de",82],["onlineradiobox.com",82],["operawire.com",82],["optionsprofitcalculator.com",82],["oraridiapertura24.it",82],["oxfordlearnersdictionaries.com",82],["palabr.as",82],["pashplus.jp",82],["persoenlich.com",82],["petitfute.com",82],["play-games.com",82],["powerpyx.com",82],["pptvhd36.com",82],["profitline.hu",82],["puzzlegarage.com",82],["quefaire.be",82],["radio-australia.org",82],["radio-osterreich.at",82],["raetsel-hilfe.de",82],["ranking.net",82],["references.be",82],["reisefrage.net",82],["relevantmagazine.com",82],["reptilesmagazine.com",82],["roleplayer.me",82],["rostercon.com",82],["samsungmagazine.eu",82],["sankei.com",82],["sanspo.com",82],["scribens.com",82],["scribens.fr",82],["slashdot.org",82],["soccerdigestweb.com",82],["solitairehut.com",82],["sourceforge.net",[82,86]],["southhemitv.com",82],["sportalkorea.com",82],["sportlerfrage.net",82],["syosetu.com",82],["szamoldki.hu",82],["talkwithstranger.com",82],["the-crossword-solver.com",82],["thedigestweb.com",82],["traicy.com",82],["transparentcalifornia.com",82],["transparentnevada.com",82],["trilltrill.jp",82],["tunebat.com",82],["tvtv.ca",82],["tvtv.us",82],["tweaktown.com",82],["twn.hu",82],["tyda.se",82],["ufret.jp",82],["uptodown.com",82],["verkaufsoffener-sonntag.com",82],["vimm.net",82],["wamgame.jp",82],["watchdocumentaries.com",82],["webdesignledger.com",82],["wetteronline.de",82],["wfmz.com",82],["winfuture.de",82],["word-grabber.com",82],["worldjournal.com",82],["wort-suchen.de",82],["woxikon.*",82],["young-machine.com",82],["yugioh-starlight.com",82],["yutura.net",82],["zagreb.info",82],["zakzak.co.jp",82],["2chblog.jp",82],["2monkeys.jp",82],["46matome.net",82],["akb48glabo.com",82],["akb48matomemory.com",82],["alfalfalfa.com",82],["all-nationz.com",82],["anihatsu.com",82],["aqua2ch.net",82],["blog.esuteru.com",82],["blog.livedoor.jp",82],["blog.jp",82],["blogo.jp",82],["chaos2ch.com",82],["choco0202.work",82],["crx7601.com",82],["danseisama.com",82],["dareda.net",82],["digital-thread.com",82],["doorblog.jp",82],["exawarosu.net",82],["fgochaldeas.com",82],["football-2ch.com",82],["gekiyaku.com",82],["golog.jp",82],["hacchaka.net",82],["heartlife-matome.com",82],["liblo.jp",82],["fesoku.net",82],["fiveslot777.com",82],["gamejksokuhou.com",82],["girlsreport.net",82],["girlsvip-matome.com",82],["grasoku.com",82],["gundamlog.com",82],["honyaku-channel.net",82],["ikarishintou.com",82],["imas-cg.net",82],["imihu.net",82],["inutomo11.com",82],["itainews.com",82],["itaishinja.com",82],["jin115.com",82],["jisaka.com",82],["jnews1.com",82],["jumpsokuhou.com",82],["jyoseisama.com",82],["keyakizaka46matomemory.net",82],["kidan-m.com",82],["kijoden.com",82],["kijolariat.net",82],["kijolifehack.com",82],["kijomatomelog.com",82],["kijyokatu.com",82],["kijyomatome.com",82],["kijyomatome-ch.com",82],["kijyomita.com",82],["kirarafan.com",82],["kitimama-matome.net",82],["kitizawa.com",82],["konoyubitomare.jp",82],["kotaro269.com",82],["kyousoku.net",82],["ldblog.jp",82],["livedoor.biz",82],["livedoor.blog",82],["majikichi.com",82],["matacoco.com",82],["matomeblade.com",82],["matomelotte.com",82],["matometemitatta.com",82],["mojomojo-licarca.com",82],["morikinoko.com",82],["nandemo-uketori.com",82],["netatama.net",82],["news-buzz1.com",82],["news30over.com",82],["nishinippon.co.jp",82],["nmb48-mtm.com",82],["norisoku.com",82],["npb-news.com",82],["ocsoku.com",82],["okusama-kijyo.com",82],["onecall2ch.com",82],["onihimechan.com",82],["orusoku.com",82],["otakomu.jp",82],["otoko-honne.com",82],["oumaga-times.com",82],["outdoormatome.com",82],["pachinkopachisro.com",82],["paranormal-ch.com",82],["recosoku.com",82],["s2-log.com",82],["saikyo-jump.com",82],["shuraba-matome.com",82],["ske48matome.net",82],["squallchannel.com",82],["sukattojapan.com",82],["sumaburayasan.com",82],["sutekinakijo.com",82],["usi32.com",82],["uwakich.com",82],["uwakitaiken.com",82],["vault76.info",82],["vipnews.jp",82],["vippers.jp",82],["vipsister23.com",82],["vtubernews.jp",82],["watarukiti.com",82],["world-fusigi.net",82],["zakuzaku911.com",82],["zch-vip.com",82],["interfootball.co.kr",83],["a-ha.io",83],["cboard.net",83],["jjang0u.com",83],["joongdo.co.kr",83],["viva100.com",83],["gamingdeputy.com",83],["alle-tests.nl",83],["tweaksforgeeks.com",83],["m.inven.co.kr",83],["mlbpark.donga.com",83],["meconomynews.com",83],["brandbrief.co.kr",83],["motorgraph.com",83],["bleepingcomputer.com",84],["pravda.com.ua",84],["ap7am.com",85],["cinema.com.my",85],["dolldivine.com",85],["giornalone.it",85],["iplocation.net",85],["jamaicajawapos.com",85],["jutarnji.hr",85],["kompasiana.com",85],["mediaindonesia.com",85],["niice-woker.com",85],["slobodnadalmacija.hr",85],["upmedia.mg",85],["mentalfloss.com",87],["hentaivost.fr",88],["isgfrm.com",89],["advertisertape.com",90],["tapeadvertisement.com",90],["tapelovesads.org",90],["watchadsontape.com",90],["vosfemmes.com",91],["voyeurfrance.net",91],["hyundaitucson.info",92],["exambd.net",93],["cgtips.org",94],["freewebcart.com",95],["freemagazines.top",95],["siamblockchain.com",95],["emuenzen.de",96],["kickass.*",97],["unblocked.id",99],["listendata.com",100],["7xm.xyz",100],["fastupload.io",100],["azmath.info",100],["wouterplanet.com",101],["xenvn.com",102],["pfps.gg",103],["4kporn.xxx",104],["androidacy.com",105],["4porn4.com",106],["bestpornflix.com",107],["freeroms.com",107],["andhrafriends.com",107],["723qrh1p.fun",107],["98zero.com",108],["mediaset.es",108],["updatewallah.in",108],["hwbusters.com",108],["beatsnoop.com",109],["fetchpik.com",109],["hackerranksolution.in",109],["camsrip.com",109],["file.org",109],["btcbunch.com",111],["teachoo.com",[112,113]],["mafiatown.pl",114],["bitcotasks.com",115],["hilites.today",116],["udvl.com",117],["www.chip.de",[118,119,120,121]],["topsporter.net",122],["sportshub.to",122],["myanimelist.net",123],["unofficialtwrp.com",124],["codec.kyiv.ua",124],["kimcilonlyofc.com",124],["bitcosite.com",125],["bitzite.com",125],["teluguflix.*",126],["hacoos.com",127],["watchhentai.net",128],["hes-goals.io",128],["pkbiosfix.com",128],["casi3.xyz",128],["zefoy.com",129],["mailgen.biz",130],["tempinbox.xyz",130],["vidello.net",131],["newscon.org",132],["yunjiema.top",132],["pcgeeks-games.com",132],["resizer.myct.jp",133],["gametohkenranbu.sakuraweb.com",134],["jisakuhibi.jp",135],["rank1-media.com",135],["lifematome.blog",136],["fm.sekkaku.net",137],["dvdrev.com",138],["betweenjpandkr.blog",139],["nft-media.net",140],["ghacks.net",141],["leak.sx",142],["paste.bin.sx",142],["pornleaks.in",142],["aliezstream.pro",143],["daddy-stream.xyz",143],["daddylive1.*",143],["esportivos.*",143],["instream.pro",143],["mylivestream.pro",143],["poscitechs.*",143],["powerover.online",143],["sportea.link",143],["sportsurge.stream",143],["ufckhabib.com",143],["ustream.pro",143],["animeshqip.site",143],["apkship.shop",143],["buzter.pro",143],["enjoysports.bond",143],["filedot.to",143],["foreverquote.xyz",143],["hdstream.one",143],["kingstreamz.site",143],["live.fastsports.store",143],["livesnow.me",143],["livesports4u.pw",143],["masterpro.click",143],["nuxhallas.click",143],["papahd.info",143],["rgshows.me",143],["sportmargin.live",143],["sportmargin.online",143],["sportsloverz.xyz",143],["supertipzz.online",143],["totalfhdsport.xyz",143],["ultrastreamlinks.xyz",143],["usgate.xyz",143],["webmaal.cfd",143],["wizistreamz.xyz",143],["educ4m.com",143],["fromwatch.com",143],["visualnewshub.com",143],["khoaiphim.com",145],["haafedk2.com",146],["jovemnerd.com.br",147],["totalcsgo.com",148],["manysex.com",149],["gaminginfos.com",150],["tinxahoivn.com",151],["m.4khd.com",152],["westmanga.*",152],["automoto.it",153],["fordownloader.com",154],["codelivly.com",155],["tchatche.com",156],["cryptoearns.com",156],["lordchannel.com",157],["novelhall.com",158],["bagi.co.in",159],["keran.co",159],["biblestudytools.com",160],["christianheadlines.com",160],["ibelieve.com",160],["kuponigo.com",161],["inxxx.com",162],["bemyhole.com",162],["embedwish.com",163],["leakslove.net",163],["jenismac.com",164],["vxetable.cn",165],["nizarstream.com",166],["donghuaworld.com",167],["letsdopuzzles.com",168],["rediff.com",169],["igay69.com",170],["dzapk.com",171],["darknessporn.com",172],["familyporner.com",172],["freepublicporn.com",172],["pisshamster.com",172],["punishworld.com",172],["xanimu.com",172],["tainio-mania.online",173],["eroticmoviesonline.me",174],["series9movies.com",174],["teleclub.xyz",175],["ecamrips.com",176],["showcamrips.com",176],["9animetv.to",177],["qiwi.gg",178],["jornadaperfecta.com",179],["loseart.com",180],["sousou-no-frieren.com",181],["unite-guide.com",183],["thebullspen.com",184],["receitasdaora.online",185],["hiraethtranslation.com",187],["all3do.com",188],["d0000d.com",188],["d000d.com",188],["d0o0d.com",188],["do0od.com",188],["do7go.com",188],["doods.*",188],["doodstream.*",188],["dooodster.com",188],["doply.net",188],["ds2play.com",188],["ds2video.com",188],["vidply.com",188],["vide0.net",188],["xfreehd.com",189],["freethesaurus.com",190],["thefreedictionary.com",190],["dexterclearance.com",191],["x86.co.kr",192],["onlyfaucet.com",193],["x-x-x.tube",194],["fdownloader.net",195],["thehackernews.com",196],["mielec.pl",197],["treasl.com",198],["mrbenne.com",199],["cnpics.org",[200,258]],["ovabee.com",200],["porn4f.com",200],["cnxx.me",[200,258]],["ai18.pics",[200,258]],["sportsonline.si",201],["fiuxy2.co",202],["animeunity.to",203],["tokopedia.com",204],["remixsearch.net",205],["remixsearch.es",205],["onlineweb.tools",205],["sharing.wtf",205],["2024tv.ru",206],["modrinth.com",207],["curseforge.com",207],["xnxxcom.xyz",208],["sportsurge.net",209],["joyousplay.xyz",209],["quest4play.xyz",[209,211]],["generalpill.net",209],["moneycontrol.com",210],["cookiewebplay.xyz",211],["ilovetoplay.xyz",211],["streamcaster.live",211],["weblivehdplay.ru",211],["nontongo.win",212],["m9.news",213],["callofwar.com",214],["secondhandsongs.com",215],["nohost.one",216],["vidbinge.com",216],["send.cm",217],["send.now",217],["3rooodnews.net",218],["xxxbfvideo.net",219],["filmy4wap.co.in",220],["filmy4waps.org",220],["gameshop4u.com",221],["regenzi.site",221],["historicaerials.com",222],["handirect.fr",223],["animefenix.tv",224],["fsiblog3.club",225],["kamababa.desi",225],["sat-sharing.com",225],["getfiles.co.uk",226],["genelify.com",227],["dhtpre.com",228],["xbaaz.com",229],["lineupexperts.com",231],["fearmp4.ru",232],["buffsports.*",233],["fbstreams.*",233],["wavewalt.me",233],["m.shuhaige.net",234],["streamingnow.mov",235],["thesciencetoday.com",236],["sportnews.to",236],["ghbrisk.com",238],["iplayerhls.com",238],["bacasitus.com",239],["katoikos.world",239],["abstream.to",240],["pawastreams.pro",241],["rebajagratis.com",242],["tv.latinlucha.es",242],["fetcheveryone.com",243],["reviewdiv.com",244],["laurelberninteriors.com",245],["godlike.com",246],["godlikeproductions.com",246],["bestsportslive.org",247],["bestreamsports.org",248],["streamhls.to",250],["xmalay1.net",251],["letemsvetemapplem.eu",252],["pc-builds.com",253],["watch-dbz57.funonline.co.in",255],["live4all.net",256],["pokemon-project.com",257],["3minx.com",258],["555fap.com",258],["blackwidof.org",258],["fc2ppv.stream",258],["hentai4f.com",258],["hentaipig.com",258],["javball.com",258],["javbee.vip",258],["javring.com",258],["javsunday.com",258],["kin8-av.com",258],["porn4f.org",258],["sweetie-fox.com",258],["xcamcovid.com",258],["moviesonlinefree.*",259],["fileszero.com",260],["viralharami.com",260],["wstream.cloud",260],["bmamag.com",261],["bmacanberra.wpcomstaging.com",261],["cinemastervip.com",262],["mmsbee42.com",263],["mmsmasala.com",263],["andrenalynrushplay.cfd",264],["fnjplay.xyz",264],["cefirates.com",265],["comicleaks.com",265],["tapmyback.com",265],["ping.gg",265],["nookgaming.com",265],["creatordrop.com",265],["bitdomain.biz",265],["fort-shop.kiev.ua",265],["accuretawealth.com",265],["resourceya.com",265],["tracktheta.com",265],["adaptive.marketing",265],["camberlion.com",265],["trybawaryjny.pl",265],["segops.madisonspecs.com",265],["stresshelden-coaching.de",265],["controlconceptsusa.com",265],["ryaktive.com",265],["tip.etip-staging.etip.io",265],["future-fortune.com",266],["furucombo.app",266],["bolighub.dk",266],["intercity.technology",267],["freelancer.taxmachine.be",267],["adria.gg",267],["fjlaboratories.com",267],["abhijith.page",267],["helpmonks.com",267],["dataunlocker.com",268],["proboards.com",269],["winclassic.net",269],["farmersjournal.ie",270]]);
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
