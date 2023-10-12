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

const argsList = [["{\"selector\":\"body > div > div\",\"tasks\":[[\"has\",{\"selector\":\"#jentis_consent\"}]]}"],["{\"selector\":\"#CookieWrapper\",\"action\":[\"remove\",\"\"]}"],["{\"selector\":\"body > div:not([class]):not([id]) > div[class*=\\\" \\\"]\",\"tasks\":[[\"has\",{\"selector\":\"> div > div > div[class] > a[href^=\\\"https://policy.medium.com/medium-privacy-policy-\\\"]\"}]]}","{\"selector\":\"div\",\"tasks\":[[\"has\",{\"selector\":\"div[role=\\\"alert\\\"] > a[href^=\\\"https://policy.medium.com/medium-privacy-policy-\\\"]\"}]]}"],["{\"selector\":\"section[id][class]\",\"tasks\":[[\"has\",{\"selector\":\"> div[class] > button[class][onclick^=\\\"onClickCookiesBannerWeb\\\"]\"}]]}"],["{\"selector\":\"body\",\"action\":[\"style\",\"display: flex !important\"],\"tasks\":[[\"has\",{\"selector\":\"div[class*=\\\"Styled\\\"][class*=\\\"Container\\\"] [data-testid=\\\"bbc-logo-wrapper\\\"]\"}],[\"spath\",\" > .fc-consent-root\"]]}"],["{\"selector\":\".MuiDialog-root\",\"tasks\":[[\"has\",{\"selector\":\"#cookie_svg__a\"}]]}"],["{\"selector\":\"body\",\"tasks\":[[\"not\",{\"selector\":\"\",\"tasks\":[[\"has\",{\"selector\":\"div[class*=\\\"player\\\" i][class*=\\\"_container\\\"], #root .datastrip\"}]]}],[\"spath\",\" > div[id^=\\\"sp_message_container\\\"]\"]]}"],["{\"selector\":\"#ask-consent\",\"action\":[\"remove\",\"\"]}"],["{\"selector\":\"body\",\"action\":[\"style\",\"display: block !important\"],\"tasks\":[[\"has\",{\"selector\":\".fandom-video-button\"}],[\"spath\",\" [data-tracking-opt-in-overlay=\\\"true\\\"]\"]]}","{\"selector\":\"body\",\"action\":[\"style\",\"display: block !important\"],\"tasks\":[[\"has\",{\"selector\":\".fandom-video__container\"}],[\"spath\",\" [data-tracking-opt-in-overlay=\\\"true\\\"]\"]]}","{\"selector\":\"body\",\"action\":[\"style\",\"display: block !important\"],\"tasks\":[[\"has\",{\"selector\":\"main[class] [class^=\\\"CanonicalVideoPlayer\\\"]\"}],[\"spath\",\" [data-tracking-opt-in-overlay=\\\"true\\\"]\"]]}"],["{\"selector\":\".gb_g\",\"tasks\":[[\"has-text\",\"cookie\"]]}"],["{\"selector\":\".warning\",\"tasks\":[[\"has\",{\"selector\":\"[data-cookie-type]\"}]]}"],["{\"selector\":\".modal\",\"tasks\":[[\"has\",{\"selector\":\"#eprivacy\"}]]}"],["{\"selector\":\"#moduleCookies\",\"action\":[\"remove\",\"\"]}"],["{\"selector\":\".hasParental.cookies-modal\",\"action\":[\"remove\",\"\"]}"],["{\"selector\":\"dialog\",\"action\":[\"remove\",\"\"]}"],["{\"selector\":\"body\",\"tasks\":[[\"not\",{\"selector\":\"\",\"tasks\":[[\"has\",{\"selector\":\".embed-cookie-consent-icon\"}]]}],[\"spath\",\" > div[id^=\\\"sp_message_container\\\"]\"]]}"],["{\"selector\":\"body\",\"action\":[\"style\",\"display: block !important\"],\"tasks\":[[\"has\",{\"selector\":\".article-body p\",\"tasks\":[[\"has-text\",\"Sisältöä ei voitu ladata.Tämä voi johtua selainlaajennuksesta.\"]]}],[\"spath\",\" > .alma-cmpv2-container\"]]}"],["{\"selector\":\"body\",\"tasks\":[[\"not\",{\"selector\":\"\",\"tasks\":[[\"has\",{\"selector\":\".consent_required_iframe\"}]]}],[\"spath\",\" > div[id^=\\\"sp_message_container\\\"]\"]]}"],["{\"selector\":\"body\",\"action\":[\"style\",\"display: block !important\"],\"tasks\":[[\"has\",{\"selector\":\".consents-checker\"}],[\"spath\",\" > .alma-cmpv2-container\"]]}"],["{\"selector\":\".container\",\"action\":[\"style\",\"display: block !important\"],\"tasks\":[[\"has\",{\"selector\":\".consent-blocking-embed-message\"}],[\"spath\",\" ~ #onetrust-consent-sdk\"]]}"],["{\"selector\":\"div[data-testid=\\\"modal\\\"]\",\"action\":[\"style\",\"display: block !important\"],\"tasks\":[[\"not\",{\"selector\":\"\",\"tasks\":[[\"has\",{\"selector\":\"div[data-testid=\\\"cookie-consent-modal\\\"]\"}]]}]]}"],["{\"selector\":\".fixed\",\"tasks\":[[\"has\",{\"selector\":\".cookies-scrollbar\"}]]}"]];

const hostnamesMap = new Map([["moebelix.at",0],["schwarzenbacher-kundl.at",1],["primegaming.blog",2],["uxdesign.cc",2],["eand.co",2],["blog.discord.com",2],["infosecwriteups.com",2],["medium.com",2],["netflixtechblog.com",2],["towardsdatascience.com",2],["windscribe.com",2],["medium.engineering",2],["codeburst.io",2],["plainenglish.io",2],["minhaconexao.com.br",3],["bbc.com",4],["app.bionic-reading.com",5],["bloomberg.com",6],["e-comas.com",7],["fandom.com",8],["play.google.com",9],["istockphoto.com",10],["kiertokanki.com",11],["topographic-map.com",12],["xhamster.com",13],["xhamster2.com",13],["xhamster3.com",13],["xhamster18.desi",13],["computerbase.de",14],["aamulehti.fi",15],["hs.fi",15],["is.fi",15],["jamsanseutu.fi",15],["janakkalansanomat.fi",15],["kankaanpaanseutu.fi",15],["kmvlehti.fi",15],["merikarvialehti.fi",15],["nokianuutiset.fi",15],["rannikkoseutu.fi",15],["satakunnankansa.fi",15],["suurkeuruu.fi",15],["sydansatakunta.fi",15],["tyrvaansanomat.fi",15],["valkeakoskensanomat.fi",15],["arvopaperi.fi",16],["www.kauppalehti.fi",16],["mediuutiset.fi",16],["mikrobitti.fi",16],["talouselama.fi",16],["tekniikkatalous.fi",16],["tivi.fi",16],["www.uusisuomi.fi",16],["etlehti.fi",17],["gloria.fi",17],["hyvaterveys.fi",17],["kodinkuvalehti.fi",17],["soppa365.fi",17],["vauva.fi",17],["iltalehti.fi",18],["mtvuutiset.fi",19],["vr.fi",20],["sonarhome.pl",21]]);

const entitiesMap = new Map(undefined);

const exceptionsMap = new Map(undefined);

self.proceduralImports = self.proceduralImports || [];
self.proceduralImports.push({ argsList, hostnamesMap, entitiesMap, exceptionsMap });

/******************************************************************************/

})();

/******************************************************************************/
