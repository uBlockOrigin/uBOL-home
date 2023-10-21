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

const argsList = ["#modal-container,\n.modal-backdrop,\ndiv[id^=\"branding\"]","[class*=\"sda\"]:not(.post-content)","div.banner_position","#banner-left-pane,\n#banner-top-four,\n#sportObchodBanner,\ndiv.bannerHolderZapasRight","#branding_anchor_left,\n#branding_anchor_right,\n.adtea_inpage,\n.adtea_leaderboard",".amalker","#pagefoot","#tblHorniLista",".native-ads",".wpa.top",".banner-header","#biglink","#content-right > div[style]:first-of-type","#header-banner","#leva-reklama","#content-lead,\ndiv.sky-wrapper","#header-reklama,\n.side-bann-l,\n.side-bann-r",".rklh",".banner2,\n.wrap + div:not(#footer)",".ads",".square_banner","#skyscraper","#sideScrapperLayout,\ndiv[id*=\"Banner\"]","#js-branding,\ndiv[id^=\"czech-\"]","#pr-prace-blok-view,\ndiv.block-jobs-link,\ndiv[class*=\"openx-async\"]","[id^=\"hyperbox\"]",".box-offer",".cornerbox,\n.heurekaIframeHeader","div#td-outer-wrap > div.td-container",".ad-obal",".box-banner","div[id^=\"ad_\"]","div[class^=\"reklama\"]","div#highlitesAds",".layoutTop","#g-top-bannery","#topSite,\n.gallery-advertisement",".intent-exit-box.l-row,\n.js-popup-quest.intent-exit-popup--quest.intent-exit-popup,\ndiv[class*=\"adcontainer\"]",".adsense,\n.leaderboard,\n.seriesadvert,\n.skyscraper",".banner","#r-leaderboardhp","div[id^=\"cross\"]",".rf-branding,\ndiv[class^=\"cross\"]","#fancybox-overlay,\n#h_part_right","#t-content",".topbanner","div[id^=\"ad-leaderboard\"]",".advert","#invelt","div.klik--leaderboard","#blackfooter",".topbanners","#box.mb,\n.arr-red","#ahead","#stOverlay,\n.promobox","div._banner","div.ogm-branding > div > div","div.bottom-partners","div.container.partners",".filtr.category-partner,\ndiv[class$=\"advert\"],\ndiv[class*=\"__banner\"]","[class*=\"sda-\"]",".TopFullBanner","div[id^=\"hyper\"]","[class*=\"r-main\"]","div.advert-leader-board-container",".mone_box",".reklama-background","#social",".bannLead","[class*=\"ad_\"]",".rleft,\n.rright,\n.tree","div[id^=\"banner\"]",".ad",".v-card.mb-6","[class*=\"partnеr\"],\na[rel=\"sponsored\"]",".top_background","#z990x200,\n#zr300x600,\n[id^=\"adv_\"],\na[href*=\"utm_campaign=kurzy_\"],\niframe[src^=\"https://img.kurzy.cz/og\"]",".square","#box-over-content-a",".design-advert-placeholder,\n.design-box--jobs","#box-3,\n#rbackground-link,\ndiv[id*=\"reklama\"]",".banns-group","#block-nodesinblock-0",".header_banner","div[id^=\"mp_banner_\"]",".scroll_banner",".banner, .left-side-banner, .right-side-banner,\na[trgurl], a[href*=\"relocate.php\"]",".komerce",".npab","[class*=\"advertisement\"]","pp",".right","div[style^=\"float:left;width:468px;\"] + img[src^=\"data:image/gif;base64,\"]",".advtick","a[class^=\"levakolejroku\"],\na[class^=\"pravakolejroku\"]","#leaderBox,\n.sticky-wrapper","#fixedMenu,\n#rek3,\n#rodkaz",".body_message--ad",".roumingLista","#pvMid","a[href^=\"https://prehrajto.cz/?cc=prlbmso2\"]",".mid-lead-hp",".gadget--zbozi,\ndiv[data-dot*=\"gadgetCommercial\"]","div[data-e-b-n*=\"advert\"],\ndiv[data-e-b-n*=\"sklik\"]","div[class^=\"branding-ad\"]","div.ad-exclusive,\ndiv.ogm-sticky-repeater","a[href*=\"track.smartmania.cz\"]","#P_reklama_horni,\n.reklamni_sdeleni,\n.rs_reklama,\n[style=\"vertical-align:middle; text-align: left; width: 139px;\"]",".mabo.faa,\n[style=\"width:960px;margin:0 auto;text-align:left\"]","a[data-dot=\"c_pozadi\"],\na[data-dot=\"hp_pozadi\"],\ndiv.ad","#ad",".bbtitle","#vyjizdeciBoxikDiv",".sidebar-banner,\n.skyscrapper-right",".branding-link",".banner-brand",".center,\nobject[id*=\"bfad\"]","#adLocation-21,\n#popwrapper,\n#t-overlay,\n.row0,\na[href=\"http://acu.cz\"],\nh3","[class^=\"ws-banner-\"]",".SkyLeft.Banner","div.main-top,\ndiv.site-reklama",".bannero2","#branding_conts,\n#floatad,\n#headertopbanner,\n.headerbanner","#aa1","div[style*=\"position:absolute;\"]","div[id][style=\"position: absolute; top: 0; left: 0; width: 100%; height: 380px; text-align: center;\"]",".c_banner300x300","div[class^=\"banner_box\"]","a[href=\"http://www.Onlinefilmy.eu\"],\na[href=\"http://www.movieportal.eu\"],\ndiv[style=\"font-size:20px; font-family:Arial Black, Arial; color:#FF0000; font-weight:bold\"]","div[id^=\"ad\"]","div[class*=\"pohodoWidget\"]","a.predpredaj-black",".h2.grad2.kupons_games",".header_info_text",".s-branding,\n[id^=\"banner-\"],\ndiv[style*=\"Roboto\"][style*=\"fixed\"],\nstripemark",".container--break-branding,\n.container--ticketportal,\n.item--socials,\n.item__ad-center","[id^=\"back\"][onclick]",".newsletter,\nheader > div","#footer,\n#headerSlideContent1,\n#ocko","[id^=\"mk-branding-\"]","#brnd","a[href*=\"trackBannerAd\"]","iframe[data-src^=\"/default-ad\"]",".artemis-ad-position","#top-offers-slider,\n.addbox.avizo,\n.box_advertisment.addbox.recycle,\n.nastip,\n.takeoverKlik",".gate-advert-wrap",".dragobj > div:nth-of-type(2),\n.stn.stns > a[target=\"_blank\"],\n.stn.stnu > a[target=\"_blank\"]",".connection-results-ad","div[class=\"advertisement-list-component\"],\ndiv[class^=\"item h2\"]","div[id^=\"advert_\"]","a[href^=\"https://boxu.sk\"]",".post.bg5",".overlay,\na[class^=\"tv-\"]",".banner-under,\n.product-ad-wrapper,\n.sqaure-mobile-ad"];

