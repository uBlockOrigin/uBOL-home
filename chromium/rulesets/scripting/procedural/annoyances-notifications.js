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

// ruleset: annoyances-notifications

// Important!
// Isolate from global scope
(function uBOL_cssProceduralImport() {

/******************************************************************************/

const argsList = ["[]","[{\"selector\":\".bottom.fixed-container.m\",\"tasks\":[[\"has-text\",\"Get the best experience\"]]}]","[{\"selector\":\"section[data-lazy-id*=\\\"P0-\\\"]\",\"tasks\":[[\"has-text\",\"Cooking is easier on the app.\"]]}]","[{\"selector\":\".e1s06mna1\",\"tasks\":[[\"has-text\",\"Know the news\"]]}]","[{\"selector\":\"[data-component=\\\"RelatedCard\\\"]\",\"tasks\":[[\"has-text\",\"Stream your favourite shows\"]]}]","[{\"selector\":\".z-20.bottom-full\",\"tasks\":[[\"has-text\",\"Get Extension\"]]}]","[{\"selector\":\".gb-button\",\"tasks\":[[\"has-text\",\"Open App\"]]}]","[{\"selector\":\".fixed.lg\\\\:w-\\\\[750px\\\\]\",\"tasks\":[[\"has-text\",\"Stay Updated\"]]},{\"selector\":\".min-h-16\",\"tasks\":[[\"has-text\",\"Get Notifications\"]]}]","[{\"selector\":\"strong\",\"tasks\":[[\"has-text\",\"GET THE FOX NEWS APP\"]]}]","[{\"selector\":\".gkz0-toast\",\"tasks\":[[\"has-text\",\"Get Price Alerts\"]]}]","[{\"selector\":\"div#public_post_contextual-sign-in\",\"tasks\":[[\"has-text\",\"Sign in to view more content\"]]}]","[{\"selector\":\"[aria-label=\\\"Notification\\\"]\",\"tasks\":[[\"has-text\",\"app\"]]}]","[{\"selector\":\".cwDafx\",\"tasks\":[[\"has-text\",\"Continue in the Bitcoin.com App\"]]},{\"selector\":\".hsnyER.sc-fEpuOf\",\"action\":[\"style\",\"top:0 !important\"],\"cssable\":true}]","[{\"selector\":\".noVerticalPad\",\"tasks\":[[\"has-text\",\"Download the TPG App\"]]}]","[{\"selector\":\"body\",\"action\":[\"style\",\"overflow: auto !important\"],\"cssable\":true}]","[{\"selector\":\"body, html\",\"action\":[\"style\",\"height: auto !important; overflow: auto !important\"],\"cssable\":true}]","[{\"selector\":\"body\",\"action\":[\"style\",\"overflow: auto !important; position: initial !important;\"],\"cssable\":true}]","[{\"selector\":\"body\",\"action\":[\"style\",\"pointer-events:auto !important;\"],\"cssable\":true},{\"selector\":\"body.scroll-disabled\",\"action\":[\"style\",\"overflow: visible!important; position: static!important;\"],\"cssable\":true},{\"selector\":\"shreddit-async-loader[bundlename=\\\"app_selector\\\"]\",\"action\":[\"remove\",\"\"]}]","[{\"selector\":\"html\",\"action\":[\"style\",\"overflow: auto !important;\"],\"cssable\":true}]","[{\"selector\":\"body\",\"action\":[\"style\",\"margin-top:0px !important\"],\"cssable\":true}]","[{\"selector\":\"body, html\",\"action\":[\"style\",\"overflow: auto !important; position: initial !important;\"],\"cssable\":true}]","[{\"selector\":\"body\",\"action\":[\"style\",\"height: auto !important; overflow: auto !important\"],\"cssable\":true}]","[{\"selector\":\".MuiModal-root.MuiDialog-root\",\"tasks\":[[\"has-text\",\"Open in Bambu Handy\"]]}]","[{\"selector\":\"html\",\"action\":[\"style\",\"overflow: auto !important; position: initial !important;\"],\"cssable\":true}]","[{\"selector\":\"body\",\"action\":[\"style\",\"overflow: scroll !important\"],\"cssable\":true}]","[{\"selector\":\"body\",\"action\":[\"style\",\"overflow: auto !important;\"],\"cssable\":true}]","[{\"selector\":\"body\",\"action\":[\"style\",\"overflow: unset !important\"],\"cssable\":true}]","[{\"selector\":\"html\",\"action\":[\"style\",\"--g-header-top-pos: 0vw !important;\"],\"cssable\":true}]","[{\"selector\":\"#pfs-upsell\",\"action\":[\"remove\",\"\"]},{\"selector\":\".exposed-filters\",\"action\":[\"style\",\"top:0 !important\"],\"cssable\":true}]","[{\"selector\":\".shadow-xl\",\"tasks\":[[\"has-text\",\"Would you like to be notified\"]]}]","[{\"selector\":\".sticky-2vWAY\",\"action\":[\"style\",\"top: 0px; transform: translate(-50%, 0rem) !important\"],\"cssable\":true}]","[{\"selector\":\".app-header\",\"action\":[\"style\",\"top:0 !important\"],\"cssable\":true}]","[{\"selector\":\"#s_header[style=\\\"top: 84px;\\\"]\",\"action\":[\"style\",\"top: 0 !important;\"],\"cssable\":true},{\"selector\":\"html[data-smartbanner-original-margin-top=\\\"0\\\"][style=\\\"margin-top: 84px;\\\"]\",\"action\":[\"style\",\"margin-top: 0 !important;\"],\"cssable\":true}]","[{\"selector\":\".smartbanner-show\",\"action\":[\"style\",\"margin-top: 0 !important;\"],\"cssable\":true}]","[{\"selector\":\"body, html\",\"action\":[\"style\",\"overflow-y: auto !important;\"],\"cssable\":true}]"];
const argsSeqs = [0,1,2,3,4,5,6,7,8,9,-10,16,11,12,13,14,15,16,-16,22,17,18,19,20,21,23,24,25,26,27,28,29,30,31,32,33,34];
const hostnamesMap = new Map([["m.facebook.com",1],["www.facebook.com",1],["delish.com",2],["7news.com.au",3],["abc.net.au",4],["chatgpt.com",5],["dailynews24.in",6],["dexerto.com",7],["foxnews.com",8],["kayak.com",9],["linkedin.com",10],["mail.proton.me",12],["news.bitcoin.com",13],["thepointsguy.com",14],["puuilo.fi",15],["ask.fm",15],["autoevolution.com",16],["phonearena.com",17],["trip.com",17],["makerworld.com",18],["imgur.io",17],["coinpaprika.com",17],["slickdeals.net",17],["canva.com",17],["nextdoor.com",17],["insider.com",17],["businessinsider.com",17],["reddit.com",20],["lightnovelworld.com",21],["bestbuy.com",22],["expedia.at",23],["expedia.co.id",23],["expedia.co.in",23],["expedia.co.jp",23],["expedia.co.kr",23],["expedia.co.nz",23],["expedia.co.th",23],["expedia.co.uk",23],["expedia.com.ar",23],["expedia.com.au",23],["expedia.com.hk",23],["expedia.com.sg",23],["expedia.de",23],["expedia.dk",23],["expedia.es",23],["expedia.fi",23],["expedia.fr",23],["expedia.it",23],["expedia.no",23],["expedia.se",23],["hotels.com",23],["expedia.nl",23],["expedia.com",23],["behance.net",23],["ifunny.co",23],["player.fm",23],["m.economictimes.com",23],["m.yelp.com",23],["m.yelp.co.uk",23],["m.yelp.ca",23],["m.yelp.com.au",23],["m.yelp.co.nz",23],["m.yelp.dk",23],["m.yelp.de",23],["m.yelp.fi",23],["m.yelp.cz",23],["m.yelp.fr",23],["m.yelp.es",23],["m.yelp.pt",23],["m.yelp.it",23],["m.yelp.no",23],["m.yelp.se",23],["m.yelp.ie",23],["m.yelp.com.tr",23],["m.yelp.com.br",23],["m.yelp.nl",23],["m.yelp.com.mx",23],["m.yelp.co.jp",23],["m.yelp.com.tw",23],["m.yelp.be",23],["thedesignlove.com",23],["simpleswap.io",23],["thestar.com",23],["sports.ndtv.com",23],["thedp.com",23],["eksisozluk.com",23],["copilot.microsoft.com",23],["asia.nikkei.com",24],["businesspost.ie",24],["rappler.com",24],["sprintmedical.in",24],["cnet.com",24],["realestate.co.nz",24],["instacart.com",24],["newsbreak.com",24],["ebay.com",25],["audius.co",26],["9gag.com",27],["makemytrip.com",28],["miravia.es",29],["zillow.com",30],["benzinga.com",31],["temu.com",32],["similarweb.com",33],["izumi.jp",34],["cecile.co.jp",35],["nola-novel.com",35],["s.tabelog.com",36]]);
const hasEntities = false;

self.proceduralImports = self.proceduralImports || [];
self.proceduralImports.push({ argsList, argsSeqs, hostnamesMap, hasEntities });

/******************************************************************************/

})();

/******************************************************************************/
