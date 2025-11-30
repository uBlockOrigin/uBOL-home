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
        proxyApplyFn.isCtor = new Map();
    }
    if ( proxyApplyFn.isCtor.has(target) === false ) {
        proxyApplyFn.isCtor.set(target, fn.prototype?.constructor === fn);
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
    if ( proxyApplyFn.isCtor.get(target) ) {
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

function shouldDebug(details) {
    if ( details instanceof Object === false ) { return false; }
    return scriptletGlobals.canDebug && details.debug;
}

/******************************************************************************/

const scriptletGlobals = {}; // eslint-disable-line
const argsList = [["click","/event_callback=function\\(\\){window\\.location=t\\.getAttribute\\(\"href\"\\)/"],["click","Event"],["click","","elements",".dropdown-menu a[href]"],["load","Object"],["load","hard_block"],["","adb"],["click","showNotice"],["click","ClickHandler"],["load","IsAdblockRequest"],["load","onload"],["","BACK"],["load","(!o)"],["load","(!i)"],["","_0x"],["","Adblock"],["/^(?:click|mousedown)$/","bypassEventsInProxies"],["","open"],["click","exopop"],["/^(?:load|click)$/","popMagic"],["mousedown","popundrInit"],["getexoloader"],["","pop"],["load","creativeLoaded-"],["/^load[A-Za-z]{12,}/"],["","/exo"],["","_blank"],["mousedown","preventDefault"],["load","advertising"],["click","preventDefault"],["load","2000"],["/^(click|mousedown|mousemove|touchstart|touchend|touchmove)/","system.popunder"],["load","adb"],["/^(?:click|mousedown|mousemove|touchstart|touchend|touchmove)$/","system.popunder"],["","'0x"],["load","nextFunction"],["/DOMContentLoaded|load/","y.readyState"],["","history.go"],["/error|canplay/","(t)"],["load","hblocked"],["error","Adblocker"],["DOMContentLoaded","adlinkfly"],["DOMContentLoaded","shortener"],["mousedown","trigger"],["","0x"],["","Pop"],["/^(?:click|mousedown)$/","popunder"],["DOMContentLoaded","preventExit"],["/^(?:click|mousedown)$/","_0x"],["mouseup","_blank"],["click","pop_under"],["load","url"],["load","adverts-top-container"],["","Date"],["DOMContentLoaded","&nbsp"],["click","read_cookie"],["","midRoll"],["click","_0x"],["load","isBlanketFound"],["load","showModal"],["click","trigger"],["mouseout","clientWidth"],["DOMContentLoaded","anchor.href"],["load","autoRecov"],["popstate","noPop"],["/^(?:click|mousedown)$/","ppu"],["click","native code"],["click","_blank"],["/^(?:mousedown|mouseup)$/","0x"],["click","popundr"],["click"],["DOMContentLoaded","compupaste"],["mousedown","!!{});"],["DOMContentLoaded","/adblock/i"],["keydown"],["/^/","0x"],["load","PrivateMode"],["scroll","_0x"],["DOMContentLoaded","checkVPN"],["/^(?:click|mousedown|mouseup)$/","di()"],["","'\\'"],["popstate"],["click","my_inter_listen"],["","window.open"],["load","appendChild"],["","bi()"],["","checkTarget"],["click","popunder"],["timeupdate"],["scroll","getElementById"],["load","undefined"],["DOMContentLoaded","scriptwz_url"],["load","0x"],["DOMContentLoaded","btoa"],["adblockActivated"],["click","saveLastEvent"],["click","","elements",".post.movies"],["","show"],["/.?/","popMagic"],["","ads"],["click","interstitial"],["load","antiblock"],["DOMContentLoaded","adsBlocked"],["load",".appendChild"],["","btoa"],["DOMContentLoaded","AdBlock"],["load","blocker"],["mouseleave","NativeDisplayAdID"],["mouseover","event.triggered"],["blur","stopCountdown"],["load","htmls"],["blur","focusOut"],["click","/handleClick|popup/"],["DOMContentLoaded","history.go"],["load","bypass"],["DOMContentLoaded","antiAdBlockerHandler"],["DOMContentLoaded","location.href"],["","popMagic"],["contextmenu","preventDefault"],["visibilitychange","remainingSeconds"],["click","Popunder"],["contextmenu"],["submit","validateForm"],["DOMContentLoaded","checkAdblockUser"],["blur","counter"],["load","doTest"],["DOMContentLoaded","document.documentElement.lang.toLowerCase"],["click","maxclick"],["click","","elements","#get-link-button"],["click","window.open"],["click","shouldOpenPopUp"],["click","adForm"],["blur"],["click","document.createElement"],["DOMContentLoaded","script[data-domain="],["click","popMagic"],["","shouldShow"],["","exopop"],["","break;case $."],["mousedown","shown_at"],["/click|mouse/","[native code]","elements","document"],["","focus"],["load","innerHTML"],["load","abDetectorPro"],["DOMContentLoaded","src=atob"],["error","blocker"],["load","error-report.com"],["load","download-wrapper"],["DOMContentLoaded","adClosedTimestamp"],["click","tampilkanUrl"],["click","instanceof Event","elements","body"],["click","openPopunder"],["load",".getComputedStyle"],["","STORAGE2"],["DOMContentLoaded","app_advert"],["message","adsense"],["load","/AdBlock/i"],["/^(?:click|mousedown)$/","latest!=="],["DOMContentLoaded",".ready"],["load","script"],["","/pop|wm|forceClick/"],["load","block"],["","/_0x|localStorage\\.getItem/"],["DOMContentLoaded","adblock"],["click","open"],["error"],["visibilitychange"],["load","/showModal|isBlanketFound/"],["click","shouldShow"],["load","Adblock"],["DOMContentLoaded","window.open"],["DOMContentLoaded","atob"],["","vads"],["devtoolschange"],["mouseup","decodeURIComponent"],["","removeChild"],["click","pu_count"],["message"],["","/pop|_blank/"],["click","allclick_Public"],["load","crakPopInParams"],["DOMContentLoaded","/dyn\\.ads|loadAdsDelayed/"],["/touchstart|mousedown|click/","latest"],["blur","native code"],["blur","event.simulate"],["DOMContentLoaded","0x"],["click","overlay"],["scroll","undefined"],["readystatechange","document.removeEventListener"],["scroll","detect"],["click","t(a)"],["mouseup","catch"],["click","clickCount"],["load","checkAdblock"],["scroll","innerHeight"],["hashchange"],["load","/nextFunction|2000/"],["load","player"],["load","popMagic"],["click","popurl"],["DOMContentLoaded","adbl"],["","/open.*_blank/"],["scroll"],["","isBlocking"],["timeupdate","","elements",".quiver-cam-player--ad-not-running.quiver-cam-player--free video"],["load",".innerHTML"],["/click|mousedown/","catch"],["adb"],["click","popName"],["DOMContentLoaded","clientHeight"],["click","window.focus"],["click","event.dispatch"],["load","adblock"],["","Math"],["DOMContentLoaded","popupurls"],["load","XMLHttpRequest"],["load","AdBlocker"],["","showModal"],["","goog"],["","document.body"],["","modal"],["click","adobeModalTestABenabled"],["blur","console.log"],["DOMContentLoaded","adsSrc"],["","AdB"],["load","adSession"],["np.detect"],["DOMContentLoaded","document.documentElement.lang"],["DOMContentLoaded","googlesyndication"],["load","popunder"],["DOMContentLoaded",".clientHeight"],["scroll","function(e)"],["DOMContentLoaded","adlinkfly_url"],["load","document.getElementById"],["DOMContentLoaded","daadb_get_data_fetch"],["click","popactive"],["click","/sandbox/i"],["DOMContentLoaded","location.replace"],["load","modal_blocker"],["click","isOpened"],["mousedown","pop.doEvent"],["click","alink"],["load","[native code]"],["load","document.querySelectorAll"],["/adblock/i"],["load","google-analytics"],["","sessionStorage"],["click","/form\\.submit|urlToOpen/"],["DOMContentLoaded","overlays"],["load","ads"],["click","ShouldShow"],["click","[native code]","elements",".main-wrap"],["mousedown","localStorage"],["","adsense"],["click","splashPage"],["load","detect-modal"],["click","localStorage"],["DOMContentLoaded","canRedirect"],["DOMContentLoaded","adb"],["error","/\\{[a-z]\\(e\\)\\}/"],["load","showcfkModal"],["click","attached","elements","div[class=\"share-embed-container\"]"],["click","fp-screen"],["DOMContentLoaded","leaderboardAd"],["DOMContentLoaded","fetch"],["click","openPopupForChapter"],["click","doThePop"],["DOMContentLoaded","blockAdBlock"],["click","openDirectLinkAd"],["load","detect"],["DOMContentLoaded","history.pushState"],["DOMContentLoaded","showPopup"],["click","PopUnder"],["DOMContentLoaded","open"],["click","/adsActive|POPUNDER/i"],["click","clicksCount"],["/click|mouse|touch/","_0x"],["mouseup","open"],["DOMContentLoaded","adBlockNotice"],["load","/^function\\(\\).*requestIdleCallback.*/"],["error","/function\\([a-z]\\){[a-z]\\([a-z]\\)}/"],["DOMContentLoaded","_0x"],["DOMContentLoaded","detect"],["DOMContentLoaded","Promise"],["click","popupInterval"],["DOMContentLoaded","-banner"],["click","PopURL"],["DOMContentLoaded","checkAdBlocker"],["DOMContentLoaded","Visibility"],["DOMContentLoaded","Popunder"],["load","blockAdBlock"],["load","&&"],["click","handlePopup"],["play","openPopunder"],["DOMContentLoaded","/navigator|location\\.href/"],["click","adId"],["DOMContentLoaded","handleRedirect"],["DOMContentLoaded","setInterval"],["click","location"],["click","href"],["message","_0x"],["popstate","window.location.href"],["click","link.click"],["load","/await|clientHeight/"],["","/(ping|score)Url"]];
const hostnamesMap = new Map([["cbc.ca",0],["io.google",1],["dukeofed.org",2],["newser.com",3],["sport1.de",4],["timesofindia.indiatimes.com",5],["drrtyr.mx",5],["pinoyalbums.com",5],["multiplayer.it",5],["skidrowreloaded.com",6],["mediafire.com",[7,8]],["kingofdown.com",9],["radiotormentamx.com",9],["limetorrents.*",[9,13]],["king-pes.*",9],["quelleestladifference.fr",9],["depedlps.*",9],["otakuworldsite.blogspot.com",9],["ad-itech.blogspot.com",9],["komikcast.*",9],["unlockapk.com",9],["mobdi3ips.com",9],["socks24.org",9],["idedroidsafelink.*",9],["links-url.*",9],["interviewgig.com",9],["javaguides.net",9],["almohtarif-tech.net",9],["devoloperxda.blogspot.com",9],["zwergenstadt.com",9],["upxin.net",9],["ciudadblogger.com",9],["ke-1.com",9],["bit-shares.com",9],["itdmusics.com",9],["aspdotnet-suresh.com",9],["tudo-para-android.com",9],["zerotopay.com",9],["ak4eg.*",9],["hesgoal-live.io",9],["steanplay.*",10],["bibme.org",11],["citationmachine.net",11],["easybib.com",12],["pahe.*",13],["yts.*",13],["tube8.*",13],["topeuropix.*",13],["vermangasporno.com",13],["moviescounter.*",13],["imgtorrnt.in",13],["picbaron.com",[13,116]],["torrent9.*",13],["desiremovies.*",13],["letmejerk.com",13],["letmejerk2.com",13],["letmejerk3.com",13],["letmejerk4.com",13],["letmejerk5.com",13],["letmejerk6.com",13],["letmejerk7.com",13],["movs4u.*",13],["uwatchfree.*",13],["hydrax.*",13],["4movierulz.*",13],["projectfreetv.*",13],["arabseed.*",13],["btdb.*",[13,52]],["dlapk4all.com",13],["kropic.com",13],["pdfindir.net",13],["brstej.com",13],["topwwnews.com",13],["xsanime.com",13],["vidlo.us",13],["youx.xxx",13],["world4ufree.*",13],["animeindo.asia",13],["streamsport.*",13],["rojadirectatvhd.*",13],["userload.*",13],["badtaste.it",14],["adyou.*",15],["gotporn.com",16],["freepornrocks.com",16],["footybite.to",16],["rargb.to",16],["totalsportek.*",16],["totalsportekhd.com",16],["xn--mlaregvle-02af.nu",16],["realgfporn.com",[17,18]],["fxporn69.*",17],["thisvid.com",18],["xvideos-downloader.net",18],["imgspice.com",19],["vikiporn.com",20],["tnaflix.com",20],["pornomico.com",20],["yourlust.com",20],["hotpornfile.org",20],["watchfreexxx.net",20],["vintageporntubes.com",20],["angelgals.com",20],["babesexy.com",20],["youlikeboys.com",20],["hentaihere.com",20],["ganstamovies.com",20],["youngleak.com",20],["jizzberry.com",20],["porndollz.com",20],["filmpornofrancais.fr",20],["pictoa.com",[20,43]],["pornohirsch.net",20],["herzporno.*",20],["deinesexfilme.com",20],["einfachtitten.com",20],["halloporno.*",20],["lesbenhd.com",20],["milffabrik.com",20],["porn-monkey.com",20],["porndrake.com",20],["pornhubdeutsch.net",20],["pornoaffe.com",20],["pornodavid.com",20],["pornoente.tv",20],["pornofisch.com",20],["pornofelix.com",20],["pornohammer.com",20],["pornohelm.com",20],["pornoklinge.com",20],["pornotom.com",20],["pornotommy.com",20],["pornovideos-hd.com",20],["pornozebra.com",20],["xhamsterdeutsch.xyz",20],["xnxx-sexfilme.com",20],["hd-easyporn.com",20],["adultasianporn.com",20],["nsfwmonster.com",20],["girlsofdesire.org",20],["gaytail.com",20],["fetish-bb.com",20],["rumporn.com",20],["soyoungteens.com",20],["zubby.com",20],["lesbian8.com",20],["gayforfans.com",20],["reifporn.de",20],["javtsunami.com",20],["18tube.sex",20],["xxxextreme.org",20],["amateurs-fuck.com",20],["sex-amateur-clips.com",20],["hentaiworld.tv",20],["dads-banging-teens.com",20],["home-xxx-videos.com",20],["mature-chicks.com",20],["hqbang.com",20],["darknessporn.com",20],["familyporner.com",20],["freepublicporn.com",20],["pisshamster.com",20],["punishworld.com",20],["xanimu.com",20],["tubator.com",20],["hentai2w.com",[20,134]],["pornhd.com",21],["cnnamador.com",[21,30]],["cle0desktop.blogspot.com",21],["turkanime.co",21],["rexporn.*",21],["movies07.*",21],["camclips.tv",[21,44]],["blackpornhq.com",21],["xsexpics.com",21],["wannafreeporn.com",21],["ytube2dl.com",21],["pornocomics.*",21],["multiup.us",21],["protege-torrent.com",21],["pussyspace.com",[22,23]],["pussyspace.net",[22,23]],["empflix.com",24],["cpmlink.net",25],["bdsmstreak.com",25],["cutpaid.com",25],["pornforrelax.com",25],["fatwhitebutt.com",25],["pornomoll.*",25],["short.pe",26],["gsurl.*",26],["mimaletadepeliculas.*",27],["bs.to",28],["burningseries.*",28],["efukt.com",28],["dz4soft.*",29],["generacionretro.net",29],["nuevos-mu.ucoz.com",29],["yoututosjeff.*",29],["ebookmed.*",29],["lanjutkeun.*",29],["mimaletamusical.blogspot.com",29],["novelasesp.*",29],["visionias.net",29],["singingdalong.*",29],["b3infoarena.in",29],["lurdchinexgist.blogspot.com",29],["thefreedommatrix.blogspot.com",29],["hentai-vl.blogspot.com",29],["projetomotog.blogspot.com",29],["ktmx.pro",29],["lirik3satu.blogspot.com",29],["marketmovers.it",29],["pharmaguideline.com",29],["mixloads.com",29],["mangaromance.eu",29],["interssh.com",29],["freesoftpdfdownload.blogspot.com",29],["myadslink.com",29],["blackavelic.com",29],["doujindesu.*",29],["server.satunivers.tv",29],["flashingjungle.com",30],["ma-x.org",31],["lavozdegalicia.es",31],["ddwloclawek.pl",31],["ki24.info",31],["xmovies8.*",32],["xmovies08.org",33],["freecoursesonline.*",34],["lordpremium.*",34],["mp3fiber.com",[34,47]],["schrauben-normen.de",34],["avengerinator.blogspot.com",34],["novablogitalia.*",34],["link-to.net",34],["hanimesubth.com",34],["gsmturkey.net",34],["anisubindo.*",34],["adshrink.it",34],["presentation-ppt.com",34],["mangacanblog.com",34],["pekalongan-cits.blogspot.com",34],["4tymode.win",34],["linkvertise.com",34],["toutes-les-solutions.fr",34],["reifenrechner.at",34],["tire-size-calculator.info",34],["linuxsecurity.com",34],["itsguider.com",34],["cotravinh.blogspot.com",34],["itudong.com",34],["shortx.net",34],["btvsports.*",34],["lecturel.com",34],["bakai.org",34],["nar.k-ba.net",34],["eurotruck2.com.br",34],["tiroalpaloes.com",34],["stream4free.*",34],["tiroalpaloes.net",34],["flixsix.com",34],["tiroalpaloweb.xyz",34],["senaleszdhd.blogspot.com",34],["globaldjmix.com",35],["desiupload.*",[36,161]],["hblinks.pro",36],["hubcdn.vip",36],["hubdrive.*",[36,133]],["90fpsconfig.in",36],["katdrive.link",36],["kmhd.net",36],["bollydrive.rest",36],["360news4u.net",36],["hypershort.com",[36,130]],["bollydrive.*",[36,163]],["zazzybabes.com",37],["haaretz.co.il",38],["haaretz.com",38],["slate.com",39],["megalinks.info",40],["megapastes.com",40],["mega-mkv.com",[40,41]],["mkv-pastes.com",40],["zpaste.net",40],["zlpaste.net",40],["mega-dvdrip.*",41],["peliculas-dvdrip.*",41],["desbloqueador.*",42],["cine.to",[43,200]],["newpelis.*",[43,50]],["pelix.*",[43,50]],["allcalidad.*",[43,134]],["khatrimaza.*",43],["kissasia.cc",43],["camwhores.*",44],["camwhorestv.*",44],["digjav.com",44],["uproxy.*",44],["videoszoofiliahd.com",45],["xxxtubezoo.com",46],["zooredtube.com",46],["ancensored.com",47],["ganool.*",47],["xrivonet.info",47],["pirate.*",47],["piratebay.*",47],["pirateproxy.*",47],["proxytpb.*",47],["thepiratebay.*",47],["uii.io",48],["porndoe.com",49],["acienciasgalilei.com",51],["playrust.io",52],["payskip.org",53],["short-url.link",54],["tubedupe.com",55],["mirrorace.*",56],["fatgirlskinny.net",57],["polska-ie.com",57],["windowsmatters.com",57],["canaltdt.es",58],["masbrooo.com",58],["2ndrun.tv",58],["oncehelp.com",59],["curto.win",59],["smallseotools.com",60],["vidmoly.*",61],["pagalfree.com",61],["pagalworld.us",61],["macwelt.de",62],["pcwelt.de",62],["capital.de",62],["geo.de",62],["allmomsex.com",63],["allnewindianporn.com",63],["analxxxvideo.com",63],["animalextremesex.com",63],["anime3d.xyz",63],["animefuckmovies.com",63],["animepornfilm.com",63],["animesexbar.com",63],["animesexclip.com",63],["animexxxsex.com",63],["animexxxfilms.com",63],["anysex.club",63],["apetube.asia",63],["asianfuckmovies.com",63],["asianfucktube.com",63],["asianporn.sexy",63],["asiansex.*",63],["asiansexcilps.com",63],["beeg.fund",63],["beegvideoz.com",63],["bestasiansex.pro",63],["bravotube.asia",63],["brutalanimalsfuck.com",63],["candyteenporn.com",63],["daddyfuckmovies.com",63],["desifuckonline.com",63],["exclusiveasianporn.com",63],["exteenporn.com",63],["fantasticporn.net",63],["fantasticyoungporn.com",63],["fineasiansex.com",63],["firstasianpussy.com",63],["freeindiansextube.com",63],["freepornasians.com",63],["freerealvideo.com",63],["fuck-beeg.com",63],["fuck-xnxx.com",63],["fuckfuq.com",63],["fuckundies.com",63],["gojapaneseporn.com",63],["golderotica.com",63],["goodyoungsex.com",63],["goyoungporn.com",63],["hardxxxmoms.com",63],["hdvintagetube.com",63],["hentaiporn.me",63],["hentaisexfilms.com",63],["hentaisexuality.com",63],["hot-teens-movies.mobi",63],["hotanimepornvideos.com",63],["hotanimevideos.com",63],["hotasianpussysex.com",63],["hotjapaneseshows.com",63],["hotmaturetube.com",63],["hotmilfs.pro",63],["hotorientalporn.com",63],["hotpornyoung.com",63],["hotxxxjapanese.com",63],["hotxxxpussy.com",63],["indiafree.net",63],["indianpornvideo.online",63],["japanfuck.*",63],["japanporn.*",63],["japanpornclip.com",63],["japanesetube.video",63],["japansex.me",63],["japanesexxxporn.com",63],["japansporno.com",63],["japanxxx.asia",63],["japanxxxworld.com",63],["keezmovies.surf",63],["lingeriefuckvideo.com",63],["liveanimalporn.zooo.club",63],["madhentaitube.com",63],["megahentaitube.com",63],["megajapanesesex.com",63],["megajapantube.com",63],["milfxxxpussy.com",63],["momsextube.pro",63],["momxxxass.com",63],["monkeyanimalporn.com",63],["moviexxx.mobi",63],["newanimeporn.com",63],["newjapanesexxx.com",63],["nicematureporn.com",63],["nudeplayboygirls.com",63],["originalindianporn.com",63],["originalteentube.com",63],["pig-fuck.com",63],["plainasianporn.com",63],["popularasianxxx.com",63],["pornanimetube.com",63],["pornasians.pro",63],["pornhat.asia",63],["pornjapanesesex.com",63],["pornvintage.tv",63],["primeanimesex.com",63],["realjapansex.com",63],["realmomsex.com",63],["redsexhub.com",63],["retroporn.world",63],["retrosexfilms.com",63],["sex-free-movies.com",63],["sexanimesex.com",63],["sexanimetube.com",63],["sexjapantube.com",63],["sexmomvideos.com",63],["sexteenxxxtube.com",63],["sexxxanimal.com",63],["sexyoungtube.com",63],["sexyvintageporn.com",63],["spicyvintageporn.com",63],["sunporno.club",63],["tabooanime.club",63],["teenextrem.com",63],["teenfucksex.com",63],["teenhost.net",63],["teensex.*",63],["teensexass.com",63],["tnaflix.asia",63],["totalfuckmovies.com",63],["totalmaturefuck.com",63],["txxx.asia",63],["vintagetube.*",63],["voyeurpornsex.com",63],["warmteensex.com",63],["wetasiancreampie.com",63],["wildhentaitube.com",63],["wowyoungsex.com",63],["xhamster-art.com",63],["xmovie.pro",63],["xnudevideos.com",63],["xnxxjapon.com",63],["xpics.me",63],["xvide.me",63],["xxxanimefuck.com",63],["xxxanimevideos.com",63],["xxxanimemovies.com",63],["xxxhentaimovies.com",63],["xxxhothub.com",63],["xxxjapaneseporntube.com",63],["xxxlargeporn.com",63],["xxxmomz.com",63],["xxxmovies.*",63],["xxxpornmilf.com",63],["xxxpussyclips.com",63],["xxxpussysextube.com",63],["xxxretrofuck.com",63],["xxxsex.pro",63],["xxxsexyjapanese.com",63],["xxxteenyporn.com",63],["xxxvideo.asia",63],["xxxyoungtv.com",63],["youjizzz.club",63],["youngpussyfuck.com",63],["bayimg.com",64],["celeb.gate.cc",65],["kinoger.re",66],["usersdrive.com",66],["desi.upn.bio",66],["zooqle.*",67],["masterplayer.xyz",68],["pussy-hub.com",68],["porndex.com",69],["compucalitv.com",70],["hdfull.*",71],["diariodenavarra.es",72],["mangamanga.*",73],["streameast.*",74],["thestreameast.*",74],["pennlive.com",75],["beautypageants.indiatimes.com",76],["01fmovies.com",77],["vev.*",78],["vidop.*",78],["lnk2.cc",79],["fullhdxxx.com",80],["classicpornbest.com",80],["www-daftarharga.blogspot.com",[80,140]],["1youngteenporn.com",80],["miraculous.to",[80,194]],["vtube.to",80],["zone-telechargement.*",80],["xstory-fr.com",80],["gosexpod.com",81],["tubepornclassic.com",82],["otakukan.com",83],["xcafe.com",84],["pornfd.com",84],["venusarchives.com",84],["imagehaha.com",85],["imagenpic.com",85],["imageshimage.com",85],["imagetwist.com",85],["megalink.*",86],["k1nk.co",86],["watchasians.cc",86],["lulustream.com",86],["lulustream.live",86],["luluvdo.com",86],["vibestreams.*",86],["gmx.*",87],["web.de",87],["news18.com",88],["thelanb.com",89],["dropmms.com",89],["softwaredescargas.com",90],["cracking-dz.com",91],["im9.eu",91],["mega1080p.*",92],["anitube.*",92],["gazzetta.it",93],["9hentai.*",94],["gnula.*",95],["dziennikbaltycki.pl",96],["dzienniklodzki.pl",96],["dziennikpolski24.pl",96],["dziennikzachodni.pl",96],["echodnia.eu",96],["expressbydgoski.pl",96],["expressilustrowany.pl",96],["gazetakrakowska.pl",96],["gazetalubuska.pl",96],["gazetawroclawska.pl",96],["gk24.pl",96],["gloswielkopolski.pl",96],["gol24.pl",96],["gp24.pl",96],["gra.pl",96],["gs24.pl",96],["kurierlubelski.pl",96],["motofakty.pl",96],["naszemiasto.pl",96],["nowiny24.pl",96],["nowosci.com.pl",96],["nto.pl",96],["polskatimes.pl",96],["pomorska.pl",96],["poranny.pl",96],["sportowy24.pl",96],["strefaagro.pl",96],["strefabiznesu.pl",96],["stronakobiet.pl",96],["telemagazyn.pl",96],["to.com.pl",96],["wspolczesna.pl",96],["courseclub.me",96],["azrom.net",96],["alttyab.net",96],["esopress.com",96],["nesiaku.my.id",96],["onemanhua.com",97],["freeindianporn.mobi",97],["dr-farfar.com",98],["boyfriendtv.com",99],["brandstofprijzen.info",100],["netfuck.net",101],["gaypornhdfree.*",101],["nulljungle.com",101],["kisahdunia.com",101],["cinemakottaga.*",101],["privatemoviez.*",101],["sqlserveregitimleri.com",101],["tutcourse.com",101],["iimanga.com",101],["tremamnon.com",101],["423down.com",101],["jugomobile.com",101],["freecodezilla.net",101],["apkmaven.*",101],["iconmonstr.com",101],["rbxscripts.net",101],["comentariodetexto.com",101],["wordpredia.com",101],["allfaucet.xyz",[101,109]],["replica-watch.info",101],["alludemycourses.com",101],["kayifamilytv.com",101],["interfans.org",101],["iir.ai",102],["popcornstream.*",103],["qpython.club",104],["dktechnicalmate.com",104],["recipahi.com",104],["e9china.net",105],["ontools.net",105],["marketbeat.com",106],["hentaipornpics.net",107],["jobzhub.store",108],["fitdynamos.com",108],["labgame.io",108],["ohionowcast.info",109],["wiour.com",109],["bitzite.com",[109,114,115]],["appsbull.com",109],["diudemy.com",109],["maqal360.com",[109,117,118]],["bitcotasks.com",109],["videolyrics.in",109],["manofadan.com",109],["cempakajaya.com",109],["tagecoin.com",109],["naijafav.top",109],["ourcoincash.xyz",109],["claimcoins.site",109],["cryptosh.pro",109],["eftacrypto.com",109],["earnhub.net",109],["kiddyshort.com",109],["tronxminer.com",109],["neverdims.com",109],["homeairquality.org",110],["cety.app",[111,112]],["exego.app",111],["cutlink.net",111],["cutyurls.com",111],["cutty.app",111],["cutnet.net",111],["jixo.online",111],["cuty.me",112],["exnion.com",112],["upfion.com",[112,129]],["upfiles.app",[112,129]],["upfiles-urls.com",[112,129]],["pahe.ink",112],["pawastreams.pro",112],["vikingf1le.us.to",112],["gamerxyt.com",112],["up4stream.com",112],["ups2up.fun",112],["adcrypto.net",113],["admediaflex.com",113],["aduzz.com",113],["bitcrypto.info",113],["cdrab.com",113],["datacheap.io",113],["hbz.us",113],["savego.org",113],["owsafe.com",113],["sportweb.info",113],["gfx-station.com",114],["buzzheavier.com",115],["flashbang.sh",115],["trashbytes.net",115],["aiimgvlog.fun",116],["6indianporn.com",116],["amateurebonypics.com",116],["amateuryoungpics.com",116],["amigosporn.top",116],["cinemabg.net",116],["desimmshd.com",116],["everia.club",116],["frauporno.com",116],["freepdfcomic.eu",116],["givemeaporn.com",116],["hitomi.la",116],["jav-asia.top",116],["javfull.net",116],["javideo.net",116],["javsunday.com",116],["kr18plus.com",116],["luscious.net",116],["missavtv.com",116],["pilibook.com",116],["pornborne.com",116],["porngrey.com",116],["pornktube.*",116],["pornx.tube",116],["qqxnxx.com",116],["sexvideos.host",116],["submilf.com",116],["subtaboo.com",116],["tktube.com",116],["watchseries.*",116],["xfrenchies.com",116],["rule34ai.*",116],["moderngyan.com",119],["sattakingcharts.in",119],["bgmi32bitapk.in",119],["bankshiksha.in",119],["earn.mpscstudyhub.com",119],["earn.quotesopia.com",119],["money.quotesopia.com",119],["best-mobilegames.com",119],["learn.moderngyan.com",119],["bharatsarkarijobalert.com",119],["quotesopia.com",119],["creditsgoal.com",119],["coingraph.us",120],["momo-net.com",120],["milfnut.*",120],["maxgaming.fi",120],["cybercityhelp.in",121],["tpi.li",122],["oii.la",122],["travel.vebma.com",123],["cloud.majalahhewan.com",123],["crm.cekresi.me",123],["ai.tempatwisata.pro",123],["shrinkme.*",124],["shrinke.*",124],["mrproblogger.com",124],["themezon.net",124],["dagensnytt.com",124],["azmath.info",125],["azsoft.*",125],["downfile.site",125],["downphanmem.com",125],["expertvn.com",125],["memangbau.com",125],["trangchu.news",125],["aztravels.net",125],["ielts-isa.edu.vn",125],["techedubyte.com",[125,241,242]],["jpopsingles.eu",125],["aipebel.com",125],["link.paid4link.com",[126,127]],["driveup.space",128],["crypt.cybar.xyz",128],["dynamicminister.net",128],["gofirmware.com",128],["national-park.com",128],["forgee.xyz",128],["gamehub.cam",128],["mirrored.to",128],["cutyion.com",129],["weshare.is",131],["file.gocmod.com",131],["filespayouts.com",132],["smashyplayer.top",132],["upns.*",132],["hdhub4u.fail",133],["moviesubtitles.click",133],["telegratuita.com",133],["camarchive.tv",134],["flixbaba.*",134],["gntai.*",134],["grantorrent.*",134],["hentai2read.com",134],["icyporno.com",134],["illink.net",134],["javtiful.com",134],["m-hentai.net",134],["mejortorrent.*",134],["mejortorrento.*",134],["mejortorrents.*",134],["mejortorrents1.*",134],["mejortorrentt.*",134],["pornblade.com",134],["pornfelix.com",134],["pornxxxxtube.net",134],["redwap.me",134],["redwap2.com",134],["redwap3.com",134],["sunporno.com",134],["ver-comics-porno.com",134],["ver-mangas-porno.com",134],["x-fetish.tube",134],["x-tg.tube",134],["x-video.tube",134],["xanimeporn.com",134],["xemphim1.top",134],["xxxvideohd.net",134],["zetporn.com",134],["gofile.download",134],["simpcity.*",135],["gameofporn.com",136],["0dramacool.net",137],["0gomovie.*",137],["0gomovies.*",137],["185.53.88.104",137],["185.53.88.204",137],["185.53.88.15",137],["123moviefree.*",137],["1kmovies.*",137],["1madrasdub.*",137],["1primewire.*",137],["2embed.*",[137,235]],["2madrasdub.*",137],["2umovies.*",137],["4anime.*",137],["9animetv.to",137],["aagmaal.com",137],["abysscdn.com",137],["adblockplustape.*",137],["ajkalerbarta.com",137],["altadefinizione01.*",137],["androidapks.biz",137],["androidsite.net",137],["animeonlinefree.org",137],["animesite.net",137],["animespank.com",137],["aniworld.to",137],["apkmody.io",137],["appsfree4u.com",137],["atomixhq.*",137],["awafim.tv",137],["beinmatch.*",137],["bengalisite.com",137],["brmovies.*",137],["ch-play.com",137],["cima4u.*",137],["clickforhire.com",137],["clicknupload.*",137],["cloudy.pk",137],["cmovies.*",137],["computercrack.com",137],["coolcast2.com",137],["crackedsoftware.biz",137],["crackfree.org",137],["cricfree.*",137],["crichd.*",137],["cryptoblog24.info",137],["cuatrolatastv.blogspot.com",137],["cydiasources.net",137],["decmelfot.xyz",137],["dirproxy.com",137],["dood.*",137],["dopebox.to",137],["downloadapk.info",137],["downloadapps.info",137],["downloadgames.info",137],["downloadmusic.info",137],["downloadsite.org",137],["downloadwella.com",137],["ebooksite.org",137],["educationtips213.blogspot.com",137],["egyup.live",137],["embed.meomeo.pw",137],["embed.scdn.to",137],["emulatorsite.com",137],["f1stream.*",137],["fakedetail.com",137],["faselhd.*",137],["fbstream.*",137],["fclecteur.com",137],["filemoon.*",137],["filepress.*",[137,221]],["filmlinks4u.*",137],["filmpertutti.*",137],["filmyzilla.*",137],["flexyhit.com",137],["fmovies.*",137],["freeflix.info",137],["freemoviesu4.com",137],["freeplayervideo.com",137],["freesoccer.net",137],["fseries.org",137],["fzlink.*",137],["gamefast.org",137],["gamesite.info",137],["gettapeads.com",137],["gmanga.me",137],["gocast123.me",137],["gofilms4u.*",137],["gogoanime.*",137],["gomoviz.*",137],["gooplay.net",137],["gostreamon.net",137],["harimanga.com",137],["hdmoviefair.*",137],["hdmovies4u.*",137],["hdmovies50.*",137],["hdmoviesfair.*",137],["healthnewsreel.com",137],["hexupload.net",137],["hh3dhay.*",137],["hinatasoul.com",137],["hindilinks4u.*",137],["hindisite.net",137],["holymanga.net",137],["hotmasti.*",137],["hurawatch.*",137],["hxfile.co",137],["isosite.org",137],["iv-soft.com",137],["januflix.expert",137],["jewelry.com.my",137],["johnwardflighttraining.com",137],["kabarportal.com",137],["klmanga.*",137],["klubsports.*",137],["kstorymedia.com",137],["la123movies.org",137],["lespassionsdechinouk.com",137],["libertestreamvf.*",137],["lilymanga.net",137],["linksdegrupos.com.br",137],["linkz.wiki",137],["livetvon.*",137],["livestreamtv.pk",137],["macsite.info",137],["manga1000.*",137],["manga1001.*",137],["mangaraw.*",137],["mangarawjp.*",137],["mangasite.org",137],["manhuascan.com",137],["megamovies.org",137],["mlbstream.*",137],["moddroid.com",137],["motogpstream.*",137],["movi.pk",[137,171]],["moviefree2.com",137],["movierulz.*",137],["movies123.*",137],["movies-watch.com.pk",137],["moviesden.*",137],["moviesite.app",137],["moviesonline.fm",137],["moviesx.org",137],["moviezaddiction.*",137],["musicsite.biz",137],["myfernweh.com",137],["myviid.com",137],["nazarickol.com",137],["nbastream.*",137],["netcine.*",137],["nflstream.*",137],["nhlstream.*",137],["noob4cast.com",137],["oko.sh",137],["onlinewatchmoviespk.*",137],["orangeink.pk",137],["pahaplayers.click",137],["patchsite.net",137],["pctfenix.*",137],["pctnew.*",137],["pdfsite.net",137],["pksmovies.*",137],["play1002.com",137],["player-cdn.com",137],["plyjam.*",137],["plylive.*",137],["pogolinks.*",137],["popcorntime.*",137],["poscitech.*",137],["productkeysite.com",137],["projectfreetv.one",137],["romsite.org",137],["rugbystreams.*",137],["rytmp3.io",137],["send.cm",137],["seriesite.net",137],["seriezloaded.com.ng",137],["serijehaha.com",137],["sflix.*",137],["shrugemojis.com",137],["siteapk.net",137],["siteflix.org",137],["sitegames.net",137],["sitekeys.net",137],["sitepdf.com",137],["sitesunblocked.*",137],["sitetorrent.com",137],["softwaresite.net",137],["solarmovies.*",137],["sportbar.live",137],["sportcast.*",137],["sportskart.*",137],["sports-stream.*",137],["ssyoutube.com",137],["stardima.com",137],["stream4free.live",137],["streaming-french.*",137],["streamers.*",137],["streamingcommunity.*",[137,207]],["superapk.org",137],["supermovies.org",137],["t20cup.*",137],["tainio-mania.online",137],["talaba.su",137],["tamilguns.org",137],["tatabrada.tv",137],["techtrendmakers.com",137],["tennisstreams.*",137],["thememypc.net",137],["thripy.com",137],["torrentdosfilmes.*",137],["toonanime.*",137],["travelplanspro.com",137],["tusfiles.com",137],["tvonlinesports.com",137],["tvply.*",137],["ufcstream.*",137],["ultramovies.org",137],["uploadbank.com",137],["uptomega.*",137],["uqload.*",137],["urdubolo.pk",137],["vudeo.*",137],["vidoo.*",137],["vidspeeds.com",137],["vipboxtv.*",137],["viprow.*",137],["warezsite.net",137],["watchmovies2.com",137],["watchsite.net",137],["watchsouthpark.tv",137],["web.livecricket.is",137],["webseries.club",137],["y2mate.com",137],["yesmovies.*",137],["yomovies.*",137],["yomovies1.*",137],["youapk.net",137],["youtube4kdownloader.com",137],["yt2mp3s.*",137],["yts-subs.com",137],["kat.*",137],["katbay.*",137],["kickass.*",137],["kickasshydra.*",137],["kickasskat.*",137],["kickass2.*",137],["kickasstorrents.*",137],["kat2.*",137],["kattracker.*",137],["thekat.*",137],["thekickass.*",137],["kickassz.*",137],["kickasstorrents2.*",137],["topkickass.*",137],["kickassgo.*",137],["kkickass.*",137],["kkat.*",137],["kickasst.*",137],["kick4ss.*",137],["cineb.rs",138],["moviesjoyhd.to",138],["rawkuma.com",[138,187]],["nekolink.site",139],["arcadepunks.com",141],["advantien.com",142],["bailbondsfinder.com",142],["bigpiecreative.com",142],["childrenslibrarylady.com",142],["classifarms.com",142],["comtasq.ca",142],["crone.es",142],["ctrmarketingsolutions.com",142],["dropnudes.com",142],["ftuapps.dev",142],["gendatabase.com",142],["ghscanner.com",142],["grsprotection.com",142],["gruporafa.com.br",142],["inmatefindcalifornia.com",142],["inmatesearchidaho.com",142],["itsonsitetv.com",142],["mfmfinancials.com",142],["myproplugins.com",142],["nurulislam.org",142],["onehack.us",142],["ovester.com",142],["paste.bin.sx",142],["privatenudes.com",142],["renoconcrete.ca",142],["richieashbeck.com",142],["sat.technology",142],["short1ink.com",142],["stpm.co.uk",142],["wegotcookies.co",142],["mathcrave.com",142],["vip-box.app",142],["filmyzones.com",143],["gamer18.net",143],["pornflixhd.com",143],["androidpolice.com",144],["cbr.com",144],["gamerant.com",144],["howtogeek.com",144],["thegamer.com",144],["winfuture.de",145],["mixdrp.*",146],["iplark.com",147],["komikdewasa.art",148],["wirtualnemedia.pl",149],["daemon-hentai.com",[150,151]],["daemonanime.net",[152,153]],["canlikolik.my",154],["flight-report.com",155],["vulture.com",156],["megaplayer.bokracdn.run",157],["hentaistream.com",158],["siteunblocked.info",159],["larvelfaucet.com",160],["feyorra.top",160],["claimtrx.com",160],["pagalmovies.*",161],["7starhd.*",161],["jalshamoviez.*",161],["moviesyug.net",161],["9xupload.*",161],["bdupload.*",161],["rdxhd1.*",161],["parispi.net",162],["hentaicloud.com",163],["nuvid.*",163],["tio.ch",164],["lavanguardia.com",164],["news.bg",[164,236]],["tu.no",164],["paperzonevn.com",165],["dailyvideoreports.net",166],["lewd.ninja",167],["niusdiario.es",168],["playporngames.com",169],["descargatepelis.com",169],["gamedrive.org",169],["javx.*",169],["savelinks.*",169],["kungfutv.net",169],["freemagazines.top",170],["freepreset.net",170],["moviessources.*",172],["haho.moe",173],["novelmultiverse.com",174],["mylegalporno.com",175],["embedsports.me",176],["embedstream.me",176],["reliabletv.me",176],["guardaserie.*",177],["cine-calidad.*",178],["foxhq.com",179],["xnxx.*",180],["xvideos.*",180],["thecut.com",181],["novelism.jp",182],["alphapolis.co.jp",183],["game3rb.com",184],["javhub.net",184],["thotvids.com",185],["tokuzilla.net",185],["tokuzl.net",185],["berklee.edu",186],["imeteo.sk",188],["youtubemp3donusturucu.net",189],["videovard.*",190],["cluset.com",191],["homemoviestube.com",191],["sexseeimage.com",191],["warddogs.com",192],["alueviesti.fi",193],["kiuruvesilehti.fi",193],["lempaala.ideapark.fi",193],["olutposti.fi",193],["urjalansanomat.fi",193],["tainhanhvn.com",195],["titantv.com",196],["cocomanga.com",197],["animelatinohd.com",197],["buondua.com",198],["crunchyscan.fr",199],["m.liputan6.com",201],["stardewids.com",[201,218]],["ingles.com",202],["spanishdict.com",202],["surfline.com",203],["dongknows.com",204],["amateur8.com",205],["freeporn8.com",205],["maturetubehere.com",205],["corriere.it",206],["oggi.it",206],["apkcombo.com",208],["sponsorhunter.com",209],["novelssites.com",210],["haxina.com",211],["scimagojr.com",211],["myperfectweather.com",211],["torrentmac.net",212],["udvl.com",213],["dlpanda.com",214],["einrichtungsbeispiele.de",215],["weadown.com",216],["molotov.tv",217],["commands.gg",218],["smgplaza.com",219],["freepik.com",220],["sportnews.to",222],["soccershoes.blog",222],["shineads.*",222],["diyphotography.net",223],["bitchesgirls.com",224],["explorecams.com",225],["minecraft.buzz",225],["hiraethtranslation.com",226],["programmingeeksclub.com",227],["diendancauduong.com",228],["androidadult.com",229],["parentcircle.com",230],["h-game18.xyz",231],["wheelofgold.com",232],["davescomputertips.com",233],["historyofroyalwomen.com",233],["motchill.*",234],["lifestyle.bg",236],["topsport.bg",236],["webcafe.bg",236],["freepikdownloader.com",237],["freepasses.org",238],["iusedtobeaboss.com",239],["blogtruyenmoi.com",240],["repretel.com",243],["tubereader.me",243],["graphicget.com",244],["qiwi.gg",[245,246]],["sonixgvn.net",247],["alliptvlinks.com",248],["xvideos.com",249],["xvideos2.com",249],["colourxh.site",250],["fullxh.com",250],["galleryxh.site",250],["megaxh.com",250],["movingxh.world",250],["seexh.com",250],["unlockxh4.com",250],["valuexh.life",250],["xhaccess.com",250],["xhadult2.com",250],["xhadult3.com",250],["xhadult4.com",250],["xhadult5.com",250],["xhamster.*",250],["xhamster1.*",250],["xhamster10.*",250],["xhamster11.*",250],["xhamster12.*",250],["xhamster13.*",250],["xhamster14.*",250],["xhamster15.*",250],["xhamster16.*",250],["xhamster17.*",250],["xhamster18.*",250],["xhamster19.*",250],["xhamster20.*",250],["xhamster2.*",250],["xhamster3.*",250],["xhamster4.*",250],["xhamster42.*",250],["xhamster46.com",250],["xhamster5.*",250],["xhamster7.*",250],["xhamster8.*",250],["xhamsterporno.mx",250],["xhbig.com",250],["xhbranch5.com",250],["xhchannel.com",250],["xhdate.world",250],["xhlease.world",250],["xhmoon5.com",250],["xhofficial.com",250],["xhopen.com",250],["xhplanet1.com",250],["xhplanet2.com",250],["xhreal2.com",250],["xhreal3.com",250],["xhspot.com",250],["xhtotal.com",250],["xhtree.com",250],["xhvictory.com",250],["xhwebsite.com",250],["xhwebsite2.com",250],["xhwebsite5.com",250],["xhwide1.com",250],["xhwide2.com",250],["xhwide5.com",250],["readcomiconline.*",251],["nekopoi.*",252],["ukchat.co.uk",253],["hivelr.com",254],["koyso.*",255],["skidrowcodex.net",256],["takimag.com",257],["digi.no",258],["learn-cpp.org",259],["terashare.co",260],["pornwex.tv",261],["smithsonianmag.com",262],["homesports.net",263],["realmoasis.com",264],["javfc2.xyz",265],["gobankingrates.com",266],["hiddenleaf.to",267],["ronorp.net",268],["gdflix.*",269],["a1movies.*",270],["videovak.com",271],["akirabox.com",272],["akirabox.to",272],["movielinkbd.*",273],["movielinkbd4u.com",273],["ranoz.gg",274],["powcloud.org",275],["purplex.app",276],["maggotdrowning.com",277],["servustv.com",[278,279]],["bilinovel.com",280],["esportstales.com",281],["streamup.ws",282],["pornharlot.net",283],["umatechnology.org",284],["rarbg.how",285],["4live.online",286],["friv.com",287],["rlxoff.com",288],["solobari.it",289],["hydrogen.lat",290],["criollasx.com",291],["pantieshub.net",292],["olamovies.*",293],["embed4me.com",294],["dldokan.store",295],["fastdour.store",295],["kuyhaa.me",296],["myplexi.fr",297],["pelismkvhd.com",298],["perverzija.com",299],["dameungrrr.videoid.baby",300],["pics-view.com",301],["superfastrelease.xyz",302],["idnes.cz",303],["lidovky.cz",303]]);
const exceptionsMap = new Map([["hubdrive.com",[36]],["hubdrive.de",[36]]]);
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
