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
const argsList = [["console.clear","undefined"],["aclib.runInPagePush","{}","as","callback"],["adBlockDetected","undefined"],["akamaiDisableServerIpLookup","noopFunc"],["DD_RUM.addAction","noopFunc"],["nads.createAd","trueFunc"],["dvtag.getTargeting","trueFunc"],["ga","noopFunc"],["huecosPBS.nstdX","null"],["DTM.trackAsyncPV","noopFunc"],["_satellite","{}"],["_satellite.getVisitorId","noopFunc"],["newPageViewSpeedtest","noopFunc"],["pubg.unload","noopFunc"],["generateGalleryAd","noopFunc"],["mediator","noopFunc"],["Object.prototype.subscribe","noopFunc"],["gbTracker","{}"],["gbTracker.sendAutoSearchEvent","noopFunc"],["Object.prototype.vjsPlayer.ads","noopFunc"],["network_user_id",""],["google.ima.OmidVerificationVendor","{}"],["Object.prototype.omidAccessModeRules","{}"],["googletag.cmd","{}"],["_aps","{}"],["Object.prototype.setDisableFlashAds","noopFunc"],["DD_RUM.addTiming","noopFunc"],["chameleonVideo.adDisabledRequested","true"],["AdmostClient","{}"],["analytics","{}"],["datalayer","[]"],["Object.prototype.isInitialLoadDisabled","noopFunc"],["listingGoogleEETracking","noopFunc"],["dcsMultiTrack","noopFunc"],["urlStrArray","noopFunc"],["pa","{}"],["Object.prototype.setConfigurations","noopFunc"],["Object.prototype.bk_addPageCtx","noopFunc"],["Object.prototype.bk_doJSTag","noopFunc"],["passFingerPrint","noopFunc"],["optimizely","{}"],["optimizely.initialized","true"],["google_optimize","{}"],["google_optimize.get","noopFunc"],["_gsq","{}"],["_gsq.push","noopFunc"],["stmCustomEvent","noopFunc"],["_gsDevice",""],["iom","{}"],["iom.c","noopFunc"],["_conv_q","{}"],["_conv_q.push","noopFunc"],["google.ima.settings.setDisableFlashAds","noopFunc"],["pa.privacy","{}"],["populateClientData4RBA","noopFunc"],["YT.ImaManager","noopFunc"],["UOLPD","{}"],["UOLPD.dataLayer","{}"],["__configuredDFPTags","{}"],["URL_VAST_YOUTUBE","{}"],["Adman","{}"],["dplus","{}"],["dplus.track","noopFunc"],["_satellite.track","noopFunc"],["google.ima.dai","{}"],["gfkS2sExtension","{}"],["gfkS2sExtension.HTML5VODExtension","noopFunc"],["AnalyticsEventTrackingJS","{}"],["AnalyticsEventTrackingJS.addToBasket","noopFunc"],["AnalyticsEventTrackingJS.trackErrorMessage","noopFunc"],["initializeslideshow","noopFunc"],["fathom","{}"],["fathom.trackGoal","noopFunc"],["Origami","{}"],["Origami.fastclick","noopFunc"],["jad","undefined"],["hasAdblocker","true"],["Sentry","{}"],["Sentry.init","noopFunc"],["TRC","{}"],["TRC._taboolaClone","[]"],["fp","{}"],["fp.t","noopFunc"],["fp.s","noopFunc"],["initializeNewRelic","noopFunc"],["turnerAnalyticsObj","{}"],["turnerAnalyticsObj.setVideoObject4AnalyticsProperty","noopFunc"],["optimizelyDatafile","{}"],["optimizelyDatafile.featureFlags","[]"],["fingerprint","{}"],["fingerprint.getCookie","noopFunc"],["gform.utils","noopFunc"],["gform.utils.trigger","noopFunc"],["get_fingerprint","noopFunc"],["moatPrebidApi","{}"],["moatPrebidApi.getMoatTargetingForPage","noopFunc"],["cpd_configdata","{}"],["cpd_configdata.url",""],["yieldlove_cmd","{}"],["yieldlove_cmd.push","noopFunc"],["dataLayer.push","noopFunc"],["_etmc","{}"],["_etmc.push","noopFunc"],["freshpaint","{}"],["freshpaint.track","noopFunc"],["ShowRewards","noopFunc"],["stLight","{}"],["stLight.options","noopFunc"],["DD_RUM.addError","noopFunc"],["sensorsDataAnalytic201505","{}"],["sensorsDataAnalytic201505.init","noopFunc"],["sensorsDataAnalytic201505.quick","noopFunc"],["sensorsDataAnalytic201505.track","noopFunc"],["s","{}"],["s.tl","noopFunc"],["smartech","noopFunc"],["sensors","{}"],["sensors.init","noopFunc"],["sensors.track","noopFunc"],["adn","{}"],["adn.clearDivs","noopFunc"],["_vwo_code","{}"],["gtag","noopFunc"],["_taboola","{}"],["_taboola.push","noopFunc"],["clicky","{}"],["clicky.goal","noopFunc"],["WURFL","{}"],["_sp_.config.events.onSPPMObjectReady","noopFunc"],["gtm","{}"],["gtm.trackEvent","noopFunc"],["mParticle.Identity.getCurrentUser","noopFunc"],["JSGlobals.prebidEnabled","false"],["elasticApm","{}"],["elasticApm.init","noopFunc"],["Object.prototype.que","noopFunc"],["Object.prototype.que.push","noopFunc"],["ga.sendGaEvent","noopFunc"],["adobe","{}"],["MT","{}"],["MT.track","noopFunc"],["ClickOmniPartner","noopFunc"],["adex","{}"],["adex.getAdexUser","noopFunc"],["Adkit","noopFunc"],["Object.prototype.shouldExpectGoogleCMP","false"],["apntag.refresh","noopFunc"],["pa.sendEvent","noopFunc"],["Munchkin","{}"],["Munchkin.init","noopFunc"],["ttd_dom_ready","noopFunc"],["ramp","undefined"],["appInfo.snowplow.trackSelfDescribingEvent","noopFunc"],["_vwo_code.init","noopFunc"],["adobePageView","noopFunc"],["dapTracker","{}"],["dapTracker.track","noopFunc"],["ytInitialPlayerResponse.playerAds","undefined"],["ytInitialPlayerResponse.adPlacements","undefined"],["ytInitialPlayerResponse.adSlots","undefined"],["playerResponse.adPlacements","undefined"],["nsShowMaxCount","0"],["objVc.interstitial_web",""],["_ml_ads_ns","null"],["_sp_.config","undefined"],["isAdBlockActive","false"],["AdController","noopFunc"],["console.clear","noopFunc"],["Object.prototype.hideAds","true"],["Object.prototype._getSalesHouseConfigurations","noopFunc"],["vast_urls","{}"],["sadbl","false"],["adblockcheck","false"],["arrvast","[]"],["blurred","false"],["flashvars.adv_pre_src",""],["showPopunder","false"],["page_params.holiday_promo","true"],["adsEnabled","true"],["String.prototype.charAt","trueFunc"],["ad_blocker","false"],["blockAdBlock","true"],["VikiPlayer.prototype.pingAbFactor","noopFunc"],["player.options.disableAds","true"],["console.clear","trueFunc"],["flashvars.adv_pre_vast",""],["flashvars.adv_pre_vast_alt",""],["x_width","1"],["_site_ads_ns","true"],["luxuretv.config",""],["Object.prototype.AdOverlay","noopFunc"],["tkn_popunder","null"],["can_run_ads","true"],["adsBlockerDetector","noopFunc"],["globalThis","null"],["adblock","false"],["__ads","true"],["FlixPop.isPopGloballyEnabled","falseFunc"],["check_adblock","true"],["$.magnificPopup.open","noopFunc"],["adsenseadBlock","noopFunc"],["adblockSuspected","false"],["xRds","true"],["cRAds","false"],["disasterpingu","false"],["App.views.adsView.adblock","false"],["flashvars.adv_pause_html",""],["$.fx.off","true"],["adBlockEnabled","false"],["puShown","true"],["showAds","true"],["attr","{}"],["scriptSrc",""],["cxStartDetectionProcess","noopFunc"],["isAdBlocked","false"],["adblock","noopFunc"],["path",""],["_ctrl_vt.blocked.ad_script","false"],["blockAdBlock","noopFunc"],["caca","noopFunc"],["Ok","true"],["safelink.adblock","false"],["openPopunder","noopFunc"],["ClickUnder","noopFunc"],["flashvars.adv_pre_url",""],["flashvars.protect_block",""],["flashvars.video_click_url",""],["adBlock","false"],["spoof","noopFunc"],["btoa","null"],["sp_ad","true"],["adsBlocked","false"],["_sp_.msg.displayMessage","noopFunc"],["CaptchmeState.adb","undefined"],["UhasAB","false"],["adNotificationDetected","false"],["atob","noopFunc"],["_pop","noopFunc"],["CnnXt.Event.fire","noopFunc"],["_ti_update_user","noopFunc"],["valid","1"],["vastAds","[]"],["adblock","1"],["frg","1"],["time","0"],["ads","true"],["GNCA_Ad_Support","true"],["Date.now","noopFunc"],["jQuery.adblock","1"],["VMG.Components.Adblock","false"],["adblockDetector","trueFunc"],["hasPoped","true"],["flashvars.video_click_url","undefined"],["flashvars.adv_start_html",""],["flashvars.popunder_url",""],["flashvars.adv_post_src",""],["flashvars.adv_post_url",""],["jQuery.adblock","false"],["google_jobrunner","true"],["sec","0"],["gadb","false"],["checkadBlock","noopFunc"],["clientSide.adbDetect","noopFunc"],["HTMLAnchorElement.prototype.click","noopFunc"],["cmnnrunads","true"],["adBlocker","false"],["adBlockDetected","noopFunc"],["StileApp.somecontrols.adBlockDetected","noopFunc"],["MDCore.adblock","0"],["google_tag_data","noopFunc"],["noAdBlock","true"],["adsOk","true"],["check","true"],["isal","true"],["document.hidden","true"],["awm","true"],["adblockEnabled","false"],["is_adblocked","false"],["pogo.intermission.staticAdIntermissionPeriod","0"],["SubmitDownload1","noopFunc"],["t","0"],["ckaduMobilePop","noopFunc"],["tieneAdblock","0"],["adsAreBlocked","false"],["cmgpbjs","false"],["displayAdblockOverlay","false"],["google","false"],["Math.pow","noopFunc"],["openInNewTab","noopFunc"],["runAdBlocker","false"],["Adblock","false"],["flashvars.logo_url",""],["flashvars.logo_text",""],["nlf.custom.userCapabilities","false"],["count","0"],["LoadThisScript","true"],["showPremLite","true"],["closeBlockerModal","false"],["adBlockDetector.isEnabled","falseFunc"],["areAdsDisplayed","true"],["gkAdsWerbung","true"],["pop_target","null"],["is_banner","true"],["$easyadvtblock","false"],["show_dfp_preroll","false"],["show_youtube_preroll","false"],["doads","true"],["jsUnda","noopFunc"],["AlobaidiDetectAdBlock","true"],["Advertisement","1"],["adBlockDetected","false"],["abp1","1"],["pr_okvalida","true"],["$.ajax","trueFunc"],["cnbc.canShowAds","true"],["ue_adb_chk","1"],["firefaucet","true"],["cRAds","true"],["uas","[]"],["flashvars.popunder_url","undefined"],["adv","true"],["prerollMain","undefined"],["canRunAds","true"],["Fingerprint2","true"],["dclm_ajax_var.disclaimer_redirect_url",""],["load_pop_power","noopFunc"],["adBlockDetected","true"],["Time_Start","0"],["blockAdBlock","trueFunc"],["ezstandalone.enabled","true"],["foundation.adPlayer.bitmovin","{}"],["DL8_GLOBALS.enableAdSupport","false"],["DL8_GLOBALS.useHomad","false"],["DL8_GLOBALS.enableHomadDesktop","false"],["DL8_GLOBALS.enableHomadMobile","false"],["Object.prototype.adReinsertion","noopFunc"],["getHomadConfig","noopFunc"],["ab","false"],["go_popup","{}"],["noBlocker","true"],["adsbygoogle","null"],["fabActive","false"],["gWkbAdVert","true"],["noblock","true"],["wgAffiliateEnabled","false"],["ads","null"],["detectAdblock","noopFunc"],["adsLoadable","true"],["ASSetCookieAds","null"],["letShowAds","true"],["ulp_noadb","true"],["Object.prototype.adblock_detected","false"],["timeSec","0"],["adsbygoogle.loaded","true"],["ads_unblocked","true"],["xxSetting.adBlockerDetection","false"],["open","undefined"],["Drupal.behaviors.adBlockerPopup","null"],["fake_ad","true"],["koddostu_com_adblock_yok","null"],["adsbygoogle","trueFunc"],["player.ads.cuePoints","undefined"],["adBlockDetected","null"],["better_ads_adblock","1"],["Adv_ab","false"],["sgpbCanRunAds","true"],["document.hidden","false"],["document.hasFocus","trueFunc"],["hasFocus","trueFunc"],["navigator.brave","undefined"],["Object.prototype.isAllAdClose","true"],["isRequestPresent","true"],["fouty","true"],["Notification","undefined"],["protection","noopFunc"],["private","false"],["navigator.webkitTemporaryStorage.queryUsageAndQuota","noopFunc"],["document.onkeydown","noopFunc"],["showadas","true"],["alert","throwFunc"],["aSl.gcd","0"],["window.adLink","null"],["detectedAdblock","undefined"],["isTabActive","true"],["clicked","2"],["ov.advertising.tisoomi.loadScript","noopFunc"],["abp","false"],["hommy","{}"],["hommy.waitUntil","noopFunc"],["flashvars.mlogo",""],["vpPrerollVideo","undefined"],["PlayerConfig.config.CustomAdSetting","[]"],["PlayerConfig.trusted","true"],["PlayerConfig.config.AffiliateAdViewLevel","3"],["univresalP","noopFunc"],["hold_click","false"],["tie.ad_blocker_detector","false"],["admiral","noopFunc"],["gnt.u.adfree","true"],["__INITIAL_DATA__.siteData.admiralScript"],["objAd.loadAdShield","noopFunc"],["window.myAd.runAd","noopFunc"],["detectAdBlock","noopFunc"],["__INITIAL_STATE__.config.theme.ads.isAdBlockerEnabled","false"],["__INITIAL_STATE__.gameLists.gamesNoPrerollIds.indexOf","trueFunc"],["document.ontouchend","null"],["document.onclick","null"],["pubAdsService","trueFunc"],["config.pauseInspect","false"],["appContext.adManager.context.current.adFriendly","false"],["blockAdBlock._options.baitClass","null"],["document.blocked_var","1"],["____ads_js_blocked","false"],["wIsAdBlocked","false"],["WebSite.plsDisableAdBlock","null"],["ads_blocked","false"],["samDetected","false"],["countClicks","0"],["settings.adBlockerDetection","false"],["mixpanel.get_distinct_id","true"],["fuckAdBlock._options.baitClass","null"],["bscheck.adblocker","noopFunc"],["qpcheck.ads","noopFunc"],["isContentBlocked","falseFunc"],["CloudflareApps.installs.Ik7rmQ4t95Qk.options.measureDomain","undefined"],["detectAB1","noopFunc"],["uBlockOriginDetected","false"],["googletag._vars_","{}"],["googletag._loadStarted_","true"],["googletag._loaded_","true"],["google_unique_id","1"],["google.javascript","{}"],["google.javascript.ads","{}"],["google_global_correlator","1"],["paywallGateway.truncateContent","noopFunc"],["adBlockDisabled","true"],["blockedElement","noopFunc"],["popit","false"],["adBlockerDetected","false"],["abu","falseFunc"],["countdown","0"],["decodeURI","noopFunc"],["flashvars.adv_postpause_vast",""],["xv_ad_block","0"],["openWindow","noopFunc"],["vidorev_jav_plugin_video_ads_object.vid_ads_m_video_ads",""],["adsProvider.init","noopFunc"],["SDKLoaded","true"],["blockAdBlock._creatBait","null"],["POPUNDER_ENABLED","false"],["plugins.preroll","noopFunc"],["errcode","0"],["DHAntiAdBlocker","true"],["showada","true"],["showax","true"],["p18","undefined"],["ADBLOCKED","false"],["Object.prototype.adsEnabled","false"],["adb","0"],["String.fromCharCode","trueFunc"],["adblock_use","false"],["Object.prototype.adblockFound","false"],["createCanvas","noopFunc"],["document.bridCanRunAds","true"],["playerAdSettings.adLink",""],["playerAdSettings.waitTime","0"],["xv.sda.pp.init","noopFunc"],["isAdsLoaded","true"],["adblockerAlert","noopFunc"],["Object.prototype.parseXML","noopFunc"],["Object.prototype.blackscreenDuration","1"],["Object.prototype.adPlayerId",""],["adblockDetect","noopFunc"],["style","noopFunc"],["history.pushState","noopFunc"],["google_unique_id","6"],["__NEXT_DATA__.props.pageProps.adsConfig","undefined"],["new_config.timedown","0"],["truex","{}"],["truex.client","noopFunc"],["hiddenProxyDetected","false"],["SteadyWidgetSettings.adblockActive","false"],["proclayer","noopFunc"],["timeleft","0"],["load_ads","trueFunc"],["starPop","1"],["Object.prototype.ads","noopFunc"],["detectBlockAds","noopFunc"],["ga","trueFunc"],["ad_link",""],["penciBlocksArray","[]"],["App.AdblockDetected","false"],["SF.adblock","true"],["startfrom","0"],["D4zz","noopFunc"],["Object.prototype.ads.nopreroll_","true"],["HP_Scout.adBlocked","false"],["SD_IS_BLOCKING","false"],["Object.prototype.isPremium","true"],["__BACKPLANE_API__.renderOptions.showAdBlock",""],["Object.prototype.isNoAds","{}"],["tv3Cmp.ConsentGiven","true"],["setupSkin","noopFunc"],["Object.prototype.enableInterstitial","false"],["ads","undefined"],["td_ad_background_click_link","undefined"],["POSTPART_prototype.ADKEY","noopFunc"],["adBlockDetected","falseFunc"],["divWidth","1"],["noAdBlock","noopFunc"],["AdService.info.abd","noopFunc"],["adBlockDetectionResult","undefined"],["popped","true"],["puShown1","true"],["passthetest","true"],["pandaAdviewValidate","true"],["canGetAds","true"],["ad_blocker_active","false"],["init_welcome_ad","noopFunc"],["moneyAbovePrivacyByvCDN","true"],["document.body.contains","trueFunc"],["popunder","undefined"],["distance","0"],["document.onclick",""],["adEnable","true"],["displayAds","0"],["_adshrink.skiptime","0"],["AbleToRunAds","true"],["PreRollAd.timeCounter","0"],["abpblocked","undefined"],["paAddUnit","noopFunc"],["adt","0"],["test_adblock","noopFunc"],["adblockDetector","noopFunc"],["vastEnabled","false"],["detectadsbocker","false"],["two_worker_data_js.js","[]"],["FEATURE_DISABLE_ADOBE_POPUP_BY_COUNTRY","true"],["questpassGuard","noopFunc"],["isAdBlockerEnabled","false"],["sssp","emptyObj"],["smartLoaded","true"],["timeLeft","0"],["Cookiebot","noopFunc"],["feature_flags.interstitial_ads_flag","false"],["feature_flags.interstitials_every_four_slides","false"],["waldoSlotIds","true"],["adblockstatus","false"],["adScriptLoaded","true"],["adblockEnabled","noopFunc"],["adSettings","[]"],["banner_is_blocked","false"],["Object.prototype.adBlocked","false"],["chp_adblock_browser","noopFunc"],["googleAd","true"],["Brid.A9.prototype.backfillAdUnits","[]"],["dct","0"],["slideShow.displayInterstitial","true"],["googletag","true"],["tOS2","150"],["checkAdBlocker","noopFunc"],["navigator.standalone","true"],["ShowAdvertising","{}"],["empire.pop","undefined"],["empire.direct","undefined"],["empire.directHideAds","undefined"],["empire.mediaData.advisorMovie","1"],["empire.mediaData.advisorSerie","1"],["setTimer","0"],["penci_adlbock.ad_blocker_detector","0"],["Object.prototype.adblockDetector","noopFunc"],["blext","true"],["vidorev_jav_plugin_video_ads_object","{}"],["vidorev_jav_plugin_video_ads_object_post","{}"],["S_Popup","10"],["rabLimit","-1"],["nudgeAdBlock","noopFunc"],["feedBack.showAffilaePromo","noopFunc"],["FAVE.settings.ads.ssai.prod.clips.enabled","false"],["FAVE.settings.ads.ssai.prod.liveAuth.enabled","false"],["FAVE.settings.ads.ssai.prod.liveUnauth.enabled","false"],["HTMLScriptElement.prototype.onerror","null"],["loadpagecheck","noopFunc"],["art3m1sItemNames.affiliate-wrapper","\"\""],["window.adngin","{}"],["amzn_aps_csm","{}"],["isAdBlockerActive","noopFunc"],["di.app.WebplayerApp.Ads.Adblocks.app.AdBlockDetectApp.startWithParent","false"],["sharedController.adblockDetector","noopFunc"],["checkAdsStatus","noopFunc"],["ads","[]"],["settings.adBlockDetectionEnabled","false"],["displayInterstitialAdConfig","false"],["checkAdBlockeraz","noopFunc"],["blockingAds","false"],["Yii2App.playbackTimeout","0"],["QiyiPlayerProphetData.a.data","{}"],["toggleAdBlockInfo","falseFunc"],["aipAPItag.prerollSkipped","true"],["aipAPItag.setPreRollStatus","trueFunc"],["reklam_1_saniye","0"],["reklam_1_gecsaniye","0"],["reklamsayisi","1"],["reklam_1",""],["powerAPITag","emptyObj"],["playerEnhancedConfig.run","throwFunc"],["aoAdBlockDetected","false"],["rodo.checkIsDidomiConsent","noopFunc"],["xtime","0"],["Div_popup",""],["Scribd.Blob.AdBlockerModal","noopFunc"],["AddAdsV2I.addBlock","false"],["hasAdBlocker","false"],["initials.yld-pdpopunder",""],["download_click","true"],["advertisement3","true"],["clicked","true"],["eClicked","true"],["number","0"],["sync","true"],["PlayerLogic.prototype.detectADB","noopFunc"],["showPopunder","noopFunc"],["Object.prototype.prerollAds","[]"],["notifyMe","noopFunc"],["adsClasses","undefined"],["gsecs","0"],["dvsize","52"],["majorse","true"],["completed","1"],["testerli","false"],["w87.abd","noopFunc"],["document.referrer",""],["Object.prototype.setNeedShowAdblockWarning","noopFunc"],["NoAdBlock","noopFunc"],["adList","[]"],["ifmax","true"],["nitroAds.abp","true"],["onloadUI","noopFunc"],["PageLoader.DetectAb","0"],["one_time","1"],["consentGiven","true"],["playID","1"],["GEMG.GPT.Interstitial","noopFunc"],["amiblock","0"],["karte3","18"],["sandDetect","noopFunc"],["amodule.data","emptyArr"],["Object.prototype.ADBLOCK_DETECTION",""],["postroll","undefined"],["interstitial","undefined"],["isAdBlockDetected","false"],["pData.adblockOverlayEnabled","0"],["cabdSettings","undefined"],["td_ad_background_click_link"],["malisx","true"],["alim","true"],["ADS.isBannersEnabled","false"],["EASYFUN_ADS_CAN_RUN","true"],["adsbygoogle_ama_fc_has_run","true"],["jwDefaults.advertising","{}"],["elimina_profilazione","1"],["elimina_pubblicita","1"],["abd","{}"],["checkerimg","noopFunc"],["detectedAdblock","noopFunc"],["Object.prototype.DetectByGoogleAd","noopFunc"],["nitroAds","{}"],["nitroAds.createAd","noopFunc"],["NativeAd","noopFunc"],["Blob","noopFunc"],["window.navigator.brave","undefined"],["HTMLScriptElement.prototype.onerror","undefined"],["isAdblock","false"],["openPop","noopFunc"],["cns.library","true"],["BJSShowUnder","{}"],["BJSShowUnder.bindTo","noopFunc"],["BJSShowUnder.add","noopFunc"],["Object.prototype._parseVAST","noopFunc"],["Object.prototype.createAdBlocker","noopFunc"],["Object.prototype.isAdPeriod","falseFunc"],["ABLK","false"],["_n_app.popunder","null"],["_n_app.options.ads.show_popunders","false"],["N_BetterJsPop.object","{}"],["isAdb","false"],["countDown","0"],["runCheck","noopFunc"],["adsSlotRenderEndSeen","true"],["showModal","noopFunc"],["flashvars.mlogo_link",""],["isAdBlocked","noopFunc"],["URLlist","[]"],["aaw","{}"],["aaw.processAdsOnPage","noopFunc"],["doOpen","undefined"],["HTMLImageElement.prototype.onerror","undefined"],["FOXIZ_MAIN_SCRIPT.siteAccessDetector","noopFunc"],["openAdBlockPopup","noopFunc"],["Object.prototype._adsDisabled","true"],["advanced_ads_check_adblocker","noopFunc"],["canRunAds","1"],["attestHasAdBlockerActivated","true"],["extInstalled","true"],["SaveFiles.add","noopFunc"],["detectSandbox","noopFunc"],["adbon","0"],["LCI.adBlockDetectorEnabled","false"],["stoCazzo","true"],["adblockDetected","false"],["importFAB","undefined"],["window.__CONFIGURATION__.adInsertion.enabled","false"],["window.__CONFIGURATION__.features.enableAdBlockerDetection","false"],["_carbonads","{}"],["_bsa","{}"],["rwt","noopFunc"],["bmak.js_post","false"],["firebase.analytics","noopFunc"],["Object.prototype.updateModifiedCommerceUrl","noopFunc"],["flashvars.event_reporting",""],["Object.prototype.has_opted_out_tracking","trueFunc"],["Visitor","{}"],["send_gravity_event","noopFunc"],["send_recommendation_event","noopFunc"],["libAnalytics.data.get","noopFunc"],["adthrive._components.start","noopFunc"],["navigator.sendBeacon","noopFunc"]];
const hostnamesMap = new Map([["jilliandescribecompany.com",0],["gogoanime.*",[0,198]],["adrianmissionminute.com",0],["alejandrocenturyoil.com",0],["alleneconomicmatter.com",0],["bethshouldercan.com",0],["bigclatterhomesguideservice.com",0],["brittneystandardwestern.com",0],["brookethoughi.com",0],["brucevotewithin.com",0],["cindyeyefinal.com",0],["denisegrowthwide.com",0],["diananatureforeign.com",0],["donaldlineelse.com",0],["edwardarriveoften.com",0],["erikcoldperson.com",0],["evelynthankregion.com",0],["graceaddresscommunity.com",0],["heatherdiscussionwhen.com",0],["heatherwholeinvolve.com",0],["housecardsummerbutton.com",0],["jamessoundcost.com",0],["jamiesamewalk.com",0],["jasminetesttry.com",0],["jasonresponsemeasure.com",0],["jayservicestuff.com",0],["jennifercertaindevelopment.com",0],["jessicaglassauthor.com",0],["johnalwayssame.com",0],["johntryopen.com",0],["jonathansociallike.com",0],["josephseveralconcern.com",0],["kellywhatcould.com",0],["kennethofficialitem.com",0],["kristiesoundsimply.com",0],["lisatrialidea.com",0],["lorimuchbenefit.com",0],["loriwithinfamily.com",0],["lukecomparetwo.com",0],["mariatheserepublican.com",0],["markstyleall.com",0],["michaelapplysome.com",0],["morganoperationface.com",0],["nathanfromsubject.com",0],["paulkitchendark.com",0],["rebeccaneverbase.com",0],["richardsignfish.com",0],["roberteachfinal.com",0],["robertordercharacter.com",0],["robertplacespace.com",0],["ryanagoinvolve.com",0],["sandratableother.com",0],["sandrataxeight.com",0],["sethniceletter.com",0],["shannonpersonalcost.com",0],["susanhavekeep.com",0],["tinycat-voe-fashion.com",0],["toddpartneranimal.com",0],["troyyourlead.com",0],["uptodatefinishconference.com",0],["uptodatefinishconferenceroom.com",0],["voe.sx",0],["maxfinishseveral.com",0],["voe.sx>>",0],["javboys.tv>>",0],["freeplayervideo.com",0],["nazarickol.com",0],["player-cdn.com",0],["playhydrax.com",[0,405,406]],["rabbitstream.net",0],["fmovies.*",0],["japscan.*",1],["u26bekrb.fun",2],["br.de",3],["indeed.com",4],["zillow.com",[4,108]],["pasteboard.co",5],["bbc.com",6],["clickhole.com",7],["deadspin.com",7],["gizmodo.com",7],["jalopnik.com",7],["jezebel.com",7],["kotaku.com",7],["lifehacker.com",7],["splinternews.com",7],["theinventory.com",7],["theonion.com",7],["theroot.com",7],["thetakeout.com",7],["pewresearch.org",7],["los40.com",[8,9]],["as.com",9],["telegraph.co.uk",[10,11]],["poweredbycovermore.com",[10,63]],["lumens.com",[10,63]],["verizon.com",12],["humanbenchmark.com",13],["politico.com",14],["officedepot.co.cr",[15,16]],["officedepot.*",[17,18]],["usnews.com",19],["coolmathgames.com",[20,284,285,286]],["video.gazzetta.it",[21,22]],["oggi.it",[21,22]],["manoramamax.com",21],["factable.com",23],["thedailybeast.com",24],["zee5.com",25],["gala.fr",26],["geo.fr",26],["voici.fr",26],["gloucestershirelive.co.uk",27],["arsiv.mackolik.com",28],["jacksonguitars.com",29],["scandichotels.com",30],["stylist.co.uk",31],["nettiauto.com",32],["thaiairways.com",[33,34]],["cerbahealthcare.it",[35,36]],["futura-sciences.com",[35,53]],["toureiffel.paris",35],["campusfrance.org",[35,147]],["tiendaenlinea.claro.com.ni",[37,38]],["tieba.baidu.com",39],["fandom.com",[40,41,344]],["grasshopper.com",[42,43]],["epson.com.cn",[44,45,46,47]],["oe24.at",[48,49]],["szbz.de",48],["platform.autods.com",[50,51]],["kcra.com",52],["wcvb.com",52],["sportdeutschland.tv",52],["citibank.com.sg",54],["uol.com.br",[55,56,57,58,59]],["gazzetta.gr",60],["digicol.dpm.org.cn",[61,62]],["virginmediatelevision.ie",64],["larazon.es",[65,66]],["waitrosecellar.com",[67,68,69]],["kicker.de",[70,385]],["sharpen-free-design-generator.netlify.app",[71,72]],["help.cashctrl.com",[73,74]],["gry-online.pl",75],["vidaextra.com",76],["commande.rhinov.pro",[77,78]],["ecom.wixapps.net",[77,78]],["tipranks.com",[79,80]],["iceland.co.uk",[81,82,83]],["socket.pearsoned.com",84],["tntdrama.com",[85,86]],["trutv.com",[85,86]],["mobile.de",[87,88]],["ioe.vn",[89,90]],["geiriadur.ac.uk",[89,93]],["welsh-dictionary.ac.uk",[89,93]],["bikeportland.org",[91,92]],["biologianet.com",[56,57,58]],["10.com.au",[94,95]],["10play.com.au",[94,95]],["sunshine-live.de",[96,97]],["whatismyip.com",[98,99]],["myfitnesspal.com",100],["netoff.co.jp",[101,102]],["bluerabbitrx.com",[101,102]],["foundit.*",[103,104]],["clickjogos.com.br",105],["bristan.com",[106,107]],["share.hntv.tv",[109,110,111,112]],["forum.dji.com",[109,112]],["unionpayintl.com",[109,111]],["streamelements.com",109],["optimum.net",[113,114]],["hdfcfund.com",115],["user.guancha.cn",[116,117]],["sosovalue.com",118],["bandyforbundet.no",[119,120]],["tatacommunications.com",121],["kb.arlo.com",[121,153]],["suamusica.com.br",[122,123,124]],["macrotrends.net",[125,126]],["code.world",127],["smartcharts.net",127],["topgear.com",128],["eservice.directauto.com",[129,130]],["nbcsports.com",131],["standard.co.uk",132],["pruefernavi.de",[133,134]],["speedtest.net",[135,136]],["17track.net",137],["visible.com",138],["hagerty.com",[139,140]],["marketplace.nvidia.com",141],["kino.de",[142,143]],["9now.nine.com.au",144],["worldstar.com",145],["prisjakt.no",146],["developer.arm.com",[148,149]],["sterkinekor.com",150],["iogames.space",151],["id.condenast.com",152],["tires.costco.com",154],["livemint.com",[155,156]],["m.youtube.com",[157,158,159,160]],["music.youtube.com",[157,158,159,160]],["tv.youtube.com",[157,158,159,160]],["www.youtube.com",[157,158,159,160]],["youtubekids.com",[157,158,159,160]],["youtube-nocookie.com",[157,158,159,160]],["eu-proxy.startpage.com",[157,158,160]],["timesofindia.indiatimes.com",161],["economictimes.indiatimes.com",162],["motherless.com",163],["sueddeutsche.de",164],["watchanimesub.net",165],["wcoanimesub.tv",165],["wcoforever.net",165],["freeviewmovies.com",165],["filehorse.com",165],["guidetnt.com",165],["starmusiq.*",165],["sp-today.com",165],["linkvertise.com",165],["eropaste.net",165],["getpaste.link",165],["sharetext.me",165],["wcofun.*",165],["note.sieuthuthuat.com",165],["gadgets.es",[165,452]],["amateurporn.co",[165,254]],["wiwo.de",166],["primewire.*",167],["alphaporno.com",[167,534]],["porngem.com",167],["shortit.pw",[167,240]],["familyporn.tv",167],["sbplay.*",167],["id45.cyou",167],["85po.com",[167,225]],["milfnut.*",167],["k1nk.co",167],["watchasians.cc",167],["sankakucomplex.com",168],["player.glomex.com",169],["merkur.de",169],["tz.de",169],["sxyprn.*",170],["hqq.*",[171,172]],["waaw.*",[172,173]],["hotpornfile.org",172],["x69.ovh",172],["younetu.*",172],["multiup.us",172],["peliculas8k.com",[172,173]],["czxxx.org",172],["vtplayer.online",172],["vvtplayer.*",172],["netu.ac",172],["netu.frembed.lol",172],["123link.*",174],["adshort.*",174],["mitly.us",174],["linkrex.net",174],["linx.cc",174],["oke.io",174],["linkshorts.*",174],["dz4link.com",174],["adsrt.*",174],["linclik.com",174],["shrt10.com",174],["vinaurl.*",174],["loptelink.com",174],["adfloz.*",174],["cut-fly.com",174],["linkfinal.com",174],["payskip.org",174],["cutpaid.com",174],["linkjust.com",174],["leechpremium.link",174],["icutlink.com",[174,259]],["oncehelp.com",174],["rgl.vn",174],["reqlinks.net",174],["bitlk.com",174],["qlinks.eu",174],["link.3dmili.com",174],["short-fly.com",174],["foxseotools.com",174],["dutchycorp.*",174],["shortearn.*",174],["pingit.*",174],["link.turkdown.com",174],["7r6.com",174],["oko.sh",174],["ckk.ai",174],["fc.lc",174],["fstore.biz",174],["shrink.*",174],["cuts-url.com",174],["eio.io",174],["exe.app",174],["exee.io",174],["exey.io",174],["skincarie.com",174],["exeo.app",174],["tmearn.*",174],["coinlyhub.com",[174,323]],["adsafelink.com",174],["aii.sh",174],["megalink.*",174],["cybertechng.com",[174,338]],["cutdl.xyz",174],["iir.ai",174],["shorteet.com",[174,356]],["miniurl.*",174],["smoner.com",174],["gplinks.*",174],["odisha-remix.com",[174,338]],["xpshort.com",[174,338]],["upshrink.com",174],["clk.*",174],["easysky.in",174],["veganab.co",174],["golink.bloggerishyt.in",174],["birdurls.com",174],["vipurl.in",174],["jameeltips.us",174],["promo-visits.site",174],["satoshi-win.xyz",[174,372]],["shorterall.com",174],["encurtandourl.com",174],["forextrader.site",174],["postazap.com",174],["cety.app",174],["exego.app",[174,367]],["cutlink.net",174],["cutyurls.com",174],["cutty.app",174],["cutnet.net",174],["jixo.online",174],["tinys.click",[174,338]],["cpm.icu",174],["panyshort.link",174],["enagato.com",174],["pandaznetwork.com",174],["tpi.li",174],["oii.la",174],["recipestutorials.com",174],["shrinke.*",174],["shrinkme.*",174],["shrinkforearn.in",174],["oii.io",174],["du-link.in",174],["atglinks.com",174],["thotpacks.xyz",174],["megaurl.in",174],["megafly.in",174],["simana.online",174],["fooak.com",174],["joktop.com",174],["evernia.site",174],["falpus.com",174],["link.paid4link.com",174],["exalink.fun",174],["shortxlinks.com",174],["upfion.com",174],["upfiles.app",174],["upfiles-urls.com",174],["flycutlink.com",[174,338]],["linksly.co",174],["link1s.*",174],["pkr.pw",174],["imagenesderopaparaperros.com",174],["shortenbuddy.com",174],["apksvip.com",174],["4cash.me",174],["namaidani.com",174],["shortzzy.*",174],["teknomuda.com",174],["shorttey.*",[174,322]],["miuiku.com",174],["savelink.site",174],["lite-link.*",174],["adcorto.*",174],["samaa-pro.com",174],["miklpro.com",174],["modapk.link",174],["ccurl.net",174],["linkpoi.me",174],["pewgame.com",174],["haonguyen.top",174],["zshort.*",174],["crazyblog.in",174],["cutearn.net",174],["rshrt.com",174],["filezipa.com",174],["dz-linkk.com",174],["upfiles.*",174],["theblissempire.com",174],["finanzas-vida.com",174],["adurly.cc",174],["paid4.link",174],["link.asiaon.top",174],["go.gets4link.com",174],["linkfly.*",174],["beingtek.com",174],["shorturl.unityassets4free.com",174],["disheye.com",174],["techymedies.com",174],["techysuccess.com",174],["za.gl",[174,274]],["bblink.com",174],["myad.biz",174],["swzz.xyz",174],["vevioz.com",174],["charexempire.com",174],["clk.asia",174],["sturls.com",174],["myshrinker.com",174],["snowurl.com",[174,338]],["wplink.*",174],["rocklink.in",174],["techgeek.digital",174],["download3s.net",174],["shortx.net",174],["tlin.me",174],["bestcash2020.com",174],["adslink.pw",174],["novelssites.com",174],["faucetcrypto.net",174],["trxking.xyz",174],["weadown.com",174],["m.bloggingguidance.com",174],["link.codevn.net",174],["link4rev.site",174],["c2g.at",174],["bitcosite.com",[174,548]],["cryptosh.pro",174],["windowslite.net",[174,338]],["viewfr.com",174],["cl1ca.com",174],["4br.me",174],["fir3.net",174],["seulink.*",174],["encurtalink.*",174],["kiddyshort.com",174],["watchmygf.me",[175,199]],["camwhores.*",[175,185,224,225,226]],["camwhorez.tv",[175,185,224,225]],["cambay.tv",[175,206,224,251,253,254,255,256]],["fpo.xxx",[175,206]],["sexemix.com",175],["heavyfetish.com",[175,719]],["thotcity.su",175],["viralxxxporn.com",[175,389]],["tube8.*",[176,177]],["you-porn.com",177],["youporn.*",177],["youporngay.com",177],["youpornru.com",177],["redtube.*",177],["9908ww.com",177],["adelaidepawnbroker.com",177],["bztube.com",177],["hotovs.com",177],["insuredhome.org",177],["nudegista.com",177],["pornluck.com",177],["vidd.se",177],["pornhub.*",[177,311]],["pornhub.com",177],["pornerbros.com",178],["freep.com",178],["porn.com",179],["tune.pk",180],["noticias.gospelmais.com.br",181],["techperiod.com",181],["viki.com",[182,183]],["watch-series.*",184],["watchseries.*",184],["vev.*",184],["vidop.*",184],["vidup.*",184],["sleazyneasy.com",[185,186,187]],["smutr.com",[185,319]],["tktube.com",185],["yourporngod.com",[185,186]],["javbangers.com",[185,442]],["camfox.com",185],["camthots.tv",[185,251]],["shegotass.info",185],["amateur8.com",185],["bigtitslust.com",185],["ebony8.com",185],["freeporn8.com",185],["lesbian8.com",185],["maturetubehere.com",185],["sortporn.com",185],["motherporno.com",[185,186,206,253]],["theporngod.com",[185,186]],["watchdirty.to",[185,225,226,254]],["pornsocket.com",188],["luxuretv.com",189],["porndig.com",[190,191]],["webcheats.com.br",192],["ceesty.com",[193,194]],["gestyy.com",[193,194]],["corneey.com",194],["destyy.com",194],["festyy.com",194],["sh.st",194],["mitaku.net",194],["angrybirdsnest.com",195],["zrozz.com",195],["clix4btc.com",195],["4tests.com",195],["goltelevision.com",195],["news-und-nachrichten.de",195],["laradiobbs.net",195],["urlaubspartner.net",195],["produktion.de",195],["cinemaxxl.de",195],["bladesalvador.com",195],["tempr.email",195],["cshort.org",195],["friendproject.net",195],["covrhub.com",195],["katfile.com",[195,614]],["trust.zone",195],["business-standard.com",195],["planetsuzy.org",196],["empflix.com",197],["xmovies8.*",198],["masteranime.tv",198],["0123movies.*",198],["gostream.*",198],["gomovies.*",198],["transparentcalifornia.com",199],["deepbrid.com",200],["webnovel.com",201],["streamwish.*",[202,203]],["oneupload.to",203],["wishfast.top",203],["rubystm.com",203],["rubyvid.com",203],["rubyvidhub.com",203],["stmruby.com",203],["streamruby.com",203],["schwaebische.de",204],["8tracks.com",205],["3movs.com",206],["bravoerotica.net",[206,253]],["youx.xxx",206],["camclips.tv",[206,319]],["xtits.*",[206,253]],["camflow.tv",[206,253,254,292,389]],["camhoes.tv",[206,251,253,254,292,389]],["xmegadrive.com",206],["xxxymovies.com",206],["xxxshake.com",206],["gayck.com",206],["xhand.com",[206,253]],["analdin.com",[206,253]],["revealname.com",207],["golfchannel.com",208],["stream.nbcsports.com",208],["mathdf.com",208],["gamcore.com",209],["porcore.com",209],["porngames.tv",209],["69games.xxx",209],["javmix.app",209],["haaretz.co.il",210],["haaretz.com",210],["hungama.com",210],["a-o.ninja",210],["anime-odcinki.pl",210],["shortgoo.blogspot.com",210],["tonanmedia.my.id",[210,568]],["yurasu.xyz",210],["isekaipalace.com",210],["plyjam.*",[211,212]],["ennovelas.com",[212,216]],["foxsports.com.au",213],["canberratimes.com.au",213],["thesimsresource.com",214],["fxporn69.*",215],["vipbox.*",216],["viprow.*",216],["ctrl.blog",217],["sportlife.es",218],["finofilipino.org",219],["desbloqueador.*",220],["xberuang.*",221],["teknorizen.*",221],["mysflink.blogspot.com",221],["ashemaletube.*",222],["paktech2.com",222],["assia.tv",223],["assia4.com",223],["cwtvembeds.com",[225,252]],["camlovers.tv",225],["porntn.com",225],["pornissimo.org",225],["sexcams-24.com",[225,254]],["watchporn.to",[225,254]],["camwhorez.video",225],["footstockings.com",[225,226,254]],["xmateur.com",[225,226,254]],["multi.xxx",226],["weatherx.co.in",[227,228]],["sunbtc.space",227],["subtorrents.*",229],["subtorrents1.*",229],["newpelis.*",229],["pelix.*",229],["allcalidad.*",229],["infomaniakos.*",229],["ojogos.com.br",230],["powforums.com",231],["supforums.com",231],["studybullet.com",231],["usgamer.net",232],["recordonline.com",232],["freebitcoin.win",233],["e-monsite.com",233],["coindice.win",233],["freiepresse.de",234],["investing.com",235],["tornadomovies.*",236],["mp3fiber.com",237],["chicoer.com",238],["dailybreeze.com",238],["dailybulletin.com",238],["dailynews.com",238],["delcotimes.com",238],["eastbaytimes.com",238],["macombdaily.com",238],["ocregister.com",238],["pasadenastarnews.com",238],["pe.com",238],["presstelegram.com",238],["redlandsdailyfacts.com",238],["reviewjournal.com",238],["santacruzsentinel.com",238],["saratogian.com",238],["sentinelandenterprise.com",238],["sgvtribune.com",238],["tampabay.com",238],["times-standard.com",238],["theoaklandpress.com",238],["trentonian.com",238],["twincities.com",238],["whittierdailynews.com",238],["bostonherald.com",238],["dailycamera.com",238],["sbsun.com",238],["dailydemocrat.com",238],["montereyherald.com",238],["orovillemr.com",238],["record-bee.com",238],["redbluffdailynews.com",238],["reporterherald.com",238],["thereporter.com",238],["timescall.com",238],["timesheraldonline.com",238],["ukiahdailyjournal.com",238],["dailylocal.com",238],["mercurynews.com",238],["suedkurier.de",239],["anysex.com",241],["icdrama.*",242],["mangasail.*",242],["pornve.com",243],["file4go.*",244],["coolrom.com.au",244],["marie-claire.es",245],["gamezhero.com",245],["flashgirlgames.com",245],["onlinesudoku.games",245],["mpg.football",245],["sssam.com",245],["globalnews.ca",246],["drinksmixer.com",247],["leitesculinaria.com",247],["fupa.net",248],["browardpalmbeach.com",249],["dallasobserver.com",249],["houstonpress.com",249],["miaminewtimes.com",249],["phoenixnewtimes.com",249],["westword.com",249],["nowtv.com.tr",250],["caminspector.net",251],["camwhoreshd.com",251],["camgoddess.tv",251],["gay4porn.com",253],["mypornhere.com",253],["mangovideo.*",254],["love4porn.com",254],["thotvids.com",254],["watchmdh.to",254],["celebwhore.com",254],["cluset.com",254],["sexlist.tv",254],["4kporn.xxx",254],["xhomealone.com",254],["lusttaboo.com",[254,512]],["hentai-moon.com",254],["camhub.cc",[254,673]],["mediapason.it",257],["linkspaid.com",257],["tuotromedico.com",257],["neoteo.com",257],["phoneswiki.com",257],["celebmix.com",257],["myneobuxportal.com",257],["oyungibi.com",257],["25yearslatersite.com",257],["jeshoots.com",258],["techhx.com",258],["karanapk.com",258],["flashplayer.fullstacks.net",260],["cloudapps.herokuapp.com",260],["youfiles.herokuapp.com",260],["texteditor.nsspot.net",260],["temp-mail.org",261],["asianclub.*",262],["javhdporn.net",262],["vidmoly.to",263],["comnuan.com",264],["veedi.com",265],["battleboats.io",265],["anitube.*",266],["fruitlab.com",266],["haddoz.net",266],["streamingcommunity.*",266],["garoetpos.com",266],["stiletv.it",267],["mixdrop.*",268],["hqtv.biz",269],["liveuamap.com",270],["audycje.tokfm.pl",271],["shush.se",272],["allkpop.com",273],["empire-anime.*",[274,563,564,565,566,567]],["empire-streaming.*",[274,563,564,565]],["empire-anime.com",[274,563,564,565]],["empire-streamz.fr",[274,563,564,565]],["empire-stream.*",[274,563,564,565]],["pickcrackpasswords.blogspot.com",275],["kfrfansub.com",276],["thuglink.com",276],["voipreview.org",276],["illicoporno.com",277],["lavoixdux.com",277],["tonpornodujour.com",277],["jacquieetmichel.net",277],["swame.com",277],["vosfemmes.com",277],["voyeurfrance.net",277],["jacquieetmicheltv.net",[277,621,622]],["pogo.com",278],["cloudvideo.tv",279],["legionjuegos.org",280],["legionpeliculas.org",280],["legionprogramas.org",280],["16honeys.com",281],["elespanol.com",282],["remodelista.com",283],["audiofanzine.com",287],["uploadev.*",288],["developerinsider.co",289],["thehindu.com",290],["cambro.tv",[291,292]],["boobsradar.com",[292,389,690]],["nibelungen-kurier.de",293],["adfoc.us",294],["tea-coffee.net",294],["spatsify.com",294],["newedutopics.com",294],["getviralreach.in",294],["edukaroo.com",294],["funkeypagali.com",294],["careersides.com",294],["nayisahara.com",294],["wikifilmia.com",294],["infinityskull.com",294],["viewmyknowledge.com",294],["iisfvirtual.in",294],["starxinvestor.com",294],["jkssbalerts.com",294],["sahlmarketing.net",294],["filmypoints.in",294],["fitnessholic.net",294],["moderngyan.com",294],["sattakingcharts.in",294],["bankshiksha.in",294],["earn.mpscstudyhub.com",294],["earn.quotesopia.com",294],["money.quotesopia.com",294],["best-mobilegames.com",294],["learn.moderngyan.com",294],["bharatsarkarijobalert.com",294],["quotesopia.com",294],["creditsgoal.com",294],["bgmi32bitapk.in",294],["techacode.com",294],["trickms.com",294],["ielts-isa.edu.vn",294],["loan.punjabworks.com",294],["vi-music.app",294],["instanders.app",294],["rokni.xyz",294],["keedabankingnews.com",294],["sptfy.be",294],["mcafee-com.com",[294,367]],["pianetamountainbike.it",295],["barchart.com",296],["modelisme.com",297],["parasportontario.ca",297],["prescottenews.com",297],["nrj-play.fr",298],["hackingwithreact.com",299],["gutekueche.at",300],["peekvids.com",301],["playvids.com",301],["pornflip.com",301],["redensarten-index.de",302],["vw-page.com",303],["viz.com",[304,305]],["0rechner.de",306],["configspc.com",307],["xopenload.me",307],["uptobox.com",307],["uptostream.com",307],["japgay.com",308],["mega-debrid.eu",309],["dreamdth.com",310],["diaridegirona.cat",312],["diariodeibiza.es",312],["diariodemallorca.es",312],["diarioinformacion.com",312],["eldia.es",312],["emporda.info",312],["farodevigo.es",312],["laopinioncoruna.es",312],["laopiniondemalaga.es",312],["laopiniondemurcia.es",312],["laopiniondezamora.es",312],["laprovincia.es",312],["levante-emv.com",312],["mallorcazeitung.es",312],["regio7.cat",312],["superdeporte.es",312],["playpaste.com",313],["cnbc.com",314],["primevideo.com",315],["read.amazon.*",[315,701]],["firefaucet.win",316],["74k.io",[317,318]],["cloudwish.xyz",318],["gradehgplus.com",318],["javindo.site",318],["javindosub.site",318],["kamehaus.net",318],["movearnpre.com",318],["trailerhg.xyz",318],["turboplayers.xyz",318],["arabshentai.com>>",318],["javdo.cc>>",318],["javenglish.cc>>",318],["javhd.*>>",318],["javhdz.*>>",318],["roshy.tv>>",318],["sextb.net>>",318],["fullhdxxx.com",320],["pornclassic.tube",321],["tubepornclassic.com",321],["etonline.com",322],["creatur.io",322],["lookcam.*",322],["drphil.com",322],["urbanmilwaukee.com",322],["ontiva.com",322],["hideandseek.world",322],["myabandonware.com",322],["kendam.com",322],["wttw.com",322],["synonyms.com",322],["definitions.net",322],["hostmath.com",322],["camvideoshub.com",322],["minhaconexao.com.br",322],["home-made-videos.com",324],["amateur-couples.com",324],["slutdump.com",324],["dpstream.*",325],["produsat.com",326],["bluemediafiles.*",327],["12thman.com",328],["acusports.com",328],["atlantic10.com",328],["auburntigers.com",328],["baylorbears.com",328],["bceagles.com",328],["bgsufalcons.com",328],["big12sports.com",328],["bigten.org",328],["bradleybraves.com",328],["butlersports.com",328],["cmumavericks.com",328],["conferenceusa.com",328],["cyclones.com",328],["dartmouthsports.com",328],["daytonflyers.com",328],["dbupatriots.com",328],["dbusports.com",328],["denverpioneers.com",328],["fduknights.com",328],["fgcuathletics.com",328],["fightinghawks.com",328],["fightingillini.com",328],["floridagators.com",328],["friars.com",328],["friscofighters.com",328],["gamecocksonline.com",328],["goarmywestpoint.com",328],["gobison.com",328],["goblueraiders.com",328],["gobobcats.com",328],["gocards.com",328],["gocreighton.com",328],["godeacs.com",328],["goexplorers.com",328],["goetbutigers.com",328],["gofrogs.com",328],["gogriffs.com",328],["gogriz.com",328],["golobos.com",328],["gomarquette.com",328],["gopack.com",328],["gophersports.com",328],["goprincetontigers.com",328],["gopsusports.com",328],["goracers.com",328],["goshockers.com",328],["goterriers.com",328],["gotigersgo.com",328],["gousfbulls.com",328],["govandals.com",328],["gowyo.com",328],["goxavier.com",328],["gozags.com",328],["gozips.com",328],["griffinathletics.com",328],["guhoyas.com",328],["gwusports.com",328],["hailstate.com",328],["hamptonpirates.com",328],["hawaiiathletics.com",328],["hokiesports.com",328],["huskers.com",328],["icgaels.com",328],["iuhoosiers.com",328],["jsugamecocksports.com",328],["longbeachstate.com",328],["loyolaramblers.com",328],["lrtrojans.com",328],["lsusports.net",328],["morrisvillemustangs.com",328],["msuspartans.com",328],["muleriderathletics.com",328],["mutigers.com",328],["navysports.com",328],["nevadawolfpack.com",328],["niuhuskies.com",328],["nkunorse.com",328],["nuhuskies.com",328],["nusports.com",328],["okstate.com",328],["olemisssports.com",328],["omavs.com",328],["ovcsports.com",328],["owlsports.com",328],["purduesports.com",328],["redstormsports.com",328],["richmondspiders.com",328],["sfajacks.com",328],["shupirates.com",328],["siusalukis.com",328],["smcgaels.com",328],["smumustangs.com",328],["soconsports.com",328],["soonersports.com",328],["themw.com",328],["tulsahurricane.com",328],["txst.com",328],["txstatebobcats.com",328],["ubbulls.com",328],["ucfknights.com",328],["ucirvinesports.com",328],["uconnhuskies.com",328],["uhcougars.com",328],["uicflames.com",328],["umterps.com",328],["uncwsports.com",328],["unipanthers.com",328],["unlvrebels.com",328],["uoflsports.com",328],["usdtoreros.com",328],["utahstateaggies.com",328],["utepathletics.com",328],["utrockets.com",328],["uvmathletics.com",328],["uwbadgers.com",328],["villanova.com",328],["wkusports.com",328],["wmubroncos.com",328],["woffordterriers.com",328],["1pack1goal.com",328],["bcuathletics.com",328],["bubraves.com",328],["goblackbears.com",328],["golightsgo.com",328],["gomcpanthers.com",328],["goutsa.com",328],["mercerbears.com",328],["pirateblue.com",328],["pirateblue.net",328],["pirateblue.org",328],["quinnipiacbobcats.com",328],["towsontigers.com",328],["tribeathletics.com",328],["tribeclub.com",328],["utepminermaniacs.com",328],["utepminers.com",328],["wkutickets.com",328],["aopathletics.org",328],["atlantichockeyonline.com",328],["bigsouthnetwork.com",328],["bigsouthsports.com",328],["chawomenshockey.com",328],["dbupatriots.org",328],["drakerelays.org",328],["ecac.org",328],["ecacsports.com",328],["emueagles.com",328],["emugameday.com",328],["gculopes.com",328],["godrakebulldog.com",328],["godrakebulldogs.com",328],["godrakebulldogs.net",328],["goeags.com",328],["goislander.com",328],["goislanders.com",328],["gojacks.com",328],["gomacsports.com",328],["gseagles.com",328],["hubison.com",328],["iowaconference.com",328],["ksuowls.com",328],["lonestarconference.org",328],["mascac.org",328],["midwestconference.org",328],["mountaineast.org",328],["niu-pack.com",328],["nulakers.ca",328],["oswegolakers.com",328],["ovcdigitalnetwork.com",328],["pacersports.com",328],["rmacsports.org",328],["rollrivers.com",328],["samfordsports.com",328],["uncpbraves.com",328],["usfdons.com",328],["wiacsports.com",328],["alaskananooks.com",328],["broncathleticfund.com",328],["cameronaggies.com",328],["columbiacougars.com",328],["etownbluejays.com",328],["gobadgers.ca",328],["golancers.ca",328],["gometrostate.com",328],["gothunderbirds.ca",328],["kentstatesports.com",328],["lehighsports.com",328],["lopers.com",328],["lycoathletics.com",328],["lycomingathletics.com",328],["maraudersports.com",328],["mauiinvitational.com",328],["msumavericks.com",328],["nauathletics.com",328],["nueagles.com",328],["nwusports.com",328],["oceanbreezenyc.org",328],["patriotathleticfund.com",328],["pittband.com",328],["principiaathletics.com",328],["roadrunnersathletics.com",328],["sidearmsocial.com",328],["snhupenmen.com",328],["stablerarena.com",328],["stoutbluedevils.com",328],["uwlathletics.com",328],["yumacs.com",328],["collegefootballplayoff.com",328],["csurams.com",328],["cubuffs.com",328],["gobearcats.com",328],["gohuskies.com",328],["mgoblue.com",328],["osubeavers.com",328],["pittsburghpanthers.com",328],["rolltide.com",328],["texassports.com",328],["thesundevils.com",328],["uclabruins.com",328],["wvuathletics.com",328],["wvusports.com",328],["arizonawildcats.com",328],["calbears.com",328],["cuse.com",328],["georgiadogs.com",328],["goducks.com",328],["goheels.com",328],["gostanford.com",328],["insidekstatesports.com",328],["insidekstatesports.info",328],["insidekstatesports.net",328],["insidekstatesports.org",328],["k-stateathletics.com",328],["k-statefootball.net",328],["k-statefootball.org",328],["k-statesports.com",328],["k-statesports.net",328],["k-statesports.org",328],["k-statewomenshoops.com",328],["k-statewomenshoops.net",328],["k-statewomenshoops.org",328],["kstateathletics.com",328],["kstatefootball.net",328],["kstatefootball.org",328],["kstatesports.com",328],["kstatewomenshoops.com",328],["kstatewomenshoops.net",328],["kstatewomenshoops.org",328],["ksuathletics.com",328],["ksusports.com",328],["scarletknights.com",328],["showdownforrelief.com",328],["syracusecrunch.com",328],["texastech.com",328],["theacc.com",328],["ukathletics.com",328],["usctrojans.com",328],["utahutes.com",328],["utsports.com",328],["wsucougars.com",328],["vidlii.com",[328,353]],["tricksplit.io",328],["fangraphs.com",329],["stern.de",330],["geo.de",330],["brigitte.de",330],["tvspielfilm.de",[331,332,333,334]],["tvtoday.de",[331,332,333,334]],["chip.de",[331,332,333,334]],["focus.de",[331,332,333,334]],["fitforfun.de",[331,332,333,334]],["n-tv.de",335],["player.rtl2.de",336],["planetaminecraft.com",337],["cravesandflames.com",338],["codesnse.com",338],["flyad.vip",338],["lapresse.ca",339],["kolyoom.com",340],["ilovephd.com",340],["negumo.com",341],["games.wkb.jp",[342,343]],["kenshi.fandom.com",345],["hausbau-forum.de",346],["homeairquality.org",346],["faucettronn.click",346],["fake-it.ws",347],["laksa19.github.io",348],["1shortlink.com",349],["u-s-news.com",350],["luscious.net",351],["makemoneywithurl.com",352],["junkyponk.com",352],["healthfirstweb.com",352],["vocalley.com",352],["yogablogfit.com",352],["howifx.com",[352,533]],["en.financerites.com",352],["mythvista.com",352],["livenewsflix.com",352],["cureclues.com",352],["apekite.com",352],["enit.in",352],["iammagnus.com",353],["dailyvideoreports.net",353],["unityassets4free.com",353],["docer.*",354],["resetoff.pl",354],["sexodi.com",354],["cdn77.org",355],["momxxxsex.com",356],["penisbuyutucum.net",356],["ujszo.com",357],["newsmax.com",358],["nadidetarifler.com",359],["siz.tv",359],["suzylu.co.uk",[360,361]],["onworks.net",362],["yabiladi.com",362],["downloadsoft.net",363],["newsobserver.com",364],["arkadiumhosted.com",364],["testlanguages.com",365],["newsinlevels.com",365],["videosinlevels.com",365],["catcare.store",366],["starkroboticsfrc.com",367],["sinonimos.de",367],["antonimos.de",367],["quesignifi.ca",367],["tiktokrealtime.com",367],["tiktokcounter.net",367],["tpayr.xyz",367],["poqzn.xyz",367],["ashrfd.xyz",367],["rezsx.xyz",367],["tryzt.xyz",367],["ashrff.xyz",367],["rezst.xyz",367],["dawenet.com",367],["erzar.xyz",367],["waezm.xyz",367],["waezg.xyz",367],["blackwoodacademy.org",367],["cryptednews.space",367],["vivuq.com",367],["swgop.com",367],["vbnmll.com",367],["telcoinfo.online",367],["dshytb.com",367],["btcbitco.in",[367,371]],["btcsatoshi.net",367],["cempakajaya.com",367],["crypto4yu.com",367],["readbitcoin.org",367],["wiour.com",367],["finish.addurl.biz",367],["aiimgvlog.fun",[367,374]],["laweducationinfo.com",367],["savemoneyinfo.com",367],["worldaffairinfo.com",367],["godstoryinfo.com",367],["successstoryinfo.com",367],["cxissuegk.com",367],["learnmarketinfo.com",367],["bhugolinfo.com",367],["armypowerinfo.com",367],["rsgamer.app",367],["phonereviewinfo.com",367],["makeincomeinfo.com",367],["gknutshell.com",367],["vichitrainfo.com",367],["workproductivityinfo.com",367],["dopomininfo.com",367],["hostingdetailer.com",367],["fitnesssguide.com",367],["tradingfact4u.com",367],["cryptofactss.com",367],["softwaredetail.com",367],["artoffocas.com",367],["insurancesfact.com",367],["travellingdetail.com",367],["advertisingexcel.com",367],["allcryptoz.net",367],["batmanfactor.com",367],["beautifulfashionnailart.com",367],["crewbase.net",367],["documentaryplanet.xyz",367],["crewus.net",367],["gametechreviewer.com",367],["midebalonu.net",367],["misterio.ro",367],["phineypet.com",367],["seory.xyz",367],["shinbhu.net",367],["shinchu.net",367],["substitutefor.com",367],["talkforfitness.com",367],["thefitbrit.co.uk",367],["thumb8.net",367],["thumb9.net",367],["topcryptoz.net",367],["uniqueten.net",367],["ultraten.net",367],["exactpay.online",367],["quins.us",367],["kiddyearner.com",367],["imagereviser.com",368],["tech.pubghighdamage.com",369],["jiocinema.com",369],["rapid-cloud.co",369],["uploadmall.com",369],["4funbox.com",370],["nephobox.com",370],["1024tera.com",370],["terabox.*",370],["blog24.me",371],["bildirim.*",373],["arahdrive.com",374],["appsbull.com",375],["diudemy.com",375],["maqal360.com",[375,376,377]],["lifesurance.info",378],["akcartoons.in",379],["cybercityhelp.in",379],["dl.apkmoddone.com",380],["phongroblox.com",380],["fuckingfast.net",381],["buzzheavier.com",381],["tickhosting.com",382],["in91vip.win",383],["datavaults.co",384],["t-online.de",386],["upornia.*",[387,388]],["bobs-tube.com",389],["pornohirsch.net",390],["bembed.net",391],["embedv.net",391],["javguard.club",391],["listeamed.net",391],["v6embed.xyz",391],["vembed.*",391],["vid-guard.com",391],["vinomo.xyz",391],["nekolink.site",[392,393]],["aagmaal.com",394],["camcam.cc",394],["netfapx.com",394],["javdragon.org",394],["javneon.tv",394],["javsaga.ninja",394],["pixsera.net",395],["jnews5.com",396],["pc-builds.com",397],["reuters.com",397],["today.com",397],["videogamer.com",397],["wrestlinginc.com",397],["usatoday.com",398],["ydr.com",398],["247sports.com",399],["indiatimes.com",400],["netzwelt.de",401],["filmibeat.com",402],["goodreturns.in",402],["mykhel.com",402],["luckydice.net",402],["adarima.org",402],["weatherwx.com",402],["sattaguess.com",402],["winshell.de",402],["rosasidan.ws",402],["upiapi.in",402],["daemonanime.net",402],["networkhint.com",402],["thichcode.net",402],["texturecan.com",402],["tikmate.app",[402,604]],["arcaxbydz.id",402],["quotesshine.com",402],["arcade.buzzrtv.com",403],["arcade.dailygazette.com",403],["arcade.lemonde.fr",403],["arena.gamesforthebrain.com",403],["bestpuzzlesandgames.com",403],["cointiply.arkadiumarena.com",403],["gamelab.com",403],["games.abqjournal.com",403],["games.amny.com",403],["games.bellinghamherald.com",403],["games.besthealthmag.ca",403],["games.bnd.com",403],["games.boston.com",403],["games.bostonglobe.com",403],["games.bradenton.com",403],["games.centredaily.com",403],["games.charlottegames.cnhinews.com",403],["games.crosswordgiant.com",403],["games.dailymail.co.uk",403],["games.dallasnews.com",403],["games.daytondailynews.com",403],["games.denverpost.com",403],["games.everythingzoomer.com",403],["games.fresnobee.com",403],["games.gameshownetwork.com",403],["games.get.tv",403],["games.greatergood.com",403],["games.heraldonline.com",403],["games.heraldsun.com",403],["games.idahostatesman.com",403],["games.insp.com",403],["games.islandpacket.com",403],["games.journal-news.com",403],["games.kansas.com",403],["games.kansascity.com",403],["games.kentucky.com",403],["games.lancasteronline.com",403],["games.ledger-enquirer.com",403],["games.macon.com",403],["games.mashable.com",403],["games.mercedsunstar.com",403],["games.metro.us",403],["games.metv.com",403],["games.miamiherald.com",403],["games.modbee.com",403],["games.moviestvnetwork.com",403],["games.myrtlebeachonline.com",403],["games.games.newsgames.parade.com",403],["games.pressdemocrat.com",403],["games.puzzlebaron.com",403],["games.puzzler.com",403],["games.puzzles.ca",403],["games.qns.com",403],["games.readersdigest.ca",403],["games.sacbee.com",403],["games.sanluisobispo.com",403],["games.sixtyandme.com",403],["games.sltrib.com",403],["games.springfieldnewssun.com",403],["games.star-telegram.com",403],["games.startribune.com",403],["games.sunherald.com",403],["games.theadvocate.com",403],["games.thenewstribune.com",403],["games.theolympian.com",403],["games.theportugalnews.com",403],["games.thestar.com",403],["games.thestate.com",403],["games.tri-cityherald.com",403],["games.triviatoday.com",403],["games.usnews.com",403],["games.word.tips",403],["games.wordgenius.com",403],["games.wtop.com",403],["jeux.meteocity.com",403],["juegos.as.com",403],["juegos.elnuevoherald.com",403],["juegos.elpais.com",403],["philly.arkadiumarena.com",403],["play.dictionary.com",403],["puzzles.bestforpuzzles.com",403],["puzzles.centralmaine.com",403],["puzzles.crosswordsolver.org",403],["puzzles.independent.co.uk",403],["puzzles.nola.com",403],["puzzles.pressherald.com",403],["puzzles.standard.co.uk",403],["puzzles.sunjournal.com",403],["arkadium.com",404],["abysscdn.com",[405,406]],["arcai.com",407],["my-code4you.blogspot.com",408],["flickr.com",409],["firefile.cc",410],["pestleanalysis.com",410],["kochamjp.pl",410],["tutorialforlinux.com",410],["whatsaero.com",410],["animeblkom.net",[410,424]],["blkom.com",410],["globes.co.il",[411,412]],["jardiner-malin.fr",413],["tw-calc.net",414],["ohmybrush.com",415],["talkceltic.net",416],["mentalfloss.com",417],["uprafa.com",418],["cube365.net",419],["wwwfotografgotlin.blogspot.com",420],["freelistenonline.com",420],["badassdownloader.com",421],["quickporn.net",422],["yellowbridge.com",423],["aosmark.com",425],["ctrlv.*",426],["atozmath.com",[427,428,429,430,431,432,433]],["newyorker.com",434],["brighteon.com",435],["more.tv",436],["video1tube.com",437],["alohatube.xyz",437],["4players.de",438],["onlinesoccermanager.com",438],["fshost.me",439],["link.cgtips.org",440],["hentaicloud.com",441],["paperzonevn.com",443],["9jarock.org",444],["fzmovies.info",444],["fztvseries.ng",444],["netnaijas.com",444],["hentaienglish.com",445],["hentaiporno.xxx",445],["venge.io",[446,447]],["btcbux.io",448],["its.porn",[449,450]],["atv.at",451],["2ndrun.tv",452],["rackusreads.com",452],["teachmemicro.com",452],["willcycle.com",452],["kusonime.com",[453,454]],["123movieshd.*",455],["imgur.com",[456,457,720]],["hentai-party.com",458],["hentaicomics.pro",458],["uproxy.*",459],["animesa.*",460],["subtitle.one",461],["subtitleone.cc",461],["mysexgames.com",462],["ancient-origins.*",463],["cinecalidad.*",[464,465]],["xnxx.com",466],["xvideos.*",466],["gdr-online.com",467],["mmm.dk",468],["iqiyi.com",[469,470,596]],["m.iqiyi.com",471],["nbcolympics.com",472],["apkhex.com",473],["indiansexstories2.net",474],["issstories.xyz",474],["1340kbbr.com",475],["gorgeradio.com",475],["kduk.com",475],["kedoam.com",475],["kejoam.com",475],["kelaam.com",475],["khsn1230.com",475],["kjmx.rocks",475],["kloo.com",475],["klooam.com",475],["klykradio.com",475],["kmed.com",475],["kmnt.com",475],["kool991.com",475],["kpnw.com",475],["kppk983.com",475],["krktcountry.com",475],["ktee.com",475],["kwro.com",475],["kxbxfm.com",475],["thevalley.fm",475],["quizlet.com",476],["dsocker1234.blogspot.com",477],["schoolcheats.net",[478,479]],["mgnet.xyz",480],["designtagebuch.de",481],["pixroute.com",482],["uploady.io",483],["calculator-online.net",484],["porngames.club",485],["sexgames.xxx",485],["111.90.159.132",486],["mobile-tracker-free.com",487],["pfps.gg",488],["social-unlock.com",489],["superpsx.com",490],["ninja.io",491],["sourceforge.net",492],["samfirms.com",493],["rapelust.com",494],["vtube.to",494],["desitelugusex.com",494],["dvdplay.*",494],["xvideos-downloader.net",494],["xxxvideotube.net",494],["sdefx.cloud",494],["nozomi.la",494],["banned.video",495],["madmaxworld.tv",495],["androidpolice.com",495],["babygaga.com",495],["backyardboss.net",495],["carbuzz.com",495],["cbr.com",495],["collider.com",495],["dualshockers.com",495],["footballfancast.com",495],["footballleagueworld.co.uk",495],["gamerant.com",495],["givemesport.com",495],["hardcoregamer.com",495],["hotcars.com",495],["howtogeek.com",495],["makeuseof.com",495],["moms.com",495],["movieweb.com",495],["pocket-lint.com",495],["pocketnow.com",495],["screenrant.com",495],["simpleflying.com",495],["thegamer.com",495],["therichest.com",495],["thesportster.com",495],["thethings.com",495],["thetravel.com",495],["topspeed.com",495],["xda-developers.com",495],["huffpost.com",496],["ingles.com",497],["spanishdict.com",497],["surfline.com",[498,499]],["play.tv3.ee",500],["play.tv3.lt",500],["play.tv3.lv",[500,501]],["tv3play.skaties.lv",500],["bulbagarden.net",502],["hollywoodlife.com",503],["mat6tube.com",504],["hotabis.com",505],["root-nation.com",505],["italpress.com",505],["airsoftmilsimnews.com",505],["artribune.com",505],["newtumbl.com",506],["apkmaven.*",507],["aruble.net",508],["nevcoins.club",509],["mail.com",510],["gmx.*",511],["mangakita.id",513],["avpgalaxy.net",514],["panda-novel.com",515],["lightsnovel.com",515],["eaglesnovel.com",515],["pandasnovel.com",515],["ewrc-results.com",516],["kizi.com",517],["cyberscoop.com",518],["fedscoop.com",518],["canale.live",519],["jeep-cj.com",520],["sponsorhunter.com",521],["cloudcomputingtopics.net",522],["likecs.com",523],["tiscali.it",524],["linkspy.cc",525],["adshnk.com",526],["chattanoogan.com",527],["adsy.pw",528],["playstore.pw",528],["windowspro.de",529],["tvtv.ca",530],["tvtv.us",530],["mydaddy.cc",531],["roadtrippin.fr",532],["vavada5com.com",533],["anyporn.com",[534,551]],["bravoporn.com",534],["bravoteens.com",534],["crocotube.com",534],["hellmoms.com",534],["hellporno.com",534],["sex3.com",534],["tubewolf.com",534],["xbabe.com",534],["xcum.com",534],["zedporn.com",534],["imagetotext.info",535],["infokik.com",536],["freepik.com",537],["ddwloclawek.pl",[538,539]],["www.seznam.cz",540],["deezer.com",541],["my-subs.co",542],["plaion.com",543],["slideshare.net",[544,545]],["ustreasuryyieldcurve.com",546],["businesssoftwarehere.com",547],["goo.st",547],["freevpshere.com",547],["softwaresolutionshere.com",547],["gamereactor.*",549],["madoohd.com",550],["doomovie-hd.*",550],["staige.tv",552],["androidadult.com",553],["streamvid.net",554],["watchtv24.com",555],["cellmapper.net",556],["medscape.com",557],["newscon.org",[558,559]],["wheelofgold.com",560],["drakecomic.*",560],["app.blubank.com",561],["mobileweb.bankmellat.ir",561],["chat.nrj.fr",562],["chat.tchatche.com",[562,577]],["ccthesims.com",569],["chromeready.com",569],["dtbps3games.com",569],["illustratemagazine.com",569],["uknip.co.uk",569],["vod.pl",570],["megadrive-emulator.com",571],["tvhay.*",[572,573]],["moviesapi.club",574],["bestx.stream",574],["watchx.top",574],["digimanie.cz",575],["svethardware.cz",575],["srvy.ninja",576],["cnn.com",[578,579,580]],["news.bg",581],["edmdls.com",582],["freshremix.net",582],["scenedl.org",582],["trakt.tv",583],["client.falixnodes.net",[584,585]],["shroomers.app",586],["classicalradio.com",587],["di.fm",587],["jazzradio.com",587],["radiotunes.com",587],["rockradio.com",587],["zenradio.com",587],["getthit.com",588],["techedubyte.com",589],["soccerinhd.com",589],["movie-th.tv",590],["iwanttfc.com",591],["nutraingredients-asia.com",592],["nutraingredients-latam.com",592],["nutraingredients-usa.com",592],["nutraingredients.com",592],["ozulscansen.com",593],["nexusmods.com",594],["lookmovie.*",595],["lookmovie2.to",595],["biletomat.pl",597],["hextank.io",[598,599]],["filmizlehdfilm.com",[600,601,602,603]],["filmizletv.*",[600,601,602,603]],["fullfilmizle.cc",[600,601,602,603]],["gofilmizle.net",[600,601,602,603]],["btvplus.bg",605],["sagewater.com",606],["redlion.net",606],["filmweb.pl",607],["satdl.com",608],["vidstreaming.xyz",609],["everand.com",610],["myradioonline.pl",611],["cbs.com",612],["paramountplus.com",612],["fullxh.com",613],["galleryxh.site",613],["megaxh.com",613],["movingxh.world",613],["seexh.com",613],["unlockxh4.com",613],["valuexh.life",613],["xhaccess.com",613],["xhadult2.com",613],["xhadult3.com",613],["xhadult4.com",613],["xhadult5.com",613],["xhamster.*",613],["xhamster1.*",613],["xhamster10.*",613],["xhamster11.*",613],["xhamster12.*",613],["xhamster13.*",613],["xhamster14.*",613],["xhamster15.*",613],["xhamster16.*",613],["xhamster17.*",613],["xhamster18.*",613],["xhamster19.*",613],["xhamster20.*",613],["xhamster2.*",613],["xhamster3.*",613],["xhamster4.*",613],["xhamster42.*",613],["xhamster46.com",613],["xhamster5.*",613],["xhamster7.*",613],["xhamster8.*",613],["xhamsterporno.mx",613],["xhbig.com",613],["xhbranch5.com",613],["xhchannel.com",613],["xhdate.world",613],["xhlease.world",613],["xhmoon5.com",613],["xhofficial.com",613],["xhopen.com",613],["xhplanet1.com",613],["xhplanet2.com",613],["xhreal2.com",613],["xhreal3.com",613],["xhspot.com",613],["xhtotal.com",613],["xhtree.com",613],["xhvictory.com",613],["xhwebsite.com",613],["xhwebsite2.com",613],["xhwebsite5.com",613],["xhwide1.com",613],["xhwide2.com",613],["xhwide5.com",613],["file-upload.net",615],["acortalo.*",[616,617,618,619]],["acortar.*",[616,617,618,619]],["megadescarga.net",[616,617,618,619]],["megadescargas.net",[616,617,618,619]],["hentaihaven.xxx",620],["jacquieetmicheltv2.net",622],["a2zapk.*",623],["fcportables.com",[624,625]],["emurom.net",626],["freethesaurus.com",[627,628]],["thefreedictionary.com",[627,628]],["oeffentlicher-dienst.info",629],["im9.eu",630],["dcdlplayer8a06f4.xyz",631],["ultimate-guitar.com",632],["claimbits.net",633],["sexyscope.net",634],["kickassanime.*",635],["recherche-ebook.fr",636],["virtualdinerbot.com",636],["zonebourse.com",637],["pink-sluts.net",638],["andhrafriends.com",639],["benzinpreis.de",640],["turtleviplay.xyz",641],["defenseone.com",642],["govexec.com",642],["nextgov.com",642],["route-fifty.com",642],["sharing.wtf",643],["wetter3.de",644],["esportivos.fun",645],["cosmonova-broadcast.tv",646],["538.nl",647],["hartvannederland.nl",647],["kijk.nl",647],["shownieuws.nl",647],["vandaaginside.nl",647],["rock.porn",[648,649]],["videzz.net",[650,651]],["ezaudiobookforsoul.com",652],["club386.com",653],["decompiler.com",[654,655]],["littlebigsnake.com",656],["easyfun.gg",657],["smailpro.com",658],["ilgazzettino.it",659],["ilmessaggero.it",659],["3bmeteo.com",[660,661]],["mconverter.eu",662],["lover937.net",663],["10gb.vn",664],["pes6.es",665],["tactics.tools",[666,667]],["boundhub.com",668],["alocdnnetu.xyz",669],["reliabletv.me",670],["jakondo.ru",671],["appnee.com",671],["trueachievements.com",671],["truesteamachievements.com",671],["truetrophies.com",671],["filecrypt.*",672],["wired.com",674],["spankbang.*",[675,676,677,722,723]],["hulu.com",[678,679,680]],["hanime.tv",681],["nhentai.net",[682,683,684]],["pouvideo.*",685],["povvideo.*",685],["povw1deo.*",685],["povwideo.*",685],["powv1deo.*",685],["powvibeo.*",685],["powvideo.*",685],["powvldeo.*",685],["anonymfile.com",686],["gofile.to",686],["dotycat.com",687],["rateyourmusic.com",688],["reporterpb.com.br",689],["blog-dnz.com",691],["18adultgames.com",692],["colnect.com",[693,694]],["adultgamesworld.com",695],["bgmiupdate.com.in",696],["reviewdiv.com",697],["parametric-architecture.com",698],["laurelberninteriors.com",[699,725]],["voiceofdenton.com",700],["concealednation.org",700],["askattest.com",702],["opensubtitles.com",703],["savefiles.com",704],["streamup.ws",705],["goodstream.one",706],["lecrabeinfo.net",707],["cerberusapp.com",708],["smashkarts.io",709],["beamng.wesupply.cx",710],["wowtv.de",[711,712]],["jsfiddle.net",[713,714]],["www.google.*",715],["tacobell.com",716],["zefoy.com",717],["cnet.com",718],["natgeotv.com",721],["globo.com",724],["wayfair.com",726]]);
const exceptionsMap = new Map([["cloudflare.com",[0]],["pingit.com",[174]],["loan.bgmi32bitapk.in",[294]],["lookmovie.studio",[595]]]);
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
