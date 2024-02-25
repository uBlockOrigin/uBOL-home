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

const argsList = [[".call(null)","10"],[".call(null)"],["(null)","10"],["userHasAdblocker"],["null)","10"],["objSubPromo"],["adb"],["nrWrapper"],["warn"],["adBlockerDetected"],["show"],["adObjects"],["InfMediafireMobileFunc","1000"],["google_jobrunner"],["()","45000"],["prompt"],["0x"],["displayAdBlockedVideo"],[".adsbygoogle"],["contrformpub","5000"],["disabledAdBlock","10000"],["_0x"],["ads.length"],["location.href"],["isDesktopApp","1000"],["Bait"],["admc"],["AdBlocker"],["Blocked"],["nextFunction"],["'0x"],["apstagLOADED"],["/Adb|moneyDetect/"],["disableDeveloper"],["Blocco","2000"],["nextFunction","2000"],["documentElement.classList.add","400"],["test","0"],["checkAdblockUser","1000"],["checkPub","6000"],["document.querySelector","5000"],["nextFunction","250"],["popup"],["()","150"],["backRedirect"],["document.querySelectorAll","1000"],["style"],["clientHeight"],["addEventListener","0"],["adblock","2000"],["start","0"],["byepopup","5000"],["test.remove","100"],["additional_src","300"],["()","2000"],["css_class.show"],["CANG","3000"],["updato-overlay","500"],["innerText","2000"],["alert","8000"],["css_class"],["()","50"],["debugger"],["initializeCourier","3000"],["redirectPage"],["_0x","2000"],["ads","750"],["location.href","500"],["Adblock","5000"],["disable","200"],["CekAab","0"],["rbm_block_active","1000"],["show()"],["n.trigger","1"],["adblock"],["abDetected"],["KeepOpeningPops","1000"],["appendChild"],["adb","0"],["adBlocked"],["warning","100"],["adblock_popup","500"],["Adblock"],["#chatWrap","1000"],["keep-ads","2000"],["#rbm_block_active","1000"],["null","4000"],["()","2500"],["myaabpfun","3000"],["adFilled","2500"],["()","15000"],["showPopup"],["()","1"],["()","1000"],["document.cookie","2500"],["window.open"],["innerHTML"],["readyplayer","2000"],["/text()|0x/"],["checkStopBlock"],["adspot_top","1500"],["/offsetHeight|google|Global/"],["an_message","500"],["Adblocker","10000"],["trigger","0"],["timeoutChecker"],["bait","1"],["pum-open"],["overlay","2000"],["/adblock/i"],["test","100"],["Math.round","1000"],["adblock","5"],["bioEp"],["ag_adBlockerDetected"],["null"],["adsbox","1000"],["adb","6000"],["pop"],["sadbl"],["checkAdStatus"],["mdp"],["brave_load_popup"],["0x","3000"],["invoke"],["adsbytrafficjunkycontext"],["ipod"],["offsetWidth"],["/$|adBlock/"],["ads"],["adsbygoogle"],["()"],["AdBlock"],["stop-scrolling"],["Adv"],["blockUI","2000"],["mdpDeBlocker"],["/_0x|debug/"],["/ai_adb|_0x/"],["iframe"],["adBlock"],["","1"],["undefined"],["check","1"],["adsBlocked"],["blocker"],["aswift_"],["afs_ads","2000"],["visibility","2000"],["bait"],["getComputedStyle","250"],["blocked"],["{r()","0"],["nextFunction","450"],["Debug"],["r()","0"],["offset"],["purple_box"],["offsetHeight"],["checkSiteNormalLoad"],["adBlockOverlay"],["Detected","500"],["modal"],[".show","1000"],[".show"],["showModal"],["getComputedStyle"],["blur"],["samOverlay"],["bADBlock"],["location"],["","4000"],["blocker","100"],["alert"],["length"],["ai_adb"],["t()","0"],["$"],["getComputedStyle","2000"],["video-popup"],["detectAdblock"],["delay"],["detectAdBlocker"],["","5"],["/adblock|isRequestPresent/"],["_0x","500"],["isRequestPresent"],["offsetLeft"],[".show()","1000"],["height"],["mdp_deblocker"],["charAt"],["checkAds"],["fadeIn","0"],["jQuery"],["/^/"],["afterOpen"],["check"],["Adblocker"],["eabdModal"],["ab_root.show"],["gaData"],["ad"],["prompt","1000"],["googlefc"],["adblock detection"],[".offsetHeight","100"],["popState"],["ad-block-popup"],["exitTimer"],["innerHTML.replace"],["data?","4000"],[".data?"],["eabpDialog"],["adsense"],["/Adblock|_ad_/"],["googletag"],["f.parentNode.removeChild(f)","100"],["swal","500"],["keepChecking","1000"],["openPopup"],[".offsetHeight"],["()=>{"],["nitroAds"],["class.scroll","1000"],["disableDeveloperTools"],["Check"],["insertBefore"],["setAntiAb"],["css_class.scroll"],["/null|Error/","10000"],["window.location.href","50"],["/out.php"],["/0x|devtools/"],["location.replace","300"],["window.location.href"],["checkVisible"],["_0x","3000"],["fetch"],["window.location.href=link"],["ai_"],["reachGoal"],["Adb"],["ai"],["","3000"],["/width|innerHTML/"],["magnificPopup"],["adblockEnabled"],["google_ad"],["document.location"],["google"],["top-right","2000"],["enforceAdStatus"],["loadScripts"],["mfp"],["display","5000"],["eb"],[").show()"],["","1000"],["atob"],["devtool"],["Msg"],["UABP"],["href"],["aaaaa-modal"],["\\x","5000"],["()=>"],["keepChecking"],["null","10"],["","500"],["/Adform|didomi|adblock|forEach/"],["showAdblock"],["-0x"],["display"],["gclid"],["event","3000"],["rejectWith"],["refresh"],["location.href","3000"],["window.location"],["ga"],["adbl"],["Ads"],["ShowAdBLockerNotice"],["ad_listener"],["open"],["(!0)"],["Delay"],["/appendChild|e\\(\"/"],["=>"],["ADB"],["site-access-popup"],["data?"],["/debugger|UserCustomPop/"],["checkAdblockUser"],["offsetHeight","100"],["AdDetect"],["displayMessage","2000"],["/salesPopup|mira-snackbar/"],["advanced"],["detectImgLoad"],["offsetHeight","200"],["detector"],["replace"],["touchstart"],["siteAccessFlag"],["ab"],["/adblocker|alert/"],["redURL"],["/children\\('ins'\\)|Adblock|adsbygoogle/"],["displayMessage"],["chkADB"],["onDetected"],["myinfoey","1500"],["placebo"],["fuckadb"],["detect"],["siteAccessPopup"],["/adsbygoogle|adblock/"],["akadb"],["biteDisplay"],["/[a-z]\\(!0\\)/","800"],["ad_block"],["/detectAdBlocker|window.open/"],["adBlockDetected"],["popUnder"],["/GoToURL|delay/"],["window.location.href","300"],["ad_display"],["/adScriptPath|MMDConfig/"],["0x","100"],["/native|\\{n\\(\\)/"],["adblocker"],["EzoIvent"],["/Detect|adblock|style\\.display|\\[native code]|\\.call\\(null\\)/"],["removeChild"],["ad blocker"]];

