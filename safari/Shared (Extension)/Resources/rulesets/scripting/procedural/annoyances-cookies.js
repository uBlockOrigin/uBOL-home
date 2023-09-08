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

const argsList = [["{\"selector\":\"#CookieWrapper\",\"action\":[\"remove\",\"\"]}"],["{\"selector\":\"body > div:not([class]):not([id]) > div[class*=\\\" \\\"]\",\"tasks\":[[\"has\",{\"selector\":\"> div > div > div[class] > a[href^=\\\"https://policy.medium.com/medium-privacy-policy-\\\"]\"}]]}","{\"selector\":\"div\",\"tasks\":[[\"has\",{\"selector\":\"div[role=\\\"alert\\\"] > a[href^=\\\"https://policy.medium.com/medium-privacy-policy-\\\"]\"}]]}"],["{\"selector\":\"section[id][class]\",\"tasks\":[[\"has\",{\"selector\":\" > div[class] > button[class][onclick^=\\\"onClickCookiesBannerWeb\\\"]\"}]]}"],["{\"selector\":\"body\",\"action\":[\"style\",\"display: flex !important\"],\"tasks\":[[\"has\",{\"selector\":\"div[class*=\\\"Styled\\\"][class*=\\\"Container\\\"] [data-testid=\\\"bbc-logo-wrapper\\\"]\"}],[\"spath\",\"> .fc-consent-root\"]]}"],["{\"selector\":\".MuiDialog-root\",\"tasks\":[[\"has\",{\"selector\":\"#cookie_svg__a\"}]]}"],["{\"selector\":\"body\",\"tasks\":[[\"not\",{\"selector\":\"\",\"tasks\":[[\"has\",{\"selector\":\"div[class*=\\\"player\\\" i][class*=\\\"_container\\\"], #root .datastrip\"}]]}],[\"spath\",\"> div[id^=\\\"sp_message_container\\\"]\"]]}"],["{\"selector\":\"body div[style] div[class]\",\"tasks\":[[\"has\",{\"selector\":\"> div[class][role=\\\"dialog\\\"] > div[class] > span[class] > a[href*=\\\"cookie\\\"]\"}]]}"],["{\"selector\":\"#ask-consent\",\"action\":[\"remove\",\"\"]}"],["{\"selector\":\"body\",\"action\":[\"style\",\"display: block !important\"],\"tasks\":[[\"has\",{\"selector\":\".fandom-video-button\"}],[\"spath\",\"[data-tracking-opt-in-overlay=\\\"true\\\"]\"]]}","{\"selector\":\"body\",\"action\":[\"style\",\"display: block !important\"],\"tasks\":[[\"has\",{\"selector\":\".fandom-video__container\"}],[\"spath\",\"[data-tracking-opt-in-overlay=\\\"true\\\"]\"]]}","{\"selector\":\"body\",\"action\":[\"style\",\"display: block !important\"],\"tasks\":[[\"has\",{\"selector\":\"main[class] [class^=\\\"CanonicalVideoPlayer\\\"]\"}],[\"spath\",\"[data-tracking-opt-in-overlay=\\\"true\\\"]\"]]}"],["{\"selector\":\".gb_g\",\"tasks\":[[\"has-text\",\"cookie\"]]}"],["{\"selector\":\".warning\",\"tasks\":[[\"has\",{\"selector\":\"[data-cookie-type]\"}]]}"],["{\"selector\":\"#moduleCookies\",\"action\":[\"remove\",\"\"]}"],["{\"selector\":\".hasParental.cookies-modal\",\"action\":[\"remove\",\"\"]}"],["{\"selector\":\"dialog\",\"action\":[\"remove\",\"\"]}"],["{\"selector\":\"body\",\"tasks\":[[\"not\",{\"selector\":\"\",\"tasks\":[[\"has\",{\"selector\":\".embed-cookie-consent-icon\"}]]}],[\"spath\",\"> div[id^=\\\"sp_message_container\\\"]\"]]}"],["{\"selector\":\"body\",\"action\":[\"style\",\"display: block !important\"],\"tasks\":[[\"has\",{\"selector\":\".article-body p\",\"tasks\":[[\"has-text\",\"Sisältöä ei voitu ladata.Tämä voi johtua selainlaajennuksesta.\"]]}],[\"spath\",\"> .alma-cmpv2-container\"]]}"],["{\"selector\":\"body\",\"tasks\":[[\"not\",{\"selector\":\"\",\"tasks\":[[\"has\",{\"selector\":\".consent_required_iframe\"}]]}],[\"spath\",\"> div[id^=\\\"sp_message_container\\\"]\"]]}"],["{\"selector\":\"body\",\"action\":[\"style\",\"display: block !important\"],\"tasks\":[[\"has\",{\"selector\":\".consents-checker\"}],[\"spath\",\"> .alma-cmpv2-container\"]]}"],["{\"selector\":\".container\",\"action\":[\"style\",\"display: block !important\"],\"tasks\":[[\"has\",{\"selector\":\".consent-blocking-embed-message\"}],[\"spath\",\"~ #onetrust-consent-sdk\"]]}"],["{\"selector\":\"div[data-testid=\\\"modal\\\"]\",\"action\":[\"style\",\"display: block !important\"],\"tasks\":[[\"not\",{\"selector\":\"\",\"tasks\":[[\"has\",{\"selector\":\"div[data-testid=\\\"cookie-consent-modal\\\"]\"}]]}]]}"],["{\"selector\":\".fixed\",\"tasks\":[[\"has\",{\"selector\":\".cookies-scrollbar\"}]]}"]];

