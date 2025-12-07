/*******************************************************************************

    uBlock Origin Lite - a comprehensive, MV3-compliant content blocker
    Copyright (C) 2019-present Raymond Hill

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

// ruleset: est-0

// Important!
// Isolate from global scope
(function uBOL_cssSpecificImports() {

/******************************************************************************/

const selectors = /* 175 */ ["#content-box-right",".ad-box",".top-bar-content","div[id^=\"bsa-block\"]",".top-banner-container","#freefilePopup_background","#freefilePopup_wrapper",".noticeBoxAbs","div[class*=\"banner-placeholder\"]","DIV.adzones","DIV[id*=\"_panels_kb_ad\"]","DIV.banner",".noscriptcssresponsive.noscriptcss.panel",".viewtopicads.panel","a[href*=\"site_banner\"]","#cookie_ribbon",".ad-block-layer",".ad-block-layer-content",".C-ad-block-layer",".C-banner",".md-banner-placement",".rembi",".row.row-space-around.ad-container","div[class$=\"C-group-had-bg\"][style*=\"background-color:#EDF2F4\"]","div[class$=\"col-has-ad\"] div[id^=\"dwidget\"]","div[class$=\"col-has-ad\"] table","div[class*=\"col-has-ad\"]","div[id*=\"sliding\"][style*=\"width: 192px\"]",".flex.col-300.col:has(> .col-has-ad)",".adblock-notice","#right","div[itemtype=\"https://schema.org/WPAdBlock\"]","OBJECT[width=\"200\"]","OBJECT[width=\"468\"]",".panel.bg3 > div:nth-child(1) > div:nth-child(2) > center:nth-child(1)","#modal","div[class=\"banners\"]",".adblock-notif","a[href*=\"EPL_suur\"]",".is-sticky.advads-close.advads-background-click-close.advads-has-background.rklm-geenius-layer-onload.advads-duration-100.advads-effect-fadein.advads-effect.rklm-geenius-layer.rklm-geenius-layer-desktop","a[href*=\"delivery/ck.php\"]","#rek160","#rek728",".banner-single",".header-banner","A[href*=\"delivery/ck.php\"]","div.col-c-1-4","DIV.rek585","DIV.specials","DIV[class=\"tb\"]","div[id^=\"ox_\"]","script[src*=\"delivery/fl.js\"]","#taust",".sideboxads",".thisad","DIV[class$=\"top-reklaam\"]","DIV[class*=\"advert-box\"]",".cookieConsent",".top-space","#titleBannerWidget","a[href*=\"www/delivery/ck.php\"]","div[id*=\"idAdbill\"]","#ad_channelgroup","#ad_header_1000x120","#rightsideBanner","DIV.ad_container","DIV.overlay2","DIV[class*=\"kava_ad_\"]","IFRAME[id=\"frmleftcolads\"]","IFRAME[src^=\"http://www.facebook.com/plugins/login_button.php\"]","iframe[src^=\"https://www.cvkeskus.ee\"]","#bannertop","div.ads_right_column_adjust","#auto24","DIV[id*=\"dBannerLeft\"]","DIV[id*=\"dBannerTextInPostView\"]","DIV[id*=\"dBannerTower\"]","DIV[id=\"dBannerTop\"]","DIV[id^=\"dBannerPromo\"]","TD[class*=\"banner_fp_box\"]","TD[class*=\"banner_mp_box\"]","#header_banner","DIV.banner_container_1","#rt-drawer",".bannergroup",".header-banners",".widget_sp_image-image-link","a[class~=\"player\"][href*=\"reklaam_\"]","div[class~=\"img\"][style*=\"reklaam_\"]","div[class~=\"thumb\"][style*=\"reklaam_\"]","DIV.col2","#inx-main-roof","tr[id^=\"row\"]","aside[class*=\"widget_image\"]","aside[id^=\"black-studio-tinymce\"]","div[class*=\"main-banner\"]","div[class*=\"useful_banner_manager\"]","#banner_top_image","#FooterAds","DIV.aditem",".banner-slides","a[class=\"banner-link\"]","#fcadcontainer",".adocean-top","div.text-banners","div[id^=\"banner-adoceanohtuleht\"]","#ad","#dealsdeals","#top-smartad","#topBoxContainer","a[href*=\"plugins/adrotate\"]","embed[src*=\"plugins/adrotate\"]","#first-page-top-banner-holder","div[onclick*=\"promotions\"]","#reklaam","ins[class=\"bookingaff\"]","#checkout-container",".scrollbanners_block","DIV[style*=\"img/ads\"]","#gBgAd","#newsletter-form-popup","#sisuturundus",".ad-block-notification-overlay",".articles-recommendations",".coma-carousel--arco-vara",".coma-carousel--seb",".cookie-container",".dfp-ad",".digipakett-branding-root-container-piano",".group-branding",".group-topic-with-custom-header--elu24",".section-branding-container",".structured-content__group--commercial",".surprise-container",".tp-active.tp-backdrop",".tp-modal","DIV.reisiguruBlockContents",".structured-content__group:has(.list-article--commercial)","iframe[src*=\"cron/ostakvsoov\"]","section.gameFriik","section[id=\"customAdProjectBlock\"]",".flex--direction-column.flex.layout--right:has(> .flex--equal-width.aside--ad)","DIV.top_banner","DIV.ban_bottom",".dfp_ad","#bn-bot-wrap",".bn-idx","div[class*=\"wp_bannerize\"]","ul[class=\"oi-banner__list\"]","#fancybox-container-1","#adcontainer","#news_list_banner","#right_banner","div[class*=\"lb_overlay\"]","div[class=\"content-ad\"]","#ap24",".right","#ads_right_column","div.block_custom_wrapper","#banner.left","#ads",".site-player-blocker.site-player-blocker-adblock.site-player-blocker-active","a[onclick*=\"click_ad_\"]","#gkBannerTop","#gkInset > div:first-of-type","#gkMainbodyBottom > div:first-of-type","a[href*=\"flexbanner\"]","div[class^=\"flexbanner\"]","#ad_placeholder","#big","#mt-796b5c8a5dd38dee","#player-ads","iframe[src*=\"hotelliveeb.ee\"]",".article-share",".article-share__item"];
const selectorLists = /* 67 */ "0;1;2,3;4;5,6,7;8;10,11,9;11;12,13;14;15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30;29;-31,159;31;32,33;34;35;36;37;-174,-175,119,120,121,122,123,124,125,126,127,128,129,130,131,132,133,134,135,136,137,138,139,140,141,142,37,44;38;39,40;41,42,43,44,45,46,47,48,49,50,51;52,53,54;55,56;57,58;59,60,61;62,63,64,65,66,67,68,69,70;71;72;157,158,72;73,74,75,76,77,78,79,80;81,82;83,84,85,86;87,88,89;90;91,92;93,94,95,96;97,98,99;100;101;102,103;104,105;106,107,108;109;110,111;112,113;114,115;116;117;118;142,143;144;145,146;147;148;149;150,151,152,153,154;155;156;160,161;162;163,164,165,166,167;168,169;170;171;-173";
const selectorListRefs = /* 69 */ "1,32,11,23,60,0,27,36,38,41,51,55,58,8,10,18,48,6,9,24,26,28,44,4,5,16,21,35,43,46,56,61,63,13,29,7,42,47,59,12,65,20,37,40,45,19,57,30,31,49,50,53,54,3,14,66,64,2,17,22,15,33,34,62,39,34,25,52,7";
const hostnames = /* 69 */ ["1a.ee","kv.ee","epl.ee","ilm.ee","tv3.ee","1182.ee","kava.ee","mail.ee","nagi.ee","neti.ee","rate.ee","sirp.ee","soov.ee","biker.ee","delfi.ee","elu24.ee","piano.io","auto24.ee","cherry.ee","kalale.ee","kaup24.ee","keskus.ee","online.ee","annaabi.ee","aripaev.ee","ehuumor.ee","geenius.ee","maaleht.ee","okidoki.ee","optibet.ee","smsraha.ee","tv3play.ee","whatcar.ee","director.ee","kroonika.ee","motors24.ee","ohtuleht.ee","perekool.ee","telegram.ee","tv.delfi.ee","youtube.com","epl.delfi.ee","mallukas.com","nami-nami.ee","online.le.ee","postimees.ee","soccernet.ee","toidutare.ee","kuldnebors.ee","piletilevi.ee","playforia.com","rutracker.org","saartehaal.ee","aliexpress.com","e-autoline.com","hotelliveeb.ee","www.k-rauta.ee","accelerista.com","ekspressauto.ee","hinnavaatlus.ee","ehitusfoorum.com","lounaeestlane.ee","lpdigileht.epl.ee","vorumaateataja.ee","naistekas.delfi.ee","ajaleht.ekspress.ee","kanal2.postimees.ee","reporter.postimees.ee","mangukoobas.lahendus.ee"];
const hasEntities = false;

self.specificImports = self.specificImports || [];
self.specificImports.push({ selectors, selectorLists, selectorListRefs, hostnames, hasEntities });

/******************************************************************************/

})();

/******************************************************************************/
