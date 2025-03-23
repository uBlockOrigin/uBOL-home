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
(function uBOL_addEventListenerDefuser() {

/******************************************************************************/

function addEventListenerDefuser(
    type = '',
    pattern = ''
) {
    const safe = safeSelf();
    const extraArgs = safe.getExtraArgs(Array.from(arguments), 2);
    const logPrefix = safe.makeLogPrefix('prevent-addEventListener', type, pattern);
    const reType = safe.patternToRegex(type, undefined, true);
    const rePattern = safe.patternToRegex(pattern);
    const debug = shouldDebug(extraArgs);
    const targetSelector = extraArgs.elements || undefined;
    const elementMatches = elem => {
        if ( targetSelector === 'window' ) { return elem === window; }
        if ( targetSelector === 'document' ) { return elem === document; }
        if ( elem && elem.matches && elem.matches(targetSelector) ) { return true; }
        const elems = Array.from(document.querySelectorAll(targetSelector));
        return elems.includes(elem);
    };
    const elementDetails = elem => {
        if ( elem instanceof Window ) { return 'window'; }
        if ( elem instanceof Document ) { return 'document'; }
        if ( elem instanceof Element === false ) { return '?'; }
        const parts = [];
        // https://github.com/uBlockOrigin/uAssets/discussions/17907#discussioncomment-9871079
        const id = String(elem.id);
        if ( id !== '' ) { parts.push(`#${CSS.escape(id)}`); }
        for ( let i = 0; i < elem.classList.length; i++ ) {
            parts.push(`.${CSS.escape(elem.classList.item(i))}`);
        }
        for ( let i = 0; i < elem.attributes.length; i++ ) {
            const attr = elem.attributes.item(i);
            if ( attr.name === 'id' ) { continue; }
            if ( attr.name === 'class' ) { continue; }
            parts.push(`[${CSS.escape(attr.name)}="${attr.value}"]`);
        }
        return parts.join('');
    };
    const shouldPrevent = (thisArg, type, handler) => {
        const matchesType = safe.RegExp_test.call(reType, type);
        const matchesHandler = safe.RegExp_test.call(rePattern, handler);
        const matchesEither = matchesType || matchesHandler;
        const matchesBoth = matchesType && matchesHandler;
        if ( debug === 1 && matchesBoth || debug === 2 && matchesEither ) {
            debugger; // eslint-disable-line no-debugger
        }
        if ( matchesBoth && targetSelector !== undefined ) {
            if ( elementMatches(thisArg) === false ) { return false; }
        }
        return matchesBoth;
    };
    const proxyFn = function(context) {
        const { callArgs, thisArg } = context;
        let t, h;
        try {
            t = String(callArgs[0]);
            if ( typeof callArgs[1] === 'function' ) {
                h = String(safe.Function_toString(callArgs[1]));
            } else if ( typeof callArgs[1] === 'object' && callArgs[1] !== null ) {
                if ( typeof callArgs[1].handleEvent === 'function' ) {
                    h = String(safe.Function_toString(callArgs[1].handleEvent));
                }
            } else {
                h = String(callArgs[1]);
            }
        } catch {
        }
        if ( type === '' && pattern === '' ) {
            safe.uboLog(logPrefix, `Called: ${t}\n${h}\n${elementDetails(thisArg)}`);
        } else if ( shouldPrevent(thisArg, t, h) ) {
            return safe.uboLog(logPrefix, `Prevented: ${t}\n${h}\n${elementDetails(thisArg)}`);
        }
        return context.reflect();
    };
    runAt(( ) => {
        proxyApplyFn('EventTarget.prototype.addEventListener', proxyFn);
        proxyApplyFn('document.addEventListener', proxyFn);
    }, extraArgs.runAt);
}

function proxyApplyFn(
    target = '',
    handler = ''
) {
    let context = globalThis;
    let prop = target;
    for (;;) {
        const pos = prop.indexOf('.');
        if ( pos === -1 ) { break; }
        context = context[prop.slice(0, pos)];
        if ( context instanceof Object === false ) { return; }
        prop = prop.slice(pos+1);
    }
    const fn = context[prop];
    if ( typeof fn !== 'function' ) { return; }
    if ( proxyApplyFn.CtorContext === undefined ) {
        proxyApplyFn.ctorContexts = [];
        proxyApplyFn.CtorContext = class {
            constructor(...args) {
                this.init(...args);
            }
            init(callFn, callArgs) {
                this.callFn = callFn;
                this.callArgs = callArgs;
                return this;
            }
            reflect() {
                const r = Reflect.construct(this.callFn, this.callArgs);
                this.callFn = this.callArgs = this.private = undefined;
                proxyApplyFn.ctorContexts.push(this);
                return r;
            }
            static factory(...args) {
                return proxyApplyFn.ctorContexts.length !== 0
                    ? proxyApplyFn.ctorContexts.pop().init(...args)
                    : new proxyApplyFn.CtorContext(...args);
            }
        };
        proxyApplyFn.applyContexts = [];
        proxyApplyFn.ApplyContext = class {
            constructor(...args) {
                this.init(...args);
            }
            init(callFn, thisArg, callArgs) {
                this.callFn = callFn;
                this.thisArg = thisArg;
                this.callArgs = callArgs;
                return this;
            }
            reflect() {
                const r = Reflect.apply(this.callFn, this.thisArg, this.callArgs);
                this.callFn = this.thisArg = this.callArgs = this.private = undefined;
                proxyApplyFn.applyContexts.push(this);
                return r;
            }
            static factory(...args) {
                return proxyApplyFn.applyContexts.length !== 0
                    ? proxyApplyFn.applyContexts.pop().init(...args)
                    : new proxyApplyFn.ApplyContext(...args);
            }
        };
    }
    const fnStr = fn.toString();
    const toString = (function toString() { return fnStr; }).bind(null);
    const proxyDetails = {
        apply(target, thisArg, args) {
            return handler(proxyApplyFn.ApplyContext.factory(target, thisArg, args));
        },
        get(target, prop) {
            if ( prop === 'toString' ) { return toString; }
            return Reflect.get(target, prop);
        },
    };
    if ( fn.prototype?.constructor === fn ) {
        proxyDetails.construct = function(target, args) {
            return handler(proxyApplyFn.CtorContext.factory(target, args));
        };
    }
    context[prop] = new Proxy(fn, proxyDetails);
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

function shouldDebug(details) {
    if ( details instanceof Object === false ) { return false; }
    return scriptletGlobals.canDebug && details.debug;
}

/******************************************************************************/

const scriptletGlobals = {}; // eslint-disable-line
const argsList = [["load","Object"],["load","hard_block"],["","adb"],["click","ClickHandler"],["load","IsAdblockRequest"],["/^(?:click|mousedown)$/","_0x"],["load","onload"],["","BACK"],["load","(!o)"],["load","(!i)"],["","_0x"],["","Adblock"],["/^(?:click|mousedown)$/","bypassEventsInProxies"],["","window.open"],["","open"],["click","exopop"],["/^(?:load|click)$/","popMagic"],["mousedown","popundrInit"],["getexoloader"],["","pop"],["load","creativeLoaded-"],["/^load[A-Za-z]{12,}/"],["","/exo"],["","_blank"],["mousedown","preventDefault"],["load","nextFunction"],["load","advertising"],["click","preventDefault"],["load","2000"],["/^(click|mousedown|mousemove|touchstart|touchend|touchmove)/","system.popunder"],["load","adb"],["/^(?:click|mousedown|mousemove|touchstart|touchend|touchmove)$/","system.popunder"],["","'0x"],["/DOMContentLoaded|load/","y.readyState"],["","history.go"],["/error|canplay/","(t)"],["load","hblocked"],["error","Adblocker"],["DOMContentLoaded","adlinkfly"],["DOMContentLoaded","shortener"],["mousedown","trigger"],["","0x"],["","Pop"],["/^(?:click|mousedown)$/","popunder"],["DOMContentLoaded","preventExit"],["mouseup","_blank"],["load"],["click","pop_under"],["load","url"],["load","adverts-top-container"],["","Date"],["DOMContentLoaded","&nbsp"],["click","read_cookie"],["","midRoll"],["click","_0x"],["load","isBlanketFound"],["load","showModal"],["click","trigger"],["mouseout","clientWidth"],["load","download-wrapper"],["load","autoRecov"],["popstate","noPop"],["/^(?:click|mousedown)$/","ppu"],["click","native code"],["click","_blank"],["/^(?:mousedown|mouseup)$/","0x"],["click","popundr"],["click"],["DOMContentLoaded","compupaste"],["mousedown","!!{});"],["DOMContentLoaded","/adblock/i"],["keydown"],["/^/","0x"],["load","PrivateMode"],["scroll","_0x"],["DOMContentLoaded","checkVPN"],["/^(?:click|mousedown|mouseup)$/","di()"],["","\\"],["popstate"],["click","my_inter_listen"],["load","appendChild"],["","bi()"],["","checkTarget"],["click","popunder"],["timeupdate"],["scroll","getElementById"],["load","undefined"],["DOMContentLoaded","scriptwz_url"],["load","0x"],["DOMContentLoaded","btoa"],["adblockActivated"],["click","saveLastEvent"],["DOMContentLoaded","offsetHeight"],["","show"],["/.?/","popMagic"],["","ads"],["click","interstitial"],["load","antiblock"],["DOMContentLoaded","adsBlocked"],["load",".appendChild"],["","btoa"],["","exopop"],["DOMContentLoaded","AdBlock"],["load","blocker"],["mouseleave","NativeDisplayAdID"],["mouseover","event.triggered"],["load","removeChild"],["load","htmls"],["blur","focusOut"],["click","/handleClick|popup/"],["DOMContentLoaded","history.go"],["load","bypass"],["DOMContentLoaded","antiAdBlockerHandler"],["DOMContentLoaded","location.href"],["","popMagic"],["contextmenu","preventDefault"],["visibilitychange","remainingSeconds"],["click","Popunder"],["contextmenu"],["submit","validateForm"],["blur","counter"],["load","doTest"],["DOMContentLoaded","document.documentElement.lang.toLowerCase"],["click","maxclick"],["click","window.open"],["click","shouldOpenPopUp"],["click","adForm"],["blur"],["load","/AdBlock/i"],["/^(?:click|mousedown)$/","latest!=="],["DOMContentLoaded",".ready"],["load","script"],["","/pop|wm|forceClick/"],["load","block"],["","/_0x|localStorage\\.getItem/"],["DOMContentLoaded","adblock"],["click","open"],["error"],["visibilitychange"],["load","/showModal|isBlanketFound/"],["click","shouldShow"],["","/ads|Modal/"],["DOMContentLoaded","init"],["load","Adblock"],["DOMContentLoaded","window.open"],["","vads"],["devtoolschange"],["beforeunload"],["","break;case $."],["mouseup","decodeURIComponent"],["/(?:click|touchend)/","_0x"],["","removeChild"],["click","pu_count"],["message"],["","/pop|_blank/"],["click","allclick_Public"],["DOMContentLoaded","/dyn\\.ads|loadAdsDelayed/"],["/touchstart|mousedown|click/","latest"],["blur","native code"],["blur","event.simulate"],["DOMContentLoaded","0x"],["click","overlay"],["scroll","undefined"],["readystatechange","document.removeEventListener"],["mousedown","shown_at"],["scroll","detect"],["click","t(a)"],["","focus"],["DOMContentLoaded","deblocker"],["","preventDefault"],["click","tabunder"],["mouseup","catch"],["scroll","innerHeight"],["hashchange"],["load","/nextFunction|2000/"],["load","player"],["","document.oncontextmenu"],["click","popMagic"],["","shouldShow"],["load","popMagic"],["DOMContentLoaded","adsSrc"],["np.detect"],["click","Popup"],["","/open.*_blank/"],["scroll"],["","isBlocking"],["timeupdate","","elements",".quiver-cam-player--ad-not-running.quiver-cam-player--free video"],["","$"],["DOMContentLoaded","atob"],["/click|mousedown/","catch"],["","init"],["adb"],["scroll","modal"],["click","popName"],["DOMContentLoaded","clientHeight"],["load","error-report.com"],["click","window.focus"],["click","event.dispatch"],["load","adblock"],["","Math"],["DOMContentLoaded","popupurls"],["load","XMLHttpRequest"],["load","puURLstrpcht"],["load","AdBlocker"],["","showModal"],["","goog"],["load","abDetectorPro"],["","document.body"],["","modal"],["click","pop"],["click","adobeModalTestABenabled"],["blur","console.log"],["","AdB"],["load","adSession"],["DOMContentLoaded","document.documentElement.lang"],["DOMContentLoaded","googlesyndication"],["load","popunder"],["DOMContentLoaded",".clientHeight"],["scroll","function(e)"],["DOMContentLoaded","adlinkfly_url"],["load","document.getElementById"],["DOMContentLoaded","daadb_get_data_fetch"],["click","popactive"],["DOMContentLoaded","location.replace"],["load","modal_blocker"],["click","isOpened"],["mousedown","pop.doEvent"],["error","blocker"],["click","alink"],["load","[native code]"],["/adblock/i"],["load","google-analytics"],["","sessionStorage"],["click","/form\\.submit|urlToOpen/"],["DOMContentLoaded","overlays"],["load","ads"],["click","document.createElement"],["click","ShouldShow"],["click","clickCount"],["mousedown","localStorage"],["","adsense"],["click","splashPage"],["load","detect-modal"],["DOMContentLoaded","canRedirect"],["DOMContentLoaded","adb"],["error","/\\{[a-z]\\(e\\)\\}/"],["load",".call(this"],["/touchmove|wheel/","preventDefault()"],["load","showcfkModal"],["click","attached","elements","div[class=\"share-embed-container\"]"],["click","fp-screen"],["DOMContentLoaded","leaderboardAd"],["DOMContentLoaded","fetch"],["click","openPopupForChapter"],["click","doThePop"],["DOMContentLoaded","blockAdBlock"],["click","openDirectLinkAd"],["load","detect"],["DOMContentLoaded","history.pushState"],["DOMContentLoaded","showPopup"],["click","PopUnder"],["load","puHref"],["click","Ads"],["mouseup","open"],["DOMContentLoaded","adBlockNotice"],["DOMContentLoaded","_0x"],["DOMContentLoaded","detect"],["click","pingUrl"],["mousedown","scoreUrl"],["click","/event_callback=function\\(\\){window\\.location=t\\.getAttribute\\(\"href\"\\)/"],["","Adb"]];
const hostnamesMap = new Map([["newser.com",0],["sport1.de",1],["timesofindia.indiatimes.com",2],["drrtyr.mx",2],["pinoyalbums.com",2],["multiplayer.it",2],["mediafire.com",[3,4]],["kissasian.*",5],["pinsystem.co.uk",5],["ancensored.com",5],["ganool.*",5],["mp3fiber.com",[5,25]],["xrivonet.info",5],["pirate.*",5],["piratebay.*",5],["pirateproxy.*",5],["proxytpb.*",5],["thepiratebay.*",5],["kingofdown.com",6],["radiotormentamx.com",6],["limetorrents.*",[6,10]],["king-pes.*",6],["quelleestladifference.fr",6],["depedlps.*",6],["otakuworldsite.blogspot.com",6],["ad-itech.blogspot.com",6],["komikcast.*",6],["unlockapk.com",6],["mobdi3ips.com",6],["socks24.org",6],["idedroidsafelink.*",6],["links-url.*",6],["interviewgig.com",6],["javaguides.net",6],["almohtarif-tech.net",6],["forum.release-apk.com",6],["devoloperxda.blogspot.com",6],["zwergenstadt.com",6],["primedeportes.es",6],["upxin.net",6],["ciudadblogger.com",6],["ke-1.com",6],["secretsdeepweb.blogspot.com",6],["bit-shares.com",6],["itdmusics.com",6],["aspdotnet-suresh.com",6],["tudo-para-android.com",6],["urdulibrarypk.blogspot.com",6],["zerotopay.com",6],["ak4eg.*",6],["akw.to",6],["mawsueaa.com",6],["hesgoal-live.io",6],["king-shoot.io",6],["9goals.live",6],["streanplay.*",7],["steanplay.*",7],["bibme.org",8],["citationmachine.net",8],["easybib.com",9],["pahe.*",10],["yts.*",10],["tube8.*",10],["topeuropix.*",10],["vermangasporno.com",10],["moviescounter.*",10],["imgtorrnt.in",10],["picbaron.com",[10,114]],["torrent9.*",10],["desiremovies.*",10],["letmejerk.com",10],["letmejerk2.com",10],["letmejerk3.com",10],["letmejerk4.com",10],["letmejerk5.com",10],["letmejerk6.com",10],["letmejerk7.com",10],["movs4u.*",10],["uwatchfree.*",10],["hydrax.*",10],["4movierulz.*",10],["projectfreetv.*",10],["arabseed.*",10],["btdb.*",[10,50]],["dlapk4all.com",10],["kropic.com",10],["kvador.com",10],["pdfindir.net",10],["brstej.com",10],["topwwnews.com",10],["xsanime.com",10],["vidlo.us",10],["put-locker.com",10],["youx.xxx",10],["world4ufree.*",10],["animeindo.asia",10],["streamsport.*",10],["rojadirectatvhd.*",10],["userload.*",10],["adclickersbot.com",10],["badtaste.it",11],["adyou.*",12],["shemalez.com",13],["tubepornclassic.com",13],["gotporn.com",14],["freepornrocks.com",14],["tvhai.org",14],["realgfporn.com",[15,16]],["fxporn69.*",15],["thisvid.com",16],["xvideos-downloader.net",16],["imgspice.com",17],["vikiporn.com",18],["tnaflix.com",18],["hentai2w.com",[18,177]],["yourlust.com",18],["hotpornfile.org",18],["watchfreexxx.net",18],["vintageporntubes.com",18],["angelgals.com",18],["babesexy.com",18],["ganstamovies.com",18],["youngleak.com",18],["porndollz.com",18],["xnxxvideo.pro",18],["xvideosxporn.com",18],["filmpornofrancais.fr",18],["pictoa.com",[18,41]],["adultasianporn.com",18],["nsfwmonster.com",18],["girlsofdesire.org",18],["gaytail.com",18],["fetish-bb.com",18],["rumporn.com",18],["soyoungteens.com",18],["zubby.com",18],["lesbian8.com",18],["gayforfans.com",18],["reifporn.de",18],["javtsunami.com",18],["18tube.sex",18],["xxxextreme.org",18],["amateurs-fuck.com",18],["sex-amateur-clips.com",18],["hentaiworld.tv",18],["dads-banging-teens.com",18],["home-xxx-videos.com",18],["mature-chicks.com",18],["hqbang.com",18],["darknessporn.com",18],["familyporner.com",18],["freepublicporn.com",18],["pisshamster.com",18],["punishworld.com",18],["xanimu.com",18],["tubator.com",18],["pornhd.com",19],["cnnamador.com",[19,29]],["cle0desktop.blogspot.com",19],["turkanime.co",19],["rexporn.*",19],["movies07.*",19],["camclips.tv",[19,42]],["blackpornhq.com",19],["xsexpics.com",19],["ulsex.net",19],["wannafreeporn.com",19],["ytube2dl.com",19],["pornocomics.*",19],["multiup.us",19],["protege-torrent.com",19],["pussyspace.com",[20,21]],["pussyspace.net",[20,21]],["empflix.com",22],["cpmlink.net",23],["bdsmstreak.com",23],["cutpaid.com",23],["pornforrelax.com",23],["fatwhitebutt.com",23],["pornomoll.*",23],["short.pe",24],["gsurl.*",24],["totaldebrid.org",25],["freecoursesonline.*",25],["neko-miku.com",25],["lordpremium.*",25],["elsfile.org",25],["venstrike.jimdofree.com",25],["todovieneok.*",25],["schrauben-normen.de",25],["avengerinator.blogspot.com",25],["novablogitalia.*",25],["link-to.net",25],["hanimesubth.com",25],["gsmturkey.net",25],["anisubindo.*",25],["adshrink.it",25],["presentation-ppt.com",25],["mangacanblog.com",25],["pekalongan-cits.blogspot.com",25],["4tymode.win",25],["linkvertise.com",25],["reifenrechner.at",25],["tire-size-calculator.info",25],["linuxsecurity.com",25],["itsguider.com",25],["cotravinh.blogspot.com",25],["itudong.com",25],["shortx.net",25],["btvsports.*",25],["lecturel.com",25],["bakai.org",25],["nar.k-ba.net",25],["eurotruck2.com.br",25],["tiroalpaloes.com",25],["stream4free.*",25],["tiroalpaloes.net",25],["flixsix.com",25],["tiroalpaloweb.xyz",25],["mimaletadepeliculas.*",26],["bs.to",27],["burningseries.*",27],["efukt.com",27],["dz4soft.*",28],["generacionretro.net",28],["nuevos-mu.ucoz.com",28],["micloudfiles.com",28],["yoututosjeff.*",28],["ebookmed.*",28],["lanjutkeun.*",28],["mimaletamusical.blogspot.com",28],["novelasesp.*",28],["visionias.net",28],["singingdalong.*",28],["b3infoarena.in",28],["lurdchinexgist.blogspot.com",28],["thefreedommatrix.blogspot.com",28],["hentai-vl.blogspot.com",28],["projetomotog.blogspot.com",28],["ktmx.pro",28],["lirik3satu.blogspot.com",28],["marketmovers.it",28],["pharmaguideline.com",28],["safemaru.blogspot.com",28],["mixloads.com",28],["mangaromance.eu",28],["interssh.com",28],["freesoftpdfdownload.blogspot.com",28],["cirokun.blogspot.com",28],["myadslink.com",28],["blackavelic.com",28],["doujindesu.*",28],["server.satunivers.tv",28],["eg-akw.com",28],["xn--mgba7fjn.cc",28],["flashingjungle.com",29],["ma-x.org",30],["lavozdegalicia.es",30],["ddwloclawek.pl",30],["ki24.info",30],["xmovies8.*",31],["xmovies08.org",32],["globaldjmix.com",33],["desiupload.*",[34,134]],["hblinks.pro",34],["hubcdn.vip",34],["hubdrive.*",34],["90fpsconfig.in",34],["katdrive.link",34],["kmhd.net",34],["bollydrive.rest",34],["360news4u.net",34],["hypershort.com",[34,126]],["bollydrive.*",[34,136]],["zazzybabes.com",35],["haaretz.co.il",36],["haaretz.com",36],["slate.com",37],["megalinks.info",38],["megapastes.com",38],["mega-mkv.com",[38,39]],["mkv-pastes.com",38],["zpaste.net",38],["zlpaste.net",38],["9xlinks.site",38],["mega-dvdrip.*",39],["peliculas-dvdrip.*",39],["zona-leros.net",39],["desbloqueador.*",40],["cine.to",[41,183]],["newpelis.*",[41,48]],["pelix.*",[41,48]],["allcalidad.*",[41,177]],["khatrimaza.*",41],["kissasia.cc",41],["camwhores.*",42],["camwhorestv.*",42],["digjav.com",42],["uproxy.*",42],["videoszoofiliahd.com",43],["xxxtubezoo.com",44],["zooredtube.com",44],["uii.io",45],["megacams.me",46],["porndoe.com",47],["acienciasgalilei.com",49],["playrust.io",50],["payskip.org",51],["short-url.link",52],["tubedupe.com",53],["mirrorace.*",54],["mcrypto.club",54],["fatgirlskinny.net",55],["polska-ie.com",55],["windowsmatters.com",55],["canaltdt.es",56],["masbrooo.com",56],["2ndrun.tv",56],["oncehelp.com",57],["curto.win",57],["smallseotools.com",58],["mixdrp.*",59],["macwelt.de",60],["pcwelt.de",60],["capital.de",60],["geo.de",60],["allmomsex.com",61],["allnewindianporn.com",61],["analxxxvideo.com",61],["animalextremesex.com",61],["anime3d.xyz",61],["animefuckmovies.com",61],["animepornfilm.com",61],["animesexbar.com",61],["animesexclip.com",61],["animexxxsex.com",61],["animexxxfilms.com",61],["anysex.club",61],["apetube.asia",61],["asianfuckmovies.com",61],["asianfucktube.com",61],["asianporn.sexy",61],["asiansex.*",61],["asiansexcilps.com",61],["beeg.fund",61],["beegvideoz.com",61],["bestasiansex.pro",61],["bravotube.asia",61],["brutalanimalsfuck.com",61],["candyteenporn.com",61],["daddyfuckmovies.com",61],["desifuckonline.com",61],["exclusiveasianporn.com",61],["exteenporn.com",61],["fantasticporn.net",61],["fantasticyoungporn.com",61],["fineasiansex.com",61],["firstasianpussy.com",61],["freeindiansextube.com",61],["freepornasians.com",61],["freerealvideo.com",61],["fuck-beeg.com",61],["fuck-xnxx.com",61],["fuckasian.pro",61],["fuckfuq.com",61],["fuckundies.com",61],["gojapaneseporn.com",61],["golderotica.com",61],["goodyoungsex.com",61],["goyoungporn.com",61],["hardxxxmoms.com",61],["hdvintagetube.com",61],["hentaiporn.me",61],["hentaisexfilms.com",61],["hentaisexuality.com",61],["hot-teens-movies.mobi",61],["hotanimepornvideos.com",61],["hotanimevideos.com",61],["hotasianpussysex.com",61],["hotjapaneseshows.com",61],["hotmaturetube.com",61],["hotmilfs.pro",61],["hotorientalporn.com",61],["hotpornyoung.com",61],["hotxxxjapanese.com",61],["hotxxxpussy.com",61],["indiafree.net",61],["indianpornvideo.online",61],["japanfuck.*",61],["japanporn.*",61],["japanpornclip.com",61],["japanesetube.video",61],["japansex.me",61],["japanesexxxporn.com",61],["japansporno.com",61],["japanxxx.asia",61],["japanxxxworld.com",61],["keezmovies.surf",61],["lingeriefuckvideo.com",61],["liveanimalporn.zooo.club",61],["madhentaitube.com",61],["megahentaitube.com",61],["megajapanesesex.com",61],["megajapantube.com",61],["milfxxxpussy.com",61],["momsextube.pro",61],["momxxxass.com",61],["monkeyanimalporn.com",61],["moviexxx.mobi",61],["newanimeporn.com",61],["newjapanesexxx.com",61],["nicematureporn.com",61],["nudeplayboygirls.com",61],["openxxxporn.com",61],["originalindianporn.com",61],["originalteentube.com",61],["pig-fuck.com",61],["plainasianporn.com",61],["popularasianxxx.com",61],["pornanimetube.com",61],["pornasians.pro",61],["pornhat.asia",61],["pornjapanesesex.com",61],["pornomovies.asia",61],["pornvintage.tv",61],["primeanimesex.com",61],["realjapansex.com",61],["realmomsex.com",61],["redsexhub.com",61],["retroporn.world",61],["retrosexfilms.com",61],["sex-free-movies.com",61],["sexanimesex.com",61],["sexanimetube.com",61],["sexjapantube.com",61],["sexmomvideos.com",61],["sexteenxxxtube.com",61],["sexxxanimal.com",61],["sexyoungtube.com",61],["sexyvintageporn.com",61],["sopornmovies.com",61],["spicyvintageporn.com",61],["sunporno.club",61],["tabooanime.club",61],["teenextrem.com",61],["teenfucksex.com",61],["teenhost.net",61],["teensex.*",61],["teensexass.com",61],["tnaflix.asia",61],["totalfuckmovies.com",61],["totalmaturefuck.com",61],["txxx.asia",61],["vintagetube.*",61],["voyeurpornsex.com",61],["warmteensex.com",61],["wetasiancreampie.com",61],["wildhentaitube.com",61],["wowyoungsex.com",61],["xhamster-art.com",61],["xmovie.pro",61],["xnudevideos.com",61],["xnxxjapon.com",61],["xpics.me",61],["xvide.me",61],["xxxanimefuck.com",61],["xxxanimevideos.com",61],["xxxanimemovies.com",61],["xxxhentaimovies.com",61],["xxxhothub.com",61],["xxxjapaneseporntube.com",61],["xxxlargeporn.com",61],["xxxmomz.com",61],["xxxmovies.*",61],["xxxpornmilf.com",61],["xxxpussyclips.com",61],["xxxpussysextube.com",61],["xxxretrofuck.com",61],["xxxsex.pro",61],["xxxsexyjapanese.com",61],["xxxteenyporn.com",61],["xxxvideo.asia",61],["xxxvideos.ink",61],["xxxyoungtv.com",61],["youjizzz.club",61],["youngpussyfuck.com",61],["bayimg.com",62],["celeb.gate.cc",63],["kinoger.re",64],["usersdrive.com",64],["desi.upn.bio",64],["zooqle.*",65],["masterplayer.xyz",66],["pussy-hub.com",66],["porndex.com",67],["compucalitv.com",68],["hdfull.*",69],["diariodenavarra.es",70],["mangamanga.*",71],["streameast.*",72],["thestreameast.*",72],["pennlive.com",73],["beautypageants.indiatimes.com",74],["01fmovies.com",75],["vev.*",76],["vidop.*",76],["lnk2.cc",77],["fullhdxxx.com",78],["luscious.net",[78,114]],["classicpornbest.com",78],["1youngteenporn.com",78],["www-daftarharga.blogspot.com",[78,167]],["miraculous.to",[78,173]],["vtube.to",78],["zone-telechargement.*",78],["xstory-fr.com",78],["1337x.*",78],["x1337x.*",78],["gosexpod.com",79],["otakukan.com",80],["xcafe.com",81],["pornfd.com",81],["venusarchives.com",81],["imagehaha.com",82],["imagenpic.com",82],["imageshimage.com",82],["imagetwist.com",82],["megalink.*",83],["k1nk.co",83],["watchasians.cc",83],["lulustream.com",83],["luluvdo.com",83],["gmx.*",84],["web.de",84],["news18.com",85],["thelanb.com",86],["dropmms.com",86],["softwaredescargas.com",87],["cracking-dz.com",88],["mega1080p.*",89],["anitube.*",89],["gazzetta.it",90],["9hentai.*",91],["port.hu",92],["dziennikbaltycki.pl",93],["dzienniklodzki.pl",93],["dziennikpolski24.pl",93],["dziennikzachodni.pl",93],["echodnia.eu",93],["expressbydgoski.pl",93],["expressilustrowany.pl",93],["gazetakrakowska.pl",93],["gazetalubuska.pl",93],["gazetawroclawska.pl",93],["gk24.pl",93],["gloswielkopolski.pl",93],["gol24.pl",93],["gp24.pl",93],["gra.pl",93],["gs24.pl",93],["kurierlubelski.pl",93],["motofakty.pl",93],["naszemiasto.pl",93],["nowiny24.pl",93],["nowosci.com.pl",93],["nto.pl",93],["polskatimes.pl",93],["pomorska.pl",93],["poranny.pl",93],["sportowy24.pl",93],["strefaagro.pl",93],["strefabiznesu.pl",93],["stronakobiet.pl",93],["telemagazyn.pl",93],["to.com.pl",93],["wspolczesna.pl",93],["course9x.com",93],["courseclub.me",93],["azrom.net",93],["alttyab.net",93],["esopress.com",93],["nesiaku.my.id",93],["onemanhua.com",94],["freeindianporn.mobi",94],["dr-farfar.com",95],["boyfriendtv.com",96],["brandstofprijzen.info",97],["netfuck.net",98],["gaypornhdfree.*",98],["blog24.me",[98,107]],["kisahdunia.com",98],["cinemakottaga.*",98],["privatemoviez.*",98],["javsex.to",98],["nulljungle.com",98],["oyuncusoruyor.com",98],["pbarecap.ph",98],["sourds.net",98],["teknobalta.com",98],["tvinternetowa.info",98],["sqlserveregitimleri.com",98],["tutcourse.com",98],["readytechflip.com",98],["warddogs.com",98],["dvdgayporn.com",98],["iimanga.com",98],["tinhocdongthap.com",98],["tremamnon.com",98],["423down.com",98],["brizzynovel.com",98],["jugomobile.com",98],["freecodezilla.net",98],["apkmaven.*",98],["iconmonstr.com",98],["gay-tubes.cc",98],["rbxscripts.net",98],["comentariodetexto.com",98],["wordpredia.com",98],["allfaucet.xyz",[98,107]],["titbytz.tk",98],["replica-watch.info",98],["alludemycourses.com",98],["kayifamilytv.com",98],["interfans.org",98],["iir.ai",99],["popcornstream.*",100],["gameofporn.com",101],["qpython.club",102],["antifake-funko.fr",102],["dktechnicalmate.com",102],["recipahi.com",102],["e9china.net",103],["ontools.net",103],["marketbeat.com",104],["hentaipornpics.net",105],["apps2app.com",106],["ohionowcast.info",107],["wiour.com",107],["bitzite.com",[107,112,113]],["appsbull.com",107],["diudemy.com",107],["maqal360.com",[107,115,116]],["bitcotasks.com",107],["videolyrics.in",107],["manofadan.com",107],["cempakajaya.com",107],["tagecoin.com",107],["naijafav.top",107],["ourcoincash.xyz",107],["claimcoins.site",107],["cryptosh.pro",107],["eftacrypto.com",107],["fescrypto.com",107],["earnhub.net",107],["kiddyshort.com",107],["tronxminer.com",107],["neverdims.com",107],["homeairquality.org",108],["cety.app",[109,110]],["exego.app",109],["cutlink.net",109],["cutsy.net",109],["cutyurls.com",109],["cutty.app",109],["cutnet.net",109],["jixo.online",109],["cuty.me",110],["upfiles.app",[110,125]],["upfiles-urls.com",[110,125]],["gamerxyt.com",110],["adcrypto.net",111],["admediaflex.com",111],["aduzz.com",111],["bitcrypto.info",111],["cdrab.com",111],["datacheap.io",111],["hbz.us",111],["savego.org",111],["owsafe.com",111],["sportweb.info",111],["gfx-station.com",112],["buzzheavier.com",113],["flashbang.sh",113],["trashbytes.net",113],["aiimgvlog.fun",114],["6indianporn.com",114],["amateurebonypics.com",114],["amateuryoungpics.com",114],["amigosporn.top",114],["cinemabg.net",114],["coomer.su",114],["desimmshd.com",114],["frauporno.com",114],["givemeaporn.com",114],["hitomi.la",114],["jav-asia.top",114],["javf.net",114],["javfull.net",114],["javideo.net",114],["javsunday.com",114],["kemono.su",114],["kr18plus.com",114],["missavtv.com",114],["pilibook.com",114],["pornborne.com",114],["porngrey.com",114],["pornktube.*",114],["qqxnxx.com",114],["sexvideos.host",114],["submilf.com",114],["subtaboo.com",114],["tktube.com",114],["watchseries.*",114],["xfrenchies.com",114],["soft98.ir",[115,136]],["moderngyan.com",117],["sattakingcharts.in",117],["freshbhojpuri.com",117],["bgmi32bitapk.in",117],["bankshiksha.in",117],["earn.mpscstudyhub.com",117],["earn.quotesopia.com",117],["money.quotesopia.com",117],["best-mobilegames.com",117],["learn.moderngyan.com",117],["bharatsarkarijobalert.com",117],["quotesopia.com",117],["creditsgoal.com",117],["coingraph.us",118],["momo-net.com",118],["milfnut.*",118],["maxgaming.fi",118],["cybercityhelp.in",119],["travel.vebma.com",120],["cloud.majalahhewan.com",120],["crm.cekresi.me",120],["ai.tempatwisata.pro",120],["pinloker.com",120],["sekilastekno.com",120],["mrproblogger.com",121],["themezon.net",121],["dagensnytt.com",121],["azmath.info",122],["azsoft.*",122],["downfile.site",122],["downphanmem.com",122],["expertvn.com",122],["memangbau.com",122],["trangchu.news",122],["aztravels.net",122],["ielts-isa.edu.vn",122],["techedubyte.com",[122,229]],["jpopsingles.eu",122],["aipebel.com",122],["link.paid4link.com",123],["driveup.sbs",124],["apimate.net",124],["dynamicminister.net",124],["gofirmware.com",124],["national-park.com",124],["forgee.xyz",124],["gamehub.cam",124],["upfion.com",125],["cutyion.com",125],["weshare.is",127],["file.gocmod.com",127],["flight-report.com",128],["vulture.com",129],["megaplayer.bokracdn.run",130],["hentaistream.com",131],["siteunblocked.info",132],["larvelfaucet.com",133],["feyorra.top",133],["claimtrx.com",133],["pagalmovies.*",134],["7starhd.*",134],["jalshamoviez.*",134],["moviesyug.net",134],["9xupload.*",134],["bdupload.*",134],["rdxhd1.*",134],["w4files.ws",134],["parispi.net",135],["hentaicloud.com",136],["nuvid.*",136],["justin.mp3quack.lol",136],["tio.ch",137],["lavanguardia.com",137],["tu.no",137],["paperzonevn.com",138],["dailyvideoreports.net",139],["lewd.ninja",140],["systemnews24.com",141],["incestvidz.com",142],["niusdiario.es",143],["playporngames.com",144],["javx.cc",144],["movi.pk",[145,148]],["moviessources.*",146],["cutesexyteengirls.com",147],["0dramacool.net",148],["0gomovie.*",148],["0gomovies.*",148],["185.53.88.104",148],["185.53.88.204",148],["185.53.88.15",148],["123moviefree.*",148],["123movies4k.net",148],["1kmovies.*",148],["1madrasdub.*",148],["1primewire.*",148],["1rowsports.com",148],["2embed.*",148],["2madrasdub.*",148],["2umovies.*",148],["4anime.*",148],["4share-mp3.net",148],["9animetv.to",148],["720pstream.me",148],["aagmaal.com",148],["abysscdn.com",148],["adblockplustape.*",148],["ajkalerbarta.com",148],["altadefinizione01.*",148],["androidapks.biz",148],["androidsite.net",148],["animeonlinefree.org",148],["animesite.net",148],["animespank.com",148],["aniworld.to",148],["apkmody.io",148],["appsfree4u.com",148],["atomixhq.*",148],["audioz.download",148],["awafim.tv",148],["bdnewszh.com",148],["beastlyprints.com",148],["beinmatch.*",148],["bengalisite.com",148],["bestfullmoviesinhd.org",148],["betteranime.net",148],["blacktiesports.live",148],["brmovies.*",148],["buffsports.stream",148],["ch-play.com",148],["cima4u.*",148],["clickforhire.com",148],["clicknupload.*",148],["cloudy.pk",148],["cmovies.*",148],["computercrack.com",148],["coolcast2.com",148],["crackedsoftware.biz",148],["crackfree.org",148],["cracksite.info",148],["cricfree.*",148],["crichd.*",148],["cryptoblog24.info",148],["cuatrolatastv.blogspot.com",148],["cydiasources.net",148],["decmelfot.xyz",148],["dirproxy.com",148],["dood.*",148],["dopebox.to",148],["downloadapk.info",148],["downloadapps.info",148],["downloadgames.info",148],["downloadmusic.info",148],["downloadsite.org",148],["downloadwella.com",148],["ebooksite.org",148],["educationtips213.blogspot.com",148],["egyup.live",148],["elgoles.pro",148],["embed.meomeo.pw",148],["embed.scdn.to",148],["emulatorsite.com",148],["essaysharkwriting.club",148],["exploreera.net",148],["extrafreetv.com",148],["f1stream.*",148],["fakedetail.com",148],["faselhd.*",148],["fbstream.*",148],["fclecteur.com",148],["filemoon.*",148],["filepress.*",[148,211]],["files.im",148],["filmlinks4u.*",148],["filmpertutti.*",148],["filmyzilla.*",148],["flexyhit.com",148],["fmoviefree.net",148],["fmovies24.com",148],["fmovies.*",148],["freeflix.info",148],["freemoviesu4.com",148],["freeplayervideo.com",148],["freesoccer.net",148],["french-stream.*",148],["fseries.org",148],["fzlink.*",148],["gamefast.org",148],["gamesite.info",148],["gettapeads.com",148],["gmanga.me",148],["gocast123.me",148],["gofilms4u.*",148],["gogoanime.*",148],["gogohd.net",148],["gogoplay5.com",148],["gomoviz.*",148],["gooplay.net",148],["gostreamon.net",148],["happy2hub.org",148],["harimanga.com",148],["hdmoviefair.*",148],["hdmovies4u.*",148],["hdmovies50.*",148],["hdmoviesfair.*",148],["healthnewsreel.com",148],["hexupload.net",148],["hh3dhay.*",148],["hinatasoul.com",148],["hindilinks4u.*",148],["hindisite.net",148],["holymanga.net",148],["hotmasti.*",148],["hurawatch.*",148],["hxfile.co",148],["isosite.org",148],["iv-soft.com",148],["januflix.expert",148],["jewelry.com.my",148],["johnwardflighttraining.com",148],["kabarportal.com",148],["klmanga.*",148],["klubsports.*",148],["kstorymedia.com",148],["la123movies.org",148],["lespassionsdechinouk.com",148],["libertestreamvf.*",148],["lilymanga.net",148],["linksdegrupos.com.br",148],["linkz.wiki",148],["livetvon.*",148],["livestreamtv.pk",148],["macsite.info",148],["manga1000.*",148],["manga1001.*",148],["mangaraw.*",148],["mangarawjp.*",148],["mangasite.org",148],["manhuascan.com",148],["megamovies.org",148],["membed.net",148],["mlbstream.*",148],["moddroid.com",148],["motogpstream.*",148],["moviefree2.com",148],["movierulz.*",148],["movies123.*",148],["movies-watch.com.pk",148],["movies2watch.*",148],["moviesden.*",148],["moviesite.app",148],["moviesonline.fm",148],["moviesx.org",148],["moviezaddiction.*",148],["msmoviesbd.com",148],["musicsite.biz",148],["myfernweh.com",148],["myviid.com",148],["nazarickol.com",148],["nbastream.*",148],["netcine.*",148],["nflstream.*",148],["nhlstream.*",148],["noob4cast.com",148],["nsw2u.com",[148,270]],["oko.sh",148],["onlinewatchmoviespk.*",148],["orangeink.pk",148],["pahaplayers.click",148],["patchsite.net",148],["pctfenix.*",148],["pctnew.*",148],["pdfsite.net",148],["pksmovies.*",148],["play1002.com",148],["player-cdn.com",148],["plyjam.*",148],["plylive.*",148],["pogolinks.*",148],["popcorntime.*",148],["poscitech.*",148],["productkeysite.com",148],["projectfreetv.one",148],["romsite.org",148],["rufiguta.com",148],["rugbystreams.*",148],["rytmp3.io",148],["send.cm",148],["seriesite.net",148],["seriezloaded.com.ng",148],["serijehaha.com",148],["shahed4u.*",148],["sflix.*",148],["shrugemojis.com",148],["siteapk.net",148],["siteflix.org",148],["sitegames.net",148],["sitekeys.net",148],["sitepdf.com",148],["sitesunblocked.*",148],["sitetorrent.com",148],["softwaresite.net",148],["solarmovies.*",148],["sportbar.live",148],["sportcast.*",148],["sportskart.*",148],["sports-stream.*",148],["ssyoutube.com",148],["stardima.com",148],["stream4free.live",148],["streaming-french.*",148],["streamers.*",148],["streamingcommunity.*",[148,193]],["superapk.org",148],["supermovies.org",148],["t20cup.*",148],["tainio-mania.online",148],["talaba.su",148],["tamilguns.org",148],["tatabrada.tv",148],["techtrendmakers.com",148],["tennisstreams.*",148],["thememypc.net",148],["thripy.com",148],["torrentdosfilmes.*",148],["toonanime.*",148],["travelplanspro.com",148],["turcasmania.com",148],["tusfiles.com",148],["tvonlinesports.com",148],["tvply.*",148],["ufcstream.*",148],["ultramovies.org",148],["uploadbank.com",148],["uptomega.*",148],["uqload.*",148],["urdubolo.pk",148],["vudeo.*",148],["vidoo.*",148],["vidspeeds.com",148],["vipboxtv.*",148],["viprow.*",148],["warezsite.net",148],["watchmovies2.com",148],["watchmoviesforfree.org",148],["watchofree.com",148],["watchsite.net",148],["watchsouthpark.tv",148],["watchtvch.club",148],["web.livecricket.is",148],["webseries.club",148],["worldcupstream.pm",148],["y2mate.com",148],["yesmovies.*",148],["yomovies.*",148],["yomovies1.*",148],["youapk.net",148],["youtube4kdownloader.com",148],["yt2mp3s.*",148],["yts-subs.com",148],["kat.*",148],["katbay.*",148],["kickass.*",148],["kickasshydra.*",148],["kickasskat.*",148],["kickass2.*",148],["kickasstorrents.*",148],["kat2.*",148],["kattracker.*",148],["thekat.*",148],["thekickass.*",148],["kickassz.*",148],["kickasstorrents2.*",148],["topkickass.*",148],["kickassgo.*",148],["kkickass.*",148],["kkat.*",148],["kickasst.*",148],["kick4ss.*",148],["haho.moe",149],["nicy-spicy.pw",150],["novelmultiverse.com",151],["mylegalporno.com",152],["embedsports.me",153],["embedstream.me",153],["jumbtv.com",153],["reliabletv.me",153],["guardaserie.*",154],["cine-calidad.*",155],["xnxx.com",156],["xvideos.*",156],["thecut.com",157],["novelism.jp",158],["alphapolis.co.jp",159],["game3rb.com",160],["javhub.net",160],["thotvids.com",161],["berklee.edu",162],["rawkuma.com",[163,164]],["moviesjoyhd.to",164],["cineb.rs",164],["imeteo.sk",165],["youtubemp3donusturucu.net",166],["surfsees.com",168],["vivo.st",[169,170]],["videovard.*",171],["alueviesti.fi",172],["kiuruvesilehti.fi",172],["lempaala.ideapark.fi",172],["olutposti.fi",172],["urjalansanomat.fi",172],["tainhanhvn.com",174],["titantv.com",175],["3cinfo.net",176],["camarchive.tv",177],["crownimg.com",177],["freejav.guru",177],["gntai.*",177],["grantorrent.*",177],["hentai2read.com",177],["icyporno.com",177],["illink.net",177],["javtiful.com",177],["m-hentai.net",177],["mejortorrent.*",177],["mejortorrento.*",177],["mejortorrents.*",177],["mejortorrents1.*",177],["mejortorrentt.*",177],["pornblade.com",177],["pornfelix.com",177],["pornxxxxtube.net",177],["redwap.me",177],["redwap2.com",177],["redwap3.com",177],["sunporno.com",177],["tubxporn.xxx",177],["ver-comics-porno.com",177],["ver-mangas-porno.com",177],["xanimeporn.com",177],["xxxvideohd.net",177],["zetporn.com",177],["simpcity.su",178],["cocomanga.com",179],["animelatinohd.com",179],["sampledrive.in",180],["sportnews.to",180],["soccershoes.blog",180],["shineads.*",180],["mcleaks.net",181],["explorecams.com",181],["minecraft.buzz",181],["chillx.top",182],["playerx.stream",182],["m.liputan6.com",184],["stardewids.com",[184,207]],["ingles.com",185],["spanishdict.com",185],["surfline.com",186],["rureka.com",187],["freepreset.net",188],["amateur8.com",189],["freeporn8.com",189],["maturetubehere.com",189],["embedo.co",190],["corriere.it",191],["oggi.it",191],["2the.space",192],["apkcombo.com",194],["winfuture.de",195],["sponsorhunter.com",196],["novelssites.com",197],["haxina.com",198],["scimagojr.com",198],["dramafren.net",198],["torrentmac.net",199],["udvl.com",200],["dlpanda.com",201],["socialmediagirls.com",202],["einrichtungsbeispiele.de",203],["weadown.com",204],["molotov.tv",205],["freecoursesonline.me",206],["adelsfun.com",206],["advantien.com",206],["bailbondsfinder.com",206],["bg-gledai.*",206],["bigpiecreative.com",206],["childrenslibrarylady.com",206],["classifarms.com",206],["comtasq.ca",206],["crone.es",206],["ctrmarketingsolutions.com",206],["dropnudes.com",206],["ftuapps.dev",206],["genzsport.com",206],["ghscanner.com",206],["gledaitv.*",206],["grsprotection.com",206],["gruporafa.com.br",206],["inmatefindcalifornia.com",206],["inmatesearchidaho.com",206],["itsonsitetv.com",206],["mfmfinancials.com",206],["myproplugins.com",206],["nurulislam.org",206],["onehack.us",206],["ovester.com",206],["paste.bin.sx",206],["privatenudes.com",206],["renoconcrete.ca",206],["richieashbeck.com",206],["sat.technology",206],["short1ink.com",206],["stpm.co.uk",206],["wegotcookies.co",206],["mathcrave.com",206],["marinetraffic.live",206],["commands.gg",207],["smgplaza.com",208],["emturbovid.com",209],["findjav.com",209],["javggvideo.xyz",209],["mmtv01.xyz",209],["stbturbo.xyz",209],["streamsilk.com",209],["freepik.com",210],["diyphotography.net",212],["bitchesgirls.com",213],["hiraethtranslation.com",214],["programmingeeksclub.com",215],["diendancauduong.com",216],["androidadult.com",217],["parentcircle.com",218],["h-game18.xyz",219],["wheelofgold.com",220],["davescomputertips.com",221],["historyofroyalwomen.com",221],["motchill.*",222],["lifestyle.bg",223],["news.bg",223],["topsport.bg",223],["webcafe.bg",223],["freepikdownloader.com",224],["freepasses.org",225],["iusedtobeaboss.com",226],["androidpolice.com",227],["cbr.com",227],["gamerant.com",227],["howtogeek.com",227],["thegamer.com",227],["blogtruyenmoi.com",228],["repretel.com",230],["tubereader.me",230],["graphicget.com",231],["qiwi.gg",[232,233]],["sonixgvn.net",234],["alliptvlinks.com",235],["smashyplayer.top",236],["upns.*",236],["xvideos.com",237],["xvideos2.com",237],["homemoviestube.com",238],["sexseeimage.com",238],["readcomiconline.*",239],["nekopoi.*",240],["ukchat.co.uk",241],["hivelr.com",242],["skidrowcodex.net",243],["takimag.com",244],["digi.no",245],["th.gl",246],["twi-fans.com",247],["learn-cpp.org",248],["terashare.co",249],["pornwex.tv",250],["smithsonianmag.com",251],["homesports.net",252],["realmoasis.com",253],["javfc2.xyz",254],["gobankingrates.com",255],["hiddenleaf.to",256],["ronorp.net",257],["gdflix.*",258],["a1movies.*",259],["videovak.com",260],["a-lohas.jp",261],["akirabox.com",262],["purplex.app",263],["maggotdrowning.com",264],["bilinovel.com",265],["esportstales.com",266],["idnes.cz",[267,268]],["cbc.ca",269]]);
const exceptionsMap = new Map([["forum.soft98.ir",[115,136]]]);
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
    try { addEventListenerDefuser(...argsList[i]); }
    catch { }
}

/******************************************************************************/

// End of local scope
})();

void 0;
