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

// ruleset: annoyances-cookies

// Important!
// Isolate from global scope

// Start of local scope
(function uBOL_setLocalStorageItem() {

/******************************************************************************/

function setLocalStorageItem(key = '', value = '') {
    setLocalStorageItemFn('local', false, key, value);
}

function setLocalStorageItemFn(
    which = 'local',
    trusted = false,
    key = '',
    value = '',
) {
    if ( key === '' ) { return; }

    // For increased compatibility with AdGuard
    if ( value === 'emptyArr' ) {
        value = '[]';
    } else if ( value === 'emptyObj' ) {
        value = '{}';
    }

    const trustedValues = [
        '',
        'undefined', 'null',
        '{}', '[]', '""',
        '$remove$',
        ...getSafeCookieValuesFn(),
    ];

    if ( trusted ) {
        if ( value.includes('$now$') ) {
            value = value.replaceAll('$now$', Date.now());
        }
        if ( value.includes('$currentDate$') ) {
            value = value.replaceAll('$currentDate$', `${Date()}`);
        }
        if ( value.includes('$currentISODate$') ) {
            value = value.replaceAll('$currentISODate$', (new Date()).toISOString());
        }
    } else {
        const normalized = value.toLowerCase();
        const match = /^("?)(.+)\1$/.exec(normalized);
        const unquoted = match && match[2] || normalized;
        if ( trustedValues.includes(unquoted) === false ) {
            if ( /^-?\d+$/.test(unquoted) === false ) { return; }
            const n = parseInt(unquoted, 10) || 0;
            if ( n < -32767 || n > 32767 ) { return; }
        }
    }

    try {
        const storage = self[`${which}Storage`];
        if ( value === '$remove$' ) {
            const safe = safeSelf();
            const pattern = safe.patternToRegex(key, undefined, true );
            const toRemove = [];
            for ( let i = 0, n = storage.length; i < n; i++ ) {
                const key = storage.key(i);
                if ( pattern.test(key) ) { toRemove.push(key); }
            }
            for ( const key of toRemove ) {
                storage.removeItem(key);
            }
        } else {
            storage.setItem(key, `${value}`);
        }
    } catch {
    }
}

function getSafeCookieValuesFn() {
    return [
        'accept', 'reject',
        'accepted', 'rejected', 'notaccepted',
        'allow', 'disallow', 'deny',
        'allowed', 'denied',
        'approved', 'disapproved',
        'checked', 'unchecked',
        'dismiss', 'dismissed',
        'enable', 'disable',
        'enabled', 'disabled',
        'essential', 'nonessential',
        'forbidden', 'forever',
        'hide', 'hidden',
        'necessary', 'required',
        'ok',
        'on', 'off',
        'true', 't', 'false', 'f',
        'yes', 'y', 'no', 'n',
        'all', 'none', 'functional',
        'granted', 'done',
        'decline', 'declined',
        'closed', 'next', 'mandatory',
        'disagree', 'agree',
    ];
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

/******************************************************************************/

const scriptletGlobals = {}; // eslint-disable-line
const argsList = [["CookieConsent--hideCookieConsent","true"],["cookieConsent","granted"],["COOKIE_CONSENT","no"],["cookie_consent","no"],["store-cookie-consent","accepted"],["_ccpa_analytics","false"],["_ccpa_marketing","false"],["_ccpa_personal","false"],["psh:cookies-other","false"],["no-cookie-notice-dismissed","true"],["psh:cookies-seen","true"],["psh:cookies-social","true"],["cookiesAccepted","true"],["isAcceptedCookie","1"],["cookiePolicy","true"],["cookiesAccepted","yes"],["cookies_enabled","true"],["acceptedAllCookies","false"],["cookiePreference","essential"],["cookie-consent-banner","declined"],["allowed_cookies","true"],["cookie-consent","false"],["consents-analytics","false"],["vdk-required-enabled","true"],["vdk-iframe-enabled","true"],["vdk-status","accept"],["cookie_consent","granted"],["cookieBarVisible","false"],["HAS_AGREE_POLICY","true"],["cookie-accepted","1"],["CustomCookieBannerAcceptIntent","true"],["pc-cookie-accepted","true"],["pc-cookie-technical-accepted","true"],["cookie-consent","rejected"],["owf_agree_cookie_policy","true"],["cookieConsent","accepted"],["allowFunctionalCookies","false"],["cookieClosed","true"],["explicitCookieAccept-24149","true"],["keeper_cookie_consent","true"],["cookie_accepted","true"],["consentLevel","1"],["cookies-val","accepted"],["201805-policy|accepted","1"],["GDPR-fingerprint:accepted","true"],["CPCCookies","true"],["privacyModalSeen","true"],["LGPDconsent","1"],["isCookiePoliceAccepted","1"],["HAS_ACCEPTED_PRIVACY_POLICY","true"],["cookiesAceptadas","true"],["privacy.com.br","accepted"],["supabase-consent-ph","false"],["cookieConsent","essential"],["has-seen-ccpa-notice","true"],["wbx__cookieAccepted","true"],["show_cookies_popup","false"],["modal_cookies","1"],["trainingDataConsent","true"],["cookieConsent","false"],["zglobal_Acookie_optOut","3"],["cookie","true"],["cookies_view","true"],["gdprConsent","false"],["framerCookiesDismissed","true"],["vue-cookie-accept-decline-cookiePanel","accept"],["cookies-consent-accepted","true"],["user-cookies-setting","1"],["COOKIE_AUTHORITY_QUERY_V2","1"],["ignore_cookie_warn","true"],["CerezUyariGosterildi","true"],["cookies-product","NO"],["showCookies","NO"],["localConsent","true"],["acceptedCookies","true"],["isNotificationDisplayed","true"],["COOKIE_BANNER_CLICKED","true"],["cookies-eu-statistics","false"],["cookies-eu-necessary","true"],["cookieStatus","rejected"],["consent","true"],["cookiePreference","required"],["technikmuseum-required-enabled","true"],["ctu-cm-n","1"],["ctu-cm-a","0"],["ctu-cm-m","0"],["cookieAndRecommendsAgreement","true"],["cookiebanner-active","false"],["tracking-state-v2","deny"],["cookieConsent","true"],["202306151200.shown.production","true"],["consent","[]"],["cookiebanner:extMedia","false"],["cookiebanner:statistic","false"],["consentAccepted","true"],["marketingConsentAccepted","false"],["consentMode","1"],["uninavIsAgreeCookie","true"],["cookieConsent","denied"],["cookieChoice","rejected"],["adsAccepted","false"],["analyticsAccepted","false"],["analytics_gdpr_accept","yes"],["youtube_gdpr_accept","yes"],["Analytics:accepted","false"],["GDPR:accepted","true"],["cookie_usage_acknowledged_2","1"],["a_c","true"],["iag-targeting-consent","no"],["iag-performance-consent","no"],["userDeniedCookies","1"],["hasConsent","false"],["viewedCookieConsent","true"],["dnt_message_shown","1"],["necessaryConsent","true"],["marketingConsent","false"],["personalisationConsent","false"],["open_modal_update_policy","1"],["cookieinfo","1"],["cookies","1"],["cookieAccepted","true"],["necessary_cookie_confirmed","true"],["ccb_contao_token_1","1"],["cookies","0"],["cookies_accepted_6pzworitz8","true"],["rgpd.consent","1"],["_lukCookieAgree","2"],["cookiesAllowed","false"],["cookiePreference","1"],["artisan_acceptCookie","true"],["cookies_policy_acceptance","denied"],["SAFE__analyticsPreference","false"],["termsOfUseAccepted","true"],["agreeCookie","true"],["lgpd-agree","1"],["cookieIsAccepted","true"],["cookieAllowed","false"],["cookie_usage_accepted","1"],["cookieBannerShown","true"],["cookiesConsent","1"],["cookie_acceptance","true"],["analytics_cookies_acceptance","true"],["ns_cookies","1"],["gdpr","deny"],["c","false"],["cookies-preference","1"],["cookiesAcknowledged","1"],["hasConsentedPH","no"],["cookie_consent","accepted"],["gtag.consent.option","1"],["cps28","1"],["PrivacyPolicy[][core]","forbidden"],["PrivacyPolicy[][maps]","forbidden"],["PrivacyPolicy[][videos]","forever"],["PrivacyPolicy[][readSpeaker]","forbidden"],["PrivacyPolicy[][tracking]","forbidden"],["showCookieUse","false"],["terms","accepted"],["z_cookie_consent","true"],["StorageMartCookiesPolicySeen","true"],["bunq:CookieConsentStore:isBannerVisible","false"],["accepted-cookies","[]"],["ngx-webstorage|cookies","false"],["app_gdpr_consent","1"],["alreadyAcceptCookie","true"],["isCookiesAccepted","true"],["cookies","no"],["cookies-policy-accepted","true"],["cookie_prompt_times","1"],["last_prompt_time","1"],["sup_gdpr_cookie","accepted"],["gdpr_cookie","accepted"],["cn","true"],["consent_popup","1"],["COOKIE_CONSENT","false"],["cookie-consent-declined-version","1"],["Do-not-share","true"],["allow-cookies","false"],["__ph_opt_in_out_phc_9aSDbJCaDUMdZdHxxMPTvcj7A9fsl3mCgM1RBPmPsl7","0"],["should_display_cookie_banner_v2","false"],["zora-discover-14-03-23","false"],["connect-wallet-legal-consent","true"],["cookiesMin","1"],["cb-accept-cookie","true"],["cookie-permission","false"],["cookies","true"],["ROCUMENTS.cookieConsent","true"],["bcCookieAccepted","true"],["CMP:personalisation","1"],["pcClosedOnce","true"],["textshuttle_cookie","false"],["cookies-notification-message-is-hidden","true"],["cookieBanner","false"],["cookieBanner","true"],["banner","true"],["isAllowCookies","true"],["gtag_enabled","1"],["cvcConsentGiven","true"],["terms","true"],["cookie_accept","true"],["Pechinchou:CookiesModal","true"],["hub-cp","true"],["cookiePolicyAccepted","yes"],["cookie_usage_acknowledged_2","true"],["cookies_necessary_consent","true"],["cookies_marketing_consent","false"],["cookies_statistics_consent","false"],["wu.ccpa-toast-viewed","true"],["closed","true"],["dnt","1"],["dnt_a","1"],["makerz_allow_consentmgr","0"],["SHOW_COOKIE_BANNER","no"],["CookiesConsent","1"],["hasAnalyticalCookies","false"],["hasStrictlyNecessaryCookies","true"],["amCookieBarFirstShow","1"],["acceptedCookies","false"],["viewedCookieBanner","true"],["accept_all_cookies","false"],["isCookies","1"],["isCookie","Yes"],["cookieconsent_status","false"],["user_cookie","1"],["ka:4:legal-updates","true"],["cok","true"],["cookieMessage","true"],["soCookiesPolicy","1"],["GDPR:RBI:accepted","false"],["contao-privacy-center.hidden","1"],["cookie_consent","false"],["cookiesAgree","true"],["ytsc_accepted_cookies","true"],["safe-storage/v1/tracking-consent/trackingConsentMarketingKey","false"],["safe-storage/v1/tracking-consent/trackingConsentAdvertisingKey","false"],["safe-storage/v1/tracking-consent/trackingConsentAnalyticsKey","false"],["agreeToCookie","false"],["AI Alliance_ReactCookieAcceptance_hasSetCookies","true"],["firstVisit","false"],["2020-04-05","1"],["dismissed","true"],["SET_COOKIES_APPROVED","true"],["hasAcceptedCookies","true"],["isCookiesNotificationHidden","true"],["agreed-cookies","true"],["consentCookie","true"],["SWCOOKIESACC","1"],["hasAcceptedCookieNotice","true"],["fb-cookies-accepted","false"],["is_accept_cookie","true"],["accept-jove-cookie","1"],["cookie_consent_bar_value","true"],["pxdn_cookie_consent","true"],["akasha__cookiePolicy","true"],["QMOptIn","false"],["safe.global","false"],["cookie_banner:hidden","true"],["cookiesAccepted","false"],["accept_cookie_policy","true"],["cookies_accepted","true"],["cookies-selected","true"],["cookie-notice-dismissed","true"],["accepts-cookie-notice","true"],["dismissedPrivacyCookieMessage","1"],["allowCookies","allowed"],["cookie_consent","true"],["cookies_policy_status","true"],["cookies-accepted","true"],["allowCookies","true"],["cookie_consent","1"],["accepted-cookies","true"],["cookies-consent","0"],["cookieBannerRead","true"],["acceptCookie","0"],["cookieBannerReadDate","1"],["privacy-policy-accepted","true"],["accepted_cookies","true"],["accepted_cookie","true"],["cookie-consent","true"],["consentManager_shown","true"],["consent_necessary","true"],["consent_performance","false"],["cookie-closed","true"],["cookie-accepted","false"],["cookieConsent","1"],["enableCookieBanner","false"],["byFoodCookiePolicyRequire","false"],["ascookie--decision","true"],["isAcceptCookiesNew","true"],["isAcceptCookie","true"],["isAcceptCookie","false"],["marketing","false"],["technical","true","","reload","1"],["analytics","false"],["otherCookie","true"],["saveCookie","true"],["userAcceptsCookies","1"],["grnk-cookies-accepted","true"],["acceptCookies","no"],["acceptCookies","true"],["has-dismissed","1"],["hasAcceptedGdpr","true"],["lw-accepts-cookies","true"],["cookies-accept","true"],["load-scripts-v2","2"],["acceptsAnalyticsCookies","false"],["acceptsNecessaryCookies","true"],["display_cookie_modal","false"],["pg-accept-cookies","true"],["__EOBUWIE__consents_accepted","true","","reload","1"],["canada-cookie-acknowledge","1"],["FP_cookiesAccepted","true"],["VISITED_0","true"],["OPTIONAL_COOKIES_ACCEPTED_0","true"],["storagePermission","true"],["set_cookie_stat","false"],["set_cookie_tracking","false"],["UMP_CONSENT_NOTIFICATION","true"],["df-cookies-allowed","true"],["cookie-consent","1"],["userConsented","false"],["cookieConsent","necessary"],["gdpr-done","true"],["isTrackingAllowed","false"],["legalsAccepted","true"],["COOKIE_CONSENT_STATUS_4124","\"dismissed\""],["cookie-policy","approve"],["spaseekers:cookie-decision","accepted"],["policyAccepted","true"],["PrivacyPolicy[][core]","forever"],["consentBannerLastShown","1"],["flipdish-cookies-preferences","necessary"],["consentInteraction","true"],["cookie-notice-accepted-version","1"],["cookieConsentGiven","1"]];
const hostnamesMap = new Map([["teamtailor.com",0],["notthebee.com",1],["manuals.annafreud.org",2],["granola.ai",3],["polar.sh",3],["posthog.com",3],["hatchet.run",3],["granado.com.br",4],["sunnyside.shop",[5,6,7]],["nhnieuws.nl",[8,10,11]],["omroepbrabant.nl",[8,10,11]],["cape.co",9],["asianet.co.id",12],["p2p.land",12],["netbank.avida.no",12],["bo3.gg",12],["gs1.se",[12,36]],["puregoldprotein.com",[12,100,101]],["spectrumtherapeutics.com",12],["thingtesting.com",12],["streamclipsgermany.de",12],["kundenportal.harzenergie.de",12],["giselles.ai",13],["i-fundusze.pl",14],["improvethenews.org",14],["plente.com",14],["movies4us.*",14],["popcornmovies.to",14],["arkanium.serveminecraft.net",15],["bananacraft.serveminecraft.net",15],["myoffers.smartbuy.hdfcbank.com",16],["grass.io",[17,18]],["lustery.com",19],["ecoints.com",20],["emergetools.com",21],["receptagemini.pl",22],["bw.vdk.de",[23,24,25]],["search.odin.io",26],["gdh.digital",27],["popmart.com",28],["rozklady.bielsko.pl",29],["typeform.com",30],["erlus.com",[31,32]],["bettrfinancing.com",33],["sf-express.com",34],["min.io",35],["lemwarm.com",37],["form.fillout.com",38],["keepersecurity.com",39],["esto.eu",40],["ctol.digital",40],["beterbed.nl",41],["crt.hr",42],["code.likeagirl.io",43],["engineering.mixpanel.com",43],["betterprogramming.pub",43],["medium.com",43],["500ish.com",43],["gitconnected.com",43],["bettermarketing.pub",43],["diylifetech.com",43],["thebolditalic.com",43],["writingcooperative.com",43],["fanfare.pub",43],["betterhumans.pub",43],["fvd.nl",44],["cpc2r.ch",45],["metamask.io",46],["chavesnamao.com.br",47],["anhanguera.com",48],["bhaskar.com",49],["novaventa.com",50],["privacy.com.br",51],["supabase.com",52],["app.getgrass.io",53],["sanluisgarbage.com",54],["wildberries.ru",55],["cryptorank.io",56],["springmerchant.com",57],["veed.io",58],["deribit.com",59],["dorkgpt.com",59],["kyutai.org",59],["varusteleka.com",59],["lazyrecords.app",59],["unmute.sh",59],["zoho.com",60],["femibion.rs",61],["nove.fr",61],["metro1.com.br",61],["villagrancanaria.com",62],["baic.cz",63],["bunq.com",64],["framer.com",64],["inceptionlabs.ai",64],["zave.it",64],["tower.dev",64],["fleksberegner.dk",65],["duty.travel.cl",66],["solscan.io",67],["connorduffy.abundancerei.com",68],["bc.gamem",69],["akkushop-turkiye.com.tr",70],["k33.com",[71,72]],["komdigi.go.id",73],["fijiairways.com",74],["planner.kaboodle.co.nz",75],["pedalcommander.*",76],["sekisuialveo.com",[77,78]],["rightsize.dk",79],["random-group.olafneumann.org",80],["espadrij.com",81],["hygiene-shop.eu",81],["gesundheitsmanufaktur.de",[81,318]],["technikmuseum.berlin",82],["cvut.cz",[83,84,85]],["r-ulybka.ru",86],["voltadol.at",87],["evium.de",88],["hiring.amazon.com",89],["comnet.com.tr",89],["gpuscout.nl",89],["remanga.org",89],["parrotsec.org",89],["estrelabet.bet.br",89],["shonenjumpplus.com",90],["engeldirekt.de",91],["haleon-gebro.at",[92,93]],["happyplates.com",[94,95]],["ickonic.com",96],["abs-cbn.com",97],["news.abs-cbn.com",97],["opmaatzagen.nl",98],["mundwerk-rottweil.de",98],["sqlook.com",99],["adef-emploi.fr",[102,103]],["lumieresdelaville.net",[102,103]],["ccaf.io",[104,105]],["dbschenkerarkas.com.tr",106],["dbschenker-seino.jp",106],["dbschenker.com",[106,203]],["scinapse.io",107],["shop.ba.com",[108,109]],["uc.pt",110],["bennettrogers.mysight.uk",111],["snipp.gg",111],["leafly.com",112],["geizhals.at",113],["geizhals.de",113],["geizhals.eu",113],["cenowarka.pl",113],["skinflint.co.uk",113],["webhallen.com",[114,115,116]],["olx.com.br",117],["unobike.com",118],["mod.io",119],["passport-photo.online",120],["mojmaxtv.hrvatskitelekom.hr",120],["rodrigue-app.ct.ws",120],["tme.eu",121],["mein-osttirol.rocks",122],["tennessine.co.uk",123],["ultraleds.co.uk",124],["greubelforsey.com",125],["lukify.app",126],["studiobookr.com",127],["getgrass.io",128],["artisan.co",129],["mobilefuse.com",130],["safe.global",[131,255]],["data.carbonmapper.org",132],["avica.link",133],["madeiramadeira.com.br",134],["sberdisk.ru",135],["column.com",136],["iqoption.com",137],["dopesnow.com",138],["montecwear.com",138],["romeo.com",139],["sonyliv.com",[140,141]],["cwallet.com",142],["oneskin.co",143],["telemetr.io",144],["near.org",145],["near.ai",145],["dev.near.org",146],["jito.network",147],["jito.wtf",147],["goodpods.com",148],["pngtree.com",[149,150]],["rhein-pfalz-kreis.de",[151,152,153,154,155]],["idar-oberstein.de",[151,152,153,154]],["vogelsbergkreis.de",[151,152,153,154]],["chamaeleon.de",[153,329]],["v2.xmeye.net",156],["venom.foundation",157],["canonvannederland.nl",158],["my-account.storage-mart.com",159],["web.bunq.com",160],["lifesum.com",161],["home.shortcutssoftware.com",162],["klimwinkel.nl",163],["markimicrowave.com",164],["aerolineas.com.ar",165],["5sim.net",165],["fold.dev",166],["mojposao.hr",167],["temu.com",[168,169]],["supreme.com",[170,171]],["g-star.com",172],["sawren.pl",173],["ultrahuman.com",174],["optionsgroup.com",175],["withpersona.com",[176,177]],["trigger.dev",178],["core.app",[179,181]],["zora.co",180],["kokku-online.de",182],["cuba-buddy.de",183],["datamask.app",184],["humandataincome.com",184],["crealitycloud.com",185],["triumphtechnicalinformation.com",186],["businessclass.com",187],["livsstil.se",188],["schneidewind-immobilien.de",189],["textshuttle.com",190],["simpleswap.io",191],["wales.nhs.attendanywhere.com",192],["sacal.it",193],["astondevs.ru",194],["gonxt.com",195],["geomiq.com",196],["bbc.com",197],["galaxy.com",198],["ticketmelon.com",199],["pechinchou.com.br",200],["thehub21.com",201],["archiup.com",202],["autoride.cz",[204,205,206]],["autoride.es",[204,205,206]],["autoride.io",[204,205,206]],["autoride.sk",[204,205,206]],["wunderground.com",207],["baselime.io",208],["eversports.de",[209,210]],["makerz.me",211],["reebok.eu",212],["alfa.com.ec",213],["rts.com.ec",213],["tropicalida.com.ec",213],["owgr.com",[214,215]],["beermerchants.com",216],["saamexe.com",[217,218]],["helium.com",217],["blommerscoffee.shipping-portal.com",217],["app.bionic-reading.com",219],["nloto.ru",220],["swisstours.com",221],["librinova.com",222],["format.bike",223],["khanacademy.org",224],["etelecinema.hu",225],["konicaminolta.com",226],["soquest.xyz",227],["region-bayreuth.de",228],["bahnland-bayern.de",229],["eezy.nrw",229],["nationalexpress.de",229],["chipcitycookies.com",230],["6amgroup.com",230],["go.bkk.hu",230],["worldlibertyfinancial.com",230],["happiful.com",230],["bazaartracker.com",231],["subscribercounter.com",232],["app.klarna.com",[233,234,235]],["instantspoursoi.fr",236],["thealliance.ai",237],["librumreader.com",238],["visnos.com",239],["polypane.app",240],["changelly.com",241],["glose.com",242],["yellow.systems",243],["renebieder.com",244],["goodram.com",245],["starwalk.space",246],["vitotechnology.com",246],["codedead.com",247],["studiofabiobiesel.com",248],["fydeos.com",249],["fydeos.io",249],["jove.com",250],["argent.xyz",251],["pixeden.com",252],["akasha.org",253],["ashleyfurniture.com",254],["jibjab.com",256],["filmzie.com",257],["vietjetair.com",258],["kick.com",259],["cora-broodjes.nl",260],["jimdosite.com",260],["worstbassist.com",260],["evernote.com",[261,262,333]],["octopusenergy.co.jp",263],["findmcserver.com",264],["schneideranwaelte.de",265],["traefik.io",265],["cityfalcon.ai",266],["digitalparking.city",267],["mediathekviewweb.de",268],["solana.com",269],["ef.co.id",270],["alohafromdeer.com",271],["fwd.com",[272,274]],["everywhere.game",273],["geotastic.net",275],["garageproject.co.nz",276],["tattoodo.com",[276,277]],["jmonline.com.br",278],["atlas.workland.com",278],["virginexperiencedays.co.uk",278],["emag.berliner-woche.de",[279,280,281]],["nordkurier.de",[279,280,281]],["everest-24.pl",[282,283]],["sneakerfreaker.com",284],["cryptofalka.hu",284],["walmart.ca",285],["byfood.com",286],["andsafe.de",287],["edostavka.by",288],["emall.by",288],["ishoppurium.com",289],["baseblocks.tenereteam.com",290],["onexstore.pl",[291,292,293]],["revanced.app",293],["evropochta.by",[294,295]],["inselberlin.de",296],["gronkh.tv",297],["adfilteringdevsummit.com",298],["dailyrevs.com",299],["dsworks.ru",299],["daraz.com",300],["learngerman.dw.com",301],["leeway.tech",302],["gostanford.com",303],["namensetiketten.de",304],["drafthound.com",[305,306]],["wokularach.pl",307],["bidup.amtrak.com",308],["eschuhe.de",309],["zeglins.com",310],["flyingpapers.com",311],["beta.character.ai",[312,313]],["bittimittari.fi",314],["aida64.co.uk",[315,316]],["aida64.com.ua",[315,316]],["aida64.de",[315,316]],["aida64.hu",[315,316]],["aida64.it",[315,316]],["aida64russia.com",[315,316]],["116.ru",317],["14.ru",317],["161.ru",317],["164.ru",317],["173.ru",317],["178.ru",317],["26.ru",317],["29.ru",317],["35.ru",317],["43.ru",317],["45.ru",317],["48.ru",317],["51.ru",317],["53.ru",317],["56.ru",317],["59.ru",317],["60.ru",317],["63.ru",317],["68.ru",317],["71.ru",317],["72.ru",317],["74.ru",317],["76.ru",317],["86.ru",317],["89.ru",317],["93.ru",317],["chita.ru",317],["e1.ru",317],["fontanka.ru",317],["ircity.ru",317],["izh1.ru",317],["mgorsk.ru",317],["msk1.ru",317],["ngs.ru",317],["ngs22.ru",317],["ngs24.ru",317],["ngs42.ru",317],["ngs55.ru",317],["ngs70.ru",317],["nn.ru",317],["sochi1.ru",317],["sterlitamak1.ru",317],["tolyatty.ru",317],["ufa1.ru",317],["v1.ru",317],["vladivostok1.ru",317],["voronezh1.ru",317],["ya62.ru",317],["open24.ee",318],["116117.fi",319],["pjspub.com",320],["autodude.dk",321],["autodude.fi",321],["autodude.no",321],["autodude.se",321],["valostore.fi",321],["valostore.no",321],["valostore.se",321],["vivantis.*",322],["vivantis-shop.at",322],["krasa.cz",322],["auf1.tv",323],["wesendit.com",324],["hatch.co",325],["haberturk.com",326],["spaseekers.com",327],["incomeshares.com",328],["surnamedb.com",330],["pizzadelight-menu.co.uk",331],["ioplus.nl",332],["lahella.fi",334]]);
const exceptionsMap = new Map([]);
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
    try { setLocalStorageItem(...argsList[i]); }
    catch { }
}

/******************************************************************************/

// End of local scope
})();

void 0;
