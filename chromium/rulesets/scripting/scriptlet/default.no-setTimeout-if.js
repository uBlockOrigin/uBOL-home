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

const argsList = [["push","500"],[".call(null)","10"],[".call(null)"],["(null)","10"],["userHasAdblocker"],["objSubPromo"],["adb"],["nrWrapper"],["warn"],["adBlockerDetected"],["show"],["InfMediafireMobileFunc","1000"],["google_jobrunner"],["()","45000"],["0x"],["displayAdBlockedVideo"],[".adsbygoogle"],["isDesktopApp","1000"],["Bait"],["admc"],["AdBlocker"],["Blocked"],["ai_adb"],["match","100"],["'0x"],["apstagLOADED"],["/Adb|moneyDetect/"],["disableDeveloper"],["Blocco","2000"],["test","0"],["checkAdblockUser","1000"],["checkPub","6000"],["document.querySelector","5000"],["nextFunction","250"],["popup"],["()","150"],["backRedirect"],["document.querySelectorAll","1000"],["style"],["clientHeight"],["addEventListener","0"],["adblock","2000"],["start","0"],["nextFunction","2000"],["byepopup","5000"],["test.remove","100"],["additional_src","300"],["()","2000"],["css_class.show"],["CANG","3000"],["updato-overlay","500"],["innerText","2000"],["alert","8000"],["css_class"],["()","50"],["debugger"],["initializeCourier","3000"],["redirectPage"],["_0x","2000"],["ads","750"],["location.href","500"],["Adblock","5000"],["disable","200"],["CekAab","0"],["rbm_block_active","1000"],["show()"],["_0x"],["n.trigger","1"],["adblock"],["abDetected"],["KeepOpeningPops","1000"],["location.href"],["appendChild"],["adb","0"],["adBlocked"],["warning","100"],["adblock_popup","500"],["Adblock"],["#chatWrap","1000"],["keep-ads","2000"],["#rbm_block_active","1000"],["null","4000"],["()","2500"],["myaabpfun","3000"],["nextFunction"],["adFilled","2500"],["()","15000"],["showPopup"],["()","1"],["()","1000"],["document.cookie","2500"],["window.open"],["innerHTML"],["readyplayer","2000"],["checkStopBlock"],["adspot_top","1500"],["/offsetHeight|google|Global/"],["an_message","500"],["Adblocker","10000"],["timeoutChecker"],["bait","1"],["pum-open"],["overlay","2000"],["/adblock/i"],["test","100"],["Math.round","1000"],["adblock","5"],["bioEp"],["ag_adBlockerDetected"],["null"],["adb","6000"],["pop"],["sadbl"],["checkAdStatus"],["mdp"],["brave_load_popup"],["0x","3000"],["invoke"],["adsbytrafficjunkycontext"],["ipod"],["offsetWidth"],["/$|adBlock/"],["ads"],["adsbygoogle"],["()"],["AdBlock"],["stop-scrolling"],["Adv"],["blockUI","2000"],["mdpDeBlocker"],["/_0x|debug/"],["/ai_adb|_0x/"],["iframe"],["adBlock"],["","1"],["undefined"],["check","1"],["adsBlocked"],["blocker"],["aswift_"],["afs_ads","2000"],["visibility","2000"],["bait"],["getComputedStyle","250"],["blocked"],["{r()","0"],["nextFunction","450"],["Debug"],["r()","0"],["purple_box"],["offsetHeight"],["checkSiteNormalLoad"],["adBlockOverlay"],["Detected","500"],["modal"],[".show","1000"],[".show"],["showModal"],["getComputedStyle"],["blur"],["samOverlay"],["bADBlock"],["location"],["","4000"],["blocker","100"],["alert"],["length"],["t()","0"],["$"],["offset"],["contrformpub"],["trigger","0"],["getComputedStyle","2000"],["video-popup"],["detectAdblock"],["EzoIvent"],["detectAdBlocker"],["nads"],["1e3*"],["current.children"],["adStatus"],["BN_CAMPAIGNS"],["media_place_list"],["cvad"],["...","300"],["error"],["stackTrace"],["inner-ad"],["_ET"],[".clientHeight"],["getComputedStyle(el)"],["","5"],["/adblock|isRequestPresent/"],["_0x","500"],["isRequestPresent"],["offsetLeft"],["height"],["mdp_deblocker"],["charAt"],["checkAds"],["fadeIn","0"],["jQuery"],["/^/"],["afterOpen"],["check"],["Adblocker"],["eabdModal"],["ab_root.show"],["gaData"],["ad"],["prompt","1000"],["googlefc"],["adblock detection"],[".offsetHeight","100"],["popState"],["ad-block-popup"],["exitTimer"],["innerHTML.replace"],["ab","2000"],["data?","4000"],[".data?"],["eabpDialog"],["adsense"],["/Adblock|_ad_/"],["googletag"],["f.parentNode.removeChild(f)","100"],["swal","500"],["keepChecking","1000"],["openPopup"],[".offsetHeight"],["()=>{"],["nitroAds"],["class.scroll","1000"],["disableDeveloperTools"],["Check"],["insertBefore"],["css_class.scroll"],["/null|Error/","10000"],["window.location.href","50"],["/out.php"],["/0x|devtools/"],["location.replace","300"],["window.location.href"],["checkVisible"],["_0x","3000"],["fetch"],["window.location.href=link"],["ai_"],["reachGoal"],["Adb"],["ai"],["","3000"],["/width|innerHTML/"],["magnificPopup"],["adblockEnabled"],["google_ad"],["document.location"],["google"],["top-right","2000"],["enforceAdStatus"],["loadScripts"],["mfp"],["display","5000"],["eb"],[").show()"],["","1000"],["site-access"],["atob"],["Msg"],["UABP"],["href"],["aaaaa-modal"],["\\x63"],["()=>"],["keepChecking"],["null","10"],["","500"],["/Adform|didomi|adblock|forEach/"],["showAdblock"],["-0x"],["display"],["gclid"],["event","3000"],["rejectWith"],["refresh"],["location.href","3000"],["window.location"],["ga"],["adbl"],["Ads"],["ShowAdBLockerNotice"],["ad_listener"],["open"],["(!0)"],["Delay"],["/appendChild|e\\(\"/"],["=>"],["ADB"],["site-access-popup"],["data?"],["/debugger|UserCustomPop/"],["checkAdblockUser"],["offsetHeight","100"],["AdDetect"],["displayMessage","2000"],["/salesPopup|mira-snackbar/"],["advanced"],["detectImgLoad"],["offsetHeight","200"],["detector"],["replace"],["touchstart"],["siteAccessFlag"],["ab"],["/adblocker|alert/"],["redURL"],["/children\\('ins'\\)|Adblock|adsbygoogle/"],["displayMessage"],["chkADB"],["onDetected"],["myinfoey","1500"],["fuckadb"],["detect"],["siteAccessPopup"],["/adsbygoogle|adblock/"],["akadb"],["biteDisplay"],["/[a-z]\\(!0\\)/","800"],["ad_block"],["/detectAdBlocker|window.open/"],["adBlockDetected"],["popUnder"],["/GoToURL|delay/"],["window.location.href","300"],["ad_display"],["/adScriptPath|MMDConfig/"],["0x","100"],["/native|\\{n\\(\\)/"],["adblocker"],["/Detect|adblock|style\\.display|\\[native code]|\\.call\\(null\\)/"],["removeChild"],["ad blocker"]];

