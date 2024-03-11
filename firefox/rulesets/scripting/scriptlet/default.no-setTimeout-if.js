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

const argsList = [[".call(null)","10"],[".call(null)"],["(null)","10"],["userHasAdblocker"],["objSubPromo"],["adb"],["nrWrapper"],["warn"],["adBlockerDetected"],["show"],["adObjects"],["InfMediafireMobileFunc","1000"],["google_jobrunner"],["()","45000"],["prompt"],["0x"],["displayAdBlockedVideo"],[".adsbygoogle"],["contrformpub","5000"],["disabledAdBlock","10000"],["_0x"],["ads.length"],["location.href"],["isDesktopApp","1000"],["Bait"],["admc"],["AdBlocker"],["Blocked"],["nextFunction"],["'0x"],["apstagLOADED"],["/Adb|moneyDetect/"],["disableDeveloper"],["Blocco","2000"],["documentElement.classList.add","400"],["test","0"],["checkAdblockUser","1000"],["checkPub","6000"],["document.querySelector","5000"],["nextFunction","250"],["popup"],["()","150"],["backRedirect"],["document.querySelectorAll","1000"],["style"],["clientHeight"],["addEventListener","0"],["adblock","2000"],["start","0"],["nextFunction","2000"],["byepopup","5000"],["test.remove","100"],["additional_src","300"],["()","2000"],["css_class.show"],["CANG","3000"],["updato-overlay","500"],["innerText","2000"],["alert","8000"],["css_class"],["()","50"],["debugger"],["initializeCourier","3000"],["redirectPage"],["_0x","2000"],["ads","750"],["location.href","500"],["Adblock","5000"],["disable","200"],["CekAab","0"],["rbm_block_active","1000"],["show()"],["n.trigger","1"],["adblock"],["abDetected"],["KeepOpeningPops","1000"],["appendChild"],["adb","0"],["adBlocked"],["warning","100"],["adblock_popup","500"],["Adblock"],["#chatWrap","1000"],["keep-ads","2000"],["#rbm_block_active","1000"],["null","4000"],["()","2500"],["myaabpfun","3000"],["adFilled","2500"],["()","15000"],["showPopup"],["()","1"],["()","1000"],["document.cookie","2500"],["window.open"],["innerHTML"],["readyplayer","2000"],["checkStopBlock"],["adspot_top","1500"],["/offsetHeight|google|Global/"],["an_message","500"],["Adblocker","10000"],["trigger","0"],["timeoutChecker"],["bait","1"],["ai_adb"],["pum-open"],["overlay","2000"],["/adblock/i"],["test","100"],["Math.round","1000"],["adblock","5"],["bioEp"],["ag_adBlockerDetected"],["null"],["adsbox","1000"],["adb","6000"],["pop"],["sadbl"],["checkAdStatus"],["mdp"],["brave_load_popup"],["0x","3000"],["invoke"],["adsbytrafficjunkycontext"],["ipod"],["offsetWidth"],["/$|adBlock/"],["ads"],["adsbygoogle"],["()"],["AdBlock"],["stop-scrolling"],["Adv"],["blockUI","2000"],["mdpDeBlocker"],["/_0x|debug/"],["/ai_adb|_0x/"],["iframe"],["adBlock"],["","1"],["undefined"],["check","1"],["adsBlocked"],["blocker"],["aswift_"],["afs_ads","2000"],["visibility","2000"],["bait"],["getComputedStyle","250"],["blocked"],["{r()","0"],["nextFunction","450"],["Debug"],["r()","0"],["offset"],["purple_box"],["offsetHeight"],["checkSiteNormalLoad"],["adBlockOverlay"],["Detected","500"],["modal"],[".show","1000"],[".show"],["showModal"],["getComputedStyle"],["blur"],["samOverlay"],["bADBlock"],["location"],["","4000"],["blocker","100"],["alert"],["length"],["t()","0"],["$"],["getComputedStyle","2000"],["video-popup"],["detectAdblock"],["EzoIvent"],["detectAdBlocker"],["nads"],["1e3*"],["","5"],["/adblock|isRequestPresent/"],["_0x","500"],["window[_0x"],["isRequestPresent"],["offsetLeft"],["height"],["mdp_deblocker"],["charAt"],["checkAds"],["fadeIn","0"],["jQuery"],["/^/"],["afterOpen"],["check"],["Adblocker"],["eabdModal"],["ab_root.show"],["gaData"],["ad"],["prompt","1000"],["googlefc"],["adblock detection"],[".offsetHeight","100"],["popState"],["ad-block-popup"],["exitTimer"],["innerHTML.replace"],["data?","4000"],[".data?"],["eabpDialog"],["adsense"],["/Adblock|_ad_/"],["googletag"],["f.parentNode.removeChild(f)","100"],["swal","500"],["keepChecking","1000"],["openPopup"],[".offsetHeight"],["()=>{"],["nitroAds"],["class.scroll","1000"],["disableDeveloperTools"],["Check"],["insertBefore"],["setAntiAb"],["css_class.scroll"],["/null|Error/","10000"],["window.location.href","50"],["/out.php"],["/0x|devtools/"],["location.replace","300"],["window.location.href"],["checkVisible"],["_0x","3000"],["fetch"],["window.location.href=link"],["ai_"],["reachGoal"],["Adb"],["ai"],["","3000"],["/width|innerHTML/"],["magnificPopup"],["adblockEnabled"],["google_ad"],["document.location"],["google"],["top-right","2000"],["enforceAdStatus"],["loadScripts"],["mfp"],["display","5000"],["eb"],[").show()"],["","1000"],["atob"],["devtool"],["Msg"],["UABP"],["href"],["aaaaa-modal"],["\\x","5000"],["()=>"],["keepChecking"],["null","10"],["","500"],["/Adform|didomi|adblock|forEach/"],["showAdblock"],["-0x"],["display"],["gclid"],["event","3000"],["rejectWith"],["refresh"],["location.href","3000"],["window.location"],["ga"],["adbl"],["Ads"],["ShowAdBLockerNotice"],["ad_listener"],["open"],["(!0)"],["Delay"],["/appendChild|e\\(\"/"],["=>"],["ADB"],["site-access-popup"],["data?"],["/debugger|UserCustomPop/"],["checkAdblockUser"],["offsetHeight","100"],["AdDetect"],["displayMessage","2000"],["/salesPopup|mira-snackbar/"],["advanced"],["detectImgLoad"],["offsetHeight","200"],["detector"],["replace"],["touchstart"],["siteAccessFlag"],["ab"],["/adblocker|alert/"],["redURL"],["/children\\('ins'\\)|Adblock|adsbygoogle/"],["displayMessage"],["chkADB"],["onDetected"],["myinfoey","1500"],["placebo"],["fuckadb"],["detect"],["siteAccessPopup"],["/adsbygoogle|adblock/"],["akadb"],["biteDisplay"],["/[a-z]\\(!0\\)/","800"],["ad_block"],["/detectAdBlocker|window.open/"],["adBlockDetected"],["popUnder"],["/GoToURL|delay/"],["window.location.href","300"],["ad_display"],["/adScriptPath|MMDConfig/"],["0x","100"],["/native|\\{n\\(\\)/"],["adblocker"],["/Detect|adblock|style\\.display|\\[native code]|\\.call\\(null\\)/"],["removeChild"],["ad blocker"]];

