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
const argsList = [["console.clear","undefined"],["adBlockDetected","undefined"],["PrePl","true"],["amzn_aps_csm.init","noopFunc"],["amzn_aps_csm.log","noopFunc"],["akamaiDisableServerIpLookup","noopFunc"],["DD_RUM.addAction","noopFunc"],["nads.createAd","trueFunc"],["ga","noopFunc"],["huecosPBS.nstdX","null"],["DTM.trackAsyncPV","noopFunc"],["_satellite","{}"],["_satellite.getVisitorId","noopFunc"],["newPageViewSpeedtest","noopFunc"],["pubg.unload","noopFunc"],["generateGalleryAd","noopFunc"],["mediator","noopFunc"],["Object.prototype.subscribe","noopFunc"],["gbTracker","{}"],["gbTracker.sendAutoSearchEvent","noopFunc"],["Object.prototype.vjsPlayer.ads","noopFunc"],["network_user_id",""],["google.ima.OmidVerificationVendor","{}"],["Object.prototype.omidAccessModeRules","{}"],["googletag.cmd","{}"],["Object.prototype.setDisableFlashAds","noopFunc"],["DD_RUM.addTiming","noopFunc"],["chameleonVideo.adDisabledRequested","true"],["AdmostClient","{}"],["analytics","{}"],["datalayer","[]"],["Object.prototype.isInitialLoadDisabled","noopFunc"],["listingGoogleEETracking","noopFunc"],["dcsMultiTrack","noopFunc"],["urlStrArray","noopFunc"],["pa","{}"],["Object.prototype.setConfigurations","noopFunc"],["Object.prototype.bk_addPageCtx","noopFunc"],["Object.prototype.bk_doJSTag","noopFunc"],["passFingerPrint","noopFunc"],["optimizely","{}"],["optimizely.initialized","true"],["google_optimize","{}"],["google_optimize.get","noopFunc"],["_gsq","{}"],["_gsq.push","noopFunc"],["stmCustomEvent","noopFunc"],["_gsDevice",""],["iom","{}"],["iom.c","noopFunc"],["_conv_q","{}"],["_conv_q.push","noopFunc"],["google.ima.settings.setDisableFlashAds","noopFunc"],["pa.privacy","{}"],["Object.prototype.getTargetingMap","noopFunc"],["populateClientData4RBA","noopFunc"],["YT.ImaManager","noopFunc"],["UOLPD","{}"],["UOLPD.dataLayer","{}"],["__configuredDFPTags","{}"],["URL_VAST_YOUTUBE","{}"],["Adman","{}"],["dplus","{}"],["dplus.track","noopFunc"],["_satellite.track","noopFunc"],["google.ima.dai","{}"],["gfkS2sExtension","{}"],["gfkS2sExtension.HTML5VODExtension","noopFunc"],["AnalyticsEventTrackingJS","{}"],["AnalyticsEventTrackingJS.addToBasket","noopFunc"],["AnalyticsEventTrackingJS.trackErrorMessage","noopFunc"],["initializeslideshow","noopFunc"],["fathom","{}"],["fathom.trackGoal","noopFunc"],["Origami","{}"],["Origami.fastclick","noopFunc"],["jad","undefined"],["hasAdblocker","true"],["Sentry","{}"],["Sentry.init","noopFunc"],["TRC","{}"],["TRC._taboolaClone","[]"],["fp","{}"],["fp.t","noopFunc"],["fp.s","noopFunc"],["initializeNewRelic","noopFunc"],["turnerAnalyticsObj","{}"],["turnerAnalyticsObj.setVideoObject4AnalyticsProperty","noopFunc"],["optimizelyDatafile","{}"],["optimizelyDatafile.featureFlags","[]"],["fingerprint","{}"],["fingerprint.getCookie","noopFunc"],["gform.utils","noopFunc"],["gform.utils.trigger","noopFunc"],["get_fingerprint","noopFunc"],["moatPrebidApi","{}"],["moatPrebidApi.getMoatTargetingForPage","noopFunc"],["cpd_configdata","{}"],["cpd_configdata.url",""],["yieldlove_cmd","{}"],["yieldlove_cmd.push","noopFunc"],["dataLayer.push","noopFunc"],["_etmc","{}"],["_etmc.push","noopFunc"],["freshpaint","{}"],["freshpaint.track","noopFunc"],["ShowRewards","noopFunc"],["stLight","{}"],["stLight.options","noopFunc"],["DD_RUM.addError","noopFunc"],["sensorsDataAnalytic201505","{}"],["sensorsDataAnalytic201505.init","noopFunc"],["sensorsDataAnalytic201505.quick","noopFunc"],["sensorsDataAnalytic201505.track","noopFunc"],["s","{}"],["s.tl","noopFunc"],["smartech","noopFunc"],["sensors","{}"],["sensors.init","noopFunc"],["sensors.track","noopFunc"],["adn","{}"],["adn.clearDivs","noopFunc"],["_vwo_code","{}"],["gtag","noopFunc"],["_taboola","{}"],["_taboola.push","noopFunc"],["clicky","{}"],["clicky.goal","noopFunc"],["WURFL","{}"],["_sp_.config.events.onSPPMObjectReady","noopFunc"],["gtm","{}"],["gtm.trackEvent","noopFunc"],["mParticle.Identity.getCurrentUser","noopFunc"],["JSGlobals.prebidEnabled","false"],["elasticApm","{}"],["elasticApm.init","noopFunc"],["Object.prototype.que","noopFunc"],["Object.prototype.que.push","noopFunc"],["ga.sendGaEvent","noopFunc"],["adobe","{}"],["MT","{}"],["MT.track","noopFunc"],["ClickOmniPartner","noopFunc"],["adex","{}"],["adex.getAdexUser","noopFunc"],["Adkit","noopFunc"],["Object.prototype.shouldExpectGoogleCMP","false"],["apntag.refresh","noopFunc"],["pa.sendEvent","noopFunc"],["Munchkin","{}"],["Munchkin.init","noopFunc"],["ttd_dom_ready","noopFunc"],["ramp","undefined"],["ytInitialPlayerResponse.playerAds","undefined"],["ytInitialPlayerResponse.adPlacements","undefined"],["ytInitialPlayerResponse.adSlots","undefined"],["playerResponse.adPlacements","undefined"],["nsShowMaxCount","0"],["objVc.interstitial_web",""],["_ml_ads_ns","null"],["_sp_.config","undefined"],["isAdBlockActive","false"],["AdController","noopFunc"],["console.clear","noopFunc"],["console.log","noopFunc"],["Object.prototype.hideAds","true"],["Object.prototype._getSalesHouseConfigurations","noopFunc"],["vast_urls","{}"],["sadbl","false"],["adblockcheck","false"],["arrvast","[]"],["blurred","false"],["flashvars.adv_pre_src",""],["showPopunder","false"],["page_params.holiday_promo","true"],["adsEnabled","true"],["String.prototype.charAt","trueFunc"],["ad_blocker","false"],["blockAdBlock","true"],["VikiPlayer.prototype.pingAbFactor","noopFunc"],["player.options.disableAds","true"],["console.clear","trueFunc"],["flashvars.adv_pre_vast",""],["flashvars.adv_pre_vast_alt",""],["x_width","1"],["_site_ads_ns","true"],["luxuretv.config",""],["Object.prototype.AdOverlay","noopFunc"],["tkn_popunder","null"],["can_run_ads","true"],["adsBlockerDetector","noopFunc"],["globalThis","null"],["adblock","false"],["__ads","true"],["FlixPop.isPopGloballyEnabled","falseFunc"],["check_adblock","true"],["$.magnificPopup.open","noopFunc"],["adsenseadBlock","noopFunc"],["adblockSuspected","false"],["xRds","true"],["cRAds","false"],["String.prototype.charCodeAt","trueFunc"],["disasterpingu","false"],["App.views.adsView.adblock","false"],["flashvars.adv_pause_html",""],["$.fx.off","true"],["isAdb","false"],["adBlockEnabled","false"],["puShown","true"],["ads_b_test","true"],["showAds","true"],["attr","{}"],["scriptSrc",""],["cxStartDetectionProcess","noopFunc"],["isAdBlocked","false"],["adblock","noopFunc"],["path",""],["_ctrl_vt.blocked.ad_script","false"],["blockAdBlock","noopFunc"],["caca","noopFunc"],["Ok","true"],["safelink.adblock","false"],["openPopunder","noopFunc"],["ClickUnder","noopFunc"],["flashvars.adv_pre_url",""],["flashvars.protect_block",""],["flashvars.video_click_url",""],["adBlock","false"],["spoof","noopFunc"],["btoa","null"],["sp_ad","true"],["adsBlocked","false"],["_sp_.msg.displayMessage","noopFunc"],["CaptchmeState.adb","undefined"],["indexedDB.open","trueFunc"],["UhasAB","false"],["adNotificationDetected","false"],["atob","noopFunc"],["_pop","noopFunc"],["CnnXt.Event.fire","noopFunc"],["_ti_update_user","noopFunc"],["valid","1"],["vastAds","[]"],["adblock","1"],["frg","1"],["time","0"],["ads","true"],["GNCA_Ad_Support","true"],["Date.now","noopFunc"],["jQuery.adblock","1"],["VMG.Components.Adblock","false"],["_n_app.popunder","null"],["N_BetterJsPop.object","{}"],["adblockDetector","trueFunc"],["hasPoped","true"],["flashvars.video_click_url","undefined"],["flashvars.adv_start_html",""],["flashvars.popunder_url",""],["flashvars.adv_post_src",""],["flashvars.adv_post_url",""],["jQuery.adblock","false"],["google_jobrunner","true"],["sec","0"],["gadb","false"],["checkadBlock","noopFunc"],["clientSide.adbDetect","noopFunc"],["HTMLAnchorElement.prototype.click","noopFunc"],["cmnnrunads","true"],["adBlocker","false"],["adBlockDetected","noopFunc"],["StileApp.somecontrols.adBlockDetected","noopFunc"],["MDCore.adblock","0"],["google_tag_data","noopFunc"],["noAdBlock","true"],["adsOk","true"],["check","true"],["isal","true"],["document.hidden","true"],["awm","true"],["adblockEnabled","false"],["is_adblocked","false"],["ABLK","false"],["pogo.intermission.staticAdIntermissionPeriod","0"],["SubmitDownload1","noopFunc"],["t","0"],["ckaduMobilePop","noopFunc"],["tieneAdblock","0"],["adsAreBlocked","false"],["cmgpbjs","false"],["displayAdblockOverlay","false"],["google","false"],["Math.pow","noopFunc"],["openInNewTab","noopFunc"],["runAdBlocker","false"],["Adblock","false"],["flashvars.logo_url",""],["flashvars.logo_text",""],["nlf.custom.userCapabilities","false"],["count","0"],["LoadThisScript","true"],["showPremLite","true"],["closeBlockerModal","false"],["adBlockDetector.isEnabled","falseFunc"],["areAdsDisplayed","true"],["gkAdsWerbung","true"],["document.bridCanRunAds","true"],["pop_target","null"],["is_banner","true"],["$easyadvtblock","false"],["show_dfp_preroll","false"],["show_youtube_preroll","false"],["doads","true"],["jsUnda","noopFunc"],["AlobaidiDetectAdBlock","true"],["Advertisement","1"],["adBlockDetected","false"],["abp1","1"],["pr_okvalida","true"],["$.ajax","trueFunc"],["cnbc.canShowAds","true"],["ue_adb_chk","1"],["firefaucet","true"],["cRAds","true"],["uas","[]"],["flashvars.popunder_url","undefined"],["adv","true"],["prerollMain","undefined"],["canRunAds","true"],["Fingerprint2","true"],["dclm_ajax_var.disclaimer_redirect_url",""],["load_pop_power","noopFunc"],["adBlockDetected","true"],["Time_Start","0"],["blockAdBlock","trueFunc"],["ezstandalone.enabled","true"],["foundation.adPlayer.bitmovin","{}"],["DL8_GLOBALS.enableAdSupport","false"],["DL8_GLOBALS.useHomad","false"],["DL8_GLOBALS.enableHomadDesktop","false"],["DL8_GLOBALS.enableHomadMobile","false"],["Object.prototype.adReinsertion","noopFunc"],["getHomadConfig","noopFunc"],["ab","false"],["go_popup","{}"],["noBlocker","true"],["adsbygoogle","null"],["fabActive","false"],["gWkbAdVert","true"],["noblock","true"],["wgAffiliateEnabled","false"],["ads","null"],["detectAdblock","noopFunc"],["adsLoadable","true"],["ASSetCookieAds","null"],["letShowAds","true"],["ulp_noadb","true"],["Object.prototype.adblock_detected","false"],["timeSec","0"],["adsbygoogle.loaded","true"],["ads_unblocked","true"],["xxSetting.adBlockerDetection","false"],["open","undefined"],["Drupal.behaviors.adBlockerPopup","null"],["fake_ad","true"],["koddostu_com_adblock_yok","null"],["adsbygoogle","trueFunc"],["player.ads.cuePoints","undefined"],["adBlockDetected","null"],["better_ads_adblock","1"],["Adv_ab","false"],["sgpbCanRunAds","true"],["document.hidden","false"],["document.hasFocus","trueFunc"],["hasFocus","trueFunc"],["navigator.brave","undefined"],["Object.prototype.isAllAdClose","true"],["isRequestPresent","true"],["fouty","true"],["Notification","undefined"],["protection","noopFunc"],["private","false"],["navigator.webkitTemporaryStorage.queryUsageAndQuota","noopFunc"],["document.onkeydown","noopFunc"],["showadas","true"],["alert","throwFunc"],["iktimer","0"],["aSl.gcd","0"],["window.adLink","null"],["detectedAdblock","undefined"],["isTabActive","true"],["clicked","2"],["ov.advertising.tisoomi.loadScript","noopFunc"],["abp","false"],["hommy","{}"],["hommy.waitUntil","noopFunc"],["flashvars.mlogo",""],["vpPrerollVideo","undefined"],["PlayerConfig.config.CustomAdSetting","[]"],["PlayerConfig.trusted","true"],["PlayerConfig.config.AffiliateAdViewLevel","3"],["hold_click","false"],["admiral","noopFunc"],["gnt.u.adfree","true"],["__INITIAL_DATA__.siteData.admiralScript"],["objAd.loadAdShield","noopFunc"],["window.myAd.runAd","noopFunc"],["__INITIAL_STATE__.config.theme.ads.isAdBlockerEnabled","false"],["__INITIAL_STATE__.gameLists.gamesNoPrerollIds.indexOf","trueFunc"],["document.ontouchend","null"],["document.onclick","null"],["pubAdsService","trueFunc"],["config.pauseInspect","false"],["appContext.adManager.context.current.adFriendly","false"],["blockAdBlock._options.baitClass","null"],["document.blocked_var","1"],["____ads_js_blocked","false"],["wIsAdBlocked","false"],["WebSite.plsDisableAdBlock","null"],["ads_blocked","false"],["samDetected","false"],["countClicks","0"],["settings.adBlockerDetection","false"],["mixpanel.get_distinct_id","true"],["fuckAdBlock._options.baitClass","null"],["bscheck.adblocker","noopFunc"],["qpcheck.ads","noopFunc"],["isContentBlocked","falseFunc"],["CloudflareApps.installs.Ik7rmQ4t95Qk.options.measureDomain","undefined"],["detectAB1","noopFunc"],["uBlockOriginDetected","false"],["googletag._vars_","{}"],["googletag._loadStarted_","true"],["googletag._loaded_","true"],["google_unique_id","1"],["google.javascript","{}"],["google.javascript.ads","{}"],["google_global_correlator","1"],["paywallGateway.truncateContent","noopFunc"],["adBlockDisabled","true"],["blockedElement","noopFunc"],["popit","false"],["adBlockerDetected","false"],["abu","falseFunc"],["countdown","0"],["decodeURI","noopFunc"],["flashvars.adv_postpause_vast",""],["univresalP","noopFunc"],["xv_ad_block","0"],["openWindow","noopFunc"],["vidorev_jav_plugin_video_ads_object.vid_ads_m_video_ads",""],["adsProvider.init","noopFunc"],["SDKLoaded","true"],["blockAdBlock._creatBait","null"],["POPUNDER_ENABLED","false"],["plugins.preroll","noopFunc"],["errcode","0"],["DHAntiAdBlocker","true"],["showada","true"],["showax","true"],["p18","undefined"],["ADBLOCKED","false"],["Object.prototype.adsEnabled","false"],["adb","0"],["String.fromCharCode","trueFunc"],["adblock_use","false"],["Object.prototype.adblockFound","false"],["nitroAds.loaded","true"],["createCanvas","noopFunc"],["playerAdSettings.adLink",""],["playerAdSettings.waitTime","0"],["xv.sda.pp.init","noopFunc"],["isAdsLoaded","true"],["adblockerAlert","noopFunc"],["Object.prototype.parseXML","noopFunc"],["Object.prototype.blackscreenDuration","1"],["Object.prototype.adPlayerId",""],["adblockDetect","noopFunc"],["style","noopFunc"],["history.pushState","noopFunc"],["google_unique_id","6"],["__NEXT_DATA__.props.pageProps.adsConfig","undefined"],["new_config.timedown","0"],["truex","{}"],["truex.client","noopFunc"],["hiddenProxyDetected","false"],["SteadyWidgetSettings.adblockActive","false"],["proclayer","noopFunc"],["timeleft","0"],["load_ads","trueFunc"],["detectAdBlock","noopFunc"],["starPop","1"],["Object.prototype.ads","noopFunc"],["detectBlockAds","noopFunc"],["ga","trueFunc"],["ad_link",""],["penciBlocksArray","[]"],["App.AdblockDetected","false"],["SF.adblock","true"],["startfrom","0"],["D4zz","noopFunc"],["Object.prototype.ads.nopreroll_","true"],["HP_Scout.adBlocked","false"],["SD_IS_BLOCKING","false"],["Object.prototype.isPremium","true"],["__BACKPLANE_API__.renderOptions.showAdBlock",""],["Object.prototype.isNoAds","{}"],["tv3Cmp.ConsentGiven","true"],["countDownDate","0"],["setupSkin","noopFunc"],["Object.prototype.enableInterstitial","false"],["ads","undefined"],["td_ad_background_click_link","undefined"],["ADBLOCK","false"],["POSTPART_prototype.ADKEY","noopFunc"],["adBlockDetected","falseFunc"],["divWidth","1"],["noAdBlock","noopFunc"],["AdService.info.abd","noopFunc"],["adBlockDetectionResult","undefined"],["popped","true"],["puShown1","true"],["passthetest","true"],["timeset","0"],["pandaAdviewValidate","true"],["canGetAds","true"],["ad_blocker_active","false"],["init_welcome_ad","noopFunc"],["moneyAbovePrivacyByvCDN","true"],["document.body.contains","trueFunc"],["popunder","undefined"],["distance","0"],["document.onclick",""],["adEnable","true"],["displayAds","0"],["_adshrink.skiptime","0"],["AbleToRunAds","true"],["PreRollAd.timeCounter","0"],["abpblocked","undefined"],["app.showModalAd","noopFunc"],["paAddUnit","noopFunc"],["adt","0"],["test_adblock","noopFunc"],["adblockDetector","noopFunc"],["vastEnabled","false"],["detectadsbocker","false"],["two_worker_data_js.js","[]"],["FEATURE_DISABLE_ADOBE_POPUP_BY_COUNTRY","true"],["questpassGuard","noopFunc"],["isAdBlockerEnabled","false"],["sssp","emptyObj"],["smartLoaded","true"],["timeLeft","0"],["Cookiebot","noopFunc"],["feature_flags.interstitial_ads_flag","false"],["feature_flags.interstitials_every_four_slides","false"],["waldoSlotIds","true"],["adblockstatus","false"],["adScriptLoaded","true"],["adblockEnabled","noopFunc"],["adSettings","[]"],["banner_is_blocked","false"],["Object.prototype.adBlocked","false"],["isadb","false"],["chp_adblock_browser","noopFunc"],["googleAd","true"],["Brid.A9.prototype.backfillAdUnits","[]"],["dct","0"],["slideShow.displayInterstitial","true"],["googletag","true"],["tOS2","150"],["checkAdBlocker","noopFunc"],["navigator.standalone","true"],["ShowAdvertising","{}"],["empire.pop","undefined"],["empire.direct","undefined"],["empire.directHideAds","undefined"],["empire.mediaData.advisorMovie","1"],["empire.mediaData.advisorSerie","1"],["setTimer","0"],["penci_adlbock.ad_blocker_detector","0"],["Object.prototype.adblockDetector","noopFunc"],["blext","true"],["vidorev_jav_plugin_video_ads_object","{}"],["vidorev_jav_plugin_video_ads_object_post","{}"],["S_Popup","10"],["rabLimit","-1"],["nudgeAdBlock","noopFunc"],["feedBack.showAffilaePromo","noopFunc"],["FAVE.settings.ads.ssai.prod.clips.enabled","false"],["FAVE.settings.ads.ssai.prod.liveAuth.enabled","false"],["FAVE.settings.ads.ssai.prod.liveUnauth.enabled","false"],["HTMLScriptElement.prototype.onerror","null"],["loadpagecheck","noopFunc"],["art3m1sItemNames.affiliate-wrapper","\"\""],["window.adngin","{}"],["amzn_aps_csm","{}"],["amzn_aps_csm.define","noopFunc"],["isAdBlockerActive","noopFunc"],["di.app.WebplayerApp.Ads.Adblocks.app.AdBlockDetectApp.startWithParent","false"],["sharedController.adblockDetector","noopFunc"],["checkAdsStatus","noopFunc"],["ads","[]"],["settings.adBlockDetectionEnabled","false"],["displayInterstitialAdConfig","false"],["checkAdBlockeraz","noopFunc"],["blockingAds","false"],["Yii2App.playbackTimeout","0"],["QiyiPlayerProphetData.a.data","{}"],["toggleAdBlockInfo","falseFunc"],["aipAPItag.prerollSkipped","true"],["aipAPItag.setPreRollStatus","trueFunc"],["reklam_1_saniye","0"],["reklam_1_gecsaniye","0"],["reklamsayisi","1"],["reklam_1",""],["powerAPITag","emptyObj"],["playerEnhancedConfig.run","throwFunc"],["aoAdBlockDetected","false"],["rodo.checkIsDidomiConsent","noopFunc"],["rodo.waitForConsent","noopPromiseResolve"],["xtime","0"],["Div_popup",""],["Scribd.Blob.AdBlockerModal","noopFunc"],["AddAdsV2I.addBlock","false"],["hasAdBlocker","false"],["initials.yld-pdpopunder",""],["download_click","true"],["advertisement3","true"],["clicked","true"],["eClicked","true"],["number","0"],["sync","true"],["PlayerLogic.prototype.detectADB","noopFunc"],["showPopunder","noopFunc"],["Object.prototype.prerollAds","[]"],["notifyMe","noopFunc"],["adsClasses","undefined"],["gsecs","0"],["dvsize","52"],["majorse","true"],["completed","1"],["testerli","false"],["w87.abd","noopFunc"],["document.referrer",""],["Object.prototype.setNeedShowAdblockWarning","noopFunc"],["NoAdBlock","noopFunc"],["adList","[]"],["ifmax","true"],["nitroAds.abp","true"],["onloadUI","noopFunc"],["PageLoader.DetectAb","0"],["one_time","1"],["consentGiven","true"],["playID","1"],["GEMG.GPT.Interstitial","noopFunc"],["amiblock","0"],["karte3","18"],["sandDetect","noopFunc"],["amodule.data","emptyArr"],["Object.prototype.ADBLOCK_DETECTION",""],["postroll","undefined"],["interstitial","undefined"],["isAdBlockDetected","false"],["pData.adblockOverlayEnabled","0"],["cabdSettings","undefined"],["td_ad_background_click_link"],["malisx","true"],["ADS.isBannersEnabled","false"],["EASYFUN_ADS_CAN_RUN","true"],["adsbygoogle_ama_fc_has_run","true"],["jwDefaults.advertising","{}"],["elimina_profilazione","1"],["elimina_pubblicita","1"],["abd","{}"],["checkerimg","noopFunc"],["detectedAdblock","noopFunc"],["Object.prototype.DetectByGoogleAd","noopFunc"],["nitroAds","{}"],["nitroAds.createAd","noopFunc"],["NativeAd","noopFunc"],["Blob","noopFunc"],["window.navigator.brave","undefined"],["HTMLScriptElement.prototype.onerror","undefined"],["isAdblock","false"],["openPop","noopFunc"],["attachEvent","trueFunc"],["cns.library","true"],["BJSShowUnder","{}"],["BJSShowUnder.bindTo","noopFunc"],["BJSShowUnder.add","noopFunc"],["Object.prototype._parseVAST","noopFunc"],["Object.prototype.createAdBlocker","noopFunc"],["Object.prototype.isAdPeriod","falseFunc"],["countDown","0"],["runCheck","noopFunc"],["adsSlotRenderEndSeen","true"],["showModal","noopFunc"],["flashvars.mlogo_link",""],["isAdBlocked","noopFunc"],["URLlist","[]"],["aaw","{}"],["aaw.processAdsOnPage","noopFunc"],["doOpen","undefined"],["HTMLImageElement.prototype.onerror","undefined"],["FOXIZ_MAIN_SCRIPT.siteAccessDetector","noopFunc"],["openAdBlockPopup","noopFunc"],["Object.prototype._adsDisabled","true"],["advanced_ads_check_adblocker","noopFunc"],["canRunAds","1"],["attestHasAdBlockerActivated","true"],["extInstalled","true"],["SaveFiles.add","noopFunc"],["detectSandbox","noopFunc"],["adbon","0"],["rwt","noopFunc"],["bmak.js_post","false"],["firebase.analytics","noopFunc"],["Object.prototype.updateModifiedCommerceUrl","noopFunc"],["flashvars.event_reporting",""],["Object.prototype.has_opted_out_tracking","trueFunc"],["Visitor","{}"],["send_gravity_event","noopFunc"],["send_recommendation_event","noopFunc"],["libAnalytics.data.get","noopFunc"],["adthrive._components.start","noopFunc"],["navigator.sendBeacon","noopFunc"]];
const hostnamesMap = new Map([["jilliandescribecompany.com",0],["gogoanime.*",[0,195]],["adrianmissionminute.com",0],["alejandrocenturyoil.com",0],["alleneconomicmatter.com",0],["apinchcaseation.com",0],["bethshouldercan.com",0],["bigclatterhomesguideservice.com",0],["bradleyviewdoctor.com",0],["brittneystandardwestern.com",0],["brookethoughi.com",0],["brucevotewithin.com",0],["cindyeyefinal.com",0],["denisegrowthwide.com",0],["diananatureforeign.com",0],["donaldlineelse.com",0],["edwardarriveoften.com",0],["erikcoldperson.com",0],["evelynthankregion.com",0],["graceaddresscommunity.com",0],["heatherdiscussionwhen.com",0],["heatherwholeinvolve.com",0],["housecardsummerbutton.com",0],["jamessoundcost.com",0],["jamesstartstudent.com",0],["jamiesamewalk.com",0],["jasminetesttry.com",0],["jasonresponsemeasure.com",0],["jayservicestuff.com",0],["jennifercertaindevelopment.com",0],["jessicaglassauthor.com",0],["johnalwayssame.com",0],["johntryopen.com",0],["jonathansociallike.com",0],["josephseveralconcern.com",0],["kellywhatcould.com",0],["kennethofficialitem.com",0],["kristiesoundsimply.com",0],["lisatrialidea.com",0],["lorimuchbenefit.com",0],["loriwithinfamily.com",0],["lukecomparetwo.com",0],["mariatheserepublican.com",0],["markstyleall.com",0],["michaelapplysome.com",0],["morganoperationface.com",0],["nathanfromsubject.com",0],["nectareousoverelate.com",0],["paulkitchendark.com",0],["rebeccaneverbase.com",0],["richardsignfish.com",0],["roberteachfinal.com",0],["robertordercharacter.com",0],["robertplacespace.com",0],["ryanagoinvolve.com",0],["sandratableother.com",0],["sandrataxeight.com",0],["seanshowcould.com",0],["sethniceletter.com",0],["shannonpersonalcost.com",0],["sharonwhiledemocratic.com",0],["stevenimaginelittle.com",0],["strawberriesporail.com",0],["susanhavekeep.com",0],["timberwoodanotia.com",0],["tinycat-voe-fashion.com",0],["toddpartneranimal.com",0],["troyyourlead.com",0],["uptodatefinishconference.com",0],["uptodatefinishconferenceroom.com",0],["vincentincludesuccessful.com",0],["voe.sx",0],["maxfinishseveral.com",0],["voe.sx>>",0],["javboys.tv>>",0],["freeplayervideo.com",0],["nazarickol.com",0],["player-cdn.com",0],["playhydrax.com",[0,408,409]],["rabbitstream.net",0],["fmovies.*",0],["u26bekrb.fun",1],["pvpoke-re.com",2],["client.falixnodes.net",[3,4,594,595,596]],["br.de",5],["indeed.com",6],["pasteboard.co",7],["clickhole.com",8],["deadspin.com",8],["gizmodo.com",8],["jalopnik.com",8],["jezebel.com",8],["kotaku.com",8],["lifehacker.com",8],["splinternews.com",8],["theinventory.com",8],["theonion.com",8],["theroot.com",8],["thetakeout.com",8],["pewresearch.org",8],["los40.com",[9,10]],["as.com",10],["telegraph.co.uk",[11,12]],["poweredbycovermore.com",[11,64]],["lumens.com",[11,64]],["verizon.com",13],["humanbenchmark.com",14],["politico.com",15],["officedepot.co.cr",[16,17]],["officedepot.*",[18,19]],["usnews.com",20],["coolmathgames.com",[21,288,289,290]],["video.gazzetta.it",[22,23]],["oggi.it",[22,23]],["manoramamax.com",22],["factable.com",24],["zee5.com",25],["gala.fr",26],["geo.fr",26],["voici.fr",26],["gloucestershirelive.co.uk",27],["arsiv.mackolik.com",28],["jacksonguitars.com",29],["scandichotels.com",30],["stylist.co.uk",31],["nettiauto.com",32],["thaiairways.com",[33,34]],["cerbahealthcare.it",[35,36]],["futura-sciences.com",[35,53]],["toureiffel.paris",35],["campusfrance.org",[35,148]],["tiendaenlinea.claro.com.ni",[37,38]],["tieba.baidu.com",39],["fandom.com",[40,41,349]],["grasshopper.com",[42,43]],["epson.com.cn",[44,45,46,47]],["oe24.at",[48,49]],["szbz.de",48],["platform.autods.com",[50,51]],["kcra.com",52],["wcvb.com",52],["sportdeutschland.tv",52],["wikihow.com",54],["citibank.com.sg",55],["uol.com.br",[56,57,58,59,60]],["gazzetta.gr",61],["digicol.dpm.org.cn",[62,63]],["virginmediatelevision.ie",65],["larazon.es",[66,67]],["waitrosecellar.com",[68,69,70]],["kicker.de",[71,391]],["sharpen-free-design-generator.netlify.app",[72,73]],["help.cashctrl.com",[74,75]],["gry-online.pl",76],["vidaextra.com",77],["commande.rhinov.pro",[78,79]],["ecom.wixapps.net",[78,79]],["tipranks.com",[80,81]],["iceland.co.uk",[82,83,84]],["socket.pearsoned.com",85],["tntdrama.com",[86,87]],["trutv.com",[86,87]],["mobile.de",[88,89]],["ioe.vn",[90,91]],["geiriadur.ac.uk",[90,94]],["welsh-dictionary.ac.uk",[90,94]],["bikeportland.org",[92,93]],["biologianet.com",[57,58,59]],["10play.com.au",[95,96]],["sunshine-live.de",[97,98]],["whatismyip.com",[99,100]],["myfitnesspal.com",101],["netoff.co.jp",[102,103]],["bluerabbitrx.com",[102,103]],["foundit.*",[104,105]],["clickjogos.com.br",106],["bristan.com",[107,108]],["zillow.com",109],["share.hntv.tv",[110,111,112,113]],["forum.dji.com",[110,113]],["unionpayintl.com",[110,112]],["streamelements.com",110],["optimum.net",[114,115]],["hdfcfund.com",116],["user.guancha.cn",[117,118]],["sosovalue.com",119],["bandyforbundet.no",[120,121]],["tatacommunications.com",122],["suamusica.com.br",[123,124,125]],["macrotrends.net",[126,127]],["code.world",128],["smartcharts.net",128],["topgear.com",129],["eservice.directauto.com",[130,131]],["nbcsports.com",132],["standard.co.uk",133],["pruefernavi.de",[134,135]],["speedtest.net",[136,137]],["17track.net",138],["visible.com",139],["hagerty.com",[140,141]],["marketplace.nvidia.com",142],["kino.de",[143,144]],["9now.nine.com.au",145],["worldstar.com",146],["prisjakt.no",147],["developer.arm.com",[149,150]],["sterkinekor.com",151],["iogames.space",152],["m.youtube.com",[153,154,155,156]],["music.youtube.com",[153,154,155,156]],["tv.youtube.com",[153,154,155,156]],["www.youtube.com",[153,154,155,156]],["youtubekids.com",[153,154,155,156]],["youtube-nocookie.com",[153,154,155,156]],["eu-proxy.startpage.com",[153,154,156]],["timesofindia.indiatimes.com",157],["economictimes.indiatimes.com",158],["motherless.com",159],["sueddeutsche.de",160],["watchanimesub.net",161],["wcoanimesub.tv",161],["wcoforever.net",161],["freeviewmovies.com",161],["filehorse.com",161],["guidetnt.com",161],["starmusiq.*",161],["sp-today.com",161],["linkvertise.com",161],["eropaste.net",161],["getpaste.link",161],["sharetext.me",161],["wcofun.*",161],["note.sieuthuthuat.com",161],["elcriticodelatele.com",[161,456]],["gadgets.es",[161,456]],["amateurporn.co",[161,257]],["wiwo.de",162],["primewire.*",163],["streanplay.*",[163,164]],["alphaporno.com",[163,543]],["porngem.com",163],["shortit.pw",[163,241]],["familyporn.tv",163],["sbplay.*",163],["id45.cyou",163],["85tube.com",[163,225]],["milfnut.*",163],["k1nk.co",163],["watchasians.cc",163],["soltoshindo.com",163],["sankakucomplex.com",165],["player.glomex.com",166],["merkur.de",166],["tz.de",166],["sxyprn.*",167],["hqq.*",[168,169]],["waaw.*",[169,170]],["hotpornfile.org",169],["player.tabooporns.com",169],["x69.ovh",169],["wiztube.xyz",169],["younetu.*",169],["multiup.us",169],["peliculas8k.com",[169,170]],["video.q34r.org",169],["czxxx.org",169],["vtplayer.online",169],["vvtplayer.*",169],["netu.ac",169],["netu.frembed.lol",169],["adbull.org",171],["123link.*",171],["adshort.*",171],["mitly.us",171],["linkrex.net",171],["linx.cc",171],["oke.io",171],["linkshorts.*",171],["dz4link.com",171],["adsrt.*",171],["linclik.com",171],["shrt10.com",171],["vinaurl.*",171],["loptelink.com",171],["adfloz.*",171],["cut-fly.com",171],["linkfinal.com",171],["payskip.org",171],["cutpaid.com",171],["linkjust.com",171],["leechpremium.link",171],["icutlink.com",[171,262]],["oncehelp.com",171],["rgl.vn",171],["reqlinks.net",171],["bitlk.com",171],["qlinks.eu",171],["link.3dmili.com",171],["short-fly.com",171],["foxseotools.com",171],["dutchycorp.*",171],["shortearn.*",171],["pingit.*",171],["link.turkdown.com",171],["7r6.com",171],["oko.sh",171],["ckk.ai",171],["fc.lc",171],["fstore.biz",171],["shrink.*",171],["cuts-url.com",171],["eio.io",171],["exe.app",171],["exee.io",171],["exey.io",171],["skincarie.com",171],["exeo.app",171],["tmearn.*",171],["coinlyhub.com",[171,328]],["adsafelink.com",171],["aii.sh",171],["megalink.*",171],["cybertechng.com",[171,343]],["cutdl.xyz",171],["iir.ai",171],["shorteet.com",[171,361]],["miniurl.*",171],["smoner.com",171],["gplinks.*",171],["odisha-remix.com",[171,343]],["xpshort.com",[171,343]],["upshrink.com",171],["clk.*",171],["easysky.in",171],["veganab.co",171],["go.bloggingaro.com",171],["go.gyanitheme.com",171],["go.theforyou.in",171],["go.hipsonyc.com",171],["birdurls.com",171],["vipurl.in",171],["try2link.com",171],["jameeltips.us",171],["gainl.ink",171],["promo-visits.site",171],["satoshi-win.xyz",[171,377]],["shorterall.com",171],["encurtandourl.com",171],["forextrader.site",171],["postazap.com",171],["cety.app",171],["exego.app",[171,372]],["cutlink.net",171],["cutsy.net",171],["cutyurls.com",171],["cutty.app",171],["cutnet.net",171],["jixo.online",171],["tinys.click",[171,343]],["cpm.icu",171],["panyshort.link",171],["enagato.com",171],["pandaznetwork.com",171],["tpi.li",171],["oii.la",171],["recipestutorials.com",171],["pureshort.*",171],["shrinke.*",171],["shrinkme.*",171],["shrinkforearn.in",171],["oii.io",171],["du-link.in",171],["atglinks.com",171],["thotpacks.xyz",171],["megaurl.in",171],["megafly.in",171],["simana.online",171],["fooak.com",171],["joktop.com",171],["evernia.site",171],["falpus.com",171],["link.paid4link.com",171],["exalink.fun",171],["shortxlinks.com",171],["upfion.com",171],["upfiles.app",171],["upfiles-urls.com",171],["flycutlink.com",[171,343]],["linksly.co",171],["link1s.*",171],["pkr.pw",171],["imagenesderopaparaperros.com",171],["shortenbuddy.com",171],["apksvip.com",171],["4cash.me",171],["namaidani.com",171],["shortzzy.*",171],["teknomuda.com",171],["shorttey.*",[171,327]],["miuiku.com",171],["savelink.site",171],["lite-link.*",171],["adcorto.*",171],["samaa-pro.com",171],["miklpro.com",171],["modapk.link",171],["ccurl.net",171],["linkpoi.me",171],["menjelajahi.com",171],["pewgame.com",171],["haonguyen.top",171],["zshort.*",171],["crazyblog.in",171],["cutearn.net",171],["rshrt.com",171],["filezipa.com",171],["dz-linkk.com",171],["upfiles.*",171],["theblissempire.com",171],["finanzas-vida.com",171],["adurly.cc",171],["paid4.link",171],["link.asiaon.top",171],["go.gets4link.com",171],["linkfly.*",171],["beingtek.com",171],["shorturl.unityassets4free.com",171],["disheye.com",171],["techymedies.com",171],["techysuccess.com",171],["za.gl",[171,277]],["bblink.com",171],["myad.biz",171],["swzz.xyz",171],["vevioz.com",171],["charexempire.com",171],["clk.asia",171],["linka.click",171],["sturls.com",171],["myshrinker.com",171],["snowurl.com",[171,343]],["netfile.cc",171],["wplink.*",171],["rocklink.in",171],["techgeek.digital",171],["download3s.net",171],["shortx.net",171],["shortawy.com",171],["tlin.me",171],["apprepack.com",171],["up-load.one",171],["zuba.link",171],["bestcash2020.com",171],["hoxiin.com",171],["paylinnk.com",171],["thizissam.in",171],["ier.ai",171],["adslink.pw",171],["novelssites.com",171],["links.medipost.org",171],["faucetcrypto.net",171],["short.freeltc.top",171],["trxking.xyz",171],["weadown.com",171],["m.bloggingguidance.com",171],["blog.onroid.com",171],["link.codevn.net",171],["upfilesurls.com",171],["link4rev.site",171],["c2g.at",171],["bitcosite.com",[171,557]],["cryptosh.pro",171],["link68.net",171],["traffic123.net",171],["windowslite.net",[171,343]],["viewfr.com",171],["cl1ca.com",171],["4br.me",171],["fir3.net",171],["seulink.*",171],["encurtalink.*",171],["kiddyshort.com",171],["watchmygf.me",[172,196]],["camwhores.*",[172,182,224,225,226]],["camwhorez.tv",[172,182,224,225]],["cambay.tv",[172,204,224,254,256,257,258,259]],["fpo.xxx",[172,204]],["sexemix.com",172],["heavyfetish.com",[172,718]],["thotcity.su",172],["viralxxxporn.com",[172,395]],["tube8.*",[173,174]],["you-porn.com",174],["youporn.*",174],["youporngay.com",174],["youpornru.com",174],["redtube.*",174],["9908ww.com",174],["adelaidepawnbroker.com",174],["bztube.com",174],["hotovs.com",174],["insuredhome.org",174],["nudegista.com",174],["pornluck.com",174],["vidd.se",174],["pornhub.*",[174,316]],["pornhub.com",174],["pornerbros.com",175],["freep.com",175],["porn.com",176],["tune.pk",177],["noticias.gospelmais.com.br",178],["techperiod.com",178],["viki.com",[179,180]],["watch-series.*",181],["watchseries.*",181],["vev.*",181],["vidop.*",181],["vidup.*",181],["sleazyneasy.com",[182,183,184]],["smutr.com",[182,324]],["tktube.com",182],["yourporngod.com",[182,183]],["javbangers.com",[182,445]],["camfox.com",182],["camthots.tv",[182,254]],["shegotass.info",182],["amateur8.com",182],["bigtitslust.com",182],["ebony8.com",182],["freeporn8.com",182],["lesbian8.com",182],["maturetubehere.com",182],["sortporn.com",182],["motherporno.com",[182,183,204,256]],["theporngod.com",[182,183]],["watchdirty.to",[182,225,226,257]],["pornsocket.com",185],["luxuretv.com",186],["porndig.com",[187,188]],["webcheats.com.br",189],["ceesty.com",[190,191]],["gestyy.com",[190,191]],["corneey.com",191],["destyy.com",191],["festyy.com",191],["sh.st",191],["mitaku.net",191],["angrybirdsnest.com",192],["zrozz.com",192],["clix4btc.com",192],["4tests.com",192],["goltelevision.com",192],["news-und-nachrichten.de",192],["laradiobbs.net",192],["urlaubspartner.net",192],["produktion.de",192],["cinemaxxl.de",192],["bladesalvador.com",192],["tempr.email",192],["cshort.org",192],["friendproject.net",192],["covrhub.com",192],["katfile.com",[192,626]],["trust.zone",192],["business-standard.com",192],["planetsuzy.org",193],["empflix.com",194],["1movies.*",[195,201]],["xmovies8.*",195],["masteranime.tv",195],["0123movies.*",195],["gostream.*",195],["gomovies.*",195],["transparentcalifornia.com",196],["deepbrid.com",197],["webnovel.com",198],["streamwish.*",[199,200]],["oneupload.to",200],["wishfast.top",200],["rubystm.com",200],["rubyvid.com",200],["rubyvidhub.com",200],["stmruby.com",200],["streamruby.com",200],["schwaebische.de",202],["8tracks.com",203],["3movs.com",204],["bravoerotica.net",[204,256]],["youx.xxx",204],["camclips.tv",[204,324]],["xtits.*",[204,256]],["camflow.tv",[204,256,257,296,395]],["camhoes.tv",[204,254,256,257,296,395]],["xmegadrive.com",204],["xxxymovies.com",204],["xxxshake.com",204],["gayck.com",204],["xhand.com",[204,256]],["analdin.com",[204,256]],["revealname.com",205],["pouvideo.*",206],["povvideo.*",206],["povw1deo.*",206],["povwideo.*",206],["powv1deo.*",206],["powvibeo.*",206],["powvideo.*",206],["powvldeo.*",206],["golfchannel.com",207],["stream.nbcsports.com",207],["mathdf.com",207],["gamcore.com",208],["porcore.com",208],["porngames.tv",208],["69games.xxx",208],["javmix.app",208],["tecknity.com",209],["haaretz.co.il",210],["haaretz.com",210],["hungama.com",210],["a-o.ninja",210],["anime-odcinki.pl",210],["shortgoo.blogspot.com",210],["tonanmedia.my.id",[210,578]],["yurasu.xyz",210],["isekaipalace.com",210],["plyjam.*",[211,212]],["ennovelas.com",[212,216]],["foxsports.com.au",213],["canberratimes.com.au",213],["thesimsresource.com",214],["fxporn69.*",215],["vipbox.*",216],["viprow.*",216],["ctrl.blog",217],["sportlife.es",218],["finofilipino.org",219],["desbloqueador.*",220],["xberuang.*",221],["teknorizen.*",221],["mysflink.blogspot.com",221],["ashemaletube.*",222],["paktech2.com",222],["assia.tv",223],["assia4.com",223],["assia24.com",223],["cwtvembeds.com",[225,255]],["camlovers.tv",225],["porntn.com",225],["pornissimo.org",225],["sexcams-24.com",[225,257]],["watchporn.to",[225,257]],["camwhorez.video",225],["footstockings.com",[225,226,257]],["xmateur.com",[225,226,257]],["multi.xxx",226],["worldofbitco.in",[227,228]],["weatherx.co.in",[227,228]],["sunbtc.space",227],["subtorrents.*",229],["subtorrents1.*",229],["newpelis.*",229],["pelix.*",229],["allcalidad.*",229],["infomaniakos.*",229],["ojogos.com.br",230],["powforums.com",231],["supforums.com",231],["studybullet.com",231],["usgamer.net",232],["recordonline.com",232],["freebitcoin.win",233],["e-monsite.com",233],["coindice.win",233],["temp-mails.com",234],["freiepresse.de",235],["investing.com",236],["tornadomovies.*",237],["mp3fiber.com",238],["chicoer.com",239],["dailybreeze.com",239],["dailybulletin.com",239],["dailynews.com",239],["delcotimes.com",239],["eastbaytimes.com",239],["macombdaily.com",239],["ocregister.com",239],["pasadenastarnews.com",239],["pe.com",239],["presstelegram.com",239],["redlandsdailyfacts.com",239],["reviewjournal.com",239],["santacruzsentinel.com",239],["saratogian.com",239],["sentinelandenterprise.com",239],["sgvtribune.com",239],["tampabay.com",239],["times-standard.com",239],["theoaklandpress.com",239],["trentonian.com",239],["twincities.com",239],["whittierdailynews.com",239],["bostonherald.com",239],["dailycamera.com",239],["sbsun.com",239],["dailydemocrat.com",239],["montereyherald.com",239],["orovillemr.com",239],["record-bee.com",239],["redbluffdailynews.com",239],["reporterherald.com",239],["thereporter.com",239],["timescall.com",239],["timesheraldonline.com",239],["ukiahdailyjournal.com",239],["dailylocal.com",239],["mercurynews.com",239],["suedkurier.de",240],["anysex.com",242],["icdrama.*",243],["mangasail.*",243],["pornve.com",244],["file4go.*",245],["coolrom.com.au",245],["marie-claire.es",246],["gamezhero.com",246],["flashgirlgames.com",246],["onlinesudoku.games",246],["mpg.football",246],["sssam.com",246],["globalnews.ca",247],["drinksmixer.com",248],["leitesculinaria.com",248],["fupa.net",249],["browardpalmbeach.com",250],["dallasobserver.com",250],["houstonpress.com",250],["miaminewtimes.com",250],["phoenixnewtimes.com",250],["westword.com",250],["nhentai.net",[251,252]],["nowtv.com.tr",253],["caminspector.net",254],["camwhoreshd.com",254],["camgoddess.tv",254],["gay4porn.com",256],["mypornhere.com",256],["mangovideo.*",257],["love4porn.com",257],["thotvids.com",257],["watchmdh.to",257],["celebwhore.com",257],["cluset.com",257],["sexlist.tv",257],["4kporn.xxx",257],["xhomealone.com",257],["lusttaboo.com",[257,519]],["hentai-moon.com",257],["camhub.cc",[257,684]],["mediapason.it",260],["linkspaid.com",260],["tuotromedico.com",260],["neoteo.com",260],["phoneswiki.com",260],["celebmix.com",260],["myneobuxportal.com",260],["oyungibi.com",260],["25yearslatersite.com",260],["jeshoots.com",261],["techhx.com",261],["karanapk.com",261],["flashplayer.fullstacks.net",263],["cloudapps.herokuapp.com",263],["youfiles.herokuapp.com",263],["texteditor.nsspot.net",263],["temp-mail.org",264],["asianclub.*",265],["javhdporn.net",265],["vidmoly.to",266],["comnuan.com",267],["veedi.com",268],["battleboats.io",268],["anitube.*",269],["fruitlab.com",269],["acetack.com",269],["androidquest.com",269],["apklox.com",269],["chhaprawap.in",269],["gujarativyakaran.com",269],["kashmirstudentsinformation.in",269],["kisantime.com",269],["shetkaritoday.in",269],["pastescript.com",269],["trimorspacks.com",269],["updrop.link",269],["haddoz.net",269],["streamingcommunity.*",269],["garoetpos.com",269],["stiletv.it",270],["mixdrop.*",271],["hqtv.biz",272],["liveuamap.com",273],["muvibg.com",273],["audycje.tokfm.pl",274],["shush.se",275],["allkpop.com",276],["empire-anime.*",[277,573,574,575,576,577]],["empire-streaming.*",[277,573,574,575]],["empire-anime.com",[277,573,574,575]],["empire-streamz.fr",[277,573,574,575]],["empire-stream.*",[277,573,574,575]],["pickcrackpasswords.blogspot.com",278],["kfrfansub.com",279],["thuglink.com",279],["voipreview.org",279],["illicoporno.com",280],["lavoixdux.com",280],["tonpornodujour.com",280],["jacquieetmichel.net",280],["swame.com",280],["vosfemmes.com",280],["voyeurfrance.net",280],["jacquieetmicheltv.net",[280,633,634]],["hanime.tv",281],["pogo.com",282],["cloudvideo.tv",283],["legionjuegos.org",284],["legionpeliculas.org",284],["legionprogramas.org",284],["16honeys.com",285],["elespanol.com",286],["remodelista.com",287],["audiofanzine.com",291],["uploadev.*",292],["developerinsider.co",293],["thehindu.com",294],["cambro.tv",[295,296]],["boobsradar.com",[296,395,697]],["nibelungen-kurier.de",297],["adfoc.us",298],["tea-coffee.net",298],["spatsify.com",298],["newedutopics.com",298],["getviralreach.in",298],["edukaroo.com",298],["funkeypagali.com",298],["careersides.com",298],["nayisahara.com",298],["wikifilmia.com",298],["infinityskull.com",298],["viewmyknowledge.com",298],["iisfvirtual.in",298],["starxinvestor.com",298],["jkssbalerts.com",298],["sahlmarketing.net",298],["filmypoints.in",298],["fitnessholic.net",298],["moderngyan.com",298],["sattakingcharts.in",298],["freshbhojpuri.com",298],["bankshiksha.in",298],["earn.mpscstudyhub.com",298],["earn.quotesopia.com",298],["money.quotesopia.com",298],["best-mobilegames.com",298],["learn.moderngyan.com",298],["bharatsarkarijobalert.com",298],["quotesopia.com",298],["creditsgoal.com",298],["bgmi32bitapk.in",298],["techacode.com",298],["trickms.com",298],["ielts-isa.edu.vn",298],["loan.punjabworks.com",298],["rokni.xyz",298],["keedabankingnews.com",298],["sptfy.be",298],["mcafee-com.com",[298,372]],["pianetamountainbike.it",299],["barchart.com",300],["modelisme.com",301],["parasportontario.ca",301],["prescottenews.com",301],["nrj-play.fr",302],["hackingwithreact.com",303],["gutekueche.at",304],["eplfootballmatch.com",305],["ancient-origins.*",305],["peekvids.com",306],["playvids.com",306],["pornflip.com",306],["redensarten-index.de",307],["vw-page.com",308],["viz.com",[309,310]],["0rechner.de",311],["configspc.com",312],["xopenload.me",312],["uptobox.com",312],["uptostream.com",312],["japgay.com",313],["mega-debrid.eu",314],["dreamdth.com",315],["diaridegirona.cat",317],["diariodeibiza.es",317],["diariodemallorca.es",317],["diarioinformacion.com",317],["eldia.es",317],["emporda.info",317],["farodevigo.es",317],["laopinioncoruna.es",317],["laopiniondemalaga.es",317],["laopiniondemurcia.es",317],["laopiniondezamora.es",317],["laprovincia.es",317],["levante-emv.com",317],["mallorcazeitung.es",317],["regio7.cat",317],["superdeporte.es",317],["playpaste.com",318],["cnbc.com",319],["primevideo.com",320],["read.amazon.*",[320,708]],["firefaucet.win",321],["74k.io",[322,323]],["fullhdxxx.com",325],["pornclassic.tube",326],["tubepornclassic.com",326],["etonline.com",327],["creatur.io",327],["lookcam.*",327],["drphil.com",327],["urbanmilwaukee.com",327],["lootlinks.*",327],["ontiva.com",327],["hideandseek.world",327],["myabandonware.com",327],["kendam.com",327],["wttw.com",327],["synonyms.com",327],["definitions.net",327],["hostmath.com",327],["camvideoshub.com",327],["minhaconexao.com.br",327],["home-made-videos.com",329],["amateur-couples.com",329],["slutdump.com",329],["dpstream.*",330],["produsat.com",331],["bluemediafiles.*",332],["12thman.com",333],["acusports.com",333],["atlantic10.com",333],["auburntigers.com",333],["baylorbears.com",333],["bceagles.com",333],["bgsufalcons.com",333],["big12sports.com",333],["bigten.org",333],["bradleybraves.com",333],["butlersports.com",333],["cmumavericks.com",333],["conferenceusa.com",333],["cyclones.com",333],["dartmouthsports.com",333],["daytonflyers.com",333],["dbupatriots.com",333],["dbusports.com",333],["denverpioneers.com",333],["fduknights.com",333],["fgcuathletics.com",333],["fightinghawks.com",333],["fightingillini.com",333],["floridagators.com",333],["friars.com",333],["friscofighters.com",333],["gamecocksonline.com",333],["goarmywestpoint.com",333],["gobison.com",333],["goblueraiders.com",333],["gobobcats.com",333],["gocards.com",333],["gocreighton.com",333],["godeacs.com",333],["goexplorers.com",333],["goetbutigers.com",333],["gofrogs.com",333],["gogriffs.com",333],["gogriz.com",333],["golobos.com",333],["gomarquette.com",333],["gopack.com",333],["gophersports.com",333],["goprincetontigers.com",333],["gopsusports.com",333],["goracers.com",333],["goshockers.com",333],["goterriers.com",333],["gotigersgo.com",333],["gousfbulls.com",333],["govandals.com",333],["gowyo.com",333],["goxavier.com",333],["gozags.com",333],["gozips.com",333],["griffinathletics.com",333],["guhoyas.com",333],["gwusports.com",333],["hailstate.com",333],["hamptonpirates.com",333],["hawaiiathletics.com",333],["hokiesports.com",333],["huskers.com",333],["icgaels.com",333],["iuhoosiers.com",333],["jsugamecocksports.com",333],["longbeachstate.com",333],["loyolaramblers.com",333],["lrtrojans.com",333],["lsusports.net",333],["morrisvillemustangs.com",333],["msuspartans.com",333],["muleriderathletics.com",333],["mutigers.com",333],["navysports.com",333],["nevadawolfpack.com",333],["niuhuskies.com",333],["nkunorse.com",333],["nuhuskies.com",333],["nusports.com",333],["okstate.com",333],["olemisssports.com",333],["omavs.com",333],["ovcsports.com",333],["owlsports.com",333],["purduesports.com",333],["redstormsports.com",333],["richmondspiders.com",333],["sfajacks.com",333],["shupirates.com",333],["siusalukis.com",333],["smcgaels.com",333],["smumustangs.com",333],["soconsports.com",333],["soonersports.com",333],["themw.com",333],["tulsahurricane.com",333],["txst.com",333],["txstatebobcats.com",333],["ubbulls.com",333],["ucfknights.com",333],["ucirvinesports.com",333],["uconnhuskies.com",333],["uhcougars.com",333],["uicflames.com",333],["umterps.com",333],["uncwsports.com",333],["unipanthers.com",333],["unlvrebels.com",333],["uoflsports.com",333],["usdtoreros.com",333],["utahstateaggies.com",333],["utepathletics.com",333],["utrockets.com",333],["uvmathletics.com",333],["uwbadgers.com",333],["villanova.com",333],["wkusports.com",333],["wmubroncos.com",333],["woffordterriers.com",333],["1pack1goal.com",333],["bcuathletics.com",333],["bubraves.com",333],["goblackbears.com",333],["golightsgo.com",333],["gomcpanthers.com",333],["goutsa.com",333],["mercerbears.com",333],["pirateblue.com",333],["pirateblue.net",333],["pirateblue.org",333],["quinnipiacbobcats.com",333],["towsontigers.com",333],["tribeathletics.com",333],["tribeclub.com",333],["utepminermaniacs.com",333],["utepminers.com",333],["wkutickets.com",333],["aopathletics.org",333],["atlantichockeyonline.com",333],["bigsouthnetwork.com",333],["bigsouthsports.com",333],["chawomenshockey.com",333],["dbupatriots.org",333],["drakerelays.org",333],["ecac.org",333],["ecacsports.com",333],["emueagles.com",333],["emugameday.com",333],["gculopes.com",333],["godrakebulldog.com",333],["godrakebulldogs.com",333],["godrakebulldogs.net",333],["goeags.com",333],["goislander.com",333],["goislanders.com",333],["gojacks.com",333],["gomacsports.com",333],["gseagles.com",333],["hubison.com",333],["iowaconference.com",333],["ksuowls.com",333],["lonestarconference.org",333],["mascac.org",333],["midwestconference.org",333],["mountaineast.org",333],["niu-pack.com",333],["nulakers.ca",333],["oswegolakers.com",333],["ovcdigitalnetwork.com",333],["pacersports.com",333],["rmacsports.org",333],["rollrivers.com",333],["samfordsports.com",333],["uncpbraves.com",333],["usfdons.com",333],["wiacsports.com",333],["alaskananooks.com",333],["broncathleticfund.com",333],["cameronaggies.com",333],["columbiacougars.com",333],["etownbluejays.com",333],["gobadgers.ca",333],["golancers.ca",333],["gometrostate.com",333],["gothunderbirds.ca",333],["kentstatesports.com",333],["lehighsports.com",333],["lopers.com",333],["lycoathletics.com",333],["lycomingathletics.com",333],["maraudersports.com",333],["mauiinvitational.com",333],["msumavericks.com",333],["nauathletics.com",333],["nueagles.com",333],["nwusports.com",333],["oceanbreezenyc.org",333],["patriotathleticfund.com",333],["pittband.com",333],["principiaathletics.com",333],["roadrunnersathletics.com",333],["sidearmsocial.com",333],["snhupenmen.com",333],["stablerarena.com",333],["stoutbluedevils.com",333],["uwlathletics.com",333],["yumacs.com",333],["collegefootballplayoff.com",333],["csurams.com",333],["cubuffs.com",333],["gobearcats.com",333],["gohuskies.com",333],["mgoblue.com",333],["osubeavers.com",333],["pittsburghpanthers.com",333],["rolltide.com",333],["texassports.com",333],["thesundevils.com",333],["uclabruins.com",333],["wvuathletics.com",333],["wvusports.com",333],["arizonawildcats.com",333],["calbears.com",333],["cuse.com",333],["georgiadogs.com",333],["goducks.com",333],["goheels.com",333],["gostanford.com",333],["insidekstatesports.com",333],["insidekstatesports.info",333],["insidekstatesports.net",333],["insidekstatesports.org",333],["k-stateathletics.com",333],["k-statefootball.net",333],["k-statefootball.org",333],["k-statesports.com",333],["k-statesports.net",333],["k-statesports.org",333],["k-statewomenshoops.com",333],["k-statewomenshoops.net",333],["k-statewomenshoops.org",333],["kstateathletics.com",333],["kstatefootball.net",333],["kstatefootball.org",333],["kstatesports.com",333],["kstatewomenshoops.com",333],["kstatewomenshoops.net",333],["kstatewomenshoops.org",333],["ksuathletics.com",333],["ksusports.com",333],["scarletknights.com",333],["showdownforrelief.com",333],["syracusecrunch.com",333],["texastech.com",333],["theacc.com",333],["ukathletics.com",333],["usctrojans.com",333],["utahutes.com",333],["utsports.com",333],["wsucougars.com",333],["vidlii.com",[333,358]],["tricksplit.io",333],["fangraphs.com",334],["stern.de",335],["geo.de",335],["brigitte.de",335],["tvspielfilm.de",[336,337,338,339]],["tvtoday.de",[336,337,338,339]],["chip.de",[336,337,338,339]],["focus.de",[336,337,338,339]],["fitforfun.de",[336,337,338,339]],["n-tv.de",340],["player.rtl2.de",341],["planetaminecraft.com",342],["cravesandflames.com",343],["codesnse.com",343],["flyad.vip",343],["lapresse.ca",344],["kolyoom.com",345],["ilovephd.com",345],["negumo.com",346],["games.wkb.jp",[347,348]],["kenshi.fandom.com",350],["hausbau-forum.de",351],["homeairquality.org",351],["faucettronn.click",351],["fake-it.ws",352],["laksa19.github.io",353],["1shortlink.com",354],["u-s-news.com",355],["luscious.net",356],["makemoneywithurl.com",357],["junkyponk.com",357],["healthfirstweb.com",357],["vocalley.com",357],["yogablogfit.com",357],["howifx.com",[357,542]],["en.financerites.com",357],["mythvista.com",357],["livenewsflix.com",357],["cureclues.com",357],["apekite.com",357],["enit.in",357],["iammagnus.com",358],["dailyvideoreports.net",358],["unityassets4free.com",358],["docer.*",359],["resetoff.pl",359],["sexodi.com",359],["cdn77.org",360],["3sexporn.com",361],["momxxxsex.com",361],["myfreevintageporn.com",361],["penisbuyutucum.net",361],["ujszo.com",362],["newsmax.com",363],["nadidetarifler.com",364],["siz.tv",364],["suzylu.co.uk",[365,366]],["onworks.net",367],["yabiladi.com",367],["downloadsoft.net",368],["newsobserver.com",369],["arkadiumhosted.com",369],["testlanguages.com",370],["newsinlevels.com",370],["videosinlevels.com",370],["bookmystrip.com",371],["sabkiyojana.com",371],["starkroboticsfrc.com",372],["sinonimos.de",372],["antonimos.de",372],["quesignifi.ca",372],["tiktokrealtime.com",372],["tiktokcounter.net",372],["tpayr.xyz",372],["poqzn.xyz",372],["ashrfd.xyz",372],["rezsx.xyz",372],["tryzt.xyz",372],["ashrff.xyz",372],["rezst.xyz",372],["dawenet.com",372],["erzar.xyz",372],["waezm.xyz",372],["waezg.xyz",372],["blackwoodacademy.org",372],["cryptednews.space",372],["vivuq.com",372],["swgop.com",372],["vbnmll.com",372],["telcoinfo.online",372],["dshytb.com",372],["btcbitco.in",[372,376]],["btcsatoshi.net",372],["cempakajaya.com",372],["crypto4yu.com",372],["readbitcoin.org",372],["wiour.com",372],["finish.addurl.biz",372],["aiimgvlog.fun",[372,379]],["laweducationinfo.com",372],["savemoneyinfo.com",372],["worldaffairinfo.com",372],["godstoryinfo.com",372],["successstoryinfo.com",372],["cxissuegk.com",372],["learnmarketinfo.com",372],["bhugolinfo.com",372],["armypowerinfo.com",372],["rsadnetworkinfo.com",372],["rsinsuranceinfo.com",372],["rsfinanceinfo.com",372],["rsgamer.app",372],["rssoftwareinfo.com",372],["rshostinginfo.com",372],["rseducationinfo.com",372],["phonereviewinfo.com",372],["makeincomeinfo.com",372],["gknutshell.com",372],["vichitrainfo.com",372],["workproductivityinfo.com",372],["dopomininfo.com",372],["hostingdetailer.com",372],["fitnesssguide.com",372],["tradingfact4u.com",372],["cryptofactss.com",372],["softwaredetail.com",372],["artoffocas.com",372],["insurancesfact.com",372],["travellingdetail.com",372],["advertisingexcel.com",372],["allcryptoz.net",372],["batmanfactor.com",372],["beautifulfashionnailart.com",372],["crewbase.net",372],["documentaryplanet.xyz",372],["crewus.net",372],["gametechreviewer.com",372],["midebalonu.net",372],["misterio.ro",372],["phineypet.com",372],["seory.xyz",372],["shinbhu.net",372],["shinchu.net",372],["substitutefor.com",372],["talkforfitness.com",372],["thefitbrit.co.uk",372],["thumb8.net",372],["thumb9.net",372],["topcryptoz.net",372],["uniqueten.net",372],["ultraten.net",372],["exactpay.online",372],["quins.us",372],["kiddyearner.com",372],["imagereviser.com",373],["tech.pubghighdamage.com",374],["tech.techkhulasha.com",374],["hipsonyc.com",374],["jiocinema.com",374],["rapid-cloud.co",374],["uploadmall.com",374],["4funbox.com",375],["nephobox.com",375],["1024tera.com",375],["terabox.*",375],["blog.cryptowidgets.net",376],["blog.insurancegold.in",376],["blog.wiki-topia.com",376],["blog.coinsvalue.net",376],["blog.cookinguide.net",376],["blog.freeoseocheck.com",376],["blog24.me",376],["bildirim.*",378],["arahdrive.com",379],["appsbull.com",380],["diudemy.com",380],["maqal360.com",[380,381,382]],["lifesurance.info",383],["akcartoons.in",384],["cybercityhelp.in",384],["infokeeda.xyz",385],["webzeni.com",385],["dl.apkmoddone.com",386],["phongroblox.com",386],["fuckingfast.net",387],["tickhosting.com",388],["in91vip.win",389],["datavaults.co",390],["t-online.de",392],["upornia.*",[393,394]],["bobs-tube.com",395],["pornohirsch.net",396],["bembed.net",397],["embedv.net",397],["fslinks.org",397],["listeamed.net",397],["v6embed.xyz",397],["vembed.*",397],["vgplayer.xyz",397],["vid-guard.com",397],["vinomo.xyz",397],["nekolink.site",[398,399]],["pixsera.net",400],["pc-builds.com",401],["qtoptens.com",401],["reuters.com",401],["today.com",401],["videogamer.com",401],["wrestlinginc.com",401],["usatoday.com",402],["ydr.com",402],["247sports.com",403],["indiatimes.com",404],["netzwelt.de",405],["arcade.buzzrtv.com",406],["arcade.dailygazette.com",406],["arcade.lemonde.fr",406],["arena.gamesforthebrain.com",406],["bestpuzzlesandgames.com",406],["cointiply.arkadiumarena.com",406],["gamelab.com",406],["games.abqjournal.com",406],["games.amny.com",406],["games.bellinghamherald.com",406],["games.besthealthmag.ca",406],["games.bnd.com",406],["games.boston.com",406],["games.bostonglobe.com",406],["games.bradenton.com",406],["games.centredaily.com",406],["games.charlotteobserver.com",406],["games.cnhinews.com",406],["games.crosswordgiant.com",406],["games.dailymail.co.uk",406],["games.dallasnews.com",406],["games.daytondailynews.com",406],["games.denverpost.com",406],["games.everythingzoomer.com",406],["games.fresnobee.com",406],["games.gameshownetwork.com",406],["games.get.tv",406],["games.greatergood.com",406],["games.heraldonline.com",406],["games.heraldsun.com",406],["games.idahostatesman.com",406],["games.insp.com",406],["games.islandpacket.com",406],["games.journal-news.com",406],["games.kansas.com",406],["games.kansascity.com",406],["games.kentucky.com",406],["games.lancasteronline.com",406],["games.ledger-enquirer.com",406],["games.macon.com",406],["games.mashable.com",406],["games.mercedsunstar.com",406],["games.metro.us",406],["games.metv.com",406],["games.miamiherald.com",406],["games.modbee.com",406],["games.moviestvnetwork.com",406],["games.myrtlebeachonline.com",406],["games.nationalreview.com",406],["games.newsobserver.com",406],["games.parade.com",406],["games.pressdemocrat.com",406],["games.puzzlebaron.com",406],["games.puzzler.com",406],["games.puzzles.ca",406],["games.qns.com",406],["games.readersdigest.ca",406],["games.sacbee.com",406],["games.sanluisobispo.com",406],["games.sixtyandme.com",406],["games.sltrib.com",406],["games.springfieldnewssun.com",406],["games.star-telegram.com",406],["games.startribune.com",406],["games.sunherald.com",406],["games.theadvocate.com",406],["games.thenewstribune.com",406],["games.theolympian.com",406],["games.theportugalnews.com",406],["games.thestar.com",406],["games.thestate.com",406],["games.tri-cityherald.com",406],["games.triviatoday.com",406],["games.usnews.com",406],["games.word.tips",406],["games.wordgenius.com",406],["games.wtop.com",406],["jeux.meteocity.com",406],["juegos.as.com",406],["juegos.elnuevoherald.com",406],["juegos.elpais.com",406],["philly.arkadiumarena.com",406],["play.dictionary.com",406],["puzzles.bestforpuzzles.com",406],["puzzles.centralmaine.com",406],["puzzles.crosswordsolver.org",406],["puzzles.independent.co.uk",406],["puzzles.nola.com",406],["puzzles.pressherald.com",406],["puzzles.standard.co.uk",406],["puzzles.sunjournal.com",406],["arkadium.com",407],["abysscdn.com",[408,409]],["arcai.com",410],["my-code4you.blogspot.com",411],["flickr.com",412],["firefile.cc",413],["pestleanalysis.com",413],["kochamjp.pl",413],["tutorialforlinux.com",413],["whatsaero.com",413],["animeblkom.net",[413,427]],["blkom.com",413],["globes.co.il",[414,415]],["jardiner-malin.fr",416],["tw-calc.net",417],["ohmybrush.com",418],["talkceltic.net",419],["mentalfloss.com",420],["uprafa.com",421],["cube365.net",422],["wwwfotografgotlin.blogspot.com",423],["freelistenonline.com",423],["badassdownloader.com",424],["quickporn.net",425],["yellowbridge.com",426],["aosmark.com",428],["ctrlv.*",429],["atozmath.com",[430,431,432,433,434,435,436]],["newyorker.com",437],["brighteon.com",438],["more.tv",439],["video1tube.com",440],["alohatube.xyz",440],["4players.de",441],["onlinesoccermanager.com",441],["fshost.me",442],["link.cgtips.org",443],["hentaicloud.com",444],["netfapx.com",446],["javdragon.org",446],["javneon.tv",446],["javsaga.ninja",446],["paperzonevn.com",447],["9jarock.org",448],["fzmovies.info",448],["fztvseries.ng",448],["netnaijas.com",448],["hentaienglish.com",449],["hentaiporno.xxx",449],["venge.io",[450,451]],["btcbux.io",452],["its.porn",[453,454]],["atv.at",455],["2ndrun.tv",456],["rackusreads.com",456],["teachmemicro.com",456],["willcycle.com",456],["kusonime.com",[457,458]],["123movieshd.*",459],["imgur.com",[460,461,719]],["hentai-party.com",462],["hentaicomics.pro",462],["uproxy.*",463],["animesa.*",464],["subtitle.one",465],["subtitleone.cc",465],["genshinimpactcalculator.com",466],["mysexgames.com",467],["cinecalidad.*",[468,469]],["xnxx.com",470],["xvideos.*",470],["gdr-online.com",471],["mmm.dk",472],["iqiyi.com",[473,474,607]],["m.iqiyi.com",475],["nbcolympics.com",476],["apkhex.com",477],["indiansexstories2.net",478],["issstories.xyz",478],["1340kbbr.com",479],["gorgeradio.com",479],["kduk.com",479],["kedoam.com",479],["kejoam.com",479],["kelaam.com",479],["khsn1230.com",479],["kjmx.rocks",479],["kloo.com",479],["klooam.com",479],["klykradio.com",479],["kmed.com",479],["kmnt.com",479],["kool991.com",479],["kpnw.com",479],["kppk983.com",479],["krktcountry.com",479],["ktee.com",479],["kwro.com",479],["kxbxfm.com",479],["thevalley.fm",479],["quizlet.com",480],["dsocker1234.blogspot.com",481],["schoolcheats.net",[482,483]],["mgnet.xyz",484],["designtagebuch.de",485],["pixroute.com",486],["uploady.io",487],["calculator-online.net",488],["luckydice.net",489],["adarima.org",489],["weatherwx.com",489],["sattaguess.com",489],["winshell.de",489],["rosasidan.ws",489],["modmakers.xyz",489],["gamepure.in",489],["warrenrahul.in",489],["austiblox.net",489],["upiapi.in",489],["daemonanime.net",489],["networkhint.com",489],["thichcode.net",489],["texturecan.com",489],["tikmate.app",[489,615]],["arcaxbydz.id",489],["quotesshine.com",489],["porngames.club",490],["sexgames.xxx",490],["111.90.159.132",491],["mobile-tracker-free.com",492],["pfps.gg",493],["social-unlock.com",494],["superpsx.com",495],["ninja.io",496],["sourceforge.net",497],["samfirms.com",498],["rapelust.com",499],["vtube.to",499],["desitelugusex.com",499],["dvdplay.*",499],["xvideos-downloader.net",499],["xxxvideotube.net",499],["sdefx.cloud",499],["nozomi.la",499],["moviesonlinefree.net",499],["banned.video",500],["madmaxworld.tv",500],["androidpolice.com",500],["babygaga.com",500],["backyardboss.net",500],["carbuzz.com",500],["cbr.com",500],["collider.com",500],["dualshockers.com",500],["footballfancast.com",500],["footballleagueworld.co.uk",500],["gamerant.com",500],["givemesport.com",500],["hardcoregamer.com",500],["hotcars.com",500],["howtogeek.com",500],["makeuseof.com",500],["moms.com",500],["movieweb.com",500],["pocket-lint.com",500],["pocketnow.com",500],["screenrant.com",500],["simpleflying.com",500],["thegamer.com",500],["therichest.com",500],["thesportster.com",500],["thethings.com",500],["thetravel.com",500],["topspeed.com",500],["xda-developers.com",500],["huffpost.com",501],["ingles.com",502],["spanishdict.com",502],["surfline.com",[503,504]],["play.tv3.ee",505],["play.tv3.lt",505],["play.tv3.lv",[505,506]],["tv3play.skaties.lv",505],["trendyoum.com",507],["bulbagarden.net",508],["hollywoodlife.com",509],["mat6tube.com",510],["hotabis.com",511],["root-nation.com",511],["italpress.com",511],["airsoftmilsimnews.com",511],["artribune.com",511],["textstudio.co",512],["newtumbl.com",513],["apkmaven.*",514],["aruble.net",515],["nevcoins.club",516],["mail.com",517],["gmx.*",518],["mangakita.id",520],["avpgalaxy.net",521],["mhma12.tech",522],["panda-novel.com",523],["zebranovel.com",523],["lightsnovel.com",523],["eaglesnovel.com",523],["pandasnovel.com",523],["ewrc-results.com",524],["kizi.com",525],["cyberscoop.com",526],["fedscoop.com",526],["canale.live",527],["jeep-cj.com",528],["sponsorhunter.com",529],["cloudcomputingtopics.net",530],["likecs.com",531],["tiscali.it",532],["linkspy.cc",533],["adshnk.com",534],["chattanoogan.com",535],["adsy.pw",536],["playstore.pw",536],["windowspro.de",537],["snapinst.app",538],["tvtv.ca",539],["tvtv.us",539],["mydaddy.cc",540],["roadtrippin.fr",541],["vavada5com.com",542],["anyporn.com",[543,560]],["bravoporn.com",543],["bravoteens.com",543],["crocotube.com",543],["hellmoms.com",543],["hellporno.com",543],["sex3.com",543],["tubewolf.com",543],["xbabe.com",543],["xcum.com",543],["zedporn.com",543],["imagetotext.info",544],["infokik.com",545],["freepik.com",546],["ddwloclawek.pl",[547,548]],["www.seznam.cz",549],["deezer.com",550],["my-subs.co",551],["plaion.com",552],["slideshare.net",[553,554]],["ustreasuryyieldcurve.com",555],["businesssoftwarehere.com",556],["goo.st",556],["freevpshere.com",556],["softwaresolutionshere.com",556],["gamereactor.*",558],["madoohd.com",559],["doomovie-hd.*",559],["staige.tv",561],["lvturbo.com",562],["androidadult.com",563],["streamvid.net",564],["watchtv24.com",565],["cellmapper.net",566],["medscape.com",567],["newscon.org",[568,569]],["wheelofgold.com",570],["drakecomic.*",570],["app.blubank.com",571],["mobileweb.bankmellat.ir",571],["chat.nrj.fr",572],["chat.tchatche.com",[572,587]],["ccthesims.com",579],["chromeready.com",579],["coursedrive.org",579],["dtbps3games.com",579],["illustratemagazine.com",579],["uknip.co.uk",579],["vod.pl",580],["megadrive-emulator.com",581],["tvhay.*",[582,583]],["animesaga.in",584],["moviesapi.club",584],["bestx.stream",584],["watchx.top",584],["digimanie.cz",585],["svethardware.cz",585],["srvy.ninja",586],["cnn.com",[588,589,590]],["news.bg",591],["edmdls.com",592],["freshremix.net",592],["scenedl.org",592],["trakt.tv",593],["shroomers.app",597],["classicalradio.com",598],["di.fm",598],["jazzradio.com",598],["radiotunes.com",598],["rockradio.com",598],["zenradio.com",598],["getthit.com",599],["techedubyte.com",600],["soccerinhd.com",600],["movie-th.tv",601],["iwanttfc.com",602],["nutraingredients-asia.com",603],["nutraingredients-latam.com",603],["nutraingredients-usa.com",603],["nutraingredients.com",603],["ozulscansen.com",604],["nexusmods.com",605],["lookmovie.*",606],["lookmovie2.to",606],["biletomat.pl",608],["hextank.io",[609,610]],["filmizlehdfilm.com",[611,612,613,614]],["filmizletv.*",[611,612,613,614]],["fullfilmizle.cc",[611,612,613,614]],["gofilmizle.net",[611,612,613,614]],["btvplus.bg",616],["sagewater.com",617],["redlion.net",617],["filmweb.pl",[618,619]],["satdl.com",620],["vidstreaming.xyz",621],["everand.com",622],["myradioonline.pl",623],["cbs.com",624],["paramountplus.com",624],["fullxh.com",625],["galleryxh.site",625],["megaxh.com",625],["movingxh.world",625],["seexh.com",625],["unlockxh4.com",625],["valuexh.life",625],["xhaccess.com",625],["xhadult2.com",625],["xhadult3.com",625],["xhadult4.com",625],["xhadult5.com",625],["xhamster.*",625],["xhamster1.*",625],["xhamster10.*",625],["xhamster11.*",625],["xhamster12.*",625],["xhamster13.*",625],["xhamster14.*",625],["xhamster15.*",625],["xhamster16.*",625],["xhamster17.*",625],["xhamster18.*",625],["xhamster19.*",625],["xhamster20.*",625],["xhamster2.*",625],["xhamster3.*",625],["xhamster4.*",625],["xhamster42.*",625],["xhamster46.com",625],["xhamster5.*",625],["xhamster7.*",625],["xhamster8.*",625],["xhamsterporno.mx",625],["xhbig.com",625],["xhbranch5.com",625],["xhchannel.com",625],["xhdate.world",625],["xhday.com",625],["xhday1.com",625],["xhlease.world",625],["xhmoon5.com",625],["xhofficial.com",625],["xhopen.com",625],["xhplanet1.com",625],["xhplanet2.com",625],["xhreal2.com",625],["xhreal3.com",625],["xhspot.com",625],["xhtotal.com",625],["xhtree.com",625],["xhvictory.com",625],["xhwebsite.com",625],["xhwebsite2.com",625],["xhwebsite5.com",625],["xhwide1.com",625],["xhwide2.com",625],["xhwide5.com",625],["file-upload.net",627],["acortalo.*",[628,629,630,631]],["acortar.*",[628,629,630,631]],["megadescarga.net",[628,629,630,631]],["megadescargas.net",[628,629,630,631]],["hentaihaven.xxx",632],["jacquieetmicheltv2.net",634],["a2zapk.*",635],["fcportables.com",[636,637]],["emurom.net",638],["freethesaurus.com",[639,640]],["thefreedictionary.com",[639,640]],["oeffentlicher-dienst.info",641],["im9.eu",642],["dcdlplayer8a06f4.xyz",643],["ultimate-guitar.com",644],["claimbits.net",645],["sexyscope.net",646],["kickassanime.*",647],["recherche-ebook.fr",648],["virtualdinerbot.com",648],["zonebourse.com",649],["pink-sluts.net",650],["andhrafriends.com",651],["benzinpreis.de",652],["turtleviplay.xyz",653],["defenseone.com",654],["govexec.com",654],["nextgov.com",654],["route-fifty.com",654],["sharing.wtf",655],["wetter3.de",656],["esportivos.fun",657],["cosmonova-broadcast.tv",658],["hartvannederland.nl",659],["shownieuws.nl",659],["vandaaginside.nl",659],["rock.porn",[660,661]],["videzz.net",[662,663]],["ezaudiobookforsoul.com",664],["club386.com",665],["decompiler.com",666],["littlebigsnake.com",667],["easyfun.gg",668],["smailpro.com",669],["ilgazzettino.it",670],["ilmessaggero.it",670],["3bmeteo.com",[671,672]],["mconverter.eu",673],["lover937.net",674],["10gb.vn",675],["pes6.es",676],["tactics.tools",[677,678]],["boundhub.com",679],["alocdnnetu.xyz",680],["reliabletv.me",681],["jakondo.ru",682],["filecrypt.*",683],["nolive.me",685],["wired.com",686],["spankbang.*",[687,688,689,721,722]],["hulu.com",[690,691,692]],["anonymfile.com",693],["gofile.to",693],["dotycat.com",694],["rateyourmusic.com",695],["reporterpb.com.br",696],["blog-dnz.com",698],["18adultgames.com",699],["colnect.com",[700,701]],["adultgamesworld.com",702],["bgmiupdate.com.in",703],["reviewdiv.com",704],["parametric-architecture.com",705],["laurelberninteriors.com",[706,724]],["voiceofdenton.com",707],["concealednation.org",707],["askattest.com",709],["opensubtitles.com",710],["savefiles.com",711],["streamup.ws",712],["goodstream.one",713],["www.google.*",714],["tacobell.com",715],["zefoy.com",716],["cnet.com",717],["natgeotv.com",720],["globo.com",723],["wayfair.com",725]]);
const exceptionsMap = new Map([["cloudflare.com",[0]],["pingit.com",[171]],["loan.bgmi32bitapk.in",[298]],["lookmovie.studio",[606]]]);
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
