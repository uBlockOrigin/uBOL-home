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
const argsList = [["CookieConsent--hideCookieConsent","true"],["consent","false"],["duckaiHasAgreedToTerms","true"],["lscache-klbq-bucket-scceptCookie","true"],["analytics-consent","accepted"],["cookie-consent","\"denied\""],["cookieConsent","granted"],["Express.cookie_agreement_shown","true"],["cookies-agreed-sellers-external-HC","true"],["hide-legal","1"],["cookie_consent","denied"],["cookies-toast-shown","true"],["show_consent_modal","1"],["SITE_2609202-COOKIE-BANNER","1"],["COOKIE_CONSENT","no"],["cookie_consent","true"],["df-cookies-allowed","true"],["cookie_consent","no"],["mmkv.default\\ANONYMOUS_ACCEPT_COOKIE","true"],["isCookieAccepted","true"],["cookies-pref","[]"],["cookiesAccepted","false"],["store-cookie-consent","accepted"],["_ccpa_analytics","false"],["_ccpa_marketing","false"],["_ccpa_personal","false"],["psh:cookies-other","false"],["no-cookie-notice-dismissed","true"],["psh:cookies-seen","true"],["psh:cookies-social","true"],["cookiesAccepted","true"],["isAcceptedCookie","1"],["cookiePolicy","true"],["cookiesAccepted","yes"],["cookies_enabled","true"],["acceptedAllCookies","false"],["cookiePreference","essential"],["cookie-consent-banner","declined"],["allowed_cookies","true"],["cookie-consent","false"],["consents-analytics","false"],["vdk-required-enabled","true"],["vdk-iframe-enabled","true"],["vdk-status","accept"],["cookie_consent","granted"],["cookieBarVisible","false"],["HAS_AGREE_POLICY","true"],["cookie-accepted","1"],["CustomCookieBannerAcceptIntent","true"],["pc-cookie-accepted","true"],["pc-cookie-technical-accepted","true"],["cookie-consent","rejected"],["owf_agree_cookie_policy","true"],["cookieConsent","accepted"],["allowFunctionalCookies","false"],["cookieClosed","true"],["explicitCookieAccept-24149","true"],["keeper_cookie_consent","true"],["cookie_accepted","true"],["consentLevel","1"],["cookies-val","accepted"],["201805-policy|accepted","1"],["GDPR-fingerprint:accepted","true"],["CPCCookies","true"],["privacyModalSeen","true"],["LGPDconsent","1"],["isCookiePoliceAccepted","1"],["HAS_ACCEPTED_PRIVACY_POLICY","true"],["cookiesAceptadas","true"],["privacy.com.br","accepted"],["supabase-consent-ph","false"],["cookieConsent","essential"],["has-seen-ccpa-notice","true"],["wbx__cookieAccepted","true"],["show_cookies_popup","false"],["modal_cookies","1"],["trainingDataConsent","true"],["cookieConsent","false"],["zglobal_Acookie_optOut","3"],["cookie","true"],["cookies_view","true"],["gdprConsent","false"],["framerCookiesDismissed","true"],["vue-cookie-accept-decline-cookiePanel","accept"],["cookies-consent-accepted","true"],["user-cookies-setting","1"],["COOKIE_AUTHORITY_QUERY_V2","1"],["ignore_cookie_warn","true"],["CerezUyariGosterildi","true"],["cookies-product","NO"],["showCookies","NO"],["localConsent","true"],["acceptedCookies","true"],["isNotificationDisplayed","true"],["COOKIE_BANNER_CLICKED","true"],["cookies-eu-statistics","false"],["cookies-eu-necessary","true"],["cookieStatus","rejected"],["consent","true"],["cookiePreference","required"],["technikmuseum-required-enabled","true"],["ctu-cm-n","1"],["ctu-cm-a","0"],["ctu-cm-m","0"],["cookieAndRecommendsAgreement","true"],["cookiebanner-active","false"],["tracking-state-v2","deny"],["cookieConsent","true"],["202306151200.shown.production","true"],["consent","[]"],["cookiebanner:extMedia","false"],["cookiebanner:statistic","false"],["consentAccepted","true"],["marketingConsentAccepted","false"],["consentMode","1"],["uninavIsAgreeCookie","true"],["cookieConsent","denied"],["cookieChoice","rejected"],["adsAccepted","false"],["analyticsAccepted","false"],["analytics_gdpr_accept","yes"],["youtube_gdpr_accept","yes"],["Analytics:accepted","false"],["GDPR:accepted","true"],["cookie_usage_acknowledged_2","1"],["a_c","true"],["userDeniedCookies","1"],["hasConsent","false"],["viewedCookieConsent","true"],["dnt_message_shown","1"],["necessaryConsent","true"],["marketingConsent","false"],["personalisationConsent","false"],["open_modal_update_policy","1"],["cookieinfo","1"],["cookies","1"],["cookieAccepted","true"],["necessary_cookie_confirmed","true"],["ccb_contao_token_1","1"],["cookies","0"],["cookies_accepted_6pzworitz8","true"],["rgpd.consent","1"],["_lukCookieAgree","2"],["cookiesAllowed","false"],["cookiePreference","1"],["artisan_acceptCookie","true"],["cookies_policy_acceptance","denied"],["SAFE__analyticsPreference","false"],["termsOfUseAccepted","true"],["agreeCookie","true"],["lgpd-agree","1"],["cookieIsAccepted","true"],["cookieAllowed","false"],["cookie_usage_accepted","1"],["cookieBannerShown","true"],["cookiesConsent","1"],["cookie_acceptance","true"],["analytics_cookies_acceptance","true"],["ns_cookies","1"],["gdpr","deny"],["c","false"],["cookies-preference","1"],["cookiesAcknowledged","1"],["hasConsentedPH","no"],["cookie_consent","accepted"],["gtag.consent.option","1"],["cps28","1"],["PrivacyPolicy[][core]","forbidden"],["PrivacyPolicy[][maps]","forbidden"],["PrivacyPolicy[][videos]","forever"],["PrivacyPolicy[][readSpeaker]","forbidden"],["PrivacyPolicy[][tracking]","forbidden"],["showCookieUse","false"],["terms","accepted"],["z_cookie_consent","true"],["StorageMartCookiesPolicySeen","true"],["bunq:CookieConsentStore:isBannerVisible","false"],["accepted-cookies","[]"],["ngx-webstorage|cookies","false"],["app_gdpr_consent","1"],["alreadyAcceptCookie","true"],["isCookiesAccepted","true"],["cookies","no"],["cookies-policy-accepted","true"],["cookie_prompt_times","1"],["last_prompt_time","1"],["sup_gdpr_cookie","accepted"],["gdpr_cookie","accepted"],["cn","true"],["consent_popup","1"],["COOKIE_CONSENT","false"],["cookie-consent-declined-version","1"],["Do-not-share","true"],["allow-cookies","false"],["__ph_opt_in_out_phc_9aSDbJCaDUMdZdHxxMPTvcj7A9fsl3mCgM1RBPmPsl7","0"],["should_display_cookie_banner_v2","false"],["zora-discover-14-03-23","false"],["connect-wallet-legal-consent","true"],["cookiesMin","1"],["cb-accept-cookie","true"],["cookie-permission","false"],["cookies","true"],["ROCUMENTS.cookieConsent","true"],["bcCookieAccepted","true"],["CMP:personalisation","1"],["pcClosedOnce","true"],["textshuttle_cookie","false"],["cookies-notification-message-is-hidden","true"],["cookieBanner","false"],["cookieBanner","true"],["banner","true"],["isAllowCookies","true"],["gtag_enabled","1"],["cvcConsentGiven","true"],["terms","true"],["cookie_accept","true"],["Pechinchou:CookiesModal","true"],["hub-cp","true"],["cookiePolicyAccepted","yes"],["cookie_usage_acknowledged_2","true"],["cookies_necessary_consent","true"],["cookies_marketing_consent","false"],["cookies_statistics_consent","false"],["wu.ccpa-toast-viewed","true"],["closed","true"],["dnt","1"],["dnt_a","1"],["makerz_allow_consentmgr","0"],["SHOW_COOKIE_BANNER","no"],["CookiesConsent","1"],["hasAnalyticalCookies","false"],["hasStrictlyNecessaryCookies","true"],["amCookieBarFirstShow","1"],["acceptedCookies","false"],["viewedCookieBanner","true"],["accept_all_cookies","false"],["isCookies","1"],["isCookie","Yes"],["cookieconsent_status","false"],["user_cookie","1"],["ka:4:legal-updates","true"],["cok","true"],["cookieMessage","true"],["soCookiesPolicy","1"],["GDPR:RBI:accepted","false"],["contao-privacy-center.hidden","1"],["cookie_consent","false"],["cookiesAgree","true"],["ytsc_accepted_cookies","true"],["safe-storage/v1/tracking-consent/trackingConsentMarketingKey","false"],["safe-storage/v1/tracking-consent/trackingConsentAdvertisingKey","false"],["safe-storage/v1/tracking-consent/trackingConsentAnalyticsKey","false"],["agreeToCookie","false"],["AI Alliance_ReactCookieAcceptance_hasSetCookies","true"],["firstVisit","false"],["2020-04-05","1"],["dismissed","true"],["SET_COOKIES_APPROVED","true"],["hasAcceptedCookies","true"],["isCookiesNotificationHidden","true"],["agreed-cookies","true"],["consentCookie","true"],["SWCOOKIESACC","1"],["hasAcceptedCookieNotice","true"],["fb-cookies-accepted","false"],["is_accept_cookie","true"],["accept-jove-cookie","1"],["cookie_consent_bar_value","true"],["pxdn_cookie_consent","true"],["akasha__cookiePolicy","true"],["QMOptIn","false"],["safe.global","false"],["cookie_banner:hidden","true"],["accept_cookie_policy","true"],["cookies_accepted","true"],["cookies-selected","true"],["cookie-notice-dismissed","true"],["accepts-cookie-notice","true"],["dismissedPrivacyCookieMessage","1"],["allowCookies","allowed"],["cookies_policy_status","true"],["cookies-accepted","true"],["allowCookies","true"],["cookie_consent","1"],["accepted-cookies","true"],["cookies-consent","0"],["cookieBannerRead","true"],["acceptCookie","0"],["cookieBannerReadDate","1"],["privacy-policy-accepted","true"],["accepted_cookies","true"],["accepted_cookie","true"],["cookie-consent","true"],["consentManager_shown","true"],["consent_necessary","true"],["consent_performance","false"],["cookie-closed","true"],["cookie-accepted","false"],["cookieConsent","1"],["enableCookieBanner","false"],["byFoodCookiePolicyRequire","false"],["ascookie--decision","true"],["isAcceptCookiesNew","true"],["isAcceptCookie","true"],["isAcceptCookie","false"],["marketing","false"],["technical","true","","reload","1"],["analytics","false"],["otherCookie","true"],["saveCookie","true"],["userAcceptsCookies","1"],["grnk-cookies-accepted","true"],["acceptCookies","no"],["acceptCookies","true"],["has-dismissed","1"],["hasAcceptedGdpr","true"],["lw-accepts-cookies","true"],["cookies-accept","true"],["load-scripts-v2","2"],["acceptsAnalyticsCookies","false"],["acceptsNecessaryCookies","true"],["display_cookie_modal","false"],["pg-accept-cookies","true"],["__EOBUWIE__consents_accepted","true","","reload","1"],["canada-cookie-acknowledge","1"],["FP_cookiesAccepted","true"],["VISITED_0","true"],["OPTIONAL_COOKIES_ACCEPTED_0","true"],["storagePermission","true"],["set_cookie_stat","false"],["set_cookie_tracking","false"],["UMP_CONSENT_NOTIFICATION","true"],["cookie-consent","1"],["userConsented","false"],["cookieConsent","necessary"],["gdpr-done","true"],["isTrackingAllowed","false"],["legalsAccepted","true"],["COOKIE_CONSENT_STATUS_4124","\"dismissed\""],["cookie-policy","approve"],["spaseekers:cookie-decision","accepted"],["policyAccepted","true"],["PrivacyPolicy[][core]","forever"],["consentBannerLastShown","1"],["flipdish-cookies-preferences","necessary"],["consentInteraction","true"],["cookie-notice-accepted-version","1"],["cookieConsentGiven","1"],["cookie-banner-accepted","true"]];
const hostnamesMap = new Map([["teamtailor.com",0],["dewesoft.com",1],["duckduckgo.com",2],["strinova.com",3],["thai-novel.com",4],["todoist.com",5],["notthebee.com",6],["bcs-express.ru",7],["seller.wildberries.ru",8],["wifiman.com",9],["vibeslist.ai",10],["mangalib.me",11],["anilib.me",11],["animelib.org",11],["hentailib.me",11],["hentailib.org",11],["mangalib.org",11],["ranobelib.me",11],["negrasport.pl",12],["pancernik.eu",[12,16]],["mobilelegends.com",13],["manuals.annafreud.org",14],["v3.ketogo.app",15],["ketogo.app",15],["schneideranwaelte.de",15],["traefik.io",15],["gesundheitsmanufaktur.de",[16,99]],["open24.ee",16],["granola.ai",17],["polar.sh",17],["posthog.com",17],["hatchet.run",17],["zeta-ai.io",18],["fiyat.mercedes-benz.com.tr",19],["sportbooking.info",20],["photo.codes",21],["filmzie.com",21],["granado.com.br",22],["sunnyside.shop",[23,24,25]],["nhnieuws.nl",[26,28,29]],["omroepbrabant.nl",[26,28,29]],["cape.co",27],["asianet.co.id",30],["p2p.land",30],["netbank.avida.no",30],["bo3.gg",30],["gs1.se",[30,54]],["puregoldprotein.com",[30,118,119]],["spectrumtherapeutics.com",30],["thingtesting.com",30],["streamclipsgermany.de",30],["kundenportal.harzenergie.de",30],["giselles.ai",31],["i-fundusze.pl",32],["improvethenews.org",32],["plente.com",32],["movies4us.*",32],["popcornmovies.to",32],["arkanium.serveminecraft.net",33],["bananacraft.serveminecraft.net",33],["myoffers.smartbuy.hdfcbank.com",34],["grass.io",[35,36]],["lustery.com",37],["ecoints.com",38],["emergetools.com",39],["receptagemini.pl",40],["bw.vdk.de",[41,42,43]],["search.odin.io",44],["gdh.digital",45],["popmart.com",46],["rozklady.bielsko.pl",47],["typeform.com",48],["erlus.com",[49,50]],["bettrfinancing.com",51],["sf-express.com",52],["min.io",53],["lemwarm.com",55],["form.fillout.com",56],["keepersecurity.com",57],["esto.eu",58],["ctol.digital",58],["beterbed.nl",59],["crt.hr",60],["code.likeagirl.io",61],["engineering.mixpanel.com",61],["betterprogramming.pub",61],["medium.com",61],["500ish.com",61],["gitconnected.com",61],["bettermarketing.pub",61],["diylifetech.com",61],["thebolditalic.com",61],["writingcooperative.com",61],["fanfare.pub",61],["betterhumans.pub",61],["fvd.nl",62],["cpc2r.ch",63],["metamask.io",64],["chavesnamao.com.br",65],["anhanguera.com",66],["bhaskar.com",67],["novaventa.com",68],["privacy.com.br",69],["supabase.com",70],["app.getgrass.io",71],["sanluisgarbage.com",72],["wildberries.ru",73],["cryptorank.io",74],["springmerchant.com",75],["veed.io",76],["deribit.com",77],["dorkgpt.com",77],["kyutai.org",77],["varusteleka.com",77],["lazyrecords.app",77],["unmute.sh",77],["zoho.com",78],["femibion.rs",79],["nove.fr",79],["metro1.com.br",79],["villagrancanaria.com",80],["baic.cz",81],["bunq.com",82],["framer.com",82],["inceptionlabs.ai",82],["zave.it",82],["tower.dev",82],["fleksberegner.dk",83],["duty.travel.cl",84],["solscan.io",85],["connorduffy.abundancerei.com",86],["bc.gamem",87],["akkushop-turkiye.com.tr",88],["k33.com",[89,90]],["komdigi.go.id",91],["fijiairways.com",92],["planner.kaboodle.co.nz",93],["pedalcommander.*",94],["sekisuialveo.com",[95,96]],["rightsize.dk",97],["random-group.olafneumann.org",98],["espadrij.com",99],["hygiene-shop.eu",99],["technikmuseum.berlin",100],["cvut.cz",[101,102,103]],["r-ulybka.ru",104],["voltadol.at",105],["evium.de",106],["hiring.amazon.com",107],["comnet.com.tr",107],["gpuscout.nl",107],["remanga.org",107],["parrotsec.org",107],["estrelabet.bet.br",107],["shonenjumpplus.com",108],["engeldirekt.de",109],["haleon-gebro.at",[110,111]],["happyplates.com",[112,113]],["ickonic.com",114],["abs-cbn.com",115],["news.abs-cbn.com",115],["opmaatzagen.nl",116],["mundwerk-rottweil.de",116],["sqlook.com",117],["adef-emploi.fr",[120,121]],["lumieresdelaville.net",[120,121]],["ccaf.io",[122,123]],["dbschenkerarkas.com.tr",124],["dbschenker-seino.jp",124],["dbschenker.com",[124,219]],["scinapse.io",125],["uc.pt",126],["bennettrogers.mysight.uk",127],["snipp.gg",127],["leafly.com",128],["geizhals.at",129],["geizhals.de",129],["geizhals.eu",129],["cenowarka.pl",129],["skinflint.co.uk",129],["webhallen.com",[130,131,132]],["olx.com.br",133],["unobike.com",134],["mod.io",135],["passport-photo.online",136],["mojmaxtv.hrvatskitelekom.hr",136],["rodrigue-app.ct.ws",136],["tme.eu",137],["mein-osttirol.rocks",138],["tennessine.co.uk",139],["ultraleds.co.uk",140],["greubelforsey.com",141],["lukify.app",142],["studiobookr.com",143],["getgrass.io",144],["artisan.co",145],["mobilefuse.com",146],["safe.global",[147,271]],["data.carbonmapper.org",148],["avica.link",149],["madeiramadeira.com.br",150],["sberdisk.ru",151],["column.com",152],["iqoption.com",153],["dopesnow.com",154],["montecwear.com",154],["romeo.com",155],["sonyliv.com",[156,157]],["cwallet.com",158],["oneskin.co",159],["telemetr.io",160],["near.org",161],["near.ai",161],["dev.near.org",162],["jito.network",163],["jito.wtf",163],["goodpods.com",164],["pngtree.com",[165,166]],["rhein-pfalz-kreis.de",[167,168,169,170,171]],["idar-oberstein.de",[167,168,169,170]],["vogelsbergkreis.de",[167,168,169,170]],["chamaeleon.de",[169,342]],["v2.xmeye.net",172],["venom.foundation",173],["canonvannederland.nl",174],["my-account.storage-mart.com",175],["web.bunq.com",176],["lifesum.com",177],["home.shortcutssoftware.com",178],["klimwinkel.nl",179],["markimicrowave.com",180],["aerolineas.com.ar",181],["5sim.net",181],["fold.dev",182],["mojposao.hr",183],["temu.com",[184,185]],["supreme.com",[186,187]],["g-star.com",188],["sawren.pl",189],["ultrahuman.com",190],["optionsgroup.com",191],["withpersona.com",[192,193]],["trigger.dev",194],["core.app",[195,197]],["zora.co",196],["kokku-online.de",198],["cuba-buddy.de",199],["datamask.app",200],["humandataincome.com",200],["crealitycloud.com",201],["triumphtechnicalinformation.com",202],["businessclass.com",203],["livsstil.se",204],["schneidewind-immobilien.de",205],["textshuttle.com",206],["simpleswap.io",207],["wales.nhs.attendanywhere.com",208],["anonpaste.pw",209],["sacal.it",209],["astondevs.ru",210],["gonxt.com",211],["geomiq.com",212],["bbc.com",213],["galaxy.com",214],["ticketmelon.com",215],["pechinchou.com.br",216],["thehub21.com",217],["archiup.com",218],["autoride.cz",[220,221,222]],["autoride.es",[220,221,222]],["autoride.io",[220,221,222]],["autoride.sk",[220,221,222]],["wunderground.com",223],["baselime.io",224],["eversports.de",[225,226]],["makerz.me",227],["reebok.eu",228],["alfa.com.ec",229],["rts.com.ec",229],["tropicalida.com.ec",229],["owgr.com",[230,231]],["beermerchants.com",232],["saamexe.com",[233,234]],["helium.com",233],["blommerscoffee.shipping-portal.com",233],["app.bionic-reading.com",235],["nloto.ru",236],["swisstours.com",237],["librinova.com",238],["format.bike",239],["khanacademy.org",240],["etelecinema.hu",241],["konicaminolta.com",242],["soquest.xyz",243],["region-bayreuth.de",244],["bahnland-bayern.de",245],["eezy.nrw",245],["nationalexpress.de",245],["sumupbookings.com",246],["chipcitycookies.com",246],["6amgroup.com",246],["go.bkk.hu",246],["worldlibertyfinancial.com",246],["happiful.com",246],["moondao.com",246],["bazaartracker.com",247],["subscribercounter.com",248],["app.klarna.com",[249,250,251]],["instantspoursoi.fr",252],["thealliance.ai",253],["librumreader.com",254],["visnos.com",255],["polypane.app",256],["changelly.com",257],["glose.com",258],["yellow.systems",259],["renebieder.com",260],["goodram.com",261],["starwalk.space",262],["vitotechnology.com",262],["codedead.com",263],["studiofabiobiesel.com",264],["fydeos.com",265],["fydeos.io",265],["jove.com",266],["argent.xyz",267],["pixeden.com",268],["akasha.org",269],["ashleyfurniture.com",270],["jibjab.com",272],["vietjetair.com",273],["kick.com",274],["cora-broodjes.nl",275],["jimdosite.com",275],["worstbassist.com",275],["evernote.com",[276,277,346]],["octopusenergy.co.jp",278],["findmcserver.com",279],["cityfalcon.ai",280],["digitalparking.city",281],["mediathekviewweb.de",282],["solana.com",283],["ef.co.id",284],["alohafromdeer.com",285],["fwd.com",[286,288]],["everywhere.game",287],["geotastic.net",289],["garageproject.co.nz",290],["tattoodo.com",[290,291]],["jmonline.com.br",292],["atlas.workland.com",292],["virginexperiencedays.co.uk",292],["emag.berliner-woche.de",[293,294,295]],["nordkurier.de",[293,294,295]],["everest-24.pl",[296,297]],["sneakerfreaker.com",298],["cryptofalka.hu",298],["walmart.ca",299],["byfood.com",300],["andsafe.de",301],["edostavka.by",302],["emall.by",302],["ishoppurium.com",303],["baseblocks.tenereteam.com",304],["onexstore.pl",[305,306,307]],["revanced.app",307],["evropochta.by",[308,309]],["inselberlin.de",310],["gronkh.tv",311],["adfilteringdevsummit.com",312],["dailyrevs.com",313],["dsworks.ru",313],["daraz.com",314],["learngerman.dw.com",315],["leeway.tech",316],["gostanford.com",317],["namensetiketten.de",318],["drafthound.com",[319,320]],["wokularach.pl",321],["bidup.amtrak.com",322],["eschuhe.de",323],["zeglins.com",324],["flyingpapers.com",325],["beta.character.ai",[326,327]],["bittimittari.fi",328],["aida64.co.uk",[329,330]],["aida64.com.ua",[329,330]],["aida64.de",[329,330]],["aida64.hu",[329,330]],["aida64.it",[329,330]],["aida64russia.com",[329,330]],["116.ru",331],["14.ru",331],["161.ru",331],["164.ru",331],["173.ru",331],["178.ru",331],["26.ru",331],["29.ru",331],["35.ru",331],["43.ru",331],["45.ru",331],["48.ru",331],["51.ru",331],["53.ru",331],["56.ru",331],["59.ru",331],["60.ru",331],["63.ru",331],["68.ru",331],["71.ru",331],["72.ru",331],["74.ru",331],["76.ru",331],["86.ru",331],["89.ru",331],["93.ru",331],["chita.ru",331],["e1.ru",331],["fontanka.ru",331],["ircity.ru",331],["izh1.ru",331],["mgorsk.ru",331],["msk1.ru",331],["ngs.ru",331],["ngs22.ru",331],["ngs24.ru",331],["ngs42.ru",331],["ngs55.ru",331],["ngs70.ru",331],["nn.ru",331],["sochi1.ru",331],["sterlitamak1.ru",331],["tolyatty.ru",331],["ufa1.ru",331],["v1.ru",331],["vladivostok1.ru",331],["voronezh1.ru",331],["ya62.ru",331],["116117.fi",332],["pjspub.com",333],["autodude.dk",334],["autodude.fi",334],["autodude.no",334],["autodude.se",334],["valostore.fi",334],["valostore.no",334],["valostore.se",334],["vivantis.*",335],["vivantis-shop.at",335],["krasa.cz",335],["auf1.tv",336],["wesendit.com",337],["hatch.co",338],["haberturk.com",339],["spaseekers.com",340],["incomeshares.com",341],["surnamedb.com",343],["pizzadelight-menu.co.uk",344],["ioplus.nl",345],["lahella.fi",347],["healf.com",348]]);
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
