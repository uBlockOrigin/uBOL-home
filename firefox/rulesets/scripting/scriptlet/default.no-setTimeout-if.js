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

const argsList = [[".call(null)","10"],[".call(null)"],["(null)","10"],["userHasAdblocker"],["adb"],["nrWrapper"],["warn"],["adBlockerDetected"],["show"],["InfMediafireMobileFunc","1000"],["google_jobrunner"],["()","45000"],["0x"],["displayAdBlockedVideo"],[".adsbygoogle"],["isDesktopApp","1000"],["Bait"],["admc"],["AdBlocker"],["Blocked"],["ai_adb"],["match","100"],["'0x"],["apstagLOADED"],["/Adb|moneyDetect/"],["disableDeveloper"],["Blocco","2000"],["test","0"],["checkAdblockUser","1000"],["checkPub","6000"],["document.querySelector","5000"],["nextFunction","250"],["()","150"],["backRedirect"],["document.querySelectorAll","1000"],["style"],["clientHeight"],["addEventListener","0"],["adblock","2000"],["start","0"],["nextFunction","2000"],["byepopup","5000"],["test.remove","100"],["additional_src","300"],["()","2000"],["css_class.show"],["CANG","3000"],["updato-overlay","500"],["innerText","2000"],["alert","8000"],["css_class"],["()","50"],["debugger"],["initializeCourier","3000"],["redirectPage"],["_0x","2000"],["ads","750"],["location.href","500"],["Adblock","5000"],["disable","200"],["CekAab","0"],["rbm_block_active","1000"],["show()"],["_0x"],["n.trigger","1"],["adblock"],["abDetected"],["KeepOpeningPops","1000"],["location.href"],["appendChild"],["adb","0"],["adBlocked"],["warning","100"],["adblock_popup","500"],["Adblock"],["location.href","10000"],["#chatWrap","1000"],["keep-ads","2000"],["#rbm_block_active","1000"],["null","4000"],["()","2500"],["myaabpfun","3000"],["nextFunction"],["adFilled","2500"],["()","15000"],["showPopup"],["()","1"],["()","1000"],["document.cookie","2500"],["window.open"],["innerHTML"],["readyplayer","2000"],["/innerHTML|AdBlock/"],["checkStopBlock"],["adspot_top","1500"],["/offsetHeight|google|Global/"],["an_message","500"],["Adblocker","10000"],["timeoutChecker"],["bait","1"],["pum-open"],["overlay","2000"],["/adblock/i"],["test","100"],["Math.round","1000"],["adblock","5"],["bioEp"],["ag_adBlockerDetected"],["null"],["adb","6000"],["pop"],["sadbl"],["checkAdStatus"],["mdp"],["brave_load_popup"],["0x","3000"],["invoke"],["adsbytrafficjunkycontext"],["ipod"],["offsetWidth"],["/$|adBlock/"],["ads"],["adsbygoogle"],["()"],["AdBlock"],["stop-scrolling"],["Adv"],["blockUI","2000"],["mdpDeBlocker"],["/_0x|debug/"],["/ai_adb|_0x/"],["iframe"],["adBlock"],["","1"],["undefined"],["check","1"],["adsBlocked"],["blocker"],["aswift_"],["afs_ads","2000"],["visibility","2000"],["bait"],["getComputedStyle","250"],["blocked"],["{r()","0"],["nextFunction","450"],["Debug"],["r()","0"],["purple_box"],["offsetHeight"],["checkSiteNormalLoad"],["adBlockOverlay"],["Detected","500"],["modal"],[".show","1000"],[".show"],["showModal"],["getComputedStyle"],["blur"],["samOverlay"],["bADBlock"],["location"],["","4000"],["blocker","100"],["alert"],["length"],["t()","0"],["$"],["offset"],["contrformpub"],["trigger","0"],["popup"],["getComputedStyle","2000"],["video-popup"],["detectAdblock"],["EzoIvent"],["detectAdBlocker"],["nads"],["1e3*"],["current.children"],["adStatus"],["BN_CAMPAIGNS"],["media_place_list"],["cvad"],["...","300"],["/\\{[a-z]\\(!0\\)\\}/"],["error"],["stackTrace"],["inner-ad"],["_ET"],[".clientHeight"],["getComputedStyle(el)"],["location.replace"],["console.clear"],["ad_block_detector"],["documentElement.innerHTML"],["","5"],["/adblock|isRequestPresent/"],["_0x","500"],["isRequestPresent"],["adsPost"],["_0x","1000"],["offsetLeft"],["height"],["mdp_deblocker"],["charAt"],["checkAds"],["fadeIn","0"],["jQuery"],["/^/"],["afterOpen"],["check"],["Adblocker"],["eabdModal"],["ab_root.show"],["gaData"],["ad"],["prompt","1000"],["googlefc"],["adblock detection"],[".offsetHeight","100"],["popState"],["ad-block-popup"],["exitTimer"],["innerHTML.replace"],["ab","2000"],["data?","4000"],[".data?"],["eabpDialog"],["adsense"],["/Adblock|_ad_/"],["googletag"],["f.parentNode.removeChild(f)","100"],["swal","500"],["keepChecking","1000"],["openPopup"],[".offsetHeight"],["()=>{"],["nitroAds"],["class.scroll","1000"],["disableDeveloperTools"],["Check"],["insertBefore"],["css_class.scroll"],["/null|Error/","10000"],["window.location.href","50"],["/out.php"],["/0x|devtools/"],["location.replace","300"],["window.location.href"],["checkVisible"],["_0x","3000"],["fetch"],["window.location.href=link"],["ai_"],["reachGoal"],["Adb"],["ai"],["","3000"],["/width|innerHTML/"],["magnificPopup"],["adblockEnabled"],["google_ad"],["document.location"],["google"],["top-right","2000"],["enforceAdStatus"],["loadScripts"],["mfp"],["display","5000"],["eb"],[").show()"],["","1000"],["site-access"],["atob"],["Msg"],["UABP"],["href"],["aaaaa-modal"],["()=>"],["keepChecking"],["loader.min.js"],["null","10"],["","500"],["/Adform|didomi|adblock|forEach/"],["showAdblock"],["-0x"],["display"],["gclid"],["event","3000"],["rejectWith"],["refresh"],["location.href","3000"],["window.location"],["ga"],["adbl"],["Ads"],["ShowAdBLockerNotice"],["ad_listener"],["open"],["(!0)"],["Delay"],["/appendChild|e\\(\"/"],["=>"],["ADB"],["site-access-popup"],["data?"],["/debugger|UserCustomPop/"],["checkAdblockUser"],["offsetHeight","100"],["AdDetect"],["displayMessage","2000"],["/salesPopup|mira-snackbar/"],["advanced"],["detectImgLoad"],["offsetHeight","200"],["detector"],["replace"],["touchstart"],["siteAccessFlag"],["ab"],["/adblocker|alert/"],["redURL"],["/children\\('ins'\\)|Adblock|adsbygoogle/"],["displayMessage"],["/adblock|googletag/"],["chkADB"],["onDetected"],["myinfoey","1500"],["fuckadb"],["detect"],["siteAccessPopup"],["/adsbygoogle|adblock/"],["akadb"],["biteDisplay"],["/[a-z]\\(!0\\)/","800"],["ad_block"],["/detectAdBlocker|window.open/"],["adBlockDetected"],["popUnder"],["/GoToURL|delay/"],["window.location.href","300"],["ad_display"],["/adScriptPath|MMDConfig/"],["0x","100"],["/native|\\{n\\(\\)/"],["psresimler"],["adblocker"],["/Detect|adblock|style\\.display|\\[native code]|\\.call\\(null\\)/"],["removeChild"],["ad blocker"],["googleFC"],["')]();}"],["navigator.userAgent"]];

