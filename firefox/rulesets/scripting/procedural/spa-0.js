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

const argsList = [["{\"selector\":\".ui-recommendations-carousel-wrapper-ref\",\"tasks\":[[\"has\",{\"selector\":\"a[rel=\\\"nofollow, sponsored\\\"]\"}]]}","{\"selector\":\"li.ui-search-layout__item\",\"tasks\":[[\"has\",{\"selector\":\"div.ui-search-item__pub-container\"}]]}"],["{\"selector\":\".widget-content\",\"tasks\":[[\"has\",{\"selector\":\"a[target=\\\"_blank\\\"]\"}]]}"],["{\"selector\":\".s.s--v\",\"tasks\":[[\"has\",{\"selector\":\"span\",\"tasks\":[[\"has-text\",\"OFRECIDO POR\"]]}]]}"],["{\"selector\":\".column > div[class] > div[class^=\\\"sc-\\\"]\",\"tasks\":[[\"has\",{\"selector\":\"div[class^=\\\"sc-\\\"] > div[id^=\\\"div-gpt-ad\\\"]\"}]]}","{\"selector\":\"div[class^=\\\"sc-\\\"]\",\"tasks\":[[\"has\",{\"selector\":\"> div[id^=\\\"div-gpt-ad\\\"]\"}]]}"],["{\"selector\":\".wide-content\",\"tasks\":[[\"has\",{\"selector\":\"h1\",\"tasks\":[[\"has-text\",\"Publicidad\"]]}]]}"],["{\"selector\":\".Block\",\"tasks\":[[\"has\",{\"selector\":\".Title_section\",\"tasks\":[[\"has-text\",\"Contenido patrocinado\"]]}]]}","{\"selector\":\".Card\",\"tasks\":[[\"has\",{\"selector\":\".Card-Section.Section\",\"tasks\":[[\"has-text\",\"Contenido patrocinado\"]]}]]}"],["{\"selector\":\"span\",\"tasks\":[[\"has-text\",\"PUBLICIDAD\"]]}"],["{\"selector\":\".main-article-container-patr\",\"tasks\":[[\"has\",{\"selector\":\".contenido-comercial\"}]]}","{\"selector\":\".main-article-container-patr\",\"tasks\":[[\"has\",{\"selector\":\".mas-contenido\",\"tasks\":[[\"has-text\",\"Más Contenido\"]]}]]}"],["{\"selector\":\"#sidebar > div > section\",\"tasks\":[[\"has\",{\"selector\":\".fixed_adslot\"}]]}"],["{\"selector\":\".md.md-news-main\",\"tasks\":[[\"has\",{\"selector\":\".kicker\",\"tasks\":[[\"has-text\",\"CONTENIDO OFRECIDO POR\"]]}]]}"],["{\"selector\":\"div[class^=\\\"embed-card_card_\\\"]\",\"tasks\":[[\"has\",{\"selector\":\"a[href^=\\\"http://disneyplus.bn5x.net/\\\"]\"}]]}"],["{\"selector\":\".display-ads\",\"tasks\":[[\"has\",{\"selector\":\"> span\",\"tasks\":[[\"has-text\",\"Anuncio\"]]}]]}"],["{\"selector\":\".et_pb_column\",\"tasks\":[[\"has\",{\"selector\":\"p\",\"tasks\":[[\"has-text\",\"Publicidad\"]]}]]}"],["{\"selector\":\".c.d1\",\"tasks\":[[\"has\",{\"selector\":\"div\",\"tasks\":[[\"has-text\",\"Más cosas interesantes\"]]}]]}"],["{\"selector\":\"section > h3\",\"tasks\":[[\"has-text\",\"Publicidad\"]]}"],["{\"selector\":\".section\",\"tasks\":[[\"has\",{\"selector\":\".section-subtitle\",\"tasks\":[[\"has-text\",\"Contenido en colaboración\"]]}]]}"],["{\"selector\":\".tno-article-block\",\"tasks\":[[\"has\",{\"selector\":\"span\",\"tasks\":[[\"has-text\",\"Branded content\"]]}]]}"],["{\"selector\":\"span\",\"tasks\":[[\"has-text\",\"Publicidad\"]]}"],["{\"selector\":\"td[class*=\\\"id_publi_\\\"]\",\"tasks\":[[\"has\",{\"selector\":\"img[alt=\\\"publicidad\\\"]\"}]]}"],["{\"selector\":\"td[class*=\\\"id_publi_\\\"]\",\"tasks\":[[\"has\",{\"selector\":\"a[href^=\\\"https://www.amazon.es/\\\"]\"}]]}"],["{\"selector\":\".quicklink_w100\",\"tasks\":[[\"has\",{\"selector\":\".publi-tag\",\"tasks\":[[\"has-text\",\"AD\"]]}]]}"],["{\"selector\":\".block\",\"tasks\":[[\"has\",{\"selector\":\"> h3\",\"tasks\":[[\"has-text\",\"WEBCAM PORNO XXX\"]]}]]}"],["{\"selector\":\"#lateral\",\"tasks\":[[\"has\",{\"selector\":\"span\",\"tasks\":[[\"has-text\",\"Auspiciado por:\"]]}]]}"],["{\"selector\":\".dropdown\",\"tasks\":[[\"has\",{\"selector\":\"label\",\"tasks\":[[\"has-text\",\"VPN\"]]}]]}"],["{\"selector\":\".Page-above.loaded\",\"tasks\":[[\"has\",{\"selector\":\"div[class^=\\\"GoogleDfpAd\\\"]\"}]]}"]];

const hostnamesMap = new Map([["mercadolibre.com.ar",0],["mercadolibre.com.bo",0],["mercadolibre.cl",0],["mercadolibre.com.co",0],["mercadolibre.co.cr",0],["mercadolibre.com.do",0],["mercadolibre.com.ec",0],["mercadolibre.com.gt",0],["mercadolibre.com.hn",0],["mercadolibre.com.mx",0],["mercadolibre.com.ni",0],["mercadolibre.com.pa",0],["mercadolibre.com.pe",0],["mercadolibre.com.py",0],["mercadolibre.com.sv",0],["mercadolibre.com.uy",0],["mercadolibre.com.ve",0],["periodismokosher.com.ar",1],["as.com",2],["clarin.com",3],["diarios-argentinos.com",4],["elespectador.com",5],["elquindiano.com",6],["laboyanos.com",6],["eltiempo.com",7],["forocoches.com",8],["granadahoy.com",9],["diariodealmeria.es",9],["diariodecadiz.es",9],["diariodejerez.es",9],["diariodesevilla.es",9],["eldiadecordoba.es",9],["europasur.es",9],["huelvainformacion.es",9],["malagahoy.es",9],["hobbyconsolas.com",10],["juegosdiarios.com",11],["mundo724.com",12],["muyzorras.com",13],["recetasfacilescocina.com",14],["semana.com",15],["theobjective.com",16],["hoy.com.do",17],["cuencanews.es",18],["mil21.es",19],["yorokobu.es",20],["videospornogratisx.net",21],["elcomercio.pe",22],["photocall.tv",23],["elpais.com.uy",24]]);

const entitiesMap = new Map(undefined);

const exceptionsMap = new Map(undefined);

self.proceduralImports = self.proceduralImports || [];
self.proceduralImports.push({ argsList, hostnamesMap, entitiesMap, exceptionsMap });

/******************************************************************************/

})();

/******************************************************************************/
