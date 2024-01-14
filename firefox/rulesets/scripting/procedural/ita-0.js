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

const argsList = [["{\"selector\":\".widget.widget_block\",\"tasks\":[[\"has\",{\"selector\":\"a[href^=\\\"https://betsquare.com/\\\"]\"}]]}"],["{\"selector\":\".card.shadowLink\",\"tasks\":[[\"has\",{\"selector\":\"#ContentPlaceHolder1_rptAzzMain_btn_0\"}]]}","{\"selector\":\".container-fluid.py-3.bg-white-color.pl-5.pr-5\",\"tasks\":[[\"has\",{\"selector\":\".text-black.weight-400.mb-0\",\"tasks\":[[\"has-text\",\"I Nostri Partners\"]]}]]}"],["{\"selector\":\".cont-ev-list\",\"tasks\":[[\"has\",{\"selector\":\".title-channel\",\"tasks\":[[\"has-text\",\"in Evidenza\"]]}]]}"],["{\"selector\":\".td_block_template_1\",\"tasks\":[[\"has\",{\"selector\":\".td-block-title-wrap\",\"tasks\":[[\"has-text\",\"Banner\"]]}]]}"],["{\"selector\":\".td-block-row\",\"tasks\":[[\"has\",{\"selector\":\"a[href^=\\\"https://group.intesasanpaolo.com/\\\"]\"}]]}"],["{\"selector\":\".article-blog-default\",\"tasks\":[[\"has\",{\"selector\":\"span\",\"tasks\":[[\"has-text\",\"CONTENUTO SPONSORIZZATO\"]]}]]}"],["{\"selector\":\".td_block_wrap\",\"tasks\":[[\"has\",{\"selector\":\".sponsor\"}]]}"],["{\"selector\":\".agi-article-card\",\"tasks\":[[\"has\",{\"selector\":\".article-category\",\"tasks\":[[\"has-text\",\"BRANDED CONTENT\"]]}]]}"],["{\"selector\":\".rowthumb\",\"tasks\":[[\"has\",{\"selector\":\"a[href]\"}]]}"],["{\"selector\":\".post.type-post.status-publish.format-standard\",\"tasks\":[[\"has\",{\"selector\":\".brandvoice\"}]]}"],["{\"selector\":\".wpb_wrapper > .td_block_wrap\",\"tasks\":[[\"has\",{\"selector\":\".sponsor\"}]]}"],["{\"selector\":\".td_block_wrap\",\"tasks\":[[\"has\",{\"selector\":\"span\",\"tasks\":[[\"has-text\",\"Contenuti sponsorizzati\"]]}]]}"],["{\"selector\":\".cl-amp-important-information\",\"tasks\":[[\"has\",{\"selector\":\"div\",\"tasks\":[[\"has-text\",\"Annuncio pubblicitario\"]]}]]}","{\"selector\":\".custom-html\",\"tasks\":[[\"has\",{\"selector\":\"div\",\"tasks\":[[\"has-text\",\"Annuncio pubblicitario\"]]}]]}"],["{\"selector\":\".td_block_wrap\",\"tasks\":[[\"has\",{\"selector\":\"a\",\"tasks\":[[\"has-text\",\"Contenuti sponsorizzati\"]]}]]}"],["{\"selector\":\".right.es.large\",\"tasks\":[[\"has\",{\"selector\":\"span\",\"tasks\":[[\"has-text\",\"contenuto sponsorizzato\"]]}]]}"],["{\"selector\":\".flex.flex-col.space-y-3.relative\",\"tasks\":[[\"has\",{\"selector\":\".mr-2\"}]]}"],["{\"selector\":\".jeg_slide_item\",\"tasks\":[[\"has\",{\"selector\":\".category-sponsorizzate\"}]]}"],["{\"selector\":\".search-itm\",\"tasks\":[[\"has\",{\"selector\":\".search-itm__label\",\"tasks\":[[\"has-text\",\"annuncio\"]]}]]}"],["{\"selector\":\".similar-post-holder\",\"tasks\":[[\"has\",{\"selector\":\".categoria\",\"tasks\":[[\"has-text\",\"Post sponsorizzato\"]]}]]}","{\"selector\":\"article\",\"tasks\":[[\"has\",{\"selector\":\".featured + .spons-post\"}]]}"],["{\"selector\":\".feat-widget-wrap\",\"tasks\":[[\"has\",{\"selector\":\"div\",\"tasks\":[[\"has-text\",\"INFORMAZIONE REDAZIONALE\"]]}]]}"],["{\"selector\":\".td_block_wrap\",\"tasks\":[[\"has\",{\"selector\":\"span\",\"tasks\":[[\"has-text\",\"Advertorial\"]]}]]}"],["{\"selector\":\"center\",\"tasks\":[[\"has\",{\"selector\":\"a\",\"tasks\":[[\"has-text\",\"Esponi i tuoi banner sul forum\"]]}]]}"],["{\"selector\":\".card.dark\",\"tasks\":[[\"has\",{\"selector\":\"span\",\"tasks\":[[\"has-text\",\"Adv\"]]}]]}"]];

const hostnamesMap = new Map([["sportando.basketball",0],["investire.biz",1],["adnkronos.com",2],["cronacadiverona.com",3],["italpress.com",4],["lospiffero.com",5],["01health.it",6],["01net.it",6],["01smartlife.it",6],["agi.it",7],["cruiselifestyle.it",8],["forbes.it",9],["freshpointmagazine.it",10],["ilprogettistaindustriale.it",11],["laleggepertutti.it",12],["logisticanews.it",13],["tgcom24.mediaset.it",14],["money.it",15],["orvietosi.it",16],["paginegialle.it",17],["pharmacyscanner.it",18],["radioluna.it",19],["technofashion.it",20],["guadagna.net",21],["tuttoandroid.net",22]]);

const entitiesMap = new Map(undefined);

const exceptionsMap = new Map(undefined);

self.proceduralImports = self.proceduralImports || [];
self.proceduralImports.push({ argsList, hostnamesMap, entitiesMap, exceptionsMap });

/******************************************************************************/

})();

/******************************************************************************/
