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

const scriptletGlobals = new Map(); // jshint ignore: line

const argsList = [[".call(null)","10"],[".call(null)"],["(null)","10"],["userHasAdblocker"],["null)","10"],["objSubPromo"],["adb"],["nrWrapper"],["warn"],["adBlockerDetected"],["show"],["adObjects"],["offsetParent"],["InfMediafireMobileFunc","1000"],["google_jobrunner"],["()","45000"],["prompt"],["0x"],["displayAdBlockedVideo"],[".adsbygoogle"],["contrformpub","5000"],["disabledAdBlock","10000"],["_0x"],["ads.length"],["location.href"],["isDesktopApp","1000"],["Bait"],["admc"],["AdBlocker"],["Blocked"],["nextFunction"],["'0x"],["apstagLOADED"],["/Adb|moneyDetect/"],["disableDeveloper"],["Blocco","2000"],["nextFunction","2000"],["documentElement.classList.add","400"],["test","0"],["checkAdblockUser","1000"],["checkPub","6000"],["document.querySelector","5000"],["nextFunction","250"],["popup"],["()","150"],["backRedirect"],["document.querySelectorAll","1000"],["style"],["clientHeight"],["addEventListener","0"],["adblock","2000"],["start","0"],["byepopup","5000"],["test.remove","100"],["additional_src","300"],["()","2000"],["css_class.show"],["CANG","3000"],["updato-overlay","500"],["innerText","2000"],["alert","8000"],["css_class"],["()","50"],["debugger"],["initializeCourier","3000"],["redirectPage"],["_0x","2000"],["ads","750"],["location.href","500"],["Adblock","5000"],["disable","200"],["CekAab","0"],["rbm_block_active","1000"],["show()"],["n.trigger","1"],["instance.check","1"],["adblock"],["abDetected"],["KeepOpeningPops","1000"],["appendChild"],["adb","0"],["adBlocked"],["warning","100"],["adblock_popup","500"],["Adblock"],["#chatWrap","1000"],["keep-ads","2000"],["#rbm_block_active","1000"],["null","4000"],["()","2500"],["myaabpfun","3000"],["adFilled","2500"],["()","15000"],["showPopup"],["()","1"],["()","1000"],["document.cookie","2500"],["window.open"],["innerHTML"],["readyplayer","2000"],["/text()|0x/"],["checkStopBlock"],["adspot_top","1500"],["/offsetHeight|google|Global/"],["an_message","500"],["Adblocker","10000"],["trigger","0"],["timeoutChecker"],["bait","1"],["pum-open"],["overlay","2000"],["test","100"],["Math.round","1000"],["adblock","5"],["bioEp"],["ag_adBlockerDetected"],["null"],["adsbox","1000"],["adb","6000"],["pop"],["sadbl"],["checkAdStatus"],["()","0"],["mdp"],["brave_load_popup"],["0x","3000"],["invoke"],["adsbytrafficjunkycontext"],["ipod"],["offsetWidth"],["/$|adBlock/"],["ads"],["adsbygoogle"],["()"],["AdBlock"],["stop-scrolling"],["Adv"],["blockUI","2000"],["mdpDeBlocker"],["/_0x|debug/"],["/ai_adb|_0x/"],["iframe"],["adBlock"],["","1"],["undefined"],["check","1"],["adsBlocked"],["blocker"],["aswift_"],["afs_ads","2000"],["visibility","2000"],["bait"],["getComputedStyle","250"],["blocked"],["{r()","0"],["nextFunction","450"],["Debug"],["r()","0"],["offset"],["purple_box"],["offsetHeight"],["checkSiteNormalLoad"],["adBlockOverlay"],["Detected","500"],["modal"],[".show","1000"],[".show"],["showModal"],["getComputedStyle"],["blur"],["samOverlay"],["bADBlock"],["location"],["","4000"],["blocker","100"],["alert"],["length"],["ai_adb"],["t()","0"],["$"],["getComputedStyle","2000"],["","5"],["/adblock|isRequestPresent/"],["offsetLeft"],[".show()","1000"],["height"],["mdp_deblocker"],["charAt"],["checkAds"],["fadeIn","0"],["jQuery"],["/^/"],["afterOpen"],["check"],["Adblocker"],["eabdModal"],["ab_root.show"],["gaData"],["ad"],["prompt","1000"],["googlefc"],["adblock detection"],[".offsetHeight","100"],["popState"],["ad-block-popup"],["exitTimer"],["innerHTML.replace"],["data?","4000"],[".data?"],["eabpDialog"],[".length","2000"],["adsense"],["/Adblock|_ad_/"],["googletag"],["f.parentNode.removeChild(f)","100"],["swal","500"],["keepChecking","1000"],["openPopup"],[".offsetHeight"],["()=>{"],["nitroAds"],["class.scroll","1000"],["disableDeveloperTools"],["Check"],["insertBefore"],["setAntiAb"],["css_class.scroll"],["/null|Error/","10000"],["window.location.href","50"],["/out.php"],["/0x|devtools/"],["location.replace","300"],["window.location.href"],["checkVisible"],["_0x","3000"],["window.location.href=link"],["ai_"],["reachGoal"],["Adb"],["ai"],["/width|innerHTML/"],["magnificPopup"],["adblockEnabled"],["google_ad"],["document.location"],["google"],["top-right","2000"],["enforceAdStatus"],["loadScripts"],["mfp"],["display","5000"],["eb"],[").show()"],["","1000"],["atob"],["devtool"],["Msg"],["UABP"],["href"],["aaaaa-modal"],["\\x","5000"],["()=>"],["keepChecking"],["null","10"],["","500"],["/Adform|didomi|adblock|forEach/"],["showAdblock"],["-0x"],["display"],["gclid"],["event","3000"],["rejectWith"],["refresh"],["window.location"],["ga"],["adbl"],["Ads"],["ShowAdBLockerNotice"],["ad_listener"],["open"],["(!0)"],["Delay"],["/appendChild|e\\(\"/"],["=>"],["ADB"],["site-access-popup"],["data?"],["/debugger|UserCustomPop/"],["checkAdblockUser"],["offsetHeight","100"],["AdDetect"],["displayMessage","2000"],["/salesPopup|mira-snackbar/"],["advanced"],["detectImgLoad"],["offsetHeight","200"],["detector"],["replace"],["touchstart"],["siteAccessFlag"],["ab"],["/adblocker|alert/"],["redURL"],["/children\\('ins'\\)|Adblock|adsbygoogle/"],["displayMessage"],["fetch"],["chkADB"],["onDetected"],["myinfoey","1500"],["placebo"],["fuckadb"],["detect"],["siteAccessPopup"],["/adsbygoogle|adblock/"],["akadb"],["biteDisplay"],["/[a-z]\\(!0\\)/","800"],["ad_block"],["/detectAdBlocker|window.open/"],["adBlockDetected"],["popUnder"],["/GoToURL|delay/"],["window.location.href","300"],["/adblock/i"],["ad_display"],["/adScriptPath|MMDConfig/"],["0x","100"],["/native|\\{n\\(\\)/"],["adblocker"],["/Detect|adblock|style\\.display|\\[native code]|\\.call\\(null\\)/"],["removeChild"],["ad blocker"],["document.body.innerHTML"]];

