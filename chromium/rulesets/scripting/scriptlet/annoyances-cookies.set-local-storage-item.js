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
const argsList = [["cookieConsent","granted"],["cookie_consent","no"],["psh:cookies-other","false"],["psh:cookies-seen","true"],["psh:cookies-social","true"],["pc-cookie-accepted","true"],["pc-cookie-technical-accepted","true"],["owf_agree_cookie_policy","true"],["cookieConsent","accepted"],["allowFunctionalCookies","false"],["cookiesAccepted","true"],["cookieClosed","true"],["explicitCookieAccept-24149","true"],["keeper_cookie_consent","true"],["cookie_accepted","true"],["consentLevel","1"],["cookies-val","accepted"],["201805-policy|accepted","1"],["GDPR-fingerprint:accepted","true"],["CPCCookies","true"],["privacyModalSeen","true"],["LGPDconsent","1"],["isCookiePoliceAccepted","1"],["HAS_ACCEPTED_PRIVACY_POLICY","true"],["cookiesAceptadas","true"],["privacy.com.br","accepted"],["supabase-consent-ph","false"],["cookieConsent","essential"],["has-seen-ccpa-notice","true"],["wbx__cookieAccepted","true"],["show_cookies_popup","false"],["modal_cookies","1"],["trainingDataConsent","true"],["cookieConsent","false"],["zglobal_Acookie_optOut","3"],["cookie","true"],["cookiePolicy","true"],["cookies_view","true"],["gdprConsent","false"],["framerCookiesDismissed","true"],["vue-cookie-accept-decline-cookiePanel","accept"],["cookies-consent-accepted","true"],["user-cookies-setting","1"],["COOKIE_AUTHORITY_QUERY_V2","1"],["ignore_cookie_warn","true"],["CerezUyariGosterildi","true"],["cookies-product","NO"],["showCookies","NO"],["localConsent","true"],["acceptedCookies","true"],["isNotificationDisplayed","true"],["COOKIE_BANNER_CLICKED","true"],["cookies-eu-statistics","false"],["cookies-eu-necessary","true"],["cookieStatus","rejected"],["consent","true"],["cookiePreference","required"],["technikmuseum-required-enabled","true"],["ctu-cm-n","1"],["ctu-cm-a","0"],["ctu-cm-m","0"],["cookieAndRecommendsAgreement","true"],["cookiebanner-active","false"],["tracking-state-v2","deny"],["cookieConsent","true"],["202306151200.shown.production","true"],["consent","[]"],["cookiebanner:extMedia","false"],["cookiebanner:statistic","false"],["consentAccepted","true"],["marketingConsentAccepted","false"],["consentMode","1"],["uninavIsAgreeCookie","true"],["cookieConsent","denied"],["cookieChoice","rejected"],["adsAccepted","false"],["analyticsAccepted","false"],["analytics_gdpr_accept","yes"],["youtube_gdpr_accept","yes"],["Analytics:accepted","false"],["GDPR:accepted","true"],["cookie_usage_acknowledged_2","1"],["a_c","true"],["iag-targeting-consent","no"],["iag-performance-consent","no"],["userDeniedCookies","1"],["hasConsent","false"],["viewedCookieConsent","true"],["dnt_message_shown","1"],["necessaryConsent","true"],["marketingConsent","false"],["personalisationConsent","false"],["open_modal_update_policy","1"],["cookieinfo","1"],["cookies","1"],["cookieAccepted","true"],["necessary_cookie_confirmed","true"],["ccb_contao_token_1","1"],["cookies","0"],["cookies_accepted_6pzworitz8","true"],["rgpd.consent","1"],["_lukCookieAgree","2"],["cookiesAllowed","false"],["cookiePreference","1"],["artisan_acceptCookie","true"],["cookies_policy_acceptance","denied"],["SAFE__analyticsPreference","false"],["termsOfUseAccepted","true"],["agreeCookie","true"],["lgpd-agree","1"],["cookieIsAccepted","true"],["cookieAllowed","false"],["cookie_usage_accepted","1"],["cookieBannerShown","true"],["cookiesConsent","1"],["cookie_acceptance","true"],["analytics_cookies_acceptance","true"],["ns_cookies","1"],["gdpr","deny"],["c","false"],["cookies-preference","1"],["cookiesAcknowledged","1"],["hasConsentedPH","no"],["cookie_consent","accepted"],["gtag.consent.option","1"],["cps20","1"],["showCookieUse","false"],["terms","accepted"],["z_cookie_consent","true"],["StorageMartCookiesPolicySeen","true"],["bunq:CookieConsentStore:isBannerVisible","false"],["accepted-cookies","[]"],["ngx-webstorage|cookies","false"],["app_gdpr_consent","1"],["alreadyAcceptCookie","true"],["isCookiesAccepted","true"],["cookies","no"],["cookies-policy-accepted","true"],["cookie_prompt_times","1"],["last_prompt_time","1"],["sup_gdpr_cookie","accepted"],["gdpr_cookie","accepted"],["cn","true"],["consent_popup","1"],["COOKIE_CONSENT","false"],["cookie-consent-declined-version","1"],["Do-not-share","true"],["allow-cookies","false"],["__ph_opt_in_out_phc_9aSDbJCaDUMdZdHxxMPTvcj7A9fsl3mCgM1RBPmPsl7","0"],["should_display_cookie_banner_v2","false"],["zora-discover-14-03-23","false"],["connect-wallet-legal-consent","true"],["cookiesMin","1"],["cb-accept-cookie","true"],["cookie-permission","false"],["cookies","true"],["ROCUMENTS.cookieConsent","true"],["bcCookieAccepted","true"],["CMP:personalisation","1"],["pcClosedOnce","true"],["textshuttle_cookie","false"],["cookies-notification-message-is-hidden","true"],["cookieBanner","false"],["cookieBanner","true"],["banner","true"],["isAllowCookies","true"],["gtag_enabled","1"],["cvcConsentGiven","true"],["terms","true"],["cookie_accept","true"],["Pechinchou:CookiesModal","true"],["hub-cp","true"],["cookiePolicyAccepted","yes"],["cookie_usage_acknowledged_2","true"],["cookies_necessary_consent","true"],["cookies_marketing_consent","false"],["cookies_statistics_consent","false"],["wu.ccpa-toast-viewed","true"],["closed","true"],["dnt","1"],["dnt_a","1"],["makerz_allow_consentmgr","0"],["SHOW_COOKIE_BANNER","no"],["CookiesConsent","1"],["hasAnalyticalCookies","false"],["hasStrictlyNecessaryCookies","true"],["amCookieBarFirstShow","1"],["acceptedCookies","false"],["viewedCookieBanner","true"],["accept_all_cookies","false"],["isCookies","1"],["isCookie","Yes"],["cookieconsent_status","false"],["user_cookie","1"],["ka:4:legal-updates","true"],["cok","true"],["cookieMessage","true"],["soCookiesPolicy","1"],["GDPR:RBI:accepted","false"],["contao-privacy-center.hidden","1"],["cookie_consent","false"],["cookiesAgree","true"],["ytsc_accepted_cookies","true"],["safe-storage/v1/tracking-consent/trackingConsentMarketingKey","false"],["safe-storage/v1/tracking-consent/trackingConsentAdvertisingKey","false"],["safe-storage/v1/tracking-consent/trackingConsentAnalyticsKey","false"],["agreeToCookie","false"],["AI Alliance_ReactCookieAcceptance_hasSetCookies","true"],["cookie-ack-2","true"],["firstVisit","false"],["2020-04-05","1"],["dismissed","true"],["SET_COOKIES_APPROVED","true"],["hasAcceptedCookies","true"],["isCookiesNotificationHidden","true"],["agreed-cookies","true"],["consentCookie","true"],["SWCOOKIESACC","1"],["hasAcceptedCookieNotice","true"],["fb-cookies-accepted","false"],["is_accept_cookie","true"],["accept-jove-cookie","1"],["cookie_consent_bar_value","true"],["pxdn_cookie_consent","true"],["akasha__cookiePolicy","true"],["QMOptIn","false"],["safe.global","false"],["cookie_banner:hidden","true"],["cookiesAccepted","false"],["accept_cookie_policy","true"],["cookies_accepted","true"],["cookies-selected","true"],["cookie-notice-dismissed","true"],["accepts-cookie-notice","true"],["dismissedPrivacyCookieMessage","1"],["allowCookies","allowed"],["cookie_consent","true"],["cookies_policy_status","true"],["cookies-accepted","true"],["allowCookies","true"],["cookie_consent","1"],["accepted-cookies","true"],["cookies-consent","0"],["cookieBannerRead","true"],["acceptCookie","0"],["cookieBannerReadDate","1"],["privacy-policy-accepted","true"],["accepted_cookies","true"],["accepted_cookie","true"],["cookie-consent","true"],["consentManager_shown","true"],["consent_necessary","true"],["consent_performance","false"],["cookie-closed","true"],["cookie-accepted","false"],["cookieConsent","1"],["enableCookieBanner","false"],["byFoodCookiePolicyRequire","false"],["ascookie--decision","true"],["isAcceptCookiesNew","true"],["isAcceptCookie","true"],["marketing","false"],["technical","true","","reload","1"],["analytics","false"],["otherCookie","true"],["saveCookie","true"],["userAcceptsCookies","1"],["grnk-cookies-accepted","true"],["acceptCookies","no"],["acceptCookies","true"],["has-dismissed","1"],["hasAcceptedGdpr","true"],["lw-accepts-cookies","true"],["cookies-accept","true"],["load-scripts-v2","2"],["acceptsAnalyticsCookies","false"],["acceptsNecessaryCookies","true"],["display_cookie_modal","false"],["pg-accept-cookies","true"],["__EOBUWIE__consents_accepted","true","","reload","1"],["canada-cookie-acknowledge","1"],["FP_cookiesAccepted","true"],["VISITED_0","true"],["OPTIONAL_COOKIES_ACCEPTED_0","true"],["storagePermission","true"],["set_cookie_stat","false"],["set_cookie_tracking","false"],["df-cookies-allowed","true"],["cookie-consent","1"],["userConsented","false"],["cookieConsent","necessary"],["gdpr-done","true"],["isTrackingAllowed","false"],["legalsAccepted","true"],["COOKIE_CONSENT_STATUS_4124","\"dismissed\""],["cookie_accepted","-1"],["cookie-policy","approve"],["spaseekers:cookie-decision","accepted"],["policyAccepted","true"],["consentBannerLastShown","1"],["flipdish-cookies-preferences","necessary"],["consentInteraction","true"],["cookieConsentGiven","1"]];
const hostnamesMap = new Map([["notthebee.com",0],["granola.ai",1],["posthog.com",1],["polar.sh",1],["nhnieuws.nl",[2,3,4]],["omroepbrabant.nl",[2,3,4]],["erlus.com",[5,6]],["sf-express.com",7],["min.io",8],["gs1.se",[9,10]],["spectrumtherapeutics.com",10],["puregoldprotein.com",[10,75,76]],["thingtesting.com",10],["streamclipsgermany.de",10],["bo3.gg",10],["lemwarm.com",11],["form.fillout.com",12],["keepersecurity.com",13],["esto.eu",14],["ctol.digital",14],["beterbed.nl",15],["crt.hr",16],["code.likeagirl.io",17],["engineering.mixpanel.com",17],["betterprogramming.pub",17],["medium.com",17],["500ish.com",17],["gitconnected.com",17],["bettermarketing.pub",17],["diylifetech.com",17],["thebolditalic.com",17],["writingcooperative.com",17],["fanfare.pub",17],["betterhumans.pub",17],["fvd.nl",18],["cpc2r.ch",19],["metamask.io",20],["chavesnamao.com.br",21],["anhanguera.com",22],["bhaskar.com",23],["novaventa.com",24],["privacy.com.br",25],["supabase.com",26],["app.getgrass.io",27],["sanluisgarbage.com",28],["wildberries.ru",29],["cryptorank.io",30],["springmerchant.com",31],["veed.io",32],["varusteleka.com",33],["deribit.com",33],["dorkgpt.com",33],["zoho.com",34],["femibion.rs",35],["nove.fr",35],["movies4us.*",36],["popcornmovies.to",36],["improvethenews.org",36],["plente.com",36],["villagrancanaria.com",37],["baic.cz",38],["bunq.com",39],["framer.com",39],["inceptionlabs.ai",39],["zave.it",39],["tower.dev",39],["fleksberegner.dk",40],["duty.travel.cl",41],["solscan.io",42],["connorduffy.abundancerei.com",43],["bc.gamem",44],["akkushop-turkiye.com.tr",45],["k33.com",[46,47]],["komdigi.go.id",48],["fijiairways.com",49],["planner.kaboodle.co.nz",50],["pedalcommander.*",51],["sekisuialveo.com",[52,53]],["rightsize.dk",54],["random-group.olafneumann.org",55],["espadrij.com",56],["hygiene-shop.eu",56],["gesundheitsmanufaktur.de",[56,287]],["technikmuseum.berlin",57],["cvut.cz",[58,59,60]],["r-ulybka.ru",61],["voltadol.at",62],["evium.de",63],["gpuscout.nl",64],["remanga.org",64],["comnet.com.tr",64],["auth.hiring.amazon.com",64],["parrotsec.org",64],["shonenjumpplus.com",65],["engeldirekt.de",66],["haleon-gebro.at",[67,68]],["happyplates.com",[69,70]],["ickonic.com",71],["abs-cbn.com",72],["news.abs-cbn.com",72],["opmaatzagen.nl",73],["mundwerk-rottweil.de",73],["sqlook.com",74],["adef-emploi.fr",[77,78]],["lumieresdelaville.net",[77,78]],["ccaf.io",[79,80]],["dbschenkerarkas.com.tr",81],["dbschenker-seino.jp",81],["dbschenker.com",[81,173]],["scinapse.io",82],["shop.ba.com",[83,84]],["uc.pt",85],["bennettrogers.mysight.uk",86],["snipp.gg",86],["leafly.com",87],["geizhals.at",88],["geizhals.de",88],["geizhals.eu",88],["cenowarka.pl",88],["skinflint.co.uk",88],["webhallen.com",[89,90,91]],["olx.com.br",92],["unobike.com",93],["mod.io",94],["rodrigue-app.ct.ws",95],["passport-photo.online",95],["mojmaxtv.hrvatskitelekom.hr",95],["tme.eu",96],["mein-osttirol.rocks",97],["tennessine.co.uk",98],["ultraleds.co.uk",99],["greubelforsey.com",100],["lukify.app",101],["studiobookr.com",102],["getgrass.io",103],["artisan.co",104],["mobilefuse.com",105],["safe.global",[106,226]],["data.carbonmapper.org",107],["avica.link",108],["madeiramadeira.com.br",109],["sberdisk.ru",110],["column.com",111],["iqoption.com",112],["dopesnow.com",113],["montecwear.com",113],["romeo.com",114],["sonyliv.com",[115,116]],["cwallet.com",117],["oneskin.co",118],["telemetr.io",119],["near.org",120],["near.ai",120],["dev.near.org",121],["jito.network",122],["jito.wtf",122],["goodpods.com",123],["pngtree.com",[124,125]],["v2.xmeye.net",126],["venom.foundation",127],["canonvannederland.nl",128],["my-account.storage-mart.com",129],["web.bunq.com",130],["lifesum.com",131],["home.shortcutssoftware.com",132],["klimwinkel.nl",133],["markimicrowave.com",134],["aerolineas.com.ar",135],["5sim.net",135],["fold.dev",136],["mojposao.hr",137],["temu.com",[138,139]],["supreme.com",[140,141]],["g-star.com",142],["sawren.pl",143],["ultrahuman.com",144],["optionsgroup.com",145],["withpersona.com",[146,147]],["trigger.dev",148],["core.app",[149,151]],["zora.co",150],["kokku-online.de",152],["cuba-buddy.de",153],["datamask.app",154],["humandataincome.com",154],["crealitycloud.com",155],["triumphtechnicalinformation.com",156],["businessclass.com",157],["livsstil.se",158],["schneidewind-immobilien.de",159],["textshuttle.com",160],["simpleswap.io",161],["wales.nhs.attendanywhere.com",162],["sacal.it",163],["astondevs.ru",164],["gonxt.com",165],["geomiq.com",166],["bbc.com",167],["galaxy.com",168],["ticketmelon.com",169],["pechinchou.com.br",170],["thehub21.com",171],["archiup.com",172],["autoride.cz",[174,175,176]],["autoride.es",[174,175,176]],["autoride.io",[174,175,176]],["autoride.sk",[174,175,176]],["wunderground.com",177],["baselime.io",178],["eversports.de",[179,180]],["makerz.me",181],["reebok.eu",182],["alfa.com.ec",183],["rts.com.ec",183],["tropicalida.com.ec",183],["owgr.com",[184,185]],["beermerchants.com",186],["saamexe.com",[187,188]],["helium.com",187],["app.bionic-reading.com",189],["nloto.ru",190],["swisstours.com",191],["librinova.com",192],["format.bike",193],["khanacademy.org",194],["etelecinema.hu",195],["konicaminolta.com",196],["soquest.xyz",197],["region-bayreuth.de",198],["nationalexpress.de",199],["eezy.nrw",199],["bahnland-bayern.de",199],["chipcitycookies.com",200],["6amgroup.com",200],["go.bkk.hu",200],["worldlibertyfinancial.com",200],["happiful.com",200],["bazaartracker.com",201],["subscribercounter.com",202],["app.klarna.com",[203,204,205]],["instantspoursoi.fr",206],["thealliance.ai",207],["vivenu.com",208],["librumreader.com",209],["visnos.com",210],["polypane.app",211],["changelly.com",212],["glose.com",213],["yellow.systems",214],["renebieder.com",215],["goodram.com",216],["starwalk.space",217],["vitotechnology.com",217],["codedead.com",218],["studiofabiobiesel.com",219],["fydeos.com",220],["fydeos.io",220],["jove.com",221],["argent.xyz",222],["pixeden.com",223],["akasha.org",224],["ashleyfurniture.com",225],["jibjab.com",227],["filmzie.com",228],["vietjetair.com",229],["kick.com",230],["jimdosite.com",231],["worstbassist.com",231],["cora-broodjes.nl",231],["evernote.com",[232,233]],["octopusenergy.co.jp",234],["findmcserver.com",235],["schneideranwaelte.de",236],["traefik.io",236],["cityfalcon.ai",237],["digitalparking.city",238],["mediathekviewweb.de",239],["solana.com",240],["ef.co.id",241],["alohafromdeer.com",242],["fwd.com",[243,245]],["everywhere.game",244],["geotastic.net",246],["tattoodo.com",[247,248]],["garageproject.co.nz",247],["jmonline.com.br",249],["atlas.workland.com",249],["virginexperiencedays.co.uk",249],["emag.berliner-woche.de",[250,251,252]],["nordkurier.de",[250,251,252]],["everest-24.pl",[253,254]],["sneakerfreaker.com",255],["cryptofalka.hu",255],["walmart.ca",256],["byfood.com",257],["andsafe.de",258],["edostavka.by",259],["emall.by",259],["ishoppurium.com",260],["onexstore.pl",[261,262,263]],["revanced.app",263],["evropochta.by",[264,265]],["inselberlin.de",266],["gronkh.tv",267],["adfilteringdevsummit.com",268],["dailyrevs.com",269],["dsworks.ru",269],["daraz.com",270],["learngerman.dw.com",271],["leeway.tech",272],["gostanford.com",273],["namensetiketten.de",274],["drafthound.com",[275,276]],["wokularach.pl",277],["bidup.amtrak.com",278],["eschuhe.de",279],["zeglins.com",280],["flyingpapers.com",281],["beta.character.ai",[282,283]],["bittimittari.fi",284],["aida64.co.uk",[285,286]],["aida64.com.ua",[285,286]],["aida64.de",[285,286]],["aida64.hu",[285,286]],["aida64.it",[285,286]],["aida64russia.com",[285,286]],["open24.ee",287],["116117.fi",288],["pjspub.com",289],["autodude.dk",290],["autodude.fi",290],["autodude.no",290],["autodude.se",290],["valostore.fi",290],["valostore.no",290],["valostore.se",290],["vivantis.*",291],["vivantis-shop.at",291],["krasa.cz",291],["auf1.tv",292],["wesendit.com",293],["hatch.co",294],["gdh.digital",295],["haberturk.com",296],["spaseekers.com",297],["incomeshares.com",298],["surnamedb.com",299],["pizzadelight-menu.co.uk",300],["ioplus.nl",301],["lahella.fi",302]]);
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
