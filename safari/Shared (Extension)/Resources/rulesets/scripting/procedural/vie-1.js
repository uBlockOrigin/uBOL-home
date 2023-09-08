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

// ruleset: vie-1

/******************************************************************************/

// Important!
// Isolate from global scope
(function uBOL_cssProceduralImport() {

/******************************************************************************/

const argsList = [["{\"selector\":\"[id=\\\"__next\\\"] > div\",\"tasks\":[[\"has\",{\"selector\":\"#BaoMoi_Masthead\"}]]}"],["{\"selector\":\"[id^=\\\"bdaia-widget-html\\\"]\",\"tasks\":[[\"has\",{\"selector\":\".widget-inner > [href*=\\\"premiumvns.com\\\"]\"}]]}"],["{\"selector\":\"body\",\"action\":[\"remove-attr\",\"data-pop1\"]}","{\"selector\":\"body\",\"action\":[\"remove-attr\",\"data-pop2\"]}"],["{\"selector\":\"body\",\"action\":[\"remove-class\",\"compensate-for-scrollbar\"]}"],["{\"selector\":\".col\",\"tasks\":[[\"has\",{\"selector\":\"span\",\"tasks\":[[\"has-text\",\"Tin tài trợ\"]]}]]}","{\"selector\":\"div.pos-rel\",\"tasks\":[[\"has\",{\"selector\":\"a[rel=\\\"nofollow sponsored\\\"]\"}]]}"],["{\"selector\":\".hsdn > li\",\"tasks\":[[\"has\",{\"selector\":\".adsbygoogle\"}]]}"],["{\"selector\":\".block\",\"tasks\":[[\"has\",{\"selector\":\".block-container > .block-body > a[href]\"}]]}","{\"selector\":\".block\",\"tasks\":[[\"has\",{\"selector\":\".block-container > .block-body > ins\"}]]}"]];

const hostnamesMap = new Map([["baomoi.com",0],["linkerpt.com",1],["boophim.org",2],["mephimtv.org",3],["24h.com.vn",4],["hosocongty.vn",5],["techrum.vn",6]]);

const entitiesMap = new Map(undefined);

const exceptionsMap = new Map(undefined);

self.proceduralImports = self.proceduralImports || [];
self.proceduralImports.push({ argsList, hostnamesMap, entitiesMap, exceptionsMap });

/******************************************************************************/

})();

/******************************************************************************/
