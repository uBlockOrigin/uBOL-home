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
const argsList = [["console.clear","undefined"],["aclib.runInPagePush","{}","as","callback"],["aclib.runBanner","{}","as","function"],["aclib.runPop","throwFunc"],["aclib.runInterstitial","{}","as","function"],["adBlockDetected","undefined"],["akamaiDisableServerIpLookup","noopFunc"],["DD_RUM.addAction","noopFunc"],["nads.createAd","trueFunc"],["dvtag.getTargeting","trueFunc"],["ga","noopFunc"],["huecosPBS.nstdX","null"],["DTM.trackAsyncPV","noopFunc"],["_satellite","{}"],["_satellite.getVisitorId","noopFunc"],["newPageViewSpeedtest","noopFunc"],["pubg.unload","noopFunc"],["generateGalleryAd","noopFunc"],["mediator","noopFunc"],["Object.prototype.subscribe","noopFunc"],["gbTracker","{}"],["gbTracker.sendAutoSearchEvent","noopFunc"],["Object.prototype.vjsPlayer.ads","noopFunc"],["network_user_id",""],["google.ima.OmidVerificationVendor","{}"],["Object.prototype.omidAccessModeRules","{}"],["googletag.cmd","{}"],["_aps","{}"],["Object.prototype.setDisableFlashAds","noopFunc"],["DD_RUM.addTiming","noopFunc"],["chameleonVideo.adDisabledRequested","true"],["AdmostClient","{}"],["analytics","{}"],["datalayer","[]"],["Object.prototype.isInitialLoadDisabled","noopFunc"],["listingGoogleEETracking","noopFunc"],["dcsMultiTrack","noopFunc"],["urlStrArray","noopFunc"],["pa","{}"],["Object.prototype.setConfigurations","noopFunc"],["Object.prototype.bk_addPageCtx","noopFunc"],["Object.prototype.bk_doJSTag","noopFunc"],["passFingerPrint","noopFunc"],["optimizely","{}"],["optimizely.initialized","true"],["google_optimize","{}"],["google_optimize.get","noopFunc"],["_gsq","{}"],["_gsq.push","noopFunc"],["stmCustomEvent","noopFunc"],["_gsDevice",""],["iom","{}"],["iom.c","noopFunc"],["_conv_q","{}"],["_conv_q.push","noopFunc"],["google.ima.settings.setDisableFlashAds","noopFunc"],["pa.privacy","{}"],["populateClientData4RBA","noopFunc"],["YT.ImaManager","noopFunc"],["UOLPD","{}"],["UOLPD.dataLayer","{}"],["__configuredDFPTags","{}"],["URL_VAST_YOUTUBE","{}"],["Adman","{}"],["dplus","{}"],["dplus.track","noopFunc"],["_satellite.track","noopFunc"],["google.ima.dai","{}"],["gfkS2sExtension","{}"],["gfkS2sExtension.HTML5VODExtension","noopFunc"],["AnalyticsEventTrackingJS","{}"],["AnalyticsEventTrackingJS.addToBasket","noopFunc"],["AnalyticsEventTrackingJS.trackErrorMessage","noopFunc"],["initializeslideshow","noopFunc"],["fathom","{}"],["fathom.trackGoal","noopFunc"],["Origami","{}"],["Origami.fastclick","noopFunc"],["jad","undefined"],["hasAdblocker","true"],["Sentry","{}"],["Sentry.init","noopFunc"],["TRC","{}"],["TRC._taboolaClone","[]"],["fp","{}"],["fp.t","noopFunc"],["fp.s","noopFunc"],["initializeNewRelic","noopFunc"],["turnerAnalyticsObj","{}"],["turnerAnalyticsObj.setVideoObject4AnalyticsProperty","noopFunc"],["optimizelyDatafile","{}"],["optimizelyDatafile.featureFlags","[]"],["fingerprint","{}"],["fingerprint.getCookie","noopFunc"],["gform.utils","noopFunc"],["gform.utils.trigger","noopFunc"],["get_fingerprint","noopFunc"],["moatPrebidApi","{}"],["moatPrebidApi.getMoatTargetingForPage","noopFunc"],["cpd_configdata","{}"],["cpd_configdata.url",""],["yieldlove_cmd","{}"],["yieldlove_cmd.push","noopFunc"],["dataLayer.push","noopFunc"],["_etmc","{}"],["_etmc.push","noopFunc"],["freshpaint","{}"],["freshpaint.track","noopFunc"],["ShowRewards","noopFunc"],["stLight","{}"],["stLight.options","noopFunc"],["DD_RUM.addError","noopFunc"],["sensorsDataAnalytic201505","{}"],["sensorsDataAnalytic201505.init","noopFunc"],["sensorsDataAnalytic201505.quick","noopFunc"],["sensorsDataAnalytic201505.track","noopFunc"],["s","{}"],["s.tl","noopFunc"],["smartech","noopFunc"],["sensors","{}"],["sensors.init","noopFunc"],["sensors.track","noopFunc"],["adn","{}"],["adn.clearDivs","noopFunc"],["_vwo_code","{}"],["gtag","noopFunc"],["_taboola","{}"],["_taboola.push","noopFunc"],["clicky","{}"],["clicky.goal","noopFunc"],["WURFL","{}"],["_sp_.config.events.onSPPMObjectReady","noopFunc"],["gtm","{}"],["gtm.trackEvent","noopFunc"],["mParticle.Identity.getCurrentUser","noopFunc"],["JSGlobals.prebidEnabled","false"],["elasticApm","{}"],["elasticApm.init","noopFunc"],["ga.sendGaEvent","noopFunc"],["adobe","{}"],["MT","{}"],["MT.track","noopFunc"],["ClickOmniPartner","noopFunc"],["adex","{}"],["adex.getAdexUser","noopFunc"],["Adkit","noopFunc"],["Object.prototype.shouldExpectGoogleCMP","false"],["apntag.refresh","noopFunc"],["pa.sendEvent","noopFunc"],["Munchkin","{}"],["Munchkin.init","noopFunc"],["ttd_dom_ready","noopFunc"],["ramp","undefined"],["appInfo.snowplow.trackSelfDescribingEvent","noopFunc"],["_vwo_code.init","noopFunc"],["adobePageView","noopFunc"],["dapTracker","{}"],["dapTracker.track","noopFunc"],["ytInitialPlayerResponse.playerAds","undefined"],["ytInitialPlayerResponse.adPlacements","undefined"],["ytInitialPlayerResponse.adSlots","undefined"],["playerResponse.adPlacements","undefined"],["nsShowMaxCount","0"],["objVc.interstitial_web",""],["_ml_ads_ns","null"],["_sp_.config","undefined"],["isAdBlockActive","false"],["AdController","noopFunc"],["console.clear","noopFunc"],["Object.prototype.hideAds","true"],["Object.prototype._getSalesHouseConfigurations","noopFunc"],["vast_urls","{}"],["sadbl","false"],["adblockcheck","false"],["arrvast","[]"],["blurred","false"],["flashvars.adv_pre_src",""],["showPopunder","false"],["page_params.holiday_promo","true"],["adsEnabled","true"],["String.prototype.charAt","trueFunc"],["ad_blocker","false"],["blockAdBlock","true"],["VikiPlayer.prototype.pingAbFactor","noopFunc"],["player.options.disableAds","true"],["console.clear","trueFunc"],["flashvars.adv_pre_vast",""],["flashvars.adv_pre_vast_alt",""],["x_width","1"],["_site_ads_ns","true"],["luxuretv.config",""],["Object.prototype.AdOverlay","noopFunc"],["tkn_popunder","null"],["can_run_ads","true"],["adsBlockerDetector","noopFunc"],["globalThis","null"],["adblock","false"],["__ads","true"],["FlixPop.isPopGloballyEnabled","falseFunc"],["check_adblock","true"],["$.magnificPopup.open","noopFunc"],["adsenseadBlock","noopFunc"],["adblockSuspected","false"],["xRds","true"],["cRAds","false"],["disasterpingu","false"],["App.views.adsView.adblock","false"],["flashvars.adv_pause_html",""],["$.fx.off","true"],["adBlockEnabled","false"],["puShown","true"],["showAds","true"],["attr","{}"],["scriptSrc",""],["cxStartDetectionProcess","noopFunc"],["isAdBlocked","false"],["adblock","noopFunc"],["path",""],["_ctrl_vt.blocked.ad_script","false"],["blockAdBlock","noopFunc"],["caca","noopFunc"],["Ok","true"],["safelink.adblock","false"],["openPopunder","noopFunc"],["ClickUnder","noopFunc"],["flashvars.adv_pre_url",""],["flashvars.protect_block",""],["flashvars.video_click_url",""],["adBlock","false"],["spoof","noopFunc"],["btoa","null"],["sp_ad","true"],["adsBlocked","false"],["_sp_.msg.displayMessage","noopFunc"],["CaptchmeState.adb","undefined"],["UhasAB","false"],["adNotificationDetected","false"],["atob","noopFunc"],["_pop","noopFunc"],["CnnXt.Event.fire","noopFunc"],["_ti_update_user","noopFunc"],["valid","1"],["vastAds","[]"],["adblock","1"],["frg","1"],["time","0"],["ads","true"],["GNCA_Ad_Support","true"],["Date.now","noopFunc"],["jQuery.adblock","1"],["VMG.Components.Adblock","false"],["adblockDetector","trueFunc"],["hasPoped","true"],["flashvars.video_click_url","undefined"],["flashvars.adv_start_html",""],["flashvars.popunder_url",""],["flashvars.adv_post_src",""],["flashvars.adv_post_url",""],["jQuery.adblock","false"],["google_jobrunner","true"],["sec","0"],["gadb","false"],["checkadBlock","noopFunc"],["clientSide.adbDetect","noopFunc"],["HTMLAnchorElement.prototype.click","noopFunc"],["cmnnrunads","true"],["adBlocker","false"],["adBlockDetected","noopFunc"],["StileApp.somecontrols.adBlockDetected","noopFunc"],["MDCore.adblock","0"],["google_tag_data","noopFunc"],["noAdBlock","true"],["adsOk","true"],["check","true"],["isal","true"],["document.hidden","true"],["awm","true"],["adblockEnabled","false"],["is_adblocked","false"],["pogo.intermission.staticAdIntermissionPeriod","0"],["SubmitDownload1","noopFunc"],["t","0"],["ckaduMobilePop","noopFunc"],["tieneAdblock","0"],["adsAreBlocked","false"],["cmgpbjs","false"],["displayAdblockOverlay","false"],["google","false"],["Math.pow","noopFunc"],["openInNewTab","noopFunc"],["runAdBlocker","false"],["Adblock","false"],["flashvars.logo_url",""],["flashvars.logo_text",""],["nlf.custom.userCapabilities","false"],["count","0"],["LoadThisScript","true"],["showPremLite","true"],["closeBlockerModal","false"],["adBlockDetector.isEnabled","falseFunc"],["areAdsDisplayed","true"],["gkAdsWerbung","true"],["pop_target","null"],["is_banner","true"],["$easyadvtblock","false"],["show_dfp_preroll","false"],["show_youtube_preroll","false"],["doads","true"],["jsUnda","noopFunc"],["AlobaidiDetectAdBlock","true"],["Advertisement","1"],["adBlockDetected","false"],["abp1","1"],["pr_okvalida","true"],["$.ajax","trueFunc"],["cnbc.canShowAds","true"],["ue_adb_chk","1"],["firefaucet","true"],["cRAds","true"],["uas","[]"],["flashvars.popunder_url","undefined"],["adv","true"],["prerollMain","undefined"],["canRunAds","true"],["Fingerprint2","true"],["dclm_ajax_var.disclaimer_redirect_url",""],["load_pop_power","noopFunc"],["adBlockDetected","true"],["Time_Start","0"],["blockAdBlock","trueFunc"],["ezstandalone.enabled","true"],["foundation.adPlayer.bitmovin","{}"],["weltConfig.switches.videoAdBlockBlocker","false"],["DL8_GLOBALS.enableAdSupport","false"],["DL8_GLOBALS.useHomad","false"],["DL8_GLOBALS.enableHomadDesktop","false"],["DL8_GLOBALS.enableHomadMobile","false"],["Object.prototype.adReinsertion","noopFunc"],["getHomadConfig","noopFunc"],["ab","false"],["go_popup","{}"],["noBlocker","true"],["adsbygoogle","null"],["fabActive","false"],["gWkbAdVert","true"],["noblock","true"],["wgAffiliateEnabled","false"],["ads","null"],["detectAdblock","noopFunc"],["adsLoadable","true"],["ASSetCookieAds","null"],["letShowAds","true"],["ulp_noadb","true"],["Object.prototype.adblock_detected","false"],["timeSec","0"],["adsbygoogle.loaded","true"],["ads_unblocked","true"],["xxSetting.adBlockerDetection","false"],["open","undefined"],["Drupal.behaviors.adBlockerPopup","null"],["fake_ad","true"],["koddostu_com_adblock_yok","null"],["adsbygoogle","trueFunc"],["player.ads.cuePoints","undefined"],["adBlockDetected","null"],["better_ads_adblock","1"],["Adv_ab","false"],["sgpbCanRunAds","true"],["document.hidden","false"],["hasFocus","trueFunc"],["navigator.brave","undefined"],["Object.prototype.isAllAdClose","true"],["document.hasFocus","trueFunc"],["isRequestPresent","true"],["fouty","true"],["Notification","undefined"],["protection","noopFunc"],["private","false"],["navigator.webkitTemporaryStorage.queryUsageAndQuota","noopFunc"],["document.onkeydown","noopFunc"],["showadas","true"],["alert","throwFunc"],["aSl.gcd","0"],["window.adLink","null"],["detectedAdblock","undefined"],["isTabActive","true"],["document.cookie","adcadg=insurance","adcadg=insurance"],["clicked","2"],["ov.advertising.tisoomi.loadScript","noopFunc"],["abp","false"],["hommy","{}"],["hommy.waitUntil","noopFunc"],["flashvars.mlogo",""],["vpPrerollVideo","undefined"],["PlayerConfig.config.CustomAdSetting","[]"],["PlayerConfig.trusted","true"],["PlayerConfig.config.AffiliateAdViewLevel","3"],["univresalP","noopFunc"],["hold_click","false"],["tie.ad_blocker_detector","false"],["admiral","noopFunc"],["gnt.x.uam"],["gnt.u.z","true"],["__INITIAL_DATA__.siteData.admiralScript"],["objAd.loadAdShield","noopFunc"],["window.myAd.runAd","noopFunc"],["detectAdBlock","noopFunc"],["__INITIAL_STATE__.config.theme.ads.isAdBlockerEnabled","false"],["__INITIAL_STATE__.gameLists.gamesNoPrerollIds.indexOf","trueFunc"],["document.ontouchend","null"],["document.onclick","null"],["playID","1"],["app._data.ads","[]"],["pubAdsService","trueFunc"],["config.pauseInspect","false"],["appContext.adManager.context.current.adFriendly","false"],["blockAdBlock._options.baitClass","null"],["document.blocked_var","1"],["____ads_js_blocked","false"],["wIsAdBlocked","false"],["WebSite.plsDisableAdBlock","null"],["ads_blocked","false"],["samDetected","false"],["countClicks","0"],["settings.adBlockerDetection","false"],["mixpanel.get_distinct_id","true"],["fuckAdBlock._options.baitClass","null"],["bscheck.adblocker","noopFunc"],["qpcheck.ads","noopFunc"],["isContentBlocked","falseFunc"],["CloudflareApps.installs.Ik7rmQ4t95Qk.options.measureDomain","undefined"],["detectAB1","noopFunc"],["uBlockOriginDetected","false"],["googletag._vars_","{}"],["googletag._loadStarted_","true"],["googletag._loaded_","true"],["google_unique_id","1"],["google.javascript","{}"],["google.javascript.ads","{}"],["google_global_correlator","1"],["paywallGateway.truncateContent","noopFunc"],["adBlockDisabled","true"],["__NEXT_DATA__.props.pageProps.adVideo","undefined"],["blockedElement","noopFunc"],["popit","false"],["adBlockerDetected","false"],["abu","falseFunc"],["countdown","0"],["decodeURI","noopFunc"],["flashvars.adv_postpause_vast",""],["xv_ad_block","0"],["openWindow","noopFunc"],["vidorev_jav_plugin_video_ads_object.vid_ads_m_video_ads",""],["adsProvider.init","noopFunc"],["SDKLoaded","true"],["blockAdBlock._creatBait","null"],["POPUNDER_ENABLED","false"],["plugins.preroll","noopFunc"],["errcode","0"],["DHAntiAdBlocker","true"],["showada","true"],["showax","true"],["p18","undefined"],["ADBLOCKED","false"],["Object.prototype.adsEnabled","false"],["adb","0"],["String.fromCharCode","trueFunc"],["adblock_use","false"],["Object.prototype.adblockFound","false"],["createCanvas","noopFunc"],["document.bridCanRunAds","true"],["playerAdSettings.adLink",""],["playerAdSettings.waitTime","0"],["xv.sda.pp.init","noopFunc"],["isAdsLoaded","true"],["adblockerAlert","noopFunc"],["Object.prototype.parseXML","noopFunc"],["Object.prototype.blackscreenDuration","1"],["Object.prototype.adPlayerId",""],["adblockDetect","noopFunc"],["style","noopFunc"],["history.pushState","noopFunc"],["google_unique_id","6"],["__NEXT_DATA__.props.pageProps.adsConfig","undefined"],["new_config.timedown","0"],["truex","{}"],["truex.client","noopFunc"],["hiddenProxyDetected","false"],["SteadyWidgetSettings.adblockActive","false"],["proclayer","noopFunc"],["timeleft","0"],["load_ads","trueFunc"],["starPop","1"],["Object.prototype.ads","noopFunc"],["detectBlockAds","noopFunc"],["ga","trueFunc"],["ad_link",""],["penciBlocksArray","[]"],["App.AdblockDetected","false"],["SF.adblock","true"],["startfrom","0"],["D4zz","noopFunc"],["Object.prototype.ads.nopreroll_","true"],["HP_Scout.adBlocked","false"],["SD_IS_BLOCKING","false"],["Object.prototype.isPremium","true"],["__BACKPLANE_API__.renderOptions.showAdBlock",""],["Object.prototype.isNoAds","{}"],["tv3Cmp.ConsentGiven","true"],["setupSkin","noopFunc"],["Object.prototype.enableInterstitial","false"],["ads","undefined"],["td_ad_background_click_link","undefined"],["POSTPART_prototype.ADKEY","noopFunc"],["adBlockDetected","falseFunc"],["divWidth","1"],["noAdBlock","noopFunc"],["AdService.info.abd","noopFunc"],["adBlockDetectionResult","undefined"],["popped","true"],["puShown1","true"],["passthetest","true"],["pandaAdviewValidate","true"],["canGetAds","true"],["ad_blocker_active","false"],["init_welcome_ad","noopFunc"],["moneyAbovePrivacyByvCDN","true"],["document.body.contains","trueFunc"],["popunder","undefined"],["distance","0"],["document.onclick",""],["adEnable","true"],["displayAds","0"],["_adshrink.skiptime","0"],["AbleToRunAds","true"],["PreRollAd.timeCounter","0"],["abpblocked","undefined"],["paAddUnit","noopFunc"],["adt","0"],["test_adblock","noopFunc"],["adblockDetector","noopFunc"],["vastEnabled","false"],["detectadsbocker","false"],["two_worker_data_js.js","[]"],["FEATURE_DISABLE_ADOBE_POPUP_BY_COUNTRY","true"],["questpassGuard","noopFunc"],["isAdBlockerEnabled","false"],["sssp","emptyObj"],["smartLoaded","true"],["timeLeft","0"],["Cookiebot","noopFunc"],["feature_flags.interstitial_ads_flag","false"],["feature_flags.interstitials_every_four_slides","false"],["waldoSlotIds","true"],["adblockstatus","false"],["adScriptLoaded","true"],["adblockEnabled","noopFunc"],["adSettings","[]"],["banner_is_blocked","false"],["Object.prototype.adBlocked","false"],["chp_adblock_browser","noopFunc"],["googleAd","true"],["Brid.A9.prototype.backfillAdUnits","[]"],["dct","0"],["slideShow.displayInterstitial","true"],["googletag","true"],["tOS2","150"],["checkAdBlocker","noopFunc"],["navigator.standalone","true"],["ShowAdvertising","{}"],["empire.pop","undefined"],["empire.direct","undefined"],["empire.directHideAds","undefined"],["empire.mediaData.advisorMovie","1"],["empire.mediaData.advisorSerie","1"],["setTimer","0"],["penci_adlbock.ad_blocker_detector","0"],["Object.prototype.adblockDetector","noopFunc"],["blext","true"],["vidorev_jav_plugin_video_ads_object","{}"],["vidorev_jav_plugin_video_ads_object_post","{}"],["S_Popup","10"],["rabLimit","-1"],["nudgeAdBlock","noopFunc"],["feedBack.showAffilaePromo","noopFunc"],["FAVE.settings.ads.ssai.prod.clips.enabled","false"],["FAVE.settings.ads.ssai.prod.liveAuth.enabled","false"],["FAVE.settings.ads.ssai.prod.liveUnauth.enabled","false"],["HTMLScriptElement.prototype.onerror","null"],["loadpagecheck","noopFunc"],["art3m1sItemNames.affiliate-wrapper","\"\""],["window.adngin","{}"],["amzn_aps_csm","{}"],["isAdBlockerActive","noopFunc"],["di.app.WebplayerApp.Ads.Adblocks.app.AdBlockDetectApp.startWithParent","false"],["sharedController.adblockDetector","noopFunc"],["checkAdsStatus","noopFunc"],["ads","[]"],["settings.adBlockDetectionEnabled","false"],["displayInterstitialAdConfig","false"],["checkAdBlockeraz","noopFunc"],["blockingAds","false"],["Yii2App.playbackTimeout","0"],["QiyiPlayerProphetData.a.data","{}"],["toggleAdBlockInfo","falseFunc"],["aipAPItag.prerollSkipped","true"],["aipAPItag.setPreRollStatus","trueFunc"],["reklam_1_saniye","0"],["reklam_1_gecsaniye","0"],["reklamsayisi","1"],["reklam_1",""],["HTMLImageElement.prototype.onerror","undefined"],["HTMLImageElement.prototype.onload","undefined"],["powerAPITag","emptyObj"],["playerEnhancedConfig.run","throwFunc"],["aoAdBlockDetected","false"],["rodo.checkIsDidomiConsent","noopFunc"],["xtime","0"],["Div_popup",""],["Scribd.Blob.AdBlockerModal","noopFunc"],["AddAdsV2I.addBlock","false"],["hasAdBlocker","false"],["initials.yld-pdpopunder",""],["download_click","true"],["advertisement3","true"],["clicked","true"],["eClicked","true"],["number","0"],["sync","true"],["PlayerLogic.prototype.detectADB","noopFunc"],["showPopunder","noopFunc"],["Object.prototype.prerollAds","[]"],["notifyMe","noopFunc"],["adsClasses","undefined"],["gsecs","0"],["dvsize","52"],["majorse","true"],["completed","1"],["testerli","false"],["w87.abd","noopFunc"],["w87.dsab","noopFunc"],["document.referrer",""],["Object.prototype.setNeedShowAdblockWarning","noopFunc"],["NoAdBlock","noopFunc"],["adList","[]"],["ifmax","true"],["nitroAds.abp","true"],["onloadUI","noopFunc"],["PageLoader.DetectAb","0"],["one_time","1"],["consentGiven","true"],["GEMG.GPT.Interstitial","noopFunc"],["amiblock","0"],["karte3","18"],["sandDetect","noopFunc"],["amodule.data","emptyArr"],["Object.prototype.ADBLOCK_DETECTION",""],["postroll","undefined"],["interstitial","undefined"],["isAdBlockDetected","false"],["pData.adblockOverlayEnabled","0"],["cabdSettings","undefined"],["td_ad_background_click_link"],["malisx","true"],["alim","true"],["ADS.isBannersEnabled","false"],["EASYFUN_ADS_CAN_RUN","true"],["adsbygoogle_ama_fc_has_run","true"],["jwDefaults.advertising","{}"],["elimina_profilazione","1"],["elimina_pubblicita","1"],["abd","{}"],["checkerimg","noopFunc"],["detectedAdblock","noopFunc"],["Object.prototype.DetectByGoogleAd","noopFunc"],["nitroAds","{}"],["nitroAds.createAd","noopFunc"],["NativeAd","noopFunc"],["Blob","noopFunc"],["window.navigator.brave","undefined"],["HTMLScriptElement.prototype.onerror","undefined"],["isAdblock","false"],["openPop","noopFunc"],["cns.library","true"],["BJSShowUnder","{}"],["BJSShowUnder.bindTo","noopFunc"],["BJSShowUnder.add","noopFunc"],["Object.prototype._parseVAST","noopFunc"],["Object.prototype.createAdBlocker","noopFunc"],["Object.prototype.isAdPeriod","falseFunc"],["ABLK","false"],["_n_app.popunder","null"],["_n_app.options.ads.show_popunders","false"],["N_BetterJsPop.object","{}"],["isAdb","false"],["countDown","0"],["runCheck","noopFunc"],["adsSlotRenderEndSeen","true"],["showModal","noopFunc"],["flashvars.mlogo_link",""],["isAdBlocked","noopFunc"],["URLlist","[]"],["aaw","{}"],["aaw.processAdsOnPage","noopFunc"],["doOpen","undefined"],["OneTrust","{}"],["OneTrust.IsAlertBoxClosed","trueFunc"],["FOXIZ_MAIN_SCRIPT.siteAccessDetector","noopFunc"],["openAdBlockPopup","noopFunc"],["Object.prototype._adsDisabled","true"],["advanced_ads_check_adblocker","noopFunc"],["canRunAds","1"],["attestHasAdBlockerActivated","true"],["extInstalled","true"],["SaveFiles.add","noopFunc"],["detectSandbox","noopFunc"],["adbon","0"],["LCI.adBlockDetectorEnabled","false"],["stoCazzo","true"],["adblockDetected","false"],["importFAB","undefined"],["window.__CONFIGURATION__.adInsertion.enabled","false"],["window.__CONFIGURATION__.features.enableAdBlockerDetection","false"],["_carbonads","{}"],["_bsa","{}"],["rwt","noopFunc"],["bmak.js_post","false"],["firebase.analytics","noopFunc"],["Object.prototype.updateModifiedCommerceUrl","noopFunc"],["flashvars.event_reporting",""],["Object.prototype.has_opted_out_tracking","trueFunc"],["Visitor","{}"],["send_gravity_event","noopFunc"],["send_recommendation_event","noopFunc"],["libAnalytics.data.get","noopFunc"],["adthrive._components.start","noopFunc"],["navigator.sendBeacon","noopFunc"]];
const hostnamesMap = new Map([["jilliandescribecompany.com",0],["gogoanime.*",[0,199]],["adrianmissionminute.com",0],["alejandrocenturyoil.com",0],["alleneconomicmatter.com",0],["bethshouldercan.com",0],["bigclatterhomesguideservice.com",0],["brittneystandardwestern.com",0],["brookethoughi.com",0],["brucevotewithin.com",0],["cindyeyefinal.com",0],["denisegrowthwide.com",0],["diananatureforeign.com",0],["donaldlineelse.com",0],["edwardarriveoften.com",0],["erikcoldperson.com",0],["evelynthankregion.com",0],["graceaddresscommunity.com",0],["heatherdiscussionwhen.com",0],["heatherwholeinvolve.com",0],["housecardsummerbutton.com",0],["jamessoundcost.com",0],["jamiesamewalk.com",0],["jasminetesttry.com",0],["jasonresponsemeasure.com",0],["jayservicestuff.com",0],["jennifercertaindevelopment.com",0],["jessicaglassauthor.com",0],["johnalwayssame.com",0],["johntryopen.com",0],["jonathansociallike.com",0],["josephseveralconcern.com",0],["kellywhatcould.com",0],["kennethofficialitem.com",0],["kristiesoundsimply.com",0],["lisatrialidea.com",0],["lorimuchbenefit.com",0],["loriwithinfamily.com",0],["lukecomparetwo.com",0],["mariatheserepublican.com",0],["markstyleall.com",0],["michaelapplysome.com",0],["morganoperationface.com",0],["nathanfromsubject.com",0],["paulkitchendark.com",0],["rebeccaneverbase.com",0],["richardsignfish.com",0],["roberteachfinal.com",0],["robertordercharacter.com",0],["robertplacespace.com",0],["ryanagoinvolve.com",0],["sandratableother.com",0],["sandrataxeight.com",0],["sethniceletter.com",0],["shannonpersonalcost.com",0],["susanhavekeep.com",0],["tinycat-voe-fashion.com",0],["toddpartneranimal.com",0],["troyyourlead.com",0],["uptodatefinishconference.com",0],["uptodatefinishconferenceroom.com",0],["voe.sx",0],["maxfinishseveral.com",0],["voe.sx>>",0],["javboys.tv>>",0],["freeplayervideo.com",0],["nazarickol.com",0],["player-cdn.com",0],["playhydrax.com",[0,409,410]],["rabbitstream.net",0],["fmovies.*",0],["japscan.*",[1,2,3,4]],["u26bekrb.fun",5],["br.de",6],["indeed.com",7],["zillow.com",[7,111]],["pasteboard.co",8],["bbc.com",9],["clickhole.com",10],["deadspin.com",10],["gizmodo.com",10],["jalopnik.com",10],["jezebel.com",10],["kotaku.com",10],["lifehacker.com",10],["splinternews.com",10],["theinventory.com",10],["theonion.com",10],["theroot.com",10],["thetakeout.com",10],["pewresearch.org",10],["los40.com",[11,12]],["as.com",12],["caracol.com.co",12],["telegraph.co.uk",[13,14]],["poweredbycovermore.com",[13,66]],["lumens.com",[13,66]],["verizon.com",15],["humanbenchmark.com",16],["politico.com",17],["officedepot.co.cr",[18,19]],["officedepot.*",[20,21]],["usnews.com",22],["coolmathgames.com",[23,285,286,287]],["video.gazzetta.it",[24,25]],["oggi.it",[24,25]],["manoramamax.com",24],["factable.com",26],["thedailybeast.com",27],["zee5.com",28],["gala.fr",29],["geo.fr",29],["voici.fr",29],["gloucestershirelive.co.uk",30],["arsiv.mackolik.com",31],["jacksonguitars.com",32],["scandichotels.com",33],["stylist.co.uk",34],["nettiauto.com",35],["thaiairways.com",[36,37]],["cerbahealthcare.it",[38,39]],["futura-sciences.com",[38,56]],["toureiffel.paris",38],["campusfrance.org",[38,148]],["tiendaenlinea.claro.com.ni",[40,41]],["tieba.baidu.com",42],["fandom.com",[43,44,346]],["grasshopper.com",[45,46]],["epson.com.cn",[47,48,49,50]],["oe24.at",[51,52]],["szbz.de",51],["platform.autods.com",[53,54]],["kcra.com",55],["wcvb.com",55],["sportdeutschland.tv",55],["citibank.com.sg",57],["uol.com.br",[58,59,60,61,62]],["gazzetta.gr",63],["digicol.dpm.org.cn",[64,65]],["virginmediatelevision.ie",67],["larazon.es",[68,69]],["waitrosecellar.com",[70,71,72]],["kicker.de",[73,388]],["sharpen-free-design-generator.netlify.app",[74,75]],["help.cashctrl.com",[76,77]],["gry-online.pl",78],["vidaextra.com",79],["commande.rhinov.pro",[80,81]],["ecom.wixapps.net",[80,81]],["tipranks.com",[82,83]],["iceland.co.uk",[84,85,86]],["socket.pearsoned.com",87],["tntdrama.com",[88,89]],["trutv.com",[88,89]],["mobile.de",[90,91]],["ioe.vn",[92,93]],["geiriadur.ac.uk",[92,96]],["welsh-dictionary.ac.uk",[92,96]],["bikeportland.org",[94,95]],["biologianet.com",[59,60,61]],["10.com.au",[97,98]],["10play.com.au",[97,98]],["sunshine-live.de",[99,100]],["whatismyip.com",[101,102]],["myfitnesspal.com",103],["netoff.co.jp",[104,105]],["bluerabbitrx.com",[104,105]],["foundit.*",[106,107]],["clickjogos.com.br",108],["bristan.com",[109,110]],["share.hntv.tv",[112,113,114,115]],["forum.dji.com",[112,115]],["unionpayintl.com",[112,114]],["streamelements.com",112],["optimum.net",[116,117]],["hdfcfund.com",118],["user.guancha.cn",[119,120]],["sosovalue.com",121],["bandyforbundet.no",[122,123]],["tatacommunications.com",124],["kb.arlo.com",[124,154]],["suamusica.com.br",[125,126,127]],["macrotrends.net",[128,129]],["code.world",130],["smartcharts.net",130],["topgear.com",131],["eservice.directauto.com",[132,133]],["nbcsports.com",134],["standard.co.uk",135],["pruefernavi.de",[136,137]],["17track.net",138],["visible.com",139],["hagerty.com",[140,141]],["marketplace.nvidia.com",142],["kino.de",[143,144]],["9now.nine.com.au",145],["worldstar.com",146],["prisjakt.no",147],["developer.arm.com",[149,150]],["sterkinekor.com",151],["iogames.space",152],["id.condenast.com",153],["tires.costco.com",155],["livemint.com",[156,157]],["m.youtube.com",[158,159,160,161]],["music.youtube.com",[158,159,160,161]],["tv.youtube.com",[158,159,160,161]],["www.youtube.com",[158,159,160,161]],["youtubekids.com",[158,159,160,161]],["youtube-nocookie.com",[158,159,160,161]],["eu-proxy.startpage.com",[158,159,161]],["timesofindia.indiatimes.com",162],["economictimes.indiatimes.com",163],["motherless.com",164],["sueddeutsche.de",165],["watchanimesub.net",166],["wcoanimesub.tv",166],["wcoforever.net",166],["freeviewmovies.com",166],["filehorse.com",166],["guidetnt.com",166],["starmusiq.*",166],["sp-today.com",166],["linkvertise.com",166],["eropaste.net",166],["getpaste.link",166],["sharetext.me",166],["wcofun.*",166],["note.sieuthuthuat.com",166],["gadgets.es",[166,459]],["amateurporn.co",[166,255]],["wiwo.de",167],["primewire.*",168],["alphaporno.com",[168,541]],["porngem.com",168],["shortit.pw",[168,241]],["familyporn.tv",168],["sbplay.*",168],["id45.cyou",168],["85po.com",[168,226]],["milfnut.*",168],["k1nk.co",168],["watchasians.cc",168],["sankakucomplex.com",169],["player.glomex.com",170],["merkur.de",170],["tz.de",170],["sxyprn.*",171],["hqq.*",[172,173]],["waaw.*",[173,174]],["hotpornfile.org",173],["younetu.*",173],["multiup.us",173],["peliculas8k.com",[173,174]],["czxxx.org",173],["vtplayer.online",173],["vvtplayer.*",173],["netu.ac",173],["netu.frembed.lol",173],["123link.*",175],["adshort.*",175],["mitly.us",175],["linkrex.net",175],["linx.cc",175],["oke.io",175],["linkshorts.*",175],["dz4link.com",175],["adsrt.*",175],["linclik.com",175],["shrt10.com",175],["vinaurl.*",175],["loptelink.com",175],["adfloz.*",175],["cut-fly.com",175],["linkfinal.com",175],["payskip.org",175],["cutpaid.com",175],["linkjust.com",175],["leechpremium.link",175],["icutlink.com",[175,260]],["oncehelp.com",175],["rgl.vn",175],["reqlinks.net",175],["bitlk.com",175],["qlinks.eu",175],["link.3dmili.com",175],["short-fly.com",175],["foxseotools.com",175],["dutchycorp.*",175],["shortearn.*",175],["pingit.*",175],["link.turkdown.com",175],["7r6.com",175],["oko.sh",175],["ckk.ai",175],["fc.lc",175],["fstore.biz",175],["shrink.*",175],["cuts-url.com",175],["eio.io",175],["exe.app",175],["exee.io",175],["exey.io",175],["skincarie.com",175],["exeo.app",175],["tmearn.*",175],["coinlyhub.com",[175,324]],["adsafelink.com",175],["aii.sh",175],["megalink.*",175],["cybertechng.com",[175,340]],["cutdl.xyz",175],["iir.ai",175],["shorteet.com",[175,358]],["miniurl.*",175],["smoner.com",175],["gplinks.*",175],["odisha-remix.com",[175,340]],["xpshort.com",[175,340]],["upshrink.com",175],["clk.*",175],["easysky.in",175],["veganab.co",175],["golink.bloggerishyt.in",175],["birdurls.com",175],["vipurl.in",175],["jameeltips.us",175],["promo-visits.site",175],["satoshi-win.xyz",[175,374]],["shorterall.com",175],["encurtandourl.com",175],["forextrader.site",175],["postazap.com",175],["cety.app",175],["exego.app",[175,372]],["cutlink.net",175],["cutyurls.com",175],["cutty.app",175],["cutnet.net",175],["jixo.online",175],["tinys.click",[175,340]],["cpm.icu",175],["panyshort.link",175],["enagato.com",175],["pandaznetwork.com",175],["tpi.li",175],["oii.la",175],["recipestutorials.com",175],["shrinkme.*",175],["shrinke.*",175],["mrproblogger.com",175],["themezon.net",175],["shrinkforearn.in",175],["oii.io",175],["du-link.in",175],["atglinks.com",175],["thotpacks.xyz",175],["megaurl.in",175],["megafly.in",175],["simana.online",175],["fooak.com",175],["joktop.com",175],["evernia.site",175],["falpus.com",175],["link.paid4link.com",175],["exalink.fun",175],["shortxlinks.com",175],["upfion.com",175],["upfiles.app",175],["upfiles-urls.com",175],["flycutlink.com",[175,340]],["linksly.co",175],["link1s.*",175],["pkr.pw",175],["imagenesderopaparaperros.com",175],["shortenbuddy.com",175],["apksvip.com",175],["4cash.me",175],["namaidani.com",175],["shortzzy.*",175],["teknomuda.com",175],["shorttey.*",[175,323]],["miuiku.com",175],["savelink.site",175],["lite-link.*",175],["adcorto.*",175],["samaa-pro.com",175],["miklpro.com",175],["modapk.link",175],["ccurl.net",175],["linkpoi.me",175],["pewgame.com",175],["haonguyen.top",175],["zshort.*",175],["crazyblog.in",175],["cutearn.net",175],["rshrt.com",175],["filezipa.com",175],["dz-linkk.com",175],["upfiles.*",175],["theblissempire.com",175],["finanzas-vida.com",175],["adurly.cc",175],["paid4.link",175],["link.asiaon.top",175],["go.gets4link.com",175],["linkfly.*",175],["beingtek.com",175],["shorturl.unityassets4free.com",175],["disheye.com",175],["techymedies.com",175],["techysuccess.com",175],["za.gl",[175,275]],["bblink.com",175],["myad.biz",175],["swzz.xyz",175],["vevioz.com",175],["charexempire.com",175],["clk.asia",175],["sturls.com",175],["myshrinker.com",175],["snowurl.com",[175,340]],["wplink.*",175],["rocklink.in",175],["techgeek.digital",175],["download3s.net",175],["shortx.net",175],["tlin.me",175],["bestcash2020.com",175],["adslink.pw",175],["novelssites.com",175],["faucetcrypto.net",175],["trxking.xyz",175],["weadown.com",175],["m.bloggingguidance.com",175],["link.codevn.net",175],["link4rev.site",175],["c2g.at",175],["bitcosite.com",[175,555]],["cryptosh.pro",175],["windowslite.net",[175,340]],["viewfr.com",175],["cl1ca.com",175],["4br.me",175],["fir3.net",175],["seulink.*",175],["encurtalink.*",175],["kiddyshort.com",175],["watchmygf.me",[176,200]],["camwhores.*",[176,186,225,226,227]],["camwhorez.tv",[176,186,225,226]],["cambay.tv",[176,207,225,252,254,255,256,257]],["fpo.xxx",[176,207]],["sexemix.com",176],["heavyfetish.com",[176,729]],["thotcity.su",176],["viralxxxporn.com",[176,392]],["tube8.*",[177,178]],["you-porn.com",178],["youporn.*",178],["youporngay.com",178],["youpornru.com",178],["redtube.*",178],["9908ww.com",178],["adelaidepawnbroker.com",178],["bztube.com",178],["hotovs.com",178],["insuredhome.org",178],["nudegista.com",178],["pornluck.com",178],["vidd.se",178],["pornhub.*",[178,312]],["pornhub.com",178],["pornerbros.com",179],["freep.com",179],["porn.com",180],["tune.pk",181],["noticias.gospelmais.com.br",182],["techperiod.com",182],["viki.com",[183,184]],["watch-series.*",185],["watchseries.*",185],["vev.*",185],["vidop.*",185],["vidup.*",185],["sleazyneasy.com",[186,187,188]],["smutr.com",[186,320]],["tktube.com",186],["yourporngod.com",[186,187]],["javbangers.com",[186,449]],["camfox.com",186],["camthots.tv",[186,252]],["shegotass.info",186],["amateur8.com",186],["bigtitslust.com",186],["ebony8.com",186],["freeporn8.com",186],["lesbian8.com",186],["maturetubehere.com",186],["sortporn.com",186],["motherporno.com",[186,187,207,254]],["theporngod.com",[186,187]],["watchdirty.to",[186,226,227,255]],["pornsocket.com",189],["luxuretv.com",190],["porndig.com",[191,192]],["webcheats.com.br",193],["ceesty.com",[194,195]],["gestyy.com",[194,195]],["corneey.com",195],["destyy.com",195],["festyy.com",195],["sh.st",195],["mitaku.net",195],["angrybirdsnest.com",196],["zrozz.com",196],["clix4btc.com",196],["4tests.com",196],["goltelevision.com",196],["news-und-nachrichten.de",196],["laradiobbs.net",196],["urlaubspartner.net",196],["produktion.de",196],["cinemaxxl.de",196],["bladesalvador.com",196],["tempr.email",196],["cshort.org",196],["friendproject.net",196],["covrhub.com",196],["katfile.com",[196,623]],["trust.zone",196],["business-standard.com",196],["planetsuzy.org",197],["empflix.com",198],["xmovies8.*",199],["masteranime.tv",199],["0123movies.*",199],["gostream.*",199],["gomovies.*",199],["transparentcalifornia.com",200],["deepbrid.com",201],["webnovel.com",202],["streamwish.*",[203,204]],["oneupload.to",204],["wishfast.top",204],["rubystm.com",204],["rubyvid.com",204],["rubyvidhub.com",204],["stmruby.com",204],["streamruby.com",204],["schwaebische.de",205],["8tracks.com",206],["3movs.com",207],["bravoerotica.net",[207,254]],["youx.xxx",207],["camclips.tv",[207,320]],["xtits.*",[207,254]],["camflow.tv",[207,254,255,293,392]],["camhoes.tv",[207,252,254,255,293,392]],["xmegadrive.com",207],["xxxymovies.com",207],["xxxshake.com",207],["gayck.com",207],["xhand.com",[207,254]],["analdin.com",[207,254]],["revealname.com",208],["golfchannel.com",209],["stream.nbcsports.com",209],["mathdf.com",209],["gamcore.com",210],["porcore.com",210],["porngames.tv",210],["69games.xxx",210],["javmix.app",210],["haaretz.co.il",211],["haaretz.com",211],["hungama.com",211],["a-o.ninja",211],["anime-odcinki.pl",211],["shortgoo.blogspot.com",211],["tonanmedia.my.id",[211,575]],["yurasu.xyz",211],["isekaipalace.com",211],["plyjam.*",[212,213]],["ennovelas.com",[213,217]],["foxsports.com.au",214],["canberratimes.com.au",214],["thesimsresource.com",215],["fxporn69.*",216],["vipbox.*",217],["viprow.*",217],["ctrl.blog",218],["sportlife.es",219],["finofilipino.org",220],["desbloqueador.*",221],["xberuang.*",222],["teknorizen.*",222],["mysflink.blogspot.com",222],["ashemaletube.*",223],["paktech2.com",223],["assia.tv",224],["assia4.com",224],["cwtvembeds.com",[226,253]],["camlovers.tv",226],["porntn.com",226],["pornissimo.org",226],["sexcams-24.com",[226,255]],["watchporn.to",[226,255]],["camwhorez.video",226],["footstockings.com",[226,227,255]],["xmateur.com",[226,227,255]],["multi.xxx",227],["weatherx.co.in",[228,229]],["sunbtc.space",228],["subtorrents.*",230],["subtorrents1.*",230],["newpelis.*",230],["pelix.*",230],["allcalidad.*",230],["infomaniakos.*",230],["ojogos.com.br",231],["powforums.com",232],["supforums.com",232],["studybullet.com",232],["usgamer.net",233],["recordonline.com",233],["freebitcoin.win",234],["e-monsite.com",234],["coindice.win",234],["freiepresse.de",235],["investing.com",236],["tornadomovies.*",237],["mp3fiber.com",238],["chicoer.com",239],["dailybreeze.com",239],["dailybulletin.com",239],["dailynews.com",239],["delcotimes.com",239],["eastbaytimes.com",239],["macombdaily.com",239],["ocregister.com",239],["pasadenastarnews.com",239],["pe.com",239],["presstelegram.com",239],["redlandsdailyfacts.com",239],["reviewjournal.com",239],["santacruzsentinel.com",239],["saratogian.com",239],["sentinelandenterprise.com",239],["sgvtribune.com",239],["tampabay.com",239],["times-standard.com",239],["theoaklandpress.com",239],["trentonian.com",239],["twincities.com",239],["whittierdailynews.com",239],["bostonherald.com",239],["dailycamera.com",239],["sbsun.com",239],["dailydemocrat.com",239],["montereyherald.com",239],["orovillemr.com",239],["record-bee.com",239],["redbluffdailynews.com",239],["reporterherald.com",239],["thereporter.com",239],["timescall.com",239],["timesheraldonline.com",239],["ukiahdailyjournal.com",239],["dailylocal.com",239],["mercurynews.com",239],["suedkurier.de",240],["anysex.com",242],["icdrama.*",243],["mangasail.*",243],["pornve.com",244],["file4go.*",245],["coolrom.com.au",245],["marie-claire.es",246],["gamezhero.com",246],["flashgirlgames.com",246],["onlinesudoku.games",246],["mpg.football",246],["sssam.com",246],["globalnews.ca",247],["drinksmixer.com",248],["leitesculinaria.com",248],["fupa.net",249],["browardpalmbeach.com",250],["dallasobserver.com",250],["houstonpress.com",250],["miaminewtimes.com",250],["phoenixnewtimes.com",250],["westword.com",250],["nowtv.com.tr",251],["caminspector.net",252],["camwhoreshd.com",252],["camgoddess.tv",252],["gay4porn.com",254],["mypornhere.com",254],["mangovideo.*",255],["love4porn.com",255],["thotvids.com",255],["watchmdh.to",255],["celebwhore.com",255],["cluset.com",255],["sexlist.tv",255],["4kporn.xxx",255],["xhomealone.com",255],["lusttaboo.com",[255,519]],["hentai-moon.com",255],["camhub.cc",[255,682]],["mediapason.it",258],["linkspaid.com",258],["tuotromedico.com",258],["neoteo.com",258],["phoneswiki.com",258],["celebmix.com",258],["myneobuxportal.com",258],["oyungibi.com",258],["25yearslatersite.com",258],["jeshoots.com",259],["techhx.com",259],["karanapk.com",259],["flashplayer.fullstacks.net",261],["cloudapps.herokuapp.com",261],["youfiles.herokuapp.com",261],["texteditor.nsspot.net",261],["temp-mail.org",262],["asianclub.*",263],["javhdporn.net",263],["vidmoly.to",264],["comnuan.com",265],["veedi.com",266],["battleboats.io",266],["anitube.*",267],["fruitlab.com",267],["haddoz.net",267],["streamingcommunity.*",267],["garoetpos.com",267],["stiletv.it",268],["mixdrop.*",269],["hqtv.biz",270],["liveuamap.com",271],["audycje.tokfm.pl",272],["shush.se",273],["allkpop.com",274],["empire-anime.*",[275,570,571,572,573,574]],["empire-streaming.*",[275,570,571,572]],["empire-anime.com",[275,570,571,572]],["empire-streamz.fr",[275,570,571,572]],["empire-stream.*",[275,570,571,572]],["pickcrackpasswords.blogspot.com",276],["kfrfansub.com",277],["thuglink.com",277],["voipreview.org",277],["illicoporno.com",278],["lavoixdux.com",278],["tonpornodujour.com",278],["jacquieetmichel.net",278],["swame.com",278],["vosfemmes.com",278],["voyeurfrance.net",278],["jacquieetmicheltv.net",[278,630,631]],["pogo.com",279],["cloudvideo.tv",280],["legionjuegos.org",281],["legionpeliculas.org",281],["legionprogramas.org",281],["16honeys.com",282],["elespanol.com",283],["remodelista.com",284],["audiofanzine.com",288],["uploadev.*",289],["developerinsider.co",290],["thehindu.com",291],["cambro.tv",[292,293]],["boobsradar.com",[293,392,699]],["nibelungen-kurier.de",294],["adfoc.us",295],["tackledsoul.com",295],["adrino1.bonloan.xyz",295],["vi-music.app",295],["instanders.app",295],["rokni.xyz",295],["keedabankingnews.com",295],["tea-coffee.net",295],["spatsify.com",295],["newedutopics.com",295],["getviralreach.in",295],["edukaroo.com",295],["funkeypagali.com",295],["careersides.com",295],["nayisahara.com",295],["wikifilmia.com",295],["infinityskull.com",295],["viewmyknowledge.com",295],["iisfvirtual.in",295],["starxinvestor.com",295],["jkssbalerts.com",295],["sahlmarketing.net",295],["filmypoints.in",295],["fitnessholic.net",295],["moderngyan.com",295],["sattakingcharts.in",295],["bankshiksha.in",295],["earn.mpscstudyhub.com",295],["earn.quotesopia.com",295],["money.quotesopia.com",295],["best-mobilegames.com",295],["learn.moderngyan.com",295],["bharatsarkarijobalert.com",295],["quotesopia.com",295],["creditsgoal.com",295],["bgmi32bitapk.in",295],["techacode.com",295],["trickms.com",295],["ielts-isa.edu.vn",295],["winezones.in",[295,386]],["loan.punjabworks.com",295],["sptfy.be",295],["mcafee-com.com",[295,372]],["pianetamountainbike.it",296],["barchart.com",297],["modelisme.com",298],["parasportontario.ca",298],["prescottenews.com",298],["nrj-play.fr",299],["hackingwithreact.com",300],["gutekueche.at",301],["peekvids.com",302],["playvids.com",302],["pornflip.com",302],["redensarten-index.de",303],["vw-page.com",304],["viz.com",[305,306]],["0rechner.de",307],["configspc.com",308],["xopenload.me",308],["uptobox.com",308],["uptostream.com",308],["japgay.com",309],["mega-debrid.eu",310],["dreamdth.com",311],["diaridegirona.cat",313],["diariodeibiza.es",313],["diariodemallorca.es",313],["diarioinformacion.com",313],["eldia.es",313],["emporda.info",313],["farodevigo.es",313],["laopinioncoruna.es",313],["laopiniondemalaga.es",313],["laopiniondemurcia.es",313],["laopiniondezamora.es",313],["laprovincia.es",313],["levante-emv.com",313],["mallorcazeitung.es",313],["regio7.cat",313],["superdeporte.es",313],["playpaste.com",314],["cnbc.com",315],["primevideo.com",316],["read.amazon.*",[316,711]],["firefaucet.win",317],["74k.io",[318,319]],["cloudwish.xyz",319],["gradehgplus.com",319],["javindo.site",319],["javindosub.site",319],["kamehaus.net",319],["movearnpre.com",319],["arabshentai.com>>",319],["javdo.cc>>",319],["javenglish.cc>>",319],["javhd.*>>",319],["javhdz.*>>",319],["roshy.tv>>",319],["sextb.*>>",319],["fullhdxxx.com",321],["pornclassic.tube",322],["tubepornclassic.com",322],["etonline.com",323],["creatur.io",323],["lookcam.*",323],["drphil.com",323],["urbanmilwaukee.com",323],["ontiva.com",323],["hideandseek.world",323],["myabandonware.com",323],["kendam.com",323],["wttw.com",323],["synonyms.com",323],["definitions.net",323],["hostmath.com",323],["camvideoshub.com",323],["minhaconexao.com.br",323],["home-made-videos.com",325],["amateur-couples.com",325],["slutdump.com",325],["artificialnudes.com",325],["bdsmkingdom.xyz",325],["cosplaynsfw.xyz",325],["crazytoys.xyz",325],["hardcorelesbian.xyz",325],["pornfeet.xyz",325],["pornahegao.xyz",325],["sexontheboat.xyz",325],["dpstream.*",326],["produsat.com",327],["bluemediafiles.*",328],["12thman.com",329],["acusports.com",329],["atlantic10.com",329],["auburntigers.com",329],["baylorbears.com",329],["bceagles.com",329],["bgsufalcons.com",329],["big12sports.com",329],["bigten.org",329],["bradleybraves.com",329],["butlersports.com",329],["cmumavericks.com",329],["conferenceusa.com",329],["cyclones.com",329],["dartmouthsports.com",329],["daytonflyers.com",329],["dbupatriots.com",329],["dbusports.com",329],["denverpioneers.com",329],["fduknights.com",329],["fgcuathletics.com",329],["fightinghawks.com",329],["fightingillini.com",329],["floridagators.com",329],["friars.com",329],["friscofighters.com",329],["gamecocksonline.com",329],["goarmywestpoint.com",329],["gobison.com",329],["goblueraiders.com",329],["gobobcats.com",329],["gocards.com",329],["gocreighton.com",329],["godeacs.com",329],["goexplorers.com",329],["goetbutigers.com",329],["gofrogs.com",329],["gogriffs.com",329],["gogriz.com",329],["golobos.com",329],["gomarquette.com",329],["gopack.com",329],["gophersports.com",329],["goprincetontigers.com",329],["gopsusports.com",329],["goracers.com",329],["goshockers.com",329],["goterriers.com",329],["gotigersgo.com",329],["gousfbulls.com",329],["govandals.com",329],["gowyo.com",329],["goxavier.com",329],["gozags.com",329],["gozips.com",329],["griffinathletics.com",329],["guhoyas.com",329],["gwusports.com",329],["hailstate.com",329],["hamptonpirates.com",329],["hawaiiathletics.com",329],["hokiesports.com",329],["huskers.com",329],["icgaels.com",329],["iuhoosiers.com",329],["jsugamecocksports.com",329],["longbeachstate.com",329],["loyolaramblers.com",329],["lrtrojans.com",329],["lsusports.net",329],["morrisvillemustangs.com",329],["msuspartans.com",329],["muleriderathletics.com",329],["mutigers.com",329],["navysports.com",329],["nevadawolfpack.com",329],["niuhuskies.com",329],["nkunorse.com",329],["nuhuskies.com",329],["nusports.com",329],["okstate.com",329],["olemisssports.com",329],["omavs.com",329],["ovcsports.com",329],["owlsports.com",329],["purduesports.com",329],["redstormsports.com",329],["richmondspiders.com",329],["sfajacks.com",329],["shupirates.com",329],["siusalukis.com",329],["smcgaels.com",329],["smumustangs.com",329],["soconsports.com",329],["soonersports.com",329],["themw.com",329],["tulsahurricane.com",329],["txst.com",329],["txstatebobcats.com",329],["ubbulls.com",329],["ucfknights.com",329],["ucirvinesports.com",329],["uconnhuskies.com",329],["uhcougars.com",329],["uicflames.com",329],["umterps.com",329],["uncwsports.com",329],["unipanthers.com",329],["unlvrebels.com",329],["uoflsports.com",329],["usdtoreros.com",329],["utahstateaggies.com",329],["utepathletics.com",329],["utrockets.com",329],["uvmathletics.com",329],["uwbadgers.com",329],["villanova.com",329],["wkusports.com",329],["wmubroncos.com",329],["woffordterriers.com",329],["1pack1goal.com",329],["bcuathletics.com",329],["bubraves.com",329],["goblackbears.com",329],["golightsgo.com",329],["gomcpanthers.com",329],["goutsa.com",329],["mercerbears.com",329],["pirateblue.com",329],["pirateblue.net",329],["pirateblue.org",329],["quinnipiacbobcats.com",329],["towsontigers.com",329],["tribeathletics.com",329],["tribeclub.com",329],["utepminermaniacs.com",329],["utepminers.com",329],["wkutickets.com",329],["aopathletics.org",329],["atlantichockeyonline.com",329],["bigsouthnetwork.com",329],["bigsouthsports.com",329],["chawomenshockey.com",329],["dbupatriots.org",329],["drakerelays.org",329],["ecac.org",329],["ecacsports.com",329],["emueagles.com",329],["emugameday.com",329],["gculopes.com",329],["godrakebulldog.com",329],["godrakebulldogs.com",329],["godrakebulldogs.net",329],["goeags.com",329],["goislander.com",329],["goislanders.com",329],["gojacks.com",329],["gomacsports.com",329],["gseagles.com",329],["hubison.com",329],["iowaconference.com",329],["ksuowls.com",329],["lonestarconference.org",329],["mascac.org",329],["midwestconference.org",329],["mountaineast.org",329],["niu-pack.com",329],["nulakers.ca",329],["oswegolakers.com",329],["ovcdigitalnetwork.com",329],["pacersports.com",329],["rmacsports.org",329],["rollrivers.com",329],["samfordsports.com",329],["uncpbraves.com",329],["usfdons.com",329],["wiacsports.com",329],["alaskananooks.com",329],["broncathleticfund.com",329],["cameronaggies.com",329],["columbiacougars.com",329],["etownbluejays.com",329],["gobadgers.ca",329],["golancers.ca",329],["gometrostate.com",329],["gothunderbirds.ca",329],["kentstatesports.com",329],["lehighsports.com",329],["lopers.com",329],["lycoathletics.com",329],["lycomingathletics.com",329],["maraudersports.com",329],["mauiinvitational.com",329],["msumavericks.com",329],["nauathletics.com",329],["nueagles.com",329],["nwusports.com",329],["oceanbreezenyc.org",329],["patriotathleticfund.com",329],["pittband.com",329],["principiaathletics.com",329],["roadrunnersathletics.com",329],["sidearmsocial.com",329],["snhupenmen.com",329],["stablerarena.com",329],["stoutbluedevils.com",329],["uwlathletics.com",329],["yumacs.com",329],["collegefootballplayoff.com",329],["csurams.com",329],["cubuffs.com",329],["gobearcats.com",329],["gohuskies.com",329],["mgoblue.com",329],["osubeavers.com",329],["pittsburghpanthers.com",329],["rolltide.com",329],["texassports.com",329],["thesundevils.com",329],["uclabruins.com",329],["wvuathletics.com",329],["wvusports.com",329],["arizonawildcats.com",329],["calbears.com",329],["cuse.com",329],["georgiadogs.com",329],["goducks.com",329],["goheels.com",329],["gostanford.com",329],["insidekstatesports.com",329],["insidekstatesports.info",329],["insidekstatesports.net",329],["insidekstatesports.org",329],["k-stateathletics.com",329],["k-statefootball.net",329],["k-statefootball.org",329],["k-statesports.com",329],["k-statesports.net",329],["k-statesports.org",329],["k-statewomenshoops.com",329],["k-statewomenshoops.net",329],["k-statewomenshoops.org",329],["kstateathletics.com",329],["kstatefootball.net",329],["kstatefootball.org",329],["kstatesports.com",329],["kstatewomenshoops.com",329],["kstatewomenshoops.net",329],["kstatewomenshoops.org",329],["ksuathletics.com",329],["ksusports.com",329],["scarletknights.com",329],["showdownforrelief.com",329],["syracusecrunch.com",329],["texastech.com",329],["theacc.com",329],["ukathletics.com",329],["usctrojans.com",329],["utahutes.com",329],["utsports.com",329],["wsucougars.com",329],["vidlii.com",[329,355]],["tricksplit.io",329],["fangraphs.com",330],["stern.de",331],["geo.de",331],["brigitte.de",331],["welt.de",332],["tvspielfilm.de",[333,334,335,336]],["tvtoday.de",[333,334,335,336]],["chip.de",[333,334,335,336]],["focus.de",[333,334,335,336]],["fitforfun.de",[333,334,335,336]],["n-tv.de",337],["player.rtl2.de",338],["planetaminecraft.com",339],["cravesandflames.com",340],["codesnse.com",340],["flyad.vip",340],["lapresse.ca",341],["kolyoom.com",342],["ilovephd.com",342],["negumo.com",343],["games.wkb.jp",[344,345]],["kenshi.fandom.com",347],["hausbau-forum.de",348],["homeairquality.org",348],["faucettronn.click",348],["fake-it.ws",349],["laksa19.github.io",350],["1shortlink.com",351],["u-s-news.com",352],["luscious.net",353],["makemoneywithurl.com",354],["junkyponk.com",354],["healthfirstweb.com",354],["vocalley.com",354],["yogablogfit.com",354],["howifx.com",[354,540]],["en.financerites.com",354],["mythvista.com",354],["livenewsflix.com",354],["cureclues.com",354],["apekite.com",354],["enit.in",354],["iammagnus.com",355],["dailyvideoreports.net",355],["unityassets4free.com",355],["docer.*",356],["resetoff.pl",356],["sexodi.com",356],["cdn77.org",357],["momxxxsex.com",358],["penisbuyutucum.net",358],["ujszo.com",359],["newsmax.com",360],["nadidetarifler.com",361],["siz.tv",361],["suzylu.co.uk",[362,363]],["onworks.net",364],["yabiladi.com",364],["downloadsoft.net",365],["newsobserver.com",366],["arkadiumhosted.com",366],["testlanguages.com",367],["newsinlevels.com",367],["videosinlevels.com",367],["procinehub.com",368],["bookmystrip.com",368],["imagereviser.com",369],["gyanitheme.com",370],["tech.trendingword.com",370],["blog.potterworld.co",370],["hipsonyc.com",370],["tech.pubghighdamage.com",370],["blog.itijobalert.in",370],["techkhulasha.com",370],["jiocinema.com",370],["rapid-cloud.co",370],["uploadmall.com",370],["4funbox.com",371],["nephobox.com",371],["1024tera.com",371],["terabox.*",371],["starkroboticsfrc.com",372],["sinonimos.de",372],["antonimos.de",372],["quesignifi.ca",372],["tiktokrealtime.com",372],["tiktokcounter.net",372],["tpayr.xyz",372],["poqzn.xyz",372],["ashrfd.xyz",372],["rezsx.xyz",372],["tryzt.xyz",372],["ashrff.xyz",372],["rezst.xyz",372],["dawenet.com",372],["erzar.xyz",372],["waezm.xyz",372],["waezg.xyz",372],["blackwoodacademy.org",372],["cryptednews.space",372],["vivuq.com",372],["swgop.com",372],["vbnmll.com",372],["telcoinfo.online",372],["dshytb.com",372],["btcbitco.in",[372,373]],["btcsatoshi.net",372],["cempakajaya.com",372],["crypto4yu.com",372],["readbitcoin.org",372],["wiour.com",372],["finish.addurl.biz",372],["aiimgvlog.fun",[372,376]],["laweducationinfo.com",372],["savemoneyinfo.com",372],["worldaffairinfo.com",372],["godstoryinfo.com",372],["successstoryinfo.com",372],["cxissuegk.com",372],["learnmarketinfo.com",372],["bhugolinfo.com",372],["armypowerinfo.com",372],["rsgamer.app",372],["phonereviewinfo.com",372],["makeincomeinfo.com",372],["gknutshell.com",372],["vichitrainfo.com",372],["workproductivityinfo.com",372],["dopomininfo.com",372],["hostingdetailer.com",372],["fitnesssguide.com",372],["tradingfact4u.com",372],["cryptofactss.com",372],["softwaredetail.com",372],["artoffocas.com",372],["insurancesfact.com",372],["travellingdetail.com",372],["advertisingexcel.com",372],["allcryptoz.net",372],["batmanfactor.com",372],["beautifulfashionnailart.com",372],["crewbase.net",372],["documentaryplanet.xyz",372],["crewus.net",372],["gametechreviewer.com",372],["midebalonu.net",372],["misterio.ro",372],["phineypet.com",372],["seory.xyz",372],["shinbhu.net",372],["shinchu.net",372],["substitutefor.com",372],["talkforfitness.com",372],["thefitbrit.co.uk",372],["thumb8.net",372],["thumb9.net",372],["topcryptoz.net",372],["uniqueten.net",372],["ultraten.net",372],["exactpay.online",372],["quins.us",372],["kiddyearner.com",372],["bildirim.*",375],["arahdrive.com",376],["appsbull.com",377],["diudemy.com",377],["maqal360.com",[377,378,379]],["lifesurance.info",380],["akcartoons.in",381],["cybercityhelp.in",381],["dl.apkmoddone.com",382],["phongroblox.com",382],["fuckingfast.net",383],["buzzheavier.com",383],["tickhosting.com",384],["in91vip.win",385],["marketrook.com",386],["datavaults.co",387],["t-online.de",389],["upornia.*",[390,391]],["bobs-tube.com",392],["pornohirsch.net",393],["bembed.net",394],["embedv.net",394],["javguard.club",394],["listeamed.net",394],["v6embed.xyz",394],["vembed.*",394],["vid-guard.com",394],["vinomo.xyz",394],["nekolink.site",[395,396]],["141jav.com",397],["aagmaal.com",397],["camcam.cc",397],["netfapx.com",397],["javdragon.org",397],["javneon.tv",397],["javsaga.ninja",397],["pixsera.net",398],["jnews5.com",399],["pc-builds.com",400],["reuters.com",400],["today.com",400],["videogamer.com",400],["wrestlinginc.com",400],["greenbaypressgazette.com",401],["usatoday.com",[401,402]],["ydr.com",401],["247sports.com",403],["indiatimes.com",404],["netzwelt.de",405],["filmibeat.com",406],["goodreturns.in",406],["mykhel.com",406],["daemonanime.net",406],["luckydice.net",406],["adarima.org",406],["weatherwx.com",406],["sattaguess.com",406],["winshell.de",406],["rosasidan.ws",406],["upiapi.in",406],["networkhint.com",406],["thichcode.net",406],["texturecan.com",406],["tikmate.app",[406,613]],["arcaxbydz.id",406],["quotesshine.com",406],["arcade.buzzrtv.com",407],["arcade.dailygazette.com",407],["arcade.lemonde.fr",407],["arena.gamesforthebrain.com",407],["bestpuzzlesandgames.com",407],["cointiply.arkadiumarena.com",407],["gamelab.com",407],["games.abqjournal.com",407],["games.amny.com",407],["games.bellinghamherald.com",407],["games.besthealthmag.ca",407],["games.bnd.com",407],["games.boston.com",407],["games.bostonglobe.com",407],["games.bradenton.com",407],["games.centredaily.com",407],["games.charlottegames.cnhinews.com",407],["games.crosswordgiant.com",407],["games.dailymail.co.uk",407],["games.dallasnews.com",407],["games.daytondailynews.com",407],["games.denverpost.com",407],["games.everythingzoomer.com",407],["games.fresnobee.com",407],["games.gameshownetwork.com",407],["games.get.tv",407],["games.greatergood.com",407],["games.heraldonline.com",407],["games.heraldsun.com",407],["games.idahostatesman.com",407],["games.insp.com",407],["games.islandpacket.com",407],["games.journal-news.com",407],["games.kansas.com",407],["games.kansascity.com",407],["games.kentucky.com",407],["games.lancasteronline.com",407],["games.ledger-enquirer.com",407],["games.macon.com",407],["games.mashable.com",407],["games.mercedsunstar.com",407],["games.metro.us",407],["games.metv.com",407],["games.miamiherald.com",407],["games.modbee.com",407],["games.moviestvnetwork.com",407],["games.myrtlebeachonline.com",407],["games.games.newsgames.parade.com",407],["games.pressdemocrat.com",407],["games.puzzlebaron.com",407],["games.puzzler.com",407],["games.puzzles.ca",407],["games.qns.com",407],["games.readersdigest.ca",407],["games.sacbee.com",407],["games.sanluisobispo.com",407],["games.sixtyandme.com",407],["games.sltrib.com",407],["games.springfieldnewssun.com",407],["games.star-telegram.com",407],["games.startribune.com",407],["games.sunherald.com",407],["games.theadvocate.com",407],["games.thenewstribune.com",407],["games.theolympian.com",407],["games.theportugalnews.com",407],["games.thestar.com",407],["games.thestate.com",407],["games.tri-cityherald.com",407],["games.triviatoday.com",407],["games.usnews.com",407],["games.word.tips",407],["games.wordgenius.com",407],["games.wtop.com",407],["jeux.meteocity.com",407],["juegos.as.com",407],["juegos.elnuevoherald.com",407],["juegos.elpais.com",407],["philly.arkadiumarena.com",407],["play.dictionary.com",407],["puzzles.bestforpuzzles.com",407],["puzzles.centralmaine.com",407],["puzzles.crosswordsolver.org",407],["puzzles.independent.co.uk",407],["puzzles.nola.com",407],["puzzles.pressherald.com",407],["puzzles.standard.co.uk",407],["puzzles.sunjournal.com",407],["arkadium.com",408],["abysscdn.com",[409,410]],["turtleviplay.xyz",411],["hdfilmizlesen.com",412],["arcai.com",413],["my-code4you.blogspot.com",414],["flickr.com",415],["firefile.cc",416],["pestleanalysis.com",416],["kochamjp.pl",416],["tutorialforlinux.com",416],["whatsaero.com",416],["animeblkom.net",[416,430]],["blkom.com",416],["globes.co.il",[417,418]],["jardiner-malin.fr",419],["tw-calc.net",420],["ohmybrush.com",421],["talkceltic.net",422],["mentalfloss.com",423],["uprafa.com",424],["cube365.net",425],["wwwfotografgotlin.blogspot.com",426],["freelistenonline.com",426],["badassdownloader.com",427],["quickporn.net",428],["yellowbridge.com",429],["aosmark.com",431],["ctrlv.*",432],["atozmath.com",[433,434,435,436,437,438,439]],["newyorker.com",440],["brighteon.com",[441,442]],["more.tv",443],["video1tube.com",444],["alohatube.xyz",444],["4players.de",445],["onlinesoccermanager.com",445],["fshost.me",446],["link.cgtips.org",447],["hentaicloud.com",448],["paperzonevn.com",450],["9jarock.org",451],["fzmovies.info",451],["fztvseries.ng",451],["netnaijas.com",451],["hentaienglish.com",452],["hentaiporno.xxx",452],["venge.io",[453,454]],["btcbux.io",455],["its.porn",[456,457]],["atv.at",458],["2ndrun.tv",459],["rackusreads.com",459],["teachmemicro.com",459],["willcycle.com",459],["kusonime.com",[460,461]],["123movieshd.*",462],["imgur.com",[463,464,730]],["hentai-party.com",465],["hentaicomics.pro",465],["uproxy.*",466],["animesa.*",467],["subtitle.one",468],["subtitleone.cc",468],["mysexgames.com",469],["ancient-origins.*",470],["cinecalidad.*",[471,472]],["xnxx.com",473],["xvideos.*",473],["gdr-online.com",474],["mmm.dk",475],["iqiyi.com",[476,477,603]],["m.iqiyi.com",478],["nbcolympics.com",479],["apkhex.com",480],["indiansexstories2.net",481],["issstories.xyz",481],["1340kbbr.com",482],["gorgeradio.com",482],["kduk.com",482],["kedoam.com",482],["kejoam.com",482],["kelaam.com",482],["khsn1230.com",482],["kjmx.rocks",482],["kloo.com",482],["klooam.com",482],["klykradio.com",482],["kmed.com",482],["kmnt.com",482],["kool991.com",482],["kpnw.com",482],["kppk983.com",482],["krktcountry.com",482],["ktee.com",482],["kwro.com",482],["kxbxfm.com",482],["thevalley.fm",482],["quizlet.com",483],["dsocker1234.blogspot.com",484],["schoolcheats.net",[485,486]],["mgnet.xyz",487],["designtagebuch.de",488],["pixroute.com",489],["uploady.io",490],["calculator-online.net",491],["porngames.club",492],["sexgames.xxx",492],["111.90.159.132",493],["mobile-tracker-free.com",494],["pfps.gg",495],["social-unlock.com",496],["superpsx.com",497],["ninja.io",498],["sourceforge.net",499],["samfirms.com",500],["rapelust.com",501],["vtube.to",501],["desitelugusex.com",501],["dvdplay.*",501],["xvideos-downloader.net",501],["xxxvideotube.net",501],["sdefx.cloud",501],["nozomi.la",501],["banned.video",502],["madmaxworld.tv",502],["androidpolice.com",502],["babygaga.com",502],["backyardboss.net",502],["carbuzz.com",502],["cbr.com",502],["collider.com",502],["dualshockers.com",502],["footballfancast.com",502],["footballleagueworld.co.uk",502],["gamerant.com",502],["givemesport.com",502],["hardcoregamer.com",502],["hotcars.com",502],["howtogeek.com",502],["makeuseof.com",502],["moms.com",502],["movieweb.com",502],["pocket-lint.com",502],["pocketnow.com",502],["screenrant.com",502],["simpleflying.com",502],["thegamer.com",502],["therichest.com",502],["thesportster.com",502],["thethings.com",502],["thetravel.com",502],["topspeed.com",502],["xda-developers.com",502],["huffpost.com",503],["ingles.com",504],["spanishdict.com",504],["surfline.com",[505,506]],["play.tv3.ee",507],["play.tv3.lt",507],["play.tv3.lv",[507,508]],["tv3play.skaties.lv",507],["bulbagarden.net",509],["hollywoodlife.com",510],["mat6tube.com",511],["hotabis.com",512],["root-nation.com",512],["italpress.com",512],["airsoftmilsimnews.com",512],["artribune.com",512],["newtumbl.com",513],["apkmaven.*",514],["aruble.net",515],["nevcoins.club",516],["mail.com",517],["gmx.*",518],["mangakita.id",520],["avpgalaxy.net",521],["panda-novel.com",522],["lightsnovel.com",522],["eaglesnovel.com",522],["pandasnovel.com",522],["ewrc-results.com",523],["kizi.com",524],["cyberscoop.com",525],["fedscoop.com",525],["canale.live",526],["jeep-cj.com",527],["sponsorhunter.com",528],["cloudcomputingtopics.net",529],["likecs.com",530],["tiscali.it",531],["linkspy.cc",532],["adshnk.com",533],["chattanoogan.com",534],["adsy.pw",535],["playstore.pw",535],["windowspro.de",536],["tvtv.ca",537],["tvtv.us",537],["mydaddy.cc",538],["roadtrippin.fr",539],["vavada5com.com",540],["anyporn.com",[541,558]],["bravoporn.com",541],["bravoteens.com",541],["crocotube.com",541],["hellmoms.com",541],["hellporno.com",541],["sex3.com",541],["tubewolf.com",541],["xbabe.com",541],["xcum.com",541],["zedporn.com",541],["imagetotext.info",542],["infokik.com",543],["freepik.com",544],["ddwloclawek.pl",[545,546]],["www.seznam.cz",547],["deezer.com",548],["my-subs.co",549],["plaion.com",550],["slideshare.net",[551,552]],["ustreasuryyieldcurve.com",553],["businesssoftwarehere.com",554],["goo.st",554],["freevpshere.com",554],["softwaresolutionshere.com",554],["gamereactor.*",556],["madoohd.com",557],["doomovie-hd.*",557],["staige.tv",559],["androidadult.com",560],["streamvid.net",561],["watchtv24.com",562],["cellmapper.net",563],["medscape.com",564],["newscon.org",[565,566]],["wheelofgold.com",567],["drakecomic.*",567],["app.blubank.com",568],["mobileweb.bankmellat.ir",568],["chat.nrj.fr",569],["chat.tchatche.com",[569,584]],["ccthesims.com",576],["chromeready.com",576],["dtbps3games.com",576],["illustratemagazine.com",576],["uknip.co.uk",576],["vod.pl",577],["megadrive-emulator.com",578],["tvhay.*",[579,580]],["moviesapi.club",581],["bestx.stream",581],["watchx.top",581],["digimanie.cz",582],["svethardware.cz",582],["srvy.ninja",583],["cnn.com",[585,586,587]],["news.bg",588],["edmdls.com",589],["freshremix.net",589],["scenedl.org",589],["trakt.tv",590],["client.falixnodes.net",[591,592]],["shroomers.app",593],["classicalradio.com",594],["di.fm",594],["jazzradio.com",594],["radiotunes.com",594],["rockradio.com",594],["zenradio.com",594],["getthit.com",595],["techedubyte.com",596],["soccerinhd.com",596],["movie-th.tv",597],["iwanttfc.com",598],["nutraingredients-asia.com",599],["nutraingredients-latam.com",599],["nutraingredients-usa.com",599],["nutraingredients.com",599],["ozulscansen.com",600],["nexusmods.com",601],["lookmovie.*",602],["lookmovie2.to",602],["biletomat.pl",604],["hextank.io",[605,606]],["filmizlehdfilm.com",[607,608,609,610]],["filmizletv.*",[607,608,609,610]],["fullfilmizle.cc",[607,608,609,610]],["gofilmizle.net",[607,608,609,610]],["cimanow.cc",611],["bgmiupdate.com.in",611],["freex2line.online",612],["btvplus.bg",614],["sagewater.com",615],["redlion.net",615],["filmweb.pl",616],["satdl.com",617],["vidstreaming.xyz",618],["everand.com",619],["myradioonline.pl",620],["cbs.com",621],["paramountplus.com",621],["fullxh.com",622],["galleryxh.site",622],["megaxh.com",622],["movingxh.world",622],["seexh.com",622],["unlockxh4.com",622],["valuexh.life",622],["xhaccess.com",622],["xhadult2.com",622],["xhadult3.com",622],["xhadult4.com",622],["xhadult5.com",622],["xhamster.*",622],["xhamster1.*",622],["xhamster10.*",622],["xhamster11.*",622],["xhamster12.*",622],["xhamster13.*",622],["xhamster14.*",622],["xhamster15.*",622],["xhamster16.*",622],["xhamster17.*",622],["xhamster18.*",622],["xhamster19.*",622],["xhamster20.*",622],["xhamster2.*",622],["xhamster3.*",622],["xhamster4.*",622],["xhamster42.*",622],["xhamster46.com",622],["xhamster5.*",622],["xhamster7.*",622],["xhamster8.*",622],["xhamsterporno.mx",622],["xhbig.com",622],["xhbranch5.com",622],["xhchannel.com",622],["xhdate.world",622],["xhlease.world",622],["xhmoon5.com",622],["xhofficial.com",622],["xhopen.com",622],["xhplanet1.com",622],["xhplanet2.com",622],["xhreal2.com",622],["xhreal3.com",622],["xhspot.com",622],["xhtotal.com",622],["xhtree.com",622],["xhvictory.com",622],["xhwebsite.com",622],["xhwebsite2.com",622],["xhwebsite5.com",622],["xhwide1.com",622],["xhwide2.com",622],["xhwide5.com",622],["file-upload.net",624],["acortalo.*",[625,626,627,628]],["acortar.*",[625,626,627,628]],["megadescarga.net",[625,626,627,628]],["megadescargas.net",[625,626,627,628]],["hentaihaven.xxx",629],["jacquieetmicheltv2.net",631],["a2zapk.*",632],["fcportables.com",[633,634]],["emurom.net",635],["freethesaurus.com",[636,637]],["thefreedictionary.com",[636,637]],["oeffentlicher-dienst.info",638],["im9.eu",[639,640]],["dcdlplayer8a06f4.xyz",641],["ultimate-guitar.com",642],["claimbits.net",643],["sexyscope.net",644],["kickassanime.*",645],["recherche-ebook.fr",646],["virtualdinerbot.com",646],["zonebourse.com",647],["pink-sluts.net",648],["andhrafriends.com",649],["benzinpreis.de",650],["defenseone.com",651],["govexec.com",651],["nextgov.com",651],["route-fifty.com",651],["sharing.wtf",652],["wetter3.de",653],["esportivos.fun",654],["cosmonova-broadcast.tv",655],["538.nl",656],["hartvannederland.nl",656],["kijk.nl",656],["shownieuws.nl",656],["vandaaginside.nl",656],["rock.porn",[657,658]],["videzz.net",[659,660]],["ezaudiobookforsoul.com",661],["club386.com",662],["decompiler.com",[663,664]],["littlebigsnake.com",665],["easyfun.gg",666],["smailpro.com",667],["ilgazzettino.it",668],["ilmessaggero.it",668],["3bmeteo.com",[669,670]],["mconverter.eu",671],["lover937.net",672],["10gb.vn",673],["pes6.es",674],["tactics.tools",[675,676]],["boundhub.com",677],["alocdnnetu.xyz",678],["reliabletv.me",679],["jakondo.ru",680],["appnee.com",680],["trueachievements.com",680],["truesteamachievements.com",680],["truetrophies.com",680],["filecrypt.*",681],["wired.com",683],["spankbang.*",[684,685,686,732,733]],["hulu.com",[687,688,689]],["hanime.tv",690],["nhentai.net",[691,692,693]],["pouvideo.*",694],["povvideo.*",694],["povw1deo.*",694],["povwideo.*",694],["powv1deo.*",694],["powvibeo.*",694],["powvideo.*",694],["powvldeo.*",694],["anonymfile.com",695],["gofile.to",695],["dotycat.com",696],["rateyourmusic.com",697],["reporterpb.com.br",698],["blog-dnz.com",700],["18adultgames.com",701],["colnect.com",[702,703]],["adultgamesworld.com",704],["servustv.com",[705,706]],["reviewdiv.com",707],["parametric-architecture.com",708],["laurelberninteriors.com",[709,735]],["voiceofdenton.com",710],["concealednation.org",710],["askattest.com",712],["opensubtitles.com",713],["savefiles.com",714],["streamup.ws",715],["goodstream.one",716],["lecrabeinfo.net",717],["cerberusapp.com",718],["smashkarts.io",719],["beamng.wesupply.cx",720],["wowtv.de",[721,722]],["jsfiddle.net",[723,724]],["www.google.*",725],["tacobell.com",726],["zefoy.com",727],["cnet.com",728],["natgeotv.com",731],["globo.com",734],["wayfair.com",736]]);
const exceptionsMap = new Map([["cloudflare.com",[0]],["pingit.com",[175]],["loan.bgmi32bitapk.in",[295]],["lookmovie.studio",[602]]]);
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
