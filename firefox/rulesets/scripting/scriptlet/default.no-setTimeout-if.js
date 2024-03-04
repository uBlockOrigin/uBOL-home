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

const argsList = [[".call(null)","10"],[".call(null)"],["(null)","10"],["userHasAdblocker"],["objSubPromo"],["adb"],["nrWrapper"],["warn"],["adBlockerDetected"],["show"],["adObjects"],["InfMediafireMobileFunc","1000"],["google_jobrunner"],["()","45000"],["prompt"],["0x"],["displayAdBlockedVideo"],[".adsbygoogle"],["contrformpub","5000"],["disabledAdBlock","10000"],["_0x"],["ads.length"],["location.href"],["isDesktopApp","1000"],["Bait"],["admc"],["AdBlocker"],["Blocked"],["nextFunction"],["'0x"],["apstagLOADED"],["/Adb|moneyDetect/"],["disableDeveloper"],["Blocco","2000"],["documentElement.classList.add","400"],["test","0"],["checkAdblockUser","1000"],["checkPub","6000"],["document.querySelector","5000"],["nextFunction","250"],["popup"],["()","150"],["backRedirect"],["document.querySelectorAll","1000"],["style"],["clientHeight"],["addEventListener","0"],["adblock","2000"],["start","0"],["nextFunction","2000"],["byepopup","5000"],["test.remove","100"],["additional_src","300"],["()","2000"],["css_class.show"],["CANG","3000"],["updato-overlay","500"],["innerText","2000"],["alert","8000"],["css_class"],["()","50"],["debugger"],["initializeCourier","3000"],["redirectPage"],["_0x","2000"],["ads","750"],["location.href","500"],["Adblock","5000"],["disable","200"],["CekAab","0"],["rbm_block_active","1000"],["show()"],["n.trigger","1"],["adblock"],["abDetected"],["KeepOpeningPops","1000"],["appendChild"],["adb","0"],["adBlocked"],["warning","100"],["adblock_popup","500"],["Adblock"],["#chatWrap","1000"],["keep-ads","2000"],["#rbm_block_active","1000"],["null","4000"],["()","2500"],["myaabpfun","3000"],["adFilled","2500"],["()","15000"],["showPopup"],["()","1"],["()","1000"],["document.cookie","2500"],["window.open"],["innerHTML"],["readyplayer","2000"],["checkStopBlock"],["adspot_top","1500"],["/offsetHeight|google|Global/"],["an_message","500"],["Adblocker","10000"],["trigger","0"],["timeoutChecker"],["bait","1"],["pum-open"],["overlay","2000"],["/adblock/i"],["test","100"],["Math.round","1000"],["adblock","5"],["bioEp"],["ag_adBlockerDetected"],["null"],["adsbox","1000"],["adb","6000"],["pop"],["sadbl"],["checkAdStatus"],["mdp"],["brave_load_popup"],["0x","3000"],["invoke"],["adsbytrafficjunkycontext"],["ipod"],["offsetWidth"],["/$|adBlock/"],["ads"],["adsbygoogle"],["()"],["AdBlock"],["stop-scrolling"],["Adv"],["blockUI","2000"],["mdpDeBlocker"],["/_0x|debug/"],["/ai_adb|_0x/"],["iframe"],["adBlock"],["","1"],["undefined"],["check","1"],["adsBlocked"],["blocker"],["aswift_"],["afs_ads","2000"],["visibility","2000"],["bait"],["getComputedStyle","250"],["blocked"],["{r()","0"],["nextFunction","450"],["Debug"],["r()","0"],["offset"],["purple_box"],["offsetHeight"],["checkSiteNormalLoad"],["adBlockOverlay"],["Detected","500"],["modal"],[".show","1000"],[".show"],["showModal"],["getComputedStyle"],["blur"],["samOverlay"],["bADBlock"],["location"],["","4000"],["blocker","100"],["alert"],["length"],["ai_adb"],["t()","0"],["$"],["getComputedStyle","2000"],["video-popup"],["detectAdblock"],["EzoIvent"],["detectAdBlocker"],["nads"],["1e3*"],["","5"],["/adblock|isRequestPresent/"],["_0x","500"],["isRequestPresent"],["offsetLeft"],["height"],["mdp_deblocker"],["charAt"],["checkAds"],["fadeIn","0"],["jQuery"],["/^/"],["afterOpen"],["check"],["Adblocker"],["eabdModal"],["ab_root.show"],["gaData"],["ad"],["prompt","1000"],["googlefc"],["adblock detection"],[".offsetHeight","100"],["popState"],["ad-block-popup"],["exitTimer"],["innerHTML.replace"],["data?","4000"],[".data?"],["eabpDialog"],["adsense"],["/Adblock|_ad_/"],["googletag"],["f.parentNode.removeChild(f)","100"],["swal","500"],["keepChecking","1000"],["openPopup"],[".offsetHeight"],["()=>{"],["nitroAds"],["class.scroll","1000"],["disableDeveloperTools"],["Check"],["insertBefore"],["setAntiAb"],["css_class.scroll"],["/null|Error/","10000"],["window.location.href","50"],["/out.php"],["/0x|devtools/"],["location.replace","300"],["window.location.href"],["checkVisible"],["_0x","3000"],["fetch"],["window.location.href=link"],["ai_"],["reachGoal"],["Adb"],["ai"],["","3000"],["/width|innerHTML/"],["magnificPopup"],["adblockEnabled"],["google_ad"],["document.location"],["google"],["top-right","2000"],["enforceAdStatus"],["loadScripts"],["mfp"],["display","5000"],["eb"],[").show()"],["","1000"],["atob"],["devtool"],["Msg"],["UABP"],["href"],["aaaaa-modal"],["\\x","5000"],["()=>"],["keepChecking"],["null","10"],["","500"],["/Adform|didomi|adblock|forEach/"],["showAdblock"],["-0x"],["display"],["gclid"],["event","3000"],["rejectWith"],["refresh"],["location.href","3000"],["window.location"],["ga"],["adbl"],["Ads"],["ShowAdBLockerNotice"],["ad_listener"],["open"],["(!0)"],["Delay"],["/appendChild|e\\(\"/"],["=>"],["ADB"],["site-access-popup"],["data?"],["/debugger|UserCustomPop/"],["checkAdblockUser"],["offsetHeight","100"],["AdDetect"],["displayMessage","2000"],["/salesPopup|mira-snackbar/"],["advanced"],["detectImgLoad"],["offsetHeight","200"],["detector"],["replace"],["touchstart"],["siteAccessFlag"],["ab"],["/adblocker|alert/"],["redURL"],["/children\\('ins'\\)|Adblock|adsbygoogle/"],["displayMessage"],["chkADB"],["onDetected"],["myinfoey","1500"],["placebo"],["fuckadb"],["detect"],["siteAccessPopup"],["/adsbygoogle|adblock/"],["akadb"],["biteDisplay"],["/[a-z]\\(!0\\)/","800"],["ad_block"],["/detectAdBlocker|window.open/"],["adBlockDetected"],["popUnder"],["/GoToURL|delay/"],["window.location.href","300"],["ad_display"],["/adScriptPath|MMDConfig/"],["0x","100"],["/native|\\{n\\(\\)/"],["adblocker"],["/Detect|adblock|style\\.display|\\[native code]|\\.call\\(null\\)/"],["removeChild"],["ad blocker"]];

