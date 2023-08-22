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

const argsList = [["push","500"],[".call(null)","10"],[".call(null)"],["userHasAdblocker"],["objSubPromo"],["adb"],["nrWrapper"],["warn"],["adBlockerDetected"],["show"],["adObjects"],["offsetParent"],["InfMediafireMobileFunc","1000"],["google_jobrunner"],["()","45000"],["prompt"],["0x"],["displayAdBlockedVideo"],[".adsbygoogle"],["contrformpub","5000"],["disabledAdBlock","10000"],["_0x"],["ads.length"],["location.href"],["isDesktopApp","1000"],["Bait"],["admc"],["AdBlocker"],["Blocked"],["nextFunction"],["'0x"],["apstagLOADED"],["Adb"],["disableDeveloper"],["Blocco","2000"],["nextFunction","2000"],["documentElement.classList.add","400"],["test","0"],["checkAdblockUser","1000"],["checkPub","6000"],["document.querySelector","5000"],["nextFunction","250"],["popup"],["()","150"],["backRedirect"],["[native code]","500"],["document.querySelectorAll","1000"],["style"],["clientHeight"],["addEventListener","0"],["adblock","2000"],["document.body.classList.add","100"],["start","0"],["byepopup","5000"],["test.remove","100"],["additional_src","300"],["()","2000"],["css_class.show"],["CANG","3000"],["updato-overlay","500"],["innerText","2000"],["modal"],["alert","8000"],["css_class"],["()","50"],["debugger"],["initializeCourier","3000"],["redirectPage"],["_0x","2000"],["ads","750"],["location.href","500"],["Adblock","5000"],["disable","200"],["CekAab","0"],["rbm_block_active","1000"],["show()"],["n.trigger","1"],["instance.check","1"],["adblock"],["abDetected"],["KeepOpeningPops","1000"],["appendChild"],["()","10"],["adb","0"],["adBlocked"],["warning","100"],["adblock_popup","500"],["Adblock"],["#chatWrap","1000"],["keep-ads","2000"],["#rbm_block_active","1000"],["null","4000"],["()","2500"],["myaabpfun","3000"],["adFilled","2500"],["()","15000"],["showPopup"],["()","1"],["()","1000"],["document.cookie","2500"],["window.open"],["innerHTML"],["readyplayer","2000"],["/text()|0x/"],["checkStopBlock"],["adspot_top","1500"],["xclaim"],["an_message","500"],["Adblocker","10000"],["trigger","0"],["timeoutChecker"],["bait","1"],["pum-open"],["overlay","2000"],["AdBanner","2000"],["test","100"],["replace","1500"],["popCanFire"],["Math.round","1000"],["adblock","5"],["bioEp"],["ag_adBlockerDetected"],["null"],["adsbox","1000"],["adb","6000"],["pop"],["sadbl"],["checkAdStatus"],["()","0"],["mdp"],["brave_load_popup"],["0x","3000"],["invoke"],["adsbytrafficjunkycontext"],["ipod"],["offsetWidth"],["/$|adBlock/"],["ads"],["adsbygoogle"],["()"],["AdBlock"],["stop-scrolling"],["Adv"],["blockUI","2000"],["mdpDeBlocker"],["/_0x|debug/"],["[native code]","1"],["/ai_adb|_0x/"],["iframe"],["adBlock"],["","1"],["undefined"],["eval"],["check","1"],["adsBlocked"],["getComputedStyle","250"],["blocker"],["aswift_"],["afs_ads","2000"],["visibility","2000"],["bait"],["blocked"],["{r()","0"],["nextFunction","450"],["Debug"],["r()","0"],["Math.floor"],["offset"],["purple_box"],["offsetHeight"],["checkSiteNormalLoad"],["adBlockOverlay"],["Detected","500"],["height"],[".show","1000"],[".show"],["innerHTML.replace","1000"],["showModal"],["getComputedStyle"],["blur"],["samOverlay"],["bADBlock"],["location"],["","4000"],["alert"],["blocker","100"],["length"],["ai_adb"],["t()","0"],["$"],["offsetLeft"],[".show()","1000"],["mdp_deblocker"],["charAt"],["checkAds"],["fadeIn","0"],["jQuery"],["/^/"],["check"],["Adblocker"],["eabdModal"],["ab_root.show"],["gaData"],["ad"],["prompt","1000"],["googlefc"],["adblock detection"],[".offsetHeight","100"],["popState"],["ad-block-popup"],["exitTimer"],["innerHTML.replace"],["data?","4000"],[".data?"],["eabpDialog"],[".length","2000"],["adsense"],["googletag"],["f.parentNode.removeChild(f)","100"],["swal","500"],["keepChecking","1000"],["openPopup"],[".offsetHeight"],["()","3000"],["class.scroll","1000"],["disableDeveloperTools"],["Check"],["insertBefore"],["atob"],["css_class.scroll"],["/null|Error/","10000"],["window.location.href","50"],["checkblockUser"],["/out.php"],["/0x|devtools/"],["location.replace","300"],["window.location.href"],["checkVisible"],["_0x","3000"],["window.location.href=link"],["ai_"],["reachGoal"],["ai"],["/width|innerHTML/"],["magnificPopup"],["adblockEnabled"],["ads_block"],["google_ad"],["document.location"],["google"],["top-right","2000"],["enforceAdStatus"],["loadScripts"],["Ads"],["mfp"],["display","5000"],["eb"],[").show()"],["","1000"],["devtool"],["Msg"],["UABP"],["","0"],["","250"],["redURL"],["href"],["()=>"],["keepChecking"],["null","10"],["myTypeWriter"],["detected"],["","5"],["","500"],["/Adform|didomi|adblock|forEach/"],["/\\.innerHtml|offsetWidth/"],["showAdblock"],["-0x"],["display"],["gclid"],["rejectWith"],["refresh"],["window.location"],["ga"],["ShowAdBLockerNotice"],["ad_listener"],["open"],["(!0)"],["Delay"],["/appendChild|e\\(\"/"],["ADB"],["site-access-popup"],["data?"],["/debugger|UserCustomPop/"],["checkAdblockUser"],["canRunAds"],["displayMessage","2000"],["salesPopup"],["advanced"],["detectImgLoad"],["offsetHeight","200"],["detector"],["replace"],["siteAccessFlag"],["ab"],["adblocker"],["/children\\('ins'\\)|Adblock|adsbygoogle/"],["displayMessage"],["fetch"],["afterOpen"],["chkADB"],["onDetected"],["myinfoey","1500"],["placebo"],["offsetHeight","100"],["fuckadb"],["detect"],["siteAccessPopup"],["/adsbygoogle|adblock/"],["akadb"],["biteDisplay"],["m(!0)","800"],["ad_block"],["/detectAdBlocker|window.open/"],["hasAdBlock"],["adBlockDetected"],["popUnder"],["/GoToURL|delay/"],["/adblock/i"],["ad blocker"],["=>"]];

