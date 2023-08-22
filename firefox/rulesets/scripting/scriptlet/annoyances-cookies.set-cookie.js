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

const argsList = [["cookies_ok","true"],["kali-cc-agreed","true"],["AcceptedCookies","1"],["userCookieConsent","true"],["CookieConsent","true"],["gatsby-gdpr-google-tagmanager","true"],["legalOk","true"],["cp_cc_stats","1","","reload","1"],["cp_cc_ads","1"],["cookie-disclaimer","1"],["gdpr","1"],["accept-cookies","true"],["statistik","0"],["cookies-informer-close","true"],["cookie-consent","true"],["gdpr","0"],["required","1"],["ING_GPT","0"],["ING_GPP","0"],["cookiepref","1"],["shb-consent-cookies","true"],["cookies_consent","1"],["termos-aceitos","ok"],["ui-tnc-agreed","true"],["cookie-preference","1"],["accept_cookie","1"],["cookieconsent_status_new","3"],["_acceptCookies","1","","reload","1"],["_reiff-consent-cookie","yes"],["snc-cp","1"],["cookies-accepted","true"],["cookies-required","1","","reload","1"],["isReadCookiePolicyDNTAa","true"],["acceptCookies","true"],["mubi-cookie-consent","allow"],["isReadCookiePolicyDNT","Yes"],["ce-cookie","N"],["ivc_consent","3"],["cookie_accepted","1"],["cookie_accepted","true"],["UserCookieLevel","1"],["sat_track","false"],["Rodo","1"],["cookie_privacy_on","1"],["cookies-marketing","false"],["cookies-functional","true"],["cookies-preferences","false"],["__cf_gdpr_accepted","false"],["3t-cookies-essential","1"],["3t-cookies-functional","1"],["3t-cookies-performance","0"],["3t-cookies-social","0"],["allow_cookies_marketing","0"],["allow_cookies_tracking","0"],["cookie_prompt_dismissed","1"],["cookies_enabled","1"],["cookie","1","","reload","1"],["cookie-analytics","0"],["cc-set","1","","reload","1"],["allowCookies","1","","reload","1"],["rgp-gdpr-policy","1"],["jt-jobseeker-gdpr-banner","true","","reload","1"],["cookie-preferences-analytics","no"],["cookie-preferences-marketing","no"],["withings_cookieconsent_dismissed","1"],["cookieconsent_advertising","false"],["cookieconsent_statistics","false"],["CP_ESSENTIAL","1"],["CP_PREFERENCES","1"],["amcookie_allowed","1"],["pc_analitica_bizkaia","false"],["pc_preferencias_bizkaia","true"],["pc_tecnicas_bizkaia","true"],["gdrp_popup_showed","1"],["cookie_consent_accept","true"],["cookie-preferences-technical","yes"],["gdpr__google__analytics","false"],["gdpr__depop__functional","true"],["tracking_cookie","1"],["cookie-preference","2"],["cookie-preference_auto_accept","1"],["cookie-preference_renew7","1"],["pc234978122321234","1"],["ck_pref_all","1"],["ONCOSURCOOK","2"],["RY_COOKIE_CONSENT","true"],["cookieConsent","true","","reload","1"],["videoConsent","true"],["comfortConsent","true"],["cookieBannerAccepted","1","","reload","1"],["cookieMsg","true","","reload","1"],["abz_seo_choosen","1"],["ARE_DSGVO_PREFERENCES_SUBMITTED","true"],["dsgvo_consent","1"],["efile-cookiename-28","1"],["efile-cookiename-74","1"],["cookie_policy_closed","1","","reload","1"],["gvCookieConsentAccept","1","reload","","1"],["acceptEssential","1"],["baypol_banner","true"],["nagAccepted","true"],["baypol_functional","true"],["CookieConsent","OK"],["viewed_cookie_policy","yes","","reload","1"],["BM_Advertising","false","","reload","1"],["BM_User_Experience","true"],["BM_Analytics","false"],["DmCookiesAccepted","true","","reload","1"],["DmCookiesMarketing","false"],["DmCookiesAnalytics","false"],["cookietypes","OK"],["consent_setting","OK","","reload","1"],["user_accepts_cookies","true"],["gdpr_agreed","4"],["ra-cookie-disclaimer-11-05-2022","true"],["acceptMatomo","true"],["UBI_PRIVACY_POLICY_ACCEPTED","true"],["UBI_PRIVACY_POLICY_VIEWED","true"],["UBI_PRIVACY_VID_OPTOUT","false"],["UBI_PRIVACY_VIDEO_OPTOUT","false"],["BRITISHAIRWAYS_ENSIGHTEN_PRIVACY_BANNER_LOADED","1"],["BRITISHAIRWAYS_ENSIGHTEN_PRIVACY_BANNER_VIEWED","1"],["BRITISHAIRWAYS_ENSIGHTEN_PRIVACY_Functional","1"],["ARE_FUNCTIONAL_COOKIES_ACCEPTED","true"],["ARE_MARKETING_COOKIES_ACCEPTED","true"],["ARE_REQUIRED_COOKIES_ACCEPTED","true"],["HAS_COOKIES_FORM_SHOWED","true"],["accepted_functional","yes"],["accepted_marketing","no"],["allow_the_cookie","yes"],["cookie_visited","true"],["drcookie","true"],["wed_cookie_info","1"],["acceptedCookies","true"],["cookieMessageHide","true"],["sq","3"],["notice_preferences","2"],["cookie_consent_all","1"],["eb_cookie_agree","1"],["sc-cookies-accepted","true"],["ccpa-notice-viewed-02","true"],["cookieConsent","yes"],["cookieConsent","true"],["plenty-shop-cookie","0"],["acceptedPolicy","true"],["cookie-consent","false"],["consent-analytics","false"],["cookieConsentClosed","true"],["_tvsPrivacy","true"],["epCookieConsent","1","","reload","1"],["intro","true"],["SeenCookieBar","true"],["AllowCookies","true"],["cookiesAccepted","3"],["cookiesAccepted","true"],["gdpr_dismissal","true"],["uev2.gg","true"],["closeNotificationAboutCookie","true"],["cookie-policy","true"],["allowCookie","1","","reload","1"],["bitso_cc","1"],["AcceptKeksit","0","","reload","1"],["cookiepref","true"],["cookieconsent_status","1"],["PVH_COOKIES_GDPR","Accept"],["PVH_COOKIES_GDPR_SOCIALMEDIA","Reject"],["PVH_COOKIES_GDPR_ANALYTICS","Reject"],["notice_preferences","1"],["gdpr_opt_in","1"],["cookie_policy_agreement","3"]];

