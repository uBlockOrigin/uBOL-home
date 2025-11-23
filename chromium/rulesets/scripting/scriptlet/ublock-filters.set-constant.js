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
const argsList = [["console.clear","undefined"],["aclib.runInPagePush","noopFunc"],["aclib.runBanner","{}","as","function"],["aclib.runInterstitial","throwFunc"],["adBlockDetected","undefined"],["adsbygoogle","{}"],["adsbygoogle.push","noopFunc"],["HTMLScriptElement.prototype.onerror","undefined"],["akamaiDisableServerIpLookup","noopFunc"],["DD_RUM.addAction","noopFunc"],["nads.createAd","trueFunc"],["dvtag.getTargeting","trueFunc"],["ga","noopFunc"],["huecosPBS.nstdX","null"],["DTM.trackAsyncPV","noopFunc"],["_satellite","{}"],["_satellite.getVisitorId","noopFunc"],["newPageViewSpeedtest","noopFunc"],["pubg.unload","noopFunc"],["generateGalleryAd","noopFunc"],["mediator","noopFunc"],["Object.prototype.subscribe","noopFunc"],["gbTracker","{}"],["gbTracker.sendAutoSearchEvent","noopFunc"],["Object.prototype.vjsPlayer.ads","noopFunc"],["network_user_id",""],["google.ima.OmidVerificationVendor","{}"],["Object.prototype.omidAccessModeRules","{}"],["googletag.cmd","{}"],["_aps","{}"],["Object.prototype.setDisableFlashAds","noopFunc"],["DD_RUM.addTiming","noopFunc"],["chameleonVideo.adDisabledRequested","true"],["AdmostClient","{}"],["analytics","{}"],["datalayer","[]"],["Object.prototype.isInitialLoadDisabled","noopFunc"],["listingGoogleEETracking","noopFunc"],["dcsMultiTrack","noopFunc"],["urlStrArray","noopFunc"],["pa","{}"],["Object.prototype.setConfigurations","noopFunc"],["Object.prototype.bk_addPageCtx","noopFunc"],["Object.prototype.bk_doJSTag","noopFunc"],["passFingerPrint","noopFunc"],["optimizely","{}"],["optimizely.initialized","true"],["google_optimize","{}"],["google_optimize.get","noopFunc"],["_gsq","{}"],["_gsq.push","noopFunc"],["stmCustomEvent","noopFunc"],["_gsDevice",""],["iom","{}"],["iom.c","noopFunc"],["_conv_q","{}"],["_conv_q.push","noopFunc"],["google.ima.settings.setDisableFlashAds","noopFunc"],["pa.privacy","{}"],["populateClientData4RBA","noopFunc"],["YT.ImaManager","noopFunc"],["UOLPD","{}"],["UOLPD.dataLayer","{}"],["__configuredDFPTags","{}"],["URL_VAST_YOUTUBE","{}"],["Adman","{}"],["dplus","{}"],["dplus.track","noopFunc"],["_satellite.track","noopFunc"],["google.ima.dai","{}"],["gfkS2sExtension","{}"],["gfkS2sExtension.HTML5VODExtension","noopFunc"],["AnalyticsEventTrackingJS","{}"],["AnalyticsEventTrackingJS.addToBasket","noopFunc"],["AnalyticsEventTrackingJS.trackErrorMessage","noopFunc"],["initializeslideshow","noopFunc"],["fathom","{}"],["fathom.trackGoal","noopFunc"],["Origami","{}"],["Origami.fastclick","noopFunc"],["jad","undefined"],["hasAdblocker","true"],["Sentry","{}"],["Sentry.init","noopFunc"],["TRC","{}"],["TRC._taboolaClone","[]"],["fp","{}"],["fp.t","noopFunc"],["fp.s","noopFunc"],["initializeNewRelic","noopFunc"],["turnerAnalyticsObj","{}"],["turnerAnalyticsObj.setVideoObject4AnalyticsProperty","noopFunc"],["turnerAnalyticsObj.getVideoObject4AnalyticsProperty","noopFunc"],["optimizelyDatafile","{}"],["optimizelyDatafile.featureFlags","[]"],["fingerprint","{}"],["fingerprint.getCookie","noopFunc"],["gform.utils","noopFunc"],["gform.utils.trigger","noopFunc"],["get_fingerprint","noopFunc"],["moatPrebidApi","{}"],["moatPrebidApi.getMoatTargetingForPage","noopFunc"],["cpd_configdata","{}"],["cpd_configdata.url",""],["yieldlove_cmd","{}"],["yieldlove_cmd.push","noopFunc"],["dataLayer.push","noopFunc"],["_etmc","{}"],["_etmc.push","noopFunc"],["freshpaint","{}"],["freshpaint.track","noopFunc"],["ShowRewards","noopFunc"],["stLight","{}"],["stLight.options","noopFunc"],["DD_RUM.addError","noopFunc"],["sensorsDataAnalytic201505","{}"],["sensorsDataAnalytic201505.init","noopFunc"],["sensorsDataAnalytic201505.quick","noopFunc"],["sensorsDataAnalytic201505.track","noopFunc"],["s","{}"],["s.tl","noopFunc"],["smartech","noopFunc"],["sensors","{}"],["sensors.init","noopFunc"],["sensors.track","noopFunc"],["adn","{}"],["adn.clearDivs","noopFunc"],["_vwo_code","{}"],["gtag","noopFunc"],["_taboola","{}"],["_taboola.push","noopFunc"],["clicky","{}"],["clicky.goal","noopFunc"],["WURFL","{}"],["_sp_.config.events.onSPPMObjectReady","noopFunc"],["gtm","{}"],["gtm.trackEvent","noopFunc"],["mParticle.Identity.getCurrentUser","noopFunc"],["JSGlobals.prebidEnabled","false"],["elasticApm","{}"],["elasticApm.init","noopFunc"],["ga.sendGaEvent","noopFunc"],["adobe","{}"],["MT","{}"],["MT.track","noopFunc"],["ClickOmniPartner","noopFunc"],["adex","{}"],["adex.getAdexUser","noopFunc"],["Adkit","noopFunc"],["Object.prototype.shouldExpectGoogleCMP","false"],["apntag.refresh","noopFunc"],["pa.sendEvent","noopFunc"],["Munchkin","{}"],["Munchkin.init","noopFunc"],["ttd_dom_ready","noopFunc"],["ramp","undefined"],["appInfo.snowplow.trackSelfDescribingEvent","noopFunc"],["_vwo_code.init","noopFunc"],["adobePageView","noopFunc"],["dapTracker","{}"],["dapTracker.track","noopFunc"],["newrelic","{}"],["newrelic.setCustomAttribute","noopFunc"],["adobeDataLayer","{}"],["adobeDataLayer.push","noopFunc"],["Object.prototype._adsDisabled","true"],["utag","{}"],["utag.link","noopFunc"],["_satellite.kpCustomEvent","noopFunc"],["Object.prototype.disablecommercials","true"],["Object.prototype._autoPlayOnlyWithPrerollAd","false"],["Sentry.addBreadcrumb","noopFunc"],["sensorsDataAnalytic201505.register","noopFunc"],["ytInitialPlayerResponse.playerAds","undefined"],["ytInitialPlayerResponse.adPlacements","undefined"],["ytInitialPlayerResponse.adSlots","undefined"],["playerResponse.adPlacements","undefined"],["nsShowMaxCount","0"],["objVc.interstitial_web",""],["_ml_ads_ns","null"],["_sp_.config","undefined"],["AdController","noopFunc"],["console.clear","noopFunc"],["Object.prototype.hideAds","true"],["Object.prototype._getSalesHouseConfigurations","noopFunc"],["vast_urls","{}"],["sadbl","false"],["adblockcheck","false"],["arrvast","[]"],["blurred","false"],["flashvars.adv_pre_src",""],["showPopunder","false"],["page_params.holiday_promo","true"],["adsEnabled","true"],["String.prototype.charAt","trueFunc"],["ad_blocker","false"],["blockAdBlock","true"],["VikiPlayer.prototype.pingAbFactor","noopFunc"],["player.options.disableAds","true"],["console.clear","trueFunc"],["flashvars.adv_pre_vast",""],["flashvars.adv_pre_vast_alt",""],["x_width","1"],["_site_ads_ns","true"],["luxuretv.config",""],["Object.prototype.AdOverlay","noopFunc"],["tkn_popunder","null"],["can_run_ads","true"],["adsBlockerDetector","noopFunc"],["globalThis","null"],["adblock","false"],["__ads","true"],["FlixPop.isPopGloballyEnabled","falseFunc"],["check_adblock","true"],["isAdBlockActive","false"],["$.magnificPopup.open","noopFunc"],["adsenseadBlock","noopFunc"],["adblockSuspected","false"],["xRds","true"],["cRAds","false"],["disasterpingu","false"],["App.views.adsView.adblock","false"],["flashvars.adv_pause_html",""],["$.fx.off","true"],["adBlockEnabled","false"],["puShown","true"],["showAds","true"],["attr","{}"],["scriptSrc",""],["cxStartDetectionProcess","noopFunc"],["isAdBlocked","false"],["adblock","noopFunc"],["path",""],["__NEXT_DATA__.props.clientConfigSettings.videoAds","undefined"],["_ctrl_vt.blocked.ad_script","false"],["blockAdBlock","noopFunc"],["caca","noopFunc"],["Ok","true"],["safelink.adblock","false"],["openPopunder","noopFunc"],["ClickUnder","noopFunc"],["flashvars.adv_pre_url",""],["flashvars.protect_block",""],["flashvars.video_click_url",""],["adBlock","false"],["spoof","noopFunc"],["btoa","null"],["sp_ad","true"],["adsBlocked","false"],["_sp_.msg.displayMessage","noopFunc"],["CaptchmeState.adb","undefined"],["UhasAB","false"],["adNotificationDetected","false"],["atob","noopFunc"],["_pop","noopFunc"],["CnnXt.Event.fire","noopFunc"],["_ti_update_user","noopFunc"],["valid","1"],["vastAds","[]"],["adblock","1"],["frg","1"],["time","0"],["ads","true"],["GNCA_Ad_Support","true"],["Date.now","noopFunc"],["jQuery.adblock","1"],["VMG.Components.Adblock","false"],["adblockDetector","trueFunc"],["hasPoped","true"],["flashvars.video_click_url","undefined"],["flashvars.adv_start_html",""],["flashvars.popunder_url",""],["flashvars.adv_post_src",""],["flashvars.adv_post_url",""],["jQuery.adblock","false"],["google_jobrunner","true"],["sec","0"],["gadb","false"],["checkadBlock","noopFunc"],["clientSide.adbDetect","noopFunc"],["HTMLAnchorElement.prototype.click","noopFunc"],["cmnnrunads","true"],["adBlocker","false"],["adBlockDetected","noopFunc"],["StileApp.somecontrols.adBlockDetected","noopFunc"],["google_tag_data","noopFunc"],["noAdBlock","true"],["adsOk","true"],["check","true"],["isal","true"],["document.hidden","true"],["awm","true"],["adblockEnabled","false"],["is_adblocked","false"],["pogo.intermission.staticAdIntermissionPeriod","0"],["SubmitDownload1","noopFunc"],["t","0"],["ckaduMobilePop","noopFunc"],["tieneAdblock","0"],["adsAreBlocked","false"],["cmgpbjs","false"],["displayAdblockOverlay","false"],["google","false"],["Math.pow","noopFunc"],["openInNewTab","noopFunc"],["runAdBlocker","false"],["Adblock","false"],["flashvars.logo_url",""],["flashvars.logo_text",""],["nlf.custom.userCapabilities","false"],["count","0"],["LoadThisScript","true"],["showPremLite","true"],["closeBlockerModal","false"],["adBlockDetector.isEnabled","falseFunc"],["areAdsDisplayed","true"],["gkAdsWerbung","true"],["pop_target","null"],["is_banner","true"],["$easyadvtblock","false"],["show_dfp_preroll","false"],["show_youtube_preroll","false"],["doads","true"],["jsUnda","noopFunc"],["AlobaidiDetectAdBlock","true"],["Advertisement","1"],["adBlockDetected","false"],["abp1","1"],["pr_okvalida","true"],["$.ajax","trueFunc"],["cnbc.canShowAds","true"],["firefaucet","true"],["cRAds","true"],["uas","[]"],["flashvars.popunder_url","undefined"],["adv","true"],["prerollMain","undefined"],["canRunAds","true"],["Fingerprint2","true"],["dclm_ajax_var.disclaimer_redirect_url",""],["load_pop_power","noopFunc"],["adBlockDetected","true"],["Time_Start","0"],["blockAdBlock","trueFunc"],["ezstandalone.enabled","true"],["foundation.adPlayer.bitmovin","{}"],["weltConfig.switches.videoAdBlockBlocker","false"],["window.__gv_org_tfa","undefined"],["Object.prototype.adReinsertion","noopFunc"],["getHomadConfig","noopFunc"],["ab","false"],["go_popup","{}"],["noBlocker","true"],["adsbygoogle","null"],["fabActive","false"],["gWkbAdVert","true"],["noblock","true"],["wgAffiliateEnabled","false"],["ads","null"],["detectAdblock","noopFunc"],["adsLoadable","true"],["ASSetCookieAds","null"],["letShowAds","true"],["ulp_noadb","true"],["Object.prototype.adblock_detected","false"],["timeSec","0"],["adsbygoogle.loaded","true"],["ads_unblocked","true"],["xxSetting.adBlockerDetection","false"],["open","undefined"],["Drupal.behaviors.adBlockerPopup","null"],["fake_ad","true"],["koddostu_com_adblock_yok","null"],["adsbygoogle","trueFunc"],["player.ads.cuePoints","undefined"],["adBlockDetected","null"],["better_ads_adblock","1"],["Adv_ab","false"],["sgpbCanRunAds","true"],["document.hidden","false"],["hasFocus","trueFunc"],["navigator.brave","undefined"],["Object.prototype.isAllAdClose","true"],["document.hasFocus","trueFunc"],["isRequestPresent","true"],["fouty","true"],["Notification","undefined"],["protection","noopFunc"],["private","false"],["navigator.webkitTemporaryStorage.queryUsageAndQuota","noopFunc"],["document.onkeydown","noopFunc"],["showadas","true"],["alert","throwFunc"],["aSl.gcd","0"],["window.adLink","null"],["detectedAdblock","undefined"],["isTabActive","true"],["clicked","2"],["ov.advertising.tisoomi.loadScript","noopFunc"],["abp","false"],["hommy","{}"],["hommy.waitUntil","noopFunc"],["flashvars.mlogo",""],["vpPrerollVideo","undefined"],["PlayerConfig.config.CustomAdSetting","[]"],["PlayerConfig.trusted","true"],["PlayerConfig.config.AffiliateAdViewLevel","3"],["univresalP","noopFunc"],["hold_click","false"],["tie.ad_blocker_detector","false"],["admiral","noopFunc"],["gnt.x.uam","undefined","runAt","interactive"],["gnt.u.z","true"],["__INITIAL_DATA__.siteData.admiralScript"],["objAd.loadAdShield","noopFunc"],["window.myAd.runAd","noopFunc"],["detectAdBlock","noopFunc"],["AHE.is_member","1"],["__INITIAL_STATE__.config.theme.ads.isAdBlockerEnabled","false"],["__INITIAL_STATE__.gameLists.gamesNoPrerollIds.indexOf","trueFunc"],["document.ontouchend","null"],["document.onclick","null"],["playID","1"],["MDCore.adblock","0"],["killads","true"],["NMAFMediaPlayerController.vastManager.vastShown","true"],["__NEXT_DATA__.runtimeConfig._qub_sdk.qubConfig.video.adBlockerDetectorEnabled","false"],["Object.prototype.advertising","{}"],["arePiratesOnBoard","false"],["__INIT_CONFIG__.randvar","undefined"],["googletag._loaded_","true"],["NoTenia","false"],["app._data.ads","[]"],["adsPlayer","undefined"],["pubAdsService","trueFunc"],["config.pauseInspect","false"],["appContext.adManager.context.current.adFriendly","false"],["blockAdBlock._options.baitClass","null"],["document.blocked_var","1"],["____ads_js_blocked","false"],["wIsAdBlocked","false"],["WebSite.plsDisableAdBlock","null"],["ads_blocked","false"],["samDetected","false"],["countClicks","0"],["settings.adBlockerDetection","false"],["mixpanel.get_distinct_id","true"],["fuckAdBlock._options.baitClass","null"],["bscheck.adblocker","noopFunc"],["qpcheck.ads","noopFunc"],["isContentBlocked","falseFunc"],["CloudflareApps.installs.Ik7rmQ4t95Qk.options.measureDomain","undefined"],["detectAB1","noopFunc"],["uBlockOriginDetected","false"],["googletag._vars_","{}"],["googletag._loadStarted_","true"],["google_unique_id","1"],["google.javascript","{}"],["google.javascript.ads","{}"],["google_global_correlator","1"],["paywallGateway.truncateContent","noopFunc"],["adBlockDisabled","true"],["__NEXT_DATA__.props.pageProps.adVideo","undefined"],["blockedElement","noopFunc"],["popit","false"],["adBlockerDetected","false"],["abu","falseFunc"],["countdown","0"],["decodeURI","noopFunc"],["flashvars.adv_postpause_vast",""],["xv_ad_block","0"],["openWindow","noopFunc"],["vidorev_jav_plugin_video_ads_object.vid_ads_m_video_ads",""],["adsProvider.init","noopFunc"],["SDKLoaded","true"],["POPUNDER_ENABLED","false"],["plugins.preroll","noopFunc"],["errcode","0"],["DHAntiAdBlocker","true"],["showada","true"],["showax","true"],["p18","undefined"],["ADBLOCKED","false"],["Object.prototype.adsEnabled","false"],["adb","0"],["String.fromCharCode","trueFunc"],["adblock_use","false"],["Object.prototype.adblockFound","false"],["createCanvas","noopFunc"],["document.bridCanRunAds","true"],["playerAdSettings.adLink",""],["playerAdSettings.waitTime","0"],["xv.sda.pp.init","noopFunc"],["isAdsLoaded","true"],["adblockerAlert","noopFunc"],["Object.prototype.parseXML","noopFunc"],["Object.prototype.blackscreenDuration","1"],["Object.prototype.adPlayerId",""],["adblockDetect","noopFunc"],["style","noopFunc"],["history.pushState","noopFunc"],["google_unique_id","6"],["__NEXT_DATA__.props.pageProps.adsConfig","undefined"],["new_config.timedown","0"],["truex","{}"],["truex.client","noopFunc"],["hiddenProxyDetected","false"],["SteadyWidgetSettings.adblockActive","false"],["proclayer","noopFunc"],["timeleft","0"],["load_ads","trueFunc"],["starPop","1"],["Object.prototype.ads","noopFunc"],["detectBlockAds","noopFunc"],["ad_link",""],["penciBlocksArray","[]"],["App.AdblockDetected","false"],["SF.adblock","true"],["startfrom","0"],["D4zz","noopFunc"],["Object.prototype.ads.nopreroll_","true"],["HP_Scout.adBlocked","false"],["SD_IS_BLOCKING","false"],["Object.prototype.isPremium","true"],["__BACKPLANE_API__.renderOptions.showAdBlock",""],["Object.prototype.isNoAds","{}"],["tv3Cmp.ConsentGiven","true"],["setupSkin","noopFunc"],["Object.prototype.enableInterstitial","false"],["ads","undefined"],["td_ad_background_click_link","undefined"],["POSTPART_prototype.ADKEY","noopFunc"],["adBlockDetected","falseFunc"],["__osw","undefined"],["divWidth","1"],["noAdBlock","noopFunc"],["AdService.info.abd","noopFunc"],["adBlockDetectionResult","undefined"],["popped","true"],["puShown1","true"],["passthetest","true"],["pandaAdviewValidate","true"],["canGetAds","true"],["ad_blocker_active","false"],["init_welcome_ad","noopFunc"],["document.body.contains","trueFunc"],["popunder","undefined"],["distance","0"],["document.onclick",""],["adEnable","true"],["displayAds","0"],["_adshrink.skiptime","0"],["AbleToRunAds","true"],["PreRollAd.timeCounter","0"],["abpblocked","undefined"],["paAddUnit","noopFunc"],["adt","0"],["test_adblock","noopFunc"],["adblockDetector","noopFunc"],["vastEnabled","false"],["detectadsbocker","false"],["two_worker_data_js.js","[]"],["FEATURE_DISABLE_ADOBE_POPUP_BY_COUNTRY","true"],["questpassGuard","noopFunc"],["isAdBlockerEnabled","false"],["sssp","emptyObj"],["smartLoaded","true"],["timeLeft","0"],["Cookiebot","noopFunc"],["feature_flags.interstitial_ads_flag","false"],["feature_flags.interstitials_every_four_slides","false"],["waldoSlotIds","true"],["adblockstatus","false"],["adScriptLoaded","true"],["adblockEnabled","noopFunc"],["adSettings","[]"],["banner_is_blocked","false"],["Object.prototype.adBlocked","false"],["chp_adblock_browser","noopFunc"],["googleAd","true"],["Brid.A9.prototype.backfillAdUnits","[]"],["dct","0"],["slideShow.displayInterstitial","true"],["googletag","true"],["tOS2","150"],["checkAdBlocker","noopFunc"],["navigator.standalone","true"],["empire.pop","undefined"],["empire.direct","undefined"],["empire.directHideAds","undefined"],["empire.mediaData.advisorMovie","1"],["empire.mediaData.advisorSerie","1"],["setTimer","0"],["penci_adlbock.ad_blocker_detector","0"],["Object.prototype.adblockDetector","noopFunc"],["blext","true"],["vidorev_jav_plugin_video_ads_object","{}"],["vidorev_jav_plugin_video_ads_object_post","{}"],["S_Popup","10"],["rabLimit","-1"],["nudgeAdBlock","noopFunc"],["feedBack.showAffilaePromo","noopFunc"],["ShowAdvertising","{}"],["FAVE.settings.ads.ssai.prod.clips.enabled","false"],["FAVE.settings.ads.ssai.prod.liveAuth.enabled","false"],["FAVE.settings.ads.ssai.prod.liveUnauth.enabled","false"],["HTMLScriptElement.prototype.onerror","null"],["loadpagecheck","noopFunc"],["art3m1sItemNames.affiliate-wrapper","\"\""],["isAdBlockerActive","noopFunc"],["di.app.WebplayerApp.Ads.Adblocks.app.AdBlockDetectApp.startWithParent","false"],["sharedController.adblockDetector","noopFunc"],["checkAdsStatus","noopFunc"],["settings.adBlockDetectionEnabled","false"],["displayInterstitialAdConfig","false"],["checkAdBlockeraz","noopFunc"],["blockingAds","false"],["Yii2App.playbackTimeout","0"],["QiyiPlayerProphetData.a.data","{}"],["toggleAdBlockInfo","falseFunc"],["aipAPItag.prerollSkipped","true"],["aipAPItag.setPreRollStatus","trueFunc"],["reklam_1_saniye","0"],["reklam_1_gecsaniye","0"],["reklamsayisi","1"],["reklam_1",""],["HTMLImageElement.prototype.onerror","undefined"],["HTMLImageElement.prototype.onload","undefined"],["powerAPITag","emptyObj"],["playerEnhancedConfig.run","throwFunc"],["aoAdBlockDetected","false"],["rodo.checkIsDidomiConsent","noopFunc"],["xtime","0"],["Div_popup",""],["Scribd.Blob.AdBlockerModal","noopFunc"],["AddAdsV2I.addBlock","false"],["hasAdBlocker","false"],["initials.yld-pdpopunder",""],["advertisement3","true"],["Object.prototype.skipPreroll","true"],["DisableDevtool","noopFunc"],["clicked","true"],["eClicked","true"],["number","0"],["sync","true"],["PlayerLogic.prototype.detectADB","noopFunc"],["showPopunder","noopFunc"],["Object.prototype.prerollAds","[]"],["notifyMe","noopFunc"],["adsClasses","undefined"],["gsecs","0"],["dvsize","52"],["majorse","true"],["completed","1"],["testerli","false"],["w87.abd","noopFunc"],["w87.dsab","noopFunc"],["document.referrer",""],["Object.prototype.setNeedShowAdblockWarning","noopFunc"],["NoAdBlock","noopFunc"],["adList","[]"],["ifmax","true"],["nitroAds.abp","true"],["onloadUI","noopFunc"],["PageLoader.DetectAb","0"],["one_time","1"],["consentGiven","true"],["GEMG.GPT.Interstitial","noopFunc"],["amiblock","0"],["karte3","18"],["sandDetect","noopFunc"],["amodule.data","emptyArr"],["Object.prototype.ADBLOCK_DETECTION",""],["postroll","undefined"],["interstitial","undefined"],["isAdBlockDetected","false"],["pData.adblockOverlayEnabled","0"],["cabdSettings","undefined"],["td_ad_background_click_link"],["malisx","true"],["alim","true"],["ADS.isBannersEnabled","false"],["EASYFUN_ADS_CAN_RUN","true"],["adsbygoogle_ama_fc_has_run","true"],["jwDefaults.advertising","{}"],["elimina_profilazione","1"],["elimina_pubblicita","1"],["abd","{}"],["checkerimg","noopFunc"],["detectedAdblock","noopFunc"],["Object.prototype.DetectByGoogleAd","noopFunc"],["nitroAds","{}"],["nitroAds.createAd","noopFunc"],["NativeAd","noopFunc"],["window.navigator.brave","undefined"],["isAdblock","false"],["openPop","noopFunc"],["cns.library","true"],["BJSShowUnder","{}"],["BJSShowUnder.bindTo","noopFunc"],["BJSShowUnder.add","noopFunc"],["Object.prototype._parseVAST","noopFunc"],["Object.prototype.createAdBlocker","noopFunc"],["Object.prototype.isAdPeriod","falseFunc"],["ABLK","false"],["_n_app.popunder","null"],["_n_app.options.ads.show_popunders","false"],["N_BetterJsPop.object","{}"],["isAdb","false"],["puOverlay","noopFunc"],["ue_adb_chk","1"],["canRunAds","1"],["countDown","0"],["runCheck","noopFunc"],["adsSlotRenderEndSeen","true"],["showModal","noopFunc"],["flashvars.mlogo_link",""],["isAdBlocked","noopFunc"],["URLlist","[]"],["aaw","{}"],["aaw.processAdsOnPage","noopFunc"],["doOpen","undefined"],["OneTrust","{}"],["OneTrust.IsAlertBoxClosed","trueFunc"],["FOXIZ_MAIN_SCRIPT.siteAccessDetector","noopFunc"],["openAdBlockPopup","noopFunc"],["advanced_ads_check_adblocker","noopFunc"],["attestHasAdBlockerActivated","true"],["extInstalled","true"],["SaveFiles.add","noopFunc"],["detectSandbox","noopFunc"],["ga","trueFunc"],["adbon","0"],["LCI.adBlockDetectorEnabled","false"],["stoCazzo","true"],["adblockDetected","false"],["importFAB","undefined"],["window.__CONFIGURATION__.adInsertion.enabled","false"],["window.__CONFIGURATION__.features.enableAdBlockerDetection","false"],["_carbonads","{}"],["_bsa","{}"],["uberad_mode"],["__aab_init","true"],["show_videoad_limited","noopFunc"],["__NATIVEADS_CANARY__","true"],["Object.prototype.adOnAdBlockPreventPlayback","false"],["pre_roll_url"],["post_roll_url"],["player.preroll","noopFunc"],["adblock_detect","noopFunc"],["fusetag","{}"],["rwt","noopFunc"],["_hjSettings","undefined"],["google_tag_manager","undefined"],["bmak.js_post","false"],["firebase.analytics","noopFunc"],["Object.prototype.updateModifiedCommerceUrl","noopFunc"],["flashvars.event_reporting",""],["Object.prototype.has_opted_out_tracking","trueFunc"],["process","{}"],["process.env","{}"],["Visitor","{}"],["send_gravity_event","noopFunc"],["send_recommendation_event","noopFunc"],["libAnalytics.data.get","noopFunc"],["adthrive._components.start","noopFunc"],["data","true"],["navigator.sendBeacon","noopFunc"]];
const hostnamesMap = new Map([["christopheruntilpoint.com",0],["gogoanime.*",[0,213]],["adrianmissionminute.com",0],["alejandrocenturyoil.com",0],["alleneconomicmatter.com",0],["bethshouldercan.com",0],["bigclatterhomesguideservice.com",0],["brittneystandardwestern.com",0],["brookethoughi.com",0],["brucevotewithin.com",0],["cindyeyefinal.com",0],["denisegrowthwide.com",0],["diananatureforeign.com",0],["donaldlineelse.com",0],["edwardarriveoften.com",0],["erikcoldperson.com",0],["evelynthankregion.com",0],["graceaddresscommunity.com",0],["heatherdiscussionwhen.com",0],["heatherwholeinvolve.com",0],["housecardsummerbutton.com",0],["jamessoundcost.com",0],["jamiesamewalk.com",0],["jasminetesttry.com",0],["jasonresponsemeasure.com",0],["jayservicestuff.com",0],["jennifercertaindevelopment.com",0],["jessicaglassauthor.com",0],["jilliandescribecompany.com",0],["johnalwayssame.com",0],["johntryopen.com",0],["jonathansociallike.com",0],["josephseveralconcern.com",0],["kellywhatcould.com",0],["kennethofficialitem.com",0],["kristiesoundsimply.com",0],["lisatrialidea.com",0],["lorimuchbenefit.com",0],["loriwithinfamily.com",0],["lukecomparetwo.com",0],["lukesitturn.com",0],["mariatheserepublican.com",0],["markstyleall.com",0],["michaelapplysome.com",0],["morganoperationface.com",0],["nathanfromsubject.com",0],["paulkitchendark.com",0],["rebeccaneverbase.com",0],["richardsignfish.com",0],["roberteachfinal.com",0],["robertordercharacter.com",0],["robertplacespace.com",0],["ryanagoinvolve.com",0],["sandratableother.com",0],["sandrataxeight.com",0],["sethniceletter.com",0],["shannonpersonalcost.com",0],["susanhavekeep.com",0],["tinycat-voe-fashion.com",0],["toddpartneranimal.com",0],["troyyourlead.com",0],["uptodatefinishconference.com",0],["uptodatefinishconferenceroom.com",0],["voe.sx",0],["maxfinishseveral.com",0],["mikaylaarealike.com",0],["voe.sx>>",0],["javboys.tv>>",0],["freeplayervideo.com",0],["nazarickol.com",0],["player-cdn.com",0],["playhydrax.com",[0,420,421]],["rabbitstream.net",0],["fmovies.*",0],["japscan.*",[1,2,3]],["u26bekrb.fun",4],["cdn.gledaitv.*",[5,6]],["tvtropes.org",7],["jakondo.ru",7],["trueachievements.com",7],["truesteamachievements.com",7],["truetrophies.com",7],["av1encodes.com",7],["myhentaicomics.com",7],["br.de",8],["indeed.com",9],["zillow.com",[9,114]],["pasteboard.co",10],["bbc.com",11],["clickhole.com",12],["deadspin.com",12],["gizmodo.com",12],["jalopnik.com",12],["jezebel.com",12],["kotaku.com",12],["lifehacker.com",12],["splinternews.com",12],["theinventory.com",12],["theonion.com",12],["theroot.com",12],["thetakeout.com",12],["pewresearch.org",12],["los40.com",[13,14]],["as.com",14],["caracol.com.co",14],["telegraph.co.uk",[15,16]],["poweredbycovermore.com",[15,68]],["lumens.com",[15,68]],["verizon.com",17],["humanbenchmark.com",18],["politico.com",19],["officedepot.co.cr",[20,21]],["officedepot.*",[22,23]],["usnews.com",24],["coolmathgames.com",[25,300,301,302]],["video.gazzetta.it",[26,27]],["oggi.it",[26,27]],["manoramamax.com",26],["factable.com",28],["thedailybeast.com",29],["zee5.com",30],["gala.fr",31],["geo.fr",31],["voici.fr",31],["gloucestershirelive.co.uk",32],["arsiv.mackolik.com",33],["jacksonguitars.com",34],["scandichotels.com",35],["stylist.co.uk",36],["nettiauto.com",37],["thaiairways.com",[38,39]],["cerbahealthcare.it",[40,41]],["futura-sciences.com",[40,58]],["toureiffel.paris",40],["campusfrance.org",[40,151]],["tiendaenlinea.claro.com.ni",[42,43]],["tieba.baidu.com",44],["fandom.com",[45,46,357]],["grasshopper.com",[47,48]],["epson.com.cn",[49,50,51,52]],["oe24.at",[53,54]],["szbz.de",53],["platform.autods.com",[55,56]],["kcra.com",57],["wcvb.com",57],["sporteurope.tv",57],["citibank.com.sg",59],["uol.com.br",[60,61,62,63,64]],["gazzetta.gr",65],["digicol.dpm.org.cn",[66,67]],["virginmediatelevision.ie",69],["larazon.es",[70,71]],["waitrosecellar.com",[72,73,74]],["kicker.de",[75,398]],["sharpen-free-design-generator.netlify.app",[76,77]],["help.cashctrl.com",[78,79]],["gry-online.pl",80],["vidaextra.com",81],["commande.rhinov.pro",[82,83]],["ecom.wixapps.net",[82,83]],["prod.hydra.sophos.com",[82,171]],["tipranks.com",[84,85]],["iceland.co.uk",[86,87,88]],["socket.pearsoned.com",89],["tntdrama.com",[90,91,92]],["trutv.com",[90,91]],["mobile.de",[93,94]],["ioe.vn",[95,96]],["geiriadur.ac.uk",[95,99]],["welsh-dictionary.ac.uk",[95,99]],["bikeportland.org",[97,98]],["biologianet.com",[61,62,63]],["10.com.au",[100,101]],["10play.com.au",[100,101]],["sunshine-live.de",[102,103]],["whatismyip.com",[104,105]],["myfitnesspal.com",106],["netoff.co.jp",[107,108]],["bluerabbitrx.com",[107,108]],["foundit.*",[109,110]],["clickjogos.com.br",111],["bristan.com",[112,113]],["share.hntv.tv",[115,116,117,118]],["forum.dji.com",[115,118]],["unionpayintl.com",[115,117]],["camel3.live",[115,116,118,172]],["streamelements.com",115],["optimum.net",[119,120]],["hdfcfund.com",121],["user.guancha.cn",[122,123]],["sosovalue.com",124],["bandyforbundet.no",[125,126]],["tatacommunications.com",127],["kb.arlo.com",[127,157]],["suamusica.com.br",[128,129,130]],["macrotrends.net",[131,132]],["code.world",133],["smartcharts.net",133],["topgear.com",134],["eservice.directauto.com",[135,136]],["nbcsports.com",137],["standard.co.uk",138],["pruefernavi.de",[139,140]],["17track.net",141],["visible.com",142],["hagerty.com",[143,144]],["marketplace.nvidia.com",145],["kino.de",[146,147]],["9now.nine.com.au",148],["worldstar.com",149],["prisjakt.no",150],["developer.arm.com",[152,153]],["sterkinekor.com",154],["iogames.space",155],["id.condenast.com",156],["tires.costco.com",158],["tires.costco.ca",158],["livemint.com",[159,160]],["login.asda.com",[161,162]],["mandai.com",[163,164]],["damndelicious.net",165],["laurelberninteriors.com",[165,765]],["brother-usa.com",[166,167]],["choose.kaiserpermanente.org",168],["tekniikanmaailma.fi",[169,170]],["m.youtube.com",[173,174,175,176]],["music.youtube.com",[173,174,175,176]],["tv.youtube.com",[173,174,175,176]],["www.youtube.com",[173,174,175,176]],["youtubekids.com",[173,174,175,176]],["youtube-nocookie.com",[173,174,175,176]],["eu-proxy.startpage.com",[173,174,176]],["timesofindia.indiatimes.com",177],["economictimes.indiatimes.com",178],["motherless.com",179],["sueddeutsche.de",180],["wiwo.de",181],["primewire.*",182],["alphaporno.com",[182,559]],["porngem.com",182],["shortit.pw",[182,257]],["familyporn.tv",182],["sbplay.*",182],["85po.com",[182,242]],["milfnut.*",182],["k1nk.co",182],["watchasians.cc",182],["sankakucomplex.com",183],["player.glomex.com",184],["merkur.de",184],["tz.de",184],["sxyprn.*",185],["hqq.*",[186,187]],["waaw.*",[187,188]],["hotpornfile.org",187],["younetu.*",187],["multiup.us",187],["peliculas8k.com",[187,188]],["czxxx.org",187],["vtplayer.online",187],["vvtplayer.*",187],["netu.ac",187],["netu.frembed.lol",187],["123link.*",189],["adshort.*",189],["mitly.us",189],["linkrex.net",189],["linx.cc",189],["oke.io",189],["linkshorts.*",189],["dz4link.com",189],["adsrt.*",189],["linclik.com",189],["shrt10.com",189],["vinaurl.*",189],["loptelink.com",189],["adfloz.*",189],["cut-fly.com",189],["linkfinal.com",189],["payskip.org",189],["cutpaid.com",189],["linkjust.com",189],["leechpremium.link",189],["icutlink.com",[189,276]],["oncehelp.com",189],["rgl.vn",189],["reqlinks.net",189],["bitlk.com",189],["qlinks.eu",189],["link.3dmili.com",189],["short-fly.com",189],["foxseotools.com",189],["dutchycorp.*",189],["shortearn.*",189],["pingit.*",189],["link.turkdown.com",189],["7r6.com",189],["oko.sh",189],["ckk.ai",189],["fc.lc",189],["fstore.biz",189],["shrink.*",189],["cuts-url.com",189],["eio.io",189],["exe.app",189],["exee.io",189],["exey.io",189],["skincarie.com",189],["exeo.app",189],["tmearn.*",189],["coinlyhub.com",[189,338]],["adsafelink.com",189],["aii.sh",189],["megalink.*",189],["cybertechng.com",[189,351]],["cutdl.xyz",189],["iir.ai",189],["shorteet.com",[189,369]],["miniurl.*",189],["smoner.com",189],["gplinks.*",189],["odisha-remix.com",[189,351]],["xpshort.com",[189,351]],["upshrink.com",189],["clk.*",189],["easysky.in",189],["veganab.co",189],["golink.bloggerishyt.in",189],["birdurls.com",189],["vipurl.in",189],["jameeltips.us",189],["promo-visits.site",189],["satoshi-win.xyz",[189,385]],["shorterall.com",189],["encurtandourl.com",189],["forextrader.site",189],["postazap.com",189],["cety.app",189],["exego.app",[189,383]],["cutlink.net",189],["cutyurls.com",189],["cutty.app",189],["cutnet.net",189],["jixo.online",189],["tinys.click",[189,351]],["cpm.icu",189],["panyshort.link",189],["enagato.com",189],["pandaznetwork.com",189],["tpi.li",189],["oii.la",189],["recipestutorials.com",189],["shrinkme.*",189],["shrinke.*",189],["mrproblogger.com",189],["themezon.net",189],["shrinkforearn.in",189],["oii.io",189],["du-link.in",189],["atglinks.com",189],["thotpacks.xyz",189],["megaurl.in",189],["megafly.in",189],["simana.online",189],["fooak.com",189],["joktop.com",189],["evernia.site",189],["falpus.com",189],["link.paid4link.com",189],["exalink.fun",189],["shortxlinks.com",189],["upfion.com",189],["upfiles.app",189],["upfiles-urls.com",189],["flycutlink.com",[189,351]],["linksly.co",189],["link1s.*",189],["pkr.pw",189],["imagenesderopaparaperros.com",189],["shortenbuddy.com",189],["apksvip.com",189],["4cash.me",189],["namaidani.com",189],["shortzzy.*",189],["teknomuda.com",189],["shorttey.*",[189,337]],["miuiku.com",189],["savelink.site",189],["lite-link.*",189],["adcorto.*",189],["samaa-pro.com",189],["miklpro.com",189],["modapk.link",189],["ccurl.net",189],["linkpoi.me",189],["pewgame.com",189],["haonguyen.top",189],["zshort.*",189],["crazyblog.in",189],["cutearn.net",189],["rshrt.com",189],["filezipa.com",189],["dz-linkk.com",189],["upfiles.*",189],["theblissempire.com",189],["finanzas-vida.com",189],["adurly.cc",189],["paid4.link",189],["link.asiaon.top",189],["go.gets4link.com",189],["linkfly.*",189],["beingtek.com",189],["shorturl.unityassets4free.com",189],["disheye.com",189],["techymedies.com",189],["za.gl",[189,290]],["bblink.com",189],["myad.biz",189],["swzz.xyz",189],["vevioz.com",189],["charexempire.com",189],["clk.asia",189],["sturls.com",189],["myshrinker.com",189],["wplink.*",189],["rocklink.in",189],["techgeek.digital",189],["download3s.net",189],["shortx.net",189],["tlin.me",189],["bestcash2020.com",189],["adslink.pw",[189,640]],["novelssites.com",189],["faucetcrypto.net",189],["trxking.xyz",189],["weadown.com",189],["m.bloggingguidance.com",189],["link.codevn.net",189],["link4rev.site",189],["c2g.at",189],["bitcosite.com",[189,573]],["cryptosh.pro",189],["windowslite.net",[189,351]],["viewfr.com",189],["cl1ca.com",189],["4br.me",189],["fir3.net",189],["seulink.*",189],["encurtalink.*",189],["kiddyshort.com",189],["watchmygf.me",[190,215]],["camwhores.*",[190,200,241,242,243]],["camwhorez.tv",[190,200,241,242]],["cambay.tv",[190,222,241,268,270,271,272,273]],["fpo.xxx",[190,222]],["sexemix.com",190],["heavyfetish.com",[190,757]],["thotcity.su",190],["viralxxxporn.com",[190,402]],["tube8.*",[191,192]],["you-porn.com",192],["youporn.*",192],["youporngay.com",192],["youpornru.com",192],["redtube.*",192],["9908ww.com",192],["adelaidepawnbroker.com",192],["bztube.com",192],["hotovs.com",192],["insuredhome.org",192],["nudegista.com",192],["pornluck.com",192],["vidd.se",192],["pornhub.*",[192,327]],["pornhub.com",192],["pornerbros.com",193],["freep.com",193],["porn.com",194],["tune.pk",195],["noticias.gospelmais.com.br",196],["techperiod.com",196],["viki.com",[197,198]],["watch-series.*",199],["watchseries.*",199],["vev.*",199],["vidop.*",199],["vidup.*",199],["sleazyneasy.com",[200,201,202]],["smutr.com",[200,334]],["tktube.com",200],["yourporngod.com",[200,201]],["javbangers.com",[200,469]],["camfox.com",200],["camthots.tv",[200,268]],["shegotass.info",200],["amateur8.com",200],["bigtitslust.com",200],["ebony8.com",200],["freeporn8.com",200],["lesbian8.com",200],["maturetubehere.com",200],["sortporn.com",200],["motherporno.com",[200,201,222,270]],["theporngod.com",[200,201]],["watchdirty.to",[200,242,243,271]],["pornsocket.com",203],["luxuretv.com",204],["porndig.com",[205,206]],["webcheats.com.br",207],["ceesty.com",[208,209]],["gestyy.com",[208,209]],["corneey.com",209],["destyy.com",209],["festyy.com",209],["sh.st",209],["mitaku.net",209],["angrybirdsnest.com",210],["zrozz.com",210],["clix4btc.com",210],["4tests.com",210],["goltelevision.com",210],["news-und-nachrichten.de",210],["laradiobbs.net",210],["urlaubspartner.net",210],["produktion.de",210],["cinemaxxl.de",210],["bladesalvador.com",210],["tempr.email",210],["friendproject.net",210],["covrhub.com",210],["trust.zone",210],["business-standard.com",210],["planetsuzy.org",211],["empflix.com",212],["xmovies8.*",213],["masteranime.tv",213],["0123movies.*",213],["gostream.*",213],["gomovies.*",213],["freeviewmovies.com",214],["filehorse.com",214],["guidetnt.com",214],["starmusiq.*",214],["sp-today.com",214],["linkvertise.com",214],["eropaste.net",214],["getpaste.link",214],["sharetext.me",214],["wcofun.*",214],["note.sieuthuthuat.com",214],["gadgets.es",[214,478]],["amateurporn.co",[214,271]],["watchanimesub.net",214],["wcoanimesub.tv",214],["wcoforever.net",214],["transparentcalifornia.com",215],["deepbrid.com",216],["webnovel.com",217],["streamwish.*",[218,219]],["oneupload.to",219],["wishfast.top",219],["rubystm.com",219],["rubyvid.com",219],["rubyvidhub.com",219],["stmruby.com",219],["streamruby.com",219],["schwaebische.de",220],["8tracks.com",221],["3movs.com",222],["bravoerotica.net",[222,270]],["youx.xxx",222],["camclips.tv",[222,334]],["xtits.*",[222,270]],["camflow.tv",[222,270,271,308,402]],["camhoes.tv",[222,268,270,271,308,402]],["xmegadrive.com",222],["xxxymovies.com",222],["xxxshake.com",222],["gayck.com",222],["xhand.com",[222,270]],["analdin.com",[222,270]],["revealname.com",223],["golfchannel.com",224],["stream.nbcsports.com",224],["mathdf.com",224],["gamcore.com",225],["porcore.com",225],["porngames.tv",225],["69games.xxx",225],["asianpornjav.com",225],["javmix.app",225],["haaretz.co.il",226],["haaretz.com",226],["hungama.com",226],["a-o.ninja",226],["anime-odcinki.pl",226],["shortgoo.blogspot.com",226],["tonanmedia.my.id",[226,592]],["isekaipalace.com",226],["plyjam.*",[227,228]],["foxsports.com.au",229],["canberratimes.com.au",229],["thesimsresource.com",230],["fxporn69.*",231],["vipbox.*",232],["viprow.*",232],["nba.com",233],["ctrl.blog",234],["sportlife.es",235],["finofilipino.org",236],["desbloqueador.*",237],["xberuang.*",238],["teknorizen.*",238],["mysflink.blogspot.com",238],["ashemaletube.*",239],["paktech2.com",239],["assia.tv",240],["assia4.com",240],["cwtvembeds.com",[242,269]],["camlovers.tv",242],["porntn.com",242],["pornissimo.org",242],["sexcams-24.com",[242,271]],["watchporn.to",[242,271]],["camwhorez.video",242],["footstockings.com",[242,243,271]],["xmateur.com",[242,243,271]],["multi.xxx",243],["weatherx.co.in",[244,245]],["sunbtc.space",244],["subtorrents.*",246],["subtorrents1.*",246],["newpelis.*",246],["pelix.*",246],["allcalidad.*",246],["infomaniakos.*",246],["ojogos.com.br",247],["powforums.com",248],["supforums.com",248],["studybullet.com",248],["usgamer.net",249],["recordonline.com",249],["freebitcoin.win",250],["e-monsite.com",250],["coindice.win",250],["freiepresse.de",251],["investing.com",252],["tornadomovies.*",253],["mp3fiber.com",254],["chicoer.com",255],["dailybreeze.com",255],["dailybulletin.com",255],["dailynews.com",255],["delcotimes.com",255],["eastbaytimes.com",255],["macombdaily.com",255],["ocregister.com",255],["pasadenastarnews.com",255],["pe.com",255],["presstelegram.com",255],["redlandsdailyfacts.com",255],["reviewjournal.com",255],["santacruzsentinel.com",255],["saratogian.com",255],["sentinelandenterprise.com",255],["sgvtribune.com",255],["tampabay.com",255],["times-standard.com",255],["theoaklandpress.com",255],["trentonian.com",255],["twincities.com",255],["whittierdailynews.com",255],["bostonherald.com",255],["dailycamera.com",255],["sbsun.com",255],["dailydemocrat.com",255],["montereyherald.com",255],["orovillemr.com",255],["record-bee.com",255],["redbluffdailynews.com",255],["reporterherald.com",255],["thereporter.com",255],["timescall.com",255],["timesheraldonline.com",255],["ukiahdailyjournal.com",255],["dailylocal.com",255],["mercurynews.com",255],["suedkurier.de",256],["anysex.com",258],["icdrama.*",259],["mangasail.*",259],["pornve.com",260],["file4go.*",261],["coolrom.com.au",261],["marie-claire.es",262],["gamezhero.com",262],["flashgirlgames.com",262],["onlinesudoku.games",262],["mpg.football",262],["sssam.com",262],["globalnews.ca",263],["drinksmixer.com",264],["leitesculinaria.com",264],["fupa.net",265],["browardpalmbeach.com",266],["dallasobserver.com",266],["houstonpress.com",266],["miaminewtimes.com",266],["phoenixnewtimes.com",266],["westword.com",266],["nowtv.com.tr",267],["caminspector.net",268],["camwhoreshd.com",268],["camgoddess.tv",268],["gay4porn.com",270],["mypornhere.com",270],["mangovideo.*",271],["love4porn.com",271],["thotvids.com",271],["watchmdh.to",271],["celebwhore.com",271],["cluset.com",271],["sexlist.tv",271],["4kporn.xxx",271],["xhomealone.com",271],["lusttaboo.com",[271,538]],["hentai-moon.com",271],["camhub.cc",[271,696]],["mediapason.it",274],["linkspaid.com",274],["tuotromedico.com",274],["neoteo.com",274],["phoneswiki.com",274],["celebmix.com",274],["myneobuxportal.com",274],["oyungibi.com",274],["25yearslatersite.com",274],["jeshoots.com",275],["techhx.com",275],["karanapk.com",275],["flashplayer.fullstacks.net",277],["cloudapps.herokuapp.com",277],["youfiles.herokuapp.com",277],["texteditor.nsspot.net",277],["temp-mail.org",278],["asianclub.*",279],["javhdporn.net",279],["vidmoly.*",280],["comnuan.com",281],["veedi.com",282],["battleboats.io",282],["anitube.*",283],["fruitlab.com",283],["haddoz.net",283],["streamingcommunity.*",283],["garoetpos.com",283],["stiletv.it",284],["hqtv.biz",285],["liveuamap.com",286],["audycje.tokfm.pl",287],["shush.se",288],["allkpop.com",289],["empire-anime.*",[290,587,588,589,590,591]],["empire-streaming.*",[290,587,588,589]],["empire-anime.com",[290,587,588,589]],["empire-streamz.fr",[290,587,588,589]],["empire-stream.*",[290,587,588,589]],["pickcrackpasswords.blogspot.com",291],["kfrfansub.com",292],["thuglink.com",292],["voipreview.org",292],["illicoporno.com",293],["lavoixdux.com",293],["tonpornodujour.com",293],["jacquieetmichel.net",293],["swame.com",293],["vosfemmes.com",293],["voyeurfrance.net",293],["jacquieetmicheltv.net",[293,646,647]],["pogo.com",294],["cloudvideo.tv",295],["legionjuegos.org",296],["legionpeliculas.org",296],["legionprogramas.org",296],["16honeys.com",297],["elespanol.com",298],["remodelista.com",299],["audiofanzine.com",303],["uploadev.*",304],["developerinsider.co",305],["thehindu.com",306],["cambro.tv",[307,308]],["boobsradar.com",[308,402,716]],["nibelungen-kurier.de",309],["adfoc.us",310],["tackledsoul.com",310],["adrino1.bonloan.xyz",310],["vi-music.app",310],["instanders.app",310],["rokni.xyz",310],["keedabankingnews.com",310],["tea-coffee.net",310],["spatsify.com",310],["newedutopics.com",310],["getviralreach.in",310],["edukaroo.com",310],["funkeypagali.com",310],["careersides.com",310],["nayisahara.com",310],["wikifilmia.com",310],["infinityskull.com",310],["viewmyknowledge.com",310],["iisfvirtual.in",310],["starxinvestor.com",310],["jkssbalerts.com",310],["sahlmarketing.net",310],["filmypoints.in",310],["fitnessholic.net",310],["moderngyan.com",310],["sattakingcharts.in",310],["bankshiksha.in",310],["earn.mpscstudyhub.com",310],["earn.quotesopia.com",310],["money.quotesopia.com",310],["best-mobilegames.com",310],["learn.moderngyan.com",310],["bharatsarkarijobalert.com",310],["quotesopia.com",310],["creditsgoal.com",310],["bgmi32bitapk.in",310],["techacode.com",310],["trickms.com",310],["ielts-isa.edu.vn",310],["loan.punjabworks.com",310],["sptfy.be",310],["mcafee-com.com",[310,383]],["pianetamountainbike.it",311],["barchart.com",312],["modelisme.com",313],["parasportontario.ca",313],["prescottenews.com",313],["nrj-play.fr",314],["hackingwithreact.com",315],["gutekueche.at",316],["peekvids.com",317],["playvids.com",317],["pornflip.com",317],["redensarten-index.de",318],["vw-page.com",319],["viz.com",[320,321]],["0rechner.de",322],["configspc.com",323],["xopenload.me",323],["uptobox.com",323],["uptostream.com",323],["japgay.com",324],["mega-debrid.eu",325],["dreamdth.com",326],["diaridegirona.cat",328],["diariodeibiza.es",328],["diariodemallorca.es",328],["diarioinformacion.com",328],["eldia.es",328],["emporda.info",328],["farodevigo.es",328],["laopinioncoruna.es",328],["laopiniondemalaga.es",328],["laopiniondemurcia.es",328],["laopiniondezamora.es",328],["laprovincia.es",328],["levante-emv.com",328],["mallorcazeitung.es",328],["regio7.cat",328],["superdeporte.es",328],["playpaste.com",329],["cnbc.com",330],["firefaucet.win",331],["74k.io",[332,333]],["cloudwish.xyz",333],["gradehgplus.com",333],["javindo.site",333],["javindosub.site",333],["kamehaus.net",333],["movearnpre.com",333],["arabshentai.com>>",333],["javdo.cc>>",333],["javenglish.cc>>",333],["javhd.*>>",333],["javhdz.*>>",333],["roshy.tv>>",333],["sextb.*>>",333],["fullhdxxx.com",335],["pornclassic.tube",336],["tubepornclassic.com",336],["etonline.com",337],["creatur.io",337],["lookcam.*",337],["drphil.com",337],["urbanmilwaukee.com",337],["hideandseek.world",337],["myabandonware.com",337],["kendam.com",337],["wttw.com",337],["synonyms.com",337],["definitions.net",337],["hostmath.com",337],["camvideoshub.com",337],["minhaconexao.com.br",337],["home-made-videos.com",339],["amateur-couples.com",339],["slutdump.com",339],["artificialnudes.com",339],["asianal.xyz",339],["asianmassage.xyz",339],["bdsmkingdom.xyz",339],["brunettedeepthroat.com",339],["compilationtube.xyz",339],["cosplaynsfw.xyz",339],["crazytoys.xyz",339],["deepswapnude.com",339],["fikfak.net",339],["flexxporn.com",339],["handypornos.net",339],["hardcorelesbian.xyz",339],["heimporno.com",339],["instaporno.net",339],["latinabbw.xyz",339],["nsfwhowto.xyz",339],["platinporno.com",339],["pornahegao.xyz",339],["pornfeet.xyz",339],["pornobait.com",339],["pornretro.xyz",339],["redheaddeepthroat.com",339],["romanticlesbian.com",339],["sexfilmkiste.com",339],["sexontheboat.xyz",339],["sexroute.net",339],["sommerporno.com",339],["towheaddeepthroat.com",339],["traumporno.com",339],["dpstream.*",340],["produsat.com",341],["bluemediafiles.*",342],["12thman.com",343],["acusports.com",343],["atlantic10.com",343],["auburntigers.com",343],["baylorbears.com",343],["bceagles.com",343],["bgsufalcons.com",343],["big12sports.com",343],["bigten.org",343],["bradleybraves.com",343],["butlersports.com",343],["cmumavericks.com",343],["conferenceusa.com",343],["cyclones.com",343],["dartmouthsports.com",343],["daytonflyers.com",343],["dbupatriots.com",343],["dbusports.com",343],["denverpioneers.com",343],["fduknights.com",343],["fgcuathletics.com",343],["fightinghawks.com",343],["fightingillini.com",343],["floridagators.com",343],["friars.com",343],["friscofighters.com",343],["gamecocksonline.com",343],["goarmywestpoint.com",343],["gobison.com",343],["goblueraiders.com",343],["gobobcats.com",343],["gocards.com",343],["gocreighton.com",343],["godeacs.com",343],["goexplorers.com",343],["goetbutigers.com",343],["gofrogs.com",343],["gogriffs.com",343],["gogriz.com",343],["golobos.com",343],["gomarquette.com",343],["gopack.com",343],["gophersports.com",343],["goprincetontigers.com",343],["gopsusports.com",343],["goracers.com",343],["goshockers.com",343],["goterriers.com",343],["gotigersgo.com",343],["gousfbulls.com",343],["govandals.com",343],["gowyo.com",343],["goxavier.com",343],["gozags.com",343],["gozips.com",343],["griffinathletics.com",343],["guhoyas.com",343],["gwusports.com",343],["hailstate.com",343],["hamptonpirates.com",343],["hawaiiathletics.com",343],["hokiesports.com",343],["huskers.com",343],["icgaels.com",343],["iuhoosiers.com",343],["jsugamecocksports.com",343],["longbeachstate.com",343],["loyolaramblers.com",343],["lrtrojans.com",343],["lsusports.net",343],["morrisvillemustangs.com",343],["msuspartans.com",343],["muleriderathletics.com",343],["mutigers.com",343],["navysports.com",343],["nevadawolfpack.com",343],["niuhuskies.com",343],["nkunorse.com",343],["nuhuskies.com",343],["nusports.com",343],["okstate.com",343],["olemisssports.com",343],["omavs.com",343],["ovcsports.com",343],["owlsports.com",343],["purduesports.com",343],["redstormsports.com",343],["richmondspiders.com",343],["sfajacks.com",343],["shupirates.com",343],["siusalukis.com",343],["smcgaels.com",343],["smumustangs.com",343],["soconsports.com",343],["soonersports.com",343],["themw.com",343],["tulsahurricane.com",343],["txst.com",343],["txstatebobcats.com",343],["ubbulls.com",343],["ucfknights.com",343],["ucirvinesports.com",343],["uconnhuskies.com",343],["uhcougars.com",343],["uicflames.com",343],["umterps.com",343],["uncwsports.com",343],["unipanthers.com",343],["unlvrebels.com",343],["uoflsports.com",343],["usdtoreros.com",343],["utahstateaggies.com",343],["utepathletics.com",343],["utrockets.com",343],["uvmathletics.com",343],["uwbadgers.com",343],["villanova.com",343],["wkusports.com",343],["wmubroncos.com",343],["woffordterriers.com",343],["1pack1goal.com",343],["bcuathletics.com",343],["bubraves.com",343],["goblackbears.com",343],["golightsgo.com",343],["gomcpanthers.com",343],["goutsa.com",343],["mercerbears.com",343],["pirateblue.com",343],["pirateblue.net",343],["pirateblue.org",343],["quinnipiacbobcats.com",343],["towsontigers.com",343],["tribeathletics.com",343],["tribeclub.com",343],["utepminermaniacs.com",343],["utepminers.com",343],["wkutickets.com",343],["aopathletics.org",343],["atlantichockeyonline.com",343],["bigsouthnetwork.com",343],["bigsouthsports.com",343],["chawomenshockey.com",343],["dbupatriots.org",343],["drakerelays.org",343],["ecac.org",343],["ecacsports.com",343],["emueagles.com",343],["emugameday.com",343],["gculopes.com",343],["godrakebulldog.com",343],["godrakebulldogs.com",343],["godrakebulldogs.net",343],["goeags.com",343],["goislander.com",343],["goislanders.com",343],["gojacks.com",343],["gomacsports.com",343],["gseagles.com",343],["hubison.com",343],["iowaconference.com",343],["ksuowls.com",343],["lonestarconference.org",343],["mascac.org",343],["midwestconference.org",343],["mountaineast.org",343],["niu-pack.com",343],["nulakers.ca",343],["oswegolakers.com",343],["ovcdigitalnetwork.com",343],["pacersports.com",343],["rmacsports.org",343],["rollrivers.com",343],["samfordsports.com",343],["uncpbraves.com",343],["usfdons.com",343],["wiacsports.com",343],["alaskananooks.com",343],["broncathleticfund.com",343],["cameronaggies.com",343],["columbiacougars.com",343],["etownbluejays.com",343],["gobadgers.ca",343],["golancers.ca",343],["gometrostate.com",343],["gothunderbirds.ca",343],["kentstatesports.com",343],["lehighsports.com",343],["lopers.com",343],["lycoathletics.com",343],["lycomingathletics.com",343],["maraudersports.com",343],["mauiinvitational.com",343],["msumavericks.com",343],["nauathletics.com",343],["nueagles.com",343],["nwusports.com",343],["oceanbreezenyc.org",343],["patriotathleticfund.com",343],["pittband.com",343],["principiaathletics.com",343],["roadrunnersathletics.com",343],["sidearmsocial.com",343],["snhupenmen.com",343],["stablerarena.com",343],["stoutbluedevils.com",343],["uwlathletics.com",343],["yumacs.com",343],["collegefootballplayoff.com",343],["csurams.com",343],["cubuffs.com",343],["gobearcats.com",343],["gohuskies.com",343],["mgoblue.com",343],["osubeavers.com",343],["pittsburghpanthers.com",343],["rolltide.com",343],["texassports.com",343],["thesundevils.com",343],["uclabruins.com",343],["wvuathletics.com",343],["wvusports.com",343],["arizonawildcats.com",343],["calbears.com",343],["cuse.com",343],["georgiadogs.com",343],["goducks.com",343],["goheels.com",343],["gostanford.com",343],["insidekstatesports.com",343],["insidekstatesports.info",343],["insidekstatesports.net",343],["insidekstatesports.org",343],["k-stateathletics.com",343],["k-statefootball.net",343],["k-statefootball.org",343],["k-statesports.com",343],["k-statesports.net",343],["k-statesports.org",343],["k-statewomenshoops.com",343],["k-statewomenshoops.net",343],["k-statewomenshoops.org",343],["kstateathletics.com",343],["kstatefootball.net",343],["kstatefootball.org",343],["kstatesports.com",343],["kstatewomenshoops.com",343],["kstatewomenshoops.net",343],["kstatewomenshoops.org",343],["ksuathletics.com",343],["ksusports.com",343],["scarletknights.com",343],["showdownforrelief.com",343],["syracusecrunch.com",343],["texastech.com",343],["theacc.com",343],["ukathletics.com",343],["usctrojans.com",343],["utahutes.com",343],["utsports.com",343],["wsucougars.com",343],["vidlii.com",[343,366]],["tricksplit.io",343],["fangraphs.com",344],["stern.de",345],["geo.de",345],["brigitte.de",345],["schoener-wohnen.de",345],["welt.de",346],["tvspielfilm.de",347],["tvtoday.de",347],["chip.de",347],["focus.de",347],["fitforfun.de",347],["n-tv.de",348],["rtl.de",348],["player.rtl2.de",349],["planetaminecraft.com",350],["cravesandflames.com",351],["codesnse.com",351],["flyad.vip",351],["lapresse.ca",352],["kolyoom.com",353],["ilovephd.com",353],["negumo.com",354],["games.wkb.jp",[355,356]],["kenshi.fandom.com",358],["hausbau-forum.de",359],["homeairquality.org",359],["call4cloud.nl",359],["fake-it.ws",360],["laksa19.github.io",361],["1shortlink.com",362],["u-s-news.com",363],["luscious.net",364],["makemoneywithurl.com",365],["junkyponk.com",365],["healthfirstweb.com",365],["vocalley.com",365],["yogablogfit.com",365],["howifx.com",365],["en.financerites.com",365],["mythvista.com",365],["livenewsflix.com",365],["cureclues.com",365],["apekite.com",365],["enit.in",365],["iammagnus.com",366],["dailyvideoreports.net",366],["unityassets4free.com",366],["docer.*",367],["resetoff.pl",367],["sexodi.com",367],["cdn77.org",368],["momxxxsex.com",369],["penisbuyutucum.net",369],["ujszo.com",370],["newsmax.com",371],["nadidetarifler.com",372],["siz.tv",372],["suzylu.co.uk",[373,374]],["onworks.net",375],["yabiladi.com",375],["downloadsoft.net",376],["newsobserver.com",377],["arkadiumhosted.com",377],["testlanguages.com",378],["newsinlevels.com",378],["videosinlevels.com",378],["procinehub.com",379],["bookmystrip.com",379],["imagereviser.com",380],["pubgaimassist.com",381],["gyanitheme.com",381],["tech.trendingword.com",381],["blog.potterworld.co",381],["hipsonyc.com",381],["tech.pubghighdamage.com",381],["blog.itijobalert.in",381],["techkhulasha.com",381],["jiocinema.com",381],["rapid-cloud.co",381],["uploadmall.com",381],["4funbox.com",382],["nephobox.com",382],["1024tera.com",382],["terabox.*",382],["starkroboticsfrc.com",383],["sinonimos.de",383],["antonimos.de",383],["quesignifi.ca",383],["tiktokrealtime.com",383],["tiktokcounter.net",383],["tpayr.xyz",383],["poqzn.xyz",383],["ashrfd.xyz",383],["rezsx.xyz",383],["tryzt.xyz",383],["ashrff.xyz",383],["rezst.xyz",383],["dawenet.com",383],["erzar.xyz",383],["waezm.xyz",383],["waezg.xyz",383],["blackwoodacademy.org",383],["cryptednews.space",383],["vivuq.com",383],["swgop.com",383],["vbnmll.com",383],["telcoinfo.online",383],["dshytb.com",383],["btcbitco.in",[383,384]],["btcsatoshi.net",383],["cempakajaya.com",383],["crypto4yu.com",383],["readbitcoin.org",383],["wiour.com",383],["finish.addurl.biz",383],["aiimgvlog.fun",[383,387]],["laweducationinfo.com",383],["savemoneyinfo.com",383],["worldaffairinfo.com",383],["godstoryinfo.com",383],["successstoryinfo.com",383],["cxissuegk.com",383],["learnmarketinfo.com",383],["bhugolinfo.com",383],["armypowerinfo.com",383],["rsgamer.app",383],["phonereviewinfo.com",383],["makeincomeinfo.com",383],["gknutshell.com",383],["vichitrainfo.com",383],["workproductivityinfo.com",383],["dopomininfo.com",383],["hostingdetailer.com",383],["fitnesssguide.com",383],["tradingfact4u.com",383],["cryptofactss.com",383],["softwaredetail.com",383],["artoffocas.com",383],["insurancesfact.com",383],["travellingdetail.com",383],["advertisingexcel.com",383],["allcryptoz.net",383],["batmanfactor.com",383],["beautifulfashionnailart.com",383],["crewbase.net",383],["documentaryplanet.xyz",383],["crewus.net",383],["gametechreviewer.com",383],["midebalonu.net",383],["misterio.ro",383],["phineypet.com",383],["seory.xyz",383],["shinbhu.net",383],["shinchu.net",383],["substitutefor.com",383],["talkforfitness.com",383],["thefitbrit.co.uk",383],["thumb8.net",383],["thumb9.net",383],["topcryptoz.net",383],["uniqueten.net",383],["ultraten.net",383],["exactpay.online",383],["quins.us",383],["kiddyearner.com",383],["bildirim.*",386],["arahdrive.com",387],["appsbull.com",388],["diudemy.com",388],["maqal360.com",[388,389,390]],["lifesurance.info",391],["akcartoons.in",392],["cybercityhelp.in",392],["dl.apkmoddone.com",393],["phongroblox.com",393],["fuckingfast.net",394],["buzzheavier.com",394],["tickhosting.com",395],["in91vip.win",396],["datavaults.co",397],["t-online.de",399],["upornia.*",[400,401]],["bobs-tube.com",402],["pornohirsch.net",403],["bembed.net",404],["embedv.net",404],["javguard.club",404],["listeamed.net",404],["v6embed.xyz",404],["vembed.*",404],["vid-guard.com",404],["vinomo.xyz",404],["nekolink.site",[405,406]],["141jav.com",407],["141tube.com",407],["aagmaal.com",407],["camcam.cc",407],["evojav.pro",407],["javneon.tv",407],["javsaga.ninja",407],["nyahentai.re",407],["torrentkitty.one",407],["webmaal.cfd",407],["pixsera.net",408],["jnews5.com",409],["pc-builds.com",410],["today.com",410],["videogamer.com",410],["wrestlinginc.com",410],["azcentral.com",411],["coloradoan.com",411],["greenbaypressgazette.com",411],["palmbeachpost.com",411],["usatoday.com",[411,412]],["ydr.com",411],["247sports.com",413],["indiatimes.com",414],["netzwelt.de",415],["filmibeat.com",416],["goodreturns.in",416],["mykhel.com",416],["daemonanime.net",416],["luckydice.net",416],["weatherwx.com",416],["sattaguess.com",416],["winshell.de",416],["rosasidan.ws",416],["upiapi.in",416],["networkhint.com",416],["thichcode.net",416],["texturecan.com",416],["tikmate.app",[416,628]],["arcaxbydz.id",416],["quotesshine.com",416],["worldhistory.org",417],["arcade.buzzrtv.com",418],["arcade.dailygazette.com",418],["arcade.lemonde.fr",418],["arena.gamesforthebrain.com",418],["bestpuzzlesandgames.com",418],["cointiply.arkadiumarena.com",418],["gamelab.com",418],["gameplayneo.com",418],["games.abqjournal.com",418],["games.arkadium.com",418],["games.amny.com",418],["games.bellinghamherald.com",418],["games.besthealthmag.ca",418],["games.bnd.com",418],["games.boston.com",418],["games.bostonglobe.com",418],["games.bradenton.com",418],["games.centredaily.com",418],["games.charlottegames.cnhinews.com",418],["games.crosswordgiant.com",418],["games.dailymail.co.uk",418],["games.dallasnews.com",418],["games.daytondailynews.com",418],["games.denverpost.com",418],["games.everythingzoomer.com",418],["games.fresnobee.com",418],["games.gameshownetwork.com",418],["games.get.tv",418],["games.greatergood.com",418],["games.heraldonline.com",418],["games.heraldsun.com",418],["games.idahostatesman.com",418],["games.insp.com",418],["games.islandpacket.com",418],["games.journal-news.com",418],["games.kansas.com",418],["games.kansascity.com",418],["games.kentucky.com",418],["games.lancasteronline.com",418],["games.ledger-enquirer.com",418],["games.macon.com",418],["games.mashable.com",418],["games.mercedsunstar.com",418],["games.metro.us",418],["games.metv.com",418],["games.miamiherald.com",418],["games.modbee.com",418],["games.moviestvnetwork.com",418],["games.myrtlebeachonline.com",418],["games.games.newsgames.parade.com",418],["games.pressdemocrat.com",418],["games.puzzlebaron.com",418],["games.puzzler.com",418],["games.puzzles.ca",418],["games.qns.com",418],["games.readersdigest.ca",418],["games.sacbee.com",418],["games.sanluisobispo.com",418],["games.sixtyandme.com",418],["games.sltrib.com",418],["games.springfieldnewssun.com",418],["games.star-telegram.com",418],["games.startribune.com",418],["games.sunherald.com",418],["games.theadvocate.com",418],["games.thenewstribune.com",418],["games.theolympian.com",418],["games.theportugalnews.com",418],["games.thestar.com",418],["games.thestate.com",418],["games.tri-cityherald.com",418],["games.triviatoday.com",418],["games.usnews.com",418],["games.word.tips",418],["games.wordgenius.com",418],["games.wtop.com",418],["jeux.meteocity.com",418],["juegos.as.com",418],["juegos.elnuevoherald.com",418],["juegos.elpais.com",418],["philly.arkadiumarena.com",418],["play.dictionary.com",418],["puzzles.bestforpuzzles.com",418],["puzzles.centralmaine.com",418],["puzzles.crosswordsolver.org",418],["puzzles.independent.co.uk",418],["puzzles.nola.com",418],["puzzles.pressherald.com",418],["puzzles.standard.co.uk",418],["puzzles.sunjournal.com",418],["arkadium.com",419],["abysscdn.com",[420,421]],["turtleviplay.xyz",422],["mixdrop.*",423],["ai.hubtoday.app",424],["news.now.com",425],["qub.ca",426],["matele.be",427],["gostyn24.pl",428],["wirtualnemedia.pl",429],["lared.cl",430],["atozmath.com",[430,454,455,456,457,458,459]],["pcbolsa.com",431],["hdfilmizlesen.com",432],["watch.rkplayer.xyz",433],["arcai.com",434],["my-code4you.blogspot.com",435],["flickr.com",436],["firefile.cc",437],["pestleanalysis.com",437],["kochamjp.pl",437],["tutorialforlinux.com",437],["whatsaero.com",437],["animeblkom.net",[437,451]],["blkom.com",437],["globes.co.il",[438,439]],["jardiner-malin.fr",440],["tw-calc.net",441],["ohmybrush.com",442],["talkceltic.net",443],["mentalfloss.com",444],["uprafa.com",445],["cube365.net",446],["wwwfotografgotlin.blogspot.com",447],["freelistenonline.com",447],["badassdownloader.com",448],["quickporn.net",449],["yellowbridge.com",450],["aosmark.com",452],["ctrlv.*",453],["newyorker.com",460],["brighteon.com",[461,462]],["more.tv",463],["video1tube.com",464],["alohatube.xyz",464],["4players.de",465],["onlinesoccermanager.com",465],["fshost.me",466],["link.cgtips.org",467],["hentaicloud.com",468],["paperzonevn.com",470],["9jarock.org",471],["fzmovies.info",471],["fztvseries.ng",471],["netnaijas.com",471],["hentaienglish.com",472],["hentaiporno.xxx",472],["venge.io",[473,474]],["its.porn",[475,476]],["atv.at",477],["2ndrun.tv",478],["rackusreads.com",478],["teachmemicro.com",478],["willcycle.com",478],["kusonime.com",[479,480]],["123movieshd.*",481],["imgur.com",[482,483,758]],["hentai-party.com",484],["hentaicomics.pro",484],["uproxy.*",485],["animesa.*",486],["subtitleone.cc",487],["mysexgames.com",488],["ancient-origins.*",489],["cinecalidad.*",[490,491]],["xnxx.*",492],["xvideos.*",492],["gdr-online.com",493],["mmm.dk",494],["iqiyi.com",[495,496,618]],["m.iqiyi.com",497],["nbcolympics.com",498],["apkhex.com",499],["indiansexstories2.net",500],["issstories.xyz",500],["1340kbbr.com",501],["gorgeradio.com",501],["kduk.com",501],["kedoam.com",501],["kejoam.com",501],["kelaam.com",501],["khsn1230.com",501],["kjmx.rocks",501],["kloo.com",501],["klooam.com",501],["klykradio.com",501],["kmed.com",501],["kmnt.com",501],["kpnw.com",501],["kppk983.com",501],["krktcountry.com",501],["ktee.com",501],["kwro.com",501],["kxbxfm.com",501],["thevalley.fm",501],["quizlet.com",502],["dsocker1234.blogspot.com",503],["schoolcheats.net",[504,505]],["mgnet.xyz",506],["designtagebuch.de",507],["pixroute.com",508],["uploady.io",509],["calculator-online.net",510],["porngames.club",511],["sexgames.xxx",511],["111.90.159.132",512],["mobile-tracker-free.com",513],["social-unlock.com",514],["superpsx.com",515],["ninja.io",516],["sourceforge.net",517],["samfirms.com",518],["rapelust.com",519],["vtube.to",519],["desitelugusex.com",519],["dvdplay.*",519],["xvideos-downloader.net",519],["xxxvideotube.net",519],["sdefx.cloud",519],["nozomi.la",519],["banned.video",520],["madmaxworld.tv",520],["androidpolice.com",520],["babygaga.com",520],["backyardboss.net",520],["carbuzz.com",520],["cbr.com",520],["collider.com",520],["dualshockers.com",520],["footballfancast.com",520],["footballleagueworld.co.uk",520],["gamerant.com",520],["givemesport.com",520],["hardcoregamer.com",520],["hotcars.com",520],["howtogeek.com",520],["makeuseof.com",520],["moms.com",520],["movieweb.com",520],["pocket-lint.com",520],["pocketnow.com",520],["screenrant.com",520],["simpleflying.com",520],["thegamer.com",520],["therichest.com",520],["thesportster.com",520],["thethings.com",520],["thetravel.com",520],["topspeed.com",520],["xda-developers.com",520],["huffpost.com",521],["ingles.com",522],["spanishdict.com",522],["surfline.com",[523,524]],["play.tv3.ee",525],["play.tv3.lt",525],["play.tv3.lv",[525,526]],["tv3play.skaties.lv",525],["bulbagarden.net",527],["hollywoodlife.com",528],["mat6tube.com",529],["hotabis.com",530],["root-nation.com",530],["italpress.com",530],["airsoftmilsimnews.com",530],["artribune.com",530],["newtumbl.com",531],["apkmaven.*",532],["photopea.com",533],["aruble.net",534],["nevcoins.club",535],["mail.com",536],["gmx.*",537],["mangakita.id",539],["avpgalaxy.net",540],["panda-novel.com",541],["lightsnovel.com",541],["eaglesnovel.com",541],["pandasnovel.com",541],["ewrc-results.com",542],["kizi.com",543],["cyberscoop.com",544],["fedscoop.com",544],["jeep-cj.com",545],["sponsorhunter.com",546],["cloudcomputingtopics.net",547],["likecs.com",548],["tiscali.it",549],["linkspy.cc",550],["adshnk.com",551],["chattanoogan.com",552],["adsy.pw",553],["playstore.pw",553],["windowspro.de",554],["tvtv.ca",555],["tvtv.us",555],["mydaddy.cc",556],["roadtrippin.fr",557],["vavada5com.com",558],["anyporn.com",[559,576]],["bravoporn.com",559],["bravoteens.com",559],["crocotube.com",559],["hellmoms.com",559],["hellporno.com",559],["sex3.com",559],["tubewolf.com",559],["xbabe.com",559],["xcum.com",559],["zedporn.com",559],["imagetotext.info",560],["infokik.com",561],["freepik.com",562],["ddwloclawek.pl",[563,564]],["www.seznam.cz",565],["deezer.com",566],["my-subs.co",567],["plaion.com",568],["slideshare.net",[569,570]],["ustreasuryyieldcurve.com",571],["businesssoftwarehere.com",572],["goo.st",572],["freevpshere.com",572],["softwaresolutionshere.com",572],["gamereactor.*",574],["madoohd.com",575],["doomovie-hd.*",575],["staige.tv",577],["androidadult.com",578],["streamvid.net",579],["watchtv24.com",580],["cellmapper.net",581],["medscape.com",582],["newscon.org",[583,584]],["wheelofgold.com",585],["drakecomic.*",585],["app.blubank.com",586],["mobileweb.bankmellat.ir",586],["ccthesims.com",593],["chromeready.com",593],["dtbps3games.com",593],["illustratemagazine.com",593],["uknip.co.uk",593],["vod.pl",594],["megadrive-emulator.com",595],["tvhay.*",[596,597]],["moviesapi.club",598],["watchx.top",598],["digimanie.cz",599],["svethardware.cz",599],["srvy.ninja",600],["chat.tchatche.com",[601,602]],["cnn.com",[603,604,605]],["news.bg",606],["edmdls.com",607],["freshremix.net",607],["scenedl.org",607],["trakt.tv",608],["shroomers.app",609],["classicalradio.com",610],["di.fm",610],["jazzradio.com",610],["radiotunes.com",610],["rockradio.com",610],["zenradio.com",610],["getthit.com",611],["techedubyte.com",612],["iwanttfc.com",613],["nutraingredients-asia.com",614],["nutraingredients-latam.com",614],["nutraingredients-usa.com",614],["nutraingredients.com",614],["ozulscansen.com",615],["nexusmods.com",616],["lookmovie.*",617],["lookmovie2.to",617],["biletomat.pl",619],["hextank.io",[620,621]],["filmizlehdfilm.com",[622,623,624,625]],["filmizletv.*",[622,623,624,625]],["fullfilmizle.cc",[622,623,624,625]],["gofilmizle.net",[622,623,624,625]],["cimanow.cc",626],["bgmiupdate.com.in",626],["freex2line.online",627],["btvplus.bg",629],["sagewater.com",630],["redlion.net",630],["filmweb.pl",631],["satdl.com",632],["vidstreaming.xyz",633],["everand.com",634],["myradioonline.pl",635],["cbs.com",636],["paramountplus.com",636],["colourxh.site",637],["fullxh.com",637],["galleryxh.site",637],["megaxh.com",637],["movingxh.world",637],["seexh.com",637],["unlockxh4.com",637],["valuexh.life",637],["xhaccess.com",637],["xhadult2.com",637],["xhadult3.com",637],["xhadult4.com",637],["xhadult5.com",637],["xhamster.*",637],["xhamster1.*",637],["xhamster10.*",637],["xhamster11.*",637],["xhamster12.*",637],["xhamster13.*",637],["xhamster14.*",637],["xhamster15.*",637],["xhamster16.*",637],["xhamster17.*",637],["xhamster18.*",637],["xhamster19.*",637],["xhamster20.*",637],["xhamster2.*",637],["xhamster3.*",637],["xhamster4.*",637],["xhamster42.*",637],["xhamster46.com",637],["xhamster5.*",637],["xhamster7.*",637],["xhamster8.*",637],["xhamsterporno.mx",637],["xhbig.com",637],["xhbranch5.com",637],["xhchannel.com",637],["xhdate.world",637],["xhlease.world",637],["xhmoon5.com",637],["xhofficial.com",637],["xhopen.com",637],["xhplanet1.com",637],["xhplanet2.com",637],["xhreal2.com",637],["xhreal3.com",637],["xhspot.com",637],["xhtotal.com",637],["xhtree.com",637],["xhvictory.com",637],["xhwebsite.com",637],["xhwebsite2.com",637],["xhwebsite5.com",637],["xhwide1.com",637],["xhwide2.com",637],["xhwide5.com",637],["file-upload.net",638],["tunein.com",639],["acortalo.*",[641,642,643,644]],["acortar.*",[641,642,643,644]],["hentaihaven.xxx",645],["jacquieetmicheltv2.net",647],["a2zapk.*",648],["fcportables.com",[649,650]],["emurom.net",651],["freethesaurus.com",[652,653]],["thefreedictionary.com",[652,653]],["oeffentlicher-dienst.info",654],["im9.eu",[655,656]],["dcdlplayer8a06f4.xyz",657],["ultimate-guitar.com",658],["claimbits.net",659],["sexyscope.net",660],["kickassanime.*",661],["recherche-ebook.fr",662],["virtualdinerbot.com",662],["zonebourse.com",663],["pink-sluts.net",664],["andhrafriends.com",665],["benzinpreis.de",666],["defenseone.com",667],["govexec.com",667],["nextgov.com",667],["route-fifty.com",667],["sharing.wtf",668],["wetter3.de",669],["esportivos.fun",670],["cosmonova-broadcast.tv",671],["538.nl",672],["hartvannederland.nl",672],["kijk.nl",672],["shownieuws.nl",672],["vandaaginside.nl",672],["rock.porn",[673,674]],["videzz.net",[675,676]],["ezaudiobookforsoul.com",677],["club386.com",678],["decompiler.com",[679,680]],["littlebigsnake.com",681],["easyfun.gg",682],["smailpro.com",683],["ilgazzettino.it",684],["ilmessaggero.it",684],["3bmeteo.com",[685,686]],["mconverter.eu",687],["lover937.net",688],["10gb.vn",689],["pes6.es",690],["tactics.tools",[691,692]],["boundhub.com",693],["reliabletv.me",694],["filecrypt.*",695],["wired.com",697],["spankbang.*",[698,699,700,762,763]],["hulu.com",[701,702,703]],["hanime.tv",704],["nhentai.net",[705,706,707]],["pouvideo.*",708],["povvideo.*",708],["povw1deo.*",708],["povwideo.*",708],["powv1deo.*",708],["powvibeo.*",708],["powvideo.*",708],["powvldeo.*",708],["powcloud.org",709],["primevideo.com",710],["read.amazon.*",[710,711]],["anonymfile.com",712],["gofile.to",712],["dotycat.com",713],["rateyourmusic.com",714],["reporterpb.com.br",715],["blog-dnz.com",717],["18adultgames.com",718],["colnect.com",[719,720]],["adultgamesworld.com",721],["servustv.com",[722,723]],["reviewdiv.com",724],["parametric-architecture.com",725],["voiceofdenton.com",726],["concealednation.org",726],["askattest.com",727],["opensubtitles.com",728],["savefiles.com",729],["streamup.ws",730],["pfps.gg",731],["goodstream.one",732],["lecrabeinfo.net",733],["cerberusapp.com",734],["smashkarts.io",735],["beamng.wesupply.cx",736],["wowtv.de",[737,738]],["jsfiddle.net",[739,740]],["musicbusinessworldwide.com",741],["mahfda.com",742],["agar.live",743],["dailymotion.com",744],["live.arynews.tv",745],["pornlore.com",[746,747]],["91porn.com",748],["spedostream2.shop",749],["play.watch20.space",749],["zkillboard.com",750],["www.google.*",751],["dataunlocker.com",[752,753]],["androidacy.com",[752,753]],["tacobell.com",754],["zefoy.com",755],["cnet.com",756],["trendyol.com",[759,760]],["trendyol-milla.com",[759,760]],["natgeotv.com",761],["globo.com",764],["linklog.tiagorangel.com",766],["wayfair.com",767]]);
const exceptionsMap = new Map([["cloudflare.com",[0]],["pingit.com",[189]],["loan.bgmi32bitapk.in",[310]],["lookmovie.studio",[617]]]);
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
