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
const argsList = [["console.clear","undefined"],["adBlockDetected","undefined"],["PrePl","true"],["amzn_aps_csm.init","noopFunc"],["amzn_aps_csm.log","noopFunc"],["akamaiDisableServerIpLookup","noopFunc"],["DD_RUM.addAction","noopFunc"],["nads.createAd","trueFunc"],["ga","noopFunc"],["huecosPBS.nstdX","null"],["DTM.trackAsyncPV","noopFunc"],["_satellite","{}"],["_satellite.getVisitorId","noopFunc"],["newPageViewSpeedtest","noopFunc"],["pubg.unload","noopFunc"],["generateGalleryAd","noopFunc"],["mediator","noopFunc"],["Object.prototype.subscribe","noopFunc"],["gbTracker","{}"],["gbTracker.sendAutoSearchEvent","noopFunc"],["Object.prototype.vjsPlayer.ads","noopFunc"],["network_user_id",""],["google.ima.OmidVerificationVendor","{}"],["Object.prototype.omidAccessModeRules","{}"],["googletag.cmd","{}"],["Object.prototype.setDisableFlashAds","noopFunc"],["DD_RUM.addTiming","noopFunc"],["chameleonVideo.adDisabledRequested","true"],["AdmostClient","{}"],["analytics","{}"],["datalayer","[]"],["Object.prototype.isInitialLoadDisabled","noopFunc"],["listingGoogleEETracking","noopFunc"],["dcsMultiTrack","noopFunc"],["urlStrArray","noopFunc"],["pa","{}"],["Object.prototype.setConfigurations","noopFunc"],["Object.prototype.bk_addPageCtx","noopFunc"],["Object.prototype.bk_doJSTag","noopFunc"],["passFingerPrint","noopFunc"],["optimizely","{}"],["optimizely.initialized","true"],["google_optimize","{}"],["google_optimize.get","noopFunc"],["_gsq","{}"],["_gsq.push","noopFunc"],["stmCustomEvent","noopFunc"],["_gsDevice",""],["iom","{}"],["iom.c","noopFunc"],["_conv_q","{}"],["_conv_q.push","noopFunc"],["google.ima.settings.setDisableFlashAds","noopFunc"],["pa.privacy","{}"],["Object.prototype.getTargetingMap","noopFunc"],["populateClientData4RBA","noopFunc"],["YT.ImaManager","noopFunc"],["UOLPD","{}"],["UOLPD.dataLayer","{}"],["__configuredDFPTags","{}"],["URL_VAST_YOUTUBE","{}"],["Adman","{}"],["dplus","{}"],["dplus.track","noopFunc"],["_satellite.track","noopFunc"],["google.ima.dai","{}"],["gfkS2sExtension","{}"],["gfkS2sExtension.HTML5VODExtension","noopFunc"],["AnalyticsEventTrackingJS","{}"],["AnalyticsEventTrackingJS.addToBasket","noopFunc"],["AnalyticsEventTrackingJS.trackErrorMessage","noopFunc"],["initializeslideshow","noopFunc"],["fathom","{}"],["fathom.trackGoal","noopFunc"],["Origami","{}"],["Origami.fastclick","noopFunc"],["jad","undefined"],["hasAdblocker","true"],["Sentry","{}"],["Sentry.init","noopFunc"],["TRC","{}"],["TRC._taboolaClone","[]"],["fp","{}"],["fp.t","noopFunc"],["fp.s","noopFunc"],["initializeNewRelic","noopFunc"],["turnerAnalyticsObj","{}"],["turnerAnalyticsObj.setVideoObject4AnalyticsProperty","noopFunc"],["optimizelyDatafile","{}"],["optimizelyDatafile.featureFlags","[]"],["fingerprint","{}"],["fingerprint.getCookie","noopFunc"],["gform.utils","noopFunc"],["gform.utils.trigger","noopFunc"],["get_fingerprint","noopFunc"],["moatPrebidApi","{}"],["moatPrebidApi.getMoatTargetingForPage","noopFunc"],["cpd_configdata","{}"],["cpd_configdata.url",""],["yieldlove_cmd","{}"],["yieldlove_cmd.push","noopFunc"],["dataLayer.push","noopFunc"],["_etmc","{}"],["_etmc.push","noopFunc"],["freshpaint","{}"],["freshpaint.track","noopFunc"],["ShowRewards","noopFunc"],["stLight","{}"],["stLight.options","noopFunc"],["DD_RUM.addError","noopFunc"],["sensorsDataAnalytic201505","{}"],["sensorsDataAnalytic201505.init","noopFunc"],["sensorsDataAnalytic201505.quick","noopFunc"],["sensorsDataAnalytic201505.track","noopFunc"],["s","{}"],["s.tl","noopFunc"],["smartech","noopFunc"],["sensors","{}"],["sensors.init","noopFunc"],["sensors.track","noopFunc"],["adn","{}"],["adn.clearDivs","noopFunc"],["_vwo_code","{}"],["gtag","noopFunc"],["_taboola","{}"],["_taboola.push","noopFunc"],["clicky","{}"],["clicky.goal","noopFunc"],["WURFL","{}"],["_sp_.config.events.onSPPMObjectReady","noopFunc"],["gtm","{}"],["gtm.trackEvent","noopFunc"],["mParticle.Identity.getCurrentUser","noopFunc"],["JSGlobals.prebidEnabled","false"],["elasticApm","{}"],["elasticApm.init","noopFunc"],["Object.prototype.que","noopFunc"],["Object.prototype.que.push","noopFunc"],["ga.sendGaEvent","noopFunc"],["adobe","{}"],["MT","{}"],["MT.track","noopFunc"],["ClickOmniPartner","noopFunc"],["adex","{}"],["adex.getAdexUser","noopFunc"],["Adkit","noopFunc"],["Object.prototype.shouldExpectGoogleCMP","false"],["apntag.refresh","noopFunc"],["pa.sendEvent","noopFunc"],["Munchkin","{}"],["Munchkin.init","noopFunc"],["ytInitialPlayerResponse.playerAds","undefined"],["ytInitialPlayerResponse.adPlacements","undefined"],["ytInitialPlayerResponse.adSlots","undefined"],["playerResponse.adPlacements","undefined"],["nsShowMaxCount","0"],["objVc.interstitial_web",""],["_ml_ads_ns","null"],["_sp_.config","undefined"],["isAdBlockActive","false"],["AdController","noopFunc"],["console.clear","noopFunc"],["console.log","noopFunc"],["Object.prototype.hideAds","true"],["Object.prototype._getSalesHouseConfigurations","noopFunc"],["vast_urls","{}"],["sadbl","false"],["adblockcheck","false"],["arrvast","[]"],["blurred","false"],["flashvars.adv_pre_src",""],["showPopunder","false"],["page_params.holiday_promo","true"],["adsEnabled","true"],["String.prototype.charAt","trueFunc"],["ad_blocker","false"],["blockAdBlock","true"],["VikiPlayer.prototype.pingAbFactor","noopFunc"],["player.options.disableAds","true"],["console.clear","trueFunc"],["flashvars.adv_pre_vast",""],["flashvars.adv_pre_vast_alt",""],["x_width","1"],["_site_ads_ns","true"],["luxuretv.config",""],["Object.prototype.AdOverlay","noopFunc"],["tkn_popunder","null"],["can_run_ads","true"],["adsBlockerDetector","noopFunc"],["globalThis","null"],["adblock","false"],["__ads","true"],["FlixPop.isPopGloballyEnabled","falseFunc"],["check_adblock","true"],["$.magnificPopup.open","noopFunc"],["adsenseadBlock","noopFunc"],["adblockSuspected","false"],["xRds","true"],["cRAds","false"],["String.prototype.charCodeAt","trueFunc"],["disasterpingu","false"],["App.views.adsView.adblock","false"],["flashvars.adv_pause_html",""],["$.fx.off","true"],["isAdb","false"],["adBlockEnabled","false"],["puShown","true"],["ads_b_test","true"],["showAds","true"],["attr","{}"],["scriptSrc",""],["cxStartDetectionProcess","noopFunc"],["isAdBlocked","false"],["adblock","noopFunc"],["path",""],["_ctrl_vt.blocked.ad_script","false"],["blockAdBlock","noopFunc"],["caca","noopFunc"],["Ok","true"],["safelink.adblock","false"],["openPopunder","noopFunc"],["ClickUnder","noopFunc"],["flashvars.adv_pre_url",""],["flashvars.protect_block",""],["flashvars.video_click_url",""],["adBlock","false"],["spoof","noopFunc"],["btoa","null"],["sp_ad","true"],["adsBlocked","false"],["_sp_.msg.displayMessage","noopFunc"],["CaptchmeState.adb","undefined"],["indexedDB.open","trueFunc"],["UhasAB","false"],["adNotificationDetected","false"],["atob","noopFunc"],["_pop","noopFunc"],["CnnXt.Event.fire","noopFunc"],["_ti_update_user","noopFunc"],["valid","1"],["vastAds","[]"],["adblock","1"],["frg","1"],["time","0"],["ads","true"],["GNCA_Ad_Support","true"],["Date.now","noopFunc"],["jQuery.adblock","1"],["VMG.Components.Adblock","false"],["_n_app.popunder","null"],["N_BetterJsPop.object","{}"],["adblockDetector","trueFunc"],["hasPoped","true"],["flashvars.video_click_url","undefined"],["flashvars.adv_start_html",""],["flashvars.popunder_url",""],["flashvars.adv_post_src",""],["flashvars.adv_post_url",""],["jQuery.adblock","false"],["google_jobrunner","true"],["sec","0"],["gadb","false"],["checkadBlock","noopFunc"],["clientSide.adbDetect","noopFunc"],["HTMLAnchorElement.prototype.click","noopFunc"],["cmnnrunads","true"],["adBlocker","false"],["adBlockDetected","noopFunc"],["StileApp.somecontrols.adBlockDetected","noopFunc"],["MDCore.adblock","0"],["google_tag_data","noopFunc"],["noAdBlock","true"],["adsOk","true"],["check","true"],["isal","true"],["document.hidden","true"],["awm","true"],["adblockEnabled","false"],["is_adblocked","false"],["ABLK","false"],["pogo.intermission.staticAdIntermissionPeriod","0"],["SubmitDownload1","noopFunc"],["t","0"],["ckaduMobilePop","noopFunc"],["tieneAdblock","0"],["adsAreBlocked","false"],["cmgpbjs","false"],["displayAdblockOverlay","false"],["google","false"],["Math.pow","noopFunc"],["openInNewTab","noopFunc"],["runAdBlocker","false"],["Adblock","false"],["flashvars.logo_url",""],["flashvars.logo_text",""],["nlf.custom.userCapabilities","false"],["count","0"],["LoadThisScript","true"],["showPremLite","true"],["closeBlockerModal","false"],["adBlockDetector.isEnabled","falseFunc"],["areAdsDisplayed","true"],["gkAdsWerbung","true"],["document.bridCanRunAds","true"],["pop_target","null"],["is_banner","true"],["$easyadvtblock","false"],["show_dfp_preroll","false"],["show_youtube_preroll","false"],["doads","true"],["jsUnda","noopFunc"],["AlobaidiDetectAdBlock","true"],["Advertisement","1"],["adBlockDetected","false"],["abp1","1"],["pr_okvalida","true"],["$.ajax","trueFunc"],["cnbc.canShowAds","true"],["ue_adb_chk","1"],["firefaucet","true"],["cRAds","true"],["uas","[]"],["flashvars.popunder_url","undefined"],["adv","true"],["prerollMain","undefined"],["canRunAds","true"],["Fingerprint2","true"],["dclm_ajax_var.disclaimer_redirect_url",""],["load_pop_power","noopFunc"],["adBlockDetected","true"],["Time_Start","0"],["blockAdBlock","trueFunc"],["ezstandalone.enabled","true"],["foundation.adPlayer.bitmovin","{}"],["DL8_GLOBALS.enableAdSupport","false"],["DL8_GLOBALS.useHomad","false"],["DL8_GLOBALS.enableHomadDesktop","false"],["DL8_GLOBALS.enableHomadMobile","false"],["Object.prototype.adReinsertion","noopFunc"],["getHomadConfig","noopFunc"],["ab","false"],["go_popup","{}"],["noBlocker","true"],["adsbygoogle","null"],["fabActive","false"],["gWkbAdVert","true"],["noblock","true"],["wgAffiliateEnabled","false"],["ads","null"],["detectAdblock","noopFunc"],["adsLoadable","true"],["ASSetCookieAds","null"],["letShowAds","true"],["ulp_noadb","true"],["Object.prototype.adblock_detected","false"],["timeSec","0"],["adsbygoogle.loaded","true"],["ads_unblocked","true"],["xxSetting.adBlockerDetection","false"],["open","undefined"],["Drupal.behaviors.adBlockerPopup","null"],["fake_ad","true"],["koddostu_com_adblock_yok","null"],["adsbygoogle","trueFunc"],["player.ads.cuePoints","undefined"],["adBlockDetected","null"],["better_ads_adblock","1"],["Adv_ab","false"],["sgpbCanRunAds","true"],["document.hidden","false"],["document.hasFocus","trueFunc"],["hasFocus","trueFunc"],["navigator.brave","undefined"],["Object.prototype.isAllAdClose","true"],["isRequestPresent","true"],["fouty","true"],["Notification","undefined"],["protection","noopFunc"],["private","false"],["navigator.webkitTemporaryStorage.queryUsageAndQuota","noopFunc"],["document.onkeydown","noopFunc"],["showadas","true"],["alert","throwFunc"],["iktimer","0"],["aSl.gcd","0"],["window.adLink","null"],["detectedAdblock","undefined"],["isTabActive","true"],["clicked","2"],["ov.advertising.tisoomi.loadScript","noopFunc"],["abp","false"],["hommy","{}"],["hommy.waitUntil","noopFunc"],["flashvars.mlogo",""],["vpPrerollVideo","undefined"],["hold_click","false"],["admiral","noopFunc"],["gnt.u.adfree","true"],["__INITIAL_DATA__.siteData.admiralScript"],["objAd.loadAdShield","noopFunc"],["window.myAd.runAd","noopFunc"],["__INITIAL_STATE__.config.theme.ads.isAdBlockerEnabled","false"],["__INITIAL_STATE__.gameLists.gamesNoPrerollIds.indexOf","trueFunc"],["document.ontouchend","null"],["document.onclick","null"],["pubAdsService","trueFunc"],["config.pauseInspect","false"],["appContext.adManager.context.current.adFriendly","false"],["blockAdBlock._options.baitClass","null"],["document.blocked_var","1"],["____ads_js_blocked","false"],["wIsAdBlocked","false"],["WebSite.plsDisableAdBlock","null"],["ads_blocked","false"],["samDetected","false"],["countClicks","0"],["settings.adBlockerDetection","false"],["mixpanel.get_distinct_id","true"],["fuckAdBlock._options.baitClass","null"],["bscheck.adblocker","noopFunc"],["qpcheck.ads","noopFunc"],["isContentBlocked","falseFunc"],["CloudflareApps.installs.Ik7rmQ4t95Qk.options.measureDomain","undefined"],["detectAB1","noopFunc"],["uBlockOriginDetected","false"],["googletag._vars_","{}"],["googletag._loadStarted_","true"],["googletag._loaded_","true"],["google_unique_id","1"],["google.javascript","{}"],["google.javascript.ads","{}"],["google_global_correlator","1"],["paywallGateway.truncateContent","noopFunc"],["adBlockDisabled","true"],["blockedElement","noopFunc"],["popit","false"],["adBlockerDetected","false"],["abu","falseFunc"],["countdown","0"],["decodeURI","noopFunc"],["flashvars.adv_postpause_vast",""],["univresalP","noopFunc"],["xv_ad_block","0"],["openWindow","noopFunc"],["vidorev_jav_plugin_video_ads_object.vid_ads_m_video_ads",""],["adsProvider.init","noopFunc"],["SDKLoaded","true"],["blockAdBlock._creatBait","null"],["POPUNDER_ENABLED","false"],["plugins.preroll","noopFunc"],["errcode","0"],["DHAntiAdBlocker","true"],["showada","true"],["showax","true"],["p18","undefined"],["ADBLOCKED","false"],["Object.prototype.adsEnabled","false"],["adb","0"],["String.fromCharCode","trueFunc"],["adblock_use","false"],["Object.prototype.adblockFound","false"],["nitroAds.loaded","true"],["createCanvas","noopFunc"],["playerAdSettings.adLink",""],["playerAdSettings.waitTime","0"],["xv.sda.pp.init","noopFunc"],["isAdsLoaded","true"],["adblockerAlert","noopFunc"],["Object.prototype.parseXML","noopFunc"],["Object.prototype.blackscreenDuration","1"],["Object.prototype.adPlayerId",""],["adblockDetect","noopFunc"],["style","noopFunc"],["history.pushState","noopFunc"],["google_unique_id","6"],["__NEXT_DATA__.props.pageProps.adsConfig","undefined"],["new_config.timedown","0"],["truex","{}"],["truex.client","noopFunc"],["hiddenProxyDetected","false"],["SteadyWidgetSettings.adblockActive","false"],["proclayer","noopFunc"],["timeleft","0"],["load_ads","trueFunc"],["detectAdBlock","noopFunc"],["starPop","1"],["Object.prototype.ads","noopFunc"],["detectBlockAds","noopFunc"],["ga","trueFunc"],["ad_link",""],["penciBlocksArray","[]"],["App.AdblockDetected","false"],["SF.adblock","true"],["startfrom","0"],["D4zz","noopFunc"],["Object.prototype.ads.nopreroll_","true"],["HP_Scout.adBlocked","false"],["SD_IS_BLOCKING","false"],["Object.prototype.isPremium","true"],["__BACKPLANE_API__.renderOptions.showAdBlock",""],["Object.prototype.isNoAds","{}"],["tv3Cmp.ConsentGiven","true"],["countDownDate","0"],["setupSkin","noopFunc"],["Object.prototype.enableInterstitial","false"],["ads","undefined"],["td_ad_background_click_link","undefined"],["ADBLOCK","false"],["POSTPART_prototype.ADKEY","noopFunc"],["adBlockDetected","falseFunc"],["divWidth","1"],["noAdBlock","noopFunc"],["AdService.info.abd","noopFunc"],["adBlockDetectionResult","undefined"],["popped","true"],["puShown1","true"],["passthetest","true"],["timeset","0"],["pandaAdviewValidate","true"],["canGetAds","true"],["ad_blocker_active","false"],["init_welcome_ad","noopFunc"],["moneyAbovePrivacyByvCDN","true"],["document.body.contains","trueFunc"],["popunder","undefined"],["distance","0"],["document.onclick",""],["adEnable","true"],["displayAds","0"],["_adshrink.skiptime","0"],["AbleToRunAds","true"],["PreRollAd.timeCounter","0"],["TextEncoder","undefined"],["abpblocked","undefined"],["app.showModalAd","noopFunc"],["paAddUnit","noopFunc"],["adt","0"],["test_adblock","noopFunc"],["adblockDetector","noopFunc"],["vastEnabled","false"],["detectadsbocker","false"],["two_worker_data_js.js","[]"],["FEATURE_DISABLE_ADOBE_POPUP_BY_COUNTRY","true"],["questpassGuard","noopFunc"],["isAdBlockerEnabled","false"],["sssp","emptyObj"],["smartLoaded","true"],["timeLeft","0"],["Cookiebot","noopFunc"],["feature_flags.interstitial_ads_flag","false"],["feature_flags.interstitials_every_four_slides","false"],["waldoSlotIds","true"],["adblockstatus","false"],["adScriptLoaded","true"],["adblockEnabled","noopFunc"],["adSettings","[]"],["banner_is_blocked","false"],["Object.prototype.adBlocked","false"],["isadb","false"],["chp_adblock_browser","noopFunc"],["googleAd","true"],["Brid.A9.prototype.backfillAdUnits","[]"],["dct","0"],["slideShow.displayInterstitial","true"],["googletag","true"],["tOS2","150"],["checkAdBlocker","noopFunc"],["PlayerConfig.config.CustomAdSetting","[]"],["navigator.standalone","true"],["ShowAdvertising","{}"],["empire.pop","undefined"],["empire.direct","undefined"],["empire.directHideAds","undefined"],["empire.mediaData.advisorMovie","1"],["empire.mediaData.advisorSerie","1"],["setTimer","0"],["penci_adlbock.ad_blocker_detector","0"],["Object.prototype.adblockDetector","noopFunc"],["blext","true"],["vidorev_jav_plugin_video_ads_object","{}"],["vidorev_jav_plugin_video_ads_object_post","{}"],["S_Popup","10"],["rabLimit","-1"],["nudgeAdBlock","noopFunc"],["feedBack.showAffilaePromo","noopFunc"],["FAVE.settings.ads.ssai.prod.clips.enabled","false"],["FAVE.settings.ads.ssai.prod.liveAuth.enabled","false"],["FAVE.settings.ads.ssai.prod.liveUnauth.enabled","false"],["HTMLScriptElement.prototype.onerror","null"],["loadpagecheck","noopFunc"],["art3m1sItemNames.affiliate-wrapper","\"\""],["window.adngin","{}"],["amzn_aps_csm","{}"],["amzn_aps_csm.define","noopFunc"],["isAdBlockerActive","noopFunc"],["di.app.WebplayerApp.Ads.Adblocks.app.AdBlockDetectApp.startWithParent","false"],["sharedController.adblockDetector","noopFunc"],["checkAdsStatus","noopFunc"],["ads","[]"],["settings.adBlockDetectionEnabled","false"],["displayInterstitialAdConfig","false"],["checkAdBlockeraz","noopFunc"],["blockingAds","false"],["Yii2App.playbackTimeout","0"],["QiyiPlayerProphetData.a.data","{}"],["toggleAdBlockInfo","falseFunc"],["aipAPItag.prerollSkipped","true"],["aipAPItag.setPreRollStatus","trueFunc"],["reklam_1_saniye","0"],["reklam_1_gecsaniye","0"],["reklamsayisi","1"],["reklam_1",""],["powerAPITag","emptyObj"],["playerEnhancedConfig.run","throwFunc"],["aoAdBlockDetected","false"],["rodo.checkIsDidomiConsent","noopFunc"],["rodo.waitForConsent","noopPromiseResolve"],["xtime","0"],["Div_popup",""],["Scribd.Blob.AdBlockerModal","noopFunc"],["AddAdsV2I.addBlock","false"],["hasAdBlocker","false"],["initials.yld-pdpopunder",""],["download_click","true"],["advertisement3","true"],["importFAB","undefined"],["clicked","true"],["eClicked","true"],["number","0"],["sync","true"],["PlayerLogic.prototype.detectADB","noopFunc"],["showPopunder","noopFunc"],["Object.prototype.prerollAds","[]"],["notifyMe","noopFunc"],["adsClasses","undefined"],["gsecs","0"],["dvsize","52"],["majorse","true"],["completed","1"],["testerli","false"],["w87.abd","noopFunc"],["document.referrer",""],["Object.prototype.setNeedShowAdblockWarning","noopFunc"],["NoAdBlock","noopFunc"],["adList","[]"],["ifmax","true"],["nitroAds.abp","true"],["onloadUI","noopFunc"],["PageLoader.DetectAb","0"],["one_time","1"],["consentGiven","true"],["playID","1"],["GEMG.GPT.Interstitial","noopFunc"],["amiblock","0"],["karte3","18"],["sandDetect","noopFunc"],["amodule.data","emptyArr"],["Object.prototype.ADBLOCK_DETECTION",""],["postroll","undefined"],["interstitial","undefined"],["isAdBlockDetected","false"],["pData.adblockOverlayEnabled","0"],["cabdSettings","undefined"],["td_ad_background_click_link"],["malisx","true"],["ADS.isBannersEnabled","false"],["EASYFUN_ADS_CAN_RUN","true"],["adsbygoogle_ama_fc_has_run","true"],["jwDefaults.advertising","{}"],["elimina_profilazione","1"],["elimina_pubblicita","1"],["abd","{}"],["checkerimg","noopFunc"],["detectedAdblock","noopFunc"],["Object.prototype.DetectByGoogleAd","noopFunc"],["nitroAds","{}"],["nitroAds.createAd","noopFunc"],["NativeAd","noopFunc"],["Blob","noopFunc"],["window.navigator.brave","undefined"],["HTMLScriptElement.prototype.onerror","undefined"],["isAdblock","false"],["openPop","noopFunc"],["attachEvent","trueFunc"],["cns.library","true"],["BJSShowUnder","{}"],["BJSShowUnder.bindTo","noopFunc"],["BJSShowUnder.add","noopFunc"],["Object.prototype._parseVAST","noopFunc"],["Object.prototype.createAdBlocker","noopFunc"],["Object.prototype.isAdPeriod","falseFunc"],["countDown","0"],["runCheck","noopFunc"],["adsSlotRenderEndSeen","true"],["showModal","noopFunc"],["flashvars.mlogo_link",""],["isAdBlocked","noopFunc"],["URLlist","[]"],["aaw","{}"],["aaw.processAdsOnPage","noopFunc"],["doOpen","undefined"],["HTMLImageElement.prototype.onerror","undefined"],["FOXIZ_MAIN_SCRIPT.siteAccessDetector","noopFunc"],["openAdBlockPopup","noopFunc"],["Object.prototype._adsDisabled","true"],["advanced_ads_check_adblocker","noopFunc"],["canRunAds","1"],["attestHasAdBlockerActivated","true"],["extInstalled","true"],["SaveFiles.add","noopFunc"],["detectSandbox","noopFunc"],["rwt","noopFunc"],["bmak.js_post","false"],["firebase.analytics","noopFunc"],["Object.prototype.updateModifiedCommerceUrl","noopFunc"],["flashvars.event_reporting",""],["Object.prototype.has_opted_out_tracking","trueFunc"],["Visitor","{}"],["send_gravity_event","noopFunc"],["send_recommendation_event","noopFunc"],["libAnalytics.data.get","noopFunc"],["adthrive._components.start","noopFunc"],["navigator.sendBeacon","noopFunc"]];
const hostnamesMap = new Map([["kellywhatcould.com",0],["gogoanime.*",[0,193]],["adrianmissionminute.com",0],["alejandrocenturyoil.com",0],["alleneconomicmatter.com",0],["apinchcaseation.com",0],["bethshouldercan.com",0],["bigclatterhomesguideservice.com",0],["bradleyviewdoctor.com",0],["brittneystandardwestern.com",0],["brookethoughi.com",0],["brucevotewithin.com",0],["cindyeyefinal.com",0],["denisegrowthwide.com",0],["diananatureforeign.com",0],["donaldlineelse.com",0],["edwardarriveoften.com",0],["erikcoldperson.com",0],["evelynthankregion.com",0],["graceaddresscommunity.com",0],["heatherdiscussionwhen.com",0],["heatherwholeinvolve.com",0],["housecardsummerbutton.com",0],["jamessoundcost.com",0],["jamesstartstudent.com",0],["jamiesamewalk.com",0],["jasminetesttry.com",0],["jasonresponsemeasure.com",0],["jayservicestuff.com",0],["jennifercertaindevelopment.com",0],["jessicaglassauthor.com",0],["johnalwayssame.com",0],["johntryopen.com",0],["jonathansociallike.com",0],["josephseveralconcern.com",0],["kennethofficialitem.com",0],["kristiesoundsimply.com",0],["lisatrialidea.com",0],["lorimuchbenefit.com",0],["loriwithinfamily.com",0],["lukecomparetwo.com",0],["mariatheserepublican.com",0],["markstyleall.com",0],["michaelapplysome.com",0],["morganoperationface.com",0],["nathanfromsubject.com",0],["nectareousoverelate.com",0],["paulkitchendark.com",0],["rebeccaneverbase.com",0],["richardsignfish.com",0],["roberteachfinal.com",0],["robertordercharacter.com",0],["robertplacespace.com",0],["ryanagoinvolve.com",0],["sandratableother.com",0],["sandrataxeight.com",0],["seanshowcould.com",0],["sethniceletter.com",0],["shannonpersonalcost.com",0],["sharonwhiledemocratic.com",0],["stevenimaginelittle.com",0],["strawberriesporail.com",0],["susanhavekeep.com",0],["timberwoodanotia.com",0],["tinycat-voe-fashion.com",0],["toddpartneranimal.com",0],["troyyourlead.com",0],["uptodatefinishconference.com",0],["uptodatefinishconferenceroom.com",0],["vincentincludesuccessful.com",0],["voe.sx",0],["maxfinishseveral.com",0],["voe.sx>>",0],["javboys.tv>>",0],["freeplayervideo.com",0],["nazarickol.com",0],["player-cdn.com",0],["playhydrax.com",[0,403,404]],["rabbitstream.net",0],["fmovies.*",0],["u26bekrb.fun",1],["pvpoke-re.com",2],["client.falixnodes.net",[3,4,591,592,593]],["br.de",5],["indeed.com",6],["pasteboard.co",7],["clickhole.com",8],["deadspin.com",8],["gizmodo.com",8],["jalopnik.com",8],["jezebel.com",8],["kotaku.com",8],["lifehacker.com",8],["splinternews.com",8],["theinventory.com",8],["theonion.com",8],["theroot.com",8],["thetakeout.com",8],["pewresearch.org",8],["los40.com",[9,10]],["as.com",10],["telegraph.co.uk",[11,12]],["poweredbycovermore.com",[11,64]],["lumens.com",[11,64]],["verizon.com",13],["humanbenchmark.com",14],["politico.com",15],["officedepot.co.cr",[16,17]],["officedepot.*",[18,19]],["usnews.com",20],["coolmathgames.com",[21,286,287,288]],["video.gazzetta.it",[22,23]],["oggi.it",[22,23]],["manoramamax.com",22],["factable.com",24],["zee5.com",25],["gala.fr",26],["geo.fr",26],["voici.fr",26],["gloucestershirelive.co.uk",27],["arsiv.mackolik.com",28],["jacksonguitars.com",29],["scandichotels.com",30],["stylist.co.uk",31],["nettiauto.com",32],["thaiairways.com",[33,34]],["cerbahealthcare.it",[35,36]],["futura-sciences.com",[35,53]],["toureiffel.paris",35],["campusfrance.org",[35,148]],["tiendaenlinea.claro.com.ni",[37,38]],["tieba.baidu.com",39],["fandom.com",[40,41,347]],["grasshopper.com",[42,43]],["epson.com.cn",[44,45,46,47]],["oe24.at",[48,49]],["szbz.de",48],["platform.autods.com",[50,51]],["kcra.com",52],["wcvb.com",52],["sportdeutschland.tv",52],["wikihow.com",54],["citibank.com.sg",55],["uol.com.br",[56,57,58,59,60]],["gazzetta.gr",61],["digicol.dpm.org.cn",[62,63]],["virginmediatelevision.ie",65],["larazon.es",[66,67]],["waitrosecellar.com",[68,69,70]],["kicker.de",[71,389]],["sharpen-free-design-generator.netlify.app",[72,73]],["help.cashctrl.com",[74,75]],["gry-online.pl",76],["vidaextra.com",77],["commande.rhinov.pro",[78,79]],["ecom.wixapps.net",[78,79]],["tipranks.com",[80,81]],["iceland.co.uk",[82,83,84]],["socket.pearsoned.com",85],["tntdrama.com",[86,87]],["trutv.com",[86,87]],["mobile.de",[88,89]],["ioe.vn",[90,91]],["geiriadur.ac.uk",[90,94]],["welsh-dictionary.ac.uk",[90,94]],["bikeportland.org",[92,93]],["biologianet.com",[57,58,59]],["10play.com.au",[95,96]],["sunshine-live.de",[97,98]],["whatismyip.com",[99,100]],["myfitnesspal.com",101],["netoff.co.jp",[102,103]],["bluerabbitrx.com",[102,103]],["foundit.*",[104,105]],["clickjogos.com.br",106],["bristan.com",[107,108]],["zillow.com",109],["share.hntv.tv",[110,111,112,113]],["forum.dji.com",[110,113]],["unionpayintl.com",[110,112]],["streamelements.com",110],["optimum.net",[114,115]],["hdfcfund.com",116],["user.guancha.cn",[117,118]],["sosovalue.com",119],["bandyforbundet.no",[120,121]],["tatacommunications.com",122],["suamusica.com.br",[123,124,125]],["macrotrends.net",[126,127]],["code.world",128],["smartcharts.net",128],["topgear.com",129],["eservice.directauto.com",[130,131]],["nbcsports.com",132],["standard.co.uk",133],["pruefernavi.de",[134,135]],["speedtest.net",[136,137]],["17track.net",138],["visible.com",139],["hagerty.com",[140,141]],["marketplace.nvidia.com",142],["kino.de",[143,144]],["9now.nine.com.au",145],["worldstar.com",146],["prisjakt.no",147],["developer.arm.com",[149,150]],["m.youtube.com",[151,152,153,154]],["music.youtube.com",[151,152,153,154]],["tv.youtube.com",[151,152,153,154]],["www.youtube.com",[151,152,153,154]],["youtubekids.com",[151,152,153,154]],["youtube-nocookie.com",[151,152,153,154]],["eu-proxy.startpage.com",[151,152,154]],["timesofindia.indiatimes.com",155],["economictimes.indiatimes.com",156],["motherless.com",157],["sueddeutsche.de",158],["watchanimesub.net",159],["wcoanimesub.tv",159],["wcoforever.net",159],["freeviewmovies.com",159],["filehorse.com",159],["guidetnt.com",159],["starmusiq.*",159],["sp-today.com",159],["linkvertise.com",159],["eropaste.net",159],["getpaste.link",159],["sharetext.me",159],["wcofun.*",159],["note.sieuthuthuat.com",159],["elcriticodelatele.com",[159,451]],["gadgets.es",[159,451]],["amateurporn.co",[159,255]],["wiwo.de",160],["primewire.*",161],["streanplay.*",[161,162]],["alphaporno.com",[161,539]],["porngem.com",161],["shortit.pw",[161,239]],["familyporn.tv",161],["sbplay.*",161],["id45.cyou",161],["85tube.com",[161,223]],["milfnut.*",161],["k1nk.co",161],["watchasians.cc",161],["soltoshindo.com",161],["sankakucomplex.com",163],["player.glomex.com",164],["merkur.de",164],["tz.de",164],["sxyprn.*",165],["hqq.*",[166,167]],["waaw.*",[167,168]],["hotpornfile.org",167],["player.tabooporns.com",167],["x69.ovh",167],["wiztube.xyz",167],["younetu.*",167],["multiup.us",167],["peliculas8k.com",[167,168]],["video.q34r.org",167],["czxxx.org",167],["vtplayer.online",167],["vvtplayer.*",167],["netu.ac",167],["netu.frembed.lol",167],["adbull.org",169],["123link.*",169],["adshort.*",169],["mitly.us",169],["linkrex.net",169],["linx.cc",169],["oke.io",169],["linkshorts.*",169],["dz4link.com",169],["adsrt.*",169],["linclik.com",169],["shrt10.com",169],["vinaurl.*",169],["loptelink.com",169],["adfloz.*",169],["cut-fly.com",169],["linkfinal.com",169],["payskip.org",169],["cutpaid.com",169],["linkjust.com",169],["leechpremium.link",169],["icutlink.com",[169,260]],["oncehelp.com",169],["rgl.vn",169],["reqlinks.net",169],["bitlk.com",169],["qlinks.eu",169],["link.3dmili.com",169],["short-fly.com",169],["foxseotools.com",169],["dutchycorp.*",169],["shortearn.*",169],["pingit.*",169],["link.turkdown.com",169],["7r6.com",169],["oko.sh",169],["ckk.ai",169],["fc.lc",169],["fstore.biz",169],["shrink.*",169],["cuts-url.com",169],["eio.io",169],["exe.app",169],["exee.io",169],["exey.io",169],["skincarie.com",169],["exeo.app",169],["tmearn.*",169],["coinlyhub.com",[169,326]],["adsafelink.com",169],["aii.sh",169],["megalink.*",169],["cybertechng.com",[169,341]],["cutdl.xyz",169],["iir.ai",169],["shorteet.com",[169,359]],["miniurl.*",169],["smoner.com",169],["gplinks.*",169],["odisha-remix.com",[169,341]],["xpshort.com",[169,341]],["upshrink.com",169],["clk.*",169],["easysky.in",169],["veganab.co",169],["go.bloggingaro.com",169],["go.gyanitheme.com",169],["go.theforyou.in",169],["go.hipsonyc.com",169],["birdurls.com",169],["vipurl.in",169],["try2link.com",169],["jameeltips.us",169],["gainl.ink",169],["promo-visits.site",169],["satoshi-win.xyz",[169,375]],["shorterall.com",169],["encurtandourl.com",169],["forextrader.site",169],["postazap.com",169],["cety.app",169],["exego.app",[169,370]],["cutlink.net",169],["cutsy.net",169],["cutyurls.com",169],["cutty.app",169],["cutnet.net",169],["jixo.online",169],["tinys.click",[169,341]],["cpm.icu",169],["panyshort.link",169],["enagato.com",169],["pandaznetwork.com",169],["tpi.li",169],["oii.la",169],["recipestutorials.com",169],["pureshort.*",169],["shrinke.*",169],["shrinkme.*",169],["shrinkforearn.in",169],["oii.io",169],["du-link.in",169],["atglinks.com",169],["thotpacks.xyz",169],["megaurl.in",169],["megafly.in",169],["simana.online",169],["fooak.com",169],["joktop.com",169],["evernia.site",169],["falpus.com",169],["link.paid4link.com",169],["exalink.fun",169],["shortxlinks.com",169],["upfion.com",169],["upfiles.app",169],["upfiles-urls.com",169],["flycutlink.com",[169,341]],["linksly.co",169],["link1s.*",169],["pkr.pw",169],["imagenesderopaparaperros.com",169],["shortenbuddy.com",169],["apksvip.com",169],["4cash.me",169],["namaidani.com",169],["shortzzy.*",169],["teknomuda.com",169],["shorttey.*",[169,325]],["miuiku.com",169],["savelink.site",169],["lite-link.*",169],["adcorto.*",169],["samaa-pro.com",169],["miklpro.com",169],["modapk.link",169],["ccurl.net",169],["linkpoi.me",169],["menjelajahi.com",169],["pewgame.com",169],["haonguyen.top",169],["zshort.*",169],["crazyblog.in",169],["cutearn.net",169],["rshrt.com",169],["filezipa.com",169],["dz-linkk.com",169],["upfiles.*",169],["theblissempire.com",169],["finanzas-vida.com",169],["adurly.cc",169],["paid4.link",169],["link.asiaon.top",169],["go.gets4link.com",169],["linkfly.*",169],["beingtek.com",169],["shorturl.unityassets4free.com",169],["disheye.com",169],["techymedies.com",169],["techysuccess.com",169],["za.gl",[169,275]],["bblink.com",169],["myad.biz",169],["swzz.xyz",169],["vevioz.com",169],["charexempire.com",169],["clk.asia",169],["linka.click",169],["sturls.com",169],["myshrinker.com",169],["snowurl.com",[169,341]],["netfile.cc",169],["wplink.*",169],["rocklink.in",169],["techgeek.digital",169],["download3s.net",169],["shortx.net",169],["shortawy.com",169],["tlin.me",169],["apprepack.com",169],["up-load.one",169],["zuba.link",169],["bestcash2020.com",169],["hoxiin.com",169],["paylinnk.com",169],["thizissam.in",169],["ier.ai",169],["adslink.pw",169],["novelssites.com",169],["links.medipost.org",169],["faucetcrypto.net",169],["short.freeltc.top",169],["trxking.xyz",169],["weadown.com",169],["m.bloggingguidance.com",169],["blog.onroid.com",169],["link.codevn.net",169],["upfilesurls.com",169],["link4rev.site",169],["c2g.at",169],["bitcosite.com",[169,553]],["cryptosh.pro",169],["link68.net",169],["traffic123.net",169],["windowslite.net",[169,341]],["viewfr.com",169],["cl1ca.com",169],["4br.me",169],["fir3.net",169],["seulink.*",169],["encurtalink.*",169],["kiddyshort.com",169],["watchmygf.me",[170,194]],["camwhores.*",[170,180,222,223,224]],["camwhorez.tv",[170,180,222,223]],["cambay.tv",[170,202,222,252,254,255,256,257]],["fpo.xxx",[170,202]],["sexemix.com",170],["heavyfetish.com",[170,715]],["thotcity.su",170],["viralxxxporn.com",[170,393]],["tube8.*",[171,172]],["you-porn.com",172],["youporn.*",172],["youporngay.com",172],["youpornru.com",172],["redtube.*",172],["9908ww.com",172],["adelaidepawnbroker.com",172],["bztube.com",172],["hotovs.com",172],["insuredhome.org",172],["nudegista.com",172],["pornluck.com",172],["vidd.se",172],["pornhub.*",[172,314]],["pornhub.com",172],["pornerbros.com",173],["freep.com",173],["porn.com",174],["tune.pk",175],["noticias.gospelmais.com.br",176],["techperiod.com",176],["viki.com",[177,178]],["watch-series.*",179],["watchseries.*",179],["vev.*",179],["vidop.*",179],["vidup.*",179],["sleazyneasy.com",[180,181,182]],["smutr.com",[180,322]],["tktube.com",180],["yourporngod.com",[180,181]],["javbangers.com",[180,440]],["camfox.com",180],["camthots.tv",[180,252]],["shegotass.info",180],["amateur8.com",180],["bigtitslust.com",180],["ebony8.com",180],["freeporn8.com",180],["lesbian8.com",180],["maturetubehere.com",180],["sortporn.com",180],["motherporno.com",[180,181,202,254]],["theporngod.com",[180,181]],["watchdirty.to",[180,223,224,255]],["pornsocket.com",183],["luxuretv.com",184],["porndig.com",[185,186]],["webcheats.com.br",187],["ceesty.com",[188,189]],["gestyy.com",[188,189]],["corneey.com",189],["destyy.com",189],["festyy.com",189],["sh.st",189],["mitaku.net",189],["angrybirdsnest.com",190],["zrozz.com",190],["clix4btc.com",190],["4tests.com",190],["goltelevision.com",190],["news-und-nachrichten.de",190],["laradiobbs.net",190],["urlaubspartner.net",190],["produktion.de",190],["cinemaxxl.de",190],["bladesalvador.com",190],["tempr.email",190],["cshort.org",190],["friendproject.net",190],["covrhub.com",190],["katfile.com",[190,623]],["trust.zone",190],["business-standard.com",190],["planetsuzy.org",191],["empflix.com",192],["1movies.*",[193,199]],["xmovies8.*",193],["masteranime.tv",193],["0123movies.*",193],["gostream.*",193],["gomovies.*",193],["transparentcalifornia.com",194],["deepbrid.com",195],["webnovel.com",196],["streamwish.*",[197,198]],["oneupload.to",198],["wishfast.top",198],["rubystm.com",198],["rubyvid.com",198],["rubyvidhub.com",198],["stmruby.com",198],["streamruby.com",198],["schwaebische.de",200],["8tracks.com",201],["3movs.com",202],["bravoerotica.net",[202,254]],["youx.xxx",202],["camclips.tv",[202,322]],["xtits.*",[202,254]],["camflow.tv",[202,254,255,294,393]],["camhoes.tv",[202,252,254,255,294,393]],["xmegadrive.com",202],["xxxymovies.com",202],["xxxshake.com",202],["gayck.com",202],["xhand.com",[202,254]],["analdin.com",[202,254]],["revealname.com",203],["pouvideo.*",204],["povvideo.*",204],["povw1deo.*",204],["povwideo.*",204],["powv1deo.*",204],["powvibeo.*",204],["powvideo.*",204],["powvldeo.*",204],["golfchannel.com",205],["stream.nbcsports.com",205],["mathdf.com",205],["gamcore.com",206],["porcore.com",206],["porngames.tv",206],["69games.xxx",206],["javmix.app",206],["tecknity.com",207],["haaretz.co.il",208],["haaretz.com",208],["hungama.com",208],["a-o.ninja",208],["anime-odcinki.pl",208],["shortgoo.blogspot.com",208],["tonanmedia.my.id",[208,575]],["yurasu.xyz",208],["isekaipalace.com",208],["plyjam.*",[209,210]],["ennovelas.com",[210,214]],["foxsports.com.au",211],["canberratimes.com.au",211],["thesimsresource.com",212],["fxporn69.*",213],["vipbox.*",214],["viprow.*",214],["ctrl.blog",215],["sportlife.es",216],["finofilipino.org",217],["desbloqueador.*",218],["xberuang.*",219],["teknorizen.*",219],["mysflink.blogspot.com",219],["ashemaletube.*",220],["paktech2.com",220],["assia.tv",221],["assia4.com",221],["assia24.com",221],["cwtvembeds.com",[223,253]],["camlovers.tv",223],["porntn.com",223],["pornissimo.org",223],["sexcams-24.com",[223,255]],["watchporn.to",[223,255]],["camwhorez.video",223],["footstockings.com",[223,224,255]],["xmateur.com",[223,224,255]],["multi.xxx",224],["worldofbitco.in",[225,226]],["weatherx.co.in",[225,226]],["sunbtc.space",225],["subtorrents.*",227],["subtorrents1.*",227],["newpelis.*",227],["pelix.*",227],["allcalidad.*",227],["infomaniakos.*",227],["ojogos.com.br",228],["powforums.com",229],["supforums.com",229],["studybullet.com",229],["usgamer.net",230],["recordonline.com",230],["freebitcoin.win",231],["e-monsite.com",231],["coindice.win",231],["temp-mails.com",232],["freiepresse.de",233],["investing.com",234],["tornadomovies.*",235],["mp3fiber.com",236],["chicoer.com",237],["dailybreeze.com",237],["dailybulletin.com",237],["dailynews.com",237],["delcotimes.com",237],["eastbaytimes.com",237],["macombdaily.com",237],["ocregister.com",237],["pasadenastarnews.com",237],["pe.com",237],["presstelegram.com",237],["redlandsdailyfacts.com",237],["reviewjournal.com",237],["santacruzsentinel.com",237],["saratogian.com",237],["sentinelandenterprise.com",237],["sgvtribune.com",237],["tampabay.com",237],["times-standard.com",237],["theoaklandpress.com",237],["trentonian.com",237],["twincities.com",237],["whittierdailynews.com",237],["bostonherald.com",237],["dailycamera.com",237],["sbsun.com",237],["dailydemocrat.com",237],["montereyherald.com",237],["orovillemr.com",237],["record-bee.com",237],["redbluffdailynews.com",237],["reporterherald.com",237],["thereporter.com",237],["timescall.com",237],["timesheraldonline.com",237],["ukiahdailyjournal.com",237],["dailylocal.com",237],["mercurynews.com",237],["suedkurier.de",238],["anysex.com",240],["icdrama.*",241],["mangasail.*",241],["pornve.com",242],["file4go.*",243],["coolrom.com.au",243],["marie-claire.es",244],["gamezhero.com",244],["flashgirlgames.com",244],["onlinesudoku.games",244],["mpg.football",244],["sssam.com",244],["globalnews.ca",245],["drinksmixer.com",246],["leitesculinaria.com",246],["fupa.net",247],["browardpalmbeach.com",248],["dallasobserver.com",248],["houstonpress.com",248],["miaminewtimes.com",248],["phoenixnewtimes.com",248],["westword.com",248],["nhentai.net",[249,250]],["nowtv.com.tr",251],["caminspector.net",252],["camwhoreshd.com",252],["camgoddess.tv",252],["gay4porn.com",254],["mypornhere.com",254],["mangovideo.*",255],["love4porn.com",255],["thotvids.com",255],["watchmdh.to",255],["celebwhore.com",255],["cluset.com",255],["sexlist.tv",255],["4kporn.xxx",255],["xhomealone.com",255],["lusttaboo.com",[255,514]],["hentai-moon.com",255],["camhub.cc",[255,682]],["mediapason.it",258],["linkspaid.com",258],["tuotromedico.com",258],["neoteo.com",258],["phoneswiki.com",258],["celebmix.com",258],["myneobuxportal.com",258],["oyungibi.com",258],["25yearslatersite.com",258],["jeshoots.com",259],["techhx.com",259],["karanapk.com",259],["flashplayer.fullstacks.net",261],["cloudapps.herokuapp.com",261],["youfiles.herokuapp.com",261],["texteditor.nsspot.net",261],["temp-mail.org",262],["asianclub.*",263],["javhdporn.net",263],["vidmoly.to",264],["comnuan.com",265],["veedi.com",266],["battleboats.io",266],["anitube.*",267],["fruitlab.com",267],["acetack.com",267],["androidquest.com",267],["apklox.com",267],["chhaprawap.in",267],["gujarativyakaran.com",267],["kashmirstudentsinformation.in",267],["kisantime.com",267],["shetkaritoday.in",267],["pastescript.com",267],["trimorspacks.com",267],["updrop.link",267],["haddoz.net",267],["streamingcommunity.*",267],["garoetpos.com",267],["stiletv.it",268],["mixdrop.*",269],["hqtv.biz",270],["liveuamap.com",271],["muvibg.com",271],["audycje.tokfm.pl",272],["shush.se",273],["allkpop.com",274],["empire-anime.*",[275,570,571,572,573,574]],["empire-streaming.*",[275,570,571,572]],["empire-anime.com",[275,570,571,572]],["empire-streamz.fr",[275,570,571,572]],["empire-stream.*",[275,570,571,572]],["pickcrackpasswords.blogspot.com",276],["kfrfansub.com",277],["thuglink.com",277],["voipreview.org",277],["illicoporno.com",278],["lavoixdux.com",278],["tonpornodujour.com",278],["jacquieetmichel.net",278],["swame.com",278],["vosfemmes.com",278],["voyeurfrance.net",278],["jacquieetmicheltv.net",[278,631,632]],["hanime.tv",279],["pogo.com",280],["cloudvideo.tv",281],["legionjuegos.org",282],["legionpeliculas.org",282],["legionprogramas.org",282],["16honeys.com",283],["elespanol.com",284],["remodelista.com",285],["audiofanzine.com",289],["uploadev.*",290],["developerinsider.co",291],["thehindu.com",292],["cambro.tv",[293,294]],["boobsradar.com",[294,393,695]],["nibelungen-kurier.de",295],["adfoc.us",296],["tea-coffee.net",296],["spatsify.com",296],["newedutopics.com",296],["getviralreach.in",296],["edukaroo.com",296],["funkeypagali.com",296],["careersides.com",296],["nayisahara.com",296],["wikifilmia.com",296],["infinityskull.com",296],["viewmyknowledge.com",296],["iisfvirtual.in",296],["starxinvestor.com",296],["jkssbalerts.com",296],["sahlmarketing.net",296],["filmypoints.in",296],["fitnessholic.net",296],["moderngyan.com",296],["sattakingcharts.in",296],["freshbhojpuri.com",296],["bankshiksha.in",296],["earn.mpscstudyhub.com",296],["earn.quotesopia.com",296],["money.quotesopia.com",296],["best-mobilegames.com",296],["learn.moderngyan.com",296],["bharatsarkarijobalert.com",296],["quotesopia.com",296],["creditsgoal.com",296],["bgmi32bitapk.in",296],["techacode.com",296],["trickms.com",296],["ielts-isa.edu.vn",296],["loan.punjabworks.com",296],["rokni.xyz",296],["keedabankingnews.com",296],["sptfy.be",296],["mcafee-com.com",[296,370]],["pianetamountainbike.it",297],["barchart.com",298],["modelisme.com",299],["parasportontario.ca",299],["prescottenews.com",299],["nrj-play.fr",300],["hackingwithreact.com",301],["gutekueche.at",302],["eplfootballmatch.com",303],["ancient-origins.*",303],["peekvids.com",304],["playvids.com",304],["pornflip.com",304],["redensarten-index.de",305],["vw-page.com",306],["viz.com",[307,308]],["0rechner.de",309],["configspc.com",310],["xopenload.me",310],["uptobox.com",310],["uptostream.com",310],["japgay.com",311],["mega-debrid.eu",312],["dreamdth.com",313],["diaridegirona.cat",315],["diariodeibiza.es",315],["diariodemallorca.es",315],["diarioinformacion.com",315],["eldia.es",315],["emporda.info",315],["farodevigo.es",315],["laopinioncoruna.es",315],["laopiniondemalaga.es",315],["laopiniondemurcia.es",315],["laopiniondezamora.es",315],["laprovincia.es",315],["levante-emv.com",315],["mallorcazeitung.es",315],["regio7.cat",315],["superdeporte.es",315],["playpaste.com",316],["cnbc.com",317],["primevideo.com",318],["read.amazon.*",[318,706]],["firefaucet.win",319],["74k.io",[320,321]],["fullhdxxx.com",323],["pornclassic.tube",324],["tubepornclassic.com",324],["etonline.com",325],["creatur.io",325],["lookcam.*",325],["drphil.com",325],["urbanmilwaukee.com",325],["lootlinks.*",325],["ontiva.com",325],["hideandseek.world",325],["myabandonware.com",325],["kendam.com",325],["wttw.com",325],["synonyms.com",325],["definitions.net",325],["hostmath.com",325],["camvideoshub.com",325],["minhaconexao.com.br",325],["home-made-videos.com",327],["amateur-couples.com",327],["slutdump.com",327],["dpstream.*",328],["produsat.com",329],["bluemediafiles.*",330],["12thman.com",331],["acusports.com",331],["atlantic10.com",331],["auburntigers.com",331],["baylorbears.com",331],["bceagles.com",331],["bgsufalcons.com",331],["big12sports.com",331],["bigten.org",331],["bradleybraves.com",331],["butlersports.com",331],["cmumavericks.com",331],["conferenceusa.com",331],["cyclones.com",331],["dartmouthsports.com",331],["daytonflyers.com",331],["dbupatriots.com",331],["dbusports.com",331],["denverpioneers.com",331],["fduknights.com",331],["fgcuathletics.com",331],["fightinghawks.com",331],["fightingillini.com",331],["floridagators.com",331],["friars.com",331],["friscofighters.com",331],["gamecocksonline.com",331],["goarmywestpoint.com",331],["gobison.com",331],["goblueraiders.com",331],["gobobcats.com",331],["gocards.com",331],["gocreighton.com",331],["godeacs.com",331],["goexplorers.com",331],["goetbutigers.com",331],["gofrogs.com",331],["gogriffs.com",331],["gogriz.com",331],["golobos.com",331],["gomarquette.com",331],["gopack.com",331],["gophersports.com",331],["goprincetontigers.com",331],["gopsusports.com",331],["goracers.com",331],["goshockers.com",331],["goterriers.com",331],["gotigersgo.com",331],["gousfbulls.com",331],["govandals.com",331],["gowyo.com",331],["goxavier.com",331],["gozags.com",331],["gozips.com",331],["griffinathletics.com",331],["guhoyas.com",331],["gwusports.com",331],["hailstate.com",331],["hamptonpirates.com",331],["hawaiiathletics.com",331],["hokiesports.com",331],["huskers.com",331],["icgaels.com",331],["iuhoosiers.com",331],["jsugamecocksports.com",331],["longbeachstate.com",331],["loyolaramblers.com",331],["lrtrojans.com",331],["lsusports.net",331],["morrisvillemustangs.com",331],["msuspartans.com",331],["muleriderathletics.com",331],["mutigers.com",331],["navysports.com",331],["nevadawolfpack.com",331],["niuhuskies.com",331],["nkunorse.com",331],["nuhuskies.com",331],["nusports.com",331],["okstate.com",331],["olemisssports.com",331],["omavs.com",331],["ovcsports.com",331],["owlsports.com",331],["purduesports.com",331],["redstormsports.com",331],["richmondspiders.com",331],["sfajacks.com",331],["shupirates.com",331],["siusalukis.com",331],["smcgaels.com",331],["smumustangs.com",331],["soconsports.com",331],["soonersports.com",331],["themw.com",331],["tulsahurricane.com",331],["txst.com",331],["txstatebobcats.com",331],["ubbulls.com",331],["ucfknights.com",331],["ucirvinesports.com",331],["uconnhuskies.com",331],["uhcougars.com",331],["uicflames.com",331],["umterps.com",331],["uncwsports.com",331],["unipanthers.com",331],["unlvrebels.com",331],["uoflsports.com",331],["usdtoreros.com",331],["utahstateaggies.com",331],["utepathletics.com",331],["utrockets.com",331],["uvmathletics.com",331],["uwbadgers.com",331],["villanova.com",331],["wkusports.com",331],["wmubroncos.com",331],["woffordterriers.com",331],["1pack1goal.com",331],["bcuathletics.com",331],["bubraves.com",331],["goblackbears.com",331],["golightsgo.com",331],["gomcpanthers.com",331],["goutsa.com",331],["mercerbears.com",331],["pirateblue.com",331],["pirateblue.net",331],["pirateblue.org",331],["quinnipiacbobcats.com",331],["towsontigers.com",331],["tribeathletics.com",331],["tribeclub.com",331],["utepminermaniacs.com",331],["utepminers.com",331],["wkutickets.com",331],["aopathletics.org",331],["atlantichockeyonline.com",331],["bigsouthnetwork.com",331],["bigsouthsports.com",331],["chawomenshockey.com",331],["dbupatriots.org",331],["drakerelays.org",331],["ecac.org",331],["ecacsports.com",331],["emueagles.com",331],["emugameday.com",331],["gculopes.com",331],["godrakebulldog.com",331],["godrakebulldogs.com",331],["godrakebulldogs.net",331],["goeags.com",331],["goislander.com",331],["goislanders.com",331],["gojacks.com",331],["gomacsports.com",331],["gseagles.com",331],["hubison.com",331],["iowaconference.com",331],["ksuowls.com",331],["lonestarconference.org",331],["mascac.org",331],["midwestconference.org",331],["mountaineast.org",331],["niu-pack.com",331],["nulakers.ca",331],["oswegolakers.com",331],["ovcdigitalnetwork.com",331],["pacersports.com",331],["rmacsports.org",331],["rollrivers.com",331],["samfordsports.com",331],["uncpbraves.com",331],["usfdons.com",331],["wiacsports.com",331],["alaskananooks.com",331],["broncathleticfund.com",331],["cameronaggies.com",331],["columbiacougars.com",331],["etownbluejays.com",331],["gobadgers.ca",331],["golancers.ca",331],["gometrostate.com",331],["gothunderbirds.ca",331],["kentstatesports.com",331],["lehighsports.com",331],["lopers.com",331],["lycoathletics.com",331],["lycomingathletics.com",331],["maraudersports.com",331],["mauiinvitational.com",331],["msumavericks.com",331],["nauathletics.com",331],["nueagles.com",331],["nwusports.com",331],["oceanbreezenyc.org",331],["patriotathleticfund.com",331],["pittband.com",331],["principiaathletics.com",331],["roadrunnersathletics.com",331],["sidearmsocial.com",331],["snhupenmen.com",331],["stablerarena.com",331],["stoutbluedevils.com",331],["uwlathletics.com",331],["yumacs.com",331],["collegefootballplayoff.com",331],["csurams.com",331],["cubuffs.com",331],["gobearcats.com",331],["gohuskies.com",331],["mgoblue.com",331],["osubeavers.com",331],["pittsburghpanthers.com",331],["rolltide.com",331],["texassports.com",331],["thesundevils.com",331],["uclabruins.com",331],["wvuathletics.com",331],["wvusports.com",331],["arizonawildcats.com",331],["calbears.com",331],["cuse.com",331],["georgiadogs.com",331],["goducks.com",331],["goheels.com",331],["gostanford.com",331],["insidekstatesports.com",331],["insidekstatesports.info",331],["insidekstatesports.net",331],["insidekstatesports.org",331],["k-stateathletics.com",331],["k-statefootball.net",331],["k-statefootball.org",331],["k-statesports.com",331],["k-statesports.net",331],["k-statesports.org",331],["k-statewomenshoops.com",331],["k-statewomenshoops.net",331],["k-statewomenshoops.org",331],["kstateathletics.com",331],["kstatefootball.net",331],["kstatefootball.org",331],["kstatesports.com",331],["kstatewomenshoops.com",331],["kstatewomenshoops.net",331],["kstatewomenshoops.org",331],["ksuathletics.com",331],["ksusports.com",331],["scarletknights.com",331],["showdownforrelief.com",331],["syracusecrunch.com",331],["texastech.com",331],["theacc.com",331],["ukathletics.com",331],["usctrojans.com",331],["utahutes.com",331],["utsports.com",331],["wsucougars.com",331],["vidlii.com",[331,356]],["tricksplit.io",331],["fangraphs.com",332],["stern.de",333],["geo.de",333],["brigitte.de",333],["tvspielfilm.de",[334,335,336,337]],["tvtoday.de",[334,335,336,337]],["chip.de",[334,335,336,337]],["focus.de",[334,335,336,337]],["fitforfun.de",[334,335,336,337]],["n-tv.de",338],["player.rtl2.de",339],["planetaminecraft.com",340],["cravesandflames.com",341],["codesnse.com",341],["flyad.vip",341],["lapresse.ca",342],["kolyoom.com",343],["ilovephd.com",343],["negumo.com",344],["games.wkb.jp",[345,346]],["kenshi.fandom.com",348],["hausbau-forum.de",349],["homeairquality.org",349],["faucettronn.click",349],["fake-it.ws",350],["laksa19.github.io",351],["1shortlink.com",352],["u-s-news.com",353],["luscious.net",354],["makemoneywithurl.com",355],["junkyponk.com",355],["healthfirstweb.com",355],["vocalley.com",355],["yogablogfit.com",355],["howifx.com",[355,538]],["en.financerites.com",355],["mythvista.com",355],["livenewsflix.com",355],["cureclues.com",355],["apekite.com",355],["enit.in",355],["iammagnus.com",356],["dailyvideoreports.net",356],["unityassets4free.com",356],["docer.*",357],["resetoff.pl",357],["sexodi.com",357],["cdn77.org",358],["3sexporn.com",359],["momxxxsex.com",359],["myfreevintageporn.com",359],["penisbuyutucum.net",359],["ujszo.com",360],["newsmax.com",361],["nadidetarifler.com",362],["siz.tv",362],["suzylu.co.uk",[363,364]],["onworks.net",365],["yabiladi.com",365],["downloadsoft.net",366],["newsobserver.com",367],["arkadiumhosted.com",367],["testlanguages.com",368],["newsinlevels.com",368],["videosinlevels.com",368],["bookmystrip.com",369],["sabkiyojana.com",369],["starkroboticsfrc.com",370],["sinonimos.de",370],["antonimos.de",370],["quesignifi.ca",370],["tiktokrealtime.com",370],["tiktokcounter.net",370],["tpayr.xyz",370],["poqzn.xyz",370],["ashrfd.xyz",370],["rezsx.xyz",370],["tryzt.xyz",370],["ashrff.xyz",370],["rezst.xyz",370],["dawenet.com",370],["erzar.xyz",370],["waezm.xyz",370],["waezg.xyz",370],["blackwoodacademy.org",370],["cryptednews.space",370],["vivuq.com",370],["swgop.com",370],["vbnmll.com",370],["telcoinfo.online",370],["dshytb.com",370],["btcbitco.in",[370,374]],["btcsatoshi.net",370],["cempakajaya.com",370],["crypto4yu.com",370],["readbitcoin.org",370],["wiour.com",370],["finish.addurl.biz",370],["aiimgvlog.fun",[370,377]],["laweducationinfo.com",370],["savemoneyinfo.com",370],["worldaffairinfo.com",370],["godstoryinfo.com",370],["successstoryinfo.com",370],["cxissuegk.com",370],["learnmarketinfo.com",370],["bhugolinfo.com",370],["armypowerinfo.com",370],["rsadnetworkinfo.com",370],["rsinsuranceinfo.com",370],["rsfinanceinfo.com",370],["rsgamer.app",370],["rssoftwareinfo.com",370],["rshostinginfo.com",370],["rseducationinfo.com",370],["phonereviewinfo.com",370],["makeincomeinfo.com",370],["gknutshell.com",370],["vichitrainfo.com",370],["workproductivityinfo.com",370],["dopomininfo.com",370],["hostingdetailer.com",370],["fitnesssguide.com",370],["tradingfact4u.com",370],["cryptofactss.com",370],["softwaredetail.com",370],["artoffocas.com",370],["insurancesfact.com",370],["travellingdetail.com",370],["advertisingexcel.com",370],["allcryptoz.net",370],["batmanfactor.com",370],["beautifulfashionnailart.com",370],["crewbase.net",370],["documentaryplanet.xyz",370],["crewus.net",370],["gametechreviewer.com",370],["midebalonu.net",370],["misterio.ro",370],["phineypet.com",370],["seory.xyz",370],["shinbhu.net",370],["shinchu.net",370],["substitutefor.com",370],["talkforfitness.com",370],["thefitbrit.co.uk",370],["thumb8.net",370],["thumb9.net",370],["topcryptoz.net",370],["uniqueten.net",370],["ultraten.net",370],["exactpay.online",370],["quins.us",370],["kiddyearner.com",370],["imagereviser.com",371],["tech.pubghighdamage.com",372],["tech.techkhulasha.com",372],["hipsonyc.com",372],["jiocinema.com",372],["rapid-cloud.co",372],["uploadmall.com",372],["rkd3.dev",372],["4funbox.com",373],["nephobox.com",373],["1024tera.com",373],["terabox.*",373],["blog.cryptowidgets.net",374],["blog.insurancegold.in",374],["blog.wiki-topia.com",374],["blog.coinsvalue.net",374],["blog.cookinguide.net",374],["blog.freeoseocheck.com",374],["blog24.me",374],["bildirim.*",376],["arahdrive.com",377],["appsbull.com",378],["diudemy.com",378],["maqal360.com",[378,379,380]],["lifesurance.info",381],["akcartoons.in",382],["cybercityhelp.in",382],["infokeeda.xyz",383],["webzeni.com",383],["phongroblox.com",384],["fuckingfast.net",385],["tickhosting.com",386],["in91vip.win",387],["datavaults.co",388],["t-online.de",390],["upornia.*",[391,392]],["bobs-tube.com",393],["pornohirsch.net",394],["pixsera.net",395],["pc-builds.com",396],["qtoptens.com",396],["reuters.com",396],["today.com",396],["videogamer.com",396],["wrestlinginc.com",396],["usatoday.com",397],["ydr.com",397],["247sports.com",398],["indiatimes.com",399],["netzwelt.de",400],["arcade.buzzrtv.com",401],["arcade.dailygazette.com",401],["arcade.lemonde.fr",401],["arena.gamesforthebrain.com",401],["bestpuzzlesandgames.com",401],["cointiply.arkadiumarena.com",401],["gamelab.com",401],["games.abqjournal.com",401],["games.amny.com",401],["games.bellinghamherald.com",401],["games.besthealthmag.ca",401],["games.bnd.com",401],["games.boston.com",401],["games.bostonglobe.com",401],["games.bradenton.com",401],["games.centredaily.com",401],["games.charlotteobserver.com",401],["games.cnhinews.com",401],["games.crosswordgiant.com",401],["games.dailymail.co.uk",401],["games.dallasnews.com",401],["games.daytondailynews.com",401],["games.denverpost.com",401],["games.everythingzoomer.com",401],["games.fresnobee.com",401],["games.gameshownetwork.com",401],["games.get.tv",401],["games.greatergood.com",401],["games.heraldonline.com",401],["games.heraldsun.com",401],["games.idahostatesman.com",401],["games.insp.com",401],["games.islandpacket.com",401],["games.journal-news.com",401],["games.kansas.com",401],["games.kansascity.com",401],["games.kentucky.com",401],["games.lancasteronline.com",401],["games.ledger-enquirer.com",401],["games.macon.com",401],["games.mashable.com",401],["games.mercedsunstar.com",401],["games.metro.us",401],["games.metv.com",401],["games.miamiherald.com",401],["games.modbee.com",401],["games.moviestvnetwork.com",401],["games.myrtlebeachonline.com",401],["games.nationalreview.com",401],["games.newsobserver.com",401],["games.parade.com",401],["games.pressdemocrat.com",401],["games.puzzlebaron.com",401],["games.puzzler.com",401],["games.puzzles.ca",401],["games.qns.com",401],["games.readersdigest.ca",401],["games.sacbee.com",401],["games.sanluisobispo.com",401],["games.sixtyandme.com",401],["games.sltrib.com",401],["games.springfieldnewssun.com",401],["games.star-telegram.com",401],["games.startribune.com",401],["games.sunherald.com",401],["games.theadvocate.com",401],["games.thenewstribune.com",401],["games.theolympian.com",401],["games.theportugalnews.com",401],["games.thestar.com",401],["games.thestate.com",401],["games.tri-cityherald.com",401],["games.triviatoday.com",401],["games.usnews.com",401],["games.word.tips",401],["games.wordgenius.com",401],["games.wtop.com",401],["jeux.meteocity.com",401],["juegos.as.com",401],["juegos.elnuevoherald.com",401],["juegos.elpais.com",401],["philly.arkadiumarena.com",401],["play.dictionary.com",401],["puzzles.bestforpuzzles.com",401],["puzzles.centralmaine.com",401],["puzzles.crosswordsolver.org",401],["puzzles.independent.co.uk",401],["puzzles.nola.com",401],["puzzles.pressherald.com",401],["puzzles.standard.co.uk",401],["puzzles.sunjournal.com",401],["arkadium.com",402],["abysscdn.com",[403,404]],["arcai.com",405],["my-code4you.blogspot.com",406],["flickr.com",407],["firefile.cc",408],["pestleanalysis.com",408],["kochamjp.pl",408],["tutorialforlinux.com",408],["whatsaero.com",408],["animeblkom.net",[408,422]],["blkom.com",408],["globes.co.il",[409,410]],["jardiner-malin.fr",411],["tw-calc.net",412],["ohmybrush.com",413],["talkceltic.net",414],["mentalfloss.com",415],["uprafa.com",416],["cube365.net",417],["wwwfotografgotlin.blogspot.com",418],["freelistenonline.com",418],["badassdownloader.com",419],["quickporn.net",420],["yellowbridge.com",421],["aosmark.com",423],["ctrlv.*",424],["atozmath.com",[425,426,427,428,429,430,431]],["newyorker.com",432],["brighteon.com",433],["more.tv",434],["video1tube.com",435],["alohatube.xyz",435],["4players.de",436],["onlinesoccermanager.com",436],["fshost.me",437],["link.cgtips.org",438],["hentaicloud.com",439],["netfapx.com",441],["javdragon.org",441],["javneon.tv",441],["paperzonevn.com",442],["9jarock.org",443],["fzmovies.info",443],["fztvseries.ng",443],["netnaijas.com",443],["hentaienglish.com",444],["hentaiporno.xxx",444],["venge.io",[445,446]],["btcbux.io",447],["its.porn",[448,449]],["atv.at",450],["2ndrun.tv",451],["rackusreads.com",451],["teachmemicro.com",451],["willcycle.com",451],["kusonime.com",[452,453]],["123movieshd.*",454],["imgur.com",[455,456,716]],["hentai-party.com",457],["hentaicomics.pro",457],["uproxy.*",458],["animesa.*",459],["subtitle.one",460],["subtitleone.cc",460],["genshinimpactcalculator.com",461],["mysexgames.com",462],["cinecalidad.*",[463,464]],["xnxx.com",465],["xvideos.*",465],["gdr-online.com",466],["mmm.dk",467],["iqiyi.com",[468,469,604]],["m.iqiyi.com",470],["nbcolympics.com",471],["apkhex.com",472],["indiansexstories2.net",473],["issstories.xyz",473],["1340kbbr.com",474],["gorgeradio.com",474],["kduk.com",474],["kedoam.com",474],["kejoam.com",474],["kelaam.com",474],["khsn1230.com",474],["kjmx.rocks",474],["kloo.com",474],["klooam.com",474],["klykradio.com",474],["kmed.com",474],["kmnt.com",474],["kool991.com",474],["kpnw.com",474],["kppk983.com",474],["krktcountry.com",474],["ktee.com",474],["kwro.com",474],["kxbxfm.com",474],["thevalley.fm",474],["quizlet.com",475],["dsocker1234.blogspot.com",476],["schoolcheats.net",[477,478]],["mgnet.xyz",479],["designtagebuch.de",480],["pixroute.com",481],["uploady.io",482],["calculator-online.net",483],["luckydice.net",484],["adarima.org",484],["weatherwx.com",484],["sattaguess.com",484],["winshell.de",484],["rosasidan.ws",484],["modmakers.xyz",484],["gamepure.in",484],["warrenrahul.in",484],["austiblox.net",484],["upiapi.in",484],["daemonanime.net",484],["networkhint.com",484],["thichcode.net",484],["texturecan.com",484],["tikmate.app",[484,612]],["arcaxbydz.id",484],["quotesshine.com",484],["porngames.club",485],["sexgames.xxx",485],["111.90.159.132",486],["mobile-tracker-free.com",487],["pfps.gg",488],["social-unlock.com",489],["superpsx.com",490],["ninja.io",491],["sourceforge.net",492],["samfirms.com",493],["rapelust.com",494],["vtube.to",494],["desitelugusex.com",494],["dvdplay.*",494],["xvideos-downloader.net",494],["xxxvideotube.net",494],["sdefx.cloud",494],["nozomi.la",494],["moviesonlinefree.net",494],["banned.video",495],["madmaxworld.tv",495],["androidpolice.com",495],["babygaga.com",495],["backyardboss.net",495],["carbuzz.com",495],["cbr.com",495],["collider.com",495],["dualshockers.com",495],["footballfancast.com",495],["footballleagueworld.co.uk",495],["gamerant.com",495],["givemesport.com",495],["hardcoregamer.com",495],["hotcars.com",495],["howtogeek.com",495],["makeuseof.com",495],["moms.com",495],["movieweb.com",495],["pocket-lint.com",495],["pocketnow.com",495],["screenrant.com",495],["simpleflying.com",495],["thegamer.com",495],["therichest.com",495],["thesportster.com",495],["thethings.com",495],["thetravel.com",495],["topspeed.com",495],["xda-developers.com",495],["huffpost.com",496],["ingles.com",497],["spanishdict.com",497],["surfline.com",[498,499]],["play.tv3.ee",500],["play.tv3.lt",500],["play.tv3.lv",[500,501]],["tv3play.skaties.lv",500],["trendyoum.com",502],["bulbagarden.net",503],["hollywoodlife.com",504],["mat6tube.com",505],["hotabis.com",506],["root-nation.com",506],["italpress.com",506],["airsoftmilsimnews.com",506],["artribune.com",506],["textstudio.co",507],["newtumbl.com",508],["apkmaven.*",509],["aruble.net",510],["nevcoins.club",511],["mail.com",512],["gmx.*",513],["mangakita.id",515],["avpgalaxy.net",516],["mhma12.tech",517],["panda-novel.com",518],["zebranovel.com",518],["lightsnovel.com",518],["eaglesnovel.com",518],["pandasnovel.com",518],["ewrc-results.com",519],["kizi.com",520],["cyberscoop.com",521],["fedscoop.com",521],["canale.live",522],["jeep-cj.com",523],["sponsorhunter.com",524],["cloudcomputingtopics.net",525],["likecs.com",526],["tiscali.it",527],["linkspy.cc",528],["adshnk.com",529],["chattanoogan.com",530],["adsy.pw",531],["playstore.pw",531],["socialmediagirls.com",532],["windowspro.de",533],["snapinst.app",534],["tvtv.ca",535],["tvtv.us",535],["mydaddy.cc",536],["roadtrippin.fr",537],["vavada5com.com",538],["anyporn.com",[539,556]],["bravoporn.com",539],["bravoteens.com",539],["crocotube.com",539],["hellmoms.com",539],["hellporno.com",539],["sex3.com",539],["tubewolf.com",539],["xbabe.com",539],["xcum.com",539],["zedporn.com",539],["imagetotext.info",540],["infokik.com",541],["freepik.com",542],["ddwloclawek.pl",[543,544]],["www.seznam.cz",545],["deezer.com",546],["my-subs.co",547],["plaion.com",548],["slideshare.net",[549,550]],["ustreasuryyieldcurve.com",551],["businesssoftwarehere.com",552],["goo.st",552],["freevpshere.com",552],["softwaresolutionshere.com",552],["gamereactor.*",554],["madoohd.com",555],["doomovie-hd.*",555],["staige.tv",557],["lvturbo.com",558],["androidadult.com",559],["streamvid.net",560],["watchtv24.com",561],["cellmapper.net",562],["medscape.com",563],["newscon.org",[564,565]],["wheelofgold.com",566],["drakecomic.*",566],["bembed.net",567],["embedv.net",567],["fslinks.org",567],["listeamed.net",567],["v6embed.xyz",567],["vembed.*",567],["vgplayer.xyz",567],["vid-guard.com",567],["vinomo.xyz",567],["app.blubank.com",568],["mobileweb.bankmellat.ir",568],["chat.nrj.fr",569],["chat.tchatche.com",[569,584]],["ccthesims.com",576],["chromeready.com",576],["coursedrive.org",576],["dtbps3games.com",576],["illustratemagazine.com",576],["uknip.co.uk",576],["vod.pl",577],["megadrive-emulator.com",578],["tvhay.*",[579,580]],["animesaga.in",581],["moviesapi.club",581],["bestx.stream",581],["watchx.top",581],["digimanie.cz",582],["svethardware.cz",582],["srvy.ninja",583],["cnn.com",[585,586,587]],["news.bg",588],["edmdls.com",589],["freshremix.net",589],["scenedl.org",589],["trakt.tv",590],["shroomers.app",594],["classicalradio.com",595],["di.fm",595],["jazzradio.com",595],["radiotunes.com",595],["rockradio.com",595],["zenradio.com",595],["getthit.com",596],["techedubyte.com",597],["soccerinhd.com",597],["movie-th.tv",598],["iwanttfc.com",599],["nutraingredients-asia.com",600],["nutraingredients-latam.com",600],["nutraingredients-usa.com",600],["nutraingredients.com",600],["ozulscansen.com",601],["nexusmods.com",602],["lookmovie.*",603],["lookmovie2.to",603],["biletomat.pl",605],["hextank.io",[606,607]],["filmizlehdfilm.com",[608,609,610,611]],["filmizletv.*",[608,609,610,611]],["fullfilmizle.cc",[608,609,610,611]],["gofilmizle.net",[608,609,610,611]],["btvplus.bg",613],["sagewater.com",614],["redlion.net",614],["filmweb.pl",[615,616]],["satdl.com",617],["vidstreaming.xyz",618],["everand.com",619],["myradioonline.pl",620],["cbs.com",621],["paramountplus.com",621],["fullxh.com",622],["galleryxh.site",622],["megaxh.com",622],["movingxh.world",622],["seexh.com",622],["unlockxh4.com",622],["valuexh.life",622],["xhaccess.com",622],["xhadult2.com",622],["xhadult3.com",622],["xhadult4.com",622],["xhadult5.com",622],["xhamster.*",622],["xhamster1.*",622],["xhamster10.*",622],["xhamster11.*",622],["xhamster12.*",622],["xhamster13.*",622],["xhamster14.*",622],["xhamster15.*",622],["xhamster16.*",622],["xhamster17.*",622],["xhamster18.*",622],["xhamster19.*",622],["xhamster20.*",622],["xhamster2.*",622],["xhamster3.*",622],["xhamster4.*",622],["xhamster42.*",622],["xhamster46.com",622],["xhamster5.*",622],["xhamster7.*",622],["xhamster8.*",622],["xhamsterporno.mx",622],["xhbig.com",622],["xhbranch5.com",622],["xhchannel.com",622],["xhdate.world",622],["xhday.com",622],["xhday1.com",622],["xhlease.world",622],["xhmoon5.com",622],["xhofficial.com",622],["xhopen.com",622],["xhplanet1.com",622],["xhplanet2.com",622],["xhreal2.com",622],["xhreal3.com",622],["xhspot.com",622],["xhtotal.com",622],["xhtree.com",622],["xhvictory.com",622],["xhwebsite.com",622],["xhwebsite2.com",622],["xhwebsite5.com",622],["xhwide1.com",622],["xhwide2.com",622],["xhwide5.com",622],["file-upload.net",624],["lightnovelworld.*",625],["acortalo.*",[626,627,628,629]],["acortar.*",[626,627,628,629]],["megadescarga.net",[626,627,628,629]],["megadescargas.net",[626,627,628,629]],["hentaihaven.xxx",630],["jacquieetmicheltv2.net",632],["a2zapk.*",633],["fcportables.com",[634,635]],["emurom.net",636],["freethesaurus.com",[637,638]],["thefreedictionary.com",[637,638]],["oeffentlicher-dienst.info",639],["im9.eu",640],["dcdlplayer8a06f4.xyz",641],["ultimate-guitar.com",642],["claimbits.net",643],["sexyscope.net",644],["kickassanime.*",645],["recherche-ebook.fr",646],["virtualdinerbot.com",646],["zonebourse.com",647],["pink-sluts.net",648],["andhrafriends.com",649],["benzinpreis.de",650],["turtleviplay.xyz",651],["defenseone.com",652],["govexec.com",652],["nextgov.com",652],["route-fifty.com",652],["sharing.wtf",653],["wetter3.de",654],["esportivos.fun",655],["cosmonova-broadcast.tv",656],["hartvannederland.nl",657],["shownieuws.nl",657],["vandaaginside.nl",657],["rock.porn",[658,659]],["videzz.net",[660,661]],["ezaudiobookforsoul.com",662],["club386.com",663],["decompiler.com",664],["littlebigsnake.com",665],["easyfun.gg",666],["smailpro.com",667],["ilgazzettino.it",668],["ilmessaggero.it",668],["3bmeteo.com",[669,670]],["mconverter.eu",671],["lover937.net",672],["10gb.vn",673],["pes6.es",674],["tactics.tools",[675,676]],["boundhub.com",677],["alocdnnetu.xyz",678],["reliabletv.me",679],["jakondo.ru",680],["filecrypt.*",681],["nolive.me",683],["wired.com",684],["spankbang.*",[685,686,687,718,719]],["hulu.com",[688,689,690]],["anonymfile.com",691],["gofile.to",691],["dotycat.com",692],["rateyourmusic.com",693],["reporterpb.com.br",694],["blog-dnz.com",696],["18adultgames.com",697],["colnect.com",[698,699]],["adultgamesworld.com",700],["bgmiupdate.com.in",701],["reviewdiv.com",702],["parametric-architecture.com",703],["laurelberninteriors.com",[704,721]],["voiceofdenton.com",705],["concealednation.org",705],["askattest.com",707],["opensubtitles.com",708],["savefiles.com",709],["streamup.ws",710],["www.google.*",711],["tacobell.com",712],["zefoy.com",713],["cnet.com",714],["natgeotv.com",717],["globo.com",720],["wayfair.com",722]]);
const exceptionsMap = new Map([["cloudflare.com",[0]],["pingit.com",[169]],["loan.bgmi32bitapk.in",[296]],["lookmovie.studio",[603]]]);
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
