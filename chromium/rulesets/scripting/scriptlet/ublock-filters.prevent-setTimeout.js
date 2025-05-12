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
const argsList = [["divIds"],["]();}","500"],[".adv-"],[")](this,...","3000-6000"],["(new Error(","3000-6000"],[".offsetHeight>0"],["adblock"],["googleFC"],["adb"],["adBlockerDetected"],["show"],["InfMediafireMobileFunc","1000"],["google_jobrunner"],["admc"],["'0x"],["apstagLOADED"],["/Adb|moneyDetect/"],["disableDeveloper"],["Blocco","2000"],["test","0"],["checkAdblockUser","1000"],["checkPub","6000"],["document.querySelector","5000"],["nextFunction","250"],["backRedirect"],["document.querySelectorAll","1000"],["style"],["clientHeight"],["addEventListener","0"],["adblock","2000"],["nextFunction","2000"],["byepopup","5000"],["test.remove","100"],["additional_src","300"],["()","2000"],["css_class.show"],["CANG","3000"],["updato-overlay","500"],["innerText","2000"],["alert","8000"],["css_class"],["()","50"],["debugger"],["initializeCourier","3000"],["redirectPage"],["_0x","2000"],["ads","750"],["location.href","500"],["Adblock","5000"],["disable","200"],["CekAab","0"],["rbm_block_active","1000"],["show()"],["_0x"],["n.trigger","1"],["abDetected"],["KeepOpeningPops","1000"],["location.href"],["adb","0"],["adBlocked"],["warning","100"],["adsbygoogle"],["adblock_popup","500"],["Adblock"],["location.href","10000"],["keep-ads","2000"],["#rbm_block_active","1000"],["null","4000"],["()","2500"],["myaabpfun","3000"],["adFilled","2500"],["()","15000"],["showPopup"],["adrecover"],["()","1000"],["document.cookie","2500"],["window.open"],["innerHTML"],["readyplayer","2000"],["/innerHTML|AdBlock/"],["checkStopBlock"],["adspot_top","1500"],["/offsetHeight|google|Global/"],["an_message","500"],["Adblocker","10000"],["timeoutChecker"],["bait","1"],["ai_adb"],["pum-open"],["overlay","2000"],["/adblock/i"],["Math.round","1000"],["adblock","5"],["ag_adBlockerDetected"],["null"],["adb","6000"],["sadbl"],["brave_load_popup"],["adsbytrafficjunkycontext"],["ipod"],["offsetWidth"],["/$|adBlock/"],["()"],["AdBlock"],["stop-scrolling"],["Adv"],["blockUI","2000"],["mdpDeBlocker"],["/_0x|debug/"],["/ai_adb|_0x/"],["adBlock"],["","1"],["undefined"],["check","1"],["adsBlocked"],["nextFunction"],["blocker"],["afs_ads","2000"],["bait"],["getComputedStyle","250"],["blocked"],["{r()","0"],["nextFunction","450"],["Debug"],["r()","0"],["test","100"],["purple_box"],["checkSiteNormalLoad"],["0x"],["adBlockOverlay"],["Detected","500"],["mdp"],["modal"],[".show","1000"],[".show"],["showModal"],["blur"],["samOverlay"],["native"],["bADBlock"],["location"],["alert"],["t()","0"],["ads"],["documentElement.innerHTML"],["/adblock|isRequestPresent/"],["_0x","500"],["isRequestPresent"],["alert","2000"],["1e3*"],["","1999"],["","2000"],["/^/","1000"],["checkAdBlock"],["displayAdBlockerMessage"],["push","500"],[".call(null)","10"],[".call(null)"],["(null)","10"],["userHasAdblocker"],["appendChild"],["getComputedStyle"],["displayMessage","2000"],["AdDetect"],["ai_"],["error-report.com"],["loader.min.js"],["content-loader.com"],["()=>","5000"],["[native code]","500"],["offsetHeight"],["offsetLeft"],["height"],["mdp_deblocker"],["charAt"],["checkAds"],["fadeIn","0"],["jQuery"],["/^/"],["check"],["Adblocker"],["eabdModal"],["ab_root.show"],["gaData"],["ad"],["prompt","1000"],["googlefc"],["adblock detection"],[".offsetHeight","100"],["popState"],["ad-block-popup"],["exitTimer"],["innerHTML.replace"],["data?","4000"],["eabpDialog"],["adsense"],["/Adblock|_ad_/"],["googletag"],["f.parentNode.removeChild(f)","100"],["swal","500"],["keepChecking","1000"],["openPopup"],[".offsetHeight"],["()=>{"],["nitroAds"],["class.scroll","1000"],["disableDeveloperTools"],["Check"],["insertBefore"],["css_class.scroll"],["/null|Error/","10000"],["window.location.href","50"],["/out.php"],["/0x|devtools/"],["location.replace","300"],["window.location.href"],["fetch"],["window.location.href=link"],["reachGoal"],["Adb"],["ai"],["","3000"],["/width|innerHTML/"],["magnificPopup"],["adblockEnabled"],["google_ad"],["document.location"],["google"],["answers"],["top-right","2000"],["enforceAdStatus"],["loadScripts"],["mfp"],["display","5000"],["eb"],["/adb/i"],[").show()"],["","1000"],["site-access"],["/Ads|adbl|offsetHeight/"],["/show|innerHTML/"],["/show|document\\.createElement/"],["Msg"],["UABP"],["()","150"],["href"],["aaaaa-modal"],["()=>"],["keepChecking"],["null","10"],["","500"],["pop"],["/adbl/i"],["-0x"],["display"],["gclid"],["event","3000"],["rejectWith"],[".data?"],["refresh"],["location.href","3000"],["window.location"],["ga"],["myTestAd"],["adbl"],["Ads"],["ShowAdBLockerNotice"],["ad_listener"],["open"],["(!0)"],["Delay"],["/appendChild|e\\(\"/"],["=>"],["ADB"],["site-access-popup"],["data?"],["checkAdblockUser"],["offsetHeight","100"],["/salesPopup|mira-snackbar/"],["detectImgLoad"],["offsetHeight","200"],["detector"],["replace"],["touchstart"],["siteAccessFlag"],["ab"],["/adblocker|alert/"],["redURL"],["/children\\('ins'\\)|Adblock|adsbygoogle/"],["displayMessage"],["afterOpen"],["chkADB"],["onDetected"],["fuckadb"],["/aframe|querySelector/","1000-"],["detect"],["siteAccessPopup"],["/adsbygoogle|adblock|innerHTML|setTimeout/"],["akadb"],["biteDisplay"],["/[a-z]\\(!0\\)/","800"],["ad_block"],["/detectAdBlocker|window.open/"],["adBlockDetected"],["popUnder"],["/GoToURL|delay/"],["window.location.href","300"],["ad_display"],[".redirect"],["popup"],["/adScriptPath|MMDConfig/"],["/native|\\{n\\(\\)/"],["psresimler"],["adblocker"],["EzoIvent"],["/Detect|adblock|style\\.display|\\[native code]|\\.call\\(null\\)/"],["removeChild"],["offset"],["contrformpub"],["trigger","0"],["/\\.append|\\.innerHTML|undefined|\\.css|blocker|flex|\\$\\('|obfuscatedMsg/"],["warn"],["getComputedStyle","2000"],["video-popup"],["detectAdblock"],["detectAdBlocker"],["nads"],["current.children"],["adStatus"],["BN_CAMPAIGNS"],["media_place_list"],["cvad"],["...","300"],["/\\{[a-z]\\(!0\\)\\}/"],["stackTrace"],["inner-ad"],["_ET"],[".clientHeight"],["getComputedStyle(el)"],["location.replace"],["console.clear"],["ad_block_detector"],["document.createElement"],["sandbox"],["getComputedStyle(testAd)"],["affiliate"],["document['\\x"],["hasAdblock"],["/adblock|isblock/i"],["visibility","2000"],["displayAdBlockedVideo"],["adBlockerModal"],["","10000-15000"],["length"],["atob","120000"],["#ad_blocker_detector"],["push"],["AdBlocker"],["()","5000"],["wbDeadHinweis"],["","10000"]];
const hostnamesMap = new Map([["japscan.lol",[0,279]],["poophq.com",1],["veev.to",1],["infinityscans.xyz",2],["infinityscans.net",2],["infinityscans.org",2],["dogdrip.net",3],["infinityfree.com",3],["smsonline.cloud",[3,4]],["faqwiki.us",5],["mail.yahoo.com",[6,273]],["maxcheaters.com",6],["postimees.ee",6],["police.community",6],["gisarea.com",6],["schaken-mods.com",6],["tvnet.lv",6],["theclashify.com",6],["txori.com",6],["olarila.com",6],["deletedspeedstreams.blogspot.com",6],["schooltravelorganiser.com",6],["xhardhempus.net",6],["mhn.quest",6],["leagueofgraphs.com",6],["hieunguyenphoto.com",6],["benzinpreis.de",6],["lastampa.it",7],["m.timesofindia.com",8],["timesofindia.indiatimes.com",8],["youmath.it",8],["redensarten-index.de",8],["lesoir.be",8],["electriciansforums.net",8],["keralatelecom.info",8],["universegunz.net",8],["happypenguin.altervista.org",8],["everyeye.it",8],["eztv.*",8],["bluedrake42.com",8],["supermarioemulator.com",8],["futbollibrehd.com",8],["eska.pl",8],["eskarock.pl",8],["voxfm.pl",8],["mathaeser.de",8],["betaseries.com",8],["free-sms-receive.com",8],["sms-receive-online.com",8],["computer76.ru",8],["golem.de",[9,10,156]],["hdbox.ws",10],["todopolicia.com",10],["scat.gold",10],["freecoursesite.com",10],["windowcleaningforums.co.uk",10],["cruisingearth.com",10],["hobby-machinist.com",10],["freegogpcgames.com",10],["latitude.to",10],["kitchennovel.com",10],["w3layouts.com",10],["blog.receivefreesms.co.uk",10],["eductin.com",10],["dealsfinders.blog",10],["audiobooks4soul.com",10],["tinhocdongthap.com",10],["sakarnewz.com",10],["downloadr.in",10],["topcomicporno.com",10],["sushi-scan.*",10],["celtadigital.com",10],["iptvrun.com",10],["adsup.lk",10],["cryptomonitor.in",10],["areatopik.com",10],["cardscanner.co",10],["nullforums.net",10],["courseclub.me",10],["tamarindoyam.com",10],["jeep-cj.com",10],["choiceofmods.com",10],["myqqjd.com",10],["ssdtop.com",10],["apkhex.com",10],["gezegenforum.com",10],["iptvapps.net",10],["null-scripts.net",10],["nullscripts.net",10],["bloground.ro",10],["witcherhour.com",10],["ottverse.com",10],["torrentmac.net",10],["mazakony.com",10],["laptechinfo.com",10],["mc-at.org",10],["playstationhaber.com",10],["seriesperu.com",10],["spigotunlocked.*",10],["pesprofessionals.com",10],["wpsimplehacks.com",10],["sportshub.to",[10,248]],["topsporter.net",[10,248]],["darkwanderer.net",10],["truckingboards.com",10],["coldfrm.org",10],["azrom.net",10],["freepatternsarea.com",10],["alttyab.net",10],["ahmedmode.*",10],["mobilkulup.com",10],["esopress.com",10],["nesiaku.my.id",10],["jipinsoft.com",10],["truthnews.de",10],["farsinama.com",10],["worldofiptv.com",10],["vuinsider.com",10],["crazydl.net",10],["gamemodsbase.com",10],["babiato.tech",10],["secuhex.com",10],["turkishaudiocenter.com",10],["galaxyos.net",10],["bizdustry.com",10],["storefront.com.ng",10],["pkbiosfix.com",10],["casi3.xyz",10],["starleaks.org",10],["forum-xiaomi.com",10],["mediafire.com",11],["wcoanimedub.tv",12],["wcoforever.net",12],["openspeedtest.com",12],["addtobucketlist.com",12],["3dzip.org",[12,67]],["ilmeteo.it",12],["wcoforever.com",12],["comprovendolibri.it",12],["healthelia.com",12],["yts.*",13],["720pstream.*",13],["1stream.*",13],["tutele.sx",13],["katestube.com",14],["short.pe",14],["thefmovies.*",14],["footystreams.net",14],["seattletimes.com",15],["bestgames.com",16],["yiv.com",16],["globalrph.com",17],["e-glossa.it",18],["webcheats.com.br",19],["urlcero.*",20],["gala.fr",21],["gentside.com",21],["geo.fr",21],["hbrfrance.fr",21],["nationalgeographic.fr",21],["ohmymag.com",21],["serengo.net",21],["vsd.fr",21],["updato.com",[22,37]],["totaldebrid.*",23],["sandrives.*",23],["daizurin.com",23],["pendekarsubs.us",23],["dreamfancy.org",23],["rysafe.blogspot.com",23],["techacode.com",23],["toppng.com",23],["th-world.com",23],["avjamack.com",23],["avjamak.net",23],["cnnamador.com",24],["nudecelebforum.com",25],["pronpic.org",26],["thewebflash.com",27],["discordfastfood.com",27],["xup.in",27],["popularmechanics.com",28],["op.gg",29],["comunidadgzone.es",30],["fxporn69.*",30],["mp3fy.com",30],["lebensmittelpraxis.de",30],["aliancapes.*",30],["ebookdz.com",30],["forum-pokemon-go.fr",30],["praxis-jugendarbeit.de",30],["dictionnaire-medical.net",30],["cle0desktop.blogspot.com",30],["up-load.io",30],["keysbrasil.blogspot.com",30],["hotpress.info",30],["turkleech.com",30],["anibatch.me",30],["anime-i.com",30],["gewinde-normen.de",30],["tucinehd.com",30],["plex-guide.de",30],["kdramasmaza.com.pk",30],["jellynote.com",31],["pouvideo.*",32],["povvideo.*",32],["povw1deo.*",32],["povwideo.*",32],["powv1deo.*",32],["powvibeo.*",32],["powvideo.*",32],["powvldeo.*",32],["eporner.com",33],["pornbimbo.com",34],["4j.com",34],["avoiderrors.com",35],["sitarchive.com",35],["livenewsof.com",35],["topnewsshow.com",35],["gatcha.org",35],["kusonime.com",35],["suicidepics.com",35],["codesnail.com",35],["codingshiksha.com",35],["graphicux.com",35],["citychilli.com",35],["talkjarvis.com",35],["hdmotori.it",36],["tubsexer.*",38],["femdomtb.com",38],["porno-tour.*",38],["lenkino.*",38],["bobs-tube.com",38],["pornfd.com",38],["pornomoll.*",38],["camsclips.*",38],["popno-tour.net",38],["watchmdh.to",38],["camwhores.tv",38],["camhub.cc",38],["elfqrin.com",39],["satcesc.com",40],["apfelpatient.de",40],["lusthero.com",41],["m4ufree.*",42],["m2list.com",42],["embed.nana2play.com",42],["elahmad.com",42],["dofusports.xyz",42],["dallasnews.com",43],["lnk.news",44],["lnk.parts",44],["efukt.com",45],["wendycode.com",45],["springfieldspringfield.co.uk",46],["porndoe.com",47],["smsget.net",[48,49]],["kjanime.net",50],["gioialive.it",51],["classicreload.com",52],["scriptzhub.com",52],["hotpornfile.org",53],["coolsoft.altervista.org",53],["hackedonlinegames.com",53],["dailytech-news.eu",53],["settlersonlinemaps.com",53],["ad-doge.com",53],["magdownload.org",53],["kpkuang.org",53],["crypto4yu.com",53],["faucetwork.space",53],["writedroid.*",53],["thenightwithoutthedawn.blogspot.com",53],["entutes.com",53],["claimlite.club",53],["newscon.org",53],["rl6mans.com",53],["chicoer.com",54],["bostonherald.com",54],["dailycamera.com",54],["sportsplays.com",55],["telerium.*",56],["pornvideotop.com",57],["krotkoosporcie.pl",57],["xstory-fr.com",57],["ytapi.cc",57],["letribunaldunet.fr",58],["vladan.fr",58],["live-tv-channels.org",59],["eslfast.com",60],["ge-map-overlays.appspot.com",61],["mad4wheels.com",61],["1xanimes.in",61],["logi.im",61],["emailnator.com",61],["freegamescasual.com",62],["tcpvpn.com",63],["oko.sh",63],["timesnownews.com",63],["timesnowhindi.com",63],["timesnowmarathi.com",63],["zoomtventertainment.com",63],["tsubasa.im",64],["sholah.net",65],["2rdroid.com",65],["bisceglielive.it",66],["pandajogosgratis.com.br",68],["5278.cc",69],["pandafreegames.*",70],["tonspion.de",71],["duplichecker.com",72],["plagiarismchecker.co",72],["plagiarismdetector.net",72],["searchenginereports.net",72],["smallseotools.com",73],["linkspaid.com",74],["proxydocker.com",74],["beeimg.com",[75,76]],["emturbovid.com",76],["findjav.com",76],["javggvideo.xyz",76],["mmtv01.xyz",76],["stbturbo.xyz",76],["streamsilk.com",76],["ftlauderdalebeachcam.com",77],["ftlauderdalewebcam.com",77],["juneauharborwebcam.com",77],["keywestharborwebcam.com",77],["kittycatcam.com",77],["mahobeachcam.com",77],["miamiairportcam.com",77],["morganhillwebcam.com",77],["njwildlifecam.com",77],["nyharborwebcam.com",77],["paradiseislandcam.com",77],["pompanobeachcam.com",77],["portbermudawebcam.com",77],["portcanaveralwebcam.com",77],["portevergladeswebcam.com",77],["portmiamiwebcam.com",77],["portnywebcam.com",77],["portnassauwebcam.com",77],["portstmaartenwebcam.com",77],["portstthomaswebcam.com",77],["porttampawebcam.com",77],["sxmislandcam.com",77],["themes-dl.com",77],["badassdownloader.com",77],["badasshardcore.com",77],["badassoftcore.com",77],["nulljungle.com",77],["teevee.asia",77],["otakukan.com",77],["thoptv.*",78],["gearingcommander.com",79],["generate.plus",80],["calculate.plus",80],["avcesar.com",81],["audiotag.info",82],["tudigitale.it",83],["ibcomputing.com",84],["legia.net",85],["acapellas4u.co.uk",86],["robloxscripts.com",87],["libreriamo.it",87],["postazap.com",87],["medebooks.xyz",87],["mashtips.com",87],["marriedgames.com.br",87],["4allprograms.me",87],["shortzzy.*",87],["nurgsm.com",87],["certbyte.com",87],["plugincrack.com",87],["gamingdeputy.com",87],["freewebcart.com",87],["streamhentaimovies.com",88],["konten.co.id",89],["diariodenavarra.es",90],["scripai.com",90],["myfxbook.com",90],["whatfontis.com",90],["tubereader.me",90],["optifine.net",91],["luzernerzeitung.ch",92],["tagblatt.ch",92],["ableitungsrechner.net",93],["alternet.org",94],["gourmetsupremacy.com",94],["shrib.com",95],["streameast.*",96],["thestreameast.*",96],["coolcast2.com",96],["techclips.net",96],["daddylivehd.*",96],["footyhunter.lol",96],["poscitech.click",96],["wecast.to",96],["sportbar.live",96],["freecourseweb.com",97],["devcourseweb.com",97],["coursewikia.com",97],["courseboat.com",97],["coursehulu.com",97],["pornhub.*",98],["lne.es",99],["pornult.com",100],["webcamsdolls.com",100],["bitcotasks.com",[100,141]],["adsy.pw",100],["playstore.pw",100],["exactpay.online",100],["thothd.to",100],["proplanta.de",101],["textograto.com",102],["voyageforum.com",103],["hmc-id.blogspot.com",103],["myabandonware.com",103],["wcofun.*",103],["ilforumdeibrutti.is",103],["prad.de",[104,156]],["chatta.it",105],["ketubanjiwa.com",106],["nsfw247.to",107],["funzen.net",107],["ilclubdellericette.it",107],["bollyholic.*",107],["extremereportbot.com",108],["getintopc.com",109],["qoshe.com",110],["lowellsun.com",111],["mamadu.pl",111],["dobrapogoda24.pl",111],["motohigh.pl",111],["namasce.pl",111],["ultimate-catch.eu",112],["cpopchanelofficial.com",113],["creditcardgenerator.com",114],["creditcardrush.com",114],["bostoncommons.net",114],["thejobsmovie.com",114],["hl-live.de",115],["satoshi-win.xyz",115],["encurtandourl.com",[115,119]],["www-daftarharga.blogspot.com",115],["ear-phone-review.com",115],["telefullenvivo.com",115],["listatv.pl",115],["daemon-hentai.com",[115,264]],["coin-profits.xyz",115],["relampagomovies.com",115],["wohnmobilforum.de",115],["nulledbear.com",115],["sinnerclownceviri.net",115],["nilopolisonline.com.br",116],["mesquitaonline.com",116],["yellowbridge.com",116],["yaoiotaku.com",117],["moneyhouse.ch",118],["ihow.info",119],["filesus.com",119],["gotxx.*",119],["sturls.com",119],["turbo1.co",119],["hartico.tv",119],["cupra.forum",119],["turkanime.*",120],["valeronevijao.com",120],["cigarlessarefy.com",120],["figeterpiazine.com",120],["yodelswartlike.com",120],["generatesnitrosate.com",120],["crownmakermacaronicism.com",120],["chromotypic.com",120],["gamoneinterrupted.com",120],["metagnathtuggers.com",120],["wolfdyslectic.com",120],["rationalityaloelike.com",120],["sizyreelingly.com",120],["simpulumlamerop.com",120],["urochsunloath.com",120],["monorhinouscassaba.com",120],["counterclockwisejacky.com",120],["35volitantplimsoles5.com",120],["scatch176duplicities.com",120],["antecoxalbobbing1010.com",120],["boonlessbestselling244.com",120],["cyamidpulverulence530.com",120],["guidon40hyporadius9.com",120],["449unceremoniousnasoseptal.com",120],["19turanosephantasia.com",120],["30sensualizeexpression.com",120],["321naturelikefurfuroid.com",120],["745mingiestblissfully.com",120],["availedsmallest.com",120],["greaseball6eventual20.com",120],["toxitabellaeatrebates306.com",120],["20demidistance9elongations.com",120],["audaciousdefaulthouse.com",120],["fittingcentermondaysunday.com",120],["fraudclatterflyingcar.com",120],["launchreliantcleaverriver.com",120],["matriculant401merited.com",120],["realfinanceblogcenter.com",120],["reputationsheriffkennethsand.com",120],["telyn610zoanthropy.com",120],["tubelessceliolymph.com",120],["tummulerviolableness.com",120],["un-block-voe.net",120],["v-o-e-unblock.com",120],["voe-un-block.com",120],["voe-unblock.*",120],["voeun-block.net",120],["voeunbl0ck.com",120],["voeunblck.com",120],["voeunblk.com",120],["voeunblock.com",120],["voeunblock1.com",120],["voeunblock2.com",120],["voeunblock3.com",120],["agefi.fr",121],["cariskuy.com",122],["letras2.com",122],["yusepjaelani.blogspot.com",123],["letras.mus.br",124],["eletronicabr.com",125],["mtlurb.com",126],["onemanhua.com",127],["laksa19.github.io",128],["javcl.com",128],["tvlogy.to",128],["rp5.*",128],["live.dragaoconnect.net",128],["beststremo.com",128],["seznamzpravy.cz",128],["xerifetech.com",128],["freemcserver.net",128],["t3n.de",129],["allindiaroundup.com",130],["tapchipi.com",131],["dcleakers.com",131],["esgeeks.com",131],["pugliain.net",131],["uplod.net",131],["worldfreeware.com",131],["cuitandokter.com",131],["tech-blogs.com",131],["cardiagn.com",131],["fikiri.net",131],["myhackingworld.com",131],["phoenixfansub.com",131],["vectorizer.io",132],["onehack.us",132],["smgplaza.com",132],["thapcam.net",132],["breznikar.com",132],["thefastlaneforum.com",133],["trade2win.com",134],["modagamers.com",135],["khatrimaza.*",135],["freemagazines.top",135],["pogolinks.*",135],["straatosphere.com",135],["nullpk.com",135],["adslink.pw",135],["downloadudemy.com",135],["picgiraffe.com",135],["weadown.com",135],["freepornsex.net",135],["nurparatodos.com.ar",135],["popcornstream.*",136],["routech.ro",136],["hokej.net",136],["turkmmo.com",137],["acdriftingpro.com",138],["palermotoday.it",139],["baritoday.it",139],["trentotoday.it",139],["agrigentonotizie.it",139],["anconatoday.it",139],["arezzonotizie.it",139],["avellinotoday.it",139],["bresciatoday.it",139],["brindisireport.it",139],["casertanews.it",139],["cataniatoday.it",139],["cesenatoday.it",139],["chietitoday.it",139],["forlitoday.it",139],["frosinonetoday.it",139],["genovatoday.it",139],["ilpescara.it",139],["ilpiacenza.it",139],["latinatoday.it",139],["lecceprima.it",139],["leccotoday.it",139],["livornotoday.it",139],["messinatoday.it",139],["milanotoday.it",139],["modenatoday.it",139],["monzatoday.it",139],["novaratoday.it",139],["padovaoggi.it",139],["parmatoday.it",139],["perugiatoday.it",139],["pisatoday.it",139],["quicomo.it",139],["ravennatoday.it",139],["reggiotoday.it",139],["riminitoday.it",139],["romatoday.it",139],["salernotoday.it",139],["sondriotoday.it",139],["sportpiacenza.it",139],["ternitoday.it",139],["today.it",139],["torinotoday.it",139],["trevisotoday.it",139],["triesteprima.it",139],["udinetoday.it",139],["veneziatoday.it",139],["vicenzatoday.it",139],["thumpertalk.com",140],["arkcod.org",140],["thelayoff.com",141],["blog.coinsrise.net",141],["blog.cryptowidgets.net",141],["blog.insurancegold.in",141],["blog.wiki-topia.com",141],["blog.coinsvalue.net",141],["blog.cookinguide.net",141],["blog.freeoseocheck.com",141],["blog.makeupguide.net",141],["blog.carstopia.net",141],["blog.carsmania.net",141],["shorterall.com",141],["blog24.me",141],["maxstream.video",141],["tvepg.eu",141],["manwan.xyz",141],["dailymaverick.co.za",142],["ludigames.com",143],["made-by.org",143],["worldtravelling.com",143],["igirls.in",143],["technichero.com",143],["androidadult.com",143],["aeroxplorer.com",143],["sportitalialive.com",143],["starkroboticsfrc.com",144],["sinonimos.de",144],["antonimos.de",144],["quesignifi.ca",144],["tiktokrealtime.com",144],["tiktokcounter.net",144],["tpayr.xyz",144],["poqzn.xyz",144],["ashrfd.xyz",144],["rezsx.xyz",144],["tryzt.xyz",144],["ashrff.xyz",144],["rezst.xyz",144],["dawenet.com",144],["erzar.xyz",144],["waezm.xyz",144],["waezg.xyz",144],["blackwoodacademy.org",144],["cryptednews.space",144],["vivuq.com",144],["swgop.com",144],["vbnmll.com",144],["telcoinfo.online",144],["dshytb.com",144],["fadedfeet.com",145],["homeculina.com",145],["ineedskin.com",145],["kenzo-flowertag.com",145],["lawyex.co",145],["mdn.lol",145],["bitzite.com",146],["coingraph.us",147],["impact24.us",147],["nanolinks.in",148],["adrinolinks.com",148],["link.vipurl.in",148],["apkmoddone.com",149],["sitemini.io.vn",[150,151]],["vip1s.top",[150,151]],["phongroblox.com",152],["financacerta.com",153],["encurtads.net",153],["shortencash.click",154],["lablue.*",155],["4-liga.com",156],["4fansites.de",156],["4players.de",156],["9monate.de",156],["aachener-nachrichten.de",156],["aachener-zeitung.de",156],["abendblatt.de",156],["abendzeitung-muenchen.de",156],["about-drinks.com",156],["abseits-ka.de",156],["airliners.de",156],["ajaxshowtime.com",156],["allgemeine-zeitung.de",156],["alpin.de",156],["antenne.de",156],["arcor.de",156],["areadvd.de",156],["areamobile.de",156],["ariva.de",156],["astronews.com",156],["aussenwirtschaftslupe.de",156],["auszeit.bio",156],["auto-motor-und-sport.de",156],["auto-service.de",156],["autobild.de",156],["autoextrem.de",156],["autopixx.de",156],["autorevue.at",156],["autotrader.nl",156],["az-online.de",156],["baby-vornamen.de",156],["babyclub.de",156],["bafoeg-aktuell.de",156],["berliner-kurier.de",156],["berliner-zeitung.de",156],["bigfm.de",156],["bikerszene.de",156],["bildderfrau.de",156],["blackd.de",156],["blick.de",156],["boerse-online.de",156],["boerse.de",156],["boersennews.de",156],["braunschweiger-zeitung.de",156],["brieffreunde.de",156],["brigitte.de",156],["buerstaedter-zeitung.de",156],["buffed.de",156],["businessinsider.de",156],["buzzfeed.at",156],["buzzfeed.de",156],["caravaning.de",156],["cavallo.de",156],["chefkoch.de",156],["cinema.de",156],["clever-tanken.de",156],["computerbild.de",156],["computerhilfen.de",156],["comunio-cl.com",156],["comunio.*",156],["connect.de",156],["chip.de",156],["da-imnetz.de",156],["dasgelbeblatt.de",156],["dbna.com",156],["dbna.de",156],["deichstube.de",156],["deine-tierwelt.de",156],["der-betze-brennt.de",156],["derwesten.de",156],["desired.de",156],["dhd24.com",156],["dieblaue24.com",156],["digitalfernsehen.de",156],["dnn.de",156],["donnerwetter.de",156],["e-hausaufgaben.de",156],["e-mountainbike.com",156],["eatsmarter.de",156],["echo-online.de",156],["ecomento.de",156],["einfachschoen.me",156],["elektrobike-online.com",156],["eltern.de",156],["epochtimes.de",156],["essen-und-trinken.de",156],["express.de",156],["extratipp.com",156],["familie.de",156],["fanfiktion.de",156],["fehmarn24.de",156],["fettspielen.de",156],["fid-gesundheitswissen.de",156],["finanzen.*",156],["finanznachrichten.de",156],["finanztreff.de",156],["finya.de",156],["firmenwissen.de",156],["fitforfun.de",156],["fnp.de",156],["football365.fr",156],["formel1.de",156],["fr.de",156],["frankfurter-wochenblatt.de",156],["freenet.de",156],["fremdwort.de",156],["froheweihnachten.info",156],["frustfrei-lernen.de",156],["fuldaerzeitung.de",156],["funandnews.de",156],["fussballdaten.de",156],["futurezone.de",156],["gala.de",156],["gamepro.de",156],["gamersglobal.de",156],["gamesaktuell.de",156],["gamestar.de",156],["gameswelt.*",156],["gamezone.de",156],["gartendialog.de",156],["gartenlexikon.de",156],["gedichte.ws",156],["geissblog.koeln",156],["gelnhaeuser-tageblatt.de",156],["general-anzeiger-bonn.de",156],["geniale-tricks.com",156],["genialetricks.de",156],["gesund-vital.de",156],["gesundheit.de",156],["gevestor.de",156],["gewinnspiele.tv",156],["giessener-allgemeine.de",156],["giessener-anzeiger.de",156],["gifhorner-rundschau.de",156],["giga.de",156],["gipfelbuch.ch",156],["gmuender-tagespost.de",156],["gruenderlexikon.de",156],["gusto.at",156],["gut-erklaert.de",156],["gutfuerdich.co",156],["hallo-muenchen.de",156],["hamburg.de",156],["hanauer.de",156],["hardwareluxx.de",156],["hartziv.org",156],["harzkurier.de",156],["haus-garten-test.de",156],["hausgarten.net",156],["haustec.de",156],["haz.de",156],["heftig.*",156],["heidelberg24.de",156],["heilpraxisnet.de",156],["heise.de",156],["helmstedter-nachrichten.de",156],["hersfelder-zeitung.de",156],["hftg.co",156],["hifi-forum.de",156],["hna.de",156],["hochheimer-zeitung.de",156],["hoerzu.de",156],["hofheimer-zeitung.de",156],["iban-rechner.de",156],["ikz-online.de",156],["immobilienscout24.de",156],["ingame.de",156],["inside-digital.de",156],["inside-handy.de",156],["investor-verlag.de",156],["jappy.com",156],["jpgames.de",156],["kabeleins.de",156],["kachelmannwetter.com",156],["kamelle.de",156],["kicker.de",156],["kindergeld.org",156],["klettern-magazin.de",156],["klettern.de",156],["kochbar.de",156],["kreis-anzeiger.de",156],["kreisbote.de",156],["kreiszeitung.de",156],["ksta.de",156],["kurierverlag.de",156],["lachainemeteo.com",156],["lampertheimer-zeitung.de",156],["landwirt.com",156],["laut.de",156],["lauterbacher-anzeiger.de",156],["leckerschmecker.me",156],["leinetal24.de",156],["lesfoodies.com",156],["levif.be",156],["lifeline.de",156],["liga3-online.de",156],["likemag.com",156],["linux-community.de",156],["linux-magazin.de",156],["live.vodafone.de",156],["ln-online.de",156],["lokalo24.de",156],["lustaufsleben.at",156],["lustich.de",156],["lvz.de",156],["lz.de",156],["mactechnews.de",156],["macwelt.de",156],["macworld.co.uk",156],["mail.de",156],["main-spitze.de",156],["manager-magazin.de",156],["manga-tube.me",156],["mathebibel.de",156],["mathepower.com",156],["maz-online.de",156],["medisite.fr",156],["mehr-tanken.de",156],["mein-kummerkasten.de",156],["mein-mmo.de",156],["mein-wahres-ich.de",156],["meine-anzeigenzeitung.de",156],["meinestadt.de",156],["menshealth.de",156],["mercato365.com",156],["merkur.de",156],["messen.de",156],["metal-hammer.de",156],["metalflirt.de",156],["meteologix.com",156],["minecraft-serverlist.net",156],["mittelbayerische.de",156],["modhoster.de",156],["moin.de",156],["mopo.de",156],["morgenpost.de",156],["motor-talk.de",156],["motorbasar.de",156],["motorradonline.de",156],["motorsport-total.com",156],["motortests.de",156],["mountainbike-magazin.de",156],["moviejones.de",156],["moviepilot.de",156],["mt.de",156],["mtb-news.de",156],["musiker-board.de",156],["musikexpress.de",156],["musikradar.de",156],["mz-web.de",156],["n-tv.de",156],["naumburger-tageblatt.de",156],["netzwelt.de",156],["neuepresse.de",156],["neueroeffnung.info",156],["news.at",156],["news.de",156],["news38.de",156],["newsbreak24.de",156],["nickles.de",156],["nicknight.de",156],["nl.hardware.info",156],["nn.de",156],["nnn.de",156],["nordbayern.de",156],["notebookchat.com",156],["notebookcheck-ru.com",156],["notebookcheck-tr.com",156],["notebookcheck.*",156],["noz-cdn.de",156],["noz.de",156],["nrz.de",156],["nw.de",156],["nwzonline.de",156],["oberhessische-zeitung.de",156],["och.to",156],["oeffentlicher-dienst.info",156],["onlinekosten.de",156],["onvista.de",156],["op-marburg.de",156],["op-online.de",156],["outdoor-magazin.com",156],["outdoorchannel.de",156],["paradisi.de",156],["pc-magazin.de",156],["pcgames.de",156],["pcgameshardware.de",156],["pcwelt.de",156],["pcworld.es",156],["peiner-nachrichten.de",156],["pferde.de",156],["pietsmiet.de",156],["pixelio.de",156],["pkw-forum.de",156],["playboy.de",156],["playfront.de",156],["pnn.de",156],["pons.com",156],["prignitzer.de",156],["profil.at",156],["promipool.de",156],["promobil.de",156],["prosiebenmaxx.de",156],["psychic.de",[156,170]],["quoka.de",156],["radio.at",156],["radio.de",156],["radio.dk",156],["radio.es",156],["radio.fr",156],["radio.it",156],["radio.net",156],["radio.pl",156],["radio.pt",156],["radio.se",156],["ran.de",156],["readmore.de",156],["rechtslupe.de",156],["recording.de",156],["rennrad-news.de",156],["reuters.com",156],["reviersport.de",156],["rhein-main-presse.de",156],["rheinische-anzeigenblaetter.de",156],["rimondo.com",156],["roadbike.de",156],["roemische-zahlen.net",156],["rollingstone.de",156],["rot-blau.com",156],["rp-online.de",156],["rtl.de",[156,249]],["rtv.de",156],["rugby365.fr",156],["ruhr24.de",156],["rundschau-online.de",156],["runnersworld.de",156],["safelist.eu",156],["salzgitter-zeitung.de",156],["sat1.de",156],["sat1gold.de",156],["schoener-wohnen.de",156],["schwaebische-post.de",156],["schwarzwaelder-bote.de",156],["serienjunkies.de",156],["shz.de",156],["sixx.de",156],["skodacommunity.de",156],["smart-wohnen.net",156],["sn.at",156],["sozialversicherung-kompetent.de",156],["spiegel.de",156],["spielen.de",156],["spieletipps.de",156],["spielfilm.de",156],["sport.de",156],["sport1.de",156],["sport365.fr",156],["sportal.de",156],["spox.com",156],["stern.de",156],["stuttgarter-nachrichten.de",156],["stuttgarter-zeitung.de",156],["sueddeutsche.de",156],["svz.de",156],["szene1.at",156],["szene38.de",156],["t-online.de",156],["tagesspiegel.de",156],["taschenhirn.de",156],["techadvisor.co.uk",156],["techstage.de",156],["tele5.de",156],["teltarif.de",156],["testedich.*",156],["the-voice-of-germany.de",156],["thueringen24.de",156],["tichyseinblick.de",156],["tierfreund.co",156],["tiervermittlung.de",156],["torgranate.de",156],["transfermarkt.*",156],["trend.at",156],["truckscout24.*",156],["tv-media.at",156],["tvdigital.de",156],["tvinfo.de",156],["tvspielfilm.de",156],["tvtoday.de",156],["tvtv.*",156],["tz.de",[156,169]],["unicum.de",156],["unnuetzes.com",156],["unsere-helden.com",156],["unterhalt.net",156],["usinger-anzeiger.de",156],["usp-forum.de",156],["videogameszone.de",156],["vienna.at",156],["vip.de",156],["virtualnights.com",156],["vox.de",156],["wa.de",156],["wallstreet-online.de",[156,159]],["waz.de",156],["weather.us",156],["webfail.com",156],["weihnachten.me",156],["weihnachts-bilder.org",156],["weihnachts-filme.com",156],["welt.de",156],["weltfussball.at",156],["weristdeinfreund.de",156],["werkzeug-news.de",156],["werra-rundschau.de",156],["wetterauer-zeitung.de",156],["wetteronline.*",156],["wieistmeineip.*",156],["wiesbadener-kurier.de",156],["wiesbadener-tagblatt.de",156],["winboard.org",156],["windows-7-forum.net",156],["winfuture.de",[156,165]],["wintotal.de",156],["wlz-online.de",156],["wn.de",156],["wohngeld.org",156],["wolfenbuetteler-zeitung.de",156],["wolfsburger-nachrichten.de",156],["woman.at",156],["womenshealth.de",156],["wormser-zeitung.de",156],["woxikon.de",156],["wp.de",156],["wr.de",156],["wunderweib.de",156],["yachtrevue.at",156],["ze.tt",156],["zeit.de",156],["meineorte.com",157],["osthessen-news.de",157],["techadvisor.com",157],["focus.de",157],["wetter.*",158],["deinesexfilme.com",160],["einfachtitten.com",160],["lesbenhd.com",160],["milffabrik.com",[160,219]],["porn-monkey.com",160],["porndrake.com",160],["pornhubdeutsch.net",160],["pornoaffe.com",160],["pornodavid.com",160],["pornoente.tv",[160,219]],["pornofisch.com",160],["pornofelix.com",160],["pornohammer.com",160],["pornohelm.com",160],["pornoklinge.com",160],["pornotom.com",[160,219]],["pornotommy.com",160],["pornovideos-hd.com",160],["pornozebra.com",[160,219]],["xhamsterdeutsch.xyz",160],["xnxx-sexfilme.com",160],["nu6i-bg-net.com",161],["khsm.io",161],["webcreator-journal.com",161],["msdos-games.com",161],["blocklayer.com",161],["weknowconquer.com",161],["aquarius-horoscopes.com",162],["cancer-horoscopes.com",162],["dubipc.blogspot.com",162],["echoes.gr",162],["engel-horoskop.de",162],["freegames44.com",162],["fuerzasarmadas.eu",162],["gemini-horoscopes.com",162],["jurukunci.net",162],["krebs-horoskop.com",162],["leo-horoscopes.com",162],["maliekrani.com",162],["nklinks.click",162],["ourenseando.es",162],["pisces-horoscopes.com",162],["radio-en-direct.fr",162],["sagittarius-horoscopes.com",162],["scorpio-horoscopes.com",162],["singlehoroskop-loewe.de",162],["skat-karten.de",162],["skorpion-horoskop.com",162],["taurus-horoscopes.com",162],["the1security.com",162],["virgo-horoscopes.com",162],["zonamarela.blogspot.com",162],["yoima.hatenadiary.com",162],["kaystls.site",163],["ftuapps.dev",164],["studydhaba.com",164],["freecourse.tech",164],["victor-mochere.com",164],["papunika.com",164],["mobilanyheter.net",164],["prajwaldesai.com",[164,238]],["carscoops.com",165],["dziennik.pl",165],["eurointegration.com.ua",165],["flatpanelshd.com",165],["hoyme.jp",165],["issuya.com",165],["itainews.com",165],["iusm.co.kr",165],["logicieleducatif.fr",165],["mynet.com",[165,186]],["onlinegdb.com",165],["picrew.me",165],["pravda.com.ua",165],["reportera.co.kr",165],["sportsrec.com",165],["sportsseoul.com",165],["text-compare.com",165],["tweaksforgeeks.com",165],["wfmz.com",165],["worldhistory.org",165],["palabr.as",165],["motscroises.fr",165],["cruciverba.it",165],["w.grapps.me",165],["gazetaprawna.pl",165],["pressian.com",165],["raenonx.cc",[165,265]],["indiatimes.com",165],["missyusa.com",165],["aikatu.jp",165],["ark-unity.com",165],["cool-style.com.tw",165],["doanhnghiepvn.vn",165],["automobile-catalog.com",166],["motorbikecatalog.com",166],["maketecheasier.com",166],["mlbpark.donga.com",167],["jjang0u.com",168],["forumdz.com",170],["abandonmail.com",170],["flmods.com",170],["zilinak.sk",170],["projectfreetv.stream",170],["hotdesimms.com",170],["pdfaid.com",170],["bootdey.com",170],["mail.com",170],["expresskaszubski.pl",170],["moegirl.org.cn",170],["flix-wave.lol",170],["fmovies0.cc",170],["worthcrete.com",170],["my-code4you.blogspot.com",171],["vrcmods.com",172],["osuskinner.com",172],["osuskins.net",172],["pentruea.com",[173,174]],["mchacks.net",175],["why-tech.it",176],["compsmag.com",177],["tapetus.pl",178],["autoroad.cz",179],["brawlhalla.fr",179],["tecnobillo.com",179],["sexcamfreeporn.com",180],["breatheheavy.com",181],["wenxuecity.com",182],["key-hub.eu",183],["fabioambrosi.it",184],["tattle.life",185],["emuenzen.de",185],["terrylove.com",185],["cidade.iol.pt",187],["fantacalcio.it",188],["hentaifreak.org",189],["hypebeast.com",190],["krankheiten-simulieren.de",191],["catholic.com",192],["3dmodelshare.org",193],["techinferno.com",194],["ibeconomist.com",195],["bookriot.com",196],["purposegames.com",197],["globo.com",198],["latimes.com",198],["claimrbx.gg",199],["perelki.net",200],["vpn-anbieter-vergleich-test.de",201],["livingincebuforums.com",202],["paperzonevn.com",203],["alltechnerd.com",204],["malaysianwireless.com",205],["erinsakura.com",206],["infofuge.com",206],["freejav.guru",206],["novelmultiverse.com",206],["fritidsmarkedet.dk",207],["maskinbladet.dk",207],["15min.lt",208],["baddiehub.com",209],["mr9soft.com",210],["21porno.com",211],["adult-sex-gamess.com",212],["hentaigames.app",212],["mobilesexgamesx.com",212],["mysexgamer.com",212],["porngameshd.com",212],["sexgamescc.com",212],["xnxx-sex-videos.com",212],["f2movies.to",213],["freeporncave.com",214],["tubsxxx.com",215],["manga18fx.com",216],["freebnbcoin.com",216],["sextvx.com",217],["muztext.com",218],["pornohans.com",219],["nursexfilme.com",219],["pornohirsch.net",219],["xhamster-sexvideos.com",219],["pornoschlange.com",219],["xhamsterdeutsch.*",219],["hdpornos.net",219],["gutesexfilme.com",219],["zona-leros.com",219],["charbelnemnom.com",220],["simplebits.io",221],["online-fix.me",222],["privatemoviez.*",223],["gamersdiscussionhub.com",223],["owlzo.com",224],["q1003.com",225],["blogpascher.com",226],["testserver.pro",227],["lifestyle.bg",227],["money.bg",227],["news.bg",227],["topsport.bg",227],["webcafe.bg",227],["schoolcheats.net",228],["mgnet.xyz",229],["advertiserandtimes.co.uk",230],["xvideos2020.me",231],["111.90.159.132",232],["techsolveprac.com",233],["joomlabeginner.com",234],["askpaccosi.com",235],["largescaleforums.com",236],["dubznetwork.com",237],["dongknows.com",239],["traderepublic.community",240],["babia.to",241],["code2care.org",242],["gmx.*",243],["yts-subs.net",244],["dlhd.sx",244],["xxxxsx.com",245],["ngontinh24.com",246],["idevicecentral.com",247],["dzeko11.net",248],["mangacrab.com",250],["hortonanderfarom.blogspot.com",251],["viefaucet.com",252],["pourcesoir.in",252],["cloud-computing-central.com",253],["afk.guide",254],["businessnamegenerator.com",255],["derstandard.at",256],["derstandard.de",256],["rocketnews24.com",257],["soranews24.com",257],["youpouch.com",257],["gourmetscans.net",258],["ilsole24ore.com",259],["ipacrack.com",260],["hentaiporn.one",261],["infokik.com",262],["porhubvideo.com",263],["webseriessex.com",263],["panuvideo.com",263],["pornktubes.net",263],["daemonanime.net",264],["bgmateriali.com",264],["deezer.com",265],["fosslinux.com",266],["shrdsk.me",267],["examword.com",268],["sempreupdate.com.br",268],["tribuna.com",269],["trendsderzukunft.de",270],["gal-dem.com",270],["lostineu.eu",270],["oggitreviso.it",270],["speisekarte.de",270],["mixed.de",270],["lightnovelpub.*",[271,272]],["lightnovelspot.com",[271,272]],["lightnovelworld.com",[271,272]],["novelpub.com",[271,272]],["webnovelpub.com",[271,272]],["hwzone.co.il",274],["nammakalvi.com",275],["igay69.com",275],["c2g.at",276],["terafly.me",276],["elamigos-games.com",276],["elamigos-games.net",276],["elamigosgames.org",276],["dktechnicalmate.com",277],["recipahi.com",277],["vpntester.org",278],["digitask.ru",280],["tempumail.com",281],["sexvideos.host",282],["camcaps.*",283],["10alert.com",284],["cryptstream.de",285],["nydus.org",285],["techhelpbd.com",286],["fapdrop.com",287],["cellmapper.net",288],["hdrez.com",289],["youwatch-serie.com",289],["russland.jetzt",289],["bembed.net",290],["embedv.net",290],["fslinks.org",290],["listeamed.net",290],["v6embed.xyz",290],["vembed.*",290],["vgplayer.xyz",290],["vid-guard.com",290],["yesmovies.*>>",290],["pistona.xyz",290],["vinomo.xyz",290],["giga-uqload.xyz",290],["moflix-stream.*",[290,345]],["printablecreative.com",291],["peachprintable.com",291],["comohoy.com",292],["leak.sx",292],["paste.bin.sx",292],["pornleaks.in",292],["merlininkazani.com",292],["j91.asia",293],["rekidai-info.github.io",294],["jeniusplay.com",295],["indianyug.com",296],["rgb.vn",296],["needrom.com",297],["criptologico.com",298],["megadrive-emulator.com",299],["eromanga-show.com",300],["hentai-one.com",300],["hentaipaw.com",300],["10minuteemails.com",301],["luxusmail.org",301],["w3cub.com",302],["bangpremier.com",303],["nyaa.iss.ink",304],["drivebot.*",305],["thenextplanet1.*",306],["tnp98.xyz",306],["freepdfcomic.com",307],["techedubyte.com",308],["tickzoo.tv",309],["oploverz.*",309],["memedroid.com",310],["karaoketexty.cz",311],["filmizlehdfilm.com",312],["filmizletv.*",312],["fullfilmizle.cc",312],["gofilmizle.net",312],["resortcams.com",313],["cheatography.com",313],["sonixgvn.net",314],["autoscout24.*",315],["mjakmama24.pl",316],["cheatermad.com",317],["ville-ideale.fr",318],["brainly.*",319],["eodev.com",319],["xfreehd.com",320],["freethesaurus.com",321],["thefreedictionary.com",321],["fm-arena.com",322],["tradersunion.com",323],["tandess.com",324],["allosurf.net",324],["spontacts.com",325],["dankmemer.lol",326],["getexploits.com",327],["fplstatistics.com",328],["breitbart.com",329],["salidzini.lv",330],["choosingnothing.com",331],["cryptorank.io",[332,333]],["4kwebplay.xyz",334],["qqwebplay.xyz",334],["viwlivehdplay.ru",334],["molbiotools.com",335],["vods.tv",336],["18xxx.xyz",337],["raidrush.net",338],["xnxxcom.xyz",339],["videzz.net",340],["spambox.xyz",341],["dreamdth.com",342],["freemodsapp.in",342],["onlytech.com",342],["player.jeansaispasplus.homes",343],["en-thunderscans.com",344],["iqksisgw.xyz",346],["caroloportunidades.com.br",347],["coempregos.com.br",347],["foodiesgallery.com",347],["vikatan.com",348],["camhub.world",349],["mma-core.*",350],["teracourses.com",351],["servustv.com",352],["freevipservers.net",353],["streambtw.com",354],["qrcodemonkey.net",355],["streamup.ws",356],["tv-films.co.uk",357],["streambolt.tv",358],["strmbolt.com",358],["cool--web-de.translate.goog",[359,360]],["gps--cache-de.translate.goog",[359,360]],["web--spiele-de.translate.goog",[359,360]],["fun--seiten-de.translate.goog",[359,360]],["photo--alben-de.translate.goog",[359,360]],["wetter--vorhersage-de.translate.goog",[359,360]],["coolsoftware-de.translate.goog",[359,360]],["kryptografie-de.translate.goog",[359,360]],["cool--domains-de.translate.goog",[359,360]],["net--tours-de.translate.goog",[359,360]],["such--maschine-de.translate.goog",[359,360]],["qul-de.translate.goog",[359,360]],["mailtool-de.translate.goog",[359,360]],["c--ix-de.translate.goog",[359,360]],["softwareengineer-de.translate.goog",[359,360]],["net--tools-de.translate.goog",[359,360]],["hilfen-de.translate.goog",[359,360]],["45er-de.translate.goog",[359,360]],["cooldns-de.translate.goog",[359,360]],["hardware--entwicklung-de.translate.goog",[359,360]]]);
const exceptionsMap = new Map([["vvid30c.*",[290]]]);
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
