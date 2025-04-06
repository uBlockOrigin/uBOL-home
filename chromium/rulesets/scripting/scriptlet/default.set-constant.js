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
const argsList = [["ytInitialPlayerResponse.playerAds","undefined"],["ytInitialPlayerResponse.adPlacements","undefined"],["ytInitialPlayerResponse.adSlots","undefined"],["playerResponse.adPlacements","undefined"],["nsShowMaxCount","0"],["objVc.interstitial_web",""],["_ml_ads_ns","null"],["_sp_.config","undefined"],["isAdBlockActive","false"],["AdController","noopFunc"],["console.clear","noopFunc"],["console.log","noopFunc"],["Object.prototype.hideAds","true"],["Object.prototype._getSalesHouseConfigurations","noopFunc"],["vast_urls","{}"],["sadbl","false"],["adblockcheck","false"],["arrvast","[]"],["blurred","false"],["flashvars.adv_pre_src",""],["showPopunder","false"],["page_params.holiday_promo","true"],["adsEnabled","true"],["String.prototype.charAt","trueFunc"],["ad_blocker","false"],["blockAdBlock","true"],["VikiPlayer.prototype.pingAbFactor","noopFunc"],["player.options.disableAds","true"],["console.clear","trueFunc"],["flashvars.adv_pre_vast",""],["flashvars.adv_pre_vast_alt",""],["x_width","1"],["_site_ads_ns","true"],["luxuretv.config",""],["Object.prototype.AdOverlay","noopFunc"],["tkn_popunder","null"],["can_run_ads","true"],["adsBlockerDetector","noopFunc"],["globalThis","null"],["adblock","false"],["__ads","true"],["FlixPop.isPopGloballyEnabled","falseFunc"],["console.clear","undefined"],["check_adblock","true"],["$.magnificPopup.open","noopFunc"],["adsenseadBlock","noopFunc"],["adblockSuspected","false"],["xRds","true"],["cRAds","false"],["String.prototype.charCodeAt","trueFunc"],["disasterpingu","false"],["App.views.adsView.adblock","false"],["flashvars.adv_pause_html",""],["$.fx.off","true"],["isAdb","false"],["adBlockEnabled","false"],["puShown","true"],["ads_b_test","true"],["showAds","true"],["attr","{}"],["scriptSrc",""],["cxStartDetectionProcess","noopFunc"],["isAdBlocked","false"],["adblock","noopFunc"],["path",""],["_ctrl_vt.blocked.ad_script","false"],["blockAdBlock","noopFunc"],["caca","noopFunc"],["Ok","true"],["safelink.adblock","false"],["ClickUnder","noopFunc"],["flashvars.adv_pre_url",""],["flashvars.protect_block",""],["flashvars.video_click_url",""],["adBlock","false"],["spoof","noopFunc"],["btoa","null"],["sp_ad","true"],["adsBlocked","false"],["_sp_.msg.displayMessage","noopFunc"],["CaptchmeState.adb","undefined"],["indexedDB.open","trueFunc"],["UhasAB","false"],["adNotificationDetected","false"],["atob","noopFunc"],["_pop","noopFunc"],["CnnXt.Event.fire","noopFunc"],["_ti_update_user","noopFunc"],["valid","1"],["vastAds","[]"],["adblock","1"],["frg","1"],["time","0"],["vpPrerollVideo","undefined"],["ads","true"],["GNCA_Ad_Support","true"],["Date.now","noopFunc"],["jQuery.adblock","1"],["VMG.Components.Adblock","false"],["_n_app.popunder","null"],["adblockDetector","trueFunc"],["hasPoped","true"],["flashvars.video_click_url","undefined"],["flashvars.adv_start_html",""],["flashvars.popunder_url",""],["flashvars.adv_post_src",""],["flashvars.adv_post_url",""],["jQuery.adblock","false"],["google_jobrunner","true"],["sec","0"],["gadb","false"],["checkadBlock","noopFunc"],["clientSide.adbDetect","noopFunc"],["HTMLAnchorElement.prototype.click","noopFunc"],["cmnnrunads","true"],["adBlocker","false"],["adBlockDetected","noopFunc"],["StileApp.somecontrols.adBlockDetected","noopFunc"],["MDCore.adblock","0"],["google_tag_data","noopFunc"],["noAdBlock","true"],["PlayerConfig.config.CustomAdSetting","[]"],["adsOk","true"],["Object.prototype._parseVAST","noopFunc"],["Object.prototype.createAdBlocker","noopFunc"],["Object.prototype.isAdPeriod","falseFunc"],["check","true"],["isal","true"],["document.hidden","true"],["awm","true"],["adblockEnabled","false"],["is_adblocked","false"],["ABLK","false"],["pogo.intermission.staticAdIntermissionPeriod","0"],["SubmitDownload1","noopFunc"],["t","0"],["ckaduMobilePop","noopFunc"],["tieneAdblock","0"],["adsAreBlocked","false"],["cmgpbjs","false"],["displayAdblockOverlay","false"],["google","false"],["Math.pow","noopFunc"],["openInNewTab","noopFunc"],["loadingAds","true"],["runAdBlocker","false"],["td_ad_background_click_link","undefined"],["Adblock","false"],["flashvars.logo_url",""],["flashvars.logo_text",""],["nlf.custom.userCapabilities","false"],["decodeURIComponent","trueFunc"],["count","0"],["LoadThisScript","true"],["showPremLite","true"],["closeBlockerModal","false"],["adBlockDetector.isEnabled","falseFunc"],["areAdsDisplayed","true"],["gkAdsWerbung","true"],["document.bridCanRunAds","true"],["pop_target","null"],["is_banner","true"],["$easyadvtblock","false"],["show_dfp_preroll","false"],["show_youtube_preroll","false"],["doads","true"],["jsUnda","noopFunc"],["AlobaidiDetectAdBlock","true"],["Advertisement","1"],["adBlockDetected","false"],["abp1","1"],["pr_okvalida","true"],["$.ajax","trueFunc"],["cnbc.canShowAds","true"],["ue_adb_chk","1"],["firefaucet","true"],["cRAds","true"],["uas","[]"],["flashvars.popunder_url","undefined"],["adv","true"],["prerollMain","undefined"],["canRunAds","true"],["Fingerprint2","true"],["dclm_ajax_var.disclaimer_redirect_url",""],["load_pop_power","noopFunc"],["adBlockDetected","true"],["Time_Start","0"],["blockAdBlock","trueFunc"],["ezstandalone.enabled","true"],["foundation.adPlayer.bitmovin","{}"],["DL8_GLOBALS.enableAdSupport","false"],["DL8_GLOBALS.useHomad","false"],["DL8_GLOBALS.enableHomadDesktop","false"],["DL8_GLOBALS.enableHomadMobile","false"],["Object.prototype.adReinsertion","noopFunc"],["getHomadConfig","noopFunc"],["ab","false"],["go_popup","{}"],["noBlocker","true"],["adsbygoogle","null"],["fabActive","false"],["gWkbAdVert","true"],["noblock","true"],["wgAffiliateEnabled","false"],["ads","null"],["detectAdblock","noopFunc"],["adsLoadable","true"],["ASSetCookieAds","null"],["letShowAds","true"],["ulp_noadb","true"],["Object.prototype.adblock_detected","false"],["timeSec","0"],["adsbygoogle.loaded","true"],["ads_unblocked","true"],["xxSetting.adBlockerDetection","false"],["open","undefined"],["Drupal.behaviors.adBlockerPopup","null"],["fake_ad","true"],["koddostu_com_adblock_yok","null"],["adsbygoogle","trueFunc"],["player.ads.cuePoints","undefined"],["adBlockDetected","null"],["better_ads_adblock","1"],["Adv_ab","false"],["hold_click","false"],["sgpbCanRunAds","true"],["document.hidden","false"],["document.hasFocus","trueFunc"],["hasFocus","trueFunc"],["navigator.brave","undefined"],["Object.prototype.isAllAdClose","true"],["isRequestPresent","true"],["fouty","true"],["Notification","undefined"],["protection","noopFunc"],["private","false"],["navigator.webkitTemporaryStorage.queryUsageAndQuota","noopFunc"],["document.onkeydown","noopFunc"],["showadas","true"],["alert","throwFunc"],["app_vars.please_disable_adblock","undefined"],["iktimer","0"],["aSl.gcd","0"],["delayClick","false"],["window.adLink","null"],["sensorsDataAnalytic201505","{}"],["detectedAdblock","undefined"],["isTabActive","true"],["ov.advertising.tisoomi.loadScript","noopFunc"],["abp","false"],["hommy","{}"],["hommy.waitUntil","noopFunc"],["flashvars.mlogo",""],["__INITIAL_STATE__.config.theme.ads.isAdBlockerEnabled","false"],["pubAdsService","trueFunc"],["config.pauseInspect","false"],["appContext.adManager.context.current.adFriendly","false"],["blockAdBlock._options.baitClass","null"],["document.blocked_var","1"],["____ads_js_blocked","false"],["wIsAdBlocked","false"],["WebSite.plsDisableAdBlock","null"],["ads_blocked","false"],["samDetected","false"],["countClicks","0"],["settings.adBlockerDetection","false"],["mixpanel.get_distinct_id","true"],["fuckAdBlock._options.baitClass","null"],["bscheck.adblocker","noopFunc"],["qpcheck.ads","noopFunc"],["isContentBlocked","falseFunc"],["CloudflareApps.installs.Ik7rmQ4t95Qk.options.measureDomain","undefined"],["detectAB1","noopFunc"],["uBlockOriginDetected","false"],["googletag._vars_","{}"],["googletag._loadStarted_","true"],["googletag._loaded_","true"],["google_unique_id","1"],["google.javascript","{}"],["google.javascript.ads","{}"],["google_global_correlator","1"],["paywallGateway.truncateContent","noopFunc"],["adBlockDisabled","true"],["blockedElement","noopFunc"],["popit","false"],["adBlockerDetected","false"],["abu","falseFunc"],["countdown","0"],["decodeURI","noopFunc"],["flashvars.adv_postpause_vast",""],["univresalP","noopFunc"],["xv_ad_block","0"],["vidorev_jav_plugin_video_ads_object.vid_ads_m_video_ads",""],["adsProvider.init","noopFunc"],["SDKLoaded","true"],["blockAdBlock._creatBait","null"],["POPUNDER_ENABLED","false"],["plugins.preroll","noopFunc"],["errcode","0"],["DHAntiAdBlocker","true"],["showada","true"],["showax","true"],["p18","undefined"],["ADBLOCKED","false"],["Object.prototype.adsEnabled","false"],["adb","0"],["String.fromCharCode","trueFunc"],["adblock_use","false"],["Object.prototype.adblockFound","false"],["nitroAds.loaded","true"],["createCanvas","noopFunc"],["playerAdSettings.adLink",""],["playerAdSettings.waitTime","0"],["AdHandler.adblocked","0"],["xv.sda.pp.init","noopFunc"],["isAdsLoaded","true"],["adblockerAlert","noopFunc"],["Object.prototype.parseXML","noopFunc"],["Object.prototype.blackscreenDuration","1"],["Object.prototype.adPlayerId",""],["adblockDetect","noopFunc"],["style","noopFunc"],["history.pushState","noopFunc"],["google_unique_id","6"],["__NEXT_DATA__.props.pageProps.adsConfig","undefined"],["new_config.timedown","0"],["truex","{}"],["truex.client","noopFunc"],["hiddenProxyDetected","false"],["isadb","false"],["SteadyWidgetSettings.adblockActive","false"],["proclayer","noopFunc"],["timeleft","0"],["load_ads","trueFunc"],["detectAdBlock","noopFunc"],["starPop","1"],["Object.prototype.ads","noopFunc"],["detectBlockAds","noopFunc"],["ga","trueFunc"],["ad_link",""],["penciBlocksArray","[]"],["App.AdblockDetected","false"],["SF.adblock","true"],["startfrom","0"],["D4zz","noopFunc"],["Object.prototype.ads.nopreroll_","true"],["HP_Scout.adBlocked","false"],["SD_IS_BLOCKING","false"],["Object.prototype.isPremium","true"],["__BACKPLANE_API__.renderOptions.showAdBlock",""],["Object.prototype.isNoAds","{}"],["countDownDate","0"],["setupSkin","noopFunc"],["Object.prototype.enableInterstitial","false"],["ads","undefined"],["ADBLOCK","false"],["POSTPART_prototype.ADKEY","noopFunc"],["adBlockDetected","falseFunc"],["divWidth","1"],["noAdBlock","noopFunc"],["AdService.info.abd","noopFunc"],["adBlockDetectionResult","undefined"],["popped","true"],["google.ima.OmidVerificationVendor","{}"],["Object.prototype.omidAccessModeRules","{}"],["puShown1","true"],["passthetest","true"],["timeset","0"],["pandaAdviewValidate","true"],["canGetAds","true"],["ad_blocker_active","false"],["init_welcome_ad","noopFunc"],["moneyAbovePrivacyByvCDN","true"],["objAd.loadAdShield","noopFunc"],["window.myAd.runAd","noopFunc"],["document.body.contains","trueFunc"],["popunder","undefined"],["distance","0"],["document.onclick",""],["adEnable","true"],["displayAds","0"],["_adshrink.skiptime","0"],["AbleToRunAds","true"],["PreRollAd.timeCounter","0"],["TextEncoder","undefined"],["abpblocked","undefined"],["app.showModalAd","noopFunc"],["paAddUnit","noopFunc"],["adt","0"],["test_adblock","noopFunc"],["adblockDetector","noopFunc"],["vastEnabled","false"],["detectadsbocker","false"],["two_worker_data_js.js","[]"],["FEATURE_DISABLE_ADOBE_POPUP_BY_COUNTRY","true"],["questpassGuard","noopFunc"],["isAdBlockerEnabled","false"],["sssp","emptyObj"],["smartLoaded","true"],["timeLeft","0"],["Cookiebot","noopFunc"],["feature_flags.interstitial_ads_flag","false"],["feature_flags.interstitials_every_four_slides","false"],["waldoSlotIds","true"],["adblockstatus","false"],["adScriptLoaded","true"],["adblockEnabled","noopFunc"],["adSettings","[]"],["banner_is_blocked","false"],["Object.prototype.adBlocked","false"],["myFunc","noopFunc"],["chp_adblock_browser","noopFunc"],["googleAd","true"],["Brid.A9.prototype.backfillAdUnits","[]"],["dct","0"],["slideShow.displayInterstitial","true"],["googletag","true"],["tOS2","150"],["__INITIAL_STATE__.gameLists.gamesNoPrerollIds.indexOf","trueFunc"],["checkAdBlocker","noopFunc"],["navigator.standalone","true"],["google.ima.settings.setDisableFlashAds","noopFunc"],["ShowAdvertising","{}"],["empire.pop","undefined"],["empire.direct","undefined"],["empire.directHideAds","undefined"],["empire.mediaData.advisorMovie","1"],["empire.mediaData.advisorSerie","1"],["setTimer","0"],["penci_adlbock.ad_blocker_detector","0"],["Object.prototype.adblockDetector","noopFunc"],["blext","true"],["vidorev_jav_plugin_video_ads_object","{}"],["vidorev_jav_plugin_video_ads_object_post","{}"],["S_Popup","10"],["rabLimit","-1"],["nudgeAdBlock","noopFunc"],["feedBack.showAffilaePromo","noopFunc"],["FAVE.settings.ads.ssai.prod.clips.enabled","false"],["FAVE.settings.ads.ssai.prod.liveAuth.enabled","false"],["FAVE.settings.ads.ssai.prod.liveUnauth.enabled","false"],["loadpagecheck","noopFunc"],["art3m1sItemNames.affiliate-wrapper","\"\""],["window.adngin","{}"],["isAdBlockerActive","noopFunc"],["di.app.WebplayerApp.Ads.Adblocks.app.AdBlockDetectApp.startWithParent","false"],["admiral","noopFunc"],["gnt.u.adfree","true"],["sharedController.adblockDetector","noopFunc"],["checkAdsStatus","noopFunc"],["ads","[]"],["settings.adBlockDetectionEnabled","false"],["displayInterstitialAdConfig","false"],["checkAdBlockeraz","noopFunc"],["blockingAds","false"],["Yii2App.playbackTimeout","0"],["isPremium","true"],["QiyiPlayerProphetData.a.data","{}"],["toggleAdBlockInfo","falseFunc"],["aipAPItag.prerollSkipped","true"],["aipAPItag.setPreRollStatus","trueFunc"],["reklam_1_saniye","0"],["reklam_1_gecsaniye","0"],["reklamsayisi","1"],["reklam_1",""],["powerAPITag","emptyObj"],["playerEnhancedConfig.run","throwFunc"],["aoAdBlockDetected","false"],["xtime","0"],["Div_popup",""],["Scribd.Blob.AdBlockerModal","noopFunc"],["AddAdsV2I.addBlock","false"],["hasAdBlocker","false"],["document.ontouchend","null"],["document.onclick","null"],["initials.yld-pdpopunder",""],["advertisement3","true"],["importFAB","undefined"],["clicked","true"],["eClicked","true"],["number","0"],["sync","true"],["PlayerLogic.prototype.detectADB","noopFunc"],["showPopunder","noopFunc"],["Object.prototype.prerollAds","[]"],["notifyMe","noopFunc"],["adsClasses","undefined"],["gsecs","0"],["dvsize","52"],["majorse","true"],["completed","1"],["testerli","false"],["w87.abd","noopFunc"],["document.referrer",""],["Object.prototype.setNeedShowAdblockWarning","noopFunc"],["NoAdBlock","noopFunc"],["adList","[]"],["ifmax","true"],["nitroAds.abp","true"],["onloadUI","noopFunc"],["PageLoader.DetectAb","0"],["one_time","1"],["consentGiven","true"],["playID","1"],["openPopunder","noopFunc"],["GEMG.GPT.Interstitial","noopFunc"],["amiblock","0"],["karte3","18"],["sandDetect","noopFunc"],["amodule.data","emptyArr"],["Object.prototype.ADBLOCK_DETECTION",""],["postroll","undefined"],["interstitial","undefined"],["isAdBlockDetected","false"],["pData.adblockOverlayEnabled","0"],["cabdSettings","undefined"],["td_ad_background_click_link"],["ADS.isBannersEnabled","false"],["EASYFUN_ADS_CAN_RUN","true"],["adsbygoogle_ama_fc_has_run","true"],["jwDefaults.advertising","{}"],["elimina_profilazione","1"],["elimina_pubblicita","1"],["abd","{}"],["checkerimg","noopFunc"],["detectedAdblock","noopFunc"],["Object.prototype.DetectByGoogleAd","noopFunc"],["nitroAds","{}"],["nitroAds.createAd","noopFunc"],["NativeAd","noopFunc"],["Blob","noopFunc"],["window.navigator.brave","undefined"],["HTMLScriptElement.prototype.onerror","undefined"],["isAdblock","false"],["openPop","noopFunc"],["attachEvent","trueFunc"],["cns.library","true"],["BJSShowUnder","{}"],["BJSShowUnder.bindTo","noopFunc"],["BJSShowUnder.add","noopFunc"],["countDown","0"],["runCheck","noopFunc"],["adsSlotRenderEndSeen","true"],["showModal","noopFunc"],["flashvars.mlogo_link",""],["isAdBlocked","noopFunc"],["URLlist","[]"],["aaw","{}"],["aaw.processAdsOnPage","noopFunc"],["doOpen","undefined"],["HTMLImageElement.prototype.onerror","undefined"],["FOXIZ_MAIN_SCRIPT.siteAccessDetector","noopFunc"],["openAdBlockPopup","noopFunc"],["Object.prototype._adsDisabled","true"],["rodo.checkIsDidomiConsent","noopFunc"],["rodo.waitForConsent","noopPromiseResolve"],["advanced_ads_check_adblocker","noopFunc"],["canRunAds","1"],["attestHasAdBlockerActivated","true"],["extInstalled","true"],["rwt","noopFunc"],["bmak.js_post","false"],["firebase.analytics","noopFunc"],["Object.prototype.updateModifiedCommerceUrl","noopFunc"],["flashvars.event_reporting",""],["Object.prototype.has_opted_out_tracking","trueFunc"],["Visitor","{}"],["send_gravity_event","noopFunc"],["send_recommendation_event","noopFunc"],["libAnalytics.data.get","noopFunc"],["adthrive._components.start","noopFunc"],["navigator.sendBeacon","noopFunc"],["akamaiDisableServerIpLookup","noopFunc"],["DD_RUM.addAction","noopFunc"],["nads.createAd","trueFunc"],["ga","noopFunc"],["huecosPBS.nstdX","null"],["DTM.trackAsyncPV","noopFunc"],["_satellite","{}"],["_satellite.getVisitorId","noopFunc"],["newPageViewSpeedtest","noopFunc"],["pubg.unload","noopFunc"],["generateGalleryAd","noopFunc"],["mediator","noopFunc"],["Object.prototype.subscribe","noopFunc"],["gbTracker","{}"],["gbTracker.sendAutoSearchEvent","noopFunc"],["Object.prototype.vjsPlayer.ads","noopFunc"],["network_user_id",""],["googletag.cmd","{}"],["Object.prototype.setDisableFlashAds","noopFunc"],["DD_RUM.addTiming","noopFunc"],["chameleonVideo.adDisabledRequested","true"],["AdmostClient","{}"],["analytics","{}"],["datalayer","[]"],["Object.prototype.isInitialLoadDisabled","noopFunc"],["listingGoogleEETracking","noopFunc"],["dcsMultiTrack","noopFunc"],["urlStrArray","noopFunc"],["pa","{}"],["Object.prototype.setConfigurations","noopFunc"],["Object.prototype.bk_addPageCtx","noopFunc"],["Object.prototype.bk_doJSTag","noopFunc"],["passFingerPrint","noopFunc"],["optimizely","{}"],["optimizely.initialized","true"],["google_optimize","{}"],["google_optimize.get","noopFunc"],["_gsq","{}"],["_gsq.push","noopFunc"],["stmCustomEvent","noopFunc"],["_gsDevice",""],["iom","{}"],["iom.c","noopFunc"],["_conv_q","{}"],["_conv_q.push","noopFunc"],["pa.privacy","{}"],["Object.prototype.getTargetingMap","noopFunc"],["populateClientData4RBA","noopFunc"],["YT.ImaManager","noopFunc"],["UOLPD","{}"],["UOLPD.dataLayer","{}"],["__configuredDFPTags","{}"],["URL_VAST_YOUTUBE","{}"],["Adman","{}"],["dplus","{}"],["dplus.track","noopFunc"],["_satellite.track","noopFunc"],["google.ima.dai","{}"],["gfkS2sExtension","{}"],["gfkS2sExtension.HTML5VODExtension","noopFunc"],["AnalyticsEventTrackingJS","{}"],["AnalyticsEventTrackingJS.addToBasket","noopFunc"],["AnalyticsEventTrackingJS.trackErrorMessage","noopFunc"],["initializeslideshow","noopFunc"],["fathom","{}"],["fathom.trackGoal","noopFunc"],["Origami","{}"],["Origami.fastclick","noopFunc"],["jad","undefined"],["hasAdblocker","true"],["Sentry","{}"],["Sentry.init","noopFunc"],["TRC","{}"],["TRC._taboolaClone","[]"],["fp","{}"],["fp.t","noopFunc"],["fp.s","noopFunc"],["initializeNewRelic","noopFunc"],["turnerAnalyticsObj","{}"],["turnerAnalyticsObj.setVideoObject4AnalyticsProperty","noopFunc"],["optimizelyDatafile","{}"],["optimizelyDatafile.featureFlags","[]"],["fingerprint","{}"],["fingerprint.getCookie","noopFunc"],["gform.utils","noopFunc"],["gform.utils.trigger","noopFunc"],["get_fingerprint","noopFunc"],["moatPrebidApi","{}"],["moatPrebidApi.getMoatTargetingForPage","noopFunc"],["cpd_configdata","{}"],["cpd_configdata.url",""],["yieldlove_cmd","{}"],["yieldlove_cmd.push","noopFunc"],["dataLayer.push","noopFunc"],["_etmc","{}"],["_etmc.push","noopFunc"],["freshpaint","{}"],["freshpaint.track","noopFunc"],["ShowRewards","noopFunc"],["stLight","{}"],["stLight.options","noopFunc"],["DD_RUM.addError","noopFunc"],["sensorsDataAnalytic201505.init","noopFunc"],["sensorsDataAnalytic201505.quick","noopFunc"],["sensorsDataAnalytic201505.track","noopFunc"],["s","{}"],["s.tl","noopFunc"],["smartech","noopFunc"],["sensors","{}"],["sensors.init","noopFunc"],["sensors.track","noopFunc"],["adn","{}"],["adn.clearDivs","noopFunc"],["_vwo_code","{}"],["gtag","noopFunc"],["_taboola","{}"],["_taboola.push","noopFunc"],["clicky","{}"],["clicky.goal","noopFunc"],["WURFL","{}"],["_sp_.config.events.onSPPMObjectReady","noopFunc"],["gtm","{}"],["gtm.trackEvent","noopFunc"],["mParticle.Identity.getCurrentUser","noopFunc"],["JSGlobals.prebidEnabled","false"],["elasticApm","{}"],["elasticApm.init","noopFunc"],["Object.prototype.que","noopFunc"],["Object.prototype.que.push","noopFunc"],["ga.sendGaEvent","noopFunc"],["adobe","{}"],["MT","{}"],["MT.track","noopFunc"],["adex","{}"],["adex.getAdexUser","noopFunc"],["Adkit","noopFunc"],["Object.prototype.shouldExpectGoogleCMP","false"],["apntag.refresh","noopFunc"],["adBlockDetected","undefined"],["Navigator.prototype.globalPrivacyControl","false"],["navigator.globalPrivacyControl","false"],["gnt.x.adm",""]];
const hostnamesMap = new Map([["m.youtube.com",[0,1,2,3]],["music.youtube.com",[0,1,2,3]],["tv.youtube.com",[0,1,2,3]],["www.youtube.com",[0,1,2,3]],["youtubekids.com",[0,1,2,3]],["youtube-nocookie.com",[0,1,2,3]],["eu-proxy.startpage.com",[0,1,3]],["timesofindia.indiatimes.com",4],["economictimes.indiatimes.com",5],["motherless.com",6],["sueddeutsche.de",7],["watchanimesub.net",8],["wco.tv",8],["wcoanimesub.tv",8],["wcoforever.net",8],["freeviewmovies.com",8],["filehorse.com",8],["guidetnt.com",8],["starmusiq.*",8],["sp-today.com",8],["linkvertise.com",8],["eropaste.net",8],["getpaste.link",8],["sharetext.me",8],["wcofun.*",8],["note.sieuthuthuat.com",8],["elcriticodelatele.com",[8,299]],["gadgets.es",[8,299]],["amateurporn.co",[8,104]],["wiwo.de",9],["primewire.*",10],["streanplay.*",[10,11]],["alphaporno.com",[10,391]],["porngem.com",10],["shortit.pw",[10,88]],["familyporn.tv",10],["sbplay.*",10],["id45.cyou",10],["85tube.com",[10,72]],["milfnut.*",10],["k1nk.co",10],["watchasians.cc",10],["soltoshindo.com",10],["sankakucomplex.com",12],["player.glomex.com",13],["merkur.de",13],["tz.de",13],["sxyprn.*",14],["hqq.*",[15,16]],["waaw.*",[16,17]],["hotpornfile.org",16],["player.tabooporns.com",16],["x69.ovh",16],["wiztube.xyz",16],["younetu.*",16],["multiup.us",16],["peliculas8k.com",[16,17]],["video.q34r.org",16],["czxxx.org",16],["vtplayer.online",16],["vvtplayer.*",16],["netu.ac",16],["netu.frembed.lol",16],["dirtyvideo.fun",17],["adbull.org",18],["123link.*",18],["adshort.*",18],["mitly.us",18],["linkrex.net",18],["linx.cc",18],["oke.io",18],["linkshorts.*",18],["dz4link.com",18],["adsrt.*",18],["linclik.com",18],["shrt10.com",18],["vinaurl.*",18],["loptelink.com",18],["adfloz.*",18],["cut-fly.com",18],["linkfinal.com",18],["payskip.org",18],["cutpaid.com",18],["forexmab.com",18],["linkjust.com",18],["linkszia.co",18],["leechpremium.link",18],["icutlink.com",[18,109]],["oncehelp.com",18],["rgl.vn",18],["reqlinks.net",18],["bitlk.com",18],["qlinks.eu",18],["link.3dmili.com",18],["short-fly.com",18],["foxseotools.com",18],["dutchycorp.*",18],["shortearn.*",18],["pingit.*",18],["pngit.live",18],["link.turkdown.com",18],["urlty.com",18],["7r6.com",18],["oko.sh",18],["ckk.ai",18],["fc.lc",18],["fstore.biz",18],["shrink.*",18],["cuts-url.com",18],["eio.io",18],["exe.app",18],["exee.io",18],["exey.io",18],["skincarie.com",18],["exeo.app",18],["tmearn.*",18],["coinlyhub.com",[18,182]],["adsafelink.com",18],["aii.sh",18],["megalink.*",18],["cybertechng.com",[18,197]],["cutdl.xyz",18],["iir.ai",18],["shorteet.com",[18,215]],["miniurl.*",18],["smoner.com",18],["gplinks.*",18],["odisha-remix.com",[18,197]],["xpshort.com",[18,197]],["upshrink.com",18],["clk.*",18],["easysky.in",18],["veganab.co",18],["go.bloggingaro.com",18],["go.gyanitheme.com",18],["go.theforyou.in",18],["go.hipsonyc.com",18],["birdurls.com",18],["vipurl.in",18],["try2link.com",18],["jameeltips.us",18],["gainl.ink",18],["promo-visits.site",18],["satoshi-win.xyz",[18,232]],["shorterall.com",18],["encurtandourl.com",18],["forextrader.site",18],["postazap.com",18],["cety.app",18],["exego.app",[18,227]],["cutlink.net",18],["cutsy.net",18],["cutyurls.com",18],["cutty.app",18],["cutnet.net",18],["jixo.online",18],["tinys.click",[18,197]],["cpm.icu",18],["panyshort.link",18],["enagato.com",18],["pandaznetwork.com",18],["tvi.la",18],["iir.la",18],["tii.la",18],["oei.la",18],["lnbz.la",[18,211]],["oii.la",[18,240]],["tpi.li",[18,240]],["recipestutorials.com",18],["pureshort.*",18],["shrinke.*",18],["shrinkme.*",18],["shrinkforearn.in",18],["techyuth.xyz",18],["oii.io",18],["du-link.in",18],["atglinks.com",18],["thotpacks.xyz",18],["megaurl.in",18],["megafly.in",18],["simana.online",18],["fooak.com",18],["joktop.com",18],["evernia.site",18],["falpus.com",18],["link.paid4link.com",18],["exalink.fun",18],["shortxlinks.com",18],["upfiles.app",18],["upfiles-urls.com",18],["flycutlink.com",[18,197]],["linksly.co",18],["link1s.*",18],["pkr.pw",18],["imagenesderopaparaperros.com",18],["shortenbuddy.com",18],["apksvip.com",18],["4cash.me",18],["namaidani.com",18],["shortzzy.*",18],["teknomuda.com",18],["shorttey.*",[18,181]],["miuiku.com",18],["savelink.site",18],["lite-link.*",18],["adcorto.*",18],["samaa-pro.com",18],["miklpro.com",18],["modapk.link",18],["ccurl.net",18],["linkpoi.me",18],["menjelajahi.com",18],["pewgame.com",18],["haonguyen.top",18],["zshort.*",18],["crazyblog.in",18],["gtlink.co",18],["cutearn.net",18],["rshrt.com",18],["filezipa.com",18],["dz-linkk.com",18],["upfiles.*",18],["theblissempire.com",18],["finanzas-vida.com",18],["adurly.cc",18],["paid4.link",18],["link.asiaon.top",18],["go.gets4link.com",18],["download.sharenulled.net",18],["linkfly.*",18],["beingtek.com",18],["shorturl.unityassets4free.com",18],["disheye.com",18],["techymedies.com",18],["techysuccess.com",18],["za.gl",[18,128]],["bblink.com",18],["myad.biz",18],["swzz.xyz",18],["vevioz.com",18],["charexempire.com",18],["clk.asia",18],["linka.click",18],["sturls.com",18],["myshrinker.com",18],["snowurl.com",[18,197]],["netfile.cc",18],["wplink.*",18],["rocklink.in",18],["techgeek.digital",18],["download3s.net",18],["shortx.net",18],["shortawy.com",18],["tlin.me",18],["apprepack.com",18],["up-load.one",18],["zuba.link",18],["bestcash2020.com",18],["hoxiin.com",18],["paylinnk.com",18],["thizissam.in",18],["ier.ai",18],["adslink.pw",18],["novelssites.com",18],["links.medipost.org",18],["faucetcrypto.net",18],["short.freeltc.top",18],["trxking.xyz",18],["weadown.com",18],["m.bloggingguidance.com",18],["blog.onroid.com",18],["link.codevn.net",18],["upfilesurls.com",18],["link4rev.site",18],["c2g.at",18],["bitcosite.com",[18,405]],["cryptosh.pro",18],["link68.net",18],["traffic123.net",18],["windowslite.net",[18,197]],["viewfr.com",18],["cl1ca.com",18],["4br.me",18],["fir3.net",18],["seulink.*",18],["encurtalink.*",18],["kiddyshort.com",18],["watchmygf.me",[19,44]],["camwhores.*",[19,29,71,72,73]],["camwhorez.tv",[19,29,71,72]],["cambay.tv",[19,52,71,101,103,104,105,106]],["fpo.xxx",[19,52]],["sexemix.com",19],["heavyfetish.com",[19,564]],["thotcity.su",19],["viralxxxporn.com",[19,252]],["tube8.*",[20,21]],["you-porn.com",21],["youporn.*",21],["youporngay.com",21],["youpornru.com",21],["redtube.*",21],["9908ww.com",21],["adelaidepawnbroker.com",21],["bztube.com",21],["hotovs.com",21],["insuredhome.org",21],["nudegista.com",21],["pornluck.com",21],["vidd.se",21],["pornhub.*",[21,170]],["pornhub.com",21],["pornerbros.com",22],["freep.com",22],["porn.com",23],["tune.pk",24],["noticias.gospelmais.com.br",25],["techperiod.com",25],["viki.com",[26,27]],["watch-series.*",28],["watchseries.*",28],["vev.*",28],["vidop.*",28],["vidup.*",28],["sleazyneasy.com",[29,30,31]],["smutr.com",[29,178]],["tktube.com",29],["yourporngod.com",[29,30]],["javbangers.com",[29,289]],["camfox.com",29],["camthots.tv",[29,101]],["shegotass.info",29],["amateur8.com",29],["bigtitslust.com",29],["ebony8.com",29],["freeporn8.com",29],["lesbian8.com",29],["maturetubehere.com",29],["sortporn.com",29],["webcamvau.com",29],["motherporno.com",[29,30,52,103]],["theporngod.com",[29,30]],["watchdirty.to",[29,72,73,104]],["pornsocket.com",32],["luxuretv.com",33],["porndig.com",[34,35]],["webcheats.com.br",36],["ceesty.com",[37,38]],["gestyy.com",[37,38]],["corneey.com",38],["destyy.com",38],["festyy.com",38],["sh.st",38],["mitaku.net",38],["angrybirdsnest.com",39],["zrozz.com",39],["clix4btc.com",39],["4tests.com",39],["goltelevision.com",39],["news-und-nachrichten.de",39],["laradiobbs.net",39],["urlaubspartner.net",39],["produktion.de",39],["cinemaxxl.de",39],["bladesalvador.com",39],["tempr.email",39],["cshort.org",39],["friendproject.net",39],["covrhub.com",39],["katfile.com",39],["trust.zone",39],["business-standard.com",39],["planetsuzy.org",40],["empflix.com",41],["gogoanime.*",[42,43]],["adrianmissionminute.com",42],["alejandrocenturyoil.com",42],["alleneconomicmatter.com",42],["apinchcaseation.com",42],["bethshouldercan.com",42],["bigclatterhomesguideservice.com",42],["bradleyviewdoctor.com",42],["brittneystandardwestern.com",42],["brookethoughi.com",42],["brucevotewithin.com",42],["cindyeyefinal.com",42],["denisegrowthwide.com",42],["donaldlineelse.com",42],["edwardarriveoften.com",42],["erikcoldperson.com",42],["evelynthankregion.com",42],["graceaddresscommunity.com",42],["heatherdiscussionwhen.com",42],["heatherwholeinvolve.com",42],["housecardsummerbutton.com",42],["jamessoundcost.com",42],["jamesstartstudent.com",42],["jamiesamewalk.com",42],["jasminetesttry.com",42],["jasonresponsemeasure.com",42],["jayservicestuff.com",42],["jessicaglassauthor.com",42],["johntryopen.com",42],["josephseveralconcern.com",42],["kennethofficialitem.com",42],["kristiesoundsimply.com",42],["lisatrialidea.com",42],["lorimuchbenefit.com",42],["loriwithinfamily.com",42],["lukecomparetwo.com",42],["markstyleall.com",42],["michaelapplysome.com",42],["morganoperationface.com",42],["nathanfromsubject.com",42],["nectareousoverelate.com",42],["paulkitchendark.com",42],["rebeccaneverbase.com",42],["roberteachfinal.com",42],["robertordercharacter.com",42],["robertplacespace.com",42],["ryanagoinvolve.com",42],["sandratableother.com",42],["sandrataxeight.com",42],["seanshowcould.com",42],["sethniceletter.com",42],["shannonpersonalcost.com",42],["sharonwhiledemocratic.com",42],["stevenimaginelittle.com",42],["strawberriesporail.com",42],["susanhavekeep.com",42],["timberwoodanotia.com",42],["tinycat-voe-fashion.com",42],["toddpartneranimal.com",42],["troyyourlead.com",42],["uptodatefinishconference.com",42],["uptodatefinishconferenceroom.com",42],["vincentincludesuccessful.com",42],["voe.sx",42],["maxfinishseveral.com",42],["motphimtv.com",42],["rabbitstream.net",42],["projectfreetv.one",42],["fmovies.*",42],["freeplayervideo.com",42],["nazarickol.com",42],["player-cdn.com",42],["playhydrax.com",[42,473,474]],["1movies.*",[43,49]],["xmovies8.*",43],["masteranime.tv",43],["0123movies.*",43],["gostream.*",43],["gomovies.*",43],["transparentcalifornia.com",44],["deepbrid.com",45],["webnovel.com",46],["streamwish.*",[47,48]],["oneupload.to",48],["wishfast.top",48],["rubystm.com",48],["rubyvid.com",48],["rubyvidhub.com",48],["stmruby.com",48],["streamruby.com",48],["schwaebische.de",50],["8tracks.com",51],["3movs.com",52],["bravoerotica.net",[52,103]],["youx.xxx",52],["camclips.tv",[52,178]],["xtits.*",[52,103]],["camflow.tv",[52,103,104,149,252]],["camhoes.tv",[52,101,103,104,149,252]],["xmegadrive.com",52],["xxxymovies.com",52],["xxxshake.com",52],["gayck.com",52],["xhand.com",[52,103]],["analdin.com",[52,103]],["revealname.com",53],["pouvideo.*",54],["povvideo.*",54],["povw1deo.*",54],["povwideo.*",54],["powv1deo.*",54],["powvibeo.*",54],["powvideo.*",54],["powvldeo.*",54],["golfchannel.com",55],["telemundodeportes.com",55],["stream.nbcsports.com",55],["mathdf.com",55],["gamcore.com",56],["porcore.com",56],["porngames.tv",56],["69games.xxx",56],["javmix.app",56],["tecknity.com",57],["haaretz.co.il",58],["haaretz.com",58],["hungama.com",58],["a-o.ninja",58],["anime-odcinki.pl",58],["kumpulmanga.org",58],["shortgoo.blogspot.com",58],["tonanmedia.my.id",[58,428]],["yurasu.xyz",58],["isekaipalace.com",58],["plyjam.*",[59,60]],["ennovelas.com",[60,64]],["foxsports.com.au",61],["canberratimes.com.au",61],["thesimsresource.com",62],["fxporn69.*",63],["vipbox.*",64],["viprow.*",64],["ctrl.blog",65],["sportlife.es",66],["finofilipino.org",67],["desbloqueador.*",68],["xberuang.*",69],["teknorizen.*",69],["mysflink.blogspot.com",69],["assia.tv",70],["assia4.com",70],["assia24.com",70],["cwtvembeds.com",[72,102]],["camlovers.tv",72],["porntn.com",72],["pornissimo.org",72],["sexcams-24.com",[72,104]],["watchporn.to",[72,104]],["camwhorez.video",72],["footstockings.com",[72,73,104]],["xmateur.com",[72,73,104]],["multi.xxx",73],["worldofbitco.in",[74,75]],["weatherx.co.in",[74,75]],["getyourbitco.in",74],["sunbtc.space",74],["subtorrents.*",76],["subtorrents1.*",76],["newpelis.*",76],["pelix.*",76],["allcalidad.*",76],["infomaniakos.*",76],["ojogos.com.br",77],["powforums.com",78],["supforums.com",78],["studybullet.com",78],["usgamer.net",79],["recordonline.com",79],["freebitcoin.win",80],["e-monsite.com",80],["coindice.win",80],["temp-mails.com",81],["freiepresse.de",82],["investing.com",83],["tornadomovies.*",84],["mp3fiber.com",85],["chicoer.com",86],["dailybreeze.com",86],["dailybulletin.com",86],["dailynews.com",86],["delcotimes.com",86],["eastbaytimes.com",86],["macombdaily.com",86],["ocregister.com",86],["pasadenastarnews.com",86],["pe.com",86],["presstelegram.com",86],["redlandsdailyfacts.com",86],["reviewjournal.com",86],["santacruzsentinel.com",86],["saratogian.com",86],["sentinelandenterprise.com",86],["sgvtribune.com",86],["tampabay.com",86],["times-standard.com",86],["theoaklandpress.com",86],["trentonian.com",86],["twincities.com",86],["whittierdailynews.com",86],["bostonherald.com",86],["dailycamera.com",86],["sbsun.com",86],["dailydemocrat.com",86],["montereyherald.com",86],["orovillemr.com",86],["record-bee.com",86],["redbluffdailynews.com",86],["reporterherald.com",86],["thereporter.com",86],["timescall.com",86],["timesheraldonline.com",86],["ukiahdailyjournal.com",86],["dailylocal.com",86],["mercurynews.com",86],["suedkurier.de",87],["anysex.com",89],["icdrama.*",90],["vlist.se",90],["mangasail.*",90],["pornve.com",91],["file4go.*",92],["coolrom.com.au",92],["pornohirsch.net",93],["marie-claire.es",94],["gamezhero.com",94],["flashgirlgames.com",94],["onlinesudoku.games",94],["mpg.football",94],["sssam.com",94],["globalnews.ca",95],["drinksmixer.com",96],["leitesculinaria.com",96],["fupa.net",97],["browardpalmbeach.com",98],["dallasobserver.com",98],["houstonpress.com",98],["miaminewtimes.com",98],["phoenixnewtimes.com",98],["westword.com",98],["nhentai.net",99],["nowtv.com.tr",100],["caminspector.net",101],["camwhoreshd.com",101],["camgoddess.tv",101],["gay4porn.com",103],["mypornhere.com",103],["mangovideo.*",104],["love4porn.com",104],["thotvids.com",104],["watchmdh.to",104],["celebwhore.com",104],["cluset.com",104],["4kporn.xxx",104],["xhomealone.com",104],["lusttaboo.com",[104,362]],["hentai-moon.com",104],["sexwebvideo.com",104],["sexwebvideo.net",104],["camhub.cc",[104,534]],["mediapason.it",107],["linkspaid.com",107],["tuotromedico.com",107],["neoteo.com",107],["phoneswiki.com",107],["celebmix.com",107],["myneobuxportal.com",107],["oyungibi.com",107],["25yearslatersite.com",107],["jeshoots.com",108],["techhx.com",108],["karanapk.com",108],["flashplayer.fullstacks.net",110],["cloudapps.herokuapp.com",110],["youfiles.herokuapp.com",110],["texteditor.nsspot.net",110],["temp-mail.org",111],["asianclub.*",112],["javhdporn.net",112],["vidmoly.to",113],["comnuan.com",114],["veedi.com",115],["battleboats.io",115],["anitube.*",116],["fruitlab.com",116],["acetack.com",116],["androidquest.com",116],["apklox.com",116],["chhaprawap.in",116],["gujarativyakaran.com",116],["kashmirstudentsinformation.in",116],["kisantime.com",116],["shetkaritoday.in",116],["pastescript.com",116],["trimorspacks.com",116],["updrop.link",116],["haddoz.net",116],["streamingcommunity.*",116],["garoetpos.com",116],["stiletv.it",117],["mixdrop.*",118],["hqtv.biz",119],["liveuamap.com",120],["muvibg.com",120],["vinomo.xyz",121],["bembed.net",121],["embedv.net",121],["fslinks.org",121],["listeamed.net",121],["v6embed.xyz",121],["vembed.*",121],["vgplayer.xyz",121],["vid-guard.com",121],["audycje.tokfm.pl",122],["hulu.com",[123,124,125]],["shush.se",126],["allkpop.com",127],["empire-anime.*",[128,423,424,425,426,427]],["empire-streaming.*",[128,423,424,425]],["empire-anime.com",[128,423,424,425]],["empire-streamz.fr",[128,423,424,425]],["empire-stream.*",[128,423,424,425]],["pickcrackpasswords.blogspot.com",129],["kfrfansub.com",130],["thuglink.com",130],["voipreview.org",130],["illicoporno.com",131],["lavoixdux.com",131],["tonpornodujour.com",131],["jacquieetmichel.net",131],["swame.com",131],["vosfemmes.com",131],["voyeurfrance.net",131],["jacquieetmicheltv.net",[131,483,484]],["hanime.tv",132],["pogo.com",133],["cloudvideo.tv",134],["legionjuegos.org",135],["legionpeliculas.org",135],["legionprogramas.org",135],["16honeys.com",136],["elespanol.com",137],["remodelista.com",138],["coolmathgames.com",[139,140,141,588]],["audiofanzine.com",142],["uploadev.*",143],["hitokin.net",144],["developerinsider.co",145],["ilprimatonazionale.it",146],["hotabis.com",146],["root-nation.com",146],["italpress.com",146],["airsoftmilsimnews.com",146],["artribune.com",146],["thehindu.com",147],["cambro.tv",[148,149]],["boobsradar.com",[149,252,544]],["nibelungen-kurier.de",150],["ver-pelis-online.*",151],["adfoc.us",152],["tea-coffee.net",152],["spatsify.com",152],["newedutopics.com",152],["getviralreach.in",152],["edukaroo.com",152],["funkeypagali.com",152],["careersides.com",152],["nayisahara.com",152],["wikifilmia.com",152],["infinityskull.com",152],["viewmyknowledge.com",152],["iisfvirtual.in",152],["starxinvestor.com",152],["jkssbalerts.com",152],["sahlmarketing.net",152],["filmypoints.in",152],["fitnessholic.net",152],["moderngyan.com",152],["sattakingcharts.in",152],["freshbhojpuri.com",152],["bankshiksha.in",152],["earn.mpscstudyhub.com",152],["earn.quotesopia.com",152],["money.quotesopia.com",152],["best-mobilegames.com",152],["learn.moderngyan.com",152],["bharatsarkarijobalert.com",152],["quotesopia.com",152],["creditsgoal.com",152],["bgmi32bitapk.in",152],["techacode.com",152],["trickms.com",152],["ielts-isa.edu.vn",152],["loan.punjabworks.com",152],["sptfy.be",152],["mcafee-com.com",[152,227]],["pianetamountainbike.it",153],["barchart.com",154],["modelisme.com",155],["parasportontario.ca",155],["prescottenews.com",155],["nrj-play.fr",156],["hackingwithreact.com",157],["gutekueche.at",158],["eplfootballmatch.com",159],["ancient-origins.*",159],["peekvids.com",160],["playvids.com",160],["pornflip.com",160],["redensarten-index.de",161],["vw-page.com",162],["viz.com",[163,164]],["0rechner.de",165],["configspc.com",166],["xopenload.me",166],["uptobox.com",166],["uptostream.com",166],["japgay.com",167],["mega-debrid.eu",168],["dreamdth.com",169],["diaridegirona.cat",171],["diariodeibiza.es",171],["diariodemallorca.es",171],["diarioinformacion.com",171],["eldia.es",171],["emporda.info",171],["farodevigo.es",171],["laopinioncoruna.es",171],["laopiniondemalaga.es",171],["laopiniondemurcia.es",171],["laopiniondezamora.es",171],["laprovincia.es",171],["levante-emv.com",171],["mallorcazeitung.es",171],["regio7.cat",171],["superdeporte.es",171],["playpaste.com",172],["cnbc.com",173],["primevideo.com",174],["read.amazon.*",[174,557]],["firefaucet.win",175],["74k.io",[176,177]],["fullhdxxx.com",179],["pornclassic.tube",180],["tubepornclassic.com",180],["etonline.com",181],["creatur.io",181],["lookcam.*",181],["drphil.com",181],["urbanmilwaukee.com",181],["lootlinks.*",181],["ontiva.com",181],["hideandseek.world",181],["myabandonware.com",181],["kendam.com",181],["wttw.com",181],["synonyms.com",181],["definitions.net",181],["hostmath.com",181],["camvideoshub.com",181],["minhaconexao.com.br",181],["home-made-videos.com",183],["amateur-couples.com",183],["slutdump.com",183],["dpstream.*",184],["produsat.com",185],["bluemediafiles.*",186],["12thman.com",187],["acusports.com",187],["atlantic10.com",187],["auburntigers.com",187],["baylorbears.com",187],["bceagles.com",187],["bgsufalcons.com",187],["big12sports.com",187],["bigten.org",187],["bradleybraves.com",187],["butlersports.com",187],["cmumavericks.com",187],["conferenceusa.com",187],["cyclones.com",187],["dartmouthsports.com",187],["daytonflyers.com",187],["dbupatriots.com",187],["dbusports.com",187],["denverpioneers.com",187],["fduknights.com",187],["fgcuathletics.com",187],["fightinghawks.com",187],["fightingillini.com",187],["floridagators.com",187],["friars.com",187],["friscofighters.com",187],["gamecocksonline.com",187],["goarmywestpoint.com",187],["gobison.com",187],["goblueraiders.com",187],["gobobcats.com",187],["gocards.com",187],["gocreighton.com",187],["godeacs.com",187],["goexplorers.com",187],["goetbutigers.com",187],["gofrogs.com",187],["gogriffs.com",187],["gogriz.com",187],["golobos.com",187],["gomarquette.com",187],["gopack.com",187],["gophersports.com",187],["goprincetontigers.com",187],["gopsusports.com",187],["goracers.com",187],["goshockers.com",187],["goterriers.com",187],["gotigersgo.com",187],["gousfbulls.com",187],["govandals.com",187],["gowyo.com",187],["goxavier.com",187],["gozags.com",187],["gozips.com",187],["griffinathletics.com",187],["guhoyas.com",187],["gwusports.com",187],["hailstate.com",187],["hamptonpirates.com",187],["hawaiiathletics.com",187],["hokiesports.com",187],["huskers.com",187],["icgaels.com",187],["iuhoosiers.com",187],["jsugamecocksports.com",187],["longbeachstate.com",187],["loyolaramblers.com",187],["lrtrojans.com",187],["lsusports.net",187],["morrisvillemustangs.com",187],["msuspartans.com",187],["muleriderathletics.com",187],["mutigers.com",187],["navysports.com",187],["nevadawolfpack.com",187],["niuhuskies.com",187],["nkunorse.com",187],["nuhuskies.com",187],["nusports.com",187],["okstate.com",187],["olemisssports.com",187],["omavs.com",187],["ovcsports.com",187],["owlsports.com",187],["purduesports.com",187],["redstormsports.com",187],["richmondspiders.com",187],["sfajacks.com",187],["shupirates.com",187],["siusalukis.com",187],["smcgaels.com",187],["smumustangs.com",187],["soconsports.com",187],["soonersports.com",187],["themw.com",187],["tulsahurricane.com",187],["txst.com",187],["txstatebobcats.com",187],["ubbulls.com",187],["ucfknights.com",187],["ucirvinesports.com",187],["uconnhuskies.com",187],["uhcougars.com",187],["uicflames.com",187],["umterps.com",187],["uncwsports.com",187],["unipanthers.com",187],["unlvrebels.com",187],["uoflsports.com",187],["usdtoreros.com",187],["utahstateaggies.com",187],["utepathletics.com",187],["utrockets.com",187],["uvmathletics.com",187],["uwbadgers.com",187],["villanova.com",187],["wkusports.com",187],["wmubroncos.com",187],["woffordterriers.com",187],["1pack1goal.com",187],["bcuathletics.com",187],["bubraves.com",187],["goblackbears.com",187],["golightsgo.com",187],["gomcpanthers.com",187],["goutsa.com",187],["mercerbears.com",187],["pirateblue.com",187],["pirateblue.net",187],["pirateblue.org",187],["quinnipiacbobcats.com",187],["towsontigers.com",187],["tribeathletics.com",187],["tribeclub.com",187],["utepminermaniacs.com",187],["utepminers.com",187],["wkutickets.com",187],["aopathletics.org",187],["atlantichockeyonline.com",187],["bigsouthnetwork.com",187],["bigsouthsports.com",187],["chawomenshockey.com",187],["dbupatriots.org",187],["drakerelays.org",187],["ecac.org",187],["ecacsports.com",187],["emueagles.com",187],["emugameday.com",187],["gculopes.com",187],["godrakebulldog.com",187],["godrakebulldogs.com",187],["godrakebulldogs.net",187],["goeags.com",187],["goislander.com",187],["goislanders.com",187],["gojacks.com",187],["gomacsports.com",187],["gseagles.com",187],["hubison.com",187],["iowaconference.com",187],["ksuowls.com",187],["lonestarconference.org",187],["mascac.org",187],["midwestconference.org",187],["mountaineast.org",187],["niu-pack.com",187],["nulakers.ca",187],["oswegolakers.com",187],["ovcdigitalnetwork.com",187],["pacersports.com",187],["rmacsports.org",187],["rollrivers.com",187],["samfordsports.com",187],["uncpbraves.com",187],["usfdons.com",187],["wiacsports.com",187],["alaskananooks.com",187],["broncathleticfund.com",187],["cameronaggies.com",187],["columbiacougars.com",187],["etownbluejays.com",187],["gobadgers.ca",187],["golancers.ca",187],["gometrostate.com",187],["gothunderbirds.ca",187],["kentstatesports.com",187],["lehighsports.com",187],["lopers.com",187],["lycoathletics.com",187],["lycomingathletics.com",187],["maraudersports.com",187],["mauiinvitational.com",187],["msumavericks.com",187],["nauathletics.com",187],["nueagles.com",187],["nwusports.com",187],["oceanbreezenyc.org",187],["patriotathleticfund.com",187],["pittband.com",187],["principiaathletics.com",187],["roadrunnersathletics.com",187],["sidearmsocial.com",187],["snhupenmen.com",187],["stablerarena.com",187],["stoutbluedevils.com",187],["uwlathletics.com",187],["yumacs.com",187],["collegefootballplayoff.com",187],["csurams.com",187],["cubuffs.com",187],["gobearcats.com",187],["gohuskies.com",187],["mgoblue.com",187],["osubeavers.com",187],["pittsburghpanthers.com",187],["rolltide.com",187],["texassports.com",187],["thesundevils.com",187],["uclabruins.com",187],["wvuathletics.com",187],["wvusports.com",187],["arizonawildcats.com",187],["calbears.com",187],["cuse.com",187],["georgiadogs.com",187],["goducks.com",187],["goheels.com",187],["gostanford.com",187],["insidekstatesports.com",187],["insidekstatesports.info",187],["insidekstatesports.net",187],["insidekstatesports.org",187],["k-stateathletics.com",187],["k-statefootball.net",187],["k-statefootball.org",187],["k-statesports.com",187],["k-statesports.net",187],["k-statesports.org",187],["k-statewomenshoops.com",187],["k-statewomenshoops.net",187],["k-statewomenshoops.org",187],["kstateathletics.com",187],["kstatefootball.net",187],["kstatefootball.org",187],["kstatesports.com",187],["kstatewomenshoops.com",187],["kstatewomenshoops.net",187],["kstatewomenshoops.org",187],["ksuathletics.com",187],["ksusports.com",187],["scarletknights.com",187],["showdownforrelief.com",187],["syracusecrunch.com",187],["texastech.com",187],["theacc.com",187],["ukathletics.com",187],["usctrojans.com",187],["utahutes.com",187],["utsports.com",187],["wsucougars.com",187],["vidlii.com",[187,212]],["tricksplit.io",187],["fangraphs.com",188],["stern.de",189],["geo.de",189],["brigitte.de",189],["tvspielfilm.de",[190,191,192,193]],["tvtoday.de",[190,191,192,193]],["chip.de",[190,191,192,193]],["focus.de",[190,191,192,193]],["fitforfun.de",[190,191,192,193]],["n-tv.de",194],["player.rtl2.de",195],["planetaminecraft.com",196],["cravesandflames.com",197],["codesnse.com",197],["flyad.vip",197],["lapresse.ca",198],["kolyoom.com",199],["ilovephd.com",199],["negumo.com",200],["games.wkb.jp",[201,202]],["fandom.com",[203,605,606]],["kenshi.fandom.com",204],["hausbau-forum.de",205],["homeairquality.org",205],["faucettronn.click",205],["fake-it.ws",206],["laksa19.github.io",207],["1shortlink.com",208],["u-s-news.com",209],["luscious.net",210],["makemoneywithurl.com",211],["junkyponk.com",211],["healthfirstweb.com",211],["vocalley.com",211],["yogablogfit.com",211],["howifx.com",[211,390]],["en.financerites.com",211],["mythvista.com",211],["livenewsflix.com",211],["cureclues.com",211],["apekite.com",211],["host-buzz.com",211],["insmyst.com",211],["wp2host.com",211],["blogtechh.com",211],["techbixby.com",211],["blogmyst.com",211],["enit.in",211],["iammagnus.com",212],["dailyvideoreports.net",212],["unityassets4free.com",212],["docer.*",213],["resetoff.pl",213],["sexodi.com",213],["cdn77.org",214],["3sexporn.com",215],["momxxxsex.com",215],["myfreevintageporn.com",215],["penisbuyutucum.net",215],["ujszo.com",216],["newsmax.com",217],["nadidetarifler.com",218],["siz.tv",218],["suzylu.co.uk",[219,220]],["onworks.net",221],["yabiladi.com",221],["downloadsoft.net",222],["newsobserver.com",223],["arkadiumhosted.com",223],["pixsera.net",224],["testlanguages.com",225],["newsinlevels.com",225],["videosinlevels.com",225],["bookmystrip.com",226],["starkroboticsfrc.com",227],["sinonimos.de",227],["antonimos.de",227],["quesignifi.ca",227],["tiktokrealtime.com",227],["tiktokcounter.net",227],["tpayr.xyz",227],["poqzn.xyz",227],["ashrfd.xyz",227],["rezsx.xyz",227],["tryzt.xyz",227],["ashrff.xyz",227],["rezst.xyz",227],["dawenet.com",227],["erzar.xyz",227],["waezm.xyz",227],["waezg.xyz",227],["blackwoodacademy.org",227],["cryptednews.space",227],["vivuq.com",227],["swgop.com",227],["vbnmll.com",227],["telcoinfo.online",227],["dshytb.com",227],["btcbitco.in",[227,231]],["btcsatoshi.net",227],["cempakajaya.com",227],["crypto4yu.com",227],["readbitcoin.org",227],["wiour.com",227],["finish.addurl.biz",227],["aiimgvlog.fun",[227,234]],["laweducationinfo.com",227],["savemoneyinfo.com",227],["worldaffairinfo.com",227],["godstoryinfo.com",227],["successstoryinfo.com",227],["cxissuegk.com",227],["learnmarketinfo.com",227],["bhugolinfo.com",227],["armypowerinfo.com",227],["rsadnetworkinfo.com",227],["rsinsuranceinfo.com",227],["rsfinanceinfo.com",227],["rsgamer.app",227],["rssoftwareinfo.com",227],["rshostinginfo.com",227],["rseducationinfo.com",227],["phonereviewinfo.com",227],["makeincomeinfo.com",227],["gknutshell.com",227],["vichitrainfo.com",227],["workproductivityinfo.com",227],["dopomininfo.com",227],["hostingdetailer.com",227],["fitnesssguide.com",227],["tradingfact4u.com",227],["cryptofactss.com",227],["softwaredetail.com",227],["artoffocas.com",227],["insurancesfact.com",227],["travellingdetail.com",227],["advertisingexcel.com",227],["allcryptoz.net",227],["batmanfactor.com",227],["beautifulfashionnailart.com",227],["crewbase.net",227],["documentaryplanet.xyz",227],["crewus.net",227],["gametechreviewer.com",227],["midebalonu.net",227],["misterio.ro",227],["phineypet.com",227],["seory.xyz",227],["shinbhu.net",227],["shinchu.net",227],["substitutefor.com",227],["talkforfitness.com",227],["thefitbrit.co.uk",227],["thumb8.net",227],["thumb9.net",227],["topcryptoz.net",227],["uniqueten.net",227],["ultraten.net",227],["exactpay.online",227],["quins.us",227],["kiddyearner.com",227],["imagereviser.com",228],["tech.pubghighdamage.com",229],["tech.techkhulasha.com",229],["hipsonyc.com",229],["jiocinema.com",229],["rapid-cloud.co",229],["uploadmall.com",229],["rkd3.dev",229],["4funbox.com",230],["nephobox.com",230],["1024tera.com",230],["terabox.*",230],["blog.cryptowidgets.net",231],["blog.insurancegold.in",231],["blog.wiki-topia.com",231],["blog.coinsvalue.net",231],["blog.cookinguide.net",231],["blog.freeoseocheck.com",231],["blog24.me",231],["bildirim.*",233],["arahdrive.com",234],["appsbull.com",235],["diudemy.com",235],["maqal360.com",[235,236,237]],["lifesurance.info",238],["akcartoons.in",239],["cybercityhelp.in",239],["infokeeda.xyz",241],["webzeni.com",241],["dl.apkmoddone.com",242],["phongroblox.com",242],["apkmodvn.com",243],["fuckingfast.net",244],["streamelements.com",245],["share.hntv.tv",[245,674,675,676]],["forum.dji.com",[245,676]],["unionpayintl.com",[245,675]],["tickhosting.com",246],["in91vip.win",247],["kicker.de",[248,635]],["t-online.de",249],["upornia.*",[250,251]],["bobs-tube.com",252],["arcade.buzzrtv.com",253],["arcade.dailygazette.com",253],["arcade.lemonde.fr",253],["arena.gamesforthebrain.com",253],["bestpuzzlesandgames.com",253],["cointiply.arkadiumarena.com",253],["gamelab.com",253],["games.abqjournal.com",253],["games.amny.com",253],["games.bellinghamherald.com",253],["games.besthealthmag.ca",253],["games.bnd.com",253],["games.boston.com",253],["games.bostonglobe.com",253],["games.bradenton.com",253],["games.centredaily.com",253],["games.charlotteobserver.com",253],["games.cnhinews.com",253],["games.crosswordgiant.com",253],["games.dailymail.co.uk",253],["games.dallasnews.com",253],["games.daytondailynews.com",253],["games.denverpost.com",253],["games.everythingzoomer.com",253],["games.fresnobee.com",253],["games.gameshownetwork.com",253],["games.get.tv",253],["games.greatergood.com",253],["games.heraldonline.com",253],["games.heraldsun.com",253],["games.idahostatesman.com",253],["games.insp.com",253],["games.islandpacket.com",253],["games.journal-news.com",253],["games.kansas.com",253],["games.kansascity.com",253],["games.kentucky.com",253],["games.lancasteronline.com",253],["games.ledger-enquirer.com",253],["games.macon.com",253],["games.mashable.com",253],["games.mercedsunstar.com",253],["games.metro.us",253],["games.metv.com",253],["games.miamiherald.com",253],["games.modbee.com",253],["games.moviestvnetwork.com",253],["games.myrtlebeachonline.com",253],["games.nationalreview.com",253],["games.newsobserver.com",253],["games.parade.com",253],["games.pressdemocrat.com",253],["games.puzzlebaron.com",253],["games.puzzler.com",253],["games.puzzles.ca",253],["games.qns.com",253],["games.readersdigest.ca",253],["games.sacbee.com",253],["games.sanluisobispo.com",253],["games.sixtyandme.com",253],["games.sltrib.com",253],["games.springfieldnewssun.com",253],["games.star-telegram.com",253],["games.startribune.com",253],["games.sunherald.com",253],["games.theadvocate.com",253],["games.thenewstribune.com",253],["games.theolympian.com",253],["games.theportugalnews.com",253],["games.thestar.com",253],["games.thestate.com",253],["games.tri-cityherald.com",253],["games.triviatoday.com",253],["games.usnews.com",253],["games.word.tips",253],["games.wordgenius.com",253],["games.wtop.com",253],["jeux.meteocity.com",253],["juegos.as.com",253],["juegos.elnuevoherald.com",253],["juegos.elpais.com",253],["philly.arkadiumarena.com",253],["play.dictionary.com",253],["puzzles.bestforpuzzles.com",253],["puzzles.centralmaine.com",253],["puzzles.crosswordsolver.org",253],["puzzles.independent.co.uk",253],["puzzles.nola.com",253],["puzzles.pressherald.com",253],["puzzles.standard.co.uk",253],["puzzles.sunjournal.com",253],["arcai.com",254],["my-code4you.blogspot.com",255],["flickr.com",256],["firefile.cc",257],["pestleanalysis.com",257],["kochamjp.pl",257],["tutorialforlinux.com",257],["whatsaero.com",257],["animeblkom.net",[257,271]],["blkom.com",257],["globes.co.il",[258,259]],["jardiner-malin.fr",260],["tw-calc.net",261],["ohmybrush.com",262],["talkceltic.net",263],["mentalfloss.com",264],["uprafa.com",265],["cube365.net",266],["wwwfotografgotlin.blogspot.com",267],["freelistenonline.com",267],["badassdownloader.com",268],["quickporn.net",269],["yellowbridge.com",270],["aosmark.com",272],["ctrlv.*",273],["atozmath.com",[274,275,276,277,278,279,280]],["newyorker.com",281],["brighteon.com",282],["more.tv",283],["video1tube.com",284],["alohatube.xyz",284],["4players.de",285],["onlinesoccermanager.com",285],["fshost.me",286],["link.cgtips.org",287],["hentaicloud.com",288],["netfapx.com",290],["javdragon.org",290],["javneon.tv",290],["paperzonevn.com",291],["hentaienglish.com",292],["hentaiporno.xxx",292],["venge.io",[293,294]],["btcbux.io",295],["its.porn",[296,297]],["atv.at",298],["2ndrun.tv",299],["rackusreads.com",299],["teachmemicro.com",299],["willcycle.com",299],["kusonime.com",[300,301]],["123movieshd.*",302],["imgur.com",[303,304,565]],["hentai-party.com",305],["hentaicomics.pro",305],["xxx-comics.pro",305],["uproxy.*",306],["animesa.*",307],["subtitle.one",308],["subtitleone.cc",308],["genshinimpactcalculator.com",309],["mysexgames.com",310],["cinecalidad.*",[311,312]],["embed.indavideo.hu",313],["xnxx.com",314],["xvideos.*",314],["gdr-online.com",315],["mmm.dk",316],["iqiyi.com",[317,318,457]],["m.iqiyi.com",319],["nbcolympics.com",320],["apkhex.com",321],["indiansexstories2.net",322],["issstories.xyz",322],["1340kbbr.com",323],["gorgeradio.com",323],["kduk.com",323],["kedoam.com",323],["kejoam.com",323],["kelaam.com",323],["khsn1230.com",323],["kjmx.rocks",323],["kloo.com",323],["klooam.com",323],["klykradio.com",323],["kmed.com",323],["kmnt.com",323],["kool991.com",323],["kpnw.com",323],["kppk983.com",323],["krktcountry.com",323],["ktee.com",323],["kwro.com",323],["kxbxfm.com",323],["thevalley.fm",323],["quizlet.com",324],["dsocker1234.blogspot.com",325],["schoolcheats.net",[326,327]],["mgnet.xyz",328],["japopav.tv",329],["lvturbo.com",329],["designtagebuch.de",330],["pixroute.com",331],["uploady.io",332],["calculator-online.net",333],["luckydice.net",334],["adarima.org",334],["weatherwx.com",334],["sattaguess.com",334],["winshell.de",334],["rosasidan.ws",334],["modmakers.xyz",334],["gamepure.in",334],["warrenrahul.in",334],["austiblox.net",334],["upiapi.in",334],["networkhint.com",334],["thichcode.net",334],["texturecan.com",334],["tikmate.app",[334,465]],["arcaxbydz.id",334],["quotesshine.com",334],["porngames.club",335],["sexgames.xxx",335],["111.90.159.132",336],["mobile-tracker-free.com",337],["pfps.gg",338],["social-unlock.com",339],["superpsx.com",340],["ninja.io",341],["sourceforge.net",342],["samfirms.com",343],["rapelust.com",344],["vtube.to",344],["vtplay.net",344],["desitelugusex.com",344],["dvdplay.*",344],["xvideos-downloader.net",344],["xxxvideotube.net",344],["sdefx.cloud",344],["nozomi.la",344],["moviesonlinefree.net",344],["banned.video",345],["madmaxworld.tv",345],["androidpolice.com",345],["babygaga.com",345],["backyardboss.net",345],["carbuzz.com",345],["cbr.com",345],["collider.com",345],["dualshockers.com",345],["footballfancast.com",345],["footballleagueworld.co.uk",345],["gamerant.com",345],["givemesport.com",345],["hardcoregamer.com",345],["hotcars.com",345],["howtogeek.com",345],["makeuseof.com",345],["moms.com",345],["movieweb.com",345],["pocket-lint.com",345],["pocketnow.com",345],["screenrant.com",345],["simpleflying.com",345],["thegamer.com",345],["therichest.com",345],["thesportster.com",345],["thethings.com",345],["thetravel.com",345],["topspeed.com",345],["xda-developers.com",345],["huffpost.com",346],["ingles.com",347],["spanishdict.com",347],["surfline.com",[348,349]],["play.tv3.ee",350],["play.tv3.lt",350],["play.tv3.lv",350],["tv3play.skaties.lv",350],["trendyoum.com",351],["bulbagarden.net",352],["hollywoodlife.com",353],["mat6tube.com",354],["textstudio.co",355],["newtumbl.com",356],["apkmaven.*",357],["aruble.net",358],["nevcoins.club",359],["mail.com",360],["gmx.*",361],["oggi.it",[363,364]],["manoramamax.com",363],["video.gazzetta.it",[363,364]],["mangakita.id",365],["avpgalaxy.net",366],["mhma12.tech",367],["panda-novel.com",368],["zebranovel.com",368],["lightsnovel.com",368],["eaglesnovel.com",368],["pandasnovel.com",368],["ewrc-results.com",369],["kizi.com",370],["cyberscoop.com",371],["fedscoop.com",371],["canale.live",372],["indiatimes.com",373],["netzwelt.de",374],["jeep-cj.com",375],["sponsorhunter.com",376],["cloudcomputingtopics.net",377],["likecs.com",378],["tiscali.it",379],["linkspy.cc",380],["adshnk.com",381],["chattanoogan.com",382],["adsy.pw",383],["playstore.pw",383],["socialmediagirls.com",384],["windowspro.de",385],["snapinst.app",386],["tvtv.ca",387],["tvtv.us",387],["mydaddy.cc",388],["roadtrippin.fr",389],["vavada5com.com",390],["anyporn.com",[391,408]],["bravoporn.com",391],["bravoteens.com",391],["crocotube.com",391],["hellmoms.com",391],["hellporno.com",391],["sex3.com",391],["tubewolf.com",391],["xbabe.com",391],["xcum.com",391],["zedporn.com",391],["imagetotext.info",392],["infokik.com",393],["freepik.com",394],["ddwloclawek.pl",[395,396]],["www.seznam.cz",397],["deezer.com",[398,711,712]],["my-subs.co",399],["plaion.com",400],["slideshare.net",[401,402]],["ustreasuryyieldcurve.com",403],["businesssoftwarehere.com",404],["goo.st",404],["freevpshere.com",404],["softwaresolutionshere.com",404],["gamereactor.*",406],["madoohd.com",407],["doomovie-hd.*",407],["staige.tv",409],["in-jpn.com",410],["oninet.ne.jp",410],["xth.jp",410],["androidadult.com",411],["streamvid.net",412],["watchtv24.com",413],["cellmapper.net",414],["medscape.com",415],["newscon.org",[416,417]],["arkadium.com",418],["wheelofgold.com",419],["drakecomic.*",419],["app.blubank.com",420],["mobileweb.bankmellat.ir",420],["sportdeutschland.tv",421],["kcra.com",421],["wcvb.com",421],["chat.nrj.fr",422],["chat.tchatche.com",[422,437]],["ccthesims.com",429],["chromeready.com",429],["coursedrive.org",429],["dtbps3games.com",429],["illustratemagazine.com",429],["uknip.co.uk",429],["vod.pl",430],["megadrive-emulator.com",431],["tvhay.*",[432,433]],["animesaga.in",434],["moviesapi.club",434],["bestx.stream",434],["watchx.top",434],["digimanie.cz",435],["svethardware.cz",435],["srvy.ninja",436],["cnn.com",[438,439,440]],["edmdls.com",441],["freshremix.net",441],["scenedl.org",441],["trakt.tv",442],["client.falixnodes.net",443],["shroomers.app",444],["classicalradio.com",445],["di.fm",445],["jazzradio.com",445],["radiotunes.com",445],["rockradio.com",445],["zenradio.com",445],["pc-builds.com",446],["qtoptens.com",446],["reuters.com",446],["today.com",446],["videogamer.com",446],["wrestlinginc.com",446],["gbatemp.net",446],["usatoday.com",[447,713]],["ydr.com",447],["getthit.com",448],["techedubyte.com",449],["soccerinhd.com",449],["movie-th.tv",450],["iwanttfc.com",451],["nutraingredients-asia.com",452],["nutraingredients-latam.com",452],["nutraingredients-usa.com",452],["nutraingredients.com",452],["ozulscansen.com",453],["nexusmods.com",454],["lookmovie.*",455],["lookmovie2.to",455],["royalroad.com",456],["biletomat.pl",458],["hextank.io",[459,460]],["filmizlehdfilm.com",[461,462,463,464]],["filmizletv.*",[461,462,463,464]],["fullfilmizle.cc",[461,462,463,464]],["gofilmizle.net",[461,462,463,464]],["btvplus.bg",466],["sagewater.com",467],["redlion.net",467],["satdl.com",468],["vidstreaming.xyz",469],["everand.com",470],["myradioonline.pl",471],["cbs.com",472],["paramountplus.com",472],["abysscdn.com",[473,474]],["fullxh.com",475],["galleryxh.site",475],["megaxh.com",475],["movingxh.world",475],["seexh.com",475],["unlockxh4.com",475],["valuexh.life",475],["xhaccess.com",475],["xhadult2.com",475],["xhadult3.com",475],["xhadult4.com",475],["xhadult5.com",475],["xhamster.*",475],["xhamster1.*",475],["xhamster10.*",475],["xhamster11.*",475],["xhamster12.*",475],["xhamster13.*",475],["xhamster14.*",475],["xhamster15.*",475],["xhamster16.*",475],["xhamster17.*",475],["xhamster18.*",475],["xhamster19.*",475],["xhamster20.*",475],["xhamster2.*",475],["xhamster3.*",475],["xhamster4.*",475],["xhamster42.*",475],["xhamster46.com",475],["xhamster5.*",475],["xhamster7.*",475],["xhamster8.*",475],["xhamsterporno.mx",475],["xhbig.com",475],["xhbranch5.com",475],["xhchannel.com",475],["xhdate.world",475],["xhday.com",475],["xhday1.com",475],["xhlease.world",475],["xhmoon5.com",475],["xhofficial.com",475],["xhopen.com",475],["xhplanet1.com",475],["xhplanet2.com",475],["xhreal2.com",475],["xhreal3.com",475],["xhspot.com",475],["xhtotal.com",475],["xhtree.com",475],["xhvictory.com",475],["xhwebsite.com",475],["xhwebsite2.com",475],["xhwebsite5.com",475],["xhwide1.com",475],["xhwide2.com",475],["xhwide5.com",475],["file-upload.net",476],["lightnovelworld.*",477],["acortalo.*",[478,479,480,481]],["acortar.*",[478,479,480,481]],["megadescarga.net",[478,479,480,481]],["megadescargas.net",[478,479,480,481]],["hentaihaven.xxx",482],["jacquieetmicheltv2.net",484],["a2zapk.*",485],["fcportables.com",[486,487]],["emurom.net",488],["freethesaurus.com",[489,490]],["thefreedictionary.com",[489,490]],["oeffentlicher-dienst.info",491],["im9.eu",492],["dcdlplayer8a06f4.xyz",493],["ultimate-guitar.com",494],["claimbits.net",495],["sexyscope.net",496],["kickassanime.*",497],["recherche-ebook.fr",498],["virtualdinerbot.com",498],["zonebourse.com",499],["pink-sluts.net",500],["andhrafriends.com",501],["benzinpreis.de",502],["turtleviplay.xyz",503],["paktech2.com",504],["defenseone.com",505],["govexec.com",505],["nextgov.com",505],["route-fifty.com",505],["sharing.wtf",506],["wetter3.de",507],["esportivos.fun",508],["cosmonova-broadcast.tv",509],["hartvannederland.nl",510],["shownieuws.nl",510],["vandaaginside.nl",510],["rock.porn",[511,512]],["videzz.net",[513,514]],["ezaudiobookforsoul.com",515],["club386.com",516],["littlebigsnake.com",517],["easyfun.gg",518],["smailpro.com",519],["ilgazzettino.it",520],["ilmessaggero.it",520],["3bmeteo.com",[521,522]],["mconverter.eu",523],["lover937.net",524],["10gb.vn",525],["pes6.es",526],["tactics.tools",[527,528]],["boundhub.com",529],["alocdnnetu.xyz",530],["reliabletv.me",531],["jakondo.ru",532],["filecrypt.*",533],["nolive.me",535],["wired.com",536],["spankbang.*",[537,538,539,567,568]],["anonymfile.com",540],["gofile.to",540],["dotycat.com",541],["rateyourmusic.com",542],["reporterpb.com.br",543],["blog-dnz.com",545],["18adultgames.com",546],["colnect.com",[547,548]],["adultgamesworld.com",549],["bgmiupdate.com.in",550],["reviewdiv.com",551],["parametric-architecture.com",552],["laurelberninteriors.com",[553,570]],["filmweb.pl",[554,555]],["voiceofdenton.com",556],["concealednation.org",556],["askattest.com",558],["opensubtitles.com",559],["www.google.*",560],["tacobell.com",561],["zefoy.com",562],["cnet.com",563],["natgeotv.com",566],["globo.com",569],["wayfair.com",571],["br.de",572],["indeed.com",573],["pasteboard.co",574],["clickhole.com",575],["deadspin.com",575],["gizmodo.com",575],["jalopnik.com",575],["jezebel.com",575],["kotaku.com",575],["lifehacker.com",575],["splinternews.com",575],["theinventory.com",575],["theonion.com",575],["theroot.com",575],["thetakeout.com",575],["pewresearch.org",575],["los40.com",[576,577]],["as.com",577],["telegraph.co.uk",[578,579]],["poweredbycovermore.com",[578,628]],["lumens.com",[578,628]],["verizon.com",580],["humanbenchmark.com",581],["politico.com",582],["officedepot.co.cr",[583,584]],["officedepot.*",[585,586]],["usnews.com",587],["factable.com",589],["zee5.com",590],["gala.fr",591],["geo.fr",591],["voici.fr",591],["gloucestershirelive.co.uk",592],["arsiv.mackolik.com",593],["jacksonguitars.com",594],["scandichotels.com",595],["stylist.co.uk",596],["nettiauto.com",597],["thaiairways.com",[598,599]],["cerbahealthcare.it",[600,601]],["futura-sciences.com",[600,617]],["toureiffel.paris",600],["tiendaenlinea.claro.com.ni",[602,603]],["tieba.baidu.com",604],["grasshopper.com",[607,608]],["epson.com.cn",[609,610,611,612]],["oe24.at",[613,614]],["szbz.de",613],["platform.autods.com",[615,616]],["wikihow.com",618],["citibank.com.sg",619],["uol.com.br",[620,621,622,623,624]],["gazzetta.gr",625],["digicol.dpm.org.cn",[626,627]],["virginmediatelevision.ie",629],["larazon.es",[630,631]],["waitrosecellar.com",[632,633,634]],["sharpen-free-design-generator.netlify.app",[636,637]],["help.cashctrl.com",[638,639]],["gry-online.pl",640],["vidaextra.com",641],["commande.rhinov.pro",[642,643]],["ecom.wixapps.net",[642,643]],["tipranks.com",[644,645]],["iceland.co.uk",[646,647,648]],["socket.pearsoned.com",649],["tntdrama.com",[650,651]],["trutv.com",[650,651]],["mobile.de",[652,653]],["ioe.vn",[654,655]],["geiriadur.ac.uk",[654,658]],["welsh-dictionary.ac.uk",[654,658]],["bikeportland.org",[656,657]],["biologianet.com",[621,622,623]],["10play.com.au",[659,660]],["sunshine-live.de",[661,662]],["whatismyip.com",[663,664]],["myfitnesspal.com",665],["netoff.co.jp",[666,667]],["foundit.*",[668,669]],["clickjogos.com.br",670],["bristan.com",[671,672]],["zillow.com",673],["optimum.net",[677,678]],["hdfcfund.com",679],["user.guancha.cn",[680,681]],["sosovalue.com",682],["bandyforbundet.no",[683,684]],["tatacommunications.com",685],["suamusica.com.br",[686,687,688]],["macrotrends.net",[689,690]],["code.world",691],["smartcharts.net",691],["topgear.com",692],["eservice.directauto.com",[693,694]],["nbcsports.com",695],["standard.co.uk",696],["pruefernavi.de",[697,698]],["speedtest.net",[699,700]],["17track.net",701],["visible.com",[702,711,712]],["hagerty.com",[703,704]],["kino.de",[705,706]],["9now.nine.com.au",707],["worldstar.com",708],["prisjakt.no",709],["u26bekrb.fun",710],["flyfrontier.com",[711,712]],["acmemarkets.com",[711,712]],["usaa.com",[711,712]],["capezio.com",[711,712]],["twitch.tv",[711,712]],["spotify.com",[711,712]],["tidal.com",[711,712]],["pandora.com",[711,712]],["qobuz.com",[711,712]],["soundcloud.com",[711,712]],["vimeo.com",[711,712]],["x.com",[711,712]],["twitter.com",[711,712]],["eventbrite.com",[711,712]],["wunderground.com",[711,712]],["accuweather.com",[711,712]],["formula1.com",[711,712]],["lenscrafters.com",[711,712]],["subway.com",[711,712]],["ticketmaster.*",[711,712]],["livewithkellyandmark.com",[711,712]],["porsche.com",[711,712]],["uber.com",[711,712]],["jdsports.com",[711,712]],["engadget.com",[711,712]],["yahoo.com",[711,712]],["techcrunch.com",[711,712]],["rivals.com",[711,712]],["kkrt.com",[711,712]],["crunchyroll.com",[711,712]],["dnb.com",[711,712]],["dnb.co.uk",[711,712]],["weather.com",[711,712]],["ubereats.com",[711,712]]]);
const exceptionsMap = new Map([["pingit.com",[18]],["pingit.me",[18]],["loan.bgmi32bitapk.in",[152]],["lookmovie.studio",[455]]]);
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
