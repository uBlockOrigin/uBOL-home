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

const argsList = [["{\"selector\":\"#overlay\",\"tasks\":[[\"has\",{\"selector\":\"[href*=\\\"privacyprefs/\\\"]\"}]]}"],["{\"selector\":\"[data-p*=\\\"/consent.google.\\\"]\",\"tasks\":[[\"has\",{\"selector\":\"button[jsname=\\\"tWT92d\\\"]\"}]]}"],["{\"selector\":\"body\",\"action\":[\"style\",\"overflow: auto !important;\"],\"tasks\":[[\"has\",{\"selector\":\"#mms-consent-portal-container\"}]]}"],["{\"selector\":\"body > div > div\",\"tasks\":[[\"has\",{\"selector\":\"#jentis_consent\"}]]}"],["{\"selector\":\"#CookieWrapper\",\"action\":[\"remove\",\"\"]}"],["{\"selector\":\"div[id$=\\\"_modal_outer_\\\"]\",\"tasks\":[[\"has\",{\"selector\":\"> .cookie-modal\"}]]}"],["{\"selector\":\".fixed\",\"tasks\":[[\"has-text\",\"cookies\"]]}"],["{\"selector\":\"body > div:not([class]):not([id]) > div[class*=\\\" \\\"]\",\"tasks\":[[\"has\",{\"selector\":\"> div > div > div[class] > a[href^=\\\"https://policy.medium.com/medium-privacy-policy-\\\"]\"}]]}","{\"selector\":\"div\",\"tasks\":[[\"has\",{\"selector\":\"div[role=\\\"alert\\\"] > a[href^=\\\"https://policy.medium.com/medium-privacy-policy-\\\"]\"}]]}"],["{\"selector\":\"section[id][class]\",\"tasks\":[[\"has\",{\"selector\":\"> div[class] > button[class][onclick^=\\\"onClickCookiesBannerWeb\\\"]\"}]]}"],["{\"selector\":\".MuiStack-root\",\"tasks\":[[\"has-text\",\"Personalised ads\"]]}"],["{\"selector\":\".MuiBox-root\",\"tasks\":[[\"has-text\",\"Welcome,\"]]}"],["{\"selector\":\"body\",\"action\":[\"style\",\"display: flex !important\"],\"tasks\":[[\"has\",{\"selector\":\"div[class*=\\\"Styled\\\"][class*=\\\"Container\\\"] [data-testid=\\\"bbc-logo-wrapper\\\"]\"}],[\"spath\",\" > .fc-consent-root\"]]}"],["{\"selector\":\".hasParental.cookies-modal\",\"action\":[\"remove\",\"\"]}"],["{\"selector\":\"#ask-consent\",\"action\":[\"remove\",\"\"]}"],["{\"selector\":\".gb_g\",\"tasks\":[[\"has-text\",\"cookie\"]]}"],["{\"selector\":\".Wrapper--1lbmq00\",\"tasks\":[[\"has-text\",\"This website uses cookies\"]]}"],["{\"selector\":\".warning\",\"tasks\":[[\"has\",{\"selector\":\"[data-cookie-type]\"}]]}"],["{\"selector\":\".modal\",\"tasks\":[[\"has\",{\"selector\":\"#eprivacy\"}]]}"],["{\"selector\":\".cc-banner\",\"action\":[\"remove\",\"\"]}"],["{\"selector\":\"body > div[style*=\\\"z-index: 2147483647\\\"]\",\"tasks\":[[\"has\",{\"selector\":\"a[href=\\\"https://nytimes.com/cookie-policy/\\\"]\"}]]}"],["{\"selector\":\".DVWebNode-conditional-site-wide-wrapper\",\"tasks\":[[\"has\",{\"selector\":\"[data-testid=\\\"consent-reject-all-endpoint\\\"]\"}]]}"],["{\"selector\":\".sanoma-logo-container ~ .message-component.privacy-manager-tcfv2 .tcfv2-stack:not([title=\\\"Sanoman sisällönjakelukumppanit\\\"]) button.pm-switch.checked\",\"action\":[\"remove-class\",\"checked\"]}"],["{\"selector\":\".undefined\",\"tasks\":[[\"has\",{\"selector\":\"[data-test-selector=\\\"click-the-cookie-banner\\\"]\"}]]}"],["{\"selector\":\"#moduleCookies\",\"action\":[\"remove\",\"\"]}"],["{\"selector\":\"div[role=\\\"dialog\\\"]\",\"action\":[\"style\",\"visibility: hidden !important;\"],\"tasks\":[[\"has\",{\"selector\":\"button[data-tracking-name=\\\"cookie-preferences-mloi-initial-opt-out\\\"]\"}]]}"],["{\"selector\":\".css-175oi2r.r-12vffkv[style^=\\\"position: absolute; bottom: 0px; width: 100%;\\\"]\",\"tasks\":[[\"has-text\",\"data protection\"]]}"],["{\"selector\":\"button\",\"tasks\":[[\"has-text\",\"Accept\"],[\"upward\",\"section\"]]}"],["{\"selector\":\"div[class^=\\\"elements__Banner-\\\"]\",\"tasks\":[[\"has\",{\"selector\":\"> div > a[href$=\\\"-privacy-policy\\\"]\"}]]}"],["{\"selector\":\"[data-p*=\\\"/consent.youtube.com\\\"]\",\"tasks\":[[\"has\",{\"selector\":\"button[jsname=\\\"tWT92d\\\"]\"}]]}","{\"selector\":\"body.bodyUIModernization\",\"tasks\":[[\"has\",{\"selector\":\"[action=\\\"https://consent.youtube.com/save\\\"] .saveButtonUIModernization[value][aria-label]\"}]]}"],["{\"selector\":\".fancybox-container\",\"tasks\":[[\"has\",{\"selector\":\"a[onclick=\\\"document.getElementById('privacy_more').style.display='block';\\\"]\"}]]}"],["{\"selector\":\".container\",\"action\":[\"style\",\"display: block !important\"],\"tasks\":[[\"has\",{\"selector\":\".consent-blocking-embed-message\"}],[\"spath\",\" ~ #onetrust-consent-sdk\"]]}"],["{\"selector\":\"html[style=\\\"overflow: hidden;\\\"]\",\"action\":[\"style\",\"overflow: auto !important\"],\"tasks\":[[\"not\",{\"selector\":\"\",\"tasks\":[[\"has\",{\"selector\":\"#cmp_consent_wall\"}]]}]]}"],["{\"selector\":\".banner\",\"tasks\":[[\"has\",{\"selector\":\"[href=\\\"javascript:acceptAllCookies();void(0);\\\"]\"}]]}"],["{\"selector\":\"body\",\"action\":[\"style\",\"overflow: auto !important;\"],\"tasks\":[[\"has\",{\"selector\":\"#cmp_consent_wall\"}]]}"],["{\"selector\":\".fixed\",\"tasks\":[[\"has\",{\"selector\":\".cookies-scrollbar\"}]]}"]];

