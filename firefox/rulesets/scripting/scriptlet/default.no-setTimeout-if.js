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

const argsList = [[".call(null)","10"],[".call(null)"],["(null)","10"],["userHasAdblocker"],["objSubPromo"],["adb"],["nrWrapper"],["warn"],["adBlockerDetected"],["show"],["InfMediafireMobileFunc","1000"],["google_jobrunner"],["()","45000"],["0x"],["displayAdBlockedVideo"],[".adsbygoogle"],["location.href"],["isDesktopApp","1000"],["Bait"],["admc"],["AdBlocker"],["Blocked"],["ai_adb"],["match","100"],["'0x"],["apstagLOADED"],["/Adb|moneyDetect/"],["disableDeveloper"],["Blocco","2000"],["documentElement.classList.add","400"],["test","0"],["checkAdblockUser","1000"],["checkPub","6000"],["document.querySelector","5000"],["nextFunction","250"],["popup"],["_0x"],["()","150"],["backRedirect"],["document.querySelectorAll","1000"],["style"],["clientHeight"],["addEventListener","0"],["adblock","2000"],["start","0"],["nextFunction","2000"],["byepopup","5000"],["test.remove","100"],["additional_src","300"],["()","2000"],["css_class.show"],["CANG","3000"],["updato-overlay","500"],["innerText","2000"],["alert","8000"],["css_class"],["()","50"],["debugger"],["initializeCourier","3000"],["redirectPage"],["_0x","2000"],["ads","750"],["location.href","500"],["Adblock","5000"],["disable","200"],["CekAab","0"],["rbm_block_active","1000"],["show()"],["n.trigger","1"],["adblock"],["abDetected"],["KeepOpeningPops","1000"],["appendChild"],["adb","0"],["adBlocked"],["warning","100"],["adblock_popup","500"],["Adblock"],["#chatWrap","1000"],["keep-ads","2000"],["#rbm_block_active","1000"],["null","4000"],["()","2500"],["myaabpfun","3000"],["nextFunction"],["adFilled","2500"],["()","15000"],["showPopup"],["()","1"],["()","1000"],["document.cookie","2500"],["window.open"],["innerHTML"],["readyplayer","2000"],["checkStopBlock"],["adspot_top","1500"],["/offsetHeight|google|Global/"],["an_message","500"],["Adblocker","10000"],["trigger","0"],["timeoutChecker"],["bait","1"],["pum-open"],["overlay","2000"],["/adblock/i"],["test","100"],["Math.round","1000"],["adblock","5"],["bioEp"],["ag_adBlockerDetected"],["null"],["adsbox","1000"],["adb","6000"],["pop"],["sadbl"],["checkAdStatus"],["mdp"],["brave_load_popup"],["0x","3000"],["invoke"],["adsbytrafficjunkycontext"],["ipod"],["offsetWidth"],["/$|adBlock/"],["ads"],["adsbygoogle"],["()"],["AdBlock"],["stop-scrolling"],["Adv"],["blockUI","2000"],["mdpDeBlocker"],["/_0x|debug/"],["/ai_adb|_0x/"],["iframe"],["adBlock"],["","1"],["undefined"],["check","1"],["adsBlocked"],["blocker"],["aswift_"],["afs_ads","2000"],["visibility","2000"],["bait"],["getComputedStyle","250"],["blocked"],["{r()","0"],["nextFunction","450"],["Debug"],["r()","0"],["purple_box"],["offsetHeight"],["checkSiteNormalLoad"],["adBlockOverlay"],["Detected","500"],["modal"],[".show","1000"],[".show"],["showModal"],["getComputedStyle"],["blur"],["samOverlay"],["bADBlock"],["location"],["","4000"],["blocker","100"],["alert"],["length"],["t()","0"],["$"],["offset"],["contrformpub"],["getComputedStyle","2000"],["video-popup"],["detectAdblock"],["EzoIvent"],["detectAdBlocker"],["nads"],["1e3*"],["current.children"],["adStatus"],["","5"],["/adblock|isRequestPresent/"],["_0x","500"],["isRequestPresent"],["offsetLeft"],["height"],["mdp_deblocker"],["charAt"],["checkAds"],["fadeIn","0"],["jQuery"],["/^/"],["afterOpen"],["check"],["Adblocker"],["eabdModal"],["ab_root.show"],["gaData"],["ad"],["prompt","1000"],["googlefc"],["adblock detection"],[".offsetHeight","100"],["popState"],["ad-block-popup"],["exitTimer"],["innerHTML.replace"],["ab","2000"],["data?","4000"],[".data?"],["eabpDialog"],["adsense"],["/Adblock|_ad_/"],["googletag"],["f.parentNode.removeChild(f)","100"],["swal","500"],["keepChecking","1000"],["openPopup"],[".offsetHeight"],["()=>{"],["nitroAds"],["class.scroll","1000"],["disableDeveloperTools"],["Check"],["insertBefore"],["setAntiAb"],["css_class.scroll"],["/null|Error/","10000"],["window.location.href","50"],["/out.php"],["/0x|devtools/"],["location.replace","300"],["window.location.href"],["checkVisible"],["_0x","3000"],["fetch"],["window.location.href=link"],["ai_"],["reachGoal"],["Adb"],["ai"],["","3000"],["/width|innerHTML/"],["magnificPopup"],["adblockEnabled"],["google_ad"],["document.location"],["google"],["top-right","2000"],["enforceAdStatus"],["loadScripts"],["mfp"],["display","5000"],["eb"],[").show()"],["","1000"],["site-access"],["atob"],["Msg"],["UABP"],["href"],["aaaaa-modal"],["\\x","5000"],["()=>"],["keepChecking"],["null","10"],["","500"],["/Adform|didomi|adblock|forEach/"],["showAdblock"],["-0x"],["display"],["gclid"],["event","3000"],["rejectWith"],["refresh"],["location.href","3000"],["window.location"],["ga"],["adbl"],["Ads"],["ShowAdBLockerNotice"],["ad_listener"],["open"],["(!0)"],["Delay"],["/appendChild|e\\(\"/"],["=>"],["ADB"],["site-access-popup"],["data?"],["/debugger|UserCustomPop/"],["checkAdblockUser"],["offsetHeight","100"],["AdDetect"],["displayMessage","2000"],["/salesPopup|mira-snackbar/"],["advanced"],["detectImgLoad"],["offsetHeight","200"],["detector"],["replace"],["touchstart"],["siteAccessFlag"],["ab"],["/adblocker|alert/"],["redURL"],["/children\\('ins'\\)|Adblock|adsbygoogle/"],["displayMessage"],["chkADB"],["onDetected"],["myinfoey","1500"],["fuckadb"],["detect"],["siteAccessPopup"],["/adsbygoogle|adblock/"],["akadb"],["biteDisplay"],["/[a-z]\\(!0\\)/","800"],["ad_block"],["/detectAdBlocker|window.open/"],["adBlockDetected"],["popUnder"],["/GoToURL|delay/"],["window.location.href","300"],["ad_display"],["/adScriptPath|MMDConfig/"],["0x","100"],["/native|\\{n\\(\\)/"],["adblocker"],["/Detect|adblock|style\\.display|\\[native code]|\\.call\\(null\\)/"],["removeChild"],["ad blocker"]];