const hostnamesMap = new Map([["4-liga.com",0],["4fansites.de",0],["4players.de",0],["9monate.de",0],["aachener-nachrichten.de",0],["aachener-zeitung.de",0],["abendblatt.de",0],["abendzeitung-muenchen.de",0],["about-drinks.com",0],["abseits-ka.de",0],["airliners.de",0],["ajaxshowtime.com",0],["allgemeine-zeitung.de",0],["antenne.de",0],["arcor.de",0],["areadvd.de",0],["areamobile.de",0],["ariva.de",0],["astronews.com",0],["aussenwirtschaftslupe.de",0],["auszeit.bio",0],["auto-motor-und-sport.de",0],["auto-service.de",0],["autobild.de",0],["autoextrem.de",0],["autopixx.de",0],["autorevue.at",0],["az-online.de",0],["baby-vornamen.de",0],["babyclub.de",0],["bafoeg-aktuell.de",0],["berliner-kurier.de",0],["berliner-zeitung.de",0],["bigfm.de",0],["bikerszene.de",0],["bildderfrau.de",0],["blackd.de",0],["blick.de",0],["boerse-online.de",0],["boerse.de",0],["boersennews.de",0],["braunschweiger-zeitung.de",0],["brieffreunde.de",0],["brigitte.de",0],["buerstaedter-zeitung.de",0],["buffed.de",0],["businessinsider.de",0],["buzzfeed.at",0],["buzzfeed.de",0],["caravaning.de",0],["cavallo.de",0],["chefkoch.de",0],["cinema.de",0],["clever-tanken.de",0],["computerbild.de",0],["computerhilfen.de",0],["comunio-cl.com",0],["connect.de",0],["chip.de",0],["da-imnetz.de",0],["dasgelbeblatt.de",0],["dbna.com",0],["dbna.de",0],["deichstube.de",0],["deine-tierwelt.de",0],["der-betze-brennt.de",0],["derwesten.de",0],["desired.de",0],["dhd24.com",0],["dieblaue24.com",0],["digitalfernsehen.de",0],["dnn.de",0],["donnerwetter.de",0],["e-hausaufgaben.de",0],["e-mountainbike.com",0],["eatsmarter.de",0],["echo-online.de",0],["ecomento.de",0],["einfachschoen.me",0],["elektrobike-online.com",0],["eltern.de",0],["epochtimes.de",0],["essen-und-trinken.de",0],["express.de",0],["extratipp.com",0],["familie.de",0],["fanfiktion.de",0],["fehmarn24.de",0],["fettspielen.de",0],["fid-gesundheitswissen.de",0],["finanznachrichten.de",0],["finanztreff.de",0],["finya.de",0],["firmenwissen.de",0],["fitforfun.de",0],["fnp.de",0],["football365.fr",0],["formel1.de",0],["fr.de",0],["frankfurter-wochenblatt.de",0],["freenet.de",0],["fremdwort.de",0],["froheweihnachten.info",0],["frustfrei-lernen.de",0],["fuldaerzeitung.de",0],["funandnews.de",0],["fussballdaten.de",0],["futurezone.de",0],["gala.de",0],["gamepro.de",0],["gamersglobal.de",0],["gamesaktuell.de",0],["gamestar.de",0],["gamezone.de",0],["gartendialog.de",0],["gartenlexikon.de",0],["gedichte.ws",0],["geissblog.koeln",0],["gelnhaeuser-tageblatt.de",0],["general-anzeiger-bonn.de",0],["geniale-tricks.com",0],["genialetricks.de",0],["gesund-vital.de",0],["gesundheit.de",0],["gevestor.de",0],["gewinnspiele.tv",0],["giessener-allgemeine.de",0],["giessener-anzeiger.de",0],["gifhorner-rundschau.de",0],["giga.de",0],["gipfelbuch.ch",0],["gmuender-tagespost.de",0],["golem.de",[0,8,9]],["gruenderlexikon.de",0],["gusto.at",0],["gut-erklaert.de",0],["gutfuerdich.co",0],["hallo-muenchen.de",0],["hamburg.de",0],["hanauer.de",0],["hardwareluxx.de",0],["hartziv.org",0],["harzkurier.de",0],["haus-garten-test.de",0],["hausgarten.net",0],["haustec.de",0],["haz.de",0],["heidelberg24.de",0],["heilpraxisnet.de",0],["heise.de",0],["helmstedter-nachrichten.de",0],["hersfelder-zeitung.de",0],["hftg.co",0],["hifi-forum.de",0],["hna.de",0],["hochheimer-zeitung.de",0],["hoerzu.de",0],["hofheimer-zeitung.de",0],["iban-rechner.de",0],["ikz-online.de",0],["immobilienscout24.de",0],["ingame.de",0],["inside-digital.de",0],["inside-handy.de",0],["investor-verlag.de",0],["jappy.com",0],["jpgames.de",0],["kabeleins.de",0],["kachelmannwetter.com",0],["kamelle.de",0],["kicker.de",0],["kindergeld.org",0],["klettern-magazin.de",0],["klettern.de",0],["kochbar.de",0],["kreis-anzeiger.de",0],["kreisbote.de",0],["kreiszeitung.de",0],["ksta.de",0],["kurierverlag.de",0],["lachainemeteo.com",0],["lampertheimer-zeitung.de",0],["landwirt.com",0],["laut.de",0],["lauterbacher-anzeiger.de",0],["leckerschmecker.me",0],["leinetal24.de",0],["lesfoodies.com",0],["levif.be",0],["lifeline.de",0],["liga3-online.de",0],["likemag.com",0],["linux-community.de",0],["linux-magazin.de",0],["live.vodafone.de",0],["ln-online.de",0],["lokalo24.de",0],["lustaufsleben.at",0],["lustich.de",0],["lvz.de",0],["lz.de",0],["macwelt.de",0],["macworld.co.uk",0],["mail.de",0],["main-spitze.de",0],["manager-magazin.de",0],["manga-tube.me",0],["mathebibel.de",0],["mathepower.com",0],["maz-online.de",0],["medisite.fr",0],["mehr-tanken.de",0],["mein-kummerkasten.de",0],["mein-mmo.de",0],["mein-wahres-ich.de",0],["meine-anzeigenzeitung.de",0],["meinestadt.de",0],["menshealth.de",0],["mercato365.com",0],["merkur.de",0],["messen.de",0],["metal-hammer.de",0],["metalflirt.de",0],["meteologix.com",0],["minecraft-serverlist.net",0],["mittelbayerische.de",0],["modhoster.de",0],["moin.de",0],["mopo.de",0],["morgenpost.de",0],["motor-talk.de",0],["motorbasar.de",0],["motorradonline.de",0],["motorsport-total.com",0],["motortests.de",0],["mountainbike-magazin.de",0],["moviejones.de",0],["moviepilot.de",0],["mt.de",0],["mtb-news.de",0],["musiker-board.de",0],["musikexpress.de",0],["musikradar.de",0],["mz-web.de",0],["n-tv.de",0],["naumburger-tageblatt.de",0],["netzwelt.de",0],["neuepresse.de",0],["neueroeffnung.info",0],["news.at",0],["news.de",0],["news38.de",0],["newsbreak24.de",0],["nickles.de",0],["nicknight.de",0],["nl.hardware.info",0],["nn.de",0],["nnn.de",0],["nordbayern.de",0],["notebookchat.com",0],["notebookcheck-ru.com",0],["notebookcheck-tr.com",0],["noz-cdn.de",0],["noz.de",0],["nrz.de",0],["nw.de",0],["nwzonline.de",0],["oberhessische-zeitung.de",0],["oeffentlicher-dienst.info",0],["onlinekosten.de",0],["onvista.de",0],["op-marburg.de",0],["op-online.de",0],["outdoor-magazin.com",0],["outdoorchannel.de",0],["paradisi.de",0],["pc-magazin.de",0],["pcgames.de",0],["pcgameshardware.de",0],["pcwelt.de",0],["pcworld.es",0],["peiner-nachrichten.de",0],["pferde.de",0],["pietsmiet.de",0],["pixelio.de",0],["pkw-forum.de",0],["playboy.de",0],["playfront.de",0],["pnn.de",0],["pons.com",0],["prad.de",[0,132]],["prignitzer.de",0],["profil.at",0],["promipool.de",0],["promobil.de",0],["prosiebenmaxx.de",0],["psychic.de",[0,157]],["quoka.de",0],["radio.at",0],["radio.de",0],["radio.dk",0],["radio.es",0],["radio.fr",0],["radio.it",0],["radio.net",0],["radio.pl",0],["radio.pt",0],["radio.se",0],["ran.de",0],["readmore.de",0],["rechtslupe.de",0],["recording.de",0],["rennrad-news.de",0],["reuters.com",0],["reviersport.de",0],["rhein-main-presse.de",0],["rheinische-anzeigenblaetter.de",0],["rimondo.com",0],["roadbike.de",0],["roemische-zahlen.net",0],["rollingstone.de",0],["rot-blau.com",0],["rp-online.de",0],["rtl.de",[0,268]],["rtv.de",0],["rugby365.fr",0],["ruhr24.de",0],["rundschau-online.de",0],["runnersworld.de",0],["safelist.eu",0],["salzgitter-zeitung.de",0],["sat1.de",0],["sat1gold.de",0],["schoener-wohnen.de",0],["schwaebische-post.de",0],["schwarzwaelder-bote.de",0],["serienjunkies.de",0],["shz.de",0],["sixx.de",0],["skodacommunity.de",0],["smart-wohnen.net",0],["sn.at",0],["sozialversicherung-kompetent.de",0],["spiegel.de",0],["spielen.de",0],["spieletipps.de",0],["spielfilm.de",0],["sport.de",0],["sport365.fr",0],["sportal.de",0],["spox.com",0],["stern.de",0],["stuttgarter-nachrichten.de",0],["stuttgarter-zeitung.de",0],["sueddeutsche.de",0],["svz.de",0],["szene1.at",0],["szene38.de",0],["t-online.de",0],["tagesspiegel.de",0],["taschenhirn.de",0],["techadvisor.co.uk",0],["techstage.de",0],["tele5.de",0],["the-voice-of-germany.de",0],["thueringen24.de",0],["tichyseinblick.de",0],["tierfreund.co",0],["tiervermittlung.de",0],["torgranate.de",0],["trend.at",0],["tv-media.at",0],["tvdigital.de",0],["tvinfo.de",0],["tvspielfilm.de",0],["tvtoday.de",0],["tz.de",0],["unicum.de",0],["unnuetzes.com",0],["unsere-helden.com",0],["unterhalt.net",0],["usinger-anzeiger.de",0],["usp-forum.de",0],["videogameszone.de",0],["vienna.at",0],["vip.de",0],["virtualnights.com",0],["vox.de",0],["wa.de",0],["wallstreet-online.de",[0,3]],["waz.de",0],["weather.us",0],["webfail.com",0],["weihnachten.me",0],["weihnachts-bilder.org",0],["weihnachts-filme.com",0],["welt.de",0],["weltfussball.at",0],["weristdeinfreund.de",0],["werkzeug-news.de",0],["werra-rundschau.de",0],["wetterauer-zeitung.de",0],["wiesbadener-kurier.de",0],["wiesbadener-tagblatt.de",0],["winboard.org",0],["windows-7-forum.net",0],["winfuture.de",0],["wintotal.de",0],["wlz-online.de",0],["wn.de",0],["wohngeld.org",0],["wolfenbuetteler-zeitung.de",0],["wolfsburger-nachrichten.de",0],["woman.at",0],["womenshealth.de",0],["wormser-zeitung.de",0],["woxikon.de",0],["wp.de",0],["wr.de",0],["yachtrevue.at",0],["ze.tt",0],["zeit.de",0],["meineorte.com",1],["osthessen-news.de",1],["techadvisor.com",1],["focus.de",1],["economictimes.indiatimes.com",4],["m.timesofindia.com",5],["timesofindia.indiatimes.com",5],["youmath.it",5],["redensarten-index.de",5],["lesoir.be",5],["electriciansforums.net",5],["keralatelecom.info",5],["betaseries.com",5],["universegunz.net",5],["happypenguin.altervista.org",5],["everyeye.it",5],["bluedrake42.com",5],["streamservicehd.click",5],["supermarioemulator.com",5],["futbollibrehd.com",5],["newsrade.com",5],["eska.pl",5],["eskarock.pl",5],["voxfm.pl",5],["mathaeser.de",5],["freethesaurus.com",7],["thefreedictionary.com",7],["hdbox.ws",9],["todopolicia.com",9],["scat.gold",9],["freecoursesite.com",9],["windowcleaningforums.co.uk",9],["cruisingearth.com",9],["hobby-machinist.com",9],["freegogpcgames.com",9],["latitude.to",9],["kitchennovel.com",9],["w3layouts.com",9],["blog.receivefreesms.co.uk",9],["eductin.com",9],["dealsfinders.blog",9],["audiobooks4soul.com",9],["tinhocdongthap.com",9],["sakarnewz.com",9],["downloadr.in",9],["topcomicporno.com",9],["dongknows.com",9],["traderepublic.community",9],["celtadigital.com",9],["iptvrun.com",9],["adsup.lk",9],["cryptomonitor.in",9],["areatopik.com",9],["cardscanner.co",9],["nullforums.net",9],["courseclub.me",9],["tamarindoyam.com",9],["jeep-cj.com",9],["choiceofmods.com",9],["myqqjd.com",9],["ssdtop.com",9],["apkhex.com",9],["gezegenforum.com",9],["mbc2.live",9],["iptvapps.net",9],["null-scripts.net",9],["nullscripts.net",9],["bloground.ro",9],["witcherhour.com",9],["ottverse.com",9],["torrentmac.net",9],["mazakony.com",9],["laptechinfo.com",9],["mc-at.org",9],["playstationhaber.com",9],["mangapt.com",9],["seriesperu.com",9],["pesprofessionals.com",9],["wpsimplehacks.com",9],["sportshub.to",[9,267]],["topsporter.net",[9,267]],["darkwanderer.net",9],["truckingboards.com",9],["coldfrm.org",9],["azrom.net",9],["freepatternsarea.com",9],["alttyab.net",9],["hq-links.com",9],["mobilkulup.com",9],["esopress.com",9],["rttar.com",9],["nesiaku.my.id",9],["jipinsoft.com",9],["surfsees.com",9],["truthnews.de",9],["farsinama.com",9],["worldofiptv.com",9],["vuinsider.com",9],["crazydl.net",9],["gamemodsbase.com",9],["babiato.tech",9],["secuhex.com",9],["turkishaudiocenter.com",9],["galaxyos.net",9],["blackhatworld.com",9],["bizdustry.com",9],["storefront.com.ng",9],["pkbiosfix.com",9],["casi3.xyz",9],["geektime.co.il",10],["mediafire.com",11],["wcoanimedub.tv",12],["wcoforever.net",12],["openspeedtest.com",12],["addtobucketlist.com",12],["3dzip.org",[12,85]],["ilmeteo.it",12],["wcoforever.com",12],["comprovendolibri.it",12],["healthelia.com",12],["keephealth.info",13],["australianfrequentflyer.com.au",14],["afreesms.com",15],["kinoger.re",15],["laksa19.github.io",15],["javcl.com",15],["tvlogy.to",15],["live.dragaoconnect.net",15],["beststremo.com",15],["seznam.cz",15],["seznamzpravy.cz",15],["xerifetech.com",15],["wallpapershome.com",17],["ville-ideale.fr",18],["calciomercato.it",19],["calciomercato.com",20],["bersamatekno.com",20],["hotpornfile.org",20],["coolsoft.altervista.org",20],["hackedonlinegames.com",20],["jkoding.xyz",20],["cheater.ninja",20],["settlersonlinemaps.com",20],["magdownload.org",20],["kpkuang.org",20],["shareus.site",20],["crypto4yu.com",20],["faucetwork.space",20],["thenightwithoutthedawn.blogspot.com",20],["entutes.com",20],["claimlite.club",20],["bazadecrypto.com",[20,313]],["whosampled.com",21],["imgkings.com",22],["pornvideotop.com",22],["krotkoosporcie.pl",22],["anghami.com",23],["wired.com",24],["tutele.sx",25],["footyhunter3.xyz",25],["magesypro.pro",[26,27]],["audiotools.pro",27],["magesy.blog",27],["audioztools.com",[27,28]],["altblogger.net",28],["hl-live.de",28],["wohnmobilforum.de",28],["nulledbear.com",28],["satoshi-win.xyz",28],["encurtandourl.com",[28,149]],["freedeepweb.blogspot.com",28],["freesoft.id",28],["zcteam.id",28],["www-daftarharga.blogspot.com",28],["ear-phone-review.com",28],["telefullenvivo.com",28],["listatv.pl",28],["ltc-faucet.xyz",28],["coin-profits.xyz",28],["relampagomovies.com",28],["katestube.com",29],["short.pe",29],["footystreams.net",29],["seattletimes.com",30],["yiv.com",31],["globalrph.com",32],["e-glossa.it",33],["freewebscript.com",34],["webcheats.com.br",35],["gala.fr",37],["gentside.com",37],["geo.fr",37],["hbrfrance.fr",37],["nationalgeographic.fr",37],["ohmymag.com",37],["serengo.net",37],["vsd.fr",37],["updato.com",[38,56]],["methbox.com",39],["daizurin.com",39],["pendekarsubs.us",39],["dreamfancy.org",39],["rysafe.blogspot.com",39],["techacode.com",39],["toppng.com",39],["th-world.com",39],["avjamack.com",39],["avjamak.net",39],["tickzoo.tv",40],["dlhd.sx",41],["embedstream.me",41],["yts-subs.net",41],["cnnamador.com",42],["nudecelebforum.com",43],["pronpic.org",44],["thewebflash.com",45],["discordfastfood.com",45],["xup.in",45],["popularmechanics.com",46],["op.gg",47],["lequipe.fr",48],["comunidadgzone.es",49],["mp3fy.com",49],["lebensmittelpraxis.de",49],["ebookdz.com",49],["forum-pokemon-go.fr",49],["praxis-jugendarbeit.de",49],["gdrivez.xyz",49],["dictionnaire-medical.net",49],["cle0desktop.blogspot.com",49],["up-load.io",49],["direct-link.net",49],["direkt-wissen.com",49],["keysbrasil.blogspot.com",49],["hotpress.info",49],["turkleech.com",49],["anibatch.me",49],["anime-i.com",49],["plex-guide.de",49],["healthtune.site",49],["gewinde-normen.de",49],["tucinehd.com",49],["jellynote.com",50],["eporner.com",52],["pornbimbo.com",53],["allmonitors24.com",53],["4j.com",53],["avoiderrors.com",54],["cgtips.org",[54,212]],["sitarchive.com",54],["livenewsof.com",54],["topnewsshow.com",54],["gatcha.org",54],["empregoestagios.com",54],["everydayonsales.com",54],["kusonime.com",54],["aagmaal.xyz",54],["suicidepics.com",54],["codesnail.com",54],["codingshiksha.com",54],["graphicux.com",54],["hardcoregames.ca",54],["asyadrama.com",54],["bitcoinegypt.news",54],["citychilli.com",54],["talkjarvis.com",54],["hdmotori.it",55],["femdomtb.com",57],["camhub.cc",57],["bobs-tube.com",57],["ru-xvideos.me",57],["pornfd.com",57],["popno-tour.net",57],["molll.mobi",57],["watchmdh.to",57],["camwhores.tv",57],["elfqrin.com",58],["satcesc.com",59],["apfelpatient.de",59],["lusthero.com",60],["m2list.com",61],["embed.nana2play.com",61],["elahmad.com",61],["dofusports.xyz",61],["dallasnews.com",62],["lnk.news",63],["lnk.parts",63],["efukt.com",64],["wendycode.com",64],["springfieldspringfield.co.uk",65],["porndoe.com",66],["smsget.net",[67,68]],["kjanime.net",69],["gioialive.it",70],["classicreload.com",71],["scriptzhub.com",71],["chicoer.com",72],["bostonherald.com",72],["dailycamera.com",72],["maxcheaters.com",73],["rbxoffers.com",73],["mhn.quest",73],["leagueofgraphs.com",73],["hieunguyenphoto.com",73],["texteditor.nsspot.net",73],["postimees.ee",73],["police.community",73],["gisarea.com",73],["schaken-mods.com",73],["theclashify.com",73],["newscon.org",73],["txori.com",73],["olarila.com",73],["deletedspeedstreams.blogspot.com",73],["schooltravelorganiser.com",73],["xhardhempus.net",73],["sportsplays.com",74],["deinesexfilme.com",76],["einfachtitten.com",76],["halloporno.com",76],["herzporno.com",76],["lesbenhd.com",76],["milffabrik.com",[76,242]],["porn-monkey.com",76],["porndrake.com",76],["pornhubdeutsch.net",76],["pornoaffe.com",76],["pornodavid.com",76],["pornoente.tv",[76,242]],["pornofisch.com",76],["pornofelix.com",76],["pornohammer.com",76],["pornohelm.com",76],["pornoklinge.com",76],["pornotom.com",[76,242]],["pornotommy.com",76],["pornovideos-hd.com",76],["pornozebra.com",[76,242]],["xhamsterdeutsch.xyz",76],["xnxx-sexfilme.com",76],["zerion.cc",76],["letribunaldunet.fr",77],["vladan.fr",77],["live-tv-channels.org",78],["eslfast.com",79],["freegamescasual.com",80],["tcpvpn.com",81],["oko.sh",81],["timesnownews.com",81],["timesnowhindi.com",81],["timesnowmarathi.com",81],["zoomtventertainment.com",81],["xxxuno.com",82],["sholah.net",83],["2rdroid.com",83],["bisceglielive.it",84],["pandajogosgratis.com.br",86],["5278.cc",87],["tonspion.de",89],["duplichecker.com",90],["plagiarismchecker.co",90],["plagiarismdetector.net",90],["searchenginereports.net",90],["giallozafferano.it",91],["autojournal.fr",91],["autoplus.fr",91],["sportauto.fr",91],["linkspaid.com",92],["proxydocker.com",92],["beeimg.com",[93,94]],["emturbovid.com",94],["ftlauderdalebeachcam.com",95],["ftlauderdalewebcam.com",95],["juneauharborwebcam.com",95],["keywestharborwebcam.com",95],["kittycatcam.com",95],["mahobeachcam.com",95],["miamiairportcam.com",95],["morganhillwebcam.com",95],["njwildlifecam.com",95],["nyharborwebcam.com",95],["paradiseislandcam.com",95],["pompanobeachcam.com",95],["portbermudawebcam.com",95],["portcanaveralwebcam.com",95],["portevergladeswebcam.com",95],["portmiamiwebcam.com",95],["portnywebcam.com",95],["portnassauwebcam.com",95],["portstmaartenwebcam.com",95],["portstthomaswebcam.com",95],["porttampawebcam.com",95],["sxmislandcam.com",95],["gearingcommander.com",95],["themes-dl.com",95],["badassdownloader.com",95],["badasshardcore.com",95],["badassoftcore.com",95],["nulljungle.com",95],["teevee.asia",95],["otakukan.com",95],["generate.plus",97],["calculate.plus",97],["avcesar.com",98],["audiotag.info",99],["tudigitale.it",100],["ibcomputing.com",101],["eodev.com",102],["legia.net",103],["acapellas4u.co.uk",104],["robloxscripts.com",105],["libreriamo.it",105],["postazap.com",105],["medebooks.xyz",105],["tutorials-technology.info",105],["mashtips.com",105],["marriedgames.com.br",105],["4allprograms.me",105],["nurgsm.com",105],["certbyte.com",105],["plugincrack.com",105],["gamingdeputy.com",105],["freewebcart.com",105],["streamhentaimovies.com",106],["konten.co.id",107],["diariodenavarra.es",108],["scripai.com",108],["myfxbook.com",108],["whatfontis.com",108],["xiaomifans.pl",109],["eletronicabr.com",109],["optifine.net",110],["luzernerzeitung.ch",111],["tagblatt.ch",111],["spellcheck.net",112],["spellchecker.net",112],["spellweb.com",112],["ableitungsrechner.net",113],["alternet.org",114],["gourmetsupremacy.com",114],["imtranslator.net",115],["shrib.com",116],["pandafiles.com",117],["vidia.tv",[117,138]],["hortonanderfarom.blogspot.com",117],["clarifystraight.com",117],["tutelehd3.xyz",118],["mega4upload.com",118],["coolcast2.com",118],["techclips.net",118],["earthquakecensus.com",118],["footyhunter.lol",118],["gamerarcades.com",118],["poscitech.click",118],["starlive.stream",118],["utopianwilderness.com",118],["wecast.to",118],["sportbar.live",118],["lordchannel.com",118],["play-old-pc-games.com",119],["tunovelaligera.com",120],["tapchipi.com",120],["cuitandokter.com",120],["tech-blogs.com",120],["cardiagn.com",120],["dcleakers.com",120],["esgeeks.com",120],["pugliain.net",120],["uplod.net",120],["worldfreeware.com",120],["fikiri.net",120],["myhackingworld.com",120],["phoenixfansub.com",120],["freecourseweb.com",121],["devcourseweb.com",121],["coursewikia.com",121],["courseboat.com",121],["coursehulu.com",121],["lne.es",125],["pornult.com",126],["webcamsdolls.com",126],["bitcotasks.com",[126,172]],["adsy.pw",126],["playstore.pw",126],["exactpay.online",126],["thothd.to",126],["proplanta.de",127],["hydrogenassociation.org",128],["ludigames.com",128],["sportitalialive.com",128],["tii.la",128],["made-by.org",128],["xenvn.com",128],["worldtravelling.com",128],["igirls.in",128],["technichero.com",128],["roshiyatech.my.id",128],["24sport.stream",128],["aeroxplorer.com",128],["mad4wheels.com",129],["logi.im",129],["emailnator.com",129],["textograto.com",130],["voyageforum.com",131],["hmc-id.blogspot.com",131],["jemerik.com",131],["myabandonware.com",131],["chatta.it",133],["ketubanjiwa.com",134],["nsfw247.to",135],["funzen.net",135],["fighter.stream",135],["ilclubdellericette.it",135],["hubstream.in",135],["extremereportbot.com",136],["getintopc.com",137],["qoshe.com",139],["lowellsun.com",140],["mamadu.pl",140],["dobrapogoda24.pl",140],["motohigh.pl",140],["namasce.pl",140],["ultimate-catch.eu",141],["cpopchanelofficial.com",142],["creditcardgenerator.com",143],["creditcardrush.com",143],["bostoncommons.net",143],["thejobsmovie.com",143],["livsavr.co",143],["nilopolisonline.com.br",144],["mesquitaonline.com",144],["yellowbridge.com",144],["socialgirls.im",145],["yaoiotaku.com",146],["camhub.world",147],["moneyhouse.ch",148],["ihow.info",149],["filesus.com",149],["sturls.com",149],["re.two.re",149],["turbo1.co",149],["cartoonsarea.xyz",149],["valeronevijao.com",150],["cigarlessarefy.com",150],["figeterpiazine.com",150],["yodelswartlike.com",150],["generatesnitrosate.com",150],["crownmakermacaronicism.com",150],["chromotypic.com",150],["gamoneinterrupted.com",150],["metagnathtuggers.com",150],["wolfdyslectic.com",150],["rationalityaloelike.com",150],["sizyreelingly.com",150],["simpulumlamerop.com",150],["urochsunloath.com",150],["monorhinouscassaba.com",150],["counterclockwisejacky.com",150],["35volitantplimsoles5.com",150],["scatch176duplicities.com",150],["antecoxalbobbing1010.com",150],["boonlessbestselling244.com",150],["cyamidpulverulence530.com",150],["guidon40hyporadius9.com",150],["449unceremoniousnasoseptal.com",150],["19turanosephantasia.com",150],["30sensualizeexpression.com",150],["321naturelikefurfuroid.com",150],["745mingiestblissfully.com",150],["availedsmallest.com",150],["greaseball6eventual20.com",150],["toxitabellaeatrebates306.com",150],["20demidistance9elongations.com",150],["audaciousdefaulthouse.com",150],["fittingcentermondaysunday.com",150],["fraudclatterflyingcar.com",150],["launchreliantcleaverriver.com",150],["matriculant401merited.com",150],["realfinanceblogcenter.com",150],["reputationsheriffkennethsand.com",150],["telyn610zoanthropy.com",150],["tubelessceliolymph.com",150],["tummulerviolableness.com",150],["un-block-voe.net",150],["v-o-e-unblock.com",150],["voe-un-block.com",150],["voeun-block.net",150],["voeunbl0ck.com",150],["voeunblck.com",150],["voeunblk.com",150],["voeunblock.com",150],["voeunblock1.com",150],["voeunblock2.com",150],["voeunblock3.com",150],["agefi.fr",151],["cariskuy.com",152],["letras2.com",152],["yusepjaelani.blogspot.com",153],["letras.mus.br",154],["cheatermad.com",155],["mtlurb.com",156],["port.hu",157],["acdriftingpro.com",157],["flight-report.com",157],["forumdz.com",157],["abandonmail.com",157],["flmods.com",157],["zilinak.sk",157],["projectfreetv.stream",157],["hotdesimms.com",157],["pdfaid.com",157],["mconverter.eu",157],["dzeko11.net",[157,267]],["mail.com",157],["expresskaszubski.pl",157],["moegirl.org.cn",157],["onemanhua.com",158],["t3n.de",159],["allindiaroundup.com",160],["vectorizer.io",161],["smgplaza.com",161],["ftuapps.dev",161],["onehack.us",161],["thapcam.net",161],["thefastlaneforum.com",162],["trade2win.com",163],["gmodleaks.com",163],["modagamers.com",164],["freemagazines.top",164],["straatosphere.com",164],["nullpk.com",164],["adslink.pw",164],["downloadudemy.com",164],["picgiraffe.com",164],["weadown.com",164],["freepornsex.net",164],["nurparatodos.com.ar",164],["librospreuniversitariospdf.blogspot.com",165],["msdos-games.com",165],["forexeen.us",165],["khsm.io",165],["girls-like.me",165],["webcreator-journal.com",165],["nu6i-bg-net.com",165],["routech.ro",166],["hokej.net",166],["turkmmo.com",167],["palermotoday.it",168],["baritoday.it",168],["trentotoday.it",168],["agrigentonotizie.it",168],["anconatoday.it",168],["arezzonotizie.it",168],["avellinotoday.it",168],["bresciatoday.it",168],["brindisireport.it",168],["casertanews.it",168],["cataniatoday.it",168],["cesenatoday.it",168],["chietitoday.it",168],["forlitoday.it",168],["frosinonetoday.it",168],["genovatoday.it",168],["ilpescara.it",168],["ilpiacenza.it",168],["latinatoday.it",168],["lecceprima.it",168],["leccotoday.it",168],["livornotoday.it",168],["messinatoday.it",168],["milanotoday.it",168],["modenatoday.it",168],["monzatoday.it",168],["novaratoday.it",168],["padovaoggi.it",168],["parmatoday.it",168],["perugiatoday.it",168],["pisatoday.it",168],["quicomo.it",168],["ravennatoday.it",168],["reggiotoday.it",168],["riminitoday.it",168],["romatoday.it",168],["salernotoday.it",168],["sondriotoday.it",168],["sportpiacenza.it",168],["ternitoday.it",168],["today.it",168],["torinotoday.it",168],["trevisotoday.it",168],["triesteprima.it",168],["udinetoday.it",168],["veneziatoday.it",168],["vicenzatoday.it",168],["thumpertalk.com",169],["arkcod.org",169],["facciabuco.com",170],["softx64.com",171],["thelayoff.com",172],["blog.cryptowidgets.net",172],["blog.freeoseocheck.com",172],["blog.makeupguide.net",172],["shorterall.com",172],["blog24.me",172],["maxstream.video",172],["maxlinks.online",172],["tvepg.eu",172],["pstream.net",173],["dailymaverick.co.za",174],["apps2app.com",175],["fm-arena.com",176],["tradersunion.com",177],["tandess.com",178],["faqwiki.us",179],["sonixgvn.net",179],["spontacts.com",180],["dankmemer.lol",181],["apkmoddone.com",182],["enit.in",183],["financerites.com",183],["fadedfeet.com",184],["homeculina.com",184],["ineedskin.com",184],["kenzo-flowertag.com",184],["lawyex.co",184],["mdn.lol",184],["bitzite.com",185],["tiktokcounter.net",186],["coingraph.us",187],["impact24.us",187],["my-code4you.blogspot.com",188],["vrcmods.com",189],["osuskinner.com",189],["osuskins.net",189],["pentruea.com",[190,191]],["mchacks.net",192],["why-tech.it",193],["compsmag.com",194],["tapetus.pl",195],["gaystream.online",196],["embedv.net",196],["fslinks.org",196],["v6embed.xyz",196],["vgplayer.xyz",196],["vid-guard.com",196],["autoroad.cz",197],["brawlhalla.fr",197],["tecnobillo.com",197],["sexcamfreeporn.com",198],["breatheheavy.com",199],["wenxuecity.com",200],["key-hub.eu",201],["fabioambrosi.it",202],["tattle.life",203],["emuenzen.de",203],["terrylove.com",203],["mynet.com",204],["cidade.iol.pt",205],["fantacalcio.it",206],["hentaifreak.org",207],["hypebeast.com",208],["krankheiten-simulieren.de",209],["catholic.com",210],["3dmodelshare.org",211],["gourmetscans.net",212],["techinferno.com",213],["ibeconomist.com",214],["bookriot.com",215],["purposegames.com",216],["schoolcheats.net",216],["globo.com",217],["latimes.com",217],["claimrbx.gg",218],["perelki.net",219],["vpn-anbieter-vergleich-test.de",220],["livingincebuforums.com",221],["paperzonevn.com",222],["alltechnerd.com",223],["malaysianwireless.com",224],["erinsakura.com",225],["infofuge.com",225],["freejav.guru",225],["novelmultiverse.com",225],["fritidsmarkedet.dk",226],["maskinbladet.dk",226],["15min.lt",227],["lewdninja.com",228],["lewd.ninja",228],["baddiehub.com",229],["mr9soft.com",230],["21porno.com",231],["adult-sex-gamess.com",232],["hentaigames.app",232],["mobilesexgamesx.com",232],["mysexgamer.com",232],["porngameshd.com",232],["sexgamescc.com",232],["xnxx-sex-videos.com",232],["f2movies.to",233],["freeporncave.com",234],["tubsxxx.com",235],["pornojenny.com",236],["subtitle.one",237],["manga18fx.com",238],["freebnbcoin.com",238],["sextvx.com",239],["studydhaba.com",240],["freecourse.tech",240],["victor-mochere.com",240],["papunika.com",240],["mobilanyheter.net",240],["prajwaldesai.com",240],["muztext.com",241],["pornohans.com",242],["nursexfilme.com",242],["pornohirsch.net",242],["xhamster-sexvideos.com",242],["pornoschlange.com",242],["hdpornos.net",242],["gutesexfilme.com",242],["short1.site",242],["zona-leros.com",242],["charbelnemnom.com",243],["simplebits.io",244],["online-fix.me",245],["gamersdiscussionhub.com",246],["owlzo.com",247],["q1003.com",248],["blogpascher.com",249],["testserver.pro",250],["lifestyle.bg",250],["money.bg",250],["news.bg",250],["topsport.bg",250],["webcafe.bg",250],["mgnet.xyz",251],["advertiserandtimes.co.uk",252],["xvideos2020.me",253],["111.90.159.132",254],["techsolveprac.com",255],["joomlabeginner.com",256],["largescaleforums.com",257],["dubznetwork.com",258],["mundodonghua.com",258],["hentaidexy.com",259],["oceanplay.org",260],["code2care.org",261],["xxxxsx.com",263],["ngontinh24.com",264],["panel.freemcserver.net",265],["idevicecentral.com",266],["zona11.com",267],["scsport.live",267],["mangacrab.com",269],["idnes.cz",270],["viefaucet.com",271],["cloud-computing-central.com",272],["afk.guide",273],["businessnamegenerator.com",274],["derstandard.at",275],["derstandard.de",275],["rocketnews24.com",276],["soranews24.com",276],["youpouch.com",276],["ilsole24ore.com",277],["ipacrack.com",278],["hentaiporn.one",279],["infokik.com",280],["daemonanime.net",281],["daemon-hentai.com",281],["deezer.com",282],["fosslinux.com",283],["shrdsk.me",284],["examword.com",285],["sempreupdate.com.br",285],["tribuna.com",286],["trendsderzukunft.de",287],["gal-dem.com",287],["lostineu.eu",287],["oggitreviso.it",287],["speisekarte.de",287],["mixed.de",287],["lightnovelspot.com",[288,289]],["lightnovelworld.com",[288,289]],["novelpub.com",[288,289]],["webnovelpub.com",[288,289]],["mail.yahoo.com",290],["hwzone.co.il",291],["nammakalvi.com",292],["javmoon.me",293],["c2g.at",294],["terafly.me",294],["elamigos-games.com",294],["elamigos-games.net",294],["dktechnicalmate.com",295],["recipahi.com",295],["converter-btc.world",295],["kaystls.site",296],["aquarius-horoscopes.com",297],["cancer-horoscopes.com",297],["dubipc.blogspot.com",297],["echoes.gr",297],["engel-horoskop.de",297],["freegames44.com",297],["fuerzasarmadas.eu",297],["gemini-horoscopes.com",297],["jurukunci.net",297],["krebs-horoskop.com",297],["leo-horoscopes.com",297],["maliekrani.com",297],["nklinks.click",297],["ourenseando.es",297],["pisces-horoscopes.com",297],["radio-en-direct.fr",297],["sagittarius-horoscopes.com",297],["scorpio-horoscopes.com",297],["singlehoroskop-loewe.de",297],["skat-karten.de",297],["skorpion-horoskop.com",297],["taurus-horoscopes.com",297],["the1security.com",297],["torrentmovies.online",297],["virgo-horoscopes.com",297],["zonamarela.blogspot.com",297],["yoima.hatenadiary.com",297],["vpntester.org",298],["watchhentai.net",299],["japscan.lol",300],["digitask.ru",301],["tempumail.com",302],["sexvideos.host",303],["10alert.com",305],["cryptstream.de",306],["nydus.org",306],["techhelpbd.com",307],["fapdrop.com",308],["cellmapper.net",309],["hdrez.com",310],["youwatch-serie.com",310],["printablecreative.com",311],["comohoy.com",312],["leak.sx",312],["paste.bin.sx",312],["pornleaks.in",312],["merlininkazani.com",312],["faindx.com",314],["j91.asia",315],["jeniusplay.com",316],["indianyug.com",317],["rgb.vn",317],["needrom.com",318],["criptologico.com",319],["megadrive-emulator.com",320],["eromanga-show.com",321],["hentai-one.com",321],["hentaipaw.com",321],["10minuteemails.com",322],["luxusmail.org",322],["w3cub.com",323],["bangpremier.com",324],["nyaa.iss.ink",325],["tnp98.xyz",327],["freepdfcomic.com",328],["memedroid.com",329],["animesync.org",330],["karaoketexty.cz",331],["resortcams.com",332],["mjakmama24.pl",334],["security-demo.extrahop.com",335]]);

