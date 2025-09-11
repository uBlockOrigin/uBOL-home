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
const argsList = [["CookieConsent--hideCookieConsent","true"],["consent","false"],["lscache-klbq-bucket-scceptCookie","true"],["cookieConsent","granted"],["Express.cookie_agreement_shown","true"],["cookies-agreed-sellers-external-HC","true"],["hide-legal","1"],["cookie_consent","denied"],["cookies-toast-shown","true"],["show_consent_modal","1"],["SITE_2609202-COOKIE-BANNER","1"],["COOKIE_CONSENT","no"],["cookie_consent","true"],["df-cookies-allowed","true"],["cookie_consent","no"],["mmkv.default\\ANONYMOUS_ACCEPT_COOKIE","true"],["isCookieAccepted","true"],["cookies-pref","[]"],["cookiesAccepted","false"],["store-cookie-consent","accepted"],["_ccpa_analytics","false"],["_ccpa_marketing","false"],["_ccpa_personal","false"],["psh:cookies-other","false"],["no-cookie-notice-dismissed","true"],["psh:cookies-seen","true"],["psh:cookies-social","true"],["cookiesAccepted","true"],["isAcceptedCookie","1"],["cookiePolicy","true"],["cookiesAccepted","yes"],["cookies_enabled","true"],["acceptedAllCookies","false"],["cookiePreference","essential"],["cookie-consent-banner","declined"],["allowed_cookies","true"],["cookie-consent","false"],["consents-analytics","false"],["vdk-required-enabled","true"],["vdk-iframe-enabled","true"],["vdk-status","accept"],["cookie_consent","granted"],["cookieBarVisible","false"],["HAS_AGREE_POLICY","true"],["cookie-accepted","1"],["CustomCookieBannerAcceptIntent","true"],["pc-cookie-accepted","true"],["pc-cookie-technical-accepted","true"],["cookie-consent","rejected"],["owf_agree_cookie_policy","true"],["cookieConsent","accepted"],["allowFunctionalCookies","false"],["cookieClosed","true"],["explicitCookieAccept-24149","true"],["keeper_cookie_consent","true"],["cookie_accepted","true"],["consentLevel","1"],["cookies-val","accepted"],["201805-policy|accepted","1"],["GDPR-fingerprint:accepted","true"],["CPCCookies","true"],["privacyModalSeen","true"],["LGPDconsent","1"],["isCookiePoliceAccepted","1"],["HAS_ACCEPTED_PRIVACY_POLICY","true"],["cookiesAceptadas","true"],["privacy.com.br","accepted"],["supabase-consent-ph","false"],["cookieConsent","essential"],["has-seen-ccpa-notice","true"],["wbx__cookieAccepted","true"],["show_cookies_popup","false"],["modal_cookies","1"],["trainingDataConsent","true"],["cookieConsent","false"],["zglobal_Acookie_optOut","3"],["cookie","true"],["cookies_view","true"],["gdprConsent","false"],["framerCookiesDismissed","true"],["vue-cookie-accept-decline-cookiePanel","accept"],["cookies-consent-accepted","true"],["user-cookies-setting","1"],["COOKIE_AUTHORITY_QUERY_V2","1"],["ignore_cookie_warn","true"],["CerezUyariGosterildi","true"],["cookies-product","NO"],["showCookies","NO"],["localConsent","true"],["acceptedCookies","true"],["isNotificationDisplayed","true"],["COOKIE_BANNER_CLICKED","true"],["cookies-eu-statistics","false"],["cookies-eu-necessary","true"],["cookieStatus","rejected"],["consent","true"],["cookiePreference","required"],["technikmuseum-required-enabled","true"],["ctu-cm-n","1"],["ctu-cm-a","0"],["ctu-cm-m","0"],["cookieAndRecommendsAgreement","true"],["cookiebanner-active","false"],["tracking-state-v2","deny"],["cookieConsent","true"],["202306151200.shown.production","true"],["consent","[]"],["cookiebanner:extMedia","false"],["cookiebanner:statistic","false"],["consentAccepted","true"],["marketingConsentAccepted","false"],["consentMode","1"],["uninavIsAgreeCookie","true"],["cookieConsent","denied"],["cookieChoice","rejected"],["adsAccepted","false"],["analyticsAccepted","false"],["analytics_gdpr_accept","yes"],["youtube_gdpr_accept","yes"],["Analytics:accepted","false"],["GDPR:accepted","true"],["cookie_usage_acknowledged_2","1"],["a_c","true"],["userDeniedCookies","1"],["hasConsent","false"],["viewedCookieConsent","true"],["dnt_message_shown","1"],["necessaryConsent","true"],["marketingConsent","false"],["personalisationConsent","false"],["open_modal_update_policy","1"],["cookieinfo","1"],["cookies","1"],["cookieAccepted","true"],["necessary_cookie_confirmed","true"],["ccb_contao_token_1","1"],["cookies","0"],["cookies_accepted_6pzworitz8","true"],["rgpd.consent","1"],["_lukCookieAgree","2"],["cookiesAllowed","false"],["cookiePreference","1"],["artisan_acceptCookie","true"],["cookies_policy_acceptance","denied"],["SAFE__analyticsPreference","false"],["termsOfUseAccepted","true"],["agreeCookie","true"],["lgpd-agree","1"],["cookieIsAccepted","true"],["cookieAllowed","false"],["cookie_usage_accepted","1"],["cookieBannerShown","true"],["cookiesConsent","1"],["cookie_acceptance","true"],["analytics_cookies_acceptance","true"],["ns_cookies","1"],["gdpr","deny"],["c","false"],["cookies-preference","1"],["cookiesAcknowledged","1"],["hasConsentedPH","no"],["cookie_consent","accepted"],["gtag.consent.option","1"],["cps28","1"],["PrivacyPolicy[][core]","forbidden"],["PrivacyPolicy[][maps]","forbidden"],["PrivacyPolicy[][videos]","forever"],["PrivacyPolicy[][readSpeaker]","forbidden"],["PrivacyPolicy[][tracking]","forbidden"],["showCookieUse","false"],["terms","accepted"],["z_cookie_consent","true"],["StorageMartCookiesPolicySeen","true"],["bunq:CookieConsentStore:isBannerVisible","false"],["accepted-cookies","[]"],["ngx-webstorage|cookies","false"],["app_gdpr_consent","1"],["alreadyAcceptCookie","true"],["isCookiesAccepted","true"],["cookies","no"],["cookies-policy-accepted","true"],["cookie_prompt_times","1"],["last_prompt_time","1"],["sup_gdpr_cookie","accepted"],["gdpr_cookie","accepted"],["cn","true"],["consent_popup","1"],["COOKIE_CONSENT","false"],["cookie-consent-declined-version","1"],["Do-not-share","true"],["allow-cookies","false"],["__ph_opt_in_out_phc_9aSDbJCaDUMdZdHxxMPTvcj7A9fsl3mCgM1RBPmPsl7","0"],["should_display_cookie_banner_v2","false"],["zora-discover-14-03-23","false"],["connect-wallet-legal-consent","true"],["cookiesMin","1"],["cb-accept-cookie","true"],["cookie-permission","false"],["cookies","true"],["ROCUMENTS.cookieConsent","true"],["bcCookieAccepted","true"],["CMP:personalisation","1"],["pcClosedOnce","true"],["textshuttle_cookie","false"],["cookies-notification-message-is-hidden","true"],["cookieBanner","false"],["cookieBanner","true"],["banner","true"],["isAllowCookies","true"],["gtag_enabled","1"],["cvcConsentGiven","true"],["terms","true"],["cookie_accept","true"],["Pechinchou:CookiesModal","true"],["hub-cp","true"],["cookiePolicyAccepted","yes"],["cookie_usage_acknowledged_2","true"],["cookies_necessary_consent","true"],["cookies_marketing_consent","false"],["cookies_statistics_consent","false"],["wu.ccpa-toast-viewed","true"],["closed","true"],["dnt","1"],["dnt_a","1"],["makerz_allow_consentmgr","0"],["SHOW_COOKIE_BANNER","no"],["CookiesConsent","1"],["hasAnalyticalCookies","false"],["hasStrictlyNecessaryCookies","true"],["amCookieBarFirstShow","1"],["acceptedCookies","false"],["viewedCookieBanner","true"],["accept_all_cookies","false"],["isCookies","1"],["isCookie","Yes"],["cookieconsent_status","false"],["user_cookie","1"],["ka:4:legal-updates","true"],["cok","true"],["cookieMessage","true"],["soCookiesPolicy","1"],["GDPR:RBI:accepted","false"],["contao-privacy-center.hidden","1"],["cookie_consent","false"],["cookiesAgree","true"],["ytsc_accepted_cookies","true"],["safe-storage/v1/tracking-consent/trackingConsentMarketingKey","false"],["safe-storage/v1/tracking-consent/trackingConsentAdvertisingKey","false"],["safe-storage/v1/tracking-consent/trackingConsentAnalyticsKey","false"],["agreeToCookie","false"],["AI Alliance_ReactCookieAcceptance_hasSetCookies","true"],["firstVisit","false"],["2020-04-05","1"],["dismissed","true"],["SET_COOKIES_APPROVED","true"],["hasAcceptedCookies","true"],["isCookiesNotificationHidden","true"],["agreed-cookies","true"],["consentCookie","true"],["SWCOOKIESACC","1"],["hasAcceptedCookieNotice","true"],["fb-cookies-accepted","false"],["is_accept_cookie","true"],["accept-jove-cookie","1"],["cookie_consent_bar_value","true"],["pxdn_cookie_consent","true"],["akasha__cookiePolicy","true"],["QMOptIn","false"],["safe.global","false"],["cookie_banner:hidden","true"],["accept_cookie_policy","true"],["cookies_accepted","true"],["cookies-selected","true"],["cookie-notice-dismissed","true"],["accepts-cookie-notice","true"],["dismissedPrivacyCookieMessage","1"],["allowCookies","allowed"],["cookies_policy_status","true"],["cookies-accepted","true"],["allowCookies","true"],["cookie_consent","1"],["accepted-cookies","true"],["cookies-consent","0"],["cookieBannerRead","true"],["acceptCookie","0"],["cookieBannerReadDate","1"],["privacy-policy-accepted","true"],["accepted_cookies","true"],["accepted_cookie","true"],["cookie-consent","true"],["consentManager_shown","true"],["consent_necessary","true"],["consent_performance","false"],["cookie-closed","true"],["cookie-accepted","false"],["cookieConsent","1"],["enableCookieBanner","false"],["byFoodCookiePolicyRequire","false"],["ascookie--decision","true"],["isAcceptCookiesNew","true"],["isAcceptCookie","true"],["isAcceptCookie","false"],["marketing","false"],["technical","true","","reload","1"],["analytics","false"],["otherCookie","true"],["saveCookie","true"],["userAcceptsCookies","1"],["grnk-cookies-accepted","true"],["acceptCookies","no"],["acceptCookies","true"],["has-dismissed","1"],["hasAcceptedGdpr","true"],["lw-accepts-cookies","true"],["cookies-accept","true"],["load-scripts-v2","2"],["acceptsAnalyticsCookies","false"],["acceptsNecessaryCookies","true"],["display_cookie_modal","false"],["pg-accept-cookies","true"],["__EOBUWIE__consents_accepted","true","","reload","1"],["canada-cookie-acknowledge","1"],["FP_cookiesAccepted","true"],["VISITED_0","true"],["OPTIONAL_COOKIES_ACCEPTED_0","true"],["storagePermission","true"],["set_cookie_stat","false"],["set_cookie_tracking","false"],["UMP_CONSENT_NOTIFICATION","true"],["cookie-consent","1"],["userConsented","false"],["cookieConsent","necessary"],["gdpr-done","true"],["isTrackingAllowed","false"],["legalsAccepted","true"],["COOKIE_CONSENT_STATUS_4124","\"dismissed\""],["cookie-policy","approve"],["spaseekers:cookie-decision","accepted"],["policyAccepted","true"],["PrivacyPolicy[][core]","forever"],["consentBannerLastShown","1"],["flipdish-cookies-preferences","necessary"],["consentInteraction","true"],["cookie-notice-accepted-version","1"],["cookieConsentGiven","1"],["cookie-banner-accepted","true"]];
const hostnamesMap = new Map([["teamtailor.com",0],["dewesoft.com",1],["strinova.com",2],["notthebee.com",3],["bcs-express.ru",4],["seller.wildberries.ru",5],["wifiman.com",6],["vibeslist.ai",7],["mangalib.me",8],["anilib.me",8],["animelib.org",8],["hentailib.me",8],["hentailib.org",8],["mangalib.org",8],["ranobelib.me",8],["negrasport.pl",9],["pancernik.eu",[9,13]],["mobilelegends.com",10],["manuals.annafreud.org",11],["ketogo.app",12],["schneideranwaelte.de",12],["traefik.io",12],["gesundheitsmanufaktur.de",[13,96]],["open24.ee",13],["granola.ai",14],["polar.sh",14],["posthog.com",14],["hatchet.run",14],["zeta-ai.io",15],["fiyat.mercedes-benz.com.tr",16],["sportbooking.info",17],["photo.codes",18],["filmzie.com",18],["granado.com.br",19],["sunnyside.shop",[20,21,22]],["nhnieuws.nl",[23,25,26]],["omroepbrabant.nl",[23,25,26]],["cape.co",24],["asianet.co.id",27],["p2p.land",27],["netbank.avida.no",27],["bo3.gg",27],["gs1.se",[27,51]],["puregoldprotein.com",[27,115,116]],["spectrumtherapeutics.com",27],["thingtesting.com",27],["streamclipsgermany.de",27],["kundenportal.harzenergie.de",27],["giselles.ai",28],["i-fundusze.pl",29],["improvethenews.org",29],["plente.com",29],["movies4us.*",29],["popcornmovies.to",29],["arkanium.serveminecraft.net",30],["bananacraft.serveminecraft.net",30],["myoffers.smartbuy.hdfcbank.com",31],["grass.io",[32,33]],["lustery.com",34],["ecoints.com",35],["emergetools.com",36],["receptagemini.pl",37],["bw.vdk.de",[38,39,40]],["search.odin.io",41],["gdh.digital",42],["popmart.com",43],["rozklady.bielsko.pl",44],["typeform.com",45],["erlus.com",[46,47]],["bettrfinancing.com",48],["sf-express.com",49],["min.io",50],["lemwarm.com",52],["form.fillout.com",53],["keepersecurity.com",54],["esto.eu",55],["ctol.digital",55],["beterbed.nl",56],["crt.hr",57],["code.likeagirl.io",58],["engineering.mixpanel.com",58],["betterprogramming.pub",58],["medium.com",58],["500ish.com",58],["gitconnected.com",58],["bettermarketing.pub",58],["diylifetech.com",58],["thebolditalic.com",58],["writingcooperative.com",58],["fanfare.pub",58],["betterhumans.pub",58],["fvd.nl",59],["cpc2r.ch",60],["metamask.io",61],["chavesnamao.com.br",62],["anhanguera.com",63],["bhaskar.com",64],["novaventa.com",65],["privacy.com.br",66],["supabase.com",67],["app.getgrass.io",68],["sanluisgarbage.com",69],["wildberries.ru",70],["cryptorank.io",71],["springmerchant.com",72],["veed.io",73],["deribit.com",74],["dorkgpt.com",74],["kyutai.org",74],["varusteleka.com",74],["lazyrecords.app",74],["unmute.sh",74],["zoho.com",75],["femibion.rs",76],["nove.fr",76],["metro1.com.br",76],["villagrancanaria.com",77],["baic.cz",78],["bunq.com",79],["framer.com",79],["inceptionlabs.ai",79],["zave.it",79],["tower.dev",79],["fleksberegner.dk",80],["duty.travel.cl",81],["solscan.io",82],["connorduffy.abundancerei.com",83],["bc.gamem",84],["akkushop-turkiye.com.tr",85],["k33.com",[86,87]],["komdigi.go.id",88],["fijiairways.com",89],["planner.kaboodle.co.nz",90],["pedalcommander.*",91],["sekisuialveo.com",[92,93]],["rightsize.dk",94],["random-group.olafneumann.org",95],["espadrij.com",96],["hygiene-shop.eu",96],["technikmuseum.berlin",97],["cvut.cz",[98,99,100]],["r-ulybka.ru",101],["voltadol.at",102],["evium.de",103],["hiring.amazon.com",104],["comnet.com.tr",104],["gpuscout.nl",104],["remanga.org",104],["parrotsec.org",104],["estrelabet.bet.br",104],["shonenjumpplus.com",105],["engeldirekt.de",106],["haleon-gebro.at",[107,108]],["happyplates.com",[109,110]],["ickonic.com",111],["abs-cbn.com",112],["news.abs-cbn.com",112],["opmaatzagen.nl",113],["mundwerk-rottweil.de",113],["sqlook.com",114],["adef-emploi.fr",[117,118]],["lumieresdelaville.net",[117,118]],["ccaf.io",[119,120]],["dbschenkerarkas.com.tr",121],["dbschenker-seino.jp",121],["dbschenker.com",[121,216]],["scinapse.io",122],["uc.pt",123],["bennettrogers.mysight.uk",124],["snipp.gg",124],["leafly.com",125],["geizhals.at",126],["geizhals.de",126],["geizhals.eu",126],["cenowarka.pl",126],["skinflint.co.uk",126],["webhallen.com",[127,128,129]],["olx.com.br",130],["unobike.com",131],["mod.io",132],["passport-photo.online",133],["mojmaxtv.hrvatskitelekom.hr",133],["rodrigue-app.ct.ws",133],["tme.eu",134],["mein-osttirol.rocks",135],["tennessine.co.uk",136],["ultraleds.co.uk",137],["greubelforsey.com",138],["lukify.app",139],["studiobookr.com",140],["getgrass.io",141],["artisan.co",142],["mobilefuse.com",143],["safe.global",[144,268]],["data.carbonmapper.org",145],["avica.link",146],["madeiramadeira.com.br",147],["sberdisk.ru",148],["column.com",149],["iqoption.com",150],["dopesnow.com",151],["montecwear.com",151],["romeo.com",152],["sonyliv.com",[153,154]],["cwallet.com",155],["oneskin.co",156],["telemetr.io",157],["near.org",158],["near.ai",158],["dev.near.org",159],["jito.network",160],["jito.wtf",160],["goodpods.com",161],["pngtree.com",[162,163]],["rhein-pfalz-kreis.de",[164,165,166,167,168]],["idar-oberstein.de",[164,165,166,167]],["vogelsbergkreis.de",[164,165,166,167]],["chamaeleon.de",[166,339]],["v2.xmeye.net",169],["venom.foundation",170],["canonvannederland.nl",171],["my-account.storage-mart.com",172],["web.bunq.com",173],["lifesum.com",174],["home.shortcutssoftware.com",175],["klimwinkel.nl",176],["markimicrowave.com",177],["aerolineas.com.ar",178],["5sim.net",178],["fold.dev",179],["mojposao.hr",180],["temu.com",[181,182]],["supreme.com",[183,184]],["g-star.com",185],["sawren.pl",186],["ultrahuman.com",187],["optionsgroup.com",188],["withpersona.com",[189,190]],["trigger.dev",191],["core.app",[192,194]],["zora.co",193],["kokku-online.de",195],["cuba-buddy.de",196],["datamask.app",197],["humandataincome.com",197],["crealitycloud.com",198],["triumphtechnicalinformation.com",199],["businessclass.com",200],["livsstil.se",201],["schneidewind-immobilien.de",202],["textshuttle.com",203],["simpleswap.io",204],["wales.nhs.attendanywhere.com",205],["sacal.it",206],["astondevs.ru",207],["gonxt.com",208],["geomiq.com",209],["bbc.com",210],["galaxy.com",211],["ticketmelon.com",212],["pechinchou.com.br",213],["thehub21.com",214],["archiup.com",215],["autoride.cz",[217,218,219]],["autoride.es",[217,218,219]],["autoride.io",[217,218,219]],["autoride.sk",[217,218,219]],["wunderground.com",220],["baselime.io",221],["eversports.de",[222,223]],["makerz.me",224],["reebok.eu",225],["alfa.com.ec",226],["rts.com.ec",226],["tropicalida.com.ec",226],["owgr.com",[227,228]],["beermerchants.com",229],["saamexe.com",[230,231]],["helium.com",230],["blommerscoffee.shipping-portal.com",230],["app.bionic-reading.com",232],["nloto.ru",233],["swisstours.com",234],["librinova.com",235],["format.bike",236],["khanacademy.org",237],["etelecinema.hu",238],["konicaminolta.com",239],["soquest.xyz",240],["region-bayreuth.de",241],["bahnland-bayern.de",242],["eezy.nrw",242],["nationalexpress.de",242],["sumupbookings.com",243],["chipcitycookies.com",243],["6amgroup.com",243],["go.bkk.hu",243],["worldlibertyfinancial.com",243],["happiful.com",243],["moondao.com",243],["bazaartracker.com",244],["subscribercounter.com",245],["app.klarna.com",[246,247,248]],["instantspoursoi.fr",249],["thealliance.ai",250],["librumreader.com",251],["visnos.com",252],["polypane.app",253],["changelly.com",254],["glose.com",255],["yellow.systems",256],["renebieder.com",257],["goodram.com",258],["starwalk.space",259],["vitotechnology.com",259],["codedead.com",260],["studiofabiobiesel.com",261],["fydeos.com",262],["fydeos.io",262],["jove.com",263],["argent.xyz",264],["pixeden.com",265],["akasha.org",266],["ashleyfurniture.com",267],["jibjab.com",269],["vietjetair.com",270],["kick.com",271],["cora-broodjes.nl",272],["jimdosite.com",272],["worstbassist.com",272],["evernote.com",[273,274,343]],["octopusenergy.co.jp",275],["findmcserver.com",276],["cityfalcon.ai",277],["digitalparking.city",278],["mediathekviewweb.de",279],["solana.com",280],["ef.co.id",281],["alohafromdeer.com",282],["fwd.com",[283,285]],["everywhere.game",284],["geotastic.net",286],["garageproject.co.nz",287],["tattoodo.com",[287,288]],["jmonline.com.br",289],["atlas.workland.com",289],["virginexperiencedays.co.uk",289],["emag.berliner-woche.de",[290,291,292]],["nordkurier.de",[290,291,292]],["everest-24.pl",[293,294]],["sneakerfreaker.com",295],["cryptofalka.hu",295],["walmart.ca",296],["byfood.com",297],["andsafe.de",298],["edostavka.by",299],["emall.by",299],["ishoppurium.com",300],["baseblocks.tenereteam.com",301],["onexstore.pl",[302,303,304]],["revanced.app",304],["evropochta.by",[305,306]],["inselberlin.de",307],["gronkh.tv",308],["adfilteringdevsummit.com",309],["dailyrevs.com",310],["dsworks.ru",310],["daraz.com",311],["learngerman.dw.com",312],["leeway.tech",313],["gostanford.com",314],["namensetiketten.de",315],["drafthound.com",[316,317]],["wokularach.pl",318],["bidup.amtrak.com",319],["eschuhe.de",320],["zeglins.com",321],["flyingpapers.com",322],["beta.character.ai",[323,324]],["bittimittari.fi",325],["aida64.co.uk",[326,327]],["aida64.com.ua",[326,327]],["aida64.de",[326,327]],["aida64.hu",[326,327]],["aida64.it",[326,327]],["aida64russia.com",[326,327]],["116.ru",328],["14.ru",328],["161.ru",328],["164.ru",328],["173.ru",328],["178.ru",328],["26.ru",328],["29.ru",328],["35.ru",328],["43.ru",328],["45.ru",328],["48.ru",328],["51.ru",328],["53.ru",328],["56.ru",328],["59.ru",328],["60.ru",328],["63.ru",328],["68.ru",328],["71.ru",328],["72.ru",328],["74.ru",328],["76.ru",328],["86.ru",328],["89.ru",328],["93.ru",328],["chita.ru",328],["e1.ru",328],["fontanka.ru",328],["ircity.ru",328],["izh1.ru",328],["mgorsk.ru",328],["msk1.ru",328],["ngs.ru",328],["ngs22.ru",328],["ngs24.ru",328],["ngs42.ru",328],["ngs55.ru",328],["ngs70.ru",328],["nn.ru",328],["sochi1.ru",328],["sterlitamak1.ru",328],["tolyatty.ru",328],["ufa1.ru",328],["v1.ru",328],["vladivostok1.ru",328],["voronezh1.ru",328],["ya62.ru",328],["116117.fi",329],["pjspub.com",330],["autodude.dk",331],["autodude.fi",331],["autodude.no",331],["autodude.se",331],["valostore.fi",331],["valostore.no",331],["valostore.se",331],["vivantis.*",332],["vivantis-shop.at",332],["krasa.cz",332],["auf1.tv",333],["wesendit.com",334],["hatch.co",335],["haberturk.com",336],["spaseekers.com",337],["incomeshares.com",338],["surnamedb.com",340],["pizzadelight-menu.co.uk",341],["ioplus.nl",342],["lahella.fi",344],["healf.com",345]]);
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
