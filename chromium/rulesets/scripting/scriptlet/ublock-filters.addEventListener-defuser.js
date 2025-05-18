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
const argsList = [["click","/event_callback=function\\(\\){window\\.location=t\\.getAttribute\\(\"href\"\\)/"],["load","Object"],["load","hard_block"],["","adb"],["click","ClickHandler"],["load","IsAdblockRequest"],["load","onload"],["","BACK"],["load","(!o)"],["load","(!i)"],["","_0x"],["","Adblock"],["/^(?:click|mousedown)$/","bypassEventsInProxies"],["","open"],["click","exopop"],["/^(?:load|click)$/","popMagic"],["mousedown","popundrInit"],["getexoloader"],["","pop"],["load","creativeLoaded-"],["/^load[A-Za-z]{12,}/"],["","/exo"],["","_blank"],["mousedown","preventDefault"],["/^(?:click|mousedown)$/","_0x"],["load","nextFunction"],["load","advertising"],["click","preventDefault"],["load","2000"],["/^(click|mousedown|mousemove|touchstart|touchend|touchmove)/","system.popunder"],["load","adb"],["/^(?:click|mousedown|mousemove|touchstart|touchend|touchmove)$/","system.popunder"],["","'0x"],["/DOMContentLoaded|load/","y.readyState"],["","history.go"],["/error|canplay/","(t)"],["load","hblocked"],["error","Adblocker"],["DOMContentLoaded","adlinkfly"],["DOMContentLoaded","shortener"],["mousedown","trigger"],["","0x"],["","Pop"],["/^(?:click|mousedown)$/","popunder"],["DOMContentLoaded","preventExit"],["mouseup","_blank"],["click","pop_under"],["load","url"],["load","adverts-top-container"],["","Date"],["DOMContentLoaded","&nbsp"],["click","read_cookie"],["","midRoll"],["click","_0x"],["load","isBlanketFound"],["load","showModal"],["click","trigger"],["mouseout","clientWidth"],["load","download-wrapper"],["load","autoRecov"],["popstate","noPop"],["/^(?:click|mousedown)$/","ppu"],["click","native code"],["click","_blank"],["/^(?:mousedown|mouseup)$/","0x"],["click","popundr"],["click"],["DOMContentLoaded","compupaste"],["mousedown","!!{});"],["DOMContentLoaded","/adblock/i"],["keydown"],["/^/","0x"],["load","PrivateMode"],["scroll","_0x"],["DOMContentLoaded","checkVPN"],["/^(?:click|mousedown|mouseup)$/","di()"],["","\\"],["popstate"],["click","my_inter_listen"],["","window.open"],["load","appendChild"],["","bi()"],["","checkTarget"],["click","popunder"],["timeupdate"],["scroll","getElementById"],["load","undefined"],["DOMContentLoaded","scriptwz_url"],["load","0x"],["DOMContentLoaded","btoa"],["adblockActivated"],["click","saveLastEvent"],["","show"],["/.?/","popMagic"],["","ads"],["click","interstitial"],["load","antiblock"],["DOMContentLoaded","adsBlocked"],["load",".appendChild"],["","btoa"],["DOMContentLoaded","AdBlock"],["load","blocker"],["mouseleave","NativeDisplayAdID"],["mouseover","event.triggered"],["blur","stopCountdown"],["load","htmls"],["blur","focusOut"],["click","/handleClick|popup/"],["DOMContentLoaded","history.go"],["load","bypass"],["DOMContentLoaded","antiAdBlockerHandler"],["DOMContentLoaded","location.href"],["","popMagic"],["contextmenu","preventDefault"],["visibilitychange","remainingSeconds"],["click","Popunder"],["contextmenu"],["submit","validateForm"],["blur","counter"],["load","doTest"],["DOMContentLoaded","document.documentElement.lang.toLowerCase"],["click","maxclick"],["click","","elements","#get-link-button"],["click","window.open"],["click","shouldOpenPopUp"],["click","adForm"],["blur"],["click","popMagic"],["","shouldShow"],["","exopop"],["","break;case $."],["","focus"],["load","abDetectorPro"],["error","blocker"],["load","error-report.com"],["load","/AdBlock/i"],["/^(?:click|mousedown)$/","latest!=="],["DOMContentLoaded",".ready"],["load","script"],["","/pop|wm|forceClick/"],["load","block"],["","/_0x|localStorage\\.getItem/"],["DOMContentLoaded","adblock"],["click","open"],["error"],["visibilitychange"],["load","/showModal|isBlanketFound/"],["click","shouldShow"],["","/ads|Modal/"],["load","Adblock"],["DOMContentLoaded","window.open"],["DOMContentLoaded","atob"],["","vads"],["devtoolschange"],["beforeunload"],["mouseup","decodeURIComponent"],["/(?:click|touchend)/","_0x"],["","removeChild"],["click","pu_count"],["message"],["","/pop|_blank/"],["click","allclick_Public"],["DOMContentLoaded","/dyn\\.ads|loadAdsDelayed/"],["/touchstart|mousedown|click/","latest"],["blur","native code"],["blur","event.simulate"],["DOMContentLoaded","0x"],["click","overlay"],["scroll","undefined"],["readystatechange","document.removeEventListener"],["mousedown","shown_at"],["scroll","detect"],["click","t(a)"],["mouseup","catch"],["click","clickCount"],["scroll","innerHeight"],["hashchange"],["load","/nextFunction|2000/"],["load","player"],["","document.oncontextmenu"],["load","popMagic"],["click","popurl"],["click","Popup"],["","/open.*_blank/"],["scroll"],["","isBlocking"],["timeupdate","","elements",".quiver-cam-player--ad-not-running.quiver-cam-player--free video"],["","$"],["/click|mousedown/","catch"],["","init"],["adb"],["click","popName"],["DOMContentLoaded","clientHeight"],["click","window.focus"],["click","event.dispatch"],["load","adblock"],["","Math"],["DOMContentLoaded","popupurls"],["load","XMLHttpRequest"],["load","puURLstrpcht"],["load","AdBlocker"],["","showModal"],["","goog"],["","document.body"],["","modal"],["click","pop"],["click","adobeModalTestABenabled"],["blur","console.log"],["DOMContentLoaded","adsSrc"],["","AdB"],["load","adSession"],["np.detect"],["DOMContentLoaded","document.documentElement.lang"],["DOMContentLoaded","googlesyndication"],["load","popunder"],["DOMContentLoaded",".clientHeight"],["scroll","function(e)"],["DOMContentLoaded","adlinkfly_url"],["load","document.getElementById"],["DOMContentLoaded","daadb_get_data_fetch"],["click","popactive"],["DOMContentLoaded","location.replace"],["load","modal_blocker"],["click","isOpened"],["mousedown","pop.doEvent"],["click","alink"],["load","[native code]"],["/adblock/i"],["load","google-analytics"],["","sessionStorage"],["click","/form\\.submit|urlToOpen/"],["DOMContentLoaded","overlays"],["load","ads"],["click","document.createElement"],["click","ShouldShow"],["click","","elements","a#dlink"],["mousedown","localStorage"],["","adsense"],["click","splashPage"],["load","detect-modal"],["DOMContentLoaded","canRedirect"],["DOMContentLoaded","adb"],["error","/\\{[a-z]\\(e\\)\\}/"],["load",".call(this"],["/touchmove|wheel/","preventDefault()"],["load","showcfkModal"],["click","attached","elements","div[class=\"share-embed-container\"]"],["click","fp-screen"],["DOMContentLoaded","leaderboardAd"],["DOMContentLoaded","fetch"],["click","openPopupForChapter"],["click","doThePop"],["DOMContentLoaded","blockAdBlock"],["click","openDirectLinkAd"],["load","detect"],["DOMContentLoaded","history.pushState"],["DOMContentLoaded","showPopup"],["click","PopUnder"],["load","puHref"],["click","Ads"],["mouseup","open"],["DOMContentLoaded","adBlockNotice"],["DOMContentLoaded","_0x"],["DOMContentLoaded","detect"],["DOMContentLoaded","Promise"],["DOMContentLoaded","anchor.href"],["click","pingUrl"],["mousedown","scoreUrl"],["","Adb"]];
const hostnamesMap = new Map([["cbc.ca",0],["newser.com",1],["sport1.de",2],["timesofindia.indiatimes.com",3],["drrtyr.mx",3],["pinoyalbums.com",3],["multiplayer.it",3],["mediafire.com",[4,5]],["kingofdown.com",6],["radiotormentamx.com",6],["limetorrents.*",[6,10]],["king-pes.*",6],["quelleestladifference.fr",6],["depedlps.*",6],["otakuworldsite.blogspot.com",6],["ad-itech.blogspot.com",6],["komikcast.*",6],["unlockapk.com",6],["mobdi3ips.com",6],["socks24.org",6],["idedroidsafelink.*",6],["links-url.*",6],["interviewgig.com",6],["javaguides.net",6],["almohtarif-tech.net",6],["forum.release-apk.com",6],["devoloperxda.blogspot.com",6],["zwergenstadt.com",6],["primedeportes.es",6],["upxin.net",6],["ciudadblogger.com",6],["ke-1.com",6],["bit-shares.com",6],["itdmusics.com",6],["aspdotnet-suresh.com",6],["tudo-para-android.com",6],["zerotopay.com",6],["ak4eg.*",6],["akw.to",6],["mawsueaa.com",6],["hesgoal-live.io",6],["streanplay.*",7],["steanplay.*",7],["bibme.org",8],["citationmachine.net",8],["easybib.com",9],["pahe.*",10],["yts.*",10],["tube8.*",10],["topeuropix.*",10],["vermangasporno.com",10],["moviescounter.*",10],["imgtorrnt.in",10],["picbaron.com",[10,112]],["torrent9.*",10],["desiremovies.*",10],["letmejerk.com",10],["letmejerk2.com",10],["letmejerk3.com",10],["letmejerk4.com",10],["letmejerk5.com",10],["letmejerk6.com",10],["letmejerk7.com",10],["movs4u.*",10],["uwatchfree.*",10],["hydrax.*",10],["4movierulz.*",10],["projectfreetv.*",10],["arabseed.*",10],["btdb.*",[10,49]],["dlapk4all.com",10],["kropic.com",10],["kvador.com",10],["pdfindir.net",10],["brstej.com",10],["topwwnews.com",10],["xsanime.com",10],["vidlo.us",10],["youx.xxx",10],["world4ufree.*",10],["animeindo.asia",10],["streamsport.*",10],["rojadirectatvhd.*",10],["userload.*",10],["badtaste.it",11],["adyou.*",12],["gotporn.com",13],["freepornrocks.com",13],["tvhai.org",13],["xn--mlaregvle-02af.nu",13],["realgfporn.com",[14,15]],["fxporn69.*",14],["thisvid.com",15],["xvideos-downloader.net",15],["imgspice.com",16],["vikiporn.com",17],["tnaflix.com",17],["pornomico.com",17],["yourlust.com",17],["hd-easyporn.com",17],["hotpornfile.org",17],["watchfreexxx.net",17],["vintageporntubes.com",17],["angelgals.com",17],["babesexy.com",17],["hentaihere.com",17],["ganstamovies.com",17],["youngleak.com",17],["jizzberry.com",17],["porndollz.com",17],["xnxxvideo.pro",17],["xvideosxporn.com",17],["filmpornofrancais.fr",17],["pictoa.com",[17,41]],["pornohirsch.net",17],["herzporno.*",17],["deinesexfilme.com",17],["einfachtitten.com",17],["halloporno.*",17],["lesbenhd.com",17],["milffabrik.com",17],["porn-monkey.com",17],["porndrake.com",17],["pornhubdeutsch.net",17],["pornoaffe.com",17],["pornodavid.com",17],["pornoente.tv",17],["pornofisch.com",17],["pornofelix.com",17],["pornohammer.com",17],["pornohelm.com",17],["pornoklinge.com",17],["pornotom.com",17],["pornotommy.com",17],["pornovideos-hd.com",17],["pornozebra.com",17],["xhamsterdeutsch.xyz",17],["xnxx-sexfilme.com",17],["youlikeboys.com",17],["adultasianporn.com",17],["nsfwmonster.com",17],["girlsofdesire.org",17],["gaytail.com",17],["fetish-bb.com",17],["rumporn.com",17],["soyoungteens.com",17],["zubby.com",17],["lesbian8.com",17],["gayforfans.com",17],["reifporn.de",17],["javtsunami.com",17],["18tube.sex",17],["xxxextreme.org",17],["amateurs-fuck.com",17],["sex-amateur-clips.com",17],["hentaiworld.tv",17],["dads-banging-teens.com",17],["home-xxx-videos.com",17],["mature-chicks.com",17],["hqbang.com",17],["darknessporn.com",17],["familyporner.com",17],["freepublicporn.com",17],["pisshamster.com",17],["punishworld.com",17],["xanimu.com",17],["tubator.com",17],["hentai2w.com",[17,127]],["pornhd.com",18],["cnnamador.com",[18,29]],["cle0desktop.blogspot.com",18],["turkanime.co",18],["rexporn.*",18],["movies07.*",18],["camclips.tv",[18,42]],["blackpornhq.com",18],["xsexpics.com",18],["ulsex.net",18],["wannafreeporn.com",18],["ytube2dl.com",18],["pornocomics.*",18],["multiup.us",18],["protege-torrent.com",18],["pussyspace.com",[19,20]],["pussyspace.net",[19,20]],["empflix.com",21],["cpmlink.net",22],["bdsmstreak.com",22],["cutpaid.com",22],["pornforrelax.com",22],["fatwhitebutt.com",22],["pornomoll.*",22],["short.pe",23],["gsurl.*",23],["pinsystem.co.uk",24],["ancensored.com",24],["ganool.*",24],["mp3fiber.com",[24,25]],["xrivonet.info",24],["pirate.*",24],["piratebay.*",24],["pirateproxy.*",24],["proxytpb.*",24],["thepiratebay.*",24],["totaldebrid.org",25],["freecoursesonline.*",25],["lordpremium.*",25],["schrauben-normen.de",25],["avengerinator.blogspot.com",25],["novablogitalia.*",25],["link-to.net",25],["hanimesubth.com",25],["gsmturkey.net",25],["anisubindo.*",25],["adshrink.it",25],["presentation-ppt.com",25],["mangacanblog.com",25],["pekalongan-cits.blogspot.com",25],["4tymode.win",25],["linkvertise.com",25],["reifenrechner.at",25],["tire-size-calculator.info",25],["linuxsecurity.com",25],["itsguider.com",25],["cotravinh.blogspot.com",25],["itudong.com",25],["shortx.net",25],["btvsports.*",25],["lecturel.com",25],["bakai.org",25],["nar.k-ba.net",25],["eurotruck2.com.br",25],["tiroalpaloes.com",25],["stream4free.*",25],["tiroalpaloes.net",25],["flixsix.com",25],["tiroalpaloweb.xyz",25],["mimaletadepeliculas.*",26],["bs.to",27],["burningseries.*",27],["efukt.com",27],["dz4soft.*",28],["generacionretro.net",28],["nuevos-mu.ucoz.com",28],["micloudfiles.com",28],["yoututosjeff.*",28],["ebookmed.*",28],["lanjutkeun.*",28],["mimaletamusical.blogspot.com",28],["novelasesp.*",28],["visionias.net",28],["singingdalong.*",28],["b3infoarena.in",28],["lurdchinexgist.blogspot.com",28],["thefreedommatrix.blogspot.com",28],["hentai-vl.blogspot.com",28],["projetomotog.blogspot.com",28],["ktmx.pro",28],["lirik3satu.blogspot.com",28],["marketmovers.it",28],["pharmaguideline.com",28],["mixloads.com",28],["mangaromance.eu",28],["interssh.com",28],["freesoftpdfdownload.blogspot.com",28],["myadslink.com",28],["blackavelic.com",28],["doujindesu.*",28],["server.satunivers.tv",28],["eg-akw.com",28],["xn--mgba7fjn.cc",28],["flashingjungle.com",29],["ma-x.org",30],["lavozdegalicia.es",30],["ddwloclawek.pl",30],["ki24.info",30],["xmovies8.*",31],["xmovies08.org",32],["globaldjmix.com",33],["desiupload.*",[34,141]],["hblinks.pro",34],["hubcdn.vip",34],["hubdrive.*",34],["90fpsconfig.in",34],["katdrive.link",34],["kmhd.net",34],["bollydrive.rest",34],["360news4u.net",34],["hypershort.com",[34,125]],["bollydrive.*",[34,143]],["zazzybabes.com",35],["haaretz.co.il",36],["haaretz.com",36],["slate.com",37],["megalinks.info",38],["megapastes.com",38],["mega-mkv.com",[38,39]],["mkv-pastes.com",38],["zpaste.net",38],["zlpaste.net",38],["9xlinks.site",38],["mega-dvdrip.*",39],["peliculas-dvdrip.*",39],["desbloqueador.*",40],["cine.to",[41,183]],["newpelis.*",[41,47]],["pelix.*",[41,47]],["allcalidad.*",[41,127]],["khatrimaza.*",41],["kissasia.cc",41],["camwhores.*",42],["camwhorestv.*",42],["digjav.com",42],["uproxy.*",42],["videoszoofiliahd.com",43],["xxxtubezoo.com",44],["zooredtube.com",44],["uii.io",45],["porndoe.com",46],["acienciasgalilei.com",48],["playrust.io",49],["payskip.org",50],["short-url.link",51],["tubedupe.com",52],["mirrorace.*",53],["fatgirlskinny.net",54],["polska-ie.com",54],["windowsmatters.com",54],["canaltdt.es",55],["masbrooo.com",55],["2ndrun.tv",55],["oncehelp.com",56],["curto.win",56],["smallseotools.com",57],["mixdrp.*",58],["macwelt.de",59],["pcwelt.de",59],["capital.de",59],["geo.de",59],["allmomsex.com",60],["allnewindianporn.com",60],["analxxxvideo.com",60],["animalextremesex.com",60],["anime3d.xyz",60],["animefuckmovies.com",60],["animepornfilm.com",60],["animesexbar.com",60],["animesexclip.com",60],["animexxxsex.com",60],["animexxxfilms.com",60],["anysex.club",60],["apetube.asia",60],["asianfuckmovies.com",60],["asianfucktube.com",60],["asianporn.sexy",60],["asiansex.*",60],["asiansexcilps.com",60],["beeg.fund",60],["beegvideoz.com",60],["bestasiansex.pro",60],["bravotube.asia",60],["brutalanimalsfuck.com",60],["candyteenporn.com",60],["daddyfuckmovies.com",60],["desifuckonline.com",60],["exclusiveasianporn.com",60],["exteenporn.com",60],["fantasticporn.net",60],["fantasticyoungporn.com",60],["fineasiansex.com",60],["firstasianpussy.com",60],["freeindiansextube.com",60],["freepornasians.com",60],["freerealvideo.com",60],["fuck-beeg.com",60],["fuck-xnxx.com",60],["fuckasian.pro",60],["fuckfuq.com",60],["fuckundies.com",60],["gojapaneseporn.com",60],["golderotica.com",60],["goodyoungsex.com",60],["goyoungporn.com",60],["hardxxxmoms.com",60],["hdvintagetube.com",60],["hentaiporn.me",60],["hentaisexfilms.com",60],["hentaisexuality.com",60],["hot-teens-movies.mobi",60],["hotanimepornvideos.com",60],["hotanimevideos.com",60],["hotasianpussysex.com",60],["hotjapaneseshows.com",60],["hotmaturetube.com",60],["hotmilfs.pro",60],["hotorientalporn.com",60],["hotpornyoung.com",60],["hotxxxjapanese.com",60],["hotxxxpussy.com",60],["indiafree.net",60],["indianpornvideo.online",60],["japanfuck.*",60],["japanporn.*",60],["japanpornclip.com",60],["japanesetube.video",60],["japansex.me",60],["japanesexxxporn.com",60],["japansporno.com",60],["japanxxx.asia",60],["japanxxxworld.com",60],["keezmovies.surf",60],["lingeriefuckvideo.com",60],["liveanimalporn.zooo.club",60],["madhentaitube.com",60],["megahentaitube.com",60],["megajapanesesex.com",60],["megajapantube.com",60],["milfxxxpussy.com",60],["momsextube.pro",60],["momxxxass.com",60],["monkeyanimalporn.com",60],["moviexxx.mobi",60],["newanimeporn.com",60],["newjapanesexxx.com",60],["nicematureporn.com",60],["nudeplayboygirls.com",60],["openxxxporn.com",60],["originalindianporn.com",60],["originalteentube.com",60],["pig-fuck.com",60],["plainasianporn.com",60],["popularasianxxx.com",60],["pornanimetube.com",60],["pornasians.pro",60],["pornhat.asia",60],["pornjapanesesex.com",60],["pornomovies.asia",60],["pornvintage.tv",60],["primeanimesex.com",60],["realjapansex.com",60],["realmomsex.com",60],["redsexhub.com",60],["retroporn.world",60],["retrosexfilms.com",60],["sex-free-movies.com",60],["sexanimesex.com",60],["sexanimetube.com",60],["sexjapantube.com",60],["sexmomvideos.com",60],["sexteenxxxtube.com",60],["sexxxanimal.com",60],["sexyoungtube.com",60],["sexyvintageporn.com",60],["sopornmovies.com",60],["spicyvintageporn.com",60],["sunporno.club",60],["tabooanime.club",60],["teenextrem.com",60],["teenfucksex.com",60],["teenhost.net",60],["teensex.*",60],["teensexass.com",60],["tnaflix.asia",60],["totalfuckmovies.com",60],["totalmaturefuck.com",60],["txxx.asia",60],["vintagetube.*",60],["voyeurpornsex.com",60],["warmteensex.com",60],["wetasiancreampie.com",60],["wildhentaitube.com",60],["wowyoungsex.com",60],["xhamster-art.com",60],["xmovie.pro",60],["xnudevideos.com",60],["xnxxjapon.com",60],["xpics.me",60],["xvide.me",60],["xxxanimefuck.com",60],["xxxanimevideos.com",60],["xxxanimemovies.com",60],["xxxhentaimovies.com",60],["xxxhothub.com",60],["xxxjapaneseporntube.com",60],["xxxlargeporn.com",60],["xxxmomz.com",60],["xxxmovies.*",60],["xxxpornmilf.com",60],["xxxpussyclips.com",60],["xxxpussysextube.com",60],["xxxretrofuck.com",60],["xxxsex.pro",60],["xxxsexyjapanese.com",60],["xxxteenyporn.com",60],["xxxvideo.asia",60],["xxxvideos.ink",60],["xxxyoungtv.com",60],["youjizzz.club",60],["youngpussyfuck.com",60],["bayimg.com",61],["celeb.gate.cc",62],["kinoger.re",63],["usersdrive.com",63],["desi.upn.bio",63],["zooqle.*",64],["masterplayer.xyz",65],["pussy-hub.com",65],["porndex.com",66],["compucalitv.com",67],["hdfull.*",68],["diariodenavarra.es",69],["mangamanga.*",70],["streameast.*",71],["thestreameast.*",71],["pennlive.com",72],["beautypageants.indiatimes.com",73],["01fmovies.com",74],["vev.*",75],["vidop.*",75],["lnk2.cc",76],["fullhdxxx.com",77],["luscious.net",[77,112]],["classicpornbest.com",77],["www-daftarharga.blogspot.com",[77,131]],["1youngteenporn.com",77],["miraculous.to",[77,176]],["vtube.to",77],["zone-telechargement.*",77],["xstory-fr.com",77],["gosexpod.com",78],["tubepornclassic.com",79],["shemalez.com",79],["otakukan.com",80],["xcafe.com",81],["pornfd.com",81],["venusarchives.com",81],["imagehaha.com",82],["imagenpic.com",82],["imageshimage.com",82],["imagetwist.com",82],["megalink.*",83],["k1nk.co",83],["watchasians.cc",83],["lulustream.com",83],["luluvdo.com",83],["vibestreams.*",83],["gmx.*",84],["web.de",84],["news18.com",85],["thelanb.com",86],["dropmms.com",86],["softwaredescargas.com",87],["cracking-dz.com",88],["mega1080p.*",89],["anitube.*",89],["gazzetta.it",90],["9hentai.*",91],["dziennikbaltycki.pl",92],["dzienniklodzki.pl",92],["dziennikpolski24.pl",92],["dziennikzachodni.pl",92],["echodnia.eu",92],["expressbydgoski.pl",92],["expressilustrowany.pl",92],["gazetakrakowska.pl",92],["gazetalubuska.pl",92],["gazetawroclawska.pl",92],["gk24.pl",92],["gloswielkopolski.pl",92],["gol24.pl",92],["gp24.pl",92],["gra.pl",92],["gs24.pl",92],["kurierlubelski.pl",92],["motofakty.pl",92],["naszemiasto.pl",92],["nowiny24.pl",92],["nowosci.com.pl",92],["nto.pl",92],["polskatimes.pl",92],["pomorska.pl",92],["poranny.pl",92],["sportowy24.pl",92],["strefaagro.pl",92],["strefabiznesu.pl",92],["stronakobiet.pl",92],["telemagazyn.pl",92],["to.com.pl",92],["wspolczesna.pl",92],["course9x.com",92],["courseclub.me",92],["azrom.net",92],["alttyab.net",92],["esopress.com",92],["nesiaku.my.id",92],["onemanhua.com",93],["freeindianporn.mobi",93],["dr-farfar.com",94],["boyfriendtv.com",95],["brandstofprijzen.info",96],["netfuck.net",97],["gaypornhdfree.*",97],["blog24.me",[97,105]],["kisahdunia.com",97],["cinemakottaga.*",97],["privatemoviez.*",97],["nulljungle.com",97],["oyuncusoruyor.com",97],["pbarecap.ph",97],["sourds.net",97],["teknobalta.com",97],["tvinternetowa.info",97],["sqlserveregitimleri.com",97],["tutcourse.com",97],["warddogs.com",97],["dvdgayporn.com",97],["iimanga.com",97],["tinhocdongthap.com",97],["tremamnon.com",97],["423down.com",97],["brizzynovel.com",97],["jugomobile.com",97],["freecodezilla.net",97],["apkmaven.*",97],["iconmonstr.com",97],["rbxscripts.net",97],["comentariodetexto.com",97],["wordpredia.com",97],["allfaucet.xyz",[97,105]],["titbytz.tk",97],["replica-watch.info",97],["alludemycourses.com",97],["kayifamilytv.com",97],["interfans.org",97],["iir.ai",98],["popcornstream.*",99],["qpython.club",100],["antifake-funko.fr",100],["dktechnicalmate.com",100],["recipahi.com",100],["e9china.net",101],["ontools.net",101],["marketbeat.com",102],["hentaipornpics.net",103],["labgame.io",104],["ohionowcast.info",105],["wiour.com",105],["bitzite.com",[105,110,111]],["appsbull.com",105],["diudemy.com",105],["maqal360.com",[105,113,114]],["bitcotasks.com",105],["videolyrics.in",105],["manofadan.com",105],["cempakajaya.com",105],["tagecoin.com",105],["naijafav.top",105],["ourcoincash.xyz",105],["claimcoins.site",105],["cryptosh.pro",105],["eftacrypto.com",105],["fescrypto.com",105],["earnhub.net",105],["kiddyshort.com",105],["tronxminer.com",105],["neverdims.com",105],["homeairquality.org",106],["cety.app",[107,108]],["exego.app",107],["cutlink.net",107],["cutsy.net",107],["cutyurls.com",107],["cutty.app",107],["cutnet.net",107],["jixo.online",107],["cuty.me",108],["exnion.com",108],["upfion.com",[108,124]],["upfiles.app",[108,124]],["upfiles-urls.com",[108,124]],["vikingf1le.us.to",108],["gamerxyt.com",108],["up4stream.com",108],["ups2up.fun",108],["championdrive.co",108],["adcrypto.net",109],["admediaflex.com",109],["aduzz.com",109],["bitcrypto.info",109],["cdrab.com",109],["datacheap.io",109],["hbz.us",109],["savego.org",109],["owsafe.com",109],["sportweb.info",109],["gfx-station.com",110],["buzzheavier.com",111],["flashbang.sh",111],["trashbytes.net",111],["aiimgvlog.fun",112],["6indianporn.com",112],["amateurebonypics.com",112],["amateuryoungpics.com",112],["amigosporn.top",112],["cinemabg.net",112],["coomer.su",112],["desimmshd.com",112],["everia.club",112],["frauporno.com",112],["givemeaporn.com",112],["hitomi.la",112],["jav-asia.top",112],["javf.net",112],["javfull.net",112],["javideo.net",112],["javsunday.com",112],["kemono.su",112],["kr18plus.com",112],["missavtv.com",112],["pilibook.com",112],["pornborne.com",112],["porngrey.com",112],["pornktube.*",112],["pornx.tube",112],["qqxnxx.com",112],["sexvideos.host",112],["submilf.com",112],["subtaboo.com",112],["tktube.com",112],["watchseries.*",112],["xfrenchies.com",112],["soft98.ir",[113,143]],["moderngyan.com",115],["sattakingcharts.in",115],["freshbhojpuri.com",115],["bgmi32bitapk.in",115],["bankshiksha.in",115],["earn.mpscstudyhub.com",115],["earn.quotesopia.com",115],["money.quotesopia.com",115],["best-mobilegames.com",115],["learn.moderngyan.com",115],["bharatsarkarijobalert.com",115],["quotesopia.com",115],["creditsgoal.com",115],["coingraph.us",116],["momo-net.com",116],["milfnut.*",116],["maxgaming.fi",116],["cybercityhelp.in",117],["travel.vebma.com",118],["cloud.majalahhewan.com",118],["crm.cekresi.me",118],["ai.tempatwisata.pro",118],["pinloker.com",118],["sekilastekno.com",118],["mrproblogger.com",119],["themezon.net",119],["dagensnytt.com",119],["azmath.info",120],["azsoft.*",120],["downfile.site",120],["downphanmem.com",120],["expertvn.com",120],["memangbau.com",120],["trangchu.news",120],["aztravels.net",120],["ielts-isa.edu.vn",120],["techedubyte.com",[120,226]],["jpopsingles.eu",120],["aipebel.com",120],["link.paid4link.com",[121,122]],["driveup.sbs",123],["apimate.net",123],["dynamicminister.net",123],["gofirmware.com",123],["national-park.com",123],["forgee.xyz",123],["gamehub.cam",123],["cutyion.com",124],["weshare.is",126],["file.gocmod.com",126],["camarchive.tv",127],["crownimg.com",127],["flixbaba.*",127],["freejav.guru",127],["gntai.*",127],["grantorrent.*",127],["hentai2read.com",127],["icyporno.com",127],["illink.net",127],["javtiful.com",127],["m-hentai.net",127],["mejortorrent.*",127],["mejortorrento.*",127],["mejortorrents.*",127],["mejortorrents1.*",127],["mejortorrentt.*",127],["pornblade.com",127],["pornfelix.com",127],["pornxxxxtube.net",127],["redwap.me",127],["redwap2.com",127],["redwap3.com",127],["sunporno.com",127],["tubxporn.xxx",127],["ver-comics-porno.com",127],["ver-mangas-porno.com",127],["xanimeporn.com",127],["xxxvideohd.net",127],["zetporn.com",127],["simpcity.su",128],["gameofporn.com",129],["0dramacool.net",130],["0gomovie.*",130],["0gomovies.*",130],["185.53.88.104",130],["185.53.88.204",130],["185.53.88.15",130],["123moviefree.*",130],["123movies4k.net",130],["1kmovies.*",130],["1madrasdub.*",130],["1primewire.*",130],["1rowsports.com",130],["2embed.*",130],["2madrasdub.*",130],["2umovies.*",130],["4anime.*",130],["4share-mp3.net",130],["9animetv.to",130],["720pstream.me",130],["aagmaal.com",130],["abysscdn.com",130],["adblockplustape.*",130],["ajkalerbarta.com",130],["altadefinizione01.*",130],["androidapks.biz",130],["androidsite.net",130],["animeonlinefree.org",130],["animesite.net",130],["animespank.com",130],["aniworld.to",130],["apkmody.io",130],["appsfree4u.com",130],["atomixhq.*",130],["audioz.download",130],["awafim.tv",130],["bdnewszh.com",130],["beastlyprints.com",130],["beinmatch.*",130],["bengalisite.com",130],["brmovies.*",130],["ch-play.com",130],["cima4u.*",130],["clickforhire.com",130],["clicknupload.*",130],["cloudy.pk",130],["cmovies.*",130],["computercrack.com",130],["coolcast2.com",130],["crackedsoftware.biz",130],["crackfree.org",130],["cricfree.*",130],["crichd.*",130],["cryptoblog24.info",130],["cuatrolatastv.blogspot.com",130],["cydiasources.net",130],["decmelfot.xyz",130],["dirproxy.com",130],["dood.*",130],["dopebox.to",130],["downloadapk.info",130],["downloadapps.info",130],["downloadgames.info",130],["downloadmusic.info",130],["downloadsite.org",130],["downloadwella.com",130],["ebooksite.org",130],["educationtips213.blogspot.com",130],["egyup.live",130],["elgoles.pro",130],["embed.meomeo.pw",130],["embed.scdn.to",130],["emulatorsite.com",130],["essaysharkwriting.club",130],["exploreera.net",130],["extrafreetv.com",130],["f1stream.*",130],["fakedetail.com",130],["faselhd.*",130],["fbstream.*",130],["fclecteur.com",130],["filemoon.*",130],["filepress.*",[130,207]],["files.im",130],["filmlinks4u.*",130],["filmpertutti.*",130],["filmyzilla.*",130],["flexyhit.com",130],["fmoviefree.net",130],["fmovies24.com",130],["fmovies.*",130],["freeflix.info",130],["freemoviesu4.com",130],["freeplayervideo.com",130],["freesoccer.net",130],["french-stream.*",130],["fseries.org",130],["fzlink.*",130],["gamefast.org",130],["gamesite.info",130],["gettapeads.com",130],["gmanga.me",130],["gocast123.me",130],["gofilms4u.*",130],["gogoanime.*",130],["gogohd.net",130],["gogoplay5.com",130],["gomoviz.*",130],["gooplay.net",130],["gostreamon.net",130],["happy2hub.org",130],["harimanga.com",130],["hdmoviefair.*",130],["hdmovies4u.*",130],["hdmovies50.*",130],["hdmoviesfair.*",130],["healthnewsreel.com",130],["hexupload.net",130],["hh3dhay.*",130],["hinatasoul.com",130],["hindilinks4u.*",130],["hindisite.net",130],["holymanga.net",130],["hotmasti.*",130],["hurawatch.*",130],["hxfile.co",130],["isosite.org",130],["iv-soft.com",130],["januflix.expert",130],["jewelry.com.my",130],["johnwardflighttraining.com",130],["kabarportal.com",130],["klmanga.*",130],["klubsports.*",130],["kstorymedia.com",130],["la123movies.org",130],["lespassionsdechinouk.com",130],["libertestreamvf.*",130],["lilymanga.net",130],["linksdegrupos.com.br",130],["linkz.wiki",130],["livetvon.*",130],["livestreamtv.pk",130],["macsite.info",130],["manga1000.*",130],["manga1001.*",130],["mangaraw.*",130],["mangarawjp.*",130],["mangasite.org",130],["manhuascan.com",130],["megamovies.org",130],["membed.net",130],["mlbstream.*",130],["moddroid.com",130],["motogpstream.*",130],["movi.pk",[130,152]],["moviefree2.com",130],["movierulz.*",130],["movies123.*",130],["movies-watch.com.pk",130],["movies2watch.*",130],["moviesden.*",130],["moviesite.app",130],["moviesonline.fm",130],["moviesx.org",130],["moviezaddiction.*",130],["msmoviesbd.com",130],["musicsite.biz",130],["myfernweh.com",130],["myviid.com",130],["nazarickol.com",130],["nbastream.*",130],["netcine.*",130],["nflstream.*",130],["nhlstream.*",130],["noob4cast.com",130],["nsw2u.com",[130,268]],["oko.sh",130],["onlinewatchmoviespk.*",130],["orangeink.pk",130],["pahaplayers.click",130],["patchsite.net",130],["pctfenix.*",130],["pctnew.*",130],["pdfsite.net",130],["pksmovies.*",130],["play1002.com",130],["player-cdn.com",130],["plyjam.*",130],["plylive.*",130],["pogolinks.*",130],["popcorntime.*",130],["poscitech.*",130],["productkeysite.com",130],["projectfreetv.one",130],["romsite.org",130],["rufiguta.com",130],["rugbystreams.*",130],["rytmp3.io",130],["send.cm",130],["seriesite.net",130],["seriezloaded.com.ng",130],["serijehaha.com",130],["shahed4u.*",130],["sflix.*",130],["shrugemojis.com",130],["siteapk.net",130],["siteflix.org",130],["sitegames.net",130],["sitekeys.net",130],["sitepdf.com",130],["sitesunblocked.*",130],["sitetorrent.com",130],["softwaresite.net",130],["solarmovies.*",130],["sportbar.live",130],["sportcast.*",130],["sportskart.*",130],["sports-stream.*",130],["ssyoutube.com",130],["stardima.com",130],["stream4free.live",130],["streaming-french.*",130],["streamers.*",130],["streamingcommunity.*",[130,191]],["superapk.org",130],["supermovies.org",130],["t20cup.*",130],["tainio-mania.online",130],["talaba.su",130],["tamilguns.org",130],["tatabrada.tv",130],["techtrendmakers.com",130],["tennisstreams.*",130],["thememypc.net",130],["thripy.com",130],["torrentdosfilmes.*",130],["toonanime.*",130],["travelplanspro.com",130],["turcasmania.com",130],["tusfiles.com",130],["tvonlinesports.com",130],["tvply.*",130],["ufcstream.*",130],["ultramovies.org",130],["uploadbank.com",130],["uptomega.*",130],["uqload.*",130],["urdubolo.pk",130],["vudeo.*",130],["vidoo.*",130],["vidspeeds.com",130],["vipboxtv.*",130],["viprow.*",130],["warezsite.net",130],["watchmovies2.com",130],["watchmoviesforfree.org",130],["watchofree.com",130],["watchsite.net",130],["watchsouthpark.tv",130],["watchtvch.club",130],["web.livecricket.is",130],["webseries.club",130],["worldcupstream.pm",130],["y2mate.com",130],["yesmovies.*",130],["yomovies.*",130],["yomovies1.*",130],["youapk.net",130],["youtube4kdownloader.com",130],["yt2mp3s.*",130],["yts-subs.com",130],["kat.*",130],["katbay.*",130],["kickass.*",130],["kickasshydra.*",130],["kickasskat.*",130],["kickass2.*",130],["kickasstorrents.*",130],["kat2.*",130],["kattracker.*",130],["thekat.*",130],["thekickass.*",130],["kickassz.*",130],["kickasstorrents2.*",130],["topkickass.*",130],["kickassgo.*",130],["kkickass.*",130],["kkat.*",130],["kickasst.*",130],["kick4ss.*",130],["adelsfun.com",132],["advantien.com",132],["bailbondsfinder.com",132],["bg-gledai.*",132],["bigpiecreative.com",132],["childrenslibrarylady.com",132],["classifarms.com",132],["comtasq.ca",132],["crone.es",132],["ctrmarketingsolutions.com",132],["dropnudes.com",132],["ftuapps.dev",132],["gendatabase.com",132],["genzsport.com",132],["ghscanner.com",132],["gledaitv.*",132],["grsprotection.com",132],["gruporafa.com.br",132],["inmatefindcalifornia.com",132],["inmatesearchidaho.com",132],["itsonsitetv.com",132],["mfmfinancials.com",132],["myproplugins.com",132],["nurulislam.org",132],["onehack.us",132],["ovester.com",132],["paste.bin.sx",132],["privatenudes.com",132],["renoconcrete.ca",132],["richieashbeck.com",132],["sat.technology",132],["short1ink.com",132],["stpm.co.uk",132],["wegotcookies.co",132],["mathcrave.com",132],["vip-box.app",132],["androidpolice.com",133],["cbr.com",133],["gamerant.com",133],["howtogeek.com",133],["thegamer.com",133],["winfuture.de",134],["flight-report.com",135],["vulture.com",136],["megaplayer.bokracdn.run",137],["hentaistream.com",138],["siteunblocked.info",139],["larvelfaucet.com",140],["feyorra.top",140],["claimtrx.com",140],["pagalmovies.*",141],["7starhd.*",141],["jalshamoviez.*",141],["moviesyug.net",141],["9xupload.*",141],["bdupload.*",141],["rdxhd1.*",141],["parispi.net",142],["hentaicloud.com",143],["nuvid.*",143],["tio.ch",144],["lavanguardia.com",144],["news.bg",[144,221]],["tu.no",144],["paperzonevn.com",145],["dailyvideoreports.net",146],["lewd.ninja",147],["systemnews24.com",148],["niusdiario.es",149],["playporngames.com",150],["javx.*",150],["freemagazines.top",151],["freepreset.net",151],["moviessources.*",153],["cutesexyteengirls.com",154],["haho.moe",155],["nicy-spicy.pw",156],["novelmultiverse.com",157],["mylegalporno.com",158],["embedsports.me",159],["embedstream.me",159],["jumbtv.com",159],["reliabletv.me",159],["guardaserie.*",160],["cine-calidad.*",161],["xnxx.com",162],["xvideos.*",162],["thecut.com",163],["novelism.jp",164],["alphapolis.co.jp",165],["game3rb.com",166],["javhub.net",166],["thotvids.com",167],["berklee.edu",168],["rawkuma.com",[169,170]],["moviesjoyhd.to",170],["cineb.rs",170],["imeteo.sk",171],["youtubemp3donusturucu.net",172],["videovard.*",173],["cluset.com",174],["homemoviestube.com",174],["sexseeimage.com",174],["alueviesti.fi",175],["kiuruvesilehti.fi",175],["lempaala.ideapark.fi",175],["olutposti.fi",175],["urjalansanomat.fi",175],["tainhanhvn.com",177],["titantv.com",178],["3cinfo.net",179],["cocomanga.com",180],["animelatinohd.com",180],["buondua.com",181],["chillx.top",182],["playerx.stream",182],["m.liputan6.com",184],["stardewids.com",[184,203]],["ingles.com",185],["spanishdict.com",185],["surfline.com",186],["rureka.com",187],["amateur8.com",188],["freeporn8.com",188],["maturetubehere.com",188],["embedo.co",189],["corriere.it",190],["oggi.it",190],["apkcombo.com",192],["sponsorhunter.com",193],["novelssites.com",194],["haxina.com",195],["scimagojr.com",195],["dramafren.net",195],["torrentmac.net",196],["udvl.com",197],["dlpanda.com",198],["socialmediagirls.com",199],["einrichtungsbeispiele.de",200],["weadown.com",201],["molotov.tv",202],["commands.gg",203],["smgplaza.com",204],["emturbovid.com",205],["findjav.com",205],["javggvideo.xyz",205],["mmtv01.xyz",205],["stbturbo.xyz",205],["streamsilk.com",205],["freepik.com",206],["sportnews.to",208],["soccershoes.blog",208],["shineads.*",208],["diyphotography.net",209],["bitchesgirls.com",210],["explorecams.com",211],["minecraft.buzz",211],["hiraethtranslation.com",212],["programmingeeksclub.com",213],["diendancauduong.com",214],["androidadult.com",215],["parentcircle.com",216],["h-game18.xyz",217],["wheelofgold.com",218],["davescomputertips.com",219],["historyofroyalwomen.com",219],["motchill.*",220],["lifestyle.bg",221],["topsport.bg",221],["webcafe.bg",221],["freepikdownloader.com",222],["freepasses.org",223],["iusedtobeaboss.com",224],["blogtruyenmoi.com",225],["repretel.com",227],["tubereader.me",227],["graphicget.com",228],["qiwi.gg",[229,230]],["sonixgvn.net",231],["alliptvlinks.com",232],["smashyplayer.top",233],["upns.*",233],["xvideos.com",234],["xvideos2.com",234],["katfile.com",235],["readcomiconline.*",236],["nekopoi.*",237],["ukchat.co.uk",238],["hivelr.com",239],["skidrowcodex.net",240],["takimag.com",241],["digi.no",242],["th.gl",243],["twi-fans.com",244],["learn-cpp.org",245],["terashare.co",246],["pornwex.tv",247],["smithsonianmag.com",248],["homesports.net",249],["realmoasis.com",250],["javfc2.xyz",251],["gobankingrates.com",252],["hiddenleaf.to",253],["ronorp.net",254],["gdflix.*",255],["a1movies.*",256],["videovak.com",257],["a-lohas.jp",258],["akirabox.com",259],["purplex.app",260],["maggotdrowning.com",261],["bilinovel.com",262],["esportstales.com",263],["streamup.ws",264],["pagalfree.com",265],["pagalworld.us",265],["idnes.cz",[266,267]]]);
const exceptionsMap = new Map([["forum.soft98.ir",[113,143]]]);
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
