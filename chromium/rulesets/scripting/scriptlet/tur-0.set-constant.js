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

// ruleset: tur-0

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
const argsList = [["adblock.check","noopFunc"],["adBlockDetected","noopFunc"],["App.detectAdBlock","noopFunc"],["canRunAds","true"],["eyeOfErstream.detectedBloke","falseFunc"],["xv_ad_block","0"],["tie.ad_blocker_disallow_images_placeholder","undefined"],["eazy_ad_unblocker_msg_var",""],["adbEnableForPage","false"],["detector_active","true"],["adblock_active","false"],["adBlockRunning","false"],["adb","false"],["maari","noopFunc"],["adBlockEnabled","false"],["kan_vars.adblock","undefined"],["hasAdblock","false"],["AdblockDetector","undefined"],["adblockCheckUrl",""],["adservice","{}"],["jQuery.adblock","false"],["koddostu_com_adblock_yok","null"],["adblock","false"],["puShown","true"],["isShow","true"],["app.ads","{}"],["adsConfigs.0.enabled","0"],["window.config.adv.enabled","0"],["window.config.match.watermark",""],["window.config.adv","{}"],["wpsaData","undefined"],["AdmostClient","noopFunc"],["S_Popup","2"],["loadPlayerAds","trueFunc"],["reklam_1",""],["reklamsayisi","0"],["volumeClearInterval","0"],["clicked","true"],["adSearchTitle","undefined"],["HBiddings.vastUrl",""],["initOpen","undefined"],["rg","noopFunc"],["Object.prototype.video_ads","noopFunc"],["Object.prototype.ads_enable","false"],["td_ad_background_click_link",""],["start","1"],["popup","noopFunc"],["downloadAds","noopFunc"],["manset_adv_imp","noopFunc"],["popupShown","true"],["adsConfig","{}"],["PopBanner","undefined"],["config.adv","{}"],["ads","{}"],["config.advertisement.enabled","false"],["reklamsayisi","1"],["window.config.advertisement.0.enabled","0"]];
const hostnamesMap = new Map([["teknop.net",0],["ozgunbilgi.com",0],["beceriksizler.net",0],["merlinscans.com",1],["haber3.com",2],["promy.pro",3],["iddaaorantahmin.com",3],["exxen.com",4],["exceldepo.com",5],["tgyama.com",6],["uzaymanga.com",[7,23]],["e-kitapstore.com",8],["wheel-size.com.tr",9],["karnaval.com",10],["mangaship.net",11],["mangaship.com",11],["miuitr.info",12],["puhutv.com",[13,14]],["coinotag.com",15],["cnnturk.com",[16,17]],["kanald.com.tr",[18,19]],["oyungibi.com",20],["veterinerhekimleri.com",20],["turkdenizcileri.com",21],["bilgalem.blogspot.com",21],["klavyeanaliz.org",22],["dizikral.nl",23],["puffytr.com",23],["anizle.com",23],["anizm.net",23],["dizimore.com",23],["dizirex.com",23],["maxfilmizle.pro",23],["turkifsa.xyz",23],["fullhdfilmizlesene.*",23],["royalfilmizle.com",23],["sinetiktok.com",23],["onlinedizi.xyz",23],["filmzirvesi.to",23],["filmifullizle.online",23],["sinemakolik.org",23],["filmerotixxx.com",23],["filmfc.com",23],["filmizletv18.com",[23,34]],["onlinefilmizle.site",23],["playerzz.xyz",23],["filmjr.org",23],["asfilmizle.com",23],["dizifast.net",23],["filmhe.com",23],["tranimaci.*",23],["hdfilmizle.site",23],["sinepal1.vip",23],["hdsinemax.com",23],["hdfilmizle.org",23],["siyahfilmizle.*",23],["tafdi4.com",23],["tafdi5.com",23],["elzemfilm.org",23],["tafdi3.com",23],["kozfilm.com",23],["hdfilmizle.in",23],["dizicaps.*",23],["filmizletv1.*",23],["diziyou.co",23],["fullhdfilmizle.*",[23,35,55]],["fullfilmizle.*",[23,55]],["sinepal.*",23],["dizimag.eu",23],["bumfilmizle1.com",23],["yabancidizilertv.*",23],["1080hdfilmizle.com",23],["hdfilmcehennemi.*",[23,55]],["yabancidizibax.com",23],["sinemangoo.org",23],["sexfilmleriizle.com",23],["fullhdfilm.*",[23,35]],["geziforumu.com",23],["efendim.xyz",23],["dizipaltv.net",23],["fluffcore.com",23],["hdfilmcehennemizle.com",23],["netfullfilmizle3.com",23],["filmmodu.info",23],["izlekolik.*",23],["arrowizle.com",23],["jokerfilmizle.com",23],["720pfilmiizle.net",23],["filmcus.com",23],["filmizlew.org",23],["zoof1.xyz",23],["sinemakolik.net",23],["sinefilmizlesen.com",23],["zarize.com",23],["burdenfly.com",23],["zzerotik.com",23],["filmgo.org",23],["sinemafilmizle.net",23],["filmkuzusu1.com",23],["hdfilmcix.*",[23,55]],["sinemadelisi.com",23],["erotikfilmtube.com",23],["dizipal.*",23],["filmizletv.*",[23,34,55]],["tekparthdfilmizle.*",23],["pornoanne.com",23],["dizikorea.*",23],["diziyo.*",23],["diziboxx.com",23],["dafflix.*",23],["turkaliz.com",23],["vkfilmizle.net",23],["dizimov.*",23],["filmizlet.net",23],["bumfilmizle.com",23],["shirl.club",23],["evrenselfilmlerim.org",23],["turkcealtyazilipornom.com",23],["fullhdfilmmodu2.*",23],["hdfilmizletv.net",23],["pembetv18.*",23],["sinemaizle.co",23],["hdfilmcehennem.live",23],["efullizle.com",23],["asyafanatiklerim.com",23],["dizilost.com",23],["fullhdfilmdeposu.com",23],["tranimeizle.*",23],["volsex.com",23],["divx720pfilmizle.org",23],["justintvizle21.pro",23],["justintvgiris.blogspot.com",23],["sportboss-macizlesbs.blogspot.com",23],["taraftarium402.blogspot.com",23],["macicanliizle.sbs",23],["taraftarium24canli-macizlesene.blogspot.com",23],["taraftarium24hdgiris1.blogspot.com",23],["selcukspor-taraftarium24canliizle1.blogspot.com",23],["taraftariumxx.cfd",23],["filmizle5.org",23],["filmizle6.org",23],["filmizle7.org",23],["filmizle8.org",23],["filmizle9.org",23],["filmizle10.org",23],["filmizle11.org",23],["filmizle12.org",23],["filmizle13.org",23],["filmizle14.org",23],["filmizle15.org",23],["filmizle16.org",23],["filmizle17.org",23],["filmizle18.org",23],["filmizle19.org",23],["filmizle20.org",23],["filmizle21.org",23],["filmizle22.org",23],["filmizle23.org",23],["filmizle24.org",23],["filmizle25.org",23],["inattvhd188.xyz",23],["inattvhd189.xyz",23],["inattvhd190.xyz",23],["inattvhd191.xyz",23],["inattvhd192.xyz",23],["inattvhd193.xyz",23],["inattvhd194.xyz",23],["inattvhd195.xyz",23],["inattvhd196.xyz",23],["inattvhd197.xyz",23],["inattvhd198.xyz",23],["inattvhd199.xyz",23],["inattvhd200.xyz",23],["inattvhd201.xyz",23],["inattvhd202.xyz",23],["inattvhd203.xyz",23],["inattvhd204.xyz",23],["inattvhd205.xyz",23],["inattvhd206.xyz",23],["inattvhd207.xyz",23],["inattvhd208.xyz",23],["inattvhd209.xyz",23],["inattvhd210.xyz",23],["inattvhd211.xyz",23],["inattvhd212.xyz",23],["inattvhd213.xyz",23],["inattvhd214.xyz",23],["inattvhd215.xyz",23],["inattvhd216.xyz",23],["inattvhd217.xyz",23],["inattvhd218.xyz",23],["inattvhd219.xyz",23],["inattvhd220.xyz",23],["inattvhd221.xyz",23],["playertrgb.pages.dev",24],["playertrgc.pages.dev",24],["tekfullfilmizle5.com",24],["dizipal73.cloud",24],["dizipal74.cloud",24],["dizipal132.cloud",24],["dizipal133.cloud",24],["dizipal134.cloud",24],["dizipal135.cloud",24],["dizipal140.cloud",24],["webteizle.xyz",24],["webteizle1.xyz",24],["webteizle2.xyz",24],["webteizle3.xyz",24],["webteizle4.xyz",24],["webteizle5.xyz",24],["webteizle6.xyz",24],["webteizle7.xyz",24],["webteizle8.xyz",24],["webteizle9.xyz",24],["webteizle10.xyz",24],["webteizle.click",24],["webteizle1.click",24],["webteizle2.click",24],["webteizle3.click",24],["webteizle4.click",24],["webteizle5.click",24],["webteizle6.click",24],["webteizle7.click",24],["webteizle8.click",24],["webteizle9.click",24],["webteizle10.click",24],["webteizle3.com",24],["webteizle4.com",24],["webteizle5.com",24],["webteizle6.com",24],["webteizle7.com",24],["webteizle8.com",24],["webteizle9.com",24],["webteizle10.com",24],["webteizle.info",24],["webteizle1.info",24],["webteizle2.info",24],["webteizle3.info",24],["webteizle4.info",24],["webteizle5.info",24],["webteizle6.info",24],["webteizle7.info",24],["webteizle8.info",24],["webteizle9.info",24],["webteizle10.info",24],["filmizlehdizle.com",25],["fullfilmizlesene.net",25],["xyzsprtsfrmr1.site",26],["mgviagrtoomuch.com",[27,28]],["hudsonlegalblog.com",27],["taraftarium.*",27],["taraftarium-24.com",27],["selcuksports.*",27],["selcuk-sports.com",27],["justintvsh.baby",27],["dmlstechnology.com",27],["justintvde.com",27],["justin-tv.org",27],["inattvgiris.pro",27],["justintv.*",27],["jplangbroek.com",27],["hayrirsds24.cfd",27],["pllsfored.com",29],["filmmodu.co",30],["diziroll.*",30],["dizilla.*",30],["dizipal12.site",30],["dizipal13.site",30],["dizipal14.site",30],["dizipal15.site",30],["dizipal16.site",30],["dizipal17.site",30],["dizipal18.site",30],["dizipal19.site",30],["dizipal20.site",30],["dizipal21.site",30],["dizipal22.site",30],["dizipal23.site",30],["dizipal24.site",30],["dizipal25.site",30],["dizipal26.site",30],["dizipal27.site",30],["dizipal28.site",30],["dizipal30.site",30],["arsiv.mackolik.com",31],["jetfilmizle.*",32],["nefisyemektarifleri.com",33],["izlesene.com",33],["tranimeci.com",36],["turkanime.co",37],["forum.donanimhaber.com",38],["atv.com.tr",39],["contentx.me",40],["edebiyatdefteri.com",41],["belgeselizlesene.com",[42,43]],["technopat.net",44],["pchocasi.com.tr",44],["aydindenge.com.tr",45],["diziall.com",46],["tamindir.com",47],["sondakika.com",48],["tranimaci.com",49],["da95848c82c933d2.click",50],["yeniasya.com.tr",51],["buenosairesideal.com",52],["pllsfored.co",52],["taraftarium.co",52],["inattv454.xyz",52],["inattv455.xyz",52],["inattv456.xyz",52],["inattv457.xyz",52],["inattv458.xyz",52],["inattv459.xyz",52],["inattv460.xyz",52],["inattv461.xyz",52],["inattv462.xyz",52],["inattv463.xyz",52],["inattv464.xyz",52],["inattv465.xyz",52],["inattv466.xyz",52],["inattv467.xyz",52],["inattv468.xyz",52],["inattv469.xyz",52],["inattv470.xyz",52],["inattv471.xyz",52],["inattv472.xyz",52],["inattv473.xyz",52],["inattv474.xyz",52],["inattv475.xyz",52],["inattv476.xyz",52],["inattv477.xyz",52],["inattv478.xyz",52],["inattv479.xyz",52],["inattv480.xyz",52],["inattv481.xyz",52],["inattv482.xyz",52],["inattv483.xyz",52],["inattv484.xyz",52],["inattv485.xyz",52],["inattv486.xyz",52],["inattv487.xyz",52],["inattv488.xyz",52],["inattv489.xyz",52],["inattv490.xyz",52],["inattv491.xyz",52],["inattv492.xyz",52],["inattv493.xyz",52],["inattv494.xyz",52],["inattv495.xyz",52],["inattv496.xyz",52],["inattv497.xyz",52],["inattv498.xyz",52],["inattv499.xyz",52],["inattv500.xyz",52],["domplayer.org",53],["cinque.668a396e58bcbc27.click",54],["fullhdizle.*",55],["filmizlehdfilm.com",55],["fullfilmizle.cc",55],["fullhdfilmizletv.*",55],["hdfilmizlesene.org",55],["sinema.cx",55],["xyzsports173.xyz",56],["xyzsports174.xyz",56],["xyzsports175.xyz",56],["xyzsports176.xyz",56],["xyzsports177.xyz",56],["xyzsports178.xyz",56],["xyzsports179.xyz",56],["xyzsports180.xyz",56],["xyzsports181.xyz",56],["xyzsports182.xyz",56],["xyzsports183.xyz",56],["xyzsports184.xyz",56],["xyzsports185.xyz",56],["xyzsports186.xyz",56],["xyzsports187.xyz",56],["xyzsports188.xyz",56],["xyzsports189.xyz",56],["xyzsports190.xyz",56],["xyzsports191.xyz",56],["xyzsports192.xyz",56],["xyzsports193.xyz",56],["xyzsports194.xyz",56],["xyzsports195.xyz",56],["xyzsports196.xyz",56],["xyzsports197.xyz",56],["xyzsports198.xyz",56],["xyzsports199.xyz",56],["xyzsports200.xyz",56]]);
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
