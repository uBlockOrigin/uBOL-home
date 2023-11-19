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

const argsList = [["{\"selector\":\"#overlay\",\"tasks\":[[\"has\",{\"selector\":\"#dialog\"}]]}"],["{\"selector\":\"body > div > div\",\"tasks\":[[\"has\",{\"selector\":\"#jentis_consent\"}]]}"],["{\"selector\":\"#CookieWrapper\",\"action\":[\"remove\",\"\"]}"],["{\"selector\":\"body > div:not([class]):not([id]) > div[class*=\\\" \\\"]\",\"tasks\":[[\"has\",{\"selector\":\"> div > div > div[class] > a[href^=\\\"https://policy.medium.com/medium-privacy-policy-\\\"]\"}]]}","{\"selector\":\"div\",\"tasks\":[[\"has\",{\"selector\":\"div[role=\\\"alert\\\"] > a[href^=\\\"https://policy.medium.com/medium-privacy-policy-\\\"]\"}]]}"],["{\"selector\":\"section[id][class]\",\"tasks\":[[\"has\",{\"selector\":\"> div[class] > button[class][onclick^=\\\"onClickCookiesBannerWeb\\\"]\"}]]}"],["{\"selector\":\"body\",\"action\":[\"style\",\"display: flex !important\"],\"tasks\":[[\"has\",{\"selector\":\"div[class*=\\\"Styled\\\"][class*=\\\"Container\\\"] [data-testid=\\\"bbc-logo-wrapper\\\"]\"}],[\"spath\",\" > .fc-consent-root\"]]}"],["{\"selector\":\".MuiDialog-root\",\"tasks\":[[\"has\",{\"selector\":\"#cookie_svg__a\"}]]}"],["{\"selector\":\"body\",\"tasks\":[[\"not\",{\"selector\":\"\",\"tasks\":[[\"has\",{\"selector\":\"div[class*=\\\"player\\\" i][class*=\\\"_container\\\"], #root .datastrip\"}]]}],[\"spath\",\" > div[id^=\\\"sp_message_container\\\"]\"]]}"],["{\"selector\":\"#ask-consent\",\"action\":[\"remove\",\"\"]}"],["{\"selector\":\".gb_g\",\"tasks\":[[\"has-text\",\"cookie\"]]}"],["{\"selector\":\".warning\",\"tasks\":[[\"has\",{\"selector\":\"[data-cookie-type]\"}]]}"],["{\"selector\":\".modal\",\"tasks\":[[\"has\",{\"selector\":\"#eprivacy\"}]]}"],["{\"selector\":\"#moduleCookies\",\"action\":[\"remove\",\"\"]}"],["{\"selector\":\".hasParental.cookies-modal\",\"action\":[\"remove\",\"\"]}"],["{\"selector\":\"div[class^=\\\"elements__Banner-\\\"]\",\"tasks\":[[\"has\",{\"selector\":\"> div > a[href$=\\\"-privacy-policy\\\"]\"}]]}"],["{\"selector\":\"dialog\",\"action\":[\"remove\",\"\"]}"],["{\"selector\":\"body\",\"action\":[\"style\",\"display: block !important\"],\"tasks\":[[\"has\",{\"selector\":\".article-body p\",\"tasks\":[[\"has-text\",\"Sisältöä ei voitu ladata.Tämä voi johtua selainlaajennuksesta.\"]]}],[\"spath\",\" > .alma-cmpv2-container\"]]}"],["{\"selector\":\"body\",\"action\":[\"style\",\"display: block !important\"],\"tasks\":[[\"has\",{\"selector\":\".consents-checker\"}],[\"spath\",\" > .alma-cmpv2-container\"]]}"],["{\"selector\":\".container\",\"action\":[\"style\",\"display: block !important\"],\"tasks\":[[\"has\",{\"selector\":\".consent-blocking-embed-message\"}],[\"spath\",\" ~ #onetrust-consent-sdk\"]]}"],["{\"selector\":\"div[data-testid=\\\"modal\\\"]\",\"action\":[\"style\",\"display: block !important\"],\"tasks\":[[\"not\",{\"selector\":\"\",\"tasks\":[[\"has\",{\"selector\":\"div[data-testid=\\\"cookie-consent-modal\\\"]\"}]]}]]}"],["{\"selector\":\".fixed\",\"tasks\":[[\"has\",{\"selector\":\".cookies-scrollbar\"}]]}"]];

const hostnamesMap = new Map([["moebelix.at",1],["schwarzenbacher-kundl.at",2],["primegaming.blog",3],["uxdesign.cc",3],["eand.co",3],["blog.discord.com",3],["infosecwriteups.com",3],["medium.com",3],["netflixtechblog.com",3],["towardsdatascience.com",3],["windscribe.com",3],["medium.engineering",3],["codeburst.io",3],["plainenglish.io",3],["minhaconexao.com.br",4],["bbc.com",5],["app.bionic-reading.com",6],["bloomberg.com",7],["e-comas.com",8],["play.google.com",9],["istockphoto.com",10],["kiertokanki.com",11],["topographic-map.com",12],["xhamster.com",13],["xhamster2.com",13],["xhamster3.com",13],["xhamster18.desi",13],["yogainternational.com",14],["computerbase.de",15],["arvopaperi.fi",16],["www.kauppalehti.fi",16],["mediuutiset.fi",16],["mikrobitti.fi",16],["talouselama.fi",16],["tekniikkatalous.fi",16],["tivi.fi",16],["www.uusisuomi.fi",16],["iltalehti.fi",17],["mtvuutiset.fi",18],["vr.fi",19],["sonarhome.pl",20]]);

const entitiesMap = new Map([["music.amazon",0]]);

const exceptionsMap = new Map(undefined);

self.proceduralImports = self.proceduralImports || [];
self.proceduralImports.push({ argsList, hostnamesMap, entitiesMap, exceptionsMap });

/******************************************************************************/

})();

/******************************************************************************/
