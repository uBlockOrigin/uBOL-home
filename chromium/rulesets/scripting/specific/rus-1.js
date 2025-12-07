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

// ruleset: rus-1

// Important!
// Isolate from global scope
(function uBOL_cssSpecificImports() {

/******************************************************************************/

const selectors = /* 40 */ ["a[href*=\"rambler.ru/top100/\"]","a[href*=\"top100.rambler.ru/\"]","a[href=\"http://vtambove.ru/advert/banner_network/\"]","#banner_counters","#bigmirTop","#p-counters","#page_footer > .copyright > center:first-child","#picContainer > img","#side_right > .block_r:has(> div [href*=\"liveinternet.ru/\"])","#unsafe-inline","._3S8wP > div:first-child + div",".ad_title",".ad_title > a",".b-footer__counters",".bbanerr",".bc > .il:last-child > .bp",".bcounts",".c-liveinternet",".contbaner",".copyright ~ .copyright",".counters",".disableAdvButton__container",".footer [id]:has(> b)",".liveinternet",".main > #footer ~ table",".ph-logo_doodle[href^=\"https://universal-link.mail.ru/\"]",".region-sidebar-first > .block:has(> .content > [href*=\"metrika\"])",".revolvermaps",".sibnet-footer__counters","[aria-label=\"raichuLogoLink\"]","[class^=\"Footer_liveinternet\"]","[data-react-rcm-block]","article div:has(> div > [id^=\"rcmw-container-\"])","circle[stroke-dashoffset]","div[id^=\"leaderboard_ad\"] > *","footer > .counter","img[alt=\"liru\"]","img[width=\"1\"][height=\"1\"]",".adbanner","section > nav ~ div div:has(> div > [id^=\"rcmw-container-\"])"];
const selectorLists = /* 31 */ "-1,-2,10,21,32,33,39;-3;3;23,4;5;6;7;8;9;-12,12,34;13;14;15;16;17;18;19;20;22;24;25;26;27,35;28;29;30;31;32,33,39;36;37;-39";
const selectorListRefs = /* 52 */ "2,16,20,17,25,14,4,24,19,26,23,17,6,13,21,26,0,29,29,4,28,26,17,3,10,1,5,26,17,30,5,5,5,9,17,26,12,7,17,27,26,5,26,18,8,26,15,11,17,17,22,15";
const hostnames = /* 52 */ ["sfw.so","80-e.ru","mail.ru","ngzt.ru","tass.ru","kanobu.ru","lurkmo.re","rutube.ru","samlab.ws","shakko.ru","sibnet.ru","24warez.ru","fastpic.ru","ingrus.net","istmat.org","levik.blog","rambler.ru","lostfilm.tv","lostfilm.tw","lurkmore.to","otzovik.com","periskop.su","prokazan.ru","sinoptik.ua","svpressa.ru","vtambove.ru","game4you.top","lena-miro.ru","ngnovoros.ru","only-paper.*","rustorka.com","rustorka.net","rustorka.top","inoreader.com","progorod59.ru","shiro-kino.ru","www.sibnet.ru","happy-hack.net","progorodnsk.ru","avtorambler.com","livejournal.com","rustorkacom.lib","vadimrazumov.ru","virtualbrest.ru","browserleaks.com","olegmakarenko.ru","yakusubstudio.ru","militaryreview.su","progorodchelny.ru","progorodsamara.ru","radioprofusion.com","yakusubstudio.home-forum.com"];
const hasEntities = true;

self.specificImports = self.specificImports || [];
self.specificImports.push({ selectors, selectorLists, selectorListRefs, hostnames, hasEntities });

/******************************************************************************/

})();

/******************************************************************************/
