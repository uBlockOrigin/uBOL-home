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

// ruleset: idn-0

/******************************************************************************/

// Important!
// Isolate from global scope
(function uBOL_cssProceduralImport() {

/******************************************************************************/

const argsList = [["{\"selector\":\"body\",\"action\":[\"remove-class\",\"pad-apps\"]}"],["{\"selector\":\".d-flex.w-100\",\"tasks\":[[\"has\",{\"selector\":\"[id^=\\\"div-gpt-ad\\\"]\"}]]}"],["{\"selector\":\".product__card\",\"tasks\":[[\"has\",{\"selector\":\".product__tag__ads\"}]]}"],["{\"selector\":\".bl-product-card-new\",\"tasks\":[[\"has\",{\"selector\":\".bl-product-card-new__ads-badge\"}]]}"],["{\"selector\":\".dp-card-container\",\"tasks\":[[\"has\",{\"selector\":\".ico_promotion\"}]]}"],["{\"selector\":\".mr1\",\"tasks\":[[\"has\",{\"selector\":\"[id^=\\\"div-gpt-ad\\\"]\"}]]}","{\"selector\":\".mr2\",\"tasks\":[[\"has\",{\"selector\":\"[id^=\\\"div-gpt-ad\\\"]\"}]]}"],["{\"selector\":\"#leaderboard\",\"tasks\":[[\"has\",{\"selector\":\"[id^=\\\"div-gpt-ad\\\"]\"}]]}","{\"selector\":\".mr1\",\"tasks\":[[\"has\",{\"selector\":\"#adv-caption-mr1\"}]]}"],["{\"selector\":\".m-r1\",\"tasks\":[[\"has\",{\"selector\":\"#adv-caption-mr1\"}]]}","{\"selector\":\".m-r2\",\"tasks\":[[\"has\",{\"selector\":\"#adv-caption-mr2\"}]]}"],["{\"selector\":\"p\",\"tasks\":[[\"has\",{\"selector\":\"> a[href=\\\"#downloadnow\\\"]\"}]]}"],["{\"selector\":\"div[data-testid=\\\"CPMWrapper\\\"]\",\"tasks\":[[\"has\",{\"selector\":\"span\",\"tasks\":[[\"has-text\",\"/^Ad$/\"]]}]]}","{\"selector\":\"div[data-testid=\\\"divProductWrapper\\\"]\",\"tasks\":[[\"has\",{\"selector\":\"span[data-testid=\\\"divSRPTopadsIcon\\\"]\"}]]}","{\"selector\":\"div[data-testid=\\\"divProduct\\\"]\",\"tasks\":[[\"has\",{\"selector\":\"span[data-testid=\\\"icnHomeTopadsRecom\\\"]\"}]]}","{\"selector\":\"div[data-testid=\\\"lazy-frame\\\"]\",\"tasks\":[[\"has\",{\"selector\":\"span[data-testid=\\\"lblProdTopads\\\"]\"}]]}","{\"selector\":\"div[data-testid=\\\"master-product-card\\\"]\",\"tasks\":[[\"has\",{\"selector\":\"span[data-testid^=\\\"linkProductTopads\\\"]\"}]]}","{\"selector\":\"div[data-testid^=\\\"divProductRecommendation\\\"]\",\"tasks\":[[\"has\",{\"selector\":\"span[data-testid=\\\"icnHomeTopadsRecom\\\"]\"}]]}","{\"selector\":\"section[data-unify=\\\"Card\\\"]\",\"tasks\":[[\"has\",{\"selector\":\"[href^=\\\"https://ta.tokopedia.com\\\"]:first-child\"}]]}"],["{\"selector\":\"span\",\"tasks\":[[\"has-text\",\"Advertisement\"]]}"],["{\"selector\":\"div\",\"tasks\":[[\"has\",{\"selector\":\"> [id^=\\\"div-gpt-ad\\\"][class^=\\\"paralax\\\"]\"}]]}"],["{\"selector\":\".placeholder-container\",\"tasks\":[[\"has\",{\"selector\":\".ads-container\"}]]}"]];

const hostnamesMap = new Map([["tempo.co",0],["beritasatu.com",1],["blibli.com",2],["bukalapak.com",3],["m.bukalapak.com",4],["cnbcindonesia.com",5],["cnnindonesia.com",5],["detik.com",[5,6]],["haibunda.com",7],["info.mapsaddress.com",8],["info.vebma.com",[8,10]],["info.gambar.pro",8],["tokopedia.com",9],["katadata.co.id",11],["briliofood.net",12]]);

const entitiesMap = new Map(undefined);

const exceptionsMap = new Map(undefined);

self.proceduralImports = self.proceduralImports || [];
self.proceduralImports.push({ argsList, hostnamesMap, entitiesMap, exceptionsMap });

/******************************************************************************/

})();

/******************************************************************************/
