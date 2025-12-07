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

// ruleset: isr-0

// Important!
// Isolate from global scope
(function uBOL_cssProceduralImport() {

/******************************************************************************/


const selectors = /* 12 */ ["{\"selector\":\"button\",\"tasks\":[[\"has\",{\"selector\":\"> div > div > div > span\",\"tasks\":[[\"has-text\",\"ממומן\"]]}]]}","{\"selector\":\"div\",\"tasks\":[[\"has\",{\"selector\":\"> div > div > div > div > div > p\",\"tasks\":[[\"has-text\",\"ממומן\"]]}]]}","{\"selector\":\"script\",\"tasks\":[[\"has-text\",\"responseText\"]]}","{\"selector\":\"script\",\"tasks\":[[\"has-text\",\"(window)}catch\"]]}","{\"selector\":\"script\",\"tasks\":[[\"has-text\",\"200===\"]]}","{\"selector\":\"html\",\"action\":[\"style\",\"height: auto !important; overflow: auto !important\"],\"cssable\":true}","{\"selector\":\"span:has([href*=\\\"promo\\\"])\",\"tasks\":[[\"xpath\",\"..\"]]}","{\"selector\":\"script\",\"tasks\":[[\"has-text\",\"admiral\"]]}","{\"selector\":\"body\",\"action\":[\"style\",\"overflow: auto !important;\"],\"cssable\":true}","{\"selector\":\"div[aria-label*=\\\"המחלקה המסחרית\\\"]\",\"tasks\":[[\"upward\",5]]}","{\"selector\":\"iframe[title*=\\\"Banner\\\"]\",\"tasks\":[[\"upward\",4]]}","{\"selector\":\"#rb-checktag\",\"action\":[\"remove\",\"\"]}"];
const selectorLists = /* 8 */ "0,1;2,3,4;-3,-4;5,6;7;8;10,9;11";
const selectorListRefs = /* 10 */ "0,5,1,1,7,4,3,6,2,3";
const hostnames = /* 10 */ ["wolt.com","bhol.co.il","sheee.co.il","walla.co.il","hwzone.co.il","morfix.co.il","haaretz.co.il","www.kikar.co.il","mail.walla.co.il","www-haaretz-co-il.eu1.proxy.openathens.net"];
const hasEntities = false;

self.proceduralImports = self.proceduralImports || [];
self.proceduralImports.push({ selectors, selectorLists, selectorListRefs, hostnames, hasEntities });

/******************************************************************************/

})();

/******************************************************************************/