const hostnamesMap = new Map([["4-liga.com",0],["4fansites.de",0],["4players.de",0],["9monate.de",0],["aachener-nachrichten.de",0],["aachener-zeitung.de",0],["abendblatt.de",0],["abendzeitung-muenchen.de",0],["about-drinks.com",0],["abseits-ka.de",0],["airliners.de",0],["ajaxshowtime.com",0],["allgemeine-zeitung.de",0],["antenne.de",0],["arcor.de",0],["areadvd.de",0],["areamobile.de",0],["ariva.de",0],["astronews.com",0],["aussenwirtschaftslupe.de",0],["auszeit.bio",0],["auto-motor-und-sport.de",0],["auto-service.de",0],["autobild.de",0],["autoextrem.de",0],["autopixx.de",0],["autorevue.at",0],["az-online.de",0],["baby-vornamen.de",0],["babyclub.de",0],["bafoeg-aktuell.de",0],["berliner-kurier.de",0],["berliner-zeitung.de",0],["bigfm.de",0],["bikerszene.de",0],["bildderfrau.de",0],["blackd.de",0],["blick.de",0],["boerse-online.de",0],["boerse.de",0],["boersennews.de",0],["braunschweiger-zeitung.de",0],["brieffreunde.de",0],["brigitte.de",0],["buerstaedter-zeitung.de",0],["buffed.de",0],["businessinsider.de",0],["buzzfeed.at",0],["buzzfeed.de",0],["caravaning.de",0],["cavallo.de",0],["chefkoch.de",0],["cinema.de",0],["clever-tanken.de",0],["computerbild.de",0],["computerhilfen.de",0],["comunio-cl.com",0],["connect.de",0],["chip.de",0],["da-imnetz.de",0],["dasgelbeblatt.de",0],["dbna.com",0],["dbna.de",0],["deichstube.de",0],["deine-tierwelt.de",0],["der-betze-brennt.de",0],["derwesten.de",0],["desired.de",0],["dhd24.com",0],["dieblaue24.com",0],["digitalfernsehen.de",0],["dnn.de",0],["donnerwetter.de",0],["e-hausaufgaben.de",0],["e-mountainbike.com",0],["eatsmarter.de",0],["echo-online.de",0],["ecomento.de",0],["einfachschoen.me",0],["elektrobike-online.com",0],["eltern.de",0],["epochtimes.de",0],["essen-und-trinken.de",0],["express.de",0],["extratipp.com",0],["familie.de",0],["fanfiktion.de",0],["fehmarn24.de",0],["fettspielen.de",0],["fid-gesundheitswissen.de",0],["finanznachrichten.de",0],["finanztreff.de",0],["finya.de",0],["firmenwissen.de",0],["fitforfun.de",0],["fnp.de",0],["football365.fr",0],["formel1.de",0],["fr.de",0],["frankfurter-wochenblatt.de",0],["freenet.de",0],["fremdwort.de",0],["froheweihnachten.info",0],["frustfrei-lernen.de",0],["fuldaerzeitung.de",0],["funandnews.de",0],["fussballdaten.de",0],["futurezone.de",0],["gala.de",0],["gamepro.de",0],["gamersglobal.de",0],["gamesaktuell.de",0],["gamestar.de",0],["gamezone.de",0],["gartendialog.de",0],["gartenlexikon.de",0],["gedichte.ws",0],["geissblog.koeln",0],["gelnhaeuser-tageblatt.de",0],["general-anzeiger-bonn.de",0],["geniale-tricks.com",0],["genialetricks.de",0],["gesund-vital.de",0],["gesundheit.de",0],["gevestor.de",0],["gewinnspiele.tv",0],["giessener-allgemeine.de",0],["giessener-anzeiger.de",0],["gifhorner-rundschau.de",0],["giga.de",0],["gipfelbuch.ch",0],["gmuender-tagespost.de",0],["golem.de",[0,9,10]],["gruenderlexikon.de",0],["gusto.at",0],["gut-erklaert.de",0],["gutfuerdich.co",0],["hallo-muenchen.de",0],["hamburg.de",0],["hanauer.de",0],["hardwareluxx.de",0],["hartziv.org",0],["harzkurier.de",0],["haus-garten-test.de",0],["hausgarten.net",0],["haustec.de",0],["haz.de",0],["heidelberg24.de",0],["heilpraxisnet.de",0],["heise.de",0],["helmstedter-nachrichten.de",0],["hersfelder-zeitung.de",0],["hftg.co",0],["hifi-forum.de",0],["hna.de",0],["hochheimer-zeitung.de",0],["hoerzu.de",0],["hofheimer-zeitung.de",0],["iban-rechner.de",0],["ikz-online.de",0],["immobilienscout24.de",0],["ingame.de",0],["inside-digital.de",0],["inside-handy.de",0],["investor-verlag.de",0],["jappy.com",0],["jpgames.de",0],["kabeleins.de",0],["kachelmannwetter.com",0],["kamelle.de",0],["kicker.de",0],["kindergeld.org",0],["klettern-magazin.de",0],["klettern.de",0],["kochbar.de",0],["kreis-anzeiger.de",0],["kreisbote.de",0],["kreiszeitung.de",0],["ksta.de",0],["kurierverlag.de",0],["lachainemeteo.com",0],["lampertheimer-zeitung.de",0],["landwirt.com",0],["laut.de",0],["lauterbacher-anzeiger.de",0],["leckerschmecker.me",0],["leinetal24.de",0],["lesfoodies.com",0],["levif.be",0],["lifeline.de",0],["liga3-online.de",0],["likemag.com",0],["linux-community.de",0],["linux-magazin.de",0],["live.vodafone.de",0],["ln-online.de",0],["lokalo24.de",0],["lustaufsleben.at",0],["lustich.de",0],["lvz.de",0],["lz.de",0],["macwelt.de",0],["macworld.co.uk",0],["mail.de",0],["main-spitze.de",0],["manager-magazin.de",0],["manga-tube.me",0],["mathebibel.de",0],["mathepower.com",0],["maz-online.de",0],["medisite.fr",0],["mehr-tanken.de",0],["mein-kummerkasten.de",0],["mein-mmo.de",0],["mein-wahres-ich.de",0],["meine-anzeigenzeitung.de",0],["meinestadt.de",0],["menshealth.de",0],["mercato365.com",0],["merkur.de",0],["messen.de",0],["metal-hammer.de",0],["metalflirt.de",0],["meteologix.com",0],["minecraft-serverlist.net",0],["mittelbayerische.de",0],["modhoster.de",0],["moin.de",0],["mopo.de",0],["morgenpost.de",0],["motor-talk.de",0],["motorbasar.de",0],["motorradonline.de",0],["motorsport-total.com",0],["motortests.de",0],["mountainbike-magazin.de",0],["moviejones.de",0],["moviepilot.de",0],["mt.de",0],["mtb-news.de",0],["musiker-board.de",0],["musikexpress.de",0],["musikradar.de",0],["mz-web.de",0],["n-tv.de",0],["naumburger-tageblatt.de",0],["netzwelt.de",0],["neuepresse.de",0],["neueroeffnung.info",0],["news.at",0],["news.de",0],["news38.de",0],["newsbreak24.de",0],["nickles.de",0],["nicknight.de",0],["nl.hardware.info",0],["nn.de",0],["nnn.de",0],["nordbayern.de",0],["notebookchat.com",0],["notebookcheck-ru.com",0],["notebookcheck-tr.com",0],["noz-cdn.de",0],["noz.de",0],["nrz.de",0],["nw.de",0],["nwzonline.de",0],["oberhessische-zeitung.de",0],["oeffentlicher-dienst.info",0],["onlinekosten.de",0],["onvista.de",0],["op-marburg.de",0],["op-online.de",0],["outdoor-magazin.com",0],["outdoorchannel.de",0],["paradisi.de",0],["pc-magazin.de",0],["pcgames.de",0],["pcgameshardware.de",0],["pcwelt.de",0],["pcworld.es",0],["peiner-nachrichten.de",0],["pferde.de",0],["pietsmiet.de",0],["pixelio.de",0],["pkw-forum.de",0],["playboy.de",0],["playfront.de",0],["pnn.de",0],["pons.com",0],["prad.de",[0,133]],["prignitzer.de",0],["profil.at",0],["promipool.de",0],["promobil.de",0],["prosiebenmaxx.de",0],["psychic.de",[0,158]],["quoka.de",0],["radio.at",0],["radio.de",0],["radio.dk",0],["radio.es",0],["radio.fr",0],["radio.it",0],["radio.net",0],["radio.pl",0],["radio.pt",0],["radio.se",0],["ran.de",0],["readmore.de",0],["rechtslupe.de",0],["recording.de",0],["rennrad-news.de",0],["reuters.com",0],["reviersport.de",0],["rhein-main-presse.de",0],["rheinische-anzeigenblaetter.de",0],["rimondo.com",0],["roadbike.de",0],["roemische-zahlen.net",0],["rollingstone.de",0],["rot-blau.com",0],["rp-online.de",0],["rtl.de",[0,268]],["rtv.de",0],["rugby365.fr",0],["ruhr24.de",0],["rundschau-online.de",0],["runnersworld.de",0],["safelist.eu",0],["salzgitter-zeitung.de",0],["sat1.de",0],["sat1gold.de",0],["schoener-wohnen.de",0],["schwaebische-post.de",0],["schwarzwaelder-bote.de",0],["serienjunkies.de",0],["shz.de",0],["sixx.de",0],["skodacommunity.de",0],["smart-wohnen.net",0],["sn.at",0],["sozialversicherung-kompetent.de",0],["spiegel.de",0],["spielen.de",0],["spieletipps.de",0],["spielfilm.de",0],["sport.de",0],["sport365.fr",0],["sportal.de",0],["spox.com",0],["stern.de",0],["stuttgarter-nachrichten.de",0],["stuttgarter-zeitung.de",0],["sueddeutsche.de",0],["svz.de",0],["szene1.at",0],["szene38.de",0],["t-online.de",0],["tagesspiegel.de",0],["taschenhirn.de",0],["techadvisor.co.uk",0],["techstage.de",0],["tele5.de",0],["the-voice-of-germany.de",0],["thueringen24.de",0],["tichyseinblick.de",0],["tierfreund.co",0],["tiervermittlung.de",0],["torgranate.de",0],["trend.at",0],["tv-media.at",0],["tvdigital.de",0],["tvinfo.de",0],["tvspielfilm.de",0],["tvtoday.de",0],["tz.de",0],["unicum.de",0],["unnuetzes.com",0],["unsere-helden.com",0],["unterhalt.net",0],["usinger-anzeiger.de",0],["usp-forum.de",0],["videogameszone.de",0],["vienna.at",0],["vip.de",0],["virtualnights.com",0],["vox.de",0],["wa.de",0],["wallstreet-online.de",[0,3]],["waz.de",0],["weather.us",0],["webfail.com",0],["weihnachten.me",0],["weihnachts-bilder.org",0],["weihnachts-filme.com",0],["welt.de",0],["weltfussball.at",0],["weristdeinfreund.de",0],["werkzeug-news.de",0],["werra-rundschau.de",0],["wetterauer-zeitung.de",0],["wiesbadener-kurier.de",0],["wiesbadener-tagblatt.de",0],["winboard.org",0],["windows-7-forum.net",0],["winfuture.de",0],["wintotal.de",0],["wlz-online.de",0],["wn.de",0],["wohngeld.org",0],["wolfenbuetteler-zeitung.de",0],["wolfsburger-nachrichten.de",0],["woman.at",0],["womenshealth.de",0],["wormser-zeitung.de",0],["woxikon.de",0],["wp.de",0],["wr.de",0],["yachtrevue.at",0],["ze.tt",0],["zeit.de",0],["meineorte.com",1],["osthessen-news.de",1],["techadvisor.com",1],["focus.de",1],["teltarif.de",4],["economictimes.indiatimes.com",5],["m.timesofindia.com",6],["timesofindia.indiatimes.com",6],["youmath.it",6],["redensarten-index.de",6],["lesoir.be",6],["electriciansforums.net",6],["keralatelecom.info",6],["universegunz.net",6],["happypenguin.altervista.org",6],["everyeye.it",6],["bluedrake42.com",6],["streamservicehd.click",6],["supermarioemulator.com",6],["futbollibrehd.com",6],["newsrade.com",6],["eska.pl",6],["eskarock.pl",6],["voxfm.pl",6],["mathaeser.de",6],["freethesaurus.com",8],["thefreedictionary.com",8],["hdbox.ws",10],["todopolicia.com",10],["scat.gold",10],["freecoursesite.com",10],["windowcleaningforums.co.uk",10],["cruisingearth.com",10],["hobby-machinist.com",10],["freegogpcgames.com",10],["latitude.to",10],["kitchennovel.com",10],["w3layouts.com",10],["blog.receivefreesms.co.uk",10],["eductin.com",10],["dealsfinders.blog",10],["audiobooks4soul.com",10],["tinhocdongthap.com",10],["sakarnewz.com",10],["downloadr.in",10],["topcomicporno.com",10],["dongknows.com",10],["traderepublic.community",10],["celtadigital.com",10],["iptvrun.com",10],["adsup.lk",10],["cryptomonitor.in",10],["areatopik.com",10],["cardscanner.co",10],["nullforums.net",10],["courseclub.me",10],["tamarindoyam.com",10],["jeep-cj.com",10],["choiceofmods.com",10],["myqqjd.com",10],["ssdtop.com",10],["apkhex.com",10],["gezegenforum.com",10],["mbc2.live",10],["iptvapps.net",10],["null-scripts.net",10],["nullscripts.net",10],["bloground.ro",10],["witcherhour.com",10],["ottverse.com",10],["torrentmac.net",10],["mazakony.com",10],["laptechinfo.com",10],["mc-at.org",10],["playstationhaber.com",10],["mangapt.com",10],["seriesperu.com",10],["pesprofessionals.com",10],["wpsimplehacks.com",10],["sportshub.to",[10,267]],["topsporter.net",[10,267]],["darkwanderer.net",10],["truckingboards.com",10],["coldfrm.org",10],["azrom.net",10],["freepatternsarea.com",10],["alttyab.net",10],["hq-links.com",10],["mobilkulup.com",10],["esopress.com",10],["rttar.com",10],["nesiaku.my.id",10],["jipinsoft.com",10],["surfsees.com",10],["truthnews.de",10],["farsinama.com",10],["worldofiptv.com",10],["vuinsider.com",10],["crazydl.net",10],["gamemodsbase.com",10],["babiato.tech",10],["secuhex.com",10],["turkishaudiocenter.com",10],["galaxyos.net",10],["blackhatworld.com",10],["bizdustry.com",10],["storefront.com.ng",10],["pkbiosfix.com",10],["casi3.xyz",10],["geektime.co.il",11],["mediafire.com",12],["wcoanimedub.tv",13],["wcoforever.net",13],["openspeedtest.com",13],["addtobucketlist.com",13],["3dzip.org",[13,86]],["ilmeteo.it",13],["wcoforever.com",13],["comprovendolibri.it",13],["healthelia.com",13],["keephealth.info",14],["australianfrequentflyer.com.au",15],["afreesms.com",16],["kinoger.re",16],["laksa19.github.io",16],["javcl.com",16],["tvlogy.to",16],["live.dragaoconnect.net",16],["beststremo.com",16],["seznam.cz",16],["seznamzpravy.cz",16],["xerifetech.com",16],["wallpapershome.com",18],["ville-ideale.fr",19],["calciomercato.it",20],["calciomercato.com",21],["bersamatekno.com",21],["hotpornfile.org",21],["robloxscripts.com",21],["coolsoft.altervista.org",21],["worldcupfootball.me",[21,26]],["hackedonlinegames.com",21],["jkoding.xyz",21],["cheater.ninja",21],["settlersonlinemaps.com",21],["magdownload.org",21],["kpkuang.org",21],["shareus.site",21],["crypto4yu.com",21],["faucetwork.space",21],["thenightwithoutthedawn.blogspot.com",21],["entutes.com",21],["claimlite.club",21],["bazadecrypto.com",[21,313]],["whosampled.com",22],["imgkings.com",23],["pornvideotop.com",23],["krotkoosporcie.pl",23],["anghami.com",24],["wired.com",25],["tutele.sx",26],["footyhunter3.xyz",26],["magesypro.pro",[27,28]],["audiotools.pro",28],["magesy.blog",28],["audioztools.com",[28,29]],["altblogger.net",29],["hl-live.de",29],["wohnmobilforum.de",29],["nulledbear.com",29],["satoshi-win.xyz",29],["encurtandourl.com",[29,150]],["freedeepweb.blogspot.com",29],["freesoft.id",29],["zcteam.id",29],["www-daftarharga.blogspot.com",29],["ear-phone-review.com",29],["telefullenvivo.com",29],["listatv.pl",29],["ltc-faucet.xyz",29],["coin-profits.xyz",29],["relampagomovies.com",29],["katestube.com",30],["short.pe",30],["footystreams.net",30],["seattletimes.com",31],["yiv.com",32],["globalrph.com",33],["e-glossa.it",34],["java-forum.org",35],["comunidadgzone.es",35],["mp3fy.com",35],["lebensmittelpraxis.de",35],["ebookdz.com",35],["forum-pokemon-go.fr",35],["praxis-jugendarbeit.de",35],["gdrivez.xyz",35],["dictionnaire-medical.net",35],["cle0desktop.blogspot.com",35],["up-load.io",35],["direct-link.net",35],["direkt-wissen.com",35],["keysbrasil.blogspot.com",35],["hotpress.info",35],["turkleech.com",35],["anibatch.me",35],["anime-i.com",35],["plex-guide.de",35],["healthtune.site",35],["gewinde-normen.de",35],["tucinehd.com",35],["freewebscript.com",36],["webcheats.com.br",37],["gala.fr",39],["gentside.com",39],["geo.fr",39],["hbrfrance.fr",39],["nationalgeographic.fr",39],["ohmymag.com",39],["serengo.net",39],["vsd.fr",39],["updato.com",[40,57]],["methbox.com",41],["daizurin.com",41],["pendekarsubs.us",41],["dreamfancy.org",41],["rysafe.blogspot.com",41],["techacode.com",41],["toppng.com",41],["th-world.com",41],["avjamack.com",41],["avjamak.net",41],["tickzoo.tv",42],["dlhd.sx",43],["embedstream.me",43],["yts-subs.net",43],["cnnamador.com",44],["nudecelebforum.com",45],["pronpic.org",46],["thewebflash.com",47],["discordfastfood.com",47],["xup.in",47],["popularmechanics.com",48],["op.gg",49],["lequipe.fr",50],["jellynote.com",51],["eporner.com",53],["pornbimbo.com",54],["allmonitors24.com",54],["4j.com",54],["avoiderrors.com",55],["cgtips.org",[55,212]],["sitarchive.com",55],["livenewsof.com",55],["topnewsshow.com",55],["gatcha.org",55],["empregoestagios.com",55],["everydayonsales.com",55],["kusonime.com",55],["aagmaal.xyz",55],["suicidepics.com",55],["codesnail.com",55],["codingshiksha.com",55],["graphicux.com",55],["hardcoregames.ca",55],["asyadrama.com",55],["bitcoinegypt.news",55],["citychilli.com",55],["talkjarvis.com",55],["hdmotori.it",56],["femdomtb.com",58],["camhub.cc",58],["bobs-tube.com",58],["ru-xvideos.me",58],["pornfd.com",58],["popno-tour.net",58],["molll.mobi",58],["watchmdh.to",58],["camwhores.tv",58],["elfqrin.com",59],["satcesc.com",60],["apfelpatient.de",60],["lusthero.com",61],["m2list.com",62],["embed.nana2play.com",62],["elahmad.com",62],["dofusports.xyz",62],["dallasnews.com",63],["lnk.news",64],["lnk.parts",64],["efukt.com",65],["wendycode.com",65],["springfieldspringfield.co.uk",66],["porndoe.com",67],["smsget.net",[68,69]],["kjanime.net",70],["gioialive.it",71],["classicreload.com",72],["chicoer.com",73],["bostonherald.com",73],["dailycamera.com",73],["maxcheaters.com",74],["rbxoffers.com",74],["mhn.quest",74],["leagueofgraphs.com",74],["hieunguyenphoto.com",74],["texteditor.nsspot.net",74],["postimees.ee",74],["police.community",74],["gisarea.com",74],["schaken-mods.com",74],["theclashify.com",74],["newscon.org",74],["txori.com",74],["olarila.com",74],["deletedspeedstreams.blogspot.com",74],["schooltravelorganiser.com",74],["xhardhempus.net",74],["sportsplays.com",75],["deinesexfilme.com",77],["einfachtitten.com",77],["halloporno.com",77],["herzporno.com",77],["lesbenhd.com",77],["milffabrik.com",[77,242]],["porn-monkey.com",77],["porndrake.com",77],["pornhubdeutsch.net",77],["pornoaffe.com",77],["pornodavid.com",77],["pornoente.tv",[77,242]],["pornofisch.com",77],["pornofelix.com",77],["pornohammer.com",77],["pornohelm.com",77],["pornoklinge.com",77],["pornotom.com",[77,242]],["pornotommy.com",77],["pornovideos-hd.com",77],["pornozebra.com",[77,242]],["xhamsterdeutsch.xyz",77],["xnxx-sexfilme.com",77],["zerion.cc",77],["letribunaldunet.fr",78],["vladan.fr",78],["live-tv-channels.org",79],["eslfast.com",80],["freegamescasual.com",81],["tcpvpn.com",82],["oko.sh",82],["timesnownews.com",82],["timesnowhindi.com",82],["timesnowmarathi.com",82],["zoomtventertainment.com",82],["xxxuno.com",83],["sholah.net",84],["2rdroid.com",84],["bisceglielive.it",85],["pandajogosgratis.com.br",87],["5278.cc",88],["tonspion.de",90],["duplichecker.com",91],["plagiarismchecker.co",91],["plagiarismdetector.net",91],["searchenginereports.net",91],["smallseotools.com",91],["giallozafferano.it",92],["autojournal.fr",92],["autoplus.fr",92],["sportauto.fr",92],["linkspaid.com",93],["proxydocker.com",93],["beeimg.com",[94,95]],["emturbovid.com",95],["ftlauderdalebeachcam.com",96],["ftlauderdalewebcam.com",96],["juneauharborwebcam.com",96],["keywestharborwebcam.com",96],["kittycatcam.com",96],["mahobeachcam.com",96],["miamiairportcam.com",96],["morganhillwebcam.com",96],["njwildlifecam.com",96],["nyharborwebcam.com",96],["paradiseislandcam.com",96],["pompanobeachcam.com",96],["portbermudawebcam.com",96],["portcanaveralwebcam.com",96],["portevergladeswebcam.com",96],["portmiamiwebcam.com",96],["portnywebcam.com",96],["portnassauwebcam.com",96],["portstmaartenwebcam.com",96],["portstthomaswebcam.com",96],["porttampawebcam.com",96],["sxmislandcam.com",96],["gearingcommander.com",96],["themes-dl.com",96],["badassdownloader.com",96],["badasshardcore.com",96],["badassoftcore.com",96],["nulljungle.com",96],["teevee.asia",96],["otakukan.com",96],["linksht.com",98],["generate.plus",99],["calculate.plus",99],["avcesar.com",100],["audiotag.info",101],["tudigitale.it",102],["ibcomputing.com",103],["eodev.com",104],["legia.net",105],["acapellas4u.co.uk",106],["streamhentaimovies.com",107],["konten.co.id",108],["diariodenavarra.es",109],["scripai.com",109],["myfxbook.com",109],["whatfontis.com",109],["xiaomifans.pl",110],["eletronicabr.com",110],["optifine.net",111],["luzernerzeitung.ch",112],["tagblatt.ch",112],["spellcheck.net",113],["spellchecker.net",113],["spellweb.com",113],["ableitungsrechner.net",114],["alternet.org",115],["gourmetsupremacy.com",115],["imtranslator.net",116],["shrib.com",117],["pandafiles.com",118],["vidia.tv",[118,139]],["hortonanderfarom.blogspot.com",118],["clarifystraight.com",118],["tutelehd3.xyz",119],["mega4upload.com",119],["coolcast2.com",119],["techclips.net",119],["earthquakecensus.com",119],["footyhunter.lol",119],["gamerarcades.com",119],["poscitech.click",119],["starlive.stream",119],["utopianwilderness.com",119],["wecast.to",119],["sportbar.live",119],["lordchannel.com",119],["play-old-pc-games.com",120],["tunovelaligera.com",121],["tapchipi.com",121],["cuitandokter.com",121],["tech-blogs.com",121],["cardiagn.com",121],["dcleakers.com",121],["esgeeks.com",121],["pugliain.net",121],["uplod.net",121],["worldfreeware.com",121],["fikiri.net",121],["myhackingworld.com",121],["phoenixfansub.com",121],["freecourseweb.com",122],["devcourseweb.com",122],["coursewikia.com",122],["courseboat.com",122],["coursehulu.com",122],["lne.es",126],["pornult.com",127],["webcamsdolls.com",127],["bitcotasks.com",127],["adsy.pw",127],["playstore.pw",127],["exactpay.online",127],["thothd.to",127],["proplanta.de",128],["hydrogenassociation.org",129],["ludigames.com",129],["sportitalialive.com",129],["tii.la",129],["made-by.org",129],["xenvn.com",129],["worldtravelling.com",129],["igirls.in",129],["technichero.com",129],["roshiyatech.my.id",129],["24sport.stream",129],["aeroxplorer.com",129],["mad4wheels.com",130],["logi.im",130],["emailnator.com",130],["textograto.com",131],["voyageforum.com",132],["hmc-id.blogspot.com",132],["jemerik.com",132],["myabandonware.com",132],["chatta.it",134],["ketubanjiwa.com",135],["nsfw247.to",136],["funzen.net",136],["fighter.stream",136],["ilclubdellericette.it",136],["hubstream.in",136],["extremereportbot.com",137],["getintopc.com",138],["qoshe.com",140],["lowellsun.com",141],["mamadu.pl",141],["dobrapogoda24.pl",141],["motohigh.pl",141],["namasce.pl",141],["ultimate-catch.eu",142],["cpopchanelofficial.com",143],["creditcardgenerator.com",144],["creditcardrush.com",144],["bostoncommons.net",144],["thejobsmovie.com",144],["livsavr.co",144],["nilopolisonline.com.br",145],["mesquitaonline.com",145],["yellowbridge.com",145],["socialgirls.im",146],["yaoiotaku.com",147],["camhub.world",148],["moneyhouse.ch",149],["ihow.info",150],["filesus.com",150],["sturls.com",150],["re.two.re",150],["turbo1.co",150],["cartoonsarea.xyz",150],["valeronevijao.com",151],["cigarlessarefy.com",151],["figeterpiazine.com",151],["yodelswartlike.com",151],["generatesnitrosate.com",151],["crownmakermacaronicism.com",151],["chromotypic.com",151],["gamoneinterrupted.com",151],["metagnathtuggers.com",151],["wolfdyslectic.com",151],["rationalityaloelike.com",151],["sizyreelingly.com",151],["simpulumlamerop.com",151],["urochsunloath.com",151],["monorhinouscassaba.com",151],["counterclockwisejacky.com",151],["35volitantplimsoles5.com",151],["scatch176duplicities.com",151],["antecoxalbobbing1010.com",151],["boonlessbestselling244.com",151],["cyamidpulverulence530.com",151],["guidon40hyporadius9.com",151],["449unceremoniousnasoseptal.com",151],["19turanosephantasia.com",151],["30sensualizeexpression.com",151],["321naturelikefurfuroid.com",151],["745mingiestblissfully.com",151],["availedsmallest.com",151],["greaseball6eventual20.com",151],["toxitabellaeatrebates306.com",151],["20demidistance9elongations.com",151],["audaciousdefaulthouse.com",151],["fittingcentermondaysunday.com",151],["fraudclatterflyingcar.com",151],["launchreliantcleaverriver.com",151],["matriculant401merited.com",151],["realfinanceblogcenter.com",151],["reputationsheriffkennethsand.com",151],["telyn610zoanthropy.com",151],["tubelessceliolymph.com",151],["tummulerviolableness.com",151],["un-block-voe.net",151],["v-o-e-unblock.com",151],["voe-un-block.com",151],["voeun-block.net",151],["voeunbl0ck.com",151],["voeunblck.com",151],["voeunblk.com",151],["voeunblock.com",151],["voeunblock1.com",151],["voeunblock2.com",151],["voeunblock3.com",151],["agefi.fr",152],["cariskuy.com",153],["letras2.com",153],["yusepjaelani.blogspot.com",154],["letras.mus.br",155],["cheatermad.com",156],["mtlurb.com",157],["port.hu",158],["acdriftingpro.com",158],["flight-report.com",158],["forumdz.com",158],["abandonmail.com",158],["flmods.com",158],["zilinak.sk",158],["projectfreetv.stream",158],["hotdesimms.com",158],["pdfaid.com",158],["mconverter.eu",158],["dzeko11.net",[158,267]],["mail.com",158],["expresskaszubski.pl",158],["moegirl.org.cn",158],["onemanhua.com",159],["t3n.de",160],["allindiaroundup.com",161],["vectorizer.io",162],["smgplaza.com",162],["ftuapps.dev",162],["onehack.us",162],["thapcam.net",162],["thefastlaneforum.com",163],["trade2win.com",164],["gmodleaks.com",164],["modagamers.com",165],["freemagazines.top",165],["straatosphere.com",165],["nullpk.com",165],["adslink.pw",165],["downloadudemy.com",165],["picgiraffe.com",165],["weadown.com",165],["freepornsex.net",165],["nurparatodos.com.ar",165],["librospreuniversitariospdf.blogspot.com",166],["msdos-games.com",166],["forexeen.us",166],["khsm.io",166],["girls-like.me",166],["webcreator-journal.com",166],["nu6i-bg-net.com",166],["routech.ro",167],["hokej.net",167],["turkmmo.com",168],["palermotoday.it",169],["baritoday.it",169],["trentotoday.it",169],["agrigentonotizie.it",169],["anconatoday.it",169],["arezzonotizie.it",169],["avellinotoday.it",169],["bresciatoday.it",169],["brindisireport.it",169],["casertanews.it",169],["cataniatoday.it",169],["cesenatoday.it",169],["chietitoday.it",169],["forlitoday.it",169],["frosinonetoday.it",169],["genovatoday.it",169],["ilpescara.it",169],["ilpiacenza.it",169],["latinatoday.it",169],["lecceprima.it",169],["leccotoday.it",169],["livornotoday.it",169],["messinatoday.it",169],["milanotoday.it",169],["modenatoday.it",169],["monzatoday.it",169],["novaratoday.it",169],["padovaoggi.it",169],["parmatoday.it",169],["perugiatoday.it",169],["pisatoday.it",169],["quicomo.it",169],["ravennatoday.it",169],["reggiotoday.it",169],["riminitoday.it",169],["romatoday.it",169],["salernotoday.it",169],["sondriotoday.it",169],["sportpiacenza.it",169],["ternitoday.it",169],["today.it",169],["torinotoday.it",169],["trevisotoday.it",169],["triesteprima.it",169],["udinetoday.it",169],["veneziatoday.it",169],["vicenzatoday.it",169],["thumpertalk.com",170],["arkcod.org",170],["facciabuco.com",171],["softx64.com",172],["thelayoff.com",173],["shorterall.com",173],["blog24.me",173],["maxstream.video",173],["maxlinks.online",173],["tvepg.eu",173],["pstream.net",174],["libreriamo.it",175],["postazap.com",175],["medebooks.xyz",175],["tutorials-technology.info",175],["mashtips.com",175],["marriedgames.com.br",175],["4allprograms.me",175],["nurgsm.com",175],["certbyte.com",175],["plugincrack.com",175],["gamingdeputy.com",175],["freewebcart.com",175],["dailymaverick.co.za",176],["apps2app.com",177],["fm-arena.com",178],["tradersunion.com",179],["tandess.com",180],["visionpapers.org",181],["spontacts.com",182],["enit.in",183],["financerites.com",183],["fadedfeet.com",184],["homeculina.com",184],["ineedskin.com",184],["kenzo-flowertag.com",184],["lawyex.co",184],["mdn.lol",184],["bitzite.com",185],["coingraph.us",186],["impact24.us",186],["my-code4you.blogspot.com",187],["leakgaming.fr",188],["vrcmods.com",189],["osuskinner.com",189],["osuskins.net",189],["pentruea.com",[190,191]],["mchacks.net",192],["why-tech.it",193],["compsmag.com",194],["tapetus.pl",195],["gaystream.online",196],["embedv.net",196],["fslinks.org",196],["v6embed.xyz",196],["vgplayer.xyz",196],["vid-guard.com",196],["autoroad.cz",197],["brawlhalla.fr",197],["tecnobillo.com",197],["sexcamfreeporn.com",198],["breatheheavy.com",199],["wenxuecity.com",200],["key-hub.eu",201],["fabioambrosi.it",202],["tattle.life",203],["emuenzen.de",203],["terrylove.com",203],["mynet.com",204],["cidade.iol.pt",205],["fantacalcio.it",206],["hentaifreak.org",207],["hypebeast.com",208],["krankheiten-simulieren.de",209],["catholic.com",210],["3dmodelshare.org",211],["gourmetscans.net",212],["techinferno.com",213],["ibeconomist.com",214],["bookriot.com",215],["purposegames.com",216],["schoolcheats.net",216],["globo.com",217],["latimes.com",217],["claimrbx.gg",218],["perelki.net",219],["vpn-anbieter-vergleich-test.de",220],["livingincebuforums.com",221],["paperzonevn.com",222],["alltechnerd.com",223],["malaysianwireless.com",224],["erinsakura.com",225],["infofuge.com",225],["freejav.guru",225],["novelmultiverse.com",225],["fritidsmarkedet.dk",226],["maskinbladet.dk",226],["15min.lt",227],["lewdninja.com",228],["lewd.ninja",228],["baddiehub.com",229],["mr9soft.com",230],["21porno.com",231],["adult-sex-gamess.com",232],["hentaigames.app",232],["mobilesexgamesx.com",232],["mysexgamer.com",232],["porngameshd.com",232],["sexgamescc.com",232],["xnxx-sex-videos.com",232],["f2movies.to",233],["freeporncave.com",234],["tubsxxx.com",235],["pornojenny.com",236],["subtitle.one",237],["manga18fx.com",238],["freebnbcoin.com",238],["sextvx.com",239],["studydhaba.com",240],["freecourse.tech",240],["victor-mochere.com",240],["papunika.com",240],["mobilanyheter.net",240],["prajwaldesai.com",240],["muztext.com",241],["pornohans.com",242],["nursexfilme.com",242],["pornohirsch.net",242],["xhamster-sexvideos.com",242],["pornoschlange.com",242],["hdpornos.net",242],["gutesexfilme.com",242],["short1.site",242],["zona-leros.com",242],["charbelnemnom.com",243],["simplebits.io",244],["online-fix.me",245],["gamersdiscussionhub.com",246],["owlzo.com",247],["q1003.com",248],["blogpascher.com",249],["testserver.pro",250],["lifestyle.bg",250],["money.bg",250],["news.bg",250],["topsport.bg",250],["webcafe.bg",250],["mgnet.xyz",251],["advertiserandtimes.co.uk",252],["xvideos2020.me",253],["111.90.159.132",254],["techsolveprac.com",255],["joomlabeginner.com",256],["largescaleforums.com",257],["dubznetwork.com",258],["mundodonghua.com",258],["hentaidexy.com",259],["oceanplay.org",260],["code2care.org",261],["xxxxsx.com",263],["ngontinh24.com",264],["panel.freemcserver.net",265],["idevicecentral.com",266],["zona11.com",267],["scsport.live",267],["mangacrab.com",269],["idnes.cz",270],["viefaucet.com",271],["cloud-computing-central.com",272],["afk.guide",273],["businessnamegenerator.com",274],["derstandard.at",275],["derstandard.de",275],["rocketnews24.com",276],["soranews24.com",276],["youpouch.com",276],["ilsole24ore.com",277],["ipacrack.com",278],["hentaiporn.one",279],["infokik.com",280],["daemonanime.net",281],["daemon-hentai.com",281],["deezer.com",282],["fosslinux.com",283],["shrdsk.me",284],["examword.com",285],["sempreupdate.com.br",285],["tribuna.com",286],["trendsderzukunft.de",287],["gal-dem.com",287],["lostineu.eu",287],["oggitreviso.it",287],["speisekarte.de",287],["mixed.de",287],["lightnovelspot.com",[288,289]],["lightnovelworld.com",[288,289]],["novelpub.com",[288,289]],["webnovelpub.com",[288,289]],["mail.yahoo.com",290],["hwzone.co.il",291],["nammakalvi.com",292],["javmoon.me",293],["c2g.at",294],["terafly.me",294],["elamigos-games.com",294],["elamigos-games.net",294],["dktechnicalmate.com",295],["recipahi.com",295],["converter-btc.world",295],["kaystls.site",296],["aquarius-horoscopes.com",297],["cancer-horoscopes.com",297],["dubipc.blogspot.com",297],["echoes.gr",297],["engel-horoskop.de",297],["freegames44.com",297],["fuerzasarmadas.eu",297],["gemini-horoscopes.com",297],["jurukunci.net",297],["krebs-horoskop.com",297],["leo-horoscopes.com",297],["maliekrani.com",297],["nklinks.click",297],["ourenseando.es",297],["pisces-horoscopes.com",297],["radio-en-direct.fr",297],["sagittarius-horoscopes.com",297],["scorpio-horoscopes.com",297],["singlehoroskop-loewe.de",297],["skat-karten.de",297],["skorpion-horoskop.com",297],["taurus-horoscopes.com",297],["the1security.com",297],["torrentmovies.online",297],["virgo-horoscopes.com",297],["zonamarela.blogspot.com",297],["yoima.hatenadiary.com",297],["vpntester.org",298],["watchhentai.net",299],["japscan.lol",300],["digitask.ru",301],["tempumail.com",302],["sexvideos.host",303],["10alert.com",305],["cryptstream.de",306],["nydus.org",306],["techhelpbd.com",307],["fapdrop.com",308],["cellmapper.net",309],["hdrez.com",310],["youwatch-serie.com",310],["printablecreative.com",311],["comohoy.com",312],["leak.sx",312],["pornleaks.in",312],["merlininkazani.com",312],["faindx.com",314],["j91.asia",315],["jeniusplay.com",316],["indianyug.com",317],["rgb.vn",317],["needrom.com",318],["criptologico.com",319],["megadrive-emulator.com",320],["eromanga-show.com",321],["hentai-one.com",321],["hentaipaw.com",321],["10minuteemails.com",322],["luxusmail.org",322],["w3cub.com",323],["bangpremier.com",324],["nyaa.iss.ink",325],["tnp98.xyz",327],["freepdfcomic.com",328],["memedroid.com",329],["animesync.org",330],["karaoketexty.cz",331],["resortcams.com",332],["sonixgvn.net",333],["mjakmama24.pl",335],["security-demo.extrahop.com",336]]);

