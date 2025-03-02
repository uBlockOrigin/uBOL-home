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

// ruleset: default

// Important!
// Isolate from global scope

// Start of local scope
(( ) => {

/******************************************************************************/

// Start of code to inject
const uBOL_abortOnPropertyRead = function() {

const scriptletGlobals = {}; // eslint-disable-line

const argsList = [["Notification"],["embedAddefend"],["navigator.userAgent"],["__eiPb"],["detector"],["SmartAdServerASMI"],["_sp_._networkListenerData"],["AntiAd.check"],["_pop"],["_sp_.mms.startMsg"],["retrievalService"],["admrlWpJsonP"],["InstallTrigger"],["LieDetector"],["newcontent"],["ExoLoader.serve"],["mm"],["stop"],["open"],["ga.length"],["btoa"],["console.clear"],["jwplayer.utils.Timer"],["adblock_added"],["exoNoExternalUI38djdkjDDJsio96"],["AaDetector"],["SBMGlobal.run.pcCallback"],["SBMGlobal.run.gramCallback"],["Date.prototype.toUTCString"],["Adcash"],["PopAds"],["runAdblock"],["showAds"],["ExoLoader"],["loadTool"],["popns"],["adBlockDetected"],["doSecondPop"],["RunAds"],["jQuery.adblock"],["ads_block"],["blockAdBlock"],["decodeURI"],["exoOpts"],["doOpen"],["prPuShown"],["document.dispatchEvent"],["document.createElement"],["pbjs.libLoaded"],["mz"],["_abb"],["Math.floor"],["jQuery.hello"],["isShowingAd"],["oms.ads_detect"],["hasAdBlock"],["ALoader"],["NREUM"],["ads.pop_url"],["tabUnder"],["ExoLoader.addZone"],["raConf"],["popTimes"],["smrtSB"],["smrtSP"],["Aloader"],["advobj"],["addElementToBody"],["phantomPopunders"],["CustomEvent"],["exoJsPop101"],["popjs.init"],["rmVideoPlay"],["r3H4"],["AdservingModule"],["require"],["__Y"],["__ads"],["document.createEvent"],["__NA"],["PerformanceLongTaskTiming"],["proxyLocation"],["Int32Array"],["popMagic.init"],["jwplayer.vast"],["adblock"],["dataPopUnder"],["SmartWallSDK"],["Abd_Detector"],["paywallWrapper"],["registerSlideshowAd"],["getUrlParameter"],["_sp_"],["goafricaSplashScreenAd"],["_0xbeb9"],["popAdsClickCount"],["_wm"],["popunderSetup"],["jsPopunder"],["S9tt"],["adSSetup"],["document.cookie"],["capapubli"],["Aloader.serve"],["__htapop"],["app_vars.force_disable_adblock"],["_0x32d5"],["glxopen"],["CatapultTools"],["adbackDebug"],["googletag"],["$pxy822"],["performance"],["htaUrl"],["BetterJsPop"],["setExoCookie"],["encodeURIComponent"],["ReviveBannerInterstitial"],["Debugger"],["FuckAdBlock"],["isAdEnabled"],["promo"],["_0x311a"],["console.log"],["h1mm.w3"],["checkAdblock"],["NativeAd"],["adblockblock"],["popit"],["rid"],["decodeURIComponent"],["popad"],["XMLHttpRequest"],["localStorage"],["my_pop"],["nombre_dominio"],["String.fromCharCode"],["redirectURL"],["TID"],["adsanity_ad_block_vars"],["pace"],["TRM"],["pa"],["td_ad_background_click_link"],["onload"],["checkAds"],["popjs"],["detector_launch"],["Popunder"],["gPartners"],["Date.prototype.toGMTString"],["initPu"],["jsUnda"],["adtoniq"],["myFunction_ads"],["popunder"],["Pub2a"],["alert"],["V4ss"],["popunders"],["aclib"],["sc_adv_out"],["pageParams.dispAds"],["document.bridCanRunAds"],["pu"],["MessageChannel"],["advads_passive_ads"],["pmc_admanager.show_interrupt_ads"],["$REACTBASE_STATE.serverModules.push"],["scriptwz_url"],["setNptTechAdblockerCookie"],["loadRunative"],["pwparams"],["fuckAdBlock"],["detectAdBlock"],["adsBlocked"],["Base64"],["parcelRequire"],["EviPopunder"],["preadvercb"],["$ADP"],["MG2Loader"],["Connext"],["mdp_deblocker"],["adUnits"],["b2a"],["angular"],["downloadJSAtOnload"],["penci_adlbock"],["Number.isNaN"],["doads"],["adblockDetector"],["adblockDetect"],["initAdserver"],["splashpage.init"],["___tp"],["STREAM_CONFIGS"],["mdpDeBlocker"],["googlefc"],["ppload"],["RegAdBlocking"],["checkABlockP"],["ExoDetector"],["Pub2"],["adver.abFucker.serve"],["adthrive"],["show_ads_gr8_lite"],["disableButtonTimer"],["tie"],["document.write"],["adb_checker"],["ignore_adblock"],["$.prototype.offset"],["ea.add"],["adcashMacros"],["_cpp"],["pareAdblock"],["clickCount"],["popUp"],["xmlhttp"],["document.oncontextmenu"],["shortcut"],["Swal.fire"],["bypass_url"],["document.onmousedown"],["antiAdBlockerHandler"],["SMart1"],["window.open"],["checkAdsBlocked"],["navigator.brave"],["Light.Popup"],["htmls"],["HTMLIFrameElement"],["dsanity_ad_block_vars"],["chp_adblock_browser"],["adsbyjuicy"],["videootv"],["detectAdBlocker"],["Drupal.behaviors.agBlockAdBlock"],["NoAdBlock"],["mMCheckAgainBlock"],["__tnt"],["noAdBlockers"],["GetWindowHeight"],["show_ads"],["google_ad_status"],["u_cfg"],["adthrive.config"],["TotemToolsObject"],["noAdBlock"],["advads_passive_groups"],["GLX_GLOBAL_UUID_RESULT"],["document.head.appendChild"],["canRunAds"],["indexedDB.open"],["checkCookieClick"],["wpsite_clickable_data"],["mnpwclone"],["SluttyPops"],["sites_urls_pops"],["rccbase_styles"],["adBlockerDetected"],["zfgformats"],["zfgstorage"],["adp"],["popundrCheck"],["history.replaceState"],["rexxx.swp"],["ai_run_scripts"],["bizpanda"],["Q433"],["isAdBlockActive"],["Element.prototype.attachShadow"],["document.body.appendChild"],["SPHMoverlay"],["disableDeveloperTools"],["google_jobrunner"],["popupBlocker"],["DoodPop"],["SmartPopunder.make"],["evolokParams.adblock"],["JSON.parse"],["document.referrer"],["cainPopUp"],["pURL"],["inhumanity_pop_var_name"],["app_vars.please_disable_adblock"],["afScript"],["history.back"],["String.prototype.charCodeAt"],["Overlayer"],["puShown"],["remove_adblock_html"],["Request"],["fallbackAds"],["checkAdsStatus"],["lck"],["advanced_ads_ready"],["PvVideoSlider"],["preroll_helper.advs"],["loadXMLDoc"],["arrvast"],["Script_Manager"],["Script_Manager_Time"],["document.body.insertAdjacentHTML"],["tic"],["pu_url"],["onAdblockerDetected"],["checkBlock"],["adsbygoogle.loaded"],["asgPopScript"],["Object"],["document.body.innerHTML"],["Object.prototype.loadCosplay"],["Object.prototype.loadImages"],["FMPoopS"],["importantFunc"],["console.warn"],["adsRedirectPopups"],["JuicyPop"],["afStorage"],["_run"],["eazy_ad_unblocker"],["jQuery.popunder"],["killAdKiller"],["aoAdBlockDetected"],["ai_wait_for_jquery"],["checkAdBlock"],["VAST"],["eazy_ad_unblocker_dialog_opener"],["adConfig"],["onscroll"],["GeneratorAds"],["__cmpGdprAppliesGlobally"],["aab"],["config"],["runad"],["atob"],["__brn_private_mode"],["__aaZoneid"],["adc"],["document.body.style.backgroundPosition"],["showada"],["popUrl"],["Promise.all"],["block_ads"],["popurl"],["EV.Dab"],["Object.prototype.popupOpened"],["pum_popups"],["document.documentElement.clientWidth"],["Dataffcecd"],["app_advert"],["odabd"],["_oEa"],["dataLayer"],["WebAssembly"],["miner"],["Keen"],["MONETIZER101.init"],["JadIds"]];

const hostnamesMap = new Map([["tagesspiegel.de",0],["vivud.com",[0,13,42,56]],["gtaall.com",0],["worldsex.com",[0,46]],["jizzbunker.com",[0,132]],["dailymail.co.uk",0],["n-tv.de",1],["aranzulla.it",2],["anallievent.com",3],["au-di-tions.com",3],["badgehungry.com",3],["beingmelody.com",3],["bloggingawaydebt.com",3],["casutalaurei.ro",3],["cornerstoneconfessions.com",3],["culture-informatique.net",3],["dearcreatives.com",3],["disneyfashionista.com",3],["divinelifestyle.com",3],["dna.fr",3],["eslauthority.com",3],["estrepublicain.fr",3],["fitting-it-all-in.com",3],["heresyoursavings.com",3],["irresistiblepets.net",3],["julieseatsandtreats.com",3],["justjared.com",3],["lecturisiarome.ro",3],["lemonsqueezyhome.com",3],["libramemoria.com",3],["lovegrowswild.com",3],["magicseaweed.com",3],["measuringflower.com",3],["mjsbigblog.com",3],["mommybunch.com",3],["mustardseedmoney.com",3],["myfunkytravel.com",3],["onetimethrough.com",3],["panlasangpinoymeatrecipes.com",3],["silverpetticoatreview.com",3],["the-military-guide.com",3],["therelaxedhomeschool.com",3],["the2seasons.com",3],["zeroto60times.com",3],["barefeetonthedashboard.com",3],["bargainbriana.com",3],["betterbuttchallenge.com",3],["bike-urious.com",3],["blwideas.com",3],["eartheclipse.com",3],["entertainment-focus.com",3],["fanatik.com.tr",3],["foreverconscious.com",3],["foreversparkly.com",3],["getdatgadget.com",3],["goodnewsnetwork.org",3],["greenarrowtv.com",3],["hbculifestyle.com",3],["heysigmund.com",3],["hodgepodgehippie.com",3],["homestratosphere.com",3],["indesignskills.com",3],["katiescucina.com",3],["knowyourphrase.com",3],["letsworkremotely.com",3],["lizs-early-learning-spot.com",3],["ledauphine.com",3],["leprogres.fr",3],["milliyet.com.tr",3],["pinoyrecipe.net",3],["prepared-housewives.com",3],["recipesforourdailybread.com",3],["redcarpet-fashionawards.com",3],["republicain-lorrain.fr",3],["savespendsplurge.com",3],["savingadvice.com",3],["shutupandgo.travel",3],["spring.org.uk",3],["stevivor.com",3],["tamaratattles.com",3],["tastefullyeclectic.com",3],["theavtimes.com",3],["thechroniclesofhome.com",3],["thisisourbliss.com",3],["tinyqualityhomes.org",3],["turtleboysports.com",3],["ultimateninjablazingx.com",3],["universfreebox.com",3],["utahsweetsavings.com",3],["vgamerz.com",3],["wheatbellyblog.com",3],["yummytummyaarthi.com",3],["ranker.com",[3,110]],["fluentu.com",3],["cdiscount.com",3],["damndelicious.net",3],["simplywhisked.com",3],["timesofindia.com",4],["bild.de",5],["sueddeutsche.de",6],["20min.ch",6],["al.com",6],["alphr.com",6],["autoexpress.co.uk",6],["bikeradar.com",6],["blick.ch",6],["chefkoch.de",6],["cyclingnews.com",[6,359]],["digitalspy.com",6],["democratandchronicle.com",6],["denofgeek.com",6],["esgentside.com",6],["evo.co.uk",6],["exclusivomen.com",6],["ft.com",6],["gala.de",6],["gala.fr",6],["heatworld.com",6],["itpro.co.uk",6],["livingathome.de",6],["masslive.com",6],["maxisciences.com",6],["metabomb.net",6],["mlive.com",6],["motherandbaby.co.uk",6],["motorcyclenews.com",6],["muthead.com",6],["neonmag.fr",6],["newyorkupstate.com",6],["ngin-mobility.com",6],["nj.com",6],["nola.com",6],["ohmirevista.com",6],["oregonlive.com",6],["pennlive.com",6],["programme.tv",6],["programme-tv.net",6],["radiotimes.com",6],["silive.com",6],["simplyvoyage.com",6],["stern.de",6],["syracuse.com",6],["theweek.co.uk",6],["ydr.com",6],["usatoday.com",6],["schoener-wohnen.de",6],["thewestmorlandgazette.co.uk",6],["news-leader.com",6],["closeronline.co.uk",6],["etonline.com",6],["bilan.ch",6],["doodle.com",6],["techradar.com",6],["daily-times.com",6],["wirralglobe.co.uk",6],["annabelle.ch",6],["pcgamer.com",6],["nintendolife.com",6],["gamer.com.tw",7],["skidrowcodexgames.com",8],["22pixx.xyz",[8,60,74]],["durtypass.com",8],["anime-odcinki.pl",8],["gaypornwave.com",[8,33]],["pngit.live",[8,18,25,72]],["gratispaste.com",[8,74]],["animotvslashz.blogspot.com",8],["eltern.de",9],["essen-und-trinken.de",9],["focus.de",9],["eurogamer.de",9],["eurogamer.es",9],["eurogamer.it",9],["eurogamer.net",9],["eurogamer.pt",9],["rockpapershotgun.com",9],["vg247.com",9],["urbia.de",9],["elpasotimes.com",9],["femina.ch",9],["northwalespioneer.co.uk",9],["codeproject.com",10],["cwseed.com",11],["pocketnow.com",12],["7r6.com",[13,21,105]],["reddflix.com",[13,18]],["bostoncommons.net",13],["opisanie-kartin.com",13],["painting-planet.com",13],["kropic.com",[13,42]],["mp4mania1.net",13],["livegore.com",13],["down-paradise.com",[13,76]],["kioven.com",13],["pngio.com",13],["iobit.com",13],["rule34.xxx",14],["realbooru.com",15],["alrincon.com",[15,18,34]],["realgfporn.com",[15,33]],["pornhd.com",[15,55]],["pornhdin.com",[15,18]],["pornomovies.com",[15,42]],["bdsmstreak.com",15],["freepornvideo.sex",15],["teenpornvideo.xxx",15],["yourlust.com",15],["imx.to",15],["mypornstarbook.net",15],["japanesefuck.com",15],["imgtorrnt.in",[15,46]],["pandamovies.pw",[15,46]],["club-flank.com",15],["streamporn.pw",15],["watchfreexxx.net",[15,33,150,151,152]],["dump.xxx",[15,18]],["fuqer.com",[15,18]],["tmohentai.com",15],["xopenload.me",15],["losporn.org",15],["bravoerotica.com",15],["xasiat.com",[15,70]],["redporno.cz",15],["vintageporntubes.com",15],["xxxvideos247.com",15],["young-pussy.com",15],["kingsofteens.com",15],["24pornvideos.com",15],["2japaneseporn.com",15],["xxxvideor.com",15],["youngleak.com",15],["zhlednito.cz",15],["8teenxxx.com",15],["activevoyeur.com",15],["allschoolboysecrets.com",15],["boobsforfun.com",15],["breedingmoms.com",15],["cockmeter.com",[15,46]],["collegeteentube.com",15],["cumshotlist.com",15],["porn0.tv",15],["ritzysex.com",15],["ritzyporn.com",15],["sexato.com",15],["javbobo.com",[15,24]],["sokobj.com",15],["youlikeboys.com",[15,74]],["needgayporn.com",15],["zetporn.com",15],["keephealth.info",16],["123moviesjr.cc",16],["123moviesd.com",16],["123moviess.se",16],["cloudvideo.tv",16],["googlvideo.com",16],["easyexploits.com",16],["azm.to",16],["anigogo.net",[16,76]],["kinoking.cc",16],["lvturbo.com",16],["sbbrisk.com",[16,76]],["sbchill.com",[16,76]],["sbrity.com",[16,76]],["viewsb.com",[16,76]],["watchdoctorwhoonline.com",16],["toxicwap.us",16],["yodbox.com",16],["coverapi.store",16],["masahub.net",[16,42]],["hblinks.pro",16],["afdah2.com",16],["kissasia.cc",16],["watchsexandthecity.com",16],["ymovies.vip",16],["cl1ca.com",16],["4br.me",16],["fir3.net",16],["grubstreet.com",17],["twitchy.com",17],["rule34hentai.net",18],["clik.pw",18],["pornj.com",18],["pornl.com",18],["ah-me.com",18],["1337x.unblock2.xyz",[18,20,51]],["mitly.us",[18,36]],["linkrex.net",18],["oke.io",18],["watchmygf.me",18],["pornoreino.com",[18,33]],["shrt10.com",18],["ashemaletube.com",18],["turbobit.net",18],["bestialitysexanimals.com",18],["bestialporn.com",18],["mujeresdesnudas.club",18],["mynakedwife.video",18],["videoszoofiliahd.com",18],["efukt.com",18],["tranny.one",[18,24]],["porndoe.com",[18,33]],["topvideosgay.com",18],["goto.com.np",18],["femdomtb.com",18],["pornvideotop.com",18],["deinesexfilme.com",18],["einfachtitten.com",18],["halloporno.com",18],["herzporno.com",18],["lesbenhd.com",18],["milffabrik.com",18],["porn-monkey.com",18],["porndrake.com",18],["pornhubdeutsch.net",18],["pornoaffe.com",18],["pornodavid.com",18],["pornoente.tv",18],["pornofisch.com",18],["pornofelix.com",18],["pornohammer.com",18],["pornohelm.com",18],["pornoklinge.com",18],["pornotom.com",18],["pornotommy.com",18],["pornovideos-hd.com",18],["pornozebra.com",18],["xhamsterdeutsch.xyz",18],["xnxx-sexfilme.com",18],["tryboobs.com",[18,24]],["hitomi.la",18],["fapality.com",[18,46]],["babesxworld.com",[18,34,46]],["icutlink.com",18],["oncehelp.com",18],["picbaron.com",[18,34]],["mega-p2p.net",18],["shrinkearn.com",18],["twister.porn",18],["bitlk.com",18],["gamovideo.com",18],["urlty.com",18],["peekvids.com",18],["playvids.com",18],["pornflip.com",18],["pornoeggs.com",18],["oko.sh",[18,25]],["turbogvideos.com",18],["xxx-image.com",[18,28,132,175]],["coinlyhub.com",[18,105]],["vidbom.com",18],["zimabdko.com",18],["fullxxxmovies.net",18],["elitegoltv.org",18],["extremotvplay.com",18],["tarjetarojatv.org",18],["pirlotvonline.org",18],["rojadirectaonlinetv.com",18],["semawur.com",18],["adshrink.it",18],["shrink-service.it",[18,356]],["eplsite.uk",[18,25]],["upstream.to",18],["dramakrsubindo.blogspot.com",18],["ex-foary.com",[18,105]],["oceanof-games.com",18],["watchmonkonline.com",18],["iir.ai",[18,105]],["comicxxx.eu",18],["mybestxtube.com",[18,46]],["pornobengala.com",18],["pornicom.com",[18,46]],["xecce.com",18],["teensporn.tv",[18,46]],["pornlift.com",18],["superbgays.com",18],["porncomics.me",18],["orsm.net",18],["enagato.com",18],["cloutgist.com",18],["youshort.me",18],["shortylink.store",18],["kvador.com",[18,34]],["uploadroot.com",18],["deepfakeporn.net",18],["pkr.pw",[18,105]],["loader.to",18],["namaidani.com",[18,105]],["anime47.com",18],["cutearn.net",[18,105]],["filezipa.com",[18,105]],["theblissempire.com",[18,105]],["bestgamehack.top",18],["hackofgame.com",18],["shorturl.unityassets4free.com",[18,105]],["vevioz.com",[18,105]],["charexempire.com",[18,286]],["crunchyscan.fr",18],["unblocksite.pw",[18,132]],["y2mate.com",18],["androidapks.biz",18],["androidsite.net",18],["animeonlinefree.org",18],["animesite.net",18],["computercrack.com",18],["crackedsoftware.biz",18],["crackfree.org",18],["cracksite.info",18],["downloadapk.info",18],["downloadapps.info",18],["downloadgames.info",18],["downloadmusic.info",18],["downloadsite.org",18],["ebooksite.org",18],["emulatorsite.com",18],["fmovies24.com",18],["freeflix.info",18],["freemoviesu4.com",18],["freesoccer.net",18],["fseries.org",18],["gamefast.org",18],["gamesite.info",18],["gostreamon.net",18],["hindisite.net",18],["isosite.org",18],["macsite.info",18],["mangasite.org",18],["megamovies.org",18],["moviefree2.com",18],["moviesite.app",18],["moviesx.org",18],["musicsite.biz",18],["patchsite.net",18],["pdfsite.net",18],["play1002.com",18],["productkeysite.com",18],["romsite.org",18],["seriesite.net",18],["siteapk.net",18],["siteflix.org",18],["sitegames.net",18],["sitekeys.net",18],["sitepdf.com",18],["sitetorrent.com",18],["softwaresite.net",18],["superapk.org",18],["supermovies.org",18],["tvonlinesports.com",18],["ultramovies.org",18],["warezsite.net",18],["watchmovies2.com",18],["watchmoviesforfree.org",18],["watchsite.net",18],["youapk.net",18],["gload.to",18],["bloggingguidance.com",18],["jockantv.com",18],["moviehaxx.pro",18],["receive-sms-online.info",19],["pornult.com",[20,70]],["fullhdxxx.com",[20,33]],["lendrive.web.id",20],["nimegami.id",20],["short.pe",[21,25]],["mylust.com",[21,46]],["anysex.com",[21,33,42,46,115]],["luscious.net",21],["cloudgallery.net",[21,25]],["alotporn.com",[21,46]],["imgair.net",21],["imgblaze.net",21],["imgfrost.net",21],["vestimage.site",21],["imgyer.store",21],["pixqbngg.shop",21],["pixqwet.shop",21],["pixmos.shop",21],["imgtgd.shop",21],["imgcsxx.shop",21],["imgqklw.shop",21],["pixqkhgrt.shop",21],["imgcssd.shop",21],["imguwjsd.sbs",21],["pictbbf.shop",21],["pixbryexa.sbs",21],["picbqqa.sbs",21],["pixbkghxa.sbs",21],["imgmgf.sbs",21],["picbcxvxa.sbs",21],["imguee.sbs",21],["imgmffmv.sbs",21],["imgbqb.sbs",21],["imgbyrev.sbs",21],["imgbncvnv.sbs",21],["pixtryab.shop",21],["imggune.shop",21],["pictryhab.shop",21],["pixbnab.shop",21],["imgbnwe.shop",21],["imgbbnhi.shop",21],["imgnbii.shop",21],["imghqqbg.shop",21],["imgyhq.shop",21],["pixnbrqwg.sbs",21],["pixnbrqw.sbs",21],["picmsh.sbs",21],["imgpke.sbs",21],["picuenr.sbs",21],["imgolemn.sbs",21],["imgoebn.sbs",21],["picnwqez.sbs",21],["imgjajhe.sbs",21],["pixjnwe.sbs",21],["pixkfjtrkf.shop",21],["pixkfkf.shop",21],["pixdfdjkkr.shop",21],["pixdfdj.shop",21],["picnft.shop",21],["pixrqqz.shop",21],["picngt.shop",21],["picjgfjet.shop",21],["picjbet.shop",21],["imgkkabm.shop",21],["imgxabm.shop",21],["imgthbm.shop",21],["imgmyqbm.shop",21],["imgwwqbm.shop",21],["imgjvmbbm.shop",21],["imgjbxzjv.shop",21],["imgjmgfgm.shop",21],["picxnkjkhdf.sbs",21],["imgxxbdf.sbs",21],["imgnngr.sbs",21],["imgjjtr.sbs",21],["imgqbbds.sbs",21],["imgbvdf.sbs",21],["imgqnnnebrf.sbs",21],["imgnnnvbrf.sbs",21],["pornfd.com",21],["xsanime.com",21],["camclips.tv",21],["ninjashare.to",21],["javideo.pw",[22,76]],["ujav.me",[22,76]],["shameless.com",[22,24,60]],["informer.com",23],["myreadingmanga.info",24],["sunporno.com",[24,60]],["adultdvdparadise.com",24],["freeomovie.info",24],["fullxxxmovies.me",24],["mangoporn.co",24],["netflixporno.net",24],["pandamovies.me",24],["pornkino.cc",24],["pornwatch.ws",24],["watchfreexxx.pw",24],["watchxxxfree.pw",24],["xopenload.pw",24],["xtapes.me",24],["xxxparodyhd.net",24],["xxxscenes.net",24],["xxxstream.me",24],["youwatchporn.com",24],["8boobs.com",[24,34,60]],["babesinporn.com",[24,34,46,60]],["bustybloom.com",[24,34]],["hotstunners.com",[24,34,60]],["nudebabes.sexy",[24,60]],["pleasuregirl.net",[24,34,60]],["rabbitsfun.com",[24,34,60]],["nudismteens.com",24],["youx.xxx",24],["asiansex.life",24],["pornxp.com",[24,25]],["hypnohub.net",24],["oldies.name",24],["xnxxporn.video",24],["xxxdessert.com",24],["xxxshake.com",24],["manhwa18.cc",24],["best18porn.com",24],["bigtitslust.com",[24,270]],["manga18fx.com",24],["sexywomeninlingerie.com",24],["oosex.net",[24,46]],["theteensexy.com",24],["xteensex.net",24],["stiflersmoms.com",24],["gifhq.com",24],["amateur-couples.com",24],["teen-hd-sex.com",24],["tube-teen-18.com",24],["xxx-asian-tube.com",24],["met.bz",25],["hindimean.com",25],["senmanga.com",25],["ebookdz.com",25],["cda-hd.cc",25],["kurazone.net",25],["turkdown.com",25],["urlgalleries.net",25],["movie4u.live",25],["solarmovie.id",25],["01fmovies.com",25],["babesaround.com",25],["dirtyyoungbitches.com",25],["grabpussy.com",25],["join2babes.com",25],["nightdreambabe.com",25],["novoglam.com",25],["novohot.com",25],["novojoy.com",25],["novoporn.com",25],["novostrong.com",25],["pbabes.com",25],["pussystate.com",25],["redpornblog.com",25],["rossoporn.com",25],["sexynakeds.com",25],["thousandbabes.com",25],["gulf-up.com",25],["vidia.tv",25],["cutpaid.com",[25,105]],["javporn.best",[25,107]],["mixloads.com",25],["ancensored.com",25],["savevideo.tube",25],["files.cx",25],["drivefire.co",25],["porngo.com",25],["arenabg.com",25],["vidload.net",25],["animealtadefinizione.it",25],["lkc21.net",25],["mavanimes.co",25],["onnime.net",25],["noxx.to",25],["loadsamusicsarchives.blogspot.com",25],["xxxfiles.com",25],["deseneledublate.com",25],["hentaicloud.com",[25,248]],["descarga.xyz",25],["familyporn.tv",25],["pornxp.org",25],["rawmanga.top",25],["javside.com",[25,76]],["aniwave.to",25],["gayteam.club",25],["mangaraw.org",25],["flixtormovies.co",25],["watchthat70show.net",25],["supertelevisionhd.com",25],["whitemouseapple.com",25],["autoembed.cc",25],["whisperingauroras.com",25],["live-sport.duktek.pro",25],["bibme.org",26],["citationmachine.net",[26,27]],["citethisforme.com",27],["easybib.com",27],["1plus1plus1equals1.net",28],["cooksinfo.com",28],["heatherdisarro.com",28],["thesassyslowcooker.com",28],["mp4upload.com",29],["cricstream.me",29],["watchadsontape.com",29],["livesport24.net",29],["m2list.com",29],["pepperlivestream.online",29],["streambucket.net",29],["megacanais.com",29],["dmovies.top",[29,160]],["sanet.lc",29],["antenasport.online",29],["apkship.shop",29],["browncrossing.net",29],["dudestream.com",29],["elgolestv.pro",29],["embedstreams.me",29],["engstreams.shop",29],["eyespeeled.click",29],["flostreams.xyz",29],["ilovetoplay.xyz",29],["joyousplay.xyz",29],["nativesurge.info",29],["pawastreams.org",29],["ripplestream4u.shop",29],["rojadirectaenvivo.pl",29],["sansat.link",29],["smartermuver.com",29],["sportsnest.co",29],["sportsurge.net",29],["sportzlive.shop",29],["tarjetarojaenvivo.lat",29],["techcabal.net",29],["volokit2.com",29],["worldstreamz.shop",29],["ythd.org",29],["kaas.ro",[29,160]],["rivestream.live",29],["flix-wave.lol",29],["redvido.com",29],["adbypass.org",29],["bypass.city",29],["dailypudding.com",[29,160]],["fromwatch.com",[29,160]],["visualnewshub.com",[29,160]],["sarugbymag.co.za",32],["ikaza.net",32],["imgadult.com",[33,34]],["imgdrive.net",[33,34]],["imgtaxi.com",[33,34]],["imgwallet.com",[33,34]],["hdpornt.com",33],["4tube.com",33],["pornerbros.com",[33,46]],["pichaloca.com",33],["pornodoido.com",33],["pornwatchers.com",[33,46]],["gotporn.com",33],["picturelol.com",33],["imgspice.com",33],["orgyxxxhub.com",[33,65,66]],["befap.com",33],["alphaporno.com",33],["tubedupe.com",33],["sexykittenporn.com",[33,34]],["letmejerk.com",33],["letmejerk2.com",33],["letmejerk3.com",33],["letmejerk4.com",33],["letmejerk5.com",33],["letmejerk6.com",33],["letmejerk7.com",33],["hdtube.porn",33],["madchensex.com",33],["canalporno.com",33],["dreamamateurs.com",33],["eroxia.com",33],["pornozot.com",33],["camgirlbang.com",33],["casting-porno-tube.com",33],["teensexvideos.me",33],["goshow.tv",33],["hentaigo.com",[34,73]],["lolhentai.net",34],["porntopic.com",34],["cocogals.com",[34,46]],["camwhoreshd.com",34],["hotbabes.tv",[34,96]],["consoletarget.com",34],["pussytorrents.org",34],["ftopx.com",[34,60,70]],["boobgirlz.com",34],["fooxybabes.com",34],["jennylist.xyz",34],["jumboporn.xyz",34],["mainbabes.com",[34,60]],["mysexybabes.com",[34,60]],["nakedbabes.club",[34,60]],["sexybabesz.com",[34,60]],["vibraporn.com",34],["zazzybabes.com",34],["zehnporn.com",34],["naughtymachinima.com",34],["imgbaron.com",34],["decorativemodels.com",34],["erowall.com",[34,46]],["freyalist.com",34],["guruofporn.com",34],["jesseporn.xyz",34],["kendralist.com",34],["vipergirls.to",34],["lizardporn.com",34],["wantedbabes.com",[34,46]],["exgirlfriendmarket.com",34],["nakedneighbour.com",34],["moozpussy.com",34],["zoompussy.com",34],["2adultflashgames.com",34],["123strippoker.com",34],["babepedia.com",34],["boobieblog.com",34],["borwap.xxx",34],["chicpussy.net",34],["gamesofdesire.com",34],["hd-xxx.me",34],["hentaipins.com",[34,265]],["longporn.xyz",34],["picmoney.org",34],["pornhd720p.com",34],["sikwap.xyz",34],["super-games.cz",34],["xxx-videos.org",34],["xxxputas.net",34],["mysexgames.com",34],["sexgames.xxx",34],["picdollar.com",34],["pornstargold.com",34],["eroticity.net",34],["striptube.net",34],["xcity.org",34],["porncoven.com",34],["imgstar.eu",34],["pics4upload.com",34],["ahegaoporn.net",34],["myporntape.com",34],["asianlbfm.net",34],["schoolgirls-asia.org",34],["luxuretv.com",35],["otomi-games.com",35],["redhdtube.xxx",35],["rat.xxx",35],["hispasexy.org",[35,215]],["javplay.me",35],["watchimpracticaljokers.com",35],["zerion.cc",35],["javcock.com",35],["leviathanmanga.com",35],["gayfor.us",35],["juegosgratisonline.com.ar",35],["levelupalone.com",35],["x-x-x.tube",35],["javboys.com",35],["javball.com",35],["adictox.com",35],["feed2all.org",35],["platinmods.com",36],["fotbolltransfers.com",36],["freebitcoin.win",36],["coindice.win",36],["live-tv-channels.org",36],["faucethero.com",[36,42]],["faresgame.com",36],["fc.lc",[36,105]],["freebcc.org",[36,105]],["eio.io",[36,105]],["exee.io",[36,105]],["exe.app",[36,105]],["multifaucet.org",36],["majalahpendidikan.com",36],["jaiefra.com",36],["czxxx.org",36],["sh0rt.cc",36],["fussball.news",36],["orangespotlight.com",36],["ar-atech.blogspot.com",36],["clixwarez.blogspot.com",36],["theandroidpro.com",36],["zeeebatch.blogspot.com",36],["layarkaca21indo.com",36],["iptvspor.com",36],["plugincim.com",36],["fivemturk.com",36],["sosyalbilgiler.net",36],["mega-hentai2.blogspot.com",36],["gun-otaku.blogspot.com",36],["tech5s.co",36],["ez4mods.com",36],["kollhong.com",36],["getmega.net",36],["verteleseriesonline.com",36],["imintweb.com",36],["eoreuni.com",36],["comousarzararadio.blogspot.com",36],["popsplit.us",36],["digitalstudiome.com",36],["nightfallnews.com",36],["mypussydischarge.com",[36,42]],["kontrolkalemi.com",36],["arabianbusiness.com",36],["eskiceviri.blogspot.com",36],["dj-figo.com",36],["blasianluvforever.com",36],["wgzimmer.ch",36],["familyrenders.com",36],["daburosubs.com",36],["androidgreek.com",36],["iade.com",36],["smallpocketlibrary.com",36],["hidefninja.com",36],["orangeptc.com",36],["share1223.com",36],["7misr4day.com",36],["aquiyahorajuegos.net",36],["worldofbin.com",36],["googledrivelinks.com",36],["98zero.com",36],["tpaste.io",36],["g9g.eu",36],["netu.ac",37],["vidscdns.com",37],["onscreens.me",[37,114,310]],["video.q34r.org",[37,114]],["filmoviplex.com",[37,114]],["movie4night.com",[37,114]],["srt.am",38],["ticonsiglio.com",39],["photos-public-domain.com",41],["civilenggforall.com",41],["sheshaft.com",42],["gotgayporn.com",42],["fetishshrine.com",42],["sleazyneasy.com",42],["vikiporn.com",42],["pornomico.com",[42,67]],["watchhouseonline.net",42],["pornoman.pl",[42,122]],["camseek.tv",42],["xxmovz.com",42],["nonktube.com",42],["pussyspot.net",42],["wildpictures.net",42],["nudogram.com",42],["18girlssex.com",42],["modagamers.com",42],["batporno.com",42],["lebahmovie.com",42],["duit.cc",42],["classicpornbest.com",[42,133]],["desihoes.com",[42,46]],["indianpornvideo.org",42],["porn18sex.com",42],["slaughtergays.com",42],["sexiestpicture.com",42],["line25.com",42],["javtiful.com",42],["manytoon.com",42],["thatav.net",42],["hentaifreak.org",42],["xxgasm.com",42],["kfapfakes.com",42],["xsober.com",42],["sexsaoy.com",42],["ashemaletv.com",42],["beurettekeh.com",42],["celibook.com",42],["gourmandix.com",42],["sexetag.com",42],["hd44.net",42],["dirtyfox.net",42],["babestube.com",42],["momvids.com",42],["porndr.com",42],["deviants.com",42],["freehardcore.com",42],["lesbian8.com",[42,270]],["eztv-torrent.net",42],["spicyandventures.com",42],["watchmdh.to",42],["sarapbabe.com",42],["rule34porn.net",42],["fullxxxporn.net",42],["qqxnxx.com",42],["xnxx-downloader.net",42],["comicspornow.com",42],["mult34.com",42],["xxxvideotube.net",42],["javqis.com",42],["onlyhotleaks.com",42],["35volitantplimsoles5.com",42],["amateurblog.tv",42],["fashionblog.tv",42],["latinblog.tv",42],["silverblog.tv",42],["tokyoblog.tv",42],["xblog.tv",42],["peladas69.com",42],["liveru.sx",42],["protege-torrent.com",42],["freehdinterracialporn.in",42],["titsintops.com",42],["pervclips.com",42],["homemoviestube.com",42],["hdporn.net",[43,44]],["older-mature.net",44],["driveup.sbs",44],["telorku.xyz",44],["watch-my-gf.com",45],["watchmyexgf.net",45],["cartoonporno.xxx",45],["mangoporn.net",46],["area51.porn",46],["sexytrunk.com",46],["teensark.com",46],["tubous.com",[46,83]],["toyoheadquarters.com",46],["spycock.com",46],["barfuck.com",46],["multporn.net",46],["besthugecocks.com",46],["daftporn.com",46],["italianoxxx.com",46],["collegehdsex.com",46],["lustylist.com",46],["yumstories.com",46],["18-teen-porn.com",46],["69teentube.com",46],["girlshd.xxx",46],["home-xxx-videos.com",46],["orgasmlist.com",46],["teensextube.xxx",46],["pornyfap.com",46],["nudistube.com",46],["uporno.xxx",46],["ultrateenporn.com",46],["gosexpod.com",46],["al4a.com",46],["grannysex.name",46],["porntb.com",46],["scopateitaliane.it",46],["sexbox.online",46],["teenpornvideo.sex",46],["twatis.com",[46,60]],["flashingjungle.com",46],["fetishburg.com",46],["privateindianmovies.com",46],["soyoungteens.com",46],["gottanut.com",46],["uiporn.com",46],["xcafe.com",46],["gfsvideos.com",46],["home-made-videos.com",46],["tbib.org",46],["sensualgirls.org",46],["ariestube.com",46],["asian-teen-sex.com",46],["18asiantube.com",46],["wholevideos.com",46],["asianporntube69.com",46],["babeswp.com",46],["bangyourwife.com",46],["bdsmslavemovie.com",46],["bdsmwaytube.com",46],["bestmaturewomen.com",46],["classicpornvids.com",46],["pornpaw.com",46],["dawntube.com",46],["desimmshd.com",46],["dirtytubemix.com",46],["plumperstube.com",46],["enormousbabes.net",46],["exclusiveindianporn.com",46],["figtube.com",46],["amateur-twink.com",46],["freeboytwinks.com",46],["freegrannyvids.com",46],["freexmovs.com",46],["freshbbw.com",46],["frostytube.com",46],["fuckhottwink.com",46],["fuckslutsonline.com",46],["gameofporn.com",46],["gayboyshd.com",46],["getitinside.com",[46,103]],["giantshemalecocks.com",46],["erofus.com",46],["hd-tube-porn.com",46],["hardcorehd.xxx",46],["hairytwat.org",46],["iwantmature.com",46],["justababes.com",46],["juicyflaps.com",46],["jenpornuj.cz",46],["javteentube.com",46],["hard-tube-porn.com",46],["klaustube.com",46],["kaboomtube.com",46],["lustyspot.com",46],["lushdiaries.com",46],["lovelynudez.com",[46,128]],["dailyangels.com",46],["ljcam.net",46],["myfreemoms.com",46],["nakenprat.com",46],["oldgrannylovers.com",46],["ohueli.net",46],["pornuploaded.net",46],["pornstarsadvice.com",46],["bobs-tube.com",46],["pornohaha.com",46],["pornmam.com",46],["pornhegemon.com",46],["pornabcd.com",46],["porn-hd-tube.com",46],["thehentaiworld.com",46],["pantyhosepink.com",46],["queenofmature.com",46],["realvoyeursex.com",46],["realbbwsex.com",46],["rawindianporn.com",46],["onlygoldmovies.com",46],["rainytube.com",46],["stileproject.com",46],["slutdump.com",46],["nastybulb.com",46],["sextube-6.com",46],["porntubegf.com",46],["sassytube.com",46],["smplace.com",46],["maturell.com",46],["nudemilfwomen.com",46],["pornoplum.com",46],["widewifes.com",46],["wowpornlist.xyz",46],["vulgarmilf.com",46],["oldgirlsporn.com",46],["freepornrocks.com",46],["get-to.link",[46,70]],["beegsexxx.com",46],["watchpornx.com",[46,152]],["ytboob.com",46],["saradahentai.com",46],["hentaiarena.com",46],["absolugirl.com",46],["absolutube.com",46],["allafricangirls.net",46],["asianpornphoto.net",46],["freexxxvideos.pro",46],["videosxxxporno.gratis",46],["nude-teen-18.com",46],["xemales.com",46],["szexkepek.net",46],["wife-home-videos.com",46],["sexmadeathome.com",46],["nylondolls.com",46],["milforia.com",46],["teensfuck.me",46],["erogen.su",46],["imgprime.com",47],["ondemandkorea.com",48],["bdsmx.tube",49],["mrgay.com",49],["pornxs.com",50],["dailygeekshow.com",52],["rue89lyon.fr",53],["onlinemschool.com",54],["bigtitsxxxsex.com",56],["zmovs.com",56],["ceesty.com",57],["corneey.com",57],["destyy.com",57],["festyy.com",57],["gestyy.com",57],["lavozdigital.es",57],["tnaflix.com",58],["angelgals.com",60],["babesexy.com",60],["hotbabeswanted.com",60],["nakedgirlsroom.com",60],["sexybabes.club",60],["sexybabesart.com",60],["favefreeporn.com",60],["onlygayvideo.com",60],["peachytube.com",60],["stepsisterfuck.me",60],["pornhost.com",61],["locopelis.com",[62,63,64]],["repelis.net",62],["perfectmomsporn.com",65],["donkparty.com",68],["streamdreams.org",70],["bdsmporn.cc",70],["cocoporn.net",70],["dirtyporn.cc",70],["faperplace.com",70],["freeadultvideos.cc",70],["freepornstream.cc",70],["generalpornmovies.com",70],["kinkyporn.cc",70],["moviesxxx.cc",70],["movstube.net",70],["onlinefetishporn.cc",70],["peetube.cc",70],["pornonline.cc",70],["porntube18.cc",70],["streamextreme.cc",70],["streamporn.cc",70],["videoxxx.cc",70],["watchporn.cc",70],["x24.video",70],["xxx24.vip",70],["xxxonline.cc",70],["xxxonlinefree.com",70],["xxxopenload.com",70],["gonzoporn.cc",70],["onlinexxx.cc",70],["tvporn.cc",70],["allporncomic.com",70],["thepiratebay.org",70],["videosection.com",70],["pornky.com",70],["tubxporn.com",70],["imgcredit.xyz",70],["desixxxtube.org",70],["freeindianporn2.com",70],["kashtanka2.com",70],["kompoz2.com",70],["pakistaniporn2.com",70],["mangahere.onl",[74,171]],["worldfreeware.com",75],["ellibrepensador.com",75],["rexdlfile.com",75],["sfastwish.com",76],["films5k.com",76],["juicywest.com",76],["fakyutube.com",76],["mm9842.com",76],["mm9846.com",76],["javmvp.com",76],["watch-jav-english.live",76],["0gogle.com",76],["videobot.stream",76],["vidohd.com",76],["kitabmarkaz.xyz",76],["javplaya.com",76],["japopav.tv",76],["streamm4u.club",76],["fembed-hd.com",76],["nekolink.site",76],["suzihaza.com",76],["mycloudzz.com",76],["javpoll.com",76],["javleaked.com",76],["pornhole.club",76],["jvembed.com",76],["megafilmeshdonline.org",76],["jav247.top",76],["nashstream.top",76],["mavavid.com",76],["diampokusy.com",76],["vidmedia.top",76],["moviepl.xyz",76],["superplayxyz.club",76],["viplayer.cc",76],["nsfwzone.xyz",76],["embed-media.com",76],["zojav.com",76],["javenglish.me",76],["pornhubed.com",76],["playerjavseen.com",76],["javsubbed.xyz",76],["xsub.cc",76],["fembed9hd.com",76],["onscreensvideo.com",76],["gaymovies.top",76],["guccihide.com",76],["streamhide.to",76],["vidhidevip.com",76],["cloudrls.com",76],["embedwish.com",76],["fc2stream.tv",76],["javhahaha.us",76],["javlion.xyz",76],["javibe.net",76],["jvideo.xyz",76],["kissmovies.net",76],["nudecelebforum.com",77],["pronpic.org",78],["chyoa.com",79],["thisisfutbol.com",80],["pcwelt.de",81],["sixsistersstuff.com",82],["insidemarketing.it",85],["worldaide.fr",85],["asmwall.com",85],["vermangasporno.com",86],["celebjihad.com",86],["dirtyship.com",86],["celebmasta.com",86],["fullporner.com",[86,330]],["lejdd.fr",87],["gamekult.com",87],["bharian.com.my",87],["thememypc.net",88],["cityam.com",89],["inhabitat.com",90],["speedtest.net",92],["livingstondaily.com",92],["goafricaonline.com",93],["link.tl",94],["lnk.news",95],["lnk.parts",95],["candid.tube",96],["purelyceleb.com",96],["piraproxy.app",96],["nosteamgames.ro",96],["zootube1.com",97],["xxxtubezoo.com",97],["zooredtube.com",97],["videos1002.com",98],["sab.bz",98],["javseen.tv",98],["autobild.de",100],["alimaniac.com",101],["1xxx-tube.com",103],["asssex-hd.com",103],["bigcockfreetube.com",103],["bigdickwishes.com",103],["enjoyfuck.com",103],["freemomstube.com",103],["fuckmonstercock.com",103],["gobigtitsporn.com",103],["gofetishsex.com",103],["hard-tubesex.com",103],["hd-analporn.com",103],["hiddencamstube.com",103],["kissmaturestube.com",103],["lesbianfantasyxxx.com",103],["modporntube.com",103],["pornexpanse.com",103],["pornokeep.com",103],["pussytubeebony.com",103],["tubesex.me",103],["vintagesexpass.com",103],["voyeur-pornvideos.com",103],["voyeurspyporn.com",103],["voyeurxxxfree.com",103],["xxxtubenote.com",103],["yummysextubes.com",103],["nakedarab-tube.com",103],["xxxtubepass.com",103],["yestubemature.com",103],["yourhomemadetube.com",103],["yourtranny-sex.com",103],["tubexxxone.com",103],["airsextube.com",103],["asianbabestube.com",103],["bigtitsxxxfree.com",103],["blowjobpornset.com",103],["entertubeporn.com",103],["finexxxvideos.com",103],["freesexvideos24.com",103],["fuckhairygirls.com",103],["gopornindian.com",103],["grandmatube.pro",103],["grannyfucko.com",103],["grannyfuckxxx.com",103],["hiddencamhd.com",103],["hindiporno.pro",103],["indianbestporn.com",103],["japanesemomsex.com",103],["japanxxxass.com",103],["massagefreetube.com",103],["maturepussies.pro",103],["megajapansex.com",103],["new-xxxvideos.com",103],["xxxblowjob.pro",103],["xxxtubegain.com",103],["xxxvideostrue.com",103],["acutetube.net",103],["agedtubeporn.com",103],["agedvideos.com",103],["onlinegrannyporn.com",103],["freebigboobsporn.com",103],["tubeinterracial-porn.com",103],["best-xxxvideos.com",103],["bestanime-xxx.com",103],["blowxxxtube.com",103],["callfuck.com",103],["teenhubxxx.com",103],["tubepornasian.com",103],["xxxtubedot.com",103],["blowjobfucks.com",103],["dirtyasiantube.com",103],["maturewomenfucks.com",103],["pornmaturetube.com",103],["setfucktube.com",103],["tourporno.com",103],["do-xxx.com",103],["dotfreesex.com",103],["dotfreexxx.com",103],["easymilftube.net",103],["electsex.com",103],["fineretroporn.com",103],["freehqtube.com",103],["freshmaturespussy.com",103],["freshsexxvideos.com",103],["fuckedporno.com",103],["gallant-matures.com",103],["hqhardcoreporno.com",103],["girlssexxxx.com",103],["glamourxxx-online.com",103],["vintagepornnew.com",103],["tubevintageporn.com",103],["goxxxvideos.com",103],["grouppornotube.com",103],["hqxxxmovies.com",103],["hqsex-xxx.com",103],["hqamateurtubes.com",103],["hotpussyhubs.com",103],["hdpornteen.com",103],["indecentvideos.com",103],["ifreefuck.com",103],["kittyfuckstube.com",103],["lightxxxtube.com",103],["momstube-porn.com",103],["modelsxxxtube.com",103],["milfpussy-sex.com",103],["nicexxxtube.com",103],["neatpornodot.com",103],["neatfreeporn.com",103],["bigtitsporn-tube.com",103],["tubehqxxx.com",103],["nakedbbw-sex.com",103],["onlineteenhub.com",103],["online-xxxmovies.com",103],["pussyhothub.com",103],["pornxxxplace.com",103],["pornoteensex.com",103],["pornonote.pro",103],["pornoaid.com",103],["pornclipshub.com",103],["whitexxxtube.com",103],["sweetadult-tube.com",103],["sweet-maturewomen.com",103],["sexyoungclips.com",103],["sexymilfsearch.com",103],["sextubedot.com",103],["hqmaxporn.com",103],["sexlargetube.com",103],["sexhardtubes.com",103],["tubepornstock.com",103],["xfuckonline.com",103],["sheamateur.com",104],["cuts-url.com",105],["exe.io",[105,177]],["adsafelink.com",105],["modebaca.com",105],["cutdl.xyz",105],["shurt.pw",[105,262]],["smoner.com",105],["droplink.co",105],["ez4short.com",105],["try2link.com",[105,218]],["jameeltips.us",105],["blog.linksfire.co",105],["recipestutorials.com",105],["shrinkforearn.in",105],["qthang.net",105],["linksly.co",105],["curto.win",105],["imagenesderopaparaperros.com",105],["shortenbuddy.com",105],["apksvip.com",105],["4cash.me",105],["teknomuda.com",105],["savelink.site",105],["samaa-pro.com",105],["miklpro.com",105],["modapk.link",105],["ccurl.net",105],["linkpoi.me",105],["pewgame.com",105],["crazyblog.in",105],["gtlink.co",105],["rshrt.com",105],["dz-linkk.com",105],["adurly.cc",105],["link.asiaon.top",105],["download.sharenulled.net",105],["beingtek.com",105],["adlinkweb.com",105],["swzz.xyz",105],["cutp.in",105],["gsm-solution.com",106],["gomo.to",107],["dlapk4all.com",107],["popmatters.com",108],["planetf1.com",108],["austin.culturemap.com",108],["northern-scot.co.uk",108],["icy-veins.com",109],["bidouillesikea.com",109],["girlsgogames.co.uk",110],["godtube.com",110],["ringsidenews.com",110],["advocate.com",110],["alternet.org",110],["androidcure.com",110],["arobasenet.com",110],["attackofthefanboy.com",110],["bodytr.com",110],["clutchpoints.com",110],["cultofmac.com",110],["currentaffairs.gktoday.in",110],["dailycaller.com",110],["digitalmusicnews.com",110],["dogtime.com",110],["dotesports.com",110],["epicstream.com",110],["fallbrook247.com",110],["feral-heart.com",110],["gamesgames.com",110],["gamerevolution.com",110],["gazettenet.com",110],["insidenova.com",110],["jetztspielen.de",110],["kasvekuvvet.net",110],["leitesculinaria.com",110],["nbcnews.com",110],["notevibes.com",110],["practicalpainmanagement.com",110],["prad.de",110],["progameguides.com",110],["pwinsider.com",110],["realityblurb.com",[110,232]],["ruinmyweek.com",110],["sanangelolive.com",110],["sanfoundry.com",110],["selfhacked.com",110],["siliconera.com",110],["simpleflying.com",110],["son.co.za",110],["sporcle.com",110],["stealthoptional.com",110],["thesportster.com",110],["upi.com",110],["viraliq.com",110],["visualcapitalist.com",110],["wegotthiscovered.com",110],["primagames.com",110],["truetrophies.com",111],["alcasthq.com",112],["mzee.com",112],["supforums.com",113],["player.xxxbestsites.com",114],["player.tabooporns.com",114],["wiztube.xyz",114],["megatube.xxx",114],["hot-cartoon.com",114],["richhioon.eu",114],["wowstream.top",114],["xxvideoss.net",114],["player.subespanolvip.com",114],["vidcdn.co",[114,301]],["justswallows.net",114],["wilifilm.net",114],["rpdrlatino.live",114],["pbtube.co",114],["streaming-french.net",114],["koreanbj.club",114],["monstream.org",114],["player.hdgay.net",114],["cdngee.com",114],["fshd3.club",114],["hd-streaming.net",114],["streaming-french.org",114],["telenovelas-turcas.com.es",114],["gocurrycracker.com",116],["xcums.com",116],["ihub.live",116],["naturalbd.com",116],["freeuseporn.com",116],["salamanca24horas.com",117],["bollywoodshaadis.com",118],["ngelag.com",119],["huim.com",120],["cambay.tv",123],["caminspector.net",123],["camwhorespy.com",123],["camwhoria.com",123],["camgoddess.tv",123],["zemporn.com",124],["wpgdadatong.com",125],["wikifeet.com",126],["root-top.com",127],["allmomsex.com",128],["allnewindianporn.com",128],["analxxxvideo.com",128],["animalextremesex.com",128],["anime3d.xyz",128],["animefuckmovies.com",128],["animepornfilm.com",128],["animesexbar.com",128],["animesexclip.com",128],["animexxxsex.com",128],["animexxxfilms.com",128],["anysex.club",128],["apetube.asia",128],["asianfuckmovies.com",128],["asianfucktube.com",128],["asianporn.sexy",128],["asiansexcilps.com",128],["beeg.fund",128],["beegvideoz.com",128],["bestasiansex.pro",128],["bravotube.asia",128],["brutalanimalsfuck.com",128],["candyteenporn.com",128],["daddyfuckmovies.com",128],["desifuckonline.com",128],["exclusiveasianporn.com",128],["exteenporn.com",128],["fantasticporn.net",128],["fantasticyoungporn.com",128],["fineasiansex.com",128],["firstasianpussy.com",128],["freeindiansextube.com",128],["freepornasians.com",128],["freerealvideo.com",128],["fuck-beeg.com",128],["fuck-xnxx.com",128],["fuckasian.pro",128],["fuckfuq.com",128],["fuckundies.com",128],["gojapaneseporn.com",128],["golderotica.com",128],["goodyoungsex.com",128],["goyoungporn.com",128],["hardxxxmoms.com",128],["hdvintagetube.com",128],["hentaiporn.me",128],["hentaisexfilms.com",128],["hentaisexuality.com",128],["hot-teens-movies.mobi",128],["hotanimepornvideos.com",128],["hotanimevideos.com",128],["hotasianpussysex.com",128],["hotjapaneseshows.com",128],["hotmaturetube.com",128],["hotmilfs.pro",128],["hotorientalporn.com",128],["hotpornyoung.com",128],["hotxxxjapanese.com",128],["hotxxxpussy.com",128],["indiafree.net",128],["indianpornvideo.online",128],["japanpornclip.com",128],["japanesetube.video",128],["japansex.me",128],["japanesexxxporn.com",128],["japansporno.com",128],["japanxxx.asia",128],["japanxxxworld.com",128],["keezmovies.surf",128],["lingeriefuckvideo.com",128],["liveanimalporn.zooo.club",128],["madhentaitube.com",128],["megahentaitube.com",128],["megajapanesesex.com",128],["megajapantube.com",128],["milfxxxpussy.com",128],["momsextube.pro",128],["momxxxass.com",128],["monkeyanimalporn.com",128],["moviexxx.mobi",128],["newanimeporn.com",128],["newjapanesexxx.com",128],["nicematureporn.com",128],["nudeplayboygirls.com",128],["openxxxporn.com",128],["originalindianporn.com",128],["originalteentube.com",128],["pig-fuck.com",128],["plainasianporn.com",128],["popularasianxxx.com",128],["pornanimetube.com",128],["pornasians.pro",128],["pornhat.asia",128],["pornjapanesesex.com",128],["pornomovies.asia",128],["pornvintage.tv",128],["primeanimesex.com",128],["realjapansex.com",128],["realmomsex.com",128],["redsexhub.com",128],["retroporn.world",128],["retrosexfilms.com",128],["sex-free-movies.com",128],["sexanimesex.com",128],["sexanimetube.com",128],["sexjapantube.com",128],["sexmomvideos.com",128],["sexteenxxxtube.com",128],["sexxxanimal.com",128],["sexyoungtube.com",128],["sexyvintageporn.com",128],["sopornmovies.com",128],["spicyvintageporn.com",128],["sunporno.club",128],["tabooanime.club",128],["teenextrem.com",128],["teenfucksex.com",128],["teenhost.net",128],["teensexass.com",128],["tnaflix.asia",128],["totalfuckmovies.com",128],["totalmaturefuck.com",128],["txxx.asia",128],["voyeurpornsex.com",128],["warmteensex.com",128],["wetasiancreampie.com",128],["wildhentaitube.com",128],["wowyoungsex.com",128],["xhamster-art.com",128],["xmovie.pro",128],["xnudevideos.com",128],["xnxxjapon.com",128],["xpics.me",128],["xvide.me",128],["xxxanimefuck.com",128],["xxxanimevideos.com",128],["xxxanimemovies.com",128],["xxxhentaimovies.com",128],["xxxhothub.com",128],["xxxjapaneseporntube.com",128],["xxxlargeporn.com",128],["xxxmomz.com",128],["xxxpornmilf.com",128],["xxxpussyclips.com",128],["xxxpussysextube.com",128],["xxxretrofuck.com",128],["xxxsex.pro",128],["xxxsexyjapanese.com",128],["xxxteenyporn.com",128],["xxxvideo.asia",128],["xxxvideos.ink",128],["xxxyoungtv.com",128],["youjizzz.club",128],["youngpussyfuck.com",128],["dvdporngay.com",130],["software-on.com",130],["kpopjjang.com",[130,176]],["siteunblocked.info",[130,243]],["unblocked.name",[130,243]],["uproxy2.biz",[130,243]],["za.gl",131],["activistpost.com",[132,136]],["ladepeche.fr",133],["jemontremonminou.com",133],["jemontremasextape.com",133],["jemontremabite.com",133],["bitzite.com",[133,175]],["kinoger.ru",134],["moviesapi.club",134],["clasicotas.org",135],["saveshared.com",136],["simpledownload.net",136],["compucalitv.com",137],["blademaster666.com",138],["hot2k.com",138],["luchoedu.org",138],["lupaste.com",138],["pornovenezolano.com.ve",138],["romnation.net",138],["venezporn.com",138],["hubzter.com",139],["collater.al",139],["nzpocketguide.com",139],["volksstimme.de",141],["phonenumber-lookup.info",142],["maniac.de",143],["cambro.tv",144],["filerio.in",144],["call2friends.com",144],["gigaho.com",144],["trendsderzukunft.de",144],["forum.lolesporte.com",144],["mytoolz.net",144],["haoweichi.com",144],["tcheats.com",145],["tobys.dk",145],["sembunyi.in",146],["anime-jl.net",147],["fuckdy.com",148],["bdsmporntub.com",148],["femdomporntubes.com",148],["spellchecker.net",149],["nackte.com",152],["highporn.net",152],["thegatewaypundit.com",153],["your-daily-girl.com",153],["720pxmovies.blogspot.com",154],["penis-bilder.com",155],["boyfriendtv.com",155],["dansmovies.com",155],["shegotass.info",155],["phimmoiaz.cc",155],["mvidoo.com",155],["imgdawgknuttz.com",156],["m4maths.com",157],["poki-gdn.com",157],["sctoon.net",157],["megapornfreehd.com",158],["tonpornodujour.com",159],["absentescape.net",160],["forgepattern.net",160],["vidlink.pro",160],["nflscoop.xyz",160],["bezpolitickekorektnosti.cz",161],["protopage.com",162],["topito.com",163],["livesport.ws",165],["citynow.it",166],["variety.com",167],["cuatro.com",168],["mitele.es",168],["telecinco.es",168],["serieslandia.com",169],["softwaredescargas.com",169],["morritastube.xxx",[169,259]],["rawstory.com",170],["post-gazette.com",170],["bilasport.net",172],["yogitimes.com",173],["juba-get.com",174],["percentagecalculator.guru",174],["claim.8bit.ca",[175,230]],["lightnovelpdf.com",175],["ta2deem7arbya.com",175],["adsy.pw",175],["playstore.pw",175],["bootyexpo.net",175],["arbweb.info",175],["solarchaine.com",175],["tokenmix.pro",175],["terafly.me",175],["addtobucketlist.com",175],["alternativa104.net",175],["asumesi.com",175],["ayo24.id",175],["barrier-free.net",175],["berich8.com",175],["bloooog.it",175],["branditechture.agency",175],["chataigpt.org",175],["coinsrev.com",175],["eliobenedetto.it",175],["iamflorianschulze.com",175],["kyoto-kanko.net",175],["limontorrents.com",175],["livenewsof.com",175],["medeberiya1.com",175],["medeberiyax.com",175],["oyundunyasi.net",175],["parrocchiapalata.it",175],["photoshopvideotutorial.com",175],["samovies.net",175],["sulocale.sulopachinews.com",175],["tabering.net",175],["xn--nbkw38mlu2a.com",175],["faucetbravo.fun",175],["vstdrive.in",176],["lonely-mature.com",178],["tubepornclassic.com",179],["the-voice-of-germany.de",180],["adn.com",181],["spokesman.com",182],["news-herald.com",182],["verprogramasonline.com",183],["savealoonie.com",183],["pervertgirlsvideos.com",183],["open3dmodel.com",183],["elmundo.es",184],["expansion.com",184],["marca.com",184],["allusione.org",185],["cyberstumble.com",185],["wickedspot.org",185],["venusarchives.com",185],["freemagazines.top",185],["elektrikmen.com",185],["solotrend.net",185],["itsecuritynews.info",185],["thebharatexpressnews.com",185],["inwepo.co",185],["daemon-hentai.com",185],["toramemoblog.com",185],["7daystodiemods.com",185],["7review.com",185],["asupan.me",185],["avitter.net",185],["bi-girl.net",185],["carryflix.icu",185],["dark5k.com",185],["fairyhorn.cc",185],["gojo2.com",185],["gorecenter.com",185],["huitranslation.com",185],["javhdvideo.org",185],["nakiny.com",185],["nemumemo.com",185],["peppe8o.com",185],["phodoi.vn",185],["savingsomegreen.com",185],["boredbat.com",185],["web.businessuniqueidea.com",185],["questloops.com",185],["spinbot.com",186],["androidonepro.com",187],["arcadepunks.com",188],["wohnungsboerse.net",189],["nbareplayhd.com",191],["convert-case.softbaba.com",191],["thepoorcoder.com",191],["techgeek.digital",191],["warps.club",192],["truyenaudiocv.net",192],["kompasiana.com",193],["spectrum.ieee.org",194],["thenation.com",195],["newsonthegotoday.com",196],["dr-farfar.com",197],["nysainfo.pl",197],["c1ne.co",197],["bleachmx.fr",197],["choq.fm",197],["geeksweb.net",197],["usb-antivirus.com",197],["eroticmv.com",197],["allywebsite.com",197],["ktm2day.com",197],["sandiegouniontribune.com",198],["fernsehserien.de",198],["femalefirst.co.uk",199],["theregister.co.uk",200],["sportstream.live",201],["blowjobgif.net",202],["erospots.info",203],["pornforrelax.com",204],["macrumors.com",205],["faupto.com",[206,207]],["dogemate.com",207],["napolipiu.com",208],["manpeace.org",209],["faucetwork.space",209],["gaminginfos.com",209],["png.is",[210,211,212]],["nohat.cc",[211,212]],["fuskator.com",213],["scrubson.blogspot.com",214],["khmer7.org",214],["aquariumgays.com",215],["paginadanoticia.com.br",216],["aylink.co",219],["gitizle.vip",219],["shtms.co",219],["suaurl.com",[220,221]],["blog24.me",222],["exactpay.online",[222,231]],["soltoshindo.com",222],["crypto4yu.com",222],["laweducationinfo.com",223],["savemoneyinfo.com",223],["worldaffairinfo.com",223],["godstoryinfo.com",223],["successstoryinfo.com",223],["cxissuegk.com",223],["learnmarketinfo.com",223],["bhugolinfo.com",223],["armypowerinfo.com",223],["rsadnetworkinfo.com",223],["rsinsuranceinfo.com",223],["rsfinanceinfo.com",223],["rsgamer.app",223],["rssoftwareinfo.com",223],["rshostinginfo.com",223],["rseducationinfo.com",223],["phonereviewinfo.com",223],["makeincomeinfo.com",223],["gknutshell.com",223],["vichitrainfo.com",223],["workproductivityinfo.com",223],["dopomininfo.com",223],["hostingdetailer.com",223],["fitnesssguide.com",223],["tradingfact4u.com",223],["cryptofactss.com",223],["softwaredetail.com",223],["artoffocas.com",223],["insurancesfact.com",223],["travellingdetail.com",223],["currentrecruitment.com",224],["investorveda.com",224],["cookad.net",225],["pmkisanlists.in",225],["shramikcard.in",225],["shareus.io",225],["sportnews.to",225],["gamerxyt.com",225],["faqwiki.us",225],["zeeplayer.pages.dev",225],["techacode.com",226],["azmath.info",226],["downfile.site",226],["downphanmem.com",226],["expertvn.com",226],["memangbau.com",226],["trangchu.news",226],["aztravels.net",226],["techyuth.xyz",227],["claimclicks.com",228],["tejtime24.com",229],["comohoy.com",[229,327]],["cimanow.cc",229],["10convert.com",232],["pleated-jeans.com",232],["obsev.com",232],["wepc.com",232],["gal-dem.com",233],["mymusicreviews.com",234],["thechat.cafe",234],["gaystream.pw",235],["lagacetadesalamanca.es",236],["infocorp.io",237],["addictinggames.com",238],["comparteunclic.com",239],["grab.tc",239],["starbux.io",239],["qashbits.com",239],["upnewsinfo.com",240],["smdailyjournal.com",241],["toolforge.org",242],["getdogecoins.com",244],["malaysiastock.biz",245],["1bit.space",246],["1bitspace.com",246],["ytanime.tv",246],["pimylifeup.com",247],["camwhorez.video",248],["best-shopme.com",249],["cpomagazine.com",250],["doramasyt.com",251],["monoschinos.com",251],["xxxdan.com",252],["standardmedia.co.ke",253],["files.fm",253],["ludwig-van.com",253],["abandonmail.com",254],["hentais.tube",255],["hentaitube.online",255],["aegeanews.gr",256],["batterypoweronline.com",256],["brezovycukr.cz",256],["centrocommercialevulcano.com",256],["cieonline.co.uk",256],["commsbusiness.co.uk",256],["dailygrindonline.net",256],["delo.bg",256],["dynastyseries.com",256],["fabmx1.com",256],["fat-bike.com",256],["fmj.co.uk",256],["localemagazine.com",256],["loveourweddingmag.com",256],["metaforespress.gr",256],["myvalley.it",256],["niestatystyczny.pl",256],["primapaginamarsala.it",256],["ringelnatz.net",256],["schoolsweek.co.uk",256],["sikkenscolore.it",256],["sportbet.gr",256],["stadtstudenten.de",256],["stagemilk.com",256],["tautasdziesmas.lv",256],["thetoneking.com",256],["toplickevesti.com",256],["zeroradio.co.uk",256],["miohentai.com",257],["sluttyrat.com",258],["k12reader.com",260],["cachevalleydaily.com",260],["panel.skynode.pro",261],["imag-r.com",261],["atlaq.com",262],["douploads.net",262],["moalm-qudwa.blogspot.com",262],["mcloud.bz",263],["vidstream.pro",263],["radionylive.com",264],["radioitalylive.com",264],["radiolovelive.com",264],["radiocountrylive.com",264],["radiosymphony.com",264],["miamibeachradio.com",264],["radiorockon.com",264],["radioitaliacanada.com",264],["radioitalianmusic.com",264],["radioamericalatina.com",264],["radiosantaclaus.com",264],["radionorthpole.com",264],["radionatale.com",264],["pornvideoq.com",266],["gaminggorilla.com",266],["sexuhot.com",266],["rexxx.org",267],["world4.eu",268],["flinsetyadi.com",268],["trytutorial.com",268],["rimworldbase.com",268],["ifreemagazines.com",268],["romaniataramea.com",269],["amateur8.com",270],["freeporn8.com",270],["maturetubehere.com",270],["sortporn.com",270],["textovisia.com",271],["hotcleaner.com",272],["momo-net.com",273],["hardwarezone.com.sg",274],["b2bhint.com",[276,277]],["baikin.net",276],["unsurcoenlasombra.com",276],["veryfastdownload.pw",279],["nation.africa",280],["manganelo.tv",281],["vermoegen.org",282],["javhub.net",[283,284]],["inhumanity.com",285],["sunci.net",286],["yoykp.com",286],["iguarras.com",287],["iputitas.net",287],["fastream.to",287],["miraculous.to",288],["glotorrents.fr-proxy.com",289],["glotorrents.theproxy.ws",289],["tutele.sx",290],["dirp.me",291],["t18cv.com",292],["codecap.org",293],["integral-calculator.com",294],["derivative-calculator.net",294],["shorttrick.in",295],["sharedisk.me",295],["shrdsk.me",295],["looptorrent.org",295],["noicetranslations.blogspot.com",295],["serviceemmc.com",295],["getcopy.link",296],["basic-tutorials.de",297],["depvailon.com",298],["111.90.150.10",299],["111.90.150.149",299],["111.90.151.26",299],["111.90.141.252",299],["mangahentai.xyz",300],["nhentai.io",[302,303]],["erofound.com",304],["erome.com",305],["flaticon.com",306],["zertalious.xyz",307],["tweakcentral.net",308],["nokiahacking.pl",309],["javct.net",310],["veryfreeporn.com",311],["austiblox.net",312],["linkbin.me",[313,314]],["teachoo.com",316],["maisonbrico.com",317],["vebo1.com",318],["komiklokal.me",319],["seriesmetro.net",320],["blog.textpage.xyz",322],["alliptvlinks.com",322],["kodewebsite.com",323],["qcheng.cc",324],["hygiena.com",325],["netchimp.co.uk",326],["xgroovy.com",328],["ruyashoujo.com",329],["xmateur.com",330],["gktech.uk",331],["x2download.com",332],["familyminded.com",333],["foxvalleyfoodie.com",333],["merriam-webster.com",333],["news.com.au",333],["playstationlifestyle.net",333],["sportsnaut.com",333],["tempumail.com",333],["toledoblade.com",333],["truyen-hentai.com",334],["redd.tube",335],["sendspace.com",336],["leechpremium.net",337],["freethesaurus.com",340],["thefreedictionary.com",340],["counterstrike-hack.leforum.eu",341],["ajt.xooit.org",341],["drivemoe.com",342],["dsharer.com",342],["pupupul.site",343],["fansubseries.com.br",343],["jadoo.lol",344],["sinensistoon.com",345],["usersdrive.com",346],["manoramaonline.com",347],["realmoasis.com",348],["technewsworld.com",349],["rjno1.com",350],["gpldose.com",351],["zinkmovies.in",352],["sbs.com.au",353],["sfr.fr",354],["ericdraken.com",355],["djs.sk",357],["pythonjobshq.com",358],["sensacine.com",360]]);

const entitiesMap = new Map([["wetteronline",3],["ohmymag",6],["pingit",[8,18,25,72]],["oload",[8,18,25,42]],["streamhoe",[8,18]],["123europix",[12,13,25]],["gamestorrents",13],["gogoanimes",13],["limetorrents",13],["piratebayz",13],["europixhd",[13,25]],["hdeuropix",[13,25]],["topeuropix",[13,25]],["grantorrent",[13,91]],["moviescounter",13],["elixx",[13,74]],["telerium",13],["savelinks",13],["hentaisd",13],["mrpiracy",13],["prostoporno",15],["kissasian",16],["bflix",[16,25,263]],["m4ufree",[16,114]],["0123movies",16],["gomovies",16],["lookmovie",[16,36]],["fembed",[16,76]],["mavplay",[16,22,76]],["videobb",[16,22,76,107]],["5movies",16],["123moviesc",16],["proxybit",16],["123movieshd",16],["fbgo",[16,76]],["sbchip",[16,76]],["sbflix",[16,76]],["sbplay",[16,76]],["sbplay2",[16,76]],["sbplay3",[16,76]],["sbrulz",[16,76]],["streamsb",[16,76,278]],["1tamilmv",16],["buffstream",16],["tenies-online",16],["m4uhd",16],["hdhub4u",16],["watchseries9",16],["moviesjoy",16],["torrentstatus",16],["yts2",16],["y2mate",16],["alexsports",16],["2embed",16],["seulink",16],["encurtalink",16],["fmovies",16],["animepahe",[18,30]],["kwik",[18,30]],["1337x.unblocked",18],["1337x.unblockit",[18,20]],["pussyspace",18],["urlcero",18],["shrtfly",[18,59]],["linkshorts",18],["streamcdn",[18,25]],["vinaurl",[18,105]],["komikcast",18],["bolly4u",[18,132]],["tugaflix",18],["hdfriday",18],["123movies",18],["shortearn",[18,25]],["mstream",18],["watch4hd",18],["gdtot",18],["shrink",[18,36,105]],["bluemediafiles",18],["dailysport",[18,25]],["btdb",[18,21]],["linksfire",18],["pureshort",[18,105]],["bluemediadownload",[18,42]],["bluemediafile",[18,42]],["bluemedialink",[18,42]],["bluemediastorage",[18,42]],["bluemediaurls",[18,42]],["urlbluemedia",[18,42]],["link1s",[18,105]],["shorttey",[18,105]],["videoplayer",18],["movizland",18],["sitesunblocked",18],["1377x",18],["bcvc",18],["steamplay",[20,21,22]],["streamp1ay",[21,22]],["topflix",21],["ustream",21],["pixlev",21],["moviessources",21],["steanplay",22],["stemplay",22],["streanplay",22],["txxx",22],["asianclub",[22,25,76]],["pandamovie",24],["speedporn",24],["watchpornfree",24],["silkengirl",[24,34,60]],["mcloud",25],["vizcloud",25],["vizcloud2",25],["ouo",25],["songs",25],["gogoanimetv",25],["daddylive",[25,75]],["pelisplus",25],["streamm4u",25],["inkapelis",25],["ettv",25],["pelix",25],["pnd",25],["0123movie",25],["movies123",25],["piratebay",25],["webbro",25],["javwide",25],["vidhd",25],["mirrorace",25],["thoptv",25],["streamingworld",25],["yesmovies",25],["solarmovie",25],["bdiptv",25],["cinemalibero",25],["pctfenix",[25,138]],["pctnew",[25,138]],["watchgameofthrones",25],["tmearn",[25,105]],["kinoz",[25,42]],["shorten",[25,105,177]],["123animes",[25,107]],["openloadmovies",25],["gdriveplayer",25],["crichd",25],["vipracing",25],["supervideo",25],["ilgeniodellostreaming",25],["superstream",25],["ask4movie",25],["123movies-org",25],["sflix",25],["primetubsub",25],["moviesland",[25,76]],["f2movies",25],["vidsrc",[25,76]],["1337x",[25,287]],["a2zapk",25],["biqle",28],["otakuindo",28],["watchseries",29],["streamtape",29],["vipboxtv",29],["x1337x",29],["streameast",29],["yts",31],["sexvid",[33,164]],["camwhores",[34,96]],["camwhorestv",[34,96]],["rintor",34],["imgsen",[34,69]],["imgsto",[34,69]],["sxyprn",35],["hqq",36],["waaw",[37,114]],["vapley",37],["younetu",37],["player.uwatchfree",[37,114,301]],["waaaw",[37,114]],["waaw1",[37,114]],["123link",[39,40,41]],["cuevana3",[42,99]],["vidcloud",[42,76,114]],["pornid",42],["zbporn",[42,121]],["yomovies",42],["nonsensediamond",42],["xclusivejams",42],["sportlemon",42],["sportlemons",42],["sportlemonx",42],["kinox",42],["remaxhd",42],["img4fap",42],["babeporn",42],["babytorrent",42],["123moviesme",42],["xxxhdvideo",42],["7mmtv",44],["pornhat",46],["porno-tour",46],["desivideos",46],["movie4me",51],["imgdew",[60,69,70]],["imgmaze",[60,70,71]],["imgtown",[60,69,70,71]],["imgview",[60,69,70]],["imgoutlet",[69,70]],["imgrock",[69,71]],["anitube",70],["movisubmalay",[70,107]],["waploaded",70],["dirtyindianporn",70],["indianpornvideos",70],["kashtanka",70],["onlyindianporn",70],["porno18",70],["xxnx",70],["xxxindianporn",70],["thepiratebay",71],["adsrt",72],["stream2watch",74],["peliculas-dvdrip",74],["kinoger",76],["iframejav",76],["mm9844",76],["netxwatch",76],["milfnut",76],["anxcinema",76],["videofilms",76],["prosongs",76],["ncdnstm",76],["filelions",76],["streamwish",76],["bunkr",83],["pouvideo",84],["povvideo",84],["povw1deo",84],["povwideo",84],["powv1deo",84],["powvibeo",84],["powvideo",84],["powvldeo",84],["grantorrent1",91],["subtorrents",[91,102]],["subtorrents1",[91,102]],["filesamba",96],["theproxy",96],["megalink",105],["earnload",105],["miniurl",105],["shrinke",105],["shrinkme",105],["earncash",105],["shortzzy",105],["lite-link",105],["adcorto",105],["dogecoin",105],["upfiles",105],["torrentz2eu",107],["afilmywap",107],["okhatrimaza",107],["123anime",107],["gomoviesfree",107],["player.tormalayalamhd",114],["depedlps",116],["videovard",119],["asiansex",128],["japanfuck",128],["japanporn",128],["teensex",128],["vintagetube",128],["xxxmovies",128],["0l23movies",129],["cloudvideotv",133],["movierulzlink",136],["newmovierulz",136],["3hiidude",136],["ispunlock",140],["tpb",140],["vgmlinks",151],["thestreameast",160],["rainanime",171],["blurayufr",175],["tutsnode",185],["web2.0calc",190],["readcomiconline",191],["zone-annuaire",197],["gplinks",217],["moviehdf",218],["movies4u",225],["movies4u3",225],["azsoft",226],["bg-gledai",234],["bolly4umovies",262],["123movieshub",263],["animeunity",263],["cima-club",263],["flixhq",263],["hindilinks4u",263],["t7meel",263],["bollyholic",275],["cricfree",287],["sportskart",287],["katmoviefix",293],["filemoon",315],["bitporno",321],["brainly",338],["dood",339]]);

const exceptionsMap = new Map([["pingit.com",[8,18,25,72]],["pingit.me",[8,18,25,72]]]);

/******************************************************************************/

function abortOnPropertyRead(
    chain = ''
) {
    if ( typeof chain !== 'string' ) { return; }
    if ( chain === '' ) { return; }
    const safe = safeSelf();
    const logPrefix = safe.makeLogPrefix('abort-on-property-read', chain);
    const exceptionToken = getExceptionToken();
    const abort = function() {
        safe.uboLog(logPrefix, 'Aborted');
        throw new ReferenceError(exceptionToken);
    };
    const makeProxy = function(owner, chain) {
        const pos = chain.indexOf('.');
        if ( pos === -1 ) {
            const desc = Object.getOwnPropertyDescriptor(owner, chain);
            if ( !desc || desc.get !== abort ) {
                Object.defineProperty(owner, chain, {
                    get: abort,
                    set: function(){}
                });
            }
            return;
        }
        const prop = chain.slice(0, pos);
        let v = owner[prop];
        chain = chain.slice(pos + 1);
        if ( v ) {
            makeProxy(v, chain);
            return;
        }
        const desc = Object.getOwnPropertyDescriptor(owner, prop);
        if ( desc && desc.set !== undefined ) { return; }
        Object.defineProperty(owner, prop, {
            get: function() { return v; },
            set: function(a) {
                v = a;
                if ( a instanceof Object ) {
                    makeProxy(a, chain);
                }
            }
        });
    };
    const owner = window;
    makeProxy(owner, chain);
}

function getExceptionToken() {
    const token = getRandomToken();
    const oe = self.onerror;
    self.onerror = function(msg, ...args) {
        if ( typeof msg === 'string' && msg.includes(token) ) { return true; }
        if ( oe instanceof Function ) {
            return oe.call(this, msg, ...args);
        }
    }.bind();
    return token;
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
        'String_split': String.prototype.split,
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
            catch {
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
    safe.logLevel = scriptletGlobals.logLevel || 1;
    let lastLogType = '';
    let lastLogText = '';
    let lastLogTime = 0;
    safe.toLogText = (type, ...args) => {
        if ( args.length === 0 ) { return; }
        const text = `[${document.location.hostname || document.location.href}]${args.join(' ')}`;
        if ( text === lastLogText && type === lastLogType ) {
            if ( (Date.now() - lastLogTime) < 5000 ) { return; }
        }
        lastLogType = type;
        lastLogText = text;
        lastLogTime = Date.now();
        return text;
    };
    try {
        const bc = new self.BroadcastChannel(scriptletGlobals.bcSecret);
        let bcBuffer = [];
        safe.sendToLogger = (type, ...args) => {
            const text = safe.toLogText(type, ...args);
            if ( text === undefined ) { return; }
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
    } catch {
        safe.sendToLogger = (type, ...args) => {
            const text = safe.toLogText(type, ...args);
            if ( text === undefined ) { return; }
            safe.log(`uBO ${text}`);
        };
    }
    return safe;
}

function getRandomToken() {
    const safe = safeSelf();
    return safe.String_fromCharCode(Date.now() % 26 + 97) +
        safe.Math_floor(safe.Math_random() * 982451653 + 982451653).toString(36);
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
} catch {
}
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
    try { abortOnPropertyRead(...argsList[i]); }
    catch { }
}
argsList.length = 0;

/******************************************************************************/

};
// End of code to inject

/******************************************************************************/

uBOL_abortOnPropertyRead();

/******************************************************************************/

// End of local scope
})();

/******************************************************************************/

void 0;
