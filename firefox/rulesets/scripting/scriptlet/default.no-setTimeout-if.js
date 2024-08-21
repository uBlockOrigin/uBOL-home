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

/* eslint-disable indent */
/* global cloneInto */

// ruleset: default

/******************************************************************************/

// Important!
// Isolate from global scope

// Start of local scope
(( ) => {

/******************************************************************************/

// Start of code to inject
const uBOL_noSetTimeoutIf = function() {

const scriptletGlobals = {}; // eslint-disable-line

const argsList = [[".call(null)","10"],[".call(null)"],["(null)","10"],["userHasAdblocker"],["adb"],["nrWrapper"],["warn"],["adBlockerDetected"],["show"],["InfMediafireMobileFunc","1000"],["google_jobrunner"],["()","45000"],["0x"],["displayAdBlockedVideo"],[".adsbygoogle"],["isDesktopApp","1000"],["Bait"],["admc"],["'0x"],["apstagLOADED"],["/Adb|moneyDetect/"],["disableDeveloper"],["Blocco","2000"],["test","0"],["checkAdblockUser","1000"],["checkPub","6000"],["document.querySelector","5000"],["nextFunction","250"],["()","150"],["backRedirect"],["document.querySelectorAll","1000"],["style"],["clientHeight"],["addEventListener","0"],["adblock","2000"],["start","0"],["nextFunction","2000"],["byepopup","5000"],["test.remove","100"],["additional_src","300"],["()","2000"],["css_class.show"],["CANG","3000"],["updato-overlay","500"],["innerText","2000"],["alert","8000"],["css_class"],["()","50"],["debugger"],["initializeCourier","3000"],["redirectPage"],["_0x","2000"],["ads","750"],["location.href","500"],["Adblock","5000"],["disable","200"],["CekAab","0"],["rbm_block_active","1000"],["show()"],["_0x"],["n.trigger","1"],["adblock"],["abDetected"],["KeepOpeningPops","1000"],["location.href"],["appendChild"],["adb","0"],["adBlocked"],["warning","100"],["adblock_popup","500"],["Adblock"],["location.href","10000"],["#chatWrap","1000"],["keep-ads","2000"],["#rbm_block_active","1000"],["null","4000"],["()","2500"],["myaabpfun","3000"],["nextFunction"],["adFilled","2500"],["()","15000"],["showPopup"],["()","1"],["()","1000"],["document.cookie","2500"],["window.open"],["innerHTML"],["readyplayer","2000"],["/innerHTML|AdBlock/"],["checkStopBlock"],["adspot_top","1500"],["/offsetHeight|google|Global/"],["an_message","500"],["Adblocker","10000"],["timeoutChecker"],["bait","1"],["ai_adb"],["pum-open"],["overlay","2000"],["/adblock/i"],["test","100"],["Math.round","1000"],["adblock","5"],["bioEp"],["ag_adBlockerDetected"],["null"],["adb","6000"],["pop"],["sadbl"],["checkAdStatus"],["mdp"],["brave_load_popup"],["0x","3000"],["invoke"],["adsbytrafficjunkycontext"],["ipod"],["offsetWidth"],["/$|adBlock/"],["ads"],["adsbygoogle"],["()"],["AdBlock"],["stop-scrolling"],["Adv"],["blockUI","2000"],["mdpDeBlocker"],["/_0x|debug/"],["/ai_adb|_0x/"],["iframe"],["adBlock"],["","1"],["undefined"],["check","1"],["adsBlocked"],["blocker"],["aswift_"],["afs_ads","2000"],["visibility","2000"],["bait"],["getComputedStyle","250"],["blocked"],["{r()","0"],["nextFunction","450"],["Debug"],["r()","0"],["purple_box"],["offsetHeight"],["checkSiteNormalLoad"],["adBlockOverlay"],["Detected","500"],["modal"],[".show","1000"],[".show"],["showModal"],["getComputedStyle"],["blur"],["samOverlay"],["bADBlock"],["location"],["","4000"],["blocker","100"],["alert"],["length"],["t()","0"],["$"],["offset"],["contrformpub"],["trigger","0"],["popup"],["getComputedStyle","2000"],["video-popup"],["detectAdblock"],["EzoIvent"],["detectAdBlocker"],["nads"],["1e3*"],["current.children"],["adStatus"],["BN_CAMPAIGNS"],["media_place_list"],["cvad"],["...","300"],["/\\{[a-z]\\(!0\\)\\}/"],["error"],["stackTrace"],["inner-ad"],["_ET"],[".clientHeight"],["getComputedStyle(el)"],["location.replace"],["console.clear"],["ad_block_detector"],["documentElement.innerHTML"],["","5"],["/adblock|isRequestPresent/"],["_0x","500"],["isRequestPresent"],["adsPost"],["_0x","1000"],["offsetLeft"],["height"],["mdp_deblocker"],["charAt"],["checkAds"],["fadeIn","0"],["jQuery"],["/^/"],["afterOpen"],["check"],["Adblocker"],["eabdModal"],["ab_root.show"],["gaData"],["ad"],["prompt","1000"],["googlefc"],["adblock detection"],[".offsetHeight","100"],["popState"],["ad-block-popup"],["exitTimer"],["innerHTML.replace"],["ab","2000"],["data?","4000"],[".data?"],["eabpDialog"],["adsense"],["/Adblock|_ad_/"],["googletag"],["f.parentNode.removeChild(f)","100"],["swal","500"],["keepChecking","1000"],["openPopup"],[".offsetHeight"],["()=>{"],["nitroAds"],["class.scroll","1000"],["disableDeveloperTools"],["Check"],["insertBefore"],["css_class.scroll"],["/null|Error/","10000"],["window.location.href","50"],["/out.php"],["/0x|devtools/"],["location.replace","300"],["window.location.href"],["checkVisible"],["_0x","3000"],["fetch"],["window.location.href=link"],["ai_"],["reachGoal"],["Adb"],["ai"],["","3000"],["/width|innerHTML/"],["magnificPopup"],["adblockEnabled"],["google_ad"],["document.location"],["google"],["top-right","2000"],["enforceAdStatus"],["loadScripts"],["mfp"],["display","5000"],["eb"],[").show()"],["","1000"],["site-access"],["atob"],["/show|document\\.createElement/"],["Msg"],["UABP"],["href"],["aaaaa-modal"],["()=>"],["keepChecking"],["loader.min.js"],["error-report.com"],["null","10"],["","500"],["/Adform|didomi|adblock|forEach/"],["showAdblock"],["-0x"],["display"],["gclid"],["event","3000"],["rejectWith"],["refresh"],["location.href","3000"],["window.location"],["ga"],["adbl"],["Ads"],["ShowAdBLockerNotice"],["ad_listener"],["open"],["(!0)"],["Delay"],["/appendChild|e\\(\"/"],["=>"],["ADB"],["site-access-popup"],["data?"],["/debugger|UserCustomPop/"],["checkAdblockUser"],["offsetHeight","100"],["AdDetect"],["displayMessage","2000"],["/salesPopup|mira-snackbar/"],["advanced"],["detectImgLoad"],["offsetHeight","200"],["detector"],["replace"],["touchstart"],["siteAccessFlag"],["ab"],["/adblocker|alert/"],["redURL"],["/children\\('ins'\\)|Adblock|adsbygoogle/"],["displayMessage"],["/adblock|googletag/"],["chkADB"],["onDetected"],["myinfoey","1500"],["fuckadb"],["detect"],["siteAccessPopup"],["/adsbygoogle|adblock/"],["akadb"],["biteDisplay"],["/[a-z]\\(!0\\)/","800"],["ad_block"],["/detectAdBlocker|window.open/"],["adBlockDetected"],["popUnder"],["/GoToURL|delay/"],["window.location.href","300"],["ad_display"],["/adScriptPath|MMDConfig/"],["0x","100"],["/native|\\{n\\(\\)/"],["psresimler"],["adblocker"],["/Detect|adblock|style\\.display|\\[native code]|\\.call\\(null\\)/"],["removeChild"],["ad blocker"],["googleFC"],["hasAdblock"]];

const hostnamesMap = new Map([["4-liga.com",0],["4fansites.de",0],["4players.de",0],["9monate.de",0],["aachener-nachrichten.de",0],["aachener-zeitung.de",0],["abendblatt.de",0],["abendzeitung-muenchen.de",0],["about-drinks.com",0],["abseits-ka.de",0],["airliners.de",0],["ajaxshowtime.com",0],["allgemeine-zeitung.de",0],["alpin.de",0],["antenne.de",0],["arcor.de",0],["areadvd.de",0],["areamobile.de",0],["ariva.de",0],["astronews.com",0],["aussenwirtschaftslupe.de",0],["auszeit.bio",0],["auto-motor-und-sport.de",0],["auto-service.de",0],["autobild.de",0],["autoextrem.de",0],["autopixx.de",0],["autorevue.at",0],["az-online.de",0],["baby-vornamen.de",0],["babyclub.de",0],["bafoeg-aktuell.de",0],["berliner-kurier.de",0],["berliner-zeitung.de",0],["bigfm.de",0],["bikerszene.de",0],["bildderfrau.de",0],["blackd.de",0],["blick.de",0],["boerse-online.de",0],["boerse.de",0],["boersennews.de",0],["braunschweiger-zeitung.de",0],["brieffreunde.de",0],["brigitte.de",0],["buerstaedter-zeitung.de",0],["buffed.de",0],["businessinsider.de",0],["buzzfeed.at",0],["buzzfeed.de",0],["caravaning.de",0],["cavallo.de",0],["chefkoch.de",0],["cinema.de",0],["clever-tanken.de",0],["computerbild.de",0],["computerhilfen.de",0],["comunio-cl.com",0],["connect.de",0],["chip.de",0],["da-imnetz.de",0],["dasgelbeblatt.de",0],["dbna.com",0],["dbna.de",0],["deichstube.de",0],["deine-tierwelt.de",0],["der-betze-brennt.de",0],["derwesten.de",0],["desired.de",0],["dhd24.com",0],["dieblaue24.com",0],["digitalfernsehen.de",0],["dnn.de",0],["donnerwetter.de",0],["e-hausaufgaben.de",0],["e-mountainbike.com",0],["eatsmarter.de",0],["echo-online.de",0],["ecomento.de",0],["einfachschoen.me",0],["elektrobike-online.com",0],["eltern.de",0],["epochtimes.de",0],["essen-und-trinken.de",0],["express.de",0],["extratipp.com",0],["familie.de",0],["fanfiktion.de",0],["fehmarn24.de",0],["fettspielen.de",0],["fid-gesundheitswissen.de",0],["finanznachrichten.de",0],["finanztreff.de",0],["finya.de",0],["firmenwissen.de",0],["fitforfun.de",0],["fnp.de",0],["football365.fr",0],["formel1.de",0],["fr.de",0],["frankfurter-wochenblatt.de",0],["freenet.de",0],["fremdwort.de",0],["froheweihnachten.info",0],["frustfrei-lernen.de",0],["fuldaerzeitung.de",0],["funandnews.de",0],["fussballdaten.de",0],["futurezone.de",0],["gala.de",0],["gamepro.de",0],["gamersglobal.de",0],["gamesaktuell.de",0],["gamestar.de",0],["gamezone.de",0],["gartendialog.de",0],["gartenlexikon.de",0],["gedichte.ws",0],["geissblog.koeln",0],["gelnhaeuser-tageblatt.de",0],["general-anzeiger-bonn.de",0],["geniale-tricks.com",0],["genialetricks.de",0],["gesund-vital.de",0],["gesundheit.de",0],["gevestor.de",0],["gewinnspiele.tv",0],["giessener-allgemeine.de",0],["giessener-anzeiger.de",0],["gifhorner-rundschau.de",0],["giga.de",0],["gipfelbuch.ch",0],["gmuender-tagespost.de",0],["golem.de",[0,7,8]],["gruenderlexikon.de",0],["gusto.at",0],["gut-erklaert.de",0],["gutfuerdich.co",0],["hallo-muenchen.de",0],["hamburg.de",0],["hanauer.de",0],["hardwareluxx.de",0],["hartziv.org",0],["harzkurier.de",0],["haus-garten-test.de",0],["hausgarten.net",0],["haustec.de",0],["haz.de",0],["heidelberg24.de",0],["heilpraxisnet.de",0],["heise.de",0],["helmstedter-nachrichten.de",0],["hersfelder-zeitung.de",0],["hftg.co",0],["hifi-forum.de",0],["hna.de",0],["hochheimer-zeitung.de",0],["hoerzu.de",0],["hofheimer-zeitung.de",0],["iban-rechner.de",0],["ikz-online.de",0],["immobilienscout24.de",0],["ingame.de",0],["inside-digital.de",0],["inside-handy.de",0],["investor-verlag.de",0],["jappy.com",0],["jpgames.de",0],["kabeleins.de",0],["kachelmannwetter.com",0],["kamelle.de",0],["kicker.de",0],["kindergeld.org",0],["klettern-magazin.de",0],["klettern.de",0],["kochbar.de",0],["kreis-anzeiger.de",0],["kreisbote.de",0],["kreiszeitung.de",0],["ksta.de",0],["kurierverlag.de",0],["lachainemeteo.com",0],["lampertheimer-zeitung.de",0],["landwirt.com",0],["laut.de",0],["lauterbacher-anzeiger.de",0],["leckerschmecker.me",0],["leinetal24.de",0],["lesfoodies.com",0],["levif.be",0],["lifeline.de",0],["liga3-online.de",0],["likemag.com",0],["linux-community.de",0],["linux-magazin.de",0],["live.vodafone.de",0],["ln-online.de",0],["lokalo24.de",0],["lustaufsleben.at",0],["lustich.de",0],["lvz.de",0],["lz.de",0],["mactechnews.de",0],["macwelt.de",0],["macworld.co.uk",0],["mail.de",0],["main-spitze.de",0],["manager-magazin.de",0],["manga-tube.me",0],["mathebibel.de",0],["mathepower.com",0],["maz-online.de",0],["medisite.fr",0],["mehr-tanken.de",0],["mein-kummerkasten.de",0],["mein-mmo.de",0],["mein-wahres-ich.de",0],["meine-anzeigenzeitung.de",0],["meinestadt.de",0],["menshealth.de",0],["mercato365.com",0],["merkur.de",0],["messen.de",0],["metal-hammer.de",0],["metalflirt.de",0],["meteologix.com",0],["minecraft-serverlist.net",0],["mittelbayerische.de",0],["modhoster.de",0],["moin.de",0],["mopo.de",0],["morgenpost.de",0],["motor-talk.de",0],["motorbasar.de",0],["motorradonline.de",0],["motorsport-total.com",0],["motortests.de",0],["mountainbike-magazin.de",0],["moviejones.de",0],["moviepilot.de",0],["mt.de",0],["mtb-news.de",0],["musiker-board.de",0],["musikexpress.de",0],["musikradar.de",0],["mz-web.de",0],["n-tv.de",0],["naumburger-tageblatt.de",0],["netzwelt.de",0],["neuepresse.de",0],["neueroeffnung.info",0],["news.at",0],["news.de",0],["news38.de",0],["newsbreak24.de",0],["nickles.de",0],["nicknight.de",0],["nl.hardware.info",0],["nn.de",0],["nnn.de",0],["nordbayern.de",0],["notebookchat.com",0],["notebookcheck-ru.com",0],["notebookcheck-tr.com",0],["noz-cdn.de",0],["noz.de",0],["nrz.de",0],["nw.de",0],["nwzonline.de",0],["oberhessische-zeitung.de",0],["och.to",0],["oeffentlicher-dienst.info",0],["onlinekosten.de",0],["onvista.de",0],["op-marburg.de",0],["op-online.de",0],["outdoor-magazin.com",0],["outdoorchannel.de",0],["paradisi.de",0],["pc-magazin.de",0],["pcgames.de",0],["pcgameshardware.de",0],["pcwelt.de",0],["pcworld.es",0],["peiner-nachrichten.de",0],["pferde.de",0],["pietsmiet.de",0],["pixelio.de",0],["pkw-forum.de",0],["playboy.de",0],["playfront.de",0],["pnn.de",0],["pons.com",0],["prad.de",[0,122]],["prignitzer.de",0],["profil.at",0],["promipool.de",0],["promobil.de",0],["prosiebenmaxx.de",0],["psychic.de",[0,146]],["quoka.de",0],["radio.at",0],["radio.de",0],["radio.dk",0],["radio.es",0],["radio.fr",0],["radio.it",0],["radio.net",0],["radio.pl",0],["radio.pt",0],["radio.se",0],["ran.de",0],["readmore.de",0],["rechtslupe.de",0],["recording.de",0],["rennrad-news.de",0],["reuters.com",0],["reviersport.de",0],["rhein-main-presse.de",0],["rheinische-anzeigenblaetter.de",0],["rimondo.com",0],["roadbike.de",0],["roemische-zahlen.net",0],["rollingstone.de",0],["rot-blau.com",0],["rp-online.de",0],["rtl.de",[0,281]],["rtv.de",0],["rugby365.fr",0],["ruhr24.de",0],["rundschau-online.de",0],["runnersworld.de",0],["safelist.eu",0],["salzgitter-zeitung.de",0],["sat1.de",0],["sat1gold.de",0],["schoener-wohnen.de",0],["schwaebische-post.de",0],["schwarzwaelder-bote.de",0],["serienjunkies.de",0],["shz.de",0],["sixx.de",0],["skodacommunity.de",0],["smart-wohnen.net",0],["sn.at",0],["sozialversicherung-kompetent.de",0],["spiegel.de",0],["spielen.de",0],["spieletipps.de",0],["spielfilm.de",0],["sport.de",0],["sport365.fr",0],["sportal.de",0],["spox.com",0],["stern.de",0],["stuttgarter-nachrichten.de",0],["stuttgarter-zeitung.de",0],["sueddeutsche.de",0],["svz.de",0],["szene1.at",0],["szene38.de",0],["t-online.de",0],["tagesspiegel.de",0],["taschenhirn.de",0],["techadvisor.co.uk",0],["techstage.de",0],["tele5.de",0],["the-voice-of-germany.de",0],["thueringen24.de",0],["tichyseinblick.de",0],["tierfreund.co",0],["tiervermittlung.de",0],["torgranate.de",0],["trend.at",0],["tv-media.at",0],["tvdigital.de",0],["tvinfo.de",0],["tvspielfilm.de",0],["tvtoday.de",0],["tz.de",0],["unicum.de",0],["unnuetzes.com",0],["unsere-helden.com",0],["unterhalt.net",0],["usinger-anzeiger.de",0],["usp-forum.de",0],["videogameszone.de",0],["vienna.at",0],["vip.de",0],["virtualnights.com",0],["vox.de",0],["wa.de",0],["wallstreet-online.de",[0,3]],["waz.de",0],["weather.us",0],["webfail.com",0],["weihnachten.me",0],["weihnachts-bilder.org",0],["weihnachts-filme.com",0],["welt.de",0],["weltfussball.at",0],["weristdeinfreund.de",0],["werkzeug-news.de",0],["werra-rundschau.de",0],["wetterauer-zeitung.de",0],["wiesbadener-kurier.de",0],["wiesbadener-tagblatt.de",0],["winboard.org",0],["windows-7-forum.net",0],["winfuture.de",0],["wintotal.de",0],["wlz-online.de",0],["wn.de",0],["wohngeld.org",0],["wolfenbuetteler-zeitung.de",0],["wolfsburger-nachrichten.de",0],["woman.at",0],["womenshealth.de",0],["wormser-zeitung.de",0],["woxikon.de",0],["wp.de",0],["wr.de",0],["yachtrevue.at",0],["ze.tt",0],["zeit.de",0],["meineorte.com",1],["osthessen-news.de",1],["techadvisor.com",1],["focus.de",1],["m.timesofindia.com",4],["timesofindia.indiatimes.com",4],["youmath.it",4],["redensarten-index.de",4],["lesoir.be",4],["electriciansforums.net",4],["keralatelecom.info",4],["betaseries.com",4],["free-sms-receive.com",4],["sms-receive-online.com",4],["universegunz.net",4],["happypenguin.altervista.org",4],["everyeye.it",4],["bluedrake42.com",4],["streamservicehd.click",4],["supermarioemulator.com",4],["futbollibrehd.com",4],["eska.pl",4],["eskarock.pl",4],["voxfm.pl",4],["mathaeser.de",4],["freethesaurus.com",6],["thefreedictionary.com",6],["hdbox.ws",8],["todopolicia.com",8],["scat.gold",8],["freecoursesite.com",8],["windowcleaningforums.co.uk",8],["cruisingearth.com",8],["hobby-machinist.com",8],["freegogpcgames.com",8],["starleaks.org",8],["latitude.to",8],["kitchennovel.com",8],["w3layouts.com",8],["blog.receivefreesms.co.uk",8],["eductin.com",8],["dealsfinders.blog",8],["audiobooks4soul.com",8],["tinhocdongthap.com",8],["sakarnewz.com",8],["downloadr.in",8],["topcomicporno.com",8],["dongknows.com",8],["traderepublic.community",8],["celtadigital.com",8],["iptvrun.com",8],["adsup.lk",8],["cryptomonitor.in",8],["areatopik.com",8],["cardscanner.co",8],["nullforums.net",8],["courseclub.me",8],["tamarindoyam.com",8],["jeep-cj.com",8],["choiceofmods.com",8],["myqqjd.com",8],["ssdtop.com",8],["apkhex.com",8],["gezegenforum.com",8],["mbc2.live",8],["iptvapps.net",8],["null-scripts.net",8],["nullscripts.net",8],["bloground.ro",8],["witcherhour.com",8],["ottverse.com",8],["torrentmac.net",8],["mazakony.com",8],["laptechinfo.com",8],["mc-at.org",8],["playstationhaber.com",8],["mangapt.com",8],["seriesperu.com",8],["pesprofessionals.com",8],["wpsimplehacks.com",8],["sportshub.to",[8,278]],["topsporter.net",[8,278]],["darkwanderer.net",8],["truckingboards.com",8],["coldfrm.org",8],["azrom.net",8],["freepatternsarea.com",8],["alttyab.net",8],["hq-links.com",8],["mobilkulup.com",8],["esopress.com",8],["nesiaku.my.id",8],["jipinsoft.com",8],["surfsees.com",8],["truthnews.de",8],["farsinama.com",8],["worldofiptv.com",8],["vuinsider.com",8],["crazydl.net",8],["gamemodsbase.com",8],["babiato.tech",8],["secuhex.com",8],["turkishaudiocenter.com",8],["galaxyos.net",8],["blackhatworld.com",8],["bizdustry.com",8],["storefront.com.ng",8],["pkbiosfix.com",8],["casi3.xyz",8],["mediafire.com",9],["wcoanimedub.tv",10],["wcoforever.net",10],["openspeedtest.com",10],["addtobucketlist.com",10],["3dzip.org",[10,75]],["ilmeteo.it",10],["wcoforever.com",10],["comprovendolibri.it",10],["healthelia.com",10],["keephealth.info",11],["afreesms.com",12],["kinoger.re",12],["laksa19.github.io",12],["javcl.com",12],["tvlogy.to",12],["live.dragaoconnect.net",12],["beststremo.com",12],["seznam.cz",12],["seznamzpravy.cz",12],["xerifetech.com",12],["freemcserver.net",12],["wallpapershome.com",14],["anghami.com",15],["wired.com",16],["tutele.sx",17],["footyhunter3.xyz",17],["katestube.com",18],["short.pe",18],["footystreams.net",18],["seattletimes.com",19],["bestgames.com",20],["yiv.com",20],["globalrph.com",21],["e-glossa.it",22],["webcheats.com.br",23],["gala.fr",25],["gentside.com",25],["geo.fr",25],["hbrfrance.fr",25],["nationalgeographic.fr",25],["ohmymag.com",25],["serengo.net",25],["vsd.fr",25],["updato.com",[26,43]],["methbox.com",27],["daizurin.com",27],["pendekarsubs.us",27],["dreamfancy.org",27],["rysafe.blogspot.com",27],["techacode.com",27],["toppng.com",27],["th-world.com",27],["avjamack.com",27],["avjamak.net",27],["dlhd.sx",28],["embedstream.me",28],["yts-subs.net",28],["cnnamador.com",29],["nudecelebforum.com",30],["pronpic.org",31],["thewebflash.com",32],["discordfastfood.com",32],["xup.in",32],["popularmechanics.com",33],["op.gg",34],["lequipe.fr",35],["comunidadgzone.es",36],["mp3fy.com",36],["lebensmittelpraxis.de",36],["ebookdz.com",36],["forum-pokemon-go.fr",36],["praxis-jugendarbeit.de",36],["gdrivez.xyz",36],["dictionnaire-medical.net",36],["cle0desktop.blogspot.com",36],["up-load.io",36],["direct-link.net",36],["direkt-wissen.com",36],["keysbrasil.blogspot.com",36],["hotpress.info",36],["turkleech.com",36],["anibatch.me",36],["anime-i.com",36],["plex-guide.de",36],["healthtune.site",36],["gewinde-normen.de",36],["tucinehd.com",36],["jellynote.com",37],["eporner.com",39],["pornbimbo.com",40],["allmonitors24.com",40],["4j.com",40],["avoiderrors.com",41],["cgtips.org",[41,224]],["sitarchive.com",41],["livenewsof.com",41],["topnewsshow.com",41],["gatcha.org",41],["empregoestagios.com",41],["everydayonsales.com",41],["kusonime.com",41],["aagmaal.xyz",41],["suicidepics.com",41],["codesnail.com",41],["codingshiksha.com",41],["graphicux.com",41],["asyadrama.com",41],["bitcoinegypt.news",41],["citychilli.com",41],["talkjarvis.com",41],["hdmotori.it",42],["femdomtb.com",44],["camhub.cc",44],["bobs-tube.com",44],["ru-xvideos.me",44],["pornfd.com",44],["popno-tour.net",44],["molll.mobi",44],["watchmdh.to",44],["camwhores.tv",44],["elfqrin.com",45],["satcesc.com",46],["apfelpatient.de",46],["lusthero.com",47],["m2list.com",48],["embed.nana2play.com",48],["elahmad.com",48],["dofusports.xyz",48],["dallasnews.com",49],["lnk.news",50],["lnk.parts",50],["efukt.com",51],["wendycode.com",51],["springfieldspringfield.co.uk",52],["porndoe.com",53],["smsget.net",[54,55]],["kjanime.net",56],["gioialive.it",57],["classicreload.com",58],["scriptzhub.com",58],["hotpornfile.org",59],["coolsoft.altervista.org",59],["hackedonlinegames.com",59],["jkoding.xyz",59],["settlersonlinemaps.com",59],["magdownload.org",59],["kpkuang.org",59],["shareus.site",59],["crypto4yu.com",59],["faucetwork.space",59],["thenightwithoutthedawn.blogspot.com",59],["entutes.com",59],["claimlite.club",59],["bazadecrypto.com",[59,327]],["chicoer.com",60],["bostonherald.com",60],["dailycamera.com",60],["maxcheaters.com",61],["rbxoffers.com",61],["mhn.quest",61],["leagueofgraphs.com",61],["hieunguyenphoto.com",61],["benzinpreis.de",61],["postimees.ee",61],["police.community",61],["gisarea.com",61],["schaken-mods.com",61],["theclashify.com",61],["txori.com",61],["olarila.com",61],["deletedspeedstreams.blogspot.com",61],["schooltravelorganiser.com",61],["xhardhempus.net",61],["sportsplays.com",62],["pornvideotop.com",64],["xstory-fr.com",64],["krotkoosporcie.pl",64],["deinesexfilme.com",65],["einfachtitten.com",65],["halloporno.com",65],["herzporno.com",65],["lesbenhd.com",65],["milffabrik.com",[65,253]],["porn-monkey.com",65],["porndrake.com",65],["pornhubdeutsch.net",65],["pornoaffe.com",65],["pornodavid.com",65],["pornoente.tv",[65,253]],["pornofisch.com",65],["pornofelix.com",65],["pornohammer.com",65],["pornohelm.com",65],["pornoklinge.com",65],["pornotom.com",[65,253]],["pornotommy.com",65],["pornovideos-hd.com",65],["pornozebra.com",[65,253]],["xhamsterdeutsch.xyz",65],["xnxx-sexfilme.com",65],["zerion.cc",65],["letribunaldunet.fr",66],["vladan.fr",66],["live-tv-channels.org",67],["eslfast.com",68],["freegamescasual.com",69],["tcpvpn.com",70],["oko.sh",70],["timesnownews.com",70],["timesnowhindi.com",70],["timesnowmarathi.com",70],["zoomtventertainment.com",70],["tsubasa.im",71],["xxxuno.com",72],["sholah.net",73],["2rdroid.com",73],["bisceglielive.it",74],["pandajogosgratis.com.br",76],["5278.cc",77],["altblogger.net",78],["hl-live.de",78],["wohnmobilforum.de",78],["nulledbear.com",78],["sinnerclownceviri.net",78],["satoshi-win.xyz",78],["encurtandourl.com",[78,139]],["freedeepweb.blogspot.com",78],["freesoft.id",78],["zcteam.id",78],["www-daftarharga.blogspot.com",78],["ear-phone-review.com",78],["telefullenvivo.com",78],["listatv.pl",78],["ltc-faucet.xyz",78],["coin-profits.xyz",78],["relampagomovies.com",78],["tonspion.de",80],["duplichecker.com",81],["plagiarismchecker.co",81],["plagiarismdetector.net",81],["searchenginereports.net",81],["giallozafferano.it",82],["autojournal.fr",82],["autoplus.fr",82],["sportauto.fr",82],["linkspaid.com",83],["proxydocker.com",83],["beeimg.com",[84,85]],["emturbovid.com",85],["findjav.com",85],["mmtv01.xyz",85],["stbturbo.xyz",85],["streamsilk.com",85],["ftlauderdalebeachcam.com",86],["ftlauderdalewebcam.com",86],["juneauharborwebcam.com",86],["keywestharborwebcam.com",86],["kittycatcam.com",86],["mahobeachcam.com",86],["miamiairportcam.com",86],["morganhillwebcam.com",86],["njwildlifecam.com",86],["nyharborwebcam.com",86],["paradiseislandcam.com",86],["pompanobeachcam.com",86],["portbermudawebcam.com",86],["portcanaveralwebcam.com",86],["portevergladeswebcam.com",86],["portmiamiwebcam.com",86],["portnywebcam.com",86],["portnassauwebcam.com",86],["portstmaartenwebcam.com",86],["portstthomaswebcam.com",86],["porttampawebcam.com",86],["sxmislandcam.com",86],["themes-dl.com",86],["badassdownloader.com",86],["badasshardcore.com",86],["badassoftcore.com",86],["nulljungle.com",86],["teevee.asia",86],["otakukan.com",86],["gearingcommander.com",88],["generate.plus",89],["calculate.plus",89],["avcesar.com",90],["audiotag.info",91],["tudigitale.it",92],["ibcomputing.com",93],["legia.net",94],["acapellas4u.co.uk",95],["robloxscripts.com",96],["libreriamo.it",96],["postazap.com",96],["medebooks.xyz",96],["tutorials-technology.info",96],["mashtips.com",96],["marriedgames.com.br",96],["4allprograms.me",96],["nurgsm.com",96],["certbyte.com",96],["plugincrack.com",96],["gamingdeputy.com",96],["freewebcart.com",96],["streamhentaimovies.com",97],["konten.co.id",98],["diariodenavarra.es",99],["tubereader.me",99],["scripai.com",99],["myfxbook.com",99],["whatfontis.com",99],["xiaomifans.pl",100],["eletronicabr.com",100],["optifine.net",101],["luzernerzeitung.ch",102],["tagblatt.ch",102],["spellcheck.net",103],["spellchecker.net",103],["spellweb.com",103],["ableitungsrechner.net",104],["alternet.org",105],["gourmetsupremacy.com",105],["shrib.com",106],["pandafiles.com",107],["vidia.tv",[107,128]],["hortonanderfarom.blogspot.com",107],["clarifystraight.com",107],["tutelehd3.xyz",108],["mega4upload.com",108],["coolcast2.com",108],["techclips.net",108],["earthquakecensus.com",108],["footyhunter.lol",108],["gamerarcades.com",108],["poscitech.click",108],["starlive.stream",108],["utopianwilderness.com",108],["wecast.to",108],["sportbar.live",108],["lordchannel.com",108],["play-old-pc-games.com",109],["tunovelaligera.com",110],["tapchipi.com",110],["cuitandokter.com",110],["tech-blogs.com",110],["cardiagn.com",110],["dcleakers.com",110],["esgeeks.com",110],["pugliain.net",110],["uplod.net",110],["worldfreeware.com",110],["fikiri.net",110],["myhackingworld.com",110],["phoenixfansub.com",110],["freecourseweb.com",111],["devcourseweb.com",111],["coursewikia.com",111],["courseboat.com",111],["coursehulu.com",111],["lne.es",115],["pornult.com",116],["webcamsdolls.com",116],["bitcotasks.com",[116,161]],["adsy.pw",116],["playstore.pw",116],["exactpay.online",116],["thothd.to",116],["proplanta.de",117],["hydrogenassociation.org",118],["ludigames.com",118],["sportitalialive.com",118],["made-by.org",118],["xenvn.com",118],["worldtravelling.com",118],["igirls.in",118],["technichero.com",118],["roshiyatech.my.id",118],["24sport.stream",118],["aeroxplorer.com",118],["mad4wheels.com",119],["logi.im",119],["emailnator.com",119],["textograto.com",120],["voyageforum.com",121],["hmc-id.blogspot.com",121],["jemerik.com",121],["myabandonware.com",121],["chatta.it",123],["ketubanjiwa.com",124],["nsfw247.to",125],["funzen.net",125],["fighter.stream",125],["ilclubdellericette.it",125],["hubstream.in",125],["extremereportbot.com",126],["getintopc.com",127],["qoshe.com",129],["lowellsun.com",130],["mamadu.pl",130],["dobrapogoda24.pl",130],["motohigh.pl",130],["namasce.pl",130],["ultimate-catch.eu",131],["cpopchanelofficial.com",132],["creditcardgenerator.com",133],["creditcardrush.com",133],["bostoncommons.net",133],["thejobsmovie.com",133],["livsavr.co",133],["nilopolisonline.com.br",134],["mesquitaonline.com",134],["yellowbridge.com",134],["socialgirls.im",135],["yaoiotaku.com",136],["camhub.world",137],["moneyhouse.ch",138],["ihow.info",139],["hartico.tv",139],["filesus.com",139],["sturls.com",139],["re.two.re",139],["turbo1.co",139],["cartoonsarea.xyz",139],["valeronevijao.com",140],["cigarlessarefy.com",140],["figeterpiazine.com",140],["yodelswartlike.com",140],["generatesnitrosate.com",140],["crownmakermacaronicism.com",140],["chromotypic.com",140],["gamoneinterrupted.com",140],["metagnathtuggers.com",140],["wolfdyslectic.com",140],["rationalityaloelike.com",140],["sizyreelingly.com",140],["simpulumlamerop.com",140],["urochsunloath.com",140],["monorhinouscassaba.com",140],["counterclockwisejacky.com",140],["35volitantplimsoles5.com",140],["scatch176duplicities.com",140],["antecoxalbobbing1010.com",140],["boonlessbestselling244.com",140],["cyamidpulverulence530.com",140],["guidon40hyporadius9.com",140],["449unceremoniousnasoseptal.com",140],["19turanosephantasia.com",140],["30sensualizeexpression.com",140],["321naturelikefurfuroid.com",140],["745mingiestblissfully.com",140],["availedsmallest.com",140],["greaseball6eventual20.com",140],["toxitabellaeatrebates306.com",140],["20demidistance9elongations.com",140],["audaciousdefaulthouse.com",140],["fittingcentermondaysunday.com",140],["fraudclatterflyingcar.com",140],["launchreliantcleaverriver.com",140],["matriculant401merited.com",140],["realfinanceblogcenter.com",140],["reputationsheriffkennethsand.com",140],["telyn610zoanthropy.com",140],["tubelessceliolymph.com",140],["tummulerviolableness.com",140],["un-block-voe.net",140],["v-o-e-unblock.com",140],["voe-un-block.com",140],["voeun-block.net",140],["voeunbl0ck.com",140],["voeunblck.com",140],["voeunblk.com",140],["voeunblock.com",140],["voeunblock1.com",140],["voeunblock2.com",140],["voeunblock3.com",140],["agefi.fr",141],["cariskuy.com",142],["letras2.com",142],["yusepjaelani.blogspot.com",143],["letras.mus.br",144],["mtlurb.com",145],["port.hu",146],["acdriftingpro.com",146],["flight-report.com",146],["forumdz.com",146],["abandonmail.com",146],["flmods.com",146],["zilinak.sk",146],["projectfreetv.stream",146],["hotdesimms.com",146],["pdfaid.com",146],["mconverter.eu",146],["dzeko11.net",[146,278]],["bootdey.com",146],["mail.com",146],["expresskaszubski.pl",146],["moegirl.org.cn",146],["onemanhua.com",147],["t3n.de",148],["allindiaroundup.com",149],["vectorizer.io",150],["smgplaza.com",150],["onehack.us",150],["thapcam.net",150],["thefastlaneforum.com",151],["trade2win.com",152],["modagamers.com",153],["freemagazines.top",153],["straatosphere.com",153],["rule34porn.net",153],["nullpk.com",153],["adslink.pw",153],["downloadudemy.com",153],["picgiraffe.com",153],["weadown.com",153],["freepornsex.net",153],["nurparatodos.com.ar",153],["librospreuniversitariospdf.blogspot.com",154],["msdos-games.com",154],["blocklayer.com",154],["forexeen.us",154],["khsm.io",154],["webcreator-journal.com",154],["nu6i-bg-net.com",154],["routech.ro",155],["hokej.net",155],["turkmmo.com",156],["palermotoday.it",157],["baritoday.it",157],["trentotoday.it",157],["agrigentonotizie.it",157],["anconatoday.it",157],["arezzonotizie.it",157],["avellinotoday.it",157],["bresciatoday.it",157],["brindisireport.it",157],["casertanews.it",157],["cataniatoday.it",157],["cesenatoday.it",157],["chietitoday.it",157],["forlitoday.it",157],["frosinonetoday.it",157],["genovatoday.it",157],["ilpescara.it",157],["ilpiacenza.it",157],["latinatoday.it",157],["lecceprima.it",157],["leccotoday.it",157],["livornotoday.it",157],["messinatoday.it",157],["milanotoday.it",157],["modenatoday.it",157],["monzatoday.it",157],["novaratoday.it",157],["padovaoggi.it",157],["parmatoday.it",157],["perugiatoday.it",157],["pisatoday.it",157],["quicomo.it",157],["ravennatoday.it",157],["reggiotoday.it",157],["riminitoday.it",157],["romatoday.it",157],["salernotoday.it",157],["sondriotoday.it",157],["sportpiacenza.it",157],["ternitoday.it",157],["today.it",157],["torinotoday.it",157],["trevisotoday.it",157],["triesteprima.it",157],["udinetoday.it",157],["veneziatoday.it",157],["vicenzatoday.it",157],["thumpertalk.com",158],["arkcod.org",158],["facciabuco.com",159],["softx64.com",160],["thelayoff.com",161],["manwan.xyz",161],["blog.coinsrise.net",161],["blog.cryptowidgets.net",161],["blog.insurancegold.in",161],["blog.wiki-topia.com",161],["blog.coinsvalue.net",161],["blog.cookinguide.net",161],["blog.freeoseocheck.com",161],["blog.makeupguide.net",161],["blog.carstopia.net",161],["blog.carsmania.net",161],["shorterall.com",161],["blog24.me",161],["maxstream.video",161],["maxlinks.online",161],["tvepg.eu",161],["pstream.net",162],["dailymaverick.co.za",163],["apps2app.com",164],["cheatermad.com",165],["ville-ideale.fr",166],["eodev.com",167],["tickzoo.tv",168],["fm-arena.com",169],["tradersunion.com",170],["tandess.com",171],["faqwiki.us",172],["sonixgvn.net",172],["spontacts.com",173],["dankmemer.lol",174],["apkmoddone.com",175],["getexploits.com",176],["fplstatistics.com",177],["breitbart.com",178],["salidzini.lv",179],["choosingnothing.com",180],["cryptorank.io",[181,182]],["th.gl",183],["4kwebplay.xyz",184],["qqwebplay.xyz",184],["viwlivehdplay.ru",184],["molbiotools.com",185],["vods.tv",186],["18xxx.xyz",187],["raidrush.net",188],["xnxxcom.xyz",189],["videzz.net",190],["spambox.xyz",191],["starkroboticsfrc.com",192],["sinonimos.de",192],["antonimos.de",192],["quesignifi.ca",192],["tiktokrealtime.com",192],["tiktokcounter.net",192],["tpayr.xyz",192],["poqzn.xyz",192],["ashrfd.xyz",192],["rezsx.xyz",192],["tryzt.xyz",192],["ashrff.xyz",192],["rezst.xyz",192],["dawenet.com",192],["erzar.xyz",192],["waezm.xyz",192],["waezg.xyz",192],["blackwoodacademy.org",192],["cryptednews.space",192],["vivuq.com",192],["swgop.com",192],["vbnmll.com",192],["telcoinfo.online",192],["dshytb.com",192],["enit.in",193],["financerites.com",193],["fadedfeet.com",194],["homeculina.com",194],["ineedskin.com",194],["kenzo-flowertag.com",194],["lawyex.co",194],["mdn.lol",194],["bitzite.com",195],["coingraph.us",196],["impact24.us",196],["apkmodvn.com",197],["mod1s.com",197],["dl.apkmoddone.com",198],["phongroblox.com",198],["my-code4you.blogspot.com",199],["vrcmods.com",200],["osuskinner.com",200],["osuskins.net",200],["pentruea.com",[201,202]],["mchacks.net",203],["why-tech.it",204],["compsmag.com",205],["tapetus.pl",206],["gaystream.online",207],["bembed.net",207],["elbailedeltroleo.site",207],["embedv.net",207],["fslinks.org",207],["listeamed.net",207],["v6embed.xyz",207],["vgplayer.xyz",207],["vid-guard.com",207],["vidguard.online",207],["autoroad.cz",208],["brawlhalla.fr",208],["tecnobillo.com",208],["sexcamfreeporn.com",209],["breatheheavy.com",210],["wenxuecity.com",211],["key-hub.eu",212],["fabioambrosi.it",213],["tattle.life",214],["emuenzen.de",214],["terrylove.com",214],["mynet.com",215],["cidade.iol.pt",216],["fantacalcio.it",217],["hentaifreak.org",218],["hypebeast.com",219],["krankheiten-simulieren.de",220],["catholic.com",221],["ad-doge.com",222],["3dmodelshare.org",223],["gourmetscans.net",224],["techinferno.com",225],["ibeconomist.com",226],["bookriot.com",227],["purposegames.com",228],["schoolcheats.net",228],["globo.com",229],["latimes.com",229],["claimrbx.gg",230],["perelki.net",231],["vpn-anbieter-vergleich-test.de",232],["livingincebuforums.com",233],["paperzonevn.com",234],["alltechnerd.com",235],["malaysianwireless.com",236],["erinsakura.com",237],["infofuge.com",237],["freejav.guru",237],["novelmultiverse.com",237],["fritidsmarkedet.dk",238],["maskinbladet.dk",238],["15min.lt",239],["baddiehub.com",240],["mr9soft.com",241],["21porno.com",242],["adult-sex-gamess.com",243],["hentaigames.app",243],["mobilesexgamesx.com",243],["mysexgamer.com",243],["porngameshd.com",243],["sexgamescc.com",243],["xnxx-sex-videos.com",243],["f2movies.to",244],["freeporncave.com",245],["tubsxxx.com",246],["pornojenny.com",247],["subtitle.one",248],["manga18fx.com",249],["freebnbcoin.com",249],["sextvx.com",250],["studydhaba.com",251],["freecourse.tech",251],["victor-mochere.com",251],["papunika.com",251],["mobilanyheter.net",251],["prajwaldesai.com",[251,270]],["ftuapps.dev",251],["muztext.com",252],["pornohans.com",253],["nursexfilme.com",253],["pornohirsch.net",253],["xhamster-sexvideos.com",253],["pornoschlange.com",253],["hdpornos.net",253],["gutesexfilme.com",253],["short1.site",253],["zona-leros.com",253],["charbelnemnom.com",254],["simplebits.io",255],["online-fix.me",256],["gamersdiscussionhub.com",257],["owlzo.com",258],["q1003.com",259],["blogpascher.com",260],["testserver.pro",261],["lifestyle.bg",261],["money.bg",261],["news.bg",261],["topsport.bg",261],["webcafe.bg",261],["mgnet.xyz",262],["advertiserandtimes.co.uk",263],["xvideos2020.me",264],["111.90.159.132",265],["techsolveprac.com",266],["joomlabeginner.com",267],["largescaleforums.com",268],["dubznetwork.com",269],["hentaidexy.com",271],["babia.to",272],["code2care.org",273],["xxxxsx.com",275],["ngontinh24.com",276],["idevicecentral.com",277],["zona11.com",278],["scsport.live",278],["thesaurus.net",279],["onlinegdb.com",280],["pravda.com.ua",280],["worldhistory.org",280],["raenonx.cc",280],["mangacrab.com",282],["idnes.cz",283],["viefaucet.com",284],["cloud-computing-central.com",285],["afk.guide",286],["businessnamegenerator.com",287],["derstandard.at",288],["derstandard.de",288],["rocketnews24.com",289],["soranews24.com",289],["youpouch.com",289],["ilsole24ore.com",290],["ipacrack.com",291],["hentaiporn.one",292],["infokik.com",293],["daemonanime.net",294],["daemon-hentai.com",294],["deezer.com",295],["fosslinux.com",296],["shrdsk.me",297],["examword.com",298],["sempreupdate.com.br",298],["tribuna.com",299],["trendsderzukunft.de",300],["gal-dem.com",300],["lostineu.eu",300],["oggitreviso.it",300],["speisekarte.de",300],["mixed.de",300],["lightnovelspot.com",[301,302]],["lightnovelworld.com",[301,302]],["novelpub.com",[301,302]],["webnovelpub.com",[301,302]],["mail.yahoo.com",303],["hwzone.co.il",304],["nammakalvi.com",305],["javmoon.me",306],["c2g.at",307],["terafly.me",307],["elamigos-games.com",307],["elamigos-games.net",307],["dktechnicalmate.com",308],["recipahi.com",308],["converter-btc.world",308],["kaystls.site",309],["aquarius-horoscopes.com",310],["cancer-horoscopes.com",310],["dubipc.blogspot.com",310],["echoes.gr",310],["engel-horoskop.de",310],["freegames44.com",310],["fuerzasarmadas.eu",310],["gemini-horoscopes.com",310],["jurukunci.net",310],["krebs-horoskop.com",310],["leo-horoscopes.com",310],["maliekrani.com",310],["nklinks.click",310],["ourenseando.es",310],["pisces-horoscopes.com",310],["radio-en-direct.fr",310],["sagittarius-horoscopes.com",310],["scorpio-horoscopes.com",310],["singlehoroskop-loewe.de",310],["skat-karten.de",310],["skorpion-horoskop.com",310],["taurus-horoscopes.com",310],["the1security.com",310],["torrentmovies.online",310],["virgo-horoscopes.com",310],["zonamarela.blogspot.com",310],["yoima.hatenadiary.com",310],["vpntester.org",311],["watchhentai.net",312],["japscan.lol",313],["digitask.ru",314],["tempumail.com",315],["sexvideos.host",316],["10alert.com",318],["cryptstream.de",319],["nydus.org",319],["techhelpbd.com",320],["fapdrop.com",321],["cellmapper.net",322],["hdrez.com",323],["youwatch-serie.com",323],["newscon.org",324],["printablecreative.com",325],["comohoy.com",326],["leak.sx",326],["paste.bin.sx",326],["pornleaks.in",326],["merlininkazani.com",326],["j91.asia",328],["jeniusplay.com",329],["indianyug.com",330],["rgb.vn",330],["needrom.com",331],["criptologico.com",332],["megadrive-emulator.com",333],["eromanga-show.com",334],["hentai-one.com",334],["hentaipaw.com",334],["10minuteemails.com",335],["luxusmail.org",335],["w3cub.com",336],["bangpremier.com",337],["nyaa.iss.ink",338],["tnp98.xyz",340],["freepdfcomic.com",341],["memedroid.com",342],["animesync.org",343],["karaoketexty.cz",344],["filmizlehdfilm.com",345],["fullfilmizle.cc",345],["resortcams.com",346],["mjakmama24.pl",348],["security-demo.extrahop.com",349],["lastampa.it",350],["caroloportunidades.com.br",351]]);

const entitiesMap = new Map([["comunio",0],["finanzen",[0,5]],["gameswelt",0],["heftig",0],["notebookcheck",0],["testedich",0],["transfermarkt",0],["truckscout24",0],["tvtv",0],["wetteronline",0],["wieistmeineip",0],["wetter",2],["1337x",4],["eztv",4],["sushi-scan",8],["spigotunlocked",8],["ahmedmode",8],["kissasian",11],["rp5",12],["mma-core",13],["yts",17],["720pstream",17],["1stream",17],["thefmovies",18],["urlcero",24],["totaldebrid",27],["sandrives",27],["fxporn69",36],["aliancapes",36],["pouvideo",38],["povvideo",38],["povw1deo",38],["povwideo",38],["powv1deo",38],["powvibeo",38],["powvideo",38],["powvldeo",38],["tubsexer",44],["porno-tour",44],["lenkino",44],["pornomoll",44],["camsclips",44],["m4ufree",48],["writedroid",59],["telerium",63],["pandafreegames",79],["thoptv",87],["shortzzy",96],["streameast",108],["thestreameast",108],["daddylivehd",108],["solvetube",112],["hdfilme",113],["pornhub",114],["wcofun",121],["bollyholic",125],["gotxx",139],["turkanime",140],["voe-unblock",140],["khatrimaza",153],["pogolinks",153],["popcornstream",155],["brainly",167],["oploverz",168],["vembed",207],["xhamsterdeutsch",253],["privatemoviez",257],["gmx",274],["lightnovelpub",[301,302]],["camcaps",317],["drivebot",339],["thenextplanet1",340],["filmizletv",345],["autoscout24",347]]);

const exceptionsMap = new Map([["panel.freemcserver.net",[12]]]);

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
    proxyApplyFn('setTimeout', function setTimeout(target, thisArg, args) {
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
    });
}

function proxyApplyFn(
    target = '',
    handler = ''
) {
    let context = globalThis;
    let prop = target;
    for (;;) {
        const pos = prop.indexOf('.');
        if ( pos === -1 ) { break; }
        context = context[prop.slice(0, pos)];
        if ( context instanceof Object === false ) { return; }
        prop = prop.slice(pos+1);
    }
    const fn = context[prop];
    if ( typeof fn !== 'function' ) { return; }
    const fnStr = fn.toString();
    const toString = (function toString() { return fnStr; }).bind(null);
    if ( fn.prototype && fn.prototype.constructor === fn ) {
        context[prop] = new Proxy(fn, {
            construct: handler,
            get(target, prop, receiver) {
                if ( prop === 'toString' ) { return toString; }
                return Reflect.get(target, prop, receiver);
            },
        });
        return (...args) => Reflect.construct(...args);
    }
    context[prop] = new Proxy(fn, {
        apply: handler,
        get(target, prop, receiver) {
            if ( prop === 'toString' ) { return toString; }
            return Reflect.get(target, prop, receiver);
        },
    });
    return (...args) => Reflect.apply(...args);
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
        offIdle(id) {
            if ( self.requestIdleCallback ) {
                return self.cancelIdleCallback(id);
            }
            return self.cancelAnimationFrame(id);
        }
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
try {
    let origin = document.location.origin;
    if ( origin === 'null' ) {
        const origins = document.location.ancestorOrigins;
        for ( let i = 0; i < origins.length; i++ ) {
            origin = origins[i];
            if ( origin !== 'null' ) { break; }
        }
    }
    const pos = origin.lastIndexOf('://');
    if ( pos === -1 ) { return; }
    hnParts.push(...origin.slice(pos+3).split('.'));
}
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
