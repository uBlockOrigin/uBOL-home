/*******************************************************************************

    uBlock Origin - a browser extension to block requests.
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

const argsList = [[".call(null)","10"],[".call(null)"],["(null)","10"],["userHasAdblocker"],["objSubPromo"],["adb"],["nrWrapper"],["warn"],["adBlockerDetected"],["show"],["adObjects"],["offsetParent"],["InfMediafireMobileFunc","1000"],["google_jobrunner"],["()","45000"],["prompt"],["0x"],["displayAdBlockedVideo"],[".adsbygoogle"],["contrformpub","5000"],["disabledAdBlock","10000"],["_0x"],["ads.length"],["location.href"],["isDesktopApp","1000"],["Bait"],["admc"],["AdBlocker"],["Blocked"],["nextFunction"],["'0x"],["apstagLOADED"],["Adb"],["disableDeveloper"],["Blocco","2000"],["nextFunction","2000"],["documentElement.classList.add","400"],["test","0"],["checkAdblockUser","1000"],["checkPub","6000"],["document.querySelector","5000"],["nextFunction","250"],["popup"],["()","150"],["backRedirect"],["[native code]","500"],["document.querySelectorAll","1000"],["style"],["clientHeight"],["addEventListener","0"],["adblock","2000"],["document.body.classList.add","100"],["start","0"],["byepopup","5000"],["test.remove","100"],["additional_src","300"],["()","2000"],["css_class.show"],["CANG","3000"],["updato-overlay","500"],["innerText","2000"],["modal"],["alert","8000"],["css_class"],["()","50"],["debugger"],["initializeCourier","3000"],["redirectPage"],["_0x","2000"],["ads","750"],["location.href","500"],["Adblock","5000"],["disable","200"],["CekAab","0"],["rbm_block_active","1000"],["show()"],["n.trigger","1"],["instance.check","1"],["adblock"],["abDetected"],["KeepOpeningPops","1000"],["appendChild"],["()","10"],["adb","0"],["adBlocked"],["warning","100"],["adblock_popup","500"],["Adblock"],["#chatWrap","1000"],["keep-ads","2000"],["#rbm_block_active","1000"],["null","4000"],["()","2500"],["myaabpfun","3000"],["adFilled","2500"],["()","15000"],["showPopup"],["()","1"],["()","1000"],["document.cookie","2500"],["window.open"],["innerHTML"],["readyplayer","2000"],["/text()|0x/"],["checkStopBlock"],["adspot_top","1500"],["xclaim"],["an_message","500"],["Adblocker","10000"],["trigger","0"],["timeoutChecker"],["bait","1"],["pum-open"],["overlay","2000"],["AdBanner","2000"],["test","100"],["replace","1500"],["popCanFire"],["Math.round","1000"],["adblock","5"],["bioEp"],["ag_adBlockerDetected"],["null"],["adsbox","1000"],["adb","6000"],["pop"],["sadbl"],["checkAdStatus"],["()","0"],["mdp"],["brave_load_popup"],["0x","3000"],["invoke"],["adsbytrafficjunkycontext"],["ipod"],["offsetWidth"],["/$|adBlock/"],["ads"],["adsbygoogle"],["()"],["AdBlock"],["stop-scrolling"],["Adv"],["blockUI","2000"],["mdpDeBlocker"],["/_0x|debug/"],["[native code]","1"],["/ai_adb|_0x/"],["iframe"],["adBlock"],["","1"],["undefined"],["eval"],["check","1"],["adsBlocked"],["getComputedStyle","250"],["blocker"],["aswift_"],["afs_ads","2000"],["visibility","2000"],["bait"],["blocked"],["{r()","0"],["nextFunction","450"],["Debug"],["r()","0"],["Math.floor"],["offset"],["purple_box"],["offsetHeight"],["checkSiteNormalLoad"],["adBlockOverlay"],["Detected","500"],["height"],[".show","1000"],[".show"],["innerHTML.replace","1000"],["showModal"],["getComputedStyle"],["blur"],["samOverlay"],["bADBlock"],["location"],["","4000"],["alert"],["blocker","100"],["length"],["ai_adb"],["t()","0"],["$"],["offsetLeft"],[".show()","1000"],["mdp_deblocker"],["charAt"],["checkAds"],["fadeIn","0"],["jQuery"],["/^/"],["check"],["Adblocker"],["eabdModal"],["ab_root.show"],["gaData"],["ad"],["prompt","1000"],["googlefc"],["adblock detection"],[".offsetHeight","100"],["popState"],["ad-block-popup"],["exitTimer"],["innerHTML.replace"],["data?","4000"],[".data?"],["eabpDialog"],[".length","2000"],["adsense"],["googletag"],["f.parentNode.removeChild(f)","100"],["swal","500"],["keepChecking","1000"],["openPopup"],[".offsetHeight"],["()","3000"],["class.scroll","1000"],["disableDeveloperTools"],["Check"],["insertBefore"],["atob"],["css_class.scroll"],["/null|Error/","10000"],["window.location.href","50"],["/out.php"],["/0x|devtools/"],["location.replace","300"],["window.location.href"],["checkVisible"],["_0x","3000"],["window.location.href=link"],["ai_"],["reachGoal"],["ai"],["/width|innerHTML/"],["magnificPopup"],["adblockEnabled"],["ads_block"],["google_ad"],["document.location"],["google"],["top-right","2000"],["enforceAdStatus"],["loadScripts"],["Ads"],["mfp"],["display","5000"],["eb"],[").show()"],["","1000"],["devtool"],["Msg"],["UABP"],["","0"],["","250"],["redURL"],["href"],["aaaaa-modal"],["()=>"],["keepChecking"],["null","10"],["myTypeWriter"],["detected"],["","5"],["","500"],["/Adform|didomi|adblock|forEach/"],["/\\.innerHtml|offsetWidth/"],["showAdblock"],["-0x"],["display"],["gclid"],["rejectWith"],["refresh"],["window.location"],["ga"],["ShowAdBLockerNotice"],["ad_listener"],["open"],["(!0)"],["Delay"],["/appendChild|e\\(\"/"],["=>"],["ADB"],["site-access-popup"],["data?"],["/debugger|UserCustomPop/"],["checkAdblockUser"],["canRunAds"],["displayMessage","2000"],["/salesPopup|mira-snackbar/"],["advanced"],["detectImgLoad"],["offsetHeight","200"],["detector"],["replace"],["touchstart"],["siteAccessFlag"],["ab"],["adblocker"],["/children\\('ins'\\)|Adblock|adsbygoogle/"],["displayMessage"],["fetch"],["afterOpen"],["chkADB"],["onDetected"],["myinfoey","1500"],["placebo"],["offsetHeight","100"],["fuckadb"],["detect"],["siteAccessPopup"],["/adsbygoogle|adblock/"],["akadb"],["biteDisplay"],["m(!0)","800"],["ad_block"],["/detectAdBlocker|window.open/"],["hasAdBlock"],["adBlockDetected"],["popUnder"],["/GoToURL|delay/"],["/adblock|location|_0x/i"],["/adblock/i"],["ad_display"],["ad blocker"]];

const hostnamesMap = new Map([["4-liga.com",0],["4fansites.de",0],["4players.de",0],["9monate.de",0],["aachener-nachrichten.de",0],["aachener-zeitung.de",0],["abendblatt.de",0],["abendzeitung-muenchen.de",0],["about-drinks.com",0],["abseits-ka.de",0],["airliners.de",0],["ajaxshowtime.com",0],["allgemeine-zeitung.de",0],["antenne.de",0],["arcor.de",0],["areadvd.de",0],["areamobile.de",0],["ariva.de",0],["astronews.com",0],["aussenwirtschaftslupe.de",0],["auszeit.bio",0],["auto-motor-und-sport.de",0],["auto-service.de",0],["autobild.de",0],["autoextrem.de",0],["autopixx.de",0],["autorevue.at",0],["az-online.de",0],["baby-vornamen.de",0],["babyclub.de",0],["bafoeg-aktuell.de",0],["berliner-kurier.de",0],["berliner-zeitung.de",0],["bigfm.de",0],["bikerszene.de",0],["bildderfrau.de",0],["blackd.de",0],["blick.de",0],["boerse-online.de",0],["boerse.de",0],["boersennews.de",0],["braunschweiger-zeitung.de",0],["brieffreunde.de",0],["brigitte.de",0],["buerstaedter-zeitung.de",0],["buffed.de",0],["businessinsider.de",0],["buzzfeed.at",0],["buzzfeed.de",0],["caravaning.de",0],["cavallo.de",0],["chefkoch.de",0],["cinema.de",0],["clever-tanken.de",0],["computerbild.de",0],["computerhilfen.de",0],["comunio-cl.com",0],["connect.de",0],["da-imnetz.de",0],["dasgelbeblatt.de",0],["dbna.com",0],["dbna.de",0],["deichstube.de",0],["deine-tierwelt.de",0],["der-betze-brennt.de",0],["derwesten.de",0],["desired.de",0],["dhd24.com",0],["dieblaue24.com",0],["digitalfernsehen.de",0],["dnn.de",0],["donnerwetter.de",0],["e-hausaufgaben.de",0],["e-mountainbike.com",0],["eatsmarter.de",0],["echo-online.de",0],["ecomento.de",0],["einfachschoen.me",0],["elektrobike-online.com",0],["eltern.de",0],["epochtimes.de",0],["essen-und-trinken.de",0],["express.de",0],["extratipp.com",0],["familie.de",0],["fanfiktion.de",0],["fehmarn24.de",0],["fettspielen.de",0],["fid-gesundheitswissen.de",0],["finanznachrichten.de",0],["finanztreff.de",0],["finya.de",0],["firmenwissen.de",0],["fitforfun.de",0],["fnp.de",0],["focus.de",0],["football365.fr",0],["formel1.de",0],["fr.de",0],["frankfurter-wochenblatt.de",0],["freenet.de",0],["fremdwort.de",0],["froheweihnachten.info",0],["frustfrei-lernen.de",0],["fuldaerzeitung.de",0],["funandnews.de",0],["fussballdaten.de",0],["futurezone.de",0],["gala.de",0],["gamepro.de",0],["gamersglobal.de",0],["gamesaktuell.de",0],["gamestar.de",0],["gamezone.de",0],["gartendialog.de",0],["gartenlexikon.de",0],["gedichte.ws",0],["geissblog.koeln",0],["gelnhaeuser-tageblatt.de",0],["general-anzeiger-bonn.de",0],["geniale-tricks.com",0],["genialetricks.de",0],["gesund-vital.de",0],["gesundheit.de",0],["gevestor.de",0],["gewinnspiele.tv",0],["giessener-allgemeine.de",0],["giessener-anzeiger.de",0],["gifhorner-rundschau.de",0],["giga.de",0],["gipfelbuch.ch",0],["gmuender-tagespost.de",0],["golem.de",[0,8,9]],["gruenderlexikon.de",0],["gusto.at",0],["gut-erklaert.de",0],["gutfuerdich.co",0],["hallo-muenchen.de",0],["hamburg.de",0],["hanauer.de",0],["hardwareluxx.de",0],["hartziv.org",0],["harzkurier.de",0],["haus-garten-test.de",0],["hausgarten.net",0],["haustec.de",0],["haz.de",0],["heidelberg24.de",0],["heilpraxisnet.de",0],["heise.de",0],["helmstedter-nachrichten.de",0],["hersfelder-zeitung.de",0],["hftg.co",0],["hifi-forum.de",0],["hna.de",0],["hochheimer-zeitung.de",0],["hoerzu.de",0],["hofheimer-zeitung.de",0],["iban-rechner.de",0],["ikz-online.de",0],["immobilienscout24.de",0],["ingame.de",0],["inside-digital.de",0],["inside-handy.de",0],["investor-verlag.de",0],["jappy.com",0],["jpgames.de",0],["kabeleins.de",0],["kachelmannwetter.com",0],["kamelle.de",0],["kicker.de",0],["kindergeld.org",0],["kino.de",0],["klettern-magazin.de",0],["klettern.de",0],["kochbar.de",0],["kreis-anzeiger.de",0],["kreisbote.de",0],["kreiszeitung.de",0],["ksta.de",0],["kurierverlag.de",0],["lachainemeteo.com",0],["lampertheimer-zeitung.de",0],["landwirt.com",0],["laut.de",0],["lauterbacher-anzeiger.de",0],["leckerschmecker.me",0],["leinetal24.de",0],["lesfoodies.com",0],["levif.be",0],["lifeline.de",0],["liga3-online.de",0],["likemag.com",0],["linux-community.de",0],["linux-magazin.de",0],["ln-online.de",0],["lokalo24.de",0],["lustaufsleben.at",0],["lustich.de",0],["lvz.de",0],["lz.de",0],["macwelt.de",0],["macworld.co.uk",0],["mail.de",0],["main-spitze.de",0],["manager-magazin.de",0],["manga-tube.me",0],["mathebibel.de",0],["mathepower.com",0],["maz-online.de",0],["medisite.fr",0],["mehr-tanken.de",0],["mein-kummerkasten.de",0],["mein-mmo.de",0],["mein-wahres-ich.de",0],["meine-anzeigenzeitung.de",0],["meinestadt.de",0],["menshealth.de",0],["mercato365.com",0],["merkur.de",0],["messen.de",0],["metal-hammer.de",0],["metalflirt.de",0],["meteologix.com",0],["minecraft-serverlist.net",0],["mittelbayerische.de",0],["modhoster.de",0],["moin.de",0],["mopo.de",0],["morgenpost.de",0],["motor-talk.de",0],["motorbasar.de",0],["motorradonline.de",0],["motorsport-total.com",0],["motortests.de",0],["mountainbike-magazin.de",0],["moviejones.de",0],["moviepilot.de",0],["mt.de",0],["mtb-news.de",0],["musiker-board.de",0],["musikexpress.de",0],["musikradar.de",0],["mz-web.de",0],["n-tv.de",0],["naumburger-tageblatt.de",0],["netzwelt.de",0],["neuepresse.de",0],["neueroeffnung.info",0],["news.at",0],["news.de",0],["news38.de",0],["newsbreak24.de",0],["nickles.de",0],["nicknight.de",0],["nl.hardware.info",0],["nn.de",0],["nnn.de",0],["nordbayern.de",0],["notebookchat.com",0],["notebookcheck-ru.com",0],["notebookcheck-tr.com",0],["noz-cdn.de",0],["noz.de",0],["nrz.de",0],["nw.de",0],["nwzonline.de",0],["oberhessische-zeitung.de",0],["oeffentlicher-dienst.info",0],["onlinekosten.de",0],["onvista.de",0],["op-marburg.de",0],["op-online.de",0],["outdoor-magazin.com",0],["outdoorchannel.de",0],["paradisi.de",0],["pc-magazin.de",0],["pcgames.de",0],["pcgameshardware.de",0],["pcwelt.de",0],["pcworld.es",0],["peiner-nachrichten.de",0],["pferde.de",0],["pietsmiet.de",0],["pixelio.de",0],["pkw-forum.de",0],["playboy.de",0],["playfront.de",0],["pnn.de",0],["pons.com",0],["prad.de",[0,141]],["prignitzer.de",0],["profil.at",0],["promipool.de",0],["promobil.de",0],["prosiebenmaxx.de",0],["psychic.de",[0,169]],["quoka.de",0],["radio.at",0],["radio.de",0],["radio.dk",0],["radio.es",0],["radio.fr",0],["radio.it",0],["radio.net",0],["radio.pl",0],["radio.pt",0],["radio.se",0],["ran.de",0],["readmore.de",0],["rechtslupe.de",0],["recording.de",0],["rennrad-news.de",0],["reuters.com",0],["reviersport.de",0],["rhein-main-presse.de",0],["rheinische-anzeigenblaetter.de",0],["rimondo.com",0],["roadbike.de",0],["roemische-zahlen.net",0],["rollingstone.de",0],["rot-blau.com",0],["rp-online.de",0],["rtl.de",[0,268]],["rtv.de",0],["rugby365.fr",0],["ruhr24.de",0],["rundschau-online.de",0],["runnersworld.de",0],["safelist.eu",0],["salzgitter-zeitung.de",0],["sat1.de",0],["sat1gold.de",0],["schwaebische-post.de",0],["schwarzwaelder-bote.de",0],["serienjunkies.de",0],["shz.de",0],["sixx.de",0],["skodacommunity.de",0],["smart-wohnen.net",0],["sn.at",0],["sozialversicherung-kompetent.de",0],["spiegel.de",0],["spielen.de",0],["spieletipps.de",0],["spielfilm.de",0],["sport.de",0],["sport365.fr",0],["sportal.de",0],["spox.com",0],["stern.de",0],["stuttgarter-nachrichten.de",0],["stuttgarter-zeitung.de",0],["sueddeutsche.de",0],["svz.de",0],["szene1.at",0],["szene38.de",0],["t-online.de",0],["tagesspiegel.de",0],["taschenhirn.de",0],["techadvisor.co.uk",0],["techstage.de",0],["tele5.de",0],["the-voice-of-germany.de",0],["thueringen24.de",0],["tichyseinblick.de",0],["tierfreund.co",0],["tiervermittlung.de",0],["torgranate.de",0],["trend.at",0],["tv-media.at",0],["tvdigital.de",0],["tvinfo.de",0],["tvspielfilm.de",0],["tvtoday.de",0],["tz.de",0],["unicum.de",0],["unnuetzes.com",0],["unsere-helden.com",0],["unterhalt.net",0],["usinger-anzeiger.de",0],["usp-forum.de",0],["videogameszone.de",0],["vienna.at",0],["vip.de",0],["virtualnights.com",0],["vox.de",0],["wa.de",0],["wallstreet-online.de",[0,3]],["waz.de",0],["weather.us",0],["webfail.com",0],["weihnachten.me",0],["weihnachts-bilder.org",0],["weihnachts-filme.com",0],["welt.de",0],["weltfussball.at",0],["weristdeinfreund.de",0],["werkzeug-news.de",0],["werra-rundschau.de",0],["wetterauer-zeitung.de",0],["wiesbadener-kurier.de",0],["wiesbadener-tagblatt.de",0],["winboard.org",0],["windows-7-forum.net",0],["winfuture.de",0],["wintotal.de",0],["wlz-online.de",0],["wn.de",0],["wohngeld.org",0],["wolfenbuetteler-zeitung.de",0],["wolfsburger-nachrichten.de",0],["woman.at",0],["womenshealth.de",0],["wormser-zeitung.de",0],["woxikon.de",0],["wp.de",0],["wr.de",0],["yachtrevue.at",0],["ze.tt",0],["zeit.de",0],["meineorte.com",1],["osthessen-news.de",1],["techadvisor.com",1],["economictimes.indiatimes.com",4],["m.timesofindia.com",5],["timesofindia.indiatimes.com",5],["youmath.it",5],["redensarten-index.de",5],["lesoir.be",5],["electriciansforums.net",5],["keralatelecom.info",5],["universegunz.net",5],["happypenguin.altervista.org",5],["everyeye.it",5],["bluedrake42.com",5],["streamservicehd.click",5],["supermarioemulator.com",5],["futbollibrehd.com",5],["newsrade.com",5],["eska.pl",5],["eskarock.pl",5],["voxfm.pl",5],["mathaeser.de",5],["freethesaurus.com",7],["thefreedictionary.com",7],["hdbox.ws",9],["todopolicia.com",9],["scat.gold",9],["freecoursesite.com",9],["windowcleaningforums.co.uk",9],["cruisingearth.com",9],["hobby-machinist.com",9],["freegogpcgames.com",9],["latitude.to",9],["kitchennovel.com",9],["w3layouts.com",9],["blog.receivefreesms.co.uk",9],["eductin.com",9],["dealsfinders.blog",9],["audiobooks4soul.com",9],["tinhocdongthap.com",9],["sakarnewz.com",9],["downloadr.in",9],["topcomicporno.com",9],["dongknows.com",9],["traderepublic.community",9],["celtadigital.com",9],["iptvrun.com",9],["adsup.lk",9],["cryptomonitor.in",9],["areatopik.com",9],["cardscanner.co",9],["nullforums.net",9],["courseclub.me",9],["tamarindoyam.com",9],["choiceofmods.com",9],["myqqjd.com",9],["ssdtop.com",9],["apkhex.com",9],["gezegenforum.com",9],["mbc2.live",9],["forumnulled.com",9],["iptvapps.net",9],["null-scripts.net",9],["nullscripts.net",9],["whncourses.com",9],["bloground.ro",9],["witcherhour.com",9],["ottverse.com",9],["mdn.lol",[9,274]],["torrentmac.net",9],["mazakony.com",9],["laptechinfo.com",9],["mc-at.org",9],["playstationhaber.com",9],["mangapt.com",9],["seriesperu.com",9],["pesprofessionals.com",9],["wpsimplehacks.com",9],["sportshub.to",[9,267]],["topsporter.net",[9,267]],["darkwanderer.net",9],["truckingboards.com",9],["coldfrm.org",9],["azrom.net",9],["freepatternsarea.com",9],["alttyab.net",9],["hq-links.com",9],["mobilkulup.com",9],["esopress.com",9],["rttar.com",9],["nesiaku.my.id",9],["jipinsoft.com",9],["surfsees.com",9],["truthnews.de",9],["farsinama.com",9],["worldofiptv.com",9],["vuinsider.com",9],["crazydl.net",9],["gamemodsbase.com",9],["babiato.tech",9],["secuhex.com",9],["turkishaudiocenter.com",9],["galaxyos.net",9],["blackhatworld.com",9],["geektime.co.il",10],["bild.de",11],["mediafire.com",12],["wcoanimedub.tv",13],["wcoforever.net",13],["openspeedtest.com",13],["addtobucketlist.com",13],["3dzip.org",[13,91]],["ilmeteo.it",13],["wcoforever.com",13],["comprovendolibri.it",13],["healthelia.com",13],["keephealth.info",14],["australianfrequentflyer.com.au",15],["afreesms.com",16],["kinoger.re",16],["laksa19.github.io",16],["imgux.buzz",16],["imgewe.buzz",16],["imgxxxx.buzz",16],["imgeza.buzz",16],["imgzzzz.buzz",16],["imgxhfr.buzz",16],["imgqwt.buzz",16],["imgtwq.buzz",16],["imgbjryy.buzz",16],["imgjetr.buzz",16],["imgxelz.buzz",16],["imgytreq.buzz",16],["javcl.com",16],["upvideo.to",16],["tvlogy.to",16],["himovies.to",16],["live.dragaoconnect.net",16],["beststremo.com",16],["seznam.cz",16],["xerifetech.com",16],["wallpapershome.com",18],["ville-ideale.fr",19],["calciomercato.it",20],["calciomercato.com",21],["bersamatekno.com",21],["hotpornfile.org",21],["robloxscripts.com",21],["coolsoft.altervista.org",21],["worldcupfootball.me",[21,26]],["hackedonlinegames.com",21],["jkoding.xyz",21],["settlersonlinemaps.com",21],["1cloudfile.com",21],["magdownload.org",21],["kpkuang.org",21],["shareus.site",21],["crypto4yu.com",21],["faucetwork.space",21],["claimclicks.com",21],["thenightwithoutthedawn.blogspot.com",21],["entutes.com",21],["claimlite.club",21],["bazadecrypto.com",[21,313]],["whosampled.com",22],["imgkings.com",23],["pornvideotop.com",23],["krotkoosporcie.pl",23],["anghami.com",24],["wired.com",25],["tutele.sx",26],["footyhunter3.xyz",26],["magesypro.pro",[27,28]],["tinyppt.com",27],["audiotools.pro",28],["magesy.blog",28],["audioztools.com",[28,29]],["altblogger.net",29],["satoshi-win.xyz",29],["freedeepweb.blogspot.com",29],["freesoft.id",29],["zcteam.id",29],["www-daftarharga.blogspot.com",29],["ear-phone-review.com",29],["telefullenvivo.com",29],["allfoot.info",29],["listatv.pl",29],["encurtandourl.com",[29,155]],["katestube.com",30],["short.pe",30],["footystreams.net",30],["seattletimes.com",31],["yiv.com",32],["pornohans.com",32],["pornoente.tv",[32,81]],["nursexfilme.com",32],["milffabrik.com",[32,81]],["pornohirsch.net",32],["pornozebra.com",[32,81]],["xhamster-sexvideos.com",32],["pornoschlange.com",32],["hdpornos.net",32],["gutesexfilme.com",32],["pornotom.com",[32,81]],["short1.site",32],["zona-leros.com",32],["globalrph.com",33],["e-glossa.it",34],["java-forum.org",35],["comunidadgzone.es",35],["anime-extremo.com",35],["mp3fy.com",35],["lebensmittelpraxis.de",35],["ebookdz.com",35],["forum-pokemon-go.fr",35],["praxis-jugendarbeit.de",35],["gdrivez.xyz",35],["dictionnaire-medical.net",35],["cle0desktop.blogspot.com",35],["up-load.io",35],["direct-link.net",35],["direkt-wissen.com",35],["keysbrasil.blogspot.com",35],["hotpress.info",35],["turkleech.com",35],["anibatch.me",35],["anime-i.com",35],["healthtune.site",35],["gewinde-normen.de",35],["freewebscript.com",36],["webcheats.com.br",37],["gala.fr",39],["gentside.com",39],["geo.fr",39],["hbrfrance.fr",39],["nationalgeographic.fr",39],["ohmymag.com",39],["serengo.net",39],["vsd.fr",39],["updato.com",[40,59]],["methbox.com",41],["daizurin.com",41],["pendekarsubs.us",41],["dreamfancy.org",41],["rysafe.blogspot.com",41],["toppng.com",41],["th-world.com",41],["avjamack.com",41],["avjamak.net",41],["techacode.com",41],["daddyhd.com",43],["embedstream.me",43],["yts-subs.net",43],["cnnamador.com",44],["ksbw.com",45],["nudecelebforum.com",46],["pronpic.org",47],["thewebflash.com",48],["discordfastfood.com",48],["xup.in",48],["popularmechanics.com",49],["op.gg",50],["makeuseof.com",51],["lequipe.fr",52],["jellynote.com",53],["knights-table.net",54],["eporner.com",55],["pornbimbo.com",56],["allmonitors24.com",56],["4j.com",56],["avoiderrors.com",57],["cgtips.org",[57,213]],["sitarchive.com",57],["livenewsof.com",57],["topnewsshow.com",57],["gatcha.org",57],["empregoestagios.com",57],["everydayonsales.com",57],["kusonime.com",57],["aagmaal.xyz",57],["suicidepics.com",57],["codesnail.com",57],["codingshiksha.com",57],["graphicux.com",57],["hardcoregames.ca",57],["asyadrama.com",57],["bitcoinegypt.news",57],["citychilli.com",57],["talkjarvis.com",57],["hdmotori.it",58],["femdomtb.com",60],["camhub.cc",60],["bobs-tube.com",60],["ru-xvideos.me",60],["pornfd.com",60],["popno-tour.net",60],["molll.mobi",60],["watchmdh.to",60],["camwhores.tv",60],["audioz.cc",61],["audioz.es",61],["vectorizer.io",61],["smgplaza.com",61],["ftuapps.dev",61],["onehack.us",61],["thapcam.net",61],["elfqrin.com",62],["satcesc.com",63],["apfelpatient.de",63],["lusthero.com",64],["hpav.tv",65],["hpjav.tv",65],["m2list.com",65],["embed.nana2play.com",65],["elahmad.com",65],["dofusports.xyz",65],["pobre.tv",65],["dallasnews.com",66],["lnk.news",67],["lnk.parts",67],["efukt.com",68],["wendycode.com",68],["springfieldspringfield.co.uk",69],["porndoe.com",70],["smsget.net",[71,72]],["kjanime.net",73],["gioialive.it",74],["classicreload.com",75],["chicoer.com",76],["bostonherald.com",76],["dailycamera.com",76],["gomiblog.com",77],["maxcheaters.com",78],["rbxoffers.com",78],["postimees.ee",78],["police.community",78],["gisarea.com",78],["schaken-mods.com",78],["theclashify.com",78],["txori.com",78],["olarila.com",78],["deletedspeedstreams.blogspot.com",78],["sportsplays.com",79],["deinesexfilme.com",81],["einfachtitten.com",81],["halloporno.com",81],["herzporno.com",81],["lesbenhd.com",81],["porn-monkey.com",81],["porndrake.com",81],["pornhubdeutsch.net",81],["pornoaffe.com",81],["pornodavid.com",81],["pornofisch.com",81],["pornofelix.com",81],["pornohammer.com",81],["pornohelm.com",81],["pornoklinge.com",81],["pornotommy.com",81],["pornovideos-hd.com",81],["xhamsterdeutsch.xyz",81],["xnxx-sexfilme.com",81],["masihbelajar.com",81],["zerion.cc",81],["androidworld.it",82],["letribunaldunet.fr",83],["vladan.fr",83],["live-tv-channels.org",84],["eslfast.com",85],["freegamescasual.com",86],["tcpvpn.com",87],["oko.sh",87],["bookriot.com",87],["timesnownews.com",87],["timesnowhindi.com",87],["timesnowmarathi.com",87],["zoomtventertainment.com",87],["xxxuno.com",88],["sholah.net",89],["2rdroid.com",89],["bisceglielive.it",90],["pandajogosgratis.com.br",92],["5278.cc",93],["tonspion.de",95],["duplichecker.com",96],["plagiarismchecker.co",96],["plagiarismdetector.net",96],["searchenginereports.net",96],["smallseotools.com",96],["giallozafferano.it",97],["autojournal.fr",97],["autoplus.fr",97],["sportauto.fr",97],["linkspaid.com",98],["proxydocker.com",98],["beeimg.com",[99,100]],["emturbovid.com",100],["ftlauderdalebeachcam.com",101],["ftlauderdalewebcam.com",101],["juneauharborwebcam.com",101],["keywestharborwebcam.com",101],["kittycatcam.com",101],["mahobeachcam.com",101],["miamiairportcam.com",101],["morganhillwebcam.com",101],["njwildlifecam.com",101],["nyharborwebcam.com",101],["paradiseislandcam.com",101],["pompanobeachcam.com",101],["portbermudawebcam.com",101],["portcanaveralwebcam.com",101],["portevergladeswebcam.com",101],["portmiamiwebcam.com",101],["portnywebcam.com",101],["portnassauwebcam.com",101],["portstmaartenwebcam.com",101],["porttampawebcam.com",101],["sxmislandcam.com",101],["gearingcommander.com",101],["themes-dl.com",101],["badassdownloader.com",101],["badasshardcore.com",101],["badassoftcore.com",101],["nulljungle.com",101],["teevee.asia",101],["otakukan.com",101],["linksht.com",103],["generate.plus",104],["calculate.plus",104],["avcesar.com",105],["audiotag.info",106],["tudigitale.it",107],["ibcomputing.com",108],["eodev.com",109],["legia.net",110],["acapellas4u.co.uk",111],["streamhentaimovies.com",112],["konten.co.id",113],["diariodenavarra.es",114],["xiaomifans.pl",115],["eletronicabr.com",115],["iphonesoft.fr",116],["gload.cc",117],["optifine.net",118],["luzernerzeitung.ch",119],["tagblatt.ch",119],["spellcheck.net",120],["spellchecker.net",120],["spellweb.com",120],["ableitungsrechner.net",121],["alternet.org",122],["imtranslator.net",123],["shrib.com",124],["pandafiles.com",125],["vidia.tv",[125,148]],["hortonanderfarom.blogspot.com",125],["clarifystraight.com",125],["constraindefiant.net",126],["tutelehd3.xyz",126],["mega4upload.com",126],["coolcast2.com",126],["techclips.net",126],["earthquakecensus.com",126],["footyhunter.lol",126],["gamerarcades.com",126],["poscitech.click",126],["starlive.stream",126],["utopianwilderness.com",126],["wecast.to",126],["sportbar.live",126],["lordchannel.com",126],["play-old-pc-games.com",127],["scrin.org",128],["tunovelaligera.com",129],["tapchipi.com",129],["cuitandokter.com",129],["tech-blogs.com",129],["cardiagn.com",129],["dcleakers.com",129],["esgeeks.com",129],["pugliain.net",129],["uplod.net",129],["worldfreeware.com",129],["fikiri.net",129],["myhackingworld.com",129],["phoenixfansub.com",129],["freecourseweb.com",130],["devcourseweb.com",130],["coursewikia.com",130],["courseboat.com",130],["coursehulu.com",130],["lne.es",134],["pornult.com",135],["webcamsdolls.com",135],["bitcotasks.com",135],["exactpay.online",135],["thothd.to",135],["proplanta.de",136],["hydrogenassociation.org",137],["ludigames.com",137],["made-by.org",137],["xenvn.com",137],["worldtravelling.com",137],["igirls.in",137],["technichero.com",137],["roshiyatech.my.id",137],["1upinfinite.com",137],["24sport.stream",137],["tii.la",137],["yesmangas1.com",137],["aeroxplorer.com",137],["mad4wheels.com",138],["logi.im",138],["emailnator.com",138],["textograto.com",139],["voyageforum.com",140],["hmc-id.blogspot.com",140],["jemerik.com",140],["myabandonware.com",140],["chatta.it",142],["ketubanjiwa.com",143],["nsfw247.to",144],["funzen.net",144],["notmekani.com",144],["fighter.stream",144],["ilclubdellericette.it",144],["hubstream.in",144],["extremereportbot.com",[145,146]],["getintopc.com",147],["qoshe.com",149],["lowellsun.com",150],["mamadu.pl",150],["dobrapogoda24.pl",150],["motohigh.pl",150],["namasce.pl",150],["ultimate-catch.eu",151],["tabele-kalorii.pl",151],["cpopchanelofficial.com",153],["cryptowidgets.net",[153,270]],["creditcardgenerator.com",154],["creditcardrush.com",154],["bostoncommons.net",154],["thejobsmovie.com",154],["livsavr.co",154],["hl-live.de",155],["ihow.info",155],["filesus.com",155],["sturls.com",155],["re.two.re",155],["turbo1.co",155],["nilopolisonline.com.br",156],["mesquitaonline.com",156],["yellowbridge.com",156],["socialgirls.im",157],["yaoiotaku.com",158],["camhub.world",159],["moneyhouse.ch",160],["cigarlessarefy.com",161],["figeterpiazine.com",161],["yodelswartlike.com",161],["generatesnitrosate.com",161],["crownmakermacaronicism.com",161],["chromotypic.com",161],["gamoneinterrupted.com",161],["metagnathtuggers.com",161],["wolfdyslectic.com",161],["rationalityaloelike.com",161],["sizyreelingly.com",161],["simpulumlamerop.com",161],["urochsunloath.com",161],["monorhinouscassaba.com",161],["counterclockwisejacky.com",161],["35volitantplimsoles5.com",161],["scatch176duplicities.com",161],["antecoxalbobbing1010.com",161],["boonlessbestselling244.com",161],["cyamidpulverulence530.com",161],["guidon40hyporadius9.com",161],["449unceremoniousnasoseptal.com",161],["19turanosephantasia.com",161],["30sensualizeexpression.com",161],["321naturelikefurfuroid.com",161],["745mingiestblissfully.com",161],["availedsmallest.com",161],["greaseball6eventual20.com",161],["toxitabellaeatrebates306.com",161],["20demidistance9elongations.com",161],["audaciousdefaulthouse.com",161],["fittingcentermondaysunday.com",161],["fraudclatterflyingcar.com",161],["launchreliantcleaverriver.com",161],["matriculant401merited.com",161],["realfinanceblogcenter.com",161],["reputationsheriffkennethsand.com",161],["telyn610zoanthropy.com",161],["tubelessceliolymph.com",161],["tummulerviolableness.com",161],["un-block-voe.net",161],["v-o-e-unblock.com",161],["voe-un-block.com",161],["voeun-block.net",161],["voeunbl0ck.com",161],["voeunblck.com",161],["voeunblk.com",161],["voeunblock.com",161],["voeunblock1.com",161],["voeunblock2.com",161],["voeunblock3.com",161],["agefi.fr",162],["cariskuy.com",163],["letras2.com",163],["yusepjaelani.blogspot.com",164],["letras.mus.br",165],["soulreaperzone.com",166],["cheatermad.com",167],["mtlurb.com",168],["port.hu",169],["acdriftingpro.com",169],["flight-report.com",169],["forumdz.com",169],["abandonmail.com",169],["beverfood.com",169],["flmods.com",169],["zilinak.sk",169],["temp-phone-number.com",169],["projectfreetv.stream",169],["hotdesimms.com",169],["pdfaid.com",169],["mconverter.eu",169],["dzeko11.net",[169,267]],["mail.com",169],["expresskaszubski.pl",169],["moegirl.org.cn",169],["onemanhua.com",170],["t3n.de",171],["allindiaroundup.com",172],["osuskinner.com",173],["vrcmods.com",173],["thefastlaneforum.com",174],["trade2win.com",175],["gmodleaks.com",175],["fontyukle.net",176],["modagamers.com",177],["nulleb.com",177],["freemagazines.top",177],["straatosphere.com",177],["nullpk.com",177],["adslink.pw",177],["downloadudemy.com",177],["techydino.net",177],["picgiraffe.com",177],["weadown.com",177],["freepornsex.net",177],["nurparatodos.com.ar",177],["librospreuniversitariospdf.blogspot.com",178],["forexeen.us",178],["khsm.io",178],["girls-like.me",178],["webcreator-journal.com",178],["nu6i-bg-net.com",178],["routech.ro",179],["hokej.net",179],["turkmmo.com",180],["palermotoday.it",181],["baritoday.it",181],["trentotoday.it",181],["agrigentonotizie.it",181],["anconatoday.it",181],["arezzonotizie.it",181],["avellinotoday.it",181],["bresciatoday.it",181],["brindisireport.it",181],["casertanews.it",181],["cataniatoday.it",181],["cesenatoday.it",181],["chietitoday.it",181],["forlitoday.it",181],["frosinonetoday.it",181],["genovatoday.it",181],["ilpescara.it",181],["ilpiacenza.it",181],["latinatoday.it",181],["lecceprima.it",181],["leccotoday.it",181],["livornotoday.it",181],["messinatoday.it",181],["milanotoday.it",181],["modenatoday.it",181],["monzatoday.it",181],["novaratoday.it",181],["padovaoggi.it",181],["parmatoday.it",181],["perugiatoday.it",181],["pisatoday.it",181],["quicomo.it",181],["ravennatoday.it",181],["reggiotoday.it",181],["riminitoday.it",181],["romatoday.it",181],["salernotoday.it",181],["sondriotoday.it",181],["sportpiacenza.it",181],["ternitoday.it",181],["today.it",181],["torinotoday.it",181],["trevisotoday.it",181],["triesteprima.it",181],["udinetoday.it",181],["veneziatoday.it",181],["vicenzatoday.it",181],["thumpertalk.com",182],["arkcod.org",182],["facciabuco.com",183],["shorterall.com",184],["thelayoff.com",184],["maxstream.video",184],["tvepg.eu",184],["blog24.me",184],["softx64.com",185],["pstream.net",186],["instaanime.com",186],["libreriamo.it",187],["medebooks.xyz",187],["tutorials-technology.info",187],["mashtips.com",187],["marriedgames.com.br",187],["4allprograms.me",187],["nurgsm.com",187],["janusnotes.com",187],["certbyte.com",187],["plugincrack.com",187],["gamingdeputy.com",187],["cryptoblog24.info",187],["freewebcart.com",187],["dailymaverick.co.za",188],["apps2app.com",189],["my-code4you.blogspot.com",190],["leakgaming.fr",191],["pentruea.com",[192,193]],["mchacks.net",194],["why-tech.it",195],["hacksmile.com",196],["compsmag.com",196],["tapetus.pl",197],["autoroad.cz",198],["brawlhalla.fr",198],["tecnobillo.com",198],["sexcamfreeporn.com",199],["breatheheavy.com",200],["wenxuecity.com",201],["key-hub.eu",202],["fabioambrosi.it",203],["tamrieltradecentre.com",[203,261]],["tattle.life",204],["emuenzen.de",204],["mynet.com",205],["cidade.iol.pt",206],["fantacalcio.it",207],["hentaifreak.org",208],["hypebeast.com",209],["krankheiten-simulieren.de",210],["catholic.com",211],["3dmodelshare.org",212],["gourmetscans.net",213],["techinferno.com",214],["phuongtrinhhoahoc.com",215],["ibeconomist.com",216],["purposegames.com",217],["schoolcheats.net",217],["globo.com",218],["latimes.com",218],["claimrbx.gg",219],["perelki.net",220],["vpn-anbieter-vergleich-test.de",221],["livingincebuforums.com",222],["paperzonevn.com",223],["malaysianwireless.com",224],["erinsakura.com",225],["infofuge.com",225],["freejav.guru",225],["novelmultiverse.com",225],["fritidsmarkedet.dk",226],["maskinbladet.dk",226],["15min.lt",227],["lewdninja.com",228],["lewd.ninja",228],["hentaidexy.com",228],["baddiehub.com",229],["mr9soft.com",230],["21porno.com",231],["adult-sex-gamess.com",232],["hentaigames.app",232],["mobilesexgamesx.com",232],["mysexgamer.com",232],["porngameshd.com",232],["sexgamescc.com",232],["xnxx-sex-videos.com",232],["f2movies.to",233],["freeporncave.com",234],["tubsxxx.com",235],["pornojenny.com",236],["subtitle.one",237],["sextvx.com",238],["studydhaba.com",239],["freecourse.tech",239],["ccthesims.com",239],["victor-mochere.com",239],["papunika.com",239],["mobilanyheter.net",239],["prajwaldesai.com",239],["muztext.com",240],["charbelnemnom.com",241],["online-fix.me",242],["gamersdiscussionhub.com",243],["owlzo.com",244],["maxpixel.net",245],["q1003.com",246],["blogpascher.com",247],["testserver.pro",248],["mgnet.xyz",249],["advertiserandtimes.co.uk",250],["xvideos2020.me",251],["wouterplanet.com",252],["deezer.com",252],["111.90.159.132",253],["techsolveprac.com",254],["joomlabeginner.com",255],["largescaleforums.com",256],["dubznetwork.com",257],["mundodonghua.com",257],["oceanplay.org",258],["code2care.org",259],["osuskins.net",262],["allcryptoz.net",263],["crewbase.net",263],["crewus.net",263],["shinbhu.net",263],["shinchu.net",263],["thumb8.net",263],["thumb9.net",263],["topcryptoz.net",263],["uniqueten.net",263],["ultraten.net",263],["hlspanel.xyz",263],["fapdrop.com",263],["beritabaru.news",264],["solusi.cyou",264],["xxxxsx.com",264],["ngontinh24.com",265],["idevicecentral.com",266],["referus.in",269],["coinscap.info",270],["greenenez.com",270],["insurancegold.in",270],["webfreetools.net",270],["wiki-topia.com",270],["enit.in",271],["financerites.com",271],["mangacrab.com",272],["idnes.cz",273],["viefaucet.com",275],["cloud-computing-central.com",276],["afk.guide",277],["businessnamegenerator.com",278],["rocketnews24.com",279],["soranews24.com",279],["youpouch.com",279],["ilsole24ore.com",280],["hentaiporn.one",281],["infokik.com",282],["fosslinux.com",283],["shrdsk.me",284],["examword.com",285],["sempreupdate.com.br",285],["tribuna.com",286],["trendsderzukunft.de",287],["gal-dem.com",287],["lostineu.eu",287],["oggitreviso.it",287],["speisekarte.de",287],["mixed.de",287],["lightnovelspot.com",[288,289]],["lightnovelworld.com",[288,289]],["novelpub.com",[288,289]],["webnovelpub.com",[288,289]],["mail.yahoo.com",290],["hwzone.co.il",291],["nammakalvi.com",292],["javmoon.me",293],["c2g.at",294],["terafly.me",294],["bravedown.com",295],["aquarius-horoscopes.com",296],["cancer-horoscopes.com",296],["dubipc.blogspot.com",296],["echoes.gr",296],["engel-horoskop.de",296],["freegames44.com",296],["fuerzasarmadas.eu",296],["gemini-horoscopes.com",296],["jurukunci.net",296],["krebs-horoskop.com",296],["leo-horoscopes.com",296],["maliekrani.com",296],["nklinks.click",296],["ourenseando.es",296],["pisces-horoscopes.com",296],["radio-en-direct.fr",296],["sagittarius-horoscopes.com",296],["scorpio-horoscopes.com",296],["singlehoroskop-loewe.de",296],["skat-karten.de",296],["skorpion-horoskop.com",296],["taurus-horoscopes.com",296],["the1security.com",296],["virgo-horoscopes.com",296],["zonamarela.blogspot.com",296],["yoima.hatenadiary.com",296],["vpntester.org",297],["watchhentai.net",298],["japscan.lol",299],["digitask.ru",300],["tempumail.com",301],["sexvideos.host",302],["10alert.com",304],["cryptstream.de",305],["nydus.org",305],["techhelpbd.com",306],["cellmapper.net",307],["hdrez.com",308],["youwatch-serie.com",308],["freebnbcoin.com",309],["fslinks.org",310],["v6embed.xyz",310],["vgembed.com",310],["vid-guard.com",310],["printablecreative.com",311],["comohoy.com",312],["leak.sx",312],["pornleaks.in",312],["merlininkazani.com",312],["faindx.com",314],["converter-btc.world",315],["j91.asia",316],["jeniusplay.com",317],["indianyug.com",318],["rgb.vn",318],["needrom.com",319],["criptologico.com",320],["megadrive-emulator.com",321],["hentai-one.com",322],["hentaipaw.com",322],["10minuteemails.com",323],["luxusmail.org",323],["w3cub.com",324],["dgb.lol",325],["bangpremier.com",326],["nyaa.iss.ink",327],["lifestyle.bg",329],["money.bg",329],["news.bg",329],["topsport.bg",329],["webcafe.bg",329],["scripai.com",330],["myfxbook.com",330],["freepdfcomic.com",331],["security-demo.extrahop.com",332]]);

const entitiesMap = new Map([["comunio",0],["finanzen",[0,6]],["gameswelt",0],["heftig",0],["notebookcheck",0],["testedich",0],["transfermarkt",0],["truckscout24",0],["tvtv",0],["wetteronline",0],["wieistmeineip",0],["wetter",2],["1337x",5],["eztv",5],["sushi-scan",9],["spigotunlocked",9],["ahmedmode",9],["kissasian",14],["rp5",16],["mma-core",17],["writedroid",21],["yts",26],["720pstream",26],["1stream",26],["magesy",27],["thefmovies",30],["xhamsterdeutsch",32],["fxporn69",35],["aliancapes",35],["urlcero",38],["totaldebrid",41],["sandrives",41],["oploverz",42],["pouvideo",54],["povvideo",54],["povw1deo",54],["povwideo",54],["powv1deo",54],["powvibeo",54],["powvideo",54],["powvldeo",54],["tubsexer",60],["porno-tour",60],["lenkino",60],["pornomoll",60],["camsclips",60],["m4ufree",65],["dood",65],["crackstreams",65],["telerium",80],["pandafreegames",94],["thoptv",102],["brainly",109],["streameast",126],["thestreameast",126],["daddylivehd",126],["solvetube",131],["hdfilme",132],["pornhub",133],["wcofun",140],["bollyholic",144],["wstream",152],["gotxx",155],["turkanime",161],["voe-unblock",161],["khatrimaza",177],["pogolinks",177],["popcornstream",179],["shortzzy",187],["shineads",187],["privatemoviez",243],["gmx",260],["lightnovelpub",[288,289]],["camcaps",303],["drivebot",328]]);

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
            const a = String(args[0]);
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
        'Error': self.Error,
        'Object_defineProperty': Object.defineProperty.bind(Object),
        'RegExp': self.RegExp,
        'RegExp_test': self.RegExp.prototype.test,
        'RegExp_exec': self.RegExp.prototype.exec,
        'XMLHttpRequest': self.XMLHttpRequest,
        'addEventListener': self.EventTarget.prototype.addEventListener,
        'removeEventListener': self.EventTarget.prototype.removeEventListener,
        'fetch': self.fetch,
        'jsonParse': self.JSON.parse.bind(self.JSON),
        'jsonStringify': self.JSON.stringify.bind(self.JSON),
        'log': console.log.bind(console),
        uboLog(...args) {
            if ( args.length === 0 ) { return; }
            if ( `${args[0]}` === '' ) { return; }
            this.log('[uBO]', ...args);
        },
        initPattern(pattern, options = {}) {
            if ( pattern === '' ) {
                return { matchAll: true };
            }
            const expect = (options.canNegate === true && pattern.startsWith('!') === false);
            if ( expect === false ) {
                pattern = pattern.slice(1);
            }
            const match = /^\/(.+)\/([gimsu]*)$/.exec(pattern);
            if ( match !== null ) {
                return {
                    pattern,
                    re: new this.RegExp(
                        match[1],
                        match[2] || options.flags
                    ),
                    expect,
                };
            }
            return {
                pattern,
                re: new this.RegExp(pattern.replace(
                    /[.*+?^${}()|[\]\\]/g, '\\$&'),
                    options.flags
                ),
                expect,
            };
        },
        testPattern(details, haystack) {
            if ( details.matchAll ) { return true; }
            return this.RegExp_test.call(details.re, haystack) === details.expect;
        },
        patternToRegex(pattern, flags = undefined) {
            if ( pattern === '' ) { return /^/; }
            const match = /^\/(.+)\/([gimsu]*)$/.exec(pattern);
            if ( match === null ) {
                return new RegExp(pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), flags);
            }
            try {
                return new RegExp(match[1], match[2] || flags);
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
            return Object.fromEntries(entries);
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

// Not Firefox
if ( typeof wrappedJSObject !== 'object' ) {
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
