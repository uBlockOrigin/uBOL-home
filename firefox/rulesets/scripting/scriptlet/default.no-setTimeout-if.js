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

const argsList = [[".call(null)","10"],[".call(null)"],["(null)","10"],["userHasAdblocker"],["null)","10"],["objSubPromo"],["adb"],["nrWrapper"],["warn"],["adBlockerDetected"],["show"],["adObjects"],["offsetParent"],["InfMediafireMobileFunc","1000"],["google_jobrunner"],["()","45000"],["prompt"],["0x"],["displayAdBlockedVideo"],[".adsbygoogle"],["contrformpub","5000"],["disabledAdBlock","10000"],["_0x"],["ads.length"],["location.href"],["isDesktopApp","1000"],["Bait"],["admc"],["AdBlocker"],["Blocked"],["nextFunction"],["'0x"],["apstagLOADED"],["/Adb|moneyDetect/"],["disableDeveloper"],["Blocco","2000"],["nextFunction","2000"],["documentElement.classList.add","400"],["test","0"],["checkAdblockUser","1000"],["checkPub","6000"],["document.querySelector","5000"],["nextFunction","250"],["popup"],["()","150"],["backRedirect"],["document.querySelectorAll","1000"],["style"],["clientHeight"],["addEventListener","0"],["adblock","2000"],["start","0"],["byepopup","5000"],["test.remove","100"],["additional_src","300"],["()","2000"],["css_class.show"],["CANG","3000"],["updato-overlay","500"],["innerText","2000"],["alert","8000"],["css_class"],["()","50"],["debugger"],["initializeCourier","3000"],["redirectPage"],["_0x","2000"],["ads","750"],["location.href","500"],["Adblock","5000"],["disable","200"],["CekAab","0"],["rbm_block_active","1000"],["show()"],["n.trigger","1"],["instance.check","1"],["adblock"],["abDetected"],["KeepOpeningPops","1000"],["appendChild"],["adb","0"],["adBlocked"],["warning","100"],["adblock_popup","500"],["Adblock"],["#chatWrap","1000"],["keep-ads","2000"],["#rbm_block_active","1000"],["null","4000"],["()","2500"],["myaabpfun","3000"],["adFilled","2500"],["()","15000"],["showPopup"],["()","1"],["()","1000"],["document.cookie","2500"],["window.open"],["innerHTML"],["readyplayer","2000"],["/text()|0x/"],["checkStopBlock"],["adspot_top","1500"],["/offsetHeight|google|Global/"],["an_message","500"],["Adblocker","10000"],["trigger","0"],["timeoutChecker"],["bait","1"],["pum-open"],["overlay","2000"],["/adblock/i"],["test","100"],["Math.round","1000"],["adblock","5"],["bioEp"],["ag_adBlockerDetected"],["null"],["adsbox","1000"],["adb","6000"],["pop"],["sadbl"],["checkAdStatus"],["()","0"],["mdp"],["brave_load_popup"],["0x","3000"],["invoke"],["adsbytrafficjunkycontext"],["ipod"],["offsetWidth"],["/$|adBlock/"],["ads"],["adsbygoogle"],["()"],["AdBlock"],["stop-scrolling"],["Adv"],["blockUI","2000"],["mdpDeBlocker"],["/_0x|debug/"],["/ai_adb|_0x/"],["iframe"],["adBlock"],["","1"],["undefined"],["check","1"],["adsBlocked"],["blocker"],["aswift_"],["afs_ads","2000"],["visibility","2000"],["bait"],["getComputedStyle","250"],["blocked"],["{r()","0"],["nextFunction","450"],["Debug"],["r()","0"],["offset"],["purple_box"],["offsetHeight"],["checkSiteNormalLoad"],["adBlockOverlay"],["Detected","500"],["modal"],[".show","1000"],[".show"],["showModal"],["getComputedStyle"],["blur"],["samOverlay"],["bADBlock"],["location"],["","4000"],["blocker","100"],["alert"],["length"],["ai_adb"],["t()","0"],["$"],["getComputedStyle","2000"],["","5"],["/adblock|isRequestPresent/"],["_0x","500"],["offsetLeft"],[".show()","1000"],["height"],["mdp_deblocker"],["charAt"],["checkAds"],["fadeIn","0"],["jQuery"],["/^/"],["afterOpen"],["check"],["Adblocker"],["eabdModal"],["ab_root.show"],["gaData"],["ad"],["prompt","1000"],["googlefc"],["adblock detection"],[".offsetHeight","100"],["popState"],["ad-block-popup"],["exitTimer"],["innerHTML.replace"],["data?","4000"],[".data?"],["eabpDialog"],[".length","2000"],["adsense"],["/Adblock|_ad_/"],["googletag"],["f.parentNode.removeChild(f)","100"],["swal","500"],["keepChecking","1000"],["openPopup"],[".offsetHeight"],["()=>{"],["nitroAds"],["class.scroll","1000"],["disableDeveloperTools"],["Check"],["insertBefore"],["setAntiAb"],["css_class.scroll"],["/null|Error/","10000"],["window.location.href","50"],["/out.php"],["/0x|devtools/"],["location.replace","300"],["window.location.href"],["checkVisible"],["_0x","3000"],["fetch"],["window.location.href=link"],["ai_"],["reachGoal"],["Adb"],["ai"],["/width|innerHTML/"],["magnificPopup"],["adblockEnabled"],["google_ad"],["document.location"],["google"],["top-right","2000"],["enforceAdStatus"],["loadScripts"],["mfp"],["display","5000"],["eb"],[").show()"],["","1000"],["atob"],["devtool"],["Msg"],["UABP"],["href"],["aaaaa-modal"],["\\x","5000"],["()=>"],["keepChecking"],["null","10"],["","500"],["/Adform|didomi|adblock|forEach/"],["showAdblock"],["-0x"],["display"],["gclid"],["event","3000"],["rejectWith"],["refresh"],["window.location"],["ga"],["adbl"],["Ads"],["ShowAdBLockerNotice"],["ad_listener"],["open"],["(!0)"],["Delay"],["/appendChild|e\\(\"/"],["=>"],["ADB"],["site-access-popup"],["data?"],["/debugger|UserCustomPop/"],["checkAdblockUser"],["offsetHeight","100"],["AdDetect"],["displayMessage","2000"],["/salesPopup|mira-snackbar/"],["advanced"],["detectImgLoad"],["offsetHeight","200"],["detector"],["replace"],["touchstart"],["siteAccessFlag"],["ab"],["/adblocker|alert/"],["redURL"],["/children\\('ins'\\)|Adblock|adsbygoogle/"],["displayMessage"],["chkADB"],["onDetected"],["myinfoey","1500"],["placebo"],["fuckadb"],["detect"],["siteAccessPopup"],["/adsbygoogle|adblock/"],["akadb"],["biteDisplay"],["/[a-z]\\(!0\\)/","800"],["ad_block"],["/detectAdBlocker|window.open/"],["adBlockDetected"],["popUnder"],["/GoToURL|delay/"],["window.location.href","300"],["ad_display"],["/adScriptPath|MMDConfig/"],["0x","100"],["/native|\\{n\\(\\)/"],["adblocker"],["/Detect|adblock|style\\.display|\\[native code]|\\.call\\(null\\)/"],["removeChild"],["ad blocker"]];

