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

// ruleset: ublock-badware

// Important!
// Isolate from global scope
(function uBOL_cssProceduralImport() {

/******************************************************************************/


const selectors = /* 11 */ ["{\"selector\":\"main::before\",\"action\":[\"style\",\"content: 'uBlock is unrelated to the well-known uBlock Origin.' !important; font-size: 32px !important; color: red !important; font-weight: bold !important;\"],\"cssable\":true}","{\"selector\":\"div.hero-unit > div.search-box--hero-unit::before\",\"action\":[\"style\",\"content: 'uBlock is unrelated to the well-known uBlock Origin.' !important; font-size: var(--font-size-h2) !important; color: red !important; font-weight: bold !important;\"],\"cssable\":true}","{\"selector\":\".entry-content > div > strong\",\"tasks\":[[\"has-text\",\"find & fix Windows error\"]]}","{\"selector\":\".attention-button-wrap\",\"tasks\":[[\"has-text\",\"Reimage\"]]}","{\"selector\":\"th\",\"tasks\":[[\"has-text\",\"/^Detection$/\"]]}","{\"selector\":\"th\",\"tasks\":[[\"has-text\",\"/^Detection$/\"],[\"spath\",\" + td\"]]}","{\"selector\":\".nfc-bottom-right\",\"tasks\":[[\"has-text\",\"Reimage\"]]}","{\"selector\":\"a\",\"tasks\":[[\"has-text\",\"Reimage\"]]}","{\"selector\":\".entry-content > div\",\"tasks\":[[\"has-text\",\"Special Offer\"]]}","{\"selector\":\"#alt_content_main_div > p\",\"tasks\":[[\"has-text\",\"SpyHunter\"]]}","{\"selector\":\"a\",\"tasks\":[[\"has-text\",\"SpyHunter\"]]}"];
const selectorLists = /* 5 */ "0;-1,1;2;10,3,4,5,6,7;8,9";
const selectorListRefs = /* 29 */ "3,3,3,3,3,3,0,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,4,3,3,1,2";
const hostnames = /* 29 */ ["avirus.hu","uirusu.jp","virusi.bg","virusi.hr","bedynet.ru","novirus.uk","ublock.org","virusai.lt","viruset.no","dieviren.de","lesvirus.fr","losvirus.es","semvirus.pt","viirused.ee","virukset.fi","wubingdu.cn","faravirus.ro","udenvirus.dk","utanvirus.se","2-spyware.com","senzavirus.it","usunwirusa.pl","zondervirus.nl","virusler.info.tr","howtoremove.guide","odstranitvirus.cz","tanpavirus.web.id","support.ublock.org","thewindowsclub.com"];
const hasEntities = false;

self.proceduralImports = self.proceduralImports || [];
self.proceduralImports.push({ selectors, selectorLists, selectorListRefs, hostnames, hasEntities });

/******************************************************************************/

})();

/******************************************************************************/