const entitiesMap = new Map([["comunio",0],["finanzen",[0,7]],["gameswelt",0],["heftig",0],["notebookcheck",0],["testedich",0],["transfermarkt",0],["truckscout24",0],["tvtv",0],["wetteronline",0],["wieistmeineip",0],["wetter",2],["1337x",6],["eztv",6],["sushi-scan",10],["spigotunlocked",10],["ahmedmode",10],["kissasian",14],["rp5",16],["mma-core",17],["writedroid",21],["yts",26],["720pstream",26],["1stream",26],["magesy",27],["thefmovies",30],["fxporn69",35],["aliancapes",35],["urlcero",38],["totaldebrid",41],["sandrives",41],["oploverz",42],["pouvideo",52],["povvideo",52],["povw1deo",52],["povwideo",52],["powv1deo",52],["powvibeo",52],["powvideo",52],["powvldeo",52],["tubsexer",58],["porno-tour",58],["lenkino",58],["pornomoll",58],["camsclips",58],["m4ufree",62],["crackstreams",62],["telerium",76],["pandafreegames",89],["thoptv",97],["brainly",104],["streameast",119],["thestreameast",119],["daddylivehd",119],["solvetube",123],["hdfilme",124],["pornhub",125],["wcofun",132],["bollyholic",136],["gotxx",150],["turkanime",151],["voe-unblock",151],["khatrimaza",165],["pogolinks",165],["popcornstream",167],["shortzzy",175],["vembed",196],["xhamsterdeutsch",242],["privatemoviez",246],["gmx",262],["lightnovelpub",[288,289]],["camcaps",304],["drivebot",326],["thenextplanet1",327],["autoscout24",334]]);

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
