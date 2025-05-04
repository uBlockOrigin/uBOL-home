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
const argsList = [["cookieConsent","granted"],["cookie_consent","no"],["psh:cookies-other","false"],["psh:cookies-seen","true"],["psh:cookies-social","true"],["consents-analytics","false"],["cookiesAccepted","true"],["cookieBarVisible","false"],["cookie-accepted","1"],["CustomCookieBannerAcceptIntent","true"],["pc-cookie-accepted","true"],["pc-cookie-technical-accepted","true"],["cookie-consent","rejected"],["owf_agree_cookie_policy","true"],["cookieConsent","accepted"],["allowFunctionalCookies","false"],["cookieClosed","true"],["explicitCookieAccept-24149","true"],["keeper_cookie_consent","true"],["cookie_accepted","true"],["consentLevel","1"],["cookies-val","accepted"],["201805-policy|accepted","1"],["GDPR-fingerprint:accepted","true"],["CPCCookies","true"],["privacyModalSeen","true"],["LGPDconsent","1"],["isCookiePoliceAccepted","1"],["HAS_ACCEPTED_PRIVACY_POLICY","true"],["cookiesAceptadas","true"],["privacy.com.br","accepted"],["supabase-consent-ph","false"],["cookieConsent","essential"],["has-seen-ccpa-notice","true"],["wbx__cookieAccepted","true"],["show_cookies_popup","false"],["modal_cookies","1"],["trainingDataConsent","true"],["cookieConsent","false"],["zglobal_Acookie_optOut","3"],["cookie","true"],["cookiePolicy","true"],["cookies_view","true"],["gdprConsent","false"],["framerCookiesDismissed","true"],["vue-cookie-accept-decline-cookiePanel","accept"],["cookies-consent-accepted","true"],["user-cookies-setting","1"],["COOKIE_AUTHORITY_QUERY_V2","1"],["ignore_cookie_warn","true"],["CerezUyariGosterildi","true"],["cookies-product","NO"],["showCookies","NO"],["localConsent","true"],["acceptedCookies","true"],["isNotificationDisplayed","true"],["COOKIE_BANNER_CLICKED","true"],["cookies-eu-statistics","false"],["cookies-eu-necessary","true"],["cookieStatus","rejected"],["consent","true"],["cookiePreference","required"],["technikmuseum-required-enabled","true"],["ctu-cm-n","1"],["ctu-cm-a","0"],["ctu-cm-m","0"],["cookieAndRecommendsAgreement","true"],["cookiebanner-active","false"],["tracking-state-v2","deny"],["cookieConsent","true"],["202306151200.shown.production","true"],["consent","[]"],["cookiebanner:extMedia","false"],["cookiebanner:statistic","false"],["consentAccepted","true"],["marketingConsentAccepted","false"],["consentMode","1"],["uninavIsAgreeCookie","true"],["cookieConsent","denied"],["cookieChoice","rejected"],["adsAccepted","false"],["analyticsAccepted","false"],["analytics_gdpr_accept","yes"],["youtube_gdpr_accept","yes"],["Analytics:accepted","false"],["GDPR:accepted","true"],["cookie_usage_acknowledged_2","1"],["a_c","true"],["iag-targeting-consent","no"],["iag-performance-consent","no"],["userDeniedCookies","1"],["hasConsent","false"],["viewedCookieConsent","true"],["dnt_message_shown","1"],["necessaryConsent","true"],["marketingConsent","false"],["personalisationConsent","false"],["open_modal_update_policy","1"],["cookieinfo","1"],["cookies","1"],["cookieAccepted","true"],["necessary_cookie_confirmed","true"],["ccb_contao_token_1","1"],["cookies","0"],["cookies_accepted_6pzworitz8","true"],["rgpd.consent","1"],["_lukCookieAgree","2"],["cookiesAllowed","false"],["cookiePreference","1"],["artisan_acceptCookie","true"],["cookies_policy_acceptance","denied"],["SAFE__analyticsPreference","false"],["termsOfUseAccepted","true"],["agreeCookie","true"],["lgpd-agree","1"],["cookieIsAccepted","true"],["cookieAllowed","false"],["cookie_usage_accepted","1"],["cookieBannerShown","true"],["cookiesConsent","1"],["cookie_acceptance","true"],["analytics_cookies_acceptance","true"],["ns_cookies","1"],["gdpr","deny"],["c","false"],["cookies-preference","1"],["cookiesAcknowledged","1"],["hasConsentedPH","no"],["cookie_consent","accepted"],["gtag.consent.option","1"],["cps28","1"],["PrivacyPolicy[][core]","forbidden"],["PrivacyPolicy[][maps]","forbidden"],["PrivacyPolicy[][videos]","forever"],["PrivacyPolicy[][readSpeaker]","forbidden"],["showCookieUse","false"],["terms","accepted"],["z_cookie_consent","true"],["StorageMartCookiesPolicySeen","true"],["bunq:CookieConsentStore:isBannerVisible","false"],["accepted-cookies","[]"],["ngx-webstorage|cookies","false"],["app_gdpr_consent","1"],["alreadyAcceptCookie","true"],["isCookiesAccepted","true"],["cookies","no"],["cookies-policy-accepted","true"],["cookie_prompt_times","1"],["last_prompt_time","1"],["sup_gdpr_cookie","accepted"],["gdpr_cookie","accepted"],["cn","true"],["consent_popup","1"],["COOKIE_CONSENT","false"],["cookie-consent-declined-version","1"],["Do-not-share","true"],["allow-cookies","false"],["__ph_opt_in_out_phc_9aSDbJCaDUMdZdHxxMPTvcj7A9fsl3mCgM1RBPmPsl7","0"],["should_display_cookie_banner_v2","false"],["zora-discover-14-03-23","false"],["connect-wallet-legal-consent","true"],["cookiesMin","1"],["cb-accept-cookie","true"],["cookie-permission","false"],["cookies","true"],["ROCUMENTS.cookieConsent","true"],["bcCookieAccepted","true"],["CMP:personalisation","1"],["pcClosedOnce","true"],["textshuttle_cookie","false"],["cookies-notification-message-is-hidden","true"],["cookieBanner","false"],["cookieBanner","true"],["banner","true"],["isAllowCookies","true"],["gtag_enabled","1"],["cvcConsentGiven","true"],["terms","true"],["cookie_accept","true"],["Pechinchou:CookiesModal","true"],["hub-cp","true"],["cookiePolicyAccepted","yes"],["cookie_usage_acknowledged_2","true"],["cookies_necessary_consent","true"],["cookies_marketing_consent","false"],["cookies_statistics_consent","false"],["wu.ccpa-toast-viewed","true"],["closed","true"],["dnt","1"],["dnt_a","1"],["makerz_allow_consentmgr","0"],["SHOW_COOKIE_BANNER","no"],["CookiesConsent","1"],["hasAnalyticalCookies","false"],["hasStrictlyNecessaryCookies","true"],["amCookieBarFirstShow","1"],["acceptedCookies","false"],["viewedCookieBanner","true"],["accept_all_cookies","false"],["isCookies","1"],["isCookie","Yes"],["cookieconsent_status","false"],["user_cookie","1"],["ka:4:legal-updates","true"],["cok","true"],["cookieMessage","true"],["soCookiesPolicy","1"],["GDPR:RBI:accepted","false"],["contao-privacy-center.hidden","1"],["cookie_consent","false"],["cookiesAgree","true"],["ytsc_accepted_cookies","true"],["safe-storage/v1/tracking-consent/trackingConsentMarketingKey","false"],["safe-storage/v1/tracking-consent/trackingConsentAdvertisingKey","false"],["safe-storage/v1/tracking-consent/trackingConsentAnalyticsKey","false"],["agreeToCookie","false"],["AI Alliance_ReactCookieAcceptance_hasSetCookies","true"],["cookie-ack-2","true"],["firstVisit","false"],["2020-04-05","1"],["dismissed","true"],["SET_COOKIES_APPROVED","true"],["hasAcceptedCookies","true"],["isCookiesNotificationHidden","true"],["agreed-cookies","true"],["consentCookie","true"],["SWCOOKIESACC","1"],["hasAcceptedCookieNotice","true"],["fb-cookies-accepted","false"],["is_accept_cookie","true"],["accept-jove-cookie","1"],["cookie_consent_bar_value","true"],["pxdn_cookie_consent","true"],["akasha__cookiePolicy","true"],["QMOptIn","false"],["safe.global","false"],["cookie_banner:hidden","true"],["cookiesAccepted","false"],["accept_cookie_policy","true"],["cookies_accepted","true"],["cookies-selected","true"],["cookie-notice-dismissed","true"],["accepts-cookie-notice","true"],["dismissedPrivacyCookieMessage","1"],["allowCookies","allowed"],["cookie_consent","true"],["cookies_policy_status","true"],["cookies-accepted","true"],["allowCookies","true"],["cookie_consent","1"],["accepted-cookies","true"],["cookies-consent","0"],["cookieBannerRead","true"],["acceptCookie","0"],["cookieBannerReadDate","1"],["privacy-policy-accepted","true"],["accepted_cookies","true"],["accepted_cookie","true"],["cookie-consent","true"],["consentManager_shown","true"],["consent_necessary","true"],["consent_performance","false"],["cookie-closed","true"],["cookie-accepted","false"],["cookieConsent","1"],["enableCookieBanner","false"],["byFoodCookiePolicyRequire","false"],["ascookie--decision","true"],["isAcceptCookiesNew","true"],["isAcceptCookie","true"],["isAcceptCookie","false"],["marketing","false"],["technical","true","","reload","1"],["analytics","false"],["otherCookie","true"],["saveCookie","true"],["userAcceptsCookies","1"],["grnk-cookies-accepted","true"],["acceptCookies","no"],["acceptCookies","true"],["has-dismissed","1"],["hasAcceptedGdpr","true"],["lw-accepts-cookies","true"],["cookies-accept","true"],["load-scripts-v2","2"],["acceptsAnalyticsCookies","false"],["acceptsNecessaryCookies","true"],["display_cookie_modal","false"],["pg-accept-cookies","true"],["__EOBUWIE__consents_accepted","true","","reload","1"],["canada-cookie-acknowledge","1"],["FP_cookiesAccepted","true"],["VISITED_0","true"],["OPTIONAL_COOKIES_ACCEPTED_0","true"],["storagePermission","true"],["set_cookie_stat","false"],["set_cookie_tracking","false"],["df-cookies-allowed","true"],["cookie-consent","1"],["userConsented","false"],["cookieConsent","necessary"],["gdpr-done","true"],["isTrackingAllowed","false"],["legalsAccepted","true"],["COOKIE_CONSENT_STATUS_4124","\"dismissed\""],["cookie-policy","approve"],["spaseekers:cookie-decision","accepted"],["policyAccepted","true"],["consentBannerLastShown","1"],["flipdish-cookies-preferences","necessary"],["consentInteraction","true"],["cookie-notice-accepted-version","1"],["cookieConsentGiven","1"]];
const hostnamesMap = new Map([["notthebee.com",0],["granola.ai",1],["polar.sh",1],["posthog.com",1],["nhnieuws.nl",[2,3,4]],["omroepbrabant.nl",[2,3,4]],["receptagemini.pl",5],["netbank.avida.no",6],["bo3.gg",6],["gs1.se",[6,15]],["puregoldprotein.com",[6,80,81]],["spectrumtherapeutics.com",6],["thingtesting.com",6],["streamclipsgermany.de",6],["gdh.digital",7],["rozklady.bielsko.pl",8],["typeform.com",9],["erlus.com",[10,11]],["bettrfinancing.com",12],["sf-express.com",13],["min.io",14],["lemwarm.com",16],["form.fillout.com",17],["keepersecurity.com",18],["esto.eu",19],["ctol.digital",19],["beterbed.nl",20],["crt.hr",21],["code.likeagirl.io",22],["engineering.mixpanel.com",22],["betterprogramming.pub",22],["medium.com",22],["500ish.com",22],["gitconnected.com",22],["bettermarketing.pub",22],["diylifetech.com",22],["thebolditalic.com",22],["writingcooperative.com",22],["fanfare.pub",22],["betterhumans.pub",22],["fvd.nl",23],["cpc2r.ch",24],["metamask.io",25],["chavesnamao.com.br",26],["anhanguera.com",27],["bhaskar.com",28],["novaventa.com",29],["privacy.com.br",30],["supabase.com",31],["app.getgrass.io",32],["sanluisgarbage.com",33],["wildberries.ru",34],["cryptorank.io",35],["springmerchant.com",36],["veed.io",37],["deribit.com",38],["dorkgpt.com",38],["varusteleka.com",38],["zoho.com",39],["femibion.rs",40],["nove.fr",40],["improvethenews.org",41],["plente.com",41],["movies4us.*",41],["popcornmovies.to",41],["villagrancanaria.com",42],["baic.cz",43],["bunq.com",44],["framer.com",44],["inceptionlabs.ai",44],["zave.it",44],["tower.dev",44],["fleksberegner.dk",45],["duty.travel.cl",46],["solscan.io",47],["connorduffy.abundancerei.com",48],["bc.gamem",49],["akkushop-turkiye.com.tr",50],["k33.com",[51,52]],["komdigi.go.id",53],["fijiairways.com",54],["planner.kaboodle.co.nz",55],["pedalcommander.*",56],["sekisuialveo.com",[57,58]],["rightsize.dk",59],["random-group.olafneumann.org",60],["espadrij.com",61],["hygiene-shop.eu",61],["gesundheitsmanufaktur.de",[61,297]],["technikmuseum.berlin",62],["cvut.cz",[63,64,65]],["r-ulybka.ru",66],["voltadol.at",67],["evium.de",68],["hiring.amazon.com",69],["comnet.com.tr",69],["gpuscout.nl",69],["remanga.org",69],["parrotsec.org",69],["estrelabet.bet.br",69],["shonenjumpplus.com",70],["engeldirekt.de",71],["haleon-gebro.at",[72,73]],["happyplates.com",[74,75]],["ickonic.com",76],["abs-cbn.com",77],["news.abs-cbn.com",77],["opmaatzagen.nl",78],["mundwerk-rottweil.de",78],["sqlook.com",79],["adef-emploi.fr",[82,83]],["lumieresdelaville.net",[82,83]],["ccaf.io",[84,85]],["dbschenkerarkas.com.tr",86],["dbschenker-seino.jp",86],["dbschenker.com",[86,182]],["scinapse.io",87],["shop.ba.com",[88,89]],["uc.pt",90],["bennettrogers.mysight.uk",91],["snipp.gg",91],["leafly.com",92],["geizhals.at",93],["geizhals.de",93],["geizhals.eu",93],["cenowarka.pl",93],["skinflint.co.uk",93],["webhallen.com",[94,95,96]],["olx.com.br",97],["unobike.com",98],["mod.io",99],["passport-photo.online",100],["mojmaxtv.hrvatskitelekom.hr",100],["rodrigue-app.ct.ws",100],["tme.eu",101],["mein-osttirol.rocks",102],["tennessine.co.uk",103],["ultraleds.co.uk",104],["greubelforsey.com",105],["lukify.app",106],["studiobookr.com",107],["getgrass.io",108],["artisan.co",109],["mobilefuse.com",110],["safe.global",[111,235]],["data.carbonmapper.org",112],["avica.link",113],["madeiramadeira.com.br",114],["sberdisk.ru",115],["column.com",116],["iqoption.com",117],["dopesnow.com",118],["montecwear.com",118],["romeo.com",119],["sonyliv.com",[120,121]],["cwallet.com",122],["oneskin.co",123],["telemetr.io",124],["near.org",125],["near.ai",125],["dev.near.org",126],["jito.network",127],["jito.wtf",127],["goodpods.com",128],["pngtree.com",[129,130]],["idar-oberstein.de",[131,132,133,134]],["vogelsbergkreis.de",[131,132,133,134]],["v2.xmeye.net",135],["venom.foundation",136],["canonvannederland.nl",137],["my-account.storage-mart.com",138],["web.bunq.com",139],["lifesum.com",140],["home.shortcutssoftware.com",141],["klimwinkel.nl",142],["markimicrowave.com",143],["aerolineas.com.ar",144],["5sim.net",144],["fold.dev",145],["mojposao.hr",146],["temu.com",[147,148]],["supreme.com",[149,150]],["g-star.com",151],["sawren.pl",152],["ultrahuman.com",153],["optionsgroup.com",154],["withpersona.com",[155,156]],["trigger.dev",157],["core.app",[158,160]],["zora.co",159],["kokku-online.de",161],["cuba-buddy.de",162],["datamask.app",163],["humandataincome.com",163],["crealitycloud.com",164],["triumphtechnicalinformation.com",165],["businessclass.com",166],["livsstil.se",167],["schneidewind-immobilien.de",168],["textshuttle.com",169],["simpleswap.io",170],["wales.nhs.attendanywhere.com",171],["sacal.it",172],["astondevs.ru",173],["gonxt.com",174],["geomiq.com",175],["bbc.com",176],["galaxy.com",177],["ticketmelon.com",178],["pechinchou.com.br",179],["thehub21.com",180],["archiup.com",181],["autoride.cz",[183,184,185]],["autoride.es",[183,184,185]],["autoride.io",[183,184,185]],["autoride.sk",[183,184,185]],["wunderground.com",186],["baselime.io",187],["eversports.de",[188,189]],["makerz.me",190],["reebok.eu",191],["alfa.com.ec",192],["rts.com.ec",192],["tropicalida.com.ec",192],["owgr.com",[193,194]],["beermerchants.com",195],["saamexe.com",[196,197]],["helium.com",196],["blommerscoffee.shipping-portal.com",196],["app.bionic-reading.com",198],["nloto.ru",199],["swisstours.com",200],["librinova.com",201],["format.bike",202],["khanacademy.org",203],["etelecinema.hu",204],["konicaminolta.com",205],["soquest.xyz",206],["region-bayreuth.de",207],["bahnland-bayern.de",208],["eezy.nrw",208],["nationalexpress.de",208],["chipcitycookies.com",209],["6amgroup.com",209],["go.bkk.hu",209],["worldlibertyfinancial.com",209],["happiful.com",209],["bazaartracker.com",210],["subscribercounter.com",211],["app.klarna.com",[212,213,214]],["instantspoursoi.fr",215],["thealliance.ai",216],["vivenu.com",217],["librumreader.com",218],["visnos.com",219],["polypane.app",220],["changelly.com",221],["glose.com",222],["yellow.systems",223],["renebieder.com",224],["goodram.com",225],["starwalk.space",226],["vitotechnology.com",226],["codedead.com",227],["studiofabiobiesel.com",228],["fydeos.com",229],["fydeos.io",229],["jove.com",230],["argent.xyz",231],["pixeden.com",232],["akasha.org",233],["ashleyfurniture.com",234],["jibjab.com",236],["filmzie.com",237],["vietjetair.com",238],["kick.com",239],["cora-broodjes.nl",240],["jimdosite.com",240],["worstbassist.com",240],["evernote.com",[241,242,311]],["octopusenergy.co.jp",243],["findmcserver.com",244],["schneideranwaelte.de",245],["traefik.io",245],["cityfalcon.ai",246],["digitalparking.city",247],["mediathekviewweb.de",248],["solana.com",249],["ef.co.id",250],["alohafromdeer.com",251],["fwd.com",[252,254]],["everywhere.game",253],["geotastic.net",255],["garageproject.co.nz",256],["tattoodo.com",[256,257]],["jmonline.com.br",258],["atlas.workland.com",258],["virginexperiencedays.co.uk",258],["emag.berliner-woche.de",[259,260,261]],["nordkurier.de",[259,260,261]],["everest-24.pl",[262,263]],["sneakerfreaker.com",264],["cryptofalka.hu",264],["walmart.ca",265],["byfood.com",266],["andsafe.de",267],["edostavka.by",268],["emall.by",268],["ishoppurium.com",269],["baseblocks.tenereteam.com",270],["onexstore.pl",[271,272,273]],["revanced.app",273],["evropochta.by",[274,275]],["inselberlin.de",276],["gronkh.tv",277],["adfilteringdevsummit.com",278],["dailyrevs.com",279],["dsworks.ru",279],["daraz.com",280],["learngerman.dw.com",281],["leeway.tech",282],["gostanford.com",283],["namensetiketten.de",284],["drafthound.com",[285,286]],["wokularach.pl",287],["bidup.amtrak.com",288],["eschuhe.de",289],["zeglins.com",290],["flyingpapers.com",291],["beta.character.ai",[292,293]],["bittimittari.fi",294],["aida64.co.uk",[295,296]],["aida64.com.ua",[295,296]],["aida64.de",[295,296]],["aida64.hu",[295,296]],["aida64.it",[295,296]],["aida64russia.com",[295,296]],["open24.ee",297],["116117.fi",298],["pjspub.com",299],["autodude.dk",300],["autodude.fi",300],["autodude.no",300],["autodude.se",300],["valostore.fi",300],["valostore.no",300],["valostore.se",300],["vivantis.*",301],["vivantis-shop.at",301],["krasa.cz",301],["auf1.tv",302],["wesendit.com",303],["hatch.co",304],["haberturk.com",305],["spaseekers.com",306],["incomeshares.com",307],["surnamedb.com",308],["pizzadelight-menu.co.uk",309],["ioplus.nl",310],["lahella.fi",312]]);
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
