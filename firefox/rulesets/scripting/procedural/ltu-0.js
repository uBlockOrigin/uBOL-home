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

// ruleset: ltu-0

/******************************************************************************/

// Important!
// Isolate from global scope
(function uBOL_cssProceduralImport() {

/******************************************************************************/

const argsList = [["{\"selector\":\"#inside > .block\",\"tasks\":[[\"has\",{\"selector\":\".middle > #left_banner\"}]]}"],["{\"selector\":\".col-18.no-padding.vl-auto-row\",\"tasks\":[[\"has\",{\"selector\":\"iframe\"}]]}","{\"selector\":\".item\",\"tasks\":[[\"has\",{\"selector\":\"> a[href*=\\\"//bit.ly\\\"][target=\\\"_blank\\\"] > img\"}]]}","{\"selector\":\"script + div:not(.header)\",\"tasks\":[[\"has\",{\"selector\":\"+ .wrapper\"}]]}"],["{\"selector\":\".bdaia-widget\",\"tasks\":[[\"has\",{\"selector\":\"a[href*=\\\"farming\\\"]\"}]]}","{\"selector\":\"div[data-vc-full-width]\",\"tasks\":[[\"has\",{\"selector\":\"div[id^=\\\"aina_lt_300x250_\\\"]\"}]]}"],["{\"selector\":\".col-md-6\",\"tasks\":[[\"has\",{\"selector\":\"ins.adsbygoogle\"}]]}"],["{\"selector\":\".obj-cont dt\",\"tasks\":[[\"has-text\",\" Reklama/\"]]}"],["{\"selector\":\".col-md-4.col-sm-6\",\"tasks\":[[\"has\",{\"selector\":\"> ._slot\"}]]}"],["{\"selector\":\"#sp-right .module\",\"tasks\":[[\"has\",{\"selector\":\"script, a[data-saferedirecturl]\"}]]}"],["{\"selector\":\".widget_text\",\"tasks\":[[\"has\",{\"selector\":\"ins\"}]]}"],["{\"selector\":\".md-block > div:not([class])\",\"tasks\":[[\"has\",{\"selector\":\"> [class*=\\\"adx\\\"]\"}]]}"],["{\"selector\":\".panel-pane\",\"tasks\":[[\"has\",{\"selector\":\".pane-content > script:first-of-type + style + div:last-of-type\"}]]}"],["{\"selector\":\"#sidebar1 > div\",\"tasks\":[[\"has-text\",\"mods\"]]}"],["{\"selector\":\".td_block_wrap\",\"tasks\":[[\"has-text\",\"/^Nuorodos/\"]]}"],["{\"selector\":\".sp-column\",\"tasks\":[[\"has\",{\"selector\":\"#krepsiniozinios_lt_top\"}]]}"],["{\"selector\":\".text-center\",\"tasks\":[[\"has\",{\"selector\":\"img\"}]]}"],["{\"selector\":\".partner-item\",\"tasks\":[[\"upward\",\".bg-gray-100\"]]}"],["{\"selector\":\".fl-row\",\"tasks\":[[\"has\",{\"selector\":\"iframe[src*=\\\"reklama\\\"]\"}]]}"],["{\"selector\":\".widget_custom_html\",\"tasks\":[[\"has\",{\"selector\":\".stickyContainer\"}]]}"],["{\"selector\":\"aside > .uk-panel-box\",\"tasks\":[[\"has\",{\"selector\":\"> ins\"}]]}"],["{\"selector\":\".widget_text\",\"tasks\":[[\"has\",{\"selector\":\"a:not([href*=\\\"suvalkai.\\\"])\"}]]}"],["{\"selector\":\".portlet_block\",\"tasks\":[[\"has-text\",\"Partneriai\"]]}"],["{\"selector\":\"#sidebar > div.custom-div\",\"tasks\":[[\"has-text\",\"REKLAMA\"]]}"],["{\"selector\":\".sp-module\",\"tasks\":[[\"has\",{\"selector\":\".adsbygoogle, img[src*=\\\"/reklama_\\\"], a[href*=\\\"mods.\\\"]\"}]]}"],["{\"selector\":\"center\",\"tasks\":[[\"has-text\",\"Reklama\"]]}"]];

const hostnamesMap = new Map([["torrent.ai",0],["torrent.lt",0],["15min.lt",1],["aina.lt",2],["anekdotai.lt",3],["aruodas.lt",4],["automokyklos.lt",5],["budas.lt",6],["bukimevieningi.lt",7],["m.delfi.lt",8],["diena.lt",9],["kaunozinios.lt",10],["klaipedoszinios.lt",11],["xn--iauliinios-z9b5t9e.lt",11],["krepsiniozinios.lt",12],["lietuviuzodynas.lt",13],["lkl.lt",14],["lzinios.lt",15],["nidosreceptai.lt",16],["pirkis.lt",17],["suvalkai.lt",18],["technologijos.lt",19],["tv3.lt",20],["zarasuose.lt",21],["itiketini-faktai.online",22]]);

const entitiesMap = new Map(undefined);

const exceptionsMap = new Map(undefined);

self.proceduralImports = self.proceduralImports || [];
self.proceduralImports.push({ argsList, hostnamesMap, entitiesMap, exceptionsMap });

/******************************************************************************/

})();

/******************************************************************************/
