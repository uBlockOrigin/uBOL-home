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
const argsList = [["show-login-layer-article"],["check","100"],["ads","2000"],["Adblocker","10000"],["()","2000"],["()","4000"],["#advert-tracker","500"],["()","3000"],["()","1000"],["w3ad","1000"],["()","1500"],["adsBlocked"],["NoAd","8000"],["()","700"],["warning"],["adsbygoogle"],["AdBlocker"],["modal"],["adblock"],["body"],["null"],["appendMessage"],["()","5000"],["adblocker"],["adsbygoogle","5000"],["google_jobrunner"],["bait"],["steady-adblock"],["offsetHeight"],["checkFeed","1000"],["samOverlay"],["adStillHere"],["adb"],["adBlockDetected"],["blocked","1000"],["blocker"],["an_message","500"],["pgblck"],["pop"],["ads"],["head"],["&adslot"],["ai_"],["$"],["広告"],["abp"],["show"],["adsok"],["length","3000"],["ad"],["concertAds"],["whetherdo"],["nn_mpu1","5000"],["adsbygoogle","2000"],["ThriveGlobal"],["scan","500"],["onload_popup","8000"],["bioEp.showPopup"],["innerHTML"],["showOverlay"],["loginModal","500"],["__ext_loaded"],["slideout"],["popup"],["exit_popup","10000"],["test.remove"],["noscroll","3000"],["offsetHeight","100"],["premium"],["SignUPPopup_load","5000"],[".modal","1000"],["Zord.analytics.registerBeforeLeaveEvent","3000"],["myModal","3000"],["_0x"],["pipaId","0"],["forceRefresh"],["debugger"],["donation-modal"],["Delay"],["onscroll","5500"],["login","5000"],["devtoolIsOpening","100"],["gnt_mol_oy"],["devtools"],["popupScreen"],["_detectLoop"],["Premium"],["||null"],["pleaseSupportUs"],["devtool"],["detectLoop"],[".LoginSection"],["(!0)","8000"]];
const hostnamesMap = new Map([["telecom.economictimes.indiatimes.com",0],["hqq.tv",1],["columbiaspectator.com",2],["books-world.net",3],["pc3mag.com",3],["opedge.com",4],["bronze-bravery.com",4],["ultimate-bravery.net",4],["htmlreference.io",4],["short-story.net",4],["sbenny.com",4],["fabricjs.com",5],["bucketpages.com",6],["steptalk.org",7],["boerse-express.com",8],["numberempire.com",9],["howjsay.com",10],["cagesideseats.com",10],["heroesneverdie.com",11],["curbed.com",11],["eater.com",11],["funnyordie.com",11],["mmafighting.com",11],["mmamania.com",11],["polygon.com",11],["racked.com",11],["riftherald.com",11],["sbnation.com",11],["theverge.com",11],["vox.com",11],["twinkietown.com",11],["ruwix.com",12],["rp5.by",13],["turbolab.it",14],["9xbuddy.com",15],["zerogpt.net",15],["watson.de",16],["watson.ch",16],["xe.gr",17],["jsfiddle.net",17],["fairyabc.com",18],["asheville.com",18],["minecraftforge.net",19],["theherald-news.com",20],["libgen.*",21],["keybr.com",22],["mocospace.com",23],["dxmaps.com",24],["photoshop-online.biz",25],["endorfinese.com.br",25],["segnidalcielo.it",25],["2iptv.com",25],["ukworkshop.co.uk",25],["deezer.com",26],["handball-world.news",27],["mobiflip.de",27],["titanic-magazin.de",27],["mimikama.org",27],["langweiledich.net",27],["der-postillon.com",27],["perlentaucher.de",27],["lwlies.com",27],["serieslyawesome.tv",27],["critic.de",27],["mediotejo.net",27],["nahrungsmittel-intoleranz.com",27],["madeinbocholt.de",27],["goodnews-magazin.de",27],["wallauonline.de",27],["playbill.com",28],["olarila.com",28],["liverpool.no",28],["fotor.com",28],["xxxonlinegames.com",28],["affiliate.fc2.com",29],["4x4earth.com",30],["diffchecker.com",31],["malekal.com",32],["audiostereo.pl",32],["polyflore.net",33],["cpuid.com",34],["webcamtaxi.com",35],["fosspost.org",36],["xtv.cz",37],["katholisches.info",38],["hollywoodmask.com",38],["streaminglearningcenter.com",39],["prepostseo.com",40],["tiermaker.com",41],["shopomo.co.uk",42],["techus.website",42],["elitepvpers.com",43],["fnbrjp.com",44],["leekduck.com",45],["htforum.net",46],["mdlinx.com",46],["infoplease.com",46],["craftpip.github.io",47],["pixwox.com",48],["ikorektor.pl",49],["goldenstateofmind.com",50],["neoseeker.com",51],["bluesnews.com",52],["notificationsounds.com",53],["tweaking4all.com",53],["99bitcoins.com",54],["mediafire.com",55],["webcodegeeks.com",56],["vpnmentor.com",57],["tomshw.it",57],["wizcase.com",57],["portableapps.com",58],["reviewmeta.com",58],["addons.opera.com",59],["zulily.com",60],["lookmovie.ag",61],["lifo.gr",62],["searchenginejournal.com",63],["karamellstore.com.br",64],["underconsideration.com",65],["foreignaffairs.com",66],["guides4gamers.com",67],["icy-veins.com",68],["dreamstime.com",69],["megapixl.com",70],["cissamagazine.com.br",71],["utour.me",72],["123movies.*",73],["theepochtimes.com",74],["drawasaurus.org",75],["hqq.to",76],["zefoy.com",76],["tuborstb.co",76],["emturbovid.com",76],["anime3s.com",76],["animet1.net",76],["pawastreams.pro",76],["criticalthinking.org",77],["zwei-euro.com",78],["geeksforgeeks.org",[79,80]],["moviepl.xyz",81],["aberdeennews.com",82],["alamogordonews.com",82],["amarillo.com",82],["amestrib.com",82],["app.com",82],["argusleader.com",82],["augustachronicle.com",82],["azcentral.com",82],["battlecreekenquirer.com",82],["beaconjournal.com",82],["blueridgenow.com",82],["buckscountycouriertimes.com",82],["bucyrustelegraphforum.com",82],["burlingtoncountytimes.com",82],["burlingtonfreepress.com",82],["caller.com",82],["cantondailyledger.com",82],["cantonrep.com",82],["capecodtimes.com",82],["cheboygannews.com",82],["chieftain.com",82],["chillicothegazette.com",82],["cincinnati.com",82],["citizen-times.com",82],["cjonline.com",82],["clarionledger.com",82],["coloradoan.com",82],["columbiadailyherald.com",82],["columbiatribune.com",82],["commercialappeal.com",82],["coshoctontribune.com",82],["courier-journal.com",82],["courier-tribune.com",82],["courierpostonline.com",82],["courierpress.com",82],["currentargus.com",82],["daily-jeff.com",82],["daily-times.com",82],["dailyamerican.com",82],["dailycomet.com",82],["dailycommercial.com",82],["dailyrecord.com",82],["dailyworld.com",82],["delawareonline.com",82],["delmarvanow.com",82],["demingheadlight.com",82],["democratandchronicle.com",82],["desertsun.com",82],["desmoinesregister.com",82],["devilslakejournal.com",82],["dispatch.com",82],["dnj.com",82],["ellwoodcityledger.com",82],["elpasotimes.com",82],["enterprisenews.com",82],["eveningsun.com",82],["eveningtribune.com",82],["examiner-enterprise.com",82],["fayobserver.com",82],["fdlreporter.com",82],["floridatoday.com",82],["fosters.com",82],["freep.com",82],["gadsdentimes.com",82],["gainesville.com",82],["galesburg.com",82],["gastongazette.com",82],["goerie.com",82],["gosanangelo.com",82],["goupstate.com",82],["greatfallstribune.com",82],["greenbaypressgazette.com",82],["greenvilleonline.com",82],["hattiesburgamerican.com",82],["heraldmailmedia.com",82],["heraldnews.com",82],["heraldtribune.com",82],["hillsdale.net",82],["hollandsentinel.com",82],["hoosiertimes.com",82],["houmatoday.com",82],["htrnews.com",82],["hutchnews.com",82],["indeonline.com",82],["independentmail.com",82],["indystar.com",82],["ithacajournal.com",82],["jacksonsun.com",82],["jacksonville.com",82],["jconline.com",82],["jdnews.com",82],["journalstandard.com",82],["jsonline.com",82],["kinston.com",82],["kitsapsun.com",82],["knoxnews.com",82],["lancastereaglegazette.com",82],["lansingstatejournal.com",82],["lcsun-news.com",82],["ldnews.com",82],["lenconnect.com",82],["lincolncourier.com",82],["livingstondaily.com",82],["lohud.com",82],["lubbockonline.com",82],["mansfieldnewsjournal.com",82],["marionstar.com",82],["marshfieldnewsherald.com",82],["mcdonoughvoice.com",82],["metrowestdailynews.com",82],["milforddailynews.com",82],["monroenews.com",82],["montgomeryadvertiser.com",82],["mpnnow.com",82],["mycentraljersey.com",82],["naplesnews.com",82],["newarkadvocate.com",82],["newbernsj.com",82],["newportri.com",82],["news-journalonline.com",82],["news-leader.com",82],["news-press.com",82],["newschief.com",82],["newsherald.com",82],["newsleader.com",82],["njherald.com",82],["northjersey.com",82],["norwichbulletin.com",82],["nwfdailynews.com",82],["oakridger.com",82],["ocala.com",82],["oklahoman.com",82],["onlineathens.com",82],["pal-item.com",82],["palmbeachdailynews.com",82],["palmbeachpost.com",82],["patriotledger.com",82],["pekintimes.com",82],["petoskeynews.com",82],["pjstar.com",82],["pnj.com",82],["poconorecord.com",82],["pontiacdailyleader.com",82],["portclintonnewsherald.com",82],["postcrescent.com",82],["poughkeepsiejournal.com",82],["press-citizen.com",82],["pressconnects.com",82],["progress-index.com",82],["providencejournal.com",82],["publicopiniononline.com",82],["record-courier.com",82],["recordnet.com",82],["recordonline.com",82],["redding.com",82],["registerguard.com",82],["reporter-times.com",82],["reporternews.com",82],["rgj.com",82],["rrstar.com",82],["ruidosonews.com",82],["salina.com",82],["savannahnow.com",82],["scsun-news.com",82],["sctimes.com",82],["seacoastonline.com",82],["sheboyganpress.com",82],["shelbystar.com",82],["shreveporttimes.com",82],["sj-r.com",82],["sooeveningnews.com",82],["southbendtribune.com",82],["southcoasttoday.com",82],["starcourier.com",82],["stargazette.com",82],["starnewsonline.com",82],["statesman.com",82],["statesmanjournal.com",82],["staugustine.com",82],["stevenspointjournal.com",82],["sturgisjournal.com",82],["swtimes.com",82],["tallahassee.com",82],["tauntongazette.com",82],["tcpalm.com",82],["telegram.com",82],["tennessean.com",82],["the-daily-record.com",82],["the-dispatch.com",82],["the-leader.com",82],["the-review.com",82],["theadvertiser.com",82],["thecalifornian.com",82],["thedailyjournal.com",82],["thedailyreporter.com",82],["thegardnernews.com",82],["thegleaner.com",82],["thehawkeye.com",82],["theintell.com",82],["theleafchronicle.com",82],["theledger.com",82],["thenews-messenger.com",82],["thenewsstar.com",82],["thenorthwestern.com",82],["thepublicopinion.com",82],["therecordherald.com",82],["thespectrum.com",82],["thestarpress.com",82],["thetimesherald.com",82],["thetimesnews.com",82],["thetowntalk.com",82],["times-gazette.com",82],["timesonline.com",82],["timesrecordnews.com",82],["timesreporter.com",82],["timestelegram.com",82],["tmnews.com",82],["tricountyindependent.com",82],["tuscaloosanews.com",82],["usatoday.com",82],["uticaod.com",82],["vcstar.com",82],["visaliatimesdelta.com",82],["vvdailypress.com",82],["wausaudailyherald.com",82],["wisconsinrapidstribune.com",82],["ydr.com",82],["zanesvilletimesrecorder.com",82],["sflix.to",83],["thizissam.in",84],["telenovelas-turcas.com.es",85],["solarmovie.*",85],["phimfit.com",85],["tumblr.com",86],["animesuge.to",87],["aniwave.*",87],["anix.*",87],["flixhq.*",87],["flixrave.to",87],["hdtoday.so",87],["hurawatch.bz",87],["vidplay.site",87],["vid2faf.site",87],["galinos.gr",88],["oceanplay.org",89],["bembed.net",89],["embedv.net",89],["fslinks.org",89],["listeamed.net",89],["v6embed.xyz",89],["vembed.*",89],["vgplayer.xyz",89],["vid-guard.com",89],["yugenanime.sx",90],["yugenanime.tv",90],["openanesthesia.org",91],["filiser.eu",92],["wishflix.cc",92],["zalukaj.io",92]]);
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