const hostnamesMap = new Map([["4-liga.com",0],["4fansites.de",0],["4players.de",0],["9monate.de",0],["aachener-nachrichten.de",0],["aachener-zeitung.de",0],["abendblatt.de",0],["abendzeitung-muenchen.de",0],["about-drinks.com",0],["abseits-ka.de",0],["airliners.de",0],["ajaxshowtime.com",0],["allgemeine-zeitung.de",0],["antenne.de",0],["arcor.de",0],["areadvd.de",0],["areamobile.de",0],["ariva.de",0],["astronews.com",0],["aussenwirtschaftslupe.de",0],["auszeit.bio",0],["auto-motor-und-sport.de",0],["auto-service.de",0],["autobild.de",0],["autoextrem.de",0],["autopixx.de",0],["autorevue.at",0],["az-online.de",0],["baby-vornamen.de",0],["babyclub.de",0],["bafoeg-aktuell.de",0],["berliner-kurier.de",0],["berliner-zeitung.de",0],["bigfm.de",0],["bikerszene.de",0],["bildderfrau.de",0],["blackd.de",0],["blick.de",0],["boerse-online.de",0],["boerse.de",0],["boersennews.de",0],["braunschweiger-zeitung.de",0],["brieffreunde.de",0],["brigitte.de",0],["buerstaedter-zeitung.de",0],["buffed.de",0],["businessinsider.de",0],["buzzfeed.at",0],["buzzfeed.de",0],["caravaning.de",0],["cavallo.de",0],["chefkoch.de",0],["cinema.de",0],["clever-tanken.de",0],["computerbild.de",0],["computerhilfen.de",0],["comunio-cl.com",0],["connect.de",0],["chip.de",0],["da-imnetz.de",0],["dasgelbeblatt.de",0],["dbna.com",0],["dbna.de",0],["deichstube.de",0],["deine-tierwelt.de",0],["der-betze-brennt.de",0],["derwesten.de",0],["desired.de",0],["dhd24.com",0],["dieblaue24.com",0],["digitalfernsehen.de",0],["dnn.de",0],["donnerwetter.de",0],["e-hausaufgaben.de",0],["e-mountainbike.com",0],["eatsmarter.de",0],["echo-online.de",0],["ecomento.de",0],["einfachschoen.me",0],["elektrobike-online.com",0],["eltern.de",0],["epochtimes.de",0],["essen-und-trinken.de",0],["express.de",0],["extratipp.com",0],["familie.de",0],["fanfiktion.de",0],["fehmarn24.de",0],["fettspielen.de",0],["fid-gesundheitswissen.de",0],["finanznachrichten.de",0],["finanztreff.de",0],["finya.de",0],["firmenwissen.de",0],["fitforfun.de",0],["fnp.de",0],["football365.fr",0],["formel1.de",0],["fr.de",0],["frankfurter-wochenblatt.de",0],["freenet.de",0],["fremdwort.de",0],["froheweihnachten.info",0],["frustfrei-lernen.de",0],["fuldaerzeitung.de",0],["funandnews.de",0],["fussballdaten.de",0],["futurezone.de",0],["gala.de",0],["gamepro.de",0],["gamersglobal.de",0],["gamesaktuell.de",0],["gamestar.de",0],["gamezone.de",0],["gartendialog.de",0],["gartenlexikon.de",0],["gedichte.ws",0],["geissblog.koeln",0],["gelnhaeuser-tageblatt.de",0],["general-anzeiger-bonn.de",0],["geniale-tricks.com",0],["genialetricks.de",0],["gesund-vital.de",0],["gesundheit.de",0],["gevestor.de",0],["gewinnspiele.tv",0],["giessener-allgemeine.de",0],["giessener-anzeiger.de",0],["gifhorner-rundschau.de",0],["giga.de",0],["gipfelbuch.ch",0],["gmuender-tagespost.de",0],["golem.de",[0,8,9]],["gruenderlexikon.de",0],["gusto.at",0],["gut-erklaert.de",0],["gutfuerdich.co",0],["hallo-muenchen.de",0],["hamburg.de",0],["hanauer.de",0],["hardwareluxx.de",0],["hartziv.org",0],["harzkurier.de",0],["haus-garten-test.de",0],["hausgarten.net",0],["haustec.de",0],["haz.de",0],["heidelberg24.de",0],["heilpraxisnet.de",0],["heise.de",0],["helmstedter-nachrichten.de",0],["hersfelder-zeitung.de",0],["hftg.co",0],["hifi-forum.de",0],["hna.de",0],["hochheimer-zeitung.de",0],["hoerzu.de",0],["hofheimer-zeitung.de",0],["iban-rechner.de",0],["ikz-online.de",0],["immobilienscout24.de",0],["ingame.de",0],["inside-digital.de",0],["inside-handy.de",0],["investor-verlag.de",0],["jappy.com",0],["jpgames.de",0],["kabeleins.de",0],["kachelmannwetter.com",0],["kamelle.de",0],["kicker.de",0],["kindergeld.org",0],["klettern-magazin.de",0],["klettern.de",0],["kochbar.de",0],["kreis-anzeiger.de",0],["kreisbote.de",0],["kreiszeitung.de",0],["ksta.de",0],["kurierverlag.de",0],["lachainemeteo.com",0],["lampertheimer-zeitung.de",0],["landwirt.com",0],["laut.de",0],["lauterbacher-anzeiger.de",0],["leckerschmecker.me",0],["leinetal24.de",0],["lesfoodies.com",0],["levif.be",0],["lifeline.de",0],["liga3-online.de",0],["likemag.com",0],["linux-community.de",0],["linux-magazin.de",0],["live.vodafone.de",0],["ln-online.de",0],["lokalo24.de",0],["lustaufsleben.at",0],["lustich.de",0],["lvz.de",0],["lz.de",0],["macwelt.de",0],["macworld.co.uk",0],["mail.de",0],["main-spitze.de",0],["manager-magazin.de",0],["manga-tube.me",0],["mathebibel.de",0],["mathepower.com",0],["maz-online.de",0],["medisite.fr",0],["mehr-tanken.de",0],["mein-kummerkasten.de",0],["mein-mmo.de",0],["mein-wahres-ich.de",0],["meine-anzeigenzeitung.de",0],["meinestadt.de",0],["menshealth.de",0],["mercato365.com",0],["merkur.de",0],["messen.de",0],["metal-hammer.de",0],["metalflirt.de",0],["meteologix.com",0],["minecraft-serverlist.net",0],["mittelbayerische.de",0],["modhoster.de",0],["moin.de",0],["mopo.de",0],["morgenpost.de",0],["motor-talk.de",0],["motorbasar.de",0],["motorradonline.de",0],["motorsport-total.com",0],["motortests.de",0],["mountainbike-magazin.de",0],["moviejones.de",0],["moviepilot.de",0],["mt.de",0],["mtb-news.de",0],["musiker-board.de",0],["musikexpress.de",0],["musikradar.de",0],["mz-web.de",0],["n-tv.de",0],["naumburger-tageblatt.de",0],["netzwelt.de",0],["neuepresse.de",0],["neueroeffnung.info",0],["news.at",0],["news.de",0],["news38.de",0],["newsbreak24.de",0],["nickles.de",0],["nicknight.de",0],["nl.hardware.info",0],["nn.de",0],["nnn.de",0],["nordbayern.de",0],["notebookchat.com",0],["notebookcheck-ru.com",0],["notebookcheck-tr.com",0],["noz-cdn.de",0],["noz.de",0],["nrz.de",0],["nw.de",0],["nwzonline.de",0],["oberhessische-zeitung.de",0],["oeffentlicher-dienst.info",0],["onlinekosten.de",0],["onvista.de",0],["op-marburg.de",0],["op-online.de",0],["outdoor-magazin.com",0],["outdoorchannel.de",0],["paradisi.de",0],["pc-magazin.de",0],["pcgames.de",0],["pcgameshardware.de",0],["pcwelt.de",0],["pcworld.es",0],["peiner-nachrichten.de",0],["pferde.de",0],["pietsmiet.de",0],["pixelio.de",0],["pkw-forum.de",0],["playboy.de",0],["playfront.de",0],["pnn.de",0],["pons.com",0],["prad.de",[0,131]],["prignitzer.de",0],["profil.at",0],["promipool.de",0],["promobil.de",0],["prosiebenmaxx.de",0],["psychic.de",[0,156]],["quoka.de",0],["radio.at",0],["radio.de",0],["radio.dk",0],["radio.es",0],["radio.fr",0],["radio.it",0],["radio.net",0],["radio.pl",0],["radio.pt",0],["radio.se",0],["ran.de",0],["readmore.de",0],["rechtslupe.de",0],["recording.de",0],["rennrad-news.de",0],["reuters.com",0],["reviersport.de",0],["rhein-main-presse.de",0],["rheinische-anzeigenblaetter.de",0],["rimondo.com",0],["roadbike.de",0],["roemische-zahlen.net",0],["rollingstone.de",0],["rot-blau.com",0],["rp-online.de",0],["rtl.de",[0,267]],["rtv.de",0],["rugby365.fr",0],["ruhr24.de",0],["rundschau-online.de",0],["runnersworld.de",0],["safelist.eu",0],["salzgitter-zeitung.de",0],["sat1.de",0],["sat1gold.de",0],["schoener-wohnen.de",0],["schwaebische-post.de",0],["schwarzwaelder-bote.de",0],["serienjunkies.de",0],["shz.de",0],["sixx.de",0],["skodacommunity.de",0],["smart-wohnen.net",0],["sn.at",0],["sozialversicherung-kompetent.de",0],["spiegel.de",0],["spielen.de",0],["spieletipps.de",0],["spielfilm.de",0],["sport.de",0],["sport365.fr",0],["sportal.de",0],["spox.com",0],["stern.de",0],["stuttgarter-nachrichten.de",0],["stuttgarter-zeitung.de",0],["sueddeutsche.de",0],["svz.de",0],["szene1.at",0],["szene38.de",0],["t-online.de",0],["tagesspiegel.de",0],["taschenhirn.de",0],["techadvisor.co.uk",0],["techstage.de",0],["tele5.de",0],["the-voice-of-germany.de",0],["thueringen24.de",0],["tichyseinblick.de",0],["tierfreund.co",0],["tiervermittlung.de",0],["torgranate.de",0],["trend.at",0],["tv-media.at",0],["tvdigital.de",0],["tvinfo.de",0],["tvspielfilm.de",0],["tvtoday.de",0],["tz.de",0],["unicum.de",0],["unnuetzes.com",0],["unsere-helden.com",0],["unterhalt.net",0],["usinger-anzeiger.de",0],["usp-forum.de",0],["videogameszone.de",0],["vienna.at",0],["vip.de",0],["virtualnights.com",0],["vox.de",0],["wa.de",0],["wallstreet-online.de",[0,3]],["waz.de",0],["weather.us",0],["webfail.com",0],["weihnachten.me",0],["weihnachts-bilder.org",0],["weihnachts-filme.com",0],["welt.de",0],["weltfussball.at",0],["weristdeinfreund.de",0],["werkzeug-news.de",0],["werra-rundschau.de",0],["wetterauer-zeitung.de",0],["wiesbadener-kurier.de",0],["wiesbadener-tagblatt.de",0],["winboard.org",0],["windows-7-forum.net",0],["winfuture.de",0],["wintotal.de",0],["wlz-online.de",0],["wn.de",0],["wohngeld.org",0],["wolfenbuetteler-zeitung.de",0],["wolfsburger-nachrichten.de",0],["woman.at",0],["womenshealth.de",0],["wormser-zeitung.de",0],["woxikon.de",0],["wp.de",0],["wr.de",0],["yachtrevue.at",0],["ze.tt",0],["zeit.de",0],["meineorte.com",1],["osthessen-news.de",1],["techadvisor.com",1],["focus.de",1],["economictimes.indiatimes.com",4],["m.timesofindia.com",5],["timesofindia.indiatimes.com",5],["youmath.it",5],["redensarten-index.de",5],["lesoir.be",5],["electriciansforums.net",5],["keralatelecom.info",5],["universegunz.net",5],["happypenguin.altervista.org",5],["everyeye.it",5],["bluedrake42.com",5],["streamservicehd.click",5],["supermarioemulator.com",5],["futbollibrehd.com",5],["newsrade.com",5],["eska.pl",5],["eskarock.pl",5],["voxfm.pl",5],["mathaeser.de",5],["freethesaurus.com",7],["thefreedictionary.com",7],["hdbox.ws",9],["todopolicia.com",9],["scat.gold",9],["freecoursesite.com",9],["windowcleaningforums.co.uk",9],["cruisingearth.com",9],["hobby-machinist.com",9],["freegogpcgames.com",9],["latitude.to",9],["kitchennovel.com",9],["w3layouts.com",9],["blog.receivefreesms.co.uk",9],["eductin.com",9],["dealsfinders.blog",9],["audiobooks4soul.com",9],["tinhocdongthap.com",9],["sakarnewz.com",9],["downloadr.in",9],["topcomicporno.com",9],["dongknows.com",9],["traderepublic.community",9],["celtadigital.com",9],["iptvrun.com",9],["adsup.lk",9],["cryptomonitor.in",9],["areatopik.com",9],["cardscanner.co",9],["nullforums.net",9],["courseclub.me",9],["tamarindoyam.com",9],["jeep-cj.com",9],["choiceofmods.com",9],["myqqjd.com",9],["ssdtop.com",9],["apkhex.com",9],["gezegenforum.com",9],["mbc2.live",9],["iptvapps.net",9],["null-scripts.net",9],["nullscripts.net",9],["bloground.ro",9],["witcherhour.com",9],["ottverse.com",9],["torrentmac.net",9],["mazakony.com",9],["laptechinfo.com",9],["mc-at.org",9],["playstationhaber.com",9],["mangapt.com",9],["seriesperu.com",9],["pesprofessionals.com",9],["wpsimplehacks.com",9],["sportshub.to",[9,266]],["topsporter.net",[9,266]],["darkwanderer.net",9],["truckingboards.com",9],["coldfrm.org",9],["azrom.net",9],["freepatternsarea.com",9],["alttyab.net",9],["hq-links.com",9],["mobilkulup.com",9],["esopress.com",9],["rttar.com",9],["nesiaku.my.id",9],["jipinsoft.com",9],["surfsees.com",9],["truthnews.de",9],["farsinama.com",9],["worldofiptv.com",9],["vuinsider.com",9],["crazydl.net",9],["gamemodsbase.com",9],["babiato.tech",9],["secuhex.com",9],["turkishaudiocenter.com",9],["galaxyos.net",9],["blackhatworld.com",9],["bizdustry.com",9],["storefront.com.ng",9],["pkbiosfix.com",9],["casi3.xyz",9],["geektime.co.il",10],["mediafire.com",11],["wcoanimedub.tv",12],["wcoforever.net",12],["openspeedtest.com",12],["addtobucketlist.com",12],["3dzip.org",[12,85]],["ilmeteo.it",12],["wcoforever.com",12],["comprovendolibri.it",12],["healthelia.com",12],["keephealth.info",13],["australianfrequentflyer.com.au",14],["afreesms.com",15],["kinoger.re",15],["laksa19.github.io",15],["javcl.com",15],["tvlogy.to",15],["live.dragaoconnect.net",15],["beststremo.com",15],["seznam.cz",15],["seznamzpravy.cz",15],["xerifetech.com",15],["wallpapershome.com",17],["ville-ideale.fr",18],["calciomercato.it",19],["calciomercato.com",20],["bersamatekno.com",20],["hotpornfile.org",20],["robloxscripts.com",20],["coolsoft.altervista.org",20],["hackedonlinegames.com",20],["jkoding.xyz",20],["cheater.ninja",20],["settlersonlinemaps.com",20],["magdownload.org",20],["kpkuang.org",20],["shareus.site",20],["crypto4yu.com",20],["faucetwork.space",20],["thenightwithoutthedawn.blogspot.com",20],["entutes.com",20],["claimlite.club",20],["bazadecrypto.com",[20,312]],["whosampled.com",21],["imgkings.com",22],["pornvideotop.com",22],["krotkoosporcie.pl",22],["anghami.com",23],["wired.com",24],["tutele.sx",25],["footyhunter3.xyz",25],["magesypro.pro",[26,27]],["audiotools.pro",27],["magesy.blog",27],["audioztools.com",[27,28]],["altblogger.net",28],["hl-live.de",28],["wohnmobilforum.de",28],["nulledbear.com",28],["satoshi-win.xyz",28],["encurtandourl.com",[28,148]],["freedeepweb.blogspot.com",28],["freesoft.id",28],["zcteam.id",28],["www-daftarharga.blogspot.com",28],["ear-phone-review.com",28],["telefullenvivo.com",28],["listatv.pl",28],["ltc-faucet.xyz",28],["coin-profits.xyz",28],["relampagomovies.com",28],["katestube.com",29],["short.pe",29],["footystreams.net",29],["seattletimes.com",30],["yiv.com",31],["globalrph.com",32],["e-glossa.it",33],["freewebscript.com",34],["webcheats.com.br",35],["gala.fr",37],["gentside.com",37],["geo.fr",37],["hbrfrance.fr",37],["nationalgeographic.fr",37],["ohmymag.com",37],["serengo.net",37],["vsd.fr",37],["updato.com",[38,56]],["methbox.com",39],["daizurin.com",39],["pendekarsubs.us",39],["dreamfancy.org",39],["rysafe.blogspot.com",39],["techacode.com",39],["toppng.com",39],["th-world.com",39],["avjamack.com",39],["avjamak.net",39],["tickzoo.tv",40],["dlhd.sx",41],["embedstream.me",41],["yts-subs.net",41],["cnnamador.com",42],["nudecelebforum.com",43],["pronpic.org",44],["thewebflash.com",45],["discordfastfood.com",45],["xup.in",45],["popularmechanics.com",46],["op.gg",47],["lequipe.fr",48],["comunidadgzone.es",49],["mp3fy.com",49],["lebensmittelpraxis.de",49],["ebookdz.com",49],["forum-pokemon-go.fr",49],["praxis-jugendarbeit.de",49],["gdrivez.xyz",49],["dictionnaire-medical.net",49],["cle0desktop.blogspot.com",49],["up-load.io",49],["direct-link.net",49],["direkt-wissen.com",49],["keysbrasil.blogspot.com",49],["hotpress.info",49],["turkleech.com",49],["anibatch.me",49],["anime-i.com",49],["plex-guide.de",49],["healthtune.site",49],["gewinde-normen.de",49],["tucinehd.com",49],["jellynote.com",50],["eporner.com",52],["pornbimbo.com",53],["allmonitors24.com",53],["4j.com",53],["avoiderrors.com",54],["cgtips.org",[54,211]],["sitarchive.com",54],["livenewsof.com",54],["topnewsshow.com",54],["gatcha.org",54],["empregoestagios.com",54],["everydayonsales.com",54],["kusonime.com",54],["aagmaal.xyz",54],["suicidepics.com",54],["codesnail.com",54],["codingshiksha.com",54],["graphicux.com",54],["hardcoregames.ca",54],["asyadrama.com",54],["bitcoinegypt.news",54],["citychilli.com",54],["talkjarvis.com",54],["hdmotori.it",55],["femdomtb.com",57],["camhub.cc",57],["bobs-tube.com",57],["ru-xvideos.me",57],["pornfd.com",57],["popno-tour.net",57],["molll.mobi",57],["watchmdh.to",57],["camwhores.tv",57],["elfqrin.com",58],["satcesc.com",59],["apfelpatient.de",59],["lusthero.com",60],["m2list.com",61],["embed.nana2play.com",61],["elahmad.com",61],["dofusports.xyz",61],["dallasnews.com",62],["lnk.news",63],["lnk.parts",63],["efukt.com",64],["wendycode.com",64],["springfieldspringfield.co.uk",65],["porndoe.com",66],["smsget.net",[67,68]],["kjanime.net",69],["gioialive.it",70],["classicreload.com",71],["chicoer.com",72],["bostonherald.com",72],["dailycamera.com",72],["maxcheaters.com",73],["rbxoffers.com",73],["mhn.quest",73],["leagueofgraphs.com",73],["hieunguyenphoto.com",73],["texteditor.nsspot.net",73],["postimees.ee",73],["police.community",73],["gisarea.com",73],["schaken-mods.com",73],["theclashify.com",73],["newscon.org",73],["txori.com",73],["olarila.com",73],["deletedspeedstreams.blogspot.com",73],["schooltravelorganiser.com",73],["xhardhempus.net",73],["sportsplays.com",74],["deinesexfilme.com",76],["einfachtitten.com",76],["halloporno.com",76],["herzporno.com",76],["lesbenhd.com",76],["milffabrik.com",[76,241]],["porn-monkey.com",76],["porndrake.com",76],["pornhubdeutsch.net",76],["pornoaffe.com",76],["pornodavid.com",76],["pornoente.tv",[76,241]],["pornofisch.com",76],["pornofelix.com",76],["pornohammer.com",76],["pornohelm.com",76],["pornoklinge.com",76],["pornotom.com",[76,241]],["pornotommy.com",76],["pornovideos-hd.com",76],["pornozebra.com",[76,241]],["xhamsterdeutsch.xyz",76],["xnxx-sexfilme.com",76],["zerion.cc",76],["letribunaldunet.fr",77],["vladan.fr",77],["live-tv-channels.org",78],["eslfast.com",79],["freegamescasual.com",80],["tcpvpn.com",81],["oko.sh",81],["timesnownews.com",81],["timesnowhindi.com",81],["timesnowmarathi.com",81],["zoomtventertainment.com",81],["xxxuno.com",82],["sholah.net",83],["2rdroid.com",83],["bisceglielive.it",84],["pandajogosgratis.com.br",86],["5278.cc",87],["tonspion.de",89],["duplichecker.com",90],["plagiarismchecker.co",90],["plagiarismdetector.net",90],["searchenginereports.net",90],["giallozafferano.it",91],["autojournal.fr",91],["autoplus.fr",91],["sportauto.fr",91],["linkspaid.com",92],["proxydocker.com",92],["beeimg.com",[93,94]],["emturbovid.com",94],["ftlauderdalebeachcam.com",95],["ftlauderdalewebcam.com",95],["juneauharborwebcam.com",95],["keywestharborwebcam.com",95],["kittycatcam.com",95],["mahobeachcam.com",95],["miamiairportcam.com",95],["morganhillwebcam.com",95],["njwildlifecam.com",95],["nyharborwebcam.com",95],["paradiseislandcam.com",95],["pompanobeachcam.com",95],["portbermudawebcam.com",95],["portcanaveralwebcam.com",95],["portevergladeswebcam.com",95],["portmiamiwebcam.com",95],["portnywebcam.com",95],["portnassauwebcam.com",95],["portstmaartenwebcam.com",95],["portstthomaswebcam.com",95],["porttampawebcam.com",95],["sxmislandcam.com",95],["gearingcommander.com",95],["themes-dl.com",95],["badassdownloader.com",95],["badasshardcore.com",95],["badassoftcore.com",95],["nulljungle.com",95],["teevee.asia",95],["otakukan.com",95],["generate.plus",97],["calculate.plus",97],["avcesar.com",98],["audiotag.info",99],["tudigitale.it",100],["ibcomputing.com",101],["eodev.com",102],["legia.net",103],["acapellas4u.co.uk",104],["streamhentaimovies.com",105],["konten.co.id",106],["diariodenavarra.es",107],["scripai.com",107],["myfxbook.com",107],["whatfontis.com",107],["xiaomifans.pl",108],["eletronicabr.com",108],["optifine.net",109],["luzernerzeitung.ch",110],["tagblatt.ch",110],["spellcheck.net",111],["spellchecker.net",111],["spellweb.com",111],["ableitungsrechner.net",112],["alternet.org",113],["gourmetsupremacy.com",113],["imtranslator.net",114],["shrib.com",115],["pandafiles.com",116],["vidia.tv",[116,137]],["hortonanderfarom.blogspot.com",116],["clarifystraight.com",116],["tutelehd3.xyz",117],["mega4upload.com",117],["coolcast2.com",117],["techclips.net",117],["earthquakecensus.com",117],["footyhunter.lol",117],["gamerarcades.com",117],["poscitech.click",117],["starlive.stream",117],["utopianwilderness.com",117],["wecast.to",117],["sportbar.live",117],["lordchannel.com",117],["play-old-pc-games.com",118],["tunovelaligera.com",119],["tapchipi.com",119],["cuitandokter.com",119],["tech-blogs.com",119],["cardiagn.com",119],["dcleakers.com",119],["esgeeks.com",119],["pugliain.net",119],["uplod.net",119],["worldfreeware.com",119],["fikiri.net",119],["myhackingworld.com",119],["phoenixfansub.com",119],["freecourseweb.com",120],["devcourseweb.com",120],["coursewikia.com",120],["courseboat.com",120],["coursehulu.com",120],["lne.es",124],["pornult.com",125],["webcamsdolls.com",125],["bitcotasks.com",125],["adsy.pw",125],["playstore.pw",125],["exactpay.online",125],["thothd.to",125],["proplanta.de",126],["hydrogenassociation.org",127],["ludigames.com",127],["sportitalialive.com",127],["tii.la",127],["made-by.org",127],["xenvn.com",127],["worldtravelling.com",127],["igirls.in",127],["technichero.com",127],["roshiyatech.my.id",127],["24sport.stream",127],["aeroxplorer.com",127],["mad4wheels.com",128],["logi.im",128],["emailnator.com",128],["textograto.com",129],["voyageforum.com",130],["hmc-id.blogspot.com",130],["jemerik.com",130],["myabandonware.com",130],["chatta.it",132],["ketubanjiwa.com",133],["nsfw247.to",134],["funzen.net",134],["fighter.stream",134],["ilclubdellericette.it",134],["hubstream.in",134],["extremereportbot.com",135],["getintopc.com",136],["qoshe.com",138],["lowellsun.com",139],["mamadu.pl",139],["dobrapogoda24.pl",139],["motohigh.pl",139],["namasce.pl",139],["ultimate-catch.eu",140],["cpopchanelofficial.com",141],["creditcardgenerator.com",142],["creditcardrush.com",142],["bostoncommons.net",142],["thejobsmovie.com",142],["livsavr.co",142],["nilopolisonline.com.br",143],["mesquitaonline.com",143],["yellowbridge.com",143],["socialgirls.im",144],["yaoiotaku.com",145],["camhub.world",146],["moneyhouse.ch",147],["ihow.info",148],["filesus.com",148],["sturls.com",148],["re.two.re",148],["turbo1.co",148],["cartoonsarea.xyz",148],["valeronevijao.com",149],["cigarlessarefy.com",149],["figeterpiazine.com",149],["yodelswartlike.com",149],["generatesnitrosate.com",149],["crownmakermacaronicism.com",149],["chromotypic.com",149],["gamoneinterrupted.com",149],["metagnathtuggers.com",149],["wolfdyslectic.com",149],["rationalityaloelike.com",149],["sizyreelingly.com",149],["simpulumlamerop.com",149],["urochsunloath.com",149],["monorhinouscassaba.com",149],["counterclockwisejacky.com",149],["35volitantplimsoles5.com",149],["scatch176duplicities.com",149],["antecoxalbobbing1010.com",149],["boonlessbestselling244.com",149],["cyamidpulverulence530.com",149],["guidon40hyporadius9.com",149],["449unceremoniousnasoseptal.com",149],["19turanosephantasia.com",149],["30sensualizeexpression.com",149],["321naturelikefurfuroid.com",149],["745mingiestblissfully.com",149],["availedsmallest.com",149],["greaseball6eventual20.com",149],["toxitabellaeatrebates306.com",149],["20demidistance9elongations.com",149],["audaciousdefaulthouse.com",149],["fittingcentermondaysunday.com",149],["fraudclatterflyingcar.com",149],["launchreliantcleaverriver.com",149],["matriculant401merited.com",149],["realfinanceblogcenter.com",149],["reputationsheriffkennethsand.com",149],["telyn610zoanthropy.com",149],["tubelessceliolymph.com",149],["tummulerviolableness.com",149],["un-block-voe.net",149],["v-o-e-unblock.com",149],["voe-un-block.com",149],["voeun-block.net",149],["voeunbl0ck.com",149],["voeunblck.com",149],["voeunblk.com",149],["voeunblock.com",149],["voeunblock1.com",149],["voeunblock2.com",149],["voeunblock3.com",149],["agefi.fr",150],["cariskuy.com",151],["letras2.com",151],["yusepjaelani.blogspot.com",152],["letras.mus.br",153],["cheatermad.com",154],["mtlurb.com",155],["port.hu",156],["acdriftingpro.com",156],["flight-report.com",156],["forumdz.com",156],["abandonmail.com",156],["flmods.com",156],["zilinak.sk",156],["projectfreetv.stream",156],["hotdesimms.com",156],["pdfaid.com",156],["mconverter.eu",156],["dzeko11.net",[156,266]],["mail.com",156],["expresskaszubski.pl",156],["moegirl.org.cn",156],["onemanhua.com",157],["t3n.de",158],["allindiaroundup.com",159],["vectorizer.io",160],["smgplaza.com",160],["ftuapps.dev",160],["onehack.us",160],["thapcam.net",160],["thefastlaneforum.com",161],["trade2win.com",162],["gmodleaks.com",162],["modagamers.com",163],["freemagazines.top",163],["straatosphere.com",163],["nullpk.com",163],["adslink.pw",163],["downloadudemy.com",163],["picgiraffe.com",163],["weadown.com",163],["freepornsex.net",163],["nurparatodos.com.ar",163],["librospreuniversitariospdf.blogspot.com",164],["msdos-games.com",164],["forexeen.us",164],["khsm.io",164],["girls-like.me",164],["webcreator-journal.com",164],["nu6i-bg-net.com",164],["routech.ro",165],["hokej.net",165],["turkmmo.com",166],["palermotoday.it",167],["baritoday.it",167],["trentotoday.it",167],["agrigentonotizie.it",167],["anconatoday.it",167],["arezzonotizie.it",167],["avellinotoday.it",167],["bresciatoday.it",167],["brindisireport.it",167],["casertanews.it",167],["cataniatoday.it",167],["cesenatoday.it",167],["chietitoday.it",167],["forlitoday.it",167],["frosinonetoday.it",167],["genovatoday.it",167],["ilpescara.it",167],["ilpiacenza.it",167],["latinatoday.it",167],["lecceprima.it",167],["leccotoday.it",167],["livornotoday.it",167],["messinatoday.it",167],["milanotoday.it",167],["modenatoday.it",167],["monzatoday.it",167],["novaratoday.it",167],["padovaoggi.it",167],["parmatoday.it",167],["perugiatoday.it",167],["pisatoday.it",167],["quicomo.it",167],["ravennatoday.it",167],["reggiotoday.it",167],["riminitoday.it",167],["romatoday.it",167],["salernotoday.it",167],["sondriotoday.it",167],["sportpiacenza.it",167],["ternitoday.it",167],["today.it",167],["torinotoday.it",167],["trevisotoday.it",167],["triesteprima.it",167],["udinetoday.it",167],["veneziatoday.it",167],["vicenzatoday.it",167],["thumpertalk.com",168],["arkcod.org",168],["facciabuco.com",169],["softx64.com",170],["thelayoff.com",171],["shorterall.com",171],["blog24.me",171],["maxstream.video",171],["maxlinks.online",171],["tvepg.eu",171],["pstream.net",172],["libreriamo.it",173],["postazap.com",173],["medebooks.xyz",173],["tutorials-technology.info",173],["mashtips.com",173],["marriedgames.com.br",173],["4allprograms.me",173],["nurgsm.com",173],["certbyte.com",173],["plugincrack.com",173],["gamingdeputy.com",173],["freewebcart.com",173],["dailymaverick.co.za",174],["apps2app.com",175],["fm-arena.com",176],["tradersunion.com",177],["tandess.com",178],["faqwiki.us",179],["sonixgvn.net",179],["spontacts.com",180],["dankmemer.lol",181],["apkmoddone.com",182],["enit.in",183],["financerites.com",183],["fadedfeet.com",184],["homeculina.com",184],["ineedskin.com",184],["kenzo-flowertag.com",184],["lawyex.co",184],["mdn.lol",184],["bitzite.com",185],["coingraph.us",186],["impact24.us",186],["my-code4you.blogspot.com",187],["vrcmods.com",188],["osuskinner.com",188],["osuskins.net",188],["pentruea.com",[189,190]],["mchacks.net",191],["why-tech.it",192],["compsmag.com",193],["tapetus.pl",194],["gaystream.online",195],["embedv.net",195],["fslinks.org",195],["v6embed.xyz",195],["vgplayer.xyz",195],["vid-guard.com",195],["autoroad.cz",196],["brawlhalla.fr",196],["tecnobillo.com",196],["sexcamfreeporn.com",197],["breatheheavy.com",198],["wenxuecity.com",199],["key-hub.eu",200],["fabioambrosi.it",201],["tattle.life",202],["emuenzen.de",202],["terrylove.com",202],["mynet.com",203],["cidade.iol.pt",204],["fantacalcio.it",205],["hentaifreak.org",206],["hypebeast.com",207],["krankheiten-simulieren.de",208],["catholic.com",209],["3dmodelshare.org",210],["gourmetscans.net",211],["techinferno.com",212],["ibeconomist.com",213],["bookriot.com",214],["purposegames.com",215],["schoolcheats.net",215],["globo.com",216],["latimes.com",216],["claimrbx.gg",217],["perelki.net",218],["vpn-anbieter-vergleich-test.de",219],["livingincebuforums.com",220],["paperzonevn.com",221],["alltechnerd.com",222],["malaysianwireless.com",223],["erinsakura.com",224],["infofuge.com",224],["freejav.guru",224],["novelmultiverse.com",224],["fritidsmarkedet.dk",225],["maskinbladet.dk",225],["15min.lt",226],["lewdninja.com",227],["lewd.ninja",227],["baddiehub.com",228],["mr9soft.com",229],["21porno.com",230],["adult-sex-gamess.com",231],["hentaigames.app",231],["mobilesexgamesx.com",231],["mysexgamer.com",231],["porngameshd.com",231],["sexgamescc.com",231],["xnxx-sex-videos.com",231],["f2movies.to",232],["freeporncave.com",233],["tubsxxx.com",234],["pornojenny.com",235],["subtitle.one",236],["manga18fx.com",237],["freebnbcoin.com",237],["sextvx.com",238],["studydhaba.com",239],["freecourse.tech",239],["victor-mochere.com",239],["papunika.com",239],["mobilanyheter.net",239],["prajwaldesai.com",239],["muztext.com",240],["pornohans.com",241],["nursexfilme.com",241],["pornohirsch.net",241],["xhamster-sexvideos.com",241],["pornoschlange.com",241],["hdpornos.net",241],["gutesexfilme.com",241],["short1.site",241],["zona-leros.com",241],["charbelnemnom.com",242],["simplebits.io",243],["online-fix.me",244],["gamersdiscussionhub.com",245],["owlzo.com",246],["q1003.com",247],["blogpascher.com",248],["testserver.pro",249],["lifestyle.bg",249],["money.bg",249],["news.bg",249],["topsport.bg",249],["webcafe.bg",249],["mgnet.xyz",250],["advertiserandtimes.co.uk",251],["xvideos2020.me",252],["111.90.159.132",253],["techsolveprac.com",254],["joomlabeginner.com",255],["largescaleforums.com",256],["dubznetwork.com",257],["mundodonghua.com",257],["hentaidexy.com",258],["oceanplay.org",259],["code2care.org",260],["xxxxsx.com",262],["ngontinh24.com",263],["panel.freemcserver.net",264],["idevicecentral.com",265],["zona11.com",266],["scsport.live",266],["mangacrab.com",268],["idnes.cz",269],["viefaucet.com",270],["cloud-computing-central.com",271],["afk.guide",272],["businessnamegenerator.com",273],["derstandard.at",274],["derstandard.de",274],["rocketnews24.com",275],["soranews24.com",275],["youpouch.com",275],["ilsole24ore.com",276],["ipacrack.com",277],["hentaiporn.one",278],["infokik.com",279],["daemonanime.net",280],["daemon-hentai.com",280],["deezer.com",281],["fosslinux.com",282],["shrdsk.me",283],["examword.com",284],["sempreupdate.com.br",284],["tribuna.com",285],["trendsderzukunft.de",286],["gal-dem.com",286],["lostineu.eu",286],["oggitreviso.it",286],["speisekarte.de",286],["mixed.de",286],["lightnovelspot.com",[287,288]],["lightnovelworld.com",[287,288]],["novelpub.com",[287,288]],["webnovelpub.com",[287,288]],["mail.yahoo.com",289],["hwzone.co.il",290],["nammakalvi.com",291],["javmoon.me",292],["c2g.at",293],["terafly.me",293],["elamigos-games.com",293],["elamigos-games.net",293],["dktechnicalmate.com",294],["recipahi.com",294],["converter-btc.world",294],["kaystls.site",295],["aquarius-horoscopes.com",296],["cancer-horoscopes.com",296],["dubipc.blogspot.com",296],["echoes.gr",296],["engel-horoskop.de",296],["freegames44.com",296],["fuerzasarmadas.eu",296],["gemini-horoscopes.com",296],["jurukunci.net",296],["krebs-horoskop.com",296],["leo-horoscopes.com",296],["maliekrani.com",296],["nklinks.click",296],["ourenseando.es",296],["pisces-horoscopes.com",296],["radio-en-direct.fr",296],["sagittarius-horoscopes.com",296],["scorpio-horoscopes.com",296],["singlehoroskop-loewe.de",296],["skat-karten.de",296],["skorpion-horoskop.com",296],["taurus-horoscopes.com",296],["the1security.com",296],["torrentmovies.online",296],["virgo-horoscopes.com",296],["zonamarela.blogspot.com",296],["yoima.hatenadiary.com",296],["vpntester.org",297],["watchhentai.net",298],["japscan.lol",299],["digitask.ru",300],["tempumail.com",301],["sexvideos.host",302],["10alert.com",304],["cryptstream.de",305],["nydus.org",305],["techhelpbd.com",306],["fapdrop.com",307],["cellmapper.net",308],["hdrez.com",309],["youwatch-serie.com",309],["printablecreative.com",310],["comohoy.com",311],["leak.sx",311],["paste.bin.sx",311],["pornleaks.in",311],["merlininkazani.com",311],["faindx.com",313],["j91.asia",314],["jeniusplay.com",315],["indianyug.com",316],["rgb.vn",316],["needrom.com",317],["criptologico.com",318],["megadrive-emulator.com",319],["eromanga-show.com",320],["hentai-one.com",320],["hentaipaw.com",320],["10minuteemails.com",321],["luxusmail.org",321],["w3cub.com",322],["bangpremier.com",323],["nyaa.iss.ink",324],["tnp98.xyz",326],["freepdfcomic.com",327],["memedroid.com",328],["animesync.org",329],["karaoketexty.cz",330],["resortcams.com",331],["mjakmama24.pl",333],["security-demo.extrahop.com",334]]);

