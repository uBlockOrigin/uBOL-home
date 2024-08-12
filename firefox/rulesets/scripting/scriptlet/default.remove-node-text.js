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
const uBOL_removeNodeText = function() {

const scriptletGlobals = {}; // jshint ignore: line

const argsList = [["script","DisplayAcceptableAdIfAdblocked"],["script","/==undefined.*body/"],["script","\"Anzeige\""],["script","adserverDomain"],["script","Promise"],["script","Reflect"],["script","document.write"],["script","self == top"],["script","/popunder|isAdBlock|admvn.src/i"],["script","deblocker"],["script","exdynsrv"],["script","/adb/i"],["script","adsbygoogle"],["script","FingerprintJS"],["script","/h=decodeURIComponent|popundersPerIP/"],["script","/adblock.php"],["script","/document\\.createElement|\\.banner-in/"],["script","admbenefits"],["script","/block-adb|-0x|adblock/"],["script","ExoLoader"],["script","/?key.*open/","condition","key"],["script","adblock"],["script","homad"],["script","Adblock"],["script","alert"],["script","/adblock|popunder/"],["script","document.createTextNode"],["script","style"],["script","shown_at"],["script","adsSrc"],["script","/fetch|adb/i"],["script","window.open"],["script","adblockimg"],["script","showAd"],["script","imgSrc"],["script","document.createElement(\"script\")"],["script","googlesyndication"],["script","antiAdBlock"],["script","/fairAdblock|popMagic/"],["script","/pop1stp|detectAdBlock/"],["script","popundersPerIP"],["script","popunder"],["script","aclib.runPop"],["script","mega-enlace.com/ext.php?o="],["script","Popup"],["script","catch"],["script","displayAdsV3"],["script",";}}};break;case $."],["script","adblocker"],["script","/interceptClickEvent|onbeforeunload|popMagic|location\\.replace/"],["script","admiral"],["script","/adm|adb/i"],["script","initializeInterstitial"],["script","ai_adb"],["script","/adbl/i"],["script","/-Ads-close|preventDefault|ai-debug|b2a|split|reload/"],["script","/ABDetected|navigator.brave|fetch/"],["script","/bypass.php"],["script","htmls"],["script","/\\/detected\\.html|Adblock/"],["script","toast"],["script","AdbModel"],["script","popup"],["script","antiAdBlockerHandler"],["script","/ad\\s?block|adsBlocked|document\\.write\\(unescape\\('|devtool/i"],["script","onerror"],["script","location.assign"],["script","location.href"],["script","/checkAdBlocker|AdblockRegixFinder/"],["script",";break;case $."],["script","adb_detected"],["script","/aclib|break;|zoneNativeSett/"],["script","/AdbModel|showPopup/"],["script","/fetch|popupshow/"],["script","justDetectAdblock"],["script","openPopup"],["style","text-decoration"],["script","push"],["script","AdBlocker"],["script","clicky"],["script","charCodeAt"],["script","/h=decodeURIComponent|\"popundersPerIP\"/"],["script","popMagic"],["script","/popMagic|pop1stp/"],["script","/adblock|location\\.replace/"],["script","/downloadJSAtOnload|Object.prototype.toString.call/"],["script","numberPages"],["script","KCgpPT57bGV0IGU"],["script","error-report.com"],["script","adShield"],["script","AdblockRegixFinder"],["script","serve"],["script","/\\.pop\\(\\); \\}|AdSlot created|Created AdSlot|\\.length % 2; \\}/"],["script","/ConsoleBan|alert|AdBlocker/"],["script","runPop"],["script","mdpDeblocker"],["script","alert","condition","adblock"],["script","adb"],["script","/deblocker|chp_ad/"],["script","await fetch"],["script","innerHTML"],["script","/'.adsbygoogle'|text-danger|warning|Adblock|_0x/"],["script","popUnder"],["#text","/スポンサーリンク|Sponsored Link|广告/"],["#text","スポンサーリンク"],["#text","スポンサードリンク"],["#text","/\\[vkExUnit_ad area=(after|before)\\]/"],["#text","【広告】"],["#text","【PR】"],["#text","関連動画"],["#text","PR:"],["script","leave_recommend"],["#text","/Advertisement/"],["script","zfgloaded"],["script","HTMLAllCollection"],["script","liedetector"],["script","popWin"],["script","end_click"],["script","ad blocker"],["script","closeAd"],["script","/modal|popupads/"],["script","/adconfig/i"],["script","AdblockDetector"],["script","is_antiblock_refresh"],["script","/userAgent|adb|htmls/"],["script","myModal"],["script","ad_block"],["script","app_checkext"],["script","clientHeight"],["script","/url_key|adHtml/"],["script","pop.target"],["script","axios"],["script","ad block"],["script","\"v4ac1eiZr0\""],["script","\"data-adm-url\""],["script","/charAt|XMLHttpRequest/"],["script","AdBlockEnabled"],["script","window.location.replace"],["script","/$.*open/"],["script","Brave"],["script","egoTab"],["script","abDetectorPro"],["script","/$.*(css|oncontextmenu)/"],["script","/eval.*RegExp/"],["script","wwads"],["script","/\\[\\'push\\'\\]/"],["script","/adblock/i"],["script","/$.*adUnits/"],["script","decodeURIComponent"],["script","RegExp"],["script","adbl"],["script","doOpen"],["script","adsBlocked"],["script","chkADB"],["script","AaDetector"],["script","AdBlock"],["script","Symbol.iterator"],["script","/innerHTML.*appendChild/"],["script","Exo"],["script","detectAdBlock"],["script","/window\\[\\'open\\'\\]/"],["script","Error"],["script","document.head.appendChild"],["script","adsPlay"],["script","pop1stp"],["script","Number"],["script","NEXT_REDIRECT"],["script","ad-block-activated"],["script","insertBefore"],["script","pop.doEvent"],["script","detect"],["script","fetch"],["script","/join\\(\\'\\'\\)/"],["script","/join\\(\\\"\\\"\\)/"],["script","api.dataunlocker.com"],["script","vglnk"],["script","/RegExp\\(\\'/","condition","RegExp"],["script","/event\\.keyCode|DisableDevtool/"],["script","/detectAdBlock|\\(typeof [a-z]{10","25} \\=\\=\\=? (\"undefined\"|\"function\")\\)|_0x|'\\/func'/"],["script","NREUM"]];

const hostnamesMap = new Map([["alpin.de",0],["boersennews.de",0],["chefkoch.de",0],["chip.de",0],["clever-tanken.de",0],["desired.de",0],["donnerwetter.de",0],["fanfiktion.de",0],["focus.de",0],["formel1.de",0],["frustfrei-lernen.de",0],["gewinnspiele.tv",0],["giga.de",0],["gut-erklaert.de",0],["kino.de",0],["messen.de",0],["nickles.de",0],["nordbayern.de",0],["spielfilm.de",0],["teltarif.de",0],["unsere-helden.com",0],["weltfussball.at",0],["watson.de",0],["moviepilot.de",[0,4]],["aupetitparieur.com",1],["allthingsvegas.com",1],["100percentfedup.com",1],["beforeitsnews.com",1],["concomber.com",1],["conservativebrief.com",1],["conservativefiringline.com",1],["dailylol.com",1],["funnyand.com",1],["letocard.fr",1],["mamieastuce.com",1],["meilleurpronostic.fr",1],["patriotnationpress.com",1],["toptenz.net",1],["vitamiiin.com",1],["writerscafe.org",1],["populist.press",1],["dailytruthreport.com",1],["livinggospeldaily.com",1],["first-names-meanings.com",1],["welovetrump.com",1],["thehayride.com",1],["thelibertydaily.com",1],["thepoke.co.uk",1],["thepolitistick.com",1],["theblacksphere.net",1],["shark-tank.com",1],["naturalblaze.com",1],["greatamericanrepublic.com",1],["dailysurge.com",1],["truthlion.com",1],["flagandcross.com",1],["westword.com",1],["republicbrief.com",1],["freedomfirstnetwork.com",1],["phoenixnewtimes.com",1],["designbump.com",1],["clashdaily.com",1],["madworldnews.com",1],["reviveusa.com",1],["sonsoflibertymedia.com",1],["thedesigninspiration.com",1],["videogamesblogger.com",1],["protrumpnews.com",1],["thepalmierireport.com",1],["kresy.pl",1],["thepatriotjournal.com",1],["gellerreport.com",1],["thegatewaypundit.com",1],["wltreport.com",1],["miaminewtimes.com",1],["politicalsignal.com",1],["rightwingnews.com",1],["bigleaguepolitics.com",1],["comicallyincorrect.com",1],["web.de",2],["skidrowreloaded.com",[3,14]],["1stream.eu",3],["4kwebplay.xyz",3],["antennasports.ru",3],["buffsports.me",[3,47]],["buffstreams.app",3],["claplivehdplay.ru",3],["cracksports.me",[3,13]],["ext.to",3],["eztv.tf",3],["eztvx.to",3],["kenitv.me",[3,13]],["lewblivehdplay.ru",3],["mlbbite.net",3],["mlbstreams.ai",3],["qatarstreams.me",[3,13]],["qqwebplay.xyz",3],["rnbastreams.com",3],["soccerworldcup.me",[3,13]],["topstreams.info",3],["totalsportek.to",3],["viwlivehdplay.ru",3],["topembed.pw",3],["crackstreamer.net",3],["methstreamer.com",3],["yts.mx",6],["upornia.com",8],["pinsystem.co.uk",9],["elrellano.com",9],["tinyppt.com",9],["bharathwick.com",9],["descargaspcpro.net",9],["dx-tv.com",9],["rt3dmodels.com",9],["plc4me.com",9],["blisseyhusbands.com",9],["madaradex.org",9],["trigonevo.com",9],["franceprefecture.fr",9],["jazbaat.in",9],["aipebel.com",9],["veganab.co",9],["camdigest.com",9],["learnmany.in",9],["amanguides.com",[9,61]],["highkeyfinance.com",[9,61]],["appkamods.com",9],["techacode.com",9],["djqunjab.in",9],["downfile.site",9],["expertvn.com",9],["trangchu.news",9],["3dmodelshare.org",9],["nulleb.com",9],["asiaon.top",9],["coursesghar.com",9],["thecustomrom.com",9],["snlookup.com",9],["bingotingo.com",9],["ghior.com",9],["3dmili.com",9],["karanpc.com",9],["plc247.com",9],["apkdelisi.net",9],["javindo.eu.org",9],["chindohot.site",9],["freepasses.org",9],["tomarnarede.pt",9],["basketballbuzz.ca",9],["dribbblegraphics.com",9],["kemiox.com",9],["checkersmenu.us",9],["teksnologi.com",9],["dollareuro.live",9],["eporner.com",11],["javtiful.com",[11,14]],["germancarforum.com",12],["innateblogger.com",12],["cybercityhelp.in",12],["streamnoads.com",[13,14,47]],["bowfile.com",13],["cloudvideo.tv",[13,47]],["coloredmanga.com",13],["embedstream.me",[13,14,47]],["exeo.app",13],["hiphopa.net",[13,14]],["megaup.net",13],["olympicstreams.co",[13,47]],["tv247.us",[13,14]],["uploadhaven.com",13],["userscloud.com",[13,47]],["mdfx9dc8n.net",14],["mdzsmutpcvykb.net",14],["mixdrop21.net",14],["mixdropjmk.pw",14],["y2tube.pro",14],["fastreams.com",14],["redittsports.com",14],["sky-sports.store",14],["streamsoccer.site",14],["tntsports.store",14],["wowstreams.co",14],["123movies4u.site",14],["1337xporn.com",14],["141jav.com",14],["1bit.space",14],["1bitspace.com",14],["38dh2.top",14],["3dporndude.com",14],["4archive.org",14],["4horlover.com",14],["560pmovie.com",14],["60fps.xyz",14],["85tube.com",14],["85videos.com",14],["8xlinks.click",14],["a2zcrackworld.com",14],["aazzz.xyz",14],["acefile.co",14],["actusports.eu",14],["adclickersbot.com",14],["adricami.com",14],["adslink.pw",14],["adultstvlive.com",14],["adz7short.space",14],["aeblender.com",14],["ahdafnews.blogspot.com",14],["ak47sports.com",14],["akuma.moe",14],["allplayer.tk",14],["allstreaming.online",14],["amadoras.cf",14],["amadorasdanet.shop",14],["amateurblog.tv",14],["androidadult.com",14],["anhsexjav.xyz",14],["anidl.org",14],["anime-loads.org",14],["animeblkom.net",14],["animefire.plus",14],["animelek.me",14],["animespire.net",14],["animestotais.xyz",14],["animeyt.es",14],["anroll.net",14],["anymoviess.xyz",14],["aotonline.org",14],["asenshu.com",14],["asialiveaction.com",14],["asianclipdedhd.net",14],["askim-bg.com",14],["asumsikedaishop.com",14],["avcrempie.com",14],["avseesee.com",14],["gettapeads.com",14],["backfirstwo.com",14],["bajarjuegospcgratis.com",14],["balkanportal.net",14],["balkanteka.net",14],["bdnewszh.com",[14,47]],["belowporn.com",14],["bestclaimtrx.xyz",14],["bestgirlsexy.com",14],["bestnhl.com",14],["bestporn4free.com",14],["bestporncomix.com",14],["bet36.es",14],["bikinitryon.net",14],["birdurls.com",14],["bitsearch.to",14],["blackcockadventure.com",14],["blackcockchurch.org",14],["blackporncrazy.com",14],["blizzboygames.net",14],["blizzpaste.com",14],["blkom.com",14],["blog-peliculas.com",14],["blogtrabalhista.com",14],["blurayufr.xyz",14],["bobsvagene.club",14],["bolly4umovies.click",14],["bonusharian.pro",14],["brilian-news.id",14],["brupload.net",14],["bucitana.com",14],["cablegratis.online",14],["camchickscaps.com",14],["camgirlcum.com",14],["camgirls.casa",14],["cashurl.in",14],["castingx.net",14],["ccurl.net",[14,47]],["celebrity-leaks.net",14],["cgpelis.net",14],["charexempire.com",14],["choosingnothing.com",14],["clasico.tv",14],["clik.pw",14],["coin-free.com",[14,58]],["coins100s.fun",14],["comicsmanics.com",14],["compucalitv.com",14],["coolcast2.com",14],["cosplaytab.com",14],["countylocalnews.com",14],["cpmlink.net",14],["crackstreamshd.click",14],["crespomods.com",14],["crisanimex.com",14],["crunchyscan.fr",14],["cuevana3.fan",14],["cuevana3hd.com",14],["cumception.com",14],["curvaweb.com",14],["cutpaid.com",14],["cypherscans.xyz",[14,47]],["datawav.club",14],["daughtertraining.com",14],["deepgoretube.site",14],["deltabit.co",14],["depvailon.com",14],["derleta.com",14],["desivdo.com",14],["desixx.net",14],["detikkebumen.com",14],["deutschepornos.me",14],["diasoft.xyz",14],["directupload.net",14],["diskusscan.com",14],["dixva.com",14],["doctormalay.com",14],["dofusports.xyz",14],["dogemate.com",14],["doods.cam",14],["doodskin.lat",14],["downloadrips.com",14],["downvod.com",14],["dphunters.mom",14],["dragontranslation.com",14],["duddes.xyz",14],["dvdfullestrenos.com",14],["easylinks.in",14],["ebookbb.com",14],["ebookhunter.net",14],["egyanime.com",14],["egygost.com",14],["egyshare.cc",14],["ekasiwap.com",14],["electro-torrent.pl",14],["elil.cc",14],["embed4u.xyz",14],["eplayer.click",14],["erovoice.us",14],["eroxxx.us",14],["estrenosdoramas.net",14],["everia.club",14],["everythinginherenet.blogspot.com",14],["extrafreetv.com",14],["extremotvplay.com",14],["fapinporn.com",14],["fapptime.com",14],["fashionblog.tv",14],["fastreams.live",14],["faucethero.com",14],["fembed.com",14],["femdom-joi.com",14],["fileone.tv",14],["film1k.com",14],["filmeonline2023.net",14],["filmesonlinex.org",14],["filmesonlinexhd.biz",[14,47]],["filmovitica.com",14],["filmymaza.blogspot.com",14],["filthy.family",14],["firstmovies.to",14],["fixfinder.click",14],["flostreams.xyz",14],["flyfaucet.com",14],["footyhunter.lol",14],["footyhunter3.xyz",[14,47]],["forex-golds.com",14],["forex-trnd.com",14],["forumchat.club",14],["forumlovers.club",14],["freemoviesonline.biz",14],["freeomovie.co.in",14],["freeomovie.to",14],["freeporncomic.net",14],["freepornhdonlinegay.com",14],["freeproxy.io",14],["freeuse.me",14],["freeusexporn.com",14],["fsicomics.com",14],["gambarbogel.xyz",14],["gamepcfull.com",14],["gameronix.com",14],["gamesfullx.com",14],["gameshdlive.net",14],["gameshdlive.xyz",14],["gamesmountain.com",14],["gamesrepacks.com",14],["gamingguru.fr",14],["gamovideo.com",14],["garota.cf",14],["gaydelicious.com",14],["gaypornmasters.com",14],["gaysex69.net",14],["gemstreams.com",14],["get-to.link",14],["girlscanner.org",14],["giurgiuveanul.ro",14],["gledajcrtace.xyz",14],["gocast2.com",14],["gomo.to",14],["gostosa.cf",14],["gtlink.co",14],["gwiazdypornosow.pl",14],["haho.moe",14],["hatsukimanga.com",14],["hayhd.net",14],["hdsaprevodom.com",14],["hdstreamss.club",14],["hentais.tube",14],["hentaistream.co",14],["hentaitk.net",14],["hentaitube.online",14],["hentaiworld.tv",14],["hesgoal.tv",14],["hexupload.net",14],["hhkungfu.tv",14],["highlanderhelp.com",14],["hindimean.com",14],["hindimovies.to",[14,47]],["hiperdex.com",14],["hispasexy.org",14],["hitprn.com",14],["hoca4u.com",14],["hollymoviehd.cc",14],["hoodsite.com",14],["hopepaste.download",14],["hornylips.com",14],["hotgranny.live",14],["hotmama.live",14],["hqcelebcorner.net",14],["huren.best",14],["hwnaturkya.com",[14,47]],["hxfile.co",[14,47]],["igfap.com",14],["ihdstreams.xyz",14],["iklandb.com",14],["illink.net",14],["imgkings.com",14],["imgsex.xyz",14],["imx.to",14],["influencersgonewild.org",14],["infosgj.free.fr",14],["investnewsbrazil.com",14],["itdmusics.com",14],["itsuseful.site",14],["itunesfre.com",14],["iwatchfriendsonline.net",[14,115]],["jackstreams.com",14],["jatimupdate24.com",14],["jav-fun.cc",14],["jav-scvp.com",14],["javcl.com",14],["javf.net",14],["javhay.net",14],["javhoho.com",14],["javhun.com",14],["javleak.com",14],["javporn.best",14],["javsex.to",14],["jimdofree.com",14],["jiofiles.org",14],["jorpetz.com",14],["journalyc.online",14],["jp-films.com",14],["jpop80ss3.blogspot.com",14],["jpopsingles.eu",[14,29]],["kantotflix.net",14],["kantotinyo.com",14],["kaoskrew.org",14],["kaplog.com",14],["keralatvbox.com",14],["kickassanimes.io",14],["kimochi.info",14],["kimochi.tv",14],["kinemania.tv",14],["konstantinova.net",14],["koora-online.live",14],["kunmanga.com",14],["kutmoney.com",14],["kwithsub.com",14],["ladangreceh.xyz",14],["lat69.me",14],["latinblog.tv",14],["latinomegahd.net",14],["lazyfaucet.com",14],["leechpremium.link",14],["legendas.dev",14],["legendei.net",14],["lightdlmovies.blogspot.com",14],["lighterlegend.com",14],["linclik.com",14],["linkebr.com",14],["linkrex.net",14],["links.worldfree4u-lol.online",14],["linksfy.co",14],["lody.ink",14],["lovesomecommunity.com",14],["lulustream.com",[14,47]],["luluvdo.com",[14,47]],["luzcameraeacao.shop",14],["manga-oni.com",14],["mangaboat.com",14],["mangagenki.me",14],["mangahere.onl",14],["mangaweb.xyz",14],["mangoporn.net",14],["manhwahentai.me",14],["masahub.com",14],["masahub.net",14],["maturegrannyfuck.com",14],["mdy48tn97.com",14],["mediapemersatubangsa.com",14],["mega-mkv.com",14],["megapastes.com",14],["megapornpics.com",14],["messitv.net",14],["meusanimes.net",14],["milfmoza.com",14],["milfzr.com",14],["millionscast.com",14],["mimaletamusical.blogspot.com",14],["mitly.us",14],["mkv-pastes.com",14],["modb.xyz",14],["monaskuliner.ac.id",14],["moredesi.com",14],["movgotv.net",14],["movi.pk",14],["movierr.online",14],["movieswbb.com",14],["moviewatch.com.pk",14],["mp4upload.com",14],["mrskin.live",14],["multicanaistv.com",14],["mundowuxia.com",14],["myeasymusic.ir",14],["myonvideo.com",14],["myyouporn.com",14],["narutoget.info",14],["naughtypiss.com",14],["nerdiess.com",14],["new-fs.eu",14],["newtorrentgame.com",14],["nflstreams.me",14],["niaomea.me",[14,47]],["nicekkk.com",14],["nicesss.com",14],["nlegs.com",14],["nolive.me",[14,47]],["nopay.info",14],["nopay2.info",[14,154]],["notformembersonly.com",14],["novamovie.net",14],["novelpdf.xyz",14],["novelssites.com",[14,47]],["novelup.top",14],["nsfwr34.com",14],["nu6i-bg-net.com",14],["nudebabesin3d.com",14],["nukedfans.com",14],["nuoga.eu",14],["nzbstars.com",14],["ohjav.com",14],["ojearnovelas.com",14],["okanime.xyz",14],["olarixas.xyz",14],["oldbox.cloud",14],["olweb.tv",14],["olympicstreams.me",14],["on9.stream",14],["oncast.xyz",14],["onepiece-mangaonline.com",14],["onifile.com",14],["onionstream.live",14],["onlinesaprevodom.net",14],["onlyfullporn.video",14],["onplustv.live",14],["originporn.com",14],["ovagames.com",14],["ovamusic.com",14],["owllink.net",14],["packsporn.com",14],["pahaplayers.click",14],["palimas.org",14],["pandafiles.com",14],["papahd.club",14],["papahd1.xyz",14],["password69.com",14],["pastemytxt.com",14],["payskip.org",14],["peeplink.in",14],["peliculasmx.net",14],["pervertgirlsvideos.com",14],["pervyvideos.com",14],["phim12h.com",14],["picdollar.com",14],["pickteenz.com",14],["pics4you.net",14],["picsxxxporn.com",14],["pinayscandalz.com",14],["pinkueiga.net",14],["piratefast.xyz",14],["piratehaven.xyz",14],["pirateiro.com",14],["pirlotvonline.org",14],["playtube.co.za",14],["plugintorrent.com",14],["pmvzone.com",14],["porndish.com",14],["pornez.net",14],["pornfetishbdsm.com",14],["pornfits.com",14],["pornhd720p.com",14],["pornobr.club",14],["pornobr.ninja",14],["pornodominicano.net",14],["pornofaps.com",14],["pornoflux.com",14],["pornotorrent.com.br",14],["pornredit.com",14],["pornstarsyfamosas.es",14],["pornstreams.co",14],["porntn.com",14],["pornxbit.com",14],["pornxday.com",14],["portaldasnovinhas.shop",14],["portugues-fcr.blogspot.com",14],["poscishd.online",14],["poscitesch.com",[14,47]],["poseyoung.com",14],["pover.org",14],["proxyninja.org",14],["pubfilmz.com",14],["publicsexamateurs.com",14],["punanihub.com",14],["putlocker5movies.org",14],["pxxbay.com",14],["r18.best",14],["ragnaru.net",14],["rapbeh.net",14],["rapelust.com",14],["rapload.org",14],["read-onepiece.net",14],["retro-fucking.com",14],["retrotv.org",14],["robaldowns.com",14],["rockdilla.com",14],["rojadirectatvenvivo.com",14],["rojitadirecta.blogspot.com",14],["romancetv.site",14],["rule34.club",14],["rule34hentai.net",14],["rumahbokep-id.com",14],["safego.cc",14],["safestream.cc",14],["sakurafile.com",14],["satoshi-win.xyz",14],["scat.gold",14],["scatfap.com",14],["scatkings.com",14],["scnlog.me",14],["scripts-webmasters.net",14],["serie-turche.com",14],["serijefilmovi.com",14],["sexcomics.me",14],["sexdicted.com",14],["sexgay18.com",14],["sexofilm.co",14],["sextgem.com",14],["sextubebbw.com",14],["sgpics.net",14],["shadowrangers.live",14],["shahee4u.cam",14],["shahiid-anime.net",14],["shemale6.com",14],["shinden.pl",14],["short.es",14],["showmanga.blog.fc2.com",14],["shrt10.com",14],["shurt.pw",14],["sideplusleaks.net",14],["silverblog.tv",14],["silverpic.com",14],["sinhalasub.life",14],["sinsitio.site",14],["sinvida.me",14],["skidrowcpy.com",14],["skidrowfull.com",14],["slut.mom",14],["smallencode.me",14],["smoner.com",14],["smplace.com",14],["soccerinhd.com",[14,47]],["socceron.name",14],["softairbay.com",14],["sokobj.com",14],["songsio.com",14],["souexatasmais.com",14],["sportbar.live",14],["sportea.online",14],["sportskart.xyz",14],["sportstream1.cfd",14],["sporttuna.site",14],["srt.am",14],["srts.me",14],["stakes100.xyz",14],["stbemuiptv.com",14],["stockingfetishvideo.com",14],["stream.crichd.vip",14],["stream.lc",14],["stream25.xyz",14],["streambee.to",14],["streamcenter.pro",14],["streamers.watch",14],["streamgo.to",14],["streamkiste.tv",14],["streamoporn.xyz",14],["streamoupload.xyz",14],["streamservicehd.click",14],["streamvid.net",[14,21]],["subtitleporn.com",14],["subtitles.cam",14],["suicidepics.com",14],["supertelevisionhd.com",14],["supexfeeds.com",14],["swzz.xyz",14],["sxnaar.com",14],["tabooporns.com",14],["taboosex.club",14],["tapeantiads.com",14],["tapeblocker.com",14],["tapenoads.com",14],["tapewithadblock.org",[14,176]],["teamos.xyz",14],["teen-wave.com",14],["teenporncrazy.com",14],["telegramgroups.xyz",14],["telenovelasweb.com",14],["tensei-shitara-slime-datta-ken.com",14],["tfp.is",14],["tgo-tv.co",[14,47]],["thaihotmodels.com",14],["theblueclit.com",14],["thebussybandit.com",14],["theicongenerator.com",14],["thelastdisaster.vip",14],["thepiratebay0.org",14],["thepiratebay10.info",14],["thesexcloud.com",14],["thothub.today",14],["tightsexteens.com",14],["tojav.net",14],["tokyoblog.tv",14],["tonnestreamz.xyz",14],["top16.net",14],["topvideosgay.com",14],["torrage.info",14],["torrents.vip",14],["torrsexvid.com",14],["tpb-proxy.xyz",14],["trannyteca.com",14],["trendytalker.com",14],["tumanga.net",14],["turbogvideos.com",14],["turbovid.me",14],["turkishseriestv.org",14],["turksub24.net",14],["tutele.sx",14],["tutelehd3.xyz",14],["tvglobe.me",14],["tvpclive.com",14],["tvs-widget.com",14],["tvseries.video",14],["ucptt.com",14],["ufaucet.online",14],["ufcfight.online",14],["uhdgames.xyz",14],["ultrahorny.com",14],["ultraten.net",14],["unblockweb.me",14],["underhentai.net",14],["uniqueten.net",14],["upbaam.com",14],["upstream.to",14],["valeriabelen.com",14],["verdragonball.online",14],["vfxmed.com",14],["video.az",14],["videostreaming.rocks",14],["videowood.tv",14],["vidorg.net",14],["vidtapes.com",14],["vidz7.com",14],["vikistream.com",14],["vikv.net",14],["virpe.cc",14],["visifilmai.org",14],["viveseries.com",14],["vladrustov.sx",14],["volokit2.com",14],["vstorrent.org",14],["w-hentai.com",14],["watchaccordingtojimonline.com",14],["watchbrooklynnine-nine.com",14],["watchdowntonabbeyonline.com",14],["watchelementaryonline.com",14],["watcheronline.net",14],["watchgleeonline.com",14],["watchhowimetyourmother.online",14],["watchkobestreams.info",14],["watchlostonline.net",14],["watchlouieonline.com",14],["watchjavidol.com",14],["watchmadmenonline.com",14],["watchmonkonline.com",14],["watchonceuponatimeonline.com",14],["watchparksandrecreation.net",14],["watchprettylittleliarsonline.com",14],["watchrulesofengagementonline.com",14],["watchthekingofqueens.com",14],["watchthemiddleonline.com",14],["watchtvchh.xyz",14],["webcamrips.com",14],["wickedspot.org",14],["wincest.xyz",14],["witanime.best",14],["wolverdon.fun",14],["wolverdonx.com",14],["wordcounter.icu",14],["worldcupstream.pm",14],["worldmovies.store",14],["worldstreams.click",14],["wpdeployit.com",14],["wqstreams.tk",14],["wwwsct.com",14],["xanimeporn.com",14],["xblog.tv",14],["xn--verseriesespaollatino-obc.online",14],["xn--xvideos-espaol-1nb.com",14],["xpornium.net",14],["xsober.com",14],["xvip.lat",14],["xxgasm.com",14],["xxvideoss.org",14],["xxx18.uno",14],["xxxdominicana.com",14],["xxxfree.watch",14],["xxxmax.net",14],["xxxwebdlxxx.top",14],["xxxxvideo.uno",14],["y2b.wiki",14],["yabai.si",14],["yadixv.com",14],["yayanimes.net",14],["yeshd.net",14],["yodbox.com",14],["youjax.com",14],["youpits.xyz",14],["yourdailypornvideos.ws",14],["yourupload.com",14],["ytstv.me",14],["ytstvmovies.co",14],["ytstvmovies.xyz",14],["ytsyify.co",14],["ytsyifymovie.com",14],["zerion.cc",14],["zerocoin.top",14],["zitss.xyz",14],["zpaste.net",14],["zplayer.live",14],["faucet.ovh",15],["oko.sh",[16,69,70]],["variety.com",17],["bigbtc.win",18],["cryptofun.space",18],["sexo5k.com",19],["truyen-hentai.com",19],["theshedend.com",21],["zeroupload.com",21],["securenetsystems.net",21],["miniwebtool.com",21],["bchtechnologies.com",21],["spiegel.de",22],["hausbau-forum.de",23],["kiemlua.com",23],["appnee.com",24],["d0000d.com",25],["d000d.com",25],["d0o0d.com",25],["do0od.com",25],["doods.pro",25],["ds2play.com",25],["ds2video.com",25],["apkmirror.com",26],["musichq.pe",28],["sekaikomik.bio",28],["hiraethtranslation.com",29],["onlyfaucet.com",30],["livecamrips.com",31],["smutty.com",31],["freeadultcomix.com",31],["down.dataaps.com",31],["filmweb.pl",31],["visionpapers.org",32],["fdownloader.net",33],["thehackernews.com",34],["mielec.pl",35],["camsrip.com",36],["beatsnoop.com",36],["fetchpik.com",36],["hackerranksolution.in",36],["treasl.com",37],["mrbenne.com",38],["cnpics.org",39],["ovabee.com",39],["porn4f.com",39],["cnxx.me",39],["ai18.pics",39],["cuervotv.me",[40,47]],["aliezstream.pro",40],["daddy-stream.xyz",40],["instream.pro",40],["mylivestream.pro",40],["powerover.online",40],["sportea.link",40],["sportsurge.stream",40],["ufckhabib.com",40],["ustream.pro",40],["papa4k.online",40],["streamhd247.info",40],["nowlive1.me",40],["buzter.xyz",40],["gamehdlive.online",40],["hdfungamezz.xyz",40],["kingstreamz.lol",40],["masterpro.club",40],["papahd.co",40],["sportos.co",40],["valhallas.click",40],["andhrafriends.com",41],["freeroms.com",41],["soap2day-online.com",41],["sportsonline.si",42],["fiuxy2.co",43],["animeunity.to",44],["auto-crypto.click",45],["iconicblogger.com",45],["tokopedia.com",46],["xn-----0b4asja7ccgu2b4b0gd0edbjm2jpa1b1e9zva7a0347s4da2797e8qri.xn--1ck2e1b",47],["6movies.net",47],["adsh.cc",47],["afilmyhouse.blogspot.com",47],["ak.sv",47],["animesultra.com",47],["api.webs.moe",47],["apkmody.io",47],["attvideo.com",47],["backfirstwo.site",[47,145]],["crazyblog.in",47],["divicast.com",47],["dlhd.so",47],["embed.meomeo.pw",47],["filmeserialeonline.org",47],["flexyhit.com",47],["foreverwallpapers.com",47],["french-streams.cc",47],["fslinks.org",47],["fstream365.com",47],["hdtoday.to",47],["hinatasoul.com",47],["igg-games.com",47],["infinityscans.net",47],["infinityscans.xyz",47],["membed.net",47],["mgnetu.com",47],["movie4kto.net",47],["mp3juice.info",47],["mp3juices.cc",47],["myflixerz.to",47],["nowmetv.net",47],["nowsportstv.com",47],["nxbrew.com",47],["oii.io",47],["paidshitforfree.com",47],["pepperlive.info",47],["playertv.net",47],["putlocker68.com",47],["roystream.com",47],["rssing.com",47],["s.to",47],["share.filesh.site",47],["sharkfish.xyz",47],["skidrowcodex.net",47],["sports-stream.site",47],["stream4free.live",47],["streamed.su",47],["tamilmobilemovies.in",47],["tapeadsenjoyer.com",47],["thewatchseries.live",47],["tnmusic.in",47],["travelplanspro.com",47],["tusfiles.com",47],["tutlehd4.com",47],["twstalker.com",47],["vid-guard.com",47],["vidco.pro",47],["video-leech.xyz",47],["vidsaver.net",47],["vidspeeds.com",47],["viralitytoday.com",47],["voiranime.stream",47],["watchdoctorwhoonline.com",47],["watchserie.online",47],["webhostingpost.com",47],["woxikon.in",47],["www-y2mate.com",47],["ylink.bid",47],["ytix.xyz",47],["remixsearch.net",48],["remixsearch.es",48],["onlineweb.tools",48],["sharing.wtf",48],["xnxxcom.xyz",49],["al.com",[50,133]],["cleveland.com",[50,133]],["mlive.com",[50,133]],["nj.com",[50,133]],["oregonlive.com",[50,133]],["cheatsheet.com",50],["pwinsider.com",50],["baeldung.com",50],["tvline.com",[51,133]],["moneycontrol.com",52],["repack-games.com",53],["pawastreams.info",53],["moonplusnews.com",[53,55]],["loanoffering.in",[53,55]],["truyentranhfull.net",53],["hesgoal-tv.io",54],["hesgoal-vip.io",54],["intro-hd.net",54],["monacomatin.mc",54],["nodo313.net",54],["spatsify.com",56],["funkeypagali.com",56],["careersides.com",56],["nayisahara.com",56],["wikifilmia.com",56],["infinityskull.com",56],["viewmyknowledge.com",56],["iisfvirtual.in",56],["starxinvestor.com",56],["kenzo-flowertag.com",57],["mdn.lol",57],["btcbitco.in",58],["btcsatoshi.net",58],["cempakajaya.com",58],["crypto4yu.com",58],["gainl.ink",58],["manofadan.com",58],["readbitcoin.org",58],["wiour.com",58],["kienthucrangmieng.com",58],["tremamnon.com",58],["btc25.org",58],["tron-free.com",58],["bitsmagic.fun",58],["ourcoincash.xyz",58],["hynews.biz",58],["blog.cryptowidgets.net",59],["blog.insurancegold.in",59],["blog.wiki-topia.com",59],["blog.coinsvalue.net",59],["blog.cookinguide.net",59],["blog.freeoseocheck.com",59],["aylink.co",60],["sugarona.com",61],["nishankhatri.xyz",61],["cety.app",62],["exego.app",62],["cutlink.net",62],["cutsy.net",62],["cutyurls.com",62],["cutty.app",62],["cutnet.net",62],["javhdo.net",62],["tinys.click",63],["answerpython.com",63],["gsm-solution.com",63],["h-donghua.com",63],["hindisubbedacademy.com",63],["pkgovjobz.com",63],["ripexbooster.xyz",63],["serial4.com",63],["serial412.blogspot.com",63],["sigmalinks.in",63],["tutorgaming.com",63],["everydaytechvams.com",63],["dipsnp.com",63],["cccam4sat.com",63],["aiimgvlog.fun",64],["appsbull.com",65],["diudemy.com",65],["maqal360.com",65],["mphealth.online",65],["makefreecallsonline.com",65],["androjungle.com",65],["bookszone.in",65],["drakescans.com",65],["shortix.co",65],["msonglyrics.com",65],["app-sorteos.com",65],["bokugents.com",65],["client.pylexnodes.net",65],["btvplus.bg",65],["blog24.me",[66,67]],["coingraph.us",68],["impact24.us",68],["tvi.la",[69,70]],["iir.la",[69,70]],["tii.la",[69,70]],["ckk.ai",[69,70]],["oei.la",[69,70]],["lnbz.la",[69,70]],["atglinks.com",71],["cinedesi.in",72],["thevouz.in",72],["tejtime24.com",72],["techishant.in",72],["kbconlinegame.com",73],["hamrojaagir.com",73],["odijob.com",73],["blogesque.net",74],["bookbucketlyst.com",74],["explorosity.net",74],["optimizepics.com",74],["torovalley.net",74],["simana.online",75],["fooak.com",75],["unblocked.id",77],["listendata.com",78],["7xm.xyz",78],["fastupload.io",78],["azmath.info",78],["wouterplanet.com",79],["androidacy.com",80],["pillowcase.su",81],["veryfreeporn.com",82],["theporngod.com",82],["besthdgayporn.com",83],["drivenime.com",83],["javup.org",83],["shemaleup.net",83],["austiblox.net",84],["btcbunch.com",85],["teachoo.com",86],["interfootball.co.kr",87],["a-ha.io",87],["cboard.net",87],["jjang0u.com",87],["joongdo.co.kr",87],["viva100.com",87],["thephoblographer.com",87],["gamingdeputy.com",87],["thesaurus.net",87],["alle-tests.nl",87],["maketecheasier.com",87],["automobile-catalog.com",87],["allthekingz.com",87],["motorbikecatalog.com",87],["tweaksforgeeks.com",87],["m.inven.co.kr",87],["meconomynews.com",87],["brandbrief.co.kr",87],["motorgraph.com",87],["allthetests.com",88],["javatpoint.com",88],["globalrph.com",88],["carscoops.com",88],["indiatimes.com",88],["issuya.com",88],["topstarnews.net",88],["islamicfinder.org",88],["secure-signup.net",88],["worldhistory.org",89],["bitcotasks.com",90],["udvl.com",91],["www.chip.de",92],["topsporter.net",93],["sportshub.to",93],["streamcheck.link",94],["unofficialtwrp.com",95],["bitcosite.com",96],["bitzite.com",96],["easymc.io",97],["yunjiema.top",97],["hacoos.com",99],["bondagevalley.cc",100],["zefoy.com",101],["vidello.net",102],["resizer.myct.jp",103],["gametohkenranbu.sakuraweb.com",104],["jisakuhibi.jp",105],["rank1-media.com",105],["lifematome.blog",106],["fm.sekkaku.net",107],["free-avx.jp",108],["dvdrev.com",109],["betweenjpandkr.blog",110],["nft-media.net",111],["ghacks.net",112],["songspk2.info",113],["zoechip.com",114],["nectareousoverelate.com",116],["khoaiphim.com",117],["haafedk2.com",118],["fordownloader.com",118],["jovemnerd.com.br",119],["nicomanga.com",120],["totalcsgo.com",121],["vivamax.asia",122],["manysex.com",123],["gaminginfos.com",124],["tinxahoivn.com",125],["forums-fastunlock.com",126],["automoto.it",127],["codelivly.com",128],["ophim.vip",129],["touguatize.monster",130],["novelhall.com",131],["hes-goal.net",132],["abc17news.com",133],["adoredbyalex.com",133],["agrodigital.com",133],["aliontherunblog.com",133],["allaboutthetea.com",133],["allmovie.com",133],["allmusic.com",133],["allthingsthrifty.com",133],["amessagewithabottle.com",133],["androidpolice.com",133],["antyradio.pl",133],["artforum.com",133],["artnews.com",133],["awkward.com",133],["awkwardmom.com",133],["bailiwickexpress.com",133],["barnsleychronicle.com",133],["becomingpeculiar.com",133],["bethcakes.com",133],["betweenenglandandiowa.com",133],["blogher.com",133],["bluegraygal.com",133],["briefeguru.de",133],["carmagazine.co.uk",133],["cattime.com",133],["cbr.com",133],["celiacandthebeast.com",133],["chaptercheats.com",133],["collider.com",133],["comingsoon.net",133],["commercialobserver.com",133],["competentedigitale.ro",133],["crafty.house",133],["dailyvoice.com",133],["decider.com",133],["didyouknowfacts.com",133],["dogtime.com",133],["dualshockers.com",133],["dustyoldthing.com",133],["faithhub.net",133],["femestella.com",133],["footwearnews.com",133],["freeconvert.com",133],["frogsandsnailsandpuppydogtail.com",133],["fsm-media.com",133],["funtasticlife.com",133],["fwmadebycarli.com",133],["gamerant.com",133],["gfinityesports.com",133],["givemesport.com",133],["gulflive.com",133],["helloflo.com",133],["homeglowdesign.com",133],["honeygirlsworld.com",133],["hotcars.com",133],["howtogeek.com",133],["insider-gaming.com",133],["insurancejournal.com",133],["jasminemaria.com",133],["kion546.com",133],["lehighvalleylive.com",133],["lettyskitchen.com",133],["lifeinleggings.com",133],["liveandletsfly.com",133],["lizzieinlace.com",133],["localnews8.com",133],["lonestarlive.com",133],["madeeveryday.com",133],["maidenhead-advertiser.co.uk",133],["makeuseof.com",133],["mardomreport.net",133],["melangery.com",133],["milestomemories.com",133],["modernmom.com",133],["momtastic.com",133],["mostlymorgan.com",133],["motherwellmag.com",133],["movieweb.com",133],["muddybootsanddiamonds.com",133],["musicfeeds.com.au",133],["mylifefromhome.com",133],["nationalreview.com",133],["neoskosmos.com",133],["nordot.app",133],["nothingbutnewcastle.com",133],["nsjonline.com",133],["oakvillenews.org",133],["observer.com",133],["ourlittlesliceofheaven.com",133],["palachinkablog.com",133],["pinkonthecheek.com",133],["politicususa.com",133],["predic.ro",133],["puckermom.com",133],["qtoptens.com",133],["realgm.com",133],["reelmama.com",133],["robbreport.com",133],["royalmailchat.co.uk",133],["samchui.com",133],["sandrarose.com",133],["screenrant.com",133],["sheknows.com",133],["sherdog.com",133],["sidereel.com",133],["silive.com",133],["simpleflying.com",133],["sloughexpress.co.uk",133],["spacenews.com",133],["sportsgamblingpodcast.com",133],["spotofteadesigns.com",133],["stacysrandomthoughts.com",133],["ssnewstelegram.com",133],["superherohype.com",133],["tablelifeblog.com",133],["thebeautysection.com",133],["thecelticblog.com",133],["thecurvyfashionista.com",133],["thefashionspot.com",133],["thegamer.com",133],["thegamescabin.com",133],["thenerdyme.com",133],["thenonconsumeradvocate.com",133],["theprudentgarden.com",133],["thethings.com",133],["timesnews.net",133],["topspeed.com",133],["toyotaklub.org.pl",133],["travelingformiles.com",133],["tutsnode.org",133],["viralviralvideos.com",133],["wannacomewith.com",133],["wimp.com",133],["windsorexpress.co.uk",133],["woojr.com",133],["worldoftravelswithkids.com",133],["xda-developers.com",133],["masslive.com",[133,134]],["pagesix.com",[133,134]],["pennlive.com",[133,134]],["syracuse.com",[133,134]],["247sports.com",134],["cbsnews.com",134],["cbssports.com",134],["indiewire.com",134],["nypost.com",134],["bagi.co.in",135],["keran.co",135],["biblestudytools.com",136],["christianheadlines.com",136],["ibelieve.com",136],["kuponigo.com",137],["kimcilonly.site",138],["kimcilonly.link",138],["cryptoearns.com",139],["inxxx.com",140],["ipaspot.app",141],["embedwish.com",142],["filelions.live",142],["leakslove.net",142],["jenismac.com",143],["vxetable.cn",144],["jewelavid.com",145],["nizarstream.com",145],["snapwordz.com",146],["toolxox.com",146],["rl6mans.com",146],["idol69.net",146],["plumbersforums.net",147],["123movies57.online",148],["gulio.site",149],["mediaset.es",150],["izlekolik.net",151],["donghuaworld.com",152],["letsdopuzzles.com",153],["tainio-mania.online",154],["hes-goals.io",155],["pkbiosfix.com",155],["casi3.xyz",155],["rediff.com",156],["dzapk.com",157],["darknessporn.com",158],["familyporner.com",158],["freepublicporn.com",158],["pisshamster.com",158],["punishworld.com",158],["xanimu.com",158],["pig69.com",159],["cosplay18.pics",159],["eroticmoviesonline.me",160],["teleclub.xyz",161],["ecamrips.com",162],["showcamrips.com",162],["tucinehd.com",164],["9animetv.to",165],["qiwi.gg",166],["jornadaperfecta.com",167],["loseart.com",168],["sousou-no-frieren.com",169],["unite-guide.com",170],["thebullspen.com",171],["botcomics.com",172],["cefirates.com",172],["chandlerorchards.com",172],["comicleaks.com",172],["marketdata.app",172],["monumentmetals.com",172],["tapmyback.com",172],["ping.gg",172],["revistaferramental.com.br",172],["hawpar.com",172],["alpacafinance.org",[172,173]],["nookgaming.com",172],["enkeleksamen.no",172],["kvest.ee",172],["creatordrop.com",172],["panpots.com",172],["cybernetman.com",172],["bitdomain.biz",172],["gerardbosch.xyz",172],["fort-shop.kiev.ua",172],["accuretawealth.com",172],["resourceya.com",172],["tracktheta.com",172],["camberlion.com",172],["replai.io",172],["trybawaryjny.pl",172],["tt.live",173],["future-fortune.com",173],["abhijith.page",173],["madrigalmaps.com",173],["adventuretix.com",173],["bolighub.dk",173],["panprices.com",174],["intercity.technology",174],["freelancer.taxmachine.be",174],["adria.gg",174],["fjlaboratories.com",174],["emanualonline.com",174],["proboards.com",175],["winclassic.net",175],["financemonk.net",177],["client.falixnodes.net",178],["abema.tv",179]]);

const entitiesMap = new Map([["mixdrop",[3,14]],["wawacity",3],["pahe",[5,14]],["soap2day",5],["hqq",7],["waaw",7],["mhdsports",9],["mhdsportstv",9],["mhdtvsports",9],["mhdtvworld",9],["mhdtvmax",9],["mhdstream",9],["reset-scans",9],["poplinks",[9,65]],["pixhost",10],["viprow",[13,14,47]],["bluemediadownload",13],["bluemediafile",13],["bluemedialink",13],["bluemediastorage",13],["bluemediaurls",13],["urlbluemedia",13],["cloudvideotv",[13,47]],["vidsrc",[13,47]],["123-movies",14],["123movieshd",14],["123movieshub",14],["123moviesme",14],["1337x",[14,27]],["1stream",14],["1tamilmv",14],["2ddl",14],["2umovies",14],["3hiidude",14],["4stream",14],["5movies",14],["7hitmovies",14],["9xmovie",14],["9xlinks",14],["aagmaal",[14,47]],["adblockeronstape",14],["adblockeronstreamtape",14],["adblockplustape",14],["adblockstreamtape",14],["adblockstrtape",14],["adblockstrtech",14],["adblocktape",14],["adcorto",14],["alexsports",14],["alexsportss",14],["alexsportz",14],["animepahe",14],["animesanka",14],["animixplay",14],["aniplay",14],["antiadtape",14],["asianclub",14],["ask4movie",14],["atomixhq",[14,47]],["atomohd",14],["beinmatch",[14,20]],["bhaai",14],["buffstreams",14],["canalesportivo",14],["clickndownload",14],["clicknupload",14],["daddylive",[14,47]],["daddylivehd",[14,47]],["ddrmovies",14],["desiremovies",14],["devlib",14],["divxtotal",14],["divxtotal1",14],["dlhd",14],["dvdplay",[14,47]],["elixx",14],["enjoy4k",14],["estrenosflix",14],["estrenosflux",14],["estrenosgo",14],["f1stream",14],["fbstream",14],["file4go",14],["filmymeet",14],["filmyzilla",[14,47]],["findav",14],["findporn",14],["flixmaza",14],["flizmovies",14],["freetvsports",14],["fullymaza",14],["g3g",14],["gotxx",14],["grantorrent",14],["hdmoviesfair",[14,47]],["hdmoviesflix",14],["hiidudemoviez",14],["imgsen",14],["imgsto",14],["incest",14],["incestflix",14],["itopmusic",14],["javmost",14],["keeplinks",14],["keepvid",14],["keralahd",14],["khatrimazaful",14],["khatrimazafull",14],["leechall",14],["linkshorts",14],["mangovideo",14],["masaporn",14],["miniurl",14],["mirrorace",14],["mixdroop",14],["mkvcage",14],["mlbstream",14],["mlsbd",14],["mmsbee",14],["motogpstream",14],["movieplex",14],["movierulzlink",14],["movies123",14],["moviesflix",14],["moviesmeta",14],["moviessources",14],["moviesverse",14],["moviezwaphd",14],["mrunblock",14],["nbastream",14],["newmovierulz",14],["nflstream",14],["nhlstream",14],["noblocktape",14],["nocensor",14],["onlyfams",14],["ouo",14],["pctfenix",[14,47]],["pctnew",[14,47]],["peliculas24",14],["pelisplus",14],["piratebay",14],["plyjam",14],["plylive",14],["plyvdo",14],["pornhoarder",14],["prbay",14],["projectfreetv",14],["proxybit",14],["psarips",14],["racaty",14],["remaxhd",14],["rintor",14],["rnbxclusive",14],["rnbxclusive0",14],["rnbxclusive1",14],["rojadirecta",14],["rojadirectaenvivo",14],["rugbystreams",14],["sadisflix",14],["safetxt",14],["shadowrangers",14],["shahi4u",14],["shahid4u1",14],["shahid4uu",14],["shavetape",14],["shortearn",14],["shorten",14],["shorttey",14],["shortzzy",14],["skymovieshd",14],["socceronline",[14,47]],["softarchive",14],["sports-stream",14],["sshhaa",14],["stapadblockuser",14],["stape",14],["stapewithadblock",14],["starmusiq",14],["strcloud",14],["streamadblocker",[14,47]],["streamadblockplus",14],["streamcdn",14],["streamhub",14],["streamsport",14],["streamta",14],["streamtape",14],["streamtapeadblockuser",14],["strikeout",14],["strtape",14],["strtapeadblock",14],["strtapeadblocker",14],["strtapewithadblock",14],["strtpe",14],["swatchseries",14],["tabooflix",14],["tennisstreams",14],["themoviesflix",14],["thepiratebay",14],["thisav",14],["tmearn",14],["toonanime",14],["torlock",14],["tormalayalam",14],["torrentz2eu",14],["tutelehd",14],["tvply",14],["u4m",14],["ufcstream",14],["unblocknow",14],["uploadbuzz",14],["usagoals",14],["vexmoviex",14],["vidclouds",14],["vidlox",14],["vipbox",[14,47]],["vipboxtv",[14,47]],["vipleague",14],["watch-series",14],["watchseries",14],["xclusivejams",14],["xmoviesforyou",14],["youdbox",14],["ytmp3eu",14],["yts-subs",14],["yts",14],["zooqle",14],["dutchycorp",15],["dood",[25,47]],["doodstream",25],["dooood",[25,47]],["torrentdownload",28],["shrinke",31],["shrinkme",31],["daddylive1",40],["esportivos",40],["poscitechs",40],["bollyflix",40],["watchomovies",[41,47]],["123movies",47],["123moviesla",47],["123movieweb",47],["2embed",47],["720pstream",47],["9xmovies",47],["adshort",47],["allmovieshub",47],["asianplay",47],["atishmkv",47],["cricstream",47],["crictime",47],["databasegdriveplayer",47],["extramovies",47],["faselhd",47],["faselhds",47],["filemoon",47],["filmy",47],["filmyhit",47],["filmywap",47],["fmovies",47],["gdplayer",47],["gdriveplayer",47],["goku",47],["gomovies",47],["gowatchseries",47],["hdfungamezz",47],["hindilinks4u",47],["hurawatch",47],["jalshamoviezhd",47],["livecricket",47],["mhdsport",47],["mkvcinemas",47],["movies2watch",47],["moviespapa",47],["mp4moviez",47],["mydownloadtube",47],["nsw2u",47],["nuroflix",47],["o2tvseries",47],["o2tvseriesz",47],["pirlotv",47],["poscitech",47],["primewire",47],["redecanais",47],["serienstream",47],["sflix",47],["shahed4u",47],["shaheed4u",47],["speedostream",47],["sportcast",47],["sportskart",47],["streamingcommunity",47],["tamilarasan",47],["tamilfreemp3songs",47],["tamilprinthd",47],["torrentdosfilmes",47],["tubemate",47],["uploadrar",47],["uqload",47],["vidcloud9",47],["vido",47],["vidoo",47],["vudeo",47],["vumoo",47],["yesmovies",47],["mydverse",63],["stfly",74],["stly",74],["kickass",76],["cine-calidad",82],["teluguflix",98],["actvid",114],["lk21official",163],["nontondrama",163],["dropgalaxy",177]]);

const exceptionsMap = new Map([]);

/******************************************************************************/

function removeNodeText(
    nodeName,
    includes,
    ...extraArgs
) {
    replaceNodeTextFn(nodeName, '', '', 'includes', includes || '', ...extraArgs);
}

function replaceNodeTextFn(
    nodeName = '',
    pattern = '',
    replacement = ''
) {
    const safe = safeSelf();
    const logPrefix = safe.makeLogPrefix('replace-node-text.fn', ...Array.from(arguments));
    const reNodeName = safe.patternToRegex(nodeName, 'i', true);
    const rePattern = safe.patternToRegex(pattern, 'gms');
    const extraArgs = safe.getExtraArgs(Array.from(arguments), 3);
    const reIncludes = extraArgs.includes || extraArgs.condition
        ? safe.patternToRegex(extraArgs.includes || extraArgs.condition, 'ms')
        : null;
    const reExcludes = extraArgs.excludes
        ? safe.patternToRegex(extraArgs.excludes, 'ms')
        : null;
    const stop = (takeRecord = true) => {
        if ( takeRecord ) {
            handleMutations(observer.takeRecords());
        }
        observer.disconnect();
        if ( safe.logLevel > 1 ) {
            safe.uboLog(logPrefix, 'Quitting');
        }
    };
    const textContentFactory = (( ) => {
        const out = { createScript: s => s };
        const { trustedTypes: tt } = self;
        if ( tt instanceof Object ) {
            if ( typeof tt.getPropertyType === 'function' ) {
                if ( tt.getPropertyType('script', 'textContent') === 'TrustedScript' ) {
                    return tt.createPolicy(getRandomToken(), out);
                }
            }
        }
        return out;
    })();
    let sedCount = extraArgs.sedCount || 0;
    const handleNode = node => {
        const before = node.textContent;
        if ( reIncludes ) {
            reIncludes.lastIndex = 0;
            if ( safe.RegExp_test.call(reIncludes, before) === false ) { return true; }
        }
        if ( reExcludes ) {
            reExcludes.lastIndex = 0;
            if ( safe.RegExp_test.call(reExcludes, before) ) { return true; }
        }
        rePattern.lastIndex = 0;
        if ( safe.RegExp_test.call(rePattern, before) === false ) { return true; }
        rePattern.lastIndex = 0;
        const after = pattern !== ''
            ? before.replace(rePattern, replacement)
            : replacement;
        node.textContent = node.nodeName === 'SCRIPT'
            ? textContentFactory.createScript(after)
            : after;
        if ( safe.logLevel > 1 ) {
            safe.uboLog(logPrefix, `Text before:\n${before.trim()}`);
        }
        safe.uboLog(logPrefix, `Text after:\n${after.trim()}`);
        return sedCount === 0 || (sedCount -= 1) !== 0;
    };
    const handleMutations = mutations => {
        for ( const mutation of mutations ) {
            for ( const node of mutation.addedNodes ) {
                if ( reNodeName.test(node.nodeName) === false ) { continue; }
                if ( handleNode(node) ) { continue; }
                stop(false); return;
            }
        }
    };
    const observer = new MutationObserver(handleMutations);
    observer.observe(document, { childList: true, subtree: true });
    if ( document.documentElement ) {
        const treeWalker = document.createTreeWalker(
            document.documentElement,
            NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT
        );
        let count = 0;
        for (;;) {
            const node = treeWalker.nextNode();
            count += 1;
            if ( node === null ) { break; }
            if ( reNodeName.test(node.nodeName) === false ) { continue; }
            if ( node === document.currentScript ) { continue; }
            if ( handleNode(node) ) { continue; }
            stop(); break;
        }
        safe.uboLog(logPrefix, `${count} nodes present before installing mutation observer`);
    }
    if ( extraArgs.stay ) { return; }
    runAt(( ) => {
        const quitAfter = extraArgs.quitAfter || 0;
        if ( quitAfter !== 0 ) {
            setTimeout(( ) => { stop(); }, quitAfter);
        } else {
            stop();
        }
    }, 'interactive');
}

function getRandomToken() {
    const safe = safeSelf();
    return safe.String_fromCharCode(Date.now() % 26 + 97) +
        safe.Math_floor(safe.Math_random() * 982451653 + 982451653).toString(36);
}

function runAt(fn, when) {
    const intFromReadyState = state => {
        const targets = {
            'loading': 1, 'asap': 1,
            'interactive': 2, 'end': 2, '2': 2,
            'complete': 3, 'idle': 3, '3': 3,
        };
        const tokens = Array.isArray(state) ? state : [ state ];
        for ( const token of tokens ) {
            const prop = `${token}`;
            if ( targets.hasOwnProperty(prop) === false ) { continue; }
            return targets[prop];
        }
        return 0;
    };
    const runAt = intFromReadyState(when);
    if ( intFromReadyState(document.readyState) >= runAt ) {
        fn(); return;
    }
    const onStateChange = ( ) => {
        if ( intFromReadyState(document.readyState) < runAt ) { return; }
        fn();
        safe.removeEventListener.apply(document, args);
    };
    const safe = safeSelf();
    const args = [ 'readystatechange', onStateChange, { capture: true } ];
    safe.addEventListener.apply(document, args);
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
    try { removeNodeText(...argsList[i]); }
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

const targetWorld = 'ISOLATED';

// Not Firefox
if ( typeof wrappedJSObject !== 'object' || targetWorld === 'ISOLATED' ) {
    return uBOL_removeNodeText();
}

// Firefox
{
    const page = self.wrappedJSObject;
    let script, url;
    try {
        page.uBOL_removeNodeText = cloneInto([
            [ '(', uBOL_removeNodeText.toString(), ')();' ],
            { type: 'text/javascript; charset=utf-8' },
        ], self);
        const blob = new page.Blob(...page.uBOL_removeNodeText);
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
    delete page.uBOL_removeNodeText;
}

/******************************************************************************/

// End of local scope
})();

/******************************************************************************/

void 0;
