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
const argsList = [["CookieConsent--hideCookieConsent","true"],["consent","false"],["cookieConsent","granted"],["show_consent_modal","1"],["SITE_2609202-COOKIE-BANNER","1"],["COOKIE_CONSENT","no"],["cookie_consent","true"],["df-cookies-allowed","true"],["cookie_consent","no"],["mmkv.default\\ANONYMOUS_ACCEPT_COOKIE","true"],["isCookieAccepted","true"],["cookies-pref","[]"],["cookiesAccepted","false"],["store-cookie-consent","accepted"],["_ccpa_analytics","false"],["_ccpa_marketing","false"],["_ccpa_personal","false"],["psh:cookies-other","false"],["no-cookie-notice-dismissed","true"],["psh:cookies-seen","true"],["psh:cookies-social","true"],["cookiesAccepted","true"],["isAcceptedCookie","1"],["cookiePolicy","true"],["cookiesAccepted","yes"],["cookies_enabled","true"],["acceptedAllCookies","false"],["cookiePreference","essential"],["cookie-consent-banner","declined"],["allowed_cookies","true"],["cookie-consent","false"],["consents-analytics","false"],["vdk-required-enabled","true"],["vdk-iframe-enabled","true"],["vdk-status","accept"],["cookie_consent","granted"],["cookieBarVisible","false"],["HAS_AGREE_POLICY","true"],["cookie-accepted","1"],["CustomCookieBannerAcceptIntent","true"],["pc-cookie-accepted","true"],["pc-cookie-technical-accepted","true"],["cookie-consent","rejected"],["owf_agree_cookie_policy","true"],["cookieConsent","accepted"],["allowFunctionalCookies","false"],["cookieClosed","true"],["explicitCookieAccept-24149","true"],["keeper_cookie_consent","true"],["cookie_accepted","true"],["consentLevel","1"],["cookies-val","accepted"],["201805-policy|accepted","1"],["GDPR-fingerprint:accepted","true"],["CPCCookies","true"],["privacyModalSeen","true"],["LGPDconsent","1"],["isCookiePoliceAccepted","1"],["HAS_ACCEPTED_PRIVACY_POLICY","true"],["cookiesAceptadas","true"],["privacy.com.br","accepted"],["supabase-consent-ph","false"],["cookieConsent","essential"],["has-seen-ccpa-notice","true"],["wbx__cookieAccepted","true"],["show_cookies_popup","false"],["modal_cookies","1"],["trainingDataConsent","true"],["cookieConsent","false"],["zglobal_Acookie_optOut","3"],["cookie","true"],["cookies_view","true"],["gdprConsent","false"],["framerCookiesDismissed","true"],["vue-cookie-accept-decline-cookiePanel","accept"],["cookies-consent-accepted","true"],["user-cookies-setting","1"],["COOKIE_AUTHORITY_QUERY_V2","1"],["ignore_cookie_warn","true"],["CerezUyariGosterildi","true"],["cookies-product","NO"],["showCookies","NO"],["localConsent","true"],["acceptedCookies","true"],["isNotificationDisplayed","true"],["COOKIE_BANNER_CLICKED","true"],["cookies-eu-statistics","false"],["cookies-eu-necessary","true"],["cookieStatus","rejected"],["consent","true"],["cookiePreference","required"],["technikmuseum-required-enabled","true"],["ctu-cm-n","1"],["ctu-cm-a","0"],["ctu-cm-m","0"],["cookieAndRecommendsAgreement","true"],["cookiebanner-active","false"],["tracking-state-v2","deny"],["cookieConsent","true"],["202306151200.shown.production","true"],["consent","[]"],["cookiebanner:extMedia","false"],["cookiebanner:statistic","false"],["consentAccepted","true"],["marketingConsentAccepted","false"],["consentMode","1"],["uninavIsAgreeCookie","true"],["cookieConsent","denied"],["cookieChoice","rejected"],["adsAccepted","false"],["analyticsAccepted","false"],["analytics_gdpr_accept","yes"],["youtube_gdpr_accept","yes"],["Analytics:accepted","false"],["GDPR:accepted","true"],["cookie_usage_acknowledged_2","1"],["a_c","true"],["iag-targeting-consent","no"],["iag-performance-consent","no"],["userDeniedCookies","1"],["hasConsent","false"],["viewedCookieConsent","true"],["dnt_message_shown","1"],["necessaryConsent","true"],["marketingConsent","false"],["personalisationConsent","false"],["open_modal_update_policy","1"],["cookieinfo","1"],["cookies","1"],["cookieAccepted","true"],["necessary_cookie_confirmed","true"],["ccb_contao_token_1","1"],["cookies","0"],["cookies_accepted_6pzworitz8","true"],["rgpd.consent","1"],["_lukCookieAgree","2"],["cookiesAllowed","false"],["cookiePreference","1"],["artisan_acceptCookie","true"],["cookies_policy_acceptance","denied"],["SAFE__analyticsPreference","false"],["termsOfUseAccepted","true"],["agreeCookie","true"],["lgpd-agree","1"],["cookieIsAccepted","true"],["cookieAllowed","false"],["cookie_usage_accepted","1"],["cookieBannerShown","true"],["cookiesConsent","1"],["cookie_acceptance","true"],["analytics_cookies_acceptance","true"],["ns_cookies","1"],["gdpr","deny"],["c","false"],["cookies-preference","1"],["cookiesAcknowledged","1"],["hasConsentedPH","no"],["cookie_consent","accepted"],["gtag.consent.option","1"],["cps28","1"],["PrivacyPolicy[][core]","forbidden"],["PrivacyPolicy[][maps]","forbidden"],["PrivacyPolicy[][videos]","forever"],["PrivacyPolicy[][readSpeaker]","forbidden"],["PrivacyPolicy[][tracking]","forbidden"],["showCookieUse","false"],["terms","accepted"],["z_cookie_consent","true"],["StorageMartCookiesPolicySeen","true"],["bunq:CookieConsentStore:isBannerVisible","false"],["accepted-cookies","[]"],["ngx-webstorage|cookies","false"],["app_gdpr_consent","1"],["alreadyAcceptCookie","true"],["isCookiesAccepted","true"],["cookies","no"],["cookies-policy-accepted","true"],["cookie_prompt_times","1"],["last_prompt_time","1"],["sup_gdpr_cookie","accepted"],["gdpr_cookie","accepted"],["cn","true"],["consent_popup","1"],["COOKIE_CONSENT","false"],["cookie-consent-declined-version","1"],["Do-not-share","true"],["allow-cookies","false"],["__ph_opt_in_out_phc_9aSDbJCaDUMdZdHxxMPTvcj7A9fsl3mCgM1RBPmPsl7","0"],["should_display_cookie_banner_v2","false"],["zora-discover-14-03-23","false"],["connect-wallet-legal-consent","true"],["cookiesMin","1"],["cb-accept-cookie","true"],["cookie-permission","false"],["cookies","true"],["ROCUMENTS.cookieConsent","true"],["bcCookieAccepted","true"],["CMP:personalisation","1"],["pcClosedOnce","true"],["textshuttle_cookie","false"],["cookies-notification-message-is-hidden","true"],["cookieBanner","false"],["cookieBanner","true"],["banner","true"],["isAllowCookies","true"],["gtag_enabled","1"],["cvcConsentGiven","true"],["terms","true"],["cookie_accept","true"],["Pechinchou:CookiesModal","true"],["hub-cp","true"],["cookiePolicyAccepted","yes"],["cookie_usage_acknowledged_2","true"],["cookies_necessary_consent","true"],["cookies_marketing_consent","false"],["cookies_statistics_consent","false"],["wu.ccpa-toast-viewed","true"],["closed","true"],["dnt","1"],["dnt_a","1"],["makerz_allow_consentmgr","0"],["SHOW_COOKIE_BANNER","no"],["CookiesConsent","1"],["hasAnalyticalCookies","false"],["hasStrictlyNecessaryCookies","true"],["amCookieBarFirstShow","1"],["acceptedCookies","false"],["viewedCookieBanner","true"],["accept_all_cookies","false"],["isCookies","1"],["isCookie","Yes"],["cookieconsent_status","false"],["user_cookie","1"],["ka:4:legal-updates","true"],["cok","true"],["cookieMessage","true"],["soCookiesPolicy","1"],["GDPR:RBI:accepted","false"],["contao-privacy-center.hidden","1"],["cookie_consent","false"],["cookiesAgree","true"],["ytsc_accepted_cookies","true"],["safe-storage/v1/tracking-consent/trackingConsentMarketingKey","false"],["safe-storage/v1/tracking-consent/trackingConsentAdvertisingKey","false"],["safe-storage/v1/tracking-consent/trackingConsentAnalyticsKey","false"],["agreeToCookie","false"],["AI Alliance_ReactCookieAcceptance_hasSetCookies","true"],["firstVisit","false"],["2020-04-05","1"],["dismissed","true"],["SET_COOKIES_APPROVED","true"],["hasAcceptedCookies","true"],["isCookiesNotificationHidden","true"],["agreed-cookies","true"],["consentCookie","true"],["SWCOOKIESACC","1"],["hasAcceptedCookieNotice","true"],["fb-cookies-accepted","false"],["is_accept_cookie","true"],["accept-jove-cookie","1"],["cookie_consent_bar_value","true"],["pxdn_cookie_consent","true"],["akasha__cookiePolicy","true"],["QMOptIn","false"],["safe.global","false"],["cookie_banner:hidden","true"],["accept_cookie_policy","true"],["cookies_accepted","true"],["cookies-selected","true"],["cookie-notice-dismissed","true"],["accepts-cookie-notice","true"],["dismissedPrivacyCookieMessage","1"],["allowCookies","allowed"],["cookies_policy_status","true"],["cookies-accepted","true"],["allowCookies","true"],["cookie_consent","1"],["accepted-cookies","true"],["cookies-consent","0"],["cookieBannerRead","true"],["acceptCookie","0"],["cookieBannerReadDate","1"],["privacy-policy-accepted","true"],["accepted_cookies","true"],["accepted_cookie","true"],["cookie-consent","true"],["consentManager_shown","true"],["consent_necessary","true"],["consent_performance","false"],["cookie-closed","true"],["cookie-accepted","false"],["cookieConsent","1"],["enableCookieBanner","false"],["byFoodCookiePolicyRequire","false"],["ascookie--decision","true"],["isAcceptCookiesNew","true"],["isAcceptCookie","true"],["isAcceptCookie","false"],["marketing","false"],["technical","true","","reload","1"],["analytics","false"],["otherCookie","true"],["saveCookie","true"],["userAcceptsCookies","1"],["grnk-cookies-accepted","true"],["acceptCookies","no"],["acceptCookies","true"],["has-dismissed","1"],["hasAcceptedGdpr","true"],["lw-accepts-cookies","true"],["cookies-accept","true"],["load-scripts-v2","2"],["acceptsAnalyticsCookies","false"],["acceptsNecessaryCookies","true"],["display_cookie_modal","false"],["pg-accept-cookies","true"],["__EOBUWIE__consents_accepted","true","","reload","1"],["canada-cookie-acknowledge","1"],["FP_cookiesAccepted","true"],["VISITED_0","true"],["OPTIONAL_COOKIES_ACCEPTED_0","true"],["storagePermission","true"],["set_cookie_stat","false"],["set_cookie_tracking","false"],["UMP_CONSENT_NOTIFICATION","true"],["cookie-consent","1"],["userConsented","false"],["cookieConsent","necessary"],["gdpr-done","true"],["isTrackingAllowed","false"],["legalsAccepted","true"],["COOKIE_CONSENT_STATUS_4124","\"dismissed\""],["cookie-policy","approve"],["spaseekers:cookie-decision","accepted"],["policyAccepted","true"],["PrivacyPolicy[][core]","forever"],["consentBannerLastShown","1"],["flipdish-cookies-preferences","necessary"],["consentInteraction","true"],["cookie-notice-accepted-version","1"],["cookieConsentGiven","1"],["cookie-banner-accepted","true"]];
const hostnamesMap = new Map([["teamtailor.com",0],["dewesoft.com",1],["notthebee.com",2],["negrasport.pl",3],["pancernik.eu",[3,7]],["mobilelegends.com",4],["manuals.annafreud.org",5],["ketogo.app",6],["schneideranwaelte.de",6],["traefik.io",6],["gesundheitsmanufaktur.de",[7,90]],["open24.ee",7],["granola.ai",8],["polar.sh",8],["posthog.com",8],["hatchet.run",8],["zeta-ai.io",9],["fiyat.mercedes-benz.com.tr",10],["sportbooking.info",11],["photo.codes",12],["filmzie.com",12],["granado.com.br",13],["sunnyside.shop",[14,15,16]],["nhnieuws.nl",[17,19,20]],["omroepbrabant.nl",[17,19,20]],["cape.co",18],["asianet.co.id",21],["p2p.land",21],["netbank.avida.no",21],["bo3.gg",21],["gs1.se",[21,45]],["puregoldprotein.com",[21,109,110]],["spectrumtherapeutics.com",21],["thingtesting.com",21],["streamclipsgermany.de",21],["kundenportal.harzenergie.de",21],["giselles.ai",22],["i-fundusze.pl",23],["improvethenews.org",23],["plente.com",23],["movies4us.*",23],["popcornmovies.to",23],["arkanium.serveminecraft.net",24],["bananacraft.serveminecraft.net",24],["myoffers.smartbuy.hdfcbank.com",25],["grass.io",[26,27]],["lustery.com",28],["ecoints.com",29],["emergetools.com",30],["receptagemini.pl",31],["bw.vdk.de",[32,33,34]],["search.odin.io",35],["gdh.digital",36],["popmart.com",37],["rozklady.bielsko.pl",38],["typeform.com",39],["erlus.com",[40,41]],["bettrfinancing.com",42],["sf-express.com",43],["min.io",44],["lemwarm.com",46],["form.fillout.com",47],["keepersecurity.com",48],["esto.eu",49],["ctol.digital",49],["beterbed.nl",50],["crt.hr",51],["code.likeagirl.io",52],["engineering.mixpanel.com",52],["betterprogramming.pub",52],["medium.com",52],["500ish.com",52],["gitconnected.com",52],["bettermarketing.pub",52],["diylifetech.com",52],["thebolditalic.com",52],["writingcooperative.com",52],["fanfare.pub",52],["betterhumans.pub",52],["fvd.nl",53],["cpc2r.ch",54],["metamask.io",55],["chavesnamao.com.br",56],["anhanguera.com",57],["bhaskar.com",58],["novaventa.com",59],["privacy.com.br",60],["supabase.com",61],["app.getgrass.io",62],["sanluisgarbage.com",63],["wildberries.ru",64],["cryptorank.io",65],["springmerchant.com",66],["veed.io",67],["deribit.com",68],["dorkgpt.com",68],["kyutai.org",68],["varusteleka.com",68],["lazyrecords.app",68],["unmute.sh",68],["zoho.com",69],["femibion.rs",70],["nove.fr",70],["metro1.com.br",70],["villagrancanaria.com",71],["baic.cz",72],["bunq.com",73],["framer.com",73],["inceptionlabs.ai",73],["zave.it",73],["tower.dev",73],["fleksberegner.dk",74],["duty.travel.cl",75],["solscan.io",76],["connorduffy.abundancerei.com",77],["bc.gamem",78],["akkushop-turkiye.com.tr",79],["k33.com",[80,81]],["komdigi.go.id",82],["fijiairways.com",83],["planner.kaboodle.co.nz",84],["pedalcommander.*",85],["sekisuialveo.com",[86,87]],["rightsize.dk",88],["random-group.olafneumann.org",89],["espadrij.com",90],["hygiene-shop.eu",90],["technikmuseum.berlin",91],["cvut.cz",[92,93,94]],["r-ulybka.ru",95],["voltadol.at",96],["evium.de",97],["hiring.amazon.com",98],["comnet.com.tr",98],["gpuscout.nl",98],["remanga.org",98],["parrotsec.org",98],["estrelabet.bet.br",98],["shonenjumpplus.com",99],["engeldirekt.de",100],["haleon-gebro.at",[101,102]],["happyplates.com",[103,104]],["ickonic.com",105],["abs-cbn.com",106],["news.abs-cbn.com",106],["opmaatzagen.nl",107],["mundwerk-rottweil.de",107],["sqlook.com",108],["adef-emploi.fr",[111,112]],["lumieresdelaville.net",[111,112]],["ccaf.io",[113,114]],["dbschenkerarkas.com.tr",115],["dbschenker-seino.jp",115],["dbschenker.com",[115,212]],["scinapse.io",116],["shop.ba.com",[117,118]],["uc.pt",119],["bennettrogers.mysight.uk",120],["snipp.gg",120],["leafly.com",121],["geizhals.at",122],["geizhals.de",122],["geizhals.eu",122],["cenowarka.pl",122],["skinflint.co.uk",122],["webhallen.com",[123,124,125]],["olx.com.br",126],["unobike.com",127],["mod.io",128],["passport-photo.online",129],["mojmaxtv.hrvatskitelekom.hr",129],["rodrigue-app.ct.ws",129],["tme.eu",130],["mein-osttirol.rocks",131],["tennessine.co.uk",132],["ultraleds.co.uk",133],["greubelforsey.com",134],["lukify.app",135],["studiobookr.com",136],["getgrass.io",137],["artisan.co",138],["mobilefuse.com",139],["safe.global",[140,264]],["data.carbonmapper.org",141],["avica.link",142],["madeiramadeira.com.br",143],["sberdisk.ru",144],["column.com",145],["iqoption.com",146],["dopesnow.com",147],["montecwear.com",147],["romeo.com",148],["sonyliv.com",[149,150]],["cwallet.com",151],["oneskin.co",152],["telemetr.io",153],["near.org",154],["near.ai",154],["dev.near.org",155],["jito.network",156],["jito.wtf",156],["goodpods.com",157],["pngtree.com",[158,159]],["rhein-pfalz-kreis.de",[160,161,162,163,164]],["idar-oberstein.de",[160,161,162,163]],["vogelsbergkreis.de",[160,161,162,163]],["chamaeleon.de",[162,335]],["v2.xmeye.net",165],["venom.foundation",166],["canonvannederland.nl",167],["my-account.storage-mart.com",168],["web.bunq.com",169],["lifesum.com",170],["home.shortcutssoftware.com",171],["klimwinkel.nl",172],["markimicrowave.com",173],["aerolineas.com.ar",174],["5sim.net",174],["fold.dev",175],["mojposao.hr",176],["temu.com",[177,178]],["supreme.com",[179,180]],["g-star.com",181],["sawren.pl",182],["ultrahuman.com",183],["optionsgroup.com",184],["withpersona.com",[185,186]],["trigger.dev",187],["core.app",[188,190]],["zora.co",189],["kokku-online.de",191],["cuba-buddy.de",192],["datamask.app",193],["humandataincome.com",193],["crealitycloud.com",194],["triumphtechnicalinformation.com",195],["businessclass.com",196],["livsstil.se",197],["schneidewind-immobilien.de",198],["textshuttle.com",199],["simpleswap.io",200],["wales.nhs.attendanywhere.com",201],["sacal.it",202],["astondevs.ru",203],["gonxt.com",204],["geomiq.com",205],["bbc.com",206],["galaxy.com",207],["ticketmelon.com",208],["pechinchou.com.br",209],["thehub21.com",210],["archiup.com",211],["autoride.cz",[213,214,215]],["autoride.es",[213,214,215]],["autoride.io",[213,214,215]],["autoride.sk",[213,214,215]],["wunderground.com",216],["baselime.io",217],["eversports.de",[218,219]],["makerz.me",220],["reebok.eu",221],["alfa.com.ec",222],["rts.com.ec",222],["tropicalida.com.ec",222],["owgr.com",[223,224]],["beermerchants.com",225],["saamexe.com",[226,227]],["helium.com",226],["blommerscoffee.shipping-portal.com",226],["app.bionic-reading.com",228],["nloto.ru",229],["swisstours.com",230],["librinova.com",231],["format.bike",232],["khanacademy.org",233],["etelecinema.hu",234],["konicaminolta.com",235],["soquest.xyz",236],["region-bayreuth.de",237],["bahnland-bayern.de",238],["eezy.nrw",238],["nationalexpress.de",238],["sumupbookings.com",239],["chipcitycookies.com",239],["6amgroup.com",239],["go.bkk.hu",239],["worldlibertyfinancial.com",239],["happiful.com",239],["bazaartracker.com",240],["subscribercounter.com",241],["app.klarna.com",[242,243,244]],["instantspoursoi.fr",245],["thealliance.ai",246],["librumreader.com",247],["visnos.com",248],["polypane.app",249],["changelly.com",250],["glose.com",251],["yellow.systems",252],["renebieder.com",253],["goodram.com",254],["starwalk.space",255],["vitotechnology.com",255],["codedead.com",256],["studiofabiobiesel.com",257],["fydeos.com",258],["fydeos.io",258],["jove.com",259],["argent.xyz",260],["pixeden.com",261],["akasha.org",262],["ashleyfurniture.com",263],["jibjab.com",265],["vietjetair.com",266],["kick.com",267],["cora-broodjes.nl",268],["jimdosite.com",268],["worstbassist.com",268],["evernote.com",[269,270,339]],["octopusenergy.co.jp",271],["findmcserver.com",272],["cityfalcon.ai",273],["digitalparking.city",274],["mediathekviewweb.de",275],["solana.com",276],["ef.co.id",277],["alohafromdeer.com",278],["fwd.com",[279,281]],["everywhere.game",280],["geotastic.net",282],["garageproject.co.nz",283],["tattoodo.com",[283,284]],["jmonline.com.br",285],["atlas.workland.com",285],["virginexperiencedays.co.uk",285],["emag.berliner-woche.de",[286,287,288]],["nordkurier.de",[286,287,288]],["everest-24.pl",[289,290]],["sneakerfreaker.com",291],["cryptofalka.hu",291],["walmart.ca",292],["byfood.com",293],["andsafe.de",294],["edostavka.by",295],["emall.by",295],["ishoppurium.com",296],["baseblocks.tenereteam.com",297],["onexstore.pl",[298,299,300]],["revanced.app",300],["evropochta.by",[301,302]],["inselberlin.de",303],["gronkh.tv",304],["adfilteringdevsummit.com",305],["dailyrevs.com",306],["dsworks.ru",306],["daraz.com",307],["learngerman.dw.com",308],["leeway.tech",309],["gostanford.com",310],["namensetiketten.de",311],["drafthound.com",[312,313]],["wokularach.pl",314],["bidup.amtrak.com",315],["eschuhe.de",316],["zeglins.com",317],["flyingpapers.com",318],["beta.character.ai",[319,320]],["bittimittari.fi",321],["aida64.co.uk",[322,323]],["aida64.com.ua",[322,323]],["aida64.de",[322,323]],["aida64.hu",[322,323]],["aida64.it",[322,323]],["aida64russia.com",[322,323]],["116.ru",324],["14.ru",324],["161.ru",324],["164.ru",324],["173.ru",324],["178.ru",324],["26.ru",324],["29.ru",324],["35.ru",324],["43.ru",324],["45.ru",324],["48.ru",324],["51.ru",324],["53.ru",324],["56.ru",324],["59.ru",324],["60.ru",324],["63.ru",324],["68.ru",324],["71.ru",324],["72.ru",324],["74.ru",324],["76.ru",324],["86.ru",324],["89.ru",324],["93.ru",324],["chita.ru",324],["e1.ru",324],["fontanka.ru",324],["ircity.ru",324],["izh1.ru",324],["mgorsk.ru",324],["msk1.ru",324],["ngs.ru",324],["ngs22.ru",324],["ngs24.ru",324],["ngs42.ru",324],["ngs55.ru",324],["ngs70.ru",324],["nn.ru",324],["sochi1.ru",324],["sterlitamak1.ru",324],["tolyatty.ru",324],["ufa1.ru",324],["v1.ru",324],["vladivostok1.ru",324],["voronezh1.ru",324],["ya62.ru",324],["116117.fi",325],["pjspub.com",326],["autodude.dk",327],["autodude.fi",327],["autodude.no",327],["autodude.se",327],["valostore.fi",327],["valostore.no",327],["valostore.se",327],["vivantis.*",328],["vivantis-shop.at",328],["krasa.cz",328],["auf1.tv",329],["wesendit.com",330],["hatch.co",331],["haberturk.com",332],["spaseekers.com",333],["incomeshares.com",334],["surnamedb.com",336],["pizzadelight-menu.co.uk",337],["ioplus.nl",338],["lahella.fi",340],["healf.com",341]]);
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