const hostnamesMap = new Map([["4-liga.com",0],["4fansites.de",0],["4players.de",0],["9monate.de",0],["aachener-nachrichten.de",0],["aachener-zeitung.de",0],["abendblatt.de",0],["abendzeitung-muenchen.de",0],["about-drinks.com",0],["abseits-ka.de",0],["airliners.de",0],["ajaxshowtime.com",0],["allgemeine-zeitung.de",0],["antenne.de",0],["arcor.de",0],["areadvd.de",0],["areamobile.de",0],["ariva.de",0],["astronews.com",0],["aussenwirtschaftslupe.de",0],["auszeit.bio",0],["auto-motor-und-sport.de",0],["auto-service.de",0],["autobild.de",0],["autoextrem.de",0],["autopixx.de",0],["autorevue.at",0],["az-online.de",0],["baby-vornamen.de",0],["babyclub.de",0],["bafoeg-aktuell.de",0],["berliner-kurier.de",0],["berliner-zeitung.de",0],["bigfm.de",0],["bikerszene.de",0],["bildderfrau.de",0],["blackd.de",0],["blick.de",0],["boerse-online.de",0],["boerse.de",0],["boersennews.de",0],["braunschweiger-zeitung.de",0],["brieffreunde.de",0],["brigitte.de",0],["buerstaedter-zeitung.de",0],["buffed.de",0],["businessinsider.de",0],["buzzfeed.at",0],["buzzfeed.de",0],["caravaning.de",0],["cavallo.de",0],["chefkoch.de",0],["cinema.de",0],["clever-tanken.de",0],["computerbild.de",0],["computerhilfen.de",0],["comunio-cl.com",0],["connect.de",0],["da-imnetz.de",0],["dasgelbeblatt.de",0],["dbna.com",0],["dbna.de",0],["deichstube.de",0],["deine-tierwelt.de",0],["der-betze-brennt.de",0],["derwesten.de",0],["desired.de",0],["dhd24.com",0],["dieblaue24.com",0],["digitalfernsehen.de",0],["dnn.de",0],["donnerwetter.de",0],["e-hausaufgaben.de",0],["e-mountainbike.com",0],["eatsmarter.de",0],["echo-online.de",0],["ecomento.de",0],["einfachschoen.me",0],["elektrobike-online.com",0],["eltern.de",0],["epochtimes.de",0],["essen-und-trinken.de",0],["express.de",0],["extratipp.com",0],["familie.de",0],["fanfiktion.de",0],["fehmarn24.de",0],["fettspielen.de",0],["fid-gesundheitswissen.de",0],["finanznachrichten.de",0],["finanztreff.de",0],["finya.de",0],["firmenwissen.de",0],["fitforfun.de",0],["fnp.de",0],["focus.de",0],["football365.fr",0],["formel1.de",0],["fr.de",0],["frankfurter-wochenblatt.de",0],["freenet.de",0],["fremdwort.de",0],["froheweihnachten.info",0],["frustfrei-lernen.de",0],["fuldaerzeitung.de",0],["funandnews.de",0],["fussballdaten.de",0],["futurezone.de",0],["gala.de",0],["gamepro.de",0],["gamersglobal.de",0],["gamesaktuell.de",0],["gamestar.de",0],["gamezone.de",0],["gartendialog.de",0],["gartenlexikon.de",0],["gedichte.ws",0],["geissblog.koeln",0],["gelnhaeuser-tageblatt.de",0],["general-anzeiger-bonn.de",0],["geniale-tricks.com",0],["genialetricks.de",0],["gesund-vital.de",0],["gesundheit.de",0],["gevestor.de",0],["gewinnspiele.tv",0],["giessener-allgemeine.de",0],["giessener-anzeiger.de",0],["gifhorner-rundschau.de",0],["giga.de",0],["gipfelbuch.ch",0],["gmuender-tagespost.de",0],["golem.de",[0,9,10]],["gruenderlexikon.de",0],["gusto.at",0],["gut-erklaert.de",0],["gutfuerdich.co",0],["hallo-muenchen.de",0],["hamburg.de",0],["hanauer.de",0],["hardwareluxx.de",0],["hartziv.org",0],["harzkurier.de",0],["haus-garten-test.de",0],["hausgarten.net",0],["haustec.de",0],["haz.de",0],["heidelberg24.de",0],["heilpraxisnet.de",0],["heise.de",0],["helmstedter-nachrichten.de",0],["hersfelder-zeitung.de",0],["hftg.co",0],["hifi-forum.de",0],["hna.de",0],["hochheimer-zeitung.de",0],["hoerzu.de",0],["hofheimer-zeitung.de",0],["iban-rechner.de",0],["ikz-online.de",0],["immobilienscout24.de",0],["ingame.de",0],["inside-digital.de",0],["inside-handy.de",0],["investor-verlag.de",0],["jappy.com",0],["jpgames.de",0],["kabeleins.de",0],["kachelmannwetter.com",0],["kamelle.de",0],["kicker.de",0],["kindergeld.org",0],["klettern-magazin.de",0],["klettern.de",0],["kochbar.de",0],["kreis-anzeiger.de",0],["kreisbote.de",0],["kreiszeitung.de",0],["ksta.de",0],["kurierverlag.de",0],["lachainemeteo.com",0],["lampertheimer-zeitung.de",0],["landwirt.com",0],["laut.de",0],["lauterbacher-anzeiger.de",0],["leckerschmecker.me",0],["leinetal24.de",0],["lesfoodies.com",0],["levif.be",0],["lifeline.de",0],["liga3-online.de",0],["likemag.com",0],["linux-community.de",0],["linux-magazin.de",0],["live.vodafone.de",0],["ln-online.de",0],["lokalo24.de",0],["lustaufsleben.at",0],["lustich.de",0],["lvz.de",0],["lz.de",0],["macwelt.de",0],["macworld.co.uk",0],["mail.de",0],["main-spitze.de",0],["manager-magazin.de",0],["manga-tube.me",0],["mathebibel.de",0],["mathepower.com",0],["maz-online.de",0],["medisite.fr",0],["mehr-tanken.de",0],["mein-kummerkasten.de",0],["mein-mmo.de",0],["mein-wahres-ich.de",0],["meine-anzeigenzeitung.de",0],["meinestadt.de",0],["menshealth.de",0],["mercato365.com",0],["merkur.de",0],["messen.de",0],["metal-hammer.de",0],["metalflirt.de",0],["meteologix.com",0],["minecraft-serverlist.net",0],["mittelbayerische.de",0],["modhoster.de",0],["moin.de",0],["mopo.de",0],["morgenpost.de",0],["motor-talk.de",0],["motorbasar.de",0],["motorradonline.de",0],["motorsport-total.com",0],["motortests.de",0],["mountainbike-magazin.de",0],["moviejones.de",0],["moviepilot.de",0],["mt.de",0],["mtb-news.de",0],["musiker-board.de",0],["musikexpress.de",0],["musikradar.de",0],["mz-web.de",0],["n-tv.de",0],["naumburger-tageblatt.de",0],["netzwelt.de",0],["neuepresse.de",0],["neueroeffnung.info",0],["news.at",0],["news.de",0],["news38.de",0],["newsbreak24.de",0],["nickles.de",0],["nicknight.de",0],["nl.hardware.info",0],["nn.de",0],["nnn.de",0],["nordbayern.de",0],["notebookchat.com",0],["notebookcheck-ru.com",0],["notebookcheck-tr.com",0],["noz-cdn.de",0],["noz.de",0],["nrz.de",0],["nw.de",0],["nwzonline.de",0],["oberhessische-zeitung.de",0],["oeffentlicher-dienst.info",0],["onlinekosten.de",0],["onvista.de",0],["op-marburg.de",0],["op-online.de",0],["outdoor-magazin.com",0],["outdoorchannel.de",0],["paradisi.de",0],["pc-magazin.de",0],["pcgames.de",0],["pcgameshardware.de",0],["pcwelt.de",0],["pcworld.es",0],["peiner-nachrichten.de",0],["pferde.de",0],["pietsmiet.de",0],["pixelio.de",0],["pkw-forum.de",0],["playboy.de",0],["playfront.de",0],["pnn.de",0],["pons.com",0],["prad.de",[0,136]],["prignitzer.de",0],["profil.at",0],["promipool.de",0],["promobil.de",0],["prosiebenmaxx.de",0],["psychic.de",[0,161]],["quoka.de",0],["radio.at",0],["radio.de",0],["radio.dk",0],["radio.es",0],["radio.fr",0],["radio.it",0],["radio.net",0],["radio.pl",0],["radio.pt",0],["radio.se",0],["ran.de",0],["readmore.de",0],["rechtslupe.de",0],["recording.de",0],["rennrad-news.de",0],["reuters.com",0],["reviersport.de",0],["rhein-main-presse.de",0],["rheinische-anzeigenblaetter.de",0],["rimondo.com",0],["roadbike.de",0],["roemische-zahlen.net",0],["rollingstone.de",0],["rot-blau.com",0],["rp-online.de",0],["rtl.de",[0,266]],["rtv.de",0],["rugby365.fr",0],["ruhr24.de",0],["rundschau-online.de",0],["runnersworld.de",0],["safelist.eu",0],["salzgitter-zeitung.de",0],["sat1.de",0],["sat1gold.de",0],["schoener-wohnen.de",0],["schwaebische-post.de",0],["schwarzwaelder-bote.de",0],["serienjunkies.de",0],["shz.de",0],["sixx.de",0],["skodacommunity.de",0],["smart-wohnen.net",0],["sn.at",0],["sozialversicherung-kompetent.de",0],["spiegel.de",0],["spielen.de",0],["spieletipps.de",0],["spielfilm.de",0],["sport.de",0],["sport365.fr",0],["sportal.de",0],["spox.com",0],["stern.de",0],["stuttgarter-nachrichten.de",0],["stuttgarter-zeitung.de",0],["sueddeutsche.de",0],["svz.de",0],["szene1.at",0],["szene38.de",0],["t-online.de",0],["tagesspiegel.de",0],["taschenhirn.de",0],["techadvisor.co.uk",0],["techstage.de",0],["tele5.de",0],["the-voice-of-germany.de",0],["thueringen24.de",0],["tichyseinblick.de",0],["tierfreund.co",0],["tiervermittlung.de",0],["torgranate.de",0],["trend.at",0],["tv-media.at",0],["tvdigital.de",0],["tvinfo.de",0],["tvspielfilm.de",0],["tvtoday.de",0],["tz.de",0],["unicum.de",0],["unnuetzes.com",0],["unsere-helden.com",0],["unterhalt.net",0],["usinger-anzeiger.de",0],["usp-forum.de",0],["videogameszone.de",0],["vienna.at",0],["vip.de",0],["virtualnights.com",0],["vox.de",0],["wa.de",0],["wallstreet-online.de",[0,3]],["waz.de",0],["weather.us",0],["webfail.com",0],["weihnachten.me",0],["weihnachts-bilder.org",0],["weihnachts-filme.com",0],["welt.de",0],["weltfussball.at",0],["weristdeinfreund.de",0],["werkzeug-news.de",0],["werra-rundschau.de",0],["wetterauer-zeitung.de",0],["wiesbadener-kurier.de",0],["wiesbadener-tagblatt.de",0],["winboard.org",0],["windows-7-forum.net",0],["winfuture.de",0],["wintotal.de",0],["wlz-online.de",0],["wn.de",0],["wohngeld.org",0],["wolfenbuetteler-zeitung.de",0],["wolfsburger-nachrichten.de",0],["woman.at",0],["womenshealth.de",0],["wormser-zeitung.de",0],["woxikon.de",0],["wp.de",0],["wr.de",0],["yachtrevue.at",0],["ze.tt",0],["zeit.de",0],["meineorte.com",1],["osthessen-news.de",1],["techadvisor.com",1],["teltarif.de",4],["economictimes.indiatimes.com",5],["m.timesofindia.com",6],["timesofindia.indiatimes.com",6],["youmath.it",6],["redensarten-index.de",6],["lesoir.be",6],["electriciansforums.net",6],["keralatelecom.info",6],["universegunz.net",6],["happypenguin.altervista.org",6],["everyeye.it",6],["bluedrake42.com",6],["streamservicehd.click",6],["supermarioemulator.com",6],["futbollibrehd.com",6],["newsrade.com",6],["eska.pl",6],["eskarock.pl",6],["voxfm.pl",6],["mathaeser.de",6],["freethesaurus.com",8],["thefreedictionary.com",8],["hdbox.ws",10],["todopolicia.com",10],["scat.gold",10],["freecoursesite.com",10],["windowcleaningforums.co.uk",10],["cruisingearth.com",10],["hobby-machinist.com",10],["freegogpcgames.com",10],["latitude.to",10],["kitchennovel.com",10],["w3layouts.com",10],["blog.receivefreesms.co.uk",10],["eductin.com",10],["dealsfinders.blog",10],["audiobooks4soul.com",10],["tinhocdongthap.com",10],["sakarnewz.com",10],["downloadr.in",10],["topcomicporno.com",10],["dongknows.com",10],["traderepublic.community",10],["celtadigital.com",10],["iptvrun.com",10],["adsup.lk",10],["cryptomonitor.in",10],["areatopik.com",10],["cardscanner.co",10],["nullforums.net",10],["courseclub.me",10],["tamarindoyam.com",10],["jeep-cj.com",10],["choiceofmods.com",10],["myqqjd.com",10],["ssdtop.com",10],["apkhex.com",10],["gezegenforum.com",10],["mbc2.live",10],["iptvapps.net",10],["null-scripts.net",10],["nullscripts.net",10],["bloground.ro",10],["witcherhour.com",10],["ottverse.com",10],["torrentmac.net",10],["mazakony.com",10],["laptechinfo.com",10],["mc-at.org",10],["playstationhaber.com",10],["mangapt.com",10],["seriesperu.com",10],["pesprofessionals.com",10],["wpsimplehacks.com",10],["sportshub.to",[10,265]],["topsporter.net",[10,265]],["darkwanderer.net",10],["truckingboards.com",10],["coldfrm.org",10],["azrom.net",10],["freepatternsarea.com",10],["alttyab.net",10],["hq-links.com",10],["mobilkulup.com",10],["esopress.com",10],["rttar.com",10],["nesiaku.my.id",10],["jipinsoft.com",10],["surfsees.com",10],["truthnews.de",10],["farsinama.com",10],["worldofiptv.com",10],["vuinsider.com",10],["crazydl.net",10],["gamemodsbase.com",10],["babiato.tech",10],["secuhex.com",10],["turkishaudiocenter.com",10],["galaxyos.net",10],["blackhatworld.com",10],["bizdustry.com",10],["storefront.com.ng",10],["pkbiosfix.com",10],["casi3.xyz",10],["geektime.co.il",11],["bild.de",12],["mediafire.com",13],["wcoanimedub.tv",14],["wcoforever.net",14],["openspeedtest.com",14],["addtobucketlist.com",14],["3dzip.org",[14,88]],["ilmeteo.it",14],["wcoforever.com",14],["comprovendolibri.it",14],["healthelia.com",14],["keephealth.info",15],["australianfrequentflyer.com.au",16],["afreesms.com",17],["kinoger.re",17],["laksa19.github.io",17],["javcl.com",17],["upvideo.to",17],["tvlogy.to",17],["live.dragaoconnect.net",17],["beststremo.com",17],["seznam.cz",17],["seznamzpravy.cz",17],["xerifetech.com",17],["wallpapershome.com",19],["ville-ideale.fr",20],["calciomercato.it",21],["calciomercato.com",22],["bersamatekno.com",22],["hotpornfile.org",22],["robloxscripts.com",22],["coolsoft.altervista.org",22],["worldcupfootball.me",[22,27]],["hackedonlinegames.com",22],["jkoding.xyz",22],["settlersonlinemaps.com",22],["magdownload.org",22],["kpkuang.org",22],["shareus.site",22],["crypto4yu.com",22],["faucetwork.space",22],["thenightwithoutthedawn.blogspot.com",22],["entutes.com",22],["claimlite.club",22],["bazadecrypto.com",[22,310]],["whosampled.com",23],["imgkings.com",24],["pornvideotop.com",24],["krotkoosporcie.pl",24],["anghami.com",25],["wired.com",26],["tutele.sx",27],["footyhunter3.xyz",27],["magesypro.pro",[28,29]],["audiotools.pro",29],["magesy.blog",29],["audioztools.com",[29,30]],["altblogger.net",30],["hl-live.de",30],["satoshi-win.xyz",30],["encurtandourl.com",[30,153]],["freedeepweb.blogspot.com",30],["freesoft.id",30],["zcteam.id",30],["www-daftarharga.blogspot.com",30],["ear-phone-review.com",30],["telefullenvivo.com",30],["listatv.pl",30],["ltc-faucet.xyz",30],["coin-profits.xyz",30],["relampagomovies.com",30],["katestube.com",31],["short.pe",31],["footystreams.net",31],["seattletimes.com",32],["yiv.com",33],["globalrph.com",34],["e-glossa.it",35],["java-forum.org",36],["comunidadgzone.es",36],["mp3fy.com",36],["lebensmittelpraxis.de",36],["ebookdz.com",36],["forum-pokemon-go.fr",36],["praxis-jugendarbeit.de",36],["gdrivez.xyz",36],["dictionnaire-medical.net",36],["cle0desktop.blogspot.com",36],["up-load.io",36],["direct-link.net",36],["direkt-wissen.com",36],["keysbrasil.blogspot.com",36],["hotpress.info",36],["turkleech.com",36],["anibatch.me",36],["anime-i.com",36],["plex-guide.de",36],["healthtune.site",36],["gewinde-normen.de",36],["tucinehd.com",36],["freewebscript.com",37],["webcheats.com.br",38],["gala.fr",40],["gentside.com",40],["geo.fr",40],["hbrfrance.fr",40],["nationalgeographic.fr",40],["ohmymag.com",40],["serengo.net",40],["vsd.fr",40],["updato.com",[41,58]],["methbox.com",42],["daizurin.com",42],["pendekarsubs.us",42],["dreamfancy.org",42],["rysafe.blogspot.com",42],["techacode.com",42],["toppng.com",42],["th-world.com",42],["avjamack.com",42],["avjamak.net",42],["tickzoo.tv",43],["dlhd.sx",44],["embedstream.me",44],["yts-subs.net",44],["cnnamador.com",45],["nudecelebforum.com",46],["pronpic.org",47],["thewebflash.com",48],["discordfastfood.com",48],["xup.in",48],["popularmechanics.com",49],["op.gg",50],["lequipe.fr",51],["jellynote.com",52],["eporner.com",54],["pornbimbo.com",55],["allmonitors24.com",55],["4j.com",55],["avoiderrors.com",56],["cgtips.org",[56,210]],["sitarchive.com",56],["livenewsof.com",56],["topnewsshow.com",56],["gatcha.org",56],["empregoestagios.com",56],["everydayonsales.com",56],["kusonime.com",56],["aagmaal.xyz",56],["suicidepics.com",56],["codesnail.com",56],["codingshiksha.com",56],["graphicux.com",56],["hardcoregames.ca",56],["asyadrama.com",56],["bitcoinegypt.news",56],["citychilli.com",56],["talkjarvis.com",56],["hdmotori.it",57],["femdomtb.com",59],["camhub.cc",59],["bobs-tube.com",59],["ru-xvideos.me",59],["pornfd.com",59],["popno-tour.net",59],["molll.mobi",59],["watchmdh.to",59],["camwhores.tv",59],["elfqrin.com",60],["satcesc.com",61],["apfelpatient.de",61],["lusthero.com",62],["m2list.com",63],["embed.nana2play.com",63],["elahmad.com",63],["dofusports.xyz",63],["dallasnews.com",64],["lnk.news",65],["lnk.parts",65],["efukt.com",66],["wendycode.com",66],["springfieldspringfield.co.uk",67],["porndoe.com",68],["smsget.net",[69,70]],["kjanime.net",71],["gioialive.it",72],["classicreload.com",73],["chicoer.com",74],["bostonherald.com",74],["dailycamera.com",74],["gomiblog.com",75],["maxcheaters.com",76],["rbxoffers.com",76],["mhn.quest",76],["postimees.ee",76],["police.community",76],["gisarea.com",76],["schaken-mods.com",76],["theclashify.com",76],["newscon.org",76],["txori.com",76],["olarila.com",76],["deletedspeedstreams.blogspot.com",76],["schooltravelorganiser.com",76],["xhardhempus.net",76],["sportsplays.com",77],["deinesexfilme.com",79],["einfachtitten.com",79],["halloporno.com",79],["herzporno.com",79],["lesbenhd.com",79],["milffabrik.com",[79,241]],["porn-monkey.com",79],["porndrake.com",79],["pornhubdeutsch.net",79],["pornoaffe.com",79],["pornodavid.com",79],["pornoente.tv",[79,241]],["pornofisch.com",79],["pornofelix.com",79],["pornohammer.com",79],["pornohelm.com",79],["pornoklinge.com",79],["pornotom.com",[79,241]],["pornotommy.com",79],["pornovideos-hd.com",79],["pornozebra.com",[79,241]],["xhamsterdeutsch.xyz",79],["xnxx-sexfilme.com",79],["zerion.cc",79],["letribunaldunet.fr",80],["vladan.fr",80],["live-tv-channels.org",81],["eslfast.com",82],["freegamescasual.com",83],["tcpvpn.com",84],["oko.sh",84],["timesnownews.com",84],["timesnowhindi.com",84],["timesnowmarathi.com",84],["zoomtventertainment.com",84],["xxxuno.com",85],["sholah.net",86],["2rdroid.com",86],["bisceglielive.it",87],["pandajogosgratis.com.br",89],["5278.cc",90],["tonspion.de",92],["duplichecker.com",93],["plagiarismchecker.co",93],["plagiarismdetector.net",93],["searchenginereports.net",93],["smallseotools.com",93],["giallozafferano.it",94],["autojournal.fr",94],["autoplus.fr",94],["sportauto.fr",94],["linkspaid.com",95],["proxydocker.com",95],["beeimg.com",[96,97]],["emturbovid.com",97],["ftlauderdalebeachcam.com",98],["ftlauderdalewebcam.com",98],["juneauharborwebcam.com",98],["keywestharborwebcam.com",98],["kittycatcam.com",98],["mahobeachcam.com",98],["miamiairportcam.com",98],["morganhillwebcam.com",98],["njwildlifecam.com",98],["nyharborwebcam.com",98],["paradiseislandcam.com",98],["pompanobeachcam.com",98],["portbermudawebcam.com",98],["portcanaveralwebcam.com",98],["portevergladeswebcam.com",98],["portmiamiwebcam.com",98],["portnywebcam.com",98],["portnassauwebcam.com",98],["portstmaartenwebcam.com",98],["portstthomaswebcam.com",98],["porttampawebcam.com",98],["sxmislandcam.com",98],["gearingcommander.com",98],["themes-dl.com",98],["badassdownloader.com",98],["badasshardcore.com",98],["badassoftcore.com",98],["nulljungle.com",98],["teevee.asia",98],["otakukan.com",98],["linksht.com",100],["generate.plus",101],["calculate.plus",101],["avcesar.com",102],["audiotag.info",103],["tudigitale.it",104],["ibcomputing.com",105],["eodev.com",106],["legia.net",107],["acapellas4u.co.uk",108],["streamhentaimovies.com",109],["konten.co.id",110],["diariodenavarra.es",111],["scripai.com",111],["myfxbook.com",111],["whatfontis.com",111],["xiaomifans.pl",112],["eletronicabr.com",112],["optifine.net",113],["luzernerzeitung.ch",114],["tagblatt.ch",114],["spellcheck.net",115],["spellchecker.net",115],["spellweb.com",115],["ableitungsrechner.net",116],["alternet.org",117],["gourmetsupremacy.com",117],["imtranslator.net",118],["shrib.com",119],["pandafiles.com",120],["vidia.tv",[120,142]],["hortonanderfarom.blogspot.com",120],["clarifystraight.com",120],["tutelehd3.xyz",121],["mega4upload.com",121],["coolcast2.com",121],["techclips.net",121],["earthquakecensus.com",121],["footyhunter.lol",121],["gamerarcades.com",121],["poscitech.click",121],["starlive.stream",121],["utopianwilderness.com",121],["wecast.to",121],["sportbar.live",121],["lordchannel.com",121],["play-old-pc-games.com",122],["scrin.org",123],["tunovelaligera.com",124],["tapchipi.com",124],["cuitandokter.com",124],["tech-blogs.com",124],["cardiagn.com",124],["dcleakers.com",124],["esgeeks.com",124],["pugliain.net",124],["uplod.net",124],["worldfreeware.com",124],["fikiri.net",124],["myhackingworld.com",124],["phoenixfansub.com",124],["freecourseweb.com",125],["devcourseweb.com",125],["coursewikia.com",125],["courseboat.com",125],["coursehulu.com",125],["lne.es",129],["pornult.com",130],["webcamsdolls.com",130],["bitcotasks.com",130],["adsy.pw",130],["playstore.pw",130],["exactpay.online",130],["thothd.to",130],["proplanta.de",131],["hydrogenassociation.org",132],["ludigames.com",132],["sportitalialive.com",132],["tii.la",132],["made-by.org",132],["xenvn.com",132],["worldtravelling.com",132],["igirls.in",132],["technichero.com",132],["roshiyatech.my.id",132],["24sport.stream",132],["aeroxplorer.com",132],["mad4wheels.com",133],["logi.im",133],["emailnator.com",133],["textograto.com",134],["voyageforum.com",135],["hmc-id.blogspot.com",135],["jemerik.com",135],["myabandonware.com",135],["chatta.it",137],["ketubanjiwa.com",138],["nsfw247.to",139],["funzen.net",139],["fighter.stream",139],["ilclubdellericette.it",139],["hubstream.in",139],["extremereportbot.com",140],["getintopc.com",141],["qoshe.com",143],["lowellsun.com",144],["mamadu.pl",144],["dobrapogoda24.pl",144],["motohigh.pl",144],["namasce.pl",144],["ultimate-catch.eu",145],["cpopchanelofficial.com",146],["creditcardgenerator.com",147],["creditcardrush.com",147],["bostoncommons.net",147],["thejobsmovie.com",147],["livsavr.co",147],["nilopolisonline.com.br",148],["mesquitaonline.com",148],["yellowbridge.com",148],["socialgirls.im",149],["yaoiotaku.com",150],["camhub.world",151],["moneyhouse.ch",152],["ihow.info",153],["filesus.com",153],["sturls.com",153],["re.two.re",153],["turbo1.co",153],["cartoonsarea.xyz",153],["valeronevijao.com",154],["cigarlessarefy.com",154],["figeterpiazine.com",154],["yodelswartlike.com",154],["generatesnitrosate.com",154],["crownmakermacaronicism.com",154],["chromotypic.com",154],["gamoneinterrupted.com",154],["metagnathtuggers.com",154],["wolfdyslectic.com",154],["rationalityaloelike.com",154],["sizyreelingly.com",154],["simpulumlamerop.com",154],["urochsunloath.com",154],["monorhinouscassaba.com",154],["counterclockwisejacky.com",154],["35volitantplimsoles5.com",154],["scatch176duplicities.com",154],["antecoxalbobbing1010.com",154],["boonlessbestselling244.com",154],["cyamidpulverulence530.com",154],["guidon40hyporadius9.com",154],["449unceremoniousnasoseptal.com",154],["19turanosephantasia.com",154],["30sensualizeexpression.com",154],["321naturelikefurfuroid.com",154],["745mingiestblissfully.com",154],["availedsmallest.com",154],["greaseball6eventual20.com",154],["toxitabellaeatrebates306.com",154],["20demidistance9elongations.com",154],["audaciousdefaulthouse.com",154],["fittingcentermondaysunday.com",154],["fraudclatterflyingcar.com",154],["launchreliantcleaverriver.com",154],["matriculant401merited.com",154],["realfinanceblogcenter.com",154],["reputationsheriffkennethsand.com",154],["telyn610zoanthropy.com",154],["tubelessceliolymph.com",154],["tummulerviolableness.com",154],["un-block-voe.net",154],["v-o-e-unblock.com",154],["voe-un-block.com",154],["voeun-block.net",154],["voeunbl0ck.com",154],["voeunblck.com",154],["voeunblk.com",154],["voeunblock.com",154],["voeunblock1.com",154],["voeunblock2.com",154],["voeunblock3.com",154],["agefi.fr",155],["cariskuy.com",156],["letras2.com",156],["yusepjaelani.blogspot.com",157],["letras.mus.br",158],["cheatermad.com",159],["mtlurb.com",160],["port.hu",161],["acdriftingpro.com",161],["flight-report.com",161],["forumdz.com",161],["abandonmail.com",161],["flmods.com",161],["zilinak.sk",161],["projectfreetv.stream",161],["hotdesimms.com",161],["pdfaid.com",161],["mconverter.eu",161],["dzeko11.net",[161,265]],["mail.com",161],["expresskaszubski.pl",161],["moegirl.org.cn",161],["onemanhua.com",162],["t3n.de",163],["allindiaroundup.com",164],["vectorizer.io",165],["smgplaza.com",165],["ftuapps.dev",165],["onehack.us",165],["thapcam.net",165],["thefastlaneforum.com",166],["trade2win.com",167],["gmodleaks.com",167],["modagamers.com",168],["freemagazines.top",168],["straatosphere.com",168],["nullpk.com",168],["adslink.pw",168],["downloadudemy.com",168],["picgiraffe.com",168],["weadown.com",168],["freepornsex.net",168],["nurparatodos.com.ar",168],["librospreuniversitariospdf.blogspot.com",169],["msdos-games.com",169],["forexeen.us",169],["khsm.io",169],["girls-like.me",169],["webcreator-journal.com",169],["nu6i-bg-net.com",169],["routech.ro",170],["hokej.net",170],["turkmmo.com",171],["palermotoday.it",172],["baritoday.it",172],["trentotoday.it",172],["agrigentonotizie.it",172],["anconatoday.it",172],["arezzonotizie.it",172],["avellinotoday.it",172],["bresciatoday.it",172],["brindisireport.it",172],["casertanews.it",172],["cataniatoday.it",172],["cesenatoday.it",172],["chietitoday.it",172],["forlitoday.it",172],["frosinonetoday.it",172],["genovatoday.it",172],["ilpescara.it",172],["ilpiacenza.it",172],["latinatoday.it",172],["lecceprima.it",172],["leccotoday.it",172],["livornotoday.it",172],["messinatoday.it",172],["milanotoday.it",172],["modenatoday.it",172],["monzatoday.it",172],["novaratoday.it",172],["padovaoggi.it",172],["parmatoday.it",172],["perugiatoday.it",172],["pisatoday.it",172],["quicomo.it",172],["ravennatoday.it",172],["reggiotoday.it",172],["riminitoday.it",172],["romatoday.it",172],["salernotoday.it",172],["sondriotoday.it",172],["sportpiacenza.it",172],["ternitoday.it",172],["today.it",172],["torinotoday.it",172],["trevisotoday.it",172],["triesteprima.it",172],["udinetoday.it",172],["veneziatoday.it",172],["vicenzatoday.it",172],["thumpertalk.com",173],["arkcod.org",173],["facciabuco.com",174],["softx64.com",175],["thelayoff.com",176],["shorterall.com",176],["blog24.me",176],["maxstream.video",176],["maxlinks.online",176],["tvepg.eu",176],["pstream.net",177],["libreriamo.it",178],["medebooks.xyz",178],["tutorials-technology.info",178],["mashtips.com",178],["marriedgames.com.br",178],["4allprograms.me",178],["nurgsm.com",178],["certbyte.com",178],["plugincrack.com",178],["gamingdeputy.com",178],["freewebcart.com",178],["dailymaverick.co.za",179],["apps2app.com",180],["fm-arena.com",181],["enit.in",182],["financerites.com",182],["fadedfeet.com",183],["homeculina.com",183],["ineedskin.com",183],["kenzo-flowertag.com",183],["lawyex.co",183],["mdn.lol",183],["bitzite.com",184],["my-code4you.blogspot.com",185],["leakgaming.fr",186],["vrcmods.com",187],["osuskinner.com",187],["osuskins.net",187],["pentruea.com",[188,189]],["mchacks.net",190],["why-tech.it",191],["compsmag.com",192],["tapetus.pl",193],["gaystream.online",194],["embedv.net",194],["fslinks.org",194],["v6embed.xyz",194],["vgplayer.xyz",194],["vid-guard.com",194],["autoroad.cz",195],["brawlhalla.fr",195],["tecnobillo.com",195],["sexcamfreeporn.com",196],["breatheheavy.com",197],["wenxuecity.com",198],["key-hub.eu",199],["fabioambrosi.it",200],["tattle.life",201],["emuenzen.de",201],["terrylove.com",201],["mynet.com",202],["cidade.iol.pt",203],["fantacalcio.it",204],["hentaifreak.org",205],["hypebeast.com",206],["krankheiten-simulieren.de",207],["catholic.com",208],["3dmodelshare.org",209],["gourmetscans.net",210],["techinferno.com",211],["phuongtrinhhoahoc.com",212],["ibeconomist.com",213],["bookriot.com",214],["purposegames.com",215],["schoolcheats.net",215],["globo.com",216],["latimes.com",216],["claimrbx.gg",217],["perelki.net",218],["vpn-anbieter-vergleich-test.de",219],["livingincebuforums.com",220],["paperzonevn.com",221],["alltechnerd.com",222],["malaysianwireless.com",223],["erinsakura.com",224],["infofuge.com",224],["freejav.guru",224],["novelmultiverse.com",224],["fritidsmarkedet.dk",225],["maskinbladet.dk",225],["15min.lt",226],["lewdninja.com",227],["lewd.ninja",227],["baddiehub.com",228],["mr9soft.com",229],["21porno.com",230],["adult-sex-gamess.com",231],["hentaigames.app",231],["mobilesexgamesx.com",231],["mysexgamer.com",231],["porngameshd.com",231],["sexgamescc.com",231],["xnxx-sex-videos.com",231],["f2movies.to",232],["freeporncave.com",233],["tubsxxx.com",234],["pornojenny.com",235],["subtitle.one",236],["manga18fx.com",237],["freebnbcoin.com",237],["sextvx.com",238],["studydhaba.com",239],["freecourse.tech",239],["victor-mochere.com",239],["papunika.com",239],["mobilanyheter.net",239],["prajwaldesai.com",239],["muztext.com",240],["pornohans.com",241],["nursexfilme.com",241],["pornohirsch.net",241],["xhamster-sexvideos.com",241],["pornoschlange.com",241],["hdpornos.net",241],["gutesexfilme.com",241],["short1.site",241],["zona-leros.com",241],["charbelnemnom.com",242],["online-fix.me",243],["gamersdiscussionhub.com",244],["owlzo.com",245],["q1003.com",246],["blogpascher.com",247],["testserver.pro",248],["lifestyle.bg",248],["money.bg",248],["news.bg",248],["topsport.bg",248],["webcafe.bg",248],["mgnet.xyz",249],["advertiserandtimes.co.uk",250],["xvideos2020.me",251],["111.90.159.132",252],["techsolveprac.com",253],["joomlabeginner.com",254],["largescaleforums.com",255],["dubznetwork.com",256],["mundodonghua.com",256],["hentaidexy.com",257],["oceanplay.org",258],["code2care.org",259],["xxxxsx.com",261],["ngontinh24.com",262],["panel.freemcserver.net",263],["idevicecentral.com",264],["zona11.com",265],["scsport.live",265],["mangacrab.com",267],["idnes.cz",268],["viefaucet.com",269],["cloud-computing-central.com",270],["afk.guide",271],["businessnamegenerator.com",272],["derstandard.at",273],["derstandard.de",273],["rocketnews24.com",274],["soranews24.com",274],["youpouch.com",274],["ilsole24ore.com",275],["hentaiporn.one",276],["infokik.com",277],["daemonanime.net",278],["daemon-hentai.com",278],["deezer.com",279],["fosslinux.com",280],["shrdsk.me",281],["examword.com",282],["sempreupdate.com.br",282],["tribuna.com",283],["trendsderzukunft.de",284],["gal-dem.com",284],["lostineu.eu",284],["oggitreviso.it",284],["speisekarte.de",284],["mixed.de",284],["lightnovelspot.com",[285,286]],["lightnovelworld.com",[285,286]],["novelpub.com",[285,286]],["webnovelpub.com",[285,286]],["mail.yahoo.com",287],["hwzone.co.il",288],["nammakalvi.com",289],["javmoon.me",290],["c2g.at",291],["terafly.me",291],["dktechnicalmate.com",292],["recipahi.com",292],["converter-btc.world",292],["kaystls.site",293],["aquarius-horoscopes.com",294],["cancer-horoscopes.com",294],["dubipc.blogspot.com",294],["echoes.gr",294],["engel-horoskop.de",294],["freegames44.com",294],["fuerzasarmadas.eu",294],["gemini-horoscopes.com",294],["jurukunci.net",294],["krebs-horoskop.com",294],["leo-horoscopes.com",294],["maliekrani.com",294],["nklinks.click",294],["ourenseando.es",294],["pisces-horoscopes.com",294],["radio-en-direct.fr",294],["sagittarius-horoscopes.com",294],["scorpio-horoscopes.com",294],["singlehoroskop-loewe.de",294],["skat-karten.de",294],["skorpion-horoskop.com",294],["taurus-horoscopes.com",294],["the1security.com",294],["torrentmovies.online",294],["virgo-horoscopes.com",294],["zonamarela.blogspot.com",294],["yoima.hatenadiary.com",294],["vpntester.org",295],["watchhentai.net",296],["japscan.lol",297],["digitask.ru",298],["tempumail.com",299],["sexvideos.host",300],["10alert.com",302],["cryptstream.de",303],["nydus.org",303],["techhelpbd.com",304],["fapdrop.com",305],["cellmapper.net",306],["hdrez.com",307],["youwatch-serie.com",307],["printablecreative.com",308],["comohoy.com",309],["leak.sx",309],["pornleaks.in",309],["merlininkazani.com",309],["faindx.com",311],["j91.asia",312],["jeniusplay.com",313],["indianyug.com",314],["rgb.vn",314],["needrom.com",315],["criptologico.com",316],["megadrive-emulator.com",317],["eromanga-show.com",318],["hentai-one.com",318],["hentaipaw.com",318],["10minuteemails.com",319],["luxusmail.org",319],["w3cub.com",320],["bangpremier.com",321],["nyaa.iss.ink",322],["tnp98.xyz",324],["freepdfcomic.com",325],["memedroid.com",326],["animesync.org",327],["karaoketexty.cz",328],["resortcams.com",329],["mjakmama24.pl",331],["security-demo.extrahop.com",332]]);

