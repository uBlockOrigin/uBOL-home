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

const argsList = [["{\"selector\":\"[id^=\\\"bdaia-widget-html\\\"]\",\"tasks\":[[\"has\",{\"selector\":\".widget-inner > [href*=\\\"premiumvns.com\\\"]\"}]]}"],["{\"selector\":\".text-center\",\"tasks\":[[\"has\",{\"selector\":\"small\",\"tasks\":[[\"has-text\",\"QUẢNG CÁO\"]]}]]}"],["{\"selector\":\"div\",\"tasks\":[[\"has\",{\"selector\":\"[class$=\\\"-modal\\\"]\"}]]}"],["{\"selector\":\".menu-item\",\"tasks\":[[\"has\",{\"selector\":\"a[rel=\\\"nofollow\\\"]\"}]]}"],["{\"selector\":\"body\",\"action\":[\"remove-attr\",\"data-pop1\"]}","{\"selector\":\"body\",\"action\":[\"remove-attr\",\"data-pop2\"]}"],["{\"selector\":\".col\",\"tasks\":[[\"has\",{\"selector\":\"span.tmPst.clrGr\"}]]}"],["{\"selector\":\".hsdn > li\",\"tasks\":[[\"has\",{\"selector\":\".adsbygoogle\"}]]}"],["{\"selector\":\".block\",\"tasks\":[[\"has\",{\"selector\":\".block-container > .block-body > a[href]\"}]]}","{\"selector\":\".block\",\"tasks\":[[\"has\",{\"selector\":\".block-container > .block-body > ins\"}]]}"],["{\"selector\":\"div[style]\",\"tasks\":[[\"has\",{\"selector\":\".adsbypubpower\"}]]}"],["{\"selector\":\".group-link\",\"tasks\":[[\"has\",{\"selector\":\"a[href*=\\\"&utm_\\\"]\"}]]}"]];

const hostnamesMap = new Map([["linkerpt.com",0],["metruyencv.com",1],["metruyencv.info",1],["metruyencv.net",1],["xem.javkche.info",2],["veboz19.live",3],["chillphimmoizzz.org",4],["www.24h.com.vn",5],["hosocongty.vn",6],["techrum.vn",7],["voz.vn",8],["summer.90phut20.xyz",9]]);

const entitiesMap = new Map(undefined);

const exceptionsMap = new Map(undefined);

self.proceduralImports = self.proceduralImports || [];
self.proceduralImports.push({ argsList, hostnamesMap, entitiesMap, exceptionsMap });

/******************************************************************************/

})();

/******************************************************************************/