const entitiesMap = new Map([["comunio",0],["finanzen",[0,6]],["gameswelt",0],["heftig",0],["notebookcheck",0],["testedich",0],["transfermarkt",0],["truckscout24",0],["tvtv",0],["wetteronline",0],["wieistmeineip",0],["wetter",2],["1337x",5],["eztv",5],["sushi-scan",9],["spigotunlocked",9],["ahmedmode",9],["kissasian",13],["rp5",15],["mma-core",16],["writedroid",20],["yts",25],["720pstream",25],["1stream",25],["magesy",26],["thefmovies",29],["urlcero",36],["totaldebrid",39],["sandrives",39],["oploverz",40],["fxporn69",49],["aliancapes",49],["pouvideo",51],["povvideo",51],["povw1deo",51],["povwideo",51],["powv1deo",51],["powvibeo",51],["powvideo",51],["powvldeo",51],["tubsexer",57],["porno-tour",57],["lenkino",57],["pornomoll",57],["camsclips",57],["m4ufree",61],["crackstreams",61],["telerium",75],["pandafreegames",88],["thoptv",96],["brainly",102],["shortzzy",105],["streameast",118],["thestreameast",118],["daddylivehd",118],["solvetube",122],["hdfilme",123],["pornhub",124],["wcofun",131],["bollyholic",135],["gotxx",149],["turkanime",150],["voe-unblock",150],["khatrimaza",164],["pogolinks",164],["popcornstream",166],["vembed",196],["xhamsterdeutsch",242],["privatemoviez",246],["gmx",262],["lightnovelpub",[288,289]],["camcaps",304],["drivebot",326],["thenextplanet1",327],["autoscout24",333]]);

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
