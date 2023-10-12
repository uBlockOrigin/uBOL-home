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

const argsList = ["[class*=\"sda\"]:not(.post-content)","div.banner_position","#banner-left-pane,\n#banner-top-four,\n#sportObchodBanner,\ndiv.bannerHolderZapasRight","#branding_anchor_left,\n#branding_anchor_right,\n.adtea_inpage,\n.adtea_leaderboard",".amalker","#pagefoot","#tblHorniLista",".native-ads",".wpa.top",".banner-header","#biglink","#content-right > div[style]:first-of-type","#header-banner","#leva-reklama","#content-lead,\ndiv.sky-wrapper","#header-reklama,\n.side-bann-l,\n.side-bann-r",".rklh",".banner2,\n.wrap + div:not(#footer)",".ads",".square_banner","#skyscraper","#sideScrapperLayout,\ndiv[id*=\"Banner\"]","#js-branding,\ndiv[id^=\"czech-\"]","#pr-prace-blok-view,\ndiv.block-jobs-link,\ndiv[class*=\"openx-async\"]","[id^=\"hyperbox\"]",".box-offer",".cornerbox,\n.heurekaIframeHeader","div#td-outer-wrap > div.td-container",".ad-obal",".box-banner","div[id^=\"ad_\"]","div[class^=\"reklama\"]","div#highlitesAds",".layoutTop","#g-top-bannery","#topSite,\n.gallery-advertisement",".intent-exit-box.l-row,\n.js-popup-quest.intent-exit-popup--quest.intent-exit-popup,\ndiv[class*=\"adcontainer\"]",".adsense,\n.leaderboard,\n.seriesadvert,\n.skyscraper",".banner","#r-leaderboardhp","div[id^=\"cross\"]",".rf-branding,\ndiv[class^=\"cross\"]","#fancybox-overlay,\n#h_part_right","#t-content",".topbanner","div[id^=\"ad-leaderboard\"]",".advert","#invelt","div.klik--leaderboard","#blackfooter",".topbanners","#box.mb,\n.arr-red","#ahead","#stOverlay,\n.promobox","div._banner","div.ogm-branding > div > div","div.bottom-partners","div.container.partners",".filtr.category-partner,\ndiv[class$=\"advert\"],\ndiv[class*=\"__banner\"]","[class*=\"sda-\"]",".TopFullBanner","div[id^=\"hyper\"]","[class*=\"r-main\"]","div.advert-leader-board-container",".mone_box",".reklama-background","#social",".bannLead","[class*=\"ad_\"]",".rleft,\n.rright,\n.tree","div[id^=\"banner\"]",".ad",".v-card.mb-6","[class*=\"partnеr\"],\na[rel=\"sponsored\"]",".top_background","#z990x200,\n#zr300x600,\n[id^=\"adv_\"],\na[href*=\"utm_campaign=kurzy_\"],\niframe[src^=\"https://img.kurzy.cz/og\"]",".square","#box-over-content-a",".design-advert-placeholder,\n.design-box--jobs","#box-3,\n#rbackground-link,\ndiv[id*=\"reklama\"]",".banns-group","#block-nodesinblock-0",".header_banner","div[id^=\"mp_banner_\"]",".scroll_banner",".banner, .left-side-banner, .right-side-banner,\na[trgurl], a[href*=\"relocate.php\"]",".komerce",".npab","[class*=\"advertisement\"]","pp",".right","div[style^=\"float:left;width:468px;\"] + img[src^=\"data:image/gif;base64,\"]",".advtick","a[class^=\"levakolejroku\"],\na[class^=\"pravakolejroku\"]","#leaderBox,\n.sticky-wrapper","#fixedMenu,\n#rek3,\n#rodkaz",".body_message--ad",".roumingLista","#pvMid","a[href^=\"https://prehrajto.cz/?cc=prlbmso2\"]",".mid-lead-hp",".gadget--zbozi,\ndiv[data-dot*=\"gadgetCommercial\"]","div[data-e-b-n*=\"advert\"],\ndiv[data-e-b-n*=\"sklik\"]","div[class^=\"branding-ad\"]","div.ad-exclusive,\ndiv.ogm-sticky-repeater","a[href*=\"track.smartmania.cz\"]","#P_reklama_horni,\n.reklamni_sdeleni,\n.rs_reklama,\n[style=\"vertical-align:middle; text-align: left; width: 139px;\"]",".mabo.faa,\n[style=\"width:960px;margin:0 auto;text-align:left\"]","a[data-dot=\"c_pozadi\"],\na[data-dot=\"hp_pozadi\"],\ndiv.ad","#ad",".bbtitle","#vyjizdeciBoxikDiv",".sidebar-banner,\n.skyscrapper-right",".branding-link",".banner-brand",".center,\nobject[id*=\"bfad\"]","#adLocation-21,\n#popwrapper,\n#t-overlay,\n.row0,\na[href=\"http://acu.cz\"],\nh3","[class^=\"ws-banner-\"]",".SkyLeft.Banner","div.main-top,\ndiv.site-reklama",".bannero2","#branding_conts,\n#floatad,\n#headertopbanner,\n.headerbanner","#aa1","div[style*=\"position:absolute;\"]","div[id][style=\"position: absolute; top: 0; left: 0; width: 100%; height: 380px; text-align: center;\"]",".c_banner300x300","div[class^=\"banner_box\"]","a[href=\"http://www.Onlinefilmy.eu\"],\na[href=\"http://www.movieportal.eu\"],\ndiv[style=\"font-size:20px; font-family:Arial Black, Arial; color:#FF0000; font-weight:bold\"]","div[id^=\"ad\"]","div[class*=\"pohodoWidget\"]","a.predpredaj-black",".h2.grad2.kupons_games",".header_info_text",".s-branding,\n[id^=\"banner-\"],\ndiv[style*=\"Roboto\"][style*=\"fixed\"],\nstripemark",".container--break-branding,\n.container--ticketportal,\n.item--socials,\n.item__ad-center","[id^=\"back\"][onclick]",".newsletter,\nheader > div","#footer,\n#headerSlideContent1,\n#ocko","[id^=\"mk-branding-\"]","#brnd","a[href*=\"trackBannerAd\"]","iframe[data-src^=\"/default-ad\"]",".artemis-ad-position","#top-offers-slider,\n.addbox.avizo,\n.box_advertisment.addbox.recycle,\n.nastip,\n.takeoverKlik",".gate-advert-wrap",".dragobj > div:nth-of-type(2),\n.stn.stns > a[target=\"_blank\"],\n.stn.stnu > a[target=\"_blank\"]","div[class=\"advertisement-list-component\"],\ndiv[class^=\"item h2\"]","div[id^=\"advert_\"]","a[href^=\"https://boxu.sk\"]",".post.bg5",".overlay,\na[class^=\"tv-\"]",".banner-under,\n.product-ad-wrapper,\n.sqaure-mobile-ad"];

