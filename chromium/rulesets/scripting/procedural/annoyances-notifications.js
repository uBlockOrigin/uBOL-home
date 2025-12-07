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


const selectors = /* 40 */ ["{\"selector\":\".bottom.fixed-container.m\",\"tasks\":[[\"has-text\",\"Get the best experience\"]]}","{\"selector\":\"section[data-lazy-id*=\\\"P0-\\\"]\",\"tasks\":[[\"has-text\",\"Cooking is easier on the app.\"]]}","{\"selector\":\".e1s06mna1\",\"tasks\":[[\"has-text\",\"Know the news\"]]}","{\"selector\":\"[data-component=\\\"RelatedCard\\\"]\",\"tasks\":[[\"has-text\",\"Stream your favourite shows\"]]}","{\"selector\":\".z-20.bottom-full\",\"tasks\":[[\"has-text\",\"Get Extension\"]]}","{\"selector\":\".gb-button\",\"tasks\":[[\"has-text\",\"Open App\"]]}","{\"selector\":\".fixed.lg\\\\:w-\\\\[750px\\\\]\",\"tasks\":[[\"has-text\",\"Stay Updated\"]]}","{\"selector\":\".min-h-16\",\"tasks\":[[\"has-text\",\"Get Notifications\"]]}","{\"selector\":\"strong\",\"tasks\":[[\"has-text\",\"GET THE FOX NEWS APP\"]]}","{\"selector\":\".gkz0-toast\",\"tasks\":[[\"has-text\",\"Get Price Alerts\"]]}","{\"selector\":\"div#public_post_contextual-sign-in\",\"tasks\":[[\"has-text\",\"Sign in to view more content\"]]}","{\"selector\":\"[aria-label=\\\"Notification\\\"]\",\"tasks\":[[\"has-text\",\"app\"]]}","{\"selector\":\".cwDafx\",\"tasks\":[[\"has-text\",\"Continue in the Bitcoin.com App\"]]}","{\"selector\":\".noVerticalPad\",\"tasks\":[[\"has-text\",\"Download the TPG App\"]]}","{\"selector\":\"body\",\"action\":[\"style\",\"overflow: auto !important\"],\"cssable\":true}","{\"selector\":\"body, html\",\"action\":[\"style\",\"height: auto !important; overflow: auto !important\"],\"cssable\":true}","{\"selector\":\"body\",\"action\":[\"style\",\"overflow: auto !important; position: initial !important;\"],\"cssable\":true}","{\"selector\":\"shreddit-async-loader[bundlename=\\\"app_selector\\\"]\",\"action\":[\"remove\",\"\"]}","{\"selector\":\"body.scroll-disabled\",\"action\":[\"style\",\"overflow: visible!important; position: static!important;\"],\"cssable\":true}","{\"selector\":\"body\",\"action\":[\"style\",\"pointer-events:auto !important;\"],\"cssable\":true}","{\"selector\":\"html\",\"action\":[\"style\",\"overflow: auto !important;\"],\"cssable\":true}","{\"selector\":\"body\",\"action\":[\"style\",\"margin-top:0px !important\"],\"cssable\":true}","{\"selector\":\"body, html\",\"action\":[\"style\",\"overflow: auto !important; position: initial !important;\"],\"cssable\":true}","{\"selector\":\"body\",\"action\":[\"style\",\"height: auto !important; overflow: auto !important\"],\"cssable\":true}","{\"selector\":\".MuiModal-root.MuiDialog-root\",\"tasks\":[[\"has-text\",\"Open in Bambu Handy\"]]}","{\"selector\":\"html\",\"action\":[\"style\",\"overflow: auto !important; position: initial !important;\"],\"cssable\":true}","{\"selector\":\"body\",\"action\":[\"style\",\"overflow: scroll !important\"],\"cssable\":true}","{\"selector\":\"body\",\"action\":[\"style\",\"overflow: auto !important;\"],\"cssable\":true}","{\"selector\":\"body\",\"action\":[\"style\",\"overflow: unset !important\"],\"cssable\":true}","{\"selector\":\"html\",\"action\":[\"style\",\"--g-header-top-pos: 0vw !important;\"],\"cssable\":true}","{\"selector\":\"#pfs-upsell\",\"action\":[\"remove\",\"\"]}","{\"selector\":\".exposed-filters\",\"action\":[\"style\",\"top:0 !important\"],\"cssable\":true}","{\"selector\":\".hsnyER.sc-fEpuOf\",\"action\":[\"style\",\"top:0 !important\"],\"cssable\":true}","{\"selector\":\".shadow-xl\",\"tasks\":[[\"has-text\",\"Would you like to be notified\"]]}","{\"selector\":\".sticky-2vWAY\",\"action\":[\"style\",\"top: 0px; transform: translate(-50%, 0rem) !important\"],\"cssable\":true}","{\"selector\":\".app-header\",\"action\":[\"style\",\"top:0 !important\"],\"cssable\":true}","{\"selector\":\"#s_header[style=\\\"top: 84px;\\\"]\",\"action\":[\"style\",\"top: 0 !important;\"],\"cssable\":true}","{\"selector\":\"html[data-smartbanner-original-margin-top=\\\"0\\\"][style=\\\"margin-top: 84px;\\\"]\",\"action\":[\"style\",\"margin-top: 0 !important;\"],\"cssable\":true}","{\"selector\":\".smartbanner-show\",\"action\":[\"style\",\"margin-top: 0 !important;\"],\"cssable\":true}","{\"selector\":\"body, html\",\"action\":[\"style\",\"overflow-y: auto !important;\"],\"cssable\":true}"];
const selectorLists = /* 34 */ "0;1;2;3;4;5;6,7;8;9;10,16;11;12,32;13;14;15;16;16,24;17,18,19;20;21;22;23;25;26;27;28;29;30,31;33;34;35;36,37;38;39";
const selectorListRefs = /* 108 */ "13,24,21,22,15,31,29,15,23,15,20,8,20,20,20,20,20,20,20,20,20,20,20,20,20,20,20,13,20,3,1,20,20,20,20,20,20,20,20,20,20,20,20,26,17,27,20,19,4,6,20,7,15,21,20,2,28,32,9,20,20,20,15,20,20,20,20,20,20,20,21,20,20,20,20,20,21,33,20,5,20,20,20,20,20,0,10,25,16,32,15,30,15,21,21,15,20,11,21,21,12,0,14,20,15,18,20,20";
const hostnames = /* 108 */ ["ask.fm","9gag.com","cnet.com","ebay.com","imgur.io","izumi.jp","temu.com","trip.com","audius.co","canva.com","ifunny.co","kayak.com","m.yelp.be","m.yelp.ca","m.yelp.cz","m.yelp.de","m.yelp.dk","m.yelp.es","m.yelp.fi","m.yelp.fr","m.yelp.ie","m.yelp.it","m.yelp.nl","m.yelp.no","m.yelp.pt","m.yelp.se","player.fm","puuilo.fi","thedp.com","abc.net.au","delish.com","expedia.at","expedia.de","expedia.dk","expedia.es","expedia.fi","expedia.fr","expedia.it","expedia.nl","expedia.no","expedia.se","hotels.com","m.yelp.com","miravia.es","reddit.com","zillow.com","behance.net","bestbuy.com","chatgpt.com","dexerto.com","expedia.com","foxnews.com","insider.com","rappler.com","thestar.com","7news.com.au","benzinga.com","cecile.co.jp","linkedin.com","m.yelp.co.jp","m.yelp.co.nz","m.yelp.co.uk","nextdoor.com","expedia.co.id","expedia.co.in","expedia.co.jp","expedia.co.kr","expedia.co.nz","expedia.co.th","expedia.co.uk","instacart.com","m.yelp.com.au","m.yelp.com.br","m.yelp.com.mx","m.yelp.com.tr","m.yelp.com.tw","newsbreak.com","s.tabelog.com","simpleswap.io","dailynews24.in","eksisozluk.com","expedia.com.ar","expedia.com.au","expedia.com.hk","expedia.com.sg","m.facebook.com","mail.proton.me","makemytrip.com","makerworld.com","nola-novel.com","phonearena.com","similarweb.com","slickdeals.net","asia.nikkei.com","businesspost.ie","coinpaprika.com","sports.ndtv.com","news.bitcoin.com","realestate.co.nz","sprintmedical.in","thepointsguy.com","www.facebook.com","autoevolution.com","thedesignlove.com","businessinsider.com","lightnovelworld.com","m.economictimes.com","copilot.microsoft.com"];
const hasEntities = false;

self.proceduralImports = self.proceduralImports || [];
self.proceduralImports.push({ selectors, selectorLists, selectorListRefs, hostnames, hasEntities });

/******************************************************************************/

})();

/******************************************************************************/
