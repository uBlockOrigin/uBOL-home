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

// ruleset: alb-0

// Important!
// Isolate from global scope
(function uBOL_cssProceduralImport() {

/******************************************************************************/


const selectors = /* 7 */ ["{\"selector\":\".vc_raw_html\",\"tasks\":[[\"has-text\",\"Html code\"]]}","{\"selector\":\".modal-open\",\"action\":[\"style\",\"overflow: visible\"],\"cssable\":true}","{\"selector\":\".td-block-title-wrap > h4 > span\",\"tasks\":[[\"has-text\",\"REKLAMA\"]]}","{\"selector\":\".location-choose.open > wrapper\",\"action\":[\"style\",\"visibility:hidden;\"],\"cssable\":true}","{\"selector\":\".td_block_template_1\",\"tasks\":[[\"has-text\",\"- Advertisement -\"]]}","{\"selector\":\".widget\",\"tasks\":[[\"has-text\",\"REKLAMA\"]]}","{\"selector\":\"div.col-8\",\"action\":[\"style\",\"width: 100% !important\"],\"cssable\":true}"];
const selectorLists = /* 7 */ "0;1;2;3;4;5;6";
const selectorListRefs = /* 7 */ "5,2,3,0,4,6,1";
const hostnames = /* 7 */ ["konica.al","shkoder.net","cineplexx.al","kohajone.com","mediaworld.al","www.filma24.*","bankofalbania.org"];
const hasEntities = true;

self.proceduralImports = self.proceduralImports || [];
self.proceduralImports.push({ selectors, selectorLists, selectorListRefs, hostnames, hasEntities });

/******************************************************************************/

})();

/******************************************************************************/