const hostnamesMap = new Map([["4-liga.com",0],["4fansites.de",0],["4players.de",0],["9monate.de",0],["aachener-nachrichten.de",0],["aachener-zeitung.de",0],["abendblatt.de",0],["abendzeitung-muenchen.de",0],["about-drinks.com",0],["abseits-ka.de",0],["airliners.de",0],["ajaxshowtime.com",0],["allgemeine-zeitung.de",0],["antenne.de",0],["arcor.de",0],["areadvd.de",0],["areamobile.de",0],["ariva.de",0],["astronews.com",0],["aussenwirtschaftslupe.de",0],["auszeit.bio",0],["auto-motor-und-sport.de",0],["auto-service.de",0],["autobild.de",0],["autoextrem.de",0],["autopixx.de",0],["autorevue.at",0],["az-online.de",0],["baby-vornamen.de",0],["babyclub.de",0],["bafoeg-aktuell.de",0],["berliner-kurier.de",0],["berliner-zeitung.de",0],["bigfm.de",0],["bikerszene.de",0],["bildderfrau.de",0],["blackd.de",0],["blick.de",0],["boerse-online.de",0],["boerse.de",0],["boersennews.de",0],["braunschweiger-zeitung.de",0],["brieffreunde.de",0],["brigitte.de",0],["buerstaedter-zeitung.de",0],["buffed.de",0],["businessinsider.de",0],["buzzfeed.at",0],["buzzfeed.de",0],["caravaning.de",0],["cavallo.de",0],["chefkoch.de",0],["cinema.de",0],["clever-tanken.de",0],["computerbild.de",0],["computerhilfen.de",0],["comunio-cl.com",0],["connect.de",0],["da-imnetz.de",0],["dasgelbeblatt.de",0],["dbna.com",0],["dbna.de",0],["deichstube.de",0],["deine-tierwelt.de",0],["der-betze-brennt.de",0],["derwesten.de",0],["desired.de",0],["dhd24.com",0],["dieblaue24.com",0],["digitalfernsehen.de",0],["dnn.de",0],["donnerwetter.de",0],["e-hausaufgaben.de",0],["e-mountainbike.com",0],["eatsmarter.de",0],["echo-online.de",0],["ecomento.de",0],["einfachschoen.me",0],["elektrobike-online.com",0],["eltern.de",0],["epochtimes.de",0],["essen-und-trinken.de",0],["express.de",0],["extratipp.com",0],["familie.de",0],["fanfiktion.de",0],["fehmarn24.de",0],["fettspielen.de",0],["fid-gesundheitswissen.de",0],["finanznachrichten.de",0],["finanztreff.de",0],["finya.de",0],["firmenwissen.de",0],["fitforfun.de",0],["fnp.de",0],["focus.de",0],["football365.fr",0],["formel1.de",0],["fr.de",0],["frankfurter-wochenblatt.de",0],["freenet.de",0],["fremdwort.de",0],["froheweihnachten.info",0],["frustfrei-lernen.de",0],["fuldaerzeitung.de",0],["funandnews.de",0],["fussballdaten.de",0],["futurezone.de",0],["gala.de",0],["gamepro.de",0],["gamersglobal.de",0],["gamesaktuell.de",0],["gamestar.de",0],["gamezone.de",0],["gartendialog.de",0],["gartenlexikon.de",0],["gedichte.ws",0],["geissblog.koeln",0],["gelnhaeuser-tageblatt.de",0],["general-anzeiger-bonn.de",0],["geniale-tricks.com",0],["genialetricks.de",0],["gesund-vital.de",0],["gesundheit.de",0],["gevestor.de",0],["gewinnspiele.tv",0],["giessener-allgemeine.de",0],["giessener-anzeiger.de",0],["gifhorner-rundschau.de",0],["giga.de",0],["gipfelbuch.ch",0],["gmuender-tagespost.de",0],["golem.de",[0,9,10]],["gruenderlexikon.de",0],["gusto.at",0],["gut-erklaert.de",0],["gutfuerdich.co",0],["hallo-muenchen.de",0],["hamburg.de",0],["hanauer.de",0],["hardwareluxx.de",0],["hartziv.org",0],["harzkurier.de",0],["haus-garten-test.de",0],["hausgarten.net",0],["haustec.de",0],["haz.de",0],["heidelberg24.de",0],["heilpraxisnet.de",0],["heise.de",0],["helmstedter-nachrichten.de",0],["hersfelder-zeitung.de",0],["hftg.co",0],["hifi-forum.de",0],["hna.de",0],["hochheimer-zeitung.de",0],["hoerzu.de",0],["hofheimer-zeitung.de",0],["iban-rechner.de",0],["ikz-online.de",0],["immobilienscout24.de",0],["ingame.de",0],["inside-digital.de",0],["inside-handy.de",0],["investor-verlag.de",0],["jappy.com",0],["jpgames.de",0],["kabeleins.de",0],["kachelmannwetter.com",0],["kamelle.de",0],["kicker.de",0],["kindergeld.org",0],["klettern-magazin.de",0],["klettern.de",0],["kochbar.de",0],["kreis-anzeiger.de",0],["kreisbote.de",0],["kreiszeitung.de",0],["ksta.de",0],["kurierverlag.de",0],["lachainemeteo.com",0],["lampertheimer-zeitung.de",0],["landwirt.com",0],["laut.de",0],["lauterbacher-anzeiger.de",0],["leckerschmecker.me",0],["leinetal24.de",0],["lesfoodies.com",0],["levif.be",0],["lifeline.de",0],["liga3-online.de",0],["likemag.com",0],["linux-community.de",0],["linux-magazin.de",0],["live.vodafone.de",0],["ln-online.de",0],["lokalo24.de",0],["lustaufsleben.at",0],["lustich.de",0],["lvz.de",0],["lz.de",0],["macwelt.de",0],["macworld.co.uk",0],["mail.de",0],["main-spitze.de",0],["manager-magazin.de",0],["manga-tube.me",0],["mathebibel.de",0],["mathepower.com",0],["maz-online.de",0],["medisite.fr",0],["mehr-tanken.de",0],["mein-kummerkasten.de",0],["mein-mmo.de",0],["mein-wahres-ich.de",0],["meine-anzeigenzeitung.de",0],["meinestadt.de",0],["menshealth.de",0],["mercato365.com",0],["merkur.de",0],["messen.de",0],["metal-hammer.de",0],["metalflirt.de",0],["meteologix.com",0],["minecraft-serverlist.net",0],["mittelbayerische.de",0],["modhoster.de",0],["moin.de",0],["mopo.de",0],["morgenpost.de",0],["motor-talk.de",0],["motorbasar.de",0],["motorradonline.de",0],["motorsport-total.com",0],["motortests.de",0],["mountainbike-magazin.de",0],["moviejones.de",0],["moviepilot.de",0],["mt.de",0],["mtb-news.de",0],["musiker-board.de",0],["musikexpress.de",0],["musikradar.de",0],["mz-web.de",0],["n-tv.de",0],["naumburger-tageblatt.de",0],["netzwelt.de",0],["neuepresse.de",0],["neueroeffnung.info",0],["news.at",0],["news.de",0],["news38.de",0],["newsbreak24.de",0],["nickles.de",0],["nicknight.de",0],["nl.hardware.info",0],["nn.de",0],["nnn.de",0],["nordbayern.de",0],["notebookchat.com",0],["notebookcheck-ru.com",0],["notebookcheck-tr.com",0],["noz-cdn.de",0],["noz.de",0],["nrz.de",0],["nw.de",0],["nwzonline.de",0],["oberhessische-zeitung.de",0],["oeffentlicher-dienst.info",0],["onlinekosten.de",0],["onvista.de",0],["op-marburg.de",0],["op-online.de",0],["outdoor-magazin.com",0],["outdoorchannel.de",0],["paradisi.de",0],["pc-magazin.de",0],["pcgames.de",0],["pcgameshardware.de",0],["pcwelt.de",0],["pcworld.es",0],["peiner-nachrichten.de",0],["pferde.de",0],["pietsmiet.de",0],["pixelio.de",0],["pkw-forum.de",0],["playboy.de",0],["playfront.de",0],["pnn.de",0],["pons.com",0],["prad.de",[0,135]],["prignitzer.de",0],["profil.at",0],["promipool.de",0],["promobil.de",0],["prosiebenmaxx.de",0],["psychic.de",[0,160]],["quoka.de",0],["radio.at",0],["radio.de",0],["radio.dk",0],["radio.es",0],["radio.fr",0],["radio.it",0],["radio.net",0],["radio.pl",0],["radio.pt",0],["radio.se",0],["ran.de",0],["readmore.de",0],["rechtslupe.de",0],["recording.de",0],["rennrad-news.de",0],["reuters.com",0],["reviersport.de",0],["rhein-main-presse.de",0],["rheinische-anzeigenblaetter.de",0],["rimondo.com",0],["roadbike.de",0],["roemische-zahlen.net",0],["rollingstone.de",0],["rot-blau.com",0],["rp-online.de",0],["rtl.de",[0,263]],["rtv.de",0],["rugby365.fr",0],["ruhr24.de",0],["rundschau-online.de",0],["runnersworld.de",0],["safelist.eu",0],["salzgitter-zeitung.de",0],["sat1.de",0],["sat1gold.de",0],["schoener-wohnen.de",0],["schwaebische-post.de",0],["schwarzwaelder-bote.de",0],["serienjunkies.de",0],["shz.de",0],["sixx.de",0],["skodacommunity.de",0],["smart-wohnen.net",0],["sn.at",0],["sozialversicherung-kompetent.de",0],["spiegel.de",0],["spielen.de",0],["spieletipps.de",0],["spielfilm.de",0],["sport.de",0],["sport365.fr",0],["sportal.de",0],["spox.com",0],["stern.de",0],["stuttgarter-nachrichten.de",0],["stuttgarter-zeitung.de",0],["sueddeutsche.de",0],["svz.de",0],["szene1.at",0],["szene38.de",0],["t-online.de",0],["tagesspiegel.de",0],["taschenhirn.de",0],["techadvisor.co.uk",0],["techstage.de",0],["tele5.de",0],["the-voice-of-germany.de",0],["thueringen24.de",0],["tichyseinblick.de",0],["tierfreund.co",0],["tiervermittlung.de",0],["torgranate.de",0],["trend.at",0],["tv-media.at",0],["tvdigital.de",0],["tvinfo.de",0],["tvspielfilm.de",0],["tvtoday.de",0],["tz.de",0],["unicum.de",0],["unnuetzes.com",0],["unsere-helden.com",0],["unterhalt.net",0],["usinger-anzeiger.de",0],["usp-forum.de",0],["videogameszone.de",0],["vienna.at",0],["vip.de",0],["virtualnights.com",0],["vox.de",0],["wa.de",0],["wallstreet-online.de",[0,3]],["waz.de",0],["weather.us",0],["webfail.com",0],["weihnachten.me",0],["weihnachts-bilder.org",0],["weihnachts-filme.com",0],["welt.de",0],["weltfussball.at",0],["weristdeinfreund.de",0],["werkzeug-news.de",0],["werra-rundschau.de",0],["wetterauer-zeitung.de",0],["wiesbadener-kurier.de",0],["wiesbadener-tagblatt.de",0],["winboard.org",0],["windows-7-forum.net",0],["winfuture.de",0],["wintotal.de",0],["wlz-online.de",0],["wn.de",0],["wohngeld.org",0],["wolfenbuetteler-zeitung.de",0],["wolfsburger-nachrichten.de",0],["woman.at",0],["womenshealth.de",0],["wormser-zeitung.de",0],["woxikon.de",0],["wp.de",0],["wr.de",0],["yachtrevue.at",0],["ze.tt",0],["zeit.de",0],["meineorte.com",1],["osthessen-news.de",1],["techadvisor.com",1],["teltarif.de",4],["economictimes.indiatimes.com",5],["m.timesofindia.com",6],["timesofindia.indiatimes.com",6],["youmath.it",6],["redensarten-index.de",6],["lesoir.be",6],["electriciansforums.net",6],["keralatelecom.info",6],["universegunz.net",6],["happypenguin.altervista.org",6],["everyeye.it",6],["bluedrake42.com",6],["streamservicehd.click",6],["supermarioemulator.com",6],["futbollibrehd.com",6],["newsrade.com",6],["eska.pl",6],["eskarock.pl",6],["voxfm.pl",6],["mathaeser.de",6],["freethesaurus.com",8],["thefreedictionary.com",8],["hdbox.ws",10],["todopolicia.com",10],["scat.gold",10],["freecoursesite.com",10],["windowcleaningforums.co.uk",10],["cruisingearth.com",10],["hobby-machinist.com",10],["freegogpcgames.com",10],["latitude.to",10],["kitchennovel.com",10],["w3layouts.com",10],["blog.receivefreesms.co.uk",10],["eductin.com",10],["dealsfinders.blog",10],["audiobooks4soul.com",10],["tinhocdongthap.com",10],["sakarnewz.com",10],["downloadr.in",10],["topcomicporno.com",10],["dongknows.com",10],["traderepublic.community",10],["celtadigital.com",10],["iptvrun.com",10],["adsup.lk",10],["cryptomonitor.in",10],["areatopik.com",10],["cardscanner.co",10],["nullforums.net",10],["courseclub.me",10],["tamarindoyam.com",10],["choiceofmods.com",10],["myqqjd.com",10],["ssdtop.com",10],["apkhex.com",10],["gezegenforum.com",10],["mbc2.live",10],["iptvapps.net",10],["null-scripts.net",10],["nullscripts.net",10],["bloground.ro",10],["witcherhour.com",10],["ottverse.com",10],["torrentmac.net",10],["mazakony.com",10],["laptechinfo.com",10],["mc-at.org",10],["playstationhaber.com",10],["mangapt.com",10],["seriesperu.com",10],["pesprofessionals.com",10],["wpsimplehacks.com",10],["sportshub.to",[10,262]],["topsporter.net",[10,262]],["darkwanderer.net",10],["truckingboards.com",10],["coldfrm.org",10],["azrom.net",10],["freepatternsarea.com",10],["alttyab.net",10],["hq-links.com",10],["mobilkulup.com",10],["esopress.com",10],["rttar.com",10],["nesiaku.my.id",10],["jipinsoft.com",10],["surfsees.com",10],["truthnews.de",10],["farsinama.com",10],["worldofiptv.com",10],["vuinsider.com",10],["crazydl.net",10],["gamemodsbase.com",10],["babiato.tech",10],["secuhex.com",10],["turkishaudiocenter.com",10],["galaxyos.net",10],["blackhatworld.com",10],["bizdustry.com",10],["storefront.com.ng",10],["pkbiosfix.com",10],["casi3.xyz",10],["geektime.co.il",11],["bild.de",12],["mediafire.com",13],["wcoanimedub.tv",14],["wcoforever.net",14],["openspeedtest.com",14],["addtobucketlist.com",14],["3dzip.org",[14,88]],["ilmeteo.it",14],["wcoforever.com",14],["comprovendolibri.it",14],["healthelia.com",14],["keephealth.info",15],["australianfrequentflyer.com.au",16],["afreesms.com",17],["kinoger.re",17],["laksa19.github.io",17],["javcl.com",17],["upvideo.to",17],["tvlogy.to",17],["live.dragaoconnect.net",17],["beststremo.com",17],["seznam.cz",17],["seznamzpravy.cz",17],["xerifetech.com",17],["wallpapershome.com",19],["ville-ideale.fr",20],["calciomercato.it",21],["calciomercato.com",22],["bersamatekno.com",22],["hotpornfile.org",22],["robloxscripts.com",22],["coolsoft.altervista.org",22],["worldcupfootball.me",[22,27]],["hackedonlinegames.com",22],["jkoding.xyz",22],["settlersonlinemaps.com",22],["1cloudfile.com",22],["magdownload.org",22],["kpkuang.org",22],["shareus.site",22],["crypto4yu.com",22],["faucetwork.space",22],["thenightwithoutthedawn.blogspot.com",22],["entutes.com",22],["claimlite.club",22],["bazadecrypto.com",[22,308]],["whosampled.com",23],["imgkings.com",24],["pornvideotop.com",24],["krotkoosporcie.pl",24],["anghami.com",25],["wired.com",26],["tutele.sx",27],["footyhunter3.xyz",27],["magesypro.pro",[28,29]],["audiotools.pro",29],["magesy.blog",29],["audioztools.com",[29,30]],["altblogger.net",30],["hl-live.de",30],["satoshi-win.xyz",30],["encurtandourl.com",[30,152]],["freedeepweb.blogspot.com",30],["freesoft.id",30],["zcteam.id",30],["www-daftarharga.blogspot.com",30],["ear-phone-review.com",30],["telefullenvivo.com",30],["listatv.pl",30],["ltc-faucet.xyz",30],["coin-profits.xyz",30],["relampagomovies.com",30],["katestube.com",31],["short.pe",31],["footystreams.net",31],["seattletimes.com",32],["yiv.com",33],["globalrph.com",34],["e-glossa.it",35],["java-forum.org",36],["comunidadgzone.es",36],["mp3fy.com",36],["lebensmittelpraxis.de",36],["ebookdz.com",36],["forum-pokemon-go.fr",36],["praxis-jugendarbeit.de",36],["gdrivez.xyz",36],["dictionnaire-medical.net",36],["cle0desktop.blogspot.com",36],["up-load.io",36],["direct-link.net",36],["direkt-wissen.com",36],["keysbrasil.blogspot.com",36],["hotpress.info",36],["turkleech.com",36],["anibatch.me",36],["anime-i.com",36],["plex-guide.de",36],["healthtune.site",36],["gewinde-normen.de",36],["tucinehd.com",36],["freewebscript.com",37],["webcheats.com.br",38],["gala.fr",40],["gentside.com",40],["geo.fr",40],["hbrfrance.fr",40],["nationalgeographic.fr",40],["ohmymag.com",40],["serengo.net",40],["vsd.fr",40],["updato.com",[41,58]],["methbox.com",42],["daizurin.com",42],["pendekarsubs.us",42],["dreamfancy.org",42],["rysafe.blogspot.com",42],["techacode.com",42],["toppng.com",42],["th-world.com",42],["avjamack.com",42],["avjamak.net",42],["tickzoo.tv",43],["dlhd.sx",44],["embedstream.me",44],["yts-subs.net",44],["cnnamador.com",45],["nudecelebforum.com",46],["pronpic.org",47],["thewebflash.com",48],["discordfastfood.com",48],["xup.in",48],["popularmechanics.com",49],["op.gg",50],["lequipe.fr",51],["jellynote.com",52],["eporner.com",54],["pornbimbo.com",55],["allmonitors24.com",55],["4j.com",55],["avoiderrors.com",56],["cgtips.org",[56,208]],["sitarchive.com",56],["livenewsof.com",56],["topnewsshow.com",56],["gatcha.org",56],["empregoestagios.com",56],["everydayonsales.com",56],["kusonime.com",56],["aagmaal.xyz",56],["suicidepics.com",56],["codesnail.com",56],["codingshiksha.com",56],["graphicux.com",56],["hardcoregames.ca",56],["asyadrama.com",56],["bitcoinegypt.news",56],["citychilli.com",56],["talkjarvis.com",56],["hdmotori.it",57],["femdomtb.com",59],["camhub.cc",59],["bobs-tube.com",59],["ru-xvideos.me",59],["pornfd.com",59],["popno-tour.net",59],["molll.mobi",59],["watchmdh.to",59],["camwhores.tv",59],["elfqrin.com",60],["satcesc.com",61],["apfelpatient.de",61],["lusthero.com",62],["m2list.com",63],["embed.nana2play.com",63],["elahmad.com",63],["dofusports.xyz",63],["dallasnews.com",64],["lnk.news",65],["lnk.parts",65],["efukt.com",66],["wendycode.com",66],["springfieldspringfield.co.uk",67],["porndoe.com",68],["smsget.net",[69,70]],["kjanime.net",71],["gioialive.it",72],["classicreload.com",73],["chicoer.com",74],["bostonherald.com",74],["dailycamera.com",74],["gomiblog.com",75],["maxcheaters.com",76],["rbxoffers.com",76],["mhn.quest",76],["postimees.ee",76],["police.community",76],["gisarea.com",76],["schaken-mods.com",76],["theclashify.com",76],["newscon.org",76],["txori.com",76],["olarila.com",76],["deletedspeedstreams.blogspot.com",76],["schooltravelorganiser.com",76],["xhardhempus.net",76],["sportsplays.com",77],["deinesexfilme.com",79],["einfachtitten.com",79],["halloporno.com",79],["herzporno.com",79],["lesbenhd.com",79],["milffabrik.com",[79,238]],["porn-monkey.com",79],["porndrake.com",79],["pornhubdeutsch.net",79],["pornoaffe.com",79],["pornodavid.com",79],["pornoente.tv",[79,238]],["pornofisch.com",79],["pornofelix.com",79],["pornohammer.com",79],["pornohelm.com",79],["pornoklinge.com",79],["pornotom.com",[79,238]],["pornotommy.com",79],["pornovideos-hd.com",79],["pornozebra.com",[79,238]],["xhamsterdeutsch.xyz",79],["xnxx-sexfilme.com",79],["zerion.cc",79],["letribunaldunet.fr",80],["vladan.fr",80],["live-tv-channels.org",81],["eslfast.com",82],["freegamescasual.com",83],["tcpvpn.com",84],["oko.sh",84],["timesnownews.com",84],["timesnowhindi.com",84],["timesnowmarathi.com",84],["zoomtventertainment.com",84],["xxxuno.com",85],["sholah.net",86],["2rdroid.com",86],["bisceglielive.it",87],["pandajogosgratis.com.br",89],["5278.cc",90],["tonspion.de",92],["duplichecker.com",93],["plagiarismchecker.co",93],["plagiarismdetector.net",93],["searchenginereports.net",93],["smallseotools.com",93],["giallozafferano.it",94],["autojournal.fr",94],["autoplus.fr",94],["sportauto.fr",94],["linkspaid.com",95],["proxydocker.com",95],["beeimg.com",[96,97]],["emturbovid.com",97],["ftlauderdalebeachcam.com",98],["ftlauderdalewebcam.com",98],["juneauharborwebcam.com",98],["keywestharborwebcam.com",98],["kittycatcam.com",98],["mahobeachcam.com",98],["miamiairportcam.com",98],["morganhillwebcam.com",98],["njwildlifecam.com",98],["nyharborwebcam.com",98],["paradiseislandcam.com",98],["pompanobeachcam.com",98],["portbermudawebcam.com",98],["portcanaveralwebcam.com",98],["portevergladeswebcam.com",98],["portmiamiwebcam.com",98],["portnywebcam.com",98],["portnassauwebcam.com",98],["portstmaartenwebcam.com",98],["portstthomaswebcam.com",98],["porttampawebcam.com",98],["sxmislandcam.com",98],["gearingcommander.com",98],["themes-dl.com",98],["badassdownloader.com",98],["badasshardcore.com",98],["badassoftcore.com",98],["nulljungle.com",98],["teevee.asia",98],["otakukan.com",98],["linksht.com",100],["generate.plus",101],["calculate.plus",101],["avcesar.com",102],["audiotag.info",103],["tudigitale.it",104],["ibcomputing.com",105],["eodev.com",106],["legia.net",107],["acapellas4u.co.uk",108],["streamhentaimovies.com",109],["konten.co.id",110],["xiaomifans.pl",111],["eletronicabr.com",111],["optifine.net",112],["luzernerzeitung.ch",113],["tagblatt.ch",113],["spellcheck.net",114],["spellchecker.net",114],["spellweb.com",114],["ableitungsrechner.net",115],["alternet.org",116],["gourmetsupremacy.com",116],["imtranslator.net",117],["shrib.com",118],["pandafiles.com",119],["vidia.tv",[119,141]],["hortonanderfarom.blogspot.com",119],["clarifystraight.com",119],["tutelehd3.xyz",120],["mega4upload.com",120],["coolcast2.com",120],["techclips.net",120],["earthquakecensus.com",120],["footyhunter.lol",120],["gamerarcades.com",120],["poscitech.click",120],["starlive.stream",120],["utopianwilderness.com",120],["wecast.to",120],["sportbar.live",120],["lordchannel.com",120],["play-old-pc-games.com",121],["scrin.org",122],["tunovelaligera.com",123],["tapchipi.com",123],["cuitandokter.com",123],["tech-blogs.com",123],["cardiagn.com",123],["dcleakers.com",123],["esgeeks.com",123],["pugliain.net",123],["uplod.net",123],["worldfreeware.com",123],["fikiri.net",123],["myhackingworld.com",123],["phoenixfansub.com",123],["freecourseweb.com",124],["devcourseweb.com",124],["coursewikia.com",124],["courseboat.com",124],["coursehulu.com",124],["lne.es",128],["pornult.com",129],["webcamsdolls.com",129],["bitcotasks.com",129],["adsy.pw",129],["playstore.pw",129],["exactpay.online",129],["thothd.to",129],["proplanta.de",130],["hydrogenassociation.org",131],["ludigames.com",131],["sportitalialive.com",131],["tii.la",131],["made-by.org",131],["xenvn.com",131],["worldtravelling.com",131],["igirls.in",131],["technichero.com",131],["roshiyatech.my.id",131],["24sport.stream",131],["aeroxplorer.com",131],["mad4wheels.com",132],["logi.im",132],["emailnator.com",132],["textograto.com",133],["voyageforum.com",134],["hmc-id.blogspot.com",134],["jemerik.com",134],["myabandonware.com",134],["chatta.it",136],["ketubanjiwa.com",137],["nsfw247.to",138],["funzen.net",138],["fighter.stream",138],["ilclubdellericette.it",138],["hubstream.in",138],["extremereportbot.com",139],["getintopc.com",140],["qoshe.com",142],["lowellsun.com",143],["mamadu.pl",143],["dobrapogoda24.pl",143],["motohigh.pl",143],["namasce.pl",143],["ultimate-catch.eu",144],["cpopchanelofficial.com",145],["creditcardgenerator.com",146],["creditcardrush.com",146],["bostoncommons.net",146],["thejobsmovie.com",146],["livsavr.co",146],["nilopolisonline.com.br",147],["mesquitaonline.com",147],["yellowbridge.com",147],["socialgirls.im",148],["yaoiotaku.com",149],["camhub.world",150],["moneyhouse.ch",151],["ihow.info",152],["filesus.com",152],["sturls.com",152],["re.two.re",152],["turbo1.co",152],["cartoonsarea.xyz",152],["valeronevijao.com",153],["cigarlessarefy.com",153],["figeterpiazine.com",153],["yodelswartlike.com",153],["generatesnitrosate.com",153],["crownmakermacaronicism.com",153],["chromotypic.com",153],["gamoneinterrupted.com",153],["metagnathtuggers.com",153],["wolfdyslectic.com",153],["rationalityaloelike.com",153],["sizyreelingly.com",153],["simpulumlamerop.com",153],["urochsunloath.com",153],["monorhinouscassaba.com",153],["counterclockwisejacky.com",153],["35volitantplimsoles5.com",153],["scatch176duplicities.com",153],["antecoxalbobbing1010.com",153],["boonlessbestselling244.com",153],["cyamidpulverulence530.com",153],["guidon40hyporadius9.com",153],["449unceremoniousnasoseptal.com",153],["19turanosephantasia.com",153],["30sensualizeexpression.com",153],["321naturelikefurfuroid.com",153],["745mingiestblissfully.com",153],["availedsmallest.com",153],["greaseball6eventual20.com",153],["toxitabellaeatrebates306.com",153],["20demidistance9elongations.com",153],["audaciousdefaulthouse.com",153],["fittingcentermondaysunday.com",153],["fraudclatterflyingcar.com",153],["launchreliantcleaverriver.com",153],["matriculant401merited.com",153],["realfinanceblogcenter.com",153],["reputationsheriffkennethsand.com",153],["telyn610zoanthropy.com",153],["tubelessceliolymph.com",153],["tummulerviolableness.com",153],["un-block-voe.net",153],["v-o-e-unblock.com",153],["voe-un-block.com",153],["voeun-block.net",153],["voeunbl0ck.com",153],["voeunblck.com",153],["voeunblk.com",153],["voeunblock.com",153],["voeunblock1.com",153],["voeunblock2.com",153],["voeunblock3.com",153],["agefi.fr",154],["cariskuy.com",155],["letras2.com",155],["yusepjaelani.blogspot.com",156],["letras.mus.br",157],["cheatermad.com",158],["mtlurb.com",159],["port.hu",160],["acdriftingpro.com",160],["flight-report.com",160],["forumdz.com",160],["abandonmail.com",160],["flmods.com",160],["zilinak.sk",160],["projectfreetv.stream",160],["hotdesimms.com",160],["pdfaid.com",160],["mconverter.eu",160],["dzeko11.net",[160,262]],["mail.com",160],["expresskaszubski.pl",160],["moegirl.org.cn",160],["onemanhua.com",161],["t3n.de",162],["allindiaroundup.com",163],["vectorizer.io",164],["smgplaza.com",164],["ftuapps.dev",164],["onehack.us",164],["thapcam.net",164],["thefastlaneforum.com",165],["trade2win.com",166],["gmodleaks.com",166],["modagamers.com",167],["freemagazines.top",167],["straatosphere.com",167],["nullpk.com",167],["adslink.pw",167],["downloadudemy.com",167],["picgiraffe.com",167],["weadown.com",167],["freepornsex.net",167],["nurparatodos.com.ar",167],["librospreuniversitariospdf.blogspot.com",168],["msdos-games.com",168],["forexeen.us",168],["khsm.io",168],["girls-like.me",168],["webcreator-journal.com",168],["nu6i-bg-net.com",168],["routech.ro",169],["hokej.net",169],["turkmmo.com",170],["palermotoday.it",171],["baritoday.it",171],["trentotoday.it",171],["agrigentonotizie.it",171],["anconatoday.it",171],["arezzonotizie.it",171],["avellinotoday.it",171],["bresciatoday.it",171],["brindisireport.it",171],["casertanews.it",171],["cataniatoday.it",171],["cesenatoday.it",171],["chietitoday.it",171],["forlitoday.it",171],["frosinonetoday.it",171],["genovatoday.it",171],["ilpescara.it",171],["ilpiacenza.it",171],["latinatoday.it",171],["lecceprima.it",171],["leccotoday.it",171],["livornotoday.it",171],["messinatoday.it",171],["milanotoday.it",171],["modenatoday.it",171],["monzatoday.it",171],["novaratoday.it",171],["padovaoggi.it",171],["parmatoday.it",171],["perugiatoday.it",171],["pisatoday.it",171],["quicomo.it",171],["ravennatoday.it",171],["reggiotoday.it",171],["riminitoday.it",171],["romatoday.it",171],["salernotoday.it",171],["sondriotoday.it",171],["sportpiacenza.it",171],["ternitoday.it",171],["today.it",171],["torinotoday.it",171],["trevisotoday.it",171],["triesteprima.it",171],["udinetoday.it",171],["veneziatoday.it",171],["vicenzatoday.it",171],["thumpertalk.com",172],["arkcod.org",172],["facciabuco.com",173],["softx64.com",174],["thelayoff.com",175],["shorterall.com",175],["blog24.me",175],["maxstream.video",175],["maxlinks.online",175],["tvepg.eu",175],["pstream.net",176],["libreriamo.it",177],["medebooks.xyz",177],["tutorials-technology.info",177],["mashtips.com",177],["marriedgames.com.br",177],["4allprograms.me",177],["nurgsm.com",177],["certbyte.com",177],["plugincrack.com",177],["gamingdeputy.com",177],["freewebcart.com",177],["dailymaverick.co.za",178],["apps2app.com",179],["fm-arena.com",180],["enit.in",181],["financerites.com",181],["fadedfeet.com",182],["homeculina.com",182],["ineedskin.com",182],["kenzo-flowertag.com",182],["lawyex.co",182],["mdn.lol",182],["my-code4you.blogspot.com",183],["leakgaming.fr",184],["vrcmods.com",185],["osuskinner.com",185],["osuskins.net",185],["pentruea.com",[186,187]],["mchacks.net",188],["why-tech.it",189],["compsmag.com",190],["tapetus.pl",191],["gaystream.online",192],["embedv.net",192],["fslinks.org",192],["v6embed.xyz",192],["vgplayer.xyz",192],["vid-guard.com",192],["autoroad.cz",193],["brawlhalla.fr",193],["tecnobillo.com",193],["sexcamfreeporn.com",194],["breatheheavy.com",195],["wenxuecity.com",196],["key-hub.eu",197],["fabioambrosi.it",198],["tattle.life",199],["emuenzen.de",199],["terrylove.com",199],["mynet.com",200],["cidade.iol.pt",201],["fantacalcio.it",202],["hentaifreak.org",203],["hypebeast.com",204],["krankheiten-simulieren.de",205],["catholic.com",206],["3dmodelshare.org",207],["gourmetscans.net",208],["techinferno.com",209],["phuongtrinhhoahoc.com",210],["ibeconomist.com",211],["bookriot.com",212],["purposegames.com",213],["schoolcheats.net",213],["globo.com",214],["latimes.com",214],["claimrbx.gg",215],["perelki.net",216],["vpn-anbieter-vergleich-test.de",217],["livingincebuforums.com",218],["paperzonevn.com",219],["alltechnerd.com",220],["malaysianwireless.com",221],["erinsakura.com",222],["infofuge.com",222],["freejav.guru",222],["novelmultiverse.com",222],["fritidsmarkedet.dk",223],["maskinbladet.dk",223],["15min.lt",224],["lewdninja.com",225],["lewd.ninja",225],["baddiehub.com",226],["mr9soft.com",227],["21porno.com",228],["adult-sex-gamess.com",229],["hentaigames.app",229],["mobilesexgamesx.com",229],["mysexgamer.com",229],["porngameshd.com",229],["sexgamescc.com",229],["xnxx-sex-videos.com",229],["f2movies.to",230],["freeporncave.com",231],["tubsxxx.com",232],["pornojenny.com",233],["subtitle.one",234],["sextvx.com",235],["studydhaba.com",236],["freecourse.tech",236],["victor-mochere.com",236],["papunika.com",236],["mobilanyheter.net",236],["prajwaldesai.com",236],["muztext.com",237],["pornohans.com",238],["nursexfilme.com",238],["pornohirsch.net",238],["xhamster-sexvideos.com",238],["pornoschlange.com",238],["hdpornos.net",238],["gutesexfilme.com",238],["short1.site",238],["zona-leros.com",238],["charbelnemnom.com",239],["online-fix.me",240],["gamersdiscussionhub.com",241],["owlzo.com",242],["q1003.com",243],["blogpascher.com",244],["testserver.pro",245],["lifestyle.bg",245],["money.bg",245],["news.bg",245],["topsport.bg",245],["webcafe.bg",245],["mgnet.xyz",246],["advertiserandtimes.co.uk",247],["xvideos2020.me",248],["111.90.159.132",249],["techsolveprac.com",250],["joomlabeginner.com",251],["largescaleforums.com",252],["dubznetwork.com",253],["mundodonghua.com",253],["hentaidexy.com",254],["oceanplay.org",255],["code2care.org",256],["xxxxsx.com",258],["ngontinh24.com",259],["panel.freemcserver.net",260],["idevicecentral.com",261],["zona11.com",262],["scsport.live",262],["mangacrab.com",264],["idnes.cz",265],["viefaucet.com",266],["cloud-computing-central.com",267],["afk.guide",268],["businessnamegenerator.com",269],["derstandard.at",270],["derstandard.de",270],["rocketnews24.com",271],["soranews24.com",271],["youpouch.com",271],["ilsole24ore.com",272],["hentaiporn.one",273],["infokik.com",274],["daemonanime.net",275],["daemon-hentai.com",275],["deezer.com",276],["fosslinux.com",277],["shrdsk.me",278],["examword.com",279],["sempreupdate.com.br",279],["tribuna.com",280],["trendsderzukunft.de",281],["gal-dem.com",281],["lostineu.eu",281],["oggitreviso.it",281],["speisekarte.de",281],["mixed.de",281],["lightnovelspot.com",[282,283]],["lightnovelworld.com",[282,283]],["novelpub.com",[282,283]],["webnovelpub.com",[282,283]],["mail.yahoo.com",284],["hwzone.co.il",285],["nammakalvi.com",286],["javmoon.me",287],["c2g.at",288],["terafly.me",288],["dktechnicalmate.com",289],["recipahi.com",289],["converter-btc.world",289],["kaystls.site",290],["aquarius-horoscopes.com",291],["cancer-horoscopes.com",291],["dubipc.blogspot.com",291],["echoes.gr",291],["engel-horoskop.de",291],["freegames44.com",291],["fuerzasarmadas.eu",291],["gemini-horoscopes.com",291],["jurukunci.net",291],["krebs-horoskop.com",291],["leo-horoscopes.com",291],["maliekrani.com",291],["nklinks.click",291],["ourenseando.es",291],["pisces-horoscopes.com",291],["radio-en-direct.fr",291],["sagittarius-horoscopes.com",291],["scorpio-horoscopes.com",291],["singlehoroskop-loewe.de",291],["skat-karten.de",291],["skorpion-horoskop.com",291],["taurus-horoscopes.com",291],["the1security.com",291],["torrentmovies.online",291],["virgo-horoscopes.com",291],["zonamarela.blogspot.com",291],["yoima.hatenadiary.com",291],["vpntester.org",292],["watchhentai.net",293],["japscan.lol",294],["digitask.ru",295],["tempumail.com",296],["sexvideos.host",297],["10alert.com",299],["cryptstream.de",300],["nydus.org",300],["techhelpbd.com",301],["fapdrop.com",302],["cellmapper.net",303],["hdrez.com",304],["youwatch-serie.com",304],["freebnbcoin.com",305],["printablecreative.com",306],["comohoy.com",307],["leak.sx",307],["pornleaks.in",307],["merlininkazani.com",307],["faindx.com",309],["j91.asia",310],["jeniusplay.com",311],["indianyug.com",312],["rgb.vn",312],["needrom.com",313],["criptologico.com",314],["megadrive-emulator.com",315],["eromanga-show.com",316],["hentai-one.com",316],["hentaipaw.com",316],["10minuteemails.com",317],["luxusmail.org",317],["w3cub.com",318],["bangpremier.com",319],["nyaa.iss.ink",320],["tnp98.xyz",322],["scripai.com",323],["myfxbook.com",323],["whatfontis.com",323],["freepdfcomic.com",324],["memedroid.com",325],["animesync.org",326],["karaoketexty.cz",327],["resortcams.com",328],["mjakmama24.pl",330],["security-demo.extrahop.com",331],["perchance.org",332]]);

