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
/* global cloneInto */

'use strict';

// ruleset: annoyances-overlays

/******************************************************************************/

// Important!
// Isolate from global scope

// Start of local scope
(( ) => {

/******************************************************************************/

// Start of code to inject
const uBOL_setConstant = function() {

const scriptletGlobals = new Map(); // jshint ignore: line

const argsList = [["Object.prototype.renderTo","undefined"],["Object.prototype.blockId","undefined"],["Object.prototype.hasShadowDomSupport","undefined"],["Object.prototype.BannerDirect","undefined"],["Object.prototype.registerPlacement","undefined"],["Object.prototype.isAdblockEnable","noopFunc"],["Object.prototype.renderDirect","undefined"],["admiral","noopFunc"],["ezAardvarkDetected","false"],["checkAdBlock","noopFunc"],["hasAdblock","false"],["ads.adBlockDetected","false"],["penci_adlbock","undefined"],["blockingAds","false"],["nerverblock_callback","noopFunc"],["showAds","true"],["isAdblockEnabled","false"],["popUpInfo","noopFunc"],["jsData.adsEnabled","false"],["brighteonSpecial","true"],["adblockV1","true"],["adblocker_is_off","true"],["TfmediaExtFolEngineLoaded","true"],["Object.prototype.rellect_adblock_detector","false"],["cmnnrunads","true"],["isAdblockEnable","false"],["canRunAds","true"],["adsAllowed2","true"],["cwAdblockDisabled1","true"],["cwAdblockDisabled2","true"],["adsbygoogle.loaded","true"],["VMG.Components.Adblock","false"],["detect","undefined"],["google_jobrunner","noopFunc"],["isAdBlockActive","false"],["adBlockerDetected","false"],["google_ad_block","false"],["googlefc","null"],["adblock","false"],["adv_openx_oas_ads","true"],["icy_veins_blocked","false"],["inxBX.failed","false"],["cr","0"],["gn","true"],["window.google_ad_status","1"],["alert","undefined"],["niceAdsCheck","true"],["google_ad_status","1"],["adning_no_adblock","true"],["jQuery.adblock","false"],["AdBlocker","false"],["mb.advertisingShouldBeEnabled","false"],["checkAdblockBait","noopFunc"],["MP.lib.adBlockEnabled","noopFunc"],["adBlockEnabled","false"],["adblockDetector","noopFunc"],["isAdBlockEnabled","false"],["pqdxwidthqt","false"],["googlefc.getAdBlockerStatus","noopFunc"],["adsOk","true"],["flatPM_adbDetect","noopFunc"],["XenForo.rellect.AdBlockDetector","noopFunc"],["ab","false"],["data.ad_free","true"],["use_adblock","false"],["adBlockDetected","false"],["sugabuAdsLoaded","true"],["SD_IS_BLOCKING","false"],["sd_adBlockDetector","{}"],["SD_BLOCKTHROUGH","true"],["ConcertAds","true"],["window.adsEnabled","true"],["_ABE","undefined"],["Adblock","false"],["foolish_script_is_here","noopFunc"],["showBanner600","true"],["window.canRunAds","true"],["ab.isTrig","false"],["adsbygoogle.push.length","1"],["_ads","true"],["__tnt.advertisements","noopFunc"],["advanced_ads_pro.adblocker_active","false"],["ads","true"],["AdBlockSELECTOR","undefined"],["adBlockerReady","false"],["adFilters","undefined"],["Object.prototype.cABNoCheck","undefined"],["WO.adblock.useAdblocker","false"],["window.abc","false"],["__NUXT__.state.services.features.shoppingExtensionPopupArticle","undefined"],["openOverlaySignup","noopFunc"],["GEMG.ConversionModule","noopFunc"],["mainBottomBanner","noopFunc"],["app.enablePopup","false"],["wp_subscribe_popup","noopFunc"],["initExitIntent","noopFunc"],["window.Unauthorized2","undefined"],["window.PageBottomBanners.initUnauthBanner","noopFunc"],["_sharedData.is_whitelisted_crawl_bot","true"],["Notification.requestPermission","noopFunc"],["firebase.messaging","noopFunc"],["Object.prototype.PushSubscription",""],["PushSubscription","undefined"],["PushManager","undefined"],["navigator.geolocation","{}"],["arrJsConfig.enablePushNotification","0"],["smartech","noopFunc"],["WSI.contentPersonalization.hideEmailCaptureOverlay","true"],["show_dimissable_registration","false"],["PASSER_videoPAS_apres","0"],["warning_widget.check_ad_block_status","noopFunc"],["killads","true"],["adsAreBlocked","false"],["displayed","false"],["nebula.session.flags.adblock","undefined"],["_adBlockCheck","true"],["webkitRequestFileSystem","noopFunc"],["valid_user","true"],["is_adblocker_in_use","false"],["Drupal.behaviors.detectAdblockers","noopFunc"],["disableSelection","noopFunc"],["ADBdetected","noopFunc"],["BIA.ADBLOCKER","false"],["samDetected","true"],["adBlockFunction","trueFunc"],["checkAds","trueFunc"],["google_jobrunner","true"],["isAdblockDisabled","true"],["checkPrivacyWall","noopFunc"],["document.oncontextmenu","null"],["nocontext","noopFunc"],["adsAreShown","true"],["abd","false"],["detector_active","true"],["aoezone_adchecker","true"],["pageService.initDownloadProtection","noopFunc"],["detectPrivateMode","noopFunc"],["webkitRequestFileSystem","undefined"],["adsbygoogle","null"],["ads_not_blocked","true"],["hideBannerBlockedMessage","true"],["bAdBlocker","false"],["blurred","false"],["document.oncontextmenu","undefined"],["alert","trueFunc"],["TGMP_OBJ_CACHE.tritonsee_client.playAttemptsCount","trueFunc"],["better_ads_adblock","0"],["console.clear","trueFunc"],["console.debug","trueFunc"],["adBlock","false"],["adsEnabled","true"],["ads_enabled","true"],["better_ads_adblock","null"],["f12lock","false"],["document.onselectstart","null"],["document.onkeyup","null"],["document.ondragstart","null"],["commonUtil.openToast","null"],["NS_TVER_EQ.checkEndEQ","trueFunc"],["mps._queue.abdetect","null"],["fuckAdBlock","trueFunc"],["abp","false"],["document.onselectstart","noopFunc"],["document.onkeydown","noopFunc"],["rwt","noopFunc"],["getSelection","undefined"],["document.onkeydown","null"],["console.clear","noopFunc"],["document.oncontextmenu","noopFunc"],["x5engine.utils.imCodeProtection","null"],["pbi_analytics","true"],["ansFrontendGlobals.settings.signupWallType","undefined"],["onload","null"],["adblock","0"],["document.ondragstart","noopFunc"],["document.onmousedown","noopFunc"],["disableselect","trueFunc"],["document.onkeypress","null"],["document.oncontextmenu",""],["document.onselectstart",""],["document.onkeydown",""],["document.onmousedown",""],["document.onclick",""],["document.body.onmouseup","null"],["document.oncopy","null"],["document.onkeydown","trueFunc"],["document.body.oncut","null"],["document.body.oncopy","null"],["console.log","noopFunc"],["document.ondragstart","trueFunc"],["document.onselectstart","trueFunc"],["jsData.hasVideoMeteringUnlogEnabled","undefined"],["lepopup_abd_enabled",""],["console.clear","undefined"],["Object.prototype.preroll","[]"],["document.oncontextmenu","trueFunc"],["devtoolsDetector","undefined"],["Object.prototype.bgOverlay","noopFunc"],["Object.prototype.fixedContentPos","noopFunc"],["console.dir","noopFunc"],["navigator.userAgent",""],["devtoolIsOpening","noopFunc"],["devtoolIsOpening","undefined"],["securityTool.disableRightClick","noopFunc"],["securityTool.disableF12","noopFunc"],["securityTool.disableCtrlP","noopFunc"],["securityTool.disableCtrlS","noopFunc"],["securityTool.disablePrintScreen","noopFunc"],["securityTool.disablePrintThisPage","noopFunc"],["securityTool.disableElementForPrintThisPage","noopFunc"],["mousehandler","noopFunc"],["checkAds","noopFunc"],["stopPrntScr","noopFunc"],["disableSelection","undefined"],["traffective","true"],["devtoolsDetector","1"],["flashvars.autoplay",""],["document.body.oncopy","null","3"],["document.body.onselectstart","null","3"],["document.body.oncontextmenu","null","3"],["Time_Start","0"],["DD","trueFunc"],["document.oncontextmenu","null","3"],["Object.prototype._detectLoop","noopFunc"],["forbiddenList","[]"],["document.onkeypress","trueFunc"],["document.oncontextmenu","true"],["Object.prototype._detectLoop","undefined"],["devtoolsDetector","{}"],["SteadyWidgetSettings.adblockActive","false"],["devtoolsOpen","false"],["devtoolsDetector","noopFunc"]];

const hostnamesMap = new Map([["www.kinopoisk.ru",0],["rg.ru",[0,99]],["24smi.org",1],["echo.msk.ru",[2,3,101]],["dzen.ru",4],["my.mail.ru",5],["sports.ru",6],["ranker.com",7],["milestomemories.com",7],["epicstream.com",7],["worldhistory.org",7],["radiozet.pl",7],["momtastic.com",7],["howtogeek.com",7],["recordnet.com",7],["citizen-times.com",7],["tennessean.com",7],["clarionledger.com",7],["phillyburbs.com",7],["usatoday.com",[7,11]],["wrestlinginc.com",7],["videogamer.com",7],["motorbiscuit.com",7],["grandprix247.com",7],["familyminded.com",7],["xcalibrscans.com",7],["cbsnews.com",7],["finviz.com",7],["ign.com",7],["workandmoney.com",7],["today.com",7],["rottentomatoes.com",[7,159]],["walterfootball.com",7],["dotesports.com",7],["boredpanda.com",7],["cleveland.com",7],["scitechdaily.com",8],["thewindowsclub.com",8],["stash.sussy.moe",9],["android.com.pl",10],["fosslinux.com",12],["nexusmods.com",13],["1001tracklists.com",15],["autogaleria.pl",16],["basicweb.ru",17],["brainly.com",18],["brighteon.com",19],["cda.pl",20],["chefkoch.de",21],["chip.de",22],["civicx.com",23],["comnuan.com",24],["corriere.it",25],["creatur.io",26],["drnasserelbatal.com",26],["file.fm",26],["files.fm",26],["gamehag.com",26],["onlinehashcrack.com",26],["scantrad.net",26],["timebucks.com",26],["uderent.com",26],["ctrlv.cz",27],["cx30-forum.de",[28,29]],["telefon-treff.de",[28,29]],["cyberpedia.su",30],["kukuo.tw",30],["studopedia.info",30],["infopedia.su",30],["studopedia.net",30],["studopedia.su",30],["studopedia.org",30],["studopedia.ru",30],["studopedia.com.ua",30],["lektsii.org",30],["mydocx.ru",30],["dallasobserver.com",31],["digilibraries.com",32],["dniwolne.eu",33],["jeshoots.com",33],["webcamtaxi.com",33],["doodlr.io",34],["evades.io",35],["everyeye.it",36],["foxnews.com",37],["gameblog.fr",38],["lapumia.org",38],["gazzetta.it",39],["icy-veins.com",40],["inbox.lv",41],["inoreader.com",[42,43]],["investing.com",44],["it-actual.ru",45],["lowcygier.pl",46],["malaysiastock.biz",47],["marriedgames.com.br",48],["megagames.com",49],["metasrc.com",50],["meteoblue.com",51],["mgsm.pl",52],["minijuegos.com",53],["miniwebtool.com",54],["mrexcel.com",55],["nu.nl",[56,118]],["easy-learn-tech.info",57],["one-click-tutorials.info",57],["solvetube.site",57],["getintopc.com",57],["preguntandroid.com",58],["iteramos.com",58],["pyrogram.org",59],["qiwihelp.net",60],["r3owners.net",61],["remont-aud.net",62],["salon.com",[63,64]],["satelliteguys.us",65],["turkmmo.com",65],["signupgenius.com",66],["ingles.com",[67,68,69]],["spanishdict.com",[67,68,69]],["starsandstripesfc.com",70],["polygon.com",70],["strangermeetup.com",[71,150]],["thec64community.online",72],["thehindu.com",73],["titulky.com",[74,75]],["ucoin.net",76],["venea.net",77],["vimm.net",78],["wikihow.com",79],["wvnews.com",80],["xgp.pl",81],["yorumbudur.com",82],["yusepjaelani.blogspot.com",83],["weather.com",84],["m.rp5.ru",85],["m.rp5.by",85],["m.rp5.kz",85],["m.rp5.co.uk",85],["m.rp5.md",85],["rp5.ru",86],["rp5.ua",86],["rp5.by",86],["rp5.kz",86],["rp5.co.uk",86],["rp5.md",86],["wetteronline.de",87],["hdrezkasmakyy.org",88],["hdrezkafhs83u.org",88],["hdrezkahs920s.org",88],["hdrezka.in",88],["hdrezkat5ee2w.org",88],["hdrezkagdvv2b.net",88],["hdrezka66yhfg.net",88],["hdrezka77ftyy.net",88],["hdrezka.rest",88],["hdrezkaffsg67.net",88],["hdrezkafjk2he.net",88],["hdrezkahf22hh.net",88],["hdrezkahdg24s.net",88],["hdrezkabbdh4d.net",88],["hdrezkajjfhr5.net",88],["27p6qp79zyr1.net",88],["hdrezka19139.org",88],["hdrezkap3g.org",88],["hdrezkapez.org",88],["hdrezkapoi.org",88],["hdrezkarty.org",88],["hdrezkacvb.org",88],["hdrezka.ag",88],["upivi.com",88],["hdrezka.me",88],["ikinopoisk.com",88],["kinopub.me",88],["3ivi.com",88],["rezkify.com",88],["aghdrezka.com",88],["hdrezka.re",88],["bestofkinopoisk.com",88],["rezkance.com",88],["rezkery.com",88],["rezkily.com",88],["ezhdrezka.com",88],["akinopoisk.com",88],["hdrezkaonline.com",88],["drhdrezka.com",88],["mrhdrezka.com",88],["hdrezka.sh",88],["ehdrezka.com",88],["nukinopoisk.com",88],["livekinopoisk.com",88],["betahdrezka.com",88],["cokinopoisk.com",88],["hdrezka-ag.com",88],["hdrezka.club",88],["hdrezka.cm",88],["hdrezka.co",88],["hdrezka.name",88],["hdrezka.site",88],["hdrezka.today",88],["hdrezka.tv",88],["hdrezka.website",88],["hdrezkaag.net",88],["hdrezkaweb.com",88],["hdrezkayou.com",88],["instahdrezka.com",88],["myhdrezka.com",88],["freehdrezka.com",88],["rezka.ag",88],["tryhdrezka.com",88],["cnet.com",89],["edurev.in",90],["defenseone.com",91],["govexec.com",91],["nextgov.com",91],["route-fifty.com",91],["ktmmobile.com",92],["startech.com.bd",93],["onlinecourses.ooo",94],["juracademy.de",95],["vk.com",[96,97]],["instagram.com",98],["yenisafak.com",99],["offidocs.com",99],["onedio.com",99],["hpplus.jp",99],["fullfilmcibaba1.com",99],["joom.com",99],["nbc.com",99],["sport-express.ru",99],["maximum.ru",99],["ch3plus.com",99],["dropmefiles.com",99],["reddit.com",99],["life.ru",99],["macwelt.de",100],["pcwelt.de",100],["itemsatis.com",102],["dailymail.co.uk",103],["auchan.ua",104],["quizangel.com",105],["binge.buzz",106],["pbteen.com",107],["potterybarn.com",107],["potterybarnkids.com",107],["westelm.com",107],["williams-sonoma.com",107],["magicvalley.com",108],["brutal.io",[10,226]],["impots.gouv.fr",109],["realcleardefense.com",110],["xclient.info",111],["bejson.com",111],["gardenista.com",112],["opensubtitles.org",113],["gearside.com",114],["nytimes.com",[115,116]],["newyorker.com",116],["tvtropes.org",117],["justtrucks.com.au",119],["cittadinanza.biz",120],["glistranieri.it",120],["viralinindia.net",[120,130]],["ideapod.com",[120,130]],["privivkainfo.ru",120],["awebstories.com",[120,212]],["ancient.eu",121],["intramed.net",38],["protest.eu",122],["northwestfirearms.com",123],["techkings.org",123],["spookshow.net",124],["fosshub.com",125],["pokemonforever.com",126],["carsguide.com.au",127],["humo.be",128],["apksecured.com",129],["intergate.info",129],["alphapolis.co.jp",[129,154]],["chronologia.pl",[129,154]],["reportergazeta.pl",[129,154,156]],["odiarioonline.com.br",[129,166]],["nordkorea-info.de",129],["geotips.net",[129,172]],["sporizle1.pw",129],["televisiongratishd.com",[129,166,177]],["noweconomy.live",129],["naaree.com",[129,166]],["cda-hd.cc",129],["hqq.to",[129,167,185]],["tv-tokyo.co.jp",129],["arti-definisi-pengertian.info",129],["webwereld.nl",131],["palemoon.org",132],["wheel-size.com",133],["aoezone.net",134],["radioony.fm",135],["mexiconewsdaily.com",136],["technologyreview.com",137],["bdcraft.net",138],["wired.co.uk",139],["gq-magazine.co.uk",139],["glamourmagazine.co.uk",139],["buienradar.nl",140],["watson.de",141],["clk.ink",142],["zerodot1.gitlab.io",[143,144]],["1009thecat.com",145],["1013katy.com",145],["1013themix.com",145],["1015jackfm.com",145],["1015khits.com",145],["1015thefox.com",145],["1017thebeach.com",145],["1017theteam.com",145],["1019hot.com",145],["1019online.com",145],["1019thekeg.com",145],["101thefox.net",145],["101wkqx.com",145],["1021nashicon.com",145],["1021thefox.com",145],["1023thewolf.com",145],["1025jackfm.com",145],["1027thevibe.com",145],["1029nashicon.com",145],["102thebear.com",145],["1031nowfm.com",145],["1031radiom.com",145],["1035memphis.com",145],["1035thegame.com",145],["1035wrbo.com",145],["1037nash.com",145],["1039bobfm.com",145],["1039wvbo.com",145],["1041wdlt.com",145],["1043thebridge.com",145],["1043thebridge.net",145],["1043thevibe.com",145],["1045thedan.com",145],["1045thezone.com",145],["1045wjjk.com",145],["1047krez.com",145],["1049nashicon.com",145],["1049thehits.com",145],["104thehawk.com",145],["1050talk.com",145],["1053classichits.com",145],["1053hotfm.com",145],["1053thebear.com",145],["1053thepoint.com",145],["1053thepoint.net",145],["1053wow.com",145],["1055kbuck.com",145],["1055thecat.com",145],["1057kokz.com",145],["1057nowfm.com",145],["1057thebear.com",145],["1057thex.com",145],["1057thexrocks.com",145],["1061theunderground.com",145],["1063spinfm.com",145],["1063thevibe.com",145],["1063wovo.com",145],["1065theticket.com",145],["1067thekrewe.com",145],["106x.com",145],["1070wnct.com",145],["1071bobfm.com",145],["1071thepeak.com",145],["1071thepoint.com",145],["1073wsjy.com",145],["1075nowfm.com",145],["1075thegame.com",145],["1077lakefm.com",145],["1077thebone.com",145],["1077theisland.com",145],["1079nashicon.com",145],["107countrypsk.com",145],["107nashicon.com",145],["1090kaay.com",145],["1220wkrs.com",145],["1230espnsports.com",145],["1230theteam.com",145],["1280wnam.com",145],["1290wlby.com",145],["1320thefan.com",145],["1340wmsa.com",145],["1430wcmy.com",145],["1450kven.com",145],["1480kyos.com",145],["1490wosh.com",145],["1510kga.com",145],["1590walg.com",145],["1620thezone.com",145],["1700thechamp.com",145],["2hoursmattpinfield.com",145],["600wrqx.com",145],["600wsom.com",145],["610knml.com",145],["630wpro.com",145],["640wxsm.com",145],["660wxqw.com",145],["680thefan.com",145],["770kkob.com",145],["790business.com",145],["790wpic.com",145],["810whb.com",145],["860kkat.com",145],["860utahsbigtalker.com",145],["900theticket.com",145],["921theticket.com",145],["923krst.com",145],["923thewolf.com",145],["925nashicon.com",145],["925thebear.com",145],["925thewolf.com",145],["927bobfm.com",145],["929peakfm.com",145],["929thewave.com",145],["929wbpm.com",145],["92kqrs.com",145],["92profm.com",145],["92qnashville.com",145],["931nashicon.com",145],["931thebeat.com",145],["933nashicon.com",145],["935nashfm.com",145],["935wrqn.com",145],["937nashicon.com",145],["937nowfm.com",145],["937themountain.com",145],["939northpoleradio.com",145],["939theville.com",145],["939xindy.com",145],["93q.com",145],["93wkct.com",145],["93x.com",145],["940wfaw.com",145],["941ksky.com",145],["941thebear.com",145],["941thehits.com",145],["945thedrive.com",145],["945thehawkradio.com",145],["947qdr.com",145],["947wls.com",145],["949kcmo.com",145],["949radiojondeek.com",145],["949starcountry.com",145],["949theoutlaw.com",145],["94rockradio.net",145],["951nashfm.com",145],["951kbby.com",145],["953hlf.com",145],["953thebeach.com",145],["953thescore.com",145],["955bobfm.com",145],["955glo.com",145],["955nashicon.com",145],["955thefan.com",145],["955thevibe.com",145],["957kboy.com",145],["957kpur.com",145],["957nashicon.com",145],["957thevibe.com",145],["957thewolfonline.com",145],["959therocket.com",145],["95sx.com",145],["95wiil.com",145],["95x.com",145],["961bbb.com",145],["961jamz.com",145],["961sox.com",145],["961wsox.com",145],["963nashicon.com",145],["963thezone.com",145],["963wdvd.com",145],["967shinefm.com",145],["969lacaliente.com",145],["969thewolf.com",145],["96key.com",145],["96kzel.com",145],["973eagle.com",145],["973nashfm.com",145],["975kabx.com",145],["975thevibe.com",145],["975wabd.com",145],["979nashfm.com",145],["979espnradio.com",145],["979nashicon.com",145],["979wvok.com",145],["979x.com",145],["97bht.com",145],["97rock.com",145],["980waav.com",145],["980wxlm.com",145],["981thebeat.com",145],["981themax.com",145],["981thevalley.com",145],["983nashicon.com",145],["983thekeg.com",145],["983vibe.com",145],["983wlcs.com",145],["985kissfm.net",145],["989magicfm.com",145],["989thebridge.com",145],["98theticket.com",145],["993kjoy.com",145],["995thejock.com",145],["995thewolf.com",145],["997cyk.com",145],["997cyk.org",145],["997kmjj.com",145],["997themix.com",145],["997wpro.com",145],["997wtn.com",145],["999thebuzz.com",145],["999thefoxrocks.com",145],["999thehawk.com",145],["99x.com",145],["kjmo.com",145],["nashfm100.com",145],["nashfm923krst.com",145],["nashfm1033.com",145],["nashfm1055.com",145],["nashfm929.com",145],["nashfm931.com",145],["nashfm941.com",145],["nashfm949.com",145],["nashfm981.com",145],["nashfmwisconsin.com",145],["nashicon989.com",145],["v100rocks.com",145],["albanymagic.com",145],["alice1077.com",145],["allthehitsb951.com",145],["alt1019.com",145],["alt1049albany.com",145],["alt2k.com",145],["alt923.com",145],["alt98.com",145],["am630.net",145],["amarillosrockstation.com",145],["americanpatriotmedia.com",145],["annarbors107one.com",145],["atlantasrockstation.com",145],["atlsportsx.com",145],["b106fm.com",145],["b1073.com",145],["b95.com",145],["b979.net",145],["b98.com",145],["b985slo.com",145],["b987.com",145],["bakersfieldespn.com",145],["bakersfieldespnsports.com",145],["beach985.com",145],["beachboogieandblues.com",145],["bear104.com",145],["big1013.com",145],["bigcheese1079.com",145],["bigcountry1073.com",145],["bigdawg985.com",145],["bigdog1067.com",145],["bigfrog101.com",145],["bigfroggy1053.com",145],["bigtalk1490.com",145],["blairgarner.com",145],["blazin1023.com",145],["blazin923.com",145],["bloomingtonhits.com",145],["bobfmspringfield.com",145],["bowlinggreensam.com",145],["bull973.com",145],["bxr.com",145],["caperadio1550.com",145],["catcountry.com",145],["catcountry96.com",145],["catcountryvermont.com",145],["cbssports1430.com",145],["cbssportserie.com",145],["cbssportsharrisburg.com",145],["cbssportsradio1430.com",145],["chicothunderheads.com",145],["christmas989.com",145],["ckrv.com",145],["classicfox.com",145],["classichits1033.com",145],["classichitsmy1059.com",145],["classichitswnyq.com",145],["classy100.com",145],["coast1013.com",145],["coast973.com",145],["country105fm.net",145],["countrycountdownusa.com",145],["countrylegends1059.com",145],["countrymi.com",145],["coyote1025.com",145],["cumulusdigital.com",145],["digitalsolutions201.com",145],["e93fm.com",145],["eagle97.com",145],["eagle993.com",145],["easy991.com",145],["ed.fm",145],["elizabethtownradio.com",145],["energy939indy.com",145],["espn1320columbia.com",145],["espn910.com",145],["espnhonolulu.com",145],["espnlouisville.com",145],["espnlv.com",145],["espnradio1280.com",145],["espnradio927.com",145],["espnradio941.com",145],["espnsyracuse.com",145],["espnur.com",145],["espnwestpalm.com",145],["espnwilmington.com",145],["fly92.com",145],["fly923.com",145],["fm102milwaukee.com",145],["fm102one.com",145],["fonzfm.com",145],["forevereaston.com",145],["forevermediayork.com",145],["fox969.com",145],["foxcincinnati.com",145],["foxsportsredding.com",145],["froggy1003.com",145],["froggy101fm.com",145],["froggy981.com",145],["froggy99.net",145],["froggycountry.net",145],["froggyland.com",145],["fuego1029.com",145],["fun1013.com",145],["fun969fm.com",145],["generations1023.com",145],["glory985.com",145],["go106.com",145],["goradioheartland.com",145],["gospel900.com",145],["gulf104.com",145],["heaven1460.com",145],["heaven983.com",145],["hitkicker997.com",145],["hitpage.com",145],["hits931fm.com",145],["hits96.com",145],["hits965.com",145],["hot1005.com",145],["hot100blono.com",145],["hot100nrv.com",145],["hot101.com",145],["hot102.net",145],["hot1033.com",145],["hot1039.com",145],["hot1047fm.com",145],["hot1057.com",145],["hot1063.com",145],["hot1067fm.com",145],["hot1067pa.com",145],["hot1077radio.com",145],["hot92and100.com",145],["hot933hits.com",145],["hot941.com",145],["hot967fm.com",145],["hvradionet.com",145],["i973hits.com",145],["ilovethehits.com",145],["indysmix.com",145],["jammin999fm.com",145],["jamz963.com",145],["jox2fm.com",145],["joxfm.com",145],["k100country.com",145],["k104online.com",145],["k105country.com",145],["k92radio.com",145],["k983.com",145],["kabc.com",145],["kaok.com",145],["kaperadio1550.com",145],["katm.com",145],["katt.com",145],["kbcy.com",145],["kber.com",145],["kboi.com",145],["kbul.com",145],["kbull93.com",145],["kcchiefsradio.com",145],["kcheradio.com",145],["kcmotalkradio.com",145],["kcmxam.com",145],["kennradio.com",145],["kernradio.com",145],["kesn1033.com",145],["key101fm.com",145],["kfru.com",145],["kftx.com",145],["kgfm.com",145],["kgfw.com",145],["kggo.com",145],["kgmo.com",145],["kgoradio.com",145],["khay.com",145],["khfm.com",145],["khfm.org",145],["khit1075.com",145],["khop.com",145],["khvl.com",145],["kiimfm.com",145],["kiss-1031.com",145],["kix1029.com",145],["kix106.com",145],["kix96.com",145],["kizn.com",145],["kjjy.com",145],["kjoy.com",145],["kkcy.com",145],["kkfm.com",145],["kkgb.com",145],["kkgl.com",145],["kkoh.com",145],["klif.com",145],["klik1240.com",145],["klin.com",145],["klur.com",145],["kmaj.com",145],["kmaj1440.com",145],["kmez1029.com",145],["kmjnow.com",145],["knbr.com",145],["knek.com",145],["kobfm.com",145],["kpla.com",145],["kpur107.com",145],["kqfc.com",145],["kqky.com",145],["kqms.com",145],["kqxy.com",145],["krbe.com",145],["krmd.com",145],["krny.com",145],["krrq.com",145],["krush925.com",145],["kruz1033.com",145],["ksam1017.com",145],["kscrhits.com",145],["kscs.com",145],["ksfo.com",145],["kshasta.com",145],["ksks.com",145],["ksmb.com",145],["ktcx.com",145],["ktik.com",145],["ktop1490.com",145],["ktucam.com",145],["kubaradio.com",145],["kubb.com",145],["kugn.com",145],["kuzz.com",145],["kuzzradio.com",145],["kvor.com",145],["kwin.com",145],["kwwr.com",145],["kxel.com",145],["kxzz1580am.com",145],["kyis.com",145],["kykz.com",145],["kzwafm.com",145],["la103.com",145],["laindomable.com",145],["laleync.com",145],["lanuevaomaha.com",145],["lite102.com",145],["literock105fm.com",145],["love105fm.com",145],["lvfoxsports.com",145],["magic1029fm.com",145],["magic1039fm.com",145],["magic1069.com",145],["magic1073.com",145],["magic1073fm.com",145],["magic93fm.com",145],["magic943fm.com",145],["magic979wtrg.com",145],["magic995abq.com",145],["majic97monroe.com",145],["majicspace.com",145],["maverick1023.com",145],["max94one.com",145],["maxrocks.net",145],["mega979.com",145],["mgeradio.com",145],["milwaukeesparty.com",145],["mix103.com",145],["mix1077albany.com",145],["mix965.net",145],["modernrock987.com",145],["montanassuperstation.com",145],["movin993.com",145],["muskegonnashicon.com",145],["my1059.com",145],["my961.com",145],["myblono.com",145],["mycolumbiabasin.com",145],["myfroggy95.com",145],["mykiss973.com",145],["mymagic106.com",145],["mymix1051.com",145],["mymix1061.com",145],["mymix961.com",145],["mystar98.com",145],["nashcountrydaily.com",145],["nashdetroit.com",145],["nashfm1007.com",145],["nashfm1011.com",145],["nashfm1017.com",145],["nashfm1025.com",145],["nashfm1027.com",145],["nashfm1061.com",145],["nashfm1065.com",145],["nashfm923.com",145],["nashfm937.com",145],["nashfm943.com",145],["nashfm951.com",145],["nashfm973.com",145],["nashfm991.com",145],["nashfmgreenbay.com",145],["nashfmsjo.com",145],["nashnightslive.net",145],["nashpensacola.com",145],["ncsportsradio.com",145],["nepasespnradio.com",145],["neuhoffmedia.com",145],["neuhoffmedialafayette.com",145],["newcountry963.com",145],["newsradio1029.com",145],["newsradio1440.com",145],["newsradioflorida.com",145],["newsradiokkob.com",145],["newsserver1.com",145],["newsserver2.com",145],["newsserver3.com",145],["newstalk1030.com",145],["newstalk1290koil.com",145],["newstalk730.com",145],["newstalk987.com",145],["newstalkwsba.com",145],["newswebradiocompany.net",145],["now937.com",145],["nrgmedia.com",145],["nrq.com",145],["og979.com",145],["okiecountry1017.com",145],["oldiesz104.com",145],["ottawaradio.net",145],["pensacolasjet.com",145],["peorias923.com",145],["picklefm.com",145],["pikefm.com",145],["planet1067.com",145],["pmbbroadcasting.com",145],["pmbradio.com",145],["power1021.com",145],["power103.com",145],["power1057.com",145],["power1069fm.com",145],["power923.com",145],["power94radio.com",145],["power955.com",145],["powerhits95.com",145],["powerslc.com",145],["praise1025fm.com",145],["purerock96.com",145],["q1005.com",145],["q1031fm.com",145],["q105.fm",145],["q1055.com",145],["q1061.com",145],["q106dot5.com",145],["q973radio.com",145],["q97country.com",145],["q98fm.com",145],["q997atlanta.com",145],["q99fm.com",145],["radio1039ny.com",145],["radiorockriver.com",145],["radiowoodstock.com",145],["realcountry1280whvr.com",145],["realcountryhv.com",145],["red1031.com",145],["red945.com",145],["rewind1019.com",145],["rickandsasha.com",145],["rock101.net",145],["rock1015.com",145],["rock103albany.com",145],["rock103rocks.com",145],["rock106.net",145],["rock107fm.com",145],["rock108.com",145],["rock945vt.com",145],["rockdaily.com",145],["rocknews.com",145],["rockofsavannah.com",145],["rockofsavannah.net",145],["softrock941.com",145],["southernillinoisnow.com",145],["southernsportstoday.com",145],["sportsanimal920.com",145],["sportsanimalabq.com",145],["sportscapitoldc.com",145],["sportshubtriad.com",145],["sportsradio1270.com",145],["sportsradio1440.com",145],["sportsradio1560.com",145],["sportsradio590am.com",145],["sportsradio740.com",145],["sportsradio967.com",145],["sportsradio970.com",145],["sportsradiobeaumont.com",145],["sportsradioberks.com",145],["sportsradiownml.com",145],["star98.net",145],["starfm1023.com",145],["starsplash.com",145],["stevegormanrocks.com",145],["sunny1031.com",145],["sunny1069fm.com",145],["sunny923.com",145],["sunny983.com",145],["sunnymuskegon.com",145],["supertalk1570.com",145],["sweet985.com",145],["talk104fm.com",145],["talk995.com",145],["talkradio1007.com",145],["tbhpod.com",145],["teammyrtlebeach.com",145],["test107.com",145],["thebear925.com",145],["thebigjab.com",145],["thebigstation93blx.com",145],["theblairgarnershow.com",145],["theconclave.com",145],["thefan1075.com",145],["thefanfm.com",145],["thegame541.com",145],["thehippo.com",145],["thehot1039.com",145],["thenewhotfm.com",145],["thenewpulsefm.com",145],["thepointontheweb.com",145],["therebelrocks.com",145],["therocket951.com",145],["therockstationz93.com",145],["thescore1260.com",145],["thesportsanimal.com",145],["theticket.com",145],["theticket1007.com",145],["theticket102.com",145],["theticket1590.com",145],["theticketmi.com",145],["thetybentlishow.com",145],["thevalley981.com",145],["thewolf1051.com",145],["thewolf951.com",145],["thisisqmusic.com",145],["thunder1073.com",145],["triadsports.com",145],["tuligaradio.com",145],["umpsports.com",145],["v100fm.com",145],["v1033.com",145],["vermilioncountyfirst.com",145],["vermillioncountyfirst.com",145],["w3dcountry.com",145],["w4country.com",145],["wa1a.com",145],["wabcradio.com",145],["walk975.com",145],["walkradio.com",145],["warm1033.com",145],["warm98.com",145],["waysam.com",145],["wbap.com",145],["wbbw.com",145],["wbmq.net",145],["wbnq.com",145],["wbpm929.com",145],["wbpmfm.com",145],["wbwn.com",145],["wcbm.com",145],["wceiradio.com",145],["wcfx.com",145],["wchv.com",145],["wclg.com",145],["wcoapensacola.com",145],["wcpqfm.com",145],["wcpt820.com",145],["wcpt820.net",145],["wcpt820am.com",145],["wcpt820am.net",145],["wcptam.com",145],["wcptam.net",145],["wcptamfm.com",145],["wcptamfm.net",145],["wcptamfm.org",145],["wcpyfm.com",145],["wctk.com",145],["wddoam.com",145],["wden.com",145],["wdml.com",145],["wdst.com",145],["wdst.org",145],["wdzz.com",145],["wedg.com",145],["werkfm.net",145],["werkradio.com",145],["wfasam.com",145],["wfav951.com",145],["wfmd.com",145],["wfms.com",145],["wfnc640am.com",145],["wfre.com",145],["wftw.com",145],["wgh1310.com",145],["wghsolidgold.com",145],["wglx.com",145],["wgni.com",145],["wgow.com",145],["wgowam.com",145],["wgrr.com",145],["whdg.com",145],["wheelz1045.com",145],["whli.com",145],["whrpfm.com",145],["whtt.com",145],["whud.com",145],["wild1029.com",145],["wild1049hd.com",145],["wild1061.com",145],["wild993fm.com",145],["wildcatsradio1290.com",145],["wink104.com",145],["winxfm.com",145],["wiog.com",145],["wiov.com",145],["wiov985.com",145],["wivk.com",145],["wivr1017.com",145],["wizn.com",145],["wjbc.com",145],["wjcw.com",145],["wjez.com",145],["wjjr.net",145],["wjoxam.com",145],["wjr.com",145],["wkav.com",145],["wkbethepoint.com",145],["wkga975.com",145],["wkhx.com",145],["wkmoradio.com",145],["wkol.com",145],["wkrs.com",145],["wkrufm.com",145],["wksm.com",145],["wkydeportes.com",145],["wlaq1410.com",145],["wlav.com",145],["wlbc.com",145],["wlevradio.com",145],["wlkwradio.com",145],["wlok.com",145],["wlsam.com",145],["wlum.com",145],["wlup.com",145],["wlwi.com",145],["wmac-am.com",145],["wmal.com",145],["wmqa.com",145],["wncv.com",145],["wogb.fm",145],["woko.com",145],["womg.com",145],["woodstockbroadcasting.com",145],["woodstockcommunication.com",145],["woodstockradio.net",145],["woodstocktv.net",145],["wovo1063.com",145],["wovofm.com",145],["wqut.com",145],["wqvealbany.com",145],["wrganews.com",145],["wrgm.com",145],["wrlo.com",145],["wrr101.com",145],["wrul.com",145],["wsba910.com",145],["wsfl.com",145],["wsjssports.com",145],["wskz.com",145],["wsyb1380am.com",145],["wtka.com",145],["wtma.com",145],["wtrxsports.com",145],["wttlradio.com",145],["wuuqradio.com",145],["wvel.com",145],["wvli927.com",145],["wvlkam.com",145],["wvnn.com",145],["wwck.com",145],["wwki.com",145],["wwqq101.com",145],["wxfx.com",145],["wxkr.com",145],["wxpkfm.com",145],["wynn1063.com",145],["wzpl.com",145],["wzyp.com",145],["wzzl.com",145],["x1051kc.com",145],["x95radio.com",145],["xs961.com",145],["xtrasports1300.com",145],["y-103.com",145],["y101hits.com",145],["y102montgomery.com",145],["y1065.com",145],["yesfm.net",145],["z1023online.com",145],["z1029.com",145],["z1075.com",145],["z937.com",145],["z93jamz.com",145],["z96.com",145],["z971.com",145],["zone1150.com",145],["zrock103.com",145],["zrockfm.com",145],["windows101tricks.com",146],["waaw.tv",147],["hqq.tv",[147,148]],["fontsfree.pro",149],["radarbox.com",151],["adslayuda.com",152],["avdelphi.com",153],["4x4earth.com",65],["jootc.com",[155,156]],["photobank.mainichi.co.jp",157],["tbs.co.jp",158],["sovetromantica.com",160],["longecity.org",161],["magnet-novels.com",162],["torrentlawyer.com",[162,168,174,175]],["fruit01.xyz",163],["lyricstranslate.com",165],["hardcoregames.ca",166],["allsmo.com",166],["themosvagas.com.br",166],["urbharat.xyz",166],["sportnews.to",[166,177]],["2embed.ru",167],["sbasian.pro",167],["miraculous.to",[167,188]],["vtplayer.net",167],["pepperlive.info",167],["unbiasedsenseevent.com",167],["maxt.church",167],["cool-etv.net",167],["vgembed.com",[167,221]],["szkolawohyn.pl",168],["virpe.cc",168],["gmarket.co.kr",[168,175]],["paesifantasma.it",169],["talpo.it",169],["pbinfo.ro",170],["quora.com",171],["girlscene.nl",173],["youmath.it",176],["renditepassive.net",[178,179,180,181,182]],["360doc.com",183],["logonews.cn",184],["thetodaypost.com",[185,190,195]],["cloudcomputingtopics.net",185],["0123movies.ch",[185,190,195,225]],["epn.bz",62],["affbank.com",26],["gardenia.net",[186,187]],["novelpia.com",[189,190]],["blueraindrops.com",192],["vidembed.me",193],["mzzcloud.life",193],["videobot.stream",193],["player.tabooporns.com",193],["justswallows.net",193],["onscreensvideo.com",193],["katerionews.com",193],["telenovelas-turcas.com.es",193],["kmo.to",193],["jeniusplay.com",[193,227]],["animecruzers.com",194],["descargatepelis.com",195],["news.ntv.co.jp",195],["bestjavporn.com",196],["mm9841.cc",196],["ggwash.org",[197,198]],["cinegrabber.com",201],["layarkacaxxi.icu",202],["readawrite.com",[203,204,205,206,207,208,209]],["dropgalaxy.com",210],["morosedog.gitlab.io",211],["indianhealthyrecipes.com",213],["tarnkappe.info",214],["phimz.org",215],["heavyfetish.com",216],["joysound.com",[217,218,219]],["colors.sonicthehedgehog.com",[219,222]],["leakedzone.com",223],["mehoathinh2.com",224],["powerline.io",226],["bestx.stream",228],["enduro-mtb.com",229],["kukaj.io",230],["animesaga.in",231]]);

const entitiesMap = new Map([["18comic",14],["earnload",142],["hindipix",[147,148]],["www.google",164],["123movies",167],["brainly",191],["videovard",193],["ask4movie",[199,200]],["bluemediafile",220]]);

const exceptionsMap = new Map([["m.rp5.ru",[86]],["m.rp5.by",[86]],["m.rp5.kz",[86]],["m.rp5.co.uk",[86]],["m.rp5.md",[86]]]);

/******************************************************************************/

function setConstant(
    ...args
) {
    setConstantCore(false, ...args);
}

function setConstantCore(
    trusted = false,
    arg1 = '',
    arg2 = '',
    arg3 = ''
) {
    const details = typeof arg1 !== 'object'
        ? { prop: arg1, value: arg2 }
        : arg1;
    if ( arg3 !== '' ) {
        if ( /^\d$/.test(arg3) ) {
            details.options = [ arg3 ];
        } else {
            details.options = Array.from(arguments).slice(3);
        }
    }
    const { prop: chain = '', value: cValue = '' } = details;
    if ( typeof chain !== 'string' ) { return; }
    if ( chain === '' ) { return; }
    const options = details.options || [];
    const safe = safeSelf();
    function setConstant(chain, cValue) {
        const trappedProp = (( ) => {
            const pos = chain.lastIndexOf('.');
            if ( pos === -1 ) { return chain; }
            return chain.slice(pos+1);
        })();
        if ( trappedProp === '' ) { return; }
        const thisScript = document.currentScript;
        const cloakFunc = fn => {
            safe.Object_defineProperty(fn, 'name', { value: trappedProp });
            const proxy = new Proxy(fn, {
                defineProperty(target, prop) {
                    if ( prop !== 'toString' ) {
                        return Reflect.defineProperty(...arguments);
                    }
                    return true;
                },
                deleteProperty(target, prop) {
                    if ( prop !== 'toString' ) {
                        return Reflect.deleteProperty(...arguments);
                    }
                    return true;
                },
                get(target, prop) {
                    if ( prop === 'toString' ) {
                        return function() {
                            return `function ${trappedProp}() { [native code] }`;
                        }.bind(null);
                    }
                    return Reflect.get(...arguments);
                },
            });
            return proxy;
        };
        if ( cValue === 'undefined' ) {
            cValue = undefined;
        } else if ( cValue === 'false' ) {
            cValue = false;
        } else if ( cValue === 'true' ) {
            cValue = true;
        } else if ( cValue === 'null' ) {
            cValue = null;
        } else if ( cValue === "''" || cValue === '' ) {
            cValue = '';
        } else if ( cValue === '[]' ) {
            cValue = [];
        } else if ( cValue === '{}' ) {
            cValue = {};
        } else if ( cValue === 'noopFunc' ) {
            cValue = cloakFunc(function(){});
        } else if ( cValue === 'trueFunc' ) {
            cValue = cloakFunc(function(){ return true; });
        } else if ( cValue === 'falseFunc' ) {
            cValue = cloakFunc(function(){ return false; });
        } else if ( /^-?\d+$/.test(cValue) ) {
            cValue = parseInt(cValue);
            if ( isNaN(cValue) ) { return; }
            if ( Math.abs(cValue) > 0x7FFF ) { return; }
        } else if ( trusted ) {
            if ( cValue.startsWith('{') && cValue.endsWith('}') ) {
                try { cValue = safe.jsonParse(cValue).value; } catch(ex) { return; }
            }
        } else {
            return;
        }
        if ( options.includes('asFunction') ) {
            cValue = ( ) => cValue;
        } else if ( options.includes('asCallback') ) {
            cValue = ( ) => (( ) => cValue);
        } else if ( options.includes('asResolved') ) {
            cValue = Promise.resolve(cValue);
        } else if ( options.includes('asRejected') ) {
            cValue = Promise.reject(cValue);
        }
        let aborted = false;
        const mustAbort = function(v) {
            if ( trusted ) { return false; }
            if ( aborted ) { return true; }
            aborted =
                (v !== undefined && v !== null) &&
                (cValue !== undefined && cValue !== null) &&
                (typeof v !== typeof cValue);
            return aborted;
        };
        // https://github.com/uBlockOrigin/uBlock-issues/issues/156
        //   Support multiple trappers for the same property.
        const trapProp = function(owner, prop, configurable, handler) {
            if ( handler.init(configurable ? owner[prop] : cValue) === false ) { return; }
            const odesc = Object.getOwnPropertyDescriptor(owner, prop);
            let prevGetter, prevSetter;
            if ( odesc instanceof Object ) {
                owner[prop] = cValue;
                if ( odesc.get instanceof Function ) {
                    prevGetter = odesc.get;
                }
                if ( odesc.set instanceof Function ) {
                    prevSetter = odesc.set;
                }
            }
            try {
                safe.Object_defineProperty(owner, prop, {
                    configurable,
                    get() {
                        if ( prevGetter !== undefined ) {
                            prevGetter();
                        }
                        return handler.getter(); // cValue
                    },
                    set(a) {
                        if ( prevSetter !== undefined ) {
                            prevSetter(a);
                        }
                        handler.setter(a);
                    }
                });
            } catch(ex) {
            }
        };
        const trapChain = function(owner, chain) {
            const pos = chain.indexOf('.');
            if ( pos === -1 ) {
                trapProp(owner, chain, false, {
                    v: undefined,
                    init: function(v) {
                        if ( mustAbort(v) ) { return false; }
                        this.v = v;
                        return true;
                    },
                    getter: function() {
                        return document.currentScript === thisScript
                            ? this.v
                            : cValue;
                    },
                    setter: function(a) {
                        if ( mustAbort(a) === false ) { return; }
                        cValue = a;
                    }
                });
                return;
            }
            const prop = chain.slice(0, pos);
            const v = owner[prop];
            chain = chain.slice(pos + 1);
            if ( v instanceof Object || typeof v === 'object' && v !== null ) {
                trapChain(v, chain);
                return;
            }
            trapProp(owner, prop, true, {
                v: undefined,
                init: function(v) {
                    this.v = v;
                    return true;
                },
                getter: function() {
                    return this.v;
                },
                setter: function(a) {
                    this.v = a;
                    if ( a instanceof Object ) {
                        trapChain(a, chain);
                    }
                }
            });
        };
        trapChain(window, chain);
    }
    runAt(( ) => {
        setConstant(chain, cValue);
    }, options);
}

function runAt(fn, when) {
    const intFromReadyState = state => {
        const targets = {
            'loading': 1,
            'interactive': 2, 'end': 2, '2': 2,
            'complete': 3, 'idle': 3, '3': 3,
        };
        const tokens = Array.isArray(state) ? state : [ state ];
        for ( const token of tokens ) {
            const prop = `${token}`;
            if ( targets.hasOwnProperty(prop) === false ) { continue; }
            return targets[prop];
        }
        return 0;
    };
    const runAt = intFromReadyState(when);
    if ( intFromReadyState(document.readyState) >= runAt ) {
        fn(); return;
    }
    const onStateChange = ( ) => {
        if ( intFromReadyState(document.readyState) < runAt ) { return; }
        fn();
        safe.removeEventListener.apply(document, args);
    };
    const safe = safeSelf();
    const args = [ 'readystatechange', onStateChange, { capture: true } ];
    safe.addEventListener.apply(document, args);
}

function safeSelf() {
    if ( scriptletGlobals.has('safeSelf') ) {
        return scriptletGlobals.get('safeSelf');
    }
    const safe = {
        'Error': self.Error,
        'Object_defineProperty': Object.defineProperty.bind(Object),
        'RegExp': self.RegExp,
        'RegExp_test': self.RegExp.prototype.test,
        'RegExp_exec': self.RegExp.prototype.exec,
        'addEventListener': self.EventTarget.prototype.addEventListener,
        'removeEventListener': self.EventTarget.prototype.removeEventListener,
        'fetch': self.fetch,
        'jsonParse': self.JSON.parse.bind(self.JSON),
        'jsonStringify': self.JSON.stringify.bind(self.JSON),
        'log': console.log.bind(console),
        uboLog(...args) {
            if ( args.length === 0 ) { return; }
            if ( `${args[0]}` === '' ) { return; }
            this.log('[uBO]', ...args);
        },
        initPattern(pattern, options = {}) {
            if ( pattern === '' ) {
                return { matchAll: true };
            }
            const expect = (options.canNegate === true && pattern.startsWith('!') === false);
            if ( expect === false ) {
                pattern = pattern.slice(1);
            }
            const match = /^\/(.+)\/([gimsu]*)$/.exec(pattern);
            if ( match !== null ) {
                return {
                    pattern,
                    re: new this.RegExp(
                        match[1],
                        match[2] || options.flags
                    ),
                    expect,
                };
            }
            return {
                pattern,
                re: new this.RegExp(pattern.replace(
                    /[.*+?^${}()|[\]\\]/g, '\\$&'),
                    options.flags
                ),
                expect,
            };
        },
        testPattern(details, haystack) {
            if ( details.matchAll ) { return true; }
            return this.RegExp_test.call(details.re, haystack) === details.expect;
        },
        patternToRegex(pattern, flags = undefined) {
            if ( pattern === '' ) { return /^/; }
            const match = /^\/(.+)\/([gimsu]*)$/.exec(pattern);
            if ( match === null ) {
                return new RegExp(pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), flags);
            }
            try {
                return new RegExp(match[1], match[2] || flags);
            }
            catch(ex) {
            }
            return /^/;
        },
        getExtraArgs(args, offset = 0) {
            const entries = args.slice(offset).reduce((out, v, i, a) => {
                if ( (i & 1) === 0 ) {
                    const rawValue = a[i+1];
                    const value = /^\d+$/.test(rawValue)
                        ? parseInt(rawValue, 10)
                        : rawValue;
                    out.push([ a[i], value ]);
                }
                return out;
            }, []);
            return Object.fromEntries(entries);
        },
    };
    scriptletGlobals.set('safeSelf', safe);
    return safe;
}

/******************************************************************************/

const hnParts = [];
try { hnParts.push(...document.location.hostname.split('.')); }
catch(ex) { }
const hnpartslen = hnParts.length;
if ( hnpartslen === 0 ) { return; }

const todoIndices = new Set();
const tonotdoIndices = [];

// Exceptions
if ( exceptionsMap.size !== 0 ) {
    for ( let i = 0; i < hnpartslen; i++ ) {
        const hn = hnParts.slice(i).join('.');
        const excepted = exceptionsMap.get(hn);
        if ( excepted ) { tonotdoIndices.push(...excepted); }
    }
    exceptionsMap.clear();
}

// Hostname-based
if ( hostnamesMap.size !== 0 ) {
    const collectArgIndices = hn => {
        let argsIndices = hostnamesMap.get(hn);
        if ( argsIndices === undefined ) { return; }
        if ( typeof argsIndices === 'number' ) { argsIndices = [ argsIndices ]; }
        for ( const argsIndex of argsIndices ) {
            if ( tonotdoIndices.includes(argsIndex) ) { continue; }
            todoIndices.add(argsIndex);
        }
    };
    for ( let i = 0; i < hnpartslen; i++ ) {
        const hn = hnParts.slice(i).join('.');
        collectArgIndices(hn);
    }
    collectArgIndices('*');
    hostnamesMap.clear();
}

// Entity-based
if ( entitiesMap.size !== 0 ) {
    const n = hnpartslen - 1;
    for ( let i = 0; i < n; i++ ) {
        for ( let j = n; j > i; j-- ) {
            const en = hnParts.slice(i,j).join('.');
            let argsIndices = entitiesMap.get(en);
            if ( argsIndices === undefined ) { continue; }
            if ( typeof argsIndices === 'number' ) { argsIndices = [ argsIndices ]; }
            for ( const argsIndex of argsIndices ) {
                if ( tonotdoIndices.includes(argsIndex) ) { continue; }
                todoIndices.add(argsIndex);
            }
        }
    }
    entitiesMap.clear();
}

// Apply scriplets
for ( const i of todoIndices ) {
    try { setConstant(...argsList[i]); }
    catch(ex) {}
}
argsList.length = 0;

/******************************************************************************/

};
// End of code to inject

/******************************************************************************/

// Inject code

// https://bugzilla.mozilla.org/show_bug.cgi?id=1736575
//   `MAIN` world not yet supported in Firefox, so we inject the code into
//   'MAIN' ourself when enviroment in Firefox.

// Not Firefox
if ( typeof wrappedJSObject !== 'object' ) {
    return uBOL_setConstant();
}

// Firefox
{
    const page = self.wrappedJSObject;
    let script, url;
    try {
        page.uBOL_setConstant = cloneInto([
            [ '(', uBOL_setConstant.toString(), ')();' ],
            { type: 'text/javascript; charset=utf-8' },
        ], self);
        const blob = new page.Blob(...page.uBOL_setConstant);
        url = page.URL.createObjectURL(blob);
        const doc = page.document;
        script = doc.createElement('script');
        script.async = false;
        script.src = url;
        (doc.head || doc.documentElement || doc).append(script);
    } catch (ex) {
        console.error(ex);
    }
    if ( url ) {
        if ( script ) { script.remove(); }
        page.URL.revokeObjectURL(url);
    }
    delete page.uBOL_setConstant;
}

/******************************************************************************/

// End of local scope
})();

/******************************************************************************/

void 0;
