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
const argsList = [["console.clear","undefined"],["aclib.runInPagePush","{}","as","callback"],["aclib.runBanner","{}","as","function"],["aclib.runPop","throwFunc"],["aclib.runInterstitial","{}","as","function"],["aclib.runAutoTag","noopFunc"],["adBlockDetected","undefined"],["akamaiDisableServerIpLookup","noopFunc"],["DD_RUM.addAction","noopFunc"],["nads.createAd","trueFunc"],["dvtag.getTargeting","trueFunc"],["ga","noopFunc"],["huecosPBS.nstdX","null"],["DTM.trackAsyncPV","noopFunc"],["_satellite","{}"],["_satellite.getVisitorId","noopFunc"],["newPageViewSpeedtest","noopFunc"],["pubg.unload","noopFunc"],["generateGalleryAd","noopFunc"],["mediator","noopFunc"],["Object.prototype.subscribe","noopFunc"],["gbTracker","{}"],["gbTracker.sendAutoSearchEvent","noopFunc"],["Object.prototype.vjsPlayer.ads","noopFunc"],["network_user_id",""],["google.ima.OmidVerificationVendor","{}"],["Object.prototype.omidAccessModeRules","{}"],["googletag.cmd","{}"],["_aps","{}"],["Object.prototype.setDisableFlashAds","noopFunc"],["DD_RUM.addTiming","noopFunc"],["chameleonVideo.adDisabledRequested","true"],["AdmostClient","{}"],["analytics","{}"],["datalayer","[]"],["Object.prototype.isInitialLoadDisabled","noopFunc"],["listingGoogleEETracking","noopFunc"],["dcsMultiTrack","noopFunc"],["urlStrArray","noopFunc"],["pa","{}"],["Object.prototype.setConfigurations","noopFunc"],["Object.prototype.bk_addPageCtx","noopFunc"],["Object.prototype.bk_doJSTag","noopFunc"],["passFingerPrint","noopFunc"],["optimizely","{}"],["optimizely.initialized","true"],["google_optimize","{}"],["google_optimize.get","noopFunc"],["_gsq","{}"],["_gsq.push","noopFunc"],["stmCustomEvent","noopFunc"],["_gsDevice",""],["iom","{}"],["iom.c","noopFunc"],["_conv_q","{}"],["_conv_q.push","noopFunc"],["google.ima.settings.setDisableFlashAds","noopFunc"],["pa.privacy","{}"],["populateClientData4RBA","noopFunc"],["YT.ImaManager","noopFunc"],["UOLPD","{}"],["UOLPD.dataLayer","{}"],["__configuredDFPTags","{}"],["URL_VAST_YOUTUBE","{}"],["Adman","{}"],["dplus","{}"],["dplus.track","noopFunc"],["_satellite.track","noopFunc"],["google.ima.dai","{}"],["gfkS2sExtension","{}"],["gfkS2sExtension.HTML5VODExtension","noopFunc"],["AnalyticsEventTrackingJS","{}"],["AnalyticsEventTrackingJS.addToBasket","noopFunc"],["AnalyticsEventTrackingJS.trackErrorMessage","noopFunc"],["initializeslideshow","noopFunc"],["fathom","{}"],["fathom.trackGoal","noopFunc"],["Origami","{}"],["Origami.fastclick","noopFunc"],["jad","undefined"],["hasAdblocker","true"],["Sentry","{}"],["Sentry.init","noopFunc"],["TRC","{}"],["TRC._taboolaClone","[]"],["fp","{}"],["fp.t","noopFunc"],["fp.s","noopFunc"],["initializeNewRelic","noopFunc"],["turnerAnalyticsObj","{}"],["turnerAnalyticsObj.setVideoObject4AnalyticsProperty","noopFunc"],["optimizelyDatafile","{}"],["optimizelyDatafile.featureFlags","[]"],["fingerprint","{}"],["fingerprint.getCookie","noopFunc"],["gform.utils","noopFunc"],["gform.utils.trigger","noopFunc"],["get_fingerprint","noopFunc"],["moatPrebidApi","{}"],["moatPrebidApi.getMoatTargetingForPage","noopFunc"],["cpd_configdata","{}"],["cpd_configdata.url",""],["yieldlove_cmd","{}"],["yieldlove_cmd.push","noopFunc"],["dataLayer.push","noopFunc"],["_etmc","{}"],["_etmc.push","noopFunc"],["freshpaint","{}"],["freshpaint.track","noopFunc"],["ShowRewards","noopFunc"],["stLight","{}"],["stLight.options","noopFunc"],["DD_RUM.addError","noopFunc"],["sensorsDataAnalytic201505","{}"],["sensorsDataAnalytic201505.init","noopFunc"],["sensorsDataAnalytic201505.quick","noopFunc"],["sensorsDataAnalytic201505.track","noopFunc"],["s","{}"],["s.tl","noopFunc"],["smartech","noopFunc"],["sensors","{}"],["sensors.init","noopFunc"],["sensors.track","noopFunc"],["adn","{}"],["adn.clearDivs","noopFunc"],["_vwo_code","{}"],["gtag","noopFunc"],["_taboola","{}"],["_taboola.push","noopFunc"],["clicky","{}"],["clicky.goal","noopFunc"],["WURFL","{}"],["_sp_.config.events.onSPPMObjectReady","noopFunc"],["gtm","{}"],["gtm.trackEvent","noopFunc"],["mParticle.Identity.getCurrentUser","noopFunc"],["JSGlobals.prebidEnabled","false"],["elasticApm","{}"],["elasticApm.init","noopFunc"],["ga.sendGaEvent","noopFunc"],["adobe","{}"],["MT","{}"],["MT.track","noopFunc"],["ClickOmniPartner","noopFunc"],["adex","{}"],["adex.getAdexUser","noopFunc"],["Adkit","noopFunc"],["Object.prototype.shouldExpectGoogleCMP","false"],["apntag.refresh","noopFunc"],["pa.sendEvent","noopFunc"],["Munchkin","{}"],["Munchkin.init","noopFunc"],["ttd_dom_ready","noopFunc"],["ramp","undefined"],["appInfo.snowplow.trackSelfDescribingEvent","noopFunc"],["_vwo_code.init","noopFunc"],["adobePageView","noopFunc"],["dapTracker","{}"],["dapTracker.track","noopFunc"],["ytInitialPlayerResponse.playerAds","undefined"],["ytInitialPlayerResponse.adPlacements","undefined"],["ytInitialPlayerResponse.adSlots","undefined"],["playerResponse.adPlacements","undefined"],["nsShowMaxCount","0"],["objVc.interstitial_web",""],["_ml_ads_ns","null"],["_sp_.config","undefined"],["isAdBlockActive","false"],["AdController","noopFunc"],["console.clear","noopFunc"],["Object.prototype.hideAds","true"],["Object.prototype._getSalesHouseConfigurations","noopFunc"],["vast_urls","{}"],["sadbl","false"],["adblockcheck","false"],["arrvast","[]"],["blurred","false"],["flashvars.adv_pre_src",""],["showPopunder","false"],["page_params.holiday_promo","true"],["adsEnabled","true"],["String.prototype.charAt","trueFunc"],["ad_blocker","false"],["blockAdBlock","true"],["VikiPlayer.prototype.pingAbFactor","noopFunc"],["player.options.disableAds","true"],["console.clear","trueFunc"],["flashvars.adv_pre_vast",""],["flashvars.adv_pre_vast_alt",""],["x_width","1"],["_site_ads_ns","true"],["luxuretv.config",""],["Object.prototype.AdOverlay","noopFunc"],["tkn_popunder","null"],["can_run_ads","true"],["adsBlockerDetector","noopFunc"],["globalThis","null"],["adblock","false"],["__ads","true"],["FlixPop.isPopGloballyEnabled","falseFunc"],["check_adblock","true"],["$.magnificPopup.open","noopFunc"],["adsenseadBlock","noopFunc"],["adblockSuspected","false"],["xRds","true"],["cRAds","false"],["disasterpingu","false"],["App.views.adsView.adblock","false"],["flashvars.adv_pause_html",""],["$.fx.off","true"],["adBlockEnabled","false"],["puShown","true"],["showAds","true"],["attr","{}"],["scriptSrc",""],["cxStartDetectionProcess","noopFunc"],["isAdBlocked","false"],["adblock","noopFunc"],["path",""],["_ctrl_vt.blocked.ad_script","false"],["blockAdBlock","noopFunc"],["caca","noopFunc"],["Ok","true"],["safelink.adblock","false"],["openPopunder","noopFunc"],["ClickUnder","noopFunc"],["flashvars.adv_pre_url",""],["flashvars.protect_block",""],["flashvars.video_click_url",""],["adBlock","false"],["spoof","noopFunc"],["btoa","null"],["sp_ad","true"],["adsBlocked","false"],["_sp_.msg.displayMessage","noopFunc"],["CaptchmeState.adb","undefined"],["UhasAB","false"],["adNotificationDetected","false"],["atob","noopFunc"],["_pop","noopFunc"],["CnnXt.Event.fire","noopFunc"],["_ti_update_user","noopFunc"],["valid","1"],["vastAds","[]"],["adblock","1"],["frg","1"],["time","0"],["ads","true"],["GNCA_Ad_Support","true"],["Date.now","noopFunc"],["jQuery.adblock","1"],["VMG.Components.Adblock","false"],["adblockDetector","trueFunc"],["hasPoped","true"],["flashvars.video_click_url","undefined"],["flashvars.adv_start_html",""],["flashvars.popunder_url",""],["flashvars.adv_post_src",""],["flashvars.adv_post_url",""],["jQuery.adblock","false"],["google_jobrunner","true"],["sec","0"],["gadb","false"],["checkadBlock","noopFunc"],["clientSide.adbDetect","noopFunc"],["HTMLAnchorElement.prototype.click","noopFunc"],["cmnnrunads","true"],["adBlocker","false"],["adBlockDetected","noopFunc"],["StileApp.somecontrols.adBlockDetected","noopFunc"],["MDCore.adblock","0"],["google_tag_data","noopFunc"],["noAdBlock","true"],["adsOk","true"],["check","true"],["isal","true"],["document.hidden","true"],["awm","true"],["adblockEnabled","false"],["is_adblocked","false"],["pogo.intermission.staticAdIntermissionPeriod","0"],["SubmitDownload1","noopFunc"],["t","0"],["ckaduMobilePop","noopFunc"],["tieneAdblock","0"],["adsAreBlocked","false"],["cmgpbjs","false"],["displayAdblockOverlay","false"],["google","false"],["Math.pow","noopFunc"],["openInNewTab","noopFunc"],["runAdBlocker","false"],["Adblock","false"],["flashvars.logo_url",""],["flashvars.logo_text",""],["nlf.custom.userCapabilities","false"],["count","0"],["LoadThisScript","true"],["showPremLite","true"],["closeBlockerModal","false"],["adBlockDetector.isEnabled","falseFunc"],["areAdsDisplayed","true"],["gkAdsWerbung","true"],["pop_target","null"],["is_banner","true"],["$easyadvtblock","false"],["show_dfp_preroll","false"],["show_youtube_preroll","false"],["doads","true"],["jsUnda","noopFunc"],["AlobaidiDetectAdBlock","true"],["Advertisement","1"],["adBlockDetected","false"],["abp1","1"],["pr_okvalida","true"],["$.ajax","trueFunc"],["cnbc.canShowAds","true"],["ue_adb_chk","1"],["firefaucet","true"],["cRAds","true"],["uas","[]"],["flashvars.popunder_url","undefined"],["adv","true"],["prerollMain","undefined"],["canRunAds","true"],["Fingerprint2","true"],["dclm_ajax_var.disclaimer_redirect_url",""],["load_pop_power","noopFunc"],["adBlockDetected","true"],["Time_Start","0"],["blockAdBlock","trueFunc"],["ezstandalone.enabled","true"],["foundation.adPlayer.bitmovin","{}"],["weltConfig.switches.videoAdBlockBlocker","false"],["DL8_GLOBALS.enableAdSupport","false"],["DL8_GLOBALS.useHomad","false"],["DL8_GLOBALS.enableHomadDesktop","false"],["DL8_GLOBALS.enableHomadMobile","false"],["Object.prototype.adReinsertion","noopFunc"],["getHomadConfig","noopFunc"],["ab","false"],["go_popup","{}"],["noBlocker","true"],["adsbygoogle","null"],["fabActive","false"],["gWkbAdVert","true"],["noblock","true"],["wgAffiliateEnabled","false"],["ads","null"],["detectAdblock","noopFunc"],["adsLoadable","true"],["ASSetCookieAds","null"],["letShowAds","true"],["ulp_noadb","true"],["Object.prototype.adblock_detected","false"],["timeSec","0"],["adsbygoogle.loaded","true"],["ads_unblocked","true"],["xxSetting.adBlockerDetection","false"],["open","undefined"],["Drupal.behaviors.adBlockerPopup","null"],["fake_ad","true"],["koddostu_com_adblock_yok","null"],["adsbygoogle","trueFunc"],["player.ads.cuePoints","undefined"],["adBlockDetected","null"],["better_ads_adblock","1"],["Adv_ab","false"],["sgpbCanRunAds","true"],["document.hidden","false"],["hasFocus","trueFunc"],["navigator.brave","undefined"],["Object.prototype.isAllAdClose","true"],["document.hasFocus","trueFunc"],["isRequestPresent","true"],["fouty","true"],["Notification","undefined"],["protection","noopFunc"],["private","false"],["navigator.webkitTemporaryStorage.queryUsageAndQuota","noopFunc"],["document.onkeydown","noopFunc"],["showadas","true"],["alert","throwFunc"],["aSl.gcd","0"],["window.adLink","null"],["detectedAdblock","undefined"],["isTabActive","true"],["clicked","2"],["ov.advertising.tisoomi.loadScript","noopFunc"],["abp","false"],["hommy","{}"],["hommy.waitUntil","noopFunc"],["flashvars.mlogo",""],["vpPrerollVideo","undefined"],["PlayerConfig.config.CustomAdSetting","[]"],["PlayerConfig.trusted","true"],["PlayerConfig.config.AffiliateAdViewLevel","3"],["univresalP","noopFunc"],["hold_click","false"],["tie.ad_blocker_detector","false"],["admiral","noopFunc"],["gnt.x.uam"],["gnt.u.z","true"],["__INITIAL_DATA__.siteData.admiralScript"],["objAd.loadAdShield","noopFunc"],["window.myAd.runAd","noopFunc"],["detectAdBlock","noopFunc"],["__INITIAL_STATE__.config.theme.ads.isAdBlockerEnabled","false"],["__INITIAL_STATE__.gameLists.gamesNoPrerollIds.indexOf","trueFunc"],["document.ontouchend","null"],["document.onclick","null"],["playID","1"],["googletag._loaded_","true"],["app._data.ads","[]"],["pubAdsService","trueFunc"],["config.pauseInspect","false"],["appContext.adManager.context.current.adFriendly","false"],["blockAdBlock._options.baitClass","null"],["document.blocked_var","1"],["____ads_js_blocked","false"],["wIsAdBlocked","false"],["WebSite.plsDisableAdBlock","null"],["ads_blocked","false"],["samDetected","false"],["countClicks","0"],["settings.adBlockerDetection","false"],["mixpanel.get_distinct_id","true"],["fuckAdBlock._options.baitClass","null"],["bscheck.adblocker","noopFunc"],["qpcheck.ads","noopFunc"],["isContentBlocked","falseFunc"],["CloudflareApps.installs.Ik7rmQ4t95Qk.options.measureDomain","undefined"],["detectAB1","noopFunc"],["uBlockOriginDetected","false"],["googletag._vars_","{}"],["googletag._loadStarted_","true"],["google_unique_id","1"],["google.javascript","{}"],["google.javascript.ads","{}"],["google_global_correlator","1"],["paywallGateway.truncateContent","noopFunc"],["adBlockDisabled","true"],["__NEXT_DATA__.props.pageProps.adVideo","undefined"],["blockedElement","noopFunc"],["popit","false"],["adBlockerDetected","false"],["abu","falseFunc"],["countdown","0"],["decodeURI","noopFunc"],["flashvars.adv_postpause_vast",""],["xv_ad_block","0"],["openWindow","noopFunc"],["vidorev_jav_plugin_video_ads_object.vid_ads_m_video_ads",""],["adsProvider.init","noopFunc"],["SDKLoaded","true"],["blockAdBlock._creatBait","null"],["POPUNDER_ENABLED","false"],["plugins.preroll","noopFunc"],["errcode","0"],["DHAntiAdBlocker","true"],["showada","true"],["showax","true"],["p18","undefined"],["ADBLOCKED","false"],["Object.prototype.adsEnabled","false"],["adb","0"],["String.fromCharCode","trueFunc"],["adblock_use","false"],["Object.prototype.adblockFound","false"],["createCanvas","noopFunc"],["document.bridCanRunAds","true"],["playerAdSettings.adLink",""],["playerAdSettings.waitTime","0"],["xv.sda.pp.init","noopFunc"],["isAdsLoaded","true"],["adblockerAlert","noopFunc"],["Object.prototype.parseXML","noopFunc"],["Object.prototype.blackscreenDuration","1"],["Object.prototype.adPlayerId",""],["adblockDetect","noopFunc"],["style","noopFunc"],["history.pushState","noopFunc"],["google_unique_id","6"],["__NEXT_DATA__.props.pageProps.adsConfig","undefined"],["new_config.timedown","0"],["truex","{}"],["truex.client","noopFunc"],["hiddenProxyDetected","false"],["SteadyWidgetSettings.adblockActive","false"],["proclayer","noopFunc"],["timeleft","0"],["load_ads","trueFunc"],["starPop","1"],["Object.prototype.ads","noopFunc"],["detectBlockAds","noopFunc"],["ga","trueFunc"],["ad_link",""],["penciBlocksArray","[]"],["App.AdblockDetected","false"],["SF.adblock","true"],["startfrom","0"],["D4zz","noopFunc"],["Object.prototype.ads.nopreroll_","true"],["HP_Scout.adBlocked","false"],["SD_IS_BLOCKING","false"],["Object.prototype.isPremium","true"],["__BACKPLANE_API__.renderOptions.showAdBlock",""],["Object.prototype.isNoAds","{}"],["tv3Cmp.ConsentGiven","true"],["setupSkin","noopFunc"],["Object.prototype.enableInterstitial","false"],["ads","undefined"],["td_ad_background_click_link","undefined"],["POSTPART_prototype.ADKEY","noopFunc"],["adBlockDetected","falseFunc"],["divWidth","1"],["noAdBlock","noopFunc"],["AdService.info.abd","noopFunc"],["adBlockDetectionResult","undefined"],["popped","true"],["puShown1","true"],["passthetest","true"],["pandaAdviewValidate","true"],["canGetAds","true"],["ad_blocker_active","false"],["init_welcome_ad","noopFunc"],["moneyAbovePrivacyByvCDN","true"],["document.body.contains","trueFunc"],["popunder","undefined"],["distance","0"],["document.onclick",""],["adEnable","true"],["displayAds","0"],["_adshrink.skiptime","0"],["AbleToRunAds","true"],["PreRollAd.timeCounter","0"],["abpblocked","undefined"],["paAddUnit","noopFunc"],["adt","0"],["test_adblock","noopFunc"],["adblockDetector","noopFunc"],["vastEnabled","false"],["detectadsbocker","false"],["two_worker_data_js.js","[]"],["FEATURE_DISABLE_ADOBE_POPUP_BY_COUNTRY","true"],["questpassGuard","noopFunc"],["isAdBlockerEnabled","false"],["sssp","emptyObj"],["smartLoaded","true"],["timeLeft","0"],["Cookiebot","noopFunc"],["feature_flags.interstitial_ads_flag","false"],["feature_flags.interstitials_every_four_slides","false"],["waldoSlotIds","true"],["adblockstatus","false"],["adScriptLoaded","true"],["adblockEnabled","noopFunc"],["adSettings","[]"],["banner_is_blocked","false"],["Object.prototype.adBlocked","false"],["chp_adblock_browser","noopFunc"],["googleAd","true"],["Brid.A9.prototype.backfillAdUnits","[]"],["dct","0"],["slideShow.displayInterstitial","true"],["googletag","true"],["tOS2","150"],["checkAdBlocker","noopFunc"],["navigator.standalone","true"],["ShowAdvertising","{}"],["empire.pop","undefined"],["empire.direct","undefined"],["empire.directHideAds","undefined"],["empire.mediaData.advisorMovie","1"],["empire.mediaData.advisorSerie","1"],["setTimer","0"],["penci_adlbock.ad_blocker_detector","0"],["Object.prototype.adblockDetector","noopFunc"],["blext","true"],["vidorev_jav_plugin_video_ads_object","{}"],["vidorev_jav_plugin_video_ads_object_post","{}"],["S_Popup","10"],["rabLimit","-1"],["nudgeAdBlock","noopFunc"],["feedBack.showAffilaePromo","noopFunc"],["FAVE.settings.ads.ssai.prod.clips.enabled","false"],["FAVE.settings.ads.ssai.prod.liveAuth.enabled","false"],["FAVE.settings.ads.ssai.prod.liveUnauth.enabled","false"],["HTMLScriptElement.prototype.onerror","null"],["loadpagecheck","noopFunc"],["art3m1sItemNames.affiliate-wrapper","\"\""],["window.adngin","{}"],["amzn_aps_csm","{}"],["isAdBlockerActive","noopFunc"],["di.app.WebplayerApp.Ads.Adblocks.app.AdBlockDetectApp.startWithParent","false"],["sharedController.adblockDetector","noopFunc"],["checkAdsStatus","noopFunc"],["ads","[]"],["settings.adBlockDetectionEnabled","false"],["displayInterstitialAdConfig","false"],["checkAdBlockeraz","noopFunc"],["blockingAds","false"],["Yii2App.playbackTimeout","0"],["QiyiPlayerProphetData.a.data","{}"],["toggleAdBlockInfo","falseFunc"],["aipAPItag.prerollSkipped","true"],["aipAPItag.setPreRollStatus","trueFunc"],["reklam_1_saniye","0"],["reklam_1_gecsaniye","0"],["reklamsayisi","1"],["reklam_1",""],["HTMLImageElement.prototype.onerror","undefined"],["HTMLImageElement.prototype.onload","undefined"],["powerAPITag","emptyObj"],["playerEnhancedConfig.run","throwFunc"],["aoAdBlockDetected","false"],["rodo.checkIsDidomiConsent","noopFunc"],["xtime","0"],["Div_popup",""],["Scribd.Blob.AdBlockerModal","noopFunc"],["AddAdsV2I.addBlock","false"],["hasAdBlocker","false"],["initials.yld-pdpopunder",""],["download_click","true"],["advertisement3","true"],["clicked","true"],["eClicked","true"],["number","0"],["sync","true"],["PlayerLogic.prototype.detectADB","noopFunc"],["showPopunder","noopFunc"],["Object.prototype.prerollAds","[]"],["notifyMe","noopFunc"],["adsClasses","undefined"],["gsecs","0"],["dvsize","52"],["majorse","true"],["completed","1"],["testerli","false"],["w87.abd","noopFunc"],["w87.dsab","noopFunc"],["document.referrer",""],["Object.prototype.setNeedShowAdblockWarning","noopFunc"],["NoAdBlock","noopFunc"],["adList","[]"],["ifmax","true"],["nitroAds.abp","true"],["onloadUI","noopFunc"],["PageLoader.DetectAb","0"],["one_time","1"],["consentGiven","true"],["GEMG.GPT.Interstitial","noopFunc"],["amiblock","0"],["karte3","18"],["sandDetect","noopFunc"],["amodule.data","emptyArr"],["Object.prototype.ADBLOCK_DETECTION",""],["postroll","undefined"],["interstitial","undefined"],["isAdBlockDetected","false"],["pData.adblockOverlayEnabled","0"],["cabdSettings","undefined"],["td_ad_background_click_link"],["malisx","true"],["alim","true"],["ADS.isBannersEnabled","false"],["EASYFUN_ADS_CAN_RUN","true"],["adsbygoogle_ama_fc_has_run","true"],["jwDefaults.advertising","{}"],["elimina_profilazione","1"],["elimina_pubblicita","1"],["abd","{}"],["checkerimg","noopFunc"],["detectedAdblock","noopFunc"],["Object.prototype.DetectByGoogleAd","noopFunc"],["nitroAds","{}"],["nitroAds.createAd","noopFunc"],["NativeAd","noopFunc"],["Blob","noopFunc"],["window.navigator.brave","undefined"],["HTMLScriptElement.prototype.onerror","undefined"],["isAdblock","false"],["openPop","noopFunc"],["cns.library","true"],["BJSShowUnder","{}"],["BJSShowUnder.bindTo","noopFunc"],["BJSShowUnder.add","noopFunc"],["Object.prototype._parseVAST","noopFunc"],["Object.prototype.createAdBlocker","noopFunc"],["Object.prototype.isAdPeriod","falseFunc"],["ABLK","false"],["_n_app.popunder","null"],["_n_app.options.ads.show_popunders","false"],["N_BetterJsPop.object","{}"],["isAdb","false"],["countDown","0"],["runCheck","noopFunc"],["adsSlotRenderEndSeen","true"],["showModal","noopFunc"],["flashvars.mlogo_link",""],["isAdBlocked","noopFunc"],["URLlist","[]"],["aaw","{}"],["aaw.processAdsOnPage","noopFunc"],["doOpen","undefined"],["OneTrust","{}"],["OneTrust.IsAlertBoxClosed","trueFunc"],["FOXIZ_MAIN_SCRIPT.siteAccessDetector","noopFunc"],["openAdBlockPopup","noopFunc"],["Object.prototype._adsDisabled","true"],["advanced_ads_check_adblocker","noopFunc"],["canRunAds","1"],["attestHasAdBlockerActivated","true"],["extInstalled","true"],["SaveFiles.add","noopFunc"],["detectSandbox","noopFunc"],["adbon","0"],["LCI.adBlockDetectorEnabled","false"],["stoCazzo","true"],["adblockDetected","false"],["importFAB","undefined"],["window.__CONFIGURATION__.adInsertion.enabled","false"],["window.__CONFIGURATION__.features.enableAdBlockerDetection","false"],["_carbonads","{}"],["_bsa","{}"],["rwt","noopFunc"],["bmak.js_post","false"],["firebase.analytics","noopFunc"],["Object.prototype.updateModifiedCommerceUrl","noopFunc"],["flashvars.event_reporting",""],["Object.prototype.has_opted_out_tracking","trueFunc"],["Visitor","{}"],["send_gravity_event","noopFunc"],["send_recommendation_event","noopFunc"],["libAnalytics.data.get","noopFunc"],["adthrive._components.start","noopFunc"],["navigator.sendBeacon","noopFunc"]];
const hostnamesMap = new Map([["jilliandescribecompany.com",0],["gogoanime.*",[0,200]],["adrianmissionminute.com",0],["alejandrocenturyoil.com",0],["alleneconomicmatter.com",0],["bethshouldercan.com",0],["bigclatterhomesguideservice.com",0],["brittneystandardwestern.com",0],["brookethoughi.com",0],["brucevotewithin.com",0],["cindyeyefinal.com",0],["denisegrowthwide.com",0],["diananatureforeign.com",0],["donaldlineelse.com",0],["edwardarriveoften.com",0],["erikcoldperson.com",0],["evelynthankregion.com",0],["graceaddresscommunity.com",0],["heatherdiscussionwhen.com",0],["heatherwholeinvolve.com",0],["housecardsummerbutton.com",0],["jamessoundcost.com",0],["jamiesamewalk.com",0],["jasminetesttry.com",0],["jasonresponsemeasure.com",0],["jayservicestuff.com",0],["jennifercertaindevelopment.com",0],["jessicaglassauthor.com",0],["johnalwayssame.com",0],["johntryopen.com",0],["jonathansociallike.com",0],["josephseveralconcern.com",0],["kellywhatcould.com",0],["kennethofficialitem.com",0],["kristiesoundsimply.com",0],["lisatrialidea.com",0],["lorimuchbenefit.com",0],["loriwithinfamily.com",0],["lukecomparetwo.com",0],["mariatheserepublican.com",0],["markstyleall.com",0],["michaelapplysome.com",0],["morganoperationface.com",0],["nathanfromsubject.com",0],["paulkitchendark.com",0],["rebeccaneverbase.com",0],["richardsignfish.com",0],["roberteachfinal.com",0],["robertordercharacter.com",0],["robertplacespace.com",0],["ryanagoinvolve.com",0],["sandratableother.com",0],["sandrataxeight.com",0],["sethniceletter.com",0],["shannonpersonalcost.com",0],["susanhavekeep.com",0],["tinycat-voe-fashion.com",0],["toddpartneranimal.com",0],["troyyourlead.com",0],["uptodatefinishconference.com",0],["uptodatefinishconferenceroom.com",0],["voe.sx",0],["maxfinishseveral.com",0],["voe.sx>>",0],["javboys.tv>>",0],["freeplayervideo.com",0],["nazarickol.com",0],["player-cdn.com",0],["playhydrax.com",[0,409,410]],["rabbitstream.net",0],["fmovies.*",0],["japscan.*",[1,2,3,4,5]],["u26bekrb.fun",6],["br.de",7],["indeed.com",8],["zillow.com",[8,112]],["pasteboard.co",9],["bbc.com",10],["clickhole.com",11],["deadspin.com",11],["gizmodo.com",11],["jalopnik.com",11],["jezebel.com",11],["kotaku.com",11],["lifehacker.com",11],["splinternews.com",11],["theinventory.com",11],["theonion.com",11],["theroot.com",11],["thetakeout.com",11],["pewresearch.org",11],["los40.com",[12,13]],["as.com",13],["caracol.com.co",13],["telegraph.co.uk",[14,15]],["poweredbycovermore.com",[14,67]],["lumens.com",[14,67]],["verizon.com",16],["humanbenchmark.com",17],["politico.com",18],["officedepot.co.cr",[19,20]],["officedepot.*",[21,22]],["usnews.com",23],["coolmathgames.com",[24,286,287,288]],["video.gazzetta.it",[25,26]],["oggi.it",[25,26]],["manoramamax.com",25],["factable.com",27],["thedailybeast.com",28],["zee5.com",29],["gala.fr",30],["geo.fr",30],["voici.fr",30],["gloucestershirelive.co.uk",31],["arsiv.mackolik.com",32],["jacksonguitars.com",33],["scandichotels.com",34],["stylist.co.uk",35],["nettiauto.com",36],["thaiairways.com",[37,38]],["cerbahealthcare.it",[39,40]],["futura-sciences.com",[39,57]],["toureiffel.paris",39],["campusfrance.org",[39,149]],["tiendaenlinea.claro.com.ni",[41,42]],["tieba.baidu.com",43],["fandom.com",[44,45,347]],["grasshopper.com",[46,47]],["epson.com.cn",[48,49,50,51]],["oe24.at",[52,53]],["szbz.de",52],["platform.autods.com",[54,55]],["kcra.com",56],["wcvb.com",56],["sportdeutschland.tv",56],["citibank.com.sg",58],["uol.com.br",[59,60,61,62,63]],["gazzetta.gr",64],["digicol.dpm.org.cn",[65,66]],["virginmediatelevision.ie",68],["larazon.es",[69,70]],["waitrosecellar.com",[71,72,73]],["kicker.de",[74,388]],["sharpen-free-design-generator.netlify.app",[75,76]],["help.cashctrl.com",[77,78]],["gry-online.pl",79],["vidaextra.com",80],["commande.rhinov.pro",[81,82]],["ecom.wixapps.net",[81,82]],["tipranks.com",[83,84]],["iceland.co.uk",[85,86,87]],["socket.pearsoned.com",88],["tntdrama.com",[89,90]],["trutv.com",[89,90]],["mobile.de",[91,92]],["ioe.vn",[93,94]],["geiriadur.ac.uk",[93,97]],["welsh-dictionary.ac.uk",[93,97]],["bikeportland.org",[95,96]],["biologianet.com",[60,61,62]],["10.com.au",[98,99]],["10play.com.au",[98,99]],["sunshine-live.de",[100,101]],["whatismyip.com",[102,103]],["myfitnesspal.com",104],["netoff.co.jp",[105,106]],["bluerabbitrx.com",[105,106]],["foundit.*",[107,108]],["clickjogos.com.br",109],["bristan.com",[110,111]],["share.hntv.tv",[113,114,115,116]],["forum.dji.com",[113,116]],["unionpayintl.com",[113,115]],["streamelements.com",113],["optimum.net",[117,118]],["hdfcfund.com",119],["user.guancha.cn",[120,121]],["sosovalue.com",122],["bandyforbundet.no",[123,124]],["tatacommunications.com",125],["kb.arlo.com",[125,155]],["suamusica.com.br",[126,127,128]],["macrotrends.net",[129,130]],["code.world",131],["smartcharts.net",131],["topgear.com",132],["eservice.directauto.com",[133,134]],["nbcsports.com",135],["standard.co.uk",136],["pruefernavi.de",[137,138]],["17track.net",139],["visible.com",140],["hagerty.com",[141,142]],["marketplace.nvidia.com",143],["kino.de",[144,145]],["9now.nine.com.au",146],["worldstar.com",147],["prisjakt.no",148],["developer.arm.com",[150,151]],["sterkinekor.com",152],["iogames.space",153],["id.condenast.com",154],["tires.costco.com",156],["livemint.com",[157,158]],["m.youtube.com",[159,160,161,162]],["music.youtube.com",[159,160,161,162]],["tv.youtube.com",[159,160,161,162]],["www.youtube.com",[159,160,161,162]],["youtubekids.com",[159,160,161,162]],["youtube-nocookie.com",[159,160,161,162]],["eu-proxy.startpage.com",[159,160,162]],["timesofindia.indiatimes.com",163],["economictimes.indiatimes.com",164],["motherless.com",165],["sueddeutsche.de",166],["watchanimesub.net",167],["wcoanimesub.tv",167],["wcoforever.net",167],["freeviewmovies.com",167],["filehorse.com",167],["guidetnt.com",167],["starmusiq.*",167],["sp-today.com",167],["linkvertise.com",167],["eropaste.net",167],["getpaste.link",167],["sharetext.me",167],["wcofun.*",167],["note.sieuthuthuat.com",167],["gadgets.es",[167,459]],["amateurporn.co",[167,256]],["wiwo.de",168],["primewire.*",169],["alphaporno.com",[169,541]],["porngem.com",169],["shortit.pw",[169,242]],["familyporn.tv",169],["sbplay.*",169],["id45.cyou",169],["85po.com",[169,227]],["milfnut.*",169],["k1nk.co",169],["watchasians.cc",169],["sankakucomplex.com",170],["player.glomex.com",171],["merkur.de",171],["tz.de",171],["sxyprn.*",172],["hqq.*",[173,174]],["waaw.*",[174,175]],["hotpornfile.org",174],["younetu.*",174],["multiup.us",174],["peliculas8k.com",[174,175]],["czxxx.org",174],["vtplayer.online",174],["vvtplayer.*",174],["netu.ac",174],["netu.frembed.lol",174],["123link.*",176],["adshort.*",176],["mitly.us",176],["linkrex.net",176],["linx.cc",176],["oke.io",176],["linkshorts.*",176],["dz4link.com",176],["adsrt.*",176],["linclik.com",176],["shrt10.com",176],["vinaurl.*",176],["loptelink.com",176],["adfloz.*",176],["cut-fly.com",176],["linkfinal.com",176],["payskip.org",176],["cutpaid.com",176],["linkjust.com",176],["leechpremium.link",176],["icutlink.com",[176,261]],["oncehelp.com",176],["rgl.vn",176],["reqlinks.net",176],["bitlk.com",176],["qlinks.eu",176],["link.3dmili.com",176],["short-fly.com",176],["foxseotools.com",176],["dutchycorp.*",176],["shortearn.*",176],["pingit.*",176],["link.turkdown.com",176],["7r6.com",176],["oko.sh",176],["ckk.ai",176],["fc.lc",176],["fstore.biz",176],["shrink.*",176],["cuts-url.com",176],["eio.io",176],["exe.app",176],["exee.io",176],["exey.io",176],["skincarie.com",176],["exeo.app",176],["tmearn.*",176],["coinlyhub.com",[176,325]],["adsafelink.com",176],["aii.sh",176],["megalink.*",176],["cybertechng.com",[176,341]],["cutdl.xyz",176],["iir.ai",176],["shorteet.com",[176,359]],["miniurl.*",176],["smoner.com",176],["gplinks.*",176],["odisha-remix.com",[176,341]],["xpshort.com",[176,341]],["upshrink.com",176],["clk.*",176],["easysky.in",176],["veganab.co",176],["golink.bloggerishyt.in",176],["birdurls.com",176],["vipurl.in",176],["jameeltips.us",176],["promo-visits.site",176],["satoshi-win.xyz",[176,375]],["shorterall.com",176],["encurtandourl.com",176],["forextrader.site",176],["postazap.com",176],["cety.app",176],["exego.app",[176,373]],["cutlink.net",176],["cutyurls.com",176],["cutty.app",176],["cutnet.net",176],["jixo.online",176],["tinys.click",[176,341]],["cpm.icu",176],["panyshort.link",176],["enagato.com",176],["pandaznetwork.com",176],["tpi.li",176],["oii.la",176],["recipestutorials.com",176],["shrinkme.*",176],["shrinke.*",176],["mrproblogger.com",176],["themezon.net",176],["shrinkforearn.in",176],["oii.io",176],["du-link.in",176],["atglinks.com",176],["thotpacks.xyz",176],["megaurl.in",176],["megafly.in",176],["simana.online",176],["fooak.com",176],["joktop.com",176],["evernia.site",176],["falpus.com",176],["link.paid4link.com",176],["exalink.fun",176],["shortxlinks.com",176],["upfion.com",176],["upfiles.app",176],["upfiles-urls.com",176],["flycutlink.com",[176,341]],["linksly.co",176],["link1s.*",176],["pkr.pw",176],["imagenesderopaparaperros.com",176],["shortenbuddy.com",176],["apksvip.com",176],["4cash.me",176],["namaidani.com",176],["shortzzy.*",176],["teknomuda.com",176],["shorttey.*",[176,324]],["miuiku.com",176],["savelink.site",176],["lite-link.*",176],["adcorto.*",176],["samaa-pro.com",176],["miklpro.com",176],["modapk.link",176],["ccurl.net",176],["linkpoi.me",176],["pewgame.com",176],["haonguyen.top",176],["zshort.*",176],["crazyblog.in",176],["cutearn.net",176],["rshrt.com",176],["filezipa.com",176],["dz-linkk.com",176],["upfiles.*",176],["theblissempire.com",176],["finanzas-vida.com",176],["adurly.cc",176],["paid4.link",176],["link.asiaon.top",176],["go.gets4link.com",176],["linkfly.*",176],["beingtek.com",176],["shorturl.unityassets4free.com",176],["disheye.com",176],["techymedies.com",176],["techysuccess.com",176],["za.gl",[176,276]],["bblink.com",176],["myad.biz",176],["swzz.xyz",176],["vevioz.com",176],["charexempire.com",176],["clk.asia",176],["sturls.com",176],["myshrinker.com",176],["snowurl.com",[176,341]],["wplink.*",176],["rocklink.in",176],["techgeek.digital",176],["download3s.net",176],["shortx.net",176],["tlin.me",176],["bestcash2020.com",176],["adslink.pw",176],["novelssites.com",176],["faucetcrypto.net",176],["trxking.xyz",176],["weadown.com",176],["m.bloggingguidance.com",176],["link.codevn.net",176],["link4rev.site",176],["c2g.at",176],["bitcosite.com",[176,555]],["cryptosh.pro",176],["windowslite.net",[176,341]],["viewfr.com",176],["cl1ca.com",176],["4br.me",176],["fir3.net",176],["seulink.*",176],["encurtalink.*",176],["kiddyshort.com",176],["watchmygf.me",[177,201]],["camwhores.*",[177,187,226,227,228]],["camwhorez.tv",[177,187,226,227]],["cambay.tv",[177,208,226,253,255,256,257,258]],["fpo.xxx",[177,208]],["sexemix.com",177],["heavyfetish.com",[177,729]],["thotcity.su",177],["viralxxxporn.com",[177,392]],["tube8.*",[178,179]],["you-porn.com",179],["youporn.*",179],["youporngay.com",179],["youpornru.com",179],["redtube.*",179],["9908ww.com",179],["adelaidepawnbroker.com",179],["bztube.com",179],["hotovs.com",179],["insuredhome.org",179],["nudegista.com",179],["pornluck.com",179],["vidd.se",179],["pornhub.*",[179,313]],["pornhub.com",179],["pornerbros.com",180],["freep.com",180],["porn.com",181],["tune.pk",182],["noticias.gospelmais.com.br",183],["techperiod.com",183],["viki.com",[184,185]],["watch-series.*",186],["watchseries.*",186],["vev.*",186],["vidop.*",186],["vidup.*",186],["sleazyneasy.com",[187,188,189]],["smutr.com",[187,321]],["tktube.com",187],["yourporngod.com",[187,188]],["javbangers.com",[187,449]],["camfox.com",187],["camthots.tv",[187,253]],["shegotass.info",187],["amateur8.com",187],["bigtitslust.com",187],["ebony8.com",187],["freeporn8.com",187],["lesbian8.com",187],["maturetubehere.com",187],["sortporn.com",187],["motherporno.com",[187,188,208,255]],["theporngod.com",[187,188]],["watchdirty.to",[187,227,228,256]],["pornsocket.com",190],["luxuretv.com",191],["porndig.com",[192,193]],["webcheats.com.br",194],["ceesty.com",[195,196]],["gestyy.com",[195,196]],["corneey.com",196],["destyy.com",196],["festyy.com",196],["sh.st",196],["mitaku.net",196],["angrybirdsnest.com",197],["zrozz.com",197],["clix4btc.com",197],["4tests.com",197],["goltelevision.com",197],["news-und-nachrichten.de",197],["laradiobbs.net",197],["urlaubspartner.net",197],["produktion.de",197],["cinemaxxl.de",197],["bladesalvador.com",197],["tempr.email",197],["cshort.org",197],["friendproject.net",197],["covrhub.com",197],["katfile.com",[197,623]],["trust.zone",197],["business-standard.com",197],["planetsuzy.org",198],["empflix.com",199],["xmovies8.*",200],["masteranime.tv",200],["0123movies.*",200],["gostream.*",200],["gomovies.*",200],["transparentcalifornia.com",201],["deepbrid.com",202],["webnovel.com",203],["streamwish.*",[204,205]],["oneupload.to",205],["wishfast.top",205],["rubystm.com",205],["rubyvid.com",205],["rubyvidhub.com",205],["stmruby.com",205],["streamruby.com",205],["schwaebische.de",206],["8tracks.com",207],["3movs.com",208],["bravoerotica.net",[208,255]],["youx.xxx",208],["camclips.tv",[208,321]],["xtits.*",[208,255]],["camflow.tv",[208,255,256,294,392]],["camhoes.tv",[208,253,255,256,294,392]],["xmegadrive.com",208],["xxxymovies.com",208],["xxxshake.com",208],["gayck.com",208],["xhand.com",[208,255]],["analdin.com",[208,255]],["revealname.com",209],["golfchannel.com",210],["stream.nbcsports.com",210],["mathdf.com",210],["gamcore.com",211],["porcore.com",211],["porngames.tv",211],["69games.xxx",211],["javmix.app",211],["haaretz.co.il",212],["haaretz.com",212],["hungama.com",212],["a-o.ninja",212],["anime-odcinki.pl",212],["shortgoo.blogspot.com",212],["tonanmedia.my.id",[212,575]],["yurasu.xyz",212],["isekaipalace.com",212],["plyjam.*",[213,214]],["ennovelas.com",[214,218]],["foxsports.com.au",215],["canberratimes.com.au",215],["thesimsresource.com",216],["fxporn69.*",217],["vipbox.*",218],["viprow.*",218],["ctrl.blog",219],["sportlife.es",220],["finofilipino.org",221],["desbloqueador.*",222],["xberuang.*",223],["teknorizen.*",223],["mysflink.blogspot.com",223],["ashemaletube.*",224],["paktech2.com",224],["assia.tv",225],["assia4.com",225],["cwtvembeds.com",[227,254]],["camlovers.tv",227],["porntn.com",227],["pornissimo.org",227],["sexcams-24.com",[227,256]],["watchporn.to",[227,256]],["camwhorez.video",227],["footstockings.com",[227,228,256]],["xmateur.com",[227,228,256]],["multi.xxx",228],["weatherx.co.in",[229,230]],["sunbtc.space",229],["subtorrents.*",231],["subtorrents1.*",231],["newpelis.*",231],["pelix.*",231],["allcalidad.*",231],["infomaniakos.*",231],["ojogos.com.br",232],["powforums.com",233],["supforums.com",233],["studybullet.com",233],["usgamer.net",234],["recordonline.com",234],["freebitcoin.win",235],["e-monsite.com",235],["coindice.win",235],["freiepresse.de",236],["investing.com",237],["tornadomovies.*",238],["mp3fiber.com",239],["chicoer.com",240],["dailybreeze.com",240],["dailybulletin.com",240],["dailynews.com",240],["delcotimes.com",240],["eastbaytimes.com",240],["macombdaily.com",240],["ocregister.com",240],["pasadenastarnews.com",240],["pe.com",240],["presstelegram.com",240],["redlandsdailyfacts.com",240],["reviewjournal.com",240],["santacruzsentinel.com",240],["saratogian.com",240],["sentinelandenterprise.com",240],["sgvtribune.com",240],["tampabay.com",240],["times-standard.com",240],["theoaklandpress.com",240],["trentonian.com",240],["twincities.com",240],["whittierdailynews.com",240],["bostonherald.com",240],["dailycamera.com",240],["sbsun.com",240],["dailydemocrat.com",240],["montereyherald.com",240],["orovillemr.com",240],["record-bee.com",240],["redbluffdailynews.com",240],["reporterherald.com",240],["thereporter.com",240],["timescall.com",240],["timesheraldonline.com",240],["ukiahdailyjournal.com",240],["dailylocal.com",240],["mercurynews.com",240],["suedkurier.de",241],["anysex.com",243],["icdrama.*",244],["mangasail.*",244],["pornve.com",245],["file4go.*",246],["coolrom.com.au",246],["marie-claire.es",247],["gamezhero.com",247],["flashgirlgames.com",247],["onlinesudoku.games",247],["mpg.football",247],["sssam.com",247],["globalnews.ca",248],["drinksmixer.com",249],["leitesculinaria.com",249],["fupa.net",250],["browardpalmbeach.com",251],["dallasobserver.com",251],["houstonpress.com",251],["miaminewtimes.com",251],["phoenixnewtimes.com",251],["westword.com",251],["nowtv.com.tr",252],["caminspector.net",253],["camwhoreshd.com",253],["camgoddess.tv",253],["gay4porn.com",255],["mypornhere.com",255],["mangovideo.*",256],["love4porn.com",256],["thotvids.com",256],["watchmdh.to",256],["celebwhore.com",256],["cluset.com",256],["sexlist.tv",256],["4kporn.xxx",256],["xhomealone.com",256],["lusttaboo.com",[256,519]],["hentai-moon.com",256],["camhub.cc",[256,682]],["mediapason.it",259],["linkspaid.com",259],["tuotromedico.com",259],["neoteo.com",259],["phoneswiki.com",259],["celebmix.com",259],["myneobuxportal.com",259],["oyungibi.com",259],["25yearslatersite.com",259],["jeshoots.com",260],["techhx.com",260],["karanapk.com",260],["flashplayer.fullstacks.net",262],["cloudapps.herokuapp.com",262],["youfiles.herokuapp.com",262],["texteditor.nsspot.net",262],["temp-mail.org",263],["asianclub.*",264],["javhdporn.net",264],["vidmoly.to",265],["comnuan.com",266],["veedi.com",267],["battleboats.io",267],["anitube.*",268],["fruitlab.com",268],["haddoz.net",268],["streamingcommunity.*",268],["garoetpos.com",268],["stiletv.it",269],["mixdrop.*",270],["hqtv.biz",271],["liveuamap.com",272],["audycje.tokfm.pl",273],["shush.se",274],["allkpop.com",275],["empire-anime.*",[276,570,571,572,573,574]],["empire-streaming.*",[276,570,571,572]],["empire-anime.com",[276,570,571,572]],["empire-streamz.fr",[276,570,571,572]],["empire-stream.*",[276,570,571,572]],["pickcrackpasswords.blogspot.com",277],["kfrfansub.com",278],["thuglink.com",278],["voipreview.org",278],["illicoporno.com",279],["lavoixdux.com",279],["tonpornodujour.com",279],["jacquieetmichel.net",279],["swame.com",279],["vosfemmes.com",279],["voyeurfrance.net",279],["jacquieetmicheltv.net",[279,630,631]],["pogo.com",280],["cloudvideo.tv",281],["legionjuegos.org",282],["legionpeliculas.org",282],["legionprogramas.org",282],["16honeys.com",283],["elespanol.com",284],["remodelista.com",285],["audiofanzine.com",289],["uploadev.*",290],["developerinsider.co",291],["thehindu.com",292],["cambro.tv",[293,294]],["boobsradar.com",[294,392,699]],["nibelungen-kurier.de",295],["adfoc.us",296],["tackledsoul.com",296],["adrino1.bonloan.xyz",296],["vi-music.app",296],["instanders.app",296],["rokni.xyz",296],["keedabankingnews.com",296],["tea-coffee.net",296],["spatsify.com",296],["newedutopics.com",296],["getviralreach.in",296],["edukaroo.com",296],["funkeypagali.com",296],["careersides.com",296],["nayisahara.com",296],["wikifilmia.com",296],["infinityskull.com",296],["viewmyknowledge.com",296],["iisfvirtual.in",296],["starxinvestor.com",296],["jkssbalerts.com",296],["sahlmarketing.net",296],["filmypoints.in",296],["fitnessholic.net",296],["moderngyan.com",296],["sattakingcharts.in",296],["bankshiksha.in",296],["earn.mpscstudyhub.com",296],["earn.quotesopia.com",296],["money.quotesopia.com",296],["best-mobilegames.com",296],["learn.moderngyan.com",296],["bharatsarkarijobalert.com",296],["quotesopia.com",296],["creditsgoal.com",296],["bgmi32bitapk.in",296],["techacode.com",296],["trickms.com",296],["ielts-isa.edu.vn",296],["loan.punjabworks.com",296],["sptfy.be",296],["mcafee-com.com",[296,373]],["pianetamountainbike.it",297],["barchart.com",298],["modelisme.com",299],["parasportontario.ca",299],["prescottenews.com",299],["nrj-play.fr",300],["hackingwithreact.com",301],["gutekueche.at",302],["peekvids.com",303],["playvids.com",303],["pornflip.com",303],["redensarten-index.de",304],["vw-page.com",305],["viz.com",[306,307]],["0rechner.de",308],["configspc.com",309],["xopenload.me",309],["uptobox.com",309],["uptostream.com",309],["japgay.com",310],["mega-debrid.eu",311],["dreamdth.com",312],["diaridegirona.cat",314],["diariodeibiza.es",314],["diariodemallorca.es",314],["diarioinformacion.com",314],["eldia.es",314],["emporda.info",314],["farodevigo.es",314],["laopinioncoruna.es",314],["laopiniondemalaga.es",314],["laopiniondemurcia.es",314],["laopiniondezamora.es",314],["laprovincia.es",314],["levante-emv.com",314],["mallorcazeitung.es",314],["regio7.cat",314],["superdeporte.es",314],["playpaste.com",315],["cnbc.com",316],["primevideo.com",317],["read.amazon.*",[317,711]],["firefaucet.win",318],["74k.io",[319,320]],["cloudwish.xyz",320],["gradehgplus.com",320],["javindo.site",320],["javindosub.site",320],["kamehaus.net",320],["movearnpre.com",320],["arabshentai.com>>",320],["javdo.cc>>",320],["javenglish.cc>>",320],["javhd.*>>",320],["javhdz.*>>",320],["roshy.tv>>",320],["sextb.*>>",320],["fullhdxxx.com",322],["pornclassic.tube",323],["tubepornclassic.com",323],["etonline.com",324],["creatur.io",324],["lookcam.*",324],["drphil.com",324],["urbanmilwaukee.com",324],["ontiva.com",324],["hideandseek.world",324],["myabandonware.com",324],["kendam.com",324],["wttw.com",324],["synonyms.com",324],["definitions.net",324],["hostmath.com",324],["camvideoshub.com",324],["minhaconexao.com.br",324],["home-made-videos.com",326],["amateur-couples.com",326],["slutdump.com",326],["artificialnudes.com",326],["bdsmkingdom.xyz",326],["cosplaynsfw.xyz",326],["crazytoys.xyz",326],["hardcorelesbian.xyz",326],["pornfeet.xyz",326],["pornahegao.xyz",326],["sexontheboat.xyz",326],["dpstream.*",327],["produsat.com",328],["bluemediafiles.*",329],["12thman.com",330],["acusports.com",330],["atlantic10.com",330],["auburntigers.com",330],["baylorbears.com",330],["bceagles.com",330],["bgsufalcons.com",330],["big12sports.com",330],["bigten.org",330],["bradleybraves.com",330],["butlersports.com",330],["cmumavericks.com",330],["conferenceusa.com",330],["cyclones.com",330],["dartmouthsports.com",330],["daytonflyers.com",330],["dbupatriots.com",330],["dbusports.com",330],["denverpioneers.com",330],["fduknights.com",330],["fgcuathletics.com",330],["fightinghawks.com",330],["fightingillini.com",330],["floridagators.com",330],["friars.com",330],["friscofighters.com",330],["gamecocksonline.com",330],["goarmywestpoint.com",330],["gobison.com",330],["goblueraiders.com",330],["gobobcats.com",330],["gocards.com",330],["gocreighton.com",330],["godeacs.com",330],["goexplorers.com",330],["goetbutigers.com",330],["gofrogs.com",330],["gogriffs.com",330],["gogriz.com",330],["golobos.com",330],["gomarquette.com",330],["gopack.com",330],["gophersports.com",330],["goprincetontigers.com",330],["gopsusports.com",330],["goracers.com",330],["goshockers.com",330],["goterriers.com",330],["gotigersgo.com",330],["gousfbulls.com",330],["govandals.com",330],["gowyo.com",330],["goxavier.com",330],["gozags.com",330],["gozips.com",330],["griffinathletics.com",330],["guhoyas.com",330],["gwusports.com",330],["hailstate.com",330],["hamptonpirates.com",330],["hawaiiathletics.com",330],["hokiesports.com",330],["huskers.com",330],["icgaels.com",330],["iuhoosiers.com",330],["jsugamecocksports.com",330],["longbeachstate.com",330],["loyolaramblers.com",330],["lrtrojans.com",330],["lsusports.net",330],["morrisvillemustangs.com",330],["msuspartans.com",330],["muleriderathletics.com",330],["mutigers.com",330],["navysports.com",330],["nevadawolfpack.com",330],["niuhuskies.com",330],["nkunorse.com",330],["nuhuskies.com",330],["nusports.com",330],["okstate.com",330],["olemisssports.com",330],["omavs.com",330],["ovcsports.com",330],["owlsports.com",330],["purduesports.com",330],["redstormsports.com",330],["richmondspiders.com",330],["sfajacks.com",330],["shupirates.com",330],["siusalukis.com",330],["smcgaels.com",330],["smumustangs.com",330],["soconsports.com",330],["soonersports.com",330],["themw.com",330],["tulsahurricane.com",330],["txst.com",330],["txstatebobcats.com",330],["ubbulls.com",330],["ucfknights.com",330],["ucirvinesports.com",330],["uconnhuskies.com",330],["uhcougars.com",330],["uicflames.com",330],["umterps.com",330],["uncwsports.com",330],["unipanthers.com",330],["unlvrebels.com",330],["uoflsports.com",330],["usdtoreros.com",330],["utahstateaggies.com",330],["utepathletics.com",330],["utrockets.com",330],["uvmathletics.com",330],["uwbadgers.com",330],["villanova.com",330],["wkusports.com",330],["wmubroncos.com",330],["woffordterriers.com",330],["1pack1goal.com",330],["bcuathletics.com",330],["bubraves.com",330],["goblackbears.com",330],["golightsgo.com",330],["gomcpanthers.com",330],["goutsa.com",330],["mercerbears.com",330],["pirateblue.com",330],["pirateblue.net",330],["pirateblue.org",330],["quinnipiacbobcats.com",330],["towsontigers.com",330],["tribeathletics.com",330],["tribeclub.com",330],["utepminermaniacs.com",330],["utepminers.com",330],["wkutickets.com",330],["aopathletics.org",330],["atlantichockeyonline.com",330],["bigsouthnetwork.com",330],["bigsouthsports.com",330],["chawomenshockey.com",330],["dbupatriots.org",330],["drakerelays.org",330],["ecac.org",330],["ecacsports.com",330],["emueagles.com",330],["emugameday.com",330],["gculopes.com",330],["godrakebulldog.com",330],["godrakebulldogs.com",330],["godrakebulldogs.net",330],["goeags.com",330],["goislander.com",330],["goislanders.com",330],["gojacks.com",330],["gomacsports.com",330],["gseagles.com",330],["hubison.com",330],["iowaconference.com",330],["ksuowls.com",330],["lonestarconference.org",330],["mascac.org",330],["midwestconference.org",330],["mountaineast.org",330],["niu-pack.com",330],["nulakers.ca",330],["oswegolakers.com",330],["ovcdigitalnetwork.com",330],["pacersports.com",330],["rmacsports.org",330],["rollrivers.com",330],["samfordsports.com",330],["uncpbraves.com",330],["usfdons.com",330],["wiacsports.com",330],["alaskananooks.com",330],["broncathleticfund.com",330],["cameronaggies.com",330],["columbiacougars.com",330],["etownbluejays.com",330],["gobadgers.ca",330],["golancers.ca",330],["gometrostate.com",330],["gothunderbirds.ca",330],["kentstatesports.com",330],["lehighsports.com",330],["lopers.com",330],["lycoathletics.com",330],["lycomingathletics.com",330],["maraudersports.com",330],["mauiinvitational.com",330],["msumavericks.com",330],["nauathletics.com",330],["nueagles.com",330],["nwusports.com",330],["oceanbreezenyc.org",330],["patriotathleticfund.com",330],["pittband.com",330],["principiaathletics.com",330],["roadrunnersathletics.com",330],["sidearmsocial.com",330],["snhupenmen.com",330],["stablerarena.com",330],["stoutbluedevils.com",330],["uwlathletics.com",330],["yumacs.com",330],["collegefootballplayoff.com",330],["csurams.com",330],["cubuffs.com",330],["gobearcats.com",330],["gohuskies.com",330],["mgoblue.com",330],["osubeavers.com",330],["pittsburghpanthers.com",330],["rolltide.com",330],["texassports.com",330],["thesundevils.com",330],["uclabruins.com",330],["wvuathletics.com",330],["wvusports.com",330],["arizonawildcats.com",330],["calbears.com",330],["cuse.com",330],["georgiadogs.com",330],["goducks.com",330],["goheels.com",330],["gostanford.com",330],["insidekstatesports.com",330],["insidekstatesports.info",330],["insidekstatesports.net",330],["insidekstatesports.org",330],["k-stateathletics.com",330],["k-statefootball.net",330],["k-statefootball.org",330],["k-statesports.com",330],["k-statesports.net",330],["k-statesports.org",330],["k-statewomenshoops.com",330],["k-statewomenshoops.net",330],["k-statewomenshoops.org",330],["kstateathletics.com",330],["kstatefootball.net",330],["kstatefootball.org",330],["kstatesports.com",330],["kstatewomenshoops.com",330],["kstatewomenshoops.net",330],["kstatewomenshoops.org",330],["ksuathletics.com",330],["ksusports.com",330],["scarletknights.com",330],["showdownforrelief.com",330],["syracusecrunch.com",330],["texastech.com",330],["theacc.com",330],["ukathletics.com",330],["usctrojans.com",330],["utahutes.com",330],["utsports.com",330],["wsucougars.com",330],["vidlii.com",[330,356]],["tricksplit.io",330],["fangraphs.com",331],["stern.de",332],["geo.de",332],["brigitte.de",332],["welt.de",333],["tvspielfilm.de",[334,335,336,337]],["tvtoday.de",[334,335,336,337]],["chip.de",[334,335,336,337]],["focus.de",[334,335,336,337]],["fitforfun.de",[334,335,336,337]],["n-tv.de",338],["player.rtl2.de",339],["planetaminecraft.com",340],["cravesandflames.com",341],["codesnse.com",341],["flyad.vip",341],["lapresse.ca",342],["kolyoom.com",343],["ilovephd.com",343],["negumo.com",344],["games.wkb.jp",[345,346]],["kenshi.fandom.com",348],["hausbau-forum.de",349],["homeairquality.org",349],["faucettronn.click",349],["fake-it.ws",350],["laksa19.github.io",351],["1shortlink.com",352],["u-s-news.com",353],["luscious.net",354],["makemoneywithurl.com",355],["junkyponk.com",355],["healthfirstweb.com",355],["vocalley.com",355],["yogablogfit.com",355],["howifx.com",[355,540]],["en.financerites.com",355],["mythvista.com",355],["livenewsflix.com",355],["cureclues.com",355],["apekite.com",355],["enit.in",355],["iammagnus.com",356],["dailyvideoreports.net",356],["unityassets4free.com",356],["docer.*",357],["resetoff.pl",357],["sexodi.com",357],["cdn77.org",358],["momxxxsex.com",359],["penisbuyutucum.net",359],["ujszo.com",360],["newsmax.com",361],["nadidetarifler.com",362],["siz.tv",362],["suzylu.co.uk",[363,364]],["onworks.net",365],["yabiladi.com",365],["downloadsoft.net",366],["newsobserver.com",367],["arkadiumhosted.com",367],["testlanguages.com",368],["newsinlevels.com",368],["videosinlevels.com",368],["procinehub.com",369],["bookmystrip.com",369],["imagereviser.com",370],["gyanitheme.com",371],["tech.trendingword.com",371],["blog.potterworld.co",371],["hipsonyc.com",371],["tech.pubghighdamage.com",371],["blog.itijobalert.in",371],["techkhulasha.com",371],["jiocinema.com",371],["rapid-cloud.co",371],["uploadmall.com",371],["4funbox.com",372],["nephobox.com",372],["1024tera.com",372],["terabox.*",372],["starkroboticsfrc.com",373],["sinonimos.de",373],["antonimos.de",373],["quesignifi.ca",373],["tiktokrealtime.com",373],["tiktokcounter.net",373],["tpayr.xyz",373],["poqzn.xyz",373],["ashrfd.xyz",373],["rezsx.xyz",373],["tryzt.xyz",373],["ashrff.xyz",373],["rezst.xyz",373],["dawenet.com",373],["erzar.xyz",373],["waezm.xyz",373],["waezg.xyz",373],["blackwoodacademy.org",373],["cryptednews.space",373],["vivuq.com",373],["swgop.com",373],["vbnmll.com",373],["telcoinfo.online",373],["dshytb.com",373],["btcbitco.in",[373,374]],["btcsatoshi.net",373],["cempakajaya.com",373],["crypto4yu.com",373],["readbitcoin.org",373],["wiour.com",373],["finish.addurl.biz",373],["aiimgvlog.fun",[373,377]],["laweducationinfo.com",373],["savemoneyinfo.com",373],["worldaffairinfo.com",373],["godstoryinfo.com",373],["successstoryinfo.com",373],["cxissuegk.com",373],["learnmarketinfo.com",373],["bhugolinfo.com",373],["armypowerinfo.com",373],["rsgamer.app",373],["phonereviewinfo.com",373],["makeincomeinfo.com",373],["gknutshell.com",373],["vichitrainfo.com",373],["workproductivityinfo.com",373],["dopomininfo.com",373],["hostingdetailer.com",373],["fitnesssguide.com",373],["tradingfact4u.com",373],["cryptofactss.com",373],["softwaredetail.com",373],["artoffocas.com",373],["insurancesfact.com",373],["travellingdetail.com",373],["advertisingexcel.com",373],["allcryptoz.net",373],["batmanfactor.com",373],["beautifulfashionnailart.com",373],["crewbase.net",373],["documentaryplanet.xyz",373],["crewus.net",373],["gametechreviewer.com",373],["midebalonu.net",373],["misterio.ro",373],["phineypet.com",373],["seory.xyz",373],["shinbhu.net",373],["shinchu.net",373],["substitutefor.com",373],["talkforfitness.com",373],["thefitbrit.co.uk",373],["thumb8.net",373],["thumb9.net",373],["topcryptoz.net",373],["uniqueten.net",373],["ultraten.net",373],["exactpay.online",373],["quins.us",373],["kiddyearner.com",373],["bildirim.*",376],["arahdrive.com",377],["appsbull.com",378],["diudemy.com",378],["maqal360.com",[378,379,380]],["lifesurance.info",381],["akcartoons.in",382],["cybercityhelp.in",382],["dl.apkmoddone.com",383],["phongroblox.com",383],["fuckingfast.net",384],["buzzheavier.com",384],["tickhosting.com",385],["in91vip.win",386],["datavaults.co",387],["t-online.de",389],["upornia.*",[390,391]],["bobs-tube.com",392],["pornohirsch.net",393],["bembed.net",394],["embedv.net",394],["javguard.club",394],["listeamed.net",394],["v6embed.xyz",394],["vembed.*",394],["vid-guard.com",394],["vinomo.xyz",394],["nekolink.site",[395,396]],["141jav.com",397],["aagmaal.com",397],["camcam.cc",397],["netfapx.com",397],["javdragon.org",397],["javneon.tv",397],["javsaga.ninja",397],["pixsera.net",398],["jnews5.com",399],["pc-builds.com",400],["reuters.com",400],["today.com",400],["videogamer.com",400],["wrestlinginc.com",400],["greenbaypressgazette.com",401],["usatoday.com",[401,402]],["ydr.com",401],["247sports.com",403],["indiatimes.com",404],["netzwelt.de",405],["filmibeat.com",406],["goodreturns.in",406],["mykhel.com",406],["daemonanime.net",406],["luckydice.net",406],["adarima.org",406],["weatherwx.com",406],["sattaguess.com",406],["winshell.de",406],["rosasidan.ws",406],["upiapi.in",406],["networkhint.com",406],["thichcode.net",406],["texturecan.com",406],["tikmate.app",[406,613]],["arcaxbydz.id",406],["quotesshine.com",406],["arcade.buzzrtv.com",407],["arcade.dailygazette.com",407],["arcade.lemonde.fr",407],["arena.gamesforthebrain.com",407],["bestpuzzlesandgames.com",407],["cointiply.arkadiumarena.com",407],["gamelab.com",407],["games.abqjournal.com",407],["games.amny.com",407],["games.bellinghamherald.com",407],["games.besthealthmag.ca",407],["games.bnd.com",407],["games.boston.com",407],["games.bostonglobe.com",407],["games.bradenton.com",407],["games.centredaily.com",407],["games.charlottegames.cnhinews.com",407],["games.crosswordgiant.com",407],["games.dailymail.co.uk",407],["games.dallasnews.com",407],["games.daytondailynews.com",407],["games.denverpost.com",407],["games.everythingzoomer.com",407],["games.fresnobee.com",407],["games.gameshownetwork.com",407],["games.get.tv",407],["games.greatergood.com",407],["games.heraldonline.com",407],["games.heraldsun.com",407],["games.idahostatesman.com",407],["games.insp.com",407],["games.islandpacket.com",407],["games.journal-news.com",407],["games.kansas.com",407],["games.kansascity.com",407],["games.kentucky.com",407],["games.lancasteronline.com",407],["games.ledger-enquirer.com",407],["games.macon.com",407],["games.mashable.com",407],["games.mercedsunstar.com",407],["games.metro.us",407],["games.metv.com",407],["games.miamiherald.com",407],["games.modbee.com",407],["games.moviestvnetwork.com",407],["games.myrtlebeachonline.com",407],["games.games.newsgames.parade.com",407],["games.pressdemocrat.com",407],["games.puzzlebaron.com",407],["games.puzzler.com",407],["games.puzzles.ca",407],["games.qns.com",407],["games.readersdigest.ca",407],["games.sacbee.com",407],["games.sanluisobispo.com",407],["games.sixtyandme.com",407],["games.sltrib.com",407],["games.springfieldnewssun.com",407],["games.star-telegram.com",407],["games.startribune.com",407],["games.sunherald.com",407],["games.theadvocate.com",407],["games.thenewstribune.com",407],["games.theolympian.com",407],["games.theportugalnews.com",407],["games.thestar.com",407],["games.thestate.com",407],["games.tri-cityherald.com",407],["games.triviatoday.com",407],["games.usnews.com",407],["games.word.tips",407],["games.wordgenius.com",407],["games.wtop.com",407],["jeux.meteocity.com",407],["juegos.as.com",407],["juegos.elnuevoherald.com",407],["juegos.elpais.com",407],["philly.arkadiumarena.com",407],["play.dictionary.com",407],["puzzles.bestforpuzzles.com",407],["puzzles.centralmaine.com",407],["puzzles.crosswordsolver.org",407],["puzzles.independent.co.uk",407],["puzzles.nola.com",407],["puzzles.pressherald.com",407],["puzzles.standard.co.uk",407],["puzzles.sunjournal.com",407],["arkadium.com",408],["abysscdn.com",[409,410]],["turtleviplay.xyz",411],["lared.cl",412],["atozmath.com",[412,434,435,436,437,438,439]],["hdfilmizlesen.com",413],["arcai.com",414],["my-code4you.blogspot.com",415],["flickr.com",416],["firefile.cc",417],["pestleanalysis.com",417],["kochamjp.pl",417],["tutorialforlinux.com",417],["whatsaero.com",417],["animeblkom.net",[417,431]],["blkom.com",417],["globes.co.il",[418,419]],["jardiner-malin.fr",420],["tw-calc.net",421],["ohmybrush.com",422],["talkceltic.net",423],["mentalfloss.com",424],["uprafa.com",425],["cube365.net",426],["wwwfotografgotlin.blogspot.com",427],["freelistenonline.com",427],["badassdownloader.com",428],["quickporn.net",429],["yellowbridge.com",430],["aosmark.com",432],["ctrlv.*",433],["newyorker.com",440],["brighteon.com",[441,442]],["more.tv",443],["video1tube.com",444],["alohatube.xyz",444],["4players.de",445],["onlinesoccermanager.com",445],["fshost.me",446],["link.cgtips.org",447],["hentaicloud.com",448],["paperzonevn.com",450],["9jarock.org",451],["fzmovies.info",451],["fztvseries.ng",451],["netnaijas.com",451],["hentaienglish.com",452],["hentaiporno.xxx",452],["venge.io",[453,454]],["btcbux.io",455],["its.porn",[456,457]],["atv.at",458],["2ndrun.tv",459],["rackusreads.com",459],["teachmemicro.com",459],["willcycle.com",459],["kusonime.com",[460,461]],["123movieshd.*",462],["imgur.com",[463,464,730]],["hentai-party.com",465],["hentaicomics.pro",465],["uproxy.*",466],["animesa.*",467],["subtitle.one",468],["subtitleone.cc",468],["mysexgames.com",469],["ancient-origins.*",470],["cinecalidad.*",[471,472]],["xnxx.com",473],["xvideos.*",473],["gdr-online.com",474],["mmm.dk",475],["iqiyi.com",[476,477,603]],["m.iqiyi.com",478],["nbcolympics.com",479],["apkhex.com",480],["indiansexstories2.net",481],["issstories.xyz",481],["1340kbbr.com",482],["gorgeradio.com",482],["kduk.com",482],["kedoam.com",482],["kejoam.com",482],["kelaam.com",482],["khsn1230.com",482],["kjmx.rocks",482],["kloo.com",482],["klooam.com",482],["klykradio.com",482],["kmed.com",482],["kmnt.com",482],["kool991.com",482],["kpnw.com",482],["kppk983.com",482],["krktcountry.com",482],["ktee.com",482],["kwro.com",482],["kxbxfm.com",482],["thevalley.fm",482],["quizlet.com",483],["dsocker1234.blogspot.com",484],["schoolcheats.net",[485,486]],["mgnet.xyz",487],["designtagebuch.de",488],["pixroute.com",489],["uploady.io",490],["calculator-online.net",491],["porngames.club",492],["sexgames.xxx",492],["111.90.159.132",493],["mobile-tracker-free.com",494],["pfps.gg",495],["social-unlock.com",496],["superpsx.com",497],["ninja.io",498],["sourceforge.net",499],["samfirms.com",500],["rapelust.com",501],["vtube.to",501],["desitelugusex.com",501],["dvdplay.*",501],["xvideos-downloader.net",501],["xxxvideotube.net",501],["sdefx.cloud",501],["nozomi.la",501],["banned.video",502],["madmaxworld.tv",502],["androidpolice.com",502],["babygaga.com",502],["backyardboss.net",502],["carbuzz.com",502],["cbr.com",502],["collider.com",502],["dualshockers.com",502],["footballfancast.com",502],["footballleagueworld.co.uk",502],["gamerant.com",502],["givemesport.com",502],["hardcoregamer.com",502],["hotcars.com",502],["howtogeek.com",502],["makeuseof.com",502],["moms.com",502],["movieweb.com",502],["pocket-lint.com",502],["pocketnow.com",502],["screenrant.com",502],["simpleflying.com",502],["thegamer.com",502],["therichest.com",502],["thesportster.com",502],["thethings.com",502],["thetravel.com",502],["topspeed.com",502],["xda-developers.com",502],["huffpost.com",503],["ingles.com",504],["spanishdict.com",504],["surfline.com",[505,506]],["play.tv3.ee",507],["play.tv3.lt",507],["play.tv3.lv",[507,508]],["tv3play.skaties.lv",507],["bulbagarden.net",509],["hollywoodlife.com",510],["mat6tube.com",511],["hotabis.com",512],["root-nation.com",512],["italpress.com",512],["airsoftmilsimnews.com",512],["artribune.com",512],["newtumbl.com",513],["apkmaven.*",514],["aruble.net",515],["nevcoins.club",516],["mail.com",517],["gmx.*",518],["mangakita.id",520],["avpgalaxy.net",521],["panda-novel.com",522],["lightsnovel.com",522],["eaglesnovel.com",522],["pandasnovel.com",522],["ewrc-results.com",523],["kizi.com",524],["cyberscoop.com",525],["fedscoop.com",525],["canale.live",526],["jeep-cj.com",527],["sponsorhunter.com",528],["cloudcomputingtopics.net",529],["likecs.com",530],["tiscali.it",531],["linkspy.cc",532],["adshnk.com",533],["chattanoogan.com",534],["adsy.pw",535],["playstore.pw",535],["windowspro.de",536],["tvtv.ca",537],["tvtv.us",537],["mydaddy.cc",538],["roadtrippin.fr",539],["vavada5com.com",540],["anyporn.com",[541,558]],["bravoporn.com",541],["bravoteens.com",541],["crocotube.com",541],["hellmoms.com",541],["hellporno.com",541],["sex3.com",541],["tubewolf.com",541],["xbabe.com",541],["xcum.com",541],["zedporn.com",541],["imagetotext.info",542],["infokik.com",543],["freepik.com",544],["ddwloclawek.pl",[545,546]],["www.seznam.cz",547],["deezer.com",548],["my-subs.co",549],["plaion.com",550],["slideshare.net",[551,552]],["ustreasuryyieldcurve.com",553],["businesssoftwarehere.com",554],["goo.st",554],["freevpshere.com",554],["softwaresolutionshere.com",554],["gamereactor.*",556],["madoohd.com",557],["doomovie-hd.*",557],["staige.tv",559],["androidadult.com",560],["streamvid.net",561],["watchtv24.com",562],["cellmapper.net",563],["medscape.com",564],["newscon.org",[565,566]],["wheelofgold.com",567],["drakecomic.*",567],["app.blubank.com",568],["mobileweb.bankmellat.ir",568],["chat.nrj.fr",569],["chat.tchatche.com",[569,584]],["ccthesims.com",576],["chromeready.com",576],["dtbps3games.com",576],["illustratemagazine.com",576],["uknip.co.uk",576],["vod.pl",577],["megadrive-emulator.com",578],["tvhay.*",[579,580]],["moviesapi.club",581],["bestx.stream",581],["watchx.top",581],["digimanie.cz",582],["svethardware.cz",582],["srvy.ninja",583],["cnn.com",[585,586,587]],["news.bg",588],["edmdls.com",589],["freshremix.net",589],["scenedl.org",589],["trakt.tv",590],["client.falixnodes.net",[591,592]],["shroomers.app",593],["classicalradio.com",594],["di.fm",594],["jazzradio.com",594],["radiotunes.com",594],["rockradio.com",594],["zenradio.com",594],["getthit.com",595],["techedubyte.com",596],["soccerinhd.com",596],["movie-th.tv",597],["iwanttfc.com",598],["nutraingredients-asia.com",599],["nutraingredients-latam.com",599],["nutraingredients-usa.com",599],["nutraingredients.com",599],["ozulscansen.com",600],["nexusmods.com",601],["lookmovie.*",602],["lookmovie2.to",602],["biletomat.pl",604],["hextank.io",[605,606]],["filmizlehdfilm.com",[607,608,609,610]],["filmizletv.*",[607,608,609,610]],["fullfilmizle.cc",[607,608,609,610]],["gofilmizle.net",[607,608,609,610]],["cimanow.cc",611],["bgmiupdate.com.in",611],["freex2line.online",612],["btvplus.bg",614],["sagewater.com",615],["redlion.net",615],["filmweb.pl",616],["satdl.com",617],["vidstreaming.xyz",618],["everand.com",619],["myradioonline.pl",620],["cbs.com",621],["paramountplus.com",621],["colourxh.site",622],["fullxh.com",622],["galleryxh.site",622],["megaxh.com",622],["movingxh.world",622],["seexh.com",622],["unlockxh4.com",622],["valuexh.life",622],["xhaccess.com",622],["xhadult2.com",622],["xhadult3.com",622],["xhadult4.com",622],["xhadult5.com",622],["xhamster.*",622],["xhamster1.*",622],["xhamster10.*",622],["xhamster11.*",622],["xhamster12.*",622],["xhamster13.*",622],["xhamster14.*",622],["xhamster15.*",622],["xhamster16.*",622],["xhamster17.*",622],["xhamster18.*",622],["xhamster19.*",622],["xhamster20.*",622],["xhamster2.*",622],["xhamster3.*",622],["xhamster4.*",622],["xhamster42.*",622],["xhamster46.com",622],["xhamster5.*",622],["xhamster7.*",622],["xhamster8.*",622],["xhamsterporno.mx",622],["xhbig.com",622],["xhbranch5.com",622],["xhchannel.com",622],["xhdate.world",622],["xhlease.world",622],["xhmoon5.com",622],["xhofficial.com",622],["xhopen.com",622],["xhplanet1.com",622],["xhplanet2.com",622],["xhreal2.com",622],["xhreal3.com",622],["xhspot.com",622],["xhtotal.com",622],["xhtree.com",622],["xhvictory.com",622],["xhwebsite.com",622],["xhwebsite2.com",622],["xhwebsite5.com",622],["xhwide1.com",622],["xhwide2.com",622],["xhwide5.com",622],["file-upload.net",624],["acortalo.*",[625,626,627,628]],["acortar.*",[625,626,627,628]],["megadescarga.net",[625,626,627,628]],["megadescargas.net",[625,626,627,628]],["hentaihaven.xxx",629],["jacquieetmicheltv2.net",631],["a2zapk.*",632],["fcportables.com",[633,634]],["emurom.net",635],["freethesaurus.com",[636,637]],["thefreedictionary.com",[636,637]],["oeffentlicher-dienst.info",638],["im9.eu",[639,640]],["dcdlplayer8a06f4.xyz",641],["ultimate-guitar.com",642],["claimbits.net",643],["sexyscope.net",644],["kickassanime.*",645],["recherche-ebook.fr",646],["virtualdinerbot.com",646],["zonebourse.com",647],["pink-sluts.net",648],["andhrafriends.com",649],["benzinpreis.de",650],["defenseone.com",651],["govexec.com",651],["nextgov.com",651],["route-fifty.com",651],["sharing.wtf",652],["wetter3.de",653],["esportivos.fun",654],["cosmonova-broadcast.tv",655],["538.nl",656],["hartvannederland.nl",656],["kijk.nl",656],["shownieuws.nl",656],["vandaaginside.nl",656],["rock.porn",[657,658]],["videzz.net",[659,660]],["ezaudiobookforsoul.com",661],["club386.com",662],["decompiler.com",[663,664]],["littlebigsnake.com",665],["easyfun.gg",666],["smailpro.com",667],["ilgazzettino.it",668],["ilmessaggero.it",668],["3bmeteo.com",[669,670]],["mconverter.eu",671],["lover937.net",672],["10gb.vn",673],["pes6.es",674],["tactics.tools",[675,676]],["boundhub.com",677],["alocdnnetu.xyz",678],["reliabletv.me",679],["jakondo.ru",680],["appnee.com",680],["trueachievements.com",680],["truesteamachievements.com",680],["truetrophies.com",680],["filecrypt.*",681],["wired.com",683],["spankbang.*",[684,685,686,732,733]],["hulu.com",[687,688,689]],["hanime.tv",690],["nhentai.net",[691,692,693]],["pouvideo.*",694],["povvideo.*",694],["povw1deo.*",694],["povwideo.*",694],["powv1deo.*",694],["powvibeo.*",694],["powvideo.*",694],["powvldeo.*",694],["anonymfile.com",695],["gofile.to",695],["dotycat.com",696],["rateyourmusic.com",697],["reporterpb.com.br",698],["blog-dnz.com",700],["18adultgames.com",701],["colnect.com",[702,703]],["adultgamesworld.com",704],["servustv.com",[705,706]],["reviewdiv.com",707],["parametric-architecture.com",708],["laurelberninteriors.com",[709,735]],["voiceofdenton.com",710],["concealednation.org",710],["askattest.com",712],["opensubtitles.com",713],["savefiles.com",714],["streamup.ws",715],["goodstream.one",716],["lecrabeinfo.net",717],["cerberusapp.com",718],["smashkarts.io",719],["beamng.wesupply.cx",720],["wowtv.de",[721,722]],["jsfiddle.net",[723,724]],["www.google.*",725],["tacobell.com",726],["zefoy.com",727],["cnet.com",728],["natgeotv.com",731],["globo.com",734],["wayfair.com",736]]);
const exceptionsMap = new Map([["cloudflare.com",[0]],["pingit.com",[176]],["loan.bgmi32bitapk.in",[296]],["lookmovie.studio",[602]]]);
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
