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

const argsList = [[".call(null)","10"],[".call(null)"],["(null)","10"],["userHasAdblocker"],["null)","10"],["objSubPromo"],["adb"],["nrWrapper"],["warn"],["adBlockerDetected"],["show"],["adObjects"],["offsetParent"],["InfMediafireMobileFunc","1000"],["google_jobrunner"],["()","45000"],["prompt"],["0x"],["displayAdBlockedVideo"],[".adsbygoogle"],["contrformpub","5000"],["disabledAdBlock","10000"],["_0x"],["ads.length"],["location.href"],["isDesktopApp","1000"],["Bait"],["admc"],["AdBlocker"],["Blocked"],["nextFunction"],["'0x"],["apstagLOADED"],["Adb"],["disableDeveloper"],["Blocco","2000"],["nextFunction","2000"],["documentElement.classList.add","400"],["test","0"],["checkAdblockUser","1000"],["checkPub","6000"],["document.querySelector","5000"],["nextFunction","250"],["popup"],["()","150"],["backRedirect"],["document.querySelectorAll","1000"],["style"],["clientHeight"],["addEventListener","0"],["adblock","2000"],["start","0"],["byepopup","5000"],["test.remove","100"],["additional_src","300"],["()","2000"],["css_class.show"],["CANG","3000"],["updato-overlay","500"],["innerText","2000"],["modal"],["alert","8000"],["css_class"],["()","50"],["debugger"],["initializeCourier","3000"],["redirectPage"],["_0x","2000"],["ads","750"],["location.href","500"],["Adblock","5000"],["disable","200"],["CekAab","0"],["rbm_block_active","1000"],["show()"],["n.trigger","1"],["instance.check","1"],["adblock"],["abDetected"],["KeepOpeningPops","1000"],["appendChild"],["adb","0"],["adBlocked"],["warning","100"],["adblock_popup","500"],["Adblock"],["#chatWrap","1000"],["keep-ads","2000"],["#rbm_block_active","1000"],["null","4000"],["()","2500"],["myaabpfun","3000"],["adFilled","2500"],["()","15000"],["showPopup"],["()","1"],["()","1000"],["document.cookie","2500"],["window.open"],["innerHTML"],["readyplayer","2000"],["/text()|0x/"],["checkStopBlock"],["adspot_top","1500"],["xclaim"],["an_message","500"],["Adblocker","10000"],["trigger","0"],["timeoutChecker"],["bait","1"],["pum-open"],["overlay","2000"],["AdBanner","2000"],["test","100"],["replace","1500"],["popCanFire"],["Math.round","1000"],["adblock","5"],["bioEp"],["ag_adBlockerDetected"],["null"],["adsbox","1000"],["adb","6000"],["pop"],["sadbl"],["checkAdStatus"],["()","0"],["mdp"],["brave_load_popup"],["0x","3000"],["invoke"],["adsbytrafficjunkycontext"],["ipod"],["offsetWidth"],["/$|adBlock/"],["ads"],["adsbygoogle"],["()"],["AdBlock"],["stop-scrolling"],["Adv"],["blockUI","2000"],["mdpDeBlocker"],["/_0x|debug/"],["/ai_adb|_0x/"],["iframe"],["adBlock"],["","1"],["undefined"],["eval"],["check","1"],["adsBlocked"],["getComputedStyle","250"],["blocker"],["aswift_"],["afs_ads","2000"],["visibility","2000"],["bait"],["blocked"],["{r()","0"],["nextFunction","450"],["Debug"],["r()","0"],["Math.floor"],["offset"],["purple_box"],["offsetHeight"],["checkSiteNormalLoad"],["adBlockOverlay"],["Detected","500"],["height"],[".show","1000"],[".show"],["innerHTML.replace","1000"],["showModal"],["getComputedStyle"],["blur"],["samOverlay"],["bADBlock"],["location"],["","4000"],["alert"],["blocker","100"],["length"],["ai_adb"],["t()","0"],["$"],["offsetLeft"],[".show()","1000"],["mdp_deblocker"],["charAt"],["checkAds"],["fadeIn","0"],["jQuery"],["/^/"],["check"],["Adblocker"],["eabdModal"],["ab_root.show"],["gaData"],["ad"],["prompt","1000"],["googlefc"],["adblock detection"],[".offsetHeight","100"],["popState"],["ad-block-popup"],["exitTimer"],["innerHTML.replace"],["data?","4000"],[".data?"],["eabpDialog"],[".length","2000"],["adsense"],["/Adblock|_ad_/"],["googletag"],["f.parentNode.removeChild(f)","100"],["swal","500"],["keepChecking","1000"],["openPopup"],[".offsetHeight"],["()","3000"],["nitroAds"],["class.scroll","1000"],["disableDeveloperTools"],["Check"],["insertBefore"],["css_class.scroll"],["/null|Error/","10000"],["window.location.href","50"],["/out.php"],["/0x|devtools/"],["location.replace","300"],["window.location.href"],["checkVisible"],["_0x","3000"],["window.location.href=link"],["ai_"],["reachGoal"],["ai"],["/width|innerHTML/"],["magnificPopup"],["adblockEnabled"],["ads_block"],["google_ad"],["document.location"],["google"],["top-right","2000"],["enforceAdStatus"],["loadScripts"],["Ads"],["mfp"],["display","5000"],["eb"],[").show()"],["","1000"],["atob"],["devtool"],["Msg"],["UABP"],["","250"],["href"],["aaaaa-modal"],["()=>"],["keepChecking"],["null","10"],["/bait|detected/"],["","5"],["","500"],["/Adform|didomi|adblock|forEach/"],["/\\.innerHtml|offsetWidth/"],["showAdblock"],["-0x"],["display"],["gclid"],["rejectWith"],["refresh"],["window.location"],["ga"],["ShowAdBLockerNotice"],["ad_listener"],["open"],["(!0)"],["Delay"],["/appendChild|e\\(\"/"],["=>"],["ADB"],["site-access-popup"],["data?"],["/debugger|UserCustomPop/"],["checkAdblockUser"],["canRunAds"],["displayMessage","2000"],["redURL"],["/salesPopup|mira-snackbar/"],["advanced"],["detectImgLoad"],["offsetHeight","200"],["detector"],["replace"],["touchstart"],["siteAccessFlag"],["ab"],["adblocker"],["/children\\('ins'\\)|Adblock|adsbygoogle/"],["displayMessage"],["fetch"],["afterOpen"],["chkADB"],["onDetected"],["myinfoey","1500"],["placebo"],["offsetHeight","100"],["fuckadb"],["detect"],["siteAccessPopup"],["/adsbygoogle|adblock/"],["akadb"],["biteDisplay"],["/[a-z]\\(!0\\)/","800"],["ad_block"],["/detectAdBlocker|window.open/"],["hasAdBlock"],["adBlockDetected"],["popUnder"],["/GoToURL|delay/"],["/adblock/i"],["ad_display"],["/adScriptPath|MMDConfig/"],["adsFound"],["0x","100"],["/ads|adb/"],["/native|\\{n\\(\\)/"],["ad blocker"]];

