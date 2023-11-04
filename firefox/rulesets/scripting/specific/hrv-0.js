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

const argsList = [".bannergroup,\n.reklamebg",".footer-reklame,\n.side-marketing",".leader-wrap-out,\n.widget_block.side-widget","#Billboard_UnderArticle,\n.article__comments + .textwidget",".banner",".articleViewBanners,\na[href*=\"-kisa-kesa\"][href*=\"eura\"],\na[href*=\"kazino\"]",".idk_baner_top,\n.img_advertising",".code-block",".triple_banner_container,\ndiv[id*=\"_in_article_\"]","div[style^=\"text-align: center;\"]",".td-ss-main-sidebar","#ads_rectangle,\n#rectangle_container,\n.native-ads",".widget_block",".banner-promotion",".banner-inner,\n.billboard-banner",".reklama_flash,\n.reklama_flash_mini",".widget_custom_html","#adx-video-player,\n#dodatni-desk",".izdvojeni-index.ad:not(.nas),\n.rbb,\ndiv[class^=\"artikal \"]",".banner-side,\ndiv.mt-3[style^=\"min-height: 250px\"],\ndiv[style^=\"min-height: 250px; width: 100%\"],\ndiv[style^=\"min-height: 250px;\"]:first-of-type",".widget_text.jeg_pb_boxed_shadow","#sidebar > .widget_custom_html",".widget-ad-image,\nsection[data-settings]:first-of-type","div[id^=\"reklamaHor\"],\ndiv[id^=\"reklamaVer\"]",".banner-bg,\n.banner-desktop,\n.bp,\na[href*=\"/wwin-\"]",".elementor-widget-image",".leaderboard",".widget_media_image",".horizontal-banners",".oglasi_sredina","body > div[class=\"container\"]",".root-ads-laptop",".banner_main",".banner-img",".grid-item-pad",".adcontainer",".sd-banners-zone-a1,\ndiv[id^=\"block-ea-adocean-ea-adocean-\"]","a[class^=\"baner_\"]",".category-promo,\ndiv[class^=\"advads-\"]",".billboard-wrapper",".adexElement:not(html, body),\n.pieces_widget",".stickyfill",".js-results-slot","div[id^=\"html5box-\"]",".popupBannerWrapper","#meta_box + #mobile + div[class^=\"css-\"],\n.Slot_content,\n.Slot_placeholder,\ndiv[data-upscore-zone^=\"product\"],\ndiv[style^=\"display:\"],\nmain > .cls_frame",".box-section",".text-center.col-md-3,\nhr:empty","div[class^=\"position_break_\"]","div[class^=\"position_item_\"]",".ad",".ponuda",".ad-container,\n.google-billboard-top",".col--item-side,\n.container--break[class*=\"break_\"],\n.feroterm.products,\n.lidl.products,\n.promo_heading_fix img,\ndiv[class^=\"position_j\"],\ndiv[id^=\"upscore-promo-\"]","#billboard_ad_container,\n.noa-banner > a,\n.side_banner",".vc_raw_html","#below_content_third_party,\ndiv[data-upscore-zone=\"product-gallery\"]",".BannerAlignment,\n.BannerBillboard","#tickerBanner,\n.addActive,\n.addBlock,\n.blockAdd,\n.more-news,\n.widget-slider-wrap",".Wallpaper-container",".container--break,\n.container--linker-bottom,\n.item__ad-center",".offers-widget",".admiral_widget,\n.js-topOffer,\n.single-article__row--top-offer","div[title^=\"TERRA reklama\" i],\ndiv[title^=\"reklama2.\"]",".td-is-sticky div[align=\"center\"] > a > img,\n.td-ss-main-sidebar div[align=\"center\"] > a > img",".banners-wrapper,\n.sidebar",".iklon",".leaderboardBanner",".enjoy-css",".elementor-image","aside > img",".elementor-widget-image > .elementor-widget-container",".el-link > picture,\ndiv[uk-slider].uk-text-center",".uk-margin > .el-link,\n.uk-section-default .uk-text-center.uk-margin,\n.uk-slider-container.uk-text-center,\ndiv[class^=\"uk-width-1-\"] > hr:empty",".js-gpt-ad",".onogo-target",".baner__desktop","svg + div[class*=\"ekit\"] section.elementor-section:last-of-type",".a-wrap,\n.pvpor-widget",".brandingBannerLeft,\n.brandingBannerRight",".gornje-reklame > .big,\n.reklame-dio .medium,\n.vijesti-dio > div[class*=\"banner-\"],\na[href$=\"://cedis.me/\"]",".brandLeft,\n.brandRight",".ads","[id^=\"MyAdsId\"]",".featured-add",".article__section-wrapper--zebra",".banner-right,\n.topBanner",".banner-wrapper",".bnr-wrapper",".banner-center,\n.mt10.twelvecol",".justify-content-center:first-of-type",".fusion-imageframe > a[href][target=\"_blank\"] > img",".add_wrapper_below_navbar,\nbody > div:first-of-type",".banner-top,\n.sticky-area",".section-sidebar-banners","body > .scale-wrapper",".border-b.block,\n.container > .p-4,\n.footer-top-bar",".home-contain","#mvp-leader-wrap",".promo-header,\n.top-promo-header",".extendedwopts-mobile,\ndiv[class$=\"-align-center\"]",".contenttop,\n.moduleleftads","#rotate-ads,\n.advertising,\n.container-banner,\n.sidebar > div:first-of-type,\n.wrapper > nav + div[class*=\" \"]",".ban300x260,\nbody > a[class^=\"bg\"]",".aklaplace,\n.banner-sidebar","#shoppster-widget,\n.uc-in-feed-banner",".aside-box + .banner,\n.main > div.container,\n.text-center.container",".d-bnr-block",".posttext-a,\nbody > div[class^=\"home-branding\"],\ndiv[id^=\"sidebar_\"]",".branding,\na[id*=\"FloatBaner\"]",".execphpwidget video",".slot",".ad-kliktv,\n.zadruga-top",".ad-space-bottom",".section-rek","div[id^=\"midasWidget\"]",".BannerAd","div[class*=\"adocean\"],\ndiv[data-label=\"Reklama\"]",".third-party-menu-container",".custom-html-widget",".ai_widget",".banner-placeholder-text",".td-single-image-","#top-banner","#comments ~ a,\n.ticker-news ~ a,\naside[id*=\"facebook\"] ~ .widget_media_image",".banner-box,\n.right-side > div[style^=\"text-align\"] > a",".djslider-loader,\n[class*=\"box  nomargin\"],\nsection[id$=\"Top\" i] > div[class=\"box \"]",".ms-image,\n.wp-block-image","#header-wrap-reklama,\n#sidebar > #HTML8,\n#sidebar-two > #HTML4,\n#sidebar-two > #HTML5"];

