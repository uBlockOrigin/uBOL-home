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

// ara-0

// Important!
// Isolate from global scope
(function uBOL_cssGenericImport() {

const lowlyGeneric = new Map(/* 187 */[[38060,"#AdDivUnderNews"],[1838,"#AdPlacementBetweenNews"],[16806,"#AdvContainerTopRightAds"],[3024,"#Arpian-ads"],[32249,"#ClicksAds"],[21906,"#FixAdv160L,\n#FixAdv160R"],[41657,"#ad-center-most-view"],[52037,"#ad4game728x90"],[63973,"#adLeftHolder"],[43024,"#adOTPDesktop"],[5269,"#adOTPMobile"],[14487,"#adRightHolder"],[49562,"#adSlot-inPage-300x250-left"],[22641,"#adSlot-inPage-728x90-top"],[61663,"#adintop_video"],[39307,"#adpost2"],[22491,"#ads_300_250"],[21391,"#adspos1"],[21388,"#adspos2"],[32829,"#alaa-ads"],[35106,"#alaa-ads-content"],[41183,"#b_ad"],[41964,"#b_ad2"],[60381,"#block-ads1,\n#block-ads2"],[24427,"#deskads"],[31422,"#desktopAds"],[61981,"#googleadside"],[23770,"#headads"],[60291,"#it-ad-header"],[23373,"#madspos1"],[23374,"#madspos2"],[23375,"#madspos3"],[20935,"#mpuAfter"],[39126,"#readmoreads"],[43273,"#rightBannerGoogleAd"],[25307,"#zwaar_ad_id"],[37901,"#zwaar_float_ad_area"],[56011,".AD_Dynamic"],[17102,".Ad160-left"],[25476,".Ad160-right"],[58864,".Ads-PostTop"],[3090,".ExampleAd"],[17084,".FixAdv160"],[22724,".LeftAds"],[48253,".LongGAds"],[55632,".RightAds"],[63826,".Seo-plus-Ads"],[41577,".a3lan-Center"],[38021,".a3lan-end"],[53230,".a3lan-related"],[38560,".a3lan-top"],[53121,".ad--list"],[8082,".ad-id_"],[56779,".ad-id_shortcode"],[13438,".ad-lft"],[27911,".ad-location_"],[34332,".ad-location_comments_above"],[34309,".ad-location_comments_below"],[10450,".ad-location_content_above"],[10275,".ad-location_content_below"],[33908,".ad-location_content_middle"],[36018,".ad-location_content_middle_2"],[5175,".ad-location_footer_above"],[5172,".ad-location_footer_below"],[13299,".ad-location_post_end"],[42069,".ad-location_title_above"],[41903,".ad-location_title_below"],[18565,".ad-location_wrapper_left"],[49329,".ad-location_wrapper_right"],[8814,".ad-post-bottom"],[11301,".ad-rt"],[25094,".ad-sidy"],[55368,".ad-type_adsense"],[35733,".ad-type_code"],[37558,".ad160left"],[13061,".ad160right"],[37694,".ad220"],[3171,".ad250250"],[36539,".ad720"],[8554,".adAsync"],[33370,".adNavDesktop"],[22650,".adNavMob"],[48317,".adOTPDesktop"],[568,".adOTPMobile"],[61954,".adTtl"],[17070,".ad_300_300-widget"],[44958,".ad_300_300-widget-2"],[28755,".ad_banner728"],[33665,".adbottomfixed"],[64584,".add_banner"],[2683,".add_banner2"],[41855,".ade160"],[13587,".ads-aa"],[57084,".ads-h-100"],[41625,".ads1post"],[41818,".ads2post"],[8306,".ads__slot"],[59116,".ads__title"],[44513,".ads_ar_wid"],[40421,".ads_en_wid"],[23395,".ads_sq"],[44110,".adsagcompa"],[12012,".adsense-box-l"],[12018,".adsense-box-r"],[43585,".adsheadmu"],[54151,".adsonadsbox"],[1618,".adspos"],[32638,".adspostsfotter"],[5199,".adv-area"],[9753,".advCON"],[31114,".advSmall"],[20217,".adv_outer"],[40109,".adv_side_left"],[49054,".adv_side_right"],[58702,".advertisement-box-desktop"],[38214,".advertisement-square-mobile"],[61565,".angular_advertisement"],[4927,".article-ad-feed"],[43700,".bestaAds_desktop"],[5492,".bloxad"],[56572,".borderMobAds"],[42149,".box-s-ad"],[36648,".boxLeftAd"],[12350,".boxRightAd"],[9395,".desktopAds"],[28041,".dfp-ad-desktop-halfpage-1"],[28042,".dfp-ad-desktop-halfpage-2"],[46946,".dfp-ad-desktop-mpu-1,\n.dfp-ad-desktop-mpu-2"],[12783,".dfp-ad-mobile-halfpage"],[19866,".dfp-ad-tablet-ldb-1"],[19865,".dfp-ad-tablet-ldb-2"],[2762,".dfp_ad_top_ldb1_desktop"],[21744,".dfp_ad_top_ldb1_mobile"],[21729,".dfp_ad_top_ldb1_tablet"],[11236,".e3lan-code"],[29855,".e3lan-header_after"],[34242,".e3lan300_600-widget"],[27848,".fbAdsCont"],[45538,".fixed-ads-left"],[38312,".fixed-ads-right"],[41752,".fixedMpu"],[22248,".float_ads"],[13848,".geminiLB1Ad"],[14011,".geminiLB2Ad"],[16164,".geminiSC2Ad"],[18021,".getSponsored"],[38387,".header_add"],[57543,".hidden_pub"],[47837,".home-page-ads"],[53298,".i3lan"],[51077,".iklan-kanan"],[36342,".iklan-kiri"],[24906,".la-ads-a-wide,\n.la-ads-b-wide"],[52098,".la-ads-b-rec"],[54223,".la-ads-title"],[39012,".la-mob-ads-250x250"],[38784,".la-mob-ads-320x100"],[16151,".label-ads"],[29306,".left-and-right-sponsers"],[26392,".leftadsag"],[38801,".logoAdv"],[5284,".mobileAdSep"],[51638,".mobileAds"],[3456,".mom-e3lan"],[54902,".mom-e3lanat"],[56382,".mom-e3lanat-inner"],[20443,".mom-e3lanat-wrap"],[49414,".pub-980x90"],[13031,".region-pub-widget"],[63804,".reyadiAdvs"],[53254,".right-and-left-sponsers"],[35526,".safeAreaAds"],[2600,".safeAreaLeftAds"],[18090,".safeAreaRightAds"],[2104,".sideColAds"],[51988,".sidea-ad"],[53039,".sponser-stick"],[54253,".sponsorDuplicate"],[29085,".srapad"],[32716,".srapad_bg"],[22581,".to-ad-text"],[34329,".top_small_ad"],[40651,".topa-ad"],[53724,".udm-ad"],[21080,".widget-custom-ads"],[10694,".widget_a4h_ads"],[28949,".widget_widget_pub"]]);
const highlyGeneric = /* 54 */"[ad-unit=\"160X600\"],\n[ad-unit=\"300X250\"],\n[ad-unit=\"300X600\"],\n[ad-unit=\"468X60\"],\n[ad-unit=\"728X300\"],\n[ad-unit=\"728X90\"],\n[class$=\"125ads\"],\n[class^=\"a4h_ads-\"],\n[class^=\"ad-id_ad\"],\n[class^=\"ad-location_comments\"],\n[class^=\"ad-location_content\"],\n[class^=\"ad-location_post\"],\n[class^=\"google_ads_container\"],\n[data-content=\"advertisement\"],\n[data-original-title=\"Advertisment\"],\n[data-original-title=\"مساحه اعلانية\"],\n[href*=\"ad2games.com/\"],\n[id^=\"ads300_600-widget-\"],\na > img[alt=\"ضع اعلانك هنا\"],\na > img[title=\"تبلیغات\"],\na > img[title=\"ضع اعلانك هنا\"],\na[data-ads-placement-id],\na[data-ads-placement-type],\na[href*=\".aflam.info\"],\na[href*=\".forooqso.tv/\"],\na[href*=\".hao123.com/?tn=\"] > img,\na[href*=\"/?track=ad:\"],\na[href*=\"adintop.com/outgoing/click.php?\"],\na[href*=\"dubizzle.com/ar/?utm_source=\"],\na[href^=\"http://arabyads.go2cloud.org/\"],\na[href^=\"http://clicks.pipaffiliates.com/\"] > img,\na[href^=\"http://viral481.com/srv.\"],\na[href^=\"http://www.fusebux.com/index.php?r=\"] > img,\na[href^=\"https://arabic-life.buzz/\"],\na[href^=\"https://cs-api.postquare.com/gas-api/click.json?\"],\na[href^=\"https://firstbyte.pro/?from=\"] > img,\na[href^=\"https://halocell.com/go/\"] > img,\na[href^=\"https://khamsat.com/?r=\"] > img,\na[href^=\"https://witalfieldt.com/\"],\naside[id^=\"custom-ads-\"],\ndiv[class^=\"ad-id_shortcode\"],\ndiv[class^=\"ads-area-\"],\ndiv[id^=\"POSTQUARE_WIDGET\"],\ndiv[id^=\"adSlot-inPage\"],\ndiv[id^=\"admixer_\"],\ndiv[id^=\"ads-postbr\"],\ndiv[itemtype=\"https://schema.org/WPAdBlock\"],\nimg[alt=\"إعلان\"][height=\"60\"],\nimg[alt=\"إعلان\"][width=\"150\"],\nimg[alt=\"ضع إعلانك هنا\"],\nimg[alt^=\"مساحة اعلانية\"],\nimg[src*=\"/adv/\"][alt=\"إعلان\"],\nimg[title=\"اعــلن مــــــعنا\"],\nregion-pub-top";
const exceptions = /* 1 */[".ad-cell"];
const hostnames = /* 1 */["risalaradio.com"];
const hasEntities = false;

self.genericSelectorMaps = self.genericSelectorMaps ?? [];
self.genericSelectorMaps.push(lowlyGeneric);
self.genericDetails = self.genericDetails ?? [];
self.genericDetails.push({ highlyGeneric, exceptions, hostnames, hasEntities });

})();

/******************************************************************************/
