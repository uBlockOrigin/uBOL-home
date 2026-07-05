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

// rou-1

// Important!
// Isolate from global scope
(function uBOL_cssGenericImport() {

const lowlyGeneric = new Map(/* 10 */[[51371,"#digi-fm-live-stream"],[63309,".only-desktop.promotii-wrapper"],[24895,".only_desktop.related_on_top.parteneri.sectiune"],[10573,".SC_TBlock"],[25189,".strawberry_ads_container"],[39774,".strawberry-ads__pretty-container"],[40254,".strawberry-ads-manager-container"],[34679,".strawberry-ad-card"],[39851,".strawberry-ad"],[3896,"#sam_branding[style=\"min-height:250px;\"]"]]);
const highlyGeneric = /* 4 */"[href^=\"https://serve.efortuna.ro/\"],\n[href^=\"https://banners.livepartners.com/\"],\n[href=\"https://www.patriotromania.ro/\"],\n[href*=\"/add.php\"]";
const exceptions = /* 3 */["#ad-carousel","[href=\"https://www.patriotromania.ro/\"]",".adsbygoogle"];
const hostnames = /* 3 */["dez.ro","patriotromania.ro","televiziunea-medicala.ro"];
const hasEntities = false;

self.genericSelectorMaps = self.genericSelectorMaps ?? [];
self.genericSelectorMaps.push(lowlyGeneric);
self.genericDetails = self.genericDetails ?? [];
self.genericDetails.push({ highlyGeneric, exceptions, hostnames, hasEntities });

})();

/******************************************************************************/