const hostnamesMap = new Map([["grunex.com",0],["kamsdetmi.com",1],["onlajny.com",2],["programujte.com",3],["tipcars.com",4],["titulky.com",5],["war4all.com",6],["zmeskanyhovor.com",7],["365tipu.cz",8],["appliste.cz",9],["serialzone.cz",[9,100]],["autobazar.cz",10],["autoforum.cz",[11,12]],["wmmania.cz",12],["autohit.cz",13],["autorevue.cz",14],["e15.cz",[14,35]],["maminka.cz",14],["mobilmania.cz",14],["zive.cz",14],["autosport.cz",15],["autoweb.cz",16],["autozine.cz",17],["isport.blesk.cz",18],["evropa2.cz",18],["filmporno.cz",[18,50]],["businessworld.cz",[19,20]],["computerworld.cz",[19,20,28]],["pcworld.cz",20],["busportal.cz",21],["cc.cz",22],["cdr.cz",23],["diit.cz",23],["ceskenoviny.cz",[24,25]],["nasepenize.cz",25],["cesky-jazyk.cz",26],["cnews.cz",27],["csfd.cz",29],["csfd.sk",29],["databazeknih.cz",30],["denik.cz",31],["dotekomanie.cz",32],["drbna.cz",33],["e-mostecko.cz",34],["info.cz",35],["echo24.cz",36],["edna.cz",[37,38]],["in-pocasi.cz",38],["ireceptar.cz",38],["webtrh.cz",38],["centrum.sk",[38,131]],["cp.hnonline.sk",[38,46]],["emimino.cz",39],["enigmaplus.cz",40],["epochaplus.cz",41],["esemes.cz",[42,43]],["warforum.cz",[43,116]],["estav.cz",44],["euro.cz",45],["eurogamer.cz",46],["pravopisne.cz",46],["pravopisne.sk",46],["ewrc.cz",47],["extra.cz",48],["fdb.cz",49],["finance.cz",[51,52]],["motoforum.cz",52],["firstclass.cz",53],["fotoaparat.cz",54],["garaz.cz",55],["prozeny.cz",55],["seznamzpravy.cz",55],["hcdukla.cz",56],["hcmotor.cz",57],["heureka.cz",58],["heureka.sk",58],["hrej.cz",59],["pctuning.cz",59],["tryhard.cz",59],["zing.cz",59],["hybrid.cz",60],["idnes.cz",[61,62]],["lidovky.cz",[61,62]],["modnipeklo.cz",62],["idos.idnes.cz",63],["cnn.iprima.cz",64],["itnetwork.cz",65],["jaknaletenky.cz",66],["kaloricketabulky.cz",67],["karaoketexty.cz",68],["kladenskelisty.cz",69],["kniha.cz",70],["konzolista.cz",[71,72]],["topky.sk",[71,143]],["tvtv.sk",71],["krimi-plzen.cz",73],["kupi.cz",74],["kurzy.cz",75],["lamer.cz",76],["moda.cz",76],["livesport.cz",77],["lupa.cz",78],["root.cz",78],["matematika.cz",79],["mediar.cz",80],["medop.cz",81],["menicka.cz",82],["meteoprog.cz",83],["mladypodnikatel.cz",84],["motorkari.cz",85],["mrk.cz",86],["nasepraha.cz",87],["netconcert.cz",88],["onlymen.cz",89],["osel.cz",90],["parabola.cz",91],["pravidla.cz",92],["primat.cz",93],["reflex.cz",94],["ronnie.cz",95],["forum.root.cz",96],["rouming.cz",97],["sauto.cz",98],["serialycz.cz",99],["seznam.cz",101],["clanky.seznam.cz",102],["search.seznam.cz",102],["tv.seznam.cz",103],["www.seznam.cz",104],["smartmania.cz",105],["sms.cz",106],["stesti.cz",107],["super.cz",108],["login.szn.cz",109],["tiscali.cz",110],["topzine.cz",111],["tvfreak.cz",112],["uschovna.cz",113],["vortex.cz",114],["warezforum.cz",115],["webshare.cz",117],["zakonyprolidi.cz",118],["zena-in.cz",119],["autobazar.eu",120],["letemsvetemapplem.eu",121],["libise.eu",122],["sktorrent.eu",123],["serialy.io",124],["pokec.azet.sk",125],["behame.sk",126],["best4you.sk",127],["bmwklub.sk",128],["cas.sk",[129,130]],["feminity.zoznam.sk",129],["dsl.sk",132],["hnonline.sk",133],["brainee.hnonline.sk",134],["kinema.sk",135],["sector.sk",[135,141]],["kosicednes.sk",136],["michalovskespravy.sk",137],["modrykonik.sk",138],["mojevideo.sk",139],["mtbiker.sk",140],["sme.sk",142],["touchit.sk",144],["tv-program.sk",145],["vranovske.sk",146],["vtn-vranov.sk",147],["zoznam.sk",148],["pretaktovanie.zoznam.sk",149],["najserialy.to",150],["mall.tv",151]]);

const entitiesMap = new Map(undefined);

const exceptionsMap = new Map(undefined);

self.specificImports = self.specificImports || [];
self.specificImports.push({ argsList, hostnamesMap, entitiesMap, exceptionsMap });

/******************************************************************************/

})();

/******************************************************************************/
