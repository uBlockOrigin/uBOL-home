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
const argsList = [["Element.prototype.insertAdjacentHTML","\"afterbegin\"","prevent","/\\/[A-Za-z]+\\.min\\.js\\?/"],["eval","\"/chp_?ad/\""],["eval","\"/chp_?ad/\"","prevent"],["HTMLScriptElement.prototype.setAttribute","\"data-sdk\"","abort"],["eval","\"adsBlocked\""],["Storage.prototype.setItem","searchCount"],["fetch","\"flashtalking\""],["DOMTokenList.prototype.add","\"-\""],["HTMLScriptElement.prototype.setAttribute","\"data-cfasync\"","abort"],["DOMTokenList.prototype.add","\"-\"","prevent","stack","/wp-content\\/uploads\\/[a-z]+\\/[a-z]+\\.js/"],["navigator.sendBeacon","\"data.bilibili.com/log/\"","prevent"]];
const hostnamesMap = new Map([["pvpoke-re.com",0],["zegtrends.com",1],["tea-coffee.net",1],["spatsify.com",1],["newedutopics.com",1],["getviralreach.in",1],["edukaroo.com",1],["funkeypagali.com",1],["careersides.com",1],["nayisahara.com",1],["wikifilmia.com",1],["infinityskull.com",1],["viewmyknowledge.com",1],["iisfvirtual.in",1],["starxinvestor.com",1],["jkssbalerts.com",1],["acetack.com",1],["blog.carstopia.net",1],["blog.carsmania.net",1],["redfea.com",1],["pranarevitalize.com",1],["techyinfo.in",1],["fitnessholic.net",1],["moderngyan.com",1],["sattakingcharts.in",1],["freshbhojpuri.com",1],["bgmi32bitapk.in",1],["bankshiksha.in",1],["earn.mpscstudyhub.com",1],["earn.quotesopia.com",1],["money.quotesopia.com",1],["best-mobilegames.com",1],["learn.moderngyan.com",1],["bharatsarkarijobalert.com",1],["quotesopia.com",1],["creditsgoal.com",1],["ikramlar.online",1],["headlinerpost.com",1],["posterify.net",1],["whatgame.xyz",1],["mooonten.com",1],["msic.site",1],["fx-22.com",1],["gold-24.net",1],["forexrw7.com",1],["mtcremix.com",1],["advicefunda.com",1],["bestloanoffer.net",1],["computerpedia.in",1],["techconnection.in",1],["bollywoodchamp.in",1],["texw.online",1],["10-train.com",1],["110tutorials.com",1],["103.74.5.104",1],["185.193.17.214",1],["207hd.com",1],["247beatz.ng",1],["247footballnow.com",1],["24pdd.*",1],["27-sidefire-blog.com",1],["2best.club",1],["2the.space",1],["2ix2.com",1],["30kaiteki.com",1],["3dassetcollection.com",1],["3gpterbaru.com",1],["3dyasan.com",1],["3fnews.com",1],["3rabsports.com",1],["4drumkits.com",1],["4fans.gay",1],["4fingermusic.com",1],["4gousya.net",1],["4horlover.com",1],["4spaces.org",1],["519.best",1],["51sec.org",1],["80-talet.se",1],["9ketsuki.info",1],["a2zbookmark.com",1],["aboedman.com",1],["addtobucketlist.com",1],["adisann.com",1],["adminreboot.com",1],["adsurfle.com",1],["adsy.pw",1],["advertafrica.net",1],["adnan-tech.com",1],["africue.com",1],["aghasolution.com",1],["airportwebcams.net",1],["aitoolsfree.org",1],["aitohuman.org",1],["akihabarahitorigurasiseikatu.com",1],["akuebresources.com",1],["alanyapower.com",1],["albania.co.il",1],["albinofamily.com",1],["alexbacher.fr",1],["algodaodocescan.com.br",1],["allcalidad.app",1],["allcelebritywiki.com",1],["allcivilstandard.com",1],["alliptvlinks.com",1],["alliptvs.com",1],["almofed.com",1],["alphasource.site",1],["altcryp.com",1],["altselection.com",1],["altyazitube22.lat",1],["amaturehomeporn.com",1],["amnaymag.com",1],["amritadrino.com",1],["amtil.com.au",1],["analysis-chess.io.vn",1],["andani.net",1],["androidadult.com",1],["androidfacil.org",1],["angolopsicologia.com",1],["animalwebcams.net",1],["anime4mega.net",1],["anime4mega-descargas.net",1],["anime7.download",1],["anime-torrent.com",1],["animecenterbr.com",1],["animesonlineshd.com",1],["animetwixtor.com",1],["animexin.vip",1],["anmup.com.np",1],["anodee.com",1],["anonyviet.com",1],["anothergraphic.org",1],["aoseugosto.com",1],["aozoraapps.net",1],["apenasmaisumyaoi.com",1],["apkdink.com",1],["apostoliclive.com",1],["appdoze.*",1],["applediagram.com",1],["aprenderquechua.com",1],["arabstd.com",1],["arti-flora.nl",1],["articlebase.pk",1],["articlesmania.me",1],["ascalonscans.com",1],["asiansexdiarys.com",1],["askcerebrum.com",1],["askushowto.com",1],["aspirapolveremigliori.it",1],["assignmentdon.com",1],["astroages.com",1],["astrumscans.xyz",1],["atemporal.cloud",1],["atgstudy.com",1],["atlantisscan.com",1],["atleticalive.it",1],["audiobookexchangeplace.com",1],["audiotools.*",1],["audiotrip.org",1],["autocadcommand.com",1],["autodime.com",1],["autoindustry.ro",1],["automat.systems",1],["automothink.com",1],["autosport.*",1],["avitter.net",1],["awpd24.com",1],["ayatoon.com",1],["ayuka.link",1],["azamericasat.net",1],["azdly.com",1],["azores.co.il",1],["azrom.net",1],["babehubonlyfansly.com",1],["backyardpapa.com",1],["baithak.news",1],["baixedetudo.com.br",1],["balkanteka.net",1],["bandstand.ph",1],["batman.city",1],["bcanepaltu.com",1],["bcanotesnepal.com",1],["bcsnoticias.mx",1],["bdix.app",1],["bdokan.com",1],["bdsomadhan.com",1],["bdstarshop.com",1],["beaddiagrams.com",1],["bearchasingart.com",1],["beatree.cn",1],["bedavahesap.org",1],["beisbolinvernal.com",1],["bengalxpress.in",1],["beasttips.com",1],["berlin-teltow.de",1],["beruhmtemedien.com",1],["bestofarea.com",1],["bettingexchange.it",1],["bi-girl.net",1],["bibliotecadecorte.com",1],["bibliotecahermetica.com.br",1],["bidersnotu.com",1],["bif24.pl",1],["biftutech.com",1],["bigdata-social.com",1],["bimshares.com",1],["bishalghale.com.np",1],["bitcotasks.com",1],["bitlikutu.com",1],["bittukitech.in",1],["bitview.cloud",1],["bitzite.com",1],["blog.motionisland.com",1],["blog24.me",1],["blogk.com",1],["blogue.tech",1],["bloooog.it",1],["bloxyscripts.com",1],["bluebuddies.com",1],["bluecoreinside.com",1],["blurayufr.cam",1],["bogowieslowianscy.pl",1],["bookpraiser.com",1],["booksbybunny.com",1],["boredgiant.com",1],["botinnifit.com",1],["boundlessnecromancer.com",1],["boxaoffrir.com",1],["boxingvideo.org",1],["boxofficebusiness.in",1],["boystube.link",1],["braziliannr.com",1],["brevi.eu",1],["brian70.tw",1],["bright-b.com",1],["brightpets.org",1],["broadbottomvillage.co.uk",1],["brokensilenze.net",1],["brulosophy.com",1],["brushednickel.biz",1],["bshifast.live",1],["bsmaurya.com",1],["bugswave.com",1],["businesstrend.jp",1],["byswiizen.fr",1],["cafenau.com",1],["calculascendant.com",1],["calmarkcovers.com",1],["calvyn.com",1],["camcam.cc",1],["camnang24h.net",1],["canadanouvelles.com",1],["canaltdt.es",1],["canzoni-per-bambini.it",1],["captionpost.com",1],["carryflix.icu",1],["cashkar.in",1],["casperhd.com",1],["catatanonline.com",1],["catmovie.website",1],["cavalierstream.fr",1],["celebritablog.com",1],["celemusic.com",1],["celestialtributesonline.com",1],["cembarut.com.tr",1],["certificateland.com",1],["cg-method.com",1],["chachocool.com",1],["chakrirkhabar247.in",1],["championpeoples.com",1],["chanjaeblog.jp",1],["change-ta-vie-coaching.com",1],["charlottepilgrimagetour.com",1],["charpatra.com",1],["chart.services",1],["chatgbt.one",1],["chatgptfree.ai",1],["cheatermad.com",1],["check-imei.info",1],["cheese-cake.net",1],["chelsea24news.pl",1],["chevalmag.com",1],["chieflyoffer.com",1],["chihouban.com",1],["chikonori.com",1],["chineseanime.org",1],["christiantrendy.com",1],["cienagamagdalena.com",1],["cimbusinessevents.com.au",1],["cinema-sketch.com",1],["cinepiroca.com",1],["cizzyscripts.com",1],["claimclicks.com",1],["claydscap.com",1],["clockskin.us",1],["cloud9obits.com",1],["cocorip.net",1],["code-source.net",1],["codeandkey.com",1],["codeastro.com",1],["codeitworld.com",1],["codemystery.com",1],["coderblog.in",1],["codewebit.top",1],["coin-profits.xyz",1],["coinadpro.club",1],["coinbaby8.com",1],["coingraph.us",1],["cola16.app",1],["coleccionmovie.com",1],["colliersnews.com",1],["comeletspray.com",1],["cometogliere.com",1],["comoinstalar.me",1],["compota-soft.work",1],["conoscereilrischioclinico.it",1],["consigliatodanoi.it",1],["constructionmethodology.com",1],["constructionplacement.org",1],["cookni.net",1],["correction-livre-scolaire.fr",1],["coursesdaddy.com",1],["cpscan.xyz",1],["crackcodes.in",1],["crackthemes.com",1],["crackwatch.eu",1],["craigretailers.co.uk",1],["crazyashwin.com",1],["crazydeals.live",1],["creebhills.com",1],["creepyscans.com",1],["cricket12.com",1],["crn.pl",1],["cronachesalerno.it",1],["crunchytech.net",1],["cryptonor.xyz",1],["cryptonworld.space",1],["cryptotech.fun",1],["cryptowidgets.net",1],["crystalcomics.com",1],["cta-fansite.com",1],["cuckoldsex.net",1],["culture-informatique.net",1],["cykf.net",1],["cyprus.co.il",1],["daemon-hentai.com",1],["daij1n.info",1],["dailykpop.net",1],["dailytechupdates.in",1],["dailytips247.com",1],["dailyweb.pl",1],["davewigstone.com",1],["davidsonbuilders.com",1],["dabangbastar.com",1],["day4news.com",1],["daybuy.tw",1],["deathonnews.com",1],["dejongeturken.com",1],["delvein.tech",1],["demonictl.com",1],["demonyslowianskie.pl",1],["demooh.com",1],["depressionhurts.us",1],["derusblog.com",1],["descargaranimes.com",1],["descargaseriestv.com",1],["design4months.com",1],["desirenovel.com",1],["desktopsolution.org",1],["destakenewsgospel.com",1],["destinationsjourney.com",1],["detikbangka.com",1],["deutschpersischtv.com",1],["dev-dark-blog.pantheonsite.io",1],["devopslanka.com",1],["dewfuneralhomenews.com",1],["dhankasamaj.com",1],["diamondfansub.com",1],["diarioeducacion.com",1],["diencobacninh.com",1],["digitalseoninja.com",1],["dignityobituary.com",1],["dinheirocursosdownload.com",1],["diplomaexamcorner.com",1],["dipprofit.com",1],["dir-tech.com",1],["diskizone.com",1],["diversanews.com",1],["diyprojectslab.com",1],["djqunjab.in",1],["djsofchhattisgarh.in",1],["djstar.in",1],["dma-upd.org",1],["dobleaccion.xyz",1],["dobletecno.com",1],["domainregistrationtips.info",1],["dominican-republic.co.il",1],["donghuaworld.com",1],["donlego.com",1],["doublemindtech.com",1],["doumura.com",1],["downloadbatch.me",1],["downloader.is",1],["downloads.sayrodigital.net",1],["downloads.wegomovies.com",1],["downloadtanku.org",1],["dpscomputing.com",1],["drake-scans.com",1],["drakecomic.com",1],["dramafren.com",1],["dramaviki.com",1],["drzna.com",1],["dubaitime.net",1],["dumovies.com",1],["dvd-flix.com",1],["dvdgayonline.com",1],["e-food.jp",1],["e-kakoh.com",1],["earlymemorials.com",1],["earninginwork.com",1],["easyjapanesee.com",1],["easytodoit.com",1],["ecommercewebsite.store",1],["eczpastpapers.net",1],["editions-actu.org",1],["editorsadda.com",1],["edivaldobrito.com.br",1],["edjerba.com",1],["edukamer.info",1],["egram.com.ng",1],["einewelteinezukunft.de",1],["elcriticodelatele.com",1],["elcultura.pl",1],["elearning-cpge.com",1],["eleceedmanhwa.me",1],["electricalstudent.com",1],["embraceinnerchaos.com",1],["emperorscan.com",1],["empleo.com.uy",1],["encuentratutarea.com",1],["encurtareidog.top",1],["eng-news.com",1],["english-dubbed.com",1],["english-topics.com",1],["english101.co.za",1],["enryumanga.com",1],["ensenchat.com",1],["entenpost.com",1],["epsilonakdemy.com",1],["eramuslim.com",1],["erreguete.gal",1],["ervik.as",1],["esportsmonk.com",1],["esportsnext.com",1],["et-invest.de",1],["eternalhonoring.com",1],["ethiopia.co.il",1],["evdeingilizcem.com",1],["eventiavversinews.*",1],["everydayhomeandgarden.com",1],["evlenmekisteyenbayanlar.net",1],["ewybory.eu",1],["exam-results.in",1],["exeking.top",1],["expertskeys.com",1],["eymockup.com",1],["ezmanga.net",1],["faaduindia.com",1],["fapfapgames.com",1],["fapkingsxxx.com",1],["faqwiki.us",1],["farolilloteam.es",1],["fattelodasolo.it",1],["fchopin.net",1],["felicetommasino.com",1],["femisoku.net",1],["ferdroid.net",1],["fessesdenfer.com",1],["feyorra.top",1],["fhedits.in",1],["fhmemorial.com",1],["fibwatch.store",1],["filmypoints.in",1],["finalnews24.com",1],["financeandinsurance.xyz",1],["financeyogi.net",1],["financid.com",1],["finclub.in",1],["findheman.com",1],["findnewjobz.com",1],["fine-wings.com",1],["firescans.xyz",1],["fitnesshealtharticles.com",1],["fitnessscenz.com",1],["flashssh.net",1],["fleamerica.com",1],["flexamens.com",1],["flixhub.*",1],["flordeloto.site",1],["flowsnet.com",1],["folkmord.se",1],["foodgustoso.it",1],["foodiesjoy.com",1],["footeuses.com",1],["footyload.com",1],["footymercato.com",1],["forex-yours.com",1],["forexcracked.com",1],["former-railroad-worker.com",1],["foxaholic.com",1],["francaisfacile.net",1],["free.7hd.club",1],["freebiesmockup.com",1],["freecoursesonline.me",1],["freedom3d.art",1],["freefiremaxofficial.com",1],["freefireupdate.com",1],["freegetcoins.com",1],["freelancerartistry.com",1],["freemedicalbooks.org",1],["freemockups.org",1],["freemovies-download.com",1],["freeoseocheck.com",1],["freepasses.org",1],["freescorespiano.com",1],["freetarotonline.com",1],["freetubetv.net",1],["freevstplugins.*",1],["freewoodworking.ca",1],["fresherbaba.com",1],["freshersgold.com",1],["friedrichshainblog.de",1],["frpgods.com",1],["ftuapps.*",1],["fumettologica.it",1],["funeral-memorial.com",1],["funeralmemorialnews.com",1],["funeralobitsmemorial.com",1],["funztv.com",1],["futbolenlatelevision.com",1],["gabrielcoding.com",1],["gadgetspidy.com",1],["gadgetxplore.com",1],["gahag.net",1],["galaxytranslations10.com",1],["galaxytranslations97.com",1],["galinhasamurai.com",1],["game5s.com",1],["gameblog.jp",1],["gamefi-mag.com",1],["gamenv.net",1],["gamers-haven.org",1],["gamerxyt.com",1],["games-manuals.com",1],["gamevcore.com",1],["gaminglariat.com",1],["gamingsearchjournal.com",1],["ganzoscan.com",1],["gatagata.net",1],["gaypornhdfree.com",1],["gazetazachodnia.eu",1],["gdrivemovies.xyz",1],["geekering.com",1],["gemiadamlari.org",1],["gentiluomodigitale.it",1],["gesund-vital.online",1],["getsuicidegirlsfree.com",1],["getworkation.com",1],["ghostsfreaks.com",1],["girlydrop.com",1],["gisvacancy.com",1],["giuseppegravante.com",1],["gkbooks.in",1],["gkgsca.com",1],["gksansar.com",1],["glo-n.online",1],["globelempire.com",1],["gnusocial.jp",1],["goegoe.net",1],["gogetadoslinks.*",1],["gogetapast.com.br",1],["gogifox.com",1],["gogueducation.com",1],["gokerja.net",1],["gokushiteki.com",1],["golf.rapidmice.com",1],["gomov.bio",1],["goodriviu.com",1],["googlearth.selva.name",1],["gorating.in",1],["gotocam.net",1],["grafikos.cz",1],["grasta.net",1],["grazymag.com",1],["greasygaming.com",1],["greattopten.com",1],["grootnovels.com",1],["gsdn.live",1],["gsmfreezone.com",1],["gsmmessages.com",1],["gtavi.pl",1],["gurbetseli.net",1],["gvnvh.net",1],["gwiazdatalkie.com",1],["habuteru.com",1],["hackingwala.com",1],["hackmodsapk.com",1],["hadakanonude.com",1],["hairjob.wpx.jp",1],["happy-otalife.com",1],["haqem.com",1],["harbigol.com",1],["harley.top",1],["haryanaalert.*",1],["haveyaseenjapan.com",1],["haxnode.net",1],["hdhub4one.pics",1],["hbnews24.com",1],["healthbeautybee.com",1],["healthcheckup.com",1],["healthfatal.com",1],["heartofvicksburg.com",1],["heartrainbowblog.com",1],["hechos.net",1],["hellenism.net",1],["heutewelt.com",1],["hhesse.de",1],["highdefdiscnews.com",1],["hilaw.vn",1],["hindi.trade",1],["hindimatrashabd.com",1],["hindinest.com",1],["hindishri.com",1],["hiphopa.net",1],["hipsteralcolico.altervista.org",1],["historichorizons.com",1],["hivetoon.com",1],["hobbykafe.com",1],["hockeyfantasytools.com",1],["hoegel-textildruck.de",1],["hojii.net",1],["hoofoot.net",1],["hookupnovel.com",1],["hopsion-consulting.com",1],["hostingreviews24.com",1],["hotspringsofbc.ca",1],["howtoblogformoney.net",1],["hub2tv.com",1],["hungarianhardstyle.hu",1],["hyderone.com",1],["hyogo.ie-t.net",1],["hypelifemagazine.com",1],["hypesol.com",1],["ideatechy.com",1],["idesign.wiki",1],["idevfast.com",1],["idevice.me",1],["idpvn.com",1],["iggtech.com",1],["ignoustudhelp.in",1],["ikarianews.gr",1],["ilbassoadige.it",1],["ilbolerodiravel.org",1],["imperiofilmes.co",1],["indiasmagazine.com",1],["individualogist.com",1],["inertz.org",1],["infamous-scans.com",1],["infocycles.com",1],["infodani.net",1],["infojabarloker.com",1],["infokita17.com",1],["informatudo.com.br",1],["infrafandub.com",1],["infulo.com",1],["inlovingmemoriesnews.com",1],["inprogrammer.com",1],["inra.bg",1],["insideeducation.co.za",1],["insidememorial.com",1],["insider-gaming.com",1],["insurancepost.xyz",1],["intelligence-console.com",1],["interculturalita.it",1],["inventionsdaily.com",1],["iptvxtreamcodes.com",1],["isabihowto.com.ng",1],["italiadascoprire.net",1],["itdmusic.*",1],["itmaniatv.com",1],["itopmusic.com",1],["itopmusics.com",1],["itopmusicx.com",1],["itz-fast.com",1],["iumkit.net",1],["iwb.jp",1],["jackofalltradesmasterofsome.com",1],["jaktsidan.se",1],["japannihon.com",1],["javboys.*",1],["javcock.com",1],["javgay.com",1],["jcutrer.com",1],["jk-market.com",1],["jobsbd.xyz",1],["jobsibe.com",1],["jobslampung.net",1],["josemo.com",1],["jra.jpn.org",1],["jrlinks.in",1],["jungyun.net",1],["juninhoscripts.com.br",1],["juventusfc.hu",1],["kacengeng.com",1],["kacikcelebrytow.com",1],["kagohara.net",1],["kakashiyt.com",1],["kakiagune.com",1],["kali.wiki",1],["kana-mari-shokudo.com",1],["kanaeblog.net",1],["kandisvarlden.com",1],["karaoke4download.com",1],["kattannonser.se",1],["kawaguchimaeda.com",1],["kaystls.site",1],["kenkou-maintenance.com",1],["kenta2222.com",1],["keroseed.*",1],["kgs-invest.com",1],["kh-pokemon-mc.com",1],["khabarbyte.com",1],["khabardinbhar.net",1],["khohieu.com",1],["kickcharm.com",1],["kinisuru.com",1],["kits4beats.com",1],["kllproject.lv",1],["know-how-tree.com",1],["knowstuff.in",1],["kobitacocktail.com",1],["kodaika.com",1],["kodewebsite.com",1],["kodibeginner.com",1],["kokosovoulje.com",1],["kolcars.shop",1],["kompiko.pl",1],["koreanbeauty.club",1],["korogashi-san.org",1],["korsrt.eu.org",1],["kotanopan.com",1],["koume-in-huistenbosch.net",1],["krx18.com",1],["kukni.to",1],["kupiiline.com",1],["kurosuen.live",1],["labstory.in",1],["lacrima.jp",1],["ladkibahin.com",1],["ladypopularblog.com",1],["lamorgues.com",1],["lampungkerja.com",1],["lapaginadealberto.com",1],["lascelebrite.com",1],["latinlucha.es",1],["law101.org.za",1],["lawweekcolorado.com",1],["lawyercontact.us",1],["learnedclub.com",1],["learnmany.in",1],["learnchannel-tv.com",1],["learnodo-newtonic.com",1],["learnospot.com",1],["lebois-racing.com",1],["lectormh.com",1],["leechyscripts.net",1],["leeapk.com",1],["legendaryrttextures.com",1],["lendrive.web.id",1],["lespartisanes.com",1],["letrasgratis.com.ar",1],["levismodding.co.uk",1],["lgcnews.com",1],["lglbmm.com",1],["lheritierblog.com",1],["librasol.com.br",1],["ligaset.com",1],["limontorrent.com",1],["limontorrents.com",1],["linkskibe.com",1],["linkvoom.com",1],["linkz.*",1],["linux-talks.com",1],["linuxexplain.com",1],["lionsfan.net",1],["literarysomnia.com",1],["littlepandatranslations.com",1],["livefootballempire.com",1],["lk21org.com",1],["lmtos.com",1],["loanpapa.in",1],["locurainformaticadigital.com",1],["logofootball.net",1],["lookism.me",1],["lotus-tours.com.hk",1],["lovingsiren.com",1],["ltpcalculator.in",1],["luchaonline.com",1],["luciferdonghua.in",1],["lucrebem.com.br",1],["lustesthd.cloud",1],["lustesthd.lat",1],["lycee-maroc.com",1],["m4u.*",1],["macrocreator.com",1],["madevarquitectos.com",1],["magesypro.*",1],["maisondeas.com",1],["maketoss.com",1],["makeupguide.net",1],["makotoichikawa.net",1],["malluporno.com",1],["mamtamusic.in",1],["mangcapquangvnpt.com",1],["manhastro.com",1],["mantrazscan.com",1],["maps4study.com.br",1],["marimo-info.net",1],["marketedgeofficial.com",1],["marketing-business-revenus-internet.fr",1],["marketrevolution.eu",1],["masashi-blog418.com",1],["mastakongo.info",1],["masterpctutoriales.com",1],["maths101.co.za",1],["matomeiru.com",1],["matshortener.xyz",1],["mcrypto.*",1],["mdn.lol",1],["medeberiya1.com",1],["mediascelebres.com",1],["medytour.com",1],["meilblog.com",1],["memorialnotice.com",1],["mentalhealthcoaching.org",1],["meteoregioneabruzzo.it",1],["mewingzone.com",1],["mhscans.com",1],["michiganrugcleaning.cleaning",1],["midis.com.ar",1],["midlandstraveller.com",1],["minddesignclub.org",1],["minecraftwild.com",1],["minhasdelicias.com",1],["mitaku.net",1],["mitsmits.com",1],["mixmods.com.br",1],["mm-scans.org",1],["mmfenix.com",1],["mmoovvfr.cloudfree.jp",1],["mmorpgplay.com.br",1],["mockupcity.com",1],["mockupgratis.com",1],["modele-facture.com",1],["modyster.com",1],["monaco.co.il",1],["morinaga-office.net",1],["mosttechs.com",1],["moto-station.com",1],["motofan-r.com",1],["movieping.com",1],["movies4u.*",1],["moviesnipipay.me",1],["mrfreemium.blogspot.com",1],["mscdroidlabs.es",1],["msonglyrics.com",1],["mtech4you.com",1],["multimovies.tech",1],["mummumtime.com",1],["mundovideoshd.com",1],["murtonroofing.com",1],["musicforchoir.com",1],["musictip.net",1],["mxcity.mx",1],["mxpacgroup.com",1],["my-ford-focus.de",1],["myglamwish.com",1],["myicloud.info",1],["mylinkat.com",1],["mylivewallpapers.com",1],["mypace.sasapurin.com",1],["myqqjd.com",1],["mytectutor.com",1],["myunity.dev",1],["myviptuto.com",1],["nagpurupdates.com",1],["naijagists.com",1],["naijdate.com",1],["najboljicajevi.com",1],["nakiny.com",1],["nameart.in",1],["nartag.com",1],["naturalmentesalute.org",1],["naturomicsworld.com",1],["naveedplace.com",1],["navinsamachar.com",1],["neet.wasa6.com",1],["negative.tboys.ro",1],["neifredomar.com",1],["nekoscans.com",1],["nemumemo.com",1],["nepaljobvacancy.com",1],["neservicee.com",1],["netsentertainment.net",1],["neuna.net",1],["newbookmarkingsite.com",1],["newfreelancespot.com",1],["newlifefuneralhomes.com",1],["news-geinou100.com",1],["newscard24.com",1],["newstechone.com",1],["nghetruyenma.net",1],["nhvnovels.com",1],["nichetechy.com",1],["nin10news.com",1],["nicetube.one",1],["ninjanovel.com",1],["nishankhatri.*",1],["niteshyadav.in",1],["nknews.jp",1],["nkreport.jp",1],["noanyi.com",1],["nobodycancool.com",1],["noblessetranslations.com",1],["nocfsb.com",1],["nocsummer.com.br",1],["nodenspace.com",1],["noikiiki.info",1],["notandor.cn",1],["note1s.com",1],["notesformsc.org",1],["noteshacker.com",1],["novel-gate.com",1],["novelbob.com",1],["novelread.co",1],["nsfwr34.com",1],["nswdownload.com",1],["nswrom.com",1],["ntucgm.com",1],["nudeslegion.com",1],["nukedfans.com",1],["nukedpacks.site",1],["nulledmug.com",1],["nvimfreak.com",1],["nyangames.altervista.org",1],["nylonstockingsex.net",1],["oatuu.org",1],["oberschwaben-tipps.de",1],["obituary-deathnews.com",1],["obituaryupdates.com",1],["odekake-spots.com",1],["officialpanda.com",1],["ofppt.net",1],["ofwork.net",1],["okblaz.me",1],["olamovies.store",1],["onehack.us",1],["onestringlab.com",1],["onlinetechsamadhan.com",1],["onlinetntextbooks.com",1],["onneddy.com",1],["onyxfeed.com",1],["openstartup.tm",1],["opiniones-empresas.com",1],["oracleerpappsguide.com",1],["orenoraresne.com",1],["oromedicine.com",1],["orunk.com",1],["osteusfilmestuga.online",1],["otakuliah.com",1],["oteknologi.com",1],["otokukensaku.jp",1],["ottrelease247.com",1],["ovnihoje.com",1],["pabryyt.one",1],["palofw-lab.com",1],["paminy.com",1],["pandaatlanta.com",1],["pandanote.info",1],["pantube.top",1],["paolo9785.com",1],["papafoot.click",1],["papahd.club",1],["paris-tabi.com",1],["parisporn.org",1],["parking-map.info",1],["pasokau.com",1],["passionatecarbloggers.com",1],["passportaction.com",1],["pc-guru.it",1],["pc-hobby.com",1],["pc-spiele-wiese.de",1],["pcgamedownload.net",1],["pcgameszone.com",1],["pdfstandards.net",1],["pepar.net",1],["personefamose.it",1],["petitestef.com",1],["pflege-info.net",1],["phoenix-manga.com",1],["phonefirmware.com",1],["physics101.co.za",1],["picgiraffe.com",1],["pilsner.nu",1],["piratemods.com",1],["piximfix.com",1],["plantatreenow.com",1],["plc4free.com",1],["pliroforiki-edu.gr",1],["poapan.xyz",1],["poco.rcccn.in",1],["pogga.org",1],["pokeca-chart.com",1],["pondit.xyz",1],["ponsel4g.com",1],["poplinks.*",1],["porlalibreportal.com",1],["pornfeel.com",1],["porninblack.com",1],["portaldoaz.org",1],["portaldosreceptores.org",1],["portalyaoi.com",1],["postazap.com",1],["posturecorrectorshop-online.com",1],["practicalkida.com",1],["prague-blog.co.il",1],["praveeneditz.com",1],["premierftp.com",1],["prensa.click",1],["prensaesports.com",1],["pressemedie.dk",1],["pressurewasherpumpdiagram.com",1],["pricemint.in",1],["primemovies.pl",1],["prismmarketingco.com",1],["proapkdown.com",1],["projuktirkotha.com",1],["promiblogs.de",1],["promimedien.com",1],["promisingapps.com",1],["protestia.com",1],["psicotestuned.info",1],["psychology-spot.com",1],["publicdomainq.net",1],["publicdomainr.net",1],["publicidadtulua.com",1],["pupuweb.com",1],["putlog.net",1],["pynck.com",1],["quatvn.club",1],["questionprimordiale.fr",1],["quicktelecast.com",1],["radiantsong.com",1],["rabo.no",1],["ragnarokscanlation.*",1],["rahim-soft.com",1],["rail-log.net",1],["railwebcams.net",1],["raishin.xyz",1],["ralli.ee",1],["ranjeet.best",1],["ranourano.xyz",1],["raulmalea.ro",1],["rbs.ta36.com",1],["rbscripts.net",1],["rctechsworld.in",1],["readfast.in",1],["readhunters.xyz",1],["realfreelancer.com",1],["realtormontreal.ca",1],["receptyonline.cz",1],["recipenp.com",1],["redbubbletools.com",1],["redfaucet.site",1],["reeell.com",1],["renierassociatigroup.com",1],["reportbangla.com",1],["reprezentacija.rs",1],["retire49.com",1],["retrotv.org",1],["reviewmedium.com",1],["revistaapolice.com.br",1],["rgmovies.*",1],["ribbelmonster.de",1],["rightdark-scan.com",1],["rinconpsicologia.com",1],["ritacandida.com",1],["riwayat-word.com",1],["rlshort.com",1],["rocdacier.com",1],["rollingglobe.online",1],["romaierioggi.it",1],["romaniasoft.ro",1],["roms4ever.com",1],["romviet.com",[1,4]],["roshy.tv",1],["roznamasiasat.com",1],["rubyskitchenrecipes.uk",1],["ruyamanga.com",1],["rv-ecommerce.com",1],["ryanmoore.marketing",1],["ryansharich.com",1],["s1os.icu",1],["s4msecurity.com",1],["s920221683.online.de",1],["sabishiidesu.com",1],["saekita.com",1],["samanarthishabd.in",1],["samovies.net",1],["samrudhiglobal.com",1],["samurai.wordoco.com",1],["sanmiguellive.com",1],["santhoshrcf.com",1],["sararun.net",1],["sarkariresult.social",1],["satcesc.com",1],["savegame.pro",1],["sawwiz.com",1],["scansatlanticos.com",1],["schadeck.eu",1],["sezia.com",1],["schildempire.com",1],["scholarshiplist.org",1],["sciencebe21.in",1],["scontianastro.com",1],["scrap-blog.com",1],["scripcheck.great-site.net",1],["scriptsomg.com",1],["searchmovie.wp.xdomain.jp",1],["searchnsucceed.in",1],["seasons-dlove.net",1],["seirsanduk.com",1],["seogroup.bookmarking.info",1],["seoworld.in",1],["seriu.jp",1],["setsuyakutoushi.com",1],["serieshdpormega.com",1],["server-tutorials.net",1],["serverbd247.com",1],["serverxfans.com",1],["shadagetech.com",1],["shanurdu.com",1],["sharphindi.in",1],["sheikhmovies.*",1],["shimauma-log.com",1],["shittokuadult.net",1],["shlly.com",1],["shogaisha-shuro.com",1],["shogaisha-techo.com",1],["shopkensaku.com",1],["shorttrick.in",1],["showflix.*",1],["showrovblog.com",1],["shrinklinker.com",1],["shrinkus.tk",1],["shrivardhantech.in",1],["sieradmu.com",1],["siimanga.cyou",1],["siirtolayhaber.com",1],["sim-kichi.monster",1],["sivackidrum.net",1],["sk8therapy.fr",1],["skardu.pk",1],["skidrowreloaded.com",1],["slawoslaw.pl",1],["slowianietworza.pl",1],["smallseotools.ai",1],["smartinhome.pl",1],["snowman-information.com",1],["socebd.com",1],["sociallyindian.com",1],["softcobra.com",1],["softrop.com",1],["sohohindi.com",1],["sosuroda.pl",1],["south-park-tv.biz",1],["soziologie-politik.de",1],["sp500-up.com",1],["space-faucet.com",1],["spacestation-online.com",1],["spardhanews.com",1],["speak-english.net",1],["speculationis.com",1],["spinoff.link",1],["spiritparting.com",1],["sport-97.com",1],["sportsblend.net",1],["ssdownloader.online",1],["stablediffusionxl.com",1],["stadelahly.net",1],["stahnivideo.cz",1],["starsgtech.in",1],["start-to-run.be",1],["startupjobsportal.com",1],["stbemuiptvn.com",1],["ster-blog.xyz",1],["stimotion.pl",1],["stireazilei.eu",1],["stock-rom.com",1],["streamseeds24.com",1],["strefa.biz",1],["studybullet.com",1],["sufanblog.com",1],["sukuyou.com",1],["sullacollina.it",1],["sumirekeiba.com",1],["sundberg.ws",1],["suneelkevat.com",1],["super-ethanol.com",1],["superpackpormega.com",1],["surgicaltechie.com",1],["swietaslowianskie.pl",1],["symboleslowianskie.pl",1],["sysguides.com",1],["swordalada.org",1],["system32.ink",1],["ta3arof.net",1],["taariikh.net",1],["tabonitobrasil.tv",1],["taisha-diet.com",1],["talentstareducation.com",1],["tamil-lyrics.com",1],["tamilanzone.com",1],["tamilhit.tech",1],["tamilnaadi.com",1],["tamilultra.team",1],["tamilultratv.co.in",1],["tatsublog.com",1],["tbazzar.com",1],["teachersupdates.net",1],["team-octavi.com",1],["team-rcv.xyz",1],["teamkong.tk",1],["teamupinternational.com",1],["techacrobat.com",1],["techastuces.com",1],["techbytesblog.com",1],["techdriod.com",1],["techedubyte.com",1],["techforu.in",1],["techiepirates.com",1],["techiestalk.in",1],["techkeshri.com",1],["techlog.ta-yan.ai",1],["technewslive.org",1],["technewsrooms.com",1],["technicalviral.com",1],["technorj.com",1],["technorozen.com",1],["techoreview.com",1],["techprakash.com",1],["techsbucket.com",1],["techstwo.com",1],["techyhigher.com",1],["techyrick.com",1],["tecnomd.com",1],["tecnoscann.com",1],["tedenglish.site",1],["tehnotone.com",1],["telephone-soudan.com",1],["teluguhitsandflops.com",1],["temporeale.info",1],["tenbaiquest.com",1],["tespedia.com",1],["testious.com",1],["thangdangblog.com",1],["thaript.com",1],["the-mystery.org",1],["theberserkmanga.com",1],["thebigblogs.com",1],["thedilyblog.com",1],["thegnomishgazette.com",1],["theconomy.me",1],["thegamearcade.com",1],["theinternettaughtme.com",1],["thejoblives.com",1],["thelastgamestandingexp.com",1],["theliveupdate.com",1],["thenewsglobe.net",1],["theprofoundreport.com",1],["thermoprzepisy.pl",1],["thesarkariresult.net",1],["thesextube.net",1],["thesleak.com",1],["thesportsupa.com",1],["thewambugu.com",1],["theworldobits.com",1],["thiagorossi.com.br",1],["throwsmallstone.com",1],["tiny-sparklies.com",1],["titfuckvideos.com",1],["tirumalatirupatiyatra.in",1],["tnstudycorner.in",1],["today-obits.com",1],["todays-obits.com",1],["toeflgratis.com",1],["tokoasrimotedanpayet.my.id",1],["toorco.com",1],["top10trends.net",1],["topbiography.co.in",1],["topfaucet.us",1],["topsworldnews.com",1],["toptenknowledge.com",1],["torrentdofilmeshd.net",1],["torrentgame.org",1],["totally.top",1],["towerofgod.top",1],["tr3fit.xyz",1],["transgirlslive.com",1],["trendflatt.com",1],["trendohunts.com",1],["trgtkls.org",1],["trilog3.net",1],["trovapromozioni.it",1],["trucosonline.com",1],["tsubasatr.org",1],["tukangsapu.net",1],["tuktukcinma.com",1],["tunabagel.net",1],["turkeymenus.com",1],["turkishseriestv.net",1],["tutorialesdecalidad.com",1],["tutorialsduniya.com",1],["tuxnews.it",1],["twobluescans.com",1],["tw.xn--h9jepie9n6a5394exeq51z.com",1],["u-idol.com",1],["uciteljica.net",1],["udemyking.com",1],["uiuxsource.com",1],["ukigmoch.com",1],["ultimate-catch.eu",1],["umabomber.com",1],["underground.tboys.ro",1],["unityassets4free.com",1],["uozzart.com",1],["uploadbank.com",1],["uprwssp.org",1],["uqozy.com",1],["usahealthandlifestyle.com",1],["userupload.*",1],["ustimz.com",1],["ustvgo.live",1],["utaitebu.com",1],["utilidades.ecuadjsradiocorp.com",1],["uur-tech.net",1],["vamsivfx.com",1],["varnascan.com",1],["vedetta.org",1],["veganab.co",1],["vegas411.com",1],["venus-and-mars.com",1],["veryfuntime.com",1],["vibezhub.com.ng",1],["viciante.com.br",1],["videodidixx.com",1],["videosgays.net",1],["villettt.kitchen",1],["violablu.net",1],["virabux.com",1],["viralxns.com",1],["virtual-youtuber.jp",1],["visorsmr.com",1],["visortecno.com",1],["vitadacelebrita.com",1],["vivrebordeaux.fr",1],["vmorecloud.com",1],["vnuki.net",1],["voiceloves.com",1],["voidtruth.com",1],["voiranime1.fr",1],["vstplugin.net",1],["warungkomik.com",1],["webacademix.com",1],["webcamfuengirola.com",1],["webcras.com",1],["webhostingoffer.org",1],["websiteglowgh.com",1],["weebee.me",1],["welcometojapan.jp",1],["whats-new.cyou",1],["wheelofgold.com",1],["wholenotism.com",1],["wikijankari.com",1],["wikipooster.com",1],["wikitechy.com",1],["windbreaker.me",1],["windowsaplicaciones.com",1],["wirtualnelegionowo.pl",1],["wirtualnynowydwor.pl",1],["workxvacation.jp",1],["worldgyan18.com",1],["worldtop2.com",1],["worldwidestandard.net",1],["worthitorwoke.com",1],["wp.solar",1],["wpteq.org",1],["writeprofit.org",1],["wvt24.top",1],["xiaomitools.com",1],["xn--algododoce-j5a.com",1],["xn--kckzb2722b.com",1],["xn--n8jwbyc5ezgnfpeyd3i0a3ow693bw65a.com",1],["xn--nbkw38mlu2a.com",1],["xprime4u.*",1],["xpressarticles.com",1],["yakisurume.com",1],["yakyufan-asobiba.com",1],["yamsoti.com",1],["yaspage.com",1],["yawm.online",1],["yazilidayim.net",1],["ycongnghe.com",1],["yestech.xyz",1],["ynk-blog.com",1],["yoshare.net",1],["youlife24.com",1],["youmedemblik.nl",1],["youpit.xyz",1],["your-local-pest-control.com",1],["yourdesignmagazine.com",1],["yuatools.com",1],["yuki0918kw.com",1],["yumekomik.com",1],["yunakhaber.com",1],["yuramanga.my.id",1],["yurudori.com",1],["zecchino-doro.it",1],["zerogptai.org",1],["zien.pl",1],["ziminvestors.com",1],["ziontutorial.com",1],["zippyshare.cloud",1],["zippysharecue.com",1],["znanemediablog.com",1],["zyromod.com",1],["kiemlua.com",1],["link1s.com",1],["bloggingguidance.com",1],["onroid.com",1],["mathcrave.com",1],["intro-hd.net",1],["richtoscan.com",1],["tainguyenmienphi.com",1],["questloops.com",1],["wvt.free.nf",1],["appnee.com",1],["nxbrew.net",2],["tresdaos.com",2],["cinema.com.my",3],["crosswordsolver.com",3],["allcelebspics.com",4],["alttyab.net",4],["an1me.*",4],["androjungle.com",4],["arkadmin.fr",4],["azoranov.com",4],["barranquillaestereo.com",4],["brasilsimulatormods.com",4],["cambrevenements.com",4],["cartoonstvonline.com",4],["comparili.net",4],["diaobe.net",4],["filegajah.com",4],["filmestorrent.tv",4],["franceprefecture.fr",4],["freecricket.net",4],["gcpainters.com",4],["germanvibes.org",4],["getmaths.co.uk",4],["gewinnspiele-markt.com",4],["hamzag.com",4],["hannibalfm.net",4],["hornyconfessions.com",4],["ilcamminodiluce.it",4],["joguinhosgratis.com",4],["joziporn.com",4],["justpaste.top",4],["mctechsolutions.in",4],["medibok.se",4],["megafire.net",4],["mirrorpoi.my.id",4],["mockuphunts.com",4],["mortaltech.com",4],["multivideodownloader.com",4],["nauci-engleski.com",4],["nauci-njemacki.com",4],["nekopoi.my.id",4],["nuketree.com",4],["pa1n.xyz",4],["papafoot.*",4],["playertv.net",4],["programsolve.com",4],["radio-deejay.com",4],["ranaaclanhungary.com",4],["rasoi.me",4],["riprendiamocicatania.com",4],["rsrlink.in",4],["seriesperu.com",4],["shmapp.ca",4],["sub2unlocker.com",4],["skillmineopportunities.com",4],["teczpert.com",4],["totalsportek.app",4],["tromcap.com",4],["tv0800.com",4],["tv3monde.com",4],["ustrendynews.com",4],["watchnow.fun",4],["weashare.com",4],["yelitzonpc.com",4],["ymknow.xyz",4],["shomareh-yab.ir",5],["cimanow.cc",6],["freex2line.online",6],["evaki.fun",7],["sportshub.to",7],["sportnews.to",7],["bebasbokep.online",8],["asianboy.fans",9],["bilibili.com",10]]);
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
