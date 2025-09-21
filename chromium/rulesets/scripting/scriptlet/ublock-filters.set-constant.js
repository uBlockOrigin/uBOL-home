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
const argsList = [["console.clear","undefined"],["aclib.runInPagePush","{}","as","callback"],["aclib.runBanner","{}","as","function"],["aclib.runPop","throwFunc"],["aclib.runInterstitial","{}","as","function"],["aclib.runAutoTag","noopFunc"],["adBlockDetected","undefined"],["akamaiDisableServerIpLookup","noopFunc"],["DD_RUM.addAction","noopFunc"],["nads.createAd","trueFunc"],["dvtag.getTargeting","trueFunc"],["ga","noopFunc"],["huecosPBS.nstdX","null"],["DTM.trackAsyncPV","noopFunc"],["_satellite","{}"],["_satellite.getVisitorId","noopFunc"],["newPageViewSpeedtest","noopFunc"],["pubg.unload","noopFunc"],["generateGalleryAd","noopFunc"],["mediator","noopFunc"],["Object.prototype.subscribe","noopFunc"],["gbTracker","{}"],["gbTracker.sendAutoSearchEvent","noopFunc"],["Object.prototype.vjsPlayer.ads","noopFunc"],["network_user_id",""],["google.ima.OmidVerificationVendor","{}"],["Object.prototype.omidAccessModeRules","{}"],["googletag.cmd","{}"],["_aps","{}"],["Object.prototype.setDisableFlashAds","noopFunc"],["DD_RUM.addTiming","noopFunc"],["chameleonVideo.adDisabledRequested","true"],["AdmostClient","{}"],["analytics","{}"],["datalayer","[]"],["Object.prototype.isInitialLoadDisabled","noopFunc"],["listingGoogleEETracking","noopFunc"],["dcsMultiTrack","noopFunc"],["urlStrArray","noopFunc"],["pa","{}"],["Object.prototype.setConfigurations","noopFunc"],["Object.prototype.bk_addPageCtx","noopFunc"],["Object.prototype.bk_doJSTag","noopFunc"],["passFingerPrint","noopFunc"],["optimizely","{}"],["optimizely.initialized","true"],["google_optimize","{}"],["google_optimize.get","noopFunc"],["_gsq","{}"],["_gsq.push","noopFunc"],["stmCustomEvent","noopFunc"],["_gsDevice",""],["iom","{}"],["iom.c","noopFunc"],["_conv_q","{}"],["_conv_q.push","noopFunc"],["google.ima.settings.setDisableFlashAds","noopFunc"],["pa.privacy","{}"],["populateClientData4RBA","noopFunc"],["YT.ImaManager","noopFunc"],["UOLPD","{}"],["UOLPD.dataLayer","{}"],["__configuredDFPTags","{}"],["URL_VAST_YOUTUBE","{}"],["Adman","{}"],["dplus","{}"],["dplus.track","noopFunc"],["_satellite.track","noopFunc"],["google.ima.dai","{}"],["gfkS2sExtension","{}"],["gfkS2sExtension.HTML5VODExtension","noopFunc"],["AnalyticsEventTrackingJS","{}"],["AnalyticsEventTrackingJS.addToBasket","noopFunc"],["AnalyticsEventTrackingJS.trackErrorMessage","noopFunc"],["initializeslideshow","noopFunc"],["fathom","{}"],["fathom.trackGoal","noopFunc"],["Origami","{}"],["Origami.fastclick","noopFunc"],["jad","undefined"],["hasAdblocker","true"],["Sentry","{}"],["Sentry.init","noopFunc"],["TRC","{}"],["TRC._taboolaClone","[]"],["fp","{}"],["fp.t","noopFunc"],["fp.s","noopFunc"],["initializeNewRelic","noopFunc"],["turnerAnalyticsObj","{}"],["turnerAnalyticsObj.setVideoObject4AnalyticsProperty","noopFunc"],["optimizelyDatafile","{}"],["optimizelyDatafile.featureFlags","[]"],["fingerprint","{}"],["fingerprint.getCookie","noopFunc"],["gform.utils","noopFunc"],["gform.utils.trigger","noopFunc"],["get_fingerprint","noopFunc"],["moatPrebidApi","{}"],["moatPrebidApi.getMoatTargetingForPage","noopFunc"],["cpd_configdata","{}"],["cpd_configdata.url",""],["yieldlove_cmd","{}"],["yieldlove_cmd.push","noopFunc"],["dataLayer.push","noopFunc"],["_etmc","{}"],["_etmc.push","noopFunc"],["freshpaint","{}"],["freshpaint.track","noopFunc"],["ShowRewards","noopFunc"],["stLight","{}"],["stLight.options","noopFunc"],["DD_RUM.addError","noopFunc"],["sensorsDataAnalytic201505","{}"],["sensorsDataAnalytic201505.init","noopFunc"],["sensorsDataAnalytic201505.quick","noopFunc"],["sensorsDataAnalytic201505.track","noopFunc"],["s","{}"],["s.tl","noopFunc"],["smartech","noopFunc"],["sensors","{}"],["sensors.init","noopFunc"],["sensors.track","noopFunc"],["adn","{}"],["adn.clearDivs","noopFunc"],["_vwo_code","{}"],["gtag","noopFunc"],["_taboola","{}"],["_taboola.push","noopFunc"],["clicky","{}"],["clicky.goal","noopFunc"],["WURFL","{}"],["_sp_.config.events.onSPPMObjectReady","noopFunc"],["gtm","{}"],["gtm.trackEvent","noopFunc"],["mParticle.Identity.getCurrentUser","noopFunc"],["JSGlobals.prebidEnabled","false"],["elasticApm","{}"],["elasticApm.init","noopFunc"],["ga.sendGaEvent","noopFunc"],["adobe","{}"],["MT","{}"],["MT.track","noopFunc"],["ClickOmniPartner","noopFunc"],["adex","{}"],["adex.getAdexUser","noopFunc"],["Adkit","noopFunc"],["Object.prototype.shouldExpectGoogleCMP","false"],["apntag.refresh","noopFunc"],["pa.sendEvent","noopFunc"],["Munchkin","{}"],["Munchkin.init","noopFunc"],["ttd_dom_ready","noopFunc"],["ramp","undefined"],["appInfo.snowplow.trackSelfDescribingEvent","noopFunc"],["_vwo_code.init","noopFunc"],["adobePageView","noopFunc"],["dapTracker","{}"],["dapTracker.track","noopFunc"],["newrelic","{}"],["newrelic.setCustomAttribute","noopFunc"],["adobeDataLayer","{}"],["adobeDataLayer.push","noopFunc"],["Object.prototype._adsDisabled","true"],["ytInitialPlayerResponse.playerAds","undefined"],["ytInitialPlayerResponse.adPlacements","undefined"],["ytInitialPlayerResponse.adSlots","undefined"],["playerResponse.adPlacements","undefined"],["nsShowMaxCount","0"],["objVc.interstitial_web",""],["_ml_ads_ns","null"],["_sp_.config","undefined"],["isAdBlockActive","false"],["AdController","noopFunc"],["console.clear","noopFunc"],["Object.prototype.hideAds","true"],["Object.prototype._getSalesHouseConfigurations","noopFunc"],["vast_urls","{}"],["sadbl","false"],["adblockcheck","false"],["arrvast","[]"],["blurred","false"],["flashvars.adv_pre_src",""],["showPopunder","false"],["page_params.holiday_promo","true"],["adsEnabled","true"],["String.prototype.charAt","trueFunc"],["ad_blocker","false"],["blockAdBlock","true"],["VikiPlayer.prototype.pingAbFactor","noopFunc"],["player.options.disableAds","true"],["console.clear","trueFunc"],["flashvars.adv_pre_vast",""],["flashvars.adv_pre_vast_alt",""],["x_width","1"],["_site_ads_ns","true"],["luxuretv.config",""],["Object.prototype.AdOverlay","noopFunc"],["tkn_popunder","null"],["can_run_ads","true"],["adsBlockerDetector","noopFunc"],["globalThis","null"],["adblock","false"],["__ads","true"],["FlixPop.isPopGloballyEnabled","falseFunc"],["check_adblock","true"],["$.magnificPopup.open","noopFunc"],["adsenseadBlock","noopFunc"],["adblockSuspected","false"],["xRds","true"],["cRAds","false"],["disasterpingu","false"],["App.views.adsView.adblock","false"],["flashvars.adv_pause_html",""],["$.fx.off","true"],["adBlockEnabled","false"],["puShown","true"],["showAds","true"],["attr","{}"],["scriptSrc",""],["cxStartDetectionProcess","noopFunc"],["isAdBlocked","false"],["adblock","noopFunc"],["path",""],["_ctrl_vt.blocked.ad_script","false"],["blockAdBlock","noopFunc"],["caca","noopFunc"],["Ok","true"],["safelink.adblock","false"],["openPopunder","noopFunc"],["ClickUnder","noopFunc"],["flashvars.adv_pre_url",""],["flashvars.protect_block",""],["flashvars.video_click_url",""],["adBlock","false"],["spoof","noopFunc"],["btoa","null"],["sp_ad","true"],["adsBlocked","false"],["_sp_.msg.displayMessage","noopFunc"],["CaptchmeState.adb","undefined"],["UhasAB","false"],["adNotificationDetected","false"],["atob","noopFunc"],["_pop","noopFunc"],["CnnXt.Event.fire","noopFunc"],["_ti_update_user","noopFunc"],["valid","1"],["vastAds","[]"],["adblock","1"],["frg","1"],["time","0"],["ads","true"],["GNCA_Ad_Support","true"],["Date.now","noopFunc"],["jQuery.adblock","1"],["VMG.Components.Adblock","false"],["adblockDetector","trueFunc"],["hasPoped","true"],["flashvars.video_click_url","undefined"],["flashvars.adv_start_html",""],["flashvars.popunder_url",""],["flashvars.adv_post_src",""],["flashvars.adv_post_url",""],["jQuery.adblock","false"],["google_jobrunner","true"],["sec","0"],["gadb","false"],["checkadBlock","noopFunc"],["clientSide.adbDetect","noopFunc"],["HTMLAnchorElement.prototype.click","noopFunc"],["cmnnrunads","true"],["adBlocker","false"],["adBlockDetected","noopFunc"],["StileApp.somecontrols.adBlockDetected","noopFunc"],["MDCore.adblock","0"],["google_tag_data","noopFunc"],["noAdBlock","true"],["adsOk","true"],["check","true"],["isal","true"],["document.hidden","true"],["awm","true"],["adblockEnabled","false"],["is_adblocked","false"],["pogo.intermission.staticAdIntermissionPeriod","0"],["SubmitDownload1","noopFunc"],["t","0"],["ckaduMobilePop","noopFunc"],["tieneAdblock","0"],["adsAreBlocked","false"],["cmgpbjs","false"],["displayAdblockOverlay","false"],["google","false"],["Math.pow","noopFunc"],["openInNewTab","noopFunc"],["runAdBlocker","false"],["Adblock","false"],["flashvars.logo_url",""],["flashvars.logo_text",""],["nlf.custom.userCapabilities","false"],["count","0"],["LoadThisScript","true"],["showPremLite","true"],["closeBlockerModal","false"],["adBlockDetector.isEnabled","falseFunc"],["areAdsDisplayed","true"],["gkAdsWerbung","true"],["pop_target","null"],["is_banner","true"],["$easyadvtblock","false"],["show_dfp_preroll","false"],["show_youtube_preroll","false"],["doads","true"],["jsUnda","noopFunc"],["AlobaidiDetectAdBlock","true"],["Advertisement","1"],["adBlockDetected","false"],["abp1","1"],["pr_okvalida","true"],["$.ajax","trueFunc"],["cnbc.canShowAds","true"],["firefaucet","true"],["cRAds","true"],["uas","[]"],["flashvars.popunder_url","undefined"],["adv","true"],["prerollMain","undefined"],["canRunAds","true"],["Fingerprint2","true"],["dclm_ajax_var.disclaimer_redirect_url",""],["load_pop_power","noopFunc"],["adBlockDetected","true"],["Time_Start","0"],["blockAdBlock","trueFunc"],["ezstandalone.enabled","true"],["foundation.adPlayer.bitmovin","{}"],["weltConfig.switches.videoAdBlockBlocker","false"],["DL8_GLOBALS.enableAdSupport","false"],["DL8_GLOBALS.useHomad","false"],["DL8_GLOBALS.enableHomadDesktop","false"],["DL8_GLOBALS.enableHomadMobile","false"],["Object.prototype.adReinsertion","noopFunc"],["getHomadConfig","noopFunc"],["ab","false"],["go_popup","{}"],["noBlocker","true"],["adsbygoogle","null"],["fabActive","false"],["gWkbAdVert","true"],["noblock","true"],["wgAffiliateEnabled","false"],["ads","null"],["detectAdblock","noopFunc"],["adsLoadable","true"],["ASSetCookieAds","null"],["letShowAds","true"],["ulp_noadb","true"],["Object.prototype.adblock_detected","false"],["timeSec","0"],["adsbygoogle.loaded","true"],["ads_unblocked","true"],["xxSetting.adBlockerDetection","false"],["open","undefined"],["Drupal.behaviors.adBlockerPopup","null"],["fake_ad","true"],["koddostu_com_adblock_yok","null"],["adsbygoogle","trueFunc"],["player.ads.cuePoints","undefined"],["adBlockDetected","null"],["better_ads_adblock","1"],["Adv_ab","false"],["sgpbCanRunAds","true"],["document.hidden","false"],["hasFocus","trueFunc"],["navigator.brave","undefined"],["Object.prototype.isAllAdClose","true"],["document.hasFocus","trueFunc"],["isRequestPresent","true"],["fouty","true"],["Notification","undefined"],["protection","noopFunc"],["private","false"],["navigator.webkitTemporaryStorage.queryUsageAndQuota","noopFunc"],["document.onkeydown","noopFunc"],["showadas","true"],["alert","throwFunc"],["aSl.gcd","0"],["window.adLink","null"],["detectedAdblock","undefined"],["isTabActive","true"],["clicked","2"],["ov.advertising.tisoomi.loadScript","noopFunc"],["abp","false"],["hommy","{}"],["hommy.waitUntil","noopFunc"],["flashvars.mlogo",""],["vpPrerollVideo","undefined"],["PlayerConfig.config.CustomAdSetting","[]"],["PlayerConfig.trusted","true"],["PlayerConfig.config.AffiliateAdViewLevel","3"],["univresalP","noopFunc"],["hold_click","false"],["tie.ad_blocker_detector","false"],["admiral","noopFunc"],["gnt.x.uam"],["gnt.u.z","true"],["__INITIAL_DATA__.siteData.admiralScript"],["objAd.loadAdShield","noopFunc"],["window.myAd.runAd","noopFunc"],["detectAdBlock","noopFunc"],["__INITIAL_STATE__.config.theme.ads.isAdBlockerEnabled","false"],["__INITIAL_STATE__.gameLists.gamesNoPrerollIds.indexOf","trueFunc"],["document.ontouchend","null"],["document.onclick","null"],["playID","1"],["killads","true"],["googletag._loaded_","true"],["app._data.ads","[]"],["pubAdsService","trueFunc"],["config.pauseInspect","false"],["appContext.adManager.context.current.adFriendly","false"],["blockAdBlock._options.baitClass","null"],["document.blocked_var","1"],["____ads_js_blocked","false"],["wIsAdBlocked","false"],["WebSite.plsDisableAdBlock","null"],["ads_blocked","false"],["samDetected","false"],["countClicks","0"],["settings.adBlockerDetection","false"],["mixpanel.get_distinct_id","true"],["fuckAdBlock._options.baitClass","null"],["bscheck.adblocker","noopFunc"],["qpcheck.ads","noopFunc"],["isContentBlocked","falseFunc"],["CloudflareApps.installs.Ik7rmQ4t95Qk.options.measureDomain","undefined"],["detectAB1","noopFunc"],["uBlockOriginDetected","false"],["googletag._vars_","{}"],["googletag._loadStarted_","true"],["google_unique_id","1"],["google.javascript","{}"],["google.javascript.ads","{}"],["google_global_correlator","1"],["paywallGateway.truncateContent","noopFunc"],["adBlockDisabled","true"],["__NEXT_DATA__.props.pageProps.adVideo","undefined"],["blockedElement","noopFunc"],["popit","false"],["adBlockerDetected","false"],["abu","falseFunc"],["countdown","0"],["decodeURI","noopFunc"],["flashvars.adv_postpause_vast",""],["xv_ad_block","0"],["openWindow","noopFunc"],["vidorev_jav_plugin_video_ads_object.vid_ads_m_video_ads",""],["adsProvider.init","noopFunc"],["SDKLoaded","true"],["POPUNDER_ENABLED","false"],["plugins.preroll","noopFunc"],["errcode","0"],["DHAntiAdBlocker","true"],["showada","true"],["showax","true"],["p18","undefined"],["ADBLOCKED","false"],["Object.prototype.adsEnabled","false"],["adb","0"],["String.fromCharCode","trueFunc"],["adblock_use","false"],["Object.prototype.adblockFound","false"],["createCanvas","noopFunc"],["document.bridCanRunAds","true"],["playerAdSettings.adLink",""],["playerAdSettings.waitTime","0"],["xv.sda.pp.init","noopFunc"],["isAdsLoaded","true"],["adblockerAlert","noopFunc"],["Object.prototype.parseXML","noopFunc"],["Object.prototype.blackscreenDuration","1"],["Object.prototype.adPlayerId",""],["adblockDetect","noopFunc"],["style","noopFunc"],["history.pushState","noopFunc"],["google_unique_id","6"],["__NEXT_DATA__.props.pageProps.adsConfig","undefined"],["new_config.timedown","0"],["truex","{}"],["truex.client","noopFunc"],["hiddenProxyDetected","false"],["SteadyWidgetSettings.adblockActive","false"],["proclayer","noopFunc"],["timeleft","0"],["load_ads","trueFunc"],["starPop","1"],["Object.prototype.ads","noopFunc"],["detectBlockAds","noopFunc"],["ad_link",""],["penciBlocksArray","[]"],["App.AdblockDetected","false"],["SF.adblock","true"],["startfrom","0"],["D4zz","noopFunc"],["Object.prototype.ads.nopreroll_","true"],["HP_Scout.adBlocked","false"],["SD_IS_BLOCKING","false"],["Object.prototype.isPremium","true"],["__BACKPLANE_API__.renderOptions.showAdBlock",""],["Object.prototype.isNoAds","{}"],["tv3Cmp.ConsentGiven","true"],["setupSkin","noopFunc"],["Object.prototype.enableInterstitial","false"],["ads","undefined"],["td_ad_background_click_link","undefined"],["POSTPART_prototype.ADKEY","noopFunc"],["adBlockDetected","falseFunc"],["divWidth","1"],["noAdBlock","noopFunc"],["AdService.info.abd","noopFunc"],["adBlockDetectionResult","undefined"],["popped","true"],["puShown1","true"],["passthetest","true"],["pandaAdviewValidate","true"],["canGetAds","true"],["ad_blocker_active","false"],["init_welcome_ad","noopFunc"],["document.body.contains","trueFunc"],["popunder","undefined"],["distance","0"],["document.onclick",""],["adEnable","true"],["displayAds","0"],["_adshrink.skiptime","0"],["AbleToRunAds","true"],["PreRollAd.timeCounter","0"],["abpblocked","undefined"],["paAddUnit","noopFunc"],["adt","0"],["test_adblock","noopFunc"],["adblockDetector","noopFunc"],["vastEnabled","false"],["detectadsbocker","false"],["two_worker_data_js.js","[]"],["FEATURE_DISABLE_ADOBE_POPUP_BY_COUNTRY","true"],["questpassGuard","noopFunc"],["isAdBlockerEnabled","false"],["sssp","emptyObj"],["smartLoaded","true"],["timeLeft","0"],["Cookiebot","noopFunc"],["feature_flags.interstitial_ads_flag","false"],["feature_flags.interstitials_every_four_slides","false"],["waldoSlotIds","true"],["adblockstatus","false"],["adScriptLoaded","true"],["adblockEnabled","noopFunc"],["adSettings","[]"],["banner_is_blocked","false"],["Object.prototype.adBlocked","false"],["chp_adblock_browser","noopFunc"],["googleAd","true"],["Brid.A9.prototype.backfillAdUnits","[]"],["dct","0"],["slideShow.displayInterstitial","true"],["googletag","true"],["tOS2","150"],["checkAdBlocker","noopFunc"],["navigator.standalone","true"],["empire.pop","undefined"],["empire.direct","undefined"],["empire.directHideAds","undefined"],["empire.mediaData.advisorMovie","1"],["empire.mediaData.advisorSerie","1"],["setTimer","0"],["penci_adlbock.ad_blocker_detector","0"],["Object.prototype.adblockDetector","noopFunc"],["blext","true"],["vidorev_jav_plugin_video_ads_object","{}"],["vidorev_jav_plugin_video_ads_object_post","{}"],["S_Popup","10"],["rabLimit","-1"],["nudgeAdBlock","noopFunc"],["feedBack.showAffilaePromo","noopFunc"],["ShowAdvertising","{}"],["FAVE.settings.ads.ssai.prod.clips.enabled","false"],["FAVE.settings.ads.ssai.prod.liveAuth.enabled","false"],["FAVE.settings.ads.ssai.prod.liveUnauth.enabled","false"],["HTMLScriptElement.prototype.onerror","null"],["loadpagecheck","noopFunc"],["art3m1sItemNames.affiliate-wrapper","\"\""],["window.adngin","{}"],["amzn_aps_csm","{}"],["isAdBlockerActive","noopFunc"],["di.app.WebplayerApp.Ads.Adblocks.app.AdBlockDetectApp.startWithParent","false"],["sharedController.adblockDetector","noopFunc"],["checkAdsStatus","noopFunc"],["settings.adBlockDetectionEnabled","false"],["displayInterstitialAdConfig","false"],["checkAdBlockeraz","noopFunc"],["blockingAds","false"],["Yii2App.playbackTimeout","0"],["QiyiPlayerProphetData.a.data","{}"],["toggleAdBlockInfo","falseFunc"],["aipAPItag.prerollSkipped","true"],["aipAPItag.setPreRollStatus","trueFunc"],["reklam_1_saniye","0"],["reklam_1_gecsaniye","0"],["reklamsayisi","1"],["reklam_1",""],["HTMLImageElement.prototype.onerror","undefined"],["HTMLImageElement.prototype.onload","undefined"],["powerAPITag","emptyObj"],["playerEnhancedConfig.run","throwFunc"],["aoAdBlockDetected","false"],["rodo.checkIsDidomiConsent","noopFunc"],["xtime","0"],["Div_popup",""],["Scribd.Blob.AdBlockerModal","noopFunc"],["AddAdsV2I.addBlock","false"],["hasAdBlocker","false"],["initials.yld-pdpopunder",""],["advertisement3","true"],["DisableDevtool","noopFunc"],["clicked","true"],["eClicked","true"],["number","0"],["sync","true"],["PlayerLogic.prototype.detectADB","noopFunc"],["showPopunder","noopFunc"],["Object.prototype.prerollAds","[]"],["notifyMe","noopFunc"],["adsClasses","undefined"],["gsecs","0"],["dvsize","52"],["majorse","true"],["completed","1"],["testerli","false"],["w87.abd","noopFunc"],["w87.dsab","noopFunc"],["document.referrer",""],["Object.prototype.setNeedShowAdblockWarning","noopFunc"],["NoAdBlock","noopFunc"],["adList","[]"],["ifmax","true"],["nitroAds.abp","true"],["onloadUI","noopFunc"],["PageLoader.DetectAb","0"],["one_time","1"],["consentGiven","true"],["GEMG.GPT.Interstitial","noopFunc"],["amiblock","0"],["karte3","18"],["sandDetect","noopFunc"],["amodule.data","emptyArr"],["Object.prototype.ADBLOCK_DETECTION",""],["postroll","undefined"],["interstitial","undefined"],["isAdBlockDetected","false"],["pData.adblockOverlayEnabled","0"],["cabdSettings","undefined"],["td_ad_background_click_link"],["malisx","true"],["alim","true"],["ADS.isBannersEnabled","false"],["EASYFUN_ADS_CAN_RUN","true"],["adsbygoogle_ama_fc_has_run","true"],["jwDefaults.advertising","{}"],["elimina_profilazione","1"],["elimina_pubblicita","1"],["abd","{}"],["checkerimg","noopFunc"],["detectedAdblock","noopFunc"],["Object.prototype.DetectByGoogleAd","noopFunc"],["nitroAds","{}"],["nitroAds.createAd","noopFunc"],["NativeAd","noopFunc"],["window.navigator.brave","undefined"],["HTMLScriptElement.prototype.onerror","undefined"],["isAdblock","false"],["openPop","noopFunc"],["cns.library","true"],["BJSShowUnder","{}"],["BJSShowUnder.bindTo","noopFunc"],["BJSShowUnder.add","noopFunc"],["Object.prototype._parseVAST","noopFunc"],["Object.prototype.createAdBlocker","noopFunc"],["Object.prototype.isAdPeriod","falseFunc"],["ABLK","false"],["_n_app.popunder","null"],["_n_app.options.ads.show_popunders","false"],["N_BetterJsPop.object","{}"],["isAdb","false"],["puOverlay","noopFunc"],["ue_adb_chk","1"],["countDown","0"],["runCheck","noopFunc"],["adsSlotRenderEndSeen","true"],["showModal","noopFunc"],["flashvars.mlogo_link",""],["isAdBlocked","noopFunc"],["URLlist","[]"],["aaw","{}"],["aaw.processAdsOnPage","noopFunc"],["doOpen","undefined"],["OneTrust","{}"],["OneTrust.IsAlertBoxClosed","trueFunc"],["FOXIZ_MAIN_SCRIPT.siteAccessDetector","noopFunc"],["openAdBlockPopup","noopFunc"],["advanced_ads_check_adblocker","noopFunc"],["canRunAds","1"],["attestHasAdBlockerActivated","true"],["extInstalled","true"],["SaveFiles.add","noopFunc"],["detectSandbox","noopFunc"],["ga","trueFunc"],["adbon","0"],["LCI.adBlockDetectorEnabled","false"],["stoCazzo","true"],["adblockDetected","false"],["importFAB","undefined"],["window.__CONFIGURATION__.adInsertion.enabled","false"],["window.__CONFIGURATION__.features.enableAdBlockerDetection","false"],["_carbonads","{}"],["_bsa","{}"],["uberad_mode"],["__aab_init","true"],["show_videoad_limited","noopFunc"],["__NATIVEADS_CANARY__","true"],["docManager.doDynamicBlurring","noopFunc"],["rwt","noopFunc"],["bmak.js_post","false"],["firebase.analytics","noopFunc"],["Object.prototype.updateModifiedCommerceUrl","noopFunc"],["flashvars.event_reporting",""],["Object.prototype.has_opted_out_tracking","trueFunc"],["process","{}"],["process.env","{}"],["Visitor","{}"],["send_gravity_event","noopFunc"],["send_recommendation_event","noopFunc"],["libAnalytics.data.get","noopFunc"],["adthrive._components.start","noopFunc"],["data","true"],["navigator.sendBeacon","noopFunc"]];
const hostnamesMap = new Map([["jilliandescribecompany.com",0],["gogoanime.*",[0,205]],["adrianmissionminute.com",0],["alejandrocenturyoil.com",0],["alleneconomicmatter.com",0],["bethshouldercan.com",0],["bigclatterhomesguideservice.com",0],["brittneystandardwestern.com",0],["brookethoughi.com",0],["brucevotewithin.com",0],["cindyeyefinal.com",0],["denisegrowthwide.com",0],["diananatureforeign.com",0],["donaldlineelse.com",0],["edwardarriveoften.com",0],["erikcoldperson.com",0],["evelynthankregion.com",0],["graceaddresscommunity.com",0],["heatherdiscussionwhen.com",0],["heatherwholeinvolve.com",0],["housecardsummerbutton.com",0],["jamessoundcost.com",0],["jamiesamewalk.com",0],["jasminetesttry.com",0],["jasonresponsemeasure.com",0],["jayservicestuff.com",0],["jennifercertaindevelopment.com",0],["jessicaglassauthor.com",0],["johnalwayssame.com",0],["johntryopen.com",0],["jonathansociallike.com",0],["josephseveralconcern.com",0],["kellywhatcould.com",0],["kennethofficialitem.com",0],["kristiesoundsimply.com",0],["lisatrialidea.com",0],["lorimuchbenefit.com",0],["loriwithinfamily.com",0],["lukecomparetwo.com",0],["mariatheserepublican.com",0],["markstyleall.com",0],["michaelapplysome.com",0],["morganoperationface.com",0],["nathanfromsubject.com",0],["paulkitchendark.com",0],["rebeccaneverbase.com",0],["richardsignfish.com",0],["roberteachfinal.com",0],["robertordercharacter.com",0],["robertplacespace.com",0],["ryanagoinvolve.com",0],["sandratableother.com",0],["sandrataxeight.com",0],["sethniceletter.com",0],["shannonpersonalcost.com",0],["susanhavekeep.com",0],["tinycat-voe-fashion.com",0],["toddpartneranimal.com",0],["troyyourlead.com",0],["uptodatefinishconference.com",0],["uptodatefinishconferenceroom.com",0],["voe.sx",0],["maxfinishseveral.com",0],["voe.sx>>",0],["javboys.tv>>",0],["freeplayervideo.com",0],["nazarickol.com",0],["player-cdn.com",0],["playhydrax.com",[0,413,414]],["rabbitstream.net",0],["fmovies.*",0],["japscan.*",[1,2,3,4,5]],["u26bekrb.fun",6],["br.de",7],["indeed.com",8],["zillow.com",[8,112]],["pasteboard.co",9],["bbc.com",10],["clickhole.com",11],["deadspin.com",11],["gizmodo.com",11],["jalopnik.com",11],["jezebel.com",11],["kotaku.com",11],["lifehacker.com",11],["splinternews.com",11],["theinventory.com",11],["theonion.com",11],["theroot.com",11],["thetakeout.com",11],["pewresearch.org",11],["los40.com",[12,13]],["as.com",13],["caracol.com.co",13],["telegraph.co.uk",[14,15]],["poweredbycovermore.com",[14,67]],["lumens.com",[14,67]],["verizon.com",16],["humanbenchmark.com",17],["politico.com",18],["officedepot.co.cr",[19,20]],["officedepot.*",[21,22]],["usnews.com",23],["coolmathgames.com",[24,291,292,293]],["video.gazzetta.it",[25,26]],["oggi.it",[25,26]],["manoramamax.com",25],["factable.com",27],["thedailybeast.com",28],["zee5.com",29],["gala.fr",30],["geo.fr",30],["voici.fr",30],["gloucestershirelive.co.uk",31],["arsiv.mackolik.com",32],["jacksonguitars.com",33],["scandichotels.com",34],["stylist.co.uk",35],["nettiauto.com",36],["thaiairways.com",[37,38]],["cerbahealthcare.it",[39,40]],["futura-sciences.com",[39,57]],["toureiffel.paris",39],["campusfrance.org",[39,149]],["tiendaenlinea.claro.com.ni",[41,42]],["tieba.baidu.com",43],["fandom.com",[44,45,351]],["grasshopper.com",[46,47]],["epson.com.cn",[48,49,50,51]],["oe24.at",[52,53]],["szbz.de",52],["platform.autods.com",[54,55]],["kcra.com",56],["wcvb.com",56],["sporteurope.tv",56],["citibank.com.sg",58],["uol.com.br",[59,60,61,62,63]],["gazzetta.gr",64],["digicol.dpm.org.cn",[65,66]],["virginmediatelevision.ie",68],["larazon.es",[69,70]],["waitrosecellar.com",[71,72,73]],["kicker.de",[74,392]],["sharpen-free-design-generator.netlify.app",[75,76]],["help.cashctrl.com",[77,78]],["gry-online.pl",79],["vidaextra.com",80],["commande.rhinov.pro",[81,82]],["ecom.wixapps.net",[81,82]],["tipranks.com",[83,84]],["iceland.co.uk",[85,86,87]],["socket.pearsoned.com",88],["tntdrama.com",[89,90]],["trutv.com",[89,90]],["mobile.de",[91,92]],["ioe.vn",[93,94]],["geiriadur.ac.uk",[93,97]],["welsh-dictionary.ac.uk",[93,97]],["bikeportland.org",[95,96]],["biologianet.com",[60,61,62]],["10.com.au",[98,99]],["10play.com.au",[98,99]],["sunshine-live.de",[100,101]],["whatismyip.com",[102,103]],["myfitnesspal.com",104],["netoff.co.jp",[105,106]],["bluerabbitrx.com",[105,106]],["foundit.*",[107,108]],["clickjogos.com.br",109],["bristan.com",[110,111]],["share.hntv.tv",[113,114,115,116]],["forum.dji.com",[113,116]],["unionpayintl.com",[113,115]],["streamelements.com",113],["optimum.net",[117,118]],["hdfcfund.com",119],["user.guancha.cn",[120,121]],["sosovalue.com",122],["bandyforbundet.no",[123,124]],["tatacommunications.com",125],["kb.arlo.com",[125,155]],["suamusica.com.br",[126,127,128]],["macrotrends.net",[129,130]],["code.world",131],["smartcharts.net",131],["topgear.com",132],["eservice.directauto.com",[133,134]],["nbcsports.com",135],["standard.co.uk",136],["pruefernavi.de",[137,138]],["17track.net",139],["visible.com",140],["hagerty.com",[141,142]],["marketplace.nvidia.com",143],["kino.de",[144,145]],["9now.nine.com.au",146],["worldstar.com",147],["prisjakt.no",148],["developer.arm.com",[150,151]],["sterkinekor.com",152],["iogames.space",153],["id.condenast.com",154],["tires.costco.com",156],["tires.costco.ca",156],["livemint.com",[157,158]],["login.asda.com",[159,160]],["mandai.com",[161,162]],["damndelicious.net",163],["laurelberninteriors.com",[163,744]],["m.youtube.com",[164,165,166,167]],["music.youtube.com",[164,165,166,167]],["tv.youtube.com",[164,165,166,167]],["www.youtube.com",[164,165,166,167]],["youtubekids.com",[164,165,166,167]],["youtube-nocookie.com",[164,165,166,167]],["eu-proxy.startpage.com",[164,165,167]],["timesofindia.indiatimes.com",168],["economictimes.indiatimes.com",169],["motherless.com",170],["sueddeutsche.de",171],["watchanimesub.net",172],["wcoanimesub.tv",172],["wcoforever.net",172],["freeviewmovies.com",172],["filehorse.com",172],["guidetnt.com",172],["starmusiq.*",172],["sp-today.com",172],["linkvertise.com",172],["eropaste.net",172],["getpaste.link",172],["sharetext.me",172],["wcofun.*",172],["note.sieuthuthuat.com",172],["gadgets.es",[172,463]],["amateurporn.co",[172,261]],["wiwo.de",173],["primewire.*",174],["alphaporno.com",[174,543]],["porngem.com",174],["shortit.pw",[174,247]],["familyporn.tv",174],["sbplay.*",174],["85po.com",[174,232]],["milfnut.*",174],["k1nk.co",174],["watchasians.cc",174],["sankakucomplex.com",175],["player.glomex.com",176],["merkur.de",176],["tz.de",176],["sxyprn.*",177],["hqq.*",[178,179]],["waaw.*",[179,180]],["hotpornfile.org",179],["younetu.*",179],["multiup.us",179],["peliculas8k.com",[179,180]],["czxxx.org",179],["vtplayer.online",179],["vvtplayer.*",179],["netu.ac",179],["netu.frembed.lol",179],["123link.*",181],["adshort.*",181],["mitly.us",181],["linkrex.net",181],["linx.cc",181],["oke.io",181],["linkshorts.*",181],["dz4link.com",181],["adsrt.*",181],["linclik.com",181],["shrt10.com",181],["vinaurl.*",181],["loptelink.com",181],["adfloz.*",181],["cut-fly.com",181],["linkfinal.com",181],["payskip.org",181],["cutpaid.com",181],["linkjust.com",181],["leechpremium.link",181],["icutlink.com",[181,266]],["oncehelp.com",181],["rgl.vn",181],["reqlinks.net",181],["bitlk.com",181],["qlinks.eu",181],["link.3dmili.com",181],["short-fly.com",181],["foxseotools.com",181],["dutchycorp.*",181],["shortearn.*",181],["pingit.*",181],["link.turkdown.com",181],["7r6.com",181],["oko.sh",181],["ckk.ai",181],["fc.lc",181],["fstore.biz",181],["shrink.*",181],["cuts-url.com",181],["eio.io",181],["exe.app",181],["exee.io",181],["exey.io",181],["skincarie.com",181],["exeo.app",181],["tmearn.*",181],["coinlyhub.com",[181,329]],["adsafelink.com",181],["aii.sh",181],["megalink.*",181],["cybertechng.com",[181,345]],["cutdl.xyz",181],["iir.ai",181],["shorteet.com",[181,363]],["miniurl.*",181],["smoner.com",181],["gplinks.*",181],["odisha-remix.com",[181,345]],["xpshort.com",[181,345]],["upshrink.com",181],["clk.*",181],["easysky.in",181],["veganab.co",181],["golink.bloggerishyt.in",181],["birdurls.com",181],["vipurl.in",181],["jameeltips.us",181],["promo-visits.site",181],["satoshi-win.xyz",[181,379]],["shorterall.com",181],["encurtandourl.com",181],["forextrader.site",181],["postazap.com",181],["cety.app",181],["exego.app",[181,377]],["cutlink.net",181],["cutyurls.com",181],["cutty.app",181],["cutnet.net",181],["jixo.online",181],["tinys.click",[181,345]],["cpm.icu",181],["panyshort.link",181],["enagato.com",181],["pandaznetwork.com",181],["tpi.li",181],["oii.la",181],["recipestutorials.com",181],["shrinkme.*",181],["shrinke.*",181],["mrproblogger.com",181],["themezon.net",181],["shrinkforearn.in",181],["oii.io",181],["du-link.in",181],["atglinks.com",181],["thotpacks.xyz",181],["megaurl.in",181],["megafly.in",181],["simana.online",181],["fooak.com",181],["joktop.com",181],["evernia.site",181],["falpus.com",181],["link.paid4link.com",181],["exalink.fun",181],["shortxlinks.com",181],["upfion.com",181],["upfiles.app",181],["upfiles-urls.com",181],["flycutlink.com",[181,345]],["linksly.co",181],["link1s.*",181],["pkr.pw",181],["imagenesderopaparaperros.com",181],["shortenbuddy.com",181],["apksvip.com",181],["4cash.me",181],["namaidani.com",181],["shortzzy.*",181],["teknomuda.com",181],["shorttey.*",[181,328]],["miuiku.com",181],["savelink.site",181],["lite-link.*",181],["adcorto.*",181],["samaa-pro.com",181],["miklpro.com",181],["modapk.link",181],["ccurl.net",181],["linkpoi.me",181],["pewgame.com",181],["haonguyen.top",181],["zshort.*",181],["crazyblog.in",181],["cutearn.net",181],["rshrt.com",181],["filezipa.com",181],["dz-linkk.com",181],["upfiles.*",181],["theblissempire.com",181],["finanzas-vida.com",181],["adurly.cc",181],["paid4.link",181],["link.asiaon.top",181],["go.gets4link.com",181],["linkfly.*",181],["beingtek.com",181],["shorturl.unityassets4free.com",181],["disheye.com",181],["techymedies.com",181],["za.gl",[181,281]],["bblink.com",181],["myad.biz",181],["swzz.xyz",181],["vevioz.com",181],["charexempire.com",181],["clk.asia",181],["sturls.com",181],["myshrinker.com",181],["wplink.*",181],["rocklink.in",181],["techgeek.digital",181],["download3s.net",181],["shortx.net",181],["tlin.me",181],["bestcash2020.com",181],["adslink.pw",[181,625]],["novelssites.com",181],["faucetcrypto.net",181],["trxking.xyz",181],["weadown.com",181],["m.bloggingguidance.com",181],["link.codevn.net",181],["link4rev.site",181],["c2g.at",181],["bitcosite.com",[181,557]],["cryptosh.pro",181],["windowslite.net",[181,345]],["viewfr.com",181],["cl1ca.com",181],["4br.me",181],["fir3.net",181],["seulink.*",181],["encurtalink.*",181],["kiddyshort.com",181],["watchmygf.me",[182,206]],["camwhores.*",[182,192,231,232,233]],["camwhorez.tv",[182,192,231,232]],["cambay.tv",[182,213,231,258,260,261,262,263]],["fpo.xxx",[182,213]],["sexemix.com",182],["heavyfetish.com",[182,736]],["thotcity.su",182],["viralxxxporn.com",[182,396]],["tube8.*",[183,184]],["you-porn.com",184],["youporn.*",184],["youporngay.com",184],["youpornru.com",184],["redtube.*",184],["9908ww.com",184],["adelaidepawnbroker.com",184],["bztube.com",184],["hotovs.com",184],["insuredhome.org",184],["nudegista.com",184],["pornluck.com",184],["vidd.se",184],["pornhub.*",[184,318]],["pornhub.com",184],["pornerbros.com",185],["freep.com",185],["porn.com",186],["tune.pk",187],["noticias.gospelmais.com.br",188],["techperiod.com",188],["viki.com",[189,190]],["watch-series.*",191],["watchseries.*",191],["vev.*",191],["vidop.*",191],["vidup.*",191],["sleazyneasy.com",[192,193,194]],["smutr.com",[192,325]],["tktube.com",192],["yourporngod.com",[192,193]],["javbangers.com",[192,454]],["camfox.com",192],["camthots.tv",[192,258]],["shegotass.info",192],["amateur8.com",192],["bigtitslust.com",192],["ebony8.com",192],["freeporn8.com",192],["lesbian8.com",192],["maturetubehere.com",192],["sortporn.com",192],["motherporno.com",[192,193,213,260]],["theporngod.com",[192,193]],["watchdirty.to",[192,232,233,261]],["pornsocket.com",195],["luxuretv.com",196],["porndig.com",[197,198]],["webcheats.com.br",199],["ceesty.com",[200,201]],["gestyy.com",[200,201]],["corneey.com",201],["destyy.com",201],["festyy.com",201],["sh.st",201],["mitaku.net",201],["angrybirdsnest.com",202],["zrozz.com",202],["clix4btc.com",202],["4tests.com",202],["goltelevision.com",202],["news-und-nachrichten.de",202],["laradiobbs.net",202],["urlaubspartner.net",202],["produktion.de",202],["cinemaxxl.de",202],["bladesalvador.com",202],["tempr.email",202],["friendproject.net",202],["covrhub.com",202],["trust.zone",202],["business-standard.com",202],["planetsuzy.org",203],["empflix.com",204],["xmovies8.*",205],["masteranime.tv",205],["0123movies.*",205],["gostream.*",205],["gomovies.*",205],["transparentcalifornia.com",206],["deepbrid.com",207],["webnovel.com",208],["streamwish.*",[209,210]],["oneupload.to",210],["wishfast.top",210],["rubystm.com",210],["rubyvid.com",210],["rubyvidhub.com",210],["stmruby.com",210],["streamruby.com",210],["schwaebische.de",211],["8tracks.com",212],["3movs.com",213],["bravoerotica.net",[213,260]],["youx.xxx",213],["camclips.tv",[213,325]],["xtits.*",[213,260]],["camflow.tv",[213,260,261,299,396]],["camhoes.tv",[213,258,260,261,299,396]],["xmegadrive.com",213],["xxxymovies.com",213],["xxxshake.com",213],["gayck.com",213],["xhand.com",[213,260]],["analdin.com",[213,260]],["revealname.com",214],["golfchannel.com",215],["stream.nbcsports.com",215],["mathdf.com",215],["gamcore.com",216],["porcore.com",216],["porngames.tv",216],["69games.xxx",216],["javmix.app",216],["haaretz.co.il",217],["haaretz.com",217],["hungama.com",217],["a-o.ninja",217],["anime-odcinki.pl",217],["shortgoo.blogspot.com",217],["tonanmedia.my.id",[217,576]],["isekaipalace.com",217],["plyjam.*",[218,219]],["foxsports.com.au",220],["canberratimes.com.au",220],["thesimsresource.com",221],["fxporn69.*",222],["vipbox.*",223],["viprow.*",223],["ctrl.blog",224],["sportlife.es",225],["finofilipino.org",226],["desbloqueador.*",227],["xberuang.*",228],["teknorizen.*",228],["mysflink.blogspot.com",228],["ashemaletube.*",229],["paktech2.com",229],["assia.tv",230],["assia4.com",230],["cwtvembeds.com",[232,259]],["camlovers.tv",232],["porntn.com",232],["pornissimo.org",232],["sexcams-24.com",[232,261]],["watchporn.to",[232,261]],["camwhorez.video",232],["footstockings.com",[232,233,261]],["xmateur.com",[232,233,261]],["multi.xxx",233],["weatherx.co.in",[234,235]],["sunbtc.space",234],["subtorrents.*",236],["subtorrents1.*",236],["newpelis.*",236],["pelix.*",236],["allcalidad.*",236],["infomaniakos.*",236],["ojogos.com.br",237],["powforums.com",238],["supforums.com",238],["studybullet.com",238],["usgamer.net",239],["recordonline.com",239],["freebitcoin.win",240],["e-monsite.com",240],["coindice.win",240],["freiepresse.de",241],["investing.com",242],["tornadomovies.*",243],["mp3fiber.com",244],["chicoer.com",245],["dailybreeze.com",245],["dailybulletin.com",245],["dailynews.com",245],["delcotimes.com",245],["eastbaytimes.com",245],["macombdaily.com",245],["ocregister.com",245],["pasadenastarnews.com",245],["pe.com",245],["presstelegram.com",245],["redlandsdailyfacts.com",245],["reviewjournal.com",245],["santacruzsentinel.com",245],["saratogian.com",245],["sentinelandenterprise.com",245],["sgvtribune.com",245],["tampabay.com",245],["times-standard.com",245],["theoaklandpress.com",245],["trentonian.com",245],["twincities.com",245],["whittierdailynews.com",245],["bostonherald.com",245],["dailycamera.com",245],["sbsun.com",245],["dailydemocrat.com",245],["montereyherald.com",245],["orovillemr.com",245],["record-bee.com",245],["redbluffdailynews.com",245],["reporterherald.com",245],["thereporter.com",245],["timescall.com",245],["timesheraldonline.com",245],["ukiahdailyjournal.com",245],["dailylocal.com",245],["mercurynews.com",245],["suedkurier.de",246],["anysex.com",248],["icdrama.*",249],["mangasail.*",249],["pornve.com",250],["file4go.*",251],["coolrom.com.au",251],["marie-claire.es",252],["gamezhero.com",252],["flashgirlgames.com",252],["onlinesudoku.games",252],["mpg.football",252],["sssam.com",252],["globalnews.ca",253],["drinksmixer.com",254],["leitesculinaria.com",254],["fupa.net",255],["browardpalmbeach.com",256],["dallasobserver.com",256],["houstonpress.com",256],["miaminewtimes.com",256],["phoenixnewtimes.com",256],["westword.com",256],["nowtv.com.tr",257],["caminspector.net",258],["camwhoreshd.com",258],["camgoddess.tv",258],["gay4porn.com",260],["mypornhere.com",260],["mangovideo.*",261],["love4porn.com",261],["thotvids.com",261],["watchmdh.to",261],["celebwhore.com",261],["cluset.com",261],["sexlist.tv",261],["4kporn.xxx",261],["xhomealone.com",261],["lusttaboo.com",[261,522]],["hentai-moon.com",261],["camhub.cc",[261,682]],["mediapason.it",264],["linkspaid.com",264],["tuotromedico.com",264],["neoteo.com",264],["phoneswiki.com",264],["celebmix.com",264],["myneobuxportal.com",264],["oyungibi.com",264],["25yearslatersite.com",264],["jeshoots.com",265],["techhx.com",265],["karanapk.com",265],["flashplayer.fullstacks.net",267],["cloudapps.herokuapp.com",267],["youfiles.herokuapp.com",267],["texteditor.nsspot.net",267],["temp-mail.org",268],["asianclub.*",269],["javhdporn.net",269],["vidmoly.*",270],["comnuan.com",271],["veedi.com",272],["battleboats.io",272],["anitube.*",273],["fruitlab.com",273],["haddoz.net",273],["streamingcommunity.*",273],["garoetpos.com",273],["stiletv.it",274],["mixdrop.*",275],["hqtv.biz",276],["liveuamap.com",277],["audycje.tokfm.pl",278],["shush.se",279],["allkpop.com",280],["empire-anime.*",[281,571,572,573,574,575]],["empire-streaming.*",[281,571,572,573]],["empire-anime.com",[281,571,572,573]],["empire-streamz.fr",[281,571,572,573]],["empire-stream.*",[281,571,572,573]],["pickcrackpasswords.blogspot.com",282],["kfrfansub.com",283],["thuglink.com",283],["voipreview.org",283],["illicoporno.com",284],["lavoixdux.com",284],["tonpornodujour.com",284],["jacquieetmichel.net",284],["swame.com",284],["vosfemmes.com",284],["voyeurfrance.net",284],["jacquieetmicheltv.net",[284,631,632]],["pogo.com",285],["cloudvideo.tv",286],["legionjuegos.org",287],["legionpeliculas.org",287],["legionprogramas.org",287],["16honeys.com",288],["elespanol.com",289],["remodelista.com",290],["audiofanzine.com",294],["uploadev.*",295],["developerinsider.co",296],["thehindu.com",297],["cambro.tv",[298,299]],["boobsradar.com",[299,396,701]],["nibelungen-kurier.de",300],["adfoc.us",301],["tackledsoul.com",301],["adrino1.bonloan.xyz",301],["vi-music.app",301],["instanders.app",301],["rokni.xyz",301],["keedabankingnews.com",301],["tea-coffee.net",301],["spatsify.com",301],["newedutopics.com",301],["getviralreach.in",301],["edukaroo.com",301],["funkeypagali.com",301],["careersides.com",301],["nayisahara.com",301],["wikifilmia.com",301],["infinityskull.com",301],["viewmyknowledge.com",301],["iisfvirtual.in",301],["starxinvestor.com",301],["jkssbalerts.com",301],["sahlmarketing.net",301],["filmypoints.in",301],["fitnessholic.net",301],["moderngyan.com",301],["sattakingcharts.in",301],["bankshiksha.in",301],["earn.mpscstudyhub.com",301],["earn.quotesopia.com",301],["money.quotesopia.com",301],["best-mobilegames.com",301],["learn.moderngyan.com",301],["bharatsarkarijobalert.com",301],["quotesopia.com",301],["creditsgoal.com",301],["bgmi32bitapk.in",301],["techacode.com",301],["trickms.com",301],["ielts-isa.edu.vn",301],["loan.punjabworks.com",301],["sptfy.be",301],["mcafee-com.com",[301,377]],["pianetamountainbike.it",302],["barchart.com",303],["modelisme.com",304],["parasportontario.ca",304],["prescottenews.com",304],["nrj-play.fr",305],["hackingwithreact.com",306],["gutekueche.at",307],["peekvids.com",308],["playvids.com",308],["pornflip.com",308],["redensarten-index.de",309],["vw-page.com",310],["viz.com",[311,312]],["0rechner.de",313],["configspc.com",314],["xopenload.me",314],["uptobox.com",314],["uptostream.com",314],["japgay.com",315],["mega-debrid.eu",316],["dreamdth.com",317],["diaridegirona.cat",319],["diariodeibiza.es",319],["diariodemallorca.es",319],["diarioinformacion.com",319],["eldia.es",319],["emporda.info",319],["farodevigo.es",319],["laopinioncoruna.es",319],["laopiniondemalaga.es",319],["laopiniondemurcia.es",319],["laopiniondezamora.es",319],["laprovincia.es",319],["levante-emv.com",319],["mallorcazeitung.es",319],["regio7.cat",319],["superdeporte.es",319],["playpaste.com",320],["cnbc.com",321],["firefaucet.win",322],["74k.io",[323,324]],["cloudwish.xyz",324],["gradehgplus.com",324],["javindo.site",324],["javindosub.site",324],["kamehaus.net",324],["movearnpre.com",324],["arabshentai.com>>",324],["javdo.cc>>",324],["javenglish.cc>>",324],["javhd.*>>",324],["javhdz.*>>",324],["roshy.tv>>",324],["sextb.*>>",324],["fullhdxxx.com",326],["pornclassic.tube",327],["tubepornclassic.com",327],["etonline.com",328],["creatur.io",328],["lookcam.*",328],["drphil.com",328],["urbanmilwaukee.com",328],["hideandseek.world",328],["myabandonware.com",328],["kendam.com",328],["wttw.com",328],["synonyms.com",328],["definitions.net",328],["hostmath.com",328],["camvideoshub.com",328],["minhaconexao.com.br",328],["home-made-videos.com",330],["amateur-couples.com",330],["slutdump.com",330],["artificialnudes.com",330],["bdsmkingdom.xyz",330],["cosplaynsfw.xyz",330],["crazytoys.xyz",330],["handypornos.net",330],["hardcorelesbian.xyz",330],["pornahegao.xyz",330],["pornobait.com",330],["pornfeet.xyz",330],["sexontheboat.xyz",330],["dpstream.*",331],["produsat.com",332],["bluemediafiles.*",333],["12thman.com",334],["acusports.com",334],["atlantic10.com",334],["auburntigers.com",334],["baylorbears.com",334],["bceagles.com",334],["bgsufalcons.com",334],["big12sports.com",334],["bigten.org",334],["bradleybraves.com",334],["butlersports.com",334],["cmumavericks.com",334],["conferenceusa.com",334],["cyclones.com",334],["dartmouthsports.com",334],["daytonflyers.com",334],["dbupatriots.com",334],["dbusports.com",334],["denverpioneers.com",334],["fduknights.com",334],["fgcuathletics.com",334],["fightinghawks.com",334],["fightingillini.com",334],["floridagators.com",334],["friars.com",334],["friscofighters.com",334],["gamecocksonline.com",334],["goarmywestpoint.com",334],["gobison.com",334],["goblueraiders.com",334],["gobobcats.com",334],["gocards.com",334],["gocreighton.com",334],["godeacs.com",334],["goexplorers.com",334],["goetbutigers.com",334],["gofrogs.com",334],["gogriffs.com",334],["gogriz.com",334],["golobos.com",334],["gomarquette.com",334],["gopack.com",334],["gophersports.com",334],["goprincetontigers.com",334],["gopsusports.com",334],["goracers.com",334],["goshockers.com",334],["goterriers.com",334],["gotigersgo.com",334],["gousfbulls.com",334],["govandals.com",334],["gowyo.com",334],["goxavier.com",334],["gozags.com",334],["gozips.com",334],["griffinathletics.com",334],["guhoyas.com",334],["gwusports.com",334],["hailstate.com",334],["hamptonpirates.com",334],["hawaiiathletics.com",334],["hokiesports.com",334],["huskers.com",334],["icgaels.com",334],["iuhoosiers.com",334],["jsugamecocksports.com",334],["longbeachstate.com",334],["loyolaramblers.com",334],["lrtrojans.com",334],["lsusports.net",334],["morrisvillemustangs.com",334],["msuspartans.com",334],["muleriderathletics.com",334],["mutigers.com",334],["navysports.com",334],["nevadawolfpack.com",334],["niuhuskies.com",334],["nkunorse.com",334],["nuhuskies.com",334],["nusports.com",334],["okstate.com",334],["olemisssports.com",334],["omavs.com",334],["ovcsports.com",334],["owlsports.com",334],["purduesports.com",334],["redstormsports.com",334],["richmondspiders.com",334],["sfajacks.com",334],["shupirates.com",334],["siusalukis.com",334],["smcgaels.com",334],["smumustangs.com",334],["soconsports.com",334],["soonersports.com",334],["themw.com",334],["tulsahurricane.com",334],["txst.com",334],["txstatebobcats.com",334],["ubbulls.com",334],["ucfknights.com",334],["ucirvinesports.com",334],["uconnhuskies.com",334],["uhcougars.com",334],["uicflames.com",334],["umterps.com",334],["uncwsports.com",334],["unipanthers.com",334],["unlvrebels.com",334],["uoflsports.com",334],["usdtoreros.com",334],["utahstateaggies.com",334],["utepathletics.com",334],["utrockets.com",334],["uvmathletics.com",334],["uwbadgers.com",334],["villanova.com",334],["wkusports.com",334],["wmubroncos.com",334],["woffordterriers.com",334],["1pack1goal.com",334],["bcuathletics.com",334],["bubraves.com",334],["goblackbears.com",334],["golightsgo.com",334],["gomcpanthers.com",334],["goutsa.com",334],["mercerbears.com",334],["pirateblue.com",334],["pirateblue.net",334],["pirateblue.org",334],["quinnipiacbobcats.com",334],["towsontigers.com",334],["tribeathletics.com",334],["tribeclub.com",334],["utepminermaniacs.com",334],["utepminers.com",334],["wkutickets.com",334],["aopathletics.org",334],["atlantichockeyonline.com",334],["bigsouthnetwork.com",334],["bigsouthsports.com",334],["chawomenshockey.com",334],["dbupatriots.org",334],["drakerelays.org",334],["ecac.org",334],["ecacsports.com",334],["emueagles.com",334],["emugameday.com",334],["gculopes.com",334],["godrakebulldog.com",334],["godrakebulldogs.com",334],["godrakebulldogs.net",334],["goeags.com",334],["goislander.com",334],["goislanders.com",334],["gojacks.com",334],["gomacsports.com",334],["gseagles.com",334],["hubison.com",334],["iowaconference.com",334],["ksuowls.com",334],["lonestarconference.org",334],["mascac.org",334],["midwestconference.org",334],["mountaineast.org",334],["niu-pack.com",334],["nulakers.ca",334],["oswegolakers.com",334],["ovcdigitalnetwork.com",334],["pacersports.com",334],["rmacsports.org",334],["rollrivers.com",334],["samfordsports.com",334],["uncpbraves.com",334],["usfdons.com",334],["wiacsports.com",334],["alaskananooks.com",334],["broncathleticfund.com",334],["cameronaggies.com",334],["columbiacougars.com",334],["etownbluejays.com",334],["gobadgers.ca",334],["golancers.ca",334],["gometrostate.com",334],["gothunderbirds.ca",334],["kentstatesports.com",334],["lehighsports.com",334],["lopers.com",334],["lycoathletics.com",334],["lycomingathletics.com",334],["maraudersports.com",334],["mauiinvitational.com",334],["msumavericks.com",334],["nauathletics.com",334],["nueagles.com",334],["nwusports.com",334],["oceanbreezenyc.org",334],["patriotathleticfund.com",334],["pittband.com",334],["principiaathletics.com",334],["roadrunnersathletics.com",334],["sidearmsocial.com",334],["snhupenmen.com",334],["stablerarena.com",334],["stoutbluedevils.com",334],["uwlathletics.com",334],["yumacs.com",334],["collegefootballplayoff.com",334],["csurams.com",334],["cubuffs.com",334],["gobearcats.com",334],["gohuskies.com",334],["mgoblue.com",334],["osubeavers.com",334],["pittsburghpanthers.com",334],["rolltide.com",334],["texassports.com",334],["thesundevils.com",334],["uclabruins.com",334],["wvuathletics.com",334],["wvusports.com",334],["arizonawildcats.com",334],["calbears.com",334],["cuse.com",334],["georgiadogs.com",334],["goducks.com",334],["goheels.com",334],["gostanford.com",334],["insidekstatesports.com",334],["insidekstatesports.info",334],["insidekstatesports.net",334],["insidekstatesports.org",334],["k-stateathletics.com",334],["k-statefootball.net",334],["k-statefootball.org",334],["k-statesports.com",334],["k-statesports.net",334],["k-statesports.org",334],["k-statewomenshoops.com",334],["k-statewomenshoops.net",334],["k-statewomenshoops.org",334],["kstateathletics.com",334],["kstatefootball.net",334],["kstatefootball.org",334],["kstatesports.com",334],["kstatewomenshoops.com",334],["kstatewomenshoops.net",334],["kstatewomenshoops.org",334],["ksuathletics.com",334],["ksusports.com",334],["scarletknights.com",334],["showdownforrelief.com",334],["syracusecrunch.com",334],["texastech.com",334],["theacc.com",334],["ukathletics.com",334],["usctrojans.com",334],["utahutes.com",334],["utsports.com",334],["wsucougars.com",334],["vidlii.com",[334,360]],["tricksplit.io",334],["fangraphs.com",335],["stern.de",336],["geo.de",336],["brigitte.de",336],["schoener-wohnen.de",336],["welt.de",337],["tvspielfilm.de",[338,339,340,341]],["tvtoday.de",[338,339,340,341]],["chip.de",[338,339,340,341]],["focus.de",[338,339,340,341]],["fitforfun.de",[338,339,340,341]],["n-tv.de",342],["player.rtl2.de",343],["planetaminecraft.com",344],["cravesandflames.com",345],["codesnse.com",345],["flyad.vip",345],["lapresse.ca",346],["kolyoom.com",347],["ilovephd.com",347],["negumo.com",348],["games.wkb.jp",[349,350]],["kenshi.fandom.com",352],["hausbau-forum.de",353],["homeairquality.org",353],["call4cloud.nl",353],["fake-it.ws",354],["laksa19.github.io",355],["1shortlink.com",356],["u-s-news.com",357],["luscious.net",358],["makemoneywithurl.com",359],["junkyponk.com",359],["healthfirstweb.com",359],["vocalley.com",359],["yogablogfit.com",359],["howifx.com",359],["en.financerites.com",359],["mythvista.com",359],["livenewsflix.com",359],["cureclues.com",359],["apekite.com",359],["enit.in",359],["iammagnus.com",360],["dailyvideoreports.net",360],["unityassets4free.com",360],["docer.*",361],["resetoff.pl",361],["sexodi.com",361],["cdn77.org",362],["momxxxsex.com",363],["penisbuyutucum.net",363],["ujszo.com",364],["newsmax.com",365],["nadidetarifler.com",366],["siz.tv",366],["suzylu.co.uk",[367,368]],["onworks.net",369],["yabiladi.com",369],["downloadsoft.net",370],["newsobserver.com",371],["arkadiumhosted.com",371],["testlanguages.com",372],["newsinlevels.com",372],["videosinlevels.com",372],["procinehub.com",373],["bookmystrip.com",373],["imagereviser.com",374],["pubgaimassist.com",375],["gyanitheme.com",375],["tech.trendingword.com",375],["blog.potterworld.co",375],["hipsonyc.com",375],["tech.pubghighdamage.com",375],["blog.itijobalert.in",375],["techkhulasha.com",375],["jiocinema.com",375],["rapid-cloud.co",375],["uploadmall.com",375],["4funbox.com",376],["nephobox.com",376],["1024tera.com",376],["terabox.*",376],["starkroboticsfrc.com",377],["sinonimos.de",377],["antonimos.de",377],["quesignifi.ca",377],["tiktokrealtime.com",377],["tiktokcounter.net",377],["tpayr.xyz",377],["poqzn.xyz",377],["ashrfd.xyz",377],["rezsx.xyz",377],["tryzt.xyz",377],["ashrff.xyz",377],["rezst.xyz",377],["dawenet.com",377],["erzar.xyz",377],["waezm.xyz",377],["waezg.xyz",377],["blackwoodacademy.org",377],["cryptednews.space",377],["vivuq.com",377],["swgop.com",377],["vbnmll.com",377],["telcoinfo.online",377],["dshytb.com",377],["btcbitco.in",[377,378]],["btcsatoshi.net",377],["cempakajaya.com",377],["crypto4yu.com",377],["readbitcoin.org",377],["wiour.com",377],["finish.addurl.biz",377],["aiimgvlog.fun",[377,381]],["laweducationinfo.com",377],["savemoneyinfo.com",377],["worldaffairinfo.com",377],["godstoryinfo.com",377],["successstoryinfo.com",377],["cxissuegk.com",377],["learnmarketinfo.com",377],["bhugolinfo.com",377],["armypowerinfo.com",377],["rsgamer.app",377],["phonereviewinfo.com",377],["makeincomeinfo.com",377],["gknutshell.com",377],["vichitrainfo.com",377],["workproductivityinfo.com",377],["dopomininfo.com",377],["hostingdetailer.com",377],["fitnesssguide.com",377],["tradingfact4u.com",377],["cryptofactss.com",377],["softwaredetail.com",377],["artoffocas.com",377],["insurancesfact.com",377],["travellingdetail.com",377],["advertisingexcel.com",377],["allcryptoz.net",377],["batmanfactor.com",377],["beautifulfashionnailart.com",377],["crewbase.net",377],["documentaryplanet.xyz",377],["crewus.net",377],["gametechreviewer.com",377],["midebalonu.net",377],["misterio.ro",377],["phineypet.com",377],["seory.xyz",377],["shinbhu.net",377],["shinchu.net",377],["substitutefor.com",377],["talkforfitness.com",377],["thefitbrit.co.uk",377],["thumb8.net",377],["thumb9.net",377],["topcryptoz.net",377],["uniqueten.net",377],["ultraten.net",377],["exactpay.online",377],["quins.us",377],["kiddyearner.com",377],["bildirim.*",380],["arahdrive.com",381],["appsbull.com",382],["diudemy.com",382],["maqal360.com",[382,383,384]],["lifesurance.info",385],["akcartoons.in",386],["cybercityhelp.in",386],["dl.apkmoddone.com",387],["phongroblox.com",387],["fuckingfast.net",388],["buzzheavier.com",388],["tickhosting.com",389],["in91vip.win",390],["datavaults.co",391],["t-online.de",393],["upornia.*",[394,395]],["bobs-tube.com",396],["pornohirsch.net",397],["bembed.net",398],["embedv.net",398],["javguard.club",398],["listeamed.net",398],["v6embed.xyz",398],["vembed.*",398],["vid-guard.com",398],["vinomo.xyz",398],["nekolink.site",[399,400]],["141jav.com",401],["141tube.com",401],["aagmaal.com",401],["camcam.cc",401],["javneon.tv",401],["javsaga.ninja",401],["pixsera.net",402],["jnews5.com",403],["pc-builds.com",404],["reuters.com",404],["today.com",404],["videogamer.com",404],["wrestlinginc.com",404],["azcentral.com",405],["greenbaypressgazette.com",405],["palmbeachpost.com",405],["usatoday.com",[405,406]],["ydr.com",405],["247sports.com",407],["indiatimes.com",408],["netzwelt.de",409],["filmibeat.com",410],["goodreturns.in",410],["mykhel.com",410],["daemonanime.net",410],["luckydice.net",410],["weatherwx.com",410],["sattaguess.com",410],["winshell.de",410],["rosasidan.ws",410],["upiapi.in",410],["networkhint.com",410],["thichcode.net",410],["texturecan.com",410],["tikmate.app",[410,614]],["arcaxbydz.id",410],["quotesshine.com",410],["arcade.buzzrtv.com",411],["arcade.dailygazette.com",411],["arcade.lemonde.fr",411],["arena.gamesforthebrain.com",411],["bestpuzzlesandgames.com",411],["cointiply.arkadiumarena.com",411],["gamelab.com",411],["games.abqjournal.com",411],["games.amny.com",411],["games.bellinghamherald.com",411],["games.besthealthmag.ca",411],["games.bnd.com",411],["games.boston.com",411],["games.bostonglobe.com",411],["games.bradenton.com",411],["games.centredaily.com",411],["games.charlottegames.cnhinews.com",411],["games.crosswordgiant.com",411],["games.dailymail.co.uk",411],["games.dallasnews.com",411],["games.daytondailynews.com",411],["games.denverpost.com",411],["games.everythingzoomer.com",411],["games.fresnobee.com",411],["games.gameshownetwork.com",411],["games.get.tv",411],["games.greatergood.com",411],["games.heraldonline.com",411],["games.heraldsun.com",411],["games.idahostatesman.com",411],["games.insp.com",411],["games.islandpacket.com",411],["games.journal-news.com",411],["games.kansas.com",411],["games.kansascity.com",411],["games.kentucky.com",411],["games.lancasteronline.com",411],["games.ledger-enquirer.com",411],["games.macon.com",411],["games.mashable.com",411],["games.mercedsunstar.com",411],["games.metro.us",411],["games.metv.com",411],["games.miamiherald.com",411],["games.modbee.com",411],["games.moviestvnetwork.com",411],["games.myrtlebeachonline.com",411],["games.games.newsgames.parade.com",411],["games.pressdemocrat.com",411],["games.puzzlebaron.com",411],["games.puzzler.com",411],["games.puzzles.ca",411],["games.qns.com",411],["games.readersdigest.ca",411],["games.sacbee.com",411],["games.sanluisobispo.com",411],["games.sixtyandme.com",411],["games.sltrib.com",411],["games.springfieldnewssun.com",411],["games.star-telegram.com",411],["games.startribune.com",411],["games.sunherald.com",411],["games.theadvocate.com",411],["games.thenewstribune.com",411],["games.theolympian.com",411],["games.theportugalnews.com",411],["games.thestar.com",411],["games.thestate.com",411],["games.tri-cityherald.com",411],["games.triviatoday.com",411],["games.usnews.com",411],["games.word.tips",411],["games.wordgenius.com",411],["games.wtop.com",411],["jeux.meteocity.com",411],["juegos.as.com",411],["juegos.elnuevoherald.com",411],["juegos.elpais.com",411],["philly.arkadiumarena.com",411],["play.dictionary.com",411],["puzzles.bestforpuzzles.com",411],["puzzles.centralmaine.com",411],["puzzles.crosswordsolver.org",411],["puzzles.independent.co.uk",411],["puzzles.nola.com",411],["puzzles.pressherald.com",411],["puzzles.standard.co.uk",411],["puzzles.sunjournal.com",411],["arkadium.com",412],["abysscdn.com",[413,414]],["turtleviplay.xyz",415],["ai.hubtoday.app",416],["lared.cl",417],["atozmath.com",[417,439,440,441,442,443,444]],["hdfilmizlesen.com",418],["arcai.com",419],["my-code4you.blogspot.com",420],["flickr.com",421],["firefile.cc",422],["pestleanalysis.com",422],["kochamjp.pl",422],["tutorialforlinux.com",422],["whatsaero.com",422],["animeblkom.net",[422,436]],["blkom.com",422],["globes.co.il",[423,424]],["jardiner-malin.fr",425],["tw-calc.net",426],["ohmybrush.com",427],["talkceltic.net",428],["mentalfloss.com",429],["uprafa.com",430],["cube365.net",431],["wwwfotografgotlin.blogspot.com",432],["freelistenonline.com",432],["badassdownloader.com",433],["quickporn.net",434],["yellowbridge.com",435],["aosmark.com",437],["ctrlv.*",438],["newyorker.com",445],["brighteon.com",[446,447]],["more.tv",448],["video1tube.com",449],["alohatube.xyz",449],["4players.de",450],["onlinesoccermanager.com",450],["fshost.me",451],["link.cgtips.org",452],["hentaicloud.com",453],["paperzonevn.com",455],["9jarock.org",456],["fzmovies.info",456],["fztvseries.ng",456],["netnaijas.com",456],["hentaienglish.com",457],["hentaiporno.xxx",457],["venge.io",[458,459]],["its.porn",[460,461]],["atv.at",462],["2ndrun.tv",463],["rackusreads.com",463],["teachmemicro.com",463],["willcycle.com",463],["kusonime.com",[464,465]],["123movieshd.*",466],["imgur.com",[467,468,737]],["hentai-party.com",469],["hentaicomics.pro",469],["uproxy.*",470],["animesa.*",471],["subtitleone.cc",472],["mysexgames.com",473],["ancient-origins.*",474],["cinecalidad.*",[475,476]],["xnxx.com",477],["xvideos.*",477],["gdr-online.com",478],["mmm.dk",479],["iqiyi.com",[480,481,604]],["m.iqiyi.com",482],["nbcolympics.com",483],["apkhex.com",484],["indiansexstories2.net",485],["issstories.xyz",485],["1340kbbr.com",486],["gorgeradio.com",486],["kduk.com",486],["kedoam.com",486],["kejoam.com",486],["kelaam.com",486],["khsn1230.com",486],["kjmx.rocks",486],["kloo.com",486],["klooam.com",486],["klykradio.com",486],["kmed.com",486],["kmnt.com",486],["kpnw.com",486],["kppk983.com",486],["krktcountry.com",486],["ktee.com",486],["kwro.com",486],["kxbxfm.com",486],["thevalley.fm",486],["quizlet.com",487],["dsocker1234.blogspot.com",488],["schoolcheats.net",[489,490]],["mgnet.xyz",491],["designtagebuch.de",492],["pixroute.com",493],["uploady.io",494],["calculator-online.net",495],["porngames.club",496],["sexgames.xxx",496],["111.90.159.132",497],["mobile-tracker-free.com",498],["social-unlock.com",499],["superpsx.com",500],["ninja.io",501],["sourceforge.net",502],["samfirms.com",503],["rapelust.com",504],["vtube.to",504],["desitelugusex.com",504],["dvdplay.*",504],["xvideos-downloader.net",504],["xxxvideotube.net",504],["sdefx.cloud",504],["nozomi.la",504],["banned.video",505],["madmaxworld.tv",505],["androidpolice.com",505],["babygaga.com",505],["backyardboss.net",505],["carbuzz.com",505],["cbr.com",505],["collider.com",505],["dualshockers.com",505],["footballfancast.com",505],["footballleagueworld.co.uk",505],["gamerant.com",505],["givemesport.com",505],["hardcoregamer.com",505],["hotcars.com",505],["howtogeek.com",505],["makeuseof.com",505],["moms.com",505],["movieweb.com",505],["pocket-lint.com",505],["pocketnow.com",505],["screenrant.com",505],["simpleflying.com",505],["thegamer.com",505],["therichest.com",505],["thesportster.com",505],["thethings.com",505],["thetravel.com",505],["topspeed.com",505],["xda-developers.com",505],["huffpost.com",506],["ingles.com",507],["spanishdict.com",507],["surfline.com",[508,509]],["play.tv3.ee",510],["play.tv3.lt",510],["play.tv3.lv",[510,511]],["tv3play.skaties.lv",510],["bulbagarden.net",512],["hollywoodlife.com",513],["mat6tube.com",514],["hotabis.com",515],["root-nation.com",515],["italpress.com",515],["airsoftmilsimnews.com",515],["artribune.com",515],["newtumbl.com",516],["apkmaven.*",517],["aruble.net",518],["nevcoins.club",519],["mail.com",520],["gmx.*",521],["mangakita.id",523],["avpgalaxy.net",524],["panda-novel.com",525],["lightsnovel.com",525],["eaglesnovel.com",525],["pandasnovel.com",525],["ewrc-results.com",526],["kizi.com",527],["cyberscoop.com",528],["fedscoop.com",528],["jeep-cj.com",529],["sponsorhunter.com",530],["cloudcomputingtopics.net",531],["likecs.com",532],["tiscali.it",533],["linkspy.cc",534],["adshnk.com",535],["chattanoogan.com",536],["adsy.pw",537],["playstore.pw",537],["windowspro.de",538],["tvtv.ca",539],["tvtv.us",539],["mydaddy.cc",540],["roadtrippin.fr",541],["vavada5com.com",542],["anyporn.com",[543,560]],["bravoporn.com",543],["bravoteens.com",543],["crocotube.com",543],["hellmoms.com",543],["hellporno.com",543],["sex3.com",543],["tubewolf.com",543],["xbabe.com",543],["xcum.com",543],["zedporn.com",543],["imagetotext.info",544],["infokik.com",545],["freepik.com",546],["ddwloclawek.pl",[547,548]],["www.seznam.cz",549],["deezer.com",550],["my-subs.co",551],["plaion.com",552],["slideshare.net",[553,554]],["ustreasuryyieldcurve.com",555],["businesssoftwarehere.com",556],["goo.st",556],["freevpshere.com",556],["softwaresolutionshere.com",556],["gamereactor.*",558],["madoohd.com",559],["doomovie-hd.*",559],["staige.tv",561],["androidadult.com",562],["streamvid.net",563],["watchtv24.com",564],["cellmapper.net",565],["medscape.com",566],["newscon.org",[567,568]],["wheelofgold.com",569],["drakecomic.*",569],["app.blubank.com",570],["mobileweb.bankmellat.ir",570],["ccthesims.com",577],["chromeready.com",577],["dtbps3games.com",577],["illustratemagazine.com",577],["uknip.co.uk",577],["vod.pl",578],["megadrive-emulator.com",579],["tvhay.*",[580,581]],["moviesapi.club",582],["watchx.top",582],["digimanie.cz",583],["svethardware.cz",583],["srvy.ninja",584],["chat.tchatche.com",[585,586]],["cnn.com",[587,588,589]],["news.bg",590],["edmdls.com",591],["freshremix.net",591],["scenedl.org",591],["trakt.tv",592],["client.falixnodes.net",[593,594]],["shroomers.app",595],["classicalradio.com",596],["di.fm",596],["jazzradio.com",596],["radiotunes.com",596],["rockradio.com",596],["zenradio.com",596],["getthit.com",597],["techedubyte.com",598],["iwanttfc.com",599],["nutraingredients-asia.com",600],["nutraingredients-latam.com",600],["nutraingredients-usa.com",600],["nutraingredients.com",600],["ozulscansen.com",601],["nexusmods.com",602],["lookmovie.*",603],["lookmovie2.to",603],["biletomat.pl",605],["hextank.io",[606,607]],["filmizlehdfilm.com",[608,609,610,611]],["filmizletv.*",[608,609,610,611]],["fullfilmizle.cc",[608,609,610,611]],["gofilmizle.net",[608,609,610,611]],["cimanow.cc",612],["bgmiupdate.com.in",612],["freex2line.online",613],["btvplus.bg",615],["sagewater.com",616],["redlion.net",616],["filmweb.pl",617],["satdl.com",618],["vidstreaming.xyz",619],["everand.com",620],["myradioonline.pl",621],["cbs.com",622],["paramountplus.com",622],["colourxh.site",623],["fullxh.com",623],["galleryxh.site",623],["megaxh.com",623],["movingxh.world",623],["seexh.com",623],["unlockxh4.com",623],["valuexh.life",623],["xhaccess.com",623],["xhadult2.com",623],["xhadult3.com",623],["xhadult4.com",623],["xhadult5.com",623],["xhamster.*",623],["xhamster1.*",623],["xhamster10.*",623],["xhamster11.*",623],["xhamster12.*",623],["xhamster13.*",623],["xhamster14.*",623],["xhamster15.*",623],["xhamster16.*",623],["xhamster17.*",623],["xhamster18.*",623],["xhamster19.*",623],["xhamster20.*",623],["xhamster2.*",623],["xhamster3.*",623],["xhamster4.*",623],["xhamster42.*",623],["xhamster46.com",623],["xhamster5.*",623],["xhamster7.*",623],["xhamster8.*",623],["xhamsterporno.mx",623],["xhbig.com",623],["xhbranch5.com",623],["xhchannel.com",623],["xhdate.world",623],["xhlease.world",623],["xhmoon5.com",623],["xhofficial.com",623],["xhopen.com",623],["xhplanet1.com",623],["xhplanet2.com",623],["xhreal2.com",623],["xhreal3.com",623],["xhspot.com",623],["xhtotal.com",623],["xhtree.com",623],["xhvictory.com",623],["xhwebsite.com",623],["xhwebsite2.com",623],["xhwebsite5.com",623],["xhwide1.com",623],["xhwide2.com",623],["xhwide5.com",623],["file-upload.net",624],["acortalo.*",[626,627,628,629]],["acortar.*",[626,627,628,629]],["hentaihaven.xxx",630],["jacquieetmicheltv2.net",632],["a2zapk.*",633],["fcportables.com",[634,635]],["emurom.net",636],["freethesaurus.com",[637,638]],["thefreedictionary.com",[637,638]],["oeffentlicher-dienst.info",639],["im9.eu",[640,641]],["dcdlplayer8a06f4.xyz",642],["ultimate-guitar.com",643],["claimbits.net",644],["sexyscope.net",645],["kickassanime.*",646],["recherche-ebook.fr",647],["virtualdinerbot.com",647],["zonebourse.com",648],["pink-sluts.net",649],["andhrafriends.com",650],["benzinpreis.de",651],["defenseone.com",652],["govexec.com",652],["nextgov.com",652],["route-fifty.com",652],["sharing.wtf",653],["wetter3.de",654],["esportivos.fun",655],["cosmonova-broadcast.tv",656],["538.nl",657],["hartvannederland.nl",657],["kijk.nl",657],["shownieuws.nl",657],["vandaaginside.nl",657],["rock.porn",[658,659]],["videzz.net",[660,661]],["ezaudiobookforsoul.com",662],["club386.com",663],["decompiler.com",[664,665]],["littlebigsnake.com",666],["easyfun.gg",667],["smailpro.com",668],["ilgazzettino.it",669],["ilmessaggero.it",669],["3bmeteo.com",[670,671]],["mconverter.eu",672],["lover937.net",673],["10gb.vn",674],["pes6.es",675],["tactics.tools",[676,677]],["boundhub.com",678],["reliabletv.me",679],["jakondo.ru",680],["trueachievements.com",680],["truesteamachievements.com",680],["truetrophies.com",680],["filecrypt.*",681],["wired.com",683],["spankbang.*",[684,685,686,741,742]],["hulu.com",[687,688,689]],["hanime.tv",690],["nhentai.net",[691,692,693]],["pouvideo.*",694],["povvideo.*",694],["povw1deo.*",694],["povwideo.*",694],["powv1deo.*",694],["powvibeo.*",694],["powvideo.*",694],["powvldeo.*",694],["powcloud.org",695],["primevideo.com",696],["read.amazon.*",[696,712]],["anonymfile.com",697],["gofile.to",697],["dotycat.com",698],["rateyourmusic.com",699],["reporterpb.com.br",700],["blog-dnz.com",702],["18adultgames.com",703],["colnect.com",[704,705]],["adultgamesworld.com",706],["servustv.com",[707,708]],["reviewdiv.com",709],["parametric-architecture.com",710],["voiceofdenton.com",711],["concealednation.org",711],["askattest.com",713],["opensubtitles.com",714],["savefiles.com",715],["streamup.ws",716],["pfps.gg",717],["goodstream.one",718],["lecrabeinfo.net",719],["cerberusapp.com",720],["smashkarts.io",721],["beamng.wesupply.cx",722],["wowtv.de",[723,724]],["jsfiddle.net",[725,726]],["musicbusinessworldwide.com",727],["mahfda.com",728],["agar.live",729],["dailymotion.com",730],["scribd.com",731],["www.google.*",732],["tacobell.com",733],["zefoy.com",734],["cnet.com",735],["trendyol.com",[738,739]],["natgeotv.com",740],["globo.com",743],["linklog.tiagorangel.com",745],["wayfair.com",746]]);
const exceptionsMap = new Map([["cloudflare.com",[0]],["pingit.com",[181]],["loan.bgmi32bitapk.in",[301]],["lookmovie.studio",[603]]]);
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
    try { setConstant(...argsList[i]); }
    catch { }
}

/******************************************************************************/

// End of local scope
})();

void 0;
