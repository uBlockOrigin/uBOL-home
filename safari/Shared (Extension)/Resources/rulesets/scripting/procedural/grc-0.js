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

// ruleset: grc-0

/******************************************************************************/

// Important!
// Isolate from global scope
(function uBOL_cssProceduralImport() {

/******************************************************************************/

const argsList = [["{\"selector\":\".mobile-reverse\",\"tasks\":[[\"has\",{\"selector\":\"div[id^=\\\"div-gpt-\\\"]\"}]]}"],["{\"selector\":\"ol > li\",\"tasks\":[[\"has\",{\"selector\":\".carzilla-ad\"}]]}","{\"selector\":\"ol > li\",\"tasks\":[[\"has\",{\"selector\":\"[href*=\\\"funshop.gr\\\"]\"}]]}"],["{\"selector\":\"#hp-readmore-cross-article .article\",\"tasks\":[[\"has\",{\"selector\":\".byline_date\",\"tasks\":[[\"has-text\",\"ADVERTORIAL\"]]}]]}"],["{\"selector\":\"#content > div.center\",\"tasks\":[[\"has\",{\"selector\":\"> div.content-wrapper > div.taboola-feed\"}]]}","{\"selector\":\".blog-list > div.blog-post\",\"tasks\":[[\"has\",{\"selector\":\"> div.abs\"}]]}","{\"selector\":\".sidebar-wrapper > div.sticky-block\",\"tasks\":[[\"has\",{\"selector\":\"> div.advert\"}]]}","{\"selector\":\".sticky-block\",\"tasks\":[[\"has\",{\"selector\":\"> div.sticky > div.advert\"}]]}"],["{\"selector\":\".left-col\",\"tasks\":[[\"has\",{\"selector\":\"h3\",\"tasks\":[[\"has-text\",\"Advertise\"]]}]]}"]];

const hostnamesMap = new Map([["politis.com.cy",0],["car.gr",1],["sport24.gr",2],["tlife.gr",3],["sexgr.net",4]]);

const entitiesMap = new Map(undefined);

const exceptionsMap = new Map(undefined);

self.proceduralImports = self.proceduralImports || [];
self.proceduralImports.push({ argsList, hostnamesMap, entitiesMap, exceptionsMap });

/******************************************************************************/

})();

/******************************************************************************/
