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

const argsList = [["{\"selector\":\".s.s--v\",\"tasks\":[[\"has\",{\"selector\":\"span\",\"tasks\":[[\"has-text\",\"OFRECIDO POR\"]]}]]}"],["{\"selector\":\".wide-content\",\"tasks\":[[\"has\",{\"selector\":\"h1\",\"tasks\":[[\"has-text\",\"Publicidad\"]]}]]}"],["{\"selector\":\".Block\",\"tasks\":[[\"has\",{\"selector\":\".Title_section\",\"tasks\":[[\"has-text\",\"Contenido patrocinado\"]]}]]}","{\"selector\":\".Card\",\"tasks\":[[\"has\",{\"selector\":\".Card-Section.Section\",\"tasks\":[[\"has-text\",\"Contenido patrocinado\"]]}]]}"],["{\"selector\":\"span\",\"tasks\":[[\"has-text\",\"PUBLICIDAD\"]]}"],["{\"selector\":\".main-article-container-patr\",\"tasks\":[[\"has\",{\"selector\":\".mas-contenido\",\"tasks\":[[\"has-text\",\"Más Contenido\"]]}]]}"],["{\"selector\":\".display-ads\",\"tasks\":[[\"has\",{\"selector\":\"> span\",\"tasks\":[[\"has-text\",\"Anuncio\"]]}]]}"],["{\"selector\":\".et_pb_column\",\"tasks\":[[\"has\",{\"selector\":\"p\",\"tasks\":[[\"has-text\",\"Publicidad\"]]}]]}"],["{\"selector\":\".c.d1\",\"tasks\":[[\"has\",{\"selector\":\"div\",\"tasks\":[[\"has-text\",\"Más cosas interesantes\"]]}]]}"],["{\"selector\":\"section > h3\",\"tasks\":[[\"has-text\",\"Publicidad\"]]}"],["{\"selector\":\".section\",\"tasks\":[[\"has\",{\"selector\":\".section-subtitle\",\"tasks\":[[\"has-text\",\"Contenido en colaboración\"]]}]]}"],["{\"selector\":\".tno-article-block\",\"tasks\":[[\"has\",{\"selector\":\"span\",\"tasks\":[[\"has-text\",\"Branded content\"]]}]]}"],["{\"selector\":\"span\",\"tasks\":[[\"has-text\",\"Publicidad\"]]}"],["{\"selector\":\".quicklink_w100\",\"tasks\":[[\"has\",{\"selector\":\".publi-tag\",\"tasks\":[[\"has-text\",\"AD\"]]}]]}"],["{\"selector\":\".block\",\"tasks\":[[\"has\",{\"selector\":\"> h3\",\"tasks\":[[\"has-text\",\"WEBCAM PORNO XXX\"]]}]]}"],["{\"selector\":\"#lateral\",\"tasks\":[[\"has\",{\"selector\":\"span\",\"tasks\":[[\"has-text\",\"Auspiciado por:\"]]}]]}"],["{\"selector\":\".dropdown\",\"tasks\":[[\"has\",{\"selector\":\"label\",\"tasks\":[[\"has-text\",\"VPN\"]]}]]}"]];

const hostnamesMap = new Map([["as.com",0],["diarios-argentinos.com",1],["elespectador.com",2],["elquindiano.com",3],["laboyanos.com",3],["eltiempo.com",4],["juegosdiarios.com",5],["mundo724.com",6],["muyzorras.com",7],["recetasfacilescocina.com",8],["semana.com",9],["theobjective.com",10],["hoy.com.do",11],["yorokobu.es",12],["videospornogratisx.net",13],["elcomercio.pe",14],["photocall.tv",15]]);

const entitiesMap = new Map(undefined);

const exceptionsMap = new Map(undefined);

self.proceduralImports = self.proceduralImports || [];
self.proceduralImports.push({ argsList, hostnamesMap, entitiesMap, exceptionsMap });

/******************************************************************************/

})();

/******************************************************************************/
