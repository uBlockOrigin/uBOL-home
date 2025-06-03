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
const argsList = [["=document[_0x"],["]();}","500"],[".adv-"],[")](this,...","3000-6000"],["(new Error(","3000-6000"],[".offsetHeight>0"],["adblock"],["googleFC"],["adb"],["adBlockerDetected"],["show"],["InfMediafireMobileFunc","1000"],["google_jobrunner"],["admc"],["apstagLOADED"],["/Adb|moneyDetect/"],["disableDeveloper"],["Blocco","2000"],["test","0"],["checkAdblockUser","1000"],["checkPub","6000"],["'0x"],["document.querySelector","5000"],["nextFunction","250"],["backRedirect"],["document.querySelectorAll","1000"],["style"],["clientHeight"],["addEventListener","0"],["adblock","2000"],["nextFunction","2000"],["byepopup","5000"],["test.remove","100"],["additional_src","300"],["()","2000"],["css_class.show"],["CANG","3000"],["updato-overlay","500"],["innerText","2000"],["alert","8000"],["css_class"],["()","50"],["debugger"],["initializeCourier","3000"],["redirectPage"],["_0x","2000"],["ads","750"],["location.href","500"],["Adblock","5000"],["disable","200"],["CekAab","0"],["rbm_block_active","1000"],["show()"],["_0x"],["n.trigger","1"],["abDetected"],["KeepOpeningPops","1000"],["location.href"],["adb","0"],["adBlocked"],["warning","100"],["adsbygoogle"],["adblock_popup","500"],["Adblock"],["location.href","10000"],["keep-ads","2000"],["#rbm_block_active","1000"],["null","4000"],["()","2500"],["myaabpfun","3000"],["adFilled","2500"],["()","15000"],["showPopup"],["adrecover"],["()","1000"],["document.cookie","2500"],["window.open"],["innerHTML"],["readyplayer","2000"],["/innerHTML|AdBlock/"],["checkStopBlock"],["adspot_top","1500"],["/offsetHeight|google|Global/"],["an_message","500"],["Adblocker","10000"],["timeoutChecker"],["bait","1"],["ai_adb"],["pum-open"],["overlay","2000"],["/adblock/i"],["Math.round","1000"],["adblock","5"],["ag_adBlockerDetected"],["null"],["adb","6000"],["sadbl"],["brave_load_popup"],["adsbytrafficjunkycontext"],["ipod"],["offsetWidth"],["/$|adBlock/"],["()"],["AdBlock"],["stop-scrolling"],["Adv"],["blockUI","2000"],["mdpDeBlocker"],["/_0x|debug/"],["/ai_adb|_0x/"],["adBlock"],["","1"],["undefined"],["check","1"],["adsBlocked"],["nextFunction"],["blocker"],["afs_ads","2000"],["bait"],["getComputedStyle","250"],["blocked"],["{r()","0"],["nextFunction","450"],["Debug"],["r()","0"],["test","100"],["purple_box"],["checkSiteNormalLoad"],["0x"],["adBlockOverlay"],["Detected","500"],["mdp"],["modal"],[".show","1000"],[".show"],["showModal"],["blur"],["samOverlay"],["native"],["bADBlock"],["location"],["alert"],["t()","0"],["ads"],["documentElement.innerHTML"],["/adblock|isRequestPresent/"],["_0x","500"],["isRequestPresent"],["alert","2000"],["1e3*"],["","2000"],["/^/","1000"],["checkAdBlock"],["displayAdBlockerMessage"],["push","500"],[".call(null)","10"],[".call(null)"],["(null)","10"],["userHasAdblocker"],["appendChild"],["afterOpen"],["affiliate"],["getComputedStyle"],["displayMessage","2000"],["AdDetect"],["ai_"],["error-report.com"],["loader.min.js"],["content-loader.com"],["()=>","5000"],["[native code]","500"],["offsetHeight"],["offsetLeft"],["height"],["mdp_deblocker"],["charAt"],["checkAds"],["fadeIn","0"],["jQuery"],["/^/"],["check"],["Adblocker"],["eabdModal"],["ab_root.show"],["gaData"],["ad"],["prompt","1000"],["googlefc"],["adblock detection"],[".offsetHeight","100"],["popState"],["ad-block-popup"],["exitTimer"],["innerHTML.replace"],["data?","4000"],["eabpDialog"],["adsense"],["/Adblock|_ad_/"],["googletag"],["f.parentNode.removeChild(f)","100"],["swal","500"],["keepChecking","1000"],["openPopup"],[".offsetHeight"],["()=>{"],["nitroAds"],["class.scroll","1000"],["disableDeveloperTools"],["Check"],["insertBefore"],["css_class.scroll"],["/null|Error/","10000"],["window.location.href","50"],["/out.php"],["/0x|devtools/"],["location.replace","300"],["window.location.href"],["fetch"],["window.location.href=link"],["reachGoal"],["Adb"],["ai"],["","3000"],["/width|innerHTML/"],["magnificPopup"],["adblockEnabled"],["google_ad"],["document.location"],["google"],["answers"],["top-right","2000"],["enforceAdStatus"],["mfp"],["display","5000"],["eb"],["/adb/i"],[").show()"],["","1000"],["site-access"],["/Ads|adbl|offsetHeight/"],["/show|innerHTML/"],["/show|document\\.createElement/"],["Msg"],["UABP"],["()","150"],["href"],["aaaaa-modal"],["()=>"],["keepChecking"],["null","10"],["","500"],["pop"],["/adbl/i"],["-0x"],["display"],["gclid"],["event","3000"],["rejectWith"],[".data?"],["refresh"],["location.href","3000"],["window.location"],["ga"],["myTestAd"],["adbl"],["Ads"],["ShowAdBLockerNotice"],["ad_listener"],["open"],["(!0)"],["Delay"],["/appendChild|e\\(\"/"],["=>"],["ADB"],["site-access-popup"],["data?"],["checkAdblockUser"],["offsetHeight","100"],["/salesPopup|mira-snackbar/"],["detectImgLoad"],["offsetHeight","200"],["detector"],["replace"],["touchstart"],["siteAccessFlag"],["ab"],["/adblocker|alert/"],["redURL"],["/children\\('ins'\\)|Adblock|adsbygoogle/"],["displayMessage"],["chkADB"],["onDetected"],["fuckadb"],["/aframe|querySelector/","1000-"],["detect"],["siteAccessPopup"],["/adsbygoogle|adblock|innerHTML|setTimeout/"],["akadb"],["biteDisplay"],["/[a-z]\\(!0\\)/","800"],["ad_block"],["/detectAdBlocker|window.open/"],["adBlockDetected"],["popUnder"],["/GoToURL|delay/"],["window.location.href","300"],["ad_display"],[".redirect"],["popup"],["/adScriptPath|MMDConfig/"],["/native|\\{n\\(\\)/"],["psresimler"],["adblocker"],["EzoIvent"],["/Detect|adblock|style\\.display|\\[native code]|\\.call\\(null\\)/"],["removeChild"],["offset"],["contrformpub"],["trigger","0"],["/\\.append|\\.innerHTML|undefined|\\.css|blocker|flex|\\$\\('|obfuscatedMsg/"],["warn"],["getComputedStyle","2000"],["video-popup"],["detectAdblock"],["detectAdBlocker"],["nads"],["current.children"],["adStatus"],["BN_CAMPAIGNS"],["media_place_list"],["cvad"],["...","300"],["/\\{[a-z]\\(!0\\)\\}/"],["stackTrace"],["inner-ad"],["_ET"],[".clientHeight"],["getComputedStyle(el)"],["location.replace"],["console.clear"],["ad_block_detector"],["document.createElement"],["sandbox"],["getComputedStyle(testAd)"],["document['\\x"],["hasAdblock"],["/adblock|isblock/i"],["visibility","2000"],["displayAdBlockedVideo"],["adBlockerModal"],["","10000-15000"],["length"],["atob","120000"],["#ad_blocker_detector"],["push"],["AdBlocker"],["()","5000"],["wbDeadHinweis"],["","10000"],["fired"]];
const hostnamesMap = new Map([["japscan.lol",[0,279]],["poophq.com",1],["veev.to",1],["infinityscans.xyz",2],["infinityscans.net",2],["infinityscans.org",2],["dogdrip.net",3],["infinityfree.com",3],["smsonline.cloud",[3,4]],["faqwiki.us",5],["mail.yahoo.com",[6,273]],["maxcheaters.com",6],["postimees.ee",6],["police.community",6],["gisarea.com",6],["schaken-mods.com",6],["tvnet.lv",6],["theclashify.com",6],["txori.com",6],["olarila.com",6],["deletedspeedstreams.blogspot.com",6],["schooltravelorganiser.com",6],["xhardhempus.net",6],["mhn.quest",6],["leagueofgraphs.com",6],["hieunguyenphoto.com",6],["benzinpreis.de",6],["lastampa.it",7],["m.timesofindia.com",8],["timesofindia.indiatimes.com",8],["youmath.it",8],["redensarten-index.de",8],["lesoir.be",8],["electriciansforums.net",8],["keralatelecom.info",8],["universegunz.net",8],["happypenguin.altervista.org",8],["everyeye.it",8],["eztv.*",8],["bluedrake42.com",8],["supermarioemulator.com",8],["futbollibrehd.com",8],["eska.pl",8],["eskarock.pl",8],["voxfm.pl",8],["mathaeser.de",8],["betaseries.com",8],["free-sms-receive.com",8],["sms-receive-online.com",8],["computer76.ru",8],["golem.de",[9,10,155]],["hdbox.ws",10],["todopolicia.com",10],["scat.gold",10],["freecoursesite.com",10],["windowcleaningforums.co.uk",10],["cruisingearth.com",10],["hobby-machinist.com",10],["freegogpcgames.com",10],["latitude.to",10],["kitchennovel.com",10],["w3layouts.com",10],["blog.receivefreesms.co.uk",10],["eductin.com",10],["dealsfinders.blog",10],["audiobooks4soul.com",10],["tinhocdongthap.com",10],["sakarnewz.com",10],["downloadr.in",10],["topcomicporno.com",10],["sushi-scan.*",10],["celtadigital.com",10],["iptvrun.com",10],["adsup.lk",10],["cryptomonitor.in",10],["areatopik.com",10],["cardscanner.co",10],["nullforums.net",10],["courseclub.me",10],["tamarindoyam.com",10],["jeep-cj.com",10],["choiceofmods.com",10],["myqqjd.com",10],["ssdtop.com",10],["apkhex.com",10],["gezegenforum.com",10],["iptvapps.net",10],["null-scripts.net",10],["nullscripts.net",10],["bloground.ro",10],["witcherhour.com",10],["ottverse.com",10],["torrentmac.net",10],["mazakony.com",10],["laptechinfo.com",10],["mc-at.org",10],["playstationhaber.com",10],["seriesperu.com",10],["spigotunlocked.*",10],["pesprofessionals.com",10],["wpsimplehacks.com",10],["sportshub.to",[10,248]],["topsporter.net",[10,248]],["darkwanderer.net",10],["truckingboards.com",10],["coldfrm.org",10],["azrom.net",10],["freepatternsarea.com",10],["alttyab.net",10],["ahmedmode.*",10],["mobilkulup.com",10],["esopress.com",10],["nesiaku.my.id",10],["jipinsoft.com",10],["truthnews.de",10],["farsinama.com",10],["worldofiptv.com",10],["vuinsider.com",10],["crazydl.net",10],["gamemodsbase.com",10],["babiato.tech",10],["secuhex.com",10],["turkishaudiocenter.com",10],["galaxyos.net",10],["bizdustry.com",10],["storefront.com.ng",10],["pkbiosfix.com",10],["casi3.xyz",10],["starleaks.org",10],["forum-xiaomi.com",10],["mediafire.com",11],["wcoanimedub.tv",12],["wcoforever.net",12],["openspeedtest.com",12],["addtobucketlist.com",12],["3dzip.org",[12,67]],["ilmeteo.it",12],["wcoforever.com",12],["comprovendolibri.it",12],["healthelia.com",12],["yts.*",13],["720pstream.*",13],["1stream.*",13],["tutele.sx",13],["seattletimes.com",14],["bestgames.com",15],["yiv.com",15],["globalrph.com",16],["e-glossa.it",17],["webcheats.com.br",18],["urlcero.*",19],["gala.fr",20],["gentside.com",20],["geo.fr",20],["hbrfrance.fr",20],["nationalgeographic.fr",20],["ohmymag.com",20],["serengo.net",20],["vsd.fr",20],["short.pe",21],["thefmovies.*",21],["footystreams.net",21],["katestube.com",21],["updato.com",[22,37]],["totaldebrid.*",23],["sandrives.*",23],["daizurin.com",23],["pendekarsubs.us",23],["dreamfancy.org",23],["rysafe.blogspot.com",23],["techacode.com",23],["toppng.com",23],["th-world.com",23],["avjamack.com",23],["avjamak.net",23],["cnnamador.com",24],["nudecelebforum.com",25],["pronpic.org",26],["thewebflash.com",27],["discordfastfood.com",27],["xup.in",27],["popularmechanics.com",28],["op.gg",29],["comunidadgzone.es",30],["fxporn69.*",30],["mp3fy.com",30],["lebensmittelpraxis.de",30],["aliancapes.*",30],["ebookdz.com",30],["forum-pokemon-go.fr",30],["praxis-jugendarbeit.de",30],["dictionnaire-medical.net",30],["cle0desktop.blogspot.com",30],["up-load.io",30],["keysbrasil.blogspot.com",30],["hotpress.info",30],["turkleech.com",30],["anibatch.me",30],["anime-i.com",30],["gewinde-normen.de",30],["tucinehd.com",30],["plex-guide.de",30],["kdramasmaza.com.pk",30],["jellynote.com",31],["pouvideo.*",32],["povvideo.*",32],["povw1deo.*",32],["povwideo.*",32],["powv1deo.*",32],["powvibeo.*",32],["powvideo.*",32],["powvldeo.*",32],["eporner.com",33],["pornbimbo.com",34],["4j.com",34],["avoiderrors.com",35],["sitarchive.com",35],["livenewsof.com",35],["topnewsshow.com",35],["gatcha.org",35],["kusonime.com",35],["suicidepics.com",35],["codesnail.com",35],["codingshiksha.com",35],["graphicux.com",35],["citychilli.com",35],["talkjarvis.com",35],["hdmotori.it",36],["tubsexer.*",38],["femdomtb.com",38],["porno-tour.*",38],["lenkino.*",38],["bobs-tube.com",38],["pornfd.com",38],["pornomoll.*",38],["camsclips.*",38],["popno-tour.net",38],["watchmdh.to",38],["camwhores.tv",38],["camhub.cc",38],["elfqrin.com",39],["satcesc.com",40],["apfelpatient.de",40],["lusthero.com",41],["m4ufree.*",42],["m2list.com",42],["embed.nana2play.com",42],["elahmad.com",42],["dofusports.xyz",42],["dallasnews.com",43],["lnk.news",44],["lnk.parts",44],["efukt.com",45],["wendycode.com",45],["springfieldspringfield.co.uk",46],["porndoe.com",47],["smsget.net",[48,49]],["kjanime.net",50],["gioialive.it",51],["classicreload.com",52],["scriptzhub.com",52],["hotpornfile.org",53],["coolsoft.altervista.org",53],["hackedonlinegames.com",53],["dailytech-news.eu",53],["settlersonlinemaps.com",53],["ad-doge.com",53],["magdownload.org",53],["kpkuang.org",53],["crypto4yu.com",53],["faucetwork.space",53],["writedroid.*",53],["thenightwithoutthedawn.blogspot.com",53],["entutes.com",53],["claimlite.club",53],["newscon.org",53],["rl6mans.com",53],["chicoer.com",54],["bostonherald.com",54],["dailycamera.com",54],["sportsplays.com",55],["telerium.*",56],["pornvideotop.com",57],["krotkoosporcie.pl",57],["xstory-fr.com",57],["1337x.*",57],["x1337x.*",57],["1337x.ninjaproxy1.com",57],["ytapi.cc",57],["letribunaldunet.fr",58],["vladan.fr",58],["live-tv-channels.org",59],["eslfast.com",60],["ge-map-overlays.appspot.com",61],["mad4wheels.com",61],["1xanimes.in",61],["logi.im",61],["emailnator.com",61],["freegamescasual.com",62],["tcpvpn.com",63],["oko.sh",63],["timesnownews.com",63],["timesnowhindi.com",63],["timesnowmarathi.com",63],["zoomtventertainment.com",63],["tsubasa.im",64],["sholah.net",65],["2rdroid.com",65],["bisceglielive.it",66],["pandajogosgratis.com.br",68],["5278.cc",69],["pandafreegames.*",70],["tonspion.de",71],["duplichecker.com",72],["plagiarismchecker.co",72],["plagiarismdetector.net",72],["searchenginereports.net",72],["smallseotools.com",73],["linkspaid.com",74],["proxydocker.com",74],["beeimg.com",[75,76]],["emturbovid.com",76],["findjav.com",76],["javggvideo.xyz",76],["mmtv01.xyz",76],["stbturbo.xyz",76],["streamsilk.com",76],["ftlauderdalebeachcam.com",77],["ftlauderdalewebcam.com",77],["juneauharborwebcam.com",77],["keywestharborwebcam.com",77],["kittycatcam.com",77],["mahobeachcam.com",77],["miamiairportcam.com",77],["morganhillwebcam.com",77],["njwildlifecam.com",77],["nyharborwebcam.com",77],["paradiseislandcam.com",77],["pompanobeachcam.com",77],["portbermudawebcam.com",77],["portcanaveralwebcam.com",77],["portevergladeswebcam.com",77],["portmiamiwebcam.com",77],["portnywebcam.com",77],["portnassauwebcam.com",77],["portstmaartenwebcam.com",77],["portstthomaswebcam.com",77],["porttampawebcam.com",77],["sxmislandcam.com",77],["themes-dl.com",77],["badassdownloader.com",77],["badasshardcore.com",77],["badassoftcore.com",77],["nulljungle.com",77],["teevee.asia",77],["otakukan.com",77],["thoptv.*",78],["gearingcommander.com",79],["generate.plus",80],["calculate.plus",80],["avcesar.com",81],["audiotag.info",82],["tudigitale.it",83],["ibcomputing.com",84],["legia.net",85],["acapellas4u.co.uk",86],["robloxscripts.com",87],["libreriamo.it",87],["postazap.com",87],["medebooks.xyz",87],["mashtips.com",87],["marriedgames.com.br",87],["4allprograms.me",87],["shortzzy.*",87],["nurgsm.com",87],["certbyte.com",87],["plugincrack.com",87],["gamingdeputy.com",87],["freewebcart.com",87],["streamhentaimovies.com",88],["konten.co.id",89],["diariodenavarra.es",90],["scripai.com",90],["myfxbook.com",90],["whatfontis.com",90],["tubereader.me",90],["optifine.net",91],["luzernerzeitung.ch",92],["tagblatt.ch",92],["ableitungsrechner.net",93],["alternet.org",94],["gourmetsupremacy.com",94],["shrib.com",95],["streameast.*",96],["thestreameast.*",96],["coolcast2.com",96],["techclips.net",96],["daddylivehd.*",96],["footyhunter.lol",96],["poscitech.click",96],["wecast.to",96],["sportbar.live",96],["freecourseweb.com",97],["devcourseweb.com",97],["coursewikia.com",97],["courseboat.com",97],["coursehulu.com",97],["pornhub.*",98],["lne.es",99],["pornult.com",100],["webcamsdolls.com",100],["bitcotasks.com",[100,141]],["adsy.pw",100],["playstore.pw",100],["exactpay.online",100],["thothd.to",100],["proplanta.de",101],["textograto.com",102],["voyageforum.com",103],["hmc-id.blogspot.com",103],["myabandonware.com",103],["wcofun.*",103],["ilforumdeibrutti.is",103],["prad.de",[104,155]],["chatta.it",105],["ketubanjiwa.com",106],["nsfw247.to",107],["funzen.net",107],["ilclubdellericette.it",107],["bollyholic.*",107],["extremereportbot.com",108],["getintopc.com",109],["qoshe.com",110],["lowellsun.com",111],["mamadu.pl",111],["dobrapogoda24.pl",111],["motohigh.pl",111],["namasce.pl",111],["ultimate-catch.eu",112],["cpopchanelofficial.com",113],["creditcardgenerator.com",114],["creditcardrush.com",114],["bostoncommons.net",114],["thejobsmovie.com",114],["hl-live.de",115],["satoshi-win.xyz",115],["encurtandourl.com",[115,119]],["www-daftarharga.blogspot.com",115],["ear-phone-review.com",115],["telefullenvivo.com",115],["listatv.pl",115],["daemon-hentai.com",[115,264]],["coin-profits.xyz",115],["relampagomovies.com",115],["wohnmobilforum.de",115],["nulledbear.com",115],["sinnerclownceviri.net",115],["nilopolisonline.com.br",116],["mesquitaonline.com",116],["yellowbridge.com",116],["yaoiotaku.com",117],["moneyhouse.ch",118],["ihow.info",119],["filesus.com",119],["gotxx.*",119],["sturls.com",119],["turbo1.co",119],["hartico.tv",119],["cupra.forum",119],["turkanime.*",120],["valeronevijao.com",120],["cigarlessarefy.com",120],["figeterpiazine.com",120],["yodelswartlike.com",120],["generatesnitrosate.com",120],["crownmakermacaronicism.com",120],["chromotypic.com",120],["gamoneinterrupted.com",120],["metagnathtuggers.com",120],["wolfdyslectic.com",120],["rationalityaloelike.com",120],["sizyreelingly.com",120],["simpulumlamerop.com",120],["urochsunloath.com",120],["monorhinouscassaba.com",120],["counterclockwisejacky.com",120],["35volitantplimsoles5.com",120],["scatch176duplicities.com",120],["antecoxalbobbing1010.com",120],["boonlessbestselling244.com",120],["cyamidpulverulence530.com",120],["guidon40hyporadius9.com",120],["449unceremoniousnasoseptal.com",120],["19turanosephantasia.com",120],["30sensualizeexpression.com",120],["321naturelikefurfuroid.com",120],["745mingiestblissfully.com",120],["availedsmallest.com",120],["greaseball6eventual20.com",120],["toxitabellaeatrebates306.com",120],["20demidistance9elongations.com",120],["audaciousdefaulthouse.com",120],["fittingcentermondaysunday.com",120],["fraudclatterflyingcar.com",120],["launchreliantcleaverriver.com",120],["matriculant401merited.com",120],["realfinanceblogcenter.com",120],["reputationsheriffkennethsand.com",120],["telyn610zoanthropy.com",120],["tubelessceliolymph.com",120],["tummulerviolableness.com",120],["un-block-voe.net",120],["v-o-e-unblock.com",120],["voe-un-block.com",120],["voe-unblock.*",120],["voeun-block.net",120],["voeunbl0ck.com",120],["voeunblck.com",120],["voeunblk.com",120],["voeunblock.com",120],["voeunblock1.com",120],["voeunblock2.com",120],["voeunblock3.com",120],["agefi.fr",121],["cariskuy.com",122],["letras2.com",122],["yusepjaelani.blogspot.com",123],["letras.mus.br",124],["eletronicabr.com",125],["mtlurb.com",126],["onemanhua.com",127],["laksa19.github.io",128],["javcl.com",128],["tvlogy.to",128],["rp5.*",128],["live.dragaoconnect.net",128],["beststremo.com",128],["seznamzpravy.cz",128],["xerifetech.com",128],["freemcserver.net",128],["t3n.de",129],["allindiaroundup.com",130],["tapchipi.com",131],["dcleakers.com",131],["esgeeks.com",131],["pugliain.net",131],["uplod.net",131],["worldfreeware.com",131],["cuitandokter.com",131],["tech-blogs.com",131],["cardiagn.com",131],["fikiri.net",131],["myhackingworld.com",131],["phoenixfansub.com",131],["vectorizer.io",132],["onehack.us",132],["smgplaza.com",132],["thapcam.net",132],["breznikar.com",132],["thefastlaneforum.com",133],["trade2win.com",134],["modagamers.com",135],["khatrimaza.*",135],["freemagazines.top",135],["pogolinks.*",135],["straatosphere.com",135],["nullpk.com",135],["adslink.pw",135],["downloadudemy.com",135],["picgiraffe.com",135],["weadown.com",135],["freepornsex.net",135],["nurparatodos.com.ar",135],["popcornstream.*",136],["routech.ro",136],["hokej.net",136],["turkmmo.com",137],["acdriftingpro.com",138],["palermotoday.it",139],["baritoday.it",139],["trentotoday.it",139],["agrigentonotizie.it",139],["anconatoday.it",139],["arezzonotizie.it",139],["avellinotoday.it",139],["bresciatoday.it",139],["brindisireport.it",139],["casertanews.it",139],["cataniatoday.it",139],["cesenatoday.it",139],["chietitoday.it",139],["forlitoday.it",139],["frosinonetoday.it",139],["genovatoday.it",139],["ilpescara.it",139],["ilpiacenza.it",139],["latinatoday.it",139],["lecceprima.it",139],["leccotoday.it",139],["livornotoday.it",139],["messinatoday.it",139],["milanotoday.it",139],["modenatoday.it",139],["monzatoday.it",139],["novaratoday.it",139],["padovaoggi.it",139],["parmatoday.it",139],["perugiatoday.it",139],["pisatoday.it",139],["quicomo.it",139],["ravennatoday.it",139],["reggiotoday.it",139],["riminitoday.it",139],["romatoday.it",139],["salernotoday.it",139],["sondriotoday.it",139],["sportpiacenza.it",139],["ternitoday.it",139],["today.it",139],["torinotoday.it",139],["trevisotoday.it",139],["triesteprima.it",139],["udinetoday.it",139],["veneziatoday.it",139],["vicenzatoday.it",139],["thumpertalk.com",140],["arkcod.org",140],["thelayoff.com",141],["blog.coinsrise.net",141],["blog.cryptowidgets.net",141],["blog.insurancegold.in",141],["blog.wiki-topia.com",141],["blog.coinsvalue.net",141],["blog.cookinguide.net",141],["blog.freeoseocheck.com",141],["blog.makeupguide.net",141],["blog.carstopia.net",141],["blog.carsmania.net",141],["shorterall.com",141],["blog24.me",141],["maxstream.video",141],["tvepg.eu",141],["manwan.xyz",141],["dailymaverick.co.za",142],["ludigames.com",143],["made-by.org",143],["worldtravelling.com",143],["igirls.in",143],["technichero.com",143],["androidadult.com",143],["aeroxplorer.com",143],["sportitalialive.com",143],["infomatricula.pt",143],["starkroboticsfrc.com",144],["sinonimos.de",144],["antonimos.de",144],["quesignifi.ca",144],["tiktokrealtime.com",144],["tiktokcounter.net",144],["tpayr.xyz",144],["poqzn.xyz",144],["ashrfd.xyz",144],["rezsx.xyz",144],["tryzt.xyz",144],["ashrff.xyz",144],["rezst.xyz",144],["dawenet.com",144],["erzar.xyz",144],["waezm.xyz",144],["waezg.xyz",144],["blackwoodacademy.org",144],["cryptednews.space",144],["vivuq.com",144],["swgop.com",144],["vbnmll.com",144],["telcoinfo.online",144],["dshytb.com",144],["fadedfeet.com",145],["homeculina.com",145],["ineedskin.com",145],["kenzo-flowertag.com",145],["lawyex.co",145],["mdn.lol",145],["bitzite.com",146],["coingraph.us",147],["impact24.us",147],["nanolinks.in",148],["adrinolinks.com",148],["link.vipurl.in",148],["www.apkmoddone.com",149],["sitemini.io.vn",150],["vip1s.top",150],["dl.apkmoddone.com",151],["phongroblox.com",151],["financacerta.com",152],["encurtads.net",152],["shortencash.click",153],["lablue.*",154],["4-liga.com",155],["4fansites.de",155],["4players.de",155],["9monate.de",155],["aachener-nachrichten.de",155],["aachener-zeitung.de",155],["abendblatt.de",155],["abendzeitung-muenchen.de",155],["about-drinks.com",155],["abseits-ka.de",155],["airliners.de",155],["ajaxshowtime.com",155],["allgemeine-zeitung.de",155],["alpin.de",155],["antenne.de",155],["arcor.de",155],["areadvd.de",155],["areamobile.de",155],["ariva.de",155],["astronews.com",155],["aussenwirtschaftslupe.de",155],["auszeit.bio",155],["auto-motor-und-sport.de",155],["auto-service.de",155],["autobild.de",155],["autoextrem.de",155],["autopixx.de",155],["autorevue.at",155],["autotrader.nl",155],["az-online.de",155],["baby-vornamen.de",155],["babyclub.de",155],["bafoeg-aktuell.de",155],["berliner-kurier.de",155],["berliner-zeitung.de",155],["bigfm.de",155],["bikerszene.de",155],["bildderfrau.de",155],["blackd.de",155],["blick.de",155],["boerse-online.de",155],["boerse.de",155],["boersennews.de",155],["braunschweiger-zeitung.de",155],["brieffreunde.de",155],["brigitte.de",155],["buerstaedter-zeitung.de",155],["buffed.de",155],["businessinsider.de",155],["buzzfeed.at",155],["buzzfeed.de",155],["caravaning.de",155],["cavallo.de",155],["chefkoch.de",155],["cinema.de",155],["clever-tanken.de",155],["computerbild.de",155],["computerhilfen.de",155],["comunio-cl.com",155],["comunio.*",155],["connect.de",155],["chip.de",155],["da-imnetz.de",155],["dasgelbeblatt.de",155],["dbna.com",155],["dbna.de",155],["deichstube.de",155],["deine-tierwelt.de",155],["der-betze-brennt.de",155],["derwesten.de",155],["desired.de",155],["dhd24.com",155],["dieblaue24.com",155],["digitalfernsehen.de",155],["dnn.de",155],["donnerwetter.de",155],["e-hausaufgaben.de",155],["e-mountainbike.com",155],["eatsmarter.de",155],["echo-online.de",155],["ecomento.de",155],["einfachschoen.me",155],["elektrobike-online.com",155],["eltern.de",155],["epochtimes.de",155],["essen-und-trinken.de",155],["express.de",155],["extratipp.com",155],["familie.de",155],["fanfiktion.de",155],["fehmarn24.de",155],["fettspielen.de",155],["fid-gesundheitswissen.de",155],["finanzen.*",155],["finanznachrichten.de",155],["finanztreff.de",155],["finya.de",155],["firmenwissen.de",155],["fitforfun.de",155],["fnp.de",155],["football365.fr",155],["formel1.de",155],["fr.de",155],["frankfurter-wochenblatt.de",155],["freenet.de",155],["fremdwort.de",155],["froheweihnachten.info",155],["frustfrei-lernen.de",155],["fuldaerzeitung.de",155],["funandnews.de",155],["fussballdaten.de",155],["futurezone.de",155],["gala.de",155],["gamepro.de",155],["gamersglobal.de",155],["gamesaktuell.de",155],["gamestar.de",155],["gameswelt.*",155],["gamezone.de",155],["gartendialog.de",155],["gartenlexikon.de",155],["gedichte.ws",155],["geissblog.koeln",155],["gelnhaeuser-tageblatt.de",155],["general-anzeiger-bonn.de",155],["geniale-tricks.com",155],["genialetricks.de",155],["gesund-vital.de",155],["gesundheit.de",155],["gevestor.de",155],["gewinnspiele.tv",155],["giessener-allgemeine.de",155],["giessener-anzeiger.de",155],["gifhorner-rundschau.de",155],["giga.de",155],["gipfelbuch.ch",155],["gmuender-tagespost.de",155],["gruenderlexikon.de",155],["gusto.at",155],["gut-erklaert.de",155],["gutfuerdich.co",155],["hallo-muenchen.de",155],["hamburg.de",155],["hanauer.de",155],["hardwareluxx.de",155],["hartziv.org",155],["harzkurier.de",155],["haus-garten-test.de",155],["hausgarten.net",155],["haustec.de",155],["haz.de",155],["heftig.*",155],["heidelberg24.de",155],["heilpraxisnet.de",155],["heise.de",155],["helmstedter-nachrichten.de",155],["hersfelder-zeitung.de",155],["hftg.co",155],["hifi-forum.de",155],["hna.de",155],["hochheimer-zeitung.de",155],["hoerzu.de",155],["hofheimer-zeitung.de",155],["iban-rechner.de",155],["ikz-online.de",155],["immobilienscout24.de",155],["ingame.de",155],["inside-digital.de",155],["inside-handy.de",155],["investor-verlag.de",155],["jappy.com",155],["jpgames.de",155],["kabeleins.de",155],["kachelmannwetter.com",155],["kamelle.de",155],["kicker.de",155],["kindergeld.org",155],["klettern-magazin.de",155],["klettern.de",155],["kochbar.de",155],["kreis-anzeiger.de",155],["kreisbote.de",155],["kreiszeitung.de",155],["ksta.de",155],["kurierverlag.de",155],["lachainemeteo.com",155],["lampertheimer-zeitung.de",155],["landwirt.com",155],["laut.de",155],["lauterbacher-anzeiger.de",155],["leckerschmecker.me",155],["leinetal24.de",155],["lesfoodies.com",155],["levif.be",155],["lifeline.de",155],["liga3-online.de",155],["likemag.com",155],["linux-community.de",155],["linux-magazin.de",155],["live.vodafone.de",155],["ln-online.de",155],["lokalo24.de",155],["lustaufsleben.at",155],["lustich.de",155],["lvz.de",155],["lz.de",155],["mactechnews.de",155],["macwelt.de",155],["macworld.co.uk",155],["mail.de",155],["main-spitze.de",155],["manager-magazin.de",155],["manga-tube.me",155],["mathebibel.de",155],["mathepower.com",155],["maz-online.de",155],["medisite.fr",155],["mehr-tanken.de",155],["mein-kummerkasten.de",155],["mein-mmo.de",155],["mein-wahres-ich.de",155],["meine-anzeigenzeitung.de",155],["meinestadt.de",155],["menshealth.de",155],["mercato365.com",155],["merkur.de",155],["messen.de",155],["metal-hammer.de",155],["metalflirt.de",155],["meteologix.com",155],["minecraft-serverlist.net",155],["mittelbayerische.de",155],["modhoster.de",155],["moin.de",155],["mopo.de",155],["morgenpost.de",155],["motor-talk.de",155],["motorbasar.de",155],["motorradonline.de",155],["motorsport-total.com",155],["motortests.de",155],["mountainbike-magazin.de",155],["moviejones.de",155],["moviepilot.de",155],["mt.de",155],["mtb-news.de",155],["musiker-board.de",155],["musikexpress.de",155],["musikradar.de",155],["mz-web.de",155],["n-tv.de",155],["naumburger-tageblatt.de",155],["netzwelt.de",155],["neuepresse.de",155],["neueroeffnung.info",155],["news.at",155],["news.de",155],["news38.de",155],["newsbreak24.de",155],["nickles.de",155],["nicknight.de",155],["nl.hardware.info",155],["nn.de",155],["nnn.de",155],["nordbayern.de",155],["notebookchat.com",155],["notebookcheck-ru.com",155],["notebookcheck-tr.com",155],["notebookcheck.*",155],["noz-cdn.de",155],["noz.de",155],["nrz.de",155],["nw.de",155],["nwzonline.de",155],["oberhessische-zeitung.de",155],["och.to",155],["oeffentlicher-dienst.info",155],["onlinekosten.de",155],["onvista.de",155],["op-marburg.de",155],["op-online.de",155],["outdoor-magazin.com",155],["outdoorchannel.de",155],["paradisi.de",155],["pc-magazin.de",155],["pcgames.de",155],["pcgameshardware.de",155],["pcwelt.de",155],["pcworld.es",155],["peiner-nachrichten.de",155],["pferde.de",155],["pietsmiet.de",155],["pixelio.de",155],["pkw-forum.de",155],["playboy.de",155],["playfront.de",155],["pnn.de",155],["pons.com",155],["prignitzer.de",155],["profil.at",155],["promipool.de",155],["promobil.de",155],["prosiebenmaxx.de",155],["psychic.de",[155,171]],["quoka.de",155],["radio.at",155],["radio.de",155],["radio.dk",155],["radio.es",155],["radio.fr",155],["radio.it",155],["radio.net",155],["radio.pl",155],["radio.pt",155],["radio.se",155],["ran.de",155],["readmore.de",155],["rechtslupe.de",155],["recording.de",155],["rennrad-news.de",155],["reuters.com",155],["reviersport.de",155],["rhein-main-presse.de",155],["rheinische-anzeigenblaetter.de",155],["rimondo.com",155],["roadbike.de",155],["roemische-zahlen.net",155],["rollingstone.de",155],["rot-blau.com",155],["rp-online.de",155],["rtl.de",[155,249]],["rtv.de",155],["rugby365.fr",155],["ruhr24.de",155],["rundschau-online.de",155],["runnersworld.de",155],["safelist.eu",155],["salzgitter-zeitung.de",155],["sat1.de",155],["sat1gold.de",155],["schoener-wohnen.de",155],["schwaebische-post.de",155],["schwarzwaelder-bote.de",155],["serienjunkies.de",155],["shz.de",155],["sixx.de",155],["skodacommunity.de",155],["smart-wohnen.net",155],["sn.at",155],["sozialversicherung-kompetent.de",155],["spiegel.de",155],["spielen.de",155],["spieletipps.de",155],["spielfilm.de",155],["sport.de",155],["sport1.de",155],["sport365.fr",155],["sportal.de",155],["spox.com",155],["stern.de",155],["stuttgarter-nachrichten.de",155],["stuttgarter-zeitung.de",155],["sueddeutsche.de",155],["svz.de",155],["szene1.at",155],["szene38.de",155],["t-online.de",155],["tagesspiegel.de",155],["taschenhirn.de",155],["techadvisor.co.uk",155],["techstage.de",155],["tele5.de",155],["teltarif.de",155],["testedich.*",155],["the-voice-of-germany.de",155],["thueringen24.de",155],["tichyseinblick.de",155],["tierfreund.co",155],["tiervermittlung.de",155],["torgranate.de",155],["transfermarkt.*",155],["trend.at",155],["truckscout24.*",155],["tv-media.at",155],["tvdigital.de",155],["tvinfo.de",155],["tvspielfilm.de",155],["tvtoday.de",155],["tvtv.*",155],["tz.de",[155,170]],["unicum.de",155],["unnuetzes.com",155],["unsere-helden.com",155],["unterhalt.net",155],["usinger-anzeiger.de",155],["usp-forum.de",155],["videogameszone.de",155],["vienna.at",155],["vip.de",155],["virtualnights.com",155],["vox.de",155],["wa.de",155],["wallstreet-online.de",[155,158]],["waz.de",155],["weather.us",155],["webfail.com",155],["weihnachten.me",155],["weihnachts-bilder.org",155],["weihnachts-filme.com",155],["welt.de",155],["weltfussball.at",155],["weristdeinfreund.de",155],["werkzeug-news.de",155],["werra-rundschau.de",155],["wetterauer-zeitung.de",155],["wetteronline.*",155],["wieistmeineip.*",155],["wiesbadener-kurier.de",155],["wiesbadener-tagblatt.de",155],["winboard.org",155],["windows-7-forum.net",155],["winfuture.de",[155,166]],["wintotal.de",155],["wlz-online.de",155],["wn.de",155],["wohngeld.org",155],["wolfenbuetteler-zeitung.de",155],["wolfsburger-nachrichten.de",155],["woman.at",155],["womenshealth.de",155],["wormser-zeitung.de",155],["woxikon.de",155],["wp.de",155],["wr.de",155],["wunderweib.de",155],["yachtrevue.at",155],["ze.tt",155],["zeit.de",155],["meineorte.com",156],["osthessen-news.de",156],["techadvisor.com",156],["focus.de",156],["wetter.*",157],["deinesexfilme.com",159],["einfachtitten.com",159],["lesbenhd.com",159],["milffabrik.com",[159,220]],["porn-monkey.com",159],["porndrake.com",159],["pornhubdeutsch.net",159],["pornoaffe.com",159],["pornodavid.com",159],["pornoente.tv",[159,220]],["pornofisch.com",159],["pornofelix.com",159],["pornohammer.com",159],["pornohelm.com",159],["pornoklinge.com",159],["pornotom.com",[159,220]],["pornotommy.com",159],["pornovideos-hd.com",159],["pornozebra.com",[159,220]],["xhamsterdeutsch.xyz",159],["xnxx-sexfilme.com",159],["bembed.net",160],["embedv.net",160],["fslinks.org",160],["listeamed.net",160],["v6embed.xyz",160],["vembed.*",160],["vgplayer.xyz",160],["vid-guard.com",160],["vidguardto.xyz",160],["yesmovies.*>>",160],["pistona.xyz",160],["vinomo.xyz",160],["moflix-stream.*",[160,161]],["nu6i-bg-net.com",162],["khsm.io",162],["webcreator-journal.com",162],["msdos-games.com",162],["blocklayer.com",162],["weknowconquer.com",162],["giff.cloud",162],["aquarius-horoscopes.com",163],["cancer-horoscopes.com",163],["dubipc.blogspot.com",163],["echoes.gr",163],["engel-horoskop.de",163],["freegames44.com",163],["fuerzasarmadas.eu",163],["gemini-horoscopes.com",163],["jurukunci.net",163],["krebs-horoskop.com",163],["leo-horoscopes.com",163],["maliekrani.com",163],["nklinks.click",163],["ourenseando.es",163],["pisces-horoscopes.com",163],["radio-en-direct.fr",163],["sagittarius-horoscopes.com",163],["scorpio-horoscopes.com",163],["singlehoroskop-loewe.de",163],["skat-karten.de",163],["skorpion-horoskop.com",163],["taurus-horoscopes.com",163],["the1security.com",163],["virgo-horoscopes.com",163],["zonamarela.blogspot.com",163],["yoima.hatenadiary.com",163],["kaystls.site",164],["ftuapps.dev",165],["studydhaba.com",165],["freecourse.tech",165],["victor-mochere.com",165],["papunika.com",165],["mobilanyheter.net",165],["prajwaldesai.com",[165,238]],["carscoops.com",166],["dziennik.pl",166],["eurointegration.com.ua",166],["flatpanelshd.com",166],["footballtransfer.com.ua",166],["footballtransfer.ru",166],["hoyme.jp",166],["issuya.com",166],["itainews.com",166],["iusm.co.kr",166],["logicieleducatif.fr",166],["mynet.com",[166,187]],["onlinegdb.com",166],["picrew.me",166],["pravda.com.ua",166],["reportera.co.kr",166],["sportsrec.com",166],["sportsseoul.com",166],["text-compare.com",166],["tweaksforgeeks.com",166],["wfmz.com",166],["worldhistory.org",166],["palabr.as",166],["motscroises.fr",166],["cruciverba.it",166],["w.grapps.me",166],["gazetaprawna.pl",166],["pressian.com",166],["raenonx.cc",[166,265]],["indiatimes.com",166],["missyusa.com",166],["aikatu.jp",166],["ark-unity.com",166],["cool-style.com.tw",166],["doanhnghiepvn.vn",166],["automobile-catalog.com",167],["motorbikecatalog.com",167],["maketecheasier.com",167],["mlbpark.donga.com",168],["jjang0u.com",169],["forumdz.com",171],["abandonmail.com",171],["flmods.com",171],["zilinak.sk",171],["hotdesimms.com",171],["pdfaid.com",171],["bootdey.com",171],["mail.com",171],["expresskaszubski.pl",171],["moegirl.org.cn",171],["flix-wave.lol",171],["fmovies0.cc",171],["worthcrete.com",171],["my-code4you.blogspot.com",172],["vrcmods.com",173],["osuskinner.com",173],["osuskins.net",173],["pentruea.com",[174,175]],["mchacks.net",176],["why-tech.it",177],["compsmag.com",178],["tapetus.pl",179],["autoroad.cz",180],["brawlhalla.fr",180],["tecnobillo.com",180],["pokemon-project.com",180],["sexcamfreeporn.com",181],["breatheheavy.com",182],["wenxuecity.com",183],["key-hub.eu",184],["fabioambrosi.it",185],["tattle.life",186],["emuenzen.de",186],["terrylove.com",186],["cidade.iol.pt",188],["fantacalcio.it",189],["hentaifreak.org",190],["hypebeast.com",191],["krankheiten-simulieren.de",192],["catholic.com",193],["3dmodelshare.org",194],["techinferno.com",195],["ibeconomist.com",196],["bookriot.com",197],["purposegames.com",198],["globo.com",199],["latimes.com",199],["claimrbx.gg",200],["perelki.net",201],["vpn-anbieter-vergleich-test.de",202],["livingincebuforums.com",203],["paperzonevn.com",204],["alltechnerd.com",205],["malaysianwireless.com",206],["erinsakura.com",207],["infofuge.com",207],["freejav.guru",207],["novelmultiverse.com",207],["fritidsmarkedet.dk",208],["maskinbladet.dk",208],["15min.lt",209],["baddiehub.com",210],["mr9soft.com",211],["21porno.com",212],["adult-sex-gamess.com",213],["hentaigames.app",213],["mobilesexgamesx.com",213],["mysexgamer.com",213],["porngameshd.com",213],["sexgamescc.com",213],["xnxx-sex-videos.com",213],["f2movies.to",214],["freeporncave.com",215],["tubsxxx.com",216],["manga18fx.com",217],["freebnbcoin.com",217],["sextvx.com",218],["muztext.com",219],["pornohans.com",220],["nursexfilme.com",220],["pornohirsch.net",220],["xhamster-sexvideos.com",220],["pornoschlange.com",220],["xhamsterdeutsch.*",220],["hdpornos.net",220],["gutesexfilme.com",220],["zona-leros.com",220],["charbelnemnom.com",221],["simplebits.io",222],["online-fix.me",223],["privatemoviez.*",224],["gamersdiscussionhub.com",224],["owlzo.com",225],["q1003.com",226],["blogpascher.com",227],["testserver.pro",228],["lifestyle.bg",228],["money.bg",228],["news.bg",228],["topsport.bg",228],["webcafe.bg",228],["schoolcheats.net",229],["mgnet.xyz",230],["advertiserandtimes.co.uk",231],["111.90.159.132",232],["techsolveprac.com",233],["joomlabeginner.com",234],["askpaccosi.com",235],["largescaleforums.com",236],["dubznetwork.com",237],["dongknows.com",239],["traderepublic.community",240],["babia.to",241],["code2care.org",242],["gmx.*",243],["yts-subs.net",244],["dlhd.sx",244],["xxxxsx.com",245],["ngontinh24.com",246],["idevicecentral.com",247],["dzeko11.net",248],["mangacrab.com",250],["hortonanderfarom.blogspot.com",251],["viefaucet.com",252],["pourcesoir.in",252],["cloud-computing-central.com",253],["afk.guide",254],["businessnamegenerator.com",255],["derstandard.at",256],["derstandard.de",256],["rocketnews24.com",257],["soranews24.com",257],["youpouch.com",257],["gourmetscans.net",258],["ilsole24ore.com",259],["ipacrack.com",260],["hentaiporn.one",261],["infokik.com",262],["porhubvideo.com",263],["webseriessex.com",263],["panuvideo.com",263],["pornktubes.net",263],["daemonanime.net",264],["bgmateriali.com",264],["deezer.com",265],["fosslinux.com",266],["shrdsk.me",267],["examword.com",268],["sempreupdate.com.br",268],["tribuna.com",269],["trendsderzukunft.de",270],["gal-dem.com",270],["lostineu.eu",270],["oggitreviso.it",270],["speisekarte.de",270],["mixed.de",270],["lightnovelspot.com",[271,272]],["novelpub.com",[271,272]],["webnovelpub.com",[271,272]],["hwzone.co.il",274],["nammakalvi.com",275],["igay69.com",275],["c2g.at",276],["terafly.me",276],["elamigos-games.com",276],["elamigos-games.net",276],["elamigosgames.org",276],["dktechnicalmate.com",277],["recipahi.com",277],["vpntester.org",278],["digitask.ru",280],["tempumail.com",281],["sexvideos.host",282],["camcaps.*",283],["10alert.com",284],["cryptstream.de",285],["nydus.org",285],["techhelpbd.com",286],["fapdrop.com",287],["cellmapper.net",288],["hdrez.com",289],["youwatch-serie.com",289],["russland.jetzt",289],["printablecreative.com",290],["peachprintable.com",290],["comohoy.com",291],["leak.sx",291],["paste.bin.sx",291],["pornleaks.in",291],["merlininkazani.com",291],["j91.asia",292],["rekidai-info.github.io",293],["jeniusplay.com",294],["indianyug.com",295],["rgb.vn",295],["needrom.com",296],["criptologico.com",297],["megadrive-emulator.com",298],["eromanga-show.com",299],["hentai-one.com",299],["hentaipaw.com",299],["10minuteemails.com",300],["luxusmail.org",300],["w3cub.com",301],["bangpremier.com",302],["nyaa.iss.ink",303],["drivebot.*",304],["thenextplanet1.*",305],["tnp98.xyz",305],["freepdfcomic.com",306],["techedubyte.com",307],["tickzoo.tv",308],["oploverz.*",308],["memedroid.com",309],["karaoketexty.cz",310],["filmizlehdfilm.com",311],["filmizletv.*",311],["fullfilmizle.cc",311],["gofilmizle.net",311],["resortcams.com",312],["cheatography.com",312],["sonixgvn.net",313],["autoscout24.*",314],["mjakmama24.pl",315],["cheatermad.com",316],["ville-ideale.fr",317],["brainly.*",318],["eodev.com",318],["xfreehd.com",319],["freethesaurus.com",320],["thefreedictionary.com",320],["fm-arena.com",321],["tradersunion.com",322],["tandess.com",323],["allosurf.net",323],["spontacts.com",324],["dankmemer.lol",325],["getexploits.com",326],["fplstatistics.com",327],["breitbart.com",328],["salidzini.lv",329],["choosingnothing.com",330],["cryptorank.io",[331,332]],["4kwebplay.xyz",333],["qqwebplay.xyz",333],["viwlivehdplay.ru",333],["molbiotools.com",334],["vods.tv",335],["18xxx.xyz",336],["raidrush.net",337],["xnxxcom.xyz",338],["videzz.net",339],["spambox.xyz",340],["dreamdth.com",341],["freemodsapp.in",341],["onlytech.com",341],["player.jeansaispasplus.homes",342],["en-thunderscans.com",343],["iqksisgw.xyz",344],["caroloportunidades.com.br",345],["coempregos.com.br",345],["foodiesgallery.com",345],["vikatan.com",346],["camhub.world",347],["mma-core.*",348],["teracourses.com",349],["servustv.com",350],["freevipservers.net",351],["streambtw.com",352],["qrcodemonkey.net",353],["streamup.ws",354],["tv-films.co.uk",355],["streambolt.tv",356],["strmbolt.com",356],["cool--web-de.translate.goog",[357,358]],["gps--cache-de.translate.goog",[357,358]],["web--spiele-de.translate.goog",[357,358]],["fun--seiten-de.translate.goog",[357,358]],["photo--alben-de.translate.goog",[357,358]],["wetter--vorhersage-de.translate.goog",[357,358]],["coolsoftware-de.translate.goog",[357,358]],["kryptografie-de.translate.goog",[357,358]],["cool--domains-de.translate.goog",[357,358]],["net--tours-de.translate.goog",[357,358]],["such--maschine-de.translate.goog",[357,358]],["qul-de.translate.goog",[357,358]],["mailtool-de.translate.goog",[357,358]],["c--ix-de.translate.goog",[357,358]],["softwareengineer-de.translate.goog",[357,358]],["net--tools-de.translate.goog",[357,358]],["hilfen-de.translate.goog",[357,358]],["45er-de.translate.goog",[357,358]],["cooldns-de.translate.goog",[357,358]],["hardware--entwicklung-de.translate.goog",[357,358]],["bgsi.gg",359]]);
const exceptionsMap = new Map([["vvid30c.*",[160]]]);
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
