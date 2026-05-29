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

// irn-0

// Important!
// Isolate from global scope
(function uBOL_cssGenericImport() {

const lowlyGeneric = new Map(/* 17 */[[39148,".zxc,\n.zxc"],[31818,".zxc-m"],[56783,".zxc-stik"],[17047,".zxc_home"],[12311,".zxc_news"],[15011,".zxc_left"],[1038,".zxc_matni"],[52734,".zxc-mobile"],[32032,".zxc-header-zxc"],[32468,".zxc-visible-fixed"],[29270,".zxc-padding-custom,\n.zxc-padding-custom"],[60033,".main-zxc"],[49509,".home-zxc"],[39324,".top_zxc"],[15708,".zxc_top"],[53269,".side_txt_zxc"],[54363,"#kaprila_linktable"]]);
const highlyGeneric = /* 2 */"a[href^=\"https://arongroups.site/\"],\na[href^=\"https://arongroups.co/\"]";
const exceptions = /* 28 */[".adv_title",".herald-ad",".ad__header",".advert-image\n.block-advert\n.advert-wrap",".ads-block",".ads-content",".ads_2",".square-ad",".page-ads",".ad-custom-size\n.ad-cat",".adBox",".boxads",".footer__subscribe",".ads-text","a[href^=\"https://arongroups.site/\"]\na[href^=\"https://arongroups.co/\"]","#head728\n#ad728\n#ad640a",".ads-bottom",".ads-top",".widget-ad",".ads-content\n.tz_ad300_widget",".ads-image","a[href^=\"https://arongroups.site/\"]\na[href^=\"https://arongroups.co/\"]",".adlink\n.adstext",".box_ads",".adstop",".navad",".logo-ad",".related-ads"];
const hostnames = /* 28 */["ilna.ir","7ganj.ir","plaza.ir","ifixit.ir","chetor.com","cooldl.net","gamesib.ir","toranji.ir","gooyait.com","footofan.com","miniroid.com","nicmusic.net","ninisite.com","persianv.com","arongroups.co","elmefarda.com","estekhtam.com","gadgetnews.net","netnevesht.com","sakhtafzar.com","wikisemnan.com","arongroups.site","mybia4music.com","shahrebours.com","javan-musics.com","parsfootball.com","honarehzendegi.com","mashaghelkadeh.com"];
const hasEntities = false;

self.genericSelectorMaps = self.genericSelectorMaps ?? [];
self.genericSelectorMaps.push(lowlyGeneric);
self.genericDetails = self.genericDetails ?? [];
self.genericDetails.push({ highlyGeneric, exceptions, hostnames, hasEntities });

})();

/******************************************************************************/
