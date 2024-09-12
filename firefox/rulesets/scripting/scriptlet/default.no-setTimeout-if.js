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

const argsList = [[".call(null)","10"],[".call(null)"],["(null)","10"],["userHasAdblocker"],["adb"],["nrWrapper"],["warn"],["adBlockerDetected"],["show"],["InfMediafireMobileFunc","1000"],["google_jobrunner"],["()","45000"],["0x"],["displayAdBlockedVideo"],[".adsbygoogle"],["isDesktopApp","1000"],["Bait"],["admc"],["'0x"],["apstagLOADED"],["/Adb|moneyDetect/"],["disableDeveloper"],["Blocco","2000"],["test","0"],["checkAdblockUser","1000"],["checkPub","6000"],["document.querySelector","5000"],["nextFunction","250"],["()","150"],["backRedirect"],["document.querySelectorAll","1000"],["style"],["clientHeight"],["addEventListener","0"],["adblock","2000"],["start","0"],["nextFunction","2000"],["byepopup","5000"],["test.remove","100"],["additional_src","300"],["()","2000"],["css_class.show"],["CANG","3000"],["updato-overlay","500"],["innerText","2000"],["alert","8000"],["css_class"],["()","50"],["debugger"],["initializeCourier","3000"],["redirectPage"],["_0x","2000"],["ads","750"],["location.href","500"],["Adblock","5000"],["disable","200"],["CekAab","0"],["rbm_block_active","1000"],["show()"],["_0x"],["n.trigger","1"],["adblock"],["abDetected"],["KeepOpeningPops","1000"],["location.href"],["appendChild"],["adb","0"],["adBlocked"],["warning","100"],["adblock_popup","500"],["Adblock"],["location.href","10000"],["keep-ads","2000"],["#rbm_block_active","1000"],["null","4000"],["()","2500"],["myaabpfun","3000"],["adFilled","2500"],["()","15000"],["showPopup"],["()","1"],["()","1000"],["document.cookie","2500"],["window.open"],["innerHTML"],["readyplayer","2000"],["/innerHTML|AdBlock/"],["checkStopBlock"],["adspot_top","1500"],["/offsetHeight|google|Global/"],["an_message","500"],["Adblocker","10000"],["timeoutChecker"],["bait","1"],["ai_adb"],["pum-open"],["overlay","2000"],["/adblock/i"],["test","100"],["Math.round","1000"],["adblock","5"],["bioEp"],["ag_adBlockerDetected"],["null"],["adb","6000"],["pop"],["sadbl"],["checkAdStatus"],["mdp"],["brave_load_popup"],["0x","3000"],["invoke"],["adsbytrafficjunkycontext"],["ipod"],["offsetWidth"],["/$|adBlock/"],["ads"],["adsbygoogle"],["()"],["AdBlock"],["stop-scrolling"],["Adv"],["blockUI","2000"],["mdpDeBlocker"],["/_0x|debug/"],["/ai_adb|_0x/"],["iframe"],["adBlock"],["","1"],["undefined"],["check","1"],["adsBlocked"],["nextFunction"],["blocker"],["aswift_"],["afs_ads","2000"],["visibility","2000"],["bait"],["getComputedStyle","250"],["blocked"],["{r()","0"],["nextFunction","450"],["Debug"],["r()","0"],["purple_box"],["offsetHeight"],["checkSiteNormalLoad"],["adBlockOverlay"],["Detected","500"],["modal"],[".show","1000"],[".show"],["showModal"],["getComputedStyle"],["blur"],["samOverlay"],["bADBlock"],["location"],["","4000"],["blocker","100"],["alert"],["t()","0"],["$"],["offset"],["contrformpub"],["trigger","0"],["popup"],["getComputedStyle","2000"],["video-popup"],["detectAdblock"],["EzoIvent"],["detectAdBlocker"],["nads"],["current.children"],["adStatus"],["BN_CAMPAIGNS"],["media_place_list"],["cvad"],["...","300"],["/\\{[a-z]\\(!0\\)\\}/"],["error"],["stackTrace"],["inner-ad"],["_ET"],[".clientHeight"],["getComputedStyle(el)"],["location.replace"],["console.clear"],["ad_block_detector"],["sandbox"],["afterOpen"],["documentElement.innerHTML"],["","5"],["/adblock|isRequestPresent/"],["_0x","500"],["isRequestPresent"],["adsPost"],["1e3*"],["_0x","1000"],["offsetLeft"],["height"],["mdp_deblocker"],["charAt"],["checkAds"],["fadeIn","0"],["jQuery"],["/^/"],["check"],["Adblocker"],["eabdModal"],["ab_root.show"],["gaData"],["ad"],["prompt","1000"],["googlefc"],["adblock detection"],[".offsetHeight","100"],["popState"],["ad-block-popup"],["exitTimer"],["innerHTML.replace"],["ab","2000"],["data?","4000"],[".data?"],["eabpDialog"],["adsense"],["/Adblock|_ad_/"],["googletag"],["f.parentNode.removeChild(f)","100"],["swal","500"],["keepChecking","1000"],["openPopup"],[".offsetHeight"],["()=>{"],["nitroAds"],["class.scroll","1000"],["disableDeveloperTools"],["Check"],["insertBefore"],["css_class.scroll"],["/null|Error/","10000"],["window.location.href","50"],["/out.php"],["/0x|devtools/"],["location.replace","300"],["window.location.href"],["checkVisible"],["_0x","3000"],["fetch"],["window.location.href=link"],["ai_"],["reachGoal"],["Adb"],["ai"],["","3000"],["/width|innerHTML/"],["magnificPopup"],["adblockEnabled"],["google_ad"],["document.location"],["google"],["top-right","2000"],["enforceAdStatus"],["loadScripts"],["mfp"],["display","5000"],["eb"],[").show()"],["","1000"],["site-access"],["atob"],["/show|document\\.createElement/"],["Msg"],["UABP"],["href"],["aaaaa-modal"],["()=>"],["keepChecking"],["error-report.com"],["loader.min.js"],["()=>","5000"],["null","10"],["","500"],["showAdblock"],["-0x"],["display"],["gclid"],["event","3000"],["rejectWith"],["refresh"],["location.href","3000"],["window.location"],["ga"],["adbl"],["Ads"],["ShowAdBLockerNotice"],["ad_listener"],["open"],["(!0)"],["Delay"],["/appendChild|e\\(\"/"],["=>"],["ADB"],["site-access-popup"],["data?"],["/debugger|UserCustomPop/"],["checkAdblockUser"],["offsetHeight","100"],["AdDetect"],["displayMessage","2000"],["/salesPopup|mira-snackbar/"],["advanced"],["detectImgLoad"],["offsetHeight","200"],["detector"],["replace"],["touchstart"],["siteAccessFlag"],["ab"],["/adblocker|alert/"],["redURL"],["/children\\('ins'\\)|Adblock|adsbygoogle/"],["displayMessage"],["/adblock|googletag/"],["chkADB"],["onDetected"],["myinfoey","1500"],["fuckadb"],["detect"],["siteAccessPopup"],["/adsbygoogle|adblock/"],["akadb"],["biteDisplay"],["/[a-z]\\(!0\\)/","800"],["ad_block"],["/detectAdBlocker|window.open/"],["adBlockDetected"],["popUnder"],["/GoToURL|delay/"],["window.location.href","300"],["ad_display"],["/adScriptPath|MMDConfig/"],["0x","100"],["/native|\\{n\\(\\)/"],["psresimler"],["adblocker"],["/Detect|adblock|style\\.display|\\[native code]|\\.call\\(null\\)/"],["removeChild"],["ad blocker"],["googleFC"]];

