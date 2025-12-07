/*******************************************************************************

    uBlock Origin Lite - a comprehensive, MV3-compliant content blocker
    Copyright (C) 2019-present Raymond Hill

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

// ruleset: annoyances-widgets

// Important!
// Isolate from global scope
(function uBOL_cssSpecificImports() {

/******************************************************************************/

const selectors = /* 13 */ ["#chatbotToronto","#floating-experience-feature-tour-popover","#view-__module-context__-_amzn_conversational-experience-module__tandalone-0",".chat-button",".chat-container",".chatWindow",".chatbotSection",".chatbotSlider",".chatbotentrybtn",".healthshotsChannels",".rufus-panel-container",".secBannerWidget",".woot-widget-bubble"];
const selectorLists = /* 6 */ "0;1,2;3,4;11,5,6,7,8,9;10;12";
const selectorListRefs = /* 6 */ "0,4,2,3,5,1";
const hostnames = /* 6 */ ["hp.com","amazon.com","casbin.org","healthshots.com","therealdeal.com","docs.aws.amazon.com"];
const hasEntities = false;

self.specificImports = self.specificImports || [];
self.specificImports.push({ selectors, selectorLists, selectorListRefs, hostnames, hasEntities });

/******************************************************************************/

})();

/******************************************************************************/
