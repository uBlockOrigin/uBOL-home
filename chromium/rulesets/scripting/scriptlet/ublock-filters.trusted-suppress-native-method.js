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
(function uBOL_trustedSuppressNativeMethod() {

/******************************************************************************/

function trustedSuppressNativeMethod(
    methodPath = '',
    signature = '',
    how = '',
    stack = ''
) {
    if ( methodPath === '' ) { return; }
    const safe = safeSelf();
    const logPrefix = safe.makeLogPrefix('trusted-suppress-native-method', methodPath, signature, how, stack);
    const signatureArgs = safe.String_split.call(signature, /\s*\|\s*/).map(v => {
        if ( /^".*"$/.test(v) ) {
            return { type: 'pattern', re: safe.patternToRegex(v.slice(1, -1)) };
        }
        if ( /^\/.+\/$/.test(v) ) {
            return { type: 'pattern', re: safe.patternToRegex(v) };
        }
        if ( v === 'false' ) {
            return { type: 'exact', value: false };
        }
        if ( v === 'true' ) {
            return { type: 'exact', value: true };
        }
        if ( v === 'null' ) {
            return { type: 'exact', value: null };
        }
        if ( v === 'undefined' ) {
            return { type: 'exact', value: undefined };
        }
    });
    const stackNeedle = safe.initPattern(stack, { canNegate: true });
    proxyApplyFn(methodPath, function(context) {
        const { callArgs } = context;
        if ( signature === '' ) {
            safe.uboLog(logPrefix, `Arguments:\n${callArgs.join('\n')}`);
            return context.reflect();
        }
        for ( let i = 0; i < signatureArgs.length; i++ ) {
            const signatureArg = signatureArgs[i];
            if ( signatureArg === undefined ) { continue; }
            const targetArg = i < callArgs.length ? callArgs[i] : undefined;
            if ( signatureArg.type === 'exact' ) {
                if ( targetArg !== signatureArg.value ) {
                    return context.reflect();
                }
            }
            if ( signatureArg.type === 'pattern' ) {
                if ( safe.RegExp_test.call(signatureArg.re, targetArg) === false ) {
                    return context.reflect();
                }
            }
        }
        if ( stackNeedle.matchAll !== true ) {
            const logLevel = safe.logLevel > 1 ? 'all' : '';
            if ( matchesStackTraceFn(stackNeedle, logLevel) === false ) {
                return context.reflect();
            }
        }
        if ( how === 'debug' ) {
            debugger; // eslint-disable-line no-debugger
            return context.reflect();
        }
        safe.uboLog(logPrefix, `Suppressed:\n${callArgs.join('\n')}`);
        if ( how === 'abort' ) {
            throw new ReferenceError();
        }
    });
}

function matchesStackTraceFn(
    needleDetails,
    logLevel = ''
) {
    const safe = safeSelf();
    const exceptionToken = getExceptionTokenFn();
    const error = new safe.Error(exceptionToken);
    const docURL = new URL(self.location.href);
    docURL.hash = '';
    // Normalize stack trace
    const reLine = /(.*?@)?(\S+)(:\d+):\d+\)?$/;
    const lines = [];
    for ( let line of safe.String_split.call(error.stack, /[\n\r]+/) ) {
        if ( line.includes(exceptionToken) ) { continue; }
        line = line.trim();
        const match = safe.RegExp_exec.call(reLine, line);
        if ( match === null ) { continue; }
        let url = match[2];
        if ( url.startsWith('(') ) { url = url.slice(1); }
        if ( url === docURL.href ) {
            url = 'inlineScript';
        } else if ( url.startsWith('<anonymous>') ) {
            url = 'injectedScript';
        }
        let fn = match[1] !== undefined
            ? match[1].slice(0, -1)
            : line.slice(0, match.index).trim();
        if ( fn.startsWith('at') ) { fn = fn.slice(2).trim(); }
        let rowcol = match[3];
        lines.push(' ' + `${fn} ${url}${rowcol}:1`.trim());
    }
    lines[0] = `stackDepth:${lines.length-1}`;
    const stack = lines.join('\t');
    const r = needleDetails.matchAll !== true &&
        safe.testPattern(needleDetails, stack);
    if (
        logLevel === 'all' ||
        logLevel === 'match' && r ||
        logLevel === 'nomatch' && !r
    ) {
        safe.uboLog(stack.replace(/\t/g, '\n'));
    }
    return r;
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

function getExceptionTokenFn() {
    const token = getRandomTokenFn();
    const oe = self.onerror;
    self.onerror = function(msg, ...args) {
        if ( typeof msg === 'string' && msg.includes(token) ) { return true; }
        if ( oe instanceof Function ) {
            return oe.call(this, msg, ...args);
        }
    }.bind();
    return token;
}

function getRandomTokenFn() {
    const safe = safeSelf();
    return safe.String_fromCharCode(Date.now() % 26 + 97) +
        safe.Math_floor(safe.Math_random() * 982451653 + 982451653).toString(36);
}

/******************************************************************************/

const scriptletGlobals = {}; // eslint-disable-line
const argsList = [["Document.prototype.querySelectorAll","\"/^#/\"","prevent","/stackDepth:4.+nawNA/"],["Document.prototype.querySelector","\"/^#/\"","prevent","/stackDepth:4.+ inlineScript:2/"],["Document.prototype.getElementsByClassName","\"/^[A-Z]{6}$/\"","prevent","/stackDepth:4.+ inlineScript/"],["Document.prototype.getElementById","\"/^[A-Z]{6}$/\"","prevent","/stackDepth:4.+ inlineScript/"],["Element.prototype.insertAdjacentHTML","\"afterbegin\"","prevent","/\\/[A-Za-z]+\\.min\\.js\\?/"],["eval","\"/chp_?ad/\""],["eval","\"/chp_?ad/\"","prevent"],["HTMLScriptElement.prototype.setAttribute","\"data-sdk\"","abort"],["eval","\"adsBlocked\""],["Storage.prototype.setItem","searchCount"],["fetch","\"flashtalking\""],["DOMTokenList.prototype.add","\"-\""],["HTMLScriptElement.prototype.setAttribute","\"data-cfasync\"","abort"],["DOMTokenList.prototype.add","\"-\"","prevent","stack","/wp-content\\/uploads\\/[a-z]+\\/[a-z]+\\.js/"],["navigator.sendBeacon","\"data.bilibili.com/log/\"","prevent"]];
const hostnamesMap = new Map([["japscan.lol",[0,1,2,3]],["pvpoke-re.com",4],["zegtrends.com",5],["tea-coffee.net",5],["spatsify.com",5],["newedutopics.com",5],["getviralreach.in",5],["edukaroo.com",5],["funkeypagali.com",5],["careersides.com",5],["nayisahara.com",5],["wikifilmia.com",5],["infinityskull.com",5],["viewmyknowledge.com",5],["iisfvirtual.in",5],["starxinvestor.com",5],["jkssbalerts.com",5],["acetack.com",5],["blog.carstopia.net",5],["blog.carsmania.net",5],["redfea.com",5],["pranarevitalize.com",5],["techyinfo.in",5],["fitnessholic.net",5],["moderngyan.com",5],["sattakingcharts.in",5],["freshbhojpuri.com",5],["bgmi32bitapk.in",5],["bankshiksha.in",5],["earn.mpscstudyhub.com",5],["earn.quotesopia.com",5],["money.quotesopia.com",5],["best-mobilegames.com",5],["learn.moderngyan.com",5],["bharatsarkarijobalert.com",5],["quotesopia.com",5],["creditsgoal.com",5],["ikramlar.online",5],["headlinerpost.com",5],["posterify.net",5],["whatgame.xyz",5],["mooonten.com",5],["msic.site",5],["fx-22.com",5],["gold-24.net",5],["forexrw7.com",5],["mtcremix.com",5],["advicefunda.com",5],["bestloanoffer.net",5],["computerpedia.in",5],["techconnection.in",5],["bollywoodchamp.in",5],["texw.online",5],["10-train.com",5],["110tutorials.com",5],["103.74.5.104",5],["185.193.17.214",5],["207hd.com",5],["247beatz.ng",5],["247footballnow.com",5],["24pdd.*",5],["27-sidefire-blog.com",5],["2best.club",5],["2the.space",5],["2ix2.com",5],["30kaiteki.com",5],["3dassetcollection.com",5],["3gpterbaru.com",5],["3dyasan.com",5],["3fnews.com",5],["3rabsports.com",5],["4drumkits.com",5],["4fans.gay",5],["4fingermusic.com",5],["4gousya.net",5],["4horlover.com",5],["4spaces.org",5],["519.best",5],["51sec.org",5],["80-talet.se",5],["9ketsuki.info",5],["a2zbookmark.com",5],["aboedman.com",5],["addtobucketlist.com",5],["adisann.com",5],["adminreboot.com",5],["adsurfle.com",5],["adsy.pw",5],["advertafrica.net",5],["adnan-tech.com",5],["africue.com",5],["aghasolution.com",5],["airportwebcams.net",5],["aitoolsfree.org",5],["aitohuman.org",5],["akihabarahitorigurasiseikatu.com",5],["akuebresources.com",5],["alanyapower.com",5],["albania.co.il",5],["albinofamily.com",5],["alexbacher.fr",5],["algodaodocescan.com.br",5],["allcalidad.app",5],["allcelebritywiki.com",5],["allcivilstandard.com",5],["alliptvlinks.com",5],["alliptvs.com",5],["almofed.com",5],["alphasource.site",5],["altcryp.com",5],["altselection.com",5],["altyazitube22.lat",5],["amaturehomeporn.com",5],["amnaymag.com",5],["amritadrino.com",5],["amtil.com.au",5],["analysis-chess.io.vn",5],["andani.net",5],["androidadult.com",5],["androidfacil.org",5],["angolopsicologia.com",5],["animalwebcams.net",5],["anime4mega.net",5],["anime4mega-descargas.net",5],["anime7.download",5],["anime-torrent.com",5],["animecenterbr.com",5],["animesonlineshd.com",5],["animetwixtor.com",5],["animexin.vip",5],["anmup.com.np",5],["anodee.com",5],["anonyviet.com",5],["anothergraphic.org",5],["aoseugosto.com",5],["aozoraapps.net",5],["apenasmaisumyaoi.com",5],["apkdink.com",5],["apostoliclive.com",5],["appdoze.*",5],["applediagram.com",5],["aprenderquechua.com",5],["arabstd.com",5],["arti-flora.nl",5],["articlebase.pk",5],["articlesmania.me",5],["ascalonscans.com",5],["asiansexdiarys.com",5],["askcerebrum.com",5],["askushowto.com",5],["aspirapolveremigliori.it",5],["assignmentdon.com",5],["astroages.com",5],["astrumscans.xyz",5],["atemporal.cloud",5],["atgstudy.com",5],["atlantisscan.com",5],["atleticalive.it",5],["audiobookexchangeplace.com",5],["audiotools.*",5],["audiotrip.org",5],["autocadcommand.com",5],["autodime.com",5],["autoindustry.ro",5],["automat.systems",5],["automothink.com",5],["autosport.*",5],["avitter.net",5],["awpd24.com",5],["ayatoon.com",5],["ayuka.link",5],["azamericasat.net",5],["azdly.com",5],["azores.co.il",5],["azrom.net",5],["babehubonlyfansly.com",5],["backyardpapa.com",5],["baithak.news",5],["baixedetudo.com.br",5],["balkanteka.net",5],["bandstand.ph",5],["batman.city",5],["bcanepaltu.com",5],["bcanotesnepal.com",5],["bcsnoticias.mx",5],["bdix.app",5],["bdokan.com",5],["bdsomadhan.com",5],["bdstarshop.com",5],["beaddiagrams.com",5],["bearchasingart.com",5],["beatree.cn",5],["bedavahesap.org",5],["beisbolinvernal.com",5],["bengalxpress.in",5],["beasttips.com",5],["berlin-teltow.de",5],["beruhmtemedien.com",5],["bestofarea.com",5],["bettingexchange.it",5],["bi-girl.net",5],["bibliotecadecorte.com",5],["bibliotecahermetica.com.br",5],["bidersnotu.com",5],["bif24.pl",5],["biftutech.com",5],["bigdata-social.com",5],["bimshares.com",5],["bishalghale.com.np",5],["bitcotasks.com",5],["bitlikutu.com",5],["bittukitech.in",5],["bitview.cloud",5],["bitzite.com",5],["blog.motionisland.com",5],["blog24.me",5],["blogk.com",5],["blogue.tech",5],["bloooog.it",5],["bloxyscripts.com",5],["bluebuddies.com",5],["bluecoreinside.com",5],["blurayufr.cam",5],["bogowieslowianscy.pl",5],["bookpraiser.com",5],["booksbybunny.com",5],["boredgiant.com",5],["botinnifit.com",5],["boundlessnecromancer.com",5],["boxaoffrir.com",5],["boxingvideo.org",5],["boxofficebusiness.in",5],["boyfuck.me",5],["boystube.link",5],["braziliannr.com",5],["brevi.eu",5],["brian70.tw",5],["bright-b.com",5],["brightpets.org",5],["broadbottomvillage.co.uk",5],["brokensilenze.net",5],["brulosophy.com",5],["brushednickel.biz",5],["bshifast.live",5],["bsmaurya.com",5],["bugswave.com",5],["businesstrend.jp",5],["buzzpit.net",5],["byswiizen.fr",5],["cafenau.com",5],["calculascendant.com",5],["calmarkcovers.com",5],["calvyn.com",5],["camcam.cc",5],["camnang24h.net",5],["canadanouvelles.com",5],["canaltdt.es",5],["canzoni-per-bambini.it",5],["captionpost.com",5],["carryflix.icu",5],["cashkar.in",5],["casperhd.com",5],["catatanonline.com",5],["catmovie.website",5],["cavalierstream.fr",5],["celebritablog.com",5],["celemusic.com",5],["celestialtributesonline.com",5],["cembarut.com.tr",5],["certificateland.com",5],["cg-method.com",5],["chachocool.com",5],["chakrirkhabar247.in",5],["championpeoples.com",5],["chanjaeblog.jp",5],["change-ta-vie-coaching.com",5],["charlottepilgrimagetour.com",5],["charpatra.com",5],["chart.services",5],["chatgbt.one",5],["chatgptfree.ai",5],["cheatermad.com",5],["check-imei.info",5],["cheese-cake.net",5],["chelsea24news.pl",5],["chevalmag.com",5],["chieflyoffer.com",5],["chihouban.com",5],["chikonori.com",5],["chineseanime.org",5],["christiantrendy.com",5],["cienagamagdalena.com",5],["cimbusinessevents.com.au",5],["cinema-sketch.com",5],["cinepiroca.com",5],["cizzyscripts.com",5],["claimclicks.com",5],["claydscap.com",5],["clockskin.us",5],["cloud9obits.com",5],["cocorip.net",5],["code-source.net",5],["codeandkey.com",5],["codeastro.com",5],["codeitworld.com",5],["codemystery.com",5],["coderblog.in",5],["codewebit.top",5],["coin-profits.xyz",5],["coinadpro.club",5],["coinbaby8.com",5],["coingraph.us",5],["cola16.app",5],["coleccionmovie.com",5],["colliersnews.com",5],["comeletspray.com",5],["cometogliere.com",5],["comoinstalar.me",5],["compota-soft.work",5],["conoscereilrischioclinico.it",5],["consigliatodanoi.it",5],["constructionmethodology.com",5],["constructionplacement.org",5],["cookni.net",5],["correction-livre-scolaire.fr",5],["coursesdaddy.com",5],["cpscan.xyz",5],["crackcodes.in",5],["crackthemes.com",5],["crackwatch.eu",5],["craigretailers.co.uk",5],["crazyashwin.com",5],["crazydeals.live",5],["creebhills.com",5],["creepyscans.com",5],["cricket12.com",5],["crn.pl",5],["cronachesalerno.it",5],["crunchytech.net",5],["cryptonor.xyz",5],["cryptonworld.space",5],["cryptotech.fun",5],["cryptowidgets.net",5],["crystalcomics.com",5],["cta-fansite.com",5],["cuckoldsex.net",5],["culture-informatique.net",5],["cykf.net",5],["cyprus.co.il",5],["daemon-hentai.com",5],["daij1n.info",5],["dailykpop.net",5],["dailytechupdates.in",5],["dailytips247.com",5],["dailyweb.pl",5],["davewigstone.com",5],["davidsonbuilders.com",5],["dabangbastar.com",5],["day4news.com",5],["daybuy.tw",5],["deathonnews.com",5],["dejongeturken.com",5],["delvein.tech",5],["demonictl.com",5],["demonyslowianskie.pl",5],["demooh.com",5],["depressionhurts.us",5],["derusblog.com",5],["descargaranimes.com",5],["descargaseriestv.com",5],["design4months.com",5],["desirenovel.com",5],["desktopsolution.org",5],["destakenewsgospel.com",5],["destinationsjourney.com",5],["detikbangka.com",5],["deutschpersischtv.com",5],["dev-dark-blog.pantheonsite.io",5],["devopslanka.com",5],["dewfuneralhomenews.com",5],["dhankasamaj.com",5],["diamondfansub.com",5],["diarioeducacion.com",5],["diencobacninh.com",5],["digitalseoninja.com",5],["dignityobituary.com",5],["dinheirocursosdownload.com",5],["diplomaexamcorner.com",5],["dipprofit.com",5],["dir-tech.com",5],["diskizone.com",5],["diversanews.com",5],["diyprojectslab.com",5],["djqunjab.in",5],["djsofchhattisgarh.in",5],["djstar.in",5],["dma-upd.org",5],["dobleaccion.xyz",5],["dobletecno.com",5],["domainregistrationtips.info",5],["dominican-republic.co.il",5],["donghuaworld.com",5],["donlego.com",5],["doublemindtech.com",5],["doumura.com",5],["downloadbatch.me",5],["downloader.is",5],["downloads.sayrodigital.net",5],["downloads.wegomovies.com",5],["downloadtanku.org",5],["dpscomputing.com",5],["drake-scans.com",5],["drakecomic.com",5],["dramafren.com",5],["dramaviki.com",5],["drzna.com",5],["dubaitime.net",5],["dumovies.com",5],["dvd-flix.com",5],["dvdgayonline.com",5],["e-food.jp",5],["e-kakoh.com",5],["earlymemorials.com",5],["earninginwork.com",5],["easyjapanesee.com",5],["easytodoit.com",5],["ecommercewebsite.store",5],["eczpastpapers.net",5],["editions-actu.org",5],["editorsadda.com",5],["edivaldobrito.com.br",5],["edjerba.com",5],["edukamer.info",5],["egram.com.ng",5],["einewelteinezukunft.de",5],["elcriticodelatele.com",5],["elcultura.pl",5],["elearning-cpge.com",5],["eleceedmanhwa.me",5],["electricalstudent.com",5],["embraceinnerchaos.com",5],["emperorscan.com",5],["empleo.com.uy",5],["encuentratutarea.com",5],["encurtareidog.top",5],["eng-news.com",5],["english-dubbed.com",5],["english-topics.com",5],["english101.co.za",5],["enryumanga.com",5],["ensenchat.com",5],["entenpost.com",5],["epsilonakdemy.com",5],["eramuslim.com",5],["erreguete.gal",5],["ervik.as",5],["esportsmonk.com",5],["esportsnext.com",5],["et-invest.de",5],["eternalhonoring.com",5],["ethiopia.co.il",5],["evdeingilizcem.com",5],["eventiavversinews.*",5],["everydayhomeandgarden.com",5],["evlenmekisteyenbayanlar.net",5],["ewybory.eu",5],["exam-results.in",5],["exeking.top",5],["expertskeys.com",5],["eymockup.com",5],["ezmanga.net",5],["faaduindia.com",5],["fapfapgames.com",5],["fapkingsxxx.com",5],["faqwiki.us",5],["farolilloteam.es",5],["fattelodasolo.it",5],["fchopin.net",5],["felicetommasino.com",5],["femisoku.net",5],["ferdroid.net",5],["fessesdenfer.com",5],["feyorra.top",5],["fhedits.in",5],["fhmemorial.com",5],["fibwatch.store",5],["filmypoints.in",5],["finalnews24.com",5],["financeandinsurance.xyz",5],["financeyogi.net",5],["financid.com",5],["finclub.in",5],["findheman.com",5],["findnewjobz.com",5],["fine-wings.com",5],["firescans.xyz",5],["fitnesshealtharticles.com",5],["fitnessscenz.com",5],["flashssh.net",5],["fleamerica.com",5],["flexamens.com",5],["flixhub.*",5],["flordeloto.site",5],["flowsnet.com",5],["folkmord.se",5],["foodgustoso.it",5],["foodiesjoy.com",5],["footeuses.com",5],["footyload.com",5],["footymercato.com",5],["forex-yours.com",5],["forexcracked.com",5],["former-railroad-worker.com",5],["foxaholic.com",5],["francaisfacile.net",5],["free.7hd.club",5],["freebiesmockup.com",5],["freecoursesonline.me",5],["freedom3d.art",5],["freefiremaxofficial.com",5],["freefireupdate.com",5],["freegetcoins.com",5],["freelancerartistry.com",5],["freemedicalbooks.org",5],["freemockups.org",5],["freemovies-download.com",5],["freeoseocheck.com",5],["freepasses.org",5],["freescorespiano.com",5],["freetarotonline.com",5],["freetubetv.net",5],["freevstplugins.*",5],["freewoodworking.ca",5],["fresherbaba.com",5],["freshersgold.com",5],["friedrichshainblog.de",5],["frpgods.com",5],["ftuapps.*",5],["fumettologica.it",5],["funeral-memorial.com",5],["funeralmemorialnews.com",5],["funeralobitsmemorial.com",5],["funztv.com",5],["futbolenlatelevision.com",5],["gabrielcoding.com",5],["gadgetspidy.com",5],["gadgetxplore.com",5],["gahag.net",5],["galaxytranslations10.com",5],["galaxytranslations97.com",5],["galinhasamurai.com",5],["game5s.com",5],["gameblog.jp",5],["gamefi-mag.com",5],["gamenv.net",5],["gamers-haven.org",5],["gamerxyt.com",5],["games-manuals.com",5],["gamevcore.com",5],["gaminglariat.com",5],["gamingsearchjournal.com",5],["ganzoscan.com",5],["gatagata.net",5],["gaypornhdfree.com",5],["gazetazachodnia.eu",5],["gdrivemovies.xyz",5],["geekering.com",5],["gemiadamlari.org",5],["gentiluomodigitale.it",5],["gesund-vital.online",5],["getsuicidegirlsfree.com",5],["getworkation.com",5],["ghostsfreaks.com",5],["girlydrop.com",5],["gisvacancy.com",5],["giuseppegravante.com",5],["gkbooks.in",5],["gkgsca.com",5],["gksansar.com",5],["glo-n.online",5],["globelempire.com",5],["gnusocial.jp",5],["goegoe.net",5],["gogetadoslinks.*",5],["gogetapast.com.br",5],["gogifox.com",5],["gogueducation.com",5],["gokerja.net",5],["gokushiteki.com",5],["golf.rapidmice.com",5],["gomov.bio",5],["goodriviu.com",5],["googlearth.selva.name",5],["gorating.in",5],["gotocam.net",5],["grafikos.cz",5],["grasta.net",5],["grazymag.com",5],["greasygaming.com",5],["greattopten.com",5],["grootnovels.com",5],["gsdn.live",5],["gsmfreezone.com",5],["gsmmessages.com",5],["gtavi.pl",5],["gurbetseli.net",5],["gvnvh.net",5],["gwiazdatalkie.com",5],["habuteru.com",5],["hackingwala.com",5],["hackmodsapk.com",5],["hadakanonude.com",5],["hairjob.wpx.jp",5],["happy-otalife.com",5],["haqem.com",5],["harbigol.com",5],["harley.top",5],["haryanaalert.*",5],["haveyaseenjapan.com",5],["haxnode.net",5],["hdhub4one.pics",5],["hbnews24.com",5],["healthbeautybee.com",5],["healthcheckup.com",5],["healthfatal.com",5],["heartofvicksburg.com",5],["heartrainbowblog.com",5],["hechos.net",5],["hellenism.net",5],["heutewelt.com",5],["hhesse.de",5],["highdefdiscnews.com",5],["hilaw.vn",5],["hindi.trade",5],["hindimatrashabd.com",5],["hindinest.com",5],["hindishri.com",5],["hiphopa.net",5],["hipsteralcolico.altervista.org",5],["historichorizons.com",5],["hivetoon.com",5],["hobbykafe.com",5],["hockeyfantasytools.com",5],["hoegel-textildruck.de",5],["hojii.net",5],["hoofoot.net",5],["hookupnovel.com",5],["hopsion-consulting.com",5],["hostingreviews24.com",5],["hotspringsofbc.ca",5],["howtoblogformoney.net",5],["hub2tv.com",5],["hungarianhardstyle.hu",5],["hyderone.com",5],["hyogo.ie-t.net",5],["hypelifemagazine.com",5],["hypesol.com",5],["ideatechy.com",5],["idesign.wiki",5],["idevfast.com",5],["idevice.me",5],["idpvn.com",5],["iggtech.com",5],["ignoustudhelp.in",5],["ikarianews.gr",5],["ilbassoadige.it",5],["ilbolerodiravel.org",5],["imperiofilmes.co",5],["indiasmagazine.com",5],["individualogist.com",5],["inertz.org",5],["infamous-scans.com",5],["infocycles.com",5],["infodani.net",5],["infojabarloker.com",5],["infokita17.com",5],["informatudo.com.br",5],["infrafandub.com",5],["infulo.com",5],["inlovingmemoriesnews.com",5],["inprogrammer.com",5],["inra.bg",5],["insideeducation.co.za",5],["insidememorial.com",5],["insider-gaming.com",5],["insurancepost.xyz",5],["intelligence-console.com",5],["interculturalita.it",5],["inventionsdaily.com",5],["iptvxtreamcodes.com",5],["isabihowto.com.ng",5],["italiadascoprire.net",5],["itdmusic.*",5],["itmaniatv.com",5],["itopmusic.com",5],["itopmusics.com",5],["itopmusicx.com",5],["itz-fast.com",5],["iumkit.net",5],["iwb.jp",5],["jackofalltradesmasterofsome.com",5],["jaktsidan.se",5],["japannihon.com",5],["javboys.*",5],["javcock.com",5],["javgay.com",5],["jcutrer.com",5],["jk-market.com",5],["jobsbd.xyz",5],["jobsibe.com",5],["jobslampung.net",5],["josemo.com",5],["jra.jpn.org",5],["jrlinks.in",5],["jungyun.net",5],["juninhoscripts.com.br",5],["juventusfc.hu",5],["kacengeng.com",5],["kacikcelebrytow.com",5],["kagohara.net",5],["kakashiyt.com",5],["kakiagune.com",5],["kali.wiki",5],["kana-mari-shokudo.com",5],["kanaeblog.net",5],["kandisvarlden.com",5],["karaoke4download.com",5],["kattannonser.se",5],["kawaguchimaeda.com",5],["kaystls.site",5],["kenkou-maintenance.com",5],["kenta2222.com",5],["keroseed.*",5],["kgs-invest.com",5],["kh-pokemon-mc.com",5],["khabarbyte.com",5],["khabardinbhar.net",5],["khohieu.com",5],["kickcharm.com",5],["kinisuru.com",5],["kireicosplay.com",5],["kits4beats.com",5],["kllproject.lv",5],["know-how-tree.com",5],["knowstuff.in",5],["kobitacocktail.com",5],["kodaika.com",5],["kodewebsite.com",5],["kodibeginner.com",5],["kokosovoulje.com",5],["kolcars.shop",5],["kompiko.pl",5],["koreanbeauty.club",5],["korogashi-san.org",5],["korsrt.eu.org",5],["kotanopan.com",5],["koume-in-huistenbosch.net",5],["krx18.com",5],["kukni.to",5],["kupiiline.com",5],["kurosuen.live",5],["labstory.in",5],["lacrima.jp",5],["ladkibahin.com",5],["ladypopularblog.com",5],["lamorgues.com",5],["lampungkerja.com",5],["lapaginadealberto.com",5],["lascelebrite.com",5],["latinlucha.es",5],["law101.org.za",5],["lawweekcolorado.com",5],["lawyercontact.us",5],["learnedclub.com",5],["learnmany.in",5],["learnchannel-tv.com",5],["learnodo-newtonic.com",5],["learnospot.com",5],["lebois-racing.com",5],["lectormh.com",5],["leechyscripts.net",5],["leeapk.com",5],["legendaryrttextures.com",5],["lendrive.web.id",5],["lespartisanes.com",5],["letrasgratis.com.ar",5],["levismodding.co.uk",5],["lgcnews.com",5],["lglbmm.com",5],["lheritierblog.com",5],["librasol.com.br",5],["ligaset.com",5],["limontorrent.com",5],["limontorrents.com",5],["linkskibe.com",5],["linkvoom.com",5],["linkz.*",5],["linux-talks.com",5],["linuxexplain.com",5],["lionsfan.net",5],["literarysomnia.com",5],["littlepandatranslations.com",5],["livefootballempire.com",5],["lk21org.com",5],["lmtos.com",5],["loanpapa.in",5],["locurainformaticadigital.com",5],["logofootball.net",5],["lookism.me",5],["lotus-tours.com.hk",5],["lovingsiren.com",5],["ltpcalculator.in",5],["luchaonline.com",5],["luciferdonghua.in",5],["lucrebem.com.br",5],["lustesthd.cloud",5],["lustesthd.lat",5],["lycee-maroc.com",5],["m4u.*",5],["macrocreator.com",5],["madevarquitectos.com",5],["magesypro.*",5],["maisondeas.com",5],["maketoss.com",5],["makeupguide.net",5],["makotoichikawa.net",5],["malluporno.com",5],["mamtamusic.in",5],["mangcapquangvnpt.com",5],["manhastro.com",5],["mantrazscan.com",5],["maps4study.com.br",5],["marimo-info.net",5],["marketedgeofficial.com",5],["marketing-business-revenus-internet.fr",5],["marketrevolution.eu",5],["masashi-blog418.com",5],["mastakongo.info",5],["masterpctutoriales.com",5],["maths101.co.za",5],["matomeiru.com",5],["matshortener.xyz",5],["mcrypto.*",5],["mdn.lol",5],["medeberiya1.com",5],["mediascelebres.com",5],["medytour.com",5],["meilblog.com",5],["memorialnotice.com",5],["mentalhealthcoaching.org",5],["meteoregioneabruzzo.it",5],["mewingzone.com",5],["mhscans.com",5],["michiganrugcleaning.cleaning",5],["midis.com.ar",5],["midlandstraveller.com",5],["minddesignclub.org",5],["minecraftwild.com",5],["minhasdelicias.com",5],["mitaku.net",5],["mitsmits.com",5],["mixmods.com.br",5],["mm-scans.org",5],["mmfenix.com",5],["mmoovvfr.cloudfree.jp",5],["mmorpgplay.com.br",5],["mockupcity.com",5],["mockupgratis.com",5],["modele-facture.com",5],["modyster.com",5],["monaco.co.il",5],["morinaga-office.net",5],["mosttechs.com",5],["moto-station.com",5],["motofan-r.com",5],["movieping.com",5],["movies4u.*",5],["moviesnipipay.me",5],["mrfreemium.blogspot.com",5],["mscdroidlabs.es",5],["msonglyrics.com",5],["mtech4you.com",5],["multimovies.tech",5],["mummumtime.com",5],["mundovideoshd.com",5],["murtonroofing.com",5],["musicforchoir.com",5],["musictip.net",5],["mxcity.mx",5],["mxpacgroup.com",5],["my-ford-focus.de",5],["myglamwish.com",5],["myicloud.info",5],["mylinkat.com",5],["mylivewallpapers.com",5],["mypace.sasapurin.com",5],["myqqjd.com",5],["mytectutor.com",5],["myunity.dev",5],["myviptuto.com",5],["nagpurupdates.com",5],["naijagists.com",5],["naijdate.com",5],["najboljicajevi.com",5],["nakiny.com",5],["nameart.in",5],["nartag.com",5],["naturalmentesalute.org",5],["naturomicsworld.com",5],["naveedplace.com",5],["navinsamachar.com",5],["neet.wasa6.com",5],["negative.tboys.ro",5],["neifredomar.com",5],["nekoscans.com",5],["nemumemo.com",5],["nepaljobvacancy.com",5],["neservicee.com",5],["netsentertainment.net",5],["neuna.net",5],["newbookmarkingsite.com",5],["newfreelancespot.com",5],["newlifefuneralhomes.com",5],["news-geinou100.com",5],["newscard24.com",5],["newstechone.com",5],["nghetruyenma.net",5],["nhvnovels.com",5],["nichetechy.com",5],["nin10news.com",5],["nicetube.one",5],["ninjanovel.com",5],["nishankhatri.*",5],["niteshyadav.in",5],["nknews.jp",5],["nkreport.jp",5],["noanyi.com",5],["nobodycancool.com",5],["noblessetranslations.com",5],["nocfsb.com",5],["nocsummer.com.br",5],["nodenspace.com",5],["noikiiki.info",5],["notandor.cn",5],["note1s.com",5],["notesformsc.org",5],["noteshacker.com",5],["novel-gate.com",5],["novelbob.com",5],["novelread.co",5],["nsfwr34.com",5],["nswdownload.com",5],["nswrom.com",5],["ntucgm.com",5],["nudeslegion.com",5],["nukedfans.com",5],["nukedpacks.site",5],["nulledmug.com",5],["nvimfreak.com",5],["nyangames.altervista.org",5],["nylonstockingsex.net",5],["oatuu.org",5],["oberschwaben-tipps.de",5],["obituary-deathnews.com",5],["obituaryupdates.com",5],["odekake-spots.com",5],["officialpanda.com",5],["ofppt.net",5],["ofwork.net",5],["okblaz.me",5],["olamovies.store",5],["onehack.us",5],["onestringlab.com",5],["onlinetechsamadhan.com",5],["onlinetntextbooks.com",5],["onneddy.com",5],["onyxfeed.com",5],["openstartup.tm",5],["opiniones-empresas.com",5],["oracleerpappsguide.com",5],["orenoraresne.com",5],["oromedicine.com",5],["orunk.com",5],["osteusfilmestuga.online",5],["otakuliah.com",5],["oteknologi.com",5],["otokukensaku.jp",5],["ottrelease247.com",5],["ovnihoje.com",5],["pabryyt.one",5],["palofw-lab.com",5],["paminy.com",5],["pandaatlanta.com",5],["pandanote.info",5],["pantube.top",5],["paolo9785.com",5],["papafoot.click",5],["papahd.club",5],["paris-tabi.com",5],["parisporn.org",5],["parking-map.info",5],["pasatiemposparaimprimir.com",5],["pasokau.com",5],["passionatecarbloggers.com",5],["passportaction.com",5],["pc-guru.it",5],["pc-hobby.com",5],["pc-spiele-wiese.de",5],["pcgamedownload.net",5],["pcgameszone.com",5],["pdfstandards.net",5],["pepar.net",5],["personefamose.it",5],["petitestef.com",5],["pflege-info.net",5],["phoenix-manga.com",5],["phonefirmware.com",5],["physics101.co.za",5],["picgiraffe.com",5],["pilsner.nu",5],["piratemods.com",5],["piximfix.com",5],["plantatreenow.com",5],["plc4free.com",5],["pliroforiki-edu.gr",5],["poapan.xyz",5],["poco.rcccn.in",5],["pogga.org",5],["pokeca-chart.com",5],["pondit.xyz",5],["ponsel4g.com",5],["poplinks.*",5],["porlalibreportal.com",5],["pornfeel.com",5],["porninblack.com",5],["portaldoaz.org",5],["portaldosreceptores.org",5],["portalyaoi.com",5],["postazap.com",5],["posturecorrectorshop-online.com",5],["practicalkida.com",5],["prague-blog.co.il",5],["praveeneditz.com",5],["premierftp.com",5],["prensa.click",5],["prensaesports.com",5],["pressemedie.dk",5],["pressurewasherpumpdiagram.com",5],["pricemint.in",5],["primemovies.pl",5],["prismmarketingco.com",5],["proapkdown.com",5],["projuktirkotha.com",5],["promiblogs.de",5],["promimedien.com",5],["promisingapps.com",5],["protestia.com",5],["psicotestuned.info",5],["psychology-spot.com",5],["publicdomainq.net",5],["publicdomainr.net",5],["publicidadtulua.com",5],["pupuweb.com",5],["putlog.net",5],["pynck.com",5],["quatvn.club",5],["questionprimordiale.fr",5],["quicktelecast.com",5],["radiantsong.com",5],["rabo.no",5],["ragnarokscanlation.*",5],["rahim-soft.com",5],["rail-log.net",5],["railwebcams.net",5],["raishin.xyz",5],["ralli.ee",5],["ranjeet.best",5],["ranourano.xyz",5],["raulmalea.ro",5],["rbs.ta36.com",5],["rbscripts.net",5],["rctechsworld.in",5],["readfast.in",5],["readhunters.xyz",5],["realfreelancer.com",5],["realtormontreal.ca",5],["receptyonline.cz",5],["recipenp.com",5],["redbubbletools.com",5],["redfaucet.site",5],["reeell.com",5],["renierassociatigroup.com",5],["reportbangla.com",5],["reprezentacija.rs",5],["retire49.com",5],["retrotv.org",5],["reviewmedium.com",5],["revistaapolice.com.br",5],["rgmovies.*",5],["ribbelmonster.de",5],["rightdark-scan.com",5],["rinconpsicologia.com",5],["ritacandida.com",5],["riwayat-word.com",5],["rlshort.com",5],["rocdacier.com",5],["rollingglobe.online",5],["romaierioggi.it",5],["romaniasoft.ro",5],["roms4ever.com",5],["romviet.com",[5,8]],["roshy.tv",5],["roznamasiasat.com",5],["rubyskitchenrecipes.uk",5],["ruyamanga.com",5],["rv-ecommerce.com",5],["ryanmoore.marketing",5],["ryansharich.com",5],["s1os.icu",5],["s4msecurity.com",5],["s920221683.online.de",5],["sabishiidesu.com",5],["saekita.com",5],["samanarthishabd.in",5],["samovies.net",5],["samrudhiglobal.com",5],["samurai.wordoco.com",5],["sanmiguellive.com",5],["santhoshrcf.com",5],["sararun.net",5],["sarkariresult.social",5],["satcesc.com",5],["savegame.pro",5],["sawwiz.com",5],["scansatlanticos.com",5],["schadeck.eu",5],["sezia.com",5],["schildempire.com",5],["scholarshiplist.org",5],["sciencebe21.in",5],["scontianastro.com",5],["scrap-blog.com",5],["scripcheck.great-site.net",5],["scriptsomg.com",5],["searchmovie.wp.xdomain.jp",5],["searchnsucceed.in",5],["seasons-dlove.net",5],["seirsanduk.com",5],["seogroup.bookmarking.info",5],["seoworld.in",5],["seriu.jp",5],["setsuyakutoushi.com",5],["serieshdpormega.com",5],["server-tutorials.net",5],["serverbd247.com",5],["serverxfans.com",5],["shadagetech.com",5],["shanurdu.com",5],["sharphindi.in",5],["sheikhmovies.*",5],["shimauma-log.com",5],["shittokuadult.net",5],["shlly.com",5],["shogaisha-shuro.com",5],["shogaisha-techo.com",5],["shopkensaku.com",5],["shorttrick.in",5],["showflix.*",5],["showrovblog.com",5],["shrinklinker.com",5],["shrinkus.tk",5],["shrivardhantech.in",5],["sieradmu.com",5],["siimanga.cyou",5],["siirtolayhaber.com",5],["sim-kichi.monster",5],["sivackidrum.net",5],["sk8therapy.fr",5],["skardu.pk",5],["skidrowreloaded.com",5],["slawoslaw.pl",5],["slowianietworza.pl",5],["smallseotools.ai",5],["smartinhome.pl",5],["snowman-information.com",5],["socebd.com",5],["sociallyindian.com",5],["softcobra.com",5],["softrop.com",5],["sohohindi.com",5],["sosuroda.pl",5],["south-park-tv.biz",5],["soziologie-politik.de",5],["sp500-up.com",5],["space-faucet.com",5],["spacestation-online.com",5],["spardhanews.com",5],["speak-english.net",5],["speculationis.com",5],["spinoff.link",5],["spiritparting.com",5],["sport-97.com",5],["sportsblend.net",5],["ssdownloader.online",5],["stablediffusionxl.com",5],["stadelahly.net",5],["stahnivideo.cz",5],["starsgtech.in",5],["start-to-run.be",5],["startupjobsportal.com",5],["stbemuiptvn.com",5],["ster-blog.xyz",5],["stimotion.pl",5],["stireazilei.eu",5],["stock-rom.com",5],["streamseeds24.com",5],["strefa.biz",5],["studybullet.com",5],["sufanblog.com",5],["sukuyou.com",5],["sullacollina.it",5],["sumirekeiba.com",5],["sundberg.ws",5],["suneelkevat.com",5],["super-ethanol.com",5],["superpackpormega.com",5],["surgicaltechie.com",5],["suvvehicle.com",5],["swietaslowianskie.pl",5],["symboleslowianskie.pl",5],["sysguides.com",5],["swordalada.org",5],["system32.ink",5],["ta3arof.net",5],["taariikh.net",5],["tabonitobrasil.tv",5],["taisha-diet.com",5],["talentstareducation.com",5],["tamil-lyrics.com",5],["tamilanzone.com",5],["tamilhit.tech",5],["tamilnaadi.com",5],["tamilultra.team",5],["tamilultratv.co.in",5],["tatsublog.com",5],["tbazzar.com",5],["teachersupdates.net",5],["team-octavi.com",5],["team-rcv.xyz",5],["teamkong.tk",5],["teamupinternational.com",5],["techacrobat.com",5],["techastuces.com",5],["techbytesblog.com",5],["techdriod.com",5],["techedubyte.com",5],["techforu.in",5],["techiepirates.com",5],["techiestalk.in",5],["techkeshri.com",5],["techlog.ta-yan.ai",5],["technewslive.org",5],["technewsrooms.com",5],["technicalviral.com",5],["technorj.com",5],["technorozen.com",5],["techoreview.com",5],["techprakash.com",5],["techsbucket.com",5],["techstwo.com",5],["techyhigher.com",5],["techyrick.com",5],["tecnomd.com",5],["tecnoscann.com",5],["tedenglish.site",5],["tehnotone.com",5],["telephone-soudan.com",5],["teluguhitsandflops.com",5],["temporeale.info",5],["tenbaiquest.com",5],["tespedia.com",5],["testious.com",5],["thangdangblog.com",5],["thaript.com",5],["the-mystery.org",5],["theberserkmanga.com",5],["thebigblogs.com",5],["thedilyblog.com",5],["thegnomishgazette.com",5],["theconomy.me",5],["thegamearcade.com",5],["theinternettaughtme.com",5],["thejoblives.com",5],["thelastgamestandingexp.com",5],["theliveupdate.com",5],["thenewsglobe.net",5],["theprofoundreport.com",5],["thermoprzepisy.pl",5],["thesarkariresult.net",5],["thesextube.net",5],["thesleak.com",5],["thesportsupa.com",5],["thewambugu.com",5],["theworldobits.com",5],["thiagorossi.com.br",5],["throwsmallstone.com",5],["tiny-sparklies.com",5],["titfuckvideos.com",5],["tirumalatirupatiyatra.in",5],["tnstudycorner.in",5],["today-obits.com",5],["todays-obits.com",5],["toeflgratis.com",5],["tokoasrimotedanpayet.my.id",5],["toorco.com",5],["top10trends.net",5],["topbiography.co.in",5],["topfaucet.us",5],["topsworldnews.com",5],["toptenknowledge.com",5],["torrentdofilmeshd.net",5],["torrentgame.org",5],["totally.top",5],["towerofgod.top",5],["tr3fit.xyz",5],["transgirlslive.com",5],["trendflatt.com",5],["trendohunts.com",5],["trgtkls.org",5],["trilog3.net",5],["trovapromozioni.it",5],["trucosonline.com",5],["tsubasatr.org",5],["tukangsapu.net",5],["tuktukcinma.com",5],["tunabagel.net",5],["turkeymenus.com",5],["turkishseriestv.net",5],["tutorialesdecalidad.com",5],["tutorialsduniya.com",5],["tuxnews.it",5],["twobluescans.com",5],["tw.xn--h9jepie9n6a5394exeq51z.com",5],["u-idol.com",5],["uciteljica.net",5],["udemyking.com",5],["uiuxsource.com",5],["ukigmoch.com",5],["ultimate-catch.eu",5],["umabomber.com",5],["underground.tboys.ro",5],["unityassets4free.com",5],["uozzart.com",5],["uploadbank.com",5],["uprwssp.org",5],["uqozy.com",5],["usahealthandlifestyle.com",5],["userupload.*",5],["ustimz.com",5],["ustvgo.live",5],["utaitebu.com",5],["utilidades.ecuadjsradiocorp.com",5],["uur-tech.net",5],["vamsivfx.com",5],["varnascan.com",5],["vedetta.org",5],["veganab.co",5],["vegas411.com",5],["venus-and-mars.com",5],["veryfuntime.com",5],["vibezhub.com.ng",5],["viciante.com.br",5],["videodidixx.com",5],["videosgays.net",5],["villettt.kitchen",5],["violablu.net",5],["virabux.com",5],["viralxns.com",5],["virtual-youtuber.jp",5],["visorsmr.com",5],["visortecno.com",5],["vitadacelebrita.com",5],["vivrebordeaux.fr",5],["vmorecloud.com",5],["vnuki.net",5],["voiceloves.com",5],["voidtruth.com",5],["voiranime1.fr",5],["vstplugin.net",5],["warungkomik.com",5],["webacademix.com",5],["webcamfuengirola.com",5],["webcras.com",5],["webhostingoffer.org",5],["websiteglowgh.com",5],["weebee.me",5],["welcometojapan.jp",5],["whats-new.cyou",5],["wheelofgold.com",5],["wholenotism.com",5],["wikijankari.com",5],["wikipooster.com",5],["wikitechy.com",5],["windbreaker.me",5],["windowsaplicaciones.com",5],["wirtualnelegionowo.pl",5],["wirtualnynowydwor.pl",5],["workxvacation.jp",5],["worldgyan18.com",5],["worldtop2.com",5],["worldwidestandard.net",5],["worthitorwoke.com",5],["wp.solar",5],["wpteq.org",5],["writeprofit.org",5],["wvt24.top",5],["xiaomitools.com",5],["xn--algododoce-j5a.com",5],["xn--kckzb2722b.com",5],["xn--n8jwbyc5ezgnfpeyd3i0a3ow693bw65a.com",5],["xn--nbkw38mlu2a.com",5],["xprime4u.*",5],["xpressarticles.com",5],["yakisurume.com",5],["yakyufan-asobiba.com",5],["yamsoti.com",5],["yaspage.com",5],["yawm.online",5],["yazilidayim.net",5],["ycongnghe.com",5],["yestech.xyz",5],["ynk-blog.com",5],["yoshare.net",5],["youlife24.com",5],["youmedemblik.nl",5],["youpit.xyz",5],["your-local-pest-control.com",5],["yourdesignmagazine.com",5],["yuatools.com",5],["yuki0918kw.com",5],["yumekomik.com",5],["yunakhaber.com",5],["yuramanga.my.id",5],["yurudori.com",5],["zecchino-doro.it",5],["zerogptai.org",5],["zien.pl",5],["ziminvestors.com",5],["ziontutorial.com",5],["zippyshare.cloud",5],["zippysharecue.com",5],["znanemediablog.com",5],["zyromod.com",5],["kiemlua.com",5],["link1s.com",5],["bloggingguidance.com",5],["onroid.com",5],["mathcrave.com",5],["intro-hd.net",5],["richtoscan.com",5],["tainguyenmienphi.com",5],["questloops.com",5],["wvt.free.nf",5],["appnee.com",5],["nxbrew.net",6],["tresdaos.com",6],["cinema.com.my",7],["allcelebspics.com",8],["alttyab.net",8],["an1me.*",8],["androjungle.com",8],["arkadmin.fr",8],["azoranov.com",8],["barranquillaestereo.com",8],["brasilsimulatormods.com",8],["cambrevenements.com",8],["cartoonstvonline.com",8],["comparili.net",8],["diaobe.net",8],["filegajah.com",8],["filmestorrent.tv",8],["franceprefecture.fr",8],["freecricket.net",8],["gcpainters.com",8],["germanvibes.org",8],["getmaths.co.uk",8],["gewinnspiele-markt.com",8],["hamzag.com",8],["hannibalfm.net",8],["hornyconfessions.com",8],["ilcamminodiluce.it",8],["joguinhosgratis.com",8],["joziporn.com",8],["justpaste.top",8],["mctechsolutions.in",8],["medibok.se",8],["megafire.net",8],["mirrorpoi.my.id",8],["mockuphunts.com",8],["mortaltech.com",8],["multivideodownloader.com",8],["nauci-engleski.com",8],["nauci-njemacki.com",8],["nekopoi.my.id",8],["nuketree.com",8],["pa1n.xyz",8],["papafoot.*",8],["playertv.net",8],["programsolve.com",8],["radio-deejay.com",8],["ranaaclanhungary.com",8],["rasoi.me",8],["riprendiamocicatania.com",8],["rsrlink.in",8],["seriesperu.com",8],["shmapp.ca",8],["sub2unlocker.com",8],["skillmineopportunities.com",8],["teczpert.com",8],["totalsportek.app",8],["tromcap.com",8],["tv0800.com",8],["tv3monde.com",8],["ustrendynews.com",8],["watchnow.fun",8],["weashare.com",8],["yelitzonpc.com",8],["ymknow.xyz",8],["shomareh-yab.ir",9],["cimanow.cc",10],["freex2line.online",10],["evaki.fun",11],["sportshub.to",11],["sportnews.to",11],["bebasbokep.online",12],["asianboy.fans",13],["bilibili.com",14]]);
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
    try { trustedSuppressNativeMethod(...argsList[i]); }
    catch { }
}

/******************************************************************************/

// End of local scope
})();

void 0;
