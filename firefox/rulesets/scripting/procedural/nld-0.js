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

// ruleset: nld-0

/******************************************************************************/

// Important!
// Isolate from global scope
(function uBOL_cssProceduralImport() {

/******************************************************************************/

const argsList = [["{\"selector\":\".hz-Listing--list-item\",\"tasks\":[[\"has\",{\"selector\":\".hz-Listing-priority\",\"tasks\":[[\"has-text\",\"Topadvertentie\"]]}]]}"],["{\"selector\":\".tile\",\"tasks\":[[\"has\",{\"selector\":\"> article.ankeiler--advertisement\"}]]}"],["{\"selector\":\"#below_para_1\",\"tasks\":[[\"has\",{\"selector\":\"> a[href^=\\\"https://e093.knack.be/\\\"]\"}]]}"],["{\"selector\":\"div[class^=\\\"Flex-styled__StyledFlex-\\\"]\",\"tasks\":[[\"has\",{\"selector\":\"h3\",\"tasks\":[[\"has-text\",\"Gesponsorde producten\"]]}]]}"],["{\"selector\":\"[data-index-number]\",\"tasks\":[[\"has-text\",\"Gesponsord\"]]}","{\"selector\":\"div[data-test=\\\"mms-product-card\\\"]\",\"tasks\":[[\"has\",{\"selector\":\"div[data-test=\\\"mms-plp-sponsored\\\"]\"}]]}"],["{\"selector\":\".grid-item.grid-item-pebble\",\"tasks\":[[\"has\",{\"selector\":\"#pebble-label\",\"tasks\":[[\"has-text\",\"Advertentie\"]]}]]}"],["{\"selector\":\".o-hpgrid__row-tijdconnect\",\"tasks\":[[\"has\",{\"selector\":\"h2\",\"tasks\":[[\"has-text\",\"Gesponsorde inhoud\"]]}]]}"],["{\"selector\":\"li.js_item_root\",\"tasks\":[[\"has\",{\"selector\":\".dsa__list-padding\"}]]}"],["{\"selector\":\".entry-content div[class]\",\"tasks\":[[\"has\",{\"selector\":\"> ins.adsbygoogle\"}]]}"],["{\"selector\":\".articles > li.injection\",\"tasks\":[[\"has\",{\"selector\":\"> aside.betting\"}]]}"],["{\"selector\":\".d-none.d-md-block.mb-3\",\"tasks\":[[\"has\",{\"selector\":\"a[target=\\\"_blank\\\"][rel=\\\"noopener\\\"]\"}]]}"],["{\"selector\":\".widebnr > *\",\"action\":[\"remove\",\"\"]}"],["{\"selector\":\".product-card-portrait_root__ZiRpZ\",\"tasks\":[[\"has\",{\"selector\":\".promotion_root__pAAlu\"}]]}"],["{\"selector\":\".pd-results-container > .results-inner > .pd-advisor-offer-container:first-child\",\"tasks\":[[\"has\",{\"selector\":\"> .pd-advisor-offer > .result-badge\",\"tasks\":[[\"has-text\",\"Adv.\"]]}]]}","{\"selector\":\".sidebar > .widget_static_device_widget\",\"tasks\":[[\"has\",{\"selector\":\".device-ad\"}]]}"],["{\"selector\":\".theiaStickySidebar > aside.penci_latest_news_widget > h4.widget-title\",\"tasks\":[[\"has-text\",\"Advertentie\"]]}"],["{\"selector\":\".ct-sidebar > div.widget\",\"tasks\":[[\"has\",{\"selector\":\"h2\",\"tasks\":[[\"has-text\",\"Partners\"]]}]]}"],["{\"selector\":\".content-start > * > div[style]\",\"tasks\":[[\"has-text\",\"/Externe links|Externe websites/i\"]]}"],["{\"selector\":\"div[id^=\\\"ster-ad-bnnvara-\\\"]\",\"tasks\":[[\"upward\",1]]}"],["{\"selector\":\".linklist\",\"tasks\":[[\"has\",{\"selector\":\"h1\",\"tasks\":[[\"has-text\",\"Lekker Dichtbij Deals\"]]}]]}"],["{\"selector\":\".widget_custom_html\",\"tasks\":[[\"has\",{\"selector\":\"h2\",\"tasks\":[[\"has-text\",\"Beter Beleggen\"]]}]]}"],["{\"selector\":\".ad--billboardrectangle\",\"tasks\":[[\"upward\",3]]}","{\"selector\":\"aside div[id^=\\\"ad_\\\"]\",\"tasks\":[[\"upward\",2]]}","{\"selector\":\"div[id*=\\\"leaderboardwallpaper-\\\"]\",\"tasks\":[[\"upward\",3]]}"],["{\"selector\":\"[data-cy=\\\"plp-tile-container\\\"]\",\"tasks\":[[\"has-text\",\"Gesponsord\"]]}","{\"selector\":\"li\",\"tasks\":[[\"has-text\",\"Gesponsord\"]]}"],["{\"selector\":\".article.row.no-image\",\"tasks\":[[\"has\",{\"selector\":\".row.compost-warn\",\"tasks\":[[\"has-text\",\"- ingezonden mededeling -\"]]}]]}"],["{\"selector\":\".list-item.list-item--aagje\",\"tasks\":[[\"has\",{\"selector\":\".list-item__sponsor\"}]]}"],["{\"selector\":\".io-tape-card__wrap\",\"tasks\":[[\"has\",{\"selector\":\".io-tape-card__label__sponsored\"}]]}"],["{\"selector\":\"article > .no-content-styles\",\"tasks\":[[\"has\",{\"selector\":\"> div[data-nosnippet] > div[data-name=\\\"dynamic-content-injected\\\"][data-campaign]\"}]]}","{\"selector\":\"div[data-name=\\\"dynamic-content\\\"]\",\"tasks\":[[\"has\",{\"selector\":\"> div[id^=\\\"div-gpt-\\\"]\"}]]}"],["{\"selector\":\".article-column_article\",\"tasks\":[[\"has\",{\"selector\":\".category-label_label\",\"tasks\":[[\"has-text\",\"Advertorial\"]]}]]}","{\"selector\":\".article-row_article\",\"tasks\":[[\"has\",{\"selector\":\".article-row_category.category-label_label\",\"tasks\":[[\"has-text\",\"Advertorial\"]]}]]}"],["{\"selector\":\".mp-Page-element > .mp-Listings + div:not([class]):not([id])\",\"tasks\":[[\"has\",{\"selector\":\"> .mp-Listings__admarktTitle\"}]]}","{\"selector\":\"ul.mp-Listings > li.mp-Listing\",\"tasks\":[[\"has\",{\"selector\":\"> .mp-Listing-coverLink > .mp-Listing-group > .mp-Listing-group--price-date-feature > span.mp-Listing-priority > span\",\"tasks\":[[\"has-text\",\"/^Topadvertentie$/\"]]}]]}"],["{\"selector\":\".td_module_wrap\",\"tasks\":[[\"has\",{\"selector\":\".td-post-category\",\"tasks\":[[\"has-text\",\"Gesponsord\"]]}]]}"],["{\"selector\":\".autoscalable-block-wrapper\",\"tasks\":[[\"has\",{\"selector\":\".entity-block-title\",\"tasks\":[[\"has-text\",\"Van onze partners\"]]}]]}","{\"selector\":\".off-canvas-content > div\",\"tasks\":[[\"has\",{\"selector\":\"> div.dfp-rectangle-wrapper\"}]]}"],["{\"selector\":\"section.network\",\"tasks\":[[\"has\",{\"selector\":\".contentheader.contentheader--network\",\"tasks\":[[\"has-text\",\"Gesponsorde links\"]]}]]}"],["{\"selector\":\"div[class=\\\"sidebar_item\\\"][style=\\\"padding-bottom: 16px;\\\"]\",\"action\":[\"remove\",\"\"],\"tasks\":[[\"has\",{\"selector\":\"> a > img[width=\\\"276\\\"]\"}]]}"],["{\"selector\":\".square-item\",\"tasks\":[[\"has\",{\"selector\":\"> .banner\"}]]}"],["{\"selector\":\".c-articles-list__item.c-articles-list__item--highlight\",\"tasks\":[[\"has\",{\"selector\":\".c-tag.c-articles-list__label\",\"tasks\":[[\"has-text\",\"Advertorial\"]]}]]}"],["{\"selector\":\".blok\",\"tasks\":[[\"has\",{\"selector\":\"h3\",\"tasks\":[[\"has-text\",\"Partners\"]]}]]}"],["{\"selector\":\".shadow-lvl-2\",\"tasks\":[[\"has\",{\"selector\":\"a[href^=\\\"https://www.voordeeluitjes.nl/\\\"]\"}]]}"],["{\"selector\":\".post\",\"tasks\":[[\"has\",{\"selector\":\"a[href*=\\\"/partnerposting/\\\"]\"}]]}"],["{\"selector\":\".widget-container\",\"tasks\":[[\"has\",{\"selector\":\".h3.mb-4\",\"tasks\":[[\"has-text\",\"Wielerdeals\"]]}]]}","{\"selector\":\"li.list-item.list-item-aside\",\"tasks\":[[\"has\",{\"selector\":\".badge\",\"tasks\":[[\"has-text\",\"Ad\"]]}]]}","{\"selector\":\"li.list-item.list-item-default\",\"tasks\":[[\"has\",{\"selector\":\"span\",\"tasks\":[[\"has-text\",\"Ad\"]]}]]}"],["{\"selector\":\".wpb_wrapper\",\"tasks\":[[\"has\",{\"selector\":\"div\",\"tasks\":[[\"has-text\",\"#advertentie\"]]}]]}"]];

const hostnamesMap = new Map([["2dehands.be",0],["7sur7.be",1],["hln.be",1],["ad.nl",1],["bd.nl",1],["bndestem.nl",1],["destentor.nl",1],["ed.nl",1],["gelderlander.nl",1],["pzc.nl",1],["tubantia.nl",1],["knack.be",2],["krefel.be",3],["mediamarkt.be",4],["mediamarkt.nl",4],["mnm.be",5],["tijd.be",6],["bol.com",7],["gfcnieuws.com",8],["gpblog.com",9],["autobahn.eu",10],["tweakers.net",11],["ah.nl",12],["androidplanet.nl",13],["ans-online.nl",14],["apparata.nl",15],["arenalokaal.nl",16],["bnnvara.nl",17],["buienradar.nl",18],["businessinsider.nl",19],["dumpert.nl",20],["fonq.nl",21],["geenstijl.nl",22],["indebuurt.nl",23],["investmentofficer.nl",24],["iphoned.nl",25],["linda.nl",26],["marktplaats.nl",27],["nieuwsopbeeld.nl",28],["rtlnieuws.nl",29],["tostrams.nl",30],["turksemedia.nl",31],["tvgids.nl",32],["vi.nl",33],["voetbalcentraal.nl",34],["weer.nl",35],["welingelichtekringen.nl",36],["wielerflits.nl",37],["wkdarts.nl",38]]);

const entitiesMap = new Map(undefined);

const exceptionsMap = new Map(undefined);

self.proceduralImports = self.proceduralImports || [];
self.proceduralImports.push({ argsList, hostnamesMap, entitiesMap, exceptionsMap });

/******************************************************************************/

})();

/******************************************************************************/
