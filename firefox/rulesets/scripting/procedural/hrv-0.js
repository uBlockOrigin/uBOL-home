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

// ruleset: hrv-0

/******************************************************************************/

// Important!
// Isolate from global scope
(function uBOL_cssProceduralImport() {

/******************************************************************************/

const argsList = [["{\"selector\":\".panel-2\",\"tasks\":[[\"has\",{\"selector\":\"> div[id*=\\\"gpt\\\"]\"}]]}"],["{\"selector\":\".code-block\",\"tasks\":[[\"has\",{\"selector\":\"[id*=\\\"hayat_ba_\\\"]\"}]]}"],["{\"selector\":\"style[scoped] + div[class*=\\\"  wpb_column\\\"]:last-of-type\",\"tasks\":[[\"has\",{\"selector\":\"script[src*=\\\"pagead\\\"]\"}]]}"],["{\"selector\":\"div[class^=\\\"css-\\\"]:first-of-type\",\"tasks\":[[\"has\",{\"selector\":\"+ div[align=\\\"center\\\"]\"}]]}"],["{\"selector\":\"#secondary > aside\",\"tasks\":[[\"has\",{\"selector\":\"> div.widget-header > h3\",\"tasks\":[[\"has-text\",\"/Marketing|Sponzorisano/\"]]}]]}"],["{\"selector\":\".elementor-column-gap-default\",\"tasks\":[[\"has-text\",\"/^SERVIS/\"]]}","{\"selector\":\"article.type-post\",\"tasks\":[[\"has\",{\"selector\":\"a[href*=\\\"meridian\\\"]\"}]]}","{\"selector\":\"article.type-post\",\"tasks\":[[\"has\",{\"selector\":\"img[data-src*=\\\"freebet\\\"]\"}]]}","{\"selector\":\"main section[data-settings*=\\\"background\\\"]\",\"tasks\":[[\"has\",{\"selector\":\"div[class^=\\\"adv\\\"]\"}]]}"],["{\"selector\":\".BaseLayout_content div[class^=\\\"intextAdIgnore\\\"]\",\"tasks\":[[\"has\",{\"selector\":\".Slot_content\"}]]}","{\"selector\":\".Sidebar_aside > div:only-of-type > div:first-of-type\",\"tasks\":[[\"has\",{\"selector\":\".Slot_content\"}]]}","{\"selector\":\".intextAdIgnore\",\"tasks\":[[\"has\",{\"selector\":\"> div[class^=\\\"css-\\\"]:only-child > .Slot_content:only-child\"}]]}","{\"selector\":\"div[class^=\\\"css-\\\"]\",\"tasks\":[[\"has\",{\"selector\":\"> .Slot_content:only-child\"}]]}","{\"selector\":\"div[class^=\\\"css-\\\"]\",\"tasks\":[[\"has\",{\"selector\":\"> span.Slot_title:first-child + .Slot_content:last-child\"}]]}","{\"selector\":\"p ~ div\",\"tasks\":[[\"has\",{\"selector\":\"> .Slot_content\"}]]}"],["{\"selector\":\".body-content.container > .row\",\"tasks\":[[\"has\",{\"selector\":\".ponuda\"}]]}"],["{\"selector\":\".flash--news\",\"tasks\":[[\"has\",{\"selector\":\"> div[id^=\\\"ad-\\\"]\"}]]}","{\"selector\":\".flash--news\",\"tasks\":[[\"has\",{\"selector\":\"> script\"}]]}"],["{\"selector\":\".single__widget\",\"tasks\":[[\"has\",{\"selector\":\"> .lwdgt\"}]]}","{\"selector\":\"section[class=\\\"section\\\"]\",\"tasks\":[[\"has\",{\"selector\":\".lwdgt\"}]]}"],["{\"selector\":\".relative.center\",\"tasks\":[[\"has\",{\"selector\":\"> .banner-slot\"}]]}"],["{\"selector\":\".positionFrame\",\"tasks\":[[\"has\",{\"selector\":\"[src*=\\\"native.tportal\\\"]\"}]]}"],["{\"selector\":\"div[class=\\\"single-article__row\\\"]\",\"tasks\":[[\"has\",{\"selector\":\"> .banner\"}]]}"],["{\"selector\":\".td-stretch-content\",\"tasks\":[[\"has\",{\"selector\":\"> [class*=\\\"  \\\"]:not([class*=\\\"style\\\"])\"}],[\"has\",{\"selector\":\".sviBanneri\"}]]}","{\"selector\":\".vc_row[class*=\\\"  \\\"] > .vc_column\",\"tasks\":[[\"has\",{\"selector\":\".td-a-rec\"}]]}"],["{\"selector\":\".widget_block\",\"tasks\":[[\"not\",{\"selector\":\"\",\"tasks\":[[\"has\",{\"selector\":\"a[href*=\\\"pvinformer\\\"]\"}]]}]]}","{\"selector\":\".widget_media_image\",\"tasks\":[[\"not\",{\"selector\":\"\",\"tasks\":[[\"has\",{\"selector\":\"a[href*=\\\"pvinformer\\\"]\"}]]}]]}"],["{\"selector\":\".big\",\"tasks\":[[\"has\",{\"selector\":\"ins\"}]]}","{\"selector\":\".reklame-dio .big\",\"tasks\":[[\"has\",{\"selector\":\"img:not([src*=\\\"rtnk.me.png\\\"])\"}]]}"],["{\"selector\":\".article--listing ~ .article\",\"tasks\":[[\"has\",{\"selector\":\"script[src*=\\\"adsbygoogle\\\"]\"}]]}","{\"selector\":\".article__header\",\"tasks\":[[\"has\",{\"selector\":\"+ .article__section-wrapper--zebra\"}]]}"],["{\"selector\":\"p\",\"tasks\":[[\"has\",{\"selector\":\"ins.adsbygoogle\"}]]}"],["{\"selector\":\".widget_media_image\",\"tasks\":[[\"has\",{\"selector\":\"img[width^=\\\"4\\\"]\"}]]}"]];

const hostnamesMap = new Map([["depo.ba",0],["hayat.ba",1],["otisak.ba",2],["klikdoposla.com",3],["sveopoznatima.com",4],["ul-info.com",5],["danas.hr",6],["glasistre.hr",7],["monitor.hr",8],["poslovni.hr",9],["poslovni-dnevnik.me",9],["poslovni.mk",9],["poslovni.co.rs",9],["telegram.hr",10],["tportal.hr",11],["vecernji.hr",12],["bokanews.me",13],["pvinformer.me",14],["rtnk.me",15],["sportske.net",16],["intermagazin.rs",17],["tvjasenica.rs",18]]);

const entitiesMap = new Map(undefined);

const exceptionsMap = new Map(undefined);

self.proceduralImports = self.proceduralImports || [];
self.proceduralImports.push({ argsList, hostnamesMap, entitiesMap, exceptionsMap });

/******************************************************************************/

})();

/******************************************************************************/