const hostnamesMap = new Map([["4-liga.com",1],["4fansites.de",1],["4players.de",1],["9monate.de",1],["aachener-nachrichten.de",1],["aachener-zeitung.de",1],["abendblatt.de",1],["abendzeitung-muenchen.de",1],["about-drinks.com",1],["abseits-ka.de",1],["airliners.de",1],["ajaxshowtime.com",1],["allgemeine-zeitung.de",1],["antenne.de",1],["arcor.de",1],["areadvd.de",1],["areamobile.de",1],["ariva.de",1],["astronews.com",1],["aussenwirtschaftslupe.de",1],["auszeit.bio",1],["auto-motor-und-sport.de",1],["auto-service.de",1],["autobild.de",1],["autoextrem.de",1],["autopixx.de",1],["autorevue.at",1],["az-online.de",1],["baby-vornamen.de",1],["babyclub.de",1],["bafoeg-aktuell.de",1],["berliner-kurier.de",1],["berliner-zeitung.de",1],["bigfm.de",1],["bikerszene.de",1],["bildderfrau.de",1],["blackd.de",1],["blick.de",1],["boerse-online.de",1],["boerse.de",1],["boersennews.de",1],["braunschweiger-zeitung.de",1],["brieffreunde.de",1],["brigitte.de",1],["buerstaedter-zeitung.de",1],["buffed.de",1],["businessinsider.de",1],["buzzfeed.at",1],["buzzfeed.de",1],["caravaning.de",1],["cavallo.de",1],["chefkoch.de",1],["cinema.de",1],["clever-tanken.de",1],["computerbild.de",1],["computerhilfen.de",1],["comunio-cl.com",1],["connect.de",1],["da-imnetz.de",1],["dasgelbeblatt.de",1],["dbna.com",1],["dbna.de",1],["deichstube.de",1],["deine-tierwelt.de",1],["der-betze-brennt.de",1],["derwesten.de",1],["desired.de",1],["dhd24.com",1],["dieblaue24.com",1],["digitalfernsehen.de",1],["dnn.de",1],["donnerwetter.de",1],["e-hausaufgaben.de",1],["e-mountainbike.com",1],["eatsmarter.de",1],["echo-online.de",1],["ecomento.de",1],["einfachschoen.me",1],["elektrobike-online.com",1],["epochtimes.de",1],["essen-und-trinken.de",1],["express.de",1],["extratipp.com",1],["familie.de",1],["fanfiktion.de",1],["fehmarn24.de",1],["fettspielen.de",1],["fid-gesundheitswissen.de",1],["finanznachrichten.de",1],["finanztreff.de",1],["finya.de",1],["firmenwissen.de",1],["fitforfun.de",1],["fnp.de",1],["focus.de",1],["football365.fr",1],["formel1.de",1],["fr.de",1],["frankfurter-wochenblatt.de",1],["freenet.de",1],["fremdwort.de",1],["froheweihnachten.info",1],["frustfrei-lernen.de",1],["fuldaerzeitung.de",1],["funandnews.de",1],["fussballdaten.de",1],["futurezone.de",1],["gala.de",1],["gamepro.de",1],["gamersglobal.de",1],["gamesaktuell.de",1],["gamestar.de",1],["gamezone.de",1],["gartendialog.de",1],["gartenlexikon.de",1],["gedichte.ws",1],["geissblog.koeln",1],["gelnhaeuser-tageblatt.de",1],["general-anzeiger-bonn.de",1],["geniale-tricks.com",1],["genialetricks.de",1],["gesund-vital.de",1],["gesundheit.de",1],["gevestor.de",1],["gewinnspiele.tv",1],["giessener-allgemeine.de",1],["giessener-anzeiger.de",1],["gifhorner-rundschau.de",1],["giga.de",1],["gipfelbuch.ch",1],["gmuender-tagespost.de",1],["golem.de",[1,8,9]],["gruenderlexikon.de",1],["gusto.at",1],["gut-erklaert.de",1],["gutfuerdich.co",1],["hallo-muenchen.de",1],["hamburg.de",1],["hanauer.de",1],["hardwareluxx.de",1],["hartziv.org",1],["harzkurier.de",1],["haus-garten-test.de",1],["hausgarten.net",1],["haustec.de",1],["haz.de",1],["heidelberg24.de",1],["heilpraxisnet.de",1],["heise.de",1],["helmstedter-nachrichten.de",1],["hersfelder-zeitung.de",1],["hftg.co",1],["hifi-forum.de",1],["hna.de",1],["hochheimer-zeitung.de",1],["hoerzu.de",1],["hofheimer-zeitung.de",1],["iban-rechner.de",1],["ikz-online.de",1],["immobilienscout24.de",1],["ingame.de",1],["inside-digital.de",1],["inside-handy.de",1],["investor-verlag.de",1],["jappy.com",1],["jpgames.de",1],["kabeleins.de",1],["kachelmannwetter.com",1],["kamelle.de",1],["kicker.de",1],["kindergeld.org",1],["kino.de",1],["klettern-magazin.de",1],["klettern.de",1],["kochbar.de",1],["kreis-anzeiger.de",1],["kreisbote.de",1],["kreiszeitung.de",1],["ksta.de",1],["kurierverlag.de",1],["lachainemeteo.com",1],["lampertheimer-zeitung.de",1],["landwirt.com",1],["laut.de",1],["lauterbacher-anzeiger.de",1],["leckerschmecker.me",1],["leinetal24.de",1],["lesfoodies.com",1],["levif.be",1],["lifeline.de",1],["liga3-online.de",1],["likemag.com",1],["linux-community.de",1],["linux-magazin.de",1],["ln-online.de",1],["lokalo24.de",1],["lustaufsleben.at",1],["lustich.de",1],["lvz.de",1],["lz.de",1],["macwelt.de",1],["macworld.co.uk",1],["mail.de",1],["main-spitze.de",1],["manager-magazin.de",1],["manga-tube.me",1],["mathebibel.de",1],["mathepower.com",1],["maz-online.de",1],["medisite.fr",1],["mehr-tanken.de",1],["mein-kummerkasten.de",1],["mein-mmo.de",1],["mein-wahres-ich.de",1],["meine-anzeigenzeitung.de",1],["meinestadt.de",1],["menshealth.de",1],["mercato365.com",1],["merkur.de",1],["messen.de",1],["metal-hammer.de",1],["metalflirt.de",1],["meteologix.com",1],["minecraft-serverlist.net",1],["mittelbayerische.de",1],["modhoster.de",1],["moin.de",1],["mopo.de",1],["morgenpost.de",1],["motor-talk.de",1],["motorbasar.de",1],["motorradonline.de",1],["motorsport-total.com",1],["motortests.de",1],["mountainbike-magazin.de",1],["moviejones.de",1],["moviepilot.de",1],["mt.de",1],["mtb-news.de",1],["musiker-board.de",1],["musikexpress.de",1],["musikradar.de",1],["mz-web.de",1],["n-tv.de",1],["naumburger-tageblatt.de",1],["netzwelt.de",1],["neuepresse.de",1],["neueroeffnung.info",1],["news.at",1],["news.de",1],["news38.de",1],["newsbreak24.de",1],["nickles.de",1],["nicknight.de",1],["nl.hardware.info",1],["nn.de",1],["nnn.de",1],["nordbayern.de",1],["notebookchat.com",1],["notebookcheck-ru.com",1],["notebookcheck-tr.com",1],["noz-cdn.de",1],["noz.de",1],["nrz.de",1],["nw.de",1],["nwzonline.de",1],["oberhessische-zeitung.de",1],["oeffentlicher-dienst.info",1],["onlinekosten.de",1],["onvista.de",1],["op-marburg.de",1],["op-online.de",1],["outdoor-magazin.com",1],["outdoorchannel.de",1],["paradisi.de",1],["pc-magazin.de",1],["pcgames.de",1],["pcgameshardware.de",1],["pcwelt.de",1],["pcworld.es",1],["peiner-nachrichten.de",1],["pferde.de",1],["pietsmiet.de",1],["pixelio.de",1],["pkw-forum.de",1],["playboy.de",1],["playfront.de",1],["pnn.de",1],["pons.com",1],["prad.de",[1,141]],["prignitzer.de",1],["profil.at",1],["promipool.de",1],["promobil.de",1],["prosiebenmaxx.de",1],["psychic.de",[1,169]],["quoka.de",1],["radio.at",1],["radio.de",1],["radio.dk",1],["radio.es",1],["radio.fr",1],["radio.it",1],["radio.net",1],["radio.pl",1],["radio.pt",1],["radio.se",1],["ran.de",1],["readmore.de",1],["rechtslupe.de",1],["recording.de",1],["rennrad-news.de",1],["reuters.com",1],["reviersport.de",1],["rhein-main-presse.de",1],["rheinische-anzeigenblaetter.de",1],["rimondo.com",1],["roadbike.de",1],["roemische-zahlen.net",1],["rollingstone.de",1],["rot-blau.com",1],["rp-online.de",1],["rtl.de",[1,268]],["rtv.de",1],["rugby365.fr",1],["ruhr24.de",1],["rundschau-online.de",1],["runnersworld.de",1],["safelist.eu",1],["salzgitter-zeitung.de",1],["sat1.de",1],["sat1gold.de",1],["schwaebische-post.de",1],["schwarzwaelder-bote.de",1],["serienjunkies.de",1],["shz.de",1],["sixx.de",1],["skodacommunity.de",1],["smart-wohnen.net",1],["sn.at",1],["sozialversicherung-kompetent.de",1],["spiegel.de",1],["spielen.de",1],["spieletipps.de",1],["spielfilm.de",1],["sport.de",1],["sport365.fr",1],["sportal.de",1],["spox.com",1],["stern.de",1],["stuttgarter-nachrichten.de",1],["stuttgarter-zeitung.de",1],["sueddeutsche.de",1],["svz.de",1],["szene1.at",1],["szene38.de",1],["t-online.de",1],["tagesspiegel.de",1],["taschenhirn.de",1],["techadvisor.co.uk",1],["techstage.de",1],["tele5.de",1],["the-voice-of-germany.de",1],["thueringen24.de",1],["tichyseinblick.de",1],["tierfreund.co",1],["tiervermittlung.de",1],["torgranate.de",1],["trend.at",1],["tv-media.at",1],["tvdigital.de",1],["tvinfo.de",1],["tvspielfilm.de",1],["tvtoday.de",1],["tz.de",1],["unicum.de",1],["unnuetzes.com",1],["unsere-helden.com",1],["unterhalt.net",1],["usinger-anzeiger.de",1],["usp-forum.de",1],["videogameszone.de",1],["vienna.at",1],["vip.de",1],["virtualnights.com",1],["vox.de",1],["wa.de",1],["wallstreet-online.de",[1,3]],["waz.de",1],["weather.us",1],["webfail.com",1],["weihnachten.me",1],["weihnachts-bilder.org",1],["weihnachts-filme.com",1],["welt.de",1],["weltfussball.at",1],["weristdeinfreund.de",1],["werkzeug-news.de",1],["werra-rundschau.de",1],["wetterauer-zeitung.de",1],["wiesbadener-kurier.de",1],["wiesbadener-tagblatt.de",1],["winboard.org",1],["windows-7-forum.net",1],["winfuture.de",1],["wintotal.de",1],["wlz-online.de",1],["wn.de",1],["wohngeld.org",1],["wolfenbuetteler-zeitung.de",1],["wolfsburger-nachrichten.de",1],["woman.at",1],["womenshealth.de",1],["wormser-zeitung.de",1],["woxikon.de",1],["wp.de",1],["wr.de",1],["yachtrevue.at",1],["ze.tt",1],["zeit.de",1],["meineorte.com",2],["osthessen-news.de",2],["techadvisor.com",2],["economictimes.indiatimes.com",4],["m.timesofindia.com",5],["timesofindia.indiatimes.com",5],["youmath.it",5],["redensarten-index.de",5],["lesoir.be",5],["electriciansforums.net",5],["keralatelecom.info",5],["universegunz.net",5],["happypenguin.altervista.org",5],["everyeye.it",5],["bluedrake42.com",5],["ngontinh24.com",5],["streamservicehd.click",5],["supermarioemulator.com",5],["futbollibrehd.com",5],["newsrade.com",5],["eska.pl",5],["eskarock.pl",5],["voxfm.pl",5],["mathaeser.de",5],["freethesaurus.com",7],["thefreedictionary.com",7],["hdbox.ws",9],["todopolicia.com",9],["scat.gold",9],["freecoursesite.com",9],["windowcleaningforums.co.uk",9],["cruisingearth.com",9],["hobby-machinist.com",9],["freegogpcgames.com",9],["latitude.to",9],["kitchennovel.com",9],["w3layouts.com",9],["blog.receivefreesms.co.uk",9],["eductin.com",9],["dealsfinders.blog",9],["audiobooks4soul.com",9],["tinhocdongthap.com",9],["sakarnewz.com",9],["downloadr.in",9],["topcomicporno.com",9],["dongknows.com",9],["traderepublic.community",9],["celtadigital.com",9],["iptvrun.com",9],["adsup.lk",9],["cryptomonitor.in",9],["areatopik.com",9],["cardscanner.co",9],["nullforums.net",9],["courseclub.me",9],["tamarindoyam.com",9],["choiceofmods.com",9],["myqqjd.com",9],["ssdtop.com",9],["apkhex.com",9],["gezegenforum.com",9],["mbc2.live",9],["forumnulled.com",9],["iptvapps.net",9],["null-scripts.net",9],["nullscripts.net",9],["whncourses.com",9],["bloground.ro",9],["witcherhour.com",9],["ottverse.com",9],["mdn.lol",[9,274]],["torrentmac.net",9],["mazakony.com",9],["laptechinfo.com",9],["mc-at.org",9],["playstationhaber.com",9],["mangapt.com",9],["seriesperu.com",9],["pesprofessionals.com",9],["wpsimplehacks.com",9],["sportshub.to",[9,267]],["topsporter.net",[9,267]],["darkwanderer.net",9],["truckingboards.com",9],["coldfrm.org",9],["azrom.net",9],["freepatternsarea.com",9],["alttyab.net",9],["hq-links.com",9],["mobilkulup.com",9],["esopress.com",9],["rttar.com",9],["nesiaku.my.id",9],["jipinsoft.com",9],["surfsees.com",9],["truthnews.de",9],["farsinama.com",9],["worldofiptv.com",9],["vuinsider.com",9],["crazydl.net",9],["gamemodsbase.com",9],["babiato.tech",9],["secuhex.com",9],["turkishaudiocenter.com",9],["geektime.co.il",10],["bild.de",11],["mediafire.com",12],["wcostream.com",13],["wcoanimedub.tv",13],["wcoforever.net",13],["openspeedtest.com",13],["addtobucketlist.com",13],["3dzip.org",[13,91]],["ilmeteo.it",13],["wcoforever.com",13],["comprovendolibri.it",13],["healthelia.com",13],["keephealth.info",14],["australianfrequentflyer.com.au",15],["afreesms.com",16],["kinoger.re",16],["laksa19.github.io",16],["imgux.buzz",16],["imgewe.buzz",16],["imgxxxx.buzz",16],["imgeza.buzz",16],["imgzzzz.buzz",16],["imgxhfr.buzz",16],["imgqwt.buzz",16],["imgtwq.buzz",16],["imgbjryy.buzz",16],["imgjetr.buzz",16],["imgxelz.buzz",16],["imgytreq.buzz",16],["javcl.com",16],["upvideo.to",16],["tvlogy.to",16],["himovies.to",16],["live.dragaoconnect.net",16],["beststremo.com",16],["seznam.cz",16],["xerifetech.com",16],["wallpapershome.com",18],["ville-ideale.fr",19],["calciomercato.it",20],["calciomercato.com",21],["bersamatekno.com",21],["hotpornfile.org",21],["robloxscripts.com",21],["coolsoft.altervista.org",21],["worldcupfootball.me",[21,26]],["hackedonlinegames.com",21],["jkoding.xyz",21],["settlersonlinemaps.com",21],["1cloudfile.com",21],["magdownload.org",21],["kpkuang.org",21],["shareus.site",21],["crypto4yu.com",21],["faucetwork.space",21],["claimclicks.com",21],["thenightwithoutthedawn.blogspot.com",21],["entutes.com",21],["claimlite.club",21],["bazadecrypto.com",[21,311]],["whosampled.com",22],["imgkings.com",23],["pornvideotop.com",23],["krotkoosporcie.pl",23],["anghami.com",24],["wired.com",25],["tutele.sx",26],["footyhunter3.xyz",26],["magesypro.pro",[27,28]],["tinyppt.com",27],["audiotools.pro",28],["magesy.blog",28],["audioztools.com",[28,29]],["altblogger.net",29],["satoshi-win.xyz",29],["freedeepweb.blogspot.com",29],["freesoft.id",29],["zcteam.id",29],["www-daftarharga.blogspot.com",29],["ear-phone-review.com",29],["telefullenvivo.com",29],["allfoot.info",29],["listatv.pl",29],["encurtandourl.com",[29,155]],["katestube.com",30],["short.pe",30],["footystreams.net",30],["seattletimes.com",31],["yiv.com",32],["pornohans.com",32],["pornoente.tv",[32,81]],["nursexfilme.com",32],["milffabrik.com",[32,81]],["pornohirsch.net",32],["pornozebra.com",[32,81]],["xhamster-sexvideos.com",32],["pornoschlange.com",32],["hdpornos.net",32],["gutesexfilme.com",32],["pornotom.com",[32,81]],["short1.site",32],["zona-leros.com",32],["globalrph.com",33],["e-glossa.it",34],["java-forum.org",35],["comunidadgzone.es",35],["anime-extremo.com",35],["mp3fy.com",35],["lebensmittelpraxis.de",35],["ebookdz.com",35],["forum-pokemon-go.fr",35],["praxis-jugendarbeit.de",35],["gdrivez.xyz",35],["dictionnaire-medical.net",35],["cle0desktop.blogspot.com",35],["up-load.io",35],["direct-link.net",35],["direkt-wissen.com",35],["keysbrasil.blogspot.com",35],["hotpress.info",35],["turkleech.com",35],["anibatch.me",35],["anime-i.com",35],["healthtune.site",35],["gewinde-normen.de",35],["freewebscript.com",36],["webcheats.com.br",37],["gala.fr",39],["gentside.com",39],["geo.fr",39],["hbrfrance.fr",39],["nationalgeographic.fr",39],["ohmymag.com",39],["serengo.net",39],["vsd.fr",39],["updato.com",[40,59]],["methbox.com",41],["daizurin.com",41],["pendekarsubs.us",41],["dreamfancy.org",41],["rysafe.blogspot.com",41],["toppng.com",41],["th-world.com",41],["avjamack.com",41],["avjamak.net",41],["techacode.com",41],["daddyhd.com",43],["embedstream.me",43],["yts-subs.net",43],["cnnamador.com",44],["ksbw.com",45],["nudecelebforum.com",46],["pronpic.org",47],["thewebflash.com",48],["discordfastfood.com",48],["xup.in",48],["popularmechanics.com",49],["op.gg",50],["makeuseof.com",51],["lequipe.fr",52],["jellynote.com",53],["knights-table.net",54],["eporner.com",55],["pornbimbo.com",56],["allmonitors24.com",56],["4j.com",56],["avoiderrors.com",57],["cgtips.org",[57,213]],["sitarchive.com",57],["livenewsof.com",57],["topnewsshow.com",57],["gatcha.org",57],["empregoestagios.com",57],["everydayonsales.com",57],["kusonime.com",57],["aagmaal.xyz",57],["suicidepics.com",57],["codesnail.com",57],["codingshiksha.com",57],["graphicux.com",57],["hardcoregames.ca",57],["asyadrama.com",57],["bitcoinegypt.news",57],["citychilli.com",57],["talkjarvis.com",57],["hdmotori.it",58],["femdomtb.com",60],["camhub.cc",60],["bobs-tube.com",60],["ru-xvideos.me",60],["pornfd.com",60],["popno-tour.net",60],["molll.mobi",60],["watchmdh.to",60],["camwhores.tv",60],["audioz.cc",61],["audioz.es",61],["vectorizer.io",61],["toppnews4.net",61],["smgplaza.com",61],["thapcam.net",61],["elfqrin.com",62],["satcesc.com",63],["apfelpatient.de",63],["lusthero.com",64],["hpav.tv",65],["hpjav.tv",65],["m2list.com",65],["embed.nana2play.com",65],["elahmad.com",65],["dofusports.xyz",65],["pobre.tv",65],["dallasnews.com",66],["lnk.news",67],["lnk.parts",67],["efukt.com",68],["wendycode.com",68],["springfieldspringfield.co.uk",69],["porndoe.com",70],["smsget.net",[71,72]],["kjanime.net",73],["gioialive.it",74],["classicreload.com",75],["chicoer.com",76],["bostonherald.com",76],["dailycamera.com",76],["gomiblog.com",77],["maxcheaters.com",78],["rbxoffers.com",78],["postimees.ee",78],["police.community",78],["gisarea.com",78],["schaken-mods.com",78],["theclashify.com",78],["txori.com",78],["olarila.com",78],["sportsplays.com",79],["deinesexfilme.com",81],["einfachtitten.com",81],["halloporno.com",81],["herzporno.com",81],["lesbenhd.com",81],["porn-monkey.com",81],["porndrake.com",81],["pornhubdeutsch.net",81],["pornoaffe.com",81],["pornodavid.com",81],["pornofisch.com",81],["pornofelix.com",81],["pornohammer.com",81],["pornohelm.com",81],["pornoklinge.com",81],["pornotommy.com",81],["pornovideos-hd.com",81],["xhamsterdeutsch.xyz",81],["xnxx-sexfilme.com",81],["masihbelajar.com",81],["zerion.cc",81],["androidworld.it",82],["letribunaldunet.fr",83],["vladan.fr",83],["live-tv-channels.org",84],["eslfast.com",85],["freegamescasual.com",86],["tcpvpn.com",87],["oko.sh",87],["bookriot.com",87],["timesnownews.com",87],["timesnowhindi.com",87],["timesnowmarathi.com",87],["zoomtventertainment.com",87],["xxxuno.com",88],["sholah.net",89],["2rdroid.com",89],["bisceglielive.it",90],["pandajogosgratis.com.br",92],["5278.cc",93],["tonspion.de",95],["duplichecker.com",96],["plagiarismchecker.co",96],["plagiarismdetector.net",96],["searchenginereports.net",96],["smallseotools.com",96],["giallozafferano.it",97],["autojournal.fr",97],["autoplus.fr",97],["sportauto.fr",97],["linkspaid.com",98],["proxydocker.com",98],["beeimg.com",[99,100]],["emturbovid.com",100],["ftlauderdalebeachcam.com",101],["ftlauderdalewebcam.com",101],["juneauharborwebcam.com",101],["keywestharborwebcam.com",101],["kittycatcam.com",101],["mahobeachcam.com",101],["miamiairportcam.com",101],["morganhillwebcam.com",101],["njwildlifecam.com",101],["nyharborwebcam.com",101],["paradiseislandcam.com",101],["pompanobeachcam.com",101],["portbermudawebcam.com",101],["portcanaveralwebcam.com",101],["portevergladeswebcam.com",101],["portmiamiwebcam.com",101],["portnywebcam.com",101],["portnassauwebcam.com",101],["portstmaartenwebcam.com",101],["porttampawebcam.com",101],["sxmislandcam.com",101],["gearingcommander.com",101],["themes-dl.com",101],["badassdownloader.com",101],["badasshardcore.com",101],["badassoftcore.com",101],["nulljungle.com",101],["teevee.asia",101],["otakukan.com",101],["linksht.com",103],["generate.plus",104],["calculate.plus",104],["avcesar.com",105],["audiotag.info",106],["tudigitale.it",107],["ibcomputing.com",108],["eodev.com",109],["legia.net",110],["acapellas4u.co.uk",111],["streamhentaimovies.com",112],["konten.co.id",113],["diariodenavarra.es",114],["xiaomifans.pl",115],["eletronicabr.com",115],["iphonesoft.fr",116],["gload.cc",117],["optifine.net",118],["luzernerzeitung.ch",119],["tagblatt.ch",119],["spellcheck.net",120],["spellchecker.net",120],["spellweb.com",120],["ableitungsrechner.net",121],["alternet.org",122],["imtranslator.net",123],["shrib.com",124],["pandafiles.com",125],["vidia.tv",[125,148]],["hortonanderfarom.blogspot.com",125],["clarifystraight.com",125],["constraindefiant.net",126],["tutelehd3.xyz",126],["mega4upload.com",126],["coolcast2.com",126],["techclips.net",126],["earthquakecensus.com",126],["footyhunter.lol",126],["gamerarcades.com",126],["poscitech.click",126],["starlive.stream",126],["utopianwilderness.com",126],["wecast.to",126],["sportbar.live",126],["lordchannel.com",126],["play-old-pc-games.com",127],["scrin.org",128],["tunovelaligera.com",129],["tapchipi.com",129],["cuitandokter.com",129],["tech-blogs.com",129],["cardiagn.com",129],["dcleakers.com",129],["esgeeks.com",129],["pugliain.net",129],["uplod.net",129],["worldfreeware.com",129],["fikiri.net",129],["myhackingworld.com",129],["phoenixfansub.com",129],["freecourseweb.com",130],["devcourseweb.com",130],["coursewikia.com",130],["courseboat.com",130],["coursehulu.com",130],["lne.es",134],["pornult.com",135],["webcamsdolls.com",135],["bitcotasks.com",135],["exactpay.online",135],["proplanta.de",136],["hydrogenassociation.org",137],["ludigames.com",137],["made-by.org",137],["xenvn.com",137],["worldtravelling.com",137],["igirls.in",137],["technichero.com",137],["roshiyatech.my.id",137],["1upinfinite.com",137],["24sport.stream",137],["tii.la",137],["yesmangas1.com",137],["aeroxplorer.com",137],["mad4wheels.com",138],["theshedend.com",138],["logi.im",138],["emailnator.com",138],["textograto.com",139],["voyageforum.com",140],["hmc-id.blogspot.com",140],["jemerik.com",140],["myabandonware.com",140],["chatta.it",142],["ketubanjiwa.com",143],["nsfw247.to",144],["funzen.net",144],["notmekani.com",144],["fighter.stream",144],["ilclubdellericette.it",144],["hubstream.in",144],["extremereportbot.com",[145,146]],["getintopc.com",147],["qoshe.com",149],["lowellsun.com",150],["mamadu.pl",150],["dobrapogoda24.pl",150],["motohigh.pl",150],["namasce.pl",150],["ultimate-catch.eu",151],["tabele-kalorii.pl",151],["cpopchanelofficial.com",153],["cryptowidgets.net",[153,270]],["creditcardgenerator.com",154],["creditcardrush.com",154],["bostoncommons.net",154],["thejobsmovie.com",154],["livsavr.co",154],["hl-live.de",155],["ihow.info",155],["filesus.com",155],["sturls.com",155],["re.two.re",155],["forexat.club",155],["turbo1.co",155],["nilopolisonline.com.br",156],["mesquitaonline.com",156],["yellowbridge.com",156],["socialgirls.im",157],["yaoiotaku.com",158],["camhub.world",159],["moneyhouse.ch",160],["chromotypic.com",161],["gamoneinterrupted.com",161],["metagnathtuggers.com",161],["wolfdyslectic.com",161],["rationalityaloelike.com",161],["sizyreelingly.com",161],["simpulumlamerop.com",161],["urochsunloath.com",161],["monorhinouscassaba.com",161],["counterclockwisejacky.com",161],["35volitantplimsoles5.com",161],["scatch176duplicities.com",161],["antecoxalbobbing1010.com",161],["boonlessbestselling244.com",161],["cyamidpulverulence530.com",161],["guidon40hyporadius9.com",161],["449unceremoniousnasoseptal.com",161],["19turanosephantasia.com",161],["30sensualizeexpression.com",161],["321naturelikefurfuroid.com",161],["745mingiestblissfully.com",161],["availedsmallest.com",161],["greaseball6eventual20.com",161],["toxitabellaeatrebates306.com",161],["20demidistance9elongations.com",161],["audaciousdefaulthouse.com",161],["fittingcentermondaysunday.com",161],["fraudclatterflyingcar.com",161],["launchreliantcleaverriver.com",161],["matriculant401merited.com",161],["realfinanceblogcenter.com",161],["reputationsheriffkennethsand.com",161],["telyn610zoanthropy.com",161],["tubelessceliolymph.com",161],["tummulerviolableness.com",161],["un-block-voe.net",161],["v-o-e-unblock.com",161],["voe-un-block.com",161],["voeun-block.net",161],["voeunbl0ck.com",161],["voeunblck.com",161],["voeunblk.com",161],["voeunblock.com",161],["voeunblock1.com",161],["voeunblock2.com",161],["voeunblock3.com",161],["agefi.fr",162],["cariskuy.com",163],["letras2.com",163],["yusepjaelani.blogspot.com",164],["letras.mus.br",165],["soulreaperzone.com",166],["cheatermad.com",167],["mtlurb.com",168],["port.hu",169],["acdriftingpro.com",169],["flight-report.com",169],["forumdz.com",169],["abandonmail.com",169],["beverfood.com",169],["flmods.com",169],["zilinak.sk",169],["temp-phone-number.com",169],["projectfreetv.stream",169],["hotdesimms.com",169],["pdfaid.com",169],["mconverter.eu",169],["dzeko11.net",[169,267]],["mail.com",169],["expresskaszubski.pl",169],["moegirl.org.cn",169],["onemanhua.com",170],["t3n.de",171],["allindiaroundup.com",172],["osuskinner.com",173],["vrcmods.com",173],["thefastlaneforum.com",174],["trade2win.com",175],["gmodleaks.com",175],["fontyukle.net",176],["modagamers.com",177],["nulleb.com",177],["freemagazines.top",177],["reset-scans.com",177],["straatosphere.com",177],["nullpk.com",177],["adslink.pw",177],["downloadudemy.com",177],["techydino.net",177],["picgiraffe.com",177],["weadown.com",177],["freepornsex.net",177],["nurparatodos.com.ar",177],["librospreuniversitariospdf.blogspot.com",178],["forexeen.us",178],["khsm.io",178],["girls-like.me",178],["webcreator-journal.com",178],["nu6i-bg-net.com",178],["routech.ro",179],["hokej.net",179],["turkmmo.com",180],["palermotoday.it",181],["baritoday.it",181],["trentotoday.it",181],["agrigentonotizie.it",181],["anconatoday.it",181],["arezzonotizie.it",181],["avellinotoday.it",181],["bresciatoday.it",181],["brindisireport.it",181],["casertanews.it",181],["cataniatoday.it",181],["cesenatoday.it",181],["chietitoday.it",181],["forlitoday.it",181],["frosinonetoday.it",181],["genovatoday.it",181],["ilpescara.it",181],["ilpiacenza.it",181],["latinatoday.it",181],["lecceprima.it",181],["leccotoday.it",181],["livornotoday.it",181],["messinatoday.it",181],["milanotoday.it",181],["modenatoday.it",181],["monzatoday.it",181],["novaratoday.it",181],["padovaoggi.it",181],["parmatoday.it",181],["perugiatoday.it",181],["pisatoday.it",181],["quicomo.it",181],["ravennatoday.it",181],["reggiotoday.it",181],["riminitoday.it",181],["romatoday.it",181],["salernotoday.it",181],["sondriotoday.it",181],["sportpiacenza.it",181],["ternitoday.it",181],["today.it",181],["torinotoday.it",181],["trevisotoday.it",181],["triesteprima.it",181],["udinetoday.it",181],["veneziatoday.it",181],["vicenzatoday.it",181],["thumpertalk.com",182],["arkcod.org",182],["facciabuco.com",183],["shorterall.com",184],["thelayoff.com",184],["tvepg.eu",184],["blog24.me",184],["softx64.com",185],["pstream.net",186],["instaanime.com",186],["libreriamo.it",187],["medebooks.xyz",187],["share-knowledgee.info",187],["tutorials-technology.info",187],["mashtips.com",187],["marriedgames.com.br",187],["4allprograms.me",187],["nurgsm.com",187],["hunter-xhunter.com",187],["janusnotes.com",187],["certbyte.com",187],["plugincrack.com",187],["gamingdeputy.com",187],["cryptoblog24.info",187],["freewebcart.com",187],["dailymaverick.co.za",188],["apps2app.com",189],["my-code4you.blogspot.com",190],["leakgaming.fr",191],["pentruea.com",[192,193]],["mchacks.net",194],["why-tech.it",195],["hacksmile.com",196],["compsmag.com",196],["tapetus.pl",197],["autoroad.cz",198],["brawlhalla.fr",198],["tecnobillo.com",198],["sexcamfreeporn.com",199],["breatheheavy.com",200],["wenxuecity.com",201],["key-hub.eu",202],["fabioambrosi.it",203],["tamrieltradecentre.com",[203,262]],["tattle.life",204],["emuenzen.de",204],["mynet.com",205],["cidade.iol.pt",206],["fantacalcio.it",207],["hentaifreak.org",208],["hypebeast.com",209],["krankheiten-simulieren.de",210],["catholic.com",211],["3dmodelshare.org",212],["gourmetscans.net",213],["techinferno.com",214],["phuongtrinhhoahoc.com",215],["ibeconomist.com",216],["purposegames.com",217],["schoolcheats.net",217],["globo.com",218],["latimes.com",218],["claimrbx.gg",219],["perelki.net",220],["vpn-anbieter-vergleich-test.de",221],["livingincebuforums.com",222],["paperzonevn.com",223],["malaysianwireless.com",224],["erinsakura.com",225],["infofuge.com",225],["freejav.guru",225],["novelmultiverse.com",225],["fritidsmarkedet.dk",226],["maskinbladet.dk",226],["15min.lt",227],["lewdninja.com",228],["lewd.ninja",228],["hentaidexy.com",228],["baddiehub.com",229],["mr9soft.com",230],["21porno.com",231],["cashearn.cc",232],["adult-sex-gamess.com",233],["hentaigames.app",233],["mobilesexgamesx.com",233],["mysexgamer.com",233],["porngameshd.com",233],["sexgamescc.com",233],["xnxx-sex-videos.com",233],["f2movies.to",234],["freeporncave.com",235],["tubsxxx.com",236],["pornojenny.com",237],["subtitle.one",238],["sextvx.com",239],["studydhaba.com",240],["freecourse.tech",240],["ccthesims.com",240],["victor-mochere.com",240],["papunika.com",240],["mobilanyheter.net",240],["prajwaldesai.com",240],["muztext.com",241],["charbelnemnom.com",242],["online-fix.me",243],["gamersdiscussionhub.com",244],["owlzo.com",245],["maxpixel.net",246],["q1003.com",247],["blogpascher.com",248],["testserver.pro",249],["mgnet.xyz",250],["advertiserandtimes.co.uk",251],["xvideos2020.me",252],["wouterplanet.com",253],["deezer.com",253],["111.90.159.132",254],["techsolveprac.com",255],["joomlabeginner.com",256],["largescaleforums.com",257],["dubznetwork.com",258],["mundodonghua.com",258],["oceanplay.org",259],["code2care.org",260],["osuskins.net",263],["allcryptoz.net",264],["crewbase.net",264],["crewus.net",264],["shinbhu.net",264],["shinchu.net",264],["thumb8.net",264],["thumb9.net",264],["topcryptoz.net",264],["uniqueten.net",264],["ultraten.net",264],["hlspanel.xyz",264],["fapdrop.com",264],["beritabaru.news",265],["solusi.cyou",265],["xxxxsx.com",265],["idevicecentral.com",266],["referus.in",269],["coinscap.info",270],["greenenez.com",270],["insurancegold.in",270],["webfreetools.net",270],["wiki-topia.com",270],["enit.in",271],["financerites.com",271],["mangacrab.com",272],["idnes.cz",273],["viefaucet.com",275],["cloud-computing-central.com",276],["afk.guide",277],["businessnamegenerator.com",278],["rocketnews24.com",279],["soranews24.com",279],["youpouch.com",279],["ilsole24ore.com",280],["hentaiporn.one",281],["infokik.com",282],["fosslinux.com",283],["shrdsk.me",284],["examword.com",285],["sempreupdate.com.br",285],["tribuna.com",286],["trendsderzukunft.de",287],["gal-dem.com",287],["lostineu.eu",287],["oggitreviso.it",287],["speisekarte.de",287],["mixed.de",287],["lightnovelspot.com",[288,329]],["lightnovelworld.com",[288,329]],["novelpub.com",[288,329]],["webnovelpub.com",[288,329]],["mail.yahoo.com",289],["hwzone.co.il",290],["nammakalvi.com",291],["javmoon.me",292],["c2g.at",293],["terafly.me",293],["bravedown.com",294],["aquarius-horoscopes.com",295],["cancer-horoscopes.com",295],["dubipc.blogspot.com",295],["echoes.gr",295],["engel-horoskop.de",295],["freegames44.com",295],["fuerzasarmadas.eu",295],["gemini-horoscopes.com",295],["jurukunci.net",295],["krebs-horoskop.com",295],["leo-horoscopes.com",295],["maliekrani.com",295],["nklinks.click",295],["ourenseando.es",295],["pisces-horoscopes.com",295],["radio-en-direct.fr",295],["sagittarius-horoscopes.com",295],["scorpio-horoscopes.com",295],["singlehoroskop-loewe.de",295],["skat-karten.de",295],["skorpion-horoskop.com",295],["taurus-horoscopes.com",295],["the1security.com",295],["virgo-horoscopes.com",295],["zonamarela.blogspot.com",295],["yoima.hatenadiary.com",295],["vpntester.org",296],["watchhentai.net",297],["japscan.lol",298],["digitask.ru",299],["tempumail.com",300],["sexvideos.host",301],["10alert.com",302],["cryptstream.de",303],["nydus.org",303],["techhelpbd.com",304],["cellmapper.net",305],["hdrez.com",306],["youwatch-serie.com",306],["freebnbcoin.com",307],["vgembed.com",308],["printablecreative.com",309],["comohoy.com",310],["leak.sx",310],["pornleaks.in",310],["merlininkazani.com",310],["faindx.com",312],["converter-btc.world",313],["j91.asia",314],["jeniusplay.com",315],["indianyug.com",316],["rgb.vn",316],["needrom.com",317],["criptologico.com",318],["megadrive-emulator.com",319],["hentai-one.com",320],["hentaipaw.com",320],["10minuteemails.com",321],["luxusmail.org",321],["w3cub.com",322],["dgb.lol",323],["bangpremier.com",324],["nyaa.iss.ink",325],["news.bg",327],["topsport.bg",327],["scripai.com",327],["security-demo.extrahop.com",328]]);