const entitiesMap = new Map([["comunio",0],["finanzen",[0,7]],["gameswelt",0],["heftig",0],["notebookcheck",0],["testedich",0],["transfermarkt",0],["truckscout24",0],["tvtv",0],["wetteronline",0],["wieistmeineip",0],["wetter",2],["1337x",6],["eztv",6],["sushi-scan",10],["spigotunlocked",10],["ahmedmode",10],["kissasian",15],["rp5",17],["mma-core",18],["writedroid",22],["yts",27],["720pstream",27],["1stream",27],["magesy",28],["thefmovies",31],["fxporn69",36],["aliancapes",36],["urlcero",39],["totaldebrid",42],["sandrives",42],["oploverz",43],["pouvideo",53],["povvideo",53],["povw1deo",53],["povwideo",53],["powv1deo",53],["powvibeo",53],["powvideo",53],["powvldeo",53],["tubsexer",59],["porno-tour",59],["lenkino",59],["pornomoll",59],["camsclips",59],["m4ufree",63],["crackstreams",63],["telerium",78],["pandafreegames",91],["thoptv",99],["brainly",106],["streameast",121],["thestreameast",121],["daddylivehd",121],["solvetube",126],["hdfilme",127],["pornhub",128],["wcofun",135],["bollyholic",139],["gotxx",153],["turkanime",154],["voe-unblock",154],["khatrimaza",168],["pogolinks",168],["popcornstream",170],["shortzzy",178],["vembed",194],["xhamsterdeutsch",241],["privatemoviez",244],["gmx",260],["lightnovelpub",[285,286]],["camcaps",301],["drivebot",323],["thenextplanet1",324],["autoscout24",330]]);

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
