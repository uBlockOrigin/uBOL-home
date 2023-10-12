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

// ruleset: irn-0

/******************************************************************************/

// Important!
// Isolate from global scope
(function uBOL_cssSpecificImports() {

/******************************************************************************/

const argsList = [".banner-cafe,\n.center-talgh","div.adv",".col-xs-12.col-md-6.main-sidebar > center,\ncenter:nth-of-type(2)","[href^=\"/advertisements/\"]",".widget_custom_html.widget.container-wrapper.widget_text",".ads-title,\n.stream-item-above-post.stream-item,\n.stream-item-mag.mag-box",".ads-post",".link-paeen",".adcontainer,\n.enhanced-text-widget.widget_text.vc-widget.widget.w-nt.h-ni,\n.insert-post-ads,\n.widget_better_rss_widget.widget.primary-sidebar-widget.w-t.h-ni,\n.xjehomzgnw",".ads-text-sid,\n.pt-3.text-center.py-2.bg-all-box,\n.text-center.py-3.bg-all-box","#text-25",".main-zxc","#footer_js_d1,\n.banner-container","#left2","#ads",".yn-bnr","#pos-article-display-66259",".ag-agah",".ads_place,\n.app_introduce","#toshare-dl-link",".announce,\n.dsp-ad,\n.promote-puls",".side-ads",".baner",".header-ad",".top-ad",".mks_ads_widget",".webgardi",".bottom-ad","a[href*=\"nobitex.ir\"]","#kaprila_linktable",".box[class^=\"asan\"],\n.content-box,\n.text-asan",".right-sidebar > p > a > img[title=\"رپورتاژ\"]",".advRemove,\n.click1000_allcontent,\n.webgardi_main > #txtadv5 > a[href*=\"asriran.com/fa/ads/redirect/\"]","figure.size-full.wp-block-image",".alert-dismissible,\ndiv.text-center.col-md-3 > .paddingAll10.panel-success.panel","#middlead",".medicaldirectory-sidebar:nth-of-type(5) > .claims.sidebar-content > .cbp-l-project-details-title > span",".pix_of_day,\ndiv[style=\"margin-top:4px;overflow:hidden;\"],\ndiv[style=\"margin-top:5px;margin-bottom:3px; overflow:hidden;\"]","#bil_fix_top_pc,\n#headerbar,\n.c-ads-banner,\n.content-slider,\n.countclick,\n.hamsan-container,\n.m-banner-r,\ndiv[class^=\"pcfadv\"]",".ads_link8,\n.blog-home-ads-blog,\n.blog_center_bar > center > a[href*=\"eramblog.com/action/static_ads\"],\n.hamsandiv",".col-md-3 > .panel > .tarh-forosh,\n.col-md-3 > .panel > center,\n.leftads",".parent_txt_adv_container2","figcaption","#custom_html-51",".mtn-ads-content-sticky,\nimg[alt=\"ad banner\"]",".widget_custom_html.widget.primary-sidebar-widget.w-t.h-ni.widget_text",".widget_text.widget.primary-sidebar-widget.w-t.h-i","[href*=\"/banners/click/\"]",".weblink",".bd-adsbar,\n.delta-content-ads,\n.delta-top-content-ads",".digiBannerArea,\n.homeMainBanner,\n.todaysNewsList__sidebar","a[href=\"https://farsisaz.com/\"][target=\"_blank\"][rel=\"noopener\"],\ndiv.ADS_wrapper,\ndiv.shbanner_cover","#home-2-col > .bs-vc-wrapper > .vc_col-sm-3.vc_column_container.bs-vc-column.wpb_column,\n.widget_nav_menu.widget.primary-sidebar-widget.w-t.h-ni","[href^=\"/advertisements/triggered/\"]",".zxc",".custom-ad-one,\n.zxc-m",".adsfix_box",".ads_txtcv,\naside.lefts_sides:nth-of-type(6)","div.popup-ads","div.ads","a[href^=\"https://zaya.io/\"]",".ads","div.medicaldirectory-sidebar:nth-of-type(6) > .claims.sidebar-content > .cbp-l-project-details-title > span",".advs-wrapper",".backlink,\n.shopping_list,\n.talfighat-BS,\n.tiny_linky_boxes,\n[href*=\"/advertisements/triggered/\"]",".adv",".adv-ttl","#ad640a,\n#head728,\n#sidebar300 > .mywidget > .titles,\ndiv.mywidget:nth-of-type(6)","#middle a > img[title*=\"تبلیغات\"],\n#sidebar a:not([href*=\"elmevarzesh.com/\"]) > img[width=\"300\"][height=\"200\"],\n.col-md-8 a:not([href*=\"elmevarzesh.com/\"]) > img[width=\"728\"][height=\"90\"]",".stream-item-widget",".widget-ad-image","a[href^=\"https://eramblog.com/direct_link/?ads=\"][rel=\"nofollow\"][target=\"_blank\"],\ndiv.blog-home-ads-blog,\ndiv[class^=\"ads_link\"]",".centernews_soc,\n.left_pos_mod > .l_box.imgs,\n.newstopads",".text-ads","#ynpos-10831,\n.ezp30-ads,\n.fix-ez",".advertisement",".kpl_linktable",".clearfix.boxed-content-wrapper img[alt=\"Advertising\"],\n.top-banner-ads",".news_slider_sec2,\n.webgardi_adv",".header-adv,\n.others_media,\n.sticky_notify2,\n.zxc-stik",".txt-adv-box",".zxc-visible-fixed",".ads-dashed-banner,\n.cas-pubg.cas,\n.gtm-farsroid-ads,\n.site-middle-banners",".download-link-ads-below",".inline-news-box,\n.talfighat-row,\n.ul-talfigh-con",".results__a","section.player-container div.filimo-logo-filimo","div.ad-cat:not(div.ad-custom-size)","#fix-advertise,\n#image-advertise,\n#top-banners,\n.content-ads",".bottom-ads,\n.card-ads",".tads","#ads-main-home,\n.ads-img","ul#tabligh,\nul#tablighc",".sticky-ad",".sidebar-right","div[class^=\"cr-banner-\"]",".q2am-page-advert","#topAdver,\n.Top2Adssss,\ndiv.CBS.CenterBlock:nth-of-type(2),\ndiv.CBS.CenterBlock:nth-of-type(3),\ndiv.CBS.CenterBlock:nth-of-type(5),\ndiv.CBS.CenterBlock:nth-of-type(6)","#floating-region-zone,\n.ads-div-block",".sin-part","#banners-position-14,\n#slideshow[class=\"rounded\"]",".ads-box","#NR-Ads","script[id^=\"wccp_\"]",".col-xs-36.col-sm-4.col-md-4.col-lg-4,\n.hidden-xs.col-sm-4.col-md-4.col-lg-4",".stream-item-top-wrapper","#block-3,\n#block-4",".widget_custom_html,\naside:nth-of-type(2)","#table10,\n#table10 > tbody > tr > .textBoldColor,\n#table4 > tbody > tr > td > table > tbody > tr > td > center,\n.bgleftmenu > div > div,\ntable#table9.bgtable:nth-of-type(13)","div.white-block:nth-of-type(2)","[href^=\"/nf/sponsor/\"]","[class^=\"zxc\"]",".sticky_notify",".news-bottom-link","#ads_f,\n#banners_120_top_1,\n#block-block-120,\n.track-click",".peyvand,\n[href*=\"/advertisements/\"]",".inline_ads",".ads.box","#box358,\n#top-ad",".zxc_home",".mrauto,\n.position-g5",".mobile-fixed-banner","a[href^=\"/advertisements/triggered/\"]",".ads-placment",".advertisement-in-topic,\n.banner-wrapper,\n.bannercontainer,\n.homepage-content",".msg_ad_explain,\n.msg_ad_pictorial,\n.msg_ad_subject","a[href^=\"https://bit.ly/\"]","#custom_html-4,\n#text-31,\n#text-35,\n.adbar","div.ads_fix_top,\ndiv.text_ads_box","#text-13,\n.adwrap-widget","#ads-container",".alert-new,\n.text-center.mt-3.py-3.bg-all-box",".mdiaad,\nsection.sidebox:nth-of-type(4)",".widget_text.widget",".sponsors","#sponsor_wrapper,\ndiv.banner_v",".srjtbaungo","#ads__bottom_of_the_header",".news-col-2 .related-news",".opanel-ads",".ads-banner","#advertise,\n#promotion",".Dr.D2.Cu.o",".stream-item-above-post","#text-5",".banner_sidebar,\n.box-ads-single,\n.box-custom.box_other,\ndiv.box-tag-single:nth-of-type(2)","div.all_adv_mrg,\ndiv.fixed_box_adv,\ndiv.padding_news_right_adv","div#forum-native-ad,\ndiv.ad-wrapper",".advertorial",".ADS_header_all","#header-ad1,\n#p30konkor-ads-p a[rel=\"follow\"]",".post-ads",".sidebar-ads",".ad_global_header","#ad_global_below_navbar","#ads-120,\n.block-ads,\n.block-ads2,\n.block-ads4","div[class^=\"topadvers\"]",".adv_img,\n.agahi-view",".widget_whmcs_ads_widget.widget,\n.wpb_content_element.sidebar.wpb_widgetised_column",".topbanners",".multi-ads-container","div.tab.sidebar-box:nth-of-type(2) > .sidebar-box-content,\ndiv.tab.sidebar-box:nth-of-type(2) > h3",".ads_box",".aa-container",".download-dialog",".ads.big_post,\n.cat","#block-block-22.ads",".bannermiddle,\n.mybannerimg",".adv-box",".adloc-is-banner,\n.widget_better-ads",".advertising","#middle-ads",".fara-main","a[href=\"https://academy-eris.com/\"],\na[href=\"https://sahamir-ac.com/\"],\na[href=\"https://sarafer.com/\"],\na[href=\"https://veriacco.com/\"]","#header-banner-4,\n#rt-backlinks-pos,\n.mb-3.top-1.sticky-top,\n.w-100.justify-content-center.d-flex","div.adsLoader",".bannersHome","#header-ads",".bannergroup",".ads2",".ush_image_2",".GSAdsLR,\n.OpenTable5",".adv_top",".bannergroupsam-full-width",".cyt-ad-content,\n.homebar a[href=\"https://setare.com/%d8%aa%d8%a8%d9%84%db%8c%d8%ba%d8%a7%d8%aa/\"] > img,\n.pb0.stickyscroll_widget","#block-views-ad-link-block-2,\n#block-views-shabake2-clone-of-ad-link-block,\n.field-name-ads-under-summery,\n.popup-box-wrapper","#g-top,\n.ads2col,\n.flexbanneritem",".qxsbniv",".header_adv",".side_adv",".top_adv",".b_box","#inline_agahi_z0,\n.generalBoxStyle[data-element-name=\"FRONT_M\"],\n.generalBoxStyle[data-element-name=\"SHARE_NEWS\"],\n.mauto_div,\n.mnb_wrapper,\n.noagahi.otherMedia",".banner9,\n.bannerLarge","#PopAlert,\n#RightPan,\n#advBan,\n.AdvertiseD2Ban,\n.DTOPBan,\n.adv_text",".ads-link",".middle-ads",".adss,\n.container_ads","div.mask",".adcbar",".link-ads",".ad-item,\n.ads-footer",".baners,\n.left-ads",".right-ads",".tab-cpc,\n.tab-dpd-post,\ndiv[class^=\"ads\"]",".full-width-tabligh,\n.home-web-surfing,\n.tj-ad-box,\n.tj-ad-wrapper,\ndiv.widget.aside-widget:nth-of-type(5) > .section-title--dotted.section-title > .section-title__h",".rmp-ad-container",".slider-banners.partial,\n.sponsor-link",".ads-box-green,\n.ads-box-red",".light-text.footer-widgets","section#downloadbox > div#indicatorr","div#popupModal,\ndiv.modal-backdrop","div.upbu","div.style-text-adv",".zxc_matni",".zxc_top",".adbox:not(.adbar),\n.left-side-ad-col","div.side22:nth-of-type(1)",".tabligh","div.colRight div[class^=\"adsBox\"],\ndiv.topAds","#text-12,\n#text-24",".top-ads",".ads-block,\n.row.fixed-post.post,\n.sidebar-textads","#BannerHome,\n.BannerA,\n.DetailArea > .AdAreaDetail,\ndiv[id^=\"BehinAva\"]","#sidebar-alt","div[id^=\"tabligh\"]",".no-mobile.out-container:nth-of-type(3)",".adsside,\n.elementor-element-d41b3d1,\n.size-large.attachment-large","div[class*=\"blockByVisit_blockByVisit__container\"],\ndiv[class*=\"company_company__ads--ab\"],\ndiv[class^=\"RequireAuth_mainBox\"]","article[data-post-id] > div.post-content > div.post-body a[href^=\"https://l.vrgl.ir/r?ad=1&l=http\"],\ndiv.feedAdsBox,\ndiv.js-userLogin-popup","div.header-banners",".col-md-offset-6.col-md-3,\n.kanban-col",".khp-site-info p,\n.left.col-md-4",".phoenixad,\na[rel=\"dofollow\"]",".e3lan","#text-2,\n#text-3,\n#text-4,\n#text-6,\n#text-7",".meta-ad",".links_footer",".main22,\n.up_submit > span","x",".adv_l,\n.adv_r_news2",".co-ads","#popular,\n.lolo",".tab_news > a[href*=\"gameup.ir\"]",".app_ads_banner",".ads-side",".asiatech","a[onclick^=\"increase_ad_click_count\"]",".banner",".abox","#featured > .owl-stage-outer","div.all_adv,\ndiv.others_web,\ndiv.zxc,\nsection.reportage","#ad-hoc-2,\n.bdaia-e3-container,\n.widget_text.bdaia-widget.widget",".stream-item","#iddivtoplevelscript,\ndiv[style]:nth-of-type(3)",".ads-margin-bot,\n[href*=\"bourse24.ir/ads/click/\"]",".linkbox",".block-simpleads",".clads-inner","script[id^=\"wpcp_\"]","#ADbox-1,\n.ads-sidebar,\n.ads-sticky",".after-post-ads",".Js_Div5",".adsboxfix","div[id^=\"ads\"]","#mediaad-vFkp","#header-bar,\n.sidebar-digiads","div[itemtype=\"https://schema.org/WPAdBlock\"]",".index-adstop > a:not([href*=\"dlrozaneh.ir\"])",".top-full-ads,\naside img[alt=\"جایگاه تبلیغات\"]",".d1yekta,\n[id^=\"pos-article-display-\"]","#faradars",".ads-fix-post,\n.ads-matni",".advertise-place,\n.province-advertise",".all_ads","#ContentPlaceHolder1_divBanner","[class*=\"text_ads\"]",".emojo-ad,\n.pzbkcvuqrn","div.avdDiv",".news-web",".list,\n.t-adv,\ndiv.post:nth-of-type(2)",".header-mdh,\n.pull-right.zm-post-lay-a-area",".ad-mobile-none,\n.ads-native","a[href^=\"https://arongroups.site/\"],\ndiv#ADbox-1,\ndiv#phon",".custom,\n.customads",".FixedAdvertising,\n.left.sidebar_widget:nth-of-type(3),\n.left_ads,\n.right_ads,\n.top_ads","a[href=\"https://maktabsharif.ir/\"]",".post-ad-box","#next1-231,\n.asd_top,\n.fl.block_right > div.box_sh.ads_2","div[class*=\"linkads\"]",".sidebar_tabliq,\n[href^=\"/ads/\"]",".doctor-ads-item","#header_ad,\n.sb_ad",".banner468,\n.tab_box","[href^=\"/redirect/ads/\"]","div[data-testid=\"more-Button-TestId\"],\ndiv[data-testid^=\"filterItem_tab\"]","a[href^=\"https://www.iranjib.ir/ra.php?adid=\"]:not([title=\"اینستاگرام ایران جیب\"]),\ndiv[id^=\"pos-article-display-\"][style=\"min-height:400px\"]","section.box.ads",".advertise_default",".c-forceToLogin__message.o-box,\n.c-forceToLogin__overlay",".im-header-ad",".textads",".go-left.main > div.row.box:nth-of-type(1),\n.middle.inner-el.container > div.row.box:nth-of-type(2),\ndiv.black.row.box","#textads-contents,\n.ads-containter","#ads-container > .list-thumbs.title-only.list.box,\n#header-ad,\n.bg-gray-links.box",".ads_bt_box,\n.ads_singles_post,\n.top_img_ads",".type-sticky.status-publish",".ads-widget",".down-box-ads,\n.down-box1",".singleads","[id^=\"ad\"]","a[href=\"http://www.asalchat.skin\"],\na[href=\"https://www.tarhpardaz.ir\"]","#bottombanner,\n.apnl,\n.b","#sezfvg-2,\n.sezfvg",".txt-ads-sl",".eb-inst","div.e3lan,\ndiv.widget#text-15","a[href^=\"https://arongroups.co/\"],\ndiv.is_ads",".adspanel",".adsblockpop,\n.afc_popup,\n.banners,\n.textAds","div#footer-wrapper > div.copyright-wrapper > div#copyright > *:not(p),\ndiv.basic-list-links,\ndiv.sidebar-tabliq,\ndiv.tabliq-468,\ndiv.text-tab",".body_wrapper > div:nth-of-type(4)","div.block-simpleads","#custom_html-108,\n.stream-item-top","a[href*=\"&m_name=ads\"]",".dlbtnhidden",".ad--content","div.ssad",".ytn-hamsan",".c-advertisement",".banner-box",".center.body_c > div > div,\n.center.body_c > div:nth-of-type(2),\n.txtad","#ad7_40,\n.footer-ads","[href*=\"/fa/ads/\"]",".left_banner,\n.links","#arasideadvertising","a[class^=\"skinak-text-ads\"],\narticle.morders,\ndiv.dadsd",".heading-ads,\n.sidebar-right > div.box:nth-of-type(1)",".adv_mobile",".textwidget,\naside:nth-of-type(5)","a[class^=\"text-ads-\"],\ndiv.backoritybase","#cycle_adv_tabnak","section#LeftPanel > div.leftads","[class^=\"adv\"]:not(.adv8, .adv19)",".inner-wrapper-sticky > .mb-3,\n.sidebar-banners",".type-resource-image",".advertisment","#fpc-banner-top,\n#top-right-ad",".full2.box.right,\ndiv.sideheader2:nth-of-type(3)",".ad-link",".footer-back-link,\n.free_ad_con,\n.logo_full_view","a[href*=\"utm_source=uptrack\"]","#tabligh",".ads120,\n.ads468,\n.fixpost,\n.gsh,\n.headads",".bottom_ads,\n.fix_ads",".textad,\n[href^=\"/ad/\"]","#kaprila_linktable_left,\n.left-block-top","#slider-box,\n.mortabet-links,\ndiv.row:nth-of-type(2) > .col-xs-12 > .category-side-ads",".advertisements",".home-ads",".sideads",".main-top-ads,\n.wide-ad-row,\ndiv.a1-banner","div.Product-BannerHeader,\ndiv.price-sticky,\ndiv[class^=\"AdvertisingParser\"]",".flex-ad-body","#ads-sticky","#ads-text",".box-title,\n.moreads.widget_text,\n.pm",".mom_custom_text.widget,\n.widget_custom_html.widget.widget_text","div.ads-row-left","#ad14,\n.ad-cell,\n.widget_text",".sidebar-area .image","a[data-wpel-link=\"external\"][href*=\"arongroups\"],\ndiv.adbox,\nsection.sidebar-box-shop",".my-single-t-p",".dailylink,\nbody > div > font,\ncenter > center > center > center,\ncenter:nth-of-type(2) > center,\ndiv > font > font > .menuheader,\ndiv > font > font > font > p",".adv-cnt,\n.home-zxc,\n.padding-bottom-8,\n.sanjagh,\n.side_txt_zxc,\n.zxc-header-zxc,\n.zxc-padding-custom","#box_1398,\n#popbox-blackout",".AdsContainer",".special_links,\n.text_adds_container",".zxc_news",".featured_news",".zxc_left",".ads-full-banner-img",".vebgardi",".jmb_banner",".inline-4d",".adrightPanel,\n.container55,\narticle > .box > a[href*=\"salampnu.com\"]",".vfozk",".aligncenter.wp-image-9273.size-full,\n.size-full.attachment-full",".Topadver",".behtarinseo",".myside.right-sidebar",".advertise,\n.bottom-left-ad,\n.bottom-right-ad",".adsBanner,\n.two-ad-banners,\n.widget_media_image.widget.container-wrapper","div.zoomtech-banner","div.back_links","#titr-box,\n.maincontent > center,\ntbody","#sidebar_ad,\n.b-hd,\n.hidden-xs.hidden-sm.block,\n.hideOnMobile",".new-banner","div.app_ads_banner",".abvertise > .container > a:not(a[href=\"https://t.me/filmha_top\"])",".tabliq"];

const hostnamesMap = new Map([["cannews.aero",0],["delta3da.cam",1],["myhastidl.cam",2],["mojnews.co",3],["eghtesadnews.com",[3,54,63]],["fartaknews.com",[3,84]],["moroornews.com",[3,54,80]],["parsnews.com",[3,157]],["ilna.ir",[3,54]],["tinn.ir",[3,345]],["borna.news",[3,26,189]],["tourismonline.co",[4,5]],["koolakmag.ir",4],["1abzar.com",[6,7]],["gadgetnews.net",[6,369]],["1pezeshk.com",8],["abipic.com",9],["mihandownload.com",[9,131]],["accpress.com",10],["afkarnews.com",11],["aftabir.com",12],["akharinnews.com",[13,14]],["harmonydl.us",[14,400]],["alamto.com",[15,16]],["power-music.ir",[15,328]],["androidgozar.com",17],["androidha.com",18],["androidsharp.com",19],["aparat.com",[20,21]],["mihanvideo.com",21],["applicationha.com",22],["arga-mag.com",[23,24,25,26,27]],["icivil.ir",23],["plus.ir",24],["beautyhome.ir",[25,252]],["arzcenter.com",28],["asandl.com",[29,30]],["alldriver.ir",[29,242]],["cafejozve.ir",29],["dehlinks.ir",[29,265]],["khoshamoz.ir",29],["p30day.ir",[29,61,319]],["20file.org",[29,385]],["asemooni.com",31],["asriran.com",32],["avapedia.com",33],["barsadic.com",34],["bazimag.com",35],["brain.be-teb.com",36],["benawa.com",37],["beytoote.com",38],["blogsazan.com",39],["boyernews.com",40],["bultannews.com",41],["charbzaban.com",42],["chetor.com",43],["chibepoosham.com",44],["delbaraneh.com",[45,46]],["rouzegar.com",[46,169]],["delgarm.com",[47,48]],["payamekhabar.ir",48],["deltapayam.com",49],["digiato.com",50],["dlfox.com",51],["doctorwp.com",52],["donya-e-eqtesad.com",[53,54,55]],["ecoiran.com",[53,54]],["eghtesadonline.com",[54,64]],["etemadonline.com",54],["fardanews.com",[54,79,80,81]],["khabarerooz.com",[54,113]],["khabarfoori.com",[54,115]],["khanefootball.com",[54,119,120]],["mojnews.com",[54,80]],["mosalasonline.com",[54,81,112,138]],["sharghdaily.com",[54,119,188]],["shayanews.com",[54,189,190]],["shomavaeghtesad.com",[54,65]],["varandaz.com",[54,81,214,215]],["rokna.net",[54,374]],["55online.news",[54,119,214,378,379]],["sobhtazeh.news",[54,382]],["doostihaa.com",[56,57]],["mer30download.com",[56,61]],["downloadha.com",[58,59]],["uploadboy.com",[59,211]],["drdmag.com",60],["e-teb.com",61],["elmefarda.com",[61,67]],["mehrnews.com",[61,130]],["salameno.com",61],["shabakeh-mag.com",[61,185]],["tasnimnews.com",[61,201]],["vipofilm.com",[61,218]],["4tools.ir",61],["imna.ir",[61,130,294]],["khabaronline.ir",[61,294,304]],["shahraranews.ir",[61,333]],["shmi.ir",[61,334]],["androidina.net",[61,364,365]],["tebyan.net",61],["ravan.e-teb.com",62],["ejiga.com",[65,66]],["fa-tools.ir",[65,280]],["elmevarzesh.com",68],["ensafnews.com",[69,70]],["netpaak.com",[69,143,144]],["bikarsho.ir",[69,253]],["wikihoax.org",[69,70,392]],["mag.khanoumi.com",70],["eramblog.com",71],["etelanews.com",[72,73]],["gahar.ir",[73,287]],["mihand.ir",73],["ezp30.com",74],["faaltarin.com",75],["faceit.ir",[75,281]],["farachart.com",[76,77]],["androidzoom.ir",[76,234]],["fararu.com",78],["farsroid.com",[82,83]],["p30afzar.com",[83,149]],["fastdic.com",85],["filimo.com",86],["footofan.com",87],["gamefa.com",88],["gharbtv.com",89],["ghatreh.com",90],["gooyait.com",91],["graphiran.com",92],["hamgardy.com",93],["harfetaze.com",94],["imvbox.com",95],["irancircle.com",96],["irannaz.com",97],["iranstar.com",98],["itarfand.com",99],["itbazar.com",100],["itgheymat.com",101],["itresan.com",102],["jafekri.com",103],["jahannews.com",104],["jalebamooz.com",[105,106]],["vgdl.ir",[105,143,354]],["jesarat.com",107],["k2cod.com",108],["ketabesabz.com",109],["khabarban.com",110],["khabareazad.com",[111,112]],["khabarfarsi.com",114],["khabarpu.com",116],["khabarvarzeshi.com",[117,118]],["salamatnews.com",117],["hamshahrionline.ir",117],["irna.ir",117],["gostaresh.news",[119,378,380]],["khodrobank.com",121],["khodrotak.com",122],["kilipo.com",123],["kojaro.com",124],["lamtakam.com",125],["learnparsi.com",126],["lenzak.com",127],["magbazi.com",128],["majalesalamat.com",129],["mihanfal.com",132],["mihangame.com",133],["mihanmarket.com",134],["news.mihanmarket.com",135],["minevisam.com",136],["moderndl.com",137],["movienama.com",139],["mybia4music.com",140],["namayesh.com",141],["namnak.com",142],["20tayi.ir",[144,234,235]],["niksalehi.com",145],["niniban.com",146],["ninisite.com",147],["nodud.com",148],["p30konkor.com",150],["p30world.com",[151,152]],["zendegionline.ir",[152,359]],["forum.p30world.com",[153,154]],["parsipet.ir",[153,321]],["parsfootball.com",155],["parsnaz.com",156],["parstools.com",[158,159]],["taktemp.com",[159,200]],["peivast.com",160],["persiangfx.com",161],["persianv.com",162],["radiojavan-iran.com",[162,165]],["picofile.com",163],["podbean.com",164],["rajanews.com",166],["rayamag.com",167],["roozno.com",168],["rozblog.com",[170,171]],["sid.ir",[170,335]],["rozmusic.com",172],["sabtta.com",173],["saednews.com",174],["safarmarket.com",175],["sakhtafzar.com",176],["sakhtafzarmag.com",[177,178]],["seemorgh.com",[178,183]],["sargarme.com",179],["sariasan.com",180],["sarzamindownload.com",181],["sedayiran.com",182],["setare.com",184],["shahrsakhtafzar.com",186],["shanbemag.com",187],["shereno.com",191],["shomanews.com",192],["simcart.com",193],["softgozar.com",194],["sourceiran.com",[195,196]],["dolatebahar.ir",195],["tak3da.com",197],["takhfifan.com",198],["takhfife.com",199],["techfars.com",[202,203]],["varzesh3.com",[203,216]],["techrato.com",204],["tejaratnews.com",205],["telewebion.com",206],["tiwall.com",207],["top2download.com",208],["topnaz.com",209],["trainbit.com",210],["upmusics.com",212],["vananews.com",213],["vazeh.com",217],["webgozar.com",219],["wikisemnan.com",220],["yasdl.com",[221,222]],["downloadsoftware.ir",[221,272]],["zibamoon.com",223],["icoff.ee",224],["konkur.in",225],["shirazsong.in",226],["konkur.info",227],["rasm.io",228],["virgool.io",229],["zaya.io",230],["1000site.ir",231],["1da.ir",232],["1ea.ir",233],["7ganj.ir",236],["8pic.ir",[237,238]],["imgurl.ir",[237,293]],["uupload.ir",[237,352]],["abadis.ir",239],["aftabnews.ir",240],["aftabyazdonline.ir",241],["anaj.ir",243],["androidparsi.ir",244],["anzalweb.ir",245],["apktops.ir",246],["appreview.ir",247],["b2n.ir",[248,249]],["timecity.ir",[248,344]],["barato.ir",250],["bartarinha.ir",251],["softsaaz.ir",253],["youc.ir",253],["bils.ir",254],["bourse24.ir",255],["buzdid.ir",256],["citna.ir",257],["click.ir",258],["coffeeapps.ir",[259,260]],["sclinic.ir",259],["computeruser.ir",261],["dabi.ir",262],["dailymobile.ir",263],["daneshchi.ir",264],["digiboy.ir",266],["digiro.ir",267],["dlrozaneh.ir",268],["download.ir",269],["download1music.ir",270],["downloadly.ir",271],["econews.ir",273],["eghtesadepooya.ir",274],["rastannews.ir",274],["emalls.ir",275],["emeil.ir",276],["emojo.ir",277],["enama.ir",278],["entekhab.ir",279],["farsnews.ir",282],["fastmobile.ir",283],["freedownload.ir",284],["freescript.ir",285],["ftdigital.ir",286],["gamesib.ir",288],["getandroid.ir",289],["gsm.ir",290],["hidoctor.ir",291],["imemar.icivil.ir",292],["my.irancell.ir",295],["iranjib.ir",296],["isna.ir",297],["itna.ir",298],["jobinja.ir",299],["kafebook.ir",300],["kalakamuz.ir",[301,302]],["varoone.ir",[301,353]],["ariapix.net",301],["tarfandha.org",[301,389]],["my-film.pw",[301,395]],["khaandaniha.ir",303],["khodropluss.ir",305],["languagedownload.ir",306],["lastsecond.ir",307],["listen2music.ir",308],["loudmusic.ir",309],["mashreghnews.ir",310],["maxstars.ir",311],["mobile.ir",312],["modirnameh.ir",313],["montiego.ir",314],["moviemag.ir",315],["musicdays.ir",316],["najiremix.ir",317],["omidnamehnews.ir",318],["p30download.ir",320],["payju.ir",322],["pedal.ir",323],["pgnews.ir",324],["phonroid.ir",325],["plaza.ir",326],["pluginyab.ir",327],["rahnamato.ir",329],["rond.ir",330],["rozup.ir",331],["sena.ir",332],["skinak.ir",336],["smusic.ir",337],["snn.ir",338],["sornamusic.ir",339],["subf2m.ir",340],["tabnak.ir",341],["taknaz.ir",342],["tehranrasaneh.ir",343],["iranart.news",345],["topseda.ir",346],["toranji.ir",347],["up44.ir",348],["uploadkon.ir",349],["uplod.ir",350],["uptrack.ir",351],["vista.ir",355],["webgoo.ir",356],["webii.ir",357],["yun.ir",358],["zohur12.ir",360],["zoomg.ir",361],["zoomit.ir",362],["filmino.me",363],["salamdl.rip",[365,396]],["cooldl.net",366],["dlbook.net",367],["footballi.net",368],["jeyran.net",370],["par30games.net",371],["parsroid.net",372],["pichak.net",373],["takblog.net",375],["yektablog.net",375],["article.tebyan.net",376],["uplooder.net",377],["mobo.news",381],["techna.news",383],["titr.online",384],["bazdeh.org",386],["gold-team.org",387],["talab.org",388],["texahang.org",390],["tgju.org",391],["zoomtech.org",393],["ana.press",394],["oila.tj",397],["artmusics.top",398],["filmha.top",399]]);

const entitiesMap = new Map(undefined);

const exceptionsMap = new Map(undefined);

self.specificImports = self.specificImports || [];
self.specificImports.push({ argsList, hostnamesMap, entitiesMap, exceptionsMap });

/******************************************************************************/

})();

/******************************************************************************/
