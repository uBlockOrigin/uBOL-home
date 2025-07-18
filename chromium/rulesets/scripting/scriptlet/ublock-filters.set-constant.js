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
const argsList = [["console.clear","undefined"],["aclib.runInPagePush","{}","as","callback"],["adBlockDetected","undefined"],["akamaiDisableServerIpLookup","noopFunc"],["DD_RUM.addAction","noopFunc"],["nads.createAd","trueFunc"],["ga","noopFunc"],["huecosPBS.nstdX","null"],["DTM.trackAsyncPV","noopFunc"],["_satellite","{}"],["_satellite.getVisitorId","noopFunc"],["newPageViewSpeedtest","noopFunc"],["pubg.unload","noopFunc"],["generateGalleryAd","noopFunc"],["mediator","noopFunc"],["Object.prototype.subscribe","noopFunc"],["gbTracker","{}"],["gbTracker.sendAutoSearchEvent","noopFunc"],["Object.prototype.vjsPlayer.ads","noopFunc"],["network_user_id",""],["google.ima.OmidVerificationVendor","{}"],["Object.prototype.omidAccessModeRules","{}"],["googletag.cmd","{}"],["_aps","{}"],["Object.prototype.setDisableFlashAds","noopFunc"],["DD_RUM.addTiming","noopFunc"],["chameleonVideo.adDisabledRequested","true"],["AdmostClient","{}"],["analytics","{}"],["datalayer","[]"],["Object.prototype.isInitialLoadDisabled","noopFunc"],["listingGoogleEETracking","noopFunc"],["dcsMultiTrack","noopFunc"],["urlStrArray","noopFunc"],["pa","{}"],["Object.prototype.setConfigurations","noopFunc"],["Object.prototype.bk_addPageCtx","noopFunc"],["Object.prototype.bk_doJSTag","noopFunc"],["passFingerPrint","noopFunc"],["optimizely","{}"],["optimizely.initialized","true"],["google_optimize","{}"],["google_optimize.get","noopFunc"],["_gsq","{}"],["_gsq.push","noopFunc"],["stmCustomEvent","noopFunc"],["_gsDevice",""],["iom","{}"],["iom.c","noopFunc"],["_conv_q","{}"],["_conv_q.push","noopFunc"],["google.ima.settings.setDisableFlashAds","noopFunc"],["pa.privacy","{}"],["populateClientData4RBA","noopFunc"],["YT.ImaManager","noopFunc"],["UOLPD","{}"],["UOLPD.dataLayer","{}"],["__configuredDFPTags","{}"],["URL_VAST_YOUTUBE","{}"],["Adman","{}"],["dplus","{}"],["dplus.track","noopFunc"],["_satellite.track","noopFunc"],["google.ima.dai","{}"],["gfkS2sExtension","{}"],["gfkS2sExtension.HTML5VODExtension","noopFunc"],["AnalyticsEventTrackingJS","{}"],["AnalyticsEventTrackingJS.addToBasket","noopFunc"],["AnalyticsEventTrackingJS.trackErrorMessage","noopFunc"],["initializeslideshow","noopFunc"],["fathom","{}"],["fathom.trackGoal","noopFunc"],["Origami","{}"],["Origami.fastclick","noopFunc"],["jad","undefined"],["hasAdblocker","true"],["Sentry","{}"],["Sentry.init","noopFunc"],["TRC","{}"],["TRC._taboolaClone","[]"],["fp","{}"],["fp.t","noopFunc"],["fp.s","noopFunc"],["initializeNewRelic","noopFunc"],["turnerAnalyticsObj","{}"],["turnerAnalyticsObj.setVideoObject4AnalyticsProperty","noopFunc"],["optimizelyDatafile","{}"],["optimizelyDatafile.featureFlags","[]"],["fingerprint","{}"],["fingerprint.getCookie","noopFunc"],["gform.utils","noopFunc"],["gform.utils.trigger","noopFunc"],["get_fingerprint","noopFunc"],["moatPrebidApi","{}"],["moatPrebidApi.getMoatTargetingForPage","noopFunc"],["cpd_configdata","{}"],["cpd_configdata.url",""],["yieldlove_cmd","{}"],["yieldlove_cmd.push","noopFunc"],["dataLayer.push","noopFunc"],["_etmc","{}"],["_etmc.push","noopFunc"],["freshpaint","{}"],["freshpaint.track","noopFunc"],["ShowRewards","noopFunc"],["stLight","{}"],["stLight.options","noopFunc"],["DD_RUM.addError","noopFunc"],["sensorsDataAnalytic201505","{}"],["sensorsDataAnalytic201505.init","noopFunc"],["sensorsDataAnalytic201505.quick","noopFunc"],["sensorsDataAnalytic201505.track","noopFunc"],["s","{}"],["s.tl","noopFunc"],["smartech","noopFunc"],["sensors","{}"],["sensors.init","noopFunc"],["sensors.track","noopFunc"],["adn","{}"],["adn.clearDivs","noopFunc"],["_vwo_code","{}"],["gtag","noopFunc"],["_taboola","{}"],["_taboola.push","noopFunc"],["clicky","{}"],["clicky.goal","noopFunc"],["WURFL","{}"],["_sp_.config.events.onSPPMObjectReady","noopFunc"],["gtm","{}"],["gtm.trackEvent","noopFunc"],["mParticle.Identity.getCurrentUser","noopFunc"],["JSGlobals.prebidEnabled","false"],["elasticApm","{}"],["elasticApm.init","noopFunc"],["Object.prototype.que","noopFunc"],["Object.prototype.que.push","noopFunc"],["ga.sendGaEvent","noopFunc"],["adobe","{}"],["MT","{}"],["MT.track","noopFunc"],["ClickOmniPartner","noopFunc"],["adex","{}"],["adex.getAdexUser","noopFunc"],["Adkit","noopFunc"],["Object.prototype.shouldExpectGoogleCMP","false"],["apntag.refresh","noopFunc"],["pa.sendEvent","noopFunc"],["Munchkin","{}"],["Munchkin.init","noopFunc"],["ttd_dom_ready","noopFunc"],["ramp","undefined"],["appInfo.snowplow.trackSelfDescribingEvent","noopFunc"],["_vwo_code.init","noopFunc"],["adobePageView","noopFunc"],["ytInitialPlayerResponse.playerAds","undefined"],["ytInitialPlayerResponse.adPlacements","undefined"],["ytInitialPlayerResponse.adSlots","undefined"],["playerResponse.adPlacements","undefined"],["nsShowMaxCount","0"],["objVc.interstitial_web",""],["_ml_ads_ns","null"],["_sp_.config","undefined"],["isAdBlockActive","false"],["AdController","noopFunc"],["console.clear","noopFunc"],["Object.prototype.hideAds","true"],["Object.prototype._getSalesHouseConfigurations","noopFunc"],["vast_urls","{}"],["sadbl","false"],["adblockcheck","false"],["arrvast","[]"],["blurred","false"],["flashvars.adv_pre_src",""],["showPopunder","false"],["page_params.holiday_promo","true"],["adsEnabled","true"],["String.prototype.charAt","trueFunc"],["ad_blocker","false"],["blockAdBlock","true"],["VikiPlayer.prototype.pingAbFactor","noopFunc"],["player.options.disableAds","true"],["console.clear","trueFunc"],["flashvars.adv_pre_vast",""],["flashvars.adv_pre_vast_alt",""],["x_width","1"],["_site_ads_ns","true"],["luxuretv.config",""],["Object.prototype.AdOverlay","noopFunc"],["tkn_popunder","null"],["can_run_ads","true"],["adsBlockerDetector","noopFunc"],["globalThis","null"],["adblock","false"],["__ads","true"],["FlixPop.isPopGloballyEnabled","falseFunc"],["check_adblock","true"],["$.magnificPopup.open","noopFunc"],["adsenseadBlock","noopFunc"],["adblockSuspected","false"],["xRds","true"],["cRAds","false"],["disasterpingu","false"],["App.views.adsView.adblock","false"],["flashvars.adv_pause_html",""],["$.fx.off","true"],["adBlockEnabled","false"],["puShown","true"],["showAds","true"],["attr","{}"],["scriptSrc",""],["cxStartDetectionProcess","noopFunc"],["isAdBlocked","false"],["adblock","noopFunc"],["path",""],["_ctrl_vt.blocked.ad_script","false"],["blockAdBlock","noopFunc"],["caca","noopFunc"],["Ok","true"],["safelink.adblock","false"],["openPopunder","noopFunc"],["ClickUnder","noopFunc"],["flashvars.adv_pre_url",""],["flashvars.protect_block",""],["flashvars.video_click_url",""],["adBlock","false"],["spoof","noopFunc"],["btoa","null"],["sp_ad","true"],["adsBlocked","false"],["_sp_.msg.displayMessage","noopFunc"],["CaptchmeState.adb","undefined"],["UhasAB","false"],["adNotificationDetected","false"],["atob","noopFunc"],["_pop","noopFunc"],["CnnXt.Event.fire","noopFunc"],["_ti_update_user","noopFunc"],["valid","1"],["vastAds","[]"],["adblock","1"],["frg","1"],["time","0"],["ads","true"],["GNCA_Ad_Support","true"],["Date.now","noopFunc"],["jQuery.adblock","1"],["VMG.Components.Adblock","false"],["adblockDetector","trueFunc"],["hasPoped","true"],["flashvars.video_click_url","undefined"],["flashvars.adv_start_html",""],["flashvars.popunder_url",""],["flashvars.adv_post_src",""],["flashvars.adv_post_url",""],["jQuery.adblock","false"],["google_jobrunner","true"],["sec","0"],["gadb","false"],["checkadBlock","noopFunc"],["clientSide.adbDetect","noopFunc"],["HTMLAnchorElement.prototype.click","noopFunc"],["cmnnrunads","true"],["adBlocker","false"],["adBlockDetected","noopFunc"],["StileApp.somecontrols.adBlockDetected","noopFunc"],["MDCore.adblock","0"],["google_tag_data","noopFunc"],["noAdBlock","true"],["adsOk","true"],["check","true"],["isal","true"],["document.hidden","true"],["awm","true"],["adblockEnabled","false"],["is_adblocked","false"],["pogo.intermission.staticAdIntermissionPeriod","0"],["SubmitDownload1","noopFunc"],["t","0"],["ckaduMobilePop","noopFunc"],["tieneAdblock","0"],["adsAreBlocked","false"],["cmgpbjs","false"],["displayAdblockOverlay","false"],["google","false"],["Math.pow","noopFunc"],["openInNewTab","noopFunc"],["runAdBlocker","false"],["Adblock","false"],["flashvars.logo_url",""],["flashvars.logo_text",""],["nlf.custom.userCapabilities","false"],["count","0"],["LoadThisScript","true"],["showPremLite","true"],["closeBlockerModal","false"],["adBlockDetector.isEnabled","falseFunc"],["areAdsDisplayed","true"],["gkAdsWerbung","true"],["pop_target","null"],["is_banner","true"],["$easyadvtblock","false"],["show_dfp_preroll","false"],["show_youtube_preroll","false"],["doads","true"],["jsUnda","noopFunc"],["AlobaidiDetectAdBlock","true"],["Advertisement","1"],["adBlockDetected","false"],["abp1","1"],["pr_okvalida","true"],["$.ajax","trueFunc"],["cnbc.canShowAds","true"],["ue_adb_chk","1"],["firefaucet","true"],["cRAds","true"],["uas","[]"],["flashvars.popunder_url","undefined"],["adv","true"],["prerollMain","undefined"],["canRunAds","true"],["Fingerprint2","true"],["dclm_ajax_var.disclaimer_redirect_url",""],["load_pop_power","noopFunc"],["adBlockDetected","true"],["Time_Start","0"],["blockAdBlock","trueFunc"],["ezstandalone.enabled","true"],["foundation.adPlayer.bitmovin","{}"],["DL8_GLOBALS.enableAdSupport","false"],["DL8_GLOBALS.useHomad","false"],["DL8_GLOBALS.enableHomadDesktop","false"],["DL8_GLOBALS.enableHomadMobile","false"],["Object.prototype.adReinsertion","noopFunc"],["getHomadConfig","noopFunc"],["ab","false"],["go_popup","{}"],["noBlocker","true"],["adsbygoogle","null"],["fabActive","false"],["gWkbAdVert","true"],["noblock","true"],["wgAffiliateEnabled","false"],["ads","null"],["detectAdblock","noopFunc"],["adsLoadable","true"],["ASSetCookieAds","null"],["letShowAds","true"],["ulp_noadb","true"],["Object.prototype.adblock_detected","false"],["timeSec","0"],["adsbygoogle.loaded","true"],["ads_unblocked","true"],["xxSetting.adBlockerDetection","false"],["open","undefined"],["Drupal.behaviors.adBlockerPopup","null"],["fake_ad","true"],["koddostu_com_adblock_yok","null"],["adsbygoogle","trueFunc"],["player.ads.cuePoints","undefined"],["adBlockDetected","null"],["better_ads_adblock","1"],["Adv_ab","false"],["sgpbCanRunAds","true"],["document.hidden","false"],["document.hasFocus","trueFunc"],["hasFocus","trueFunc"],["navigator.brave","undefined"],["Object.prototype.isAllAdClose","true"],["isRequestPresent","true"],["fouty","true"],["Notification","undefined"],["protection","noopFunc"],["private","false"],["navigator.webkitTemporaryStorage.queryUsageAndQuota","noopFunc"],["document.onkeydown","noopFunc"],["showadas","true"],["alert","throwFunc"],["aSl.gcd","0"],["window.adLink","null"],["detectedAdblock","undefined"],["isTabActive","true"],["clicked","2"],["ov.advertising.tisoomi.loadScript","noopFunc"],["abp","false"],["hommy","{}"],["hommy.waitUntil","noopFunc"],["flashvars.mlogo",""],["vpPrerollVideo","undefined"],["PlayerConfig.config.CustomAdSetting","[]"],["PlayerConfig.trusted","true"],["PlayerConfig.config.AffiliateAdViewLevel","3"],["univresalP","noopFunc"],["hold_click","false"],["tie.ad_blocker_detector","false"],["admiral","noopFunc"],["gnt.u.adfree","true"],["__INITIAL_DATA__.siteData.admiralScript"],["objAd.loadAdShield","noopFunc"],["window.myAd.runAd","noopFunc"],["detectAdBlock","noopFunc"],["__INITIAL_STATE__.config.theme.ads.isAdBlockerEnabled","false"],["__INITIAL_STATE__.gameLists.gamesNoPrerollIds.indexOf","trueFunc"],["document.ontouchend","null"],["document.onclick","null"],["pubAdsService","trueFunc"],["config.pauseInspect","false"],["appContext.adManager.context.current.adFriendly","false"],["blockAdBlock._options.baitClass","null"],["document.blocked_var","1"],["____ads_js_blocked","false"],["wIsAdBlocked","false"],["WebSite.plsDisableAdBlock","null"],["ads_blocked","false"],["samDetected","false"],["countClicks","0"],["settings.adBlockerDetection","false"],["mixpanel.get_distinct_id","true"],["fuckAdBlock._options.baitClass","null"],["bscheck.adblocker","noopFunc"],["qpcheck.ads","noopFunc"],["isContentBlocked","falseFunc"],["CloudflareApps.installs.Ik7rmQ4t95Qk.options.measureDomain","undefined"],["detectAB1","noopFunc"],["uBlockOriginDetected","false"],["googletag._vars_","{}"],["googletag._loadStarted_","true"],["googletag._loaded_","true"],["google_unique_id","1"],["google.javascript","{}"],["google.javascript.ads","{}"],["google_global_correlator","1"],["paywallGateway.truncateContent","noopFunc"],["adBlockDisabled","true"],["blockedElement","noopFunc"],["popit","false"],["adBlockerDetected","false"],["abu","falseFunc"],["countdown","0"],["decodeURI","noopFunc"],["flashvars.adv_postpause_vast",""],["xv_ad_block","0"],["openWindow","noopFunc"],["vidorev_jav_plugin_video_ads_object.vid_ads_m_video_ads",""],["adsProvider.init","noopFunc"],["SDKLoaded","true"],["blockAdBlock._creatBait","null"],["POPUNDER_ENABLED","false"],["plugins.preroll","noopFunc"],["errcode","0"],["DHAntiAdBlocker","true"],["showada","true"],["showax","true"],["p18","undefined"],["ADBLOCKED","false"],["Object.prototype.adsEnabled","false"],["adb","0"],["String.fromCharCode","trueFunc"],["adblock_use","false"],["Object.prototype.adblockFound","false"],["createCanvas","noopFunc"],["document.bridCanRunAds","true"],["playerAdSettings.adLink",""],["playerAdSettings.waitTime","0"],["xv.sda.pp.init","noopFunc"],["isAdsLoaded","true"],["adblockerAlert","noopFunc"],["Object.prototype.parseXML","noopFunc"],["Object.prototype.blackscreenDuration","1"],["Object.prototype.adPlayerId",""],["adblockDetect","noopFunc"],["style","noopFunc"],["history.pushState","noopFunc"],["google_unique_id","6"],["__NEXT_DATA__.props.pageProps.adsConfig","undefined"],["new_config.timedown","0"],["truex","{}"],["truex.client","noopFunc"],["hiddenProxyDetected","false"],["SteadyWidgetSettings.adblockActive","false"],["proclayer","noopFunc"],["timeleft","0"],["load_ads","trueFunc"],["starPop","1"],["Object.prototype.ads","noopFunc"],["detectBlockAds","noopFunc"],["ga","trueFunc"],["ad_link",""],["penciBlocksArray","[]"],["App.AdblockDetected","false"],["SF.adblock","true"],["startfrom","0"],["D4zz","noopFunc"],["Object.prototype.ads.nopreroll_","true"],["HP_Scout.adBlocked","false"],["SD_IS_BLOCKING","false"],["Object.prototype.isPremium","true"],["__BACKPLANE_API__.renderOptions.showAdBlock",""],["Object.prototype.isNoAds","{}"],["tv3Cmp.ConsentGiven","true"],["setupSkin","noopFunc"],["Object.prototype.enableInterstitial","false"],["ads","undefined"],["td_ad_background_click_link","undefined"],["POSTPART_prototype.ADKEY","noopFunc"],["adBlockDetected","falseFunc"],["divWidth","1"],["noAdBlock","noopFunc"],["AdService.info.abd","noopFunc"],["adBlockDetectionResult","undefined"],["popped","true"],["puShown1","true"],["passthetest","true"],["pandaAdviewValidate","true"],["canGetAds","true"],["ad_blocker_active","false"],["init_welcome_ad","noopFunc"],["moneyAbovePrivacyByvCDN","true"],["document.body.contains","trueFunc"],["popunder","undefined"],["distance","0"],["document.onclick",""],["adEnable","true"],["displayAds","0"],["_adshrink.skiptime","0"],["AbleToRunAds","true"],["PreRollAd.timeCounter","0"],["abpblocked","undefined"],["paAddUnit","noopFunc"],["adt","0"],["test_adblock","noopFunc"],["adblockDetector","noopFunc"],["vastEnabled","false"],["detectadsbocker","false"],["two_worker_data_js.js","[]"],["FEATURE_DISABLE_ADOBE_POPUP_BY_COUNTRY","true"],["questpassGuard","noopFunc"],["isAdBlockerEnabled","false"],["sssp","emptyObj"],["smartLoaded","true"],["timeLeft","0"],["Cookiebot","noopFunc"],["feature_flags.interstitial_ads_flag","false"],["feature_flags.interstitials_every_four_slides","false"],["waldoSlotIds","true"],["adblockstatus","false"],["adScriptLoaded","true"],["adblockEnabled","noopFunc"],["adSettings","[]"],["banner_is_blocked","false"],["Object.prototype.adBlocked","false"],["chp_adblock_browser","noopFunc"],["googleAd","true"],["Brid.A9.prototype.backfillAdUnits","[]"],["dct","0"],["slideShow.displayInterstitial","true"],["googletag","true"],["tOS2","150"],["checkAdBlocker","noopFunc"],["navigator.standalone","true"],["ShowAdvertising","{}"],["empire.pop","undefined"],["empire.direct","undefined"],["empire.directHideAds","undefined"],["empire.mediaData.advisorMovie","1"],["empire.mediaData.advisorSerie","1"],["setTimer","0"],["penci_adlbock.ad_blocker_detector","0"],["Object.prototype.adblockDetector","noopFunc"],["blext","true"],["vidorev_jav_plugin_video_ads_object","{}"],["vidorev_jav_plugin_video_ads_object_post","{}"],["S_Popup","10"],["rabLimit","-1"],["nudgeAdBlock","noopFunc"],["feedBack.showAffilaePromo","noopFunc"],["FAVE.settings.ads.ssai.prod.clips.enabled","false"],["FAVE.settings.ads.ssai.prod.liveAuth.enabled","false"],["FAVE.settings.ads.ssai.prod.liveUnauth.enabled","false"],["HTMLScriptElement.prototype.onerror","null"],["loadpagecheck","noopFunc"],["art3m1sItemNames.affiliate-wrapper","\"\""],["window.adngin","{}"],["amzn_aps_csm","{}"],["isAdBlockerActive","noopFunc"],["di.app.WebplayerApp.Ads.Adblocks.app.AdBlockDetectApp.startWithParent","false"],["sharedController.adblockDetector","noopFunc"],["checkAdsStatus","noopFunc"],["ads","[]"],["settings.adBlockDetectionEnabled","false"],["displayInterstitialAdConfig","false"],["checkAdBlockeraz","noopFunc"],["blockingAds","false"],["Yii2App.playbackTimeout","0"],["QiyiPlayerProphetData.a.data","{}"],["toggleAdBlockInfo","falseFunc"],["aipAPItag.prerollSkipped","true"],["aipAPItag.setPreRollStatus","trueFunc"],["reklam_1_saniye","0"],["reklam_1_gecsaniye","0"],["reklamsayisi","1"],["reklam_1",""],["powerAPITag","emptyObj"],["playerEnhancedConfig.run","throwFunc"],["aoAdBlockDetected","false"],["rodo.checkIsDidomiConsent","noopFunc"],["xtime","0"],["Div_popup",""],["Scribd.Blob.AdBlockerModal","noopFunc"],["AddAdsV2I.addBlock","false"],["hasAdBlocker","false"],["initials.yld-pdpopunder",""],["download_click","true"],["advertisement3","true"],["clicked","true"],["eClicked","true"],["number","0"],["sync","true"],["PlayerLogic.prototype.detectADB","noopFunc"],["showPopunder","noopFunc"],["Object.prototype.prerollAds","[]"],["notifyMe","noopFunc"],["adsClasses","undefined"],["gsecs","0"],["dvsize","52"],["majorse","true"],["completed","1"],["testerli","false"],["w87.abd","noopFunc"],["document.referrer",""],["Object.prototype.setNeedShowAdblockWarning","noopFunc"],["NoAdBlock","noopFunc"],["adList","[]"],["ifmax","true"],["nitroAds.abp","true"],["onloadUI","noopFunc"],["PageLoader.DetectAb","0"],["one_time","1"],["consentGiven","true"],["playID","1"],["GEMG.GPT.Interstitial","noopFunc"],["amiblock","0"],["karte3","18"],["sandDetect","noopFunc"],["amodule.data","emptyArr"],["Object.prototype.ADBLOCK_DETECTION",""],["postroll","undefined"],["interstitial","undefined"],["isAdBlockDetected","false"],["pData.adblockOverlayEnabled","0"],["cabdSettings","undefined"],["td_ad_background_click_link"],["malisx","true"],["alim","true"],["ADS.isBannersEnabled","false"],["EASYFUN_ADS_CAN_RUN","true"],["adsbygoogle_ama_fc_has_run","true"],["jwDefaults.advertising","{}"],["elimina_profilazione","1"],["elimina_pubblicita","1"],["abd","{}"],["checkerimg","noopFunc"],["detectedAdblock","noopFunc"],["Object.prototype.DetectByGoogleAd","noopFunc"],["nitroAds","{}"],["nitroAds.createAd","noopFunc"],["NativeAd","noopFunc"],["Blob","noopFunc"],["window.navigator.brave","undefined"],["HTMLScriptElement.prototype.onerror","undefined"],["isAdblock","false"],["openPop","noopFunc"],["cns.library","true"],["BJSShowUnder","{}"],["BJSShowUnder.bindTo","noopFunc"],["BJSShowUnder.add","noopFunc"],["Object.prototype._parseVAST","noopFunc"],["Object.prototype.createAdBlocker","noopFunc"],["Object.prototype.isAdPeriod","falseFunc"],["ABLK","false"],["_n_app.popunder","null"],["_n_app.options.ads.show_popunders","false"],["N_BetterJsPop.object","{}"],["isAdb","false"],["countDown","0"],["runCheck","noopFunc"],["adsSlotRenderEndSeen","true"],["showModal","noopFunc"],["flashvars.mlogo_link",""],["isAdBlocked","noopFunc"],["URLlist","[]"],["aaw","{}"],["aaw.processAdsOnPage","noopFunc"],["doOpen","undefined"],["HTMLImageElement.prototype.onerror","undefined"],["FOXIZ_MAIN_SCRIPT.siteAccessDetector","noopFunc"],["openAdBlockPopup","noopFunc"],["Object.prototype._adsDisabled","true"],["advanced_ads_check_adblocker","noopFunc"],["canRunAds","1"],["attestHasAdBlockerActivated","true"],["extInstalled","true"],["SaveFiles.add","noopFunc"],["detectSandbox","noopFunc"],["adbon","0"],["LCI.adBlockDetectorEnabled","false"],["stoCazzo","true"],["adblockDetected","false"],["importFAB","undefined"],["window.__CONFIGURATION__.adInsertion.enabled","false"],["window.__CONFIGURATION__.features.enableAdBlockerDetection","false"],["_carbonads","{}"],["_bsa","{}"],["rwt","noopFunc"],["bmak.js_post","false"],["firebase.analytics","noopFunc"],["Object.prototype.updateModifiedCommerceUrl","noopFunc"],["flashvars.event_reporting",""],["Object.prototype.has_opted_out_tracking","trueFunc"],["Visitor","{}"],["send_gravity_event","noopFunc"],["send_recommendation_event","noopFunc"],["libAnalytics.data.get","noopFunc"],["adthrive._components.start","noopFunc"],["navigator.sendBeacon","noopFunc"]];
const hostnamesMap = new Map([["jilliandescribecompany.com",0],["gogoanime.*",[0,195]],["adrianmissionminute.com",0],["alejandrocenturyoil.com",0],["alleneconomicmatter.com",0],["bethshouldercan.com",0],["bigclatterhomesguideservice.com",0],["brittneystandardwestern.com",0],["brookethoughi.com",0],["brucevotewithin.com",0],["cindyeyefinal.com",0],["denisegrowthwide.com",0],["diananatureforeign.com",0],["donaldlineelse.com",0],["edwardarriveoften.com",0],["erikcoldperson.com",0],["evelynthankregion.com",0],["graceaddresscommunity.com",0],["heatherdiscussionwhen.com",0],["heatherwholeinvolve.com",0],["housecardsummerbutton.com",0],["jamessoundcost.com",0],["jamiesamewalk.com",0],["jasminetesttry.com",0],["jasonresponsemeasure.com",0],["jayservicestuff.com",0],["jennifercertaindevelopment.com",0],["jessicaglassauthor.com",0],["johnalwayssame.com",0],["johntryopen.com",0],["jonathansociallike.com",0],["josephseveralconcern.com",0],["kellywhatcould.com",0],["kennethofficialitem.com",0],["kristiesoundsimply.com",0],["lisatrialidea.com",0],["lorimuchbenefit.com",0],["loriwithinfamily.com",0],["lukecomparetwo.com",0],["mariatheserepublican.com",0],["markstyleall.com",0],["michaelapplysome.com",0],["morganoperationface.com",0],["nathanfromsubject.com",0],["paulkitchendark.com",0],["rebeccaneverbase.com",0],["richardsignfish.com",0],["roberteachfinal.com",0],["robertordercharacter.com",0],["robertplacespace.com",0],["ryanagoinvolve.com",0],["sandratableother.com",0],["sandrataxeight.com",0],["sethniceletter.com",0],["shannonpersonalcost.com",0],["susanhavekeep.com",0],["tinycat-voe-fashion.com",0],["toddpartneranimal.com",0],["troyyourlead.com",0],["uptodatefinishconference.com",0],["uptodatefinishconferenceroom.com",0],["voe.sx",0],["maxfinishseveral.com",0],["voe.sx>>",0],["javboys.tv>>",0],["freeplayervideo.com",0],["nazarickol.com",0],["player-cdn.com",0],["playhydrax.com",[0,402,403]],["rabbitstream.net",0],["fmovies.*",0],["japscan.lol",1],["u26bekrb.fun",2],["br.de",3],["indeed.com",4],["zillow.com",[4,107]],["pasteboard.co",5],["clickhole.com",6],["deadspin.com",6],["gizmodo.com",6],["jalopnik.com",6],["jezebel.com",6],["kotaku.com",6],["lifehacker.com",6],["splinternews.com",6],["theinventory.com",6],["theonion.com",6],["theroot.com",6],["thetakeout.com",6],["pewresearch.org",6],["los40.com",[7,8]],["as.com",8],["telegraph.co.uk",[9,10]],["poweredbycovermore.com",[9,62]],["lumens.com",[9,62]],["verizon.com",11],["humanbenchmark.com",12],["politico.com",13],["officedepot.co.cr",[14,15]],["officedepot.*",[16,17]],["usnews.com",18],["coolmathgames.com",[19,281,282,283]],["video.gazzetta.it",[20,21]],["oggi.it",[20,21]],["manoramamax.com",20],["factable.com",22],["thedailybeast.com",23],["zee5.com",24],["gala.fr",25],["geo.fr",25],["voici.fr",25],["gloucestershirelive.co.uk",26],["arsiv.mackolik.com",27],["jacksonguitars.com",28],["scandichotels.com",29],["stylist.co.uk",30],["nettiauto.com",31],["thaiairways.com",[32,33]],["cerbahealthcare.it",[34,35]],["futura-sciences.com",[34,52]],["toureiffel.paris",34],["campusfrance.org",[34,146]],["tiendaenlinea.claro.com.ni",[36,37]],["tieba.baidu.com",38],["fandom.com",[39,40,341]],["grasshopper.com",[41,42]],["epson.com.cn",[43,44,45,46]],["oe24.at",[47,48]],["szbz.de",47],["platform.autods.com",[49,50]],["kcra.com",51],["wcvb.com",51],["sportdeutschland.tv",51],["citibank.com.sg",53],["uol.com.br",[54,55,56,57,58]],["gazzetta.gr",59],["digicol.dpm.org.cn",[60,61]],["virginmediatelevision.ie",63],["larazon.es",[64,65]],["waitrosecellar.com",[66,67,68]],["kicker.de",[69,382]],["sharpen-free-design-generator.netlify.app",[70,71]],["help.cashctrl.com",[72,73]],["gry-online.pl",74],["vidaextra.com",75],["commande.rhinov.pro",[76,77]],["ecom.wixapps.net",[76,77]],["tipranks.com",[78,79]],["iceland.co.uk",[80,81,82]],["socket.pearsoned.com",83],["tntdrama.com",[84,85]],["trutv.com",[84,85]],["mobile.de",[86,87]],["ioe.vn",[88,89]],["geiriadur.ac.uk",[88,92]],["welsh-dictionary.ac.uk",[88,92]],["bikeportland.org",[90,91]],["biologianet.com",[55,56,57]],["10.com.au",[93,94]],["10play.com.au",[93,94]],["sunshine-live.de",[95,96]],["whatismyip.com",[97,98]],["myfitnesspal.com",99],["netoff.co.jp",[100,101]],["bluerabbitrx.com",[100,101]],["foundit.*",[102,103]],["clickjogos.com.br",104],["bristan.com",[105,106]],["share.hntv.tv",[108,109,110,111]],["forum.dji.com",[108,111]],["unionpayintl.com",[108,110]],["streamelements.com",108],["optimum.net",[112,113]],["hdfcfund.com",114],["user.guancha.cn",[115,116]],["sosovalue.com",117],["bandyforbundet.no",[118,119]],["tatacommunications.com",120],["kb.arlo.com",[120,152]],["suamusica.com.br",[121,122,123]],["macrotrends.net",[124,125]],["code.world",126],["smartcharts.net",126],["topgear.com",127],["eservice.directauto.com",[128,129]],["nbcsports.com",130],["standard.co.uk",131],["pruefernavi.de",[132,133]],["speedtest.net",[134,135]],["17track.net",136],["visible.com",137],["hagerty.com",[138,139]],["marketplace.nvidia.com",140],["kino.de",[141,142]],["9now.nine.com.au",143],["worldstar.com",144],["prisjakt.no",145],["developer.arm.com",[147,148]],["sterkinekor.com",149],["iogames.space",150],["id.condenast.com",151],["tires.costco.com",153],["m.youtube.com",[154,155,156,157]],["music.youtube.com",[154,155,156,157]],["tv.youtube.com",[154,155,156,157]],["www.youtube.com",[154,155,156,157]],["youtubekids.com",[154,155,156,157]],["youtube-nocookie.com",[154,155,156,157]],["eu-proxy.startpage.com",[154,155,157]],["timesofindia.indiatimes.com",158],["economictimes.indiatimes.com",159],["motherless.com",160],["sueddeutsche.de",161],["watchanimesub.net",162],["wcoanimesub.tv",162],["wcoforever.net",162],["freeviewmovies.com",162],["filehorse.com",162],["guidetnt.com",162],["starmusiq.*",162],["sp-today.com",162],["linkvertise.com",162],["eropaste.net",162],["getpaste.link",162],["sharetext.me",162],["wcofun.*",162],["note.sieuthuthuat.com",162],["gadgets.es",[162,449]],["amateurporn.co",[162,251]],["wiwo.de",163],["primewire.*",164],["alphaporno.com",[164,531]],["porngem.com",164],["shortit.pw",[164,237]],["familyporn.tv",164],["sbplay.*",164],["id45.cyou",164],["85po.com",[164,222]],["milfnut.*",164],["k1nk.co",164],["watchasians.cc",164],["sankakucomplex.com",165],["player.glomex.com",166],["merkur.de",166],["tz.de",166],["sxyprn.*",167],["hqq.*",[168,169]],["waaw.*",[169,170]],["hotpornfile.org",169],["x69.ovh",169],["younetu.*",169],["multiup.us",169],["peliculas8k.com",[169,170]],["czxxx.org",169],["vtplayer.online",169],["vvtplayer.*",169],["netu.ac",169],["netu.frembed.lol",169],["123link.*",171],["adshort.*",171],["mitly.us",171],["linkrex.net",171],["linx.cc",171],["oke.io",171],["linkshorts.*",171],["dz4link.com",171],["adsrt.*",171],["linclik.com",171],["shrt10.com",171],["vinaurl.*",171],["loptelink.com",171],["adfloz.*",171],["cut-fly.com",171],["linkfinal.com",171],["payskip.org",171],["cutpaid.com",171],["linkjust.com",171],["leechpremium.link",171],["icutlink.com",[171,256]],["oncehelp.com",171],["rgl.vn",171],["reqlinks.net",171],["bitlk.com",171],["qlinks.eu",171],["link.3dmili.com",171],["short-fly.com",171],["foxseotools.com",171],["dutchycorp.*",171],["shortearn.*",171],["pingit.*",171],["link.turkdown.com",171],["7r6.com",171],["oko.sh",171],["ckk.ai",171],["fc.lc",171],["fstore.biz",171],["shrink.*",171],["cuts-url.com",171],["eio.io",171],["exe.app",171],["exee.io",171],["exey.io",171],["skincarie.com",171],["exeo.app",171],["tmearn.*",171],["coinlyhub.com",[171,320]],["adsafelink.com",171],["aii.sh",171],["megalink.*",171],["cybertechng.com",[171,335]],["cutdl.xyz",171],["iir.ai",171],["shorteet.com",[171,353]],["miniurl.*",171],["smoner.com",171],["gplinks.*",171],["odisha-remix.com",[171,335]],["xpshort.com",[171,335]],["upshrink.com",171],["clk.*",171],["easysky.in",171],["veganab.co",171],["golink.bloggerishyt.in",171],["birdurls.com",171],["vipurl.in",171],["jameeltips.us",171],["promo-visits.site",171],["satoshi-win.xyz",[171,369]],["shorterall.com",171],["encurtandourl.com",171],["forextrader.site",171],["postazap.com",171],["cety.app",171],["exego.app",[171,364]],["cutlink.net",171],["cutyurls.com",171],["cutty.app",171],["cutnet.net",171],["jixo.online",171],["tinys.click",[171,335]],["cpm.icu",171],["panyshort.link",171],["enagato.com",171],["pandaznetwork.com",171],["tpi.li",171],["oii.la",171],["recipestutorials.com",171],["shrinke.*",171],["shrinkme.*",171],["shrinkforearn.in",171],["oii.io",171],["du-link.in",171],["atglinks.com",171],["thotpacks.xyz",171],["megaurl.in",171],["megafly.in",171],["simana.online",171],["fooak.com",171],["joktop.com",171],["evernia.site",171],["falpus.com",171],["link.paid4link.com",171],["exalink.fun",171],["shortxlinks.com",171],["upfion.com",171],["upfiles.app",171],["upfiles-urls.com",171],["flycutlink.com",[171,335]],["linksly.co",171],["link1s.*",171],["pkr.pw",171],["imagenesderopaparaperros.com",171],["shortenbuddy.com",171],["apksvip.com",171],["4cash.me",171],["namaidani.com",171],["shortzzy.*",171],["teknomuda.com",171],["shorttey.*",[171,319]],["miuiku.com",171],["savelink.site",171],["lite-link.*",171],["adcorto.*",171],["samaa-pro.com",171],["miklpro.com",171],["modapk.link",171],["ccurl.net",171],["linkpoi.me",171],["pewgame.com",171],["haonguyen.top",171],["zshort.*",171],["crazyblog.in",171],["cutearn.net",171],["rshrt.com",171],["filezipa.com",171],["dz-linkk.com",171],["upfiles.*",171],["theblissempire.com",171],["finanzas-vida.com",171],["adurly.cc",171],["paid4.link",171],["link.asiaon.top",171],["go.gets4link.com",171],["linkfly.*",171],["beingtek.com",171],["shorturl.unityassets4free.com",171],["disheye.com",171],["techymedies.com",171],["techysuccess.com",171],["za.gl",[171,271]],["bblink.com",171],["myad.biz",171],["swzz.xyz",171],["vevioz.com",171],["charexempire.com",171],["clk.asia",171],["sturls.com",171],["myshrinker.com",171],["snowurl.com",[171,335]],["wplink.*",171],["rocklink.in",171],["techgeek.digital",171],["download3s.net",171],["shortx.net",171],["tlin.me",171],["bestcash2020.com",171],["adslink.pw",171],["novelssites.com",171],["faucetcrypto.net",171],["trxking.xyz",171],["weadown.com",171],["m.bloggingguidance.com",171],["link.codevn.net",171],["link4rev.site",171],["c2g.at",171],["bitcosite.com",[171,545]],["cryptosh.pro",171],["windowslite.net",[171,335]],["viewfr.com",171],["cl1ca.com",171],["4br.me",171],["fir3.net",171],["seulink.*",171],["encurtalink.*",171],["kiddyshort.com",171],["watchmygf.me",[172,196]],["camwhores.*",[172,182,221,222,223]],["camwhorez.tv",[172,182,221,222]],["cambay.tv",[172,203,221,248,250,251,252,253]],["fpo.xxx",[172,203]],["sexemix.com",172],["heavyfetish.com",[172,716]],["thotcity.su",172],["viralxxxporn.com",[172,386]],["tube8.*",[173,174]],["you-porn.com",174],["youporn.*",174],["youporngay.com",174],["youpornru.com",174],["redtube.*",174],["9908ww.com",174],["adelaidepawnbroker.com",174],["bztube.com",174],["hotovs.com",174],["insuredhome.org",174],["nudegista.com",174],["pornluck.com",174],["vidd.se",174],["pornhub.*",[174,308]],["pornhub.com",174],["pornerbros.com",175],["freep.com",175],["porn.com",176],["tune.pk",177],["noticias.gospelmais.com.br",178],["techperiod.com",178],["viki.com",[179,180]],["watch-series.*",181],["watchseries.*",181],["vev.*",181],["vidop.*",181],["vidup.*",181],["sleazyneasy.com",[182,183,184]],["smutr.com",[182,316]],["tktube.com",182],["yourporngod.com",[182,183]],["javbangers.com",[182,439]],["camfox.com",182],["camthots.tv",[182,248]],["shegotass.info",182],["amateur8.com",182],["bigtitslust.com",182],["ebony8.com",182],["freeporn8.com",182],["lesbian8.com",182],["maturetubehere.com",182],["sortporn.com",182],["motherporno.com",[182,183,203,250]],["theporngod.com",[182,183]],["watchdirty.to",[182,222,223,251]],["pornsocket.com",185],["luxuretv.com",186],["porndig.com",[187,188]],["webcheats.com.br",189],["ceesty.com",[190,191]],["gestyy.com",[190,191]],["corneey.com",191],["destyy.com",191],["festyy.com",191],["sh.st",191],["mitaku.net",191],["angrybirdsnest.com",192],["zrozz.com",192],["clix4btc.com",192],["4tests.com",192],["goltelevision.com",192],["news-und-nachrichten.de",192],["laradiobbs.net",192],["urlaubspartner.net",192],["produktion.de",192],["cinemaxxl.de",192],["bladesalvador.com",192],["tempr.email",192],["cshort.org",192],["friendproject.net",192],["covrhub.com",192],["katfile.com",[192,611]],["trust.zone",192],["business-standard.com",192],["planetsuzy.org",193],["empflix.com",194],["xmovies8.*",195],["masteranime.tv",195],["0123movies.*",195],["gostream.*",195],["gomovies.*",195],["transparentcalifornia.com",196],["deepbrid.com",197],["webnovel.com",198],["streamwish.*",[199,200]],["oneupload.to",200],["wishfast.top",200],["rubystm.com",200],["rubyvid.com",200],["rubyvidhub.com",200],["stmruby.com",200],["streamruby.com",200],["schwaebische.de",201],["8tracks.com",202],["3movs.com",203],["bravoerotica.net",[203,250]],["youx.xxx",203],["camclips.tv",[203,316]],["xtits.*",[203,250]],["camflow.tv",[203,250,251,289,386]],["camhoes.tv",[203,248,250,251,289,386]],["xmegadrive.com",203],["xxxymovies.com",203],["xxxshake.com",203],["gayck.com",203],["xhand.com",[203,250]],["analdin.com",[203,250]],["revealname.com",204],["golfchannel.com",205],["stream.nbcsports.com",205],["mathdf.com",205],["gamcore.com",206],["porcore.com",206],["porngames.tv",206],["69games.xxx",206],["javmix.app",206],["haaretz.co.il",207],["haaretz.com",207],["hungama.com",207],["a-o.ninja",207],["anime-odcinki.pl",207],["shortgoo.blogspot.com",207],["tonanmedia.my.id",[207,565]],["yurasu.xyz",207],["isekaipalace.com",207],["plyjam.*",[208,209]],["ennovelas.com",[209,213]],["foxsports.com.au",210],["canberratimes.com.au",210],["thesimsresource.com",211],["fxporn69.*",212],["vipbox.*",213],["viprow.*",213],["ctrl.blog",214],["sportlife.es",215],["finofilipino.org",216],["desbloqueador.*",217],["xberuang.*",218],["teknorizen.*",218],["mysflink.blogspot.com",218],["ashemaletube.*",219],["paktech2.com",219],["assia.tv",220],["assia4.com",220],["cwtvembeds.com",[222,249]],["camlovers.tv",222],["porntn.com",222],["pornissimo.org",222],["sexcams-24.com",[222,251]],["watchporn.to",[222,251]],["camwhorez.video",222],["footstockings.com",[222,223,251]],["xmateur.com",[222,223,251]],["multi.xxx",223],["weatherx.co.in",[224,225]],["sunbtc.space",224],["subtorrents.*",226],["subtorrents1.*",226],["newpelis.*",226],["pelix.*",226],["allcalidad.*",226],["infomaniakos.*",226],["ojogos.com.br",227],["powforums.com",228],["supforums.com",228],["studybullet.com",228],["usgamer.net",229],["recordonline.com",229],["freebitcoin.win",230],["e-monsite.com",230],["coindice.win",230],["freiepresse.de",231],["investing.com",232],["tornadomovies.*",233],["mp3fiber.com",234],["chicoer.com",235],["dailybreeze.com",235],["dailybulletin.com",235],["dailynews.com",235],["delcotimes.com",235],["eastbaytimes.com",235],["macombdaily.com",235],["ocregister.com",235],["pasadenastarnews.com",235],["pe.com",235],["presstelegram.com",235],["redlandsdailyfacts.com",235],["reviewjournal.com",235],["santacruzsentinel.com",235],["saratogian.com",235],["sentinelandenterprise.com",235],["sgvtribune.com",235],["tampabay.com",235],["times-standard.com",235],["theoaklandpress.com",235],["trentonian.com",235],["twincities.com",235],["whittierdailynews.com",235],["bostonherald.com",235],["dailycamera.com",235],["sbsun.com",235],["dailydemocrat.com",235],["montereyherald.com",235],["orovillemr.com",235],["record-bee.com",235],["redbluffdailynews.com",235],["reporterherald.com",235],["thereporter.com",235],["timescall.com",235],["timesheraldonline.com",235],["ukiahdailyjournal.com",235],["dailylocal.com",235],["mercurynews.com",235],["suedkurier.de",236],["anysex.com",238],["icdrama.*",239],["mangasail.*",239],["pornve.com",240],["file4go.*",241],["coolrom.com.au",241],["marie-claire.es",242],["gamezhero.com",242],["flashgirlgames.com",242],["onlinesudoku.games",242],["mpg.football",242],["sssam.com",242],["globalnews.ca",243],["drinksmixer.com",244],["leitesculinaria.com",244],["fupa.net",245],["browardpalmbeach.com",246],["dallasobserver.com",246],["houstonpress.com",246],["miaminewtimes.com",246],["phoenixnewtimes.com",246],["westword.com",246],["nowtv.com.tr",247],["caminspector.net",248],["camwhoreshd.com",248],["camgoddess.tv",248],["gay4porn.com",250],["mypornhere.com",250],["mangovideo.*",251],["love4porn.com",251],["thotvids.com",251],["watchmdh.to",251],["celebwhore.com",251],["cluset.com",251],["sexlist.tv",251],["4kporn.xxx",251],["xhomealone.com",251],["lusttaboo.com",[251,509]],["hentai-moon.com",251],["camhub.cc",[251,670]],["mediapason.it",254],["linkspaid.com",254],["tuotromedico.com",254],["neoteo.com",254],["phoneswiki.com",254],["celebmix.com",254],["myneobuxportal.com",254],["oyungibi.com",254],["25yearslatersite.com",254],["jeshoots.com",255],["techhx.com",255],["karanapk.com",255],["flashplayer.fullstacks.net",257],["cloudapps.herokuapp.com",257],["youfiles.herokuapp.com",257],["texteditor.nsspot.net",257],["temp-mail.org",258],["asianclub.*",259],["javhdporn.net",259],["vidmoly.to",260],["comnuan.com",261],["veedi.com",262],["battleboats.io",262],["anitube.*",263],["fruitlab.com",263],["haddoz.net",263],["streamingcommunity.*",263],["garoetpos.com",263],["stiletv.it",264],["mixdrop.*",265],["hqtv.biz",266],["liveuamap.com",267],["audycje.tokfm.pl",268],["shush.se",269],["allkpop.com",270],["empire-anime.*",[271,560,561,562,563,564]],["empire-streaming.*",[271,560,561,562]],["empire-anime.com",[271,560,561,562]],["empire-streamz.fr",[271,560,561,562]],["empire-stream.*",[271,560,561,562]],["pickcrackpasswords.blogspot.com",272],["kfrfansub.com",273],["thuglink.com",273],["voipreview.org",273],["illicoporno.com",274],["lavoixdux.com",274],["tonpornodujour.com",274],["jacquieetmichel.net",274],["swame.com",274],["vosfemmes.com",274],["voyeurfrance.net",274],["jacquieetmicheltv.net",[274,618,619]],["pogo.com",275],["cloudvideo.tv",276],["legionjuegos.org",277],["legionpeliculas.org",277],["legionprogramas.org",277],["16honeys.com",278],["elespanol.com",279],["remodelista.com",280],["audiofanzine.com",284],["uploadev.*",285],["developerinsider.co",286],["thehindu.com",287],["cambro.tv",[288,289]],["boobsradar.com",[289,386,687]],["nibelungen-kurier.de",290],["adfoc.us",291],["tea-coffee.net",291],["spatsify.com",291],["newedutopics.com",291],["getviralreach.in",291],["edukaroo.com",291],["funkeypagali.com",291],["careersides.com",291],["nayisahara.com",291],["wikifilmia.com",291],["infinityskull.com",291],["viewmyknowledge.com",291],["iisfvirtual.in",291],["starxinvestor.com",291],["jkssbalerts.com",291],["sahlmarketing.net",291],["filmypoints.in",291],["fitnessholic.net",291],["moderngyan.com",291],["sattakingcharts.in",291],["bankshiksha.in",291],["earn.mpscstudyhub.com",291],["earn.quotesopia.com",291],["money.quotesopia.com",291],["best-mobilegames.com",291],["learn.moderngyan.com",291],["bharatsarkarijobalert.com",291],["quotesopia.com",291],["creditsgoal.com",291],["bgmi32bitapk.in",291],["techacode.com",291],["trickms.com",291],["ielts-isa.edu.vn",291],["loan.punjabworks.com",291],["rokni.xyz",291],["keedabankingnews.com",291],["sptfy.be",291],["mcafee-com.com",[291,364]],["pianetamountainbike.it",292],["barchart.com",293],["modelisme.com",294],["parasportontario.ca",294],["prescottenews.com",294],["nrj-play.fr",295],["hackingwithreact.com",296],["gutekueche.at",297],["peekvids.com",298],["playvids.com",298],["pornflip.com",298],["redensarten-index.de",299],["vw-page.com",300],["viz.com",[301,302]],["0rechner.de",303],["configspc.com",304],["xopenload.me",304],["uptobox.com",304],["uptostream.com",304],["japgay.com",305],["mega-debrid.eu",306],["dreamdth.com",307],["diaridegirona.cat",309],["diariodeibiza.es",309],["diariodemallorca.es",309],["diarioinformacion.com",309],["eldia.es",309],["emporda.info",309],["farodevigo.es",309],["laopinioncoruna.es",309],["laopiniondemalaga.es",309],["laopiniondemurcia.es",309],["laopiniondezamora.es",309],["laprovincia.es",309],["levante-emv.com",309],["mallorcazeitung.es",309],["regio7.cat",309],["superdeporte.es",309],["playpaste.com",310],["cnbc.com",311],["primevideo.com",312],["read.amazon.*",[312,698]],["firefaucet.win",313],["74k.io",[314,315]],["cloudwish.xyz",315],["gradehgplus.com",315],["javindo.site",315],["javindosub.site",315],["kamehaus.net",315],["movearnpre.com",315],["trailerhg.xyz",315],["turboplayers.xyz",315],["arabshentai.com>>",315],["javdo.cc>>",315],["javenglish.cc>>",315],["javhd.*>>",315],["javhdz.*>>",315],["roshy.tv>>",315],["sextb.net>>",315],["fullhdxxx.com",317],["pornclassic.tube",318],["tubepornclassic.com",318],["etonline.com",319],["creatur.io",319],["lookcam.*",319],["drphil.com",319],["urbanmilwaukee.com",319],["ontiva.com",319],["hideandseek.world",319],["myabandonware.com",319],["kendam.com",319],["wttw.com",319],["synonyms.com",319],["definitions.net",319],["hostmath.com",319],["camvideoshub.com",319],["minhaconexao.com.br",319],["home-made-videos.com",321],["amateur-couples.com",321],["slutdump.com",321],["dpstream.*",322],["produsat.com",323],["bluemediafiles.*",324],["12thman.com",325],["acusports.com",325],["atlantic10.com",325],["auburntigers.com",325],["baylorbears.com",325],["bceagles.com",325],["bgsufalcons.com",325],["big12sports.com",325],["bigten.org",325],["bradleybraves.com",325],["butlersports.com",325],["cmumavericks.com",325],["conferenceusa.com",325],["cyclones.com",325],["dartmouthsports.com",325],["daytonflyers.com",325],["dbupatriots.com",325],["dbusports.com",325],["denverpioneers.com",325],["fduknights.com",325],["fgcuathletics.com",325],["fightinghawks.com",325],["fightingillini.com",325],["floridagators.com",325],["friars.com",325],["friscofighters.com",325],["gamecocksonline.com",325],["goarmywestpoint.com",325],["gobison.com",325],["goblueraiders.com",325],["gobobcats.com",325],["gocards.com",325],["gocreighton.com",325],["godeacs.com",325],["goexplorers.com",325],["goetbutigers.com",325],["gofrogs.com",325],["gogriffs.com",325],["gogriz.com",325],["golobos.com",325],["gomarquette.com",325],["gopack.com",325],["gophersports.com",325],["goprincetontigers.com",325],["gopsusports.com",325],["goracers.com",325],["goshockers.com",325],["goterriers.com",325],["gotigersgo.com",325],["gousfbulls.com",325],["govandals.com",325],["gowyo.com",325],["goxavier.com",325],["gozags.com",325],["gozips.com",325],["griffinathletics.com",325],["guhoyas.com",325],["gwusports.com",325],["hailstate.com",325],["hamptonpirates.com",325],["hawaiiathletics.com",325],["hokiesports.com",325],["huskers.com",325],["icgaels.com",325],["iuhoosiers.com",325],["jsugamecocksports.com",325],["longbeachstate.com",325],["loyolaramblers.com",325],["lrtrojans.com",325],["lsusports.net",325],["morrisvillemustangs.com",325],["msuspartans.com",325],["muleriderathletics.com",325],["mutigers.com",325],["navysports.com",325],["nevadawolfpack.com",325],["niuhuskies.com",325],["nkunorse.com",325],["nuhuskies.com",325],["nusports.com",325],["okstate.com",325],["olemisssports.com",325],["omavs.com",325],["ovcsports.com",325],["owlsports.com",325],["purduesports.com",325],["redstormsports.com",325],["richmondspiders.com",325],["sfajacks.com",325],["shupirates.com",325],["siusalukis.com",325],["smcgaels.com",325],["smumustangs.com",325],["soconsports.com",325],["soonersports.com",325],["themw.com",325],["tulsahurricane.com",325],["txst.com",325],["txstatebobcats.com",325],["ubbulls.com",325],["ucfknights.com",325],["ucirvinesports.com",325],["uconnhuskies.com",325],["uhcougars.com",325],["uicflames.com",325],["umterps.com",325],["uncwsports.com",325],["unipanthers.com",325],["unlvrebels.com",325],["uoflsports.com",325],["usdtoreros.com",325],["utahstateaggies.com",325],["utepathletics.com",325],["utrockets.com",325],["uvmathletics.com",325],["uwbadgers.com",325],["villanova.com",325],["wkusports.com",325],["wmubroncos.com",325],["woffordterriers.com",325],["1pack1goal.com",325],["bcuathletics.com",325],["bubraves.com",325],["goblackbears.com",325],["golightsgo.com",325],["gomcpanthers.com",325],["goutsa.com",325],["mercerbears.com",325],["pirateblue.com",325],["pirateblue.net",325],["pirateblue.org",325],["quinnipiacbobcats.com",325],["towsontigers.com",325],["tribeathletics.com",325],["tribeclub.com",325],["utepminermaniacs.com",325],["utepminers.com",325],["wkutickets.com",325],["aopathletics.org",325],["atlantichockeyonline.com",325],["bigsouthnetwork.com",325],["bigsouthsports.com",325],["chawomenshockey.com",325],["dbupatriots.org",325],["drakerelays.org",325],["ecac.org",325],["ecacsports.com",325],["emueagles.com",325],["emugameday.com",325],["gculopes.com",325],["godrakebulldog.com",325],["godrakebulldogs.com",325],["godrakebulldogs.net",325],["goeags.com",325],["goislander.com",325],["goislanders.com",325],["gojacks.com",325],["gomacsports.com",325],["gseagles.com",325],["hubison.com",325],["iowaconference.com",325],["ksuowls.com",325],["lonestarconference.org",325],["mascac.org",325],["midwestconference.org",325],["mountaineast.org",325],["niu-pack.com",325],["nulakers.ca",325],["oswegolakers.com",325],["ovcdigitalnetwork.com",325],["pacersports.com",325],["rmacsports.org",325],["rollrivers.com",325],["samfordsports.com",325],["uncpbraves.com",325],["usfdons.com",325],["wiacsports.com",325],["alaskananooks.com",325],["broncathleticfund.com",325],["cameronaggies.com",325],["columbiacougars.com",325],["etownbluejays.com",325],["gobadgers.ca",325],["golancers.ca",325],["gometrostate.com",325],["gothunderbirds.ca",325],["kentstatesports.com",325],["lehighsports.com",325],["lopers.com",325],["lycoathletics.com",325],["lycomingathletics.com",325],["maraudersports.com",325],["mauiinvitational.com",325],["msumavericks.com",325],["nauathletics.com",325],["nueagles.com",325],["nwusports.com",325],["oceanbreezenyc.org",325],["patriotathleticfund.com",325],["pittband.com",325],["principiaathletics.com",325],["roadrunnersathletics.com",325],["sidearmsocial.com",325],["snhupenmen.com",325],["stablerarena.com",325],["stoutbluedevils.com",325],["uwlathletics.com",325],["yumacs.com",325],["collegefootballplayoff.com",325],["csurams.com",325],["cubuffs.com",325],["gobearcats.com",325],["gohuskies.com",325],["mgoblue.com",325],["osubeavers.com",325],["pittsburghpanthers.com",325],["rolltide.com",325],["texassports.com",325],["thesundevils.com",325],["uclabruins.com",325],["wvuathletics.com",325],["wvusports.com",325],["arizonawildcats.com",325],["calbears.com",325],["cuse.com",325],["georgiadogs.com",325],["goducks.com",325],["goheels.com",325],["gostanford.com",325],["insidekstatesports.com",325],["insidekstatesports.info",325],["insidekstatesports.net",325],["insidekstatesports.org",325],["k-stateathletics.com",325],["k-statefootball.net",325],["k-statefootball.org",325],["k-statesports.com",325],["k-statesports.net",325],["k-statesports.org",325],["k-statewomenshoops.com",325],["k-statewomenshoops.net",325],["k-statewomenshoops.org",325],["kstateathletics.com",325],["kstatefootball.net",325],["kstatefootball.org",325],["kstatesports.com",325],["kstatewomenshoops.com",325],["kstatewomenshoops.net",325],["kstatewomenshoops.org",325],["ksuathletics.com",325],["ksusports.com",325],["scarletknights.com",325],["showdownforrelief.com",325],["syracusecrunch.com",325],["texastech.com",325],["theacc.com",325],["ukathletics.com",325],["usctrojans.com",325],["utahutes.com",325],["utsports.com",325],["wsucougars.com",325],["vidlii.com",[325,350]],["tricksplit.io",325],["fangraphs.com",326],["stern.de",327],["geo.de",327],["brigitte.de",327],["tvspielfilm.de",[328,329,330,331]],["tvtoday.de",[328,329,330,331]],["chip.de",[328,329,330,331]],["focus.de",[328,329,330,331]],["fitforfun.de",[328,329,330,331]],["n-tv.de",332],["player.rtl2.de",333],["planetaminecraft.com",334],["cravesandflames.com",335],["codesnse.com",335],["flyad.vip",335],["lapresse.ca",336],["kolyoom.com",337],["ilovephd.com",337],["negumo.com",338],["games.wkb.jp",[339,340]],["kenshi.fandom.com",342],["hausbau-forum.de",343],["homeairquality.org",343],["faucettronn.click",343],["fake-it.ws",344],["laksa19.github.io",345],["1shortlink.com",346],["u-s-news.com",347],["luscious.net",348],["makemoneywithurl.com",349],["junkyponk.com",349],["healthfirstweb.com",349],["vocalley.com",349],["yogablogfit.com",349],["howifx.com",[349,530]],["en.financerites.com",349],["mythvista.com",349],["livenewsflix.com",349],["cureclues.com",349],["apekite.com",349],["enit.in",349],["iammagnus.com",350],["dailyvideoreports.net",350],["unityassets4free.com",350],["docer.*",351],["resetoff.pl",351],["sexodi.com",351],["cdn77.org",352],["momxxxsex.com",353],["penisbuyutucum.net",353],["ujszo.com",354],["newsmax.com",355],["nadidetarifler.com",356],["siz.tv",356],["suzylu.co.uk",[357,358]],["onworks.net",359],["yabiladi.com",359],["downloadsoft.net",360],["newsobserver.com",361],["arkadiumhosted.com",361],["testlanguages.com",362],["newsinlevels.com",362],["videosinlevels.com",362],["catcare.store",363],["starkroboticsfrc.com",364],["sinonimos.de",364],["antonimos.de",364],["quesignifi.ca",364],["tiktokrealtime.com",364],["tiktokcounter.net",364],["tpayr.xyz",364],["poqzn.xyz",364],["ashrfd.xyz",364],["rezsx.xyz",364],["tryzt.xyz",364],["ashrff.xyz",364],["rezst.xyz",364],["dawenet.com",364],["erzar.xyz",364],["waezm.xyz",364],["waezg.xyz",364],["blackwoodacademy.org",364],["cryptednews.space",364],["vivuq.com",364],["swgop.com",364],["vbnmll.com",364],["telcoinfo.online",364],["dshytb.com",364],["btcbitco.in",[364,368]],["btcsatoshi.net",364],["cempakajaya.com",364],["crypto4yu.com",364],["readbitcoin.org",364],["wiour.com",364],["finish.addurl.biz",364],["aiimgvlog.fun",[364,371]],["laweducationinfo.com",364],["savemoneyinfo.com",364],["worldaffairinfo.com",364],["godstoryinfo.com",364],["successstoryinfo.com",364],["cxissuegk.com",364],["learnmarketinfo.com",364],["bhugolinfo.com",364],["armypowerinfo.com",364],["rsgamer.app",364],["phonereviewinfo.com",364],["makeincomeinfo.com",364],["gknutshell.com",364],["vichitrainfo.com",364],["workproductivityinfo.com",364],["dopomininfo.com",364],["hostingdetailer.com",364],["fitnesssguide.com",364],["tradingfact4u.com",364],["cryptofactss.com",364],["softwaredetail.com",364],["artoffocas.com",364],["insurancesfact.com",364],["travellingdetail.com",364],["advertisingexcel.com",364],["allcryptoz.net",364],["batmanfactor.com",364],["beautifulfashionnailart.com",364],["crewbase.net",364],["documentaryplanet.xyz",364],["crewus.net",364],["gametechreviewer.com",364],["midebalonu.net",364],["misterio.ro",364],["phineypet.com",364],["seory.xyz",364],["shinbhu.net",364],["shinchu.net",364],["substitutefor.com",364],["talkforfitness.com",364],["thefitbrit.co.uk",364],["thumb8.net",364],["thumb9.net",364],["topcryptoz.net",364],["uniqueten.net",364],["ultraten.net",364],["exactpay.online",364],["quins.us",364],["kiddyearner.com",364],["imagereviser.com",365],["tech.pubghighdamage.com",366],["jiocinema.com",366],["rapid-cloud.co",366],["uploadmall.com",366],["4funbox.com",367],["nephobox.com",367],["1024tera.com",367],["terabox.*",367],["blog24.me",368],["bildirim.*",370],["arahdrive.com",371],["appsbull.com",372],["diudemy.com",372],["maqal360.com",[372,373,374]],["lifesurance.info",375],["akcartoons.in",376],["cybercityhelp.in",376],["dl.apkmoddone.com",377],["phongroblox.com",377],["fuckingfast.net",378],["buzzheavier.com",378],["tickhosting.com",379],["in91vip.win",380],["datavaults.co",381],["t-online.de",383],["upornia.*",[384,385]],["bobs-tube.com",386],["pornohirsch.net",387],["bembed.net",388],["embedv.net",388],["javguard.club",388],["listeamed.net",388],["v6embed.xyz",388],["vembed.*",388],["vid-guard.com",388],["vinomo.xyz",388],["nekolink.site",[389,390]],["aagmaal.com",391],["camcam.cc",391],["netfapx.com",391],["javdragon.org",391],["javneon.tv",391],["javsaga.ninja",391],["pixsera.net",392],["jnews5.com",393],["pc-builds.com",394],["reuters.com",394],["today.com",394],["videogamer.com",394],["wrestlinginc.com",394],["usatoday.com",395],["ydr.com",395],["247sports.com",396],["indiatimes.com",397],["netzwelt.de",398],["filmibeat.com",399],["goodreturns.in",399],["mykhel.com",399],["luckydice.net",399],["adarima.org",399],["weatherwx.com",399],["sattaguess.com",399],["winshell.de",399],["rosasidan.ws",399],["upiapi.in",399],["daemonanime.net",399],["networkhint.com",399],["thichcode.net",399],["texturecan.com",399],["tikmate.app",[399,601]],["arcaxbydz.id",399],["quotesshine.com",399],["arcade.buzzrtv.com",400],["arcade.dailygazette.com",400],["arcade.lemonde.fr",400],["arena.gamesforthebrain.com",400],["bestpuzzlesandgames.com",400],["cointiply.arkadiumarena.com",400],["gamelab.com",400],["games.abqjournal.com",400],["games.amny.com",400],["games.bellinghamherald.com",400],["games.besthealthmag.ca",400],["games.bnd.com",400],["games.boston.com",400],["games.bostonglobe.com",400],["games.bradenton.com",400],["games.centredaily.com",400],["games.charlottegames.cnhinews.com",400],["games.crosswordgiant.com",400],["games.dailymail.co.uk",400],["games.dallasnews.com",400],["games.daytondailynews.com",400],["games.denverpost.com",400],["games.everythingzoomer.com",400],["games.fresnobee.com",400],["games.gameshownetwork.com",400],["games.get.tv",400],["games.greatergood.com",400],["games.heraldonline.com",400],["games.heraldsun.com",400],["games.idahostatesman.com",400],["games.insp.com",400],["games.islandpacket.com",400],["games.journal-news.com",400],["games.kansas.com",400],["games.kansascity.com",400],["games.kentucky.com",400],["games.lancasteronline.com",400],["games.ledger-enquirer.com",400],["games.macon.com",400],["games.mashable.com",400],["games.mercedsunstar.com",400],["games.metro.us",400],["games.metv.com",400],["games.miamiherald.com",400],["games.modbee.com",400],["games.moviestvnetwork.com",400],["games.myrtlebeachonline.com",400],["games.games.newsgames.parade.com",400],["games.pressdemocrat.com",400],["games.puzzlebaron.com",400],["games.puzzler.com",400],["games.puzzles.ca",400],["games.qns.com",400],["games.readersdigest.ca",400],["games.sacbee.com",400],["games.sanluisobispo.com",400],["games.sixtyandme.com",400],["games.sltrib.com",400],["games.springfieldnewssun.com",400],["games.star-telegram.com",400],["games.startribune.com",400],["games.sunherald.com",400],["games.theadvocate.com",400],["games.thenewstribune.com",400],["games.theolympian.com",400],["games.theportugalnews.com",400],["games.thestar.com",400],["games.thestate.com",400],["games.tri-cityherald.com",400],["games.triviatoday.com",400],["games.usnews.com",400],["games.word.tips",400],["games.wordgenius.com",400],["games.wtop.com",400],["jeux.meteocity.com",400],["juegos.as.com",400],["juegos.elnuevoherald.com",400],["juegos.elpais.com",400],["philly.arkadiumarena.com",400],["play.dictionary.com",400],["puzzles.bestforpuzzles.com",400],["puzzles.centralmaine.com",400],["puzzles.crosswordsolver.org",400],["puzzles.independent.co.uk",400],["puzzles.nola.com",400],["puzzles.pressherald.com",400],["puzzles.standard.co.uk",400],["puzzles.sunjournal.com",400],["arkadium.com",401],["abysscdn.com",[402,403]],["arcai.com",404],["my-code4you.blogspot.com",405],["flickr.com",406],["firefile.cc",407],["pestleanalysis.com",407],["kochamjp.pl",407],["tutorialforlinux.com",407],["whatsaero.com",407],["animeblkom.net",[407,421]],["blkom.com",407],["globes.co.il",[408,409]],["jardiner-malin.fr",410],["tw-calc.net",411],["ohmybrush.com",412],["talkceltic.net",413],["mentalfloss.com",414],["uprafa.com",415],["cube365.net",416],["wwwfotografgotlin.blogspot.com",417],["freelistenonline.com",417],["badassdownloader.com",418],["quickporn.net",419],["yellowbridge.com",420],["aosmark.com",422],["ctrlv.*",423],["atozmath.com",[424,425,426,427,428,429,430]],["newyorker.com",431],["brighteon.com",432],["more.tv",433],["video1tube.com",434],["alohatube.xyz",434],["4players.de",435],["onlinesoccermanager.com",435],["fshost.me",436],["link.cgtips.org",437],["hentaicloud.com",438],["paperzonevn.com",440],["9jarock.org",441],["fzmovies.info",441],["fztvseries.ng",441],["netnaijas.com",441],["hentaienglish.com",442],["hentaiporno.xxx",442],["venge.io",[443,444]],["btcbux.io",445],["its.porn",[446,447]],["atv.at",448],["2ndrun.tv",449],["rackusreads.com",449],["teachmemicro.com",449],["willcycle.com",449],["kusonime.com",[450,451]],["123movieshd.*",452],["imgur.com",[453,454,717]],["hentai-party.com",455],["hentaicomics.pro",455],["uproxy.*",456],["animesa.*",457],["subtitle.one",458],["subtitleone.cc",458],["mysexgames.com",459],["ancient-origins.*",460],["cinecalidad.*",[461,462]],["xnxx.com",463],["xvideos.*",463],["gdr-online.com",464],["mmm.dk",465],["iqiyi.com",[466,467,593]],["m.iqiyi.com",468],["nbcolympics.com",469],["apkhex.com",470],["indiansexstories2.net",471],["issstories.xyz",471],["1340kbbr.com",472],["gorgeradio.com",472],["kduk.com",472],["kedoam.com",472],["kejoam.com",472],["kelaam.com",472],["khsn1230.com",472],["kjmx.rocks",472],["kloo.com",472],["klooam.com",472],["klykradio.com",472],["kmed.com",472],["kmnt.com",472],["kool991.com",472],["kpnw.com",472],["kppk983.com",472],["krktcountry.com",472],["ktee.com",472],["kwro.com",472],["kxbxfm.com",472],["thevalley.fm",472],["quizlet.com",473],["dsocker1234.blogspot.com",474],["schoolcheats.net",[475,476]],["mgnet.xyz",477],["designtagebuch.de",478],["pixroute.com",479],["uploady.io",480],["calculator-online.net",481],["porngames.club",482],["sexgames.xxx",482],["111.90.159.132",483],["mobile-tracker-free.com",484],["pfps.gg",485],["social-unlock.com",486],["superpsx.com",487],["ninja.io",488],["sourceforge.net",489],["samfirms.com",490],["rapelust.com",491],["vtube.to",491],["desitelugusex.com",491],["dvdplay.*",491],["xvideos-downloader.net",491],["xxxvideotube.net",491],["sdefx.cloud",491],["nozomi.la",491],["banned.video",492],["madmaxworld.tv",492],["androidpolice.com",492],["babygaga.com",492],["backyardboss.net",492],["carbuzz.com",492],["cbr.com",492],["collider.com",492],["dualshockers.com",492],["footballfancast.com",492],["footballleagueworld.co.uk",492],["gamerant.com",492],["givemesport.com",492],["hardcoregamer.com",492],["hotcars.com",492],["howtogeek.com",492],["makeuseof.com",492],["moms.com",492],["movieweb.com",492],["pocket-lint.com",492],["pocketnow.com",492],["screenrant.com",492],["simpleflying.com",492],["thegamer.com",492],["therichest.com",492],["thesportster.com",492],["thethings.com",492],["thetravel.com",492],["topspeed.com",492],["xda-developers.com",492],["huffpost.com",493],["ingles.com",494],["spanishdict.com",494],["surfline.com",[495,496]],["play.tv3.ee",497],["play.tv3.lt",497],["play.tv3.lv",[497,498]],["tv3play.skaties.lv",497],["bulbagarden.net",499],["hollywoodlife.com",500],["mat6tube.com",501],["hotabis.com",502],["root-nation.com",502],["italpress.com",502],["airsoftmilsimnews.com",502],["artribune.com",502],["newtumbl.com",503],["apkmaven.*",504],["aruble.net",505],["nevcoins.club",506],["mail.com",507],["gmx.*",508],["mangakita.id",510],["avpgalaxy.net",511],["panda-novel.com",512],["lightsnovel.com",512],["eaglesnovel.com",512],["pandasnovel.com",512],["ewrc-results.com",513],["kizi.com",514],["cyberscoop.com",515],["fedscoop.com",515],["canale.live",516],["jeep-cj.com",517],["sponsorhunter.com",518],["cloudcomputingtopics.net",519],["likecs.com",520],["tiscali.it",521],["linkspy.cc",522],["adshnk.com",523],["chattanoogan.com",524],["adsy.pw",525],["playstore.pw",525],["windowspro.de",526],["tvtv.ca",527],["tvtv.us",527],["mydaddy.cc",528],["roadtrippin.fr",529],["vavada5com.com",530],["anyporn.com",[531,548]],["bravoporn.com",531],["bravoteens.com",531],["crocotube.com",531],["hellmoms.com",531],["hellporno.com",531],["sex3.com",531],["tubewolf.com",531],["xbabe.com",531],["xcum.com",531],["zedporn.com",531],["imagetotext.info",532],["infokik.com",533],["freepik.com",534],["ddwloclawek.pl",[535,536]],["www.seznam.cz",537],["deezer.com",538],["my-subs.co",539],["plaion.com",540],["slideshare.net",[541,542]],["ustreasuryyieldcurve.com",543],["businesssoftwarehere.com",544],["goo.st",544],["freevpshere.com",544],["softwaresolutionshere.com",544],["gamereactor.*",546],["madoohd.com",547],["doomovie-hd.*",547],["staige.tv",549],["androidadult.com",550],["streamvid.net",551],["watchtv24.com",552],["cellmapper.net",553],["medscape.com",554],["newscon.org",[555,556]],["wheelofgold.com",557],["drakecomic.*",557],["app.blubank.com",558],["mobileweb.bankmellat.ir",558],["chat.nrj.fr",559],["chat.tchatche.com",[559,574]],["ccthesims.com",566],["chromeready.com",566],["dtbps3games.com",566],["illustratemagazine.com",566],["uknip.co.uk",566],["vod.pl",567],["megadrive-emulator.com",568],["tvhay.*",[569,570]],["moviesapi.club",571],["bestx.stream",571],["watchx.top",571],["digimanie.cz",572],["svethardware.cz",572],["srvy.ninja",573],["cnn.com",[575,576,577]],["news.bg",578],["edmdls.com",579],["freshremix.net",579],["scenedl.org",579],["trakt.tv",580],["client.falixnodes.net",[581,582]],["shroomers.app",583],["classicalradio.com",584],["di.fm",584],["jazzradio.com",584],["radiotunes.com",584],["rockradio.com",584],["zenradio.com",584],["getthit.com",585],["techedubyte.com",586],["soccerinhd.com",586],["movie-th.tv",587],["iwanttfc.com",588],["nutraingredients-asia.com",589],["nutraingredients-latam.com",589],["nutraingredients-usa.com",589],["nutraingredients.com",589],["ozulscansen.com",590],["nexusmods.com",591],["lookmovie.*",592],["lookmovie2.to",592],["biletomat.pl",594],["hextank.io",[595,596]],["filmizlehdfilm.com",[597,598,599,600]],["filmizletv.*",[597,598,599,600]],["fullfilmizle.cc",[597,598,599,600]],["gofilmizle.net",[597,598,599,600]],["btvplus.bg",602],["sagewater.com",603],["redlion.net",603],["filmweb.pl",604],["satdl.com",605],["vidstreaming.xyz",606],["everand.com",607],["myradioonline.pl",608],["cbs.com",609],["paramountplus.com",609],["fullxh.com",610],["galleryxh.site",610],["megaxh.com",610],["movingxh.world",610],["seexh.com",610],["unlockxh4.com",610],["valuexh.life",610],["xhaccess.com",610],["xhadult2.com",610],["xhadult3.com",610],["xhadult4.com",610],["xhadult5.com",610],["xhamster.*",610],["xhamster1.*",610],["xhamster10.*",610],["xhamster11.*",610],["xhamster12.*",610],["xhamster13.*",610],["xhamster14.*",610],["xhamster15.*",610],["xhamster16.*",610],["xhamster17.*",610],["xhamster18.*",610],["xhamster19.*",610],["xhamster20.*",610],["xhamster2.*",610],["xhamster3.*",610],["xhamster4.*",610],["xhamster42.*",610],["xhamster46.com",610],["xhamster5.*",610],["xhamster7.*",610],["xhamster8.*",610],["xhamsterporno.mx",610],["xhbig.com",610],["xhbranch5.com",610],["xhchannel.com",610],["xhdate.world",610],["xhlease.world",610],["xhmoon5.com",610],["xhofficial.com",610],["xhopen.com",610],["xhplanet1.com",610],["xhplanet2.com",610],["xhreal2.com",610],["xhreal3.com",610],["xhspot.com",610],["xhtotal.com",610],["xhtree.com",610],["xhvictory.com",610],["xhwebsite.com",610],["xhwebsite2.com",610],["xhwebsite5.com",610],["xhwide1.com",610],["xhwide2.com",610],["xhwide5.com",610],["file-upload.net",612],["acortalo.*",[613,614,615,616]],["acortar.*",[613,614,615,616]],["megadescarga.net",[613,614,615,616]],["megadescargas.net",[613,614,615,616]],["hentaihaven.xxx",617],["jacquieetmicheltv2.net",619],["a2zapk.*",620],["fcportables.com",[621,622]],["emurom.net",623],["freethesaurus.com",[624,625]],["thefreedictionary.com",[624,625]],["oeffentlicher-dienst.info",626],["im9.eu",627],["dcdlplayer8a06f4.xyz",628],["ultimate-guitar.com",629],["claimbits.net",630],["sexyscope.net",631],["kickassanime.*",632],["recherche-ebook.fr",633],["virtualdinerbot.com",633],["zonebourse.com",634],["pink-sluts.net",635],["andhrafriends.com",636],["benzinpreis.de",637],["turtleviplay.xyz",638],["defenseone.com",639],["govexec.com",639],["nextgov.com",639],["route-fifty.com",639],["sharing.wtf",640],["wetter3.de",641],["esportivos.fun",642],["cosmonova-broadcast.tv",643],["538.nl",644],["hartvannederland.nl",644],["kijk.nl",644],["shownieuws.nl",644],["vandaaginside.nl",644],["rock.porn",[645,646]],["videzz.net",[647,648]],["ezaudiobookforsoul.com",649],["club386.com",650],["decompiler.com",[651,652]],["littlebigsnake.com",653],["easyfun.gg",654],["smailpro.com",655],["ilgazzettino.it",656],["ilmessaggero.it",656],["3bmeteo.com",[657,658]],["mconverter.eu",659],["lover937.net",660],["10gb.vn",661],["pes6.es",662],["tactics.tools",[663,664]],["boundhub.com",665],["alocdnnetu.xyz",666],["reliabletv.me",667],["jakondo.ru",668],["appnee.com",668],["trueachievements.com",668],["truesteamachievements.com",668],["truetrophies.com",668],["filecrypt.*",669],["wired.com",671],["spankbang.*",[672,673,674,719,720]],["hulu.com",[675,676,677]],["hanime.tv",678],["nhentai.net",[679,680,681]],["pouvideo.*",682],["povvideo.*",682],["povw1deo.*",682],["povwideo.*",682],["powv1deo.*",682],["powvibeo.*",682],["powvideo.*",682],["powvldeo.*",682],["anonymfile.com",683],["gofile.to",683],["dotycat.com",684],["rateyourmusic.com",685],["reporterpb.com.br",686],["blog-dnz.com",688],["18adultgames.com",689],["colnect.com",[690,691]],["adultgamesworld.com",692],["bgmiupdate.com.in",693],["reviewdiv.com",694],["parametric-architecture.com",695],["laurelberninteriors.com",[696,722]],["voiceofdenton.com",697],["concealednation.org",697],["askattest.com",699],["opensubtitles.com",700],["savefiles.com",701],["streamup.ws",702],["goodstream.one",703],["lecrabeinfo.net",704],["cerberusapp.com",705],["smashkarts.io",706],["beamng.wesupply.cx",707],["wowtv.de",[708,709]],["jsfiddle.net",[710,711]],["www.google.*",712],["tacobell.com",713],["zefoy.com",714],["cnet.com",715],["natgeotv.com",718],["globo.com",721],["wayfair.com",723]]);
const exceptionsMap = new Map([["cloudflare.com",[0]],["pingit.com",[171]],["loan.bgmi32bitapk.in",[291]],["lookmovie.studio",[592]]]);
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
