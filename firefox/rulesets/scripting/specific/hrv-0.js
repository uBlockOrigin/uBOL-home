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

const argsList = [".bannergroup,\n.reklamebg",".footer-reklame,\n.side-marketing",".leader-wrap-out,\n.widget_block.side-widget","#Billboard_UnderArticle,\n.article__comments + .textwidget",".banner",".articleViewBanners,\na[href*=\"-kisa-kesa\"][href*=\"eura\"],\na[href*=\"kazino\"]",".idk_baner_top,\n.img_advertising",".code-block",".triple_banner_container,\ndiv[id*=\"_in_article_\"]","div[style^=\"text-align: center;\"]",".td-ss-main-sidebar","#ads_rectangle,\n#rectangle_container,\n.native-ads",".widget_block",".banner-promotion",".banner-inner,\n.billboard-banner",".reklama_flash,\n.reklama_flash_mini",".widget_custom_html","#adx-video-player,\n#dodatni-desk",".izdvojeni-index.ad:not(.nas),\n.rbb,\ndiv[class^=\"artikal \"]",".banner-side,\ndiv.mt-3[style^=\"min-height: 250px\"],\ndiv[style^=\"min-height: 250px; width: 100%\"],\ndiv[style^=\"min-height: 250px;\"]:first-of-type",".widget_text.jeg_pb_boxed_shadow","#sidebar > .widget_custom_html",".widget-ad-image,\nsection[data-settings]:first-of-type","div[id^=\"reklamaHor\"],\ndiv[id^=\"reklamaVer\"]",".banner-bg,\n.banner-desktop,\n.bp,\na[href*=\"/wwin-\"]",".elementor-widget-image",".leaderboard",".widget_media_image",".horizontal-banners",".oglasi_sredina","body > div[class=\"container\"]",".root-ads-laptop",".banner_main",".banner-img",".grid-item-pad",".adcontainer",".sd-banners-zone-a1,\ndiv[id^=\"block-ea-adocean-ea-adocean-\"]","a[class^=\"baner_\"]",".category-promo,\ndiv[class^=\"advads-\"]",".billboard-wrapper",".adexElement:not(html, body),\n.pieces_widget",".stickyfill","div[data-href*=\"/icam.hr/\"],\ndiv[data-href*=\"blog.bon.hr/\"]",".js-results-slot","div[id^=\"html5box-\"]",".popupBannerWrapper","#meta_box + #mobile + div[class^=\"css-\"],\n.Slot_content,\n.Slot_placeholder,\ndiv[data-upscore-zone^=\"product\"],\ndiv[style^=\"display:\"],\nmain > .cls_frame",".box-section",".row .banner + .row,\n.text-center.col-md-3,\nhr:empty","div[class^=\"position_break_\"]","div[class^=\"position_item_\"]",".ad",".ponuda",".ad-container,\n.google-billboard-top",".col--item-side,\n.container--break[class*=\"break_\"],\n.feroterm.products,\n.lidl.products,\n.promo_heading_fix img,\ndiv[class^=\"position_j\"],\ndiv[id^=\"upscore-promo-\"]","#billboard_ad_container,\n.noa-banner > a,\n.side_banner",".vc_raw_html","#below_content_third_party,\ndiv[data-upscore-zone=\"product-gallery\"]",".BannerAlignment,\n.BannerBillboard","#tickerBanner,\n.addActive,\n.addBlock,\n.blockAdd,\n.more-news,\n.widget-slider-wrap",".Wallpaper-container",".container--break,\n.container--linker-bottom,\n.item__ad-center",".offers-widget",".admiral_widget,\n.js-topOffer,\n.single-article__row--top-offer","div[title^=\"TERRA reklama\" i],\ndiv[title^=\"reklama2.\"]",".td-is-sticky div[align=\"center\"] > a > img,\n.td-ss-main-sidebar div[align=\"center\"] > a > img",".banners-wrapper,\n.sidebar",".iklon",".leaderboardBanner",".enjoy-css",".elementor-image","aside > img",".elementor-widget-image > .elementor-widget-container",".el-link > picture,\ndiv[uk-slider].uk-text-center",".uk-margin > .el-link,\n.uk-section-default .uk-text-center.uk-margin,\n.uk-slider-container.uk-text-center,\ndiv[class^=\"uk-width-1-\"] > hr:empty",".js-gpt-ad",".onogo-target",".baner__desktop","svg + div[class*=\"ekit\"] section.elementor-section:last-of-type",".a-wrap,\n.pvpor-widget",".brandingBannerLeft,\n.brandingBannerRight",".gornje-reklame > .big,\n.reklame-dio .medium,\n.vijesti-dio > div[class*=\"banner-\"],\na[href$=\"://cedis.me/\"]",".brandLeft,\n.brandRight",".ads","[id^=\"MyAdsId\"]",".featured-add",".article__section-wrapper--zebra",".banner-right,\n.topBanner",".banner-wrapper",".bnr-wrapper",".banner-center,\n.mt10.twelvecol",".justify-content-center:first-of-type",".fusion-imageframe > a[href][target=\"_blank\"] > img",".add_wrapper_below_navbar,\nbody > div:first-of-type",".banner-top,\n.sticky-area",".section-sidebar-banners","body > .scale-wrapper",".border-b.block,\n.container > .p-4,\n.footer-top-bar",".home-contain","#mvp-leader-wrap",".promo-header,\n.top-promo-header",".extendedwopts-mobile,\ndiv[class$=\"-align-center\"]",".contenttop,\n.moduleleftads","#rotate-ads,\n.advertising,\n.container-banner,\n.sidebar > div:first-of-type,\n.wrapper > nav + div[class*=\" \"]",".ban300x260,\nbody > a[class^=\"bg\"]",".aklaplace,\n.banner-sidebar","#shoppster-widget,\n.uc-in-feed-banner",".aside-box + .banner,\n.main > div.container,\n.text-center.container",".d-bnr-block",".posttext-a,\nbody > div[class^=\"home-branding\"],\ndiv[id^=\"sidebar_\"]",".branding,\na[id*=\"FloatBaner\"]",".execphpwidget video",".slot",".ad-kliktv,\n.zadruga-top",".ad-space-bottom",".section-rek","div[id^=\"midasWidget\"]",".BannerAd","div[class*=\"adocean\"],\ndiv[data-label=\"Reklama\"]",".third-party-menu-container",".custom-html-widget",".ai_widget",".banner-placeholder-text",".td-single-image-","#top-banner","#comments ~ a,\n.ticker-news ~ a,\naside[id*=\"facebook\"] ~ .widget_media_image",".banner-box,\n.right-side > div[style^=\"text-align\"] > a",".djslider-loader,\n[class*=\"box  nomargin\"],\nsection[id$=\"Top\" i] > div[class=\"box \"]",".ms-image,\n.wp-block-image","#header-wrap-reklama,\n#sidebar > #HTML8,\n#sidebar-two > #HTML4,\n#sidebar-two > #HTML5"];