const hostnamesMap = new Map([["4-liga.com",0],["4fansites.de",0],["4players.de",0],["9monate.de",0],["aachener-nachrichten.de",0],["aachener-zeitung.de",0],["abendblatt.de",0],["abendzeitung-muenchen.de",0],["about-drinks.com",0],["abseits-ka.de",0],["airliners.de",0],["ajaxshowtime.com",0],["allgemeine-zeitung.de",0],["alpin.de",0],["antenne.de",0],["arcor.de",0],["areadvd.de",0],["areamobile.de",0],["ariva.de",0],["astronews.com",0],["aussenwirtschaftslupe.de",0],["auszeit.bio",0],["auto-motor-und-sport.de",0],["auto-service.de",0],["autobild.de",0],["autoextrem.de",0],["autopixx.de",0],["autorevue.at",0],["az-online.de",0],["baby-vornamen.de",0],["babyclub.de",0],["bafoeg-aktuell.de",0],["berliner-kurier.de",0],["berliner-zeitung.de",0],["bigfm.de",0],["bikerszene.de",0],["bildderfrau.de",0],["blackd.de",0],["blick.de",0],["boerse-online.de",0],["boerse.de",0],["boersennews.de",0],["braunschweiger-zeitung.de",0],["brieffreunde.de",0],["brigitte.de",0],["buerstaedter-zeitung.de",0],["buffed.de",0],["businessinsider.de",0],["buzzfeed.at",0],["buzzfeed.de",0],["caravaning.de",0],["cavallo.de",0],["chefkoch.de",0],["cinema.de",0],["clever-tanken.de",0],["computerbild.de",0],["computerhilfen.de",0],["comunio-cl.com",0],["connect.de",0],["chip.de",0],["da-imnetz.de",0],["dasgelbeblatt.de",0],["dbna.com",0],["dbna.de",0],["deichstube.de",0],["deine-tierwelt.de",0],["der-betze-brennt.de",0],["derwesten.de",0],["desired.de",0],["dhd24.com",0],["dieblaue24.com",0],["digitalfernsehen.de",0],["dnn.de",0],["donnerwetter.de",0],["e-hausaufgaben.de",0],["e-mountainbike.com",0],["eatsmarter.de",0],["echo-online.de",0],["ecomento.de",0],["einfachschoen.me",0],["elektrobike-online.com",0],["eltern.de",0],["epochtimes.de",0],["essen-und-trinken.de",0],["express.de",0],["extratipp.com",0],["familie.de",0],["fanfiktion.de",0],["fehmarn24.de",0],["fettspielen.de",0],["fid-gesundheitswissen.de",0],["finanznachrichten.de",0],["finanztreff.de",0],["finya.de",0],["firmenwissen.de",0],["fitforfun.de",0],["fnp.de",0],["football365.fr",0],["formel1.de",0],["fr.de",0],["frankfurter-wochenblatt.de",0],["freenet.de",0],["fremdwort.de",0],["froheweihnachten.info",0],["frustfrei-lernen.de",0],["fuldaerzeitung.de",0],["funandnews.de",0],["fussballdaten.de",0],["futurezone.de",0],["gala.de",0],["gamepro.de",0],["gamersglobal.de",0],["gamesaktuell.de",0],["gamestar.de",0],["gamezone.de",0],["gartendialog.de",0],["gartenlexikon.de",0],["gedichte.ws",0],["geissblog.koeln",0],["gelnhaeuser-tageblatt.de",0],["general-anzeiger-bonn.de",0],["geniale-tricks.com",0],["genialetricks.de",0],["gesund-vital.de",0],["gesundheit.de",0],["gevestor.de",0],["gewinnspiele.tv",0],["giessener-allgemeine.de",0],["giessener-anzeiger.de",0],["gifhorner-rundschau.de",0],["giga.de",0],["gipfelbuch.ch",0],["gmuender-tagespost.de",0],["golem.de",[0,8,9]],["gruenderlexikon.de",0],["gusto.at",0],["gut-erklaert.de",0],["gutfuerdich.co",0],["hallo-muenchen.de",0],["hamburg.de",0],["hanauer.de",0],["hardwareluxx.de",0],["hartziv.org",0],["harzkurier.de",0],["haus-garten-test.de",0],["hausgarten.net",0],["haustec.de",0],["haz.de",0],["heidelberg24.de",0],["heilpraxisnet.de",0],["heise.de",0],["helmstedter-nachrichten.de",0],["hersfelder-zeitung.de",0],["hftg.co",0],["hifi-forum.de",0],["hna.de",0],["hochheimer-zeitung.de",0],["hoerzu.de",0],["hofheimer-zeitung.de",0],["iban-rechner.de",0],["ikz-online.de",0],["immobilienscout24.de",0],["ingame.de",0],["inside-digital.de",0],["inside-handy.de",0],["investor-verlag.de",0],["jappy.com",0],["jpgames.de",0],["kabeleins.de",0],["kachelmannwetter.com",0],["kamelle.de",0],["kicker.de",0],["kindergeld.org",0],["klettern-magazin.de",0],["klettern.de",0],["kochbar.de",0],["kreis-anzeiger.de",0],["kreisbote.de",0],["kreiszeitung.de",0],["ksta.de",0],["kurierverlag.de",0],["lachainemeteo.com",0],["lampertheimer-zeitung.de",0],["landwirt.com",0],["laut.de",0],["lauterbacher-anzeiger.de",0],["leckerschmecker.me",0],["leinetal24.de",0],["lesfoodies.com",0],["levif.be",0],["lifeline.de",0],["liga3-online.de",0],["likemag.com",0],["linux-community.de",0],["linux-magazin.de",0],["live.vodafone.de",0],["ln-online.de",0],["lokalo24.de",0],["lustaufsleben.at",0],["lustich.de",0],["lvz.de",0],["lz.de",0],["macwelt.de",0],["macworld.co.uk",0],["mail.de",0],["main-spitze.de",0],["manager-magazin.de",0],["manga-tube.me",0],["mathebibel.de",0],["mathepower.com",0],["maz-online.de",0],["medisite.fr",0],["mehr-tanken.de",0],["mein-kummerkasten.de",0],["mein-mmo.de",0],["mein-wahres-ich.de",0],["meine-anzeigenzeitung.de",0],["meinestadt.de",0],["menshealth.de",0],["mercato365.com",0],["merkur.de",0],["messen.de",0],["metal-hammer.de",0],["metalflirt.de",0],["meteologix.com",0],["minecraft-serverlist.net",0],["mittelbayerische.de",0],["modhoster.de",0],["moin.de",0],["mopo.de",0],["morgenpost.de",0],["motor-talk.de",0],["motorbasar.de",0],["motorradonline.de",0],["motorsport-total.com",0],["motortests.de",0],["mountainbike-magazin.de",0],["moviejones.de",0],["moviepilot.de",0],["mt.de",0],["mtb-news.de",0],["musiker-board.de",0],["musikexpress.de",0],["musikradar.de",0],["mz-web.de",0],["n-tv.de",0],["naumburger-tageblatt.de",0],["netzwelt.de",0],["neuepresse.de",0],["neueroeffnung.info",0],["news.at",0],["news.de",0],["news38.de",0],["newsbreak24.de",0],["nickles.de",0],["nicknight.de",0],["nl.hardware.info",0],["nn.de",0],["nnn.de",0],["nordbayern.de",0],["notebookchat.com",0],["notebookcheck-ru.com",0],["notebookcheck-tr.com",0],["noz-cdn.de",0],["noz.de",0],["nrz.de",0],["nw.de",0],["nwzonline.de",0],["oberhessische-zeitung.de",0],["oeffentlicher-dienst.info",0],["onlinekosten.de",0],["onvista.de",0],["op-marburg.de",0],["op-online.de",0],["outdoor-magazin.com",0],["outdoorchannel.de",0],["paradisi.de",0],["pc-magazin.de",0],["pcgames.de",0],["pcgameshardware.de",0],["pcwelt.de",0],["pcworld.es",0],["peiner-nachrichten.de",0],["pferde.de",0],["pietsmiet.de",0],["pixelio.de",0],["pkw-forum.de",0],["playboy.de",0],["playfront.de",0],["pnn.de",0],["pons.com",0],["prad.de",[0,128]],["prignitzer.de",0],["profil.at",0],["promipool.de",0],["promobil.de",0],["prosiebenmaxx.de",0],["psychic.de",[0,152]],["quoka.de",0],["radio.at",0],["radio.de",0],["radio.dk",0],["radio.es",0],["radio.fr",0],["radio.it",0],["radio.net",0],["radio.pl",0],["radio.pt",0],["radio.se",0],["ran.de",0],["readmore.de",0],["rechtslupe.de",0],["recording.de",0],["rennrad-news.de",0],["reuters.com",0],["reviersport.de",0],["rhein-main-presse.de",0],["rheinische-anzeigenblaetter.de",0],["rimondo.com",0],["roadbike.de",0],["roemische-zahlen.net",0],["rollingstone.de",0],["rot-blau.com",0],["rp-online.de",0],["rtl.de",[0,267]],["rtv.de",0],["rugby365.fr",0],["ruhr24.de",0],["rundschau-online.de",0],["runnersworld.de",0],["safelist.eu",0],["salzgitter-zeitung.de",0],["sat1.de",0],["sat1gold.de",0],["schoener-wohnen.de",0],["schwaebische-post.de",0],["schwarzwaelder-bote.de",0],["serienjunkies.de",0],["shz.de",0],["sixx.de",0],["skodacommunity.de",0],["smart-wohnen.net",0],["sn.at",0],["sozialversicherung-kompetent.de",0],["spiegel.de",0],["spielen.de",0],["spieletipps.de",0],["spielfilm.de",0],["sport.de",0],["sport365.fr",0],["sportal.de",0],["spox.com",0],["stern.de",0],["stuttgarter-nachrichten.de",0],["stuttgarter-zeitung.de",0],["sueddeutsche.de",0],["svz.de",0],["szene1.at",0],["szene38.de",0],["t-online.de",0],["tagesspiegel.de",0],["taschenhirn.de",0],["techadvisor.co.uk",0],["techstage.de",0],["tele5.de",0],["the-voice-of-germany.de",0],["thueringen24.de",0],["tichyseinblick.de",0],["tierfreund.co",0],["tiervermittlung.de",0],["torgranate.de",0],["trend.at",0],["tv-media.at",0],["tvdigital.de",0],["tvinfo.de",0],["tvspielfilm.de",0],["tvtoday.de",0],["tz.de",0],["unicum.de",0],["unnuetzes.com",0],["unsere-helden.com",0],["unterhalt.net",0],["usinger-anzeiger.de",0],["usp-forum.de",0],["videogameszone.de",0],["vienna.at",0],["vip.de",0],["virtualnights.com",0],["vox.de",0],["wa.de",0],["wallstreet-online.de",[0,3]],["waz.de",0],["weather.us",0],["webfail.com",0],["weihnachten.me",0],["weihnachts-bilder.org",0],["weihnachts-filme.com",0],["welt.de",0],["weltfussball.at",0],["weristdeinfreund.de",0],["werkzeug-news.de",0],["werra-rundschau.de",0],["wetterauer-zeitung.de",0],["wiesbadener-kurier.de",0],["wiesbadener-tagblatt.de",0],["winboard.org",0],["windows-7-forum.net",0],["winfuture.de",0],["wintotal.de",0],["wlz-online.de",0],["wn.de",0],["wohngeld.org",0],["wolfenbuetteler-zeitung.de",0],["wolfsburger-nachrichten.de",0],["woman.at",0],["womenshealth.de",0],["wormser-zeitung.de",0],["woxikon.de",0],["wp.de",0],["wr.de",0],["yachtrevue.at",0],["ze.tt",0],["zeit.de",0],["meineorte.com",1],["osthessen-news.de",1],["techadvisor.com",1],["focus.de",1],["economictimes.indiatimes.com",4],["m.timesofindia.com",5],["timesofindia.indiatimes.com",5],["youmath.it",5],["redensarten-index.de",5],["lesoir.be",5],["electriciansforums.net",5],["keralatelecom.info",5],["betaseries.com",5],["universegunz.net",5],["happypenguin.altervista.org",5],["everyeye.it",5],["bluedrake42.com",5],["streamservicehd.click",5],["supermarioemulator.com",5],["futbollibrehd.com",5],["newsrade.com",5],["eska.pl",5],["eskarock.pl",5],["voxfm.pl",5],["mathaeser.de",5],["freethesaurus.com",7],["thefreedictionary.com",7],["hdbox.ws",9],["todopolicia.com",9],["scat.gold",9],["freecoursesite.com",9],["windowcleaningforums.co.uk",9],["cruisingearth.com",9],["hobby-machinist.com",9],["freegogpcgames.com",9],["latitude.to",9],["kitchennovel.com",9],["w3layouts.com",9],["blog.receivefreesms.co.uk",9],["eductin.com",9],["dealsfinders.blog",9],["audiobooks4soul.com",9],["tinhocdongthap.com",9],["sakarnewz.com",9],["downloadr.in",9],["topcomicporno.com",9],["dongknows.com",9],["traderepublic.community",9],["babia.to",9],["celtadigital.com",9],["iptvrun.com",9],["adsup.lk",9],["cryptomonitor.in",9],["areatopik.com",9],["cardscanner.co",9],["nullforums.net",9],["courseclub.me",9],["tamarindoyam.com",9],["jeep-cj.com",9],["choiceofmods.com",9],["myqqjd.com",9],["ssdtop.com",9],["apkhex.com",9],["gezegenforum.com",9],["mbc2.live",9],["iptvapps.net",9],["null-scripts.net",9],["nullscripts.net",9],["bloground.ro",9],["witcherhour.com",9],["ottverse.com",9],["torrentmac.net",9],["mazakony.com",9],["laptechinfo.com",9],["mc-at.org",9],["playstationhaber.com",9],["mangapt.com",9],["seriesperu.com",9],["pesprofessionals.com",9],["wpsimplehacks.com",9],["sportshub.to",[9,266]],["topsporter.net",[9,266]],["darkwanderer.net",9],["truckingboards.com",9],["coldfrm.org",9],["azrom.net",9],["freepatternsarea.com",9],["alttyab.net",9],["hq-links.com",9],["mobilkulup.com",9],["esopress.com",9],["rttar.com",9],["nesiaku.my.id",9],["jipinsoft.com",9],["surfsees.com",9],["truthnews.de",9],["farsinama.com",9],["worldofiptv.com",9],["vuinsider.com",9],["crazydl.net",9],["gamemodsbase.com",9],["babiato.tech",9],["secuhex.com",9],["turkishaudiocenter.com",9],["galaxyos.net",9],["blackhatworld.com",9],["bizdustry.com",9],["storefront.com.ng",9],["pkbiosfix.com",9],["casi3.xyz",9],["mediafire.com",10],["wcoanimedub.tv",11],["wcoforever.net",11],["openspeedtest.com",11],["addtobucketlist.com",11],["3dzip.org",[11,81]],["ilmeteo.it",11],["wcoforever.com",11],["comprovendolibri.it",11],["healthelia.com",11],["keephealth.info",12],["afreesms.com",13],["kinoger.re",13],["laksa19.github.io",13],["javcl.com",13],["tvlogy.to",13],["live.dragaoconnect.net",13],["beststremo.com",13],["seznam.cz",13],["seznamzpravy.cz",13],["xerifetech.com",13],["wallpapershome.com",15],["imgkings.com",16],["pornvideotop.com",16],["xstory-fr.com",16],["krotkoosporcie.pl",16],["anghami.com",17],["wired.com",18],["tutele.sx",19],["footyhunter3.xyz",19],["magesypro.pro",[20,21]],["audiotools.pro",21],["magesy.blog",[21,22,23]],["robloxscripts.com",22],["libreriamo.it",22],["postazap.com",22],["medebooks.xyz",22],["tutorials-technology.info",22],["mashtips.com",22],["marriedgames.com.br",22],["4allprograms.me",22],["nurgsm.com",22],["certbyte.com",22],["plugincrack.com",22],["gamingdeputy.com",22],["freewebcart.com",22],["katestube.com",24],["short.pe",24],["footystreams.net",24],["seattletimes.com",25],["yiv.com",26],["globalrph.com",27],["e-glossa.it",28],["freewebscript.com",29],["webcheats.com.br",30],["gala.fr",32],["gentside.com",32],["geo.fr",32],["hbrfrance.fr",32],["nationalgeographic.fr",32],["ohmymag.com",32],["serengo.net",32],["vsd.fr",32],["updato.com",[33,52]],["methbox.com",34],["daizurin.com",34],["pendekarsubs.us",34],["dreamfancy.org",34],["rysafe.blogspot.com",34],["techacode.com",34],["toppng.com",34],["th-world.com",34],["avjamack.com",34],["avjamak.net",34],["tickzoo.tv",35],["bersamatekno.com",36],["hotpornfile.org",36],["coolsoft.altervista.org",36],["hackedonlinegames.com",36],["jkoding.xyz",36],["cheater.ninja",36],["settlersonlinemaps.com",36],["magdownload.org",36],["kpkuang.org",36],["shareus.site",36],["crypto4yu.com",36],["faucetwork.space",36],["thenightwithoutthedawn.blogspot.com",36],["entutes.com",36],["claimlite.club",36],["bazadecrypto.com",[36,312]],["dlhd.sx",37],["embedstream.me",37],["yts-subs.net",37],["cnnamador.com",38],["nudecelebforum.com",39],["pronpic.org",40],["thewebflash.com",41],["discordfastfood.com",41],["xup.in",41],["popularmechanics.com",42],["op.gg",43],["lequipe.fr",44],["comunidadgzone.es",45],["mp3fy.com",45],["lebensmittelpraxis.de",45],["ebookdz.com",45],["forum-pokemon-go.fr",45],["praxis-jugendarbeit.de",45],["gdrivez.xyz",45],["dictionnaire-medical.net",45],["cle0desktop.blogspot.com",45],["up-load.io",45],["direct-link.net",45],["direkt-wissen.com",45],["keysbrasil.blogspot.com",45],["hotpress.info",45],["turkleech.com",45],["anibatch.me",45],["anime-i.com",45],["plex-guide.de",45],["healthtune.site",45],["gewinde-normen.de",45],["tucinehd.com",45],["jellynote.com",46],["eporner.com",48],["pornbimbo.com",49],["allmonitors24.com",49],["4j.com",49],["avoiderrors.com",50],["cgtips.org",[50,211]],["sitarchive.com",50],["livenewsof.com",50],["topnewsshow.com",50],["gatcha.org",50],["empregoestagios.com",50],["everydayonsales.com",50],["kusonime.com",50],["aagmaal.xyz",50],["suicidepics.com",50],["codesnail.com",50],["codingshiksha.com",50],["graphicux.com",50],["asyadrama.com",50],["bitcoinegypt.news",50],["citychilli.com",50],["talkjarvis.com",50],["hdmotori.it",51],["femdomtb.com",53],["camhub.cc",53],["bobs-tube.com",53],["ru-xvideos.me",53],["pornfd.com",53],["popno-tour.net",53],["molll.mobi",53],["watchmdh.to",53],["camwhores.tv",53],["elfqrin.com",54],["satcesc.com",55],["apfelpatient.de",55],["lusthero.com",56],["m2list.com",57],["embed.nana2play.com",57],["elahmad.com",57],["dofusports.xyz",57],["dallasnews.com",58],["lnk.news",59],["lnk.parts",59],["efukt.com",60],["wendycode.com",60],["springfieldspringfield.co.uk",61],["porndoe.com",62],["smsget.net",[63,64]],["kjanime.net",65],["gioialive.it",66],["classicreload.com",67],["scriptzhub.com",67],["chicoer.com",68],["bostonherald.com",68],["dailycamera.com",68],["maxcheaters.com",69],["rbxoffers.com",69],["mhn.quest",69],["leagueofgraphs.com",69],["hieunguyenphoto.com",69],["texteditor.nsspot.net",69],["benzinpreis.de",69],["postimees.ee",69],["police.community",69],["gisarea.com",69],["schaken-mods.com",69],["theclashify.com",69],["newscon.org",69],["txori.com",69],["olarila.com",69],["deletedspeedstreams.blogspot.com",69],["schooltravelorganiser.com",69],["xhardhempus.net",69],["sportsplays.com",70],["deinesexfilme.com",72],["einfachtitten.com",72],["halloporno.com",72],["herzporno.com",72],["lesbenhd.com",72],["milffabrik.com",[72,241]],["porn-monkey.com",72],["porndrake.com",72],["pornhubdeutsch.net",72],["pornoaffe.com",72],["pornodavid.com",72],["pornoente.tv",[72,241]],["pornofisch.com",72],["pornofelix.com",72],["pornohammer.com",72],["pornohelm.com",72],["pornoklinge.com",72],["pornotom.com",[72,241]],["pornotommy.com",72],["pornovideos-hd.com",72],["pornozebra.com",[72,241]],["xhamsterdeutsch.xyz",72],["xnxx-sexfilme.com",72],["zerion.cc",72],["letribunaldunet.fr",73],["vladan.fr",73],["live-tv-channels.org",74],["eslfast.com",75],["freegamescasual.com",76],["tcpvpn.com",77],["oko.sh",77],["timesnownews.com",77],["timesnowhindi.com",77],["timesnowmarathi.com",77],["zoomtventertainment.com",77],["xxxuno.com",78],["sholah.net",79],["2rdroid.com",79],["bisceglielive.it",80],["pandajogosgratis.com.br",82],["5278.cc",83],["altblogger.net",84],["hl-live.de",84],["wohnmobilforum.de",84],["nulledbear.com",84],["satoshi-win.xyz",84],["encurtandourl.com",[84,145]],["freedeepweb.blogspot.com",84],["freesoft.id",84],["zcteam.id",84],["www-daftarharga.blogspot.com",84],["ear-phone-review.com",84],["telefullenvivo.com",84],["listatv.pl",84],["ltc-faucet.xyz",84],["coin-profits.xyz",84],["relampagomovies.com",84],["tonspion.de",86],["duplichecker.com",87],["plagiarismchecker.co",87],["plagiarismdetector.net",87],["searchenginereports.net",87],["giallozafferano.it",88],["autojournal.fr",88],["autoplus.fr",88],["sportauto.fr",88],["linkspaid.com",89],["proxydocker.com",89],["beeimg.com",[90,91]],["emturbovid.com",91],["ftlauderdalebeachcam.com",92],["ftlauderdalewebcam.com",92],["juneauharborwebcam.com",92],["keywestharborwebcam.com",92],["kittycatcam.com",92],["mahobeachcam.com",92],["miamiairportcam.com",92],["morganhillwebcam.com",92],["njwildlifecam.com",92],["nyharborwebcam.com",92],["paradiseislandcam.com",92],["pompanobeachcam.com",92],["portbermudawebcam.com",92],["portcanaveralwebcam.com",92],["portevergladeswebcam.com",92],["portmiamiwebcam.com",92],["portnywebcam.com",92],["portnassauwebcam.com",92],["portstmaartenwebcam.com",92],["portstthomaswebcam.com",92],["porttampawebcam.com",92],["sxmislandcam.com",92],["gearingcommander.com",92],["themes-dl.com",92],["badassdownloader.com",92],["badasshardcore.com",92],["badassoftcore.com",92],["nulljungle.com",92],["teevee.asia",92],["otakukan.com",92],["generate.plus",94],["calculate.plus",94],["avcesar.com",95],["audiotag.info",96],["tudigitale.it",97],["ibcomputing.com",98],["eodev.com",99],["legia.net",100],["acapellas4u.co.uk",101],["streamhentaimovies.com",102],["konten.co.id",103],["diariodenavarra.es",104],["tubereader.me",104],["scripai.com",104],["myfxbook.com",104],["whatfontis.com",104],["xiaomifans.pl",105],["eletronicabr.com",105],["optifine.net",106],["luzernerzeitung.ch",107],["tagblatt.ch",107],["spellcheck.net",108],["spellchecker.net",108],["spellweb.com",108],["ableitungsrechner.net",109],["alternet.org",110],["gourmetsupremacy.com",110],["imtranslator.net",111],["shrib.com",112],["pandafiles.com",113],["vidia.tv",[113,134]],["hortonanderfarom.blogspot.com",113],["clarifystraight.com",113],["tutelehd3.xyz",114],["mega4upload.com",114],["coolcast2.com",114],["techclips.net",114],["earthquakecensus.com",114],["footyhunter.lol",114],["gamerarcades.com",114],["poscitech.click",114],["starlive.stream",114],["utopianwilderness.com",114],["wecast.to",114],["sportbar.live",114],["lordchannel.com",114],["play-old-pc-games.com",115],["tunovelaligera.com",116],["tapchipi.com",116],["cuitandokter.com",116],["tech-blogs.com",116],["cardiagn.com",116],["dcleakers.com",116],["esgeeks.com",116],["pugliain.net",116],["uplod.net",116],["worldfreeware.com",116],["fikiri.net",116],["myhackingworld.com",116],["phoenixfansub.com",116],["freecourseweb.com",117],["devcourseweb.com",117],["coursewikia.com",117],["courseboat.com",117],["coursehulu.com",117],["lne.es",121],["pornult.com",122],["webcamsdolls.com",122],["bitcotasks.com",[122,167]],["adsy.pw",122],["playstore.pw",122],["exactpay.online",122],["thothd.to",122],["proplanta.de",123],["hydrogenassociation.org",124],["ludigames.com",124],["sportitalialive.com",124],["tii.la",124],["made-by.org",124],["xenvn.com",124],["worldtravelling.com",124],["igirls.in",124],["technichero.com",124],["roshiyatech.my.id",124],["24sport.stream",124],["aeroxplorer.com",124],["mad4wheels.com",125],["logi.im",125],["emailnator.com",125],["textograto.com",126],["voyageforum.com",127],["hmc-id.blogspot.com",127],["jemerik.com",127],["myabandonware.com",127],["chatta.it",129],["ketubanjiwa.com",130],["nsfw247.to",131],["funzen.net",131],["fighter.stream",131],["ilclubdellericette.it",131],["hubstream.in",131],["extremereportbot.com",132],["getintopc.com",133],["qoshe.com",135],["lowellsun.com",136],["mamadu.pl",136],["dobrapogoda24.pl",136],["motohigh.pl",136],["namasce.pl",136],["ultimate-catch.eu",137],["cpopchanelofficial.com",138],["creditcardgenerator.com",139],["creditcardrush.com",139],["bostoncommons.net",139],["thejobsmovie.com",139],["livsavr.co",139],["nilopolisonline.com.br",140],["mesquitaonline.com",140],["yellowbridge.com",140],["socialgirls.im",141],["yaoiotaku.com",142],["camhub.world",143],["moneyhouse.ch",144],["ihow.info",145],["filesus.com",145],["sturls.com",145],["re.two.re",145],["turbo1.co",145],["cartoonsarea.xyz",145],["valeronevijao.com",146],["cigarlessarefy.com",146],["figeterpiazine.com",146],["yodelswartlike.com",146],["generatesnitrosate.com",146],["crownmakermacaronicism.com",146],["chromotypic.com",146],["gamoneinterrupted.com",146],["metagnathtuggers.com",146],["wolfdyslectic.com",146],["rationalityaloelike.com",146],["sizyreelingly.com",146],["simpulumlamerop.com",146],["urochsunloath.com",146],["monorhinouscassaba.com",146],["counterclockwisejacky.com",146],["35volitantplimsoles5.com",146],["scatch176duplicities.com",146],["antecoxalbobbing1010.com",146],["boonlessbestselling244.com",146],["cyamidpulverulence530.com",146],["guidon40hyporadius9.com",146],["449unceremoniousnasoseptal.com",146],["19turanosephantasia.com",146],["30sensualizeexpression.com",146],["321naturelikefurfuroid.com",146],["745mingiestblissfully.com",146],["availedsmallest.com",146],["greaseball6eventual20.com",146],["toxitabellaeatrebates306.com",146],["20demidistance9elongations.com",146],["audaciousdefaulthouse.com",146],["fittingcentermondaysunday.com",146],["fraudclatterflyingcar.com",146],["launchreliantcleaverriver.com",146],["matriculant401merited.com",146],["realfinanceblogcenter.com",146],["reputationsheriffkennethsand.com",146],["telyn610zoanthropy.com",146],["tubelessceliolymph.com",146],["tummulerviolableness.com",146],["un-block-voe.net",146],["v-o-e-unblock.com",146],["voe-un-block.com",146],["voeun-block.net",146],["voeunbl0ck.com",146],["voeunblck.com",146],["voeunblk.com",146],["voeunblock.com",146],["voeunblock1.com",146],["voeunblock2.com",146],["voeunblock3.com",146],["agefi.fr",147],["cariskuy.com",148],["letras2.com",148],["yusepjaelani.blogspot.com",149],["letras.mus.br",150],["mtlurb.com",151],["port.hu",152],["acdriftingpro.com",152],["flight-report.com",152],["forumdz.com",152],["abandonmail.com",152],["flmods.com",152],["zilinak.sk",152],["projectfreetv.stream",152],["hotdesimms.com",152],["pdfaid.com",152],["mconverter.eu",152],["dzeko11.net",[152,266]],["mail.com",152],["expresskaszubski.pl",152],["moegirl.org.cn",152],["onemanhua.com",153],["t3n.de",154],["allindiaroundup.com",155],["vectorizer.io",156],["smgplaza.com",156],["onehack.us",156],["thapcam.net",156],["thefastlaneforum.com",157],["trade2win.com",158],["gmodleaks.com",158],["modagamers.com",159],["freemagazines.top",159],["straatosphere.com",159],["nullpk.com",159],["adslink.pw",159],["downloadudemy.com",159],["picgiraffe.com",159],["weadown.com",159],["freepornsex.net",159],["nurparatodos.com.ar",159],["librospreuniversitariospdf.blogspot.com",160],["msdos-games.com",160],["forexeen.us",160],["khsm.io",160],["webcreator-journal.com",160],["nu6i-bg-net.com",160],["routech.ro",161],["hokej.net",161],["turkmmo.com",162],["palermotoday.it",163],["baritoday.it",163],["trentotoday.it",163],["agrigentonotizie.it",163],["anconatoday.it",163],["arezzonotizie.it",163],["avellinotoday.it",163],["bresciatoday.it",163],["brindisireport.it",163],["casertanews.it",163],["cataniatoday.it",163],["cesenatoday.it",163],["chietitoday.it",163],["forlitoday.it",163],["frosinonetoday.it",163],["genovatoday.it",163],["ilpescara.it",163],["ilpiacenza.it",163],["latinatoday.it",163],["lecceprima.it",163],["leccotoday.it",163],["livornotoday.it",163],["messinatoday.it",163],["milanotoday.it",163],["modenatoday.it",163],["monzatoday.it",163],["novaratoday.it",163],["padovaoggi.it",163],["parmatoday.it",163],["perugiatoday.it",163],["pisatoday.it",163],["quicomo.it",163],["ravennatoday.it",163],["reggiotoday.it",163],["riminitoday.it",163],["romatoday.it",163],["salernotoday.it",163],["sondriotoday.it",163],["sportpiacenza.it",163],["ternitoday.it",163],["today.it",163],["torinotoday.it",163],["trevisotoday.it",163],["triesteprima.it",163],["udinetoday.it",163],["veneziatoday.it",163],["vicenzatoday.it",163],["thumpertalk.com",164],["arkcod.org",164],["facciabuco.com",165],["softx64.com",166],["thelayoff.com",167],["blog.cryptowidgets.net",167],["blog.insurancegold.in",167],["blog.wiki-topia.com",167],["blog.coinsvalue.net",167],["blog.cookinguide.net",167],["blog.freeoseocheck.com",167],["blog.makeupguide.net",167],["blog.carstopia.net",167],["blog.carsmania.net",167],["shorterall.com",167],["blog24.me",167],["maxstream.video",167],["maxlinks.online",167],["tvepg.eu",167],["pstream.net",168],["dailymaverick.co.za",169],["apps2app.com",170],["cheatermad.com",171],["ville-ideale.fr",172],["fm-arena.com",173],["tradersunion.com",174],["tandess.com",175],["faqwiki.us",176],["sonixgvn.net",176],["spontacts.com",177],["dankmemer.lol",178],["apkmoddone.com",179],["getexploits.com",180],["fplstatistics.com",181],["enit.in",182],["financerites.com",182],["fadedfeet.com",183],["homeculina.com",183],["ineedskin.com",183],["kenzo-flowertag.com",183],["lawyex.co",183],["mdn.lol",183],["bitzite.com",184],["coingraph.us",185],["impact24.us",185],["my-code4you.blogspot.com",186],["vrcmods.com",187],["osuskinner.com",187],["osuskins.net",187],["pentruea.com",[188,189]],["mchacks.net",190],["why-tech.it",191],["compsmag.com",192],["tapetus.pl",193],["gaystream.online",194],["bembed.net",194],["embedv.net",194],["fslinks.org",194],["v6embed.xyz",194],["vgplayer.xyz",194],["vid-guard.com",194],["autoroad.cz",195],["brawlhalla.fr",195],["tecnobillo.com",195],["sexcamfreeporn.com",196],["breatheheavy.com",197],["wenxuecity.com",198],["key-hub.eu",199],["fabioambrosi.it",200],["tattle.life",201],["emuenzen.de",201],["terrylove.com",201],["mynet.com",202],["cidade.iol.pt",203],["fantacalcio.it",204],["hentaifreak.org",205],["hypebeast.com",206],["krankheiten-simulieren.de",207],["catholic.com",208],["ad-doge.com",209],["3dmodelshare.org",210],["gourmetscans.net",211],["techinferno.com",212],["ibeconomist.com",213],["bookriot.com",214],["purposegames.com",215],["schoolcheats.net",215],["globo.com",216],["latimes.com",216],["claimrbx.gg",217],["perelki.net",218],["vpn-anbieter-vergleich-test.de",219],["livingincebuforums.com",220],["paperzonevn.com",221],["alltechnerd.com",222],["malaysianwireless.com",223],["erinsakura.com",224],["infofuge.com",224],["freejav.guru",224],["novelmultiverse.com",224],["fritidsmarkedet.dk",225],["maskinbladet.dk",225],["15min.lt",226],["lewdninja.com",227],["lewd.ninja",227],["baddiehub.com",228],["mr9soft.com",229],["21porno.com",230],["adult-sex-gamess.com",231],["hentaigames.app",231],["mobilesexgamesx.com",231],["mysexgamer.com",231],["porngameshd.com",231],["sexgamescc.com",231],["xnxx-sex-videos.com",231],["f2movies.to",232],["freeporncave.com",233],["tubsxxx.com",234],["pornojenny.com",235],["subtitle.one",236],["manga18fx.com",237],["freebnbcoin.com",237],["sextvx.com",238],["studydhaba.com",239],["freecourse.tech",239],["victor-mochere.com",239],["papunika.com",239],["mobilanyheter.net",239],["prajwaldesai.com",[239,258]],["ftuapps.dev",239],["muztext.com",240],["pornohans.com",241],["nursexfilme.com",241],["pornohirsch.net",241],["xhamster-sexvideos.com",241],["pornoschlange.com",241],["hdpornos.net",241],["gutesexfilme.com",241],["short1.site",241],["zona-leros.com",241],["charbelnemnom.com",242],["simplebits.io",243],["online-fix.me",244],["gamersdiscussionhub.com",245],["owlzo.com",246],["q1003.com",247],["blogpascher.com",248],["testserver.pro",249],["lifestyle.bg",249],["money.bg",249],["news.bg",249],["topsport.bg",249],["webcafe.bg",249],["mgnet.xyz",250],["advertiserandtimes.co.uk",251],["xvideos2020.me",252],["111.90.159.132",253],["techsolveprac.com",254],["joomlabeginner.com",255],["largescaleforums.com",256],["dubznetwork.com",257],["mundodonghua.com",257],["hentaidexy.com",259],["code2care.org",260],["xxxxsx.com",262],["ngontinh24.com",263],["panel.freemcserver.net",264],["idevicecentral.com",265],["zona11.com",266],["scsport.live",266],["mangacrab.com",268],["idnes.cz",269],["viefaucet.com",270],["cloud-computing-central.com",271],["afk.guide",272],["businessnamegenerator.com",273],["derstandard.at",274],["derstandard.de",274],["rocketnews24.com",275],["soranews24.com",275],["youpouch.com",275],["ilsole24ore.com",276],["ipacrack.com",277],["hentaiporn.one",278],["infokik.com",279],["daemonanime.net",280],["daemon-hentai.com",280],["deezer.com",281],["fosslinux.com",282],["shrdsk.me",283],["examword.com",284],["sempreupdate.com.br",284],["tribuna.com",285],["trendsderzukunft.de",286],["gal-dem.com",286],["lostineu.eu",286],["oggitreviso.it",286],["speisekarte.de",286],["mixed.de",286],["lightnovelspot.com",[287,288]],["lightnovelworld.com",[287,288]],["novelpub.com",[287,288]],["webnovelpub.com",[287,288]],["mail.yahoo.com",289],["hwzone.co.il",290],["nammakalvi.com",291],["javmoon.me",292],["c2g.at",293],["terafly.me",293],["elamigos-games.com",293],["elamigos-games.net",293],["dktechnicalmate.com",294],["recipahi.com",294],["converter-btc.world",294],["kaystls.site",295],["aquarius-horoscopes.com",296],["cancer-horoscopes.com",296],["dubipc.blogspot.com",296],["echoes.gr",296],["engel-horoskop.de",296],["freegames44.com",296],["fuerzasarmadas.eu",296],["gemini-horoscopes.com",296],["jurukunci.net",296],["krebs-horoskop.com",296],["leo-horoscopes.com",296],["maliekrani.com",296],["nklinks.click",296],["ourenseando.es",296],["pisces-horoscopes.com",296],["radio-en-direct.fr",296],["sagittarius-horoscopes.com",296],["scorpio-horoscopes.com",296],["singlehoroskop-loewe.de",296],["skat-karten.de",296],["skorpion-horoskop.com",296],["taurus-horoscopes.com",296],["the1security.com",296],["torrentmovies.online",296],["virgo-horoscopes.com",296],["zonamarela.blogspot.com",296],["yoima.hatenadiary.com",296],["vpntester.org",297],["watchhentai.net",298],["japscan.lol",299],["digitask.ru",300],["tempumail.com",301],["sexvideos.host",302],["10alert.com",304],["cryptstream.de",305],["nydus.org",305],["techhelpbd.com",306],["fapdrop.com",307],["cellmapper.net",308],["hdrez.com",309],["youwatch-serie.com",309],["printablecreative.com",310],["comohoy.com",311],["leak.sx",311],["paste.bin.sx",311],["pornleaks.in",311],["merlininkazani.com",311],["j91.asia",313],["jeniusplay.com",314],["indianyug.com",315],["rgb.vn",315],["needrom.com",316],["criptologico.com",317],["megadrive-emulator.com",318],["eromanga-show.com",319],["hentai-one.com",319],["hentaipaw.com",319],["10minuteemails.com",320],["luxusmail.org",320],["w3cub.com",321],["bangpremier.com",322],["nyaa.iss.ink",323],["tnp98.xyz",325],["freepdfcomic.com",326],["memedroid.com",327],["animesync.org",328],["karaoketexty.cz",329],["resortcams.com",330],["mjakmama24.pl",332],["security-demo.extrahop.com",333]]);

