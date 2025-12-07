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

// ruleset: ltu-0

// Important!
// Isolate from global scope
(function uBOL_cssProceduralImport() {

/******************************************************************************/


const selectors = /* 14 */ ["{\"selector\":\".obj-cont dt\",\"tasks\":[[\"has-text\",\" Reklama/\"]]}","{\"selector\":\"center\",\"tasks\":[[\"has-text\",\"Reklama\"]]}","{\"selector\":\".portlet_block\",\"tasks\":[[\"has-text\",\"Partneriai\"]]}","{\"selector\":\"#sidebar1 > div\",\"tasks\":[[\"has-text\",\"mods\"]]}","{\"selector\":\".td_block_wrap\",\"tasks\":[[\"has-text\",\"/^Nuorodos/\"]]}","{\"selector\":\".background[data-url*=\\\"ttps://bit.ly/\\\"]\",\"action\":[\"style\",\"visibility: hidden !important;\"],\"cssable\":true}","{\"selector\":\".LStatic__inner\",\"action\":[\"style\",\"padding-top: 0 !important\"],\"cssable\":true}","{\"selector\":\".main > .fixed_userbar\",\"action\":[\"style\",\"margin-bottom: unset !important\"],\"cssable\":true}","{\"selector\":\".main > #header\",\"action\":[\"style\",\"margin-top: unset !important\"],\"cssable\":true}","{\"selector\":\"#mdelfi_latest_news\",\"action\":[\"style\",\"min-height: unset !important\"],\"cssable\":true}","{\"selector\":\".brandpage-wrapper\",\"action\":[\"style\",\"margin-top: unset !important\"],\"cssable\":true}","{\"selector\":\".partner-item\",\"tasks\":[[\"upward\",\".bg-gray-100\"]]}","{\"selector\":\".wrapper\",\"action\":[\"style\",\"margin-top: 0 !important\"],\"cssable\":true}","{\"selector\":\"#sidebar > div.custom-div\",\"tasks\":[[\"has-text\",\"REKLAMA\"]]}"];
const selectorLists = /* 13 */ "0;1;2;3;4;5;6;7,8;9;10;11;12;13";
const selectorListRefs = /* 15 */ "10,12,11,9,6,0,8,7,7,5,3,2,4,1,4";
const hostnames = /* 15 */ ["lkl.lt","tv3.lt","15min.lt","imones.lt","lrytas.lt","aruodas.lt","m.delfi.lt","torrent.ai","torrent.lt","autoplius.lt","kaunozinios.lt","technologijos.lt","klaipedoszinios.lt","itiketini-faktai.online","xn--iauliinios-z9b5t9e.lt"];
const hasEntities = false;

self.proceduralImports = self.proceduralImports || [];
self.proceduralImports.push({ selectors, selectorLists, selectorListRefs, hostnames, hasEntities });

/******************************************************************************/

})();

/******************************************************************************/