const hostnamesMap = new Map([["4-liga.com",0],["4fansites.de",0],["4players.de",0],["9monate.de",0],["aachener-nachrichten.de",0],["aachener-zeitung.de",0],["abendblatt.de",0],["abendzeitung-muenchen.de",0],["about-drinks.com",0],["abseits-ka.de",0],["airliners.de",0],["ajaxshowtime.com",0],["allgemeine-zeitung.de",0],["antenne.de",0],["arcor.de",0],["areadvd.de",0],["areamobile.de",0],["ariva.de",0],["astronews.com",0],["aussenwirtschaftslupe.de",0],["auszeit.bio",0],["auto-motor-und-sport.de",0],["auto-service.de",0],["autobild.de",0],["autoextrem.de",0],["autopixx.de",0],["autorevue.at",0],["az-online.de",0],["baby-vornamen.de",0],["babyclub.de",0],["bafoeg-aktuell.de",0],["berliner-kurier.de",0],["berliner-zeitung.de",0],["bigfm.de",0],["bikerszene.de",0],["bildderfrau.de",0],["blackd.de",0],["blick.de",0],["boerse-online.de",0],["boerse.de",0],["boersennews.de",0],["braunschweiger-zeitung.de",0],["brieffreunde.de",0],["brigitte.de",0],["buerstaedter-zeitung.de",0],["buffed.de",0],["businessinsider.de",0],["buzzfeed.at",0],["buzzfeed.de",0],["caravaning.de",0],["cavallo.de",0],["chefkoch.de",0],["cinema.de",0],["clever-tanken.de",0],["computerbild.de",0],["computerhilfen.de",0],["comunio-cl.com",0],["connect.de",0],["da-imnetz.de",0],["dasgelbeblatt.de",0],["dbna.com",0],["dbna.de",0],["deichstube.de",0],["deine-tierwelt.de",0],["der-betze-brennt.de",0],["derwesten.de",0],["desired.de",0],["dhd24.com",0],["dieblaue24.com",0],["digitalfernsehen.de",0],["dnn.de",0],["donnerwetter.de",0],["e-hausaufgaben.de",0],["e-mountainbike.com",0],["eatsmarter.de",0],["echo-online.de",0],["ecomento.de",0],["einfachschoen.me",0],["elektrobike-online.com",0],["eltern.de",0],["epochtimes.de",0],["essen-und-trinken.de",0],["express.de",0],["extratipp.com",0],["familie.de",0],["fanfiktion.de",0],["fehmarn24.de",0],["fettspielen.de",0],["fid-gesundheitswissen.de",0],["finanznachrichten.de",0],["finanztreff.de",0],["finya.de",0],["firmenwissen.de",0],["fitforfun.de",0],["fnp.de",0],["focus.de",0],["football365.fr",0],["formel1.de",0],["fr.de",0],["frankfurter-wochenblatt.de",0],["freenet.de",0],["fremdwort.de",0],["froheweihnachten.info",0],["frustfrei-lernen.de",0],["fuldaerzeitung.de",0],["funandnews.de",0],["fussballdaten.de",0],["futurezone.de",0],["gala.de",0],["gamepro.de",0],["gamersglobal.de",0],["gamesaktuell.de",0],["gamestar.de",0],["gamezone.de",0],["gartendialog.de",0],["gartenlexikon.de",0],["gedichte.ws",0],["geissblog.koeln",0],["gelnhaeuser-tageblatt.de",0],["general-anzeiger-bonn.de",0],["geniale-tricks.com",0],["genialetricks.de",0],["gesund-vital.de",0],["gesundheit.de",0],["gevestor.de",0],["gewinnspiele.tv",0],["giessener-allgemeine.de",0],["giessener-anzeiger.de",0],["gifhorner-rundschau.de",0],["giga.de",0],["gipfelbuch.ch",0],["gmuender-tagespost.de",0],["golem.de",[0,9,10]],["gruenderlexikon.de",0],["gusto.at",0],["gut-erklaert.de",0],["gutfuerdich.co",0],["hallo-muenchen.de",0],["hamburg.de",0],["hanauer.de",0],["hardwareluxx.de",0],["hartziv.org",0],["harzkurier.de",0],["haus-garten-test.de",0],["hausgarten.net",0],["haustec.de",0],["haz.de",0],["heidelberg24.de",0],["heilpraxisnet.de",0],["heise.de",0],["helmstedter-nachrichten.de",0],["hersfelder-zeitung.de",0],["hftg.co",0],["hifi-forum.de",0],["hna.de",0],["hochheimer-zeitung.de",0],["hoerzu.de",0],["hofheimer-zeitung.de",0],["iban-rechner.de",0],["ikz-online.de",0],["immobilienscout24.de",0],["ingame.de",0],["inside-digital.de",0],["inside-handy.de",0],["investor-verlag.de",0],["jappy.com",0],["jpgames.de",0],["kabeleins.de",0],["kachelmannwetter.com",0],["kamelle.de",0],["kicker.de",0],["kindergeld.org",0],["kino.de",0],["klettern-magazin.de",0],["klettern.de",0],["kochbar.de",0],["kreis-anzeiger.de",0],["kreisbote.de",0],["kreiszeitung.de",0],["ksta.de",0],["kurierverlag.de",0],["lachainemeteo.com",0],["lampertheimer-zeitung.de",0],["landwirt.com",0],["laut.de",0],["lauterbacher-anzeiger.de",0],["leckerschmecker.me",0],["leinetal24.de",0],["lesfoodies.com",0],["levif.be",0],["lifeline.de",0],["liga3-online.de",0],["likemag.com",0],["linux-community.de",0],["linux-magazin.de",0],["ln-online.de",0],["lokalo24.de",0],["lustaufsleben.at",0],["lustich.de",0],["lvz.de",0],["lz.de",0],["macwelt.de",0],["macworld.co.uk",0],["mail.de",0],["main-spitze.de",0],["manager-magazin.de",0],["manga-tube.me",0],["mathebibel.de",0],["mathepower.com",0],["maz-online.de",0],["medisite.fr",0],["mehr-tanken.de",0],["mein-kummerkasten.de",0],["mein-mmo.de",0],["mein-wahres-ich.de",0],["meine-anzeigenzeitung.de",0],["meinestadt.de",0],["menshealth.de",0],["mercato365.com",0],["merkur.de",0],["messen.de",0],["metal-hammer.de",0],["metalflirt.de",0],["meteologix.com",0],["minecraft-serverlist.net",0],["mittelbayerische.de",0],["modhoster.de",0],["moin.de",0],["mopo.de",0],["morgenpost.de",0],["motor-talk.de",0],["motorbasar.de",0],["motorradonline.de",0],["motorsport-total.com",0],["motortests.de",0],["mountainbike-magazin.de",0],["moviejones.de",0],["moviepilot.de",0],["mt.de",0],["mtb-news.de",0],["musiker-board.de",0],["musikexpress.de",0],["musikradar.de",0],["mz-web.de",0],["n-tv.de",0],["naumburger-tageblatt.de",0],["netzwelt.de",0],["neuepresse.de",0],["neueroeffnung.info",0],["news.at",0],["news.de",0],["news38.de",0],["newsbreak24.de",0],["nickles.de",0],["nicknight.de",0],["nl.hardware.info",0],["nn.de",0],["nnn.de",0],["nordbayern.de",0],["notebookchat.com",0],["notebookcheck-ru.com",0],["notebookcheck-tr.com",0],["noz-cdn.de",0],["noz.de",0],["nrz.de",0],["nw.de",0],["nwzonline.de",0],["oberhessische-zeitung.de",0],["oeffentlicher-dienst.info",0],["onlinekosten.de",0],["onvista.de",0],["op-marburg.de",0],["op-online.de",0],["outdoor-magazin.com",0],["outdoorchannel.de",0],["paradisi.de",0],["pc-magazin.de",0],["pcgames.de",0],["pcgameshardware.de",0],["pcwelt.de",0],["pcworld.es",0],["peiner-nachrichten.de",0],["pferde.de",0],["pietsmiet.de",0],["pixelio.de",0],["pkw-forum.de",0],["playboy.de",0],["playfront.de",0],["pnn.de",0],["pons.com",0],["prad.de",[0,139]],["prignitzer.de",0],["profil.at",0],["promipool.de",0],["promobil.de",0],["prosiebenmaxx.de",0],["psychic.de",[0,166]],["quoka.de",0],["radio.at",0],["radio.de",0],["radio.dk",0],["radio.es",0],["radio.fr",0],["radio.it",0],["radio.net",0],["radio.pl",0],["radio.pt",0],["radio.se",0],["ran.de",0],["readmore.de",0],["rechtslupe.de",0],["recording.de",0],["rennrad-news.de",0],["reuters.com",0],["reviersport.de",0],["rhein-main-presse.de",0],["rheinische-anzeigenblaetter.de",0],["rimondo.com",0],["roadbike.de",0],["roemische-zahlen.net",0],["rollingstone.de",0],["rot-blau.com",0],["rp-online.de",0],["rtl.de",[0,265]],["rtv.de",0],["rugby365.fr",0],["ruhr24.de",0],["rundschau-online.de",0],["runnersworld.de",0],["safelist.eu",0],["salzgitter-zeitung.de",0],["sat1.de",0],["sat1gold.de",0],["schwaebische-post.de",0],["schwarzwaelder-bote.de",0],["serienjunkies.de",0],["shz.de",0],["sixx.de",0],["skodacommunity.de",0],["smart-wohnen.net",0],["sn.at",0],["sozialversicherung-kompetent.de",0],["spiegel.de",0],["spielen.de",0],["spieletipps.de",0],["spielfilm.de",0],["sport.de",0],["sport365.fr",0],["sportal.de",0],["spox.com",0],["stern.de",0],["stuttgarter-nachrichten.de",0],["stuttgarter-zeitung.de",0],["sueddeutsche.de",0],["svz.de",0],["szene1.at",0],["szene38.de",0],["t-online.de",0],["tagesspiegel.de",0],["taschenhirn.de",0],["techadvisor.co.uk",0],["techstage.de",0],["tele5.de",0],["the-voice-of-germany.de",0],["thueringen24.de",0],["tichyseinblick.de",0],["tierfreund.co",0],["tiervermittlung.de",0],["torgranate.de",0],["trend.at",0],["tv-media.at",0],["tvdigital.de",0],["tvinfo.de",0],["tvspielfilm.de",0],["tvtoday.de",0],["tz.de",0],["unicum.de",0],["unnuetzes.com",0],["unsere-helden.com",0],["unterhalt.net",0],["usinger-anzeiger.de",0],["usp-forum.de",0],["videogameszone.de",0],["vienna.at",0],["vip.de",0],["virtualnights.com",0],["vox.de",0],["wa.de",0],["wallstreet-online.de",[0,3]],["waz.de",0],["weather.us",0],["webfail.com",0],["weihnachten.me",0],["weihnachts-bilder.org",0],["weihnachts-filme.com",0],["welt.de",0],["weltfussball.at",0],["weristdeinfreund.de",0],["werkzeug-news.de",0],["werra-rundschau.de",0],["wetterauer-zeitung.de",0],["wiesbadener-kurier.de",0],["wiesbadener-tagblatt.de",0],["winboard.org",0],["windows-7-forum.net",0],["winfuture.de",0],["wintotal.de",0],["wlz-online.de",0],["wn.de",0],["wohngeld.org",0],["wolfenbuetteler-zeitung.de",0],["wolfsburger-nachrichten.de",0],["woman.at",0],["womenshealth.de",0],["wormser-zeitung.de",0],["woxikon.de",0],["wp.de",0],["wr.de",0],["yachtrevue.at",0],["ze.tt",0],["zeit.de",0],["meineorte.com",1],["osthessen-news.de",1],["techadvisor.com",1],["teltarif.de",4],["economictimes.indiatimes.com",5],["m.timesofindia.com",6],["timesofindia.indiatimes.com",6],["youmath.it",6],["redensarten-index.de",6],["lesoir.be",6],["electriciansforums.net",6],["keralatelecom.info",6],["universegunz.net",6],["happypenguin.altervista.org",6],["everyeye.it",6],["bluedrake42.com",6],["streamservicehd.click",6],["supermarioemulator.com",6],["futbollibrehd.com",6],["newsrade.com",6],["eska.pl",6],["eskarock.pl",6],["voxfm.pl",6],["mathaeser.de",6],["freethesaurus.com",8],["thefreedictionary.com",8],["hdbox.ws",10],["todopolicia.com",10],["scat.gold",10],["freecoursesite.com",10],["windowcleaningforums.co.uk",10],["cruisingearth.com",10],["hobby-machinist.com",10],["freegogpcgames.com",10],["latitude.to",10],["kitchennovel.com",10],["w3layouts.com",10],["blog.receivefreesms.co.uk",10],["eductin.com",10],["dealsfinders.blog",10],["audiobooks4soul.com",10],["tinhocdongthap.com",10],["sakarnewz.com",10],["downloadr.in",10],["topcomicporno.com",10],["dongknows.com",10],["traderepublic.community",10],["celtadigital.com",10],["iptvrun.com",10],["adsup.lk",10],["cryptomonitor.in",10],["areatopik.com",10],["cardscanner.co",10],["nullforums.net",10],["courseclub.me",10],["tamarindoyam.com",10],["choiceofmods.com",10],["myqqjd.com",10],["ssdtop.com",10],["apkhex.com",10],["gezegenforum.com",10],["mbc2.live",10],["forumnulled.com",10],["iptvapps.net",10],["null-scripts.net",10],["nullscripts.net",10],["whncourses.com",10],["bloground.ro",10],["witcherhour.com",10],["ottverse.com",10],["mdn.lol",[10,270]],["torrentmac.net",10],["mazakony.com",10],["laptechinfo.com",10],["mc-at.org",10],["playstationhaber.com",10],["mangapt.com",10],["seriesperu.com",10],["pesprofessionals.com",10],["wpsimplehacks.com",10],["sportshub.to",[10,264]],["topsporter.net",[10,264]],["darkwanderer.net",10],["truckingboards.com",10],["coldfrm.org",10],["azrom.net",10],["freepatternsarea.com",10],["alttyab.net",10],["hq-links.com",10],["mobilkulup.com",10],["esopress.com",10],["rttar.com",10],["nesiaku.my.id",10],["jipinsoft.com",10],["surfsees.com",10],["truthnews.de",10],["farsinama.com",10],["worldofiptv.com",10],["vuinsider.com",10],["crazydl.net",10],["gamemodsbase.com",10],["babiato.tech",10],["secuhex.com",10],["turkishaudiocenter.com",10],["galaxyos.net",10],["blackhatworld.com",10],["bizdustry.com",10],["geektime.co.il",11],["bild.de",12],["mediafire.com",13],["wcoanimedub.tv",14],["wcoforever.net",14],["openspeedtest.com",14],["addtobucketlist.com",14],["3dzip.org",[14,89]],["ilmeteo.it",14],["wcoforever.com",14],["comprovendolibri.it",14],["healthelia.com",14],["keephealth.info",15],["australianfrequentflyer.com.au",16],["afreesms.com",17],["kinoger.re",17],["laksa19.github.io",17],["imgux.buzz",17],["imgewe.buzz",17],["imgxxxx.buzz",17],["imgeza.buzz",17],["imgzzzz.buzz",17],["imgxhfr.buzz",17],["imgqwt.buzz",17],["imgtwq.buzz",17],["imgbjryy.buzz",17],["imgjetr.buzz",17],["imgxelz.buzz",17],["imgytreq.buzz",17],["javcl.com",17],["upvideo.to",17],["tvlogy.to",17],["himovies.to",17],["live.dragaoconnect.net",17],["beststremo.com",17],["seznam.cz",17],["seznamzpravy.cz",17],["xerifetech.com",17],["wallpapershome.com",19],["ville-ideale.fr",20],["calciomercato.it",21],["calciomercato.com",22],["bersamatekno.com",22],["hotpornfile.org",22],["robloxscripts.com",22],["coolsoft.altervista.org",22],["worldcupfootball.me",[22,27]],["hackedonlinegames.com",22],["jkoding.xyz",22],["settlersonlinemaps.com",22],["1cloudfile.com",22],["magdownload.org",22],["kpkuang.org",22],["shareus.site",22],["crypto4yu.com",22],["faucetwork.space",22],["claimclicks.com",22],["thenightwithoutthedawn.blogspot.com",22],["entutes.com",22],["claimlite.club",22],["bazadecrypto.com",[22,310]],["whosampled.com",23],["imgkings.com",24],["pornvideotop.com",24],["krotkoosporcie.pl",24],["anghami.com",25],["wired.com",26],["tutele.sx",27],["footyhunter3.xyz",27],["magesypro.pro",[28,29]],["tinyppt.com",28],["audiotools.pro",29],["magesy.blog",29],["audioztools.com",[29,30]],["altblogger.net",30],["satoshi-win.xyz",30],["freedeepweb.blogspot.com",30],["freesoft.id",30],["zcteam.id",30],["www-daftarharga.blogspot.com",30],["ear-phone-review.com",30],["telefullenvivo.com",30],["listatv.pl",30],["encurtandourl.com",[30,152]],["katestube.com",31],["short.pe",31],["footystreams.net",31],["seattletimes.com",32],["yiv.com",33],["pornohans.com",33],["pornoente.tv",[33,80]],["nursexfilme.com",33],["milffabrik.com",[33,80]],["pornohirsch.net",33],["pornozebra.com",[33,80]],["xhamster-sexvideos.com",33],["pornoschlange.com",33],["hdpornos.net",33],["gutesexfilme.com",33],["pornotom.com",[33,80]],["short1.site",33],["zona-leros.com",33],["globalrph.com",34],["e-glossa.it",35],["java-forum.org",36],["comunidadgzone.es",36],["anime-extremo.com",36],["mp3fy.com",36],["lebensmittelpraxis.de",36],["ebookdz.com",36],["forum-pokemon-go.fr",36],["praxis-jugendarbeit.de",36],["gdrivez.xyz",36],["dictionnaire-medical.net",36],["cle0desktop.blogspot.com",36],["up-load.io",36],["direct-link.net",36],["direkt-wissen.com",36],["keysbrasil.blogspot.com",36],["hotpress.info",36],["turkleech.com",36],["anibatch.me",36],["anime-i.com",36],["healthtune.site",36],["gewinde-normen.de",36],["tucinehd.com",36],["freewebscript.com",37],["webcheats.com.br",38],["gala.fr",40],["gentside.com",40],["geo.fr",40],["hbrfrance.fr",40],["nationalgeographic.fr",40],["ohmymag.com",40],["serengo.net",40],["vsd.fr",40],["updato.com",[41,58]],["methbox.com",42],["daizurin.com",42],["pendekarsubs.us",42],["dreamfancy.org",42],["rysafe.blogspot.com",42],["toppng.com",42],["th-world.com",42],["avjamack.com",42],["avjamak.net",42],["techacode.com",42],["tickzoo.tv",43],["daddyhd.com",44],["embedstream.me",44],["yts-subs.net",44],["cnnamador.com",45],["nudecelebforum.com",46],["pronpic.org",47],["thewebflash.com",48],["discordfastfood.com",48],["xup.in",48],["popularmechanics.com",49],["op.gg",50],["lequipe.fr",51],["jellynote.com",52],["knights-table.net",53],["eporner.com",54],["pornbimbo.com",55],["allmonitors24.com",55],["4j.com",55],["avoiderrors.com",56],["cgtips.org",[56,210]],["sitarchive.com",56],["livenewsof.com",56],["topnewsshow.com",56],["gatcha.org",56],["empregoestagios.com",56],["everydayonsales.com",56],["kusonime.com",56],["aagmaal.xyz",56],["suicidepics.com",56],["codesnail.com",56],["codingshiksha.com",56],["graphicux.com",56],["hardcoregames.ca",56],["asyadrama.com",56],["bitcoinegypt.news",56],["citychilli.com",56],["talkjarvis.com",56],["hdmotori.it",57],["femdomtb.com",59],["camhub.cc",59],["bobs-tube.com",59],["ru-xvideos.me",59],["pornfd.com",59],["popno-tour.net",59],["molll.mobi",59],["watchmdh.to",59],["camwhores.tv",59],["audioz.cc",60],["audioz.es",60],["vectorizer.io",60],["smgplaza.com",60],["ftuapps.dev",60],["onehack.us",60],["thapcam.net",60],["elfqrin.com",61],["satcesc.com",62],["apfelpatient.de",62],["lusthero.com",63],["hpav.tv",64],["hpjav.tv",64],["m2list.com",64],["embed.nana2play.com",64],["elahmad.com",64],["dofusports.xyz",64],["dallasnews.com",65],["lnk.news",66],["lnk.parts",66],["efukt.com",67],["wendycode.com",67],["springfieldspringfield.co.uk",68],["porndoe.com",69],["smsget.net",[70,71]],["kjanime.net",72],["gioialive.it",73],["classicreload.com",74],["chicoer.com",75],["bostonherald.com",75],["dailycamera.com",75],["gomiblog.com",76],["maxcheaters.com",77],["rbxoffers.com",77],["postimees.ee",77],["police.community",77],["gisarea.com",77],["schaken-mods.com",77],["theclashify.com",77],["txori.com",77],["olarila.com",77],["deletedspeedstreams.blogspot.com",77],["sportsplays.com",78],["deinesexfilme.com",80],["einfachtitten.com",80],["halloporno.com",80],["herzporno.com",80],["lesbenhd.com",80],["porn-monkey.com",80],["porndrake.com",80],["pornhubdeutsch.net",80],["pornoaffe.com",80],["pornodavid.com",80],["pornofisch.com",80],["pornofelix.com",80],["pornohammer.com",80],["pornohelm.com",80],["pornoklinge.com",80],["pornotommy.com",80],["pornovideos-hd.com",80],["xhamsterdeutsch.xyz",80],["xnxx-sexfilme.com",80],["zerion.cc",80],["letribunaldunet.fr",81],["vladan.fr",81],["live-tv-channels.org",82],["eslfast.com",83],["freegamescasual.com",84],["tcpvpn.com",85],["oko.sh",85],["timesnownews.com",85],["timesnowhindi.com",85],["timesnowmarathi.com",85],["zoomtventertainment.com",85],["xxxuno.com",86],["sholah.net",87],["2rdroid.com",87],["bisceglielive.it",88],["pandajogosgratis.com.br",90],["5278.cc",91],["tonspion.de",93],["duplichecker.com",94],["plagiarismchecker.co",94],["plagiarismdetector.net",94],["searchenginereports.net",94],["smallseotools.com",94],["giallozafferano.it",95],["autojournal.fr",95],["autoplus.fr",95],["sportauto.fr",95],["linkspaid.com",96],["proxydocker.com",96],["beeimg.com",[97,98]],["emturbovid.com",98],["ftlauderdalebeachcam.com",99],["ftlauderdalewebcam.com",99],["juneauharborwebcam.com",99],["keywestharborwebcam.com",99],["kittycatcam.com",99],["mahobeachcam.com",99],["miamiairportcam.com",99],["morganhillwebcam.com",99],["njwildlifecam.com",99],["nyharborwebcam.com",99],["paradiseislandcam.com",99],["pompanobeachcam.com",99],["portbermudawebcam.com",99],["portcanaveralwebcam.com",99],["portevergladeswebcam.com",99],["portmiamiwebcam.com",99],["portnywebcam.com",99],["portnassauwebcam.com",99],["portstmaartenwebcam.com",99],["portstthomaswebcam.com",99],["porttampawebcam.com",99],["sxmislandcam.com",99],["gearingcommander.com",99],["themes-dl.com",99],["badassdownloader.com",99],["badasshardcore.com",99],["badassoftcore.com",99],["nulljungle.com",99],["teevee.asia",99],["otakukan.com",99],["linksht.com",101],["generate.plus",102],["calculate.plus",102],["avcesar.com",103],["audiotag.info",104],["tudigitale.it",105],["ibcomputing.com",106],["eodev.com",107],["legia.net",108],["acapellas4u.co.uk",109],["streamhentaimovies.com",110],["konten.co.id",111],["diariodenavarra.es",112],["xiaomifans.pl",113],["eletronicabr.com",113],["iphonesoft.fr",114],["gload.cc",115],["optifine.net",116],["luzernerzeitung.ch",117],["tagblatt.ch",117],["spellcheck.net",118],["spellchecker.net",118],["spellweb.com",118],["ableitungsrechner.net",119],["alternet.org",120],["gourmetsupremacy.com",120],["imtranslator.net",121],["shrib.com",122],["pandafiles.com",123],["vidia.tv",[123,145]],["hortonanderfarom.blogspot.com",123],["clarifystraight.com",123],["constraindefiant.net",124],["tutelehd3.xyz",124],["mega4upload.com",124],["coolcast2.com",124],["techclips.net",124],["earthquakecensus.com",124],["footyhunter.lol",124],["gamerarcades.com",124],["poscitech.click",124],["starlive.stream",124],["utopianwilderness.com",124],["wecast.to",124],["sportbar.live",124],["lordchannel.com",124],["play-old-pc-games.com",125],["scrin.org",126],["tunovelaligera.com",127],["tapchipi.com",127],["cuitandokter.com",127],["tech-blogs.com",127],["cardiagn.com",127],["dcleakers.com",127],["esgeeks.com",127],["pugliain.net",127],["uplod.net",127],["worldfreeware.com",127],["fikiri.net",127],["myhackingworld.com",127],["phoenixfansub.com",127],["freecourseweb.com",128],["devcourseweb.com",128],["coursewikia.com",128],["courseboat.com",128],["coursehulu.com",128],["lne.es",132],["pornult.com",133],["webcamsdolls.com",133],["adsy.pw",133],["playstore.pw",133],["bitcotasks.com",133],["exactpay.online",133],["thothd.to",133],["proplanta.de",134],["hydrogenassociation.org",135],["ludigames.com",135],["made-by.org",135],["xenvn.com",135],["worldtravelling.com",135],["igirls.in",135],["technichero.com",135],["roshiyatech.my.id",135],["1upinfinite.com",135],["24sport.stream",135],["tii.la",135],["yesmangas1.com",135],["aeroxplorer.com",135],["mad4wheels.com",136],["logi.im",136],["emailnator.com",136],["textograto.com",137],["voyageforum.com",138],["hmc-id.blogspot.com",138],["jemerik.com",138],["myabandonware.com",138],["chatta.it",140],["ketubanjiwa.com",141],["nsfw247.to",142],["funzen.net",142],["fighter.stream",142],["ilclubdellericette.it",142],["hubstream.in",142],["extremereportbot.com",143],["getintopc.com",144],["qoshe.com",146],["lowellsun.com",147],["mamadu.pl",147],["dobrapogoda24.pl",147],["motohigh.pl",147],["namasce.pl",147],["ultimate-catch.eu",148],["tabele-kalorii.pl",148],["cpopchanelofficial.com",150],["cryptowidgets.net",[150,266]],["creditcardgenerator.com",151],["creditcardrush.com",151],["bostoncommons.net",151],["thejobsmovie.com",151],["livsavr.co",151],["hl-live.de",152],["ihow.info",152],["filesus.com",152],["sturls.com",152],["re.two.re",152],["turbo1.co",152],["cartoonsarea.xyz",152],["nilopolisonline.com.br",153],["mesquitaonline.com",153],["yellowbridge.com",153],["socialgirls.im",154],["yaoiotaku.com",155],["camhub.world",156],["moneyhouse.ch",157],["valeronevijao.com",158],["cigarlessarefy.com",158],["figeterpiazine.com",158],["yodelswartlike.com",158],["generatesnitrosate.com",158],["crownmakermacaronicism.com",158],["chromotypic.com",158],["gamoneinterrupted.com",158],["metagnathtuggers.com",158],["wolfdyslectic.com",158],["rationalityaloelike.com",158],["sizyreelingly.com",158],["simpulumlamerop.com",158],["urochsunloath.com",158],["monorhinouscassaba.com",158],["counterclockwisejacky.com",158],["35volitantplimsoles5.com",158],["scatch176duplicities.com",158],["antecoxalbobbing1010.com",158],["boonlessbestselling244.com",158],["cyamidpulverulence530.com",158],["guidon40hyporadius9.com",158],["449unceremoniousnasoseptal.com",158],["19turanosephantasia.com",158],["30sensualizeexpression.com",158],["321naturelikefurfuroid.com",158],["745mingiestblissfully.com",158],["availedsmallest.com",158],["greaseball6eventual20.com",158],["toxitabellaeatrebates306.com",158],["20demidistance9elongations.com",158],["audaciousdefaulthouse.com",158],["fittingcentermondaysunday.com",158],["fraudclatterflyingcar.com",158],["launchreliantcleaverriver.com",158],["matriculant401merited.com",158],["realfinanceblogcenter.com",158],["reputationsheriffkennethsand.com",158],["telyn610zoanthropy.com",158],["tubelessceliolymph.com",158],["tummulerviolableness.com",158],["un-block-voe.net",158],["v-o-e-unblock.com",158],["voe-un-block.com",158],["voeun-block.net",158],["voeunbl0ck.com",158],["voeunblck.com",158],["voeunblk.com",158],["voeunblock.com",158],["voeunblock1.com",158],["voeunblock2.com",158],["voeunblock3.com",158],["agefi.fr",159],["cariskuy.com",160],["letras2.com",160],["yusepjaelani.blogspot.com",161],["letras.mus.br",162],["soulreaperzone.com",163],["cheatermad.com",164],["mtlurb.com",165],["port.hu",166],["acdriftingpro.com",166],["flight-report.com",166],["forumdz.com",166],["abandonmail.com",166],["beverfood.com",166],["flmods.com",166],["zilinak.sk",166],["temp-phone-number.com",166],["projectfreetv.stream",166],["hotdesimms.com",166],["pdfaid.com",166],["mconverter.eu",166],["dzeko11.net",[166,264]],["mail.com",166],["expresskaszubski.pl",166],["moegirl.org.cn",166],["onemanhua.com",167],["t3n.de",168],["allindiaroundup.com",169],["osuskinner.com",170],["vrcmods.com",170],["thefastlaneforum.com",171],["trade2win.com",172],["gmodleaks.com",172],["fontyukle.net",173],["modagamers.com",174],["freemagazines.top",174],["straatosphere.com",174],["nullpk.com",174],["adslink.pw",174],["downloadudemy.com",174],["techydino.net",174],["picgiraffe.com",174],["weadown.com",174],["freepornsex.net",174],["nurparatodos.com.ar",174],["librospreuniversitariospdf.blogspot.com",175],["forexeen.us",175],["khsm.io",175],["girls-like.me",175],["webcreator-journal.com",175],["nu6i-bg-net.com",175],["routech.ro",176],["hokej.net",176],["turkmmo.com",177],["palermotoday.it",178],["baritoday.it",178],["trentotoday.it",178],["agrigentonotizie.it",178],["anconatoday.it",178],["arezzonotizie.it",178],["avellinotoday.it",178],["bresciatoday.it",178],["brindisireport.it",178],["casertanews.it",178],["cataniatoday.it",178],["cesenatoday.it",178],["chietitoday.it",178],["forlitoday.it",178],["frosinonetoday.it",178],["genovatoday.it",178],["ilpescara.it",178],["ilpiacenza.it",178],["latinatoday.it",178],["lecceprima.it",178],["leccotoday.it",178],["livornotoday.it",178],["messinatoday.it",178],["milanotoday.it",178],["modenatoday.it",178],["monzatoday.it",178],["novaratoday.it",178],["padovaoggi.it",178],["parmatoday.it",178],["perugiatoday.it",178],["pisatoday.it",178],["quicomo.it",178],["ravennatoday.it",178],["reggiotoday.it",178],["riminitoday.it",178],["romatoday.it",178],["salernotoday.it",178],["sondriotoday.it",178],["sportpiacenza.it",178],["ternitoday.it",178],["today.it",178],["torinotoday.it",178],["trevisotoday.it",178],["triesteprima.it",178],["udinetoday.it",178],["veneziatoday.it",178],["vicenzatoday.it",178],["thumpertalk.com",179],["arkcod.org",179],["facciabuco.com",180],["shorterall.com",181],["thelayoff.com",181],["maxstream.video",181],["tvepg.eu",181],["blog24.me",181],["softx64.com",182],["pstream.net",183],["instaanime.com",183],["libreriamo.it",184],["medebooks.xyz",184],["tutorials-technology.info",184],["mashtips.com",184],["marriedgames.com.br",184],["4allprograms.me",184],["nurgsm.com",184],["janusnotes.com",184],["certbyte.com",184],["plugincrack.com",184],["gamingdeputy.com",184],["cryptoblog24.info",184],["freewebcart.com",184],["dailymaverick.co.za",185],["apps2app.com",186],["my-code4you.blogspot.com",187],["leakgaming.fr",188],["pentruea.com",[189,190]],["mchacks.net",191],["why-tech.it",192],["hacksmile.com",193],["compsmag.com",193],["tapetus.pl",194],["autoroad.cz",195],["brawlhalla.fr",195],["tecnobillo.com",195],["sexcamfreeporn.com",196],["breatheheavy.com",197],["wenxuecity.com",198],["key-hub.eu",199],["fabioambrosi.it",200],["tattle.life",201],["emuenzen.de",201],["terrylove.com",201],["mynet.com",202],["cidade.iol.pt",203],["fantacalcio.it",204],["hentaifreak.org",205],["hypebeast.com",206],["krankheiten-simulieren.de",207],["catholic.com",208],["3dmodelshare.org",209],["gourmetscans.net",210],["techinferno.com",211],["phuongtrinhhoahoc.com",212],["ibeconomist.com",213],["bookriot.com",214],["purposegames.com",215],["schoolcheats.net",215],["globo.com",216],["latimes.com",216],["claimrbx.gg",217],["perelki.net",218],["vpn-anbieter-vergleich-test.de",219],["livingincebuforums.com",220],["paperzonevn.com",221],["alltechnerd.com",222],["malaysianwireless.com",223],["erinsakura.com",224],["infofuge.com",224],["freejav.guru",224],["novelmultiverse.com",224],["fritidsmarkedet.dk",225],["maskinbladet.dk",225],["15min.lt",226],["baddiehub.com",227],["mr9soft.com",228],["21porno.com",229],["adult-sex-gamess.com",230],["hentaigames.app",230],["mobilesexgamesx.com",230],["mysexgamer.com",230],["porngameshd.com",230],["sexgamescc.com",230],["xnxx-sex-videos.com",230],["f2movies.to",231],["freeporncave.com",232],["tubsxxx.com",233],["pornojenny.com",234],["subtitle.one",235],["sextvx.com",236],["studydhaba.com",237],["freecourse.tech",237],["ccthesims.com",237],["victor-mochere.com",237],["papunika.com",237],["mobilanyheter.net",237],["prajwaldesai.com",237],["muztext.com",238],["charbelnemnom.com",239],["online-fix.me",240],["gamersdiscussionhub.com",241],["owlzo.com",242],["maxpixel.net",243],["q1003.com",244],["blogpascher.com",245],["testserver.pro",246],["lifestyle.bg",246],["money.bg",246],["news.bg",246],["topsport.bg",246],["webcafe.bg",246],["mgnet.xyz",247],["advertiserandtimes.co.uk",248],["xvideos2020.me",249],["wouterplanet.com",250],["deezer.com",250],["111.90.159.132",251],["techsolveprac.com",252],["joomlabeginner.com",253],["largescaleforums.com",254],["dubznetwork.com",255],["mundodonghua.com",255],["hentaidexy.com",256],["oceanplay.org",257],["code2care.org",258],["osuskins.net",260],["xxxxsx.com",261],["ngontinh24.com",262],["idevicecentral.com",263],["coinscap.info",266],["greenenez.com",266],["insurancegold.in",266],["webfreetools.net",266],["wiki-topia.com",266],["enit.in",267],["financerites.com",267],["mangacrab.com",268],["idnes.cz",269],["viefaucet.com",271],["cloud-computing-central.com",272],["afk.guide",273],["businessnamegenerator.com",274],["rocketnews24.com",275],["soranews24.com",275],["youpouch.com",275],["ilsole24ore.com",276],["hentaiporn.one",277],["infokik.com",278],["fosslinux.com",279],["shrdsk.me",280],["examword.com",281],["sempreupdate.com.br",281],["tribuna.com",282],["trendsderzukunft.de",283],["gal-dem.com",283],["lostineu.eu",283],["oggitreviso.it",283],["speisekarte.de",283],["mixed.de",283],["lightnovelspot.com",[284,285]],["lightnovelworld.com",[284,285]],["novelpub.com",[284,285]],["webnovelpub.com",[284,285]],["mail.yahoo.com",286],["hwzone.co.il",287],["nammakalvi.com",288],["javmoon.me",289],["c2g.at",290],["terafly.me",290],["bravedown.com",291],["aquarius-horoscopes.com",292],["cancer-horoscopes.com",292],["dubipc.blogspot.com",292],["echoes.gr",292],["engel-horoskop.de",292],["freegames44.com",292],["fuerzasarmadas.eu",292],["gemini-horoscopes.com",292],["jurukunci.net",292],["krebs-horoskop.com",292],["leo-horoscopes.com",292],["maliekrani.com",292],["nklinks.click",292],["ourenseando.es",292],["pisces-horoscopes.com",292],["radio-en-direct.fr",292],["sagittarius-horoscopes.com",292],["scorpio-horoscopes.com",292],["singlehoroskop-loewe.de",292],["skat-karten.de",292],["skorpion-horoskop.com",292],["taurus-horoscopes.com",292],["the1security.com",292],["virgo-horoscopes.com",292],["zonamarela.blogspot.com",292],["yoima.hatenadiary.com",292],["hlspanel.xyz",293],["fapdrop.com",293],["vpntester.org",294],["watchhentai.net",295],["japscan.lol",296],["digitask.ru",297],["tempumail.com",298],["sexvideos.host",299],["10alert.com",301],["cryptstream.de",302],["nydus.org",302],["techhelpbd.com",303],["cellmapper.net",304],["hdrez.com",305],["youwatch-serie.com",305],["freebnbcoin.com",306],["fslinks.org",307],["v6embed.xyz",307],["vembed.net",307],["vgembed.com",307],["vid-guard.com",307],["printablecreative.com",308],["comohoy.com",309],["leak.sx",309],["pornleaks.in",309],["merlininkazani.com",309],["faindx.com",311],["converter-btc.world",312],["j91.asia",313],["jeniusplay.com",314],["indianyug.com",315],["rgb.vn",315],["needrom.com",316],["criptologico.com",317],["megadrive-emulator.com",318],["eromanga-show.com",319],["hentai-one.com",319],["hentaipaw.com",319],["10minuteemails.com",320],["luxusmail.org",320],["w3cub.com",321],["dgb.lol",322],["bangpremier.com",323],["nyaa.iss.ink",324],["scripai.com",326],["myfxbook.com",326],["whatfontis.com",326],["freepdfcomic.com",327],["memedroid.com",328],["raenonx.cc",329],["animesync.org",330],["cheatnetwork.eu",331],["karaoketexty.cz",332],["security-demo.extrahop.com",333]]);