const entitiesMap = new Map([["comunio",0],["finanzen",[0,6]],["gameswelt",0],["heftig",0],["notebookcheck",0],["testedich",0],["transfermarkt",0],["truckscout24",0],["tvtv",0],["wetteronline",0],["wieistmeineip",0],["wetter",2],["1337x",5],["eztv",5],["sushi-scan",9],["spigotunlocked",9],["ahmedmode",9],["kissasian",13],["rp5",15],["mma-core",16],["writedroid",20],["yts",25],["720pstream",25],["1stream",25],["magesy",26],["thefmovies",29],["urlcero",36],["totaldebrid",39],["sandrives",39],["oploverz",40],["fxporn69",49],["aliancapes",49],["pouvideo",51],["povvideo",51],["povw1deo",51],["povwideo",51],["powv1deo",51],["powvibeo",51],["powvideo",51],["powvldeo",51],["tubsexer",57],["porno-tour",57],["lenkino",57],["pornomoll",57],["camsclips",57],["m4ufree",61],["crackstreams",61],["telerium",75],["pandafreegames",88],["thoptv",96],["brainly",102],["streameast",117],["thestreameast",117],["daddylivehd",117],["solvetube",121],["hdfilme",122],["pornhub",123],["wcofun",130],["bollyholic",134],["gotxx",148],["turkanime",149],["voe-unblock",149],["khatrimaza",163],["pogolinks",163],["popcornstream",165],["shortzzy",173],["vembed",195],["xhamsterdeutsch",241],["privatemoviez",245],["gmx",261],["lightnovelpub",[287,288]],["camcaps",303],["drivebot",325],["thenextplanet1",326],["autoscout24",332]]);

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
