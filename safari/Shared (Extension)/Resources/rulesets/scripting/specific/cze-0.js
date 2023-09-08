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

const argsList = ["[class*=\"sda\"]:not(.post-content)","div.banner_position","#banner-left-pane,\n#banner-top-four,\n#sportObchodBanner,\ndiv.bannerHolderZapasRight","#branding_anchor_left,\n#branding_anchor_right,\n.adtea_inpage,\n.adtea_leaderboard",".amalker","#pagefoot","#tblHorniLista",".native-ads",".wpa.top",".banner-header","#biglink","#content-right > div[style]:first-of-type","#header-banner","#leva-reklama","#content-lead,\ndiv.sky-wrapper","#header-reklama,\n.side-bann-l,\n.side-bann-r",".rklh",".banner2,\n.wrap + div:not(#footer)",".ads",".square_banner","#skyscraper","#sideScrapperLayout,\ndiv[id*=\"Banner\"]","#js-branding,\ndiv[id^=\"czech-\"]","#pr-prace-blok-view,\ndiv.block-jobs-link,\ndiv[class*=\"openx-async\"]","[id^=\"hyperbox\"]",".box-offer",".cornerbox,\n.heurekaIframeHeader","div#td-outer-wrap > div.td-container",".ad-obal",".box-banner",".r-main","div[class^=\"reklama\"]","div#highlitesAds",".layoutTop","#g-top-bannery","#topSite,\n.gallery-advertisement",".intent-exit-box.l-row,\n.js-popup-quest.intent-exit-popup--quest.intent-exit-popup,\ndiv[class*=\"adcontainer\"]",".adsense,\n.leaderboard,\n.seriesadvert,\n.skyscraper",".banner","#r-leaderboardhp","#fancybox-overlay,\n#h_part_right","#t-content",".topbanner","div[id^=\"ad-leaderboard\"]",".advert","#invelt","div.klik--leaderboard","#blackfooter",".topbanners","#box.mb,\n.arr-red","#ahead","#stOverlay,\n.promobox","div._banner","div.ogm-branding > div > div","div.bottom-partners","div.container.partners",".filtr.category-partner,\ndiv[class$=\"advert\"],\ndiv[class*=\"__banner\"]","[class*=\"sda-\"]",".TopFullBanner","div[id^=\"hyper\"]","[class*=\"r-main\"]","div.advert-leader-board-container",".mone_box",".reklama-background","#social",".bannLead","[class*=\"ad_\"]",".rleft,\n.rright,\n.tree","div[id^=\"banner\"]",".ad",".v-card.mb-6","[class*=\"partnеr\"],\na[rel=\"sponsored\"]",".top_background","#z990x200,\n#zr300x600,\n[id^=\"adv_\"],\na[href*=\"utm_campaign=kurzy_\"],\niframe[src^=\"https://img.kurzy.cz/og\"]",".square","#box-over-content-a",".design-advert-placeholder,\n.design-box--jobs","#box-3,\n#rbackground-link,\ndiv[id*=\"reklama\"]",".banns-group","#block-nodesinblock-0",".header_banner","div[id^=\"mp_banner_\"]",".scroll_banner",".banner, .left-side-banner, .right-side-banner,\na[trgurl], a[href*=\"relocate.php\"]",".komerce",".npab","[class*=\"advertisement\"]","pp",".right","div[style^=\"float:left;width:468px;\"] + img[src^=\"data:image/gif;base64,\"]",".advtick","a[class^=\"levakolejroku\"],\na[class^=\"pravakolejroku\"]","#leaderBox,\n.sticky-wrapper","#fixedMenu,\n#rek3,\n#rodkaz",".body_message--ad",".roumingLista","#pvMid","a[href^=\"https://prehrajto.cz/?cc=prlbmso2\"]",".mid-lead-hp",".gadget--zbozi,\ndiv[data-dot*=\"gadgetCommercial\"]","div[data-e-b-n*=\"advert\"],\ndiv[data-e-b-n*=\"sklik\"]","div[class^=\"branding-ad\"]","div.ad-exclusive,\ndiv.ogm-sticky-repeater","a[href*=\"track.smartmania.cz\"]","#P_reklama_horni,\n.reklamni_sdeleni,\n.rs_reklama,\n[style=\"vertical-align:middle; text-align: left; width: 139px;\"]",".mabo.faa,\n[style=\"width:960px;margin:0 auto;text-align:left\"]","a[data-dot=\"c_pozadi\"],\na[data-dot=\"hp_pozadi\"],\ndiv.ad","#ad",".bbtitle","#vyjizdeciBoxikDiv",".sidebar-banner,\n.skyscrapper-right",".branding-link",".banner-brand",".center,\nobject[id*=\"bfad\"]","#adLocation-21,\n#popwrapper,\n#t-overlay,\n.row0,\na[href=\"http://acu.cz\"],\nh3","[class^=\"ws-banner-\"]",".SkyLeft.Banner","div.main-top,\ndiv.site-reklama",".bannero2","#branding_conts,\n#floatad,\n#headertopbanner,\n.headerbanner","#aa1","div[style*=\"position:absolute;\"]","div[id][style=\"position: absolute; top: 0; left: 0; width: 100%; height: 380px; text-align: center;\"]",".c_banner300x300","div[class^=\"banner_box\"]","a[href=\"http://www.Onlinefilmy.eu\"],\na[href=\"http://www.movieportal.eu\"],\ndiv[style=\"font-size:20px; font-family:Arial Black, Arial; color:#FF0000; font-weight:bold\"]","div[id^=\"ad\"]","div[class*=\"pohodoWidget\"]","a.predpredaj-black",".h2.grad2.kupons_games",".header_info_text",".s-branding,\n[id^=\"banner-\"],\ndiv[style*=\"Roboto\"][style*=\"fixed\"],\nstripemark","[id^=\"back\"][onclick]","#footer,\n#headerSlideContent1,\n#ocko","[id^=\"mk-branding-\"]","#brnd","a[href*=\"trackBannerAd\"]","iframe[data-src^=\"/default-ad\"]","#top-offers-slider,\n.addbox.avizo,\n.box_advertisment.addbox.recycle,\n.nastip,\n.takeoverKlik",".gate-advert-wrap",".dragobj > div:nth-of-type(2),\n.stn.stns > a[target=\"_blank\"],\n.stn.stnu > a[target=\"_blank\"]","div[class=\"advertisement-list-component\"],\ndiv[class^=\"item h2\"]","a[href^=\"https://boxu.sk\"]",".post.bg5",".overlay,\na[class^=\"tv-\"]",".banner-under,\n.product-ad-wrapper,\n.sqaure-mobile-ad"];