const hostnamesMap = new Map([["artinfo.ba",0],["avaz.ba",1],["boljatuzla.ba",2],["bosnainfo.ba",[3,4]],["bloombergadria.com",4],["mojtv.hr",4],["barinfo.me",[4,66]],["24sedam.rs",[4,88,89]],["alo.rs",[4,90]],["blic.rs",[4,94]],["hellomagazin.rs",4],["informer.rs",4],["novaekonomija.rs",4],["sd.rs",[4,118]],["svet-scandal.rs",4],["depo.ba",5],["farmer.ba",6],["fokus.ba",7],["zvornicki.ba",[7,12,27]],["bankar.me",7],["glamblam.ba",8],["hayat.ba",9],["infoprijedor.ba",10],["klix.ba",11],["krajiski.ba",12],["onlyclubbing.com",[12,33]],["glascg.me",[12,72]],["n1info.ba",[13,14]],["n1info.com",13],["n1info.hr",[13,14]],["nova.rs",[13,106]],["sportklub.rs",[13,119]],["n1info.rs",14],["nap.ba",15],["noob.ba",16],["infovranjske.rs",[16,101]],["novi.ba",17],["olx.ba",18],["radiosarajevo.ba",19],["radiovkladusa.ba",20],["raport.ba",21],["sodalive.ba",22],["source.ba",23],["sportsport.ba",24],["tuzlainfo.ba",25],["vecernjenovosti.ba",26],["istramet.hr",27],["borba.me",27],["primorski.me",[27,78]],["vijestibp.me",27],["rtvpancevo.rs",27],["sport026.rs",27],["tangosix.rs",[27,121]],["udarnavest.rs",27],["animesrbija.com",28],["eprevodilac.com",29],["glassrpske.com",30],["mobilnisvet.com",31],["najboljamamanasvetu.com",32],["povezano.com",34],["saznajnovo.com",35],["srbijadanas.com",36],["tvarenasport.com",37],["ul-info.com",38],["vecer.com",39],["24sata.hr",40],["agrobiz.hr",41],["arhivanalitika.hr",42],["nicelocal.com.hr",43],["dalmacijadanas.hr",44],["dalmatinskiportal.hr",45],["danas.hr",46],["dnevnik.hr",47],["glasistre.hr",48],["gloria.hr",[49,50]],["jutarnji.hr",[50,54]],["grazia.hr",51],["hcl.hr",52],["index.hr",53],["mob.hr",55],["motori.hr",56],["net.hr",57],["njuskalo.hr",58],["novilist.hr",59],["rtl.hr",60],["slobodnadalmacija.hr",61],["telegram.hr",62],["vecernji.hr",63],["snnovine.hu",64],["zagreb.info",65],["bit.me",67],["bokanews.me",68],["dan.co.me",69],["press.co.me",70],["rthn.co.me",71],["jadranbudva.me",73],["jadrannovi.me",74],["mondo.me",75],["onogost.me",76],["patuljak.me",77],["pvportal.me",79],["rtcg.me",80],["rtnk.me",81],["vijesti.me",[82,83]],["espreso.co.rs",83],["domaceserije.net",84],["info-ks.net",85],["sportske.net",86],["021.rs",87],["republika.rs",[89,117]],["atvbl.rs",91],["aviatica.rs",92],["forum.benchmark.rs",93],["cenoteka.rs",95],["cineplexx.rs",96],["danas.rs",97],["epancevo.rs",98],["filmitv.rs",99],["gradnja.rs",100],["mojkraj.rs",102],["navidiku.rs",103],["naxi.rs",104],["nekretnine.rs",105],["novosti.rs",107],["nportal.rs",108],["objektiv.rs",109],["paragraf.rs",110],["pcpress.rs",111],["penzionisani.rs",112],["pink.rs",113],["planplus.rs",114],["pravda.rs",115],["prva.rs",116],["srbijajavlja.rs",120],["telegraf.rs",122],["telegraf.tv",122],["triangletv.rs",123],["tvprogram.rs",124],["tvsuper.rs",125],["vesti.rs",126],["vino.rs",127],["vojvodinainfo.rs",128],["gledajcrtace.xyz",129]]);

const entitiesMap = new Map(undefined);

const exceptionsMap = new Map(undefined);

self.specificImports = self.specificImports || [];
self.specificImports.push({ argsList, hostnamesMap, entitiesMap, exceptionsMap });

/******************************************************************************/

})();

/******************************************************************************/