const hostnamesMap = new Map([["4-liga.com",1],["4fansites.de",1],["4players.de",1],["9monate.de",1],["aachener-nachrichten.de",1],["aachener-zeitung.de",1],["abendblatt.de",1],["abendzeitung-muenchen.de",1],["about-drinks.com",1],["abseits-ka.de",1],["airliners.de",1],["ajaxshowtime.com",1],["allgemeine-zeitung.de",1],["alpin.de",1],["antenne.de",1],["arcor.de",1],["areadvd.de",1],["areamobile.de",1],["ariva.de",1],["astronews.com",1],["aussenwirtschaftslupe.de",1],["auszeit.bio",1],["auto-motor-und-sport.de",1],["auto-service.de",1],["autobild.de",1],["autoextrem.de",1],["autopixx.de",1],["autorevue.at",1],["az-online.de",1],["baby-vornamen.de",1],["babyclub.de",1],["bafoeg-aktuell.de",1],["berliner-kurier.de",1],["berliner-zeitung.de",1],["bigfm.de",1],["bikerszene.de",1],["bildderfrau.de",1],["blackd.de",1],["blick.de",1],["boerse-online.de",1],["boerse.de",1],["boersennews.de",1],["braunschweiger-zeitung.de",1],["brieffreunde.de",1],["brigitte.de",1],["buerstaedter-zeitung.de",1],["buffed.de",1],["businessinsider.de",1],["buzzfeed.at",1],["buzzfeed.de",1],["caravaning.de",1],["cavallo.de",1],["chefkoch.de",1],["cinema.de",1],["clever-tanken.de",1],["computerbild.de",1],["computerhilfen.de",1],["comunio-cl.com",1],["connect.de",1],["chip.de",1],["da-imnetz.de",1],["dasgelbeblatt.de",1],["dbna.com",1],["dbna.de",1],["deichstube.de",1],["deine-tierwelt.de",1],["der-betze-brennt.de",1],["derwesten.de",1],["desired.de",1],["dhd24.com",1],["dieblaue24.com",1],["digitalfernsehen.de",1],["dnn.de",1],["donnerwetter.de",1],["e-hausaufgaben.de",1],["e-mountainbike.com",1],["eatsmarter.de",1],["echo-online.de",1],["ecomento.de",1],["einfachschoen.me",1],["elektrobike-online.com",1],["eltern.de",1],["epochtimes.de",1],["essen-und-trinken.de",1],["express.de",1],["extratipp.com",1],["familie.de",1],["fanfiktion.de",1],["fehmarn24.de",1],["fettspielen.de",1],["fid-gesundheitswissen.de",1],["finanznachrichten.de",1],["finanztreff.de",1],["finya.de",1],["firmenwissen.de",1],["fitforfun.de",1],["fnp.de",1],["football365.fr",1],["formel1.de",1],["fr.de",1],["frankfurter-wochenblatt.de",1],["freenet.de",1],["fremdwort.de",1],["froheweihnachten.info",1],["frustfrei-lernen.de",1],["fuldaerzeitung.de",1],["funandnews.de",1],["fussballdaten.de",1],["futurezone.de",1],["gala.de",1],["gamepro.de",1],["gamersglobal.de",1],["gamesaktuell.de",1],["gamestar.de",1],["gamezone.de",1],["gartendialog.de",1],["gartenlexikon.de",1],["gedichte.ws",1],["geissblog.koeln",1],["gelnhaeuser-tageblatt.de",1],["general-anzeiger-bonn.de",1],["geniale-tricks.com",1],["genialetricks.de",1],["gesund-vital.de",1],["gesundheit.de",1],["gevestor.de",1],["gewinnspiele.tv",1],["giessener-allgemeine.de",1],["giessener-anzeiger.de",1],["gifhorner-rundschau.de",1],["giga.de",1],["gipfelbuch.ch",1],["gmuender-tagespost.de",1],["golem.de",[1,9,10]],["gruenderlexikon.de",1],["gusto.at",1],["gut-erklaert.de",1],["gutfuerdich.co",1],["hallo-muenchen.de",1],["hamburg.de",1],["hanauer.de",1],["hardwareluxx.de",1],["hartziv.org",1],["harzkurier.de",1],["haus-garten-test.de",1],["hausgarten.net",1],["haustec.de",1],["haz.de",1],["heidelberg24.de",1],["heilpraxisnet.de",1],["heise.de",1],["helmstedter-nachrichten.de",1],["hersfelder-zeitung.de",1],["hftg.co",1],["hifi-forum.de",1],["hna.de",1],["hochheimer-zeitung.de",1],["hoerzu.de",1],["hofheimer-zeitung.de",1],["iban-rechner.de",1],["ikz-online.de",1],["immobilienscout24.de",1],["ingame.de",1],["inside-digital.de",1],["inside-handy.de",1],["investor-verlag.de",1],["jappy.com",1],["jpgames.de",1],["kabeleins.de",1],["kachelmannwetter.com",1],["kamelle.de",1],["kicker.de",1],["kindergeld.org",1],["klettern-magazin.de",1],["klettern.de",1],["kochbar.de",1],["kreis-anzeiger.de",1],["kreisbote.de",1],["kreiszeitung.de",1],["ksta.de",1],["kurierverlag.de",1],["lachainemeteo.com",1],["lampertheimer-zeitung.de",1],["landwirt.com",1],["laut.de",1],["lauterbacher-anzeiger.de",1],["leckerschmecker.me",1],["leinetal24.de",1],["lesfoodies.com",1],["levif.be",1],["lifeline.de",1],["liga3-online.de",1],["likemag.com",1],["linux-community.de",1],["linux-magazin.de",1],["live.vodafone.de",1],["ln-online.de",1],["lokalo24.de",1],["lustaufsleben.at",1],["lustich.de",1],["lvz.de",1],["lz.de",1],["macwelt.de",1],["macworld.co.uk",1],["mail.de",1],["main-spitze.de",1],["manager-magazin.de",1],["manga-tube.me",1],["mathebibel.de",1],["mathepower.com",1],["maz-online.de",1],["medisite.fr",1],["mehr-tanken.de",1],["mein-kummerkasten.de",1],["mein-mmo.de",1],["mein-wahres-ich.de",1],["meine-anzeigenzeitung.de",1],["meinestadt.de",1],["menshealth.de",1],["mercato365.com",1],["merkur.de",1],["messen.de",1],["metal-hammer.de",1],["metalflirt.de",1],["meteologix.com",1],["minecraft-serverlist.net",1],["mittelbayerische.de",1],["modhoster.de",1],["moin.de",1],["mopo.de",1],["morgenpost.de",1],["motor-talk.de",1],["motorbasar.de",1],["motorradonline.de",1],["motorsport-total.com",1],["motortests.de",1],["mountainbike-magazin.de",1],["moviejones.de",1],["moviepilot.de",1],["mt.de",1],["mtb-news.de",1],["musiker-board.de",1],["musikexpress.de",1],["musikradar.de",1],["mz-web.de",1],["n-tv.de",1],["naumburger-tageblatt.de",1],["netzwelt.de",1],["neuepresse.de",1],["neueroeffnung.info",1],["news.at",1],["news.de",1],["news38.de",1],["newsbreak24.de",1],["nickles.de",1],["nicknight.de",1],["nl.hardware.info",1],["nn.de",1],["nnn.de",1],["nordbayern.de",1],["notebookchat.com",1],["notebookcheck-ru.com",1],["notebookcheck-tr.com",1],["noz-cdn.de",1],["noz.de",1],["nrz.de",1],["nw.de",1],["nwzonline.de",1],["oberhessische-zeitung.de",1],["och.to",1],["oeffentlicher-dienst.info",1],["onlinekosten.de",1],["onvista.de",1],["op-marburg.de",1],["op-online.de",1],["outdoor-magazin.com",1],["outdoorchannel.de",1],["paradisi.de",1],["pc-magazin.de",1],["pcgames.de",1],["pcgameshardware.de",1],["pcwelt.de",1],["pcworld.es",1],["peiner-nachrichten.de",1],["pferde.de",1],["pietsmiet.de",1],["pixelio.de",1],["pkw-forum.de",1],["playboy.de",1],["playfront.de",1],["pnn.de",1],["pons.com",1],["prad.de",[1,126]],["prignitzer.de",1],["profil.at",1],["promipool.de",1],["promobil.de",1],["prosiebenmaxx.de",1],["psychic.de",[1,150]],["quoka.de",1],["radio.at",1],["radio.de",1],["radio.dk",1],["radio.es",1],["radio.fr",1],["radio.it",1],["radio.net",1],["radio.pl",1],["radio.pt",1],["radio.se",1],["ran.de",1],["readmore.de",1],["rechtslupe.de",1],["recording.de",1],["rennrad-news.de",1],["reuters.com",1],["reviersport.de",1],["rhein-main-presse.de",1],["rheinische-anzeigenblaetter.de",1],["rimondo.com",1],["roadbike.de",1],["roemische-zahlen.net",1],["rollingstone.de",1],["rot-blau.com",1],["rp-online.de",1],["rtl.de",[1,275]],["rtv.de",1],["rugby365.fr",1],["ruhr24.de",1],["rundschau-online.de",1],["runnersworld.de",1],["safelist.eu",1],["salzgitter-zeitung.de",1],["sat1.de",1],["sat1gold.de",1],["schoener-wohnen.de",1],["schwaebische-post.de",1],["schwarzwaelder-bote.de",1],["serienjunkies.de",1],["shz.de",1],["sixx.de",1],["skodacommunity.de",1],["smart-wohnen.net",1],["sn.at",1],["sozialversicherung-kompetent.de",1],["spiegel.de",1],["spielen.de",1],["spieletipps.de",1],["spielfilm.de",1],["sport.de",1],["sport365.fr",1],["sportal.de",1],["spox.com",1],["stern.de",1],["stuttgarter-nachrichten.de",1],["stuttgarter-zeitung.de",1],["sueddeutsche.de",1],["svz.de",1],["szene1.at",1],["szene38.de",1],["t-online.de",1],["tagesspiegel.de",1],["taschenhirn.de",1],["techadvisor.co.uk",1],["techstage.de",1],["tele5.de",1],["the-voice-of-germany.de",1],["thueringen24.de",1],["tichyseinblick.de",1],["tierfreund.co",1],["tiervermittlung.de",1],["torgranate.de",1],["trend.at",1],["tv-media.at",1],["tvdigital.de",1],["tvinfo.de",1],["tvspielfilm.de",1],["tvtoday.de",1],["tz.de",1],["unicum.de",1],["unnuetzes.com",1],["unsere-helden.com",1],["unterhalt.net",1],["usinger-anzeiger.de",1],["usp-forum.de",1],["videogameszone.de",1],["vienna.at",1],["vip.de",1],["virtualnights.com",1],["vox.de",1],["wa.de",1],["wallstreet-online.de",[1,4]],["waz.de",1],["weather.us",1],["webfail.com",1],["weihnachten.me",1],["weihnachts-bilder.org",1],["weihnachts-filme.com",1],["welt.de",1],["weltfussball.at",1],["weristdeinfreund.de",1],["werkzeug-news.de",1],["werra-rundschau.de",1],["wetterauer-zeitung.de",1],["wiesbadener-kurier.de",1],["wiesbadener-tagblatt.de",1],["winboard.org",1],["windows-7-forum.net",1],["winfuture.de",1],["wintotal.de",1],["wlz-online.de",1],["wn.de",1],["wohngeld.org",1],["wolfenbuetteler-zeitung.de",1],["wolfsburger-nachrichten.de",1],["woman.at",1],["womenshealth.de",1],["wormser-zeitung.de",1],["woxikon.de",1],["wp.de",1],["wr.de",1],["yachtrevue.at",1],["ze.tt",1],["zeit.de",1],["meineorte.com",2],["osthessen-news.de",2],["techadvisor.com",2],["focus.de",2],["economictimes.indiatimes.com",5],["m.timesofindia.com",6],["timesofindia.indiatimes.com",6],["youmath.it",6],["redensarten-index.de",6],["lesoir.be",6],["electriciansforums.net",6],["keralatelecom.info",6],["betaseries.com",6],["free-sms-receive.com",6],["sms-receive-online.com",6],["universegunz.net",6],["happypenguin.altervista.org",6],["everyeye.it",6],["bluedrake42.com",6],["streamservicehd.click",6],["supermarioemulator.com",6],["futbollibrehd.com",6],["newsrade.com",6],["eska.pl",6],["eskarock.pl",6],["voxfm.pl",6],["mathaeser.de",6],["freethesaurus.com",8],["thefreedictionary.com",8],["hdbox.ws",10],["todopolicia.com",10],["scat.gold",10],["freecoursesite.com",10],["windowcleaningforums.co.uk",10],["cruisingearth.com",10],["hobby-machinist.com",10],["freegogpcgames.com",10],["starleaks.org",10],["latitude.to",10],["kitchennovel.com",10],["w3layouts.com",10],["blog.receivefreesms.co.uk",10],["eductin.com",10],["dealsfinders.blog",10],["audiobooks4soul.com",10],["tinhocdongthap.com",10],["sakarnewz.com",10],["downloadr.in",10],["topcomicporno.com",10],["dongknows.com",10],["traderepublic.community",10],["babia.to",10],["celtadigital.com",10],["iptvrun.com",10],["adsup.lk",10],["cryptomonitor.in",10],["areatopik.com",10],["cardscanner.co",10],["nullforums.net",10],["courseclub.me",10],["tamarindoyam.com",10],["jeep-cj.com",10],["choiceofmods.com",10],["myqqjd.com",10],["ssdtop.com",10],["apkhex.com",10],["gezegenforum.com",10],["mbc2.live",10],["iptvapps.net",10],["null-scripts.net",10],["nullscripts.net",10],["bloground.ro",10],["witcherhour.com",10],["ottverse.com",10],["torrentmac.net",10],["mazakony.com",10],["laptechinfo.com",10],["mc-at.org",10],["playstationhaber.com",10],["mangapt.com",10],["seriesperu.com",10],["pesprofessionals.com",10],["wpsimplehacks.com",10],["sportshub.to",[10,274]],["topsporter.net",[10,274]],["darkwanderer.net",10],["truckingboards.com",10],["coldfrm.org",10],["azrom.net",10],["freepatternsarea.com",10],["alttyab.net",10],["hq-links.com",10],["mobilkulup.com",10],["esopress.com",10],["nesiaku.my.id",10],["jipinsoft.com",10],["surfsees.com",10],["truthnews.de",10],["farsinama.com",10],["worldofiptv.com",10],["vuinsider.com",10],["crazydl.net",10],["gamemodsbase.com",10],["babiato.tech",10],["secuhex.com",10],["turkishaudiocenter.com",10],["galaxyos.net",10],["blackhatworld.com",10],["bizdustry.com",10],["storefront.com.ng",10],["pkbiosfix.com",10],["casi3.xyz",10],["mediafire.com",11],["wcoanimedub.tv",12],["wcoforever.net",12],["openspeedtest.com",12],["addtobucketlist.com",12],["3dzip.org",[12,81]],["ilmeteo.it",12],["wcoforever.com",12],["comprovendolibri.it",12],["healthelia.com",12],["keephealth.info",13],["afreesms.com",14],["kinoger.re",14],["laksa19.github.io",14],["javcl.com",14],["tvlogy.to",14],["live.dragaoconnect.net",14],["beststremo.com",14],["seznam.cz",14],["seznamzpravy.cz",14],["xerifetech.com",14],["wallpapershome.com",16],["anghami.com",17],["wired.com",18],["tutele.sx",19],["footyhunter3.xyz",19],["magesypro.pro",[20,21]],["audiotools.pro",21],["magesy.blog",[21,22,23]],["robloxscripts.com",22],["libreriamo.it",22],["postazap.com",22],["medebooks.xyz",22],["tutorials-technology.info",22],["mashtips.com",22],["marriedgames.com.br",22],["4allprograms.me",22],["nurgsm.com",22],["certbyte.com",22],["plugincrack.com",22],["gamingdeputy.com",22],["freewebcart.com",22],["katestube.com",24],["short.pe",24],["footystreams.net",24],["seattletimes.com",25],["bestgames.com",26],["yiv.com",26],["globalrph.com",27],["e-glossa.it",28],["webcheats.com.br",29],["gala.fr",31],["gentside.com",31],["geo.fr",31],["hbrfrance.fr",31],["nationalgeographic.fr",31],["ohmymag.com",31],["serengo.net",31],["vsd.fr",31],["updato.com",[32,50]],["methbox.com",33],["daizurin.com",33],["pendekarsubs.us",33],["dreamfancy.org",33],["rysafe.blogspot.com",33],["techacode.com",33],["toppng.com",33],["th-world.com",33],["avjamack.com",33],["avjamak.net",33],["tickzoo.tv",34],["dlhd.sx",35],["embedstream.me",35],["yts-subs.net",35],["cnnamador.com",36],["nudecelebforum.com",37],["pronpic.org",38],["thewebflash.com",39],["discordfastfood.com",39],["xup.in",39],["popularmechanics.com",40],["op.gg",41],["lequipe.fr",42],["comunidadgzone.es",43],["mp3fy.com",43],["lebensmittelpraxis.de",43],["ebookdz.com",43],["forum-pokemon-go.fr",43],["praxis-jugendarbeit.de",43],["gdrivez.xyz",43],["dictionnaire-medical.net",43],["cle0desktop.blogspot.com",43],["up-load.io",43],["direct-link.net",43],["direkt-wissen.com",43],["keysbrasil.blogspot.com",43],["hotpress.info",43],["turkleech.com",43],["anibatch.me",43],["anime-i.com",43],["plex-guide.de",43],["healthtune.site",43],["gewinde-normen.de",43],["tucinehd.com",43],["jellynote.com",44],["eporner.com",46],["pornbimbo.com",47],["allmonitors24.com",47],["4j.com",47],["avoiderrors.com",48],["cgtips.org",[48,220]],["sitarchive.com",48],["livenewsof.com",48],["topnewsshow.com",48],["gatcha.org",48],["empregoestagios.com",48],["everydayonsales.com",48],["kusonime.com",48],["aagmaal.xyz",48],["suicidepics.com",48],["codesnail.com",48],["codingshiksha.com",48],["graphicux.com",48],["asyadrama.com",48],["bitcoinegypt.news",48],["citychilli.com",48],["talkjarvis.com",48],["hdmotori.it",49],["femdomtb.com",51],["camhub.cc",51],["bobs-tube.com",51],["ru-xvideos.me",51],["pornfd.com",51],["popno-tour.net",51],["molll.mobi",51],["watchmdh.to",51],["camwhores.tv",51],["elfqrin.com",52],["satcesc.com",53],["apfelpatient.de",53],["lusthero.com",54],["m2list.com",55],["embed.nana2play.com",55],["elahmad.com",55],["dofusports.xyz",55],["dallasnews.com",56],["lnk.news",57],["lnk.parts",57],["efukt.com",58],["wendycode.com",58],["springfieldspringfield.co.uk",59],["porndoe.com",60],["smsget.net",[61,62]],["kjanime.net",63],["gioialive.it",64],["classicreload.com",65],["scriptzhub.com",65],["hotpornfile.org",66],["coolsoft.altervista.org",66],["hackedonlinegames.com",66],["jkoding.xyz",66],["settlersonlinemaps.com",66],["magdownload.org",66],["kpkuang.org",66],["shareus.site",66],["crypto4yu.com",66],["faucetwork.space",66],["thenightwithoutthedawn.blogspot.com",66],["entutes.com",66],["claimlite.club",66],["bazadecrypto.com",[66,320]],["chicoer.com",67],["bostonherald.com",67],["dailycamera.com",67],["maxcheaters.com",68],["rbxoffers.com",68],["mhn.quest",68],["leagueofgraphs.com",68],["hieunguyenphoto.com",68],["benzinpreis.de",68],["postimees.ee",68],["police.community",68],["gisarea.com",68],["schaken-mods.com",68],["theclashify.com",68],["newscon.org",68],["txori.com",68],["olarila.com",68],["deletedspeedstreams.blogspot.com",68],["schooltravelorganiser.com",68],["xhardhempus.net",68],["sportsplays.com",69],["pornvideotop.com",71],["xstory-fr.com",71],["krotkoosporcie.pl",71],["deinesexfilme.com",72],["einfachtitten.com",72],["halloporno.com",72],["herzporno.com",72],["lesbenhd.com",72],["milffabrik.com",[72,249]],["porn-monkey.com",72],["porndrake.com",72],["pornhubdeutsch.net",72],["pornoaffe.com",72],["pornodavid.com",72],["pornoente.tv",[72,249]],["pornofisch.com",72],["pornofelix.com",72],["pornohammer.com",72],["pornohelm.com",72],["pornoklinge.com",72],["pornotom.com",[72,249]],["pornotommy.com",72],["pornovideos-hd.com",72],["pornozebra.com",[72,249]],["xhamsterdeutsch.xyz",72],["xnxx-sexfilme.com",72],["zerion.cc",72],["letribunaldunet.fr",73],["vladan.fr",73],["live-tv-channels.org",74],["eslfast.com",75],["freegamescasual.com",76],["tcpvpn.com",77],["oko.sh",77],["timesnownews.com",77],["timesnowhindi.com",77],["timesnowmarathi.com",77],["zoomtventertainment.com",77],["xxxuno.com",78],["sholah.net",79],["2rdroid.com",79],["bisceglielive.it",80],["pandajogosgratis.com.br",82],["5278.cc",83],["altblogger.net",84],["hl-live.de",84],["wohnmobilforum.de",84],["nulledbear.com",84],["sinnerclownceviri.net",84],["satoshi-win.xyz",84],["encurtandourl.com",[84,143]],["freedeepweb.blogspot.com",84],["freesoft.id",84],["zcteam.id",84],["www-daftarharga.blogspot.com",84],["ear-phone-review.com",84],["telefullenvivo.com",84],["listatv.pl",84],["ltc-faucet.xyz",84],["coin-profits.xyz",84],["relampagomovies.com",84],["tonspion.de",86],["duplichecker.com",87],["plagiarismchecker.co",87],["plagiarismdetector.net",87],["searchenginereports.net",87],["giallozafferano.it",88],["autojournal.fr",88],["autoplus.fr",88],["sportauto.fr",88],["linkspaid.com",89],["proxydocker.com",89],["beeimg.com",[90,91]],["emturbovid.com",91],["ftlauderdalebeachcam.com",92],["ftlauderdalewebcam.com",92],["juneauharborwebcam.com",92],["keywestharborwebcam.com",92],["kittycatcam.com",92],["mahobeachcam.com",92],["miamiairportcam.com",92],["morganhillwebcam.com",92],["njwildlifecam.com",92],["nyharborwebcam.com",92],["paradiseislandcam.com",92],["pompanobeachcam.com",92],["portbermudawebcam.com",92],["portcanaveralwebcam.com",92],["portevergladeswebcam.com",92],["portmiamiwebcam.com",92],["portnywebcam.com",92],["portnassauwebcam.com",92],["portstmaartenwebcam.com",92],["portstthomaswebcam.com",92],["porttampawebcam.com",92],["sxmislandcam.com",92],["gearingcommander.com",92],["themes-dl.com",92],["badassdownloader.com",92],["badasshardcore.com",92],["badassoftcore.com",92],["nulljungle.com",92],["teevee.asia",92],["otakukan.com",92],["generate.plus",94],["calculate.plus",94],["avcesar.com",95],["audiotag.info",96],["tudigitale.it",97],["ibcomputing.com",98],["legia.net",99],["acapellas4u.co.uk",100],["streamhentaimovies.com",101],["konten.co.id",102],["diariodenavarra.es",103],["tubereader.me",103],["scripai.com",103],["myfxbook.com",103],["whatfontis.com",103],["xiaomifans.pl",104],["eletronicabr.com",104],["optifine.net",105],["luzernerzeitung.ch",106],["tagblatt.ch",106],["spellcheck.net",107],["spellchecker.net",107],["spellweb.com",107],["ableitungsrechner.net",108],["alternet.org",109],["gourmetsupremacy.com",109],["shrib.com",110],["pandafiles.com",111],["vidia.tv",[111,132]],["hortonanderfarom.blogspot.com",111],["clarifystraight.com",111],["tutelehd3.xyz",112],["mega4upload.com",112],["coolcast2.com",112],["techclips.net",112],["earthquakecensus.com",112],["footyhunter.lol",112],["gamerarcades.com",112],["poscitech.click",112],["starlive.stream",112],["utopianwilderness.com",112],["wecast.to",112],["sportbar.live",112],["lordchannel.com",112],["play-old-pc-games.com",113],["tunovelaligera.com",114],["tapchipi.com",114],["cuitandokter.com",114],["tech-blogs.com",114],["cardiagn.com",114],["dcleakers.com",114],["esgeeks.com",114],["pugliain.net",114],["uplod.net",114],["worldfreeware.com",114],["fikiri.net",114],["myhackingworld.com",114],["phoenixfansub.com",114],["freecourseweb.com",115],["devcourseweb.com",115],["coursewikia.com",115],["courseboat.com",115],["coursehulu.com",115],["lne.es",119],["pornult.com",120],["webcamsdolls.com",120],["bitcotasks.com",[120,165]],["adsy.pw",120],["playstore.pw",120],["exactpay.online",120],["thothd.to",120],["proplanta.de",121],["hydrogenassociation.org",122],["ludigames.com",122],["sportitalialive.com",122],["made-by.org",122],["xenvn.com",122],["worldtravelling.com",122],["igirls.in",122],["technichero.com",122],["roshiyatech.my.id",122],["24sport.stream",122],["aeroxplorer.com",122],["mad4wheels.com",123],["logi.im",123],["emailnator.com",123],["textograto.com",124],["voyageforum.com",125],["hmc-id.blogspot.com",125],["jemerik.com",125],["myabandonware.com",125],["chatta.it",127],["ketubanjiwa.com",128],["nsfw247.to",129],["funzen.net",129],["fighter.stream",129],["ilclubdellericette.it",129],["hubstream.in",129],["extremereportbot.com",130],["getintopc.com",131],["qoshe.com",133],["lowellsun.com",134],["mamadu.pl",134],["dobrapogoda24.pl",134],["motohigh.pl",134],["namasce.pl",134],["ultimate-catch.eu",135],["cpopchanelofficial.com",136],["creditcardgenerator.com",137],["creditcardrush.com",137],["bostoncommons.net",137],["thejobsmovie.com",137],["livsavr.co",137],["nilopolisonline.com.br",138],["mesquitaonline.com",138],["yellowbridge.com",138],["socialgirls.im",139],["yaoiotaku.com",140],["camhub.world",141],["moneyhouse.ch",142],["ihow.info",143],["filesus.com",143],["sturls.com",143],["re.two.re",143],["turbo1.co",143],["cartoonsarea.xyz",143],["valeronevijao.com",144],["cigarlessarefy.com",144],["figeterpiazine.com",144],["yodelswartlike.com",144],["generatesnitrosate.com",144],["crownmakermacaronicism.com",144],["chromotypic.com",144],["gamoneinterrupted.com",144],["metagnathtuggers.com",144],["wolfdyslectic.com",144],["rationalityaloelike.com",144],["sizyreelingly.com",144],["simpulumlamerop.com",144],["urochsunloath.com",144],["monorhinouscassaba.com",144],["counterclockwisejacky.com",144],["35volitantplimsoles5.com",144],["scatch176duplicities.com",144],["antecoxalbobbing1010.com",144],["boonlessbestselling244.com",144],["cyamidpulverulence530.com",144],["guidon40hyporadius9.com",144],["449unceremoniousnasoseptal.com",144],["19turanosephantasia.com",144],["30sensualizeexpression.com",144],["321naturelikefurfuroid.com",144],["745mingiestblissfully.com",144],["availedsmallest.com",144],["greaseball6eventual20.com",144],["toxitabellaeatrebates306.com",144],["20demidistance9elongations.com",144],["audaciousdefaulthouse.com",144],["fittingcentermondaysunday.com",144],["fraudclatterflyingcar.com",144],["launchreliantcleaverriver.com",144],["matriculant401merited.com",144],["realfinanceblogcenter.com",144],["reputationsheriffkennethsand.com",144],["telyn610zoanthropy.com",144],["tubelessceliolymph.com",144],["tummulerviolableness.com",144],["un-block-voe.net",144],["v-o-e-unblock.com",144],["voe-un-block.com",144],["voeun-block.net",144],["voeunbl0ck.com",144],["voeunblck.com",144],["voeunblk.com",144],["voeunblock.com",144],["voeunblock1.com",144],["voeunblock2.com",144],["voeunblock3.com",144],["agefi.fr",145],["cariskuy.com",146],["letras2.com",146],["yusepjaelani.blogspot.com",147],["letras.mus.br",148],["mtlurb.com",149],["port.hu",150],["acdriftingpro.com",150],["flight-report.com",150],["forumdz.com",150],["abandonmail.com",150],["flmods.com",150],["zilinak.sk",150],["projectfreetv.stream",150],["hotdesimms.com",150],["pdfaid.com",150],["mconverter.eu",150],["dzeko11.net",[150,274]],["mail.com",150],["expresskaszubski.pl",150],["moegirl.org.cn",150],["onemanhua.com",151],["t3n.de",152],["allindiaroundup.com",153],["vectorizer.io",154],["smgplaza.com",154],["onehack.us",154],["thapcam.net",154],["thefastlaneforum.com",155],["trade2win.com",156],["modagamers.com",157],["freemagazines.top",157],["straatosphere.com",157],["rule34porn.net",157],["nullpk.com",157],["adslink.pw",157],["downloadudemy.com",157],["picgiraffe.com",157],["weadown.com",157],["freepornsex.net",157],["nurparatodos.com.ar",157],["librospreuniversitariospdf.blogspot.com",158],["msdos-games.com",158],["blocklayer.com",158],["forexeen.us",158],["khsm.io",158],["webcreator-journal.com",158],["nu6i-bg-net.com",158],["routech.ro",159],["hokej.net",159],["turkmmo.com",160],["palermotoday.it",161],["baritoday.it",161],["trentotoday.it",161],["agrigentonotizie.it",161],["anconatoday.it",161],["arezzonotizie.it",161],["avellinotoday.it",161],["bresciatoday.it",161],["brindisireport.it",161],["casertanews.it",161],["cataniatoday.it",161],["cesenatoday.it",161],["chietitoday.it",161],["forlitoday.it",161],["frosinonetoday.it",161],["genovatoday.it",161],["ilpescara.it",161],["ilpiacenza.it",161],["latinatoday.it",161],["lecceprima.it",161],["leccotoday.it",161],["livornotoday.it",161],["messinatoday.it",161],["milanotoday.it",161],["modenatoday.it",161],["monzatoday.it",161],["novaratoday.it",161],["padovaoggi.it",161],["parmatoday.it",161],["perugiatoday.it",161],["pisatoday.it",161],["quicomo.it",161],["ravennatoday.it",161],["reggiotoday.it",161],["riminitoday.it",161],["romatoday.it",161],["salernotoday.it",161],["sondriotoday.it",161],["sportpiacenza.it",161],["ternitoday.it",161],["today.it",161],["torinotoday.it",161],["trevisotoday.it",161],["triesteprima.it",161],["udinetoday.it",161],["veneziatoday.it",161],["vicenzatoday.it",161],["thumpertalk.com",162],["arkcod.org",162],["facciabuco.com",163],["softx64.com",164],["thelayoff.com",165],["manwan.xyz",165],["blog.cryptowidgets.net",165],["blog.insurancegold.in",165],["blog.wiki-topia.com",165],["blog.coinsvalue.net",165],["blog.cookinguide.net",165],["blog.freeoseocheck.com",165],["blog.makeupguide.net",165],["blog.carstopia.net",165],["blog.carsmania.net",165],["shorterall.com",165],["blog24.me",165],["maxstream.video",165],["maxlinks.online",165],["tvepg.eu",165],["pstream.net",166],["dailymaverick.co.za",167],["apps2app.com",168],["cheatermad.com",169],["ville-ideale.fr",170],["eodev.com",171],["fm-arena.com",172],["tradersunion.com",173],["tandess.com",174],["faqwiki.us",175],["sonixgvn.net",175],["spontacts.com",176],["dankmemer.lol",177],["apkmoddone.com",178],["getexploits.com",179],["fplstatistics.com",180],["breitbart.com",181],["salidzini.lv",182],["choosingnothing.com",183],["cryptorank.io",184],["th.gl",185],["4kwebplay.xyz",186],["qqwebplay.xyz",186],["lewblivehdplay.ru",186],["claplivehdplay.ru",186],["viwlivehdplay.ru",186],["molbiotools.com",187],["vods.tv",188],["18xxx.xyz",189],["raidrush.net",190],["enit.in",191],["financerites.com",191],["fadedfeet.com",192],["homeculina.com",192],["ineedskin.com",192],["kenzo-flowertag.com",192],["lawyex.co",192],["mdn.lol",192],["bitzite.com",193],["coingraph.us",194],["impact24.us",194],["my-code4you.blogspot.com",195],["vrcmods.com",196],["osuskinner.com",196],["osuskins.net",196],["pentruea.com",[197,198]],["mchacks.net",199],["why-tech.it",200],["compsmag.com",201],["tapetus.pl",202],["gaystream.online",203],["bembed.net",203],["embedv.net",203],["fslinks.org",203],["listeamed.net",203],["v6embed.xyz",203],["vgplayer.xyz",203],["vid-guard.com",203],["autoroad.cz",204],["brawlhalla.fr",204],["tecnobillo.com",204],["sexcamfreeporn.com",205],["breatheheavy.com",206],["wenxuecity.com",207],["key-hub.eu",208],["fabioambrosi.it",209],["tattle.life",210],["emuenzen.de",210],["terrylove.com",210],["mynet.com",211],["cidade.iol.pt",212],["fantacalcio.it",213],["hentaifreak.org",214],["hypebeast.com",215],["krankheiten-simulieren.de",216],["catholic.com",217],["ad-doge.com",218],["3dmodelshare.org",219],["gourmetscans.net",220],["techinferno.com",221],["ibeconomist.com",222],["bookriot.com",223],["purposegames.com",224],["schoolcheats.net",224],["globo.com",225],["latimes.com",225],["claimrbx.gg",226],["perelki.net",227],["vpn-anbieter-vergleich-test.de",228],["livingincebuforums.com",229],["paperzonevn.com",230],["alltechnerd.com",231],["malaysianwireless.com",232],["erinsakura.com",233],["infofuge.com",233],["freejav.guru",233],["novelmultiverse.com",233],["fritidsmarkedet.dk",234],["maskinbladet.dk",234],["15min.lt",235],["baddiehub.com",236],["mr9soft.com",237],["21porno.com",238],["adult-sex-gamess.com",239],["hentaigames.app",239],["mobilesexgamesx.com",239],["mysexgamer.com",239],["porngameshd.com",239],["sexgamescc.com",239],["xnxx-sex-videos.com",239],["f2movies.to",240],["freeporncave.com",241],["tubsxxx.com",242],["pornojenny.com",243],["subtitle.one",244],["manga18fx.com",245],["freebnbcoin.com",245],["sextvx.com",246],["studydhaba.com",247],["freecourse.tech",247],["victor-mochere.com",247],["papunika.com",247],["mobilanyheter.net",247],["prajwaldesai.com",[247,266]],["ftuapps.dev",247],["muztext.com",248],["pornohans.com",249],["nursexfilme.com",249],["pornohirsch.net",249],["xhamster-sexvideos.com",249],["pornoschlange.com",249],["hdpornos.net",249],["gutesexfilme.com",249],["short1.site",249],["zona-leros.com",249],["charbelnemnom.com",250],["simplebits.io",251],["online-fix.me",252],["gamersdiscussionhub.com",253],["owlzo.com",254],["q1003.com",255],["blogpascher.com",256],["testserver.pro",257],["lifestyle.bg",257],["money.bg",257],["news.bg",257],["topsport.bg",257],["webcafe.bg",257],["mgnet.xyz",258],["advertiserandtimes.co.uk",259],["xvideos2020.me",260],["111.90.159.132",261],["techsolveprac.com",262],["joomlabeginner.com",263],["largescaleforums.com",264],["dubznetwork.com",265],["mundodonghua.com",265],["hentaidexy.com",267],["code2care.org",268],["xxxxsx.com",270],["ngontinh24.com",271],["panel.freemcserver.net",272],["idevicecentral.com",273],["zona11.com",274],["scsport.live",274],["mangacrab.com",276],["idnes.cz",277],["viefaucet.com",278],["cloud-computing-central.com",279],["afk.guide",280],["businessnamegenerator.com",281],["derstandard.at",282],["derstandard.de",282],["rocketnews24.com",283],["soranews24.com",283],["youpouch.com",283],["ilsole24ore.com",284],["ipacrack.com",285],["hentaiporn.one",286],["infokik.com",287],["daemonanime.net",288],["daemon-hentai.com",288],["deezer.com",289],["fosslinux.com",290],["shrdsk.me",291],["examword.com",292],["sempreupdate.com.br",292],["tribuna.com",293],["trendsderzukunft.de",294],["gal-dem.com",294],["lostineu.eu",294],["oggitreviso.it",294],["speisekarte.de",294],["mixed.de",294],["lightnovelspot.com",[295,296]],["lightnovelworld.com",[295,296]],["novelpub.com",[295,296]],["webnovelpub.com",[295,296]],["mail.yahoo.com",297],["hwzone.co.il",298],["nammakalvi.com",299],["javmoon.me",300],["c2g.at",301],["terafly.me",301],["elamigos-games.com",301],["elamigos-games.net",301],["dktechnicalmate.com",302],["recipahi.com",302],["converter-btc.world",302],["kaystls.site",303],["aquarius-horoscopes.com",304],["cancer-horoscopes.com",304],["dubipc.blogspot.com",304],["echoes.gr",304],["engel-horoskop.de",304],["freegames44.com",304],["fuerzasarmadas.eu",304],["gemini-horoscopes.com",304],["jurukunci.net",304],["krebs-horoskop.com",304],["leo-horoscopes.com",304],["maliekrani.com",304],["nklinks.click",304],["ourenseando.es",304],["pisces-horoscopes.com",304],["radio-en-direct.fr",304],["sagittarius-horoscopes.com",304],["scorpio-horoscopes.com",304],["singlehoroskop-loewe.de",304],["skat-karten.de",304],["skorpion-horoskop.com",304],["taurus-horoscopes.com",304],["the1security.com",304],["torrentmovies.online",304],["virgo-horoscopes.com",304],["zonamarela.blogspot.com",304],["yoima.hatenadiary.com",304],["vpntester.org",305],["watchhentai.net",306],["japscan.lol",307],["digitask.ru",308],["tempumail.com",309],["sexvideos.host",310],["10alert.com",312],["cryptstream.de",313],["nydus.org",313],["techhelpbd.com",314],["fapdrop.com",315],["cellmapper.net",316],["hdrez.com",317],["youwatch-serie.com",317],["printablecreative.com",318],["comohoy.com",319],["leak.sx",319],["paste.bin.sx",319],["pornleaks.in",319],["merlininkazani.com",319],["j91.asia",321],["jeniusplay.com",322],["indianyug.com",323],["rgb.vn",323],["needrom.com",324],["criptologico.com",325],["megadrive-emulator.com",326],["eromanga-show.com",327],["hentai-one.com",327],["hentaipaw.com",327],["10minuteemails.com",328],["luxusmail.org",328],["w3cub.com",329],["bangpremier.com",330],["nyaa.iss.ink",331],["tnp98.xyz",333],["freepdfcomic.com",334],["memedroid.com",335],["animesync.org",336],["karaoketexty.cz",337],["resortcams.com",338],["mjakmama24.pl",340],["security-demo.extrahop.com",341]]);

