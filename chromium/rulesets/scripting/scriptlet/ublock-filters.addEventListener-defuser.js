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
const argsList = [["load","includes"],["click","/event_callback=function\\(\\){window\\.location=t\\.getAttribute\\(\"href\"\\)/"],["click","Event"],["click","","elements",".dropdown-menu a[href]"],["load","Object"],["load","hard_block"],["","adb"],["click","showNotice"],["click","ClickHandler"],["load","IsAdblockRequest"],["load","onload"],["","BACK"],["load","(!o)"],["load","(!i)"],["","_0x"],["","Adblock"],["/^(?:click|mousedown)$/","bypassEventsInProxies"],["","open"],["click","exopop"],["/^(?:load|click)$/","popMagic"],["mousedown","popundrInit"],["getexoloader"],["","pop"],["load","creativeLoaded-"],["/^load[A-Za-z]{12,}/"],["","/exo"],["","_blank"],["mousedown","preventDefault"],["load","advertising"],["click","preventDefault"],["load","2000"],["/^(click|mousedown|mousemove|touchstart|touchend|touchmove)/","system.popunder"],["load","adb"],["/^(?:click|mousedown|mousemove|touchstart|touchend|touchmove)$/","system.popunder"],["","'0x"],["load","nextFunction"],["/DOMContentLoaded|load/","y.readyState"],["","history.go"],["/error|canplay/","(t)"],["load","hblocked"],["error","Adblocker"],["DOMContentLoaded","adlinkfly"],["DOMContentLoaded","shortener"],["mousedown","trigger"],["","0x"],["","Pop"],["/^(?:click|mousedown)$/","popunder"],["DOMContentLoaded","preventExit"],["/^(?:click|mousedown)$/","_0x"],["mouseup","_blank"],["click","pop_under"],["load","url"],["load","adverts-top-container"],["","Date"],["DOMContentLoaded","&nbsp"],["click","read_cookie"],["","midRoll"],["click","_0x"],["load","isBlanketFound"],["load","showModal"],["click","trigger"],["mouseout","clientWidth"],["load","download-wrapper"],["load","autoRecov"],["popstate","noPop"],["/^(?:click|mousedown)$/","ppu"],["click","native code"],["click","_blank"],["/^(?:mousedown|mouseup)$/","0x"],["click","popundr"],["click"],["DOMContentLoaded","compupaste"],["mousedown","!!{});"],["DOMContentLoaded","/adblock/i"],["keydown"],["/^/","0x"],["load","PrivateMode"],["scroll","_0x"],["DOMContentLoaded","checkVPN"],["/^(?:click|mousedown|mouseup)$/","di()"],["","'\\'"],["popstate"],["click","my_inter_listen"],["","window.open"],["load","appendChild"],["","bi()"],["","checkTarget"],["click","popunder"],["timeupdate"],["scroll","getElementById"],["load","undefined"],["DOMContentLoaded","scriptwz_url"],["load","0x"],["DOMContentLoaded","btoa"],["adblockActivated"],["click","saveLastEvent"],["click","","elements",".post.movies"],["","show"],["/.?/","popMagic"],["","ads"],["click","interstitial"],["load","antiblock"],["DOMContentLoaded","adsBlocked"],["load",".appendChild"],["","btoa"],["DOMContentLoaded","AdBlock"],["load","blocker"],["mouseleave","NativeDisplayAdID"],["mouseover","event.triggered"],["blur","stopCountdown"],["load","htmls"],["blur","focusOut"],["click","/handleClick|popup/"],["DOMContentLoaded","history.go"],["load","bypass"],["DOMContentLoaded","antiAdBlockerHandler"],["DOMContentLoaded","location.href"],["","popMagic"],["contextmenu","preventDefault"],["visibilitychange","remainingSeconds"],["click","Popunder"],["contextmenu"],["submit","validateForm"],["blur","counter"],["load","doTest"],["DOMContentLoaded","document.documentElement.lang.toLowerCase"],["click","maxclick"],["click","","elements","#get-link-button"],["click","window.open"],["click","shouldOpenPopUp"],["click","adForm"],["blur"],["DOMContentLoaded","script[data-domain="],["click","popMagic"],["","shouldShow"],["","exopop"],["","break;case $."],["mousedown","shown_at"],["/click|mouse/","[native code]","elements","document"],["load","crakPopInParams"],["","focus"],["load","abDetectorPro"],["DOMContentLoaded","src=atob"],["error","blocker"],["load","error-report.com"],["click","pop"],["DOMContentLoaded","adClosedTimestamp"],["click","tampilkanUrl"],["click","openPopunder"],["load",".getComputedStyle"],["","STORAGE2"],["DOMContentLoaded","app_advert"],["message","adsense"],["load","/AdBlock/i"],["/^(?:click|mousedown)$/","latest!=="],["DOMContentLoaded",".ready"],["load","script"],["","/pop|wm|forceClick/"],["load","block"],["","/_0x|localStorage\\.getItem/"],["DOMContentLoaded","adblock"],["click","open"],["error"],["visibilitychange"],["load","/showModal|isBlanketFound/"],["click","shouldShow"],["","/ads|Modal/"],["load","Adblock"],["DOMContentLoaded","window.open"],["DOMContentLoaded","atob"],["","vads"],["devtoolschange"],["beforeunload"],["mouseup","decodeURIComponent"],["/(?:click|touchend)/","_0x"],["","removeChild"],["click","pu_count"],["message"],["","/pop|_blank/"],["click","allclick_Public"],["DOMContentLoaded","/dyn\\.ads|loadAdsDelayed/"],["/touchstart|mousedown|click/","latest"],["blur","native code"],["blur","event.simulate"],["DOMContentLoaded","0x"],["click","overlay"],["scroll","undefined"],["readystatechange","document.removeEventListener"],["scroll","detect"],["click","t(a)"],["mouseup","catch"],["click","clickCount"],["scroll","innerHeight"],["hashchange"],["load","/nextFunction|2000/"],["load","player"],["load","popMagic"],["click","popurl"],["","/open.*_blank/"],["scroll"],["","isBlocking"],["timeupdate","","elements",".quiver-cam-player--ad-not-running.quiver-cam-player--free video"],["load",".innerHTML"],["/click|mousedown/","catch"],["adb"],["click","popName"],["DOMContentLoaded","clientHeight"],["click","window.focus"],["click","event.dispatch"],["load","adblock"],["","Math"],["DOMContentLoaded","popupurls"],["load","XMLHttpRequest"],["load","AdBlocker"],["","showModal"],["","goog"],["","document.body"],["","modal"],["click","adobeModalTestABenabled"],["blur","console.log"],["DOMContentLoaded","adsSrc"],["","AdB"],["load","adSession"],["DOMContentLoaded",".textContent"],["np.detect"],["DOMContentLoaded","document.documentElement.lang"],["DOMContentLoaded","googlesyndication"],["load","popunder"],["DOMContentLoaded",".clientHeight"],["scroll","function(e)"],["DOMContentLoaded","adlinkfly_url"],["load","document.getElementById"],["DOMContentLoaded","daadb_get_data_fetch"],["click","popactive"],["DOMContentLoaded","location.replace"],["load","modal_blocker"],["click","isOpened"],["mousedown","pop.doEvent"],["click","alink"],["load","[native code]"],["load","document.querySelectorAll"],["/adblock/i"],["load","google-analytics"],["","sessionStorage"],["click","/form\\.submit|urlToOpen/"],["DOMContentLoaded","overlays"],["load","ads"],["click","document.createElement"],["click","ShouldShow"],["click","[native code]","elements",".main-wrap"],["click","","elements","a#dlink"],["mousedown","localStorage"],["","adsense"],["click","splashPage"],["load","detect-modal"],["click","localStorage"],["DOMContentLoaded","canRedirect"],["DOMContentLoaded","adb"],["error","/\\{[a-z]\\(e\\)\\}/"],["/touchmove|wheel/","preventDefault()"],["load","showcfkModal"],["click","attached","elements","div[class=\"share-embed-container\"]"],["click","fp-screen"],["DOMContentLoaded","leaderboardAd"],["DOMContentLoaded","fetch"],["click","openPopupForChapter"],["click","doThePop"],["DOMContentLoaded","blockAdBlock"],["click","openDirectLinkAd"],["load","detect"],["DOMContentLoaded","history.pushState"],["DOMContentLoaded","showPopup"],["click","PopUnder"],["click","Ads"],["mouseup","open"],["DOMContentLoaded","adBlockNotice"],["DOMContentLoaded","_0x"],["DOMContentLoaded","detect"],["DOMContentLoaded","Promise"],["DOMContentLoaded","anchor.href"],["click","popupInterval"],["DOMContentLoaded","-banner"],["click","PopURL"],["DOMContentLoaded","checkAdBlocker"],["DOMContentLoaded","determineVisibility"],["DOMContentLoaded","Popunder"],["load","blockAdBlock"],["load","&&"],["click","handlePopup"],["play","openPopunder"],["DOMContentLoaded","navigator"],["click","pingUrl"],["mousedown","scoreUrl"]];
const hostnamesMap = new Map([["japscan.*",0],["cbc.ca",1],["io.google",2],["dukeofed.org",3],["newser.com",4],["sport1.de",5],["timesofindia.indiatimes.com",6],["drrtyr.mx",6],["pinoyalbums.com",6],["multiplayer.it",6],["skidrowreloaded.com",7],["mediafire.com",[8,9]],["kingofdown.com",10],["radiotormentamx.com",10],["limetorrents.*",[10,14]],["king-pes.*",10],["quelleestladifference.fr",10],["depedlps.*",10],["otakuworldsite.blogspot.com",10],["ad-itech.blogspot.com",10],["komikcast.*",10],["unlockapk.com",10],["mobdi3ips.com",10],["socks24.org",10],["idedroidsafelink.*",10],["links-url.*",10],["interviewgig.com",10],["javaguides.net",10],["almohtarif-tech.net",10],["devoloperxda.blogspot.com",10],["zwergenstadt.com",10],["upxin.net",10],["ciudadblogger.com",10],["ke-1.com",10],["bit-shares.com",10],["itdmusics.com",10],["aspdotnet-suresh.com",10],["tudo-para-android.com",10],["zerotopay.com",10],["ak4eg.*",10],["mawsueaa.com",10],["hesgoal-live.io",10],["steanplay.*",11],["bibme.org",12],["citationmachine.net",12],["easybib.com",13],["pahe.*",14],["yts.*",14],["tube8.*",14],["topeuropix.*",14],["vermangasporno.com",14],["moviescounter.*",14],["imgtorrnt.in",14],["picbaron.com",[14,117]],["torrent9.*",14],["desiremovies.*",14],["letmejerk.com",14],["letmejerk2.com",14],["letmejerk3.com",14],["letmejerk4.com",14],["letmejerk5.com",14],["letmejerk6.com",14],["letmejerk7.com",14],["movs4u.*",14],["uwatchfree.*",14],["hydrax.*",14],["4movierulz.*",14],["projectfreetv.*",14],["arabseed.*",14],["btdb.*",[14,53]],["dlapk4all.com",14],["kropic.com",14],["pdfindir.net",14],["brstej.com",14],["topwwnews.com",14],["xsanime.com",14],["vidlo.us",14],["youx.xxx",14],["world4ufree.*",14],["animeindo.asia",14],["streamsport.*",14],["rojadirectatvhd.*",14],["userload.*",14],["badtaste.it",15],["adyou.*",16],["gotporn.com",17],["freepornrocks.com",17],["footybite.to",17],["rargb.to",17],["totalsportek.*",17],["totalsportekhd.com",17],["xn--mlaregvle-02af.nu",17],["realgfporn.com",[18,19]],["fxporn69.*",18],["thisvid.com",19],["xvideos-downloader.net",19],["imgspice.com",20],["vikiporn.com",21],["tnaflix.com",21],["pornomico.com",21],["yourlust.com",21],["hd-easyporn.com",21],["hotpornfile.org",21],["watchfreexxx.net",21],["vintageporntubes.com",21],["angelgals.com",21],["babesexy.com",21],["youlikeboys.com",21],["hentaihere.com",21],["ganstamovies.com",21],["youngleak.com",21],["jizzberry.com",21],["porndollz.com",21],["filmpornofrancais.fr",21],["pictoa.com",[21,44]],["pornohirsch.net",21],["herzporno.*",21],["deinesexfilme.com",21],["einfachtitten.com",21],["halloporno.*",21],["lesbenhd.com",21],["milffabrik.com",21],["porn-monkey.com",21],["porndrake.com",21],["pornhubdeutsch.net",21],["pornoaffe.com",21],["pornodavid.com",21],["pornoente.tv",21],["pornofisch.com",21],["pornofelix.com",21],["pornohammer.com",21],["pornohelm.com",21],["pornoklinge.com",21],["pornotom.com",21],["pornotommy.com",21],["pornovideos-hd.com",21],["pornozebra.com",21],["xhamsterdeutsch.xyz",21],["xnxx-sexfilme.com",21],["adultasianporn.com",21],["nsfwmonster.com",21],["girlsofdesire.org",21],["gaytail.com",21],["fetish-bb.com",21],["rumporn.com",21],["soyoungteens.com",21],["zubby.com",21],["lesbian8.com",21],["gayforfans.com",21],["reifporn.de",21],["javtsunami.com",21],["18tube.sex",21],["xxxextreme.org",21],["amateurs-fuck.com",21],["sex-amateur-clips.com",21],["hentaiworld.tv",21],["dads-banging-teens.com",21],["home-xxx-videos.com",21],["mature-chicks.com",21],["hqbang.com",21],["darknessporn.com",21],["familyporner.com",21],["freepublicporn.com",21],["pisshamster.com",21],["punishworld.com",21],["xanimu.com",21],["tubator.com",21],["hentai2w.com",[21,133]],["pornhd.com",22],["cnnamador.com",[22,31]],["cle0desktop.blogspot.com",22],["turkanime.co",22],["rexporn.*",22],["movies07.*",22],["camclips.tv",[22,45]],["blackpornhq.com",22],["xsexpics.com",22],["ulsex.net",22],["wannafreeporn.com",22],["ytube2dl.com",22],["pornocomics.*",22],["multiup.us",22],["protege-torrent.com",22],["pussyspace.com",[23,24]],["pussyspace.net",[23,24]],["empflix.com",25],["cpmlink.net",26],["bdsmstreak.com",26],["cutpaid.com",26],["pornforrelax.com",26],["fatwhitebutt.com",26],["pornomoll.*",26],["short.pe",27],["gsurl.*",27],["mimaletadepeliculas.*",28],["bs.to",29],["burningseries.*",29],["efukt.com",29],["dz4soft.*",30],["generacionretro.net",30],["nuevos-mu.ucoz.com",30],["yoututosjeff.*",30],["ebookmed.*",30],["lanjutkeun.*",30],["mimaletamusical.blogspot.com",30],["novelasesp.*",30],["visionias.net",30],["singingdalong.*",30],["b3infoarena.in",30],["lurdchinexgist.blogspot.com",30],["thefreedommatrix.blogspot.com",30],["hentai-vl.blogspot.com",30],["projetomotog.blogspot.com",30],["ktmx.pro",30],["lirik3satu.blogspot.com",30],["marketmovers.it",30],["pharmaguideline.com",30],["mixloads.com",30],["mangaromance.eu",30],["interssh.com",30],["freesoftpdfdownload.blogspot.com",30],["myadslink.com",30],["blackavelic.com",30],["doujindesu.*",30],["server.satunivers.tv",30],["flashingjungle.com",31],["ma-x.org",32],["lavozdegalicia.es",32],["ddwloclawek.pl",32],["ki24.info",32],["xmovies8.*",33],["xmovies08.org",34],["freecoursesonline.*",35],["lordpremium.*",35],["mp3fiber.com",[35,48]],["schrauben-normen.de",35],["avengerinator.blogspot.com",35],["novablogitalia.*",35],["link-to.net",35],["hanimesubth.com",35],["gsmturkey.net",35],["anisubindo.*",35],["adshrink.it",35],["presentation-ppt.com",35],["mangacanblog.com",35],["pekalongan-cits.blogspot.com",35],["4tymode.win",35],["linkvertise.com",35],["reifenrechner.at",35],["tire-size-calculator.info",35],["linuxsecurity.com",35],["itsguider.com",35],["cotravinh.blogspot.com",35],["itudong.com",35],["shortx.net",35],["btvsports.*",35],["lecturel.com",35],["bakai.org",35],["nar.k-ba.net",35],["eurotruck2.com.br",35],["tiroalpaloes.com",35],["stream4free.*",35],["tiroalpaloes.net",35],["flixsix.com",35],["tiroalpaloweb.xyz",35],["globaldjmix.com",36],["desiupload.*",[37,159]],["hblinks.pro",37],["hubcdn.vip",37],["hubdrive.*",37],["90fpsconfig.in",37],["katdrive.link",37],["kmhd.net",37],["bollydrive.rest",37],["360news4u.net",37],["hypershort.com",[37,130]],["bollydrive.*",[37,161]],["zazzybabes.com",38],["haaretz.co.il",39],["haaretz.com",39],["slate.com",40],["megalinks.info",41],["megapastes.com",41],["mega-mkv.com",[41,42]],["mkv-pastes.com",41],["zpaste.net",41],["zlpaste.net",41],["9xlinks.site",41],["mega-dvdrip.*",42],["peliculas-dvdrip.*",42],["desbloqueador.*",43],["cine.to",[44,198]],["newpelis.*",[44,51]],["pelix.*",[44,51]],["allcalidad.*",[44,133]],["khatrimaza.*",44],["kissasia.cc",44],["camwhores.*",45],["camwhorestv.*",45],["digjav.com",45],["uproxy.*",45],["videoszoofiliahd.com",46],["xxxtubezoo.com",47],["zooredtube.com",47],["ancensored.com",48],["ganool.*",48],["xrivonet.info",48],["pirate.*",48],["piratebay.*",48],["pirateproxy.*",48],["proxytpb.*",48],["thepiratebay.*",48],["uii.io",49],["porndoe.com",50],["acienciasgalilei.com",52],["playrust.io",53],["payskip.org",54],["short-url.link",55],["tubedupe.com",56],["mirrorace.*",57],["fatgirlskinny.net",58],["polska-ie.com",58],["windowsmatters.com",58],["canaltdt.es",59],["masbrooo.com",59],["2ndrun.tv",59],["oncehelp.com",60],["curto.win",60],["smallseotools.com",61],["mixdrp.*",62],["macwelt.de",63],["pcwelt.de",63],["capital.de",63],["geo.de",63],["allmomsex.com",64],["allnewindianporn.com",64],["analxxxvideo.com",64],["animalextremesex.com",64],["anime3d.xyz",64],["animefuckmovies.com",64],["animepornfilm.com",64],["animesexbar.com",64],["animesexclip.com",64],["animexxxsex.com",64],["animexxxfilms.com",64],["anysex.club",64],["apetube.asia",64],["asianfuckmovies.com",64],["asianfucktube.com",64],["asianporn.sexy",64],["asiansex.*",64],["asiansexcilps.com",64],["beeg.fund",64],["beegvideoz.com",64],["bestasiansex.pro",64],["bravotube.asia",64],["brutalanimalsfuck.com",64],["candyteenporn.com",64],["daddyfuckmovies.com",64],["desifuckonline.com",64],["exclusiveasianporn.com",64],["exteenporn.com",64],["fantasticporn.net",64],["fantasticyoungporn.com",64],["fineasiansex.com",64],["firstasianpussy.com",64],["freeindiansextube.com",64],["freepornasians.com",64],["freerealvideo.com",64],["fuck-beeg.com",64],["fuck-xnxx.com",64],["fuckfuq.com",64],["fuckundies.com",64],["gojapaneseporn.com",64],["golderotica.com",64],["goodyoungsex.com",64],["goyoungporn.com",64],["hardxxxmoms.com",64],["hdvintagetube.com",64],["hentaiporn.me",64],["hentaisexfilms.com",64],["hentaisexuality.com",64],["hot-teens-movies.mobi",64],["hotanimepornvideos.com",64],["hotanimevideos.com",64],["hotasianpussysex.com",64],["hotjapaneseshows.com",64],["hotmaturetube.com",64],["hotmilfs.pro",64],["hotorientalporn.com",64],["hotpornyoung.com",64],["hotxxxjapanese.com",64],["hotxxxpussy.com",64],["indiafree.net",64],["indianpornvideo.online",64],["japanfuck.*",64],["japanporn.*",64],["japanpornclip.com",64],["japanesetube.video",64],["japansex.me",64],["japanesexxxporn.com",64],["japansporno.com",64],["japanxxx.asia",64],["japanxxxworld.com",64],["keezmovies.surf",64],["lingeriefuckvideo.com",64],["liveanimalporn.zooo.club",64],["madhentaitube.com",64],["megahentaitube.com",64],["megajapanesesex.com",64],["megajapantube.com",64],["milfxxxpussy.com",64],["momsextube.pro",64],["momxxxass.com",64],["monkeyanimalporn.com",64],["moviexxx.mobi",64],["newanimeporn.com",64],["newjapanesexxx.com",64],["nicematureporn.com",64],["nudeplayboygirls.com",64],["originalindianporn.com",64],["originalteentube.com",64],["pig-fuck.com",64],["plainasianporn.com",64],["popularasianxxx.com",64],["pornanimetube.com",64],["pornasians.pro",64],["pornhat.asia",64],["pornjapanesesex.com",64],["pornvintage.tv",64],["primeanimesex.com",64],["realjapansex.com",64],["realmomsex.com",64],["redsexhub.com",64],["retroporn.world",64],["retrosexfilms.com",64],["sex-free-movies.com",64],["sexanimesex.com",64],["sexanimetube.com",64],["sexjapantube.com",64],["sexmomvideos.com",64],["sexteenxxxtube.com",64],["sexxxanimal.com",64],["sexyoungtube.com",64],["sexyvintageporn.com",64],["spicyvintageporn.com",64],["sunporno.club",64],["tabooanime.club",64],["teenextrem.com",64],["teenfucksex.com",64],["teenhost.net",64],["teensex.*",64],["teensexass.com",64],["tnaflix.asia",64],["totalfuckmovies.com",64],["totalmaturefuck.com",64],["txxx.asia",64],["vintagetube.*",64],["voyeurpornsex.com",64],["warmteensex.com",64],["wetasiancreampie.com",64],["wildhentaitube.com",64],["wowyoungsex.com",64],["xhamster-art.com",64],["xmovie.pro",64],["xnudevideos.com",64],["xnxxjapon.com",64],["xpics.me",64],["xvide.me",64],["xxxanimefuck.com",64],["xxxanimevideos.com",64],["xxxanimemovies.com",64],["xxxhentaimovies.com",64],["xxxhothub.com",64],["xxxjapaneseporntube.com",64],["xxxlargeporn.com",64],["xxxmomz.com",64],["xxxmovies.*",64],["xxxpornmilf.com",64],["xxxpussyclips.com",64],["xxxpussysextube.com",64],["xxxretrofuck.com",64],["xxxsex.pro",64],["xxxsexyjapanese.com",64],["xxxteenyporn.com",64],["xxxvideo.asia",64],["xxxyoungtv.com",64],["youjizzz.club",64],["youngpussyfuck.com",64],["bayimg.com",65],["celeb.gate.cc",66],["kinoger.re",67],["usersdrive.com",67],["desi.upn.bio",67],["zooqle.*",68],["masterplayer.xyz",69],["pussy-hub.com",69],["porndex.com",70],["compucalitv.com",71],["hdfull.*",72],["diariodenavarra.es",73],["mangamanga.*",74],["streameast.*",75],["thestreameast.*",75],["pennlive.com",76],["beautypageants.indiatimes.com",77],["01fmovies.com",78],["vev.*",79],["vidop.*",79],["lnk2.cc",80],["fullhdxxx.com",81],["classicpornbest.com",81],["www-daftarharga.blogspot.com",[81,140]],["1youngteenporn.com",81],["miraculous.to",[81,193]],["vtube.to",81],["zone-telechargement.*",81],["xstory-fr.com",81],["gosexpod.com",82],["tubepornclassic.com",83],["shemalez.com",83],["otakukan.com",84],["xcafe.com",85],["pornfd.com",85],["venusarchives.com",85],["imagehaha.com",86],["imagenpic.com",86],["imageshimage.com",86],["imagetwist.com",86],["megalink.*",87],["k1nk.co",87],["watchasians.cc",87],["lulustream.com",87],["lulustream.live",87],["luluvdo.com",87],["vibestreams.*",87],["gmx.*",88],["web.de",88],["news18.com",89],["thelanb.com",90],["dropmms.com",90],["softwaredescargas.com",91],["cracking-dz.com",92],["mega1080p.*",93],["anitube.*",93],["gazzetta.it",94],["9hentai.*",95],["gnula.*",96],["dziennikbaltycki.pl",97],["dzienniklodzki.pl",97],["dziennikpolski24.pl",97],["dziennikzachodni.pl",97],["echodnia.eu",97],["expressbydgoski.pl",97],["expressilustrowany.pl",97],["gazetakrakowska.pl",97],["gazetalubuska.pl",97],["gazetawroclawska.pl",97],["gk24.pl",97],["gloswielkopolski.pl",97],["gol24.pl",97],["gp24.pl",97],["gra.pl",97],["gs24.pl",97],["kurierlubelski.pl",97],["motofakty.pl",97],["naszemiasto.pl",97],["nowiny24.pl",97],["nowosci.com.pl",97],["nto.pl",97],["polskatimes.pl",97],["pomorska.pl",97],["poranny.pl",97],["sportowy24.pl",97],["strefaagro.pl",97],["strefabiznesu.pl",97],["stronakobiet.pl",97],["telemagazyn.pl",97],["to.com.pl",97],["wspolczesna.pl",97],["courseclub.me",97],["azrom.net",97],["alttyab.net",97],["esopress.com",97],["nesiaku.my.id",97],["onemanhua.com",98],["freeindianporn.mobi",98],["dr-farfar.com",99],["boyfriendtv.com",100],["brandstofprijzen.info",101],["netfuck.net",102],["gaypornhdfree.*",102],["nulljungle.com",102],["kisahdunia.com",102],["cinemakottaga.*",102],["privatemoviez.*",102],["sqlserveregitimleri.com",102],["tutcourse.com",102],["warddogs.com",102],["iimanga.com",102],["tinhocdongthap.com",102],["tremamnon.com",102],["423down.com",102],["brizzynovel.com",102],["jugomobile.com",102],["freecodezilla.net",102],["apkmaven.*",102],["iconmonstr.com",102],["rbxscripts.net",102],["comentariodetexto.com",102],["wordpredia.com",102],["allfaucet.xyz",[102,110]],["titbytz.tk",102],["replica-watch.info",102],["alludemycourses.com",102],["kayifamilytv.com",102],["interfans.org",102],["iir.ai",103],["popcornstream.*",104],["qpython.club",105],["dktechnicalmate.com",105],["recipahi.com",105],["e9china.net",106],["ontools.net",106],["marketbeat.com",107],["hentaipornpics.net",108],["jobzhub.store",109],["fitdynamos.com",109],["labgame.io",109],["ohionowcast.info",110],["wiour.com",110],["bitzite.com",[110,115,116]],["appsbull.com",110],["diudemy.com",110],["maqal360.com",[110,118,119]],["bitcotasks.com",110],["videolyrics.in",110],["manofadan.com",110],["cempakajaya.com",110],["tagecoin.com",110],["naijafav.top",110],["ourcoincash.xyz",110],["claimcoins.site",110],["cryptosh.pro",110],["eftacrypto.com",110],["fescrypto.com",110],["earnhub.net",110],["kiddyshort.com",110],["tronxminer.com",110],["neverdims.com",110],["homeairquality.org",111],["cety.app",[112,113]],["exego.app",112],["cutlink.net",112],["cutyurls.com",112],["cutty.app",112],["cutnet.net",112],["jixo.online",112],["cuty.me",113],["exnion.com",113],["upfion.com",[113,129]],["upfiles.app",[113,129]],["upfiles-urls.com",[113,129]],["pawastreams.pro",113],["vikingf1le.us.to",113],["gamerxyt.com",113],["up4stream.com",113],["ups2up.fun",113],["championdrive.co",113],["adcrypto.net",114],["admediaflex.com",114],["aduzz.com",114],["bitcrypto.info",114],["cdrab.com",114],["datacheap.io",114],["hbz.us",114],["savego.org",114],["owsafe.com",114],["sportweb.info",114],["gfx-station.com",115],["buzzheavier.com",116],["flashbang.sh",116],["trashbytes.net",116],["aiimgvlog.fun",117],["6indianporn.com",117],["amateurebonypics.com",117],["amateuryoungpics.com",117],["amigosporn.top",117],["cinemabg.net",117],["desimmshd.com",117],["everia.club",117],["frauporno.com",117],["freepdfcomic.eu",117],["givemeaporn.com",117],["hitomi.la",117],["jav-asia.top",117],["javfull.net",117],["javideo.net",117],["javsunday.com",117],["kr18plus.com",117],["luscious.net",117],["missavtv.com",117],["pilibook.com",117],["pornborne.com",117],["porngrey.com",117],["pornktube.*",117],["pornx.tube",117],["qqxnxx.com",117],["sexvideos.host",117],["submilf.com",117],["subtaboo.com",117],["tktube.com",117],["watchseries.*",117],["xfrenchies.com",117],["moderngyan.com",120],["sattakingcharts.in",120],["bgmi32bitapk.in",120],["bankshiksha.in",120],["earn.mpscstudyhub.com",120],["earn.quotesopia.com",120],["money.quotesopia.com",120],["best-mobilegames.com",120],["learn.moderngyan.com",120],["bharatsarkarijobalert.com",120],["quotesopia.com",120],["creditsgoal.com",120],["coingraph.us",121],["momo-net.com",121],["milfnut.*",121],["maxgaming.fi",121],["cybercityhelp.in",122],["travel.vebma.com",123],["cloud.majalahhewan.com",123],["crm.cekresi.me",123],["ai.tempatwisata.pro",123],["pinloker.com",123],["sekilastekno.com",123],["shrinkme.*",124],["shrinke.*",124],["mrproblogger.com",124],["themezon.net",124],["dagensnytt.com",124],["azmath.info",125],["azsoft.*",125],["downfile.site",125],["downphanmem.com",125],["expertvn.com",125],["memangbau.com",125],["trangchu.news",125],["aztravels.net",125],["ielts-isa.edu.vn",125],["techedubyte.com",[125,239,240]],["jpopsingles.eu",125],["aipebel.com",125],["link.paid4link.com",[126,127]],["driveup.space",128],["crypt.cybar.xyz",128],["dynamicminister.net",128],["gofirmware.com",128],["national-park.com",128],["forgee.xyz",128],["gamehub.cam",128],["cutyion.com",129],["weshare.is",131],["file.gocmod.com",131],["hdhub4u.fail",132],["hubdrive.wales",132],["moviesubtitles.click",132],["telegratuita.com",132],["camarchive.tv",133],["flixbaba.*",133],["gntai.*",133],["grantorrent.*",133],["hentai2read.com",133],["icyporno.com",133],["illink.net",133],["javtiful.com",133],["m-hentai.net",133],["mejortorrent.*",133],["mejortorrento.*",133],["mejortorrents.*",133],["mejortorrents1.*",133],["mejortorrentt.*",133],["pornblade.com",133],["pornfelix.com",133],["pornxxxxtube.net",133],["redwap.me",133],["redwap2.com",133],["redwap3.com",133],["sunporno.com",133],["ver-comics-porno.com",133],["ver-mangas-porno.com",133],["x-fetish.tube",133],["x-tg.tube",133],["x-video.tube",133],["xanimeporn.com",133],["xxxvideohd.net",133],["zetporn.com",133],["gofile.download",133],["simpcity.*",134],["gameofporn.com",135],["0dramacool.net",136],["0gomovie.*",136],["0gomovies.*",136],["185.53.88.104",136],["185.53.88.204",136],["185.53.88.15",136],["123moviefree.*",136],["1kmovies.*",136],["1madrasdub.*",136],["1primewire.*",136],["2embed.*",136],["2madrasdub.*",136],["2umovies.*",136],["4anime.*",136],["9animetv.to",136],["aagmaal.com",136],["abysscdn.com",136],["adblockplustape.*",136],["ajkalerbarta.com",136],["altadefinizione01.*",136],["androidapks.biz",136],["androidsite.net",136],["animeonlinefree.org",136],["animesite.net",136],["animespank.com",136],["aniworld.to",136],["apkmody.io",136],["appsfree4u.com",136],["atomixhq.*",136],["audioz.download",136],["awafim.tv",136],["beinmatch.*",136],["bengalisite.com",136],["brmovies.*",136],["ch-play.com",136],["cima4u.*",136],["clickforhire.com",136],["clicknupload.*",136],["cloudy.pk",136],["cmovies.*",136],["computercrack.com",136],["coolcast2.com",136],["crackedsoftware.biz",136],["crackfree.org",136],["cricfree.*",136],["crichd.*",136],["cryptoblog24.info",136],["cuatrolatastv.blogspot.com",136],["cydiasources.net",136],["decmelfot.xyz",136],["dirproxy.com",136],["dood.*",136],["dopebox.to",136],["downloadapk.info",136],["downloadapps.info",136],["downloadgames.info",136],["downloadmusic.info",136],["downloadsite.org",136],["downloadwella.com",136],["ebooksite.org",136],["educationtips213.blogspot.com",136],["egyup.live",136],["embed.meomeo.pw",136],["embed.scdn.to",136],["emulatorsite.com",136],["f1stream.*",136],["fakedetail.com",136],["faselhd.*",136],["fbstream.*",136],["fclecteur.com",136],["filemoon.*",136],["filepress.*",[136,219]],["files.im",136],["filmlinks4u.*",136],["filmpertutti.*",136],["filmyzilla.*",136],["flexyhit.com",136],["fmovies.*",136],["freeflix.info",136],["freemoviesu4.com",136],["freeplayervideo.com",136],["freesoccer.net",136],["french-stream.*",136],["fseries.org",136],["fzlink.*",136],["gamefast.org",136],["gamesite.info",136],["gettapeads.com",136],["gmanga.me",136],["gocast123.me",136],["gofilms4u.*",136],["gogoanime.*",136],["gomoviz.*",136],["gooplay.net",136],["gostreamon.net",136],["harimanga.com",136],["hdmoviefair.*",136],["hdmovies4u.*",136],["hdmovies50.*",136],["hdmoviesfair.*",136],["healthnewsreel.com",136],["hexupload.net",136],["hh3dhay.*",136],["hinatasoul.com",136],["hindilinks4u.*",136],["hindisite.net",136],["holymanga.net",136],["hotmasti.*",136],["hurawatch.*",136],["hxfile.co",136],["isosite.org",136],["iv-soft.com",136],["januflix.expert",136],["jewelry.com.my",136],["johnwardflighttraining.com",136],["kabarportal.com",136],["klmanga.*",136],["klubsports.*",136],["kstorymedia.com",136],["la123movies.org",136],["lespassionsdechinouk.com",136],["libertestreamvf.*",136],["lilymanga.net",136],["linksdegrupos.com.br",136],["linkz.wiki",136],["livetvon.*",136],["livestreamtv.pk",136],["macsite.info",136],["manga1000.*",136],["manga1001.*",136],["mangaraw.*",136],["mangarawjp.*",136],["mangasite.org",136],["manhuascan.com",136],["megamovies.org",136],["mlbstream.*",136],["moddroid.com",136],["motogpstream.*",136],["movi.pk",[136,170]],["moviefree2.com",136],["movierulz.*",136],["movies123.*",136],["movies-watch.com.pk",136],["movies2watch.*",136],["moviesden.*",136],["moviesite.app",136],["moviesonline.fm",136],["moviesx.org",136],["moviezaddiction.*",136],["musicsite.biz",136],["myfernweh.com",136],["myviid.com",136],["nazarickol.com",136],["nbastream.*",136],["netcine.*",136],["nflstream.*",136],["nhlstream.*",136],["noob4cast.com",136],["oko.sh",136],["onlinewatchmoviespk.*",136],["orangeink.pk",136],["pahaplayers.click",136],["patchsite.net",136],["pctfenix.*",136],["pctnew.*",136],["pdfsite.net",136],["pksmovies.*",136],["play1002.com",136],["player-cdn.com",136],["plyjam.*",136],["plylive.*",136],["pogolinks.*",136],["popcorntime.*",136],["poscitech.*",136],["productkeysite.com",136],["projectfreetv.one",136],["romsite.org",136],["rugbystreams.*",136],["rytmp3.io",136],["send.cm",136],["seriesite.net",136],["seriezloaded.com.ng",136],["serijehaha.com",136],["shahed4u.*",136],["sflix.*",136],["shrugemojis.com",136],["siteapk.net",136],["siteflix.org",136],["sitegames.net",136],["sitekeys.net",136],["sitepdf.com",136],["sitesunblocked.*",136],["sitetorrent.com",136],["softwaresite.net",136],["solarmovies.*",136],["sportbar.live",136],["sportcast.*",136],["sportskart.*",136],["sports-stream.*",136],["ssyoutube.com",136],["stardima.com",136],["stream4free.live",136],["streaming-french.*",136],["streamers.*",136],["streamingcommunity.*",[136,205]],["superapk.org",136],["supermovies.org",136],["t20cup.*",136],["tainio-mania.online",136],["talaba.su",136],["tamilguns.org",136],["tatabrada.tv",136],["techtrendmakers.com",136],["tennisstreams.*",136],["thememypc.net",136],["thripy.com",136],["torrentdosfilmes.*",136],["toonanime.*",136],["travelplanspro.com",136],["tusfiles.com",136],["tvonlinesports.com",136],["tvply.*",136],["ufcstream.*",136],["ultramovies.org",136],["uploadbank.com",136],["uptomega.*",136],["uqload.*",136],["urdubolo.pk",136],["vudeo.*",136],["vidoo.*",136],["vidspeeds.com",136],["vipboxtv.*",136],["viprow.*",136],["warezsite.net",136],["watchmovies2.com",136],["watchsite.net",136],["watchsouthpark.tv",136],["web.livecricket.is",136],["webseries.club",136],["y2mate.com",136],["yesmovies.*",136],["yomovies.*",136],["yomovies1.*",136],["youapk.net",136],["youtube4kdownloader.com",136],["yt2mp3s.*",136],["yts-subs.com",136],["kat.*",136],["katbay.*",136],["kickass.*",136],["kickasshydra.*",136],["kickasskat.*",136],["kickass2.*",136],["kickasstorrents.*",136],["kat2.*",136],["kattracker.*",136],["thekat.*",136],["thekickass.*",136],["kickassz.*",136],["kickasstorrents2.*",136],["topkickass.*",136],["kickassgo.*",136],["kkickass.*",136],["kkat.*",136],["kickasst.*",136],["kick4ss.*",136],["cineb.rs",137],["moviesjoyhd.to",137],["rawkuma.com",[137,187]],["nekolink.site",138],["foxhq.com",139],["advantien.com",141],["bailbondsfinder.com",141],["bg-gledai.*",141],["bigpiecreative.com",141],["childrenslibrarylady.com",141],["classifarms.com",141],["comtasq.ca",141],["crone.es",141],["ctrmarketingsolutions.com",141],["dropnudes.com",141],["ftuapps.dev",141],["gendatabase.com",141],["ghscanner.com",141],["gledaitv.*",141],["grsprotection.com",141],["gruporafa.com.br",141],["inmatefindcalifornia.com",141],["inmatesearchidaho.com",141],["itsonsitetv.com",141],["mfmfinancials.com",141],["myproplugins.com",141],["nurulislam.org",141],["onehack.us",141],["ovester.com",141],["paste.bin.sx",141],["privatenudes.com",141],["renoconcrete.ca",141],["richieashbeck.com",141],["sat.technology",141],["short1ink.com",141],["stpm.co.uk",141],["wegotcookies.co",141],["mathcrave.com",141],["vip-box.app",141],["filmyzones.com",142],["gamer18.net",142],["pornflixhd.com",142],["androidpolice.com",143],["cbr.com",143],["gamerant.com",143],["howtogeek.com",143],["thegamer.com",143],["winfuture.de",144],["emturbovid.com",145],["findjav.com",145],["javggvideo.xyz",145],["mmtv01.xyz",145],["stbturbo.xyz",145],["trailerhg.xyz",145],["turboplayers.xyz",145],["iplark.com",146],["komikdewasa.art",147],["daemon-hentai.com",[148,149]],["daemonanime.net",[150,151]],["canlikolik.my",152],["flight-report.com",153],["vulture.com",154],["megaplayer.bokracdn.run",155],["hentaistream.com",156],["siteunblocked.info",157],["larvelfaucet.com",158],["feyorra.top",158],["claimtrx.com",158],["pagalmovies.*",159],["7starhd.*",159],["jalshamoviez.*",159],["moviesyug.net",159],["9xupload.*",159],["bdupload.*",159],["rdxhd1.*",159],["parispi.net",160],["hentaicloud.com",161],["nuvid.*",161],["tio.ch",162],["lavanguardia.com",162],["news.bg",[162,234]],["tu.no",162],["paperzonevn.com",163],["dailyvideoreports.net",164],["lewd.ninja",165],["systemnews24.com",166],["niusdiario.es",167],["playporngames.com",168],["descargatepelis.com",168],["javx.*",168],["kungfutv.net",168],["freemagazines.top",169],["freepreset.net",169],["moviessources.*",171],["cutesexyteengirls.com",172],["haho.moe",173],["nicy-spicy.pw",174],["novelmultiverse.com",175],["mylegalporno.com",176],["embedsports.me",177],["embedstream.me",177],["jumbtv.com",177],["reliabletv.me",177],["guardaserie.*",178],["cine-calidad.*",179],["xnxx.com",180],["xvideos.*",180],["thecut.com",181],["novelism.jp",182],["alphapolis.co.jp",183],["game3rb.com",184],["javhub.net",184],["thotvids.com",185],["tokuzilla.net",185],["tokuzl.net",185],["berklee.edu",186],["imeteo.sk",188],["youtubemp3donusturucu.net",189],["videovard.*",190],["cluset.com",191],["homemoviestube.com",191],["sexseeimage.com",191],["alueviesti.fi",192],["kiuruvesilehti.fi",192],["lempaala.ideapark.fi",192],["olutposti.fi",192],["urjalansanomat.fi",192],["tainhanhvn.com",194],["titantv.com",195],["cocomanga.com",196],["animelatinohd.com",196],["buondua.com",197],["m.liputan6.com",199],["stardewids.com",[199,216]],["ingles.com",200],["spanishdict.com",200],["surfline.com",201],["dongknows.com",202],["amateur8.com",203],["freeporn8.com",203],["maturetubehere.com",203],["corriere.it",204],["oggi.it",204],["apkcombo.com",206],["sponsorhunter.com",207],["novelssites.com",208],["haxina.com",209],["scimagojr.com",209],["myperfectweather.com",209],["torrentmac.net",210],["udvl.com",211],["dlpanda.com",212],["einrichtungsbeispiele.de",213],["weadown.com",214],["molotov.tv",215],["commands.gg",216],["smgplaza.com",217],["freepik.com",218],["sportnews.to",220],["soccershoes.blog",220],["shineads.*",220],["diyphotography.net",221],["bitchesgirls.com",222],["cdn.bg-gledai.*",223],["cdn.gledaitv.*",223],["explorecams.com",224],["minecraft.buzz",224],["hiraethtranslation.com",225],["programmingeeksclub.com",226],["diendancauduong.com",227],["androidadult.com",228],["parentcircle.com",229],["h-game18.xyz",230],["wheelofgold.com",231],["davescomputertips.com",232],["historyofroyalwomen.com",232],["motchill.*",233],["lifestyle.bg",234],["topsport.bg",234],["webcafe.bg",234],["freepikdownloader.com",235],["freepasses.org",236],["iusedtobeaboss.com",237],["blogtruyenmoi.com",238],["repretel.com",241],["tubereader.me",241],["graphicget.com",242],["qiwi.gg",[243,244]],["sonixgvn.net",245],["alliptvlinks.com",246],["smashyplayer.top",247],["upns.*",247],["xvideos.com",248],["xvideos2.com",248],["colourxh.site",249],["fullxh.com",249],["galleryxh.site",249],["megaxh.com",249],["movingxh.world",249],["seexh.com",249],["unlockxh4.com",249],["valuexh.life",249],["xhaccess.com",249],["xhadult2.com",249],["xhadult3.com",249],["xhadult4.com",249],["xhadult5.com",249],["xhamster.*",249],["xhamster1.*",249],["xhamster10.*",249],["xhamster11.*",249],["xhamster12.*",249],["xhamster13.*",249],["xhamster14.*",249],["xhamster15.*",249],["xhamster16.*",249],["xhamster17.*",249],["xhamster18.*",249],["xhamster19.*",249],["xhamster20.*",249],["xhamster2.*",249],["xhamster3.*",249],["xhamster4.*",249],["xhamster42.*",249],["xhamster46.com",249],["xhamster5.*",249],["xhamster7.*",249],["xhamster8.*",249],["xhamsterporno.mx",249],["xhbig.com",249],["xhbranch5.com",249],["xhchannel.com",249],["xhdate.world",249],["xhlease.world",249],["xhmoon5.com",249],["xhofficial.com",249],["xhopen.com",249],["xhplanet1.com",249],["xhplanet2.com",249],["xhreal2.com",249],["xhreal3.com",249],["xhspot.com",249],["xhtotal.com",249],["xhtree.com",249],["xhvictory.com",249],["xhwebsite.com",249],["xhwebsite2.com",249],["xhwebsite5.com",249],["xhwide1.com",249],["xhwide2.com",249],["xhwide5.com",249],["katfile.com",250],["readcomiconline.*",251],["nekopoi.*",252],["ukchat.co.uk",253],["hivelr.com",254],["koyso.*",255],["skidrowcodex.net",256],["takimag.com",257],["digi.no",258],["twi-fans.com",259],["learn-cpp.org",260],["terashare.co",261],["pornwex.tv",262],["smithsonianmag.com",263],["homesports.net",264],["realmoasis.com",265],["javfc2.xyz",266],["gobankingrates.com",267],["hiddenleaf.to",268],["ronorp.net",269],["gdflix.*",270],["a1movies.*",271],["videovak.com",272],["akirabox.com",273],["purplex.app",274],["maggotdrowning.com",275],["bilinovel.com",276],["esportstales.com",277],["streamup.ws",278],["pagalfree.com",279],["pagalworld.us",279],["pornharlot.net",280],["umatechnology.org",281],["rarbg.how",282],["4live.online",283],["friv.com",284],["rlxoff.com",285],["solobari.it",286],["hydrogen.lat",287],["criollasx.com",288],["pantieshub.net",289],["olamovies.*",290],["idnes.cz",[291,292]]]);
const exceptionsMap = new Map([["hubdrive.com",[37]],["hubdrive.de",[37]]]);
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
