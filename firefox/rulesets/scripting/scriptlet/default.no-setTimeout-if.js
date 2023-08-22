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

const argsList = [[".call(null)","10"],[".call(null)"],["userHasAdblocker"],["objSubPromo"],["adb"],["nrWrapper"],["warn"],["adBlockerDetected"],["show"],["adObjects"],["offsetParent"],["InfMediafireMobileFunc","1000"],["google_jobrunner"],["()","45000"],["prompt"],["0x"],["displayAdBlockedVideo"],[".adsbygoogle"],["contrformpub","5000"],["disabledAdBlock","10000"],["_0x"],["ads.length"],["location.href"],["isDesktopApp","1000"],["Bait"],["admc"],["AdBlocker"],["Blocked"],["nextFunction"],["'0x"],["apstagLOADED"],["Adb"],["disableDeveloper"],["Blocco","2000"],["nextFunction","2000"],["documentElement.classList.add","400"],["test","0"],["checkAdblockUser","1000"],["checkPub","6000"],["document.querySelector","5000"],["nextFunction","250"],["popup"],["()","150"],["backRedirect"],["[native code]","500"],["document.querySelectorAll","1000"],["style"],["clientHeight"],["addEventListener","0"],["adblock","2000"],["document.body.classList.add","100"],["start","0"],["byepopup","5000"],["test.remove","100"],["additional_src","300"],["()","2000"],["css_class.show"],["CANG","3000"],["updato-overlay","500"],["innerText","2000"],["modal"],["alert","8000"],["css_class"],["()","50"],["debugger"],["initializeCourier","3000"],["redirectPage"],["_0x","2000"],["ads","750"],["location.href","500"],["Adblock","5000"],["disable","200"],["CekAab","0"],["rbm_block_active","1000"],["show()"],["n.trigger","1"],["instance.check","1"],["adblock"],["abDetected"],["KeepOpeningPops","1000"],["appendChild"],["()","10"],["adb","0"],["adBlocked"],["warning","100"],["adblock_popup","500"],["Adblock"],["#chatWrap","1000"],["keep-ads","2000"],["#rbm_block_active","1000"],["null","4000"],["()","2500"],["myaabpfun","3000"],["adFilled","2500"],["()","15000"],["showPopup"],["()","1"],["()","1000"],["document.cookie","2500"],["window.open"],["innerHTML"],["readyplayer","2000"],["/text()|0x/"],["checkStopBlock"],["adspot_top","1500"],["xclaim"],["an_message","500"],["Adblocker","10000"],["trigger","0"],["timeoutChecker"],["bait","1"],["pum-open"],["overlay","2000"],["AdBanner","2000"],["test","100"],["replace","1500"],["popCanFire"],["Math.round","1000"],["adblock","5"],["bioEp"],["ag_adBlockerDetected"],["null"],["adsbox","1000"],["adb","6000"],["pop"],["sadbl"],["checkAdStatus"],["()","0"],["mdp"],["brave_load_popup"],["0x","3000"],["invoke"],["adsbytrafficjunkycontext"],["ipod"],["offsetWidth"],["/$|adBlock/"],["ads"],["adsbygoogle"],["()"],["AdBlock"],["stop-scrolling"],["Adv"],["blockUI","2000"],["mdpDeBlocker"],["/_0x|debug/"],["[native code]","1"],["/ai_adb|_0x/"],["iframe"],["adBlock"],["","1"],["undefined"],["eval"],["check","1"],["adsBlocked"],["getComputedStyle","250"],["blocker"],["aswift_"],["afs_ads","2000"],["visibility","2000"],["bait"],["blocked"],["{r()","0"],["nextFunction","450"],["Debug"],["r()","0"],["Math.floor"],["offset"],["purple_box"],["offsetHeight"],["checkSiteNormalLoad"],["adBlockOverlay"],["Detected","500"],["height"],[".show","1000"],[".show"],["innerHTML.replace","1000"],["showModal"],["getComputedStyle"],["blur"],["samOverlay"],["bADBlock"],["location"],["","4000"],["alert"],["blocker","100"],["length"],["ai_adb"],["t()","0"],["$"],["offsetLeft"],[".show()","1000"],["mdp_deblocker"],["charAt"],["checkAds"],["fadeIn","0"],["jQuery"],["/^/"],["check"],["Adblocker"],["eabdModal"],["ab_root.show"],["gaData"],["ad"],["prompt","1000"],["googlefc"],["adblock detection"],[".offsetHeight","100"],["popState"],["ad-block-popup"],["exitTimer"],["innerHTML.replace"],["data?","4000"],[".data?"],["eabpDialog"],[".length","2000"],["adsense"],["googletag"],["f.parentNode.removeChild(f)","100"],["swal","500"],["keepChecking","1000"],["openPopup"],[".offsetHeight"],["()","3000"],["class.scroll","1000"],["disableDeveloperTools"],["Check"],["insertBefore"],["atob"],["css_class.scroll"],["/null|Error/","10000"],["window.location.href","50"],["checkblockUser"],["/out.php"],["/0x|devtools/"],["location.replace","300"],["window.location.href"],["checkVisible"],["_0x","3000"],["window.location.href=link"],["ai_"],["reachGoal"],["ai"],["/width|innerHTML/"],["magnificPopup"],["adblockEnabled"],["ads_block"],["google_ad"],["document.location"],["google"],["top-right","2000"],["enforceAdStatus"],["loadScripts"],["Ads"],["mfp"],["display","5000"],["eb"],[").show()"],["","1000"],["devtool"],["Msg"],["UABP"],["","0"],["","250"],["redURL"],["href"],["()=>"],["keepChecking"],["null","10"],["myTypeWriter"],["detected"],["","5"],["","500"],["/Adform|didomi|adblock|forEach/"],["/\\.innerHtml|offsetWidth/"],["showAdblock"],["-0x"],["display"],["gclid"],["rejectWith"],["refresh"],["window.location"],["ga"],["ShowAdBLockerNotice"],["ad_listener"],["open"],["(!0)"],["Delay"],["/appendChild|e\\(\"/"],["ADB"],["site-access-popup"],["data?"],["/debugger|UserCustomPop/"],["checkAdblockUser"],["canRunAds"],["displayMessage","2000"],["salesPopup"],["advanced"],["detectImgLoad"],["offsetHeight","200"],["detector"],["replace"],["siteAccessFlag"],["ab"],["adblocker"],["/children\\('ins'\\)|Adblock|adsbygoogle/"],["displayMessage"],["fetch"],["afterOpen"],["chkADB"],["onDetected"],["myinfoey","1500"],["placebo"],["offsetHeight","100"],["fuckadb"],["detect"],["siteAccessPopup"],["/adsbygoogle|adblock/"],["akadb"],["biteDisplay"],["m(!0)","800"],["ad_block"],["/detectAdBlocker|window.open/"],["hasAdBlock"],["adBlockDetected"],["popUnder"],["/GoToURL|delay/"],["/adblock/i"],["ad blocker"],["=>"]];

