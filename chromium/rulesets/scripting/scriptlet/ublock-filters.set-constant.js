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
const argsList = [["console.clear","undefined"],["aclib.runInPagePush","{}","as","callback"],["aclib.runBanner","{}","as","function"],["aclib.runPop","throwFunc"],["aclib.runInterstitial","{}","as","function"],["aclib.runAutoTag","noopFunc"],["adBlockDetected","undefined"],["akamaiDisableServerIpLookup","noopFunc"],["DD_RUM.addAction","noopFunc"],["nads.createAd","trueFunc"],["dvtag.getTargeting","trueFunc"],["ga","noopFunc"],["huecosPBS.nstdX","null"],["DTM.trackAsyncPV","noopFunc"],["_satellite","{}"],["_satellite.getVisitorId","noopFunc"],["newPageViewSpeedtest","noopFunc"],["pubg.unload","noopFunc"],["generateGalleryAd","noopFunc"],["mediator","noopFunc"],["Object.prototype.subscribe","noopFunc"],["gbTracker","{}"],["gbTracker.sendAutoSearchEvent","noopFunc"],["Object.prototype.vjsPlayer.ads","noopFunc"],["network_user_id",""],["google.ima.OmidVerificationVendor","{}"],["Object.prototype.omidAccessModeRules","{}"],["googletag.cmd","{}"],["_aps","{}"],["Object.prototype.setDisableFlashAds","noopFunc"],["DD_RUM.addTiming","noopFunc"],["chameleonVideo.adDisabledRequested","true"],["AdmostClient","{}"],["analytics","{}"],["datalayer","[]"],["Object.prototype.isInitialLoadDisabled","noopFunc"],["listingGoogleEETracking","noopFunc"],["dcsMultiTrack","noopFunc"],["urlStrArray","noopFunc"],["pa","{}"],["Object.prototype.setConfigurations","noopFunc"],["Object.prototype.bk_addPageCtx","noopFunc"],["Object.prototype.bk_doJSTag","noopFunc"],["passFingerPrint","noopFunc"],["optimizely","{}"],["optimizely.initialized","true"],["google_optimize","{}"],["google_optimize.get","noopFunc"],["_gsq","{}"],["_gsq.push","noopFunc"],["stmCustomEvent","noopFunc"],["_gsDevice",""],["iom","{}"],["iom.c","noopFunc"],["_conv_q","{}"],["_conv_q.push","noopFunc"],["google.ima.settings.setDisableFlashAds","noopFunc"],["pa.privacy","{}"],["populateClientData4RBA","noopFunc"],["YT.ImaManager","noopFunc"],["UOLPD","{}"],["UOLPD.dataLayer","{}"],["__configuredDFPTags","{}"],["URL_VAST_YOUTUBE","{}"],["Adman","{}"],["dplus","{}"],["dplus.track","noopFunc"],["_satellite.track","noopFunc"],["google.ima.dai","{}"],["gfkS2sExtension","{}"],["gfkS2sExtension.HTML5VODExtension","noopFunc"],["AnalyticsEventTrackingJS","{}"],["AnalyticsEventTrackingJS.addToBasket","noopFunc"],["AnalyticsEventTrackingJS.trackErrorMessage","noopFunc"],["initializeslideshow","noopFunc"],["fathom","{}"],["fathom.trackGoal","noopFunc"],["Origami","{}"],["Origami.fastclick","noopFunc"],["jad","undefined"],["hasAdblocker","true"],["Sentry","{}"],["Sentry.init","noopFunc"],["TRC","{}"],["TRC._taboolaClone","[]"],["fp","{}"],["fp.t","noopFunc"],["fp.s","noopFunc"],["initializeNewRelic","noopFunc"],["turnerAnalyticsObj","{}"],["turnerAnalyticsObj.setVideoObject4AnalyticsProperty","noopFunc"],["optimizelyDatafile","{}"],["optimizelyDatafile.featureFlags","[]"],["fingerprint","{}"],["fingerprint.getCookie","noopFunc"],["gform.utils","noopFunc"],["gform.utils.trigger","noopFunc"],["get_fingerprint","noopFunc"],["moatPrebidApi","{}"],["moatPrebidApi.getMoatTargetingForPage","noopFunc"],["cpd_configdata","{}"],["cpd_configdata.url",""],["yieldlove_cmd","{}"],["yieldlove_cmd.push","noopFunc"],["dataLayer.push","noopFunc"],["_etmc","{}"],["_etmc.push","noopFunc"],["freshpaint","{}"],["freshpaint.track","noopFunc"],["ShowRewards","noopFunc"],["stLight","{}"],["stLight.options","noopFunc"],["DD_RUM.addError","noopFunc"],["sensorsDataAnalytic201505","{}"],["sensorsDataAnalytic201505.init","noopFunc"],["sensorsDataAnalytic201505.quick","noopFunc"],["sensorsDataAnalytic201505.track","noopFunc"],["s","{}"],["s.tl","noopFunc"],["smartech","noopFunc"],["sensors","{}"],["sensors.init","noopFunc"],["sensors.track","noopFunc"],["adn","{}"],["adn.clearDivs","noopFunc"],["_vwo_code","{}"],["gtag","noopFunc"],["_taboola","{}"],["_taboola.push","noopFunc"],["clicky","{}"],["clicky.goal","noopFunc"],["WURFL","{}"],["_sp_.config.events.onSPPMObjectReady","noopFunc"],["gtm","{}"],["gtm.trackEvent","noopFunc"],["mParticle.Identity.getCurrentUser","noopFunc"],["JSGlobals.prebidEnabled","false"],["elasticApm","{}"],["elasticApm.init","noopFunc"],["ga.sendGaEvent","noopFunc"],["adobe","{}"],["MT","{}"],["MT.track","noopFunc"],["ClickOmniPartner","noopFunc"],["adex","{}"],["adex.getAdexUser","noopFunc"],["Adkit","noopFunc"],["Object.prototype.shouldExpectGoogleCMP","false"],["apntag.refresh","noopFunc"],["pa.sendEvent","noopFunc"],["Munchkin","{}"],["Munchkin.init","noopFunc"],["ttd_dom_ready","noopFunc"],["ramp","undefined"],["appInfo.snowplow.trackSelfDescribingEvent","noopFunc"],["_vwo_code.init","noopFunc"],["adobePageView","noopFunc"],["dapTracker","{}"],["dapTracker.track","noopFunc"],["newrelic","{}"],["newrelic.setCustomAttribute","noopFunc"],["ytInitialPlayerResponse.playerAds","undefined"],["ytInitialPlayerResponse.adPlacements","undefined"],["ytInitialPlayerResponse.adSlots","undefined"],["playerResponse.adPlacements","undefined"],["nsShowMaxCount","0"],["objVc.interstitial_web",""],["_ml_ads_ns","null"],["_sp_.config","undefined"],["isAdBlockActive","false"],["AdController","noopFunc"],["console.clear","noopFunc"],["Object.prototype.hideAds","true"],["Object.prototype._getSalesHouseConfigurations","noopFunc"],["vast_urls","{}"],["sadbl","false"],["adblockcheck","false"],["arrvast","[]"],["blurred","false"],["flashvars.adv_pre_src",""],["showPopunder","false"],["page_params.holiday_promo","true"],["adsEnabled","true"],["String.prototype.charAt","trueFunc"],["ad_blocker","false"],["blockAdBlock","true"],["VikiPlayer.prototype.pingAbFactor","noopFunc"],["player.options.disableAds","true"],["console.clear","trueFunc"],["flashvars.adv_pre_vast",""],["flashvars.adv_pre_vast_alt",""],["x_width","1"],["_site_ads_ns","true"],["luxuretv.config",""],["Object.prototype.AdOverlay","noopFunc"],["tkn_popunder","null"],["can_run_ads","true"],["adsBlockerDetector","noopFunc"],["globalThis","null"],["adblock","false"],["__ads","true"],["FlixPop.isPopGloballyEnabled","falseFunc"],["check_adblock","true"],["$.magnificPopup.open","noopFunc"],["adsenseadBlock","noopFunc"],["adblockSuspected","false"],["xRds","true"],["cRAds","false"],["disasterpingu","false"],["App.views.adsView.adblock","false"],["flashvars.adv_pause_html",""],["$.fx.off","true"],["adBlockEnabled","false"],["puShown","true"],["showAds","true"],["attr","{}"],["scriptSrc",""],["cxStartDetectionProcess","noopFunc"],["isAdBlocked","false"],["adblock","noopFunc"],["path",""],["_ctrl_vt.blocked.ad_script","false"],["blockAdBlock","noopFunc"],["caca","noopFunc"],["Ok","true"],["safelink.adblock","false"],["openPopunder","noopFunc"],["ClickUnder","noopFunc"],["flashvars.adv_pre_url",""],["flashvars.protect_block",""],["flashvars.video_click_url",""],["adBlock","false"],["spoof","noopFunc"],["btoa","null"],["sp_ad","true"],["adsBlocked","false"],["_sp_.msg.displayMessage","noopFunc"],["CaptchmeState.adb","undefined"],["UhasAB","false"],["adNotificationDetected","false"],["atob","noopFunc"],["_pop","noopFunc"],["CnnXt.Event.fire","noopFunc"],["_ti_update_user","noopFunc"],["valid","1"],["vastAds","[]"],["adblock","1"],["frg","1"],["time","0"],["ads","true"],["GNCA_Ad_Support","true"],["Date.now","noopFunc"],["jQuery.adblock","1"],["VMG.Components.Adblock","false"],["adblockDetector","trueFunc"],["hasPoped","true"],["flashvars.video_click_url","undefined"],["flashvars.adv_start_html",""],["flashvars.popunder_url",""],["flashvars.adv_post_src",""],["flashvars.adv_post_url",""],["jQuery.adblock","false"],["google_jobrunner","true"],["sec","0"],["gadb","false"],["checkadBlock","noopFunc"],["clientSide.adbDetect","noopFunc"],["HTMLAnchorElement.prototype.click","noopFunc"],["cmnnrunads","true"],["adBlocker","false"],["adBlockDetected","noopFunc"],["StileApp.somecontrols.adBlockDetected","noopFunc"],["MDCore.adblock","0"],["google_tag_data","noopFunc"],["noAdBlock","true"],["adsOk","true"],["check","true"],["isal","true"],["document.hidden","true"],["awm","true"],["adblockEnabled","false"],["is_adblocked","false"],["pogo.intermission.staticAdIntermissionPeriod","0"],["SubmitDownload1","noopFunc"],["t","0"],["ckaduMobilePop","noopFunc"],["tieneAdblock","0"],["adsAreBlocked","false"],["cmgpbjs","false"],["displayAdblockOverlay","false"],["google","false"],["Math.pow","noopFunc"],["openInNewTab","noopFunc"],["runAdBlocker","false"],["Adblock","false"],["flashvars.logo_url",""],["flashvars.logo_text",""],["nlf.custom.userCapabilities","false"],["count","0"],["LoadThisScript","true"],["showPremLite","true"],["closeBlockerModal","false"],["adBlockDetector.isEnabled","falseFunc"],["areAdsDisplayed","true"],["gkAdsWerbung","true"],["pop_target","null"],["is_banner","true"],["$easyadvtblock","false"],["show_dfp_preroll","false"],["show_youtube_preroll","false"],["doads","true"],["jsUnda","noopFunc"],["AlobaidiDetectAdBlock","true"],["Advertisement","1"],["adBlockDetected","false"],["abp1","1"],["pr_okvalida","true"],["$.ajax","trueFunc"],["cnbc.canShowAds","true"],["firefaucet","true"],["cRAds","true"],["uas","[]"],["flashvars.popunder_url","undefined"],["adv","true"],["prerollMain","undefined"],["canRunAds","true"],["Fingerprint2","true"],["dclm_ajax_var.disclaimer_redirect_url",""],["load_pop_power","noopFunc"],["adBlockDetected","true"],["Time_Start","0"],["blockAdBlock","trueFunc"],["ezstandalone.enabled","true"],["foundation.adPlayer.bitmovin","{}"],["weltConfig.switches.videoAdBlockBlocker","false"],["DL8_GLOBALS.enableAdSupport","false"],["DL8_GLOBALS.useHomad","false"],["DL8_GLOBALS.enableHomadDesktop","false"],["DL8_GLOBALS.enableHomadMobile","false"],["Object.prototype.adReinsertion","noopFunc"],["getHomadConfig","noopFunc"],["ab","false"],["go_popup","{}"],["noBlocker","true"],["adsbygoogle","null"],["fabActive","false"],["gWkbAdVert","true"],["noblock","true"],["wgAffiliateEnabled","false"],["ads","null"],["detectAdblock","noopFunc"],["adsLoadable","true"],["ASSetCookieAds","null"],["letShowAds","true"],["ulp_noadb","true"],["Object.prototype.adblock_detected","false"],["timeSec","0"],["adsbygoogle.loaded","true"],["ads_unblocked","true"],["xxSetting.adBlockerDetection","false"],["open","undefined"],["Drupal.behaviors.adBlockerPopup","null"],["fake_ad","true"],["koddostu_com_adblock_yok","null"],["adsbygoogle","trueFunc"],["player.ads.cuePoints","undefined"],["adBlockDetected","null"],["better_ads_adblock","1"],["Adv_ab","false"],["sgpbCanRunAds","true"],["document.hidden","false"],["hasFocus","trueFunc"],["navigator.brave","undefined"],["Object.prototype.isAllAdClose","true"],["document.hasFocus","trueFunc"],["isRequestPresent","true"],["fouty","true"],["Notification","undefined"],["protection","noopFunc"],["private","false"],["navigator.webkitTemporaryStorage.queryUsageAndQuota","noopFunc"],["document.onkeydown","noopFunc"],["showadas","true"],["alert","throwFunc"],["aSl.gcd","0"],["window.adLink","null"],["detectedAdblock","undefined"],["isTabActive","true"],["clicked","2"],["ov.advertising.tisoomi.loadScript","noopFunc"],["abp","false"],["hommy","{}"],["hommy.waitUntil","noopFunc"],["flashvars.mlogo",""],["vpPrerollVideo","undefined"],["PlayerConfig.config.CustomAdSetting","[]"],["PlayerConfig.trusted","true"],["PlayerConfig.config.AffiliateAdViewLevel","3"],["univresalP","noopFunc"],["hold_click","false"],["tie.ad_blocker_detector","false"],["admiral","noopFunc"],["gnt.x.uam"],["gnt.u.z","true"],["__INITIAL_DATA__.siteData.admiralScript"],["objAd.loadAdShield","noopFunc"],["window.myAd.runAd","noopFunc"],["detectAdBlock","noopFunc"],["__INITIAL_STATE__.config.theme.ads.isAdBlockerEnabled","false"],["__INITIAL_STATE__.gameLists.gamesNoPrerollIds.indexOf","trueFunc"],["document.ontouchend","null"],["document.onclick","null"],["playID","1"],["googletag._loaded_","true"],["__PRELOADED_STATE__.view.components.player.playbackContext.ads","undefined"],["app._data.ads","[]"],["pubAdsService","trueFunc"],["config.pauseInspect","false"],["appContext.adManager.context.current.adFriendly","false"],["blockAdBlock._options.baitClass","null"],["document.blocked_var","1"],["____ads_js_blocked","false"],["wIsAdBlocked","false"],["WebSite.plsDisableAdBlock","null"],["ads_blocked","false"],["samDetected","false"],["countClicks","0"],["settings.adBlockerDetection","false"],["mixpanel.get_distinct_id","true"],["fuckAdBlock._options.baitClass","null"],["bscheck.adblocker","noopFunc"],["qpcheck.ads","noopFunc"],["isContentBlocked","falseFunc"],["CloudflareApps.installs.Ik7rmQ4t95Qk.options.measureDomain","undefined"],["detectAB1","noopFunc"],["uBlockOriginDetected","false"],["googletag._vars_","{}"],["googletag._loadStarted_","true"],["google_unique_id","1"],["google.javascript","{}"],["google.javascript.ads","{}"],["google_global_correlator","1"],["paywallGateway.truncateContent","noopFunc"],["adBlockDisabled","true"],["__NEXT_DATA__.props.pageProps.adVideo","undefined"],["blockedElement","noopFunc"],["popit","false"],["adBlockerDetected","false"],["abu","falseFunc"],["countdown","0"],["decodeURI","noopFunc"],["flashvars.adv_postpause_vast",""],["xv_ad_block","0"],["openWindow","noopFunc"],["vidorev_jav_plugin_video_ads_object.vid_ads_m_video_ads",""],["adsProvider.init","noopFunc"],["SDKLoaded","true"],["POPUNDER_ENABLED","false"],["plugins.preroll","noopFunc"],["errcode","0"],["DHAntiAdBlocker","true"],["showada","true"],["showax","true"],["p18","undefined"],["ADBLOCKED","false"],["Object.prototype.adsEnabled","false"],["adb","0"],["String.fromCharCode","trueFunc"],["adblock_use","false"],["Object.prototype.adblockFound","false"],["createCanvas","noopFunc"],["document.bridCanRunAds","true"],["playerAdSettings.adLink",""],["playerAdSettings.waitTime","0"],["xv.sda.pp.init","noopFunc"],["isAdsLoaded","true"],["adblockerAlert","noopFunc"],["Object.prototype.parseXML","noopFunc"],["Object.prototype.blackscreenDuration","1"],["Object.prototype.adPlayerId",""],["adblockDetect","noopFunc"],["style","noopFunc"],["history.pushState","noopFunc"],["google_unique_id","6"],["__NEXT_DATA__.props.pageProps.adsConfig","undefined"],["new_config.timedown","0"],["truex","{}"],["truex.client","noopFunc"],["hiddenProxyDetected","false"],["SteadyWidgetSettings.adblockActive","false"],["proclayer","noopFunc"],["timeleft","0"],["load_ads","trueFunc"],["starPop","1"],["Object.prototype.ads","noopFunc"],["detectBlockAds","noopFunc"],["ga","trueFunc"],["ad_link",""],["penciBlocksArray","[]"],["App.AdblockDetected","false"],["SF.adblock","true"],["startfrom","0"],["D4zz","noopFunc"],["Object.prototype.ads.nopreroll_","true"],["HP_Scout.adBlocked","false"],["SD_IS_BLOCKING","false"],["Object.prototype.isPremium","true"],["__BACKPLANE_API__.renderOptions.showAdBlock",""],["Object.prototype.isNoAds","{}"],["tv3Cmp.ConsentGiven","true"],["setupSkin","noopFunc"],["Object.prototype.enableInterstitial","false"],["ads","undefined"],["td_ad_background_click_link","undefined"],["POSTPART_prototype.ADKEY","noopFunc"],["adBlockDetected","falseFunc"],["divWidth","1"],["noAdBlock","noopFunc"],["AdService.info.abd","noopFunc"],["adBlockDetectionResult","undefined"],["popped","true"],["puShown1","true"],["passthetest","true"],["pandaAdviewValidate","true"],["canGetAds","true"],["ad_blocker_active","false"],["init_welcome_ad","noopFunc"],["document.body.contains","trueFunc"],["popunder","undefined"],["distance","0"],["document.onclick",""],["adEnable","true"],["displayAds","0"],["_adshrink.skiptime","0"],["AbleToRunAds","true"],["PreRollAd.timeCounter","0"],["abpblocked","undefined"],["paAddUnit","noopFunc"],["adt","0"],["test_adblock","noopFunc"],["adblockDetector","noopFunc"],["vastEnabled","false"],["detectadsbocker","false"],["two_worker_data_js.js","[]"],["FEATURE_DISABLE_ADOBE_POPUP_BY_COUNTRY","true"],["questpassGuard","noopFunc"],["isAdBlockerEnabled","false"],["sssp","emptyObj"],["smartLoaded","true"],["timeLeft","0"],["Cookiebot","noopFunc"],["feature_flags.interstitial_ads_flag","false"],["feature_flags.interstitials_every_four_slides","false"],["waldoSlotIds","true"],["adblockstatus","false"],["adScriptLoaded","true"],["adblockEnabled","noopFunc"],["adSettings","[]"],["banner_is_blocked","false"],["Object.prototype.adBlocked","false"],["chp_adblock_browser","noopFunc"],["googleAd","true"],["Brid.A9.prototype.backfillAdUnits","[]"],["dct","0"],["slideShow.displayInterstitial","true"],["googletag","true"],["tOS2","150"],["checkAdBlocker","noopFunc"],["navigator.standalone","true"],["empire.pop","undefined"],["empire.direct","undefined"],["empire.directHideAds","undefined"],["empire.mediaData.advisorMovie","1"],["empire.mediaData.advisorSerie","1"],["setTimer","0"],["penci_adlbock.ad_blocker_detector","0"],["Object.prototype.adblockDetector","noopFunc"],["blext","true"],["vidorev_jav_plugin_video_ads_object","{}"],["vidorev_jav_plugin_video_ads_object_post","{}"],["S_Popup","10"],["rabLimit","-1"],["nudgeAdBlock","noopFunc"],["feedBack.showAffilaePromo","noopFunc"],["ShowAdvertising","{}"],["FAVE.settings.ads.ssai.prod.clips.enabled","false"],["FAVE.settings.ads.ssai.prod.liveAuth.enabled","false"],["FAVE.settings.ads.ssai.prod.liveUnauth.enabled","false"],["HTMLScriptElement.prototype.onerror","null"],["loadpagecheck","noopFunc"],["art3m1sItemNames.affiliate-wrapper","\"\""],["window.adngin","{}"],["amzn_aps_csm","{}"],["isAdBlockerActive","noopFunc"],["di.app.WebplayerApp.Ads.Adblocks.app.AdBlockDetectApp.startWithParent","false"],["sharedController.adblockDetector","noopFunc"],["checkAdsStatus","noopFunc"],["settings.adBlockDetectionEnabled","false"],["displayInterstitialAdConfig","false"],["checkAdBlockeraz","noopFunc"],["blockingAds","false"],["Yii2App.playbackTimeout","0"],["QiyiPlayerProphetData.a.data","{}"],["toggleAdBlockInfo","falseFunc"],["aipAPItag.prerollSkipped","true"],["aipAPItag.setPreRollStatus","trueFunc"],["reklam_1_saniye","0"],["reklam_1_gecsaniye","0"],["reklamsayisi","1"],["reklam_1",""],["HTMLImageElement.prototype.onerror","undefined"],["HTMLImageElement.prototype.onload","undefined"],["powerAPITag","emptyObj"],["playerEnhancedConfig.run","throwFunc"],["aoAdBlockDetected","false"],["rodo.checkIsDidomiConsent","noopFunc"],["xtime","0"],["Div_popup",""],["Scribd.Blob.AdBlockerModal","noopFunc"],["AddAdsV2I.addBlock","false"],["hasAdBlocker","false"],["initials.yld-pdpopunder",""],["download_click","true"],["advertisement3","true"],["DisableDevtool","noopFunc"],["clicked","true"],["eClicked","true"],["number","0"],["sync","true"],["PlayerLogic.prototype.detectADB","noopFunc"],["showPopunder","noopFunc"],["Object.prototype.prerollAds","[]"],["notifyMe","noopFunc"],["adsClasses","undefined"],["gsecs","0"],["dvsize","52"],["majorse","true"],["completed","1"],["testerli","false"],["w87.abd","noopFunc"],["w87.dsab","noopFunc"],["document.referrer",""],["Object.prototype.setNeedShowAdblockWarning","noopFunc"],["NoAdBlock","noopFunc"],["adList","[]"],["ifmax","true"],["nitroAds.abp","true"],["onloadUI","noopFunc"],["PageLoader.DetectAb","0"],["one_time","1"],["consentGiven","true"],["GEMG.GPT.Interstitial","noopFunc"],["amiblock","0"],["karte3","18"],["sandDetect","noopFunc"],["amodule.data","emptyArr"],["Object.prototype.ADBLOCK_DETECTION",""],["postroll","undefined"],["interstitial","undefined"],["isAdBlockDetected","false"],["pData.adblockOverlayEnabled","0"],["cabdSettings","undefined"],["td_ad_background_click_link"],["malisx","true"],["alim","true"],["ADS.isBannersEnabled","false"],["EASYFUN_ADS_CAN_RUN","true"],["adsbygoogle_ama_fc_has_run","true"],["jwDefaults.advertising","{}"],["elimina_profilazione","1"],["elimina_pubblicita","1"],["abd","{}"],["checkerimg","noopFunc"],["detectedAdblock","noopFunc"],["Object.prototype.DetectByGoogleAd","noopFunc"],["nitroAds","{}"],["nitroAds.createAd","noopFunc"],["NativeAd","noopFunc"],["window.navigator.brave","undefined"],["HTMLScriptElement.prototype.onerror","undefined"],["isAdblock","false"],["openPop","noopFunc"],["cns.library","true"],["BJSShowUnder","{}"],["BJSShowUnder.bindTo","noopFunc"],["BJSShowUnder.add","noopFunc"],["Object.prototype._parseVAST","noopFunc"],["Object.prototype.createAdBlocker","noopFunc"],["Object.prototype.isAdPeriod","falseFunc"],["ABLK","false"],["_n_app.popunder","null"],["_n_app.options.ads.show_popunders","false"],["N_BetterJsPop.object","{}"],["isAdb","false"],["puOverlay","noopFunc"],["ue_adb_chk","1"],["countDown","0"],["runCheck","noopFunc"],["adsSlotRenderEndSeen","true"],["showModal","noopFunc"],["flashvars.mlogo_link",""],["isAdBlocked","noopFunc"],["URLlist","[]"],["aaw","{}"],["aaw.processAdsOnPage","noopFunc"],["doOpen","undefined"],["OneTrust","{}"],["OneTrust.IsAlertBoxClosed","trueFunc"],["FOXIZ_MAIN_SCRIPT.siteAccessDetector","noopFunc"],["openAdBlockPopup","noopFunc"],["Object.prototype._adsDisabled","true"],["advanced_ads_check_adblocker","noopFunc"],["canRunAds","1"],["attestHasAdBlockerActivated","true"],["extInstalled","true"],["SaveFiles.add","noopFunc"],["detectSandbox","noopFunc"],["adbon","0"],["LCI.adBlockDetectorEnabled","false"],["stoCazzo","true"],["adblockDetected","false"],["importFAB","undefined"],["window.__CONFIGURATION__.adInsertion.enabled","false"],["window.__CONFIGURATION__.features.enableAdBlockerDetection","false"],["_carbonads","{}"],["_bsa","{}"],["uberad_mode"],["__aab_init","true"],["show_videoad_limited","noopFunc"],["rwt","noopFunc"],["bmak.js_post","false"],["firebase.analytics","noopFunc"],["Object.prototype.updateModifiedCommerceUrl","noopFunc"],["flashvars.event_reporting",""],["Object.prototype.has_opted_out_tracking","trueFunc"],["process","{}"],["process.env","{}"],["Visitor","{}"],["send_gravity_event","noopFunc"],["send_recommendation_event","noopFunc"],["libAnalytics.data.get","noopFunc"],["adthrive._components.start","noopFunc"],["data","true"],["navigator.sendBeacon","noopFunc"]];
const hostnamesMap = new Map([["jilliandescribecompany.com",0],["gogoanime.*",[0,202]],["adrianmissionminute.com",0],["alejandrocenturyoil.com",0],["alleneconomicmatter.com",0],["bethshouldercan.com",0],["bigclatterhomesguideservice.com",0],["brittneystandardwestern.com",0],["brookethoughi.com",0],["brucevotewithin.com",0],["cindyeyefinal.com",0],["denisegrowthwide.com",0],["diananatureforeign.com",0],["donaldlineelse.com",0],["edwardarriveoften.com",0],["erikcoldperson.com",0],["evelynthankregion.com",0],["graceaddresscommunity.com",0],["heatherdiscussionwhen.com",0],["heatherwholeinvolve.com",0],["housecardsummerbutton.com",0],["jamessoundcost.com",0],["jamiesamewalk.com",0],["jasminetesttry.com",0],["jasonresponsemeasure.com",0],["jayservicestuff.com",0],["jennifercertaindevelopment.com",0],["jessicaglassauthor.com",0],["johnalwayssame.com",0],["johntryopen.com",0],["jonathansociallike.com",0],["josephseveralconcern.com",0],["kellywhatcould.com",0],["kennethofficialitem.com",0],["kristiesoundsimply.com",0],["lisatrialidea.com",0],["lorimuchbenefit.com",0],["loriwithinfamily.com",0],["lukecomparetwo.com",0],["mariatheserepublican.com",0],["markstyleall.com",0],["michaelapplysome.com",0],["morganoperationface.com",0],["nathanfromsubject.com",0],["paulkitchendark.com",0],["rebeccaneverbase.com",0],["richardsignfish.com",0],["roberteachfinal.com",0],["robertordercharacter.com",0],["robertplacespace.com",0],["ryanagoinvolve.com",0],["sandratableother.com",0],["sandrataxeight.com",0],["sethniceletter.com",0],["shannonpersonalcost.com",0],["susanhavekeep.com",0],["tinycat-voe-fashion.com",0],["toddpartneranimal.com",0],["troyyourlead.com",0],["uptodatefinishconference.com",0],["uptodatefinishconferenceroom.com",0],["voe.sx",0],["maxfinishseveral.com",0],["voe.sx>>",0],["javboys.tv>>",0],["freeplayervideo.com",0],["nazarickol.com",0],["player-cdn.com",0],["playhydrax.com",[0,410,411]],["rabbitstream.net",0],["fmovies.*",0],["japscan.*",[1,2,3,4,5]],["u26bekrb.fun",6],["br.de",7],["indeed.com",8],["zillow.com",[8,112]],["pasteboard.co",9],["bbc.com",10],["clickhole.com",11],["deadspin.com",11],["gizmodo.com",11],["jalopnik.com",11],["jezebel.com",11],["kotaku.com",11],["lifehacker.com",11],["splinternews.com",11],["theinventory.com",11],["theonion.com",11],["theroot.com",11],["thetakeout.com",11],["pewresearch.org",11],["los40.com",[12,13]],["as.com",13],["caracol.com.co",13],["telegraph.co.uk",[14,15]],["poweredbycovermore.com",[14,67]],["lumens.com",[14,67]],["verizon.com",16],["humanbenchmark.com",17],["politico.com",18],["officedepot.co.cr",[19,20]],["officedepot.*",[21,22]],["usnews.com",23],["coolmathgames.com",[24,288,289,290]],["video.gazzetta.it",[25,26]],["oggi.it",[25,26]],["manoramamax.com",25],["factable.com",27],["thedailybeast.com",28],["zee5.com",29],["gala.fr",30],["geo.fr",30],["voici.fr",30],["gloucestershirelive.co.uk",31],["arsiv.mackolik.com",32],["jacksonguitars.com",33],["scandichotels.com",34],["stylist.co.uk",35],["nettiauto.com",36],["thaiairways.com",[37,38]],["cerbahealthcare.it",[39,40]],["futura-sciences.com",[39,57]],["toureiffel.paris",39],["campusfrance.org",[39,149]],["tiendaenlinea.claro.com.ni",[41,42]],["tieba.baidu.com",43],["fandom.com",[44,45,348]],["grasshopper.com",[46,47]],["epson.com.cn",[48,49,50,51]],["oe24.at",[52,53]],["szbz.de",52],["platform.autods.com",[54,55]],["kcra.com",56],["wcvb.com",56],["sporteurope.tv",56],["citibank.com.sg",58],["uol.com.br",[59,60,61,62,63]],["gazzetta.gr",64],["digicol.dpm.org.cn",[65,66]],["virginmediatelevision.ie",68],["larazon.es",[69,70]],["waitrosecellar.com",[71,72,73]],["kicker.de",[74,389]],["sharpen-free-design-generator.netlify.app",[75,76]],["help.cashctrl.com",[77,78]],["gry-online.pl",79],["vidaextra.com",80],["commande.rhinov.pro",[81,82]],["ecom.wixapps.net",[81,82]],["tipranks.com",[83,84]],["iceland.co.uk",[85,86,87]],["socket.pearsoned.com",88],["tntdrama.com",[89,90]],["trutv.com",[89,90]],["mobile.de",[91,92]],["ioe.vn",[93,94]],["geiriadur.ac.uk",[93,97]],["welsh-dictionary.ac.uk",[93,97]],["bikeportland.org",[95,96]],["biologianet.com",[60,61,62]],["10.com.au",[98,99]],["10play.com.au",[98,99]],["sunshine-live.de",[100,101]],["whatismyip.com",[102,103]],["myfitnesspal.com",104],["netoff.co.jp",[105,106]],["bluerabbitrx.com",[105,106]],["foundit.*",[107,108]],["clickjogos.com.br",109],["bristan.com",[110,111]],["share.hntv.tv",[113,114,115,116]],["forum.dji.com",[113,116]],["unionpayintl.com",[113,115]],["streamelements.com",113],["optimum.net",[117,118]],["hdfcfund.com",119],["user.guancha.cn",[120,121]],["sosovalue.com",122],["bandyforbundet.no",[123,124]],["tatacommunications.com",125],["kb.arlo.com",[125,155]],["suamusica.com.br",[126,127,128]],["macrotrends.net",[129,130]],["code.world",131],["smartcharts.net",131],["topgear.com",132],["eservice.directauto.com",[133,134]],["nbcsports.com",135],["standard.co.uk",136],["pruefernavi.de",[137,138]],["17track.net",139],["visible.com",140],["hagerty.com",[141,142]],["marketplace.nvidia.com",143],["kino.de",[144,145]],["9now.nine.com.au",146],["worldstar.com",147],["prisjakt.no",148],["developer.arm.com",[150,151]],["sterkinekor.com",152],["iogames.space",153],["id.condenast.com",154],["tires.costco.com",156],["tires.costco.ca",156],["livemint.com",[157,158]],["login.asda.com",[159,160]],["m.youtube.com",[161,162,163,164]],["music.youtube.com",[161,162,163,164]],["tv.youtube.com",[161,162,163,164]],["www.youtube.com",[161,162,163,164]],["youtubekids.com",[161,162,163,164]],["youtube-nocookie.com",[161,162,163,164]],["eu-proxy.startpage.com",[161,162,164]],["timesofindia.indiatimes.com",165],["economictimes.indiatimes.com",166],["motherless.com",167],["sueddeutsche.de",168],["watchanimesub.net",169],["wcoanimesub.tv",169],["wcoforever.net",169],["freeviewmovies.com",169],["filehorse.com",169],["guidetnt.com",169],["starmusiq.*",169],["sp-today.com",169],["linkvertise.com",169],["eropaste.net",169],["getpaste.link",169],["sharetext.me",169],["wcofun.*",169],["note.sieuthuthuat.com",169],["gadgets.es",[169,460]],["amateurporn.co",[169,258]],["wiwo.de",170],["primewire.*",171],["alphaporno.com",[171,541]],["porngem.com",171],["shortit.pw",[171,244]],["familyporn.tv",171],["sbplay.*",171],["85po.com",[171,229]],["milfnut.*",171],["k1nk.co",171],["watchasians.cc",171],["sankakucomplex.com",172],["player.glomex.com",173],["merkur.de",173],["tz.de",173],["sxyprn.*",174],["hqq.*",[175,176]],["waaw.*",[176,177]],["hotpornfile.org",176],["younetu.*",176],["multiup.us",176],["peliculas8k.com",[176,177]],["czxxx.org",176],["vtplayer.online",176],["vvtplayer.*",176],["netu.ac",176],["netu.frembed.lol",176],["123link.*",178],["adshort.*",178],["mitly.us",178],["linkrex.net",178],["linx.cc",178],["oke.io",178],["linkshorts.*",178],["dz4link.com",178],["adsrt.*",178],["linclik.com",178],["shrt10.com",178],["vinaurl.*",178],["loptelink.com",178],["adfloz.*",178],["cut-fly.com",178],["linkfinal.com",178],["payskip.org",178],["cutpaid.com",178],["linkjust.com",178],["leechpremium.link",178],["icutlink.com",[178,263]],["oncehelp.com",178],["rgl.vn",178],["reqlinks.net",178],["bitlk.com",178],["qlinks.eu",178],["link.3dmili.com",178],["short-fly.com",178],["foxseotools.com",178],["dutchycorp.*",178],["shortearn.*",178],["pingit.*",178],["link.turkdown.com",178],["7r6.com",178],["oko.sh",178],["ckk.ai",178],["fc.lc",178],["fstore.biz",178],["shrink.*",178],["cuts-url.com",178],["eio.io",178],["exe.app",178],["exee.io",178],["exey.io",178],["skincarie.com",178],["exeo.app",178],["tmearn.*",178],["coinlyhub.com",[178,326]],["adsafelink.com",178],["aii.sh",178],["megalink.*",178],["cybertechng.com",[178,342]],["cutdl.xyz",178],["iir.ai",178],["shorteet.com",[178,360]],["miniurl.*",178],["smoner.com",178],["gplinks.*",178],["odisha-remix.com",[178,342]],["xpshort.com",[178,342]],["upshrink.com",178],["clk.*",178],["easysky.in",178],["veganab.co",178],["golink.bloggerishyt.in",178],["birdurls.com",178],["vipurl.in",178],["jameeltips.us",178],["promo-visits.site",178],["satoshi-win.xyz",[178,376]],["shorterall.com",178],["encurtandourl.com",178],["forextrader.site",178],["postazap.com",178],["cety.app",178],["exego.app",[178,374]],["cutlink.net",178],["cutyurls.com",178],["cutty.app",178],["cutnet.net",178],["jixo.online",178],["tinys.click",[178,342]],["cpm.icu",178],["panyshort.link",178],["enagato.com",178],["pandaznetwork.com",178],["tpi.li",178],["oii.la",178],["recipestutorials.com",178],["shrinkme.*",178],["shrinke.*",178],["mrproblogger.com",178],["themezon.net",178],["shrinkforearn.in",178],["oii.io",178],["du-link.in",178],["atglinks.com",178],["thotpacks.xyz",178],["megaurl.in",178],["megafly.in",178],["simana.online",178],["fooak.com",178],["joktop.com",178],["evernia.site",178],["falpus.com",178],["link.paid4link.com",178],["exalink.fun",178],["shortxlinks.com",178],["upfion.com",178],["upfiles.app",178],["upfiles-urls.com",178],["flycutlink.com",[178,342]],["linksly.co",178],["link1s.*",178],["pkr.pw",178],["imagenesderopaparaperros.com",178],["shortenbuddy.com",178],["apksvip.com",178],["4cash.me",178],["namaidani.com",178],["shortzzy.*",178],["teknomuda.com",178],["shorttey.*",[178,325]],["miuiku.com",178],["savelink.site",178],["lite-link.*",178],["adcorto.*",178],["samaa-pro.com",178],["miklpro.com",178],["modapk.link",178],["ccurl.net",178],["linkpoi.me",178],["pewgame.com",178],["haonguyen.top",178],["zshort.*",178],["crazyblog.in",178],["cutearn.net",178],["rshrt.com",178],["filezipa.com",178],["dz-linkk.com",178],["upfiles.*",178],["theblissempire.com",178],["finanzas-vida.com",178],["adurly.cc",178],["paid4.link",178],["link.asiaon.top",178],["go.gets4link.com",178],["linkfly.*",178],["beingtek.com",178],["shorturl.unityassets4free.com",178],["disheye.com",178],["techymedies.com",178],["za.gl",[178,278]],["bblink.com",178],["myad.biz",178],["swzz.xyz",178],["vevioz.com",178],["charexempire.com",178],["clk.asia",178],["sturls.com",178],["myshrinker.com",178],["wplink.*",178],["rocklink.in",178],["techgeek.digital",178],["download3s.net",178],["shortx.net",178],["tlin.me",178],["bestcash2020.com",178],["adslink.pw",[178,624]],["novelssites.com",178],["faucetcrypto.net",178],["trxking.xyz",178],["weadown.com",178],["m.bloggingguidance.com",178],["link.codevn.net",178],["link4rev.site",178],["c2g.at",178],["bitcosite.com",[178,555]],["cryptosh.pro",178],["windowslite.net",[178,342]],["viewfr.com",178],["cl1ca.com",178],["4br.me",178],["fir3.net",178],["seulink.*",178],["encurtalink.*",178],["kiddyshort.com",178],["watchmygf.me",[179,203]],["camwhores.*",[179,189,228,229,230]],["camwhorez.tv",[179,189,228,229]],["cambay.tv",[179,210,228,255,257,258,259,260]],["fpo.xxx",[179,210]],["sexemix.com",179],["heavyfetish.com",[179,733]],["thotcity.su",179],["viralxxxporn.com",[179,393]],["tube8.*",[180,181]],["you-porn.com",181],["youporn.*",181],["youporngay.com",181],["youpornru.com",181],["redtube.*",181],["9908ww.com",181],["adelaidepawnbroker.com",181],["bztube.com",181],["hotovs.com",181],["insuredhome.org",181],["nudegista.com",181],["pornluck.com",181],["vidd.se",181],["pornhub.*",[181,315]],["pornhub.com",181],["pornerbros.com",182],["freep.com",182],["porn.com",183],["tune.pk",184],["noticias.gospelmais.com.br",185],["techperiod.com",185],["viki.com",[186,187]],["watch-series.*",188],["watchseries.*",188],["vev.*",188],["vidop.*",188],["vidup.*",188],["sleazyneasy.com",[189,190,191]],["smutr.com",[189,322]],["tktube.com",189],["yourporngod.com",[189,190]],["javbangers.com",[189,451]],["camfox.com",189],["camthots.tv",[189,255]],["shegotass.info",189],["amateur8.com",189],["bigtitslust.com",189],["ebony8.com",189],["freeporn8.com",189],["lesbian8.com",189],["maturetubehere.com",189],["sortporn.com",189],["motherporno.com",[189,190,210,257]],["theporngod.com",[189,190]],["watchdirty.to",[189,229,230,258]],["pornsocket.com",192],["luxuretv.com",193],["porndig.com",[194,195]],["webcheats.com.br",196],["ceesty.com",[197,198]],["gestyy.com",[197,198]],["corneey.com",198],["destyy.com",198],["festyy.com",198],["sh.st",198],["mitaku.net",198],["angrybirdsnest.com",199],["zrozz.com",199],["clix4btc.com",199],["4tests.com",199],["goltelevision.com",199],["news-und-nachrichten.de",199],["laradiobbs.net",199],["urlaubspartner.net",199],["produktion.de",199],["cinemaxxl.de",199],["bladesalvador.com",199],["tempr.email",199],["friendproject.net",199],["covrhub.com",199],["katfile.com",[199,622]],["trust.zone",199],["business-standard.com",199],["planetsuzy.org",200],["empflix.com",201],["xmovies8.*",202],["masteranime.tv",202],["0123movies.*",202],["gostream.*",202],["gomovies.*",202],["transparentcalifornia.com",203],["deepbrid.com",204],["webnovel.com",205],["streamwish.*",[206,207]],["oneupload.to",207],["wishfast.top",207],["rubystm.com",207],["rubyvid.com",207],["rubyvidhub.com",207],["stmruby.com",207],["streamruby.com",207],["schwaebische.de",208],["8tracks.com",209],["3movs.com",210],["bravoerotica.net",[210,257]],["youx.xxx",210],["camclips.tv",[210,322]],["xtits.*",[210,257]],["camflow.tv",[210,257,258,296,393]],["camhoes.tv",[210,255,257,258,296,393]],["xmegadrive.com",210],["xxxymovies.com",210],["xxxshake.com",210],["gayck.com",210],["xhand.com",[210,257]],["analdin.com",[210,257]],["revealname.com",211],["golfchannel.com",212],["stream.nbcsports.com",212],["mathdf.com",212],["gamcore.com",213],["porcore.com",213],["porngames.tv",213],["69games.xxx",213],["javmix.app",213],["haaretz.co.il",214],["haaretz.com",214],["hungama.com",214],["a-o.ninja",214],["anime-odcinki.pl",214],["shortgoo.blogspot.com",214],["tonanmedia.my.id",[214,574]],["isekaipalace.com",214],["plyjam.*",[215,216]],["foxsports.com.au",217],["canberratimes.com.au",217],["thesimsresource.com",218],["fxporn69.*",219],["vipbox.*",220],["viprow.*",220],["ctrl.blog",221],["sportlife.es",222],["finofilipino.org",223],["desbloqueador.*",224],["xberuang.*",225],["teknorizen.*",225],["mysflink.blogspot.com",225],["ashemaletube.*",226],["paktech2.com",226],["assia.tv",227],["assia4.com",227],["cwtvembeds.com",[229,256]],["camlovers.tv",229],["porntn.com",229],["pornissimo.org",229],["sexcams-24.com",[229,258]],["watchporn.to",[229,258]],["camwhorez.video",229],["footstockings.com",[229,230,258]],["xmateur.com",[229,230,258]],["multi.xxx",230],["weatherx.co.in",[231,232]],["sunbtc.space",231],["subtorrents.*",233],["subtorrents1.*",233],["newpelis.*",233],["pelix.*",233],["allcalidad.*",233],["infomaniakos.*",233],["ojogos.com.br",234],["powforums.com",235],["supforums.com",235],["studybullet.com",235],["usgamer.net",236],["recordonline.com",236],["freebitcoin.win",237],["e-monsite.com",237],["coindice.win",237],["freiepresse.de",238],["investing.com",239],["tornadomovies.*",240],["mp3fiber.com",241],["chicoer.com",242],["dailybreeze.com",242],["dailybulletin.com",242],["dailynews.com",242],["delcotimes.com",242],["eastbaytimes.com",242],["macombdaily.com",242],["ocregister.com",242],["pasadenastarnews.com",242],["pe.com",242],["presstelegram.com",242],["redlandsdailyfacts.com",242],["reviewjournal.com",242],["santacruzsentinel.com",242],["saratogian.com",242],["sentinelandenterprise.com",242],["sgvtribune.com",242],["tampabay.com",242],["times-standard.com",242],["theoaklandpress.com",242],["trentonian.com",242],["twincities.com",242],["whittierdailynews.com",242],["bostonherald.com",242],["dailycamera.com",242],["sbsun.com",242],["dailydemocrat.com",242],["montereyherald.com",242],["orovillemr.com",242],["record-bee.com",242],["redbluffdailynews.com",242],["reporterherald.com",242],["thereporter.com",242],["timescall.com",242],["timesheraldonline.com",242],["ukiahdailyjournal.com",242],["dailylocal.com",242],["mercurynews.com",242],["suedkurier.de",243],["anysex.com",245],["icdrama.*",246],["mangasail.*",246],["pornve.com",247],["file4go.*",248],["coolrom.com.au",248],["marie-claire.es",249],["gamezhero.com",249],["flashgirlgames.com",249],["onlinesudoku.games",249],["mpg.football",249],["sssam.com",249],["globalnews.ca",250],["drinksmixer.com",251],["leitesculinaria.com",251],["fupa.net",252],["browardpalmbeach.com",253],["dallasobserver.com",253],["houstonpress.com",253],["miaminewtimes.com",253],["phoenixnewtimes.com",253],["westword.com",253],["nowtv.com.tr",254],["caminspector.net",255],["camwhoreshd.com",255],["camgoddess.tv",255],["gay4porn.com",257],["mypornhere.com",257],["mangovideo.*",258],["love4porn.com",258],["thotvids.com",258],["watchmdh.to",258],["celebwhore.com",258],["cluset.com",258],["sexlist.tv",258],["4kporn.xxx",258],["xhomealone.com",258],["lusttaboo.com",[258,520]],["hentai-moon.com",258],["camhub.cc",[258,681]],["mediapason.it",261],["linkspaid.com",261],["tuotromedico.com",261],["neoteo.com",261],["phoneswiki.com",261],["celebmix.com",261],["myneobuxportal.com",261],["oyungibi.com",261],["25yearslatersite.com",261],["jeshoots.com",262],["techhx.com",262],["karanapk.com",262],["flashplayer.fullstacks.net",264],["cloudapps.herokuapp.com",264],["youfiles.herokuapp.com",264],["texteditor.nsspot.net",264],["temp-mail.org",265],["asianclub.*",266],["javhdporn.net",266],["vidmoly.to",267],["comnuan.com",268],["veedi.com",269],["battleboats.io",269],["anitube.*",270],["fruitlab.com",270],["haddoz.net",270],["streamingcommunity.*",270],["garoetpos.com",270],["stiletv.it",271],["mixdrop.*",272],["hqtv.biz",273],["liveuamap.com",274],["audycje.tokfm.pl",275],["shush.se",276],["allkpop.com",277],["empire-anime.*",[278,569,570,571,572,573]],["empire-streaming.*",[278,569,570,571]],["empire-anime.com",[278,569,570,571]],["empire-streamz.fr",[278,569,570,571]],["empire-stream.*",[278,569,570,571]],["pickcrackpasswords.blogspot.com",279],["kfrfansub.com",280],["thuglink.com",280],["voipreview.org",280],["illicoporno.com",281],["lavoixdux.com",281],["tonpornodujour.com",281],["jacquieetmichel.net",281],["swame.com",281],["vosfemmes.com",281],["voyeurfrance.net",281],["jacquieetmicheltv.net",[281,630,631]],["pogo.com",282],["cloudvideo.tv",283],["legionjuegos.org",284],["legionpeliculas.org",284],["legionprogramas.org",284],["16honeys.com",285],["elespanol.com",286],["remodelista.com",287],["audiofanzine.com",291],["uploadev.*",292],["developerinsider.co",293],["thehindu.com",294],["cambro.tv",[295,296]],["boobsradar.com",[296,393,700]],["nibelungen-kurier.de",297],["adfoc.us",298],["tackledsoul.com",298],["adrino1.bonloan.xyz",298],["vi-music.app",298],["instanders.app",298],["rokni.xyz",298],["keedabankingnews.com",298],["tea-coffee.net",298],["spatsify.com",298],["newedutopics.com",298],["getviralreach.in",298],["edukaroo.com",298],["funkeypagali.com",298],["careersides.com",298],["nayisahara.com",298],["wikifilmia.com",298],["infinityskull.com",298],["viewmyknowledge.com",298],["iisfvirtual.in",298],["starxinvestor.com",298],["jkssbalerts.com",298],["sahlmarketing.net",298],["filmypoints.in",298],["fitnessholic.net",298],["moderngyan.com",298],["sattakingcharts.in",298],["bankshiksha.in",298],["earn.mpscstudyhub.com",298],["earn.quotesopia.com",298],["money.quotesopia.com",298],["best-mobilegames.com",298],["learn.moderngyan.com",298],["bharatsarkarijobalert.com",298],["quotesopia.com",298],["creditsgoal.com",298],["bgmi32bitapk.in",298],["techacode.com",298],["trickms.com",298],["ielts-isa.edu.vn",298],["loan.punjabworks.com",298],["sptfy.be",298],["mcafee-com.com",[298,374]],["pianetamountainbike.it",299],["barchart.com",300],["modelisme.com",301],["parasportontario.ca",301],["prescottenews.com",301],["nrj-play.fr",302],["hackingwithreact.com",303],["gutekueche.at",304],["peekvids.com",305],["playvids.com",305],["pornflip.com",305],["redensarten-index.de",306],["vw-page.com",307],["viz.com",[308,309]],["0rechner.de",310],["configspc.com",311],["xopenload.me",311],["uptobox.com",311],["uptostream.com",311],["japgay.com",312],["mega-debrid.eu",313],["dreamdth.com",314],["diaridegirona.cat",316],["diariodeibiza.es",316],["diariodemallorca.es",316],["diarioinformacion.com",316],["eldia.es",316],["emporda.info",316],["farodevigo.es",316],["laopinioncoruna.es",316],["laopiniondemalaga.es",316],["laopiniondemurcia.es",316],["laopiniondezamora.es",316],["laprovincia.es",316],["levante-emv.com",316],["mallorcazeitung.es",316],["regio7.cat",316],["superdeporte.es",316],["playpaste.com",317],["cnbc.com",318],["firefaucet.win",319],["74k.io",[320,321]],["cloudwish.xyz",321],["gradehgplus.com",321],["javindo.site",321],["javindosub.site",321],["kamehaus.net",321],["movearnpre.com",321],["arabshentai.com>>",321],["javdo.cc>>",321],["javenglish.cc>>",321],["javhd.*>>",321],["javhdz.*>>",321],["roshy.tv>>",321],["sextb.*>>",321],["fullhdxxx.com",323],["pornclassic.tube",324],["tubepornclassic.com",324],["etonline.com",325],["creatur.io",325],["lookcam.*",325],["drphil.com",325],["urbanmilwaukee.com",325],["hideandseek.world",325],["myabandonware.com",325],["kendam.com",325],["wttw.com",325],["synonyms.com",325],["definitions.net",325],["hostmath.com",325],["camvideoshub.com",325],["minhaconexao.com.br",325],["home-made-videos.com",327],["amateur-couples.com",327],["slutdump.com",327],["artificialnudes.com",327],["bdsmkingdom.xyz",327],["cosplaynsfw.xyz",327],["crazytoys.xyz",327],["hardcorelesbian.xyz",327],["pornfeet.xyz",327],["pornahegao.xyz",327],["sexontheboat.xyz",327],["dpstream.*",328],["produsat.com",329],["bluemediafiles.*",330],["12thman.com",331],["acusports.com",331],["atlantic10.com",331],["auburntigers.com",331],["baylorbears.com",331],["bceagles.com",331],["bgsufalcons.com",331],["big12sports.com",331],["bigten.org",331],["bradleybraves.com",331],["butlersports.com",331],["cmumavericks.com",331],["conferenceusa.com",331],["cyclones.com",331],["dartmouthsports.com",331],["daytonflyers.com",331],["dbupatriots.com",331],["dbusports.com",331],["denverpioneers.com",331],["fduknights.com",331],["fgcuathletics.com",331],["fightinghawks.com",331],["fightingillini.com",331],["floridagators.com",331],["friars.com",331],["friscofighters.com",331],["gamecocksonline.com",331],["goarmywestpoint.com",331],["gobison.com",331],["goblueraiders.com",331],["gobobcats.com",331],["gocards.com",331],["gocreighton.com",331],["godeacs.com",331],["goexplorers.com",331],["goetbutigers.com",331],["gofrogs.com",331],["gogriffs.com",331],["gogriz.com",331],["golobos.com",331],["gomarquette.com",331],["gopack.com",331],["gophersports.com",331],["goprincetontigers.com",331],["gopsusports.com",331],["goracers.com",331],["goshockers.com",331],["goterriers.com",331],["gotigersgo.com",331],["gousfbulls.com",331],["govandals.com",331],["gowyo.com",331],["goxavier.com",331],["gozags.com",331],["gozips.com",331],["griffinathletics.com",331],["guhoyas.com",331],["gwusports.com",331],["hailstate.com",331],["hamptonpirates.com",331],["hawaiiathletics.com",331],["hokiesports.com",331],["huskers.com",331],["icgaels.com",331],["iuhoosiers.com",331],["jsugamecocksports.com",331],["longbeachstate.com",331],["loyolaramblers.com",331],["lrtrojans.com",331],["lsusports.net",331],["morrisvillemustangs.com",331],["msuspartans.com",331],["muleriderathletics.com",331],["mutigers.com",331],["navysports.com",331],["nevadawolfpack.com",331],["niuhuskies.com",331],["nkunorse.com",331],["nuhuskies.com",331],["nusports.com",331],["okstate.com",331],["olemisssports.com",331],["omavs.com",331],["ovcsports.com",331],["owlsports.com",331],["purduesports.com",331],["redstormsports.com",331],["richmondspiders.com",331],["sfajacks.com",331],["shupirates.com",331],["siusalukis.com",331],["smcgaels.com",331],["smumustangs.com",331],["soconsports.com",331],["soonersports.com",331],["themw.com",331],["tulsahurricane.com",331],["txst.com",331],["txstatebobcats.com",331],["ubbulls.com",331],["ucfknights.com",331],["ucirvinesports.com",331],["uconnhuskies.com",331],["uhcougars.com",331],["uicflames.com",331],["umterps.com",331],["uncwsports.com",331],["unipanthers.com",331],["unlvrebels.com",331],["uoflsports.com",331],["usdtoreros.com",331],["utahstateaggies.com",331],["utepathletics.com",331],["utrockets.com",331],["uvmathletics.com",331],["uwbadgers.com",331],["villanova.com",331],["wkusports.com",331],["wmubroncos.com",331],["woffordterriers.com",331],["1pack1goal.com",331],["bcuathletics.com",331],["bubraves.com",331],["goblackbears.com",331],["golightsgo.com",331],["gomcpanthers.com",331],["goutsa.com",331],["mercerbears.com",331],["pirateblue.com",331],["pirateblue.net",331],["pirateblue.org",331],["quinnipiacbobcats.com",331],["towsontigers.com",331],["tribeathletics.com",331],["tribeclub.com",331],["utepminermaniacs.com",331],["utepminers.com",331],["wkutickets.com",331],["aopathletics.org",331],["atlantichockeyonline.com",331],["bigsouthnetwork.com",331],["bigsouthsports.com",331],["chawomenshockey.com",331],["dbupatriots.org",331],["drakerelays.org",331],["ecac.org",331],["ecacsports.com",331],["emueagles.com",331],["emugameday.com",331],["gculopes.com",331],["godrakebulldog.com",331],["godrakebulldogs.com",331],["godrakebulldogs.net",331],["goeags.com",331],["goislander.com",331],["goislanders.com",331],["gojacks.com",331],["gomacsports.com",331],["gseagles.com",331],["hubison.com",331],["iowaconference.com",331],["ksuowls.com",331],["lonestarconference.org",331],["mascac.org",331],["midwestconference.org",331],["mountaineast.org",331],["niu-pack.com",331],["nulakers.ca",331],["oswegolakers.com",331],["ovcdigitalnetwork.com",331],["pacersports.com",331],["rmacsports.org",331],["rollrivers.com",331],["samfordsports.com",331],["uncpbraves.com",331],["usfdons.com",331],["wiacsports.com",331],["alaskananooks.com",331],["broncathleticfund.com",331],["cameronaggies.com",331],["columbiacougars.com",331],["etownbluejays.com",331],["gobadgers.ca",331],["golancers.ca",331],["gometrostate.com",331],["gothunderbirds.ca",331],["kentstatesports.com",331],["lehighsports.com",331],["lopers.com",331],["lycoathletics.com",331],["lycomingathletics.com",331],["maraudersports.com",331],["mauiinvitational.com",331],["msumavericks.com",331],["nauathletics.com",331],["nueagles.com",331],["nwusports.com",331],["oceanbreezenyc.org",331],["patriotathleticfund.com",331],["pittband.com",331],["principiaathletics.com",331],["roadrunnersathletics.com",331],["sidearmsocial.com",331],["snhupenmen.com",331],["stablerarena.com",331],["stoutbluedevils.com",331],["uwlathletics.com",331],["yumacs.com",331],["collegefootballplayoff.com",331],["csurams.com",331],["cubuffs.com",331],["gobearcats.com",331],["gohuskies.com",331],["mgoblue.com",331],["osubeavers.com",331],["pittsburghpanthers.com",331],["rolltide.com",331],["texassports.com",331],["thesundevils.com",331],["uclabruins.com",331],["wvuathletics.com",331],["wvusports.com",331],["arizonawildcats.com",331],["calbears.com",331],["cuse.com",331],["georgiadogs.com",331],["goducks.com",331],["goheels.com",331],["gostanford.com",331],["insidekstatesports.com",331],["insidekstatesports.info",331],["insidekstatesports.net",331],["insidekstatesports.org",331],["k-stateathletics.com",331],["k-statefootball.net",331],["k-statefootball.org",331],["k-statesports.com",331],["k-statesports.net",331],["k-statesports.org",331],["k-statewomenshoops.com",331],["k-statewomenshoops.net",331],["k-statewomenshoops.org",331],["kstateathletics.com",331],["kstatefootball.net",331],["kstatefootball.org",331],["kstatesports.com",331],["kstatewomenshoops.com",331],["kstatewomenshoops.net",331],["kstatewomenshoops.org",331],["ksuathletics.com",331],["ksusports.com",331],["scarletknights.com",331],["showdownforrelief.com",331],["syracusecrunch.com",331],["texastech.com",331],["theacc.com",331],["ukathletics.com",331],["usctrojans.com",331],["utahutes.com",331],["utsports.com",331],["wsucougars.com",331],["vidlii.com",[331,357]],["tricksplit.io",331],["fangraphs.com",332],["stern.de",333],["geo.de",333],["brigitte.de",333],["schoener-wohnen.de",333],["welt.de",334],["tvspielfilm.de",[335,336,337,338]],["tvtoday.de",[335,336,337,338]],["chip.de",[335,336,337,338]],["focus.de",[335,336,337,338]],["fitforfun.de",[335,336,337,338]],["n-tv.de",339],["player.rtl2.de",340],["planetaminecraft.com",341],["cravesandflames.com",342],["codesnse.com",342],["flyad.vip",342],["lapresse.ca",343],["kolyoom.com",344],["ilovephd.com",344],["negumo.com",345],["games.wkb.jp",[346,347]],["kenshi.fandom.com",349],["hausbau-forum.de",350],["homeairquality.org",350],["call4cloud.nl",350],["fake-it.ws",351],["laksa19.github.io",352],["1shortlink.com",353],["u-s-news.com",354],["luscious.net",355],["makemoneywithurl.com",356],["junkyponk.com",356],["healthfirstweb.com",356],["vocalley.com",356],["yogablogfit.com",356],["howifx.com",356],["en.financerites.com",356],["mythvista.com",356],["livenewsflix.com",356],["cureclues.com",356],["apekite.com",356],["enit.in",356],["iammagnus.com",357],["dailyvideoreports.net",357],["unityassets4free.com",357],["docer.*",358],["resetoff.pl",358],["sexodi.com",358],["cdn77.org",359],["momxxxsex.com",360],["penisbuyutucum.net",360],["ujszo.com",361],["newsmax.com",362],["nadidetarifler.com",363],["siz.tv",363],["suzylu.co.uk",[364,365]],["onworks.net",366],["yabiladi.com",366],["downloadsoft.net",367],["newsobserver.com",368],["arkadiumhosted.com",368],["testlanguages.com",369],["newsinlevels.com",369],["videosinlevels.com",369],["procinehub.com",370],["bookmystrip.com",370],["imagereviser.com",371],["pubgaimassist.com",372],["gyanitheme.com",372],["tech.trendingword.com",372],["blog.potterworld.co",372],["hipsonyc.com",372],["tech.pubghighdamage.com",372],["blog.itijobalert.in",372],["techkhulasha.com",372],["jiocinema.com",372],["rapid-cloud.co",372],["uploadmall.com",372],["4funbox.com",373],["nephobox.com",373],["1024tera.com",373],["terabox.*",373],["starkroboticsfrc.com",374],["sinonimos.de",374],["antonimos.de",374],["quesignifi.ca",374],["tiktokrealtime.com",374],["tiktokcounter.net",374],["tpayr.xyz",374],["poqzn.xyz",374],["ashrfd.xyz",374],["rezsx.xyz",374],["tryzt.xyz",374],["ashrff.xyz",374],["rezst.xyz",374],["dawenet.com",374],["erzar.xyz",374],["waezm.xyz",374],["waezg.xyz",374],["blackwoodacademy.org",374],["cryptednews.space",374],["vivuq.com",374],["swgop.com",374],["vbnmll.com",374],["telcoinfo.online",374],["dshytb.com",374],["btcbitco.in",[374,375]],["btcsatoshi.net",374],["cempakajaya.com",374],["crypto4yu.com",374],["readbitcoin.org",374],["wiour.com",374],["finish.addurl.biz",374],["aiimgvlog.fun",[374,378]],["laweducationinfo.com",374],["savemoneyinfo.com",374],["worldaffairinfo.com",374],["godstoryinfo.com",374],["successstoryinfo.com",374],["cxissuegk.com",374],["learnmarketinfo.com",374],["bhugolinfo.com",374],["armypowerinfo.com",374],["rsgamer.app",374],["phonereviewinfo.com",374],["makeincomeinfo.com",374],["gknutshell.com",374],["vichitrainfo.com",374],["workproductivityinfo.com",374],["dopomininfo.com",374],["hostingdetailer.com",374],["fitnesssguide.com",374],["tradingfact4u.com",374],["cryptofactss.com",374],["softwaredetail.com",374],["artoffocas.com",374],["insurancesfact.com",374],["travellingdetail.com",374],["advertisingexcel.com",374],["allcryptoz.net",374],["batmanfactor.com",374],["beautifulfashionnailart.com",374],["crewbase.net",374],["documentaryplanet.xyz",374],["crewus.net",374],["gametechreviewer.com",374],["midebalonu.net",374],["misterio.ro",374],["phineypet.com",374],["seory.xyz",374],["shinbhu.net",374],["shinchu.net",374],["substitutefor.com",374],["talkforfitness.com",374],["thefitbrit.co.uk",374],["thumb8.net",374],["thumb9.net",374],["topcryptoz.net",374],["uniqueten.net",374],["ultraten.net",374],["exactpay.online",374],["quins.us",374],["kiddyearner.com",374],["bildirim.*",377],["arahdrive.com",378],["appsbull.com",379],["diudemy.com",379],["maqal360.com",[379,380,381]],["lifesurance.info",382],["akcartoons.in",383],["cybercityhelp.in",383],["dl.apkmoddone.com",384],["phongroblox.com",384],["fuckingfast.net",385],["buzzheavier.com",385],["tickhosting.com",386],["in91vip.win",387],["datavaults.co",388],["t-online.de",390],["upornia.*",[391,392]],["bobs-tube.com",393],["pornohirsch.net",394],["bembed.net",395],["embedv.net",395],["javguard.club",395],["listeamed.net",395],["v6embed.xyz",395],["vembed.*",395],["vid-guard.com",395],["vinomo.xyz",395],["nekolink.site",[396,397]],["141jav.com",398],["141tube.com",398],["aagmaal.com",398],["camcam.cc",398],["javneon.tv",398],["javsaga.ninja",398],["pixsera.net",399],["jnews5.com",400],["pc-builds.com",401],["reuters.com",401],["today.com",401],["videogamer.com",401],["wrestlinginc.com",401],["azcentral.com",402],["greenbaypressgazette.com",402],["palmbeachpost.com",402],["usatoday.com",[402,403]],["ydr.com",402],["247sports.com",404],["indiatimes.com",405],["netzwelt.de",406],["filmibeat.com",407],["goodreturns.in",407],["mykhel.com",407],["daemonanime.net",407],["luckydice.net",407],["weatherwx.com",407],["sattaguess.com",407],["winshell.de",407],["rosasidan.ws",407],["upiapi.in",407],["networkhint.com",407],["thichcode.net",407],["texturecan.com",407],["tikmate.app",[407,612]],["arcaxbydz.id",407],["quotesshine.com",407],["arcade.buzzrtv.com",408],["arcade.dailygazette.com",408],["arcade.lemonde.fr",408],["arena.gamesforthebrain.com",408],["bestpuzzlesandgames.com",408],["cointiply.arkadiumarena.com",408],["gamelab.com",408],["games.abqjournal.com",408],["games.amny.com",408],["games.bellinghamherald.com",408],["games.besthealthmag.ca",408],["games.bnd.com",408],["games.boston.com",408],["games.bostonglobe.com",408],["games.bradenton.com",408],["games.centredaily.com",408],["games.charlottegames.cnhinews.com",408],["games.crosswordgiant.com",408],["games.dailymail.co.uk",408],["games.dallasnews.com",408],["games.daytondailynews.com",408],["games.denverpost.com",408],["games.everythingzoomer.com",408],["games.fresnobee.com",408],["games.gameshownetwork.com",408],["games.get.tv",408],["games.greatergood.com",408],["games.heraldonline.com",408],["games.heraldsun.com",408],["games.idahostatesman.com",408],["games.insp.com",408],["games.islandpacket.com",408],["games.journal-news.com",408],["games.kansas.com",408],["games.kansascity.com",408],["games.kentucky.com",408],["games.lancasteronline.com",408],["games.ledger-enquirer.com",408],["games.macon.com",408],["games.mashable.com",408],["games.mercedsunstar.com",408],["games.metro.us",408],["games.metv.com",408],["games.miamiherald.com",408],["games.modbee.com",408],["games.moviestvnetwork.com",408],["games.myrtlebeachonline.com",408],["games.games.newsgames.parade.com",408],["games.pressdemocrat.com",408],["games.puzzlebaron.com",408],["games.puzzler.com",408],["games.puzzles.ca",408],["games.qns.com",408],["games.readersdigest.ca",408],["games.sacbee.com",408],["games.sanluisobispo.com",408],["games.sixtyandme.com",408],["games.sltrib.com",408],["games.springfieldnewssun.com",408],["games.star-telegram.com",408],["games.startribune.com",408],["games.sunherald.com",408],["games.theadvocate.com",408],["games.thenewstribune.com",408],["games.theolympian.com",408],["games.theportugalnews.com",408],["games.thestar.com",408],["games.thestate.com",408],["games.tri-cityherald.com",408],["games.triviatoday.com",408],["games.usnews.com",408],["games.word.tips",408],["games.wordgenius.com",408],["games.wtop.com",408],["jeux.meteocity.com",408],["juegos.as.com",408],["juegos.elnuevoherald.com",408],["juegos.elpais.com",408],["philly.arkadiumarena.com",408],["play.dictionary.com",408],["puzzles.bestforpuzzles.com",408],["puzzles.centralmaine.com",408],["puzzles.crosswordsolver.org",408],["puzzles.independent.co.uk",408],["puzzles.nola.com",408],["puzzles.pressherald.com",408],["puzzles.standard.co.uk",408],["puzzles.sunjournal.com",408],["arkadium.com",409],["abysscdn.com",[410,411]],["turtleviplay.xyz",412],["lared.cl",413],["atozmath.com",[413,436,437,438,439,440,441]],["play.mercadolibre.com.ar",414],["hdfilmizlesen.com",415],["arcai.com",416],["my-code4you.blogspot.com",417],["flickr.com",418],["firefile.cc",419],["pestleanalysis.com",419],["kochamjp.pl",419],["tutorialforlinux.com",419],["whatsaero.com",419],["animeblkom.net",[419,433]],["blkom.com",419],["globes.co.il",[420,421]],["jardiner-malin.fr",422],["tw-calc.net",423],["ohmybrush.com",424],["talkceltic.net",425],["mentalfloss.com",426],["uprafa.com",427],["cube365.net",428],["wwwfotografgotlin.blogspot.com",429],["freelistenonline.com",429],["badassdownloader.com",430],["quickporn.net",431],["yellowbridge.com",432],["aosmark.com",434],["ctrlv.*",435],["newyorker.com",442],["brighteon.com",[443,444]],["more.tv",445],["video1tube.com",446],["alohatube.xyz",446],["4players.de",447],["onlinesoccermanager.com",447],["fshost.me",448],["link.cgtips.org",449],["hentaicloud.com",450],["paperzonevn.com",452],["9jarock.org",453],["fzmovies.info",453],["fztvseries.ng",453],["netnaijas.com",453],["hentaienglish.com",454],["hentaiporno.xxx",454],["venge.io",[455,456]],["its.porn",[457,458]],["atv.at",459],["2ndrun.tv",460],["rackusreads.com",460],["teachmemicro.com",460],["willcycle.com",460],["kusonime.com",[461,462]],["123movieshd.*",463],["imgur.com",[464,465,734]],["hentai-party.com",466],["hentaicomics.pro",466],["uproxy.*",467],["animesa.*",468],["subtitleone.cc",469],["mysexgames.com",470],["ancient-origins.*",471],["cinecalidad.*",[472,473]],["xnxx.com",474],["xvideos.*",474],["gdr-online.com",475],["mmm.dk",476],["iqiyi.com",[477,478,602]],["m.iqiyi.com",479],["nbcolympics.com",480],["apkhex.com",481],["indiansexstories2.net",482],["issstories.xyz",482],["1340kbbr.com",483],["gorgeradio.com",483],["kduk.com",483],["kedoam.com",483],["kejoam.com",483],["kelaam.com",483],["khsn1230.com",483],["kjmx.rocks",483],["kloo.com",483],["klooam.com",483],["klykradio.com",483],["kmed.com",483],["kmnt.com",483],["kpnw.com",483],["kppk983.com",483],["krktcountry.com",483],["ktee.com",483],["kwro.com",483],["kxbxfm.com",483],["thevalley.fm",483],["quizlet.com",484],["dsocker1234.blogspot.com",485],["schoolcheats.net",[486,487]],["mgnet.xyz",488],["designtagebuch.de",489],["pixroute.com",490],["uploady.io",491],["calculator-online.net",492],["porngames.club",493],["sexgames.xxx",493],["111.90.159.132",494],["mobile-tracker-free.com",495],["pfps.gg",496],["social-unlock.com",497],["superpsx.com",498],["ninja.io",499],["sourceforge.net",500],["samfirms.com",501],["rapelust.com",502],["vtube.to",502],["desitelugusex.com",502],["dvdplay.*",502],["xvideos-downloader.net",502],["xxxvideotube.net",502],["sdefx.cloud",502],["nozomi.la",502],["banned.video",503],["madmaxworld.tv",503],["androidpolice.com",503],["babygaga.com",503],["backyardboss.net",503],["carbuzz.com",503],["cbr.com",503],["collider.com",503],["dualshockers.com",503],["footballfancast.com",503],["footballleagueworld.co.uk",503],["gamerant.com",503],["givemesport.com",503],["hardcoregamer.com",503],["hotcars.com",503],["howtogeek.com",503],["makeuseof.com",503],["moms.com",503],["movieweb.com",503],["pocket-lint.com",503],["pocketnow.com",503],["screenrant.com",503],["simpleflying.com",503],["thegamer.com",503],["therichest.com",503],["thesportster.com",503],["thethings.com",503],["thetravel.com",503],["topspeed.com",503],["xda-developers.com",503],["huffpost.com",504],["ingles.com",505],["spanishdict.com",505],["surfline.com",[506,507]],["play.tv3.ee",508],["play.tv3.lt",508],["play.tv3.lv",[508,509]],["tv3play.skaties.lv",508],["bulbagarden.net",510],["hollywoodlife.com",511],["mat6tube.com",512],["hotabis.com",513],["root-nation.com",513],["italpress.com",513],["airsoftmilsimnews.com",513],["artribune.com",513],["newtumbl.com",514],["apkmaven.*",515],["aruble.net",516],["nevcoins.club",517],["mail.com",518],["gmx.*",519],["mangakita.id",521],["avpgalaxy.net",522],["panda-novel.com",523],["lightsnovel.com",523],["eaglesnovel.com",523],["pandasnovel.com",523],["ewrc-results.com",524],["kizi.com",525],["cyberscoop.com",526],["fedscoop.com",526],["jeep-cj.com",527],["sponsorhunter.com",528],["cloudcomputingtopics.net",529],["likecs.com",530],["tiscali.it",531],["linkspy.cc",532],["adshnk.com",533],["chattanoogan.com",534],["adsy.pw",535],["playstore.pw",535],["windowspro.de",536],["tvtv.ca",537],["tvtv.us",537],["mydaddy.cc",538],["roadtrippin.fr",539],["vavada5com.com",540],["anyporn.com",[541,558]],["bravoporn.com",541],["bravoteens.com",541],["crocotube.com",541],["hellmoms.com",541],["hellporno.com",541],["sex3.com",541],["tubewolf.com",541],["xbabe.com",541],["xcum.com",541],["zedporn.com",541],["imagetotext.info",542],["infokik.com",543],["freepik.com",544],["ddwloclawek.pl",[545,546]],["www.seznam.cz",547],["deezer.com",548],["my-subs.co",549],["plaion.com",550],["slideshare.net",[551,552]],["ustreasuryyieldcurve.com",553],["businesssoftwarehere.com",554],["goo.st",554],["freevpshere.com",554],["softwaresolutionshere.com",554],["gamereactor.*",556],["madoohd.com",557],["doomovie-hd.*",557],["staige.tv",559],["androidadult.com",560],["streamvid.net",561],["watchtv24.com",562],["cellmapper.net",563],["medscape.com",564],["newscon.org",[565,566]],["wheelofgold.com",567],["drakecomic.*",567],["app.blubank.com",568],["mobileweb.bankmellat.ir",568],["ccthesims.com",575],["chromeready.com",575],["dtbps3games.com",575],["illustratemagazine.com",575],["uknip.co.uk",575],["vod.pl",576],["megadrive-emulator.com",577],["tvhay.*",[578,579]],["moviesapi.club",580],["watchx.top",580],["digimanie.cz",581],["svethardware.cz",581],["srvy.ninja",582],["chat.tchatche.com",[583,584]],["cnn.com",[585,586,587]],["news.bg",588],["edmdls.com",589],["freshremix.net",589],["scenedl.org",589],["trakt.tv",590],["client.falixnodes.net",[591,592]],["shroomers.app",593],["classicalradio.com",594],["di.fm",594],["jazzradio.com",594],["radiotunes.com",594],["rockradio.com",594],["zenradio.com",594],["getthit.com",595],["techedubyte.com",596],["iwanttfc.com",597],["nutraingredients-asia.com",598],["nutraingredients-latam.com",598],["nutraingredients-usa.com",598],["nutraingredients.com",598],["ozulscansen.com",599],["nexusmods.com",600],["lookmovie.*",601],["lookmovie2.to",601],["biletomat.pl",603],["hextank.io",[604,605]],["filmizlehdfilm.com",[606,607,608,609]],["filmizletv.*",[606,607,608,609]],["fullfilmizle.cc",[606,607,608,609]],["gofilmizle.net",[606,607,608,609]],["cimanow.cc",610],["bgmiupdate.com.in",610],["freex2line.online",611],["btvplus.bg",613],["sagewater.com",614],["redlion.net",614],["filmweb.pl",615],["satdl.com",616],["vidstreaming.xyz",617],["everand.com",618],["myradioonline.pl",619],["cbs.com",620],["paramountplus.com",620],["colourxh.site",621],["fullxh.com",621],["galleryxh.site",621],["megaxh.com",621],["movingxh.world",621],["seexh.com",621],["unlockxh4.com",621],["valuexh.life",621],["xhaccess.com",621],["xhadult2.com",621],["xhadult3.com",621],["xhadult4.com",621],["xhadult5.com",621],["xhamster.*",621],["xhamster1.*",621],["xhamster10.*",621],["xhamster11.*",621],["xhamster12.*",621],["xhamster13.*",621],["xhamster14.*",621],["xhamster15.*",621],["xhamster16.*",621],["xhamster17.*",621],["xhamster18.*",621],["xhamster19.*",621],["xhamster20.*",621],["xhamster2.*",621],["xhamster3.*",621],["xhamster4.*",621],["xhamster42.*",621],["xhamster46.com",621],["xhamster5.*",621],["xhamster7.*",621],["xhamster8.*",621],["xhamsterporno.mx",621],["xhbig.com",621],["xhbranch5.com",621],["xhchannel.com",621],["xhdate.world",621],["xhlease.world",621],["xhmoon5.com",621],["xhofficial.com",621],["xhopen.com",621],["xhplanet1.com",621],["xhplanet2.com",621],["xhreal2.com",621],["xhreal3.com",621],["xhspot.com",621],["xhtotal.com",621],["xhtree.com",621],["xhvictory.com",621],["xhwebsite.com",621],["xhwebsite2.com",621],["xhwebsite5.com",621],["xhwide1.com",621],["xhwide2.com",621],["xhwide5.com",621],["file-upload.net",623],["acortalo.*",[625,626,627,628]],["acortar.*",[625,626,627,628]],["hentaihaven.xxx",629],["jacquieetmicheltv2.net",631],["a2zapk.*",632],["fcportables.com",[633,634]],["emurom.net",635],["freethesaurus.com",[636,637]],["thefreedictionary.com",[636,637]],["oeffentlicher-dienst.info",638],["im9.eu",[639,640]],["dcdlplayer8a06f4.xyz",641],["ultimate-guitar.com",642],["claimbits.net",643],["sexyscope.net",644],["kickassanime.*",645],["recherche-ebook.fr",646],["virtualdinerbot.com",646],["zonebourse.com",647],["pink-sluts.net",648],["andhrafriends.com",649],["benzinpreis.de",650],["defenseone.com",651],["govexec.com",651],["nextgov.com",651],["route-fifty.com",651],["sharing.wtf",652],["wetter3.de",653],["esportivos.fun",654],["cosmonova-broadcast.tv",655],["538.nl",656],["hartvannederland.nl",656],["kijk.nl",656],["shownieuws.nl",656],["vandaaginside.nl",656],["rock.porn",[657,658]],["videzz.net",[659,660]],["ezaudiobookforsoul.com",661],["club386.com",662],["decompiler.com",[663,664]],["littlebigsnake.com",665],["easyfun.gg",666],["smailpro.com",667],["ilgazzettino.it",668],["ilmessaggero.it",668],["3bmeteo.com",[669,670]],["mconverter.eu",671],["lover937.net",672],["10gb.vn",673],["pes6.es",674],["tactics.tools",[675,676]],["boundhub.com",677],["reliabletv.me",678],["jakondo.ru",679],["trueachievements.com",679],["truesteamachievements.com",679],["truetrophies.com",679],["filecrypt.*",680],["wired.com",682],["spankbang.*",[683,684,685,738,739]],["hulu.com",[686,687,688]],["hanime.tv",689],["nhentai.net",[690,691,692]],["pouvideo.*",693],["povvideo.*",693],["povw1deo.*",693],["povwideo.*",693],["powv1deo.*",693],["powvibeo.*",693],["powvideo.*",693],["powvldeo.*",693],["powcloud.org",694],["primevideo.com",695],["read.amazon.*",[695,712]],["anonymfile.com",696],["gofile.to",696],["dotycat.com",697],["rateyourmusic.com",698],["reporterpb.com.br",699],["blog-dnz.com",701],["18adultgames.com",702],["colnect.com",[703,704]],["adultgamesworld.com",705],["servustv.com",[706,707]],["reviewdiv.com",708],["parametric-architecture.com",709],["laurelberninteriors.com",[710,741]],["voiceofdenton.com",711],["concealednation.org",711],["askattest.com",713],["opensubtitles.com",714],["savefiles.com",715],["streamup.ws",716],["goodstream.one",717],["lecrabeinfo.net",718],["cerberusapp.com",719],["smashkarts.io",720],["beamng.wesupply.cx",721],["wowtv.de",[722,723]],["jsfiddle.net",[724,725]],["musicbusinessworldwide.com",726],["mahfda.com",727],["agar.live",728],["www.google.*",729],["tacobell.com",730],["zefoy.com",731],["cnet.com",732],["trendyol.com",[735,736]],["natgeotv.com",737],["globo.com",740],["linklog.tiagorangel.com",742],["wayfair.com",743]]);
const exceptionsMap = new Map([["cloudflare.com",[0]],["pingit.com",[178]],["loan.bgmi32bitapk.in",[298]],["lookmovie.studio",[601]]]);
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
