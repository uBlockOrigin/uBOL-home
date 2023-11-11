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

// ruleset: nld-0

/******************************************************************************/

// Important!
// Isolate from global scope
(function uBOL_cssSpecificImports() {

/******************************************************************************/

const argsList = ["#ad_top_page",".bannerswidget",".qt-sponsors","#adsense-container,\n#banner-top-dt,\n.BannerBottom-root,\n.BannerRight-root,\n.Banners-bannerFeedItem,\n.hz-Banner,\n.right-banner-root-container,\n.vip-banner-top-sticky-container",".advertisement",".dfp-space",".page-header__section--spacer",".sales-cat-context",".leaderboard",".imu",".leaderboardWrap",".hf-top-ad,\n[type=\"doubleclick\"][ad-unit-path][ad-label-text=\"Advertentie\"]",".logo-slider","#section--banner",".gofollow",".ad",".ad + .card-divider",".Billboard-wrapper,\n.Rectangle-wrapper","#advertising",".ad-container","[class^=\"AdSlot_AdContainer\"]","#adholderContainerHeader",".ads",".partners",".sponsorartikelen",".true-logo",".inhype-bb-block-header","#top-advertisement-area",".dish-sponsors","a[href^=\"https://ads.focus-wtv.be/\"]","#katon-slot,\n.bannerContainer",".is-billboard,\n.is-skyscraper","#topbox","#leaderboard","#leaderboard_floor",".container-leaderboard","#sponsors-carousel",".header__bottom,\n.partners-holder,\n[class*=\"-ad-banner-box\"]",".advertising",".theoplayer div > div > div > div[class][style^=\"left\"][style*=\"width\"][style$=\"px;\"]",".footer-top",".pub",".o-news__add","#itdaily-article-sidebar,\n#itdaily-article-top,\n#itdaily-footer,\n#itdaily-home-floor","#adRechts",".banner",".js-partner-content",".widget_links",".block-leaderboard","[class^=\"article__ad\"]","#leaderboard_row","div[class*=\"blocksponsors\"]",".googleadvidx",".cta-container","div[class*=\"AdWrapper\"]",".r-pub",".midzone,\n[id^=\"ads-row\"]","#reclameblok-wrapper",".view-id-banners_top",".text_12_jobs_only","[class*=\"blockpartners\"]",".advertentie",".promSB",".col.pix-sidebar",".inline-partners",".inside-left-sidebar",".widget_sponsors_widget",".banner-size-leaderbord",".leaderBoard",".ad-web.ad-page",".block-ad-banner,\n.lecture-wrapper,\n.view-weather-ads-view",".ad--button","a[href^=\"https://ds1.nl/\"]",".commercial-banner",".c-articleteaser--sponsored,\n.c-sitenavPlaceholder__ad,\n.sticky-article-halfpager,\n[class$=\"sponsored\"]","#aside-banners,\ndiv.banners-container",".partners-immo,\n.sponsor-sn","[id^=\"rossel-leader\"]",".dfp",".partners_immo","div[class$=\"-atf\"]","[class*=\"r89-desktop\"][class*=\"-btf\"],\n[id$=\"takeover\"]",".header-banner",".adds",".sponsors",".pe__container__ads,\n.pui__adinfo,\ndiv.pui__seekbar__cuepoints","#mm_hpa",".c-advertiser-logos","#shopsuiteApplication",".sponsers",".bannerblock",".banner_wrapper",".sponsorbanner",".bannergroup",".content-rechts-ad",".clickout-banner-regular_native_box",".sda",".g","aside[class^=\"widget widget_text\"]",".affiliatelink",".hootslider-image-wrapper","div[id*=\"leaderboard-billboard\"]","[class^=\"adserver-container\"]",".ai-viewport-1",".leaderboardbg,\n.taboonews","a[href^=\"https://casinoscout.nl/\"]",".match-bet,\n.special-offer,\n.top-match",".logo",".ms-hapb,\n.ms-side-items--with-banner,\n.ms-side-widget--custom-links__wrapper",".adv-link",".bottom-bns-block,\n.player-right","a[href^=\"/out/\"]",".adsense","#adsense_CSA","[id^=\"PanelTopAds\"]","#visible_ad_1",".abbcn-footer",".blockvertorial,\n.min-h-90,\n.searchvertorial","div[data-advert-placeholder-size]",".header_banner",".menu-item > [href=\"https://www.onlinecasinos-nederland.nl/\"]",".gsrhera",".above-content,\n.below-content,\n.sidebar-top-content","#nav_menu-2","#taboola-below-article-thumbnails,\n.dfp-leaderboard-container,\n[class$=\"ad-unit\"]",".adbox",".av",".featured-banner",".gmollik","#branding > .clearfix",".c-commerical_banner","[class*=\"adv\"]","#adsense",".desktop_mobile:not(a[href*=\"radionl.fm\"])","div[class=\"widget HTML\"]",".overview-item--success,\n.sidebar_right_bottom,\n.sidebar_right_top,\ndiv[class^=\"bnr-\"]","[data-testid^=\"banner\"]",".component__pubble-banner","[id*=\"banner\"]",".simple-image > [href^=\"https://www.nsinternational.com/traintracker/\"]",".articleBody > aside,\n.topBanner,\naside[style] ~ aside:not([style])",".googleinpage",".ablok",".popup",".promoted,\n.promoted-entry-in-content",".promoblok","#true",".serie_info_adbox","#ads_right_scroll_single_sidebar,\n#div_the_mgid","div.td-all-devices",".bookies.stream-preview,\n.top-bookmaker-widget","#sidebar",".widget_sponsor,\n.widget_sponsorlinks",".page-load-switch","#eCommerce",".reclame",".rc-banner-inner-wrapper",".rc-banner-leaderboard",".adv",".main-promo-bn-responsive",".partners-carousel",".header__partner-link,\n.page-footer__partners-block",".footer__footer-fat,\na[href^=\"https://www.awin1.com/cread.php?\"]",".bn__wrapper,\n.footer__partners-wrapper",".albla-widget,\n[class^=\"albla-top-slider\"]",".ddbad_wrapper",".advrow","#footer",".banners",".bannerrow,\n.partnerrow","#banner-text2,\n#containerx",".widget_alaya_ad",".widget_offers,\n[data-name=\"dynamic-content\"][data-nosnippet],\nheader[data-name=\"featured-header\"]",".footer-widget-1,\n.header-widget-region","#aanbblok,\n#singleab,\n.ph_appelhoes,\n.ph_upgreatest,\n[class^=\"ph_block\"],\na[href^=\"/adverteren-\"]","[href=\"/dl-14-days-trial\"]",".widget_ab_sidebar",".widget_nlpartners","#parentgpt,\n.autowereld_ros_bravo_leaderboard-billboard,\n.bottom-bannuring","[type=\"doubleclick\"][ad-unit-path][ad-label-text=\"Reclame\"]","#liggende-banner,\n.advertentie_links,\n.bigbanner",".advertise","#banner-lister-top,\n#mainbanner",".ad300x1050,\naside > .ad",".shailan_banner_widget",".widebanner",".w-300x.RM5","div[data-component=\"partner\"]",".plusbtn",".promo",".bh-ads","[id^=\"ad-block\"]",".addslot,\n.wrapper--topbanner",".plus500,\n.ut--billboard,\n.ut--rectangle",".Textads",".bieos-widget","#BJA2,\n#BJA3,\n#banTop","div[style=\"height:52px;\"]",".ligatus-sidebar-block",".branded,\ndiv[class*=\"BNRAd_ad_\"]",".bnrrow","#frontpage_mediumrect","a[href^=\"https://www.onderdelenshop24.com/\"]","#banners","[class^=\"Ad_\"]",".ll_partnerexpert",".TS_Banner_Spot",".ontwerp_ads","#b_searchboxInc","div.brievenbus",".owl-carousel","#partners","#ads",".sponsored","article.ci-ad-card,\ndiv[class^=\"intercom-app\"] > iframe[title*=\"banner\"]","div[data-elementor-type=\"popup\"]",".widget_media_image","#TOP_ARTICLE,\nnav + div[style^=\"height:52px\"]",".wpb_wrapper a[href*=\"dartswarehouse.nl\"]",".main-banner",".edgtf-carousel-holder",".vc_box_outline.vc_single_image-wrapper",".vc_carousel-inner > .vc_carousel-slideline > .vc_carousel-slideline-inner,\n.wpb_wrapper > .a-single",".et_pb_ads_agsdcm_0",".plek-boven-artikel",".section-branded","[id^=\"deoud-\"]",".static-map",".c-partners",".ASTAGQ_Billboard",".article-excerpt--ad",".grid_ad_container",".partners-swiper",".adv-link:not(a[href$=\"aanmelden-gratis-nieuwsbrief/\"])",".main__ad",".top__ad",".ldrtop,\n.widget-partners",".dfad,\n.figure-image[data-links=\"\"]:not(a[href*=\"edelmetaal-info.nl\"])",".banner-container",".m-banner-wrapper",".right[style]","[id$=\"-336x280\"]",".bottom-banner","#partner-bar,\n.header__top__partners",".js-mock-banner",".desktop_mpu",".section-partners",".banner-leaderboard",".tm-top-a,\n.tm-top-c",".sidebar__item--banner",".betting_partner,\n[id*=\"web_billboard\"]",".footer-logos,\n.has-toto-banners",".noAdBlockDetected .fd-message","#ad-top-desktop",".banner-carousel,\n.totoOdds",".powered_by_page,\n.powered_by_profile","#adf-rectangle,\n.ad-centering",".c-newsList__story--partnernews,\n.mpu",".adsenvelope,\n.oddsPlacement",".header-ads__custom-ad",".funbox","#wa_web_headertofloor,\n.trueTop,\n[class$=\"billboard-atf\"]",".advert",".banner-placeholder",".container-fluid.site-header",".home-billboard","[class^=\"advertisement\"]",".match-sponsor","div[style=\"min-height: 600px; margin-bottom: 20px;\"]",".telefoon_verberg,\n[id^=\"abri\"],\n[id^=\"fp\"],\na[href^=\"/_global/leesmeer.php?\"]",".article-premium-promotion-block,\n.pgAdWrapper,\n.slajeslag,\na[data-ga-event^=\"link-tip\"]","[id^=\"menu-item-\"] > [href^=\"https://go2.go2cloud.org/aff_ad\"]","[id^=\"gridlove-module-\"]:not(.module-type-posts):not(.module-type-cats)","#below-article-leaderboard,\n[id$=\"leaderboard-article\"],\n[id^=\"below-article-rectangle\"]","[id$=\"ad-desktop\"]",".katernbanners",".onderdelenshop","[id*=\"desktop-leaderboard\"]",".vc_raw_html.td_block_wrap.wpb_wrapper",".t-banner","img[width=\"300\"][height=\"250\"]",".c-sponsors","#advertorial-destination","a[rel*=\"sponsored\"]",".plistaAllOuter","#lijst_logos,\n.logoblok",".promotion_link",".Billboard,\n.LargeRectangle",".ja-banner","div[class$=\"banners-wrapper\"]","div[id^=\"handb-\"]","aside.widget-banner","div[class*=\"-bannerWrapper-\"]",".fixed-ads,\n.footer-blocks,\n.footer-sponsors",".a-widget,\nrssapp-carousel","#tpl_banners",".affiliates",".gamereel_featured-ad",".ad-top-desktop,\n.feed-ad-wrapper",".ContentPartner,\n.billboardwrap,\n.billboardwrapdown,\n.js-banner,\n.publisher-sh-spot,\n.rectanglemid,\n.rectanglewrap,\n.strossle-widget",".LeaderboardContainer,\n.Rectangle","[class*=\"banner\"]:not(.banner)","footer > .container > div:nth-of-type(1)",".widget-tabs--partner","#carousel-indiexl_partners_carousel_widget",".slickcarousel",".adsbymanatee",".vc_cta3-container",".io-tape-card[href^=\"/partner\"],\n.region-banner","div[id^=\"property_ad_\"]",".homepage-marquee",".adverteerdersblok,\n.content_blok_reclame","#dish-top-desktop","a[href=\"../../omroep/adverteren/\"]","[id^=\"section-ad-banner\"]","div[id*=\"gpt-ad\"]","#adBoven,\n#adRechts2",".adguru-ad-banner,\n.adguru-zone,\n.adguru-zone-wrap,\n[href^=\"https://mt67.net/c/\"],\n[id^=\"adguru-zone-widget\"]",".aside__add",".banners-right",".c-site-footer__partners",".SponsorBar","#footer-sponsors-wrapper",".ad-item-container,\n.promobloc-desktop,\n.promoblocs__banner","#bannerdiv",".widget-grid--partnerbox","div[id*=\"adf-billboard\"]",".contentBillboard,\n[class*=\"r89\"][style=\"min-height:250px;\"],\n[class*=\"r89\"][style=\"min-height:90px;\"]",".banner-widget,\n.banners-weekad,\n.in-slider-ad","#header-text-nav-container > .inner-wrap > .clearfix,\n.slides",".widget_execphp",".axd-container.axd-widget","#banner-billboard",".tab4,\nli.linkUnit","#ad-rec-btf,\n.ad_between,\n.ad_inner",".mc-adv","div[class^=\"AdWrapper\"] + div[class^=\"SkeletonWrapper\"]","div[id=\"pristineslider.12\"]","a[href^=\"https://partnerprogramma.bol.com/\"]",".fancy-wrap",".header-widget-region > .col-full",".adsbygoogle",".artikel-banners,\n.background_link","[class^=\"banner\"]","#shopside,\n.cbcontent",".external",".ashe-widget",".page-header__inner__ad",".c-footer-sponsors",".logolinks-wrapper",".article-page__bumper","#footer-banner",".add-background",".gesponsord_blokje",".in-house,\n.mag-box.half-box,\n.nfn-target[data-advadsredirect],\n.sticky-element-placeholder,\ndiv[class^=\"mag-box\"] + #adskeeper",".bannerListWidget,\n.ewic-slider-pro-widget,\n.headbanner",".ster-banner,\n.teletekst__banner","#nbc_skys,\n.amaz_el","#header > .zone,\n.temptation__aside,\na[href*=\"/advertorial-\"],\naside#h1,\ndiv.articlelist[data-section^=\"advertorial\"][data-section$=\"-adverteerder\"],\ndiv[id^=\"block-in-article-ad\"]",".sidebar > .widget a[href]:not(a[href^=\"https://www.oisterwijknieuws.nl\"]),\ndiv[align=\"center\"] a[target=\"_blank\"]","div[class^=\"ad_\"]",".sponsor-carousel",".adcontainer",".slider-wrapper",".promotion-block",".clearfix.entry > small","#top_ad-360,\n[id^=\"AdvertMid\"],\n[id^=\"containersitead\"]","[href^=\"https://www.reisburobartlimburg.nl/\"]",".home-banner","#dropinboxv2cover,\n[src=\"http://www.oops.nl/banner/bannerindex.html\"],\ntable[cellspacing=\"30\"]",".hdrcontainer > .adsbybinq",".oortje-wrapper",".bnr","#onetime-popup",".banner-holder,\nimg[width=\"160\"][height=\"92\"]",".site-background-banner,\n.site-home-banner,\n.site-top-banner",".block-sponsors--psv,\n.block-sponsors-desktop,\n.toto",".hthb-notification","#betting-prefs,\n.branded-countdown__content__partner-wrapper,\n.card[href$=\"-adv\"]","#xbtm > .shadow,\n#xttm > .shadow",".eskimo-carousel-container",".hoofdAd2",".codalt-container,\n.rdnl__adds","[class*=\"folderRowAd\"]",".widget-a-wrap",".bannercontainer",".regio-widget","#advertisement",".carousel","[id^=\"gtm-article-lb\"],\n[id^=\"gtm-article-mpu\"]","img[title^=\"roba_sponosor_\"]",".dfp-rectangle-wrapper","#dfp-billboard-wrapper,\n.rtldart",".article-sidebar__ad,\n.dfp-billboard-wrapper,\ndiv[class$=\"_with_ad__ad\"]","#recommendations-above-ad",".thanksto",".widget_random_banner_widget",".art-positioncontrol",".prom",".list-sponsors",".avia-content-slider1",".partnerlink","#block-leaderboard,\n#block-topbannersidebar","#media_image-3,\n#media_image-4",".widget_minisites",".r89-desktop-takeover",".banner_leaderboard",".rect-in-headlines,\ndiv[id^=\"ad\"]","iframe[data-src^=\"https://ads.\"]",".blogBanners,\n.topBanners",".banner-wrapper,\ndiv[id^=\"banner-\"]",".holder-ads","[id$=\"random_ads\"]","#r89-mobile-rectangle-mid,\n#r89-takeover,\n.bcb-sport-block-data",".sam-slot",".sols",".adchannel",".logo_main_sponsor_image,\n.logo_slider_logos",".banner-btf-side-rectangle,\n.banner-sky,\n.leader-below-game",".game-page-sidebar",".b_i_bg,\n.spel_b1,\n.spel_b2",".widget_spreekbuis_partners",".advertentieblock",".top-banner",".wp-block-buttons","[class$=\"-banners-wrapper\"]","#bannerDerPC,\n.creatividad,\n.megabanner","#lead","#tbresult-top",".ArticleBodyBlocks__bannerWrapper,\n.ArticlePageWrapper__banner,\n.Banner,\n.ComponentRotation,\n.MainCuratedTeasersLayout__banner,\n.OutbrainWrapper,\n.SectionPage__bannerWrapper,\n.Section__topBanner,\n.SportScoreboardPage__banner,\n.TextArticlePage__bannerWrapper,\n.VideoArticlePage__banner,\n.VideoPage__banner,\n.WebpushOptin__main,\n.withBanners,\n.withBanners + .ComponentRotation",".interstitial_banner","#lb_header",".in-house-ad","[class*=\"banner\"]","[href^=\"https://www.totaaltv.nl/plugins/banner/\"]",".SponsorBlock",".desktopad","[id$=\"halfpage\"],\n[id$=\"top-ad\"],\n[id*=\"r89\"][id$=\"home\"],\ndiv.ads-contain",".werbung",".trucks_ros_alpha_rectangle-halfpage,\n.trucks_ros_leaderboard-billboard",".easingslider","div[class^=\"r89-desktop\"]",".banner-fluid","#shortads,\n.adBoxbig",".uitgelichtbox","#partner-links,\n[href^=\"https://xltube.nl/click/\"],\n[id$=\"fish-hooks\"],\ndiv[id^=\"video-fish-hook\"]","div[class^=\"Component-bannerTopWrapper-\"]","div[id][class^=\"css\"]",".betting-provider-row",".header-intro","a[href^=\"https://partner.bol.com/\"]","[id*=\"miw_widget\"] a[target$=\"blank\"][href]:not(a[href*=\"mailto\"])","#sidebar_aanbevelen","#submenubanner",".lshowcase-logos",".card-banner,\n.card-banner-large","[id^=\"adf-autonative\"]","#sponsors",".sticky-banner-container",".float-right",".flexslider",".leaderBoardHolder",".layout__main-ads,\ndiv[class^=\"r89-desktop-rectangle\"]","div[class^=\"styled__AdWrapper-\"],\ndiv[class^=\"styled__FooterAdWrapper-\"]",".hf-widget",".cookieconsent-optin-marketing",".banner-right,\n.infeed-outer,\n.infeed-wrap",".ads-stack,\n.fixed-ad","#ad-takeover",".adr-wrapper","#reclame,\n.advertentieBanner",".default-banner-size",".sponsors-block",".wintersport-banner","[href=\"https://www.loketkansspel.nl/\"]",".mobblue",".bs",".article-bnr-first,\n.as__bottom-banner,\n.g_banner","div[class^=\"display-ad_container\"]",".a-single,\n.g-single","#banner_rectangle,\n#banner_right,\n#banner_top","#banner",".region-sponsors",".td-adspot-title",".ads-mobiel",".wpa","a[href^=\"https://www.onlinebingokaart.nl/\"]","div[style*=\"width:300px; height:200px;\"],\ndiv[style*=\"width:300px; height:250px;\"],\ndiv[style^=\"width:300px; height:180px;\"]","app-money-exchange,\napp-slider-add","#image-vertical-reel-scroll-slideshow,\n.slider-container",".col-left,\n.col-right","#secondary,\nsection[id^=\"smartslider\"]",".wpb_widgetised_column .widget_text"];

const hostnamesMap = new Map([["radiomonique.am",[1,2]],["omroephouten.nl",[1,361]],["pretoriafm.co.za",1],["rbsradio.be",2],["easyfm.nl",2],["2dehands.be",3],["marktplaats.nl",3],["7sur7.be",[4,5,6]],["hln.be",[4,5,6]],["wielerflits.be",[4,86]],["ad.nl",[4,5,6]],["autoweek.nl",[4,181]],["bd.nl",[4,5,6]],["bnnvara.nl",4],["destentor.nl",[4,5,6]],["ed.nl",[4,5,6]],["elektormagazine.nl",4],["ensie.nl",[4,242]],["fonkmagazine.nl",[4,211]],["gelderlander.nl",[4,5]],["hpdetijd.nl",4],["hvzeeland.nl",[4,296]],["kieskeurig.nl",[4,315]],["modekoninginmaxima.nl",[4,341]],["ovpro.nl",[4,177]],["tankpro.nl",[4,177]],["tubantia.nl",[4,5]],["wielerflits.nl",[4,86]],["zijaanzij.nl",4],["goedgevoel.be",5],["bndestem.nl",5],["pzc.nl",5],["agriline.be",7],["autoline.be",7],["machineryline.be",7],["agriline.nl",7],["autoline.nl",7],["machineryline.nl",7],["atletiekkrant.be",[8,9]],["autosportkrant.be",[8,9]],["basketbalkrant.be",[8,9]],["handbalkrant.be",[8,9]],["hockeykrant.be",[8,9]],["peoplesphere.be",8],["sportid.be",[8,9]],["tenniskrant.be",[8,9]],["volleybalkrant.be",[8,9]],["vrouwenvoetbalkrant.be",[8,9]],["wielerkrant.be",[8,9]],["voetbalkrant.com",[8,9]],["sport-planet.eu",[8,9]],["psv.nl",[8,376]],["sneeuwhoogte.nl",8],["atv.be",10],["tvl.be",10],["tvoost.be",10],["autoscout24.be",11],["belgiancycling.be",12],["magazine.belgiancycling.be",13],["belgischecasinos.be",14],["ninefornews.nl",[14,354]],["newspower.nu",14],["bestereistijd.be",[15,16]],["hetnieuwsvandaag.be",[15,41]],["itdaily.be",[15,43]],["sport.be",15],["standaard.be",[15,71]],["tripadvisor.be",15],["gpblog.com",15],["alarmeringen.nl",15],["beleggersbelangen.nl",[15,189]],["besteproduct.nl",[15,191]],["bright.nl",[15,204]],["gezondheidsplein.nl",15],["hyvesgames.nl",[15,297]],["indebuurt.nl",[15,303]],["koopplein.nl",[15,82,323]],["limburger.nl",[15,325]],["tellows.nl",[15,431]],["tradeidee.nl",15],["tripadvisor.nl",15],["voetbalnieuws.nl",15],["voetbalprimeur.nl",[15,204]],["xgn.nl",[15,476]],["letsgodigital.org",15],["persinfo.org",15],["beursduivel.be",17],["eurobench.com",17],["belegger.nl",[17,188]],["beursonline.nl",[17,194]],["debeurs.nl",[17,194]],["bloovi.be",18],["alle-tests.nl",18],["bruzz.be",19],["omroepflevoland.nl",19],["pu.nl",19],["soccernews.nl",[19,413]],["trendalert.nl",19],["sportuitslagen.org",19],["buienradar.be",[20,21]],["buienradar.nl",21],["cinenews.be",22],["webmastersunited.com",22],["androidworld.nl",[22,96]],["handbal.nl",22],["openrotterdam.nl",22],["wegdamnieuws.nl",[22,467]],["clubbrugge.be",23],["feyenoord.nl",[23,254]],["ftm.nl",23],["voetbalindebollenstreek.nl",23],["computable.be",[24,25]],["computable.nl",[25,213]],["dansendeberen.be",26],["doorbraak.be",27],["dagelijksekost.een.be",28],["focus-wtv.be",29],["funnygames.be",[30,31]],["funnygames.nl",[30,31]],["spele.be",31],["spele.nl",31],["gazetvandaag.be",32],["jupilerproleague.eu",32],["f1-gp.nl",32],["formule1-race.nl",32],["gaming-nieuws.nl",32],["giganieuws.nl",32],["hotstreams.nl",32],["krantvandaag.nl",32],["nieuwsgigant.nl",32],["recepten-vandaag.nl",32],["voetbal-vandaag.nl",[32,452]],["eredivisie.ws",32],["formule1.ws",32],["grandprix.ws",32],["gezondheid.be",[33,34]],["eindexamens.nu",33],["gocar.be",35],["goldfm.be",36],["golf.be",37],["goodbye.be",38],["sporza.be",38],["goplay.be",39],["handbal.be",40],["mijn-tv-gids.be",[41,56]],["inmemoriam.be",42],["kinderspelletjes.be",44],["klasse.be",45],["truck1.be",[45,75]],["truck1-nl.be",[45,75]],["tvgemist.be",45],["voetbalnieuws.be",[45,81,82]],["alkmaarsdagblad.nl",[45,168,169]],["allradio.nl",45],["almelosdagblad.nl",[45,168,169]],["almeredagblad.nl",[45,168,169]],["amstelveensdagblad.nl",[45,168,169]],["amsterdamsdagblad.nl",[45,168,169]],["arnhemmerdagblad.nl",[45,168,169]],["assensdagblad.nl",[45,168,169]],["bergensdagblad.nl",[45,168,169]],["beverwijkerdagblad.nl",[45,168,169]],["bloemendaalsdagblad.nl",[45,168,169]],["bosschedagblad.nl",[45,168,169]],["bredasdagblad.nl",[45,168,169]],["broadcastmagazine.nl",45],["camjam.nl",45],["castricumsdagblad.nl",[45,168,169]],["creditexpo.nl",45],["dagbladdijkenwaard.nl",[45,168,169]],["dagbladeindhoven.nl",[45,168,169]],["dagbladgroningen.nl",[45,168,169]],["dagbladutrecht.nl",[45,168,169]],["denheldersdagblad.nl",[45,168,169]],["deventersdagblad.nl",[45,168,169]],["doetinchemsdagblad.nl",[45,168,169]],["dokkumerdagblad.nl",[45,168,169]],["dordrechtsdagblad.nl",[45,168,169]],["drechterlandsdagblad.nl",[45,168,169]],["drontensdagblad.nl",[45,168,169]],["elkspel.nl",[45,238]],["emmensdagblad.nl",[45,168,169]],["enkhuizerdagblad.nl",[45,168,169]],["enschedesdagblad.nl",[45,168,169]],["erotracks.nl",45],["filmladder.nl",45],["gezondheidsnet.nl",45],["gooischdagblad.nl",[45,168,169]],["haagsdagblad.nl",[45,168,169]],["haarlemmerdagblad.nl",[45,168,169]],["haarlemmermeerdagblad.nl",[45,168,169]],["harlingerdagblad.nl",[45,168,169]],["heemskerkerdagblad.nl",[45,168,169]],["heerenveensdagblad.nl",[45,168,169]],["heerhugowaardsdagblad.nl",[45,168,169]],["heerlensdagblad.nl",[45,168,169]],["heilooerdagblad.nl",[45,168,169]],["helmondsdagblad.nl",[45,168,169]],["hilversumsdagblad.nl",[45,168,169]],["hollandskroondagblad.nl",[45,168,169]],["hoornsdagblad.nl",[45,168,169]],["ijmuidensdagblad.nl",[45,168,169]],["jouresdagblad.nl",[45,168,169]],["katwijksdagblad.nl",[45,168,169]],["kennemerdagblad.nl",[45,168,169]],["koggenlandsdagblad.nl",[45,168,169]],["langedijkerdagblad.nl",[45,168,169]],["leeuwarderdagblad.nl",[45,168,169]],["lelystadsdagblad.nl",[45,168,169]],["lemsterdagblad.nl",[45,168,169]],["maastrichterdagblad.nl",[45,168,169]],["medembliksdagblad.nl",[45,168,169]],["middelburgsdagblad.nl",[45,168,169]],["moppen.nl",45],["nieuweoogst.nl",[45,349]],["nieuws.nl",[45,168,351]],["nieuwsuitwestfriesland.nl",[45,168,169]],["nijmeegsedagblad.nl",[45,168,169]],["noordlimburgsdagblad.nl",[45,168,169]],["noordoostpoldersdagblad.nl",[45,168,169]],["noordwijkerdagblad.nl",[45,168,169]],["nrc.nl",45],["nu.nl",[45,358]],["nunspeetsdagblad.nl",[45,168,169]],["opmeerderdagblad.nl",[45,168,169]],["purmerendsdagblad.nl",[45,168,169]],["rodensdagblad.nl",[45,168,169]],["roermondsdagblad.nl",[45,168,169]],["rotterdammerdagblad.nl",[45,168,169]],["sassenheimsdagblad.nl",[45,168,169]],["schagerdagblad.nl",[45,168,169]],["schermerdagblad.nl",[45,168,169]],["sittardsdagblad.nl",[45,168,169]],["sneekerdagblad.nl",[45,168,169]],["startbewijs.nl",45],["startkabel.nl",45],["startpagina.nl",[45,423]],["stedebroecsdagblad.nl",[45,168,169]],["televizier.nl",[45,82,430]],["telezien.nl",45],["texelsdagblad.nl",[45,168,169]],["tielsdagblad.nl",[45,168,169]],["tilburgsdagblad.nl",[45,168,169]],["totaaltv.nl",[45,434]],["truck1.nl",[45,75]],["tvgids.nl",45],["uitgeesterdagblad.nl",[45,168,169]],["uw-folder.nl",45],["volendamsdagblad.nl",[45,168,169]],["waldnet.nl",45],["wassenaarsdagblad.nl",[45,168,169]],["waterlandsdagblad.nl",[45,168,169]],["westlandsdagblad.nl",[45,168,169]],["wieringerdagblad.nl",[45,168,169]],["wormersdagblad.nl",[45,168,169]],["zaandamsdagblad.nl",[45,168,169]],["zandvoortsdagblad.nl",[45,168,169]],["zeewoldesdagblad.nl",[45,168,169]],["zwolledagblad.nl",[45,168,169]],["afkortingen.nu",[45,480]],["unity.nu",45],["knack.be",46],["livestreamvandaag.be",47],["ajaxreport.nl",47],["feyenoordreport.nl",47],["onlinekraslotenrss.nl",47],["onlinepokerrss.nl",47],["psvreport.nl",47],["sportweddenrss.nl",47],["voetbalsnafu.nl",47],["livios.be",48],["loonwijzer.be",49],["made-in.be",50],["mandelnieuws.be",51],["mariogames.be",52],["menttv.be",53],["meteovista.be",54],["metrotime.be",55],["mnm.be",57],["stubru.be",57],["mo.be",58],["netonline.be",59],["nnieuws.be",60],["nuus.be",61],["deoudrotterdammer.nl",[61,226]],["openingsurengids.be",62],["proximus.be",63],["qmusic.be",64],["qmusic.nl",64],["radiopros.be",65],["radioreflex.be",66],["radioviainternet.be",67],["rendez-vous.be",68],["retaildetail.be",69],["retaildetail.nl",69],["rubenweytjens.be",70],["tennisplaza.be",72],["tennisvlaanderen.be",73],["tijd.be",74],["vakantieweb.be",[76,77]],["immo.vlan.be",[77,79]],["vlan.be",78],["voetbalbelgie.be",80],["tvblik.nl",[82,441,442]],["voetbalvandaag.be",83],["volleybelgium.be",84],["leerlingen.com",84],["fcgroningen.nl",[84,249]],["mijnserie.nl",[84,338]],["nec-nijmegen.nl",84],["trappers.nl",84],["vtm.be",85],["wradio.be",87],["zita.be",88],["niburu.co",89],["az.nl",89],["cambuur.nl",89],["ga-eagles.nl",[89,267]],["402online.com",90],["abcsuriname.com",91],["vlietnieuws.nl",91],["amsterdamtigers.com",92],["antilliaansdagblad.com",93],["dolcevia.com",[93,99]],["lokaleomroepzeewolde.nl",93],["radiolelystad.nl",93],["bierdopje.com",94],["cryptobenelux.com",95],["bitcoinmagazine.nl",[95,197]],["dartsnieuws.com",96],["f1maximaal.nl",96],["indeleiderstrui.nl",96],["dbsuriname.com",97],["binnenvaartkrant.nl",97],["dartfreakz.nl",[97,218]],["dehavengids.nl",97],["dordtcentraal.nl",97],["hoekschnieuws.nl",97],["noordernieuws.nl",97],["oogtv.nl",[97,368]],["regioinbedrijf.nl",97],["sleutelstad.nl",97],["westerwoldeactueel.nl",[97,469]],["digitaalburg.com",98],["dutchcryptotalk.com",100],["footballtransfers.com",101],["gebruikershandleiding.com",102],["gfcnieuws.com",103],["gpfans.com",[104,105]],["playboy.nl",105],["live-voetbal.com",106],["motorboot.com",107],["nl.motorsport.com",108],["nauticlink.com",109],["nltube.com",110],["nummerzoeker.com",111],["openingstijden.com",[112,113]],["citaten.net",[112,141]],["promootjesite.nl",112],["radiofm.nl",[112,381]],["persberichten.com",114],["petities.com",115],["pornozot.com",116],["scholieren.com",117],["forum.scholieren.com",118],["sexverhalen.com",119],["arenalokaal.nl",119],["sportinnederland.com",120],["srherald.com",121],["studylibnl.com",122],["surinameview.com",123],["techradar.com",124],["voetbal.com",125],["yachtfocus.com",126],["frontline.digital",127],["radiovisie.eu",128],["takecare4.eu",129],["flair",130],["nederland.fm",131],["m.radioluisteren.fm",132],["radionl.fm",133],["banknieuws.info",134],["hardware.info",[135,136]],["hartvannederland.nl",[136,292]],["shownieuws.nl",[136,292]],["vivandaag.nl",[136,292]],["zuidenvelder.info",137],["yourlittleblackbook.me",[138,139]],["tostrams.nl",[138,433]],["republikein.com.na",140],["historiek.net",142],["opwindend.net",143],["skoften.net",144],["synoniemen.net",145],["tweakers.net",146],["uitzendinggemist.net",147],["vnexplorer.net",148],["waterkant.net",149],["wijwedden.net",150],["112achterhoek-nieuws.nl",151],["123geldzaken.nl",152],["123video.nl",153],["538.nl",154],["a1mediagroep.nl",155],["accountancyvanmorgen.nl",[156,157]],["salarisvanmorgen.nl",157],["adodenhaag.nl",158],["spelletje.nl",158],["adultwebmaster.nl",159],["agraaf.nl",160],["ajax.nl",161],["ajax1.nl",162],["ajaxfanatics.nl",163],["cambuurfront.nl",163],["fcgfans.nl",163],["feanonline.nl",163],["feyenoordpings.nl",163],["nacfans.nl",163],["psvfans.nl",163],["twentefans.nl",163],["utrechtfans.nl",163],["vitesseinside.nl",163],["voetbalverslaafd.nl",163],["vrouwenvoetbalnieuws.nl",163],["alblasserdamsnieuws.nl",164],["albrandswaardsdagblad.nl",[165,166]],["barendrechtsdagblad.nl",[165,166]],["dagblad010.nl",[165,166]],["dagblad070.nl",[165,166]],["goudsdagblad.nl",[165,166]],["ridderkerksdagblad.nl",[165,166]],["rijswijksdagblad.nl",[165,166]],["voorburgsdagblad.nl",[165,166]],["zoetermeersdagblad.nl",[165,166]],["capelsdagblad.nl",166],["nissewaardsdagblad.nl",166],["alkmaarguardians.nl",167],["gic.nl",[168,275]],["kbradio.nl",[168,313]],["almere-nieuws.nl",170],["amsterdamactueel.nl",171],["androidplanet.nl",172],["iphoned.nl",172],["anoniem-surfen.nl",173],["appletips.nl",174],["audiobookbay.nl",175],["autoblog.nl",176],["automobielmanagement.nl",177],["carwashpro.nl",177],["infrasite.nl",177],["rijschoolpro.nl",177],["spoorpro.nl",177],["taxipro.nl",177],["verkeersnet.nl",177],["autoreview.nl",178],["autoscout24.nl",179],["autosport.nl",180],["autowereld.nl",182],["autozine.nl",183],["baanwacht.nl",184],["baarsclassicrock.nl",185],["barneveldsekrant.nl",186],["edestad.nl",186],["basketball.nl",187],["berekenhet.nl",190],["beurs.nl",192],["beursgorilla.nl",193],["bieos-omroep.nl",195],["biernet.nl",196],["blikopnieuws.nl",198],["bnr.nl",199],["bodylifebenelux.nl",200],["bokt.nl",201],["bollywood.nl",202],["brandweerspotters.nl",203],["coc.nl",203],["cocamsterdam.nl",203],["cochaaglanden.nl",203],["fanclubbarcelona.nl",203],["businessinsider.nl",205],["buzzbie.nl",206],["cabla.nl",207],["ciaotutti.nl",208],["classic.nl",209],["classicstogo.nl",210],["coastline945fm.nl",211],["elfvoetbal.nl",211],["cocdeventer.nl",212],["apintie.sr",[212,487]],["crypto-insiders.nl",214],["cryptoclan.nl",215],["cryptonieuws.nl",215],["daemesenheeren.nl",216],["dagelijksestandaard.nl",217],["deblueskrant.nl",219],["decibel.nl",220],["dekrantnieuws.nl",[221,222]],["destreekkrant.nu",222],["dekrantvantynaarlo.nl",223],["denachtvlinders.nl",224],["deondernemer.nl",225],["detelefoongids.nl",227],["ditjesendatjes.nl",228],["drimble.nl",229],["duic.nl",230],["dumpert.nl",231],["dutchitchannel.nl",232],["duurzaamnieuws.nl",233],["dvhn.nl",[234,235]],["lc.nl",[234,235]],["meppelercourant.nl",235],["ecommercenews.nl",236],["edelmetaal-info.nl",237],["fiets.nl",238],["fietsactief.nl",238],["knipmode.nl",238],["riskcompliance.nl",238],["seasons.nl",238],["truckstar.nl",238],["vorsten.nl",238],["zin.nl",238],["emerce.nl",239],["encyclo.nl",[240,241]],["mijnwoordenboek.nl",241],["woorden.org",241],["eredivisie.nl",243],["eurocampings.nl",244],["eurogamer.nl",245],["ewmagazine.nl",[246,247]],["fotografie.nl",246],["fantv.nl",248],["fcupdate.nl",250],["fcutrecht.nl",251],["fd.nl",252],["feestdagen-nederland.nl",253],["fhm500.nl",255],["filmtotaal.nl",256],["financialinvestigator.nl",257],["flashscore.nl",258],["flexnieuws.nl",259],["focusclub.nl",260],["fok.nl",261],["folderz.nl",262],["intermediair.nl",262],["spel.nl",[262,419]],["spelletjes.nl",[262,419]],["freeones.nl",263],["freesoccer.nl",264],["funda.nl",265],["fwd.nl",266],["gamereactor.nl",268],["gaynews.nl",269],["geenstijl.nl",270],["geileverhalen.nl",271],["geldpedia.nl",272],["manpedia.nl",272],["vrouwpedia.nl",272],["gewoonvoorhem.nl",[273,274]],["girlscene.nl",[274,277]],["gigantfm.nl",276],["gloednieuw.nl",278],["glutenvrij.nl",279],["goedkoopstekeukensduitsland.nl",280],["golf.nl",281],["gooieneemlander.nl",282],["leidschdagblad.nl",282],["noordhollandsdagblad.nl",282],["gostreaming.nl",283],["gratisaftehalen.nl",284],["greenkeeper.nl",285],["guidinc.nl",286],["guruwatch.nl",287],["h2owaternetwerk.nl",288],["halstadcentraal.nl",289],["handbalinside.nl",290],["handbalstartpunt.nl",291],["vandaaginside.nl",[292,446]],["heracles.nl",293],["hollywoodhuizen.nl",294],["hotradiohits.nl",295],["iculture.nl",298],["iex.nl",299],["iexgeld.nl",300],["iexprofs.nl",301],["ijshockeynederland.nl",302],["indiexl.nl",304],["infinance.nl",305],["insideflyer.nl",306],["intikkertje.nl",307],["investmentofficer.nl",308],["jaap.nl",309],["jan-magazine.nl",310],["juf-milou.nl",311],["kalender-365.nl",312],["kekmama.nl",314],["kinderspelletjes.nl",316],["kinkymedia.nl",317],["klimaatinfo.nl",318],["knhs.nl",319],["knltb.nl",320],["tennis.nl",320],["knvb.nl",321],["onsoranje.nl",321],["ticketing.knvb.nl",322],["kranenwebsite.nl",324],["lonelyplanet.nl",326],["looopings.nl",327],["maarkelsnieuws.nl",328],["maaslandradio.nl",329],["mannenstyle.nl",330],["mannenzaken.nl",331],["marketingtribune.nl",332],["marktnet.nl",333],["marokko.nl",334],["mediacourant.nl",335],["mediamarkt.nl",336],["meerradio.nl",337],["nailtalk.nl",[338,346]],["minecrafttoplist.nl",339],["minimumloon.nl",340],["dissident.one",[341,483]],["motocrossplanet.nl",[342,343]],["amusement.tv",343],["beurs.tv",343],["cultuur.tv",343],["formule1.tv",343],["gamen.tv",343],["geloof.tv",343],["gezondheid.tv",343],["informatief.tv",343],["jongeren.tv",343],["kennis.tv",343],["kinderen.tv",343],["kook.tv",343],["lachen.tv",343],["mensen.tv",343],["mode.tv",343],["muziek.tv",343],["natuur.tv",343],["nederland.tv",343],["nieuws.tv",343],["ondernemen.tv",343],["onrecht.tv",343],["oranje.tv",343],["politiek.tv",343],["reis.tv",343],["serie.tv",343],["spelletjes.tv",343],["sporten.tv",343],["talentenjacht.tv",343],["vaartuig.tv",343],["verkiezing.tv",343],["voertuig.tv",343],["voetbal.tv",343],["weer.tv",343],["woon.tv",343],["motorfietsblog.nl",344],["musicmeter.nl",345],["nd.nl",347],["ngf.nl",348],["nieuwnieuws.nl",350],["nieuwsmotor.nl",352],["nieuwsuitdelden.nl",353],["noordkopcentraal.nl",355],["nos.nl",356],["notebookcheck.nl",357],["oisterwijknieuws.nl",359],["omroepbrabant.nl",360],["reclamefolder.nl",[360,383]],["omroepwest.nl",[362,363]],["omroepzeeland.nl",362],["oneworld.nl",364],["online-omzetten.nl",365],["online-radio.nl",366],["ontdek-amerika.nl",367],["oops.nl",369],["oozo.nl",370],["parool.nl",371],["trouw.nl",371],["podcastluisteren.nl",372],["pokeren.nl",373],["prewarcar.nl",374],["proshop.nl",375],["racesport.nl",377],["racingnews365.nl",378],["radio.nl",379],["radiocontinu.nl",380],["rd.nl",382],["recreatief.nl",384],["refoweb.nl",385],["regionoordkop.nl",386],["rickfm.nl",387],["rkcwaalwijk.nl",388],["webcam-harlingen.nl",388],["webcam-maastricht.nl",388],["rodi.nl",389],["rotterdambasketbal.nl",390],["rtlboulevard.nl",[391,392]],["rtlnieuws.nl",[391,393]],["rtvdrenthe.nl",394],["rtvgo.nl",395],["rtvideaal.nl",396],["rtvkrimpenerwaard.nl",397],["rtvmaastricht.nl",398],["rtvstichtsevecht.nl",399],["salvora.nl",400],["sc-heerenveen.nl",401],["scheepvaartkrant.nl",402],["schiedamsnieuws.nl",403],["schuttevaer.nl",404],["scientias.nl",405],["security.nl",406],["serietotaal.nl",407],["sexervaringendelen.nl",408],["sexguide.nl",409],["sexjobs.nl",410],["slam.nl",411],["sliedrecht24.nl",412],["softonic.nl",414],["solarmagazine.nl",415],["sozio.nl",416],["sparta-rotterdam.nl",417],["speeleiland.nl",418],["spidersolitairespelen.nl",420],["spreekbuis.nl",421],["startlijstjes.nl",422],["streamwijzer.nl",424],["streekstadcentraal.nl",425],["tameteo.nl",426],["techzine.nl",427],["telefoonboek.nl",428],["telegraaf.nl",429],["top40.nl",432],["totoknvbbeker.nl",435],["touretappe.nl",436],["tpo.nl",437],["transfermarkt.nl",438],["trucks.nl",439],["turksemedia.nl",440],["voetbalrotterdam.nl",[441,454]],["tvgids24.nl",443],["ucl-voetbal.nl",444],["uecl-voetbal.nl",444],["uel-voetbal.nl",444],["vagina.nl",445],["veronicasuperguide.nl",447],["vi.nl",448],["villamedia.nl",449],["vlaamskijken.nl",450],["vlootschouw.nl",451],["voetbalnederland.nl",453],["volleybal.nl",455],["vriendin.nl",456],["vrouweneredivisie.nl",457],["want.nl",458],["wanttoknow.nl",459],["webcam-aalsmeer.nl",460],["webcam-airport.nl",460],["webcam-binnenvaart.nl",460],["webcam-blokzijl.nl",460],["webcam-brandaris.nl",460],["webcam-delfzijl.nl",460],["webcam-denhelder.nl",460],["webcam-denoever.nl",460],["webcam-dokkum.nl",460],["webcam-dordrecht.nl",460],["webcam-enkhuizen.nl",460],["webcam-friesemeren.nl",460],["webcam-grou.nl",460],["webcam-havenijmuiden.nl",460],["webcam-hindeloopen.nl",460],["webcam-hoekvanholland.nl",460],["webcam-kampen.nl",460],["webcam-lauwersoog.nl",460],["webcam-leeuwarden.nl",460],["webcam-lelystad.nl",460],["webcam-maassluis.nl",460],["webcam-marken.nl",460],["webcam-monnickendam.nl",460],["webcam-rotterdam.nl",460],["webcam-sneek.nl",460],["webcam-terneuzen.nl",460],["webcam-vlaardingen.nl",460],["webcam-volendam.nl",460],["webcam-workum.nl",460],["webcam-zaanzicht.nl",460],["webcam-zoutkamp.nl",460],["webcam-zwartsluis.nl",460],["webcams-ameland.nl",460],["webcams-scheveningen.nl",460],["webcams-texel.nl",460],["webcams-vlissingen.nl",460],["webcamschiermonnikoog.nl",460],["webcamvlieland.nl",460],["webwereld.nl",461],["webwoordenboek.nl",462],["weeronline.nl",463],["weerplaza.nl",464],["weerstationleeuwarden.nl",465],["weertdegekste.nl",466],["welklidwoord.nl",468],["wettelijke-feestdagen.nl",470],["wibnet.nl",471],["willem-ii.nl",472],["wintersport.nl",473],["wkdarts.nl",474],["wordfeudwoorden.nl",475],["zeelandnet.nl",477],["zoom.nl",478],["zozwanger.nl",479],["nieuwsfiets.nu",481],["velt.nu",482],["dorpsklanken.online",484],["eindtijdklok.org",485],["omrekenen.org",486],["sun.sr",488],["unitednews.sr",489],["tvgids.tv",490],["diecourant.co.za",491],["overstrandherald.co.za",492]]);

const entitiesMap = new Map([["morningstar",0]]);

const exceptionsMap = new Map(undefined);

self.specificImports = self.specificImports || [];
self.specificImports.push({ argsList, hostnamesMap, entitiesMap, exceptionsMap });

/******************************************************************************/

})();

/******************************************************************************/
