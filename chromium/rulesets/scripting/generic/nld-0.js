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

// nld-0

// Important!
// Isolate from global scope
(function uBOL_cssGenericImport() {

const lowlyGeneric = new Map(/* 47 */[[23313,"#adBoven"],[6197,"#adRechts"],[40668,"#adRechts2"],[63801,"#advertentie"],[25608,".advertentie-2-container"],[26132,".advertentie_226"],[64048,".advertentie_links"],[47692,".content-rechts-ad"],[5835,".gamereel_featured-ad"],[9209,".gesponsord_blokje"],[30617,".gesponsord_blokje_wrap"],[4411,".hoofdAd2"],[34151,".kwebler-ad-minimal"],[17784,".massarius-dfp-unit"],[59421,".rmn-advert"],[21370,"#advertentieblokjeid"],[6577,"#gesponsordelink"],[26472,"#reclame2"],[21373,"#reclame_rechts"],[16102,"#reclamebanner"],[27349,"#reclamediv"],[50571,"#rightbanner_adbest"],[48173,"#semilo-lrectangle"],[17226,"#sidereclame"],[56999,"#vipAdmarktBannerBlock"],[50236,".ads-mobiel"],[685,".adstekst"],[32724,".advertentie"],[27667,".advertenties"],[50439,".advertorial_koersen_home_top"],[988,".ankeiler--advertisement"],[14400,".aw_url_admarkt_bottom"],[26913,".banner_advert6blok"],[26932,".banner_advertentie_footer"],[60274,".bericht_adv1"],[23345,".bovenadvertentiediv"],[21286,".category-advertentie"],[21596,".gesponsordelink"],[60664,".groei-ad"],[42802,".justLease_ad"],[20675,".mp-adsense-header-top"],[24281,".ontwerp_ads"],[47608,".reclame"],[42780,".reclameIndex"],[15262,".reclamekop"],[42807,".reclamelogos"],[16274,".sponsorbalk"]]);
const highlyGeneric = /* 5 */"a[href^=\"https://go2.go2cloud.org/\"],\na[href^=\"https://mt67.net/\"],\na[href^=\"https://www.2k19.nl/\"],\na[href^=\"https://www.flirtadvertenties.nl/direct-sexdating/\"],\na[href^=\"https://xltube.nl/click/\"]";
const exceptions = /* 39 */[".ad-content\n.ad-main\n.ad-container-wrapper\n.ad-header\n.ad-col\n.ad-row","#topbanner_ad",".advertentie",".ad-body\n.node-ad",".googleAd",".top-ads-block",".header-ad",".ad-description",".advertorial","#advertentie",".top-ads-block",".AdBar",".top-ads-block",".AdBar",".top-advert",".advertentie",".b-header-banner",".top-ads-block",".top-ads-block",".advertentie","#topbanner_ad",".top-ads-block",".top-ads-block",".top-ads-block",".feed-ad\n.topAds",".top-ads-block",".top-ads-block",".top-ads-block",".ads-image",".top-ads-block",".top-ads-block","#topbanner_ad",".top-ads-block",".advert-container\n.advert-title\n.advertiser",".top-ads-block",".after-content-ad",".top-ads-block",".top-ads-block","#sponsorText"];
const hostnames = /* 39 */["ad.cw","538.nl","fok.nl","bokt.nl","vier.be","ajaxrss.nl","klusidee.nl","marktnet.nl","veeteelt.nl","forum.fok.nl","psvreport.nl","tweakers.net","ajaxreport.nl","hardware.info","directwonen.nl","paginamarkt.nl","underarmour.nl","casinoreport.nl","voetbalsnafu.nl","frontpage.fok.nl","vandaaginside.nl","voetbalvisie.com","fultimateteam.com","gamblingreport.nl","vakantieplaats.nl","cryptotoekomst.com","feyenoordreport.nl","formula1report.com","gratisaftehalen.nl","voetbalnotering.nl","cryptobelegging.com","hartvannederland.nl","livestreamvandaag.be","mechanisatiemarkt.nl","blockchainvandaag.com","modekoninginmaxima.nl","vergelijkbookmakers.nl","casinovergelijkingen.com","voetbalwedstrijdenvandaag.nl"];
const hasEntities = false;

self.genericSelectorMaps = self.genericSelectorMaps ?? [];
self.genericSelectorMaps.push(lowlyGeneric);
self.genericDetails = self.genericDetails ?? [];
self.genericDetails.push({ highlyGeneric, exceptions, hostnames, hasEntities });

})();

/******************************************************************************/
