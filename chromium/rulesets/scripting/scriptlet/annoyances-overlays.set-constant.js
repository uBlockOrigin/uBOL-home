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
(function uBOL_setConstant() {

/******************************************************************************/

function setConstant(
    ...args
) {
    setConstantFn(false, ...args);
}

function setConstantFn(
    trusted = false,
    chain = '',
    rawValue = ''
) {
    if ( chain === '' ) { return; }
    const safe = safeSelf();
    const logPrefix = safe.makeLogPrefix('set-constant', chain, rawValue);
    const extraArgs = safe.getExtraArgs(Array.from(arguments), 3);
    function setConstant(chain, rawValue) {
        const trappedProp = (( ) => {
            const pos = chain.lastIndexOf('.');
            if ( pos === -1 ) { return chain; }
            return chain.slice(pos+1);
        })();
        const cloakFunc = fn => {
            safe.Object_defineProperty(fn, 'name', { value: trappedProp });
            return new Proxy(fn, {
                defineProperty(target, prop) {
                    if ( prop !== 'toString' ) {
                        return Reflect.defineProperty(...arguments);
                    }
                    return true;
                },
                deleteProperty(target, prop) {
                    if ( prop !== 'toString' ) {
                        return Reflect.deleteProperty(...arguments);
                    }
                    return true;
                },
                get(target, prop) {
                    if ( prop === 'toString' ) {
                        return function() {
                            return `function ${trappedProp}() { [native code] }`;
                        }.bind(null);
                    }
                    return Reflect.get(...arguments);
                },
            });
        };
        if ( trappedProp === '' ) { return; }
        const thisScript = document.currentScript;
        let normalValue = validateConstantFn(trusted, rawValue, extraArgs);
        if ( rawValue === 'noopFunc' || rawValue === 'trueFunc' || rawValue === 'falseFunc' ) {
            normalValue = cloakFunc(normalValue);
        }
        let aborted = false;
        const mustAbort = function(v) {
            if ( trusted ) { return false; }
            if ( aborted ) { return true; }
            aborted =
                (v !== undefined && v !== null) &&
                (normalValue !== undefined && normalValue !== null) &&
                (typeof v !== typeof normalValue);
            if ( aborted ) {
                safe.uboLog(logPrefix, `Aborted because value set to ${v}`);
            }
            return aborted;
        };
        // https://github.com/uBlockOrigin/uBlock-issues/issues/156
        //   Support multiple trappers for the same property.
        const trapProp = function(owner, prop, configurable, handler) {
            if ( handler.init(configurable ? owner[prop] : normalValue) === false ) { return; }
            const odesc = safe.Object_getOwnPropertyDescriptor(owner, prop);
            let prevGetter, prevSetter;
            if ( odesc instanceof safe.Object ) {
                owner[prop] = normalValue;
                if ( odesc.get instanceof Function ) {
                    prevGetter = odesc.get;
                }
                if ( odesc.set instanceof Function ) {
                    prevSetter = odesc.set;
                }
            }
            try {
                safe.Object_defineProperty(owner, prop, {
                    configurable,
                    get() {
                        if ( prevGetter !== undefined ) {
                            prevGetter();
                        }
                        return handler.getter();
                    },
                    set(a) {
                        if ( prevSetter !== undefined ) {
                            prevSetter(a);
                        }
                        handler.setter(a);
                    }
                });
                safe.uboLog(logPrefix, 'Trap installed');
            } catch(ex) {
                safe.uboErr(logPrefix, ex);
            }
        };
        const trapChain = function(owner, chain) {
            const pos = chain.indexOf('.');
            if ( pos === -1 ) {
                trapProp(owner, chain, false, {
                    v: undefined,
                    init: function(v) {
                        if ( mustAbort(v) ) { return false; }
                        this.v = v;
                        return true;
                    },
                    getter: function() {
                        if ( document.currentScript === thisScript ) {
                            return this.v;
                        }
                        safe.uboLog(logPrefix, 'Property read');
                        return normalValue;
                    },
                    setter: function(a) {
                        if ( mustAbort(a) === false ) { return; }
                        normalValue = a;
                    }
                });
                return;
            }
            const prop = chain.slice(0, pos);
            const v = owner[prop];
            chain = chain.slice(pos + 1);
            if ( v instanceof safe.Object || typeof v === 'object' && v !== null ) {
                trapChain(v, chain);
                return;
            }
            trapProp(owner, prop, true, {
                v: undefined,
                init: function(v) {
                    this.v = v;
                    return true;
                },
                getter: function() {
                    return this.v;
                },
                setter: function(a) {
                    this.v = a;
                    if ( a instanceof safe.Object ) {
                        trapChain(a, chain);
                    }
                }
            });
        };
        trapChain(window, chain);
    }
    runAt(( ) => {
        setConstant(chain, rawValue);
    }, extraArgs.runAt);
}

function runAt(fn, when) {
    const intFromReadyState = state => {
        const targets = {
            'loading': 1, 'asap': 1,
            'interactive': 2, 'end': 2, '2': 2,
            'complete': 3, 'idle': 3, '3': 3,
        };
        const tokens = Array.isArray(state) ? state : [ state ];
        for ( const token of tokens ) {
            const prop = `${token}`;
            if ( Object.hasOwn(targets, prop) === false ) { continue; }
            return targets[prop];
        }
        return 0;
    };
    const runAt = intFromReadyState(when);
    if ( intFromReadyState(document.readyState) >= runAt ) {
        fn(); return;
    }
    const onStateChange = ( ) => {
        if ( intFromReadyState(document.readyState) < runAt ) { return; }
        fn();
        safe.removeEventListener.apply(document, args);
    };
    const safe = safeSelf();
    const args = [ 'readystatechange', onStateChange, { capture: true } ];
    safe.addEventListener.apply(document, args);
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

function validateConstantFn(trusted, raw, extraArgs = {}) {
    const safe = safeSelf();
    let value;
    if ( raw === 'undefined' ) {
        value = undefined;
    } else if ( raw === 'false' ) {
        value = false;
    } else if ( raw === 'true' ) {
        value = true;
    } else if ( raw === 'null' ) {
        value = null;
    } else if ( raw === "''" || raw === '' ) {
        value = '';
    } else if ( raw === '[]' || raw === 'emptyArr' ) {
        value = [];
    } else if ( raw === '{}' || raw === 'emptyObj' ) {
        value = {};
    } else if ( raw === 'noopFunc' ) {
        value = function(){};
    } else if ( raw === 'trueFunc' ) {
        value = function(){ return true; };
    } else if ( raw === 'falseFunc' ) {
        value = function(){ return false; };
    } else if ( raw === 'throwFunc' ) {
        value = function(){ throw ''; };
    } else if ( /^-?\d+$/.test(raw) ) {
        value = parseInt(raw);
        if ( isNaN(raw) ) { return; }
        if ( Math.abs(raw) > 0x7FFF ) { return; }
    } else if ( trusted ) {
        if ( raw.startsWith('json:') ) {
            try { value = safe.JSON_parse(raw.slice(5)); } catch { return; }
        } else if ( raw.startsWith('{') && raw.endsWith('}') ) {
            try { value = safe.JSON_parse(raw).value; } catch { return; }
        }
    } else {
        return;
    }
    if ( extraArgs.as !== undefined ) {
        if ( extraArgs.as === 'function' ) {
            return ( ) => value;
        } else if ( extraArgs.as === 'callback' ) {
            return ( ) => (( ) => value);
        } else if ( extraArgs.as === 'resolved' ) {
            return Promise.resolve(value);
        } else if ( extraArgs.as === 'rejected' ) {
            return Promise.reject(value);
        }
    }
    return value;
}

/******************************************************************************/

const scriptletGlobals = {}; // eslint-disable-line
const argsList = [["ConsoleBan.init","noopFunc"],["killads","true"],["PASSER_videoPAS_apres","0"],["nebula.session.flags.adblock","undefined"],["_adBlockCheck","true"],["navigator.storage.estimate","undefined"],["valid_user","true"],["Drupal.behaviors.detectAdblockers","noopFunc"],["ADBdetected","noopFunc"],["adblock","false"],["BIA.ADBLOCKER","false"],["samDetected","true"],["adBlockFunction","trueFunc"],["checkAds","trueFunc"],["google_jobrunner","true"],["isAdblockDisabled","true"],["adsAreShown","true"],["abd","false"],["detector_active","true"],["aoezone_adchecker","true"],["adsbygoogle","null"],["ads_not_blocked","true"],["hideBannerBlockedMessage","true"],["blurred","false"],["better_ads_adblock","0"],["adBlock","false"],["adsEnabled","true"],["ads_enabled","true"],["better_ads_adblock","null"],["adBlockDetected","false"],["mps._queue.abdetect","null"],["fuckAdBlock","trueFunc"],["abp","false"],["document.documentElement.AdBlockDetection","noopFunc"],["SD_BLOCKTHROUGH","true"],["ab","false"],["canRunAds","true"],["mb.advertisingShouldBeEnabled","false"],["checkAds","noopFunc"],["traffective","true"],["Time_Start","0"],["mtGlobal.disabledAds","true"],["ANN.ads.adblocked","false"],["placeAdsHandler","noopFunc"],["ramp.addUnits","noopFunc"],["pqdxwidthqt","false"],["nitroAds.loaded","true"],["topMessage","noopFunc"],["adblock","2"],["HTMLImageElement.prototype.onerror","undefined"],["disableSelection","noopFunc"],["checkPrivacyWall","noopFunc"],["document.oncontextmenu","null"],["nocontext","noopFunc"],["pageService.initDownloadProtection","noopFunc"],["detectPrivateMode","noopFunc"],["webkitRequestFileSystem","undefined"],["_sharedData.is_whitelisted_crawl_bot","true"],["ytInitialPlayerResponse.auxiliaryUi.messageRenderers.upsellDialogRenderer","undefined"],["TGMP_OBJ_CACHE.tritonsee_client.playAttemptsCount","trueFunc"],["console.debug","trueFunc"],["console.clear","trueFunc"],["document.oncontextmenu","undefined"],["f12lock","false"],["document.onselectstart","null"],["console.clear","undefined"],["document.onkeyup","null"],["document.ondragstart","null"],["commonUtil.openToast","null"],["NS_TVER_EQ.checkEndEQ","trueFunc"],["document.onkeydown","noopFunc"],["getSelection","undefined"],["document.onkeydown","null"],["console.clear","noopFunc"],["document.oncontextmenu","noopFunc"],["x5engine.utils.imCodeProtection","null"],["ansFrontendGlobals.settings.signupWallType","undefined"],["onload","null"],["document.ondragstart","noopFunc"],["document.onmousedown","noopFunc"],["document.onselectstart","noopFunc"],["disableselect","trueFunc"],["document.onkeypress","null"],["document.oncontextmenu",""],["document.onselectstart",""],["document.onkeydown",""],["document.onmousedown",""],["document.onclick",""],["document.body.onmouseup","null"],["document.oncopy","null"],["document.onkeydown","trueFunc"],["document.body.oncut","null"],["document.body.oncopy","null"],["console.log","noopFunc"],["document.ondragstart","trueFunc"],["document.onselectstart","trueFunc"],["jsData.hasVideoMeteringUnlogEnabled","undefined"],["lepopup_abd_enabled",""],["Object.prototype.preroll","[]"],["document.oncontextmenu","trueFunc"],["devtoolsDetector","undefined"],["Object.prototype.bgOverlay","noopFunc"],["Object.prototype.fixedContentPos","noopFunc"],["console.dir","noopFunc"],["navigator.userAgent",""],["devtoolIsOpening","noopFunc"],["devtoolIsOpening","undefined"],["securityTool.disableRightClick","noopFunc"],["securityTool.disableF12","noopFunc"],["securityTool.disableCtrlP","noopFunc"],["securityTool.disableCtrlS","noopFunc"],["securityTool.disablePrintScreen","noopFunc"],["securityTool.disablePrintThisPage","noopFunc"],["securityTool.disableElementForPrintThisPage","noopFunc"],["stopPrntScr","noopFunc"],["disableSelection","undefined"],["nocontext","undefined"],["disable_hot_keys","undefined"],["flashvars.autoplay",""],["document.body.oncopy","null","3"],["document.body.onselectstart","null","3"],["document.body.oncontextmenu","null","3"],["DD","trueFunc"],["document.oncontextmenu","null","3"],["Object.prototype._detectLoop","noopFunc"],["forbiddenList","[]"],["document.onkeypress","trueFunc"],["document.oncontextmenu","true"],["Object.prototype._detectLoop","undefined"],["SteadyWidgetSettings.adblockActive","false"],["devtoolsOpen","false"],["devtoolsDetector","noopFunc"],["DisDevTool","undefined"],["document.oncopy","noopFunc"],["devtoolsDetector.launch","noopFunc"],["console.clear","throwFunc"],["maxUnauthenicatedArticleViews","null"],["devtoolsDetector","{}"],["jh_disabled_options_data","null"],["document.onmousedown","null"],["forbidDebug","noopFunc"],["DisableDevtool","noopFunc"],["__NEXT_DATA__.props.pageProps.adPlacements","undefined"],["login_completed","true"],["console.table","trueFunc"],["console.log","trueFunc"],["Object.prototype.disableMenu","false"],["confirm","noopFunc"]];
const hostnamesMap = new Map([["xn-----0b4asja8cbew2b4b0gd0edbjm2jpa1b1e9zva7a0347s4da2797e7qri.xn--1ck2e1b",0],["xclient.info",1],["bejson.com",1],["impots.gouv.fr",2],["gearside.com",3],["nytimes.com",[4,5]],["tvtropes.org",6],["justtrucks.com.au",7],["ancient.eu",8],["intramed.net",9],["protest.eu",10],["northwestfirearms.com",11],["techkings.org",11],["spookshow.net",12],["fosshub.com",13],["pokemonforever.com",14],["carsguide.com.au",15],["webwereld.nl",16],["palemoon.org",17],["wheel-size.com",18],["aoezone.net",19],["bdcraft.net",20],["wired.co.uk",21],["gq-magazine.co.uk",21],["glamourmagazine.co.uk",21],["buienradar.nl",22],["clk.ink",23],["earnload.*",23],["windows101tricks.com",24],["fontsfree.pro",25],["strangermeetup.com",26],["radarbox.com",27],["adslayuda.com",28],["4x4earth.com",29],["rottentomatoes.com",30],["sovetromantica.com",31],["longecity.org",32],["gmx.net",33],["spanishdict.com",34],["epn.bz",35],["affbank.com",36],["meteoblue.com",37],["morosedog.gitlab.io",38],["tarnkappe.info",39],["bluemediafile.*",40],["marinetraffic.com",41],["animenewsnetwork.com",42],["digminecraft.com",43],["arras.io",44],["arras.netlify.app",44],["arrax.io",44],["how-to-pc.info",45],["programming-link.info",45],["maxroll.gg",46],["hitokageproduction.com",47],["vnexpress.net",48],["sporttotal.tv",49],["cittadinanza.biz",50],["glistranieri.it",50],["ideapod.com",[50,53]],["privivkainfo.ru",50],["awebstories.com",[50,114]],["humo.be",51],["apksecured.com",52],["intergate.info",52],["alphapolis.co.jp",[52,64]],["chronologia.pl",[52,64]],["reportergazeta.pl",[52,64,67]],["odiarioonline.com.br",[52,72]],["nordkorea-info.de",52],["geotips.net",[52,77]],["televisiongratishd.com",[52,72,82]],["noweconomy.live",52],["naaree.com",[52,72]],["cda-hd.cc",52],["hqq.to",[52,73,90]],["tv-tokyo.co.jp",52],["arti-definisi-pengertian.info",52],["studyadda.com",[52,139]],["radioony.fm",54],["mexiconewsdaily.com",55],["technologyreview.com",56],["instagram.com",57],["m.youtube.com",58],["music.youtube.com",58],["tv.youtube.com",58],["www.youtube.com",58],["youtubekids.com",58],["1009thecat.com",59],["1013katy.com",59],["1013themix.com",59],["1015jackfm.com",59],["1015khits.com",59],["1015thefox.com",59],["1017thebeach.com",59],["1017theteam.com",59],["1019hot.com",59],["1019online.com",59],["1019thekeg.com",59],["101thefox.net",59],["101wkqx.com",59],["1021nashicon.com",59],["1021thefox.com",59],["1023thewolf.com",59],["1025jackfm.com",59],["1027thevibe.com",59],["1029nashicon.com",59],["102thebear.com",59],["1031nowfm.com",59],["1031radiom.com",59],["1035memphis.com",59],["1035thegame.com",59],["1035wrbo.com",59],["1037nash.com",59],["1039bobfm.com",59],["1039wvbo.com",59],["1041wdlt.com",59],["1043thebridge.com",59],["1043thebridge.net",59],["1043thevibe.com",59],["1045thedan.com",59],["1045thezone.com",59],["1045wjjk.com",59],["1047krez.com",59],["1049nashicon.com",59],["1049thehits.com",59],["104thehawk.com",59],["1050talk.com",59],["1053classichits.com",59],["1053hotfm.com",59],["1053thebear.com",59],["1053thepoint.com",59],["1053thepoint.net",59],["1053wow.com",59],["1055kbuck.com",59],["1055thecat.com",59],["1057kokz.com",59],["1057nowfm.com",59],["1057thebear.com",59],["1057thex.com",59],["1057thexrocks.com",59],["1061theunderground.com",59],["1063spinfm.com",59],["1063thevibe.com",59],["1063wovo.com",59],["1065theticket.com",59],["1067thekrewe.com",59],["106x.com",59],["1070wnct.com",59],["1071bobfm.com",59],["1071thepeak.com",59],["1071thepoint.com",59],["1073wsjy.com",59],["1075nowfm.com",59],["1075thegame.com",59],["1077lakefm.com",59],["1077thebone.com",59],["1077theisland.com",59],["1079nashicon.com",59],["107countrypsk.com",59],["107nashicon.com",59],["1090kaay.com",59],["1220wkrs.com",59],["1230espnsports.com",59],["1230theteam.com",59],["1280wnam.com",59],["1290wlby.com",59],["1320thefan.com",59],["1340wmsa.com",59],["1430wcmy.com",59],["1450kven.com",59],["1480kyos.com",59],["1490wosh.com",59],["1510kga.com",59],["1590walg.com",59],["1620thezone.com",59],["1700thechamp.com",59],["2hoursmattpinfield.com",59],["600wrqx.com",59],["600wsom.com",59],["610knml.com",59],["630wpro.com",59],["640wxsm.com",59],["660wxqw.com",59],["680thefan.com",59],["770kkob.com",59],["790business.com",59],["790wpic.com",59],["810whb.com",59],["860kkat.com",59],["860utahsbigtalker.com",59],["900theticket.com",59],["921theticket.com",59],["923krst.com",59],["923thewolf.com",59],["925nashicon.com",59],["925thebear.com",59],["925thewolf.com",59],["927bobfm.com",59],["929peakfm.com",59],["929thewave.com",59],["929wbpm.com",59],["92kqrs.com",59],["92profm.com",59],["92qnashville.com",59],["931nashicon.com",59],["931thebeat.com",59],["933nashicon.com",59],["935nashfm.com",59],["935wrqn.com",59],["937nashicon.com",59],["937nowfm.com",59],["937themountain.com",59],["939northpoleradio.com",59],["939theville.com",59],["939xindy.com",59],["93q.com",59],["93wkct.com",59],["93x.com",59],["940wfaw.com",59],["941ksky.com",59],["941thebear.com",59],["941thehits.com",59],["945thedrive.com",59],["945thehawkradio.com",59],["947qdr.com",59],["947wls.com",59],["949kcmo.com",59],["949radiojondeek.com",59],["949starcountry.com",59],["949theoutlaw.com",59],["94rockradio.net",59],["951nashfm.com",59],["951kbby.com",59],["953hlf.com",59],["953thebeach.com",59],["953thescore.com",59],["955bobfm.com",59],["955glo.com",59],["955nashicon.com",59],["955thefan.com",59],["955thevibe.com",59],["957kboy.com",59],["957kpur.com",59],["957nashicon.com",59],["957thevibe.com",59],["957thewolfonline.com",59],["959therocket.com",59],["95sx.com",59],["95wiil.com",59],["95x.com",59],["961bbb.com",59],["961jamz.com",59],["961sox.com",59],["961wsox.com",59],["963nashicon.com",59],["963thezone.com",59],["963wdvd.com",59],["967shinefm.com",59],["969lacaliente.com",59],["969thewolf.com",59],["96key.com",59],["96kzel.com",59],["973eagle.com",59],["973nashfm.com",59],["975kabx.com",59],["975thevibe.com",59],["975wabd.com",59],["979nashfm.com",59],["979espnradio.com",59],["979nashicon.com",59],["979wvok.com",59],["979x.com",59],["97bht.com",59],["97rock.com",59],["980waav.com",59],["980wxlm.com",59],["981thebeat.com",59],["981themax.com",59],["981thevalley.com",59],["983nashicon.com",59],["983thekeg.com",59],["983vibe.com",59],["983wlcs.com",59],["985kissfm.net",59],["989magicfm.com",59],["989thebridge.com",59],["98theticket.com",59],["993kjoy.com",59],["995thejock.com",59],["995thewolf.com",59],["997cyk.com",59],["997cyk.org",59],["997kmjj.com",59],["997themix.com",59],["997wpro.com",59],["997wtn.com",59],["999thebuzz.com",59],["999thefoxrocks.com",59],["999thehawk.com",59],["99x.com",59],["kjmo.com",59],["nashfm100.com",59],["nashfm923krst.com",59],["nashfm1033.com",59],["nashfm1055.com",59],["nashfm929.com",59],["nashfm931.com",59],["nashfm941.com",59],["nashfm949.com",59],["nashfm981.com",59],["nashfmwisconsin.com",59],["nashicon989.com",59],["v100rocks.com",59],["albanymagic.com",59],["alice1077.com",59],["allthehitsb951.com",59],["alt1019.com",59],["alt1049albany.com",59],["alt2k.com",59],["alt923.com",59],["alt98.com",59],["am630.net",59],["amarillosrockstation.com",59],["americanpatriotmedia.com",59],["annarbors107one.com",59],["atlantasrockstation.com",59],["atlsportsx.com",59],["b106fm.com",59],["b1073.com",59],["b95.com",59],["b979.net",59],["b98.com",59],["b985slo.com",59],["b987.com",59],["bakersfieldespn.com",59],["bakersfieldespnsports.com",59],["beach985.com",59],["beachboogieandblues.com",59],["bear104.com",59],["big1013.com",59],["bigcheese1079.com",59],["bigcountry1073.com",59],["bigdawg985.com",59],["bigdog1067.com",59],["bigfrog101.com",59],["bigfroggy1053.com",59],["bigtalk1490.com",59],["blairgarner.com",59],["blazin1023.com",59],["blazin923.com",59],["bloomingtonhits.com",59],["bobfmspringfield.com",59],["bowlinggreensam.com",59],["bull973.com",59],["bxr.com",59],["caperadio1550.com",59],["catcountry.com",59],["catcountry96.com",59],["catcountryvermont.com",59],["cbssports1430.com",59],["cbssportserie.com",59],["cbssportsharrisburg.com",59],["cbssportsradio1430.com",59],["chicothunderheads.com",59],["christmas989.com",59],["ckrv.com",59],["classicfox.com",59],["classichits1033.com",59],["classichitsmy1059.com",59],["classichitswnyq.com",59],["classy100.com",59],["coast1013.com",59],["coast973.com",59],["country105fm.net",59],["countrycountdownusa.com",59],["countrylegends1059.com",59],["countrymi.com",59],["coyote1025.com",59],["cumulusdigital.com",59],["digitalsolutions201.com",59],["e93fm.com",59],["eagle97.com",59],["eagle993.com",59],["easy991.com",59],["ed.fm",59],["elizabethtownradio.com",59],["energy939indy.com",59],["espn1320columbia.com",59],["espn910.com",59],["espnhonolulu.com",59],["espnlouisville.com",59],["espnlv.com",59],["espnradio1280.com",59],["espnradio927.com",59],["espnradio941.com",59],["espnsyracuse.com",59],["espnur.com",59],["espnwestpalm.com",59],["espnwilmington.com",59],["fly92.com",59],["fly923.com",59],["fm102milwaukee.com",59],["fm102one.com",59],["fonzfm.com",59],["forevereaston.com",59],["forevermediayork.com",59],["fox969.com",59],["foxcincinnati.com",59],["foxsportsredding.com",59],["froggy1003.com",59],["froggy101fm.com",59],["froggy981.com",59],["froggy99.net",59],["froggycountry.net",59],["froggyland.com",59],["fuego1029.com",59],["fun1013.com",59],["fun969fm.com",59],["generations1023.com",59],["glory985.com",59],["go106.com",59],["goradioheartland.com",59],["gospel900.com",59],["gulf104.com",59],["heaven1460.com",59],["heaven983.com",59],["hitkicker997.com",59],["hitpage.com",59],["hits931fm.com",59],["hits96.com",59],["hits965.com",59],["hot1005.com",59],["hot100blono.com",59],["hot100nrv.com",59],["hot101.com",59],["hot102.net",59],["hot1033.com",59],["hot1039.com",59],["hot1047fm.com",59],["hot1057.com",59],["hot1063.com",59],["hot1067fm.com",59],["hot1067pa.com",59],["hot1077radio.com",59],["hot92and100.com",59],["hot933hits.com",59],["hot941.com",59],["hot967fm.com",59],["hvradionet.com",59],["i973hits.com",59],["ilovethehits.com",59],["indysmix.com",59],["jammin999fm.com",59],["jamz963.com",59],["jox2fm.com",59],["joxfm.com",59],["k100country.com",59],["k104online.com",59],["k105country.com",59],["k92radio.com",59],["k983.com",59],["kabc.com",59],["kaok.com",59],["kaperadio1550.com",59],["katm.com",59],["katt.com",59],["kbcy.com",59],["kber.com",59],["kboi.com",59],["kbul.com",59],["kbull93.com",59],["kcchiefsradio.com",59],["kcheradio.com",59],["kcmotalkradio.com",59],["kcmxam.com",59],["kennradio.com",59],["kernradio.com",59],["kesn1033.com",59],["key101fm.com",59],["kfru.com",59],["kftx.com",59],["kgfm.com",59],["kgfw.com",59],["kggo.com",59],["kgmo.com",59],["kgoradio.com",59],["khay.com",59],["khfm.com",59],["khfm.org",59],["khit1075.com",59],["khop.com",59],["khvl.com",59],["kiimfm.com",59],["kiss-1031.com",59],["kix1029.com",59],["kix106.com",59],["kix96.com",59],["kizn.com",59],["kjjy.com",59],["kjoy.com",59],["kkcy.com",59],["kkfm.com",59],["kkgb.com",59],["kkgl.com",59],["kkoh.com",59],["klif.com",59],["klik1240.com",59],["klin.com",59],["klur.com",59],["kmaj.com",59],["kmaj1440.com",59],["kmez1029.com",59],["kmjnow.com",59],["knbr.com",59],["knek.com",59],["kobfm.com",59],["kpla.com",59],["kpur107.com",59],["kqfc.com",59],["kqky.com",59],["kqms.com",59],["kqxy.com",59],["krbe.com",59],["krmd.com",59],["krny.com",59],["krrq.com",59],["krush925.com",59],["kruz1033.com",59],["ksam1017.com",59],["kscrhits.com",59],["kscs.com",59],["ksfo.com",59],["kshasta.com",59],["ksks.com",59],["ksmb.com",59],["ktcx.com",59],["ktik.com",59],["ktop1490.com",59],["ktucam.com",59],["kubaradio.com",59],["kubb.com",59],["kugn.com",59],["kuzz.com",59],["kuzzradio.com",59],["kvor.com",59],["kwin.com",59],["kwwr.com",59],["kxel.com",59],["kxzz1580am.com",59],["kyis.com",59],["kykz.com",59],["kzwafm.com",59],["la103.com",59],["laindomable.com",59],["laleync.com",59],["lanuevaomaha.com",59],["lite102.com",59],["literock105fm.com",59],["love105fm.com",59],["lvfoxsports.com",59],["magic1029fm.com",59],["magic1039fm.com",59],["magic1069.com",59],["magic1073.com",59],["magic1073fm.com",59],["magic93fm.com",59],["magic943fm.com",59],["magic979wtrg.com",59],["magic995abq.com",59],["majic97monroe.com",59],["majicspace.com",59],["maverick1023.com",59],["max94one.com",59],["maxrocks.net",59],["mega979.com",59],["mgeradio.com",59],["milwaukeesparty.com",59],["mix103.com",59],["mix1077albany.com",59],["mix965.net",59],["modernrock987.com",59],["montanassuperstation.com",59],["movin993.com",59],["muskegonnashicon.com",59],["my1059.com",59],["my961.com",59],["myblono.com",59],["mycolumbiabasin.com",59],["myfroggy95.com",59],["mykiss973.com",59],["mymagic106.com",59],["mymix1051.com",59],["mymix1061.com",59],["mymix961.com",59],["mystar98.com",59],["nashcountrydaily.com",59],["nashdetroit.com",59],["nashfm1007.com",59],["nashfm1011.com",59],["nashfm1017.com",59],["nashfm1025.com",59],["nashfm1027.com",59],["nashfm1061.com",59],["nashfm1065.com",59],["nashfm923.com",59],["nashfm937.com",59],["nashfm943.com",59],["nashfm951.com",59],["nashfm973.com",59],["nashfm991.com",59],["nashfmgreenbay.com",59],["nashfmsjo.com",59],["nashnightslive.net",59],["nashpensacola.com",59],["ncsportsradio.com",59],["nepasespnradio.com",59],["neuhoffmedia.com",59],["neuhoffmedialafayette.com",59],["newcountry963.com",59],["newsradio1029.com",59],["newsradio1440.com",59],["newsradioflorida.com",59],["newsradiokkob.com",59],["newsserver1.com",59],["newsserver2.com",59],["newsserver3.com",59],["newstalk1030.com",59],["newstalk1290koil.com",59],["newstalk730.com",59],["newstalk987.com",59],["newstalkwsba.com",59],["newswebradiocompany.net",59],["now937.com",59],["nrgmedia.com",59],["nrq.com",59],["og979.com",59],["okiecountry1017.com",59],["oldiesz104.com",59],["ottawaradio.net",59],["pensacolasjet.com",59],["peorias923.com",59],["picklefm.com",59],["pikefm.com",59],["planet1067.com",59],["pmbbroadcasting.com",59],["pmbradio.com",59],["power1021.com",59],["power103.com",59],["power1057.com",59],["power1069fm.com",59],["power923.com",59],["power94radio.com",59],["power955.com",59],["powerhits95.com",59],["powerslc.com",59],["praise1025fm.com",59],["purerock96.com",59],["q1005.com",59],["q1031fm.com",59],["q105.fm",59],["q1055.com",59],["q1061.com",59],["q106dot5.com",59],["q973radio.com",59],["q97country.com",59],["q98fm.com",59],["q997atlanta.com",59],["q99fm.com",59],["radio1039ny.com",59],["radiorockriver.com",59],["radiowoodstock.com",59],["realcountry1280whvr.com",59],["realcountryhv.com",59],["red1031.com",59],["red945.com",59],["rewind1019.com",59],["rickandsasha.com",59],["rock101.net",59],["rock1015.com",59],["rock103albany.com",59],["rock103rocks.com",59],["rock106.net",59],["rock107fm.com",59],["rock108.com",59],["rock945vt.com",59],["rockdaily.com",59],["rocknews.com",59],["rockofsavannah.com",59],["rockofsavannah.net",59],["softrock941.com",59],["southernillinoisnow.com",59],["southernsportstoday.com",59],["sportsanimal920.com",59],["sportsanimalabq.com",59],["sportscapitoldc.com",59],["sportshubtriad.com",59],["sportsradio1270.com",59],["sportsradio1440.com",59],["sportsradio1560.com",59],["sportsradio590am.com",59],["sportsradio740.com",59],["sportsradio967.com",59],["sportsradio970.com",59],["sportsradiobeaumont.com",59],["sportsradioberks.com",59],["sportsradiownml.com",59],["star98.net",59],["starfm1023.com",59],["starsplash.com",59],["stevegormanrocks.com",59],["sunny1031.com",59],["sunny1069fm.com",59],["sunny923.com",59],["sunny983.com",59],["sunnymuskegon.com",59],["supertalk1570.com",59],["sweet985.com",59],["talk104fm.com",59],["talk995.com",59],["talkradio1007.com",59],["tbhpod.com",59],["teammyrtlebeach.com",59],["test107.com",59],["thebear925.com",59],["thebigjab.com",59],["thebigstation93blx.com",59],["theblairgarnershow.com",59],["theconclave.com",59],["thefan1075.com",59],["thefanfm.com",59],["thegame541.com",59],["thehippo.com",59],["thehot1039.com",59],["thenewhotfm.com",59],["thenewpulsefm.com",59],["thepointontheweb.com",59],["therebelrocks.com",59],["therocket951.com",59],["therockstationz93.com",59],["thescore1260.com",59],["thesportsanimal.com",59],["theticket.com",59],["theticket1007.com",59],["theticket102.com",59],["theticket1590.com",59],["theticketmi.com",59],["thetybentlishow.com",59],["thevalley981.com",59],["thewolf1051.com",59],["thewolf951.com",59],["thisisqmusic.com",59],["thunder1073.com",59],["triadsports.com",59],["tuligaradio.com",59],["umpsports.com",59],["v100fm.com",59],["v1033.com",59],["vermilioncountyfirst.com",59],["vermillioncountyfirst.com",59],["w3dcountry.com",59],["w4country.com",59],["wa1a.com",59],["wabcradio.com",59],["walk975.com",59],["walkradio.com",59],["warm1033.com",59],["warm98.com",59],["waysam.com",59],["wbap.com",59],["wbbw.com",59],["wbmq.net",59],["wbnq.com",59],["wbpm929.com",59],["wbpmfm.com",59],["wbwn.com",59],["wcbm.com",59],["wceiradio.com",59],["wcfx.com",59],["wchv.com",59],["wclg.com",59],["wcoapensacola.com",59],["wcpqfm.com",59],["wcpt820.com",59],["wcpt820.net",59],["wcpt820am.com",59],["wcpt820am.net",59],["wcptam.com",59],["wcptam.net",59],["wcptamfm.com",59],["wcptamfm.net",59],["wcptamfm.org",59],["wcpyfm.com",59],["wctk.com",59],["wddoam.com",59],["wden.com",59],["wdml.com",59],["wdst.com",59],["wdst.org",59],["wdzz.com",59],["wedg.com",59],["werkfm.net",59],["werkradio.com",59],["wfasam.com",59],["wfav951.com",59],["wfmd.com",59],["wfms.com",59],["wfnc640am.com",59],["wfre.com",59],["wftw.com",59],["wgh1310.com",59],["wghsolidgold.com",59],["wglx.com",59],["wgni.com",59],["wgow.com",59],["wgowam.com",59],["wgrr.com",59],["whdg.com",59],["wheelz1045.com",59],["whli.com",59],["whrpfm.com",59],["whtt.com",59],["whud.com",59],["wild1029.com",59],["wild1049hd.com",59],["wild1061.com",59],["wild993fm.com",59],["wildcatsradio1290.com",59],["wink104.com",59],["winxfm.com",59],["wiog.com",59],["wiov.com",59],["wiov985.com",59],["wivk.com",59],["wivr1017.com",59],["wizn.com",59],["wjbc.com",59],["wjcw.com",59],["wjez.com",59],["wjjr.net",59],["wjoxam.com",59],["wjr.com",59],["wkav.com",59],["wkbethepoint.com",59],["wkga975.com",59],["wkhx.com",59],["wkmoradio.com",59],["wkol.com",59],["wkrs.com",59],["wkrufm.com",59],["wksm.com",59],["wkydeportes.com",59],["wlaq1410.com",59],["wlav.com",59],["wlbc.com",59],["wlevradio.com",59],["wlkwradio.com",59],["wlok.com",59],["wlsam.com",59],["wlum.com",59],["wlup.com",59],["wlwi.com",59],["wmac-am.com",59],["wmal.com",59],["wmqa.com",59],["wncv.com",59],["wogb.fm",59],["woko.com",59],["womg.com",59],["woodstockbroadcasting.com",59],["woodstockcommunication.com",59],["woodstockradio.net",59],["woodstocktv.net",59],["wovo1063.com",59],["wovofm.com",59],["wqut.com",59],["wqvealbany.com",59],["wrganews.com",59],["wrgm.com",59],["wrlo.com",59],["wrr101.com",59],["wrul.com",59],["wsba910.com",59],["wsfl.com",59],["wsjssports.com",59],["wskz.com",59],["wsyb1380am.com",59],["wtka.com",59],["wtma.com",59],["wtrxsports.com",59],["wttlradio.com",59],["wuuqradio.com",59],["wvel.com",59],["wvli927.com",59],["wvlkam.com",59],["wvnn.com",59],["wwck.com",59],["wwki.com",59],["wwqq101.com",59],["wxfx.com",59],["wxkr.com",59],["wxpkfm.com",59],["wynn1063.com",59],["wzpl.com",59],["wzyp.com",59],["wzzl.com",59],["x1051kc.com",59],["x95radio.com",59],["xs961.com",59],["xtrasports1300.com",59],["y-103.com",59],["y101hits.com",59],["y102montgomery.com",59],["y1065.com",59],["yesfm.net",59],["z1023online.com",59],["z1029.com",59],["z1075.com",59],["z937.com",59],["z93jamz.com",59],["z96.com",59],["z971.com",59],["zone1150.com",59],["zrock103.com",59],["zrockfm.com",59],["hindipix.*",[60,61]],["vidsrc.*",[61,141]],["bitcine.app",[61,144,145]],["cineby.app",[61,144,145]],["moflix-stream.day",[61,144,145]],["tv.verizon.com",[61,144,145]],["oceanof-games.com",62],["avdelphi.com",63],["doods.*",65],["ds2play.com",65],["ds2video.com",65],["d0o0d.com",65],["vidembed.me",65],["mzzcloud.life",65],["videobot.stream",65],["videovard.*",65],["justswallows.net",65],["onscreensvideo.com",65],["katerionews.com",65],["telenovelas-turcas.com.es",65],["kmo.to",65],["jeniusplay.com",[65,128]],["southcloud.tv",65],["d0000d.com",65],["jootc.com",[66,67]],["photobank.mainichi.co.jp",68],["tbs.co.jp",69],["fruit01.xyz",70],["foxteller.com",70],["lyricstranslate.com",71],["hardcoregames.ca",72],["allsmo.com",72],["themosvagas.com.br",72],["urbharat.xyz",72],["sportnews.to",[72,82]],["123movies.*",73],["sbasian.pro",73],["miraculous.to",[73,93]],["vtplayer.net",73],["webnovel.com",73],["pepperlive.info",73],["unbiasedsenseevent.com",73],["maxt.church",73],["cool-etv.net",73],["vgembed.com",[73,122]],["photopea.com",73],["szkolawohyn.pl",74],["torrentlawyer.com",[74,78,79,80]],["virpe.cc",74],["gmarket.co.kr",[74,79]],["paesifantasma.it",75],["talpo.it",75],["quora.com",76],["hoca4u.com",79],["youmath.it",81],["renditepassive.net",[83,84,85,86,87]],["360doc.com",88],["logonews.cn",89],["cloudcomputingtopics.net",90],["0123movies.ch",[90,95,99,126]],["gardenia.net",[91,92]],["novelpia.com",[94,95]],["brainly.*",96],["blueraindrops.com",97],["animecruzers.com",98],["descargatepelis.com",99],["news.ntv.co.jp",99],["bongdaplus.vn",99],["bestjavporn.com",100],["mm9841.cc",100],["ggwash.org",[101,102]],["ask4movie.*",[103,104]],["watch.lonelil.com",104],["cinegrabber.com",105],["layarkacaxxi.icu",106],["readawrite.com",[107,108,109,110,111,112,113]],["indianhealthyrecipes.com",115],["reborntrans.com",[116,117]],["secondlifetranslations.com",[116,117]],["heavyfetish.com",118],["joysound.com",[119,120,121]],["colors.sonicthehedgehog.com",[121,123]],["leakedzone.com",124],["mehoathinh2.com",125],["brutal.io",127],["powerline.io",127],["enduro-mtb.com",129],["kukaj.io",130],["animesaga.in",131],["animesuge.to",132],["aniwave.*",132],["anix.*",132],["flixrave.to",132],["hdtoday.so",132],["hurawatch.bz",132],["vidplay.*",132],["vid2faf.site",132],["thejakartapost.com",133],["ymovies.vip",134],["aniwatch.to",134],["aniwatchtv.to",134],["megacloud.tv",134],["hianime.*",134],["putlocker.vip",134],["rapid-cloud.co",134],["rabbitstream.net",134],["pupupul.site",134],["netu.*",134],["netuplayer.top",134],["stbnetu.xyz",134],["thotsbay.tv",134],["vipstreams.in",134],["freewatchtv.top",134],["gdplayertv.*",134],["mixstreams.top",134],["tvfreemium.top",134],["abysscdn.com",134],["grostembed.online",135],["megacloud.*",135],["premiumembeding.cloud",135],["venusembed.site",135],["animekai.to",135],["megaup.cc",135],["androidpolice.com",136],["makeuseof.com",136],["movieweb.com",136],["xda-developers.com",136],["thegamer.com",136],["cbr.com",136],["gamerant.com",136],["screenrant.com",136],["howtogeek.com",136],["thethings.com",136],["simpleflying.com",136],["dualshockers.com",136],["moviesapi.club",137],["bestx.stream",137],["watchx.top",137],["yugenanime.sx",137],["yugenanime.tv",137],["tv.bdix.app",138],["dngz.net",140],["archon.gg",142],["einthusan.tv",143],["sussytoons.*",146],["astro-cric.pages.dev",147],["crichype.*",147],["jio.pftv.ws",147],["shz.al",147],["tnt2-cricstreaming.pages.dev",147],["wlo-cricstreamiing.pages.dev",147]]);
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
    try { setConstant(...argsList[i]); }
    catch { }
}

/******************************************************************************/

// End of local scope
})();

void 0;
