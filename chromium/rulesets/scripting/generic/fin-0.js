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

// fin-0

// Important!
// Isolate from global scope
(function uBOL_cssGenericImport() {

const lowlyGeneric = new Map(/* 54 */[[52004,"#atwAdFrame"],[54597,"#keskimainos"],[53926,"#mainokset"],[57573,"#mainokset_oikea"],[1451,"#mainokset_vasen"],[6682,"#mainokset_yla"],[32242,"#mainos"],[15269,"#mainosbanneri"],[16326,"#mainosbannerit"],[35656,"#mainoskaruselli"],[23241,"#mainoslaatikko"],[64246,"#mainospaikka"],[31290,"#mainostila"],[35035,"#natiivit"],[26255,"#parade-container"],[24238,"#sponsori"],[48835,"#sponsorit"],[53899,"#yhteistyokaruselli"],[53804,"#yhteistyokumppanit"],[54115,"#yhteistyossa"],[32886,"#ylamainokset"],[57486,"#ylamainos"],[38052,".adbox_content"],[42738,".card--native"],[2720,".dfpBoxBottom"],[60492,".dfpListNativeBanner"],[45938,".diks-display-ad"],[27822,".diks-native-ad"],[56289,".etuovi-embed"],[23848,".keskimainos"],[10539,".mainokset"],[56456,".mainokset_oikea"],[15302,".mainokset_vasen"],[7639,".mainokset_yla"],[54047,".mainos"],[58152,".mainosbanneri"],[20363,".mainosbannerit"],[49701,".mainoskaruselli"],[5124,".mainoslaatikko"],[63388,".mainosnosto"],[61467,".mainospaikka"],[183,".mainostila"],[50883,".sponsori"],[38030,".sponsorit"],[8882,".tdt-desktop-ad"],[29843,".tdt-manager-element"],[8080,".tdt-minilanding-button"],[521,".tdt-mobile-ad"],[27110,".yhteistyokaruselli"],[27201,".yhteistyokumppanit"],[51854,".yhteistyossa"],[63131,".ylamainokset"],[14147,".ylamainos"],[35177,"div#commercial-carousel"]]);
const highlyGeneric = /* 14 */"[href=\"https://pikakasinoja.com\"],\n[href^=\"/artikkeli/kaupallinen-yhteistyo/\"],\n[href^=\"https://media.suomikasino.com/\"],\n[href^=\"https://www.nettikasinot.org\"],\na[href*=\"/clickthrgh.asp?\"],\na[href=\"https://kasinoseta.com/\"],\na[href^=\"https://app.readpeak.com/ads\"],\na[href^=\"https://www.kumiukko.fi/ostos?tt=\"],\ndiv[class*=\"element--nativead\"],\ndiv[class*=\"newsFrontAd\"],\ndiv[class=\"ad container-right\"],\ndiv[class=\"AgAdCarousel_Container\"],\ndiv[class=\"AgAdCarousel_LightBox\"],\ndiv[id^=\"ads-content-bottom\"]";
const exceptions = /* 7 */[".mainokset\n.mainos","#CookielawBanner",".mainokset",".adsbygoogle","article.ad",".mainos","#mainos"];
const hostnames = /* 7 */["hs.fi","srk.fi","sokos.fi","murha.info","netticaravan.fi","tilannehuone.fi","pienimatkaopas.com"];
const hasEntities = false;

self.genericSelectorMaps = self.genericSelectorMaps ?? [];
self.genericSelectorMaps.push(lowlyGeneric);
self.genericDetails = self.genericDetails ?? [];
self.genericDetails.push({ highlyGeneric, exceptions, hostnames, hasEntities });

})();

/******************************************************************************/
