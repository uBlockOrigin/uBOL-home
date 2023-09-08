/*******************************************************************************

    uBlock Origin - a browser extension to block requests.
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

const argsList = [["{\"selector\":\".widget.widget_block\",\"tasks\":[[\"has\",{\"selector\":\"a[target=\\\"_blank\\\"]\"}]]}"],["{\"selector\":\".card.shadowLink\",\"tasks\":[[\"has\",{\"selector\":\"#ContentPlaceHolder1_rptAzzMain_btn_0\"}]]}","{\"selector\":\".container-fluid.py-3.bg-white-color.pl-5.pr-5\",\"tasks\":[[\"has\",{\"selector\":\".text-black.weight-400.mb-0\",\"tasks\":[[\"has-text\",\"I Nostri Partners\"]]}]]}"],["{\"selector\":\".td_block_template_1\",\"tasks\":[[\"has\",{\"selector\":\".td-block-title-wrap\",\"tasks\":[[\"has-text\",\"Banner\"]]}]]}"],["{\"selector\":\".ruby-block-wrap\",\"tasks\":[[\"has\",{\"selector\":\"a\",\"tasks\":[[\"has-text\",\"SPONSORED\"]]}]]}"],["{\"selector\":\".td-block-row\",\"tasks\":[[\"has\",{\"selector\":\"a[href^=\\\"https://group.intesasanpaolo.com/\\\"]\"}]]}"],["{\"selector\":\".post.type-post.consigliato\",\"tasks\":[[\"has\",{\"selector\":\"a\",\"tasks\":[[\"has-text\",\"Sponsorizzato\"]]}]]}"],["{\"selector\":\".article-blog-default\",\"tasks\":[[\"has\",{\"selector\":\"span\",\"tasks\":[[\"has-text\",\"CONTENUTO SPONSORIZZATO\"]]}]]}"],["{\"selector\":\".td_block_wrap\",\"tasks\":[[\"has\",{\"selector\":\"a\",\"tasks\":[[\"has-text\",\"Contenuti sponsorizzati\"]]}]]}"],["{\"selector\":\".sidebar-block\",\"tasks\":[[\"has\",{\"selector\":\"a[href^=\\\"https://track.webgains.com/click.html\\\"]\"}]]}"],["{\"selector\":\".col-12.text-center\",\"tasks\":[[\"has\",{\"selector\":\".special\",\"tasks\":[[\"has-text\",\"Contenuto Sponsorizzato\"]]}]]}","{\"selector\":\".media-imgnews\",\"tasks\":[[\"has\",{\"selector\":\"span\",\"tasks\":[[\"has-text\",\"Contenuto Sponsorizzato\"]]}]]}"],["{\"selector\":\".mtop.mbottom.tcc-screen\",\"tasks\":[[\"has\",{\"selector\":\".adv_margin\"}]]}"],["{\"selector\":\".homearticle-box\",\"tasks\":[[\"has\",{\"selector\":\"strong\",\"tasks\":[[\"has-text\",\"sponsorizzato\"]]}]]}"],["{\"selector\":\".td_block_wrap\",\"tasks\":[[\"has\",{\"selector\":\".sponsor\"}]]}"],["{\"selector\":\".wp-block-group__inner-container\",\"tasks\":[[\"has\",{\"selector\":\"a[href^=\\\"https://www.appscommesse.com/\\\"]\"}]]}"],["{\"selector\":\".m-relases__result\",\"tasks\":[[\"has\",{\"selector\":\"div\",\"tasks\":[[\"has-text\",\"Contenuto pubblicitario\"]]}]]}"],["{\"selector\":\".experience-component_hp_push_promo\",\"tasks\":[[\"has\",{\"selector\":\"#viewHomeDesktop-middleSp-sponsored_products-0\"}]]}"],["{\"selector\":\".rowthumb\",\"tasks\":[[\"has\",{\"selector\":\"a[href]\"}]]}"],["{\"selector\":\".s-item\",\"tasks\":[[\"has\",{\"selector\":\"span.s-item__title--tagblock__SPONSORED\"}]]}"],["{\"selector\":\".section-articles--advertising\",\"tasks\":[[\"has\",{\"selector\":\".sponsored\"}]]}"],["{\"selector\":\".my-2.flex.items-center.justify-center\",\"tasks\":[[\"has\",{\"selector\":\"a[href^=\\\"https://prf.hn/\\\"]\"}]]}"],["{\"selector\":\".post.type-post.status-publish.format-standard\",\"tasks\":[[\"has\",{\"selector\":\".brandvoice\"}]]}"],["{\"selector\":\".wpb_wrapper > .td_block_wrap\",\"tasks\":[[\"has\",{\"selector\":\".sponsor\"}]]}"],["{\"selector\":\".td_block_wrap\",\"tasks\":[[\"has\",{\"selector\":\"span\",\"tasks\":[[\"has-text\",\"Contenuti sponsorizzati\"]]}]]}"],["{\"selector\":\".cl-amp-important-information\",\"tasks\":[[\"has\",{\"selector\":\"div\",\"tasks\":[[\"has-text\",\"Annuncio pubblicitario\"]]}]]}","{\"selector\":\".custom-html\",\"tasks\":[[\"has\",{\"selector\":\"div\",\"tasks\":[[\"has-text\",\"Annuncio pubblicitario\"]]}]]}"],["{\"selector\":\"article\",\"tasks\":[[\"has\",{\"selector\":\"p\",\"tasks\":[[\"has-text\",\"Sponsorizzata\"]]}]]}"],["{\"selector\":\".row-inner\",\"tasks\":[[\"has\",{\"selector\":\"h2\",\"tasks\":[[\"has-text\",\"Branded\"]]}]]}"],["{\"selector\":\".bx\",\"tasks\":[[\"has\",{\"selector\":\"div\",\"tasks\":[[\"has-text\",\"CONTENUTO SPONSORIZZATO\"]]}]]}"],["{\"selector\":\".right.es.large\",\"tasks\":[[\"has\",{\"selector\":\"span\",\"tasks\":[[\"has-text\",\"contenuto sponsorizzato\"]]}]]}"],["{\"selector\":\".container-fluid.bg-light-green.section-articles\",\"tasks\":[[\"has\",{\"selector\":\"a[href^=\\\"https://group.intesasanpaolo.com/\\\"]\"}]]}"],["{\"selector\":\".flex.flex-col.space-y-3.relative\",\"tasks\":[[\"has\",{\"selector\":\".mr-2\"}]]}"],["{\"selector\":\".arel\",\"tasks\":[[\"has\",{\"selector\":\"a[href^=\\\"https://www.ebay.it/\\\"]\"}]]}"],["{\"selector\":\".sal-list-item\",\"tasks\":[[\"has\",{\"selector\":\".sal-is-special\"}]]}"],["{\"selector\":\".jeg_slide_item\",\"tasks\":[[\"has\",{\"selector\":\".category-sponsorizzate\"}]]}"],["{\"selector\":\".list-element.list-element--free\",\"tasks\":[[\"has\",{\"selector\":\".list-element__label--annuncio\"}]]}"],["{\"selector\":\".c-post\",\"tasks\":[[\"has\",{\"selector\":\"a\",\"tasks\":[[\"has-text\",\"Sponsored by \"]]}]]}"],["{\"selector\":\".et_pb_css_mix_blend_mode_passthrough\",\"tasks\":[[\"has-text\",\"Sponsorizzato\"]]}"],["{\"selector\":\".feat-widget-wrap\",\"tasks\":[[\"has\",{\"selector\":\"div\",\"tasks\":[[\"has-text\",\"INFORMAZIONE REDAZIONALE\"]]}]]}"],["{\"selector\":\".c-card.c-card--CA10-m.c-card--CA10-t.c-card--CA10-d.c-card--base\",\"tasks\":[[\"has\",{\"selector\":\".c-label--article-sponsored\"}]]}"],["{\"selector\":\".td_block_wrap\",\"tasks\":[[\"has\",{\"selector\":\"span\",\"tasks\":[[\"has-text\",\"Advertorial\"]]}]]}"],["{\"selector\":\".listed.small\",\"tasks\":[[\"has\",{\"selector\":\"a\",\"tasks\":[[\"has-text\",\"Informazione Pubblicitaria\"]]}]]}"],["{\"selector\":\"center\",\"tasks\":[[\"has\",{\"selector\":\"a\",\"tasks\":[[\"has-text\",\"Esponi i tuoi banner sul forum\"]]}]]}"],["{\"selector\":\"article[id^=\\\"post-\\\"]\",\"tasks\":[[\"has\",{\"selector\":\"span\",\"tasks\":[[\"has-text\",\"Adv\"]]}]]}"],["{\"selector\":\".news\",\"tasks\":[[\"has\",{\"selector\":\"div\",\"tasks\":[[\"has-text\",\"in collaborazione con \"]]}]]}"],["{\"selector\":\"div[class^=\\\"css-\\\"]\",\"tasks\":[[\"has\",{\"selector\":\"a\",\"tasks\":[[\"has-text\",\"contenuto sponsorizzato\"]]}]]}"]];

const hostnamesMap = new Map([["sportando.basketball",0],["investire.biz",1],["cronacadiverona.com",2],["innaturale.com",3],["italpress.com",4],["lavocedinovara.com",5],["lospiffero.com",6],["meccanicanews.com",7],["logisticanews.it",7],["metalitalia.com",8],["mffashion.com",9],["tuttomercatoweb.com",10],["tusciaweb.eu",11],["01health.it",12],["01net.it",12],["01smartlife.it",12],["androidplanet.it",13],["borsaitaliana.it",14],["carrefour.it",15],["cruiselifestyle.it",16],["ebay.it",17],["ecodibergamo.it",18],["eurosport.it",19],["forbes.it",20],["freshpointmagazine.it",21],["ilprogettistaindustriale.it",22],["plastix.it",22],["laleggepertutti.it",23],["lasicilia.it",24],["linkiesta.it",25],["iene.mediaset.it",26],["tgcom24.mediaset.it",27],["milanofinanza.it",28],["money.it",29],["moto.it",30],["my-personaltrainer.it",31],["orvietosi.it",32],["paginegialle.it",33],["quattroruote.it",34],["quotidianodelsud.it",35],["radioluna.it",36],["tg24.sky.it",37],["technofashion.it",38],["zonalocale.it",39],["guadagna.net",40],["tuttoandroid.net",41],["open.online",42],["aleteia.org",43]]);

const entitiesMap = new Map(undefined);

const exceptionsMap = new Map(undefined);

self.proceduralImports = self.proceduralImports || [];
self.proceduralImports.push({ argsList, hostnamesMap, entitiesMap, exceptionsMap });

/******************************************************************************/

})();

/******************************************************************************/
