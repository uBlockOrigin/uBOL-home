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

/******************************************************************************/

// Important!
// Isolate from global scope
(function uBOL_cssGenericImport() {

/******************************************************************************/

// ita-0

const toImport = [[3627710,"#adk_article-middle"],[15235377,"#adk_article-top"],[9706263,"#adk_interstitial"],[5220940,"#adk_spalla-bottom"],[5220873,"#adk_spalla-middle"],[1387323,"#adk_spalla-top"],[11824089,"#eadv-billboard"],[6820976,"#video-evo-player.player_evolution"],[8268928,"#yobee-top-page"],[9036919,".AlterVista_Banner"],[7668915,".AlterVista_GoogleAdsense"],[7857121,".adk-slot"],[14529524,".ads--primo-piano"],[12947769,".adv-gptslot"],[15628580,".banner-adv"],[6649323,".box_adv_cliccaofferta"],[11128129,".footer-adv"],[11437384,".partial-static-adv"],[11437322,".partial-sticky-adv"],[3280621,".pubblicita"],[4103235,".pubblicitacentrata"],[9059949,".sb-box-pubbliredazionale"],[7419270,".slyvi-ads-inserter-ad-unit"],[7975660,".sponsorizzati"],[11079782,".wrapper-adv"],[8886546,".yb-floorad"],[15251005,".yb-sticky"],[13356046,".yobee-adv"],[6338664,"#ADV_filter_1,#ADV_filter_2"],[12023429,"#ADV_leaderboard_atf"],[4539590,"#ADVrettangolo"],[14002555,"#ADVrettangolopiede"],[11765824,"#ADVstriscia"],[11134270,"#HALFPAGE2_advadagio,#HALFPAGE3_advadagio"],[7072099,"#HALFPAGE_BOTTOM_advadagio"],[11747135,"#HALFPAGE_advadagio"],[5372262,"#MID_RECTANGLE1_advadagio,#MID_RECTANGLE2_advadagio"],[15242440,"#MediamondAd_bp"],[10320393,"#MediamondAd_bp_1"],[10319897,"#MediamondAd_rn_2,#MediamondAd_rn_u"],[10319928,"#MediamondAd_sn_u"],[8321147,"#Sponsor728x90Top"],[2676026,"#UNITIS_ads_300250"],[8572337,"#WIDELEADERBOARD2_advadagio"],[11462516,"#WIDELEADERBOARD_BOTTOM_advadagio"],[2349630,"#ad_testa_foto"],[13339672,"#adasta_box_ros_2"],[2473586,"#adbanner-laterale"],[2533745,"#adbanner-stampa"],[8492882,"#adk_masthead"],[9038765,"#ads-interno-1"],[9038766,"#ads-interno-2"],[2756859,"#ads-laterale"],[9474865,"#adsense-destra"],[4174004,"#adsense-notizia"],[2986094,"#adsense_lato"],[10008045,"#adv-Piede"],[2885,"#adv-Piede-sticky"],[10063926,"#adv-box-1"],[15714937,"#adv-broker-overlayer"],[7728222,"#adv-broker-overlayer-background"],[5895613,"#adv-iframe-sx-home"],[11102336,"#adv-masthead-0"],[15842119,"#adv-pushdown-1"],[6014201,"#adv-skin-colonnadx,#adv-skin-colonnasx"],[3607093,"#adv00"],[3607095,"#adv02"],[7345901,"#advAutopromo1"],[7345902,"#advAutopromo2"],[6268854,"#advBB-left"],[5970364,"#advBB-right"],[10031323,"#advBB-top"],[8409335,"#advSwiper_article"],[4404121,"#adv_ManchetteDx,#adv_ManchetteSx"],[7599341,"#adv_Skin_left"],[1545758,"#adv_Skin_right"],[243634,"#adv_Skin_top"],[6233399,"#adv_adagio"],[10065500,"#adv_click"],[6763282,"#adv_in_post"],[14580040,"#adv_mob"],[15333286,"#adv_nativ_sopracartina"],[9092884,"#adv_outbrain_AR_1_sottocartina"],[3386343,"#adv_sotto_navigatore"],[4885274,"#adv_sponsor_canale_tematico"],[16382738,"#advcolonnadx"],[16382725,"#advcolonnasx"],[10050663,"#advdivbp1"],[70965,"#advertisingStriscia"],[10060090,"#advsfondo"],[336139,"#altervista_banner-3"],[8373867,"#annunciGoogle"],[563201,"#annunci_google"],[5165751,"#annuncio-virgilio"],[10535565,"#blocco_servizi_sponsor1"],[2878478,"#body-adv-link"],[12652162,"#box_single_adv_sotto"],[16338929,"#box_single_adv_sotto_1"],[16338930,"#box_single_adv_sotto_2"],[12773830,"#bt_adv_div"],[7738275,"#cardAdv"],[12419992,"#contPubb"],[6821983,"#corpo_video_sponsor"],[5895663,"#deaAdvTop"],[5967498,"#divPubblicita"],[7962387,"#evolutionadv"],[15789872,"#fullAdv-dx"],[15789863,"#fullAdv-sx"],[1127668,"#fwnetblocco"],[7848221,"#fwnetblocco160x600"],[7848286,"#fwnetblocco300x300"],[6909252,"#fwnetblocco_v"],[8516723,"#hp_sez_advmkt_01"],[3738935,"#kauppa_box"],[5626364,"#leo-adv"],[6927008,"#lg-spalla-ads01-down"],[6380913,"#lg-spalla-ads01-up"],[7525905,"#lg-spalla-ads03"],[13881491,"#libero_header_adv"],[49913,"#main_360_adv"],[2344325,"#mmAdDivSkDx,#mmAdDivSkSx"],[2344351,"#mmAdDivSkLb"],[6452928,"#ppn_ad_div"],[7070936,"#pubbli-alto"],[6593351,"#pubbli_top"],[6592736,"#pubblicita"],[5059273,"#pubblicita-libero-top"],[4773944,"#pubblicita-menu"],[2430836,"#pubblicita-sotto-immagine"],[16387590,"#pubblicita_blog_post_testa"],[15311250,"#quattrownet_468x60"],[16717068,"#rcsad_BottomLeft_1"],[14356552,"#rcsad_Frame1,#rcsad_Frame2"],[12145886,"#rcsad_TopLeft"],[3126820,"#ripBoxAdvCentroSX2"],[4246815,"#skinadvdx,#skinadvsx"],[2004906,"#sp-adv-header"],[5071162,"#syTagContainer"],[11419580,"#tccAdPlayer"],[10112127,"#top3-pubbli"],[6095702,".ADV300_250_600_Content"],[12080468,".ADVBig_Content"],[12308884,".ADVFLEX_250_Content"],[1532045,".Banner_VideoAd_Interno"],[5443085,".Pubblicita"],[4335690,".ab-box-adv-cn"],[14669722,".actio-adlabel"],[4065454,".ad-fisso"],[16490803,".ad-orizzontale"],[8804688,".ad-verticale"],[8628664,".adSenseLaterale"],[3440656,".ad_pedice"],[1531485,".adagiowritebanner_dmtag"],[374633,".adivi-infeed"],[12400239,".ads-dx"],[12399448,".ads-sx"],[12278045,".ads_dx"],[15480084,".ads_pagineprof"],[15955978,".ads_singolo"],[2188233,".ads_topdx,.ads_topsx"],[2904871,".adsbyawcloud"],[523857,".adv--lg"],[523512,".adv--sq"],[14710930,".adv-100x100"],[6845327,".adv-articolo,.adv_articolo"],[4503856,".adv-banner-wrap"],[447950,".adv-cnt"],[8624671,".adv-footer-kauppa"],[2109785,".adv-h-100"],[15480023,".adv-iframe-sx"],[4267988,".adv-inside-text"],[8231387,".adv-loc-container"],[407173,".adv-margin,.adv_margin"],[6998626,".adv-masthead"],[6270058,".adv-promobox"],[371563,".adv-sfondo"],[5995591,".adv-skin"],[12293952,".adv-skin-weben"],[2944340,".adv-son-300x650-page"],[4455145,".adv-sponsor__content"],[16107099,".adv-strip-container"],[12378805,".adv-testata"],[14409141,".adv-width-box"],[426378,".adv-wpz"],[12218570,".adv100"],[2016652,".adv300eni"],[8446683,".adv300x100vd"],[12195964,".advArt"],[12197250,".advBot"],[13220648,".advBoxDxBis"],[13243044,".advCollapse"],[2117369,".advFooter"],[9156170,".advHm-cont-Ape"],[6929941,".advPostLibri"],[13158535,".advTestuale"],[10000529,".adv_120x600_categoria,.adv_160x600_categoria"],[13504867,".adv_468x60_categoria"],[2719550,".adv_block__text"],[5150572,".adv_bug_float"],[13159102,".adv_esterno"],[14439885,".adv_inner_notizia"],[7589845,".adv_lateral_dx"],[7589826,".adv_lateral_sx"],[16519109,".adv_news"],[16505700,".adv_oriz"],[603199,".adv_vert"],[2092781,".adv_video"],[2117865,".advborder"],[12166503,".advdsk"],[2781458,".advhead"],[14552634,".advnext_correlati"],[11980545,".advricaricamediamond"],[326736,".alp-advert"],[825959,".archive-post__adv"],[341289,".aside-adv-scroll"],[8961913,".av-banner-728X90"],[1582345,".avadvslot"],[10372830,".bannerPubblicita"],[10230382,".bannerPubblicitaOrizz"],[1229149,".banner_300x250_read"],[4821779,".banner_pubblicita"],[16054126,".barraSipra"],[15004738,".bck-adv-sponsor"],[14811039,".bk-adv"],[8568353,".blocco_servizi_sponsor"],[16170939,".box-pubb"],[3812467,".box-pubblicita"],[7797124,".box-pubblicita-multimedia"],[12794515,".box-pubbliredazionale"],[978446,".boxADV"],[979470,".boxAdv"],[12851044,".box_adv_annunci"],[13287446,".box_adv_speciali_hp"],[8953615,".boxpubblicita"],[10170645,".boxpubblicitasx"],[2371490,".bt_adv1"],[8321543,".bt_sub_adv1"],[1503498,".c-iol-ad"],[9141482,".cellulare-adv"],[14514661,".center-adv"],[10609755,".center-adv-news"],[4262149,".cmt_bgadv"],[2546053,".contenitore_ad_top"],[4894724,".content-adv-manager"],[16367704,".contenuto-sponsorizzato"],[16204798,".cp_adv-box"],[6773466,".cp_adv300x250"],[10152433,".dads-lk"],[12455337,".dm20-adv-slot"],[15336927,".edSponsor"],[15105564,".ed_Related_Record_Div_Sponsor"],[656269,".ed_Related_Sponsor"],[1851229,".ed_Related_Sponsor_Top_Container"],[14100495,".ed_Sponsor"],[11528467,".edinet_adv_container"],[12438920,".edinews_widget_link_sponsorizzati"],[13770847,".epeex_Sas"],[12469649,".evolve-adv"],[12502589,".extra--adv"],[15523472,".first_adv"],[6578621,".flexi-pubblicita"],[9489260,".foc-adv-slot"],[5539197,".foglia-middle-adv"],[1984801,".google-adx-corpo"],[2192054,".google-adx-spalla"],[5358479,".googleAnnunci"],[7482401,".google_adx_corpo"],[14948832,".gptslot--adv"],[12332632,".gtv-adv-slot"],[3206489,".header-adv-wr"],[15721600,".header-mobile-mega-adv"],[10410927,".home-rubriche-adv"],[2839023,".inews_adv_top"],[10023813,".inread_adv"],[11515970,".intro-adv"],[167699,".jadv_leoadv_pd"],[5687316,".lancio_adv"],[12708313,".leaderboard-adv"],[15749145,".lg-titolo-ads"],[120832,".lg-titolo-ads-dx"],[120855,".lg-titolo-ads-sx"],[12336470,".linksponsorizzati"],[11865414,".listatonativeadv"],[15743306,".live-adv-square"],[2468723,".live-adv-top"],[12765069,".live-article-adv-container"],[12114714,".mg-adv-controller"],[2831068,".modPubblicita"],[2159371,".netd_300x600adv"],[8140076,".newtekadv"],[10599699,".nk-adv"],[14462459,".nk-adv-in-article-1"],[14462456,".nk-adv-in-article-2"],[4486742,".nw_adv_full"],[5548915,".pat-adv-300x250"],[14418764,".pat-adv-box"],[6433402,".pat-adv-masthead"],[15543627,".post_pubblicita"],[13199285,".promo_sp"],[12053123,".pub_text"],[11962318,".pubblicit"],[5598187,".pubblicita-banner"],[8048715,".pubblicita-box"],[12153587,".pubblicitaGoogle"],[12140200,".pubblicitaSlider"],[5596420,".pubblicita_728x90"],[14298601,".pubblicita_col1"],[4103210,".pubblicita_sottile"],[5598079,".pubblicitapremium"],[6132573,".pubbliredazionale"],[2827551,".pubblitalocaleaddADV"],[10094865,".pubblitalocaleaddpiccola"],[13655710,".publi_ad"],[14173968,".qtr-bacheca-adv"],[15067236,".rcsad_BottomLeft_x_content"],[2558556,".related-adv"],[507024,".sal-adv-adsense"],[14414678,".sal-adv-slot"],[10719054,".sdbadv"],[13332213,".sidebar-adv"],[2149596,".sidebar-item-adv"],[5105950,".sidebar__adv"],[16702780,".single-adv"],[5395655,".sito-adv-sopra-main"],[2334620,".slot-adv"],[2352601,".sponsor160x600Dx"],[2420205,".sponsor300x250Sx"],[4427548,".tabella2Pubblicita,.tabella3Pubblicita"],[3673456,".tabellaPubblicita"],[5627586,".tbm-adv-inside_desktop"],[12110778,".tbm-adv-inside_mobile"],[12885641,".tbm-adv-outside_desktop"],[9758771,".tbm-adv-outside_mobile"],[15270138,".tcc-banner"],[6968653,".tccbanner"],[420464,".textual-adv-text"],[14999934,".tn_adv"],[13973035,".topadv_left"],[1974524,".topadv_right"],[7179489,".trama_ads"],[16513822,".tw-adv-native"],[1000045,".tw-adv-slot"],[6853289,".view-pubblicita"],[14683661,".widget_adv_multi"],[1104811,".widget_eepex"],[504761,".widget_n1ad"],[9779504,".wl_WidgetRel_Sponsor"],[16129617,".wl_WidgetRel_Sponsor1"],[7712028,".yobee-lazyadv"]];

const genericSelectorMap = self.genericSelectorMap || new Map();

if ( genericSelectorMap.size === 0 ) {
    self.genericSelectorMap = new Map(toImport);
    return;
}

for ( const toImportEntry of toImport ) {
    const existing = genericSelectorMap.get(toImportEntry[0]);
    genericSelectorMap.set(
        toImportEntry[0],
        existing === undefined
            ? toImportEntry[1]
            : `${existing},${toImportEntry[1]}`
    );
}

self.genericSelectorMap = genericSelectorMap;

/******************************************************************************/

})();

/******************************************************************************/
