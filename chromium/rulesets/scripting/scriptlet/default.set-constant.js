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
const argsList = [["ytInitialPlayerResponse.playerAds","undefined"],["ytInitialPlayerResponse.adPlacements","undefined"],["ytInitialPlayerResponse.adSlots","undefined"],["playerResponse.adPlacements","undefined"],["ov.advertising.tisoomi.loadScript","noopFunc"],["abp","false"],["nsShowMaxCount","0"],["objVc.interstitial_web",""],["_ml_ads_ns","null"],["_sp_.config","undefined"],["isAdBlockActive","false"],["AdController","noopFunc"],["check_adblock","true"],["console.clear","noopFunc"],["console.log","noopFunc"],["Object.prototype.hideAds","true"],["Object.prototype._getSalesHouseConfigurations","noopFunc"],["vast_urls","{}"],["sadbl","false"],["adblockcheck","false"],["arrvast","[]"],["blurred","false"],["flashvars.adv_pre_src",""],["showPopunder","false"],["page_params.holiday_promo","true"],["adsEnabled","true"],["hommy","{}"],["hommy.waitUntil","noopFunc"],["String.prototype.charAt","trueFunc"],["ad_blocker","false"],["blockAdBlock","true"],["VikiPlayer.prototype.pingAbFactor","noopFunc"],["player.options.disableAds","true"],["console.clear","trueFunc"],["flashvars.adv_pre_vast",""],["flashvars.adv_pre_vast_alt",""],["x_width","1"],["_site_ads_ns","true"],["luxuretv.config",""],["Object.prototype.AdOverlay","noopFunc"],["tkn_popunder","null"],["can_run_ads","true"],["adsBlockerDetector","noopFunc"],["globalThis","null"],["adblock","false"],["__ads","true"],["FlixPop.isPopGloballyEnabled","falseFunc"],["console.clear","undefined"],["$.magnificPopup.open","noopFunc"],["adsenseadBlock","noopFunc"],["adblockSuspected","false"],["xRds","true"],["cRAds","false"],["String.prototype.charCodeAt","trueFunc"],["disasterpingu","false"],["App.views.adsView.adblock","false"],["flashvars.adv_pause_html",""],["$.fx.off","true"],["isAdb","false"],["adBlockEnabled","false"],["puShown","true"],["ads_b_test","true"],["showAds","true"],["attr","{}"],["scriptSrc",""],["cxStartDetectionProcess","noopFunc"],["isAdBlocked","false"],["adblock","noopFunc"],["path",""],["_ctrl_vt.blocked.ad_script","false"],["blockAdBlock","noopFunc"],["caca","noopFunc"],["Ok","true"],["safelink.adblock","false"],["ClickUnder","noopFunc"],["flashvars.adv_pre_url",""],["flashvars.protect_block",""],["flashvars.video_click_url",""],["adBlock","false"],["spoof","noopFunc"],["btoa","null"],["sp_ad","true"],["adsBlocked","false"],["_sp_.msg.displayMessage","noopFunc"],["CaptchmeState.adb","undefined"],["indexedDB.open","trueFunc"],["UhasAB","false"],["adNotificationDetected","false"],["atob","noopFunc"],["_pop","noopFunc"],["CnnXt.Event.fire","noopFunc"],["_ti_update_user","noopFunc"],["valid","1"],["vastAds","[]"],["adblock","1"],["frg","1"],["time","0"],["vpPrerollVideo","undefined"],["ads","true"],["GNCA_Ad_Support","true"],["Date.now","noopFunc"],["jQuery.adblock","1"],["VMG.Components.Adblock","false"],["_n_app.popunder","null"],["adblockDetector","trueFunc"],["hasPoped","true"],["flashvars.video_click_url","undefined"],["flashvars.adv_start_html",""],["flashvars.popunder_url",""],["flashvars.adv_post_src",""],["flashvars.adv_post_url",""],["jQuery.adblock","false"],["google_jobrunner","true"],["sec","0"],["gadb","false"],["checkadBlock","noopFunc"],["clientSide.adbDetect","noopFunc"],["HTMLAnchorElement.prototype.click","noopFunc"],["cmnnrunads","true"],["adBlocker","false"],["adBlockDetected","noopFunc"],["StileApp.somecontrols.adBlockDetected","noopFunc"],["MDCore.adblock","0"],["google_tag_data","noopFunc"],["noAdBlock","true"],["PlayerConfig.config.CustomAdSetting","[]"],["adsOk","true"],["Object.prototype._parseVAST","noopFunc"],["Object.prototype.createAdBlocker","noopFunc"],["Object.prototype.isAdPeriod","falseFunc"],["check","true"],["isal","true"],["document.hidden","true"],["awm","true"],["adblockEnabled","false"],["is_adblocked","false"],["ABLK","false"],["pogo.intermission.staticAdIntermissionPeriod","0"],["SubmitDownload1","noopFunc"],["t","0"],["ckaduMobilePop","noopFunc"],["tieneAdblock","0"],["adsAreBlocked","false"],["cmgpbjs","false"],["displayAdblockOverlay","false"],["google","false"],["Math.pow","noopFunc"],["openInNewTab","noopFunc"],["loadingAds","true"],["runAdBlocker","false"],["td_ad_background_click_link","undefined"],["Adblock","false"],["flashvars.logo_url",""],["flashvars.logo_text",""],["nlf.custom.userCapabilities","false"],["decodeURIComponent","trueFunc"],["count","0"],["LoadThisScript","true"],["showPremLite","true"],["closeBlockerModal","false"],["adBlockDetector.isEnabled","falseFunc"],["areAdsDisplayed","true"],["gkAdsWerbung","true"],["document.bridCanRunAds","true"],["pop_target","null"],["is_banner","true"],["$easyadvtblock","false"],["show_dfp_preroll","false"],["show_youtube_preroll","false"],["doads","true"],["jsUnda","noopFunc"],["AlobaidiDetectAdBlock","true"],["Advertisement","1"],["adBlockDetected","false"],["abp1","1"],["pr_okvalida","true"],["$.ajax","trueFunc"],["cnbc.canShowAds","true"],["Adv_ab","false"],["ue_adb_chk","1"],["firefaucet","true"],["cRAds","true"],["uas","[]"],["flashvars.popunder_url","undefined"],["adv","true"],["prerollMain","undefined"],["canRunAds","true"],["Fingerprint2","true"],["dclm_ajax_var.disclaimer_redirect_url",""],["load_pop_power","noopFunc"],["adBlockDetected","true"],["Time_Start","0"],["blockAdBlock","trueFunc"],["ezstandalone.enabled","true"],["foundation.adPlayer.bitmovin","{}"],["DL8_GLOBALS.enableAdSupport","false"],["DL8_GLOBALS.useHomad","false"],["DL8_GLOBALS.enableHomadDesktop","false"],["DL8_GLOBALS.enableHomadMobile","false"],["Object.prototype.adReinsertion","noopFunc"],["getHomadConfig","noopFunc"],["ab","false"],["go_popup","{}"],["noBlocker","true"],["adsbygoogle","null"],["fabActive","false"],["gWkbAdVert","true"],["noblock","true"],["wgAffiliateEnabled","false"],["ads","null"],["detectAdblock","noopFunc"],["adsLoadable","true"],["ASSetCookieAds","null"],["letShowAds","true"],["ulp_noadb","true"],["Object.prototype.adblock_detected","false"],["timeSec","0"],["adsbygoogle.loaded","true"],["ads_unblocked","true"],["xxSetting.adBlockerDetection","false"],["open","undefined"],["Drupal.behaviors.adBlockerPopup","null"],["fake_ad","true"],["flashvars.mlogo",""],["koddostu_com_adblock_yok","null"],["adsbygoogle","trueFunc"],["player.ads.cuePoints","undefined"],["adBlockDetected","null"],["better_ads_adblock","1"],["hold_click","false"],["sgpbCanRunAds","true"],["document.hidden","false"],["document.hasFocus","trueFunc"],["hasFocus","trueFunc"],["Object.prototype.isAllAdClose","true"],["isRequestPresent","true"],["fouty","true"],["Notification","undefined"],["protection","noopFunc"],["private","false"],["navigator.webkitTemporaryStorage.queryUsageAndQuota","noopFunc"],["document.onkeydown","noopFunc"],["showadas","true"],["alert","throwFunc"],["app_vars.please_disable_adblock","undefined"],["iktimer","0"],["aSl.gcd","0"],["delayClick","false"],["counter","10"],["window.adLink","null"],["sensorsDataAnalytic201505","{}"],["detectedAdblock","undefined"],["isTabActive","true"],["pubAdsService","trueFunc"],["config.pauseInspect","false"],["appContext.adManager.context.current.adFriendly","false"],["blockAdBlock._options.baitClass","null"],["document.blocked_var","1"],["____ads_js_blocked","false"],["wIsAdBlocked","false"],["WebSite.plsDisableAdBlock","null"],["ads_blocked","false"],["samDetected","false"],["countClicks","0"],["settings.adBlockerDetection","false"],["mixpanel.get_distinct_id","true"],["fuckAdBlock._options.baitClass","null"],["bscheck.adblocker","noopFunc"],["qpcheck.ads","noopFunc"],["isContentBlocked","falseFunc"],["CloudflareApps.installs.Ik7rmQ4t95Qk.options.measureDomain","undefined"],["detectAB1","noopFunc"],["uBlockOriginDetected","false"],["googletag._vars_","{}"],["googletag._loadStarted_","true"],["googletag._loaded_","true"],["google_unique_id","1"],["google.javascript","{}"],["google.javascript.ads","{}"],["google_global_correlator","1"],["paywallGateway.truncateContent","noopFunc"],["adBlockDisabled","true"],["blockedElement","noopFunc"],["popit","false"],["adBlockerDetected","false"],["abu","falseFunc"],["countdown","0"],["decodeURI","noopFunc"],["flashvars.adv_postpause_vast",""],["univresalP","noopFunc"],["xv_ad_block","0"],["vidorev_jav_plugin_video_ads_object.vid_ads_m_video_ads",""],["adsProvider.init","noopFunc"],["SDKLoaded","true"],["blockAdBlock._creatBait","null"],["POPUNDER_ENABLED","false"],["plugins.preroll","noopFunc"],["errcode","0"],["DHAntiAdBlocker","true"],["showada","true"],["showax","true"],["p18","undefined"],["ADBLOCKED","false"],["Object.prototype.adsEnabled","false"],["adb","0"],["String.fromCharCode","trueFunc"],["adblock_use","false"],["Object.prototype.adblockFound","false"],["nitroAds.loaded","true"],["createCanvas","noopFunc"],["playerAdSettings.adLink",""],["playerAdSettings.waitTime","0"],["AdHandler.adblocked","0"],["xv.sda.pp.init","noopFunc"],["isAdsLoaded","true"],["adblockerAlert","noopFunc"],["Object.prototype.parseXML","noopFunc"],["Object.prototype.blackscreenDuration","1"],["Object.prototype.adPlayerId",""],["adblockDetect","noopFunc"],["style","noopFunc"],["history.pushState","noopFunc"],["google_unique_id","6"],["__NEXT_DATA__.props.pageProps.adsConfig","undefined"],["new_config.timedown","0"],["truex","{}"],["truex.client","noopFunc"],["hiddenProxyDetected","false"],["isadb","false"],["SteadyWidgetSettings.adblockActive","false"],["proclayer","noopFunc"],["timeleft","0"],["load_ads","trueFunc"],["detectAdBlock","noopFunc"],["starPop","1"],["Object.prototype.ads","noopFunc"],["detectBlockAds","noopFunc"],["ga","trueFunc"],["ad_link",""],["penciBlocksArray","[]"],["App.AdblockDetected","false"],["SF.adblock","true"],["startfrom","0"],["D4zz","noopFunc"],["Object.prototype.ads.nopreroll_","true"],["HP_Scout.adBlocked","false"],["SD_IS_BLOCKING","false"],["Object.prototype.isPremium","true"],["__BACKPLANE_API__.renderOptions.showAdBlock",""],["Object.prototype.isNoAds","{}"],["countDownDate","0"],["setupSkin","noopFunc"],["Object.prototype.enableInterstitial","false"],["ads","undefined"],["ADBLOCK","false"],["POSTPART_prototype.ADKEY","noopFunc"],["adBlockDetected","falseFunc"],["divWidth","1"],["noAdBlock","noopFunc"],["AdService.info.abd","noopFunc"],["adBlockDetectionResult","undefined"],["popped","true"],["google.ima.OmidVerificationVendor","{}"],["Object.prototype.omidAccessModeRules","{}"],["puShown1","true"],["passthetest","true"],["timeset","0"],["pandaAdviewValidate","true"],["canGetAds","true"],["ad_blocker_active","false"],["init_welcome_ad","noopFunc"],["moneyAbovePrivacyByvCDN","true"],["objAd.loadAdShield","noopFunc"],["window.myAd.runAd","noopFunc"],["document.body.contains","trueFunc"],["popunder","undefined"],["distance","0"],["document.onclick",""],["adEnable","true"],["displayAds","0"],["_adshrink.skiptime","0"],["AbleToRunAds","true"],["PreRollAd.timeCounter","0"],["TextEncoder","undefined"],["abpblocked","undefined"],["app.showModalAd","noopFunc"],["navigator.brave","undefined"],["paAddUnit","noopFunc"],["adt","0"],["test_adblock","noopFunc"],["adblockDetector","noopFunc"],["vastEnabled","false"],["detectadsbocker","false"],["two_worker_data_js.js","[]"],["FEATURE_DISABLE_ADOBE_POPUP_BY_COUNTRY","true"],["questpassGuard","noopFunc"],["isAdBlockerEnabled","false"],["sssp","emptyObj"],["smartLoaded","true"],["timeLeft","0"],["Cookiebot","noopFunc"],["feature_flags.interstitial_ads_flag","false"],["feature_flags.interstitials_every_four_slides","false"],["waldoSlotIds","true"],["adblockstatus","false"],["adScriptLoaded","true"],["adblockEnabled","noopFunc"],["adSettings","[]"],["banner_is_blocked","false"],["Object.prototype.adBlocked","false"],["myFunc","noopFunc"],["chp_adblock_browser","noopFunc"],["googleAd","true"],["Brid.A9.prototype.backfillAdUnits","[]"],["dct","0"],["slideShow.displayInterstitial","true"],["googletag","true"],["tOS2","150"],["__INITIAL_STATE__.gameLists.gamesNoPrerollIds.indexOf","trueFunc"],["checkAdBlocker","noopFunc"],["navigator.standalone","true"],["google.ima.settings.setDisableFlashAds","noopFunc"],["ShowAdvertising","{}"],["empire.pop","undefined"],["empire.direct","undefined"],["empire.directHideAds","undefined"],["empire.mediaData.advisorMovie","1"],["empire.mediaData.advisorSerie","1"],["setTimer","0"],["penci_adlbock.ad_blocker_detector","0"],["Object.prototype.adblockDetector","noopFunc"],["blext","true"],["vidorev_jav_plugin_video_ads_object","{}"],["vidorev_jav_plugin_video_ads_object_post","{}"],["S_Popup","10"],["rabLimit","-1"],["nudgeAdBlock","noopFunc"],["feedBack.showAffilaePromo","noopFunc"],["FAVE.settings.ads.ssai.prod.clips.enabled","false"],["FAVE.settings.ads.ssai.prod.liveAuth.enabled","false"],["FAVE.settings.ads.ssai.prod.liveUnauth.enabled","false"],["loadpagecheck","noopFunc"],["art3m1sItemNames.affiliate-wrapper","\"\""],["window.adngin","{}"],["isAdBlockerActive","noopFunc"],["di.app.WebplayerApp.Ads.Adblocks.app.AdBlockDetectApp.startWithParent","false"],["admiral","noopFunc"],["gnt.u.adfree","true"],["sharedController.adblockDetector","noopFunc"],["checkAdsStatus","noopFunc"],["ads","[]"],["settings.adBlockDetectionEnabled","false"],["displayInterstitialAdConfig","false"],["checkAdBlockeraz","noopFunc"],["blockingAds","false"],["Yii2App.playbackTimeout","0"],["isPremium","true"],["QiyiPlayerProphetData.a.data","{}"],["toggleAdBlockInfo","falseFunc"],["aipAPItag.prerollSkipped","true"],["aipAPItag.setPreRollStatus","trueFunc"],["reklam_1_saniye","0"],["reklam_1_gecsaniye","0"],["reklamsayisi","1"],["reklam_1",""],["powerAPITag","emptyObj"],["playerEnhancedConfig.run","throwFunc"],["aoAdBlockDetected","false"],["xtime","0"],["Div_popup",""],["Scribd.Blob.AdBlockerModal","noopFunc"],["AddAdsV2I.addBlock","false"],["hasAdBlocker","false"],["document.ontouchend","null"],["document.onclick","null"],["initials.yld-pdpopunder",""],["advertisement3","true"],["importFAB","undefined"],["clicked","true"],["eClicked","true"],["number","0"],["sync","true"],["PlayerLogic.prototype.detectADB","noopFunc"],["showPopunder","noopFunc"],["Object.prototype.prerollAds","[]"],["notifyMe","noopFunc"],["adsClasses","undefined"],["gsecs","0"],["dvsize","52"],["majorse","true"],["completed","1"],["testerli","false"],["w87.abd","noopFunc"],["document.referrer",""],["Object.prototype.setNeedShowAdblockWarning","noopFunc"],["NoAdBlock","noopFunc"],["adList","[]"],["ifmax","true"],["nitroAds.abp","true"],["onloadUI","noopFunc"],["PageLoader.DetectAb","0"],["one_time","1"],["consentGiven","true"],["playID","1"],["openPopunder","noopFunc"],["GEMG.GPT.Interstitial","noopFunc"],["amiblock","0"],["karte3","18"],["sandDetect","noopFunc"],["amodule.data","emptyArr"],["Object.prototype.ADBLOCK_DETECTION",""],["postroll","undefined"],["interstitial","undefined"],["isAdBlockDetected","false"],["pData.adblockOverlayEnabled","0"],["cabdSettings","undefined"],["td_ad_background_click_link"],["ADS.isBannersEnabled","false"],["EASYFUN_ADS_CAN_RUN","true"],["adsbygoogle_ama_fc_has_run","true"],["jwDefaults.advertising","{}"],["elimina_profilazione","1"],["elimina_pubblicita","1"],["abd","{}"],["checkerimg","noopFunc"],["detectedAdblock","noopFunc"],["Object.prototype.DetectByGoogleAd","noopFunc"],["nitroAds","{}"],["nitroAds.createAd","noopFunc"],["NativeAd","noopFunc"],["Blob","noopFunc"],["window.navigator.brave","undefined"],["HTMLScriptElement.prototype.onerror","undefined"],["isAdblock","false"],["openPop","noopFunc"],["attachEvent","trueFunc"],["cns.library","true"],["BJSShowUnder","{}"],["BJSShowUnder.bindTo","noopFunc"],["BJSShowUnder.add","noopFunc"],["countDown","0"],["runCheck","noopFunc"],["adsSlotRenderEndSeen","true"],["showModal","noopFunc"],["flashvars.mlogo_link",""],["isAdBlocked","noopFunc"],["URLlist","[]"],["aaw","{}"],["aaw.processAdsOnPage","noopFunc"],["doOpen","undefined"],["HTMLImageElement.prototype.onerror","undefined"],["FOXIZ_MAIN_SCRIPT.siteAccessDetector","noopFunc"],["firstChecker","noopFunc"],["openAdBlockPopup","noopFunc"],["Object.prototype._adsDisabled","true"],["rodo.checkIsDidomiConsent","noopFunc"],["rodo.waitForConsent","noopPromiseResolve"],["advanced_ads_check_adblocker","noopFunc"],["canRunAds","1"],["rwt","noopFunc"],["bmak.js_post","false"],["firebase.analytics","noopFunc"],["Object.prototype.updateModifiedCommerceUrl","noopFunc"],["flashvars.event_reporting",""],["Object.prototype.has_opted_out_tracking","trueFunc"],["Visitor","{}"],["send_gravity_event","noopFunc"],["send_recommendation_event","noopFunc"],["libAnalytics.data.get","noopFunc"],["adthrive._components.start","noopFunc"],["navigator.sendBeacon","noopFunc"],["akamaiDisableServerIpLookup","noopFunc"],["DD_RUM.addAction","noopFunc"],["nads.createAd","trueFunc"],["ga","noopFunc"],["huecosPBS.nstdX","null"],["DTM.trackAsyncPV","noopFunc"],["_satellite","{}"],["_satellite.getVisitorId","noopFunc"],["newPageViewSpeedtest","noopFunc"],["pubg.unload","noopFunc"],["generateGalleryAd","noopFunc"],["mediator","noopFunc"],["Object.prototype.subscribe","noopFunc"],["gbTracker","{}"],["gbTracker.sendAutoSearchEvent","noopFunc"],["Object.prototype.vjsPlayer.ads","noopFunc"],["network_user_id",""],["googletag.cmd","{}"],["Object.prototype.setDisableFlashAds","noopFunc"],["DD_RUM.addTiming","noopFunc"],["chameleonVideo.adDisabledRequested","true"],["AdmostClient","{}"],["analytics","{}"],["datalayer","[]"],["Object.prototype.isInitialLoadDisabled","noopFunc"],["listingGoogleEETracking","noopFunc"],["dcsMultiTrack","noopFunc"],["urlStrArray","noopFunc"],["pa","{}"],["Object.prototype.setConfigurations","noopFunc"],["Object.prototype.bk_addPageCtx","noopFunc"],["Object.prototype.bk_doJSTag","noopFunc"],["passFingerPrint","noopFunc"],["optimizely","{}"],["optimizely.initialized","true"],["google_optimize","{}"],["google_optimize.get","noopFunc"],["_gsq","{}"],["_gsq.push","noopFunc"],["stmCustomEvent","noopFunc"],["_gsDevice",""],["iom","{}"],["iom.c","noopFunc"],["_conv_q","{}"],["_conv_q.push","noopFunc"],["pa.privacy","{}"],["Object.prototype.getTargetingMap","noopFunc"],["populateClientData4RBA","noopFunc"],["YT.ImaManager","noopFunc"],["UOLPD","{}"],["UOLPD.dataLayer","{}"],["__configuredDFPTags","{}"],["URL_VAST_YOUTUBE","{}"],["Adman","{}"],["dplus","{}"],["dplus.track","noopFunc"],["_satellite.track","noopFunc"],["google.ima.dai","{}"],["gfkS2sExtension","{}"],["gfkS2sExtension.HTML5VODExtension","noopFunc"],["AnalyticsEventTrackingJS","{}"],["AnalyticsEventTrackingJS.addToBasket","noopFunc"],["AnalyticsEventTrackingJS.trackErrorMessage","noopFunc"],["initializeslideshow","noopFunc"],["fathom","{}"],["fathom.trackGoal","noopFunc"],["Origami","{}"],["Origami.fastclick","noopFunc"],["jad","undefined"],["hasAdblocker","true"],["Sentry","{}"],["Sentry.init","noopFunc"],["TRC","{}"],["TRC._taboolaClone","[]"],["fp","{}"],["fp.t","noopFunc"],["fp.s","noopFunc"],["initializeNewRelic","noopFunc"],["turnerAnalyticsObj","{}"],["turnerAnalyticsObj.setVideoObject4AnalyticsProperty","noopFunc"],["optimizelyDatafile","{}"],["optimizelyDatafile.featureFlags","[]"],["fingerprint","{}"],["fingerprint.getCookie","noopFunc"],["gform.utils","noopFunc"],["gform.utils.trigger","noopFunc"],["get_fingerprint","noopFunc"],["moatPrebidApi","{}"],["moatPrebidApi.getMoatTargetingForPage","noopFunc"],["cpd_configdata","{}"],["cpd_configdata.url",""],["yieldlove_cmd","{}"],["yieldlove_cmd.push","noopFunc"],["dataLayer.push","noopFunc"],["_etmc","{}"],["_etmc.push","noopFunc"],["freshpaint","{}"],["freshpaint.track","noopFunc"],["ShowRewards","noopFunc"],["stLight","{}"],["stLight.options","noopFunc"],["DD_RUM.addError","noopFunc"],["sensorsDataAnalytic201505.init","noopFunc"],["sensorsDataAnalytic201505.quick","noopFunc"],["sensorsDataAnalytic201505.track","noopFunc"],["s","{}"],["s.tl","noopFunc"],["smartech","noopFunc"],["sensors","{}"],["sensors.init","noopFunc"],["sensors.track","noopFunc"],["adn","{}"],["adn.clearDivs","noopFunc"],["_vwo_code","{}"],["gtag","noopFunc"],["_taboola","{}"],["_taboola.push","noopFunc"],["clicky","{}"],["clicky.goal","noopFunc"],["WURFL","{}"],["_sp_.config.events.onSPPMObjectReady","noopFunc"],["gtm","{}"],["gtm.trackEvent","noopFunc"],["mParticle.Identity.getCurrentUser","noopFunc"],["JSGlobals.prebidEnabled","false"],["elasticApm","{}"],["elasticApm.init","noopFunc"],["Object.prototype.que","noopFunc"],["Object.prototype.que.push","noopFunc"],["ga.sendGaEvent","noopFunc"],["adobe","{}"],["MT","{}"],["MT.track","noopFunc"],["adex","{}"],["adex.getAdexUser","noopFunc"],["Adkit","noopFunc"],["Object.prototype.shouldExpectGoogleCMP","false"],["adBlockDetected","undefined"],["Navigator.prototype.globalPrivacyControl","false"],["navigator.globalPrivacyControl","false"],["gnt.x.adm",""]];
const hostnamesMap = new Map([["m.youtube.com",[0,1,2,3]],["music.youtube.com",[0,1,2,3]],["tv.youtube.com",[0,1,2,3]],["www.youtube.com",[0,1,2,3]],["youtubekids.com",[0,1,2,3]],["youtube-nocookie.com",[0,1,2,3]],["eu-proxy.startpage.com",[0,1,3]],["kicker.de",[4,634]],["t-online.de",5],["timesofindia.indiatimes.com",6],["economictimes.indiatimes.com",7],["motherless.com",8],["sueddeutsche.de",9],["watchanimesub.net",10],["wco.tv",10],["wcoanimesub.tv",10],["wcoforever.net",10],["freeviewmovies.com",10],["filehorse.com",10],["guidetnt.com",10],["starmusiq.*",10],["sp-today.com",10],["linkvertise.com",10],["eropaste.net",10],["getpaste.link",10],["sharetext.me",10],["wcofun.*",10],["note.sieuthuthuat.com",10],["elcriticodelatele.com",[10,298]],["gadgets.es",[10,298]],["amateurporn.co",[10,108]],["wiwo.de",11],["kissasian.*",12],["gogoanime.*",[12,47]],["1movies.*",[12,53]],["xmovies8.*",12],["masteranime.tv",12],["0123movies.*",12],["gostream.*",12],["gomovies.*",12],["primewire.*",13],["streanplay.*",[13,14]],["alphaporno.com",[13,391]],["porngem.com",13],["shortit.pw",[13,92]],["familyporn.tv",13],["sbplay.*",13],["id45.cyou",13],["85tube.com",[13,76]],["milfnut.*",13],["k1nk.co",13],["watchasians.cc",13],["soltoshindo.com",13],["sankakucomplex.com",15],["player.glomex.com",16],["merkur.de",16],["tz.de",16],["sxyprn.*",17],["hqq.*",[18,19]],["waaw.*",[19,20]],["hotpornfile.org",19],["player.tabooporns.com",19],["x69.ovh",19],["wiztube.xyz",19],["younetu.*",19],["multiup.us",19],["rpdrlatino.live",19],["peliculas8k.com",[19,20]],["video.q34r.org",19],["czxxx.org",19],["vtplayer.online",19],["vvtplayer.*",19],["netu.ac",19],["netu.frembed.lol",19],["dirtyvideo.fun",20],["adbull.org",21],["123link.*",21],["adshort.*",21],["mitly.us",21],["linkrex.net",21],["linx.cc",21],["oke.io",21],["linkshorts.*",21],["dz4link.com",21],["adsrt.*",21],["linclik.com",21],["shrt10.com",21],["vinaurl.*",21],["loptelink.com",21],["adfloz.*",21],["cut-fly.com",21],["linkfinal.com",21],["payskip.org",21],["cutpaid.com",21],["forexmab.com",21],["linkjust.com",21],["linkszia.co",21],["leechpremium.link",21],["icutlink.com",[21,113]],["oncehelp.com",21],["rgl.vn",21],["reqlinks.net",21],["bitlk.com",21],["qlinks.eu",21],["link.3dmili.com",21],["short-fly.com",21],["foxseotools.com",21],["dutchycorp.*",21],["shortearn.*",21],["pingit.*",21],["pngit.live",21],["link.turkdown.com",21],["urlty.com",21],["7r6.com",21],["oko.sh",21],["ckk.ai",21],["fc.lc",21],["fstore.biz",21],["shrink.*",21],["cuts-url.com",21],["eio.io",21],["exe.app",21],["exee.io",21],["exey.io",21],["skincarie.com",21],["exeo.app",21],["tmearn.*",21],["coinlyhub.com",[21,187]],["adsafelink.com",21],["aii.sh",21],["megalink.*",21],["cybertechng.com",[21,202]],["cutdl.xyz",21],["iir.ai",21],["shorteet.com",[21,220]],["miniurl.*",21],["smoner.com",21],["gplinks.*",21],["odisha-remix.com",[21,202]],["xpshort.com",[21,202]],["upshrink.com",21],["clk.*",21],["easysky.in",21],["veganab.co",21],["go.bloggingaro.com",21],["go.gyanitheme.com",21],["go.theforyou.in",21],["go.hipsonyc.com",21],["birdurls.com",21],["vipurl.in",21],["try2link.com",21],["jameeltips.us",21],["gainl.ink",21],["promo-visits.site",21],["satoshi-win.xyz",[21,236]],["shorterall.com",21],["encurtandourl.com",21],["forextrader.site",21],["postazap.com",21],["cety.app",21],["exego.app",[21,232]],["cutlink.net",21],["cutsy.net",21],["cutyurls.com",21],["cutty.app",21],["cutnet.net",21],["jixo.online",21],["tinys.click",[21,202]],["cpm.icu",21],["panyshort.link",21],["enagato.com",21],["pandaznetwork.com",21],["tvi.la",21],["iir.la",21],["tii.la",21],["oei.la",21],["lnbz.la",[21,216]],["oii.la",[21,244]],["tpi.li",[21,244]],["recipestutorials.com",21],["pureshort.*",21],["shrinke.*",21],["shrinkme.*",21],["shrinkforearn.in",21],["techyuth.xyz",21],["oii.io",21],["du-link.in",21],["atglinks.com",21],["thotpacks.xyz",21],["megaurl.in",21],["megafly.in",21],["simana.online",21],["fooak.com",21],["joktop.com",21],["evernia.site",21],["falpus.com",21],["link.paid4link.com",[21,248]],["exalink.fun",21],["shortxlinks.com",21],["upfiles.app",21],["upfiles-urls.com",21],["flycutlink.com",[21,202]],["linksly.co",21],["link1s.*",21],["pkr.pw",21],["imagenesderopaparaperros.com",21],["shortenbuddy.com",21],["apksvip.com",21],["4cash.me",21],["namaidani.com",21],["shortzzy.*",21],["teknomuda.com",21],["shorttey.*",[21,186]],["miuiku.com",21],["savelink.site",21],["lite-link.*",21],["adcorto.*",21],["samaa-pro.com",21],["miklpro.com",21],["modapk.link",21],["ccurl.net",21],["linkpoi.me",21],["menjelajahi.com",21],["pewgame.com",21],["haonguyen.top",21],["zshort.*",21],["crazyblog.in",21],["gtlink.co",21],["cutearn.net",21],["rshrt.com",21],["filezipa.com",21],["dz-linkk.com",21],["upfiles.*",21],["theblissempire.com",21],["finanzas-vida.com",21],["adurly.cc",21],["paid4.link",21],["link.asiaon.top",21],["go.gets4link.com",21],["download.sharenulled.net",21],["linkfly.*",21],["beingtek.com",21],["shorturl.unityassets4free.com",21],["disheye.com",21],["techymedies.com",21],["techysuccess.com",21],["za.gl",[21,132]],["bblink.com",21],["myad.biz",21],["swzz.xyz",21],["vevioz.com",21],["charexempire.com",21],["clk.asia",21],["linka.click",21],["sturls.com",21],["myshrinker.com",21],["snowurl.com",[21,202]],["netfile.cc",21],["wplink.*",21],["rocklink.in",21],["techgeek.digital",21],["download3s.net",21],["shortx.net",21],["shortawy.com",21],["tlin.me",21],["apprepack.com",21],["up-load.one",21],["zuba.link",21],["bestcash2020.com",21],["hoxiin.com",21],["go.linkbnao.com",21],["link-yz.com",21],["paylinnk.com",21],["thizissam.in",21],["ier.ai",21],["adslink.pw",21],["novelssites.com",21],["links.medipost.org",21],["faucetcrypto.net",21],["short.freeltc.top",21],["trxking.xyz",21],["weadown.com",21],["m.bloggingguidance.com",21],["blog.onroid.com",21],["link.codevn.net",21],["upfilesurls.com",21],["shareus.site",21],["link4rev.site",21],["c2g.at",21],["bitcosite.com",[21,405]],["cryptosh.pro",21],["link68.net",21],["traffic123.net",21],["windowslite.net",[21,202]],["viewfr.com",21],["cl1ca.com",21],["4br.me",21],["fir3.net",21],["seulink.*",21],["encurtalink.*",21],["kiddyshort.com",21],["watchmygf.me",[22,48]],["camwhores.*",[22,34,75,76,77]],["camwhorez.tv",[22,34,75,76]],["cambay.tv",[22,56,75,105,107,108,109,110]],["fpo.xxx",[22,56]],["sexemix.com",22],["heavyfetish.com",[22,563]],["thotcity.su",22],["viralxxxporn.com",[22,223]],["tube8.*",[23,24]],["you-porn.com",24],["youporn.*",24],["youporngay.com",24],["youpornru.com",24],["redtube.*",24],["9908ww.com",24],["adelaidepawnbroker.com",24],["bztube.com",24],["hotovs.com",24],["insuredhome.org",24],["nudegista.com",24],["pornluck.com",24],["vidd.se",24],["pornhub.*",[24,174]],["pornhub.com",24],["pornerbros.com",25],["freep.com",25],["upornia.*",[26,27]],["porn.com",28],["tune.pk",29],["noticias.gospelmais.com.br",30],["techperiod.com",30],["viki.com",[31,32]],["watch-series.*",33],["watchseries.*",33],["vev.*",33],["vidop.*",33],["vidup.*",33],["sleazyneasy.com",[34,35,36]],["smutr.com",[34,183]],["yourporngod.com",[34,35]],["javbangers.com",[34,288]],["camfox.com",34],["camthots.tv",[34,105]],["shegotass.info",34],["amateur8.com",34],["bigtitslust.com",34],["ebony8.com",34],["freeporn8.com",34],["lesbian8.com",34],["maturetubehere.com",34],["sortporn.com",34],["webcamvau.com",34],["motherporno.com",[34,35,56,107]],["tktube.com",34],["theporngod.com",[34,35]],["watchdirty.to",[34,76,77,108]],["pornsocket.com",37],["luxuretv.com",38],["porndig.com",[39,40]],["webcheats.com.br",41],["ceesty.com",[42,43]],["gestyy.com",[42,43]],["corneey.com",43],["destyy.com",43],["festyy.com",43],["sh.st",43],["mitaku.net",43],["angrybirdsnest.com",44],["zrozz.com",44],["clix4btc.com",44],["4tests.com",44],["business-standard.com",44],["goltelevision.com",44],["news-und-nachrichten.de",44],["laradiobbs.net",44],["urlaubspartner.net",44],["produktion.de",44],["cinemaxxl.de",44],["bladesalvador.com",44],["tempr.email",44],["cshort.org",44],["friendproject.net",44],["covrhub.com",44],["katfile.com",44],["trust.zone",44],["planetsuzy.org",45],["empflix.com",46],["heatherwholeinvolve.com",47],["alejandrocenturyoil.com",47],["alleneconomicmatter.com",47],["apinchcaseation.com",47],["bethshouldercan.com",47],["bigclatterhomesguideservice.com",47],["bradleyviewdoctor.com",47],["brittneystandardwestern.com",47],["brookethoughi.com",47],["brucevotewithin.com",47],["cindyeyefinal.com",47],["denisegrowthwide.com",47],["donaldlineelse.com",47],["edwardarriveoften.com",47],["erikcoldperson.com",47],["evelynthankregion.com",47],["graceaddresscommunity.com",47],["heatherdiscussionwhen.com",47],["housecardsummerbutton.com",47],["jamessoundcost.com",47],["jamesstartstudent.com",47],["jamiesamewalk.com",47],["jasminetesttry.com",47],["jasonresponsemeasure.com",47],["jayservicestuff.com",47],["jessicaglassauthor.com",47],["johntryopen.com",47],["josephseveralconcern.com",47],["kennethofficialitem.com",47],["lisatrialidea.com",47],["lorimuchbenefit.com",47],["loriwithinfamily.com",47],["lukecomparetwo.com",47],["markstyleall.com",47],["michaelapplysome.com",47],["morganoperationface.com",47],["nectareousoverelate.com",47],["paulkitchendark.com",47],["rebeccaneverbase.com",47],["roberteachfinal.com",47],["robertordercharacter.com",47],["robertplacespace.com",47],["ryanagoinvolve.com",47],["sandratableother.com",47],["sandrataxeight.com",47],["seanshowcould.com",47],["sethniceletter.com",47],["shannonpersonalcost.com",47],["sharonwhiledemocratic.com",47],["stevenimaginelittle.com",47],["strawberriesporail.com",47],["susanhavekeep.com",47],["timberwoodanotia.com",47],["tinycat-voe-fashion.com",47],["toddpartneranimal.com",47],["troyyourlead.com",47],["uptodatefinishconference.com",47],["uptodatefinishconferenceroom.com",47],["vincentincludesuccessful.com",47],["voe.sx",47],["maxfinishseveral.com",47],["motphimtv.com",47],["rabbitstream.net",47],["projectfreetv.one",47],["fmovies.*",47],["freeplayervideo.com",47],["nazarickol.com",47],["player-cdn.com",47],["playhydrax.com",[47,473,474]],["transparentcalifornia.com",48],["deepbrid.com",49],["webnovel.com",50],["streamwish.*",[51,52]],["oneupload.to",52],["wishfast.top",52],["rubystm.com",52],["rubyvid.com",52],["schwaebische.de",54],["8tracks.com",55],["3movs.com",56],["bravoerotica.net",[56,107]],["youx.xxx",56],["camclips.tv",[56,183]],["xtits.*",[56,107]],["camflow.tv",[56,107,108,153,223]],["camhoes.tv",[56,105,107,108,153,223]],["xmegadrive.com",56],["xxxymovies.com",56],["xxxshake.com",56],["gayck.com",56],["xhand.com",[56,107]],["analdin.com",[56,107]],["revealname.com",57],["pouvideo.*",58],["povvideo.*",58],["povw1deo.*",58],["povwideo.*",58],["powv1deo.*",58],["powvibeo.*",58],["powvideo.*",58],["powvldeo.*",58],["golfchannel.com",59],["telemundodeportes.com",59],["stream.nbcsports.com",59],["mathdf.com",59],["gamcore.com",60],["porcore.com",60],["porngames.tv",60],["69games.xxx",60],["javmix.app",60],["tecknity.com",61],["haaretz.co.il",62],["haaretz.com",62],["hungama.com",62],["a-o.ninja",62],["anime-odcinki.pl",62],["kumpulmanga.org",62],["shortgoo.blogspot.com",62],["tonanmedia.my.id",[62,428]],["yurasu.xyz",62],["isekaipalace.com",62],["plyjam.*",[63,64]],["ennovelas.com",[64,68]],["foxsports.com.au",65],["canberratimes.com.au",65],["thesimsresource.com",66],["fxporn69.*",67],["vipbox.*",68],["viprow.*",68],["ctrl.blog",69],["sportlife.es",70],["finofilipino.org",71],["desbloqueador.*",72],["xberuang.*",73],["teknorizen.*",73],["mysflink.blogspot.com",73],["assia.tv",74],["assia4.com",74],["assia24.com",74],["cwtvembeds.com",[76,106]],["camlovers.tv",76],["porntn.com",76],["pornissimo.org",76],["sexcams-24.com",[76,108]],["watchporn.to",[76,108]],["camwhorez.video",76],["footstockings.com",[76,77,108]],["xmateur.com",[76,77,108]],["multi.xxx",77],["worldofbitco.in",[78,79]],["weatherx.co.in",[78,79]],["getyourbitco.in",78],["sunbtc.space",78],["subtorrents.*",80],["subtorrents1.*",80],["newpelis.*",80],["pelix.*",80],["allcalidad.*",80],["infomaniakos.*",80],["ojogos.com.br",81],["powforums.com",82],["supforums.com",82],["studybullet.com",82],["usgamer.net",83],["recordonline.com",83],["freebitcoin.win",84],["e-monsite.com",84],["coindice.win",84],["temp-mails.com",85],["freiepresse.de",86],["investing.com",87],["tornadomovies.*",88],["mp3fiber.com",89],["chicoer.com",90],["dailybreeze.com",90],["dailybulletin.com",90],["dailynews.com",90],["delcotimes.com",90],["eastbaytimes.com",90],["macombdaily.com",90],["ocregister.com",90],["pasadenastarnews.com",90],["pe.com",90],["presstelegram.com",90],["redlandsdailyfacts.com",90],["reviewjournal.com",90],["santacruzsentinel.com",90],["saratogian.com",90],["sentinelandenterprise.com",90],["sgvtribune.com",90],["tampabay.com",90],["times-standard.com",90],["theoaklandpress.com",90],["trentonian.com",90],["twincities.com",90],["whittierdailynews.com",90],["bostonherald.com",90],["dailycamera.com",90],["sbsun.com",90],["dailydemocrat.com",90],["montereyherald.com",90],["orovillemr.com",90],["record-bee.com",90],["redbluffdailynews.com",90],["reporterherald.com",90],["thereporter.com",90],["timescall.com",90],["timesheraldonline.com",90],["ukiahdailyjournal.com",90],["dailylocal.com",90],["mercurynews.com",90],["suedkurier.de",91],["anysex.com",93],["icdrama.*",94],["vlist.se",94],["mangasail.*",94],["pornve.com",95],["file4go.*",96],["coolrom.com.au",96],["pornohirsch.net",97],["marie-claire.es",98],["gamezhero.com",98],["flashgirlgames.com",98],["onlinesudoku.games",98],["mpg.football",98],["sssam.com",98],["globalnews.ca",99],["drinksmixer.com",100],["leitesculinaria.com",100],["fupa.net",101],["browardpalmbeach.com",102],["dallasobserver.com",102],["houstonpress.com",102],["miaminewtimes.com",102],["phoenixnewtimes.com",102],["westword.com",102],["nhentai.net",103],["nowtv.com.tr",104],["caminspector.net",105],["camwhoreshd.com",105],["camgoddess.tv",105],["gay4porn.com",107],["mypornhere.com",107],["mangovideo.*",108],["love4porn.com",108],["thotvids.com",108],["watchmdh.to",108],["celebwhore.com",108],["cluset.com",108],["4kporn.xxx",108],["xhomealone.com",108],["lusttaboo.com",[108,361]],["hentai-moon.com",108],["sexwebvideo.com",108],["sexwebvideo.net",108],["camhub.cc",[108,534]],["mediapason.it",111],["linkspaid.com",111],["tuotromedico.com",111],["neoteo.com",111],["phoneswiki.com",111],["celebmix.com",111],["myneobuxportal.com",111],["oyungibi.com",111],["25yearslatersite.com",111],["jeshoots.com",112],["techhx.com",112],["karanapk.com",112],["flashplayer.fullstacks.net",114],["cloudapps.herokuapp.com",114],["youfiles.herokuapp.com",114],["texteditor.nsspot.net",114],["temp-mail.org",115],["asianclub.*",116],["javhdporn.net",116],["vidmoly.to",117],["comnuan.com",118],["veedi.com",119],["battleboats.io",119],["anitube.*",120],["fruitlab.com",120],["acetack.com",120],["androidquest.com",120],["apklox.com",120],["chhaprawap.in",120],["gujarativyakaran.com",120],["kashmirstudentsinformation.in",120],["kisantime.com",120],["shetkaritoday.in",120],["pastescript.com",120],["trimorspacks.com",120],["updrop.link",120],["haddoz.net",120],["streamingcommunity.*",120],["garoetpos.com",120],["stiletv.it",121],["mixdrop.*",122],["hqtv.biz",123],["liveuamap.com",124],["muvibg.com",124],["vinomo.xyz",125],["bembed.net",125],["embedv.net",125],["fslinks.org",125],["listeamed.net",125],["v6embed.xyz",125],["vembed.*",125],["vgplayer.xyz",125],["vid-guard.com",125],["audycje.tokfm.pl",126],["hulu.com",[127,128,129]],["shush.se",130],["allkpop.com",131],["empire-anime.*",[132,423,424,425,426,427]],["empire-streaming.*",[132,423,424,425]],["empire-anime.com",[132,423,424,425]],["empire-streamz.fr",[132,423,424,425]],["empire-stream.*",[132,423,424,425]],["pickcrackpasswords.blogspot.com",133],["kfrfansub.com",134],["thuglink.com",134],["voipreview.org",134],["illicoporno.com",135],["lavoixdux.com",135],["tonpornodujour.com",135],["jacquieetmichel.net",135],["swame.com",135],["vosfemmes.com",135],["voyeurfrance.net",135],["jacquieetmicheltv.net",[135,483,484]],["hanime.tv",136],["pogo.com",137],["cloudvideo.tv",138],["legionjuegos.org",139],["legionpeliculas.org",139],["legionprogramas.org",139],["16honeys.com",140],["elespanol.com",141],["remodelista.com",142],["coolmathgames.com",[143,144,145,587]],["audiofanzine.com",146],["uploadev.*",147],["hitokin.net",148],["developerinsider.co",149],["ilprimatonazionale.it",150],["hotabis.com",150],["root-nation.com",150],["italpress.com",150],["airsoftmilsimnews.com",150],["artribune.com",150],["thehindu.com",151],["cambro.tv",[152,153]],["boobsradar.com",[153,223,544]],["nibelungen-kurier.de",154],["ver-pelis-online.*",155],["adfoc.us",156],["tea-coffee.net",156],["spatsify.com",156],["newedutopics.com",156],["getviralreach.in",156],["edukaroo.com",156],["funkeypagali.com",156],["careersides.com",156],["nayisahara.com",156],["wikifilmia.com",156],["infinityskull.com",156],["viewmyknowledge.com",156],["iisfvirtual.in",156],["starxinvestor.com",156],["jkssbalerts.com",156],["sahlmarketing.net",156],["filmypoints.in",156],["fitnessholic.net",156],["moderngyan.com",156],["sattakingcharts.in",156],["freshbhojpuri.com",156],["bgmi32bitapk.in",156],["bankshiksha.in",156],["earn.mpscstudyhub.com",156],["earn.quotesopia.com",156],["money.quotesopia.com",156],["best-mobilegames.com",156],["learn.moderngyan.com",156],["bharatsarkarijobalert.com",156],["quotesopia.com",156],["creditsgoal.com",156],["techacode.com",156],["trickms.com",156],["ielts-isa.edu.vn",156],["sptfy.be",156],["mcafee-com.com",[156,232]],["pianetamountainbike.it",157],["barchart.com",158],["modelisme.com",159],["parasportontario.ca",159],["prescottenews.com",159],["nrj-play.fr",160],["hackingwithreact.com",161],["gutekueche.at",162],["eplfootballmatch.com",163],["ancient-origins.*",163],["peekvids.com",164],["playvids.com",164],["pornflip.com",164],["redensarten-index.de",165],["vw-page.com",166],["viz.com",[167,168]],["0rechner.de",169],["configspc.com",170],["xopenload.me",170],["uptobox.com",170],["uptostream.com",170],["japgay.com",171],["mega-debrid.eu",172],["dreamdth.com",173],["diaridegirona.cat",175],["diariodeibiza.es",175],["diariodemallorca.es",175],["diarioinformacion.com",175],["eldia.es",175],["emporda.info",175],["farodevigo.es",175],["laopinioncoruna.es",175],["laopiniondemalaga.es",175],["laopiniondemurcia.es",175],["laopiniondezamora.es",175],["laprovincia.es",175],["levante-emv.com",175],["mallorcazeitung.es",175],["regio7.cat",175],["superdeporte.es",175],["playpaste.com",176],["cnbc.com",177],["puzzles.msn.com",178],["metro.us",178],["newsobserver.com",178],["arkadiumhosted.com",178],["primevideo.com",179],["read.amazon.*",[179,558]],["firefaucet.win",180],["74k.io",[181,182]],["stmruby.com",181],["fullhdxxx.com",184],["pornclassic.tube",185],["tubepornclassic.com",185],["etonline.com",186],["creatur.io",186],["lookcam.*",186],["drphil.com",186],["urbanmilwaukee.com",186],["lootlinks.*",186],["ontiva.com",186],["hideandseek.world",186],["myabandonware.com",186],["kendam.com",186],["wttw.com",186],["synonyms.com",186],["definitions.net",186],["hostmath.com",186],["camvideoshub.com",186],["minhaconexao.com.br",186],["home-made-videos.com",188],["amateur-couples.com",188],["slutdump.com",188],["dpstream.*",189],["produsat.com",190],["bluemediafiles.*",191],["12thman.com",192],["acusports.com",192],["atlantic10.com",192],["auburntigers.com",192],["baylorbears.com",192],["bceagles.com",192],["bgsufalcons.com",192],["big12sports.com",192],["bigten.org",192],["bradleybraves.com",192],["butlersports.com",192],["cmumavericks.com",192],["conferenceusa.com",192],["cyclones.com",192],["dartmouthsports.com",192],["daytonflyers.com",192],["dbupatriots.com",192],["dbusports.com",192],["denverpioneers.com",192],["fduknights.com",192],["fgcuathletics.com",192],["fightinghawks.com",192],["fightingillini.com",192],["floridagators.com",192],["friars.com",192],["friscofighters.com",192],["gamecocksonline.com",192],["goarmywestpoint.com",192],["gobison.com",192],["goblueraiders.com",192],["gobobcats.com",192],["gocards.com",192],["gocreighton.com",192],["godeacs.com",192],["goexplorers.com",192],["goetbutigers.com",192],["gofrogs.com",192],["gogriffs.com",192],["gogriz.com",192],["golobos.com",192],["gomarquette.com",192],["gopack.com",192],["gophersports.com",192],["goprincetontigers.com",192],["gopsusports.com",192],["goracers.com",192],["goshockers.com",192],["goterriers.com",192],["gotigersgo.com",192],["gousfbulls.com",192],["govandals.com",192],["gowyo.com",192],["goxavier.com",192],["gozags.com",192],["gozips.com",192],["griffinathletics.com",192],["guhoyas.com",192],["gwusports.com",192],["hailstate.com",192],["hamptonpirates.com",192],["hawaiiathletics.com",192],["hokiesports.com",192],["huskers.com",192],["icgaels.com",192],["iuhoosiers.com",192],["jsugamecocksports.com",192],["longbeachstate.com",192],["loyolaramblers.com",192],["lrtrojans.com",192],["lsusports.net",192],["morrisvillemustangs.com",192],["msuspartans.com",192],["muleriderathletics.com",192],["mutigers.com",192],["navysports.com",192],["nevadawolfpack.com",192],["niuhuskies.com",192],["nkunorse.com",192],["nuhuskies.com",192],["nusports.com",192],["okstate.com",192],["olemisssports.com",192],["omavs.com",192],["ovcsports.com",192],["owlsports.com",192],["purduesports.com",192],["redstormsports.com",192],["richmondspiders.com",192],["sfajacks.com",192],["shupirates.com",192],["siusalukis.com",192],["smcgaels.com",192],["smumustangs.com",192],["soconsports.com",192],["soonersports.com",192],["themw.com",192],["tulsahurricane.com",192],["txst.com",192],["txstatebobcats.com",192],["ubbulls.com",192],["ucfknights.com",192],["ucirvinesports.com",192],["uconnhuskies.com",192],["uhcougars.com",192],["uicflames.com",192],["umterps.com",192],["uncwsports.com",192],["unipanthers.com",192],["unlvrebels.com",192],["uoflsports.com",192],["usdtoreros.com",192],["utahstateaggies.com",192],["utepathletics.com",192],["utrockets.com",192],["uvmathletics.com",192],["uwbadgers.com",192],["villanova.com",192],["wkusports.com",192],["wmubroncos.com",192],["woffordterriers.com",192],["1pack1goal.com",192],["bcuathletics.com",192],["bubraves.com",192],["goblackbears.com",192],["golightsgo.com",192],["gomcpanthers.com",192],["goutsa.com",192],["mercerbears.com",192],["pirateblue.com",192],["pirateblue.net",192],["pirateblue.org",192],["quinnipiacbobcats.com",192],["towsontigers.com",192],["tribeathletics.com",192],["tribeclub.com",192],["utepminermaniacs.com",192],["utepminers.com",192],["wkutickets.com",192],["aopathletics.org",192],["atlantichockeyonline.com",192],["bigsouthnetwork.com",192],["bigsouthsports.com",192],["chawomenshockey.com",192],["dbupatriots.org",192],["drakerelays.org",192],["ecac.org",192],["ecacsports.com",192],["emueagles.com",192],["emugameday.com",192],["gculopes.com",192],["godrakebulldog.com",192],["godrakebulldogs.com",192],["godrakebulldogs.net",192],["goeags.com",192],["goislander.com",192],["goislanders.com",192],["gojacks.com",192],["gomacsports.com",192],["gseagles.com",192],["hubison.com",192],["iowaconference.com",192],["ksuowls.com",192],["lonestarconference.org",192],["mascac.org",192],["midwestconference.org",192],["mountaineast.org",192],["niu-pack.com",192],["nulakers.ca",192],["oswegolakers.com",192],["ovcdigitalnetwork.com",192],["pacersports.com",192],["rmacsports.org",192],["rollrivers.com",192],["samfordsports.com",192],["uncpbraves.com",192],["usfdons.com",192],["wiacsports.com",192],["alaskananooks.com",192],["broncathleticfund.com",192],["cameronaggies.com",192],["columbiacougars.com",192],["etownbluejays.com",192],["gobadgers.ca",192],["golancers.ca",192],["gometrostate.com",192],["gothunderbirds.ca",192],["kentstatesports.com",192],["lehighsports.com",192],["lopers.com",192],["lycoathletics.com",192],["lycomingathletics.com",192],["maraudersports.com",192],["mauiinvitational.com",192],["msumavericks.com",192],["nauathletics.com",192],["nueagles.com",192],["nwusports.com",192],["oceanbreezenyc.org",192],["patriotathleticfund.com",192],["pittband.com",192],["principiaathletics.com",192],["roadrunnersathletics.com",192],["sidearmsocial.com",192],["snhupenmen.com",192],["stablerarena.com",192],["stoutbluedevils.com",192],["uwlathletics.com",192],["yumacs.com",192],["collegefootballplayoff.com",192],["csurams.com",192],["cubuffs.com",192],["gobearcats.com",192],["gohuskies.com",192],["mgoblue.com",192],["osubeavers.com",192],["pittsburghpanthers.com",192],["rolltide.com",192],["texassports.com",192],["thesundevils.com",192],["uclabruins.com",192],["wvuathletics.com",192],["wvusports.com",192],["arizonawildcats.com",192],["calbears.com",192],["cuse.com",192],["georgiadogs.com",192],["goducks.com",192],["goheels.com",192],["gostanford.com",192],["insidekstatesports.com",192],["insidekstatesports.info",192],["insidekstatesports.net",192],["insidekstatesports.org",192],["k-stateathletics.com",192],["k-statefootball.net",192],["k-statefootball.org",192],["k-statesports.com",192],["k-statesports.net",192],["k-statesports.org",192],["k-statewomenshoops.com",192],["k-statewomenshoops.net",192],["k-statewomenshoops.org",192],["kstateathletics.com",192],["kstatefootball.net",192],["kstatefootball.org",192],["kstatesports.com",192],["kstatewomenshoops.com",192],["kstatewomenshoops.net",192],["kstatewomenshoops.org",192],["ksuathletics.com",192],["ksusports.com",192],["scarletknights.com",192],["showdownforrelief.com",192],["syracusecrunch.com",192],["texastech.com",192],["theacc.com",192],["ukathletics.com",192],["usctrojans.com",192],["utahutes.com",192],["utsports.com",192],["wsucougars.com",192],["vidlii.com",[192,217]],["tricksplit.io",192],["fangraphs.com",193],["stern.de",194],["geo.de",194],["brigitte.de",194],["tvspielfilm.de",[195,196,197,198]],["tvtoday.de",[195,196,197,198]],["chip.de",[195,196,197,198]],["focus.de",[195,196,197,198]],["fitforfun.de",[195,196,197,198]],["n-tv.de",199],["player.rtl2.de",200],["planetaminecraft.com",201],["cravesandflames.com",202],["codesnse.com",202],["link.paid4file.com",202],["flyad.vip",202],["lapresse.ca",203],["kolyoom.com",204],["ilovephd.com",204],["negumo.com",205],["games.wkb.jp",[206,207]],["fandom.com",[208,604,605]],["kenshi.fandom.com",209],["hausbau-forum.de",210],["homeairquality.org",210],["faucettronn.click",210],["fake-it.ws",211],["laksa19.github.io",212],["1shortlink.com",213],["u-s-news.com",214],["luscious.net",215],["makemoneywithurl.com",216],["junkyponk.com",216],["healthfirstweb.com",216],["vocalley.com",216],["yogablogfit.com",216],["howifx.com",[216,390]],["en.financerites.com",216],["mythvista.com",216],["livenewsflix.com",216],["cureclues.com",216],["apekite.com",216],["host-buzz.com",216],["insmyst.com",216],["wp2host.com",216],["blogtechh.com",216],["techbixby.com",216],["blogmyst.com",216],["enit.in",216],["iammagnus.com",217],["dailyvideoreports.net",217],["unityassets4free.com",217],["docer.*",218],["resetoff.pl",218],["sexodi.com",218],["cdn77.org",219],["3sexporn.com",220],["momxxxsex.com",220],["myfreevintageporn.com",220],["penisbuyutucum.net",220],["ujszo.com",221],["newsmax.com",222],["bobs-tube.com",223],["nadidetarifler.com",224],["siz.tv",224],["suzylu.co.uk",[225,226]],["onworks.net",227],["yabiladi.com",227],["downloadsoft.net",228],["pixsera.net",229],["testlanguages.com",230],["newsinlevels.com",230],["videosinlevels.com",230],["sabkiyojana.com",231],["starkroboticsfrc.com",232],["sinonimos.de",232],["antonimos.de",232],["quesignifi.ca",232],["tiktokrealtime.com",232],["tiktokcounter.net",232],["tpayr.xyz",232],["poqzn.xyz",232],["ashrfd.xyz",232],["rezsx.xyz",232],["tryzt.xyz",232],["ashrff.xyz",232],["rezst.xyz",232],["dawenet.com",232],["erzar.xyz",232],["waezm.xyz",232],["waezg.xyz",232],["blackwoodacademy.org",232],["cryptednews.space",232],["vivuq.com",232],["swgop.com",232],["vbnmll.com",232],["telcoinfo.online",232],["dshytb.com",232],["btcbitco.in",[232,235]],["btcsatoshi.net",232],["cempakajaya.com",232],["crypto4yu.com",232],["readbitcoin.org",232],["wiour.com",232],["finish.addurl.biz",232],["aiimgvlog.fun",[232,238]],["laweducationinfo.com",232],["savemoneyinfo.com",232],["worldaffairinfo.com",232],["godstoryinfo.com",232],["successstoryinfo.com",232],["cxissuegk.com",232],["learnmarketinfo.com",232],["bhugolinfo.com",232],["armypowerinfo.com",232],["rsadnetworkinfo.com",232],["rsinsuranceinfo.com",232],["rsfinanceinfo.com",232],["rsgamer.app",232],["rssoftwareinfo.com",232],["rshostinginfo.com",232],["rseducationinfo.com",232],["phonereviewinfo.com",232],["makeincomeinfo.com",232],["gknutshell.com",232],["vichitrainfo.com",232],["workproductivityinfo.com",232],["dopomininfo.com",232],["hostingdetailer.com",232],["fitnesssguide.com",232],["tradingfact4u.com",232],["cryptofactss.com",232],["softwaredetail.com",232],["artoffocas.com",232],["insurancesfact.com",232],["travellingdetail.com",232],["advertisingexcel.com",232],["allcryptoz.net",232],["batmanfactor.com",232],["beautifulfashionnailart.com",232],["crewbase.net",232],["documentaryplanet.xyz",232],["crewus.net",232],["gametechreviewer.com",232],["midebalonu.net",232],["misterio.ro",232],["phineypet.com",232],["seory.xyz",232],["shinbhu.net",232],["shinchu.net",232],["substitutefor.com",232],["talkforfitness.com",232],["thefitbrit.co.uk",232],["thumb8.net",232],["thumb9.net",232],["topcryptoz.net",232],["uniqueten.net",232],["ultraten.net",232],["exactpay.online",232],["quins.us",232],["kiddyearner.com",232],["imagereviser.com",233],["4funbox.com",234],["nephobox.com",234],["1024tera.com",234],["terabox.*",234],["blog.cryptowidgets.net",235],["blog.insurancegold.in",235],["blog.wiki-topia.com",235],["blog.coinsvalue.net",235],["blog.cookinguide.net",235],["blog.freeoseocheck.com",235],["blog24.me",235],["bildirim.*",237],["arahdrive.com",238],["appsbull.com",239],["diudemy.com",239],["maqal360.com",[239,240,241]],["lifesurance.info",242],["akcartoons.in",243],["cybercityhelp.in",243],["infokeeda.xyz",245],["webzeni.com",245],["dl.apkmoddone.com",246],["phongroblox.com",246],["apkmodvn.com",247],["fuckingfast.net",249],["streamelements.com",250],["share.hntv.tv",[250,673,674,675]],["forum.dji.com",[250,675]],["unionpayintl.com",[250,674]],["tickhosting.com",251],["in91vip.win",252],["arcai.com",253],["my-code4you.blogspot.com",254],["flickr.com",255],["firefile.cc",256],["pestleanalysis.com",256],["kochamjp.pl",256],["tutorialforlinux.com",256],["whatsaero.com",256],["animeblkom.net",[256,270]],["blkom.com",256],["globes.co.il",[257,258]],["jardiner-malin.fr",259],["tw-calc.net",260],["ohmybrush.com",261],["talkceltic.net",262],["mentalfloss.com",263],["uprafa.com",264],["cube365.net",265],["wwwfotografgotlin.blogspot.com",266],["freelistenonline.com",266],["badassdownloader.com",267],["quickporn.net",268],["yellowbridge.com",269],["aosmark.com",271],["ctrlv.*",272],["atozmath.com",[273,274,275,276,277,278,279]],["newyorker.com",280],["brighteon.com",281],["more.tv",282],["video1tube.com",283],["alohatube.xyz",283],["4players.de",284],["onlinesoccermanager.com",284],["fshost.me",285],["link.cgtips.org",286],["hentaicloud.com",287],["netfapx.com",289],["javdragon.org",289],["njav.tv",289],["paperzonevn.com",290],["hentaienglish.com",291],["hentaiporno.xxx",291],["venge.io",[292,293]],["btcbux.io",294],["its.porn",[295,296]],["atv.at",297],["2ndrun.tv",298],["rackusreads.com",298],["teachmemicro.com",298],["willcycle.com",298],["kusonime.com",[299,300]],["123movieshd.*",301],["imgur.com",[302,303,564]],["hentai-party.com",304],["hentaicomics.pro",304],["xxx-comics.pro",304],["uproxy.*",305],["animesa.*",306],["subtitle.one",307],["subtitleone.cc",307],["genshinimpactcalculator.com",308],["mysexgames.com",309],["cinecalidad.*",[310,311]],["embed.indavideo.hu",312],["xnxx.com",313],["xvideos.*",313],["gdr-online.com",314],["mmm.dk",315],["iqiyi.com",[316,317,457]],["m.iqiyi.com",318],["nbcolympics.com",319],["apkhex.com",320],["indiansexstories2.net",321],["issstories.xyz",321],["1340kbbr.com",322],["gorgeradio.com",322],["kduk.com",322],["kedoam.com",322],["kejoam.com",322],["kelaam.com",322],["khsn1230.com",322],["kjmx.rocks",322],["kloo.com",322],["klooam.com",322],["klykradio.com",322],["kmed.com",322],["kmnt.com",322],["kool991.com",322],["kpnw.com",322],["kppk983.com",322],["krktcountry.com",322],["ktee.com",322],["kwro.com",322],["kxbxfm.com",322],["thevalley.fm",322],["quizlet.com",323],["dsocker1234.blogspot.com",324],["schoolcheats.net",[325,326]],["mgnet.xyz",327],["japopav.tv",328],["lvturbo.com",328],["designtagebuch.de",329],["pixroute.com",330],["uploady.io",331],["calculator-online.net",332],["luckydice.net",333],["adarima.org",333],["weatherwx.com",333],["sattaguess.com",333],["winshell.de",333],["rosasidan.ws",333],["modmakers.xyz",333],["gamepure.in",333],["warrenrahul.in",333],["austiblox.net",333],["upiapi.in",333],["networkhint.com",333],["thichcode.net",333],["texturecan.com",333],["tikmate.app",[333,465]],["arcaxbydz.id",333],["quotesshine.com",333],["porngames.club",334],["sexgames.xxx",334],["111.90.159.132",335],["battleplan.news",335],["mobile-tracker-free.com",336],["pfps.gg",337],["social-unlock.com",338],["superpsx.com",339],["ninja.io",340],["sourceforge.net",341],["samfirms.com",342],["rapelust.com",343],["vtube.to",343],["vtplay.net",343],["desitelugusex.com",343],["dvdplay.*",343],["xvideos-downloader.net",343],["xxxvideotube.net",343],["sdefx.cloud",343],["nozomi.la",343],["moviesonlinefree.net",343],["banned.video",344],["madmaxworld.tv",344],["androidpolice.com",344],["babygaga.com",344],["backyardboss.net",344],["carbuzz.com",344],["cbr.com",344],["collider.com",344],["dualshockers.com",344],["footballfancast.com",344],["footballleagueworld.co.uk",344],["gamerant.com",344],["givemesport.com",344],["hardcoregamer.com",344],["hotcars.com",344],["howtogeek.com",344],["makeuseof.com",344],["moms.com",344],["movieweb.com",344],["pocket-lint.com",344],["pocketnow.com",344],["screenrant.com",344],["simpleflying.com",344],["thegamer.com",344],["therichest.com",344],["thesportster.com",344],["thethings.com",344],["thetravel.com",344],["topspeed.com",344],["xda-developers.com",344],["huffpost.com",345],["ingles.com",346],["spanishdict.com",346],["surfline.com",[347,348]],["play.tv3.ee",349],["play.tv3.lt",349],["play.tv3.lv",349],["tv3play.skaties.lv",349],["trendyoum.com",350],["bulbagarden.net",351],["hollywoodlife.com",352],["mat6tube.com",353],["textstudio.co",354],["newtumbl.com",355],["apkmaven.*",356],["aruble.net",357],["nevcoins.club",358],["mail.com",359],["gmx.*",360],["oggi.it",[362,363]],["manoramamax.com",362],["video.gazzetta.it",[362,363]],["mangakita.id",364],["avpgalaxy.net",365],["mhma12.tech",366],["panda-novel.com",367],["zebranovel.com",367],["lightsnovel.com",367],["eaglesnovel.com",367],["pandasnovel.com",367],["ewrc-results.com",368],["kizi.com",369],["cyberscoop.com",370],["fedscoop.com",370],["canale.live",371],["indiatimes.com",372],["netzwelt.de",373],["jeep-cj.com",374],["sponsorhunter.com",375],["cloudcomputingtopics.net",376],["likecs.com",377],["tiscali.it",378],["linkspy.cc",379],["adshnk.com",380],["chattanoogan.com",381],["adsy.pw",382],["playstore.pw",382],["socialmediagirls.com",383],["windowspro.de",384],["snapinst.app",385],["jiocinema.com",386],["rapid-cloud.co",386],["uploadmall.com",386],["rkd3.dev",386],["tvtv.ca",387],["tvtv.us",387],["mydaddy.cc",388],["roadtrippin.fr",389],["vavada5com.com",390],["anyporn.com",[391,408]],["bravoporn.com",391],["bravoteens.com",391],["crocotube.com",391],["hellmoms.com",391],["hellporno.com",391],["sex3.com",391],["tubewolf.com",391],["xbabe.com",391],["xcum.com",391],["zedporn.com",391],["imagetotext.info",392],["infokik.com",393],["freepik.com",394],["ddwloclawek.pl",[395,396]],["www.seznam.cz",397],["deezer.com",[398,709,710]],["my-subs.co",399],["plaion.com",400],["slideshare.net",[401,402]],["ustreasuryyieldcurve.com",403],["businesssoftwarehere.com",404],["goo.st",404],["freevpshere.com",404],["softwaresolutionshere.com",404],["gamereactor.*",406],["madoohd.com",407],["doomovie-hd.*",407],["staige.tv",409],["in-jpn.com",410],["oninet.ne.jp",410],["xth.jp",410],["androidadult.com",411],["streamvid.net",412],["watchtv24.com",413],["cellmapper.net",414],["medscape.com",415],["newscon.org",[416,417]],["arkadium.com",418],["wheelofgold.com",419],["drakecomic.*",419],["app.blubank.com",420],["mobileweb.bankmellat.ir",420],["sportdeutschland.tv",421],["kcra.com",421],["wcvb.com",421],["chat.nrj.fr",422],["chat.tchatche.com",[422,437]],["ccthesims.com",429],["chromeready.com",429],["coursedrive.org",429],["dtbps3games.com",429],["illustratemagazine.com",429],["uknip.co.uk",429],["vod.pl",430],["megadrive-emulator.com",431],["tvhay.*",[432,433]],["animesaga.in",434],["moviesapi.club",434],["bestx.stream",434],["watchx.top",434],["digimanie.cz",435],["svethardware.cz",435],["srvy.ninja",436],["cnn.com",[438,439,440]],["edmdls.com",441],["freshremix.net",441],["scenedl.org",441],["trakt.tv",442],["client.falixnodes.net",443],["shroomers.app",444],["classicalradio.com",445],["di.fm",445],["jazzradio.com",445],["radiotunes.com",445],["rockradio.com",445],["zenradio.com",445],["pc-builds.com",446],["qtoptens.com",446],["reuters.com",446],["today.com",446],["videogamer.com",446],["wrestlinginc.com",446],["gbatemp.net",446],["usatoday.com",[447,711]],["ydr.com",447],["getthit.com",448],["techedubyte.com",449],["soccerinhd.com",449],["movie-th.tv",450],["iwanttfc.com",451],["nutraingredients-asia.com",452],["nutraingredients-latam.com",452],["nutraingredients-usa.com",452],["nutraingredients.com",452],["ozulscansen.com",453],["nexusmods.com",454],["lookmovie.*",455],["lookmovie2.to",455],["royalroad.com",456],["biletomat.pl",458],["hextank.io",[459,460]],["filmizlehdfilm.com",[461,462,463,464]],["filmizletv.*",[461,462,463,464]],["fullfilmizle.cc",[461,462,463,464]],["gofilmizle.net",[461,462,463,464]],["btvplus.bg",466],["sagewater.com",467],["redlion.net",467],["satdl.com",468],["vidstreaming.xyz",469],["everand.com",470],["myradioonline.pl",471],["cbs.com",472],["paramountplus.com",472],["abysscdn.com",[473,474]],["fullxh.com",475],["galleryxh.site",475],["megaxh.com",475],["movingxh.world",475],["seexh.com",475],["unlockxh4.com",475],["valuexh.life",475],["xhaccess.com",475],["xhadult2.com",475],["xhadult3.com",475],["xhadult4.com",475],["xhadult5.com",475],["xhamster.*",475],["xhamster1.*",475],["xhamster10.*",475],["xhamster11.*",475],["xhamster12.*",475],["xhamster13.*",475],["xhamster14.*",475],["xhamster15.*",475],["xhamster16.*",475],["xhamster17.*",475],["xhamster18.*",475],["xhamster19.*",475],["xhamster20.*",475],["xhamster2.*",475],["xhamster3.*",475],["xhamster4.*",475],["xhamster42.*",475],["xhamster46.com",475],["xhamster5.*",475],["xhamster7.*",475],["xhamster8.*",475],["xhamsterporno.mx",475],["xhbig.com",475],["xhbranch5.com",475],["xhchannel.com",475],["xhdate.world",475],["xhday.com",475],["xhday1.com",475],["xhlease.world",475],["xhmoon5.com",475],["xhofficial.com",475],["xhopen.com",475],["xhplanet1.com",475],["xhplanet2.com",475],["xhreal2.com",475],["xhreal3.com",475],["xhspot.com",475],["xhtotal.com",475],["xhtree.com",475],["xhvictory.com",475],["xhwebsite.com",475],["xhwebsite2.com",475],["xhwebsite5.com",475],["xhwide1.com",475],["xhwide2.com",475],["xhwide5.com",475],["file-upload.net",476],["lightnovelworld.*",477],["acortalo.*",[478,479,480,481]],["acortar.*",[478,479,480,481]],["megadescarga.net",[478,479,480,481]],["megadescargas.net",[478,479,480,481]],["hentaihaven.xxx",482],["jacquieetmicheltv2.net",484],["a2zapk.*",485],["fcportables.com",[486,487]],["emurom.net",488],["freethesaurus.com",[489,490]],["thefreedictionary.com",[489,490]],["oeffentlicher-dienst.info",491],["im9.eu",492],["dcdlplayer8a06f4.xyz",493],["ultimate-guitar.com",494],["claimbits.net",495],["sexyscope.net",496],["kickassanime.*",497],["recherche-ebook.fr",498],["virtualdinerbot.com",498],["zonebourse.com",499],["pink-sluts.net",500],["andhrafriends.com",501],["benzinpreis.de",502],["turtleviplay.xyz",503],["paktech2.com",504],["defenseone.com",505],["govexec.com",505],["nextgov.com",505],["route-fifty.com",505],["sharing.wtf",506],["wetter3.de",507],["esportivos.fun",508],["cosmonova-broadcast.tv",509],["hartvannederland.nl",510],["shownieuws.nl",510],["vandaaginside.nl",510],["rock.porn",[511,512]],["videzz.net",[513,514]],["ezaudiobookforsoul.com",515],["club386.com",516],["littlebigsnake.com",517],["easyfun.gg",518],["smailpro.com",519],["ilgazzettino.it",520],["ilmessaggero.it",520],["3bmeteo.com",[521,522]],["mconverter.eu",523],["lover937.net",524],["10gb.vn",525],["pes6.es",526],["tactics.tools",[527,528]],["boundhub.com",529],["alocdnnetu.xyz",530],["reliabletv.me",531],["jakondo.ru",532],["filecrypt.*",533],["nolive.me",535],["wired.com",536],["spankbang.*",[537,538,539,566,567]],["anonymfile.com",540],["gofile.to",540],["dotycat.com",541],["rateyourmusic.com",542],["reporterpb.com.br",543],["blog-dnz.com",545],["18adultgames.com",546],["colnect.com",[547,548]],["adultgamesworld.com",549],["bgmiupdate.com.in",550],["reviewdiv.com",551],["pvpoke-re.com",552],["parametric-architecture.com",553],["laurelberninteriors.com",[554,569]],["filmweb.pl",[555,556]],["voiceofdenton.com",557],["concealednation.org",557],["www.google.*",559],["tacobell.com",560],["zefoy.com",561],["cnet.com",562],["natgeotv.com",565],["globo.com",568],["wayfair.com",570],["br.de",571],["indeed.com",572],["pasteboard.co",573],["clickhole.com",574],["deadspin.com",574],["gizmodo.com",574],["jalopnik.com",574],["jezebel.com",574],["kotaku.com",574],["lifehacker.com",574],["splinternews.com",574],["theinventory.com",574],["theonion.com",574],["theroot.com",574],["thetakeout.com",574],["pewresearch.org",574],["los40.com",[575,576]],["as.com",576],["telegraph.co.uk",[577,578]],["poweredbycovermore.com",[577,627]],["lumens.com",[577,627]],["verizon.com",579],["humanbenchmark.com",580],["politico.com",581],["officedepot.co.cr",[582,583]],["officedepot.*",[584,585]],["usnews.com",586],["factable.com",588],["zee5.com",589],["gala.fr",590],["geo.fr",590],["voici.fr",590],["gloucestershirelive.co.uk",591],["arsiv.mackolik.com",592],["jacksonguitars.com",593],["scandichotels.com",594],["stylist.co.uk",595],["nettiauto.com",596],["thaiairways.com",[597,598]],["cerbahealthcare.it",[599,600]],["futura-sciences.com",[599,616]],["toureiffel.paris",599],["tiendaenlinea.claro.com.ni",[601,602]],["tieba.baidu.com",603],["grasshopper.com",[606,607]],["epson.com.cn",[608,609,610,611]],["oe24.at",[612,613]],["szbz.de",612],["platform.autods.com",[614,615]],["wikihow.com",617],["citibank.com.sg",618],["uol.com.br",[619,620,621,622,623]],["gazzetta.gr",624],["digicol.dpm.org.cn",[625,626]],["virginmediatelevision.ie",628],["larazon.es",[629,630]],["waitrosecellar.com",[631,632,633]],["sharpen-free-design-generator.netlify.app",[635,636]],["help.cashctrl.com",[637,638]],["gry-online.pl",639],["vidaextra.com",640],["commande.rhinov.pro",[641,642]],["ecom.wixapps.net",[641,642]],["tipranks.com",[643,644]],["iceland.co.uk",[645,646,647]],["socket.pearsoned.com",648],["tntdrama.com",[649,650]],["trutv.com",[649,650]],["mobile.de",[651,652]],["ioe.vn",[653,654]],["geiriadur.ac.uk",[653,657]],["welsh-dictionary.ac.uk",[653,657]],["bikeportland.org",[655,656]],["biologianet.com",[620,621,622]],["10play.com.au",[658,659]],["sunshine-live.de",[660,661]],["whatismyip.com",[662,663]],["myfitnesspal.com",664],["netoff.co.jp",[665,666]],["foundit.*",[667,668]],["clickjogos.com.br",669],["bristan.com",[670,671]],["zillow.com",672],["optimum.net",[676,677]],["hdfcfund.com",678],["user.guancha.cn",[679,680]],["sosovalue.com",681],["bandyforbundet.no",[682,683]],["tatacommunications.com",684],["suamusica.com.br",[685,686,687]],["macrotrends.net",[688,689]],["code.world",690],["smartcharts.net",690],["topgear.com",691],["eservice.directauto.com",[692,693]],["nbcsports.com",694],["standard.co.uk",695],["pruefernavi.de",[696,697]],["speedtest.net",[698,699]],["17track.net",700],["visible.com",[701,709,710]],["hagerty.com",[702,703]],["kino.de",[704,705]],["9now.nine.com.au",706],["worldstar.com",707],["u26bekrb.fun",708],["flyfrontier.com",[709,710]],["acmemarkets.com",[709,710]],["usaa.com",[709,710]],["capezio.com",[709,710]],["twitch.tv",[709,710]],["spotify.com",[709,710]],["tidal.com",[709,710]],["pandora.com",[709,710]],["qobuz.com",[709,710]],["soundcloud.com",[709,710]],["vimeo.com",[709,710]],["x.com",[709,710]],["twitter.com",[709,710]],["eventbrite.com",[709,710]],["wunderground.com",[709,710]],["accuweather.com",[709,710]],["formula1.com",[709,710]],["lenscrafters.com",[709,710]],["subway.com",[709,710]],["ticketmaster.*",[709,710]],["livewithkellyandmark.com",[709,710]],["porsche.com",[709,710]],["uber.com",[709,710]],["jdsports.com",[709,710]],["engadget.com",[709,710]],["yahoo.com",[709,710]],["techcrunch.com",[709,710]],["rivals.com",[709,710]],["kkrt.com",[709,710]],["crunchyroll.com",[709,710]],["dnb.com",[709,710]],["dnb.co.uk",[709,710]],["weather.com",[709,710]],["ubereats.com",[709,710]]]);
const exceptionsMap = new Map([["pingit.com",[21]],["pingit.me",[21]],["lookmovie.studio",[455]]]);
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