const hostnamesMap = new Map([["4-liga.com",0],["4fansites.de",0],["4players.de",0],["9monate.de",0],["aachener-nachrichten.de",0],["aachener-zeitung.de",0],["abendblatt.de",0],["abendzeitung-muenchen.de",0],["about-drinks.com",0],["abseits-ka.de",0],["airliners.de",0],["ajaxshowtime.com",0],["allgemeine-zeitung.de",0],["alpin.de",0],["antenne.de",0],["arcor.de",0],["areadvd.de",0],["areamobile.de",0],["ariva.de",0],["astronews.com",0],["aussenwirtschaftslupe.de",0],["auszeit.bio",0],["auto-motor-und-sport.de",0],["auto-service.de",0],["autobild.de",0],["autoextrem.de",0],["autopixx.de",0],["autorevue.at",0],["az-online.de",0],["baby-vornamen.de",0],["babyclub.de",0],["bafoeg-aktuell.de",0],["berliner-kurier.de",0],["berliner-zeitung.de",0],["bigfm.de",0],["bikerszene.de",0],["bildderfrau.de",0],["blackd.de",0],["blick.de",0],["boerse-online.de",0],["boerse.de",0],["boersennews.de",0],["braunschweiger-zeitung.de",0],["brieffreunde.de",0],["brigitte.de",0],["buerstaedter-zeitung.de",0],["buffed.de",0],["businessinsider.de",0],["buzzfeed.at",0],["buzzfeed.de",0],["caravaning.de",0],["cavallo.de",0],["chefkoch.de",0],["cinema.de",0],["clever-tanken.de",0],["computerbild.de",0],["computerhilfen.de",0],["comunio-cl.com",0],["connect.de",0],["chip.de",0],["da-imnetz.de",0],["dasgelbeblatt.de",0],["dbna.com",0],["dbna.de",0],["deichstube.de",0],["deine-tierwelt.de",0],["der-betze-brennt.de",0],["derwesten.de",0],["desired.de",0],["dhd24.com",0],["dieblaue24.com",0],["digitalfernsehen.de",0],["dnn.de",0],["donnerwetter.de",0],["e-hausaufgaben.de",0],["e-mountainbike.com",0],["eatsmarter.de",0],["echo-online.de",0],["ecomento.de",0],["einfachschoen.me",0],["elektrobike-online.com",0],["eltern.de",0],["epochtimes.de",0],["essen-und-trinken.de",0],["express.de",0],["extratipp.com",0],["familie.de",0],["fanfiktion.de",0],["fehmarn24.de",0],["fettspielen.de",0],["fid-gesundheitswissen.de",0],["finanznachrichten.de",0],["finanztreff.de",0],["finya.de",0],["firmenwissen.de",0],["fitforfun.de",0],["fnp.de",0],["football365.fr",0],["formel1.de",0],["fr.de",0],["frankfurter-wochenblatt.de",0],["freenet.de",0],["fremdwort.de",0],["froheweihnachten.info",0],["frustfrei-lernen.de",0],["fuldaerzeitung.de",0],["funandnews.de",0],["fussballdaten.de",0],["futurezone.de",0],["gala.de",0],["gamepro.de",0],["gamersglobal.de",0],["gamesaktuell.de",0],["gamestar.de",0],["gamezone.de",0],["gartendialog.de",0],["gartenlexikon.de",0],["gedichte.ws",0],["geissblog.koeln",0],["gelnhaeuser-tageblatt.de",0],["general-anzeiger-bonn.de",0],["geniale-tricks.com",0],["genialetricks.de",0],["gesund-vital.de",0],["gesundheit.de",0],["gevestor.de",0],["gewinnspiele.tv",0],["giessener-allgemeine.de",0],["giessener-anzeiger.de",0],["gifhorner-rundschau.de",0],["giga.de",0],["gipfelbuch.ch",0],["gmuender-tagespost.de",0],["golem.de",[0,7,8]],["gruenderlexikon.de",0],["gusto.at",0],["gut-erklaert.de",0],["gutfuerdich.co",0],["hallo-muenchen.de",0],["hamburg.de",0],["hanauer.de",0],["hardwareluxx.de",0],["hartziv.org",0],["harzkurier.de",0],["haus-garten-test.de",0],["hausgarten.net",0],["haustec.de",0],["haz.de",0],["heidelberg24.de",0],["heilpraxisnet.de",0],["heise.de",0],["helmstedter-nachrichten.de",0],["hersfelder-zeitung.de",0],["hftg.co",0],["hifi-forum.de",0],["hna.de",0],["hochheimer-zeitung.de",0],["hoerzu.de",0],["hofheimer-zeitung.de",0],["iban-rechner.de",0],["ikz-online.de",0],["immobilienscout24.de",0],["ingame.de",0],["inside-digital.de",0],["inside-handy.de",0],["investor-verlag.de",0],["jappy.com",0],["jpgames.de",0],["kabeleins.de",0],["kachelmannwetter.com",0],["kamelle.de",0],["kicker.de",0],["kindergeld.org",0],["klettern-magazin.de",0],["klettern.de",0],["kochbar.de",0],["kreis-anzeiger.de",0],["kreisbote.de",0],["kreiszeitung.de",0],["ksta.de",0],["kurierverlag.de",0],["lachainemeteo.com",0],["lampertheimer-zeitung.de",0],["landwirt.com",0],["laut.de",0],["lauterbacher-anzeiger.de",0],["leckerschmecker.me",0],["leinetal24.de",0],["lesfoodies.com",0],["levif.be",0],["lifeline.de",0],["liga3-online.de",0],["likemag.com",0],["linux-community.de",0],["linux-magazin.de",0],["live.vodafone.de",0],["ln-online.de",0],["lokalo24.de",0],["lustaufsleben.at",0],["lustich.de",0],["lvz.de",0],["lz.de",0],["mactechnews.de",0],["macwelt.de",0],["macworld.co.uk",0],["mail.de",0],["main-spitze.de",0],["manager-magazin.de",0],["manga-tube.me",0],["mathebibel.de",0],["mathepower.com",0],["maz-online.de",0],["medisite.fr",0],["mehr-tanken.de",0],["mein-kummerkasten.de",0],["mein-mmo.de",0],["mein-wahres-ich.de",0],["meine-anzeigenzeitung.de",0],["meinestadt.de",0],["menshealth.de",0],["mercato365.com",0],["merkur.de",0],["messen.de",0],["metal-hammer.de",0],["metalflirt.de",0],["meteologix.com",0],["minecraft-serverlist.net",0],["mittelbayerische.de",0],["modhoster.de",0],["moin.de",0],["mopo.de",0],["morgenpost.de",0],["motor-talk.de",0],["motorbasar.de",0],["motorradonline.de",0],["motorsport-total.com",0],["motortests.de",0],["mountainbike-magazin.de",0],["moviejones.de",0],["moviepilot.de",0],["mt.de",0],["mtb-news.de",0],["musiker-board.de",0],["musikexpress.de",0],["musikradar.de",0],["mz-web.de",0],["n-tv.de",0],["naumburger-tageblatt.de",0],["netzwelt.de",0],["neuepresse.de",0],["neueroeffnung.info",0],["news.at",0],["news.de",0],["news38.de",0],["newsbreak24.de",0],["nickles.de",0],["nicknight.de",0],["nl.hardware.info",0],["nn.de",0],["nnn.de",0],["nordbayern.de",0],["notebookchat.com",0],["notebookcheck-ru.com",0],["notebookcheck-tr.com",0],["noz-cdn.de",0],["noz.de",0],["nrz.de",0],["nw.de",0],["nwzonline.de",0],["oberhessische-zeitung.de",0],["och.to",0],["oeffentlicher-dienst.info",0],["onlinekosten.de",0],["onvista.de",0],["op-marburg.de",0],["op-online.de",0],["outdoor-magazin.com",0],["outdoorchannel.de",0],["paradisi.de",0],["pc-magazin.de",0],["pcgames.de",0],["pcgameshardware.de",0],["pcwelt.de",0],["pcworld.es",0],["peiner-nachrichten.de",0],["pferde.de",0],["pietsmiet.de",0],["pixelio.de",0],["pkw-forum.de",0],["playboy.de",0],["playfront.de",0],["pnn.de",0],["pons.com",0],["prad.de",[0,120]],["prignitzer.de",0],["profil.at",0],["promipool.de",0],["promobil.de",0],["prosiebenmaxx.de",0],["psychic.de",[0,145]],["quoka.de",0],["radio.at",0],["radio.de",0],["radio.dk",0],["radio.es",0],["radio.fr",0],["radio.it",0],["radio.net",0],["radio.pl",0],["radio.pt",0],["radio.se",0],["ran.de",0],["readmore.de",0],["rechtslupe.de",0],["recording.de",0],["rennrad-news.de",0],["reuters.com",0],["reviersport.de",0],["rhein-main-presse.de",0],["rheinische-anzeigenblaetter.de",0],["rimondo.com",0],["roadbike.de",0],["roemische-zahlen.net",0],["rollingstone.de",0],["rot-blau.com",0],["rp-online.de",0],["rtl.de",[0,281]],["rtv.de",0],["rugby365.fr",0],["ruhr24.de",0],["rundschau-online.de",0],["runnersworld.de",0],["safelist.eu",0],["salzgitter-zeitung.de",0],["sat1.de",0],["sat1gold.de",0],["schoener-wohnen.de",0],["schwaebische-post.de",0],["schwarzwaelder-bote.de",0],["serienjunkies.de",0],["shz.de",0],["sixx.de",0],["skodacommunity.de",0],["smart-wohnen.net",0],["sn.at",0],["sozialversicherung-kompetent.de",0],["spiegel.de",0],["spielen.de",0],["spieletipps.de",0],["spielfilm.de",0],["sport.de",0],["sport365.fr",0],["sportal.de",0],["spox.com",0],["stern.de",0],["stuttgarter-nachrichten.de",0],["stuttgarter-zeitung.de",0],["sueddeutsche.de",0],["svz.de",0],["szene1.at",0],["szene38.de",0],["t-online.de",0],["tagesspiegel.de",0],["taschenhirn.de",0],["techadvisor.co.uk",0],["techstage.de",0],["tele5.de",0],["the-voice-of-germany.de",0],["thueringen24.de",0],["tichyseinblick.de",0],["tierfreund.co",0],["tiervermittlung.de",0],["torgranate.de",0],["trend.at",0],["tv-media.at",0],["tvdigital.de",0],["tvinfo.de",0],["tvspielfilm.de",0],["tvtoday.de",0],["tz.de",0],["unicum.de",0],["unnuetzes.com",0],["unsere-helden.com",0],["unterhalt.net",0],["usinger-anzeiger.de",0],["usp-forum.de",0],["videogameszone.de",0],["vienna.at",0],["vip.de",0],["virtualnights.com",0],["vox.de",0],["wa.de",0],["wallstreet-online.de",[0,3]],["waz.de",0],["weather.us",0],["webfail.com",0],["weihnachten.me",0],["weihnachts-bilder.org",0],["weihnachts-filme.com",0],["welt.de",0],["weltfussball.at",0],["weristdeinfreund.de",0],["werkzeug-news.de",0],["werra-rundschau.de",0],["wetterauer-zeitung.de",0],["wiesbadener-kurier.de",0],["wiesbadener-tagblatt.de",0],["winboard.org",0],["windows-7-forum.net",0],["winfuture.de",[0,278]],["wintotal.de",0],["wlz-online.de",0],["wn.de",0],["wohngeld.org",0],["wolfenbuetteler-zeitung.de",0],["wolfsburger-nachrichten.de",0],["woman.at",0],["womenshealth.de",0],["wormser-zeitung.de",0],["woxikon.de",0],["wp.de",0],["wr.de",0],["yachtrevue.at",0],["ze.tt",0],["zeit.de",0],["meineorte.com",1],["osthessen-news.de",1],["techadvisor.com",1],["focus.de",1],["m.timesofindia.com",4],["timesofindia.indiatimes.com",4],["youmath.it",4],["redensarten-index.de",4],["lesoir.be",4],["electriciansforums.net",4],["keralatelecom.info",4],["betaseries.com",4],["free-sms-receive.com",4],["sms-receive-online.com",4],["universegunz.net",4],["happypenguin.altervista.org",4],["everyeye.it",4],["bluedrake42.com",4],["streamservicehd.click",4],["supermarioemulator.com",4],["futbollibrehd.com",4],["eska.pl",4],["eskarock.pl",4],["voxfm.pl",4],["mathaeser.de",4],["freethesaurus.com",6],["thefreedictionary.com",6],["hdbox.ws",8],["todopolicia.com",8],["scat.gold",8],["freecoursesite.com",8],["windowcleaningforums.co.uk",8],["cruisingearth.com",8],["hobby-machinist.com",8],["freegogpcgames.com",8],["starleaks.org",8],["latitude.to",8],["kitchennovel.com",8],["w3layouts.com",8],["blog.receivefreesms.co.uk",8],["eductin.com",8],["dealsfinders.blog",8],["audiobooks4soul.com",8],["tinhocdongthap.com",8],["sakarnewz.com",8],["downloadr.in",8],["topcomicporno.com",8],["dongknows.com",8],["traderepublic.community",8],["celtadigital.com",8],["iptvrun.com",8],["adsup.lk",8],["cryptomonitor.in",8],["areatopik.com",8],["cardscanner.co",8],["nullforums.net",8],["courseclub.me",8],["tamarindoyam.com",8],["jeep-cj.com",8],["choiceofmods.com",8],["myqqjd.com",8],["ssdtop.com",8],["apkhex.com",8],["gezegenforum.com",8],["mbc2.live",8],["iptvapps.net",8],["null-scripts.net",8],["nullscripts.net",8],["bloground.ro",8],["witcherhour.com",8],["ottverse.com",8],["torrentmac.net",8],["mazakony.com",8],["laptechinfo.com",8],["mc-at.org",8],["playstationhaber.com",8],["mangapt.com",8],["seriesperu.com",8],["pesprofessionals.com",8],["wpsimplehacks.com",8],["sportshub.to",[8,277]],["topsporter.net",[8,277]],["darkwanderer.net",8],["truckingboards.com",8],["coldfrm.org",8],["azrom.net",8],["freepatternsarea.com",8],["alttyab.net",8],["hq-links.com",8],["mobilkulup.com",8],["esopress.com",8],["nesiaku.my.id",8],["jipinsoft.com",8],["surfsees.com",8],["truthnews.de",8],["farsinama.com",8],["worldofiptv.com",8],["vuinsider.com",8],["crazydl.net",8],["gamemodsbase.com",8],["babiato.tech",8],["secuhex.com",8],["turkishaudiocenter.com",8],["galaxyos.net",8],["blackhatworld.com",8],["bizdustry.com",8],["storefront.com.ng",8],["pkbiosfix.com",8],["casi3.xyz",8],["mediafire.com",9],["wcoanimedub.tv",10],["wcoforever.net",10],["openspeedtest.com",10],["addtobucketlist.com",10],["3dzip.org",[10,74]],["ilmeteo.it",10],["wcoforever.com",10],["comprovendolibri.it",10],["healthelia.com",10],["keephealth.info",11],["afreesms.com",12],["kinoger.re",12],["laksa19.github.io",12],["javcl.com",12],["tvlogy.to",12],["live.dragaoconnect.net",12],["beststremo.com",12],["seznam.cz",12],["seznamzpravy.cz",12],["xerifetech.com",12],["freemcserver.net",12],["wallpapershome.com",14],["anghami.com",15],["wired.com",16],["tutele.sx",17],["footyhunter3.xyz",17],["katestube.com",18],["short.pe",18],["footystreams.net",18],["seattletimes.com",19],["bestgames.com",20],["yiv.com",20],["globalrph.com",21],["e-glossa.it",22],["webcheats.com.br",23],["gala.fr",25],["gentside.com",25],["geo.fr",25],["hbrfrance.fr",25],["nationalgeographic.fr",25],["ohmymag.com",25],["serengo.net",25],["vsd.fr",25],["updato.com",[26,43]],["methbox.com",27],["daizurin.com",27],["pendekarsubs.us",27],["dreamfancy.org",27],["rysafe.blogspot.com",27],["techacode.com",27],["toppng.com",27],["th-world.com",27],["avjamack.com",27],["avjamak.net",27],["dlhd.sx",28],["embedstream.me",28],["yts-subs.net",28],["cnnamador.com",29],["nudecelebforum.com",30],["pronpic.org",31],["thewebflash.com",32],["discordfastfood.com",32],["xup.in",32],["popularmechanics.com",33],["op.gg",34],["lequipe.fr",35],["comunidadgzone.es",36],["mp3fy.com",36],["lebensmittelpraxis.de",36],["ebookdz.com",36],["forum-pokemon-go.fr",36],["praxis-jugendarbeit.de",36],["gdrivez.xyz",36],["dictionnaire-medical.net",36],["cle0desktop.blogspot.com",36],["up-load.io",36],["direct-link.net",36],["direkt-wissen.com",36],["keysbrasil.blogspot.com",36],["hotpress.info",36],["turkleech.com",36],["anibatch.me",36],["anime-i.com",36],["plex-guide.de",36],["healthtune.site",36],["gewinde-normen.de",36],["tucinehd.com",36],["jellynote.com",37],["eporner.com",39],["pornbimbo.com",40],["4j.com",40],["avoiderrors.com",41],["cgtips.org",[41,223]],["sitarchive.com",41],["livenewsof.com",41],["topnewsshow.com",41],["gatcha.org",41],["empregoestagios.com",41],["everydayonsales.com",41],["kusonime.com",41],["aagmaal.xyz",41],["suicidepics.com",41],["codesnail.com",41],["codingshiksha.com",41],["graphicux.com",41],["asyadrama.com",41],["bitcoinegypt.news",41],["citychilli.com",41],["talkjarvis.com",41],["hdmotori.it",42],["femdomtb.com",44],["camhub.cc",44],["bobs-tube.com",44],["ru-xvideos.me",44],["pornfd.com",44],["popno-tour.net",44],["molll.mobi",44],["watchmdh.to",44],["camwhores.tv",44],["elfqrin.com",45],["satcesc.com",46],["apfelpatient.de",46],["lusthero.com",47],["m2list.com",48],["embed.nana2play.com",48],["elahmad.com",48],["dofusports.xyz",48],["dallasnews.com",49],["lnk.news",50],["lnk.parts",50],["efukt.com",51],["wendycode.com",51],["springfieldspringfield.co.uk",52],["porndoe.com",53],["smsget.net",[54,55]],["kjanime.net",56],["gioialive.it",57],["classicreload.com",58],["scriptzhub.com",58],["hotpornfile.org",59],["coolsoft.altervista.org",59],["hackedonlinegames.com",59],["jkoding.xyz",59],["dailytech-news.eu",59],["settlersonlinemaps.com",59],["magdownload.org",59],["kpkuang.org",59],["shareus.site",59],["crypto4yu.com",59],["faucetwork.space",59],["thenightwithoutthedawn.blogspot.com",59],["entutes.com",59],["claimlite.club",59],["bazadecrypto.com",[59,326]],["chicoer.com",60],["bostonherald.com",60],["dailycamera.com",60],["maxcheaters.com",61],["rbxoffers.com",61],["mhn.quest",61],["leagueofgraphs.com",61],["hieunguyenphoto.com",61],["benzinpreis.de",61],["postimees.ee",61],["police.community",61],["gisarea.com",61],["schaken-mods.com",61],["theclashify.com",61],["txori.com",61],["olarila.com",61],["deletedspeedstreams.blogspot.com",61],["schooltravelorganiser.com",61],["xhardhempus.net",61],["sportsplays.com",62],["pornvideotop.com",64],["xstory-fr.com",64],["krotkoosporcie.pl",64],["deinesexfilme.com",65],["einfachtitten.com",65],["halloporno.com",65],["herzporno.com",65],["lesbenhd.com",65],["milffabrik.com",[65,252]],["porn-monkey.com",65],["porndrake.com",65],["pornhubdeutsch.net",65],["pornoaffe.com",65],["pornodavid.com",65],["pornoente.tv",[65,252]],["pornofisch.com",65],["pornofelix.com",65],["pornohammer.com",65],["pornohelm.com",65],["pornoklinge.com",65],["pornotom.com",[65,252]],["pornotommy.com",65],["pornovideos-hd.com",65],["pornozebra.com",[65,252]],["xhamsterdeutsch.xyz",65],["xnxx-sexfilme.com",65],["zerion.cc",65],["letribunaldunet.fr",66],["vladan.fr",66],["live-tv-channels.org",67],["eslfast.com",68],["freegamescasual.com",69],["tcpvpn.com",70],["oko.sh",70],["timesnownews.com",70],["timesnowhindi.com",70],["timesnowmarathi.com",70],["zoomtventertainment.com",70],["tsubasa.im",71],["sholah.net",72],["2rdroid.com",72],["bisceglielive.it",73],["pandajogosgratis.com.br",75],["5278.cc",76],["tonspion.de",78],["duplichecker.com",79],["plagiarismchecker.co",79],["plagiarismdetector.net",79],["searchenginereports.net",79],["giallozafferano.it",80],["autojournal.fr",80],["autoplus.fr",80],["sportauto.fr",80],["linkspaid.com",81],["proxydocker.com",81],["beeimg.com",[82,83]],["emturbovid.com",83],["findjav.com",83],["mmtv01.xyz",83],["stbturbo.xyz",83],["streamsilk.com",83],["ftlauderdalebeachcam.com",84],["ftlauderdalewebcam.com",84],["juneauharborwebcam.com",84],["keywestharborwebcam.com",84],["kittycatcam.com",84],["mahobeachcam.com",84],["miamiairportcam.com",84],["morganhillwebcam.com",84],["njwildlifecam.com",84],["nyharborwebcam.com",84],["paradiseislandcam.com",84],["pompanobeachcam.com",84],["portbermudawebcam.com",84],["portcanaveralwebcam.com",84],["portevergladeswebcam.com",84],["portmiamiwebcam.com",84],["portnywebcam.com",84],["portnassauwebcam.com",84],["portstmaartenwebcam.com",84],["portstthomaswebcam.com",84],["porttampawebcam.com",84],["sxmislandcam.com",84],["themes-dl.com",84],["badassdownloader.com",84],["badasshardcore.com",84],["badassoftcore.com",84],["nulljungle.com",84],["teevee.asia",84],["otakukan.com",84],["gearingcommander.com",86],["generate.plus",87],["calculate.plus",87],["avcesar.com",88],["audiotag.info",89],["tudigitale.it",90],["ibcomputing.com",91],["legia.net",92],["acapellas4u.co.uk",93],["robloxscripts.com",94],["libreriamo.it",94],["postazap.com",94],["medebooks.xyz",94],["tutorials-technology.info",94],["mashtips.com",94],["marriedgames.com.br",94],["4allprograms.me",94],["nurgsm.com",94],["certbyte.com",94],["plugincrack.com",94],["gamingdeputy.com",94],["freewebcart.com",94],["streamhentaimovies.com",95],["konten.co.id",96],["diariodenavarra.es",97],["tubereader.me",97],["scripai.com",97],["myfxbook.com",97],["whatfontis.com",97],["xiaomifans.pl",98],["eletronicabr.com",98],["optifine.net",99],["luzernerzeitung.ch",100],["tagblatt.ch",100],["spellcheck.net",101],["spellchecker.net",101],["spellweb.com",101],["ableitungsrechner.net",102],["alternet.org",103],["gourmetsupremacy.com",103],["shrib.com",104],["pandafiles.com",105],["vidia.tv",[105,126]],["hortonanderfarom.blogspot.com",105],["clarifystraight.com",105],["tutelehd3.xyz",106],["mega4upload.com",106],["coolcast2.com",106],["techclips.net",106],["earthquakecensus.com",106],["footyhunter.lol",106],["gamerarcades.com",106],["poscitech.click",106],["starlive.stream",106],["utopianwilderness.com",106],["wecast.to",106],["sportbar.live",106],["lordchannel.com",106],["play-old-pc-games.com",107],["tunovelaligera.com",108],["tapchipi.com",108],["cuitandokter.com",108],["tech-blogs.com",108],["cardiagn.com",108],["dcleakers.com",108],["esgeeks.com",108],["pugliain.net",108],["uplod.net",108],["worldfreeware.com",108],["fikiri.net",108],["myhackingworld.com",108],["phoenixfansub.com",108],["freecourseweb.com",109],["devcourseweb.com",109],["coursewikia.com",109],["courseboat.com",109],["coursehulu.com",109],["lne.es",113],["pornult.com",114],["webcamsdolls.com",114],["bitcotasks.com",[114,160]],["adsy.pw",114],["playstore.pw",114],["exactpay.online",114],["thothd.to",114],["proplanta.de",115],["hydrogenassociation.org",116],["ludigames.com",116],["sportitalialive.com",116],["made-by.org",116],["xenvn.com",116],["worldtravelling.com",116],["igirls.in",116],["technichero.com",116],["roshiyatech.my.id",116],["24sport.stream",116],["aeroxplorer.com",116],["mad4wheels.com",117],["logi.im",117],["emailnator.com",117],["textograto.com",118],["voyageforum.com",119],["hmc-id.blogspot.com",119],["jemerik.com",119],["ilforumdeibrutti.is",119],["myabandonware.com",119],["chatta.it",121],["ketubanjiwa.com",122],["nsfw247.to",123],["funzen.net",123],["fighter.stream",123],["ilclubdellericette.it",123],["hubstream.in",123],["extremereportbot.com",124],["getintopc.com",125],["qoshe.com",127],["lowellsun.com",128],["mamadu.pl",128],["dobrapogoda24.pl",128],["motohigh.pl",128],["namasce.pl",128],["ultimate-catch.eu",129],["cpopchanelofficial.com",130],["creditcardgenerator.com",131],["creditcardrush.com",131],["bostoncommons.net",131],["thejobsmovie.com",131],["livsavr.co",131],["hl-live.de",132],["wohnmobilforum.de",132],["nulledbear.com",132],["sinnerclownceviri.net",132],["satoshi-win.xyz",132],["encurtandourl.com",[132,138]],["freedeepweb.blogspot.com",132],["freesoft.id",132],["zcteam.id",132],["www-daftarharga.blogspot.com",132],["ear-phone-review.com",132],["telefullenvivo.com",132],["listatv.pl",132],["ltc-faucet.xyz",132],["coin-profits.xyz",132],["relampagomovies.com",132],["nilopolisonline.com.br",133],["mesquitaonline.com",133],["yellowbridge.com",133],["socialgirls.im",134],["yaoiotaku.com",135],["camhub.world",136],["moneyhouse.ch",137],["ihow.info",138],["hartico.tv",138],["filesus.com",138],["sturls.com",138],["re.two.re",138],["turbo1.co",138],["cartoonsarea.xyz",138],["valeronevijao.com",139],["cigarlessarefy.com",139],["figeterpiazine.com",139],["yodelswartlike.com",139],["generatesnitrosate.com",139],["crownmakermacaronicism.com",139],["chromotypic.com",139],["gamoneinterrupted.com",139],["metagnathtuggers.com",139],["wolfdyslectic.com",139],["rationalityaloelike.com",139],["sizyreelingly.com",139],["simpulumlamerop.com",139],["urochsunloath.com",139],["monorhinouscassaba.com",139],["counterclockwisejacky.com",139],["35volitantplimsoles5.com",139],["scatch176duplicities.com",139],["antecoxalbobbing1010.com",139],["boonlessbestselling244.com",139],["cyamidpulverulence530.com",139],["guidon40hyporadius9.com",139],["449unceremoniousnasoseptal.com",139],["19turanosephantasia.com",139],["30sensualizeexpression.com",139],["321naturelikefurfuroid.com",139],["745mingiestblissfully.com",139],["availedsmallest.com",139],["greaseball6eventual20.com",139],["toxitabellaeatrebates306.com",139],["20demidistance9elongations.com",139],["audaciousdefaulthouse.com",139],["fittingcentermondaysunday.com",139],["fraudclatterflyingcar.com",139],["launchreliantcleaverriver.com",139],["matriculant401merited.com",139],["realfinanceblogcenter.com",139],["reputationsheriffkennethsand.com",139],["telyn610zoanthropy.com",139],["tubelessceliolymph.com",139],["tummulerviolableness.com",139],["un-block-voe.net",139],["v-o-e-unblock.com",139],["voe-un-block.com",139],["voeun-block.net",139],["voeunbl0ck.com",139],["voeunblck.com",139],["voeunblk.com",139],["voeunblock.com",139],["voeunblock1.com",139],["voeunblock2.com",139],["voeunblock3.com",139],["agefi.fr",140],["cariskuy.com",141],["letras2.com",141],["yusepjaelani.blogspot.com",142],["letras.mus.br",143],["mtlurb.com",144],["port.hu",145],["acdriftingpro.com",145],["flight-report.com",145],["forumdz.com",145],["abandonmail.com",145],["flmods.com",145],["zilinak.sk",145],["projectfreetv.stream",145],["hotdesimms.com",145],["pdfaid.com",145],["mconverter.eu",145],["dzeko11.net",[145,277]],["bootdey.com",145],["mail.com",145],["expresskaszubski.pl",145],["moegirl.org.cn",145],["onemanhua.com",146],["t3n.de",147],["allindiaroundup.com",148],["vectorizer.io",149],["smgplaza.com",149],["onehack.us",149],["thapcam.net",149],["thefastlaneforum.com",150],["trade2win.com",151],["modagamers.com",152],["freemagazines.top",152],["straatosphere.com",152],["rule34porn.net",152],["nullpk.com",152],["adslink.pw",152],["downloadudemy.com",152],["picgiraffe.com",152],["weadown.com",152],["freepornsex.net",152],["nurparatodos.com.ar",152],["librospreuniversitariospdf.blogspot.com",153],["msdos-games.com",153],["blocklayer.com",153],["forexeen.us",153],["khsm.io",153],["webcreator-journal.com",153],["nu6i-bg-net.com",153],["routech.ro",154],["hokej.net",154],["turkmmo.com",155],["palermotoday.it",156],["baritoday.it",156],["trentotoday.it",156],["agrigentonotizie.it",156],["anconatoday.it",156],["arezzonotizie.it",156],["avellinotoday.it",156],["bresciatoday.it",156],["brindisireport.it",156],["casertanews.it",156],["cataniatoday.it",156],["cesenatoday.it",156],["chietitoday.it",156],["forlitoday.it",156],["frosinonetoday.it",156],["genovatoday.it",156],["ilpescara.it",156],["ilpiacenza.it",156],["latinatoday.it",156],["lecceprima.it",156],["leccotoday.it",156],["livornotoday.it",156],["messinatoday.it",156],["milanotoday.it",156],["modenatoday.it",156],["monzatoday.it",156],["novaratoday.it",156],["padovaoggi.it",156],["parmatoday.it",156],["perugiatoday.it",156],["pisatoday.it",156],["quicomo.it",156],["ravennatoday.it",156],["reggiotoday.it",156],["riminitoday.it",156],["romatoday.it",156],["salernotoday.it",156],["sondriotoday.it",156],["sportpiacenza.it",156],["ternitoday.it",156],["today.it",156],["torinotoday.it",156],["trevisotoday.it",156],["triesteprima.it",156],["udinetoday.it",156],["veneziatoday.it",156],["vicenzatoday.it",156],["thumpertalk.com",157],["arkcod.org",157],["facciabuco.com",158],["softx64.com",159],["thelayoff.com",160],["manwan.xyz",160],["blog.coinsrise.net",160],["blog.cryptowidgets.net",160],["blog.insurancegold.in",160],["blog.wiki-topia.com",160],["blog.coinsvalue.net",160],["blog.cookinguide.net",160],["blog.freeoseocheck.com",160],["blog.makeupguide.net",160],["blog.carstopia.net",160],["blog.carsmania.net",160],["shorterall.com",160],["blog24.me",160],["maxstream.video",160],["maxlinks.online",160],["tvepg.eu",160],["dailymaverick.co.za",161],["apps2app.com",162],["cheatermad.com",163],["ville-ideale.fr",164],["eodev.com",165],["tickzoo.tv",166],["fm-arena.com",167],["tradersunion.com",168],["tandess.com",169],["faqwiki.us",170],["sonixgvn.net",170],["spontacts.com",171],["dankmemer.lol",172],["getexploits.com",173],["fplstatistics.com",174],["breitbart.com",175],["salidzini.lv",176],["choosingnothing.com",177],["cryptorank.io",[178,179]],["th.gl",180],["4kwebplay.xyz",181],["qqwebplay.xyz",181],["viwlivehdplay.ru",181],["molbiotools.com",182],["vods.tv",183],["18xxx.xyz",184],["raidrush.net",185],["xnxxcom.xyz",186],["videzz.net",187],["spambox.xyz",188],["melaniezettofrais.online",189],["giga-uqload.xyz",190],["gaystream.online",190],["bembed.net",190],["elbailedeltroleo.site",190],["embedv.net",190],["fslinks.org",190],["listeamed.net",190],["v6embed.xyz",190],["vgplayer.xyz",190],["vid-guard.com",190],["vidguard.online",190],["starkroboticsfrc.com",191],["sinonimos.de",191],["antonimos.de",191],["quesignifi.ca",191],["tiktokrealtime.com",191],["tiktokcounter.net",191],["tpayr.xyz",191],["poqzn.xyz",191],["ashrfd.xyz",191],["rezsx.xyz",191],["tryzt.xyz",191],["ashrff.xyz",191],["rezst.xyz",191],["dawenet.com",191],["erzar.xyz",191],["waezm.xyz",191],["waezg.xyz",191],["blackwoodacademy.org",191],["cryptednews.space",191],["vivuq.com",191],["swgop.com",191],["vbnmll.com",191],["telcoinfo.online",191],["dshytb.com",191],["enit.in",192],["financerites.com",192],["fadedfeet.com",193],["homeculina.com",193],["ineedskin.com",193],["kenzo-flowertag.com",193],["lawyex.co",193],["mdn.lol",193],["bitzite.com",194],["coingraph.us",195],["impact24.us",195],["apkmodvn.com",196],["mod1s.com",196],["apkmoddone.com",197],["dl.apkmoddone.com",198],["phongroblox.com",198],["my-code4you.blogspot.com",199],["vrcmods.com",200],["osuskinner.com",200],["osuskins.net",200],["pentruea.com",[201,202]],["mchacks.net",203],["why-tech.it",204],["compsmag.com",205],["tapetus.pl",206],["autoroad.cz",207],["brawlhalla.fr",207],["tecnobillo.com",207],["sexcamfreeporn.com",208],["breatheheavy.com",209],["wenxuecity.com",210],["key-hub.eu",211],["fabioambrosi.it",212],["tattle.life",213],["emuenzen.de",213],["terrylove.com",213],["mynet.com",[214,278]],["cidade.iol.pt",215],["fantacalcio.it",216],["hentaifreak.org",217],["hypebeast.com",218],["krankheiten-simulieren.de",219],["catholic.com",220],["ad-doge.com",221],["3dmodelshare.org",222],["gourmetscans.net",223],["techinferno.com",224],["ibeconomist.com",225],["bookriot.com",226],["purposegames.com",227],["globo.com",228],["latimes.com",228],["claimrbx.gg",229],["perelki.net",230],["vpn-anbieter-vergleich-test.de",231],["livingincebuforums.com",232],["paperzonevn.com",233],["alltechnerd.com",234],["malaysianwireless.com",235],["erinsakura.com",236],["infofuge.com",236],["freejav.guru",236],["novelmultiverse.com",236],["fritidsmarkedet.dk",237],["maskinbladet.dk",237],["15min.lt",238],["baddiehub.com",239],["mr9soft.com",240],["21porno.com",241],["adult-sex-gamess.com",242],["hentaigames.app",242],["mobilesexgamesx.com",242],["mysexgamer.com",242],["porngameshd.com",242],["sexgamescc.com",242],["xnxx-sex-videos.com",242],["f2movies.to",243],["freeporncave.com",244],["tubsxxx.com",245],["pornojenny.com",246],["subtitle.one",247],["manga18fx.com",248],["freebnbcoin.com",248],["sextvx.com",249],["studydhaba.com",250],["freecourse.tech",250],["victor-mochere.com",250],["papunika.com",250],["mobilanyheter.net",250],["prajwaldesai.com",[250,269]],["ftuapps.dev",250],["muztext.com",251],["pornohans.com",252],["nursexfilme.com",252],["pornohirsch.net",252],["xhamster-sexvideos.com",252],["pornoschlange.com",252],["hdpornos.net",252],["gutesexfilme.com",252],["short1.site",252],["zona-leros.com",252],["charbelnemnom.com",253],["simplebits.io",254],["online-fix.me",255],["gamersdiscussionhub.com",256],["owlzo.com",257],["q1003.com",258],["blogpascher.com",259],["testserver.pro",260],["lifestyle.bg",260],["money.bg",260],["news.bg",260],["topsport.bg",260],["webcafe.bg",260],["mgnet.xyz",261],["advertiserandtimes.co.uk",262],["xvideos2020.me",263],["111.90.159.132",264],["techsolveprac.com",265],["joomlabeginner.com",266],["largescaleforums.com",267],["dubznetwork.com",268],["hentaidexy.com",270],["babia.to",271],["code2care.org",272],["xxxxsx.com",274],["ngontinh24.com",275],["idevicecentral.com",276],["zona11.com",277],["scsport.live",277],["blog.esuteru.com",278],["blog.livedoor.jp",278],["carscoops.com",278],["dziennik.pl",278],["eurointegration.com.ua",278],["flatpanelshd.com",278],["fourfourtwo.co.kr",278],["issuya.com",278],["itainews.com",278],["iusm.co.kr",278],["logicieleducatif.fr",278],["missyusa.com",278],["mydaily.co.kr",278],["onlinegdb.com",278],["pravda.com.ua",278],["reportera.co.kr",278],["sportsrec.com",278],["sportsseoul.com",278],["taxguru.in",278],["text-compare.com",278],["thestar.co.uk",278],["tweaksforgeeks.com",278],["videogamemods.com",278],["wfmz.com",278],["worldhistory.org",278],["yorkshirepost.co.uk",278],["etnews.com",278],["wort-suchen.de",278],["word-grabber.com",278],["palabr.as",278],["motscroises.fr",278],["cruciverba.it",278],["raenonx.cc",278],["indiatimes.com",278],["aikatu.jp",278],["adintrend.tv",278],["ark-unity.com",278],["cool-style.com.tw",278],["thesaurus.net",279],["automobile-catalog.com",279],["motorbikecatalog.com",279],["maketecheasier.com",279],["jjang0u.com",280],["mangacrab.com",282],["viefaucet.com",283],["cloud-computing-central.com",284],["afk.guide",285],["businessnamegenerator.com",286],["derstandard.at",287],["derstandard.de",287],["rocketnews24.com",288],["soranews24.com",288],["youpouch.com",288],["ilsole24ore.com",289],["ipacrack.com",290],["hentaiporn.one",291],["infokik.com",292],["daemonanime.net",293],["daemon-hentai.com",293],["deezer.com",294],["fosslinux.com",295],["shrdsk.me",296],["examword.com",297],["sempreupdate.com.br",297],["tribuna.com",298],["trendsderzukunft.de",299],["gal-dem.com",299],["lostineu.eu",299],["oggitreviso.it",299],["speisekarte.de",299],["mixed.de",299],["lightnovelspot.com",[300,301]],["lightnovelworld.com",[300,301]],["novelpub.com",[300,301]],["webnovelpub.com",[300,301]],["mail.yahoo.com",302],["hwzone.co.il",303],["nammakalvi.com",304],["javmoon.me",305],["c2g.at",306],["terafly.me",306],["elamigos-games.com",306],["elamigos-games.net",306],["dktechnicalmate.com",307],["recipahi.com",307],["converter-btc.world",307],["kaystls.site",308],["aquarius-horoscopes.com",309],["cancer-horoscopes.com",309],["dubipc.blogspot.com",309],["echoes.gr",309],["engel-horoskop.de",309],["freegames44.com",309],["fuerzasarmadas.eu",309],["gemini-horoscopes.com",309],["jurukunci.net",309],["krebs-horoskop.com",309],["leo-horoscopes.com",309],["maliekrani.com",309],["nklinks.click",309],["ourenseando.es",309],["pisces-horoscopes.com",309],["radio-en-direct.fr",309],["sagittarius-horoscopes.com",309],["scorpio-horoscopes.com",309],["singlehoroskop-loewe.de",309],["skat-karten.de",309],["skorpion-horoskop.com",309],["taurus-horoscopes.com",309],["the1security.com",309],["torrentmovies.online",309],["virgo-horoscopes.com",309],["zonamarela.blogspot.com",309],["yoima.hatenadiary.com",309],["vpntester.org",310],["watchhentai.net",311],["japscan.lol",312],["digitask.ru",313],["tempumail.com",314],["sexvideos.host",315],["10alert.com",317],["cryptstream.de",318],["nydus.org",318],["techhelpbd.com",319],["fapdrop.com",320],["cellmapper.net",321],["hdrez.com",322],["youwatch-serie.com",322],["newscon.org",323],["printablecreative.com",324],["comohoy.com",325],["leak.sx",325],["paste.bin.sx",325],["pornleaks.in",325],["merlininkazani.com",325],["j91.asia",327],["jeniusplay.com",328],["indianyug.com",329],["rgb.vn",329],["needrom.com",330],["criptologico.com",331],["megadrive-emulator.com",332],["eromanga-show.com",333],["hentai-one.com",333],["hentaipaw.com",333],["10minuteemails.com",334],["luxusmail.org",334],["w3cub.com",335],["bangpremier.com",336],["nyaa.iss.ink",337],["tnp98.xyz",339],["freepdfcomic.com",340],["memedroid.com",341],["animesync.org",342],["karaoketexty.cz",343],["filmizlehdfilm.com",344],["fullfilmizle.cc",344],["resortcams.com",345],["mjakmama24.pl",347],["security-demo.extrahop.com",348],["lastampa.it",349]]);