const hostnamesMap = new Map([["grunex.com",0],["kamsdetmi.com",1],["onlajny.com",2],["programujte.com",3],["tipcars.com",4],["titulky.com",5],["war4all.com",6],["zmeskanyhovor.com",7],["365tipu.cz",8],["appliste.cz",9],["serialzone.cz",[9,98]],["autobazar.cz",10],["autoforum.cz",[11,12]],["wmmania.cz",12],["autohit.cz",13],["autorevue.cz",14],["e15.cz",[14,35]],["maminka.cz",14],["mobilmania.cz",14],["zive.cz",14],["autosport.cz",15],["autoweb.cz",16],["autozine.cz",17],["isport.blesk.cz",18],["evropa2.cz",18],["filmporno.cz",[18,48]],["businessworld.cz",[19,20]],["computerworld.cz",[19,20,28]],["pcworld.cz",20],["busportal.cz",21],["cc.cz",22],["cdr.cz",23],["diit.cz",23],["ceskenoviny.cz",[24,25]],["nasepenize.cz",25],["cesky-jazyk.cz",26],["cnews.cz",27],["csfd.cz",29],["csfd.sk",29],["databazeknih.cz",30],["denik.cz",31],["dotekomanie.cz",32],["drbna.cz",33],["e-mostecko.cz",34],["info.cz",35],["echo24.cz",36],["edna.cz",[37,38]],["in-pocasi.cz",38],["ireceptar.cz",38],["webtrh.cz",38],["centrum.sk",[38,129]],["emimino.cz",39],["esemes.cz",[40,41]],["warforum.cz",[41,114]],["estav.cz",42],["euro.cz",43],["eurogamer.cz",44],["pravopisne.cz",44],["pravopisne.sk",44],["ewrc.cz",45],["extra.cz",46],["fdb.cz",47],["finance.cz",[49,50]],["motoforum.cz",50],["firstclass.cz",51],["fotoaparat.cz",52],["garaz.cz",53],["prozeny.cz",53],["seznamzpravy.cz",53],["hcdukla.cz",54],["hcmotor.cz",55],["heureka.cz",56],["heureka.sk",56],["hrej.cz",57],["pctuning.cz",57],["tryhard.cz",57],["zing.cz",57],["hybrid.cz",58],["idnes.cz",[59,60]],["lidovky.cz",[59,60]],["modnipeklo.cz",60],["idos.idnes.cz",61],["cnn.iprima.cz",62],["itnetwork.cz",63],["jaknaletenky.cz",64],["kaloricketabulky.cz",65],["karaoketexty.cz",66],["kladenskelisty.cz",67],["kniha.cz",68],["konzolista.cz",[69,70]],["topky.sk",[69,138]],["tvtv.sk",69],["krimi-plzen.cz",71],["kupi.cz",72],["kurzy.cz",73],["lamer.cz",74],["moda.cz",74],["livesport.cz",75],["lupa.cz",76],["root.cz",76],["matematika.cz",77],["mediar.cz",78],["medop.cz",79],["menicka.cz",80],["meteoprog.cz",81],["mladypodnikatel.cz",82],["motorkari.cz",83],["mrk.cz",84],["nasepraha.cz",85],["netconcert.cz",86],["onlymen.cz",87],["osel.cz",88],["parabola.cz",89],["pravidla.cz",90],["primat.cz",91],["reflex.cz",92],["ronnie.cz",93],["forum.root.cz",94],["rouming.cz",95],["sauto.cz",96],["serialycz.cz",97],["seznam.cz",99],["clanky.seznam.cz",100],["search.seznam.cz",100],["tv.seznam.cz",101],["www.seznam.cz",102],["smartmania.cz",103],["sms.cz",104],["stesti.cz",105],["super.cz",106],["login.szn.cz",107],["tiscali.cz",108],["topzine.cz",109],["tvfreak.cz",110],["uschovna.cz",111],["vortex.cz",112],["warezforum.cz",113],["webshare.cz",115],["zakonyprolidi.cz",116],["zena-in.cz",117],["autobazar.eu",118],["letemsvetemapplem.eu",119],["libise.eu",120],["sktorrent.eu",121],["serialy.io",122],["pokec.azet.sk",123],["behame.sk",124],["best4you.sk",125],["bmwklub.sk",126],["cas.sk",[127,128]],["feminity.zoznam.sk",127],["dsl.sk",130],["hnonline.sk",131],["kinema.sk",132],["sector.sk",[132,137]],["michalovskespravy.sk",133],["modrykonik.sk",134],["mojevideo.sk",135],["mtbiker.sk",136],["touchit.sk",139],["tv-program.sk",140],["vranovske.sk",141],["zoznam.sk",142],["pretaktovanie.zoznam.sk",143],["najserialy.to",144],["mall.tv",145]]);

const entitiesMap = new Map(undefined);

const exceptionsMap = new Map(undefined);

self.specificImports = self.specificImports || [];
self.specificImports.push({ argsList, hostnamesMap, entitiesMap, exceptionsMap });

/******************************************************************************/

})();

/******************************************************************************/