const hostnamesMap = new Map([["4-liga.com",0],["4fansites.de",0],["4players.de",0],["9monate.de",0],["aachener-nachrichten.de",0],["aachener-zeitung.de",0],["abendblatt.de",0],["abendzeitung-muenchen.de",0],["about-drinks.com",0],["abseits-ka.de",0],["airliners.de",0],["ajaxshowtime.com",0],["allgemeine-zeitung.de",0],["antenne.de",0],["arcor.de",0],["areadvd.de",0],["areamobile.de",0],["ariva.de",0],["astronews.com",0],["aussenwirtschaftslupe.de",0],["auszeit.bio",0],["auto-motor-und-sport.de",0],["auto-service.de",0],["autobild.de",0],["autoextrem.de",0],["autopixx.de",0],["autorevue.at",0],["az-online.de",0],["baby-vornamen.de",0],["babyclub.de",0],["bafoeg-aktuell.de",0],["berliner-kurier.de",0],["berliner-zeitung.de",0],["bigfm.de",0],["bikerszene.de",0],["bildderfrau.de",0],["blackd.de",0],["blick.de",0],["boerse-online.de",0],["boerse.de",0],["boersennews.de",0],["braunschweiger-zeitung.de",0],["brieffreunde.de",0],["brigitte.de",0],["buerstaedter-zeitung.de",0],["buffed.de",0],["businessinsider.de",0],["buzzfeed.at",0],["buzzfeed.de",0],["caravaning.de",0],["cavallo.de",0],["chefkoch.de",0],["cinema.de",0],["clever-tanken.de",0],["computerbild.de",0],["computerhilfen.de",0],["comunio-cl.com",0],["connect.de",0],["da-imnetz.de",0],["dasgelbeblatt.de",0],["dbna.com",0],["dbna.de",0],["deichstube.de",0],["deine-tierwelt.de",0],["der-betze-brennt.de",0],["derwesten.de",0],["desired.de",0],["dhd24.com",0],["dieblaue24.com",0],["digitalfernsehen.de",0],["dnn.de",0],["donnerwetter.de",0],["e-hausaufgaben.de",0],["e-mountainbike.com",0],["eatsmarter.de",0],["echo-online.de",0],["ecomento.de",0],["einfachschoen.me",0],["elektrobike-online.com",0],["epochtimes.de",0],["essen-und-trinken.de",0],["express.de",0],["extratipp.com",0],["familie.de",0],["fanfiktion.de",0],["fehmarn24.de",0],["fettspielen.de",0],["fid-gesundheitswissen.de",0],["finanznachrichten.de",0],["finanztreff.de",0],["finya.de",0],["firmenwissen.de",0],["fitforfun.de",0],["fnp.de",0],["focus.de",0],["football365.fr",0],["formel1.de",0],["fr.de",0],["frankfurter-wochenblatt.de",0],["freenet.de",0],["fremdwort.de",0],["froheweihnachten.info",0],["frustfrei-lernen.de",0],["fuldaerzeitung.de",0],["funandnews.de",0],["fussballdaten.de",0],["futurezone.de",0],["gala.de",0],["gamepro.de",0],["gamersglobal.de",0],["gamesaktuell.de",0],["gamestar.de",0],["gamezone.de",0],["gartendialog.de",0],["gartenlexikon.de",0],["gedichte.ws",0],["geissblog.koeln",0],["gelnhaeuser-tageblatt.de",0],["general-anzeiger-bonn.de",0],["geniale-tricks.com",0],["genialetricks.de",0],["gesund-vital.de",0],["gesundheit.de",0],["gevestor.de",0],["gewinnspiele.tv",0],["giessener-allgemeine.de",0],["giessener-anzeiger.de",0],["gifhorner-rundschau.de",0],["giga.de",0],["gipfelbuch.ch",0],["gmuender-tagespost.de",0],["golem.de",[0,7,8]],["gruenderlexikon.de",0],["gusto.at",0],["gut-erklaert.de",0],["gutfuerdich.co",0],["hallo-muenchen.de",0],["hamburg.de",0],["hanauer.de",0],["hardwareluxx.de",0],["hartziv.org",0],["harzkurier.de",0],["haus-garten-test.de",0],["hausgarten.net",0],["haustec.de",0],["haz.de",0],["heidelberg24.de",0],["heilpraxisnet.de",0],["heise.de",0],["helmstedter-nachrichten.de",0],["hersfelder-zeitung.de",0],["hftg.co",0],["hifi-forum.de",0],["hna.de",0],["hochheimer-zeitung.de",0],["hoerzu.de",0],["hofheimer-zeitung.de",0],["iban-rechner.de",0],["ikz-online.de",0],["immobilienscout24.de",0],["ingame.de",0],["inside-digital.de",0],["inside-handy.de",0],["investor-verlag.de",0],["jappy.com",0],["jpgames.de",0],["kabeleins.de",0],["kachelmannwetter.com",0],["kamelle.de",0],["kicker.de",0],["kindergeld.org",0],["kino.de",0],["klettern-magazin.de",0],["klettern.de",0],["kochbar.de",0],["kreis-anzeiger.de",0],["kreisbote.de",0],["kreiszeitung.de",0],["ksta.de",0],["kurierverlag.de",0],["lachainemeteo.com",0],["lampertheimer-zeitung.de",0],["landwirt.com",0],["laut.de",0],["lauterbacher-anzeiger.de",0],["leckerschmecker.me",0],["leinetal24.de",0],["lesfoodies.com",0],["levif.be",0],["lifeline.de",0],["liga3-online.de",0],["likemag.com",0],["linux-community.de",0],["linux-magazin.de",0],["ln-online.de",0],["lokalo24.de",0],["lustaufsleben.at",0],["lustich.de",0],["lvz.de",0],["lz.de",0],["macwelt.de",0],["macworld.co.uk",0],["mail.de",0],["main-spitze.de",0],["manager-magazin.de",0],["manga-tube.me",0],["mathebibel.de",0],["mathepower.com",0],["maz-online.de",0],["medisite.fr",0],["mehr-tanken.de",0],["mein-kummerkasten.de",0],["mein-mmo.de",0],["mein-wahres-ich.de",0],["meine-anzeigenzeitung.de",0],["meinestadt.de",0],["menshealth.de",0],["mercato365.com",0],["merkur.de",0],["messen.de",0],["metal-hammer.de",0],["metalflirt.de",0],["meteologix.com",0],["minecraft-serverlist.net",0],["mittelbayerische.de",0],["modhoster.de",0],["moin.de",0],["mopo.de",0],["morgenpost.de",0],["motor-talk.de",0],["motorbasar.de",0],["motorradonline.de",0],["motorsport-total.com",0],["motortests.de",0],["mountainbike-magazin.de",0],["moviejones.de",0],["moviepilot.de",0],["mt.de",0],["mtb-news.de",0],["musiker-board.de",0],["musikexpress.de",0],["musikradar.de",0],["mz-web.de",0],["n-tv.de",0],["naumburger-tageblatt.de",0],["netzwelt.de",0],["neuepresse.de",0],["neueroeffnung.info",0],["news.at",0],["news.de",0],["news38.de",0],["newsbreak24.de",0],["nickles.de",0],["nicknight.de",0],["nl.hardware.info",0],["nn.de",0],["nnn.de",0],["nordbayern.de",0],["notebookchat.com",0],["notebookcheck-ru.com",0],["notebookcheck-tr.com",0],["noz-cdn.de",0],["noz.de",0],["nrz.de",0],["nw.de",0],["nwzonline.de",0],["oberhessische-zeitung.de",0],["oeffentlicher-dienst.info",0],["onlinekosten.de",0],["onvista.de",0],["op-marburg.de",0],["op-online.de",0],["outdoor-magazin.com",0],["outdoorchannel.de",0],["paradisi.de",0],["pc-magazin.de",0],["pcgames.de",0],["pcgameshardware.de",0],["pcwelt.de",0],["pcworld.es",0],["peiner-nachrichten.de",0],["pferde.de",0],["pietsmiet.de",0],["pixelio.de",0],["pkw-forum.de",0],["playboy.de",0],["playfront.de",0],["pnn.de",0],["pons.com",0],["prad.de",[0,140]],["prignitzer.de",0],["profil.at",0],["promipool.de",0],["promobil.de",0],["prosiebenmaxx.de",0],["psychic.de",[0,168]],["quoka.de",0],["radio.at",0],["radio.de",0],["radio.dk",0],["radio.es",0],["radio.fr",0],["radio.it",0],["radio.net",0],["radio.pl",0],["radio.pt",0],["radio.se",0],["ran.de",0],["readmore.de",0],["rechtslupe.de",0],["recording.de",0],["rennrad-news.de",0],["reuters.com",0],["reviersport.de",0],["rhein-main-presse.de",0],["rheinische-anzeigenblaetter.de",0],["rimondo.com",0],["roadbike.de",0],["roemische-zahlen.net",0],["rollingstone.de",0],["rot-blau.com",0],["rp-online.de",0],["rtl.de",[0,267]],["rtv.de",0],["rugby365.fr",0],["ruhr24.de",0],["rundschau-online.de",0],["runnersworld.de",0],["safelist.eu",0],["salzgitter-zeitung.de",0],["sat1.de",0],["sat1gold.de",0],["schwaebische-post.de",0],["schwarzwaelder-bote.de",0],["serienjunkies.de",0],["shz.de",0],["sixx.de",0],["skodacommunity.de",0],["smart-wohnen.net",0],["sn.at",0],["sozialversicherung-kompetent.de",0],["spiegel.de",0],["spielen.de",0],["spieletipps.de",0],["spielfilm.de",0],["sport.de",0],["sport365.fr",0],["sportal.de",0],["spox.com",0],["stern.de",0],["stuttgarter-nachrichten.de",0],["stuttgarter-zeitung.de",0],["sueddeutsche.de",0],["svz.de",0],["szene1.at",0],["szene38.de",0],["t-online.de",0],["tagesspiegel.de",0],["taschenhirn.de",0],["techadvisor.co.uk",0],["techstage.de",0],["tele5.de",0],["the-voice-of-germany.de",0],["thueringen24.de",0],["tichyseinblick.de",0],["tierfreund.co",0],["tiervermittlung.de",0],["torgranate.de",0],["trend.at",0],["tv-media.at",0],["tvdigital.de",0],["tvinfo.de",0],["tvspielfilm.de",0],["tvtoday.de",0],["tz.de",0],["unicum.de",0],["unnuetzes.com",0],["unsere-helden.com",0],["unterhalt.net",0],["usinger-anzeiger.de",0],["usp-forum.de",0],["videogameszone.de",0],["vienna.at",0],["vip.de",0],["virtualnights.com",0],["vox.de",0],["wa.de",0],["wallstreet-online.de",[0,2]],["waz.de",0],["weather.us",0],["webfail.com",0],["weihnachten.me",0],["weihnachts-bilder.org",0],["weihnachts-filme.com",0],["welt.de",0],["weltfussball.at",0],["weristdeinfreund.de",0],["werkzeug-news.de",0],["werra-rundschau.de",0],["wetterauer-zeitung.de",0],["wiesbadener-kurier.de",0],["wiesbadener-tagblatt.de",0],["winboard.org",0],["windows-7-forum.net",0],["winfuture.de",0],["wintotal.de",0],["wlz-online.de",0],["wn.de",0],["wohngeld.org",0],["wolfenbuetteler-zeitung.de",0],["wolfsburger-nachrichten.de",0],["woman.at",0],["womenshealth.de",0],["wormser-zeitung.de",0],["woxikon.de",0],["wp.de",0],["wr.de",0],["yachtrevue.at",0],["ze.tt",0],["zeit.de",0],["meineorte.com",1],["osthessen-news.de",1],["techadvisor.com",1],["economictimes.indiatimes.com",3],["m.timesofindia.com",4],["timesofindia.indiatimes.com",4],["youmath.it",4],["redensarten-index.de",4],["lesoir.be",4],["electriciansforums.net",4],["keralatelecom.info",4],["universegunz.net",4],["happypenguin.altervista.org",4],["everyeye.it",4],["bluedrake42.com",4],["ngontinh24.com",4],["streamservicehd.click",4],["supermarioemulator.com",4],["futbollibrehd.com",4],["newsrade.com",4],["eska.pl",4],["eskarock.pl",4],["voxfm.pl",4],["mathaeser.de",4],["freethesaurus.com",6],["thefreedictionary.com",6],["hdbox.ws",8],["todopolicia.com",8],["scat.gold",8],["freecoursesite.com",8],["windowcleaningforums.co.uk",8],["cruisingearth.com",8],["hobby-machinist.com",8],["freegogpcgames.com",8],["latitude.to",8],["kitchennovel.com",8],["w3layouts.com",8],["blog.receivefreesms.co.uk",8],["eductin.com",8],["dealsfinders.blog",8],["audiobooks4soul.com",8],["tinhocdongthap.com",8],["sakarnewz.com",8],["downloadr.in",8],["topcomicporno.com",8],["dongknows.com",8],["traderepublic.community",8],["celtadigital.com",8],["iptvrun.com",8],["adsup.lk",8],["cryptomonitor.in",8],["areatopik.com",8],["cardscanner.co",8],["nullforums.net",8],["courseclub.me",8],["tamarindoyam.com",8],["choiceofmods.com",8],["myqqjd.com",8],["ssdtop.com",8],["apkhex.com",8],["gezegenforum.com",8],["mbc2.live",8],["forumnulled.com",8],["iptvapps.net",8],["null-scripts.net",8],["nullscripts.net",8],["whncourses.com",8],["bloground.ro",8],["witcherhour.com",8],["ottverse.com",8],["mdn.lol",[8,273]],["torrentmac.net",8],["mazakony.com",8],["laptechinfo.com",8],["mc-at.org",8],["playstationhaber.com",8],["mangapt.com",8],["seriesperu.com",8],["pesprofessionals.com",8],["wpsimplehacks.com",8],["sportshub.to",[8,266]],["topsporter.net",[8,266]],["darkwanderer.net",8],["truckingboards.com",8],["coldfrm.org",8],["azrom.net",8],["freepatternsarea.com",8],["alttyab.net",8],["hq-links.com",8],["mobilkulup.com",8],["esopress.com",8],["rttar.com",8],["nesiaku.my.id",8],["jipinsoft.com",8],["surfsees.com",8],["truthnews.de",8],["farsinama.com",8],["worldofiptv.com",8],["vuinsider.com",8],["crazydl.net",8],["gamemodsbase.com",8],["babiato.tech",8],["secuhex.com",8],["turkishaudiocenter.com",8],["geektime.co.il",9],["bild.de",10],["mediafire.com",11],["wcostream.com",12],["wcoanimedub.tv",12],["wcoforever.net",12],["openspeedtest.com",12],["addtobucketlist.com",12],["3dzip.org",[12,90]],["ilmeteo.it",12],["wcoforever.com",12],["comprovendolibri.it",12],["healthelia.com",12],["keephealth.info",13],["australianfrequentflyer.com.au",14],["afreesms.com",15],["kinoger.re",15],["laksa19.github.io",15],["imgux.buzz",15],["imgewe.buzz",15],["imgxxxx.buzz",15],["imgeza.buzz",15],["imgzzzz.buzz",15],["imgxhfr.buzz",15],["imgqwt.buzz",15],["imgtwq.buzz",15],["imgbjryy.buzz",15],["imgjetr.buzz",15],["imgxelz.buzz",15],["imgytreq.buzz",15],["javcl.com",15],["upvideo.to",15],["tvlogy.to",15],["himovies.to",15],["live.dragaoconnect.net",15],["beststremo.com",15],["seznam.cz",15],["xerifetech.com",15],["wallpapershome.com",17],["ville-ideale.fr",18],["calciomercato.it",19],["calciomercato.com",20],["bersamatekno.com",20],["hotpornfile.org",20],["robloxscripts.com",20],["coolsoft.altervista.org",20],["worldcupfootball.me",[20,25]],["hackedonlinegames.com",20],["jkoding.xyz",20],["settlersonlinemaps.com",20],["1cloudfile.com",20],["magdownload.org",20],["kpkuang.org",20],["shareus.site",20],["crypto4yu.com",20],["faucetwork.space",20],["claimclicks.com",20],["thenightwithoutthedawn.blogspot.com",20],["entutes.com",20],["claimlite.club",20],["bazadecrypto.com",[20,310]],["whosampled.com",21],["imgkings.com",22],["pornvideotop.com",22],["krotkoosporcie.pl",22],["anghami.com",23],["wired.com",24],["tutele.sx",25],["footyhunter3.xyz",25],["magesypro.pro",[26,27]],["tinyppt.com",26],["audiotools.pro",27],["magesy.blog",27],["audioztools.com",[27,28]],["altblogger.net",28],["satoshi-win.xyz",28],["freedeepweb.blogspot.com",28],["freesoft.id",28],["zcteam.id",28],["www-daftarharga.blogspot.com",28],["ear-phone-review.com",28],["telefullenvivo.com",28],["allfoot.info",28],["listatv.pl",28],["encurtandourl.com",[28,154]],["katestube.com",29],["short.pe",29],["footystreams.net",29],["seattletimes.com",30],["yiv.com",31],["pornohans.com",31],["pornoente.tv",[31,80]],["nursexfilme.com",31],["milffabrik.com",[31,80]],["pornohirsch.net",31],["pornozebra.com",[31,80]],["xhamster-sexvideos.com",31],["pornoschlange.com",31],["hdpornos.net",31],["gutesexfilme.com",31],["pornotom.com",[31,80]],["short1.site",31],["zona-leros.com",31],["globalrph.com",32],["e-glossa.it",33],["java-forum.org",34],["comunidadgzone.es",34],["anime-extremo.com",34],["mp3fy.com",34],["lebensmittelpraxis.de",34],["ebookdz.com",34],["forum-pokemon-go.fr",34],["praxis-jugendarbeit.de",34],["gdrivez.xyz",34],["dictionnaire-medical.net",34],["cle0desktop.blogspot.com",34],["up-load.io",34],["direct-link.net",34],["direkt-wissen.com",34],["keysbrasil.blogspot.com",34],["hotpress.info",34],["turkleech.com",34],["anibatch.me",34],["anime-i.com",34],["healthtune.site",34],["gewinde-normen.de",34],["freewebscript.com",35],["webcheats.com.br",36],["gala.fr",38],["gentside.com",38],["geo.fr",38],["hbrfrance.fr",38],["nationalgeographic.fr",38],["ohmymag.com",38],["serengo.net",38],["vsd.fr",38],["updato.com",[39,58]],["methbox.com",40],["daizurin.com",40],["pendekarsubs.us",40],["dreamfancy.org",40],["rysafe.blogspot.com",40],["toppng.com",40],["th-world.com",40],["avjamack.com",40],["avjamak.net",40],["techacode.com",40],["daddyhd.com",42],["embedstream.me",42],["yts-subs.net",42],["cnnamador.com",43],["ksbw.com",44],["nudecelebforum.com",45],["pronpic.org",46],["thewebflash.com",47],["discordfastfood.com",47],["xup.in",47],["popularmechanics.com",48],["op.gg",49],["makeuseof.com",50],["lequipe.fr",51],["jellynote.com",52],["knights-table.net",53],["eporner.com",54],["pornbimbo.com",55],["allmonitors24.com",55],["4j.com",55],["avoiderrors.com",56],["cgtips.org",[56,212]],["sitarchive.com",56],["livenewsof.com",56],["topnewsshow.com",56],["gatcha.org",56],["empregoestagios.com",56],["everydayonsales.com",56],["kusonime.com",56],["aagmaal.xyz",56],["suicidepics.com",56],["codesnail.com",56],["codingshiksha.com",56],["graphicux.com",56],["hardcoregames.ca",56],["asyadrama.com",56],["bitcoinegypt.news",56],["citychilli.com",56],["talkjarvis.com",56],["hdmotori.it",57],["femdomtb.com",59],["camhub.cc",59],["bobs-tube.com",59],["ru-xvideos.me",59],["pornfd.com",59],["popno-tour.net",59],["molll.mobi",59],["watchmdh.to",59],["camwhores.tv",59],["audioz.cc",60],["audioz.es",60],["vectorizer.io",60],["toppnews4.net",60],["smgplaza.com",60],["thapcam.net",60],["elfqrin.com",61],["satcesc.com",62],["apfelpatient.de",62],["lusthero.com",63],["hpav.tv",64],["hpjav.tv",64],["m2list.com",64],["embed.nana2play.com",64],["elahmad.com",64],["dofusports.xyz",64],["pobre.tv",64],["dallasnews.com",65],["lnk.news",66],["lnk.parts",66],["efukt.com",67],["wendycode.com",67],["springfieldspringfield.co.uk",68],["porndoe.com",69],["smsget.net",[70,71]],["kjanime.net",72],["gioialive.it",73],["classicreload.com",74],["chicoer.com",75],["bostonherald.com",75],["dailycamera.com",75],["gomiblog.com",76],["maxcheaters.com",77],["rbxoffers.com",77],["postimees.ee",77],["police.community",77],["gisarea.com",77],["schaken-mods.com",77],["theclashify.com",77],["txori.com",77],["olarila.com",77],["sportsplays.com",78],["deinesexfilme.com",80],["einfachtitten.com",80],["halloporno.com",80],["herzporno.com",80],["lesbenhd.com",80],["porn-monkey.com",80],["porndrake.com",80],["pornhubdeutsch.net",80],["pornoaffe.com",80],["pornodavid.com",80],["pornofisch.com",80],["pornofelix.com",80],["pornohammer.com",80],["pornohelm.com",80],["pornoklinge.com",80],["pornotommy.com",80],["pornovideos-hd.com",80],["xhamsterdeutsch.xyz",80],["xnxx-sexfilme.com",80],["masihbelajar.com",80],["zerion.cc",80],["androidworld.it",81],["letribunaldunet.fr",82],["vladan.fr",82],["live-tv-channels.org",83],["eslfast.com",84],["freegamescasual.com",85],["tcpvpn.com",86],["oko.sh",86],["bookriot.com",86],["timesnownews.com",86],["timesnowhindi.com",86],["timesnowmarathi.com",86],["zoomtventertainment.com",86],["xxxuno.com",87],["sholah.net",88],["2rdroid.com",88],["bisceglielive.it",89],["pandajogosgratis.com.br",91],["5278.cc",92],["tonspion.de",94],["duplichecker.com",95],["plagiarismchecker.co",95],["plagiarismdetector.net",95],["searchenginereports.net",95],["smallseotools.com",95],["giallozafferano.it",96],["autojournal.fr",96],["autoplus.fr",96],["sportauto.fr",96],["linkspaid.com",97],["proxydocker.com",97],["beeimg.com",[98,99]],["emturbovid.com",99],["ftlauderdalebeachcam.com",100],["ftlauderdalewebcam.com",100],["juneauharborwebcam.com",100],["keywestharborwebcam.com",100],["kittycatcam.com",100],["mahobeachcam.com",100],["miamiairportcam.com",100],["morganhillwebcam.com",100],["njwildlifecam.com",100],["nyharborwebcam.com",100],["paradiseislandcam.com",100],["pompanobeachcam.com",100],["portbermudawebcam.com",100],["portcanaveralwebcam.com",100],["portevergladeswebcam.com",100],["portmiamiwebcam.com",100],["portnywebcam.com",100],["portnassauwebcam.com",100],["portstmaartenwebcam.com",100],["porttampawebcam.com",100],["sxmislandcam.com",100],["gearingcommander.com",100],["themes-dl.com",100],["badassdownloader.com",100],["badasshardcore.com",100],["badassoftcore.com",100],["nulljungle.com",100],["teevee.asia",100],["otakukan.com",100],["linksht.com",102],["generate.plus",103],["calculate.plus",103],["avcesar.com",104],["audiotag.info",105],["tudigitale.it",106],["ibcomputing.com",107],["eodev.com",108],["legia.net",109],["acapellas4u.co.uk",110],["streamhentaimovies.com",111],["konten.co.id",112],["diariodenavarra.es",113],["xiaomifans.pl",114],["eletronicabr.com",114],["iphonesoft.fr",115],["gload.cc",116],["optifine.net",117],["luzernerzeitung.ch",118],["tagblatt.ch",118],["spellcheck.net",119],["spellchecker.net",119],["spellweb.com",119],["ableitungsrechner.net",120],["alternet.org",121],["imtranslator.net",122],["shrib.com",123],["pandafiles.com",124],["vidia.tv",[124,147]],["hortonanderfarom.blogspot.com",124],["clarifystraight.com",124],["constraindefiant.net",125],["tutelehd3.xyz",125],["mega4upload.com",125],["coolcast2.com",125],["techclips.net",125],["earthquakecensus.com",125],["footyhunter.lol",125],["gamerarcades.com",125],["poscitech.click",125],["starlive.stream",125],["utopianwilderness.com",125],["wecast.to",125],["sportbar.live",125],["lordchannel.com",125],["play-old-pc-games.com",126],["scrin.org",127],["tunovelaligera.com",128],["tapchipi.com",128],["cuitandokter.com",128],["tech-blogs.com",128],["cardiagn.com",128],["dcleakers.com",128],["esgeeks.com",128],["pugliain.net",128],["uplod.net",128],["worldfreeware.com",128],["fikiri.net",128],["myhackingworld.com",128],["phoenixfansub.com",128],["freecourseweb.com",129],["devcourseweb.com",129],["coursewikia.com",129],["courseboat.com",129],["coursehulu.com",129],["lne.es",133],["pornult.com",134],["webcamsdolls.com",134],["bitcotasks.com",134],["exactpay.online",134],["proplanta.de",135],["hydrogenassociation.org",136],["ludigames.com",136],["made-by.org",136],["xenvn.com",136],["worldtravelling.com",136],["igirls.in",136],["technichero.com",136],["roshiyatech.my.id",136],["1upinfinite.com",136],["24sport.stream",136],["tii.la",136],["yesmangas1.com",136],["aeroxplorer.com",136],["mad4wheels.com",137],["theshedend.com",137],["logi.im",137],["emailnator.com",137],["textograto.com",138],["voyageforum.com",139],["hmc-id.blogspot.com",139],["jemerik.com",139],["myabandonware.com",139],["chatta.it",141],["ketubanjiwa.com",142],["nsfw247.to",143],["funzen.net",143],["notmekani.com",143],["fighter.stream",143],["ilclubdellericette.it",143],["hubstream.in",143],["extremereportbot.com",[144,145]],["getintopc.com",146],["qoshe.com",148],["lowellsun.com",149],["mamadu.pl",149],["dobrapogoda24.pl",149],["motohigh.pl",149],["namasce.pl",149],["ultimate-catch.eu",150],["tabele-kalorii.pl",150],["cpopchanelofficial.com",152],["cryptowidgets.net",[152,269]],["creditcardgenerator.com",153],["creditcardrush.com",153],["bostoncommons.net",153],["thejobsmovie.com",153],["livsavr.co",153],["hl-live.de",154],["ihow.info",154],["filesus.com",154],["sturls.com",154],["re.two.re",154],["forexat.club",154],["turbo1.co",154],["nilopolisonline.com.br",155],["mesquitaonline.com",155],["yellowbridge.com",155],["socialgirls.im",156],["yaoiotaku.com",157],["camhub.world",158],["moneyhouse.ch",159],["chromotypic.com",160],["gamoneinterrupted.com",160],["metagnathtuggers.com",160],["wolfdyslectic.com",160],["rationalityaloelike.com",160],["sizyreelingly.com",160],["simpulumlamerop.com",160],["urochsunloath.com",160],["monorhinouscassaba.com",160],["counterclockwisejacky.com",160],["35volitantplimsoles5.com",160],["scatch176duplicities.com",160],["antecoxalbobbing1010.com",160],["boonlessbestselling244.com",160],["cyamidpulverulence530.com",160],["guidon40hyporadius9.com",160],["449unceremoniousnasoseptal.com",160],["19turanosephantasia.com",160],["30sensualizeexpression.com",160],["321naturelikefurfuroid.com",160],["745mingiestblissfully.com",160],["availedsmallest.com",160],["greaseball6eventual20.com",160],["toxitabellaeatrebates306.com",160],["20demidistance9elongations.com",160],["audaciousdefaulthouse.com",160],["fittingcentermondaysunday.com",160],["fraudclatterflyingcar.com",160],["launchreliantcleaverriver.com",160],["matriculant401merited.com",160],["realfinanceblogcenter.com",160],["reputationsheriffkennethsand.com",160],["telyn610zoanthropy.com",160],["tubelessceliolymph.com",160],["tummulerviolableness.com",160],["un-block-voe.net",160],["v-o-e-unblock.com",160],["voe-un-block.com",160],["voeun-block.net",160],["voeunbl0ck.com",160],["voeunblck.com",160],["voeunblk.com",160],["voeunblock.com",160],["voeunblock1.com",160],["voeunblock2.com",160],["voeunblock3.com",160],["agefi.fr",161],["cariskuy.com",162],["letras2.com",162],["yusepjaelani.blogspot.com",163],["letras.mus.br",164],["soulreaperzone.com",165],["cheatermad.com",166],["mtlurb.com",167],["port.hu",168],["acdriftingpro.com",168],["flight-report.com",168],["forumdz.com",168],["abandonmail.com",168],["beverfood.com",168],["flmods.com",168],["zilinak.sk",168],["temp-phone-number.com",168],["projectfreetv.stream",168],["hotdesimms.com",168],["pdfaid.com",168],["mconverter.eu",168],["dzeko11.net",[168,266]],["mail.com",168],["expresskaszubski.pl",168],["moegirl.org.cn",168],["onemanhua.com",169],["t3n.de",170],["allindiaroundup.com",171],["osuskinner.com",172],["vrcmods.com",172],["thefastlaneforum.com",173],["trade2win.com",174],["gmodleaks.com",174],["fontyukle.net",175],["modagamers.com",176],["nulleb.com",176],["freemagazines.top",176],["reset-scans.com",176],["straatosphere.com",176],["nullpk.com",176],["adslink.pw",176],["downloadudemy.com",176],["techydino.net",176],["picgiraffe.com",176],["weadown.com",176],["freepornsex.net",176],["nurparatodos.com.ar",176],["librospreuniversitariospdf.blogspot.com",177],["forexeen.us",177],["khsm.io",177],["girls-like.me",177],["webcreator-journal.com",177],["nu6i-bg-net.com",177],["routech.ro",178],["hokej.net",178],["turkmmo.com",179],["palermotoday.it",180],["baritoday.it",180],["trentotoday.it",180],["agrigentonotizie.it",180],["anconatoday.it",180],["arezzonotizie.it",180],["avellinotoday.it",180],["bresciatoday.it",180],["brindisireport.it",180],["casertanews.it",180],["cataniatoday.it",180],["cesenatoday.it",180],["chietitoday.it",180],["forlitoday.it",180],["frosinonetoday.it",180],["genovatoday.it",180],["ilpescara.it",180],["ilpiacenza.it",180],["latinatoday.it",180],["lecceprima.it",180],["leccotoday.it",180],["livornotoday.it",180],["messinatoday.it",180],["milanotoday.it",180],["modenatoday.it",180],["monzatoday.it",180],["novaratoday.it",180],["padovaoggi.it",180],["parmatoday.it",180],["perugiatoday.it",180],["pisatoday.it",180],["quicomo.it",180],["ravennatoday.it",180],["reggiotoday.it",180],["riminitoday.it",180],["romatoday.it",180],["salernotoday.it",180],["sondriotoday.it",180],["sportpiacenza.it",180],["ternitoday.it",180],["today.it",180],["torinotoday.it",180],["trevisotoday.it",180],["triesteprima.it",180],["udinetoday.it",180],["veneziatoday.it",180],["vicenzatoday.it",180],["thumpertalk.com",181],["arkcod.org",181],["facciabuco.com",182],["shorterall.com",183],["thelayoff.com",183],["tvepg.eu",183],["blog24.me",183],["softx64.com",184],["pstream.net",185],["instaanime.com",185],["libreriamo.it",186],["medebooks.xyz",186],["share-knowledgee.info",186],["tutorials-technology.info",186],["mashtips.com",186],["marriedgames.com.br",186],["4allprograms.me",186],["nurgsm.com",186],["hunter-xhunter.com",186],["janusnotes.com",186],["certbyte.com",186],["plugincrack.com",186],["gamingdeputy.com",186],["cryptoblog24.info",186],["freewebcart.com",186],["dailymaverick.co.za",187],["apps2app.com",188],["my-code4you.blogspot.com",189],["leakgaming.fr",190],["pentruea.com",[191,192]],["mchacks.net",193],["why-tech.it",194],["hacksmile.com",195],["compsmag.com",195],["tapetus.pl",196],["autoroad.cz",197],["brawlhalla.fr",197],["tecnobillo.com",197],["sexcamfreeporn.com",198],["breatheheavy.com",199],["wenxuecity.com",200],["key-hub.eu",201],["fabioambrosi.it",202],["tamrieltradecentre.com",[202,261]],["tattle.life",203],["emuenzen.de",203],["mynet.com",204],["cidade.iol.pt",205],["fantacalcio.it",206],["hentaifreak.org",207],["hypebeast.com",208],["krankheiten-simulieren.de",209],["catholic.com",210],["3dmodelshare.org",211],["gourmetscans.net",212],["techinferno.com",213],["phuongtrinhhoahoc.com",214],["ibeconomist.com",215],["purposegames.com",216],["schoolcheats.net",216],["globo.com",217],["latimes.com",217],["claimrbx.gg",218],["perelki.net",219],["vpn-anbieter-vergleich-test.de",220],["livingincebuforums.com",221],["paperzonevn.com",222],["malaysianwireless.com",223],["erinsakura.com",224],["infofuge.com",224],["freejav.guru",224],["novelmultiverse.com",224],["fritidsmarkedet.dk",225],["maskinbladet.dk",225],["15min.lt",226],["lewdninja.com",227],["lewd.ninja",227],["hentaidexy.com",227],["baddiehub.com",228],["mr9soft.com",229],["21porno.com",230],["cashearn.cc",231],["adult-sex-gamess.com",232],["hentaigames.app",232],["mobilesexgamesx.com",232],["mysexgamer.com",232],["porngameshd.com",232],["sexgamescc.com",232],["xnxx-sex-videos.com",232],["f2movies.to",233],["freeporncave.com",234],["tubsxxx.com",235],["pornojenny.com",236],["subtitle.one",237],["sextvx.com",238],["studydhaba.com",239],["freecourse.tech",239],["ccthesims.com",239],["victor-mochere.com",239],["papunika.com",239],["mobilanyheter.net",239],["prajwaldesai.com",239],["muztext.com",240],["charbelnemnom.com",241],["online-fix.me",242],["gamersdiscussionhub.com",243],["owlzo.com",244],["maxpixel.net",245],["q1003.com",246],["blogpascher.com",247],["testserver.pro",248],["mgnet.xyz",249],["advertiserandtimes.co.uk",250],["xvideos2020.me",251],["wouterplanet.com",252],["deezer.com",252],["111.90.159.132",253],["techsolveprac.com",254],["joomlabeginner.com",255],["largescaleforums.com",256],["dubznetwork.com",257],["mundodonghua.com",257],["oceanplay.org",258],["code2care.org",259],["osuskins.net",262],["allcryptoz.net",263],["crewbase.net",263],["crewus.net",263],["shinbhu.net",263],["shinchu.net",263],["thumb8.net",263],["thumb9.net",263],["topcryptoz.net",263],["uniqueten.net",263],["ultraten.net",263],["hlspanel.xyz",263],["fapdrop.com",263],["beritabaru.news",264],["solusi.cyou",264],["xxxxsx.com",264],["idevicecentral.com",265],["referus.in",268],["coinscap.info",269],["greenenez.com",269],["insurancegold.in",269],["webfreetools.net",269],["wiki-topia.com",269],["enit.in",270],["financerites.com",270],["mangacrab.com",271],["idnes.cz",272],["viefaucet.com",274],["cloud-computing-central.com",275],["afk.guide",276],["businessnamegenerator.com",277],["rocketnews24.com",278],["soranews24.com",278],["youpouch.com",278],["ilsole24ore.com",279],["hentaiporn.one",280],["infokik.com",281],["fosslinux.com",282],["shrdsk.me",283],["examword.com",284],["sempreupdate.com.br",284],["tribuna.com",285],["trendsderzukunft.de",286],["gal-dem.com",286],["lostineu.eu",286],["oggitreviso.it",286],["speisekarte.de",286],["mixed.de",286],["lightnovelspot.com",[287,328]],["lightnovelworld.com",[287,328]],["novelpub.com",[287,328]],["webnovelpub.com",[287,328]],["mail.yahoo.com",288],["hwzone.co.il",289],["nammakalvi.com",290],["javmoon.me",291],["c2g.at",292],["terafly.me",292],["bravedown.com",293],["aquarius-horoscopes.com",294],["cancer-horoscopes.com",294],["dubipc.blogspot.com",294],["echoes.gr",294],["engel-horoskop.de",294],["freegames44.com",294],["fuerzasarmadas.eu",294],["gemini-horoscopes.com",294],["jurukunci.net",294],["krebs-horoskop.com",294],["leo-horoscopes.com",294],["maliekrani.com",294],["nklinks.click",294],["ourenseando.es",294],["pisces-horoscopes.com",294],["radio-en-direct.fr",294],["sagittarius-horoscopes.com",294],["scorpio-horoscopes.com",294],["singlehoroskop-loewe.de",294],["skat-karten.de",294],["skorpion-horoskop.com",294],["taurus-horoscopes.com",294],["the1security.com",294],["virgo-horoscopes.com",294],["zonamarela.blogspot.com",294],["yoima.hatenadiary.com",294],["vpntester.org",295],["watchhentai.net",296],["japscan.lol",297],["digitask.ru",298],["tempumail.com",299],["sexvideos.host",300],["10alert.com",301],["cryptstream.de",302],["nydus.org",302],["techhelpbd.com",303],["cellmapper.net",304],["hdrez.com",305],["youwatch-serie.com",305],["freebnbcoin.com",306],["vgembed.com",307],["printablecreative.com",308],["comohoy.com",309],["leak.sx",309],["pornleaks.in",309],["merlininkazani.com",309],["faindx.com",311],["converter-btc.world",312],["j91.asia",313],["jeniusplay.com",314],["indianyug.com",315],["rgb.vn",315],["needrom.com",316],["criptologico.com",317],["megadrive-emulator.com",318],["hentai-one.com",319],["hentaipaw.com",319],["10minuteemails.com",320],["luxusmail.org",320],["w3cub.com",321],["dgb.lol",322],["bangpremier.com",323],["nyaa.iss.ink",324],["news.bg",326],["topsport.bg",326],["scripai.com",326],["security-demo.extrahop.com",327]]);

