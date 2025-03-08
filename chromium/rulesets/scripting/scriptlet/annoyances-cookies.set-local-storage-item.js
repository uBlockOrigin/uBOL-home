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
        'RegExp': self.RegExp,
        'RegExp_test': self.RegExp.prototype.test,
        'RegExp_exec': self.RegExp.prototype.exec,
        'Request_clone': self.Request.prototype.clone,
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
const argsList = [["201805-policy|accepted","1"],["psh:cookies-other","false"],["psh:cookies-seen","true"],["psh:cookies-social","true"],["cookie_consent","no"],["cookie_accepted","true"],["consentLevel","1"],["LGPDconsent","1"],["isCookiePoliceAccepted","1"],["HAS_ACCEPTED_PRIVACY_POLICY","true"],["cookiesAceptadas","true"],["privacy.com.br","accepted"],["supabase-consent-ph","false"],["cookieConsent","essential"],["has-seen-ccpa-notice","true"],["wbx__cookieAccepted","true"],["show_cookies_popup","false"],["modal_cookies","1"],["trainingDataConsent","true"],["cookieConsent","false"],["zglobal_Acookie_optOut","3"],["cookie","true"],["cookiePolicy","true"],["cookies_view","true"],["gdprConsent","false"],["framerCookiesDismissed","true"],["vue-cookie-accept-decline-cookiePanel","accept"],["cookies-consent-accepted","true"],["user-cookies-setting","1"],["COOKIE_AUTHORITY_QUERY_V2","1"],["ignore_cookie_warn","true"],["CerezUyariGosterildi","true"],["cookies-product","NO"],["showCookies","NO"],["localConsent","true"],["acceptedCookies","true"],["isNotificationDisplayed","true"],["COOKIE_BANNER_CLICKED","true"],["cookies-eu-statistics","false"],["cookies-eu-necessary","true"],["cookieStatus","rejected"],["consent","true"],["cookiePreference","required"],["technikmuseum-required-enabled","true"],["ctu-cm-n","1"],["ctu-cm-a","0"],["ctu-cm-m","0"],["cookieAndRecommendsAgreement","true"],["cookiebanner-active","false"],["tracking-state-v2","deny"],["cookieConsent","true"],["202306151200.shown.production","true"],["consent","[]"],["cookiebanner:extMedia","false"],["cookiebanner:statistic","false"],["cookiesAccepted","true"],["consentAccepted","true"],["marketingConsentAccepted","false"],["consentMode","1"],["uninavIsAgreeCookie","true"],["cookieConsent","denied"],["cookieChoice","rejected"],["adsAccepted","false"],["analyticsAccepted","false"],["analytics_gdpr_accept","yes"],["youtube_gdpr_accept","yes"],["Analytics:accepted","false"],["GDPR:accepted","true"],["cookie_usage_acknowledged_2","1"],["a_c","true"],["iag-targeting-consent","no"],["iag-performance-consent","no"],["userDeniedCookies","1"],["hasConsent","false"],["viewedCookieConsent","true"],["dnt_message_shown","1"],["necessaryConsent","true"],["marketingConsent","false"],["personalisationConsent","false"],["open_modal_update_policy","1"],["cookieinfo","1"],["cookies","1"],["cookieAccepted","true"],["necessary_cookie_confirmed","true"],["ccb_contao_token_1","1"],["cookies","0"],["cookies_accepted_6pzworitz8","true"],["rgpd.consent","1"],["_lukCookieAgree","2"],["cookiesAllowed","false"],["cookiePreference","1"],["artisan_acceptCookie","true"],["cookies_policy_acceptance","denied"],["SAFE__analyticsPreference","false"],["termsOfUseAccepted","true"],["agreeCookie","true"],["lgpd-agree","1"],["cookieIsAccepted","true"],["cookieAllowed","false"],["cookie_usage_accepted","1"],["cookieBannerShown","true"],["cookiesConsent","1"],["cookie_acceptance","true"],["analytics_cookies_acceptance","true"],["ns_cookies","1"],["gdpr","deny"],["c","false"],["cookies-preference","1"],["cookiesAcknowledged","1"],["hasConsentedPH","no"],["cookie_consent","accepted"],["gtag.consent.option","1"],["cps20","1"],["showCookieUse","false"],["terms","accepted"],["z_cookie_consent","true"],["StorageMartCookiesPolicySeen","true"],["bunq:CookieConsentStore:isBannerVisible","false"],["accepted-cookies","[]"],["ngx-webstorage|cookies","false"],["app_gdpr_consent","1"],["alreadyAcceptCookie","true"],["isCookiesAccepted","true"],["cookies","no"],["cookies-policy-accepted","true"],["cookie_prompt_times","1"],["last_prompt_time","1"],["sup_gdpr_cookie","accepted"],["gdpr_cookie","accepted"],["cn","true"],["consent_popup","1"],["COOKIE_CONSENT","false"],["cookie-consent-declined-version","1"],["Do-not-share","true"],["allow-cookies","false"],["__ph_opt_in_out_phc_9aSDbJCaDUMdZdHxxMPTvcj7A9fsl3mCgM1RBPmPsl7","0"],["should_display_cookie_banner_v2","false"],["zora-discover-14-03-23","false"],["connect-wallet-legal-consent","true"],["cookiesMin","1"],["cb-accept-cookie","true"],["cookie-permission","false"],["cookies","true"],["ROCUMENTS.cookieConsent","true"],["bcCookieAccepted","true"],["CMP:personalisation","1"],["pcClosedOnce","true"],["textshuttle_cookie","false"],["cookies-notification-message-is-hidden","true"],["cookieBanner","false"],["cookieBanner","true"],["banner","true"],["isAllowCookies","true"],["gtag_enabled","1"],["cvcConsentGiven","true"],["terms","true"],["cookie_accept","true"],["Pechinchou:CookiesModal","true"],["hub-cp","true"],["cookiePolicyAccepted","yes"],["cookie_usage_acknowledged_2","true"],["cookies_necessary_consent","true"],["cookies_marketing_consent","false"],["cookies_statistics_consent","false"],["wu.ccpa-toast-viewed","true"],["closed","true"],["dnt","1"],["dnt_a","1"],["makerz_allow_consentmgr","0"],["SHOW_COOKIE_BANNER","no"],["CookiesConsent","1"],["hasAnalyticalCookies","false"],["hasStrictlyNecessaryCookies","true"],["amCookieBarFirstShow","1"],["acceptedCookies","false"],["viewedCookieBanner","true"],["accept_all_cookies","false"],["isCookies","1"],["isCookie","Yes"],["cookieconsent_status","false"],["user_cookie","1"],["ka:4:legal-updates","true"],["cok","true"],["cookieMessage","true"],["soCookiesPolicy","1"],["GDPR:RBI:accepted","false"],["contao-privacy-center.hidden","1"],["cookie_consent","false"],["cookiesAgree","true"],["ytsc_accepted_cookies","true"],["safe-storage/v1/tracking-consent/trackingConsentMarketingKey","false"],["safe-storage/v1/tracking-consent/trackingConsentAdvertisingKey","false"],["safe-storage/v1/tracking-consent/trackingConsentAnalyticsKey","false"],["agreeToCookie","false"],["AI Alliance_ReactCookieAcceptance_hasSetCookies","true"],["cookie-ack-2","true"],["firstVisit","false"],["2020-04-05","1"],["dismissed","true"],["SET_COOKIES_APPROVED","true"],["hasAcceptedCookies","true"],["isCookiesNotificationHidden","true"],["agreed-cookies","true"],["consentCookie","true"],["SWCOOKIESACC","1"],["hasAcceptedCookieNotice","true"],["fb-cookies-accepted","false"],["is_accept_cookie","true"],["accept-jove-cookie","1"],["cookie_consent_bar_value","true"],["pxdn_cookie_consent","true"],["akasha__cookiePolicy","true"],["QMOptIn","false"],["safe.global","false"],["cookie_banner:hidden","true"],["cookiesAccepted","false"],["accept_cookie_policy","true"],["kick_cookie_accepted","true"],["cookies-selected","true"],["cookie-notice-dismissed","true"],["accepts-cookie-notice","true"],["dismissedPrivacyCookieMessage","1"],["allowCookies","allowed"],["cookie_consent","true"],["cookies_policy_status","true"],["cookies-accepted","true"],["allowCookies","true"],["cookie_consent","1"],["accepted-cookies","true"],["cookies-consent","0"],["cookieBannerRead","true"],["acceptCookie","0"],["cookieBannerReadDate","1"],["privacy-policy-accepted","true"],["accepted_cookies","true"],["accepted_cookie","true"],["cookie-consent","true"],["consentManager_shown","true"],["consent_necessary","true"],["consent_performance","false"],["cookie-closed","true"],["cookie-accepted","false"],["cookieConsent","1"],["enableCookieBanner","false"],["byFoodCookiePolicyRequire","false"],["ascookie--decision","true"],["isAcceptCookiesNew","true"],["isAcceptCookie","true"],["marketing","false"],["technical","true","","reload","1"],["analytics","false"],["otherCookie","true"],["saveCookie","true"],["userAcceptsCookies","1"],["grnk-cookies-accepted","true"],["acceptCookies","no"],["acceptCookies","true"],["has-dismissed","1"],["hasAcceptedGdpr","true"],["lw-accepts-cookies","true"],["cookies-accept","true"],["load-scripts-v2","2"],["acceptsAnalyticsCookies","false"],["acceptsNecessaryCookies","true"],["display_cookie_modal","false"],["pg-accept-cookies","true"],["__EOBUWIE__consents_accepted","true","","reload","1"],["canada-cookie-acknowledge","1"],["FP_cookiesAccepted","true"],["VISITED_0","true"],["OPTIONAL_COOKIES_ACCEPTED_0","true"],["storagePermission","true"],["set_cookie_stat","false"],["set_cookie_tracking","false"],["df-cookies-allowed","true"],["cookie-consent","1"],["userConsented","false"],["cookieConsent","necessary"],["gdpr-done","true"],["isTrackingAllowed","false"],["legalsAccepted","true"],["COOKIE_CONSENT_STATUS_4124","\"dismissed\""],["cookie_accepted","-1"],["cookie-policy","approve"],["consentInteraction","true"]];
const hostnamesMap = new Map([["code.likeagirl.io",0],["engineering.mixpanel.com",0],["betterprogramming.pub",0],["medium.com",0],["500ish.com",0],["gitconnected.com",0],["bettermarketing.pub",0],["diylifetech.com",0],["thebolditalic.com",0],["writingcooperative.com",0],["fanfare.pub",0],["betterhumans.pub",0],["nhnieuws.nl",[1,2,3]],["omroepbrabant.nl",[1,2,3]],["posthog.com",4],["polar.sh",4],["esto.eu",5],["ctol.digital",5],["beterbed.nl",6],["chavesnamao.com.br",7],["anhanguera.com",8],["bhaskar.com",9],["novaventa.com",10],["privacy.com.br",11],["supabase.com",12],["app.getgrass.io",13],["sanluisgarbage.com",14],["wildberries.ru",15],["cryptorank.io",16],["springmerchant.com",17],["veed.io",18],["varusteleka.com",19],["deribit.com",19],["dorkgpt.com",19],["zoho.com",20],["femibion.rs",21],["nove.fr",21],["movies4us.*",22],["popcornmovies.to",22],["improvethenews.org",22],["plente.com",22],["villagrancanaria.com",23],["baic.cz",24],["bunq.com",25],["framer.com",25],["inceptionlabs.ai",25],["zave.it",25],["tower.dev",25],["fleksberegner.dk",26],["duty.travel.cl",27],["solscan.io",28],["connorduffy.abundancerei.com",29],["bc.gamem",30],["akkushop-turkiye.com.tr",31],["k33.com",[32,33]],["komdigi.go.id",34],["fijiairways.com",35],["planner.kaboodle.co.nz",36],["pedalcommander.*",37],["sekisuialveo.com",[38,39]],["rightsize.dk",40],["random-group.olafneumann.org",41],["espadrij.com",42],["hygiene-shop.eu",42],["gesundheitsmanufaktur.de",[42,274]],["technikmuseum.berlin",43],["cvut.cz",[44,45,46]],["r-ulybka.ru",47],["voltadol.at",48],["evium.de",49],["gpuscout.nl",50],["remanga.org",50],["comnet.com.tr",50],["auth.hiring.amazon.com",50],["parrotsec.org",50],["shonenjumpplus.com",51],["engeldirekt.de",52],["haleon-gebro.at",[53,54]],["spectrumtherapeutics.com",55],["puregoldprotein.com",[55,62,63]],["thingtesting.com",55],["streamclipsgermany.de",55],["bo3.gg",55],["happyplates.com",[56,57]],["ickonic.com",58],["abs-cbn.com",59],["news.abs-cbn.com",59],["opmaatzagen.nl",60],["mundwerk-rottweil.de",60],["sqlook.com",61],["adef-emploi.fr",[64,65]],["lumieresdelaville.net",[64,65]],["ccaf.io",[66,67]],["dbschenkerarkas.com.tr",68],["dbschenker-seino.jp",68],["dbschenker.com",[68,160]],["scinapse.io",69],["shop.ba.com",[70,71]],["uc.pt",72],["bennettrogers.mysight.uk",73],["snipp.gg",73],["leafly.com",74],["geizhals.at",75],["geizhals.de",75],["geizhals.eu",75],["cenowarka.pl",75],["skinflint.co.uk",75],["webhallen.com",[76,77,78]],["olx.com.br",79],["unobike.com",80],["mod.io",81],["rodrigue-app.ct.ws",82],["passport-photo.online",82],["mojmaxtv.hrvatskitelekom.hr",82],["tme.eu",83],["mein-osttirol.rocks",84],["tennessine.co.uk",85],["ultraleds.co.uk",86],["greubelforsey.com",87],["lukify.app",88],["studiobookr.com",89],["getgrass.io",90],["artisan.co",91],["mobilefuse.com",92],["safe.global",[93,213]],["data.carbonmapper.org",94],["avica.link",95],["madeiramadeira.com.br",96],["sberdisk.ru",97],["column.com",98],["iqoption.com",99],["dopesnow.com",100],["montecwear.com",100],["romeo.com",101],["sonyliv.com",[102,103]],["cwallet.com",104],["oneskin.co",105],["telemetr.io",106],["near.org",107],["near.ai",107],["dev.near.org",108],["jito.network",109],["jito.wtf",109],["goodpods.com",110],["pngtree.com",[111,112]],["v2.xmeye.net",113],["venom.foundation",114],["canonvannederland.nl",115],["my-account.storage-mart.com",116],["web.bunq.com",117],["lifesum.com",118],["home.shortcutssoftware.com",119],["klimwinkel.nl",120],["markimicrowave.com",121],["aerolineas.com.ar",122],["5sim.net",122],["fold.dev",123],["mojposao.hr",124],["temu.com",[125,126]],["supreme.com",[127,128]],["g-star.com",129],["sawren.pl",130],["ultrahuman.com",131],["optionsgroup.com",132],["withpersona.com",[133,134]],["trigger.dev",135],["core.app",[136,138]],["zora.co",137],["kokku-online.de",139],["cuba-buddy.de",140],["datamask.app",141],["humandataincome.com",141],["crealitycloud.com",142],["triumphtechnicalinformation.com",143],["businessclass.com",144],["livsstil.se",145],["schneidewind-immobilien.de",146],["textshuttle.com",147],["simpleswap.io",148],["wales.nhs.attendanywhere.com",149],["sacal.it",150],["astondevs.ru",151],["gonxt.com",152],["geomiq.com",153],["bbc.com",154],["galaxy.com",155],["ticketmelon.com",156],["pechinchou.com.br",157],["thehub21.com",158],["archiup.com",159],["autoride.cz",[161,162,163]],["autoride.es",[161,162,163]],["autoride.io",[161,162,163]],["autoride.sk",[161,162,163]],["wunderground.com",164],["baselime.io",165],["eversports.de",[166,167]],["makerz.me",168],["reebok.eu",169],["alfa.com.ec",170],["rts.com.ec",170],["tropicalida.com.ec",170],["owgr.com",[171,172]],["beermerchants.com",173],["saamexe.com",[174,175]],["helium.com",174],["app.bionic-reading.com",176],["nloto.ru",177],["swisstours.com",178],["librinova.com",179],["format.bike",180],["khanacademy.org",181],["etelecinema.hu",182],["konicaminolta.com",183],["soquest.xyz",184],["region-bayreuth.de",185],["nationalexpress.de",186],["eezy.nrw",186],["bahnland-bayern.de",186],["chipcitycookies.com",187],["6amgroup.com",187],["go.bkk.hu",187],["worldlibertyfinancial.com",187],["happiful.com",187],["bazaartracker.com",188],["subscribercounter.com",189],["app.klarna.com",[190,191,192]],["instantspoursoi.fr",193],["thealliance.ai",194],["vivenu.com",195],["librumreader.com",196],["visnos.com",197],["polypane.app",198],["changelly.com",199],["glose.com",200],["yellow.systems",201],["renebieder.com",202],["goodram.com",203],["starwalk.space",204],["vitotechnology.com",204],["codedead.com",205],["studiofabiobiesel.com",206],["fydeos.com",207],["fydeos.io",207],["jove.com",208],["argent.xyz",209],["pixeden.com",210],["akasha.org",211],["ashleyfurniture.com",212],["jibjab.com",214],["filmzie.com",215],["vietjetair.com",216],["kick.com",217],["jimdosite.com",218],["worstbassist.com",218],["cora-broodjes.nl",218],["evernote.com",[219,220]],["octopusenergy.co.jp",221],["findmcserver.com",222],["schneideranwaelte.de",223],["traefik.io",223],["cityfalcon.ai",224],["digitalparking.city",225],["mediathekviewweb.de",226],["solana.com",227],["ef.co.id",228],["alohafromdeer.com",229],["fwd.com",[230,232]],["everywhere.game",231],["geotastic.net",233],["tattoodo.com",[234,235]],["garageproject.co.nz",234],["jmonline.com.br",236],["atlas.workland.com",236],["virginexperiencedays.co.uk",236],["emag.berliner-woche.de",[237,238,239]],["nordkurier.de",[237,238,239]],["everest-24.pl",[240,241]],["sneakerfreaker.com",242],["cryptofalka.hu",242],["walmart.ca",243],["byfood.com",244],["andsafe.de",245],["edostavka.by",246],["emall.by",246],["ishoppurium.com",247],["onexstore.pl",[248,249,250]],["revanced.app",250],["evropochta.by",[251,252]],["inselberlin.de",253],["gronkh.tv",254],["adfilteringdevsummit.com",255],["dailyrevs.com",256],["dsworks.ru",256],["daraz.com",257],["learngerman.dw.com",258],["leeway.tech",259],["gostanford.com",260],["namensetiketten.de",261],["drafthound.com",[262,263]],["wokularach.pl",264],["bidup.amtrak.com",265],["eschuhe.de",266],["zeglins.com",267],["flyingpapers.com",268],["beta.character.ai",[269,270]],["bittimittari.fi",271],["aida64.co.uk",[272,273]],["aida64.com.ua",[272,273]],["aida64.de",[272,273]],["aida64.hu",[272,273]],["aida64.it",[272,273]],["aida64russia.com",[272,273]],["open24.ee",274],["116117.fi",275],["pjspub.com",276],["autodude.dk",277],["autodude.fi",277],["autodude.no",277],["autodude.se",277],["valostore.fi",277],["valostore.no",277],["valostore.se",277],["vivantis.*",278],["vivantis-shop.at",278],["krasa.cz",278],["auf1.tv",279],["wesendit.com",280],["hatch.co",281],["gdh.digital",282],["haberturk.com",283],["ioplus.nl",284]]);
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
