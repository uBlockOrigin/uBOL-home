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

// vie-1

// Important!
// Isolate from global scope
(function uBOL_cssGenericImport() {

const lowlyGeneric = new Map(/* 20 */[[11916,"#_AM_POPUP_FRAME"],[60996,"#ads-preload"],[7458,"#banner-top"],[6491,"#mobileCatfish"],[47368,"#pmadv"],[44677,".aanetwork-ads-box"],[33586,".ad_location"],[31619,".adsbygoogle[data-ad-slot]"],[31012,".banner-ads"],[30908,".close-ads"],[9843,".float-ck"],[56502,".google-auto-placed"],[64683,".jw-cue"],[58576,".midroll-marker"],[26407,".quangcao"],[5212,".right-box.top-block"],[58138,".samBannerUnit"],[38916,".tpm-unit"],[9950,".qc"],[14993,".banner-bottom"]]);
const highlyGeneric = /* 4 */"[class^=\"adHTML\"],\n[id^=\"bn_bottom_fixed_\"],\ndiv[style=\"position: fixed; inset: 0px; z-index: 2147483647; pointer-events: auto;\"],\n[id^=\"adm-slot\"]";
const exceptions = /* 19 */[".qc",".advertiser",".qc","#adsContainer","[id^=\"adm-slot\"]",".showads",".qc","[class^=\"div-gpt-ad\"]",".c-ads",".imageads","#ad-slot",".qc",".adheader",".banner-bottom","ins.adsbygoogle[data-ad-slot]",".ads_top","#horizontal-ad\n.blogAd",".ad-space\n.ad_unit",".inline-ad"];
const hostnames = /* 19 */["dm.de","vn2.vn","msn.com","pops.vn","cafef.vn","vndoc.com","medium.com","quykhu.com","sayhentai.sh","thanhnien.vn","timvanban.vn","livescore.com","tratu.soha.vn","vnexpress.net","ios.codevn.net","nhipcaudautu.vn","phongroblox.com","googleapiscdn.com","gicovietnam.blogspot.com"];
const hasEntities = false;

self.genericSelectorMaps = self.genericSelectorMaps ?? [];
self.genericSelectorMaps.push(lowlyGeneric);
self.genericDetails = self.genericDetails ?? [];
self.genericDetails.push({ highlyGeneric, exceptions, hostnames, hasEntities });

})();

/******************************************************************************/