const entitiesMap = new Map([["comunio",0],["finanzen",[0,6]],["gameswelt",0],["heftig",0],["notebookcheck",0],["testedich",0],["transfermarkt",0],["truckscout24",0],["tvtv",0],["wetteronline",0],["wieistmeineip",0],["wetter",2],["1337x",5],["eztv",5],["sushi-scan",9],["spigotunlocked",9],["ahmedmode",9],["kissasian",12],["rp5",13],["mma-core",14],["yts",19],["720pstream",19],["1stream",19],["magesy",20],["shortzzy",22],["thefmovies",24],["urlcero",31],["totaldebrid",34],["sandrives",34],["oploverz",35],["writedroid",36],["fxporn69",45],["aliancapes",45],["pouvideo",47],["povvideo",47],["povw1deo",47],["povwideo",47],["powv1deo",47],["powvibeo",47],["powvideo",47],["powvldeo",47],["tubsexer",53],["porno-tour",53],["lenkino",53],["pornomoll",53],["camsclips",53],["m4ufree",57],["telerium",71],["pandafreegames",85],["thoptv",93],["brainly",99],["streameast",114],["thestreameast",114],["daddylivehd",114],["solvetube",118],["hdfilme",119],["pornhub",120],["wcofun",127],["bollyholic",131],["gotxx",145],["turkanime",146],["voe-unblock",146],["khatrimaza",159],["pogolinks",159],["popcornstream",161],["vembed",194],["xhamsterdeutsch",241],["privatemoviez",245],["gmx",261],["lightnovelpub",[287,288]],["camcaps",303],["drivebot",324],["thenextplanet1",325],["autoscout24",331]]);

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