const hostnamesMap = new Map([["4-liga.com",0],["4fansites.de",0],["4players.de",0],["9monate.de",0],["aachener-nachrichten.de",0],["aachener-zeitung.de",0],["abendblatt.de",0],["abendzeitung-muenchen.de",0],["about-drinks.com",0],["abseits-ka.de",0],["airliners.de",0],["ajaxshowtime.com",0],["allgemeine-zeitung.de",0],["alpin.de",0],["antenne.de",0],["arcor.de",0],["areadvd.de",0],["areamobile.de",0],["ariva.de",0],["astronews.com",0],["aussenwirtschaftslupe.de",0],["auszeit.bio",0],["auto-motor-und-sport.de",0],["auto-service.de",0],["autobild.de",0],["autoextrem.de",0],["autopixx.de",0],["autorevue.at",0],["az-online.de",0],["baby-vornamen.de",0],["babyclub.de",0],["bafoeg-aktuell.de",0],["berliner-kurier.de",0],["berliner-zeitung.de",0],["bigfm.de",0],["bikerszene.de",0],["bildderfrau.de",0],["blackd.de",0],["blick.de",0],["boerse-online.de",0],["boerse.de",0],["boersennews.de",0],["braunschweiger-zeitung.de",0],["brieffreunde.de",0],["brigitte.de",0],["buerstaedter-zeitung.de",0],["buffed.de",0],["businessinsider.de",0],["buzzfeed.at",0],["buzzfeed.de",0],["caravaning.de",0],["cavallo.de",0],["chefkoch.de",0],["cinema.de",0],["clever-tanken.de",0],["computerbild.de",0],["computerhilfen.de",0],["comunio-cl.com",0],["connect.de",0],["chip.de",0],["da-imnetz.de",0],["dasgelbeblatt.de",0],["dbna.com",0],["dbna.de",0],["deichstube.de",0],["deine-tierwelt.de",0],["der-betze-brennt.de",0],["derwesten.de",0],["desired.de",0],["dhd24.com",0],["dieblaue24.com",0],["digitalfernsehen.de",0],["dnn.de",0],["donnerwetter.de",0],["e-hausaufgaben.de",0],["e-mountainbike.com",0],["eatsmarter.de",0],["echo-online.de",0],["ecomento.de",0],["einfachschoen.me",0],["elektrobike-online.com",0],["eltern.de",0],["epochtimes.de",0],["essen-und-trinken.de",0],["express.de",0],["extratipp.com",0],["familie.de",0],["fanfiktion.de",0],["fehmarn24.de",0],["fettspielen.de",0],["fid-gesundheitswissen.de",0],["finanznachrichten.de",0],["finanztreff.de",0],["finya.de",0],["firmenwissen.de",0],["fitforfun.de",0],["fnp.de",0],["football365.fr",0],["formel1.de",0],["fr.de",0],["frankfurter-wochenblatt.de",0],["freenet.de",0],["fremdwort.de",0],["froheweihnachten.info",0],["frustfrei-lernen.de",0],["fuldaerzeitung.de",0],["funandnews.de",0],["fussballdaten.de",0],["futurezone.de",0],["gala.de",0],["gamepro.de",0],["gamersglobal.de",0],["gamesaktuell.de",0],["gamestar.de",0],["gamezone.de",0],["gartendialog.de",0],["gartenlexikon.de",0],["gedichte.ws",0],["geissblog.koeln",0],["gelnhaeuser-tageblatt.de",0],["general-anzeiger-bonn.de",0],["geniale-tricks.com",0],["genialetricks.de",0],["gesund-vital.de",0],["gesundheit.de",0],["gevestor.de",0],["gewinnspiele.tv",0],["giessener-allgemeine.de",0],["giessener-anzeiger.de",0],["gifhorner-rundschau.de",0],["giga.de",0],["gipfelbuch.ch",0],["gmuender-tagespost.de",0],["golem.de",[0,7,8]],["gruenderlexikon.de",0],["gusto.at",0],["gut-erklaert.de",0],["gutfuerdich.co",0],["hallo-muenchen.de",0],["hamburg.de",0],["hanauer.de",0],["hardwareluxx.de",0],["hartziv.org",0],["harzkurier.de",0],["haus-garten-test.de",0],["hausgarten.net",0],["haustec.de",0],["haz.de",0],["heidelberg24.de",0],["heilpraxisnet.de",0],["heise.de",0],["helmstedter-nachrichten.de",0],["hersfelder-zeitung.de",0],["hftg.co",0],["hifi-forum.de",0],["hna.de",0],["hochheimer-zeitung.de",0],["hoerzu.de",0],["hofheimer-zeitung.de",0],["iban-rechner.de",0],["ikz-online.de",0],["immobilienscout24.de",0],["ingame.de",0],["inside-digital.de",0],["inside-handy.de",0],["investor-verlag.de",0],["jappy.com",0],["jpgames.de",0],["kabeleins.de",0],["kachelmannwetter.com",0],["kamelle.de",0],["kicker.de",0],["kindergeld.org",0],["klettern-magazin.de",0],["klettern.de",0],["kochbar.de",0],["kreis-anzeiger.de",0],["kreisbote.de",0],["kreiszeitung.de",0],["ksta.de",0],["kurierverlag.de",0],["lachainemeteo.com",0],["lampertheimer-zeitung.de",0],["landwirt.com",0],["laut.de",0],["lauterbacher-anzeiger.de",0],["leckerschmecker.me",0],["leinetal24.de",0],["lesfoodies.com",0],["levif.be",0],["lifeline.de",0],["liga3-online.de",0],["likemag.com",0],["linux-community.de",0],["linux-magazin.de",0],["live.vodafone.de",0],["ln-online.de",0],["lokalo24.de",0],["lustaufsleben.at",0],["lustich.de",0],["lvz.de",0],["lz.de",0],["macwelt.de",0],["macworld.co.uk",0],["mail.de",0],["main-spitze.de",0],["manager-magazin.de",0],["manga-tube.me",0],["mathebibel.de",0],["mathepower.com",0],["maz-online.de",0],["medisite.fr",0],["mehr-tanken.de",0],["mein-kummerkasten.de",0],["mein-mmo.de",0],["mein-wahres-ich.de",0],["meine-anzeigenzeitung.de",0],["meinestadt.de",0],["menshealth.de",0],["mercato365.com",0],["merkur.de",0],["messen.de",0],["metal-hammer.de",0],["metalflirt.de",0],["meteologix.com",0],["minecraft-serverlist.net",0],["mittelbayerische.de",0],["modhoster.de",0],["moin.de",0],["mopo.de",0],["morgenpost.de",0],["motor-talk.de",0],["motorbasar.de",0],["motorradonline.de",0],["motorsport-total.com",0],["motortests.de",0],["mountainbike-magazin.de",0],["moviejones.de",0],["moviepilot.de",0],["mt.de",0],["mtb-news.de",0],["musiker-board.de",0],["musikexpress.de",0],["musikradar.de",0],["mz-web.de",0],["n-tv.de",0],["naumburger-tageblatt.de",0],["netzwelt.de",0],["neuepresse.de",0],["neueroeffnung.info",0],["news.at",0],["news.de",0],["news38.de",0],["newsbreak24.de",0],["nickles.de",0],["nicknight.de",0],["nl.hardware.info",0],["nn.de",0],["nnn.de",0],["nordbayern.de",0],["notebookchat.com",0],["notebookcheck-ru.com",0],["notebookcheck-tr.com",0],["noz-cdn.de",0],["noz.de",0],["nrz.de",0],["nw.de",0],["nwzonline.de",0],["oberhessische-zeitung.de",0],["och.to",0],["oeffentlicher-dienst.info",0],["onlinekosten.de",0],["onvista.de",0],["op-marburg.de",0],["op-online.de",0],["outdoor-magazin.com",0],["outdoorchannel.de",0],["paradisi.de",0],["pc-magazin.de",0],["pcgames.de",0],["pcgameshardware.de",0],["pcwelt.de",0],["pcworld.es",0],["peiner-nachrichten.de",0],["pferde.de",0],["pietsmiet.de",0],["pixelio.de",0],["pkw-forum.de",0],["playboy.de",0],["playfront.de",0],["pnn.de",0],["pons.com",0],["prad.de",[0,125]],["prignitzer.de",0],["profil.at",0],["promipool.de",0],["promobil.de",0],["prosiebenmaxx.de",0],["psychic.de",[0,149]],["quoka.de",0],["radio.at",0],["radio.de",0],["radio.dk",0],["radio.es",0],["radio.fr",0],["radio.it",0],["radio.net",0],["radio.pl",0],["radio.pt",0],["radio.se",0],["ran.de",0],["readmore.de",0],["rechtslupe.de",0],["recording.de",0],["rennrad-news.de",0],["reuters.com",0],["reviersport.de",0],["rhein-main-presse.de",0],["rheinische-anzeigenblaetter.de",0],["rimondo.com",0],["roadbike.de",0],["roemische-zahlen.net",0],["rollingstone.de",0],["rot-blau.com",0],["rp-online.de",0],["rtl.de",[0,282]],["rtv.de",0],["rugby365.fr",0],["ruhr24.de",0],["rundschau-online.de",0],["runnersworld.de",0],["safelist.eu",0],["salzgitter-zeitung.de",0],["sat1.de",0],["sat1gold.de",0],["schoener-wohnen.de",0],["schwaebische-post.de",0],["schwarzwaelder-bote.de",0],["serienjunkies.de",0],["shz.de",0],["sixx.de",0],["skodacommunity.de",0],["smart-wohnen.net",0],["sn.at",0],["sozialversicherung-kompetent.de",0],["spiegel.de",0],["spielen.de",0],["spieletipps.de",0],["spielfilm.de",0],["sport.de",0],["sport365.fr",0],["sportal.de",0],["spox.com",0],["stern.de",0],["stuttgarter-nachrichten.de",0],["stuttgarter-zeitung.de",0],["sueddeutsche.de",0],["svz.de",0],["szene1.at",0],["szene38.de",0],["t-online.de",0],["tagesspiegel.de",0],["taschenhirn.de",0],["techadvisor.co.uk",0],["techstage.de",0],["tele5.de",0],["the-voice-of-germany.de",0],["thueringen24.de",0],["tichyseinblick.de",0],["tierfreund.co",0],["tiervermittlung.de",0],["torgranate.de",0],["trend.at",0],["tv-media.at",0],["tvdigital.de",0],["tvinfo.de",0],["tvspielfilm.de",0],["tvtoday.de",0],["tz.de",0],["unicum.de",0],["unnuetzes.com",0],["unsere-helden.com",0],["unterhalt.net",0],["usinger-anzeiger.de",0],["usp-forum.de",0],["videogameszone.de",0],["vienna.at",0],["vip.de",0],["virtualnights.com",0],["vox.de",0],["wa.de",0],["wallstreet-online.de",[0,3]],["waz.de",0],["weather.us",0],["webfail.com",0],["weihnachten.me",0],["weihnachts-bilder.org",0],["weihnachts-filme.com",0],["welt.de",0],["weltfussball.at",0],["weristdeinfreund.de",0],["werkzeug-news.de",0],["werra-rundschau.de",0],["wetterauer-zeitung.de",0],["wiesbadener-kurier.de",0],["wiesbadener-tagblatt.de",0],["winboard.org",0],["windows-7-forum.net",0],["winfuture.de",0],["wintotal.de",0],["wlz-online.de",0],["wn.de",0],["wohngeld.org",0],["wolfenbuetteler-zeitung.de",0],["wolfsburger-nachrichten.de",0],["woman.at",0],["womenshealth.de",0],["wormser-zeitung.de",0],["woxikon.de",0],["wp.de",0],["wr.de",0],["yachtrevue.at",0],["ze.tt",0],["zeit.de",0],["meineorte.com",1],["osthessen-news.de",1],["techadvisor.com",1],["focus.de",1],["m.timesofindia.com",4],["timesofindia.indiatimes.com",4],["youmath.it",4],["redensarten-index.de",4],["lesoir.be",4],["electriciansforums.net",4],["keralatelecom.info",4],["betaseries.com",4],["free-sms-receive.com",4],["sms-receive-online.com",4],["universegunz.net",4],["happypenguin.altervista.org",4],["everyeye.it",4],["bluedrake42.com",4],["streamservicehd.click",4],["supermarioemulator.com",4],["futbollibrehd.com",4],["eska.pl",4],["eskarock.pl",4],["voxfm.pl",4],["mathaeser.de",4],["freethesaurus.com",6],["thefreedictionary.com",6],["hdbox.ws",8],["todopolicia.com",8],["scat.gold",8],["freecoursesite.com",8],["windowcleaningforums.co.uk",8],["cruisingearth.com",8],["hobby-machinist.com",8],["freegogpcgames.com",8],["starleaks.org",8],["latitude.to",8],["kitchennovel.com",8],["w3layouts.com",8],["blog.receivefreesms.co.uk",8],["eductin.com",8],["dealsfinders.blog",8],["audiobooks4soul.com",8],["tinhocdongthap.com",8],["sakarnewz.com",8],["downloadr.in",8],["topcomicporno.com",8],["dongknows.com",8],["traderepublic.community",8],["babia.to",8],["celtadigital.com",8],["iptvrun.com",8],["adsup.lk",8],["cryptomonitor.in",8],["areatopik.com",8],["cardscanner.co",8],["nullforums.net",8],["courseclub.me",8],["tamarindoyam.com",8],["jeep-cj.com",8],["choiceofmods.com",8],["myqqjd.com",8],["ssdtop.com",8],["apkhex.com",8],["gezegenforum.com",8],["mbc2.live",8],["iptvapps.net",8],["null-scripts.net",8],["nullscripts.net",8],["bloground.ro",8],["witcherhour.com",8],["ottverse.com",8],["torrentmac.net",8],["mazakony.com",8],["laptechinfo.com",8],["mc-at.org",8],["playstationhaber.com",8],["mangapt.com",8],["seriesperu.com",8],["pesprofessionals.com",8],["wpsimplehacks.com",8],["sportshub.to",[8,280]],["topsporter.net",[8,280]],["darkwanderer.net",8],["truckingboards.com",8],["coldfrm.org",8],["azrom.net",8],["freepatternsarea.com",8],["alttyab.net",8],["hq-links.com",8],["mobilkulup.com",8],["esopress.com",8],["nesiaku.my.id",8],["jipinsoft.com",8],["surfsees.com",8],["truthnews.de",8],["farsinama.com",8],["worldofiptv.com",8],["vuinsider.com",8],["crazydl.net",8],["gamemodsbase.com",8],["babiato.tech",8],["secuhex.com",8],["turkishaudiocenter.com",8],["galaxyos.net",8],["blackhatworld.com",8],["bizdustry.com",8],["storefront.com.ng",8],["pkbiosfix.com",8],["casi3.xyz",8],["mediafire.com",9],["wcoanimedub.tv",10],["wcoforever.net",10],["openspeedtest.com",10],["addtobucketlist.com",10],["3dzip.org",[10,79]],["ilmeteo.it",10],["wcoforever.com",10],["comprovendolibri.it",10],["healthelia.com",10],["keephealth.info",11],["afreesms.com",12],["kinoger.re",12],["laksa19.github.io",12],["javcl.com",12],["tvlogy.to",12],["live.dragaoconnect.net",12],["beststremo.com",12],["seznam.cz",12],["seznamzpravy.cz",12],["xerifetech.com",12],["wallpapershome.com",14],["anghami.com",15],["wired.com",16],["tutele.sx",17],["footyhunter3.xyz",17],["magesypro.pro",[18,19]],["audiotools.pro",19],["magesy.blog",[19,20,21]],["robloxscripts.com",20],["libreriamo.it",20],["postazap.com",20],["medebooks.xyz",20],["tutorials-technology.info",20],["mashtips.com",20],["marriedgames.com.br",20],["4allprograms.me",20],["nurgsm.com",20],["certbyte.com",20],["plugincrack.com",20],["gamingdeputy.com",20],["freewebcart.com",20],["katestube.com",22],["short.pe",22],["footystreams.net",22],["seattletimes.com",23],["bestgames.com",24],["yiv.com",24],["globalrph.com",25],["e-glossa.it",26],["webcheats.com.br",27],["gala.fr",29],["gentside.com",29],["geo.fr",29],["hbrfrance.fr",29],["nationalgeographic.fr",29],["ohmymag.com",29],["serengo.net",29],["vsd.fr",29],["updato.com",[30,47]],["methbox.com",31],["daizurin.com",31],["pendekarsubs.us",31],["dreamfancy.org",31],["rysafe.blogspot.com",31],["techacode.com",31],["toppng.com",31],["th-world.com",31],["avjamack.com",31],["avjamak.net",31],["dlhd.sx",32],["embedstream.me",32],["yts-subs.net",32],["cnnamador.com",33],["nudecelebforum.com",34],["pronpic.org",35],["thewebflash.com",36],["discordfastfood.com",36],["xup.in",36],["popularmechanics.com",37],["op.gg",38],["lequipe.fr",39],["comunidadgzone.es",40],["mp3fy.com",40],["lebensmittelpraxis.de",40],["ebookdz.com",40],["forum-pokemon-go.fr",40],["praxis-jugendarbeit.de",40],["gdrivez.xyz",40],["dictionnaire-medical.net",40],["cle0desktop.blogspot.com",40],["up-load.io",40],["direct-link.net",40],["direkt-wissen.com",40],["keysbrasil.blogspot.com",40],["hotpress.info",40],["turkleech.com",40],["anibatch.me",40],["anime-i.com",40],["plex-guide.de",40],["healthtune.site",40],["gewinde-normen.de",40],["tucinehd.com",40],["jellynote.com",41],["eporner.com",43],["pornbimbo.com",44],["allmonitors24.com",44],["4j.com",44],["avoiderrors.com",45],["cgtips.org",[45,227]],["sitarchive.com",45],["livenewsof.com",45],["topnewsshow.com",45],["gatcha.org",45],["empregoestagios.com",45],["everydayonsales.com",45],["kusonime.com",45],["aagmaal.xyz",45],["suicidepics.com",45],["codesnail.com",45],["codingshiksha.com",45],["graphicux.com",45],["asyadrama.com",45],["bitcoinegypt.news",45],["citychilli.com",45],["talkjarvis.com",45],["hdmotori.it",46],["femdomtb.com",48],["camhub.cc",48],["bobs-tube.com",48],["ru-xvideos.me",48],["pornfd.com",48],["popno-tour.net",48],["molll.mobi",48],["watchmdh.to",48],["camwhores.tv",48],["elfqrin.com",49],["satcesc.com",50],["apfelpatient.de",50],["lusthero.com",51],["m2list.com",52],["embed.nana2play.com",52],["elahmad.com",52],["dofusports.xyz",52],["dallasnews.com",53],["lnk.news",54],["lnk.parts",54],["efukt.com",55],["wendycode.com",55],["springfieldspringfield.co.uk",56],["porndoe.com",57],["smsget.net",[58,59]],["kjanime.net",60],["gioialive.it",61],["classicreload.com",62],["scriptzhub.com",62],["hotpornfile.org",63],["coolsoft.altervista.org",63],["hackedonlinegames.com",63],["jkoding.xyz",63],["settlersonlinemaps.com",63],["magdownload.org",63],["kpkuang.org",63],["shareus.site",63],["crypto4yu.com",63],["faucetwork.space",63],["thenightwithoutthedawn.blogspot.com",63],["entutes.com",63],["claimlite.club",63],["bazadecrypto.com",[63,328]],["chicoer.com",64],["bostonherald.com",64],["dailycamera.com",64],["maxcheaters.com",65],["rbxoffers.com",65],["mhn.quest",65],["leagueofgraphs.com",65],["hieunguyenphoto.com",65],["benzinpreis.de",65],["postimees.ee",65],["police.community",65],["gisarea.com",65],["schaken-mods.com",65],["theclashify.com",65],["txori.com",65],["olarila.com",65],["deletedspeedstreams.blogspot.com",65],["schooltravelorganiser.com",65],["xhardhempus.net",65],["sportsplays.com",66],["pornvideotop.com",68],["xstory-fr.com",68],["krotkoosporcie.pl",68],["deinesexfilme.com",69],["einfachtitten.com",69],["halloporno.com",69],["herzporno.com",69],["lesbenhd.com",69],["milffabrik.com",[69,256]],["porn-monkey.com",69],["porndrake.com",69],["pornhubdeutsch.net",69],["pornoaffe.com",69],["pornodavid.com",69],["pornoente.tv",[69,256]],["pornofisch.com",69],["pornofelix.com",69],["pornohammer.com",69],["pornohelm.com",69],["pornoklinge.com",69],["pornotom.com",[69,256]],["pornotommy.com",69],["pornovideos-hd.com",69],["pornozebra.com",[69,256]],["xhamsterdeutsch.xyz",69],["xnxx-sexfilme.com",69],["zerion.cc",69],["letribunaldunet.fr",70],["vladan.fr",70],["live-tv-channels.org",71],["eslfast.com",72],["freegamescasual.com",73],["tcpvpn.com",74],["oko.sh",74],["timesnownews.com",74],["timesnowhindi.com",74],["timesnowmarathi.com",74],["zoomtventertainment.com",74],["tsubasa.im",75],["xxxuno.com",76],["sholah.net",77],["2rdroid.com",77],["bisceglielive.it",78],["pandajogosgratis.com.br",80],["5278.cc",81],["altblogger.net",82],["hl-live.de",82],["wohnmobilforum.de",82],["nulledbear.com",82],["sinnerclownceviri.net",82],["satoshi-win.xyz",82],["encurtandourl.com",[82,142]],["freedeepweb.blogspot.com",82],["freesoft.id",82],["zcteam.id",82],["www-daftarharga.blogspot.com",82],["ear-phone-review.com",82],["telefullenvivo.com",82],["listatv.pl",82],["ltc-faucet.xyz",82],["coin-profits.xyz",82],["relampagomovies.com",82],["tonspion.de",84],["duplichecker.com",85],["plagiarismchecker.co",85],["plagiarismdetector.net",85],["searchenginereports.net",85],["giallozafferano.it",86],["autojournal.fr",86],["autoplus.fr",86],["sportauto.fr",86],["linkspaid.com",87],["proxydocker.com",87],["beeimg.com",[88,89]],["emturbovid.com",89],["findjav.com",89],["mmtv01.xyz",89],["stbturbo.xyz",89],["ftlauderdalebeachcam.com",90],["ftlauderdalewebcam.com",90],["juneauharborwebcam.com",90],["keywestharborwebcam.com",90],["kittycatcam.com",90],["mahobeachcam.com",90],["miamiairportcam.com",90],["morganhillwebcam.com",90],["njwildlifecam.com",90],["nyharborwebcam.com",90],["paradiseislandcam.com",90],["pompanobeachcam.com",90],["portbermudawebcam.com",90],["portcanaveralwebcam.com",90],["portevergladeswebcam.com",90],["portmiamiwebcam.com",90],["portnywebcam.com",90],["portnassauwebcam.com",90],["portstmaartenwebcam.com",90],["portstthomaswebcam.com",90],["porttampawebcam.com",90],["sxmislandcam.com",90],["themes-dl.com",90],["badassdownloader.com",90],["badasshardcore.com",90],["badassoftcore.com",90],["nulljungle.com",90],["teevee.asia",90],["otakukan.com",90],["gearingcommander.com",92],["generate.plus",93],["calculate.plus",93],["avcesar.com",94],["audiotag.info",95],["tudigitale.it",96],["ibcomputing.com",97],["legia.net",98],["acapellas4u.co.uk",99],["streamhentaimovies.com",100],["konten.co.id",101],["diariodenavarra.es",102],["tubereader.me",102],["scripai.com",102],["myfxbook.com",102],["whatfontis.com",102],["xiaomifans.pl",103],["eletronicabr.com",103],["optifine.net",104],["luzernerzeitung.ch",105],["tagblatt.ch",105],["spellcheck.net",106],["spellchecker.net",106],["spellweb.com",106],["ableitungsrechner.net",107],["alternet.org",108],["gourmetsupremacy.com",108],["shrib.com",109],["pandafiles.com",110],["vidia.tv",[110,131]],["hortonanderfarom.blogspot.com",110],["clarifystraight.com",110],["tutelehd3.xyz",111],["mega4upload.com",111],["coolcast2.com",111],["techclips.net",111],["earthquakecensus.com",111],["footyhunter.lol",111],["gamerarcades.com",111],["poscitech.click",111],["starlive.stream",111],["utopianwilderness.com",111],["wecast.to",111],["sportbar.live",111],["lordchannel.com",111],["play-old-pc-games.com",112],["tunovelaligera.com",113],["tapchipi.com",113],["cuitandokter.com",113],["tech-blogs.com",113],["cardiagn.com",113],["dcleakers.com",113],["esgeeks.com",113],["pugliain.net",113],["uplod.net",113],["worldfreeware.com",113],["fikiri.net",113],["myhackingworld.com",113],["phoenixfansub.com",113],["freecourseweb.com",114],["devcourseweb.com",114],["coursewikia.com",114],["courseboat.com",114],["coursehulu.com",114],["lne.es",118],["pornult.com",119],["webcamsdolls.com",119],["bitcotasks.com",[119,164]],["adsy.pw",119],["playstore.pw",119],["exactpay.online",119],["thothd.to",119],["proplanta.de",120],["hydrogenassociation.org",121],["ludigames.com",121],["sportitalialive.com",121],["made-by.org",121],["xenvn.com",121],["worldtravelling.com",121],["igirls.in",121],["technichero.com",121],["roshiyatech.my.id",121],["24sport.stream",121],["aeroxplorer.com",121],["mad4wheels.com",122],["logi.im",122],["emailnator.com",122],["textograto.com",123],["voyageforum.com",124],["hmc-id.blogspot.com",124],["jemerik.com",124],["myabandonware.com",124],["chatta.it",126],["ketubanjiwa.com",127],["nsfw247.to",128],["funzen.net",128],["fighter.stream",128],["ilclubdellericette.it",128],["hubstream.in",128],["extremereportbot.com",129],["getintopc.com",130],["qoshe.com",132],["lowellsun.com",133],["mamadu.pl",133],["dobrapogoda24.pl",133],["motohigh.pl",133],["namasce.pl",133],["ultimate-catch.eu",134],["cpopchanelofficial.com",135],["creditcardgenerator.com",136],["creditcardrush.com",136],["bostoncommons.net",136],["thejobsmovie.com",136],["livsavr.co",136],["nilopolisonline.com.br",137],["mesquitaonline.com",137],["yellowbridge.com",137],["socialgirls.im",138],["yaoiotaku.com",139],["camhub.world",140],["moneyhouse.ch",141],["ihow.info",142],["filesus.com",142],["sturls.com",142],["re.two.re",142],["turbo1.co",142],["cartoonsarea.xyz",142],["valeronevijao.com",143],["cigarlessarefy.com",143],["figeterpiazine.com",143],["yodelswartlike.com",143],["generatesnitrosate.com",143],["crownmakermacaronicism.com",143],["chromotypic.com",143],["gamoneinterrupted.com",143],["metagnathtuggers.com",143],["wolfdyslectic.com",143],["rationalityaloelike.com",143],["sizyreelingly.com",143],["simpulumlamerop.com",143],["urochsunloath.com",143],["monorhinouscassaba.com",143],["counterclockwisejacky.com",143],["35volitantplimsoles5.com",143],["scatch176duplicities.com",143],["antecoxalbobbing1010.com",143],["boonlessbestselling244.com",143],["cyamidpulverulence530.com",143],["guidon40hyporadius9.com",143],["449unceremoniousnasoseptal.com",143],["19turanosephantasia.com",143],["30sensualizeexpression.com",143],["321naturelikefurfuroid.com",143],["745mingiestblissfully.com",143],["availedsmallest.com",143],["greaseball6eventual20.com",143],["toxitabellaeatrebates306.com",143],["20demidistance9elongations.com",143],["audaciousdefaulthouse.com",143],["fittingcentermondaysunday.com",143],["fraudclatterflyingcar.com",143],["launchreliantcleaverriver.com",143],["matriculant401merited.com",143],["realfinanceblogcenter.com",143],["reputationsheriffkennethsand.com",143],["telyn610zoanthropy.com",143],["tubelessceliolymph.com",143],["tummulerviolableness.com",143],["un-block-voe.net",143],["v-o-e-unblock.com",143],["voe-un-block.com",143],["voeun-block.net",143],["voeunbl0ck.com",143],["voeunblck.com",143],["voeunblk.com",143],["voeunblock.com",143],["voeunblock1.com",143],["voeunblock2.com",143],["voeunblock3.com",143],["agefi.fr",144],["cariskuy.com",145],["letras2.com",145],["yusepjaelani.blogspot.com",146],["letras.mus.br",147],["mtlurb.com",148],["port.hu",149],["acdriftingpro.com",149],["flight-report.com",149],["forumdz.com",149],["abandonmail.com",149],["flmods.com",149],["zilinak.sk",149],["projectfreetv.stream",149],["hotdesimms.com",149],["pdfaid.com",149],["mconverter.eu",149],["dzeko11.net",[149,280]],["bootdey.com",149],["mail.com",149],["expresskaszubski.pl",149],["moegirl.org.cn",149],["onemanhua.com",150],["t3n.de",151],["allindiaroundup.com",152],["vectorizer.io",153],["smgplaza.com",153],["onehack.us",153],["thapcam.net",153],["thefastlaneforum.com",154],["trade2win.com",155],["modagamers.com",156],["freemagazines.top",156],["straatosphere.com",156],["rule34porn.net",156],["nullpk.com",156],["adslink.pw",156],["downloadudemy.com",156],["picgiraffe.com",156],["weadown.com",156],["freepornsex.net",156],["nurparatodos.com.ar",156],["librospreuniversitariospdf.blogspot.com",157],["msdos-games.com",157],["blocklayer.com",157],["forexeen.us",157],["khsm.io",157],["webcreator-journal.com",157],["nu6i-bg-net.com",157],["routech.ro",158],["hokej.net",158],["turkmmo.com",159],["palermotoday.it",160],["baritoday.it",160],["trentotoday.it",160],["agrigentonotizie.it",160],["anconatoday.it",160],["arezzonotizie.it",160],["avellinotoday.it",160],["bresciatoday.it",160],["brindisireport.it",160],["casertanews.it",160],["cataniatoday.it",160],["cesenatoday.it",160],["chietitoday.it",160],["forlitoday.it",160],["frosinonetoday.it",160],["genovatoday.it",160],["ilpescara.it",160],["ilpiacenza.it",160],["latinatoday.it",160],["lecceprima.it",160],["leccotoday.it",160],["livornotoday.it",160],["messinatoday.it",160],["milanotoday.it",160],["modenatoday.it",160],["monzatoday.it",160],["novaratoday.it",160],["padovaoggi.it",160],["parmatoday.it",160],["perugiatoday.it",160],["pisatoday.it",160],["quicomo.it",160],["ravennatoday.it",160],["reggiotoday.it",160],["riminitoday.it",160],["romatoday.it",160],["salernotoday.it",160],["sondriotoday.it",160],["sportpiacenza.it",160],["ternitoday.it",160],["today.it",160],["torinotoday.it",160],["trevisotoday.it",160],["triesteprima.it",160],["udinetoday.it",160],["veneziatoday.it",160],["vicenzatoday.it",160],["thumpertalk.com",161],["arkcod.org",161],["facciabuco.com",162],["softx64.com",163],["thelayoff.com",164],["manwan.xyz",164],["blog.coinsrise.net",164],["blog.cryptowidgets.net",164],["blog.insurancegold.in",164],["blog.wiki-topia.com",164],["blog.coinsvalue.net",164],["blog.cookinguide.net",164],["blog.freeoseocheck.com",164],["blog.makeupguide.net",164],["blog.carstopia.net",164],["blog.carsmania.net",164],["shorterall.com",164],["blog24.me",164],["maxstream.video",164],["maxlinks.online",164],["tvepg.eu",164],["pstream.net",165],["dailymaverick.co.za",166],["apps2app.com",167],["cheatermad.com",168],["ville-ideale.fr",169],["eodev.com",170],["tickzoo.tv",171],["fm-arena.com",172],["tradersunion.com",173],["tandess.com",174],["faqwiki.us",175],["sonixgvn.net",175],["spontacts.com",176],["dankmemer.lol",177],["apkmoddone.com",178],["getexploits.com",179],["fplstatistics.com",180],["breitbart.com",181],["salidzini.lv",182],["choosingnothing.com",183],["cryptorank.io",[184,185]],["th.gl",186],["4kwebplay.xyz",187],["qqwebplay.xyz",187],["viwlivehdplay.ru",187],["molbiotools.com",188],["vods.tv",189],["18xxx.xyz",190],["raidrush.net",191],["xnxxcom.xyz",192],["videzz.net",193],["spambox.xyz",194],["starkroboticsfrc.com",195],["sinonimos.de",195],["antonimos.de",195],["quesignifi.ca",195],["tiktokrealtime.com",195],["tiktokcounter.net",195],["tpayr.xyz",195],["poqzn.xyz",195],["ashrfd.xyz",195],["rezsx.xyz",195],["tryzt.xyz",195],["ashrff.xyz",195],["rezst.xyz",195],["dawenet.com",195],["erzar.xyz",195],["waezm.xyz",195],["waezg.xyz",195],["cryptednews.space",195],["vivuq.com",195],["swgop.com",195],["vbnmll.com",195],["telcoinfo.online",195],["dshytb.com",195],["enit.in",196],["financerites.com",196],["fadedfeet.com",197],["homeculina.com",197],["ineedskin.com",197],["kenzo-flowertag.com",197],["lawyex.co",197],["mdn.lol",197],["bitzite.com",198],["coingraph.us",199],["impact24.us",199],["apkmodvn.com",200],["mod1s.com",200],["dl.apkmoddone.com",201],["my-code4you.blogspot.com",202],["vrcmods.com",203],["osuskinner.com",203],["osuskins.net",203],["pentruea.com",[204,205]],["mchacks.net",206],["why-tech.it",207],["compsmag.com",208],["tapetus.pl",209],["gaystream.online",210],["bembed.net",210],["elbailedeltroleo.site",210],["embedv.net",210],["fslinks.org",210],["listeamed.net",210],["v6embed.xyz",210],["vgplayer.xyz",210],["vid-guard.com",210],["autoroad.cz",211],["brawlhalla.fr",211],["tecnobillo.com",211],["sexcamfreeporn.com",212],["breatheheavy.com",213],["wenxuecity.com",214],["key-hub.eu",215],["fabioambrosi.it",216],["tattle.life",217],["emuenzen.de",217],["terrylove.com",217],["mynet.com",218],["cidade.iol.pt",219],["fantacalcio.it",220],["hentaifreak.org",221],["hypebeast.com",222],["krankheiten-simulieren.de",223],["catholic.com",224],["ad-doge.com",225],["3dmodelshare.org",226],["gourmetscans.net",227],["techinferno.com",228],["ibeconomist.com",229],["bookriot.com",230],["purposegames.com",231],["schoolcheats.net",231],["globo.com",232],["latimes.com",232],["claimrbx.gg",233],["perelki.net",234],["vpn-anbieter-vergleich-test.de",235],["livingincebuforums.com",236],["paperzonevn.com",237],["alltechnerd.com",238],["malaysianwireless.com",239],["erinsakura.com",240],["infofuge.com",240],["freejav.guru",240],["novelmultiverse.com",240],["fritidsmarkedet.dk",241],["maskinbladet.dk",241],["15min.lt",242],["baddiehub.com",243],["mr9soft.com",244],["21porno.com",245],["adult-sex-gamess.com",246],["hentaigames.app",246],["mobilesexgamesx.com",246],["mysexgamer.com",246],["porngameshd.com",246],["sexgamescc.com",246],["xnxx-sex-videos.com",246],["f2movies.to",247],["freeporncave.com",248],["tubsxxx.com",249],["pornojenny.com",250],["subtitle.one",251],["manga18fx.com",252],["freebnbcoin.com",252],["sextvx.com",253],["studydhaba.com",254],["freecourse.tech",254],["victor-mochere.com",254],["papunika.com",254],["mobilanyheter.net",254],["prajwaldesai.com",[254,273]],["ftuapps.dev",254],["muztext.com",255],["pornohans.com",256],["nursexfilme.com",256],["pornohirsch.net",256],["xhamster-sexvideos.com",256],["pornoschlange.com",256],["hdpornos.net",256],["gutesexfilme.com",256],["short1.site",256],["zona-leros.com",256],["charbelnemnom.com",257],["simplebits.io",258],["online-fix.me",259],["gamersdiscussionhub.com",260],["owlzo.com",261],["q1003.com",262],["blogpascher.com",263],["testserver.pro",264],["lifestyle.bg",264],["money.bg",264],["news.bg",264],["topsport.bg",264],["webcafe.bg",264],["mgnet.xyz",265],["advertiserandtimes.co.uk",266],["xvideos2020.me",267],["111.90.159.132",268],["techsolveprac.com",269],["joomlabeginner.com",270],["largescaleforums.com",271],["dubznetwork.com",272],["hentaidexy.com",274],["code2care.org",275],["xxxxsx.com",277],["ngontinh24.com",278],["idevicecentral.com",279],["zona11.com",280],["scsport.live",280],["thesaurus.net",281],["mangacrab.com",283],["idnes.cz",284],["viefaucet.com",285],["cloud-computing-central.com",286],["afk.guide",287],["businessnamegenerator.com",288],["derstandard.at",289],["derstandard.de",289],["rocketnews24.com",290],["soranews24.com",290],["youpouch.com",290],["ilsole24ore.com",291],["ipacrack.com",292],["hentaiporn.one",293],["infokik.com",294],["daemonanime.net",295],["daemon-hentai.com",295],["deezer.com",296],["fosslinux.com",297],["shrdsk.me",298],["examword.com",299],["sempreupdate.com.br",299],["tribuna.com",300],["trendsderzukunft.de",301],["gal-dem.com",301],["lostineu.eu",301],["oggitreviso.it",301],["speisekarte.de",301],["mixed.de",301],["lightnovelspot.com",[302,303]],["lightnovelworld.com",[302,303]],["novelpub.com",[302,303]],["webnovelpub.com",[302,303]],["mail.yahoo.com",304],["hwzone.co.il",305],["nammakalvi.com",306],["javmoon.me",307],["c2g.at",308],["terafly.me",308],["elamigos-games.com",308],["elamigos-games.net",308],["dktechnicalmate.com",309],["recipahi.com",309],["converter-btc.world",309],["kaystls.site",310],["aquarius-horoscopes.com",311],["cancer-horoscopes.com",311],["dubipc.blogspot.com",311],["echoes.gr",311],["engel-horoskop.de",311],["freegames44.com",311],["fuerzasarmadas.eu",311],["gemini-horoscopes.com",311],["jurukunci.net",311],["krebs-horoskop.com",311],["leo-horoscopes.com",311],["maliekrani.com",311],["nklinks.click",311],["ourenseando.es",311],["pisces-horoscopes.com",311],["radio-en-direct.fr",311],["sagittarius-horoscopes.com",311],["scorpio-horoscopes.com",311],["singlehoroskop-loewe.de",311],["skat-karten.de",311],["skorpion-horoskop.com",311],["taurus-horoscopes.com",311],["the1security.com",311],["torrentmovies.online",311],["virgo-horoscopes.com",311],["zonamarela.blogspot.com",311],["yoima.hatenadiary.com",311],["vpntester.org",312],["watchhentai.net",313],["japscan.lol",314],["digitask.ru",315],["tempumail.com",316],["sexvideos.host",317],["10alert.com",319],["cryptstream.de",320],["nydus.org",320],["techhelpbd.com",321],["fapdrop.com",322],["cellmapper.net",323],["hdrez.com",324],["youwatch-serie.com",324],["newscon.org",325],["printablecreative.com",326],["comohoy.com",327],["leak.sx",327],["paste.bin.sx",327],["pornleaks.in",327],["merlininkazani.com",327],["j91.asia",329],["jeniusplay.com",330],["indianyug.com",331],["rgb.vn",331],["needrom.com",332],["criptologico.com",333],["megadrive-emulator.com",334],["eromanga-show.com",335],["hentai-one.com",335],["hentaipaw.com",335],["10minuteemails.com",336],["luxusmail.org",336],["w3cub.com",337],["bangpremier.com",338],["nyaa.iss.ink",339],["tnp98.xyz",341],["freepdfcomic.com",342],["memedroid.com",343],["animesync.org",344],["karaoketexty.cz",345],["filmizlehdfilm.com",346],["fullfilmizle.cc",346],["resortcams.com",347],["mjakmama24.pl",349],["security-demo.extrahop.com",350],["lastampa.it",351],["freemcserver.net",352],["kimcartoon.li",353],["kc.linksgen.com",353],["kisscartoon.se",353]]);