const hostnamesMap = new Map([["schwarzenbacher-kundl.at",0],["primegaming.blog",1],["uxdesign.cc",1],["eand.co",1],["blog.discord.com",1],["infosecwriteups.com",1],["medium.com",1],["netflixtechblog.com",1],["towardsdatascience.com",1],["windscribe.com",1],["medium.engineering",1],["codeburst.io",1],["plainenglish.io",1],["minhaconexao.com.br",2],["bbc.com",3],["app.bionic-reading.com",4],["bloomberg.com",5],["canva.com",6],["e-comas.com",7],["fandom.com",8],["play.google.com",9],["istockphoto.com",10],["topographic-map.com",11],["xhamster.com",12],["xhamster2.com",12],["xhamster3.com",12],["xhamster18.desi",12],["computerbase.de",13],["aamulehti.fi",14],["hs.fi",14],["is.fi",14],["jamsanseutu.fi",14],["janakkalansanomat.fi",14],["kankaanpaanseutu.fi",14],["kmvlehti.fi",14],["merikarvialehti.fi",14],["nokianuutiset.fi",14],["rannikkoseutu.fi",14],["satakunnankansa.fi",14],["suurkeuruu.fi",14],["sydansatakunta.fi",14],["tyrvaansanomat.fi",14],["valkeakoskensanomat.fi",14],["arvopaperi.fi",15],["www.kauppalehti.fi",15],["mediuutiset.fi",15],["mikrobitti.fi",15],["talouselama.fi",15],["tekniikkatalous.fi",15],["tivi.fi",15],["www.uusisuomi.fi",15],["etlehti.fi",16],["gloria.fi",16],["hyvaterveys.fi",16],["kodinkuvalehti.fi",16],["soppa365.fi",16],["vauva.fi",16],["iltalehti.fi",17],["mtvuutiset.fi",18],["vr.fi",19],["sonarhome.pl",20]]);

const entitiesMap = new Map(undefined);

const exceptionsMap = new Map(undefined);

self.proceduralImports = self.proceduralImports || [];
self.proceduralImports.push({ argsList, hostnamesMap, entitiesMap, exceptionsMap });

/******************************************************************************/

})();

/******************************************************************************/
