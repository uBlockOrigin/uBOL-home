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
const argsList = [["cookieConsent","granted"],["cookie_consent","no"],["psh:cookies-other","false"],["psh:cookies-seen","true"],["psh:cookies-social","true"],["consents-analytics","false"],["vdk-required-enabled","true"],["vdk-iframe-enabled","true"],["vdk-status","accept"],["cookiesAccepted","true"],["cookieBarVisible","false"],["cookie-accepted","1"],["CustomCookieBannerAcceptIntent","true"],["pc-cookie-accepted","true"],["pc-cookie-technical-accepted","true"],["cookie-consent","rejected"],["owf_agree_cookie_policy","true"],["cookieConsent","accepted"],["allowFunctionalCookies","false"],["cookieClosed","true"],["explicitCookieAccept-24149","true"],["keeper_cookie_consent","true"],["cookie_accepted","true"],["consentLevel","1"],["cookies-val","accepted"],["201805-policy|accepted","1"],["GDPR-fingerprint:accepted","true"],["CPCCookies","true"],["privacyModalSeen","true"],["LGPDconsent","1"],["isCookiePoliceAccepted","1"],["HAS_ACCEPTED_PRIVACY_POLICY","true"],["cookiesAceptadas","true"],["privacy.com.br","accepted"],["supabase-consent-ph","false"],["cookieConsent","essential"],["has-seen-ccpa-notice","true"],["wbx__cookieAccepted","true"],["show_cookies_popup","false"],["modal_cookies","1"],["trainingDataConsent","true"],["cookieConsent","false"],["zglobal_Acookie_optOut","3"],["cookie","true"],["cookiePolicy","true"],["cookies_view","true"],["gdprConsent","false"],["framerCookiesDismissed","true"],["vue-cookie-accept-decline-cookiePanel","accept"],["cookies-consent-accepted","true"],["user-cookies-setting","1"],["COOKIE_AUTHORITY_QUERY_V2","1"],["ignore_cookie_warn","true"],["CerezUyariGosterildi","true"],["cookies-product","NO"],["showCookies","NO"],["localConsent","true"],["acceptedCookies","true"],["isNotificationDisplayed","true"],["COOKIE_BANNER_CLICKED","true"],["cookies-eu-statistics","false"],["cookies-eu-necessary","true"],["cookieStatus","rejected"],["consent","true"],["cookiePreference","required"],["technikmuseum-required-enabled","true"],["ctu-cm-n","1"],["ctu-cm-a","0"],["ctu-cm-m","0"],["cookieAndRecommendsAgreement","true"],["cookiebanner-active","false"],["tracking-state-v2","deny"],["cookieConsent","true"],["202306151200.shown.production","true"],["consent","[]"],["cookiebanner:extMedia","false"],["cookiebanner:statistic","false"],["consentAccepted","true"],["marketingConsentAccepted","false"],["consentMode","1"],["uninavIsAgreeCookie","true"],["cookieConsent","denied"],["cookieChoice","rejected"],["adsAccepted","false"],["analyticsAccepted","false"],["analytics_gdpr_accept","yes"],["youtube_gdpr_accept","yes"],["Analytics:accepted","false"],["GDPR:accepted","true"],["cookie_usage_acknowledged_2","1"],["a_c","true"],["iag-targeting-consent","no"],["iag-performance-consent","no"],["userDeniedCookies","1"],["hasConsent","false"],["viewedCookieConsent","true"],["dnt_message_shown","1"],["necessaryConsent","true"],["marketingConsent","false"],["personalisationConsent","false"],["open_modal_update_policy","1"],["cookieinfo","1"],["cookies","1"],["cookieAccepted","true"],["necessary_cookie_confirmed","true"],["ccb_contao_token_1","1"],["cookies","0"],["cookies_accepted_6pzworitz8","true"],["rgpd.consent","1"],["_lukCookieAgree","2"],["cookiesAllowed","false"],["cookiePreference","1"],["artisan_acceptCookie","true"],["cookies_policy_acceptance","denied"],["SAFE__analyticsPreference","false"],["termsOfUseAccepted","true"],["agreeCookie","true"],["lgpd-agree","1"],["cookieIsAccepted","true"],["cookieAllowed","false"],["cookie_usage_accepted","1"],["cookieBannerShown","true"],["cookiesConsent","1"],["cookie_acceptance","true"],["analytics_cookies_acceptance","true"],["ns_cookies","1"],["gdpr","deny"],["c","false"],["cookies-preference","1"],["cookiesAcknowledged","1"],["hasConsentedPH","no"],["cookie_consent","accepted"],["gtag.consent.option","1"],["cps28","1"],["PrivacyPolicy[][core]","forbidden"],["PrivacyPolicy[][maps]","forbidden"],["PrivacyPolicy[][videos]","forever"],["PrivacyPolicy[][readSpeaker]","forbidden"],["showCookieUse","false"],["terms","accepted"],["z_cookie_consent","true"],["StorageMartCookiesPolicySeen","true"],["bunq:CookieConsentStore:isBannerVisible","false"],["accepted-cookies","[]"],["ngx-webstorage|cookies","false"],["app_gdpr_consent","1"],["alreadyAcceptCookie","true"],["isCookiesAccepted","true"],["cookies","no"],["cookies-policy-accepted","true"],["cookie_prompt_times","1"],["last_prompt_time","1"],["sup_gdpr_cookie","accepted"],["gdpr_cookie","accepted"],["cn","true"],["consent_popup","1"],["COOKIE_CONSENT","false"],["cookie-consent-declined-version","1"],["Do-not-share","true"],["allow-cookies","false"],["__ph_opt_in_out_phc_9aSDbJCaDUMdZdHxxMPTvcj7A9fsl3mCgM1RBPmPsl7","0"],["should_display_cookie_banner_v2","false"],["zora-discover-14-03-23","false"],["connect-wallet-legal-consent","true"],["cookiesMin","1"],["cb-accept-cookie","true"],["cookie-permission","false"],["cookies","true"],["ROCUMENTS.cookieConsent","true"],["bcCookieAccepted","true"],["CMP:personalisation","1"],["pcClosedOnce","true"],["textshuttle_cookie","false"],["cookies-notification-message-is-hidden","true"],["cookieBanner","false"],["cookieBanner","true"],["banner","true"],["isAllowCookies","true"],["gtag_enabled","1"],["cvcConsentGiven","true"],["terms","true"],["cookie_accept","true"],["Pechinchou:CookiesModal","true"],["hub-cp","true"],["cookiePolicyAccepted","yes"],["cookie_usage_acknowledged_2","true"],["cookies_necessary_consent","true"],["cookies_marketing_consent","false"],["cookies_statistics_consent","false"],["wu.ccpa-toast-viewed","true"],["closed","true"],["dnt","1"],["dnt_a","1"],["makerz_allow_consentmgr","0"],["SHOW_COOKIE_BANNER","no"],["CookiesConsent","1"],["hasAnalyticalCookies","false"],["hasStrictlyNecessaryCookies","true"],["amCookieBarFirstShow","1"],["acceptedCookies","false"],["viewedCookieBanner","true"],["accept_all_cookies","false"],["isCookies","1"],["isCookie","Yes"],["cookieconsent_status","false"],["user_cookie","1"],["ka:4:legal-updates","true"],["cok","true"],["cookieMessage","true"],["soCookiesPolicy","1"],["GDPR:RBI:accepted","false"],["contao-privacy-center.hidden","1"],["cookie_consent","false"],["cookiesAgree","true"],["ytsc_accepted_cookies","true"],["safe-storage/v1/tracking-consent/trackingConsentMarketingKey","false"],["safe-storage/v1/tracking-consent/trackingConsentAdvertisingKey","false"],["safe-storage/v1/tracking-consent/trackingConsentAnalyticsKey","false"],["agreeToCookie","false"],["AI Alliance_ReactCookieAcceptance_hasSetCookies","true"],["firstVisit","false"],["2020-04-05","1"],["dismissed","true"],["SET_COOKIES_APPROVED","true"],["hasAcceptedCookies","true"],["isCookiesNotificationHidden","true"],["agreed-cookies","true"],["consentCookie","true"],["SWCOOKIESACC","1"],["hasAcceptedCookieNotice","true"],["fb-cookies-accepted","false"],["is_accept_cookie","true"],["accept-jove-cookie","1"],["cookie_consent_bar_value","true"],["pxdn_cookie_consent","true"],["akasha__cookiePolicy","true"],["QMOptIn","false"],["safe.global","false"],["cookie_banner:hidden","true"],["cookiesAccepted","false"],["accept_cookie_policy","true"],["cookies_accepted","true"],["cookies-selected","true"],["cookie-notice-dismissed","true"],["accepts-cookie-notice","true"],["dismissedPrivacyCookieMessage","1"],["allowCookies","allowed"],["cookie_consent","true"],["cookies_policy_status","true"],["cookies-accepted","true"],["allowCookies","true"],["cookie_consent","1"],["accepted-cookies","true"],["cookies-consent","0"],["cookieBannerRead","true"],["acceptCookie","0"],["cookieBannerReadDate","1"],["privacy-policy-accepted","true"],["accepted_cookies","true"],["accepted_cookie","true"],["cookie-consent","true"],["consentManager_shown","true"],["consent_necessary","true"],["consent_performance","false"],["cookie-closed","true"],["cookie-accepted","false"],["cookieConsent","1"],["enableCookieBanner","false"],["byFoodCookiePolicyRequire","false"],["ascookie--decision","true"],["isAcceptCookiesNew","true"],["isAcceptCookie","true"],["isAcceptCookie","false"],["marketing","false"],["technical","true","","reload","1"],["analytics","false"],["otherCookie","true"],["saveCookie","true"],["userAcceptsCookies","1"],["grnk-cookies-accepted","true"],["acceptCookies","no"],["acceptCookies","true"],["has-dismissed","1"],["hasAcceptedGdpr","true"],["lw-accepts-cookies","true"],["cookies-accept","true"],["load-scripts-v2","2"],["acceptsAnalyticsCookies","false"],["acceptsNecessaryCookies","true"],["display_cookie_modal","false"],["pg-accept-cookies","true"],["__EOBUWIE__consents_accepted","true","","reload","1"],["canada-cookie-acknowledge","1"],["FP_cookiesAccepted","true"],["VISITED_0","true"],["OPTIONAL_COOKIES_ACCEPTED_0","true"],["storagePermission","true"],["set_cookie_stat","false"],["set_cookie_tracking","false"],["UMP_CONSENT_NOTIFICATION","true"],["df-cookies-allowed","true"],["cookie-consent","1"],["userConsented","false"],["cookieConsent","necessary"],["gdpr-done","true"],["isTrackingAllowed","false"],["legalsAccepted","true"],["COOKIE_CONSENT_STATUS_4124","\"dismissed\""],["cookie-policy","approve"],["spaseekers:cookie-decision","accepted"],["policyAccepted","true"],["consentBannerLastShown","1"],["flipdish-cookies-preferences","necessary"],["consentInteraction","true"],["cookie-notice-accepted-version","1"],["cookieConsentGiven","1"]];
const hostnamesMap = new Map([["notthebee.com",0],["granola.ai",1],["polar.sh",1],["posthog.com",1],["nhnieuws.nl",[2,3,4]],["omroepbrabant.nl",[2,3,4]],["receptagemini.pl",5],["bw.vdk.de",[6,7,8]],["netbank.avida.no",9],["bo3.gg",9],["gs1.se",[9,18]],["puregoldprotein.com",[9,83,84]],["spectrumtherapeutics.com",9],["thingtesting.com",9],["streamclipsgermany.de",9],["gdh.digital",10],["rozklady.bielsko.pl",11],["typeform.com",12],["erlus.com",[13,14]],["bettrfinancing.com",15],["sf-express.com",16],["min.io",17],["lemwarm.com",19],["form.fillout.com",20],["keepersecurity.com",21],["esto.eu",22],["ctol.digital",22],["beterbed.nl",23],["crt.hr",24],["code.likeagirl.io",25],["engineering.mixpanel.com",25],["betterprogramming.pub",25],["medium.com",25],["500ish.com",25],["gitconnected.com",25],["bettermarketing.pub",25],["diylifetech.com",25],["thebolditalic.com",25],["writingcooperative.com",25],["fanfare.pub",25],["betterhumans.pub",25],["fvd.nl",26],["cpc2r.ch",27],["metamask.io",28],["chavesnamao.com.br",29],["anhanguera.com",30],["bhaskar.com",31],["novaventa.com",32],["privacy.com.br",33],["supabase.com",34],["app.getgrass.io",35],["sanluisgarbage.com",36],["wildberries.ru",37],["cryptorank.io",38],["springmerchant.com",39],["veed.io",40],["deribit.com",41],["dorkgpt.com",41],["varusteleka.com",41],["zoho.com",42],["femibion.rs",43],["nove.fr",43],["metro1.com.br",43],["improvethenews.org",44],["plente.com",44],["movies4us.*",44],["popcornmovies.to",44],["villagrancanaria.com",45],["baic.cz",46],["bunq.com",47],["framer.com",47],["inceptionlabs.ai",47],["zave.it",47],["tower.dev",47],["fleksberegner.dk",48],["duty.travel.cl",49],["solscan.io",50],["connorduffy.abundancerei.com",51],["bc.gamem",52],["akkushop-turkiye.com.tr",53],["k33.com",[54,55]],["komdigi.go.id",56],["fijiairways.com",57],["planner.kaboodle.co.nz",58],["pedalcommander.*",59],["sekisuialveo.com",[60,61]],["rightsize.dk",62],["random-group.olafneumann.org",63],["espadrij.com",64],["hygiene-shop.eu",64],["gesundheitsmanufaktur.de",[64,300]],["technikmuseum.berlin",65],["cvut.cz",[66,67,68]],["r-ulybka.ru",69],["voltadol.at",70],["evium.de",71],["hiring.amazon.com",72],["comnet.com.tr",72],["gpuscout.nl",72],["remanga.org",72],["parrotsec.org",72],["estrelabet.bet.br",72],["shonenjumpplus.com",73],["engeldirekt.de",74],["haleon-gebro.at",[75,76]],["happyplates.com",[77,78]],["ickonic.com",79],["abs-cbn.com",80],["news.abs-cbn.com",80],["opmaatzagen.nl",81],["mundwerk-rottweil.de",81],["sqlook.com",82],["adef-emploi.fr",[85,86]],["lumieresdelaville.net",[85,86]],["ccaf.io",[87,88]],["dbschenkerarkas.com.tr",89],["dbschenker-seino.jp",89],["dbschenker.com",[89,185]],["scinapse.io",90],["shop.ba.com",[91,92]],["uc.pt",93],["bennettrogers.mysight.uk",94],["snipp.gg",94],["leafly.com",95],["geizhals.at",96],["geizhals.de",96],["geizhals.eu",96],["cenowarka.pl",96],["skinflint.co.uk",96],["webhallen.com",[97,98,99]],["olx.com.br",100],["unobike.com",101],["mod.io",102],["passport-photo.online",103],["mojmaxtv.hrvatskitelekom.hr",103],["rodrigue-app.ct.ws",103],["tme.eu",104],["mein-osttirol.rocks",105],["tennessine.co.uk",106],["ultraleds.co.uk",107],["greubelforsey.com",108],["lukify.app",109],["studiobookr.com",110],["getgrass.io",111],["artisan.co",112],["mobilefuse.com",113],["safe.global",[114,237]],["data.carbonmapper.org",115],["avica.link",116],["madeiramadeira.com.br",117],["sberdisk.ru",118],["column.com",119],["iqoption.com",120],["dopesnow.com",121],["montecwear.com",121],["romeo.com",122],["sonyliv.com",[123,124]],["cwallet.com",125],["oneskin.co",126],["telemetr.io",127],["near.org",128],["near.ai",128],["dev.near.org",129],["jito.network",130],["jito.wtf",130],["goodpods.com",131],["pngtree.com",[132,133]],["idar-oberstein.de",[134,135,136,137]],["vogelsbergkreis.de",[134,135,136,137]],["v2.xmeye.net",138],["venom.foundation",139],["canonvannederland.nl",140],["my-account.storage-mart.com",141],["web.bunq.com",142],["lifesum.com",143],["home.shortcutssoftware.com",144],["klimwinkel.nl",145],["markimicrowave.com",146],["aerolineas.com.ar",147],["5sim.net",147],["fold.dev",148],["mojposao.hr",149],["temu.com",[150,151]],["supreme.com",[152,153]],["g-star.com",154],["sawren.pl",155],["ultrahuman.com",156],["optionsgroup.com",157],["withpersona.com",[158,159]],["trigger.dev",160],["core.app",[161,163]],["zora.co",162],["kokku-online.de",164],["cuba-buddy.de",165],["datamask.app",166],["humandataincome.com",166],["crealitycloud.com",167],["triumphtechnicalinformation.com",168],["businessclass.com",169],["livsstil.se",170],["schneidewind-immobilien.de",171],["textshuttle.com",172],["simpleswap.io",173],["wales.nhs.attendanywhere.com",174],["sacal.it",175],["astondevs.ru",176],["gonxt.com",177],["geomiq.com",178],["bbc.com",179],["galaxy.com",180],["ticketmelon.com",181],["pechinchou.com.br",182],["thehub21.com",183],["archiup.com",184],["autoride.cz",[186,187,188]],["autoride.es",[186,187,188]],["autoride.io",[186,187,188]],["autoride.sk",[186,187,188]],["wunderground.com",189],["baselime.io",190],["eversports.de",[191,192]],["makerz.me",193],["reebok.eu",194],["alfa.com.ec",195],["rts.com.ec",195],["tropicalida.com.ec",195],["owgr.com",[196,197]],["beermerchants.com",198],["saamexe.com",[199,200]],["helium.com",199],["blommerscoffee.shipping-portal.com",199],["app.bionic-reading.com",201],["nloto.ru",202],["swisstours.com",203],["librinova.com",204],["format.bike",205],["khanacademy.org",206],["etelecinema.hu",207],["konicaminolta.com",208],["soquest.xyz",209],["region-bayreuth.de",210],["bahnland-bayern.de",211],["eezy.nrw",211],["nationalexpress.de",211],["chipcitycookies.com",212],["6amgroup.com",212],["go.bkk.hu",212],["worldlibertyfinancial.com",212],["happiful.com",212],["bazaartracker.com",213],["subscribercounter.com",214],["app.klarna.com",[215,216,217]],["instantspoursoi.fr",218],["thealliance.ai",219],["librumreader.com",220],["visnos.com",221],["polypane.app",222],["changelly.com",223],["glose.com",224],["yellow.systems",225],["renebieder.com",226],["goodram.com",227],["starwalk.space",228],["vitotechnology.com",228],["codedead.com",229],["studiofabiobiesel.com",230],["fydeos.com",231],["fydeos.io",231],["jove.com",232],["argent.xyz",233],["pixeden.com",234],["akasha.org",235],["ashleyfurniture.com",236],["jibjab.com",238],["filmzie.com",239],["vietjetair.com",240],["kick.com",241],["cora-broodjes.nl",242],["jimdosite.com",242],["worstbassist.com",242],["evernote.com",[243,244,314]],["octopusenergy.co.jp",245],["findmcserver.com",246],["schneideranwaelte.de",247],["traefik.io",247],["cityfalcon.ai",248],["digitalparking.city",249],["mediathekviewweb.de",250],["solana.com",251],["ef.co.id",252],["alohafromdeer.com",253],["fwd.com",[254,256]],["everywhere.game",255],["geotastic.net",257],["garageproject.co.nz",258],["tattoodo.com",[258,259]],["jmonline.com.br",260],["atlas.workland.com",260],["virginexperiencedays.co.uk",260],["emag.berliner-woche.de",[261,262,263]],["nordkurier.de",[261,262,263]],["everest-24.pl",[264,265]],["sneakerfreaker.com",266],["cryptofalka.hu",266],["walmart.ca",267],["byfood.com",268],["andsafe.de",269],["edostavka.by",270],["emall.by",270],["ishoppurium.com",271],["baseblocks.tenereteam.com",272],["onexstore.pl",[273,274,275]],["revanced.app",275],["evropochta.by",[276,277]],["inselberlin.de",278],["gronkh.tv",279],["adfilteringdevsummit.com",280],["dailyrevs.com",281],["dsworks.ru",281],["daraz.com",282],["learngerman.dw.com",283],["leeway.tech",284],["gostanford.com",285],["namensetiketten.de",286],["drafthound.com",[287,288]],["wokularach.pl",289],["bidup.amtrak.com",290],["eschuhe.de",291],["zeglins.com",292],["flyingpapers.com",293],["beta.character.ai",[294,295]],["bittimittari.fi",296],["aida64.co.uk",[297,298]],["aida64.com.ua",[297,298]],["aida64.de",[297,298]],["aida64.hu",[297,298]],["aida64.it",[297,298]],["aida64russia.com",[297,298]],["116.ru",299],["14.ru",299],["161.ru",299],["164.ru",299],["173.ru",299],["178.ru",299],["26.ru",299],["29.ru",299],["35.ru",299],["43.ru",299],["45.ru",299],["48.ru",299],["51.ru",299],["53.ru",299],["56.ru",299],["59.ru",299],["60.ru",299],["63.ru",299],["68.ru",299],["71.ru",299],["72.ru",299],["74.ru",299],["76.ru",299],["86.ru",299],["89.ru",299],["93.ru",299],["chita.ru",299],["e1.ru",299],["fontanka.ru",299],["ircity.ru",299],["izh1.ru",299],["mgorsk.ru",299],["msk1.ru",299],["ngs.ru",299],["ngs22.ru",299],["ngs24.ru",299],["ngs42.ru",299],["ngs55.ru",299],["ngs70.ru",299],["nn.ru",299],["sochi1.ru",299],["sterlitamak1.ru",299],["tolyatty.ru",299],["ufa1.ru",299],["v1.ru",299],["vladivostok1.ru",299],["voronezh1.ru",299],["ya62.ru",299],["open24.ee",300],["116117.fi",301],["pjspub.com",302],["autodude.dk",303],["autodude.fi",303],["autodude.no",303],["autodude.se",303],["valostore.fi",303],["valostore.no",303],["valostore.se",303],["vivantis.*",304],["vivantis-shop.at",304],["krasa.cz",304],["auf1.tv",305],["wesendit.com",306],["hatch.co",307],["haberturk.com",308],["spaseekers.com",309],["incomeshares.com",310],["surnamedb.com",311],["pizzadelight-menu.co.uk",312],["ioplus.nl",313],["lahella.fi",315]]);
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
