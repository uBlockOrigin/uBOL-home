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
const argsList = [["=document[_0x"],["/&&\\s*[A-Z]{4,}\\(\\)/"],["/\\(\\s*[\\s$0-9A-Z_a-z]*\\)\\s*=>|^\\s*function\\s*\\(\\s*[\\s$0-9A-Z_a-z]*\\)\\s*\\{.{10,100}/","1000"],["]();}","500"],[")](this,...","3000-6000"],["(new Error(","3000-6000"],[".offsetHeight>0"],["adblock"],["/mylovelyobj|amzn_aps_csm|\\'\\/hello\\'|YW16bl9hcHNfY3Nt|cmVwb3J0RXJyb3Jz|L3ZlcnktcGxlYXNl|getAdnginName|hasOwnProperty|location/"],["googleFC"],["adb"],["adBlockerDetected"],["show"],["InfMediafireMobileFunc","1000"],["google_jobrunner"],["admc"],["apstagLOADED"],["/Adb|moneyDetect/"],["disableDeveloper"],["Blocco","2000"],["test","0"],["checkAdblockUser","1000"],["checkPub","6000"],["'0x"],["document.querySelector","5000"],["nextFunction","250"],["backRedirect"],["document.querySelectorAll","1000"],["style"],["clientHeight"],["addEventListener","0"],["adblock","2000"],["nextFunction","2000"],["byepopup","5000"],["additional_src","300"],["()","2000"],["css_class.show"],["CANG","3000"],["updato-overlay","500"],["innerText","2000"],["alert","8000"],["css_class"],["()","50"],["debugger"],["initializeCourier","3000"],["redirectPage"],["_0x","2000"],["ads","750"],["location.href","500"],["Adblock","5000"],["disable","200"],["CekAab","0"],["rbm_block_active","1000"],["show()"],["_0x"],["n.trigger","1"],["abDetected"],["$"],["KeepOpeningPops","1000"],["location.href"],["adb","0"],["adBlocked"],["warning","100"],["adsbygoogle"],["adblock_popup","500"],["Adblock"],["location.href","10000"],["keep-ads","2000"],["#rbm_block_active","1000"],["null","4000"],["()","2500"],["myaabpfun","3000"],["adFilled","2500"],["()","15000"],["showPopup"],["adrecover"],["()","1000"],["document.cookie","2500"],["window.open"],["innerHTML"],["readyplayer","2000"],["/innerHTML|AdBlock/"],["checkStopBlock"],["adspot_top","1500"],["/offsetHeight|google|Global/"],["an_message","500"],["Adblocker","10000"],["timeoutChecker"],["bait","1"],["ai_adb"],["displayCookieWallBanner"],["pum-open"],["overlay","2000"],["/adblock/i"],["Math.round","1000"],["adblock","5"],["ag_adBlockerDetected"],["null"],["adb","6000"],["sadbl"],["brave_load_popup"],["adsbytrafficjunkycontext"],["ipod"],["offsetWidth"],["/$|adBlock/"],["()"],["AdBlock"],["stop-scrolling"],["Adv"],["blockUI","2000"],["mdpDeBlocker"],["/_0x|debug/"],["/ai_adb|_0x/"],["adBlock"],["","1"],["undefined"],["check","1"],["adsBlocked"],["nextFunction"],["blocker"],["afs_ads","2000"],["bait"],["getComputedStyle","250"],["blocked"],["{r()","0"],["nextFunction","450"],["Debug"],["r()","0"],["test","100"],["purple_box"],["checkSiteNormalLoad"],["0x"],["adBlockOverlay"],["Detected","500"],["mdp"],["modal"],[".show","1000"],["afterOpen"],[".show"],["showModal"],["blur"],["samOverlay"],["native"],["bADBlock"],["location"],["alert"],["t()","0"],["ads"],["alert","2000"],["/adblock|isRequestPresent/"],["documentElement.innerHTML"],["_0x","500"],["isRequestPresent"],["checkAdblock"],["1e3*"],["","2000"],["/^/","1000"],["checkAdBlock"],["displayAdBlockerMessage"],["push","500"],[".call(null)","10"],[".call(null)"],["(null)","10"],["userHasAdblocker"],["/loadMomoVip|loadExo|includeSpecial/"],["appendChild"],["affiliate"],["getComputedStyle"],["displayMessage","2000"],["AdDetect"],["ai_"],["error-report.com"],["loader.min.js"],["content-loader.com"],["()=>","5000"],["[native code]","500"],["consent"],["await _0x"],["adbl"],["openPopunder"],["offsetHeight"],["offsetLeft"],["height"],["charAt"],["checkAds"],["fadeIn","0"],["jQuery"],["/^/"],["check"],["eabdModal"],["ab_root.show"],["gaData"],["ad"],["prompt","1000"],["googlefc"],["adblock detection"],[".offsetHeight","100"],["popState"],["ad-block-popup"],["exitTimer"],["innerHTML.replace"],["eabpDialog"],["adsense"],["/Adblock|_ad_/"],["googletag"],["f.parentNode.removeChild(f)","100"],["swal","500"],["keepChecking","1000"],["openPopup"],[".offsetHeight"],["()=>{"],["nitroAds"],["class.scroll","1000"],["disableDeveloperTools"],["Check"],["insertBefore"],["css_class.scroll"],["/null|Error/","10000"],["/out.php"],["/0x|devtools/"],["location.replace","300"],["window.location.href"],["fetch"],["window.location.href=link"],["reachGoal"],["Adb"],["ai"],["","3000"],["/width|innerHTML/"],["magnificPopup"],["/debugger|offsetParent/"],["adblockEnabled"],["google_ad"],["document.location"],["google"],["answers"],["top-right","2000"],["enforceAdStatus"],["display","5000"],["eb"],["/adb/i"],[").show()"],["","1000"],["site-access"],["/Ads|adbl|offsetHeight/"],["/show|innerHTML/"],["/show|document\\.createElement/"],["MobileInGameGames"],["Msg"],["UABP"],["()","150"],["href"],["aaaaa-modal"],["()=>"],["null","10"],["","500"],["pop"],["/adbl/i"],["-0x"],["display"],["gclid"],["event","3000"],["rejectWith"],[".data?"],["refresh"],["location.href","3000"],["ga"],["keepChecking"],["myTestAd"],["click"],["Ads"],["ShowAdBLockerNotice"],["ad_listener"],["open"],["(!0)"],["Delay"],["/appendChild|e\\(\"/"],["=>"],["site-access-popup"],["data?"],["checkAdblockUser"],["offsetHeight","100"],["/salesPopup|mira-snackbar/"],["detectImgLoad"],["offsetHeight","200"],["detector"],["replace"],["touchstart"],["siteAccessFlag"],["ab"],["/adblocker|alert/"],["redURL"],["/children\\('ins'\\)|Adblock|adsbygoogle/"],["displayMessage"],["chkADB"],["onDetected"],["fuckadb"],["detect"],["siteAccessPopup"],["/adsbygoogle|adblock|innerHTML|setTimeout/"],["akadb"],["biteDisplay"],["/[a-z]\\(!0\\)/","800"],["ad_block"],["/detectAdBlocker|window.open/"],["adBlockDetected"],["popUnder"],["/GoToURL|delay/"],["window.location.href","300"],["/location.href|location = atob/"],[".redirect"],["/AdBlock/i"],["popup"],["/adScriptPath|MMDConfig/"],["/native|\\{n\\(\\)/"],["psresimler"],["adblocker"],["EzoIvent"],["/Detect|adblock|style\\.display|\\[native code]|\\.call\\(null\\)/"],["removeChild"],["offset"],["","2000-5000"],["contrformpub"],["trigger","0"],["ADB"],["/\\.append|\\.innerHTML|undefined|\\.css|blocker|flex|\\$\\('|obfuscatedMsg/"],["warn"],["getComputedStyle","2000"],["video-popup"],["detectAdblock"],["detectAdBlocker"],["nads"],["current.children"],["adStatus"],["BN_CAMPAIGNS"],["media_place_list"],["...","300"],["/\\{[a-z]\\(!0\\)\\}/"],["stackTrace"],["inner-ad"],["_ET"],[".clientHeight"],["getComputedStyle(el)"],["location.replace"],["console.clear"],["ad_block_detector"],["document.createElement"],["getComputedStyle(testAd)"],[".adv-"],["document['\\x"],["hasAdblock"],["/adblock|isblock/i"],["visibility","2000"],["displayAdBlockedVideo"],["test.remove","100"],["adBlockerModal"],["","10000-15000"],["adex"],["length"],["atob","120000"],["#ad_blocker_detector"],["push"],["AdBlocker"],["wbDeadHinweis"],["","10000"],["fired"],["mode:\"no-cors\""],["Visibility"],["TNCMS.DMP"],["ast"],["googlesyndication"],["moneyDetect"],["sub"],["/createElement|addEventListener|clientHeight/"],["testAd"]];
const hostnamesMap = new Map([["japscan.*",[0,1,2]],["poophq.com",3],["veev.to",3],["dogdrip.net",4],["infinityfree.com",4],["smsonline.cloud",[4,5]],["faqwiki.us",6],["mail.yahoo.com",[7,324]],["maxcheaters.com",7],["postimees.ee",7],["police.community",7],["gisarea.com",7],["schaken-mods.com",7],["tvnet.lv",7],["theclashify.com",7],["txori.com",7],["olarila.com",7],["deletedspeedstreams.blogspot.com",7],["schooltravelorganiser.com",7],["xhardhempus.net",7],["mhn.quest",7],["leagueofgraphs.com",7],["hieunguyenphoto.com",7],["benzinpreis.de",7],["client.falixnodes.net",[8,309]],["lastampa.it",9],["m.timesofindia.com",10],["timesofindia.indiatimes.com",10],["youmath.it",10],["redensarten-index.de",10],["lesoir.be",10],["electriciansforums.net",10],["keralatelecom.info",10],["universegunz.net",10],["happypenguin.altervista.org",10],["everyeye.it",10],["eztv.*",10],["bluedrake42.com",10],["supermarioemulator.com",10],["futbollibrehd.com",10],["eska.pl",10],["eskarock.pl",10],["voxfm.pl",10],["mathaeser.de",10],["betaseries.com",10],["free-sms-receive.com",10],["sms-receive-online.com",10],["computer76.ru",10],["golem.de",[11,12,160]],["hdbox.ws",12],["todopolicia.com",12],["scat.gold",12],["freecoursesite.com",12],["windowcleaningforums.co.uk",12],["cruisingearth.com",12],["hobby-machinist.com",12],["freegogpcgames.com",12],["latitude.to",12],["kitchennovel.com",12],["w3layouts.com",12],["blog.receivefreesms.co.uk",12],["eductin.com",12],["dealsfinders.blog",12],["audiobooks4soul.com",12],["downloadr.in",12],["topcomicporno.com",12],["sushi-scan.*",12],["celtadigital.com",12],["iptvrun.com",12],["adsup.lk",12],["cryptomonitor.in",12],["areatopik.com",12],["cardscanner.co",12],["nullforums.net",12],["courseclub.me",12],["tamarindoyam.com",12],["jeep-cj.com",12],["choiceofmods.com",12],["myqqjd.com",12],["ssdtop.com",12],["apkhex.com",12],["gezegenforum.com",12],["iptvapps.net",12],["null-scripts.net",12],["nullscripts.net",12],["bloground.ro",12],["witcherhour.com",12],["ottverse.com",12],["torrentmac.net",12],["mazakony.com",12],["laptechinfo.com",12],["mc-at.org",12],["playstationhaber.com",12],["seriesperu.com",12],["spigotunlocked.*",12],["pesprofessionals.com",12],["wpsimplehacks.com",12],["sportshub.to",[12,267]],["topsporter.net",[12,267]],["darkwanderer.net",12],["truckingboards.com",12],["coldfrm.org",12],["azrom.net",12],["freepatternsarea.com",12],["alttyab.net",12],["ahmedmode.*",12],["esopress.com",12],["nesiaku.my.id",12],["jipinsoft.com",12],["truthnews.de",12],["farsinama.com",12],["worldofiptv.com",12],["vuinsider.com",12],["crazydl.net",12],["gamemodsbase.com",12],["babiato.tech",12],["secuhex.com",12],["turkishaudiocenter.com",12],["galaxyos.net",12],["bizdustry.com",12],["storefront.com.ng",12],["pkbiosfix.com",12],["casi3.xyz",12],["forum-xiaomi.com",12],["mediafire.com",13],["wcoanimedub.tv",14],["wcoforever.net",14],["openspeedtest.com",14],["addtobucketlist.com",14],["3dzip.org",[14,69]],["ilmeteo.it",14],["wcoforever.com",14],["comprovendolibri.it",14],["healthelia.com",14],["yts.*",15],["720pstream.*",15],["1stream.*",15],["seattletimes.com",16],["bestgames.com",17],["yiv.com",17],["globalrph.com",18],["e-glossa.it",19],["webcheats.com.br",20],["urlcero.*",21],["gala.fr",22],["gentside.com",22],["geo.fr",22],["hbrfrance.fr",22],["nationalgeographic.fr",22],["ohmymag.com",22],["serengo.net",22],["vsd.fr",22],["short.pe",23],["thefmovies.*",23],["footystreams.net",23],["katestube.com",23],["updato.com",[24,38]],["totaldebrid.*",25],["sandrives.*",25],["daizurin.com",25],["pendekarsubs.us",25],["dreamfancy.org",25],["rysafe.blogspot.com",25],["techacode.com",25],["toppng.com",25],["th-world.com",25],["avjamack.com",25],["avjamak.net",25],["cnnamador.com",26],["nudecelebforum.com",27],["pronpic.org",28],["thewebflash.com",29],["discordfastfood.com",29],["xup.in",29],["popularmechanics.com",30],["op.gg",31],["comunidadgzone.es",32],["fxporn69.*",32],["mp3fy.com",32],["lebensmittelpraxis.de",32],["aliancapes.*",32],["forum-pokemon-go.fr",32],["praxis-jugendarbeit.de",32],["dictionnaire-medical.net",32],["cle0desktop.blogspot.com",32],["up-load.io",32],["keysbrasil.blogspot.com",32],["hotpress.info",32],["turkleech.com",32],["anibatch.me",32],["anime-i.com",32],["gewinde-normen.de",32],["tucinehd.com",32],["kdramasmaza.com.pk",32],["jellynote.com",33],["eporner.com",34],["pornbimbo.com",35],["4j.com",35],["avoiderrors.com",36],["sitarchive.com",36],["livenewsof.com",36],["topnewsshow.com",36],["gatcha.org",36],["kusonime.com",36],["suicidepics.com",36],["codesnail.com",36],["codingshiksha.com",36],["graphicux.com",36],["citychilli.com",36],["talkjarvis.com",36],["hdmotori.it",37],["tubsexer.*",39],["femdomtb.com",39],["porno-tour.*",39],["lenkino.*",39],["bobs-tube.com",39],["pornfd.com",39],["pornomoll.*",39],["camsclips.*",39],["popno-tour.net",39],["watchmdh.to",39],["camwhores.tv",39],["camhub.cc",39],["elfqrin.com",40],["satcesc.com",41],["apfelpatient.de",41],["lusthero.com",42],["m4ufree.*",43],["m2list.com",43],["embed.nana2play.com",43],["dallasnews.com",44],["lnk.news",45],["lnk.parts",45],["efukt.com",46],["wendycode.com",46],["springfieldspringfield.co.uk",47],["porndoe.com",48],["smsget.net",[49,50]],["kjanime.net",51],["gioialive.it",52],["classicreload.com",53],["scriptzhub.com",53],["hotpornfile.org",54],["coolsoft.altervista.org",54],["hackedonlinegames.com",54],["dailytech-news.eu",54],["settlersonlinemaps.com",54],["ad-doge.com",54],["magdownload.org",54],["kpkuang.org",54],["crypto4yu.com",54],["writedroid.*",54],["thenightwithoutthedawn.blogspot.com",54],["claimlite.club",54],["newscon.org",54],["rl6mans.com",54],["chicoer.com",55],["bostonherald.com",55],["dailycamera.com",55],["sportsplays.com",56],["ebookdz.com",57],["telerium.*",58],["pornvideotop.com",59],["arolinks.com",59],["xstory-fr.com",59],["1337x.*",59],["x1337x.*",59],["1337x.ninjaproxy1.com",59],["ytapi.cc",59],["letribunaldunet.fr",60],["vladan.fr",60],["live-tv-channels.org",61],["eslfast.com",62],["ge-map-overlays.appspot.com",63],["mad4wheels.com",63],["1xanimes.in",63],["logi.im",63],["emailnator.com",63],["freegamescasual.com",64],["tcpvpn.com",65],["oko.sh",65],["timesnownews.com",65],["timesnowhindi.com",65],["timesnowmarathi.com",65],["zoomtventertainment.com",65],["tsubasa.im",66],["sholah.net",67],["2rdroid.com",67],["bisceglielive.it",68],["pandajogosgratis.com.br",70],["5278.cc",71],["pandafreegames.*",72],["tonspion.de",73],["duplichecker.com",74],["plagiarismchecker.co",74],["plagiarismdetector.net",74],["searchenginereports.net",74],["smallseotools.com",75],["linkspaid.com",76],["proxydocker.com",76],["beeimg.com",[77,78]],["emturbovid.com",78],["findjav.com",78],["javggvideo.xyz",78],["mmtv01.xyz",78],["stbturbo.xyz",78],["trailerhg.xyz",78],["turboplayers.xyz",78],["turbovidhls.com",78],["viralharami.com",78],["ftlauderdalebeachcam.com",79],["ftlauderdalewebcam.com",79],["juneauharborwebcam.com",79],["keywestharborwebcam.com",79],["kittycatcam.com",79],["mahobeachcam.com",79],["miamiairportcam.com",79],["morganhillwebcam.com",79],["njwildlifecam.com",79],["nyharborwebcam.com",79],["paradiseislandcam.com",79],["pompanobeachcam.com",79],["portbermudawebcam.com",79],["portcanaveralwebcam.com",79],["portevergladeswebcam.com",79],["portmiamiwebcam.com",79],["portnywebcam.com",79],["portnassauwebcam.com",79],["portstmaartenwebcam.com",79],["portstthomaswebcam.com",79],["porttampawebcam.com",79],["sxmislandcam.com",79],["themes-dl.com",79],["badassdownloader.com",79],["badasshardcore.com",79],["badassoftcore.com",79],["nulljungle.com",79],["teevee.asia",79],["otakukan.com",79],["thoptv.*",80],["gearingcommander.com",81],["generate.plus",82],["calculate.plus",82],["avcesar.com",83],["audiotag.info",84],["tudigitale.it",85],["ibcomputing.com",86],["legia.net",87],["acapellas4u.co.uk",88],["robloxscripts.com",89],["libreriamo.it",89],["postazap.com",89],["filmyzones.com",89],["medebooks.xyz",89],["mashtips.com",89],["marriedgames.com.br",89],["4allprograms.me",89],["shortzzy.*",89],["nurgsm.com",89],["plugincrack.com",89],["gamingdeputy.com",89],["freewebcart.com",89],["gamekult.com",90],["streamhentaimovies.com",91],["konten.co.id",92],["diariodenavarra.es",93],["scripai.com",93],["myfxbook.com",93],["whatfontis.com",93],["tubereader.me",93],["optifine.net",94],["luzernerzeitung.ch",95],["tagblatt.ch",95],["ableitungsrechner.net",96],["alternet.org",97],["gourmetsupremacy.com",97],["shrib.com",98],["streameast.*",99],["thestreameast.*",99],["techclips.net",99],["daddylivehd.*",99],["footyhunter.lol",99],["wecast.to",99],["freecourseweb.com",100],["coursewikia.com",100],["courseboat.com",100],["pornhub.*",101],["lne.es",[102,372]],["pornult.com",103],["webcamsdolls.com",103],["bitcotasks.com",[103,145]],["adsy.pw",103],["playstore.pw",103],["exactpay.online",103],["thothd.to",103],["proplanta.de",104],["textograto.com",105],["voyageforum.com",106],["hmc-id.blogspot.com",106],["myabandonware.com",106],["wcofun.*",106],["ilforumdeibrutti.is",106],["prad.de",[107,160]],["chatta.it",108],["ketubanjiwa.com",109],["nsfw247.to",110],["funzen.net",110],["extremereportbot.com",111],["getintopc.com",112],["qoshe.com",113],["lowellsun.com",114],["mamadu.pl",114],["dobrapogoda24.pl",114],["motohigh.pl",114],["namasce.pl",114],["ultimate-catch.eu",115],["cpopchanelofficial.com",116],["creditcardgenerator.com",117],["creditcardrush.com",117],["bostoncommons.net",117],["thejobsmovie.com",117],["hl-live.de",118],["satoshi-win.xyz",118],["encurtandourl.com",[118,122]],["www-daftarharga.blogspot.com",118],["ear-phone-review.com",118],["telefullenvivo.com",118],["listatv.pl",118],["coin-profits.xyz",118],["relampagomovies.com",118],["wohnmobilforum.de",118],["nulledbear.com",118],["sinnerclownceviri.net",118],["nilopolisonline.com.br",119],["mesquitaonline.com",119],["yellowbridge.com",119],["yaoiotaku.com",120],["moneyhouse.ch",121],["ihow.info",122],["filesus.com",122],["gotxx.*",122],["sturls.com",122],["turbo1.co",122],["hartico.tv",122],["cupra.forum",122],["turkanime.*",123],["valeronevijao.com",123],["yodelswartlike.com",123],["generatesnitrosate.com",123],["gamoneinterrupted.com",123],["metagnathtuggers.com",123],["rationalityaloelike.com",123],["sizyreelingly.com",123],["urochsunloath.com",123],["monorhinouscassaba.com",123],["antecoxalbobbing1010.com",123],["boonlessbestselling244.com",123],["cyamidpulverulence530.com",123],["guidon40hyporadius9.com",123],["449unceremoniousnasoseptal.com",123],["30sensualizeexpression.com",123],["greaseball6eventual20.com",123],["toxitabellaeatrebates306.com",123],["20demidistance9elongations.com",123],["audaciousdefaulthouse.com",123],["fittingcentermondaysunday.com",123],["launchreliantcleaverriver.com",123],["matriculant401merited.com",123],["realfinanceblogcenter.com",123],["telyn610zoanthropy.com",123],["un-block-voe.net",123],["v-o-e-unblock.com",123],["voe-un-block.com",123],["voe-unblock.*",123],["voeunbl0ck.com",123],["voeunblck.com",123],["voeunblk.com",123],["voeunblock.com",123],["voeunblock2.com",123],["voeunblock3.com",123],["agefi.fr",124],["cariskuy.com",125],["letras2.com",125],["yusepjaelani.blogspot.com",126],["letras.mus.br",127],["eletronicabr.com",128],["mtlurb.com",129],["onemanhua.com",130],["laksa19.github.io",131],["javcl.com",131],["tvlogy.to",131],["rp5.*",131],["live.dragaoconnect.net",131],["seznamzpravy.cz",131],["xerifetech.com",131],["freemcserver.net",131],["t3n.de",132],["allindiaroundup.com",133],["tapchipi.com",134],["dcleakers.com",134],["esgeeks.com",134],["pugliain.net",134],["uplod.net",134],["worldfreeware.com",134],["tech-blogs.com",134],["cardiagn.com",134],["fikiri.net",134],["myhackingworld.com",134],["vectorizer.io",135],["onehack.us",135],["smgplaza.com",135],["thapcam.net",135],["breznikar.com",135],["thefastlaneforum.com",136],["5flix.top",137],["bembed.net",137],["embedv.net",137],["javguard.club",137],["listeamed.net",137],["v6embed.xyz",137],["vembed.*",137],["vid-guard.com",137],["vidguardto.xyz",137],["yesmovies.*>>",137],["pistona.xyz",137],["vinomo.xyz",137],["moflix-stream.*",[137,166]],["trade2win.com",138],["modagamers.com",139],["khatrimaza.*",139],["freemagazines.top",139],["pogolinks.*",139],["straatosphere.com",139],["nullpk.com",139],["adslink.pw",139],["downloadudemy.com",139],["picgiraffe.com",139],["weadown.com",139],["freepornsex.net",139],["nurparatodos.com.ar",139],["popcornstream.*",140],["routech.ro",140],["hokej.net",140],["turkmmo.com",141],["acdriftingpro.com",142],["palermotoday.it",143],["baritoday.it",143],["trentotoday.it",143],["agrigentonotizie.it",143],["anconatoday.it",143],["arezzonotizie.it",143],["avellinotoday.it",143],["bresciatoday.it",143],["brindisireport.it",143],["casertanews.it",143],["cataniatoday.it",143],["cesenatoday.it",143],["chietitoday.it",143],["forlitoday.it",143],["frosinonetoday.it",143],["genovatoday.it",143],["ilpescara.it",143],["ilpiacenza.it",143],["latinatoday.it",143],["lecceprima.it",143],["leccotoday.it",143],["livornotoday.it",143],["messinatoday.it",143],["milanotoday.it",143],["modenatoday.it",143],["monzatoday.it",143],["novaratoday.it",143],["padovaoggi.it",143],["parmatoday.it",143],["perugiatoday.it",143],["pisatoday.it",143],["quicomo.it",143],["ravennatoday.it",143],["reggiotoday.it",143],["riminitoday.it",143],["romatoday.it",143],["salernotoday.it",143],["sondriotoday.it",143],["sportpiacenza.it",143],["ternitoday.it",143],["today.it",143],["torinotoday.it",143],["trevisotoday.it",143],["triesteprima.it",143],["udinetoday.it",143],["veneziatoday.it",143],["vicenzatoday.it",143],["thumpertalk.com",144],["austiblox.net",144],["thelayoff.com",145],["shorterall.com",145],["maxstream.video",145],["tvepg.eu",145],["manwan.xyz",145],["dailymaverick.co.za",146],["ludigames.com",147],["made-by.org",147],["worldtravelling.com",147],["technichero.com",147],["androidadult.com",147],["aeroxplorer.com",147],["sportitalialive.com",147],["adrinolinks.com",148],["link.vipurl.in",148],["nanolinks.in",148],["fadedfeet.com",149],["homeculina.com",149],["ineedskin.com",149],["kenzo-flowertag.com",149],["lawyex.co",149],["mdn.lol",149],["starkroboticsfrc.com",150],["sinonimos.de",150],["antonimos.de",150],["quesignifi.ca",150],["tiktokrealtime.com",150],["tiktokcounter.net",150],["tpayr.xyz",150],["poqzn.xyz",150],["ashrfd.xyz",150],["rezsx.xyz",150],["tryzt.xyz",150],["ashrff.xyz",150],["rezst.xyz",150],["dawenet.com",150],["erzar.xyz",150],["waezm.xyz",150],["waezg.xyz",150],["blackwoodacademy.org",150],["cryptednews.space",150],["vivuq.com",150],["swgop.com",150],["vbnmll.com",150],["telcoinfo.online",150],["dshytb.com",150],["bitzite.com",151],["coingraph.us",152],["impact24.us",152],["tpi.li",153],["oii.la",153],["www.apkmoddone.com",154],["sitemini.io.vn",155],["vip1s.top",155],["dl.apkmoddone.com",156],["phongroblox.com",156],["financacerta.com",157],["encurtads.net",157],["shortencash.click",158],["lablue.*",159],["4-liga.com",160],["4fansites.de",160],["4players.de",160],["9monate.de",160],["aachener-nachrichten.de",160],["aachener-zeitung.de",160],["abendblatt.de",160],["abendzeitung-muenchen.de",160],["about-drinks.com",160],["abseits-ka.de",160],["airliners.de",160],["ajaxshowtime.com",160],["allgemeine-zeitung.de",160],["alpin.de",160],["antenne.de",160],["arcor.de",160],["areadvd.de",160],["areamobile.de",160],["ariva.de",160],["astronews.com",160],["aussenwirtschaftslupe.de",160],["auszeit.bio",160],["auto-motor-und-sport.de",160],["auto-service.de",160],["autobild.de",160],["autoextrem.de",160],["autopixx.de",160],["autorevue.at",160],["autotrader.nl",160],["az-online.de",160],["baby-vornamen.de",160],["babyclub.de",160],["bafoeg-aktuell.de",160],["berliner-kurier.de",160],["berliner-zeitung.de",160],["bigfm.de",160],["bikerszene.de",160],["bildderfrau.de",160],["blackd.de",160],["blick.de",160],["boerse-online.de",160],["boerse.de",160],["boersennews.de",160],["braunschweiger-zeitung.de",160],["brieffreunde.de",160],["brigitte.de",160],["buerstaedter-zeitung.de",160],["buffed.de",160],["businessinsider.de",160],["buzzfeed.at",160],["buzzfeed.de",160],["caravaning.de",160],["cavallo.de",160],["chefkoch.de",160],["cinema.de",160],["clever-tanken.de",160],["computerbild.de",160],["computerhilfen.de",160],["comunio-cl.com",160],["comunio.*",160],["connect.de",160],["chip.de",160],["da-imnetz.de",160],["dasgelbeblatt.de",160],["dbna.com",160],["dbna.de",160],["deichstube.de",160],["deine-tierwelt.de",160],["der-betze-brennt.de",160],["derwesten.de",160],["desired.de",160],["dhd24.com",160],["dieblaue24.com",160],["digitalfernsehen.de",160],["dnn.de",160],["donnerwetter.de",160],["e-hausaufgaben.de",160],["e-mountainbike.com",160],["eatsmarter.de",160],["echo-online.de",160],["ecomento.de",160],["einfachschoen.me",160],["elektrobike-online.com",160],["eltern.de",160],["epochtimes.de",160],["essen-und-trinken.de",160],["express.de",160],["extratipp.com",160],["familie.de",160],["fanfiktion.de",160],["fehmarn24.de",160],["fettspielen.de",160],["fid-gesundheitswissen.de",160],["finanzen.*",160],["finanznachrichten.de",160],["finanztreff.de",160],["finya.de",160],["firmenwissen.de",160],["fitforfun.de",160],["fnp.de",160],["football365.fr",160],["formel1.de",160],["fr.de",160],["frankfurter-wochenblatt.de",160],["freenet.de",160],["fremdwort.de",160],["froheweihnachten.info",160],["frustfrei-lernen.de",160],["fuldaerzeitung.de",160],["funandnews.de",160],["fussballdaten.de",160],["futurezone.de",160],["gala.de",160],["gamepro.de",160],["gamersglobal.de",160],["gamesaktuell.de",160],["gamestar.de",160],["gameswelt.*",160],["gamezone.de",160],["gartendialog.de",160],["gartenlexikon.de",160],["gedichte.ws",160],["geissblog.koeln",160],["gelnhaeuser-tageblatt.de",160],["general-anzeiger-bonn.de",160],["geniale-tricks.com",160],["genialetricks.de",160],["gesund-vital.de",160],["gesundheit.de",160],["gevestor.de",160],["gewinnspiele.tv",160],["giessener-allgemeine.de",160],["giessener-anzeiger.de",160],["gifhorner-rundschau.de",160],["giga.de",160],["gipfelbuch.ch",160],["gmuender-tagespost.de",160],["gruenderlexikon.de",160],["gusto.at",160],["gut-erklaert.de",160],["gutfuerdich.co",160],["hallo-muenchen.de",160],["hamburg.de",160],["hanauer.de",160],["hardwareluxx.de",160],["hartziv.org",160],["harzkurier.de",160],["haus-garten-test.de",160],["hausgarten.net",160],["haustec.de",160],["haz.de",160],["heftig.*",160],["heidelberg24.de",160],["heilpraxisnet.de",160],["heise.de",160],["helmstedter-nachrichten.de",160],["hersfelder-zeitung.de",160],["hftg.co",160],["hifi-forum.de",160],["hna.de",160],["hochheimer-zeitung.de",160],["hoerzu.de",160],["hofheimer-zeitung.de",160],["iban-rechner.de",160],["ikz-online.de",160],["immobilienscout24.de",160],["ingame.de",160],["inside-digital.de",160],["inside-handy.de",160],["investor-verlag.de",160],["jappy.com",160],["jpgames.de",160],["kabeleins.de",160],["kachelmannwetter.com",160],["kamelle.de",160],["kicker.de",160],["kindergeld.org",160],["klettern-magazin.de",160],["klettern.de",160],["kochbar.de",160],["kreis-anzeiger.de",160],["kreisbote.de",160],["kreiszeitung.de",160],["ksta.de",160],["kurierverlag.de",160],["lachainemeteo.com",160],["lampertheimer-zeitung.de",160],["landwirt.com",160],["laut.de",160],["lauterbacher-anzeiger.de",160],["leckerschmecker.me",160],["leinetal24.de",160],["lesfoodies.com",160],["levif.be",160],["lifeline.de",160],["liga3-online.de",160],["likemag.com",160],["linux-community.de",160],["linux-magazin.de",160],["live.vodafone.de",160],["ln-online.de",160],["lokalo24.de",160],["lustaufsleben.at",160],["lustich.de",160],["lvz.de",160],["lz.de",160],["mactechnews.de",160],["macwelt.de",160],["macworld.co.uk",160],["mail.de",160],["main-spitze.de",160],["manager-magazin.de",160],["manga-tube.me",160],["mathebibel.de",160],["mathepower.com",160],["maz-online.de",160],["medisite.fr",160],["mehr-tanken.de",160],["mein-kummerkasten.de",160],["mein-mmo.de",160],["mein-wahres-ich.de",160],["meine-anzeigenzeitung.de",160],["meinestadt.de",160],["menshealth.de",160],["mercato365.com",160],["merkur.de",160],["messen.de",160],["metal-hammer.de",160],["metalflirt.de",160],["meteologix.com",160],["minecraft-serverlist.net",160],["mittelbayerische.de",160],["modhoster.de",160],["moin.de",160],["mopo.de",160],["morgenpost.de",160],["motor-talk.de",160],["motorbasar.de",160],["motorradonline.de",160],["motorsport-total.com",160],["motortests.de",160],["mountainbike-magazin.de",160],["moviejones.de",160],["moviepilot.de",160],["mt.de",160],["mtb-news.de",160],["musiker-board.de",160],["musikexpress.de",160],["musikradar.de",160],["mz-web.de",160],["n-tv.de",160],["naumburger-tageblatt.de",160],["netzwelt.de",160],["neuepresse.de",160],["neueroeffnung.info",160],["news.at",160],["news.de",160],["news38.de",160],["newsbreak24.de",160],["nickles.de",160],["nicknight.de",160],["nl.hardware.info",160],["nn.de",160],["nnn.de",160],["nordbayern.de",160],["notebookchat.com",160],["notebookcheck-ru.com",160],["notebookcheck-tr.com",160],["notebookcheck.*",160],["noz-cdn.de",160],["noz.de",160],["nrz.de",160],["nw.de",160],["nwzonline.de",160],["oberhessische-zeitung.de",160],["och.to",160],["oeffentlicher-dienst.info",160],["onlinekosten.de",160],["onvista.de",160],["op-marburg.de",160],["op-online.de",160],["outdoor-magazin.com",160],["outdoorchannel.de",160],["paradisi.de",160],["pc-magazin.de",160],["pcgames.de",160],["pcgameshardware.de",160],["pcwelt.de",160],["pcworld.es",160],["peiner-nachrichten.de",160],["pferde.de",160],["pietsmiet.de",160],["pixelio.de",160],["pkw-forum.de",160],["playboy.de",160],["playfront.de",160],["pnn.de",160],["pons.com",160],["prignitzer.de",160],["profil.at",160],["promipool.de",160],["promobil.de",160],["prosiebenmaxx.de",160],["psychic.de",[160,180]],["quoka.de",160],["radio.at",160],["radio.de",160],["radio.dk",160],["radio.es",160],["radio.fr",160],["radio.it",160],["radio.net",160],["radio.pl",160],["radio.pt",160],["radio.se",160],["ran.de",160],["readmore.de",160],["rechtslupe.de",160],["recording.de",160],["rennrad-news.de",160],["reuters.com",160],["reviersport.de",160],["rhein-main-presse.de",160],["rheinische-anzeigenblaetter.de",160],["rimondo.com",160],["roadbike.de",160],["roemische-zahlen.net",160],["rollingstone.de",160],["rot-blau.com",160],["rp-online.de",160],["rtl.de",[160,254]],["rtv.de",160],["rugby365.fr",160],["ruhr24.de",160],["rundschau-online.de",160],["runnersworld.de",160],["safelist.eu",160],["salzgitter-zeitung.de",160],["sat1.de",160],["sat1gold.de",160],["schoener-wohnen.de",160],["schwaebische-post.de",160],["schwarzwaelder-bote.de",160],["serienjunkies.de",160],["shz.de",160],["sixx.de",160],["skodacommunity.de",160],["smart-wohnen.net",160],["sn.at",160],["sozialversicherung-kompetent.de",160],["spiegel.de",160],["spielen.de",160],["spieletipps.de",160],["spielfilm.de",160],["sport.de",160],["sport1.de",160],["sport365.fr",160],["sportal.de",160],["spox.com",160],["stern.de",160],["stuttgarter-nachrichten.de",160],["stuttgarter-zeitung.de",160],["sueddeutsche.de",160],["svz.de",160],["szene1.at",160],["szene38.de",160],["t-online.de",160],["tagesspiegel.de",160],["taschenhirn.de",160],["techadvisor.co.uk",160],["techstage.de",160],["tele5.de",160],["teltarif.de",160],["testedich.*",160],["the-voice-of-germany.de",160],["thueringen24.de",160],["tichyseinblick.de",160],["tierfreund.co",160],["tiervermittlung.de",160],["torgranate.de",160],["transfermarkt.*",160],["trend.at",160],["truckscout24.*",160],["tv-media.at",160],["tvdigital.de",160],["tvinfo.de",160],["tvspielfilm.de",160],["tvtoday.de",160],["tvtv.*",160],["tz.de",[160,175]],["unicum.de",160],["unnuetzes.com",160],["unsere-helden.com",160],["unterhalt.net",160],["usinger-anzeiger.de",160],["usp-forum.de",160],["videogameszone.de",160],["vienna.at",160],["vip.de",160],["virtualnights.com",160],["vox.de",160],["wa.de",160],["wallstreet-online.de",[160,163]],["waz.de",160],["weather.us",160],["webfail.com",160],["weihnachten.me",160],["weihnachts-bilder.org",160],["weihnachts-filme.com",160],["welt.de",160],["weltfussball.at",160],["weristdeinfreund.de",160],["werkzeug-news.de",160],["werra-rundschau.de",160],["wetterauer-zeitung.de",160],["wetteronline.*",160],["wieistmeineip.*",160],["wiesbadener-kurier.de",160],["wiesbadener-tagblatt.de",160],["winboard.org",160],["windows-7-forum.net",160],["winfuture.de",[160,171]],["wintotal.de",160],["wlz-online.de",160],["wn.de",160],["wohngeld.org",160],["wolfenbuetteler-zeitung.de",160],["wolfsburger-nachrichten.de",160],["woman.at",160],["womenshealth.de",160],["wormser-zeitung.de",160],["woxikon.de",160],["wp.de",160],["wr.de",160],["wunderweib.de",160],["yachtrevue.at",160],["ze.tt",160],["zeit.de",160],["lecker.de",160],["meineorte.com",161],["osthessen-news.de",161],["techadvisor.com",161],["focus.de",161],["wetter.*",162],["herzporno.net",164],["deinesexfilme.com",165],["einfachtitten.com",165],["lesbenhd.com",165],["milffabrik.com",[165,225]],["porn-monkey.com",165],["porndrake.com",165],["pornhubdeutsch.net",165],["pornoaffe.com",165],["pornodavid.com",165],["pornoente.tv",[165,225]],["pornofisch.com",165],["pornofelix.com",165],["pornohammer.com",165],["pornohelm.com",165],["pornoklinge.com",165],["pornotom.com",[165,225]],["pornotommy.com",165],["pornovideos-hd.com",165],["pornozebra.com",[165,225]],["xhamsterdeutsch.xyz",165],["xnxx-sexfilme.com",165],["nu6i-bg-net.com",167],["kiaclub.cz",167],["khsm.io",167],["webcreator-journal.com",167],["msdos-games.com",167],["blocklayer.com",167],["animeshqip.org",167],["weknowconquer.com",167],["giff.cloud",167],["aquarius-horoscopes.com",168],["cancer-horoscopes.com",168],["dubipc.blogspot.com",168],["echoes.gr",168],["engel-horoskop.de",168],["freegames44.com",168],["fuerzasarmadas.eu",168],["gemini-horoscopes.com",168],["jurukunci.net",168],["krebs-horoskop.com",168],["leo-horoscopes.com",168],["maliekrani.com",168],["nklinks.click",168],["ourenseando.es",168],["pisces-horoscopes.com",168],["radio-en-direct.fr",168],["sagittarius-horoscopes.com",168],["scorpio-horoscopes.com",168],["singlehoroskop-loewe.de",168],["skat-karten.de",168],["skorpion-horoskop.com",168],["taurus-horoscopes.com",168],["the1security.com",168],["virgo-horoscopes.com",168],["zonamarela.blogspot.com",168],["yoima.hatenadiary.com",168],["kaystls.site",169],["ftuapps.dev",170],["studydhaba.com",170],["freecourse.tech",170],["victor-mochere.com",170],["papunika.com",170],["mobilanyheter.net",170],["prajwaldesai.com",[170,243]],["carscoops.com",171],["dziennik.pl",171],["eurointegration.com.ua",171],["flatpanelshd.com",171],["footballtransfer.com.ua",171],["footballtransfer.ru",171],["hoyme.jp",171],["issuya.com",171],["itainews.com",171],["iusm.co.kr",171],["logicieleducatif.fr",171],["mynet.com",[171,194]],["onlinegdb.com",171],["picrew.me",171],["pravda.com.ua",171],["reportera.co.kr",171],["sportanalytic.com",171],["sportsrec.com",171],["sportsseoul.com",171],["text-compare.com",171],["tweaksforgeeks.com",171],["wfmz.com",171],["worldhistory.org",171],["palabr.as",171],["motscroises.fr",171],["cruciverba.it",171],["w.grapps.me",171],["gazetaprawna.pl",171],["pressian.com",171],["raenonx.cc",[171,270]],["indiatimes.com",171],["missyusa.com",171],["aikatu.jp",171],["ark-unity.com",171],["cool-style.com.tw",171],["doanhnghiepvn.vn",171],["mykhel.com",171],["automobile-catalog.com",172],["motorbikecatalog.com",172],["maketecheasier.com",172],["mlbpark.donga.com",173],["jjang0u.com",174],["auto-swiat.pl",176],["download.kingtecnologia.com",177],["daemonanime.net",178],["bgmateriali.com",178],["daemon-hentai.com",179],["forumdz.com",180],["zilinak.sk",180],["pdfaid.com",180],["bootdey.com",180],["mail.com",180],["moegirl.org.cn",180],["flix-wave.lol",180],["fmovies0.cc",180],["worthcrete.com",180],["infomatricula.pt",180],["my-code4you.blogspot.com",181],["vrcmods.com",182],["osuskinner.com",182],["osuskins.net",182],["pentruea.com",183],["mchacks.net",184],["why-tech.it",185],["compsmag.com",186],["tapetus.pl",187],["autoroad.cz",188],["brawlhalla.fr",188],["tecnobillo.com",188],["pokemon-project.com",188],["breatheheavy.com",189],["wenxuecity.com",190],["key-hub.eu",191],["fabioambrosi.it",192],["tattle.life",193],["emuenzen.de",193],["terrylove.com",193],["cidade.iol.pt",195],["fantacalcio.it",196],["hentaifreak.org",197],["hypebeast.com",198],["krankheiten-simulieren.de",199],["catholic.com",200],["techinferno.com",201],["ibeconomist.com",202],["bookriot.com",203],["purposegames.com",204],["globo.com",205],["latimes.com",205],["claimrbx.gg",206],["perelki.net",207],["vpn-anbieter-vergleich-test.de",208],["livingincebuforums.com",209],["paperzonevn.com",210],["alltechnerd.com",211],["malaysianwireless.com",212],["erinsakura.com",213],["infofuge.com",213],["freejav.guru",213],["novelmultiverse.com",213],["fritidsmarkedet.dk",214],["maskinbladet.dk",214],["15min.lt",215],["baddiehub.com",216],["mr9soft.com",217],["adult-sex-gamess.com",218],["hentaigames.app",218],["mobilesexgamesx.com",218],["mysexgamer.com",218],["porngameshd.com",218],["sexgamescc.com",218],["xnxx-sex-videos.com",218],["f2movies.to",219],["freeporncave.com",220],["tubsxxx.com",221],["manga18fx.com",222],["freebnbcoin.com",222],["sextvx.com",223],["muztext.com",224],["pornohans.com",225],["nursexfilme.com",225],["pornohirsch.net",225],["xhamster-sexvideos.com",225],["pornoschlange.com",225],["xhamsterdeutsch.*",225],["hdpornos.net",225],["gutesexfilme.com",225],["zona-leros.com",225],["charbelnemnom.com",226],["simplebits.io",227],["online-fix.me",228],["privatemoviez.*",229],["gamersdiscussionhub.com",229],["elahmad.com",230],["owlzo.com",231],["q1003.com",232],["blogpascher.com",233],["testserver.pro",234],["lifestyle.bg",234],["money.bg",234],["news.bg",234],["topsport.bg",234],["webcafe.bg",234],["schoolcheats.net",235],["mgnet.xyz",236],["advertiserandtimes.co.uk",237],["techsolveprac.com",238],["joomlabeginner.com",239],["askpaccosi.com",240],["largescaleforums.com",241],["dubznetwork.com",242],["dongknows.com",244],["traderepublic.community",245],["babia.to",246],["html5.gamemonetize.co",247],["code2care.org",248],["gmx.*",249],["yts-subs.net",250],["dlhd.sx",250],["xxxxsx.com",251],["ngontinh24.com",252],["idevicecentral.com",253],["mangacrab.com",255],["hortonanderfarom.blogspot.com",256],["viefaucet.com",257],["pourcesoir.in",257],["cloud-computing-central.com",258],["afk.guide",259],["businessnamegenerator.com",260],["derstandard.at",261],["derstandard.de",261],["rocketnews24.com",262],["soranews24.com",262],["youpouch.com",262],["gourmetscans.net",263],["ilsole24ore.com",264],["ipacrack.com",265],["infokik.com",266],["porhubvideo.com",268],["webseriessex.com",268],["panuvideo.com",[268,269]],["pornktubes.net",268],["deezer.com",270],["fosslinux.com",271],["shrdsk.me",272],["examword.com",273],["sempreupdate.com.br",273],["tribuna.com",274],["trendsderzukunft.de",275],["gal-dem.com",275],["lostineu.eu",275],["oggitreviso.it",275],["speisekarte.de",275],["mixed.de",275],["lightnovelspot.com",[276,277]],["novelpub.com",[276,277]],["webnovelpub.com",[276,277]],["hwzone.co.il",278],["nammakalvi.com",279],["igay69.com",279],["c2g.at",280],["terafly.me",280],["elamigos-games.com",280],["elamigos-games.net",280],["elamigosgames.org",280],["dktechnicalmate.com",281],["recipahi.com",281],["vpntester.org",282],["japscan.lol",283],["digitask.ru",284],["tempumail.com",285],["sexvideos.host",286],["camcaps.*",287],["10alert.com",288],["cryptstream.de",289],["nydus.org",289],["techhelpbd.com",290],["fapdrop.com",291],["cellmapper.net",292],["hdrez.com",293],["youwatch-serie.com",293],["russland.jetzt",293],["printablecreative.com",294],["peachprintable.com",294],["comohoy.com",295],["leak.sx",295],["paste.bin.sx",295],["pornleaks.in",295],["merlininkazani.com",295],["j91.asia",296],["jeniusplay.com",297],["indianyug.com",298],["rgb.vn",298],["needrom.com",299],["criptologico.com",300],["megadrive-emulator.com",301],["eromanga-show.com",302],["hentai-one.com",302],["hentaipaw.com",302],["10minuteemails.com",303],["luxusmail.org",303],["w3cub.com",304],["bangpremier.com",305],["nyaa.iss.ink",306],["drivebot.*",307],["thenextplanet1.*",308],["tnp98.xyz",308],["techedubyte.com",310],["poplinks.*",311],["tickzoo.tv",312],["oploverz.*",312],["memedroid.com",313],["karaoketexty.cz",314],["filmizlehdfilm.com",315],["filmizletv.*",315],["fullfilmizle.cc",315],["gofilmizle.net",315],["resortcams.com",316],["cheatography.com",316],["sonixgvn.net",317],["autoscout24.*",318],["mjakmama24.pl",319],["cheatermad.com",320],["work.ink",321],["ville-ideale.fr",322],["brainly.*",323],["eodev.com",323],["xfreehd.com",325],["freethesaurus.com",326],["thefreedictionary.com",326],["fm-arena.com",327],["tradersunion.com",328],["tandess.com",329],["allosurf.net",329],["spontacts.com",330],["dankmemer.lol",331],["getexploits.com",332],["fplstatistics.com",333],["breitbart.com",334],["salidzini.lv",335],["cryptorank.io",[336,337]],["qqwebplay.xyz",338],["molbiotools.com",339],["vods.tv",340],["18xxx.xyz",[341,373]],["raidrush.net",342],["xnxxcom.xyz",343],["videzz.net",344],["spambox.xyz",345],["dreamdth.com",346],["freemodsapp.in",346],["onlytech.com",346],["en-thunderscans.com",347],["infinityscans.xyz",348],["infinityscans.net",348],["infinityscans.org",348],["iqksisgw.xyz",349],["caroloportunidades.com.br",350],["coempregos.com.br",350],["foodiesgallery.com",350],["vikatan.com",351],["camhub.world",352],["mma-core.*",353],["pouvideo.*",354],["povvideo.*",354],["povw1deo.*",354],["povwideo.*",354],["powv1deo.*",354],["powvibeo.*",354],["powvideo.*",354],["powvldeo.*",354],["teracourses.com",355],["servustv.com",[356,357]],["freevipservers.net",358],["streambtw.com",359],["qrcodemonkey.net",360],["streamup.ws",361],["tv-films.co.uk",362],["cool--web-de.translate.goog",[363,364]],["gps--cache-de.translate.goog",[363,364]],["web--spiele-de.translate.goog",[363,364]],["fun--seiten-de.translate.goog",[363,364]],["photo--alben-de.translate.goog",[363,364]],["wetter--vorhersage-de.translate.goog",[363,364]],["coolsoftware-de.translate.goog",[363,364]],["kryptografie-de.translate.goog",[363,364]],["cool--domains-de.translate.goog",[363,364]],["net--tours-de.translate.goog",[363,364]],["such--maschine-de.translate.goog",[363,364]],["qul-de.translate.goog",[363,364]],["mailtool-de.translate.goog",[363,364]],["c--ix-de.translate.goog",[363,364]],["softwareengineer-de.translate.goog",[363,364]],["net--tools-de.translate.goog",[363,364]],["hilfen-de.translate.goog",[363,364]],["45er-de.translate.goog",[363,364]],["cooldns-de.translate.goog",[363,364]],["hardware--entwicklung-de.translate.goog",[363,364]],["bgsi.gg",365],["kio.ac",366],["friv.com",367],["tdtnews.com",368],["santafenewmexican.com",368],["sextb.*>>",369],["nepalieducate.com",370],["freegames.com",371],["levante-emv.com",372],["mallorcazeitung.es",372],["regio7.cat",372],["superdeporte.es",372],["laopiniondezamora.es",372],["laopiniondemurcia.es",372],["laopiniondemalaga.es",372],["laopinioncoruna.es",372],["lacronicabadajoz.com",372],["informacion.es",372],["farodevigo.es",372],["emporda.info",372],["elperiodicomediterraneo.com",372],["elperiodicoextremadura.com",372],["epe.es",372],["elperiodicodearagon.com",372],["eldia.es",372],["elcorreoweb.es",372],["diariodemallorca.es",372],["diariodeibiza.es",372],["diariocordoba.com",372],["diaridegirona.cat",372],["elperiodico.com",372],["laprovincia.es",372],["4tube.live",373],["nxxn.live",373],["redtub.live",373],["olympustaff.com",374]]);
const exceptionsMap = new Map([["vvid30c.*",[137]]]);
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
