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
const argsList = [["cookieConsent","{}"],["anitrend_analytics_consent","denied"],["wbdLTP","true"],["CookieConsent--hideCookieConsent","true"],["consent","false"],["duckaiHasAgreedToTerms","true"],["areCookiesAccepted","true"],["cookieConsentV2","1"],["gdpr","0"],["room-welcome-ack-v1","1"],["COOKIE_CHECK","false"],["lscache-klbq-bucket-scceptCookie","true"],["analytics-consent","accepted"],["cookie-consent","\"denied\""],["cookieConsent","granted"],["Express.cookie_agreement_shown","true"],["cookies-agreed-sellers-external-HC","true"],["hide-legal","1"],["cookie_consent","denied"],["cookies-toast-shown","true"],["show_consent_modal","1"],["SITE_2609202-COOKIE-BANNER","1"],["COOKIE_CONSENT","no"],["cookie_consent","true"],["df-cookies-allowed","true"],["cookie_consent","no"],["mmkv.default\\ANONYMOUS_ACCEPT_COOKIE","true"],["isCookieAccepted","true"],["cookies-pref","[]"],["cookiesAccepted","false"],["store-cookie-consent","accepted"],["_ccpa_analytics","false"],["_ccpa_marketing","false"],["_ccpa_personal","false"],["psh:cookies-other","false"],["no-cookie-notice-dismissed","true"],["psh:cookies-seen","true"],["psh:cookies-social","true"],["cookiesAccepted","true"],["isAcceptedCookie","1"],["cookiePolicy","true"],["cookiesAccepted","yes"],["cookies_enabled","true"],["acceptedAllCookies","false"],["cookiePreference","essential"],["cookie-consent-banner","declined"],["allowed_cookies","true"],["cookie-consent","false"],["consents-analytics","false"],["vdk-required-enabled","true"],["vdk-iframe-enabled","true"],["vdk-status","accept"],["cookie_consent","granted"],["cookieBarVisible","false"],["HAS_AGREE_POLICY","true"],["cookie-accepted","1"],["CustomCookieBannerAcceptIntent","true"],["pc-cookie-accepted","true"],["pc-cookie-technical-accepted","true"],["cookie-consent","rejected"],["owf_agree_cookie_policy","true"],["cookieConsent","accepted"],["allowFunctionalCookies","false"],["cookieClosed","true"],["explicitCookieAccept-24149","true"],["keeper_cookie_consent","true"],["cookie_accepted","true"],["consentLevel","1"],["cookies-val","accepted"],["201805-policy|accepted","1"],["GDPR-fingerprint:accepted","true"],["CPCCookies","true"],["privacyModalSeen","true"],["LGPDconsent","1"],["isCookiePoliceAccepted","1"],["HAS_ACCEPTED_PRIVACY_POLICY","true"],["cookiesAceptadas","true"],["privacy.com.br","accepted"],["supabase-consent-ph","false"],["cookieConsent","essential"],["has-seen-ccpa-notice","true"],["wbx__cookieAccepted","true"],["show_cookies_popup","false"],["modal_cookies","1"],["trainingDataConsent","true"],["cookieConsent","false"],["zglobal_Acookie_optOut","3"],["cookie","true"],["cookies_view","true"],["gdprConsent","false"],["framerCookiesDismissed","true"],["vue-cookie-accept-decline-cookiePanel","accept"],["cookies-consent-accepted","true"],["user-cookies-setting","1"],["COOKIE_AUTHORITY_QUERY_V2","1"],["ignore_cookie_warn","true"],["CerezUyariGosterildi","true"],["cookies-product","NO"],["showCookies","NO"],["localConsent","true"],["acceptedCookies","true"],["isNotificationDisplayed","true"],["COOKIE_BANNER_CLICKED","true"],["cookies-eu-statistics","false"],["cookies-eu-necessary","true"],["cookieStatus","rejected"],["consent","true"],["cookiePreference","required"],["technikmuseum-required-enabled","true"],["ctu-cm-n","1"],["ctu-cm-a","0"],["ctu-cm-m","0"],["cookieAndRecommendsAgreement","true"],["cookiebanner-active","false"],["tracking-state-v2","deny"],["cookieConsent","true"],["202306151200.shown.production","true"],["consent","[]"],["cookiebanner:extMedia","false"],["cookiebanner:statistic","false"],["consentAccepted","true"],["marketingConsentAccepted","false"],["consentMode","1"],["uninavIsAgreeCookie","true"],["cookieConsent","denied"],["cookieChoice","rejected"],["adsAccepted","false"],["analyticsAccepted","false"],["analytics_gdpr_accept","yes"],["youtube_gdpr_accept","yes"],["Analytics:accepted","false"],["GDPR:accepted","true"],["cookie_usage_acknowledged_2","1"],["a_c","true"],["userDeniedCookies","1"],["hasConsent","false"],["viewedCookieConsent","true"],["dnt_message_shown","1"],["necessaryConsent","true"],["marketingConsent","false"],["personalisationConsent","false"],["open_modal_update_policy","1"],["cookieinfo","1"],["cookies","1"],["cookieAccepted","true"],["necessary_cookie_confirmed","true"],["ccb_contao_token_1","1"],["cookies","0"],["cookies_accepted_6pzworitz8","true"],["rgpd.consent","1"],["_lukCookieAgree","2"],["cookiesAllowed","false"],["cookiePreference","1"],["artisan_acceptCookie","true"],["cookies_policy_acceptance","denied"],["SAFE__analyticsPreference","false"],["termsOfUseAccepted","true"],["agreeCookie","true"],["lgpd-agree","1"],["cookieIsAccepted","true"],["cookieAllowed","false"],["cookie_usage_accepted","1"],["cookieBannerShown","true"],["cookiesConsent","1"],["cookie_acceptance","true"],["analytics_cookies_acceptance","true"],["ns_cookies","1"],["gdpr","deny"],["c","false"],["cookies-preference","1"],["cookiesAcknowledged","1"],["hasConsentedPH","no"],["cookie_consent","accepted"],["gtag.consent.option","1"],["cps28","1"],["PrivacyPolicy[][core]","forbidden"],["PrivacyPolicy[][maps]","forbidden"],["PrivacyPolicy[][videos]","forever"],["PrivacyPolicy[][readSpeaker]","forbidden"],["PrivacyPolicy[][tracking]","forbidden"],["showCookieUse","false"],["terms","accepted"],["z_cookie_consent","true"],["StorageMartCookiesPolicySeen","true"],["bunq:CookieConsentStore:isBannerVisible","false"],["accepted-cookies","[]"],["ngx-webstorage|cookies","false"],["app_gdpr_consent","1"],["alreadyAcceptCookie","true"],["isCookiesAccepted","true"],["cookies","no"],["cookies-policy-accepted","true"],["cookie_prompt_times","1"],["last_prompt_time","1"],["sup_gdpr_cookie","accepted"],["gdpr_cookie","accepted"],["cn","true"],["consent_popup","1"],["COOKIE_CONSENT","false"],["cookie-consent-declined-version","1"],["Do-not-share","true"],["allow-cookies","false"],["should_display_cookie_banner_v2","false"],["zora-discover-14-03-23","false"],["connect-wallet-legal-consent","true"],["cookiesMin","1"],["cb-accept-cookie","true"],["cookie-permission","false"],["cookies","true"],["ROCUMENTS.cookieConsent","true"],["bcCookieAccepted","true"],["CMP:personalisation","1"],["pcClosedOnce","true"],["textshuttle_cookie","false"],["cookies-notification-message-is-hidden","true"],["cookieBanner","false"],["cookieBanner","true"],["banner","true"],["isAllowCookies","true"],["gtag_enabled","1"],["cvcConsentGiven","true"],["terms","true"],["cookie_accept","true"],["Pechinchou:CookiesModal","true"],["hub-cp","true"],["cookiePolicyAccepted","yes"],["cookie_usage_acknowledged_2","true"],["cookies_necessary_consent","true"],["cookies_marketing_consent","false"],["cookies_statistics_consent","false"],["wu.ccpa-toast-viewed","true"],["closed","true"],["dnt","1"],["dnt_a","1"],["makerz_allow_consentmgr","0"],["SHOW_COOKIE_BANNER","no"],["CookiesConsent","1"],["hasAnalyticalCookies","false"],["hasStrictlyNecessaryCookies","true"],["amCookieBarFirstShow","1"],["acceptedCookies","false"],["viewedCookieBanner","true"],["accept_all_cookies","false"],["isCookies","1"],["isCookie","Yes"],["cookieconsent_status","false"],["user_cookie","1"],["ka:4:legal-updates","true"],["cok","true"],["cookieMessage","true"],["soCookiesPolicy","1"],["GDPR:RBI:accepted","false"],["contao-privacy-center.hidden","1"],["cookie_consent","false"],["cookiesAgree","true"],["ytsc_accepted_cookies","true"],["safe-storage/v1/tracking-consent/trackingConsentMarketingKey","false"],["safe-storage/v1/tracking-consent/trackingConsentAdvertisingKey","false"],["safe-storage/v1/tracking-consent/trackingConsentAnalyticsKey","false"],["agreeToCookie","false"],["AI Alliance_ReactCookieAcceptance_hasSetCookies","true"],["firstVisit","false"],["2020-04-05","1"],["dismissed","true"],["SET_COOKIES_APPROVED","true"],["hasAcceptedCookies","true"],["isCookiesNotificationHidden","true"],["agreed-cookies","true"],["consentCookie","true"],["SWCOOKIESACC","1"],["hasAcceptedCookieNotice","true"],["fb-cookies-accepted","false"],["is_accept_cookie","true"],["accept-jove-cookie","1"],["cookie_consent_bar_value","true"],["pxdn_cookie_consent","true"],["akasha__cookiePolicy","true"],["QMOptIn","false"],["safe.global","false"],["cookie_banner:hidden","true"],["accept_cookie_policy","true"],["cookies_accepted","true"],["cookies-selected","true"],["cookie-notice-dismissed","true"],["accepts-cookie-notice","true"],["dismissedPrivacyCookieMessage","1"],["allowCookies","allowed"],["cookies_policy_status","true"],["cookies-accepted","true"],["allowCookies","true"],["cookie_consent","1"],["accepted-cookies","true"],["cookies-consent","0"],["cookieBannerRead","true"],["acceptCookie","0"],["cookieBannerReadDate","1"],["privacy-policy-accepted","true"],["accepted_cookies","true"],["accepted_cookie","true"],["cookie-consent","true"],["consentManager_shown","true"],["consent_necessary","true"],["consent_performance","false"],["cookie-closed","true"],["cookie-accepted","false"],["consent_analytics","false"],["consent_granted","true"],["consent_marketing","false"],["cookie-accepted","true"],["cookieConsent","1"],["enableCookieBanner","false"],["byFoodCookiePolicyRequire","false"],["ascookie--decision","true"],["isAcceptCookiesNew","true"],["isAcceptCookie","true"],["isAcceptCookie","false"],["marketing","false"],["technical","true","","reload","1"],["analytics","false"],["otherCookie","true"],["saveCookie","true"],["userAcceptsCookies","1"],["grnk-cookies-accepted","true"],["acceptCookies","no"],["acceptCookies","true"],["has-dismissed","1"],["hasAcceptedGdpr","true"],["lw-accepts-cookies","true"],["cookies-accept","true"],["load-scripts-v2","2"],["acceptsAnalyticsCookies","false"],["acceptsNecessaryCookies","true"],["display_cookie_modal","false"],["pg-accept-cookies","true"],["__EOBUWIE__consents_accepted","true","","reload","1"],["canada-cookie-acknowledge","1"],["FP_cookiesAccepted","true"],["VISITED_0","true"],["OPTIONAL_COOKIES_ACCEPTED_0","true"],["storagePermission","true"],["set_cookie_stat","false"],["set_cookie_tracking","false"],["UMP_CONSENT_NOTIFICATION","true"],["cookie-consent","1"],["userConsented","false"],["cookieConsent","necessary"],["gdpr-done","true"],["isTrackingAllowed","false"],["legalsAccepted","true"],["COOKIE_CONSENT_STATUS_4124","\"dismissed\""],["cookie-policy","approve"],["spaseekers:cookie-decision","accepted"],["policyAccepted","true"],["PrivacyPolicy[][core]","forever"],["consentBannerLastShown","1"],["flipdish-cookies-preferences","necessary"],["consentInteraction","true"],["cookie-notice-accepted-version","1"],["cookieConsentGiven","1"],["cookie-banner-accepted","true"]];
const hostnamesMap = new Map([["rg.ru",0],["anitrend.co",1],["foodnetwork.com",2],["teamtailor.com",3],["dewesoft.com",4],["duckduckgo.com",5],["hospihousing.com",6],["mastersintime.com",7],["watch.co.uk",7],["inverto.tv",8],["theroom.lol",9],["titantvguide.com",10],["strinova.com",11],["thai-novel.com",12],["todoist.com",13],["notthebee.com",14],["bcs-express.ru",15],["seller.wildberries.ru",16],["wifiman.com",17],["vibeslist.ai",18],["shlib.life",19],["slashlib.me",19],["mangalib.me",19],["anilib.me",19],["animelib.org",19],["hentailib.me",19],["hentailib.org",19],["mangalib.org",19],["ranobelib.me",19],["negrasport.pl",20],["pancernik.eu",[20,24]],["mobilelegends.com",21],["manuals.annafreud.org",22],["v3.ketogo.app",23],["ketogo.app",23],["schneideranwaelte.de",23],["traefik.io",23],["gesundheitsmanufaktur.de",[24,107]],["open24.ee",24],["granola.ai",25],["polar.sh",25],["posthog.com",25],["hatchet.run",25],["zeta-ai.io",26],["fiyat.mercedes-benz.com.tr",27],["sportbooking.info",28],["photo.codes",29],["filmzie.com",29],["granado.com.br",30],["sunnyside.shop",[31,32,33]],["nhnieuws.nl",[34,36,37]],["omroepbrabant.nl",[34,36,37]],["cape.co",35],["asianet.co.id",38],["p2p.land",38],["netbank.avida.no",38],["bo3.gg",38],["gs1.se",[38,62]],["puregoldprotein.com",[38,126,127]],["spectrumtherapeutics.com",38],["thingtesting.com",38],["streamclipsgermany.de",38],["kundenportal.harzenergie.de",38],["giselles.ai",39],["i-fundusze.pl",40],["improvethenews.org",40],["plente.com",40],["movies4us.*",40],["popcornmovies.to",40],["arkanium.serveminecraft.net",41],["bananacraft.serveminecraft.net",41],["myoffers.smartbuy.hdfcbank.com",42],["grass.io",[43,44]],["lustery.com",45],["ecoints.com",46],["emergetools.com",47],["receptagemini.pl",48],["bw.vdk.de",[49,50,51]],["search.odin.io",52],["gdh.digital",53],["popmart.com",54],["rozklady.bielsko.pl",55],["typeform.com",56],["erlus.com",[57,58]],["bettrfinancing.com",59],["sf-express.com",60],["min.io",61],["lemwarm.com",63],["form.fillout.com",64],["keepersecurity.com",65],["esto.eu",66],["ctol.digital",66],["beterbed.nl",67],["crt.hr",68],["code.likeagirl.io",69],["engineering.mixpanel.com",69],["betterprogramming.pub",69],["medium.com",69],["500ish.com",69],["gitconnected.com",69],["bettermarketing.pub",69],["diylifetech.com",69],["thebolditalic.com",69],["writingcooperative.com",69],["fanfare.pub",69],["betterhumans.pub",69],["fvd.nl",70],["cpc2r.ch",71],["metamask.io",72],["chavesnamao.com.br",73],["anhanguera.com",74],["bhaskar.com",75],["novaventa.com",76],["privacy.com.br",77],["supabase.com",78],["app.getgrass.io",79],["sanluisgarbage.com",80],["wildberries.ru",81],["cryptorank.io",82],["springmerchant.com",83],["veed.io",84],["deribit.com",85],["dorkgpt.com",85],["kyutai.org",85],["varusteleka.com",85],["lazyrecords.app",85],["unmute.sh",85],["zoho.com",86],["femibion.rs",87],["nove.fr",87],["metro1.com.br",87],["villagrancanaria.com",88],["baic.cz",89],["mollie.com",90],["bunq.com",90],["framer.com",90],["inceptionlabs.ai",90],["zave.it",90],["tower.dev",90],["fleksberegner.dk",91],["duty.travel.cl",92],["solscan.io",93],["connorduffy.abundancerei.com",94],["bc.gamem",95],["akkushop-turkiye.com.tr",96],["k33.com",[97,98]],["komdigi.go.id",99],["fijiairways.com",100],["planner.kaboodle.co.nz",101],["pedalcommander.*",102],["sekisuialveo.com",[103,104]],["rightsize.dk",105],["random-group.olafneumann.org",106],["espadrij.com",107],["hygiene-shop.eu",107],["technikmuseum.berlin",108],["cvut.cz",[109,110,111]],["r-ulybka.ru",112],["voltadol.at",113],["evium.de",114],["hiring.amazon.com",115],["comnet.com.tr",115],["gpuscout.nl",115],["remanga.org",115],["parrotsec.org",115],["estrelabet.bet.br",115],["cricketgully.com",115],["shonenjumpplus.com",116],["engeldirekt.de",117],["haleon-gebro.at",[118,119]],["happyplates.com",[120,121]],["ickonic.com",122],["abs-cbn.com",123],["news.abs-cbn.com",123],["opmaatzagen.nl",124],["mundwerk-rottweil.de",124],["sqlook.com",125],["adef-emploi.fr",[128,129]],["lumieresdelaville.net",[128,129]],["ccaf.io",[130,131]],["dbschenkerarkas.com.tr",132],["dbschenker-seino.jp",132],["dbschenker.com",[132,226]],["scinapse.io",133],["uc.pt",134],["bennettrogers.mysight.uk",135],["snipp.gg",135],["leafly.com",136],["geizhals.at",137],["geizhals.de",137],["geizhals.eu",137],["cenowarka.pl",137],["skinflint.co.uk",137],["webhallen.com",[138,139,140]],["olx.com.br",141],["unobike.com",142],["mod.io",143],["passport-photo.online",144],["mojmaxtv.hrvatskitelekom.hr",144],["rodrigue-app.ct.ws",144],["tme.eu",145],["mein-osttirol.rocks",146],["tennessine.co.uk",147],["ultraleds.co.uk",148],["greubelforsey.com",149],["lukify.app",150],["studiobookr.com",151],["getgrass.io",152],["artisan.co",153],["mobilefuse.com",154],["safe.global",[155,278]],["data.carbonmapper.org",156],["avica.link",157],["madeiramadeira.com.br",158],["sberdisk.ru",159],["column.com",160],["iqoption.com",161],["dopesnow.com",162],["montecwear.com",162],["romeo.com",163],["sonyliv.com",[164,165]],["cwallet.com",166],["oneskin.co",167],["telemetr.io",168],["near.org",169],["near.ai",169],["dev.near.org",170],["jito.network",171],["jito.wtf",171],["goodpods.com",172],["pngtree.com",[173,174]],["rhein-pfalz-kreis.de",[175,176,177,178,179]],["idar-oberstein.de",[175,176,177,178]],["vogelsbergkreis.de",[175,176,177,178]],["chamaeleon.de",[177,353]],["v2.xmeye.net",180],["venom.foundation",181],["canonvannederland.nl",182],["my-account.storage-mart.com",183],["web.bunq.com",184],["lifesum.com",185],["home.shortcutssoftware.com",186],["klimwinkel.nl",187],["markimicrowave.com",188],["aerolineas.com.ar",189],["5sim.net",189],["fold.dev",190],["mojposao.hr",191],["temu.com",[192,193]],["supreme.com",[194,195]],["g-star.com",196],["sawren.pl",197],["ultrahuman.com",198],["optionsgroup.com",199],["withpersona.com",[200,201]],["core.app",[202,204]],["zora.co",203],["kokku-online.de",205],["cuba-buddy.de",206],["datamask.app",207],["humandataincome.com",207],["crealitycloud.com",208],["triumphtechnicalinformation.com",209],["businessclass.com",210],["livsstil.se",211],["schneidewind-immobilien.de",212],["textshuttle.com",213],["simpleswap.io",214],["wales.nhs.attendanywhere.com",215],["anonpaste.pw",216],["sacal.it",216],["astondevs.ru",217],["gonxt.com",218],["geomiq.com",219],["bbc.com",220],["galaxy.com",221],["ticketmelon.com",222],["pechinchou.com.br",223],["thehub21.com",224],["archiup.com",225],["autoride.cz",[227,228,229]],["autoride.es",[227,228,229]],["autoride.io",[227,228,229]],["autoride.sk",[227,228,229]],["wunderground.com",230],["baselime.io",231],["eversports.de",[232,233]],["makerz.me",234],["reebok.eu",235],["alfa.com.ec",236],["rts.com.ec",236],["tropicalida.com.ec",236],["owgr.com",[237,238]],["beermerchants.com",239],["saamexe.com",[240,241]],["helium.com",240],["blommerscoffee.shipping-portal.com",240],["app.bionic-reading.com",242],["nloto.ru",243],["swisstours.com",244],["librinova.com",245],["format.bike",246],["khanacademy.org",247],["etelecinema.hu",248],["konicaminolta.com",249],["soquest.xyz",250],["region-bayreuth.de",251],["bahnland-bayern.de",252],["eezy.nrw",252],["nationalexpress.de",252],["sumupbookings.com",253],["chipcitycookies.com",253],["6amgroup.com",253],["go.bkk.hu",253],["worldlibertyfinancial.com",253],["happiful.com",253],["moondao.com",253],["bazaartracker.com",254],["subscribercounter.com",255],["app.klarna.com",[256,257,258]],["instantspoursoi.fr",259],["thealliance.ai",260],["librumreader.com",261],["visnos.com",262],["polypane.app",263],["changelly.com",264],["glose.com",265],["yellow.systems",266],["renebieder.com",267],["goodram.com",268],["starwalk.space",269],["vitotechnology.com",269],["codedead.com",270],["studiofabiobiesel.com",271],["fydeos.com",272],["fydeos.io",272],["jove.com",273],["argent.xyz",274],["pixeden.com",275],["akasha.org",276],["ashleyfurniture.com",277],["jibjab.com",279],["vietjetair.com",280],["kick.com",281],["cora-broodjes.nl",282],["jimdosite.com",282],["worstbassist.com",282],["evernote.com",[283,284,357]],["octopusenergy.co.jp",285],["findmcserver.com",286],["cityfalcon.ai",287],["digitalparking.city",288],["mediathekviewweb.de",289],["solana.com",290],["ef.co.id",291],["alohafromdeer.com",292],["fwd.com",[293,295]],["everywhere.game",294],["geotastic.net",296],["garageproject.co.nz",297],["tattoodo.com",[297,298]],["jmonline.com.br",299],["atlas.workland.com",299],["virginexperiencedays.co.uk",299],["emag.berliner-woche.de",[300,301,302]],["nordkurier.de",[300,301,302]],["everest-24.pl",[303,304]],["operaneon.com",[305,306,307]],["abastible.cl",308],["sneakerfreaker.com",309],["cryptofalka.hu",309],["walmart.ca",310],["byfood.com",311],["andsafe.de",312],["edostavka.by",313],["emall.by",313],["ishoppurium.com",314],["baseblocks.tenereteam.com",315],["onexstore.pl",[316,317,318]],["revanced.app",318],["evropochta.by",[319,320]],["inselberlin.de",321],["gronkh.tv",322],["adfilteringdevsummit.com",323],["dailyrevs.com",324],["dsworks.ru",324],["daraz.com",325],["learngerman.dw.com",326],["leeway.tech",327],["gostanford.com",328],["namensetiketten.de",329],["drafthound.com",[330,331]],["wokularach.pl",332],["bidup.amtrak.com",333],["eschuhe.de",334],["zeglins.com",335],["flyingpapers.com",336],["beta.character.ai",[337,338]],["bittimittari.fi",339],["aida64.co.uk",[340,341]],["aida64.com.ua",[340,341]],["aida64.de",[340,341]],["aida64.hu",[340,341]],["aida64.it",[340,341]],["aida64russia.com",[340,341]],["116.ru",342],["14.ru",342],["161.ru",342],["164.ru",342],["173.ru",342],["178.ru",342],["26.ru",342],["29.ru",342],["35.ru",342],["43.ru",342],["45.ru",342],["48.ru",342],["51.ru",342],["53.ru",342],["56.ru",342],["59.ru",342],["60.ru",342],["63.ru",342],["68.ru",342],["71.ru",342],["72.ru",342],["74.ru",342],["76.ru",342],["86.ru",342],["89.ru",342],["93.ru",342],["chita.ru",342],["e1.ru",342],["fontanka.ru",342],["ircity.ru",342],["izh1.ru",342],["mgorsk.ru",342],["msk1.ru",342],["ngs.ru",342],["ngs22.ru",342],["ngs24.ru",342],["ngs42.ru",342],["ngs55.ru",342],["ngs70.ru",342],["nn.ru",342],["sochi1.ru",342],["sterlitamak1.ru",342],["tolyatty.ru",342],["ufa1.ru",342],["v1.ru",342],["vladivostok1.ru",342],["voronezh1.ru",342],["ya62.ru",342],["116117.fi",343],["pjspub.com",344],["autodude.dk",345],["autodude.fi",345],["autodude.no",345],["autodude.se",345],["valostore.fi",345],["valostore.no",345],["valostore.se",345],["vivantis.*",346],["vivantis-shop.at",346],["krasa.cz",346],["auf1.tv",347],["wesendit.com",348],["hatch.co",349],["haberturk.com",350],["spaseekers.com",351],["incomeshares.com",352],["surnamedb.com",354],["pizzadelight-menu.co.uk",355],["ioplus.nl",356],["lahella.fi",358],["healf.com",359]]);
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
