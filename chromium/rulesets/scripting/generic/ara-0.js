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

/******************************************************************************/

const genericSelectorMap = [[1196,"#AdDivUnderNews"],[1838,"#AdPlacementBetweenNews"],[422,"#AdvContainerTopRightAds"],[3024,"#Arpian-ads"],[3577,"#ClicksAds"],[1426,"#FixAdv160L,\n#FixAdv160R"],[697,"#ad-center-most-view"],[2885,"#ad4game728x90"],[2533,"#adLeftHolder"],[2064,"#adOTPDesktop"],[1173,"#adOTPMobile"],[2199,"#adRightHolder"],[410,"#adSlot-inPage-300x250-left"],[2161,"#adSlot-inPage-728x90-top"],[223,"#adintop_video,\n#b_ad"],[2443,"#adpost2"],[2011,"#ads_300_250"],[911,"#adspos1"],[908,"#adspos2"],[61,"#alaa-ads"],[2338,"#alaa-ads-content"],[1004,"#b_ad2"],[3037,"#block-ads1,\n#block-ads2"],[3947,"#deskads"],[2750,"#desktopAds"],[3290,"#headads"],[2947,"#it-ad-header"],[2893,"#madspos1"],[2894,"#madspos2"],[2895,"#madspos3"],[455,"#mpuAfter"],[2262,"#readmoreads"],[2313,"#rightBannerGoogleAd"],[731,"#zwaar_ad_id"],[1037,"#zwaar_float_ad_area"],[2763,".AD_Dynamic"],[718,".Ad160-left"],[900,".Ad160-right"],[1520,".Ads-PostTop"],[3090,".ExampleAd"],[700,".FixAdv160"],[2244,".LeftAds"],[3197,".LongGAds"],[2384,".RightAds"],[2386,".Seo-plus-Ads"],[617,".a3lan-Center"],[1157,".a3lan-end"],[4078,".a3lan-related"],[1696,".a3lan-top"],[3969,".ad--list"],[3986,".ad-id_"],[3531,".ad-id_shortcode"],[1150,".ad-lft"],[3335,".ad-location_"],[1564,".ad-location_comments_above"],[1541,".ad-location_comments_below"],[2258,".ad-location_content_above"],[2083,".ad-location_content_below"],[1140,".ad-location_content_middle"],[3250,".ad-location_content_middle_2"],[1079,".ad-location_footer_above"],[1076,".ad-location_footer_below"],[1011,".ad-location_post_end"],[1109,".ad-location_title_above"],[943,".ad-location_title_below"],[2181,".ad-location_wrapper_left"],[177,".ad-location_wrapper_right"],[622,".ad-post-bottom"],[3109,".ad-rt"],[518,".ad-sidy"],[2120,".ad-type_adsense"],[2965,".ad-type_code"],[694,".ad160left"],[773,".ad160right"],[830,".ad220"],[3171,".ad250250"],[3771,".ad720"],[362,".adAsync"],[602,".adNavDesktop"],[2170,".adNavMob"],[3261,".adOTPDesktop"],[568,".adOTPMobile"],[514,".adTtl"],[686,".ad_300_300-widget"],[3998,".ad_300_300-widget-2,\n.adv_side_right"],[83,".ad_banner728"],[897,".adbottomfixed"],[3144,".add_banner"],[2683,".add_banner2"],[895,".ade160"],[1299,".ads-aa"],[3836,".ads-h-100"],[665,".ads1post"],[858,".ads2post"],[114,".ads__slot"],[1772,".ads__title"],[3553,".ads_ar_wid"],[3557,".ads_en_wid"],[2915,".ads_sq"],[3150,".adsagcompa"],[3820,".adsense-box-l"],[3826,".adsense-box-r"],[2625,".adsheadmu"],[903,".adsonadsbox"],[1618,".adspos"],[3966,".adspostsfotter"],[1103,".adv-area"],[1561,".advCON,\n.top_small_ad"],[2442,".advSmall"],[3833,".adv_outer"],[3245,".adv_side_left"],[1358,".advertisement-box-desktop"],[1350,".advertisement-square-mobile"],[125,".angular_advertisement"],[831,".article-ad-feed"],[2740,".bestaAds_desktop"],[1396,".bloxad"],[3324,".borderMobAds"],[1189,".box-s-ad"],[3880,".boxLeftAd"],[62,".boxRightAd"],[1203,".desktopAds"],[3465,".dfp-ad-desktop-halfpage-1"],[3466,".dfp-ad-desktop-halfpage-2"],[1890,".dfp-ad-desktop-mpu-1,\n.dfp-ad-desktop-mpu-2"],[495,".dfp-ad-mobile-halfpage"],[3482,".dfp-ad-tablet-ldb-1"],[3481,".dfp-ad-tablet-ldb-2"],[2762,".dfp_ad_top_ldb1_desktop"],[1264,".dfp_ad_top_ldb1_mobile"],[1249,".dfp_ad_top_ldb1_tablet"],[3044,".e3lan-code"],[1474,".e3lan300_600-widget"],[3272,".fbAdsCont"],[482,".fixed-ads-left"],[1448,".fixed-ads-right"],[792,".fixedMpu"],[1768,".float_ads"],[1560,".geminiLB1Ad"],[1723,".geminiLB2Ad"],[3876,".geminiSC2Ad"],[1637,".getSponsored"],[1523,".header_add"],[199,".hidden_pub"],[2781,".home-page-ads"],[50,".i3lan"],[1925,".iklan-kanan"],[3574,".iklan-kiri"],[330,".la-ads-a-wide,\n.la-ads-b-wide"],[2946,".la-ads-b-rec"],[975,".la-ads-title"],[2148,".la-mob-ads-250x250"],[1920,".la-mob-ads-320x100"],[3863,".label-ads"],[634,".left-and-right-sponsers"],[1816,".leftadsag"],[1937,".logoAdv"],[1188,".mobileAdSep"],[2486,".mobileAds"],[3456,".mom-e3lan"],[1654,".mom-e3lanat"],[3134,".mom-e3lanat-inner"],[4059,".mom-e3lanat-wrap"],[262,".pub-980x90"],[743,".region-pub-widget"],[2364,".reyadiAdvs"],[6,".right-and-left-sponsers"],[2758,".safeAreaAds"],[2600,".safeAreaLeftAds"],[1706,".safeAreaRightAds"],[2104,".sideColAds"],[2836,".sidea-ad"],[3887,".sponser-stick"],[1005,".sponsorDuplicate"],[413,".srapad"],[4044,".srapad_bg"],[2101,".to-ad-text"],[3787,".topa-ad"],[476,".udm-ad"],[600,".widget-custom-ads"],[2502,".widget_a4h_ads"],[277,".widget_widget_pub"]];
const genericExceptionSieve = [2823];
const genericExceptionMap = [["risalaradio.com",".ad-cell"]];

