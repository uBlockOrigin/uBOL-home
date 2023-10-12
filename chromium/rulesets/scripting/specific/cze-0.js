/*******************************************************************************

    uBlock Origin - a browser extension to block requests.
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

/* jshint esversion:11 */

'use strict';

// ruleset: cze-0

/******************************************************************************/

// Important!
// Isolate from global scope
(function uBOL_cssSpecificImports() {

/******************************************************************************/

const argsList = ["[class*=\"sda\"]:not(.post-content)","div.banner_position","#banner-left-pane,\n#banner-top-four,\n#sportObchodBanner,\ndiv.bannerHolderZapasRight","#branding_anchor_left,\n#branding_anchor_right,\n.adtea_inpage,\n.adtea_leaderboard",".amalker","#pagefoot","#tblHorniLista",".native-ads",".wpa.top",".banner-header","#biglink","#content-right > div[style]:first-of-type","#header-banner","#leva-reklama","#content-lead,\ndiv.sky-wrapper","#header-reklama,\n.side-bann-l,\n.side-bann-r",".rklh",".banner2,\n.wrap + div:not(#footer)",".ads",".square_banner","#skyscraper","#sideScrapperLayout,\ndiv[id*=\"Banner\"]","#js-branding,\ndiv[id^=\"czech-\"]","#pr-prace-blok-view,\ndiv.block-jobs-link,\ndiv[class*=\"openx-async\"]","[id^=\"hyperbox\"]",".box-offer",".cornerbox,\n.heurekaIframeHeader","div#td-outer-wrap > div.td-container",".ad-obal",".box-banner",".widget-group-2 li:has(div.ad-pmg)","div[id^=\"ad_\"]","div[class^=\"reklama\"]","div#highlitesAds",".layoutTop","#g-top-bannery","#topSite,\n.gallery-advertisement",".intent-exit-box.l-row,\n.js-popup-quest.intent-exit-popup--quest.intent-exit-popup,\ndiv[class*=\"adcontainer\"]",".adsense,\n.leaderboard,\n.seriesadvert,\n.skyscraper",".banner","#r-leaderboardhp","div[id^=\"cross\"]","div:has(> a[class^=\"glightbox\"])",".rf-branding,\ndiv[class^=\"cross\"]","#fancybox-overlay,\n#h_part_right","#t-content",".topbanner","div[id^=\"ad-leaderboard\"]",".advert","#invelt","div.klik--leaderboard","#blackfooter",".topbanners","#box.mb,\n.arr-red","#ahead","#stOverlay,\n.promobox","div._banner","div.ogm-branding > div > div","div.bottom-partners","div.container.partners",".filtr.category-partner,\ndiv[class$=\"advert\"],\ndiv[class*=\"__banner\"]","[class*=\"sda-\"]",".TopFullBanner","div[id^=\"hyper\"]","[class*=\"r-main\"]","div.advert-leader-board-container",".mone_box",".reklama-background","#social",".bannLead","[class*=\"ad_\"]",".rleft,\n.rright,\n.tree","div[id^=\"banner\"]",".ad",".v-card--link:has(.ad),\n.v-card.mb-6","[class*=\"partnеr\"],\na[rel=\"sponsored\"]",".top_background","#z990x200,\n#zr300x600,\n[id^=\"adv_\"],\na[href*=\"utm_campaign=kurzy_\"],\niframe[src^=\"https://img.kurzy.cz/og\"]",".square","#box-over-content-a",".design-advert-placeholder,\n.design-box--jobs,\ndiv.article--content:has(div.design-advert)","#box-3,\n#rbackground-link,\ndiv[id*=\"reklama\"]",".banns-group","#block-nodesinblock-0",".header_banner","div[id^=\"mp_banner_\"]",".scroll_banner",".banner, .left-side-banner, .right-side-banner,\na[trgurl], a[href*=\"relocate.php\"],\ndiv:has(> a[href*=\"?act=detail&f=8\"])",".komerce",".bcc:has(.banners)",".npab","[class*=\"advertisement\"]","pp",".right","div[style^=\"float:left;width:468px;\"] + img[src^=\"data:image/gif;base64,\"]",".advtick","a[class^=\"levakolejroku\"],\na[class^=\"pravakolejroku\"]","#leaderBox,\n.sticky-wrapper","#fixedMenu,\n#rek3,\n#rodkaz",".body_message--ad",".roumingLista","#pvMid","a[href^=\"https://prehrajto.cz/?cc=prlbmso2\"]",".mid-lead-hp",".gadget--zbozi,\ndiv[data-dot*=\"gadgetCommercial\"]","div[data-e-b-n*=\"advert\"],\ndiv[data-e-b-n*=\"sklik\"]","div[class^=\"branding-ad\"]","div.ad-exclusive,\ndiv.dragging-enabled:has(div.gadget--reklama),\ndiv.ogm-sticky-repeater","a[href*=\"track.smartmania.cz\"]","#P_reklama_horni,\n.reklamni_sdeleni,\n.rs_reklama,\n[style=\"vertical-align:middle; text-align: left; width: 139px;\"]",".mabo.faa,\n[style=\"width:960px;margin:0 auto;text-align:left\"]","a[data-dot=\"c_pozadi\"],\na[data-dot=\"hp_pozadi\"],\ndiv.ad","#ad",".bbtitle","#vyjizdeciBoxikDiv",".sidebar-banner,\n.skyscrapper-right",".branding-link",".banner-brand",".center,\nobject[id*=\"bfad\"]","#adLocation-21,\n#popwrapper,\n#t-overlay,\n.row0,\na[href=\"http://acu.cz\"],\nh3","[class^=\"ws-banner-\"]",".SkyLeft.Banner","div.main-top,\ndiv.site-reklama",".bannero2","#branding_conts,\n#floatad,\n#headertopbanner,\n.headerbanner","#aa1","div[style*=\"position:absolute;\"]","div[id][style=\"position: absolute; top: 0; left: 0; width: 100%; height: 380px; text-align: center;\"]","div:has(> section[data-testid=\"teaserCarousel\"]),\nul > div:has(> a[data-testid=\"imageTile\"]),\nul > div:has(> a[data-testid^=\"outfit\"])",".desktop-wrapper:has([id^=\"div-gpt-ad\"])",".c_banner300x300","div[class^=\"banner_box\"]","a[href=\"http://www.Onlinefilmy.eu\"],\na[href=\"http://www.movieportal.eu\"],\ndiv[style=\"font-size:20px; font-family:Arial Black, Arial; color:#FF0000; font-weight:bold\"]","div[id^=\"ad\"]","div[class*=\"pohodoWidget\"]","a.predpredaj-black",".h2.grad2.kupons_games",".header_info_text",".s-branding,\n[id^=\"banner-\"],\ndiv[style*=\"Roboto\"][style*=\"fixed\"],\nstripemark",".container--break-branding,\n.container--break:has(.ad--align),\n.container--ticketportal,\n.item--socials,\n.item__ad-center,\ndiv[class^=\"position_\"]:has(.ad--align)","[id^=\"back\"][onclick]",".newsletter,\nheader > div","#footer,\n#headerSlideContent1,\n#ocko","[id^=\"mk-branding-\"]","#brnd","a[href*=\"trackBannerAd\"]","iframe[data-src^=\"/default-ad\"]",".artemis-ad-position","#top-offers-slider,\n.addbox.avizo,\n.box_advertisment.addbox.recycle,\n.nastip,\n.takeoverKlik",".gate-advert-wrap",".dragobj > div:nth-of-type(2),\n.stn.stns > a[target=\"_blank\"],\n.stn.stnu > a[target=\"_blank\"]",".content-item:has(.header a[href^=\"/reklama/\"])","div[class=\"advertisement-list-component\"],\ndiv[class^=\"item h2\"]",".widget:has(img[src*=\"/ads/\"]),\ndiv[id^=\"advert_\"]","a[href^=\"https://boxu.sk\"]",".post.bg5",".overlay,\na[class^=\"tv-\"]",".banner-under,\n.product-ad-wrapper,\n.sqaure-mobile-ad"];

const hostnamesMap = new Map([["grunex.com",0],["kamsdetmi.com",1],["onlajny.com",2],["programujte.com",3],["tipcars.com",4],["titulky.com",5],["war4all.com",6],["zmeskanyhovor.com",7],["365tipu.cz",8],["appliste.cz",9],["serialzone.cz",[9,103]],["autobazar.cz",10],["autoforum.cz",[11,12]],["wmmania.cz",12],["autohit.cz",13],["autorevue.cz",14],["e15.cz",[14,36]],["maminka.cz",14],["mobilmania.cz",14],["zive.cz",14],["autosport.cz",15],["autoweb.cz",16],["autozine.cz",17],["isport.blesk.cz",18],["evropa2.cz",18],["filmporno.cz",[18,52]],["businessworld.cz",[19,20]],["computerworld.cz",[19,20,28]],["pcworld.cz",20],["busportal.cz",21],["cc.cz",22],["cdr.cz",23],["diit.cz",23],["ceskenoviny.cz",[24,25]],["nasepenize.cz",25],["cesky-jazyk.cz",26],["cnews.cz",27],["csfd.cz",[29,30]],["csfd.sk",29],["databazeknih.cz",31],["denik.cz",32],["dotekomanie.cz",33],["drbna.cz",34],["e-mostecko.cz",35],["info.cz",36],["echo24.cz",37],["edna.cz",[38,39]],["in-pocasi.cz",39],["ireceptar.cz",39],["webtrh.cz",39],["centrum.sk",[39,136]],["cp.hnonline.sk",[39,48]],["emimino.cz",40],["enigmaplus.cz",[41,42]],["epochaplus.cz",[42,43]],["esemes.cz",[44,45]],["warforum.cz",[45,119]],["estav.cz",46],["euro.cz",47],["eurogamer.cz",48],["pravopisne.cz",48],["pravopisne.sk",48],["ewrc.cz",49],["extra.cz",50],["fdb.cz",51],["finance.cz",[53,54]],["motoforum.cz",54],["firstclass.cz",55],["fotoaparat.cz",56],["garaz.cz",57],["prozeny.cz",57],["seznamzpravy.cz",57],["hcdukla.cz",58],["hcmotor.cz",59],["heureka.cz",60],["heureka.sk",60],["hrej.cz",61],["pctuning.cz",61],["tryhard.cz",61],["zing.cz",61],["hybrid.cz",62],["idnes.cz",[63,64]],["lidovky.cz",[63,64]],["modnipeklo.cz",64],["idos.idnes.cz",65],["cnn.iprima.cz",66],["itnetwork.cz",67],["jaknaletenky.cz",68],["kaloricketabulky.cz",69],["karaoketexty.cz",70],["kladenskelisty.cz",71],["kniha.cz",72],["konzolista.cz",[73,74]],["topky.sk",[73,148]],["tvtv.sk",[73,151]],["krimi-plzen.cz",75],["kupi.cz",76],["kurzy.cz",77],["lamer.cz",78],["moda.cz",78],["livesport.cz",79],["lupa.cz",80],["root.cz",80],["matematika.cz",81],["mediar.cz",82],["medop.cz",83],["menicka.cz",84],["meteoprog.cz",85],["mladypodnikatel.cz",86],["motorkari.cz",87],["mrk.cz",88],["msmt.cz",89],["nasepraha.cz",90],["netconcert.cz",91],["onlymen.cz",92],["osel.cz",93],["parabola.cz",94],["pravidla.cz",95],["primat.cz",96],["reflex.cz",97],["ronnie.cz",98],["forum.root.cz",99],["rouming.cz",100],["sauto.cz",101],["serialycz.cz",102],["seznam.cz",104],["clanky.seznam.cz",105],["search.seznam.cz",105],["tv.seznam.cz",106],["www.seznam.cz",107],["smartmania.cz",108],["sms.cz",109],["stesti.cz",110],["super.cz",111],["login.szn.cz",112],["tiscali.cz",113],["topzine.cz",114],["tvfreak.cz",115],["uschovna.cz",116],["vortex.cz",117],["warezforum.cz",118],["webshare.cz",120],["zakonyprolidi.cz",121],["zena-in.cz",122],["autobazar.eu",123],["letemsvetemapplem.eu",124],["libise.eu",125],["sktorrent.eu",126],["serialy.io",127],["aboutyou.sk",128],["slovnik.aktuality.sk",129],["pokec.azet.sk",130],["behame.sk",131],["best4you.sk",132],["bmwklub.sk",133],["cas.sk",[134,135]],["feminity.zoznam.sk",134],["dsl.sk",137],["hnonline.sk",138],["brainee.hnonline.sk",139],["kinema.sk",140],["sector.sk",[140,146]],["kosicednes.sk",141],["michalovskespravy.sk",142],["modrykonik.sk",143],["mojevideo.sk",144],["mtbiker.sk",145],["sme.sk",147],["touchit.sk",149],["tv-program.sk",150],["vranovske.sk",152],["vtn-vranov.sk",153],["zoznam.sk",154],["pretaktovanie.zoznam.sk",155],["najserialy.to",156],["mall.tv",157]]);

const entitiesMap = new Map(undefined);

const exceptionsMap = new Map(undefined);

self.specificImports = self.specificImports || [];
self.specificImports.push({ argsList, hostnamesMap, entitiesMap, exceptionsMap });

/******************************************************************************/

})();

/******************************************************************************/
