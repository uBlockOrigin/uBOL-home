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

// ruleset: ukr-0

/******************************************************************************/

// Important!
// Isolate from global scope
(function uBOL_cssDeclarativeImport() {

/******************************************************************************/

const argsList = [["{\"selector\":\"div.gridSection__list\",\"action\":[\"style\",\"max-width: none !important\"]}","{\"selector\":\"div.news__items\",\"action\":[\"style\",\"max-width: none !important\"]}"],["{\"selector\":\"div.playlist-player\",\"action\":[\"style\",\"max-width: 1155px !important\"]}","{\"selector\":\"div.playlist-short-content\",\"action\":[\"style\",\"min-height: unset !important\"]}"],["{\"selector\":\"body.access *\",\"action\":[\"style\",\"filter: none !important\"]}","{\"selector\":\"body.access\",\"action\":[\"style\",\"overflow: auto !important; position: relative !important\"]}"],["{\"selector\":\"body\",\"action\":[\"style\",\"background-color: unset !important\"]}"],["{\"selector\":\"div.news-sm-block.border-top-block.mt-280\",\"action\":[\"style\",\"margin-top: 0px !important; padding-top: 0px !important; border-top: unset !important\"]}"],["{\"selector\":\"nav.nav\",\"action\":[\"style\",\"padding-top: 0 !important\"]}"],["{\"selector\":\".body-pt_toplink\",\"action\":[\"style\",\"padding-top: 80px !important\"]}"],["{\"selector\":\"body\",\"action\":[\"style\",\"background-image: none !important; padding-top: 0 !important;\"]}"],["{\"selector\":\"#contentbg\",\"action\":[\"style\",\"margin-top: 35px !important\"]}","{\"selector\":\"#totalbg\",\"action\":[\"style\",\"background-image: unset !important\"]}"],["{\"selector\":\"head > style:empty\",\"action\":[\"style\",\"all: inherit !important\"]}"],["{\"selector\":\"body.with-image\",\"action\":[\"style\",\"padding-top: 20px !important\"]}"],["{\"selector\":\"#sitewrap\",\"action\":[\"style\",\"background-image: unset !important\"]}"],["{\"selector\":\"body\",\"action\":[\"style\",\"background-image: unset !important\"]}","{\"selector\":\"div.gbg\",\"action\":[\"style\",\"top:unset !important\"]}"],["{\"selector\":\".site-header\",\"action\":[\"style\",\"top: 0 !important\"]}","{\"selector\":\"div.main-wrapper\",\"action\":[\"style\",\"margin-top: 0 !important\"]}"],["{\"selector\":\"h2.b-info-block__title\",\"action\":[\"style\",\"padding-top: 0 !important\"]}"],["{\"selector\":\"body.branding\",\"action\":[\"style\",\"padding-top: 20px !important\"]}"],["{\"selector\":\"div.nomobile\",\"action\":[\"style\",\"margin-top: unset !important\"]}"],["{\"selector\":\"body\",\"action\":[\"style\",\"background-image: none !important\"]}"],["{\"selector\":\"div.fb-s-blog-two-main__col.brxe-block\",\"action\":[\"style\",\"grid-template-columns: unset !important\"]}"],["{\"selector\":\".post-block:has(.banner)\",\"action\":[\"style\",\"min-height: 0 !important\"]}"],["{\"selector\":\"div.page-section__element--inner-fluent-side\",\"action\":[\"style\",\"max-width: 100% !important; margin-right: 0 !important\"]}","{\"selector\":\"div.site\",\"action\":[\"style\",\"margin-top: 20px !important\"]}"]];

const hostnamesMap = new Map([["1plus1.ua",0],["1plus1.video",1],["buhgalter.com.ua",2],["buhgalter911.com",2],["businessua.com",3],["defence-ua.com",4],["dumskaya.net",5],["gagadget.com",6],["happymonday.ua",7],["infocar.ua",8],["internetua.com",9],["sinoptik.ua",9],["kinoafisha.ua",10],["kinofilms.ua",11],["ko.com.ua",12],["kyiv24.news",13],["mind.ua",14],["nv.ua",15],["sportarena.com",16],["synonimy.info",17],["versii.if.ua",18],["village.com.ua",19],["xsport.ua",20]]);

const entitiesMap = new Map(undefined);

const exceptionsMap = new Map(undefined);

self.declarativeImports = self.declarativeImports || [];
self.declarativeImports.push({ argsList, hostnamesMap, entitiesMap, exceptionsMap });

/******************************************************************************/

})();

/******************************************************************************/
