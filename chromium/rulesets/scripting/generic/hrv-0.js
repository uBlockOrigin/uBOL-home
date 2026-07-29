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

// hrv-0

// Important!
// Isolate from global scope
(function uBOL_cssGenericImport() {

const lowlyGeneric = new Map(/* 21 */[[13066,".fold_home__pasica_banner:not(html, body, :empty)"],[50251,"#googleglava"],[64124,"#googledesnovertikalna"],[22373,"#googleispodteksta"],[44705,"#googledolje"],[35991,".reklama-na-indexu:not(html, body, :empty)"],[63980,".homepage-top-google-banner:not(html, body, :empty)"],[28089,".js-gpt-ad:not(html, body, :empty)"],[2898,".banner-izdvojeno:not(html, body, :empty)"],[23131,".elementor-widget-smartmag-codes:not(html, body, :empty)"],[41625,".banner__placeholder:not(html, body, :empty)"],[866,".cxenseignore:not(html, body, :empty, [id])"],[2177,"div.lesnina_widget"],[30141,".td-a-ad:not(html, body, :empty)"],[65241,".adaplace:not(html, body, :empty)"],[54337,".gpt-ad-banner:not(html, body, :empty)"],[17729,".ad-loading-placeholder:not(html, body, :empty)"],[31475,".gddanas:not(html, body, :empty)"],[62557,".article-block__banner:not(html, body, :empty)"],[51150,"div#box-over-content-revive"],[29373,".item__ad-center:not(html, body, :empty)"]]);
const highlyGeneric = /* 1 */"div[data-ocm-ad]";
const exceptions = /* 1 */[".iAdserver"];
const hostnames = /* 1 */["radiosarajevo.ba"];
const hasEntities = false;

self.genericSelectorMaps = self.genericSelectorMaps ?? [];
self.genericSelectorMaps.push(lowlyGeneric);
self.genericDetails = self.genericDetails ?? [];
self.genericDetails.push({ highlyGeneric, exceptions, hostnames, hasEntities });

})();

/******************************************************************************/