if ( genericSelectorMap ) {
    const map = self.genericSelectorMap =
        self.genericSelectorMap || new Map();
    if ( map.size !== 0 ) {
        for ( const entry of genericSelectorMap ) {
            const before = map.get(entry[0]);
            if ( before === undefined ) {
                map.set(entry[0], entry[1]);
            } else {
                map.set(entry[0], `${before},\n${entry[1]}`);
            }
        }
    } else {
        self.genericSelectorMap = new Map(genericSelectorMap);
    }
    genericSelectorMap.length = 0;
}

if ( genericExceptionSieve ) {
    const hashes = self.genericExceptionSieve =
        self.genericExceptionSieve || new Set();
    if ( hashes.size !== 0 ) {
        for ( const hash of genericExceptionSieve ) {
            hashes.add(hash);
        }
    } else {
        self.genericExceptionSieve = new Set(genericExceptionSieve);
    }
    genericExceptionSieve.length = 0;
}

if ( genericExceptionMap ) {
    const map = self.genericExceptionMap =
        self.genericExceptionMap || new Map();
    if ( map.size !== 0 ) {
        for ( const entry of genericExceptionMap ) {
            const before = map.get(entry[0]);
            if ( before === undefined ) {
                map.set(entry[0], entry[1]);
            } else {
                map.set(entry[0], `${before}\n${entry[1]}`);
            }
        }
    } else {
        self.genericExceptionMap = new Map(genericExceptionMap);
    }
    genericExceptionMap.length = 0;
}

/******************************************************************************/

})();

/******************************************************************************/
