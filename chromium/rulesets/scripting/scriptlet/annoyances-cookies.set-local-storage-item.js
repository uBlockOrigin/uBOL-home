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
const argsList = [["cookieConsent","granted"],["cookie_consent","no"],["psh:cookies-other","false"],["psh:cookies-seen","true"],["psh:cookies-social","true"],["cookiesAccepted","true"],["acceptedAllCookies","false"],["cookiePreference","essential"],["cookie-consent-banner","declined"],["allowed_cookies","true"],["cookie-consent","false"],["consents-analytics","false"],["vdk-required-enabled","true"],["vdk-iframe-enabled","true"],["vdk-status","accept"],["cookie_consent","granted"],["cookieBarVisible","false"],["HAS_AGREE_POLICY","true"],["cookie-accepted","1"],["CustomCookieBannerAcceptIntent","true"],["pc-cookie-accepted","true"],["pc-cookie-technical-accepted","true"],["cookie-consent","rejected"],["owf_agree_cookie_policy","true"],["cookieConsent","accepted"],["allowFunctionalCookies","false"],["cookieClosed","true"],["explicitCookieAccept-24149","true"],["keeper_cookie_consent","true"],["cookie_accepted","true"],["consentLevel","1"],["cookies-val","accepted"],["201805-policy|accepted","1"],["GDPR-fingerprint:accepted","true"],["CPCCookies","true"],["privacyModalSeen","true"],["LGPDconsent","1"],["isCookiePoliceAccepted","1"],["HAS_ACCEPTED_PRIVACY_POLICY","true"],["cookiesAceptadas","true"],["privacy.com.br","accepted"],["supabase-consent-ph","false"],["cookieConsent","essential"],["has-seen-ccpa-notice","true"],["wbx__cookieAccepted","true"],["show_cookies_popup","false"],["modal_cookies","1"],["trainingDataConsent","true"],["cookieConsent","false"],["zglobal_Acookie_optOut","3"],["cookie","true"],["cookiePolicy","true"],["cookies_view","true"],["gdprConsent","false"],["framerCookiesDismissed","true"],["vue-cookie-accept-decline-cookiePanel","accept"],["cookies-consent-accepted","true"],["user-cookies-setting","1"],["COOKIE_AUTHORITY_QUERY_V2","1"],["ignore_cookie_warn","true"],["CerezUyariGosterildi","true"],["cookies-product","NO"],["showCookies","NO"],["localConsent","true"],["acceptedCookies","true"],["isNotificationDisplayed","true"],["COOKIE_BANNER_CLICKED","true"],["cookies-eu-statistics","false"],["cookies-eu-necessary","true"],["cookieStatus","rejected"],["consent","true"],["cookiePreference","required"],["technikmuseum-required-enabled","true"],["ctu-cm-n","1"],["ctu-cm-a","0"],["ctu-cm-m","0"],["cookieAndRecommendsAgreement","true"],["cookiebanner-active","false"],["tracking-state-v2","deny"],["cookieConsent","true"],["202306151200.shown.production","true"],["consent","[]"],["cookiebanner:extMedia","false"],["cookiebanner:statistic","false"],["consentAccepted","true"],["marketingConsentAccepted","false"],["consentMode","1"],["uninavIsAgreeCookie","true"],["cookieConsent","denied"],["cookieChoice","rejected"],["adsAccepted","false"],["analyticsAccepted","false"],["analytics_gdpr_accept","yes"],["youtube_gdpr_accept","yes"],["Analytics:accepted","false"],["GDPR:accepted","true"],["cookie_usage_acknowledged_2","1"],["a_c","true"],["iag-targeting-consent","no"],["iag-performance-consent","no"],["userDeniedCookies","1"],["hasConsent","false"],["viewedCookieConsent","true"],["dnt_message_shown","1"],["necessaryConsent","true"],["marketingConsent","false"],["personalisationConsent","false"],["open_modal_update_policy","1"],["cookieinfo","1"],["cookies","1"],["cookieAccepted","true"],["necessary_cookie_confirmed","true"],["ccb_contao_token_1","1"],["cookies","0"],["cookies_accepted_6pzworitz8","true"],["rgpd.consent","1"],["_lukCookieAgree","2"],["cookiesAllowed","false"],["cookiePreference","1"],["artisan_acceptCookie","true"],["cookies_policy_acceptance","denied"],["SAFE__analyticsPreference","false"],["termsOfUseAccepted","true"],["agreeCookie","true"],["lgpd-agree","1"],["cookieIsAccepted","true"],["cookieAllowed","false"],["cookie_usage_accepted","1"],["cookieBannerShown","true"],["cookiesConsent","1"],["cookie_acceptance","true"],["analytics_cookies_acceptance","true"],["ns_cookies","1"],["gdpr","deny"],["c","false"],["cookies-preference","1"],["cookiesAcknowledged","1"],["hasConsentedPH","no"],["cookie_consent","accepted"],["gtag.consent.option","1"],["cps28","1"],["PrivacyPolicy[][core]","forbidden"],["PrivacyPolicy[][maps]","forbidden"],["PrivacyPolicy[][videos]","forever"],["PrivacyPolicy[][readSpeaker]","forbidden"],["PrivacyPolicy[][tracking]","forbidden"],["showCookieUse","false"],["terms","accepted"],["z_cookie_consent","true"],["StorageMartCookiesPolicySeen","true"],["bunq:CookieConsentStore:isBannerVisible","false"],["accepted-cookies","[]"],["ngx-webstorage|cookies","false"],["app_gdpr_consent","1"],["alreadyAcceptCookie","true"],["isCookiesAccepted","true"],["cookies","no"],["cookies-policy-accepted","true"],["cookie_prompt_times","1"],["last_prompt_time","1"],["sup_gdpr_cookie","accepted"],["gdpr_cookie","accepted"],["cn","true"],["consent_popup","1"],["COOKIE_CONSENT","false"],["cookie-consent-declined-version","1"],["Do-not-share","true"],["allow-cookies","false"],["__ph_opt_in_out_phc_9aSDbJCaDUMdZdHxxMPTvcj7A9fsl3mCgM1RBPmPsl7","0"],["should_display_cookie_banner_v2","false"],["zora-discover-14-03-23","false"],["connect-wallet-legal-consent","true"],["cookiesMin","1"],["cb-accept-cookie","true"],["cookie-permission","false"],["cookies","true"],["ROCUMENTS.cookieConsent","true"],["bcCookieAccepted","true"],["CMP:personalisation","1"],["pcClosedOnce","true"],["textshuttle_cookie","false"],["cookies-notification-message-is-hidden","true"],["cookieBanner","false"],["cookieBanner","true"],["banner","true"],["isAllowCookies","true"],["gtag_enabled","1"],["cvcConsentGiven","true"],["terms","true"],["cookie_accept","true"],["Pechinchou:CookiesModal","true"],["hub-cp","true"],["cookiePolicyAccepted","yes"],["cookie_usage_acknowledged_2","true"],["cookies_necessary_consent","true"],["cookies_marketing_consent","false"],["cookies_statistics_consent","false"],["wu.ccpa-toast-viewed","true"],["closed","true"],["dnt","1"],["dnt_a","1"],["makerz_allow_consentmgr","0"],["SHOW_COOKIE_BANNER","no"],["CookiesConsent","1"],["hasAnalyticalCookies","false"],["hasStrictlyNecessaryCookies","true"],["amCookieBarFirstShow","1"],["acceptedCookies","false"],["viewedCookieBanner","true"],["accept_all_cookies","false"],["isCookies","1"],["isCookie","Yes"],["cookieconsent_status","false"],["user_cookie","1"],["ka:4:legal-updates","true"],["cok","true"],["cookieMessage","true"],["soCookiesPolicy","1"],["GDPR:RBI:accepted","false"],["contao-privacy-center.hidden","1"],["cookie_consent","false"],["cookiesAgree","true"],["ytsc_accepted_cookies","true"],["safe-storage/v1/tracking-consent/trackingConsentMarketingKey","false"],["safe-storage/v1/tracking-consent/trackingConsentAdvertisingKey","false"],["safe-storage/v1/tracking-consent/trackingConsentAnalyticsKey","false"],["agreeToCookie","false"],["AI Alliance_ReactCookieAcceptance_hasSetCookies","true"],["firstVisit","false"],["2020-04-05","1"],["dismissed","true"],["SET_COOKIES_APPROVED","true"],["hasAcceptedCookies","true"],["isCookiesNotificationHidden","true"],["agreed-cookies","true"],["consentCookie","true"],["SWCOOKIESACC","1"],["hasAcceptedCookieNotice","true"],["fb-cookies-accepted","false"],["is_accept_cookie","true"],["accept-jove-cookie","1"],["cookie_consent_bar_value","true"],["pxdn_cookie_consent","true"],["akasha__cookiePolicy","true"],["QMOptIn","false"],["safe.global","false"],["cookie_banner:hidden","true"],["cookiesAccepted","false"],["accept_cookie_policy","true"],["cookies_accepted","true"],["cookies-selected","true"],["cookie-notice-dismissed","true"],["accepts-cookie-notice","true"],["dismissedPrivacyCookieMessage","1"],["allowCookies","allowed"],["cookie_consent","true"],["cookies_policy_status","true"],["cookies-accepted","true"],["allowCookies","true"],["cookie_consent","1"],["accepted-cookies","true"],["cookies-consent","0"],["cookieBannerRead","true"],["acceptCookie","0"],["cookieBannerReadDate","1"],["privacy-policy-accepted","true"],["accepted_cookies","true"],["accepted_cookie","true"],["cookie-consent","true"],["consentManager_shown","true"],["consent_necessary","true"],["consent_performance","false"],["cookie-closed","true"],["cookie-accepted","false"],["cookieConsent","1"],["enableCookieBanner","false"],["byFoodCookiePolicyRequire","false"],["ascookie--decision","true"],["isAcceptCookiesNew","true"],["isAcceptCookie","true"],["isAcceptCookie","false"],["marketing","false"],["technical","true","","reload","1"],["analytics","false"],["otherCookie","true"],["saveCookie","true"],["userAcceptsCookies","1"],["grnk-cookies-accepted","true"],["acceptCookies","no"],["acceptCookies","true"],["has-dismissed","1"],["hasAcceptedGdpr","true"],["lw-accepts-cookies","true"],["cookies-accept","true"],["load-scripts-v2","2"],["acceptsAnalyticsCookies","false"],["acceptsNecessaryCookies","true"],["display_cookie_modal","false"],["pg-accept-cookies","true"],["__EOBUWIE__consents_accepted","true","","reload","1"],["canada-cookie-acknowledge","1"],["FP_cookiesAccepted","true"],["VISITED_0","true"],["OPTIONAL_COOKIES_ACCEPTED_0","true"],["storagePermission","true"],["set_cookie_stat","false"],["set_cookie_tracking","false"],["UMP_CONSENT_NOTIFICATION","true"],["df-cookies-allowed","true"],["cookie-consent","1"],["userConsented","false"],["cookieConsent","necessary"],["gdpr-done","true"],["isTrackingAllowed","false"],["legalsAccepted","true"],["COOKIE_CONSENT_STATUS_4124","\"dismissed\""],["cookie-policy","approve"],["spaseekers:cookie-decision","accepted"],["policyAccepted","true"],["consentBannerLastShown","1"],["flipdish-cookies-preferences","necessary"],["consentInteraction","true"],["cookie-notice-accepted-version","1"],["cookieConsentGiven","1"]];
const hostnamesMap = new Map([["notthebee.com",0],["granola.ai",1],["polar.sh",1],["posthog.com",1],["hatchet.run",1],["nhnieuws.nl",[2,3,4]],["omroepbrabant.nl",[2,3,4]],["asianet.co.id",5],["netbank.avida.no",5],["bo3.gg",5],["gs1.se",[5,25]],["puregoldprotein.com",[5,90,91]],["spectrumtherapeutics.com",5],["thingtesting.com",5],["streamclipsgermany.de",5],["grass.io",[6,7]],["lustery.com",8],["ecoints.com",9],["emergetools.com",10],["receptagemini.pl",11],["bw.vdk.de",[12,13,14]],["search.odin.io",15],["gdh.digital",16],["popmart.com",17],["rozklady.bielsko.pl",18],["typeform.com",19],["erlus.com",[20,21]],["bettrfinancing.com",22],["sf-express.com",23],["min.io",24],["lemwarm.com",26],["form.fillout.com",27],["keepersecurity.com",28],["esto.eu",29],["ctol.digital",29],["beterbed.nl",30],["crt.hr",31],["code.likeagirl.io",32],["engineering.mixpanel.com",32],["betterprogramming.pub",32],["medium.com",32],["500ish.com",32],["gitconnected.com",32],["bettermarketing.pub",32],["diylifetech.com",32],["thebolditalic.com",32],["writingcooperative.com",32],["fanfare.pub",32],["betterhumans.pub",32],["fvd.nl",33],["cpc2r.ch",34],["metamask.io",35],["chavesnamao.com.br",36],["anhanguera.com",37],["bhaskar.com",38],["novaventa.com",39],["privacy.com.br",40],["supabase.com",41],["app.getgrass.io",42],["sanluisgarbage.com",43],["wildberries.ru",44],["cryptorank.io",45],["springmerchant.com",46],["veed.io",47],["deribit.com",48],["dorkgpt.com",48],["varusteleka.com",48],["zoho.com",49],["femibion.rs",50],["nove.fr",50],["metro1.com.br",50],["improvethenews.org",51],["plente.com",51],["movies4us.*",51],["popcornmovies.to",51],["villagrancanaria.com",52],["baic.cz",53],["bunq.com",54],["framer.com",54],["inceptionlabs.ai",54],["zave.it",54],["tower.dev",54],["fleksberegner.dk",55],["duty.travel.cl",56],["solscan.io",57],["connorduffy.abundancerei.com",58],["bc.gamem",59],["akkushop-turkiye.com.tr",60],["k33.com",[61,62]],["komdigi.go.id",63],["fijiairways.com",64],["planner.kaboodle.co.nz",65],["pedalcommander.*",66],["sekisuialveo.com",[67,68]],["rightsize.dk",69],["random-group.olafneumann.org",70],["espadrij.com",71],["hygiene-shop.eu",71],["gesundheitsmanufaktur.de",[71,308]],["technikmuseum.berlin",72],["cvut.cz",[73,74,75]],["r-ulybka.ru",76],["voltadol.at",77],["evium.de",78],["hiring.amazon.com",79],["comnet.com.tr",79],["gpuscout.nl",79],["remanga.org",79],["parrotsec.org",79],["estrelabet.bet.br",79],["shonenjumpplus.com",80],["engeldirekt.de",81],["haleon-gebro.at",[82,83]],["happyplates.com",[84,85]],["ickonic.com",86],["abs-cbn.com",87],["news.abs-cbn.com",87],["opmaatzagen.nl",88],["mundwerk-rottweil.de",88],["sqlook.com",89],["adef-emploi.fr",[92,93]],["lumieresdelaville.net",[92,93]],["ccaf.io",[94,95]],["dbschenkerarkas.com.tr",96],["dbschenker-seino.jp",96],["dbschenker.com",[96,193]],["scinapse.io",97],["shop.ba.com",[98,99]],["uc.pt",100],["bennettrogers.mysight.uk",101],["snipp.gg",101],["leafly.com",102],["geizhals.at",103],["geizhals.de",103],["geizhals.eu",103],["cenowarka.pl",103],["skinflint.co.uk",103],["webhallen.com",[104,105,106]],["olx.com.br",107],["unobike.com",108],["mod.io",109],["passport-photo.online",110],["mojmaxtv.hrvatskitelekom.hr",110],["rodrigue-app.ct.ws",110],["tme.eu",111],["mein-osttirol.rocks",112],["tennessine.co.uk",113],["ultraleds.co.uk",114],["greubelforsey.com",115],["lukify.app",116],["studiobookr.com",117],["getgrass.io",118],["artisan.co",119],["mobilefuse.com",120],["safe.global",[121,245]],["data.carbonmapper.org",122],["avica.link",123],["madeiramadeira.com.br",124],["sberdisk.ru",125],["column.com",126],["iqoption.com",127],["dopesnow.com",128],["montecwear.com",128],["romeo.com",129],["sonyliv.com",[130,131]],["cwallet.com",132],["oneskin.co",133],["telemetr.io",134],["near.org",135],["near.ai",135],["dev.near.org",136],["jito.network",137],["jito.wtf",137],["goodpods.com",138],["pngtree.com",[139,140]],["rhein-pfalz-kreis.de",[141,142,143,144,145]],["idar-oberstein.de",[141,142,143,144]],["vogelsbergkreis.de",[141,142,143,144]],["v2.xmeye.net",146],["venom.foundation",147],["canonvannederland.nl",148],["my-account.storage-mart.com",149],["web.bunq.com",150],["lifesum.com",151],["home.shortcutssoftware.com",152],["klimwinkel.nl",153],["markimicrowave.com",154],["aerolineas.com.ar",155],["5sim.net",155],["fold.dev",156],["mojposao.hr",157],["temu.com",[158,159]],["supreme.com",[160,161]],["g-star.com",162],["sawren.pl",163],["ultrahuman.com",164],["optionsgroup.com",165],["withpersona.com",[166,167]],["trigger.dev",168],["core.app",[169,171]],["zora.co",170],["kokku-online.de",172],["cuba-buddy.de",173],["datamask.app",174],["humandataincome.com",174],["crealitycloud.com",175],["triumphtechnicalinformation.com",176],["businessclass.com",177],["livsstil.se",178],["schneidewind-immobilien.de",179],["textshuttle.com",180],["simpleswap.io",181],["wales.nhs.attendanywhere.com",182],["sacal.it",183],["astondevs.ru",184],["gonxt.com",185],["geomiq.com",186],["bbc.com",187],["galaxy.com",188],["ticketmelon.com",189],["pechinchou.com.br",190],["thehub21.com",191],["archiup.com",192],["autoride.cz",[194,195,196]],["autoride.es",[194,195,196]],["autoride.io",[194,195,196]],["autoride.sk",[194,195,196]],["wunderground.com",197],["baselime.io",198],["eversports.de",[199,200]],["makerz.me",201],["reebok.eu",202],["alfa.com.ec",203],["rts.com.ec",203],["tropicalida.com.ec",203],["owgr.com",[204,205]],["beermerchants.com",206],["saamexe.com",[207,208]],["helium.com",207],["blommerscoffee.shipping-portal.com",207],["app.bionic-reading.com",209],["nloto.ru",210],["swisstours.com",211],["librinova.com",212],["format.bike",213],["khanacademy.org",214],["etelecinema.hu",215],["konicaminolta.com",216],["soquest.xyz",217],["region-bayreuth.de",218],["bahnland-bayern.de",219],["eezy.nrw",219],["nationalexpress.de",219],["chipcitycookies.com",220],["6amgroup.com",220],["go.bkk.hu",220],["worldlibertyfinancial.com",220],["happiful.com",220],["bazaartracker.com",221],["subscribercounter.com",222],["app.klarna.com",[223,224,225]],["instantspoursoi.fr",226],["thealliance.ai",227],["librumreader.com",228],["visnos.com",229],["polypane.app",230],["changelly.com",231],["glose.com",232],["yellow.systems",233],["renebieder.com",234],["goodram.com",235],["starwalk.space",236],["vitotechnology.com",236],["codedead.com",237],["studiofabiobiesel.com",238],["fydeos.com",239],["fydeos.io",239],["jove.com",240],["argent.xyz",241],["pixeden.com",242],["akasha.org",243],["ashleyfurniture.com",244],["jibjab.com",246],["filmzie.com",247],["vietjetair.com",248],["kick.com",249],["cora-broodjes.nl",250],["jimdosite.com",250],["worstbassist.com",250],["evernote.com",[251,252,322]],["octopusenergy.co.jp",253],["findmcserver.com",254],["schneideranwaelte.de",255],["traefik.io",255],["cityfalcon.ai",256],["digitalparking.city",257],["mediathekviewweb.de",258],["solana.com",259],["ef.co.id",260],["alohafromdeer.com",261],["fwd.com",[262,264]],["everywhere.game",263],["geotastic.net",265],["garageproject.co.nz",266],["tattoodo.com",[266,267]],["jmonline.com.br",268],["atlas.workland.com",268],["virginexperiencedays.co.uk",268],["emag.berliner-woche.de",[269,270,271]],["nordkurier.de",[269,270,271]],["everest-24.pl",[272,273]],["sneakerfreaker.com",274],["cryptofalka.hu",274],["walmart.ca",275],["byfood.com",276],["andsafe.de",277],["edostavka.by",278],["emall.by",278],["ishoppurium.com",279],["baseblocks.tenereteam.com",280],["onexstore.pl",[281,282,283]],["revanced.app",283],["evropochta.by",[284,285]],["inselberlin.de",286],["gronkh.tv",287],["adfilteringdevsummit.com",288],["dailyrevs.com",289],["dsworks.ru",289],["daraz.com",290],["learngerman.dw.com",291],["leeway.tech",292],["gostanford.com",293],["namensetiketten.de",294],["drafthound.com",[295,296]],["wokularach.pl",297],["bidup.amtrak.com",298],["eschuhe.de",299],["zeglins.com",300],["flyingpapers.com",301],["beta.character.ai",[302,303]],["bittimittari.fi",304],["aida64.co.uk",[305,306]],["aida64.com.ua",[305,306]],["aida64.de",[305,306]],["aida64.hu",[305,306]],["aida64.it",[305,306]],["aida64russia.com",[305,306]],["116.ru",307],["14.ru",307],["161.ru",307],["164.ru",307],["173.ru",307],["178.ru",307],["26.ru",307],["29.ru",307],["35.ru",307],["43.ru",307],["45.ru",307],["48.ru",307],["51.ru",307],["53.ru",307],["56.ru",307],["59.ru",307],["60.ru",307],["63.ru",307],["68.ru",307],["71.ru",307],["72.ru",307],["74.ru",307],["76.ru",307],["86.ru",307],["89.ru",307],["93.ru",307],["chita.ru",307],["e1.ru",307],["fontanka.ru",307],["ircity.ru",307],["izh1.ru",307],["mgorsk.ru",307],["msk1.ru",307],["ngs.ru",307],["ngs22.ru",307],["ngs24.ru",307],["ngs42.ru",307],["ngs55.ru",307],["ngs70.ru",307],["nn.ru",307],["sochi1.ru",307],["sterlitamak1.ru",307],["tolyatty.ru",307],["ufa1.ru",307],["v1.ru",307],["vladivostok1.ru",307],["voronezh1.ru",307],["ya62.ru",307],["open24.ee",308],["116117.fi",309],["pjspub.com",310],["autodude.dk",311],["autodude.fi",311],["autodude.no",311],["autodude.se",311],["valostore.fi",311],["valostore.no",311],["valostore.se",311],["vivantis.*",312],["vivantis-shop.at",312],["krasa.cz",312],["auf1.tv",313],["wesendit.com",314],["hatch.co",315],["haberturk.com",316],["spaseekers.com",317],["incomeshares.com",318],["surnamedb.com",319],["pizzadelight-menu.co.uk",320],["ioplus.nl",321],["lahella.fi",323]]);
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
