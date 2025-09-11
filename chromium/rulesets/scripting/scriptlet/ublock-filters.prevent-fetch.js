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
(function uBOL_preventFetch() {

/******************************************************************************/

function preventFetch(...args) {
    preventFetchFn(false, ...args);
}

function preventFetchFn(
    trusted = false,
    propsToMatch = '',
    responseBody = '',
    responseType = ''
) {
    const safe = safeSelf();
    const setTimeout = self.setTimeout;
    const scriptletName = `${trusted ? 'trusted-' : ''}prevent-fetch`;
    const logPrefix = safe.makeLogPrefix(
        scriptletName,
        propsToMatch,
        responseBody,
        responseType
    );
    const extraArgs = safe.getExtraArgs(Array.from(arguments), 4);
    const needles = [];
    for ( const condition of safe.String_split.call(propsToMatch, /\s+/) ) {
        if ( condition === '' ) { continue; }
        const pos = condition.indexOf(':');
        let key, value;
        if ( pos !== -1 ) {
            key = condition.slice(0, pos);
            value = condition.slice(pos + 1);
        } else {
            key = 'url';
            value = condition;
        }
        needles.push({ key, pattern: safe.initPattern(value, { canNegate: true }) });
    }
    const validResponseProps = {
        ok: [ false, true ],
        statusText: [ '', 'Not Found' ],
        type: [ 'basic', 'cors', 'default', 'error', 'opaque' ],
    };
    const responseProps = {
        statusText: { value: 'OK' },
    };
    if ( /^\{.*\}$/.test(responseType) ) {
        try {
            Object.entries(JSON.parse(responseType)).forEach(([ p, v ]) => {
                if ( validResponseProps[p] === undefined ) { return; }
                if ( validResponseProps[p].includes(v) === false ) { return; }
                responseProps[p] = { value: v };
            });
        }
        catch { }
    } else if ( responseType !== '' ) {
        if ( validResponseProps.type.includes(responseType) ) {
            responseProps.type = { value: responseType };
        }
    }
    proxyApplyFn('fetch', function fetch(context) {
        const { callArgs } = context;
        const details = callArgs[0] instanceof self.Request
            ? callArgs[0]
            : Object.assign({ url: callArgs[0] }, callArgs[1]);
        let proceed = true;
        try {
            const props = new Map();
            for ( const prop in details ) {
                let v = details[prop];
                if ( typeof v !== 'string' ) {
                    try { v = safe.JSON_stringify(v); }
                    catch { }
                }
                if ( typeof v !== 'string' ) { continue; }
                props.set(prop, v);
            }
            if ( safe.logLevel > 1 || propsToMatch === '' && responseBody === '' ) {
                const out = Array.from(props).map(a => `${a[0]}:${a[1]}`);
                safe.uboLog(logPrefix, `Called: ${out.join('\n')}`);
            }
            if ( propsToMatch === '' && responseBody === '' ) {
                return context.reflect();
            }
            proceed = needles.length === 0;
            for ( const { key, pattern } of needles ) {
                if (
                    pattern.expect && props.has(key) === false ||
                    safe.testPattern(pattern, props.get(key)) === false
                ) {
                    proceed = true;
                    break;
                }
            }
        } catch {
        }
        if ( proceed ) {
            return context.reflect();
        }
        return Promise.resolve(generateContentFn(trusted, responseBody)).then(text => {
            safe.uboLog(logPrefix, `Prevented with response "${text}"`);
            const response = new Response(text, {
                headers: {
                    'Content-Length': text.length,
                }
            });
            const props = Object.assign(
                { url: { value: details.url } },
                responseProps
            );
            safe.Object_defineProperties(response, props);
            if ( extraArgs.throttle ) {
                return new Promise(resolve => {
                    setTimeout(( ) => { resolve(response); }, extraArgs.throttle);
                });
            }
            return response;
        });
    });
}

function generateContentFn(trusted, directive) {
    const safe = safeSelf();
    const randomize = len => {
        const chunks = [];
        let textSize = 0;
        do {
            const s = safe.Math_random().toString(36).slice(2);
            chunks.push(s);
            textSize += s.length;
        }
        while ( textSize < len );
        return chunks.join(' ').slice(0, len);
    };
    if ( directive === 'true' ) {
        return randomize(10);
    }
    if ( directive === 'emptyObj' ) {
        return '{}';
    }
    if ( directive === 'emptyArr' ) {
        return '[]';
    }
    if ( directive === 'emptyStr' ) {
        return '';
    }
    if ( directive.startsWith('length:') ) {
        const match = /^length:(\d+)(?:-(\d+))?$/.exec(directive);
        if ( match === null ) { return ''; }
        const min = parseInt(match[1], 10);
        const extent = safe.Math_max(parseInt(match[2], 10) || 0, min) - min;
        const len = safe.Math_min(min + extent * safe.Math_random(), 500000);
        return randomize(len | 0);
    }
    if ( directive.startsWith('war:') ) {
        if ( scriptletGlobals.warOrigin === undefined ) { return ''; }
        return new Promise(resolve => {
            const warOrigin = scriptletGlobals.warOrigin;
            const warName = directive.slice(4);
            const fullpath = [ warOrigin, '/', warName ];
            const warSecret = scriptletGlobals.warSecret;
            if ( warSecret !== undefined ) {
                fullpath.push('?secret=', warSecret);
            }
            const warXHR = new safe.XMLHttpRequest();
            warXHR.responseType = 'text';
            warXHR.onloadend = ev => {
                resolve(ev.target.responseText || '');
            };
            warXHR.open('GET', fullpath.join(''));
            warXHR.send();
        }).catch(( ) => '');
    }
    if ( trusted ) {
        return directive;
    }
    return '';
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

/******************************************************************************/

const scriptletGlobals = {}; // eslint-disable-line
const argsList = [["/\\/\\/ansuksar\\.com\\/[0-9a-zA-Z]{3,26}\\/\\d{4,6}\\b/","length:125746"],["-load.com/script/","length:101"],["method:HEAD"],["g.doubleclick.net","length:100000"],["favicon","length:252"],["v.fwmrm.net/ad/g/","war:noop-vmap1.xml"],["googlesyndication"],["marmalade"],["url:ipapi.co"],["doubleclick"],["api"],["cloudflare.com/cdn-cgi/trace"],["/piwik-"],["adsbygoogle"],["toiads"],["/^/"],["player-feedback"],["openx"],["ads"],["googlesyndication","method:HEAD"],["doubleclick","length:10","{\"type\":\"cors\"}"],["damoh.ani-stream.com"],["ujsmediatags method:HEAD"],["/googlesyndication|inklinkor|ads\\/load/"],["googlesyndication","length:2001"],["zomap.de"],["adsafeprotected"],["google"],["url:!luscious.net"],["bmcdn6"],["doubleclick","","{\"type\": \"opaque\"}"],["/adoto|\\/ads\\/js/"],["googletagmanager"],["adsby"],["/veepteero|tag\\.min\\.js/"],["surfe.pro"],["adsbygoogle.js"],["/adsbygoogle|googletagservices/"],["/doubleclick|googlesyndication/"],["/googlesyndication|doubleclick/","length:10","{\"type\": \"cors\"}"],["/ad\\.doubleclick\\.net|static\\.dable\\.io/"],["/gaid=","war:noop-vast2.xml"],["adblock.js"],["popunder"],["doubleclick.net/instream/ad_status.js","war:doubleclick_instream_ad_status.js"],["manager"],["moonicorn.network"],["doubleclick.com","","opaque"],["/ads"],["method:HEAD url:doubleclick.net"],["tvid.in/log"],["/ads|imasdk/"],["cloudfront.net/?"],["/nerveheels/"],["ad"],["analytics"],["wtg-ads"],["googlesyndication","length:10","{\"type\":\"cors\"}"],["/ads|doubleclick/"],["dqst.pl"],["uniconsent.com","length:2300"],["vlitag"],["adsbygoogle","length:11000"],["imasdk"],["tpc.googlesyndication.com"],["gloacmug.net"],["/cloudfront|thaudray\\.com/"],["adskeeper"],["/freychang|passback|popunder|tag|banquetunarmedgrater/"],["google-analytics"],["ima"],["imasdk.googleapis.com"],["/adoto|googlesyndication/"],["ad-delivery"],["ima3_dai"],["dai_iframe"],["method:GET"],["/ads|googletagmanager/"],["/adsbygoogle|doubleclick/"],["url:doubleclick.net","war:googletagservices_gpt.js"],["/doubleclick|googlesyndication/","length:10","{\"type\":\"cors\"}"],["/doubleclick|googlesyndication|vlitag/","length:10","{\"type\": \"cors\"}"],["/api/v1/events"],["adsbygoogle","war:googlesyndication_adsbygoogle.js"],["cloudfront"],["/outbrain|criteo|thisiswaldo|media\\.net|ohbayersbur|adligature|quantserve|srvtrck|\\.css|\\.js/"],["mode:no-cors"],["/googlesyndication|googima\\.js/"],["fwmrm.net"],["/ads|google/","length:10","{\"type\": \"cors\"}"],["/googlesyndication|googletagservices/"],["ads-twitter.com"],["secure.adnxs.com/ptv","war:noop-vast4.xml"],["googlesyndication","war:google-ima.js"],["googlesyndication","","{\"type\":\"cors\"}"],["doubleclick.net"],["jssdks.mparticle.com"],["/adinplay|googlesyndication/"],["/outbrain|adligature|quantserve|adligature|srvtrck/"],["/clarity|googlesyndication/"],["thanksgivingdelights"],["snigelweb.com"],["cdnpk.net/Rest/Media/","war:noop.json"],["/gampad/ads?"],["googletagmanager","length:10"],["fundingchoicesmessages"],["/doubleclick|google-analytics/"],["/ip-acl-all.php"],["/doubleclick|googlesyndication/","length:10","{\"type\": \"cors\"}"],["googlesyndication","length:40000-60000"],["googlesyndication","method:HEAD mode:no-cors"],["/rekaa"],["="],["pagead2.googlesyndication.com/pagead/js/adsbygoogle.js","war:googlesyndication_adsbygoogle.js"],["widgets.outbrain.com"],["mode:cors"],["method:/head/i"],["body:browser"],["eventing"],["api.theathletic.com/graphql body:/PostEvent|PostImpressions/"],["method:POST body:zaraz"],["url:/api/statsig/log_event method:POST"],["splunkcloud.com/services/collector"],["event-router.olympics.com"],["hostingcloud.racing"],["tvid.in/log/"],["segment.io"],["mparticle.com"],["pluto.smallpdf.com"],["method:/post/i url:/^https?:\\/\\/chatgpt\\.com\\/ces\\/v1\\/[a-z]$/"],["method:/post/i url:ab.chatgpt.com/v1/rgstr"],["logs.netflix.com"]];
const hostnamesMap = new Map([["japscan.*",0],["dogdrip.net",[1,40]],["infinityfree.com",1],["smsonline.cloud",1],["cdn.bg-gledai.*",2],["cdn.gledaitv.*",2],["mac2sell.net",2],["gamebrew.org",2],["game3rb.com",2],["sixsave.com",2],["asiaon.top",2],["asiaontop.com",2],["bowfile.com",[2,52]],["dealsfinders.blog",2],["iphonechecker.herokuapp.com",2],["coloringpage.eu",2],["juegosdetiempolibre.org",2],["karaokegratis.com.ar",2],["mammaebambini.it",2],["riazor.org",2],["rinconpsicologia.com",2],["sempredirebanzai.it",2],["vectogravic.com",2],["androidacy.com",2],["lifestyle.bg",[2,76]],["news.bg",[2,9,76]],["topsport.bg",[2,76]],["webcafe.bg",[2,76]],["mediamarkt.be",2],["barstoolsports.com",2],["global.novelpia.com",[3,4]],["cbsnews.com>>",5],["los40.com",6],["faucetcrypto.com",6],["tea-coffee.net",6],["spatsify.com",6],["newedutopics.com",6],["getviralreach.in",6],["edukaroo.com",6],["funkeypagali.com",6],["careersides.com",6],["nayisahara.com",6],["wikifilmia.com",6],["infinityskull.com",6],["viewmyknowledge.com",6],["iisfvirtual.in",6],["starxinvestor.com",6],["jkssbalerts.com",6],["m.jobinmeghalaya.in",6],["mynewsmedia.co",6],["overgal.com",6],["howtoconcepts.com",6],["ikramlar.online",6],["tpi.li",6],["oii.la",6],["choiceappstore.xyz",6],["djpunjab2.in",6],["djqunjab.in",6],["foodxor.com",6],["geniussolutions.co",6],["mealcold.com",6],["mixrootmods.com",6],["fartechy.com",6],["investcrust.com",6],["bantenexis.com",6],["litonmods.com",6],["universitiesonline.xyz",6],["worldmak.com",6],["updown.fun",6],["ghscanner.com",6],["sat.technology",6],["informacion.es",6],["laprovincia.es",6],["minorpatch.com",6],["wenxuecity.com",6],["disheye.com",6],["homeairquality.org",[6,32]],["techtrim.tech",6],["arhplyrics.in",6],["askpaccosi.com",6],["quizack.com",6],["apkandroidhub.in",6],["studyis.xyz",6],["prepostseo.com",6],["dulichkhanhhoa.net",6],["noithatmyphu.vn",6],["iptvjournal.com",6],["inbbotlist.com",6],["getintoway.com",6],["crdroid.net",6],["beelink.pro",6],["hax.co.id",6],["woiden.id",6],["theusaposts.com",6],["hackr.io",6],["rendimentibtp.it",6],["sportshub.to",6],["sportnews.to",6],["esopress.com",6],["paketmu.com",6],["watchx.top",6],["bitcosite.com",6],["bitzite.com",6],["coinsrev.com",6],["globlenews.in",6],["programmingeeksclub.com",6],["archivebate.com",6],["doctoraux.com",6],["educationbluesky.com",6],["hotkitchenbag.com",6],["maths.media",6],["maths.news",6],["mathsspot.com",6],["mathsstudio.com",6],["mathstutor.life",6],["now.gg",6],["now.us",6],["nowgg.lol",6],["selfstudybrain.com",6],["skibiditoilet.yourmom.eu.org",6],["thewebsitesbridge.com",6],["universityequality.com",6],["virtualstudybrain.com",6],["websitesball.com",6],["websitesbridge.com",6],["xn--31byd1i.net",6],["unitystr.com",6],["moto.it",6],["wellness4live.com",6],["forplayx.ink",6],["moviesapi.club",6],["automoto.it",6],["olarila.com",6],["techedubyte.com",6],["snapwordz.com",6],["toolxox.com",6],["go2share.net",6],["animefire.plus",6],["freewsad.com",6],["cimanow.cc",[6,79]],["freex2line.onlinex",6],["yt-downloaderz.com",6],["hostmath.com",6],["fplstatistics.co.uk",6],["fivemdev.org",6],["winlator.com",6],["sabornutritivo.com",6],["metrolagu.cam",6],["megane.com.pl",6],["civitai.com",6],["civitai.green",6],["imagetranslator.io",6],["visnalize.com",6],["tekken8combo.kagewebsite.com",6],["custommapposter.com",6],["scenexe2.io",6],["ncaa.com",6],["gurusiana.id",6],["dichvureviewmap.com",6],["technofino.in",6],["vinstartheme.com",6],["downev.com",6],["vectorx.top",6],["zippyshare.day",6],["modescanlator.net",6],["livexscores.com",6],["btv.bg",6],["btvsport.bg",6],["btvnovinite.bg",6],["101soundboards.com",6],["leakshaven.com",6],["dfbplay.tv",6],["sheepesports.com",6],["ytapi.cc",6],["evaki.fun",6],["bypass.link",6],["tmail.sys64738.at",6],["laser-pics.com",6],["fsicomics.com",6],["darts-scoring.com",6],["videq.cloud",6],["play.starsites.fun",6],["vitalitygames.com",6],["dailyboulder.com",6],["pimylifeup.com",7],["seazon.fr",8],["independent.co.uk",9],["wunderground.com",9],["13tv.co.il",9],["lared.cl",9],["ctrlv.*",9],["scrolller.com",9],["journaldemontreal.com",9],["tvanouvelles.ca",9],["vods.tv",9],["atresplayer.com",9],["assettoworld.com",9],["vtmgo.be",9],["zerioncc.pl",9],["tradingview.com",9],["estudyme.com",9],["jobfound.org",9],["abs-cbn.com",9],["sussytoons.*",9],["moovitapp.com",9],["servustv.com",9],["missavtv.com",9],["flixbaba.com",9],["formatlibrary.com",9],["business-standard.com",9],["windowsonarm.org",9],["html5.gamedistribution.com",10],["premio.io",11],["flygbussarna.se",12],["allmusic.com",13],["wowescape.com",13],["leechpremium.link",13],["camcam.cc",13],["nohat.cc",13],["hindinews360.in",13],["weshare.is",13],["cyberlynews.com",13],["djremixganna.com",13],["hypicmodapk.org",13],["keedabankingnews.com",13],["rokni.xyz",13],["technicalline.store",13],["quizrent.com",13],["isi7.net",13],["okiemrolnika.pl",13],["pandadevelopment.net",13],["decrypt.day",13],["anakteknik.co.id",13],["javball.com",13],["visalist.io",13],["moviesshub.*",13],["zeenews.india.com",13],["gadgetbond.com",13],["updateroj24.com",13],["remotejobzone.online",13],["cosmicapp.co",13],["hentaicovid.org",13],["sexwebvideo.com",13],["gofile.download",13],["discover-sharm.com",13],["newstopics.in",13],["timesofindia.indiatimes.com",[14,125]],["skidrowreloaded.com",15],["zone-telechargement.*",15],["topsporter.net",15],["player.glomex.com",16],["htmlgames.com",17],["investing.com",18],["mylivewallpapers.com",18],["softfully.com",18],["reminimod.co",18],["highkeyfinance.com",18],["amanguides.com",18],["adcrypto.net",18],["admediaflex.com",18],["aduzz.com",18],["bitcrypto.info",18],["cdrab.com",18],["datacheap.io",18],["hbz.us",18],["savego.org",18],["owsafe.com",18],["sportweb.info",18],["apkupload.in",18],["ezeviral.com",18],["pngreal.com",18],["ytpng.net",18],["travel.vebma.com",18],["cloud.majalahhewan.com",18],["crm.cekresi.me",18],["ai.tempatwisata.pro",18],["cinedesi.in",18],["thevouz.in",18],["tejtime24.com",18],["techishant.in",18],["mtcremix.com",18],["advicefunda.com",18],["bestloanoffer.net",18],["computerpedia.in",18],["techconnection.in",18],["wrzesnia.info.pl",18],["key-hub.eu",18],["discoveryplus.in",18],["calculator-online.net",18],["dotabuff.com",18],["forum.cstalking.tv",18],["mcqmall.com",18],["witcherhour.com",18],["clamor.pl",18],["ozulscans.com",18],["noor-book.com",18],["pobre.*",18],["compromath.com",18],["sumoweb.to",18],["haloursynow.pl",18],["satkurier.pl",18],["mtg-print.com",18],["heavy.com",18],["creators.nafezly.com",18],["downloadfilm.website",18],["bombuj.*",18],["pornovka.cz",18],["fplstatistics.com",18],["cheater.ninja",18],["govtportal.org",18],["vide-greniers.org",18],["muyinteresante.es",19],["3dzip.org",20],["s0ft4pc.com",20],["ani-stream.com",21],["uflash.tv",22],["oko.sh",23],["duden.de",24],["joyn.de",25],["joyn.at",25],["joyn.ch",25],["tf1.fr",26],["exe.app",27],["eio.io",27],["ufacw.com",27],["figurehunter.net",27],["luscious.net",28],["mdn.lol",29],["bitcotasks.com",29],["starkroboticsfrc.com",30],["sinonimos.de",30],["antonimos.de",30],["quesignifi.ca",30],["tiktokrealtime.com",30],["tiktokcounter.net",30],["tpayr.xyz",30],["poqzn.xyz",30],["ashrfd.xyz",30],["rezsx.xyz",30],["tryzt.xyz",30],["ashrff.xyz",30],["rezst.xyz",30],["dawenet.com",30],["erzar.xyz",30],["waezm.xyz",30],["waezg.xyz",30],["blackwoodacademy.org",30],["cryptednews.space",30],["vivuq.com",30],["swgop.com",30],["vbnmll.com",30],["telcoinfo.online",30],["dshytb.com",30],["quins.us",30],["btcbitco.in",31],["btcsatoshi.net",31],["cempakajaya.com",31],["crypto4yu.com",31],["readbitcoin.org",31],["wiour.com",31],["senda.pl",32],["dsmusic.in",33],["www.apkmoddone.com",34],["tutorialsaya.com",13],["exactpay.online",35],["filesupload.in",36],["hindustantimes.com",36],["indiainfo4u.in",37],["canalobra.com",38],["tulink.org",38],["arabshentai.com",39],["ariversegl.com",39],["asia2tv.com",39],["boyfuck.me",39],["cgtips.org",39],["dvdgayporn.com",39],["downloadcursos.gratis",39],["dx-tv.com",39],["filmyzones.com",39],["freereadnovel.online",39],["idlixvip.*",39],["javboys.tv",39],["magicgameworld.com",39],["medicalstudyzone.com",39],["netfuck.net",39],["onezoo.net",39],["readingpage.fun",39],["shemalegape.net",39],["tojimangas.com",39],["tuktukcinma.com",39],["vercanalesdominicanos.com",39],["superpsx.com",39],["hunterscomics.com",39],["player.pl",41],["ryxy.online",42],["camarchive.tv",43],["cybermania.ws",44],["fapdrop.com",44],["linkpoi.me",45],["platform.adex.network",46],["watch.plex.tv",47],["simplebits.io",48],["tvnz.co.nz",49],["timesnowhindi.com",50],["timesnowmarathi.com",50],["timesofindia.com",50],["elahmad.com",51],["1cloudfile.com",53],["weszlo.com",54],["wyze.com",55],["mmorpg.org.pl",56],["firmwarex.net",57],["dongknows.com",58],["forsal.pl",59],["photopea.com",60],["freeshib.biz",61],["theappstore.org",62],["deutschekanale.com",63],["nfl.com",63],["soranews24.com",64],["ipalibrary.me",65],["ipacrack.com",66],["bravedown.com",67],["smartkhabrinews.com",68],["freepik-downloader.com",69],["freepic-downloader.com",69],["envato-downloader.com",69],["ortograf.pl",70],["bg-gledai.*",71],["gledaitv.*",71],["www.cc.com",71],["mixrootmod.com",72],["explorecams.com",73],["southpark.*",[74,75]],["southparkstudios.*",[74,75]],["southpark.cc.com",75],["money.bg",76],["realmadryt.pl",76],["ruidrive.com",76],["myesports.gg",76],["getthit.com",77],["sshkit.com",78],["fastssh.com",78],["howdy.id",78],["freex2line.online",79],["intro-hd.net",80],["souq-design.com",80],["gaypornhot.com",80],["sonixgvn.net",81],["everand.com",82],["loot-link.com",83],["lootdest.*",83],["rajssoid.online",83],["moutogami.com",83],["india.marathinewz.in",83],["workink.click",84],["work.ink",[85,86]],["sport.es",86],["tubtic.com",86],["kio.ac",86],["bigbuttshub2.top",[86,114]],["bigbuttshubvideos.com",[86,114]],["online-smss.com",[86,114]],["play.nova.bg",87],["u.co.uk",88],["uktvplay.co.uk",88],["uktvplay.uktv.co.uk",88],["jpopsingles.eu",89],["adslink.pw",90],["fmovies0.cc",90],["hentaihaven.xxx",91],["imasdk.googleapis.com",92],["botrix.live",93],["gunauc.net",94],["lemino.docomo.ne.jp",95],["kfc.com",96],["crazygames.com",97],["freeshot.live",98],["hancinema.net",99],["javfc2.xyz",100],["textreverse.com",101],["flaticon.com",102],["shahid.mbc.net",[103,127]],["tab-maker.com",104],["faceittracker.net",105],["nikke.win",106],["stream.offidocs.com",107],["dogsexporn.net",108],["yomucomics.com",108],["zone.msn.com",109],["www.msn.com",110],["letemsvetemapplem.eu",111],["flixrave.me",112],["seelen.io",113],["olamovies.*",115],["hmanga.world",116],["search.brave.com",117],["coursera.org",118],["nytimes.com",119],["blog.cloudflare.com",120],["www.cloudflare.com",120],["grok.com",121],["notion.so",122],["olympics.com",123],["ceramic.or.kr",124],["pandadoc.com",126],["smallpdf.com",128],["chatgpt.com",[129,130]],["netflix.com",131]]);
const exceptionsMap = new Map([]);
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
    try { preventFetch(...argsList[i]); }
    catch { }
}

/******************************************************************************/

// End of local scope
})();

void 0;
