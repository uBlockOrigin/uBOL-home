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
const uBOL_trustedSetCookie = function() {

const scriptletGlobals = new Map(); // jshint ignore: line

const argsList = [["SOCS","CAESEwgDEgk1MjE4NjcxMTIaAmVuIAEaBgiAl7ihBg","1year","","reload","1"],["SOCS","CAESHAgBEhJnd3NfMjAyMzA2MTItMF9SQzIaAmZpIAEaBgiAzK6kBg","1year"],["datr","__GMZCgwVF5BbyvAtfJojQwg","1year","","reload","1"],["ig_did","0C826C21-17C3-444A-ABB7-EBABD37214D7","1year","","reload","1"],["euconsent-v2","CPtgasAPtgasAAGABCENDECgAAAAAAAAAApAAAAAAAAA.YAAAAAAAAAAA","1year"],["consentUUID","dde2fbcb-0722-417a-92be-67407ba369de_20","1year"],["euconsent-v2","CPt3fQAPt3fQACNAFAENDLCgAAAAAAAAACiQAAAOCgDAB-AIsAZ8A6QDBAHBAAAA.YAAAAAAAAAAA","1year"],["tracking-opt-in-status","rejected","1year"],["addtl_consent","1~","1year"],["dm-euconsent-v2","CPt6yMAPt6yMABpAGAENDECgAAAAAH_AAAqIAAAS3AJMNW4gC7MocGbQMIoEQIwrCQigUAEFAMLRAQAODgp2VgE-sIkAKAUARgRAhwBRkQCAAASAJCIAJAiwQAAAiAQAAgAQCIQAMDAIKACwEAgABAdAxRCgAECQgSIiIhTAgKgSCAlsqEEoLpDTCAKssAKARGwUACIJARWAAICwcAwRICViwQJMQbRAAMAKAUSoVqKT00BCxmQAAAAA","1year"],["consentUUID","9f883906-c5ae-4d90-80a1-6623a4211ad4_21","1year"],["consentUUID","629d4124-fa7b-43b4-8158-d596cef1004d_21","1year"],["consentUUID","f0aaedd0-2a07-443a-b90f-055c553b5160_21","1year"],["consentUUID","14ec7082-be8b-4b4c-a5b4-668972e0e04b_21","1year"],["fig_save_consent","iTTPgpSWqAGGcd3vV88zNDbHsABxE1hB","1year"],["euconsent-v2","CPubvkAPubvkAAHABBENDMCgAAAAAAAAAB5YAAAAAAAA.YAAAAAAAAAAA","1year"],["c24-consent","AAAAH0Eq","1year","","reload","1"],["wt_tandc","20190527%3A1"],["OptanonConsent","groups=C0001%3A1%2CC0002%3A0%2CC0008%3A0","1year"],["_scw_rgpd_hash","1676567096","1year"],["PUR_SUBSCRIPTION","PREMIUM"],["CookieConsent","{necessary:true%2Cpreferences:false%2Cstatistics:false%2Cmarketing:false}","1year"],["cb","1_1970_01_01_2-3","1year","","reload","1"],["datr","mWTaZBxAoW8lFl0v3EpECGYi","1year","","reload","1"],["OptanonAlertBoxClosed","$currentDate$","1year"],["_EVAcookieaccept","Y","1year"],["_EVAGDPRfunctional","Y","1year"],["OptanonConsent","groups=C0004%3A0%2CC0003%3A1%2CC0002%3A0%2CC0001%3A1%2CSTACK42%3A0","1year"],["eupubconsent-v2","CPt6LrpPt6LrpAcABBENDKCgAAAAAAAAAAYgGBtX_T5eb2vj-3ZcN_tkaYwP55y3o2wzhhaIke8NwIeH7BoGJ2MwvBV4JiACGBAkkiKBAQVlHGBcCQAAgIgRiSKMYk2MjzNKJLJAilMbO0NYCD9mnkHT2ZCY70-uO__zvneAAAAYJABAXmKgAgLzGQAQF5joAIC8yUAEBeZSACAvMAAA.YAAAAAAAAAAA","1year","","reload","1"],["OptanonConsent","groups=1%3A1%2C2%3A0%2C3%3A1%2C4%3A0%2C5%3A1%2CBG57%3A0%2CBG58%3A0%2CBG59%3A0","1year"],["TcString","CPtgasAPtgasABUAMAFIDICgAP_AAAAAAApAAAAMEgLgALAAqABkADwAIAAZAA0AB8AEQAJgATwA5gB-AEIANEAbIBFgC0gGKAM-AmQBeYDBACQkBAABYAFQAMgAeABAADIAGgARAAmABPADmAH4AQgA2QDFALzDQAgBsgFpEQAQBsioAYATAC0gLzGQAgAmALzHQFAAFgAVAAyACAAGQANAAfABEACYAE8AOYAfgBogDZAIsAWkAxQB1AEyALzIQBgAFgAZACYAWkAxQB1CUAkABYAGQAiABMAGyAWkAxQB1AF5lICAACwAKgAZABAADIAGgARAAmABPADmAH4AaIA2QCLAGKAXmAAA.YAAAAAAAAIAA","1year"],["gravitoData","{\"NonTCFVendors\":[{\"id\":1,\"name\":\"Facebook\",\"consent\":true},{\"id\":3,\"name\":\"Google\",\"consent\":true},{\"id\":9,\"name\":\"Twitter\",\"consent\":true}]}","1year"],["OptanonConsent","groups=C0001%3A1%2CC0002%3A1%2CC0003%3A1%2CC0004%3A0%2CC0005%3A0","1year"],["ladies-cookies-overlay","%7B%22cookie-category-essential%22%3Atrue%2C%22cookie-category-stats%22%3Afalse%2C%22cookie-category-map_services%22%3Atrue%7D","","","reload","1"],["opt_out","analyse,werbe"],["OptanonConsent","groups=C0001%3A1%2CC0003%3A1%2CSPD_BG%3A1%2CC0002%3A1%2CC0004%3A1%2CC0005%3A1","","","reload","1"],["STYXKEY_your_privacy_settings","%7B%22strict%22%3A%221%22%2C%22thirdparty%22%3A%221%22%2C%22advanced%22%3A%220%22%7D","1year","","reload","1"],["consentUUID","5937071e-5211-4df8-b4f9-89a0d5919eae_20","1year"],["consentUUID","8fde91ba-0aba-476f-af30-e7427e3c246d_21"],["OptanonConsent","groups=C0001%3A1%2CC0009%3A0%2CC0002%3A0%2CC0003%3A1%2CC0004%3A1","1year"],["allowCookies","{\"uvc\":true,\"__cfduid\":true}"],["cookieConsent","%5B%7B%22name%22%3A%22essenziell%22%2C%22value%22%3A%22on%22%7D%2C%7B%22name%22%3A%22komfort%22%2C%22value%22%3A%22on%22%7D%2C%7B%22name%22%3A%22marketing%22%2C%22value%22%3A%22off%22%7D%2C%7B%22name%22%3A%22statistik%22%2C%22value%22%3A%22off%22%7D%2C%7B%22name%22%3A%22speichern%22%2C%22value%22%3A%22on%22%7D%5D","1year"],["OptanonConsent","groups=C0001%3A1%2CC0002%3A0%2CC0003%3A1%2CC0004%3A0%2CC0005%3A1","1year"],["consents",":4:6:7:8:9:10:11:12:13:19:"],["__cmpcpc","__1_2__"],["__cmpcvc","__c24599_s94_c24102_s40_s1052_s65_c24103_s23_c9953_c24290_c24098_s26_s2612_s135_s1104_s1409_s905_s24_c24202_c22143_c21373_s77_s30_U__"],["__cmpconsentx40263","BPuKNGaPuKNGaAfEHBFIABAAAAA_mABAfyA"],["consent-levels","1-1_2-1_3-0_4-0","1year"],["OptanonConsent","groups=C0001%3A1%2CC0002%3A0%2CC0003%3A1%2CC0004%3A1","1year"],["OptanonConsent","groups=C0001%3A1%2CC0002%3A0%2CC0003%3A0%2CC0004%3A1"],["euconsent-v2","CPubvkAPubvkAAHABBENDMCgAM_AAE7AAAqII7FF_X7eTSPheWp_Y_tUOY0ewVQ_4-AhBgCJA4gBCRpAsJQEkGAIIEDAIAAKAAYEIGJBAAElAAFABEAAYIEBACHMAAAAIRAAIDKAAAAAAgBACABYEwAAAAIAgEBUABUAiAIAABogwMBAEAAgBEAAAAogAIBBAAAAACAAwAAQAAAIAggAAAAAAAAEAAAEAAAAEAAABJKADAAEExQ0AGAAIJiioAMAAQTFKQAYAAgmKOgAwABBMUhABgACCYoSADAAEExREAGAAIJijIAMAAQTFAAA.efgACdgAAAAA","1year","","reload","1"],["OptanonConsent","groups=1%3A1%2C2%3A0%2C3%3A1%2C4%3A0%2C5%3A0%2CBG40%3A0%2CBG41%3A0%2CBG42%3A0","1year"],["euconsent-v2","CPuy0IAPuy0IAAHABBENDNCgAAAAAAAAAAAAJNFB_G5cSWNhOHJvY9tUaQ0HwFR4o6AgDgCZA4wBCRIAMIwF0GAAIEBAIAgAAAAEAAJAAAAEAAHAAAAAAIEBASCIAEAAIBAAICAAAAABQgAACABJGwAAEAAAAEQEABQAgAIAQBuAQEAAAAAAAAAAAAgBAABBAAAAAAAgAAAIAAAAAAgAEAAAAAAAAAAAABAAEAAAAAEAAABIaADAAEExRUAGAAIJihIAMAAQTFEQAYAAgmKMgAwABBMUdABgACCYpCADAAEExSUAGAAIJilIAMAAQTFA.YAAAAAAAAAAA"],["_ul_cookie_consent","allow"],["p","eyJnZHByX3RwIjoyLCJnZHByX3AiOjF9","1year","","reload","1"],["cmplz_consented_services","{\"youtube\":true}"],["xf_consent","%5B%22_third_party%22%5D","","","reload","1"],["cookieConsent","functional","1year","","reload","1"],["je-cookieConsent","necessary","1year"],["customerCookieConsent","%5B%7B%22consentTypeId%22%3A103%2C%22consentTypeName%22%3A%22necessary%22%2C%22isAccepted%22%3Atrue%7D%2C%7B%22consentTypeId%22%3A104%2C%22consentTypeName%22%3A%22functional%22%2C%22isAccepted%22%3Atrue%7D%2C%7B%22consentTypeId%22%3A105%2C%22consentTypeName%22%3A%22analytical%22%2C%22isAccepted%22%3Afalse%7D%2C%7B%22consentTypeId%22%3A106%2C%22consentTypeName%22%3A%22personalized%22%2C%22isAccepted%22%3Afalse%7D%5D","1year"],["cookie-optin","{%22version%22:1%2C%22settings%22:{%22required%22:true%2C%22analytical%22:false%2C%22marketing%22:false%2C%22thirdparty%22:true}}","1year"],["cookiefirst-consent","%7B%22cookiefirst%22%3Atrue%2C%22google_analytics%22%3Atrue%2C%22google_tag_manager%22%3Atrue%2C%22linkedin_ads%22%3Afalse%2C%22hubspot%22%3Atrue%2C%22twitter%22%3Afalse%2C%22active-campaign%22%3Atrue%2C%22email-marketing%22%3Atrue%2C%22bing_ads%22%3Afalse%2C%22type%22%3A%22granular%22%7D"],["consentUUID","1e01fddf-ec1b-482a-aa3b-b82bde080398_22"],["euconsent-v2","CPvxb8APvxb8AAGABBENDPCgAIAAAH_AAAwIJLNV_G__bW9jcfr_aft0eY1P9_qz7uQjDBXNk-4F3L_WvLwX52E5NF16tqoKmRQEs1JBIUNlGMHUBUmwaoEFpyHsakycoTJKJ6BEkHMRE2dYGE5qmRpjeQKY5_p9d1bx2B-o_Nv819j2z81Xj3dZV-2k0PCdU5-9BfmtRRfK89IKdtbUv4p8_1drkm_WV_3f7tdz-DBJUAgwEQCAAgAAAAgAAAhAABAAJACAAAAAAAFAAAC4KAEIWARAggAAoRABCAACEEBABAAAAAAAkAAAEAJBAAAAABAACAAAAAAAQEAAIAJAQAAAAAkBFMIABQKAAIAACAMAEoAIIAQggACAskMAIAqigAAAECBQAIgABAYAAALAwDBAgJUBAAEEAIAAAQAoBRKBCIBHQDwkFEABAAC4AKAAqABkADkAHgAgABgADKAGgAagA8gCGAIgARwAmABPACqAGYAN4AcwA9ACEAENAIgAiQBHACWAE0AKUAYAAw4BlAGWANmAdwB3gD2AHwAPsAfsA_wEAAIGARQAjABGoCSgJMAUEAp4BUQCrgFzALsAYoA0QBrADaAG4AOIAh0BIgCdgFDgKPAUiApoBbAC5AGGwMjAyQBlwDOQGkQNXA1kBuoDkwHLgPHAe0A-kCDAEIYIWgheBDkCHoEPwJFBQAQAGwF0BAAQBNAFuBoBoAywCAAEYAKeAWgAuwBrADqgIdAXIAyMBnIEihEAwAZYBAACMAFPALsAawA6oCHQFyAMjAZyBIoVAJACGAMsAtABdgFyAMjAZyBC8CRQyAQAEMAZYBdgFyAMjAZyBC8CRRCBoAAsACgAGQAYgA1ACGAEwAKoAXAAxABvAD0AI4AUoAwABlQDuAO8Af4BFACSgFBAKeAVEAq4BaAC5gF2AMUAbQA5wB1AEqAKaAVYAsUBZQC0QFwALkAZGAzkBogDgAHjgPpAgwBCgCFoELwIdAQ9AkUOgwgALgAoACoAGQAOQAfACCAGAAZQA0ADUAHkAQwBEACOAEwAJ4AVYAuAC6AGIAMwAbwA5gB6AENAIgAiQBLACaAFGAKUAYAAwwBlADRAGyAO8AewA-wB-gD_AIGARQAjABHYCSgJMAS4AoIBTwCogFXALEAWgAuYBdoC8gL0AYoA2gBuADiAHOAOoAh0BF4CRAEqAJ2AUOAo8BTQCrAFigLKAWwAuABcgC7QGGgMegZGBkgDKgGWAMuAZmAzkBogDSAGsAN1AcWA5MBy4DxwHtAPpAfWBAECDAELQIXwQ5BDoCHoEihwAEBbhKBoAAgABYAFAAMgAcAA_ADAAMQAagA8ACIAEcAJgAVQAuABiAENAIgAiQBHACjAGAANkAd4BTwCogFXALQAXMAuwBigDqAIdARMAi8BIgCjwFigLKAWxAyMDJAGcgNIAawA4AB7QD6QIAgQYAhCBC8CHoEigJKkgAIC3CkEsABcAFAAVAAyAByAD4AQQAwADGAGgAagA8gCGAIgARwAmABPACkAFUAMQAZgA5gCGgEQARIAowBSgDAAGUANEAbIA7wB-gEYAI6ASUAoIBUQCrgFzALsAXkAxQBtADcAHUAPaAh0BEwCLwEiAJ2AUOAqwBX4CxQFsALgAXIAu0BhsDIwMkAZYAy4BnIDSIGsAayA3UByYDlwHigPHAe0A-kCDAEIQIWgQvghyCHQEPQJFFQAQBIgEylAAIC3AAAA.YAAAAAAAAAAA"],["OptanonConsent","groups=C0001%3A1%2CC0002%3A0%2CC0003%3A1%2CC0004%3A0%2CSTACK42%3A0","1year"],["eupubconsent-v2","CPwbUmgPwbUmgAcABBENDSCgAAAAAH_AAChQJnNf_X__b2_r-_7_f_t0eY1P9_7__-0zjhfdl-8N3f_X_L8X52M5vF36tqoKuR4ku3bBIUdlHPHcTVmw6okVryPsbk2cr7NKJ7PEmlMbM2dYGH9_n9_z-ZKY7___f__z_v-v___9____7-3f3__5__--__e_V_-9zfn9_____9vP___9v-_9_3________3_r9_7_D_-f_87_XWxBQAJMNS4gC7IkZCbaMIoEQIwrCQqgUAFEAkLRAYQurgp2VwE-sBkAIEUATwQAhgBRkACAAASAJCIAJAjgQCAQCAQAAgAVCAQAMbAAPAC0EAgAFAdCxTigCUCwgyISIhTAhKkSCgnsqEEoP1BXCEMssCKDR_xUICNZAxWBEJCxehwBICXiSQPdUb4ACEAKAUUoViKT8wBDgmbLVXgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAgAAAAA.YAAAD_gAAAAA","1year"],["CookieConsent","{necessary:true%2Cpreferences:false%2Cstatistics:true%2Cmarketing:true}","1year"]];

const hostnamesMap = new Map([["youtube.com",0],["facebook.com",2],["instagram.com",3],["bloomberg.com",[4,5]],["fandom.com",[6,7,8]],["dailymotion.com",9],["standard.co.uk",10],["independent.co.uk",11],["theguardian.com",12],["bbc.com",13],["lefigaro.fr",14],["filmweb.pl",15],["wetransfer.com",17],["thetrainline.com",[18,24]],["scaleway.com",19],["all3dp.com",20],["lidl.fi",21],["threads.net",22],["messenger.com",23],["gamespot.com",[24,32]],["mtvuutiset.fi",[24,29]],["pushsquare.com",[24,64,65]],["thejournal.ie",[24,49]],["vkmag.com",[24,27,28]],["zdnet.com",[24,42]],["evaair.com",[25,26]],["arvopaperi.fi",[30,31]],["iltalehti.fi",[30,31]],["kauppalehti.fi",[30,31]],["mediuutiset.fi",[30,31]],["mikrobitti.fi",[30,31]],["talouselama.fi",[30,31]],["tekniikkatalous.fi",[30,31]],["tivi.fi",[30,31]],["uusisuomi.fi",[30,31]],["asialadies.de",33],["avladies.de",33],["badeladies.de",33],["behaarteladies.de",33],["bizarrladies.de",33],["busenladies.de",33],["deutscheladies.de",33],["devoteladies.de",33],["dominanteladies.de",33],["erfahreneladies.de",33],["escorts24.de",33],["exklusivladies.de",33],["fkk24.de",33],["grosseladies.de",33],["hobbyladies.de",33],["jungeladies.de",33],["kollegin.de",33],["kussladies.de",33],["ladies.de",33],["latinaladies.de",33],["massierendeladies.de",33],["mollyladies.de",33],["nsladies.de",33],["nymphomaneladies.de",33],["orientladies.de",33],["osteuropaladies.de",33],["piercingladies.de",33],["rasierteladies.de",33],["schokoladies.de",33],["tattooladies.de",33],["tsladies.de",33],["zaertlicheladies.de",33],["zierlicheladies.de",33],["1a-finanzmarkt.de",34],["1a-immobilienmarkt.de",34],["1a-reisemarkt.de",34],["1a-singleboerse.de",34],["1a-stellenmarkt.de",34],["gameinformer.com",35],["christianconcern.com",36],["aamulehti.fi",37],["etlehti.fi",37],["gloria.fi",37],["hs.fi",37],["hyvaterveys.fi",37],["is.fi",37],["jamsanseutu.fi",37],["janakkalansanomat.fi",37],["kankaanpaanseutu.fi",37],["kmvlehti.fi",37],["kodinkuvalehti.fi",37],["merikarvialehti.fi",37],["nokianuutiset.fi",37],["rannikkoseutu.fi",37],["satakunnankansa.fi",37],["soppa365.fi",37],["suurkeuruu.fi",37],["sydansatakunta.fi",37],["tyrvaansanomat.fi",37],["valkeakoskensanomat.fi",37],["vauva.fi",37],["eurogamer.de",38],["vogue.co.uk",39],["wired.com",39],["jekabpils.lv",40],["aachener-bank.de",41],["bernhauser-bank.de",41],["bodenseebank.de",41],["bremischevb.de",41],["cvw-privatbank-ag.de",41],["dervolksbanker.de",41],["gladbacher-bank.de",41],["meine-rvb.de",41],["meinebank.de",41],["muenchner-bank.de",41],["nordthueringer-volksbank.de",41],["owl-immobilien.de",41],["raiba-gr.de",41],["raiba-ndwa.de",41],["raiba-westhausen.de",41],["rb-berghuelen.de",41],["rb-denzlingen-sexau.de",41],["rb-eching.de",41],["rb-hardt-bruhrain.de",41],["rb-oberaudorf.de",41],["rb-sondelfingen.de",41],["rv-banken.de",41],["saechsischer-gewinnsparverein.de",41],["skbwitten.de",41],["sparda-bank-hamburg.de",41],["sparda-sw.de",41],["vb-lauterecken.de",41],["vb-mittelhessen.de",41],["vb-rb.de",41],["vbleos.de",41],["vbsuedemsland.de",41],["voba-deisslingen.de",41],["voba-moeckmuehl.de",41],["volksbank-aktiv.de",41],["volksbank-backnang.de",41],["volksbank-daaden.de",41],["volksbank-dh.de",41],["volksbank-freiburg.de",41],["volksbank-international.de",41],["volksbank-kirnau.de",41],["volksbank-mittleres-erzgebirge.de",41],["volksbank-remseck.de",41],["volksbank-thueringen-mitte.de",41],["volksbank-trossingen.de",41],["volksbankeg.de",41],["vr-nopf.cz",41],["vrb-spangenberg.de",41],["vrbankeg.de",41],["vrbankimmobilien.de",41],["vvr-bank.de",41],["vvrbank-krp.de",41],["news.sky.com",43],["lippu.fi",[44,45,46]],["starcart.com",47],["sydan.fi",48],["rfi.fr",50],["cmore.fi",51],["europe1.fr",52],["teket.jp",53],["etsy.com",54],["technopat.net",[55,56]],["justeat.it",[57,58,59]],["pyszne.pl",[57,58,59]],["takeaway.com",[57,58,59]],["thuisbezorgd.nl",[57,58,59]],["telekom.com",60],["hemmersbach.com",61],["eurogamer.nl",[62,63]],["eurogamer.es",[62,63]],["eurogamer.cz",[62,63]],["eurogamer.net",[62,63]],["eurogamer.pl",[62,63]],["eurogamer.pt",[62,63]],["rockpapershotgun.com",[62,63]],["vg247.com",[62,63]],["bt.dk",66]]);

const entitiesMap = new Map([["www.google",1],["chrono24",16],["just-eat",[57,58,59]],["lieferando",[57,58,59]]]);

const exceptionsMap = new Map([]);

/******************************************************************************/

function trustedSetCookie(
    name = '',
    value = '',
    offsetExpiresSec = '',
    path = ''
) {
    if ( name === '' ) { return; }

    const time = new Date();

    if ( value === '$now$' ) {
        value = Date.now();
    } else if ( value === '$currentDate$' ) {
        value = time.toUTCString();
    }

    let expires = '';
    if ( offsetExpiresSec !== '' ) {
        if ( offsetExpiresSec === '1day' ) {
            time.setDate(time.getDate() + 1);
        } else if ( offsetExpiresSec === '1year' ) {
            time.setFullYear(time.getFullYear() + 1);
        } else {
            if ( /^\d+$/.test(offsetExpiresSec) === false ) { return; }
            time.setSeconds(time.getSeconds() + parseInt(offsetExpiresSec, 10));
        }
        expires = time.toUTCString();
    }

    setCookieHelper(
        name,
        value,
        expires,
        path,
        safeSelf().getExtraArgs(Array.from(arguments), 4)
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
    try { trustedSetCookie(...argsList[i]); }
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
    return uBOL_trustedSetCookie();
}

// Firefox
{
    const page = self.wrappedJSObject;
    let script, url;
    try {
        page.uBOL_trustedSetCookie = cloneInto([
            [ '(', uBOL_trustedSetCookie.toString(), ')();' ],
            { type: 'text/javascript; charset=utf-8' },
        ], self);
        const blob = new page.Blob(...page.uBOL_trustedSetCookie);
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
    delete page.uBOL_trustedSetCookie;
}

/******************************************************************************/

// End of local scope
})();

/******************************************************************************/

void 0;
