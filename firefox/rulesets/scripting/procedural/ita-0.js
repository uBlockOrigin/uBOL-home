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

const argsList = [["{\"selector\":\".widget.widget_block\",\"tasks\":[[\"has\",{\"selector\":\"a[href^=\\\"https://betsquare.com/\\\"]\"}]]}"],["{\"selector\":\".card.shadowLink\",\"tasks\":[[\"has\",{\"selector\":\"#ContentPlaceHolder1_rptAzzMain_btn_0\"}]]}","{\"selector\":\".container-fluid.py-3.bg-white-color.pl-5.pr-5\",\"tasks\":[[\"has\",{\"selector\":\".text-black.weight-400.mb-0\",\"tasks\":[[\"has-text\",\"I Nostri Partners\"]]}]]}"],["{\"selector\":\"div[data-test=\\\"mms-product-card\\\"]\",\"tasks\":[[\"has\",{\"selector\":\"div[data-test=\\\"mms-plp-sponsored\\\"]\"}]]}","{\"selector\":\"li[data-index-number]\",\"tasks\":[[\"has\",{\"selector\":\"[data-test=\\\"mms-product-card\\\"]\",\"tasks\":[[\"has-text\",\"Sponsorizzati\"]]}]]}"],["{\"selector\":\".cont-ev-list\",\"tasks\":[[\"has\",{\"selector\":\".title-channel\",\"tasks\":[[\"has-text\",\"in Evidenza\"]]}]]}"],["{\"selector\":\".td_block_template_1\",\"tasks\":[[\"has\",{\"selector\":\".td-block-title-wrap\",\"tasks\":[[\"has-text\",\"Banner\"]]}]]}"],["{\"selector\":\".td-block-row\",\"tasks\":[[\"has\",{\"selector\":\"a[href^=\\\"https://group.intesasanpaolo.com/\\\"]\"}]]}"],["{\"selector\":\".article-blog-default\",\"tasks\":[[\"has\",{\"selector\":\"span\",\"tasks\":[[\"has-text\",\"CONTENUTO SPONSORIZZATO\"]]}]]}"],["{\"selector\":\".td_block_wrap\",\"tasks\":[[\"has\",{\"selector\":\".sponsor\"}]]}"],["{\"selector\":\".agi-article-card\",\"tasks\":[[\"has\",{\"selector\":\".article-category\",\"tasks\":[[\"has-text\",\"BRANDED CONTENT\"]]}]]}"],["{\"selector\":\".rowthumb\",\"tasks\":[[\"has\",{\"selector\":\"a[href]\"}]]}"],["{\"selector\":\".product-grid-column\",\"tasks\":[[\"has\",{\"selector\":\".product-tile__sponsored-it\"}]]}"],["{\"selector\":\".post.type-post.status-publish.format-standard\",\"tasks\":[[\"has\",{\"selector\":\".brandvoice\"}]]}"],["{\"selector\":\".wpb_wrapper > .td_block_wrap\",\"tasks\":[[\"has\",{\"selector\":\".sponsor\"}]]}"],["{\"selector\":\".td_block_wrap\",\"tasks\":[[\"has\",{\"selector\":\"span\",\"tasks\":[[\"has-text\",\"Contenuti sponsorizzati\"]]}]]}"],["{\"selector\":\".boxAnnunci\",\"tasks\":[[\"has\",{\"selector\":\"h4\",\"tasks\":[[\"has-text\",\"Annuncio pubblicitario\"]]}]]}"],["{\"selector\":\".testo > div\",\"tasks\":[[\"has\",{\"selector\":\"b\",\"tasks\":[[\"has-text\",\"PARTNERS COMMERCIALI\"]]}]]}"],["{\"selector\":\".cl-amp-important-information\",\"tasks\":[[\"has\",{\"selector\":\"div\",\"tasks\":[[\"has-text\",\"Annuncio pubblicitario\"]]}]]}","{\"selector\":\".custom-html\",\"tasks\":[[\"has\",{\"selector\":\"div\",\"tasks\":[[\"has-text\",\"Annuncio pubblicitario\"]]}]]}"],["{\"selector\":\".td_block_inner.td-mc1-wrap\",\"tasks\":[[\"has\",{\"selector\":\"a[href*=\\\"/pubbliredazionale/\\\"]\"}]]}"],["{\"selector\":\"div[style=\\\"min-height: 885px;\\\"]\",\"tasks\":[[\"has\",{\"selector\":\".advertisement-wrapper\"}]]}"],["{\"selector\":\".td_block_wrap\",\"tasks\":[[\"has\",{\"selector\":\"a\",\"tasks\":[[\"has-text\",\"Contenuti sponsorizzati\"]]}]]}"],["{\"selector\":\".lancio-adv\",\"tasks\":[[\"has\",{\"selector\":\"span.contenuto_sponsorizzato\"}]]}"],["{\"selector\":\"div[data-testid=\\\"section\\\"]\",\"tasks\":[[\"has\",{\"selector\":\"span\",\"tasks\":[[\"has-text\",\"Contenuto sponsorizzato\"]]}]]}"],["{\"selector\":\".flex.flex-col.space-y-3.relative\",\"tasks\":[[\"has\",{\"selector\":\".mr-2\"}]]}"],["{\"selector\":\".jeg_slide_item\",\"tasks\":[[\"has\",{\"selector\":\".category-sponsorizzate\"}]]}"],["{\"selector\":\".search-itm\",\"tasks\":[[\"has\",{\"selector\":\".search-itm__label\",\"tasks\":[[\"has-text\",\"annuncio\"]]}]]}"],["{\"selector\":\".similar-post-holder\",\"tasks\":[[\"has\",{\"selector\":\".categoria\",\"tasks\":[[\"has-text\",\"Post sponsorizzato\"]]}]]}","{\"selector\":\"article\",\"tasks\":[[\"has\",{\"selector\":\".featured + .spons-post\"}]]}"],["{\"selector\":\".feat-widget-wrap\",\"tasks\":[[\"has\",{\"selector\":\"div\",\"tasks\":[[\"has-text\",\"INFORMAZIONE REDAZIONALE\"]]}]]}"],["{\"selector\":\".td_block_wrap\",\"tasks\":[[\"has\",{\"selector\":\"span\",\"tasks\":[[\"has-text\",\"Advertorial\"]]}]]}"],["{\"selector\":\"center\",\"tasks\":[[\"has\",{\"selector\":\"a\",\"tasks\":[[\"has-text\",\"Esponi i tuoi banner sul forum\"]]}]]}"],["{\"selector\":\".article\",\"tasks\":[[\"has\",{\"selector\":\"div.categories\",\"tasks\":[[\"has-text\",\"pubbliredazionale\"]]}]]}"],["{\"selector\":\".card.dark\",\"tasks\":[[\"has\",{\"selector\":\"span\",\"tasks\":[[\"has-text\",\"Adv\"]]}]]}"]];

