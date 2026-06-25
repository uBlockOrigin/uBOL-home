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

// rus-1

// Important!
// Isolate from global scope
(function uBOL_cssGenericImport() {

const lowlyGeneric = new Map(/* 1 */[[24270,"a#mobtop[title^=\"Рейтинг мобильных сайтов\"]"]]);
const highlyGeneric = /* 25 */"[alt=\"Rambler's Top100\"],\n[title=\"uCoz Counter\"],\n[title=\"uWeb Counter\"],\na[href*=\"//top.mail.ru/jump?\"],\na[href*=\"//www.liveinternet.ru/stat/\"][aria-label=\"LiveInternet\"],\na[href*=\"/rating/\"] > img[width=\"88\"][height=\"31\"],\na[href*=\"rambler.ru/top100/\"],\na[href*=\"top100.rambler.ru/\"],\na[href=\"http://vtambove.ru/advert/banner_network/\"],\na[href^=\"http://click.hotlog.ru/\"],\na[href^=\"http://hitcounter.ru/top/stat.php\"],\na[href^=\"https://prime.rambler.ru/promo/\"],\na[title=\"TopTracker.Ru - Рейтинг трекеров.\"],\nimg[data-src=\"https://catalog.orbita.co.il/orbita.gif\"],\nimg[onclick*=\"clustrmaps.com/counter/\"],\nimg[src*=\"//counter.yadro.ru/\"],\nimg[src*=\"//i.i.ua/r/\"],\nimg[src*=\"://c.bigmir.net/\"],\nimg[src*=\"://r.i.ua/\"],\nimg[src*=\"cycounter\"][width=\"88\"][height=\"31\"],\nimg[src*=\"top.mail.ru/counter?\"],\nimg[src^=\"/stat/\"][width=\"88\"][height=\"31\"],\nimg[style*=\"//counter.yadro.ru/\"],\nimg[title=\"bigmir)net TOP 100\"],\na[href*=\"://metrika.yandex.ru/stat/\"]";
const exceptions = /* 7 */["a[href*=\"://metrika.yandex.ru/stat/\"]","a[href*=\"://metrika.yandex.ru/stat/\"]","a[href*=\"rambler.ru/top100/\"]\na[href*=\"top100.rambler.ru/\"]","a[href=\"http://vtambove.ru/advert/banner_network/\"]",".adbanner",".ad_title","a[href*=\"//www.liveinternet.ru/stat/\"][aria-label=\"LiveInternet\"]"];
const hostnames = /* 7 */["yandex.*","yandex.ru","rambler.ru","vtambove.ru","only-paper.*","inoreader.com","liveinternet.ru"];
const hasEntities = true;

self.genericSelectorMaps = self.genericSelectorMaps ?? [];
self.genericSelectorMaps.push(lowlyGeneric);
self.genericDetails = self.genericDetails ?? [];
self.genericDetails.push({ highlyGeneric, exceptions, hostnames, hasEntities });

})();

/******************************************************************************/
