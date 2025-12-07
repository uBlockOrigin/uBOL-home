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

// ruleset: mkd-0

// Important!
// Isolate from global scope
(function uBOL_cssProceduralImport() {

/******************************************************************************/


const selectors = /* 2 */ ["{\"selector\":\"#ablockercheck\",\"action\":[\"style\",\"display: block !important;\"],\"cssable\":true}","{\"selector\":\"body\",\"action\":[\"style\",\"background-image: none !important;\"],\"cssable\":true}"];
const selectorLists = /* 2 */ "0;1";
const selectorListRefs = /* 2 */ "0,1";
const hostnames = /* 2 */ ["stream.mk","sportski.mk"];
const hasEntities = false;

self.proceduralImports = self.proceduralImports || [];
self.proceduralImports.push({ selectors, selectorLists, selectorListRefs, hostnames, hasEntities });

/******************************************************************************/

})();

/******************************************************************************/
