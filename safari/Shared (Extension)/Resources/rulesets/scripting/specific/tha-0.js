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

// ruleset: tha-0

/******************************************************************************/

// Important!
// Isolate from global scope
(function uBOL_cssSpecificImports() {

/******************************************************************************/

const argsList = ["#adotai-survey-frame-container,\n#adspc_tags,\n#taboola",".icon-bar-mb,\n.view-side-banner","#banner-left,\n.bireklam,\n.filmborder > .filmcontent div[style^=\"text-align\"],\n.filmcontent > div:nth-of-type(10),\n.widget_text.sidebarborder,\ndiv.bireklam:nth-of-type(1),\ndiv.bireklam:nth-of-type(10),\ndiv.bireklam:nth-of-type(11),\ndiv.bireklam:nth-of-type(12),\ndiv.bireklam:nth-of-type(2),\ndiv.bireklam:nth-of-type(21),\ndiv.bireklam:nth-of-type(22),\ndiv.bireklam:nth-of-type(3),\ndiv.bireklam:nth-of-type(4),\ndiv.bireklam:nth-of-type(5),\ndiv.bireklam:nth-of-type(6),\ndiv.bireklam:nth-of-type(7),\ndiv.bireklam:nth-of-type(9),\ndiv.filmborder:nth-of-type(13),\ndiv.filmborder:nth-of-type(14),\ndiv.filmborder:nth-of-type(15),\ndiv.filmborder:nth-of-type(16),\ndiv.filmborder:nth-of-type(17),\ndiv.filmborder:nth-of-type(18),\ndiv.filmborder:nth-of-type(19),\ndiv.filmborder:nth-of-type(20),\ndiv.filmborder:nth-of-type(23) > .filmcontent > div:nth-of-type(5),\ndiv.filmborder:nth-of-type(23) > .filmcontent > div:nth-of-type(6),\ndiv.filmborder:nth-of-type(23) > .filmcontent > div:nth-of-type(7),\ndiv.filmborder:nth-of-type(8),\ndiv.sidebarborder.widget_text:nth-of-type(10),\ndiv.sidebarborder.widget_text:nth-of-type(11),\ndiv.sidebarborder.widget_text:nth-of-type(12),\ndiv.sidebarborder.widget_text:nth-of-type(16),\ndiv.sidebarborder.widget_text:nth-of-type(3),\ndiv.sidebarborder.widget_text:nth-of-type(4),\ndiv.sidebarborder.widget_text:nth-of-type(5),\ndiv.sidebarborder.widget_text:nth-of-type(6),\ndiv.sidebarborder.widget_text:nth-of-type(7),\ndiv.sidebarborder.widget_text:nth-of-type(8),\ndiv.sidebarborder.widget_text:nth-of-type(9)","#ads_fox_bottom",".ads.col-lg-9",".sidebarborder:nth-of-type(1),\n.sidebarborder:nth-of-type(2)","#header .ad",".td-logo-wrap-full,\n.wpb_widgetised_column.wpb_content_element .td-a-rec.td-a-rec-id-sidebar",".row > .col-sm-12 > section",".movie-container > .row > .col-lg-12 > .text-center > .text-center > a",".banner-top,\n.textwidget > div:nth-of-type(3),\n.textwidget > div:nth-of-type(4)","div.r300x250","center:nth-of-type(4)","center:nth-of-type(2),\ndiv.container > .row > .center_lnwphp,\ndiv[id=\"slider-b\"]","div.container:nth-of-type(1)","#slider-l,\n#slider-r",".container > .row > .col-md-8,\n.container > .row > a,\n.row > center:nth-of-type(1),\ncenter:nth-of-type(6)","center:nth-of-type(3),\ncenter:nth-of-type(5)",".panel-body > center > a,\n.row > .col-md-8,\n.row > center:nth-of-type(2),\ncenter > center","strong#xaab",".module_home_x",".imgbanner","#bt-ads","#link_h_movie_ad",".row > center",".theiaStickySidebar #ads300_250-widget-4","#ads,\n#clip-banner,\n#mainarea > .ads_forum,\n#mid-banner,\n#sidebar-right,\n#soccer-table > .banner-wp:nth-of-type(3),\n#soccer-table > .banner-wp:nth-of-type(4),\n#soccer-table > .banner-wp:nth-of-type(5),\n#top-banner,\n#webboard > .banner-wp:nth-of-type(2),\n#webboard > .banner-wp:nth-of-type(3),\n#webboard > .banner-wp:nth-of-type(4),\n.L0.banner-wp,\n.L1.banner-wp,\n.L2.banner-wp,\n.L3.banner-wp,\n.L4.banner-wp,\n.L5.banner-wp,\n.L7.banner-wp,\n.L8.banner-wp,\n.T2","div[class^=\"fancybox\"]","#rightbottom_sidebar .region div[id^=\"block-views-jobs\"]","div[id^=\"arevicofancy\"]","#survey-popup","#loginModal,\ndiv[data-dismiss=\"modal\"]",".banner-img-au,\n.content-widget:nth-of-type(2),\n.sidebar-widget:nth-of-type(2) > .textwidget","#bg-main > table:nth-of-type(1) > tbody > tr > td:nth-of-type(3) > table > tbody > tr:nth-of-type(1)",".backgroundPopup,\ndiv[aria-describedby=\"alert_popup_dialog\"]","#divnews,\nbutton[onclick][title=\"close\"]",".theiaStickySidebar div[id^=\"ads300_250\"]","div[id=\"content\"] div[align=\"center\"] > a:first-of-type","#intro,\ndiv[class^=\"banner-X2\"]",".bigza-ads-block","#popDiv,\n#popup","#banner-box,\n#feature-box,\n#promote,\n#promote-box,\n.banner-box,\n.feature-box,\n.pr-box,\n.promote-box",".leftBanner,\n.rightBanner,\ndiv[id^=\"divFLRALeft\"],\ndiv[id^=\"divFLRARight\"],\ndiv[id^=\"wh-widget\"]",".td-more-articles-box","#my-welcome-message,\n.ads-bottom",".elementor-widget-wp-widget-advads_ad_widget","#nav-wrapper > a[target=\"_blank\"]",".adss-des",".container-fluid > .row > .col-md-6,\ndiv[id=\"speed_sponser\"],\ndiv[id=\"sticky-ads\"]","misa-content .iw_header + .row .img-ads",".ai_widget.widget.primary-sidebar-widget.w-t.h-ni,\n.code-block-1.code-block,\n.code-block-2.code-block,\n.naqw-type-custom_code.naqw-container",".container:nth-of-type(3) > .row > .center_lnwphp,\nbody > div.hide","._banner > a[href*=\"ads.jarm.com\"]","#contentMain > br,\n#contentMain > div[align=\"center\"]",".font-content.content:nth-of-type(3),\n.font-content.content:nth-of-type(5) > center:nth-of-type(1),\n.font-content.content:nth-of-type(5) > center:nth-of-type(2),\n.row:nth-of-type(1) > .col-lg-12",".backdrop",".article .row div .fb-like",".bigbanner,\n.targetbanner-hilight,\n.top-billboard-1200,\n.wrapper > div:nth-of-type(7),\nbody > div:nth-of-type(2),\ndiv[style*=\"text-align:center\"] div[style*=\"z-index:\"]","#spu-1170,\n.stb-container",".dgd_stb_box.clean_white","#spc","#player_banner","div[id^=\"cbox\"]","#showLikePopup,\n#topAd,\n.detail_content .ui_adblock,\n.foot_fb_like,\n.like_yellow,\ndiv[itemprop=\"articleBody\"] a[class^=\"ui_btn\"][href*=\"line.me\"]",".fancybox-overlay,\n.fancybox-wrap","#ui_popup_window_tpl,\ndiv[id^=\"win_showLike\"]","#popup_countdown,\ndiv[id^=\"itro_\"]",".adsense-leadin,\n.ezAdsense","div#p9fe",".ads-above-single,\n.ads-above-single-player,\n[class*=\"ds-popup\"]","div[style*=\"position: fixed; bottom: 0px;\"]",".ad-float,\n.widgettitle-banner + a[href]","#VideoPlayer > div,\n#VideoPlayer > div > div > div,\n#video_overlay,\n.new-banner_side-banner_r,\n.signup_button,\n[href^=\"https://line.me/\"],\n[style^=\"position:absolute; right:10px; top:10px; width: 40px; height: 40px;\"]","#banner_t_player,\n#text-10,\n#text-5,\n#text-6,\n#text-8,\n#text-9","#close_ads","#MT_HP_C_Billboard,\n#MT_HP_Topbanner,\n#coverpage,\n#ga-between,\n.ads-rec-center,\n.billboard-banner,\ndiv[id^=\"dfp-\"]","#masthead #dfp-topbanner,\n.sticky-container .banner-wrap",".col-md-8,\n.panel-default.panel:nth-of-type(2),\n.panel-default.panel:nth-of-type(3),\ncenter > div.img-thumbnail","#main > div[style^=\"text-align\"],\n#sidebar .widget.widget_text","#main article p[align=\"center\"],\n#sidebar aside[id^=\"text\"]:not(#text-2)",".popup.adt,\ndiv.adcen:nth-of-type(6)","#M192293ScriptRootC68553,\n#M192293ScriptRootC68556,\n#head-content > div:nth-of-type(2),\n#text-11,\n.clearfix.post-outer > div:nth-of-type(6)",".outer > div[style^=\"width:814px;\"]","#overlay_ads,\n.cover_banner_bg","iframe[src^=\"https://openx.notebookspec.com\"]","#__ads,\n.viddeo > .img_player,\n.viddeo > .ns-video-player","#nungg-1447152404 > .section-images,\n.section-images","[href^=\"https://www.ad-pic.com/\"]","#upprev_box",".filmborder:nth-of-type(1)",".ads-tabloid,\n.m-block a[href*=\"ads.pantip.com\"],\n.post-pick-ad,\ndiv[class^=\"ads-\"],\ndiv[id^=\"ads-\"],\niframe[src*=\"ads.pantip.com\"],\niframe[src=\"https://pantip.com/home/get_activity_main\"],\nimg[src*=\"tapad.com\"]",".smartbanner,\n.social-banner","#arvlbdata","#myModal",".modal-backdrop.fade.in","#bg-left,\n#bg-right,\n#bgyoutube,\n.alert.cookiealert,\n.cover_preload,\n.preloader,\n.promote,\ndiv[class^=\"promote_\"]","#content div .banner-mobile-size,\n.banner-990x90","#rsticky,\n.mainbox > div > .adsbygoogle,\n.xadsense_middle","#AutoNumber2,\na[href*=\"pramool.com/ads\"],\niframe[src*=\"ads.pramool.com\"],\ntable[cellspacing=\"0\"][border=\"1\"]","[id=\"AutoNumber1\"]:not(:nth-of-type(2))","div[class^=\"CookieSession\"]",".container:nth-of-type(2),\n.panel-body > center","#overlay,\n#yengo-inline-ads,\n.yengo-x","div[class^=\"SC_TBlock\"],\ndiv[id^=\"lightbox\"],\niframe[src=\"/ads/foot-yengo.php\"]","#adv_header,\n#banner300_600,\n.mid_ads","#summary .social,\n.popup",".adsBottoms,\n.content_main div[style=\"width:728px;height:90px;\"],\n.content_right,\n.headline_head,\n.post_desc div[style=\"width:700px;height:66px;\"],\n.sherer,\n.text-center.txt-color-white.font-md,\n[class^=\"adv\"],\n[rel^=\"nofollow\"]",".banana_box iframe[src^=\"https://notebookspec.com/specialprice\"],\n.cover_banner,\ndiv[id^=\"div-gpt-ad\"]","#getFixed,\n#getFixedx,\n.gosad","#cboxWrapper,\ndiv[id^=\"ads_div_\"]","#cboxOverlay","#check-also-box,\n.e3lan-below_header,\n.theiaStickySidebar > div[id^=\"text\"]:nth-of-type(1), .theiaStickySidebar > div[id^=\"text\"]:nth-of-type(2),\n.wrapper-outer .background-cover","#adsMiniUnder,\n#col_right .ads,\n#skin-left,\n#skin-right,\n.ads-feature","#main_content_section > table:nth-of-type(1),\n#main_content_section > table:nth-of-type(2),\nbody > center:nth-of-type(2)",".SC_TBlock",".hidden-mobile","#divAdLeft,\n#divAdRight",".container.bn-a2,\n.container.hidden-xs div[class^=\"col-\"][align=\"right\"],\n.visible-lg.visible-xl iframe,\na[href^=\"http://www.thaimobilecenter.com/ad_click\"],\niframe[src^=\"../banner/google_adsense\"],\niframe[src^=\"../includes/inc_banner\"]","#header-friends,\n#home-friends-1",".adv2col,\n.adv3col,\n.banner_728_90",".jinda-content-block,\n.jinda-facebook-like-box,\n.jinda-overlay-background,\n.jinda-wrapper",".container .item > a[href*=\"/index.php?/stats/clickAdd\"],\na[href*=\"index.php?/stats/clickAdd/\"],\ndiv[id^=\"adsbanner\"]",".mod_banner,\n.mod_banner_top",".bn_mb,\n.bn_pc,\n.post-contentarea .rpv .block-preload #block_preload p a[href*=\"gclub-casino.net\"]","a[href*=\"http://45.gs\"],\ncenter center a",".bottomad,\n.jquery-modal.blocker,\n.td-front-end-display-block,\n.topad",".card-cookie","#notification + .row > center,\n#torrent_download .row .small-12:nth-of-type(1)","[data-wpel-link^=\"external\"]","#top-banner-section,\n.ad-box-widget,\n[alt=\"Advertisement\"]",".downapp_area","#bar_left,\n#bar_left > div:nth-of-type(2),\n#bar_right,\n#content-left > .banner:nth-of-type(10),\n#content-left > .banner:nth-of-type(3),\n#content-left > .banner:nth-of-type(6),\n#content-left > .banner:nth-of-type(7),\n#content-left > .banner:nth-of-type(8),\n#content-left > .banner:nth-of-type(9),\n#content-right > .banner:nth-of-type(10),\n#content-right > .banner:nth-of-type(3),\n#content-right > .banner:nth-of-type(5),\n#content-right > .banner:nth-of-type(6),\n#content-right > .banner:nth-of-type(7),\n#content-right > .banner:nth-of-type(8),\n#content-right > .banner:nth-of-type(9),\n#imghead,\n.banner:nth-of-type(1),\n.banner:nth-of-type(11),\n.banner:nth-of-type(12),\n.banner:nth-of-type(13),\n.banner:nth-of-type(14),\n.banner:nth-of-type(15),\n.banner:nth-of-type(16),\n.banner:nth-of-type(18),\n.banner:nth-of-type(19),\n.banner:nth-of-type(2),\n.banner:nth-of-type(20),\n.banner:nth-of-type(21),\n.banner:nth-of-type(23),\n.banner:nth-of-type(24),\n.banner:nth-of-type(26),\n.banner:nth-of-type(27),\n.banner:nth-of-type(29),\n.banner:nth-of-type(30),\n.banner:nth-of-type(4)",".adv","#slidel,\n#slider","#adsplayer,\n#page > center,\n.happy-player-beside.col-md-3.col-12,\n.happy-player-under.d-md-block.d-none,\n.happy-section",".insad_close","#contentx > .adcen,\n.adimg,\n.insad_l_close,\n.insad_r_close,\n[href=\"https://hotgraph88.com\"],\n[href=\"https://kingdom66.com\"],\n[href=\"https://ufazeed.com/\"],\nbody > .adcen",".column.colophon-message-body > center > a.adv > .adimg,\ncenter.adcen:nth-of-type(9)","#main-nav + center > br",".ad_foot.ad,\n.ad_single_content.ad",".ad_single_content.ad > p:nth-of-type(1),\n.ad_single_content.ad > p:nth-of-type(2)",".td-post-content .err-subscription","iframe",".essb-popup,\n.essb_bottombar",".articleContent div[class^=\"midAdModule\"],\n.theContainer.foryou","#basic-modal-content,\ndiv[id^=\"simplemodal\"]",".ads-banner,\n.ads-banners,\n.b-ads,\n.img-ads,\n[title^=\"banner\"]","div.miru-blockads,\ndiv.spu-bg,\ndiv.spu-box","#main .loading,\n#slider + center,\n[id*=\"ads\"],\n[id*=\"ads\"] + center","#ads-overlay,\n#ads-preload-popup,\n#close-preload,\n#video_ads_container,\n#welcome,\n.bjqs,\n.os-banner-ads,\n.os-page-wallpaper,\n.os_preload_popup,\ndiv[class^=\"introjs\"],\ndiv[class^=\"os-ads\"],\ndiv[data-widget=\"plista_widget_belowArticle\"],\ndiv[data-widget=\"plista_widget_sidebar\"],\ndiv[id*=\"div-gpt-ad\"],\nsection.bigbanner-ad",".ad-box","#leaderboard_bottom.bottom_banner,\n.os-install-app,\nfigure[class=\"os-floating-ad\"],\nfigure[class^=\"os-ad\"]","div#sitefocus,\ndiv.pcb > div:nth-of-type(3),\ndiv.pcb > div:nth-of-type(5)","#SC_TBlock_289622,\n.adscenter:nth-of-type(10),\n.adscenter:nth-of-type(11),\n.adscenter:nth-of-type(12),\n.adscenter:nth-of-type(13),\n.adscenter:nth-of-type(18),\n.adscenter:nth-of-type(19),\n.adscenter:nth-of-type(20),\n.adscenter:nth-of-type(9),\n.block750,\n.blockcolumn1,\n.blockcolumn3,\n.slidetop","div[id^=\"SC_TBlock\"]",".ads-sidebar-middle,\n.exit-overlay,\n.post-entry .ads,\n.subscribe-form,\n.ui-front.ui-widget-overlay",".container .row .ads,\n.e18fudrz1.css-1wc8xzy,\ndiv[tabindex][style*=\"z-index\"]","#AdAsia,\n#uniads,\n.in.fade.modal-backdrop,\n.modal",".google-ads,\ndiv[id^=\"_bz_boxlike\"]",".wppaszone,\ndiv[data-title=\"Home popup\"]","#ads_top_content,\n#todaytable > div:nth-of-type(3),\n#todaytable > div:nth-of-type(5),\n#todaytable > div:nth-of-type(7),\n.ajax-banner,\n.banner-clear.banner-logo.ajax-banner.topbanner,\n.topbanner",".YouTubeModal","div a[href*=\"compgamer.com/mario-ads/\"]","#banner","#download-vdo,\na[rel*=\"nofollow\"] > img","#floating_banner_top,\n.img-thumbnail:not([src^=\"https://animedd.xyz/\"]),\n[href*=\"casino\"],\n[src=\"https://i.imgur.com/5Q894WW.jpg\"]"];

const hostnamesMap = new Map([["seriesubthai.co",0],["techsauce.co",1],["www.037hdd.com",[2,3]],["hereseries.com",[3,50]],["donung.tv",[3,164]],["www.1000tep.com",4],["www.2youhd.com",5],["4toom.com",6],["akibatan.com",7],["www.alpha-hen.com",8],["anime-h.com",9],["anime-i.com",10],["anime-lunla.com",11],["anime-master.com",[12,13]],["anime-sugoi.com",[12,15,16,17]],["anime-ox.com",14],["xxx5porn.com",[15,139]],["www.anime-sugoi.com",[17,18]],["anime-thclub.com",19],["animekimi.com",20],["animeloli.com",[21,22,23]],["www.animelolo.com",[21,24]],["animedd.xyz",[23,165]],["animeranku.com",25],["baanpolballs.com",26],["becteroradio.com",27],["kodlikes.com",27],["oopsmobile.net",27],["blognone.com",28],["chujai.com",29],["ithaihotnews.com",29],["itnews24hrs.com",29],["juropy.com",29],["kaijeaw.com",[29,54,55]],["laughwoo.com",29],["mthai.com",[29,75]],["petmaya.com",[29,92]],["thaihitz.com",[29,55,114]],["extremepc.in.th",29],["tgpl.in.th",[29,35,162]],["cleothailand.com",30],["clip-th.com",31],["clip33.com",32],["www.club-172hd.com",33],["compgamer.com",[34,35]],["coregamerth.com",36],["dedbit.com",37],["dodeden.com",38],["doodiza.com",[39,40]],["startclip.com",40],["exteen.com",41],["game-tep.com",[42,43]],["specphone.com",[43,84,107]],["gamemonday.com",44],["gamingdose.com",45],["www.gg-anime.com",46],["grimexcrew.com",47],["h-ani.com",48],["hanimesubth.com",49],["hime-anime.com",51],["neko-miku.com",[51,77]],["jarm.com",52],["jokergameth.com",53],["thaijobsgov.com",[55,114,115]],["kanomjeeb.com",56],["kapook.com",57],["kidjarak.com",58],["kiitdoo.com",59],["meekhao.com",59],["www.king-anime.com",60],["www.leoplayer3.com",61],["liceza.com",62],["liekr.com",63],["lonely-rooyang.com",64],["manyum.com",65],["marketingoops.com",66],["meepanda.com",67],["misa-anime.com",68],["movie007hd.com",69],["movie2free.com",70],["movie2uhd.com",71],["movie87hd.com",72],["www.moviehd-master.com",73],["msa-video.com",74],["picpost.mthai.com",76],["www.new-mastermovie.com",78],["newmovie-hd.com",79],["newseries-hd.com",80],["www.nice-anime.com",81],["nongpink.com",82],["notebookspec.com",[83,84]],["www.nung2d.com",85],["nungg.com",86],["octopusbanner.com",87],["ohlor.com",88],["okmovie-hd.com",89],["pantip.com",90],["m.pantip.com",91],["playpark.com",[93,94]],["tnews.co.th",[93,157]],["playulti.com",95],["mustplay.in.th",[95,161]],["popcornfor2.com",96],["postjung.com",97],["pramool.com",98],["bbs.pramool.com",99],["www.punpro.com",100],["www.rock-anime.com",101],["share-si.com",102],["siamok.com",103],["siamphone.com",104],["sistacafe.com",105],["soccersuck.com",106],["www.taradxxx.com",108],["techmoblog.com",[109,110]],["thailandbestbeauty.com",[110,116]],["techtalkthai.com",111],["techxcite.com",112],["www.thaiboyslove.com",113],["thaimobilecenter.com",117],["thaivisa.com",118],["thaiza.com",119],["thetechr.com",120],["thisisgamethailand.com",[121,122]],["tigthai.com",122],["thmovieshd.com",123],["toonzaa.com",124],["toritalk.com",125],["vroom.truevirtualworld.com",126],["tt-torrent.com",127],["utaseries.com",128],["vojkud.com",129],["vojkudee.net",129],["m.webtoons.com",130],["xn--12cf0e9alaj8at1avvw8lrh.com",131],["xn--12cl2bca0a9jsa8a7e1dc3gd.com",132],["xn--12cl7cj4a8c1bl5l7c.com",[133,134]],["nungxthai.net",[133,148]],["xn--72c9abh1f8ad1lzc.com",[135,136]],["xn--72ca2bsl7gxbd4m7c.com",[135,137]],["xn--82c0bxcybxc2b.com",138],["xxxporn7.com",140],["yaklai.com",141],["zaapmak.com",142],["picnic.ly",143],["today.line.me",144],["upic.me",145],["anime-subthai.net",146],["miruanime.net",147],["online-station.net",[149,150]],["thairath.co.th",[150,156]],["m.online-station.net",151],["snipertopanime.net",152],["xxxpostpic.org",153],["sudting.party",154],["rabbit.co.th",155],["autocar.in.th",158],["gamegeek.in.th",159],["goal.in.th",160],["goshujin.tk",163]]);

const entitiesMap = new Map(undefined);

const exceptionsMap = new Map(undefined);

self.specificImports = self.specificImports || [];
self.specificImports.push({ argsList, hostnamesMap, entitiesMap, exceptionsMap });

/******************************************************************************/

})();

/******************************************************************************/
