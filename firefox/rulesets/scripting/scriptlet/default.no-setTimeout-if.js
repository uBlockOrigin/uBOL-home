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

/* jshint esversion:11 */
/* global cloneInto */

'use strict';

// ruleset: default

/******************************************************************************/

// Important!
// Isolate from global scope

// Start of local scope
(( ) => {

/******************************************************************************/

// Start of code to inject
const uBOL_noSetTimeoutIf = function() {

const scriptletGlobals = {}; // jshint ignore: line

const argsList = [[".call(null)","10"],[".call(null)"],["(null)","10"],["userHasAdblocker"],["objSubPromo"],["adb"],["nrWrapper"],["warn"],["adBlockerDetected"],["show"],["InfMediafireMobileFunc","1000"],["google_jobrunner"],["()","45000"],["0x"],["displayAdBlockedVideo"],[".adsbygoogle"],["location.href"],["isDesktopApp","1000"],["Bait"],["admc"],["AdBlocker"],["Blocked"],["ai_adb"],["match","100"],["'0x"],["apstagLOADED"],["/Adb|moneyDetect/"],["disableDeveloper"],["Blocco","2000"],["test","0"],["checkAdblockUser","1000"],["checkPub","6000"],["document.querySelector","5000"],["nextFunction","250"],["popup"],["()","150"],["backRedirect"],["document.querySelectorAll","1000"],["style"],["clientHeight"],["addEventListener","0"],["adblock","2000"],["start","0"],["nextFunction","2000"],["byepopup","5000"],["test.remove","100"],["additional_src","300"],["()","2000"],["css_class.show"],["CANG","3000"],["updato-overlay","500"],["innerText","2000"],["alert","8000"],["css_class"],["()","50"],["debugger"],["initializeCourier","3000"],["redirectPage"],["_0x","2000"],["ads","750"],["location.href","500"],["Adblock","5000"],["disable","200"],["CekAab","0"],["rbm_block_active","1000"],["show()"],["_0x"],["n.trigger","1"],["adblock"],["abDetected"],["KeepOpeningPops","1000"],["appendChild"],["adb","0"],["adBlocked"],["warning","100"],["adblock_popup","500"],["Adblock"],["#chatWrap","1000"],["keep-ads","2000"],["#rbm_block_active","1000"],["null","4000"],["()","2500"],["myaabpfun","3000"],["nextFunction"],["adFilled","2500"],["()","15000"],["showPopup"],["()","1"],["()","1000"],["document.cookie","2500"],["window.open"],["innerHTML"],["readyplayer","2000"],["checkStopBlock"],["adspot_top","1500"],["/offsetHeight|google|Global/"],["an_message","500"],["Adblocker","10000"],["timeoutChecker"],["bait","1"],["pum-open"],["overlay","2000"],["/adblock/i"],["test","100"],["Math.round","1000"],["adblock","5"],["bioEp"],["ag_adBlockerDetected"],["null"],["adb","6000"],["pop"],["sadbl"],["checkAdStatus"],["mdp"],["brave_load_popup"],["0x","3000"],["invoke"],["adsbytrafficjunkycontext"],["ipod"],["offsetWidth"],["/$|adBlock/"],["ads"],["adsbygoogle"],["()"],["AdBlock"],["stop-scrolling"],["Adv"],["blockUI","2000"],["mdpDeBlocker"],["/_0x|debug/"],["/ai_adb|_0x/"],["iframe"],["adBlock"],["","1"],["undefined"],["check","1"],["adsBlocked"],["blocker"],["aswift_"],["afs_ads","2000"],["visibility","2000"],["bait"],["getComputedStyle","250"],["blocked"],["{r()","0"],["nextFunction","450"],["Debug"],["r()","0"],["purple_box"],["offsetHeight"],["checkSiteNormalLoad"],["adBlockOverlay"],["Detected","500"],["modal"],[".show","1000"],[".show"],["showModal"],["getComputedStyle"],["blur"],["samOverlay"],["bADBlock"],["location"],["","4000"],["blocker","100"],["alert"],["length"],["t()","0"],["$"],["offset"],["contrformpub"],["trigger","0"],["getComputedStyle","2000"],["video-popup"],["detectAdblock"],["EzoIvent"],["detectAdBlocker"],["nads"],["1e3*"],["current.children"],["adStatus"],["BN_CAMPAIGNS"],["media_place_list"],["cvad"],["...","300"],["stackTrace"],["","5"],["/adblock|isRequestPresent/"],["_0x","500"],["isRequestPresent"],["offsetLeft"],["height"],["mdp_deblocker"],["charAt"],["checkAds"],["fadeIn","0"],["jQuery"],["/^/"],["afterOpen"],["check"],["Adblocker"],["eabdModal"],["ab_root.show"],["gaData"],["ad"],["prompt","1000"],["googlefc"],["adblock detection"],[".offsetHeight","100"],["popState"],["ad-block-popup"],["exitTimer"],["innerHTML.replace"],["ab","2000"],["data?","4000"],[".data?"],["eabpDialog"],["adsense"],["/Adblock|_ad_/"],["googletag"],["f.parentNode.removeChild(f)","100"],["swal","500"],["keepChecking","1000"],["openPopup"],[".offsetHeight"],["()=>{"],["nitroAds"],["class.scroll","1000"],["disableDeveloperTools"],["Check"],["insertBefore"],["css_class.scroll"],["/null|Error/","10000"],["window.location.href","50"],["/out.php"],["/0x|devtools/"],["location.replace","300"],["window.location.href"],["checkVisible"],["_0x","3000"],["fetch"],["window.location.href=link"],["ai_"],["reachGoal"],["Adb"],["ai"],["","3000"],["/width|innerHTML/"],["magnificPopup"],["adblockEnabled"],["google_ad"],["document.location"],["google"],["top-right","2000"],["enforceAdStatus"],["loadScripts"],["mfp"],["display","5000"],["eb"],[").show()"],["","1000"],["site-access"],["atob"],["Msg"],["UABP"],["href"],["aaaaa-modal"],["\\x63"],["()=>"],["keepChecking"],["null","10"],["","500"],["/Adform|didomi|adblock|forEach/"],["showAdblock"],["-0x"],["display"],["gclid"],["event","3000"],["rejectWith"],["refresh"],["location.href","3000"],["window.location"],["ga"],["adbl"],["Ads"],["ShowAdBLockerNotice"],["ad_listener"],["open"],["(!0)"],["Delay"],["/appendChild|e\\(\"/"],["=>"],["ADB"],["site-access-popup"],["data?"],["/debugger|UserCustomPop/"],["checkAdblockUser"],["offsetHeight","100"],["AdDetect"],["displayMessage","2000"],["/salesPopup|mira-snackbar/"],["advanced"],["detectImgLoad"],["offsetHeight","200"],["detector"],["replace"],["touchstart"],["siteAccessFlag"],["ab"],["/adblocker|alert/"],["redURL"],["/children\\('ins'\\)|Adblock|adsbygoogle/"],["displayMessage"],["chkADB"],["onDetected"],["myinfoey","1500"],["fuckadb"],["detect"],["siteAccessPopup"],["/adsbygoogle|adblock/"],["akadb"],["biteDisplay"],["/[a-z]\\(!0\\)/","800"],["ad_block"],["/detectAdBlocker|window.open/"],["adBlockDetected"],["popUnder"],["/GoToURL|delay/"],["window.location.href","300"],["ad_display"],["/adScriptPath|MMDConfig/"],["0x","100"],["/native|\\{n\\(\\)/"],["adblocker"],["/Detect|adblock|style\\.display|\\[native code]|\\.call\\(null\\)/"],["removeChild"],["ad blocker"]];

const hostnamesMap = new Map([["4-liga.com",0],["4fansites.de",0],["4players.de",0],["9monate.de",0],["aachener-nachrichten.de",0],["aachener-zeitung.de",0],["abendblatt.de",0],["abendzeitung-muenchen.de",0],["about-drinks.com",0],["abseits-ka.de",0],["airliners.de",0],["ajaxshowtime.com",0],["allgemeine-zeitung.de",0],["alpin.de",0],["antenne.de",0],["arcor.de",0],["areadvd.de",0],["areamobile.de",0],["ariva.de",0],["astronews.com",0],["aussenwirtschaftslupe.de",0],["auszeit.bio",0],["auto-motor-und-sport.de",0],["auto-service.de",0],["autobild.de",0],["autoextrem.de",0],["autopixx.de",0],["autorevue.at",0],["az-online.de",0],["baby-vornamen.de",0],["babyclub.de",0],["bafoeg-aktuell.de",0],["berliner-kurier.de",0],["berliner-zeitung.de",0],["bigfm.de",0],["bikerszene.de",0],["bildderfrau.de",0],["blackd.de",0],["blick.de",0],["boerse-online.de",0],["boerse.de",0],["boersennews.de",0],["braunschweiger-zeitung.de",0],["brieffreunde.de",0],["brigitte.de",0],["buerstaedter-zeitung.de",0],["buffed.de",0],["businessinsider.de",0],["buzzfeed.at",0],["buzzfeed.de",0],["caravaning.de",0],["cavallo.de",0],["chefkoch.de",0],["cinema.de",0],["clever-tanken.de",0],["computerbild.de",0],["computerhilfen.de",0],["comunio-cl.com",0],["connect.de",0],["chip.de",0],["da-imnetz.de",0],["dasgelbeblatt.de",0],["dbna.com",0],["dbna.de",0],["deichstube.de",0],["deine-tierwelt.de",0],["der-betze-brennt.de",0],["derwesten.de",0],["desired.de",0],["dhd24.com",0],["dieblaue24.com",0],["digitalfernsehen.de",0],["dnn.de",0],["donnerwetter.de",0],["e-hausaufgaben.de",0],["e-mountainbike.com",0],["eatsmarter.de",0],["echo-online.de",0],["ecomento.de",0],["einfachschoen.me",0],["elektrobike-online.com",0],["eltern.de",0],["epochtimes.de",0],["essen-und-trinken.de",0],["express.de",0],["extratipp.com",0],["familie.de",0],["fanfiktion.de",0],["fehmarn24.de",0],["fettspielen.de",0],["fid-gesundheitswissen.de",0],["finanznachrichten.de",0],["finanztreff.de",0],["finya.de",0],["firmenwissen.de",0],["fitforfun.de",0],["fnp.de",0],["football365.fr",0],["formel1.de",0],["fr.de",0],["frankfurter-wochenblatt.de",0],["freenet.de",0],["fremdwort.de",0],["froheweihnachten.info",0],["frustfrei-lernen.de",0],["fuldaerzeitung.de",0],["funandnews.de",0],["fussballdaten.de",0],["futurezone.de",0],["gala.de",0],["gamepro.de",0],["gamersglobal.de",0],["gamesaktuell.de",0],["gamestar.de",0],["gamezone.de",0],["gartendialog.de",0],["gartenlexikon.de",0],["gedichte.ws",0],["geissblog.koeln",0],["gelnhaeuser-tageblatt.de",0],["general-anzeiger-bonn.de",0],["geniale-tricks.com",0],["genialetricks.de",0],["gesund-vital.de",0],["gesundheit.de",0],["gevestor.de",0],["gewinnspiele.tv",0],["giessener-allgemeine.de",0],["giessener-anzeiger.de",0],["gifhorner-rundschau.de",0],["giga.de",0],["gipfelbuch.ch",0],["gmuender-tagespost.de",0],["golem.de",[0,8,9]],["gruenderlexikon.de",0],["gusto.at",0],["gut-erklaert.de",0],["gutfuerdich.co",0],["hallo-muenchen.de",0],["hamburg.de",0],["hanauer.de",0],["hardwareluxx.de",0],["hartziv.org",0],["harzkurier.de",0],["haus-garten-test.de",0],["hausgarten.net",0],["haustec.de",0],["haz.de",0],["heidelberg24.de",0],["heilpraxisnet.de",0],["heise.de",0],["helmstedter-nachrichten.de",0],["hersfelder-zeitung.de",0],["hftg.co",0],["hifi-forum.de",0],["hna.de",0],["hochheimer-zeitung.de",0],["hoerzu.de",0],["hofheimer-zeitung.de",0],["iban-rechner.de",0],["ikz-online.de",0],["immobilienscout24.de",0],["ingame.de",0],["inside-digital.de",0],["inside-handy.de",0],["investor-verlag.de",0],["jappy.com",0],["jpgames.de",0],["kabeleins.de",0],["kachelmannwetter.com",0],["kamelle.de",0],["kicker.de",0],["kindergeld.org",0],["klettern-magazin.de",0],["klettern.de",0],["kochbar.de",0],["kreis-anzeiger.de",0],["kreisbote.de",0],["kreiszeitung.de",0],["ksta.de",0],["kurierverlag.de",0],["lachainemeteo.com",0],["lampertheimer-zeitung.de",0],["landwirt.com",0],["laut.de",0],["lauterbacher-anzeiger.de",0],["leckerschmecker.me",0],["leinetal24.de",0],["lesfoodies.com",0],["levif.be",0],["lifeline.de",0],["liga3-online.de",0],["likemag.com",0],["linux-community.de",0],["linux-magazin.de",0],["live.vodafone.de",0],["ln-online.de",0],["lokalo24.de",0],["lustaufsleben.at",0],["lustich.de",0],["lvz.de",0],["lz.de",0],["macwelt.de",0],["macworld.co.uk",0],["mail.de",0],["main-spitze.de",0],["manager-magazin.de",0],["manga-tube.me",0],["mathebibel.de",0],["mathepower.com",0],["maz-online.de",0],["medisite.fr",0],["mehr-tanken.de",0],["mein-kummerkasten.de",0],["mein-mmo.de",0],["mein-wahres-ich.de",0],["meine-anzeigenzeitung.de",0],["meinestadt.de",0],["menshealth.de",0],["mercato365.com",0],["merkur.de",0],["messen.de",0],["metal-hammer.de",0],["metalflirt.de",0],["meteologix.com",0],["minecraft-serverlist.net",0],["mittelbayerische.de",0],["modhoster.de",0],["moin.de",0],["mopo.de",0],["morgenpost.de",0],["motor-talk.de",0],["motorbasar.de",0],["motorradonline.de",0],["motorsport-total.com",0],["motortests.de",0],["mountainbike-magazin.de",0],["moviejones.de",0],["moviepilot.de",0],["mt.de",0],["mtb-news.de",0],["musiker-board.de",0],["musikexpress.de",0],["musikradar.de",0],["mz-web.de",0],["n-tv.de",0],["naumburger-tageblatt.de",0],["netzwelt.de",0],["neuepresse.de",0],["neueroeffnung.info",0],["news.at",0],["news.de",0],["news38.de",0],["newsbreak24.de",0],["nickles.de",0],["nicknight.de",0],["nl.hardware.info",0],["nn.de",0],["nnn.de",0],["nordbayern.de",0],["notebookchat.com",0],["notebookcheck-ru.com",0],["notebookcheck-tr.com",0],["noz-cdn.de",0],["noz.de",0],["nrz.de",0],["nw.de",0],["nwzonline.de",0],["oberhessische-zeitung.de",0],["och.to",0],["oeffentlicher-dienst.info",0],["onlinekosten.de",0],["onvista.de",0],["op-marburg.de",0],["op-online.de",0],["outdoor-magazin.com",0],["outdoorchannel.de",0],["paradisi.de",0],["pc-magazin.de",0],["pcgames.de",0],["pcgameshardware.de",0],["pcwelt.de",0],["pcworld.es",0],["peiner-nachrichten.de",0],["pferde.de",0],["pietsmiet.de",0],["pixelio.de",0],["pkw-forum.de",0],["playboy.de",0],["playfront.de",0],["pnn.de",0],["pons.com",0],["prad.de",[0,125]],["prignitzer.de",0],["profil.at",0],["promipool.de",0],["promobil.de",0],["prosiebenmaxx.de",0],["psychic.de",[0,149]],["quoka.de",0],["radio.at",0],["radio.de",0],["radio.dk",0],["radio.es",0],["radio.fr",0],["radio.it",0],["radio.net",0],["radio.pl",0],["radio.pt",0],["radio.se",0],["ran.de",0],["readmore.de",0],["rechtslupe.de",0],["recording.de",0],["rennrad-news.de",0],["reuters.com",0],["reviersport.de",0],["rhein-main-presse.de",0],["rheinische-anzeigenblaetter.de",0],["rimondo.com",0],["roadbike.de",0],["roemische-zahlen.net",0],["rollingstone.de",0],["rot-blau.com",0],["rp-online.de",0],["rtl.de",[0,269]],["rtv.de",0],["rugby365.fr",0],["ruhr24.de",0],["rundschau-online.de",0],["runnersworld.de",0],["safelist.eu",0],["salzgitter-zeitung.de",0],["sat1.de",0],["sat1gold.de",0],["schoener-wohnen.de",0],["schwaebische-post.de",0],["schwarzwaelder-bote.de",0],["serienjunkies.de",0],["shz.de",0],["sixx.de",0],["skodacommunity.de",0],["smart-wohnen.net",0],["sn.at",0],["sozialversicherung-kompetent.de",0],["spiegel.de",0],["spielen.de",0],["spieletipps.de",0],["spielfilm.de",0],["sport.de",0],["sport365.fr",0],["sportal.de",0],["spox.com",0],["stern.de",0],["stuttgarter-nachrichten.de",0],["stuttgarter-zeitung.de",0],["sueddeutsche.de",0],["svz.de",0],["szene1.at",0],["szene38.de",0],["t-online.de",0],["tagesspiegel.de",0],["taschenhirn.de",0],["techadvisor.co.uk",0],["techstage.de",0],["tele5.de",0],["the-voice-of-germany.de",0],["thueringen24.de",0],["tichyseinblick.de",0],["tierfreund.co",0],["tiervermittlung.de",0],["torgranate.de",0],["trend.at",0],["tv-media.at",0],["tvdigital.de",0],["tvinfo.de",0],["tvspielfilm.de",0],["tvtoday.de",0],["tz.de",0],["unicum.de",0],["unnuetzes.com",0],["unsere-helden.com",0],["unterhalt.net",0],["usinger-anzeiger.de",0],["usp-forum.de",0],["videogameszone.de",0],["vienna.at",0],["vip.de",0],["virtualnights.com",0],["vox.de",0],["wa.de",0],["wallstreet-online.de",[0,3]],["waz.de",0],["weather.us",0],["webfail.com",0],["weihnachten.me",0],["weihnachts-bilder.org",0],["weihnachts-filme.com",0],["welt.de",0],["weltfussball.at",0],["weristdeinfreund.de",0],["werkzeug-news.de",0],["werra-rundschau.de",0],["wetterauer-zeitung.de",0],["wiesbadener-kurier.de",0],["wiesbadener-tagblatt.de",0],["winboard.org",0],["windows-7-forum.net",0],["winfuture.de",0],["wintotal.de",0],["wlz-online.de",0],["wn.de",0],["wohngeld.org",0],["wolfenbuetteler-zeitung.de",0],["wolfsburger-nachrichten.de",0],["woman.at",0],["womenshealth.de",0],["wormser-zeitung.de",0],["woxikon.de",0],["wp.de",0],["wr.de",0],["yachtrevue.at",0],["ze.tt",0],["zeit.de",0],["meineorte.com",1],["osthessen-news.de",1],["techadvisor.com",1],["focus.de",1],["economictimes.indiatimes.com",4],["m.timesofindia.com",5],["timesofindia.indiatimes.com",5],["youmath.it",5],["redensarten-index.de",5],["lesoir.be",5],["electriciansforums.net",5],["keralatelecom.info",5],["betaseries.com",5],["free-sms-receive.com",5],["sms-receive-online.com",5],["universegunz.net",5],["happypenguin.altervista.org",5],["everyeye.it",5],["bluedrake42.com",5],["streamservicehd.click",5],["supermarioemulator.com",5],["futbollibrehd.com",5],["newsrade.com",5],["eska.pl",5],["eskarock.pl",5],["voxfm.pl",5],["mathaeser.de",5],["freethesaurus.com",7],["thefreedictionary.com",7],["hdbox.ws",9],["todopolicia.com",9],["scat.gold",9],["freecoursesite.com",9],["windowcleaningforums.co.uk",9],["cruisingearth.com",9],["hobby-machinist.com",9],["freegogpcgames.com",9],["starleaks.org",9],["latitude.to",9],["kitchennovel.com",9],["w3layouts.com",9],["blog.receivefreesms.co.uk",9],["eductin.com",9],["dealsfinders.blog",9],["audiobooks4soul.com",9],["tinhocdongthap.com",9],["sakarnewz.com",9],["downloadr.in",9],["topcomicporno.com",9],["dongknows.com",9],["traderepublic.community",9],["babia.to",9],["celtadigital.com",9],["iptvrun.com",9],["adsup.lk",9],["cryptomonitor.in",9],["areatopik.com",9],["cardscanner.co",9],["nullforums.net",9],["courseclub.me",9],["tamarindoyam.com",9],["jeep-cj.com",9],["choiceofmods.com",9],["myqqjd.com",9],["ssdtop.com",9],["apkhex.com",9],["gezegenforum.com",9],["mbc2.live",9],["iptvapps.net",9],["null-scripts.net",9],["nullscripts.net",9],["bloground.ro",9],["witcherhour.com",9],["ottverse.com",9],["torrentmac.net",9],["mazakony.com",9],["laptechinfo.com",9],["mc-at.org",9],["playstationhaber.com",9],["mangapt.com",9],["seriesperu.com",9],["pesprofessionals.com",9],["wpsimplehacks.com",9],["sportshub.to",[9,268]],["topsporter.net",[9,268]],["darkwanderer.net",9],["truckingboards.com",9],["coldfrm.org",9],["azrom.net",9],["freepatternsarea.com",9],["alttyab.net",9],["hq-links.com",9],["mobilkulup.com",9],["esopress.com",9],["nesiaku.my.id",9],["jipinsoft.com",9],["surfsees.com",9],["truthnews.de",9],["farsinama.com",9],["worldofiptv.com",9],["vuinsider.com",9],["crazydl.net",9],["gamemodsbase.com",9],["babiato.tech",9],["secuhex.com",9],["turkishaudiocenter.com",9],["galaxyos.net",9],["blackhatworld.com",9],["bizdustry.com",9],["storefront.com.ng",9],["pkbiosfix.com",9],["casi3.xyz",9],["mediafire.com",10],["wcoanimedub.tv",11],["wcoforever.net",11],["openspeedtest.com",11],["addtobucketlist.com",11],["3dzip.org",[11,80]],["ilmeteo.it",11],["wcoforever.com",11],["comprovendolibri.it",11],["healthelia.com",11],["keephealth.info",12],["afreesms.com",13],["kinoger.re",13],["laksa19.github.io",13],["javcl.com",13],["tvlogy.to",13],["live.dragaoconnect.net",13],["beststremo.com",13],["seznam.cz",13],["seznamzpravy.cz",13],["xerifetech.com",13],["wallpapershome.com",15],["imgkings.com",16],["pornvideotop.com",16],["xstory-fr.com",16],["krotkoosporcie.pl",16],["anghami.com",17],["wired.com",18],["tutele.sx",19],["footyhunter3.xyz",19],["magesypro.pro",[20,21]],["audiotools.pro",21],["magesy.blog",[21,22,23]],["robloxscripts.com",22],["libreriamo.it",22],["postazap.com",22],["medebooks.xyz",22],["tutorials-technology.info",22],["mashtips.com",22],["marriedgames.com.br",22],["4allprograms.me",22],["nurgsm.com",22],["certbyte.com",22],["plugincrack.com",22],["gamingdeputy.com",22],["freewebcart.com",22],["katestube.com",24],["short.pe",24],["footystreams.net",24],["seattletimes.com",25],["bestgames.com",26],["yiv.com",26],["globalrph.com",27],["e-glossa.it",28],["webcheats.com.br",29],["gala.fr",31],["gentside.com",31],["geo.fr",31],["hbrfrance.fr",31],["nationalgeographic.fr",31],["ohmymag.com",31],["serengo.net",31],["vsd.fr",31],["updato.com",[32,50]],["methbox.com",33],["daizurin.com",33],["pendekarsubs.us",33],["dreamfancy.org",33],["rysafe.blogspot.com",33],["techacode.com",33],["toppng.com",33],["th-world.com",33],["avjamack.com",33],["avjamak.net",33],["tickzoo.tv",34],["dlhd.sx",35],["embedstream.me",35],["yts-subs.net",35],["cnnamador.com",36],["nudecelebforum.com",37],["pronpic.org",38],["thewebflash.com",39],["discordfastfood.com",39],["xup.in",39],["popularmechanics.com",40],["op.gg",41],["lequipe.fr",42],["comunidadgzone.es",43],["mp3fy.com",43],["lebensmittelpraxis.de",43],["ebookdz.com",43],["forum-pokemon-go.fr",43],["praxis-jugendarbeit.de",43],["gdrivez.xyz",43],["dictionnaire-medical.net",43],["cle0desktop.blogspot.com",43],["up-load.io",43],["direct-link.net",43],["direkt-wissen.com",43],["keysbrasil.blogspot.com",43],["hotpress.info",43],["turkleech.com",43],["anibatch.me",43],["anime-i.com",43],["plex-guide.de",43],["healthtune.site",43],["gewinde-normen.de",43],["tucinehd.com",43],["jellynote.com",44],["eporner.com",46],["pornbimbo.com",47],["allmonitors24.com",47],["4j.com",47],["avoiderrors.com",48],["cgtips.org",[48,214]],["sitarchive.com",48],["livenewsof.com",48],["topnewsshow.com",48],["gatcha.org",48],["empregoestagios.com",48],["everydayonsales.com",48],["kusonime.com",48],["aagmaal.xyz",48],["suicidepics.com",48],["codesnail.com",48],["codingshiksha.com",48],["graphicux.com",48],["asyadrama.com",48],["bitcoinegypt.news",48],["citychilli.com",48],["talkjarvis.com",48],["hdmotori.it",49],["femdomtb.com",51],["camhub.cc",51],["bobs-tube.com",51],["ru-xvideos.me",51],["pornfd.com",51],["popno-tour.net",51],["molll.mobi",51],["watchmdh.to",51],["camwhores.tv",51],["elfqrin.com",52],["satcesc.com",53],["apfelpatient.de",53],["lusthero.com",54],["m2list.com",55],["embed.nana2play.com",55],["elahmad.com",55],["dofusports.xyz",55],["dallasnews.com",56],["lnk.news",57],["lnk.parts",57],["efukt.com",58],["wendycode.com",58],["springfieldspringfield.co.uk",59],["porndoe.com",60],["smsget.net",[61,62]],["kjanime.net",63],["gioialive.it",64],["classicreload.com",65],["scriptzhub.com",65],["hotpornfile.org",66],["coolsoft.altervista.org",66],["hackedonlinegames.com",66],["jkoding.xyz",66],["settlersonlinemaps.com",66],["magdownload.org",66],["kpkuang.org",66],["shareus.site",66],["crypto4yu.com",66],["faucetwork.space",66],["thenightwithoutthedawn.blogspot.com",66],["entutes.com",66],["claimlite.club",66],["bazadecrypto.com",[66,314]],["chicoer.com",67],["bostonherald.com",67],["dailycamera.com",67],["maxcheaters.com",68],["rbxoffers.com",68],["mhn.quest",68],["leagueofgraphs.com",68],["hieunguyenphoto.com",68],["benzinpreis.de",68],["postimees.ee",68],["police.community",68],["gisarea.com",68],["schaken-mods.com",68],["theclashify.com",68],["newscon.org",68],["txori.com",68],["olarila.com",68],["deletedspeedstreams.blogspot.com",68],["schooltravelorganiser.com",68],["xhardhempus.net",68],["sportsplays.com",69],["deinesexfilme.com",71],["einfachtitten.com",71],["halloporno.com",71],["herzporno.com",71],["lesbenhd.com",71],["milffabrik.com",[71,243]],["porn-monkey.com",71],["porndrake.com",71],["pornhubdeutsch.net",71],["pornoaffe.com",71],["pornodavid.com",71],["pornoente.tv",[71,243]],["pornofisch.com",71],["pornofelix.com",71],["pornohammer.com",71],["pornohelm.com",71],["pornoklinge.com",71],["pornotom.com",[71,243]],["pornotommy.com",71],["pornovideos-hd.com",71],["pornozebra.com",[71,243]],["xhamsterdeutsch.xyz",71],["xnxx-sexfilme.com",71],["zerion.cc",71],["letribunaldunet.fr",72],["vladan.fr",72],["live-tv-channels.org",73],["eslfast.com",74],["freegamescasual.com",75],["tcpvpn.com",76],["oko.sh",76],["timesnownews.com",76],["timesnowhindi.com",76],["timesnowmarathi.com",76],["zoomtventertainment.com",76],["xxxuno.com",77],["sholah.net",78],["2rdroid.com",78],["bisceglielive.it",79],["pandajogosgratis.com.br",81],["5278.cc",82],["altblogger.net",83],["hl-live.de",83],["wohnmobilforum.de",83],["nulledbear.com",83],["sinnerclownceviri.net",83],["satoshi-win.xyz",83],["encurtandourl.com",[83,142]],["freedeepweb.blogspot.com",83],["freesoft.id",83],["zcteam.id",83],["www-daftarharga.blogspot.com",83],["ear-phone-review.com",83],["telefullenvivo.com",83],["listatv.pl",83],["ltc-faucet.xyz",83],["coin-profits.xyz",83],["relampagomovies.com",83],["tonspion.de",85],["duplichecker.com",86],["plagiarismchecker.co",86],["plagiarismdetector.net",86],["searchenginereports.net",86],["giallozafferano.it",87],["autojournal.fr",87],["autoplus.fr",87],["sportauto.fr",87],["linkspaid.com",88],["proxydocker.com",88],["beeimg.com",[89,90]],["emturbovid.com",90],["ftlauderdalebeachcam.com",91],["ftlauderdalewebcam.com",91],["juneauharborwebcam.com",91],["keywestharborwebcam.com",91],["kittycatcam.com",91],["mahobeachcam.com",91],["miamiairportcam.com",91],["morganhillwebcam.com",91],["njwildlifecam.com",91],["nyharborwebcam.com",91],["paradiseislandcam.com",91],["pompanobeachcam.com",91],["portbermudawebcam.com",91],["portcanaveralwebcam.com",91],["portevergladeswebcam.com",91],["portmiamiwebcam.com",91],["portnywebcam.com",91],["portnassauwebcam.com",91],["portstmaartenwebcam.com",91],["portstthomaswebcam.com",91],["porttampawebcam.com",91],["sxmislandcam.com",91],["gearingcommander.com",91],["themes-dl.com",91],["badassdownloader.com",91],["badasshardcore.com",91],["badassoftcore.com",91],["nulljungle.com",91],["teevee.asia",91],["otakukan.com",91],["generate.plus",93],["calculate.plus",93],["avcesar.com",94],["audiotag.info",95],["tudigitale.it",96],["ibcomputing.com",97],["legia.net",98],["acapellas4u.co.uk",99],["streamhentaimovies.com",100],["konten.co.id",101],["diariodenavarra.es",102],["tubereader.me",102],["scripai.com",102],["myfxbook.com",102],["whatfontis.com",102],["xiaomifans.pl",103],["eletronicabr.com",103],["optifine.net",104],["luzernerzeitung.ch",105],["tagblatt.ch",105],["spellcheck.net",106],["spellchecker.net",106],["spellweb.com",106],["ableitungsrechner.net",107],["alternet.org",108],["gourmetsupremacy.com",108],["shrib.com",109],["pandafiles.com",110],["vidia.tv",[110,131]],["hortonanderfarom.blogspot.com",110],["clarifystraight.com",110],["tutelehd3.xyz",111],["mega4upload.com",111],["coolcast2.com",111],["techclips.net",111],["earthquakecensus.com",111],["footyhunter.lol",111],["gamerarcades.com",111],["poscitech.click",111],["starlive.stream",111],["utopianwilderness.com",111],["wecast.to",111],["sportbar.live",111],["lordchannel.com",111],["play-old-pc-games.com",112],["tunovelaligera.com",113],["tapchipi.com",113],["cuitandokter.com",113],["tech-blogs.com",113],["cardiagn.com",113],["dcleakers.com",113],["esgeeks.com",113],["pugliain.net",113],["uplod.net",113],["worldfreeware.com",113],["fikiri.net",113],["myhackingworld.com",113],["phoenixfansub.com",113],["freecourseweb.com",114],["devcourseweb.com",114],["coursewikia.com",114],["courseboat.com",114],["coursehulu.com",114],["lne.es",118],["pornult.com",119],["webcamsdolls.com",119],["bitcotasks.com",[119,164]],["adsy.pw",119],["playstore.pw",119],["exactpay.online",119],["thothd.to",119],["proplanta.de",120],["hydrogenassociation.org",121],["ludigames.com",121],["sportitalialive.com",121],["made-by.org",121],["xenvn.com",121],["worldtravelling.com",121],["igirls.in",121],["technichero.com",121],["roshiyatech.my.id",121],["24sport.stream",121],["aeroxplorer.com",121],["mad4wheels.com",122],["logi.im",122],["emailnator.com",122],["textograto.com",123],["voyageforum.com",124],["hmc-id.blogspot.com",124],["jemerik.com",124],["myabandonware.com",124],["chatta.it",126],["ketubanjiwa.com",127],["nsfw247.to",128],["funzen.net",128],["fighter.stream",128],["ilclubdellericette.it",128],["hubstream.in",128],["extremereportbot.com",129],["getintopc.com",130],["qoshe.com",132],["lowellsun.com",133],["mamadu.pl",133],["dobrapogoda24.pl",133],["motohigh.pl",133],["namasce.pl",133],["ultimate-catch.eu",134],["cpopchanelofficial.com",135],["creditcardgenerator.com",136],["creditcardrush.com",136],["bostoncommons.net",136],["thejobsmovie.com",136],["livsavr.co",136],["nilopolisonline.com.br",137],["mesquitaonline.com",137],["yellowbridge.com",137],["socialgirls.im",138],["yaoiotaku.com",139],["camhub.world",140],["moneyhouse.ch",141],["ihow.info",142],["filesus.com",142],["sturls.com",142],["re.two.re",142],["turbo1.co",142],["cartoonsarea.xyz",142],["valeronevijao.com",143],["cigarlessarefy.com",143],["figeterpiazine.com",143],["yodelswartlike.com",143],["generatesnitrosate.com",143],["crownmakermacaronicism.com",143],["chromotypic.com",143],["gamoneinterrupted.com",143],["metagnathtuggers.com",143],["wolfdyslectic.com",143],["rationalityaloelike.com",143],["sizyreelingly.com",143],["simpulumlamerop.com",143],["urochsunloath.com",143],["monorhinouscassaba.com",143],["counterclockwisejacky.com",143],["35volitantplimsoles5.com",143],["scatch176duplicities.com",143],["antecoxalbobbing1010.com",143],["boonlessbestselling244.com",143],["cyamidpulverulence530.com",143],["guidon40hyporadius9.com",143],["449unceremoniousnasoseptal.com",143],["19turanosephantasia.com",143],["30sensualizeexpression.com",143],["321naturelikefurfuroid.com",143],["745mingiestblissfully.com",143],["availedsmallest.com",143],["greaseball6eventual20.com",143],["toxitabellaeatrebates306.com",143],["20demidistance9elongations.com",143],["audaciousdefaulthouse.com",143],["fittingcentermondaysunday.com",143],["fraudclatterflyingcar.com",143],["launchreliantcleaverriver.com",143],["matriculant401merited.com",143],["realfinanceblogcenter.com",143],["reputationsheriffkennethsand.com",143],["telyn610zoanthropy.com",143],["tubelessceliolymph.com",143],["tummulerviolableness.com",143],["un-block-voe.net",143],["v-o-e-unblock.com",143],["voe-un-block.com",143],["voeun-block.net",143],["voeunbl0ck.com",143],["voeunblck.com",143],["voeunblk.com",143],["voeunblock.com",143],["voeunblock1.com",143],["voeunblock2.com",143],["voeunblock3.com",143],["agefi.fr",144],["cariskuy.com",145],["letras2.com",145],["yusepjaelani.blogspot.com",146],["letras.mus.br",147],["mtlurb.com",148],["port.hu",149],["acdriftingpro.com",149],["flight-report.com",149],["forumdz.com",149],["abandonmail.com",149],["flmods.com",149],["zilinak.sk",149],["projectfreetv.stream",149],["hotdesimms.com",149],["pdfaid.com",149],["mconverter.eu",149],["dzeko11.net",[149,268]],["mail.com",149],["expresskaszubski.pl",149],["moegirl.org.cn",149],["onemanhua.com",150],["t3n.de",151],["allindiaroundup.com",152],["vectorizer.io",153],["smgplaza.com",153],["onehack.us",153],["thapcam.net",153],["thefastlaneforum.com",154],["trade2win.com",155],["modagamers.com",156],["freemagazines.top",156],["straatosphere.com",156],["nullpk.com",156],["adslink.pw",156],["downloadudemy.com",156],["picgiraffe.com",156],["weadown.com",156],["freepornsex.net",156],["nurparatodos.com.ar",156],["librospreuniversitariospdf.blogspot.com",157],["msdos-games.com",157],["blocklayer.com",157],["forexeen.us",157],["khsm.io",157],["webcreator-journal.com",157],["nu6i-bg-net.com",157],["routech.ro",158],["hokej.net",158],["turkmmo.com",159],["palermotoday.it",160],["baritoday.it",160],["trentotoday.it",160],["agrigentonotizie.it",160],["anconatoday.it",160],["arezzonotizie.it",160],["avellinotoday.it",160],["bresciatoday.it",160],["brindisireport.it",160],["casertanews.it",160],["cataniatoday.it",160],["cesenatoday.it",160],["chietitoday.it",160],["forlitoday.it",160],["frosinonetoday.it",160],["genovatoday.it",160],["ilpescara.it",160],["ilpiacenza.it",160],["latinatoday.it",160],["lecceprima.it",160],["leccotoday.it",160],["livornotoday.it",160],["messinatoday.it",160],["milanotoday.it",160],["modenatoday.it",160],["monzatoday.it",160],["novaratoday.it",160],["padovaoggi.it",160],["parmatoday.it",160],["perugiatoday.it",160],["pisatoday.it",160],["quicomo.it",160],["ravennatoday.it",160],["reggiotoday.it",160],["riminitoday.it",160],["romatoday.it",160],["salernotoday.it",160],["sondriotoday.it",160],["sportpiacenza.it",160],["ternitoday.it",160],["today.it",160],["torinotoday.it",160],["trevisotoday.it",160],["triesteprima.it",160],["udinetoday.it",160],["veneziatoday.it",160],["vicenzatoday.it",160],["thumpertalk.com",161],["arkcod.org",161],["facciabuco.com",162],["softx64.com",163],["thelayoff.com",164],["manwan.xyz",164],["blog.cryptowidgets.net",164],["blog.insurancegold.in",164],["blog.wiki-topia.com",164],["blog.coinsvalue.net",164],["blog.cookinguide.net",164],["blog.freeoseocheck.com",164],["blog.makeupguide.net",164],["blog.carstopia.net",164],["blog.carsmania.net",164],["shorterall.com",164],["blog24.me",164],["maxstream.video",164],["maxlinks.online",164],["tvepg.eu",164],["pstream.net",165],["dailymaverick.co.za",166],["apps2app.com",167],["cheatermad.com",168],["ville-ideale.fr",169],["eodev.com",170],["fm-arena.com",171],["tradersunion.com",172],["tandess.com",173],["faqwiki.us",174],["sonixgvn.net",174],["spontacts.com",175],["dankmemer.lol",176],["apkmoddone.com",177],["getexploits.com",178],["fplstatistics.com",179],["breitbart.com",180],["salidzini.lv",181],["choosingnothing.com",182],["cryptorank.io",183],["lewblivehdplay.ru",184],["claplivehdplay.ru",184],["viwlivehdplay.ru",184],["enit.in",185],["financerites.com",185],["fadedfeet.com",186],["homeculina.com",186],["ineedskin.com",186],["kenzo-flowertag.com",186],["lawyex.co",186],["mdn.lol",186],["bitzite.com",187],["coingraph.us",188],["impact24.us",188],["my-code4you.blogspot.com",189],["vrcmods.com",190],["osuskinner.com",190],["osuskins.net",190],["pentruea.com",[191,192]],["mchacks.net",193],["why-tech.it",194],["compsmag.com",195],["tapetus.pl",196],["gaystream.online",197],["bembed.net",197],["embedv.net",197],["fslinks.org",197],["listeamed.net",197],["v6embed.xyz",197],["vgplayer.xyz",197],["vid-guard.com",197],["autoroad.cz",198],["brawlhalla.fr",198],["tecnobillo.com",198],["sexcamfreeporn.com",199],["breatheheavy.com",200],["wenxuecity.com",201],["key-hub.eu",202],["fabioambrosi.it",203],["tattle.life",204],["emuenzen.de",204],["terrylove.com",204],["mynet.com",205],["cidade.iol.pt",206],["fantacalcio.it",207],["hentaifreak.org",208],["hypebeast.com",209],["krankheiten-simulieren.de",210],["catholic.com",211],["ad-doge.com",212],["3dmodelshare.org",213],["gourmetscans.net",214],["techinferno.com",215],["ibeconomist.com",216],["bookriot.com",217],["purposegames.com",218],["schoolcheats.net",218],["globo.com",219],["latimes.com",219],["claimrbx.gg",220],["perelki.net",221],["vpn-anbieter-vergleich-test.de",222],["livingincebuforums.com",223],["paperzonevn.com",224],["alltechnerd.com",225],["malaysianwireless.com",226],["erinsakura.com",227],["infofuge.com",227],["freejav.guru",227],["novelmultiverse.com",227],["fritidsmarkedet.dk",228],["maskinbladet.dk",228],["15min.lt",229],["baddiehub.com",230],["mr9soft.com",231],["21porno.com",232],["adult-sex-gamess.com",233],["hentaigames.app",233],["mobilesexgamesx.com",233],["mysexgamer.com",233],["porngameshd.com",233],["sexgamescc.com",233],["xnxx-sex-videos.com",233],["f2movies.to",234],["freeporncave.com",235],["tubsxxx.com",236],["pornojenny.com",237],["subtitle.one",238],["manga18fx.com",239],["freebnbcoin.com",239],["sextvx.com",240],["studydhaba.com",241],["freecourse.tech",241],["victor-mochere.com",241],["papunika.com",241],["mobilanyheter.net",241],["prajwaldesai.com",[241,260]],["ftuapps.dev",241],["muztext.com",242],["pornohans.com",243],["nursexfilme.com",243],["pornohirsch.net",243],["xhamster-sexvideos.com",243],["pornoschlange.com",243],["hdpornos.net",243],["gutesexfilme.com",243],["short1.site",243],["zona-leros.com",243],["charbelnemnom.com",244],["simplebits.io",245],["online-fix.me",246],["gamersdiscussionhub.com",247],["owlzo.com",248],["q1003.com",249],["blogpascher.com",250],["testserver.pro",251],["lifestyle.bg",251],["money.bg",251],["news.bg",251],["topsport.bg",251],["webcafe.bg",251],["mgnet.xyz",252],["advertiserandtimes.co.uk",253],["xvideos2020.me",254],["111.90.159.132",255],["techsolveprac.com",256],["joomlabeginner.com",257],["largescaleforums.com",258],["dubznetwork.com",259],["mundodonghua.com",259],["hentaidexy.com",261],["code2care.org",262],["xxxxsx.com",264],["ngontinh24.com",265],["panel.freemcserver.net",266],["idevicecentral.com",267],["zona11.com",268],["scsport.live",268],["mangacrab.com",270],["idnes.cz",271],["viefaucet.com",272],["cloud-computing-central.com",273],["afk.guide",274],["businessnamegenerator.com",275],["derstandard.at",276],["derstandard.de",276],["rocketnews24.com",277],["soranews24.com",277],["youpouch.com",277],["ilsole24ore.com",278],["ipacrack.com",279],["hentaiporn.one",280],["infokik.com",281],["daemonanime.net",282],["daemon-hentai.com",282],["deezer.com",283],["fosslinux.com",284],["shrdsk.me",285],["examword.com",286],["sempreupdate.com.br",286],["tribuna.com",287],["trendsderzukunft.de",288],["gal-dem.com",288],["lostineu.eu",288],["oggitreviso.it",288],["speisekarte.de",288],["mixed.de",288],["lightnovelspot.com",[289,290]],["lightnovelworld.com",[289,290]],["novelpub.com",[289,290]],["webnovelpub.com",[289,290]],["mail.yahoo.com",291],["hwzone.co.il",292],["nammakalvi.com",293],["javmoon.me",294],["c2g.at",295],["terafly.me",295],["elamigos-games.com",295],["elamigos-games.net",295],["dktechnicalmate.com",296],["recipahi.com",296],["converter-btc.world",296],["kaystls.site",297],["aquarius-horoscopes.com",298],["cancer-horoscopes.com",298],["dubipc.blogspot.com",298],["echoes.gr",298],["engel-horoskop.de",298],["freegames44.com",298],["fuerzasarmadas.eu",298],["gemini-horoscopes.com",298],["jurukunci.net",298],["krebs-horoskop.com",298],["leo-horoscopes.com",298],["maliekrani.com",298],["nklinks.click",298],["ourenseando.es",298],["pisces-horoscopes.com",298],["radio-en-direct.fr",298],["sagittarius-horoscopes.com",298],["scorpio-horoscopes.com",298],["singlehoroskop-loewe.de",298],["skat-karten.de",298],["skorpion-horoskop.com",298],["taurus-horoscopes.com",298],["the1security.com",298],["torrentmovies.online",298],["virgo-horoscopes.com",298],["zonamarela.blogspot.com",298],["yoima.hatenadiary.com",298],["vpntester.org",299],["watchhentai.net",300],["japscan.lol",301],["digitask.ru",302],["tempumail.com",303],["sexvideos.host",304],["10alert.com",306],["cryptstream.de",307],["nydus.org",307],["techhelpbd.com",308],["fapdrop.com",309],["cellmapper.net",310],["hdrez.com",311],["youwatch-serie.com",311],["printablecreative.com",312],["comohoy.com",313],["leak.sx",313],["paste.bin.sx",313],["pornleaks.in",313],["merlininkazani.com",313],["j91.asia",315],["jeniusplay.com",316],["indianyug.com",317],["rgb.vn",317],["needrom.com",318],["criptologico.com",319],["megadrive-emulator.com",320],["eromanga-show.com",321],["hentai-one.com",321],["hentaipaw.com",321],["10minuteemails.com",322],["luxusmail.org",322],["w3cub.com",323],["bangpremier.com",324],["nyaa.iss.ink",325],["tnp98.xyz",327],["freepdfcomic.com",328],["memedroid.com",329],["animesync.org",330],["karaoketexty.cz",331],["resortcams.com",332],["mjakmama24.pl",334],["security-demo.extrahop.com",335]]);

const entitiesMap = new Map([["comunio",0],["finanzen",[0,6]],["gameswelt",0],["heftig",0],["notebookcheck",0],["testedich",0],["transfermarkt",0],["truckscout24",0],["tvtv",0],["wetteronline",0],["wieistmeineip",0],["wetter",2],["1337x",5],["eztv",5],["sushi-scan",9],["spigotunlocked",9],["ahmedmode",9],["kissasian",12],["rp5",13],["mma-core",14],["yts",19],["720pstream",19],["1stream",19],["magesy",20],["shortzzy",22],["thefmovies",24],["urlcero",30],["totaldebrid",33],["sandrives",33],["oploverz",34],["fxporn69",43],["aliancapes",43],["pouvideo",45],["povvideo",45],["povw1deo",45],["povwideo",45],["powv1deo",45],["powvibeo",45],["powvideo",45],["powvldeo",45],["tubsexer",51],["porno-tour",51],["lenkino",51],["pornomoll",51],["camsclips",51],["m4ufree",55],["writedroid",66],["telerium",70],["pandafreegames",84],["thoptv",92],["streameast",111],["thestreameast",111],["daddylivehd",111],["solvetube",115],["hdfilme",116],["pornhub",117],["wcofun",124],["bollyholic",128],["gotxx",142],["turkanime",143],["voe-unblock",143],["khatrimaza",156],["pogolinks",156],["popcornstream",158],["brainly",170],["vembed",197],["xhamsterdeutsch",243],["privatemoviez",247],["gmx",263],["lightnovelpub",[289,290]],["camcaps",305],["drivebot",326],["thenextplanet1",327],["autoscout24",333]]);

const exceptionsMap = new Map([]);

/******************************************************************************/

function noSetTimeoutIf(
    needle = '',
    delay = ''
) {
    if ( typeof needle !== 'string' ) { return; }
    const safe = safeSelf();
    const logPrefix = safe.makeLogPrefix('prevent-setTimeout', needle, delay);
    const needleNot = needle.charAt(0) === '!';
    if ( needleNot ) { needle = needle.slice(1); }
    if ( delay === '' ) { delay = undefined; }
    let delayNot = false;
    if ( delay !== undefined ) {
        delayNot = delay.charAt(0) === '!';
        if ( delayNot ) { delay = delay.slice(1); }
        delay = parseInt(delay, 10);
    }
    const reNeedle = safe.patternToRegex(needle);
    self.setTimeout = new Proxy(self.setTimeout, {
        apply: function(target, thisArg, args) {
            const a = args[0] instanceof Function
                ? String(safe.Function_toString(args[0]))
                : String(args[0]);
            const b = args[1];
            if ( needle === '' && delay === undefined ) {
                safe.uboLog(logPrefix, `Called:\n${a}\n${b}`);
                return Reflect.apply(target, thisArg, args);
            }
            let defuse;
            if ( needle !== '' ) {
                defuse = reNeedle.test(a) !== needleNot;
            }
            if ( defuse !== false && delay !== undefined ) {
                defuse = (b === delay || isNaN(b) && isNaN(delay) ) !== delayNot;
            }
            if ( defuse ) {
                args[0] = function(){};
                safe.uboLog(logPrefix, `Prevented:\n${a}\n${b}`);
            }
            return Reflect.apply(target, thisArg, args);
        },
        get(target, prop, receiver) {
            if ( prop === 'toString' ) {
                return target.toString.bind(target);
            }
            return Reflect.get(target, prop, receiver);
        },
    });
}

function safeSelf() {
    if ( scriptletGlobals.safeSelf ) {
        return scriptletGlobals.safeSelf;
    }
    const self = globalThis;
    const safe = {
        'Array_from': Array.from,
        'Error': self.Error,
        'Function_toStringFn': self.Function.prototype.toString,
        'Function_toString': thisArg => safe.Function_toStringFn.call(thisArg),
        'Math_floor': Math.floor,
        'Math_max': Math.max,
        'Math_min': Math.min,
        'Math_random': Math.random,
        'Object': Object,
        'Object_defineProperty': Object.defineProperty.bind(Object),
        'Object_fromEntries': Object.fromEntries.bind(Object),
        'Object_getOwnPropertyDescriptor': Object.getOwnPropertyDescriptor.bind(Object),
        'RegExp': self.RegExp,
        'RegExp_test': self.RegExp.prototype.test,
        'RegExp_exec': self.RegExp.prototype.exec,
        'Request_clone': self.Request.prototype.clone,
        'XMLHttpRequest': self.XMLHttpRequest,
        'addEventListener': self.EventTarget.prototype.addEventListener,
        'removeEventListener': self.EventTarget.prototype.removeEventListener,
        'fetch': self.fetch,
        'JSON': self.JSON,
        'JSON_parseFn': self.JSON.parse,
        'JSON_stringifyFn': self.JSON.stringify,
        'JSON_parse': (...args) => safe.JSON_parseFn.call(safe.JSON, ...args),
        'JSON_stringify': (...args) => safe.JSON_stringifyFn.call(safe.JSON, ...args),
        'log': console.log.bind(console),
        // Properties
        logLevel: 0,
        // Methods
        makeLogPrefix(...args) {
            return this.sendToLogger && `[${args.join(' \u205D ')}]` || '';
        },
        uboLog(...args) {
            if ( this.sendToLogger === undefined ) { return; }
            if ( args === undefined || args[0] === '' ) { return; }
            return this.sendToLogger('info', ...args);
            
        },
        uboErr(...args) {
            if ( this.sendToLogger === undefined ) { return; }
            if ( args === undefined || args[0] === '' ) { return; }
            return this.sendToLogger('error', ...args);
        },
        escapeRegexChars(s) {
            return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        },
        initPattern(pattern, options = {}) {
            if ( pattern === '' ) {
                return { matchAll: true };
            }
            const expect = (options.canNegate !== true || pattern.startsWith('!') === false);
            if ( expect === false ) {
                pattern = pattern.slice(1);
            }
            const match = /^\/(.+)\/([gimsu]*)$/.exec(pattern);
            if ( match !== null ) {
                return {
                    re: new this.RegExp(
                        match[1],
                        match[2] || options.flags
                    ),
                    expect,
                };
            }
            if ( options.flags !== undefined ) {
                return {
                    re: new this.RegExp(this.escapeRegexChars(pattern),
                        options.flags
                    ),
                    expect,
                };
            }
            return { pattern, expect };
        },
        testPattern(details, haystack) {
            if ( details.matchAll ) { return true; }
            if ( details.re ) {
                return this.RegExp_test.call(details.re, haystack) === details.expect;
            }
            return haystack.includes(details.pattern) === details.expect;
        },
        patternToRegex(pattern, flags = undefined, verbatim = false) {
            if ( pattern === '' ) { return /^/; }
            const match = /^\/(.+)\/([gimsu]*)$/.exec(pattern);
            if ( match === null ) {
                const reStr = this.escapeRegexChars(pattern);
                return new RegExp(verbatim ? `^${reStr}$` : reStr, flags);
            }
            try {
                return new RegExp(match[1], match[2] || undefined);
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
            return this.Object_fromEntries(entries);
        },
        onIdle(fn, options) {
            if ( self.requestIdleCallback ) {
                return self.requestIdleCallback(fn, options);
            }
            return self.requestAnimationFrame(fn);
        },
    };
    scriptletGlobals.safeSelf = safe;
    if ( scriptletGlobals.bcSecret === undefined ) { return safe; }
    // This is executed only when the logger is opened
    const bc = new self.BroadcastChannel(scriptletGlobals.bcSecret);
    let bcBuffer = [];
    safe.logLevel = scriptletGlobals.logLevel || 1;
    safe.sendToLogger = (type, ...args) => {
        if ( args.length === 0 ) { return; }
        const text = `[${document.location.hostname || document.location.href}]${args.join(' ')}`;
        if ( bcBuffer === undefined ) {
            return bc.postMessage({ what: 'messageToLogger', type, text });
        }
        bcBuffer.push({ type, text });
    };
    bc.onmessage = ev => {
        const msg = ev.data;
        switch ( msg ) {
        case 'iamready!':
            if ( bcBuffer === undefined ) { break; }
            bcBuffer.forEach(({ type, text }) =>
                bc.postMessage({ what: 'messageToLogger', type, text })
            );
            bcBuffer = undefined;
            break;
        case 'setScriptletLogLevelToOne':
            safe.logLevel = 1;
            break;
        case 'setScriptletLogLevelToTwo':
            safe.logLevel = 2;
            break;
        }
    };
    bc.postMessage('areyouready?');
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
    try { noSetTimeoutIf(...argsList[i]); }
    catch(ex) {}
}
argsList.length = 0;

/******************************************************************************/

};
// End of code to inject

/******************************************************************************/

// Inject code

// https://bugzilla.mozilla.org/show_bug.cgi?id=1736575
//   'MAIN' world not yet supported in Firefox, so we inject the code into
//   'MAIN' ourself when environment in Firefox.

const targetWorld = 'MAIN';

// Not Firefox
if ( typeof wrappedJSObject !== 'object' || targetWorld === 'ISOLATED' ) {
    return uBOL_noSetTimeoutIf();
}

// Firefox
{
    const page = self.wrappedJSObject;
    let script, url;
    try {
        page.uBOL_noSetTimeoutIf = cloneInto([
            [ '(', uBOL_noSetTimeoutIf.toString(), ')();' ],
            { type: 'text/javascript; charset=utf-8' },
        ], self);
        const blob = new page.Blob(...page.uBOL_noSetTimeoutIf);
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
    delete page.uBOL_noSetTimeoutIf;
}

/******************************************************************************/

// End of local scope
})();

/******************************************************************************/

void 0;
