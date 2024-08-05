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

const argsList = [["script","DisplayAcceptableAdIfAdblocked"],["script","/==undefined.*body/"],["script","\"Anzeige\""],["script","adserverDomain"],["script","Promise"],["script","Reflect"],["script","document.write"],["script","self == top"],["script","/popunder|isAdBlock|admvn.src/i"],["script","deblocker"],["script","exdynsrv"],["script","/adb/i"],["script","adsbygoogle"],["script","FingerprintJS"],["script","/h=decodeURIComponent|popundersPerIP/"],["script","/adblock.php"],["script","/document\\.createElement|\\.banner-in/"],["script","admbenefits"],["script","/block-adb|-0x|adblock/"],["script","ExoLoader"],["script","/?key.*open/","condition","key"],["script","adblock"],["script","homad"],["script","Adblock"],["script","alert"],["script","/adblock|popunder/"],["script","document.createTextNode"],["script","style"],["script","shown_at"],["script","adsSrc"],["script","/fetch|adb/i"],["script","window.open"],["script",";break;case $."],["script","adblockimg"],["script","showAd"],["script","imgSrc"],["script","document.createElement(\"script\")"],["script","googlesyndication"],["script","antiAdBlock"],["script","/fairAdblock|popMagic/"],["script","/pop1stp|detectAdBlock/"],["script","popundersPerIP"],["script","popunder"],["script","aclib.runPop"],["script","mega-enlace.com/ext.php?o="],["script","Popup"],["script","catch"],["script","displayAdsV3"],["script",";}}};break;case $."],["script","adblocker"],["script","/interceptClickEvent|onbeforeunload|popMagic|location\\.replace/"],["script","UrlLink"],["script","admiral"],["script","/adm|adb/i"],["script","/-Ads-close|preventDefault|ai-debug|b2a|split|reload/"],["script","ai_adb"],["script","/ABDetected|navigator.brave|fetch/"],["script","/bypass.php"],["script","htmls"],["script","/\\/detected\\.html|Adblock/"],["script","toast"],["script","AdbModel"],["script","popup"],["script","antiAdBlockerHandler"],["script","/ad\\s?block|adsBlocked|document\\.write\\(unescape\\('|devtool/i"],["script","onerror"],["script","location.assign"],["script","location.href"],["script","/checkAdBlocker|AdblockRegixFinder/"],["script","adb_detected"],["script","/aclib|break;|zoneNativeSett/"],["script","/AdbModel|showPopup/"],["script","/fetch|popupshow/"],["script","justDetectAdblock"],["script","openPopup"],["style","text-decoration"],["script","push"],["script","AdBlocker"],["script","clicky"],["script","charCodeAt"],["script","/h=decodeURIComponent|\"popundersPerIP\"/"],["script","popMagic"],["script","/popMagic|pop1stp/"],["script","/adblock|location\\.replace/"],["script","/downloadJSAtOnload|Object.prototype.toString.call/"],["script","numberPages"],["script","KCgpPT57bGV0IGU"],["script","error-report.com"],["script","adShield"],["script","AdblockRegixFinder"],["script","serve"],["script","/\\.pop\\(\\); \\}|AdSlot created|Created AdSlot|\\.length % 2; \\}/"],["script","/ConsoleBan|alert|AdBlocker/"],["script","runPop"],["script","mdpDeblocker"],["script","alert","condition","adblock"],["script","adb"],["script","/deblocker|chp_ad/"],["script","await fetch"],["script","innerHTML"],["script","/'.adsbygoogle'|text-danger|warning|Adblock|_0x/"],["script","popUnder"],["#text","/スポンサーリンク|Sponsored Link|广告/"],["#text","スポンサーリンク"],["#text","スポンサードリンク"],["#text","/\\[vkExUnit_ad area=(after|before)\\]/"],["#text","【広告】"],["#text","【PR】"],["#text","関連動画"],["#text","PR:"],["script","leave_recommend"],["#text","/Advertisement/"],["script","zfgloaded"],["script","HTMLAllCollection"],["script","liedetector"],["script","popWin"],["script","end_click"],["script","ad blocker"],["script","closeAd"],["script","/modal|popupads/"],["script","/adconfig/i"],["script","AdblockDetector"],["script","is_antiblock_refresh"],["script","/userAgent|adb|htmls/"],["script","myModal"],["script","ad_block"],["script","app_checkext"],["script","clientHeight"],["script","/url_key|adHtml/"],["script","pop.target"],["script","axios"],["script","ad block"],["script","\"v4ac1eiZr0\""],["script","/charAt|XMLHttpRequest/"],["script","AdBlockEnabled"],["script","window.location.replace"],["script","/$.*open/"],["script","Brave"],["script","egoTab"],["script","abDetectorPro"],["script","/$.*(css|oncontextmenu)/"],["script","/eval.*RegExp/"],["script","wwads"],["script","/\\[\\'push\\'\\]/"],["script","/adblock/i"],["script","/$.*adUnits/"],["script","decodeURIComponent"],["script","RegExp"],["script","adbl"],["script","doOpen"],["script","adsBlocked"],["script","chkADB"],["script","AaDetector"],["script","AdBlock"],["script","Symbol.iterator"],["script","/innerHTML.*appendChild/"],["script","Exo"],["script","detectAdBlock"],["script","/window\\[\\'open\\'\\]/"],["script","Error"],["script","document.head.appendChild"],["script","adsPlay"],["script","pop1stp"],["script","Number"],["script","NEXT_REDIRECT"],["script","ad-block-activated"],["script","insertBefore"],["script","pop.doEvent"],["script","/adbl/i"],["script","detect"],["script","fetch"],["script","/join\\(\\'\\'\\)/"],["script","/join\\(\\\"\\\"\\)/"],["script","api.dataunlocker.com"],["script","vglnk"],["script","/RegExp\\(\\'/","condition","RegExp"],["script","/event\\.keyCode|DisableDevtool/"],["script","/while \\(!!\\[\\]\\)|String\\(\\)\\.fromCharCode|\\.join\\(\\w+\\)\\.split\\(\\w+\\)|\"undefined\"|_\\$|\\$_|\\[\\d+\\][^=]*==|\\.substr|\\.charAt|\\.reduce|!!|\\$document|Function\\s*[,;]|var [^=]+=window\\[/"],["script","/detectAdBlock|\\(typeof [a-z]{10","25} \\=\\=\\=? (\"undefined\"|\"function\")\\)|_0x|'\\/func'/"],["script","NREUM"]];

