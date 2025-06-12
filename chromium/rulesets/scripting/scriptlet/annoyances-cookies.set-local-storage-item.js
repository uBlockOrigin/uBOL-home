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
const argsList = [["cookieConsent","granted"],["cookie_consent","no"],["psh:cookies-other","false"],["psh:cookies-seen","true"],["psh:cookies-social","true"],["cookiesAccepted","true"],["cookiePolicy","true"],["cookiesAccepted","yes"],["cookies_enabled","true"],["acceptedAllCookies","false"],["cookiePreference","essential"],["cookie-consent-banner","declined"],["allowed_cookies","true"],["cookie-consent","false"],["consents-analytics","false"],["vdk-required-enabled","true"],["vdk-iframe-enabled","true"],["vdk-status","accept"],["cookie_consent","granted"],["cookieBarVisible","false"],["HAS_AGREE_POLICY","true"],["cookie-accepted","1"],["CustomCookieBannerAcceptIntent","true"],["pc-cookie-accepted","true"],["pc-cookie-technical-accepted","true"],["cookie-consent","rejected"],["owf_agree_cookie_policy","true"],["cookieConsent","accepted"],["allowFunctionalCookies","false"],["cookieClosed","true"],["explicitCookieAccept-24149","true"],["keeper_cookie_consent","true"],["cookie_accepted","true"],["consentLevel","1"],["cookies-val","accepted"],["201805-policy|accepted","1"],["GDPR-fingerprint:accepted","true"],["CPCCookies","true"],["privacyModalSeen","true"],["LGPDconsent","1"],["isCookiePoliceAccepted","1"],["HAS_ACCEPTED_PRIVACY_POLICY","true"],["cookiesAceptadas","true"],["privacy.com.br","accepted"],["supabase-consent-ph","false"],["cookieConsent","essential"],["has-seen-ccpa-notice","true"],["wbx__cookieAccepted","true"],["show_cookies_popup","false"],["modal_cookies","1"],["trainingDataConsent","true"],["cookieConsent","false"],["zglobal_Acookie_optOut","3"],["cookie","true"],["cookies_view","true"],["gdprConsent","false"],["framerCookiesDismissed","true"],["vue-cookie-accept-decline-cookiePanel","accept"],["cookies-consent-accepted","true"],["user-cookies-setting","1"],["COOKIE_AUTHORITY_QUERY_V2","1"],["ignore_cookie_warn","true"],["CerezUyariGosterildi","true"],["cookies-product","NO"],["showCookies","NO"],["localConsent","true"],["acceptedCookies","true"],["isNotificationDisplayed","true"],["COOKIE_BANNER_CLICKED","true"],["cookies-eu-statistics","false"],["cookies-eu-necessary","true"],["cookieStatus","rejected"],["consent","true"],["cookiePreference","required"],["technikmuseum-required-enabled","true"],["ctu-cm-n","1"],["ctu-cm-a","0"],["ctu-cm-m","0"],["cookieAndRecommendsAgreement","true"],["cookiebanner-active","false"],["tracking-state-v2","deny"],["cookieConsent","true"],["202306151200.shown.production","true"],["consent","[]"],["cookiebanner:extMedia","false"],["cookiebanner:statistic","false"],["consentAccepted","true"],["marketingConsentAccepted","false"],["consentMode","1"],["uninavIsAgreeCookie","true"],["cookieConsent","denied"],["cookieChoice","rejected"],["adsAccepted","false"],["analyticsAccepted","false"],["analytics_gdpr_accept","yes"],["youtube_gdpr_accept","yes"],["Analytics:accepted","false"],["GDPR:accepted","true"],["cookie_usage_acknowledged_2","1"],["a_c","true"],["iag-targeting-consent","no"],["iag-performance-consent","no"],["userDeniedCookies","1"],["hasConsent","false"],["viewedCookieConsent","true"],["dnt_message_shown","1"],["necessaryConsent","true"],["marketingConsent","false"],["personalisationConsent","false"],["open_modal_update_policy","1"],["cookieinfo","1"],["cookies","1"],["cookieAccepted","true"],["necessary_cookie_confirmed","true"],["ccb_contao_token_1","1"],["cookies","0"],["cookies_accepted_6pzworitz8","true"],["rgpd.consent","1"],["_lukCookieAgree","2"],["cookiesAllowed","false"],["cookiePreference","1"],["artisan_acceptCookie","true"],["cookies_policy_acceptance","denied"],["SAFE__analyticsPreference","false"],["termsOfUseAccepted","true"],["agreeCookie","true"],["lgpd-agree","1"],["cookieIsAccepted","true"],["cookieAllowed","false"],["cookie_usage_accepted","1"],["cookieBannerShown","true"],["cookiesConsent","1"],["cookie_acceptance","true"],["analytics_cookies_acceptance","true"],["ns_cookies","1"],["gdpr","deny"],["c","false"],["cookies-preference","1"],["cookiesAcknowledged","1"],["hasConsentedPH","no"],["cookie_consent","accepted"],["gtag.consent.option","1"],["cps28","1"],["PrivacyPolicy[][core]","forbidden"],["PrivacyPolicy[][maps]","forbidden"],["PrivacyPolicy[][videos]","forever"],["PrivacyPolicy[][readSpeaker]","forbidden"],["PrivacyPolicy[][tracking]","forbidden"],["showCookieUse","false"],["terms","accepted"],["z_cookie_consent","true"],["StorageMartCookiesPolicySeen","true"],["bunq:CookieConsentStore:isBannerVisible","false"],["accepted-cookies","[]"],["ngx-webstorage|cookies","false"],["app_gdpr_consent","1"],["alreadyAcceptCookie","true"],["isCookiesAccepted","true"],["cookies","no"],["cookies-policy-accepted","true"],["cookie_prompt_times","1"],["last_prompt_time","1"],["sup_gdpr_cookie","accepted"],["gdpr_cookie","accepted"],["cn","true"],["consent_popup","1"],["COOKIE_CONSENT","false"],["cookie-consent-declined-version","1"],["Do-not-share","true"],["allow-cookies","false"],["__ph_opt_in_out_phc_9aSDbJCaDUMdZdHxxMPTvcj7A9fsl3mCgM1RBPmPsl7","0"],["should_display_cookie_banner_v2","false"],["zora-discover-14-03-23","false"],["connect-wallet-legal-consent","true"],["cookiesMin","1"],["cb-accept-cookie","true"],["cookie-permission","false"],["cookies","true"],["ROCUMENTS.cookieConsent","true"],["bcCookieAccepted","true"],["CMP:personalisation","1"],["pcClosedOnce","true"],["textshuttle_cookie","false"],["cookies-notification-message-is-hidden","true"],["cookieBanner","false"],["cookieBanner","true"],["banner","true"],["isAllowCookies","true"],["gtag_enabled","1"],["cvcConsentGiven","true"],["terms","true"],["cookie_accept","true"],["Pechinchou:CookiesModal","true"],["hub-cp","true"],["cookiePolicyAccepted","yes"],["cookie_usage_acknowledged_2","true"],["cookies_necessary_consent","true"],["cookies_marketing_consent","false"],["cookies_statistics_consent","false"],["wu.ccpa-toast-viewed","true"],["closed","true"],["dnt","1"],["dnt_a","1"],["makerz_allow_consentmgr","0"],["SHOW_COOKIE_BANNER","no"],["CookiesConsent","1"],["hasAnalyticalCookies","false"],["hasStrictlyNecessaryCookies","true"],["amCookieBarFirstShow","1"],["acceptedCookies","false"],["viewedCookieBanner","true"],["accept_all_cookies","false"],["isCookies","1"],["isCookie","Yes"],["cookieconsent_status","false"],["user_cookie","1"],["ka:4:legal-updates","true"],["cok","true"],["cookieMessage","true"],["soCookiesPolicy","1"],["GDPR:RBI:accepted","false"],["contao-privacy-center.hidden","1"],["cookie_consent","false"],["cookiesAgree","true"],["ytsc_accepted_cookies","true"],["safe-storage/v1/tracking-consent/trackingConsentMarketingKey","false"],["safe-storage/v1/tracking-consent/trackingConsentAdvertisingKey","false"],["safe-storage/v1/tracking-consent/trackingConsentAnalyticsKey","false"],["agreeToCookie","false"],["AI Alliance_ReactCookieAcceptance_hasSetCookies","true"],["firstVisit","false"],["2020-04-05","1"],["dismissed","true"],["SET_COOKIES_APPROVED","true"],["hasAcceptedCookies","true"],["isCookiesNotificationHidden","true"],["agreed-cookies","true"],["consentCookie","true"],["SWCOOKIESACC","1"],["hasAcceptedCookieNotice","true"],["fb-cookies-accepted","false"],["is_accept_cookie","true"],["accept-jove-cookie","1"],["cookie_consent_bar_value","true"],["pxdn_cookie_consent","true"],["akasha__cookiePolicy","true"],["QMOptIn","false"],["safe.global","false"],["cookie_banner:hidden","true"],["cookiesAccepted","false"],["accept_cookie_policy","true"],["cookies_accepted","true"],["cookies-selected","true"],["cookie-notice-dismissed","true"],["accepts-cookie-notice","true"],["dismissedPrivacyCookieMessage","1"],["allowCookies","allowed"],["cookie_consent","true"],["cookies_policy_status","true"],["cookies-accepted","true"],["allowCookies","true"],["cookie_consent","1"],["accepted-cookies","true"],["cookies-consent","0"],["cookieBannerRead","true"],["acceptCookie","0"],["cookieBannerReadDate","1"],["privacy-policy-accepted","true"],["accepted_cookies","true"],["accepted_cookie","true"],["cookie-consent","true"],["consentManager_shown","true"],["consent_necessary","true"],["consent_performance","false"],["cookie-closed","true"],["cookie-accepted","false"],["cookieConsent","1"],["enableCookieBanner","false"],["byFoodCookiePolicyRequire","false"],["ascookie--decision","true"],["isAcceptCookiesNew","true"],["isAcceptCookie","true"],["isAcceptCookie","false"],["marketing","false"],["technical","true","","reload","1"],["analytics","false"],["otherCookie","true"],["saveCookie","true"],["userAcceptsCookies","1"],["grnk-cookies-accepted","true"],["acceptCookies","no"],["acceptCookies","true"],["has-dismissed","1"],["hasAcceptedGdpr","true"],["lw-accepts-cookies","true"],["cookies-accept","true"],["load-scripts-v2","2"],["acceptsAnalyticsCookies","false"],["acceptsNecessaryCookies","true"],["display_cookie_modal","false"],["pg-accept-cookies","true"],["__EOBUWIE__consents_accepted","true","","reload","1"],["canada-cookie-acknowledge","1"],["FP_cookiesAccepted","true"],["VISITED_0","true"],["OPTIONAL_COOKIES_ACCEPTED_0","true"],["storagePermission","true"],["set_cookie_stat","false"],["set_cookie_tracking","false"],["UMP_CONSENT_NOTIFICATION","true"],["df-cookies-allowed","true"],["cookie-consent","1"],["userConsented","false"],["cookieConsent","necessary"],["gdpr-done","true"],["isTrackingAllowed","false"],["legalsAccepted","true"],["COOKIE_CONSENT_STATUS_4124","\"dismissed\""],["cookie-policy","approve"],["spaseekers:cookie-decision","accepted"],["policyAccepted","true"],["consentBannerLastShown","1"],["flipdish-cookies-preferences","necessary"],["consentInteraction","true"],["cookie-notice-accepted-version","1"],["cookieConsentGiven","1"]];
const hostnamesMap = new Map([["notthebee.com",0],["granola.ai",1],["polar.sh",1],["posthog.com",1],["hatchet.run",1],["nhnieuws.nl",[2,3,4]],["omroepbrabant.nl",[2,3,4]],["asianet.co.id",5],["netbank.avida.no",5],["bo3.gg",5],["gs1.se",[5,28]],["puregoldprotein.com",[5,92,93]],["spectrumtherapeutics.com",5],["thingtesting.com",5],["streamclipsgermany.de",5],["i-fundusze.pl",6],["improvethenews.org",6],["plente.com",6],["movies4us.*",6],["popcornmovies.to",6],["arkanium.serveminecraft.net",7],["bananacraft.serveminecraft.net",7],["myoffers.smartbuy.hdfcbank.com",8],["grass.io",[9,10]],["lustery.com",11],["ecoints.com",12],["emergetools.com",13],["receptagemini.pl",14],["bw.vdk.de",[15,16,17]],["search.odin.io",18],["gdh.digital",19],["popmart.com",20],["rozklady.bielsko.pl",21],["typeform.com",22],["erlus.com",[23,24]],["bettrfinancing.com",25],["sf-express.com",26],["min.io",27],["lemwarm.com",29],["form.fillout.com",30],["keepersecurity.com",31],["esto.eu",32],["ctol.digital",32],["beterbed.nl",33],["crt.hr",34],["code.likeagirl.io",35],["engineering.mixpanel.com",35],["betterprogramming.pub",35],["medium.com",35],["500ish.com",35],["gitconnected.com",35],["bettermarketing.pub",35],["diylifetech.com",35],["thebolditalic.com",35],["writingcooperative.com",35],["fanfare.pub",35],["betterhumans.pub",35],["fvd.nl",36],["cpc2r.ch",37],["metamask.io",38],["chavesnamao.com.br",39],["anhanguera.com",40],["bhaskar.com",41],["novaventa.com",42],["privacy.com.br",43],["supabase.com",44],["app.getgrass.io",45],["sanluisgarbage.com",46],["wildberries.ru",47],["cryptorank.io",48],["springmerchant.com",49],["veed.io",50],["deribit.com",51],["dorkgpt.com",51],["varusteleka.com",51],["zoho.com",52],["femibion.rs",53],["nove.fr",53],["metro1.com.br",53],["villagrancanaria.com",54],["baic.cz",55],["bunq.com",56],["framer.com",56],["inceptionlabs.ai",56],["zave.it",56],["tower.dev",56],["fleksberegner.dk",57],["duty.travel.cl",58],["solscan.io",59],["connorduffy.abundancerei.com",60],["bc.gamem",61],["akkushop-turkiye.com.tr",62],["k33.com",[63,64]],["komdigi.go.id",65],["fijiairways.com",66],["planner.kaboodle.co.nz",67],["pedalcommander.*",68],["sekisuialveo.com",[69,70]],["rightsize.dk",71],["random-group.olafneumann.org",72],["espadrij.com",73],["hygiene-shop.eu",73],["gesundheitsmanufaktur.de",[73,310]],["technikmuseum.berlin",74],["cvut.cz",[75,76,77]],["r-ulybka.ru",78],["voltadol.at",79],["evium.de",80],["hiring.amazon.com",81],["comnet.com.tr",81],["gpuscout.nl",81],["remanga.org",81],["parrotsec.org",81],["estrelabet.bet.br",81],["shonenjumpplus.com",82],["engeldirekt.de",83],["haleon-gebro.at",[84,85]],["happyplates.com",[86,87]],["ickonic.com",88],["abs-cbn.com",89],["news.abs-cbn.com",89],["opmaatzagen.nl",90],["mundwerk-rottweil.de",90],["sqlook.com",91],["adef-emploi.fr",[94,95]],["lumieresdelaville.net",[94,95]],["ccaf.io",[96,97]],["dbschenkerarkas.com.tr",98],["dbschenker-seino.jp",98],["dbschenker.com",[98,195]],["scinapse.io",99],["shop.ba.com",[100,101]],["uc.pt",102],["bennettrogers.mysight.uk",103],["snipp.gg",103],["leafly.com",104],["geizhals.at",105],["geizhals.de",105],["geizhals.eu",105],["cenowarka.pl",105],["skinflint.co.uk",105],["webhallen.com",[106,107,108]],["olx.com.br",109],["unobike.com",110],["mod.io",111],["passport-photo.online",112],["mojmaxtv.hrvatskitelekom.hr",112],["rodrigue-app.ct.ws",112],["tme.eu",113],["mein-osttirol.rocks",114],["tennessine.co.uk",115],["ultraleds.co.uk",116],["greubelforsey.com",117],["lukify.app",118],["studiobookr.com",119],["getgrass.io",120],["artisan.co",121],["mobilefuse.com",122],["safe.global",[123,247]],["data.carbonmapper.org",124],["avica.link",125],["madeiramadeira.com.br",126],["sberdisk.ru",127],["column.com",128],["iqoption.com",129],["dopesnow.com",130],["montecwear.com",130],["romeo.com",131],["sonyliv.com",[132,133]],["cwallet.com",134],["oneskin.co",135],["telemetr.io",136],["near.org",137],["near.ai",137],["dev.near.org",138],["jito.network",139],["jito.wtf",139],["goodpods.com",140],["pngtree.com",[141,142]],["rhein-pfalz-kreis.de",[143,144,145,146,147]],["idar-oberstein.de",[143,144,145,146]],["vogelsbergkreis.de",[143,144,145,146]],["v2.xmeye.net",148],["venom.foundation",149],["canonvannederland.nl",150],["my-account.storage-mart.com",151],["web.bunq.com",152],["lifesum.com",153],["home.shortcutssoftware.com",154],["klimwinkel.nl",155],["markimicrowave.com",156],["aerolineas.com.ar",157],["5sim.net",157],["fold.dev",158],["mojposao.hr",159],["temu.com",[160,161]],["supreme.com",[162,163]],["g-star.com",164],["sawren.pl",165],["ultrahuman.com",166],["optionsgroup.com",167],["withpersona.com",[168,169]],["trigger.dev",170],["core.app",[171,173]],["zora.co",172],["kokku-online.de",174],["cuba-buddy.de",175],["datamask.app",176],["humandataincome.com",176],["crealitycloud.com",177],["triumphtechnicalinformation.com",178],["businessclass.com",179],["livsstil.se",180],["schneidewind-immobilien.de",181],["textshuttle.com",182],["simpleswap.io",183],["wales.nhs.attendanywhere.com",184],["sacal.it",185],["astondevs.ru",186],["gonxt.com",187],["geomiq.com",188],["bbc.com",189],["galaxy.com",190],["ticketmelon.com",191],["pechinchou.com.br",192],["thehub21.com",193],["archiup.com",194],["autoride.cz",[196,197,198]],["autoride.es",[196,197,198]],["autoride.io",[196,197,198]],["autoride.sk",[196,197,198]],["wunderground.com",199],["baselime.io",200],["eversports.de",[201,202]],["makerz.me",203],["reebok.eu",204],["alfa.com.ec",205],["rts.com.ec",205],["tropicalida.com.ec",205],["owgr.com",[206,207]],["beermerchants.com",208],["saamexe.com",[209,210]],["helium.com",209],["blommerscoffee.shipping-portal.com",209],["app.bionic-reading.com",211],["nloto.ru",212],["swisstours.com",213],["librinova.com",214],["format.bike",215],["khanacademy.org",216],["etelecinema.hu",217],["konicaminolta.com",218],["soquest.xyz",219],["region-bayreuth.de",220],["bahnland-bayern.de",221],["eezy.nrw",221],["nationalexpress.de",221],["chipcitycookies.com",222],["6amgroup.com",222],["go.bkk.hu",222],["worldlibertyfinancial.com",222],["happiful.com",222],["bazaartracker.com",223],["subscribercounter.com",224],["app.klarna.com",[225,226,227]],["instantspoursoi.fr",228],["thealliance.ai",229],["librumreader.com",230],["visnos.com",231],["polypane.app",232],["changelly.com",233],["glose.com",234],["yellow.systems",235],["renebieder.com",236],["goodram.com",237],["starwalk.space",238],["vitotechnology.com",238],["codedead.com",239],["studiofabiobiesel.com",240],["fydeos.com",241],["fydeos.io",241],["jove.com",242],["argent.xyz",243],["pixeden.com",244],["akasha.org",245],["ashleyfurniture.com",246],["jibjab.com",248],["filmzie.com",249],["vietjetair.com",250],["kick.com",251],["cora-broodjes.nl",252],["jimdosite.com",252],["worstbassist.com",252],["evernote.com",[253,254,324]],["octopusenergy.co.jp",255],["findmcserver.com",256],["schneideranwaelte.de",257],["traefik.io",257],["cityfalcon.ai",258],["digitalparking.city",259],["mediathekviewweb.de",260],["solana.com",261],["ef.co.id",262],["alohafromdeer.com",263],["fwd.com",[264,266]],["everywhere.game",265],["geotastic.net",267],["garageproject.co.nz",268],["tattoodo.com",[268,269]],["jmonline.com.br",270],["atlas.workland.com",270],["virginexperiencedays.co.uk",270],["emag.berliner-woche.de",[271,272,273]],["nordkurier.de",[271,272,273]],["everest-24.pl",[274,275]],["sneakerfreaker.com",276],["cryptofalka.hu",276],["walmart.ca",277],["byfood.com",278],["andsafe.de",279],["edostavka.by",280],["emall.by",280],["ishoppurium.com",281],["baseblocks.tenereteam.com",282],["onexstore.pl",[283,284,285]],["revanced.app",285],["evropochta.by",[286,287]],["inselberlin.de",288],["gronkh.tv",289],["adfilteringdevsummit.com",290],["dailyrevs.com",291],["dsworks.ru",291],["daraz.com",292],["learngerman.dw.com",293],["leeway.tech",294],["gostanford.com",295],["namensetiketten.de",296],["drafthound.com",[297,298]],["wokularach.pl",299],["bidup.amtrak.com",300],["eschuhe.de",301],["zeglins.com",302],["flyingpapers.com",303],["beta.character.ai",[304,305]],["bittimittari.fi",306],["aida64.co.uk",[307,308]],["aida64.com.ua",[307,308]],["aida64.de",[307,308]],["aida64.hu",[307,308]],["aida64.it",[307,308]],["aida64russia.com",[307,308]],["116.ru",309],["14.ru",309],["161.ru",309],["164.ru",309],["173.ru",309],["178.ru",309],["26.ru",309],["29.ru",309],["35.ru",309],["43.ru",309],["45.ru",309],["48.ru",309],["51.ru",309],["53.ru",309],["56.ru",309],["59.ru",309],["60.ru",309],["63.ru",309],["68.ru",309],["71.ru",309],["72.ru",309],["74.ru",309],["76.ru",309],["86.ru",309],["89.ru",309],["93.ru",309],["chita.ru",309],["e1.ru",309],["fontanka.ru",309],["ircity.ru",309],["izh1.ru",309],["mgorsk.ru",309],["msk1.ru",309],["ngs.ru",309],["ngs22.ru",309],["ngs24.ru",309],["ngs42.ru",309],["ngs55.ru",309],["ngs70.ru",309],["nn.ru",309],["sochi1.ru",309],["sterlitamak1.ru",309],["tolyatty.ru",309],["ufa1.ru",309],["v1.ru",309],["vladivostok1.ru",309],["voronezh1.ru",309],["ya62.ru",309],["open24.ee",310],["116117.fi",311],["pjspub.com",312],["autodude.dk",313],["autodude.fi",313],["autodude.no",313],["autodude.se",313],["valostore.fi",313],["valostore.no",313],["valostore.se",313],["vivantis.*",314],["vivantis-shop.at",314],["krasa.cz",314],["auf1.tv",315],["wesendit.com",316],["hatch.co",317],["haberturk.com",318],["spaseekers.com",319],["incomeshares.com",320],["surnamedb.com",321],["pizzadelight-menu.co.uk",322],["ioplus.nl",323],["lahella.fi",325]]);
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
