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

// ruleset: hrv-0

// Important!
// Isolate from global scope
(function uBOL_cssProceduralImport() {

/******************************************************************************/


const selectors = /* 11 */ ["{\"selector\":\".iframe-widget[src*=\\\"popularno\\\"]\",\"action\":[\"style\",\"max-height: 250px !important\"],\"cssable\":true}","{\"selector\":\"#mvp-site-main\",\"action\":[\"style\",\"margin-top: 0 !important\"],\"cssable\":true}","{\"selector\":\".tie-col-md-8\",\"action\":[\"style\",\"width: 100% !important\"],\"cssable\":true}","{\"selector\":\".se-group-horizontal-ads-top\",\"action\":[\"style\",\"min-height:unset!important;width:0!important\"],\"cssable\":true}","{\"selector\":\"#secondary > aside\",\"tasks\":[[\"has\",{\"selector\":\"> div.widget-header > h3\",\"tasks\":[[\"has-text\",\"/^.*(Marketing|Sponzorisano).*$/\"]]}]]}","{\"selector\":\".elementor-column-gap-default\",\"tasks\":[[\"has-text\",\"/^SERV\\\\IS.*$/\"]]}","{\"selector\":\"article > div[class^=\\\"css-\\\"]\",\"tasks\":[[\"has\",{\"selector\":\"> span.SlotContainer_title\",\"tasks\":[[\"has-text\",\"Tekst se nastavlja ispod oglasa\"]]}]]}","{\"selector\":\".pg-story-page div.c-wallpaper-ad-wrapper\",\"action\":[\"style\",\"display: none!important\"],\"cssable\":true}","{\"selector\":\".pg-story-page div.wallpaper-help-wrapper\",\"action\":[\"style\",\"top: 60px !important\"],\"cssable\":true}","{\"selector\":\".gpElementAdvertising\",\"action\":[\"style\",\"display: none !important\"],\"cssable\":true}","{\"selector\":\".js_bannerWrapper.gallery__banner\",\"action\":[\"remove\",\"\"]}"];
const selectorLists = /* 10 */ "0;1;2;3;4;5;6;7,8;9;10";
const selectorListRefs = /* 10 */ "6,0,7,1,8,5,9,2,3,4";
const hostnames = /* 10 */ ["net.hr","blic.rs","story.hr","filmitv.rs","tportal.hr","ul-info.com","vecernji.hr","niskevesti.rs","oslobodjenje.ba","sveopoznatima.com"];
const hasEntities = false;

self.proceduralImports = self.proceduralImports || [];
self.proceduralImports.push({ selectors, selectorLists, selectorListRefs, hostnames, hasEntities });

/******************************************************************************/

})();

/******************************************************************************/
