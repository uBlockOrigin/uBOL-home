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

'use strict';

/******************************************************************************/

// Important!
// Isolate from global scope
(function uBOL_cssGenericImport() {

/******************************************************************************/

// rus-0

const toImport = [[14133741,"#pgeldiz"],[1165247,"#AF_kph0"],[1165246,"#AF_kph1"],[1072348,"#BlWrapper > .b-temp_rbc"],[10863966,"#JobInformer"],[15298717,"#MT_overroll ~ div[class][style=\"left:0px;top:0px;height:480px;width:650px;\"]"],[12520314,"#PopWin[onmousemove]"],[543968,"#SR_PopOver"],[15407792,"#SR_PopOverModalBackground"],[7347403,"#ad_ph_2"],[7347402,"#ad_ph_3"],[7347405,"#ad_ph_4"],[7347393,"#ad_ph_8"],[95437,"#addsDiv"],[7954035,"#adv"],[2934100,"#adv_kod_frame,#adv_kod_frame ~ #gotimer"],[15877669,"#adv_unisound ~ #ad_module_cont > [id^=\"ad_module\"],#adv_unisound ~ #main > #slidercontentContainer"],[6805713,"#advblock"],[7121859,"#advideo_adv"],[3764414,"#advideo_adv_main_div"],[125240,"#advm_preload"],[9426918,"#cyberinfrm_18"],[8281958,"#eropromo_icq"],[16189219,"#export_test_inboobs"],[7446559,"#fp_adv"],[9560942,"#fp_banner"],[1287062,"#fresh_flyroll_div"],[2481348,"#fullBannerContent"],[6670536,"#gaminator"],[69017,"#girlsBar"],[16559288,"#h_24x4"],[5914288,"#idealmedia_container"],[8744396,"#limonads_body"],[3730397,"#logethy_iframe"],[7466683,"#magnaInformer"],[5167635,"#marketgid"],[4712983,"#mmmBanner"],[8897547,"#movie_video:empty"],[5949043,"#nor_wrap"],[15132624,"#novem_billboard"],[8290161,"#onesignal-bell-container"],[12653404,"#potok_flyroll_div"],[12454573,"#radeant"],[807717,"#vPreloader"],[9561357,"#vid_vpaut_div"],[6942060,"#winvideoPlayer"],[7653246,"#zhlobam_net_informer_console"],[10161778,".AdWheelClick"],[2652345,".MIXADVERT_NET"],[2566477,".SC_TBlock"],[14496756,".ad-240x400"],[8647683,".ad-richmedia"],[1417388,".ad-richmedia-overlay"],[6980240,".admachina-banner"],[4872904,".ads300-thumb"],[480750,".ads600x200"],[1240083,".ads_600x200"],[16154022,".adsbyyottos"],[2098707,".adv-youdo"],[11134509,".advads-background"],[3933776,".ah-teaser-wrapper"],[2625482,".ainsyndication"],[3637340,".airbnb-embed-frame"],[2137165,".appwidget-journalpromo"],[14500881,".b-journalpromo-container"],[6129955,".b-offers_type_extra"],[8314506,".banner_240x400"],[13551086,".base-page_center > .banerBottom,.base-page_center > .banerTop,.base-page_center > .banerTopOver"],[13503025,".base-page_container > .banerRight"],[13495156,".base-page_left-side > #left_ban"],[6946199,".bc-adv"],[8984047,".bc_adv_container"],[11803673,".bigClickTeasersBlock"],[15580667,".block_rekl"],[8396907,".blockadwide"],[5504746,".blog-post__video-ad"],[9352744,".bottom_serial_reklama"],[13603802,".btn_rec"],[10340252,".cls_placeholder_gnezdo"],[14513226,".content_rb[id^=\"content_rb_\"]"],[2960756,".da-widget"],[3509575,".da_adp_teaser"],[9817467,".directadvert-block"],[4010668,".e-ta-rg"],[2387052,".flat_ads_block"],[16249477,".gaminator"],[11769550,".goha_ads"],[12062495,".goha_ads_acceptable"],[16736266,".grv-bell-host"],[10345381,".h_banner"],[3207679,".header-banner > #moneyback[target=\"_blank\"]"],[4519611,".health-inline-ads"],[9124104,".idealmedia"],[7245487,".itemLinkPET.plista_widget_belowArticle_item"],[6431556,".j-li_sidebar-banner"],[4196113,".js-ognyvo__item"],[11283213,".lj-recommended"],[1401300,".madv"],[11825280,".mc_cars_row"],[3034516,".mediaget"],[5719611,".medicinetizer"],[5287105,".merc_title"],[2002232,".merc_title_2"],[1855414,".modul-search"],[14395529,".module-one-search"],[916793,".mts_ad_widget"],[88001,".mtt-adhesion-container"],[1018536,".mywidget__col > .mywidget__link_advert"],[16103764,".ncwAdCommon"],[3050724,".novelty-banner ~ .dle_b_help > a[target=\"_blank\"]"],[8379255,".novinator"],[16300881,".nts-video-wrapper"],[5648130,".onona-block"],[11360407,".pb_left_banner"],[910829,".pb_right_banner"],[1718678,".pb_top_img"],[10527375,".pip-video-wrapper > .pip-video-label"],[13263838,".player-wrap > #kt_player ~ .spot-box"],[7903471,".plista-powered"],[1158769,".pr-AVA"],[14686786,".pr-AVA2"],[11638384,".redtram"],[11805273,".roxot-dynamic"],[8461216,".serp-adv__banner"],[16330826,".serp-block_type_market-offers"],[9027857,".shareaholic-ad"],[10299807,".sp_search2_table,.sp_search3_table"],[16353729,".sp_search_table"],[4329257,".surbis_banner"],[4938179,".td-a-rec"],[15475960,".tiezerlady"],[6339575,".topbaner"],[14383259,".travelpayouts_container-offers-carousel.carousel"],[15604847,".tv-grid__item-adv-content"],[15604414,".tv-grid__item-adv_wide_no"],[10019370,".tv-grid__item.tv-sortable-item.tv-sortable-item_sortable_no.tv-sortable-item_draggable_no"],[8437726,".vit_adf"],[6185775,".webnavoz_notificationbox"],[15274027,".ya-direct"],[8880992,".ya-partner"],[11219695,".yandex-rtb"],[12576119,".yandex-rtb-block"],[1271337,"noindex > .search_result[class*=\"search_result_\"]"],[1681676,".a-buttons.blue-but.a-check,.a-buttons.green-but.a-clock"],[11281275,".min-width-normal > #popup_container,.min-width-normal > #popup_container ~ #fade"],[2798587,"body.has-brand .b-content__main .b-player a[href*=\"aHR0c\"],body.has-brand .b-content__main > div[id]:not([class]):empty,body.has-brand .b-content__main > div[style^=\"height: 250px; overflow: hidden;\"]"],[12624481,"#root > .app #very-right-column,#root > .app .adfox,#root > .app .adfox-top,#root > .app .brand-widget__right-cl,#root > .app .partner-block-wrapper,#root > .app .sportrecs,#root > .app > .sticky-button"],[4285676,".app.blog-post-page #blog-post-item-video-ad,.app.blog-post-page .secondary-header-ad-block"],[13822428,".flex-promo-series > .left-col > :not(#players):not(.serial-series-info)"],[7663483,".jtn-widget-adv"],[5759607,".widget-autoru"],[965950,".rbcobmen"],[13742702,"#_u_ablock_bottomlink"],[13739842,"#_u_ablock_toplink"],[5931777,"#u_preroll_overlay"],[16695494,"#u_preroll_videoadbetnet"],[4573379,"#u_preroll_videoinvi"],[13753967,"#u_preroll_videomvd"],[464401,"#adblock_message"],[5000110,"#adblock_screen"],[15506019,".adblockInfo"],[997707,".adblock_floating_message,.adblock_floating_message"],[15505928,".adblock_msg"],[8703533,".ads-block-warning,.ads-block-warning"],[9508001,".deadblocker-header-bar,.deadblocker-header-bar"],[5353875,".detected-block-modal"],[14337331,".no-ad-reminder"],[6280966,".ad-blocker-warning,.ad-blocker-warning,.ad-blocker-warning"],[8292684,".main_adbalert"],[9832509,".pane-emediate"],[1286091,"#AdBlockDialog"],[16017428,"#aabl-container"],[6155354,"#abp-killer"],[16483126,"#adBlockAlert"],[12126396,"#adBlockAlertWrap"],[9152797,"#adBlockDetect"],[461878,"#adBlockerModal"],[4835197,"#ad_blocker"],[110156,"#adb-actived"],[231303,"#adb-enabled"],[1942400,"#adb-enabled3"],[864032,"#adb-warning"],[16649288,"#adbWarnContainer"],[2106772,"#adbcontainer-popup"],[15015673,"#adblock-alert"],[26773,"#adblock-box"],[1893540,"#adblock-honeypot"],[15010828,"#adblock-modal"],[26597,"#adblock-msg,#adblock_msg"],[4971891,"#adblock-notice"],[229812,"#adblock-overlay"],[1077504,"#adblock-warning"],[15019773,"#adblockDetect"],[27277,"#adblockWrap"],[1456354,"#adblock_detected"],[1256020,"#adblock_tooltip"],[4993046,"#adblockerModal"],[10813608,"#adblocker_announce"],[15034463,"#adblocker_message"],[6375730,"#adblocker_modal_overlay"],[26382,"#adblockinfo"],[1868786,"#adblockpopup"],[1753510,"#adbpopup"],[3437592,"#ads-blocked"],[5768128,"#adsblocker_detected"],[687088,"#advertisementjsalert"],[14511278,"#anti_adblock"],[7389599,"#box-adblocker-wrap"],[4948947,"#checkadblockernow"],[10056215,"#content_adblock_message"],[15192986,"#detectAdblock"],[16275578,"#detectadblock"],[469534,"#detection-block"],[1734199,"#detection-block-overlay"],[2028528,"#fnAdblockingOverlay"],[16072103,"#fondAdblock"],[4193768,"#gothamadblock_msg"],[7042720,"#gothamadblock_overlayh_n"],[15170857,"#js-popup-blocker"],[8083749,"#mdp-deblocker-ads"],[12316614,"#mdp-deblocker-js-disabled"],[13271825,"#message_adblock"],[3409180,"#modal-adblocker"],[2990263,"#notify-adblock"],[3656023,"#tie-popup-adblock"],[11543635,"#wrapperBlocker"],[840441,".AdblockBanner"],[6680118,".AdblockMessage"],[6546659,".AdblockMessage_msg"],[1757980,".BrokenAd"],[8927097,".ab-detected"],[14151255,".ad-alert-message-text"],[8528806,".ad-alert-wrapper"],[12609627,".ad-block-detected,.ad_block_detected"],[9673785,".ad-block-enabled"],[9665729,".ad-block-message"],[12545508,".ad-block__overlay"],[14536834,".ad-blocked"],[15114805,".ad-blocked-container"],[6295802,".ad-blocked-wrapper"],[15193444,".ad-blocking-advisor-wrapper"],[4826638,".adBlock-banner"],[2289214,".adBlockDetectModal"],[10554726,".adBlockDetectedSign"],[10536060,".adBlockNotification"],[16718786,".adBlockNotificationOverlay"],[4833926,".adBlockWarning"],[2395242,".ad_block_off"],[1793136,".ad_blocker"],[1084083,".adace-popup-detector"],[16736084,".adb-detect.simple-alert-boxes"],[15440618,".adb-enabled"],[9061862,".adbd-background"],[2517021,".adbd-message"],[2536747,".adbd-wrapper"],[3062780,".adblock-message"],[7234369,".adblock-modal"],[5309876,".adblock-modal-content"],[2009117,".adblock-notification-wrapper"],[589331,".adblock-player"],[282393,".adblock-stop,.adblock-stop"],[6618161,".adblock-warning-partial-component"],[12620456,".adblock-warning-teaser"],[586658,".adblockOverlay"],[1054597,".adblock_detector"],[2755978,".adblock_enabled"],[282043,".adblockalert"],[13133056,".adblocker-message"],[591016,".adblocker-root"],[590915,".adblocker-wrap"],[575516,".adsblocked"],[15580493,".blockingAd"],[6356137,".counterAdblocks"],[10239101,".deadblocker-header-bar-inner"],[688730,".detectBlockBox"],[539717,".dispositifAdblock"],[359974,".dispositifAdblockContent"],[2924943,".dispositifAdblockMessageBox"],[1380962,".fuckYouAdBlock"],[5246545,".fuckYouAdBlock2"],[12359669,".header-blocked-ad"],[7743909,".js-ad-whitelist-notice"],[2985338,".js-checkad-warning"],[3513804,".kill-adblock-container"],[2109420,".modal__body-adblock"],[7770312,".msg-adblock"],[7500654,".noadblock"],[13881120,".remove-adblock-msg"],[4967047,".svg-adblock-full"],[11272620,".svg-adblock-full--box"],[10869656,".test-adblock-overlay"],[14557938,".top-bar-adblock"],[4561832,".wp_adblock_detect"],[5173214,".diysdk_webServices_banners1und1MainContent"]];

const genericSelectorMap = self.genericSelectorMap || new Map();

if ( genericSelectorMap.size === 0 ) {
    self.genericSelectorMap = new Map(toImport);
    return;
}

for ( const toImportEntry of toImport ) {
    const existing = genericSelectorMap.get(toImportEntry[0]);
    genericSelectorMap.set(
        toImportEntry[0],
        existing === undefined
            ? toImportEntry[1]
            : `${existing},${toImportEntry[1]}`
    );
}

self.genericSelectorMap = genericSelectorMap;

/******************************************************************************/

})();

/******************************************************************************/