const hostnamesMap = new Map([["project529.com",0],["clearblue.com",1],["more.com",2],["nwslsoccer.com",2],["climatecentral.org",3],["dentmania.de",4],["swissborg.com",5],["qwice.com",6],["canalpluskuchnia.pl",[7,8]],["uizard.io",9],["e-chladiva.cz",10],["assos.com",11],["monese.com",11],["stmas.bayern.de",[12,16]],["novayagazeta.eu",13],["followalice.com",[14,145]],["kinopoisk.ru",15],["yandex.ru",15],["ing.it",[17,18]],["ing.nl",19],["handelsbanken.se",20],["secondsol.com",21],["youcom.com.br",22],["rule34.paheal.net",23],["0815.at",24],["0815.eu",24],["ojskate.com",24],["der-schweighofer.de",24],["tz-bedarf.de",24],["zeinpharma.de",24],["weicon.com",24],["dagvandewebshop.be",24],["thiele-tee.de",24],["carbox.de",24],["riapsport.de",24],["trendpet.de",24],["eheizung24.de",24],["seemueller.com",24],["vivande.de",24],["heidegrill.com",24],["gladiator-fightwear.com",24],["h-andreas.com",24],["pp-parts.com",24],["natuerlich-holzschuhe.de",24],["massivart.de",24],["malermeister-shop.de",24],["imping-confiserie.de",24],["lenox-trading.at",24],["cklenk.de",24],["catolet.de",24],["drinkitnow.de",24],["patisserie-m.de",24],["storm-proof.com",24],["balance-fahrradladen.de",24],["magicpos.shop",24],["zeinpharma.com",24],["sps-handel.net",24],["novagenics.com",24],["butterfly-circus.de",24],["holzhof24.de",24],["fleurop.de",24],["leki.com",24],["pccomponentes.com",25],["oead.at",26],["innovationsstiftung-bildung.at",26],["etwinning.at",26],["arqa-vet.at",26],["zentrumfuercitizenscience.at",26],["vorstudienlehrgang.at",26],["erasmusplus.at",26],["jeger.pl",27],["bo.de",28],["thegamingwatcher.com",29],["webtv.stofa.dk",30],["melkkobrew.fi",31],["asus.com.cn",[32,35]],["zentalk.asus.com",[32,35]],["trouwenbijfletcher.nl",33],["fletcher.nl",33],["fletcherzakelijk.nl",33],["intermatic.com",33],["mubi.com",34],["carsupermarket.com",36],["lawrievetgroup.co.uk",37],["59northwheels.se",38],["foto-gregor.de",39],["dhbbank.com",40],["dhbbank.de",40],["dhbbank.be",40],["dhbbank.nl",40],["login.ingbank.pl",41],["fabrykacukiernika.pl",[42,43]],["playlumi.com",[44,45,46]],["chatfuel.com",47],["studio3t.com",[48,49,50,51]],["realgap.co.uk",[52,53,54,55]],["hotelborgia.com",[56,57]],["sweet24.de",58],["zwembaddekouter.be",59],["flixclassic.pl",60],["jobtoday.com",61],["deltatre.com",[62,63,75]],["withings.com",[64,65,66]],["gift.be",[67,68]],["animaze.us",69],["bizkaia.eus",[70,71,72]],["sinparty.com",73],["jobs.ch",74],["jobup.ch",74],["depop.com",[76,77]],["mantel.com",78],["armedangels.com",[79,80,81]],["e-dojus.lv",82],["burnesspaull.com",83],["oncosur.org",84],["ryanair.com",85],["bayernportal.de",[86,87,88]],["pricehubble.com",89],["ilmotorsport.de",90],["aqua-store.fr",91],["app.arzt-direkt.de",92],["dasfutterhaus.at",93],["e-pity.pl",94],["fillup.pl",95],["dailymotion.com",96],["barcawelt.de",97],["lueneburger-heide.de",98],["polizei.bayern.de",[99,101]],["ourworldofpixels.com",100],["jku.at",102],["espacocasa.com",103],["altraeta.it",103],["centrooceano.it",103],["allstoresdigital.com",103],["cultarm3d.de",103],["soulbounce.com",103],["fluidtopics.com",103],["uvetgbt.com",103],["malcorentacar.com",103],["emondo.de",103],["maspero.it",103],["kelkay.com",103],["underground-england.com",103],["vert.eco",103],["turcolegal.com",103],["magnet4blogging.net",103],["moovly.com",103],["automationafrica.co.za",103],["jornaldoalgarve.pt",103],["keravanenergia.fi",103],["kuopas.fi",103],["frag-machiavelli.de",103],["healthera.co.uk",103],["mobeleader.com",103],["powerup-gaming.com",103],["developer-blog.net",103],["medical.edu.mt",103],["deh.mt",103],["bluebell-railway.com",103],["ribescasals.com",103],["javea.com",103],["chinaimportal.com",103],["inds.co.uk",103],["raoul-follereau.org",103],["serramenti-milano.it",103],["cosasdemujer.com",103],["luz-blanca.info",103],["cosasdeviajes.com",103],["safehaven.io",103],["havocpoint.it",103],["motofocus.pl",103],["nomanssky.com",103],["drei-franken-info.de",103],["clausnehring.com",103],["alttab.net",103],["kinderleicht.berlin",103],["kiakkoradio.fi",103],["cosasdelcaribe.es",103],["de-sjove-jokes.dk",103],["serverprofis.de",103],["biographyonline.net",103],["iziconfort.com",103],["sportinnederland.com",103],["natureatblog.com",103],["wtsenergy.com",103],["cosasdesalud.es",103],["internetpasoapaso.com",103],["zurzeit.at",103],["contaspoupanca.pt",103],["backmarket.de",[104,105,106]],["backmarket.co.uk",[104,105,106]],["backmarket.es",[104,105,106]],["backmarket.be",[104,105,106]],["backmarket.at",[104,105,106]],["backmarket.fr",[104,105,106]],["backmarket.gr",[104,105,106]],["backmarket.fi",[104,105,106]],["backmarket.ie",[104,105,106]],["backmarket.it",[104,105,106]],["backmarket.nl",[104,105,106]],["backmarket.pt",[104,105,106]],["backmarket.se",[104,105,106]],["backmarket.sk",[104,105,106]],["backmarket.com",[104,105,106]],["eleven-sportswear.cz",[107,108,109]],["silvini.com",[107,108,109]],["silvini.de",[107,108,109]],["purefiji.cz",[107,108,109]],["voda-zdarma.cz",[107,108,109]],["lesgarconsfaciles.com",[107,108,109]],["ulevapronohy.cz",[107,108,109]],["vitalvibe.eu",[107,108,109]],["plavte.cz",[107,108,109]],["mo-tools.cz",[107,108,109]],["flamantonlineshop.cz",[107,108,109]],["sandratex.cz",[107,108,109]],["norwayshop.cz",[107,108,109]],["3d-foto.cz",[107,108,109]],["neviditelnepradlo.cz",[107,108,109]],["nutrimedium.com",[107,108,109]],["silvini.cz",[107,108,109]],["karel.cz",[107,108,109]],["silvini.sk",[107,108,109]],["book-n-drive.de",110],["cotswoldoutdoor.com",111],["cotswoldoutdoor.ie",111],["cam.start.canon",112],["usnews.com",113],["researchaffiliates.com",114],["singkinderlieder.de",115],["store.ubisoft.com",[116,117,118,119]],["britishairways.com",[120,121,122]],["cineman.pl",[123,124,125]],["tv-trwam.pl",[123,124,125,126]],["qatarairways.com",[127,128,129,130,131]],["wedding.pl",132],["vivaldi.com",133],["emuia1.gugik.gov.pl",134],["nike.com",135],["adidas.at",136],["adidas.be",136],["adidas.ca",136],["adidas.ch",136],["adidas.cl",136],["adidas.co",136],["adidas.co.in",136],["adidas.co.kr",136],["adidas.co.nz",136],["adidas.co.th",136],["adidas.co.uk",136],["adidas.com",136],["adidas.com.ar",136],["adidas.com.au",136],["adidas.com.br",136],["adidas.com.my",136],["adidas.com.ph",136],["adidas.com.vn",136],["adidas.cz",136],["adidas.de",136],["adidas.dk",136],["adidas.es",136],["adidas.fi",136],["adidas.fr",136],["adidas.gr",136],["adidas.ie",136],["adidas.it",136],["adidas.mx",136],["adidas.nl",136],["adidas.no",136],["adidas.pe",136],["adidas.pl",136],["adidas.pt",136],["adidas.ru",136],["adidas.se",136],["adidas.sk",136],["colourbox.com",137],["ebilet.pl",138],["snap.com",139],["ratemyprofessors.com",140],["filen.io",141],["restaurantclub.pl",142],["stilord.com",143],["stilord.pl",143],["stilord.de",143],["stilord.fr",143],["quantamagazine.org",144],["scaleway.com",146],["hellotv.nl",147],["lasestrellas.tv",148],["biona-shop.de",149],["camokoenig.de",149],["bikepro.de",149],["kaffeediscount.com",149],["vamos-skateshop.com",149],["holland-shop.com",149],["officesuite.com",150],["fups.com",[151,152]],["scienceopen.com",153],["buidlbox.io",154],["calendly.com",155],["ubereats.com",156],["101internet.ru",157],["tunnelmb.net",158],["hitado.de",159],["bitso.com",160],["eco-toimistotarvikkeet.fi",161],["proficient.fi",161],["developer.ing.com",162],["ehealth.gov.gr",163],["larian.com",163],["calvinklein.se",[164,165,166]],["calvinklein.fi",[164,165,166]],["calvinklein.sk",[164,165,166]],["calvinklein.si",[164,165,166]],["calvinklein.ch",[164,165,166]],["calvinklein.ru",[164,165,166]],["calvinklein.com",[164,165,166]],["calvinklein.pt",[164,165,166]],["calvinklein.pl",[164,165,166]],["calvinklein.at",[164,165,166]],["calvinklein.nl",[164,165,166]],["calvinklein.hu",[164,165,166]],["calvinklein.lu",[164,165,166]],["calvinklein.lt",[164,165,166]],["calvinklein.lv",[164,165,166]],["calvinklein.it",[164,165,166]],["calvinklein.ie",[164,165,166]],["calvinklein.hr",[164,165,166]],["calvinklein.fr",[164,165,166]],["calvinklein.es",[164,165,166]],["calvinklein.ee",[164,165,166]],["calvinklein.de",[164,165,166]],["calvinklein.dk",[164,165,166]],["calvinklein.cz",[164,165,166]],["calvinklein.bg",[164,165,166]],["calvinklein.be",[164,165,166]],["calvinklein.co.uk",[164,165,166]],["formula1.com",167],["howstuffworks.com",168],["chollometro.com",169],["dealabs.com",169],["hotukdeals.com",169],["pepper.it",169],["pepper.pl",169],["preisjaeger.at",169],["mydealz.de",169]]);

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
    const safe = {
        'Error': self.Error,
        'Object_defineProperty': Object.defineProperty.bind(Object),
        'RegExp': self.RegExp,
        'RegExp_test': self.RegExp.prototype.test,
        'RegExp_exec': self.RegExp.prototype.exec,
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
//   `MAIN` world not yet supported in Firefox, so we inject the code into
//   'MAIN' ourself when enviroment in Firefox.

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
