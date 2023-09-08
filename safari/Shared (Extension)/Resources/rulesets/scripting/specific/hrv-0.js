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

// ruleset: hrv-0

/******************************************************************************/

// Important!
// Isolate from global scope
(function uBOL_cssSpecificImports() {

/******************************************************************************/

const argsList = [".bannergroup,\n.reklamebg",".footer-reklame,\n.side-marketing",".leader-wrap-out,\n.widget_block.side-widget","#Billboard_UnderArticle,\n.article__comments + .textwidget",".banner",".articleViewBanners,\na[href*=\"-kisa-kesa\"][href*=\"eura\"],\na[href*=\"kazino\"]",".idk_baner_top,\n.img_advertising",".code-block",".triple_banner_container,\ndiv[id*=\"_in_article_\"]","div[style^=\"text-align: center;\"]",".td-ss-main-sidebar","#ads_rectangle,\n#rectangle_container,\n.native-ads",".widget_block",".reklama_flash,\n.reklama_flash_mini",".widget_custom_html","#adx-video-player,\n#dodatni-desk",".izdvojeni-index.ad:not(.nas),\n.rbb,\ndiv[class^=\"artikal \"]",".banner-side,\ndiv.mt-3[style^=\"min-height: 250px\"],\ndiv[style^=\"min-height: 250px; width: 100%\"],\ndiv[style^=\"min-height: 250px;\"]:first-of-type",".widget_text.jeg_pb_boxed_shadow","#sidebar > .widget_custom_html",".widget-ad-image,\nsection[data-settings]:first-of-type","div[id^=\"reklamaHor\"],\ndiv[id^=\"reklamaVer\"]",".banner-bg,\n.banner-desktop,\n.bp,\na[href*=\"/wwin-\"]",".elementor-widget-image",".leaderboard",".widget_media_image",".horizontal-banners",".oglasi_sredina","body > div[class=\"container\"]",".root-ads-laptop",".banner-promotion",".banner_main",".banner-img",".grid-item-pad",".adcontainer",".sd-banners-zone-a1,\ndiv[id^=\"block-ea-adocean-ea-adocean-\"]","a[class^=\"baner_\"]",".category-promo,\ndiv[class^=\"advads-\"]",".adexElement:not(html, body)",".stickyfill",".js-results-slot","div[id^=\"html5box-\"]",".popupBannerWrapper","#meta_box + #mobile + div[class^=\"css-\"],\n.Slot_content,\n.Slot_placeholder,\ndiv[data-upscore-zone^=\"product\"],\ndiv[style^=\"display:\"],\nmain > .cls_frame",".box-section","hr:empty","div[class^=\"position_break_\"]","div[class^=\"position_item_\"]",".ad",".ponuda",".ad-container,\n.google-billboard-top",".col--item-side,\n.container--break[class*=\"break_\"],\n.feroterm.products,\n.lidl.products,\n.promo_heading_fix img,\ndiv[class^=\"position_j\"],\ndiv[id^=\"upscore-promo-\"]","#billboard_ad_container,\n.noa-banner > a,\n.side_banner",".vc_raw_html",".banner-inner,\n.billboard-banner","#below_content_third_party,\ndiv[data-upscore-zone=\"product-gallery\"]",".BannerAlignment,\n.BannerBillboard","#tickerBanner,\n.addActive,\n.addBlock,\n.blockAdd,\n.more-news",".Wallpaper-container",".container--break,\n.container--linker-bottom,\n.item__ad-center",".offers-widget",".admiral_widget,\n.js-topOffer,\n.single-article__row--top-offer","div[title^=\"TERRA reklama\" i],\ndiv[title^=\"reklama2.\"]",".td-is-sticky div[align=\"center\"] > a > img,\n.td-ss-main-sidebar div[align=\"center\"] > a > img",".banners-wrapper,\n.sidebar",".iklon",".leaderboardBanner",".enjoy-css",".elementor-image","aside > img",".elementor-widget-image > .elementor-widget-container",".el-link > picture,\ndiv[uk-slider].uk-text-center",".uk-margin > .el-link,\n.uk-section-default .uk-text-center.uk-margin,\n.uk-slider-container.uk-text-center,\ndiv[class^=\"uk-width-1-\"] > hr:empty",".js-gpt-ad",".onogo-target",".baner__desktop","svg + div[class*=\"ekit\"] section.elementor-section:last-of-type",".a-wrap,\n.pvpor-widget",".brandingBannerLeft,\n.brandingBannerRight",".gornje-reklame > .big,\n.reklame-dio .medium,\n.vijesti-dio > div[class*=\"banner-\"],\na[href$=\"://cedis.me/\"]",".brandLeft,\n.brandRight",".ads","[id^=\"MyAdsId\"]",".article__section-wrapper--zebra",".banner-right,\n.topBanner",".banner-wrapper",".bnr-wrapper",".banner-center,\n.mt10.twelvecol",".justify-content-center:first-of-type",".fusion-imageframe > a[href][target=\"_blank\"] > img",".add_wrapper_below_navbar,\nbody > div:first-of-type",".banner-top,\n.sticky-area",".section-sidebar-banners","body > .scale-wrapper",".border-b.block,\n.container > .p-4,\n.footer-top-bar",".home-contain","#mvp-leader-wrap",".promo-header,\n.top-promo-header",".extendedwopts-mobile,\ndiv[class$=\"-align-center\"]",".contenttop,\n.moduleleftads","#rotate-ads,\n.advertising,\n.container-banner,\n.sidebar > div:first-of-type,\n.wrapper > nav + div[class*=\" \"]",".ban300x260,\nbody > a[class^=\"bg\"]",".aklaplace,\n.banner-sidebar","#shoppster-widget,\n.uc-in-feed-banner",".aside-box + .banner,\n.main > div.container,\n.text-center.container",".d-bnr-block",".posttext-a,\nbody > div[class^=\"home-branding\"],\ndiv[id^=\"sidebar_\"]",".branding,\na[id*=\"FloatBaner\"]",".execphpwidget video",".slot",".ad-kliktv,\n.zadruga-top",".ad-space-bottom",".section-rek","div[id^=\"midasWidget\"]",".BannerAd","div[class*=\"adocean\"],\ndiv[data-label=\"Reklama\"]",".third-party-menu-container",".custom-html-widget",".ai_widget",".banner-placeholder-text",".td-single-image-","#top-banner","#comments ~ a,\n.ticker-news ~ a,\naside[id*=\"facebook\"] ~ .widget_media_image",".banner-box,\n.right-side > div[style^=\"text-align\"] > a",".ms-image,\n.wp-block-image","#header-wrap-reklama,\n#sidebar > #HTML8,\n#sidebar-two > #HTML4,\n#sidebar-two > #HTML5"];

const hostnamesMap = new Map([["artinfo.ba",0],["avaz.ba",1],["boljatuzla.ba",2],["bosnainfo.ba",[3,4]],["bloombergadria.com",4],["mojtv.hr",4],["barinfo.me",[4,64]],["24sedam.rs",[4,85,86]],["alo.rs",[4,87]],["blic.rs",[4,91]],["hellomagazin.rs",4],["informer.rs",4],["novaekonomija.rs",4],["sd.rs",[4,115]],["svet-scandal.rs",4],["depo.ba",5],["farmer.ba",6],["fokus.ba",7],["zvornicki.ba",[7,12,25]],["bankar.me",7],["glamblam.ba",8],["hayat.ba",9],["infoprijedor.ba",10],["klix.ba",11],["krajiski.ba",12],["onlyclubbing.com",[12,32]],["glascg.me",[12,70]],["nap.ba",13],["noob.ba",14],["infovranjske.rs",[14,98]],["novi.ba",15],["olx.ba",16],["radiosarajevo.ba",17],["radiovkladusa.ba",18],["raport.ba",19],["sodalive.ba",20],["source.ba",21],["sportsport.ba",22],["tuzlainfo.ba",23],["vecernjenovosti.ba",24],["istramet.hr",25],["borba.me",25],["primorski.me",[25,76]],["vijestibp.me",25],["rtvpancevo.rs",25],["sport026.rs",25],["tangosix.rs",[25,118]],["udarnavest.rs",25],["animesrbija.com",26],["eprevodilac.com",27],["glassrpske.com",28],["mobilnisvet.com",29],["n1info.com",30],["n1info.hr",[30,54]],["nova.rs",[30,103]],["sportklub.rs",[30,116]],["najboljamamanasvetu.com",31],["povezano.com",33],["saznajnovo.com",34],["srbijadanas.com",35],["tvarenasport.com",36],["ul-info.com",37],["24sata.hr",38],["agrobiz.hr",39],["nicelocal.com.hr",40],["dalmacijadanas.hr",41],["dalmatinskiportal.hr",42],["danas.hr",43],["dnevnik.hr",44],["glasistre.hr",45],["gloria.hr",[46,47]],["jutarnji.hr",[47,51]],["grazia.hr",48],["hcl.hr",49],["index.hr",50],["mob.hr",52],["motori.hr",53],["n1info.rs",54],["net.hr",55],["njuskalo.hr",56],["novilist.hr",57],["rtl.hr",58],["slobodnadalmacija.hr",59],["telegram.hr",60],["vecernji.hr",61],["snnovine.hu",62],["zagreb.info",63],["bit.me",65],["bokanews.me",66],["dan.co.me",67],["press.co.me",68],["rthn.co.me",69],["jadranbudva.me",71],["jadrannovi.me",72],["mondo.me",73],["onogost.me",74],["patuljak.me",75],["pvportal.me",77],["rtcg.me",78],["rtnk.me",79],["vijesti.me",[80,81]],["espreso.co.rs",81],["domaceserije.net",82],["sportske.net",83],["021.rs",84],["republika.rs",[86,114]],["atvbl.rs",88],["aviatica.rs",89],["forum.benchmark.rs",90],["cenoteka.rs",92],["cineplexx.rs",93],["danas.rs",94],["epancevo.rs",95],["filmitv.rs",96],["gradnja.rs",97],["mojkraj.rs",99],["navidiku.rs",100],["naxi.rs",101],["nekretnine.rs",102],["novosti.rs",104],["nportal.rs",105],["objektiv.rs",106],["paragraf.rs",107],["pcpress.rs",108],["penzionisani.rs",109],["pink.rs",110],["planplus.rs",111],["pravda.rs",112],["prva.rs",113],["srbijajavlja.rs",117],["telegraf.rs",119],["telegraf.tv",119],["triangletv.rs",120],["tvprogram.rs",121],["tvsuper.rs",122],["vesti.rs",123],["vojvodinainfo.rs",124],["gledajcrtace.xyz",125]]);

const entitiesMap = new Map(undefined);

const exceptionsMap = new Map(undefined);

self.specificImports = self.specificImports || [];
self.specificImports.push({ argsList, hostnamesMap, entitiesMap, exceptionsMap });

/******************************************************************************/

})();

/******************************************************************************/
