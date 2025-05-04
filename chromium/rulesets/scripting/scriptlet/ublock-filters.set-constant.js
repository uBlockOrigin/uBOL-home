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
const argsList = [["console.clear","undefined"],["adBlockDetected","undefined"],["scrollTo","noopFunc"],["akamaiDisableServerIpLookup","noopFunc"],["DD_RUM.addAction","noopFunc"],["nads.createAd","trueFunc"],["ga","noopFunc"],["huecosPBS.nstdX","null"],["DTM.trackAsyncPV","noopFunc"],["_satellite","{}"],["_satellite.getVisitorId","noopFunc"],["newPageViewSpeedtest","noopFunc"],["pubg.unload","noopFunc"],["generateGalleryAd","noopFunc"],["mediator","noopFunc"],["Object.prototype.subscribe","noopFunc"],["gbTracker","{}"],["gbTracker.sendAutoSearchEvent","noopFunc"],["Object.prototype.vjsPlayer.ads","noopFunc"],["network_user_id",""],["google.ima.OmidVerificationVendor","{}"],["Object.prototype.omidAccessModeRules","{}"],["googletag.cmd","{}"],["Object.prototype.setDisableFlashAds","noopFunc"],["DD_RUM.addTiming","noopFunc"],["chameleonVideo.adDisabledRequested","true"],["AdmostClient","{}"],["analytics","{}"],["datalayer","[]"],["Object.prototype.isInitialLoadDisabled","noopFunc"],["listingGoogleEETracking","noopFunc"],["dcsMultiTrack","noopFunc"],["urlStrArray","noopFunc"],["pa","{}"],["Object.prototype.setConfigurations","noopFunc"],["Object.prototype.bk_addPageCtx","noopFunc"],["Object.prototype.bk_doJSTag","noopFunc"],["passFingerPrint","noopFunc"],["optimizely","{}"],["optimizely.initialized","true"],["google_optimize","{}"],["google_optimize.get","noopFunc"],["_gsq","{}"],["_gsq.push","noopFunc"],["stmCustomEvent","noopFunc"],["_gsDevice",""],["iom","{}"],["iom.c","noopFunc"],["_conv_q","{}"],["_conv_q.push","noopFunc"],["google.ima.settings.setDisableFlashAds","noopFunc"],["pa.privacy","{}"],["Object.prototype.getTargetingMap","noopFunc"],["populateClientData4RBA","noopFunc"],["YT.ImaManager","noopFunc"],["UOLPD","{}"],["UOLPD.dataLayer","{}"],["__configuredDFPTags","{}"],["URL_VAST_YOUTUBE","{}"],["Adman","{}"],["dplus","{}"],["dplus.track","noopFunc"],["_satellite.track","noopFunc"],["google.ima.dai","{}"],["gfkS2sExtension","{}"],["gfkS2sExtension.HTML5VODExtension","noopFunc"],["AnalyticsEventTrackingJS","{}"],["AnalyticsEventTrackingJS.addToBasket","noopFunc"],["AnalyticsEventTrackingJS.trackErrorMessage","noopFunc"],["initializeslideshow","noopFunc"],["fathom","{}"],["fathom.trackGoal","noopFunc"],["Origami","{}"],["Origami.fastclick","noopFunc"],["jad","undefined"],["hasAdblocker","true"],["Sentry","{}"],["Sentry.init","noopFunc"],["TRC","{}"],["TRC._taboolaClone","[]"],["fp","{}"],["fp.t","noopFunc"],["fp.s","noopFunc"],["initializeNewRelic","noopFunc"],["turnerAnalyticsObj","{}"],["turnerAnalyticsObj.setVideoObject4AnalyticsProperty","noopFunc"],["optimizelyDatafile","{}"],["optimizelyDatafile.featureFlags","[]"],["fingerprint","{}"],["fingerprint.getCookie","noopFunc"],["gform.utils","noopFunc"],["gform.utils.trigger","noopFunc"],["get_fingerprint","noopFunc"],["moatPrebidApi","{}"],["moatPrebidApi.getMoatTargetingForPage","noopFunc"],["cpd_configdata","{}"],["cpd_configdata.url",""],["yieldlove_cmd","{}"],["yieldlove_cmd.push","noopFunc"],["dataLayer.push","noopFunc"],["_etmc","{}"],["_etmc.push","noopFunc"],["freshpaint","{}"],["freshpaint.track","noopFunc"],["ShowRewards","noopFunc"],["stLight","{}"],["stLight.options","noopFunc"],["DD_RUM.addError","noopFunc"],["sensorsDataAnalytic201505","{}"],["sensorsDataAnalytic201505.init","noopFunc"],["sensorsDataAnalytic201505.quick","noopFunc"],["sensorsDataAnalytic201505.track","noopFunc"],["s","{}"],["s.tl","noopFunc"],["smartech","noopFunc"],["sensors","{}"],["sensors.init","noopFunc"],["sensors.track","noopFunc"],["adn","{}"],["adn.clearDivs","noopFunc"],["_vwo_code","{}"],["gtag","noopFunc"],["_taboola","{}"],["_taboola.push","noopFunc"],["clicky","{}"],["clicky.goal","noopFunc"],["WURFL","{}"],["_sp_.config.events.onSPPMObjectReady","noopFunc"],["gtm","{}"],["gtm.trackEvent","noopFunc"],["mParticle.Identity.getCurrentUser","noopFunc"],["JSGlobals.prebidEnabled","false"],["elasticApm","{}"],["elasticApm.init","noopFunc"],["Object.prototype.que","noopFunc"],["Object.prototype.que.push","noopFunc"],["ga.sendGaEvent","noopFunc"],["adobe","{}"],["MT","{}"],["MT.track","noopFunc"],["adex","{}"],["adex.getAdexUser","noopFunc"],["Adkit","noopFunc"],["Object.prototype.shouldExpectGoogleCMP","false"],["apntag.refresh","noopFunc"],["ytInitialPlayerResponse.playerAds","undefined"],["ytInitialPlayerResponse.adPlacements","undefined"],["ytInitialPlayerResponse.adSlots","undefined"],["playerResponse.adPlacements","undefined"],["nsShowMaxCount","0"],["objVc.interstitial_web",""],["_ml_ads_ns","null"],["_sp_.config","undefined"],["isAdBlockActive","false"],["AdController","noopFunc"],["console.clear","noopFunc"],["console.log","noopFunc"],["Object.prototype.hideAds","true"],["Object.prototype._getSalesHouseConfigurations","noopFunc"],["vast_urls","{}"],["sadbl","false"],["adblockcheck","false"],["arrvast","[]"],["blurred","false"],["flashvars.adv_pre_src",""],["showPopunder","false"],["page_params.holiday_promo","true"],["adsEnabled","true"],["String.prototype.charAt","trueFunc"],["ad_blocker","false"],["blockAdBlock","true"],["VikiPlayer.prototype.pingAbFactor","noopFunc"],["player.options.disableAds","true"],["console.clear","trueFunc"],["flashvars.adv_pre_vast",""],["flashvars.adv_pre_vast_alt",""],["x_width","1"],["_site_ads_ns","true"],["luxuretv.config",""],["Object.prototype.AdOverlay","noopFunc"],["tkn_popunder","null"],["can_run_ads","true"],["adsBlockerDetector","noopFunc"],["globalThis","null"],["adblock","false"],["__ads","true"],["FlixPop.isPopGloballyEnabled","falseFunc"],["check_adblock","true"],["$.magnificPopup.open","noopFunc"],["adsenseadBlock","noopFunc"],["adblockSuspected","false"],["xRds","true"],["cRAds","false"],["String.prototype.charCodeAt","trueFunc"],["disasterpingu","false"],["App.views.adsView.adblock","false"],["flashvars.adv_pause_html",""],["$.fx.off","true"],["isAdb","false"],["adBlockEnabled","false"],["puShown","true"],["ads_b_test","true"],["showAds","true"],["attr","{}"],["scriptSrc",""],["cxStartDetectionProcess","noopFunc"],["isAdBlocked","false"],["adblock","noopFunc"],["path",""],["_ctrl_vt.blocked.ad_script","false"],["blockAdBlock","noopFunc"],["caca","noopFunc"],["Ok","true"],["safelink.adblock","false"],["openPopunder","noopFunc"],["ClickUnder","noopFunc"],["flashvars.adv_pre_url",""],["flashvars.protect_block",""],["flashvars.video_click_url",""],["adBlock","false"],["spoof","noopFunc"],["btoa","null"],["sp_ad","true"],["adsBlocked","false"],["_sp_.msg.displayMessage","noopFunc"],["CaptchmeState.adb","undefined"],["indexedDB.open","trueFunc"],["UhasAB","false"],["adNotificationDetected","false"],["atob","noopFunc"],["_pop","noopFunc"],["CnnXt.Event.fire","noopFunc"],["_ti_update_user","noopFunc"],["valid","1"],["vastAds","[]"],["adblock","1"],["frg","1"],["time","0"],["ads","true"],["GNCA_Ad_Support","true"],["Date.now","noopFunc"],["jQuery.adblock","1"],["VMG.Components.Adblock","false"],["_n_app.popunder","null"],["N_BetterJsPop.object","{}"],["adblockDetector","trueFunc"],["hasPoped","true"],["flashvars.video_click_url","undefined"],["flashvars.adv_start_html",""],["flashvars.popunder_url",""],["flashvars.adv_post_src",""],["flashvars.adv_post_url",""],["jQuery.adblock","false"],["google_jobrunner","true"],["sec","0"],["gadb","false"],["checkadBlock","noopFunc"],["clientSide.adbDetect","noopFunc"],["HTMLAnchorElement.prototype.click","noopFunc"],["cmnnrunads","true"],["adBlocker","false"],["adBlockDetected","noopFunc"],["StileApp.somecontrols.adBlockDetected","noopFunc"],["MDCore.adblock","0"],["google_tag_data","noopFunc"],["noAdBlock","true"],["adsOk","true"],["check","true"],["isal","true"],["document.hidden","true"],["awm","true"],["adblockEnabled","false"],["is_adblocked","false"],["ABLK","false"],["pogo.intermission.staticAdIntermissionPeriod","0"],["SubmitDownload1","noopFunc"],["t","0"],["ckaduMobilePop","noopFunc"],["tieneAdblock","0"],["adsAreBlocked","false"],["cmgpbjs","false"],["displayAdblockOverlay","false"],["google","false"],["Math.pow","noopFunc"],["openInNewTab","noopFunc"],["runAdBlocker","false"],["Adblock","false"],["flashvars.logo_url",""],["flashvars.logo_text",""],["nlf.custom.userCapabilities","false"],["count","0"],["LoadThisScript","true"],["showPremLite","true"],["closeBlockerModal","false"],["adBlockDetector.isEnabled","falseFunc"],["areAdsDisplayed","true"],["gkAdsWerbung","true"],["document.bridCanRunAds","true"],["pop_target","null"],["is_banner","true"],["$easyadvtblock","false"],["show_dfp_preroll","false"],["show_youtube_preroll","false"],["doads","true"],["jsUnda","noopFunc"],["AlobaidiDetectAdBlock","true"],["Advertisement","1"],["adBlockDetected","false"],["abp1","1"],["pr_okvalida","true"],["$.ajax","trueFunc"],["cnbc.canShowAds","true"],["ue_adb_chk","1"],["firefaucet","true"],["cRAds","true"],["uas","[]"],["flashvars.popunder_url","undefined"],["adv","true"],["prerollMain","undefined"],["canRunAds","true"],["Fingerprint2","true"],["dclm_ajax_var.disclaimer_redirect_url",""],["load_pop_power","noopFunc"],["adBlockDetected","true"],["Time_Start","0"],["blockAdBlock","trueFunc"],["ezstandalone.enabled","true"],["foundation.adPlayer.bitmovin","{}"],["DL8_GLOBALS.enableAdSupport","false"],["DL8_GLOBALS.useHomad","false"],["DL8_GLOBALS.enableHomadDesktop","false"],["DL8_GLOBALS.enableHomadMobile","false"],["Object.prototype.adReinsertion","noopFunc"],["getHomadConfig","noopFunc"],["ab","false"],["go_popup","{}"],["noBlocker","true"],["adsbygoogle","null"],["fabActive","false"],["gWkbAdVert","true"],["noblock","true"],["wgAffiliateEnabled","false"],["ads","null"],["detectAdblock","noopFunc"],["adsLoadable","true"],["ASSetCookieAds","null"],["letShowAds","true"],["ulp_noadb","true"],["Object.prototype.adblock_detected","false"],["timeSec","0"],["adsbygoogle.loaded","true"],["ads_unblocked","true"],["xxSetting.adBlockerDetection","false"],["open","undefined"],["Drupal.behaviors.adBlockerPopup","null"],["fake_ad","true"],["koddostu_com_adblock_yok","null"],["adsbygoogle","trueFunc"],["player.ads.cuePoints","undefined"],["adBlockDetected","null"],["better_ads_adblock","1"],["Adv_ab","false"],["sgpbCanRunAds","true"],["document.hidden","false"],["document.hasFocus","trueFunc"],["hasFocus","trueFunc"],["navigator.brave","undefined"],["Object.prototype.isAllAdClose","true"],["isRequestPresent","true"],["fouty","true"],["Notification","undefined"],["protection","noopFunc"],["private","false"],["navigator.webkitTemporaryStorage.queryUsageAndQuota","noopFunc"],["document.onkeydown","noopFunc"],["showadas","true"],["alert","throwFunc"],["iktimer","0"],["aSl.gcd","0"],["window.adLink","null"],["detectedAdblock","undefined"],["isTabActive","true"],["clicked","2"],["ov.advertising.tisoomi.loadScript","noopFunc"],["abp","false"],["hommy","{}"],["hommy.waitUntil","noopFunc"],["flashvars.mlogo",""],["vpPrerollVideo","undefined"],["hold_click","false"],["admiral","noopFunc"],["gnt.u.adfree","true"],["__INITIAL_DATA__.siteData.admiralScript"],["objAd.loadAdShield","noopFunc"],["window.myAd.runAd","noopFunc"],["__INITIAL_STATE__.config.theme.ads.isAdBlockerEnabled","false"],["__INITIAL_STATE__.gameLists.gamesNoPrerollIds.indexOf","trueFunc"],["document.ontouchend","null"],["document.onclick","null"],["pubAdsService","trueFunc"],["config.pauseInspect","false"],["appContext.adManager.context.current.adFriendly","false"],["blockAdBlock._options.baitClass","null"],["document.blocked_var","1"],["____ads_js_blocked","false"],["wIsAdBlocked","false"],["WebSite.plsDisableAdBlock","null"],["ads_blocked","false"],["samDetected","false"],["countClicks","0"],["settings.adBlockerDetection","false"],["mixpanel.get_distinct_id","true"],["fuckAdBlock._options.baitClass","null"],["bscheck.adblocker","noopFunc"],["qpcheck.ads","noopFunc"],["isContentBlocked","falseFunc"],["CloudflareApps.installs.Ik7rmQ4t95Qk.options.measureDomain","undefined"],["detectAB1","noopFunc"],["uBlockOriginDetected","false"],["googletag._vars_","{}"],["googletag._loadStarted_","true"],["googletag._loaded_","true"],["google_unique_id","1"],["google.javascript","{}"],["google.javascript.ads","{}"],["google_global_correlator","1"],["paywallGateway.truncateContent","noopFunc"],["adBlockDisabled","true"],["blockedElement","noopFunc"],["popit","false"],["adBlockerDetected","false"],["abu","falseFunc"],["countdown","0"],["decodeURI","noopFunc"],["flashvars.adv_postpause_vast",""],["univresalP","noopFunc"],["xv_ad_block","0"],["openWindow","noopFunc"],["vidorev_jav_plugin_video_ads_object.vid_ads_m_video_ads",""],["adsProvider.init","noopFunc"],["SDKLoaded","true"],["blockAdBlock._creatBait","null"],["POPUNDER_ENABLED","false"],["plugins.preroll","noopFunc"],["errcode","0"],["DHAntiAdBlocker","true"],["showada","true"],["showax","true"],["p18","undefined"],["ADBLOCKED","false"],["Object.prototype.adsEnabled","false"],["adb","0"],["String.fromCharCode","trueFunc"],["adblock_use","false"],["Object.prototype.adblockFound","false"],["nitroAds.loaded","true"],["createCanvas","noopFunc"],["playerAdSettings.adLink",""],["playerAdSettings.waitTime","0"],["xv.sda.pp.init","noopFunc"],["isAdsLoaded","true"],["adblockerAlert","noopFunc"],["Object.prototype.parseXML","noopFunc"],["Object.prototype.blackscreenDuration","1"],["Object.prototype.adPlayerId",""],["adblockDetect","noopFunc"],["style","noopFunc"],["history.pushState","noopFunc"],["google_unique_id","6"],["__NEXT_DATA__.props.pageProps.adsConfig","undefined"],["new_config.timedown","0"],["truex","{}"],["truex.client","noopFunc"],["hiddenProxyDetected","false"],["isadb","false"],["SteadyWidgetSettings.adblockActive","false"],["proclayer","noopFunc"],["timeleft","0"],["load_ads","trueFunc"],["detectAdBlock","noopFunc"],["starPop","1"],["Object.prototype.ads","noopFunc"],["detectBlockAds","noopFunc"],["ga","trueFunc"],["ad_link",""],["penciBlocksArray","[]"],["App.AdblockDetected","false"],["SF.adblock","true"],["startfrom","0"],["D4zz","noopFunc"],["Object.prototype.ads.nopreroll_","true"],["HP_Scout.adBlocked","false"],["SD_IS_BLOCKING","false"],["Object.prototype.isPremium","true"],["__BACKPLANE_API__.renderOptions.showAdBlock",""],["Object.prototype.isNoAds","{}"],["tv3Cmp.ConsentGiven","true"],["countDownDate","0"],["setupSkin","noopFunc"],["Object.prototype.enableInterstitial","false"],["ads","undefined"],["td_ad_background_click_link","undefined"],["ADBLOCK","false"],["POSTPART_prototype.ADKEY","noopFunc"],["adBlockDetected","falseFunc"],["divWidth","1"],["noAdBlock","noopFunc"],["AdService.info.abd","noopFunc"],["adBlockDetectionResult","undefined"],["popped","true"],["puShown1","true"],["passthetest","true"],["timeset","0"],["pandaAdviewValidate","true"],["canGetAds","true"],["ad_blocker_active","false"],["init_welcome_ad","noopFunc"],["moneyAbovePrivacyByvCDN","true"],["document.body.contains","trueFunc"],["popunder","undefined"],["distance","0"],["document.onclick",""],["adEnable","true"],["displayAds","0"],["_adshrink.skiptime","0"],["AbleToRunAds","true"],["PreRollAd.timeCounter","0"],["TextEncoder","undefined"],["abpblocked","undefined"],["app.showModalAd","noopFunc"],["paAddUnit","noopFunc"],["adt","0"],["test_adblock","noopFunc"],["adblockDetector","noopFunc"],["vastEnabled","false"],["detectadsbocker","false"],["two_worker_data_js.js","[]"],["FEATURE_DISABLE_ADOBE_POPUP_BY_COUNTRY","true"],["questpassGuard","noopFunc"],["isAdBlockerEnabled","false"],["sssp","emptyObj"],["smartLoaded","true"],["timeLeft","0"],["Cookiebot","noopFunc"],["feature_flags.interstitial_ads_flag","false"],["feature_flags.interstitials_every_four_slides","false"],["waldoSlotIds","true"],["adblockstatus","false"],["adScriptLoaded","true"],["adblockEnabled","noopFunc"],["adSettings","[]"],["banner_is_blocked","false"],["Object.prototype.adBlocked","false"],["chp_adblock_browser","noopFunc"],["googleAd","true"],["Brid.A9.prototype.backfillAdUnits","[]"],["dct","0"],["slideShow.displayInterstitial","true"],["googletag","true"],["tOS2","150"],["checkAdBlocker","noopFunc"],["PlayerConfig.config.CustomAdSetting","[]"],["navigator.standalone","true"],["ShowAdvertising","{}"],["empire.pop","undefined"],["empire.direct","undefined"],["empire.directHideAds","undefined"],["empire.mediaData.advisorMovie","1"],["empire.mediaData.advisorSerie","1"],["setTimer","0"],["penci_adlbock.ad_blocker_detector","0"],["Object.prototype.adblockDetector","noopFunc"],["blext","true"],["vidorev_jav_plugin_video_ads_object","{}"],["vidorev_jav_plugin_video_ads_object_post","{}"],["S_Popup","10"],["rabLimit","-1"],["nudgeAdBlock","noopFunc"],["feedBack.showAffilaePromo","noopFunc"],["FAVE.settings.ads.ssai.prod.clips.enabled","false"],["FAVE.settings.ads.ssai.prod.liveAuth.enabled","false"],["FAVE.settings.ads.ssai.prod.liveUnauth.enabled","false"],["loadpagecheck","noopFunc"],["art3m1sItemNames.affiliate-wrapper","\"\""],["window.adngin","{}"],["amzn_aps_csm","{}"],["amzn_aps_csm.define","noopFunc"],["isAdBlockerActive","noopFunc"],["di.app.WebplayerApp.Ads.Adblocks.app.AdBlockDetectApp.startWithParent","false"],["sharedController.adblockDetector","noopFunc"],["checkAdsStatus","noopFunc"],["ads","[]"],["settings.adBlockDetectionEnabled","false"],["displayInterstitialAdConfig","false"],["checkAdBlockeraz","noopFunc"],["blockingAds","false"],["Yii2App.playbackTimeout","0"],["QiyiPlayerProphetData.a.data","{}"],["toggleAdBlockInfo","falseFunc"],["aipAPItag.prerollSkipped","true"],["aipAPItag.setPreRollStatus","trueFunc"],["reklam_1_saniye","0"],["reklam_1_gecsaniye","0"],["reklamsayisi","1"],["reklam_1",""],["powerAPITag","emptyObj"],["playerEnhancedConfig.run","throwFunc"],["aoAdBlockDetected","false"],["rodo.checkIsDidomiConsent","noopFunc"],["rodo.waitForConsent","noopPromiseResolve"],["xtime","0"],["Div_popup",""],["Scribd.Blob.AdBlockerModal","noopFunc"],["AddAdsV2I.addBlock","false"],["hasAdBlocker","false"],["initials.yld-pdpopunder",""],["download_click","true"],["advertisement3","true"],["importFAB","undefined"],["clicked","true"],["eClicked","true"],["number","0"],["sync","true"],["PlayerLogic.prototype.detectADB","noopFunc"],["showPopunder","noopFunc"],["Object.prototype.prerollAds","[]"],["notifyMe","noopFunc"],["adsClasses","undefined"],["gsecs","0"],["dvsize","52"],["majorse","true"],["completed","1"],["testerli","false"],["w87.abd","noopFunc"],["document.referrer",""],["Object.prototype.setNeedShowAdblockWarning","noopFunc"],["NoAdBlock","noopFunc"],["adList","[]"],["ifmax","true"],["nitroAds.abp","true"],["onloadUI","noopFunc"],["PageLoader.DetectAb","0"],["one_time","1"],["consentGiven","true"],["playID","1"],["GEMG.GPT.Interstitial","noopFunc"],["amiblock","0"],["karte3","18"],["sandDetect","noopFunc"],["amodule.data","emptyArr"],["Object.prototype.ADBLOCK_DETECTION",""],["postroll","undefined"],["interstitial","undefined"],["isAdBlockDetected","false"],["pData.adblockOverlayEnabled","0"],["cabdSettings","undefined"],["td_ad_background_click_link"],["ADS.isBannersEnabled","false"],["EASYFUN_ADS_CAN_RUN","true"],["adsbygoogle_ama_fc_has_run","true"],["jwDefaults.advertising","{}"],["elimina_profilazione","1"],["elimina_pubblicita","1"],["abd","{}"],["checkerimg","noopFunc"],["detectedAdblock","noopFunc"],["Object.prototype.DetectByGoogleAd","noopFunc"],["nitroAds","{}"],["nitroAds.createAd","noopFunc"],["NativeAd","noopFunc"],["Blob","noopFunc"],["window.navigator.brave","undefined"],["HTMLScriptElement.prototype.onerror","undefined"],["isAdblock","false"],["openPop","noopFunc"],["attachEvent","trueFunc"],["cns.library","true"],["BJSShowUnder","{}"],["BJSShowUnder.bindTo","noopFunc"],["BJSShowUnder.add","noopFunc"],["Object.prototype._parseVAST","noopFunc"],["Object.prototype.createAdBlocker","noopFunc"],["Object.prototype.isAdPeriod","falseFunc"],["countDown","0"],["runCheck","noopFunc"],["adsSlotRenderEndSeen","true"],["showModal","noopFunc"],["flashvars.mlogo_link",""],["isAdBlocked","noopFunc"],["URLlist","[]"],["aaw","{}"],["aaw.processAdsOnPage","noopFunc"],["doOpen","undefined"],["HTMLImageElement.prototype.onerror","undefined"],["FOXIZ_MAIN_SCRIPT.siteAccessDetector","noopFunc"],["openAdBlockPopup","noopFunc"],["Object.prototype._adsDisabled","true"],["advanced_ads_check_adblocker","noopFunc"],["canRunAds","1"],["attestHasAdBlockerActivated","true"],["extInstalled","true"],["SaveFiles.add","noopFunc"],["detectSandbox","noopFunc"],["rwt","noopFunc"],["bmak.js_post","false"],["firebase.analytics","noopFunc"],["Object.prototype.updateModifiedCommerceUrl","noopFunc"],["flashvars.event_reporting",""],["Object.prototype.has_opted_out_tracking","trueFunc"],["Visitor","{}"],["send_gravity_event","noopFunc"],["send_recommendation_event","noopFunc"],["libAnalytics.data.get","noopFunc"],["adthrive._components.start","noopFunc"],["navigator.sendBeacon","noopFunc"]];
const hostnamesMap = new Map([["jonathansociallike.com",0],["gogoanime.*",[0,187]],["adrianmissionminute.com",0],["alejandrocenturyoil.com",0],["alleneconomicmatter.com",0],["apinchcaseation.com",0],["bethshouldercan.com",0],["bigclatterhomesguideservice.com",0],["bradleyviewdoctor.com",0],["brittneystandardwestern.com",0],["brookethoughi.com",0],["brucevotewithin.com",0],["cindyeyefinal.com",0],["denisegrowthwide.com",0],["diananatureforeign.com",0],["donaldlineelse.com",0],["edwardarriveoften.com",0],["erikcoldperson.com",0],["evelynthankregion.com",0],["graceaddresscommunity.com",0],["heatherdiscussionwhen.com",0],["heatherwholeinvolve.com",0],["housecardsummerbutton.com",0],["jamessoundcost.com",0],["jamesstartstudent.com",0],["jamiesamewalk.com",0],["jasminetesttry.com",0],["jasonresponsemeasure.com",0],["jayservicestuff.com",0],["jennifercertaindevelopment.com",0],["jessicaglassauthor.com",0],["johntryopen.com",0],["josephseveralconcern.com",0],["kennethofficialitem.com",0],["kristiesoundsimply.com",0],["lisatrialidea.com",0],["lorimuchbenefit.com",0],["loriwithinfamily.com",0],["lukecomparetwo.com",0],["markstyleall.com",0],["michaelapplysome.com",0],["morganoperationface.com",0],["nathanfromsubject.com",0],["nectareousoverelate.com",0],["paulkitchendark.com",0],["rebeccaneverbase.com",0],["richardsignfish.com",0],["roberteachfinal.com",0],["robertordercharacter.com",0],["robertplacespace.com",0],["ryanagoinvolve.com",0],["sandratableother.com",0],["sandrataxeight.com",0],["seanshowcould.com",0],["sethniceletter.com",0],["shannonpersonalcost.com",0],["sharonwhiledemocratic.com",0],["stevenimaginelittle.com",0],["strawberriesporail.com",0],["susanhavekeep.com",0],["timberwoodanotia.com",0],["tinycat-voe-fashion.com",0],["toddpartneranimal.com",0],["troyyourlead.com",0],["uptodatefinishconference.com",0],["uptodatefinishconferenceroom.com",0],["vincentincludesuccessful.com",0],["voe.sx",0],["maxfinishseveral.com",0],["voe.sx>>",0],["javboys.tv>>",0],["freeplayervideo.com",0],["nazarickol.com",0],["player-cdn.com",0],["playhydrax.com",[0,397,398]],["rabbitstream.net",0],["projectfreetv.one",0],["fmovies.*",0],["u26bekrb.fun",1],["pvpoke-re.com",2],["br.de",3],["indeed.com",4],["pasteboard.co",5],["clickhole.com",6],["deadspin.com",6],["gizmodo.com",6],["jalopnik.com",6],["jezebel.com",6],["kotaku.com",6],["lifehacker.com",6],["splinternews.com",6],["theinventory.com",6],["theonion.com",6],["theroot.com",6],["thetakeout.com",6],["pewresearch.org",6],["los40.com",[7,8]],["as.com",8],["telegraph.co.uk",[9,10]],["poweredbycovermore.com",[9,62]],["lumens.com",[9,62]],["verizon.com",11],["humanbenchmark.com",12],["politico.com",13],["officedepot.co.cr",[14,15]],["officedepot.*",[16,17]],["usnews.com",18],["coolmathgames.com",[19,280,281,282]],["video.gazzetta.it",[20,21]],["oggi.it",[20,21]],["manoramamax.com",20],["factable.com",22],["zee5.com",23],["gala.fr",24],["geo.fr",24],["voici.fr",24],["gloucestershirelive.co.uk",25],["arsiv.mackolik.com",26],["jacksonguitars.com",27],["scandichotels.com",28],["stylist.co.uk",29],["nettiauto.com",30],["thaiairways.com",[31,32]],["cerbahealthcare.it",[33,34]],["futura-sciences.com",[33,51]],["toureiffel.paris",33],["tiendaenlinea.claro.com.ni",[35,36]],["tieba.baidu.com",37],["fandom.com",[38,39,341]],["grasshopper.com",[40,41]],["epson.com.cn",[42,43,44,45]],["oe24.at",[46,47]],["szbz.de",46],["platform.autods.com",[48,49]],["kcra.com",50],["wcvb.com",50],["sportdeutschland.tv",50],["wikihow.com",52],["citibank.com.sg",53],["uol.com.br",[54,55,56,57,58]],["gazzetta.gr",59],["digicol.dpm.org.cn",[60,61]],["virginmediatelevision.ie",63],["larazon.es",[64,65]],["waitrosecellar.com",[66,67,68]],["kicker.de",[69,383]],["sharpen-free-design-generator.netlify.app",[70,71]],["help.cashctrl.com",[72,73]],["gry-online.pl",74],["vidaextra.com",75],["commande.rhinov.pro",[76,77]],["ecom.wixapps.net",[76,77]],["tipranks.com",[78,79]],["iceland.co.uk",[80,81,82]],["socket.pearsoned.com",83],["tntdrama.com",[84,85]],["trutv.com",[84,85]],["mobile.de",[86,87]],["ioe.vn",[88,89]],["geiriadur.ac.uk",[88,92]],["welsh-dictionary.ac.uk",[88,92]],["bikeportland.org",[90,91]],["biologianet.com",[55,56,57]],["10play.com.au",[93,94]],["sunshine-live.de",[95,96]],["whatismyip.com",[97,98]],["myfitnesspal.com",99],["netoff.co.jp",[100,101]],["foundit.*",[102,103]],["clickjogos.com.br",104],["bristan.com",[105,106]],["zillow.com",107],["share.hntv.tv",[108,109,110,111]],["forum.dji.com",[108,111]],["unionpayintl.com",[108,110]],["streamelements.com",108],["optimum.net",[112,113]],["hdfcfund.com",114],["user.guancha.cn",[115,116]],["sosovalue.com",117],["bandyforbundet.no",[118,119]],["tatacommunications.com",120],["suamusica.com.br",[121,122,123]],["macrotrends.net",[124,125]],["code.world",126],["smartcharts.net",126],["topgear.com",127],["eservice.directauto.com",[128,129]],["nbcsports.com",130],["standard.co.uk",131],["pruefernavi.de",[132,133]],["speedtest.net",[134,135]],["17track.net",136],["visible.com",137],["hagerty.com",[138,139]],["kino.de",[140,141]],["9now.nine.com.au",142],["worldstar.com",143],["prisjakt.no",144],["m.youtube.com",[145,146,147,148]],["music.youtube.com",[145,146,147,148]],["tv.youtube.com",[145,146,147,148]],["www.youtube.com",[145,146,147,148]],["youtubekids.com",[145,146,147,148]],["youtube-nocookie.com",[145,146,147,148]],["eu-proxy.startpage.com",[145,146,148]],["timesofindia.indiatimes.com",149],["economictimes.indiatimes.com",150],["motherless.com",151],["sueddeutsche.de",152],["watchanimesub.net",153],["wco.tv",153],["wcoanimesub.tv",153],["wcoforever.net",153],["freeviewmovies.com",153],["filehorse.com",153],["guidetnt.com",153],["starmusiq.*",153],["sp-today.com",153],["linkvertise.com",153],["eropaste.net",153],["getpaste.link",153],["sharetext.me",153],["wcofun.*",153],["note.sieuthuthuat.com",153],["elcriticodelatele.com",[153,445]],["gadgets.es",[153,445]],["amateurporn.co",[153,249]],["wiwo.de",154],["primewire.*",155],["streanplay.*",[155,156]],["alphaporno.com",[155,534]],["porngem.com",155],["shortit.pw",[155,233]],["familyporn.tv",155],["sbplay.*",155],["id45.cyou",155],["85tube.com",[155,217]],["milfnut.*",155],["k1nk.co",155],["watchasians.cc",155],["soltoshindo.com",155],["sankakucomplex.com",157],["player.glomex.com",158],["merkur.de",158],["tz.de",158],["sxyprn.*",159],["hqq.*",[160,161]],["waaw.*",[161,162]],["hotpornfile.org",161],["player.tabooporns.com",161],["x69.ovh",161],["wiztube.xyz",161],["younetu.*",161],["multiup.us",161],["peliculas8k.com",[161,162]],["video.q34r.org",161],["czxxx.org",161],["vtplayer.online",161],["vvtplayer.*",161],["netu.ac",161],["netu.frembed.lol",161],["dirtyvideo.fun",162],["adbull.org",163],["123link.*",163],["adshort.*",163],["mitly.us",163],["linkrex.net",163],["linx.cc",163],["oke.io",163],["linkshorts.*",163],["dz4link.com",163],["adsrt.*",163],["linclik.com",163],["shrt10.com",163],["vinaurl.*",163],["loptelink.com",163],["adfloz.*",163],["cut-fly.com",163],["linkfinal.com",163],["payskip.org",163],["cutpaid.com",163],["linkjust.com",163],["leechpremium.link",163],["icutlink.com",[163,254]],["oncehelp.com",163],["rgl.vn",163],["reqlinks.net",163],["bitlk.com",163],["qlinks.eu",163],["link.3dmili.com",163],["short-fly.com",163],["foxseotools.com",163],["dutchycorp.*",163],["shortearn.*",163],["pingit.*",163],["link.turkdown.com",163],["7r6.com",163],["oko.sh",163],["ckk.ai",163],["fc.lc",163],["fstore.biz",163],["shrink.*",163],["cuts-url.com",163],["eio.io",163],["exe.app",163],["exee.io",163],["exey.io",163],["skincarie.com",163],["exeo.app",163],["tmearn.*",163],["coinlyhub.com",[163,320]],["adsafelink.com",163],["aii.sh",163],["megalink.*",163],["cybertechng.com",[163,335]],["cutdl.xyz",163],["iir.ai",163],["shorteet.com",[163,353]],["miniurl.*",163],["smoner.com",163],["gplinks.*",163],["odisha-remix.com",[163,335]],["xpshort.com",[163,335]],["upshrink.com",163],["clk.*",163],["easysky.in",163],["veganab.co",163],["go.bloggingaro.com",163],["go.gyanitheme.com",163],["go.theforyou.in",163],["go.hipsonyc.com",163],["birdurls.com",163],["vipurl.in",163],["try2link.com",163],["jameeltips.us",163],["gainl.ink",163],["promo-visits.site",163],["satoshi-win.xyz",[163,369]],["shorterall.com",163],["encurtandourl.com",163],["forextrader.site",163],["postazap.com",163],["cety.app",163],["exego.app",[163,364]],["cutlink.net",163],["cutsy.net",163],["cutyurls.com",163],["cutty.app",163],["cutnet.net",163],["jixo.online",163],["tinys.click",[163,335]],["cpm.icu",163],["panyshort.link",163],["enagato.com",163],["pandaznetwork.com",163],["tpi.li",163],["oii.la",163],["recipestutorials.com",163],["pureshort.*",163],["shrinke.*",163],["shrinkme.*",163],["shrinkforearn.in",163],["oii.io",163],["du-link.in",163],["atglinks.com",163],["thotpacks.xyz",163],["megaurl.in",163],["megafly.in",163],["simana.online",163],["fooak.com",163],["joktop.com",163],["evernia.site",163],["falpus.com",163],["link.paid4link.com",163],["exalink.fun",163],["shortxlinks.com",163],["upfion.com",163],["upfiles.app",163],["upfiles-urls.com",163],["flycutlink.com",[163,335]],["linksly.co",163],["link1s.*",163],["pkr.pw",163],["imagenesderopaparaperros.com",163],["shortenbuddy.com",163],["apksvip.com",163],["4cash.me",163],["namaidani.com",163],["shortzzy.*",163],["teknomuda.com",163],["shorttey.*",[163,319]],["miuiku.com",163],["savelink.site",163],["lite-link.*",163],["adcorto.*",163],["samaa-pro.com",163],["miklpro.com",163],["modapk.link",163],["ccurl.net",163],["linkpoi.me",163],["menjelajahi.com",163],["pewgame.com",163],["haonguyen.top",163],["zshort.*",163],["crazyblog.in",163],["gtlink.co",163],["cutearn.net",163],["rshrt.com",163],["filezipa.com",163],["dz-linkk.com",163],["upfiles.*",163],["theblissempire.com",163],["finanzas-vida.com",163],["adurly.cc",163],["paid4.link",163],["link.asiaon.top",163],["go.gets4link.com",163],["linkfly.*",163],["beingtek.com",163],["shorturl.unityassets4free.com",163],["disheye.com",163],["techymedies.com",163],["techysuccess.com",163],["za.gl",[163,269]],["bblink.com",163],["myad.biz",163],["swzz.xyz",163],["vevioz.com",163],["charexempire.com",163],["clk.asia",163],["linka.click",163],["sturls.com",163],["myshrinker.com",163],["snowurl.com",[163,335]],["netfile.cc",163],["wplink.*",163],["rocklink.in",163],["techgeek.digital",163],["download3s.net",163],["shortx.net",163],["shortawy.com",163],["tlin.me",163],["apprepack.com",163],["up-load.one",163],["zuba.link",163],["bestcash2020.com",163],["hoxiin.com",163],["paylinnk.com",163],["thizissam.in",163],["ier.ai",163],["adslink.pw",163],["novelssites.com",163],["links.medipost.org",163],["faucetcrypto.net",163],["short.freeltc.top",163],["trxking.xyz",163],["weadown.com",163],["m.bloggingguidance.com",163],["blog.onroid.com",163],["link.codevn.net",163],["upfilesurls.com",163],["link4rev.site",163],["c2g.at",163],["bitcosite.com",[163,548]],["cryptosh.pro",163],["link68.net",163],["traffic123.net",163],["windowslite.net",[163,335]],["viewfr.com",163],["cl1ca.com",163],["4br.me",163],["fir3.net",163],["seulink.*",163],["encurtalink.*",163],["kiddyshort.com",163],["watchmygf.me",[164,188]],["camwhores.*",[164,174,216,217,218]],["camwhorez.tv",[164,174,216,217]],["cambay.tv",[164,196,216,246,248,249,250,251]],["fpo.xxx",[164,196]],["sexemix.com",164],["heavyfetish.com",[164,707]],["thotcity.su",164],["viralxxxporn.com",[164,387]],["tube8.*",[165,166]],["you-porn.com",166],["youporn.*",166],["youporngay.com",166],["youpornru.com",166],["redtube.*",166],["9908ww.com",166],["adelaidepawnbroker.com",166],["bztube.com",166],["hotovs.com",166],["insuredhome.org",166],["nudegista.com",166],["pornluck.com",166],["vidd.se",166],["pornhub.*",[166,308]],["pornhub.com",166],["pornerbros.com",167],["freep.com",167],["porn.com",168],["tune.pk",169],["noticias.gospelmais.com.br",170],["techperiod.com",170],["viki.com",[171,172]],["watch-series.*",173],["watchseries.*",173],["vev.*",173],["vidop.*",173],["vidup.*",173],["sleazyneasy.com",[174,175,176]],["smutr.com",[174,316]],["tktube.com",174],["yourporngod.com",[174,175]],["javbangers.com",[174,434]],["camfox.com",174],["camthots.tv",[174,246]],["shegotass.info",174],["amateur8.com",174],["bigtitslust.com",174],["ebony8.com",174],["freeporn8.com",174],["lesbian8.com",174],["maturetubehere.com",174],["sortporn.com",174],["motherporno.com",[174,175,196,248]],["theporngod.com",[174,175]],["watchdirty.to",[174,217,218,249]],["pornsocket.com",177],["luxuretv.com",178],["porndig.com",[179,180]],["webcheats.com.br",181],["ceesty.com",[182,183]],["gestyy.com",[182,183]],["corneey.com",183],["destyy.com",183],["festyy.com",183],["sh.st",183],["mitaku.net",183],["angrybirdsnest.com",184],["zrozz.com",184],["clix4btc.com",184],["4tests.com",184],["goltelevision.com",184],["news-und-nachrichten.de",184],["laradiobbs.net",184],["urlaubspartner.net",184],["produktion.de",184],["cinemaxxl.de",184],["bladesalvador.com",184],["tempr.email",184],["cshort.org",184],["friendproject.net",184],["covrhub.com",184],["katfile.com",[184,616]],["trust.zone",184],["business-standard.com",184],["planetsuzy.org",185],["empflix.com",186],["1movies.*",[187,193]],["xmovies8.*",187],["masteranime.tv",187],["0123movies.*",187],["gostream.*",187],["gomovies.*",187],["transparentcalifornia.com",188],["deepbrid.com",189],["webnovel.com",190],["streamwish.*",[191,192]],["oneupload.to",192],["wishfast.top",192],["rubystm.com",192],["rubyvid.com",192],["rubyvidhub.com",192],["stmruby.com",192],["streamruby.com",192],["schwaebische.de",194],["8tracks.com",195],["3movs.com",196],["bravoerotica.net",[196,248]],["youx.xxx",196],["camclips.tv",[196,316]],["xtits.*",[196,248]],["camflow.tv",[196,248,249,288,387]],["camhoes.tv",[196,246,248,249,288,387]],["xmegadrive.com",196],["xxxymovies.com",196],["xxxshake.com",196],["gayck.com",196],["xhand.com",[196,248]],["analdin.com",[196,248]],["revealname.com",197],["pouvideo.*",198],["povvideo.*",198],["povw1deo.*",198],["povwideo.*",198],["powv1deo.*",198],["powvibeo.*",198],["powvideo.*",198],["powvldeo.*",198],["golfchannel.com",199],["stream.nbcsports.com",199],["mathdf.com",199],["gamcore.com",200],["porcore.com",200],["porngames.tv",200],["69games.xxx",200],["javmix.app",200],["tecknity.com",201],["haaretz.co.il",202],["haaretz.com",202],["hungama.com",202],["a-o.ninja",202],["anime-odcinki.pl",202],["kumpulmanga.org",202],["shortgoo.blogspot.com",202],["tonanmedia.my.id",[202,569]],["yurasu.xyz",202],["isekaipalace.com",202],["plyjam.*",[203,204]],["ennovelas.com",[204,208]],["foxsports.com.au",205],["canberratimes.com.au",205],["thesimsresource.com",206],["fxporn69.*",207],["vipbox.*",208],["viprow.*",208],["ctrl.blog",209],["sportlife.es",210],["finofilipino.org",211],["desbloqueador.*",212],["xberuang.*",213],["teknorizen.*",213],["mysflink.blogspot.com",213],["ashemaletube.*",214],["paktech2.com",214],["assia.tv",215],["assia4.com",215],["assia24.com",215],["cwtvembeds.com",[217,247]],["camlovers.tv",217],["porntn.com",217],["pornissimo.org",217],["sexcams-24.com",[217,249]],["watchporn.to",[217,249]],["camwhorez.video",217],["footstockings.com",[217,218,249]],["xmateur.com",[217,218,249]],["multi.xxx",218],["worldofbitco.in",[219,220]],["weatherx.co.in",[219,220]],["sunbtc.space",219],["subtorrents.*",221],["subtorrents1.*",221],["newpelis.*",221],["pelix.*",221],["allcalidad.*",221],["infomaniakos.*",221],["ojogos.com.br",222],["powforums.com",223],["supforums.com",223],["studybullet.com",223],["usgamer.net",224],["recordonline.com",224],["freebitcoin.win",225],["e-monsite.com",225],["coindice.win",225],["temp-mails.com",226],["freiepresse.de",227],["investing.com",228],["tornadomovies.*",229],["mp3fiber.com",230],["chicoer.com",231],["dailybreeze.com",231],["dailybulletin.com",231],["dailynews.com",231],["delcotimes.com",231],["eastbaytimes.com",231],["macombdaily.com",231],["ocregister.com",231],["pasadenastarnews.com",231],["pe.com",231],["presstelegram.com",231],["redlandsdailyfacts.com",231],["reviewjournal.com",231],["santacruzsentinel.com",231],["saratogian.com",231],["sentinelandenterprise.com",231],["sgvtribune.com",231],["tampabay.com",231],["times-standard.com",231],["theoaklandpress.com",231],["trentonian.com",231],["twincities.com",231],["whittierdailynews.com",231],["bostonherald.com",231],["dailycamera.com",231],["sbsun.com",231],["dailydemocrat.com",231],["montereyherald.com",231],["orovillemr.com",231],["record-bee.com",231],["redbluffdailynews.com",231],["reporterherald.com",231],["thereporter.com",231],["timescall.com",231],["timesheraldonline.com",231],["ukiahdailyjournal.com",231],["dailylocal.com",231],["mercurynews.com",231],["suedkurier.de",232],["anysex.com",234],["icdrama.*",235],["mangasail.*",235],["pornve.com",236],["file4go.*",237],["coolrom.com.au",237],["marie-claire.es",238],["gamezhero.com",238],["flashgirlgames.com",238],["onlinesudoku.games",238],["mpg.football",238],["sssam.com",238],["globalnews.ca",239],["drinksmixer.com",240],["leitesculinaria.com",240],["fupa.net",241],["browardpalmbeach.com",242],["dallasobserver.com",242],["houstonpress.com",242],["miaminewtimes.com",242],["phoenixnewtimes.com",242],["westword.com",242],["nhentai.net",[243,244]],["nowtv.com.tr",245],["caminspector.net",246],["camwhoreshd.com",246],["camgoddess.tv",246],["gay4porn.com",248],["mypornhere.com",248],["mangovideo.*",249],["love4porn.com",249],["thotvids.com",249],["watchmdh.to",249],["celebwhore.com",249],["cluset.com",249],["sexlist.tv",249],["4kporn.xxx",249],["xhomealone.com",249],["lusttaboo.com",[249,509]],["hentai-moon.com",249],["camhub.cc",[249,674]],["mediapason.it",252],["linkspaid.com",252],["tuotromedico.com",252],["neoteo.com",252],["phoneswiki.com",252],["celebmix.com",252],["myneobuxportal.com",252],["oyungibi.com",252],["25yearslatersite.com",252],["jeshoots.com",253],["techhx.com",253],["karanapk.com",253],["flashplayer.fullstacks.net",255],["cloudapps.herokuapp.com",255],["youfiles.herokuapp.com",255],["texteditor.nsspot.net",255],["temp-mail.org",256],["asianclub.*",257],["javhdporn.net",257],["vidmoly.to",258],["comnuan.com",259],["veedi.com",260],["battleboats.io",260],["anitube.*",261],["fruitlab.com",261],["acetack.com",261],["androidquest.com",261],["apklox.com",261],["chhaprawap.in",261],["gujarativyakaran.com",261],["kashmirstudentsinformation.in",261],["kisantime.com",261],["shetkaritoday.in",261],["pastescript.com",261],["trimorspacks.com",261],["updrop.link",261],["haddoz.net",261],["streamingcommunity.*",261],["garoetpos.com",261],["stiletv.it",262],["mixdrop.*",263],["hqtv.biz",264],["liveuamap.com",265],["muvibg.com",265],["audycje.tokfm.pl",266],["shush.se",267],["allkpop.com",268],["empire-anime.*",[269,564,565,566,567,568]],["empire-streaming.*",[269,564,565,566]],["empire-anime.com",[269,564,565,566]],["empire-streamz.fr",[269,564,565,566]],["empire-stream.*",[269,564,565,566]],["pickcrackpasswords.blogspot.com",270],["kfrfansub.com",271],["thuglink.com",271],["voipreview.org",271],["illicoporno.com",272],["lavoixdux.com",272],["tonpornodujour.com",272],["jacquieetmichel.net",272],["swame.com",272],["vosfemmes.com",272],["voyeurfrance.net",272],["jacquieetmicheltv.net",[272,624,625]],["hanime.tv",273],["pogo.com",274],["cloudvideo.tv",275],["legionjuegos.org",276],["legionpeliculas.org",276],["legionprogramas.org",276],["16honeys.com",277],["elespanol.com",278],["remodelista.com",279],["audiofanzine.com",283],["uploadev.*",284],["developerinsider.co",285],["thehindu.com",286],["cambro.tv",[287,288]],["boobsradar.com",[288,387,687]],["nibelungen-kurier.de",289],["adfoc.us",290],["tea-coffee.net",290],["spatsify.com",290],["newedutopics.com",290],["getviralreach.in",290],["edukaroo.com",290],["funkeypagali.com",290],["careersides.com",290],["nayisahara.com",290],["wikifilmia.com",290],["infinityskull.com",290],["viewmyknowledge.com",290],["iisfvirtual.in",290],["starxinvestor.com",290],["jkssbalerts.com",290],["sahlmarketing.net",290],["filmypoints.in",290],["fitnessholic.net",290],["moderngyan.com",290],["sattakingcharts.in",290],["freshbhojpuri.com",290],["bankshiksha.in",290],["earn.mpscstudyhub.com",290],["earn.quotesopia.com",290],["money.quotesopia.com",290],["best-mobilegames.com",290],["learn.moderngyan.com",290],["bharatsarkarijobalert.com",290],["quotesopia.com",290],["creditsgoal.com",290],["bgmi32bitapk.in",290],["techacode.com",290],["trickms.com",290],["ielts-isa.edu.vn",290],["loan.punjabworks.com",290],["rokni.xyz",290],["keedabankingnews.com",290],["sptfy.be",290],["mcafee-com.com",[290,364]],["pianetamountainbike.it",291],["barchart.com",292],["modelisme.com",293],["parasportontario.ca",293],["prescottenews.com",293],["nrj-play.fr",294],["hackingwithreact.com",295],["gutekueche.at",296],["eplfootballmatch.com",297],["ancient-origins.*",297],["peekvids.com",298],["playvids.com",298],["pornflip.com",298],["redensarten-index.de",299],["vw-page.com",300],["viz.com",[301,302]],["0rechner.de",303],["configspc.com",304],["xopenload.me",304],["uptobox.com",304],["uptostream.com",304],["japgay.com",305],["mega-debrid.eu",306],["dreamdth.com",307],["diaridegirona.cat",309],["diariodeibiza.es",309],["diariodemallorca.es",309],["diarioinformacion.com",309],["eldia.es",309],["emporda.info",309],["farodevigo.es",309],["laopinioncoruna.es",309],["laopiniondemalaga.es",309],["laopiniondemurcia.es",309],["laopiniondezamora.es",309],["laprovincia.es",309],["levante-emv.com",309],["mallorcazeitung.es",309],["regio7.cat",309],["superdeporte.es",309],["playpaste.com",310],["cnbc.com",311],["primevideo.com",312],["read.amazon.*",[312,698]],["firefaucet.win",313],["74k.io",[314,315]],["fullhdxxx.com",317],["pornclassic.tube",318],["tubepornclassic.com",318],["etonline.com",319],["creatur.io",319],["lookcam.*",319],["drphil.com",319],["urbanmilwaukee.com",319],["lootlinks.*",319],["ontiva.com",319],["hideandseek.world",319],["myabandonware.com",319],["kendam.com",319],["wttw.com",319],["synonyms.com",319],["definitions.net",319],["hostmath.com",319],["camvideoshub.com",319],["minhaconexao.com.br",319],["home-made-videos.com",321],["amateur-couples.com",321],["slutdump.com",321],["dpstream.*",322],["produsat.com",323],["bluemediafiles.*",324],["12thman.com",325],["acusports.com",325],["atlantic10.com",325],["auburntigers.com",325],["baylorbears.com",325],["bceagles.com",325],["bgsufalcons.com",325],["big12sports.com",325],["bigten.org",325],["bradleybraves.com",325],["butlersports.com",325],["cmumavericks.com",325],["conferenceusa.com",325],["cyclones.com",325],["dartmouthsports.com",325],["daytonflyers.com",325],["dbupatriots.com",325],["dbusports.com",325],["denverpioneers.com",325],["fduknights.com",325],["fgcuathletics.com",325],["fightinghawks.com",325],["fightingillini.com",325],["floridagators.com",325],["friars.com",325],["friscofighters.com",325],["gamecocksonline.com",325],["goarmywestpoint.com",325],["gobison.com",325],["goblueraiders.com",325],["gobobcats.com",325],["gocards.com",325],["gocreighton.com",325],["godeacs.com",325],["goexplorers.com",325],["goetbutigers.com",325],["gofrogs.com",325],["gogriffs.com",325],["gogriz.com",325],["golobos.com",325],["gomarquette.com",325],["gopack.com",325],["gophersports.com",325],["goprincetontigers.com",325],["gopsusports.com",325],["goracers.com",325],["goshockers.com",325],["goterriers.com",325],["gotigersgo.com",325],["gousfbulls.com",325],["govandals.com",325],["gowyo.com",325],["goxavier.com",325],["gozags.com",325],["gozips.com",325],["griffinathletics.com",325],["guhoyas.com",325],["gwusports.com",325],["hailstate.com",325],["hamptonpirates.com",325],["hawaiiathletics.com",325],["hokiesports.com",325],["huskers.com",325],["icgaels.com",325],["iuhoosiers.com",325],["jsugamecocksports.com",325],["longbeachstate.com",325],["loyolaramblers.com",325],["lrtrojans.com",325],["lsusports.net",325],["morrisvillemustangs.com",325],["msuspartans.com",325],["muleriderathletics.com",325],["mutigers.com",325],["navysports.com",325],["nevadawolfpack.com",325],["niuhuskies.com",325],["nkunorse.com",325],["nuhuskies.com",325],["nusports.com",325],["okstate.com",325],["olemisssports.com",325],["omavs.com",325],["ovcsports.com",325],["owlsports.com",325],["purduesports.com",325],["redstormsports.com",325],["richmondspiders.com",325],["sfajacks.com",325],["shupirates.com",325],["siusalukis.com",325],["smcgaels.com",325],["smumustangs.com",325],["soconsports.com",325],["soonersports.com",325],["themw.com",325],["tulsahurricane.com",325],["txst.com",325],["txstatebobcats.com",325],["ubbulls.com",325],["ucfknights.com",325],["ucirvinesports.com",325],["uconnhuskies.com",325],["uhcougars.com",325],["uicflames.com",325],["umterps.com",325],["uncwsports.com",325],["unipanthers.com",325],["unlvrebels.com",325],["uoflsports.com",325],["usdtoreros.com",325],["utahstateaggies.com",325],["utepathletics.com",325],["utrockets.com",325],["uvmathletics.com",325],["uwbadgers.com",325],["villanova.com",325],["wkusports.com",325],["wmubroncos.com",325],["woffordterriers.com",325],["1pack1goal.com",325],["bcuathletics.com",325],["bubraves.com",325],["goblackbears.com",325],["golightsgo.com",325],["gomcpanthers.com",325],["goutsa.com",325],["mercerbears.com",325],["pirateblue.com",325],["pirateblue.net",325],["pirateblue.org",325],["quinnipiacbobcats.com",325],["towsontigers.com",325],["tribeathletics.com",325],["tribeclub.com",325],["utepminermaniacs.com",325],["utepminers.com",325],["wkutickets.com",325],["aopathletics.org",325],["atlantichockeyonline.com",325],["bigsouthnetwork.com",325],["bigsouthsports.com",325],["chawomenshockey.com",325],["dbupatriots.org",325],["drakerelays.org",325],["ecac.org",325],["ecacsports.com",325],["emueagles.com",325],["emugameday.com",325],["gculopes.com",325],["godrakebulldog.com",325],["godrakebulldogs.com",325],["godrakebulldogs.net",325],["goeags.com",325],["goislander.com",325],["goislanders.com",325],["gojacks.com",325],["gomacsports.com",325],["gseagles.com",325],["hubison.com",325],["iowaconference.com",325],["ksuowls.com",325],["lonestarconference.org",325],["mascac.org",325],["midwestconference.org",325],["mountaineast.org",325],["niu-pack.com",325],["nulakers.ca",325],["oswegolakers.com",325],["ovcdigitalnetwork.com",325],["pacersports.com",325],["rmacsports.org",325],["rollrivers.com",325],["samfordsports.com",325],["uncpbraves.com",325],["usfdons.com",325],["wiacsports.com",325],["alaskananooks.com",325],["broncathleticfund.com",325],["cameronaggies.com",325],["columbiacougars.com",325],["etownbluejays.com",325],["gobadgers.ca",325],["golancers.ca",325],["gometrostate.com",325],["gothunderbirds.ca",325],["kentstatesports.com",325],["lehighsports.com",325],["lopers.com",325],["lycoathletics.com",325],["lycomingathletics.com",325],["maraudersports.com",325],["mauiinvitational.com",325],["msumavericks.com",325],["nauathletics.com",325],["nueagles.com",325],["nwusports.com",325],["oceanbreezenyc.org",325],["patriotathleticfund.com",325],["pittband.com",325],["principiaathletics.com",325],["roadrunnersathletics.com",325],["sidearmsocial.com",325],["snhupenmen.com",325],["stablerarena.com",325],["stoutbluedevils.com",325],["uwlathletics.com",325],["yumacs.com",325],["collegefootballplayoff.com",325],["csurams.com",325],["cubuffs.com",325],["gobearcats.com",325],["gohuskies.com",325],["mgoblue.com",325],["osubeavers.com",325],["pittsburghpanthers.com",325],["rolltide.com",325],["texassports.com",325],["thesundevils.com",325],["uclabruins.com",325],["wvuathletics.com",325],["wvusports.com",325],["arizonawildcats.com",325],["calbears.com",325],["cuse.com",325],["georgiadogs.com",325],["goducks.com",325],["goheels.com",325],["gostanford.com",325],["insidekstatesports.com",325],["insidekstatesports.info",325],["insidekstatesports.net",325],["insidekstatesports.org",325],["k-stateathletics.com",325],["k-statefootball.net",325],["k-statefootball.org",325],["k-statesports.com",325],["k-statesports.net",325],["k-statesports.org",325],["k-statewomenshoops.com",325],["k-statewomenshoops.net",325],["k-statewomenshoops.org",325],["kstateathletics.com",325],["kstatefootball.net",325],["kstatefootball.org",325],["kstatesports.com",325],["kstatewomenshoops.com",325],["kstatewomenshoops.net",325],["kstatewomenshoops.org",325],["ksuathletics.com",325],["ksusports.com",325],["scarletknights.com",325],["showdownforrelief.com",325],["syracusecrunch.com",325],["texastech.com",325],["theacc.com",325],["ukathletics.com",325],["usctrojans.com",325],["utahutes.com",325],["utsports.com",325],["wsucougars.com",325],["vidlii.com",[325,350]],["tricksplit.io",325],["fangraphs.com",326],["stern.de",327],["geo.de",327],["brigitte.de",327],["tvspielfilm.de",[328,329,330,331]],["tvtoday.de",[328,329,330,331]],["chip.de",[328,329,330,331]],["focus.de",[328,329,330,331]],["fitforfun.de",[328,329,330,331]],["n-tv.de",332],["player.rtl2.de",333],["planetaminecraft.com",334],["cravesandflames.com",335],["codesnse.com",335],["flyad.vip",335],["lapresse.ca",336],["kolyoom.com",337],["ilovephd.com",337],["negumo.com",338],["games.wkb.jp",[339,340]],["kenshi.fandom.com",342],["hausbau-forum.de",343],["homeairquality.org",343],["faucettronn.click",343],["fake-it.ws",344],["laksa19.github.io",345],["1shortlink.com",346],["u-s-news.com",347],["luscious.net",348],["makemoneywithurl.com",349],["junkyponk.com",349],["healthfirstweb.com",349],["vocalley.com",349],["yogablogfit.com",349],["howifx.com",[349,533]],["en.financerites.com",349],["mythvista.com",349],["livenewsflix.com",349],["cureclues.com",349],["apekite.com",349],["enit.in",349],["iammagnus.com",350],["dailyvideoreports.net",350],["unityassets4free.com",350],["docer.*",351],["resetoff.pl",351],["sexodi.com",351],["cdn77.org",352],["3sexporn.com",353],["momxxxsex.com",353],["myfreevintageporn.com",353],["penisbuyutucum.net",353],["ujszo.com",354],["newsmax.com",355],["nadidetarifler.com",356],["siz.tv",356],["suzylu.co.uk",[357,358]],["onworks.net",359],["yabiladi.com",359],["downloadsoft.net",360],["newsobserver.com",361],["arkadiumhosted.com",361],["testlanguages.com",362],["newsinlevels.com",362],["videosinlevels.com",362],["bookmystrip.com",363],["sabkiyojana.com",363],["starkroboticsfrc.com",364],["sinonimos.de",364],["antonimos.de",364],["quesignifi.ca",364],["tiktokrealtime.com",364],["tiktokcounter.net",364],["tpayr.xyz",364],["poqzn.xyz",364],["ashrfd.xyz",364],["rezsx.xyz",364],["tryzt.xyz",364],["ashrff.xyz",364],["rezst.xyz",364],["dawenet.com",364],["erzar.xyz",364],["waezm.xyz",364],["waezg.xyz",364],["blackwoodacademy.org",364],["cryptednews.space",364],["vivuq.com",364],["swgop.com",364],["vbnmll.com",364],["telcoinfo.online",364],["dshytb.com",364],["btcbitco.in",[364,368]],["btcsatoshi.net",364],["cempakajaya.com",364],["crypto4yu.com",364],["readbitcoin.org",364],["wiour.com",364],["finish.addurl.biz",364],["aiimgvlog.fun",[364,371]],["laweducationinfo.com",364],["savemoneyinfo.com",364],["worldaffairinfo.com",364],["godstoryinfo.com",364],["successstoryinfo.com",364],["cxissuegk.com",364],["learnmarketinfo.com",364],["bhugolinfo.com",364],["armypowerinfo.com",364],["rsadnetworkinfo.com",364],["rsinsuranceinfo.com",364],["rsfinanceinfo.com",364],["rsgamer.app",364],["rssoftwareinfo.com",364],["rshostinginfo.com",364],["rseducationinfo.com",364],["phonereviewinfo.com",364],["makeincomeinfo.com",364],["gknutshell.com",364],["vichitrainfo.com",364],["workproductivityinfo.com",364],["dopomininfo.com",364],["hostingdetailer.com",364],["fitnesssguide.com",364],["tradingfact4u.com",364],["cryptofactss.com",364],["softwaredetail.com",364],["artoffocas.com",364],["insurancesfact.com",364],["travellingdetail.com",364],["advertisingexcel.com",364],["allcryptoz.net",364],["batmanfactor.com",364],["beautifulfashionnailart.com",364],["crewbase.net",364],["documentaryplanet.xyz",364],["crewus.net",364],["gametechreviewer.com",364],["midebalonu.net",364],["misterio.ro",364],["phineypet.com",364],["seory.xyz",364],["shinbhu.net",364],["shinchu.net",364],["substitutefor.com",364],["talkforfitness.com",364],["thefitbrit.co.uk",364],["thumb8.net",364],["thumb9.net",364],["topcryptoz.net",364],["uniqueten.net",364],["ultraten.net",364],["exactpay.online",364],["quins.us",364],["kiddyearner.com",364],["imagereviser.com",365],["tech.pubghighdamage.com",366],["tech.techkhulasha.com",366],["hipsonyc.com",366],["jiocinema.com",366],["rapid-cloud.co",366],["uploadmall.com",366],["rkd3.dev",366],["4funbox.com",367],["nephobox.com",367],["1024tera.com",367],["terabox.*",367],["blog.cryptowidgets.net",368],["blog.insurancegold.in",368],["blog.wiki-topia.com",368],["blog.coinsvalue.net",368],["blog.cookinguide.net",368],["blog.freeoseocheck.com",368],["blog24.me",368],["bildirim.*",370],["arahdrive.com",371],["appsbull.com",372],["diudemy.com",372],["maqal360.com",[372,373,374]],["lifesurance.info",375],["akcartoons.in",376],["cybercityhelp.in",376],["infokeeda.xyz",377],["webzeni.com",377],["phongroblox.com",378],["fuckingfast.net",379],["tickhosting.com",380],["in91vip.win",381],["datavaults.co",382],["t-online.de",384],["upornia.*",[385,386]],["bobs-tube.com",387],["pornohirsch.net",388],["pixsera.net",389],["pc-builds.com",390],["qtoptens.com",390],["reuters.com",390],["today.com",390],["videogamer.com",390],["wrestlinginc.com",390],["usatoday.com",391],["ydr.com",391],["247sports.com",392],["indiatimes.com",393],["netzwelt.de",394],["arcade.buzzrtv.com",395],["arcade.dailygazette.com",395],["arcade.lemonde.fr",395],["arena.gamesforthebrain.com",395],["bestpuzzlesandgames.com",395],["cointiply.arkadiumarena.com",395],["gamelab.com",395],["games.abqjournal.com",395],["games.amny.com",395],["games.bellinghamherald.com",395],["games.besthealthmag.ca",395],["games.bnd.com",395],["games.boston.com",395],["games.bostonglobe.com",395],["games.bradenton.com",395],["games.centredaily.com",395],["games.charlotteobserver.com",395],["games.cnhinews.com",395],["games.crosswordgiant.com",395],["games.dailymail.co.uk",395],["games.dallasnews.com",395],["games.daytondailynews.com",395],["games.denverpost.com",395],["games.everythingzoomer.com",395],["games.fresnobee.com",395],["games.gameshownetwork.com",395],["games.get.tv",395],["games.greatergood.com",395],["games.heraldonline.com",395],["games.heraldsun.com",395],["games.idahostatesman.com",395],["games.insp.com",395],["games.islandpacket.com",395],["games.journal-news.com",395],["games.kansas.com",395],["games.kansascity.com",395],["games.kentucky.com",395],["games.lancasteronline.com",395],["games.ledger-enquirer.com",395],["games.macon.com",395],["games.mashable.com",395],["games.mercedsunstar.com",395],["games.metro.us",395],["games.metv.com",395],["games.miamiherald.com",395],["games.modbee.com",395],["games.moviestvnetwork.com",395],["games.myrtlebeachonline.com",395],["games.nationalreview.com",395],["games.newsobserver.com",395],["games.parade.com",395],["games.pressdemocrat.com",395],["games.puzzlebaron.com",395],["games.puzzler.com",395],["games.puzzles.ca",395],["games.qns.com",395],["games.readersdigest.ca",395],["games.sacbee.com",395],["games.sanluisobispo.com",395],["games.sixtyandme.com",395],["games.sltrib.com",395],["games.springfieldnewssun.com",395],["games.star-telegram.com",395],["games.startribune.com",395],["games.sunherald.com",395],["games.theadvocate.com",395],["games.thenewstribune.com",395],["games.theolympian.com",395],["games.theportugalnews.com",395],["games.thestar.com",395],["games.thestate.com",395],["games.tri-cityherald.com",395],["games.triviatoday.com",395],["games.usnews.com",395],["games.word.tips",395],["games.wordgenius.com",395],["games.wtop.com",395],["jeux.meteocity.com",395],["juegos.as.com",395],["juegos.elnuevoherald.com",395],["juegos.elpais.com",395],["philly.arkadiumarena.com",395],["play.dictionary.com",395],["puzzles.bestforpuzzles.com",395],["puzzles.centralmaine.com",395],["puzzles.crosswordsolver.org",395],["puzzles.independent.co.uk",395],["puzzles.nola.com",395],["puzzles.pressherald.com",395],["puzzles.standard.co.uk",395],["puzzles.sunjournal.com",395],["arkadium.com",396],["abysscdn.com",[397,398]],["arcai.com",399],["my-code4you.blogspot.com",400],["flickr.com",401],["firefile.cc",402],["pestleanalysis.com",402],["kochamjp.pl",402],["tutorialforlinux.com",402],["whatsaero.com",402],["animeblkom.net",[402,416]],["blkom.com",402],["globes.co.il",[403,404]],["jardiner-malin.fr",405],["tw-calc.net",406],["ohmybrush.com",407],["talkceltic.net",408],["mentalfloss.com",409],["uprafa.com",410],["cube365.net",411],["wwwfotografgotlin.blogspot.com",412],["freelistenonline.com",412],["badassdownloader.com",413],["quickporn.net",414],["yellowbridge.com",415],["aosmark.com",417],["ctrlv.*",418],["atozmath.com",[419,420,421,422,423,424,425]],["newyorker.com",426],["brighteon.com",427],["more.tv",428],["video1tube.com",429],["alohatube.xyz",429],["4players.de",430],["onlinesoccermanager.com",430],["fshost.me",431],["link.cgtips.org",432],["hentaicloud.com",433],["netfapx.com",435],["javdragon.org",435],["javneon.tv",435],["paperzonevn.com",436],["9jarock.org",437],["fzmovies.info",437],["fztvseries.ng",437],["netnaijas.com",437],["hentaienglish.com",438],["hentaiporno.xxx",438],["venge.io",[439,440]],["btcbux.io",441],["its.porn",[442,443]],["atv.at",444],["2ndrun.tv",445],["rackusreads.com",445],["teachmemicro.com",445],["willcycle.com",445],["kusonime.com",[446,447]],["123movieshd.*",448],["imgur.com",[449,450,708]],["hentai-party.com",451],["hentaicomics.pro",451],["xxx-comics.pro",451],["uproxy.*",452],["animesa.*",453],["subtitle.one",454],["subtitleone.cc",454],["genshinimpactcalculator.com",455],["mysexgames.com",456],["cinecalidad.*",[457,458]],["xnxx.com",459],["xvideos.*",459],["gdr-online.com",460],["mmm.dk",461],["iqiyi.com",[462,463,597]],["m.iqiyi.com",464],["nbcolympics.com",465],["apkhex.com",466],["indiansexstories2.net",467],["issstories.xyz",467],["1340kbbr.com",468],["gorgeradio.com",468],["kduk.com",468],["kedoam.com",468],["kejoam.com",468],["kelaam.com",468],["khsn1230.com",468],["kjmx.rocks",468],["kloo.com",468],["klooam.com",468],["klykradio.com",468],["kmed.com",468],["kmnt.com",468],["kool991.com",468],["kpnw.com",468],["kppk983.com",468],["krktcountry.com",468],["ktee.com",468],["kwro.com",468],["kxbxfm.com",468],["thevalley.fm",468],["quizlet.com",469],["dsocker1234.blogspot.com",470],["schoolcheats.net",[471,472]],["mgnet.xyz",473],["japopav.tv",474],["lvturbo.com",474],["designtagebuch.de",475],["pixroute.com",476],["uploady.io",477],["calculator-online.net",478],["luckydice.net",479],["adarima.org",479],["weatherwx.com",479],["sattaguess.com",479],["winshell.de",479],["rosasidan.ws",479],["modmakers.xyz",479],["gamepure.in",479],["warrenrahul.in",479],["austiblox.net",479],["upiapi.in",479],["daemonanime.net",479],["networkhint.com",479],["thichcode.net",479],["texturecan.com",479],["tikmate.app",[479,605]],["arcaxbydz.id",479],["quotesshine.com",479],["porngames.club",480],["sexgames.xxx",480],["111.90.159.132",481],["mobile-tracker-free.com",482],["pfps.gg",483],["social-unlock.com",484],["superpsx.com",485],["ninja.io",486],["sourceforge.net",487],["samfirms.com",488],["rapelust.com",489],["vtube.to",489],["vtplay.net",489],["desitelugusex.com",489],["dvdplay.*",489],["xvideos-downloader.net",489],["xxxvideotube.net",489],["sdefx.cloud",489],["nozomi.la",489],["moviesonlinefree.net",489],["banned.video",490],["madmaxworld.tv",490],["androidpolice.com",490],["babygaga.com",490],["backyardboss.net",490],["carbuzz.com",490],["cbr.com",490],["collider.com",490],["dualshockers.com",490],["footballfancast.com",490],["footballleagueworld.co.uk",490],["gamerant.com",490],["givemesport.com",490],["hardcoregamer.com",490],["hotcars.com",490],["howtogeek.com",490],["makeuseof.com",490],["moms.com",490],["movieweb.com",490],["pocket-lint.com",490],["pocketnow.com",490],["screenrant.com",490],["simpleflying.com",490],["thegamer.com",490],["therichest.com",490],["thesportster.com",490],["thethings.com",490],["thetravel.com",490],["topspeed.com",490],["xda-developers.com",490],["huffpost.com",491],["ingles.com",492],["spanishdict.com",492],["surfline.com",[493,494]],["play.tv3.ee",495],["play.tv3.lt",495],["play.tv3.lv",[495,496]],["tv3play.skaties.lv",495],["trendyoum.com",497],["bulbagarden.net",498],["hollywoodlife.com",499],["mat6tube.com",500],["hotabis.com",501],["root-nation.com",501],["italpress.com",501],["airsoftmilsimnews.com",501],["artribune.com",501],["textstudio.co",502],["newtumbl.com",503],["apkmaven.*",504],["aruble.net",505],["nevcoins.club",506],["mail.com",507],["gmx.*",508],["mangakita.id",510],["avpgalaxy.net",511],["mhma12.tech",512],["panda-novel.com",513],["zebranovel.com",513],["lightsnovel.com",513],["eaglesnovel.com",513],["pandasnovel.com",513],["ewrc-results.com",514],["kizi.com",515],["cyberscoop.com",516],["fedscoop.com",516],["canale.live",517],["jeep-cj.com",518],["sponsorhunter.com",519],["cloudcomputingtopics.net",520],["likecs.com",521],["tiscali.it",522],["linkspy.cc",523],["adshnk.com",524],["chattanoogan.com",525],["adsy.pw",526],["playstore.pw",526],["socialmediagirls.com",527],["windowspro.de",528],["snapinst.app",529],["tvtv.ca",530],["tvtv.us",530],["mydaddy.cc",531],["roadtrippin.fr",532],["vavada5com.com",533],["anyporn.com",[534,551]],["bravoporn.com",534],["bravoteens.com",534],["crocotube.com",534],["hellmoms.com",534],["hellporno.com",534],["sex3.com",534],["tubewolf.com",534],["xbabe.com",534],["xcum.com",534],["zedporn.com",534],["imagetotext.info",535],["infokik.com",536],["freepik.com",537],["ddwloclawek.pl",[538,539]],["www.seznam.cz",540],["deezer.com",541],["my-subs.co",542],["plaion.com",543],["slideshare.net",[544,545]],["ustreasuryyieldcurve.com",546],["businesssoftwarehere.com",547],["goo.st",547],["freevpshere.com",547],["softwaresolutionshere.com",547],["gamereactor.*",549],["madoohd.com",550],["doomovie-hd.*",550],["staige.tv",552],["androidadult.com",553],["streamvid.net",554],["watchtv24.com",555],["cellmapper.net",556],["medscape.com",557],["newscon.org",[558,559]],["wheelofgold.com",560],["drakecomic.*",560],["bembed.net",561],["embedv.net",561],["fslinks.org",561],["listeamed.net",561],["v6embed.xyz",561],["vembed.*",561],["vgplayer.xyz",561],["vid-guard.com",561],["vinomo.xyz",561],["app.blubank.com",562],["mobileweb.bankmellat.ir",562],["chat.nrj.fr",563],["chat.tchatche.com",[563,578]],["ccthesims.com",570],["chromeready.com",570],["coursedrive.org",570],["dtbps3games.com",570],["illustratemagazine.com",570],["uknip.co.uk",570],["vod.pl",571],["megadrive-emulator.com",572],["tvhay.*",[573,574]],["animesaga.in",575],["moviesapi.club",575],["bestx.stream",575],["watchx.top",575],["digimanie.cz",576],["svethardware.cz",576],["srvy.ninja",577],["cnn.com",[579,580,581]],["edmdls.com",582],["freshremix.net",582],["scenedl.org",582],["trakt.tv",583],["client.falixnodes.net",[584,585,586]],["shroomers.app",587],["classicalradio.com",588],["di.fm",588],["jazzradio.com",588],["radiotunes.com",588],["rockradio.com",588],["zenradio.com",588],["getthit.com",589],["techedubyte.com",590],["soccerinhd.com",590],["movie-th.tv",591],["iwanttfc.com",592],["nutraingredients-asia.com",593],["nutraingredients-latam.com",593],["nutraingredients-usa.com",593],["nutraingredients.com",593],["ozulscansen.com",594],["nexusmods.com",595],["lookmovie.*",596],["lookmovie2.to",596],["biletomat.pl",598],["hextank.io",[599,600]],["filmizlehdfilm.com",[601,602,603,604]],["filmizletv.*",[601,602,603,604]],["fullfilmizle.cc",[601,602,603,604]],["gofilmizle.net",[601,602,603,604]],["btvplus.bg",606],["sagewater.com",607],["redlion.net",607],["filmweb.pl",[608,609]],["satdl.com",610],["vidstreaming.xyz",611],["everand.com",612],["myradioonline.pl",613],["cbs.com",614],["paramountplus.com",614],["fullxh.com",615],["galleryxh.site",615],["megaxh.com",615],["movingxh.world",615],["seexh.com",615],["unlockxh4.com",615],["valuexh.life",615],["xhaccess.com",615],["xhadult2.com",615],["xhadult3.com",615],["xhadult4.com",615],["xhadult5.com",615],["xhamster.*",615],["xhamster1.*",615],["xhamster10.*",615],["xhamster11.*",615],["xhamster12.*",615],["xhamster13.*",615],["xhamster14.*",615],["xhamster15.*",615],["xhamster16.*",615],["xhamster17.*",615],["xhamster18.*",615],["xhamster19.*",615],["xhamster20.*",615],["xhamster2.*",615],["xhamster3.*",615],["xhamster4.*",615],["xhamster42.*",615],["xhamster46.com",615],["xhamster5.*",615],["xhamster7.*",615],["xhamster8.*",615],["xhamsterporno.mx",615],["xhbig.com",615],["xhbranch5.com",615],["xhchannel.com",615],["xhdate.world",615],["xhday.com",615],["xhday1.com",615],["xhlease.world",615],["xhmoon5.com",615],["xhofficial.com",615],["xhopen.com",615],["xhplanet1.com",615],["xhplanet2.com",615],["xhreal2.com",615],["xhreal3.com",615],["xhspot.com",615],["xhtotal.com",615],["xhtree.com",615],["xhvictory.com",615],["xhwebsite.com",615],["xhwebsite2.com",615],["xhwebsite5.com",615],["xhwide1.com",615],["xhwide2.com",615],["xhwide5.com",615],["file-upload.net",617],["lightnovelworld.*",618],["acortalo.*",[619,620,621,622]],["acortar.*",[619,620,621,622]],["megadescarga.net",[619,620,621,622]],["megadescargas.net",[619,620,621,622]],["hentaihaven.xxx",623],["jacquieetmicheltv2.net",625],["a2zapk.*",626],["fcportables.com",[627,628]],["emurom.net",629],["freethesaurus.com",[630,631]],["thefreedictionary.com",[630,631]],["oeffentlicher-dienst.info",632],["im9.eu",633],["dcdlplayer8a06f4.xyz",634],["ultimate-guitar.com",635],["claimbits.net",636],["sexyscope.net",637],["kickassanime.*",638],["recherche-ebook.fr",639],["virtualdinerbot.com",639],["zonebourse.com",640],["pink-sluts.net",641],["andhrafriends.com",642],["benzinpreis.de",643],["turtleviplay.xyz",644],["defenseone.com",645],["govexec.com",645],["nextgov.com",645],["route-fifty.com",645],["sharing.wtf",646],["wetter3.de",647],["esportivos.fun",648],["cosmonova-broadcast.tv",649],["hartvannederland.nl",650],["shownieuws.nl",650],["vandaaginside.nl",650],["rock.porn",[651,652]],["videzz.net",[653,654]],["ezaudiobookforsoul.com",655],["club386.com",656],["littlebigsnake.com",657],["easyfun.gg",658],["smailpro.com",659],["ilgazzettino.it",660],["ilmessaggero.it",660],["3bmeteo.com",[661,662]],["mconverter.eu",663],["lover937.net",664],["10gb.vn",665],["pes6.es",666],["tactics.tools",[667,668]],["boundhub.com",669],["alocdnnetu.xyz",670],["reliabletv.me",671],["jakondo.ru",672],["filecrypt.*",673],["nolive.me",675],["wired.com",676],["spankbang.*",[677,678,679,710,711]],["hulu.com",[680,681,682]],["anonymfile.com",683],["gofile.to",683],["dotycat.com",684],["rateyourmusic.com",685],["reporterpb.com.br",686],["blog-dnz.com",688],["18adultgames.com",689],["colnect.com",[690,691]],["adultgamesworld.com",692],["bgmiupdate.com.in",693],["reviewdiv.com",694],["parametric-architecture.com",695],["laurelberninteriors.com",[696,713]],["voiceofdenton.com",697],["concealednation.org",697],["askattest.com",699],["opensubtitles.com",700],["savefiles.com",701],["streamup.ws",702],["www.google.*",703],["tacobell.com",704],["zefoy.com",705],["cnet.com",706],["natgeotv.com",709],["globo.com",712],["wayfair.com",714]]);
const exceptionsMap = new Map([["cloudflare.com",[0]],["pingit.com",[163]],["loan.bgmi32bitapk.in",[290]],["lookmovie.studio",[596]]]);
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
