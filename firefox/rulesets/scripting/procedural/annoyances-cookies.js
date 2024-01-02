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

// ruleset: annoyances-cookies

/******************************************************************************/

// Important!
// Isolate from global scope
(function uBOL_cssProceduralImport() {

/******************************************************************************/

const argsList = [["{\"selector\":\"#overlay\",\"tasks\":[[\"has\",{\"selector\":\"[href*=\\\"privacyprefs/\\\"]\"}]]}"],["{\"selector\":\"body > div > div\",\"tasks\":[[\"has\",{\"selector\":\"#jentis_consent\"}]]}"],["{\"selector\":\"#CookieWrapper\",\"action\":[\"remove\",\"\"]}"],["{\"selector\":\"div[id$=\\\"_modal_outer_\\\"]\",\"tasks\":[[\"has\",{\"selector\":\"> .cookie-modal\"}]]}"],["{\"selector\":\"body > div:not([class]):not([id]) > div[class*=\\\" \\\"]\",\"tasks\":[[\"has\",{\"selector\":\"> div > div > div[class] > a[href^=\\\"https://policy.medium.com/medium-privacy-policy-\\\"]\"}]]}","{\"selector\":\"div\",\"tasks\":[[\"has\",{\"selector\":\"div[role=\\\"alert\\\"] > a[href^=\\\"https://policy.medium.com/medium-privacy-policy-\\\"]\"}]]}"],["{\"selector\":\"section[id][class]\",\"tasks\":[[\"has\",{\"selector\":\"> div[class] > button[class][onclick^=\\\"onClickCookiesBannerWeb\\\"]\"}]]}"],["{\"selector\":\"body\",\"action\":[\"style\",\"display: flex !important\"],\"tasks\":[[\"has\",{\"selector\":\"div[class*=\\\"Styled\\\"][class*=\\\"Container\\\"] [data-testid=\\\"bbc-logo-wrapper\\\"]\"}],[\"spath\",\" > .fc-consent-root\"]]}"],["{\"selector\":\"#ask-consent\",\"action\":[\"remove\",\"\"]}"],["{\"selector\":\".gb_g\",\"tasks\":[[\"has-text\",\"cookie\"]]}"],["{\"selector\":\".warning\",\"tasks\":[[\"has\",{\"selector\":\"[data-cookie-type]\"}]]}"],["{\"selector\":\".modal\",\"tasks\":[[\"has\",{\"selector\":\"#eprivacy\"}]]}"],["{\"selector\":\".sanoma-logo-container ~ .message-component.privacy-manager-tcfv2 .tcfv2-stack:not([title=\\\"Sanoman sisällönjakelukumppanit\\\"]) button.pm-switch.checked\",\"action\":[\"remove-class\",\"checked\"]}"],["{\"selector\":\".undefined\",\"tasks\":[[\"has\",{\"selector\":\"[data-test-selector=\\\"click-the-cookie-banner\\\"]\"}]]}"],["{\"selector\":\"#moduleCookies\",\"action\":[\"remove\",\"\"]}"],["{\"selector\":\".hasParental.cookies-modal\",\"action\":[\"remove\",\"\"]}"],["{\"selector\":\"div[class^=\\\"elements__Banner-\\\"]\",\"tasks\":[[\"has\",{\"selector\":\"> div > a[href$=\\\"-privacy-policy\\\"]\"}]]}"],["{\"selector\":\"dialog\",\"action\":[\"remove\",\"\"]}"],["{\"selector\":\".fancybox-container\",\"tasks\":[[\"has\",{\"selector\":\"a[onclick=\\\"document.getElementById('privacy_more').style.display='block';\\\"]\"}]]}"],["{\"selector\":\".container\",\"action\":[\"style\",\"display: block !important\"],\"tasks\":[[\"has\",{\"selector\":\".consent-blocking-embed-message\"}],[\"spath\",\" ~ #onetrust-consent-sdk\"]]}"],["{\"selector\":\".banner\",\"tasks\":[[\"has\",{\"selector\":\"[href=\\\"javascript:acceptAllCookies();void(0);\\\"]\"}]]}"],["{\"selector\":\".fixed\",\"tasks\":[[\"has\",{\"selector\":\".cookies-scrollbar\"}]]}"]];

const hostnamesMap = new Map([["moebelix.at",1],["schwarzenbacher-kundl.at",2],["flip.bg",3],["primegaming.blog",4],["uxdesign.cc",4],["eand.co",4],["blog.discord.com",4],["infosecwriteups.com",4],["medium.com",4],["netflixtechblog.com",4],["towardsdatascience.com",4],["windscribe.com",4],["medium.engineering",4],["codeburst.io",4],["plainenglish.io",4],["minhaconexao.com.br",5],["bbc.com",6],["e-comas.com",7],["play.google.com",8],["istockphoto.com",9],["kiertokanki.com",10],["cdn.privacy-mgmt.com",11],["studocu.com",12],["topographic-map.com",13],["xhamster.com",14],["xhamster2.com",14],["xhamster3.com",14],["xhamster.desi",14],["yogainternational.com",15],["computerbase.de",16],["50plusmatch.fi",17],["mtvuutiset.fi",18],["ilmattino.it",19],["leggo.it",19],["sonarhome.pl",20]]);

const entitiesMap = new Map([["music.amazon",0]]);

const exceptionsMap = new Map(undefined);

self.proceduralImports = self.proceduralImports || [];
self.proceduralImports.push({ argsList, hostnamesMap, entitiesMap, exceptionsMap });

/******************************************************************************/

})();

/******************************************************************************/
