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

// ruleset: ita-0

/******************************************************************************/

// Important!
// Isolate from global scope
(function uBOL_cssProceduralImport() {

/******************************************************************************/

const argsList = [["{\"selector\":\".widget.widget_block\",\"tasks\":[[\"has\",{\"selector\":\"a[href^=\\\"https://betsquare.com/\\\"]\"}]]}","{\"selector\":\".widget.widget_block\",\"tasks\":[[\"has\",{\"selector\":\"a[target=\\\"_blank\\\"]\"}]]}"],["{\"selector\":\".card.shadowLink\",\"tasks\":[[\"has\",{\"selector\":\"#ContentPlaceHolder1_rptAzzMain_btn_0\"}]]}","{\"selector\":\".container-fluid.py-3.bg-white-color.pl-5.pr-5\",\"tasks\":[[\"has\",{\"selector\":\".text-black.weight-400.mb-0\",\"tasks\":[[\"has-text\",\"I Nostri Partners\"]]}]]}"],["{\"selector\":\".td_block_template_1\",\"tasks\":[[\"has\",{\"selector\":\".td-block-title-wrap\",\"tasks\":[[\"has-text\",\"Banner\"]]}]]}"],["{\"selector\":\".td-block-row\",\"tasks\":[[\"has\",{\"selector\":\"a[href^=\\\"https://group.intesasanpaolo.com/\\\"]\"}]]}"],["{\"selector\":\".post.type-post.consigliato\",\"tasks\":[[\"has\",{\"selector\":\"a\",\"tasks\":[[\"has-text\",\"Sponsorizzato\"]]}]]}"],["{\"selector\":\".article-blog-default\",\"tasks\":[[\"has\",{\"selector\":\"span\",\"tasks\":[[\"has-text\",\"CONTENUTO SPONSORIZZATO\"]]}]]}"],["{\"selector\":\".td_block_wrap\",\"tasks\":[[\"has\",{\"selector\":\"a\",\"tasks\":[[\"has-text\",\"Contenuti sponsorizzati\"]]}]]}"],["{\"selector\":\".sidebar-block\",\"tasks\":[[\"has\",{\"selector\":\"a[href^=\\\"https://track.webgains.com/click.html\\\"]\"}]]}"],["{\"selector\":\".td_block_wrap\",\"tasks\":[[\"has\",{\"selector\":\".sponsor\"}]]}"],["{\"selector\":\".agi-article-card\",\"tasks\":[[\"has\",{\"selector\":\".article-category\",\"tasks\":[[\"has-text\",\"BRANDED CONTENT\"]]}]]}"],["{\"selector\":\".wp-block-group__inner-container\",\"tasks\":[[\"has\",{\"selector\":\"a[href^=\\\"https://www.appscommesse.com/\\\"]\"}]]}"],["{\"selector\":\".m-relases__result\",\"tasks\":[[\"has\",{\"selector\":\"div\",\"tasks\":[[\"has-text\",\"Contenuto pubblicitario\"]]}]]}"],["{\"selector\":\".experience-component_hp_push_promo\",\"tasks\":[[\"has\",{\"selector\":\"#viewHomeDesktop-middleSp-sponsored_products-0\"}]]}"],["{\"selector\":\".rowthumb\",\"tasks\":[[\"has\",{\"selector\":\"a[href]\"}]]}"],["{\"selector\":\".s-item\",\"tasks\":[[\"has\",{\"selector\":\"span.s-item__title--tagblock__SPONSORED\"}]]}"],["{\"selector\":\".section-articles--advertising\",\"tasks\":[[\"has\",{\"selector\":\".sponsored\"}]]}"],["{\"selector\":\".post.type-post.status-publish.format-standard\",\"tasks\":[[\"has\",{\"selector\":\".brandvoice\"}]]}"],["{\"selector\":\".wpb_wrapper > .td_block_wrap\",\"tasks\":[[\"has\",{\"selector\":\".sponsor\"}]]}"],["{\"selector\":\".td_block_wrap\",\"tasks\":[[\"has\",{\"selector\":\"span\",\"tasks\":[[\"has-text\",\"Contenuti sponsorizzati\"]]}]]}"],["{\"selector\":\".cl-amp-important-information\",\"tasks\":[[\"has\",{\"selector\":\"div\",\"tasks\":[[\"has-text\",\"Annuncio pubblicitario\"]]}]]}","{\"selector\":\".custom-html\",\"tasks\":[[\"has\",{\"selector\":\"div\",\"tasks\":[[\"has-text\",\"Annuncio pubblicitario\"]]}]]}"],["{\"selector\":\"article\",\"tasks\":[[\"has\",{\"selector\":\"p\",\"tasks\":[[\"has-text\",\"Sponsorizzata\"]]}]]}"],["{\"selector\":\".bx\",\"tasks\":[[\"has\",{\"selector\":\"div\",\"tasks\":[[\"has-text\",\"CONTENUTO SPONSORIZZATO\"]]}]]}"],["{\"selector\":\".right.es.large\",\"tasks\":[[\"has\",{\"selector\":\"span\",\"tasks\":[[\"has-text\",\"contenuto sponsorizzato\"]]}]]}"],["{\"selector\":\".flex.flex-col.space-y-3.relative\",\"tasks\":[[\"has\",{\"selector\":\".mr-2\"}]]}"],["{\"selector\":\".arel\",\"tasks\":[[\"has\",{\"selector\":\"a[href^=\\\"https://www.ebay.it/\\\"]\"}]]}"],["{\"selector\":\".sal-list-item\",\"tasks\":[[\"has\",{\"selector\":\".sal-is-special\"}]]}"],["{\"selector\":\".jeg_slide_item\",\"tasks\":[[\"has\",{\"selector\":\".category-sponsorizzate\"}]]}"],["{\"selector\":\".search-itm\",\"tasks\":[[\"has\",{\"selector\":\".search-itm__label\",\"tasks\":[[\"has-text\",\"annuncio\"]]}]]}"],["{\"selector\":\".similar-post-holder\",\"tasks\":[[\"has\",{\"selector\":\".categoria\",\"tasks\":[[\"has-text\",\"Post sponsorizzato\"]]}]]}","{\"selector\":\"article\",\"tasks\":[[\"has\",{\"selector\":\".featured + .spons-post\"}]]}"],["{\"selector\":\".feat-widget-wrap\",\"tasks\":[[\"has\",{\"selector\":\"div\",\"tasks\":[[\"has-text\",\"INFORMAZIONE REDAZIONALE\"]]}]]}"],["{\"selector\":\".td_block_wrap\",\"tasks\":[[\"has\",{\"selector\":\"span\",\"tasks\":[[\"has-text\",\"Advertorial\"]]}]]}"],["{\"selector\":\"center\",\"tasks\":[[\"has\",{\"selector\":\"a\",\"tasks\":[[\"has-text\",\"Esponi i tuoi banner sul forum\"]]}]]}"],["{\"selector\":\".card.dark\",\"tasks\":[[\"has\",{\"selector\":\"span\",\"tasks\":[[\"has-text\",\"Adv\"]]}]]}"],["{\"selector\":\"div[class^=\\\"css-\\\"]\",\"tasks\":[[\"has\",{\"selector\":\"a\",\"tasks\":[[\"has-text\",\"contenuto sponsorizzato\"]]}]]}"]];

const hostnamesMap = new Map([["sportando.basketball",0],["investire.biz",1],["cronacadiverona.com",2],["italpress.com",3],["lavocedinovara.com",4],["lospiffero.com",5],["meccanicanews.com",6],["logisticanews.it",6],["metalitalia.com",7],["01health.it",8],["01net.it",8],["01smartlife.it",8],["agi.it",9],["androidplanet.it",10],["borsaitaliana.it",11],["carrefour.it",12],["cruiselifestyle.it",13],["ebay.it",14],["ecodibergamo.it",15],["forbes.it",16],["freshpointmagazine.it",17],["ilprogettistaindustriale.it",18],["laleggepertutti.it",19],["lasicilia.it",20],["iene.mediaset.it",21],["tgcom24.mediaset.it",22],["money.it",23],["moto.it",24],["my-personaltrainer.it",25],["orvietosi.it",26],["paginegialle.it",27],["pharmacyscanner.it",28],["radioluna.it",29],["technofashion.it",30],["guadagna.net",31],["tuttoandroid.net",32],["aleteia.org",33]]);

const entitiesMap = new Map(undefined);

const exceptionsMap = new Map(undefined);

self.proceduralImports = self.proceduralImports || [];
self.proceduralImports.push({ argsList, hostnamesMap, entitiesMap, exceptionsMap });

/******************************************************************************/

})();

/******************************************************************************/