const entitiesMap = new Map([["lablue",0],["comunio",1],["finanzen",[1,7]],["gameswelt",1],["heftig",1],["notebookcheck",1],["testedich",1],["transfermarkt",1],["truckscout24",1],["tvtv",1],["wetteronline",1],["wieistmeineip",1],["wetter",3],["1337x",6],["eztv",6],["sushi-scan",10],["spigotunlocked",10],["ahmedmode",10],["kissasian",13],["rp5",14],["mma-core",15],["yts",19],["720pstream",19],["1stream",19],["magesy",20],["shortzzy",22],["thefmovies",24],["urlcero",30],["totaldebrid",33],["sandrives",33],["oploverz",34],["fxporn69",43],["aliancapes",43],["pouvideo",45],["povvideo",45],["povw1deo",45],["povwideo",45],["powv1deo",45],["powvibeo",45],["powvideo",45],["powvldeo",45],["tubsexer",51],["porno-tour",51],["lenkino",51],["pornomoll",51],["camsclips",51],["m4ufree",55],["writedroid",66],["telerium",70],["pandafreegames",85],["thoptv",93],["streameast",112],["thestreameast",112],["daddylivehd",112],["solvetube",116],["hdfilme",117],["pornhub",118],["wcofun",125],["bollyholic",129],["gotxx",143],["turkanime",144],["voe-unblock",144],["khatrimaza",157],["pogolinks",157],["popcornstream",159],["brainly",171],["vembed",203],["xhamsterdeutsch",249],["privatemoviez",253],["gmx",269],["lightnovelpub",[295,296]],["camcaps",311],["drivebot",332],["thenextplanet1",333],["autoscout24",339]]);

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
