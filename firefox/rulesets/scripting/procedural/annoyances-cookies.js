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

const argsList = [["{\"selector\":\"#overlay\",\"tasks\":[[\"has\",{\"selector\":\"[href*=\\\"privacyprefs/\\\"]\"}]]}"],["{\"selector\":\"[data-p*=\\\"/consent.google.\\\"]\",\"tasks\":[[\"has\",{\"selector\":\"button[jsname=\\\"tWT92d\\\"]\"}]]}"],["{\"selector\":\"body > div > div\",\"tasks\":[[\"has\",{\"selector\":\"#jentis_consent\"}]]}"],["{\"selector\":\"#CookieWrapper\",\"action\":[\"remove\",\"\"]}"],["{\"selector\":\"div[id$=\\\"_modal_outer_\\\"]\",\"tasks\":[[\"has\",{\"selector\":\"> .cookie-modal\"}]]}"],["{\"selector\":\".fixed\",\"tasks\":[[\"has-text\",\"cookies\"]]}"],["{\"selector\":\"body > div:not([class]):not([id]) > div[class*=\\\" \\\"]\",\"tasks\":[[\"has\",{\"selector\":\"> div > div > div[class] > a[href^=\\\"https://policy.medium.com/medium-privacy-policy-\\\"]\"}]]}","{\"selector\":\"div\",\"tasks\":[[\"has\",{\"selector\":\"div[role=\\\"alert\\\"] > a[href^=\\\"https://policy.medium.com/medium-privacy-policy-\\\"]\"}]]}"],["{\"selector\":\"section[id][class]\",\"tasks\":[[\"has\",{\"selector\":\"> div[class] > button[class][onclick^=\\\"onClickCookiesBannerWeb\\\"]\"}]]}"],["{\"selector\":\".MuiBox-root\",\"tasks\":[[\"has-text\",\"Welcome,\"]]}"],["{\"selector\":\"body\",\"action\":[\"style\",\"display: flex !important\"],\"tasks\":[[\"has\",{\"selector\":\"div[class*=\\\"Styled\\\"][class*=\\\"Container\\\"] [data-testid=\\\"bbc-logo-wrapper\\\"]\"}],[\"spath\",\" > .fc-consent-root\"]]}"],["{\"selector\":\".hasParental.cookies-modal\",\"action\":[\"remove\",\"\"]}"],["{\"selector\":\"#ask-consent\",\"action\":[\"remove\",\"\"]}"],["{\"selector\":\".gb_g\",\"tasks\":[[\"has-text\",\"cookie\"]]}"],["{\"selector\":\".warning\",\"tasks\":[[\"has\",{\"selector\":\"[data-cookie-type]\"}]]}"],["{\"selector\":\".modal\",\"tasks\":[[\"has\",{\"selector\":\"#eprivacy\"}]]}"],["{\"selector\":\".cc-banner\",\"action\":[\"remove\",\"\"]}"],["{\"selector\":\"body > div[style*=\\\"z-index: 2147483647\\\"]\",\"tasks\":[[\"has\",{\"selector\":\"a[href=\\\"https://nytimes.com/cookie-policy/\\\"]\"}]]}"],["{\"selector\":\".DVWebNode-conditional-site-wide-wrapper\",\"tasks\":[[\"has\",{\"selector\":\"[data-testid=\\\"consent-reject-all-endpoint\\\"]\"}]]}"],["{\"selector\":\".sanoma-logo-container ~ .message-component.privacy-manager-tcfv2 .tcfv2-stack:not([title=\\\"Sanoman sisällönjakelukumppanit\\\"]) button.pm-switch.checked\",\"action\":[\"remove-class\",\"checked\"]}"],["{\"selector\":\".undefined\",\"tasks\":[[\"has\",{\"selector\":\"[data-test-selector=\\\"click-the-cookie-banner\\\"]\"}]]}"],["{\"selector\":\"#moduleCookies\",\"action\":[\"remove\",\"\"]}"],["{\"selector\":\".css-175oi2r.r-12vffkv[style^=\\\"position: absolute; bottom: 0px; width: 100%;\\\"]\",\"tasks\":[[\"has-text\",\"data protection\"]]}"],["{\"selector\":\"button\",\"tasks\":[[\"has-text\",\"Accept\"],[\"upward\",\"section\"]]}"],["{\"selector\":\"div[class^=\\\"elements__Banner-\\\"]\",\"tasks\":[[\"has\",{\"selector\":\"> div > a[href$=\\\"-privacy-policy\\\"]\"}]]}"],["{\"selector\":\"[data-p*=\\\"/consent.youtube.com\\\"]\",\"tasks\":[[\"has\",{\"selector\":\"button[jsname=\\\"tWT92d\\\"]\"}]]}","{\"selector\":\"body.bodyUIModernization\",\"tasks\":[[\"has\",{\"selector\":\"[action=\\\"https://consent.youtube.com/save\\\"] .saveButtonUIModernization[value][aria-label]\"}]]}"],["{\"selector\":\".fancybox-container\",\"tasks\":[[\"has\",{\"selector\":\"a[onclick=\\\"document.getElementById('privacy_more').style.display='block';\\\"]\"}]]}"],["{\"selector\":\".container\",\"action\":[\"style\",\"display: block !important\"],\"tasks\":[[\"has\",{\"selector\":\".consent-blocking-embed-message\"}],[\"spath\",\" ~ #onetrust-consent-sdk\"]]}"],["{\"selector\":\".banner\",\"tasks\":[[\"has\",{\"selector\":\"[href=\\\"javascript:acceptAllCookies();void(0);\\\"]\"}]]}"],["{\"selector\":\".fixed\",\"tasks\":[[\"has\",{\"selector\":\".cookies-scrollbar\"}]]}"]];

const hostnamesMap = new Map([["moebelix.at",2],["schwarzenbacher-kundl.at",3],["flip.bg",4],["blog.smithsecurity.biz",5],["primegaming.blog",6],["uxdesign.cc",6],["eand.co",6],["blog.discord.com",6],["infosecwriteups.com",6],["medium.com",6],["netflixtechblog.com",6],["towardsdatascience.com",6],["windscribe.com",6],["medium.engineering",6],["codeburst.io",6],["plainenglish.io",6],["minhaconexao.com.br",7],["news.abs-cbn.com",8],["bbc.com",9],["buktube.com",10],["xhaccess.com",10],["xhamster.com",10],["xhamster2.com",10],["xhamster3.com",10],["xhamster.desi",10],["e-comas.com",11],["play.google.com",12],["istockphoto.com",13],["kiertokanki.com",14],["nature.com",15],["link.springer.com",15],["archive.nytimes.com",16],["primevideo.com",17],["cdn.privacy-mgmt.com",18],["studocu.com",19],["topographic-map.com",20],["x.com",21],["xe.com",22],["yogainternational.com",23],["consent.youtube.com",24],["50plusmatch.fi",25],["mtvuutiset.fi",26],["ilmattino.it",27],["leggo.it",27],["sonarhome.pl",28]]);

const entitiesMap = new Map([["music.amazon",0],["consent.google",1]]);

const exceptionsMap = new Map(undefined);

self.proceduralImports = self.proceduralImports || [];
self.proceduralImports.push({ argsList, hostnamesMap, entitiesMap, exceptionsMap });

/******************************************************************************/

})();

/******************************************************************************/