const hostnamesMap = new Map([["alpin.de",0],["boersennews.de",0],["chefkoch.de",0],["chip.de",0],["clever-tanken.de",0],["desired.de",0],["donnerwetter.de",0],["fanfiktion.de",0],["focus.de",0],["formel1.de",0],["frustfrei-lernen.de",0],["gewinnspiele.tv",0],["giga.de",0],["gut-erklaert.de",0],["kino.de",0],["messen.de",0],["nickles.de",0],["nordbayern.de",0],["spielfilm.de",0],["teltarif.de",0],["unsere-helden.com",0],["weltfussball.at",0],["watson.de",0],["moviepilot.de",[0,4]],["aupetitparieur.com",1],["allthingsvegas.com",1],["100percentfedup.com",1],["beforeitsnews.com",1],["concomber.com",1],["conservativebrief.com",1],["conservativefiringline.com",1],["dailylol.com",1],["funnyand.com",1],["letocard.fr",1],["mamieastuce.com",1],["meilleurpronostic.fr",1],["patriotnationpress.com",1],["toptenz.net",1],["vitamiiin.com",1],["writerscafe.org",1],["populist.press",1],["dailytruthreport.com",1],["livinggospeldaily.com",1],["first-names-meanings.com",1],["welovetrump.com",1],["thehayride.com",1],["thelibertydaily.com",1],["thepoke.co.uk",1],["thepolitistick.com",1],["theblacksphere.net",1],["shark-tank.com",1],["naturalblaze.com",1],["greatamericanrepublic.com",1],["dailysurge.com",1],["truthlion.com",1],["flagandcross.com",1],["westword.com",1],["republicbrief.com",1],["freedomfirstnetwork.com",1],["phoenixnewtimes.com",1],["designbump.com",1],["clashdaily.com",1],["madworldnews.com",1],["reviveusa.com",1],["sonsoflibertymedia.com",1],["thedesigninspiration.com",1],["videogamesblogger.com",1],["protrumpnews.com",1],["thepalmierireport.com",1],["kresy.pl",1],["thepatriotjournal.com",1],["gellerreport.com",1],["thegatewaypundit.com",1],["wltreport.com",1],["miaminewtimes.com",1],["politicalsignal.com",1],["rightwingnews.com",1],["bigleaguepolitics.com",1],["comicallyincorrect.com",1],["web.de",2],["skidrowreloaded.com",[3,14]],["buffsports.me",[3,48]],["rnbastreams.com",3],["4kwebplay.xyz",3],["qqwebplay.xyz",3],["totalsportek.to",3],["eztvx.to",3],["topstreams.info",3],["lewblivehdplay.ru",3],["claplivehdplay.ru",3],["viwlivehdplay.ru",3],["antennasports.ru",3],["buffstreams.app",3],["1stream.eu",3],["cracksports.me",[3,13]],["kenitv.me",[3,13]],["mlbbite.net",3],["mlbstreams.ai",3],["soccerworldcup.me",[3,13]],["topembed.pw",3],["crackstreamer.net",3],["methstreamer.com",3],["yts.mx",6],["upornia.com",8],["pinsystem.co.uk",9],["elrellano.com",9],["tinyppt.com",9],["bharathwick.com",9],["descargaspcpro.net",9],["dx-tv.com",9],["rt3dmodels.com",9],["plc4me.com",9],["blisseyhusbands.com",9],["madaradex.org",9],["trigonevo.com",9],["franceprefecture.fr",9],["jazbaat.in",9],["aipebel.com",9],["veganab.co",9],["camdigest.com",9],["learnmany.in",9],["amanguides.com",[9,61]],["highkeyfinance.com",[9,61]],["appkamods.com",9],["techacode.com",9],["djqunjab.in",9],["downfile.site",9],["expertvn.com",9],["trangchu.news",9],["3dmodelshare.org",9],["nulleb.com",9],["asiaon.top",9],["coursesghar.com",9],["thecustomrom.com",9],["snlookup.com",9],["bingotingo.com",9],["ghior.com",9],["3dmili.com",9],["karanpc.com",9],["plc247.com",9],["apkdelisi.net",9],["javindo.eu.org",9],["chindohot.site",9],["freepasses.org",9],["tomarnarede.pt",9],["basketballbuzz.ca",9],["dribbblegraphics.com",9],["kemiox.com",9],["checkersmenu.us",9],["teksnologi.com",9],["dollareuro.live",9],["eporner.com",11],["javtiful.com",[11,14]],["germancarforum.com",12],["innateblogger.com",12],["cybercityhelp.in",12],["streamnoads.com",[13,14,48]],["bowfile.com",13],["cloudvideo.tv",[13,48]],["coloredmanga.com",13],["embedstream.me",[13,14,48]],["exeo.app",13],["hiphopa.net",[13,14]],["megaup.net",13],["olympicstreams.co",[13,48]],["tv247.us",[13,14]],["uploadhaven.com",13],["userscloud.com",[13,48]],["mdfx9dc8n.net",14],["mdzsmutpcvykb.net",14],["mixdrop21.net",14],["mixdropjmk.pw",14],["y2tube.pro",14],["123movies4u.site",14],["1337xporn.com",14],["141jav.com",14],["1bit.space",14],["1bitspace.com",14],["38dh2.top",14],["3dporndude.com",14],["4archive.org",14],["4horlover.com",14],["560pmovie.com",14],["60fps.xyz",14],["85tube.com",14],["85videos.com",14],["8xlinks.click",14],["a2zcrackworld.com",14],["aazzz.xyz",14],["acefile.co",14],["actusports.eu",14],["adclickersbot.com",14],["adricami.com",14],["adslink.pw",14],["adultstvlive.com",14],["adz7short.space",14],["aeblender.com",14],["ahdafnews.blogspot.com",14],["ak47sports.com",14],["akuma.moe",14],["allplayer.tk",14],["allstreaming.online",14],["amadoras.cf",14],["amadorasdanet.shop",14],["amateurblog.tv",14],["androidadult.com",14],["anhsexjav.xyz",14],["anidl.org",14],["anime-loads.org",14],["animeblkom.net",14],["animefire.plus",14],["animelek.me",14],["animespire.net",14],["animestotais.xyz",14],["animeyt.es",14],["anroll.net",14],["anymoviess.xyz",14],["aotonline.org",14],["asenshu.com",14],["asialiveaction.com",14],["asianclipdedhd.net",14],["askim-bg.com",14],["asumsikedaishop.com",14],["avcrempie.com",14],["avseesee.com",14],["gettapeads.com",14],["backfirstwo.com",14],["bajarjuegospcgratis.com",14],["balkanportal.net",14],["balkanteka.net",14],["bdnewszh.com",[14,48]],["belowporn.com",14],["bestclaimtrx.xyz",14],["bestgirlsexy.com",14],["bestnhl.com",14],["bestporn4free.com",14],["bestporncomix.com",14],["bet36.es",14],["bikinitryon.net",14],["birdurls.com",14],["bitsearch.to",14],["blackcockadventure.com",14],["blackcockchurch.org",14],["blackporncrazy.com",14],["blizzboygames.net",14],["blizzpaste.com",14],["blkom.com",14],["blog-peliculas.com",14],["blogtrabalhista.com",14],["blurayufr.xyz",14],["bobsvagene.club",14],["bolly4umovies.click",14],["bonusharian.pro",14],["brilian-news.id",14],["brupload.net",14],["bucitana.com",14],["cablegratis.online",14],["camchickscaps.com",14],["camgirlcum.com",14],["camgirls.casa",14],["cashurl.in",14],["castingx.net",14],["ccurl.net",[14,48]],["celebrity-leaks.net",14],["cgpelis.net",14],["charexempire.com",14],["choosingnothing.com",14],["clasico.tv",14],["clik.pw",14],["coin-free.com",[14,58]],["coins100s.fun",14],["comicsmanics.com",14],["compucalitv.com",14],["coolcast2.com",14],["cosplaytab.com",14],["countylocalnews.com",14],["cpmlink.net",14],["crackstreamshd.click",14],["crespomods.com",14],["crisanimex.com",14],["crunchyscan.fr",14],["cuevana3.fan",14],["cuevana3hd.com",14],["cumception.com",14],["curvaweb.com",14],["cutpaid.com",14],["cypherscans.xyz",[14,48]],["datawav.club",14],["daughtertraining.com",14],["deepgoretube.site",14],["deltabit.co",14],["depvailon.com",14],["derleta.com",14],["desivdo.com",14],["desixx.net",14],["detikkebumen.com",14],["deutschepornos.me",14],["diasoft.xyz",14],["directupload.net",14],["diskusscan.com",14],["dixva.com",14],["doctormalay.com",14],["dofusports.xyz",14],["dogemate.com",14],["doods.cam",14],["doodskin.lat",14],["downloadrips.com",14],["downvod.com",14],["dphunters.mom",14],["dragontranslation.com",14],["duddes.xyz",14],["dvdfullestrenos.com",14],["easylinks.in",14],["ebookbb.com",14],["ebookhunter.net",14],["egyanime.com",14],["egygost.com",14],["egyshare.cc",14],["ekasiwap.com",14],["electro-torrent.pl",14],["elil.cc",14],["embed4u.xyz",14],["eplayer.click",14],["erovoice.us",14],["eroxxx.us",14],["estrenosdoramas.net",14],["everia.club",14],["everythinginherenet.blogspot.com",14],["extrafreetv.com",14],["extremotvplay.com",14],["fapinporn.com",14],["fapptime.com",14],["fashionblog.tv",14],["fastreams.live",14],["faucethero.com",14],["fembed.com",14],["femdom-joi.com",14],["fileone.tv",14],["film1k.com",14],["filmeonline2023.net",14],["filmesonlinex.org",14],["filmesonlinexhd.biz",[14,48]],["filmovitica.com",14],["filmymaza.blogspot.com",14],["filthy.family",14],["firstmovies.to",14],["fixfinder.click",14],["flostreams.xyz",14],["flyfaucet.com",14],["footyhunter.lol",14],["footyhunter3.xyz",[14,48]],["forex-golds.com",14],["forex-trnd.com",14],["forumchat.club",14],["forumlovers.club",14],["freemoviesonline.biz",14],["freeomovie.co.in",14],["freeomovie.to",14],["freeporncomic.net",14],["freepornhdonlinegay.com",14],["freeproxy.io",14],["freeuse.me",14],["freeusexporn.com",14],["fsicomics.com",14],["gambarbogel.xyz",14],["gamepcfull.com",14],["gameronix.com",14],["gamesfullx.com",14],["gameshdlive.net",14],["gameshdlive.xyz",14],["gamesmountain.com",14],["gamesrepacks.com",14],["gamingguru.fr",14],["gamovideo.com",14],["garota.cf",14],["gaydelicious.com",14],["gaypornmasters.com",14],["gaysex69.net",14],["gemstreams.com",14],["get-to.link",14],["girlscanner.org",14],["giurgiuveanul.ro",14],["gledajcrtace.xyz",14],["gocast2.com",14],["gomo.to",14],["gostosa.cf",14],["gtlink.co",14],["gwiazdypornosow.pl",14],["haho.moe",14],["hatsukimanga.com",14],["hayhd.net",14],["hdsaprevodom.com",14],["hdstreamss.club",14],["hentais.tube",14],["hentaistream.co",14],["hentaitk.net",14],["hentaitube.online",14],["hentaiworld.tv",14],["hesgoal.tv",14],["hexupload.net",14],["hhkungfu.tv",14],["highlanderhelp.com",14],["hindimean.com",14],["hindimovies.to",[14,48]],["hiperdex.com",14],["hispasexy.org",14],["hitprn.com",14],["hoca4u.com",14],["hollymoviehd.cc",14],["hoodsite.com",14],["hopepaste.download",14],["hornylips.com",14],["hotgranny.live",14],["hotmama.live",14],["hqcelebcorner.net",14],["huren.best",14],["hwnaturkya.com",[14,48]],["hxfile.co",[14,48]],["igfap.com",14],["ihdstreams.xyz",14],["iklandb.com",14],["illink.net",14],["imgkings.com",14],["imgsex.xyz",14],["imx.to",14],["influencersgonewild.org",14],["infosgj.free.fr",14],["investnewsbrazil.com",14],["itdmusics.com",14],["itsuseful.site",14],["itunesfre.com",14],["iwatchfriendsonline.net",[14,114]],["jackstreams.com",14],["jatimupdate24.com",14],["jav-fun.cc",14],["jav-scvp.com",14],["javcl.com",14],["javf.net",14],["javhay.net",14],["javhoho.com",14],["javhun.com",14],["javleak.com",14],["javporn.best",14],["javsex.to",14],["jimdofree.com",14],["jiofiles.org",14],["jorpetz.com",14],["journalyc.online",14],["jp-films.com",14],["jpop80ss3.blogspot.com",14],["jpopsingles.eu",[14,29]],["kantotflix.net",14],["kantotinyo.com",14],["kaoskrew.org",14],["kaplog.com",14],["keralatvbox.com",14],["kickassanimes.io",14],["kimochi.info",14],["kimochi.tv",14],["kinemania.tv",14],["konstantinova.net",14],["koora-online.live",14],["kunmanga.com",14],["kutmoney.com",14],["kwithsub.com",14],["ladangreceh.xyz",14],["lat69.me",14],["latinblog.tv",14],["latinomegahd.net",14],["lazyfaucet.com",14],["leechpremium.link",14],["legendas.dev",14],["legendei.net",14],["lightdlmovies.blogspot.com",14],["lighterlegend.com",14],["linclik.com",14],["linkebr.com",14],["linkrex.net",14],["links.worldfree4u-lol.online",14],["linksfy.co",14],["lody.ink",14],["lovesomecommunity.com",14],["lulustream.com",[14,48]],["luluvdo.com",[14,48]],["luzcameraeacao.shop",14],["manga-oni.com",14],["mangaboat.com",14],["mangagenki.me",14],["mangahere.onl",14],["mangaweb.xyz",14],["mangoporn.net",14],["manhwahentai.me",14],["masahub.com",14],["masahub.net",14],["maturegrannyfuck.com",14],["mdy48tn97.com",14],["mediapemersatubangsa.com",14],["mega-mkv.com",14],["megapastes.com",14],["megapornpics.com",14],["messitv.net",14],["meusanimes.net",14],["milfmoza.com",14],["milfzr.com",14],["millionscast.com",14],["mimaletamusical.blogspot.com",14],["mitly.us",14],["mkv-pastes.com",14],["modb.xyz",14],["monaskuliner.ac.id",14],["moredesi.com",14],["movgotv.net",14],["movi.pk",14],["movierr.online",14],["movieswbb.com",14],["moviewatch.com.pk",14],["mp4upload.com",14],["mrskin.live",14],["multicanaistv.com",14],["mundowuxia.com",14],["myeasymusic.ir",14],["myonvideo.com",14],["myyouporn.com",14],["narutoget.info",14],["naughtypiss.com",14],["nerdiess.com",14],["new-fs.eu",14],["newtorrentgame.com",14],["nflstreams.me",14],["niaomea.me",[14,48]],["nicekkk.com",14],["nicesss.com",14],["nlegs.com",14],["nolive.me",[14,48]],["nopay.info",14],["nopay2.info",[14,152]],["notformembersonly.com",14],["novamovie.net",14],["novelpdf.xyz",14],["novelssites.com",[14,48]],["novelup.top",14],["nsfwr34.com",14],["nu6i-bg-net.com",14],["nudebabesin3d.com",14],["nukedfans.com",14],["nuoga.eu",14],["nzbstars.com",14],["ohjav.com",14],["ojearnovelas.com",14],["okanime.xyz",14],["olarixas.xyz",14],["oldbox.cloud",14],["olweb.tv",14],["olympicstreams.me",14],["on9.stream",14],["oncast.xyz",14],["onepiece-mangaonline.com",14],["onifile.com",14],["onionstream.live",14],["onlinesaprevodom.net",14],["onlyfullporn.video",14],["onplustv.live",14],["originporn.com",14],["ovagames.com",14],["ovamusic.com",14],["owllink.net",14],["packsporn.com",14],["pahaplayers.click",14],["palimas.org",14],["pandafiles.com",14],["papahd.club",14],["papahd1.xyz",14],["password69.com",14],["pastemytxt.com",14],["payskip.org",14],["peeplink.in",14],["peliculasmx.net",14],["pervertgirlsvideos.com",14],["pervyvideos.com",14],["phim12h.com",14],["picdollar.com",14],["pickteenz.com",14],["pics4you.net",14],["picsxxxporn.com",14],["pinayscandalz.com",14],["pinkueiga.net",14],["piratefast.xyz",14],["piratehaven.xyz",14],["pirateiro.com",14],["pirlotvonline.org",14],["playtube.co.za",14],["plugintorrent.com",14],["pmvzone.com",14],["porndish.com",14],["pornez.net",14],["pornfetishbdsm.com",14],["pornfits.com",14],["pornhd720p.com",14],["pornobr.club",14],["pornobr.ninja",14],["pornodominicano.net",14],["pornofaps.com",14],["pornoflux.com",14],["pornotorrent.com.br",14],["pornredit.com",14],["pornstarsyfamosas.es",14],["pornstreams.co",14],["porntn.com",14],["pornxbit.com",14],["pornxday.com",14],["portaldasnovinhas.shop",14],["portugues-fcr.blogspot.com",14],["poscishd.online",14],["poscitesch.com",[14,48]],["poseyoung.com",14],["pover.org",14],["proxyninja.org",14],["pubfilmz.com",14],["publicsexamateurs.com",14],["punanihub.com",14],["putlocker5movies.org",14],["pxxbay.com",14],["r18.best",14],["ragnaru.net",14],["rapbeh.net",14],["rapelust.com",14],["rapload.org",14],["read-onepiece.net",14],["retro-fucking.com",14],["retrotv.org",14],["robaldowns.com",14],["rockdilla.com",14],["rojadirectatvenvivo.com",14],["rojitadirecta.blogspot.com",14],["romancetv.site",14],["rule34.club",14],["rule34hentai.net",14],["rumahbokep-id.com",14],["safego.cc",14],["safestream.cc",14],["sakurafile.com",14],["satoshi-win.xyz",14],["scat.gold",14],["scatfap.com",14],["scatkings.com",14],["scnlog.me",14],["scripts-webmasters.net",14],["serie-turche.com",14],["serijefilmovi.com",14],["sexcomics.me",14],["sexdicted.com",14],["sexgay18.com",14],["sexofilm.co",14],["sextgem.com",14],["sextubebbw.com",14],["sgpics.net",14],["shadowrangers.live",14],["shahee4u.cam",14],["shahiid-anime.net",14],["shemale6.com",14],["shinden.pl",14],["short.es",14],["showmanga.blog.fc2.com",14],["shrt10.com",14],["shurt.pw",14],["sideplusleaks.net",14],["silverblog.tv",14],["silverpic.com",14],["sinhalasub.life",14],["sinsitio.site",14],["sinvida.me",14],["skidrowcpy.com",14],["skidrowfull.com",14],["slut.mom",14],["smallencode.me",14],["smoner.com",14],["smplace.com",14],["soccerinhd.com",14],["socceron.name",14],["softairbay.com",14],["sokobj.com",14],["songsio.com",14],["souexatasmais.com",14],["sportbar.live",14],["sportea.online",14],["sportskart.xyz",14],["sportstream1.cfd",14],["sporttuna.site",14],["srt.am",14],["srts.me",14],["stakes100.xyz",14],["stbemuiptv.com",14],["stockingfetishvideo.com",14],["stream.crichd.vip",14],["stream.lc",14],["stream25.xyz",14],["streambee.to",14],["streamcenter.pro",14],["streamers.watch",14],["streamgo.to",14],["streamkiste.tv",14],["streamoporn.xyz",14],["streamoupload.xyz",14],["streamservicehd.click",14],["streamvid.net",[14,21]],["subtitleporn.com",14],["subtitles.cam",14],["suicidepics.com",14],["supertelevisionhd.com",14],["supexfeeds.com",14],["swzz.xyz",14],["sxnaar.com",14],["tabooporns.com",14],["taboosex.club",14],["tapeantiads.com",14],["tapeblocker.com",14],["tapenoads.com",14],["tapewithadblock.org",[14,175]],["teamos.xyz",14],["teen-wave.com",14],["teenporncrazy.com",14],["telegramgroups.xyz",14],["telenovelasweb.com",14],["tensei-shitara-slime-datta-ken.com",14],["tfp.is",14],["tgo-tv.co",[14,48]],["thaihotmodels.com",14],["theblueclit.com",14],["thebussybandit.com",14],["theicongenerator.com",14],["thelastdisaster.vip",14],["thepiratebay0.org",14],["thepiratebay10.info",14],["thesexcloud.com",14],["thothub.today",14],["tightsexteens.com",14],["tojav.net",14],["tokyoblog.tv",14],["tonnestreamz.xyz",14],["top16.net",14],["topvideosgay.com",14],["torrage.info",14],["torrents.vip",14],["torrsexvid.com",14],["tpb-proxy.xyz",14],["trannyteca.com",14],["trendytalker.com",14],["tumanga.net",14],["turbogvideos.com",14],["turbovid.me",14],["turkishseriestv.org",14],["turksub24.net",14],["tutele.sx",14],["tutelehd3.xyz",14],["tvglobe.me",14],["tvpclive.com",14],["tvs-widget.com",14],["tvseries.video",14],["ucptt.com",14],["ufaucet.online",14],["ufcfight.online",14],["uhdgames.xyz",14],["ultrahorny.com",14],["ultraten.net",14],["unblockweb.me",14],["underhentai.net",14],["uniqueten.net",14],["upbaam.com",14],["upstream.to",14],["valeriabelen.com",14],["verdragonball.online",14],["vfxmed.com",14],["video.az",14],["videostreaming.rocks",14],["videowood.tv",14],["vidorg.net",14],["vidtapes.com",14],["vidz7.com",14],["vikistream.com",14],["vikv.net",14],["virpe.cc",14],["visifilmai.org",14],["viveseries.com",14],["vladrustov.sx",14],["volokit2.com",14],["vstorrent.org",14],["w-hentai.com",14],["watchaccordingtojimonline.com",14],["watchbrooklynnine-nine.com",14],["watchdowntonabbeyonline.com",14],["watchelementaryonline.com",14],["watcheronline.net",14],["watchgleeonline.com",14],["watchhowimetyourmother.online",14],["watchkobestreams.info",14],["watchlostonline.net",14],["watchlouieonline.com",14],["watchjavidol.com",14],["watchmadmenonline.com",14],["watchmonkonline.com",14],["watchonceuponatimeonline.com",14],["watchparksandrecreation.net",14],["watchprettylittleliarsonline.com",14],["watchrulesofengagementonline.com",14],["watchthekingofqueens.com",14],["watchthemiddleonline.com",14],["watchtvchh.xyz",14],["webcamrips.com",14],["wickedspot.org",14],["wincest.xyz",14],["witanime.best",14],["wolverdon.fun",14],["wolverdonx.com",14],["wordcounter.icu",14],["worldcupstream.pm",14],["worldmovies.store",14],["worldstreams.click",14],["wpdeployit.com",14],["wqstreams.tk",14],["wwwsct.com",14],["xanimeporn.com",14],["xblog.tv",14],["xn--verseriesespaollatino-obc.online",14],["xn--xvideos-espaol-1nb.com",14],["xpornium.net",14],["xsober.com",14],["xvip.lat",14],["xxgasm.com",14],["xxvideoss.org",14],["xxx18.uno",14],["xxxdominicana.com",14],["xxxfree.watch",14],["xxxmax.net",14],["xxxwebdlxxx.top",14],["xxxxvideo.uno",14],["y2b.wiki",14],["yabai.si",14],["yadixv.com",14],["yayanimes.net",14],["yeshd.net",14],["yodbox.com",14],["youjax.com",14],["youpits.xyz",14],["yourdailypornvideos.ws",14],["yourupload.com",14],["ytstv.me",14],["ytstvmovies.co",14],["ytstvmovies.xyz",14],["ytsyify.co",14],["ytsyifymovie.com",14],["zerion.cc",14],["zerocoin.top",14],["zitss.xyz",14],["zpaste.net",14],["zplayer.live",14],["faucet.ovh",15],["oko.sh",[16,32,69]],["variety.com",17],["bigbtc.win",18],["cryptofun.space",18],["sexo5k.com",19],["truyen-hentai.com",19],["theshedend.com",21],["zeroupload.com",21],["securenetsystems.net",21],["miniwebtool.com",21],["bchtechnologies.com",21],["spiegel.de",22],["hausbau-forum.de",23],["kiemlua.com",23],["appnee.com",24],["d0000d.com",25],["d000d.com",25],["d0o0d.com",25],["do0od.com",25],["doods.pro",25],["ds2play.com",25],["ds2video.com",25],["apkmirror.com",26],["musichq.pe",28],["sekaikomik.bio",28],["hiraethtranslation.com",29],["onlyfaucet.com",30],["livecamrips.com",31],["smutty.com",31],["freeadultcomix.com",31],["down.dataaps.com",31],["filmweb.pl",31],["infinityscans.xyz",[32,48]],["infinityscans.net",[32,48]],["tvi.la",[32,69]],["iir.la",[32,69]],["tii.la",[32,69]],["ckk.ai",[32,69]],["oei.la",[32,69]],["lnbz.la",[32,69]],["visionpapers.org",33],["fdownloader.net",34],["thehackernews.com",35],["mielec.pl",36],["camsrip.com",37],["beatsnoop.com",37],["fetchpik.com",37],["hackerranksolution.in",37],["treasl.com",38],["mrbenne.com",39],["cnpics.org",40],["ovabee.com",40],["porn4f.com",40],["cnxx.me",40],["ai18.pics",40],["cuervotv.me",[41,48]],["aliezstream.pro",41],["daddy-stream.xyz",41],["instream.pro",41],["mylivestream.pro",41],["powerover.online",41],["sportea.link",41],["sportsurge.stream",41],["ufckhabib.com",41],["ustream.pro",41],["papa4k.online",41],["streamhd247.info",41],["nowlive1.me",41],["buzter.xyz",41],["gamehdlive.online",41],["hdfungamezz.xyz",41],["kingstreamz.lol",41],["masterpro.club",41],["papahd.co",41],["sportos.co",41],["valhallas.click",41],["andhrafriends.com",42],["freeroms.com",42],["soap2day-online.com",42],["sportsonline.si",43],["fiuxy2.co",44],["animeunity.to",45],["auto-crypto.click",46],["iconicblogger.com",46],["tokopedia.com",47],["xn-----0b4asja7ccgu2b4b0gd0edbjm2jpa1b1e9zva7a0347s4da2797e8qri.xn--1ck2e1b",48],["6movies.net",48],["adsh.cc",48],["afilmyhouse.blogspot.com",48],["ak.sv",48],["animesultra.com",48],["api.webs.moe",48],["apkmody.io",48],["attvideo.com",48],["backfirstwo.site",[48,143]],["crazyblog.in",48],["divicast.com",48],["dlhd.so",48],["embed.meomeo.pw",48],["filmeserialeonline.org",48],["flexyhit.com",48],["foreverwallpapers.com",48],["french-streams.cc",48],["fslinks.org",48],["fstream365.com",48],["hdtoday.to",48],["hinatasoul.com",48],["igg-games.com",48],["membed.net",48],["mgnetu.com",48],["movie4kto.net",48],["mp3juice.info",48],["mp3juices.cc",48],["myflixerz.to",48],["nowmetv.net",48],["nowsportstv.com",48],["nxbrew.com",48],["oii.io",48],["paidshitforfree.com",48],["pepperlive.info",48],["playertv.net",48],["putlocker68.com",48],["roystream.com",48],["rssing.com",48],["s.to",48],["share.filesh.site",48],["sharkfish.xyz",48],["skidrowcodex.net",48],["sports-stream.site",48],["stream4free.live",48],["streamed.su",48],["tamilmobilemovies.in",48],["tapeadsenjoyer.com",48],["thewatchseries.live",48],["tnmusic.in",48],["travelplanspro.com",48],["tusfiles.com",48],["tutlehd4.com",48],["twstalker.com",48],["vid-guard.com",48],["vidco.pro",48],["video-leech.xyz",48],["vidsaver.net",48],["vidspeeds.com",48],["viralitytoday.com",48],["voiranime.stream",48],["watchdoctorwhoonline.com",48],["watchserie.online",48],["webhostingpost.com",48],["woxikon.in",48],["www-y2mate.com",48],["ylink.bid",48],["ytix.xyz",48],["remixsearch.net",49],["remixsearch.es",49],["onlineweb.tools",49],["sharing.wtf",49],["xnxxcom.xyz",50],["armoniscans.top",51],["bentomanga.top",51],["bigcomics.win",51],["brmangas.top",51],["cmoa.pro",51],["hachiraw.top",51],["j8jp.com",51],["janime.top",51],["jpraw.xyz",51],["kakuyomu.in",51],["kkraw.com",51],["komiku.win",51],["lectormanga.top",51],["lermanga.top",51],["manga1000.top",51],["manga1001.xyz",51],["manga1001.win",51],["mangajp.top",51],["mangakl.su",51],["mangaraw.bid",51],["mangavy.com",51],["mangaz.win",51],["scanita.top",51],["shinigami-id.top",51],["sushiscan.top",51],["syosetu.gs",51],["al.com",[52,132]],["cleveland.com",[52,132]],["mlive.com",[52,132]],["nj.com",[52,132]],["oregonlive.com",[52,132]],["cheatsheet.com",52],["pwinsider.com",52],["baeldung.com",52],["tvline.com",[53,132]],["moonplusnews.com",[54,55]],["loanoffering.in",[54,55]],["truyentranhfull.net",55],["spatsify.com",56],["funkeypagali.com",56],["careersides.com",56],["nayisahara.com",56],["wikifilmia.com",56],["infinityskull.com",56],["viewmyknowledge.com",56],["iisfvirtual.in",56],["starxinvestor.com",56],["kenzo-flowertag.com",57],["mdn.lol",57],["btcbitco.in",58],["btcsatoshi.net",58],["cempakajaya.com",58],["crypto4yu.com",58],["gainl.ink",58],["manofadan.com",58],["readbitcoin.org",58],["wiour.com",58],["kienthucrangmieng.com",58],["tremamnon.com",58],["btc25.org",58],["tron-free.com",58],["bitsmagic.fun",58],["ourcoincash.xyz",58],["hynews.biz",58],["blog.cryptowidgets.net",59],["blog.insurancegold.in",59],["blog.wiki-topia.com",59],["blog.coinsvalue.net",59],["blog.cookinguide.net",59],["blog.freeoseocheck.com",59],["aylink.co",60],["sugarona.com",61],["nishankhatri.xyz",61],["cety.app",62],["exego.app",62],["cutlink.net",62],["cutsy.net",62],["cutyurls.com",62],["cutty.app",62],["cutnet.net",62],["javhdo.net",62],["tinys.click",63],["answerpython.com",63],["gsm-solution.com",63],["h-donghua.com",63],["hindisubbedacademy.com",63],["pkgovjobz.com",63],["ripexbooster.xyz",63],["serial4.com",63],["serial412.blogspot.com",63],["sigmalinks.in",63],["tutorgaming.com",63],["everydaytechvams.com",63],["dipsnp.com",63],["cccam4sat.com",63],["aiimgvlog.fun",64],["appsbull.com",65],["diudemy.com",65],["maqal360.com",65],["mphealth.online",65],["makefreecallsonline.com",65],["androjungle.com",65],["bookszone.in",65],["drakescans.com",65],["shortix.co",65],["msonglyrics.com",65],["app-sorteos.com",65],["bokugents.com",65],["client.pylexnodes.net",65],["btvplus.bg",65],["blog24.me",[66,67]],["coingraph.us",68],["impact24.us",68],["atglinks.com",70],["cinedesi.in",71],["thevouz.in",71],["tejtime24.com",71],["techishant.in",71],["kbconlinegame.com",72],["hamrojaagir.com",72],["odijob.com",72],["blogesque.net",73],["bookbucketlyst.com",73],["explorosity.net",73],["optimizepics.com",73],["torovalley.net",73],["simana.online",74],["unblocked.id",76],["listendata.com",77],["7xm.xyz",77],["fastupload.io",77],["azmath.info",77],["wouterplanet.com",78],["androidacy.com",79],["pillowcase.su",80],["veryfreeporn.com",81],["theporngod.com",81],["besthdgayporn.com",82],["drivenime.com",82],["javup.org",82],["shemaleup.net",82],["austiblox.net",83],["btcbunch.com",84],["teachoo.com",85],["interfootball.co.kr",86],["a-ha.io",86],["cboard.net",86],["jjang0u.com",86],["joongdo.co.kr",86],["viva100.com",86],["thephoblographer.com",86],["gamingdeputy.com",86],["thesaurus.net",86],["alle-tests.nl",86],["maketecheasier.com",86],["automobile-catalog.com",86],["allthekingz.com",86],["motorbikecatalog.com",86],["tweaksforgeeks.com",86],["m.inven.co.kr",86],["meconomynews.com",86],["brandbrief.co.kr",86],["motorgraph.com",86],["allthetests.com",87],["javatpoint.com",87],["globalrph.com",87],["carscoops.com",87],["indiatimes.com",87],["issuya.com",87],["topstarnews.net",87],["islamicfinder.org",87],["secure-signup.net",87],["worldhistory.org",88],["bitcotasks.com",89],["udvl.com",90],["www.chip.de",91],["topsporter.net",92],["sportshub.to",92],["streamcheck.link",93],["unofficialtwrp.com",94],["bitcosite.com",95],["bitzite.com",95],["easymc.io",96],["yunjiema.top",96],["hacoos.com",98],["bondagevalley.cc",99],["zefoy.com",100],["vidello.net",101],["resizer.myct.jp",102],["gametohkenranbu.sakuraweb.com",103],["jisakuhibi.jp",104],["rank1-media.com",104],["lifematome.blog",105],["fm.sekkaku.net",106],["free-avx.jp",107],["dvdrev.com",108],["betweenjpandkr.blog",109],["nft-media.net",110],["ghacks.net",111],["songspk2.info",112],["zoechip.com",113],["nectareousoverelate.com",115],["khoaiphim.com",116],["haafedk2.com",117],["fordownloader.com",117],["jovemnerd.com.br",118],["nicomanga.com",119],["totalcsgo.com",120],["vivamax.asia",121],["manysex.com",122],["gaminginfos.com",123],["tinxahoivn.com",124],["forums-fastunlock.com",125],["automoto.it",126],["codelivly.com",127],["ophim.vip",128],["touguatize.monster",129],["novelhall.com",130],["hes-goal.net",131],["abc17news.com",132],["adoredbyalex.com",132],["agrodigital.com",132],["aliontherunblog.com",132],["allaboutthetea.com",132],["allmovie.com",132],["allmusic.com",132],["allthingsthrifty.com",132],["amessagewithabottle.com",132],["androidpolice.com",132],["antyradio.pl",132],["artforum.com",132],["artnews.com",132],["awkward.com",132],["awkwardmom.com",132],["bailiwickexpress.com",132],["barnsleychronicle.com",132],["becomingpeculiar.com",132],["bethcakes.com",132],["betweenenglandandiowa.com",132],["blogher.com",132],["bluegraygal.com",132],["briefeguru.de",132],["carmagazine.co.uk",132],["cattime.com",132],["cbr.com",132],["cbssports.com",132],["celiacandthebeast.com",132],["chaptercheats.com",132],["collider.com",132],["comingsoon.net",132],["commercialobserver.com",132],["competentedigitale.ro",132],["crafty.house",132],["dailyvoice.com",132],["decider.com",132],["didyouknowfacts.com",132],["dogtime.com",132],["dualshockers.com",132],["dustyoldthing.com",132],["faithhub.net",132],["femestella.com",132],["footwearnews.com",132],["freeconvert.com",132],["frogsandsnailsandpuppydogtail.com",132],["fsm-media.com",132],["funtasticlife.com",132],["fwmadebycarli.com",132],["gamerant.com",132],["gfinityesports.com",132],["givemesport.com",132],["gulflive.com",132],["helloflo.com",132],["homeglowdesign.com",132],["honeygirlsworld.com",132],["hotcars.com",132],["howtogeek.com",132],["insider-gaming.com",132],["insurancejournal.com",132],["jasminemaria.com",132],["kion546.com",132],["lehighvalleylive.com",132],["lettyskitchen.com",132],["lifeinleggings.com",132],["liveandletsfly.com",132],["lizzieinlace.com",132],["localnews8.com",132],["lonestarlive.com",132],["madeeveryday.com",132],["maidenhead-advertiser.co.uk",132],["makeuseof.com",132],["mardomreport.net",132],["melangery.com",132],["milestomemories.com",132],["modernmom.com",132],["momtastic.com",132],["mostlymorgan.com",132],["motherwellmag.com",132],["movieweb.com",132],["muddybootsanddiamonds.com",132],["musicfeeds.com.au",132],["mylifefromhome.com",132],["nationalreview.com",132],["neoskosmos.com",132],["nordot.app",132],["nothingbutnewcastle.com",132],["nsjonline.com",132],["oakvillenews.org",132],["observer.com",132],["ourlittlesliceofheaven.com",132],["palachinkablog.com",132],["pinkonthecheek.com",132],["politicususa.com",132],["predic.ro",132],["puckermom.com",132],["qtoptens.com",132],["realgm.com",132],["reelmama.com",132],["robbreport.com",132],["royalmailchat.co.uk",132],["samchui.com",132],["sandrarose.com",132],["screenrant.com",132],["sheknows.com",132],["sherdog.com",132],["sidereel.com",132],["silive.com",132],["simpleflying.com",132],["sloughexpress.co.uk",132],["spacenews.com",132],["sportsgamblingpodcast.com",132],["spotofteadesigns.com",132],["stacysrandomthoughts.com",132],["ssnewstelegram.com",132],["superherohype.com",132],["tablelifeblog.com",132],["thebeautysection.com",132],["thecelticblog.com",132],["thecurvyfashionista.com",132],["thefashionspot.com",132],["thegamer.com",132],["thegamescabin.com",132],["thenerdyme.com",132],["thenonconsumeradvocate.com",132],["theprudentgarden.com",132],["thethings.com",132],["timesnews.net",132],["topspeed.com",132],["toyotaklub.org.pl",132],["travelingformiles.com",132],["tutsnode.org",132],["viralviralvideos.com",132],["wannacomewith.com",132],["wimp.com",132],["windsorexpress.co.uk",132],["woojr.com",132],["worldoftravelswithkids.com",132],["xda-developers.com",132],["masslive.com",132],["pagesix.com",132],["pennlive.com",132],["syracuse.com",132],["bagi.co.in",133],["keran.co",133],["biblestudytools.com",134],["christianheadlines.com",134],["ibelieve.com",134],["kuponigo.com",135],["kimcilonly.site",136],["kimcilonly.link",136],["cryptoearns.com",137],["inxxx.com",138],["ipaspot.app",139],["embedwish.com",140],["filelions.live",140],["leakslove.net",140],["jenismac.com",141],["vxetable.cn",142],["jewelavid.com",143],["nizarstream.com",143],["snapwordz.com",144],["toolxox.com",144],["rl6mans.com",144],["idol69.net",144],["plumbersforums.net",145],["123movies57.online",146],["gulio.site",147],["mediaset.es",148],["izlekolik.net",149],["donghuaworld.com",150],["letsdopuzzles.com",151],["tainio-mania.online",152],["hes-goals.io",153],["pkbiosfix.com",153],["casi3.xyz",153],["rediff.com",154],["dzapk.com",155],["darknessporn.com",156],["familyporner.com",156],["freepublicporn.com",156],["pisshamster.com",156],["punishworld.com",156],["xanimu.com",156],["pig69.com",157],["cosplay18.pics",157],["eroticmoviesonline.me",158],["teleclub.xyz",159],["ecamrips.com",160],["showcamrips.com",160],["tucinehd.com",162],["9animetv.to",163],["qiwi.gg",164],["jornadaperfecta.com",165],["loseart.com",166],["sousou-no-frieren.com",167],["intro-hd.net",168],["monacomatin.mc",168],["nodo313.net",168],["unite-guide.com",169],["thebullspen.com",170],["botcomics.com",171],["cefirates.com",171],["chandlerorchards.com",171],["comicleaks.com",171],["marketdata.app",171],["monumentmetals.com",171],["tapmyback.com",171],["ping.gg",171],["revistaferramental.com.br",171],["hawpar.com",171],["alpacafinance.org",[171,172]],["nookgaming.com",171],["enkeleksamen.no",171],["kvest.ee",171],["creatordrop.com",171],["panpots.com",171],["cybernetman.com",171],["bitdomain.biz",171],["gerardbosch.xyz",171],["fort-shop.kiev.ua",171],["accuretawealth.com",171],["resourceya.com",171],["tracktheta.com",171],["camberlion.com",171],["replai.io",171],["trybawaryjny.pl",171],["tt.live",172],["future-fortune.com",172],["abhijith.page",172],["madrigalmaps.com",172],["adventuretix.com",172],["bolighub.dk",172],["panprices.com",173],["intercity.technology",173],["freelancer.taxmachine.be",173],["adria.gg",173],["fjlaboratories.com",173],["emanualonline.com",173],["proboards.com",174],["winclassic.net",174],["financemonk.net",176],["japscan.lol",177],["client.falixnodes.net",178],["abema.tv",179]]);

