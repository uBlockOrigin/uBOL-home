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
const argsList = [["cookieConsent","{}"],["anitrend_analytics_consent","denied"],["wbdLTP","true"],["CookieConsent--hideCookieConsent","true"],["consent","false"],["duckaiHasAgreedToTerms","true"],["areCookiesAccepted","true"],["cookieConsentV2","1"],["gdpr","0"],["room-welcome-ack-v1","1"],["COOKIE_CHECK","false"],["lscache-klbq-bucket-scceptCookie","true"],["analytics-consent","accepted"],["cookie-consent","\"denied\""],["cookieConsent","granted"],["Express.cookie_agreement_shown","true"],["cookies-agreed-sellers-external-HC","true"],["hide-legal","1"],["cookie_consent","denied"],["cookies-toast-shown","true"],["show_consent_modal","1"],["SITE_2609202-COOKIE-BANNER","1"],["COOKIE_CONSENT","no"],["cookie_consent","true"],["df-cookies-allowed","true"],["cookie_consent","no"],["mmkv.default\\ANONYMOUS_ACCEPT_COOKIE","true"],["isCookieAccepted","true"],["cookies-pref","[]"],["cookiesAccepted","false"],["store-cookie-consent","accepted"],["_ccpa_analytics","false"],["_ccpa_marketing","false"],["_ccpa_personal","false"],["psh:cookies-other","false"],["no-cookie-notice-dismissed","true"],["psh:cookies-seen","true"],["psh:cookies-social","true"],["cookiesAccepted","true"],["isAcceptedCookie","1"],["cookiePolicy","true"],["cookiesAccepted","yes"],["cookies_enabled","true"],["acceptedAllCookies","false"],["cookiePreference","essential"],["cookie-consent-banner","declined"],["allowed_cookies","true"],["cookie-consent","false"],["consents-analytics","false"],["vdk-required-enabled","true"],["vdk-iframe-enabled","true"],["vdk-status","accept"],["cookie_consent","granted"],["cookieBarVisible","false"],["HAS_AGREE_POLICY","true"],["cookie-accepted","1"],["CustomCookieBannerAcceptIntent","true"],["pc-cookie-accepted","true"],["pc-cookie-technical-accepted","true"],["cookieConsent","accepted"],["allowFunctionalCookies","false"],["cookieClosed","true"],["explicitCookieAccept-24149","true"],["keeper_cookie_consent","true"],["cookie_accepted","true"],["consentLevel","1"],["201805-policy|accepted","1"],["GDPR-fingerprint:accepted","true"],["CPCCookies","true"],["privacyModalSeen","true"],["LGPDconsent","1"],["isCookiePoliceAccepted","1"],["HAS_ACCEPTED_PRIVACY_POLICY","true"],["cookiesAceptadas","true"],["privacy.com.br","accepted"],["supabase-consent-ph","false"],["has-seen-ccpa-notice","true"],["wbx__cookieAccepted","true"],["show_cookies_popup","false"],["modal_cookies","1"],["trainingDataConsent","true"],["cookieConsent","false"],["zglobal_Acookie_optOut","3"],["cookie","true"],["cookies_view","true"],["gdprConsent","false"],["framerCookiesDismissed","true"],["vue-cookie-accept-decline-cookiePanel","accept"],["cookies-consent-accepted","true"],["user-cookies-setting","1"],["CerezUyariGosterildi","true"],["cookies-product","NO"],["showCookies","NO"],["localConsent","true"],["acceptedCookies","true"],["isNotificationDisplayed","true"],["COOKIE_BANNER_CLICKED","true"],["cookies-eu-statistics","false"],["cookies-eu-necessary","true"],["cookieStatus","rejected"],["consent","true"],["cookiePreference","required"],["technikmuseum-required-enabled","true"],["ctu-cm-n","1"],["ctu-cm-a","0"],["ctu-cm-m","0"],["cookieAndRecommendsAgreement","true"],["cookiebanner-active","false"],["tracking-state-v2","deny"],["cookieConsent","true"],["consent_accepted","true"],["202306151200.shown.production","true"],["consent","[]"],["cookiebanner:extMedia","false"],["cookiebanner:statistic","false"],["consentAccepted","true"],["marketingConsentAccepted","false"],["consentMode","1"],["uninavIsAgreeCookie","true"],["cookieConsent","denied"],["cookieChoice","rejected"],["adsAccepted","false"],["analyticsAccepted","false"],["analytics_gdpr_accept","yes"],["youtube_gdpr_accept","yes"],["Analytics:accepted","false"],["GDPR:accepted","true"],["cookie_usage_acknowledged_2","1"],["a_c","true"],["userDeniedCookies","1"],["hasConsent","false"],["viewedCookieConsent","true"],["dnt_message_shown","1"],["necessaryConsent","true"],["marketingConsent","false"],["personalisationConsent","false"],["open_modal_update_policy","1"],["cookieinfo","1"],["cookies","1"],["cookieAccepted","true"],["necessary_cookie_confirmed","true"],["ccb_contao_token_1","1"],["cookies","0"],["cookies_accepted_6pzworitz8","true"],["rgpd.consent","1"],["_lukCookieAgree","2"],["cookiesAllowed","false"],["artisan_acceptCookie","true"],["cookies_policy_acceptance","denied"],["SAFE__analyticsPreference","false"],["termsOfUseAccepted","true"],["lgpd-agree","1"],["cookieIsAccepted","true"],["cookieAllowed","false"],["cookie_usage_accepted","1"],["cookieBannerShown","true"],["cookiesConsent","1"],["cookie_acceptance","true"],["analytics_cookies_acceptance","true"],["ns_cookies","1"],["gdpr","deny"],["c","false"],["cookies-preference","1"],["cookiesAcknowledged","1"],["hasConsentedPH","no"],["cookie_consent","accepted"],["gtag.consent.option","1"],["cps28","1"],["PrivacyPolicy[][core]","forbidden"],["PrivacyPolicy[][maps]","forbidden"],["PrivacyPolicy[][videos]","forever"],["PrivacyPolicy[][readSpeaker]","forbidden"],["PrivacyPolicy[][tracking]","forbidden"],["showCookieUse","false"],["terms","accepted"],["z_cookie_consent","true"],["StorageMartCookiesPolicySeen","true"],["bunq:CookieConsentStore:isBannerVisible","false"],["accepted-cookies","[]"],["ngx-webstorage|cookies","false"],["app_gdpr_consent","1"],["alreadyAcceptCookie","true"],["isCookiesAccepted","true"],["cookies","no"],["cookies-policy-accepted","true"],["cookie_prompt_times","1"],["last_prompt_time","1"],["sup_gdpr_cookie","accepted"],["gdpr_cookie","accepted"],["cn","true"],["consent_popup","1"],["COOKIE_CONSENT","false"],["cookie-consent-declined-version","1"],["Do-not-share","true"],["allow-cookies","false"],["should_display_cookie_banner_v2","false"],["zora-discover-14-03-23","false"],["connect-wallet-legal-consent","true"],["cookiesMin","1"],["cb-accept-cookie","true"],["cookie-permission","false"],["cookies","true"],["ROCUMENTS.cookieConsent","true"],["bcCookieAccepted","true"],["pcClosedOnce","true"],["cookies-notification-message-is-hidden","true"],["cookieBanner","false"],["cookieBanner","true"],["banner","true"],["isAllowCookies","true"],["gtag_enabled","1"],["cvcConsentGiven","true"],["terms","true"],["cookie_accept","true"],["Pechinchou:CookiesModal","true"],["hub-cp","true"],["cookiePolicyAccepted","yes"],["cookie_usage_acknowledged_2","true"],["cookies_necessary_consent","true"],["cookies_marketing_consent","false"],["cookies_statistics_consent","false"],["wu.ccpa-toast-viewed","true"],["closed","true"],["dnt","1"],["dnt_a","1"],["makerz_allow_consentmgr","0"],["SHOW_COOKIE_BANNER","no"],["CookiesConsent","1"],["hasAnalyticalCookies","false"],["hasStrictlyNecessaryCookies","true"],["amCookieBarFirstShow","1"],["acceptedCookies","false"],["viewedCookieBanner","true"],["accept_all_cookies","false"],["isCookies","1"],["isCookie","Yes"],["cookieconsent_status","false"],["user_cookie","1"],["ka:4:legal-updates","true"],["cok","true"],["soCookiesPolicy","1"],["GDPR:RBI:accepted","false"],["contao-privacy-center.hidden","1"],["cookie_consent","false"],["cookiesAgree","true"],["ytsc_accepted_cookies","true"],["safe-storage/v1/tracking-consent/trackingConsentMarketingKey","false"],["safe-storage/v1/tracking-consent/trackingConsentAdvertisingKey","false"],["safe-storage/v1/tracking-consent/trackingConsentAnalyticsKey","false"],["agreeToCookie","false"],["AI Alliance_ReactCookieAcceptance_hasSetCookies","true"],["firstVisit","false"],["2020-04-05","1"],["dismissed","true"],["SET_COOKIES_APPROVED","true"],["hasAcceptedCookies","true"],["isCookiesNotificationHidden","true"],["agreed-cookies","true"],["consentCookie","true"],["SWCOOKIESACC","1"],["hasAcceptedCookieNotice","true"],["fb-cookies-accepted","false"],["is_accept_cookie","true"],["accept-jove-cookie","1"],["pxdn_cookie_consent","true"],["akasha__cookiePolicy","true"],["QMOptIn","false"],["safe.global","false"],["cookie_banner:hidden","true"],["accept_cookie_policy","true"],["cookies_accepted","true"],["cookies-selected","true"],["cookie-notice-dismissed","true"],["accepts-cookie-notice","true"],["dismissedPrivacyCookieMessage","1"],["allowCookies","allowed"],["cookies_policy_status","true"],["cookies-accepted","true"],["allowCookies","true"],["cookie_consent","1"],["accepted-cookies","true"],["cookies-consent","0"],["cookieBannerRead","true"],["cookieBannerReadDate","1"],["privacy-policy-accepted","true"],["accepted_cookies","true"],["accepted_cookie","true"],["cookie-consent","true"],["consentManager_shown","true"],["consent_necessary","true"],["consent_performance","false"],["cookie-closed","true"],["cookie-accepted","false"],["consent_analytics","false"],["consent_granted","true"],["consent_marketing","false"],["cookie-accepted","true"],["cookieConsent","1"],["enableCookieBanner","false"],["byFoodCookiePolicyRequire","false"],["ascookie--decision","true"],["isAcceptCookiesNew","true"],["isAcceptCookie","true"],["isAcceptCookie","false"],["analytics","false"],["otherCookie","true"],["saveCookie","true"],["userAcceptsCookies","1"],["grnk-cookies-accepted","true"],["acceptCookies","no"],["acceptCookies","true"],["has-dismissed","1"],["hasAcceptedGdpr","true"],["lw-accepts-cookies","true"],["cookies-accept","true"],["load-scripts-v2","2"],["acceptsAnalyticsCookies","false"],["acceptsNecessaryCookies","true"],["display_cookie_modal","false"],["pg-accept-cookies","true"],["__EOBUWIE__consents_accepted","true","","reload","1"],["canada-cookie-acknowledge","1"],["FP_cookiesAccepted","true"],["VISITED_0","true"],["OPTIONAL_COOKIES_ACCEPTED_0","true"],["storagePermission","true"],["set_cookie_stat","false"],["set_cookie_tracking","false"],["UMP_CONSENT_NOTIFICATION","true"],["cookie-consent","1"],["userConsented","false"],["cookieConsent","necessary"],["gdpr-done","true"],["isTrackingAllowed","false"],["legalsAccepted","true"],["COOKIE_CONSENT_STATUS_4124","\"dismissed\""],["cookie-policy","approve"],["spaseekers:cookie-decision","accepted"],["policyAccepted","true"],["PrivacyPolicy[][core]","forever"],["consentBannerLastShown","1"],["flipdish-cookies-preferences","necessary"],["consentInteraction","true"],["__MODIVO__consents_accepted","true"],["__MODIVO__hide_modal_consents","1"],["cookie-notice-accepted-version","1"],["cookieConsentGiven","1"],["cookie-banner-accepted","true"]];
const hostnamesMap = new Map([["rg.ru",0],["anitrend.co",1],["foodnetwork.com",2],["teamtailor.com",3],["dewesoft.com",4],["duckduckgo.com",5],["hospihousing.com",6],["mastersintime.com",7],["watch.co.uk",7],["inverto.tv",8],["theroom.lol",9],["titantvguide.com",10],["strinova.com",11],["thai-novel.com",12],["todoist.com",13],["notthebee.com",14],["bcs-express.ru",15],["seller.wildberries.ru",16],["wifiman.com",17],["vibeslist.ai",18],["mangalib.me",19],["anilib.me",19],["animelib.org",19],["hentailib.me",19],["hentailib.org",19],["mangalib.org",19],["ranobelib.me",19],["negrasport.pl",20],["pancernik.eu",[20,24]],["mobilelegends.com",21],["manuals.annafreud.org",22],["v3.ketogo.app",23],["ketogo.app",23],["schneideranwaelte.de",23],["traefik.io",23],["gesundheitsmanufaktur.de",[24,101]],["open24.ee",24],["granola.ai",25],["polar.sh",25],["posthog.com",25],["hatchet.run",25],["zeta-ai.io",26],["fiyat.mercedes-benz.com.tr",27],["sportbooking.info",28],["photo.codes",29],["filmzie.com",29],["granado.com.br",30],["sunnyside.shop",[31,32,33]],["nhnieuws.nl",[34,36,37]],["omroepbrabant.nl",[34,36,37]],["cape.co",35],["asianet.co.id",38],["p2p.land",38],["bo3.gg",38],["gs1.se",[38,60]],["puregoldprotein.com",[38,121,122]],["spectrumtherapeutics.com",38],["thingtesting.com",38],["streamclipsgermany.de",38],["kundenportal.harzenergie.de",38],["giselles.ai",39],["i-fundusze.pl",40],["plente.com",40],["movies4us.*",40],["arkanium.serveminecraft.net",41],["bananacraft.serveminecraft.net",41],["myoffers.smartbuy.hdfcbank.com",42],["grass.io",[43,44]],["lustery.com",45],["ecoints.com",46],["emergetools.com",47],["receptagemini.pl",48],["bw.vdk.de",[49,50,51]],["search.odin.io",52],["gdh.digital",53],["popmart.com",54],["rozklady.bielsko.pl",55],["typeform.com",56],["erlus.com",[57,58]],["min.io",59],["lemwarm.com",61],["form.fillout.com",62],["keepersecurity.com",63],["esto.eu",64],["ctol.digital",64],["beterbed.nl",65],["code.likeagirl.io",66],["betterprogramming.pub",66],["medium.com",66],["500ish.com",66],["gitconnected.com",66],["bettermarketing.pub",66],["diylifetech.com",66],["thebolditalic.com",66],["writingcooperative.com",66],["fanfare.pub",66],["betterhumans.pub",66],["fvd.nl",67],["cpc2r.ch",68],["metamask.io",69],["chavesnamao.com.br",70],["anhanguera.com",71],["bhaskar.com",72],["novaventa.com",73],["privacy.com.br",74],["supabase.com",75],["sanluisgarbage.com",76],["wildberries.ru",77],["cryptorank.io",78],["springmerchant.com",79],["veed.io",80],["deribit.com",81],["dorkgpt.com",81],["kyutai.org",81],["varusteleka.com",81],["lazyrecords.app",81],["unmute.sh",81],["zoho.com",82],["femibion.rs",83],["nove.fr",83],["metro1.com.br",83],["villagrancanaria.com",84],["baic.cz",85],["mollie.com",86],["bunq.com",86],["framer.com",86],["inceptionlabs.ai",86],["zave.it",86],["tower.dev",86],["fleksberegner.dk",87],["duty.travel.cl",88],["solscan.io",89],["akkushop-turkiye.com.tr",90],["k33.com",[91,92]],["komdigi.go.id",93],["fijiairways.com",94],["planner.kaboodle.co.nz",95],["pedalcommander.*",96],["sekisuialveo.com",[97,98]],["rightsize.dk",99],["random-group.olafneumann.org",100],["espadrij.com",101],["hygiene-shop.eu",101],["technikmuseum.berlin",102],["cvut.cz",[103,104,105]],["r-ulybka.ru",106],["voltadol.at",107],["evium.de",108],["hiring.amazon.com",109],["comnet.com.tr",109],["gpuscout.nl",109],["remanga.org",109],["parrotsec.org",109],["estrelabet.bet.br",109],["cricketgully.com",109],["paapiidesign.com",109],["reebokwork.com",110],["shonenjumpplus.com",111],["engeldirekt.de",112],["haleon-gebro.at",[113,114]],["happyplates.com",[115,116]],["ickonic.com",117],["abs-cbn.com",118],["news.abs-cbn.com",118],["opmaatzagen.nl",119],["mundwerk-rottweil.de",119],["sqlook.com",120],["adef-emploi.fr",[123,124]],["lumieresdelaville.net",[123,124]],["ccaf.io",[125,126]],["dbschenkerarkas.com.tr",127],["dbschenker-seino.jp",127],["dbschenker.com",[127,217]],["scinapse.io",128],["uc.pt",129],["bennettrogers.mysight.uk",130],["snipp.gg",130],["leafly.com",131],["geizhals.at",132],["geizhals.de",132],["geizhals.eu",132],["webhallen.com",[133,134,135]],["olx.com.br",136],["unobike.com",137],["mod.io",138],["passport-photo.online",139],["mojmaxtv.hrvatskitelekom.hr",139],["rodrigue-app.ct.ws",139],["tme.eu",140],["mein-osttirol.rocks",141],["tennessine.co.uk",142],["ultraleds.co.uk",143],["greubelforsey.com",144],["lukify.app",145],["studiobookr.com",146],["artisan.co",147],["mobilefuse.com",148],["safe.global",[149,267]],["data.carbonmapper.org",150],["madeiramadeira.com.br",151],["sberdisk.ru",152],["column.com",153],["iqoption.com",154],["dopesnow.com",155],["montecwear.com",155],["romeo.com",156],["sonyliv.com",[157,158]],["cwallet.com",159],["oneskin.co",160],["telemetr.io",161],["near.org",162],["near.ai",162],["dev.near.org",163],["jito.network",164],["jito.wtf",164],["goodpods.com",165],["pngtree.com",[166,167]],["rhein-pfalz-kreis.de",[168,169,170,171,172]],["idar-oberstein.de",[168,169,170,171]],["vogelsbergkreis.de",[168,169,170,171]],["chamaeleon.de",[170,339]],["v2.xmeye.net",173],["venom.foundation",174],["canonvannederland.nl",175],["my-account.storage-mart.com",176],["web.bunq.com",177],["lifesum.com",178],["home.shortcutssoftware.com",179],["klimwinkel.nl",180],["markimicrowave.com",181],["aerolineas.com.ar",182],["5sim.net",182],["fold.dev",183],["mojposao.hr",184],["temu.com",[185,186]],["supreme.com",[187,188]],["g-star.com",189],["sawren.pl",190],["ultrahuman.com",191],["optionsgroup.com",192],["withpersona.com",[193,194]],["core.app",[195,197]],["zora.co",196],["kokku-online.de",198],["cuba-buddy.de",199],["datamask.app",200],["humandataincome.com",200],["crealitycloud.com",201],["triumphtechnicalinformation.com",202],["businessclass.com",203],["schneidewind-immobilien.de",204],["simpleswap.io",205],["wales.nhs.attendanywhere.com",206],["anonpaste.pw",207],["sacal.it",207],["astondevs.ru",208],["gonxt.com",209],["geomiq.com",210],["bbc.com",211],["galaxy.com",212],["ticketmelon.com",213],["pechinchou.com.br",214],["thehub21.com",215],["archiup.com",216],["autoride.cz",[218,219,220]],["autoride.es",[218,219,220]],["autoride.io",[218,219,220]],["autoride.sk",[218,219,220]],["wunderground.com",221],["baselime.io",222],["eversports.de",[223,224]],["makerz.me",225],["reebok.eu",226],["alfa.com.ec",227],["rts.com.ec",227],["tropicalida.com.ec",227],["owgr.com",[228,229]],["beermerchants.com",230],["saamexe.com",[231,232]],["helium.com",231],["blommerscoffee.shipping-portal.com",231],["app.bionic-reading.com",233],["nloto.ru",234],["swisstours.com",235],["librinova.com",236],["format.bike",237],["khanacademy.org",238],["etelecinema.hu",239],["soquest.xyz",240],["region-bayreuth.de",241],["bahnland-bayern.de",242],["eezy.nrw",242],["nationalexpress.de",242],["chipcitycookies.com",243],["6amgroup.com",243],["go.bkk.hu",243],["worldlibertyfinancial.com",243],["happiful.com",243],["moondao.com",243],["bazaartracker.com",244],["subscribercounter.com",245],["app.klarna.com",[246,247,248]],["instantspoursoi.fr",249],["thealliance.ai",250],["librumreader.com",251],["visnos.com",252],["polypane.app",253],["changelly.com",254],["glose.com",255],["yellow.systems",256],["renebieder.com",257],["goodram.com",258],["starwalk.space",259],["vitotechnology.com",259],["codedead.com",260],["studiofabiobiesel.com",261],["fydeos.com",262],["fydeos.io",262],["jove.com",263],["pixeden.com",264],["akasha.org",265],["ashleyfurniture.com",266],["jibjab.com",268],["vietjetair.com",269],["kick.com",270],["cora-broodjes.nl",271],["jimdosite.com",271],["worstbassist.com",271],["evernote.com",[272,273,345]],["octopusenergy.co.jp",274],["findmcserver.com",275],["cityfalcon.ai",276],["digitalparking.city",277],["mediathekviewweb.de",278],["solana.com",279],["ef.co.id",280],["alohafromdeer.com",281],["fwd.com",[282,283]],["geotastic.net",284],["garageproject.co.nz",285],["tattoodo.com",[285,286]],["jmonline.com.br",287],["atlas.workland.com",287],["virginexperiencedays.co.uk",287],["emag.berliner-woche.de",[288,289,290]],["nordkurier.de",[288,289,290]],["everest-24.pl",[291,292]],["operaneon.com",[293,294,295]],["abastible.cl",296],["sneakerfreaker.com",297],["cryptofalka.hu",297],["walmart.ca",298],["byfood.com",299],["andsafe.de",300],["edostavka.by",301],["emall.by",301],["ishoppurium.com",302],["baseblocks.tenereteam.com",303],["revanced.app",304],["evropochta.by",[305,306]],["inselberlin.de",307],["gronkh.tv",308],["adfilteringdevsummit.com",309],["dailyrevs.com",310],["dsworks.ru",310],["daraz.com",311],["learngerman.dw.com",312],["leeway.tech",313],["gostanford.com",314],["namensetiketten.de",315],["drafthound.com",[316,317]],["wokularach.pl",318],["bidup.amtrak.com",319],["eschuhe.de",320],["zeglins.com",321],["flyingpapers.com",322],["beta.character.ai",[323,324]],["bittimittari.fi",325],["aida64.co.uk",[326,327]],["aida64.com.ua",[326,327]],["aida64.de",[326,327]],["aida64.hu",[326,327]],["aida64.it",[326,327]],["aida64russia.com",[326,327]],["116.ru",328],["14.ru",328],["161.ru",328],["164.ru",328],["173.ru",328],["178.ru",328],["26.ru",328],["29.ru",328],["35.ru",328],["43.ru",328],["45.ru",328],["48.ru",328],["51.ru",328],["53.ru",328],["56.ru",328],["59.ru",328],["60.ru",328],["63.ru",328],["68.ru",328],["71.ru",328],["72.ru",328],["74.ru",328],["76.ru",328],["86.ru",328],["89.ru",328],["93.ru",328],["chita.ru",328],["e1.ru",328],["fontanka.ru",328],["ircity.ru",328],["izh1.ru",328],["mgorsk.ru",328],["msk1.ru",328],["ngs.ru",328],["ngs22.ru",328],["ngs24.ru",328],["ngs42.ru",328],["ngs55.ru",328],["ngs70.ru",328],["nn.ru",328],["sochi1.ru",328],["sterlitamak1.ru",328],["tolyatty.ru",328],["ufa1.ru",328],["v1.ru",328],["vladivostok1.ru",328],["voronezh1.ru",328],["ya62.ru",328],["116117.fi",329],["pjspub.com",330],["autodude.dk",331],["autodude.fi",331],["autodude.no",331],["autodude.se",331],["valostore.fi",331],["valostore.no",331],["valostore.se",331],["vivantis.*",332],["vivantis-shop.at",332],["krasa.cz",332],["auf1.tv",333],["wesendit.com",334],["hatch.co",335],["haberturk.com",336],["spaseekers.com",337],["incomeshares.com",338],["surnamedb.com",340],["pizzadelight-menu.co.uk",341],["ioplus.nl",342],["modivo.*",[343,344]],["lahella.fi",346],["healf.com",347]]);
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
