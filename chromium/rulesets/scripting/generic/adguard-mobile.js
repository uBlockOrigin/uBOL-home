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

// adguard-mobile

// Important!
// Isolate from global scope
(function uBOL_cssGenericImport() {

const lowlyGeneric = new Map(/* 20 */[[44129,".ads_all > .ads_w"],[11816,".ez-video-wrap"],[15560,"html[lang=\"tr\"] > body.has-footer-ad.has-pageskin-desktop a.pageskin-mobile-wrapper"],[46073,"body > #js-adContainer.adBlock"],[27588,"#mobile-adhesion:not(#style_important)"],[25889,"#ad-300x250_mid_mobile"],[34037,".sp_ad_box_top"],[15075,".happy-header-mobile"],[23220,".standard-article-vertical-ad"],[18072,".header-ad-mobile"],[8358,".under-player-ad-mobile"],[44580,".california-sticky-footer-ad-container"],[5821,".happy-under-player-mobile"],[9000,".b-mobile-spots"],[45255,"#ad_inview_area"],[54745,"body > div.page[data-kochava-app-guid^=\"kotegna-web-prod-\"] > .page__top > .universal-ad"],[56854,"#mgid_iframe1"],[8380,".amp-ad container"],[29966,".amp_ad"],[59787,"#ad-300x250_mobile"]]);
const highlyGeneric = /* 16 */"amp-iframe[src^=\"https://ad.vidverto.io/\"],\ndiv[class^=\"MidArticleAdUnit_mobile_\"],\ndiv[class^=\"PrimisMidArticleAdUnit_mobile_\"],\nimg[width=\"320\"][height=\"50\"],\niframe[width=\"320\"][height=\"50\"],\namp-iframe[src^=\"https://html.redtram.com/\"],\namp-auto-ads,\namp-embed[type=\"24smi\"],\namp-embed[type=\"smi2\"],\namp-embed[type=\"outbrain\"],\namp-embed[type=\"engageya\"],\namp-iframe[src^=\"https://ad.mediawayss.com/\"],\namp-iframe[src^=\"https://widgets.outbrain.com\"],\namp-sticky-ad,\namp-ad,\nbody > style + div[id=\"ics\"]";
const exceptions = /* 35 */["DIV[class^=\"banner\"]",".centered-ad",".zad.billboard",".s-result-item:has([data-ad-feedback-label-id])\n.s-result-item:has(div.puis-sponsored-label-text)","div[itemtype^=\"http://schema.org/\"] ~ div[data-role][data-target] ~ div:not(:last-child)\ndiv[itemtype=\"http://schema.org/BlogPosting\"] ~ div:not(:last-child)","img[width=\"320\"][height=\"50\"]","div[itemtype^=\"http://schema.org/\"] ~ div[data-role][data-target] ~ div:not(:last-child)\ndiv[itemtype=\"http://schema.org/BlogPosting\"] ~ div:not(:last-child)",".ad-billboard",".amp-unresolved","div > [style*=\"width: 100%;\"]:first-child",".header-ad",".header-ad",".ad-leaderboard-flex","img[width=\"320\"][height=\"50\"]",".advertisment\n#topAds",".header-ads-area",".header-ad\n.custom-ad","#AdvHeader",".sticky-ad",".ad-block",".header-ad",".mobile-ad",".block-ads","amp-auto-ads",".header-ad\n.custom-ad",".header-ad",".ad-fixed",".ad-leaderboard-flex",".header-ad","div[class^=\"ads-box-\"]",".custom-ad",".ad_area",".header-ad\n.custom-ad",".header-ad\n.custom-ad","div[id^=\"ad_position_\"]"];
const hostnames = /* 35 */["olx.ro","vip.de","ign.com","amazon.*","drive2.ru","bestech.sk","drive2.com","ismedia.jp","ettoday.net","pornhub.com","arseblog.com","gizchina.com","huffpost.com","live.fc2.com","m.veporn.net","milk-key.com","gizmobolt.com","matomedane.jp","milesplit.com","niji-gazo.com","stevengoh.com","deviantart.com","m.tubewolf.com","my-angers.info","blogdoiphone.com","reviews.mtbr.com","seattletimes.com","huffingtonpost.jp","idownloadblog.com","zeenews.india.com","mrmoneymustache.com","news.infoseek.co.jp","westseattleblog.com","moroccoworldnews.com","safeframe.googlesyndication.com"];
const hasEntities = true;

self.genericSelectorMaps = self.genericSelectorMaps ?? [];
self.genericSelectorMaps.push(lowlyGeneric);
self.genericDetails = self.genericDetails ?? [];
self.genericDetails.push({ highlyGeneric, exceptions, hostnames, hasEntities });

})();

/******************************************************************************/
