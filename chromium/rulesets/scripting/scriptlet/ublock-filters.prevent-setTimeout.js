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
(function uBOL_preventSetTimeout() {

/******************************************************************************/

function preventSetTimeout(
    needleRaw = '',
    delayRaw = ''
) {
    const safe = safeSelf();
    const logPrefix = safe.makeLogPrefix('prevent-setTimeout', needleRaw, delayRaw);
    const needleNot = needleRaw.charAt(0) === '!';
    const reNeedle = safe.patternToRegex(needleNot ? needleRaw.slice(1) : needleRaw);
    const range = new RangeParser(delayRaw);
    proxyApplyFn('setTimeout', function(context) {
        const { callArgs } = context;
        const a = callArgs[0] instanceof Function
            ? safe.String(safe.Function_toString(callArgs[0]))
            : safe.String(callArgs[0]);
        const b = callArgs[1];
        if ( needleRaw === '' && range.unbound() ) {
            safe.uboLog(logPrefix, `Called:\n${a}\n${b}`);
            return context.reflect();
        }
        if ( reNeedle.test(a) !== needleNot && range.test(b) ) {
            callArgs[0] = function(){};
            safe.uboLog(logPrefix, `Prevented:\n${a}\n${b}`);
        }
        return context.reflect();
    });
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

class RangeParser {
    constructor(s) {
        this.not = s.charAt(0) === '!';
        if ( this.not ) { s = s.slice(1); }
        if ( s === '' ) { return; }
        const pos = s.indexOf('-');
        if ( pos !== 0 ) {
            this.min = this.max = parseInt(s, 10) || 0;
        }
        if ( pos !== -1 ) {
            this.max = parseInt(s.slice(pos + 1), 10) || Number.MAX_SAFE_INTEGER;
        }
    }
    unbound() {
        return this.min === undefined && this.max === undefined;
    }
    test(v) {
        const n = Math.min(Math.max(Number(v) || 0, 0), Number.MAX_SAFE_INTEGER);
        if ( this.min === this.max ) {
            return (this.min === undefined || n === this.min) !== this.not;
        }
        if ( this.min === undefined ) {
            return (n <= this.max) !== this.not;
        }
        if ( this.max === undefined ) {
            return (n >= this.min) !== this.not;
        }
        return (n >= this.min && n <= this.max) !== this.not;
    }
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
const argsList = [["]();}","500"],[".adv-"],[")](this,...","3000-6000"],["(new Error(","3000-6000"],[".offsetHeight>0"],["wbDeadHinweis"],["","10000"],["adblock"],["googleFC"],["adb"],["adBlockerDetected"],["show"],["InfMediafireMobileFunc","1000"],["google_jobrunner"],["isDesktopApp","1000"],["admc"],["'0x"],["apstagLOADED"],["/Adb|moneyDetect/"],["disableDeveloper"],["Blocco","2000"],["test","0"],["checkAdblockUser","1000"],["checkPub","6000"],["document.querySelector","5000"],["nextFunction","250"],["()","150"],["backRedirect"],["document.querySelectorAll","1000"],["style"],["clientHeight"],["addEventListener","0"],["adblock","2000"],["nextFunction","2000"],["byepopup","5000"],["test.remove","100"],["additional_src","300"],["()","2000"],["css_class.show"],["CANG","3000"],["updato-overlay","500"],["innerText","2000"],["alert","8000"],["css_class"],["()","50"],["debugger"],["initializeCourier","3000"],["redirectPage"],["_0x","2000"],["ads","750"],["location.href","500"],["Adblock","5000"],["disable","200"],["CekAab","0"],["rbm_block_active","1000"],["show()"],["_0x"],["n.trigger","1"],["abDetected"],["KeepOpeningPops","1000"],["location.href"],["adb","0"],["adBlocked"],["warning","100"],["adsbygoogle"],["adblock_popup","500"],["Adblock"],["location.href","10000"],["keep-ads","2000"],["#rbm_block_active","1000"],["null","4000"],["()","2500"],["myaabpfun","3000"],["adFilled","2500"],["()","15000"],["showPopup"],["adrecover"],["()","1000"],["document.cookie","2500"],["window.open"],["innerHTML"],["readyplayer","2000"],["/innerHTML|AdBlock/"],["checkStopBlock"],["adspot_top","1500"],["/offsetHeight|google|Global/"],["an_message","500"],["Adblocker","10000"],["timeoutChecker"],["bait","1"],["ai_adb"],["pum-open"],["overlay","2000"],["/adblock/i"],["Math.round","1000"],["adblock","5"],["ag_adBlockerDetected"],["null"],["adb","6000"],["sadbl"],["brave_load_popup"],["adsbytrafficjunkycontext"],["ipod"],["offsetWidth"],["/$|adBlock/"],["()"],["AdBlock"],["stop-scrolling"],["Adv"],["blockUI","2000"],["mdpDeBlocker"],["/_0x|debug/"],["/ai_adb|_0x/"],["adBlock"],["","1"],["undefined"],["check","1"],["adsBlocked"],["nextFunction"],["blocker"],["afs_ads","2000"],["bait"],["getComputedStyle","250"],["blocked"],["{r()","0"],["nextFunction","450"],["Debug"],["r()","0"],["test","100"],["purple_box"],["checkSiteNormalLoad"],["0x"],["adBlockOverlay"],["Detected","500"],["mdp"],["modal"],[".show","1000"],[".show"],["showModal"],["blur"],["samOverlay"],["native"],["bADBlock"],["location"],["alert"],["t()","0"],["ads"],["documentElement.innerHTML"],["/adblock|isRequestPresent/"],["_0x","500"],["isRequestPresent"],["alert","2000"],["1e3*"],["","1999"],["","2000"],["/^/","1000"],["checkAdBlock"],["displayAdBlockerMessage"],["push","500"],[".call(null)","10"],[".call(null)"],["(null)","10"],["userHasAdblocker"],["appendChild"],["getComputedStyle"],["displayMessage","2000"],["AdDetect"],["ai_"],["error-report.com"],["loader.min.js"],["content-loader.com"],["()=>","5000"],["offsetHeight"],["offsetLeft"],["height"],["mdp_deblocker"],["charAt"],["checkAds"],["fadeIn","0"],["jQuery"],["/^/"],["check"],["Adblocker"],["eabdModal"],["ab_root.show"],["gaData"],["ad"],["prompt","1000"],["googlefc"],["adblock detection"],[".offsetHeight","100"],["popState"],["ad-block-popup"],["exitTimer"],["innerHTML.replace"],["data?","4000"],["eabpDialog"],["adsense"],["/Adblock|_ad_/"],["googletag"],["f.parentNode.removeChild(f)","100"],["swal","500"],["keepChecking","1000"],["openPopup"],[".offsetHeight"],["()=>{"],["nitroAds"],["class.scroll","1000"],["disableDeveloperTools"],["Check"],["insertBefore"],["css_class.scroll"],["/null|Error/","10000"],["window.location.href","50"],["/out.php"],["/0x|devtools/"],["location.replace","300"],["window.location.href"],["fetch"],["window.location.href=link"],["reachGoal"],["Adb"],["ai"],["","3000"],["/width|innerHTML/"],["magnificPopup"],["adblockEnabled"],["google_ad"],["document.location"],["google"],["answers"],["top-right","2000"],["enforceAdStatus"],["loadScripts"],["mfp"],["display","5000"],["eb"],["/adb/i"],[").show()"],["","1000"],["site-access"],["/Ads|adbl|offsetHeight/"],["/show|innerHTML/"],["/show|document\\.createElement/"],["Msg"],["UABP"],["href"],["aaaaa-modal"],["()=>"],["keepChecking"],["null","10"],["","500"],["pop"],["/adbl/i"],["-0x"],["display"],["gclid"],["event","3000"],["rejectWith"],[".data?"],["refresh"],["location.href","3000"],["window.location"],["ga"],["myTestAd"],["adbl"],["Ads"],["ShowAdBLockerNotice"],["ad_listener"],["open"],["(!0)"],["Delay"],["/appendChild|e\\(\"/"],["=>"],["ADB"],["site-access-popup"],["data?"],["checkAdblockUser"],["offsetHeight","100"],["/salesPopup|mira-snackbar/"],["detectImgLoad"],["offsetHeight","200"],["detector"],["replace"],["touchstart"],["siteAccessFlag"],["ab"],["/adblocker|alert/"],["redURL"],["/children\\('ins'\\)|Adblock|adsbygoogle/"],["displayMessage"],["afterOpen"],["chkADB"],["onDetected"],["fuckadb"],["/aframe|querySelector/","1000-"],["detect"],["siteAccessPopup"],["/adsbygoogle|adblock|innerHTML|setTimeout/"],["akadb"],["biteDisplay"],["/[a-z]\\(!0\\)/","800"],["ad_block"],["/detectAdBlocker|window.open/"],["adBlockDetected"],["popUnder"],["/GoToURL|delay/"],["window.location.href","300"],["!call","70-500"],["ad_display"],[".redirect"],["popup"],["/adScriptPath|MMDConfig/"],["/native|\\{n\\(\\)/"],["psresimler"],["adblocker"],["EzoIvent"],["/Detect|adblock|style\\.display|\\[native code]|\\.call\\(null\\)/"],["removeChild"],["offset"],["contrformpub"],["trigger","0"],["/\\.append|\\.innerHTML|undefined|\\.css|blocker|flex|\\$\\('|obfuscatedMsg/"],["warn"],["getComputedStyle","2000"],["video-popup"],["detectAdblock"],["detectAdBlocker"],["nads"],["current.children"],["adStatus"],["BN_CAMPAIGNS"],["media_place_list"],["cvad"],["...","300"],["/\\{[a-z]\\(!0\\)\\}/"],["stackTrace"],["inner-ad"],["_ET"],[".clientHeight"],["getComputedStyle(el)"],["location.replace"],["console.clear"],["ad_block_detector"],["document.createElement"],["sandbox"],["getComputedStyle(testAd)"],["affiliate"],["document['\\x"],["hasAdblock"],["/adblock|isblock/i"],["visibility","2000"],["displayAdBlockedVideo"],["adBlockerModal"],["","10000-15000"],["length"],["atob","120000"],["#ad_blocker_detector"],["push"],["AdBlocker"]];
const hostnamesMap = new Map([["poophq.com",0],["veev.to",0],["infinityscans.xyz",1],["infinityscans.net",1],["infinityscans.org",1],["dogdrip.net",2],["infinityfree.com",2],["smsonline.cloud",[2,3]],["faqwiki.us",4],["cool--web-de.translate.goog",[5,6]],["gps--cache-de.translate.goog",[5,6]],["web--spiele-de.translate.goog",[5,6]],["fun--seiten-de.translate.goog",[5,6]],["photo--alben-de.translate.goog",[5,6]],["wetter--vorhersage-de.translate.goog",[5,6]],["coolsoftware-de.translate.goog",[5,6]],["kryptografie-de.translate.goog",[5,6]],["cool--domains-de.translate.goog",[5,6]],["net--tours-de.translate.goog",[5,6]],["such--maschine-de.translate.goog",[5,6]],["qul-de.translate.goog",[5,6]],["mailtool-de.translate.goog",[5,6]],["c--ix-de.translate.goog",[5,6]],["softwareengineer-de.translate.goog",[5,6]],["net--tools-de.translate.goog",[5,6]],["hilfen-de.translate.goog",[5,6]],["45er-de.translate.goog",[5,6]],["cooldns-de.translate.goog",[5,6]],["hardware--entwicklung-de.translate.goog",[5,6]],["mail.yahoo.com",[7,274]],["maxcheaters.com",7],["postimees.ee",7],["police.community",7],["gisarea.com",7],["schaken-mods.com",7],["tvnet.lv",7],["theclashify.com",7],["txori.com",7],["olarila.com",7],["deletedspeedstreams.blogspot.com",7],["schooltravelorganiser.com",7],["xhardhempus.net",7],["mhn.quest",7],["leagueofgraphs.com",7],["hieunguyenphoto.com",7],["benzinpreis.de",7],["lastampa.it",8],["m.timesofindia.com",9],["timesofindia.indiatimes.com",9],["youmath.it",9],["redensarten-index.de",9],["lesoir.be",9],["electriciansforums.net",9],["keralatelecom.info",9],["universegunz.net",9],["happypenguin.altervista.org",9],["everyeye.it",9],["eztv.*",9],["bluedrake42.com",9],["supermarioemulator.com",9],["futbollibrehd.com",9],["eska.pl",9],["eskarock.pl",9],["voxfm.pl",9],["mathaeser.de",9],["betaseries.com",9],["free-sms-receive.com",9],["sms-receive-online.com",9],["computer76.ru",9],["golem.de",[10,11,159]],["hdbox.ws",11],["todopolicia.com",11],["scat.gold",11],["freecoursesite.com",11],["windowcleaningforums.co.uk",11],["cruisingearth.com",11],["hobby-machinist.com",11],["freegogpcgames.com",11],["latitude.to",11],["kitchennovel.com",11],["w3layouts.com",11],["blog.receivefreesms.co.uk",11],["eductin.com",11],["dealsfinders.blog",11],["audiobooks4soul.com",11],["tinhocdongthap.com",11],["sakarnewz.com",11],["downloadr.in",11],["topcomicporno.com",11],["sushi-scan.*",11],["celtadigital.com",11],["iptvrun.com",11],["adsup.lk",11],["cryptomonitor.in",11],["areatopik.com",11],["cardscanner.co",11],["nullforums.net",11],["courseclub.me",11],["tamarindoyam.com",11],["jeep-cj.com",11],["choiceofmods.com",11],["myqqjd.com",11],["ssdtop.com",11],["apkhex.com",11],["gezegenforum.com",11],["iptvapps.net",11],["null-scripts.net",11],["nullscripts.net",11],["bloground.ro",11],["witcherhour.com",11],["ottverse.com",11],["torrentmac.net",11],["mazakony.com",11],["laptechinfo.com",11],["mc-at.org",11],["playstationhaber.com",11],["seriesperu.com",11],["spigotunlocked.*",11],["pesprofessionals.com",11],["wpsimplehacks.com",11],["sportshub.to",[11,249]],["topsporter.net",[11,249]],["darkwanderer.net",11],["truckingboards.com",11],["coldfrm.org",11],["azrom.net",11],["freepatternsarea.com",11],["alttyab.net",11],["ahmedmode.*",11],["mobilkulup.com",11],["esopress.com",11],["nesiaku.my.id",11],["jipinsoft.com",11],["truthnews.de",11],["farsinama.com",11],["worldofiptv.com",11],["vuinsider.com",11],["crazydl.net",11],["gamemodsbase.com",11],["babiato.tech",11],["secuhex.com",11],["turkishaudiocenter.com",11],["galaxyos.net",11],["bizdustry.com",11],["storefront.com.ng",11],["pkbiosfix.com",11],["casi3.xyz",11],["starleaks.org",11],["forum-xiaomi.com",11],["mediafire.com",12],["wcoanimedub.tv",13],["wcoforever.net",13],["openspeedtest.com",13],["addtobucketlist.com",13],["3dzip.org",[13,70]],["ilmeteo.it",13],["wcoforever.com",13],["comprovendolibri.it",13],["healthelia.com",13],["anghami.com",14],["yts.*",15],["720pstream.*",15],["1stream.*",15],["tutele.sx",15],["katestube.com",16],["short.pe",16],["thefmovies.*",16],["footystreams.net",16],["seattletimes.com",17],["bestgames.com",18],["yiv.com",18],["globalrph.com",19],["e-glossa.it",20],["webcheats.com.br",21],["urlcero.*",22],["gala.fr",23],["gentside.com",23],["geo.fr",23],["hbrfrance.fr",23],["nationalgeographic.fr",23],["ohmymag.com",23],["serengo.net",23],["vsd.fr",23],["updato.com",[24,40]],["totaldebrid.*",25],["sandrives.*",25],["daizurin.com",25],["pendekarsubs.us",25],["dreamfancy.org",25],["rysafe.blogspot.com",25],["techacode.com",25],["toppng.com",25],["th-world.com",25],["avjamack.com",25],["avjamak.net",25],["dlhd.sx",26],["yts-subs.net",26],["cnnamador.com",27],["nudecelebforum.com",28],["pronpic.org",29],["thewebflash.com",30],["discordfastfood.com",30],["xup.in",30],["popularmechanics.com",31],["op.gg",32],["comunidadgzone.es",33],["fxporn69.*",33],["mp3fy.com",33],["lebensmittelpraxis.de",33],["aliancapes.*",33],["ebookdz.com",33],["forum-pokemon-go.fr",33],["praxis-jugendarbeit.de",33],["dictionnaire-medical.net",33],["cle0desktop.blogspot.com",33],["up-load.io",33],["keysbrasil.blogspot.com",33],["hotpress.info",33],["turkleech.com",33],["anibatch.me",33],["anime-i.com",33],["gewinde-normen.de",33],["tucinehd.com",33],["plex-guide.de",33],["kdramasmaza.com.pk",33],["jellynote.com",34],["pouvideo.*",35],["povvideo.*",35],["povw1deo.*",35],["povwideo.*",35],["powv1deo.*",35],["powvibeo.*",35],["powvideo.*",35],["powvldeo.*",35],["eporner.com",36],["pornbimbo.com",37],["4j.com",37],["avoiderrors.com",38],["sitarchive.com",38],["livenewsof.com",38],["topnewsshow.com",38],["gatcha.org",38],["kusonime.com",38],["suicidepics.com",38],["codesnail.com",38],["codingshiksha.com",38],["graphicux.com",38],["citychilli.com",38],["talkjarvis.com",38],["hdmotori.it",39],["tubsexer.*",41],["femdomtb.com",41],["porno-tour.*",41],["lenkino.*",41],["bobs-tube.com",41],["pornfd.com",41],["pornomoll.*",41],["camsclips.*",41],["popno-tour.net",41],["watchmdh.to",41],["camwhores.tv",41],["camhub.cc",41],["elfqrin.com",42],["satcesc.com",43],["apfelpatient.de",43],["lusthero.com",44],["m4ufree.*",45],["m2list.com",45],["embed.nana2play.com",45],["elahmad.com",45],["dofusports.xyz",45],["dallasnews.com",46],["lnk.news",47],["lnk.parts",47],["efukt.com",48],["wendycode.com",48],["springfieldspringfield.co.uk",49],["porndoe.com",50],["smsget.net",[51,52]],["kjanime.net",53],["gioialive.it",54],["classicreload.com",55],["scriptzhub.com",55],["hotpornfile.org",56],["coolsoft.altervista.org",56],["hackedonlinegames.com",56],["dailytech-news.eu",56],["settlersonlinemaps.com",56],["ad-doge.com",56],["magdownload.org",56],["kpkuang.org",56],["crypto4yu.com",56],["faucetwork.space",56],["writedroid.*",56],["thenightwithoutthedawn.blogspot.com",56],["entutes.com",56],["claimlite.club",56],["newscon.org",56],["rl6mans.com",56],["chicoer.com",57],["bostonherald.com",57],["dailycamera.com",57],["sportsplays.com",58],["telerium.*",59],["pornvideotop.com",60],["krotkoosporcie.pl",60],["xstory-fr.com",60],["ytapi.cc",60],["letribunaldunet.fr",61],["vladan.fr",61],["live-tv-channels.org",62],["eslfast.com",63],["ge-map-overlays.appspot.com",64],["mad4wheels.com",64],["1xanimes.in",64],["logi.im",64],["emailnator.com",64],["freegamescasual.com",65],["tcpvpn.com",66],["oko.sh",66],["timesnownews.com",66],["timesnowhindi.com",66],["timesnowmarathi.com",66],["zoomtventertainment.com",66],["tsubasa.im",67],["sholah.net",68],["2rdroid.com",68],["bisceglielive.it",69],["pandajogosgratis.com.br",71],["5278.cc",72],["pandafreegames.*",73],["tonspion.de",74],["duplichecker.com",75],["plagiarismchecker.co",75],["plagiarismdetector.net",75],["searchenginereports.net",75],["smallseotools.com",76],["linkspaid.com",77],["proxydocker.com",77],["beeimg.com",[78,79]],["emturbovid.com",79],["findjav.com",79],["javggvideo.xyz",79],["mmtv01.xyz",79],["stbturbo.xyz",79],["streamsilk.com",79],["ftlauderdalebeachcam.com",80],["ftlauderdalewebcam.com",80],["juneauharborwebcam.com",80],["keywestharborwebcam.com",80],["kittycatcam.com",80],["mahobeachcam.com",80],["miamiairportcam.com",80],["morganhillwebcam.com",80],["njwildlifecam.com",80],["nyharborwebcam.com",80],["paradiseislandcam.com",80],["pompanobeachcam.com",80],["portbermudawebcam.com",80],["portcanaveralwebcam.com",80],["portevergladeswebcam.com",80],["portmiamiwebcam.com",80],["portnywebcam.com",80],["portnassauwebcam.com",80],["portstmaartenwebcam.com",80],["portstthomaswebcam.com",80],["porttampawebcam.com",80],["sxmislandcam.com",80],["themes-dl.com",80],["badassdownloader.com",80],["badasshardcore.com",80],["badassoftcore.com",80],["nulljungle.com",80],["teevee.asia",80],["otakukan.com",80],["thoptv.*",81],["gearingcommander.com",82],["generate.plus",83],["calculate.plus",83],["avcesar.com",84],["audiotag.info",85],["tudigitale.it",86],["ibcomputing.com",87],["legia.net",88],["acapellas4u.co.uk",89],["robloxscripts.com",90],["libreriamo.it",90],["postazap.com",90],["medebooks.xyz",90],["mashtips.com",90],["marriedgames.com.br",90],["4allprograms.me",90],["shortzzy.*",90],["nurgsm.com",90],["certbyte.com",90],["plugincrack.com",90],["gamingdeputy.com",90],["freewebcart.com",90],["streamhentaimovies.com",91],["konten.co.id",92],["diariodenavarra.es",93],["scripai.com",93],["myfxbook.com",93],["whatfontis.com",93],["tubereader.me",93],["optifine.net",94],["luzernerzeitung.ch",95],["tagblatt.ch",95],["ableitungsrechner.net",96],["alternet.org",97],["gourmetsupremacy.com",97],["shrib.com",98],["streameast.*",99],["thestreameast.*",99],["coolcast2.com",99],["techclips.net",99],["daddylivehd.*",99],["footyhunter.lol",99],["poscitech.click",99],["wecast.to",99],["sportbar.live",99],["freecourseweb.com",100],["devcourseweb.com",100],["coursewikia.com",100],["courseboat.com",100],["coursehulu.com",100],["pornhub.*",101],["lne.es",102],["pornult.com",103],["webcamsdolls.com",103],["bitcotasks.com",[103,144]],["adsy.pw",103],["playstore.pw",103],["exactpay.online",103],["thothd.to",103],["proplanta.de",104],["textograto.com",105],["voyageforum.com",106],["hmc-id.blogspot.com",106],["myabandonware.com",106],["wcofun.*",106],["ilforumdeibrutti.is",106],["prad.de",[107,159]],["chatta.it",108],["ketubanjiwa.com",109],["nsfw247.to",110],["funzen.net",110],["ilclubdellericette.it",110],["bollyholic.*",110],["extremereportbot.com",111],["getintopc.com",112],["qoshe.com",113],["lowellsun.com",114],["mamadu.pl",114],["dobrapogoda24.pl",114],["motohigh.pl",114],["namasce.pl",114],["ultimate-catch.eu",115],["cpopchanelofficial.com",116],["creditcardgenerator.com",117],["creditcardrush.com",117],["bostoncommons.net",117],["thejobsmovie.com",117],["hl-live.de",118],["satoshi-win.xyz",118],["encurtandourl.com",[118,122]],["www-daftarharga.blogspot.com",118],["ear-phone-review.com",118],["telefullenvivo.com",118],["listatv.pl",118],["daemon-hentai.com",[118,265]],["coin-profits.xyz",118],["relampagomovies.com",118],["wohnmobilforum.de",118],["nulledbear.com",118],["sinnerclownceviri.net",118],["nilopolisonline.com.br",119],["mesquitaonline.com",119],["yellowbridge.com",119],["yaoiotaku.com",120],["moneyhouse.ch",121],["ihow.info",122],["filesus.com",122],["gotxx.*",122],["sturls.com",122],["re.two.re",122],["turbo1.co",122],["cartoonsarea.xyz",122],["hartico.tv",122],["cupra.forum",122],["turkanime.*",123],["valeronevijao.com",123],["cigarlessarefy.com",123],["figeterpiazine.com",123],["yodelswartlike.com",123],["generatesnitrosate.com",123],["crownmakermacaronicism.com",123],["chromotypic.com",123],["gamoneinterrupted.com",123],["metagnathtuggers.com",123],["wolfdyslectic.com",123],["rationalityaloelike.com",123],["sizyreelingly.com",123],["simpulumlamerop.com",123],["urochsunloath.com",123],["monorhinouscassaba.com",123],["counterclockwisejacky.com",123],["35volitantplimsoles5.com",123],["scatch176duplicities.com",123],["antecoxalbobbing1010.com",123],["boonlessbestselling244.com",123],["cyamidpulverulence530.com",123],["guidon40hyporadius9.com",123],["449unceremoniousnasoseptal.com",123],["19turanosephantasia.com",123],["30sensualizeexpression.com",123],["321naturelikefurfuroid.com",123],["745mingiestblissfully.com",123],["availedsmallest.com",123],["greaseball6eventual20.com",123],["toxitabellaeatrebates306.com",123],["20demidistance9elongations.com",123],["audaciousdefaulthouse.com",123],["fittingcentermondaysunday.com",123],["fraudclatterflyingcar.com",123],["launchreliantcleaverriver.com",123],["matriculant401merited.com",123],["realfinanceblogcenter.com",123],["reputationsheriffkennethsand.com",123],["telyn610zoanthropy.com",123],["tubelessceliolymph.com",123],["tummulerviolableness.com",123],["un-block-voe.net",123],["v-o-e-unblock.com",123],["voe-un-block.com",123],["voe-unblock.*",123],["voeun-block.net",123],["voeunbl0ck.com",123],["voeunblck.com",123],["voeunblk.com",123],["voeunblock.com",123],["voeunblock1.com",123],["voeunblock2.com",123],["voeunblock3.com",123],["agefi.fr",124],["cariskuy.com",125],["letras2.com",125],["yusepjaelani.blogspot.com",126],["letras.mus.br",127],["eletronicabr.com",128],["mtlurb.com",129],["onemanhua.com",130],["laksa19.github.io",131],["javcl.com",131],["tvlogy.to",131],["rp5.*",131],["live.dragaoconnect.net",131],["beststremo.com",131],["seznamzpravy.cz",131],["xerifetech.com",131],["freemcserver.net",131],["t3n.de",132],["allindiaroundup.com",133],["tapchipi.com",134],["dcleakers.com",134],["esgeeks.com",134],["pugliain.net",134],["uplod.net",134],["worldfreeware.com",134],["cuitandokter.com",134],["tech-blogs.com",134],["cardiagn.com",134],["fikiri.net",134],["myhackingworld.com",134],["phoenixfansub.com",134],["vectorizer.io",135],["onehack.us",135],["smgplaza.com",135],["thapcam.net",135],["breznikar.com",135],["thefastlaneforum.com",136],["trade2win.com",137],["modagamers.com",138],["khatrimaza.*",138],["freemagazines.top",138],["pogolinks.*",138],["straatosphere.com",138],["rule34porn.net",138],["nullpk.com",138],["adslink.pw",138],["downloadudemy.com",138],["picgiraffe.com",138],["weadown.com",138],["freepornsex.net",138],["nurparatodos.com.ar",138],["popcornstream.*",139],["routech.ro",139],["hokej.net",139],["turkmmo.com",140],["acdriftingpro.com",141],["palermotoday.it",142],["baritoday.it",142],["trentotoday.it",142],["agrigentonotizie.it",142],["anconatoday.it",142],["arezzonotizie.it",142],["avellinotoday.it",142],["bresciatoday.it",142],["brindisireport.it",142],["casertanews.it",142],["cataniatoday.it",142],["cesenatoday.it",142],["chietitoday.it",142],["forlitoday.it",142],["frosinonetoday.it",142],["genovatoday.it",142],["ilpescara.it",142],["ilpiacenza.it",142],["latinatoday.it",142],["lecceprima.it",142],["leccotoday.it",142],["livornotoday.it",142],["messinatoday.it",142],["milanotoday.it",142],["modenatoday.it",142],["monzatoday.it",142],["novaratoday.it",142],["padovaoggi.it",142],["parmatoday.it",142],["perugiatoday.it",142],["pisatoday.it",142],["quicomo.it",142],["ravennatoday.it",142],["reggiotoday.it",142],["riminitoday.it",142],["romatoday.it",142],["salernotoday.it",142],["sondriotoday.it",142],["sportpiacenza.it",142],["ternitoday.it",142],["today.it",142],["torinotoday.it",142],["trevisotoday.it",142],["triesteprima.it",142],["udinetoday.it",142],["veneziatoday.it",142],["vicenzatoday.it",142],["thumpertalk.com",143],["arkcod.org",143],["thelayoff.com",144],["blog.coinsrise.net",144],["blog.cryptowidgets.net",144],["blog.insurancegold.in",144],["blog.wiki-topia.com",144],["blog.coinsvalue.net",144],["blog.cookinguide.net",144],["blog.freeoseocheck.com",144],["blog.makeupguide.net",144],["blog.carstopia.net",144],["blog.carsmania.net",144],["shorterall.com",144],["blog24.me",144],["maxstream.video",144],["tvepg.eu",144],["manwan.xyz",144],["dailymaverick.co.za",145],["ludigames.com",146],["made-by.org",146],["worldtravelling.com",146],["igirls.in",146],["technichero.com",146],["androidadult.com",146],["aeroxplorer.com",146],["sportitalialive.com",146],["starkroboticsfrc.com",147],["sinonimos.de",147],["antonimos.de",147],["quesignifi.ca",147],["tiktokrealtime.com",147],["tiktokcounter.net",147],["tpayr.xyz",147],["poqzn.xyz",147],["ashrfd.xyz",147],["rezsx.xyz",147],["tryzt.xyz",147],["ashrff.xyz",147],["rezst.xyz",147],["dawenet.com",147],["erzar.xyz",147],["waezm.xyz",147],["waezg.xyz",147],["blackwoodacademy.org",147],["cryptednews.space",147],["vivuq.com",147],["swgop.com",147],["vbnmll.com",147],["telcoinfo.online",147],["dshytb.com",147],["fadedfeet.com",148],["homeculina.com",148],["ineedskin.com",148],["kenzo-flowertag.com",148],["lawyex.co",148],["mdn.lol",148],["bitzite.com",149],["coingraph.us",150],["impact24.us",150],["nanolinks.in",151],["adrinolinks.com",151],["link.vipurl.in",151],["apkmoddone.com",152],["sitemini.io.vn",[153,154]],["vip1s.top",[153,154]],["phongroblox.com",155],["financacerta.com",156],["encurtads.net",156],["shortencash.click",157],["lablue.*",158],["4-liga.com",159],["4fansites.de",159],["4players.de",159],["9monate.de",159],["aachener-nachrichten.de",159],["aachener-zeitung.de",159],["abendblatt.de",159],["abendzeitung-muenchen.de",159],["about-drinks.com",159],["abseits-ka.de",159],["airliners.de",159],["ajaxshowtime.com",159],["allgemeine-zeitung.de",159],["alpin.de",159],["antenne.de",159],["arcor.de",159],["areadvd.de",159],["areamobile.de",159],["ariva.de",159],["astronews.com",159],["aussenwirtschaftslupe.de",159],["auszeit.bio",159],["auto-motor-und-sport.de",159],["auto-service.de",159],["autobild.de",159],["autoextrem.de",159],["autopixx.de",159],["autorevue.at",159],["autotrader.nl",159],["az-online.de",159],["baby-vornamen.de",159],["babyclub.de",159],["bafoeg-aktuell.de",159],["berliner-kurier.de",159],["berliner-zeitung.de",159],["bigfm.de",159],["bikerszene.de",159],["bildderfrau.de",159],["blackd.de",159],["blick.de",159],["boerse-online.de",159],["boerse.de",159],["boersennews.de",159],["braunschweiger-zeitung.de",159],["brieffreunde.de",159],["brigitte.de",159],["buerstaedter-zeitung.de",159],["buffed.de",159],["businessinsider.de",159],["buzzfeed.at",159],["buzzfeed.de",159],["caravaning.de",159],["cavallo.de",159],["chefkoch.de",159],["cinema.de",159],["clever-tanken.de",159],["computerbild.de",159],["computerhilfen.de",159],["comunio-cl.com",159],["comunio.*",159],["connect.de",159],["chip.de",159],["da-imnetz.de",159],["dasgelbeblatt.de",159],["dbna.com",159],["dbna.de",159],["deichstube.de",159],["deine-tierwelt.de",159],["der-betze-brennt.de",159],["derwesten.de",159],["desired.de",159],["dhd24.com",159],["dieblaue24.com",159],["digitalfernsehen.de",159],["dnn.de",159],["donnerwetter.de",159],["e-hausaufgaben.de",159],["e-mountainbike.com",159],["eatsmarter.de",159],["echo-online.de",159],["ecomento.de",159],["einfachschoen.me",159],["elektrobike-online.com",159],["eltern.de",159],["epochtimes.de",159],["essen-und-trinken.de",159],["express.de",159],["extratipp.com",159],["familie.de",159],["fanfiktion.de",159],["fehmarn24.de",159],["fettspielen.de",159],["fid-gesundheitswissen.de",159],["finanzen.*",159],["finanznachrichten.de",159],["finanztreff.de",159],["finya.de",159],["firmenwissen.de",159],["fitforfun.de",159],["fnp.de",159],["football365.fr",159],["formel1.de",159],["fr.de",159],["frankfurter-wochenblatt.de",159],["freenet.de",159],["fremdwort.de",159],["froheweihnachten.info",159],["frustfrei-lernen.de",159],["fuldaerzeitung.de",159],["funandnews.de",159],["fussballdaten.de",159],["futurezone.de",159],["gala.de",159],["gamepro.de",159],["gamersglobal.de",159],["gamesaktuell.de",159],["gamestar.de",159],["gameswelt.*",159],["gamezone.de",159],["gartendialog.de",159],["gartenlexikon.de",159],["gedichte.ws",159],["geissblog.koeln",159],["gelnhaeuser-tageblatt.de",159],["general-anzeiger-bonn.de",159],["geniale-tricks.com",159],["genialetricks.de",159],["gesund-vital.de",159],["gesundheit.de",159],["gevestor.de",159],["gewinnspiele.tv",159],["giessener-allgemeine.de",159],["giessener-anzeiger.de",159],["gifhorner-rundschau.de",159],["giga.de",159],["gipfelbuch.ch",159],["gmuender-tagespost.de",159],["gruenderlexikon.de",159],["gusto.at",159],["gut-erklaert.de",159],["gutfuerdich.co",159],["hallo-muenchen.de",159],["hamburg.de",159],["hanauer.de",159],["hardwareluxx.de",159],["hartziv.org",159],["harzkurier.de",159],["haus-garten-test.de",159],["hausgarten.net",159],["haustec.de",159],["haz.de",159],["heftig.*",159],["heidelberg24.de",159],["heilpraxisnet.de",159],["heise.de",159],["helmstedter-nachrichten.de",159],["hersfelder-zeitung.de",159],["hftg.co",159],["hifi-forum.de",159],["hna.de",159],["hochheimer-zeitung.de",159],["hoerzu.de",159],["hofheimer-zeitung.de",159],["iban-rechner.de",159],["ikz-online.de",159],["immobilienscout24.de",159],["ingame.de",159],["inside-digital.de",159],["inside-handy.de",159],["investor-verlag.de",159],["jappy.com",159],["jpgames.de",159],["kabeleins.de",159],["kachelmannwetter.com",159],["kamelle.de",159],["kicker.de",159],["kindergeld.org",159],["klettern-magazin.de",159],["klettern.de",159],["kochbar.de",159],["kreis-anzeiger.de",159],["kreisbote.de",159],["kreiszeitung.de",159],["ksta.de",159],["kurierverlag.de",159],["lachainemeteo.com",159],["lampertheimer-zeitung.de",159],["landwirt.com",159],["laut.de",159],["lauterbacher-anzeiger.de",159],["leckerschmecker.me",159],["leinetal24.de",159],["lesfoodies.com",159],["levif.be",159],["lifeline.de",159],["liga3-online.de",159],["likemag.com",159],["linux-community.de",159],["linux-magazin.de",159],["live.vodafone.de",159],["ln-online.de",159],["lokalo24.de",159],["lustaufsleben.at",159],["lustich.de",159],["lvz.de",159],["lz.de",159],["mactechnews.de",159],["macwelt.de",159],["macworld.co.uk",159],["mail.de",159],["main-spitze.de",159],["manager-magazin.de",159],["manga-tube.me",159],["mathebibel.de",159],["mathepower.com",159],["maz-online.de",159],["medisite.fr",159],["mehr-tanken.de",159],["mein-kummerkasten.de",159],["mein-mmo.de",159],["mein-wahres-ich.de",159],["meine-anzeigenzeitung.de",159],["meinestadt.de",159],["menshealth.de",159],["mercato365.com",159],["merkur.de",159],["messen.de",159],["metal-hammer.de",159],["metalflirt.de",159],["meteologix.com",159],["minecraft-serverlist.net",159],["mittelbayerische.de",159],["modhoster.de",159],["moin.de",159],["mopo.de",159],["morgenpost.de",159],["motor-talk.de",159],["motorbasar.de",159],["motorradonline.de",159],["motorsport-total.com",159],["motortests.de",159],["mountainbike-magazin.de",159],["moviejones.de",159],["moviepilot.de",159],["mt.de",159],["mtb-news.de",159],["musiker-board.de",159],["musikexpress.de",159],["musikradar.de",159],["mz-web.de",159],["n-tv.de",159],["naumburger-tageblatt.de",159],["netzwelt.de",159],["neuepresse.de",159],["neueroeffnung.info",159],["news.at",159],["news.de",159],["news38.de",159],["newsbreak24.de",159],["nickles.de",159],["nicknight.de",159],["nl.hardware.info",159],["nn.de",159],["nnn.de",159],["nordbayern.de",159],["notebookchat.com",159],["notebookcheck-ru.com",159],["notebookcheck-tr.com",159],["notebookcheck.*",159],["noz-cdn.de",159],["noz.de",159],["nrz.de",159],["nw.de",159],["nwzonline.de",159],["oberhessische-zeitung.de",159],["och.to",159],["oeffentlicher-dienst.info",159],["onlinekosten.de",159],["onvista.de",159],["op-marburg.de",159],["op-online.de",159],["outdoor-magazin.com",159],["outdoorchannel.de",159],["paradisi.de",159],["pc-magazin.de",159],["pcgames.de",159],["pcgameshardware.de",159],["pcwelt.de",159],["pcworld.es",159],["peiner-nachrichten.de",159],["pferde.de",159],["pietsmiet.de",159],["pixelio.de",159],["pkw-forum.de",159],["playboy.de",159],["playfront.de",159],["pnn.de",159],["pons.com",159],["prignitzer.de",159],["profil.at",159],["promipool.de",159],["promobil.de",159],["prosiebenmaxx.de",159],["psychic.de",[159,172]],["quoka.de",159],["radio.at",159],["radio.de",159],["radio.dk",159],["radio.es",159],["radio.fr",159],["radio.it",159],["radio.net",159],["radio.pl",159],["radio.pt",159],["radio.se",159],["ran.de",159],["readmore.de",159],["rechtslupe.de",159],["recording.de",159],["rennrad-news.de",159],["reuters.com",159],["reviersport.de",159],["rhein-main-presse.de",159],["rheinische-anzeigenblaetter.de",159],["rimondo.com",159],["roadbike.de",159],["roemische-zahlen.net",159],["rollingstone.de",159],["rot-blau.com",159],["rp-online.de",159],["rtl.de",[159,250]],["rtv.de",159],["rugby365.fr",159],["ruhr24.de",159],["rundschau-online.de",159],["runnersworld.de",159],["safelist.eu",159],["salzgitter-zeitung.de",159],["sat1.de",159],["sat1gold.de",159],["schoener-wohnen.de",159],["schwaebische-post.de",159],["schwarzwaelder-bote.de",159],["serienjunkies.de",159],["shz.de",159],["sixx.de",159],["skodacommunity.de",159],["smart-wohnen.net",159],["sn.at",159],["sozialversicherung-kompetent.de",159],["spiegel.de",159],["spielen.de",159],["spieletipps.de",159],["spielfilm.de",159],["sport.de",159],["sport1.de",159],["sport365.fr",159],["sportal.de",159],["spox.com",159],["stern.de",159],["stuttgarter-nachrichten.de",159],["stuttgarter-zeitung.de",159],["sueddeutsche.de",159],["svz.de",159],["szene1.at",159],["szene38.de",159],["t-online.de",159],["tagesspiegel.de",159],["taschenhirn.de",159],["techadvisor.co.uk",159],["techstage.de",159],["tele5.de",159],["teltarif.de",159],["testedich.*",159],["the-voice-of-germany.de",159],["thueringen24.de",159],["tichyseinblick.de",159],["tierfreund.co",159],["tiervermittlung.de",159],["torgranate.de",159],["transfermarkt.*",159],["trend.at",159],["truckscout24.*",159],["tv-media.at",159],["tvdigital.de",159],["tvinfo.de",159],["tvspielfilm.de",159],["tvtoday.de",159],["tvtv.*",159],["tz.de",159],["unicum.de",159],["unnuetzes.com",159],["unsere-helden.com",159],["unterhalt.net",159],["usinger-anzeiger.de",159],["usp-forum.de",159],["videogameszone.de",159],["vienna.at",159],["vip.de",159],["virtualnights.com",159],["vox.de",159],["wa.de",159],["wallstreet-online.de",[159,162]],["waz.de",159],["weather.us",159],["webfail.com",159],["weihnachten.me",159],["weihnachts-bilder.org",159],["weihnachts-filme.com",159],["welt.de",159],["weltfussball.at",159],["weristdeinfreund.de",159],["werkzeug-news.de",159],["werra-rundschau.de",159],["wetterauer-zeitung.de",159],["wetteronline.*",159],["wieistmeineip.*",159],["wiesbadener-kurier.de",159],["wiesbadener-tagblatt.de",159],["winboard.org",159],["windows-7-forum.net",159],["winfuture.de",[159,168]],["wintotal.de",159],["wlz-online.de",159],["wn.de",159],["wohngeld.org",159],["wolfenbuetteler-zeitung.de",159],["wolfsburger-nachrichten.de",159],["woman.at",159],["womenshealth.de",159],["wormser-zeitung.de",159],["woxikon.de",159],["wp.de",159],["wr.de",159],["wunderweib.de",159],["yachtrevue.at",159],["ze.tt",159],["zeit.de",159],["meineorte.com",160],["osthessen-news.de",160],["techadvisor.com",160],["focus.de",160],["wetter.*",161],["deinesexfilme.com",163],["einfachtitten.com",163],["lesbenhd.com",163],["milffabrik.com",[163,221]],["porn-monkey.com",163],["porndrake.com",163],["pornhubdeutsch.net",163],["pornoaffe.com",163],["pornodavid.com",163],["pornoente.tv",[163,221]],["pornofisch.com",163],["pornofelix.com",163],["pornohammer.com",163],["pornohelm.com",163],["pornoklinge.com",163],["pornotom.com",[163,221]],["pornotommy.com",163],["pornovideos-hd.com",163],["pornozebra.com",[163,221]],["xhamsterdeutsch.xyz",163],["xnxx-sexfilme.com",163],["nu6i-bg-net.com",164],["khsm.io",164],["webcreator-journal.com",164],["msdos-games.com",164],["blocklayer.com",164],["weknowconquer.com",164],["aquarius-horoscopes.com",165],["cancer-horoscopes.com",165],["dubipc.blogspot.com",165],["echoes.gr",165],["engel-horoskop.de",165],["freegames44.com",165],["fuerzasarmadas.eu",165],["gemini-horoscopes.com",165],["jurukunci.net",165],["krebs-horoskop.com",165],["leo-horoscopes.com",165],["maliekrani.com",165],["nklinks.click",165],["ourenseando.es",165],["pisces-horoscopes.com",165],["radio-en-direct.fr",165],["sagittarius-horoscopes.com",165],["scorpio-horoscopes.com",165],["singlehoroskop-loewe.de",165],["skat-karten.de",165],["skorpion-horoskop.com",165],["taurus-horoscopes.com",165],["the1security.com",165],["virgo-horoscopes.com",165],["zonamarela.blogspot.com",165],["yoima.hatenadiary.com",165],["kaystls.site",166],["ftuapps.dev",167],["studydhaba.com",167],["freecourse.tech",167],["victor-mochere.com",167],["papunika.com",167],["mobilanyheter.net",167],["prajwaldesai.com",[167,240]],["carscoops.com",168],["dziennik.pl",168],["eurointegration.com.ua",168],["flatpanelshd.com",168],["hoyme.jp",168],["issuya.com",168],["itainews.com",168],["iusm.co.kr",168],["logicieleducatif.fr",168],["mynet.com",[168,188]],["onlinegdb.com",168],["picrew.me",168],["pravda.com.ua",168],["reportera.co.kr",168],["sportsrec.com",168],["sportsseoul.com",168],["text-compare.com",168],["tweaksforgeeks.com",168],["wfmz.com",168],["worldhistory.org",168],["palabr.as",168],["motscroises.fr",168],["cruciverba.it",168],["w.grapps.me",168],["gazetaprawna.pl",168],["pressian.com",168],["raenonx.cc",[168,266]],["indiatimes.com",168],["missyusa.com",168],["aikatu.jp",168],["ark-unity.com",168],["cool-style.com.tw",168],["doanhnghiepvn.vn",168],["automobile-catalog.com",169],["motorbikecatalog.com",169],["maketecheasier.com",169],["mlbpark.donga.com",170],["jjang0u.com",171],["forumdz.com",172],["abandonmail.com",172],["flmods.com",172],["zilinak.sk",172],["projectfreetv.stream",172],["hotdesimms.com",172],["pdfaid.com",172],["bootdey.com",172],["mail.com",172],["expresskaszubski.pl",172],["moegirl.org.cn",172],["flix-wave.lol",172],["fmovies0.cc",172],["worthcrete.com",172],["my-code4you.blogspot.com",173],["vrcmods.com",174],["osuskinner.com",174],["osuskins.net",174],["pentruea.com",[175,176]],["mchacks.net",177],["why-tech.it",178],["compsmag.com",179],["tapetus.pl",180],["autoroad.cz",181],["brawlhalla.fr",181],["tecnobillo.com",181],["sexcamfreeporn.com",182],["breatheheavy.com",183],["wenxuecity.com",184],["key-hub.eu",185],["fabioambrosi.it",186],["tattle.life",187],["emuenzen.de",187],["terrylove.com",187],["cidade.iol.pt",189],["fantacalcio.it",190],["hentaifreak.org",191],["hypebeast.com",192],["krankheiten-simulieren.de",193],["catholic.com",194],["3dmodelshare.org",195],["techinferno.com",196],["ibeconomist.com",197],["bookriot.com",198],["purposegames.com",199],["globo.com",200],["latimes.com",200],["claimrbx.gg",201],["perelki.net",202],["vpn-anbieter-vergleich-test.de",203],["livingincebuforums.com",204],["paperzonevn.com",205],["alltechnerd.com",206],["malaysianwireless.com",207],["erinsakura.com",208],["infofuge.com",208],["freejav.guru",208],["novelmultiverse.com",208],["fritidsmarkedet.dk",209],["maskinbladet.dk",209],["15min.lt",210],["baddiehub.com",211],["mr9soft.com",212],["21porno.com",213],["adult-sex-gamess.com",214],["hentaigames.app",214],["mobilesexgamesx.com",214],["mysexgamer.com",214],["porngameshd.com",214],["sexgamescc.com",214],["xnxx-sex-videos.com",214],["f2movies.to",215],["freeporncave.com",216],["tubsxxx.com",217],["manga18fx.com",218],["freebnbcoin.com",218],["sextvx.com",219],["muztext.com",220],["pornohans.com",221],["nursexfilme.com",221],["pornohirsch.net",221],["xhamster-sexvideos.com",221],["pornoschlange.com",221],["xhamsterdeutsch.*",221],["hdpornos.net",221],["gutesexfilme.com",221],["zona-leros.com",221],["charbelnemnom.com",222],["simplebits.io",223],["online-fix.me",224],["privatemoviez.*",225],["gamersdiscussionhub.com",225],["owlzo.com",226],["q1003.com",227],["blogpascher.com",228],["testserver.pro",229],["lifestyle.bg",229],["money.bg",229],["news.bg",[229,308]],["topsport.bg",229],["webcafe.bg",229],["schoolcheats.net",230],["mgnet.xyz",231],["advertiserandtimes.co.uk",232],["xvideos2020.me",233],["111.90.159.132",234],["techsolveprac.com",235],["joomlabeginner.com",236],["askpaccosi.com",237],["largescaleforums.com",238],["dubznetwork.com",239],["dongknows.com",241],["traderepublic.community",242],["babia.to",243],["code2care.org",244],["gmx.*",245],["xxxxsx.com",246],["ngontinh24.com",247],["idevicecentral.com",248],["dzeko11.net",249],["mangacrab.com",251],["hortonanderfarom.blogspot.com",252],["viefaucet.com",253],["pourcesoir.in",253],["cloud-computing-central.com",254],["afk.guide",255],["businessnamegenerator.com",256],["derstandard.at",257],["derstandard.de",257],["rocketnews24.com",258],["soranews24.com",258],["youpouch.com",258],["gourmetscans.net",259],["ilsole24ore.com",260],["ipacrack.com",261],["hentaiporn.one",262],["infokik.com",263],["porhubvideo.com",264],["webseriessex.com",264],["panuvideo.com",264],["pornktubes.net",264],["daemonanime.net",265],["bgmateriali.com",265],["deezer.com",266],["fosslinux.com",267],["shrdsk.me",268],["examword.com",269],["sempreupdate.com.br",269],["tribuna.com",270],["trendsderzukunft.de",271],["gal-dem.com",271],["lostineu.eu",271],["oggitreviso.it",271],["speisekarte.de",271],["mixed.de",271],["lightnovelpub.*",[272,273]],["lightnovelspot.com",[272,273]],["lightnovelworld.com",[272,273]],["novelpub.com",[272,273]],["webnovelpub.com",[272,273]],["hwzone.co.il",275],["nammakalvi.com",276],["igay69.com",276],["c2g.at",277],["terafly.me",277],["elamigos-games.com",277],["elamigos-games.net",277],["elamigosgames.org",277],["dktechnicalmate.com",278],["recipahi.com",278],["vpntester.org",279],["japscan.lol",280],["digitask.ru",281],["tempumail.com",282],["sexvideos.host",283],["camcaps.*",284],["10alert.com",285],["cryptstream.de",286],["nydus.org",286],["techhelpbd.com",287],["fapdrop.com",288],["cellmapper.net",289],["hdrez.com",290],["youwatch-serie.com",290],["russland.jetzt",290],["bembed.net",291],["embedv.net",291],["fslinks.org",291],["listeamed.net",291],["v6embed.xyz",291],["vembed.*",291],["vgplayer.xyz",291],["vid-guard.com",291],["yesmovies.*>>",291],["pistona.xyz",291],["vinomo.xyz",291],["giga-uqload.xyz",291],["moflix-stream.*",[291,347]],["printablecreative.com",292],["peachprintable.com",292],["comohoy.com",293],["leak.sx",293],["paste.bin.sx",293],["pornleaks.in",293],["merlininkazani.com",293],["j91.asia",294],["rekidai-info.github.io",295],["jeniusplay.com",296],["indianyug.com",297],["rgb.vn",297],["needrom.com",298],["criptologico.com",299],["megadrive-emulator.com",300],["eromanga-show.com",301],["hentai-one.com",301],["hentaipaw.com",301],["10minuteemails.com",302],["luxusmail.org",302],["w3cub.com",303],["bangpremier.com",304],["nyaa.iss.ink",305],["drivebot.*",306],["thenextplanet1.*",307],["tnp98.xyz",307],["freepdfcomic.com",309],["techedubyte.com",310],["tickzoo.tv",311],["oploverz.*",311],["memedroid.com",312],["karaoketexty.cz",313],["filmizlehdfilm.com",314],["filmizletv.*",314],["fullfilmizle.cc",314],["gofilmizle.net",314],["resortcams.com",315],["cheatography.com",315],["sonixgvn.net",316],["autoscout24.*",317],["mjakmama24.pl",318],["cheatermad.com",319],["ville-ideale.fr",320],["brainly.*",321],["eodev.com",321],["xfreehd.com",322],["freethesaurus.com",323],["thefreedictionary.com",323],["fm-arena.com",324],["tradersunion.com",325],["tandess.com",326],["allosurf.net",326],["spontacts.com",327],["dankmemer.lol",328],["getexploits.com",329],["fplstatistics.com",330],["breitbart.com",331],["salidzini.lv",332],["choosingnothing.com",333],["cryptorank.io",[334,335]],["4kwebplay.xyz",336],["qqwebplay.xyz",336],["viwlivehdplay.ru",336],["molbiotools.com",337],["vods.tv",338],["18xxx.xyz",339],["raidrush.net",340],["xnxxcom.xyz",341],["videzz.net",342],["spambox.xyz",343],["dreamdth.com",344],["freemodsapp.in",344],["onlytech.com",344],["player.jeansaispasplus.homes",345],["en-thunderscans.com",346],["iqksisgw.xyz",348],["caroloportunidades.com.br",349],["coempregos.com.br",349],["foodiesgallery.com",349],["vikatan.com",350],["camhub.world",351],["mma-core.*",352],["teracourses.com",353],["servustv.com",354],["freevipservers.net",355],["streambtw.com",356],["qrcodemonkey.net",357],["streamup.ws",358],["tv-films.co.uk",359]]);
const exceptionsMap = new Map([["vvid30c.*",[291]]]);
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
    try { preventSetTimeout(...argsList[i]); }
    catch { }
}

/******************************************************************************/

// End of local scope
})();

void 0;