const entitiesMap = new Map([["mixdrop",[3,14]],["wawacity",3],["pahe",[5,14]],["soap2day",5],["hqq",7],["waaw",7],["mhdsports",9],["mhdsportstv",9],["mhdtvsports",9],["mhdtvworld",9],["mhdtvmax",9],["mhdstream",9],["reset-scans",9],["poplinks",[9,65]],["pixhost",10],["viprow",[13,14,48]],["bluemediadownload",13],["bluemediafile",13],["bluemedialink",13],["bluemediastorage",13],["bluemediaurls",13],["urlbluemedia",13],["cloudvideotv",[13,48]],["vidsrc",[13,48]],["123-movies",14],["123movieshd",14],["123movieshub",14],["123moviesme",14],["1337x",[14,27]],["1stream",14],["1tamilmv",14],["2ddl",14],["2umovies",14],["3hiidude",14],["4stream",14],["5movies",14],["7hitmovies",14],["9xmovie",14],["9xlinks",14],["aagmaal",[14,48]],["adblockeronstape",14],["adblockeronstreamtape",14],["adblockplustape",14],["adblockstreamtape",14],["adblockstrtape",14],["adblockstrtech",14],["adblocktape",14],["adcorto",14],["alexsports",14],["alexsportss",14],["alexsportz",14],["animepahe",14],["animesanka",14],["animixplay",14],["aniplay",14],["antiadtape",14],["asianclub",14],["ask4movie",14],["atomixhq",[14,48]],["atomohd",14],["beinmatch",[14,20]],["bhaai",14],["buffstreams",14],["canalesportivo",14],["clickndownload",14],["clicknupload",14],["daddylive",[14,48]],["daddylivehd",[14,48]],["ddrmovies",14],["desiremovies",14],["devlib",14],["divxtotal",14],["divxtotal1",14],["dlhd",14],["dvdplay",[14,48]],["elixx",14],["enjoy4k",14],["estrenosflix",14],["estrenosflux",14],["estrenosgo",14],["f1stream",14],["fbstream",14],["file4go",14],["filmymeet",14],["filmyzilla",[14,48]],["findav",14],["findporn",14],["flixmaza",14],["flizmovies",14],["freetvsports",14],["fullymaza",14],["g3g",14],["gotxx",14],["grantorrent",14],["hdmoviesfair",[14,48]],["hdmoviesflix",14],["hiidudemoviez",14],["imgsen",14],["imgsto",14],["incest",14],["incestflix",14],["itopmusic",14],["javmost",14],["keeplinks",14],["keepvid",14],["keralahd",14],["khatrimazaful",14],["khatrimazafull",14],["leechall",14],["linkshorts",14],["mangovideo",14],["masaporn",14],["miniurl",14],["mirrorace",14],["mixdroop",14],["mkvcage",14],["mlbstream",14],["mlsbd",14],["mmsbee",14],["motogpstream",14],["movieplex",14],["movierulzlink",14],["movies123",14],["moviesflix",14],["moviesmeta",14],["moviessources",14],["moviesverse",14],["moviezwaphd",14],["mrunblock",14],["nbastream",14],["newmovierulz",14],["nflstream",14],["nhlstream",14],["noblocktape",14],["nocensor",14],["onlyfams",14],["ouo",14],["pctfenix",[14,48]],["pctnew",[14,48]],["peliculas24",14],["pelisplus",14],["piratebay",14],["plyjam",14],["plylive",14],["plyvdo",14],["pornhoarder",14],["prbay",14],["projectfreetv",14],["proxybit",14],["psarips",14],["racaty",14],["remaxhd",14],["rintor",14],["rnbxclusive",14],["rnbxclusive0",14],["rnbxclusive1",14],["rojadirecta",14],["rojadirectaenvivo",14],["rugbystreams",14],["sadisflix",14],["safetxt",14],["shadowrangers",14],["shahi4u",14],["shahid4u1",14],["shahid4uu",14],["shavetape",14],["shortearn",14],["shorten",14],["shorttey",14],["shortzzy",14],["skymovieshd",14],["socceronline",[14,48]],["softarchive",14],["sports-stream",14],["sshhaa",14],["stapadblockuser",14],["stape",14],["stapewithadblock",14],["starmusiq",14],["strcloud",14],["streamadblocker",[14,48]],["streamadblockplus",14],["streamcdn",14],["streamhub",14],["streamsport",14],["streamta",14],["streamtape",14],["streamtapeadblockuser",14],["strikeout",14],["strtape",14],["strtapeadblock",14],["strtapeadblocker",14],["strtapewithadblock",14],["strtpe",14],["swatchseries",14],["tabooflix",14],["tennisstreams",14],["themoviesflix",14],["thepiratebay",14],["thisav",14],["tmearn",14],["toonanime",14],["torlock",14],["tormalayalam",14],["torrentz2eu",14],["tutelehd",14],["tvply",14],["u4m",14],["ufcstream",14],["unblocknow",14],["uploadbuzz",14],["usagoals",14],["vexmoviex",14],["vidclouds",14],["vidlox",14],["vipbox",[14,48]],["vipboxtv",[14,48]],["vipleague",14],["watch-series",14],["watchseries",14],["xclusivejams",14],["xmoviesforyou",14],["youdbox",14],["ytmp3eu",14],["yts-subs",14],["yts",14],["zooqle",14],["dutchycorp",15],["dood",[25,48]],["doodstream",25],["dooood",[25,48]],["torrentdownload",28],["shrinke",31],["shrinkme",31],["daddylive1",41],["esportivos",41],["poscitechs",41],["bollyflix",41],["watchomovies",[42,48]],["123movies",48],["123moviesla",48],["123movieweb",48],["2embed",48],["720pstream",48],["9xmovies",48],["adshort",48],["allmovieshub",48],["asianplay",48],["atishmkv",48],["cricstream",48],["crictime",48],["databasegdriveplayer",48],["extramovies",48],["faselhd",48],["faselhds",48],["filemoon",48],["filmy",48],["filmyhit",48],["filmywap",48],["fmovies",48],["gdplayer",48],["gdriveplayer",48],["goku",48],["gomovies",48],["gowatchseries",48],["hdfungamezz",48],["hindilinks4u",48],["hurawatch",48],["jalshamoviezhd",48],["livecricket",48],["mhdsport",48],["mkvcinemas",48],["movies2watch",48],["moviespapa",48],["mp4moviez",48],["mydownloadtube",48],["nsw2u",48],["nuroflix",48],["o2tvseries",48],["o2tvseriesz",48],["pirlotv",48],["poscitech",48],["primewire",48],["redecanais",48],["serienstream",48],["sflix",48],["shahed4u",48],["shaheed4u",48],["speedostream",48],["sportcast",48],["sportskart",48],["streamingcommunity",48],["tamilarasan",48],["tamilfreemp3songs",48],["tamilprinthd",48],["torrentdosfilmes",48],["tubemate",48],["uploadrar",48],["uqload",48],["vidcloud9",48],["vido",48],["vidoo",48],["vudeo",48],["vumoo",48],["yesmovies",48],["mydverse",63],["stfly",73],["stly",73],["kickass",75],["cine-calidad",81],["teluguflix",97],["actvid",113],["lk21official",161],["nontondrama",161],["dropgalaxy",176]]);

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
            'loading': 1,
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