const entitiesMap = new Map([["lablue",0],["comunio",1],["finanzen",[1,6]],["gameswelt",1],["heftig",1],["notebookcheck",1],["testedich",1],["transfermarkt",1],["truckscout24",1],["tvtv",1],["wetter",1],["wetteronline",1],["wieistmeineip",1],["1337x",5],["eztv",5],["sushi-scan",9],["spigotunlocked",9],["ahmedmode",9],["kissasian",14],["rp5",16],["mma-core",17],["writedroid",21],["yts",26],["720pstream",26],["1stream",26],["magesy",27],["thefmovies",30],["xhamsterdeutsch",32],["fxporn69",35],["aliancapes",35],["urlcero",38],["totaldebrid",41],["sandrives",41],["oploverz",42],["pouvideo",54],["povvideo",54],["povw1deo",54],["povwideo",54],["powv1deo",54],["powvibeo",54],["powvideo",54],["powvldeo",54],["tubsexer",60],["porno-tour",60],["lenkino",60],["pornomoll",60],["camsclips",60],["m4ufree",65],["dood",65],["crackstreams",65],["telerium",80],["pandafreegames",94],["thoptv",102],["brainly",109],["streameast",126],["thestreameast",126],["daddylivehd",126],["solvetube",131],["hdfilme",132],["pornhub",133],["wcofun",140],["bollyholic",144],["wstream",152],["gotxx",155],["turkanime",161],["voe-unblock",161],["khatrimaza",177],["pogolinks",177],["popcornstream",179],["shortzzy",187],["shineads",187],["privatemoviez",244],["gmx",261],["lightnovelpub",[288,329]],["drivebot",326]]);

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
    const safe = {
        'Error': self.Error,
        'Object_defineProperty': Object.defineProperty.bind(Object),
        'RegExp': self.RegExp,
        'RegExp_test': self.RegExp.prototype.test,
        'RegExp_exec': self.RegExp.prototype.exec,
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
//   `MAIN` world not yet supported in Firefox, so we inject the code into
//   'MAIN' ourself when enviroment in Firefox.

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
