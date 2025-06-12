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
const argsList = [["console.clear","undefined"],["adBlockDetected","undefined"],["amzn_aps_csm.init","noopFunc"],["amzn_aps_csm.log","noopFunc"],["akamaiDisableServerIpLookup","noopFunc"],["DD_RUM.addAction","noopFunc"],["nads.createAd","trueFunc"],["ga","noopFunc"],["huecosPBS.nstdX","null"],["DTM.trackAsyncPV","noopFunc"],["_satellite","{}"],["_satellite.getVisitorId","noopFunc"],["newPageViewSpeedtest","noopFunc"],["pubg.unload","noopFunc"],["generateGalleryAd","noopFunc"],["mediator","noopFunc"],["Object.prototype.subscribe","noopFunc"],["gbTracker","{}"],["gbTracker.sendAutoSearchEvent","noopFunc"],["Object.prototype.vjsPlayer.ads","noopFunc"],["network_user_id",""],["google.ima.OmidVerificationVendor","{}"],["Object.prototype.omidAccessModeRules","{}"],["googletag.cmd","{}"],["Object.prototype.setDisableFlashAds","noopFunc"],["DD_RUM.addTiming","noopFunc"],["chameleonVideo.adDisabledRequested","true"],["AdmostClient","{}"],["analytics","{}"],["datalayer","[]"],["Object.prototype.isInitialLoadDisabled","noopFunc"],["listingGoogleEETracking","noopFunc"],["dcsMultiTrack","noopFunc"],["urlStrArray","noopFunc"],["pa","{}"],["Object.prototype.setConfigurations","noopFunc"],["Object.prototype.bk_addPageCtx","noopFunc"],["Object.prototype.bk_doJSTag","noopFunc"],["passFingerPrint","noopFunc"],["optimizely","{}"],["optimizely.initialized","true"],["google_optimize","{}"],["google_optimize.get","noopFunc"],["_gsq","{}"],["_gsq.push","noopFunc"],["stmCustomEvent","noopFunc"],["_gsDevice",""],["iom","{}"],["iom.c","noopFunc"],["_conv_q","{}"],["_conv_q.push","noopFunc"],["google.ima.settings.setDisableFlashAds","noopFunc"],["pa.privacy","{}"],["populateClientData4RBA","noopFunc"],["YT.ImaManager","noopFunc"],["UOLPD","{}"],["UOLPD.dataLayer","{}"],["__configuredDFPTags","{}"],["URL_VAST_YOUTUBE","{}"],["Adman","{}"],["dplus","{}"],["dplus.track","noopFunc"],["_satellite.track","noopFunc"],["google.ima.dai","{}"],["gfkS2sExtension","{}"],["gfkS2sExtension.HTML5VODExtension","noopFunc"],["AnalyticsEventTrackingJS","{}"],["AnalyticsEventTrackingJS.addToBasket","noopFunc"],["AnalyticsEventTrackingJS.trackErrorMessage","noopFunc"],["initializeslideshow","noopFunc"],["fathom","{}"],["fathom.trackGoal","noopFunc"],["Origami","{}"],["Origami.fastclick","noopFunc"],["jad","undefined"],["hasAdblocker","true"],["Sentry","{}"],["Sentry.init","noopFunc"],["TRC","{}"],["TRC._taboolaClone","[]"],["fp","{}"],["fp.t","noopFunc"],["fp.s","noopFunc"],["initializeNewRelic","noopFunc"],["turnerAnalyticsObj","{}"],["turnerAnalyticsObj.setVideoObject4AnalyticsProperty","noopFunc"],["optimizelyDatafile","{}"],["optimizelyDatafile.featureFlags","[]"],["fingerprint","{}"],["fingerprint.getCookie","noopFunc"],["gform.utils","noopFunc"],["gform.utils.trigger","noopFunc"],["get_fingerprint","noopFunc"],["moatPrebidApi","{}"],["moatPrebidApi.getMoatTargetingForPage","noopFunc"],["cpd_configdata","{}"],["cpd_configdata.url",""],["yieldlove_cmd","{}"],["yieldlove_cmd.push","noopFunc"],["dataLayer.push","noopFunc"],["_etmc","{}"],["_etmc.push","noopFunc"],["freshpaint","{}"],["freshpaint.track","noopFunc"],["ShowRewards","noopFunc"],["stLight","{}"],["stLight.options","noopFunc"],["DD_RUM.addError","noopFunc"],["sensorsDataAnalytic201505","{}"],["sensorsDataAnalytic201505.init","noopFunc"],["sensorsDataAnalytic201505.quick","noopFunc"],["sensorsDataAnalytic201505.track","noopFunc"],["s","{}"],["s.tl","noopFunc"],["smartech","noopFunc"],["sensors","{}"],["sensors.init","noopFunc"],["sensors.track","noopFunc"],["adn","{}"],["adn.clearDivs","noopFunc"],["_vwo_code","{}"],["gtag","noopFunc"],["_taboola","{}"],["_taboola.push","noopFunc"],["clicky","{}"],["clicky.goal","noopFunc"],["WURFL","{}"],["_sp_.config.events.onSPPMObjectReady","noopFunc"],["gtm","{}"],["gtm.trackEvent","noopFunc"],["mParticle.Identity.getCurrentUser","noopFunc"],["JSGlobals.prebidEnabled","false"],["elasticApm","{}"],["elasticApm.init","noopFunc"],["Object.prototype.que","noopFunc"],["Object.prototype.que.push","noopFunc"],["ga.sendGaEvent","noopFunc"],["adobe","{}"],["MT","{}"],["MT.track","noopFunc"],["ClickOmniPartner","noopFunc"],["adex","{}"],["adex.getAdexUser","noopFunc"],["Adkit","noopFunc"],["Object.prototype.shouldExpectGoogleCMP","false"],["apntag.refresh","noopFunc"],["pa.sendEvent","noopFunc"],["Munchkin","{}"],["Munchkin.init","noopFunc"],["ttd_dom_ready","noopFunc"],["ramp","undefined"],["_aps","{}"],["appInfo.snowplow.trackSelfDescribingEvent","noopFunc"],["_vwo_code.init","noopFunc"],["ytInitialPlayerResponse.playerAds","undefined"],["ytInitialPlayerResponse.adPlacements","undefined"],["ytInitialPlayerResponse.adSlots","undefined"],["playerResponse.adPlacements","undefined"],["nsShowMaxCount","0"],["objVc.interstitial_web",""],["_ml_ads_ns","null"],["_sp_.config","undefined"],["isAdBlockActive","false"],["AdController","noopFunc"],["console.clear","noopFunc"],["console.log","noopFunc"],["Object.prototype.hideAds","true"],["Object.prototype._getSalesHouseConfigurations","noopFunc"],["vast_urls","{}"],["sadbl","false"],["adblockcheck","false"],["arrvast","[]"],["blurred","false"],["flashvars.adv_pre_src",""],["showPopunder","false"],["page_params.holiday_promo","true"],["adsEnabled","true"],["String.prototype.charAt","trueFunc"],["ad_blocker","false"],["blockAdBlock","true"],["VikiPlayer.prototype.pingAbFactor","noopFunc"],["player.options.disableAds","true"],["console.clear","trueFunc"],["flashvars.adv_pre_vast",""],["flashvars.adv_pre_vast_alt",""],["x_width","1"],["_site_ads_ns","true"],["luxuretv.config",""],["Object.prototype.AdOverlay","noopFunc"],["tkn_popunder","null"],["can_run_ads","true"],["adsBlockerDetector","noopFunc"],["globalThis","null"],["adblock","false"],["__ads","true"],["FlixPop.isPopGloballyEnabled","falseFunc"],["check_adblock","true"],["$.magnificPopup.open","noopFunc"],["adsenseadBlock","noopFunc"],["adblockSuspected","false"],["xRds","true"],["cRAds","false"],["String.prototype.charCodeAt","trueFunc"],["disasterpingu","false"],["App.views.adsView.adblock","false"],["flashvars.adv_pause_html",""],["$.fx.off","true"],["isAdb","false"],["adBlockEnabled","false"],["puShown","true"],["ads_b_test","true"],["showAds","true"],["attr","{}"],["scriptSrc",""],["cxStartDetectionProcess","noopFunc"],["isAdBlocked","false"],["adblock","noopFunc"],["path",""],["_ctrl_vt.blocked.ad_script","false"],["blockAdBlock","noopFunc"],["caca","noopFunc"],["Ok","true"],["safelink.adblock","false"],["openPopunder","noopFunc"],["ClickUnder","noopFunc"],["flashvars.adv_pre_url",""],["flashvars.protect_block",""],["flashvars.video_click_url",""],["adBlock","false"],["spoof","noopFunc"],["btoa","null"],["sp_ad","true"],["adsBlocked","false"],["_sp_.msg.displayMessage","noopFunc"],["CaptchmeState.adb","undefined"],["indexedDB.open","trueFunc"],["UhasAB","false"],["adNotificationDetected","false"],["atob","noopFunc"],["_pop","noopFunc"],["CnnXt.Event.fire","noopFunc"],["_ti_update_user","noopFunc"],["valid","1"],["vastAds","[]"],["adblock","1"],["frg","1"],["time","0"],["ads","true"],["GNCA_Ad_Support","true"],["Date.now","noopFunc"],["jQuery.adblock","1"],["VMG.Components.Adblock","false"],["_n_app.popunder","null"],["N_BetterJsPop.object","{}"],["adblockDetector","trueFunc"],["hasPoped","true"],["flashvars.video_click_url","undefined"],["flashvars.adv_start_html",""],["flashvars.popunder_url",""],["flashvars.adv_post_src",""],["flashvars.adv_post_url",""],["jQuery.adblock","false"],["google_jobrunner","true"],["sec","0"],["gadb","false"],["checkadBlock","noopFunc"],["clientSide.adbDetect","noopFunc"],["HTMLAnchorElement.prototype.click","noopFunc"],["cmnnrunads","true"],["adBlocker","false"],["adBlockDetected","noopFunc"],["StileApp.somecontrols.adBlockDetected","noopFunc"],["MDCore.adblock","0"],["google_tag_data","noopFunc"],["noAdBlock","true"],["adsOk","true"],["check","true"],["isal","true"],["document.hidden","true"],["awm","true"],["adblockEnabled","false"],["is_adblocked","false"],["pogo.intermission.staticAdIntermissionPeriod","0"],["SubmitDownload1","noopFunc"],["t","0"],["ckaduMobilePop","noopFunc"],["tieneAdblock","0"],["adsAreBlocked","false"],["cmgpbjs","false"],["displayAdblockOverlay","false"],["google","false"],["Math.pow","noopFunc"],["openInNewTab","noopFunc"],["runAdBlocker","false"],["Adblock","false"],["flashvars.logo_url",""],["flashvars.logo_text",""],["nlf.custom.userCapabilities","false"],["count","0"],["LoadThisScript","true"],["showPremLite","true"],["closeBlockerModal","false"],["adBlockDetector.isEnabled","falseFunc"],["areAdsDisplayed","true"],["gkAdsWerbung","true"],["document.bridCanRunAds","true"],["pop_target","null"],["is_banner","true"],["$easyadvtblock","false"],["show_dfp_preroll","false"],["show_youtube_preroll","false"],["doads","true"],["jsUnda","noopFunc"],["AlobaidiDetectAdBlock","true"],["Advertisement","1"],["adBlockDetected","false"],["abp1","1"],["pr_okvalida","true"],["$.ajax","trueFunc"],["cnbc.canShowAds","true"],["ue_adb_chk","1"],["firefaucet","true"],["cRAds","true"],["uas","[]"],["flashvars.popunder_url","undefined"],["adv","true"],["prerollMain","undefined"],["canRunAds","true"],["Fingerprint2","true"],["dclm_ajax_var.disclaimer_redirect_url",""],["load_pop_power","noopFunc"],["adBlockDetected","true"],["Time_Start","0"],["blockAdBlock","trueFunc"],["ezstandalone.enabled","true"],["foundation.adPlayer.bitmovin","{}"],["DL8_GLOBALS.enableAdSupport","false"],["DL8_GLOBALS.useHomad","false"],["DL8_GLOBALS.enableHomadDesktop","false"],["DL8_GLOBALS.enableHomadMobile","false"],["Object.prototype.adReinsertion","noopFunc"],["getHomadConfig","noopFunc"],["ab","false"],["go_popup","{}"],["noBlocker","true"],["adsbygoogle","null"],["fabActive","false"],["gWkbAdVert","true"],["noblock","true"],["wgAffiliateEnabled","false"],["ads","null"],["detectAdblock","noopFunc"],["adsLoadable","true"],["ASSetCookieAds","null"],["letShowAds","true"],["ulp_noadb","true"],["Object.prototype.adblock_detected","false"],["timeSec","0"],["adsbygoogle.loaded","true"],["ads_unblocked","true"],["xxSetting.adBlockerDetection","false"],["open","undefined"],["Drupal.behaviors.adBlockerPopup","null"],["fake_ad","true"],["koddostu_com_adblock_yok","null"],["adsbygoogle","trueFunc"],["player.ads.cuePoints","undefined"],["adBlockDetected","null"],["better_ads_adblock","1"],["Adv_ab","false"],["sgpbCanRunAds","true"],["document.hidden","false"],["document.hasFocus","trueFunc"],["hasFocus","trueFunc"],["navigator.brave","undefined"],["Object.prototype.isAllAdClose","true"],["isRequestPresent","true"],["fouty","true"],["Notification","undefined"],["protection","noopFunc"],["private","false"],["navigator.webkitTemporaryStorage.queryUsageAndQuota","noopFunc"],["document.onkeydown","noopFunc"],["showadas","true"],["alert","throwFunc"],["iktimer","0"],["aSl.gcd","0"],["window.adLink","null"],["detectedAdblock","undefined"],["isTabActive","true"],["clicked","2"],["ov.advertising.tisoomi.loadScript","noopFunc"],["abp","false"],["hommy","{}"],["hommy.waitUntil","noopFunc"],["flashvars.mlogo",""],["vpPrerollVideo","undefined"],["PlayerConfig.config.CustomAdSetting","[]"],["PlayerConfig.trusted","true"],["PlayerConfig.config.AffiliateAdViewLevel","3"],["hold_click","false"],["tie.ad_blocker_detector","false"],["admiral","noopFunc"],["gnt.u.adfree","true"],["__INITIAL_DATA__.siteData.admiralScript"],["objAd.loadAdShield","noopFunc"],["window.myAd.runAd","noopFunc"],["__INITIAL_STATE__.config.theme.ads.isAdBlockerEnabled","false"],["__INITIAL_STATE__.gameLists.gamesNoPrerollIds.indexOf","trueFunc"],["document.ontouchend","null"],["document.onclick","null"],["pubAdsService","trueFunc"],["config.pauseInspect","false"],["appContext.adManager.context.current.adFriendly","false"],["blockAdBlock._options.baitClass","null"],["document.blocked_var","1"],["____ads_js_blocked","false"],["wIsAdBlocked","false"],["WebSite.plsDisableAdBlock","null"],["ads_blocked","false"],["samDetected","false"],["countClicks","0"],["settings.adBlockerDetection","false"],["mixpanel.get_distinct_id","true"],["fuckAdBlock._options.baitClass","null"],["bscheck.adblocker","noopFunc"],["qpcheck.ads","noopFunc"],["isContentBlocked","falseFunc"],["CloudflareApps.installs.Ik7rmQ4t95Qk.options.measureDomain","undefined"],["detectAB1","noopFunc"],["uBlockOriginDetected","false"],["googletag._vars_","{}"],["googletag._loadStarted_","true"],["googletag._loaded_","true"],["google_unique_id","1"],["google.javascript","{}"],["google.javascript.ads","{}"],["google_global_correlator","1"],["paywallGateway.truncateContent","noopFunc"],["adBlockDisabled","true"],["blockedElement","noopFunc"],["popit","false"],["adBlockerDetected","false"],["abu","falseFunc"],["countdown","0"],["decodeURI","noopFunc"],["flashvars.adv_postpause_vast",""],["univresalP","noopFunc"],["xv_ad_block","0"],["openWindow","noopFunc"],["vidorev_jav_plugin_video_ads_object.vid_ads_m_video_ads",""],["adsProvider.init","noopFunc"],["SDKLoaded","true"],["blockAdBlock._creatBait","null"],["POPUNDER_ENABLED","false"],["plugins.preroll","noopFunc"],["errcode","0"],["DHAntiAdBlocker","true"],["showada","true"],["showax","true"],["p18","undefined"],["ADBLOCKED","false"],["Object.prototype.adsEnabled","false"],["adb","0"],["String.fromCharCode","trueFunc"],["adblock_use","false"],["Object.prototype.adblockFound","false"],["nitroAds.loaded","true"],["createCanvas","noopFunc"],["playerAdSettings.adLink",""],["playerAdSettings.waitTime","0"],["xv.sda.pp.init","noopFunc"],["isAdsLoaded","true"],["adblockerAlert","noopFunc"],["Object.prototype.parseXML","noopFunc"],["Object.prototype.blackscreenDuration","1"],["Object.prototype.adPlayerId",""],["adblockDetect","noopFunc"],["style","noopFunc"],["history.pushState","noopFunc"],["google_unique_id","6"],["__NEXT_DATA__.props.pageProps.adsConfig","undefined"],["new_config.timedown","0"],["truex","{}"],["truex.client","noopFunc"],["hiddenProxyDetected","false"],["SteadyWidgetSettings.adblockActive","false"],["proclayer","noopFunc"],["timeleft","0"],["load_ads","trueFunc"],["detectAdBlock","noopFunc"],["starPop","1"],["Object.prototype.ads","noopFunc"],["detectBlockAds","noopFunc"],["ga","trueFunc"],["ad_link",""],["penciBlocksArray","[]"],["App.AdblockDetected","false"],["SF.adblock","true"],["startfrom","0"],["D4zz","noopFunc"],["Object.prototype.ads.nopreroll_","true"],["HP_Scout.adBlocked","false"],["SD_IS_BLOCKING","false"],["Object.prototype.isPremium","true"],["__BACKPLANE_API__.renderOptions.showAdBlock",""],["Object.prototype.isNoAds","{}"],["tv3Cmp.ConsentGiven","true"],["countDownDate","0"],["setupSkin","noopFunc"],["Object.prototype.enableInterstitial","false"],["ads","undefined"],["td_ad_background_click_link","undefined"],["ADBLOCK","false"],["POSTPART_prototype.ADKEY","noopFunc"],["adBlockDetected","falseFunc"],["divWidth","1"],["noAdBlock","noopFunc"],["AdService.info.abd","noopFunc"],["adBlockDetectionResult","undefined"],["popped","true"],["puShown1","true"],["passthetest","true"],["pandaAdviewValidate","true"],["canGetAds","true"],["ad_blocker_active","false"],["init_welcome_ad","noopFunc"],["moneyAbovePrivacyByvCDN","true"],["document.body.contains","trueFunc"],["popunder","undefined"],["distance","0"],["document.onclick",""],["adEnable","true"],["displayAds","0"],["_adshrink.skiptime","0"],["AbleToRunAds","true"],["PreRollAd.timeCounter","0"],["abpblocked","undefined"],["app.showModalAd","noopFunc"],["paAddUnit","noopFunc"],["adt","0"],["test_adblock","noopFunc"],["adblockDetector","noopFunc"],["vastEnabled","false"],["detectadsbocker","false"],["two_worker_data_js.js","[]"],["FEATURE_DISABLE_ADOBE_POPUP_BY_COUNTRY","true"],["questpassGuard","noopFunc"],["isAdBlockerEnabled","false"],["sssp","emptyObj"],["smartLoaded","true"],["timeLeft","0"],["Cookiebot","noopFunc"],["feature_flags.interstitial_ads_flag","false"],["feature_flags.interstitials_every_four_slides","false"],["waldoSlotIds","true"],["adblockstatus","false"],["adScriptLoaded","true"],["adblockEnabled","noopFunc"],["adSettings","[]"],["banner_is_blocked","false"],["Object.prototype.adBlocked","false"],["isadb","false"],["chp_adblock_browser","noopFunc"],["googleAd","true"],["Brid.A9.prototype.backfillAdUnits","[]"],["dct","0"],["slideShow.displayInterstitial","true"],["googletag","true"],["tOS2","150"],["checkAdBlocker","noopFunc"],["navigator.standalone","true"],["ShowAdvertising","{}"],["empire.pop","undefined"],["empire.direct","undefined"],["empire.directHideAds","undefined"],["empire.mediaData.advisorMovie","1"],["empire.mediaData.advisorSerie","1"],["setTimer","0"],["penci_adlbock.ad_blocker_detector","0"],["Object.prototype.adblockDetector","noopFunc"],["blext","true"],["vidorev_jav_plugin_video_ads_object","{}"],["vidorev_jav_plugin_video_ads_object_post","{}"],["S_Popup","10"],["rabLimit","-1"],["nudgeAdBlock","noopFunc"],["feedBack.showAffilaePromo","noopFunc"],["FAVE.settings.ads.ssai.prod.clips.enabled","false"],["FAVE.settings.ads.ssai.prod.liveAuth.enabled","false"],["FAVE.settings.ads.ssai.prod.liveUnauth.enabled","false"],["HTMLScriptElement.prototype.onerror","null"],["loadpagecheck","noopFunc"],["art3m1sItemNames.affiliate-wrapper","\"\""],["window.adngin","{}"],["amzn_aps_csm","{}"],["amzn_aps_csm.define","noopFunc"],["amzn_aps_csm.reportErrors","noopFunc"],["isAdBlockerActive","noopFunc"],["di.app.WebplayerApp.Ads.Adblocks.app.AdBlockDetectApp.startWithParent","false"],["sharedController.adblockDetector","noopFunc"],["checkAdsStatus","noopFunc"],["ads","[]"],["settings.adBlockDetectionEnabled","false"],["displayInterstitialAdConfig","false"],["checkAdBlockeraz","noopFunc"],["blockingAds","false"],["Yii2App.playbackTimeout","0"],["QiyiPlayerProphetData.a.data","{}"],["toggleAdBlockInfo","falseFunc"],["aipAPItag.prerollSkipped","true"],["aipAPItag.setPreRollStatus","trueFunc"],["reklam_1_saniye","0"],["reklam_1_gecsaniye","0"],["reklamsayisi","1"],["reklam_1",""],["powerAPITag","emptyObj"],["playerEnhancedConfig.run","throwFunc"],["aoAdBlockDetected","false"],["rodo.checkIsDidomiConsent","noopFunc"],["rodo.waitForConsent","noopPromiseResolve"],["xtime","0"],["Div_popup",""],["Scribd.Blob.AdBlockerModal","noopFunc"],["AddAdsV2I.addBlock","false"],["hasAdBlocker","false"],["initials.yld-pdpopunder",""],["download_click","true"],["advertisement3","true"],["clicked","true"],["eClicked","true"],["number","0"],["sync","true"],["PlayerLogic.prototype.detectADB","noopFunc"],["showPopunder","noopFunc"],["Object.prototype.prerollAds","[]"],["notifyMe","noopFunc"],["adsClasses","undefined"],["gsecs","0"],["dvsize","52"],["majorse","true"],["completed","1"],["testerli","false"],["w87.abd","noopFunc"],["document.referrer",""],["Object.prototype.setNeedShowAdblockWarning","noopFunc"],["NoAdBlock","noopFunc"],["adList","[]"],["ifmax","true"],["nitroAds.abp","true"],["onloadUI","noopFunc"],["PageLoader.DetectAb","0"],["one_time","1"],["consentGiven","true"],["playID","1"],["GEMG.GPT.Interstitial","noopFunc"],["amiblock","0"],["karte3","18"],["sandDetect","noopFunc"],["amodule.data","emptyArr"],["Object.prototype.ADBLOCK_DETECTION",""],["postroll","undefined"],["interstitial","undefined"],["isAdBlockDetected","false"],["pData.adblockOverlayEnabled","0"],["cabdSettings","undefined"],["td_ad_background_click_link"],["malisx","true"],["alim","true"],["ADS.isBannersEnabled","false"],["EASYFUN_ADS_CAN_RUN","true"],["adsbygoogle_ama_fc_has_run","true"],["jwDefaults.advertising","{}"],["elimina_profilazione","1"],["elimina_pubblicita","1"],["abd","{}"],["checkerimg","noopFunc"],["detectedAdblock","noopFunc"],["Object.prototype.DetectByGoogleAd","noopFunc"],["nitroAds","{}"],["nitroAds.createAd","noopFunc"],["NativeAd","noopFunc"],["Blob","noopFunc"],["window.navigator.brave","undefined"],["HTMLScriptElement.prototype.onerror","undefined"],["isAdblock","false"],["openPop","noopFunc"],["attachEvent","trueFunc"],["cns.library","true"],["BJSShowUnder","{}"],["BJSShowUnder.bindTo","noopFunc"],["BJSShowUnder.add","noopFunc"],["Object.prototype._parseVAST","noopFunc"],["Object.prototype.createAdBlocker","noopFunc"],["Object.prototype.isAdPeriod","falseFunc"],["ABLK","false"],["countDown","0"],["runCheck","noopFunc"],["adsSlotRenderEndSeen","true"],["showModal","noopFunc"],["flashvars.mlogo_link",""],["isAdBlocked","noopFunc"],["URLlist","[]"],["aaw","{}"],["aaw.processAdsOnPage","noopFunc"],["doOpen","undefined"],["HTMLImageElement.prototype.onerror","undefined"],["FOXIZ_MAIN_SCRIPT.siteAccessDetector","noopFunc"],["openAdBlockPopup","noopFunc"],["Object.prototype._adsDisabled","true"],["advanced_ads_check_adblocker","noopFunc"],["canRunAds","1"],["attestHasAdBlockerActivated","true"],["extInstalled","true"],["SaveFiles.add","noopFunc"],["detectSandbox","noopFunc"],["adbon","0"],["LCI.adBlockDetectorEnabled","false"],["rwt","noopFunc"],["bmak.js_post","false"],["firebase.analytics","noopFunc"],["Object.prototype.updateModifiedCommerceUrl","noopFunc"],["flashvars.event_reporting",""],["Object.prototype.has_opted_out_tracking","trueFunc"],["Visitor","{}"],["send_gravity_event","noopFunc"],["send_recommendation_event","noopFunc"],["libAnalytics.data.get","noopFunc"],["adthrive._components.start","noopFunc"],["navigator.sendBeacon","noopFunc"]];
const hostnamesMap = new Map([["jilliandescribecompany.com",0],["gogoanime.*",[0,196]],["adrianmissionminute.com",0],["alejandrocenturyoil.com",0],["alleneconomicmatter.com",0],["apinchcaseation.com",0],["bethshouldercan.com",0],["bigclatterhomesguideservice.com",0],["bradleyviewdoctor.com",0],["brittneystandardwestern.com",0],["brookethoughi.com",0],["brucevotewithin.com",0],["cindyeyefinal.com",0],["denisegrowthwide.com",0],["diananatureforeign.com",0],["donaldlineelse.com",0],["edwardarriveoften.com",0],["erikcoldperson.com",0],["evelynthankregion.com",0],["graceaddresscommunity.com",0],["heatherdiscussionwhen.com",0],["heatherwholeinvolve.com",0],["housecardsummerbutton.com",0],["jamessoundcost.com",0],["jamesstartstudent.com",0],["jamiesamewalk.com",0],["jasminetesttry.com",0],["jasonresponsemeasure.com",0],["jayservicestuff.com",0],["jennifercertaindevelopment.com",0],["jessicaglassauthor.com",0],["johnalwayssame.com",0],["johntryopen.com",0],["jonathansociallike.com",0],["josephseveralconcern.com",0],["kellywhatcould.com",0],["kennethofficialitem.com",0],["kristiesoundsimply.com",0],["lisatrialidea.com",0],["lorimuchbenefit.com",0],["loriwithinfamily.com",0],["lukecomparetwo.com",0],["mariatheserepublican.com",0],["markstyleall.com",0],["michaelapplysome.com",0],["morganoperationface.com",0],["nathanfromsubject.com",0],["nectareousoverelate.com",0],["paulkitchendark.com",0],["rebeccaneverbase.com",0],["richardsignfish.com",0],["roberteachfinal.com",0],["robertordercharacter.com",0],["robertplacespace.com",0],["ryanagoinvolve.com",0],["sandratableother.com",0],["sandrataxeight.com",0],["seanshowcould.com",0],["sethniceletter.com",0],["shannonpersonalcost.com",0],["sharonwhiledemocratic.com",0],["stevenimaginelittle.com",0],["strawberriesporail.com",0],["susanhavekeep.com",0],["timberwoodanotia.com",0],["tinycat-voe-fashion.com",0],["toddpartneranimal.com",0],["troyyourlead.com",0],["uptodatefinishconference.com",0],["uptodatefinishconferenceroom.com",0],["vincentincludesuccessful.com",0],["voe.sx",0],["maxfinishseveral.com",0],["voe.sx>>",0],["javboys.tv>>",0],["freeplayervideo.com",0],["nazarickol.com",0],["player-cdn.com",0],["playhydrax.com",[0,409,410]],["rabbitstream.net",0],["fmovies.*",0],["u26bekrb.fun",1],["client.falixnodes.net",[2,3,594,595,596,597]],["br.de",4],["indeed.com",5],["pasteboard.co",6],["clickhole.com",7],["deadspin.com",7],["gizmodo.com",7],["jalopnik.com",7],["jezebel.com",7],["kotaku.com",7],["lifehacker.com",7],["splinternews.com",7],["theinventory.com",7],["theonion.com",7],["theroot.com",7],["thetakeout.com",7],["pewresearch.org",7],["los40.com",[8,9]],["as.com",9],["telegraph.co.uk",[10,11]],["poweredbycovermore.com",[10,62]],["lumens.com",[10,62]],["verizon.com",12],["humanbenchmark.com",13],["politico.com",14],["officedepot.co.cr",[15,16]],["officedepot.*",[17,18]],["usnews.com",19],["coolmathgames.com",[20,288,289,290]],["video.gazzetta.it",[21,22]],["oggi.it",[21,22]],["manoramamax.com",21],["factable.com",23],["zee5.com",24],["gala.fr",25],["geo.fr",25],["voici.fr",25],["gloucestershirelive.co.uk",26],["arsiv.mackolik.com",27],["jacksonguitars.com",28],["scandichotels.com",29],["stylist.co.uk",30],["nettiauto.com",31],["thaiairways.com",[32,33]],["cerbahealthcare.it",[34,35]],["futura-sciences.com",[34,52]],["toureiffel.paris",34],["campusfrance.org",[34,146]],["tiendaenlinea.claro.com.ni",[36,37]],["tieba.baidu.com",38],["fandom.com",[39,40,349]],["grasshopper.com",[41,42]],["epson.com.cn",[43,44,45,46]],["oe24.at",[47,48]],["szbz.de",47],["platform.autods.com",[49,50]],["kcra.com",51],["wcvb.com",51],["sportdeutschland.tv",51],["citibank.com.sg",53],["uol.com.br",[54,55,56,57,58]],["gazzetta.gr",59],["digicol.dpm.org.cn",[60,61]],["virginmediatelevision.ie",63],["larazon.es",[64,65]],["waitrosecellar.com",[66,67,68]],["kicker.de",[69,391]],["sharpen-free-design-generator.netlify.app",[70,71]],["help.cashctrl.com",[72,73]],["gry-online.pl",74],["vidaextra.com",75],["commande.rhinov.pro",[76,77]],["ecom.wixapps.net",[76,77]],["tipranks.com",[78,79]],["iceland.co.uk",[80,81,82]],["socket.pearsoned.com",83],["tntdrama.com",[84,85]],["trutv.com",[84,85]],["mobile.de",[86,87]],["ioe.vn",[88,89]],["geiriadur.ac.uk",[88,92]],["welsh-dictionary.ac.uk",[88,92]],["bikeportland.org",[90,91]],["biologianet.com",[55,56,57]],["10play.com.au",[93,94]],["sunshine-live.de",[95,96]],["whatismyip.com",[97,98]],["myfitnesspal.com",99],["netoff.co.jp",[100,101]],["bluerabbitrx.com",[100,101]],["foundit.*",[102,103]],["clickjogos.com.br",104],["bristan.com",[105,106]],["zillow.com",107],["share.hntv.tv",[108,109,110,111]],["forum.dji.com",[108,111]],["unionpayintl.com",[108,110]],["streamelements.com",108],["optimum.net",[112,113]],["hdfcfund.com",114],["user.guancha.cn",[115,116]],["sosovalue.com",117],["bandyforbundet.no",[118,119]],["tatacommunications.com",120],["kb.arlo.com",[120,153]],["suamusica.com.br",[121,122,123]],["macrotrends.net",[124,125]],["code.world",126],["smartcharts.net",126],["topgear.com",127],["eservice.directauto.com",[128,129]],["nbcsports.com",130],["standard.co.uk",131],["pruefernavi.de",[132,133]],["speedtest.net",[134,135]],["17track.net",136],["visible.com",137],["hagerty.com",[138,139]],["marketplace.nvidia.com",140],["kino.de",[141,142]],["9now.nine.com.au",143],["worldstar.com",144],["prisjakt.no",145],["developer.arm.com",[147,148]],["sterkinekor.com",149],["iogames.space",150],["thedailybeast.com",151],["id.condenast.com",152],["m.youtube.com",[154,155,156,157]],["music.youtube.com",[154,155,156,157]],["tv.youtube.com",[154,155,156,157]],["www.youtube.com",[154,155,156,157]],["youtubekids.com",[154,155,156,157]],["youtube-nocookie.com",[154,155,156,157]],["eu-proxy.startpage.com",[154,155,157]],["timesofindia.indiatimes.com",158],["economictimes.indiatimes.com",159],["motherless.com",160],["sueddeutsche.de",161],["watchanimesub.net",162],["wcoanimesub.tv",162],["wcoforever.net",162],["freeviewmovies.com",162],["filehorse.com",162],["guidetnt.com",162],["starmusiq.*",162],["sp-today.com",162],["linkvertise.com",162],["eropaste.net",162],["getpaste.link",162],["sharetext.me",162],["wcofun.*",162],["note.sieuthuthuat.com",162],["elcriticodelatele.com",[162,457]],["gadgets.es",[162,457]],["amateurporn.co",[162,258]],["wiwo.de",163],["primewire.*",164],["streanplay.*",[164,165]],["alphaporno.com",[164,543]],["porngem.com",164],["shortit.pw",[164,242]],["familyporn.tv",164],["sbplay.*",164],["id45.cyou",164],["85tube.com",[164,226]],["milfnut.*",164],["k1nk.co",164],["watchasians.cc",164],["soltoshindo.com",164],["sankakucomplex.com",166],["player.glomex.com",167],["merkur.de",167],["tz.de",167],["sxyprn.*",168],["hqq.*",[169,170]],["waaw.*",[170,171]],["hotpornfile.org",170],["player.tabooporns.com",170],["x69.ovh",170],["wiztube.xyz",170],["younetu.*",170],["multiup.us",170],["peliculas8k.com",[170,171]],["video.q34r.org",170],["czxxx.org",170],["vtplayer.online",170],["vvtplayer.*",170],["netu.ac",170],["netu.frembed.lol",170],["adbull.org",172],["123link.*",172],["adshort.*",172],["mitly.us",172],["linkrex.net",172],["linx.cc",172],["oke.io",172],["linkshorts.*",172],["dz4link.com",172],["adsrt.*",172],["linclik.com",172],["shrt10.com",172],["vinaurl.*",172],["loptelink.com",172],["adfloz.*",172],["cut-fly.com",172],["linkfinal.com",172],["payskip.org",172],["cutpaid.com",172],["linkjust.com",172],["leechpremium.link",172],["icutlink.com",[172,263]],["oncehelp.com",172],["rgl.vn",172],["reqlinks.net",172],["bitlk.com",172],["qlinks.eu",172],["link.3dmili.com",172],["short-fly.com",172],["foxseotools.com",172],["dutchycorp.*",172],["shortearn.*",172],["pingit.*",172],["link.turkdown.com",172],["7r6.com",172],["oko.sh",172],["ckk.ai",172],["fc.lc",172],["fstore.biz",172],["shrink.*",172],["cuts-url.com",172],["eio.io",172],["exe.app",172],["exee.io",172],["exey.io",172],["skincarie.com",172],["exeo.app",172],["tmearn.*",172],["coinlyhub.com",[172,328]],["adsafelink.com",172],["aii.sh",172],["megalink.*",172],["cybertechng.com",[172,343]],["cutdl.xyz",172],["iir.ai",172],["shorteet.com",[172,361]],["miniurl.*",172],["smoner.com",172],["gplinks.*",172],["odisha-remix.com",[172,343]],["xpshort.com",[172,343]],["upshrink.com",172],["clk.*",172],["easysky.in",172],["veganab.co",172],["go.bloggingaro.com",172],["go.gyanitheme.com",172],["go.theforyou.in",172],["go.hipsonyc.com",172],["birdurls.com",172],["vipurl.in",172],["try2link.com",172],["jameeltips.us",172],["gainl.ink",172],["promo-visits.site",172],["satoshi-win.xyz",[172,377]],["shorterall.com",172],["encurtandourl.com",172],["forextrader.site",172],["postazap.com",172],["cety.app",172],["exego.app",[172,372]],["cutlink.net",172],["cutsy.net",172],["cutyurls.com",172],["cutty.app",172],["cutnet.net",172],["jixo.online",172],["tinys.click",[172,343]],["cpm.icu",172],["panyshort.link",172],["enagato.com",172],["pandaznetwork.com",172],["tpi.li",172],["oii.la",172],["recipestutorials.com",172],["pureshort.*",172],["shrinke.*",172],["shrinkme.*",172],["shrinkforearn.in",172],["oii.io",172],["du-link.in",172],["atglinks.com",172],["thotpacks.xyz",172],["megaurl.in",172],["megafly.in",172],["simana.online",172],["fooak.com",172],["joktop.com",172],["evernia.site",172],["falpus.com",172],["link.paid4link.com",172],["exalink.fun",172],["shortxlinks.com",172],["upfion.com",172],["upfiles.app",172],["upfiles-urls.com",172],["flycutlink.com",[172,343]],["linksly.co",172],["link1s.*",172],["pkr.pw",172],["imagenesderopaparaperros.com",172],["shortenbuddy.com",172],["apksvip.com",172],["4cash.me",172],["namaidani.com",172],["shortzzy.*",172],["teknomuda.com",172],["shorttey.*",[172,327]],["miuiku.com",172],["savelink.site",172],["lite-link.*",172],["adcorto.*",172],["samaa-pro.com",172],["miklpro.com",172],["modapk.link",172],["ccurl.net",172],["linkpoi.me",172],["menjelajahi.com",172],["pewgame.com",172],["haonguyen.top",172],["zshort.*",172],["crazyblog.in",172],["cutearn.net",172],["rshrt.com",172],["filezipa.com",172],["dz-linkk.com",172],["upfiles.*",172],["theblissempire.com",172],["finanzas-vida.com",172],["adurly.cc",172],["paid4.link",172],["link.asiaon.top",172],["go.gets4link.com",172],["linkfly.*",172],["beingtek.com",172],["shorturl.unityassets4free.com",172],["disheye.com",172],["techymedies.com",172],["techysuccess.com",172],["za.gl",[172,278]],["bblink.com",172],["myad.biz",172],["swzz.xyz",172],["vevioz.com",172],["charexempire.com",172],["clk.asia",172],["linka.click",172],["sturls.com",172],["myshrinker.com",172],["snowurl.com",[172,343]],["netfile.cc",172],["wplink.*",172],["rocklink.in",172],["techgeek.digital",172],["download3s.net",172],["shortx.net",172],["shortawy.com",172],["tlin.me",172],["apprepack.com",172],["up-load.one",172],["zuba.link",172],["bestcash2020.com",172],["ier.ai",172],["adslink.pw",172],["novelssites.com",172],["links.medipost.org",172],["faucetcrypto.net",172],["short.freeltc.top",172],["trxking.xyz",172],["weadown.com",172],["m.bloggingguidance.com",172],["blog.onroid.com",172],["link.codevn.net",172],["upfilesurls.com",172],["link4rev.site",172],["c2g.at",172],["bitcosite.com",[172,557]],["cryptosh.pro",172],["link68.net",172],["traffic123.net",172],["windowslite.net",[172,343]],["viewfr.com",172],["cl1ca.com",172],["4br.me",172],["fir3.net",172],["seulink.*",172],["encurtalink.*",172],["kiddyshort.com",172],["watchmygf.me",[173,197]],["camwhores.*",[173,183,225,226,227]],["camwhorez.tv",[173,183,225,226]],["cambay.tv",[173,205,225,255,257,258,259,260]],["fpo.xxx",[173,205]],["sexemix.com",173],["heavyfetish.com",[173,722]],["thotcity.su",173],["viralxxxporn.com",[173,395]],["tube8.*",[174,175]],["you-porn.com",175],["youporn.*",175],["youporngay.com",175],["youpornru.com",175],["redtube.*",175],["9908ww.com",175],["adelaidepawnbroker.com",175],["bztube.com",175],["hotovs.com",175],["insuredhome.org",175],["nudegista.com",175],["pornluck.com",175],["vidd.se",175],["pornhub.*",[175,316]],["pornhub.com",175],["pornerbros.com",176],["freep.com",176],["porn.com",177],["tune.pk",178],["noticias.gospelmais.com.br",179],["techperiod.com",179],["viki.com",[180,181]],["watch-series.*",182],["watchseries.*",182],["vev.*",182],["vidop.*",182],["vidup.*",182],["sleazyneasy.com",[183,184,185]],["smutr.com",[183,324]],["tktube.com",183],["yourporngod.com",[183,184]],["javbangers.com",[183,446]],["camfox.com",183],["camthots.tv",[183,255]],["shegotass.info",183],["amateur8.com",183],["bigtitslust.com",183],["ebony8.com",183],["freeporn8.com",183],["lesbian8.com",183],["maturetubehere.com",183],["sortporn.com",183],["motherporno.com",[183,184,205,257]],["theporngod.com",[183,184]],["watchdirty.to",[183,226,227,258]],["pornsocket.com",186],["luxuretv.com",187],["porndig.com",[188,189]],["webcheats.com.br",190],["ceesty.com",[191,192]],["gestyy.com",[191,192]],["corneey.com",192],["destyy.com",192],["festyy.com",192],["sh.st",192],["mitaku.net",192],["angrybirdsnest.com",193],["zrozz.com",193],["clix4btc.com",193],["4tests.com",193],["goltelevision.com",193],["news-und-nachrichten.de",193],["laradiobbs.net",193],["urlaubspartner.net",193],["produktion.de",193],["cinemaxxl.de",193],["bladesalvador.com",193],["tempr.email",193],["cshort.org",193],["friendproject.net",193],["covrhub.com",193],["katfile.com",[193,627]],["trust.zone",193],["business-standard.com",193],["planetsuzy.org",194],["empflix.com",195],["1movies.*",[196,202]],["xmovies8.*",196],["masteranime.tv",196],["0123movies.*",196],["gostream.*",196],["gomovies.*",196],["transparentcalifornia.com",197],["deepbrid.com",198],["webnovel.com",199],["streamwish.*",[200,201]],["oneupload.to",201],["wishfast.top",201],["rubystm.com",201],["rubyvid.com",201],["rubyvidhub.com",201],["stmruby.com",201],["streamruby.com",201],["schwaebische.de",203],["8tracks.com",204],["3movs.com",205],["bravoerotica.net",[205,257]],["youx.xxx",205],["camclips.tv",[205,324]],["xtits.*",[205,257]],["camflow.tv",[205,257,258,296,395]],["camhoes.tv",[205,255,257,258,296,395]],["xmegadrive.com",205],["xxxymovies.com",205],["xxxshake.com",205],["gayck.com",205],["xhand.com",[205,257]],["analdin.com",[205,257]],["revealname.com",206],["pouvideo.*",207],["povvideo.*",207],["povw1deo.*",207],["povwideo.*",207],["powv1deo.*",207],["powvibeo.*",207],["powvideo.*",207],["powvldeo.*",207],["golfchannel.com",208],["stream.nbcsports.com",208],["mathdf.com",208],["gamcore.com",209],["porcore.com",209],["porngames.tv",209],["69games.xxx",209],["javmix.app",209],["tecknity.com",210],["haaretz.co.il",211],["haaretz.com",211],["hungama.com",211],["a-o.ninja",211],["anime-odcinki.pl",211],["shortgoo.blogspot.com",211],["tonanmedia.my.id",[211,578]],["yurasu.xyz",211],["isekaipalace.com",211],["plyjam.*",[212,213]],["ennovelas.com",[213,217]],["foxsports.com.au",214],["canberratimes.com.au",214],["thesimsresource.com",215],["fxporn69.*",216],["vipbox.*",217],["viprow.*",217],["ctrl.blog",218],["sportlife.es",219],["finofilipino.org",220],["desbloqueador.*",221],["xberuang.*",222],["teknorizen.*",222],["mysflink.blogspot.com",222],["ashemaletube.*",223],["paktech2.com",223],["assia.tv",224],["assia4.com",224],["assia24.com",224],["cwtvembeds.com",[226,256]],["camlovers.tv",226],["porntn.com",226],["pornissimo.org",226],["sexcams-24.com",[226,258]],["watchporn.to",[226,258]],["camwhorez.video",226],["footstockings.com",[226,227,258]],["xmateur.com",[226,227,258]],["multi.xxx",227],["worldofbitco.in",[228,229]],["weatherx.co.in",[228,229]],["sunbtc.space",228],["subtorrents.*",230],["subtorrents1.*",230],["newpelis.*",230],["pelix.*",230],["allcalidad.*",230],["infomaniakos.*",230],["ojogos.com.br",231],["powforums.com",232],["supforums.com",232],["studybullet.com",232],["usgamer.net",233],["recordonline.com",233],["freebitcoin.win",234],["e-monsite.com",234],["coindice.win",234],["temp-mails.com",235],["freiepresse.de",236],["investing.com",237],["tornadomovies.*",238],["mp3fiber.com",239],["chicoer.com",240],["dailybreeze.com",240],["dailybulletin.com",240],["dailynews.com",240],["delcotimes.com",240],["eastbaytimes.com",240],["macombdaily.com",240],["ocregister.com",240],["pasadenastarnews.com",240],["pe.com",240],["presstelegram.com",240],["redlandsdailyfacts.com",240],["reviewjournal.com",240],["santacruzsentinel.com",240],["saratogian.com",240],["sentinelandenterprise.com",240],["sgvtribune.com",240],["tampabay.com",240],["times-standard.com",240],["theoaklandpress.com",240],["trentonian.com",240],["twincities.com",240],["whittierdailynews.com",240],["bostonherald.com",240],["dailycamera.com",240],["sbsun.com",240],["dailydemocrat.com",240],["montereyherald.com",240],["orovillemr.com",240],["record-bee.com",240],["redbluffdailynews.com",240],["reporterherald.com",240],["thereporter.com",240],["timescall.com",240],["timesheraldonline.com",240],["ukiahdailyjournal.com",240],["dailylocal.com",240],["mercurynews.com",240],["suedkurier.de",241],["anysex.com",243],["icdrama.*",244],["mangasail.*",244],["pornve.com",245],["file4go.*",246],["coolrom.com.au",246],["marie-claire.es",247],["gamezhero.com",247],["flashgirlgames.com",247],["onlinesudoku.games",247],["mpg.football",247],["sssam.com",247],["globalnews.ca",248],["drinksmixer.com",249],["leitesculinaria.com",249],["fupa.net",250],["browardpalmbeach.com",251],["dallasobserver.com",251],["houstonpress.com",251],["miaminewtimes.com",251],["phoenixnewtimes.com",251],["westword.com",251],["nhentai.net",[252,253]],["nowtv.com.tr",254],["caminspector.net",255],["camwhoreshd.com",255],["camgoddess.tv",255],["gay4porn.com",257],["mypornhere.com",257],["mangovideo.*",258],["love4porn.com",258],["thotvids.com",258],["watchmdh.to",258],["celebwhore.com",258],["cluset.com",258],["sexlist.tv",258],["4kporn.xxx",258],["xhomealone.com",258],["lusttaboo.com",[258,520]],["hentai-moon.com",258],["camhub.cc",[258,686]],["mediapason.it",261],["linkspaid.com",261],["tuotromedico.com",261],["neoteo.com",261],["phoneswiki.com",261],["celebmix.com",261],["myneobuxportal.com",261],["oyungibi.com",261],["25yearslatersite.com",261],["jeshoots.com",262],["techhx.com",262],["karanapk.com",262],["flashplayer.fullstacks.net",264],["cloudapps.herokuapp.com",264],["youfiles.herokuapp.com",264],["texteditor.nsspot.net",264],["temp-mail.org",265],["asianclub.*",266],["javhdporn.net",266],["vidmoly.to",267],["comnuan.com",268],["veedi.com",269],["battleboats.io",269],["anitube.*",270],["fruitlab.com",270],["acetack.com",270],["androidquest.com",270],["apklox.com",270],["chhaprawap.in",270],["gujarativyakaran.com",270],["kashmirstudentsinformation.in",270],["kisantime.com",270],["shetkaritoday.in",270],["pastescript.com",270],["trimorspacks.com",270],["updrop.link",270],["haddoz.net",270],["streamingcommunity.*",270],["garoetpos.com",270],["stiletv.it",271],["mixdrop.*",272],["hqtv.biz",273],["liveuamap.com",274],["muvibg.com",274],["audycje.tokfm.pl",275],["shush.se",276],["allkpop.com",277],["empire-anime.*",[278,573,574,575,576,577]],["empire-streaming.*",[278,573,574,575]],["empire-anime.com",[278,573,574,575]],["empire-streamz.fr",[278,573,574,575]],["empire-stream.*",[278,573,574,575]],["pickcrackpasswords.blogspot.com",279],["kfrfansub.com",280],["thuglink.com",280],["voipreview.org",280],["illicoporno.com",281],["lavoixdux.com",281],["tonpornodujour.com",281],["jacquieetmichel.net",281],["swame.com",281],["vosfemmes.com",281],["voyeurfrance.net",281],["jacquieetmicheltv.net",[281,634,635]],["pogo.com",282],["cloudvideo.tv",283],["legionjuegos.org",284],["legionpeliculas.org",284],["legionprogramas.org",284],["16honeys.com",285],["elespanol.com",286],["remodelista.com",287],["audiofanzine.com",291],["uploadev.*",292],["developerinsider.co",293],["thehindu.com",294],["cambro.tv",[295,296]],["boobsradar.com",[296,395,700]],["nibelungen-kurier.de",297],["adfoc.us",298],["tea-coffee.net",298],["spatsify.com",298],["newedutopics.com",298],["getviralreach.in",298],["edukaroo.com",298],["funkeypagali.com",298],["careersides.com",298],["nayisahara.com",298],["wikifilmia.com",298],["infinityskull.com",298],["viewmyknowledge.com",298],["iisfvirtual.in",298],["starxinvestor.com",298],["jkssbalerts.com",298],["sahlmarketing.net",298],["filmypoints.in",298],["fitnessholic.net",298],["moderngyan.com",298],["sattakingcharts.in",298],["freshbhojpuri.com",298],["bankshiksha.in",298],["earn.mpscstudyhub.com",298],["earn.quotesopia.com",298],["money.quotesopia.com",298],["best-mobilegames.com",298],["learn.moderngyan.com",298],["bharatsarkarijobalert.com",298],["quotesopia.com",298],["creditsgoal.com",298],["bgmi32bitapk.in",298],["techacode.com",298],["trickms.com",298],["ielts-isa.edu.vn",298],["loan.punjabworks.com",298],["rokni.xyz",298],["keedabankingnews.com",298],["sptfy.be",298],["mcafee-com.com",[298,372]],["pianetamountainbike.it",299],["barchart.com",300],["modelisme.com",301],["parasportontario.ca",301],["prescottenews.com",301],["nrj-play.fr",302],["hackingwithreact.com",303],["gutekueche.at",304],["eplfootballmatch.com",305],["ancient-origins.*",305],["peekvids.com",306],["playvids.com",306],["pornflip.com",306],["redensarten-index.de",307],["vw-page.com",308],["viz.com",[309,310]],["0rechner.de",311],["configspc.com",312],["xopenload.me",312],["uptobox.com",312],["uptostream.com",312],["japgay.com",313],["mega-debrid.eu",314],["dreamdth.com",315],["diaridegirona.cat",317],["diariodeibiza.es",317],["diariodemallorca.es",317],["diarioinformacion.com",317],["eldia.es",317],["emporda.info",317],["farodevigo.es",317],["laopinioncoruna.es",317],["laopiniondemalaga.es",317],["laopiniondemurcia.es",317],["laopiniondezamora.es",317],["laprovincia.es",317],["levante-emv.com",317],["mallorcazeitung.es",317],["regio7.cat",317],["superdeporte.es",317],["playpaste.com",318],["cnbc.com",319],["primevideo.com",320],["read.amazon.*",[320,711]],["firefaucet.win",321],["74k.io",[322,323]],["fullhdxxx.com",325],["pornclassic.tube",326],["tubepornclassic.com",326],["etonline.com",327],["creatur.io",327],["lookcam.*",327],["drphil.com",327],["urbanmilwaukee.com",327],["lootlinks.*",327],["ontiva.com",327],["hideandseek.world",327],["myabandonware.com",327],["kendam.com",327],["wttw.com",327],["synonyms.com",327],["definitions.net",327],["hostmath.com",327],["camvideoshub.com",327],["minhaconexao.com.br",327],["home-made-videos.com",329],["amateur-couples.com",329],["slutdump.com",329],["dpstream.*",330],["produsat.com",331],["bluemediafiles.*",332],["12thman.com",333],["acusports.com",333],["atlantic10.com",333],["auburntigers.com",333],["baylorbears.com",333],["bceagles.com",333],["bgsufalcons.com",333],["big12sports.com",333],["bigten.org",333],["bradleybraves.com",333],["butlersports.com",333],["cmumavericks.com",333],["conferenceusa.com",333],["cyclones.com",333],["dartmouthsports.com",333],["daytonflyers.com",333],["dbupatriots.com",333],["dbusports.com",333],["denverpioneers.com",333],["fduknights.com",333],["fgcuathletics.com",333],["fightinghawks.com",333],["fightingillini.com",333],["floridagators.com",333],["friars.com",333],["friscofighters.com",333],["gamecocksonline.com",333],["goarmywestpoint.com",333],["gobison.com",333],["goblueraiders.com",333],["gobobcats.com",333],["gocards.com",333],["gocreighton.com",333],["godeacs.com",333],["goexplorers.com",333],["goetbutigers.com",333],["gofrogs.com",333],["gogriffs.com",333],["gogriz.com",333],["golobos.com",333],["gomarquette.com",333],["gopack.com",333],["gophersports.com",333],["goprincetontigers.com",333],["gopsusports.com",333],["goracers.com",333],["goshockers.com",333],["goterriers.com",333],["gotigersgo.com",333],["gousfbulls.com",333],["govandals.com",333],["gowyo.com",333],["goxavier.com",333],["gozags.com",333],["gozips.com",333],["griffinathletics.com",333],["guhoyas.com",333],["gwusports.com",333],["hailstate.com",333],["hamptonpirates.com",333],["hawaiiathletics.com",333],["hokiesports.com",333],["huskers.com",333],["icgaels.com",333],["iuhoosiers.com",333],["jsugamecocksports.com",333],["longbeachstate.com",333],["loyolaramblers.com",333],["lrtrojans.com",333],["lsusports.net",333],["morrisvillemustangs.com",333],["msuspartans.com",333],["muleriderathletics.com",333],["mutigers.com",333],["navysports.com",333],["nevadawolfpack.com",333],["niuhuskies.com",333],["nkunorse.com",333],["nuhuskies.com",333],["nusports.com",333],["okstate.com",333],["olemisssports.com",333],["omavs.com",333],["ovcsports.com",333],["owlsports.com",333],["purduesports.com",333],["redstormsports.com",333],["richmondspiders.com",333],["sfajacks.com",333],["shupirates.com",333],["siusalukis.com",333],["smcgaels.com",333],["smumustangs.com",333],["soconsports.com",333],["soonersports.com",333],["themw.com",333],["tulsahurricane.com",333],["txst.com",333],["txstatebobcats.com",333],["ubbulls.com",333],["ucfknights.com",333],["ucirvinesports.com",333],["uconnhuskies.com",333],["uhcougars.com",333],["uicflames.com",333],["umterps.com",333],["uncwsports.com",333],["unipanthers.com",333],["unlvrebels.com",333],["uoflsports.com",333],["usdtoreros.com",333],["utahstateaggies.com",333],["utepathletics.com",333],["utrockets.com",333],["uvmathletics.com",333],["uwbadgers.com",333],["villanova.com",333],["wkusports.com",333],["wmubroncos.com",333],["woffordterriers.com",333],["1pack1goal.com",333],["bcuathletics.com",333],["bubraves.com",333],["goblackbears.com",333],["golightsgo.com",333],["gomcpanthers.com",333],["goutsa.com",333],["mercerbears.com",333],["pirateblue.com",333],["pirateblue.net",333],["pirateblue.org",333],["quinnipiacbobcats.com",333],["towsontigers.com",333],["tribeathletics.com",333],["tribeclub.com",333],["utepminermaniacs.com",333],["utepminers.com",333],["wkutickets.com",333],["aopathletics.org",333],["atlantichockeyonline.com",333],["bigsouthnetwork.com",333],["bigsouthsports.com",333],["chawomenshockey.com",333],["dbupatriots.org",333],["drakerelays.org",333],["ecac.org",333],["ecacsports.com",333],["emueagles.com",333],["emugameday.com",333],["gculopes.com",333],["godrakebulldog.com",333],["godrakebulldogs.com",333],["godrakebulldogs.net",333],["goeags.com",333],["goislander.com",333],["goislanders.com",333],["gojacks.com",333],["gomacsports.com",333],["gseagles.com",333],["hubison.com",333],["iowaconference.com",333],["ksuowls.com",333],["lonestarconference.org",333],["mascac.org",333],["midwestconference.org",333],["mountaineast.org",333],["niu-pack.com",333],["nulakers.ca",333],["oswegolakers.com",333],["ovcdigitalnetwork.com",333],["pacersports.com",333],["rmacsports.org",333],["rollrivers.com",333],["samfordsports.com",333],["uncpbraves.com",333],["usfdons.com",333],["wiacsports.com",333],["alaskananooks.com",333],["broncathleticfund.com",333],["cameronaggies.com",333],["columbiacougars.com",333],["etownbluejays.com",333],["gobadgers.ca",333],["golancers.ca",333],["gometrostate.com",333],["gothunderbirds.ca",333],["kentstatesports.com",333],["lehighsports.com",333],["lopers.com",333],["lycoathletics.com",333],["lycomingathletics.com",333],["maraudersports.com",333],["mauiinvitational.com",333],["msumavericks.com",333],["nauathletics.com",333],["nueagles.com",333],["nwusports.com",333],["oceanbreezenyc.org",333],["patriotathleticfund.com",333],["pittband.com",333],["principiaathletics.com",333],["roadrunnersathletics.com",333],["sidearmsocial.com",333],["snhupenmen.com",333],["stablerarena.com",333],["stoutbluedevils.com",333],["uwlathletics.com",333],["yumacs.com",333],["collegefootballplayoff.com",333],["csurams.com",333],["cubuffs.com",333],["gobearcats.com",333],["gohuskies.com",333],["mgoblue.com",333],["osubeavers.com",333],["pittsburghpanthers.com",333],["rolltide.com",333],["texassports.com",333],["thesundevils.com",333],["uclabruins.com",333],["wvuathletics.com",333],["wvusports.com",333],["arizonawildcats.com",333],["calbears.com",333],["cuse.com",333],["georgiadogs.com",333],["goducks.com",333],["goheels.com",333],["gostanford.com",333],["insidekstatesports.com",333],["insidekstatesports.info",333],["insidekstatesports.net",333],["insidekstatesports.org",333],["k-stateathletics.com",333],["k-statefootball.net",333],["k-statefootball.org",333],["k-statesports.com",333],["k-statesports.net",333],["k-statesports.org",333],["k-statewomenshoops.com",333],["k-statewomenshoops.net",333],["k-statewomenshoops.org",333],["kstateathletics.com",333],["kstatefootball.net",333],["kstatefootball.org",333],["kstatesports.com",333],["kstatewomenshoops.com",333],["kstatewomenshoops.net",333],["kstatewomenshoops.org",333],["ksuathletics.com",333],["ksusports.com",333],["scarletknights.com",333],["showdownforrelief.com",333],["syracusecrunch.com",333],["texastech.com",333],["theacc.com",333],["ukathletics.com",333],["usctrojans.com",333],["utahutes.com",333],["utsports.com",333],["wsucougars.com",333],["vidlii.com",[333,358]],["tricksplit.io",333],["fangraphs.com",334],["stern.de",335],["geo.de",335],["brigitte.de",335],["tvspielfilm.de",[336,337,338,339]],["tvtoday.de",[336,337,338,339]],["chip.de",[336,337,338,339]],["focus.de",[336,337,338,339]],["fitforfun.de",[336,337,338,339]],["n-tv.de",340],["player.rtl2.de",341],["planetaminecraft.com",342],["cravesandflames.com",343],["codesnse.com",343],["flyad.vip",343],["lapresse.ca",344],["kolyoom.com",345],["ilovephd.com",345],["negumo.com",346],["games.wkb.jp",[347,348]],["kenshi.fandom.com",350],["hausbau-forum.de",351],["homeairquality.org",351],["faucettronn.click",351],["fake-it.ws",352],["laksa19.github.io",353],["1shortlink.com",354],["u-s-news.com",355],["luscious.net",356],["makemoneywithurl.com",357],["junkyponk.com",357],["healthfirstweb.com",357],["vocalley.com",357],["yogablogfit.com",357],["howifx.com",[357,542]],["en.financerites.com",357],["mythvista.com",357],["livenewsflix.com",357],["cureclues.com",357],["apekite.com",357],["enit.in",357],["iammagnus.com",358],["dailyvideoreports.net",358],["unityassets4free.com",358],["docer.*",359],["resetoff.pl",359],["sexodi.com",359],["cdn77.org",360],["3sexporn.com",361],["momxxxsex.com",361],["myfreevintageporn.com",361],["penisbuyutucum.net",361],["ujszo.com",362],["newsmax.com",363],["nadidetarifler.com",364],["siz.tv",364],["suzylu.co.uk",[365,366]],["onworks.net",367],["yabiladi.com",367],["downloadsoft.net",368],["newsobserver.com",369],["arkadiumhosted.com",369],["testlanguages.com",370],["newsinlevels.com",370],["videosinlevels.com",370],["bookmystrip.com",371],["sabkiyojana.com",371],["starkroboticsfrc.com",372],["sinonimos.de",372],["antonimos.de",372],["quesignifi.ca",372],["tiktokrealtime.com",372],["tiktokcounter.net",372],["tpayr.xyz",372],["poqzn.xyz",372],["ashrfd.xyz",372],["rezsx.xyz",372],["tryzt.xyz",372],["ashrff.xyz",372],["rezst.xyz",372],["dawenet.com",372],["erzar.xyz",372],["waezm.xyz",372],["waezg.xyz",372],["blackwoodacademy.org",372],["cryptednews.space",372],["vivuq.com",372],["swgop.com",372],["vbnmll.com",372],["telcoinfo.online",372],["dshytb.com",372],["btcbitco.in",[372,376]],["btcsatoshi.net",372],["cempakajaya.com",372],["crypto4yu.com",372],["readbitcoin.org",372],["wiour.com",372],["finish.addurl.biz",372],["aiimgvlog.fun",[372,379]],["laweducationinfo.com",372],["savemoneyinfo.com",372],["worldaffairinfo.com",372],["godstoryinfo.com",372],["successstoryinfo.com",372],["cxissuegk.com",372],["learnmarketinfo.com",372],["bhugolinfo.com",372],["armypowerinfo.com",372],["rsadnetworkinfo.com",372],["rsinsuranceinfo.com",372],["rsfinanceinfo.com",372],["rsgamer.app",372],["rssoftwareinfo.com",372],["rshostinginfo.com",372],["rseducationinfo.com",372],["phonereviewinfo.com",372],["makeincomeinfo.com",372],["gknutshell.com",372],["vichitrainfo.com",372],["workproductivityinfo.com",372],["dopomininfo.com",372],["hostingdetailer.com",372],["fitnesssguide.com",372],["tradingfact4u.com",372],["cryptofactss.com",372],["softwaredetail.com",372],["artoffocas.com",372],["insurancesfact.com",372],["travellingdetail.com",372],["advertisingexcel.com",372],["allcryptoz.net",372],["batmanfactor.com",372],["beautifulfashionnailart.com",372],["crewbase.net",372],["documentaryplanet.xyz",372],["crewus.net",372],["gametechreviewer.com",372],["midebalonu.net",372],["misterio.ro",372],["phineypet.com",372],["seory.xyz",372],["shinbhu.net",372],["shinchu.net",372],["substitutefor.com",372],["talkforfitness.com",372],["thefitbrit.co.uk",372],["thumb8.net",372],["thumb9.net",372],["topcryptoz.net",372],["uniqueten.net",372],["ultraten.net",372],["exactpay.online",372],["quins.us",372],["kiddyearner.com",372],["imagereviser.com",373],["tech.pubghighdamage.com",374],["tech.techkhulasha.com",374],["hipsonyc.com",374],["jiocinema.com",374],["rapid-cloud.co",374],["uploadmall.com",374],["4funbox.com",375],["nephobox.com",375],["1024tera.com",375],["terabox.*",375],["blog.cryptowidgets.net",376],["blog.insurancegold.in",376],["blog.wiki-topia.com",376],["blog.coinsvalue.net",376],["blog.cookinguide.net",376],["blog.freeoseocheck.com",376],["blog24.me",376],["bildirim.*",378],["arahdrive.com",379],["appsbull.com",380],["diudemy.com",380],["maqal360.com",[380,381,382]],["lifesurance.info",383],["akcartoons.in",384],["cybercityhelp.in",384],["infokeeda.xyz",385],["webzeni.com",385],["dl.apkmoddone.com",386],["phongroblox.com",386],["fuckingfast.net",387],["buzzheavier.com",387],["tickhosting.com",388],["in91vip.win",389],["datavaults.co",390],["t-online.de",392],["upornia.*",[393,394]],["bobs-tube.com",395],["pornohirsch.net",396],["bembed.net",397],["embedv.net",397],["fslinks.org",397],["javguard.club",397],["listeamed.net",397],["v6embed.xyz",397],["vembed.*",397],["vgplayer.xyz",397],["vid-guard.com",397],["vinomo.xyz",397],["nekolink.site",[398,399]],["pixsera.net",400],["jnews5.com",401],["pc-builds.com",402],["qtoptens.com",402],["reuters.com",402],["today.com",402],["videogamer.com",402],["wrestlinginc.com",402],["usatoday.com",403],["ydr.com",403],["247sports.com",404],["indiatimes.com",405],["netzwelt.de",406],["arcade.buzzrtv.com",407],["arcade.dailygazette.com",407],["arcade.lemonde.fr",407],["arena.gamesforthebrain.com",407],["bestpuzzlesandgames.com",407],["cointiply.arkadiumarena.com",407],["gamelab.com",407],["games.abqjournal.com",407],["games.amny.com",407],["games.bellinghamherald.com",407],["games.besthealthmag.ca",407],["games.bnd.com",407],["games.boston.com",407],["games.bostonglobe.com",407],["games.bradenton.com",407],["games.centredaily.com",407],["games.charlotteobserver.com",407],["games.cnhinews.com",407],["games.crosswordgiant.com",407],["games.dailymail.co.uk",407],["games.dallasnews.com",407],["games.daytondailynews.com",407],["games.denverpost.com",407],["games.everythingzoomer.com",407],["games.fresnobee.com",407],["games.gameshownetwork.com",407],["games.get.tv",407],["games.greatergood.com",407],["games.heraldonline.com",407],["games.heraldsun.com",407],["games.idahostatesman.com",407],["games.insp.com",407],["games.islandpacket.com",407],["games.journal-news.com",407],["games.kansas.com",407],["games.kansascity.com",407],["games.kentucky.com",407],["games.lancasteronline.com",407],["games.ledger-enquirer.com",407],["games.macon.com",407],["games.mashable.com",407],["games.mercedsunstar.com",407],["games.metro.us",407],["games.metv.com",407],["games.miamiherald.com",407],["games.modbee.com",407],["games.moviestvnetwork.com",407],["games.myrtlebeachonline.com",407],["games.nationalreview.com",407],["games.newsobserver.com",407],["games.parade.com",407],["games.pressdemocrat.com",407],["games.puzzlebaron.com",407],["games.puzzler.com",407],["games.puzzles.ca",407],["games.qns.com",407],["games.readersdigest.ca",407],["games.sacbee.com",407],["games.sanluisobispo.com",407],["games.sixtyandme.com",407],["games.sltrib.com",407],["games.springfieldnewssun.com",407],["games.star-telegram.com",407],["games.startribune.com",407],["games.sunherald.com",407],["games.theadvocate.com",407],["games.thenewstribune.com",407],["games.theolympian.com",407],["games.theportugalnews.com",407],["games.thestar.com",407],["games.thestate.com",407],["games.tri-cityherald.com",407],["games.triviatoday.com",407],["games.usnews.com",407],["games.word.tips",407],["games.wordgenius.com",407],["games.wtop.com",407],["jeux.meteocity.com",407],["juegos.as.com",407],["juegos.elnuevoherald.com",407],["juegos.elpais.com",407],["philly.arkadiumarena.com",407],["play.dictionary.com",407],["puzzles.bestforpuzzles.com",407],["puzzles.centralmaine.com",407],["puzzles.crosswordsolver.org",407],["puzzles.independent.co.uk",407],["puzzles.nola.com",407],["puzzles.pressherald.com",407],["puzzles.standard.co.uk",407],["puzzles.sunjournal.com",407],["arkadium.com",408],["abysscdn.com",[409,410]],["arcai.com",411],["my-code4you.blogspot.com",412],["flickr.com",413],["firefile.cc",414],["pestleanalysis.com",414],["kochamjp.pl",414],["tutorialforlinux.com",414],["whatsaero.com",414],["animeblkom.net",[414,428]],["blkom.com",414],["globes.co.il",[415,416]],["jardiner-malin.fr",417],["tw-calc.net",418],["ohmybrush.com",419],["talkceltic.net",420],["mentalfloss.com",421],["uprafa.com",422],["cube365.net",423],["wwwfotografgotlin.blogspot.com",424],["freelistenonline.com",424],["badassdownloader.com",425],["quickporn.net",426],["yellowbridge.com",427],["aosmark.com",429],["ctrlv.*",430],["atozmath.com",[431,432,433,434,435,436,437]],["newyorker.com",438],["brighteon.com",439],["more.tv",440],["video1tube.com",441],["alohatube.xyz",441],["4players.de",442],["onlinesoccermanager.com",442],["fshost.me",443],["link.cgtips.org",444],["hentaicloud.com",445],["netfapx.com",447],["javdragon.org",447],["javneon.tv",447],["javsaga.ninja",447],["paperzonevn.com",448],["9jarock.org",449],["fzmovies.info",449],["fztvseries.ng",449],["netnaijas.com",449],["hentaienglish.com",450],["hentaiporno.xxx",450],["venge.io",[451,452]],["btcbux.io",453],["its.porn",[454,455]],["atv.at",456],["2ndrun.tv",457],["rackusreads.com",457],["teachmemicro.com",457],["willcycle.com",457],["kusonime.com",[458,459]],["123movieshd.*",460],["imgur.com",[461,462,723]],["hentai-party.com",463],["hentaicomics.pro",463],["uproxy.*",464],["animesa.*",465],["subtitle.one",466],["subtitleone.cc",466],["genshinimpactcalculator.com",467],["mysexgames.com",468],["cinecalidad.*",[469,470]],["xnxx.com",471],["xvideos.*",471],["gdr-online.com",472],["mmm.dk",473],["iqiyi.com",[474,475,608]],["m.iqiyi.com",476],["nbcolympics.com",477],["apkhex.com",478],["indiansexstories2.net",479],["issstories.xyz",479],["1340kbbr.com",480],["gorgeradio.com",480],["kduk.com",480],["kedoam.com",480],["kejoam.com",480],["kelaam.com",480],["khsn1230.com",480],["kjmx.rocks",480],["kloo.com",480],["klooam.com",480],["klykradio.com",480],["kmed.com",480],["kmnt.com",480],["kool991.com",480],["kpnw.com",480],["kppk983.com",480],["krktcountry.com",480],["ktee.com",480],["kwro.com",480],["kxbxfm.com",480],["thevalley.fm",480],["quizlet.com",481],["dsocker1234.blogspot.com",482],["schoolcheats.net",[483,484]],["mgnet.xyz",485],["designtagebuch.de",486],["pixroute.com",487],["uploady.io",488],["calculator-online.net",489],["luckydice.net",490],["adarima.org",490],["weatherwx.com",490],["sattaguess.com",490],["winshell.de",490],["rosasidan.ws",490],["modmakers.xyz",490],["gamepure.in",490],["upiapi.in",490],["daemonanime.net",490],["networkhint.com",490],["thichcode.net",490],["texturecan.com",490],["tikmate.app",[490,616]],["arcaxbydz.id",490],["quotesshine.com",490],["porngames.club",491],["sexgames.xxx",491],["111.90.159.132",492],["mobile-tracker-free.com",493],["pfps.gg",494],["social-unlock.com",495],["superpsx.com",496],["ninja.io",497],["sourceforge.net",498],["samfirms.com",499],["rapelust.com",500],["vtube.to",500],["desitelugusex.com",500],["dvdplay.*",500],["xvideos-downloader.net",500],["xxxvideotube.net",500],["sdefx.cloud",500],["nozomi.la",500],["banned.video",501],["madmaxworld.tv",501],["androidpolice.com",501],["babygaga.com",501],["backyardboss.net",501],["carbuzz.com",501],["cbr.com",501],["collider.com",501],["dualshockers.com",501],["footballfancast.com",501],["footballleagueworld.co.uk",501],["gamerant.com",501],["givemesport.com",501],["hardcoregamer.com",501],["hotcars.com",501],["howtogeek.com",501],["makeuseof.com",501],["moms.com",501],["movieweb.com",501],["pocket-lint.com",501],["pocketnow.com",501],["screenrant.com",501],["simpleflying.com",501],["thegamer.com",501],["therichest.com",501],["thesportster.com",501],["thethings.com",501],["thetravel.com",501],["topspeed.com",501],["xda-developers.com",501],["huffpost.com",502],["ingles.com",503],["spanishdict.com",503],["surfline.com",[504,505]],["play.tv3.ee",506],["play.tv3.lt",506],["play.tv3.lv",[506,507]],["tv3play.skaties.lv",506],["trendyoum.com",508],["bulbagarden.net",509],["hollywoodlife.com",510],["mat6tube.com",511],["hotabis.com",512],["root-nation.com",512],["italpress.com",512],["airsoftmilsimnews.com",512],["artribune.com",512],["textstudio.co",513],["newtumbl.com",514],["apkmaven.*",515],["aruble.net",516],["nevcoins.club",517],["mail.com",518],["gmx.*",519],["mangakita.id",521],["avpgalaxy.net",522],["panda-novel.com",523],["lightsnovel.com",523],["eaglesnovel.com",523],["pandasnovel.com",523],["ewrc-results.com",524],["kizi.com",525],["cyberscoop.com",526],["fedscoop.com",526],["canale.live",527],["jeep-cj.com",528],["sponsorhunter.com",529],["cloudcomputingtopics.net",530],["likecs.com",531],["tiscali.it",532],["linkspy.cc",533],["adshnk.com",534],["chattanoogan.com",535],["adsy.pw",536],["playstore.pw",536],["windowspro.de",537],["snapinst.app",538],["tvtv.ca",539],["tvtv.us",539],["mydaddy.cc",540],["roadtrippin.fr",541],["vavada5com.com",542],["anyporn.com",[543,560]],["bravoporn.com",543],["bravoteens.com",543],["crocotube.com",543],["hellmoms.com",543],["hellporno.com",543],["sex3.com",543],["tubewolf.com",543],["xbabe.com",543],["xcum.com",543],["zedporn.com",543],["imagetotext.info",544],["infokik.com",545],["freepik.com",546],["ddwloclawek.pl",[547,548]],["www.seznam.cz",549],["deezer.com",550],["my-subs.co",551],["plaion.com",552],["slideshare.net",[553,554]],["ustreasuryyieldcurve.com",555],["businesssoftwarehere.com",556],["goo.st",556],["freevpshere.com",556],["softwaresolutionshere.com",556],["gamereactor.*",558],["madoohd.com",559],["doomovie-hd.*",559],["staige.tv",561],["lvturbo.com",562],["androidadult.com",563],["streamvid.net",564],["watchtv24.com",565],["cellmapper.net",566],["medscape.com",567],["newscon.org",[568,569]],["wheelofgold.com",570],["drakecomic.*",570],["app.blubank.com",571],["mobileweb.bankmellat.ir",571],["chat.nrj.fr",572],["chat.tchatche.com",[572,587]],["ccthesims.com",579],["chromeready.com",579],["coursedrive.org",579],["dtbps3games.com",579],["illustratemagazine.com",579],["uknip.co.uk",579],["vod.pl",580],["megadrive-emulator.com",581],["tvhay.*",[582,583]],["animesaga.in",584],["moviesapi.club",584],["bestx.stream",584],["watchx.top",584],["digimanie.cz",585],["svethardware.cz",585],["srvy.ninja",586],["cnn.com",[588,589,590]],["news.bg",591],["edmdls.com",592],["freshremix.net",592],["scenedl.org",592],["trakt.tv",593],["shroomers.app",598],["classicalradio.com",599],["di.fm",599],["jazzradio.com",599],["radiotunes.com",599],["rockradio.com",599],["zenradio.com",599],["getthit.com",600],["techedubyte.com",601],["soccerinhd.com",601],["movie-th.tv",602],["iwanttfc.com",603],["nutraingredients-asia.com",604],["nutraingredients-latam.com",604],["nutraingredients-usa.com",604],["nutraingredients.com",604],["ozulscansen.com",605],["nexusmods.com",606],["lookmovie.*",607],["lookmovie2.to",607],["biletomat.pl",609],["hextank.io",[610,611]],["filmizlehdfilm.com",[612,613,614,615]],["filmizletv.*",[612,613,614,615]],["fullfilmizle.cc",[612,613,614,615]],["gofilmizle.net",[612,613,614,615]],["btvplus.bg",617],["sagewater.com",618],["redlion.net",618],["filmweb.pl",[619,620]],["satdl.com",621],["vidstreaming.xyz",622],["everand.com",623],["myradioonline.pl",624],["cbs.com",625],["paramountplus.com",625],["fullxh.com",626],["galleryxh.site",626],["megaxh.com",626],["movingxh.world",626],["seexh.com",626],["unlockxh4.com",626],["valuexh.life",626],["xhaccess.com",626],["xhadult2.com",626],["xhadult3.com",626],["xhadult4.com",626],["xhadult5.com",626],["xhamster.*",626],["xhamster1.*",626],["xhamster10.*",626],["xhamster11.*",626],["xhamster12.*",626],["xhamster13.*",626],["xhamster14.*",626],["xhamster15.*",626],["xhamster16.*",626],["xhamster17.*",626],["xhamster18.*",626],["xhamster19.*",626],["xhamster20.*",626],["xhamster2.*",626],["xhamster3.*",626],["xhamster4.*",626],["xhamster42.*",626],["xhamster46.com",626],["xhamster5.*",626],["xhamster7.*",626],["xhamster8.*",626],["xhamsterporno.mx",626],["xhbig.com",626],["xhbranch5.com",626],["xhchannel.com",626],["xhdate.world",626],["xhday.com",626],["xhday1.com",626],["xhlease.world",626],["xhmoon5.com",626],["xhofficial.com",626],["xhopen.com",626],["xhplanet1.com",626],["xhplanet2.com",626],["xhreal2.com",626],["xhreal3.com",626],["xhspot.com",626],["xhtotal.com",626],["xhtree.com",626],["xhvictory.com",626],["xhwebsite.com",626],["xhwebsite2.com",626],["xhwebsite5.com",626],["xhwide1.com",626],["xhwide2.com",626],["xhwide5.com",626],["file-upload.net",628],["acortalo.*",[629,630,631,632]],["acortar.*",[629,630,631,632]],["megadescarga.net",[629,630,631,632]],["megadescargas.net",[629,630,631,632]],["hentaihaven.xxx",633],["jacquieetmicheltv2.net",635],["a2zapk.*",636],["fcportables.com",[637,638]],["emurom.net",639],["freethesaurus.com",[640,641]],["thefreedictionary.com",[640,641]],["oeffentlicher-dienst.info",642],["im9.eu",643],["dcdlplayer8a06f4.xyz",644],["ultimate-guitar.com",645],["claimbits.net",646],["sexyscope.net",647],["kickassanime.*",648],["recherche-ebook.fr",649],["virtualdinerbot.com",649],["zonebourse.com",650],["pink-sluts.net",651],["andhrafriends.com",652],["benzinpreis.de",653],["turtleviplay.xyz",654],["defenseone.com",655],["govexec.com",655],["nextgov.com",655],["route-fifty.com",655],["sharing.wtf",656],["wetter3.de",657],["esportivos.fun",658],["cosmonova-broadcast.tv",659],["hartvannederland.nl",660],["shownieuws.nl",660],["vandaaginside.nl",660],["rock.porn",[661,662]],["videzz.net",[663,664]],["ezaudiobookforsoul.com",665],["club386.com",666],["decompiler.com",[667,668]],["littlebigsnake.com",669],["easyfun.gg",670],["smailpro.com",671],["ilgazzettino.it",672],["ilmessaggero.it",672],["3bmeteo.com",[673,674]],["mconverter.eu",675],["lover937.net",676],["10gb.vn",677],["pes6.es",678],["tactics.tools",[679,680]],["boundhub.com",681],["alocdnnetu.xyz",682],["reliabletv.me",683],["jakondo.ru",684],["filecrypt.*",685],["nolive.me",687],["wired.com",688],["spankbang.*",[689,690,691,725,726]],["hulu.com",[692,693,694]],["hanime.tv",695],["anonymfile.com",696],["gofile.to",696],["dotycat.com",697],["rateyourmusic.com",698],["reporterpb.com.br",699],["blog-dnz.com",701],["18adultgames.com",702],["colnect.com",[703,704]],["adultgamesworld.com",705],["bgmiupdate.com.in",706],["reviewdiv.com",707],["parametric-architecture.com",708],["laurelberninteriors.com",[709,728]],["voiceofdenton.com",710],["concealednation.org",710],["askattest.com",712],["opensubtitles.com",713],["savefiles.com",714],["streamup.ws",715],["goodstream.one",716],["lecrabeinfo.net",717],["www.google.*",718],["tacobell.com",719],["zefoy.com",720],["cnet.com",721],["natgeotv.com",724],["globo.com",727],["wayfair.com",729]]);
const exceptionsMap = new Map([["cloudflare.com",[0]],["pingit.com",[172]],["loan.bgmi32bitapk.in",[298]],["lookmovie.studio",[607]]]);
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
