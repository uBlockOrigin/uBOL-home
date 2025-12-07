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

// ruleset: cze-0

// Important!
// Isolate from global scope
(function uBOL_cssProceduralImport() {

/******************************************************************************/


const selectors = /* 41 */ ["{\"selector\":\"html\",\"action\":[\"remove-class\",\"ads-cls-fix\"]}","{\"selector\":\".ct-related\",\"tasks\":[[\"has-text\",\"/^\\\\s+Reklama/\"]]}","{\"selector\":\".block-imageblock\",\"tasks\":[[\"has-text\",\"Reklama\"]]}","{\"selector\":\"div.box\",\"tasks\":[[\"has-text\",\"/^reklama/i\"]]}","{\"selector\":\".text-center\",\"tasks\":[[\"has\",{\"selector\":\"> span\",\"tasks\":[[\"has-text\",\"reklama\"]]}]]}","{\"selector\":\"span\",\"tasks\":[[\"has-text\",\"reklama\"]]}","{\"selector\":\"body\",\"action\":[\"remove-class\",\"modal-open\"]}","{\"selector\":\"div\",\"action\":[\"remove-class\",\"with-active-branding\"]}","{\"selector\":\"a[id*=\\\"zatvorit\\\"]\",\"action\":[\"remove-attr\",\"href\"]}","{\"selector\":\"body\",\"action\":[\"style\",\"background-image: none !important; padding-top: 0 !important;\"],\"cssable\":true}","{\"selector\":\"div.body\",\"action\":[\"style\",\"padding-top: 0 !important;\"],\"cssable\":true}","{\"selector\":\"img[src^=\\\"/upload/data/\\\"]\",\"tasks\":[[\"upward\",3]]}","{\"selector\":\"img[src*=\\\"/img/atlas\\\"]\",\"tasks\":[[\"upward\",3]]}","{\"selector\":\"img[alt=\\\"casopis\\\"]\",\"tasks\":[[\"upward\",3]]}","{\"selector\":\"body\",\"action\":[\"style\",\"padding-top:0px !important;\"],\"cssable\":true}","{\"selector\":\"html, body\",\"action\":[\"style\",\"position:relative !important;top:0px !important\"],\"cssable\":true}","{\"selector\":\"a\",\"tasks\":[[\"matches-css\",{\"name\":\"background-image\",\"value\":\"url\"}],[\"matches-css\",{\"name\":\"position\",\"value\":\"^fixed$\"}],[\"upward\",1]]}","{\"selector\":\".top_bg_content\",\"action\":[\"style\",\"top: 0px !important;\"],\"cssable\":true}","{\"selector\":\".headerbanner-wrapper\",\"action\":[\"style\",\"min-height: 0 !important;\"],\"cssable\":true}","{\"selector\":\"header.lsa\",\"action\":[\"style\",\"margin-top: 0 !important;\"],\"cssable\":true}","{\"selector\":\"#page_wrapper\",\"action\":[\"style\",\"cursor: auto !important;\"],\"cssable\":true}","{\"selector\":\".content\",\"action\":[\"style\",\"margin-top: 0px !important;\"],\"cssable\":true}","{\"selector\":\"#frs\",\"action\":[\"style\",\"margin-top: 100px !important;\"],\"cssable\":true}","{\"selector\":\".main-block-3.section-ms-v-hokeji-2025\",\"action\":[\"style\",\"background-color:black !important;background-image:none !important\"],\"cssable\":true}","{\"selector\":\".main-block-3.section-ms-v-hokeji-2025 .block-title.main\",\"action\":[\"style\",\"padding-bottom:0 !important\"],\"cssable\":true}","{\"selector\":\"main\",\"action\":[\"style\",\"background-color:white !important;background-image:none !important\"],\"cssable\":true}","{\"selector\":\".article-of-day-doxxbet-sponsor\",\"action\":[\"style\",\"background-color:black !important;background-image:none !important\"],\"cssable\":true}","{\"selector\":\".section-tiposbet-sponsor .main-block-3\",\"action\":[\"style\",\"background-color:red !important;background-image:none !important\"],\"cssable\":true}","{\"selector\":\"*\",\"tasks\":[[\"matches-css\",{\"name\":\"position\",\"value\":[\"fixed\",\"i\"]}],[\"has\",{\"selector\":\"+ * img\",\"tasks\":[[\"matches-css\",{\"name\":\"float\",\"value\":[\"left\",\"i\"]}]]}]]}","{\"selector\":\"*\",\"tasks\":[[\"matches-css\",{\"name\":\"position\",\"value\":[\"fixed\",\"i\"]}],[\"spath\",\" + *\"],[\"has\",{\"selector\":\"img\",\"tasks\":[[\"matches-css\",{\"name\":\"float\",\"value\":[\"left\",\"i\"]}]]}]]}","{\"selector\":\"*\",\"tasks\":[[\"matches-css\",{\"name\":\"position\",\"value\":[\"fixed\",\"i\"]}],[\"has\",{\"selector\":\"+ * *\",\"tasks\":[[\"matches-css\",{\"name\":\"float\",\"value\":[\"left\",\"i\"]}],[\"matches-css\",{\"name\":\"background\",\"value\":[\"url.*\",\"i\"]}]]}]]}","{\"selector\":\"*\",\"tasks\":[[\"matches-css\",{\"name\":\"position\",\"value\":[\"fixed\",\"i\"]}],[\"spath\",\" + *\"],[\"has\",{\"selector\":\"*\",\"tasks\":[[\"matches-css\",{\"name\":\"float\",\"value\":[\"left\",\"i\"]}],[\"matches-css\",{\"name\":\"background\",\"value\":[\"url.*\",\"i\"]}]]}]]}","{\"selector\":\"a\",\"tasks\":[[\"matches-css\",{\"name\":\"background\",\"value\":[\"marteva\",\"i\"]}],[\"upward\",3]]}","{\"selector\":\"#head_c\",\"action\":[\"style\",\"margin-top: 0 !important;\"],\"cssable\":true}","{\"selector\":\"body\",\"action\":[\"style\",\"background:none !important;\"],\"cssable\":true}","{\"selector\":\"script\",\"tasks\":[[\"has-text\",\"stopPrntScr\"]]}","{\"selector\":\"style\",\"action\":[\"remove\",\"\"],\"tasks\":[[\"has-text\",\"::selection\"]]}","{\"selector\":\"div[class=\\\"advertisement-item-container\\\"]\",\"action\":[\"style\",\"visibility: hidden !important;\"],\"cssable\":true}","{\"selector\":\"div.jeg_topbar\",\"action\":[\"style\",\"margin-bottom: 0px !important;\"],\"cssable\":true}","{\"selector\":\"article\",\"tasks\":[[\"has-text\",\"/^Reklama$/\"]]}","{\"selector\":\"article\",\"tasks\":[[\"has-text\",\"Reklama\"]]}"];
const selectorLists = /* 25 */ "0;1,10;2;3;11,12,4,5;11,13,14,4,5;6,7;6;8;9;10;15;16;17;18,19,20;19,20;20;21;22;23,24,25,26,27;28,29,30,31,32,33;34;35,36,37;38;-41,39";
const selectorListRefs = /* 34 */ "9,1,10,9,13,23,24,8,18,18,12,2,0,20,21,11,12,16,7,17,22,4,5,6,3,0,0,8,15,14,19,0,0,14";
const hostnames = /* 34 */ ["cdr.cz","csfd.cz","csfd.sk","diit.cz","kupi.cz","zing.cz","zive.cz","bombuj.si","kinema.sk","sector.sk","nerdfix.cz","doktorka.cz","hnonline.sk","titulky.com","uschovna.cz","headliner.cz","indian-tv.cz","jablickar.cz","pppeter.shop","prehrajto.cz","vranovske.sk","enigmaplus.cz","epochaplus.cz","autozurnal.com","dotekomanie.cz","dia.hnonline.sk","hn24.hnonline.sk","serialy.bombuj.si","androidmagazine.eu","samsungmagazine.eu","sport.aktuality.sk","brainee.hnonline.sk","mediweb.hnonline.sk","letemsvetemapplem.eu"];
const hasEntities = false;

self.proceduralImports = self.proceduralImports || [];
self.proceduralImports.push({ selectors, selectorLists, selectorListRefs, hostnames, hasEntities });

/******************************************************************************/

})();

/******************************************************************************/
