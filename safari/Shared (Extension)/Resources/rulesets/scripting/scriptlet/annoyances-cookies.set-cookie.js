/*******************************************************************************

    uBlock Origin - a browser extension to block requests.
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

/* jshint esversion:11 */
/* global cloneInto */

'use strict';

// ruleset: annoyances-cookies

/******************************************************************************/

// Important!
// Isolate from global scope

// Start of local scope
(( ) => {

/******************************************************************************/

// Start of code to inject
const uBOL_setCookie = function() {

const scriptletGlobals = new Map(); // jshint ignore: line

const argsList = [["cookiePrefAnalytics","0"],["cookiePrefMarketing","0"],["cookiePrefThirdPartyApplications","0"],["cookie-banner-acceptance-state","true"],["consentInteract","true"],["cookielawinfo-checkbox-advertisement","yes"],["cookielawinfo-checkbox-functional","yes"],["cookielawinfo-checkbox-necessary","yes"],["viewed_cookie_policy","yes"],["bm_acknowledge","yes"],["consent","1"],["cookies_ok","true"],["kali-cc-agreed","true"],["AcceptedCookies","1"],["userCookieConsent","true"],["hasSeenCookiePopUp","yes"],["CookieConsent","true"],["userCookies","true"],["privacy-policy-accepted","1"],["IsCookieAccepted","yes","","reload","1"],["gatsby-gdpr-google-tagmanager","true"],["legalOk","true"],["cp_cc_stats","1","","reload","1"],["cp_cc_ads","1"],["cookie-disclaimer","1"],["gdpr","1"],["accept-cookies","true"],["statistik","0"],["cookies-informer-close","true"],["cookie-consent","true"],["gdpr","0"],["required","1"],["ING_GPT","0"],["ING_GPP","0"],["cookiepref","1"],["shb-consent-cookies","true"],["cookies_consent","1"],["termos-aceitos","ok"],["ui-tnc-agreed","true"],["cookie-preference","1"],["accept_cookie","1"],["cookieconsent_status_new","3"],["_acceptCookies","1","","reload","1"],["_reiff-consent-cookie","yes"],["snc-cp","1"],["cookies-accepted","true"],["cookies-required","1","","reload","1"],["isReadCookiePolicyDNTAa","true"],["acceptCookies","true"],["mubi-cookie-consent","allow"],["isReadCookiePolicyDNT","Yes"],["ce-cookie","N"],["ivc_consent","3"],["cookie_accepted","1"],["cookie_accepted","true"],["UserCookieLevel","1"],["sat_track","false"],["Rodo","1"],["cookie_privacy_on","1"],["cookies-marketing","false"],["cookies-functional","true"],["cookies-preferences","false"],["__cf_gdpr_accepted","false"],["3t-cookies-essential","1"],["3t-cookies-functional","1"],["3t-cookies-performance","0"],["3t-cookies-social","0"],["allow_cookies_marketing","0"],["allow_cookies_tracking","0"],["cookie_prompt_dismissed","1"],["cookies_enabled","1"],["cookie","1","","reload","1"],["cookie-analytics","0"],["cc-set","1","","reload","1"],["allowCookies","1","","reload","1"],["rgp-gdpr-policy","1"],["jt-jobseeker-gdpr-banner","true","","reload","1"],["cookie-preferences-analytics","no"],["cookie-preferences-marketing","no"],["withings_cookieconsent_dismissed","1"],["cookieconsent_advertising","false"],["cookieconsent_statistics","false"],["CP_ESSENTIAL","1"],["CP_PREFERENCES","1"],["amcookie_allowed","1"],["pc_analitica_bizkaia","false"],["pc_preferencias_bizkaia","true"],["pc_tecnicas_bizkaia","true"],["gdrp_popup_showed","1"],["cookie_consent_accept","true"],["cookie-preferences-technical","yes"],["gdpr__google__analytics","false"],["gdpr__depop__functional","true"],["tracking_cookie","1"],["cookie-preference","2"],["cookie-preference_auto_accept","1"],["cookie-preference_renew7","1"],["pc234978122321234","1"],["ck_pref_all","1"],["ONCOSURCOOK","2"],["RY_COOKIE_CONSENT","true"],["cookieConsent","true","","reload","1"],["videoConsent","true"],["comfortConsent","true"],["cookieBannerAccepted","1","","reload","1"],["cookieMsg","true","","reload","1"],["abz_seo_choosen","1"],["ARE_DSGVO_PREFERENCES_SUBMITTED","true"],["dsgvo_consent","1"],["efile-cookiename-28","1"],["efile-cookiename-74","1"],["cookie_policy_closed","1","","reload","1"],["gvCookieConsentAccept","1","reload","","1"],["acceptEssential","1"],["baypol_banner","true"],["nagAccepted","true"],["baypol_functional","true"],["CookieConsent","OK"],["viewed_cookie_policy","yes","","reload","1"],["BM_Advertising","false","","reload","1"],["BM_User_Experience","true"],["BM_Analytics","false"],["DmCookiesAccepted","true","","reload","1"],["DmCookiesMarketing","false"],["DmCookiesAnalytics","false"],["cookietypes","OK"],["consent_setting","OK","","reload","1"],["user_accepts_cookies","true"],["gdpr_agreed","4"],["ra-cookie-disclaimer-11-05-2022","true"],["acceptMatomo","true"],["UBI_PRIVACY_POLICY_ACCEPTED","true"],["UBI_PRIVACY_POLICY_VIEWED","true"],["UBI_PRIVACY_VID_OPTOUT","false"],["UBI_PRIVACY_VIDEO_OPTOUT","false"],["BRITISHAIRWAYS_ENSIGHTEN_PRIVACY_BANNER_LOADED","1"],["BRITISHAIRWAYS_ENSIGHTEN_PRIVACY_BANNER_VIEWED","1"],["BRITISHAIRWAYS_ENSIGHTEN_PRIVACY_Functional","1"],["ARE_FUNCTIONAL_COOKIES_ACCEPTED","true"],["ARE_MARKETING_COOKIES_ACCEPTED","true"],["ARE_REQUIRED_COOKIES_ACCEPTED","true"],["HAS_COOKIES_FORM_SHOWED","true"],["accepted_functional","yes"],["accepted_marketing","no"],["allow_the_cookie","yes"],["cookie_visited","true"],["drcookie","true"],["wed_cookie_info","1"],["acceptedCookies","true"],["cookieMessageHide","true"],["sq","3"],["notice_preferences","2"],["cookie_consent_all","1"],["eb_cookie_agree","1"],["sc-cookies-accepted","true"],["ccpa-notice-viewed-02","true"],["cookieConsent","yes"],["cookieConsent","true"],["plenty-shop-cookie","0"],["acceptedPolicy","true"],["cookie-consent","false"],["consent-analytics","false"],["cookieConsentClosed","true"],["_tvsPrivacy","true"],["epCookieConsent","1","","reload","1"],["intro","true"],["SeenCookieBar","true"],["AllowCookies","true"],["cookiesAccepted","3"],["cookiesAccepted","true"],["gdpr_dismissal","true"],["uev2.gg","true"],["closeNotificationAboutCookie","true"],["cookie-policy","true"],["allowCookie","1","","reload","1"],["bitso_cc","1"],["AcceptKeksit","0","","reload","1"],["cookiepref","true"],["cookieconsent_status","1"],["PVH_COOKIES_GDPR","Accept"],["PVH_COOKIES_GDPR_SOCIALMEDIA","Reject"],["PVH_COOKIES_GDPR_ANALYTICS","Reject"],["notice_preferences","1"],["gdpr_opt_in","1"],["cookie_policy_agreement","3"]];

const hostnamesMap = new Map([["fish.shimano.com",[0,1,2]],["melectronics.ch",3],["zeitzurtrauer.de",4],["swnsdigital.com",[5,6,7,8]],["bringmeister.de",9],["leibniz.com",10],["project529.com",11],["clearblue.com",12],["more.com",13],["nwslsoccer.com",13],["climatecentral.org",14],["resolution.de",15],["dentmania.de",16],["eatsalad.com",17],["pacstall.dev",18],["de-appletradein.likewize.com",19],["swissborg.com",20],["qwice.com",21],["canalpluskuchnia.pl",[22,23]],["uizard.io",24],["e-chladiva.cz",25],["assos.com",26],["monese.com",26],["stmas.bayern.de",[27,31]],["novayagazeta.eu",28],["followalice.com",[29,160]],["kinopoisk.ru",30],["yandex.ru",30],["ing.it",[32,33]],["ing.nl",34],["handelsbanken.se",35],["secondsol.com",36],["youcom.com.br",37],["rule34.paheal.net",38],["0815.at",39],["0815.eu",39],["ojskate.com",39],["der-schweighofer.de",39],["tz-bedarf.de",39],["zeinpharma.de",39],["weicon.com",39],["dagvandewebshop.be",39],["thiele-tee.de",39],["carbox.de",39],["riapsport.de",39],["trendpet.de",39],["eheizung24.de",39],["seemueller.com",39],["vivande.de",39],["heidegrill.com",39],["gladiator-fightwear.com",39],["h-andreas.com",39],["pp-parts.com",39],["natuerlich-holzschuhe.de",39],["massivart.de",39],["malermeister-shop.de",39],["imping-confiserie.de",39],["lenox-trading.at",39],["cklenk.de",39],["catolet.de",39],["drinkitnow.de",39],["patisserie-m.de",39],["storm-proof.com",39],["balance-fahrradladen.de",39],["magicpos.shop",39],["zeinpharma.com",39],["sps-handel.net",39],["novagenics.com",39],["butterfly-circus.de",39],["holzhof24.de",39],["fleurop.de",39],["leki.com",39],["pccomponentes.com",40],["oead.at",41],["innovationsstiftung-bildung.at",41],["etwinning.at",41],["arqa-vet.at",41],["zentrumfuercitizenscience.at",41],["vorstudienlehrgang.at",41],["erasmusplus.at",41],["jeger.pl",42],["bo.de",43],["thegamingwatcher.com",44],["webtv.stofa.dk",45],["melkkobrew.fi",46],["asus.com.cn",[47,50]],["zentalk.asus.com",[47,50]],["trouwenbijfletcher.nl",48],["fletcher.nl",48],["fletcherzakelijk.nl",48],["intermatic.com",48],["mubi.com",49],["carsupermarket.com",51],["lawrievetgroup.co.uk",52],["59northwheels.se",53],["foto-gregor.de",54],["dhbbank.com",55],["dhbbank.de",55],["dhbbank.be",55],["dhbbank.nl",55],["login.ingbank.pl",56],["fabrykacukiernika.pl",[57,58]],["playlumi.com",[59,60,61]],["chatfuel.com",62],["studio3t.com",[63,64,65,66]],["realgap.co.uk",[67,68,69,70]],["hotelborgia.com",[71,72]],["sweet24.de",73],["zwembaddekouter.be",74],["flixclassic.pl",75],["jobtoday.com",76],["deltatre.com",[77,78,90]],["withings.com",[79,80,81]],["gift.be",[82,83]],["animaze.us",84],["bizkaia.eus",[85,86,87]],["sinparty.com",88],["jobs.ch",89],["jobup.ch",89],["depop.com",[91,92]],["mantel.com",93],["armedangels.com",[94,95,96]],["e-dojus.lv",97],["burnesspaull.com",98],["oncosur.org",99],["ryanair.com",100],["bayernportal.de",[101,102,103]],["pricehubble.com",104],["ilmotorsport.de",105],["aqua-store.fr",106],["app.arzt-direkt.de",107],["dasfutterhaus.at",108],["e-pity.pl",109],["fillup.pl",110],["dailymotion.com",111],["barcawelt.de",112],["lueneburger-heide.de",113],["polizei.bayern.de",[114,116]],["ourworldofpixels.com",115],["jku.at",117],["espacocasa.com",118],["altraeta.it",118],["centrooceano.it",118],["allstoresdigital.com",118],["cultarm3d.de",118],["soulbounce.com",118],["fluidtopics.com",118],["uvetgbt.com",118],["malcorentacar.com",118],["emondo.de",118],["maspero.it",118],["kelkay.com",118],["underground-england.com",118],["vert.eco",118],["turcolegal.com",118],["magnet4blogging.net",118],["moovly.com",118],["automationafrica.co.za",118],["jornaldoalgarve.pt",118],["keravanenergia.fi",118],["kuopas.fi",118],["frag-machiavelli.de",118],["healthera.co.uk",118],["mobeleader.com",118],["powerup-gaming.com",118],["developer-blog.net",118],["medical.edu.mt",118],["deh.mt",118],["bluebell-railway.com",118],["ribescasals.com",118],["javea.com",118],["chinaimportal.com",118],["inds.co.uk",118],["raoul-follereau.org",118],["serramenti-milano.it",118],["cosasdemujer.com",118],["luz-blanca.info",118],["cosasdeviajes.com",118],["safehaven.io",118],["havocpoint.it",118],["motofocus.pl",118],["nomanssky.com",118],["drei-franken-info.de",118],["clausnehring.com",118],["alttab.net",118],["kinderleicht.berlin",118],["kiakkoradio.fi",118],["cosasdelcaribe.es",118],["de-sjove-jokes.dk",118],["serverprofis.de",118],["biographyonline.net",118],["iziconfort.com",118],["sportinnederland.com",118],["natureatblog.com",118],["wtsenergy.com",118],["cosasdesalud.es",118],["internetpasoapaso.com",118],["zurzeit.at",118],["contaspoupanca.pt",118],["backmarket.de",[119,120,121]],["backmarket.co.uk",[119,120,121]],["backmarket.es",[119,120,121]],["backmarket.be",[119,120,121]],["backmarket.at",[119,120,121]],["backmarket.fr",[119,120,121]],["backmarket.gr",[119,120,121]],["backmarket.fi",[119,120,121]],["backmarket.ie",[119,120,121]],["backmarket.it",[119,120,121]],["backmarket.nl",[119,120,121]],["backmarket.pt",[119,120,121]],["backmarket.se",[119,120,121]],["backmarket.sk",[119,120,121]],["backmarket.com",[119,120,121]],["eleven-sportswear.cz",[122,123,124]],["silvini.com",[122,123,124]],["silvini.de",[122,123,124]],["purefiji.cz",[122,123,124]],["voda-zdarma.cz",[122,123,124]],["lesgarconsfaciles.com",[122,123,124]],["ulevapronohy.cz",[122,123,124]],["vitalvibe.eu",[122,123,124]],["plavte.cz",[122,123,124]],["mo-tools.cz",[122,123,124]],["flamantonlineshop.cz",[122,123,124]],["sandratex.cz",[122,123,124]],["norwayshop.cz",[122,123,124]],["3d-foto.cz",[122,123,124]],["neviditelnepradlo.cz",[122,123,124]],["nutrimedium.com",[122,123,124]],["silvini.cz",[122,123,124]],["karel.cz",[122,123,124]],["silvini.sk",[122,123,124]],["book-n-drive.de",125],["cotswoldoutdoor.com",126],["cotswoldoutdoor.ie",126],["cam.start.canon",127],["usnews.com",128],["researchaffiliates.com",129],["singkinderlieder.de",130],["store.ubisoft.com",[131,132,133,134]],["britishairways.com",[135,136,137]],["cineman.pl",[138,139,140]],["tv-trwam.pl",[138,139,140,141]],["qatarairways.com",[142,143,144,145,146]],["wedding.pl",147],["vivaldi.com",148],["emuia1.gugik.gov.pl",149],["nike.com",150],["adidas.at",151],["adidas.be",151],["adidas.ca",151],["adidas.ch",151],["adidas.cl",151],["adidas.co",151],["adidas.co.in",151],["adidas.co.kr",151],["adidas.co.nz",151],["adidas.co.th",151],["adidas.co.uk",151],["adidas.com",151],["adidas.com.ar",151],["adidas.com.au",151],["adidas.com.br",151],["adidas.com.my",151],["adidas.com.ph",151],["adidas.com.vn",151],["adidas.cz",151],["adidas.de",151],["adidas.dk",151],["adidas.es",151],["adidas.fi",151],["adidas.fr",151],["adidas.gr",151],["adidas.ie",151],["adidas.it",151],["adidas.mx",151],["adidas.nl",151],["adidas.no",151],["adidas.pe",151],["adidas.pl",151],["adidas.pt",151],["adidas.ru",151],["adidas.se",151],["adidas.sk",151],["colourbox.com",152],["ebilet.pl",153],["snap.com",154],["ratemyprofessors.com",155],["filen.io",156],["restaurantclub.pl",157],["stilord.com",158],["stilord.pl",158],["stilord.de",158],["stilord.fr",158],["quantamagazine.org",159],["scaleway.com",161],["hellotv.nl",162],["lasestrellas.tv",163],["shop-naturstrom.de",164],["biona-shop.de",164],["camokoenig.de",164],["bikepro.de",164],["kaffeediscount.com",164],["vamos-skateshop.com",164],["holland-shop.com",164],["officesuite.com",165],["fups.com",[166,167]],["scienceopen.com",168],["buidlbox.io",169],["calendly.com",170],["ubereats.com",171],["101internet.ru",172],["tunnelmb.net",173],["hitado.de",174],["bitso.com",175],["eco-toimistotarvikkeet.fi",176],["proficient.fi",176],["developer.ing.com",177],["ehealth.gov.gr",178],["larian.com",178],["calvinklein.se",[179,180,181]],["calvinklein.fi",[179,180,181]],["calvinklein.sk",[179,180,181]],["calvinklein.si",[179,180,181]],["calvinklein.ch",[179,180,181]],["calvinklein.ru",[179,180,181]],["calvinklein.com",[179,180,181]],["calvinklein.pt",[179,180,181]],["calvinklein.pl",[179,180,181]],["calvinklein.at",[179,180,181]],["calvinklein.nl",[179,180,181]],["calvinklein.hu",[179,180,181]],["calvinklein.lu",[179,180,181]],["calvinklein.lt",[179,180,181]],["calvinklein.lv",[179,180,181]],["calvinklein.it",[179,180,181]],["calvinklein.ie",[179,180,181]],["calvinklein.hr",[179,180,181]],["calvinklein.fr",[179,180,181]],["calvinklein.es",[179,180,181]],["calvinklein.ee",[179,180,181]],["calvinklein.de",[179,180,181]],["calvinklein.dk",[179,180,181]],["calvinklein.cz",[179,180,181]],["calvinklein.bg",[179,180,181]],["calvinklein.be",[179,180,181]],["calvinklein.co.uk",[179,180,181]],["formula1.com",182],["howstuffworks.com",183],["chollometro.com",184],["dealabs.com",184],["hotukdeals.com",184],["pepper.it",184],["pepper.pl",184],["preisjaeger.at",184],["mydealz.de",184]]);

const entitiesMap = new Map([]);

const exceptionsMap = new Map([]);

/******************************************************************************/

function setCookie(
    name = '',
    value = '',
    path = ''
) {
    if ( name === '' ) { return; }
    name = encodeURIComponent(name);

    const validValues = [
        'true', 'false',
        'yes', 'y', 'no', 'n',
        'ok',
        'accept', 'reject',
        'allow', 'deny',
    ];
    if ( validValues.includes(value.toLowerCase()) === false ) {
        if ( /^\d+$/.test(value) === false ) { return; }
        const n = parseInt(value, 10);
        if ( n > 15 ) { return; }
    }
    value = encodeURIComponent(value);

    setCookieHelper(
        name,
        value,
        '',
        path,
        safeSelf().getExtraArgs(Array.from(arguments), 3)
    );
}

function safeSelf() {
    if ( scriptletGlobals.has('safeSelf') ) {
        return scriptletGlobals.get('safeSelf');
    }
    const self = globalThis;
    const safe = {
        'Error': self.Error,
        'Object_defineProperty': Object.defineProperty.bind(Object),
        'RegExp': self.RegExp,
        'RegExp_test': self.RegExp.prototype.test,
        'RegExp_exec': self.RegExp.prototype.exec,
        'XMLHttpRequest': self.XMLHttpRequest,
        'addEventListener': self.EventTarget.prototype.addEventListener,
        'removeEventListener': self.EventTarget.prototype.removeEventListener,
        'fetch': self.fetch,
        'jsonParse': self.JSON.parse.bind(self.JSON),
        'jsonStringify': self.JSON.stringify.bind(self.JSON),
        'log': console.log.bind(console),
        uboLog(...args) {
            if ( args.length === 0 ) { return; }
            if ( `${args[0]}` === '' ) { return; }
            this.log('[uBO]', ...args);
        },
        initPattern(pattern, options = {}) {
            if ( pattern === '' ) {
                return { matchAll: true };
            }
            const expect = (options.canNegate === true && pattern.startsWith('!') === false);
            if ( expect === false ) {
                pattern = pattern.slice(1);
            }
            const match = /^\/(.+)\/([gimsu]*)$/.exec(pattern);
            if ( match !== null ) {
                return {
                    pattern,
                    re: new this.RegExp(
                        match[1],
                        match[2] || options.flags
                    ),
                    expect,
                };
            }
            return {
                pattern,
                re: new this.RegExp(pattern.replace(
                    /[.*+?^${}()|[\]\\]/g, '\\$&'),
                    options.flags
                ),
                expect,
            };
        },
        testPattern(details, haystack) {
            if ( details.matchAll ) { return true; }
            return this.RegExp_test.call(details.re, haystack) === details.expect;
        },
        patternToRegex(pattern, flags = undefined) {
            if ( pattern === '' ) { return /^/; }
            const match = /^\/(.+)\/([gimsu]*)$/.exec(pattern);
            if ( match === null ) {
                return new RegExp(pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), flags);
            }
            try {
                return new RegExp(match[1], match[2] || flags);
            }
            catch(ex) {
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
            return Object.fromEntries(entries);
        },
    };
    scriptletGlobals.set('safeSelf', safe);
    return safe;
}

function setCookieHelper(
    name = '',
    value = '',
    expires = '',
    path = '',
    options = {},
) {
    const cookieExists = (name, value) => {
        return document.cookie.split(/\s*;\s*/).some(s => {
            const pos = s.indexOf('=');
            if ( pos === -1 ) { return false; }
            if ( s.slice(0, pos) !== name ) { return false; }
            if ( s.slice(pos+1) !== value ) { return false; }
            return true;
        });
    };

    if ( options.reload && cookieExists(name, value) ) { return; }

    const cookieParts = [ name, '=', value ];
    if ( expires !== '' ) {
        cookieParts.push('; expires=', expires);
    }

    if ( path === '' ) { path = '/'; }
    else if ( path === 'none' ) { path = ''; }
    if ( path !== '' && path !== '/' ) { return; }
    if ( path === '/' ) {
        cookieParts.push('; path=/');
    }
    document.cookie = cookieParts.join('');

    if ( options.reload && cookieExists(name, value) ) {
        window.location.reload();
    }
}

/******************************************************************************/

const hnParts = [];
try { hnParts.push(...document.location.hostname.split('.')); }
catch(ex) { }
const hnpartslen = hnParts.length;
if ( hnpartslen === 0 ) { return; }

const todoIndices = new Set();
const tonotdoIndices = [];

// Exceptions
if ( exceptionsMap.size !== 0 ) {
    for ( let i = 0; i < hnpartslen; i++ ) {
        const hn = hnParts.slice(i).join('.');
        const excepted = exceptionsMap.get(hn);
        if ( excepted ) { tonotdoIndices.push(...excepted); }
    }
    exceptionsMap.clear();
}

// Hostname-based
if ( hostnamesMap.size !== 0 ) {
    const collectArgIndices = hn => {
        let argsIndices = hostnamesMap.get(hn);
        if ( argsIndices === undefined ) { return; }
        if ( typeof argsIndices === 'number' ) { argsIndices = [ argsIndices ]; }
        for ( const argsIndex of argsIndices ) {
            if ( tonotdoIndices.includes(argsIndex) ) { continue; }
            todoIndices.add(argsIndex);
        }
    };
    for ( let i = 0; i < hnpartslen; i++ ) {
        const hn = hnParts.slice(i).join('.');
        collectArgIndices(hn);
    }
    collectArgIndices('*');
    hostnamesMap.clear();
}

// Entity-based
if ( entitiesMap.size !== 0 ) {
    const n = hnpartslen - 1;
    for ( let i = 0; i < n; i++ ) {
        for ( let j = n; j > i; j-- ) {
            const en = hnParts.slice(i,j).join('.');
            let argsIndices = entitiesMap.get(en);
            if ( argsIndices === undefined ) { continue; }
            if ( typeof argsIndices === 'number' ) { argsIndices = [ argsIndices ]; }
            for ( const argsIndex of argsIndices ) {
                if ( tonotdoIndices.includes(argsIndex) ) { continue; }
                todoIndices.add(argsIndex);
            }
        }
    }
    entitiesMap.clear();
}

// Apply scriplets
for ( const i of todoIndices ) {
    try { setCookie(...argsList[i]); }
    catch(ex) {}
}
argsList.length = 0;

/******************************************************************************/

};
// End of code to inject

/******************************************************************************/

// Inject code

// https://bugzilla.mozilla.org/show_bug.cgi?id=1736575
//   'MAIN' world not yet supported in Firefox, so we inject the code into
//   'MAIN' ourself when environment in Firefox.

// Not Firefox
if ( typeof wrappedJSObject !== 'object' ) {
    return uBOL_setCookie();
}

// Firefox
{
    const page = self.wrappedJSObject;
    let script, url;
    try {
        page.uBOL_setCookie = cloneInto([
            [ '(', uBOL_setCookie.toString(), ')();' ],
            { type: 'text/javascript; charset=utf-8' },
        ], self);
        const blob = new page.Blob(...page.uBOL_setCookie);
        url = page.URL.createObjectURL(blob);
        const doc = page.document;
        script = doc.createElement('script');
        script.async = false;
        script.src = url;
        (doc.head || doc.documentElement || doc).append(script);
    } catch (ex) {
        console.error(ex);
    }
    if ( url ) {
        if ( script ) { script.remove(); }
        page.URL.revokeObjectURL(url);
    }
    delete page.uBOL_setCookie;
}

/******************************************************************************/

// End of local scope
})();

/******************************************************************************/

void 0;
