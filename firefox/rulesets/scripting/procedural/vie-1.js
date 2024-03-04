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

// ruleset: vie-1

/******************************************************************************/

// Important!
// Isolate from global scope
(function uBOL_cssProceduralImport() {

/******************************************************************************/

const argsList = [["{\"selector\":\"[id=\\\"__next\\\"] > div\",\"tasks\":[[\"has\",{\"selector\":\"#BaoMoi_Masthead\"}]]}"],["{\"selector\":\"[data-pagelet=\\\"RightRail\\\"] span\",\"tasks\":[[\"has\",{\"selector\":\"span\",\"tasks\":[[\"has-text\",\"Được tài trợ\"]]}]]}"],["{\"selector\":\"td[width=\\\"100%\\\"] div[id]\",\"tasks\":[[\"has\",{\"selector\":\"a[href=\\\"/k/?q=q\\\"]\"}]]}"],["{\"selector\":\".text-center\",\"tasks\":[[\"has\",{\"selector\":\"small\",\"tasks\":[[\"has-text\",\"QUẢNG CÁO\"]]}]]}"],["{\"selector\":\"ytd-rich-item-renderer\",\"tasks\":[[\"has\",{\"selector\":\".ytd-in-feed-ad-layout-renderer\"}]]}"],["{\"selector\":\"body\",\"action\":[\"remove-attr\",\"data-pop1\"]}","{\"selector\":\"body\",\"action\":[\"remove-attr\",\"data-pop2\"]}"],["{\"selector\":\".col\",\"tasks\":[[\"has\",{\"selector\":\"span\",\"tasks\":[[\"has-text\",\"Tin tài trợ\"]]}]]}","{\"selector\":\"div.pos-rel\",\"tasks\":[[\"has\",{\"selector\":\"a[rel=\\\"nofollow sponsored\\\"]\"}]]}"],["{\"selector\":\"ol > li\",\"tasks\":[[\"has\",{\"selector\":\"span\",\"tasks\":[[\"has-text\",\"QC\"]]}]]}"],["{\"selector\":\".hsdn > li\",\"tasks\":[[\"has\",{\"selector\":\".adsbygoogle\"}]]}"],["{\"selector\":\".block\",\"tasks\":[[\"has\",{\"selector\":\".block-container > .block-body > a[href]\"}]]}","{\"selector\":\".block\",\"tasks\":[[\"has\",{\"selector\":\".block-container > .block-body > ins\"}]]}"]];

const hostnamesMap = new Map([["baomoi.com",0],["facebook.com",1],["kick4ss.com",2],["metruyencv.com",3],["metruyencv.info",3],["metruyencv.net",3],["www.youtube.com",4],["chillphimmoizz.org",5],["24h.com.vn",6],["google.com.vn",7],["hosocongty.vn",8],["techrum.vn",9]]);

const entitiesMap = new Map(undefined);

const exceptionsMap = new Map(undefined);

self.proceduralImports = self.proceduralImports || [];
self.proceduralImports.push({ argsList, hostnamesMap, entitiesMap, exceptionsMap });

/******************************************************************************/

})();

/******************************************************************************/
