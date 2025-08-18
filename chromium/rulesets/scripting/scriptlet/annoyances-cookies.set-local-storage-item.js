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
const argsList = [["CookieConsent--hideCookieConsent","true"],["consent","false"],["cookieConsent","granted"],["cookies-toast-shown","true"],["show_consent_modal","1"],["SITE_2609202-COOKIE-BANNER","1"],["COOKIE_CONSENT","no"],["cookie_consent","true"],["df-cookies-allowed","true"],["cookie_consent","no"],["mmkv.default\\ANONYMOUS_ACCEPT_COOKIE","true"],["isCookieAccepted","true"],["cookies-pref","[]"],["cookiesAccepted","false"],["store-cookie-consent","accepted"],["_ccpa_analytics","false"],["_ccpa_marketing","false"],["_ccpa_personal","false"],["psh:cookies-other","false"],["no-cookie-notice-dismissed","true"],["psh:cookies-seen","true"],["psh:cookies-social","true"],["cookiesAccepted","true"],["isAcceptedCookie","1"],["cookiePolicy","true"],["cookiesAccepted","yes"],["cookies_enabled","true"],["acceptedAllCookies","false"],["cookiePreference","essential"],["cookie-consent-banner","declined"],["allowed_cookies","true"],["cookie-consent","false"],["consents-analytics","false"],["vdk-required-enabled","true"],["vdk-iframe-enabled","true"],["vdk-status","accept"],["cookie_consent","granted"],["cookieBarVisible","false"],["HAS_AGREE_POLICY","true"],["cookie-accepted","1"],["CustomCookieBannerAcceptIntent","true"],["pc-cookie-accepted","true"],["pc-cookie-technical-accepted","true"],["cookie-consent","rejected"],["owf_agree_cookie_policy","true"],["cookieConsent","accepted"],["allowFunctionalCookies","false"],["cookieClosed","true"],["explicitCookieAccept-24149","true"],["keeper_cookie_consent","true"],["cookie_accepted","true"],["consentLevel","1"],["cookies-val","accepted"],["201805-policy|accepted","1"],["GDPR-fingerprint:accepted","true"],["CPCCookies","true"],["privacyModalSeen","true"],["LGPDconsent","1"],["isCookiePoliceAccepted","1"],["HAS_ACCEPTED_PRIVACY_POLICY","true"],["cookiesAceptadas","true"],["privacy.com.br","accepted"],["supabase-consent-ph","false"],["cookieConsent","essential"],["has-seen-ccpa-notice","true"],["wbx__cookieAccepted","true"],["show_cookies_popup","false"],["modal_cookies","1"],["trainingDataConsent","true"],["cookieConsent","false"],["zglobal_Acookie_optOut","3"],["cookie","true"],["cookies_view","true"],["gdprConsent","false"],["framerCookiesDismissed","true"],["vue-cookie-accept-decline-cookiePanel","accept"],["cookies-consent-accepted","true"],["user-cookies-setting","1"],["COOKIE_AUTHORITY_QUERY_V2","1"],["ignore_cookie_warn","true"],["CerezUyariGosterildi","true"],["cookies-product","NO"],["showCookies","NO"],["localConsent","true"],["acceptedCookies","true"],["isNotificationDisplayed","true"],["COOKIE_BANNER_CLICKED","true"],["cookies-eu-statistics","false"],["cookies-eu-necessary","true"],["cookieStatus","rejected"],["consent","true"],["cookiePreference","required"],["technikmuseum-required-enabled","true"],["ctu-cm-n","1"],["ctu-cm-a","0"],["ctu-cm-m","0"],["cookieAndRecommendsAgreement","true"],["cookiebanner-active","false"],["tracking-state-v2","deny"],["cookieConsent","true"],["202306151200.shown.production","true"],["consent","[]"],["cookiebanner:extMedia","false"],["cookiebanner:statistic","false"],["consentAccepted","true"],["marketingConsentAccepted","false"],["consentMode","1"],["uninavIsAgreeCookie","true"],["cookieConsent","denied"],["cookieChoice","rejected"],["adsAccepted","false"],["analyticsAccepted","false"],["analytics_gdpr_accept","yes"],["youtube_gdpr_accept","yes"],["Analytics:accepted","false"],["GDPR:accepted","true"],["cookie_usage_acknowledged_2","1"],["a_c","true"],["iag-targeting-consent","no"],["iag-performance-consent","no"],["userDeniedCookies","1"],["hasConsent","false"],["viewedCookieConsent","true"],["dnt_message_shown","1"],["necessaryConsent","true"],["marketingConsent","false"],["personalisationConsent","false"],["open_modal_update_policy","1"],["cookieinfo","1"],["cookies","1"],["cookieAccepted","true"],["necessary_cookie_confirmed","true"],["ccb_contao_token_1","1"],["cookies","0"],["cookies_accepted_6pzworitz8","true"],["rgpd.consent","1"],["_lukCookieAgree","2"],["cookiesAllowed","false"],["cookiePreference","1"],["artisan_acceptCookie","true"],["cookies_policy_acceptance","denied"],["SAFE__analyticsPreference","false"],["termsOfUseAccepted","true"],["agreeCookie","true"],["lgpd-agree","1"],["cookieIsAccepted","true"],["cookieAllowed","false"],["cookie_usage_accepted","1"],["cookieBannerShown","true"],["cookiesConsent","1"],["cookie_acceptance","true"],["analytics_cookies_acceptance","true"],["ns_cookies","1"],["gdpr","deny"],["c","false"],["cookies-preference","1"],["cookiesAcknowledged","1"],["hasConsentedPH","no"],["cookie_consent","accepted"],["gtag.consent.option","1"],["cps28","1"],["PrivacyPolicy[][core]","forbidden"],["PrivacyPolicy[][maps]","forbidden"],["PrivacyPolicy[][videos]","forever"],["PrivacyPolicy[][readSpeaker]","forbidden"],["PrivacyPolicy[][tracking]","forbidden"],["showCookieUse","false"],["terms","accepted"],["z_cookie_consent","true"],["StorageMartCookiesPolicySeen","true"],["bunq:CookieConsentStore:isBannerVisible","false"],["accepted-cookies","[]"],["ngx-webstorage|cookies","false"],["app_gdpr_consent","1"],["alreadyAcceptCookie","true"],["isCookiesAccepted","true"],["cookies","no"],["cookies-policy-accepted","true"],["cookie_prompt_times","1"],["last_prompt_time","1"],["sup_gdpr_cookie","accepted"],["gdpr_cookie","accepted"],["cn","true"],["consent_popup","1"],["COOKIE_CONSENT","false"],["cookie-consent-declined-version","1"],["Do-not-share","true"],["allow-cookies","false"],["__ph_opt_in_out_phc_9aSDbJCaDUMdZdHxxMPTvcj7A9fsl3mCgM1RBPmPsl7","0"],["should_display_cookie_banner_v2","false"],["zora-discover-14-03-23","false"],["connect-wallet-legal-consent","true"],["cookiesMin","1"],["cb-accept-cookie","true"],["cookie-permission","false"],["cookies","true"],["ROCUMENTS.cookieConsent","true"],["bcCookieAccepted","true"],["CMP:personalisation","1"],["pcClosedOnce","true"],["textshuttle_cookie","false"],["cookies-notification-message-is-hidden","true"],["cookieBanner","false"],["cookieBanner","true"],["banner","true"],["isAllowCookies","true"],["gtag_enabled","1"],["cvcConsentGiven","true"],["terms","true"],["cookie_accept","true"],["Pechinchou:CookiesModal","true"],["hub-cp","true"],["cookiePolicyAccepted","yes"],["cookie_usage_acknowledged_2","true"],["cookies_necessary_consent","true"],["cookies_marketing_consent","false"],["cookies_statistics_consent","false"],["wu.ccpa-toast-viewed","true"],["closed","true"],["dnt","1"],["dnt_a","1"],["makerz_allow_consentmgr","0"],["SHOW_COOKIE_BANNER","no"],["CookiesConsent","1"],["hasAnalyticalCookies","false"],["hasStrictlyNecessaryCookies","true"],["amCookieBarFirstShow","1"],["acceptedCookies","false"],["viewedCookieBanner","true"],["accept_all_cookies","false"],["isCookies","1"],["isCookie","Yes"],["cookieconsent_status","false"],["user_cookie","1"],["ka:4:legal-updates","true"],["cok","true"],["cookieMessage","true"],["soCookiesPolicy","1"],["GDPR:RBI:accepted","false"],["contao-privacy-center.hidden","1"],["cookie_consent","false"],["cookiesAgree","true"],["ytsc_accepted_cookies","true"],["safe-storage/v1/tracking-consent/trackingConsentMarketingKey","false"],["safe-storage/v1/tracking-consent/trackingConsentAdvertisingKey","false"],["safe-storage/v1/tracking-consent/trackingConsentAnalyticsKey","false"],["agreeToCookie","false"],["AI Alliance_ReactCookieAcceptance_hasSetCookies","true"],["firstVisit","false"],["2020-04-05","1"],["dismissed","true"],["SET_COOKIES_APPROVED","true"],["hasAcceptedCookies","true"],["isCookiesNotificationHidden","true"],["agreed-cookies","true"],["consentCookie","true"],["SWCOOKIESACC","1"],["hasAcceptedCookieNotice","true"],["fb-cookies-accepted","false"],["is_accept_cookie","true"],["accept-jove-cookie","1"],["cookie_consent_bar_value","true"],["pxdn_cookie_consent","true"],["akasha__cookiePolicy","true"],["QMOptIn","false"],["safe.global","false"],["cookie_banner:hidden","true"],["accept_cookie_policy","true"],["cookies_accepted","true"],["cookies-selected","true"],["cookie-notice-dismissed","true"],["accepts-cookie-notice","true"],["dismissedPrivacyCookieMessage","1"],["allowCookies","allowed"],["cookies_policy_status","true"],["cookies-accepted","true"],["allowCookies","true"],["cookie_consent","1"],["accepted-cookies","true"],["cookies-consent","0"],["cookieBannerRead","true"],["acceptCookie","0"],["cookieBannerReadDate","1"],["privacy-policy-accepted","true"],["accepted_cookies","true"],["accepted_cookie","true"],["cookie-consent","true"],["consentManager_shown","true"],["consent_necessary","true"],["consent_performance","false"],["cookie-closed","true"],["cookie-accepted","false"],["cookieConsent","1"],["enableCookieBanner","false"],["byFoodCookiePolicyRequire","false"],["ascookie--decision","true"],["isAcceptCookiesNew","true"],["isAcceptCookie","true"],["isAcceptCookie","false"],["marketing","false"],["technical","true","","reload","1"],["analytics","false"],["otherCookie","true"],["saveCookie","true"],["userAcceptsCookies","1"],["grnk-cookies-accepted","true"],["acceptCookies","no"],["acceptCookies","true"],["has-dismissed","1"],["hasAcceptedGdpr","true"],["lw-accepts-cookies","true"],["cookies-accept","true"],["load-scripts-v2","2"],["acceptsAnalyticsCookies","false"],["acceptsNecessaryCookies","true"],["display_cookie_modal","false"],["pg-accept-cookies","true"],["__EOBUWIE__consents_accepted","true","","reload","1"],["canada-cookie-acknowledge","1"],["FP_cookiesAccepted","true"],["VISITED_0","true"],["OPTIONAL_COOKIES_ACCEPTED_0","true"],["storagePermission","true"],["set_cookie_stat","false"],["set_cookie_tracking","false"],["UMP_CONSENT_NOTIFICATION","true"],["cookie-consent","1"],["userConsented","false"],["cookieConsent","necessary"],["gdpr-done","true"],["isTrackingAllowed","false"],["legalsAccepted","true"],["COOKIE_CONSENT_STATUS_4124","\"dismissed\""],["cookie-policy","approve"],["spaseekers:cookie-decision","accepted"],["policyAccepted","true"],["PrivacyPolicy[][core]","forever"],["consentBannerLastShown","1"],["flipdish-cookies-preferences","necessary"],["consentInteraction","true"],["cookie-notice-accepted-version","1"],["cookieConsentGiven","1"],["cookie-banner-accepted","true"]];
const hostnamesMap = new Map([["teamtailor.com",0],["dewesoft.com",1],["notthebee.com",2],["mangalib.me",3],["anilib.me",3],["animelib.org",3],["hentailib.me",3],["hentailib.org",3],["mangalib.org",3],["ranobelib.me",3],["negrasport.pl",4],["pancernik.eu",[4,8]],["mobilelegends.com",5],["manuals.annafreud.org",6],["ketogo.app",7],["schneideranwaelte.de",7],["traefik.io",7],["gesundheitsmanufaktur.de",[8,91]],["open24.ee",8],["granola.ai",9],["polar.sh",9],["posthog.com",9],["hatchet.run",9],["zeta-ai.io",10],["fiyat.mercedes-benz.com.tr",11],["sportbooking.info",12],["photo.codes",13],["filmzie.com",13],["granado.com.br",14],["sunnyside.shop",[15,16,17]],["nhnieuws.nl",[18,20,21]],["omroepbrabant.nl",[18,20,21]],["cape.co",19],["asianet.co.id",22],["p2p.land",22],["netbank.avida.no",22],["bo3.gg",22],["gs1.se",[22,46]],["puregoldprotein.com",[22,110,111]],["spectrumtherapeutics.com",22],["thingtesting.com",22],["streamclipsgermany.de",22],["kundenportal.harzenergie.de",22],["giselles.ai",23],["i-fundusze.pl",24],["improvethenews.org",24],["plente.com",24],["movies4us.*",24],["popcornmovies.to",24],["arkanium.serveminecraft.net",25],["bananacraft.serveminecraft.net",25],["myoffers.smartbuy.hdfcbank.com",26],["grass.io",[27,28]],["lustery.com",29],["ecoints.com",30],["emergetools.com",31],["receptagemini.pl",32],["bw.vdk.de",[33,34,35]],["search.odin.io",36],["gdh.digital",37],["popmart.com",38],["rozklady.bielsko.pl",39],["typeform.com",40],["erlus.com",[41,42]],["bettrfinancing.com",43],["sf-express.com",44],["min.io",45],["lemwarm.com",47],["form.fillout.com",48],["keepersecurity.com",49],["esto.eu",50],["ctol.digital",50],["beterbed.nl",51],["crt.hr",52],["code.likeagirl.io",53],["engineering.mixpanel.com",53],["betterprogramming.pub",53],["medium.com",53],["500ish.com",53],["gitconnected.com",53],["bettermarketing.pub",53],["diylifetech.com",53],["thebolditalic.com",53],["writingcooperative.com",53],["fanfare.pub",53],["betterhumans.pub",53],["fvd.nl",54],["cpc2r.ch",55],["metamask.io",56],["chavesnamao.com.br",57],["anhanguera.com",58],["bhaskar.com",59],["novaventa.com",60],["privacy.com.br",61],["supabase.com",62],["app.getgrass.io",63],["sanluisgarbage.com",64],["wildberries.ru",65],["cryptorank.io",66],["springmerchant.com",67],["veed.io",68],["deribit.com",69],["dorkgpt.com",69],["kyutai.org",69],["varusteleka.com",69],["lazyrecords.app",69],["unmute.sh",69],["zoho.com",70],["femibion.rs",71],["nove.fr",71],["metro1.com.br",71],["villagrancanaria.com",72],["baic.cz",73],["bunq.com",74],["framer.com",74],["inceptionlabs.ai",74],["zave.it",74],["tower.dev",74],["fleksberegner.dk",75],["duty.travel.cl",76],["solscan.io",77],["connorduffy.abundancerei.com",78],["bc.gamem",79],["akkushop-turkiye.com.tr",80],["k33.com",[81,82]],["komdigi.go.id",83],["fijiairways.com",84],["planner.kaboodle.co.nz",85],["pedalcommander.*",86],["sekisuialveo.com",[87,88]],["rightsize.dk",89],["random-group.olafneumann.org",90],["espadrij.com",91],["hygiene-shop.eu",91],["technikmuseum.berlin",92],["cvut.cz",[93,94,95]],["r-ulybka.ru",96],["voltadol.at",97],["evium.de",98],["hiring.amazon.com",99],["comnet.com.tr",99],["gpuscout.nl",99],["remanga.org",99],["parrotsec.org",99],["estrelabet.bet.br",99],["shonenjumpplus.com",100],["engeldirekt.de",101],["haleon-gebro.at",[102,103]],["happyplates.com",[104,105]],["ickonic.com",106],["abs-cbn.com",107],["news.abs-cbn.com",107],["opmaatzagen.nl",108],["mundwerk-rottweil.de",108],["sqlook.com",109],["adef-emploi.fr",[112,113]],["lumieresdelaville.net",[112,113]],["ccaf.io",[114,115]],["dbschenkerarkas.com.tr",116],["dbschenker-seino.jp",116],["dbschenker.com",[116,213]],["scinapse.io",117],["shop.ba.com",[118,119]],["uc.pt",120],["bennettrogers.mysight.uk",121],["snipp.gg",121],["leafly.com",122],["geizhals.at",123],["geizhals.de",123],["geizhals.eu",123],["cenowarka.pl",123],["skinflint.co.uk",123],["webhallen.com",[124,125,126]],["olx.com.br",127],["unobike.com",128],["mod.io",129],["passport-photo.online",130],["mojmaxtv.hrvatskitelekom.hr",130],["rodrigue-app.ct.ws",130],["tme.eu",131],["mein-osttirol.rocks",132],["tennessine.co.uk",133],["ultraleds.co.uk",134],["greubelforsey.com",135],["lukify.app",136],["studiobookr.com",137],["getgrass.io",138],["artisan.co",139],["mobilefuse.com",140],["safe.global",[141,265]],["data.carbonmapper.org",142],["avica.link",143],["madeiramadeira.com.br",144],["sberdisk.ru",145],["column.com",146],["iqoption.com",147],["dopesnow.com",148],["montecwear.com",148],["romeo.com",149],["sonyliv.com",[150,151]],["cwallet.com",152],["oneskin.co",153],["telemetr.io",154],["near.org",155],["near.ai",155],["dev.near.org",156],["jito.network",157],["jito.wtf",157],["goodpods.com",158],["pngtree.com",[159,160]],["rhein-pfalz-kreis.de",[161,162,163,164,165]],["idar-oberstein.de",[161,162,163,164]],["vogelsbergkreis.de",[161,162,163,164]],["chamaeleon.de",[163,336]],["v2.xmeye.net",166],["venom.foundation",167],["canonvannederland.nl",168],["my-account.storage-mart.com",169],["web.bunq.com",170],["lifesum.com",171],["home.shortcutssoftware.com",172],["klimwinkel.nl",173],["markimicrowave.com",174],["aerolineas.com.ar",175],["5sim.net",175],["fold.dev",176],["mojposao.hr",177],["temu.com",[178,179]],["supreme.com",[180,181]],["g-star.com",182],["sawren.pl",183],["ultrahuman.com",184],["optionsgroup.com",185],["withpersona.com",[186,187]],["trigger.dev",188],["core.app",[189,191]],["zora.co",190],["kokku-online.de",192],["cuba-buddy.de",193],["datamask.app",194],["humandataincome.com",194],["crealitycloud.com",195],["triumphtechnicalinformation.com",196],["businessclass.com",197],["livsstil.se",198],["schneidewind-immobilien.de",199],["textshuttle.com",200],["simpleswap.io",201],["wales.nhs.attendanywhere.com",202],["sacal.it",203],["astondevs.ru",204],["gonxt.com",205],["geomiq.com",206],["bbc.com",207],["galaxy.com",208],["ticketmelon.com",209],["pechinchou.com.br",210],["thehub21.com",211],["archiup.com",212],["autoride.cz",[214,215,216]],["autoride.es",[214,215,216]],["autoride.io",[214,215,216]],["autoride.sk",[214,215,216]],["wunderground.com",217],["baselime.io",218],["eversports.de",[219,220]],["makerz.me",221],["reebok.eu",222],["alfa.com.ec",223],["rts.com.ec",223],["tropicalida.com.ec",223],["owgr.com",[224,225]],["beermerchants.com",226],["saamexe.com",[227,228]],["helium.com",227],["blommerscoffee.shipping-portal.com",227],["app.bionic-reading.com",229],["nloto.ru",230],["swisstours.com",231],["librinova.com",232],["format.bike",233],["khanacademy.org",234],["etelecinema.hu",235],["konicaminolta.com",236],["soquest.xyz",237],["region-bayreuth.de",238],["bahnland-bayern.de",239],["eezy.nrw",239],["nationalexpress.de",239],["sumupbookings.com",240],["chipcitycookies.com",240],["6amgroup.com",240],["go.bkk.hu",240],["worldlibertyfinancial.com",240],["happiful.com",240],["bazaartracker.com",241],["subscribercounter.com",242],["app.klarna.com",[243,244,245]],["instantspoursoi.fr",246],["thealliance.ai",247],["librumreader.com",248],["visnos.com",249],["polypane.app",250],["changelly.com",251],["glose.com",252],["yellow.systems",253],["renebieder.com",254],["goodram.com",255],["starwalk.space",256],["vitotechnology.com",256],["codedead.com",257],["studiofabiobiesel.com",258],["fydeos.com",259],["fydeos.io",259],["jove.com",260],["argent.xyz",261],["pixeden.com",262],["akasha.org",263],["ashleyfurniture.com",264],["jibjab.com",266],["vietjetair.com",267],["kick.com",268],["cora-broodjes.nl",269],["jimdosite.com",269],["worstbassist.com",269],["evernote.com",[270,271,340]],["octopusenergy.co.jp",272],["findmcserver.com",273],["cityfalcon.ai",274],["digitalparking.city",275],["mediathekviewweb.de",276],["solana.com",277],["ef.co.id",278],["alohafromdeer.com",279],["fwd.com",[280,282]],["everywhere.game",281],["geotastic.net",283],["garageproject.co.nz",284],["tattoodo.com",[284,285]],["jmonline.com.br",286],["atlas.workland.com",286],["virginexperiencedays.co.uk",286],["emag.berliner-woche.de",[287,288,289]],["nordkurier.de",[287,288,289]],["everest-24.pl",[290,291]],["sneakerfreaker.com",292],["cryptofalka.hu",292],["walmart.ca",293],["byfood.com",294],["andsafe.de",295],["edostavka.by",296],["emall.by",296],["ishoppurium.com",297],["baseblocks.tenereteam.com",298],["onexstore.pl",[299,300,301]],["revanced.app",301],["evropochta.by",[302,303]],["inselberlin.de",304],["gronkh.tv",305],["adfilteringdevsummit.com",306],["dailyrevs.com",307],["dsworks.ru",307],["daraz.com",308],["learngerman.dw.com",309],["leeway.tech",310],["gostanford.com",311],["namensetiketten.de",312],["drafthound.com",[313,314]],["wokularach.pl",315],["bidup.amtrak.com",316],["eschuhe.de",317],["zeglins.com",318],["flyingpapers.com",319],["beta.character.ai",[320,321]],["bittimittari.fi",322],["aida64.co.uk",[323,324]],["aida64.com.ua",[323,324]],["aida64.de",[323,324]],["aida64.hu",[323,324]],["aida64.it",[323,324]],["aida64russia.com",[323,324]],["116.ru",325],["14.ru",325],["161.ru",325],["164.ru",325],["173.ru",325],["178.ru",325],["26.ru",325],["29.ru",325],["35.ru",325],["43.ru",325],["45.ru",325],["48.ru",325],["51.ru",325],["53.ru",325],["56.ru",325],["59.ru",325],["60.ru",325],["63.ru",325],["68.ru",325],["71.ru",325],["72.ru",325],["74.ru",325],["76.ru",325],["86.ru",325],["89.ru",325],["93.ru",325],["chita.ru",325],["e1.ru",325],["fontanka.ru",325],["ircity.ru",325],["izh1.ru",325],["mgorsk.ru",325],["msk1.ru",325],["ngs.ru",325],["ngs22.ru",325],["ngs24.ru",325],["ngs42.ru",325],["ngs55.ru",325],["ngs70.ru",325],["nn.ru",325],["sochi1.ru",325],["sterlitamak1.ru",325],["tolyatty.ru",325],["ufa1.ru",325],["v1.ru",325],["vladivostok1.ru",325],["voronezh1.ru",325],["ya62.ru",325],["116117.fi",326],["pjspub.com",327],["autodude.dk",328],["autodude.fi",328],["autodude.no",328],["autodude.se",328],["valostore.fi",328],["valostore.no",328],["valostore.se",328],["vivantis.*",329],["vivantis-shop.at",329],["krasa.cz",329],["auf1.tv",330],["wesendit.com",331],["hatch.co",332],["haberturk.com",333],["spaseekers.com",334],["incomeshares.com",335],["surnamedb.com",337],["pizzadelight-menu.co.uk",338],["ioplus.nl",339],["lahella.fi",341],["healf.com",342]]);
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