const hostnamesMap = new Map([["sportando.basketball",0],["investire.biz",1],["mediamarkt.ch",2],["mediaworld.it",2],["adnkronos.com",3],["cronacadiverona.com",4],["italpress.com",5],["lospiffero.com",6],["01health.it",7],["01net.it",7],["01smartlife.it",7],["agi.it",8],["cruiselifestyle.it",9],["douglas.it",10],["forbes.it",11],["freshpointmagazine.it",12],["ilprogettistaindustriale.it",13],["impiego24.it",14],["lalaziosiamonoi.it",15],["laleggepertutti.it",16],["ledicoladelsud.it",17],["liberoquotidiano.it",18],["logisticanews.it",19],["sportmediaset.mediaset.it",20],["tgcom24.mediaset.it",21],["money.it",22],["orvietosi.it",23],["paginegialle.it",24],["pharmacyscanner.it",25],["radioluna.it",26],["technofashion.it",27],["guadagna.net",28],["ilpiccolo.net",29],["tuttoandroid.net",30]]);

const entitiesMap = new Map(undefined);

const exceptionsMap = new Map(undefined);

self.proceduralImports = self.proceduralImports || [];
self.proceduralImports.push({ argsList, hostnamesMap, entitiesMap, exceptionsMap });

/******************************************************************************/

})();

/******************************************************************************/
