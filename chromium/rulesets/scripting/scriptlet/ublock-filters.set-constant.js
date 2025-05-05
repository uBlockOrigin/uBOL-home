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
const argsList = [["console.clear","undefined"],["adBlockDetected","undefined"],["scrollTo","noopFunc"],["amzn_aps_csm.init","noopFunc"],["akamaiDisableServerIpLookup","noopFunc"],["DD_RUM.addAction","noopFunc"],["nads.createAd","trueFunc"],["ga","noopFunc"],["huecosPBS.nstdX","null"],["DTM.trackAsyncPV","noopFunc"],["_satellite","{}"],["_satellite.getVisitorId","noopFunc"],["newPageViewSpeedtest","noopFunc"],["pubg.unload","noopFunc"],["generateGalleryAd","noopFunc"],["mediator","noopFunc"],["Object.prototype.subscribe","noopFunc"],["gbTracker","{}"],["gbTracker.sendAutoSearchEvent","noopFunc"],["Object.prototype.vjsPlayer.ads","noopFunc"],["network_user_id",""],["google.ima.OmidVerificationVendor","{}"],["Object.prototype.omidAccessModeRules","{}"],["googletag.cmd","{}"],["Object.prototype.setDisableFlashAds","noopFunc"],["DD_RUM.addTiming","noopFunc"],["chameleonVideo.adDisabledRequested","true"],["AdmostClient","{}"],["analytics","{}"],["datalayer","[]"],["Object.prototype.isInitialLoadDisabled","noopFunc"],["listingGoogleEETracking","noopFunc"],["dcsMultiTrack","noopFunc"],["urlStrArray","noopFunc"],["pa","{}"],["Object.prototype.setConfigurations","noopFunc"],["Object.prototype.bk_addPageCtx","noopFunc"],["Object.prototype.bk_doJSTag","noopFunc"],["passFingerPrint","noopFunc"],["optimizely","{}"],["optimizely.initialized","true"],["google_optimize","{}"],["google_optimize.get","noopFunc"],["_gsq","{}"],["_gsq.push","noopFunc"],["stmCustomEvent","noopFunc"],["_gsDevice",""],["iom","{}"],["iom.c","noopFunc"],["_conv_q","{}"],["_conv_q.push","noopFunc"],["google.ima.settings.setDisableFlashAds","noopFunc"],["pa.privacy","{}"],["Object.prototype.getTargetingMap","noopFunc"],["populateClientData4RBA","noopFunc"],["YT.ImaManager","noopFunc"],["UOLPD","{}"],["UOLPD.dataLayer","{}"],["__configuredDFPTags","{}"],["URL_VAST_YOUTUBE","{}"],["Adman","{}"],["dplus","{}"],["dplus.track","noopFunc"],["_satellite.track","noopFunc"],["google.ima.dai","{}"],["gfkS2sExtension","{}"],["gfkS2sExtension.HTML5VODExtension","noopFunc"],["AnalyticsEventTrackingJS","{}"],["AnalyticsEventTrackingJS.addToBasket","noopFunc"],["AnalyticsEventTrackingJS.trackErrorMessage","noopFunc"],["initializeslideshow","noopFunc"],["fathom","{}"],["fathom.trackGoal","noopFunc"],["Origami","{}"],["Origami.fastclick","noopFunc"],["jad","undefined"],["hasAdblocker","true"],["Sentry","{}"],["Sentry.init","noopFunc"],["TRC","{}"],["TRC._taboolaClone","[]"],["fp","{}"],["fp.t","noopFunc"],["fp.s","noopFunc"],["initializeNewRelic","noopFunc"],["turnerAnalyticsObj","{}"],["turnerAnalyticsObj.setVideoObject4AnalyticsProperty","noopFunc"],["optimizelyDatafile","{}"],["optimizelyDatafile.featureFlags","[]"],["fingerprint","{}"],["fingerprint.getCookie","noopFunc"],["gform.utils","noopFunc"],["gform.utils.trigger","noopFunc"],["get_fingerprint","noopFunc"],["moatPrebidApi","{}"],["moatPrebidApi.getMoatTargetingForPage","noopFunc"],["cpd_configdata","{}"],["cpd_configdata.url",""],["yieldlove_cmd","{}"],["yieldlove_cmd.push","noopFunc"],["dataLayer.push","noopFunc"],["_etmc","{}"],["_etmc.push","noopFunc"],["freshpaint","{}"],["freshpaint.track","noopFunc"],["ShowRewards","noopFunc"],["stLight","{}"],["stLight.options","noopFunc"],["DD_RUM.addError","noopFunc"],["sensorsDataAnalytic201505","{}"],["sensorsDataAnalytic201505.init","noopFunc"],["sensorsDataAnalytic201505.quick","noopFunc"],["sensorsDataAnalytic201505.track","noopFunc"],["s","{}"],["s.tl","noopFunc"],["smartech","noopFunc"],["sensors","{}"],["sensors.init","noopFunc"],["sensors.track","noopFunc"],["adn","{}"],["adn.clearDivs","noopFunc"],["_vwo_code","{}"],["gtag","noopFunc"],["_taboola","{}"],["_taboola.push","noopFunc"],["clicky","{}"],["clicky.goal","noopFunc"],["WURFL","{}"],["_sp_.config.events.onSPPMObjectReady","noopFunc"],["gtm","{}"],["gtm.trackEvent","noopFunc"],["mParticle.Identity.getCurrentUser","noopFunc"],["JSGlobals.prebidEnabled","false"],["elasticApm","{}"],["elasticApm.init","noopFunc"],["Object.prototype.que","noopFunc"],["Object.prototype.que.push","noopFunc"],["ga.sendGaEvent","noopFunc"],["adobe","{}"],["MT","{}"],["MT.track","noopFunc"],["adex","{}"],["adex.getAdexUser","noopFunc"],["Adkit","noopFunc"],["Object.prototype.shouldExpectGoogleCMP","false"],["apntag.refresh","noopFunc"],["ytInitialPlayerResponse.playerAds","undefined"],["ytInitialPlayerResponse.adPlacements","undefined"],["ytInitialPlayerResponse.adSlots","undefined"],["playerResponse.adPlacements","undefined"],["nsShowMaxCount","0"],["objVc.interstitial_web",""],["_ml_ads_ns","null"],["_sp_.config","undefined"],["isAdBlockActive","false"],["AdController","noopFunc"],["console.clear","noopFunc"],["console.log","noopFunc"],["Object.prototype.hideAds","true"],["Object.prototype._getSalesHouseConfigurations","noopFunc"],["vast_urls","{}"],["sadbl","false"],["adblockcheck","false"],["arrvast","[]"],["blurred","false"],["flashvars.adv_pre_src",""],["showPopunder","false"],["page_params.holiday_promo","true"],["adsEnabled","true"],["String.prototype.charAt","trueFunc"],["ad_blocker","false"],["blockAdBlock","true"],["VikiPlayer.prototype.pingAbFactor","noopFunc"],["player.options.disableAds","true"],["console.clear","trueFunc"],["flashvars.adv_pre_vast",""],["flashvars.adv_pre_vast_alt",""],["x_width","1"],["_site_ads_ns","true"],["luxuretv.config",""],["Object.prototype.AdOverlay","noopFunc"],["tkn_popunder","null"],["can_run_ads","true"],["adsBlockerDetector","noopFunc"],["globalThis","null"],["adblock","false"],["__ads","true"],["FlixPop.isPopGloballyEnabled","falseFunc"],["check_adblock","true"],["$.magnificPopup.open","noopFunc"],["adsenseadBlock","noopFunc"],["adblockSuspected","false"],["xRds","true"],["cRAds","false"],["String.prototype.charCodeAt","trueFunc"],["disasterpingu","false"],["App.views.adsView.adblock","false"],["flashvars.adv_pause_html",""],["$.fx.off","true"],["isAdb","false"],["adBlockEnabled","false"],["puShown","true"],["ads_b_test","true"],["showAds","true"],["attr","{}"],["scriptSrc",""],["cxStartDetectionProcess","noopFunc"],["isAdBlocked","false"],["adblock","noopFunc"],["path",""],["_ctrl_vt.blocked.ad_script","false"],["blockAdBlock","noopFunc"],["caca","noopFunc"],["Ok","true"],["safelink.adblock","false"],["openPopunder","noopFunc"],["ClickUnder","noopFunc"],["flashvars.adv_pre_url",""],["flashvars.protect_block",""],["flashvars.video_click_url",""],["adBlock","false"],["spoof","noopFunc"],["btoa","null"],["sp_ad","true"],["adsBlocked","false"],["_sp_.msg.displayMessage","noopFunc"],["CaptchmeState.adb","undefined"],["indexedDB.open","trueFunc"],["UhasAB","false"],["adNotificationDetected","false"],["atob","noopFunc"],["_pop","noopFunc"],["CnnXt.Event.fire","noopFunc"],["_ti_update_user","noopFunc"],["valid","1"],["vastAds","[]"],["adblock","1"],["frg","1"],["time","0"],["ads","true"],["GNCA_Ad_Support","true"],["Date.now","noopFunc"],["jQuery.adblock","1"],["VMG.Components.Adblock","false"],["_n_app.popunder","null"],["N_BetterJsPop.object","{}"],["adblockDetector","trueFunc"],["hasPoped","true"],["flashvars.video_click_url","undefined"],["flashvars.adv_start_html",""],["flashvars.popunder_url",""],["flashvars.adv_post_src",""],["flashvars.adv_post_url",""],["jQuery.adblock","false"],["google_jobrunner","true"],["sec","0"],["gadb","false"],["checkadBlock","noopFunc"],["clientSide.adbDetect","noopFunc"],["HTMLAnchorElement.prototype.click","noopFunc"],["cmnnrunads","true"],["adBlocker","false"],["adBlockDetected","noopFunc"],["StileApp.somecontrols.adBlockDetected","noopFunc"],["MDCore.adblock","0"],["google_tag_data","noopFunc"],["noAdBlock","true"],["adsOk","true"],["check","true"],["isal","true"],["document.hidden","true"],["awm","true"],["adblockEnabled","false"],["is_adblocked","false"],["ABLK","false"],["pogo.intermission.staticAdIntermissionPeriod","0"],["SubmitDownload1","noopFunc"],["t","0"],["ckaduMobilePop","noopFunc"],["tieneAdblock","0"],["adsAreBlocked","false"],["cmgpbjs","false"],["displayAdblockOverlay","false"],["google","false"],["Math.pow","noopFunc"],["openInNewTab","noopFunc"],["runAdBlocker","false"],["Adblock","false"],["flashvars.logo_url",""],["flashvars.logo_text",""],["nlf.custom.userCapabilities","false"],["count","0"],["LoadThisScript","true"],["showPremLite","true"],["closeBlockerModal","false"],["adBlockDetector.isEnabled","falseFunc"],["areAdsDisplayed","true"],["gkAdsWerbung","true"],["document.bridCanRunAds","true"],["pop_target","null"],["is_banner","true"],["$easyadvtblock","false"],["show_dfp_preroll","false"],["show_youtube_preroll","false"],["doads","true"],["jsUnda","noopFunc"],["AlobaidiDetectAdBlock","true"],["Advertisement","1"],["adBlockDetected","false"],["abp1","1"],["pr_okvalida","true"],["$.ajax","trueFunc"],["cnbc.canShowAds","true"],["ue_adb_chk","1"],["firefaucet","true"],["cRAds","true"],["uas","[]"],["flashvars.popunder_url","undefined"],["adv","true"],["prerollMain","undefined"],["canRunAds","true"],["Fingerprint2","true"],["dclm_ajax_var.disclaimer_redirect_url",""],["load_pop_power","noopFunc"],["adBlockDetected","true"],["Time_Start","0"],["blockAdBlock","trueFunc"],["ezstandalone.enabled","true"],["foundation.adPlayer.bitmovin","{}"],["DL8_GLOBALS.enableAdSupport","false"],["DL8_GLOBALS.useHomad","false"],["DL8_GLOBALS.enableHomadDesktop","false"],["DL8_GLOBALS.enableHomadMobile","false"],["Object.prototype.adReinsertion","noopFunc"],["getHomadConfig","noopFunc"],["ab","false"],["go_popup","{}"],["noBlocker","true"],["adsbygoogle","null"],["fabActive","false"],["gWkbAdVert","true"],["noblock","true"],["wgAffiliateEnabled","false"],["ads","null"],["detectAdblock","noopFunc"],["adsLoadable","true"],["ASSetCookieAds","null"],["letShowAds","true"],["ulp_noadb","true"],["Object.prototype.adblock_detected","false"],["timeSec","0"],["adsbygoogle.loaded","true"],["ads_unblocked","true"],["xxSetting.adBlockerDetection","false"],["open","undefined"],["Drupal.behaviors.adBlockerPopup","null"],["fake_ad","true"],["koddostu_com_adblock_yok","null"],["adsbygoogle","trueFunc"],["player.ads.cuePoints","undefined"],["adBlockDetected","null"],["better_ads_adblock","1"],["Adv_ab","false"],["sgpbCanRunAds","true"],["document.hidden","false"],["document.hasFocus","trueFunc"],["hasFocus","trueFunc"],["navigator.brave","undefined"],["Object.prototype.isAllAdClose","true"],["isRequestPresent","true"],["fouty","true"],["Notification","undefined"],["protection","noopFunc"],["private","false"],["navigator.webkitTemporaryStorage.queryUsageAndQuota","noopFunc"],["document.onkeydown","noopFunc"],["showadas","true"],["alert","throwFunc"],["iktimer","0"],["aSl.gcd","0"],["window.adLink","null"],["detectedAdblock","undefined"],["isTabActive","true"],["clicked","2"],["ov.advertising.tisoomi.loadScript","noopFunc"],["abp","false"],["hommy","{}"],["hommy.waitUntil","noopFunc"],["flashvars.mlogo",""],["vpPrerollVideo","undefined"],["hold_click","false"],["admiral","noopFunc"],["gnt.u.adfree","true"],["__INITIAL_DATA__.siteData.admiralScript"],["objAd.loadAdShield","noopFunc"],["window.myAd.runAd","noopFunc"],["__INITIAL_STATE__.config.theme.ads.isAdBlockerEnabled","false"],["__INITIAL_STATE__.gameLists.gamesNoPrerollIds.indexOf","trueFunc"],["document.ontouchend","null"],["document.onclick","null"],["pubAdsService","trueFunc"],["config.pauseInspect","false"],["appContext.adManager.context.current.adFriendly","false"],["blockAdBlock._options.baitClass","null"],["document.blocked_var","1"],["____ads_js_blocked","false"],["wIsAdBlocked","false"],["WebSite.plsDisableAdBlock","null"],["ads_blocked","false"],["samDetected","false"],["countClicks","0"],["settings.adBlockerDetection","false"],["mixpanel.get_distinct_id","true"],["fuckAdBlock._options.baitClass","null"],["bscheck.adblocker","noopFunc"],["qpcheck.ads","noopFunc"],["isContentBlocked","falseFunc"],["CloudflareApps.installs.Ik7rmQ4t95Qk.options.measureDomain","undefined"],["detectAB1","noopFunc"],["uBlockOriginDetected","false"],["googletag._vars_","{}"],["googletag._loadStarted_","true"],["googletag._loaded_","true"],["google_unique_id","1"],["google.javascript","{}"],["google.javascript.ads","{}"],["google_global_correlator","1"],["paywallGateway.truncateContent","noopFunc"],["adBlockDisabled","true"],["blockedElement","noopFunc"],["popit","false"],["adBlockerDetected","false"],["abu","falseFunc"],["countdown","0"],["decodeURI","noopFunc"],["flashvars.adv_postpause_vast",""],["univresalP","noopFunc"],["xv_ad_block","0"],["openWindow","noopFunc"],["vidorev_jav_plugin_video_ads_object.vid_ads_m_video_ads",""],["adsProvider.init","noopFunc"],["SDKLoaded","true"],["blockAdBlock._creatBait","null"],["POPUNDER_ENABLED","false"],["plugins.preroll","noopFunc"],["errcode","0"],["DHAntiAdBlocker","true"],["showada","true"],["showax","true"],["p18","undefined"],["ADBLOCKED","false"],["Object.prototype.adsEnabled","false"],["adb","0"],["String.fromCharCode","trueFunc"],["adblock_use","false"],["Object.prototype.adblockFound","false"],["nitroAds.loaded","true"],["createCanvas","noopFunc"],["playerAdSettings.adLink",""],["playerAdSettings.waitTime","0"],["xv.sda.pp.init","noopFunc"],["isAdsLoaded","true"],["adblockerAlert","noopFunc"],["Object.prototype.parseXML","noopFunc"],["Object.prototype.blackscreenDuration","1"],["Object.prototype.adPlayerId",""],["adblockDetect","noopFunc"],["style","noopFunc"],["history.pushState","noopFunc"],["google_unique_id","6"],["__NEXT_DATA__.props.pageProps.adsConfig","undefined"],["new_config.timedown","0"],["truex","{}"],["truex.client","noopFunc"],["hiddenProxyDetected","false"],["isadb","false"],["SteadyWidgetSettings.adblockActive","false"],["proclayer","noopFunc"],["timeleft","0"],["load_ads","trueFunc"],["detectAdBlock","noopFunc"],["starPop","1"],["Object.prototype.ads","noopFunc"],["detectBlockAds","noopFunc"],["ga","trueFunc"],["ad_link",""],["penciBlocksArray","[]"],["App.AdblockDetected","false"],["SF.adblock","true"],["startfrom","0"],["D4zz","noopFunc"],["Object.prototype.ads.nopreroll_","true"],["HP_Scout.adBlocked","false"],["SD_IS_BLOCKING","false"],["Object.prototype.isPremium","true"],["__BACKPLANE_API__.renderOptions.showAdBlock",""],["Object.prototype.isNoAds","{}"],["tv3Cmp.ConsentGiven","true"],["countDownDate","0"],["setupSkin","noopFunc"],["Object.prototype.enableInterstitial","false"],["ads","undefined"],["td_ad_background_click_link","undefined"],["ADBLOCK","false"],["POSTPART_prototype.ADKEY","noopFunc"],["adBlockDetected","falseFunc"],["divWidth","1"],["noAdBlock","noopFunc"],["AdService.info.abd","noopFunc"],["adBlockDetectionResult","undefined"],["popped","true"],["puShown1","true"],["passthetest","true"],["timeset","0"],["pandaAdviewValidate","true"],["canGetAds","true"],["ad_blocker_active","false"],["init_welcome_ad","noopFunc"],["moneyAbovePrivacyByvCDN","true"],["document.body.contains","trueFunc"],["popunder","undefined"],["distance","0"],["document.onclick",""],["adEnable","true"],["displayAds","0"],["_adshrink.skiptime","0"],["AbleToRunAds","true"],["PreRollAd.timeCounter","0"],["TextEncoder","undefined"],["abpblocked","undefined"],["app.showModalAd","noopFunc"],["paAddUnit","noopFunc"],["adt","0"],["test_adblock","noopFunc"],["adblockDetector","noopFunc"],["vastEnabled","false"],["detectadsbocker","false"],["two_worker_data_js.js","[]"],["FEATURE_DISABLE_ADOBE_POPUP_BY_COUNTRY","true"],["questpassGuard","noopFunc"],["isAdBlockerEnabled","false"],["sssp","emptyObj"],["smartLoaded","true"],["timeLeft","0"],["Cookiebot","noopFunc"],["feature_flags.interstitial_ads_flag","false"],["feature_flags.interstitials_every_four_slides","false"],["waldoSlotIds","true"],["adblockstatus","false"],["adScriptLoaded","true"],["adblockEnabled","noopFunc"],["adSettings","[]"],["banner_is_blocked","false"],["Object.prototype.adBlocked","false"],["chp_adblock_browser","noopFunc"],["googleAd","true"],["Brid.A9.prototype.backfillAdUnits","[]"],["dct","0"],["slideShow.displayInterstitial","true"],["googletag","true"],["tOS2","150"],["checkAdBlocker","noopFunc"],["PlayerConfig.config.CustomAdSetting","[]"],["navigator.standalone","true"],["ShowAdvertising","{}"],["empire.pop","undefined"],["empire.direct","undefined"],["empire.directHideAds","undefined"],["empire.mediaData.advisorMovie","1"],["empire.mediaData.advisorSerie","1"],["setTimer","0"],["penci_adlbock.ad_blocker_detector","0"],["Object.prototype.adblockDetector","noopFunc"],["blext","true"],["vidorev_jav_plugin_video_ads_object","{}"],["vidorev_jav_plugin_video_ads_object_post","{}"],["S_Popup","10"],["rabLimit","-1"],["nudgeAdBlock","noopFunc"],["feedBack.showAffilaePromo","noopFunc"],["FAVE.settings.ads.ssai.prod.clips.enabled","false"],["FAVE.settings.ads.ssai.prod.liveAuth.enabled","false"],["FAVE.settings.ads.ssai.prod.liveUnauth.enabled","false"],["loadpagecheck","noopFunc"],["art3m1sItemNames.affiliate-wrapper","\"\""],["window.adngin","{}"],["amzn_aps_csm","{}"],["amzn_aps_csm.define","noopFunc"],["isAdBlockerActive","noopFunc"],["di.app.WebplayerApp.Ads.Adblocks.app.AdBlockDetectApp.startWithParent","false"],["sharedController.adblockDetector","noopFunc"],["checkAdsStatus","noopFunc"],["ads","[]"],["settings.adBlockDetectionEnabled","false"],["displayInterstitialAdConfig","false"],["checkAdBlockeraz","noopFunc"],["blockingAds","false"],["Yii2App.playbackTimeout","0"],["QiyiPlayerProphetData.a.data","{}"],["toggleAdBlockInfo","falseFunc"],["aipAPItag.prerollSkipped","true"],["aipAPItag.setPreRollStatus","trueFunc"],["reklam_1_saniye","0"],["reklam_1_gecsaniye","0"],["reklamsayisi","1"],["reklam_1",""],["powerAPITag","emptyObj"],["playerEnhancedConfig.run","throwFunc"],["aoAdBlockDetected","false"],["rodo.checkIsDidomiConsent","noopFunc"],["rodo.waitForConsent","noopPromiseResolve"],["xtime","0"],["Div_popup",""],["Scribd.Blob.AdBlockerModal","noopFunc"],["AddAdsV2I.addBlock","false"],["hasAdBlocker","false"],["initials.yld-pdpopunder",""],["download_click","true"],["advertisement3","true"],["importFAB","undefined"],["clicked","true"],["eClicked","true"],["number","0"],["sync","true"],["PlayerLogic.prototype.detectADB","noopFunc"],["showPopunder","noopFunc"],["Object.prototype.prerollAds","[]"],["notifyMe","noopFunc"],["adsClasses","undefined"],["gsecs","0"],["dvsize","52"],["majorse","true"],["completed","1"],["testerli","false"],["w87.abd","noopFunc"],["document.referrer",""],["Object.prototype.setNeedShowAdblockWarning","noopFunc"],["NoAdBlock","noopFunc"],["adList","[]"],["ifmax","true"],["nitroAds.abp","true"],["onloadUI","noopFunc"],["PageLoader.DetectAb","0"],["one_time","1"],["consentGiven","true"],["playID","1"],["GEMG.GPT.Interstitial","noopFunc"],["amiblock","0"],["karte3","18"],["sandDetect","noopFunc"],["amodule.data","emptyArr"],["Object.prototype.ADBLOCK_DETECTION",""],["postroll","undefined"],["interstitial","undefined"],["isAdBlockDetected","false"],["pData.adblockOverlayEnabled","0"],["cabdSettings","undefined"],["td_ad_background_click_link"],["ADS.isBannersEnabled","false"],["EASYFUN_ADS_CAN_RUN","true"],["adsbygoogle_ama_fc_has_run","true"],["jwDefaults.advertising","{}"],["elimina_profilazione","1"],["elimina_pubblicita","1"],["abd","{}"],["checkerimg","noopFunc"],["detectedAdblock","noopFunc"],["Object.prototype.DetectByGoogleAd","noopFunc"],["nitroAds","{}"],["nitroAds.createAd","noopFunc"],["NativeAd","noopFunc"],["Blob","noopFunc"],["window.navigator.brave","undefined"],["HTMLScriptElement.prototype.onerror","undefined"],["isAdblock","false"],["openPop","noopFunc"],["attachEvent","trueFunc"],["cns.library","true"],["BJSShowUnder","{}"],["BJSShowUnder.bindTo","noopFunc"],["BJSShowUnder.add","noopFunc"],["Object.prototype._parseVAST","noopFunc"],["Object.prototype.createAdBlocker","noopFunc"],["Object.prototype.isAdPeriod","falseFunc"],["countDown","0"],["runCheck","noopFunc"],["adsSlotRenderEndSeen","true"],["showModal","noopFunc"],["flashvars.mlogo_link",""],["isAdBlocked","noopFunc"],["URLlist","[]"],["aaw","{}"],["aaw.processAdsOnPage","noopFunc"],["doOpen","undefined"],["HTMLImageElement.prototype.onerror","undefined"],["FOXIZ_MAIN_SCRIPT.siteAccessDetector","noopFunc"],["openAdBlockPopup","noopFunc"],["Object.prototype._adsDisabled","true"],["advanced_ads_check_adblocker","noopFunc"],["canRunAds","1"],["attestHasAdBlockerActivated","true"],["extInstalled","true"],["SaveFiles.add","noopFunc"],["detectSandbox","noopFunc"],["rwt","noopFunc"],["bmak.js_post","false"],["firebase.analytics","noopFunc"],["Object.prototype.updateModifiedCommerceUrl","noopFunc"],["flashvars.event_reporting",""],["Object.prototype.has_opted_out_tracking","trueFunc"],["Visitor","{}"],["send_gravity_event","noopFunc"],["send_recommendation_event","noopFunc"],["libAnalytics.data.get","noopFunc"],["adthrive._components.start","noopFunc"],["navigator.sendBeacon","noopFunc"]];
const hostnamesMap = new Map([["jonathansociallike.com",0],["gogoanime.*",[0,188]],["adrianmissionminute.com",0],["alejandrocenturyoil.com",0],["alleneconomicmatter.com",0],["apinchcaseation.com",0],["bethshouldercan.com",0],["bigclatterhomesguideservice.com",0],["bradleyviewdoctor.com",0],["brittneystandardwestern.com",0],["brookethoughi.com",0],["brucevotewithin.com",0],["cindyeyefinal.com",0],["denisegrowthwide.com",0],["diananatureforeign.com",0],["donaldlineelse.com",0],["edwardarriveoften.com",0],["erikcoldperson.com",0],["evelynthankregion.com",0],["graceaddresscommunity.com",0],["heatherdiscussionwhen.com",0],["heatherwholeinvolve.com",0],["housecardsummerbutton.com",0],["jamessoundcost.com",0],["jamesstartstudent.com",0],["jamiesamewalk.com",0],["jasminetesttry.com",0],["jasonresponsemeasure.com",0],["jayservicestuff.com",0],["jennifercertaindevelopment.com",0],["jessicaglassauthor.com",0],["johntryopen.com",0],["josephseveralconcern.com",0],["kennethofficialitem.com",0],["kristiesoundsimply.com",0],["lisatrialidea.com",0],["lorimuchbenefit.com",0],["loriwithinfamily.com",0],["lukecomparetwo.com",0],["markstyleall.com",0],["michaelapplysome.com",0],["morganoperationface.com",0],["nathanfromsubject.com",0],["nectareousoverelate.com",0],["paulkitchendark.com",0],["rebeccaneverbase.com",0],["richardsignfish.com",0],["roberteachfinal.com",0],["robertordercharacter.com",0],["robertplacespace.com",0],["ryanagoinvolve.com",0],["sandratableother.com",0],["sandrataxeight.com",0],["seanshowcould.com",0],["sethniceletter.com",0],["shannonpersonalcost.com",0],["sharonwhiledemocratic.com",0],["stevenimaginelittle.com",0],["strawberriesporail.com",0],["susanhavekeep.com",0],["timberwoodanotia.com",0],["tinycat-voe-fashion.com",0],["toddpartneranimal.com",0],["troyyourlead.com",0],["uptodatefinishconference.com",0],["uptodatefinishconferenceroom.com",0],["vincentincludesuccessful.com",0],["voe.sx",0],["maxfinishseveral.com",0],["voe.sx>>",0],["javboys.tv>>",0],["freeplayervideo.com",0],["nazarickol.com",0],["player-cdn.com",0],["playhydrax.com",[0,398,399]],["rabbitstream.net",0],["projectfreetv.one",0],["fmovies.*",0],["u26bekrb.fun",1],["pvpoke-re.com",2],["client.falixnodes.net",[3,585,586,587]],["br.de",4],["indeed.com",5],["pasteboard.co",6],["clickhole.com",7],["deadspin.com",7],["gizmodo.com",7],["jalopnik.com",7],["jezebel.com",7],["kotaku.com",7],["lifehacker.com",7],["splinternews.com",7],["theinventory.com",7],["theonion.com",7],["theroot.com",7],["thetakeout.com",7],["pewresearch.org",7],["los40.com",[8,9]],["as.com",9],["telegraph.co.uk",[10,11]],["poweredbycovermore.com",[10,63]],["lumens.com",[10,63]],["verizon.com",12],["humanbenchmark.com",13],["politico.com",14],["officedepot.co.cr",[15,16]],["officedepot.*",[17,18]],["usnews.com",19],["coolmathgames.com",[20,281,282,283]],["video.gazzetta.it",[21,22]],["oggi.it",[21,22]],["manoramamax.com",21],["factable.com",23],["zee5.com",24],["gala.fr",25],["geo.fr",25],["voici.fr",25],["gloucestershirelive.co.uk",26],["arsiv.mackolik.com",27],["jacksonguitars.com",28],["scandichotels.com",29],["stylist.co.uk",30],["nettiauto.com",31],["thaiairways.com",[32,33]],["cerbahealthcare.it",[34,35]],["futura-sciences.com",[34,52]],["toureiffel.paris",34],["tiendaenlinea.claro.com.ni",[36,37]],["tieba.baidu.com",38],["fandom.com",[39,40,342]],["grasshopper.com",[41,42]],["epson.com.cn",[43,44,45,46]],["oe24.at",[47,48]],["szbz.de",47],["platform.autods.com",[49,50]],["kcra.com",51],["wcvb.com",51],["sportdeutschland.tv",51],["wikihow.com",53],["citibank.com.sg",54],["uol.com.br",[55,56,57,58,59]],["gazzetta.gr",60],["digicol.dpm.org.cn",[61,62]],["virginmediatelevision.ie",64],["larazon.es",[65,66]],["waitrosecellar.com",[67,68,69]],["kicker.de",[70,384]],["sharpen-free-design-generator.netlify.app",[71,72]],["help.cashctrl.com",[73,74]],["gry-online.pl",75],["vidaextra.com",76],["commande.rhinov.pro",[77,78]],["ecom.wixapps.net",[77,78]],["tipranks.com",[79,80]],["iceland.co.uk",[81,82,83]],["socket.pearsoned.com",84],["tntdrama.com",[85,86]],["trutv.com",[85,86]],["mobile.de",[87,88]],["ioe.vn",[89,90]],["geiriadur.ac.uk",[89,93]],["welsh-dictionary.ac.uk",[89,93]],["bikeportland.org",[91,92]],["biologianet.com",[56,57,58]],["10play.com.au",[94,95]],["sunshine-live.de",[96,97]],["whatismyip.com",[98,99]],["myfitnesspal.com",100],["netoff.co.jp",[101,102]],["foundit.*",[103,104]],["clickjogos.com.br",105],["bristan.com",[106,107]],["zillow.com",108],["share.hntv.tv",[109,110,111,112]],["forum.dji.com",[109,112]],["unionpayintl.com",[109,111]],["streamelements.com",109],["optimum.net",[113,114]],["hdfcfund.com",115],["user.guancha.cn",[116,117]],["sosovalue.com",118],["bandyforbundet.no",[119,120]],["tatacommunications.com",121],["suamusica.com.br",[122,123,124]],["macrotrends.net",[125,126]],["code.world",127],["smartcharts.net",127],["topgear.com",128],["eservice.directauto.com",[129,130]],["nbcsports.com",131],["standard.co.uk",132],["pruefernavi.de",[133,134]],["speedtest.net",[135,136]],["17track.net",137],["visible.com",138],["hagerty.com",[139,140]],["kino.de",[141,142]],["9now.nine.com.au",143],["worldstar.com",144],["prisjakt.no",145],["m.youtube.com",[146,147,148,149]],["music.youtube.com",[146,147,148,149]],["tv.youtube.com",[146,147,148,149]],["www.youtube.com",[146,147,148,149]],["youtubekids.com",[146,147,148,149]],["youtube-nocookie.com",[146,147,148,149]],["eu-proxy.startpage.com",[146,147,149]],["timesofindia.indiatimes.com",150],["economictimes.indiatimes.com",151],["motherless.com",152],["sueddeutsche.de",153],["watchanimesub.net",154],["wco.tv",154],["wcoanimesub.tv",154],["wcoforever.net",154],["freeviewmovies.com",154],["filehorse.com",154],["guidetnt.com",154],["starmusiq.*",154],["sp-today.com",154],["linkvertise.com",154],["eropaste.net",154],["getpaste.link",154],["sharetext.me",154],["wcofun.*",154],["note.sieuthuthuat.com",154],["elcriticodelatele.com",[154,446]],["gadgets.es",[154,446]],["amateurporn.co",[154,250]],["wiwo.de",155],["primewire.*",156],["streanplay.*",[156,157]],["alphaporno.com",[156,535]],["porngem.com",156],["shortit.pw",[156,234]],["familyporn.tv",156],["sbplay.*",156],["id45.cyou",156],["85tube.com",[156,218]],["milfnut.*",156],["k1nk.co",156],["watchasians.cc",156],["soltoshindo.com",156],["sankakucomplex.com",158],["player.glomex.com",159],["merkur.de",159],["tz.de",159],["sxyprn.*",160],["hqq.*",[161,162]],["waaw.*",[162,163]],["hotpornfile.org",162],["player.tabooporns.com",162],["x69.ovh",162],["wiztube.xyz",162],["younetu.*",162],["multiup.us",162],["peliculas8k.com",[162,163]],["video.q34r.org",162],["czxxx.org",162],["vtplayer.online",162],["vvtplayer.*",162],["netu.ac",162],["netu.frembed.lol",162],["dirtyvideo.fun",163],["adbull.org",164],["123link.*",164],["adshort.*",164],["mitly.us",164],["linkrex.net",164],["linx.cc",164],["oke.io",164],["linkshorts.*",164],["dz4link.com",164],["adsrt.*",164],["linclik.com",164],["shrt10.com",164],["vinaurl.*",164],["loptelink.com",164],["adfloz.*",164],["cut-fly.com",164],["linkfinal.com",164],["payskip.org",164],["cutpaid.com",164],["linkjust.com",164],["leechpremium.link",164],["icutlink.com",[164,255]],["oncehelp.com",164],["rgl.vn",164],["reqlinks.net",164],["bitlk.com",164],["qlinks.eu",164],["link.3dmili.com",164],["short-fly.com",164],["foxseotools.com",164],["dutchycorp.*",164],["shortearn.*",164],["pingit.*",164],["link.turkdown.com",164],["7r6.com",164],["oko.sh",164],["ckk.ai",164],["fc.lc",164],["fstore.biz",164],["shrink.*",164],["cuts-url.com",164],["eio.io",164],["exe.app",164],["exee.io",164],["exey.io",164],["skincarie.com",164],["exeo.app",164],["tmearn.*",164],["coinlyhub.com",[164,321]],["adsafelink.com",164],["aii.sh",164],["megalink.*",164],["cybertechng.com",[164,336]],["cutdl.xyz",164],["iir.ai",164],["shorteet.com",[164,354]],["miniurl.*",164],["smoner.com",164],["gplinks.*",164],["odisha-remix.com",[164,336]],["xpshort.com",[164,336]],["upshrink.com",164],["clk.*",164],["easysky.in",164],["veganab.co",164],["go.bloggingaro.com",164],["go.gyanitheme.com",164],["go.theforyou.in",164],["go.hipsonyc.com",164],["birdurls.com",164],["vipurl.in",164],["try2link.com",164],["jameeltips.us",164],["gainl.ink",164],["promo-visits.site",164],["satoshi-win.xyz",[164,370]],["shorterall.com",164],["encurtandourl.com",164],["forextrader.site",164],["postazap.com",164],["cety.app",164],["exego.app",[164,365]],["cutlink.net",164],["cutsy.net",164],["cutyurls.com",164],["cutty.app",164],["cutnet.net",164],["jixo.online",164],["tinys.click",[164,336]],["cpm.icu",164],["panyshort.link",164],["enagato.com",164],["pandaznetwork.com",164],["tpi.li",164],["oii.la",164],["recipestutorials.com",164],["pureshort.*",164],["shrinke.*",164],["shrinkme.*",164],["shrinkforearn.in",164],["oii.io",164],["du-link.in",164],["atglinks.com",164],["thotpacks.xyz",164],["megaurl.in",164],["megafly.in",164],["simana.online",164],["fooak.com",164],["joktop.com",164],["evernia.site",164],["falpus.com",164],["link.paid4link.com",164],["exalink.fun",164],["shortxlinks.com",164],["upfion.com",164],["upfiles.app",164],["upfiles-urls.com",164],["flycutlink.com",[164,336]],["linksly.co",164],["link1s.*",164],["pkr.pw",164],["imagenesderopaparaperros.com",164],["shortenbuddy.com",164],["apksvip.com",164],["4cash.me",164],["namaidani.com",164],["shortzzy.*",164],["teknomuda.com",164],["shorttey.*",[164,320]],["miuiku.com",164],["savelink.site",164],["lite-link.*",164],["adcorto.*",164],["samaa-pro.com",164],["miklpro.com",164],["modapk.link",164],["ccurl.net",164],["linkpoi.me",164],["menjelajahi.com",164],["pewgame.com",164],["haonguyen.top",164],["zshort.*",164],["crazyblog.in",164],["gtlink.co",164],["cutearn.net",164],["rshrt.com",164],["filezipa.com",164],["dz-linkk.com",164],["upfiles.*",164],["theblissempire.com",164],["finanzas-vida.com",164],["adurly.cc",164],["paid4.link",164],["link.asiaon.top",164],["go.gets4link.com",164],["linkfly.*",164],["beingtek.com",164],["shorturl.unityassets4free.com",164],["disheye.com",164],["techymedies.com",164],["techysuccess.com",164],["za.gl",[164,270]],["bblink.com",164],["myad.biz",164],["swzz.xyz",164],["vevioz.com",164],["charexempire.com",164],["clk.asia",164],["linka.click",164],["sturls.com",164],["myshrinker.com",164],["snowurl.com",[164,336]],["netfile.cc",164],["wplink.*",164],["rocklink.in",164],["techgeek.digital",164],["download3s.net",164],["shortx.net",164],["shortawy.com",164],["tlin.me",164],["apprepack.com",164],["up-load.one",164],["zuba.link",164],["bestcash2020.com",164],["hoxiin.com",164],["paylinnk.com",164],["thizissam.in",164],["ier.ai",164],["adslink.pw",164],["novelssites.com",164],["links.medipost.org",164],["faucetcrypto.net",164],["short.freeltc.top",164],["trxking.xyz",164],["weadown.com",164],["m.bloggingguidance.com",164],["blog.onroid.com",164],["link.codevn.net",164],["upfilesurls.com",164],["link4rev.site",164],["c2g.at",164],["bitcosite.com",[164,549]],["cryptosh.pro",164],["link68.net",164],["traffic123.net",164],["windowslite.net",[164,336]],["viewfr.com",164],["cl1ca.com",164],["4br.me",164],["fir3.net",164],["seulink.*",164],["encurtalink.*",164],["kiddyshort.com",164],["watchmygf.me",[165,189]],["camwhores.*",[165,175,217,218,219]],["camwhorez.tv",[165,175,217,218]],["cambay.tv",[165,197,217,247,249,250,251,252]],["fpo.xxx",[165,197]],["sexemix.com",165],["heavyfetish.com",[165,708]],["thotcity.su",165],["viralxxxporn.com",[165,388]],["tube8.*",[166,167]],["you-porn.com",167],["youporn.*",167],["youporngay.com",167],["youpornru.com",167],["redtube.*",167],["9908ww.com",167],["adelaidepawnbroker.com",167],["bztube.com",167],["hotovs.com",167],["insuredhome.org",167],["nudegista.com",167],["pornluck.com",167],["vidd.se",167],["pornhub.*",[167,309]],["pornhub.com",167],["pornerbros.com",168],["freep.com",168],["porn.com",169],["tune.pk",170],["noticias.gospelmais.com.br",171],["techperiod.com",171],["viki.com",[172,173]],["watch-series.*",174],["watchseries.*",174],["vev.*",174],["vidop.*",174],["vidup.*",174],["sleazyneasy.com",[175,176,177]],["smutr.com",[175,317]],["tktube.com",175],["yourporngod.com",[175,176]],["javbangers.com",[175,435]],["camfox.com",175],["camthots.tv",[175,247]],["shegotass.info",175],["amateur8.com",175],["bigtitslust.com",175],["ebony8.com",175],["freeporn8.com",175],["lesbian8.com",175],["maturetubehere.com",175],["sortporn.com",175],["motherporno.com",[175,176,197,249]],["theporngod.com",[175,176]],["watchdirty.to",[175,218,219,250]],["pornsocket.com",178],["luxuretv.com",179],["porndig.com",[180,181]],["webcheats.com.br",182],["ceesty.com",[183,184]],["gestyy.com",[183,184]],["corneey.com",184],["destyy.com",184],["festyy.com",184],["sh.st",184],["mitaku.net",184],["angrybirdsnest.com",185],["zrozz.com",185],["clix4btc.com",185],["4tests.com",185],["goltelevision.com",185],["news-und-nachrichten.de",185],["laradiobbs.net",185],["urlaubspartner.net",185],["produktion.de",185],["cinemaxxl.de",185],["bladesalvador.com",185],["tempr.email",185],["cshort.org",185],["friendproject.net",185],["covrhub.com",185],["katfile.com",[185,617]],["trust.zone",185],["business-standard.com",185],["planetsuzy.org",186],["empflix.com",187],["1movies.*",[188,194]],["xmovies8.*",188],["masteranime.tv",188],["0123movies.*",188],["gostream.*",188],["gomovies.*",188],["transparentcalifornia.com",189],["deepbrid.com",190],["webnovel.com",191],["streamwish.*",[192,193]],["oneupload.to",193],["wishfast.top",193],["rubystm.com",193],["rubyvid.com",193],["rubyvidhub.com",193],["stmruby.com",193],["streamruby.com",193],["schwaebische.de",195],["8tracks.com",196],["3movs.com",197],["bravoerotica.net",[197,249]],["youx.xxx",197],["camclips.tv",[197,317]],["xtits.*",[197,249]],["camflow.tv",[197,249,250,289,388]],["camhoes.tv",[197,247,249,250,289,388]],["xmegadrive.com",197],["xxxymovies.com",197],["xxxshake.com",197],["gayck.com",197],["xhand.com",[197,249]],["analdin.com",[197,249]],["revealname.com",198],["pouvideo.*",199],["povvideo.*",199],["povw1deo.*",199],["povwideo.*",199],["powv1deo.*",199],["powvibeo.*",199],["powvideo.*",199],["powvldeo.*",199],["golfchannel.com",200],["stream.nbcsports.com",200],["mathdf.com",200],["gamcore.com",201],["porcore.com",201],["porngames.tv",201],["69games.xxx",201],["javmix.app",201],["tecknity.com",202],["haaretz.co.il",203],["haaretz.com",203],["hungama.com",203],["a-o.ninja",203],["anime-odcinki.pl",203],["kumpulmanga.org",203],["shortgoo.blogspot.com",203],["tonanmedia.my.id",[203,570]],["yurasu.xyz",203],["isekaipalace.com",203],["plyjam.*",[204,205]],["ennovelas.com",[205,209]],["foxsports.com.au",206],["canberratimes.com.au",206],["thesimsresource.com",207],["fxporn69.*",208],["vipbox.*",209],["viprow.*",209],["ctrl.blog",210],["sportlife.es",211],["finofilipino.org",212],["desbloqueador.*",213],["xberuang.*",214],["teknorizen.*",214],["mysflink.blogspot.com",214],["ashemaletube.*",215],["paktech2.com",215],["assia.tv",216],["assia4.com",216],["assia24.com",216],["cwtvembeds.com",[218,248]],["camlovers.tv",218],["porntn.com",218],["pornissimo.org",218],["sexcams-24.com",[218,250]],["watchporn.to",[218,250]],["camwhorez.video",218],["footstockings.com",[218,219,250]],["xmateur.com",[218,219,250]],["multi.xxx",219],["worldofbitco.in",[220,221]],["weatherx.co.in",[220,221]],["sunbtc.space",220],["subtorrents.*",222],["subtorrents1.*",222],["newpelis.*",222],["pelix.*",222],["allcalidad.*",222],["infomaniakos.*",222],["ojogos.com.br",223],["powforums.com",224],["supforums.com",224],["studybullet.com",224],["usgamer.net",225],["recordonline.com",225],["freebitcoin.win",226],["e-monsite.com",226],["coindice.win",226],["temp-mails.com",227],["freiepresse.de",228],["investing.com",229],["tornadomovies.*",230],["mp3fiber.com",231],["chicoer.com",232],["dailybreeze.com",232],["dailybulletin.com",232],["dailynews.com",232],["delcotimes.com",232],["eastbaytimes.com",232],["macombdaily.com",232],["ocregister.com",232],["pasadenastarnews.com",232],["pe.com",232],["presstelegram.com",232],["redlandsdailyfacts.com",232],["reviewjournal.com",232],["santacruzsentinel.com",232],["saratogian.com",232],["sentinelandenterprise.com",232],["sgvtribune.com",232],["tampabay.com",232],["times-standard.com",232],["theoaklandpress.com",232],["trentonian.com",232],["twincities.com",232],["whittierdailynews.com",232],["bostonherald.com",232],["dailycamera.com",232],["sbsun.com",232],["dailydemocrat.com",232],["montereyherald.com",232],["orovillemr.com",232],["record-bee.com",232],["redbluffdailynews.com",232],["reporterherald.com",232],["thereporter.com",232],["timescall.com",232],["timesheraldonline.com",232],["ukiahdailyjournal.com",232],["dailylocal.com",232],["mercurynews.com",232],["suedkurier.de",233],["anysex.com",235],["icdrama.*",236],["mangasail.*",236],["pornve.com",237],["file4go.*",238],["coolrom.com.au",238],["marie-claire.es",239],["gamezhero.com",239],["flashgirlgames.com",239],["onlinesudoku.games",239],["mpg.football",239],["sssam.com",239],["globalnews.ca",240],["drinksmixer.com",241],["leitesculinaria.com",241],["fupa.net",242],["browardpalmbeach.com",243],["dallasobserver.com",243],["houstonpress.com",243],["miaminewtimes.com",243],["phoenixnewtimes.com",243],["westword.com",243],["nhentai.net",[244,245]],["nowtv.com.tr",246],["caminspector.net",247],["camwhoreshd.com",247],["camgoddess.tv",247],["gay4porn.com",249],["mypornhere.com",249],["mangovideo.*",250],["love4porn.com",250],["thotvids.com",250],["watchmdh.to",250],["celebwhore.com",250],["cluset.com",250],["sexlist.tv",250],["4kporn.xxx",250],["xhomealone.com",250],["lusttaboo.com",[250,510]],["hentai-moon.com",250],["camhub.cc",[250,675]],["mediapason.it",253],["linkspaid.com",253],["tuotromedico.com",253],["neoteo.com",253],["phoneswiki.com",253],["celebmix.com",253],["myneobuxportal.com",253],["oyungibi.com",253],["25yearslatersite.com",253],["jeshoots.com",254],["techhx.com",254],["karanapk.com",254],["flashplayer.fullstacks.net",256],["cloudapps.herokuapp.com",256],["youfiles.herokuapp.com",256],["texteditor.nsspot.net",256],["temp-mail.org",257],["asianclub.*",258],["javhdporn.net",258],["vidmoly.to",259],["comnuan.com",260],["veedi.com",261],["battleboats.io",261],["anitube.*",262],["fruitlab.com",262],["acetack.com",262],["androidquest.com",262],["apklox.com",262],["chhaprawap.in",262],["gujarativyakaran.com",262],["kashmirstudentsinformation.in",262],["kisantime.com",262],["shetkaritoday.in",262],["pastescript.com",262],["trimorspacks.com",262],["updrop.link",262],["haddoz.net",262],["streamingcommunity.*",262],["garoetpos.com",262],["stiletv.it",263],["mixdrop.*",264],["hqtv.biz",265],["liveuamap.com",266],["muvibg.com",266],["audycje.tokfm.pl",267],["shush.se",268],["allkpop.com",269],["empire-anime.*",[270,565,566,567,568,569]],["empire-streaming.*",[270,565,566,567]],["empire-anime.com",[270,565,566,567]],["empire-streamz.fr",[270,565,566,567]],["empire-stream.*",[270,565,566,567]],["pickcrackpasswords.blogspot.com",271],["kfrfansub.com",272],["thuglink.com",272],["voipreview.org",272],["illicoporno.com",273],["lavoixdux.com",273],["tonpornodujour.com",273],["jacquieetmichel.net",273],["swame.com",273],["vosfemmes.com",273],["voyeurfrance.net",273],["jacquieetmicheltv.net",[273,625,626]],["hanime.tv",274],["pogo.com",275],["cloudvideo.tv",276],["legionjuegos.org",277],["legionpeliculas.org",277],["legionprogramas.org",277],["16honeys.com",278],["elespanol.com",279],["remodelista.com",280],["audiofanzine.com",284],["uploadev.*",285],["developerinsider.co",286],["thehindu.com",287],["cambro.tv",[288,289]],["boobsradar.com",[289,388,688]],["nibelungen-kurier.de",290],["adfoc.us",291],["tea-coffee.net",291],["spatsify.com",291],["newedutopics.com",291],["getviralreach.in",291],["edukaroo.com",291],["funkeypagali.com",291],["careersides.com",291],["nayisahara.com",291],["wikifilmia.com",291],["infinityskull.com",291],["viewmyknowledge.com",291],["iisfvirtual.in",291],["starxinvestor.com",291],["jkssbalerts.com",291],["sahlmarketing.net",291],["filmypoints.in",291],["fitnessholic.net",291],["moderngyan.com",291],["sattakingcharts.in",291],["freshbhojpuri.com",291],["bankshiksha.in",291],["earn.mpscstudyhub.com",291],["earn.quotesopia.com",291],["money.quotesopia.com",291],["best-mobilegames.com",291],["learn.moderngyan.com",291],["bharatsarkarijobalert.com",291],["quotesopia.com",291],["creditsgoal.com",291],["bgmi32bitapk.in",291],["techacode.com",291],["trickms.com",291],["ielts-isa.edu.vn",291],["loan.punjabworks.com",291],["rokni.xyz",291],["keedabankingnews.com",291],["sptfy.be",291],["mcafee-com.com",[291,365]],["pianetamountainbike.it",292],["barchart.com",293],["modelisme.com",294],["parasportontario.ca",294],["prescottenews.com",294],["nrj-play.fr",295],["hackingwithreact.com",296],["gutekueche.at",297],["eplfootballmatch.com",298],["ancient-origins.*",298],["peekvids.com",299],["playvids.com",299],["pornflip.com",299],["redensarten-index.de",300],["vw-page.com",301],["viz.com",[302,303]],["0rechner.de",304],["configspc.com",305],["xopenload.me",305],["uptobox.com",305],["uptostream.com",305],["japgay.com",306],["mega-debrid.eu",307],["dreamdth.com",308],["diaridegirona.cat",310],["diariodeibiza.es",310],["diariodemallorca.es",310],["diarioinformacion.com",310],["eldia.es",310],["emporda.info",310],["farodevigo.es",310],["laopinioncoruna.es",310],["laopiniondemalaga.es",310],["laopiniondemurcia.es",310],["laopiniondezamora.es",310],["laprovincia.es",310],["levante-emv.com",310],["mallorcazeitung.es",310],["regio7.cat",310],["superdeporte.es",310],["playpaste.com",311],["cnbc.com",312],["primevideo.com",313],["read.amazon.*",[313,699]],["firefaucet.win",314],["74k.io",[315,316]],["fullhdxxx.com",318],["pornclassic.tube",319],["tubepornclassic.com",319],["etonline.com",320],["creatur.io",320],["lookcam.*",320],["drphil.com",320],["urbanmilwaukee.com",320],["lootlinks.*",320],["ontiva.com",320],["hideandseek.world",320],["myabandonware.com",320],["kendam.com",320],["wttw.com",320],["synonyms.com",320],["definitions.net",320],["hostmath.com",320],["camvideoshub.com",320],["minhaconexao.com.br",320],["home-made-videos.com",322],["amateur-couples.com",322],["slutdump.com",322],["dpstream.*",323],["produsat.com",324],["bluemediafiles.*",325],["12thman.com",326],["acusports.com",326],["atlantic10.com",326],["auburntigers.com",326],["baylorbears.com",326],["bceagles.com",326],["bgsufalcons.com",326],["big12sports.com",326],["bigten.org",326],["bradleybraves.com",326],["butlersports.com",326],["cmumavericks.com",326],["conferenceusa.com",326],["cyclones.com",326],["dartmouthsports.com",326],["daytonflyers.com",326],["dbupatriots.com",326],["dbusports.com",326],["denverpioneers.com",326],["fduknights.com",326],["fgcuathletics.com",326],["fightinghawks.com",326],["fightingillini.com",326],["floridagators.com",326],["friars.com",326],["friscofighters.com",326],["gamecocksonline.com",326],["goarmywestpoint.com",326],["gobison.com",326],["goblueraiders.com",326],["gobobcats.com",326],["gocards.com",326],["gocreighton.com",326],["godeacs.com",326],["goexplorers.com",326],["goetbutigers.com",326],["gofrogs.com",326],["gogriffs.com",326],["gogriz.com",326],["golobos.com",326],["gomarquette.com",326],["gopack.com",326],["gophersports.com",326],["goprincetontigers.com",326],["gopsusports.com",326],["goracers.com",326],["goshockers.com",326],["goterriers.com",326],["gotigersgo.com",326],["gousfbulls.com",326],["govandals.com",326],["gowyo.com",326],["goxavier.com",326],["gozags.com",326],["gozips.com",326],["griffinathletics.com",326],["guhoyas.com",326],["gwusports.com",326],["hailstate.com",326],["hamptonpirates.com",326],["hawaiiathletics.com",326],["hokiesports.com",326],["huskers.com",326],["icgaels.com",326],["iuhoosiers.com",326],["jsugamecocksports.com",326],["longbeachstate.com",326],["loyolaramblers.com",326],["lrtrojans.com",326],["lsusports.net",326],["morrisvillemustangs.com",326],["msuspartans.com",326],["muleriderathletics.com",326],["mutigers.com",326],["navysports.com",326],["nevadawolfpack.com",326],["niuhuskies.com",326],["nkunorse.com",326],["nuhuskies.com",326],["nusports.com",326],["okstate.com",326],["olemisssports.com",326],["omavs.com",326],["ovcsports.com",326],["owlsports.com",326],["purduesports.com",326],["redstormsports.com",326],["richmondspiders.com",326],["sfajacks.com",326],["shupirates.com",326],["siusalukis.com",326],["smcgaels.com",326],["smumustangs.com",326],["soconsports.com",326],["soonersports.com",326],["themw.com",326],["tulsahurricane.com",326],["txst.com",326],["txstatebobcats.com",326],["ubbulls.com",326],["ucfknights.com",326],["ucirvinesports.com",326],["uconnhuskies.com",326],["uhcougars.com",326],["uicflames.com",326],["umterps.com",326],["uncwsports.com",326],["unipanthers.com",326],["unlvrebels.com",326],["uoflsports.com",326],["usdtoreros.com",326],["utahstateaggies.com",326],["utepathletics.com",326],["utrockets.com",326],["uvmathletics.com",326],["uwbadgers.com",326],["villanova.com",326],["wkusports.com",326],["wmubroncos.com",326],["woffordterriers.com",326],["1pack1goal.com",326],["bcuathletics.com",326],["bubraves.com",326],["goblackbears.com",326],["golightsgo.com",326],["gomcpanthers.com",326],["goutsa.com",326],["mercerbears.com",326],["pirateblue.com",326],["pirateblue.net",326],["pirateblue.org",326],["quinnipiacbobcats.com",326],["towsontigers.com",326],["tribeathletics.com",326],["tribeclub.com",326],["utepminermaniacs.com",326],["utepminers.com",326],["wkutickets.com",326],["aopathletics.org",326],["atlantichockeyonline.com",326],["bigsouthnetwork.com",326],["bigsouthsports.com",326],["chawomenshockey.com",326],["dbupatriots.org",326],["drakerelays.org",326],["ecac.org",326],["ecacsports.com",326],["emueagles.com",326],["emugameday.com",326],["gculopes.com",326],["godrakebulldog.com",326],["godrakebulldogs.com",326],["godrakebulldogs.net",326],["goeags.com",326],["goislander.com",326],["goislanders.com",326],["gojacks.com",326],["gomacsports.com",326],["gseagles.com",326],["hubison.com",326],["iowaconference.com",326],["ksuowls.com",326],["lonestarconference.org",326],["mascac.org",326],["midwestconference.org",326],["mountaineast.org",326],["niu-pack.com",326],["nulakers.ca",326],["oswegolakers.com",326],["ovcdigitalnetwork.com",326],["pacersports.com",326],["rmacsports.org",326],["rollrivers.com",326],["samfordsports.com",326],["uncpbraves.com",326],["usfdons.com",326],["wiacsports.com",326],["alaskananooks.com",326],["broncathleticfund.com",326],["cameronaggies.com",326],["columbiacougars.com",326],["etownbluejays.com",326],["gobadgers.ca",326],["golancers.ca",326],["gometrostate.com",326],["gothunderbirds.ca",326],["kentstatesports.com",326],["lehighsports.com",326],["lopers.com",326],["lycoathletics.com",326],["lycomingathletics.com",326],["maraudersports.com",326],["mauiinvitational.com",326],["msumavericks.com",326],["nauathletics.com",326],["nueagles.com",326],["nwusports.com",326],["oceanbreezenyc.org",326],["patriotathleticfund.com",326],["pittband.com",326],["principiaathletics.com",326],["roadrunnersathletics.com",326],["sidearmsocial.com",326],["snhupenmen.com",326],["stablerarena.com",326],["stoutbluedevils.com",326],["uwlathletics.com",326],["yumacs.com",326],["collegefootballplayoff.com",326],["csurams.com",326],["cubuffs.com",326],["gobearcats.com",326],["gohuskies.com",326],["mgoblue.com",326],["osubeavers.com",326],["pittsburghpanthers.com",326],["rolltide.com",326],["texassports.com",326],["thesundevils.com",326],["uclabruins.com",326],["wvuathletics.com",326],["wvusports.com",326],["arizonawildcats.com",326],["calbears.com",326],["cuse.com",326],["georgiadogs.com",326],["goducks.com",326],["goheels.com",326],["gostanford.com",326],["insidekstatesports.com",326],["insidekstatesports.info",326],["insidekstatesports.net",326],["insidekstatesports.org",326],["k-stateathletics.com",326],["k-statefootball.net",326],["k-statefootball.org",326],["k-statesports.com",326],["k-statesports.net",326],["k-statesports.org",326],["k-statewomenshoops.com",326],["k-statewomenshoops.net",326],["k-statewomenshoops.org",326],["kstateathletics.com",326],["kstatefootball.net",326],["kstatefootball.org",326],["kstatesports.com",326],["kstatewomenshoops.com",326],["kstatewomenshoops.net",326],["kstatewomenshoops.org",326],["ksuathletics.com",326],["ksusports.com",326],["scarletknights.com",326],["showdownforrelief.com",326],["syracusecrunch.com",326],["texastech.com",326],["theacc.com",326],["ukathletics.com",326],["usctrojans.com",326],["utahutes.com",326],["utsports.com",326],["wsucougars.com",326],["vidlii.com",[326,351]],["tricksplit.io",326],["fangraphs.com",327],["stern.de",328],["geo.de",328],["brigitte.de",328],["tvspielfilm.de",[329,330,331,332]],["tvtoday.de",[329,330,331,332]],["chip.de",[329,330,331,332]],["focus.de",[329,330,331,332]],["fitforfun.de",[329,330,331,332]],["n-tv.de",333],["player.rtl2.de",334],["planetaminecraft.com",335],["cravesandflames.com",336],["codesnse.com",336],["flyad.vip",336],["lapresse.ca",337],["kolyoom.com",338],["ilovephd.com",338],["negumo.com",339],["games.wkb.jp",[340,341]],["kenshi.fandom.com",343],["hausbau-forum.de",344],["homeairquality.org",344],["faucettronn.click",344],["fake-it.ws",345],["laksa19.github.io",346],["1shortlink.com",347],["u-s-news.com",348],["luscious.net",349],["makemoneywithurl.com",350],["junkyponk.com",350],["healthfirstweb.com",350],["vocalley.com",350],["yogablogfit.com",350],["howifx.com",[350,534]],["en.financerites.com",350],["mythvista.com",350],["livenewsflix.com",350],["cureclues.com",350],["apekite.com",350],["enit.in",350],["iammagnus.com",351],["dailyvideoreports.net",351],["unityassets4free.com",351],["docer.*",352],["resetoff.pl",352],["sexodi.com",352],["cdn77.org",353],["3sexporn.com",354],["momxxxsex.com",354],["myfreevintageporn.com",354],["penisbuyutucum.net",354],["ujszo.com",355],["newsmax.com",356],["nadidetarifler.com",357],["siz.tv",357],["suzylu.co.uk",[358,359]],["onworks.net",360],["yabiladi.com",360],["downloadsoft.net",361],["newsobserver.com",362],["arkadiumhosted.com",362],["testlanguages.com",363],["newsinlevels.com",363],["videosinlevels.com",363],["bookmystrip.com",364],["sabkiyojana.com",364],["starkroboticsfrc.com",365],["sinonimos.de",365],["antonimos.de",365],["quesignifi.ca",365],["tiktokrealtime.com",365],["tiktokcounter.net",365],["tpayr.xyz",365],["poqzn.xyz",365],["ashrfd.xyz",365],["rezsx.xyz",365],["tryzt.xyz",365],["ashrff.xyz",365],["rezst.xyz",365],["dawenet.com",365],["erzar.xyz",365],["waezm.xyz",365],["waezg.xyz",365],["blackwoodacademy.org",365],["cryptednews.space",365],["vivuq.com",365],["swgop.com",365],["vbnmll.com",365],["telcoinfo.online",365],["dshytb.com",365],["btcbitco.in",[365,369]],["btcsatoshi.net",365],["cempakajaya.com",365],["crypto4yu.com",365],["readbitcoin.org",365],["wiour.com",365],["finish.addurl.biz",365],["aiimgvlog.fun",[365,372]],["laweducationinfo.com",365],["savemoneyinfo.com",365],["worldaffairinfo.com",365],["godstoryinfo.com",365],["successstoryinfo.com",365],["cxissuegk.com",365],["learnmarketinfo.com",365],["bhugolinfo.com",365],["armypowerinfo.com",365],["rsadnetworkinfo.com",365],["rsinsuranceinfo.com",365],["rsfinanceinfo.com",365],["rsgamer.app",365],["rssoftwareinfo.com",365],["rshostinginfo.com",365],["rseducationinfo.com",365],["phonereviewinfo.com",365],["makeincomeinfo.com",365],["gknutshell.com",365],["vichitrainfo.com",365],["workproductivityinfo.com",365],["dopomininfo.com",365],["hostingdetailer.com",365],["fitnesssguide.com",365],["tradingfact4u.com",365],["cryptofactss.com",365],["softwaredetail.com",365],["artoffocas.com",365],["insurancesfact.com",365],["travellingdetail.com",365],["advertisingexcel.com",365],["allcryptoz.net",365],["batmanfactor.com",365],["beautifulfashionnailart.com",365],["crewbase.net",365],["documentaryplanet.xyz",365],["crewus.net",365],["gametechreviewer.com",365],["midebalonu.net",365],["misterio.ro",365],["phineypet.com",365],["seory.xyz",365],["shinbhu.net",365],["shinchu.net",365],["substitutefor.com",365],["talkforfitness.com",365],["thefitbrit.co.uk",365],["thumb8.net",365],["thumb9.net",365],["topcryptoz.net",365],["uniqueten.net",365],["ultraten.net",365],["exactpay.online",365],["quins.us",365],["kiddyearner.com",365],["imagereviser.com",366],["tech.pubghighdamage.com",367],["tech.techkhulasha.com",367],["hipsonyc.com",367],["jiocinema.com",367],["rapid-cloud.co",367],["uploadmall.com",367],["rkd3.dev",367],["4funbox.com",368],["nephobox.com",368],["1024tera.com",368],["terabox.*",368],["blog.cryptowidgets.net",369],["blog.insurancegold.in",369],["blog.wiki-topia.com",369],["blog.coinsvalue.net",369],["blog.cookinguide.net",369],["blog.freeoseocheck.com",369],["blog24.me",369],["bildirim.*",371],["arahdrive.com",372],["appsbull.com",373],["diudemy.com",373],["maqal360.com",[373,374,375]],["lifesurance.info",376],["akcartoons.in",377],["cybercityhelp.in",377],["infokeeda.xyz",378],["webzeni.com",378],["phongroblox.com",379],["fuckingfast.net",380],["tickhosting.com",381],["in91vip.win",382],["datavaults.co",383],["t-online.de",385],["upornia.*",[386,387]],["bobs-tube.com",388],["pornohirsch.net",389],["pixsera.net",390],["pc-builds.com",391],["qtoptens.com",391],["reuters.com",391],["today.com",391],["videogamer.com",391],["wrestlinginc.com",391],["usatoday.com",392],["ydr.com",392],["247sports.com",393],["indiatimes.com",394],["netzwelt.de",395],["arcade.buzzrtv.com",396],["arcade.dailygazette.com",396],["arcade.lemonde.fr",396],["arena.gamesforthebrain.com",396],["bestpuzzlesandgames.com",396],["cointiply.arkadiumarena.com",396],["gamelab.com",396],["games.abqjournal.com",396],["games.amny.com",396],["games.bellinghamherald.com",396],["games.besthealthmag.ca",396],["games.bnd.com",396],["games.boston.com",396],["games.bostonglobe.com",396],["games.bradenton.com",396],["games.centredaily.com",396],["games.charlotteobserver.com",396],["games.cnhinews.com",396],["games.crosswordgiant.com",396],["games.dailymail.co.uk",396],["games.dallasnews.com",396],["games.daytondailynews.com",396],["games.denverpost.com",396],["games.everythingzoomer.com",396],["games.fresnobee.com",396],["games.gameshownetwork.com",396],["games.get.tv",396],["games.greatergood.com",396],["games.heraldonline.com",396],["games.heraldsun.com",396],["games.idahostatesman.com",396],["games.insp.com",396],["games.islandpacket.com",396],["games.journal-news.com",396],["games.kansas.com",396],["games.kansascity.com",396],["games.kentucky.com",396],["games.lancasteronline.com",396],["games.ledger-enquirer.com",396],["games.macon.com",396],["games.mashable.com",396],["games.mercedsunstar.com",396],["games.metro.us",396],["games.metv.com",396],["games.miamiherald.com",396],["games.modbee.com",396],["games.moviestvnetwork.com",396],["games.myrtlebeachonline.com",396],["games.nationalreview.com",396],["games.newsobserver.com",396],["games.parade.com",396],["games.pressdemocrat.com",396],["games.puzzlebaron.com",396],["games.puzzler.com",396],["games.puzzles.ca",396],["games.qns.com",396],["games.readersdigest.ca",396],["games.sacbee.com",396],["games.sanluisobispo.com",396],["games.sixtyandme.com",396],["games.sltrib.com",396],["games.springfieldnewssun.com",396],["games.star-telegram.com",396],["games.startribune.com",396],["games.sunherald.com",396],["games.theadvocate.com",396],["games.thenewstribune.com",396],["games.theolympian.com",396],["games.theportugalnews.com",396],["games.thestar.com",396],["games.thestate.com",396],["games.tri-cityherald.com",396],["games.triviatoday.com",396],["games.usnews.com",396],["games.word.tips",396],["games.wordgenius.com",396],["games.wtop.com",396],["jeux.meteocity.com",396],["juegos.as.com",396],["juegos.elnuevoherald.com",396],["juegos.elpais.com",396],["philly.arkadiumarena.com",396],["play.dictionary.com",396],["puzzles.bestforpuzzles.com",396],["puzzles.centralmaine.com",396],["puzzles.crosswordsolver.org",396],["puzzles.independent.co.uk",396],["puzzles.nola.com",396],["puzzles.pressherald.com",396],["puzzles.standard.co.uk",396],["puzzles.sunjournal.com",396],["arkadium.com",397],["abysscdn.com",[398,399]],["arcai.com",400],["my-code4you.blogspot.com",401],["flickr.com",402],["firefile.cc",403],["pestleanalysis.com",403],["kochamjp.pl",403],["tutorialforlinux.com",403],["whatsaero.com",403],["animeblkom.net",[403,417]],["blkom.com",403],["globes.co.il",[404,405]],["jardiner-malin.fr",406],["tw-calc.net",407],["ohmybrush.com",408],["talkceltic.net",409],["mentalfloss.com",410],["uprafa.com",411],["cube365.net",412],["wwwfotografgotlin.blogspot.com",413],["freelistenonline.com",413],["badassdownloader.com",414],["quickporn.net",415],["yellowbridge.com",416],["aosmark.com",418],["ctrlv.*",419],["atozmath.com",[420,421,422,423,424,425,426]],["newyorker.com",427],["brighteon.com",428],["more.tv",429],["video1tube.com",430],["alohatube.xyz",430],["4players.de",431],["onlinesoccermanager.com",431],["fshost.me",432],["link.cgtips.org",433],["hentaicloud.com",434],["netfapx.com",436],["javdragon.org",436],["javneon.tv",436],["paperzonevn.com",437],["9jarock.org",438],["fzmovies.info",438],["fztvseries.ng",438],["netnaijas.com",438],["hentaienglish.com",439],["hentaiporno.xxx",439],["venge.io",[440,441]],["btcbux.io",442],["its.porn",[443,444]],["atv.at",445],["2ndrun.tv",446],["rackusreads.com",446],["teachmemicro.com",446],["willcycle.com",446],["kusonime.com",[447,448]],["123movieshd.*",449],["imgur.com",[450,451,709]],["hentai-party.com",452],["hentaicomics.pro",452],["xxx-comics.pro",452],["uproxy.*",453],["animesa.*",454],["subtitle.one",455],["subtitleone.cc",455],["genshinimpactcalculator.com",456],["mysexgames.com",457],["cinecalidad.*",[458,459]],["xnxx.com",460],["xvideos.*",460],["gdr-online.com",461],["mmm.dk",462],["iqiyi.com",[463,464,598]],["m.iqiyi.com",465],["nbcolympics.com",466],["apkhex.com",467],["indiansexstories2.net",468],["issstories.xyz",468],["1340kbbr.com",469],["gorgeradio.com",469],["kduk.com",469],["kedoam.com",469],["kejoam.com",469],["kelaam.com",469],["khsn1230.com",469],["kjmx.rocks",469],["kloo.com",469],["klooam.com",469],["klykradio.com",469],["kmed.com",469],["kmnt.com",469],["kool991.com",469],["kpnw.com",469],["kppk983.com",469],["krktcountry.com",469],["ktee.com",469],["kwro.com",469],["kxbxfm.com",469],["thevalley.fm",469],["quizlet.com",470],["dsocker1234.blogspot.com",471],["schoolcheats.net",[472,473]],["mgnet.xyz",474],["japopav.tv",475],["lvturbo.com",475],["designtagebuch.de",476],["pixroute.com",477],["uploady.io",478],["calculator-online.net",479],["luckydice.net",480],["adarima.org",480],["weatherwx.com",480],["sattaguess.com",480],["winshell.de",480],["rosasidan.ws",480],["modmakers.xyz",480],["gamepure.in",480],["warrenrahul.in",480],["austiblox.net",480],["upiapi.in",480],["daemonanime.net",480],["networkhint.com",480],["thichcode.net",480],["texturecan.com",480],["tikmate.app",[480,606]],["arcaxbydz.id",480],["quotesshine.com",480],["porngames.club",481],["sexgames.xxx",481],["111.90.159.132",482],["mobile-tracker-free.com",483],["pfps.gg",484],["social-unlock.com",485],["superpsx.com",486],["ninja.io",487],["sourceforge.net",488],["samfirms.com",489],["rapelust.com",490],["vtube.to",490],["vtplay.net",490],["desitelugusex.com",490],["dvdplay.*",490],["xvideos-downloader.net",490],["xxxvideotube.net",490],["sdefx.cloud",490],["nozomi.la",490],["moviesonlinefree.net",490],["banned.video",491],["madmaxworld.tv",491],["androidpolice.com",491],["babygaga.com",491],["backyardboss.net",491],["carbuzz.com",491],["cbr.com",491],["collider.com",491],["dualshockers.com",491],["footballfancast.com",491],["footballleagueworld.co.uk",491],["gamerant.com",491],["givemesport.com",491],["hardcoregamer.com",491],["hotcars.com",491],["howtogeek.com",491],["makeuseof.com",491],["moms.com",491],["movieweb.com",491],["pocket-lint.com",491],["pocketnow.com",491],["screenrant.com",491],["simpleflying.com",491],["thegamer.com",491],["therichest.com",491],["thesportster.com",491],["thethings.com",491],["thetravel.com",491],["topspeed.com",491],["xda-developers.com",491],["huffpost.com",492],["ingles.com",493],["spanishdict.com",493],["surfline.com",[494,495]],["play.tv3.ee",496],["play.tv3.lt",496],["play.tv3.lv",[496,497]],["tv3play.skaties.lv",496],["trendyoum.com",498],["bulbagarden.net",499],["hollywoodlife.com",500],["mat6tube.com",501],["hotabis.com",502],["root-nation.com",502],["italpress.com",502],["airsoftmilsimnews.com",502],["artribune.com",502],["textstudio.co",503],["newtumbl.com",504],["apkmaven.*",505],["aruble.net",506],["nevcoins.club",507],["mail.com",508],["gmx.*",509],["mangakita.id",511],["avpgalaxy.net",512],["mhma12.tech",513],["panda-novel.com",514],["zebranovel.com",514],["lightsnovel.com",514],["eaglesnovel.com",514],["pandasnovel.com",514],["ewrc-results.com",515],["kizi.com",516],["cyberscoop.com",517],["fedscoop.com",517],["canale.live",518],["jeep-cj.com",519],["sponsorhunter.com",520],["cloudcomputingtopics.net",521],["likecs.com",522],["tiscali.it",523],["linkspy.cc",524],["adshnk.com",525],["chattanoogan.com",526],["adsy.pw",527],["playstore.pw",527],["socialmediagirls.com",528],["windowspro.de",529],["snapinst.app",530],["tvtv.ca",531],["tvtv.us",531],["mydaddy.cc",532],["roadtrippin.fr",533],["vavada5com.com",534],["anyporn.com",[535,552]],["bravoporn.com",535],["bravoteens.com",535],["crocotube.com",535],["hellmoms.com",535],["hellporno.com",535],["sex3.com",535],["tubewolf.com",535],["xbabe.com",535],["xcum.com",535],["zedporn.com",535],["imagetotext.info",536],["infokik.com",537],["freepik.com",538],["ddwloclawek.pl",[539,540]],["www.seznam.cz",541],["deezer.com",542],["my-subs.co",543],["plaion.com",544],["slideshare.net",[545,546]],["ustreasuryyieldcurve.com",547],["businesssoftwarehere.com",548],["goo.st",548],["freevpshere.com",548],["softwaresolutionshere.com",548],["gamereactor.*",550],["madoohd.com",551],["doomovie-hd.*",551],["staige.tv",553],["androidadult.com",554],["streamvid.net",555],["watchtv24.com",556],["cellmapper.net",557],["medscape.com",558],["newscon.org",[559,560]],["wheelofgold.com",561],["drakecomic.*",561],["bembed.net",562],["embedv.net",562],["fslinks.org",562],["listeamed.net",562],["v6embed.xyz",562],["vembed.*",562],["vgplayer.xyz",562],["vid-guard.com",562],["vinomo.xyz",562],["app.blubank.com",563],["mobileweb.bankmellat.ir",563],["chat.nrj.fr",564],["chat.tchatche.com",[564,579]],["ccthesims.com",571],["chromeready.com",571],["coursedrive.org",571],["dtbps3games.com",571],["illustratemagazine.com",571],["uknip.co.uk",571],["vod.pl",572],["megadrive-emulator.com",573],["tvhay.*",[574,575]],["animesaga.in",576],["moviesapi.club",576],["bestx.stream",576],["watchx.top",576],["digimanie.cz",577],["svethardware.cz",577],["srvy.ninja",578],["cnn.com",[580,581,582]],["edmdls.com",583],["freshremix.net",583],["scenedl.org",583],["trakt.tv",584],["shroomers.app",588],["classicalradio.com",589],["di.fm",589],["jazzradio.com",589],["radiotunes.com",589],["rockradio.com",589],["zenradio.com",589],["getthit.com",590],["techedubyte.com",591],["soccerinhd.com",591],["movie-th.tv",592],["iwanttfc.com",593],["nutraingredients-asia.com",594],["nutraingredients-latam.com",594],["nutraingredients-usa.com",594],["nutraingredients.com",594],["ozulscansen.com",595],["nexusmods.com",596],["lookmovie.*",597],["lookmovie2.to",597],["biletomat.pl",599],["hextank.io",[600,601]],["filmizlehdfilm.com",[602,603,604,605]],["filmizletv.*",[602,603,604,605]],["fullfilmizle.cc",[602,603,604,605]],["gofilmizle.net",[602,603,604,605]],["btvplus.bg",607],["sagewater.com",608],["redlion.net",608],["filmweb.pl",[609,610]],["satdl.com",611],["vidstreaming.xyz",612],["everand.com",613],["myradioonline.pl",614],["cbs.com",615],["paramountplus.com",615],["fullxh.com",616],["galleryxh.site",616],["megaxh.com",616],["movingxh.world",616],["seexh.com",616],["unlockxh4.com",616],["valuexh.life",616],["xhaccess.com",616],["xhadult2.com",616],["xhadult3.com",616],["xhadult4.com",616],["xhadult5.com",616],["xhamster.*",616],["xhamster1.*",616],["xhamster10.*",616],["xhamster11.*",616],["xhamster12.*",616],["xhamster13.*",616],["xhamster14.*",616],["xhamster15.*",616],["xhamster16.*",616],["xhamster17.*",616],["xhamster18.*",616],["xhamster19.*",616],["xhamster20.*",616],["xhamster2.*",616],["xhamster3.*",616],["xhamster4.*",616],["xhamster42.*",616],["xhamster46.com",616],["xhamster5.*",616],["xhamster7.*",616],["xhamster8.*",616],["xhamsterporno.mx",616],["xhbig.com",616],["xhbranch5.com",616],["xhchannel.com",616],["xhdate.world",616],["xhday.com",616],["xhday1.com",616],["xhlease.world",616],["xhmoon5.com",616],["xhofficial.com",616],["xhopen.com",616],["xhplanet1.com",616],["xhplanet2.com",616],["xhreal2.com",616],["xhreal3.com",616],["xhspot.com",616],["xhtotal.com",616],["xhtree.com",616],["xhvictory.com",616],["xhwebsite.com",616],["xhwebsite2.com",616],["xhwebsite5.com",616],["xhwide1.com",616],["xhwide2.com",616],["xhwide5.com",616],["file-upload.net",618],["lightnovelworld.*",619],["acortalo.*",[620,621,622,623]],["acortar.*",[620,621,622,623]],["megadescarga.net",[620,621,622,623]],["megadescargas.net",[620,621,622,623]],["hentaihaven.xxx",624],["jacquieetmicheltv2.net",626],["a2zapk.*",627],["fcportables.com",[628,629]],["emurom.net",630],["freethesaurus.com",[631,632]],["thefreedictionary.com",[631,632]],["oeffentlicher-dienst.info",633],["im9.eu",634],["dcdlplayer8a06f4.xyz",635],["ultimate-guitar.com",636],["claimbits.net",637],["sexyscope.net",638],["kickassanime.*",639],["recherche-ebook.fr",640],["virtualdinerbot.com",640],["zonebourse.com",641],["pink-sluts.net",642],["andhrafriends.com",643],["benzinpreis.de",644],["turtleviplay.xyz",645],["defenseone.com",646],["govexec.com",646],["nextgov.com",646],["route-fifty.com",646],["sharing.wtf",647],["wetter3.de",648],["esportivos.fun",649],["cosmonova-broadcast.tv",650],["hartvannederland.nl",651],["shownieuws.nl",651],["vandaaginside.nl",651],["rock.porn",[652,653]],["videzz.net",[654,655]],["ezaudiobookforsoul.com",656],["club386.com",657],["littlebigsnake.com",658],["easyfun.gg",659],["smailpro.com",660],["ilgazzettino.it",661],["ilmessaggero.it",661],["3bmeteo.com",[662,663]],["mconverter.eu",664],["lover937.net",665],["10gb.vn",666],["pes6.es",667],["tactics.tools",[668,669]],["boundhub.com",670],["alocdnnetu.xyz",671],["reliabletv.me",672],["jakondo.ru",673],["filecrypt.*",674],["nolive.me",676],["wired.com",677],["spankbang.*",[678,679,680,711,712]],["hulu.com",[681,682,683]],["anonymfile.com",684],["gofile.to",684],["dotycat.com",685],["rateyourmusic.com",686],["reporterpb.com.br",687],["blog-dnz.com",689],["18adultgames.com",690],["colnect.com",[691,692]],["adultgamesworld.com",693],["bgmiupdate.com.in",694],["reviewdiv.com",695],["parametric-architecture.com",696],["laurelberninteriors.com",[697,714]],["voiceofdenton.com",698],["concealednation.org",698],["askattest.com",700],["opensubtitles.com",701],["savefiles.com",702],["streamup.ws",703],["www.google.*",704],["tacobell.com",705],["zefoy.com",706],["cnet.com",707],["natgeotv.com",710],["globo.com",713],["wayfair.com",715]]);
const exceptionsMap = new Map([["cloudflare.com",[0]],["pingit.com",[164]],["loan.bgmi32bitapk.in",[291]],["lookmovie.studio",[597]]]);
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
