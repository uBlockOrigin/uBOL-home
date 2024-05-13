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

// ruleset: spa-0

/******************************************************************************/

// Important!
// Isolate from global scope
(function uBOL_cssProceduralImport() {

/******************************************************************************/

const argsList = [["{\"selector\":\".clearfix.list-cards.mb1.section-ciudadanos\",\"tasks\":[[\"has\",{\"selector\":\".title\",\"tasks\":[[\"has-text\",\"Espacio de marca\"]]}]]}"],["{\"selector\":\".ui-recommendations-carousel-wrapper-ref\",\"tasks\":[[\"has\",{\"selector\":\"a[rel=\\\"nofollow, sponsored\\\"]\"}]]}","{\"selector\":\"li.ui-search-layout__item\",\"tasks\":[[\"has\",{\"selector\":\"div.ui-search-item__pub-container\"}]]}"],["{\"selector\":\".widget-content\",\"tasks\":[[\"has\",{\"selector\":\"a[target=\\\"_blank\\\"]\"}]]}"],["{\"selector\":\".s.s--v\",\"tasks\":[[\"has\",{\"selector\":\"span\",\"tasks\":[[\"has-text\",\"OFRECIDO POR\"]]}]]}"],["{\"selector\":\".column > div[class] > div[class^=\\\"sc-\\\"]\",\"tasks\":[[\"has\",{\"selector\":\"div[class^=\\\"sc-\\\"] > div[id^=\\\"div-gpt-ad\\\"]\"}]]}","{\"selector\":\"div[class^=\\\"sc-\\\"]\",\"tasks\":[[\"has\",{\"selector\":\"> div[id^=\\\"div-gpt-ad\\\"]\"}]]}"],["{\"selector\":\".wide-content\",\"tasks\":[[\"has\",{\"selector\":\"h1\",\"tasks\":[[\"has-text\",\"Publicidad\"]]}]]}"],["{\"selector\":\".Block\",\"tasks\":[[\"has\",{\"selector\":\".Title_section\",\"tasks\":[[\"has-text\",\"Contenido patrocinado\"]]}]]}","{\"selector\":\".Card\",\"tasks\":[[\"has\",{\"selector\":\".Card-Section.Section\",\"tasks\":[[\"has-text\",\"Contenido patrocinado\"]]}]]}"],["{\"selector\":\"span\",\"tasks\":[[\"has-text\",\"PUBLICIDAD\"]]}"],["{\"selector\":\".main-article-container-patr\",\"tasks\":[[\"has\",{\"selector\":\".contenido-comercial\"}]]}","{\"selector\":\".main-article-container-patr\",\"tasks\":[[\"has\",{\"selector\":\".mas-contenido\",\"tasks\":[[\"has-text\",\"Más Contenido\"]]}]]}"],["{\"selector\":\"#sidebar > div > section\",\"tasks\":[[\"has\",{\"selector\":\".fixed_adslot\"}]]}"],["{\"selector\":\".md.md-news-main\",\"tasks\":[[\"has\",{\"selector\":\".kicker\",\"tasks\":[[\"has-text\",\"CONTENIDO OFRECIDO POR\"]]}]]}"],["{\"selector\":\"div[class^=\\\"embed-card_card_\\\"]\",\"tasks\":[[\"has\",{\"selector\":\"a[href^=\\\"http://disneyplus.bn5x.net/\\\"]\"}]]}"],["{\"selector\":\".display-ads\",\"tasks\":[[\"has\",{\"selector\":\"> span\",\"tasks\":[[\"has-text\",\"Anuncio\"]]}]]}"],["{\"selector\":\".et_pb_column\",\"tasks\":[[\"has\",{\"selector\":\"p\",\"tasks\":[[\"has-text\",\"Publicidad\"]]}]]}"],["{\"selector\":\".c.d1\",\"tasks\":[[\"has\",{\"selector\":\"div\",\"tasks\":[[\"has-text\",\"Más cosas interesantes\"]]}]]}"],["{\"selector\":\"section > h3\",\"tasks\":[[\"has-text\",\"Publicidad\"]]}"],["{\"selector\":\".section\",\"tasks\":[[\"has\",{\"selector\":\".section-subtitle\",\"tasks\":[[\"has-text\",\"Contenido en colaboración\"]]}]]}"],["{\"selector\":\".tno-article-block\",\"tasks\":[[\"has\",{\"selector\":\"span\",\"tasks\":[[\"has-text\",\"Branded content\"]]}]]}"],["{\"selector\":\"span\",\"tasks\":[[\"has-text\",\"Publicidad\"]]}"],["{\"selector\":\"td[class*=\\\"id_publi_\\\"]\",\"tasks\":[[\"has\",{\"selector\":\"img[alt=\\\"publicidad\\\"]\"}]]}"],["{\"selector\":\".l-resultsList__item\",\"tasks\":[[\"has\",{\"selector\":\".kl-blade--sponsored\"}]]}"],["{\"selector\":\"[data-test=\\\"mms-product-card\\\"]\",\"tasks\":[[\"has\",{\"selector\":\"[data-test=\\\"mms-plp-presented\\\"]\"}]]}"],["{\"selector\":\"td[class*=\\\"id_publi_\\\"]\",\"tasks\":[[\"has\",{\"selector\":\"a[href^=\\\"https://www.amazon.es/\\\"]\"}]]}"],["{\"selector\":\".quicklink_w100\",\"tasks\":[[\"has\",{\"selector\":\".publi-tag\",\"tasks\":[[\"has-text\",\"AD\"]]}]]}"],["{\"selector\":\".col-md-4.col-12.three-column-item\",\"tasks\":[[\"has\",{\"selector\":\".presentado-por\"}]]}"],["{\"selector\":\"[data-testid=\\\"item-stack\\\"] > div\",\"tasks\":[[\"has-text\",\"Patrocinado\"]]}"],["{\"selector\":\".block\",\"tasks\":[[\"has\",{\"selector\":\"> h3\",\"tasks\":[[\"has-text\",\"WEBCAM PORNO XXX\"]]}]]}"],["{\"selector\":\"#lateral\",\"tasks\":[[\"has\",{\"selector\":\"span\",\"tasks\":[[\"has-text\",\"Auspiciado por:\"]]}]]}"],["{\"selector\":\".dropdown\",\"tasks\":[[\"has\",{\"selector\":\"label\",\"tasks\":[[\"has-text\",\"VPN\"]]}]]}"],["{\"selector\":\".Page-above.loaded\",\"tasks\":[[\"has\",{\"selector\":\"div[class^=\\\"GoogleDfpAd\\\"]\"}]]}","{\"selector\":\".PromoBasic\",\"tasks\":[[\"has\",{\"selector\":\".Promo-sponsor\"}]]}"]];

const hostnamesMap = new Map([["lavoz.com.ar",0],["mercadolibre.com.ar",1],["mercadolibre.com.bo",1],["mercadolibre.cl",1],["mercadolibre.com.co",1],["mercadolibre.co.cr",1],["mercadolibre.com.do",1],["mercadolibre.com.ec",1],["mercadolibre.com.gt",1],["mercadolibre.com.hn",1],["mercadolibre.com.mx",1],["mercadolibre.com.ni",1],["mercadolibre.com.pa",1],["mercadolibre.com.pe",1],["mercadolibre.com.py",1],["mercadolibre.com.sv",1],["mercadolibre.com.uy",1],["mercadolibre.com.ve",1],["periodismokosher.com.ar",2],["as.com",3],["clarin.com",4],["diarios-argentinos.com",5],["elespectador.com",6],["elquindiano.com",7],["laboyanos.com",7],["eltiempo.com",8],["forocoches.com",9],["granadahoy.com",10],["diariodealmeria.es",10],["diariodecadiz.es",10],["diariodejerez.es",10],["diariodesevilla.es",10],["eldiadecordoba.es",10],["europasur.es",10],["huelvainformacion.es",10],["malagahoy.es",10],["hobbyconsolas.com",11],["juegosdiarios.com",12],["mundo724.com",13],["muyzorras.com",14],["recetasfacilescocina.com",15],["semana.com",16],["theobjective.com",17],["hoy.com.do",18],["cuencanews.es",19],["leroymerlin.es",20],["mediamarkt.es",21],["mil21.es",22],["yorokobu.es",23],["businessinsider.mx",24],["walmart.com.mx",25],["videospornogratisx.net",26],["elcomercio.pe",27],["photocall.tv",28],["elpais.com.uy",29]]);

const entitiesMap = new Map(undefined);

const exceptionsMap = new Map(undefined);

self.proceduralImports = self.proceduralImports || [];
self.proceduralImports.push({ argsList, hostnamesMap, entitiesMap, exceptionsMap });

/******************************************************************************/

})();

/******************************************************************************/