const entitiesMap = new Map([["comunio",0],["finanzen",[0,5]],["gameswelt",0],["heftig",0],["notebookcheck",0],["testedich",0],["transfermarkt",0],["truckscout24",0],["tvtv",0],["wetter",0],["wetteronline",0],["wieistmeineip",0],["1337x",4],["eztv",4],["sushi-scan",8],["spigotunlocked",8],["ahmedmode",8],["kissasian",13],["rp5",15],["mma-core",16],["writedroid",20],["yts",25],["720pstream",25],["1stream",25],["magesy",26],["thefmovies",29],["xhamsterdeutsch",31],["fxporn69",34],["aliancapes",34],["urlcero",37],["totaldebrid",40],["sandrives",40],["oploverz",41],["pouvideo",53],["povvideo",53],["povw1deo",53],["povwideo",53],["powv1deo",53],["powvibeo",53],["powvideo",53],["powvldeo",53],["tubsexer",59],["porno-tour",59],["lenkino",59],["pornomoll",59],["camsclips",59],["m4ufree",64],["dood",64],["crackstreams",64],["telerium",79],["pandafreegames",93],["thoptv",101],["brainly",108],["streameast",125],["thestreameast",125],["daddylivehd",125],["solvetube",130],["hdfilme",131],["pornhub",132],["wcofun",139],["bollyholic",143],["wstream",151],["gotxx",154],["turkanime",160],["voe-unblock",160],["khatrimaza",176],["pogolinks",176],["popcornstream",178],["shortzzy",186],["shineads",186],["privatemoviez",243],["gmx",260],["lightnovelpub",[287,328]],["drivebot",325]]);

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
