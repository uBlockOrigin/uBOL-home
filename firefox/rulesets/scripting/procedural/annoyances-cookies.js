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

// ruleset: annoyances-cookies

/******************************************************************************/

// Important!
// Isolate from global scope
(function uBOL_cssProceduralImport() {

/******************************************************************************/

const argsList = [["{\"selector\":\"body > div > div\",\"tasks\":[[\"has\",{\"selector\":\"#jentis_consent\"}]]}"],["{\"selector\":\"#CookieWrapper\",\"action\":[\"remove\",\"\"]}"],["{\"selector\":\"body > div:not([class]):not([id]) > div[class*=\\\" \\\"]\",\"tasks\":[[\"has\",{\"selector\":\"> div > div > div[class] > a[href^=\\\"https://policy.medium.com/medium-privacy-policy-\\\"]\"}]]}","{\"selector\":\"div\",\"tasks\":[[\"has\",{\"selector\":\"div[role=\\\"alert\\\"] > a[href^=\\\"https://policy.medium.com/medium-privacy-policy-\\\"]\"}]]}"],["{\"selector\":\"section[id][class]\",\"tasks\":[[\"has\",{\"selector\":\"> div[class] > button[class][onclick^=\\\"onClickCookiesBannerWeb\\\"]\"}]]}"],["{\"selector\":\"body\",\"action\":[\"style\",\"display: flex !important\"],\"tasks\":[[\"has\",{\"selector\":\"div[class*=\\\"Styled\\\"][class*=\\\"Container\\\"] [data-testid=\\\"bbc-logo-wrapper\\\"]\"}],[\"spath\",\" > .fc-consent-root\"]]}"],["{\"selector\":\".MuiDialog-root\",\"tasks\":[[\"has\",{\"selector\":\"#cookie_svg__a\"}]]}"],["{\"selector\":\"body\",\"tasks\":[[\"not\",{\"selector\":\"\",\"tasks\":[[\"has\",{\"selector\":\"div[class*=\\\"player\\\" i][class*=\\\"_container\\\"], #root .datastrip\"}]]}],[\"spath\",\" > div[id^=\\\"sp_message_container\\\"]\"]]}"],["{\"selector\":\"#ask-consent\",\"action\":[\"remove\",\"\"]}"],["{\"selector\":\".gb_g\",\"tasks\":[[\"has-text\",\"cookie\"]]}"],["{\"selector\":\".warning\",\"tasks\":[[\"has\",{\"selector\":\"[data-cookie-type]\"}]]}"],["{\"selector\":\".modal\",\"tasks\":[[\"has\",{\"selector\":\"#eprivacy\"}]]}"],["{\"selector\":\"#moduleCookies\",\"action\":[\"remove\",\"\"]}"],["{\"selector\":\".hasParental.cookies-modal\",\"action\":[\"remove\",\"\"]}"],["{\"selector\":\"div[class^=\\\"elements__Banner-\\\"]\",\"tasks\":[[\"has\",{\"selector\":\"> div > a[href$=\\\"-privacy-policy\\\"]\"}]]}"],["{\"selector\":\"dialog\",\"action\":[\"remove\",\"\"]}"],["{\"selector\":\"body\",\"action\":[\"style\",\"display: block !important\"],\"tasks\":[[\"has\",{\"selector\":\".article-body p\",\"tasks\":[[\"has-text\",\"Sisältöä ei voitu ladata.Tämä voi johtua selainlaajennuksesta.\"]]}],[\"spath\",\" > .alma-cmpv2-container\"]]}"],["{\"selector\":\"body\",\"action\":[\"style\",\"display: block !important\"],\"tasks\":[[\"has\",{\"selector\":\".consents-checker\"}],[\"spath\",\" > .alma-cmpv2-container\"]]}"],["{\"selector\":\".container\",\"action\":[\"style\",\"display: block !important\"],\"tasks\":[[\"has\",{\"selector\":\".consent-blocking-embed-message\"}],[\"spath\",\" ~ #onetrust-consent-sdk\"]]}"],["{\"selector\":\"div[data-testid=\\\"modal\\\"]\",\"action\":[\"style\",\"display: block !important\"],\"tasks\":[[\"not\",{\"selector\":\"\",\"tasks\":[[\"has\",{\"selector\":\"div[data-testid=\\\"cookie-consent-modal\\\"]\"}]]}]]}"],["{\"selector\":\".fixed\",\"tasks\":[[\"has\",{\"selector\":\".cookies-scrollbar\"}]]}"]];

const hostnamesMap = new Map([["moebelix.at",0],["schwarzenbacher-kundl.at",1],["primegaming.blog",2],["uxdesign.cc",2],["eand.co",2],["blog.discord.com",2],["infosecwriteups.com",2],["medium.com",2],["netflixtechblog.com",2],["towardsdatascience.com",2],["windscribe.com",2],["medium.engineering",2],["codeburst.io",2],["plainenglish.io",2],["minhaconexao.com.br",3],["bbc.com",4],["app.bionic-reading.com",5],["bloomberg.com",6],["e-comas.com",7],["play.google.com",8],["istockphoto.com",9],["kiertokanki.com",10],["topographic-map.com",11],["xhamster.com",12],["xhamster2.com",12],["xhamster3.com",12],["xhamster18.desi",12],["yogainternational.com",13],["computerbase.de",14],["arvopaperi.fi",15],["www.kauppalehti.fi",15],["mediuutiset.fi",15],["mikrobitti.fi",15],["talouselama.fi",15],["tekniikkatalous.fi",15],["tivi.fi",15],["www.uusisuomi.fi",15],["iltalehti.fi",16],["mtvuutiset.fi",17],["vr.fi",18],["sonarhome.pl",19]]);

const entitiesMap = new Map(undefined);

const exceptionsMap = new Map(undefined);

self.proceduralImports = self.proceduralImports || [];
self.proceduralImports.push({ argsList, hostnamesMap, entitiesMap, exceptionsMap });

/******************************************************************************/

})();

/******************************************************************************/