const entitiesMap = new Map([["comunio",0],["finanzen",[0,7]],["gameswelt",0],["heftig",0],["notebookcheck",0],["testedich",0],["transfermarkt",0],["truckscout24",0],["tvtv",0],["wetteronline",0],["wieistmeineip",0],["wetter",2],["1337x",6],["eztv",6],["sushi-scan",10],["spigotunlocked",10],["ahmedmode",10],["kissasian",15],["rp5",17],["mma-core",18],["writedroid",22],["yts",27],["720pstream",27],["1stream",27],["magesy",28],["thefmovies",31],["xhamsterdeutsch",33],["fxporn69",36],["aliancapes",36],["urlcero",39],["totaldebrid",42],["sandrives",42],["oploverz",43],["pouvideo",53],["povvideo",53],["povw1deo",53],["povwideo",53],["powv1deo",53],["powvibeo",53],["powvideo",53],["powvldeo",53],["tubsexer",59],["porno-tour",59],["lenkino",59],["pornomoll",59],["camsclips",59],["m4ufree",64],["dood",64],["crackstreams",64],["telerium",79],["pandafreegames",92],["thoptv",100],["brainly",107],["streameast",124],["thestreameast",124],["daddylivehd",124],["solvetube",129],["hdfilme",130],["pornhub",131],["wcofun",138],["bollyholic",142],["wstream",149],["gotxx",152],["turkanime",158],["voe-unblock",158],["khatrimaza",174],["pogolinks",174],["popcornstream",176],["shortzzy",184],["shineads",184],["privatemoviez",241],["gmx",259],["lightnovelpub",[284,285]],["camcaps",300],["drivebot",325]]);

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
        'Math_random': Math.random,
        'Object_defineProperty': Object.defineProperty.bind(Object),
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
        patternToRegex(pattern, flags = undefined, verbatim = false) {
            if ( pattern === '' ) { return /^/; }
            const match = /^\/(.+)\/([gimsu]*)$/.exec(pattern);
            if ( match === null ) {
                const reStr = pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
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