const entitiesMap = new Map([["comunio",0],["finanzen",[0,5]],["gameswelt",0],["heftig",0],["notebookcheck",0],["testedich",0],["transfermarkt",0],["truckscout24",0],["tvtv",0],["wetteronline",0],["wieistmeineip",0],["wetter",2],["1337x",4],["eztv",4],["sushi-scan",8],["spigotunlocked",8],["ahmedmode",8],["kissasian",11],["rp5",12],["mma-core",13],["yts",17],["720pstream",17],["1stream",17],["thefmovies",18],["urlcero",24],["totaldebrid",27],["sandrives",27],["fxporn69",36],["aliancapes",36],["pouvideo",38],["povvideo",38],["povw1deo",38],["povwideo",38],["powv1deo",38],["powvibeo",38],["powvideo",38],["powvldeo",38],["tubsexer",44],["porno-tour",44],["lenkino",44],["pornomoll",44],["camsclips",44],["m4ufree",48],["writedroid",59],["telerium",63],["pandafreegames",77],["thoptv",85],["shortzzy",94],["streameast",106],["thestreameast",106],["daddylivehd",106],["solvetube",110],["hdfilme",111],["pornhub",112],["wcofun",119],["bollyholic",123],["gotxx",138],["turkanime",139],["voe-unblock",139],["khatrimaza",152],["pogolinks",152],["popcornstream",154],["brainly",165],["oploverz",166],["vembed",190],["xhamsterdeutsch",252],["privatemoviez",256],["gmx",273],["lightnovelpub",[300,301]],["camcaps",316],["drivebot",338],["thenextplanet1",339],["filmizletv",344],["autoscout24",346]]);

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
                return { matchAll: true, expect: true };
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