const hostnamesMap = new Map([["autozurnal.com",0],["grunex.com",1],["kamsdetmi.com",2],["onlajny.com",3],["programujte.com",4],["tipcars.com",5],["titulky.com",6],["war4all.com",7],["zmeskanyhovor.com",8],["365tipu.cz",9],["appliste.cz",10],["serialzone.cz",[10,101]],["autobazar.cz",11],["autoforum.cz",[12,13]],["wmmania.cz",13],["autohit.cz",14],["autorevue.cz",15],["e15.cz",[15,36]],["maminka.cz",15],["mobilmania.cz",15],["zive.cz",15],["autosport.cz",16],["autoweb.cz",17],["autozine.cz",18],["isport.blesk.cz",19],["evropa2.cz",19],["filmporno.cz",[19,51]],["businessworld.cz",[20,21]],["computerworld.cz",[20,21,29]],["pcworld.cz",21],["busportal.cz",22],["cc.cz",23],["cdr.cz",24],["diit.cz",24],["ceskenoviny.cz",[25,26]],["nasepenize.cz",26],["cesky-jazyk.cz",27],["cnews.cz",28],["csfd.cz",30],["csfd.sk",30],["databazeknih.cz",31],["denik.cz",32],["dotekomanie.cz",33],["drbna.cz",34],["e-mostecko.cz",35],["info.cz",36],["echo24.cz",37],["edna.cz",[38,39]],["in-pocasi.cz",39],["ireceptar.cz",39],["webtrh.cz",39],["centrum.sk",[39,132]],["cp.hnonline.sk",[39,47]],["emimino.cz",40],["enigmaplus.cz",41],["epochaplus.cz",42],["esemes.cz",[43,44]],["warforum.cz",[44,117]],["estav.cz",45],["euro.cz",46],["eurogamer.cz",47],["pravopisne.cz",47],["pravopisne.sk",47],["ewrc.cz",48],["extra.cz",49],["fdb.cz",50],["finance.cz",[52,53]],["motoforum.cz",53],["firstclass.cz",54],["fotoaparat.cz",55],["garaz.cz",56],["prozeny.cz",56],["seznamzpravy.cz",56],["hcdukla.cz",57],["hcmotor.cz",58],["heureka.cz",59],["heureka.sk",59],["hrej.cz",60],["pctuning.cz",60],["tryhard.cz",60],["zing.cz",60],["hybrid.cz",61],["idnes.cz",[62,63]],["lidovky.cz",[62,63]],["modnipeklo.cz",63],["idos.idnes.cz",64],["cnn.iprima.cz",65],["itnetwork.cz",66],["jaknaletenky.cz",67],["kaloricketabulky.cz",68],["karaoketexty.cz",69],["kladenskelisty.cz",70],["kniha.cz",71],["konzolista.cz",[72,73]],["topky.sk",[72,144]],["tvtv.sk",72],["krimi-plzen.cz",74],["kupi.cz",75],["kurzy.cz",76],["lamer.cz",77],["moda.cz",77],["livesport.cz",78],["lupa.cz",79],["root.cz",79],["matematika.cz",80],["mediar.cz",81],["medop.cz",82],["menicka.cz",83],["meteoprog.cz",84],["mladypodnikatel.cz",85],["motorkari.cz",86],["mrk.cz",87],["nasepraha.cz",88],["netconcert.cz",89],["onlymen.cz",90],["osel.cz",91],["parabola.cz",92],["pravidla.cz",93],["primat.cz",94],["reflex.cz",95],["ronnie.cz",96],["forum.root.cz",97],["rouming.cz",98],["sauto.cz",99],["serialycz.cz",100],["seznam.cz",102],["clanky.seznam.cz",103],["search.seznam.cz",103],["tv.seznam.cz",104],["www.seznam.cz",105],["smartmania.cz",106],["sms.cz",107],["stesti.cz",108],["super.cz",109],["login.szn.cz",110],["tiscali.cz",111],["topzine.cz",112],["tvfreak.cz",113],["uschovna.cz",114],["vortex.cz",115],["warezforum.cz",116],["webshare.cz",118],["zakonyprolidi.cz",119],["zena-in.cz",120],["autobazar.eu",121],["letemsvetemapplem.eu",122],["libise.eu",123],["sktorrent.eu",124],["serialy.io",125],["pokec.azet.sk",126],["behame.sk",127],["best4you.sk",128],["bmwklub.sk",129],["cas.sk",[130,131]],["feminity.zoznam.sk",130],["dsl.sk",133],["hnonline.sk",134],["brainee.hnonline.sk",135],["kinema.sk",136],["sector.sk",[136,142]],["kosicednes.sk",137],["michalovskespravy.sk",138],["modrykonik.sk",139],["mojevideo.sk",140],["mtbiker.sk",141],["sme.sk",143],["touchit.sk",145],["tv-program.sk",146],["ubian.sk",147],["vranovske.sk",148],["vtn-vranov.sk",149],["zoznam.sk",150],["pretaktovanie.zoznam.sk",151],["najserialy.to",152],["mall.tv",153]]);

const entitiesMap = new Map(undefined);

const exceptionsMap = new Map(undefined);

self.specificImports = self.specificImports || [];
self.specificImports.push({ argsList, hostnamesMap, entitiesMap, exceptionsMap });

/******************************************************************************/

})();

/******************************************************************************/
