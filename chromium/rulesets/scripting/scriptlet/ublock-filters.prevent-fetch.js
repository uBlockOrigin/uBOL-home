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
    const propNeedles = parsePropertiesToMatchFn(propsToMatch, 'url');
    const validResponseProps = {
        ok: [ false, true ],
        statusText: [ '', 'Not Found' ],
        type: [ 'basic', 'cors', 'default', 'error', 'opaque' ],
    };
    const responseProps = {
        statusText: { value: 'OK' },
    };
    const responseHeaders = {};
    if ( /^\{.*\}$/.test(responseType) ) {
        try {
            Object.entries(JSON.parse(responseType)).forEach(([ p, v ]) => {
                if ( p === 'headers' && trusted ) {
                    Object.assign(responseHeaders, v);
                    return;
                }
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
    const fetchProps = (src, out) => {
        if ( typeof src !== 'object' || src === null ) { return; }
        const props = [
            'body', 'cache', 'credentials', 'duplex', 'headers',
            'integrity', 'keepalive', 'method', 'mode', 'priority',
            'redirect', 'referrer', 'referrerPolicy', 'signal',
        ];
        for ( const prop of props ) {
            if ( src[prop] === undefined ) { continue; }
            out[prop] = src[prop];
        }
    };
    const fetchDetails = args => {
        const out = {};
        if ( args[0] instanceof self.Request ) {
            out.url = `${args[0].url}`;
            fetchProps(args[0], out);
        } else {
            out.url = `${args[0]}`;
        }
        fetchProps(args[1], out);
        return out;
    };
    proxyApplyFn('fetch', function fetch(context) {
        const { callArgs } = context;
        const details = fetchDetails(callArgs);
        if ( safe.logLevel > 1 || propsToMatch === '' && responseBody === '' ) {
            const out = Array.from(Object.entries(details)).map(a => `${a[0]}:${a[1]}`);
            safe.uboLog(logPrefix, `Called: ${out.join('\n')}`);
        }
        if ( propsToMatch === '' && responseBody === '' ) {
            return context.reflect();
        }
        const matched = matchObjectPropertiesFn(propNeedles, details);
        if ( matched === undefined || matched.length === 0 ) {
            return context.reflect();
        }
        return Promise.resolve(generateContentFn(trusted, responseBody)).then(text => {
            safe.uboLog(logPrefix, `Prevented with response "${text}"`);
            const headers = Object.assign({}, responseHeaders);
            if ( headers['content-length'] === undefined ) {
                headers['content-length'] = text.length;
            }
            const response = new Response(text, { headers });
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

function matchObjectPropertiesFn(propNeedles, ...objs) {
    const safe = safeSelf();
    const matched = [];
    for ( const obj of objs ) {
        if ( obj instanceof Object === false ) { continue; }
        for ( const [ prop, details ] of propNeedles ) {
            let value = obj[prop];
            if ( value === undefined ) { continue; }
            if ( typeof value !== 'string' ) {
                try { value = safe.JSON_stringify(value); }
                catch { }
                if ( typeof value !== 'string' ) { continue; }
            }
            if ( safe.testPattern(details, value) === false ) { return; }
            matched.push(`${prop}: ${value}`);
        }
    }
    return matched;
}

function parsePropertiesToMatchFn(propsToMatch, implicit = '') {
    const safe = safeSelf();
    const needles = new Map();
    if ( propsToMatch === undefined || propsToMatch === '' ) { return needles; }
    const options = { canNegate: true };
    for ( const needle of safe.String_split.call(propsToMatch, /\s+/) ) {
        let [ prop, pattern ] = safe.String_split.call(needle, ':');
        if ( prop === '' ) { continue; }
        if ( pattern !== undefined && /[^$\w -]/.test(prop) ) {
            prop = `${prop}:${pattern}`;
            pattern = undefined;
        }
        if ( pattern !== undefined ) {
            needles.set(prop, safe.initPattern(pattern, options));
        } else if ( implicit !== '' ) {
            needles.set(implicit, safe.initPattern(prop, options));
        }
    }
    return needles;
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
const argsList = [["-load.com/script/","length:101"],["url:https://googleads.g.doubleclick.net/pagead/ads?client=ca-pub-3497863494706299 method:HEAD mode:no-cors","","","throttle","121"],["g.doubleclick.net","length:100000"],["favicon","length:252"],["summerday","length:10","{\"type\":\"cors\"}"],["pagead2.googlesyndication.com/pagead/js/adsbygoogle.js method:HEAD","emptyStr"],["v.fwmrm.net/ad/g/","war:noop-vmap1.xml"],["googlesyndication"],["marmalade"],["url:ipapi.co"],["doubleclick"],["api"],["cloudflare.com/cdn-cgi/trace"],["/piwik-"],["adsbygoogle"],["toiads"],["/^/"],["player-feedback"],["openx"],["method:HEAD"],["ads"],["googlesyndication","method:HEAD"],["doubleclick","length:10","{\"type\":\"cors\"}"],["damoh.ani-stream.com"],["ujsmediatags method:HEAD"],["/googlesyndication|inklinkor|ads\\/load/"],["googlesyndication","length:2001"],["zomap.de"],["adsafeprotected"],["google"],["url:!luscious.net"],["bmcdn6"],["doubleclick","","{\"type\": \"opaque\"}"],["/adoto|\\/ads\\/js/"],["googletagmanager"],["adsby"],["/veepteero|tag\\.min\\.js/"],["surfe.pro"],["adsbygoogle.js"],["adsbygoogle","war:googlesyndication_adsbygoogle.js"],["/adsbygoogle|googletagservices/"],["/doubleclick|googlesyndication/"],["/googlesyndication|doubleclick/","length:10","{\"type\": \"cors\"}"],["/ad\\.doubleclick\\.net|static\\.dable\\.io/"],["/doubleclick|ad-delivery|googlesyndication/"],["/gaid=","war:noop-vast2.xml"],["adblock.js"],["popunder"],["manager"],["moonicorn.network"],["doubleclick.com","","opaque"],["/ads/banner"],["/ads"],["method:HEAD url:doubleclick.net"],["tvid.in/log"],["/ads|imasdk/"],["cloudfront.net/?"],["/nerveheels/"],["ad"],["analytics"],["wtg-ads"],["googlesyndication","length:10","{\"type\":\"cors\"}"],["/ads|doubleclick/"],["dqst.pl"],["uniconsent.com"],["vlitag"],["adsbygoogle","length:11000"],["imasdk"],["tpc.googlesyndication.com"],["gloacmug.net"],["/cloudfront|thaudray\\.com/"],["adskeeper"],["/freychang|passback|popunder|tag|banquetunarmedgrater/"],["google-analytics"],["ima"],["/adoto|googlesyndication/"],["ad-delivery"],["doubleclick.net/instream/ad_status.js","war:doubleclick_instream_ad_status.js"],["dai_iframe"],["ima3_dai"],["method:GET"],["/ads|googletagmanager/"],["/adsbygoogle|doubleclick/"],["url:doubleclick.net","war:googletagservices_gpt.js"],["/doubleclick|googlesyndication/","length:10","{\"type\":\"cors\"}"],["/doubleclick|googlesyndication|vlitag/","length:10","{\"type\": \"cors\"}"],["/api/v1/events"],["cloudfront"],["/outbrain|criteo|thisiswaldo|media\\.net|ohbayersbur|adligature|quantserve|srvtrck|\\.css|\\.js/"],["mode:no-cors"],["/googlesyndication|googima\\.js/"],["fwmrm.net"],["/ads|google/","length:10","{\"type\": \"cors\"}"],["/googlesyndication|googletagservices/"],["ads-twitter.com"],["secure.adnxs.com/ptv","war:noop-vast4.xml"],["googlesyndication","war:google-ima.js"],["googlesyndication","","{\"type\":\"cors\"}"],["doubleclick.net"],["jssdks.mparticle.com"],["/adinplay|googlesyndication/"],["/outbrain|adligature|quantserve|adligature|srvtrck/"],["/clarity|googlesyndication/"],["thanksgivingdelights"],["snigelweb.com"],["cdnpk.net/Rest/Media/","war:noop.json"],["/gampad/ads?"],["googletagmanager","length:10"],["fundingchoicesmessages"],["/doubleclick|google-analytics/"],["/ip-acl-all.php"],["/doubleclick|googlesyndication/","length:10","{\"type\": \"cors\"}"],["googlesyndication","length:40000-60000"],["googlesyndication","method:HEAD mode:no-cors"],["/rekaa"],["="],["widgets.outbrain.com"],["mode:cors"],["imasdk.googleapis.com"],["method:/head/i"],["/partners/home"],["havenclick"],["body:browser"],["eventing"],["api.theathletic.com/graphql body:/PostEvent|PostImpressions/"],["method:POST body:zaraz"],["url:/api/statsig/log_event method:POST"],["splunkcloud.com/services/collector"],["event-router.olympics.com"],["hostingcloud.racing"],["tvid.in/log/"],["segment.io"],["mparticle.com"],["pluto.smallpdf.com"],["method:/post/i url:/^https?:\\/\\/chatgpt\\.com\\/ces\\/v1\\/[a-z]$/"],["method:/post/i url:ab.chatgpt.com/v1/rgstr"],["logs.netflix.com"]];
const hostnamesMap = new Map([["dogdrip.net",[0,43]],["infinityfree.com",0],["smsonline.cloud",0],["welt.de",0],["pvpoke-re.com",1],["global.novelpia.com",[2,3]],["omuzaani.me",4],["chzzkban.xyz",5],["cbsnews.com>>",6],["los40.com",7],["haaretz.com",7],["faucetcrypto.com",7],["tea-coffee.net",7],["spatsify.com",7],["newedutopics.com",7],["getviralreach.in",7],["edukaroo.com",7],["funkeypagali.com",7],["careersides.com",7],["nayisahara.com",7],["wikifilmia.com",7],["infinityskull.com",7],["viewmyknowledge.com",7],["iisfvirtual.in",7],["starxinvestor.com",7],["jkssbalerts.com",7],["m.jobinmeghalaya.in",7],["mynewsmedia.co",7],["overgal.com",7],["howtoconcepts.com",7],["ikramlar.online",7],["tpi.li",7],["oii.la",7],["choiceappstore.xyz",7],["djpunjab2.in",7],["djqunjab.in",7],["foodxor.com",7],["geniussolutions.co",7],["mealcold.com",7],["mixrootmods.com",7],["fartechy.com",7],["investcrust.com",7],["bantenexis.com",7],["litonmods.com",7],["universitiesonline.xyz",7],["worldmak.com",7],["updown.fun",7],["ghscanner.com",7],["sat.technology",7],["minorpatch.com",7],["wenxuecity.com",7],["disheye.com",7],["homeairquality.org",[7,34]],["techtrim.tech",7],["arhplyrics.in",7],["askpaccosi.com",7],["quizack.com",7],["apkandroidhub.in",7],["studyis.xyz",7],["prepostseo.com",7],["dulichkhanhhoa.net",7],["noithatmyphu.vn",7],["iptvjournal.com",7],["inbbotlist.com",7],["getintoway.com",7],["crdroid.net",7],["beelink.pro",7],["hax.co.id",7],["woiden.id",7],["theusaposts.com",7],["hackr.io",7],["planhub.ca",7],["rendimentibtp.it",7],["sportshub.to",7],["sportnews.to",7],["esopress.com",7],["paketmu.com",7],["watchx.top",7],["bitcosite.com",7],["bitzite.com",7],["coinsrev.com",7],["globlenews.in",7],["programmingeeksclub.com",7],["archivebate.com",7],["doctoraux.com",7],["educationbluesky.com",7],["hotkitchenbag.com",7],["maths.media",7],["maths.news",7],["mathsspot.com",7],["mathsstudio.com",7],["mathstutor.life",7],["now.gg",7],["now.us",7],["nowgg.lol",7],["selfstudybrain.com",7],["skibiditoilet.yourmom.eu.org",7],["thewebsitesbridge.com",7],["universityequality.com",7],["virtualstudybrain.com",7],["websitesball.com",7],["websitesbridge.com",7],["xn--31byd1i.net",7],["unitystr.com",7],["moto.it",7],["wellness4live.com",7],["forplayx.ink",7],["moviesapi.club",7],["automoto.it",7],["olarila.com",7],["techedubyte.com",7],["snapwordz.com",7],["toolxox.com",7],["go2share.net",7],["animefire.plus",7],["freewsad.com",7],["cimanow.cc",[7,83]],["freex2line.onlinex",7],["yt-downloaderz.com",7],["hostmath.com",7],["fplstatistics.co.uk",7],["fivemdev.org",7],["winlator.com",7],["sabornutritivo.com",7],["metrolagu.cam",7],["megane.com.pl",7],["civitai.com",7],["civitai.green",7],["imagetranslator.io",7],["visnalize.com",7],["tekken8combo.kagewebsite.com",7],["custommapposter.com",7],["scenexe2.io",7],["ncaa.com",7],["gurusiana.id",7],["dichvureviewmap.com",7],["technofino.in",7],["vinstartheme.com",7],["downev.com",7],["vectorx.top",7],["zippyshare.day",7],["modescanlator.net",7],["livexscores.com",7],["btv.bg",7],["btvsport.bg",7],["btvnovinite.bg",7],["101soundboards.com",7],["androidpolice.com",7],["babygaga.com",7],["backyardboss.net",7],["carbuzz.com",7],["cbr.com",7],["collider.com",7],["dualshockers.com",7],["footballfancast.com",7],["footballleagueworld.co.uk",7],["gamerant.com",7],["givemesport.com",7],["hardcoregamer.com",7],["hotcars.com",7],["howtogeek.com",7],["makeuseof.com",7],["moms.com",7],["movieweb.com",7],["pocket-lint.com",7],["pocketnow.com",7],["polygon.com",7],["screenrant.com",7],["simpleflying.com",7],["thegamer.com",7],["therichest.com",7],["thesportster.com",7],["thethings.com",7],["thetravel.com",7],["topspeed.com",7],["xda-developers.com",7],["leakshaven.com",7],["dfbplay.tv",7],["sheepesports.com",7],["ytapi.cc",7],["evaki.fun",7],["bypass.link",7],["tmail.sys64738.at",7],["laser-pics.com",7],["fsicomics.com",7],["darts-scoring.com",7],["videq.cloud",7],["play.starsites.fun",7],["vitalitygames.com",7],["dailyboulder.com",7],["djamix.net",7],["pimylifeup.com",8],["seazon.fr",9],["independent.co.uk",10],["wunderground.com",10],["lared.cl",10],["ctrlv.*",10],["scrolller.com",10],["journaldemontreal.com",10],["tvanouvelles.ca",10],["vods.tv",10],["atresplayer.com",10],["assettoworld.com",10],["news.bg",[10,19,80]],["vtmgo.be",10],["zerioncc.pl",10],["tradingview.com",10],["estudyme.com",10],["jobfound.org",10],["abs-cbn.com",10],["sussytoons.*",10],["moovitapp.com",10],["servustv.com",10],["missavtv.com",10],["flixbaba.com",10],["formatlibrary.com",10],["business-standard.com",10],["windowsonarm.org",10],["html5.gamedistribution.com",11],["premio.io",12],["flygbussarna.se",13],["allmusic.com",14],["wowescape.com",14],["leechpremium.link",14],["camcam.cc",14],["nohat.cc",14],["hindinews360.in",14],["weshare.is",14],["cyberlynews.com",14],["djremixganna.com",14],["hypicmodapk.org",14],["keedabankingnews.com",14],["rokni.xyz",14],["technicalline.store",14],["quizrent.com",14],["uploadhub.*",14],["isi7.net",14],["okiemrolnika.pl",14],["pandadevelopment.net",14],["decrypt.day",14],["anakteknik.co.id",14],["javball.com",14],["visalist.io",14],["animeshqip.org",14],["moviesshub.*",14],["zeenews.india.com",14],["gadgetbond.com",14],["updateroj24.com",14],["remotejobzone.online",14],["cosmicapp.co",14],["hentaicovid.org",14],["sexwebvideo.com",14],["gofile.download",14],["discover-sharm.com",14],["newstopics.in",14],["weights.com",14],["edumailfree.com",14],["starstreams.pro",14],["timesofindia.indiatimes.com",[15,130]],["skidrowreloaded.com",16],["zone-telechargement.*",16],["topsporter.net",16],["player.glomex.com",17],["htmlgames.com",18],["mac2sell.net",19],["gamebrew.org",19],["game3rb.com",19],["sixsave.com",19],["asiaon.top",19],["asiaontop.com",19],["bowfile.com",[19,56]],["dealsfinders.blog",19],["iphonechecker.herokuapp.com",19],["coloringpage.eu",19],["juegosdetiempolibre.org",19],["karaokegratis.com.ar",19],["mammaebambini.it",19],["riazor.org",19],["rinconpsicologia.com",19],["sempredirebanzai.it",19],["vectogravic.com",19],["androidacy.com",19],["lifestyle.bg",[19,80]],["topsport.bg",[19,80]],["webcafe.bg",[19,80]],["mediamarkt.be",19],["denverbroncos.com",19],["streamfree.to",19],["thenewsdrill.com",19],["barstoolsports.com",19],["investing.com",20],["mylivewallpapers.com",20],["softfully.com",20],["reminimod.co",20],["highkeyfinance.com",20],["amanguides.com",20],["adcrypto.net",20],["admediaflex.com",20],["aduzz.com",20],["bitcrypto.info",20],["cdrab.com",20],["datacheap.io",20],["hbz.us",20],["savego.org",20],["owsafe.com",20],["sportweb.info",20],["apkupload.in",20],["ezeviral.com",20],["pngreal.com",20],["ytpng.net",20],["travel.vebma.com",20],["cloud.majalahhewan.com",20],["crm.cekresi.me",20],["ai.tempatwisata.pro",20],["cinedesi.in",20],["thevouz.in",20],["tejtime24.com",20],["techishant.in",20],["mtcremix.com",20],["advicefunda.com",20],["bestloanoffer.net",20],["computerpedia.in",20],["techconnection.in",20],["wrzesnia.info.pl",20],["key-hub.eu",20],["discoveryplus.in",20],["calculator-online.net",20],["dotabuff.com",20],["forum.cstalking.tv",20],["mcqmall.com",20],["witcherhour.com",20],["clamor.pl",20],["ozulscans.com",20],["noor-book.com",20],["pobre.*",20],["compromath.com",20],["sumoweb.to",20],["haloursynow.pl",20],["satkurier.pl",20],["mtg-print.com",20],["heavy.com",20],["creators.nafezly.com",20],["downloadfilm.website",20],["bombuj.*",20],["pornovka.cz",20],["fplstatistics.com",20],["cheater.ninja",20],["govtportal.org",20],["vide-greniers.org",20],["muyinteresante.es",21],["3dzip.org",22],["s0ft4pc.com",22],["ani-stream.com",23],["uflash.tv",24],["oko.sh",25],["duden.de",26],["joyn.de",27],["joyn.at",27],["joyn.ch",27],["tf1.fr",28],["exe.app",29],["eio.io",29],["ufacw.com",29],["figurehunter.net",29],["luscious.net",30],["mdn.lol",31],["bitcotasks.com",31],["starkroboticsfrc.com",32],["sinonimos.de",32],["antonimos.de",32],["quesignifi.ca",32],["tiktokrealtime.com",32],["tiktokcounter.net",32],["tpayr.xyz",32],["poqzn.xyz",32],["ashrfd.xyz",32],["rezsx.xyz",32],["tryzt.xyz",32],["ashrff.xyz",32],["rezst.xyz",32],["dawenet.com",32],["erzar.xyz",32],["waezm.xyz",32],["waezg.xyz",32],["blackwoodacademy.org",32],["cryptednews.space",32],["vivuq.com",32],["swgop.com",32],["vbnmll.com",32],["telcoinfo.online",32],["dshytb.com",32],["quins.us",32],["btcbitco.in",33],["btcsatoshi.net",33],["cempakajaya.com",33],["crypto4yu.com",33],["readbitcoin.org",33],["wiour.com",33],["senda.pl",34],["dsmusic.in",35],["www.apkmoddone.com",36],["tutorialsaya.com",14],["exactpay.online",37],["filesupload.in",38],["hindustantimes.com",38],["dropgalaxy.*",39],["financemonk.net",39],["loot-link.com",39],["lootdest.*",39],["rajssoid.online",39],["moutogami.com",39],["india.marathinewz.in",39],["indiainfo4u.in",40],["canalobra.com",41],["tulink.org",41],["13tv.co.il",41],["arabshentai.com",42],["ariversegl.com",42],["asia2tv.com",42],["boyfuck.me",42],["cehennemstream.xyz",42],["cgtips.org",42],["cybermania.ws",42],["dvdgayporn.com",42],["downloadcursos.gratis",42],["dx-tv.com",42],["filmyzones.com",42],["freereadnovel.online",42],["idlixvip.*",42],["javboys.tv",42],["magicgameworld.com",42],["mangacrab.org",42],["medicalstudyzone.com",42],["netfuck.net",42],["onezoo.net",42],["readingpage.fun",42],["shemalegape.net",42],["tojimangas.com",42],["tuktukcinma.com",42],["vercanalesdominicanos.com",42],["superpsx.com",42],["hunterscomics.com",42],["telegraaf.nl",44],["player.pl",45],["ryxy.online",46],["camarchive.tv",47],["linkpoi.me",48],["platform.adex.network",49],["watch.plex.tv",50],["10.com.au",51],["simplebits.io",52],["tvnz.co.nz",53],["timesnowhindi.com",54],["timesnowmarathi.com",54],["timesofindia.com",54],["elahmad.com",55],["1cloudfile.com",57],["weszlo.com",58],["wyze.com",59],["mmorpg.org.pl",60],["firmwarex.net",61],["dongknows.com",62],["forsal.pl",63],["photopea.com",64],["freeshib.biz",65],["theappstore.org",66],["deutschekanale.com",67],["baltimoreravens.com",67],["nfl.com",67],["seahawks.com",67],["soranews24.com",68],["ipalibrary.me",69],["ipacrack.com",70],["bravedown.com",71],["ranoz.gg",71],["smartkhabrinews.com",72],["freepik-downloader.com",73],["freepic-downloader.com",73],["envato-downloader.com",73],["ortograf.pl",74],["mixrootmod.com",75],["explorecams.com",76],["fapdrop.com",77],["nick.com",78],["southpark.*",[78,79]],["southpark.cc.com",78],["southparkstudios.*",[78,79]],["money.bg",80],["realmadryt.pl",80],["ruidrive.com",80],["myesports.gg",80],["getthit.com",81],["sshkit.com",82],["fastssh.com",82],["howdy.id",82],["freex2line.online",83],["intro-hd.net",84],["souq-design.com",84],["gaypornhot.com",84],["sonixgvn.net",85],["everand.com",86],["workink.click",87],["work.ink",[88,89]],["sport.es",89],["tubtic.com",89],["kio.ac",89],["bigbuttshub2.top",[89,116]],["bigbuttshubvideos.com",[89,116]],["online-smss.com",[89,116]],["manhuarmmtl.com",89],["play.nova.bg",90],["u.co.uk",91],["uktvplay.co.uk",91],["uktvplay.uktv.co.uk",91],["jpopsingles.eu",92],["adslink.pw",93],["fmovies0.cc",93],["hentaihaven.xxx",94],["imasdk.googleapis.com",95],["botrix.live",96],["gunauc.net",97],["lemino.docomo.ne.jp",98],["kfc.com",99],["crazygames.com",100],["freeshot.live",101],["hancinema.net",102],["javfc2.xyz",103],["textreverse.com",104],["flaticon.com",105],["shahid.mbc.net",[106,132]],["tab-maker.com",107],["faceittracker.net",108],["nikke.win",109],["stream.offidocs.com",110],["dogsexporn.net",111],["yomucomics.com",111],["zone.msn.com",112],["www.msn.com",113],["letemsvetemapplem.eu",114],["flixrave.me",115],["olamovies.*",117],["www.cc.com",118],["hmanga.world",119],["temp-mail.lol",119],["forge.plebmasters.de",120],["hentaimama.tv",121],["search.brave.com",122],["coursera.org",123],["nytimes.com",124],["blog.cloudflare.com",125],["www.cloudflare.com",125],["grok.com",126],["notion.so",127],["olympics.com",128],["ceramic.or.kr",129],["pandadoc.com",131],["smallpdf.com",133],["chatgpt.com",[134,135]],["netflix.com",136]]);
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
