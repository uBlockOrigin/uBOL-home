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

// deu-0

const toImport = [[9444205,"#Ad_Win2day"],[15441350,"#LxWerbeteaser"],[2833036,"#ParentDivForWerbPostbit"],[4080153,"#SSpotIMPopSlider"],[5160373,"#SlimSpot_imPop_Container"],[10027502,"#Werb_Postbit_Bottom"],[16021402,"#WerbungLinks"],[10782131,"#WerbungOben"],[5771988,"#WerbungObenRechts10_GesamtDIV"],[15747544,"#WerbungObenRechts8_GesamtDIV,#WerbungObenRechts9_GesamtDIV"],[10908420,"#WerbungRechts1,#WerbungRechts2"],[16021747,"#WerbungUnten"],[3412317,"#WerbungUntenLinks4_GesamtDIV,#WerbungUntenLinks7_GesamtDIV,#WerbungUntenLinks8_GesamtDIV,#WerbungUntenLinks9_GesamtDIV"],[10780661,"#Werbung_Sky"],[16022443,"#Werbung_Wide"],[11089827,"#ad-bereich1-08"],[13607432,"#ad-bereich1-superbanner"],[11089664,"#ad-bereich2-08"],[13618462,"#ad-bereich2-skyscrapper"],[10685895,"#ad-qm-sidebar-oben"],[13542372,"#ad-qm-sidebar-unten"],[8966040,"#ad-rechts-block"],[3929014,"#ad-rechts-sky"],[7847373,"#ad-sb-oben"],[9764299,"#ad_gross"],[7499546,"#ad_lang"],[7532056,"#ad_oben"],[8446634,"#ad_rechts"],[5985575,"#adbox_artikel"],[15651647,"#adcontentoben"],[4083548,"#adcontentoben1"],[8958833,"#adkontainer"],[8493958,"#adliste"],[10471045,"#adunten"],[185097,"#anzeigewerbungtext"],[5762859,"#ar_detail_werb103"],[290480,"#bannerwerbung"],[6576010,"#block-views-Topsponsoren-block_1"],[14426655,"#block-werbung"],[16185271,"#callya_freikarte_layer"],[16437484,"#cnt_bgwerbung"],[2303501,"#cont-werb"],[11679367,"#content_werbung"],[2850453,"#footerwerbung"],[15536449,"#forumformwerbung"],[15729332,"#freikarte_layer"],[3235221,"#gonamicerror"],[1287704,"#google_adsense_werbung"],[15315858,"#gwerbung"],[14554662,"#hauptnaviwerbelinks"],[15204725,"#headerWerbung"],[9338423,"#header_werbung"],[16287061,"#headerwerbung"],[4215410,"#inlinewerbung"],[16242027,"#kalaydo_ads"],[6705817,"#kaufDA"],[2788655,"#kaufDA-widget-container"],[16606160,"#kopf-werbung"],[15395703,"#layerADLINKWerbung4"],[1239085,"#nativendo-articlemiddle"],[9402564,"#nativendo-articletop"],[15377223,"#nativendo-artikel"],[15298565,"#nativendo-home"],[9182998,"#nativendo-home-1,#nativendo-home-2"],[13765241,"#nativendo-homepage"],[15377972,"#nativendo-hometop"],[13764887,"#nativendo-infeed-1,#nativendo-infeed-2,#nativendo-infeed-3,#nativendo-infeed-4,#nativendo-infeed-5,#nativendo-infeed-6"],[15377556,"#nativendo-infeed1,#nativendo-infeed2"],[13764489,"#nativendo-marginal"],[6024464,"#nativendo-nachrichten-unterhalb"],[4049299,"#nativendo-nativendo-aktie"],[2781895,"#nativendo-nativendo-homepage-mobil"],[9393035,"#nativendo-oms-infeed"],[12488856,"#o2freikarte"],[3574735,"#oms_gpt_billboard"],[3544386,"#oms_gpt_outofpage"],[3561662,"#oms_gpt_rectangle"],[148236,"#oms_gpt_rectangle_halfpage"],[16251245,"#oms_gpt_skyscraper"],[3566351,"#oms_gpt_superbanner"],[8774810,"#p-links-werbung"],[1980482,"#p-rechts-werbung"],[2180423,"#qm_content_ad_anzeige"],[14958077,"#reklame"],[305370,"#reklame-leaderboard-unten"],[5557636,"#reklame-rechts-mitte"],[10963387,"#reklame-rechts-oben"],[5557389,"#reklame-rechts-unten"],[1067009,"#reklame-rectangle"],[10372948,"#reklame_layer"],[13857514,"#skywerbung"],[7355523,"#slotright-werbung"],[6386342,"#sp0ns0ren"],[9388586,"#sspot_impopad_wrapper"],[2446880,"#startwerbung"],[7468009,"#t_werbung"],[6486520,"#text-ads-mitte"],[3817171,"#textwerbung"],[396234,"#tmobilefreikarte"],[10829956,"#topwerbung"],[12025255,"#unisterAd_1"],[12025252,"#unisterAd_2"],[3453169,"#videopage-werbung"],[16023238,"#werb10"],[16023239,"#werb11"],[16023236,"#werb12"],[16023237,"#werb13"],[11155283,"#werb7"],[11155292,"#werb8"],[11155293,"#werb9"],[1957387,"#werbLayer1,#werbLayer2,#werbLayer3"],[1978832,"#werb_ps103"],[8878344,"#werbeForm"],[2038186,"#werbeFormRectangle"],[11177506,"#werbeFormTop"],[12393293,"#werbeadd"],[11176291,"#werbeanzeige"],[14457237,"#werbebanner"],[1931398,"#werbeblock"],[14454197,"#werbeblock2"],[13158929,"#werbeblock_rechts"],[12400505,"#werbebox"],[11182702,"#werbeflaeche"],[2070081,"#werbeflaeche-3"],[16704148,"#werbeflaeche-billboard-big"],[12585500,"#werbeflaeche-mpu-big"],[14458067,"#werbekasten"],[14462267,"#werbeleiste"],[13235575,"#werbeslot-artikel"],[13235043,"#werbeslot-sidebar"],[11206166,"#werbetrenner"],[4693402,"#werbung"],[4788019,"#werbung-banner"],[11888884,"#werbung-banner-container"],[1949304,"#werbung-fb"],[11760722,"#werbung-left"],[7032930,"#werbung-map-top"],[1704427,"#werbung-rectangle1,#werbung-rectangle2"],[10992828,"#werbung-seitenleiste-container"],[1710779,"#werbung-skyscraper"],[12962852,"#werbung1"],[14757771,"#werbung125_links"],[12794084,"#werbung125_rechts"],[12962855,"#werbung2"],[12962854,"#werbung3"],[11762270,"#werbung792_2"],[12962887,"#werbungR"],[3252103,"#werbungRechts,#werbungrechts"],[1716319,"#werbungSuperbanner"],[4771325,"#werbungWrapper"],[15043000,"#werbung_cad"],[4627348,"#werbung_contentad_screen"],[4792086,"#werbung_footer"],[1837349,"#werbung_leaderboard_screen"],[3242952,"#werbung_links"],[3243013,"#werbung_mitte"],[11760882,"#werbung_oben"],[4770719,"#werbung_rechts"],[3227768,"#werbung_right"],[6017039,"#werbung_skyscraper_bottom"],[9968560,"#werbung_skyscraper_top"],[7481561,"#werbung_superbanner"],[15042523,"#werbung_top"],[5835795,"#werbung_wideskyscraper_screen"],[15042941,"#werbunglink"],[11760570,"#werbunglinks"],[4797668,"#werbungrechts1"],[1702588,"#werbungrechtsfloat"],[4787376,"#werbungsbox300"],[1949301,"#werbungsky"],[3242499,"#werbungslider"],[11760659,"#werbungunten"],[14951290,"#wkr_werbung"],[4540716,".AdRechtsLokal"],[563175,".Artikel_Ads_News"],[10909148,".GridWerbung"],[11588725,".KalaydoBoxLogo"],[9585300,".KalaydoRessortBox"],[14790828,".KomischeWerbeBox"],[16584691,".RessortWerbungHeader"],[5833280,".Werbelabel"],[16210017,".Werbeteaser"],[8504119,".Werbung"],[14874965,".WerbungAdpepper"],[11165210,".WerbungDetailRectangle"],[7233594,".WerbungLinksRechts"],[7627304,".WerbungMitte"],[2186567,"._werbung"],[16593213,".ad_mitte"],[7245767,".ad_platzhalter"],[7201344,".adguru-content-html"],[16445952,".ads-anzeige"],[7540703,".ads-artikel-contentAd-medium"],[9948078,".ads-artikel-contentAd-top"],[11374528,".ads_bueroklammer"],[547475,".ads_rechts"],[8652612,".adsense-ArtikelOben"],[7580485,".adzeiger"],[10531105,".anzeigenwerbung"],[13626004,".article-werb"],[7313365,".artikelinlinead"],[3099762,".b-werbung"],[6895233,".babbelMultilangAdBannerHorizontal"],[15662338,".babbelMultilangAdRectangle"],[6623932,".banner-werbung-rechts"],[16000021,".banner-werbung-top"],[14754909,".bannerAnzeige"],[9229265,".bannergroup_werbung"],[11921230,".banneritemwerbung_head_1,.banneritemwerbung_head_2,.banneritemwerbung_head_3,.banneritemwerbung_head_4"],[1776773,".bdeFotoGalAd"],[413173,".bdeFotoGalAdText"],[3548261,".big-werb"],[5008028,".block-wozwerbung"],[11835535,".block_rs4_werbung"],[8336409,".bottom-werbung-box"],[11289530,".box_werbung_detailseite"],[8667626,".boxstartwerbung"],[12672958,".boxwerb"],[16269399,".boxwerbung"],[2154060,".content_body_right_werbung"],[11560489,".content_header_werbung"],[4334007,".content_right_side_werbewrapper"],[169408,".contentwerbung4"],[10542814,".ecom_werbung"],[15523660,".firstload"],[2910554,".fullbanner_werbung"],[7054788,".funkedigital-ad"],[15452114,".fusszeile_ads"],[13029525,".gutZuWissenAd"],[15250522,".inlinewerbungtitel"],[7501578,".insidewerbung"],[13484911,".keyword_werbung"],[1779104,".lokalwerbung"],[9346732,".mob-werbung-oben"],[2634675,".mob-werbung-unten"],[11101863,".news-item-werbung"],[15715819,".newswerbung"],[16023594,".nfy-sebo-ad"],[16030817,".nfy-slim-ad"],[9600641,".orbitsoft-ad"],[643457,".pane-klambt-ads-klambt-adserver-medrectangle"],[203519,".popup_werbung_oben_tom"],[7017700,".popup_werbung_rechts_tom"],[14416100,".ps-trackingposition_Werbungskasten"],[5199011,".rahmen_ad"],[8567280,".reklame"],[2775314,".right-content-werbung"],[11076322,".schnaeppchenScrollAd"],[14657,".seitenleiste_werbung"],[10355482,".shift-widget > .cm-article"],[4588625,".sidebar-werbung"],[50702,".sidebarwerbung"],[15897129,".smartbrokerAds"],[5278664,".spielen_werbung_2"],[6357521,".sponsorinaktiv"],[4321558,".sponsorlinkgruen"],[15544346,".superwerbung"],[9039670,".tab_artikelwerbung"],[628886,".teaser_adliste"],[630182,".teaser_werbung"],[12872376,".text_werbung"],[3810527,".textad_hauptlink"],[1657400,".textlinkwerbung"],[7313364,".tipps-content-ad"],[14526921,".topwerbung"],[14172725,".tx-scandesk-werbung"],[2625535,".undertitlewerbung"],[4358964,".userfunc-ad"],[4860182,".videowerbung"],[9062317,".werb_container"],[8887626,".werb_textlink"],[5629979,".werbeadd_ueber"],[3697656,".werbebanner"],[5266889,".werbebanner-oben"],[11248075,".werbeblock"],[926490,".werbebox2"],[5995526,".werbeboxBanner"],[1192835,".werbeflaeche"],[1196565,".werbehinweis"],[7847873,".werbekennzeichnerrectangle"],[1187816,".werbemainneu"],[926397,".werbenbox"],[11247926,".werbepause"],[935731,".werblinks"],[11266212,".werbrechts"],[14615127,".werbung"],[943617,".werbung-1"],[943618,".werbung-2"],[308790,".werbung-250x250"],[943619,".werbung-3"],[7947101,".werbung-bigbox"],[15412767,".werbung-bigsize"],[4265960,".werbung-box,.werbung_box"],[12945222,".werbung-container"],[15388778,".werbung-content"],[12945350,".werbung-contentad"],[1398711,".werbung-fullbanner"],[1385635,".werbung-halfbanner"],[7954556,".werbung-inline"],[8353942,".werbung-label"],[7949062,".werbung-leiste"],[11323962,".werbung-rec-below-list"],[7929810,".werbung-rechts"],[12947525,".werbung-rectangle"],[1379158,".werbung-skyscraper"],[14643653,".werbung-skyscraper2"],[8327515,".werbung-unten"],[8679881,".werbung1"],[8679882,".werbung2"],[1331964,".werbung280x70_wrap"],[8679883,".werbung3"],[11265315,".werbung300,.werbung301"],[7863023,".werbung300x600"],[7853293,".werbung970x250"],[7951515,".werbungAnzeige"],[5133950,".werbungContainer"],[16051114,".werbungSkygrapperRight"],[11739226,".werbungSkygrapperTop"],[7946079,".werbungTabelle"],[274967,".werbung_300x250"],[4267613,".werbung_728"],[7947326,".werbung_banner"],[15400903,".werbung_bereich"],[1397044,".werbung_fuer_300er"],[943704,".werbung_h"],[8357185,".werbung_index"],[8353797,".werbung_links"],[14798481,".werbung_sidebar"],[1759673,".werbung_text"],[8352141,".werbungamazon"],[15567060,".werbunganzeigen"],[4265441,".werbungarea"],[15445426,".werbungimthread"],[1388362,".werbungrechtstitel"],[10769266,".widget-werbung"]];

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