const hostnamesMap = new Map([["artinfo.ba",0],["avaz.ba",1],["boljatuzla.ba",2],["bosnainfo.ba",[3,4]],["bloombergadria.com",4],["mojtv.hr",4],["barinfo.me",[4,65]],["24sedam.rs",[4,87,88]],["alo.rs",[4,89]],["blic.rs",[4,93]],["hellomagazin.rs",4],["informer.rs",4],["novaekonomija.rs",4],["sd.rs",[4,117]],["svet-scandal.rs",4],["depo.ba",5],["farmer.ba",6],["fokus.ba",7],["zvornicki.ba",[7,12,27]],["bankar.me",7],["glamblam.ba",8],["hayat.ba",9],["infoprijedor.ba",10],["klix.ba",11],["krajiski.ba",12],["onlyclubbing.com",[12,33]],["glascg.me",[12,71]],["n1info.ba",[13,14]],["n1info.com",13],["n1info.hr",[13,14]],["nova.rs",[13,105]],["sportklub.rs",[13,118]],["n1info.rs",14],["nap.ba",15],["noob.ba",16],["infovranjske.rs",[16,100]],["novi.ba",17],["olx.ba",18],["radiosarajevo.ba",19],["radiovkladusa.ba",20],["raport.ba",21],["sodalive.ba",22],["source.ba",23],["sportsport.ba",24],["tuzlainfo.ba",25],["vecernjenovosti.ba",26],["istramet.hr",27],["borba.me",27],["primorski.me",[27,77]],["vijestibp.me",27],["rtvpancevo.rs",27],["sport026.rs",27],["tangosix.rs",[27,120]],["udarnavest.rs",27],["animesrbija.com",28],["eprevodilac.com",29],["glassrpske.com",30],["mobilnisvet.com",31],["najboljamamanasvetu.com",32],["povezano.com",34],["saznajnovo.com",35],["srbijadanas.com",36],["tvarenasport.com",37],["ul-info.com",38],["vecer.com",39],["24sata.hr",40],["agrobiz.hr",41],["nicelocal.com.hr",42],["dalmacijadanas.hr",43],["dalmatinskiportal.hr",44],["danas.hr",45],["dnevnik.hr",46],["glasistre.hr",47],["gloria.hr",[48,49]],["jutarnji.hr",[49,53]],["grazia.hr",50],["hcl.hr",51],["index.hr",52],["mob.hr",54],["motori.hr",55],["net.hr",56],["njuskalo.hr",57],["novilist.hr",58],["rtl.hr",59],["slobodnadalmacija.hr",60],["telegram.hr",61],["vecernji.hr",62],["snnovine.hu",63],["zagreb.info",64],["bit.me",66],["bokanews.me",67],["dan.co.me",68],["press.co.me",69],["rthn.co.me",70],["jadranbudva.me",72],["jadrannovi.me",73],["mondo.me",74],["onogost.me",75],["patuljak.me",76],["pvportal.me",78],["rtcg.me",79],["rtnk.me",80],["vijesti.me",[81,82]],["espreso.co.rs",82],["domaceserije.net",83],["info-ks.net",84],["sportske.net",85],["021.rs",86],["republika.rs",[88,116]],["atvbl.rs",90],["aviatica.rs",91],["forum.benchmark.rs",92],["cenoteka.rs",94],["cineplexx.rs",95],["danas.rs",96],["epancevo.rs",97],["filmitv.rs",98],["gradnja.rs",99],["mojkraj.rs",101],["navidiku.rs",102],["naxi.rs",103],["nekretnine.rs",104],["novosti.rs",106],["nportal.rs",107],["objektiv.rs",108],["paragraf.rs",109],["pcpress.rs",110],["penzionisani.rs",111],["pink.rs",112],["planplus.rs",113],["pravda.rs",114],["prva.rs",115],["srbijajavlja.rs",119],["telegraf.rs",121],["telegraf.tv",121],["triangletv.rs",122],["tvprogram.rs",123],["tvsuper.rs",124],["vesti.rs",125],["vino.rs",126],["vojvodinainfo.rs",127],["gledajcrtace.xyz",128]]);

const entitiesMap = new Map(undefined);

const exceptionsMap = new Map(undefined);

self.specificImports = self.specificImports || [];
self.specificImports.push({ argsList, hostnamesMap, entitiesMap, exceptionsMap });

/******************************************************************************/

})();

/******************************************************************************/