const hostnamesMap = new Map([["moebelix.at",3],["schwarzenbacher-kundl.at",4],["flip.bg",5],["blog.smithsecurity.biz",6],["primegaming.blog",7],["uxdesign.cc",7],["eand.co",7],["blog.discord.com",7],["infosecwriteups.com",7],["medium.com",7],["netflixtechblog.com",7],["towardsdatascience.com",7],["windscribe.com",7],["medium.engineering",7],["codeburst.io",7],["plainenglish.io",7],["minhaconexao.com.br",8],["memefi.club",9],["news.abs-cbn.com",10],["bbc.com",11],["buktube.com",12],["xhaccess.com",12],["xhamster.com",12],["xhamster2.com",12],["xhamster3.com",12],["xhamster.desi",12],["e-comas.com",13],["play.google.com",14],["honeygain.com",15],["istockphoto.com",16],["kiertokanki.com",17],["nature.com",18],["link.springer.com",18],["archive.nytimes.com",19],["primevideo.com",20],["cdn.privacy-mgmt.com",21],["studocu.com",22],["topographic-map.com",23],["ubereats.com",24],["x.com",25],["xe.com",26],["yogainternational.com",27],["consent.youtube.com",28],["50plusmatch.fi",29],["mtvuutiset.fi",30],["capital.it",31],["deejay.it",31],["ilmattino.it",[31,32,33]],["leggo.it",[31,32]],["libero.it",31],["m2o.it",31],["tiscali.it",31],["sonarhome.pl",34]]);

const entitiesMap = new Map([["music.amazon",0],["consent.google",1],["mediamarkt",2]]);

const exceptionsMap = new Map(undefined);

self.proceduralImports = self.proceduralImports || [];
self.proceduralImports.push({ argsList, hostnamesMap, entitiesMap, exceptionsMap });

/******************************************************************************/

})();

/******************************************************************************/