const entitiesMap = new Map([["comunio",0],["finanzen",[0,5]],["gameswelt",0],["heftig",0],["notebookcheck",0],["testedich",0],["transfermarkt",0],["truckscout24",0],["tvtv",0],["wetteronline",0],["wieistmeineip",0],["wetter",2],["1337x",4],["eztv",4],["sushi-scan",8],["spigotunlocked",8],["ahmedmode",8],["kissasian",11],["rp5",12],["mma-core",13],["yts",17],["720pstream",17],["1stream",17],["magesy",18],["shortzzy",20],["thefmovies",22],["urlcero",28],["totaldebrid",31],["sandrives",31],["fxporn69",40],["aliancapes",40],["pouvideo",42],["povvideo",42],["povw1deo",42],["povwideo",42],["powv1deo",42],["powvibeo",42],["powvideo",42],["powvldeo",42],["tubsexer",48],["porno-tour",48],["lenkino",48],["pornomoll",48],["camsclips",48],["m4ufree",52],["writedroid",63],["telerium",67],["pandafreegames",83],["thoptv",91],["streameast",111],["thestreameast",111],["daddylivehd",111],["solvetube",115],["hdfilme",116],["pornhub",117],["wcofun",124],["bollyholic",128],["gotxx",142],["turkanime",143],["voe-unblock",143],["khatrimaza",156],["pogolinks",156],["popcornstream",158],["brainly",170],["oploverz",171],["vembed",210],["xhamsterdeutsch",256],["privatemoviez",260],["gmx",276],["lightnovelpub",[302,303]],["camcaps",318],["drivebot",340],["thenextplanet1",341],["filmizletv",346],["autoscout24",348]]);

const exceptionsMap = new Map([["panel.freemcserver.net",[352]]]);

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
        'Object_defineProperties': Object.defineProperties.bind(Object),
        'Object_fromEntries': Object.fromEntries.bind(Object),
        'Object_getOwnPropertyDescriptor': Object.getOwnPropertyDescriptor.bind(Object),
        'RegExp': self.RegExp,
        'RegExp_test': self.RegExp.prototype.test,
        'RegExp_exec': self.RegExp.prototype.exec,
        'Request_clone': self.Request.prototype.clone,
        'String_fromCharCode': String.fromCharCode,
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
