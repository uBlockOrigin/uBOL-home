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
const argsList = [["]();}","500"],[".adv-"],[")](this,...","3000-6000"],["(new Error(","3000-6000"],[".offsetHeight>0"],["adblock"],["googleFC"],["adb"],["adBlockerDetected"],["show"],["InfMediafireMobileFunc","1000"],["google_jobrunner"],["admc"],["apstagLOADED"],["/Adb|moneyDetect/"],["disableDeveloper"],["Blocco","2000"],["test","0"],["checkAdblockUser","1000"],["checkPub","6000"],["'0x"],["document.querySelector","5000"],["nextFunction","250"],["backRedirect"],["document.querySelectorAll","1000"],["style"],["clientHeight"],["addEventListener","0"],["adblock","2000"],["nextFunction","2000"],["byepopup","5000"],["test.remove","100"],["additional_src","300"],["()","2000"],["css_class.show"],["CANG","3000"],["updato-overlay","500"],["innerText","2000"],["alert","8000"],["css_class"],["()","50"],["debugger"],["initializeCourier","3000"],["redirectPage"],["_0x","2000"],["ads","750"],["location.href","500"],["Adblock","5000"],["disable","200"],["CekAab","0"],["rbm_block_active","1000"],["show()"],["_0x"],["n.trigger","1"],["abDetected"],["KeepOpeningPops","1000"],["location.href"],["adb","0"],["adBlocked"],["warning","100"],["adsbygoogle"],["adblock_popup","500"],["Adblock"],["location.href","10000"],["keep-ads","2000"],["#rbm_block_active","1000"],["null","4000"],["()","2500"],["myaabpfun","3000"],["adFilled","2500"],["()","15000"],["showPopup"],["adrecover"],["()","1000"],["document.cookie","2500"],["window.open"],["innerHTML"],["readyplayer","2000"],["/innerHTML|AdBlock/"],["checkStopBlock"],["adspot_top","1500"],["/offsetHeight|google|Global/"],["an_message","500"],["Adblocker","10000"],["timeoutChecker"],["bait","1"],["ai_adb"],["pum-open"],["overlay","2000"],["/adblock/i"],["Math.round","1000"],["adblock","5"],["ag_adBlockerDetected"],["null"],["adb","6000"],["sadbl"],["brave_load_popup"],["adsbytrafficjunkycontext"],["ipod"],["offsetWidth"],["/$|adBlock/"],["()"],["AdBlock"],["stop-scrolling"],["Adv"],["blockUI","2000"],["mdpDeBlocker"],["/_0x|debug/"],["/ai_adb|_0x/"],["adBlock"],["","1"],["undefined"],["check","1"],["adsBlocked"],["nextFunction"],["blocker"],["afs_ads","2000"],["bait"],["getComputedStyle","250"],["blocked"],["{r()","0"],["nextFunction","450"],["Debug"],["r()","0"],["test","100"],["purple_box"],["checkSiteNormalLoad"],["0x"],["adBlockOverlay"],["Detected","500"],["mdp"],["modal"],[".show","1000"],[".show"],["showModal"],["blur"],["samOverlay"],["native"],["bADBlock"],["location"],["alert"],["t()","0"],["ads"],["documentElement.innerHTML"],["/adblock|isRequestPresent/"],["_0x","500"],["isRequestPresent"],["alert","2000"],["1e3*"],["","1999"],["","2000"],["/^/","1000"],["checkAdBlock"],["displayAdBlockerMessage"],["push","500"],[".call(null)","10"],[".call(null)"],["(null)","10"],["userHasAdblocker"],["appendChild"],["getComputedStyle"],["displayMessage","2000"],["AdDetect"],["ai_"],["error-report.com"],["loader.min.js"],["content-loader.com"],["()=>","5000"],["[native code]","500"],["offsetHeight"],["offsetLeft"],["height"],["mdp_deblocker"],["charAt"],["checkAds"],["fadeIn","0"],["jQuery"],["/^/"],["check"],["Adblocker"],["eabdModal"],["ab_root.show"],["gaData"],["ad"],["prompt","1000"],["googlefc"],["adblock detection"],[".offsetHeight","100"],["popState"],["ad-block-popup"],["exitTimer"],["innerHTML.replace"],["data?","4000"],["eabpDialog"],["adsense"],["/Adblock|_ad_/"],["googletag"],["f.parentNode.removeChild(f)","100"],["swal","500"],["keepChecking","1000"],["openPopup"],[".offsetHeight"],["()=>{"],["nitroAds"],["class.scroll","1000"],["disableDeveloperTools"],["Check"],["insertBefore"],["css_class.scroll"],["/null|Error/","10000"],["window.location.href","50"],["/out.php"],["/0x|devtools/"],["location.replace","300"],["window.location.href"],["fetch"],["window.location.href=link"],["reachGoal"],["Adb"],["ai"],["","3000"],["/width|innerHTML/"],["magnificPopup"],["adblockEnabled"],["google_ad"],["document.location"],["google"],["answers"],["top-right","2000"],["enforceAdStatus"],["loadScripts"],["mfp"],["display","5000"],["eb"],["/adb/i"],[").show()"],["","1000"],["site-access"],["/Ads|adbl|offsetHeight/"],["/show|innerHTML/"],["/show|document\\.createElement/"],["Msg"],["UABP"],["()","150"],["href"],["aaaaa-modal"],["()=>"],["keepChecking"],["null","10"],["","500"],["pop"],["/adbl/i"],["-0x"],["display"],["gclid"],["event","3000"],["rejectWith"],[".data?"],["refresh"],["location.href","3000"],["window.location"],["ga"],["myTestAd"],["adbl"],["Ads"],["ShowAdBLockerNotice"],["ad_listener"],["open"],["(!0)"],["Delay"],["/appendChild|e\\(\"/"],["=>"],["ADB"],["site-access-popup"],["data?"],["checkAdblockUser"],["offsetHeight","100"],["/salesPopup|mira-snackbar/"],["detectImgLoad"],["offsetHeight","200"],["detector"],["replace"],["touchstart"],["siteAccessFlag"],["ab"],["/adblocker|alert/"],["redURL"],["/children\\('ins'\\)|Adblock|adsbygoogle/"],["displayMessage"],["afterOpen"],["chkADB"],["onDetected"],["fuckadb"],["/aframe|querySelector/","1000-"],["detect"],["siteAccessPopup"],["/adsbygoogle|adblock|innerHTML|setTimeout/"],["akadb"],["biteDisplay"],["/[a-z]\\(!0\\)/","800"],["ad_block"],["/detectAdBlocker|window.open/"],["adBlockDetected"],["popUnder"],["/GoToURL|delay/"],["window.location.href","300"],["ad_display"],[".redirect"],["popup"],["/adScriptPath|MMDConfig/"],["/native|\\{n\\(\\)/"],["psresimler"],["adblocker"],["EzoIvent"],["/Detect|adblock|style\\.display|\\[native code]|\\.call\\(null\\)/"],["removeChild"],["offset"],["contrformpub"],["trigger","0"],["/\\.append|\\.innerHTML|undefined|\\.css|blocker|flex|\\$\\('|obfuscatedMsg/"],["warn"],["getComputedStyle","2000"],["video-popup"],["detectAdblock"],["detectAdBlocker"],["nads"],["current.children"],["adStatus"],["BN_CAMPAIGNS"],["media_place_list"],["cvad"],["...","300"],["/\\{[a-z]\\(!0\\)\\}/"],["stackTrace"],["inner-ad"],["_ET"],[".clientHeight"],["getComputedStyle(el)"],["location.replace"],["console.clear"],["ad_block_detector"],["document.createElement"],["sandbox"],["getComputedStyle(testAd)"],["affiliate"],["document['\\x"],["hasAdblock"],["/adblock|isblock/i"],["visibility","2000"],["displayAdBlockedVideo"],["adBlockerModal"],["","10000-15000"],["length"],["atob","120000"],["#ad_blocker_detector"],["push"],["AdBlocker"],["()","5000"],["wbDeadHinweis"],["","10000"],["fired"]];
const hostnamesMap = new Map([["poophq.com",0],["veev.to",0],["infinityscans.xyz",1],["infinityscans.net",1],["infinityscans.org",1],["dogdrip.net",2],["infinityfree.com",2],["smsonline.cloud",[2,3]],["faqwiki.us",4],["mail.yahoo.com",[5,272]],["maxcheaters.com",5],["postimees.ee",5],["police.community",5],["gisarea.com",5],["schaken-mods.com",5],["tvnet.lv",5],["theclashify.com",5],["txori.com",5],["olarila.com",5],["deletedspeedstreams.blogspot.com",5],["schooltravelorganiser.com",5],["xhardhempus.net",5],["mhn.quest",5],["leagueofgraphs.com",5],["hieunguyenphoto.com",5],["benzinpreis.de",5],["lastampa.it",6],["m.timesofindia.com",7],["timesofindia.indiatimes.com",7],["youmath.it",7],["redensarten-index.de",7],["lesoir.be",7],["electriciansforums.net",7],["keralatelecom.info",7],["universegunz.net",7],["happypenguin.altervista.org",7],["everyeye.it",7],["eztv.*",7],["bluedrake42.com",7],["supermarioemulator.com",7],["futbollibrehd.com",7],["eska.pl",7],["eskarock.pl",7],["voxfm.pl",7],["mathaeser.de",7],["betaseries.com",7],["free-sms-receive.com",7],["sms-receive-online.com",7],["computer76.ru",7],["golem.de",[8,9,155]],["hdbox.ws",9],["todopolicia.com",9],["scat.gold",9],["freecoursesite.com",9],["windowcleaningforums.co.uk",9],["cruisingearth.com",9],["hobby-machinist.com",9],["freegogpcgames.com",9],["latitude.to",9],["kitchennovel.com",9],["w3layouts.com",9],["blog.receivefreesms.co.uk",9],["eductin.com",9],["dealsfinders.blog",9],["audiobooks4soul.com",9],["tinhocdongthap.com",9],["sakarnewz.com",9],["downloadr.in",9],["topcomicporno.com",9],["sushi-scan.*",9],["celtadigital.com",9],["iptvrun.com",9],["adsup.lk",9],["cryptomonitor.in",9],["areatopik.com",9],["cardscanner.co",9],["nullforums.net",9],["courseclub.me",9],["tamarindoyam.com",9],["jeep-cj.com",9],["choiceofmods.com",9],["myqqjd.com",9],["ssdtop.com",9],["apkhex.com",9],["gezegenforum.com",9],["iptvapps.net",9],["null-scripts.net",9],["nullscripts.net",9],["bloground.ro",9],["witcherhour.com",9],["ottverse.com",9],["torrentmac.net",9],["mazakony.com",9],["laptechinfo.com",9],["mc-at.org",9],["playstationhaber.com",9],["seriesperu.com",9],["spigotunlocked.*",9],["pesprofessionals.com",9],["wpsimplehacks.com",9],["sportshub.to",[9,247]],["topsporter.net",[9,247]],["darkwanderer.net",9],["truckingboards.com",9],["coldfrm.org",9],["azrom.net",9],["freepatternsarea.com",9],["alttyab.net",9],["ahmedmode.*",9],["mobilkulup.com",9],["esopress.com",9],["nesiaku.my.id",9],["jipinsoft.com",9],["truthnews.de",9],["farsinama.com",9],["worldofiptv.com",9],["vuinsider.com",9],["crazydl.net",9],["gamemodsbase.com",9],["babiato.tech",9],["secuhex.com",9],["turkishaudiocenter.com",9],["galaxyos.net",9],["bizdustry.com",9],["storefront.com.ng",9],["pkbiosfix.com",9],["casi3.xyz",9],["starleaks.org",9],["forum-xiaomi.com",9],["mediafire.com",10],["wcoanimedub.tv",11],["wcoforever.net",11],["openspeedtest.com",11],["addtobucketlist.com",11],["3dzip.org",[11,66]],["ilmeteo.it",11],["wcoforever.com",11],["comprovendolibri.it",11],["healthelia.com",11],["yts.*",12],["720pstream.*",12],["1stream.*",12],["tutele.sx",12],["seattletimes.com",13],["bestgames.com",14],["yiv.com",14],["globalrph.com",15],["e-glossa.it",16],["webcheats.com.br",17],["urlcero.*",18],["gala.fr",19],["gentside.com",19],["geo.fr",19],["hbrfrance.fr",19],["nationalgeographic.fr",19],["ohmymag.com",19],["serengo.net",19],["vsd.fr",19],["short.pe",20],["thefmovies.*",20],["footystreams.net",20],["katestube.com",20],["updato.com",[21,36]],["totaldebrid.*",22],["sandrives.*",22],["daizurin.com",22],["pendekarsubs.us",22],["dreamfancy.org",22],["rysafe.blogspot.com",22],["techacode.com",22],["toppng.com",22],["th-world.com",22],["avjamack.com",22],["avjamak.net",22],["cnnamador.com",23],["nudecelebforum.com",24],["pronpic.org",25],["thewebflash.com",26],["discordfastfood.com",26],["xup.in",26],["popularmechanics.com",27],["op.gg",28],["comunidadgzone.es",29],["fxporn69.*",29],["mp3fy.com",29],["lebensmittelpraxis.de",29],["aliancapes.*",29],["ebookdz.com",29],["forum-pokemon-go.fr",29],["praxis-jugendarbeit.de",29],["dictionnaire-medical.net",29],["cle0desktop.blogspot.com",29],["up-load.io",29],["keysbrasil.blogspot.com",29],["hotpress.info",29],["turkleech.com",29],["anibatch.me",29],["anime-i.com",29],["gewinde-normen.de",29],["tucinehd.com",29],["plex-guide.de",29],["kdramasmaza.com.pk",29],["jellynote.com",30],["pouvideo.*",31],["povvideo.*",31],["povw1deo.*",31],["povwideo.*",31],["powv1deo.*",31],["powvibeo.*",31],["powvideo.*",31],["powvldeo.*",31],["eporner.com",32],["pornbimbo.com",33],["4j.com",33],["avoiderrors.com",34],["sitarchive.com",34],["livenewsof.com",34],["topnewsshow.com",34],["gatcha.org",34],["kusonime.com",34],["suicidepics.com",34],["codesnail.com",34],["codingshiksha.com",34],["graphicux.com",34],["citychilli.com",34],["talkjarvis.com",34],["hdmotori.it",35],["tubsexer.*",37],["femdomtb.com",37],["porno-tour.*",37],["lenkino.*",37],["bobs-tube.com",37],["pornfd.com",37],["pornomoll.*",37],["camsclips.*",37],["popno-tour.net",37],["watchmdh.to",37],["camwhores.tv",37],["camhub.cc",37],["elfqrin.com",38],["satcesc.com",39],["apfelpatient.de",39],["lusthero.com",40],["m4ufree.*",41],["m2list.com",41],["embed.nana2play.com",41],["elahmad.com",41],["dofusports.xyz",41],["dallasnews.com",42],["lnk.news",43],["lnk.parts",43],["efukt.com",44],["wendycode.com",44],["springfieldspringfield.co.uk",45],["porndoe.com",46],["smsget.net",[47,48]],["kjanime.net",49],["gioialive.it",50],["classicreload.com",51],["scriptzhub.com",51],["hotpornfile.org",52],["coolsoft.altervista.org",52],["hackedonlinegames.com",52],["dailytech-news.eu",52],["settlersonlinemaps.com",52],["ad-doge.com",52],["magdownload.org",52],["kpkuang.org",52],["crypto4yu.com",52],["faucetwork.space",52],["writedroid.*",52],["thenightwithoutthedawn.blogspot.com",52],["entutes.com",52],["claimlite.club",52],["newscon.org",52],["rl6mans.com",52],["chicoer.com",53],["bostonherald.com",53],["dailycamera.com",53],["sportsplays.com",54],["telerium.*",55],["pornvideotop.com",56],["krotkoosporcie.pl",56],["xstory-fr.com",56],["ytapi.cc",56],["letribunaldunet.fr",57],["vladan.fr",57],["live-tv-channels.org",58],["eslfast.com",59],["ge-map-overlays.appspot.com",60],["mad4wheels.com",60],["1xanimes.in",60],["logi.im",60],["emailnator.com",60],["freegamescasual.com",61],["tcpvpn.com",62],["oko.sh",62],["timesnownews.com",62],["timesnowhindi.com",62],["timesnowmarathi.com",62],["zoomtventertainment.com",62],["tsubasa.im",63],["sholah.net",64],["2rdroid.com",64],["bisceglielive.it",65],["pandajogosgratis.com.br",67],["5278.cc",68],["pandafreegames.*",69],["tonspion.de",70],["duplichecker.com",71],["plagiarismchecker.co",71],["plagiarismdetector.net",71],["searchenginereports.net",71],["smallseotools.com",72],["linkspaid.com",73],["proxydocker.com",73],["beeimg.com",[74,75]],["emturbovid.com",75],["findjav.com",75],["javggvideo.xyz",75],["mmtv01.xyz",75],["stbturbo.xyz",75],["streamsilk.com",75],["ftlauderdalebeachcam.com",76],["ftlauderdalewebcam.com",76],["juneauharborwebcam.com",76],["keywestharborwebcam.com",76],["kittycatcam.com",76],["mahobeachcam.com",76],["miamiairportcam.com",76],["morganhillwebcam.com",76],["njwildlifecam.com",76],["nyharborwebcam.com",76],["paradiseislandcam.com",76],["pompanobeachcam.com",76],["portbermudawebcam.com",76],["portcanaveralwebcam.com",76],["portevergladeswebcam.com",76],["portmiamiwebcam.com",76],["portnywebcam.com",76],["portnassauwebcam.com",76],["portstmaartenwebcam.com",76],["portstthomaswebcam.com",76],["porttampawebcam.com",76],["sxmislandcam.com",76],["themes-dl.com",76],["badassdownloader.com",76],["badasshardcore.com",76],["badassoftcore.com",76],["nulljungle.com",76],["teevee.asia",76],["otakukan.com",76],["thoptv.*",77],["gearingcommander.com",78],["generate.plus",79],["calculate.plus",79],["avcesar.com",80],["audiotag.info",81],["tudigitale.it",82],["ibcomputing.com",83],["legia.net",84],["acapellas4u.co.uk",85],["robloxscripts.com",86],["libreriamo.it",86],["postazap.com",86],["medebooks.xyz",86],["mashtips.com",86],["marriedgames.com.br",86],["4allprograms.me",86],["shortzzy.*",86],["nurgsm.com",86],["certbyte.com",86],["plugincrack.com",86],["gamingdeputy.com",86],["freewebcart.com",86],["streamhentaimovies.com",87],["konten.co.id",88],["diariodenavarra.es",89],["scripai.com",89],["myfxbook.com",89],["whatfontis.com",89],["tubereader.me",89],["optifine.net",90],["luzernerzeitung.ch",91],["tagblatt.ch",91],["ableitungsrechner.net",92],["alternet.org",93],["gourmetsupremacy.com",93],["shrib.com",94],["streameast.*",95],["thestreameast.*",95],["coolcast2.com",95],["techclips.net",95],["daddylivehd.*",95],["footyhunter.lol",95],["poscitech.click",95],["wecast.to",95],["sportbar.live",95],["freecourseweb.com",96],["devcourseweb.com",96],["coursewikia.com",96],["courseboat.com",96],["coursehulu.com",96],["pornhub.*",97],["lne.es",98],["pornult.com",99],["webcamsdolls.com",99],["bitcotasks.com",[99,140]],["adsy.pw",99],["playstore.pw",99],["exactpay.online",99],["thothd.to",99],["proplanta.de",100],["textograto.com",101],["voyageforum.com",102],["hmc-id.blogspot.com",102],["myabandonware.com",102],["wcofun.*",102],["ilforumdeibrutti.is",102],["prad.de",[103,155]],["chatta.it",104],["ketubanjiwa.com",105],["nsfw247.to",106],["funzen.net",106],["ilclubdellericette.it",106],["bollyholic.*",106],["extremereportbot.com",107],["getintopc.com",108],["qoshe.com",109],["lowellsun.com",110],["mamadu.pl",110],["dobrapogoda24.pl",110],["motohigh.pl",110],["namasce.pl",110],["ultimate-catch.eu",111],["cpopchanelofficial.com",112],["creditcardgenerator.com",113],["creditcardrush.com",113],["bostoncommons.net",113],["thejobsmovie.com",113],["hl-live.de",114],["satoshi-win.xyz",114],["encurtandourl.com",[114,118]],["www-daftarharga.blogspot.com",114],["ear-phone-review.com",114],["telefullenvivo.com",114],["listatv.pl",114],["daemon-hentai.com",[114,263]],["coin-profits.xyz",114],["relampagomovies.com",114],["wohnmobilforum.de",114],["nulledbear.com",114],["sinnerclownceviri.net",114],["nilopolisonline.com.br",115],["mesquitaonline.com",115],["yellowbridge.com",115],["yaoiotaku.com",116],["moneyhouse.ch",117],["ihow.info",118],["filesus.com",118],["gotxx.*",118],["sturls.com",118],["turbo1.co",118],["hartico.tv",118],["cupra.forum",118],["turkanime.*",119],["valeronevijao.com",119],["cigarlessarefy.com",119],["figeterpiazine.com",119],["yodelswartlike.com",119],["generatesnitrosate.com",119],["crownmakermacaronicism.com",119],["chromotypic.com",119],["gamoneinterrupted.com",119],["metagnathtuggers.com",119],["wolfdyslectic.com",119],["rationalityaloelike.com",119],["sizyreelingly.com",119],["simpulumlamerop.com",119],["urochsunloath.com",119],["monorhinouscassaba.com",119],["counterclockwisejacky.com",119],["35volitantplimsoles5.com",119],["scatch176duplicities.com",119],["antecoxalbobbing1010.com",119],["boonlessbestselling244.com",119],["cyamidpulverulence530.com",119],["guidon40hyporadius9.com",119],["449unceremoniousnasoseptal.com",119],["19turanosephantasia.com",119],["30sensualizeexpression.com",119],["321naturelikefurfuroid.com",119],["745mingiestblissfully.com",119],["availedsmallest.com",119],["greaseball6eventual20.com",119],["toxitabellaeatrebates306.com",119],["20demidistance9elongations.com",119],["audaciousdefaulthouse.com",119],["fittingcentermondaysunday.com",119],["fraudclatterflyingcar.com",119],["launchreliantcleaverriver.com",119],["matriculant401merited.com",119],["realfinanceblogcenter.com",119],["reputationsheriffkennethsand.com",119],["telyn610zoanthropy.com",119],["tubelessceliolymph.com",119],["tummulerviolableness.com",119],["un-block-voe.net",119],["v-o-e-unblock.com",119],["voe-un-block.com",119],["voe-unblock.*",119],["voeun-block.net",119],["voeunbl0ck.com",119],["voeunblck.com",119],["voeunblk.com",119],["voeunblock.com",119],["voeunblock1.com",119],["voeunblock2.com",119],["voeunblock3.com",119],["agefi.fr",120],["cariskuy.com",121],["letras2.com",121],["yusepjaelani.blogspot.com",122],["letras.mus.br",123],["eletronicabr.com",124],["mtlurb.com",125],["onemanhua.com",126],["laksa19.github.io",127],["javcl.com",127],["tvlogy.to",127],["rp5.*",127],["live.dragaoconnect.net",127],["beststremo.com",127],["seznamzpravy.cz",127],["xerifetech.com",127],["freemcserver.net",127],["t3n.de",128],["allindiaroundup.com",129],["tapchipi.com",130],["dcleakers.com",130],["esgeeks.com",130],["pugliain.net",130],["uplod.net",130],["worldfreeware.com",130],["cuitandokter.com",130],["tech-blogs.com",130],["cardiagn.com",130],["fikiri.net",130],["myhackingworld.com",130],["phoenixfansub.com",130],["vectorizer.io",131],["onehack.us",131],["smgplaza.com",131],["thapcam.net",131],["breznikar.com",131],["thefastlaneforum.com",132],["trade2win.com",133],["modagamers.com",134],["khatrimaza.*",134],["freemagazines.top",134],["pogolinks.*",134],["straatosphere.com",134],["nullpk.com",134],["adslink.pw",134],["downloadudemy.com",134],["picgiraffe.com",134],["weadown.com",134],["freepornsex.net",134],["nurparatodos.com.ar",134],["popcornstream.*",135],["routech.ro",135],["hokej.net",135],["turkmmo.com",136],["acdriftingpro.com",137],["palermotoday.it",138],["baritoday.it",138],["trentotoday.it",138],["agrigentonotizie.it",138],["anconatoday.it",138],["arezzonotizie.it",138],["avellinotoday.it",138],["bresciatoday.it",138],["brindisireport.it",138],["casertanews.it",138],["cataniatoday.it",138],["cesenatoday.it",138],["chietitoday.it",138],["forlitoday.it",138],["frosinonetoday.it",138],["genovatoday.it",138],["ilpescara.it",138],["ilpiacenza.it",138],["latinatoday.it",138],["lecceprima.it",138],["leccotoday.it",138],["livornotoday.it",138],["messinatoday.it",138],["milanotoday.it",138],["modenatoday.it",138],["monzatoday.it",138],["novaratoday.it",138],["padovaoggi.it",138],["parmatoday.it",138],["perugiatoday.it",138],["pisatoday.it",138],["quicomo.it",138],["ravennatoday.it",138],["reggiotoday.it",138],["riminitoday.it",138],["romatoday.it",138],["salernotoday.it",138],["sondriotoday.it",138],["sportpiacenza.it",138],["ternitoday.it",138],["today.it",138],["torinotoday.it",138],["trevisotoday.it",138],["triesteprima.it",138],["udinetoday.it",138],["veneziatoday.it",138],["vicenzatoday.it",138],["thumpertalk.com",139],["arkcod.org",139],["thelayoff.com",140],["blog.coinsrise.net",140],["blog.cryptowidgets.net",140],["blog.insurancegold.in",140],["blog.wiki-topia.com",140],["blog.coinsvalue.net",140],["blog.cookinguide.net",140],["blog.freeoseocheck.com",140],["blog.makeupguide.net",140],["blog.carstopia.net",140],["blog.carsmania.net",140],["shorterall.com",140],["blog24.me",140],["maxstream.video",140],["tvepg.eu",140],["manwan.xyz",140],["dailymaverick.co.za",141],["ludigames.com",142],["made-by.org",142],["worldtravelling.com",142],["igirls.in",142],["technichero.com",142],["androidadult.com",142],["aeroxplorer.com",142],["sportitalialive.com",142],["starkroboticsfrc.com",143],["sinonimos.de",143],["antonimos.de",143],["quesignifi.ca",143],["tiktokrealtime.com",143],["tiktokcounter.net",143],["tpayr.xyz",143],["poqzn.xyz",143],["ashrfd.xyz",143],["rezsx.xyz",143],["tryzt.xyz",143],["ashrff.xyz",143],["rezst.xyz",143],["dawenet.com",143],["erzar.xyz",143],["waezm.xyz",143],["waezg.xyz",143],["blackwoodacademy.org",143],["cryptednews.space",143],["vivuq.com",143],["swgop.com",143],["vbnmll.com",143],["telcoinfo.online",143],["dshytb.com",143],["fadedfeet.com",144],["homeculina.com",144],["ineedskin.com",144],["kenzo-flowertag.com",144],["lawyex.co",144],["mdn.lol",144],["bitzite.com",145],["coingraph.us",146],["impact24.us",146],["nanolinks.in",147],["adrinolinks.com",147],["link.vipurl.in",147],["apkmoddone.com",148],["sitemini.io.vn",[149,150]],["vip1s.top",[149,150]],["phongroblox.com",151],["financacerta.com",152],["encurtads.net",152],["shortencash.click",153],["lablue.*",154],["4-liga.com",155],["4fansites.de",155],["4players.de",155],["9monate.de",155],["aachener-nachrichten.de",155],["aachener-zeitung.de",155],["abendblatt.de",155],["abendzeitung-muenchen.de",155],["about-drinks.com",155],["abseits-ka.de",155],["airliners.de",155],["ajaxshowtime.com",155],["allgemeine-zeitung.de",155],["alpin.de",155],["antenne.de",155],["arcor.de",155],["areadvd.de",155],["areamobile.de",155],["ariva.de",155],["astronews.com",155],["aussenwirtschaftslupe.de",155],["auszeit.bio",155],["auto-motor-und-sport.de",155],["auto-service.de",155],["autobild.de",155],["autoextrem.de",155],["autopixx.de",155],["autorevue.at",155],["autotrader.nl",155],["az-online.de",155],["baby-vornamen.de",155],["babyclub.de",155],["bafoeg-aktuell.de",155],["berliner-kurier.de",155],["berliner-zeitung.de",155],["bigfm.de",155],["bikerszene.de",155],["bildderfrau.de",155],["blackd.de",155],["blick.de",155],["boerse-online.de",155],["boerse.de",155],["boersennews.de",155],["braunschweiger-zeitung.de",155],["brieffreunde.de",155],["brigitte.de",155],["buerstaedter-zeitung.de",155],["buffed.de",155],["businessinsider.de",155],["buzzfeed.at",155],["buzzfeed.de",155],["caravaning.de",155],["cavallo.de",155],["chefkoch.de",155],["cinema.de",155],["clever-tanken.de",155],["computerbild.de",155],["computerhilfen.de",155],["comunio-cl.com",155],["comunio.*",155],["connect.de",155],["chip.de",155],["da-imnetz.de",155],["dasgelbeblatt.de",155],["dbna.com",155],["dbna.de",155],["deichstube.de",155],["deine-tierwelt.de",155],["der-betze-brennt.de",155],["derwesten.de",155],["desired.de",155],["dhd24.com",155],["dieblaue24.com",155],["digitalfernsehen.de",155],["dnn.de",155],["donnerwetter.de",155],["e-hausaufgaben.de",155],["e-mountainbike.com",155],["eatsmarter.de",155],["echo-online.de",155],["ecomento.de",155],["einfachschoen.me",155],["elektrobike-online.com",155],["eltern.de",155],["epochtimes.de",155],["essen-und-trinken.de",155],["express.de",155],["extratipp.com",155],["familie.de",155],["fanfiktion.de",155],["fehmarn24.de",155],["fettspielen.de",155],["fid-gesundheitswissen.de",155],["finanzen.*",155],["finanznachrichten.de",155],["finanztreff.de",155],["finya.de",155],["firmenwissen.de",155],["fitforfun.de",155],["fnp.de",155],["football365.fr",155],["formel1.de",155],["fr.de",155],["frankfurter-wochenblatt.de",155],["freenet.de",155],["fremdwort.de",155],["froheweihnachten.info",155],["frustfrei-lernen.de",155],["fuldaerzeitung.de",155],["funandnews.de",155],["fussballdaten.de",155],["futurezone.de",155],["gala.de",155],["gamepro.de",155],["gamersglobal.de",155],["gamesaktuell.de",155],["gamestar.de",155],["gameswelt.*",155],["gamezone.de",155],["gartendialog.de",155],["gartenlexikon.de",155],["gedichte.ws",155],["geissblog.koeln",155],["gelnhaeuser-tageblatt.de",155],["general-anzeiger-bonn.de",155],["geniale-tricks.com",155],["genialetricks.de",155],["gesund-vital.de",155],["gesundheit.de",155],["gevestor.de",155],["gewinnspiele.tv",155],["giessener-allgemeine.de",155],["giessener-anzeiger.de",155],["gifhorner-rundschau.de",155],["giga.de",155],["gipfelbuch.ch",155],["gmuender-tagespost.de",155],["gruenderlexikon.de",155],["gusto.at",155],["gut-erklaert.de",155],["gutfuerdich.co",155],["hallo-muenchen.de",155],["hamburg.de",155],["hanauer.de",155],["hardwareluxx.de",155],["hartziv.org",155],["harzkurier.de",155],["haus-garten-test.de",155],["hausgarten.net",155],["haustec.de",155],["haz.de",155],["heftig.*",155],["heidelberg24.de",155],["heilpraxisnet.de",155],["heise.de",155],["helmstedter-nachrichten.de",155],["hersfelder-zeitung.de",155],["hftg.co",155],["hifi-forum.de",155],["hna.de",155],["hochheimer-zeitung.de",155],["hoerzu.de",155],["hofheimer-zeitung.de",155],["iban-rechner.de",155],["ikz-online.de",155],["immobilienscout24.de",155],["ingame.de",155],["inside-digital.de",155],["inside-handy.de",155],["investor-verlag.de",155],["jappy.com",155],["jpgames.de",155],["kabeleins.de",155],["kachelmannwetter.com",155],["kamelle.de",155],["kicker.de",155],["kindergeld.org",155],["klettern-magazin.de",155],["klettern.de",155],["kochbar.de",155],["kreis-anzeiger.de",155],["kreisbote.de",155],["kreiszeitung.de",155],["ksta.de",155],["kurierverlag.de",155],["lachainemeteo.com",155],["lampertheimer-zeitung.de",155],["landwirt.com",155],["laut.de",155],["lauterbacher-anzeiger.de",155],["leckerschmecker.me",155],["leinetal24.de",155],["lesfoodies.com",155],["levif.be",155],["lifeline.de",155],["liga3-online.de",155],["likemag.com",155],["linux-community.de",155],["linux-magazin.de",155],["live.vodafone.de",155],["ln-online.de",155],["lokalo24.de",155],["lustaufsleben.at",155],["lustich.de",155],["lvz.de",155],["lz.de",155],["mactechnews.de",155],["macwelt.de",155],["macworld.co.uk",155],["mail.de",155],["main-spitze.de",155],["manager-magazin.de",155],["manga-tube.me",155],["mathebibel.de",155],["mathepower.com",155],["maz-online.de",155],["medisite.fr",155],["mehr-tanken.de",155],["mein-kummerkasten.de",155],["mein-mmo.de",155],["mein-wahres-ich.de",155],["meine-anzeigenzeitung.de",155],["meinestadt.de",155],["menshealth.de",155],["mercato365.com",155],["merkur.de",155],["messen.de",155],["metal-hammer.de",155],["metalflirt.de",155],["meteologix.com",155],["minecraft-serverlist.net",155],["mittelbayerische.de",155],["modhoster.de",155],["moin.de",155],["mopo.de",155],["morgenpost.de",155],["motor-talk.de",155],["motorbasar.de",155],["motorradonline.de",155],["motorsport-total.com",155],["motortests.de",155],["mountainbike-magazin.de",155],["moviejones.de",155],["moviepilot.de",155],["mt.de",155],["mtb-news.de",155],["musiker-board.de",155],["musikexpress.de",155],["musikradar.de",155],["mz-web.de",155],["n-tv.de",155],["naumburger-tageblatt.de",155],["netzwelt.de",155],["neuepresse.de",155],["neueroeffnung.info",155],["news.at",155],["news.de",155],["news38.de",155],["newsbreak24.de",155],["nickles.de",155],["nicknight.de",155],["nl.hardware.info",155],["nn.de",155],["nnn.de",155],["nordbayern.de",155],["notebookchat.com",155],["notebookcheck-ru.com",155],["notebookcheck-tr.com",155],["notebookcheck.*",155],["noz-cdn.de",155],["noz.de",155],["nrz.de",155],["nw.de",155],["nwzonline.de",155],["oberhessische-zeitung.de",155],["och.to",155],["oeffentlicher-dienst.info",155],["onlinekosten.de",155],["onvista.de",155],["op-marburg.de",155],["op-online.de",155],["outdoor-magazin.com",155],["outdoorchannel.de",155],["paradisi.de",155],["pc-magazin.de",155],["pcgames.de",155],["pcgameshardware.de",155],["pcwelt.de",155],["pcworld.es",155],["peiner-nachrichten.de",155],["pferde.de",155],["pietsmiet.de",155],["pixelio.de",155],["pkw-forum.de",155],["playboy.de",155],["playfront.de",155],["pnn.de",155],["pons.com",155],["prignitzer.de",155],["profil.at",155],["promipool.de",155],["promobil.de",155],["prosiebenmaxx.de",155],["psychic.de",[155,169]],["quoka.de",155],["radio.at",155],["radio.de",155],["radio.dk",155],["radio.es",155],["radio.fr",155],["radio.it",155],["radio.net",155],["radio.pl",155],["radio.pt",155],["radio.se",155],["ran.de",155],["readmore.de",155],["rechtslupe.de",155],["recording.de",155],["rennrad-news.de",155],["reuters.com",155],["reviersport.de",155],["rhein-main-presse.de",155],["rheinische-anzeigenblaetter.de",155],["rimondo.com",155],["roadbike.de",155],["roemische-zahlen.net",155],["rollingstone.de",155],["rot-blau.com",155],["rp-online.de",155],["rtl.de",[155,248]],["rtv.de",155],["rugby365.fr",155],["ruhr24.de",155],["rundschau-online.de",155],["runnersworld.de",155],["safelist.eu",155],["salzgitter-zeitung.de",155],["sat1.de",155],["sat1gold.de",155],["schoener-wohnen.de",155],["schwaebische-post.de",155],["schwarzwaelder-bote.de",155],["serienjunkies.de",155],["shz.de",155],["sixx.de",155],["skodacommunity.de",155],["smart-wohnen.net",155],["sn.at",155],["sozialversicherung-kompetent.de",155],["spiegel.de",155],["spielen.de",155],["spieletipps.de",155],["spielfilm.de",155],["sport.de",155],["sport1.de",155],["sport365.fr",155],["sportal.de",155],["spox.com",155],["stern.de",155],["stuttgarter-nachrichten.de",155],["stuttgarter-zeitung.de",155],["sueddeutsche.de",155],["svz.de",155],["szene1.at",155],["szene38.de",155],["t-online.de",155],["tagesspiegel.de",155],["taschenhirn.de",155],["techadvisor.co.uk",155],["techstage.de",155],["tele5.de",155],["teltarif.de",155],["testedich.*",155],["the-voice-of-germany.de",155],["thueringen24.de",155],["tichyseinblick.de",155],["tierfreund.co",155],["tiervermittlung.de",155],["torgranate.de",155],["transfermarkt.*",155],["trend.at",155],["truckscout24.*",155],["tv-media.at",155],["tvdigital.de",155],["tvinfo.de",155],["tvspielfilm.de",155],["tvtoday.de",155],["tvtv.*",155],["tz.de",[155,168]],["unicum.de",155],["unnuetzes.com",155],["unsere-helden.com",155],["unterhalt.net",155],["usinger-anzeiger.de",155],["usp-forum.de",155],["videogameszone.de",155],["vienna.at",155],["vip.de",155],["virtualnights.com",155],["vox.de",155],["wa.de",155],["wallstreet-online.de",[155,158]],["waz.de",155],["weather.us",155],["webfail.com",155],["weihnachten.me",155],["weihnachts-bilder.org",155],["weihnachts-filme.com",155],["welt.de",155],["weltfussball.at",155],["weristdeinfreund.de",155],["werkzeug-news.de",155],["werra-rundschau.de",155],["wetterauer-zeitung.de",155],["wetteronline.*",155],["wieistmeineip.*",155],["wiesbadener-kurier.de",155],["wiesbadener-tagblatt.de",155],["winboard.org",155],["windows-7-forum.net",155],["winfuture.de",[155,164]],["wintotal.de",155],["wlz-online.de",155],["wn.de",155],["wohngeld.org",155],["wolfenbuetteler-zeitung.de",155],["wolfsburger-nachrichten.de",155],["woman.at",155],["womenshealth.de",155],["wormser-zeitung.de",155],["woxikon.de",155],["wp.de",155],["wr.de",155],["wunderweib.de",155],["yachtrevue.at",155],["ze.tt",155],["zeit.de",155],["meineorte.com",156],["osthessen-news.de",156],["techadvisor.com",156],["focus.de",156],["wetter.*",157],["deinesexfilme.com",159],["einfachtitten.com",159],["lesbenhd.com",159],["milffabrik.com",[159,218]],["porn-monkey.com",159],["porndrake.com",159],["pornhubdeutsch.net",159],["pornoaffe.com",159],["pornodavid.com",159],["pornoente.tv",[159,218]],["pornofisch.com",159],["pornofelix.com",159],["pornohammer.com",159],["pornohelm.com",159],["pornoklinge.com",159],["pornotom.com",[159,218]],["pornotommy.com",159],["pornovideos-hd.com",159],["pornozebra.com",[159,218]],["xhamsterdeutsch.xyz",159],["xnxx-sexfilme.com",159],["nu6i-bg-net.com",160],["khsm.io",160],["webcreator-journal.com",160],["msdos-games.com",160],["blocklayer.com",160],["weknowconquer.com",160],["giff.cloud",160],["aquarius-horoscopes.com",161],["cancer-horoscopes.com",161],["dubipc.blogspot.com",161],["echoes.gr",161],["engel-horoskop.de",161],["freegames44.com",161],["fuerzasarmadas.eu",161],["gemini-horoscopes.com",161],["jurukunci.net",161],["krebs-horoskop.com",161],["leo-horoscopes.com",161],["maliekrani.com",161],["nklinks.click",161],["ourenseando.es",161],["pisces-horoscopes.com",161],["radio-en-direct.fr",161],["sagittarius-horoscopes.com",161],["scorpio-horoscopes.com",161],["singlehoroskop-loewe.de",161],["skat-karten.de",161],["skorpion-horoskop.com",161],["taurus-horoscopes.com",161],["the1security.com",161],["virgo-horoscopes.com",161],["zonamarela.blogspot.com",161],["yoima.hatenadiary.com",161],["kaystls.site",162],["ftuapps.dev",163],["studydhaba.com",163],["freecourse.tech",163],["victor-mochere.com",163],["papunika.com",163],["mobilanyheter.net",163],["prajwaldesai.com",[163,237]],["carscoops.com",164],["dziennik.pl",164],["eurointegration.com.ua",164],["flatpanelshd.com",164],["hoyme.jp",164],["issuya.com",164],["itainews.com",164],["iusm.co.kr",164],["logicieleducatif.fr",164],["mynet.com",[164,185]],["onlinegdb.com",164],["picrew.me",164],["pravda.com.ua",164],["reportera.co.kr",164],["sportsrec.com",164],["sportsseoul.com",164],["text-compare.com",164],["tweaksforgeeks.com",164],["wfmz.com",164],["worldhistory.org",164],["palabr.as",164],["motscroises.fr",164],["cruciverba.it",164],["w.grapps.me",164],["gazetaprawna.pl",164],["pressian.com",164],["raenonx.cc",[164,264]],["indiatimes.com",164],["missyusa.com",164],["aikatu.jp",164],["ark-unity.com",164],["cool-style.com.tw",164],["doanhnghiepvn.vn",164],["automobile-catalog.com",165],["motorbikecatalog.com",165],["maketecheasier.com",165],["mlbpark.donga.com",166],["jjang0u.com",167],["forumdz.com",169],["abandonmail.com",169],["flmods.com",169],["zilinak.sk",169],["projectfreetv.stream",169],["hotdesimms.com",169],["pdfaid.com",169],["bootdey.com",169],["mail.com",169],["expresskaszubski.pl",169],["moegirl.org.cn",169],["flix-wave.lol",169],["fmovies0.cc",169],["worthcrete.com",169],["my-code4you.blogspot.com",170],["vrcmods.com",171],["osuskinner.com",171],["osuskins.net",171],["pentruea.com",[172,173]],["mchacks.net",174],["why-tech.it",175],["compsmag.com",176],["tapetus.pl",177],["autoroad.cz",178],["brawlhalla.fr",178],["tecnobillo.com",178],["sexcamfreeporn.com",179],["breatheheavy.com",180],["wenxuecity.com",181],["key-hub.eu",182],["fabioambrosi.it",183],["tattle.life",184],["emuenzen.de",184],["terrylove.com",184],["cidade.iol.pt",186],["fantacalcio.it",187],["hentaifreak.org",188],["hypebeast.com",189],["krankheiten-simulieren.de",190],["catholic.com",191],["3dmodelshare.org",192],["techinferno.com",193],["ibeconomist.com",194],["bookriot.com",195],["purposegames.com",196],["globo.com",197],["latimes.com",197],["claimrbx.gg",198],["perelki.net",199],["vpn-anbieter-vergleich-test.de",200],["livingincebuforums.com",201],["paperzonevn.com",202],["alltechnerd.com",203],["malaysianwireless.com",204],["erinsakura.com",205],["infofuge.com",205],["freejav.guru",205],["novelmultiverse.com",205],["fritidsmarkedet.dk",206],["maskinbladet.dk",206],["15min.lt",207],["baddiehub.com",208],["mr9soft.com",209],["21porno.com",210],["adult-sex-gamess.com",211],["hentaigames.app",211],["mobilesexgamesx.com",211],["mysexgamer.com",211],["porngameshd.com",211],["sexgamescc.com",211],["xnxx-sex-videos.com",211],["f2movies.to",212],["freeporncave.com",213],["tubsxxx.com",214],["manga18fx.com",215],["freebnbcoin.com",215],["sextvx.com",216],["muztext.com",217],["pornohans.com",218],["nursexfilme.com",218],["pornohirsch.net",218],["xhamster-sexvideos.com",218],["pornoschlange.com",218],["xhamsterdeutsch.*",218],["hdpornos.net",218],["gutesexfilme.com",218],["zona-leros.com",218],["charbelnemnom.com",219],["simplebits.io",220],["online-fix.me",221],["privatemoviez.*",222],["gamersdiscussionhub.com",222],["owlzo.com",223],["q1003.com",224],["blogpascher.com",225],["testserver.pro",226],["lifestyle.bg",226],["money.bg",226],["news.bg",226],["topsport.bg",226],["webcafe.bg",226],["schoolcheats.net",227],["mgnet.xyz",228],["advertiserandtimes.co.uk",229],["xvideos2020.me",230],["111.90.159.132",231],["techsolveprac.com",232],["joomlabeginner.com",233],["askpaccosi.com",234],["largescaleforums.com",235],["dubznetwork.com",236],["dongknows.com",238],["traderepublic.community",239],["babia.to",240],["code2care.org",241],["gmx.*",242],["yts-subs.net",243],["dlhd.sx",243],["xxxxsx.com",244],["ngontinh24.com",245],["idevicecentral.com",246],["dzeko11.net",247],["mangacrab.com",249],["hortonanderfarom.blogspot.com",250],["viefaucet.com",251],["pourcesoir.in",251],["cloud-computing-central.com",252],["afk.guide",253],["businessnamegenerator.com",254],["derstandard.at",255],["derstandard.de",255],["rocketnews24.com",256],["soranews24.com",256],["youpouch.com",256],["gourmetscans.net",257],["ilsole24ore.com",258],["ipacrack.com",259],["hentaiporn.one",260],["infokik.com",261],["porhubvideo.com",262],["webseriessex.com",262],["panuvideo.com",262],["pornktubes.net",262],["daemonanime.net",263],["bgmateriali.com",263],["deezer.com",264],["fosslinux.com",265],["shrdsk.me",266],["examword.com",267],["sempreupdate.com.br",267],["tribuna.com",268],["trendsderzukunft.de",269],["gal-dem.com",269],["lostineu.eu",269],["oggitreviso.it",269],["speisekarte.de",269],["mixed.de",269],["lightnovelpub.*",[270,271]],["lightnovelspot.com",[270,271]],["lightnovelworld.com",[270,271]],["novelpub.com",[270,271]],["webnovelpub.com",[270,271]],["hwzone.co.il",273],["nammakalvi.com",274],["igay69.com",274],["c2g.at",275],["terafly.me",275],["elamigos-games.com",275],["elamigos-games.net",275],["elamigosgames.org",275],["dktechnicalmate.com",276],["recipahi.com",276],["vpntester.org",277],["japscan.lol",278],["digitask.ru",279],["tempumail.com",280],["sexvideos.host",281],["camcaps.*",282],["10alert.com",283],["cryptstream.de",284],["nydus.org",284],["techhelpbd.com",285],["fapdrop.com",286],["cellmapper.net",287],["hdrez.com",288],["youwatch-serie.com",288],["russland.jetzt",288],["bembed.net",289],["embedv.net",289],["fslinks.org",289],["listeamed.net",289],["v6embed.xyz",289],["vembed.*",289],["vgplayer.xyz",289],["vid-guard.com",289],["yesmovies.*>>",289],["pistona.xyz",289],["vinomo.xyz",289],["giga-uqload.xyz",289],["moflix-stream.*",[289,344]],["printablecreative.com",290],["peachprintable.com",290],["comohoy.com",291],["leak.sx",291],["paste.bin.sx",291],["pornleaks.in",291],["merlininkazani.com",291],["j91.asia",292],["rekidai-info.github.io",293],["jeniusplay.com",294],["indianyug.com",295],["rgb.vn",295],["needrom.com",296],["criptologico.com",297],["megadrive-emulator.com",298],["eromanga-show.com",299],["hentai-one.com",299],["hentaipaw.com",299],["10minuteemails.com",300],["luxusmail.org",300],["w3cub.com",301],["bangpremier.com",302],["nyaa.iss.ink",303],["drivebot.*",304],["thenextplanet1.*",305],["tnp98.xyz",305],["freepdfcomic.com",306],["techedubyte.com",307],["tickzoo.tv",308],["oploverz.*",308],["memedroid.com",309],["karaoketexty.cz",310],["filmizlehdfilm.com",311],["filmizletv.*",311],["fullfilmizle.cc",311],["gofilmizle.net",311],["resortcams.com",312],["cheatography.com",312],["sonixgvn.net",313],["autoscout24.*",314],["mjakmama24.pl",315],["cheatermad.com",316],["ville-ideale.fr",317],["brainly.*",318],["eodev.com",318],["xfreehd.com",319],["freethesaurus.com",320],["thefreedictionary.com",320],["fm-arena.com",321],["tradersunion.com",322],["tandess.com",323],["allosurf.net",323],["spontacts.com",324],["dankmemer.lol",325],["getexploits.com",326],["fplstatistics.com",327],["breitbart.com",328],["salidzini.lv",329],["choosingnothing.com",330],["cryptorank.io",[331,332]],["4kwebplay.xyz",333],["qqwebplay.xyz",333],["viwlivehdplay.ru",333],["molbiotools.com",334],["vods.tv",335],["18xxx.xyz",336],["raidrush.net",337],["xnxxcom.xyz",338],["videzz.net",339],["spambox.xyz",340],["dreamdth.com",341],["freemodsapp.in",341],["onlytech.com",341],["player.jeansaispasplus.homes",342],["en-thunderscans.com",343],["iqksisgw.xyz",345],["caroloportunidades.com.br",346],["coempregos.com.br",346],["foodiesgallery.com",346],["vikatan.com",347],["camhub.world",348],["mma-core.*",349],["teracourses.com",350],["servustv.com",351],["freevipservers.net",352],["streambtw.com",353],["qrcodemonkey.net",354],["streamup.ws",355],["tv-films.co.uk",356],["streambolt.tv",357],["strmbolt.com",357],["cool--web-de.translate.goog",[358,359]],["gps--cache-de.translate.goog",[358,359]],["web--spiele-de.translate.goog",[358,359]],["fun--seiten-de.translate.goog",[358,359]],["photo--alben-de.translate.goog",[358,359]],["wetter--vorhersage-de.translate.goog",[358,359]],["coolsoftware-de.translate.goog",[358,359]],["kryptografie-de.translate.goog",[358,359]],["cool--domains-de.translate.goog",[358,359]],["net--tours-de.translate.goog",[358,359]],["such--maschine-de.translate.goog",[358,359]],["qul-de.translate.goog",[358,359]],["mailtool-de.translate.goog",[358,359]],["c--ix-de.translate.goog",[358,359]],["softwareengineer-de.translate.goog",[358,359]],["net--tools-de.translate.goog",[358,359]],["hilfen-de.translate.goog",[358,359]],["45er-de.translate.goog",[358,359]],["cooldns-de.translate.goog",[358,359]],["hardware--entwicklung-de.translate.goog",[358,359]],["bgsi.gg",360]]);
const exceptionsMap = new Map([["vvid30c.*",[289]]]);
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
