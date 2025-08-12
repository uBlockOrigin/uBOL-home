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
const argsList = [["=document[_0x"],["]();}","500"],[")](this,...","3000-6000"],["(new Error(","3000-6000"],[".offsetHeight>0"],["adblock"],["/mylovelyobj|amzn_aps_csm|\\'\\/hello\\'|YW16bl9hcHNfY3Nt|cmVwb3J0RXJyb3Jz|L3ZlcnktcGxlYXNl|getAdnginName|hasOwnProperty|location/"],["googleFC"],["adb"],["adBlockerDetected"],["show"],["InfMediafireMobileFunc","1000"],["google_jobrunner"],["admc"],["apstagLOADED"],["/Adb|moneyDetect/"],["disableDeveloper"],["Blocco","2000"],["test","0"],["checkAdblockUser","1000"],["checkPub","6000"],["'0x"],["document.querySelector","5000"],["nextFunction","250"],["backRedirect"],["document.querySelectorAll","1000"],["style"],["clientHeight"],["addEventListener","0"],["adblock","2000"],["nextFunction","2000"],["byepopup","5000"],["additional_src","300"],["()","2000"],["css_class.show"],["CANG","3000"],["updato-overlay","500"],["innerText","2000"],["alert","8000"],["css_class"],["()","50"],["debugger"],["initializeCourier","3000"],["redirectPage"],["_0x","2000"],["ads","750"],["location.href","500"],["Adblock","5000"],["disable","200"],["CekAab","0"],["rbm_block_active","1000"],["show()"],["_0x"],["n.trigger","1"],["abDetected"],["$"],["KeepOpeningPops","1000"],["location.href"],["adb","0"],["adBlocked"],["warning","100"],["adsbygoogle"],["adblock_popup","500"],["Adblock"],["location.href","10000"],["keep-ads","2000"],["#rbm_block_active","1000"],["null","4000"],["()","2500"],["myaabpfun","3000"],["adFilled","2500"],["()","15000"],["showPopup"],["adrecover"],["()","1000"],["document.cookie","2500"],["window.open"],["innerHTML"],["readyplayer","2000"],["/innerHTML|AdBlock/"],["checkStopBlock"],["adspot_top","1500"],["/offsetHeight|google|Global/"],["an_message","500"],["Adblocker","10000"],["timeoutChecker"],["bait","1"],["ai_adb"],["displayCookieWallBanner"],["pum-open"],["overlay","2000"],["/adblock/i"],["Math.round","1000"],["adblock","5"],["ag_adBlockerDetected"],["null"],["adb","6000"],["sadbl"],["brave_load_popup"],["adsbytrafficjunkycontext"],["ipod"],["offsetWidth"],["/$|adBlock/"],["()"],["AdBlock"],["stop-scrolling"],["Adv"],["blockUI","2000"],["mdpDeBlocker"],["/_0x|debug/"],["/ai_adb|_0x/"],["adBlock"],["","1"],["undefined"],["check","1"],["adsBlocked"],["nextFunction"],["blocker"],["afs_ads","2000"],["bait"],["getComputedStyle","250"],["blocked"],["{r()","0"],["nextFunction","450"],["Debug"],["r()","0"],["test","100"],["purple_box"],["checkSiteNormalLoad"],["0x"],["adBlockOverlay"],["Detected","500"],["mdp"],["modal"],[".show","1000"],["afterOpen"],[".show"],["showModal"],["blur"],["samOverlay"],["native"],["bADBlock"],["location"],["alert"],["t()","0"],["ads"],["alert","2000"],["/adblock|isRequestPresent/"],["documentElement.innerHTML"],["_0x","500"],["isRequestPresent"],["1e3*"],["","2000"],["/^/","1000"],["checkAdBlock"],["displayAdBlockerMessage"],["push","500"],[".call(null)","10"],[".call(null)"],["(null)","10"],["userHasAdblocker"],["appendChild"],["affiliate"],["getComputedStyle"],["displayMessage","2000"],["AdDetect"],["ai_"],["error-report.com"],["loader.min.js"],["content-loader.com"],["()=>","5000"],["[native code]","500"],["await _0x"],["adbl"],["openPopunder"],["offsetHeight"],["offsetLeft"],["height"],["charAt"],["checkAds"],["fadeIn","0"],["jQuery"],["/^/"],["check"],["Adblocker"],["eabdModal"],["ab_root.show"],["gaData"],["ad"],["prompt","1000"],["googlefc"],["adblock detection"],[".offsetHeight","100"],["popState"],["ad-block-popup"],["exitTimer"],["innerHTML.replace"],["eabpDialog"],["adsense"],["/Adblock|_ad_/"],["googletag"],["f.parentNode.removeChild(f)","100"],["swal","500"],["keepChecking","1000"],["openPopup"],[".offsetHeight"],["()=>{"],["nitroAds"],["class.scroll","1000"],["disableDeveloperTools"],["Check"],["insertBefore"],["css_class.scroll"],["/null|Error/","10000"],["window.location.href","50"],["/out.php"],["/0x|devtools/"],["location.replace","300"],["window.location.href"],["fetch"],["window.location.href=link"],["reachGoal"],["Adb"],["ai"],["","3000"],["/width|innerHTML/"],["magnificPopup"],["/debugger|offsetParent/"],["adblockEnabled"],["google_ad"],["document.location"],["google"],["answers"],["top-right","2000"],["enforceAdStatus"],["mfp"],["display","5000"],["eb"],["/adb/i"],[").show()"],["","1000"],["site-access"],["/Ads|adbl|offsetHeight/"],["/show|innerHTML/"],["/show|document\\.createElement/"],["MobileInGameGames"],["Msg"],["UABP"],["()","150"],["href"],["aaaaa-modal"],["()=>"],["null","10"],["","500"],["pop"],["/adbl/i"],["-0x"],["display"],["gclid"],["event","3000"],["rejectWith"],[".data?"],["refresh"],["location.href","3000"],["ga"],["keepChecking"],["myTestAd"],["Ads"],["ShowAdBLockerNotice"],["ad_listener"],["open"],["(!0)"],["Delay"],["/appendChild|e\\(\"/"],["=>"],["ADB"],["site-access-popup"],["data?"],["checkAdblockUser"],["offsetHeight","100"],["/salesPopup|mira-snackbar/"],["detectImgLoad"],["offsetHeight","200"],["detector"],["replace"],["touchstart"],["siteAccessFlag"],["ab"],["/adblocker|alert/"],["redURL"],["/children\\('ins'\\)|Adblock|adsbygoogle/"],["displayMessage"],["chkADB"],["onDetected"],["fuckadb"],["/aframe|querySelector/","1000-"],["detect"],["siteAccessPopup"],["/adsbygoogle|adblock|innerHTML|setTimeout/"],["akadb"],["biteDisplay"],["/[a-z]\\(!0\\)/","800"],["ad_block"],["/detectAdBlocker|window.open/"],["adBlockDetected"],["popUnder"],["/GoToURL|delay/"],["window.location.href","300"],["/location.href|location = atob/"],[".redirect"],["popup"],["/adScriptPath|MMDConfig/"],["/native|\\{n\\(\\)/"],["psresimler"],["adblocker"],["EzoIvent"],["/Detect|adblock|style\\.display|\\[native code]|\\.call\\(null\\)/"],["removeChild"],["offset"],["Ad","5000"],["contrformpub"],["trigger","0"],["/\\.append|\\.innerHTML|undefined|\\.css|blocker|flex|\\$\\('|obfuscatedMsg/"],["warn"],["getComputedStyle","2000"],["video-popup"],["detectAdblock"],["detectAdBlocker"],["nads"],["current.children"],["adStatus"],["BN_CAMPAIGNS"],["media_place_list"],["...","300"],["/\\{[a-z]\\(!0\\)\\}/"],["stackTrace"],["inner-ad"],["_ET"],[".clientHeight"],["getComputedStyle(el)"],["location.replace"],["console.clear"],["ad_block_detector"],["document.createElement"],["sandbox"],["getComputedStyle(testAd)"],[".adv-"],["document['\\x"],["hasAdblock"],["/adblock|isblock/i"],["visibility","2000"],["displayAdBlockedVideo"],["test.remove","100"],["adBlockerModal"],["","10000-15000"],["adex"],["length"],["atob","120000"],["#ad_blocker_detector"],["push"],["AdBlocker"],["wbDeadHinweis"],["","10000"],["fired"],["determineVisibility"],["TNCMS.DMP"],["ast"],["googlesyndication"],["moneyDetect"],["sub"],["/createElement|addEventListener|clientHeight/"]];
const hostnamesMap = new Map([["japscan.*",0],["poophq.com",1],["veev.to",1],["dogdrip.net",2],["infinityfree.com",2],["smsonline.cloud",[2,3]],["faqwiki.us",4],["mail.yahoo.com",[5,275]],["maxcheaters.com",5],["postimees.ee",5],["police.community",5],["gisarea.com",5],["schaken-mods.com",5],["tvnet.lv",5],["theclashify.com",5],["txori.com",5],["olarila.com",5],["deletedspeedstreams.blogspot.com",5],["schooltravelorganiser.com",5],["xhardhempus.net",5],["mhn.quest",5],["leagueofgraphs.com",5],["hieunguyenphoto.com",5],["benzinpreis.de",5],["client.falixnodes.net",[6,308]],["lastampa.it",7],["m.timesofindia.com",8],["timesofindia.indiatimes.com",8],["youmath.it",8],["redensarten-index.de",8],["lesoir.be",8],["electriciansforums.net",8],["keralatelecom.info",8],["universegunz.net",8],["happypenguin.altervista.org",8],["everyeye.it",8],["eztv.*",8],["bluedrake42.com",8],["supermarioemulator.com",8],["futbollibrehd.com",8],["eska.pl",8],["eskarock.pl",8],["voxfm.pl",8],["mathaeser.de",8],["betaseries.com",8],["free-sms-receive.com",8],["sms-receive-online.com",8],["computer76.ru",8],["golem.de",[9,10,157]],["hdbox.ws",10],["todopolicia.com",10],["scat.gold",10],["freecoursesite.com",10],["windowcleaningforums.co.uk",10],["cruisingearth.com",10],["hobby-machinist.com",10],["freegogpcgames.com",10],["latitude.to",10],["kitchennovel.com",10],["w3layouts.com",10],["blog.receivefreesms.co.uk",10],["eductin.com",10],["dealsfinders.blog",10],["audiobooks4soul.com",10],["tinhocdongthap.com",10],["downloadr.in",10],["topcomicporno.com",10],["sushi-scan.*",10],["celtadigital.com",10],["iptvrun.com",10],["adsup.lk",10],["cryptomonitor.in",10],["areatopik.com",10],["cardscanner.co",10],["nullforums.net",10],["courseclub.me",10],["tamarindoyam.com",10],["jeep-cj.com",10],["choiceofmods.com",10],["myqqjd.com",10],["ssdtop.com",10],["apkhex.com",10],["gezegenforum.com",10],["iptvapps.net",10],["null-scripts.net",10],["nullscripts.net",10],["bloground.ro",10],["witcherhour.com",10],["ottverse.com",10],["torrentmac.net",10],["mazakony.com",10],["laptechinfo.com",10],["mc-at.org",10],["playstationhaber.com",10],["seriesperu.com",10],["spigotunlocked.*",10],["pesprofessionals.com",10],["wpsimplehacks.com",10],["sportshub.to",[10,265]],["topsporter.net",[10,265]],["darkwanderer.net",10],["truckingboards.com",10],["coldfrm.org",10],["azrom.net",10],["freepatternsarea.com",10],["alttyab.net",10],["ahmedmode.*",10],["mobilkulup.com",10],["esopress.com",10],["nesiaku.my.id",10],["jipinsoft.com",10],["truthnews.de",10],["farsinama.com",10],["worldofiptv.com",10],["vuinsider.com",10],["crazydl.net",10],["gamemodsbase.com",10],["babiato.tech",10],["secuhex.com",10],["turkishaudiocenter.com",10],["galaxyos.net",10],["bizdustry.com",10],["storefront.com.ng",10],["pkbiosfix.com",10],["casi3.xyz",10],["starleaks.org",10],["forum-xiaomi.com",10],["mediafire.com",11],["wcoanimedub.tv",12],["wcoforever.net",12],["openspeedtest.com",12],["addtobucketlist.com",12],["3dzip.org",[12,67]],["ilmeteo.it",12],["wcoforever.com",12],["comprovendolibri.it",12],["healthelia.com",12],["yts.*",13],["720pstream.*",13],["1stream.*",13],["tutele.sx",13],["seattletimes.com",14],["bestgames.com",15],["yiv.com",15],["globalrph.com",16],["e-glossa.it",17],["webcheats.com.br",18],["urlcero.*",19],["gala.fr",20],["gentside.com",20],["geo.fr",20],["hbrfrance.fr",20],["nationalgeographic.fr",20],["ohmymag.com",20],["serengo.net",20],["vsd.fr",20],["short.pe",21],["thefmovies.*",21],["footystreams.net",21],["katestube.com",21],["updato.com",[22,36]],["totaldebrid.*",23],["sandrives.*",23],["daizurin.com",23],["pendekarsubs.us",23],["dreamfancy.org",23],["rysafe.blogspot.com",23],["techacode.com",23],["toppng.com",23],["th-world.com",23],["avjamack.com",23],["avjamak.net",23],["cnnamador.com",24],["nudecelebforum.com",25],["pronpic.org",26],["thewebflash.com",27],["discordfastfood.com",27],["xup.in",27],["popularmechanics.com",28],["op.gg",29],["comunidadgzone.es",30],["fxporn69.*",30],["mp3fy.com",30],["lebensmittelpraxis.de",30],["aliancapes.*",30],["forum-pokemon-go.fr",30],["praxis-jugendarbeit.de",30],["dictionnaire-medical.net",30],["cle0desktop.blogspot.com",30],["up-load.io",30],["keysbrasil.blogspot.com",30],["hotpress.info",30],["turkleech.com",30],["anibatch.me",30],["anime-i.com",30],["gewinde-normen.de",30],["tucinehd.com",30],["kdramasmaza.com.pk",30],["jellynote.com",31],["eporner.com",32],["pornbimbo.com",33],["4j.com",33],["avoiderrors.com",34],["sitarchive.com",34],["livenewsof.com",34],["topnewsshow.com",34],["gatcha.org",34],["kusonime.com",34],["suicidepics.com",34],["codesnail.com",34],["codingshiksha.com",34],["graphicux.com",34],["citychilli.com",34],["talkjarvis.com",34],["hdmotori.it",35],["tubsexer.*",37],["femdomtb.com",37],["porno-tour.*",37],["lenkino.*",37],["bobs-tube.com",37],["pornfd.com",37],["pornomoll.*",37],["camsclips.*",37],["popno-tour.net",37],["watchmdh.to",37],["camwhores.tv",37],["camhub.cc",37],["elfqrin.com",38],["satcesc.com",39],["apfelpatient.de",39],["lusthero.com",40],["m4ufree.*",41],["m2list.com",41],["embed.nana2play.com",41],["dallasnews.com",42],["lnk.news",43],["lnk.parts",43],["efukt.com",44],["wendycode.com",44],["springfieldspringfield.co.uk",45],["porndoe.com",46],["smsget.net",[47,48]],["kjanime.net",49],["gioialive.it",50],["classicreload.com",51],["scriptzhub.com",51],["hotpornfile.org",52],["coolsoft.altervista.org",52],["hackedonlinegames.com",52],["dailytech-news.eu",52],["settlersonlinemaps.com",52],["ad-doge.com",52],["magdownload.org",52],["kpkuang.org",52],["crypto4yu.com",52],["faucetwork.space",52],["writedroid.*",52],["thenightwithoutthedawn.blogspot.com",52],["entutes.com",52],["claimlite.club",52],["newscon.org",52],["rl6mans.com",52],["chicoer.com",53],["bostonherald.com",53],["dailycamera.com",53],["sportsplays.com",54],["ebookdz.com",55],["telerium.*",56],["pornvideotop.com",57],["krotkoosporcie.pl",57],["xstory-fr.com",57],["1337x.*",57],["x1337x.*",57],["1337x.ninjaproxy1.com",57],["ytapi.cc",57],["letribunaldunet.fr",58],["vladan.fr",58],["live-tv-channels.org",59],["eslfast.com",60],["ge-map-overlays.appspot.com",61],["mad4wheels.com",61],["1xanimes.in",61],["logi.im",61],["emailnator.com",61],["appnee.com",61],["freegamescasual.com",62],["tcpvpn.com",63],["oko.sh",63],["timesnownews.com",63],["timesnowhindi.com",63],["timesnowmarathi.com",63],["zoomtventertainment.com",63],["tsubasa.im",64],["sholah.net",65],["2rdroid.com",65],["bisceglielive.it",66],["pandajogosgratis.com.br",68],["5278.cc",69],["pandafreegames.*",70],["tonspion.de",71],["duplichecker.com",72],["plagiarismchecker.co",72],["plagiarismdetector.net",72],["searchenginereports.net",72],["smallseotools.com",73],["linkspaid.com",74],["proxydocker.com",74],["beeimg.com",[75,76]],["emturbovid.com",76],["findjav.com",76],["javggvideo.xyz",76],["mmtv01.xyz",76],["stbturbo.xyz",76],["trailerhg.xyz",76],["turboplayers.xyz",76],["viralharami.com",76],["ftlauderdalebeachcam.com",77],["ftlauderdalewebcam.com",77],["juneauharborwebcam.com",77],["keywestharborwebcam.com",77],["kittycatcam.com",77],["mahobeachcam.com",77],["miamiairportcam.com",77],["morganhillwebcam.com",77],["njwildlifecam.com",77],["nyharborwebcam.com",77],["paradiseislandcam.com",77],["pompanobeachcam.com",77],["portbermudawebcam.com",77],["portcanaveralwebcam.com",77],["portevergladeswebcam.com",77],["portmiamiwebcam.com",77],["portnywebcam.com",77],["portnassauwebcam.com",77],["portstmaartenwebcam.com",77],["portstthomaswebcam.com",77],["porttampawebcam.com",77],["sxmislandcam.com",77],["themes-dl.com",77],["badassdownloader.com",77],["badasshardcore.com",77],["badassoftcore.com",77],["nulljungle.com",77],["teevee.asia",77],["otakukan.com",77],["thoptv.*",78],["gearingcommander.com",79],["generate.plus",80],["calculate.plus",80],["avcesar.com",81],["audiotag.info",82],["tudigitale.it",83],["ibcomputing.com",84],["legia.net",85],["acapellas4u.co.uk",86],["robloxscripts.com",87],["libreriamo.it",87],["postazap.com",87],["filmyzones.com",87],["medebooks.xyz",87],["mashtips.com",87],["marriedgames.com.br",87],["4allprograms.me",87],["shortzzy.*",87],["nurgsm.com",87],["certbyte.com",87],["plugincrack.com",87],["gamingdeputy.com",87],["freewebcart.com",87],["gamekult.com",88],["streamhentaimovies.com",89],["konten.co.id",90],["diariodenavarra.es",91],["scripai.com",91],["myfxbook.com",91],["whatfontis.com",91],["tubereader.me",91],["optifine.net",92],["luzernerzeitung.ch",93],["tagblatt.ch",93],["ableitungsrechner.net",94],["alternet.org",95],["gourmetsupremacy.com",95],["shrib.com",96],["streameast.*",97],["thestreameast.*",97],["techclips.net",97],["daddylivehd.*",97],["footyhunter.lol",97],["poscitech.click",97],["wecast.to",97],["sportbar.live",97],["freecourseweb.com",98],["devcourseweb.com",98],["coursewikia.com",98],["courseboat.com",98],["pornhub.*",99],["lne.es",[100,369]],["pornult.com",101],["webcamsdolls.com",101],["bitcotasks.com",[101,143]],["adsy.pw",101],["playstore.pw",101],["exactpay.online",101],["thothd.to",101],["proplanta.de",102],["textograto.com",103],["voyageforum.com",104],["hmc-id.blogspot.com",104],["myabandonware.com",104],["wcofun.*",104],["ilforumdeibrutti.is",104],["prad.de",[105,157]],["chatta.it",106],["ketubanjiwa.com",107],["nsfw247.to",108],["funzen.net",108],["extremereportbot.com",109],["getintopc.com",110],["qoshe.com",111],["lowellsun.com",112],["mamadu.pl",112],["dobrapogoda24.pl",112],["motohigh.pl",112],["namasce.pl",112],["ultimate-catch.eu",113],["cpopchanelofficial.com",114],["creditcardgenerator.com",115],["creditcardrush.com",115],["bostoncommons.net",115],["thejobsmovie.com",115],["hl-live.de",116],["satoshi-win.xyz",116],["encurtandourl.com",[116,120]],["www-daftarharga.blogspot.com",116],["ear-phone-review.com",116],["telefullenvivo.com",116],["listatv.pl",116],["coin-profits.xyz",116],["relampagomovies.com",116],["wohnmobilforum.de",116],["nulledbear.com",116],["sinnerclownceviri.net",116],["nilopolisonline.com.br",117],["mesquitaonline.com",117],["yellowbridge.com",117],["yaoiotaku.com",118],["moneyhouse.ch",119],["ihow.info",120],["filesus.com",120],["gotxx.*",120],["sturls.com",120],["turbo1.co",120],["hartico.tv",120],["cupra.forum",120],["turkanime.*",121],["valeronevijao.com",121],["yodelswartlike.com",121],["generatesnitrosate.com",121],["gamoneinterrupted.com",121],["metagnathtuggers.com",121],["wolfdyslectic.com",121],["rationalityaloelike.com",121],["sizyreelingly.com",121],["urochsunloath.com",121],["monorhinouscassaba.com",121],["35volitantplimsoles5.com",121],["antecoxalbobbing1010.com",121],["boonlessbestselling244.com",121],["cyamidpulverulence530.com",121],["guidon40hyporadius9.com",121],["449unceremoniousnasoseptal.com",121],["30sensualizeexpression.com",121],["greaseball6eventual20.com",121],["toxitabellaeatrebates306.com",121],["20demidistance9elongations.com",121],["audaciousdefaulthouse.com",121],["fittingcentermondaysunday.com",121],["launchreliantcleaverriver.com",121],["matriculant401merited.com",121],["realfinanceblogcenter.com",121],["telyn610zoanthropy.com",121],["un-block-voe.net",121],["v-o-e-unblock.com",121],["voe-un-block.com",121],["voe-unblock.*",121],["voeun-block.net",121],["voeunbl0ck.com",121],["voeunblck.com",121],["voeunblk.com",121],["voeunblock.com",121],["voeunblock2.com",121],["voeunblock3.com",121],["agefi.fr",122],["cariskuy.com",123],["letras2.com",123],["yusepjaelani.blogspot.com",124],["letras.mus.br",125],["eletronicabr.com",126],["mtlurb.com",127],["onemanhua.com",128],["laksa19.github.io",129],["javcl.com",129],["tvlogy.to",129],["rp5.*",129],["live.dragaoconnect.net",129],["seznamzpravy.cz",129],["xerifetech.com",129],["freemcserver.net",129],["t3n.de",130],["allindiaroundup.com",131],["tapchipi.com",132],["dcleakers.com",132],["esgeeks.com",132],["pugliain.net",132],["uplod.net",132],["worldfreeware.com",132],["tech-blogs.com",132],["cardiagn.com",132],["fikiri.net",132],["myhackingworld.com",132],["phoenixfansub.com",132],["vectorizer.io",133],["onehack.us",133],["smgplaza.com",133],["thapcam.net",133],["breznikar.com",133],["thefastlaneforum.com",134],["5flix.top",135],["bembed.net",135],["embedv.net",135],["javguard.club",135],["listeamed.net",135],["v6embed.xyz",135],["vembed.*",135],["vid-guard.com",135],["vidguardto.xyz",135],["yesmovies.*>>",135],["pistona.xyz",135],["vinomo.xyz",135],["moflix-stream.*",[135,162]],["trade2win.com",136],["modagamers.com",137],["khatrimaza.*",137],["freemagazines.top",137],["pogolinks.*",137],["straatosphere.com",137],["nullpk.com",137],["adslink.pw",137],["downloadudemy.com",137],["picgiraffe.com",137],["weadown.com",137],["freepornsex.net",137],["nurparatodos.com.ar",137],["popcornstream.*",138],["routech.ro",138],["hokej.net",138],["turkmmo.com",139],["acdriftingpro.com",140],["palermotoday.it",141],["baritoday.it",141],["trentotoday.it",141],["agrigentonotizie.it",141],["anconatoday.it",141],["arezzonotizie.it",141],["avellinotoday.it",141],["bresciatoday.it",141],["brindisireport.it",141],["casertanews.it",141],["cataniatoday.it",141],["cesenatoday.it",141],["chietitoday.it",141],["forlitoday.it",141],["frosinonetoday.it",141],["genovatoday.it",141],["ilpescara.it",141],["ilpiacenza.it",141],["latinatoday.it",141],["lecceprima.it",141],["leccotoday.it",141],["livornotoday.it",141],["messinatoday.it",141],["milanotoday.it",141],["modenatoday.it",141],["monzatoday.it",141],["novaratoday.it",141],["padovaoggi.it",141],["parmatoday.it",141],["perugiatoday.it",141],["pisatoday.it",141],["quicomo.it",141],["ravennatoday.it",141],["reggiotoday.it",141],["riminitoday.it",141],["romatoday.it",141],["salernotoday.it",141],["sondriotoday.it",141],["sportpiacenza.it",141],["ternitoday.it",141],["today.it",141],["torinotoday.it",141],["trevisotoday.it",141],["triesteprima.it",141],["udinetoday.it",141],["veneziatoday.it",141],["vicenzatoday.it",141],["thumpertalk.com",142],["austiblox.net",142],["arkcod.org",142],["thelayoff.com",143],["shorterall.com",143],["maxstream.video",143],["tvepg.eu",143],["manwan.xyz",143],["dailymaverick.co.za",144],["ludigames.com",145],["made-by.org",145],["worldtravelling.com",145],["technichero.com",145],["androidadult.com",145],["aeroxplorer.com",145],["sportitalialive.com",145],["adrinolinks.com",146],["link.vipurl.in",146],["nanolinks.in",146],["fadedfeet.com",147],["homeculina.com",147],["ineedskin.com",147],["kenzo-flowertag.com",147],["lawyex.co",147],["mdn.lol",147],["starkroboticsfrc.com",148],["sinonimos.de",148],["antonimos.de",148],["quesignifi.ca",148],["tiktokrealtime.com",148],["tiktokcounter.net",148],["tpayr.xyz",148],["poqzn.xyz",148],["ashrfd.xyz",148],["rezsx.xyz",148],["tryzt.xyz",148],["ashrff.xyz",148],["rezst.xyz",148],["dawenet.com",148],["erzar.xyz",148],["waezm.xyz",148],["waezg.xyz",148],["blackwoodacademy.org",148],["cryptednews.space",148],["vivuq.com",148],["swgop.com",148],["vbnmll.com",148],["telcoinfo.online",148],["dshytb.com",148],["bitzite.com",149],["coingraph.us",150],["impact24.us",150],["www.apkmoddone.com",151],["sitemini.io.vn",152],["vip1s.top",152],["dl.apkmoddone.com",153],["phongroblox.com",153],["financacerta.com",154],["encurtads.net",154],["shortencash.click",155],["lablue.*",156],["4-liga.com",157],["4fansites.de",157],["4players.de",157],["9monate.de",157],["aachener-nachrichten.de",157],["aachener-zeitung.de",157],["abendblatt.de",157],["abendzeitung-muenchen.de",157],["about-drinks.com",157],["abseits-ka.de",157],["airliners.de",157],["ajaxshowtime.com",157],["allgemeine-zeitung.de",157],["alpin.de",157],["antenne.de",157],["arcor.de",157],["areadvd.de",157],["areamobile.de",157],["ariva.de",157],["astronews.com",157],["aussenwirtschaftslupe.de",157],["auszeit.bio",157],["auto-motor-und-sport.de",157],["auto-service.de",157],["autobild.de",157],["autoextrem.de",157],["autopixx.de",157],["autorevue.at",157],["autotrader.nl",157],["az-online.de",157],["baby-vornamen.de",157],["babyclub.de",157],["bafoeg-aktuell.de",157],["berliner-kurier.de",157],["berliner-zeitung.de",157],["bigfm.de",157],["bikerszene.de",157],["bildderfrau.de",157],["blackd.de",157],["blick.de",157],["boerse-online.de",157],["boerse.de",157],["boersennews.de",157],["braunschweiger-zeitung.de",157],["brieffreunde.de",157],["brigitte.de",157],["buerstaedter-zeitung.de",157],["buffed.de",157],["businessinsider.de",157],["buzzfeed.at",157],["buzzfeed.de",157],["caravaning.de",157],["cavallo.de",157],["chefkoch.de",157],["cinema.de",157],["clever-tanken.de",157],["computerbild.de",157],["computerhilfen.de",157],["comunio-cl.com",157],["comunio.*",157],["connect.de",157],["chip.de",157],["da-imnetz.de",157],["dasgelbeblatt.de",157],["dbna.com",157],["dbna.de",157],["deichstube.de",157],["deine-tierwelt.de",157],["der-betze-brennt.de",157],["derwesten.de",157],["desired.de",157],["dhd24.com",157],["dieblaue24.com",157],["digitalfernsehen.de",157],["dnn.de",157],["donnerwetter.de",157],["e-hausaufgaben.de",157],["e-mountainbike.com",157],["eatsmarter.de",157],["echo-online.de",157],["ecomento.de",157],["einfachschoen.me",157],["elektrobike-online.com",157],["eltern.de",157],["epochtimes.de",157],["essen-und-trinken.de",157],["express.de",157],["extratipp.com",157],["familie.de",157],["fanfiktion.de",157],["fehmarn24.de",157],["fettspielen.de",157],["fid-gesundheitswissen.de",157],["finanzen.*",157],["finanznachrichten.de",157],["finanztreff.de",157],["finya.de",157],["firmenwissen.de",157],["fitforfun.de",157],["fnp.de",157],["football365.fr",157],["formel1.de",157],["fr.de",157],["frankfurter-wochenblatt.de",157],["freenet.de",157],["fremdwort.de",157],["froheweihnachten.info",157],["frustfrei-lernen.de",157],["fuldaerzeitung.de",157],["funandnews.de",157],["fussballdaten.de",157],["futurezone.de",157],["gala.de",157],["gamepro.de",157],["gamersglobal.de",157],["gamesaktuell.de",157],["gamestar.de",157],["gameswelt.*",157],["gamezone.de",157],["gartendialog.de",157],["gartenlexikon.de",157],["gedichte.ws",157],["geissblog.koeln",157],["gelnhaeuser-tageblatt.de",157],["general-anzeiger-bonn.de",157],["geniale-tricks.com",157],["genialetricks.de",157],["gesund-vital.de",157],["gesundheit.de",157],["gevestor.de",157],["gewinnspiele.tv",157],["giessener-allgemeine.de",157],["giessener-anzeiger.de",157],["gifhorner-rundschau.de",157],["giga.de",157],["gipfelbuch.ch",157],["gmuender-tagespost.de",157],["gruenderlexikon.de",157],["gusto.at",157],["gut-erklaert.de",157],["gutfuerdich.co",157],["hallo-muenchen.de",157],["hamburg.de",157],["hanauer.de",157],["hardwareluxx.de",157],["hartziv.org",157],["harzkurier.de",157],["haus-garten-test.de",157],["hausgarten.net",157],["haustec.de",157],["haz.de",157],["heftig.*",157],["heidelberg24.de",157],["heilpraxisnet.de",157],["heise.de",157],["helmstedter-nachrichten.de",157],["hersfelder-zeitung.de",157],["hftg.co",157],["hifi-forum.de",157],["hna.de",157],["hochheimer-zeitung.de",157],["hoerzu.de",157],["hofheimer-zeitung.de",157],["iban-rechner.de",157],["ikz-online.de",157],["immobilienscout24.de",157],["ingame.de",157],["inside-digital.de",157],["inside-handy.de",157],["investor-verlag.de",157],["jappy.com",157],["jpgames.de",157],["kabeleins.de",157],["kachelmannwetter.com",157],["kamelle.de",157],["kicker.de",157],["kindergeld.org",157],["klettern-magazin.de",157],["klettern.de",157],["kochbar.de",157],["kreis-anzeiger.de",157],["kreisbote.de",157],["kreiszeitung.de",157],["ksta.de",157],["kurierverlag.de",157],["lachainemeteo.com",157],["lampertheimer-zeitung.de",157],["landwirt.com",157],["laut.de",157],["lauterbacher-anzeiger.de",157],["leckerschmecker.me",157],["leinetal24.de",157],["lesfoodies.com",157],["levif.be",157],["lifeline.de",157],["liga3-online.de",157],["likemag.com",157],["linux-community.de",157],["linux-magazin.de",157],["live.vodafone.de",157],["ln-online.de",157],["lokalo24.de",157],["lustaufsleben.at",157],["lustich.de",157],["lvz.de",157],["lz.de",157],["mactechnews.de",157],["macwelt.de",157],["macworld.co.uk",157],["mail.de",157],["main-spitze.de",157],["manager-magazin.de",157],["manga-tube.me",157],["mathebibel.de",157],["mathepower.com",157],["maz-online.de",157],["medisite.fr",157],["mehr-tanken.de",157],["mein-kummerkasten.de",157],["mein-mmo.de",157],["mein-wahres-ich.de",157],["meine-anzeigenzeitung.de",157],["meinestadt.de",157],["menshealth.de",157],["mercato365.com",157],["merkur.de",157],["messen.de",157],["metal-hammer.de",157],["metalflirt.de",157],["meteologix.com",157],["minecraft-serverlist.net",157],["mittelbayerische.de",157],["modhoster.de",157],["moin.de",157],["mopo.de",157],["morgenpost.de",157],["motor-talk.de",157],["motorbasar.de",157],["motorradonline.de",157],["motorsport-total.com",157],["motortests.de",157],["mountainbike-magazin.de",157],["moviejones.de",157],["moviepilot.de",157],["mt.de",157],["mtb-news.de",157],["musiker-board.de",157],["musikexpress.de",157],["musikradar.de",157],["mz-web.de",157],["n-tv.de",157],["naumburger-tageblatt.de",157],["netzwelt.de",157],["neuepresse.de",157],["neueroeffnung.info",157],["news.at",157],["news.de",157],["news38.de",157],["newsbreak24.de",157],["nickles.de",157],["nicknight.de",157],["nl.hardware.info",157],["nn.de",157],["nnn.de",157],["nordbayern.de",157],["notebookchat.com",157],["notebookcheck-ru.com",157],["notebookcheck-tr.com",157],["notebookcheck.*",157],["noz-cdn.de",157],["noz.de",157],["nrz.de",157],["nw.de",157],["nwzonline.de",157],["oberhessische-zeitung.de",157],["och.to",157],["oeffentlicher-dienst.info",157],["onlinekosten.de",157],["onvista.de",157],["op-marburg.de",157],["op-online.de",157],["outdoor-magazin.com",157],["outdoorchannel.de",157],["paradisi.de",157],["pc-magazin.de",157],["pcgames.de",157],["pcgameshardware.de",157],["pcwelt.de",157],["pcworld.es",157],["peiner-nachrichten.de",157],["pferde.de",157],["pietsmiet.de",157],["pixelio.de",157],["pkw-forum.de",157],["playboy.de",157],["playfront.de",157],["pnn.de",157],["pons.com",157],["prignitzer.de",157],["profil.at",157],["promipool.de",157],["promobil.de",157],["prosiebenmaxx.de",157],["psychic.de",[157,175]],["quoka.de",157],["radio.at",157],["radio.de",157],["radio.dk",157],["radio.es",157],["radio.fr",157],["radio.it",157],["radio.net",157],["radio.pl",157],["radio.pt",157],["radio.se",157],["ran.de",157],["readmore.de",157],["rechtslupe.de",157],["recording.de",157],["rennrad-news.de",157],["reuters.com",157],["reviersport.de",157],["rhein-main-presse.de",157],["rheinische-anzeigenblaetter.de",157],["rimondo.com",157],["roadbike.de",157],["roemische-zahlen.net",157],["rollingstone.de",157],["rot-blau.com",157],["rp-online.de",157],["rtl.de",[157,252]],["rtv.de",157],["rugby365.fr",157],["ruhr24.de",157],["rundschau-online.de",157],["runnersworld.de",157],["safelist.eu",157],["salzgitter-zeitung.de",157],["sat1.de",157],["sat1gold.de",157],["schoener-wohnen.de",157],["schwaebische-post.de",157],["schwarzwaelder-bote.de",157],["serienjunkies.de",157],["shz.de",157],["sixx.de",157],["skodacommunity.de",157],["smart-wohnen.net",157],["sn.at",157],["sozialversicherung-kompetent.de",157],["spiegel.de",157],["spielen.de",157],["spieletipps.de",157],["spielfilm.de",157],["sport.de",157],["sport1.de",157],["sport365.fr",157],["sportal.de",157],["spox.com",157],["stern.de",157],["stuttgarter-nachrichten.de",157],["stuttgarter-zeitung.de",157],["sueddeutsche.de",157],["svz.de",157],["szene1.at",157],["szene38.de",157],["t-online.de",157],["tagesspiegel.de",157],["taschenhirn.de",157],["techadvisor.co.uk",157],["techstage.de",157],["tele5.de",157],["teltarif.de",157],["testedich.*",157],["the-voice-of-germany.de",157],["thueringen24.de",157],["tichyseinblick.de",157],["tierfreund.co",157],["tiervermittlung.de",157],["torgranate.de",157],["transfermarkt.*",157],["trend.at",157],["truckscout24.*",157],["tv-media.at",157],["tvdigital.de",157],["tvinfo.de",157],["tvspielfilm.de",157],["tvtoday.de",157],["tvtv.*",157],["tz.de",[157,171]],["unicum.de",157],["unnuetzes.com",157],["unsere-helden.com",157],["unterhalt.net",157],["usinger-anzeiger.de",157],["usp-forum.de",157],["videogameszone.de",157],["vienna.at",157],["vip.de",157],["virtualnights.com",157],["vox.de",157],["wa.de",157],["wallstreet-online.de",[157,160]],["waz.de",157],["weather.us",157],["webfail.com",157],["weihnachten.me",157],["weihnachts-bilder.org",157],["weihnachts-filme.com",157],["welt.de",157],["weltfussball.at",157],["weristdeinfreund.de",157],["werkzeug-news.de",157],["werra-rundschau.de",157],["wetterauer-zeitung.de",157],["wetteronline.*",157],["wieistmeineip.*",157],["wiesbadener-kurier.de",157],["wiesbadener-tagblatt.de",157],["winboard.org",157],["windows-7-forum.net",157],["winfuture.de",[157,167]],["wintotal.de",157],["wlz-online.de",157],["wn.de",157],["wohngeld.org",157],["wolfenbuetteler-zeitung.de",157],["wolfsburger-nachrichten.de",157],["woman.at",157],["womenshealth.de",157],["wormser-zeitung.de",157],["woxikon.de",157],["wp.de",157],["wr.de",157],["wunderweib.de",157],["yachtrevue.at",157],["ze.tt",157],["zeit.de",157],["lecker.de",157],["meineorte.com",158],["osthessen-news.de",158],["techadvisor.com",158],["focus.de",158],["wetter.*",159],["deinesexfilme.com",161],["einfachtitten.com",161],["lesbenhd.com",161],["milffabrik.com",[161,222]],["porn-monkey.com",161],["porndrake.com",161],["pornhubdeutsch.net",161],["pornoaffe.com",161],["pornodavid.com",161],["pornoente.tv",[161,222]],["pornofisch.com",161],["pornofelix.com",161],["pornohammer.com",161],["pornohelm.com",161],["pornoklinge.com",161],["pornotom.com",[161,222]],["pornotommy.com",161],["pornovideos-hd.com",161],["pornozebra.com",[161,222]],["xhamsterdeutsch.xyz",161],["xnxx-sexfilme.com",161],["nu6i-bg-net.com",163],["khsm.io",163],["webcreator-journal.com",163],["msdos-games.com",163],["blocklayer.com",163],["weknowconquer.com",163],["giff.cloud",163],["aquarius-horoscopes.com",164],["cancer-horoscopes.com",164],["dubipc.blogspot.com",164],["echoes.gr",164],["engel-horoskop.de",164],["freegames44.com",164],["fuerzasarmadas.eu",164],["gemini-horoscopes.com",164],["jurukunci.net",164],["krebs-horoskop.com",164],["leo-horoscopes.com",164],["maliekrani.com",164],["nklinks.click",164],["ourenseando.es",164],["pisces-horoscopes.com",164],["radio-en-direct.fr",164],["sagittarius-horoscopes.com",164],["scorpio-horoscopes.com",164],["singlehoroskop-loewe.de",164],["skat-karten.de",164],["skorpion-horoskop.com",164],["taurus-horoscopes.com",164],["the1security.com",164],["virgo-horoscopes.com",164],["zonamarela.blogspot.com",164],["yoima.hatenadiary.com",164],["kaystls.site",165],["ftuapps.dev",166],["studydhaba.com",166],["freecourse.tech",166],["victor-mochere.com",166],["papunika.com",166],["mobilanyheter.net",166],["prajwaldesai.com",[166,241]],["carscoops.com",167],["dziennik.pl",167],["eurointegration.com.ua",167],["flatpanelshd.com",167],["footballtransfer.com.ua",167],["footballtransfer.ru",167],["hoyme.jp",167],["issuya.com",167],["itainews.com",167],["iusm.co.kr",167],["logicieleducatif.fr",167],["mynet.com",[167,190]],["onlinegdb.com",167],["picrew.me",167],["pravda.com.ua",167],["reportera.co.kr",167],["sportanalytic.com",167],["sportsrec.com",167],["sportsseoul.com",167],["text-compare.com",167],["tweaksforgeeks.com",167],["wfmz.com",167],["worldhistory.org",167],["palabr.as",167],["motscroises.fr",167],["cruciverba.it",167],["w.grapps.me",167],["gazetaprawna.pl",167],["pressian.com",167],["raenonx.cc",[167,267]],["indiatimes.com",167],["missyusa.com",167],["aikatu.jp",167],["ark-unity.com",167],["cool-style.com.tw",167],["doanhnghiepvn.vn",167],["mykhel.com",167],["automobile-catalog.com",168],["motorbikecatalog.com",168],["maketecheasier.com",168],["mlbpark.donga.com",169],["jjang0u.com",170],["download.kingtecnologia.com",172],["daemonanime.net",173],["bgmateriali.com",173],["daemon-hentai.com",174],["forumdz.com",175],["abandonmail.com",175],["flmods.com",175],["zilinak.sk",175],["hotdesimms.com",175],["pdfaid.com",175],["bootdey.com",175],["mail.com",175],["expresskaszubski.pl",175],["moegirl.org.cn",175],["flix-wave.lol",175],["fmovies0.cc",175],["worthcrete.com",175],["infomatricula.pt",175],["my-code4you.blogspot.com",176],["vrcmods.com",177],["osuskinner.com",177],["osuskins.net",177],["pentruea.com",178],["mchacks.net",179],["why-tech.it",180],["compsmag.com",181],["tapetus.pl",182],["autoroad.cz",183],["brawlhalla.fr",183],["tecnobillo.com",183],["pokemon-project.com",183],["sexcamfreeporn.com",184],["breatheheavy.com",185],["wenxuecity.com",186],["key-hub.eu",187],["fabioambrosi.it",188],["tattle.life",189],["emuenzen.de",189],["terrylove.com",189],["cidade.iol.pt",191],["fantacalcio.it",192],["hentaifreak.org",193],["hypebeast.com",194],["krankheiten-simulieren.de",195],["catholic.com",196],["techinferno.com",197],["ibeconomist.com",198],["bookriot.com",199],["purposegames.com",200],["globo.com",201],["latimes.com",201],["claimrbx.gg",202],["perelki.net",203],["vpn-anbieter-vergleich-test.de",204],["livingincebuforums.com",205],["paperzonevn.com",206],["alltechnerd.com",207],["malaysianwireless.com",208],["erinsakura.com",209],["infofuge.com",209],["freejav.guru",209],["novelmultiverse.com",209],["fritidsmarkedet.dk",210],["maskinbladet.dk",210],["15min.lt",211],["baddiehub.com",212],["mr9soft.com",213],["21porno.com",214],["adult-sex-gamess.com",215],["hentaigames.app",215],["mobilesexgamesx.com",215],["mysexgamer.com",215],["porngameshd.com",215],["sexgamescc.com",215],["xnxx-sex-videos.com",215],["f2movies.to",216],["freeporncave.com",217],["tubsxxx.com",218],["manga18fx.com",219],["freebnbcoin.com",219],["sextvx.com",220],["muztext.com",221],["pornohans.com",222],["nursexfilme.com",222],["pornohirsch.net",222],["xhamster-sexvideos.com",222],["pornoschlange.com",222],["xhamsterdeutsch.*",222],["hdpornos.net",222],["gutesexfilme.com",222],["zona-leros.com",222],["charbelnemnom.com",223],["simplebits.io",224],["online-fix.me",225],["privatemoviez.*",226],["gamersdiscussionhub.com",226],["elahmad.com",227],["owlzo.com",228],["q1003.com",229],["blogpascher.com",230],["testserver.pro",231],["lifestyle.bg",231],["money.bg",231],["news.bg",231],["topsport.bg",231],["webcafe.bg",231],["schoolcheats.net",232],["mgnet.xyz",233],["advertiserandtimes.co.uk",234],["111.90.159.132",235],["techsolveprac.com",236],["joomlabeginner.com",237],["askpaccosi.com",238],["largescaleforums.com",239],["dubznetwork.com",240],["dongknows.com",242],["traderepublic.community",243],["babia.to",244],["html5.gamemonetize.co",245],["code2care.org",246],["gmx.*",247],["yts-subs.net",248],["dlhd.sx",248],["xxxxsx.com",249],["ngontinh24.com",250],["idevicecentral.com",251],["mangacrab.com",253],["hortonanderfarom.blogspot.com",254],["viefaucet.com",255],["pourcesoir.in",255],["cloud-computing-central.com",256],["afk.guide",257],["businessnamegenerator.com",258],["derstandard.at",259],["derstandard.de",259],["rocketnews24.com",260],["soranews24.com",260],["youpouch.com",260],["gourmetscans.net",261],["ilsole24ore.com",262],["ipacrack.com",263],["infokik.com",264],["porhubvideo.com",266],["webseriessex.com",266],["panuvideo.com",266],["pornktubes.net",266],["deezer.com",267],["fosslinux.com",268],["shrdsk.me",269],["examword.com",270],["sempreupdate.com.br",270],["tribuna.com",271],["trendsderzukunft.de",272],["gal-dem.com",272],["lostineu.eu",272],["oggitreviso.it",272],["speisekarte.de",272],["mixed.de",272],["lightnovelspot.com",[273,274]],["novelpub.com",[273,274]],["webnovelpub.com",[273,274]],["hwzone.co.il",276],["nammakalvi.com",277],["igay69.com",277],["c2g.at",278],["terafly.me",278],["elamigos-games.com",278],["elamigos-games.net",278],["elamigosgames.org",278],["dktechnicalmate.com",279],["recipahi.com",279],["vpntester.org",280],["japscan.lol",281],["digitask.ru",282],["tempumail.com",283],["sexvideos.host",284],["camcaps.*",285],["10alert.com",286],["cryptstream.de",287],["nydus.org",287],["techhelpbd.com",288],["fapdrop.com",289],["cellmapper.net",290],["hdrez.com",291],["youwatch-serie.com",291],["russland.jetzt",291],["printablecreative.com",292],["peachprintable.com",292],["comohoy.com",293],["leak.sx",293],["paste.bin.sx",293],["pornleaks.in",293],["merlininkazani.com",293],["j91.asia",294],["rekidai-info.github.io",295],["jeniusplay.com",296],["indianyug.com",297],["rgb.vn",297],["needrom.com",298],["criptologico.com",299],["megadrive-emulator.com",300],["eromanga-show.com",301],["hentai-one.com",301],["hentaipaw.com",301],["10minuteemails.com",302],["luxusmail.org",302],["w3cub.com",303],["bangpremier.com",304],["nyaa.iss.ink",305],["drivebot.*",306],["thenextplanet1.*",307],["tnp98.xyz",307],["techedubyte.com",309],["tickzoo.tv",310],["oploverz.*",310],["memedroid.com",311],["karaoketexty.cz",312],["filmizlehdfilm.com",313],["filmizletv.*",313],["fullfilmizle.cc",313],["gofilmizle.net",313],["resortcams.com",314],["cheatography.com",314],["sonixgvn.net",315],["autoscout24.*",316],["mjakmama24.pl",317],["cheatermad.com",318],["work.ink",319],["ville-ideale.fr",320],["brainly.*",321],["eodev.com",321],["xfreehd.com",322],["freethesaurus.com",323],["thefreedictionary.com",323],["fm-arena.com",324],["tradersunion.com",325],["tandess.com",326],["allosurf.net",326],["spontacts.com",327],["dankmemer.lol",328],["getexploits.com",329],["fplstatistics.com",330],["breitbart.com",331],["salidzini.lv",332],["cryptorank.io",[333,334]],["4kwebplay.xyz",335],["qqwebplay.xyz",335],["molbiotools.com",336],["vods.tv",337],["18xxx.xyz",[338,370]],["raidrush.net",339],["xnxxcom.xyz",340],["videzz.net",341],["spambox.xyz",342],["dreamdth.com",343],["freemodsapp.in",343],["onlytech.com",343],["player.jeansaispasplus.homes",344],["en-thunderscans.com",345],["infinityscans.xyz",346],["infinityscans.net",346],["infinityscans.org",346],["iqksisgw.xyz",347],["caroloportunidades.com.br",348],["coempregos.com.br",348],["foodiesgallery.com",348],["vikatan.com",349],["camhub.world",350],["mma-core.*",351],["pouvideo.*",352],["povvideo.*",352],["povw1deo.*",352],["povwideo.*",352],["powv1deo.*",352],["powvibeo.*",352],["powvideo.*",352],["powvldeo.*",352],["teracourses.com",353],["servustv.com",[354,355]],["freevipservers.net",356],["streambtw.com",357],["qrcodemonkey.net",358],["streamup.ws",359],["tv-films.co.uk",360],["cool--web-de.translate.goog",[361,362]],["gps--cache-de.translate.goog",[361,362]],["web--spiele-de.translate.goog",[361,362]],["fun--seiten-de.translate.goog",[361,362]],["photo--alben-de.translate.goog",[361,362]],["wetter--vorhersage-de.translate.goog",[361,362]],["coolsoftware-de.translate.goog",[361,362]],["kryptografie-de.translate.goog",[361,362]],["cool--domains-de.translate.goog",[361,362]],["net--tours-de.translate.goog",[361,362]],["such--maschine-de.translate.goog",[361,362]],["qul-de.translate.goog",[361,362]],["mailtool-de.translate.goog",[361,362]],["c--ix-de.translate.goog",[361,362]],["softwareengineer-de.translate.goog",[361,362]],["net--tools-de.translate.goog",[361,362]],["hilfen-de.translate.goog",[361,362]],["45er-de.translate.goog",[361,362]],["cooldns-de.translate.goog",[361,362]],["hardware--entwicklung-de.translate.goog",[361,362]],["bgsi.gg",363],["friv.com",364],["tdtnews.com",365],["santafenewmexican.com",365],["sextb.*>>",366],["nepalieducate.com",367],["freegames.com",368],["levante-emv.com",369],["mallorcazeitung.es",369],["regio7.cat",369],["superdeporte.es",369],["laopiniondezamora.es",369],["laopiniondemurcia.es",369],["laopiniondemalaga.es",369],["laopinioncoruna.es",369],["lacronicabadajoz.com",369],["informacion.es",369],["farodevigo.es",369],["emporda.info",369],["elperiodicomediterraneo.com",369],["elperiodicoextremadura.com",369],["epe.es",369],["elperiodicodearagon.com",369],["eldia.es",369],["elcorreoweb.es",369],["diariodemallorca.es",369],["diariodeibiza.es",369],["diariocordoba.com",369],["diaridegirona.cat",369],["elperiodico.com",369],["laprovincia.es",369],["4tube.live",370],["nxxn.live",370],["redtub.live",370]]);
const exceptionsMap = new Map([["vvid30c.*",[135]]]);
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
