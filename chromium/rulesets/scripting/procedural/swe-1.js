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

// ruleset: swe-1

// Important!
// Isolate from global scope
(function uBOL_cssProceduralImport() {

/******************************************************************************/

const argsList = ["",["{\"selector\":\".carousel-item-link\",\"tasks\":[[\"has-text\",\"Annons:\"]]}"],["{\"selector\":\":is(main > section a[data-test-tag=\\\"internal-link\\\"], #main > section a[data-test-tag=\\\"internal-link\\\"], main > section a[href*=\\\"godare.se\\\"], #main > section a[href*=\\\"godare.se\\\"], main > section a[href*=\\\"livsstil.se\\\"], #main > section a[href*=\\\"livsstil.se\\\"], main > aside a[data-test-tag=\\\"internal-link\\\"])\",\"tasks\":[[\"has-text\",\"innehåller annonslänkar\"]]}","{\"selector\":\"[data-ad-subtype]\",\"tasks\":[[\"upward\",1],[\"matches-css\",{\"name\":\"min-height\",\"value\":\"[0-9]+\"}]]}","{\"selector\":\"main > section > div:first-child\",\"tasks\":[[\"matches-css\",{\"name\":\"box-shadow\",\"value\":\"^rgba\\\\(0, 0, 0, 0\\\\.2\\\\) 0px 0px 24px 0px$\"}]]}"],["{\"selector\":\"section.elementor-section\",\"tasks\":[[\"has-text\",\"Huvudsponsorer & partners\"]]}"],["{\"selector\":\".block-title\",\"action\":[\"remove\",\"\"],\"tasks\":[[\"has-text\",\"Reklamsamarbete\"],[\"upward\",\".td_block_wrap\"],[\"spath\",\" + rs-module-wrap\"]]}","{\"selector\":\".block-title\",\"tasks\":[[\"has-text\",\"Reklamsamarbete\"],[\"upward\",\".td_block_wrap\"]]}","{\"selector\":\".td-adspot-title-span\",\"tasks\":[[\"upward\",1]]}","{\"selector\":\"a[href*=\\\"reklamsamarbete\\\"]\",\"tasks\":[[\"upward\",\".td_block_wrap\"]]}"],["{\"selector\":\"a.js_commercial-text--link-text\",\"action\":[\"remove\",\"\"],\"tasks\":[[\"upward\",\".jwplayer_video-videoArea\"]]}","{\"selector\":\"article.grid\",\"tasks\":[[\"has-text\",\"/annonssamarbete/i\"]]}","{\"selector\":\"div.wings-gray-200\",\"tasks\":[[\"has-text\",\"Annons\"]]}"],["{\"selector\":\"article p.uppercase.tracking-wide\",\"tasks\":[[\"has-text\",\"Inlägget innehåller annonslänkar\"],[\"upward\",\"article\"]]}"],["{\"selector\":\".text-sm\",\"tasks\":[[\"has-text\",\"/annons/i\"],[\"upward\",\".border-b, a[target]\"]]}"],["{\"selector\":\".bottom-liner span\",\"tasks\":[[\"has-text\",\"Annons\"],[\"upward\",2]]}"],["{\"selector\":\".label\",\"tasks\":[[\"has-text\",\"/sponsrad/i\"],[\"upward\",\"a\"]]}"],["{\"selector\":\".slide-entry-excerpt\",\"tasks\":[[\"has-text\",\"/annons:/i\"],[\"upward\",\".avia-content-slider\"]]}"],["{\"selector\":\".post-item__tag\",\"tasks\":[[\"has-text\",\"/spons/i\"],[\"upward\",\"li.post-item\"]]}"],["{\"selector\":\".widget-title\",\"tasks\":[[\"has-text\",\"/spons/i\"],[\"upward\",\".widget_text\"]]}"],["{\"selector\":\"article.closed\",\"action\":[\"remove-class\",\"closed\"]}"],["{\"selector\":\".slick-slide\",\"tasks\":[[\"has-text\",\"/sponsra/i\"]]}"],["{\"selector\":\".search-page__content .tag\",\"tasks\":[[\"has-text\",\"Sponsrad\"],[\"upward\",\"li\"]]}"],["{\"selector\":\".adlabel\",\"tasks\":[[\"upward\",1]]}","{\"selector\":\".colorized\",\"tasks\":[[\"has-text\",\"/annons/i\"],[\"upward\",\"a\"]]}","{\"selector\":\".elevated-button\",\"tasks\":[[\"has-text\",\"/^Cookie/\"],[\"upward\",\".container\"]]}","{\"selector\":\".label\",\"tasks\":[[\"has-text\",\"/annons/i\"],[\"upward\",1]]}","{\"selector\":\".sponsored\",\"tasks\":[[\"upward\",\"a\"]]}","{\"selector\":\".sponsored-chip\",\"tasks\":[[\"matches-css\",{\"name\":\"display\",\"value\":\"^block$\"}],[\"upward\",\"a\"]]}","{\"selector\":\"img[src*=\\\"/borskollen_newsletter\\\"]\",\"tasks\":[[\"upward\",1]]}"],["{\"selector\":\".label\",\"tasks\":[[\"has-text\",\"/annons/i\"],[\"upward\",\".highlighted-article-block\"]]}"],["{\"selector\":\".article__properties-breadcrumbs span\",\"tasks\":[[\"has-text\",\"/Sponsrad|annons/i\"],[\"upward\",\".article\"]]}"],["{\"selector\":\"div[class*=\\\"section-preview\\\"]\",\"tasks\":[[\"has-text\",\"/betalt samarbete/i\"],[\"upward\",4]]}"],["{\"selector\":\".carousel-item:has(.sponsored)\",\"action\":[\"remove\",\"\"]}"],["{\"selector\":\"body > .elementor > .elementor-section:first-child\",\"tasks\":[[\"has-text\",\"Annons\"]]}"],["{\"selector\":\"a.click-track, img.click-track\",\"action\":[\"remove-class\",\"click-track\"]}","{\"selector\":\"a.click-track-attachment-preview, img.click-track-attachment-preview\",\"action\":[\"remove-class\",\"click-track-attachment-preview\"]}","{\"selector\":\"img[data-click-track]\",\"action\":[\"remove-attr\",\"data-click-track\"]}"],["{\"selector\":\"aside .textwidget\",\"tasks\":[[\"has-text\",\"/sponsr|samarbetspartners/i\"]]}"],["{\"selector\":\".post_sponsrad_label\",\"tasks\":[[\"upward\",1]]}"],["{\"selector\":\".post > div[style]\",\"tasks\":[[\"has-text\",\"ANNONS\"],[\"upward\",\"article:not([id])\"]]}"],["{\"selector\":\"small\",\"tasks\":[[\"has-text\",\"/annons/i\"],[\"upward\",\".elementor-column\"]]}"],["{\"selector\":\":is(.text-xs, sub)\",\"tasks\":[[\"has-text\",\"ANNONS\"],[\"upward\",1]]}","{\"selector\":\"sub\",\"tasks\":[[\"has-text\",\"ANNONS\"],[\"upward\",\"p\"],[\"spath\",\" + script + iframe + p\"]]}"],["{\"selector\":\".label\",\"action\":[\"remove\",\"\"],\"tasks\":[[\"has-text\",\"SPONSRAT\"],[\"upward\",\".swiper-slide\"]]}","{\"selector\":\".text-right\",\"tasks\":[[\"has-text\",\"ANNONS\"]]}","{\"selector\":\"a[href^=\\\"https://dagenstech.se/articles/\\\"]\",\"tasks\":[[\"upward\",1],[\"has-text\",\"SPONSRAT\"]]}"],["{\"selector\":\".slick-slide\",\"tasks\":[[\"has-text\",\"/casino/i\"]]}"],["{\"selector\":\".single-post .content h5\",\"tasks\":[[\"has-text\",\"ANNONSSAMARBETE\"],[\"upward\",\"a.single-post\"]]}"],["{\"selector\":\".heading\",\"tasks\":[[\"has-text\",\"/samarbete/i\"],[\"upward\",\".elementor-widget-smartmag-featgrid\"]]}"],["{\"selector\":\"h3.h-custom-headline\",\"tasks\":[[\"has-text\",\"Advertorial\"],[\"upward\",1]]}"],["{\"selector\":\".rightdiv p\",\"tasks\":[[\"has-text\",\"/casino|kasino|lån|betting|odds|lotto/i\"]]}"],["{\"selector\":\".widget-title\",\"tasks\":[[\"has-text\",\"/annons/i\"],[\"spath\",\" + .textwidget\"]]}","{\"selector\":\"body.unselectable\",\"action\":[\"remove-class\",\"unselectable\"]}"],["{\"selector\":\".label-sponsored\",\"action\":[\"remove\",\"\"],\"tasks\":[[\"upward\",\"#latest-slider a\"]]}"],["{\"selector\":\"video[data-auto-play]\",\"action\":[\"remove-attr\",\"data-auto-play\"]}"],["{\"selector\":\"html[data-impression-tracking-endpoint]\",\"action\":[\"remove-attr\",\"data-impression-tracking-endpoint\"]}"],["{\"selector\":\".aside-list--heading\",\"tasks\":[[\"has-text\",\"/^sponsra/i\"],[\"upward\",\".aside-list\"]]}","{\"selector\":\".code-block\",\"tasks\":[[\"has-text\",\"/annons/i\"]]}"],["{\"selector\":\"section.c-native_banner\",\"tasks\":[[\"upward\",2]]}"],["{\"selector\":\"p[style^=\\\"text-align: center;\\\"] em\",\"tasks\":[[\"has-text\",\"Annonser\"],[\"upward\",2]]}"],["{\"selector\":\"article.elementor-grid-item\",\"tasks\":[[\"has-text\",\"reklamsamarbete\"]]}"],["{\"selector\":\":is(div[id^=\\\"everysport_pano\\\"], div[id^=\\\"everysport_mobil\\\"], div[id^=\\\"everysport_rektangel\\\"])\",\"tasks\":[[\"upward\",1]]}"],["{\"selector\":\"div.flowy-wp-protected-content\",\"action\":[\"remove-class\",\"flowy-wp-protected-content\"]}","{\"selector\":\"p.has-text-align-center\",\"tasks\":[[\"has-text\",\"Annons:\"]]}"],["{\"selector\":\".video-player[data-ad-config]\",\"action\":[\"remove-attr\",\"data-ad-config\"]}","{\"selector\":\"a[data-t-category]\",\"action\":[\"remove-attr\",\"data-t-category\"]}","{\"selector\":\"a[data-t-label]\",\"action\":[\"remove-attr\",\"data-t-label\"]}","{\"selector\":\"a[data-t-type]\",\"action\":[\"remove-attr\",\"data-t-type\"]}","{\"selector\":\"video[autoplay]\",\"action\":[\"remove-attr\",\"autoplay\"]}"],["{\"selector\":\"a[onclick^=\\\"plausible\\\"]\",\"action\":[\"remove-attr\",\"onclick\"]}"],["{\"selector\":\":is(a[target=\\\"_blank\\\"]:not([href^=\\\"/\\\"], [href*=\\\"filatelisten.se\\\"]))\",\"tasks\":[[\"upward\",\"section\"]]}"],["{\"selector\":\".postmeta em\",\"tasks\":[[\"has-text\",\"/sponsrad/i\"],[\"upward\",\".row.news\"]]}","{\"selector\":\":is(.news, a[href^=\\\"nyhet\\\"])\",\"tasks\":[[\"has-text\",\"/casino|kasino|poker/i\"]]}"],["{\"selector\":\".tdm-descr\",\"tasks\":[[\"has-text\",\"/casino/i\"]]}","{\"selector\":\"a.td-post-category[href*=\\\"/category/annons/\\\"]\",\"tasks\":[[\"upward\",\".td-category-pos-image\"]]}"],["{\"selector\":\".feat-cat\",\"tasks\":[[\"has-text\",\"/annons/i\"],[\"upward\",\"a\"]]}"],["{\"selector\":\"article.status-publish\",\"tasks\":[[\"has-text\",\"/annonssamarbete/i\"]]}"],["{\"selector\":\"a[href*=\\\"casino\\\"]\",\"tasks\":[[\"upward\",\"p\"]]}"],["{\"selector\":\".whitebox-container\",\"tasks\":[[\"has-text\",\"/sponsra/i\"]]}","{\"selector\":\":is(div[class*=\\\"vicky-whitebox\\\"], .vicky-category-label, .vicky-video-infobox-label, .vicky-post-headline-container__category__inner)\",\"tasks\":[[\"has-text\",\"/spons/i\"],[\"upward\",\"a, .carousel-caption, .featurette, article\"]]}"],["{\"selector\":\"body.tingle-enabled\",\"action\":[\"remove-class\",\"tingle-enabled\"]}"],["{\"selector\":\".ticker-title\",\"tasks\":[[\"has-text\",\"/partner/i\"],[\"spath\",\" + .mh-section\"]]}","{\"selector\":\".ticker-title\",\"tasks\":[[\"has-text\",\"/partner/i\"]]}","{\"selector\":\":is(.topwidget, .video-banner)\",\"action\":[\"remove\",\"\"]}"],["{\"selector\":\":is(.sponsored, .theme-news_sponsored_container)\",\"tasks\":[[\"upward\",\".theme-news\"]]}","{\"selector\":\"div[class$=\\\"sponsortitle\\\"]\",\"tasks\":[[\"upward\",\".desktop-side-widget\"]]}"],["{\"selector\":\".smallNewsCategory\",\"tasks\":[[\"has-text\",\"/sponsr/i\"],[\"upward\",\".smallNewsLink\"]]}","{\"selector\":\"img[src*=\\\"/images/annonser/\\\"]\",\"tasks\":[[\"upward\",1]]}"],["{\"selector\":\"a[href*=\\\"casino\\\"]\",\"tasks\":[[\"upward\",\".content\"]]}"],["{\"selector\":\".category\",\"tasks\":[[\"has-text\",\"/spons/i\"],[\"upward\",\"article\"]]}","{\"selector\":\".messageHolder ~ div[id*=\\\"viralize\\\"][class*=\\\"brand-showheroes\\\"]\",\"action\":[\"remove\",\"\"]}"],["{\"selector\":\".mark\",\"tasks\":[[\"has-text\",\"/spons/i\"],[\"upward\",\".post\"]]}"],["{\"selector\":\".holidAds\",\"tasks\":[[\"upward\",1]]}"],["{\"selector\":\".td-block-title-wrap\",\"tasks\":[[\"has-text\",\"/annons/i\"],[\"upward\",1]]}"],["{\"selector\":\".td-block-title > span\",\"tasks\":[[\"has-text\",\"/annonserat innehåll/i\"],[\"upward\",\".td_block_wrap\"]]}","{\"selector\":\".wp-block-column > h2\",\"tasks\":[[\"has-text\",\"/annonser/i\"],[\"spath\",\" ~ p\"]]}"],["{\"selector\":\".fp-carousel .fpci-kicker\",\"tasks\":[[\"has-text\",\"/^sponsr/i\"],[\"upward\",\".fpc-item\"]]}"],["{\"selector\":\".ad_interscroller\",\"tasks\":[[\"upward\",\".wrapper\"]]}","{\"selector\":\".colHomePlayer:has([data-slotads=\\\"videoad\\\"])\",\"action\":[\"remove\",\"\"]}","{\"selector\":\"video[data-autoplay]\",\"action\":[\"remove-attr\",\"data-autoplay\"]}"],["{\"selector\":\"article\",\"tasks\":[[\"has-text\",\"/är en annons/i\"]]}"],["{\"selector\":\":is(p[class^=\\\"teasersmall-sectionLabel\\\"], p[class^=\\\"teasermedium-sectionLabel\\\"])\",\"tasks\":[[\"has-text\",\"/annons/i\"],[\"upward\",\"a.internal-link, li\"]]}"],["{\"selector\":\"div.g:has(a[href*=\\\".com.se/\\\"])\",\"tasks\":[[\"has-text\",\"/återförsäljare|rea|garanti|lågt pris|nöjd|priser|shop|bra pris|kläder|skor|outlet|frakt|butik|betala|kundkorg|varukorg/i\"]]}"],["{\"selector\":\".text-gray.text-xs\",\"tasks\":[[\"has-text\",\"Annons:\"],[\"upward\",1]]}"],["{\"selector\":\".sponsored-notification\",\"tasks\":[[\"upward\",\"[id^=\\\"post-\\\"]\"]]}"],["{\"selector\":\"a[href*=\\\"casino\\\"]\",\"tasks\":[[\"upward\",1]]}"],["{\"selector\":\"a[href*=\\\"/category/sponsrat/\\\"]\",\"tasks\":[[\"upward\",\"li[class=\\\"\\\"]\"]]}"],["{\"selector\":\"p[style^=\\\"text-transform\\\"]\",\"tasks\":[[\"has-text\",\"/annons/i\"],[\"spath\",\" + .wp-block-kadence-posts\"]]}","{\"selector\":\"p[style^=\\\"text-transform\\\"]\",\"tasks\":[[\"has-text\",\"/annons/i\"]]}"],["{\"selector\":\":is(div[class^=\\\"u-text\\\"], .u-font-brand)\",\"tasks\":[[\"has-text\",\"/^Reklam$/\"],[\"upward\",\"section\"]]}"],["{\"selector\":\"article[class^=\\\"ArticleCard\\\"]\",\"tasks\":[[\"has-text\",\"/sponsrad/i\"]]}","{\"selector\":\"div[class^=\\\"ArticleCard_\\\"] small\",\"tasks\":[[\"has-text\",\"/sponsrad/i\"],[\"upward\",\"article, li, a\"]]}","{\"selector\":\"span[class^=\\\"ArticleContent_articleDateBox\\\"]\",\"tasks\":[[\"has-text\",\"/annons från/i\"],[\"upward\",\"div[class^=\\\"ArticleContent_articlePage\\\"]\"]]}"],["{\"selector\":\"div[id^=\\\"hitta_mobile_\\\"].placeholder\",\"tasks\":[[\"upward\",\"div[class^=\\\"height\\\"], div[class^=\\\"style_breakout\\\"]\"]]}"],["{\"selector\":\".vc_row_inner\",\"tasks\":[[\"has-text\",\"casino\"]]}"],["{\"selector\":\".bg-white:has(iframe[allow*=\\\"autoplay\\\"])\",\"action\":[\"remove\",\"\"]}"],["{\"selector\":\".small\",\"tasks\":[[\"has-text\",\"/Annons/i\"],[\"upward\",1]]}"],["{\"selector\":\".uk-text-center\",\"tasks\":[[\"has-text\",\"Annonser:\"],[\"upward\",\".uk-width-large\\\\@m\"]]}","{\"selector\":\".uk-text-left\",\"tasks\":[[\"has-text\",\"Annonser:\"],[\"upward\",\".uk-section\"]]}"],["{\"selector\":\".articleintroduction strong\",\"tasks\":[[\"has-text\",\"/samarbete/i\"],[\"upward\",\"li.item\"]]}"],["{\"selector\":\":is(a[href*=\\\"casino\\\"], a[href*=\\\"speltips\\\"])\",\"tasks\":[[\"upward\",\".widget\"]]}"],["{\"selector\":\".nyhetsochreseartiklar .views-row\",\"tasks\":[[\"has-text\",\"/casino/i\"]]}"],["{\"selector\":\"body.advert-take-over-active\",\"action\":[\"remove-class\",\"advert-take-over-active\"]}"],["{\"selector\":\".text-xs.font-bold\",\"tasks\":[[\"has-text\",\"Sponsrat inlägg\"],[\"upward\",\"a\"]]}"],["{\"selector\":\".article\",\"tasks\":[[\"has-text\",\"/sponsrad artikel/i\"]]}"],["{\"selector\":\".post-single-content p em\",\"tasks\":[[\"has-text\",\"Annons:\"]]}"],["{\"selector\":\".widget-title\",\"tasks\":[[\"has-text\",\"/annons/i\"],[\"upward\",\"aside\"]]}"],["{\"selector\":\".et_pb_module\",\"tasks\":[[\"matches-css\",{\"name\":\"content\",\"pseudo\":\"before\",\"value\":\"^\\\"Annons:\\\"$\"}]]}"],["{\"selector\":\"div[id^=\\\"ad-panorama\\\"]\",\"tasks\":[[\"upward\",\".elementor-section\"]]}"],["{\"selector\":\"body[unselectable]\",\"action\":[\"remove-attr\",\"unselectable\"]}"],["{\"selector\":\".elementor-heading-title\",\"tasks\":[[\"has-text\",\"/annons/i\"],[\"upward\",\".elementor-column\"]]}"],["{\"selector\":\".annons-label\",\"tasks\":[[\"upward\",\"a\"]]}"],["{\"selector\":\".sidebar-block\",\"tasks\":[[\"has-text\",\"/annons|sponsor/i\"]]}"],["{\"selector\":\":is(a[href*=\\\"casino\\\"], a[href*=\\\"kasino\\\"], a[href*=\\\"passagen.se\\\"])\",\"tasks\":[[\"upward\",\"p\"]]}"],["{\"selector\":\".card-partner\",\"tasks\":[[\"upward\",1]]}"],["{\"selector\":\".ad-text\",\"tasks\":[[\"has-text\",\"/annons/i\"],[\"upward\",\".content-box-list__item\"]]}","{\"selector\":\"body.mega-loading\",\"action\":[\"remove-class\",\"mega-loading\"]}"],["{\"selector\":\".cookieBarWrapper\",\"action\":[\"remove\",\"\"]}"],["{\"selector\":\"iframe[allow]\",\"action\":[\"remove-attr\",\"allow\"]}"],["{\"selector\":\"a.article-link\",\"tasks\":[[\"has-text\",\"Annons:\"],[\"upward\",\".sp-article-content\"]]}","{\"selector\":\"div.mark\",\"tasks\":[[\"matches-css\",{\"name\":\"content\",\"pseudo\":\"after\",\"value\":\"^\\\"ANNONS\\\"$\"}]]}"],["{\"selector\":\".postCard\",\"tasks\":[[\"has-text\",\"/bonusar|casino|betting|spelbranschen|spelupplevelse/i\"]]}"],["{\"selector\":\":is(a[href*=\\\"casino\\\"], a[href*=\\\"betting\\\"], a[href*=\\\"poker\\\"])\",\"tasks\":[[\"upward\",\".elementor-widget\"]]}","{\"selector\":\"article.feed-item\",\"tasks\":[[\"has-text\",\"/låna pengar|casino|betting/i\"]]}"],["{\"selector\":\".fusion-post-content-container\",\"tasks\":[[\"has-text\",\"/^annons/i\"],[\"upward\",\"article\"]]}"],["{\"selector\":\"div[class*=\\\"elementor-widget-text-editor\\\"][data-widget_type=\\\"text-editor.default\\\"] > .elementor-widget-container > p\",\"tasks\":[[\"has-text\",\"SPONSRAT\"],[\"upward\",\".jet-listing-grid__items\"]]}"],["{\"selector\":\"[id^=\\\"adPlacement\\\"]\",\"tasks\":[[\"upward\",1]]}"],["{\"selector\":\"body.private\",\"action\":[\"remove-class\",\"private\"]}"],["{\"selector\":\".widget-title\",\"tasks\":[[\"has-text\",\"ANNONS:\"],[\"upward\",\".really_simple_image_widget\"]]}"],["{\"selector\":\":is(img[src$=\\\"a_top.png.webp\\\"], a[href*=\\\"casino\\\"])\",\"tasks\":[[\"upward\",\"section.elementor-section\"]]}"],["{\"selector\":\".special_ad_video\",\"action\":[\"remove\",\"\"]}"],["{\"selector\":\".widget_media_image\",\"tasks\":[[\"has-text\",\"/annons/i\"]]}"],["{\"selector\":\".elementor-widget-heading\",\"tasks\":[[\"has-text\",\"/Sponsra|annons/i\"],[\"spath\",\" + .elementor-widget-post-block\"]]}","{\"selector\":\".elementor-widget-heading\",\"tasks\":[[\"has-text\",\"/Sponsra|annons/i\"]]}"],["{\"selector\":\"div.with-ads\",\"action\":[\"remove-class\",\"with-ads\"]}"],["{\"selector\":\"#ad-panorama-category\",\"tasks\":[[\"upward\",1]]}"],["{\"selector\":\"noscript\",\"action\":[\"remove\",\"\"],\"tasks\":[[\"has-text\",\"mdp-deblocker-js-disabled\"]]}","{\"selector\":\"style\",\"action\":[\"remove\",\"\"],\"tasks\":[[\"has-text\",\"body * :not\"]]}"],["{\"selector\":\".bannergroup\",\"tasks\":[[\"upward\",\".uk-panel-box\"]]}"],["{\"selector\":\".advert\",\"action\":[\"remove\",\"\"],\"tasks\":[[\"upward\",\".slick-item\"]]}"],["{\"selector\":\"p.has-text-align-center\",\"tasks\":[[\"has-text\",\"/i samarbete med/i\"],[\"upward\",\".post\"]]}"],["{\"selector\":\".excerpt\",\"tasks\":[[\"has-text\",\"/annons/i\"],[\"upward\",\"article\"]]}","{\"selector\":\".sidebar-widget h3\",\"tasks\":[[\"has-text\",\"/annons/i\"],[\"upward\",\".sidebar-widget\"]]}"],["{\"selector\":\".inner_article\",\"tasks\":[[\"has-text\",\"/sponsrat|annons/i\"]]}","{\"selector\":\"div[itemprop=\\\"articleBody\\\"] div\",\"tasks\":[[\"has-text\",\"ANNONS:\"]]}"],["{\"selector\":\".textwidget\",\"tasks\":[[\"has-text\",\"Annons\"]]}"],["{\"selector\":\".list-article__item-inscription\",\"tasks\":[[\"has-text\",\"/sponsrat innehåll/i\"],[\"upward\",\".list-article__item\"]]}"],["{\"selector\":\"#nativendo-mainfeed\",\"action\":[\"remove\",\"\"],\"tasks\":[[\"upward\",1]]}"],["{\"selector\":\"span:not(.post-content)\",\"tasks\":[[\"has-text\",\"/annons/i\"],[\"upward\",\".post\"]]}"],["{\"selector\":\".su-label\",\"tasks\":[[\"has-text\",\"/sponsra/i\"],[\"upward\",\".wpb_text_column\"]]}","{\"selector\":\".td-excerpt\",\"tasks\":[[\"has-text\",\"/sponsra/i\"],[\"upward\",\".meta-info-container\"]]}"],["{\"selector\":\".site-main > div.widget_custom_html p[style^=\\\"text-align: center;\\\"]\",\"tasks\":[[\"has-text\",\"/annonssamarbete/i\"],[\"upward\",\"div.widget_custom_html\"]]}"],["{\"selector\":\".jet-listing-grid__item[data-post-id]\",\"tasks\":[[\"has-text\",\"/sponsrad artikel/i\"]]}"],["{\"selector\":\"article.post\",\"tasks\":[[\"has-text\",\"/annons från/i\"]]}"],["{\"selector\":\".uppercase\",\"tasks\":[[\"has-text\",\"/annons/i\"],[\"upward\",1]]}"],["{\"selector\":\"article\",\"tasks\":[[\"has-text\",\"/annons:/i\"]]}"],["{\"selector\":\"article.teaser h2.fsize-24\",\"tasks\":[[\"has-text\",\"/casino/i\"],[\"upward\",\".teaser\"]]}"],["{\"selector\":\".recent-posts-widget-with-thumbnails\",\"tasks\":[[\"has-text\",\"/annonssamarbete/i\"]]}"],["{\"selector\":\":is(.adsbygoogle, a[href*=\\\"casino\\\"])\",\"tasks\":[[\"upward\",\".elementor-section\"]]}"],["{\"selector\":\".vignette.XLText :is(a[href*=\\\"/externa-tjanster\\\"], a[href*=\\\"promoted\\\"])\",\"tasks\":[[\"upward\",\".section\"]]}"],["{\"selector\":\".item-list__item\",\"tasks\":[[\"has-text\",\"/annons från/i\"]]}"],["{\"selector\":\"body[data-scroll-locked=\\\"1\\\"]\",\"action\":[\"remove-attr\",\"data-scroll-locked\"]}"],["{\"selector\":\"p.annons\",\"tasks\":[[\"upward\",1]]}"],["{\"selector\":\".td_block_wrap\",\"tasks\":[[\"has-text\",\"Annons\"]]}"],["{\"selector\":\".wp-show-posts-entry-summary\",\"tasks\":[[\"has-text\",\"/annons|reklam/i\"],[\"upward\",\".post\"]]}"],["{\"selector\":\".category-tag\",\"tasks\":[[\"has-text\",\"/annons/i\"],[\"upward\",\".ArticleListItem\"]]}"],["{\"selector\":\"a[target=\\\"_blank\\\"]\",\"tasks\":[[\"upward\",2]]}"],["{\"selector\":\"a[target=\\\"_blank\\\"][rel=\\\"nofollow\\\"]\",\"tasks\":[[\"upward\",1]]}"],["{\"selector\":\".block-title\",\"tasks\":[[\"has-text\",\"Våra annonsörer och partners\"],[\"upward\",1]]}","{\"selector\":\".sidebar-widget > .textwidget strong\",\"tasks\":[[\"has-text\",\"casino\"],[\"upward\",\"li.sidebar-widget\"]]}"],["{\"selector\":\":is(.sjofa-top-takeover, .sjofa-artikel-pano)\",\"tasks\":[[\"upward\",\"section\"]]}"],["{\"selector\":\"center > small\",\"tasks\":[[\"has-text\",\"ANNONS\"],[\"upward\",\"div[class*=\\\"cc-hide-on\\\"]\"]]}"],["{\"selector\":\".MuiChip-label\",\"tasks\":[[\"has-text\",\"Sponsrat\"],[\"upward\",\"article\"]]}","{\"selector\":\"div[id^=\\\"div-gpt-ad\\\"]\",\"tasks\":[[\"upward\",1]]}"],["{\"selector\":\".view-header > h3\",\"tasks\":[[\"has-text\",\"/annonser/i\"],[\"upward\",\".view-nya-lankar-front\"]]}"],["{\"selector\":\"a[href*=\\\"casino\\\"]\",\"tasks\":[[\"upward\",\".mh-posts-stacked-wrap\"]]}","{\"selector\":\"li.mh-slider-item:has(a[href*=\\\"casino\\\"])\",\"action\":[\"remove\",\"\"]}"],["{\"selector\":\".container\",\"tasks\":[[\"has-text\",\"Senaste nyheterna om spelbolag:\"]]}","{\"selector\":\"div.section-body-plus\",\"tasks\":[[\"has-text\",\"/bonus|casino/i\"]]}"],["{\"selector\":\".progams-list-xs .text-center:has(.banner)\",\"action\":[\"remove\",\"\"]}"],["{\"selector\":\"body.freeze-scroll\",\"action\":[\"remove-class\",\"freeze-scroll\"]}"],["{\"selector\":\".label-sponsor\",\"tasks\":[[\"upward\",\".panel\"]]}"],["{\"selector\":\"legend\",\"tasks\":[[\"has-text\",\"Annons\"]]}"],["{\"selector\":\"block-3x3-news-widget\",\"tasks\":[[\"has-text\",\"Sponsrat innehåll\"]]}"],["{\"selector\":\".cd-card-bar\",\"tasks\":[[\"has-text\",\"/annons/i\"],[\"upward\",\".cd-sidebar-item, .cd-news-card\"]]}"],["{\"selector\":\".bbSize\",\"tasks\":[[\"has-text\",\"Sponsormeddelande\"],[\"upward\",\".bbRelatedBox\"]]}","{\"selector\":\"div[class^=\\\"card-info\\\"]\",\"tasks\":[[\"has-text\",\"/spons/i\"],[\"upward\",\".card\"]]}"],["{\"selector\":\".mostReadMobile\",\"tasks\":[[\"has-text\",\"/annons/i\"]]}","{\"selector\":\"a[target=\\\"_blank\\\"]\",\"action\":[\"remove\",\"\"],\"tasks\":[[\"upward\",\"li.Notice\"]]}"],["{\"selector\":\".label\",\"tasks\":[[\"has-text\",\"/samarbete|annons|reklam|presenteras av/i\"],[\"upward\",\"a\"]]}","{\"selector\":\"[onclick^=\\\"ga(\\\"]\",\"action\":[\"remove-attr\",\"onclick\"]}"],["{\"selector\":\".pill\",\"tasks\":[[\"has-text\",\"/spons/i\"],[\"upward\",\".grid-item, .pinned, .articleFlow-item\"]]}"],["{\"selector\":\".ra-widget-article-tag\",\"tasks\":[[\"has-text\",\"/partner/i\"],[\"upward\",\".ra-widget-panel\"]]}"],["{\"selector\":\"p.uppercase\",\"tasks\":[[\"has-text\",\"/i annonssamarbete med/i\"],[\"upward\",\".flex.overflow-hidden\"]]}"],["{\"selector\":\"html.sv-no-touch\",\"action\":[\"remove-class\",\"sv-no-touch\"]}"],["{\"selector\":\"body.cli-barmodal-open\",\"action\":[\"remove-class\",\"cli-barmodal-open\"]}"],["{\"selector\":\"h2.elementor-heading-title\",\"tasks\":[[\"has-text\",\"/annons/i\"],[\"upward\",\".e-con-boxed[data-settings^=\\\"{\\\\\\\"background\\\"]\"]]}"],["{\"selector\":\"[class*=\\\"tot-content-preview-container\\\"]:has(a[href*=\\\"casino\\\"], a[href*=\\\"kasino\\\"], a[href*=\\\"betting\\\"], a[href*=\\\"spel\\\"], .sponsoredarticles)\",\"action\":[\"remove\",\"\"]}"],["{\"selector\":\"div.text-\\\\[8px\\\\].text-center\",\"tasks\":[[\"has-text\",\"ANNONS\"],[\"upward\",1]]}"],["{\"selector\":\"#root div[id]:not([id^=\\\"checkout\\\"]):empty\",\"tasks\":[[\"upward\",2]]}"],["{\"selector\":\"main div[id]:not([id^=\\\"checkout\\\"]):empty\",\"tasks\":[[\"upward\",2]]}"],["{\"selector\":\"a[href=\\\"\\\"].uppercase\",\"tasks\":[[\"has-text\",\"REKLAM\"],[\"upward\",\".popular-post\"]]}"],["{\"selector\":\"a[target=\\\"_blank\\\"] button[aria-labelledby] span\",\"tasks\":[[\"has-text\",\"/Sponsrat av|i samarbete med/i\"],[\"upward\",\"a\"]]}"],["{\"selector\":\"#tv-schedule section\",\"tasks\":[[\"has-text\",\"ANNONS\"]]}","{\"selector\":\"body.takeover-loading\",\"action\":[\"remove-class\",\"takeover-loading\"]}"],["{\"selector\":\".jet-listing-dynamic-field__content\",\"tasks\":[[\"has-text\",\"/annonssamarbete|reklamsamarbete/i\"],[\"upward\",\".jet-listing-grid__item\"]]}"],["{\"selector\":\".betart-marker\",\"tasks\":[[\"matches-css\",{\"name\":\"content\",\"pseudo\":\"after\",\"value\":[\"Annons\",\"i\"]}],[\"upward\",\".documentpush-group\"]]}"],["{\"selector\":\"html.has-intro-popup\",\"action\":[\"remove-class\",\"has-intro-popup\"]}","{\"selector\":\"html.show-intro-popup\",\"action\":[\"remove-class\",\"show-intro-popup\"]}"],["{\"selector\":\"a[target]\",\"tasks\":[[\"upward\",\".frontlinks tr\"]]}"],["{\"selector\":\"a[href*=\\\"/casino\\\"]\",\"tasks\":[[\"upward\",\".wp-block-image\"]]}"],["{\"selector\":\".g-single\",\"tasks\":[[\"upward\",\"section[data-settings*=\\\"background_background\\\"]\"]]}"],["{\"selector\":\".td-block-title span\",\"tasks\":[[\"has-text\",\"/sponsr/i\"],[\"upward\",3]]}"],["{\"selector\":\".leftinfo\",\"tasks\":[[\"has-text\",\"/Externa artiklar:|Länktips:/\"]]}"],["{\"selector\":\".sidebox\",\"tasks\":[[\"has-text\",\"/Externa länkar|Artiklar/\"]]}"],["{\"selector\":\".fusion-text\",\"tasks\":[[\"has-text\",\"Online casino\"]]}"],["{\"selector\":\".card-header\",\"tasks\":[[\"has-text\",\"Annons\"],[\"upward\",\".card\"]]}"],["{\"selector\":\"span.arialtext11[style^=\\\"float:left\\\"]\",\"tasks\":[[\"has-text\",\"/^i samarbete med/i\"],[\"upward\",2]]}"],["{\"selector\":\"span[id^=\\\"ezoic-pub-ad\\\"]\",\"tasks\":[[\"upward\",\".row\"]]}"]];
const argsSeqs = [0,1,2,3,4,5,-5,39,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32,33,34,35,36,37,38,40,41,42,43,44,45,46,47,48,49,50,51,52,53,54,55,56,57,58,59,60,61,62,63,64,65,-66,104,67,68,69,70,71,72,73,74,75,76,77,78,79,80,81,82,83,84,85,86,87,88,89,90,91,92,93,94,95,96,97,98,99,100,101,102,103,104,105,106,107,108,109,-109,124,110,111,112,113,114,115,116,117,118,119,120,121,122,123,125,126,-127,128,128,129,130,131,132,133,134,135,136,137,138,139,140,141,142,143,144,145,146,147,148,149,150,151,152,153,154,155,156,157,158,159,160,161,162,163,164,165,166,167,168,169,170,171,172,173,174,175,176,177,178,179,180,181,182];
const hostnamesMap = new Map([["99.teknikveckan.se",1],["aftonbladet.se",2],["aktieskolan.se",3],["aktuellsakerhet.se",4],["allas.se",5],["elle.se",6],["femina.se",5],["hant.se",5],["mabra.com",5],["residencemagazine.se",5],["svenskdam.se",5],["motherhood.se",5],["amelia.expressen.se",8],["arbetaren.se",9],["aurumforum.se",10],["autonytt.se",11],["bandyfeber.com",12],["baraenkakatill.se",13],["bilresaieuropa.se",14],["bioenergitidningen.se",15],["kvalitetsmagasinet.se",15],["miljo-utveckling.se",15],["techtidningen.se",15],["vdtidningen.se",15],["boneo.se",16],["booli.se",17],["borskollen.se",18],["borsvarlden.com",19],["branschaktuellt.se",20],["bulletin.nu",21],["businesstories.se",22],["butikstrender.se",23],["byggahus.se",24],["byggipedia.se",25],["campingsverige.se",26],["conpot.se",27],["dagenslogistik.se",28],["dagensps.se",29],["news55.se",29],["realtid.se",29],["dagenstech.se",30],["dagenstv.com",31],["daisybeauty.com",32],["datormagazin.se",33],["densistavilan.se",34],["digitalavykort.se",35],["discoveringtheplanet.com",36],["djungeltrumman.se",37],["dn.se",38],["di.se",38],["dust2.se",39],["ehandel.se",40],["esportare.se",41],["evergreengarden.se",42],["everysport.com",43],["expo.se",44],["expressen.se",45],["feber.se",46],["tjock.se",46],["filatelisten.se",47],["filmtipset.se",48],["finanstid.se",49],["firstclassmagazine.se",50],["firstfoto.se",51],["fl-net.se",52],["foretagsverige.se",53],["forskningsverige.se",53],["motorbibeln.se",53],["hallbarhetsverige.se",53],["tillvaxtsverige.se",53],["grillbibeln.se",53],["kampenmotcancer.se",53],["folkhalsasverige.se",53],["forstasidorna.se",54],["forvaltarforum.se",55],["fotbollskanalen.se",56],["fotbolltransfers.com",57],["fotboll.com",58],["fragbite.se",59],["freeride.se",60],["fria.nu",61],["stockholmsfria.se",61],["temperatur.nu",61],["frihetsnytt.se",62],["futsalmagasinet.se",63],["fz.se",64],["gamereactor.se",65],["gasetten.se",66],["fotbollsthlm.se",66],["godare.se",67],["google.se",69],["goteborgfilmfestival.se",70],["gynning.net",71],["happypancake.se",72],["happyride.se",73],["hejaolika.se",74],["hejauppsala.com",75],["hemnet.se",76],["hitta.se",77],["hockeybladet.nu",78],["hockeynews.se",79],["horisontmagasin.se",80],["husbilskompisar.se",81],["husvagn.se",82],["husbil.se",82],["ibnytt.se",83],["indien.nu",84],["ingenjorsjobb.se",85],["innovationslandet.se",86],["inredningsarkitektur.se",87],["investeramera.se",88],["it-finans.se",89],["it-halsa.se",89],["it-kanalen.se",89],["it-pedagogen.se",89],["it-retail.se",89],["it-hallbarhet.se",89],["jarnvagar.nu",90],["javligtgott.se",91],["kandisvarlden.com",92],["karlskogavaxer.se",93],["karriarlakare.se",94],["kiacarclub.se",95],["killsteal.se",96],["kingmagazine.se",97],["klart.se",98],["kokaihop.se",99],["kritiker.se",100],["krogen.se",101],["lajvo.se",102],["listor.se",103],["livinguppsala.se",104],["livsmedelsnyheter.se",105],["livsstil.se",106],["ljuskultur.se",107],["lokalfotboll.se",108],["lokalti.se",109],["magazin24.se",110],["maltermagasin.se",111],["nyadagbladet.se",112],["marknadschefer.se",114],["matinspo.se",115],["matspar.se",116],["medibok.se",117],["metalcentral.net",118],["metromode.se",119],["minimalisterna.se",120],["modernalivet.se",121],["moviezine.se",122],["mygatemagazine.se",123],["naringslivetvgl.se",124],["dalarnasaffarer.se",124],["stockholmsaffarer.se",124],["jamtlandsaffarer.se",124],["hallandsnaringsliv.se",124],["sjuharadsnaringsliv.se",124],["ng.se",125],["nordfront.se",126],["nordichardware.se",127],["nyemissioner.se",128],["nyfiknainvesterare.se",129],["nyheter24.se",130],["alltforforaldrar.se",132],["modette.se",132],["devote.se",132],["familjeliv.se",132],["brollopstorget.se",132],["blogg.se",132],["rodeo.net",132],["vimedbarn.se",132],["loppi.se",132],["nyheteridag.se",133],["nyheter.swebbtv.se",134],["oskarshamns-nytt.se",135],["placera.se",136],["podtail.se",137],["qasa.se",138],["sailguide.com",139],["samfalligheterna.se",140],["sanghafte.se",141],["shortcut.se",142],["siljannews.se",143],["siljanskok.se",144],["sillyseason.se",145],["sjofart.ax",146],["skaneplus.se",147],["skidspar.se",148],["so-rummet.se",149],["spelochfilm.se",150],["sportbloggare.com",151],["sporttv.nu",152],["storyhouseegmont.se",153],["svampguiden.com",154],["svenskamagasinet.nu",155],["svenskverkstad.se",156],["sverigespringer.se",157],["sweclockers.com",158],["swedroid.se",159],["tekniknytt.se",160],["teknikveckan.se",161],["thelocal.se",162],["tidningenbalans.se",163],["tidningencurie.se",164],["tidningenridsport.se",165],["tlnt.se",166],["totallyorebro.se",167],["totallystockholm.se",167],["travnet.se",168],["travrondenspel.se",169],["travronden.se",170],["trendenser.se",171],["tripadvisor.se",172],["tv.nu",173],["underbaraclaras.se",174],["utsidan.se",175],["vadvivet.se",176],["varmepumpsforum.com",177],["veckorevyn.com",178],["vildmarken.se",179],["villalivet.se",180],["viseniorer.se",181],["vmj.se",182],["vm-fotboll.se",183],["voodoofilm.org",184],["vovve.net",185],["xn--gtboken-exa.se",186]]);
const hasEntities = false;

self.proceduralImports = self.proceduralImports || [];
self.proceduralImports.push({ argsList, argsSeqs, hostnamesMap, hasEntities });

/******************************************************************************/

})();

/******************************************************************************/