const entitiesMap = new Map([["comunio",0],["finanzen",[0,7]],["gameswelt",0],["heftig",0],["notebookcheck",0],["testedich",0],["transfermarkt",0],["truckscout24",0],["tvtv",0],["wetteronline",0],["wieistmeineip",0],["wetter",2],["1337x",6],["eztv",6],["sushi-scan",10],["spigotunlocked",10],["ahmedmode",10],["kissasian",15],["rp5",17],["mma-core",18],["writedroid",22],["yts",27],["720pstream",27],["1stream",27],["magesy",28],["thefmovies",31],["fxporn69",36],["aliancapes",36],["urlcero",39],["totaldebrid",42],["sandrives",42],["oploverz",43],["pouvideo",53],["povvideo",53],["povw1deo",53],["povwideo",53],["powv1deo",53],["powvibeo",53],["powvideo",53],["powvldeo",53],["tubsexer",59],["porno-tour",59],["lenkino",59],["pornomoll",59],["camsclips",59],["m4ufree",63],["crackstreams",63],["telerium",78],["pandafreegames",91],["thoptv",99],["brainly",106],["streameast",120],["thestreameast",120],["daddylivehd",120],["solvetube",125],["hdfilme",126],["pornhub",127],["wcofun",134],["bollyholic",138],["gotxx",152],["turkanime",153],["voe-unblock",153],["khatrimaza",167],["pogolinks",167],["popcornstream",169],["shortzzy",177],["vembed",192],["xhamsterdeutsch",238],["privatemoviez",241],["gmx",257],["lightnovelpub",[282,283]],["camcaps",298],["drivebot",321],["thenextplanet1",322],["autoscout24",329]]);

