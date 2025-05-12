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
const argsList = [["console.clear","undefined"],["adBlockDetected","undefined"],["scrollTo","noopFunc"],["PrePl","true"],["amzn_aps_csm.init","noopFunc"],["amzn_aps_csm.log","noopFunc"],["akamaiDisableServerIpLookup","noopFunc"],["DD_RUM.addAction","noopFunc"],["nads.createAd","trueFunc"],["ga","noopFunc"],["huecosPBS.nstdX","null"],["DTM.trackAsyncPV","noopFunc"],["_satellite","{}"],["_satellite.getVisitorId","noopFunc"],["newPageViewSpeedtest","noopFunc"],["pubg.unload","noopFunc"],["generateGalleryAd","noopFunc"],["mediator","noopFunc"],["Object.prototype.subscribe","noopFunc"],["gbTracker","{}"],["gbTracker.sendAutoSearchEvent","noopFunc"],["Object.prototype.vjsPlayer.ads","noopFunc"],["network_user_id",""],["google.ima.OmidVerificationVendor","{}"],["Object.prototype.omidAccessModeRules","{}"],["googletag.cmd","{}"],["Object.prototype.setDisableFlashAds","noopFunc"],["DD_RUM.addTiming","noopFunc"],["chameleonVideo.adDisabledRequested","true"],["AdmostClient","{}"],["analytics","{}"],["datalayer","[]"],["Object.prototype.isInitialLoadDisabled","noopFunc"],["listingGoogleEETracking","noopFunc"],["dcsMultiTrack","noopFunc"],["urlStrArray","noopFunc"],["pa","{}"],["Object.prototype.setConfigurations","noopFunc"],["Object.prototype.bk_addPageCtx","noopFunc"],["Object.prototype.bk_doJSTag","noopFunc"],["passFingerPrint","noopFunc"],["optimizely","{}"],["optimizely.initialized","true"],["google_optimize","{}"],["google_optimize.get","noopFunc"],["_gsq","{}"],["_gsq.push","noopFunc"],["stmCustomEvent","noopFunc"],["_gsDevice",""],["iom","{}"],["iom.c","noopFunc"],["_conv_q","{}"],["_conv_q.push","noopFunc"],["google.ima.settings.setDisableFlashAds","noopFunc"],["pa.privacy","{}"],["Object.prototype.getTargetingMap","noopFunc"],["populateClientData4RBA","noopFunc"],["YT.ImaManager","noopFunc"],["UOLPD","{}"],["UOLPD.dataLayer","{}"],["__configuredDFPTags","{}"],["URL_VAST_YOUTUBE","{}"],["Adman","{}"],["dplus","{}"],["dplus.track","noopFunc"],["_satellite.track","noopFunc"],["google.ima.dai","{}"],["gfkS2sExtension","{}"],["gfkS2sExtension.HTML5VODExtension","noopFunc"],["AnalyticsEventTrackingJS","{}"],["AnalyticsEventTrackingJS.addToBasket","noopFunc"],["AnalyticsEventTrackingJS.trackErrorMessage","noopFunc"],["initializeslideshow","noopFunc"],["fathom","{}"],["fathom.trackGoal","noopFunc"],["Origami","{}"],["Origami.fastclick","noopFunc"],["jad","undefined"],["hasAdblocker","true"],["Sentry","{}"],["Sentry.init","noopFunc"],["TRC","{}"],["TRC._taboolaClone","[]"],["fp","{}"],["fp.t","noopFunc"],["fp.s","noopFunc"],["initializeNewRelic","noopFunc"],["turnerAnalyticsObj","{}"],["turnerAnalyticsObj.setVideoObject4AnalyticsProperty","noopFunc"],["optimizelyDatafile","{}"],["optimizelyDatafile.featureFlags","[]"],["fingerprint","{}"],["fingerprint.getCookie","noopFunc"],["gform.utils","noopFunc"],["gform.utils.trigger","noopFunc"],["get_fingerprint","noopFunc"],["moatPrebidApi","{}"],["moatPrebidApi.getMoatTargetingForPage","noopFunc"],["cpd_configdata","{}"],["cpd_configdata.url",""],["yieldlove_cmd","{}"],["yieldlove_cmd.push","noopFunc"],["dataLayer.push","noopFunc"],["_etmc","{}"],["_etmc.push","noopFunc"],["freshpaint","{}"],["freshpaint.track","noopFunc"],["ShowRewards","noopFunc"],["stLight","{}"],["stLight.options","noopFunc"],["DD_RUM.addError","noopFunc"],["sensorsDataAnalytic201505","{}"],["sensorsDataAnalytic201505.init","noopFunc"],["sensorsDataAnalytic201505.quick","noopFunc"],["sensorsDataAnalytic201505.track","noopFunc"],["s","{}"],["s.tl","noopFunc"],["smartech","noopFunc"],["sensors","{}"],["sensors.init","noopFunc"],["sensors.track","noopFunc"],["adn","{}"],["adn.clearDivs","noopFunc"],["_vwo_code","{}"],["gtag","noopFunc"],["_taboola","{}"],["_taboola.push","noopFunc"],["clicky","{}"],["clicky.goal","noopFunc"],["WURFL","{}"],["_sp_.config.events.onSPPMObjectReady","noopFunc"],["gtm","{}"],["gtm.trackEvent","noopFunc"],["mParticle.Identity.getCurrentUser","noopFunc"],["JSGlobals.prebidEnabled","false"],["elasticApm","{}"],["elasticApm.init","noopFunc"],["Object.prototype.que","noopFunc"],["Object.prototype.que.push","noopFunc"],["ga.sendGaEvent","noopFunc"],["adobe","{}"],["MT","{}"],["MT.track","noopFunc"],["ClickOmniPartner","noopFunc"],["adex","{}"],["adex.getAdexUser","noopFunc"],["Adkit","noopFunc"],["Object.prototype.shouldExpectGoogleCMP","false"],["apntag.refresh","noopFunc"],["pa.sendEvent","noopFunc"],["ytInitialPlayerResponse.playerAds","undefined"],["ytInitialPlayerResponse.adPlacements","undefined"],["ytInitialPlayerResponse.adSlots","undefined"],["playerResponse.adPlacements","undefined"],["nsShowMaxCount","0"],["objVc.interstitial_web",""],["_ml_ads_ns","null"],["_sp_.config","undefined"],["isAdBlockActive","false"],["AdController","noopFunc"],["console.clear","noopFunc"],["console.log","noopFunc"],["Object.prototype.hideAds","true"],["Object.prototype._getSalesHouseConfigurations","noopFunc"],["vast_urls","{}"],["sadbl","false"],["adblockcheck","false"],["arrvast","[]"],["blurred","false"],["flashvars.adv_pre_src",""],["showPopunder","false"],["page_params.holiday_promo","true"],["adsEnabled","true"],["String.prototype.charAt","trueFunc"],["ad_blocker","false"],["blockAdBlock","true"],["VikiPlayer.prototype.pingAbFactor","noopFunc"],["player.options.disableAds","true"],["console.clear","trueFunc"],["flashvars.adv_pre_vast",""],["flashvars.adv_pre_vast_alt",""],["x_width","1"],["_site_ads_ns","true"],["luxuretv.config",""],["Object.prototype.AdOverlay","noopFunc"],["tkn_popunder","null"],["can_run_ads","true"],["adsBlockerDetector","noopFunc"],["globalThis","null"],["adblock","false"],["__ads","true"],["FlixPop.isPopGloballyEnabled","falseFunc"],["check_adblock","true"],["$.magnificPopup.open","noopFunc"],["adsenseadBlock","noopFunc"],["adblockSuspected","false"],["xRds","true"],["cRAds","false"],["String.prototype.charCodeAt","trueFunc"],["disasterpingu","false"],["App.views.adsView.adblock","false"],["flashvars.adv_pause_html",""],["$.fx.off","true"],["isAdb","false"],["adBlockEnabled","false"],["puShown","true"],["ads_b_test","true"],["showAds","true"],["attr","{}"],["scriptSrc",""],["cxStartDetectionProcess","noopFunc"],["isAdBlocked","false"],["adblock","noopFunc"],["path",""],["_ctrl_vt.blocked.ad_script","false"],["blockAdBlock","noopFunc"],["caca","noopFunc"],["Ok","true"],["safelink.adblock","false"],["openPopunder","noopFunc"],["ClickUnder","noopFunc"],["flashvars.adv_pre_url",""],["flashvars.protect_block",""],["flashvars.video_click_url",""],["adBlock","false"],["spoof","noopFunc"],["btoa","null"],["sp_ad","true"],["adsBlocked","false"],["_sp_.msg.displayMessage","noopFunc"],["CaptchmeState.adb","undefined"],["indexedDB.open","trueFunc"],["UhasAB","false"],["adNotificationDetected","false"],["atob","noopFunc"],["_pop","noopFunc"],["CnnXt.Event.fire","noopFunc"],["_ti_update_user","noopFunc"],["valid","1"],["vastAds","[]"],["adblock","1"],["frg","1"],["time","0"],["ads","true"],["GNCA_Ad_Support","true"],["Date.now","noopFunc"],["jQuery.adblock","1"],["VMG.Components.Adblock","false"],["_n_app.popunder","null"],["N_BetterJsPop.object","{}"],["adblockDetector","trueFunc"],["hasPoped","true"],["flashvars.video_click_url","undefined"],["flashvars.adv_start_html",""],["flashvars.popunder_url",""],["flashvars.adv_post_src",""],["flashvars.adv_post_url",""],["jQuery.adblock","false"],["google_jobrunner","true"],["sec","0"],["gadb","false"],["checkadBlock","noopFunc"],["clientSide.adbDetect","noopFunc"],["HTMLAnchorElement.prototype.click","noopFunc"],["cmnnrunads","true"],["adBlocker","false"],["adBlockDetected","noopFunc"],["StileApp.somecontrols.adBlockDetected","noopFunc"],["MDCore.adblock","0"],["google_tag_data","noopFunc"],["noAdBlock","true"],["adsOk","true"],["check","true"],["isal","true"],["document.hidden","true"],["awm","true"],["adblockEnabled","false"],["is_adblocked","false"],["ABLK","false"],["pogo.intermission.staticAdIntermissionPeriod","0"],["SubmitDownload1","noopFunc"],["t","0"],["ckaduMobilePop","noopFunc"],["tieneAdblock","0"],["adsAreBlocked","false"],["cmgpbjs","false"],["displayAdblockOverlay","false"],["google","false"],["Math.pow","noopFunc"],["openInNewTab","noopFunc"],["runAdBlocker","false"],["Adblock","false"],["flashvars.logo_url",""],["flashvars.logo_text",""],["nlf.custom.userCapabilities","false"],["count","0"],["LoadThisScript","true"],["showPremLite","true"],["closeBlockerModal","false"],["adBlockDetector.isEnabled","falseFunc"],["areAdsDisplayed","true"],["gkAdsWerbung","true"],["document.bridCanRunAds","true"],["pop_target","null"],["is_banner","true"],["$easyadvtblock","false"],["show_dfp_preroll","false"],["show_youtube_preroll","false"],["doads","true"],["jsUnda","noopFunc"],["AlobaidiDetectAdBlock","true"],["Advertisement","1"],["adBlockDetected","false"],["abp1","1"],["pr_okvalida","true"],["$.ajax","trueFunc"],["cnbc.canShowAds","true"],["ue_adb_chk","1"],["firefaucet","true"],["cRAds","true"],["uas","[]"],["flashvars.popunder_url","undefined"],["adv","true"],["prerollMain","undefined"],["canRunAds","true"],["Fingerprint2","true"],["dclm_ajax_var.disclaimer_redirect_url",""],["load_pop_power","noopFunc"],["adBlockDetected","true"],["Time_Start","0"],["blockAdBlock","trueFunc"],["ezstandalone.enabled","true"],["foundation.adPlayer.bitmovin","{}"],["DL8_GLOBALS.enableAdSupport","false"],["DL8_GLOBALS.useHomad","false"],["DL8_GLOBALS.enableHomadDesktop","false"],["DL8_GLOBALS.enableHomadMobile","false"],["Object.prototype.adReinsertion","noopFunc"],["getHomadConfig","noopFunc"],["ab","false"],["go_popup","{}"],["noBlocker","true"],["adsbygoogle","null"],["fabActive","false"],["gWkbAdVert","true"],["noblock","true"],["wgAffiliateEnabled","false"],["ads","null"],["detectAdblock","noopFunc"],["adsLoadable","true"],["ASSetCookieAds","null"],["letShowAds","true"],["ulp_noadb","true"],["Object.prototype.adblock_detected","false"],["timeSec","0"],["adsbygoogle.loaded","true"],["ads_unblocked","true"],["xxSetting.adBlockerDetection","false"],["open","undefined"],["Drupal.behaviors.adBlockerPopup","null"],["fake_ad","true"],["koddostu_com_adblock_yok","null"],["adsbygoogle","trueFunc"],["player.ads.cuePoints","undefined"],["adBlockDetected","null"],["better_ads_adblock","1"],["Adv_ab","false"],["sgpbCanRunAds","true"],["document.hidden","false"],["document.hasFocus","trueFunc"],["hasFocus","trueFunc"],["navigator.brave","undefined"],["Object.prototype.isAllAdClose","true"],["isRequestPresent","true"],["fouty","true"],["Notification","undefined"],["protection","noopFunc"],["private","false"],["navigator.webkitTemporaryStorage.queryUsageAndQuota","noopFunc"],["document.onkeydown","noopFunc"],["showadas","true"],["alert","throwFunc"],["iktimer","0"],["aSl.gcd","0"],["window.adLink","null"],["detectedAdblock","undefined"],["isTabActive","true"],["clicked","2"],["ov.advertising.tisoomi.loadScript","noopFunc"],["abp","false"],["hommy","{}"],["hommy.waitUntil","noopFunc"],["flashvars.mlogo",""],["vpPrerollVideo","undefined"],["hold_click","false"],["admiral","noopFunc"],["gnt.u.adfree","true"],["__INITIAL_DATA__.siteData.admiralScript"],["objAd.loadAdShield","noopFunc"],["window.myAd.runAd","noopFunc"],["__INITIAL_STATE__.config.theme.ads.isAdBlockerEnabled","false"],["__INITIAL_STATE__.gameLists.gamesNoPrerollIds.indexOf","trueFunc"],["document.ontouchend","null"],["document.onclick","null"],["pubAdsService","trueFunc"],["config.pauseInspect","false"],["appContext.adManager.context.current.adFriendly","false"],["blockAdBlock._options.baitClass","null"],["document.blocked_var","1"],["____ads_js_blocked","false"],["wIsAdBlocked","false"],["WebSite.plsDisableAdBlock","null"],["ads_blocked","false"],["samDetected","false"],["countClicks","0"],["settings.adBlockerDetection","false"],["mixpanel.get_distinct_id","true"],["fuckAdBlock._options.baitClass","null"],["bscheck.adblocker","noopFunc"],["qpcheck.ads","noopFunc"],["isContentBlocked","falseFunc"],["CloudflareApps.installs.Ik7rmQ4t95Qk.options.measureDomain","undefined"],["detectAB1","noopFunc"],["uBlockOriginDetected","false"],["googletag._vars_","{}"],["googletag._loadStarted_","true"],["googletag._loaded_","true"],["google_unique_id","1"],["google.javascript","{}"],["google.javascript.ads","{}"],["google_global_correlator","1"],["paywallGateway.truncateContent","noopFunc"],["adBlockDisabled","true"],["blockedElement","noopFunc"],["popit","false"],["adBlockerDetected","false"],["abu","falseFunc"],["countdown","0"],["decodeURI","noopFunc"],["flashvars.adv_postpause_vast",""],["univresalP","noopFunc"],["xv_ad_block","0"],["openWindow","noopFunc"],["vidorev_jav_plugin_video_ads_object.vid_ads_m_video_ads",""],["adsProvider.init","noopFunc"],["SDKLoaded","true"],["blockAdBlock._creatBait","null"],["POPUNDER_ENABLED","false"],["plugins.preroll","noopFunc"],["errcode","0"],["DHAntiAdBlocker","true"],["showada","true"],["showax","true"],["p18","undefined"],["ADBLOCKED","false"],["Object.prototype.adsEnabled","false"],["adb","0"],["String.fromCharCode","trueFunc"],["adblock_use","false"],["Object.prototype.adblockFound","false"],["nitroAds.loaded","true"],["createCanvas","noopFunc"],["playerAdSettings.adLink",""],["playerAdSettings.waitTime","0"],["xv.sda.pp.init","noopFunc"],["isAdsLoaded","true"],["adblockerAlert","noopFunc"],["Object.prototype.parseXML","noopFunc"],["Object.prototype.blackscreenDuration","1"],["Object.prototype.adPlayerId",""],["adblockDetect","noopFunc"],["style","noopFunc"],["history.pushState","noopFunc"],["google_unique_id","6"],["__NEXT_DATA__.props.pageProps.adsConfig","undefined"],["new_config.timedown","0"],["truex","{}"],["truex.client","noopFunc"],["hiddenProxyDetected","false"],["isadb","false"],["SteadyWidgetSettings.adblockActive","false"],["proclayer","noopFunc"],["timeleft","0"],["load_ads","trueFunc"],["detectAdBlock","noopFunc"],["starPop","1"],["Object.prototype.ads","noopFunc"],["detectBlockAds","noopFunc"],["ga","trueFunc"],["ad_link",""],["penciBlocksArray","[]"],["App.AdblockDetected","false"],["SF.adblock","true"],["startfrom","0"],["D4zz","noopFunc"],["Object.prototype.ads.nopreroll_","true"],["HP_Scout.adBlocked","false"],["SD_IS_BLOCKING","false"],["Object.prototype.isPremium","true"],["__BACKPLANE_API__.renderOptions.showAdBlock",""],["Object.prototype.isNoAds","{}"],["tv3Cmp.ConsentGiven","true"],["countDownDate","0"],["setupSkin","noopFunc"],["Object.prototype.enableInterstitial","false"],["ads","undefined"],["td_ad_background_click_link","undefined"],["ADBLOCK","false"],["POSTPART_prototype.ADKEY","noopFunc"],["adBlockDetected","falseFunc"],["divWidth","1"],["noAdBlock","noopFunc"],["AdService.info.abd","noopFunc"],["adBlockDetectionResult","undefined"],["popped","true"],["puShown1","true"],["passthetest","true"],["timeset","0"],["pandaAdviewValidate","true"],["canGetAds","true"],["ad_blocker_active","false"],["init_welcome_ad","noopFunc"],["moneyAbovePrivacyByvCDN","true"],["document.body.contains","trueFunc"],["popunder","undefined"],["distance","0"],["document.onclick",""],["adEnable","true"],["displayAds","0"],["_adshrink.skiptime","0"],["AbleToRunAds","true"],["PreRollAd.timeCounter","0"],["TextEncoder","undefined"],["abpblocked","undefined"],["app.showModalAd","noopFunc"],["paAddUnit","noopFunc"],["adt","0"],["test_adblock","noopFunc"],["adblockDetector","noopFunc"],["vastEnabled","false"],["detectadsbocker","false"],["two_worker_data_js.js","[]"],["FEATURE_DISABLE_ADOBE_POPUP_BY_COUNTRY","true"],["questpassGuard","noopFunc"],["isAdBlockerEnabled","false"],["sssp","emptyObj"],["smartLoaded","true"],["timeLeft","0"],["Cookiebot","noopFunc"],["feature_flags.interstitial_ads_flag","false"],["feature_flags.interstitials_every_four_slides","false"],["waldoSlotIds","true"],["adblockstatus","false"],["adScriptLoaded","true"],["adblockEnabled","noopFunc"],["adSettings","[]"],["banner_is_blocked","false"],["Object.prototype.adBlocked","false"],["chp_adblock_browser","noopFunc"],["googleAd","true"],["Brid.A9.prototype.backfillAdUnits","[]"],["dct","0"],["slideShow.displayInterstitial","true"],["googletag","true"],["tOS2","150"],["checkAdBlocker","noopFunc"],["PlayerConfig.config.CustomAdSetting","[]"],["navigator.standalone","true"],["ShowAdvertising","{}"],["empire.pop","undefined"],["empire.direct","undefined"],["empire.directHideAds","undefined"],["empire.mediaData.advisorMovie","1"],["empire.mediaData.advisorSerie","1"],["setTimer","0"],["penci_adlbock.ad_blocker_detector","0"],["Object.prototype.adblockDetector","noopFunc"],["blext","true"],["vidorev_jav_plugin_video_ads_object","{}"],["vidorev_jav_plugin_video_ads_object_post","{}"],["S_Popup","10"],["rabLimit","-1"],["nudgeAdBlock","noopFunc"],["feedBack.showAffilaePromo","noopFunc"],["FAVE.settings.ads.ssai.prod.clips.enabled","false"],["FAVE.settings.ads.ssai.prod.liveAuth.enabled","false"],["FAVE.settings.ads.ssai.prod.liveUnauth.enabled","false"],["HTMLScriptElement.prototype.onerror","null"],["loadpagecheck","noopFunc"],["art3m1sItemNames.affiliate-wrapper","\"\""],["window.adngin","{}"],["amzn_aps_csm","{}"],["amzn_aps_csm.define","noopFunc"],["isAdBlockerActive","noopFunc"],["di.app.WebplayerApp.Ads.Adblocks.app.AdBlockDetectApp.startWithParent","false"],["sharedController.adblockDetector","noopFunc"],["checkAdsStatus","noopFunc"],["ads","[]"],["settings.adBlockDetectionEnabled","false"],["displayInterstitialAdConfig","false"],["checkAdBlockeraz","noopFunc"],["blockingAds","false"],["Yii2App.playbackTimeout","0"],["QiyiPlayerProphetData.a.data","{}"],["toggleAdBlockInfo","falseFunc"],["aipAPItag.prerollSkipped","true"],["aipAPItag.setPreRollStatus","trueFunc"],["reklam_1_saniye","0"],["reklam_1_gecsaniye","0"],["reklamsayisi","1"],["reklam_1",""],["powerAPITag","emptyObj"],["playerEnhancedConfig.run","throwFunc"],["aoAdBlockDetected","false"],["rodo.checkIsDidomiConsent","noopFunc"],["rodo.waitForConsent","noopPromiseResolve"],["xtime","0"],["Div_popup",""],["Scribd.Blob.AdBlockerModal","noopFunc"],["AddAdsV2I.addBlock","false"],["hasAdBlocker","false"],["initials.yld-pdpopunder",""],["download_click","true"],["advertisement3","true"],["importFAB","undefined"],["clicked","true"],["eClicked","true"],["number","0"],["sync","true"],["PlayerLogic.prototype.detectADB","noopFunc"],["showPopunder","noopFunc"],["Object.prototype.prerollAds","[]"],["notifyMe","noopFunc"],["adsClasses","undefined"],["gsecs","0"],["dvsize","52"],["majorse","true"],["completed","1"],["testerli","false"],["w87.abd","noopFunc"],["document.referrer",""],["Object.prototype.setNeedShowAdblockWarning","noopFunc"],["NoAdBlock","noopFunc"],["adList","[]"],["ifmax","true"],["nitroAds.abp","true"],["onloadUI","noopFunc"],["PageLoader.DetectAb","0"],["one_time","1"],["consentGiven","true"],["playID","1"],["GEMG.GPT.Interstitial","noopFunc"],["amiblock","0"],["karte3","18"],["sandDetect","noopFunc"],["amodule.data","emptyArr"],["Object.prototype.ADBLOCK_DETECTION",""],["postroll","undefined"],["interstitial","undefined"],["isAdBlockDetected","false"],["pData.adblockOverlayEnabled","0"],["cabdSettings","undefined"],["td_ad_background_click_link"],["malisx","true"],["ADS.isBannersEnabled","false"],["EASYFUN_ADS_CAN_RUN","true"],["adsbygoogle_ama_fc_has_run","true"],["jwDefaults.advertising","{}"],["elimina_profilazione","1"],["elimina_pubblicita","1"],["abd","{}"],["checkerimg","noopFunc"],["detectedAdblock","noopFunc"],["Object.prototype.DetectByGoogleAd","noopFunc"],["nitroAds","{}"],["nitroAds.createAd","noopFunc"],["NativeAd","noopFunc"],["Blob","noopFunc"],["window.navigator.brave","undefined"],["HTMLScriptElement.prototype.onerror","undefined"],["isAdblock","false"],["openPop","noopFunc"],["attachEvent","trueFunc"],["cns.library","true"],["BJSShowUnder","{}"],["BJSShowUnder.bindTo","noopFunc"],["BJSShowUnder.add","noopFunc"],["Object.prototype._parseVAST","noopFunc"],["Object.prototype.createAdBlocker","noopFunc"],["Object.prototype.isAdPeriod","falseFunc"],["countDown","0"],["runCheck","noopFunc"],["adsSlotRenderEndSeen","true"],["showModal","noopFunc"],["flashvars.mlogo_link",""],["isAdBlocked","noopFunc"],["URLlist","[]"],["aaw","{}"],["aaw.processAdsOnPage","noopFunc"],["doOpen","undefined"],["HTMLImageElement.prototype.onerror","undefined"],["FOXIZ_MAIN_SCRIPT.siteAccessDetector","noopFunc"],["openAdBlockPopup","noopFunc"],["Object.prototype._adsDisabled","true"],["advanced_ads_check_adblocker","noopFunc"],["canRunAds","1"],["attestHasAdBlockerActivated","true"],["extInstalled","true"],["SaveFiles.add","noopFunc"],["detectSandbox","noopFunc"],["rwt","noopFunc"],["bmak.js_post","false"],["firebase.analytics","noopFunc"],["Object.prototype.updateModifiedCommerceUrl","noopFunc"],["flashvars.event_reporting",""],["Object.prototype.has_opted_out_tracking","trueFunc"],["Visitor","{}"],["send_gravity_event","noopFunc"],["send_recommendation_event","noopFunc"],["libAnalytics.data.get","noopFunc"],["adthrive._components.start","noopFunc"],["navigator.sendBeacon","noopFunc"]];
const hostnamesMap = new Map([["mariatheserepublican.com",0],["gogoanime.*",[0,192]],["adrianmissionminute.com",0],["alejandrocenturyoil.com",0],["alleneconomicmatter.com",0],["apinchcaseation.com",0],["bethshouldercan.com",0],["bigclatterhomesguideservice.com",0],["bradleyviewdoctor.com",0],["brittneystandardwestern.com",0],["brookethoughi.com",0],["brucevotewithin.com",0],["cindyeyefinal.com",0],["denisegrowthwide.com",0],["diananatureforeign.com",0],["donaldlineelse.com",0],["edwardarriveoften.com",0],["erikcoldperson.com",0],["evelynthankregion.com",0],["graceaddresscommunity.com",0],["heatherdiscussionwhen.com",0],["heatherwholeinvolve.com",0],["housecardsummerbutton.com",0],["jamessoundcost.com",0],["jamesstartstudent.com",0],["jamiesamewalk.com",0],["jasminetesttry.com",0],["jasonresponsemeasure.com",0],["jayservicestuff.com",0],["jennifercertaindevelopment.com",0],["jessicaglassauthor.com",0],["johntryopen.com",0],["jonathansociallike.com",0],["josephseveralconcern.com",0],["kennethofficialitem.com",0],["kristiesoundsimply.com",0],["lisatrialidea.com",0],["lorimuchbenefit.com",0],["loriwithinfamily.com",0],["lukecomparetwo.com",0],["markstyleall.com",0],["michaelapplysome.com",0],["morganoperationface.com",0],["nathanfromsubject.com",0],["nectareousoverelate.com",0],["paulkitchendark.com",0],["rebeccaneverbase.com",0],["richardsignfish.com",0],["roberteachfinal.com",0],["robertordercharacter.com",0],["robertplacespace.com",0],["ryanagoinvolve.com",0],["sandratableother.com",0],["sandrataxeight.com",0],["seanshowcould.com",0],["sethniceletter.com",0],["shannonpersonalcost.com",0],["sharonwhiledemocratic.com",0],["stevenimaginelittle.com",0],["strawberriesporail.com",0],["susanhavekeep.com",0],["timberwoodanotia.com",0],["tinycat-voe-fashion.com",0],["toddpartneranimal.com",0],["troyyourlead.com",0],["uptodatefinishconference.com",0],["uptodatefinishconferenceroom.com",0],["vincentincludesuccessful.com",0],["voe.sx",0],["maxfinishseveral.com",0],["voe.sx>>",0],["javboys.tv>>",0],["freeplayervideo.com",0],["nazarickol.com",0],["player-cdn.com",0],["playhydrax.com",[0,402,403]],["rabbitstream.net",0],["fmovies.*",0],["u26bekrb.fun",1],["pvpoke-re.com",[2,3]],["client.falixnodes.net",[4,5,590,591,592]],["br.de",6],["indeed.com",7],["pasteboard.co",8],["clickhole.com",9],["deadspin.com",9],["gizmodo.com",9],["jalopnik.com",9],["jezebel.com",9],["kotaku.com",9],["lifehacker.com",9],["splinternews.com",9],["theinventory.com",9],["theonion.com",9],["theroot.com",9],["thetakeout.com",9],["pewresearch.org",9],["los40.com",[10,11]],["as.com",11],["telegraph.co.uk",[12,13]],["poweredbycovermore.com",[12,65]],["lumens.com",[12,65]],["verizon.com",14],["humanbenchmark.com",15],["politico.com",16],["officedepot.co.cr",[17,18]],["officedepot.*",[19,20]],["usnews.com",21],["coolmathgames.com",[22,285,286,287]],["video.gazzetta.it",[23,24]],["oggi.it",[23,24]],["manoramamax.com",23],["factable.com",25],["zee5.com",26],["gala.fr",27],["geo.fr",27],["voici.fr",27],["gloucestershirelive.co.uk",28],["arsiv.mackolik.com",29],["jacksonguitars.com",30],["scandichotels.com",31],["stylist.co.uk",32],["nettiauto.com",33],["thaiairways.com",[34,35]],["cerbahealthcare.it",[36,37]],["futura-sciences.com",[36,54]],["toureiffel.paris",36],["campusfrance.org",[36,149]],["tiendaenlinea.claro.com.ni",[38,39]],["tieba.baidu.com",40],["fandom.com",[41,42,346]],["grasshopper.com",[43,44]],["epson.com.cn",[45,46,47,48]],["oe24.at",[49,50]],["szbz.de",49],["platform.autods.com",[51,52]],["kcra.com",53],["wcvb.com",53],["sportdeutschland.tv",53],["wikihow.com",55],["citibank.com.sg",56],["uol.com.br",[57,58,59,60,61]],["gazzetta.gr",62],["digicol.dpm.org.cn",[63,64]],["virginmediatelevision.ie",66],["larazon.es",[67,68]],["waitrosecellar.com",[69,70,71]],["kicker.de",[72,388]],["sharpen-free-design-generator.netlify.app",[73,74]],["help.cashctrl.com",[75,76]],["gry-online.pl",77],["vidaextra.com",78],["commande.rhinov.pro",[79,80]],["ecom.wixapps.net",[79,80]],["tipranks.com",[81,82]],["iceland.co.uk",[83,84,85]],["socket.pearsoned.com",86],["tntdrama.com",[87,88]],["trutv.com",[87,88]],["mobile.de",[89,90]],["ioe.vn",[91,92]],["geiriadur.ac.uk",[91,95]],["welsh-dictionary.ac.uk",[91,95]],["bikeportland.org",[93,94]],["biologianet.com",[58,59,60]],["10play.com.au",[96,97]],["sunshine-live.de",[98,99]],["whatismyip.com",[100,101]],["myfitnesspal.com",102],["netoff.co.jp",[103,104]],["bluerabbitrx.com",[103,104]],["foundit.*",[105,106]],["clickjogos.com.br",107],["bristan.com",[108,109]],["zillow.com",110],["share.hntv.tv",[111,112,113,114]],["forum.dji.com",[111,114]],["unionpayintl.com",[111,113]],["streamelements.com",111],["optimum.net",[115,116]],["hdfcfund.com",117],["user.guancha.cn",[118,119]],["sosovalue.com",120],["bandyforbundet.no",[121,122]],["tatacommunications.com",123],["suamusica.com.br",[124,125,126]],["macrotrends.net",[127,128]],["code.world",129],["smartcharts.net",129],["topgear.com",130],["eservice.directauto.com",[131,132]],["nbcsports.com",133],["standard.co.uk",134],["pruefernavi.de",[135,136]],["speedtest.net",[137,138]],["17track.net",139],["visible.com",140],["hagerty.com",[141,142]],["marketplace.nvidia.com",143],["kino.de",[144,145]],["9now.nine.com.au",146],["worldstar.com",147],["prisjakt.no",148],["m.youtube.com",[150,151,152,153]],["music.youtube.com",[150,151,152,153]],["tv.youtube.com",[150,151,152,153]],["www.youtube.com",[150,151,152,153]],["youtubekids.com",[150,151,152,153]],["youtube-nocookie.com",[150,151,152,153]],["eu-proxy.startpage.com",[150,151,153]],["timesofindia.indiatimes.com",154],["economictimes.indiatimes.com",155],["motherless.com",156],["sueddeutsche.de",157],["watchanimesub.net",158],["wcoanimesub.tv",158],["wcoforever.net",158],["freeviewmovies.com",158],["filehorse.com",158],["guidetnt.com",158],["starmusiq.*",158],["sp-today.com",158],["linkvertise.com",158],["eropaste.net",158],["getpaste.link",158],["sharetext.me",158],["wcofun.*",158],["note.sieuthuthuat.com",158],["elcriticodelatele.com",[158,450]],["gadgets.es",[158,450]],["amateurporn.co",[158,254]],["wiwo.de",159],["primewire.*",160],["streanplay.*",[160,161]],["alphaporno.com",[160,539]],["porngem.com",160],["shortit.pw",[160,238]],["familyporn.tv",160],["sbplay.*",160],["id45.cyou",160],["85tube.com",[160,222]],["milfnut.*",160],["k1nk.co",160],["watchasians.cc",160],["soltoshindo.com",160],["sankakucomplex.com",162],["player.glomex.com",163],["merkur.de",163],["tz.de",163],["sxyprn.*",164],["hqq.*",[165,166]],["waaw.*",[166,167]],["hotpornfile.org",166],["player.tabooporns.com",166],["x69.ovh",166],["wiztube.xyz",166],["younetu.*",166],["multiup.us",166],["peliculas8k.com",[166,167]],["video.q34r.org",166],["czxxx.org",166],["vtplayer.online",166],["vvtplayer.*",166],["netu.ac",166],["netu.frembed.lol",166],["dirtyvideo.fun",167],["adbull.org",168],["123link.*",168],["adshort.*",168],["mitly.us",168],["linkrex.net",168],["linx.cc",168],["oke.io",168],["linkshorts.*",168],["dz4link.com",168],["adsrt.*",168],["linclik.com",168],["shrt10.com",168],["vinaurl.*",168],["loptelink.com",168],["adfloz.*",168],["cut-fly.com",168],["linkfinal.com",168],["payskip.org",168],["cutpaid.com",168],["linkjust.com",168],["leechpremium.link",168],["icutlink.com",[168,259]],["oncehelp.com",168],["rgl.vn",168],["reqlinks.net",168],["bitlk.com",168],["qlinks.eu",168],["link.3dmili.com",168],["short-fly.com",168],["foxseotools.com",168],["dutchycorp.*",168],["shortearn.*",168],["pingit.*",168],["link.turkdown.com",168],["7r6.com",168],["oko.sh",168],["ckk.ai",168],["fc.lc",168],["fstore.biz",168],["shrink.*",168],["cuts-url.com",168],["eio.io",168],["exe.app",168],["exee.io",168],["exey.io",168],["skincarie.com",168],["exeo.app",168],["tmearn.*",168],["coinlyhub.com",[168,325]],["adsafelink.com",168],["aii.sh",168],["megalink.*",168],["cybertechng.com",[168,340]],["cutdl.xyz",168],["iir.ai",168],["shorteet.com",[168,358]],["miniurl.*",168],["smoner.com",168],["gplinks.*",168],["odisha-remix.com",[168,340]],["xpshort.com",[168,340]],["upshrink.com",168],["clk.*",168],["easysky.in",168],["veganab.co",168],["go.bloggingaro.com",168],["go.gyanitheme.com",168],["go.theforyou.in",168],["go.hipsonyc.com",168],["birdurls.com",168],["vipurl.in",168],["try2link.com",168],["jameeltips.us",168],["gainl.ink",168],["promo-visits.site",168],["satoshi-win.xyz",[168,374]],["shorterall.com",168],["encurtandourl.com",168],["forextrader.site",168],["postazap.com",168],["cety.app",168],["exego.app",[168,369]],["cutlink.net",168],["cutsy.net",168],["cutyurls.com",168],["cutty.app",168],["cutnet.net",168],["jixo.online",168],["tinys.click",[168,340]],["cpm.icu",168],["panyshort.link",168],["enagato.com",168],["pandaznetwork.com",168],["tpi.li",168],["oii.la",168],["recipestutorials.com",168],["pureshort.*",168],["shrinke.*",168],["shrinkme.*",168],["shrinkforearn.in",168],["oii.io",168],["du-link.in",168],["atglinks.com",168],["thotpacks.xyz",168],["megaurl.in",168],["megafly.in",168],["simana.online",168],["fooak.com",168],["joktop.com",168],["evernia.site",168],["falpus.com",168],["link.paid4link.com",168],["exalink.fun",168],["shortxlinks.com",168],["upfion.com",168],["upfiles.app",168],["upfiles-urls.com",168],["flycutlink.com",[168,340]],["linksly.co",168],["link1s.*",168],["pkr.pw",168],["imagenesderopaparaperros.com",168],["shortenbuddy.com",168],["apksvip.com",168],["4cash.me",168],["namaidani.com",168],["shortzzy.*",168],["teknomuda.com",168],["shorttey.*",[168,324]],["miuiku.com",168],["savelink.site",168],["lite-link.*",168],["adcorto.*",168],["samaa-pro.com",168],["miklpro.com",168],["modapk.link",168],["ccurl.net",168],["linkpoi.me",168],["menjelajahi.com",168],["pewgame.com",168],["haonguyen.top",168],["zshort.*",168],["crazyblog.in",168],["gtlink.co",168],["cutearn.net",168],["rshrt.com",168],["filezipa.com",168],["dz-linkk.com",168],["upfiles.*",168],["theblissempire.com",168],["finanzas-vida.com",168],["adurly.cc",168],["paid4.link",168],["link.asiaon.top",168],["go.gets4link.com",168],["linkfly.*",168],["beingtek.com",168],["shorturl.unityassets4free.com",168],["disheye.com",168],["techymedies.com",168],["techysuccess.com",168],["za.gl",[168,274]],["bblink.com",168],["myad.biz",168],["swzz.xyz",168],["vevioz.com",168],["charexempire.com",168],["clk.asia",168],["linka.click",168],["sturls.com",168],["myshrinker.com",168],["snowurl.com",[168,340]],["netfile.cc",168],["wplink.*",168],["rocklink.in",168],["techgeek.digital",168],["download3s.net",168],["shortx.net",168],["shortawy.com",168],["tlin.me",168],["apprepack.com",168],["up-load.one",168],["zuba.link",168],["bestcash2020.com",168],["hoxiin.com",168],["paylinnk.com",168],["thizissam.in",168],["ier.ai",168],["adslink.pw",168],["novelssites.com",168],["links.medipost.org",168],["faucetcrypto.net",168],["short.freeltc.top",168],["trxking.xyz",168],["weadown.com",168],["m.bloggingguidance.com",168],["blog.onroid.com",168],["link.codevn.net",168],["upfilesurls.com",168],["link4rev.site",168],["c2g.at",168],["bitcosite.com",[168,553]],["cryptosh.pro",168],["link68.net",168],["traffic123.net",168],["windowslite.net",[168,340]],["viewfr.com",168],["cl1ca.com",168],["4br.me",168],["fir3.net",168],["seulink.*",168],["encurtalink.*",168],["kiddyshort.com",168],["watchmygf.me",[169,193]],["camwhores.*",[169,179,221,222,223]],["camwhorez.tv",[169,179,221,222]],["cambay.tv",[169,201,221,251,253,254,255,256]],["fpo.xxx",[169,201]],["sexemix.com",169],["heavyfetish.com",[169,714]],["thotcity.su",169],["viralxxxporn.com",[169,392]],["tube8.*",[170,171]],["you-porn.com",171],["youporn.*",171],["youporngay.com",171],["youpornru.com",171],["redtube.*",171],["9908ww.com",171],["adelaidepawnbroker.com",171],["bztube.com",171],["hotovs.com",171],["insuredhome.org",171],["nudegista.com",171],["pornluck.com",171],["vidd.se",171],["pornhub.*",[171,313]],["pornhub.com",171],["pornerbros.com",172],["freep.com",172],["porn.com",173],["tune.pk",174],["noticias.gospelmais.com.br",175],["techperiod.com",175],["viki.com",[176,177]],["watch-series.*",178],["watchseries.*",178],["vev.*",178],["vidop.*",178],["vidup.*",178],["sleazyneasy.com",[179,180,181]],["smutr.com",[179,321]],["tktube.com",179],["yourporngod.com",[179,180]],["javbangers.com",[179,439]],["camfox.com",179],["camthots.tv",[179,251]],["shegotass.info",179],["amateur8.com",179],["bigtitslust.com",179],["ebony8.com",179],["freeporn8.com",179],["lesbian8.com",179],["maturetubehere.com",179],["sortporn.com",179],["motherporno.com",[179,180,201,253]],["theporngod.com",[179,180]],["watchdirty.to",[179,222,223,254]],["pornsocket.com",182],["luxuretv.com",183],["porndig.com",[184,185]],["webcheats.com.br",186],["ceesty.com",[187,188]],["gestyy.com",[187,188]],["corneey.com",188],["destyy.com",188],["festyy.com",188],["sh.st",188],["mitaku.net",188],["angrybirdsnest.com",189],["zrozz.com",189],["clix4btc.com",189],["4tests.com",189],["goltelevision.com",189],["news-und-nachrichten.de",189],["laradiobbs.net",189],["urlaubspartner.net",189],["produktion.de",189],["cinemaxxl.de",189],["bladesalvador.com",189],["tempr.email",189],["cshort.org",189],["friendproject.net",189],["covrhub.com",189],["katfile.com",[189,622]],["trust.zone",189],["business-standard.com",189],["planetsuzy.org",190],["empflix.com",191],["1movies.*",[192,198]],["xmovies8.*",192],["masteranime.tv",192],["0123movies.*",192],["gostream.*",192],["gomovies.*",192],["transparentcalifornia.com",193],["deepbrid.com",194],["webnovel.com",195],["streamwish.*",[196,197]],["oneupload.to",197],["wishfast.top",197],["rubystm.com",197],["rubyvid.com",197],["rubyvidhub.com",197],["stmruby.com",197],["streamruby.com",197],["schwaebische.de",199],["8tracks.com",200],["3movs.com",201],["bravoerotica.net",[201,253]],["youx.xxx",201],["camclips.tv",[201,321]],["xtits.*",[201,253]],["camflow.tv",[201,253,254,293,392]],["camhoes.tv",[201,251,253,254,293,392]],["xmegadrive.com",201],["xxxymovies.com",201],["xxxshake.com",201],["gayck.com",201],["xhand.com",[201,253]],["analdin.com",[201,253]],["revealname.com",202],["pouvideo.*",203],["povvideo.*",203],["povw1deo.*",203],["povwideo.*",203],["powv1deo.*",203],["powvibeo.*",203],["powvideo.*",203],["powvldeo.*",203],["golfchannel.com",204],["stream.nbcsports.com",204],["mathdf.com",204],["gamcore.com",205],["porcore.com",205],["porngames.tv",205],["69games.xxx",205],["javmix.app",205],["tecknity.com",206],["haaretz.co.il",207],["haaretz.com",207],["hungama.com",207],["a-o.ninja",207],["anime-odcinki.pl",207],["kumpulmanga.org",207],["shortgoo.blogspot.com",207],["tonanmedia.my.id",[207,574]],["yurasu.xyz",207],["isekaipalace.com",207],["plyjam.*",[208,209]],["ennovelas.com",[209,213]],["foxsports.com.au",210],["canberratimes.com.au",210],["thesimsresource.com",211],["fxporn69.*",212],["vipbox.*",213],["viprow.*",213],["ctrl.blog",214],["sportlife.es",215],["finofilipino.org",216],["desbloqueador.*",217],["xberuang.*",218],["teknorizen.*",218],["mysflink.blogspot.com",218],["ashemaletube.*",219],["paktech2.com",219],["assia.tv",220],["assia4.com",220],["assia24.com",220],["cwtvembeds.com",[222,252]],["camlovers.tv",222],["porntn.com",222],["pornissimo.org",222],["sexcams-24.com",[222,254]],["watchporn.to",[222,254]],["camwhorez.video",222],["footstockings.com",[222,223,254]],["xmateur.com",[222,223,254]],["multi.xxx",223],["worldofbitco.in",[224,225]],["weatherx.co.in",[224,225]],["sunbtc.space",224],["subtorrents.*",226],["subtorrents1.*",226],["newpelis.*",226],["pelix.*",226],["allcalidad.*",226],["infomaniakos.*",226],["ojogos.com.br",227],["powforums.com",228],["supforums.com",228],["studybullet.com",228],["usgamer.net",229],["recordonline.com",229],["freebitcoin.win",230],["e-monsite.com",230],["coindice.win",230],["temp-mails.com",231],["freiepresse.de",232],["investing.com",233],["tornadomovies.*",234],["mp3fiber.com",235],["chicoer.com",236],["dailybreeze.com",236],["dailybulletin.com",236],["dailynews.com",236],["delcotimes.com",236],["eastbaytimes.com",236],["macombdaily.com",236],["ocregister.com",236],["pasadenastarnews.com",236],["pe.com",236],["presstelegram.com",236],["redlandsdailyfacts.com",236],["reviewjournal.com",236],["santacruzsentinel.com",236],["saratogian.com",236],["sentinelandenterprise.com",236],["sgvtribune.com",236],["tampabay.com",236],["times-standard.com",236],["theoaklandpress.com",236],["trentonian.com",236],["twincities.com",236],["whittierdailynews.com",236],["bostonherald.com",236],["dailycamera.com",236],["sbsun.com",236],["dailydemocrat.com",236],["montereyherald.com",236],["orovillemr.com",236],["record-bee.com",236],["redbluffdailynews.com",236],["reporterherald.com",236],["thereporter.com",236],["timescall.com",236],["timesheraldonline.com",236],["ukiahdailyjournal.com",236],["dailylocal.com",236],["mercurynews.com",236],["suedkurier.de",237],["anysex.com",239],["icdrama.*",240],["mangasail.*",240],["pornve.com",241],["file4go.*",242],["coolrom.com.au",242],["marie-claire.es",243],["gamezhero.com",243],["flashgirlgames.com",243],["onlinesudoku.games",243],["mpg.football",243],["sssam.com",243],["globalnews.ca",244],["drinksmixer.com",245],["leitesculinaria.com",245],["fupa.net",246],["browardpalmbeach.com",247],["dallasobserver.com",247],["houstonpress.com",247],["miaminewtimes.com",247],["phoenixnewtimes.com",247],["westword.com",247],["nhentai.net",[248,249]],["nowtv.com.tr",250],["caminspector.net",251],["camwhoreshd.com",251],["camgoddess.tv",251],["gay4porn.com",253],["mypornhere.com",253],["mangovideo.*",254],["love4porn.com",254],["thotvids.com",254],["watchmdh.to",254],["celebwhore.com",254],["cluset.com",254],["sexlist.tv",254],["4kporn.xxx",254],["xhomealone.com",254],["lusttaboo.com",[254,514]],["hentai-moon.com",254],["camhub.cc",[254,681]],["mediapason.it",257],["linkspaid.com",257],["tuotromedico.com",257],["neoteo.com",257],["phoneswiki.com",257],["celebmix.com",257],["myneobuxportal.com",257],["oyungibi.com",257],["25yearslatersite.com",257],["jeshoots.com",258],["techhx.com",258],["karanapk.com",258],["flashplayer.fullstacks.net",260],["cloudapps.herokuapp.com",260],["youfiles.herokuapp.com",260],["texteditor.nsspot.net",260],["temp-mail.org",261],["asianclub.*",262],["javhdporn.net",262],["vidmoly.to",263],["comnuan.com",264],["veedi.com",265],["battleboats.io",265],["anitube.*",266],["fruitlab.com",266],["acetack.com",266],["androidquest.com",266],["apklox.com",266],["chhaprawap.in",266],["gujarativyakaran.com",266],["kashmirstudentsinformation.in",266],["kisantime.com",266],["shetkaritoday.in",266],["pastescript.com",266],["trimorspacks.com",266],["updrop.link",266],["haddoz.net",266],["streamingcommunity.*",266],["garoetpos.com",266],["stiletv.it",267],["mixdrop.*",268],["hqtv.biz",269],["liveuamap.com",270],["muvibg.com",270],["audycje.tokfm.pl",271],["shush.se",272],["allkpop.com",273],["empire-anime.*",[274,569,570,571,572,573]],["empire-streaming.*",[274,569,570,571]],["empire-anime.com",[274,569,570,571]],["empire-streamz.fr",[274,569,570,571]],["empire-stream.*",[274,569,570,571]],["pickcrackpasswords.blogspot.com",275],["kfrfansub.com",276],["thuglink.com",276],["voipreview.org",276],["illicoporno.com",277],["lavoixdux.com",277],["tonpornodujour.com",277],["jacquieetmichel.net",277],["swame.com",277],["vosfemmes.com",277],["voyeurfrance.net",277],["jacquieetmicheltv.net",[277,630,631]],["hanime.tv",278],["pogo.com",279],["cloudvideo.tv",280],["legionjuegos.org",281],["legionpeliculas.org",281],["legionprogramas.org",281],["16honeys.com",282],["elespanol.com",283],["remodelista.com",284],["audiofanzine.com",288],["uploadev.*",289],["developerinsider.co",290],["thehindu.com",291],["cambro.tv",[292,293]],["boobsradar.com",[293,392,694]],["nibelungen-kurier.de",294],["adfoc.us",295],["tea-coffee.net",295],["spatsify.com",295],["newedutopics.com",295],["getviralreach.in",295],["edukaroo.com",295],["funkeypagali.com",295],["careersides.com",295],["nayisahara.com",295],["wikifilmia.com",295],["infinityskull.com",295],["viewmyknowledge.com",295],["iisfvirtual.in",295],["starxinvestor.com",295],["jkssbalerts.com",295],["sahlmarketing.net",295],["filmypoints.in",295],["fitnessholic.net",295],["moderngyan.com",295],["sattakingcharts.in",295],["freshbhojpuri.com",295],["bankshiksha.in",295],["earn.mpscstudyhub.com",295],["earn.quotesopia.com",295],["money.quotesopia.com",295],["best-mobilegames.com",295],["learn.moderngyan.com",295],["bharatsarkarijobalert.com",295],["quotesopia.com",295],["creditsgoal.com",295],["bgmi32bitapk.in",295],["techacode.com",295],["trickms.com",295],["ielts-isa.edu.vn",295],["loan.punjabworks.com",295],["rokni.xyz",295],["keedabankingnews.com",295],["sptfy.be",295],["mcafee-com.com",[295,369]],["pianetamountainbike.it",296],["barchart.com",297],["modelisme.com",298],["parasportontario.ca",298],["prescottenews.com",298],["nrj-play.fr",299],["hackingwithreact.com",300],["gutekueche.at",301],["eplfootballmatch.com",302],["ancient-origins.*",302],["peekvids.com",303],["playvids.com",303],["pornflip.com",303],["redensarten-index.de",304],["vw-page.com",305],["viz.com",[306,307]],["0rechner.de",308],["configspc.com",309],["xopenload.me",309],["uptobox.com",309],["uptostream.com",309],["japgay.com",310],["mega-debrid.eu",311],["dreamdth.com",312],["diaridegirona.cat",314],["diariodeibiza.es",314],["diariodemallorca.es",314],["diarioinformacion.com",314],["eldia.es",314],["emporda.info",314],["farodevigo.es",314],["laopinioncoruna.es",314],["laopiniondemalaga.es",314],["laopiniondemurcia.es",314],["laopiniondezamora.es",314],["laprovincia.es",314],["levante-emv.com",314],["mallorcazeitung.es",314],["regio7.cat",314],["superdeporte.es",314],["playpaste.com",315],["cnbc.com",316],["primevideo.com",317],["read.amazon.*",[317,705]],["firefaucet.win",318],["74k.io",[319,320]],["fullhdxxx.com",322],["pornclassic.tube",323],["tubepornclassic.com",323],["etonline.com",324],["creatur.io",324],["lookcam.*",324],["drphil.com",324],["urbanmilwaukee.com",324],["lootlinks.*",324],["ontiva.com",324],["hideandseek.world",324],["myabandonware.com",324],["kendam.com",324],["wttw.com",324],["synonyms.com",324],["definitions.net",324],["hostmath.com",324],["camvideoshub.com",324],["minhaconexao.com.br",324],["home-made-videos.com",326],["amateur-couples.com",326],["slutdump.com",326],["dpstream.*",327],["produsat.com",328],["bluemediafiles.*",329],["12thman.com",330],["acusports.com",330],["atlantic10.com",330],["auburntigers.com",330],["baylorbears.com",330],["bceagles.com",330],["bgsufalcons.com",330],["big12sports.com",330],["bigten.org",330],["bradleybraves.com",330],["butlersports.com",330],["cmumavericks.com",330],["conferenceusa.com",330],["cyclones.com",330],["dartmouthsports.com",330],["daytonflyers.com",330],["dbupatriots.com",330],["dbusports.com",330],["denverpioneers.com",330],["fduknights.com",330],["fgcuathletics.com",330],["fightinghawks.com",330],["fightingillini.com",330],["floridagators.com",330],["friars.com",330],["friscofighters.com",330],["gamecocksonline.com",330],["goarmywestpoint.com",330],["gobison.com",330],["goblueraiders.com",330],["gobobcats.com",330],["gocards.com",330],["gocreighton.com",330],["godeacs.com",330],["goexplorers.com",330],["goetbutigers.com",330],["gofrogs.com",330],["gogriffs.com",330],["gogriz.com",330],["golobos.com",330],["gomarquette.com",330],["gopack.com",330],["gophersports.com",330],["goprincetontigers.com",330],["gopsusports.com",330],["goracers.com",330],["goshockers.com",330],["goterriers.com",330],["gotigersgo.com",330],["gousfbulls.com",330],["govandals.com",330],["gowyo.com",330],["goxavier.com",330],["gozags.com",330],["gozips.com",330],["griffinathletics.com",330],["guhoyas.com",330],["gwusports.com",330],["hailstate.com",330],["hamptonpirates.com",330],["hawaiiathletics.com",330],["hokiesports.com",330],["huskers.com",330],["icgaels.com",330],["iuhoosiers.com",330],["jsugamecocksports.com",330],["longbeachstate.com",330],["loyolaramblers.com",330],["lrtrojans.com",330],["lsusports.net",330],["morrisvillemustangs.com",330],["msuspartans.com",330],["muleriderathletics.com",330],["mutigers.com",330],["navysports.com",330],["nevadawolfpack.com",330],["niuhuskies.com",330],["nkunorse.com",330],["nuhuskies.com",330],["nusports.com",330],["okstate.com",330],["olemisssports.com",330],["omavs.com",330],["ovcsports.com",330],["owlsports.com",330],["purduesports.com",330],["redstormsports.com",330],["richmondspiders.com",330],["sfajacks.com",330],["shupirates.com",330],["siusalukis.com",330],["smcgaels.com",330],["smumustangs.com",330],["soconsports.com",330],["soonersports.com",330],["themw.com",330],["tulsahurricane.com",330],["txst.com",330],["txstatebobcats.com",330],["ubbulls.com",330],["ucfknights.com",330],["ucirvinesports.com",330],["uconnhuskies.com",330],["uhcougars.com",330],["uicflames.com",330],["umterps.com",330],["uncwsports.com",330],["unipanthers.com",330],["unlvrebels.com",330],["uoflsports.com",330],["usdtoreros.com",330],["utahstateaggies.com",330],["utepathletics.com",330],["utrockets.com",330],["uvmathletics.com",330],["uwbadgers.com",330],["villanova.com",330],["wkusports.com",330],["wmubroncos.com",330],["woffordterriers.com",330],["1pack1goal.com",330],["bcuathletics.com",330],["bubraves.com",330],["goblackbears.com",330],["golightsgo.com",330],["gomcpanthers.com",330],["goutsa.com",330],["mercerbears.com",330],["pirateblue.com",330],["pirateblue.net",330],["pirateblue.org",330],["quinnipiacbobcats.com",330],["towsontigers.com",330],["tribeathletics.com",330],["tribeclub.com",330],["utepminermaniacs.com",330],["utepminers.com",330],["wkutickets.com",330],["aopathletics.org",330],["atlantichockeyonline.com",330],["bigsouthnetwork.com",330],["bigsouthsports.com",330],["chawomenshockey.com",330],["dbupatriots.org",330],["drakerelays.org",330],["ecac.org",330],["ecacsports.com",330],["emueagles.com",330],["emugameday.com",330],["gculopes.com",330],["godrakebulldog.com",330],["godrakebulldogs.com",330],["godrakebulldogs.net",330],["goeags.com",330],["goislander.com",330],["goislanders.com",330],["gojacks.com",330],["gomacsports.com",330],["gseagles.com",330],["hubison.com",330],["iowaconference.com",330],["ksuowls.com",330],["lonestarconference.org",330],["mascac.org",330],["midwestconference.org",330],["mountaineast.org",330],["niu-pack.com",330],["nulakers.ca",330],["oswegolakers.com",330],["ovcdigitalnetwork.com",330],["pacersports.com",330],["rmacsports.org",330],["rollrivers.com",330],["samfordsports.com",330],["uncpbraves.com",330],["usfdons.com",330],["wiacsports.com",330],["alaskananooks.com",330],["broncathleticfund.com",330],["cameronaggies.com",330],["columbiacougars.com",330],["etownbluejays.com",330],["gobadgers.ca",330],["golancers.ca",330],["gometrostate.com",330],["gothunderbirds.ca",330],["kentstatesports.com",330],["lehighsports.com",330],["lopers.com",330],["lycoathletics.com",330],["lycomingathletics.com",330],["maraudersports.com",330],["mauiinvitational.com",330],["msumavericks.com",330],["nauathletics.com",330],["nueagles.com",330],["nwusports.com",330],["oceanbreezenyc.org",330],["patriotathleticfund.com",330],["pittband.com",330],["principiaathletics.com",330],["roadrunnersathletics.com",330],["sidearmsocial.com",330],["snhupenmen.com",330],["stablerarena.com",330],["stoutbluedevils.com",330],["uwlathletics.com",330],["yumacs.com",330],["collegefootballplayoff.com",330],["csurams.com",330],["cubuffs.com",330],["gobearcats.com",330],["gohuskies.com",330],["mgoblue.com",330],["osubeavers.com",330],["pittsburghpanthers.com",330],["rolltide.com",330],["texassports.com",330],["thesundevils.com",330],["uclabruins.com",330],["wvuathletics.com",330],["wvusports.com",330],["arizonawildcats.com",330],["calbears.com",330],["cuse.com",330],["georgiadogs.com",330],["goducks.com",330],["goheels.com",330],["gostanford.com",330],["insidekstatesports.com",330],["insidekstatesports.info",330],["insidekstatesports.net",330],["insidekstatesports.org",330],["k-stateathletics.com",330],["k-statefootball.net",330],["k-statefootball.org",330],["k-statesports.com",330],["k-statesports.net",330],["k-statesports.org",330],["k-statewomenshoops.com",330],["k-statewomenshoops.net",330],["k-statewomenshoops.org",330],["kstateathletics.com",330],["kstatefootball.net",330],["kstatefootball.org",330],["kstatesports.com",330],["kstatewomenshoops.com",330],["kstatewomenshoops.net",330],["kstatewomenshoops.org",330],["ksuathletics.com",330],["ksusports.com",330],["scarletknights.com",330],["showdownforrelief.com",330],["syracusecrunch.com",330],["texastech.com",330],["theacc.com",330],["ukathletics.com",330],["usctrojans.com",330],["utahutes.com",330],["utsports.com",330],["wsucougars.com",330],["vidlii.com",[330,355]],["tricksplit.io",330],["fangraphs.com",331],["stern.de",332],["geo.de",332],["brigitte.de",332],["tvspielfilm.de",[333,334,335,336]],["tvtoday.de",[333,334,335,336]],["chip.de",[333,334,335,336]],["focus.de",[333,334,335,336]],["fitforfun.de",[333,334,335,336]],["n-tv.de",337],["player.rtl2.de",338],["planetaminecraft.com",339],["cravesandflames.com",340],["codesnse.com",340],["flyad.vip",340],["lapresse.ca",341],["kolyoom.com",342],["ilovephd.com",342],["negumo.com",343],["games.wkb.jp",[344,345]],["kenshi.fandom.com",347],["hausbau-forum.de",348],["homeairquality.org",348],["faucettronn.click",348],["fake-it.ws",349],["laksa19.github.io",350],["1shortlink.com",351],["u-s-news.com",352],["luscious.net",353],["makemoneywithurl.com",354],["junkyponk.com",354],["healthfirstweb.com",354],["vocalley.com",354],["yogablogfit.com",354],["howifx.com",[354,538]],["en.financerites.com",354],["mythvista.com",354],["livenewsflix.com",354],["cureclues.com",354],["apekite.com",354],["enit.in",354],["iammagnus.com",355],["dailyvideoreports.net",355],["unityassets4free.com",355],["docer.*",356],["resetoff.pl",356],["sexodi.com",356],["cdn77.org",357],["3sexporn.com",358],["momxxxsex.com",358],["myfreevintageporn.com",358],["penisbuyutucum.net",358],["ujszo.com",359],["newsmax.com",360],["nadidetarifler.com",361],["siz.tv",361],["suzylu.co.uk",[362,363]],["onworks.net",364],["yabiladi.com",364],["downloadsoft.net",365],["newsobserver.com",366],["arkadiumhosted.com",366],["testlanguages.com",367],["newsinlevels.com",367],["videosinlevels.com",367],["bookmystrip.com",368],["sabkiyojana.com",368],["starkroboticsfrc.com",369],["sinonimos.de",369],["antonimos.de",369],["quesignifi.ca",369],["tiktokrealtime.com",369],["tiktokcounter.net",369],["tpayr.xyz",369],["poqzn.xyz",369],["ashrfd.xyz",369],["rezsx.xyz",369],["tryzt.xyz",369],["ashrff.xyz",369],["rezst.xyz",369],["dawenet.com",369],["erzar.xyz",369],["waezm.xyz",369],["waezg.xyz",369],["blackwoodacademy.org",369],["cryptednews.space",369],["vivuq.com",369],["swgop.com",369],["vbnmll.com",369],["telcoinfo.online",369],["dshytb.com",369],["btcbitco.in",[369,373]],["btcsatoshi.net",369],["cempakajaya.com",369],["crypto4yu.com",369],["readbitcoin.org",369],["wiour.com",369],["finish.addurl.biz",369],["aiimgvlog.fun",[369,376]],["laweducationinfo.com",369],["savemoneyinfo.com",369],["worldaffairinfo.com",369],["godstoryinfo.com",369],["successstoryinfo.com",369],["cxissuegk.com",369],["learnmarketinfo.com",369],["bhugolinfo.com",369],["armypowerinfo.com",369],["rsadnetworkinfo.com",369],["rsinsuranceinfo.com",369],["rsfinanceinfo.com",369],["rsgamer.app",369],["rssoftwareinfo.com",369],["rshostinginfo.com",369],["rseducationinfo.com",369],["phonereviewinfo.com",369],["makeincomeinfo.com",369],["gknutshell.com",369],["vichitrainfo.com",369],["workproductivityinfo.com",369],["dopomininfo.com",369],["hostingdetailer.com",369],["fitnesssguide.com",369],["tradingfact4u.com",369],["cryptofactss.com",369],["softwaredetail.com",369],["artoffocas.com",369],["insurancesfact.com",369],["travellingdetail.com",369],["advertisingexcel.com",369],["allcryptoz.net",369],["batmanfactor.com",369],["beautifulfashionnailart.com",369],["crewbase.net",369],["documentaryplanet.xyz",369],["crewus.net",369],["gametechreviewer.com",369],["midebalonu.net",369],["misterio.ro",369],["phineypet.com",369],["seory.xyz",369],["shinbhu.net",369],["shinchu.net",369],["substitutefor.com",369],["talkforfitness.com",369],["thefitbrit.co.uk",369],["thumb8.net",369],["thumb9.net",369],["topcryptoz.net",369],["uniqueten.net",369],["ultraten.net",369],["exactpay.online",369],["quins.us",369],["kiddyearner.com",369],["imagereviser.com",370],["tech.pubghighdamage.com",371],["tech.techkhulasha.com",371],["hipsonyc.com",371],["jiocinema.com",371],["rapid-cloud.co",371],["uploadmall.com",371],["rkd3.dev",371],["4funbox.com",372],["nephobox.com",372],["1024tera.com",372],["terabox.*",372],["blog.cryptowidgets.net",373],["blog.insurancegold.in",373],["blog.wiki-topia.com",373],["blog.coinsvalue.net",373],["blog.cookinguide.net",373],["blog.freeoseocheck.com",373],["blog24.me",373],["bildirim.*",375],["arahdrive.com",376],["appsbull.com",377],["diudemy.com",377],["maqal360.com",[377,378,379]],["lifesurance.info",380],["akcartoons.in",381],["cybercityhelp.in",381],["infokeeda.xyz",382],["webzeni.com",382],["phongroblox.com",383],["fuckingfast.net",384],["tickhosting.com",385],["in91vip.win",386],["datavaults.co",387],["t-online.de",389],["upornia.*",[390,391]],["bobs-tube.com",392],["pornohirsch.net",393],["pixsera.net",394],["pc-builds.com",395],["qtoptens.com",395],["reuters.com",395],["today.com",395],["videogamer.com",395],["wrestlinginc.com",395],["usatoday.com",396],["ydr.com",396],["247sports.com",397],["indiatimes.com",398],["netzwelt.de",399],["arcade.buzzrtv.com",400],["arcade.dailygazette.com",400],["arcade.lemonde.fr",400],["arena.gamesforthebrain.com",400],["bestpuzzlesandgames.com",400],["cointiply.arkadiumarena.com",400],["gamelab.com",400],["games.abqjournal.com",400],["games.amny.com",400],["games.bellinghamherald.com",400],["games.besthealthmag.ca",400],["games.bnd.com",400],["games.boston.com",400],["games.bostonglobe.com",400],["games.bradenton.com",400],["games.centredaily.com",400],["games.charlotteobserver.com",400],["games.cnhinews.com",400],["games.crosswordgiant.com",400],["games.dailymail.co.uk",400],["games.dallasnews.com",400],["games.daytondailynews.com",400],["games.denverpost.com",400],["games.everythingzoomer.com",400],["games.fresnobee.com",400],["games.gameshownetwork.com",400],["games.get.tv",400],["games.greatergood.com",400],["games.heraldonline.com",400],["games.heraldsun.com",400],["games.idahostatesman.com",400],["games.insp.com",400],["games.islandpacket.com",400],["games.journal-news.com",400],["games.kansas.com",400],["games.kansascity.com",400],["games.kentucky.com",400],["games.lancasteronline.com",400],["games.ledger-enquirer.com",400],["games.macon.com",400],["games.mashable.com",400],["games.mercedsunstar.com",400],["games.metro.us",400],["games.metv.com",400],["games.miamiherald.com",400],["games.modbee.com",400],["games.moviestvnetwork.com",400],["games.myrtlebeachonline.com",400],["games.nationalreview.com",400],["games.newsobserver.com",400],["games.parade.com",400],["games.pressdemocrat.com",400],["games.puzzlebaron.com",400],["games.puzzler.com",400],["games.puzzles.ca",400],["games.qns.com",400],["games.readersdigest.ca",400],["games.sacbee.com",400],["games.sanluisobispo.com",400],["games.sixtyandme.com",400],["games.sltrib.com",400],["games.springfieldnewssun.com",400],["games.star-telegram.com",400],["games.startribune.com",400],["games.sunherald.com",400],["games.theadvocate.com",400],["games.thenewstribune.com",400],["games.theolympian.com",400],["games.theportugalnews.com",400],["games.thestar.com",400],["games.thestate.com",400],["games.tri-cityherald.com",400],["games.triviatoday.com",400],["games.usnews.com",400],["games.word.tips",400],["games.wordgenius.com",400],["games.wtop.com",400],["jeux.meteocity.com",400],["juegos.as.com",400],["juegos.elnuevoherald.com",400],["juegos.elpais.com",400],["philly.arkadiumarena.com",400],["play.dictionary.com",400],["puzzles.bestforpuzzles.com",400],["puzzles.centralmaine.com",400],["puzzles.crosswordsolver.org",400],["puzzles.independent.co.uk",400],["puzzles.nola.com",400],["puzzles.pressherald.com",400],["puzzles.standard.co.uk",400],["puzzles.sunjournal.com",400],["arkadium.com",401],["abysscdn.com",[402,403]],["arcai.com",404],["my-code4you.blogspot.com",405],["flickr.com",406],["firefile.cc",407],["pestleanalysis.com",407],["kochamjp.pl",407],["tutorialforlinux.com",407],["whatsaero.com",407],["animeblkom.net",[407,421]],["blkom.com",407],["globes.co.il",[408,409]],["jardiner-malin.fr",410],["tw-calc.net",411],["ohmybrush.com",412],["talkceltic.net",413],["mentalfloss.com",414],["uprafa.com",415],["cube365.net",416],["wwwfotografgotlin.blogspot.com",417],["freelistenonline.com",417],["badassdownloader.com",418],["quickporn.net",419],["yellowbridge.com",420],["aosmark.com",422],["ctrlv.*",423],["atozmath.com",[424,425,426,427,428,429,430]],["newyorker.com",431],["brighteon.com",432],["more.tv",433],["video1tube.com",434],["alohatube.xyz",434],["4players.de",435],["onlinesoccermanager.com",435],["fshost.me",436],["link.cgtips.org",437],["hentaicloud.com",438],["netfapx.com",440],["javdragon.org",440],["javneon.tv",440],["paperzonevn.com",441],["9jarock.org",442],["fzmovies.info",442],["fztvseries.ng",442],["netnaijas.com",442],["hentaienglish.com",443],["hentaiporno.xxx",443],["venge.io",[444,445]],["btcbux.io",446],["its.porn",[447,448]],["atv.at",449],["2ndrun.tv",450],["rackusreads.com",450],["teachmemicro.com",450],["willcycle.com",450],["kusonime.com",[451,452]],["123movieshd.*",453],["imgur.com",[454,455,715]],["hentai-party.com",456],["hentaicomics.pro",456],["xxx-comics.pro",456],["uproxy.*",457],["animesa.*",458],["subtitle.one",459],["subtitleone.cc",459],["genshinimpactcalculator.com",460],["mysexgames.com",461],["cinecalidad.*",[462,463]],["xnxx.com",464],["xvideos.*",464],["gdr-online.com",465],["mmm.dk",466],["iqiyi.com",[467,468,603]],["m.iqiyi.com",469],["nbcolympics.com",470],["apkhex.com",471],["indiansexstories2.net",472],["issstories.xyz",472],["1340kbbr.com",473],["gorgeradio.com",473],["kduk.com",473],["kedoam.com",473],["kejoam.com",473],["kelaam.com",473],["khsn1230.com",473],["kjmx.rocks",473],["kloo.com",473],["klooam.com",473],["klykradio.com",473],["kmed.com",473],["kmnt.com",473],["kool991.com",473],["kpnw.com",473],["kppk983.com",473],["krktcountry.com",473],["ktee.com",473],["kwro.com",473],["kxbxfm.com",473],["thevalley.fm",473],["quizlet.com",474],["dsocker1234.blogspot.com",475],["schoolcheats.net",[476,477]],["mgnet.xyz",478],["japopav.tv",479],["lvturbo.com",479],["designtagebuch.de",480],["pixroute.com",481],["uploady.io",482],["calculator-online.net",483],["luckydice.net",484],["adarima.org",484],["weatherwx.com",484],["sattaguess.com",484],["winshell.de",484],["rosasidan.ws",484],["modmakers.xyz",484],["gamepure.in",484],["warrenrahul.in",484],["austiblox.net",484],["upiapi.in",484],["daemonanime.net",484],["networkhint.com",484],["thichcode.net",484],["texturecan.com",484],["tikmate.app",[484,611]],["arcaxbydz.id",484],["quotesshine.com",484],["porngames.club",485],["sexgames.xxx",485],["111.90.159.132",486],["mobile-tracker-free.com",487],["pfps.gg",488],["social-unlock.com",489],["superpsx.com",490],["ninja.io",491],["sourceforge.net",492],["samfirms.com",493],["rapelust.com",494],["vtube.to",494],["vtplay.net",494],["desitelugusex.com",494],["dvdplay.*",494],["xvideos-downloader.net",494],["xxxvideotube.net",494],["sdefx.cloud",494],["nozomi.la",494],["moviesonlinefree.net",494],["banned.video",495],["madmaxworld.tv",495],["androidpolice.com",495],["babygaga.com",495],["backyardboss.net",495],["carbuzz.com",495],["cbr.com",495],["collider.com",495],["dualshockers.com",495],["footballfancast.com",495],["footballleagueworld.co.uk",495],["gamerant.com",495],["givemesport.com",495],["hardcoregamer.com",495],["hotcars.com",495],["howtogeek.com",495],["makeuseof.com",495],["moms.com",495],["movieweb.com",495],["pocket-lint.com",495],["pocketnow.com",495],["screenrant.com",495],["simpleflying.com",495],["thegamer.com",495],["therichest.com",495],["thesportster.com",495],["thethings.com",495],["thetravel.com",495],["topspeed.com",495],["xda-developers.com",495],["huffpost.com",496],["ingles.com",497],["spanishdict.com",497],["surfline.com",[498,499]],["play.tv3.ee",500],["play.tv3.lt",500],["play.tv3.lv",[500,501]],["tv3play.skaties.lv",500],["trendyoum.com",502],["bulbagarden.net",503],["hollywoodlife.com",504],["mat6tube.com",505],["hotabis.com",506],["root-nation.com",506],["italpress.com",506],["airsoftmilsimnews.com",506],["artribune.com",506],["textstudio.co",507],["newtumbl.com",508],["apkmaven.*",509],["aruble.net",510],["nevcoins.club",511],["mail.com",512],["gmx.*",513],["mangakita.id",515],["avpgalaxy.net",516],["mhma12.tech",517],["panda-novel.com",518],["zebranovel.com",518],["lightsnovel.com",518],["eaglesnovel.com",518],["pandasnovel.com",518],["ewrc-results.com",519],["kizi.com",520],["cyberscoop.com",521],["fedscoop.com",521],["canale.live",522],["jeep-cj.com",523],["sponsorhunter.com",524],["cloudcomputingtopics.net",525],["likecs.com",526],["tiscali.it",527],["linkspy.cc",528],["adshnk.com",529],["chattanoogan.com",530],["adsy.pw",531],["playstore.pw",531],["socialmediagirls.com",532],["windowspro.de",533],["snapinst.app",534],["tvtv.ca",535],["tvtv.us",535],["mydaddy.cc",536],["roadtrippin.fr",537],["vavada5com.com",538],["anyporn.com",[539,556]],["bravoporn.com",539],["bravoteens.com",539],["crocotube.com",539],["hellmoms.com",539],["hellporno.com",539],["sex3.com",539],["tubewolf.com",539],["xbabe.com",539],["xcum.com",539],["zedporn.com",539],["imagetotext.info",540],["infokik.com",541],["freepik.com",542],["ddwloclawek.pl",[543,544]],["www.seznam.cz",545],["deezer.com",546],["my-subs.co",547],["plaion.com",548],["slideshare.net",[549,550]],["ustreasuryyieldcurve.com",551],["businesssoftwarehere.com",552],["goo.st",552],["freevpshere.com",552],["softwaresolutionshere.com",552],["gamereactor.*",554],["madoohd.com",555],["doomovie-hd.*",555],["staige.tv",557],["androidadult.com",558],["streamvid.net",559],["watchtv24.com",560],["cellmapper.net",561],["medscape.com",562],["newscon.org",[563,564]],["wheelofgold.com",565],["drakecomic.*",565],["bembed.net",566],["embedv.net",566],["fslinks.org",566],["listeamed.net",566],["v6embed.xyz",566],["vembed.*",566],["vgplayer.xyz",566],["vid-guard.com",566],["vinomo.xyz",566],["app.blubank.com",567],["mobileweb.bankmellat.ir",567],["chat.nrj.fr",568],["chat.tchatche.com",[568,583]],["ccthesims.com",575],["chromeready.com",575],["coursedrive.org",575],["dtbps3games.com",575],["illustratemagazine.com",575],["uknip.co.uk",575],["vod.pl",576],["megadrive-emulator.com",577],["tvhay.*",[578,579]],["animesaga.in",580],["moviesapi.club",580],["bestx.stream",580],["watchx.top",580],["digimanie.cz",581],["svethardware.cz",581],["srvy.ninja",582],["cnn.com",[584,585,586]],["news.bg",587],["edmdls.com",588],["freshremix.net",588],["scenedl.org",588],["trakt.tv",589],["shroomers.app",593],["classicalradio.com",594],["di.fm",594],["jazzradio.com",594],["radiotunes.com",594],["rockradio.com",594],["zenradio.com",594],["getthit.com",595],["techedubyte.com",596],["soccerinhd.com",596],["movie-th.tv",597],["iwanttfc.com",598],["nutraingredients-asia.com",599],["nutraingredients-latam.com",599],["nutraingredients-usa.com",599],["nutraingredients.com",599],["ozulscansen.com",600],["nexusmods.com",601],["lookmovie.*",602],["lookmovie2.to",602],["biletomat.pl",604],["hextank.io",[605,606]],["filmizlehdfilm.com",[607,608,609,610]],["filmizletv.*",[607,608,609,610]],["fullfilmizle.cc",[607,608,609,610]],["gofilmizle.net",[607,608,609,610]],["btvplus.bg",612],["sagewater.com",613],["redlion.net",613],["filmweb.pl",[614,615]],["satdl.com",616],["vidstreaming.xyz",617],["everand.com",618],["myradioonline.pl",619],["cbs.com",620],["paramountplus.com",620],["fullxh.com",621],["galleryxh.site",621],["megaxh.com",621],["movingxh.world",621],["seexh.com",621],["unlockxh4.com",621],["valuexh.life",621],["xhaccess.com",621],["xhadult2.com",621],["xhadult3.com",621],["xhadult4.com",621],["xhadult5.com",621],["xhamster.*",621],["xhamster1.*",621],["xhamster10.*",621],["xhamster11.*",621],["xhamster12.*",621],["xhamster13.*",621],["xhamster14.*",621],["xhamster15.*",621],["xhamster16.*",621],["xhamster17.*",621],["xhamster18.*",621],["xhamster19.*",621],["xhamster20.*",621],["xhamster2.*",621],["xhamster3.*",621],["xhamster4.*",621],["xhamster42.*",621],["xhamster46.com",621],["xhamster5.*",621],["xhamster7.*",621],["xhamster8.*",621],["xhamsterporno.mx",621],["xhbig.com",621],["xhbranch5.com",621],["xhchannel.com",621],["xhdate.world",621],["xhday.com",621],["xhday1.com",621],["xhlease.world",621],["xhmoon5.com",621],["xhofficial.com",621],["xhopen.com",621],["xhplanet1.com",621],["xhplanet2.com",621],["xhreal2.com",621],["xhreal3.com",621],["xhspot.com",621],["xhtotal.com",621],["xhtree.com",621],["xhvictory.com",621],["xhwebsite.com",621],["xhwebsite2.com",621],["xhwebsite5.com",621],["xhwide1.com",621],["xhwide2.com",621],["xhwide5.com",621],["file-upload.net",623],["lightnovelworld.*",624],["acortalo.*",[625,626,627,628]],["acortar.*",[625,626,627,628]],["megadescarga.net",[625,626,627,628]],["megadescargas.net",[625,626,627,628]],["hentaihaven.xxx",629],["jacquieetmicheltv2.net",631],["a2zapk.*",632],["fcportables.com",[633,634]],["emurom.net",635],["freethesaurus.com",[636,637]],["thefreedictionary.com",[636,637]],["oeffentlicher-dienst.info",638],["im9.eu",639],["dcdlplayer8a06f4.xyz",640],["ultimate-guitar.com",641],["claimbits.net",642],["sexyscope.net",643],["kickassanime.*",644],["recherche-ebook.fr",645],["virtualdinerbot.com",645],["zonebourse.com",646],["pink-sluts.net",647],["andhrafriends.com",648],["benzinpreis.de",649],["turtleviplay.xyz",650],["defenseone.com",651],["govexec.com",651],["nextgov.com",651],["route-fifty.com",651],["sharing.wtf",652],["wetter3.de",653],["esportivos.fun",654],["cosmonova-broadcast.tv",655],["hartvannederland.nl",656],["shownieuws.nl",656],["vandaaginside.nl",656],["rock.porn",[657,658]],["videzz.net",[659,660]],["ezaudiobookforsoul.com",661],["club386.com",662],["decompiler.com",663],["littlebigsnake.com",664],["easyfun.gg",665],["smailpro.com",666],["ilgazzettino.it",667],["ilmessaggero.it",667],["3bmeteo.com",[668,669]],["mconverter.eu",670],["lover937.net",671],["10gb.vn",672],["pes6.es",673],["tactics.tools",[674,675]],["boundhub.com",676],["alocdnnetu.xyz",677],["reliabletv.me",678],["jakondo.ru",679],["filecrypt.*",680],["nolive.me",682],["wired.com",683],["spankbang.*",[684,685,686,717,718]],["hulu.com",[687,688,689]],["anonymfile.com",690],["gofile.to",690],["dotycat.com",691],["rateyourmusic.com",692],["reporterpb.com.br",693],["blog-dnz.com",695],["18adultgames.com",696],["colnect.com",[697,698]],["adultgamesworld.com",699],["bgmiupdate.com.in",700],["reviewdiv.com",701],["parametric-architecture.com",702],["laurelberninteriors.com",[703,720]],["voiceofdenton.com",704],["concealednation.org",704],["askattest.com",706],["opensubtitles.com",707],["savefiles.com",708],["streamup.ws",709],["www.google.*",710],["tacobell.com",711],["zefoy.com",712],["cnet.com",713],["natgeotv.com",716],["globo.com",719],["wayfair.com",721]]);
const exceptionsMap = new Map([["cloudflare.com",[0]],["pingit.com",[168]],["loan.bgmi32bitapk.in",[295]],["lookmovie.studio",[602]]]);
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
