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

// ruleset: annoyances-others

/******************************************************************************/

// Important!
// Isolate from global scope
(function uBOL_cssProceduralImport() {

/******************************************************************************/

const argsList = [["{\"selector\":\".feed-card\",\"tasks\":[[\"has\",{\"selector\":\"a[href*=\\\"cm.bilibili.com\\\"][data-target-url*=\\\"gaoneng.bilibili.com\\\"]\"}]]}","{\"selector\":\".is-rcmd\",\"tasks\":[[\"has\",{\"selector\":\"a[href*=\\\"cm.bilibili.com\\\"][data-target-url]:not([data-target-url*=\\\".bilibili.com/\\\"])\"}]]}"],["{\"selector\":\".tds-content > p\",\"tasks\":[[\"has-text\",\"Donate now\"]]}"],["{\"selector\":\".Ryrdad\",\"tasks\":[[\"has-text\",\"Please help us improve\"]]}","{\"selector\":\"div[jsname=\\\"wA2P2b\\\"]\",\"tasks\":[[\"has-text\",\"How helpful were the results\"]]}"],["{\"selector\":\".ReactModalPortal\",\"tasks\":[[\"has-text\",\"confidence\"]]}"],["{\"selector\":\".mt-10\",\"tasks\":[[\"has-text\",\"Laravel Jobs\"]]}"],["{\"selector\":\".encadre.bleu\",\"tasks\":[[\"has\",{\"selector\":\"a[href^=\\\"https://eepurl.com/\\\"]\"}]]}"],["{\"selector\":\".wp-block-group__inner-container\",\"tasks\":[[\"has-text\",\"Support the Washington Monthly\"]]}"],["{\"selector\":\"tp-yt-paper-dialog.ytmusic-popup-container\",\"tasks\":[[\"has-text\",\"/family plan|Premium|ad-free|background play|kept playing/\"]]}"],["{\"selector\":\"tp-yt-paper-dialog.ytd-popup-container\",\"tasks\":[[\"has-text\",\"/Become a member|How are your|How interested|Live TV|Wish videos|background play|better TV|cable box|cable reimagined|hidden fees|of YouTube TV|on YouTube TV|unlimited DVR|with YouTube TV|without the ads|try this feature/\"]]}"],["{\"selector\":\"body.topic-in-gated-category\",\"action\":[\"remove-class\",\"topic-in-gated-category\"]}"],["{\"selector\":\".code-mc-container-panel\",\"tasks\":[[\"has\",{\"selector\":\"a[href$=\\\"/ranking.html\\\"]\"}]]}"],["{\"selector\":\"\",\"tasks\":[[\"matches-path\",\"/\\\\/(search|tag)\\\\//\"],[\"spath\",\" .nicoadVideoItem\"]]}","{\"selector\":\"\",\"tasks\":[[\"matches-path\",\"/tag/\"],[\"spath\",\".nicodicNicoadVideoList\"]]}"],["{\"selector\":\".pb--medium\",\"tasks\":[[\"has-text\",\"Be part of the solution\"]]}"],["{\"selector\":\".MuiPaper-root.MuiPaper-elevation\",\"tasks\":[[\"has-text\",\"Create your own My DHL account\"]]}"],["{\"selector\":\"[data-broadcast-modal]\",\"action\":[\"remove\",\"\"]}"],["{\"selector\":\".element-action-button\",\"tasks\":[[\"has-text\",\"SHARE YOUR STORY\"]]}"],["{\"selector\":\".common-html-frame.html-content\",\"tasks\":[[\"has-text\",\"how much\"]]}"],["{\"selector\":\".bb-aside\",\"tasks\":[[\"has-text\",\"Get in Touch\"]]}"]];

const hostnamesMap = new Map([["bilibili.com",0],["dailysignal.com",1],["google.com",2],["grammarly.com",3],["laravel-news.com",4],["telesatellite.com",5],["washingtonmonthly.com",6],["music.youtube.com",7],["www.youtube.com",8],["linux.do",9],["bedstyle.jp",10],["www.nicovideo.jp",11],["positive.news",12],["my.dhlparcel.nl",13],["freshchoice.co.nz",14],["nzherald.co.nz",15],["stuff.co.nz",16],["propublica.org",17]]);

const entitiesMap = new Map(undefined);

const exceptionsMap = new Map(undefined);

self.proceduralImports = self.proceduralImports || [];
self.proceduralImports.push({ argsList, hostnamesMap, entitiesMap, exceptionsMap });

/******************************************************************************/

})();

/******************************************************************************/