const exceptionsMap = new Map([]);

/******************************************************************************/

function noSetTimeoutIf(
    needle = '',
    delay = ''
) {
    if ( typeof needle !== 'string' ) { return; }
    const safe = safeSelf();
    const needleNot = needle.charAt(0) === '!';
    if ( needleNot ) { needle = needle.slice(1); }
    if ( delay === '' ) { delay = undefined; }
    let delayNot = false;
    if ( delay !== undefined ) {
        delayNot = delay.charAt(0) === '!';
        if ( delayNot ) { delay = delay.slice(1); }
        delay = parseInt(delay, 10);
    }
    const log = needleNot === false && needle === '' && delay === undefined
        ? console.log
        : undefined;
    const reNeedle = safe.patternToRegex(needle);
    self.setTimeout = new Proxy(self.setTimeout, {
        apply: function(target, thisArg, args) {
            const a = args[0] instanceof Function
                ? String(safe.Function_toString(args[0]))
                : String(args[0]);
            const b = args[1];
            if ( log !== undefined ) {
                log('uBO: setTimeout("%s", %s)', a, b);
            } else {
                let defuse;
                if ( needle !== '' ) {
                    defuse = reNeedle.test(a) !== needleNot;
                }
                if ( defuse !== false && delay !== undefined ) {
                    defuse = (b === delay || isNaN(b) && isNaN(delay) ) !== delayNot;
                }
                if ( defuse ) {
                    args[0] = function(){};
                }
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
    if ( scriptletGlobals.has('safeSelf') ) {
        return scriptletGlobals.get('safeSelf');
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
        uboLog(...args) {
            if ( scriptletGlobals.has('canDebug') === false ) { return; }
            if ( args.length === 0 ) { return; }
            if ( `${args[0]}` === '' ) { return; }
            this.log('[uBO]', ...args);
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
