/*******************************************************************************

    uBlock Origin - a browser extension to block requests.
    Copyright (C) 2019-present Raymond Hill

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

// ruleset: vie-1

/******************************************************************************/

// Important!
// Isolate from global scope
(function uBOL_cssSpecificImports() {

/******************************************************************************/

const argsList = [".qc",".banners",".qx_135",".float-ck-center-lt","#custom_html-42","#mp-preload-popup-overlay",".separator",".cash-fish,\n.cash-fish-pc,\n.preload-pc,\n.top-mobile-banner",".banner-sticky-footer-wrapper","#catfish","#chilladv,\n#headermbads,\n#headerpcads,\n#mobiads,\n#pcads","#hide_float_right",".preload","#middle-box-screen,\ndiv[style^=\"position: fixed; bottom: 0px;\"]","#popup-giua-man-hinh","#quang-cao",".item-more,\n.widget-sidebar-block","#backgroundPopupp,\n#popupContact",".btn-single-cuoc","#mp-adbk,\n#mp-adx-b32",".mp-adz",".v4j-header > a[target=\"_blank\"]",".code-block",".alldiv ~ div[class]","a[rel=\"nofollow\"]",".below_ads","#overlay",".adsMobile,\n.adsShowPc,\n.offer-rating.widget-offers__list",".dcmm-button-player.row",".ads-menu",".offer__btn",".banner-top",".module_ahlaejaba",".float-ck","#bottomFixedDiv,\n#js_pup_navigation,\n#wAdList,\ntr[id^=\"word_\"]","#player + div[id]",".catfish-ck",".jw-logo",".t_logo","#qc_clgt",".advertisement","#fbox-background,\n.gnarty-offads","#mobile-ads",".ads",".ai-close-fit","#BaoMoi_HalfPage",".bm_B > div,\ndiv.ad-banner-list,\ndiv.bm_Ii",".monkey-content-duoicanbiet,\n.monkey-section-tinnoibat,\ndiv.monkey-qc",".list-dat-cuoc",".aHrefAff,\n.adsInPlayer,\n.bet-list,\n.buttonFabet,\n.top-bet-list","#wap_bottombanner",".company","div[id^=\"AdLayer\"],\ndiv[id^=\"ad_\"]",".menu-mobile.hot-menu",".container-banner,\n.logo-top-right-append-custom,\n.modal-ads,\ndiv[class^=\"slide-bar\"]",".button-bottom-center-append-custom",".button-in-player-box",".sticky",".btn-betting,\n.datCuocBTN,\n.modelAds,\n.nhacaiuytin,\n.text-running",".banner-bottom-append-custom",".footer-banner",".widget.widget_text",".block-bookmaker.block.most-view",".banner-preload","#text-14,\n.hocwp-ads",".bannerBox,\n.footerBanner,\ncenter > [href*=\"tlink.vn\"]",".adblock,\n.popup",".adsv","a[rel=\"noopener noreferrer\"]",".widget-wrap.widget_text","#custom_html-7",".div_box_adv","div.box-aside","#content > div[align=\"right\"],\n#login-ads,\n#playerDailymotion,\n.video-player,\n.wt-ads,\n.wt-ads2",".ad-pin-right-bottom",".adv",".top-right",".line-ads",".ad-container","#home_header","#iklan-atas-wrapper","#fixedban,\ndiv[class^=\"banner-mobile\"]",".samCustomSize.samAlignCenter.samCodeUnit,\n.samItem","#antiblocker,\n#antiblocker_underplayer","#layerLogo","#topbanner",".btn_small_fix_container",".ads-home-feed",".left-slider",".text-center.adsense","#sideAdsLeft,\n#sideAdsRight",".banner-bot-mobile,\n.banner-top-mobile",".catfishLoader","#latest-censored-videos > .row > div.pb-3.col:nth-of-type(1),\n.v3sb-box",".cat-fish.a-play,\n.overlay",".ads-embed,\n.float-ck-center-lt1,\n.separator_mb,\n.separator_pc,\n.topbaner,\n.topbaner_mb","#ads_preload",".anhbn-qc",".ezo_ad,\n.ezoic-ad",".advbox","div[style=\"padding: 0px; margin: 10px 0 0 0 ; width: 100%;text-align: center;min-height: 280px;\"],\ndiv[style=\"width: 100%; min-height: 240px; text-align: center;\"],\ndiv[style=\"width: 100%; min-height: 90px; text-align: center;\"],\ndiv[style=\"width: 100%;text-align: center;min-height: 280px;\"]","#link-view > center:nth-of-type(1)",".dwpb-action,\n.fixtop",".adsHOC_wrapper__i5MTn,\n.homePage_adsHomeLeft__3_ruz.adsHOC_wrapper__Se0cN,\n.style_wrapperAll__jFIbb,\n.style_wrapperAll__oHfiq,\n.style_wrapper__2LeQp,\n.style_wrapper__YEwSi,\n.textlinkBox_notwrap__scC4g.textlinkBox_wrapper__1C2P9,\n.textlinkBox_wrapper,\np[style=\"color: rgb(174, 174, 174); margin-top: 10px; margin-bottom: 20px;\"]","#countdown","#myModal,\ndiv[id^=\"adsphim-\"]",".ff-banner",".player-midpoint-progress",".player-vast-blocker","#sponsor-balloon","#js-read__body + .mt-3,\n#tpads-pc-top-page,\n.nh-read__alert,\n.px-3.nh-read__body > .text-center.pb-3,\n.text-center.pb-3.nh-read__pagination,\ndiv.text-center.pt-3:nth-of-type(1),\ndiv.text-center.pt-3:nth-of-type(2)","#div-ub-metruyencv_net,\n.tpm-unit","div[class*=\"ads\"]",".fixed_bottom",".adv_phim","[class^=\"box_adv_ele\"]","#tdi_129",".container div:not(.top) > div.mrb5.mrt5.text-center > a,\n.mrb5.text-center.container",".pcs-modal","#IMAPointernctPlayer,\n#PL_R01,\n#PL_R02,\n.adv_home_300_250,\n.nqc-zone","#adsTopInPageBanner,\n.adsContainer","#popup",".pcCatfish","#itro_opaco","#video_player ~ div[id]","div[style^=\"position:fixed;inset:0px;z-index:100000;\"]",".ads_popup",".show.ads-sticky","#mobile_content_bottom,\n.BanerTop100,\n.adv-300-right",".adpia_banner",".popUpBannerBox",".popmake",".box_option,\n.event_loader_e,\n.fix_bottom,\n.popup_center",".uniad-player + div[style]","#catfish-banner,\n.center-screen.backdrop,\n.ibetlogo,\n.topless","#itro_popup","#float_content_right",".preload-banner",".sticky-footer",".sgpb-popup-dialog-main-div-wrapper,\n.sgpb-popup-overlay",".ads-container",".ads-bottom-margin,\n.ads_blocks_advice,\n.bs-callout[style=\"min-height: 400px; margin-top:0px;\"]",".top-banner","#adsposttop","#adrighttop",".adbox",".code-block-4","#pc-preload-modal,\n.quang-cao","#scriptDiv",".adsbygoogle",".no-auto-popup,\n.qc-adskeeper",".add-logo-ads",".stream-item","#footer-widget-area,\n.e3lan.e3lan-top",".box,\n.pum",".truct-catfish,\n.truct-widget","#ad_info_top","#sticky-footer",".footer-info","#banner_preload,\n.doc-truyen-ads-d1,\n.doc-truyen-ads-d2","#hivideo","[class*=\"_banner\"]","#preload-zing,\n#uniad-head,\n.uniad-head",".sda-catfish",".happy-under-player,\n.vailo-sticky,\n.vailo-under-navbar-mobile","a[target=\"_blank\"][rel=\"dofollow\"]",".item-qc",".Header_topBanner__1xD-2,\n.styles_bannerInArticleWrapper__rPPJH,\n.styles_topBanner__NL_gW","#BigBanner,\n.ads_position",".ads_txt",".row > div > center","div[class^=\"adbox\"]","#article > .pt-3.text-centers,\n.text-muted","#balloon,\n.banner-masthead",".button-action-float-banner",".adsphim-mobile-popup",".wtt-ads","#adstop2,\n.col-lg-4.hidden-xs.d-flex.flex-column.address-wrap,\n.float-right",".adv-side-bar,\n.banner-adv-wrapper,\n.banner-adv-wrapper2,\n.item-qc1","#invideo_wrapper,\n.Ads,\n.mobile-catfixx,\n.pc-catfixx,\ndiv.Dvr-300,\ndiv[style^=\"position: fixed; top: 60px\"]",".partner-me","#container-ads,\n#hide_catfish","#ballon-right,\n.most-view:nth-child(2)",".ab1",".single-video",".widget_custom_html.widget.widget_text",".box_odds",".fixed","#top_oddd",".entry > a[target=\"_blank\"],\n.wpbcap-laptopvang,\n[href*=\"hnmac.vn\"],\n[href*=\"laptopvang.com\"],\n[href*=\"macbookgiasi.vn\"],\n[href*=\"macone.vn\"],\n[href*=\"vender.vn\"],\ndiv.\\35 fb1ed6025b0b.widget:nth-of-type(3)","#btn-skip,\n.vjs-banner-bar,\n[href=\"https://8xbet259.com/\"]",".modal-backdrop.show",".captain-sb,\n.mct_-bet,\n.vb-pr-box",".mmo-inner",".mmo",".box-host",".ft-box","#m-bet","div[class*=\"size-\"]",".ibs-bet",".show.fade","#app-web + .container[style=\"margin-bottom: 30px\"],\n.box-content .text-center[style],\n.item.item-betnow,\n.sv-link.btn-bet-top",".fade.show",".btn-betnow",".button-ads-header,\n.main-carousel-wrapper,\n.top-bookies,\n.tvc-link-ads-full","#sec_top_bet,\n.banner-bellow-append-custom,\n.banner_ctn,\n.banner_fixed,\n.banner_left,\n.banner_right,\n.bet-btn,\n.bet_now,\n.block_banner,\n.btn-in-player.btn-bottom-right-append-player,\n.click_blank,\n.logo-top,\n[href=\"/top-bet.html\"]",".banner",".footer-button-sign-in.hide-desk,\n.hide-desk.wrap-content > .wrap-btn-action,\n.menu-right-slide",".mct_-bet-bot",".btn-odds",".marquee-container","#quangcaopc",".align-items-center.justify-content-between.d-flex.col-12 > .d-lg-none.d-block",".btno-group.d-none.d-lg-flex,\n.container > .mt-1,\n.container > .mt-3,\n.d-lg-block,\n.justify-content-between.d-lg-none.d-flex.btno-group,\n.menu-item > a[rel=\"nofollow\"],\n.topButton,\n.widget_offer,\nheader > .container","div[id^=\"dnn_\"]","div[id^=\"float\"],\ndiv[id^=\"hide_float\"]","#accordion",".bbMediaWrapper-inner > .samCodeUnit,\n.js-replyNewMessageContainer.block-body > div.samCodeUnit > .samItem,\n.p-footer,\n.samVideoOverlay",".ad599div,\n.bets-now-button,\n.bets-now-ct,\n.pc_header,\na[data-wpel-link=\"external\"]","#closeAds",".v4j-header > center",".a--d-wrapper","div.container:nth-of-type(5)",".adspopupgiua,\n.adspopupleft,\n.adspopupright,\n.float-ckgiua","#_AM_POPUP_FRAME","#menubentrai,\n.gnartyx-offads","[href*=\"cellphones.com.vn\"]",".textwidget","#right_float,\n.art_header_text,\n[id$=\"float_banner\"]",".expand-static-banner,\n.head--banner,\n.static-banner",".link-gold,\n[id^=\"banner\"]",".col-xl-3.col-lg-6.d-md-block.d-none,\n.lazyloaded.mx-auto.d-block.text-center.mb-20,\n.quangcao-down > p,\n.text-down",".ads_zone","#footer_fixed_ads",".cp-modal-popup-container,\n.simple-banner",".parent.special",".ad-floater,\n.popunder-link,\n.promotion-popup,\n.video-ad-layer","#ad_global_below_navbar",".other-ads-container,\n.show-load-ad","#mobileCatfishz","#pc-top-banner","#boxmsgthongbaopopup","#custom_html-2,\n#custom_html-4",".b-player",".baloon,\n.col-sm-10.kqcenter,\n.kqbackground.vien ~ a[target=\"_blank\"]",".banner-sidebar","#sticker",".info-footer:nth-child(4)",".ads-wrapper,\n.preload-backdrop",".mobile-catfix",".fancybox-container,\n.flex-wrap-banner,\n.movie-banner,\n.mv-banner,\n.ws-banner","#js-read-body > .text-center.pb-3,\n.text-center.pb-3.nh-read__pagination > .mb-1 > .text-muted,\n[href=\"https://metruyencv.com/goout/lazada\"],\nsection.nh-section:nth-of-type(5)",".single-box,\n[href^=\"//dooloust.net/\"]",".banner_top","#npads","#pc-catfix,\n.lightbox-player-pc,\ndiv[id^=\"preload-\"],\nlixi88-ads-left,\nmb_catfish_1xbet,\nmobile-catfix,\npreload-11bet,\nsobet-ads-right","#ads-catfish","#headwrap > .computer,\n#headwrap > .mobile,\n.pc-catfix","#pm_quangcao",".container > .right-box","#popup_banner_beta",".ad-script,\n.elementor-widget-container > .widget_custom_html","[href^=\"https://gotrackecom.info\"]","#tut4ktream_idAdLink","#desktopPopupBanner,\n.ads-floatingads,\n.banner-item,\n.top-nha-cai",".fixed-bottom",".firstmessfloadright.samItem,\n.my_nonresponsive_ads,\n.my_responsive_ads,\n.samBannerUnit,\n.samTextUnit","#catfish-adv,\n#overlay-pop,\n.mobile-catfish,\n.pc-catfish",".ads-menu-item,\n.dcmm-button-player-item",".divdatcuoc",".widget",".show-ads-banner",".show.fade.modal",".btn-bet-top,\n.item-betnow",".elementor-widget-image",".box-rating","#ads_large_detail,\n#banner_top,\n#box_qua_tang_vne,\n#raovat,\n#sis_popup,\n#supper_masthead,\n.article_ads,\n.article_ads_300x250,\n.banner_mobile_300x250,\n.section_ads_300x250","div[class*=\"qca\"]",".content_middle_rightbar","#catfish_content","#idAdLink",".adsShowMobile",".adLogoPlayer","#fixed-advert-center-panel",".PanelScroller.Notices","#preload-2",".black-layout > div:nth-child(2),\n.popup_u,\ndiv[style^=\"position: absolute;top: 0;\"]","div#bnads",".homePageAds","[id^=\"Balloon_\"]","div.vebo-sp.container:nth-of-type(7)",".sticky_bottom","#bar_float_r,\n.quangcaomb",".hd-tube-desktop,\n.hd-tube-mobile","body > [style*=\"position: fixed;\"]",".catfix","#header-ads,\n.catfish-img",".lixitt","#top-banner-pc",".container > .row > center",".footer-fixed-br-container","#menu-main-menu > .menu-bongdainfo.menu-item.nav-item.tt-bdif,\n#menu-main-menu > .menu-nha-cai-uy-tin.menu-item.nav-item.style-2 > .nav-link,\n.c-int.d-lg-none.d-block,\n.col-xl-4,\n.container > .row > .col-12,\n.justify-content-center.d-flex > .btn-primary.btn,\n.mt-1.d-lg-flex.d-none.sub-menu,\na.d-lg-none.d-block:nth-of-type(2)",".d-lg-none.d-block.p-1.text-center","#match-child-1",".match-detail__offer",".menu-cuoc-8xbet","#ad-floating-right,\n.ad-floating-left","div.text-center:nth-of-type(7),\ndiv[style=\"min-height: 250px\"]","#menu-item-52424,\n.btn-od,\n.style-1.ml-2.d-none.d-lg-block.menu-item.menu-item-type-custom.menu-item-object-custom.menu-item-52424",".sub-menu.d-none.d-lg-flex","div[data-value=\"1\"]","[data-clm=\"ccccc2\"],\n[data-id=\"ap3poapup\"]",".movies-list-wrap > center","#bnc1","#bnc0",".widget_media_image.widget_block.widget,\nimg.wp-image-1283,\nimg.wp-image-1285",".xx-ads",".banner-link,\n.block-catfish.text-center.d-lg-none.d-block,\n.container > ul,\n.container.mt-1,\n.logo-cnt > .d-lg-none.d-block,\n.menu-cuoc-one88,\n.mt-5.d-lg-none.d-block.pb-2.text-center,\n.offer,\n.pl-lg-0.col-xl-4,\n.row.d-none,\n.sk_balloon,\n.widget-offers__list,\na.btn-odds[rel=\"nofollow\"],\ndiv.d-lg-none.d-block:nth-of-type(3)",".menu-top-nha-cai",".d-lg-flex.d-none.p-0.company.flex-1.table,\n.grid-match__footer,\na.d-lg-none.d-block:nth-of-type(1)",".container.mt-1.d-none.d-lg-block,\n.menu-item-object-custom,\na.rlw-extra-i.py-3.flex-grow-1","#qc-kpgame","#ad-container","#ads,\n#overlay-close,\n#play","#position_full_top_banner_pc","#newmenu + div > div[style]",".button-dangkyngay",".afw-topbanner","#adm-slot-7234","#banner3double",".box-ads-bar","div[id^=\"adsWeb\"]",".BT-Ads,\n.qc-inner,\ndiv.qc_TC_Chap_Middle,\ndiv[id^=\"qc_M_\"],\ndiv[style*=\"position: fixed;\"]",".bgadmtoptotal",".bannertop",".top-right-col-ads",".my_responsive_add,\n.titleBar + *,\n[class1=\"my_responsive_add\"]","#background_bg_link,\n#subRightAbove,\n.module3",".admicro",".top-header","#onefootball,\n.top_page","#subiz_wrapper,\n.ad-embed",".features-r","#bannerMasthead,\n#desktop-home-top-page,\n#dta_inpage_wrapper,\n#dtads_inpage_wrapper,\n#mobile-home-middle-1,\n#mobile-home-middle-2,\n#mobile-home-top-page,\n#mobile-top-page",".widget_media_image.widget",".banner-cs",".banner-top-main,\n.baohaiquan_bottom_970x250",".top-advertisment",".ads-gg-top,\n.container + .col-xs-12.content_wrap,\n.content > .content > .content,\n.wrap-single > .pagination.text-center","._ning_outer","#Adsv,\n.right-banner > a[title]",".__ads_click","#BannerAdv","#gallery-2,\n.hd-cate-wrap,\n.home-qc-wrap,\n.home-sec-right .widget_media_image,\n.noname-left",".columns-widget .col-right",".chapter-content .min-h-\\[275px\\]",".Advs_adv-components__1nBNS.Advs_adv-300x250__2eyhC.Advs_no-content__RWwW2,\n.HotTagGlobal_fixed-height__1f50i",".box_ads_d",".exp_qc_share",".c-banner",".warp-banner-vip",".sidebar > div[style]","#div-ub-docbao","#ouibounce-modal,\ndiv[id^=\"adsbg\"]","#widget-12",".banr-Rt,\n.banrpstn","#myElementz,\n.bannerinfooter",".LRBanner",".bg_allpopupss,\n.bgal_popndungalal,\n.bn1,\n.bn2,\n.box_baiviet_dexuat,\n.box_quangcao_mobile_320x50,\n.box_text_qc","#tubia","[id^=\"admzone\"]",".ads-right1,\n.adv-row",".adx-zone,\n.underlay",".khw-ads-wrapper.clearfix","#qcRight,\n.banner-advertisements",".banner-bottom-menu,\n.popup-bg,\n.showpop,\n[href*=\"bit.ly\"]",".qc-benphai,\n.qc-bentrai","#adrightsecondx,\n#adrightspecial,\n#adrightspeciallinks,\n#adsrighttop,\n#adsuggestion","#modal-ads-olm",".advertTop,\n.module_plugins",".ads-sponsor,\n.khw-adk14-wrapper","[id^=\"adv\"]",".quang_cao_chan_trang_pc,\n.quang_cao_pc_right_hoc_tap",".advHolder",".ads_shortcode",".admicro_top","#adop_bfd,\n.adsbypubpower,\nins[class*=\"adsby\"]",".sponsor-zone","div[id^=\"ads_\"]","#top-adv",".bannerchuyenmuc,\n.baseHtml.noticeContent,\n.show-qc-home,\n.show_qc","#popup_center","div[style=\"text-align:center;margin-top:0px;margin-bottom:0px;\"]",".box-banner",".banner-ads-home,\n.banner-in","div[class^=\"adv-\"]",".ads-970x280","#mobi-top,\n#pc-top,\n.d-flex.justify-content-between > div > div.d-flex.justify-content-around.mt-4","#myCarousel,\n.banner-boder-zoom",".modal-di__button-wrapper,\n.sam-slot",".ads-general-banner",".LeftFloatBanner,\n.RightFloatBanner,\n.ads_top_left",".asd-headt,\n.detail-tab > .container,\n.detail__foru,\n.super-masthead,\n[class*=\"box-home\"],\n[data-marked-zoneid=\"tn_detail_danhchoban\"],\n[data-marked-zoneid=\"tn_detail_quantam\"],\n[id^=\"dablewidget_\"],\nzone","div[class$=\"_ads\"],\ndiv[data-id=\"2\"]",".ads_660x90,\n[class^=\"ads_\"]",".c-banner-item","div[id^=\"adsMobile\"]",".fyi",".ads-common-box",".p-body-pageContent > table[style=\"width:100%;display:inline-block;background: #fff;\"]",".in-article-promo,\n.jsx-3569995709,\n.micro,\n.middle-comment-promotion,\n.pro-container,\n.promo-container,\ndiv[style=\"width:300px;height:250px\"],\ndiv[style=\"width:300px;height:600px\"],\ndiv[style=\"width:320px;height:100px\"]",".container .desktopjszone,\n.mobilejszone","#header-ads-full,\n.ads-responsive,\n[id^=\"ads-\"]","#LeaderBoardTop,\n#admbackground,\n#adsMainFooter,\n.Mobile_Masthead_TTO_Wrapper,\n.adm-bot,\n.box-qad,\n.section__r-vietlot,\n.wrapper-ads-mb",".clearfix.adregion,\n.visible-md.header-banners",".bannerqc,\n[class^=\"sticky-top\"],\n[href*=\"/default/template/\"],\n[href*=\"hungthinhcorp.com.vn\"],\n[href*=\"vietcombank.com.vn\"]",".Flagrow-Ads-under-header",".vfs_banner","#headerProxy,\n.rightleftads","#vmcad_sponsor_middle_content,\n.box-adv,\n.mb-20.col-right-ads,\n.vmcadszone",".zone--ad","section.mar20:nth-of-type(2),\nsection.mar20:nth-of-type(4)","#banner-dai-bottom,\n#banner-dai-top",".v-element > .v-responsive,\ndiv.message--post",".sys-ads",".bf-3-primary-column-size.bs-vc-sidebar-column.vc_col-sm-3.vc_column_container.bs-vc-column.wpb_column > .wpb_wrapper.bs-vc-wrapper",".wrapper-adv","#banner1ab,\n#banner2ab",".ad_by_yellowpages,\n.banner_add","#Zingnews_SiteHeader,\n#site-header,\n.znews-banner","#adx,\n.catfish-bottom,\n.catfish-top,\ndiv.banner-catfish-bottom",".most-view:first-child","#ads_location,\n.block.ad",".odds-button,\n.odds-button2",".click-ads,\n.click-ads ~ p,\ndiv.mrb10",".a-header,\n.apu,\n.header"];

const hostnamesMap = new Map([["*",0],["bongda365.asia",1],["keoso.club",[1,16]],["bongdatructuyen28.com",[1,53]],["soikeoz.net",[1,260]],["hentaivn.autos",2],["cliphot69.biz",[3,4]],["phevkl.biz",[3,5,6]],["hh3dhay.com",[3,84]],["khoaiphim.com",[3,95,96]],["phimtn.com",[3,14,136]],["phimhay.in",3],["mobiblog.lol",3],["animesub.me",[3,14]],["phimhay.mobi",[3,33,221,222]],["hdphim18.net",[3,240]],["chillhayy.online",3],["phimmois.org",[3,5]],["phimvuihd.org",3],["cliphotvn.pro",3],["phimtuoitho.tv",[3,312]],["vietphims.tv",[3,315]],["phim18hd.biz",7],["phim18vn.biz",7],["phim18hd.me",7],["biphims.cc",8],["biphims.co",8],["biphim.io",[8,24,188]],["phimmoiaz.cc",9],["hhtrungquoc.com",[9,85]],["phimbocn.com",9],["phimhoathinh3d.com",[9,14]],["phimmoiv2.com",[9,78,133]],["motchillss.net",9],["phimmoipro2.net",[9,14,20,37,259]],["xemphimchill.net",[9,14,78,130]],["hhtq.top",[9,186,296]],["hhtqvietsub.top",[9,109,297,298]],["hhninja1.tv",9],["hoathinhtq.tv",[9,14]],["hhtq.vip",9],["phimmoichill79.cc",10],["tuoinung.cc",11],["xxx.yeusex.cc",12],["huphimtv.com",[12,43,90,91,92]],["sexviet1.vip",12],["animehay.city",13],["anivn.club",[14,15]],["animevietsub.boctem.com",14],["phimdinhcao.com",[14,128,129,130]],["8phimmoi.net",[14,37,78,224]],["hhhtq.net",[14,163]],["mephimgi.net",[14,78]],["phimdinhcao.net",[14,128,129,130]],["phimlongtieng.net",[14,128,129,130]],["vkool2.net",[14,20]],["motchillz.org",[14,37,78]],["fimfast.pro",[14,78,90]],["bongda21h.co",[17,18]],["phym18.org",[17,50,286]],["motchill.co",[19,20]],["motphimtw.com",[19,20]],["phimmoichillh.net",[20,258]],["ophim.vip",[20,78,133,322]],["phimsexhay669.co",21],["phimvietsub.co",22],["gocphimvn.net",[22,239]],["mobile.sexnhanh.co",23],["subnhanhvl.co",[24,25,26]],["phimmoi4s.com",[24,132]],["stream.tructiepnba.com",[24,155]],["xemtivi4k.com",[24,177]],["subnhanh.im",[24,25,26]],["vidian.me",[24,219]],["ketqua3.net",[24,244]],["ketqua9.net",[24,244]],["truyenchu.com.vn",[24,355]],["nghean24h.vn",24],["vbfast.xyz",24],["tructiepdabong4.co",[26,27,28,29,30]],["vkoolsss.net",[26,33,36,275]],["mitome.tv",[26,50,51,191,209,210,211,212,214,272,302,308,309]],["tutientruyen.xyz",[26,260]],["vaoroi13.online",[28,29,269,270,281,282]],["xoivo1.online",[28,270,271,282]],["xoilac89.tv",[30,50,51,191,200,210,211,214,303,304,305,309,317,318]],["123nhadatviet.com",31],["bongda365f.com",[31,37,49]],["123nhadatviet.net",31],["tuoitre.vn",[31,413]],["tuoitrenews.vn",31],["4rkinggame.com",[32,33]],["dailyphimz.com",33],["listnhacai1.com",[33,102]],["phim18vipb.com",33],["phimplay24h.com",[33,135]],["web10.sexphim1.com",[33,146]],["sieudamtv.com",[33,121,147]],["kenhgamez.info",33],["rphang.me",[33,217]],["gunnylau360.net",33],["gunnymienphi.net",33],["mythethao.net",[33,253]],["thiendia1.net",[33,266]],["vuonhoalan.net",[33,278]],["checkgaigoi.one",33],["phim33.tv",[33,310]],["phe3x.xyz",33],["phimno4.xyz",[33,432]],["live.7mvn2.com",34],["abysscdn.com",35],["freeplayervideo.com",35],["player-cdn.com",35],["ahaphimz.com",36],["vphims.net",36],["api.anime3s.com",[37,38]],["cakhia20.com",[37,54,55,56,57,58,59,60]],["p.thoctv.com",37],["vebo8.link",[37,191,192,193,194,195,196,197,198,199,200]],["player.4shares.live",37],["cakhia22.live",[37,54,55,56,57,58,59,60]],["cakhia25.live",[37,54,55,56,57,58,59,60]],["rakhoi10.live",[37,56,57,58,59,60,207]],["rakhoi9.live",[37,56,57,58,59,60,207]],["animet.net",[37,41,225]],["mephimtv.net",[37,250]],["ssplay.net",[37,224]],["play.vnupload.net",37],["tvhayt.org",[37,38,260]],["xoilac14.org",[37,196,197,198,199,202,203,290]],["caheo7.tv",[37,54,55,56,57,58,59,60]],["livefb.xyz",[37,55,56,59]],["mphimmoi1.xyz",[37,43,92,122,431]],["tvhay2.net",[38,96,267]],["phimvietsub.pro",[38,291]],["anime47.com",[39,40]],["doctruyen3qmax.com",40],["toptruyenne.com",40],["animetvn2.com",[41,42]],["appvn.com",43],["javtopxx.com",[43,94]],["laptrinhx.com",43],["linkerpt.com",43],["tinnhac.com",43],["xemphimvuis.com",[43,92]],["animevietsub.fan",[43,179]],["film365.in",[43,182,183]],["ghienphim8.net",[43,180,206,235,236]],["motphim3s.net",43],["ophimhdvn3.net",[43,249,255]],["phimgichill.net",[43,249,255,257]],["soikeo365.net",[43,264]],["vieclam123.net",43],["xemphimviet1.net",[43,206,236]],["cungthi.online",43],["antt.vn",43],["bongda24h.vn",43],["kienthuc.net.vn",[43,387]],["nhadautu.vn",43],["saostar.vn",[43,397]],["vietnamplus.vn",[43,420]],["vlxx.xxx",[43,63,106,430]],["audiotruyenfull.com",44],["baomoi.com",45],["m.baomoi.com",46],["baonga.com",47],["bongda12h365.com",48],["bongdainfoz.com",[50,51]],["tvhayhd.com",[50,160]],["vebot.live",[50,51,60,191,200,209,210,211,212,213,214]],["90phutv.tv",[50,51,191,209,210,211,272,301,302,303,304,305]],["xoilaczn.tv",[50,209,304,305,318,319]],["cakhia7.vip",[50,51,191,210,211,212,214,272,309,320]],["bongdalu6.com",52],["hoatieu.vn",[57,143,171,377]],["canhrau.com",61],["topthuthuat.com",61],["chillphim1.com",[62,63]],["zuiphim.com",63],["chouc.com",64],["clbgamesvn.com",65],["cmangaaz.com",66],["coccoc.com",67],["contuhoc.com",68],["cryptoviet.com",69],["dexuat.com",70],["diadiem.com",71],["doisongphapluat.com",72],["dtruyen.com",73],["dubaotiente.com",[74,75]],["ducvietonline.de",75],["bongda.com.vn",[75,340]],["giadinhonline.vn",[75,358]],["taichinhdoanhnghiep.net.vn",[75,206]],["nongnghiep.vn",[75,358]],["vietnamnet.vn",[75,419]],["ebookbkmt.com",76],["ephoto360.com",[77,78]],["thiepmung.com",78],["phimmoi.im",[78,180,181]],["fsharetv.com",79],["gaingon18.com",80],["game4v.com",81],["forum.gocmod.com",82],["hayghe2.com",83],["truyensieuhay.com",[85,158]],["hoahoc247.com",86],["hoidap247.com",87],["homedy.com",88],["hotruyen.com",89],["phim18zz.com",[92,122]],["hdphimhay1.xyz",92],["javtiful.com",93],["phimcuon.com",[96,127]],["lacaigi.com",97],["laptrinhcanban.com",98],["lichngaytot.com",99],["lichvannien365.com",100],["link1s.com",101],["lmssplus.com",103],["loigiaihay.com",104],["luotphimtv1.com",105],["webphim2.com",[105,175]],["cdnwp.icu",105],["luotphim1.net",105],["luotphim2.net",105],["luotphimtv.vip",105],["mehoathinh3.com",[106,107]],["mephimmy2.com",106],["mephimnhat2.com",[106,107,108,109]],["mephimthai2.com",106],["animevip.tv",106],["phimmoi2.com",[107,108,109]],["phimnhanh2.com",[107,108,109]],["vuighe2.com",[107,173]],["hhchina.tv",[109,298,306]],["metruyencv.com",[110,111]],["metruyencv.net",[111,251]],["mmo4me.com",112],["baodauthau.vn",[112,331]],["mphim14.com",[113,114]],["phimmoinay.tv",[114,163,260]],["muabanraovat.com",115],["muaxegiatot.com",116],["nettruyenus.com",117],["nhattruyenmin.com",117],["nhattruyenplus.com",117],["nhattruyenup.com",117],["tin2.news25link.com",118],["nhaccuatui.com",119],["ophimhay.com",[120,121]],["phim202.com",123],["player.phimbocn.com",[124,125]],["cliphotvn.2tenz.top",[124,125]],["hls.playerfb.xyz",124],["phimchat2.com",126],["saytruyenmoi.com",126],["phimbo88vn.net",126],["truyentuan.com",[129,159]],["tenovi.net",129],["phimhaymoi.com",131],["phimnhua.com",134],["phimyeuthichz.com",[137,138]],["boophim.net",[137,229]],["lxmanga.net",[137,138,248]],["phimnet.vip",[137,183,323]],["truyensextv.com",[138,157]],["truyensextv.me",[138,157]],["truyensextv.org",138],["photoshoponlinemienphi.com",139],["gameviet.mobi",139],["phuongtrinhhoahoc.com",[140,141,142]],["ketqua247vn.org",140],["tructiepbongda29.com",142],["thanhnien.vn",[142,402]],["quantrimang.com",[143,144,145]],["vndoc.com",[145,171]],["khoahoc.tv",145],["download.com.vn",145],["download.vn",[145,363]],["gamevui.vn",[145,363,372]],["meta.vn",145],["sieutamphim.com",148],["tailieungon.com",149],["giavang.net",149],["romgoc.net",149],["tctruyen.com",150],["tctruyen.net",150],["thoctv.com",151],["thuthuatjb.com",152],["thuthuattienich.com",153],["toithuthuat.com",154],["truyenqqvn.com",156],["tvso1.com",161],["bongdaso66.net",[161,228]],["blog.abit.vn",[161,326]],["tvzinghd.com",[162,163]],["vailonxx.com",164],["vatlypt.com",165],["vesotantai.com",166],["vietcetera.com",167],["vietgiaitri.com",168],["vietjack.com",169],["vietyo.com",170],["vtruyen.com",172],["webhoctienganh.com",174],["webtretho.com",176],["xosodaiphat.com",178],["a3manga.info",184],["motphim1.info",[185,186]],["phimhaytv.info",187],["maclife.io",189],["gavang.link",190],["90phut9.live",[191,197,198,201,202]],["bongcam.live",[191,193,197,200,203]],["khomuc9.live",[191,200,204]],["thapcam.live",[191,194,197,200,208,209]],["vebotv.net",[195,197,198,199,272,273]],["vebo4.org",[195,197,198,199,272]],["mannhan2.live",[205,206]],["thichxemphim1.net",[206,265]],["baoxaydung.com.vn",206],["oj.husc.edu.vn",206],["tienphong.vn",[206,331,406,407]],["toquoc.vn",206],["zingnews.vn",[206,381,429]],["chotlo.me",215],["ngaytho.me",216],["thethao12h.me",218],["javhay.media",220],["mephimnhe1.net",[221,249]],["sieukhung.name",223],["zophim.net",224],["bantincongnghe.net",226],["blogkiienthuc.net",227],["chodansinh.net",230],["daominhha.net",231],["designervn.net",232],["dongphim3s.net",233],["dongchill.tv",233],["gamenoob.net",234],["gockhuat.net",237],["gocphimk.net",238],["hoc247.net",241],["iphimchilla.net",242],["vn.javbabe.net",243],["kienviet.net",245],["laptrinhvb.net",246],["linkneverdie.net",247],["mitub.net",252],["nhacpro.net",254],["phimbom.net",256],["phimmoichillg.net",258],["phimtho.net",260],["protruyen.xyz",[260,434]],["qthang.net",261],["sachmoi.net",262],["sexhay2023.net",263],["vaoroi365.net",[268,269,270,271]],["vietmoz.net",274],["vnexpress.net",276],["vtipster.net",277],["phimbathu.one",279],["tut4ktream.online",280],["bongdahomnay.org",283],["btcvn.org",284],["chillhay.org",285],["vn.phym18.org",287],["traderviet.org",288],["xemtivingon.org",289],["keonhacai5.top",[289,299]],["tuoi69.pro",292],["javhd.shop",293],["vlxx.studio",293],["filemoon.sx",294],["phim.heo69.top",295],["viet69.tube",300],["hhhkungfu.tv",307],["phimdacap.tv",311],["vieclam.tv",[313,314]],["xskt.com.vn",314],["vlxyz.tv",316],["khiphach.vip",321],["2banh.vn",324],["2game.vn",325],["afamily.vn",327],["sport5.vn",327],["m.afamily.vn",328],["autodaily.vn",329],["xehay.vn",[329,427]],["baodansinh.vn",330],["blogtruyen.vn",332],["cafebiz.vn",333],["cafef.vn",334],["ttvn.toquoc.vn",334],["careerlink.vn",335],["chap.vn",336],["24h.com.vn",337],["autopro.com.vn",338],["baohaugiang.com.vn",339],["congan.com.vn",341],["daklak24h.com.vn",342],["dantri.com.vn",343],["ecci.com.vn",344],["fptshop.com.vn",345],["haiquanonline.com.vn",346],["nld.com.vn",347],["tamlinh247.com.vn",348],["tapchikientruc.com.vn",349],["thanhtra.com.vn",350],["thoidai.com.vn",351],["petrotimes.vn",351],["thuongtruong.com.vn",352],["thuysanvietnam.com.vn",353],["trithuc24h.com.vn",354],["voh.com.vn",356],["congluan.vn",[357,358]],["congly.vn",359],["thitruongtaichinhtiente.vn",[359,405]],["dangtinbatdongsan.vn",360],["realty.vn",[360,394]],["danviet.vn",361],["docnhanh.vn",362],["kienthucykhoa.edu.vn",364],["eva.vn",365],["fshare.vn",366],["game24h.vn",367],["game8.vn",368],["gameio.vn",369],["gamek.vn",370],["soha.vn",370],["gametv.vn",371],["genk.vn",373],["giaoducthoidai.vn",374],["vnews.gov.vn",375],["plus.gtv.vn",376],["hoc24.vn",378],["hosocongty.vn",379],["kenh14.vn",380],["kinhtedothi.vn",381],["minhngoc.net.vn",381],["vn-z.vn",381],["lazi.vn",382],["luatvietnam.vn",383],["lucloi.vn",384],["muare.vn",385],["myeva.vn",386],["phunumoi.net.vn",388],["nhipcaudautu.vn",388],["nhacdj.vn",389],["nhatrangclub.vn",390],["olug.vn",391],["phapluatplus.vn",392],["qdnd.vn",393],["reatimes.vn",395],["rung.vn",396],["sharecode.vn",398],["softonic.vn",399],["startalk.vn",400],["stockbiz.vn",401],["thethao247.vn",403],["thethaovanhoa.vn",404],["tinnhanhchungkhoan.vn",407],["tiin.vn",408],["timdaily.vn",409],["tinhte.vn",410],["tintucvietnam.vn",411],["truyenfull.vn",412],["tuyengiao.vn",414],["tvphapluat.vn",415],["v4u.vn",416],["vietfones.vn",417],["vietnamgsm.vn",418],["vietq.vn",421],["viettelstore.vn",422],["voz.vn",423],["vtc.vn",424],["vungoctuan.vn",425],["webthethao.vn",426],["yellowpages.vn",428],["plvb.xyz",433],["truyen18.xyz",435]]);

const entitiesMap = new Map(undefined);

const exceptionsMap = new Map([["livescore.com",[0]],["msn.com",[0]],["dm.de",[0]],["medium.com",[0]]]);

self.specificImports = self.specificImports || [];
self.specificImports.push({ argsList, hostnamesMap, entitiesMap, exceptionsMap });

/******************************************************************************/

})();

/******************************************************************************/
