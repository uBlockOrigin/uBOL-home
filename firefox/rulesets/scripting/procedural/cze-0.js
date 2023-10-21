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

// ruleset: cze-0

/******************************************************************************/

// Important!
// Isolate from global scope
(function uBOL_cssProceduralImport() {

/******************************************************************************/

const argsList = [["{\"selector\":\"body\",\"action\":[\"remove-class\",\"modal-open\"]}","{\"selector\":\"div\",\"action\":[\"remove-class\",\"with-active-branding\"]}"],["{\"selector\":\".ct-related\",\"tasks\":[[\"has-text\",\"/^\\\\s+Reklama/\"]]}","{\"selector\":\".widget-group-2 li\",\"tasks\":[[\"has\",{\"selector\":\"div.ad-pmg\"}]]}"],["{\"selector\":\".block-imageblock\",\"tasks\":[[\"has-text\",\"Reklama\"]]}"],["{\"selector\":\"div.box\",\"tasks\":[[\"has-text\",\"/^reklama/i\"]]}"],["{\"selector\":\".text-center\",\"tasks\":[[\"has\",{\"selector\":\"> span\",\"tasks\":[[\"has-text\",\"reklama\"]]}]]}","{\"selector\":\"div\",\"tasks\":[[\"has\",{\"selector\":\"> a[class^=\\\"glightbox\\\"]\"}]]}","{\"selector\":\"img[src^=\\\"/upload/data/\\\"]\",\"tasks\":[[\"upward\",3]]}","{\"selector\":\"span\",\"tasks\":[[\"has-text\",\"reklama\"]]}"],["{\"selector\":\"img[src*=\\\"/img/atlas\\\"]\",\"tasks\":[[\"upward\",3]]}"],["{\"selector\":\"img[alt=\\\"casopis\\\"]\",\"tasks\":[[\"upward\",3]]}"],["{\"selector\":\"a\",\"tasks\":[[\"matches-css\",{\"name\":\"background-image\",\"value\":\"url\"}],[\"matches-css\",{\"name\":\"position\",\"value\":\"^fixed$\"}],[\"upward\",1]]}"],["{\"selector\":\".v-card--link\",\"tasks\":[[\"has\",{\"selector\":\".ad\"}]]}"],["{\"selector\":\"div.article--content\",\"tasks\":[[\"has\",{\"selector\":\"div.design-advert\"}]]}"],["{\"selector\":\"div\",\"tasks\":[[\"has\",{\"selector\":\"> a[href*=\\\"?act=detail&f=8\\\"]\"}]]}"],["{\"selector\":\".bcc\",\"tasks\":[[\"has\",{\"selector\":\".banners\"}]]}"],["{\"selector\":\"h3\",\"tasks\":[[\"has-text\",\"/^Reklama$/\"]]}"],["{\"selector\":\"div.dragging-enabled\",\"tasks\":[[\"has\",{\"selector\":\"div.gadget--reklama\"}]]}"],["{\"selector\":\"div\",\"tasks\":[[\"has\",{\"selector\":\"> a\",\"tasks\":[[\"has\",{\"selector\":\"> section[data-testid=\\\"BannerImage\\\"]\"}]]}]]}","{\"selector\":\"div\",\"tasks\":[[\"has\",{\"selector\":\"> section[data-testid=\\\"teaserCarousel\\\"]\"}]]}","{\"selector\":\"ul > div\",\"tasks\":[[\"has\",{\"selector\":\"> a[data-testid=\\\"imageTile\\\"]\"}]]}","{\"selector\":\"ul > div\",\"tasks\":[[\"has\",{\"selector\":\"> a[data-testid^=\\\"outfit\\\"]\"}]]}"],["{\"selector\":\".desktop-wrapper\",\"tasks\":[[\"has\",{\"selector\":\"[id^=\\\"div-gpt-ad\\\"]\"}]]}"],["{\"selector\":\".container--break\",\"tasks\":[[\"has\",{\"selector\":\".ad--align\"}]]}","{\"selector\":\"div[class^=\\\"position_\\\"]\",\"tasks\":[[\"has\",{\"selector\":\".ad--align\"}]]}"],["{\"selector\":\".content-item\",\"tasks\":[[\"has\",{\"selector\":\".header a[href^=\\\"/reklama/\\\"]\"}]]}"],["{\"selector\":\"script\",\"tasks\":[[\"has-text\",\"stopPrntScr\"]]}","{\"selector\":\"style\",\"action\":[\"remove\",\"\"],\"tasks\":[[\"has-text\",\"::selection\"]]}"],["{\"selector\":\".widget\",\"tasks\":[[\"has\",{\"selector\":\"img[src*=\\\"/ads/\\\"]\"}]]}"]];

const hostnamesMap = new Map([["autozurnal.com",0],["csfd.cz",1],["doktorka.cz",2],["dotekomanie.cz",3],["enigmaplus.cz",[4,5]],["epochaplus.cz",[4,6]],["indian-tv.cz",7],["nerdfix.cz",7],["konzolista.cz",8],["lupa.cz",9],["root.cz",9],["motorkari.cz",10],["msmt.cz",11],["parabola.cz",12],["www.seznam.cz",13],["aboutyou.sk",14],["slovnik.aktuality.sk",15],["brainee.hnonline.sk",16],["tvtv.sk",17],["vranovske.sk",18],["vtn-vranov.sk",19]]);

const entitiesMap = new Map(undefined);

const exceptionsMap = new Map(undefined);

self.proceduralImports = self.proceduralImports || [];
self.proceduralImports.push({ argsList, hostnamesMap, entitiesMap, exceptionsMap });

/******************************************************************************/

})();

/******************************************************************************/
