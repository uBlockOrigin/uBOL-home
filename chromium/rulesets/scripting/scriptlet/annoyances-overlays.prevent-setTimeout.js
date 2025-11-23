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

// ruleset: annoyances-overlays

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
const argsList = [["show-login-layer-article"],["||!!"],["adsbygoogle"],["AdBlocker"],["pro-modal"],["googlesyndication"],[".getState();","4500"],["ThriveGlobal"],["check","100"],["ads","2000"],["scan","500"],["onload_popup","8000"],["Adblocker","10000"],["()","2000"],["()","4000"],["#advert-tracker","500"],["()","3000"],["()","1000"],["w3ad"],["()","1500"],["bioEp.showPopup"],["innerHTML"],["adsBlocked"],["showOverlay"],["NoAd","8000"],["loginModal","500"],["()","700"],["warning"],["__ext_loaded"],["slideout"],["faq/whitelist"],["modal"],["offsetHeight"],["adblock"],["body"],["null"],["appendMessage"],["()","5000"],["vSiteRefresher"],["popup"],["adblocker"],["exit_popup","10000"],["show"],["test.remove"],["noscroll","3000"],["adsbygoogle","5000"],["google_jobrunner"],["bait"],["checkFeed","1000"],["samOverlay"],["adStillHere"],["adb"],["offsetHeight","100"],["adBlockDetected"],["premium"],["blocked","1000"],["blocker"],["SignUPPopup_load","5000"],[".modal","1000"],["Zord.analytics.registerBeforeLeaveEvent","3000"],["myModal","3000"],["an_message","500"],["_0x"],["pipaId","0"],["pgblck"],["forceRefresh"],["pop"],["ads"],["head"],["&adslot"],["debugger"],["ai_"],["donation-modal"],["Delay"],["$"],["onscroll","5500"],["login","5000"],["広告"],["devtoolIsOpening","100"],["abp"],["gnt_mol_oy"],["adsok"],["length","3000"],["devtools"],["popupScreen"],["ad"],["_detectLoop"],["concertAds"],["whetherdo"],["Premium"],["||null"],["pleaseSupportUs"],["nn_mpu1","5000"],["devtool"],["adsbygoogle","2000"],["adb-enabled"],[".LoginSection"],["detect_modal"],["(!0)","8000"],["ad_blocker_detector_modal"],["clientHeight"]];
const hostnamesMap = new Map([["telecom.economictimes.indiatimes.com",0],["anikai.to",1],["animekai.*",1],["anigo.to",1],["sflix.fi",1],["yflix.to",1],["tides.net",2],["9xbuddy.com",2],["zerogpt.net",2],["yuuki.me",2],["lazyadmin.nl",3],["watson.de",3],["watson.ch",3],["pokeos.com",4],["flagle.io",5],["duneawakening.th.gl",6],["paxdei.th.gl",6],["starresonance.th.gl",6],["99bitcoins.com",7],["hqq.tv",8],["columbiaspectator.com",9],["mediafire.com",10],["webcodegeeks.com",11],["books-world.net",12],["pc3mag.com",12],["opedge.com",13],["bronze-bravery.com",13],["ultimate-bravery.net",13],["htmlreference.io",13],["short-story.net",13],["sbenny.com",13],["fabricjs.com",14],["bucketpages.com",15],["steptalk.org",16],["boerse-express.com",17],["numberempire.com",18],["howjsay.com",19],["cagesideseats.com",19],["vpnmentor.com",20],["tomshw.it",20],["wizcase.com",20],["portableapps.com",21],["reviewmeta.com",21],["heroesneverdie.com",22],["curbed.com",22],["eater.com",22],["funnyordie.com",22],["mmafighting.com",22],["mmamania.com",22],["polygon.com",22],["racked.com",22],["riftherald.com",22],["sbnation.com",22],["theverge.com",22],["vox.com",22],["twinkietown.com",22],["addons.opera.com",23],["ruwix.com",24],["zulily.com",25],["rp5.by",26],["turbolab.it",27],["lookmovie.ag",28],["lifo.gr",29],["anisearch.de",30],["anisearch.com",30],["xe.gr",31],["liverpool.no",32],["fotor.com",32],["playbill.com",32],["xxxonlinegames.com",32],["olarila.com",32],["fairyabc.com",33],["asheville.com",33],["ajanstv.com.tr",33],["minecraftforge.net",34],["theherald-news.com",35],["libgen.*",36],["keybr.com",37],["gamebanana.com",38],["searchenginejournal.com",39],["mocospace.com",40],["karamellstore.com.br",41],["mdlinx.com",42],["infoplease.com",42],["htforum.net",42],["underconsideration.com",43],["foreignaffairs.com",44],["dxmaps.com",45],["photoshop-online.biz",46],["ukworkshop.co.uk",46],["endorfinese.com.br",46],["segnidalcielo.it",46],["deezer.com",47],["affiliate.fc2.com",48],["4x4earth.com",49],["diffchecker.com",50],["malekal.com",51],["audiostereo.pl",51],["guides4gamers.com",52],["polyflore.net",53],["icy-veins.com",54],["cpuid.com",55],["webcamtaxi.com",56],["dreamstime.com",57],["megapixl.com",58],["cissamagazine.com.br",59],["utour.me",60],["fosspost.org",61],["123movies.*",62],["theepochtimes.com",63],["xtv.cz",64],["drawasaurus.org",65],["katholisches.info",66],["hollywoodmask.com",66],["streaminglearningcenter.com",67],["prepostseo.com",68],["tiermaker.com",69],["hqq.to",70],["zefoy.com",70],["tuborstb.co",70],["emturbovid.com",70],["pawastreams.pro",70],["shopomo.co.uk",71],["techus.website",71],["criticalthinking.org",72],["zwei-euro.com",73],["elitepvpers.com",74],["geeksforgeeks.org",[75,76]],["fnbrjp.com",77],["moviepl.xyz",78],["leekduck.com",79],["aberdeennews.com",80],["alamogordonews.com",80],["amarillo.com",80],["amestrib.com",80],["app.com",80],["argusleader.com",80],["augustachronicle.com",80],["azcentral.com",80],["battlecreekenquirer.com",80],["beaconjournal.com",80],["blueridgenow.com",80],["buckscountycouriertimes.com",80],["bucyrustelegraphforum.com",80],["burlingtoncountytimes.com",80],["burlingtonfreepress.com",80],["caller.com",80],["cantondailyledger.com",80],["cantonrep.com",80],["capecodtimes.com",80],["cheboygannews.com",80],["chieftain.com",80],["chillicothegazette.com",80],["cincinnati.com",80],["citizen-times.com",80],["cjonline.com",80],["clarionledger.com",80],["coloradoan.com",80],["columbiadailyherald.com",80],["columbiatribune.com",80],["commercialappeal.com",80],["coshoctontribune.com",80],["courier-journal.com",80],["courier-tribune.com",80],["courierpostonline.com",80],["courierpress.com",80],["currentargus.com",80],["daily-jeff.com",80],["daily-times.com",80],["dailyamerican.com",80],["dailycomet.com",80],["dailycommercial.com",80],["dailyrecord.com",80],["dailyworld.com",80],["delawareonline.com",80],["delmarvanow.com",80],["demingheadlight.com",80],["democratandchronicle.com",80],["desertsun.com",80],["desmoinesregister.com",80],["devilslakejournal.com",80],["dispatch.com",80],["dnj.com",80],["ellwoodcityledger.com",80],["elpasotimes.com",80],["enterprisenews.com",80],["eveningsun.com",80],["eveningtribune.com",80],["examiner-enterprise.com",80],["fayobserver.com",80],["fdlreporter.com",80],["floridatoday.com",80],["fosters.com",80],["freep.com",80],["gadsdentimes.com",80],["gainesville.com",80],["galesburg.com",80],["gastongazette.com",80],["goerie.com",80],["gosanangelo.com",80],["goupstate.com",80],["greatfallstribune.com",80],["greenbaypressgazette.com",80],["greenvilleonline.com",80],["hattiesburgamerican.com",80],["heraldmailmedia.com",80],["heraldnews.com",80],["heraldtribune.com",80],["hillsdale.net",80],["hollandsentinel.com",80],["hoosiertimes.com",80],["houmatoday.com",80],["htrnews.com",80],["hutchnews.com",80],["indeonline.com",80],["independentmail.com",80],["indystar.com",80],["ithacajournal.com",80],["jacksonsun.com",80],["jacksonville.com",80],["jconline.com",80],["jdnews.com",80],["journalstandard.com",80],["jsonline.com",80],["kinston.com",80],["kitsapsun.com",80],["knoxnews.com",80],["lancastereaglegazette.com",80],["lansingstatejournal.com",80],["lcsun-news.com",80],["ldnews.com",80],["lenconnect.com",80],["lincolncourier.com",80],["livingstondaily.com",80],["lohud.com",80],["lubbockonline.com",80],["mansfieldnewsjournal.com",80],["marionstar.com",80],["marshfieldnewsherald.com",80],["mcdonoughvoice.com",80],["metrowestdailynews.com",80],["milforddailynews.com",80],["monroenews.com",80],["montgomeryadvertiser.com",80],["mpnnow.com",80],["mycentraljersey.com",80],["naplesnews.com",80],["newarkadvocate.com",80],["newbernsj.com",80],["newportri.com",80],["news-journalonline.com",80],["news-leader.com",80],["news-press.com",80],["newschief.com",80],["newsherald.com",80],["newsleader.com",80],["njherald.com",80],["northjersey.com",80],["norwichbulletin.com",80],["nwfdailynews.com",80],["oakridger.com",80],["ocala.com",80],["oklahoman.com",80],["onlineathens.com",80],["pal-item.com",80],["palmbeachdailynews.com",80],["palmbeachpost.com",80],["patriotledger.com",80],["pekintimes.com",80],["petoskeynews.com",80],["pjstar.com",80],["pnj.com",80],["poconorecord.com",80],["pontiacdailyleader.com",80],["portclintonnewsherald.com",80],["postcrescent.com",80],["poughkeepsiejournal.com",80],["press-citizen.com",80],["pressconnects.com",80],["progress-index.com",80],["providencejournal.com",80],["publicopiniononline.com",80],["record-courier.com",80],["recordnet.com",80],["recordonline.com",80],["redding.com",80],["registerguard.com",80],["reporter-times.com",80],["reporternews.com",80],["rgj.com",80],["rrstar.com",80],["ruidosonews.com",80],["salina.com",80],["savannahnow.com",80],["scsun-news.com",80],["sctimes.com",80],["seacoastonline.com",80],["sheboyganpress.com",80],["shelbystar.com",80],["shreveporttimes.com",80],["sj-r.com",80],["sooeveningnews.com",80],["southbendtribune.com",80],["southcoasttoday.com",80],["starcourier.com",80],["stargazette.com",80],["starnewsonline.com",80],["statesman.com",80],["statesmanjournal.com",80],["staugustine.com",80],["stevenspointjournal.com",80],["sturgisjournal.com",80],["swtimes.com",80],["tallahassee.com",80],["tauntongazette.com",80],["tcpalm.com",80],["telegram.com",80],["tennessean.com",80],["the-daily-record.com",80],["the-dispatch.com",80],["the-leader.com",80],["the-review.com",80],["theadvertiser.com",80],["thecalifornian.com",80],["thedailyjournal.com",80],["thedailyreporter.com",80],["thegardnernews.com",80],["thegleaner.com",80],["thehawkeye.com",80],["theintell.com",80],["theleafchronicle.com",80],["theledger.com",80],["thenews-messenger.com",80],["thenewsstar.com",80],["thenorthwestern.com",80],["thepublicopinion.com",80],["therecordherald.com",80],["thespectrum.com",80],["thestarpress.com",80],["thetimesherald.com",80],["thetimesnews.com",80],["thetowntalk.com",80],["times-gazette.com",80],["timesonline.com",80],["timesrecordnews.com",80],["timesreporter.com",80],["timestelegram.com",80],["tmnews.com",80],["tricountyindependent.com",80],["tuscaloosanews.com",80],["usatoday.com",80],["uticaod.com",80],["vcstar.com",80],["visaliatimesdelta.com",80],["vvdailypress.com",80],["wausaudailyherald.com",80],["wisconsinrapidstribune.com",80],["ydr.com",80],["zanesvilletimesrecorder.com",80],["craftpip.github.io",81],["pixwox.com",82],["sflix.to",83],["thizissam.in",84],["ikorektor.pl",85],["telenovelas-turcas.com.es",86],["solarmovie.*",86],["phimfit.com",86],["goldenstateofmind.com",87],["neoseeker.com",88],["tumblr.com",89],["aniwave.*",90],["anix.*",90],["flixhq.*",90],["flixrave.to",90],["hdtoday.so",90],["vidplay.site",90],["vid2faf.site",90],["galinos.gr",91],["bluesnews.com",92],["oceanplay.org",93],["bembed.net",93],["embedv.net",93],["listeamed.net",93],["v6embed.xyz",93],["vembed.*",93],["vid-guard.com",93],["notificationsounds.com",94],["tweaking4all.com",94],["zonatmo.com",95],["openanesthesia.org",96],["manhwa18.cc",97],["filiser.eu",98],["wishflix.cc",98],["zalukaj.io",98],["qrcode.best",99],["pogdesign.co.uk",100]]);
const exceptionsMap = new Map([]);
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
    try { preventSetTimeout(...argsList[i]); }
    catch { }
}

/******************************************************************************/

// End of local scope
})();

void 0;
