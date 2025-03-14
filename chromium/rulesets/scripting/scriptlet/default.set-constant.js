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

// ruleset: default

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
            if ( targets.hasOwnProperty(prop) === false ) { continue; }
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
        'RegExp': self.RegExp,
        'RegExp_test': self.RegExp.prototype.test,
        'RegExp_exec': self.RegExp.prototype.exec,
        'Request_clone': self.Request.prototype.clone,
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
const argsList = [["ytInitialPlayerResponse.playerAds","undefined"],["ytInitialPlayerResponse.adPlacements","undefined"],["ytInitialPlayerResponse.adSlots","undefined"],["playerResponse.adPlacements","undefined"],["ov.advertising.tisoomi.loadScript","noopFunc"],["abp","false"],["nsShowMaxCount","0"],["objVc.interstitial_web",""],["_ml_ads_ns","null"],["_sp_.config","undefined"],["isAdBlockActive","false"],["AdController","noopFunc"],["check_adblock","true"],["console.clear","noopFunc"],["console.log","noopFunc"],["Object.prototype.hideAds","true"],["Object.prototype._getSalesHouseConfigurations","noopFunc"],["vast_urls","{}"],["sadbl","false"],["adblockcheck","false"],["arrvast","[]"],["blurred","false"],["flashvars.adv_pre_src",""],["showPopunder","false"],["page_params.holiday_promo","true"],["adsEnabled","true"],["hommy","{}"],["hommy.waitUntil","noopFunc"],["String.prototype.charAt","trueFunc"],["ad_blocker","false"],["blockAdBlock","true"],["VikiPlayer.prototype.pingAbFactor","noopFunc"],["player.options.disableAds","true"],["console.clear","trueFunc"],["flashvars.adv_pre_vast",""],["flashvars.adv_pre_vast_alt",""],["x_width","1"],["_site_ads_ns","true"],["luxuretv.config",""],["Object.prototype.AdOverlay","noopFunc"],["tkn_popunder","null"],["can_run_ads","true"],["adsBlockerDetector","noopFunc"],["globalThis","null"],["adblock","false"],["__ads","true"],["FlixPop.isPopGloballyEnabled","falseFunc"],["console.clear","undefined"],["$.magnificPopup.open","noopFunc"],["adsenseadBlock","noopFunc"],["adblockSuspected","false"],["xRds","true"],["cRAds","false"],["String.prototype.charCodeAt","trueFunc"],["disasterpingu","false"],["App.views.adsView.adblock","false"],["flashvars.adv_pause_html",""],["$.fx.off","true"],["isAdb","false"],["adBlockEnabled","false"],["puShown","true"],["ads_b_test","true"],["showAds","true"],["attr","{}"],["scriptSrc",""],["cxStartDetectionProcess","noopFunc"],["isAdBlocked","false"],["adblock","noopFunc"],["path",""],["_ctrl_vt.blocked.ad_script","false"],["blockAdBlock","noopFunc"],["caca","noopFunc"],["Ok","true"],["safelink.adblock","false"],["ClickUnder","noopFunc"],["flashvars.adv_pre_url",""],["flashvars.protect_block",""],["flashvars.video_click_url",""],["adBlock","false"],["spoof","noopFunc"],["btoa","null"],["sp_ad","true"],["adsBlocked","false"],["_sp_.msg.displayMessage","noopFunc"],["CaptchmeState.adb","undefined"],["indexedDB.open","trueFunc"],["UhasAB","false"],["adNotificationDetected","false"],["atob","noopFunc"],["_pop","noopFunc"],["CnnXt.Event.fire","noopFunc"],["_ti_update_user","noopFunc"],["valid","1"],["vastAds","[]"],["adblock","1"],["frg","1"],["time","0"],["vpPrerollVideo","undefined"],["ads","true"],["GNCA_Ad_Support","true"],["Date.now","noopFunc"],["jQuery.adblock","1"],["VMG.Components.Adblock","false"],["_n_app.popunder","null"],["adblockDetector","trueFunc"],["hasPoped","true"],["flashvars.video_click_url","undefined"],["flashvars.adv_start_html",""],["flashvars.popunder_url",""],["flashvars.adv_post_src",""],["flashvars.adv_post_url",""],["jQuery.adblock","false"],["google_jobrunner","true"],["sec","0"],["gadb","false"],["checkadBlock","noopFunc"],["clientSide.adbDetect","noopFunc"],["HTMLAnchorElement.prototype.click","noopFunc"],["cmnnrunads","true"],["adBlocker","false"],["adBlockDetected","noopFunc"],["StileApp.somecontrols.adBlockDetected","noopFunc"],["MDCore.adblock","0"],["google_tag_data","noopFunc"],["noAdBlock","true"],["PlayerConfig.config.CustomAdSetting","[]"],["adsOk","true"],["Object.prototype._parseVAST","noopFunc"],["Object.prototype.createAdBlocker","noopFunc"],["Object.prototype.isAdPeriod","falseFunc"],["check","true"],["isal","true"],["document.hidden","true"],["awm","true"],["adblockEnabled","false"],["is_adblocked","false"],["ABLK","false"],["pogo.intermission.staticAdIntermissionPeriod","0"],["SubmitDownload1","noopFunc"],["t","0"],["ckaduMobilePop","noopFunc"],["tieneAdblock","0"],["adsAreBlocked","false"],["cmgpbjs","false"],["displayAdblockOverlay","false"],["google","false"],["Math.pow","noopFunc"],["openInNewTab","noopFunc"],["loadingAds","true"],["runAdBlocker","false"],["td_ad_background_click_link","undefined"],["Adblock","false"],["flashvars.logo_url",""],["flashvars.logo_text",""],["nlf.custom.userCapabilities","false"],["decodeURIComponent","trueFunc"],["count","0"],["LoadThisScript","true"],["showPremLite","true"],["closeBlockerModal","false"],["adBlockDetector.isEnabled","falseFunc"],["areAdsDisplayed","true"],["gkAdsWerbung","true"],["document.bridCanRunAds","true"],["pop_target","null"],["is_banner","true"],["$easyadvtblock","false"],["show_dfp_preroll","false"],["show_youtube_preroll","false"],["doads","true"],["jsUnda","noopFunc"],["AlobaidiDetectAdBlock","true"],["Advertisement","1"],["adBlockDetected","false"],["abp1","1"],["pr_okvalida","true"],["$.ajax","trueFunc"],["cnbc.canShowAds","true"],["Adv_ab","false"],["chrome","undefined"],["firefaucet","true"],["cRAds","true"],["uas","[]"],["flashvars.popunder_url","undefined"],["adv","true"],["prerollMain","undefined"],["canRunAds","true"],["Fingerprint2","true"],["dclm_ajax_var.disclaimer_redirect_url",""],["load_pop_power","noopFunc"],["adBlockDetected","true"],["Time_Start","0"],["blockAdBlock","trueFunc"],["ezstandalone.enabled","true"],["foundation.adPlayer.bitmovin","{}"],["DL8_GLOBALS.enableAdSupport","false"],["DL8_GLOBALS.useHomad","false"],["DL8_GLOBALS.enableHomadDesktop","false"],["DL8_GLOBALS.enableHomadMobile","false"],["Object.prototype.adReinsertion","noopFunc"],["getHomadConfig","noopFunc"],["ab","false"],["go_popup","{}"],["noBlocker","true"],["adsbygoogle","null"],["fabActive","false"],["gWkbAdVert","true"],["noblock","true"],["wgAffiliateEnabled","false"],["ads","null"],["detectAdblock","noopFunc"],["adsLoadable","true"],["ASSetCookieAds","null"],["letShowAds","true"],["tidakAdaPenghalangAds","true"],["ulp_noadb","true"],["Object.prototype.adblock_detected","false"],["timeSec","0"],["adsbygoogle.loaded","true"],["ads_unblocked","true"],["xxSetting.adBlockerDetection","false"],["better_ads_adblock","null"],["open","undefined"],["Drupal.behaviors.adBlockerPopup","null"],["fake_ad","true"],["flashvars.mlogo",""],["koddostu_com_adblock_yok","null"],["adsbygoogle","trueFunc"],["player.ads.cuePoints","undefined"],["adBlockDetected","null"],["better_ads_adblock","1"],["hold_click","false"],["sgpbCanRunAds","true"],["document.hasFocus","trueFunc"],["detectAdBlock","noopFunc"],["document.hidden","false"],["Object.prototype.isAllAdClose","true"],["isRequestPresent","true"],["fouty","true"],["Notification","undefined"],["protection","noopFunc"],["private","false"],["navigator.webkitTemporaryStorage.queryUsageAndQuota","noopFunc"],["document.onkeydown","noopFunc"],["showadas","true"],["alert","throwFunc"],["app_vars.please_disable_adblock","undefined"],["iktimer","0"],["aSl.gcd","0"],["delayClick","false"],["counter","10"],["sensorsDataAnalytic201505","{}"],["detectedAdblock","undefined"],["isTabActive","true"],["pubAdsService","trueFunc"],["config.pauseInspect","false"],["appContext.adManager.context.current.adFriendly","false"],["blockAdBlock._options.baitClass","null"],["document.blocked_var","1"],["____ads_js_blocked","false"],["wIsAdBlocked","false"],["WebSite.plsDisableAdBlock","null"],["ads_blocked","false"],["samDetected","false"],["countClicks","0"],["settings.adBlockerDetection","false"],["mixpanel.get_distinct_id","true"],["bannersLoaded","4"],["notEmptyBanners","4"],["fuckAdBlock._options.baitClass","null"],["bscheck.adblocker","noopFunc"],["qpcheck.ads","noopFunc"],["isContentBlocked","falseFunc"],["CloudflareApps.installs.Ik7rmQ4t95Qk.options.measureDomain","undefined"],["detectAB1","noopFunc"],["uBlockOriginDetected","false"],["googletag._vars_","{}"],["googletag._loadStarted_","true"],["googletag._loaded_","true"],["google_unique_id","1"],["google.javascript","{}"],["google.javascript.ads","{}"],["google_global_correlator","1"],["paywallGateway.truncateContent","noopFunc"],["adBlockDisabled","true"],["blockedElement","noopFunc"],["popit","false"],["adBlockerDetected","false"],["abu","falseFunc"],["countdown","0"],["decodeURI","noopFunc"],["flashvars.adv_postpause_vast",""],["univresalP","noopFunc"],["xv_ad_block","0"],["vidorev_jav_plugin_video_ads_object.vid_ads_m_video_ads",""],["adsProvider.init","noopFunc"],["SDKLoaded","true"],["blockAdBlock._creatBait","null"],["POPUNDER_ENABLED","false"],["plugins.preroll","noopFunc"],["errcode","0"],["DHAntiAdBlocker","true"],["showada","true"],["showax","true"],["p18","undefined"],["ADBLOCKED","false"],["Object.prototype.adsEnabled","false"],["adb","0"],["String.fromCharCode","trueFunc"],["adblock_use","false"],["nitroAds.loaded","true"],["createCanvas","noopFunc"],["playerAdSettings.adLink",""],["playerAdSettings.waitTime","0"],["AdHandler.adblocked","0"],["xv.sda.pp.init","noopFunc"],["isAdsLoaded","true"],["adblockerAlert","noopFunc"],["Object.prototype.parseXML","noopFunc"],["Object.prototype.blackscreenDuration","1"],["Object.prototype.adPlayerId",""],["adblockDetect","noopFunc"],["style","noopFunc"],["history.pushState","noopFunc"],["google_unique_id","6"],["__NEXT_DATA__.props.pageProps.adsConfig","undefined"],["new_config.timedown","0"],["truex","{}"],["truex.client","noopFunc"],["hiddenProxyDetected","false"],["isadb","false"],["SteadyWidgetSettings.adblockActive","false"],["proclayer","noopFunc"],["timeleft","0"],["load_ads","trueFunc"],["starPop","1"],["Object.prototype.ads","noopFunc"],["detectBlockAds","noopFunc"],["ga","trueFunc"],["enable_dl_after_countdown","true"],["isGGSurvey","true"],["ad_link",""],["penciBlocksArray","[]"],["App.AdblockDetected","false"],["SF.adblock","true"],["startfrom","0"],["D4zz","noopFunc"],["Object.prototype.ads.nopreroll_","true"],["HP_Scout.adBlocked","false"],["SD_IS_BLOCKING","false"],["Object.prototype.isPremium","true"],["__BACKPLANE_API__.renderOptions.showAdBlock",""],["Object.prototype.isNoAds","{}"],["countDownDate","0"],["setupSkin","noopFunc"],["Object.prototype.enableInterstitial","false"],["ads","undefined"],["ADBLOCK","false"],["POSTPART_prototype.ADKEY","noopFunc"],["adBlockDetected","falseFunc"],["divWidth","1"],["noAdBlock","noopFunc"],["AdService.info.abd","noopFunc"],["adBlockDetectionResult","undefined"],["popped","true"],["google.ima.OmidVerificationVendor","{}"],["Object.prototype.omidAccessModeRules","{}"],["puShown1","true"],["passthetest","true"],["timeset","0"],["pandaAdviewValidate","true"],["verifica_adblock","noopFunc"],["canGetAds","true"],["ad_blocker_active","false"],["init_welcome_ad","noopFunc"],["moneyAbovePrivacyByvCDN","true"],["objAd.loadAdShield","noopFunc"],["window.myAd.runAd","noopFunc"],["document.body.contains","trueFunc"],["popunder","undefined"],["distance","0"],["document.onclick",""],["adEnable","true"],["displayAds","0"],["_adshrink.skiptime","0"],["AbleToRunAds","true"],["PreRollAd.timeCounter","0"],["TextEncoder","undefined"],["abpblocked","undefined"],["app.showModalAd","noopFunc"],["navigator.brave","undefined"],["paAddUnit","noopFunc"],["adt","0"],["test_adblock","noopFunc"],["adblockDetector","noopFunc"],["vastEnabled","false"],["detectadsbocker","false"],["two_worker_data_js.js","[]"],["FEATURE_DISABLE_ADOBE_POPUP_BY_COUNTRY","true"],["questpassGuard","noopFunc"],["isAdBlockerEnabled","false"],["sssp","emptyObj"],["smartLoaded","true"],["timeLeft","0"],["Cookiebot","noopFunc"],["feature_flags.interstitial_ads_flag","false"],["feature_flags.interstitials_every_four_slides","false"],["waldoSlotIds","true"],["adblockstatus","false"],["adScriptLoaded","true"],["adblockEnabled","noopFunc"],["adSettings","[]"],["banner_is_blocked","false"],["Object.prototype.adBlocked","false"],["myFunc","noopFunc"],["chp_adblock_browser","noopFunc"],["googleAd","true"],["Brid.A9.prototype.backfillAdUnits","[]"],["dct","0"],["slideShow.displayInterstitial","true"],["googletag","true"],["tOS2","150"],["__INITIAL_STATE__.gameLists.gamesNoPrerollIds.indexOf","trueFunc"],["checkAdBlocker","noopFunc"],["navigator.standalone","true"],["google.ima.settings.setDisableFlashAds","noopFunc"],["ShowAdvertising","{}"],["empire.pop","undefined"],["empire.direct","undefined"],["empire.directHideAds","undefined"],["empire.mediaData.advisorMovie","1"],["empire.mediaData.advisorSerie","1"],["setTimer","0"],["penci_adlbock.ad_blocker_detector","0"],["Object.prototype.adblockDetector","noopFunc"],["blext","true"],["vidorev_jav_plugin_video_ads_object","{}"],["vidorev_jav_plugin_video_ads_object_post","{}"],["S_Popup","10"],["rabLimit","-1"],["nudgeAdBlock","noopFunc"],["feedBack.showAffilaePromo","noopFunc"],["FAVE.settings.ads.ssai.prod.clips.enabled","false"],["FAVE.settings.ads.ssai.prod.liveAuth.enabled","false"],["FAVE.settings.ads.ssai.prod.liveUnauth.enabled","false"],["loadpagecheck","noopFunc"],["art3m1sItemNames.affiliate-wrapper","\"\""],["window.adngin","{}"],["isAdBlockerActive","noopFunc"],["di.app.WebplayerApp.Ads.Adblocks.app.AdBlockDetectApp.startWithParent","false"],["admiral","noopFunc"],["gnt.u.adfree","true"],["sharedController.adblockDetector","noopFunc"],["checkAdsStatus","noopFunc"],["ads","[]"],["settings.adBlockDetectionEnabled","false"],["displayInterstitialAdConfig","false"],["confirm","noopFunc"],["checkAdBlockeraz","noopFunc"],["blockingAds","false"],["segundos","0"],["Yii2App.playbackTimeout","0"],["isPremium","true"],["QiyiPlayerProphetData.a.data","{}"],["toggleAdBlockInfo","falseFunc"],["aipAPItag.prerollSkipped","true"],["aipAPItag.setPreRollStatus","trueFunc"],["reklam_1_saniye","0"],["reklam_1_gecsaniye","0"],["reklamsayisi","1"],["reklam_1",""],["powerAPITag","emptyObj"],["playerEnhancedConfig.run","throwFunc"],["aoAdBlockDetected","false"],["xtime","0"],["Div_popup",""],["Scribd.Blob.AdBlockerModal","noopFunc"],["AddAdsV2I.addBlock","false"],["hasAdBlocker","false"],["document.ontouchend","null"],["document.onclick","null"],["initials.yld-pdpopunder",""],["advertisement3","true"],["importFAB","undefined"],["clicked","true"],["eClicked","true"],["number","0"],["sync","true"],["PlayerLogic.prototype.detectADB","noopFunc"],["showPopunder","noopFunc"],["Object.prototype.prerollAds","[]"],["notifyMe","noopFunc"],["adsClasses","undefined"],["gsecs","0"],["dvsize","52"],["majorse","true"],["completed","1"],["testerli","false"],["w87.abd","noopFunc"],["document.referrer",""],["Object.prototype.setNeedShowAdblockWarning","noopFunc"],["NoAdBlock","noopFunc"],["adList","[]"],["ifmax","true"],["nitroAds.abp","true"],["onloadUI","noopFunc"],["PageLoader.DetectAb","0"],["one_time","1"],["consentGiven","true"],["playID","1"],["openPopunder","noopFunc"],["GEMG.GPT.Interstitial","noopFunc"],["amiblock","0"],["karte3","18"],["sandDetect","noopFunc"],["amodule.data","emptyArr"],["Object.prototype.ADBLOCK_DETECTION",""],["postroll","undefined"],["interstitial","undefined"],["isAdBlockDetected","false"],["pData.adblockOverlayEnabled","0"],["cabdSettings","undefined"],["td_ad_background_click_link"],["ADS.isBannersEnabled","false"],["EASYFUN_ADS_CAN_RUN","true"],["adsbygoogle_ama_fc_has_run","true"],["jwDefaults.advertising","{}"],["elimina_profilazione","1"],["elimina_pubblicita","1"],["abd","{}"],["checkerimg","noopFunc"],["detectedAdblock","noopFunc"],["Object.prototype.DetectByGoogleAd","noopFunc"],["nitroAds","{}"],["nitroAds.createAd","noopFunc"],["NativeAd","noopFunc"],["Blob","noopFunc"],["window.navigator.brave","undefined"],["HTMLScriptElement.prototype.onerror","undefined"],["isAdblock","false"],["openPop","noopFunc"],["attachEvent","trueFunc"],["cns.library","true"],["countDown","0"],["runCheck","noopFunc"],["adsSlotRenderEndSeen","true"],["showModal","noopFunc"],["flashvars.mlogo_link",""],["isAdBlocked","noopFunc"],["URLlist","[]"],["aaw","{}"],["aaw.processAdsOnPage","noopFunc"],["doOpen","undefined"],["HTMLImageElement.prototype.onerror","undefined"],["FOXIZ_MAIN_SCRIPT.siteAccessDetector","noopFunc"],["myMessage","noopFunc"],["browserMessage","noopFunc"],["openAdBlockPopup","noopFunc"],["rwt","noopFunc"],["bmak.js_post","false"],["firebase.analytics","noopFunc"],["Object.prototype.updateModifiedCommerceUrl","noopFunc"],["flashvars.event_reporting",""],["Object.prototype.has_opted_out_tracking","trueFunc"],["Visitor","{}"],["send_gravity_event","noopFunc"],["send_recommendation_event","noopFunc"],["libAnalytics.data.get","noopFunc"],["navigator.sendBeacon","noopFunc"],["akamaiDisableServerIpLookup","noopFunc"],["DD_RUM.addAction","noopFunc"],["nads.createAd","trueFunc"],["ga","noopFunc"],["huecosPBS.nstdX","null"],["DTM.trackAsyncPV","noopFunc"],["_satellite","{}"],["_satellite.getVisitorId","noopFunc"],["newPageViewSpeedtest","noopFunc"],["pubg.unload","noopFunc"],["generateGalleryAd","noopFunc"],["mediator","noopFunc"],["Object.prototype.subscribe","noopFunc"],["gbTracker","{}"],["gbTracker.sendAutoSearchEvent","noopFunc"],["Object.prototype.vjsPlayer.ads","noopFunc"],["network_user_id",""],["googletag.cmd","{}"],["Object.prototype.setDisableFlashAds","noopFunc"],["DD_RUM.addTiming","noopFunc"],["chameleonVideo.adDisabledRequested","true"],["AdmostClient","{}"],["analytics","{}"],["datalayer","[]"],["Object.prototype.isInitialLoadDisabled","noopFunc"],["listingGoogleEETracking","noopFunc"],["dcsMultiTrack","noopFunc"],["urlStrArray","noopFunc"],["pa","{}"],["Object.prototype.setConfigurations","noopFunc"],["Object.prototype.bk_addPageCtx","noopFunc"],["Object.prototype.bk_doJSTag","noopFunc"],["passFingerPrint","noopFunc"],["optimizely","{}"],["optimizely.initialized","true"],["google_optimize","{}"],["google_optimize.get","noopFunc"],["_gsq","{}"],["_gsq.push","noopFunc"],["stmCustomEvent","noopFunc"],["_gsDevice",""],["iom","{}"],["iom.c","noopFunc"],["_conv_q","{}"],["_conv_q.push","noopFunc"],["pa.privacy","{}"],["Object.prototype.getTargetingMap","noopFunc"],["populateClientData4RBA","noopFunc"],["YT.ImaManager","noopFunc"],["UOLPD","{}"],["UOLPD.dataLayer","{}"],["__configuredDFPTags","{}"],["URL_VAST_YOUTUBE","{}"],["Adman","{}"],["dplus","{}"],["dplus.track","noopFunc"],["_satellite.track","noopFunc"],["google.ima.dai","{}"],["gfkS2sExtension","{}"],["gfkS2sExtension.HTML5VODExtension","noopFunc"],["AnalyticsEventTrackingJS","{}"],["AnalyticsEventTrackingJS.addToBasket","noopFunc"],["AnalyticsEventTrackingJS.trackErrorMessage","noopFunc"],["initializeslideshow","noopFunc"],["fathom","{}"],["fathom.trackGoal","noopFunc"],["Origami","{}"],["Origami.fastclick","noopFunc"],["jad","undefined"],["hasAdblocker","true"],["Sentry","{}"],["Sentry.init","noopFunc"],["TRC","{}"],["TRC._taboolaClone","[]"],["fp","{}"],["fp.t","noopFunc"],["fp.s","noopFunc"],["initializeNewRelic","noopFunc"],["turnerAnalyticsObj","{}"],["turnerAnalyticsObj.setVideoObject4AnalyticsProperty","noopFunc"],["optimizelyDatafile","{}"],["optimizelyDatafile.featureFlags","[]"],["fingerprint","{}"],["fingerprint.getCookie","noopFunc"],["gform.utils","noopFunc"],["gform.utils.trigger","noopFunc"],["get_fingerprint","noopFunc"],["moatPrebidApi","{}"],["moatPrebidApi.getMoatTargetingForPage","noopFunc"],["cpd_configdata","{}"],["cpd_configdata.url",""],["yieldlove_cmd","{}"],["yieldlove_cmd.push","noopFunc"],["dataLayer.push","noopFunc"],["_etmc","{}"],["_etmc.push","noopFunc"],["freshpaint","{}"],["freshpaint.track","noopFunc"],["ShowRewards","noopFunc"],["stLight","{}"],["stLight.options","noopFunc"],["DD_RUM.addError","noopFunc"],["sensorsDataAnalytic201505.init","noopFunc"],["sensorsDataAnalytic201505.quick","noopFunc"],["sensorsDataAnalytic201505.track","noopFunc"],["s","{}"],["s.tl","noopFunc"],["smartech","noopFunc"],["sensors","{}"],["sensors.init","noopFunc"],["sensors.track","noopFunc"],["adn","{}"],["adn.clearDivs","noopFunc"],["_vwo_code","{}"],["gtag","noopFunc"],["_taboola","{}"],["_taboola.push","noopFunc"],["clicky","{}"],["clicky.goal","noopFunc"],["WURFL","{}"],["_sp_.config.events.onSPPMObjectReady","noopFunc"],["gtm","{}"],["gtm.trackEvent","noopFunc"],["mParticle.Identity.getCurrentUser","noopFunc"],["JSGlobals.prebidEnabled","false"],["elasticApm","{}"],["elasticApm.init","noopFunc"],["Object.prototype.que","noopFunc"],["Object.prototype.que.push","noopFunc"],["ga.sendGaEvent","noopFunc"],["adobe","{}"],["MT","{}"],["MT.track","noopFunc"],["adex","{}"],["adex.getAdexUser","noopFunc"],["Adkit","noopFunc"],["fapit.check","noopFunc"],["adBlockDetected","undefined"],["Navigator.prototype.globalPrivacyControl","false"],["navigator.globalPrivacyControl","false"],["gnt.x.adm",""]];
const hostnamesMap = new Map([["m.youtube.com",[0,1,2,3]],["music.youtube.com",[0,1,2,3]],["tv.youtube.com",[0,1,2,3]],["www.youtube.com",[0,1,2,3]],["youtubekids.com",[0,1,2,3]],["youtube-nocookie.com",[0,1,2,3]],["eu-proxy.startpage.com",[0,1,3]],["kicker.de",[4,632]],["t-online.de",5],["timesofindia.indiatimes.com",6],["economictimes.indiatimes.com",7],["motherless.com",8],["sueddeutsche.de",9],["watchanimesub.net",10],["wco.tv",10],["wcoanimesub.tv",10],["wcoforever.net",10],["freeviewmovies.com",10],["filehorse.com",10],["guidetnt.com",10],["starmusiq.*",10],["sp-today.com",10],["linkvertise.com",10],["eropaste.net",10],["getpaste.link",10],["sharetext.me",10],["wcofun.*",10],["note.sieuthuthuat.com",10],["elcriticodelatele.com",[10,301]],["gadgets.es",[10,301]],["amateurporn.co",[10,108]],["wiwo.de",11],["kissasian.*",12],["gogoanime.*",[12,47]],["1movies.*",[12,53]],["xmovies8.*",12],["masteranime.tv",12],["0123movies.*",12],["gostream.*",12],["gomovies.*",12],["primewire.*",13],["streanplay.*",[13,14]],["alphaporno.com",[13,395]],["porngem.com",13],["shortit.pw",[13,92]],["familyporn.tv",13],["sbplay.*",13],["id45.cyou",13],["85tube.com",[13,76]],["milfnut.*",13],["k1nk.co",13],["watchasians.cc",13],["soltoshindo.com",13],["sankakucomplex.com",15],["player.glomex.com",16],["merkur.de",16],["tz.de",16],["sxyprn.*",17],["hqq.*",[18,19]],["waaw.*",[19,20]],["hotpornfile.org",19],["player.tabooporns.com",19],["x69.ovh",19],["wiztube.xyz",19],["younetu.*",19],["multiup.us",19],["rpdrlatino.live",19],["peliculas8k.com",[19,20]],["video.q34r.org",19],["czxxx.org",19],["vtplayer.online",19],["vvtplayer.*",19],["netu.ac",19],["netu.frembed.lol",19],["dirtyvideo.fun",20],["adbull.org",21],["123link.*",21],["adshort.*",21],["mitly.us",21],["linkrex.net",21],["linx.cc",21],["oke.io",21],["linkshorts.*",21],["dz4link.com",21],["adsrt.*",21],["linclik.com",21],["shrt10.com",21],["vinaurl.*",21],["loptelink.com",21],["adfloz.*",21],["cut-fly.com",21],["linkfinal.com",21],["payskip.org",21],["cutpaid.com",21],["forexmab.com",21],["linkjust.com",21],["linkszia.co",21],["leechpremium.link",21],["icutlink.com",[21,113]],["oncehelp.com",21],["rgl.vn",21],["reqlinks.net",21],["bitlk.com",21],["qlinks.eu",21],["link.3dmili.com",21],["short-fly.com",21],["foxseotools.com",21],["dutchycorp.*",21],["shortearn.*",21],["pingit.*",21],["pngit.live",21],["link.turkdown.com",21],["urlty.com",21],["7r6.com",21],["oko.sh",21],["ckk.ai",21],["fc.lc",21],["fstore.biz",21],["shrink.*",21],["cuts-url.com",21],["eio.io",21],["exe.app",21],["exee.io",21],["exey.io",21],["skincarie.com",21],["exeo.app",21],["tmearn.*",21],["coinlyhub.com",[21,187]],["adsafelink.com",21],["aii.sh",21],["megalink.*",21],["cybertechng.com",[21,202]],["cutdl.xyz",21],["iir.ai",21],["shorteet.com",[21,222]],["miniurl.*",21],["smoner.com",21],["gplinks.*",21],["gyanlight.com",21],["xpshort.com",21],["upshrink.com",21],["enit.in",[21,217]],["clk.*",21],["ez4short.com",21],["easysky.in",21],["veganab.co",21],["adrinolinks.in",21],["go.bloggingaro.com",21],["go.gyanitheme.com",21],["go.theforyou.in",21],["go.hipsonyc.com",21],["birdurls.com",21],["vipurl.in",21],["try2link.com",21],["jameeltips.us",21],["gainl.ink",21],["promo-visits.site",21],["satoshi-win.xyz",[21,238]],["shorterall.com",21],["encurtandourl.com",21],["forextrader.site",21],["postazap.com",21],["cety.app",21],["exego.app",[21,233]],["cutlink.net",21],["cutsy.net",21],["cutyurls.com",21],["cutty.app",21],["cutnet.net",21],["jixo.online",21],["tinys.click",[21,202]],["cpm.icu",21],["panyshort.link",21],["enagato.com",21],["pandaznetwork.com",21],["tvi.la",21],["iir.la",21],["tii.la",21],["oei.la",21],["lnbz.la",[21,217]],["oii.la",[21,246]],["tpi.li",[21,246]],["recipestutorials.com",21],["pureshort.*",21],["shrinke.*",21],["shrinkme.*",21],["shrinkforearn.in",21],["techyuth.xyz",21],["oii.io",21],["du-link.in",21],["atglinks.com",21],["thotpacks.xyz",21],["megaurl.in",21],["megafly.in",21],["simana.online",21],["fooak.com",21],["joktop.com",21],["evernia.site",21],["falpus.com",21],["link.paid4link.com",[21,250]],["exalink.fun",21],["indiamaja.com",21],["newshuta.in",21],["shortxlinks.com",21],["upfiles.app",21],["upfiles-urls.com",21],["flycutlink.com",[21,202]],["linksly.co",21],["link1s.*",21],["pkr.pw",21],["imagenesderopaparaperros.com",21],["shortenbuddy.com",21],["apksvip.com",21],["4cash.me",21],["namaidani.com",21],["shortzzy.*",21],["teknomuda.com",21],["shorttey.*",[21,186]],["miuiku.com",21],["savelink.site",21],["lite-link.*",21],["adcorto.*",21],["samaa-pro.com",21],["miklpro.com",21],["modapk.link",21],["ccurl.net",21],["linkpoi.me",21],["menjelajahi.com",21],["pewgame.com",21],["haonguyen.top",21],["zshort.*",21],["crazyblog.in",21],["gtlink.co",21],["cutearn.net",21],["rshrt.com",21],["filezipa.com",21],["dz-linkk.com",21],["upfiles.*",21],["theblissempire.com",21],["finanzas-vida.com",21],["adurly.cc",21],["paid4.link",21],["link.asiaon.top",21],["go.gets4link.com",21],["download.sharenulled.net",21],["linkfly.*",21],["beingtek.com",21],["shorturl.unityassets4free.com",21],["disheye.com",21],["techymedies.com",21],["techysuccess.com",21],["za.gl",[21,132]],["bblink.com",21],["myad.biz",21],["swzz.xyz",21],["vevioz.com",21],["charexempire.com",21],["clk.asia",21],["linka.click",21],["sturls.com",21],["myshrinker.com",21],["snowurl.com",[21,202]],["netfile.cc",21],["wplink.*",21],["rocklink.in",21],["techgeek.digital",21],["download3s.net",21],["shortx.net",21],["shortawy.com",21],["tlin.me",21],["apprepack.com",21],["up-load.one",21],["zuba.link",21],["golink.xaydungplus.com",21],["bestcash2020.com",21],["hoxiin.com",21],["go.linkbnao.com",21],["link-yz.com",21],["paylinnk.com",21],["thizissam.in",21],["ier.ai",21],["adslink.pw",21],["novelssites.com",21],["links.medipost.org",21],["faucetcrypto.net",21],["short.freeltc.top",21],["trxking.xyz",21],["weadown.com",21],["m.bloggingguidance.com",21],["blog.onroid.com",21],["link.codevn.net",21],["upfilesurls.com",21],["shareus.site",21],["link4rev.site",21],["c2g.at",21],["bitcosite.com",[21,409]],["cryptosh.pro",21],["link68.net",21],["traffic123.net",21],["windowslite.net",[21,202]],["viewfr.com",21],["cl1ca.com",21],["4br.me",21],["fir3.net",21],["seulink.*",21],["encurtalink.*",21],["kiddyshort.com",21],["watchmygf.me",[22,48]],["camwhores.*",[22,34,75,76,77]],["camwhorez.tv",[22,34,75,76]],["cambay.tv",[22,56,75,105,107,108,109,110]],["fpo.xxx",[22,56]],["sexemix.com",22],["heavyfetish.com",[22,562]],["thotcity.su",22],["viralxxxporn.com",[22,225]],["tube8.*",[23,24]],["you-porn.com",24],["youporn.*",24],["youporngay.com",24],["youpornru.com",24],["redtube.*",24],["9908ww.com",24],["adelaidepawnbroker.com",24],["bztube.com",24],["hotovs.com",24],["insuredhome.org",24],["nudegista.com",24],["pornluck.com",24],["vidd.se",24],["pornhub.*",[24,174]],["pornhub.com",24],["pornerbros.com",25],["freep.com",25],["upornia.*",[26,27]],["porn.com",28],["tune.pk",29],["noticias.gospelmais.com.br",30],["techperiod.com",30],["viki.com",[31,32]],["watch-series.*",33],["watchseries.*",33],["vev.*",33],["vidop.*",33],["vidup.*",33],["sleazyneasy.com",[34,35,36]],["smutr.com",[34,183]],["yourporngod.com",[34,35]],["javbangers.com",[34,291]],["camfox.com",34],["camthots.tv",[34,105]],["shegotass.info",34],["amateur8.com",34],["bigtitslust.com",34],["ebony8.com",34],["freeporn8.com",34],["lesbian8.com",34],["maturetubehere.com",34],["sortporn.com",34],["webcamvau.com",34],["motherporno.com",[34,35,56,107]],["tktube.com",34],["theporngod.com",[34,35]],["watchdirty.to",[34,76,77,108]],["pornsocket.com",37],["luxuretv.com",38],["porndig.com",[39,40]],["webcheats.com.br",41],["ceesty.com",[42,43]],["gestyy.com",[42,43]],["corneey.com",43],["destyy.com",43],["festyy.com",43],["sh.st",43],["mitaku.net",43],["angrybirdsnest.com",44],["zrozz.com",44],["clix4btc.com",44],["4tests.com",44],["business-standard.com",44],["goltelevision.com",44],["news-und-nachrichten.de",44],["laradiobbs.net",44],["urlaubspartner.net",44],["produktion.de",44],["cinemaxxl.de",44],["bladesalvador.com",44],["tempr.email",44],["cshort.org",44],["friendproject.net",44],["covrhub.com",44],["katfile.com",44],["trust.zone",44],["planetsuzy.org",45],["empflix.com",46],["alleneconomicmatter.com",47],["apinchcaseation.com",47],["bethshouldercan.com",47],["bigclatterhomesguideservice.com",47],["bradleyviewdoctor.com",47],["brittneystandardwestern.com",47],["brookethoughi.com",47],["brucevotewithin.com",47],["cindyeyefinal.com",47],["denisegrowthwide.com",47],["donaldlineelse.com",47],["edwardarriveoften.com",47],["erikcoldperson.com",47],["evelynthankregion.com",47],["graceaddresscommunity.com",47],["heatherdiscussionwhen.com",47],["housecardsummerbutton.com",47],["jamessoundcost.com",47],["jamesstartstudent.com",47],["jamiesamewalk.com",47],["jasminetesttry.com",47],["jasonresponsemeasure.com",47],["jayservicestuff.com",47],["jessicaglassauthor.com",47],["johntryopen.com",47],["josephseveralconcern.com",47],["kennethofficialitem.com",47],["lisatrialidea.com",47],["lorimuchbenefit.com",47],["loriwithinfamily.com",47],["lukecomparetwo.com",47],["markstyleall.com",47],["michaelapplysome.com",47],["morganoperationface.com",47],["nectareousoverelate.com",47],["paulkitchendark.com",47],["rebeccaneverbase.com",47],["roberteachfinal.com",47],["robertordercharacter.com",47],["robertplacespace.com",47],["ryanagoinvolve.com",47],["sandratableother.com",47],["sandrataxeight.com",47],["seanshowcould.com",47],["sethniceletter.com",47],["shannonpersonalcost.com",47],["sharonwhiledemocratic.com",47],["stevenimaginelittle.com",47],["strawberriesporail.com",47],["susanhavekeep.com",47],["timberwoodanotia.com",47],["tinycat-voe-fashion.com",47],["toddpartneranimal.com",47],["troyyourlead.com",47],["uptodatefinishconference.com",47],["uptodatefinishconferenceroom.com",47],["vincentincludesuccessful.com",47],["voe.sx",47],["maxfinishseveral.com",47],["motphimtv.com",47],["rabbitstream.net",47],["projectfreetv.one",47],["fmovies.*",47],["freeplayervideo.com",47],["nazarickol.com",47],["player-cdn.com",47],["playhydrax.com",[47,479,480]],["transparentcalifornia.com",48],["deepbrid.com",49],["webnovel.com",50],["streamwish.*",[51,52]],["videosgay.me",[51,52]],["oneupload.to",52],["wishfast.top",52],["rubystm.com",52],["rubyvid.com",52],["schwaebische.de",54],["8tracks.com",55],["3movs.com",56],["bravoerotica.net",[56,107]],["youx.xxx",56],["camclips.tv",[56,183]],["xtits.*",[56,107]],["camflow.tv",[56,107,108,153,225]],["camhoes.tv",[56,105,107,108,153,225]],["xmegadrive.com",56],["xxxymovies.com",56],["xxxshake.com",56],["gayck.com",56],["xhand.com",[56,107]],["analdin.com",[56,107]],["revealname.com",57],["pouvideo.*",58],["povvideo.*",58],["povw1deo.*",58],["povwideo.*",58],["powv1deo.*",58],["powvibeo.*",58],["powvideo.*",58],["powvldeo.*",58],["golfchannel.com",59],["telemundodeportes.com",59],["stream.nbcsports.com",59],["mathdf.com",59],["gamcore.com",60],["porcore.com",60],["porngames.tv",60],["69games.xxx",60],["javmix.app",60],["tecknity.com",61],["haaretz.co.il",62],["haaretz.com",62],["hungama.com",62],["a-o.ninja",62],["anime-odcinki.pl",62],["kumpulmanga.org",62],["shortgoo.blogspot.com",62],["tonanmedia.my.id",[62,432]],["yurasu.xyz",62],["isekaipalace.com",62],["plyjam.*",[63,64]],["ennovelas.com",[64,68]],["foxsports.com.au",65],["canberratimes.com.au",65],["thesimsresource.com",66],["fxporn69.*",67],["vipbox.*",68],["viprow.*",68],["ctrl.blog",69],["sportlife.es",70],["finofilipino.org",71],["desbloqueador.*",72],["xberuang.*",73],["teknorizen.*",73],["mysflink.blogspot.com",73],["assia.tv",74],["assia4.com",74],["assia24.com",74],["cwtvembeds.com",[76,106]],["camlovers.tv",76],["porntn.com",76],["pornissimo.org",76],["sexcams-24.com",[76,108]],["watchporn.to",[76,108]],["camwhorez.video",76],["footstockings.com",[76,77,108]],["xmateur.com",[76,77,108]],["multi.xxx",77],["worldofbitco.in",[78,79]],["weatherx.co.in",[78,79]],["getyourbitco.in",78],["sunbtc.space",78],["subtorrents.*",80],["subtorrents1.*",80],["newpelis.*",80],["pelix.*",80],["allcalidad.*",80],["infomaniakos.*",80],["ojogos.com.br",81],["powforums.com",82],["supforums.com",82],["studybullet.com",82],["usgamer.net",83],["recordonline.com",83],["freebitcoin.win",84],["e-monsite.com",84],["coindice.win",84],["temp-mails.com",85],["freiepresse.de",86],["investing.com",87],["tornadomovies.*",88],["mp3fiber.com",89],["chicoer.com",90],["dailybreeze.com",90],["dailybulletin.com",90],["dailynews.com",90],["delcotimes.com",90],["eastbaytimes.com",90],["macombdaily.com",90],["ocregister.com",90],["pasadenastarnews.com",90],["pe.com",90],["presstelegram.com",90],["redlandsdailyfacts.com",90],["reviewjournal.com",90],["santacruzsentinel.com",90],["saratogian.com",90],["sentinelandenterprise.com",90],["sgvtribune.com",90],["tampabay.com",90],["times-standard.com",90],["theoaklandpress.com",90],["trentonian.com",90],["twincities.com",90],["whittierdailynews.com",90],["bostonherald.com",90],["dailycamera.com",90],["sbsun.com",90],["dailydemocrat.com",90],["montereyherald.com",90],["orovillemr.com",90],["record-bee.com",90],["redbluffdailynews.com",90],["reporterherald.com",90],["thereporter.com",90],["timescall.com",90],["timesheraldonline.com",90],["ukiahdailyjournal.com",90],["dailylocal.com",90],["mercurynews.com",90],["suedkurier.de",91],["anysex.com",93],["icdrama.*",94],["vlist.se",94],["mangasail.*",94],["pornve.com",95],["file4go.*",96],["coolrom.com.au",96],["pornohirsch.net",97],["marie-claire.es",98],["gamezhero.com",98],["flashgirlgames.com",98],["onlinesudoku.games",98],["mpg.football",98],["sssam.com",98],["globalnews.ca",99],["drinksmixer.com",100],["leitesculinaria.com",100],["fupa.net",101],["browardpalmbeach.com",102],["dallasobserver.com",102],["houstonpress.com",102],["miaminewtimes.com",102],["phoenixnewtimes.com",102],["westword.com",102],["nhentai.net",103],["nowtv.com.tr",104],["caminspector.net",105],["camwhoreshd.com",105],["camgoddess.tv",105],["gay4porn.com",107],["mypornhere.com",107],["mangovideo.*",108],["love4porn.com",108],["thotvids.com",108],["watchmdh.to",108],["celebwhore.com",108],["cluset.com",108],["4kporn.xxx",108],["xhomealone.com",108],["lusttaboo.com",[108,364]],["hentai-moon.com",108],["sexwebvideo.com",108],["sexwebvideo.net",108],["camhub.cc",[108,540]],["mediapason.it",111],["linkspaid.com",111],["tuotromedico.com",111],["neoteo.com",111],["phoneswiki.com",111],["celebmix.com",111],["myneobuxportal.com",111],["oyungibi.com",111],["25yearslatersite.com",111],["jeshoots.com",112],["techhx.com",112],["karanapk.com",112],["flashplayer.fullstacks.net",114],["cloudapps.herokuapp.com",114],["youfiles.herokuapp.com",114],["texteditor.nsspot.net",114],["temp-mail.org",115],["asianclub.*",116],["javhdporn.net",116],["vidmoly.to",117],["comnuan.com",118],["veedi.com",119],["battleboats.io",119],["anitube.*",120],["fruitlab.com",120],["acetack.com",120],["androidquest.com",120],["apklox.com",120],["chhaprawap.in",120],["gujarativyakaran.com",120],["kashmirstudentsinformation.in",120],["kisantime.com",120],["shetkaritoday.in",120],["pastescript.com",120],["trimorspacks.com",120],["updrop.link",120],["haddoz.net",120],["streamingcommunity.*",120],["garoetpos.com",120],["stiletv.it",121],["mixdrop.*",122],["hqtv.biz",123],["liveuamap.com",124],["muvibg.com",124],["vinomo.xyz",125],["bembed.net",125],["embedv.net",125],["fslinks.org",125],["listeamed.net",125],["v6embed.xyz",125],["vembed.*",125],["vgplayer.xyz",125],["vid-guard.com",125],["audycje.tokfm.pl",126],["hulu.com",[127,128,129]],["shush.se",130],["allkpop.com",131],["pickcrackpasswords.blogspot.com",133],["kfrfansub.com",134],["thuglink.com",134],["voipreview.org",134],["illicoporno.com",135],["lavoixdux.com",135],["tonpornodujour.com",135],["jacquieetmichel.net",135],["swame.com",135],["vosfemmes.com",135],["voyeurfrance.net",135],["jacquieetmicheltv.net",[135,489,490]],["hanime.tv",136],["pogo.com",137],["cloudvideo.tv",138],["legionjuegos.org",139],["legionpeliculas.org",139],["legionprogramas.org",139],["16honeys.com",140],["elespanol.com",141],["remodelista.com",142],["coolmathgames.com",[143,144,145,585]],["audiofanzine.com",146],["uploadev.*",147],["hitokin.net",148],["developerinsider.co",149],["ilprimatonazionale.it",150],["hotabis.com",150],["root-nation.com",150],["italpress.com",150],["airsoftmilsimnews.com",150],["artribune.com",150],["thehindu.com",151],["cambro.tv",[152,153]],["boobsradar.com",[153,225,547]],["nibelungen-kurier.de",154],["ver-pelis-online.*",155],["adfoc.us",156],["techyember.com",156],["remixbass.com",156],["techipop.com",156],["quickimageconverter.com",156],["mastharyana.com",156],["tea-coffee.net",156],["spatsify.com",156],["newedutopics.com",156],["getviralreach.in",156],["edukaroo.com",156],["funkeypagali.com",156],["careersides.com",156],["nayisahara.com",156],["wikifilmia.com",156],["infinityskull.com",156],["viewmyknowledge.com",156],["iisfvirtual.in",156],["starxinvestor.com",156],["jkssbalerts.com",156],["myprivatejobs.com",[156,234]],["wikitraveltips.com",[156,234]],["amritadrino.com",[156,234]],["sahlmarketing.net",156],["filmypoints.in",156],["fitnessholic.net",156],["moderngyan.com",156],["sattakingcharts.in",156],["freshbhojpuri.com",156],["bgmi32bitapk.in",156],["bankshiksha.in",156],["earn.mpscstudyhub.com",156],["earn.quotesopia.com",156],["money.quotesopia.com",156],["best-mobilegames.com",156],["learn.moderngyan.com",156],["bharatsarkarijobalert.com",156],["quotesopia.com",156],["creditsgoal.com",156],["techacode.com",156],["trickms.com",156],["ielts-isa.edu.vn",156],["sptfy.be",156],["mcafee-com.com",[156,233]],["pianetamountainbike.it",157],["barchart.com",158],["modelisme.com",159],["parasportontario.ca",159],["prescottenews.com",159],["nrj-play.fr",160],["hackingwithreact.com",161],["gutekueche.at",162],["eplfootballmatch.com",163],["ancient-origins.*",163],["peekvids.com",164],["playvids.com",164],["pornflip.com",164],["redensarten-index.de",165],["vw-page.com",166],["viz.com",[167,168]],["0rechner.de",169],["configspc.com",170],["xopenload.me",170],["uptobox.com",170],["uptostream.com",170],["japgay.com",171],["mega-debrid.eu",172],["dreamdth.com",173],["diaridegirona.cat",175],["diariodeibiza.es",175],["diariodemallorca.es",175],["diarioinformacion.com",175],["eldia.es",175],["emporda.info",175],["farodevigo.es",175],["laopinioncoruna.es",175],["laopiniondemalaga.es",175],["laopiniondemurcia.es",175],["laopiniondezamora.es",175],["laprovincia.es",175],["levante-emv.com",175],["mallorcazeitung.es",175],["regio7.cat",175],["superdeporte.es",175],["playpaste.com",176],["cnbc.com",177],["puzzles.msn.com",178],["metro.us",178],["newsobserver.com",178],["arkadiumhosted.com",178],["spankbang.*",179],["firefaucet.win",180],["74k.io",[181,182]],["stmruby.com",181],["fullhdxxx.com",184],["pornclassic.tube",185],["tubepornclassic.com",185],["etonline.com",186],["creatur.io",186],["lookcam.*",186],["drphil.com",186],["urbanmilwaukee.com",186],["lootlinks.*",186],["ontiva.com",186],["hideandseek.world",186],["myabandonware.com",186],["kendam.com",186],["wttw.com",186],["synonyms.com",186],["definitions.net",186],["hostmath.com",186],["camvideoshub.com",186],["minhaconexao.com.br",186],["home-made-videos.com",188],["amateur-couples.com",188],["slutdump.com",188],["dpstream.*",189],["produsat.com",190],["bluemediafiles.*",191],["12thman.com",192],["acusports.com",192],["atlantic10.com",192],["auburntigers.com",192],["baylorbears.com",192],["bceagles.com",192],["bgsufalcons.com",192],["big12sports.com",192],["bigten.org",192],["bradleybraves.com",192],["butlersports.com",192],["cmumavericks.com",192],["conferenceusa.com",192],["cyclones.com",192],["dartmouthsports.com",192],["daytonflyers.com",192],["dbupatriots.com",192],["dbusports.com",192],["denverpioneers.com",192],["fduknights.com",192],["fgcuathletics.com",192],["fightinghawks.com",192],["fightingillini.com",192],["floridagators.com",192],["friars.com",192],["friscofighters.com",192],["gamecocksonline.com",192],["goarmywestpoint.com",192],["gobison.com",192],["goblueraiders.com",192],["gobobcats.com",192],["gocards.com",192],["gocreighton.com",192],["godeacs.com",192],["goexplorers.com",192],["goetbutigers.com",192],["gofrogs.com",192],["gogriffs.com",192],["gogriz.com",192],["golobos.com",192],["gomarquette.com",192],["gopack.com",192],["gophersports.com",192],["goprincetontigers.com",192],["gopsusports.com",192],["goracers.com",192],["goshockers.com",192],["goterriers.com",192],["gotigersgo.com",192],["gousfbulls.com",192],["govandals.com",192],["gowyo.com",192],["goxavier.com",192],["gozags.com",192],["gozips.com",192],["griffinathletics.com",192],["guhoyas.com",192],["gwusports.com",192],["hailstate.com",192],["hamptonpirates.com",192],["hawaiiathletics.com",192],["hokiesports.com",192],["huskers.com",192],["icgaels.com",192],["iuhoosiers.com",192],["jsugamecocksports.com",192],["longbeachstate.com",192],["loyolaramblers.com",192],["lrtrojans.com",192],["lsusports.net",192],["morrisvillemustangs.com",192],["msuspartans.com",192],["muleriderathletics.com",192],["mutigers.com",192],["navysports.com",192],["nevadawolfpack.com",192],["niuhuskies.com",192],["nkunorse.com",192],["nuhuskies.com",192],["nusports.com",192],["okstate.com",192],["olemisssports.com",192],["omavs.com",192],["ovcsports.com",192],["owlsports.com",192],["purduesports.com",192],["redstormsports.com",192],["richmondspiders.com",192],["sfajacks.com",192],["shupirates.com",192],["siusalukis.com",192],["smcgaels.com",192],["smumustangs.com",192],["soconsports.com",192],["soonersports.com",192],["themw.com",192],["tulsahurricane.com",192],["txst.com",192],["txstatebobcats.com",192],["ubbulls.com",192],["ucfknights.com",192],["ucirvinesports.com",192],["uconnhuskies.com",192],["uhcougars.com",192],["uicflames.com",192],["umterps.com",192],["uncwsports.com",192],["unipanthers.com",192],["unlvrebels.com",192],["uoflsports.com",192],["usdtoreros.com",192],["utahstateaggies.com",192],["utepathletics.com",192],["utrockets.com",192],["uvmathletics.com",192],["uwbadgers.com",192],["villanova.com",192],["wkusports.com",192],["wmubroncos.com",192],["woffordterriers.com",192],["1pack1goal.com",192],["bcuathletics.com",192],["bubraves.com",192],["goblackbears.com",192],["golightsgo.com",192],["gomcpanthers.com",192],["goutsa.com",192],["mercerbears.com",192],["pirateblue.com",192],["pirateblue.net",192],["pirateblue.org",192],["quinnipiacbobcats.com",192],["towsontigers.com",192],["tribeathletics.com",192],["tribeclub.com",192],["utepminermaniacs.com",192],["utepminers.com",192],["wkutickets.com",192],["aopathletics.org",192],["atlantichockeyonline.com",192],["bigsouthnetwork.com",192],["bigsouthsports.com",192],["chawomenshockey.com",192],["dbupatriots.org",192],["drakerelays.org",192],["ecac.org",192],["ecacsports.com",192],["emueagles.com",192],["emugameday.com",192],["gculopes.com",192],["godrakebulldog.com",192],["godrakebulldogs.com",192],["godrakebulldogs.net",192],["goeags.com",192],["goislander.com",192],["goislanders.com",192],["gojacks.com",192],["gomacsports.com",192],["gseagles.com",192],["hubison.com",192],["iowaconference.com",192],["ksuowls.com",192],["lonestarconference.org",192],["mascac.org",192],["midwestconference.org",192],["mountaineast.org",192],["niu-pack.com",192],["nulakers.ca",192],["oswegolakers.com",192],["ovcdigitalnetwork.com",192],["pacersports.com",192],["rmacsports.org",192],["rollrivers.com",192],["samfordsports.com",192],["uncpbraves.com",192],["usfdons.com",192],["wiacsports.com",192],["alaskananooks.com",192],["broncathleticfund.com",192],["cameronaggies.com",192],["columbiacougars.com",192],["etownbluejays.com",192],["gobadgers.ca",192],["golancers.ca",192],["gometrostate.com",192],["gothunderbirds.ca",192],["kentstatesports.com",192],["lehighsports.com",192],["lopers.com",192],["lycoathletics.com",192],["lycomingathletics.com",192],["maraudersports.com",192],["mauiinvitational.com",192],["msumavericks.com",192],["nauathletics.com",192],["nueagles.com",192],["nwusports.com",192],["oceanbreezenyc.org",192],["patriotathleticfund.com",192],["pittband.com",192],["principiaathletics.com",192],["roadrunnersathletics.com",192],["sidearmsocial.com",192],["snhupenmen.com",192],["stablerarena.com",192],["stoutbluedevils.com",192],["uwlathletics.com",192],["yumacs.com",192],["collegefootballplayoff.com",192],["csurams.com",192],["cubuffs.com",192],["gobearcats.com",192],["gohuskies.com",192],["mgoblue.com",192],["osubeavers.com",192],["pittsburghpanthers.com",192],["rolltide.com",192],["texassports.com",192],["thesundevils.com",192],["uclabruins.com",192],["wvuathletics.com",192],["wvusports.com",192],["arizonawildcats.com",192],["calbears.com",192],["cuse.com",192],["georgiadogs.com",192],["goducks.com",192],["goheels.com",192],["gostanford.com",192],["insidekstatesports.com",192],["insidekstatesports.info",192],["insidekstatesports.net",192],["insidekstatesports.org",192],["k-stateathletics.com",192],["k-statefootball.net",192],["k-statefootball.org",192],["k-statesports.com",192],["k-statesports.net",192],["k-statesports.org",192],["k-statewomenshoops.com",192],["k-statewomenshoops.net",192],["k-statewomenshoops.org",192],["kstateathletics.com",192],["kstatefootball.net",192],["kstatefootball.org",192],["kstatesports.com",192],["kstatewomenshoops.com",192],["kstatewomenshoops.net",192],["kstatewomenshoops.org",192],["ksuathletics.com",192],["ksusports.com",192],["scarletknights.com",192],["showdownforrelief.com",192],["syracusecrunch.com",192],["texastech.com",192],["theacc.com",192],["ukathletics.com",192],["usctrojans.com",192],["utahutes.com",192],["utsports.com",192],["wsucougars.com",192],["vidlii.com",[192,218]],["tricksplit.io",192],["fangraphs.com",193],["stern.de",194],["geo.de",194],["brigitte.de",194],["tvspielfilm.de",[195,196,197,198]],["tvtoday.de",[195,196,197,198]],["chip.de",[195,196,197,198]],["focus.de",[195,196,197,198]],["fitforfun.de",[195,196,197,198]],["n-tv.de",199],["player.rtl2.de",200],["planetaminecraft.com",201],["cravesandflames.com",202],["codesnse.com",202],["link.paid4file.com",202],["flyad.vip",202],["lapresse.ca",203],["kolyoom.com",204],["ilovephd.com",204],["negumo.com",205],["games.wkb.jp",[206,207]],["fandom.com",[208,602,603]],["kenshi.fandom.com",209],["hausbau-forum.de",210],["homeairquality.org",210],["faucettronn.click",210],["fake-it.ws",211],["laksa19.github.io",212],["1shortlink.com",213],["nesia.my.id",214],["u-s-news.com",215],["luscious.net",216],["makemoneywithurl.com",217],["junkyponk.com",217],["healthfirstweb.com",217],["vocalley.com",217],["yogablogfit.com",217],["howifx.com",[217,394]],["en.financerites.com",217],["mythvista.com",217],["livenewsflix.com",217],["cureclues.com",217],["apekite.com",217],["host-buzz.com",217],["insmyst.com",217],["wp2host.com",217],["blogtechh.com",217],["techbixby.com",217],["blogmyst.com",217],["iammagnus.com",218],["dailyvideoreports.net",218],["unityassets4free.com",218],["docer.*",219],["resetoff.pl",219],["sexodi.com",219],["cdn77.org",220],["howtofixwindows.com",221],["3sexporn.com",222],["momxxxsex.com",222],["myfreevintageporn.com",222],["penisbuyutucum.net",222],["ujszo.com",223],["newsmax.com",224],["bobs-tube.com",225],["nadidetarifler.com",226],["siz.tv",226],["suzylu.co.uk",[227,228]],["onworks.net",229],["yabiladi.com",229],["downloadsoft.net",230],["pixsera.net",231],["testlanguages.com",232],["newsinlevels.com",232],["videosinlevels.com",232],["starkroboticsfrc.com",233],["sinonimos.de",233],["antonimos.de",233],["quesignifi.ca",233],["tiktokrealtime.com",233],["tiktokcounter.net",233],["tpayr.xyz",233],["poqzn.xyz",233],["ashrfd.xyz",233],["rezsx.xyz",233],["tryzt.xyz",233],["ashrff.xyz",233],["rezst.xyz",233],["dawenet.com",233],["erzar.xyz",233],["waezm.xyz",233],["waezg.xyz",233],["blackwoodacademy.org",233],["cryptednews.space",233],["vivuq.com",233],["swgop.com",233],["vbnmll.com",233],["telcoinfo.online",233],["dshytb.com",233],["fitdynamos.com",[233,235]],["btcbitco.in",[233,237]],["btcsatoshi.net",233],["cempakajaya.com",233],["crypto4yu.com",233],["readbitcoin.org",233],["wiour.com",233],["finish.addurl.biz",233],["aiimgvlog.fun",[233,240]],["laweducationinfo.com",233],["savemoneyinfo.com",233],["worldaffairinfo.com",233],["godstoryinfo.com",233],["successstoryinfo.com",233],["cxissuegk.com",233],["learnmarketinfo.com",233],["bhugolinfo.com",233],["armypowerinfo.com",233],["rsadnetworkinfo.com",233],["rsinsuranceinfo.com",233],["rsfinanceinfo.com",233],["rsgamer.app",233],["rssoftwareinfo.com",233],["rshostinginfo.com",233],["rseducationinfo.com",233],["phonereviewinfo.com",233],["makeincomeinfo.com",233],["gknutshell.com",233],["vichitrainfo.com",233],["workproductivityinfo.com",233],["dopomininfo.com",233],["hostingdetailer.com",233],["fitnesssguide.com",233],["tradingfact4u.com",233],["cryptofactss.com",233],["softwaredetail.com",233],["artoffocas.com",233],["insurancesfact.com",233],["travellingdetail.com",233],["advertisingexcel.com",233],["allcryptoz.net",233],["batmanfactor.com",233],["beautifulfashionnailart.com",233],["crewbase.net",233],["documentaryplanet.xyz",233],["crewus.net",233],["gametechreviewer.com",233],["midebalonu.net",233],["misterio.ro",233],["phineypet.com",233],["seory.xyz",233],["shinbhu.net",233],["shinchu.net",233],["substitutefor.com",233],["talkforfitness.com",233],["thefitbrit.co.uk",233],["thumb8.net",233],["thumb9.net",233],["topcryptoz.net",233],["uniqueten.net",233],["ultraten.net",233],["exactpay.online",233],["quins.us",233],["kiddyearner.com",233],["luckydice.net",234],["adarima.org",234],["tieutietkiem.com",234],["weatherwx.com",234],["sattaguess.com",234],["winshell.de",234],["rosasidan.ws",234],["modmakers.xyz",234],["gamepure.in",234],["warrenrahul.in",234],["austiblox.net",234],["upiapi.in",234],["networkhint.com",234],["thichcode.net",234],["texturecan.com",234],["tikmate.app",[234,471]],["arcaxbydz.id",234],["quotesshine.com",234],["4funbox.com",236],["nephobox.com",236],["1024tera.com",236],["terabox.*",236],["blog.cryptowidgets.net",237],["blog.insurancegold.in",237],["blog.wiki-topia.com",237],["blog.coinsvalue.net",237],["blog.cookinguide.net",237],["blog.freeoseocheck.com",237],["blog24.me",237],["bildirim.link",239],["arahdrive.com",240],["appsbull.com",241],["diudemy.com",241],["maqal360.com",[241,242,243]],["lifesurance.info",244],["akcartoons.in",245],["cybercityhelp.in",245],["infokeeda.xyz",247],["webzeni.com",247],["dl.apkmoddone.com",248],["phongroblox.com",248],["apkmodvn.com",249],["streamelements.com",251],["share.hntv.tv",[251,671,672,673]],["forum.dji.com",[251,673]],["unionpayintl.com",[251,672]],["tickhosting.com",252],["in91vip.win",253],["arcai.com",254],["my-code4you.blogspot.com",255],["flickr.com",256],["firefile.cc",257],["pestleanalysis.com",257],["kochamjp.pl",257],["tutorialforlinux.com",257],["whatsaero.com",257],["animeblkom.net",[257,273]],["blkom.com",257],["globes.co.il",[258,259]],["jardiner-malin.fr",260],["tw-calc.net",261],["ohmybrush.com",262],["talkceltic.net",263],["mentalfloss.com",264],["uprafa.com",265],["cube365.net",266],["nightfallnews.com",[267,268]],["wwwfotografgotlin.blogspot.com",269],["freelistenonline.com",269],["badassdownloader.com",270],["quickporn.net",271],["yellowbridge.com",272],["aosmark.com",274],["ctrlv.*",275],["atozmath.com",[276,277,278,279,280,281,282]],["newyorker.com",283],["brighteon.com",284],["more.tv",285],["video1tube.com",286],["alohatube.xyz",286],["4players.de",287],["onlinesoccermanager.com",287],["fshost.me",288],["link.cgtips.org",289],["hentaicloud.com",290],["netfapx.com",292],["javdragon.org",292],["njav.tv",292],["paperzonevn.com",293],["hentaienglish.com",294],["hentaiporno.xxx",294],["venge.io",[295,296]],["btcbux.io",297],["its.porn",[298,299]],["atv.at",300],["2ndrun.tv",301],["rackusreads.com",301],["teachmemicro.com",301],["willcycle.com",301],["kusonime.com",[302,303]],["123movieshd.*",304],["imgur.com",[305,306,563]],["hentai-party.com",307],["hentaicomics.pro",307],["xxx-comics.pro",307],["uproxy.*",308],["animesa.*",309],["genshinimpactcalculator.com",310],["mysexgames.com",311],["cinecalidad.*",[312,313]],["embed.indavideo.hu",314],["xnxx.com",315],["xvideos.*",315],["gdr-online.com",316],["mmm.dk",317],["iqiyi.com",[318,319,463]],["m.iqiyi.com",320],["nbcolympics.com",321],["apkhex.com",322],["indiansexstories2.net",323],["issstories.xyz",323],["1340kbbr.com",324],["gorgeradio.com",324],["kduk.com",324],["kedoam.com",324],["kejoam.com",324],["kelaam.com",324],["khsn1230.com",324],["kjmx.rocks",324],["kloo.com",324],["klooam.com",324],["klykradio.com",324],["kmed.com",324],["kmnt.com",324],["kool991.com",324],["kpnw.com",324],["kppk983.com",324],["krktcountry.com",324],["ktee.com",324],["kwro.com",324],["kxbxfm.com",324],["thevalley.fm",324],["quizlet.com",325],["dsocker1234.blogspot.com",326],["schoolcheats.net",[327,328]],["mgnet.xyz",329],["japopav.tv",330],["lvturbo.com",330],["designtagebuch.de",331],["pixroute.com",332],["uploady.io",333],["calculator-online.net",334],["porngames.club",335],["sexgames.xxx",335],["111.90.159.132",336],["battleplan.news",336],["mobile-tracker-free.com",337],["pfps.gg",338],["ac-illust.com",[339,340]],["photo-ac.com",[339,340]],["social-unlock.com",341],["superpsx.com",342],["ninja.io",343],["sourceforge.net",344],["samfirms.com",345],["rapelust.com",346],["vtube.to",346],["vtplay.net",346],["desitelugusex.com",346],["dvdplay.*",346],["xvideos-downloader.net",346],["xxxvideotube.net",346],["sdefx.cloud",346],["nozomi.la",346],["moviesonlinefree.net",346],["banned.video",347],["madmaxworld.tv",347],["androidpolice.com",347],["babygaga.com",347],["backyardboss.net",347],["carbuzz.com",347],["cbr.com",347],["collider.com",347],["dualshockers.com",347],["footballfancast.com",347],["footballleagueworld.co.uk",347],["gamerant.com",347],["givemesport.com",347],["hardcoregamer.com",347],["hotcars.com",347],["howtogeek.com",347],["makeuseof.com",347],["moms.com",347],["movieweb.com",347],["pocket-lint.com",347],["pocketnow.com",347],["screenrant.com",347],["simpleflying.com",347],["thegamer.com",347],["therichest.com",347],["thesportster.com",347],["thethings.com",347],["thetravel.com",347],["topspeed.com",347],["xda-developers.com",347],["huffpost.com",348],["ingles.com",349],["spanishdict.com",349],["surfline.com",[350,351]],["play.tv3.ee",352],["play.tv3.lt",352],["play.tv3.lv",352],["tv3play.skaties.lv",352],["trendyoum.com",353],["bulbagarden.net",354],["hollywoodlife.com",355],["mat6tube.com",356],["textstudio.co",357],["newtumbl.com",358],["apkmaven.*",359],["aruble.net",360],["nevcoins.club",361],["mail.com",362],["gmx.*",363],["oggi.it",[365,366]],["manoramamax.com",365],["video.gazzetta.it",[365,366]],["mangakita.id",367],["mangakita.net",367],["avpgalaxy.net",368],["mhma12.tech",369],["panda-novel.com",370],["zebranovel.com",370],["lightsnovel.com",370],["eaglesnovel.com",370],["pandasnovel.com",370],["zadfaucet.com",371],["ewrc-results.com",372],["kizi.com",373],["cyberscoop.com",374],["fedscoop.com",374],["canale.live",375],["indiatimes.com",376],["netzwelt.de",377],["jeep-cj.com",378],["sponsorhunter.com",379],["cloudcomputingtopics.net",380],["likecs.com",381],["tiscali.it",382],["linkspy.cc",383],["adshnk.com",384],["chattanoogan.com",385],["adsy.pw",386],["playstore.pw",386],["socialmediagirls.com",387],["windowspro.de",388],["snapinst.app",389],["jiocinema.com",390],["rapid-cloud.co",390],["uploadmall.com",390],["rkd3.dev",390],["tvtv.ca",391],["tvtv.us",391],["mydaddy.cc",392],["roadtrippin.fr",393],["vavada5com.com",394],["anyporn.com",[395,412]],["bravoporn.com",395],["bravoteens.com",395],["crocotube.com",395],["hellmoms.com",395],["hellporno.com",395],["sex3.com",395],["tubewolf.com",395],["xbabe.com",395],["xcum.com",395],["zedporn.com",395],["imagetotext.info",396],["infokik.com",397],["freepik.com",398],["ddwloclawek.pl",[399,400]],["www.seznam.cz",401],["deezer.com",[402,707,708]],["my-subs.co",403],["plaion.com",404],["slideshare.net",[405,406]],["ustreasuryyieldcurve.com",407],["businesssoftwarehere.com",408],["goo.st",408],["freevpshere.com",408],["softwaresolutionshere.com",408],["gamereactor.*",410],["madoohd.com",411],["doomovie-hd.*",411],["staige.tv",413],["in-jpn.com",414],["oninet.ne.jp",414],["xth.jp",414],["androidadult.com",415],["streamvid.net",416],["watchtv24.com",417],["cellmapper.net",418],["medscape.com",419],["newscon.org",[420,421]],["arkadium.com",422],["wheelofgold.com",423],["drakecomic.*",423],["app.blubank.com",424],["mobileweb.bankmellat.ir",424],["sportdeutschland.tv",425],["kcra.com",425],["wcvb.com",425],["chat.nrj.fr",426],["chat.tchatche.com",[426,441]],["empire-anime.*",[427,428,429,430,431]],["empire-stream.*",[427,428,429]],["empire-streaming.*",[427,428,429]],["empire-streamz.*",[427,428,429]],["ccthesims.com",433],["chromeready.com",433],["coursedrive.org",433],["dtbps3games.com",433],["illustratemagazine.com",433],["uknip.co.uk",433],["vod.pl",434],["megadrive-emulator.com",435],["tvhay.*",[436,437]],["animesaga.in",438],["moviesapi.club",438],["bestx.stream",438],["watchx.top",438],["digimanie.cz",439],["svethardware.cz",439],["srvy.ninja",440],["cnn.com",[442,443,444]],["edmdls.com",445],["freshremix.net",445],["scenedl.org",445],["trakt.tv",446],["client.falixnodes.net",447],["shroomers.app",448],["classicalradio.com",449],["di.fm",449],["jazzradio.com",449],["radiotunes.com",449],["rockradio.com",449],["zenradio.com",449],["pc-builds.com",450],["qtoptens.com",450],["reuters.com",450],["today.com",450],["videogamer.com",450],["wrestlinginc.com",450],["gbatemp.net",450],["usatoday.com",[451,709]],["ydr.com",451],["getthit.com",452],["techedubyte.com",453],["soccerinhd.com",453],["movie-th.tv",454],["iwanttfc.com",455],["nutraingredients-asia.com",456],["nutraingredients-latam.com",456],["nutraingredients-usa.com",456],["nutraingredients.com",456],["mavenarts.in",457],["ozulscansen.com",458],["nexusmods.com",459],["fitnessbr.click",460],["minhareceita.xyz",460],["doomied.monster",461],["lookmovie.*",461],["lookmovie2.to",461],["royalroad.com",462],["biletomat.pl",464],["hextank.io",[465,466]],["filmizlehdfilm.com",[467,468,469,470]],["filmizletv.*",[467,468,469,470]],["fullfilmizle.cc",[467,468,469,470]],["gofilmizle.net",[467,468,469,470]],["btvplus.bg",472],["sagewater.com",473],["redlion.net",473],["satdl.com",474],["vidstreaming.xyz",475],["everand.com",476],["myradioonline.pl",477],["cbs.com",478],["paramountplus.com",478],["abysscdn.com",[479,480]],["fullxh.com",481],["galleryxh.site",481],["hamsterix.*",481],["megaxh.com",481],["movingxh.world",481],["seexh.com",481],["unlockxh4.com",481],["valuexh.life",481],["xhaccess.com",481],["xhadult2.com",481],["xhadult3.com",481],["xhadult4.com",481],["xhadult5.com",481],["xhamster.*",481],["xhamster1.*",481],["xhamster10.*",481],["xhamster11.*",481],["xhamster12.*",481],["xhamster13.*",481],["xhamster14.*",481],["xhamster15.*",481],["xhamster16.*",481],["xhamster17.*",481],["xhamster18.*",481],["xhamster19.*",481],["xhamster20.*",481],["xhamster2.*",481],["xhamster3.*",481],["xhamster4.*",481],["xhamster42.*",481],["xhamster46.com",481],["xhamster5.*",481],["xhamster7.*",481],["xhamster8.*",481],["xhamsterporno.mx",481],["xhbig.com",481],["xhbranch5.com",481],["xhchannel.com",481],["xhchannel2.com",481],["xhdate.world",481],["xhday.com",481],["xhday1.com",481],["xhlease.world",481],["xhmoon5.com",481],["xhofficial.com",481],["xhopen.com",481],["xhplanet1.com",481],["xhplanet2.com",481],["xhreal2.com",481],["xhreal3.com",481],["xhspot.com",481],["xhtab2.com",481],["xhtab4.com",481],["xhtotal.com",481],["xhtree.com",481],["xhvictory.com",481],["xhwebsite.com",481],["xhwebsite2.com",481],["xhwebsite5.com",481],["xhwide1.com",481],["xhwide2.com",481],["xhwide5.com",481],["file-upload.net",482],["lightnovelworld.*",483],["acortalo.*",[484,485,486,487]],["acortar.*",[484,485,486,487]],["megadescarga.net",[484,485,486,487]],["megadescargas.net",[484,485,486,487]],["hentaihaven.xxx",488],["jacquieetmicheltv2.net",490],["a2zapk.*",491],["fcportables.com",[492,493]],["emurom.net",494],["freethesaurus.com",[495,496]],["thefreedictionary.com",[495,496]],["oeffentlicher-dienst.info",497],["im9.eu",498],["dcdlplayer8a06f4.xyz",499],["ultimate-guitar.com",500],["claimbits.net",501],["sexyscope.net",502],["kickassanime.*",503],["recherche-ebook.fr",504],["virtualdinerbot.com",504],["zonebourse.com",505],["pink-sluts.net",506],["andhrafriends.com",507],["benzinpreis.de",508],["turtleviplay.xyz",509],["paktech2.com",510],["defenseone.com",511],["govexec.com",511],["nextgov.com",511],["route-fifty.com",511],["sharing.wtf",512],["wetter3.de",513],["esportivos.fun",514],["cosmonova-broadcast.tv",515],["hartvannederland.nl",516],["shownieuws.nl",516],["vandaaginside.nl",516],["rock.porn",[517,518]],["videzz.net",[519,520]],["ezaudiobookforsoul.com",521],["club386.com",522],["littlebigsnake.com",523],["easyfun.gg",524],["smailpro.com",525],["ilgazzettino.it",526],["ilmessaggero.it",526],["3bmeteo.com",[527,528]],["mconverter.eu",529],["lover937.net",530],["10gb.vn",531],["pes6.es",532],["tactics.tools",[533,534]],["boundhub.com",535],["alocdnnetu.xyz",536],["reliabletv.me",537],["jakondo.ru",538],["filecrypt.*",539],["nolive.me",541],["wired.com",542],["anonymfile.com",543],["gofile.to",543],["dotycat.com",544],["rateyourmusic.com",545],["reporterpb.com.br",546],["blog-dnz.com",548],["18adultgames.com",549],["colnect.com",[550,551]],["adultgamesworld.com",552],["bgmiupdate.com.in",553],["reviewdiv.com",554],["pvpoke-re.com",[555,556]],["parametric-architecture.com",557],["www.google.*",558],["tacobell.com",559],["zefoy.com",560],["cnet.com",561],["natgeotv.com",564],["spankbang.com",[565,566]],["globo.com",567],["wayfair.com",568],["br.de",569],["indeed.com",570],["pasteboard.co",571],["clickhole.com",572],["deadspin.com",572],["gizmodo.com",572],["jalopnik.com",572],["jezebel.com",572],["kotaku.com",572],["lifehacker.com",572],["splinternews.com",572],["theinventory.com",572],["theonion.com",572],["theroot.com",572],["thetakeout.com",572],["pewresearch.org",572],["los40.com",[573,574]],["as.com",574],["telegraph.co.uk",[575,576]],["poweredbycovermore.com",[575,625]],["lumens.com",[575,625]],["verizon.com",577],["humanbenchmark.com",578],["politico.com",579],["officedepot.co.cr",[580,581]],["officedepot.*",[582,583]],["usnews.com",584],["factable.com",586],["zee5.com",587],["gala.fr",588],["geo.fr",588],["voici.fr",588],["gloucestershirelive.co.uk",589],["arsiv.mackolik.com",590],["jacksonguitars.com",591],["scandichotels.com",592],["stylist.co.uk",593],["nettiauto.com",594],["thaiairways.com",[595,596]],["cerbahealthcare.it",[597,598]],["futura-sciences.com",[597,614]],["toureiffel.paris",597],["tiendaenlinea.claro.com.ni",[599,600]],["tieba.baidu.com",601],["grasshopper.com",[604,605]],["epson.com.cn",[606,607,608,609]],["oe24.at",[610,611]],["szbz.de",610],["platform.autods.com",[612,613]],["wikihow.com",615],["citibank.com.sg",616],["uol.com.br",[617,618,619,620,621]],["gazzetta.gr",622],["digicol.dpm.org.cn",[623,624]],["virginmediatelevision.ie",626],["larazon.es",[627,628]],["waitrosecellar.com",[629,630,631]],["sharpen-free-design-generator.netlify.app",[633,634]],["help.cashctrl.com",[635,636]],["gry-online.pl",637],["vidaextra.com",638],["commande.rhinov.pro",[639,640]],["ecom.wixapps.net",[639,640]],["tipranks.com",[641,642]],["iceland.co.uk",[643,644,645]],["socket.pearsoned.com",646],["tntdrama.com",[647,648]],["trutv.com",[647,648]],["mobile.de",[649,650]],["ioe.vn",[651,652]],["geiriadur.ac.uk",[651,655]],["welsh-dictionary.ac.uk",[651,655]],["bikeportland.org",[653,654]],["biologianet.com",[618,619,620]],["10play.com.au",[656,657]],["sunshine-live.de",[658,659]],["whatismyip.com",[660,661]],["myfitnesspal.com",662],["netoff.co.jp",[663,664]],["foundit.*",[665,666]],["clickjogos.com.br",667],["bristan.com",[668,669]],["zillow.com",670],["optimum.net",[674,675]],["hdfcfund.com",676],["user.guancha.cn",[677,678]],["sosovalue.com",679],["bandyforbundet.no",[680,681]],["tatacommunications.com",682],["suamusica.com.br",[683,684,685]],["macrotrends.net",[686,687]],["code.world",688],["smartcharts.net",688],["topgear.com",689],["eservice.directauto.com",[690,691]],["nbcsports.com",692],["standard.co.uk",693],["pruefernavi.de",[694,695]],["speedtest.net",[696,697]],["17track.net",698],["visible.com",[699,707,708]],["hagerty.com",[700,701]],["kino.de",[702,703]],["9now.nine.com.au",704],["poophq.com",705],["veev.to",705],["doods.to",705],["u26bekrb.fun",706],["acmemarkets.com",[707,708]],["usaa.com",[707,708]],["capezio.com",[707,708]],["twitch.tv",[707,708]],["spotify.com",[707,708]],["tidal.com",[707,708]],["pandora.com",[707,708]],["qobuz.com",[707,708]],["soundcloud.com",[707,708]],["vimeo.com",[707,708]],["x.com",[707,708]],["twitter.com",[707,708]],["eventbrite.com",[707,708]],["wunderground.com",[707,708]],["accuweather.com",[707,708]],["formula1.com",[707,708]],["lenscrafters.com",[707,708]],["subway.com",[707,708]],["ticketmaster.*",[707,708]],["livewithkellyandmark.com",[707,708]],["porsche.com",[707,708]],["uber.com",[707,708]],["jdsports.com",[707,708]],["engadget.com",[707,708]],["yahoo.com",[707,708]],["techcrunch.com",[707,708]],["rivals.com",[707,708]],["kkrt.com",[707,708]],["crunchyroll.com",[707,708]],["dnb.com",[707,708]],["dnb.co.uk",[707,708]],["weather.com",[707,708]],["ubereats.com",[707,708]]]);
const exceptionsMap = new Map([["pingit.com",[21]],["pingit.me",[21]],["lookmovie.studio",[461]]]);
const hasEntities = true;
const hasAncestors = false;

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
