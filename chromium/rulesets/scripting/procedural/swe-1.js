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

/* jshint esversion:11 */

'use strict';

// ruleset: swe-1

/******************************************************************************/

// Important!
// Isolate from global scope
(function uBOL_cssProceduralImport() {

/******************************************************************************/

const argsList = [["{\"selector\":\".carousel-item-link\",\"tasks\":[[\"has-text\",\"Annons:\"]]}"],["{\"selector\":\":is(main > section a[data-test-tag=\\\"internal-link\\\"], #main > section a[data-test-tag=\\\"internal-link\\\"], main > aside a[data-test-tag=\\\"internal-link\\\"])\",\"tasks\":[[\"has-text\",\"innehåller annonslänkar\"]]}","{\"selector\":\"[data-ad-subtype]\",\"tasks\":[[\"upward\",1],[\"matches-css\",{\"name\":\"min-height\",\"value\":\"[0-9]+\"}]]}","{\"selector\":\"main > section > div:first-child\",\"tasks\":[[\"matches-css\",{\"name\":\"box-shadow\",\"value\":\"^rgba\\\\(0, 0, 0, 0\\\\.2\\\\) 0px 0px 24px 0px$\"}]]}"],["{\"selector\":\"section.elementor-section\",\"tasks\":[[\"has-text\",\"Huvudsponsorer & partners\"]]}"],["{\"selector\":\"article\",\"tasks\":[[\"matches-css\",{\"name\":\"content\",\"pseudo\":\"after\",\"value\":[\"Annonssamarbete\",\"i\"]}]]}","{\"selector\":\"div[class^=\\\"css-\\\"]\",\"tasks\":[[\"matches-css\",{\"name\":\"content\",\"value\":[\"Annons\",\"i\"]}],[\"upward\",\"article\"]]}"],["{\"selector\":\".block-title\",\"action\":[\"remove\",\"\"],\"tasks\":[[\"has-text\",\"Reklamsamarbete\"],[\"upward\",\".td_block_wrap\"],[\"spath\",\" + rs-module-wrap\"]]}","{\"selector\":\".block-title\",\"tasks\":[[\"has-text\",\"Reklamsamarbete\"],[\"upward\",\".td_block_wrap\"]]}","{\"selector\":\".td-adspot-title-span\",\"tasks\":[[\"upward\",1]]}","{\"selector\":\"a[href*=\\\"reklamsamarbete\\\"]\",\"tasks\":[[\"upward\",\".td_block_wrap\"]]}"],["{\"selector\":\"a.js_commercial-text--link-text\",\"action\":[\"remove\",\"\"],\"tasks\":[[\"upward\",\".jwplayer_video-videoArea\"]]}","{\"selector\":\"article.grid\",\"tasks\":[[\"has-text\",\"/annonssamarbete/i\"]]}","{\"selector\":\"div.wings-gray-200\",\"tasks\":[[\"has-text\",\"Annons\"]]}"],["{\"selector\":\".text-sm\",\"tasks\":[[\"has-text\",\"/annons/i\"],[\"upward\",\".border-b, a[target]\"]]}"],["{\"selector\":\".bottom-liner span\",\"tasks\":[[\"has-text\",\"Annons\"],[\"upward\",2]]}"],["{\"selector\":\".label\",\"tasks\":[[\"has-text\",\"/sponsrad/i\"],[\"upward\",\"a\"]]}"],["{\"selector\":\".slide-entry-excerpt\",\"tasks\":[[\"has-text\",\"/annons:/i\"],[\"upward\",\".avia-content-slider\"]]}"],["{\"selector\":\".post-item__tag\",\"tasks\":[[\"has-text\",\"/spons/i\"],[\"upward\",\"li.post-item\"]]}"],["{\"selector\":\".widget-title\",\"tasks\":[[\"has-text\",\"/spons/i\"],[\"upward\",\".widget_text\"]]}"],["{\"selector\":\"article.closed\",\"action\":[\"remove-class\",\"closed\"]}"],["{\"selector\":\".slick-slide\",\"tasks\":[[\"has-text\",\"/sponsra/i\"]]}"],["{\"selector\":\".adlabel\",\"tasks\":[[\"upward\",1]]}","{\"selector\":\".colorized\",\"tasks\":[[\"has-text\",\"/annons/i\"],[\"upward\",\"a\"]]}","{\"selector\":\".elevated-button\",\"tasks\":[[\"has-text\",\"/^Cookie/\"],[\"upward\",\".container\"]]}","{\"selector\":\".label\",\"tasks\":[[\"has-text\",\"/annons/i\"],[\"upward\",1]]}","{\"selector\":\".sponsored\",\"tasks\":[[\"upward\",\"a\"]]}","{\"selector\":\".sponsored-chip\",\"tasks\":[[\"matches-css\",{\"name\":\"display\",\"value\":\"^block$\"}],[\"upward\",\"a\"]]}","{\"selector\":\"img[src*=\\\"/borskollen_newsletter\\\"]\",\"tasks\":[[\"upward\",1]]}"],["{\"selector\":\".label\",\"tasks\":[[\"has-text\",\"/annons/i\"],[\"upward\",\".highlighted-article-block\"]]}"],["{\"selector\":\".article__properties-breadcrumbs span\",\"tasks\":[[\"has-text\",\"/Sponsrad|annons/i\"],[\"upward\",\".article\"]]}"],["{\"selector\":\"div[class*=\\\"section-preview\\\"]\",\"tasks\":[[\"has-text\",\"/betalt samarbete/i\"],[\"upward\",4]]}"],["{\"selector\":\"body > .elementor > .elementor-section:first-child\",\"tasks\":[[\"has-text\",\"Annons\"]]}"],["{\"selector\":\"a.click-track, img.click-track\",\"action\":[\"remove-class\",\"click-track\"]}","{\"selector\":\"a.click-track-attachment-preview, img.click-track-attachment-preview\",\"action\":[\"remove-class\",\"click-track-attachment-preview\"]}","{\"selector\":\"img[data-click-track]\",\"action\":[\"remove-attr\",\"data-click-track\"]}"],["{\"selector\":\"aside .textwidget\",\"tasks\":[[\"has-text\",\"/sponsr|samarbetspartners/i\"]]}"],["{\"selector\":\".post_sponsrad_label\",\"tasks\":[[\"upward\",1]]}"],["{\"selector\":\".post > div[style]\",\"tasks\":[[\"has-text\",\"ANNONS\"],[\"upward\",\"article:not([id])\"]]}"],["{\"selector\":\"small\",\"tasks\":[[\"has-text\",\"/annons/i\"],[\"upward\",\".elementor-column\"]]}"],["{\"selector\":\".text-xs\",\"tasks\":[[\"has-text\",\"ANNONS\"],[\"upward\",1]]}"],["{\"selector\":\".label\",\"action\":[\"remove\",\"\"],\"tasks\":[[\"has-text\",\"SPONSRAT\"],[\"upward\",\".swiper-slide\"]]}","{\"selector\":\".text-right\",\"tasks\":[[\"has-text\",\"ANNONS\"]]}","{\"selector\":\"a[href^=\\\"https://dagenstech.se/articles/\\\"]\",\"tasks\":[[\"upward\",1],[\"has-text\",\"SPONSRAT\"]]}"],["{\"selector\":\".slick-slide\",\"tasks\":[[\"has-text\",\"/casino/i\"]]}"],["{\"selector\":\".heading\",\"tasks\":[[\"has-text\",\"/samarbete/i\"],[\"upward\",\".elementor-widget-smartmag-featgrid\"]]}"],["{\"selector\":\"h3.h-custom-headline\",\"tasks\":[[\"has-text\",\"Advertorial\"],[\"upward\",1]]}"],["{\"selector\":\"div[data-losjs^=\\\"borka\\\"]\",\"tasks\":[[\"upward\",1]]}"],["{\"selector\":\".rightdiv p\",\"tasks\":[[\"has-text\",\"/casino|kasino|lån|betting|odds|lotto/i\"]]}"],["{\"selector\":\".widget-title\",\"tasks\":[[\"has-text\",\"/annons/i\"],[\"spath\",\" + .textwidget\"]]}","{\"selector\":\"body.unselectable\",\"action\":[\"remove-class\",\"unselectable\"]}"],["{\"selector\":\".label-sponsored\",\"action\":[\"remove\",\"\"],\"tasks\":[[\"upward\",\"#latest-slider a\"]]}"],["{\"selector\":\"video[data-auto-play]\",\"action\":[\"remove-attr\",\"data-auto-play\"]}"],["{\"selector\":\"html[data-impression-tracking-endpoint]\",\"action\":[\"remove-attr\",\"data-impression-tracking-endpoint\"]}"],["{\"selector\":\".aside-list--heading\",\"tasks\":[[\"has-text\",\"/^sponsra/i\"],[\"upward\",\".aside-list\"]]}","{\"selector\":\".code-block\",\"tasks\":[[\"has-text\",\"/annons/i\"]]}"],["{\"selector\":\"section.c-native_banner\",\"tasks\":[[\"upward\",2]]}"],["{\"selector\":\"p[style^=\\\"text-align: center;\\\"] em\",\"tasks\":[[\"has-text\",\"Annonser\"],[\"upward\",2]]}"],["{\"selector\":\".adaptive\",\"tasks\":[[\"upward\",1]]}"],["{\"selector\":\"article.elementor-grid-item\",\"tasks\":[[\"has-text\",\"reklamsamarbete\"]]}"],["{\"selector\":\":is(div[id^=\\\"everysport_pano\\\"], div[id^=\\\"everysport_mobil\\\"], div[id^=\\\"everysport_rektangel\\\"])\",\"tasks\":[[\"upward\",1]]}"],["{\"selector\":\"div.flowy-wp-protected-content\",\"action\":[\"remove-class\",\"flowy-wp-protected-content\"]}","{\"selector\":\"p.has-text-align-center\",\"tasks\":[[\"has-text\",\"Annons:\"]]}"],["{\"selector\":\".video-player[data-ad-config]\",\"action\":[\"remove-attr\",\"data-ad-config\"]}","{\"selector\":\"a[data-t-category]\",\"action\":[\"remove-attr\",\"data-t-category\"]}","{\"selector\":\"a[data-t-label]\",\"action\":[\"remove-attr\",\"data-t-label\"]}","{\"selector\":\"a[data-t-type]\",\"action\":[\"remove-attr\",\"data-t-type\"]}","{\"selector\":\"video[autoplay]\",\"action\":[\"remove-attr\",\"autoplay\"]}"],["{\"selector\":\"article\",\"tasks\":[[\"has-text\",\"/annons:/i\"]]}"],["{\"selector\":\"a[onclick^=\\\"plausible\\\"]\",\"action\":[\"remove-attr\",\"onclick\"]}"],["{\"selector\":\":is(a[target=\\\"_blank\\\"]:not([href^=\\\"/\\\"], [href*=\\\"filatelisten.se\\\"]))\",\"tasks\":[[\"upward\",\"section\"]]}"],["{\"selector\":\".news\",\"tasks\":[[\"has-text\",\"casino\"]]}","{\"selector\":\".postmeta em\",\"tasks\":[[\"has-text\",\"/sponsrad/i\"],[\"upward\",\".row.news\"]]}"],["{\"selector\":\".tdm-descr\",\"tasks\":[[\"has-text\",\"/casino/i\"]]}","{\"selector\":\"a.td-post-category[href*=\\\"/category/annons/\\\"]\",\"tasks\":[[\"upward\",\".td-category-pos-image\"]]}"],["{\"selector\":\".feat-cat\",\"tasks\":[[\"has-text\",\"/annons/i\"],[\"upward\",\"a\"]]}"],["{\"selector\":\"article.status-publish\",\"tasks\":[[\"has-text\",\"/annonssamarbete/i\"]]}"],["{\"selector\":\"a[href*=\\\"casino\\\"]\",\"tasks\":[[\"upward\",\"p\"]]}"],["{\"selector\":\".whitebox-container\",\"tasks\":[[\"has-text\",\"/sponsra/i\"]]}","{\"selector\":\":is(div[class*=\\\"vicky-whitebox\\\"], .vicky-category-label, .vicky-video-infobox-label, .vicky-post-headline-container__category__inner)\",\"tasks\":[[\"has-text\",\"/spons/i\"],[\"upward\",\"a, .carousel-caption, .featurette, article\"]]}"],["{\"selector\":\"body.tingle-enabled\",\"action\":[\"remove-class\",\"tingle-enabled\"]}"],["{\"selector\":\".ticker-title\",\"tasks\":[[\"has-text\",\"/partner/i\"],[\"spath\",\" + .mh-section\"]]}","{\"selector\":\".ticker-title\",\"tasks\":[[\"has-text\",\"/partner/i\"]]}","{\"selector\":\":is(.topwidget, .video-banner)\",\"action\":[\"remove\",\"\"]}"],["{\"selector\":\":is(.sponsored, .theme-news_sponsored_container)\",\"tasks\":[[\"upward\",\".theme-news\"]]}","{\"selector\":\"div[class$=\\\"sponsortitle\\\"]\",\"tasks\":[[\"upward\",\".desktop-side-widget\"]]}"],["{\"selector\":\"h2.fusion-responsive-typography-calculated\",\"tasks\":[[\"has-text\",\"Spel och dobbel\"],[\"spath\",\" ~ p\"]]}"],["{\"selector\":\".smallNewsCategory\",\"tasks\":[[\"has-text\",\"/sponsr/i\"],[\"upward\",\".smallNewsLink\"]]}","{\"selector\":\"img[src*=\\\"/images/annonser/\\\"]\",\"tasks\":[[\"upward\",1]]}"],["{\"selector\":\".category\",\"tasks\":[[\"has-text\",\"/spons/i\"],[\"upward\",\"article\"]]}"],["{\"selector\":\".mark\",\"tasks\":[[\"has-text\",\"/spons/i\"],[\"upward\",\".post\"]]}"],["{\"selector\":\".td-block-title-wrap\",\"tasks\":[[\"has-text\",\"/annons/i\"],[\"upward\",1]]}"],["{\"selector\":\".td-block-title > span\",\"tasks\":[[\"has-text\",\"/annonserat innehåll/i\"],[\"upward\",\".td_block_wrap\"]]}","{\"selector\":\".wp-block-column > h2\",\"tasks\":[[\"has-text\",\"/annonser/i\"],[\"spath\",\" ~ p\"]]}"],["{\"selector\":\".fp-carousel .fpci-kicker\",\"tasks\":[[\"has-text\",\"/^sponsr/i\"],[\"upward\",\".fpc-item\"]]}"],["{\"selector\":\".ad_interscroller\",\"tasks\":[[\"upward\",\".wrapper\"]]}","{\"selector\":\".colHomePlayer:has([data-slotads=\\\"videoad\\\"])\",\"action\":[\"remove\",\"\"]}","{\"selector\":\"video[data-autoplay]\",\"action\":[\"remove-attr\",\"data-autoplay\"]}"],["{\"selector\":\"article\",\"tasks\":[[\"has-text\",\"/är en annons/i\"]]}"],["{\"selector\":\":is(p[class^=\\\"teasersmall-sectionLabel\\\"], p[class^=\\\"teasermedium-sectionLabel\\\"])\",\"tasks\":[[\"has-text\",\"/annons/i\"],[\"upward\",\"a.internal-link, li\"]]}"],["{\"selector\":\"div.g:has(a[href*=\\\".com.se/\\\"])\",\"tasks\":[[\"has-text\",\"/återförsäljare|rea|garanti|lågt pris|nöjd|priser|shop|bra pris|kläder|skor|outlet|frakt|butik|betala|kundkorg|varukorg/i\"]]}"],["{\"selector\":\".sponsored-notification\",\"tasks\":[[\"upward\",\"[id^=\\\"post-\\\"]\"]]}"],["{\"selector\":\"a[href*=\\\"casino\\\"]\",\"tasks\":[[\"upward\",1]]}"],["{\"selector\":\"a[href*=\\\"/category/sponsrat/\\\"]\",\"tasks\":[[\"upward\",\"li[class=\\\"\\\"]\"]]}"],["{\"selector\":\"p[style^=\\\"text-transform\\\"]\",\"tasks\":[[\"has-text\",\"/annons/i\"],[\"spath\",\" + .wp-block-kadence-posts\"]]}","{\"selector\":\"p[style^=\\\"text-transform\\\"]\",\"tasks\":[[\"has-text\",\"/annons/i\"]]}"],["{\"selector\":\":is(div[class^=\\\"u-text\\\"], .u-font-brand)\",\"tasks\":[[\"has-text\",\"/^Reklam$/\"],[\"upward\",\"section\"]]}"],["{\"selector\":\"article[class^=\\\"ArticleCard\\\"]\",\"tasks\":[[\"has-text\",\"/sponsrad/i\"]]}","{\"selector\":\"div[class^=\\\"ArticleCard_\\\"] small\",\"tasks\":[[\"has-text\",\"/sponsrad/i\"],[\"upward\",\"article, li, a\"]]}","{\"selector\":\"span[class^=\\\"ArticleContent_articleDateBox\\\"]\",\"tasks\":[[\"has-text\",\"/annons från/i\"],[\"upward\",\"div[class^=\\\"ArticleContent_articlePage\\\"]\"]]}"],["{\"selector\":\":is(.main-article-container, section > div.flex.items-center.gap-4)\",\"tasks\":[[\"has-text\",\"/Sponsrad Artikel/i\"]]}"],["{\"selector\":\"div[id^=\\\"hitta_mobile_\\\"].placeholder\",\"tasks\":[[\"upward\",\"div[class^=\\\"height\\\"], div[class^=\\\"style_breakout\\\"]\"]]}"],["{\"selector\":\".vc_row_inner\",\"tasks\":[[\"has-text\",\"casino\"]]}"],["{\"selector\":\"body.modal-open\",\"action\":[\"remove-class\",\"modal-open\"]}"],["{\"selector\":\".bg-white:has(iframe[allow*=\\\"autoplay\\\"])\",\"action\":[\"remove\",\"\"]}"],["{\"selector\":\"small\",\"tasks\":[[\"has-text\",\"/annons/i\"]]}"],["{\"selector\":\".articleintroduction strong\",\"tasks\":[[\"has-text\",\"/samarbete/i\"],[\"upward\",\"li.item\"]]}"],["{\"selector\":\":is(a[href*=\\\"casino\\\"], a[href*=\\\"speltips\\\"])\",\"tasks\":[[\"upward\",\".widget\"]]}"],["{\"selector\":\".nyhetsochreseartiklar .views-row\",\"tasks\":[[\"has-text\",\"/casino/i\"]]}"],["{\"selector\":\"body.advert-take-over-active\",\"action\":[\"remove-class\",\"advert-take-over-active\"]}"],["{\"selector\":\".article\",\"tasks\":[[\"has-text\",\"/sponsrad artikel/i\"]]}"],["{\"selector\":\".widget-title\",\"tasks\":[[\"has-text\",\"/annons/i\"],[\"upward\",\"aside\"]]}"],["{\"selector\":\".et_pb_module\",\"tasks\":[[\"matches-css\",{\"name\":\"content\",\"pseudo\":\"before\",\"value\":\"^\\\"Annons:\\\"$\"}]]}"],["{\"selector\":\"div[id^=\\\"ad-panorama\\\"]\",\"tasks\":[[\"upward\",\".elementor-section\"]]}"],["{\"selector\":\".elementor-heading-title\",\"tasks\":[[\"has-text\",\"/annons/i\"],[\"upward\",\".elementor-column\"]]}"],["{\"selector\":\".annons-label\",\"tasks\":[[\"upward\",\"a\"]]}"],["{\"selector\":\".sidebar-block\",\"tasks\":[[\"has-text\",\"/annons|sponsor/i\"]]}"],["{\"selector\":\":is(a[href*=\\\"casino\\\"], a[href*=\\\"kasino\\\"], a[href*=\\\"passagen.se\\\"])\",\"tasks\":[[\"upward\",\"p\"]]}"],["{\"selector\":\".card-partner\",\"tasks\":[[\"upward\",1]]}"],["{\"selector\":\"body.mega-loading\",\"action\":[\"remove-class\",\"mega-loading\"]}"],["{\"selector\":\".cookieBarWrapper\",\"action\":[\"remove\",\"\"]}"],["{\"selector\":\"iframe[allow]\",\"action\":[\"remove-attr\",\"allow\"]}"],["{\"selector\":\".postCard\",\"tasks\":[[\"has-text\",\"/bonusar|casino|betting|spelbranschen|spelupplevelse/i\"]]}"],["{\"selector\":\":is(a[href*=\\\"casino\\\"], a[href*=\\\"betting\\\"], a[href*=\\\"poker\\\"])\",\"tasks\":[[\"upward\",\".elementor-widget\"]]}","{\"selector\":\"article.feed-item\",\"tasks\":[[\"has-text\",\"/låna pengar|casino|betting/i\"]]}"],["{\"selector\":\".fusion-post-content-container\",\"tasks\":[[\"has-text\",\"/^annons/i\"],[\"upward\",\"article\"]]}"],["{\"selector\":\"[id^=\\\"adPlacement\\\"]\",\"tasks\":[[\"upward\",1]]}"],["{\"selector\":\"body.private\",\"action\":[\"remove-class\",\"private\"]}"],["{\"selector\":\":is(img[src$=\\\"a_top.png.webp\\\"], a[href*=\\\"casino\\\"])\",\"tasks\":[[\"upward\",\"section.elementor-section\"]]}"],["{\"selector\":\"a[href=\\\"https://loppi.se/promotion\\\"]\",\"tasks\":[[\"upward\",\".page__section\"]]}"],["{\"selector\":\".special_ad_video\",\"action\":[\"remove\",\"\"]}"],["{\"selector\":\".widget_media_image\",\"tasks\":[[\"has-text\",\"/annons/i\"]]}"],["{\"selector\":\".elementor-widget-heading\",\"tasks\":[[\"has-text\",\"/Sponsra|annons/i\"],[\"spath\",\" + .elementor-widget-post-block\"]]}","{\"selector\":\".elementor-widget-heading\",\"tasks\":[[\"has-text\",\"/Sponsra|annons/i\"]]}"],["{\"selector\":\"div.with-ads\",\"action\":[\"remove-class\",\"with-ads\"]}"],["{\"selector\":\"#ad-panorama-category\",\"tasks\":[[\"upward\",1]]}"],["{\"selector\":\"noscript\",\"action\":[\"remove\",\"\"],\"tasks\":[[\"has-text\",\"mdp-deblocker-js-disabled\"]]}","{\"selector\":\"style\",\"action\":[\"remove\",\"\"],\"tasks\":[[\"has-text\",\"body * :not\"]]}"],["{\"selector\":\".bannergroup\",\"tasks\":[[\"upward\",\".uk-panel-box\"]]}"],["{\"selector\":\".advert\",\"action\":[\"remove\",\"\"],\"tasks\":[[\"upward\",\".slick-item\"]]}"],["{\"selector\":\"p.has-text-align-center\",\"tasks\":[[\"has-text\",\"/i samarbete med/i\"],[\"upward\",\".post\"]]}"],["{\"selector\":\".excerpt\",\"tasks\":[[\"has-text\",\"/annons/i\"],[\"upward\",\"article\"]]}","{\"selector\":\".sidebar-widget h3\",\"tasks\":[[\"has-text\",\"/annons/i\"],[\"upward\",\".sidebar-widget\"]]}"],["{\"selector\":\".inner_article\",\"tasks\":[[\"has-text\",\"/sponsrat|annons/i\"]]}","{\"selector\":\"div[itemprop=\\\"articleBody\\\"] div\",\"tasks\":[[\"has-text\",\"ANNONS:\"]]}"],["{\"selector\":\".textwidget\",\"tasks\":[[\"has-text\",\"Annons\"]]}"],["{\"selector\":\".list-article__item-inscription\",\"tasks\":[[\"has-text\",\"/sponsrat innehåll/i\"],[\"upward\",\".list-article__item\"]]}"],["{\"selector\":\"#nativendo-mainfeed\",\"action\":[\"remove\",\"\"],\"tasks\":[[\"upward\",1]]}"],["{\"selector\":\"span:not(.post-content)\",\"tasks\":[[\"has-text\",\"/annons/i\"],[\"upward\",\".post\"]]}"],["{\"selector\":\".site-main > div.widget_custom_html p[style^=\\\"text-align: center;\\\"]\",\"tasks\":[[\"has-text\",\"/annonssamarbete/i\"],[\"upward\",\"div.widget_custom_html\"]]}"],["{\"selector\":\".jet-listing-grid__item[data-post-id]\",\"tasks\":[[\"has-text\",\"/sponsrad artikel/i\"]]}"],["{\"selector\":\"article.post\",\"tasks\":[[\"has-text\",\"/annons från/i\"]]}"],["{\"selector\":\"article.teaser h2.fsize-24\",\"tasks\":[[\"has-text\",\"/casino/i\"],[\"upward\",\".teaser\"]]}"],["{\"selector\":\":is(.adsbygoogle, a[href*=\\\"casino\\\"])\",\"tasks\":[[\"upward\",\".elementor-section\"]]}"],["{\"selector\":\".vignette.XLText :is(a[href*=\\\"/externa-tjanster\\\"], a[href*=\\\"promoted\\\"])\",\"tasks\":[[\"upward\",\".section\"]]}"],["{\"selector\":\".item-list__item\",\"tasks\":[[\"has-text\",\"/annons från/i\"]]}"],["{\"selector\":\"body[data-scroll-locked=\\\"1\\\"]\",\"action\":[\"remove-attr\",\"data-scroll-locked\"]}"],["{\"selector\":\".td_block_wrap\",\"tasks\":[[\"has-text\",\"Annons\"]]}","{\"selector\":\".tds-locked-content[hidden]\",\"action\":[\"remove-attr\",\"hidden\"]}"],["{\"selector\":\".category-tag\",\"tasks\":[[\"has-text\",\"/annons/i\"],[\"upward\",\".ArticleListItem\"]]}"],["{\"selector\":\"a[target=\\\"_blank\\\"]\",\"tasks\":[[\"upward\",2]]}"],["{\"selector\":\"a[target=\\\"_blank\\\"][rel=\\\"nofollow\\\"]\",\"tasks\":[[\"upward\",1]]}"],["{\"selector\":\".sidebar-widget > .textwidget strong\",\"tasks\":[[\"has-text\",\"casino\"],[\"upward\",\"li.sidebar-widget\"]]}"],["{\"selector\":\":is(.sjofa-top-takeover, .sjofa-artikel-pano)\",\"tasks\":[[\"upward\",\"section\"]]}"],["{\"selector\":\".view-header > h3\",\"tasks\":[[\"has-text\",\"/annonser/i\"],[\"upward\",\".view-nya-lankar-front\"]]}"],["{\"selector\":\"a[href*=\\\"casino\\\"]\",\"tasks\":[[\"upward\",\".mh-posts-stacked-wrap\"]]}","{\"selector\":\"li.mh-slider-item:has(a[href*=\\\"casino\\\"])\",\"action\":[\"remove\",\"\"]}"],["{\"selector\":\".container\",\"tasks\":[[\"has-text\",\"Senaste nyheterna om spelbolag:\"]]}","{\"selector\":\"div.section-body-plus\",\"tasks\":[[\"has-text\",\"/bonus|casino/i\"]]}"],["{\"selector\":\"body.freeze-scroll\",\"action\":[\"remove-class\",\"freeze-scroll\"]}"],["{\"selector\":\".label-sponsor\",\"tasks\":[[\"upward\",\".panel\"]]}"],["{\"selector\":\"iframe[srcdoc*=\\\"ad_div\\\"]\",\"tasks\":[[\"upward\",1]]}"],["{\"selector\":\"legend\",\"tasks\":[[\"has-text\",\"Annons\"]]}"],["{\"selector\":\"div[consent-skip-blocker]\",\"action\":[\"remove\",\"\"]}"],["{\"selector\":\".cd-card-bar\",\"tasks\":[[\"has-text\",\"/annons/i\"],[\"upward\",\".cd-sidebar-item, .cd-news-card\"]]}"],["{\"selector\":\".bbSize\",\"tasks\":[[\"has-text\",\"Sponsormeddelande\"],[\"upward\",\".bbRelatedBox\"]]}","{\"selector\":\"div[class^=\\\"card-info\\\"]\",\"tasks\":[[\"has-text\",\"/spons/i\"],[\"upward\",\".card\"]]}"],["{\"selector\":\".mostReadMobile\",\"tasks\":[[\"has-text\",\"/annons/i\"]]}","{\"selector\":\"a[target=\\\"_blank\\\"]\",\"action\":[\"remove\",\"\"],\"tasks\":[[\"upward\",\"li.Notice\"]]}"],["{\"selector\":\".label\",\"tasks\":[[\"has-text\",\"/samarbete|annons|reklam|presenteras av/i\"],[\"upward\",\"a\"]]}","{\"selector\":\"[onclick^=\\\"ga(\\\"]\",\"action\":[\"remove-attr\",\"onclick\"]}"],["{\"selector\":\".pill\",\"tasks\":[[\"has-text\",\"/spons/i\"],[\"upward\",\".grid-item, .pinned, .articleFlow-item\"]]}"],["{\"selector\":\".holidAds\",\"tasks\":[[\"upward\",1]]}"],["{\"selector\":\".ra-widget-article-tag\",\"tasks\":[[\"has-text\",\"/partner/i\"],[\"upward\",\".ra-widget-panel\"]]}"],["{\"selector\":\"p.uppercase\",\"tasks\":[[\"has-text\",\"/i annonssamarbete med/i\"],[\"upward\",\".flex.overflow-hidden\"]]}"],["{\"selector\":\"html.sv-no-touch\",\"action\":[\"remove-class\",\"sv-no-touch\"]}"],["{\"selector\":\"body.cli-barmodal-open\",\"action\":[\"remove-class\",\"cli-barmodal-open\"]}"],["{\"selector\":\"h2.elementor-heading-title\",\"tasks\":[[\"has-text\",\"/annons/i\"],[\"upward\",\".e-con-boxed[data-settings^=\\\"{\\\\\\\"background\\\"]\"]]}"],["{\"selector\":\"[class*=\\\"tot-content-preview-container\\\"]:has(a[href*=\\\"casino\\\"], a[href*=\\\"kasino\\\"], a[href*=\\\"betting\\\"], a[href*=\\\"spel\\\"])\",\"action\":[\"remove\",\"\"]}"],["{\"selector\":\"div.text-\\\\[8px\\\\].text-center\",\"tasks\":[[\"has-text\",\"ANNONS\"],[\"upward\",1]]}"],["{\"selector\":\"#root div[id]:not([id^=\\\"checkout\\\"]):empty\",\"tasks\":[[\"upward\",2]]}"],["{\"selector\":\"main div[id]:not([id^=\\\"checkout\\\"]):empty\",\"tasks\":[[\"upward\",2]]}"],["{\"selector\":\"a[href=\\\"\\\"].uppercase\",\"tasks\":[[\"has-text\",\"REKLAM\"],[\"upward\",\".popular-post\"]]}"],["{\"selector\":\"a[target=\\\"_blank\\\"] button[aria-labelledby] span\",\"tasks\":[[\"has-text\",\"/Sponsrat av|i samarbete med/i\"],[\"upward\",\"a\"]]}"],["{\"selector\":\"#tv-schedule section\",\"tasks\":[[\"has-text\",\"ANNONS\"]]}","{\"selector\":\"body.takeover-loading\",\"action\":[\"remove-class\",\"takeover-loading\"]}"],["{\"selector\":\".jet-listing-dynamic-field__content\",\"tasks\":[[\"has-text\",\"/annonssamarbete|reklamsamarbete/i\"],[\"upward\",\".jet-listing-grid__item\"]]}"],["{\"selector\":\".betart-marker\",\"tasks\":[[\"matches-css\",{\"name\":\"content\",\"pseudo\":\"after\",\"value\":[\"Annons\",\"i\"]}],[\"upward\",\".documentpush-group\"]]}"],["{\"selector\":\"html.has-intro-popup\",\"action\":[\"remove-class\",\"has-intro-popup\"]}","{\"selector\":\"html.show-intro-popup\",\"action\":[\"remove-class\",\"show-intro-popup\"]}"],["{\"selector\":\"a[target]\",\"tasks\":[[\"upward\",\".frontlinks tr\"]]}"],["{\"selector\":\"a[href*=\\\"/casino\\\"]\",\"tasks\":[[\"upward\",\".wp-block-image\"]]}"],["{\"selector\":\".g-single\",\"tasks\":[[\"upward\",\"section[data-settings*=\\\"background_background\\\"]\"]]}"],["{\"selector\":\".td-block-title span\",\"tasks\":[[\"has-text\",\"/sponsr/i\"],[\"upward\",3]]}"],["{\"selector\":\"button\",\"action\":[\"remove\",\"\"],\"tasks\":[[\"has-text\",\"/annons/i\"],[\"upward\",\".owl-item\"]]}"],["{\"selector\":\".leftinfo\",\"tasks\":[[\"has-text\",\"/Externa artiklar:|Länktips:/\"]]}"],["{\"selector\":\".sidebox\",\"tasks\":[[\"has-text\",\"/Externa länkar|Artiklar/\"]]}"],["{\"selector\":\".fusion-text\",\"tasks\":[[\"has-text\",\"Online casino\"]]}"],["{\"selector\":\".card-header\",\"tasks\":[[\"has-text\",\"Annons\"],[\"upward\",\".card\"]]}"],["{\"selector\":\"span.arialtext11[style^=\\\"float:left\\\"]\",\"tasks\":[[\"has-text\",\"/^i samarbete med/i\"],[\"upward\",2]]}"],["{\"selector\":\"span[id^=\\\"ezoic-pub-ad\\\"]\",\"tasks\":[[\"upward\",\".row\"]]}"]];

const hostnamesMap = new Map([["99.teknikveckan.se",0],["aftonbladet.se",1],["aktieskolan.se",2],["aktuellhallbarhet.se",3],["byggindustrin.se",3],["dagensmedia.se",3],["dagensmedicin.se",3],["fastighetsnytt.se",3],["resume.se",3],["dagenssamhalle.se",3],["market.se",3],["dagligvarunytt.se",3],["privataaffarer.se",3],["aktuellsakerhet.se",4],["allas.se",5],["elle.se",[5,36]],["femina.se",5],["hant.se",5],["mabra.com",5],["residencemagazine.se",5],["svenskdam.se",5],["motherhood.se",5],["arbetaren.se",6],["aurumforum.se",7],["autonytt.se",8],["bandyfeber.com",9],["baraenkakatill.se",10],["bilresaieuropa.se",11],["bioenergitidningen.se",12],["kvalitetsmagasinet.se",12],["miljo-utveckling.se",12],["telekomidag.se",12],["vdtidningen.se",12],["boneo.se",13],["borskollen.se",14],["borsvarlden.com",15],["branschaktuellt.se",16],["bulletin.nu",17],["butikstrender.se",18],["byggahus.se",19],["byggipedia.se",20],["campingsverige.se",21],["conpot.se",22],["dagenslogistik.se",23],["dagensps.se",24],["news55.se",24],["realtid.se",24],["dagenstech.se",25],["dagenstv.com",26],["datormagazin.se",27],["densistavilan.se",28],["devote.se",29],["digitalavykort.se",30],["discoveringtheplanet.com",31],["djungeltrumman.se",32],["dn.se",33],["di.se",33],["dust2.se",34],["ehandel.se",35],["esportare.se",37],["etc.se",38],["evergreengarden.se",39],["everysport.com",40],["expo.se",41],["expressen.se",42],["familjeliv.se",43],["feber.se",44],["tjock.se",44],["filatelisten.se",45],["filmtipset.se",46],["finanstid.se",47],["firstclassmagazine.se",48],["firstfoto.se",49],["fl-net.se",50],["foretagsverige.se",51],["forskningsverige.se",51],["motorbibeln.se",51],["hallbarhetsverige.se",51],["tillvaxtsverige.se",51],["grillbibeln.se",51],["kampenmotcancer.se",51],["folkhalsasverige.se",51],["forstasidorna.se",52],["forvaltarforum.se",53],["fotbollskanalen.se",54],["fotbollsresultat.com",55],["fotbolltransfers.com",56],["fragbite.se",57],["freeride.se",58],["frihetsnytt.se",59],["futsalmagasinet.se",60],["fz.se",61],["gamereactor.se",62],["gasetten.se",63],["fotbollsthlm.se",63],["godare.se",[64,97]],["google.se",65],["gynning.net",66],["happypancake.se",67],["happyride.se",68],["hejaolika.se",69],["hejauppsala.com",70],["hemnet.se",71],["hippson.se",72],["hitta.se",73],["hockeybladet.nu",74],["hockeymagasinet.com",75],["hockeynews.se",76],["horisontmagasin.se",77],["husvagn.se",78],["husbil.se",78],["ibnytt.se",79],["indien.nu",80],["ingenjorsjobb.se",81],["inredningsarkitektur.se",82],["it-finans.se",83],["it-halsa.se",83],["it-kanalen.se",83],["it-pedagogen.se",83],["it-retail.se",83],["it-hallbarhet.se",83],["jarnvagar.nu",84],["javligtgott.se",85],["karlskogavaxer.se",86],["karriarlakare.se",87],["kiacarclub.se",88],["killsteal.se",89],["kingmagazine.se",90],["klart.se",91],["kokaihop.se",92],["kritiker.se",93],["lajvo.se",94],["listor.se",95],["livinguppsala.se",96],["livsstil.se",97],["ljuskultur.se",98],["lokalti.se",99],["loppi.se",100],["magazin24.se",101],["maltermagasin.se",102],["nyadagbladet.se",[102,116]],["marknadschefer.se",103],["matinspo.se",104],["matspar.se",105],["medibok.se",106],["metalcentral.net",107],["metromode.se",108],["minimalisterna.se",109],["modernalivet.se",110],["moviezine.se",111],["mygatemagazine.se",112],["naringslivetvgl.se",113],["dalarnasaffarer.se",113],["stockholmsaffarer.se",113],["jamtlandsaffarer.se",113],["hallandsnaringsliv.se",113],["sjuharadsnaringsliv.se",113],["ng.se",114],["nordfront.se",115],["nyemissioner.se",117],["nyfiknainvesterare.se",118],["nyheteridag.se",119],["oskarshamns-nytt.se",120],["placera.se",121],["podtail.se",122],["qasa.se",123],["samfalligheterna.se",124],["shortcut.se",125],["siljannews.se",126],["siljanskok.se",127],["sillyseason.se",128],["sjofart.ax",129],["so-rummet.se",130],["spelochfilm.se",131],["sportbloggare.com",132],["storyhouseegmont.se",133],["svampguiden.com",134],["svenskafans.com",135],["svenskamagasinet.nu",136],["svenskbyggmarknad.se",137],["sverigespringer.se",138],["sweclockers.com",139],["swedroid.se",140],["tekniknytt.se",141],["teknikveckan.se",142],["temperatur.nu",143],["thelocal.se",144],["tidningenbalans.se",145],["tidningencurie.se",146],["tidningenridsport.se",147],["tlnt.se",148],["totallyorebro.se",149],["totallystockholm.se",149],["travnet.se",150],["travrondenspel.se",151],["travronden.se",152],["trendenser.se",153],["tripadvisor.se",154],["tv.nu",155],["underbaraclaras.se",156],["utsidan.se",157],["vadvivet.se",158],["varmepumpsforum.com",159],["veckorevyn.com",160],["vildmarken.se",161],["villalivet.se",162],["vimedbarn.se",163],["viseniorer.se",164],["vmj.se",165],["vm-fotboll.se",166],["voodoofilm.org",167],["vovve.net",168],["xn--gtboken-exa.se",169]]);

const entitiesMap = new Map(undefined);

const exceptionsMap = new Map(undefined);

self.proceduralImports = self.proceduralImports || [];
self.proceduralImports.push({ argsList, hostnamesMap, entitiesMap, exceptionsMap });

/******************************************************************************/

})();

/******************************************************************************/
