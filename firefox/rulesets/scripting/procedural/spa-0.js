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

// ruleset: spa-0

/******************************************************************************/

// Important!
// Isolate from global scope
(function uBOL_cssProceduralImport() {

/******************************************************************************/

const argsList = [["{\"selector\":\".widget-container\",\"tasks\":[[\"has\",{\"selector\":\".banners-125\"}]]}","{\"selector\":\".widget-container\",\"tasks\":[[\"has\",{\"selector\":\".metaslider\"}]]}","{\"selector\":\".widget-container\",\"tasks\":[[\"has\",{\"selector\":\".widget_random_banner_widget\"}]]}"],["{\"selector\":\".widget_media_image\",\"tasks\":[[\"has\",{\"selector\":\"span\",\"tasks\":[[\"has-text\",\"Publicidad\"]]}]]}"],["{\"selector\":\".widget_metaslider_widget\",\"tasks\":[[\"has-text\",\"ESPACIO PUBLICITARIO\"]]}"],["{\"selector\":\".ui-recommendations-carousel-wrapper-ref\",\"tasks\":[[\"has\",{\"selector\":\"a[rel=\\\"nofollow, sponsored\\\"]\"}]]}","{\"selector\":\"li.ui-search-layout__item\",\"tasks\":[[\"has\",{\"selector\":\"div.ui-search-item__pub-container > a[href^=\\\"https://ads.mercadolibre\\\"]\"}]]}","{\"selector\":\"li.ui-search-layout__item\",\"tasks\":[[\"has\",{\"selector\":\"div.ui-search-item__pub-container\"}]]}"],["{\"selector\":\".widget-content\",\"tasks\":[[\"has\",{\"selector\":\"a[target=\\\"_blank\\\"]\"}]]}"],["{\"selector\":\"p\",\"tasks\":[[\"has-text\",\"Publicidad\"]]}"],["{\"selector\":\".sumario.secondary-article.play-inline\",\"tasks\":[[\"has\",{\"selector\":\".contenido-patrocinado\"}]]}"],["{\"selector\":\".s.s--v\",\"tasks\":[[\"has\",{\"selector\":\"span\",\"tasks\":[[\"has-text\",\"OFRECIDO POR\"]]}]]}"],["{\"selector\":\".column > div[class] > div[class^=\\\"sc-\\\"]\",\"tasks\":[[\"has\",{\"selector\":\"div[class^=\\\"sc-\\\"] > div[id^=\\\"div-gpt-ad\\\"]\"}]]}","{\"selector\":\"div[class^=\\\"sc-\\\"]\",\"tasks\":[[\"has\",{\"selector\":\"> div[id^=\\\"div-gpt-ad\\\"]\"}]]}"],["{\"selector\":\".Block\",\"tasks\":[[\"has\",{\"selector\":\".Title_section\",\"tasks\":[[\"has-text\",\"Contenido patrocinado\"]]}]]}","{\"selector\":\".Card\",\"tasks\":[[\"has\",{\"selector\":\".Card-Section.Section\",\"tasks\":[[\"has-text\",\"Contenido patrocinado\"]]}]]}"],["{\"selector\":\"span\",\"tasks\":[[\"has-text\",\"PUBLICIDAD\"]]}"],["{\"selector\":\".main-article-container-patr\",\"tasks\":[[\"has\",{\"selector\":\".contenido-comercial\"}]]}","{\"selector\":\".main-article-container-patr\",\"tasks\":[[\"has\",{\"selector\":\".mas-contenido\",\"tasks\":[[\"has-text\",\"Más Contenido\"]]}]]}"],["{\"selector\":\".tborder\",\"tasks\":[[\"has-text\",\"eBay.es\"]]}","{\"selector\":\".tborder\",\"tasks\":[[\"has-text\",\"elcorteingles.es\"]]}"],["{\"selector\":\"#sidebar > div > section\",\"tasks\":[[\"has\",{\"selector\":\".fixed_adslot\"}]]}","{\"selector\":\"#sidebar > section\",\"tasks\":[[\"has\",{\"selector\":\".fixed_adslot\"}]]}"],["{\"selector\":\"div[class^=\\\"embed-card_card_\\\"]\",\"tasks\":[[\"has\",{\"selector\":\"a[href^=\\\"http://disneyplus.bn5x.net/\\\"]\"}]]}"],["{\"selector\":\".display-ads\",\"tasks\":[[\"has\",{\"selector\":\"> span\",\"tasks\":[[\"has-text\",\"Anuncio\"]]}]]}"],["{\"selector\":\".c.d1\",\"tasks\":[[\"has\",{\"selector\":\"div\",\"tasks\":[[\"has-text\",\"Más cosas interesantes\"]]}]]}"],["{\"selector\":\".md\\\\:col-span-2.w-full.h-60.flex-center.bg-gray-700.rounded-xl.relative\",\"tasks\":[[\"has\",{\"selector\":\".empower-ad\"}]]}"],["{\"selector\":\"section > h3\",\"tasks\":[[\"has-text\",\"Publicidad\"]]}"],["{\"selector\":\".mvp-widget-home-head\",\"tasks\":[[\"has\",{\"selector\":\"span\",\"tasks\":[[\"has-text\",\"Publicidad\"]]}]]}"],["{\"selector\":\".section\",\"tasks\":[[\"has\",{\"selector\":\".section-subtitle\",\"tasks\":[[\"has-text\",\"Contenido en colaboración\"]]}]]}"],["{\"selector\":\"h2\",\"tasks\":[[\"has-text\",\"Anuncio\"]]}"],["{\"selector\":\".tno-article-block\",\"tasks\":[[\"has\",{\"selector\":\"span\",\"tasks\":[[\"has-text\",\"Branded content\"]]}]]}"],["{\"selector\":\"div\",\"tasks\":[[\"has\",{\"selector\":\"> span\",\"tasks\":[[\"has-text\",\"Publicidad\"]]}]]}"],["{\"selector\":\"label\",\"tasks\":[[\"has-text\",\"Publicidad\"]]}"],["{\"selector\":\"span\",\"tasks\":[[\"has-text\",\"Publicidad\"]]}"],["{\"selector\":\"td[class*=\\\"id_publi_\\\"]\",\"tasks\":[[\"has\",{\"selector\":\"img[alt=\\\"publicidad\\\"]\"}]]}"],["{\"selector\":\"td[class*=\\\"id_publi_\\\"]\",\"tasks\":[[\"has\",{\"selector\":\"a[href^=\\\"https://www.amazon.es/\\\"]\"}]]}"],["{\"selector\":\".quicklink_w100\",\"tasks\":[[\"has\",{\"selector\":\".publi-tag\",\"tasks\":[[\"has-text\",\"AD\"]]}]]}"],["{\"selector\":\".col-md-2\",\"tasks\":[[\"has\",{\"selector\":\"span\",\"tasks\":[[\"has-text\",\"Promoción\"]]}]]}"],["{\"selector\":\"div\",\"tasks\":[[\"has\",{\"selector\":\"a[title=\\\"Clickio\\\"]\"}]]}"],["{\"selector\":\"div\",\"tasks\":[[\"has\",{\"selector\":\"> h3\",\"tasks\":[[\"has-text\",\"CHAT PORNO X\"]]}]]}"],["{\"selector\":\"em\",\"tasks\":[[\"has-text\",\"Patrocinado:\"]]}","{\"selector\":\"strong\",\"tasks\":[[\"has-text\",\"Reclama tu crédito\"]]}"],["{\"selector\":\"#sidebar > .adpv\",\"tasks\":[[\"has-text\",\"Camiseta de la semana\"]]}","{\"selector\":\".adpv\",\"tasks\":[[\"has\",{\"selector\":\"> .adsbygoogle\"}]]}","{\"selector\":\".posts\",\"tasks\":[[\"has\",{\"selector\":\"> div > div > .adsbygoogle\"}]]}"],["{\"selector\":\"#lateral\",\"tasks\":[[\"has\",{\"selector\":\"span\",\"tasks\":[[\"has-text\",\"Auspiciado por:\"]]}]]}"],["{\"selector\":\".dropdown\",\"tasks\":[[\"has\",{\"selector\":\"label\",\"tasks\":[[\"has-text\",\"VPN\"]]}]]}"],["{\"selector\":\".Page-above.loaded\",\"tasks\":[[\"has\",{\"selector\":\"div[class^=\\\"GoogleDfpAd\\\"]\"}]]}"]];

const hostnamesMap = new Map([["25digital.com.ar",0],["elsolnoticias.com.ar",1],["horadeopinion.com.ar",2],["mercadolibre.com.ar",3],["mercadolibre.com.bo",3],["mercadolibre.cl",3],["mercadolibre.com.co",3],["mercadolibre.co.cr",3],["mercadolibre.com.do",3],["mercadolibre.com.ec",3],["mercadolibre.com.gt",3],["mercadolibre.com.hn",3],["mercadolibre.com.mx",3],["mercadolibre.com.ni",3],["mercadolibre.com.pa",3],["mercadolibre.com.pe",3],["mercadolibre.com.py",3],["mercadolibre.com.sv",3],["mercadolibre.com.uy",3],["mercadolibre.com.ve",3],["periodismokosher.com.ar",4],["impactonews.co",5],["mundo724.com",5],["portafolio.co",6],["as.com",7],["clarin.com",8],["elespectador.com",9],["elquindiano.com",10],["laboyanos.com",10],["eltiempo.com",11],["forochicas.com",12],["forocoches.com",13],["hobbyconsolas.com",14],["juegosdiarios.com",15],["muyzorras.com",16],["olympusscans.com",17],["recetasfacilescocina.com",18],["rtwnoticias.com",19],["semana.com",20],["superluchas.com",21],["theobjective.com",22],["univision.com",23],["valoraanalitik.com",24],["hoy.com.do",25],["cuencanews.es",26],["mil21.es",27],["yorokobu.es",28],["gamestorrents.fm",29],["elcontribuyente.mx",30],["videospornogratisx.net",31],["lecter.news",32],["finofilipino.org",33],["elcomercio.pe",34],["photocall.tv",35],["elpais.com.uy",36]]);

const entitiesMap = new Map(undefined);

const exceptionsMap = new Map(undefined);

self.proceduralImports = self.proceduralImports || [];
self.proceduralImports.push({ argsList, hostnamesMap, entitiesMap, exceptionsMap });

/******************************************************************************/

})();

/******************************************************************************/
