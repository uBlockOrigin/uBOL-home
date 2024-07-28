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

const argsList = [["script","DisplayAcceptableAdIfAdblocked"],["script","/==undefined.*body/"],["script","\"Anzeige\""],["script","Promise"],["script","Reflect"],["script","document.write"],["script","self == top"],["script","/popunder|isAdBlock|admvn.src/i"],["script","deblocker"],["script","exdynsrv"],["script","/adb/i"],["script","adsbygoogle"],["script","FingerprintJS"],["script","/h=decodeURIComponent|popundersPerIP/"],["script","/adblock.php"],["script","/document\\.createElement|\\.banner-in/"],["script","/block-adb|-0x|adblock/"],["script","ExoLoader"],["script","/?key.*open/","condition","key"],["script","adblock"],["script","homad"],["script","Adblock"],["script","alert"],["script","/adblock|popunder/"],["script","document.createTextNode"],["script","style"],["script","shown_at"],["script","/fetch|adb/i"],["script","window.open"],["script",";break;case $."],["script","zaraz"],["script","adblockimg"],["script","showAd"],["script","imgSrc"],["script","document.createElement(\"script\")"],["script","googlesyndication"],["script","antiAdBlock"],["script","/fairAdblock|popMagic/"],["script","/pop1stp|detectAdBlock/"],["script","popundersPerIP"],["script","popunder"],["script","aclib.runPop"],["script","mega-enlace.com/ext.php?o="],["script","adserverDomain"],["script","Popup"],["script","catch"],["script","displayAdsV3"],["script",";}}};break;case $."],["script","adblocker"],["script","/interceptClickEvent|onbeforeunload|popMagic|location\\.replace/"],["script","/-Ads-close|preventDefault|ai-debug|b2a|split|reload/"],["script","ai_adb"],["script","/ABDetected|navigator.brave|fetch/"],["script","/bypass.php"],["script","htmls"],["script","/\\/detected\\.html|Adblock/"],["script","toast"],["script","AdbModel"],["script","popup"],["script","antiAdBlockerHandler"],["script","/ad\\s?block|adsBlocked|document\\.write\\(unescape\\('|devtool/i"],["script","onerror"],["script","location.assign"],["script","location.href"],["script","/checkAdBlocker|AdblockRegixFinder/"],["script","adb_detected"],["script","/aclib|break;|zoneNativeSett/"],["script","/AdbModel|showPopup/"],["script","/fetch|popupshow/"],["script","justDetectAdblock"],["script","openPopup"],["style","text-decoration"],["script","push"],["script","AdBlocker"],["script","clicky"],["script","charCodeAt"],["script","/h=decodeURIComponent|\"popundersPerIP\"/"],["script","popMagic"],["script","/popMagic|pop1stp/"],["script","/adblock|location\\.replace/"],["script","/downloadJSAtOnload|Object.prototype.toString.call/"],["script","numberPages"],["script","KCgpPT57bGV0IGU"],["script","error-report.com"],["script","adShield"],["script","AdblockRegixFinder"],["script","serve"],["script","/\\.pop\\(\\); \\}|AdSlot created|Created AdSlot|\\.length % 2; \\}/"],["script","/ConsoleBan|alert|AdBlocker/"],["script","runPop"],["script","mdpDeblocker"],["script","alert","condition","adblock"],["script","adb"],["script","/deblocker|chp_ad/"],["script","await fetch"],["script","innerHTML"],["script","/'.adsbygoogle'|text-danger|warning|Adblock|_0x/"],["script","popUnder"],["#text","/スポンサーリンク|Sponsored Link|广告/"],["#text","スポンサーリンク"],["#text","スポンサードリンク"],["#text","/\\[vkExUnit_ad area=(after|before)\\]/"],["#text","【広告】"],["#text","【PR】"],["#text","関連動画"],["#text","PR:"],["script","leave_recommend"],["#text","/Advertisement/"],["script","zfgloaded"],["script","HTMLAllCollection"],["script","liedetector"],["script","popWin"],["script","end_click"],["script","ad blocker"],["script","closeAd"],["script","/modal|popupads/"],["script","/adconfig/i"],["script","AdblockDetector"],["script","is_antiblock_refresh"],["script","/userAgent|adb|htmls/"],["script","myModal"],["script","ad_block"],["script","app_checkext"],["script","clientHeight"],["script","/url_key|adHtml/"],["script","pop.target"],["script","axios"],["script","ad block"],["script","\"v4ac1eiZr0\""],["script","admiral"],["script","/charAt|XMLHttpRequest/"],["script","AdBlockEnabled"],["script","window.location.replace"],["script","/$.*open/"],["script","Brave"],["script","egoTab"],["script","abDetectorPro"],["script","/$.*(css|oncontextmenu)/"],["script","/eval.*RegExp/"],["script","wwads"],["script","/\\[\\'push\\'\\]/"],["script","/adblock/i"],["script","/$.*adUnits/"],["script","decodeURIComponent"],["script","RegExp"],["script","adbl"],["script","doOpen"],["script","adsBlocked"],["script","chkADB"],["script","AaDetector"],["script","AdBlock"],["script","Symbol.iterator"],["script","/innerHTML.*appendChild/"],["script","Exo"],["script","detectAdBlock"],["script","/window\\[\\'open\\'\\]/"],["script","Error"],["script","document.head.appendChild"],["script","adsPlay"],["script","pop1stp"],["script","Number"],["script","NEXT_REDIRECT"],["script","ad-block-activated"],["script","insertBefore"],["script","pop.doEvent"],["script","/adbl/i"],["script","detect"],["script","adsSrc"],["script","fetch"],["script","/join\\(\\'\\'\\)/"],["script","/join\\(\\\"\\\"\\)/"],["script","api.dataunlocker.com"],["script","vglnk"],["script","/RegExp\\(\\'/","condition","RegExp"],["script","/event\\.keyCode|DisableDevtool/"],["script","/while \\(!!\\[\\]\\)|String\\(\\)\\.fromCharCode|\\.join\\(\\w+\\)\\.split\\(\\w+\\)|\"undefined\"|_\\$|\\$_|\\[\\d+\\][^=]*==|\\.join|\\.substr|\\.charAt|\\.reduce|!!|\\$document|Function\\s*[,;]|var [^=]+=window\\[|=\\s*\\[[^\\]]*]/"],["script","/detectAdBlock|\\(typeof [a-z]{10,25} \\=\\=\\=? (\"undefined\"|\"function\")\\)|typeof adngin|_0x|'\\/func'/"],["script","NREUM"]];

const hostnamesMap = new Map([["alpin.de",0],["boersennews.de",0],["chefkoch.de",0],["chip.de",0],["clever-tanken.de",0],["desired.de",0],["donnerwetter.de",0],["fanfiktion.de",0],["focus.de",0],["formel1.de",0],["frustfrei-lernen.de",0],["gewinnspiele.tv",0],["giga.de",0],["gut-erklaert.de",0],["kino.de",0],["messen.de",0],["nickles.de",0],["nordbayern.de",0],["spielfilm.de",0],["teltarif.de",0],["unsere-helden.com",0],["weltfussball.at",0],["watson.de",0],["moviepilot.de",[0,3]],["aupetitparieur.com",1],["allthingsvegas.com",1],["100percentfedup.com",1],["beforeitsnews.com",1],["concomber.com",1],["conservativebrief.com",1],["conservativefiringline.com",1],["dailylol.com",1],["funnyand.com",1],["letocard.fr",1],["mamieastuce.com",1],["meilleurpronostic.fr",1],["patriotnationpress.com",1],["toptenz.net",1],["vitamiiin.com",1],["writerscafe.org",1],["populist.press",1],["dailytruthreport.com",1],["livinggospeldaily.com",1],["first-names-meanings.com",1],["welovetrump.com",1],["thehayride.com",1],["thelibertydaily.com",1],["thepoke.co.uk",1],["thepolitistick.com",1],["theblacksphere.net",1],["shark-tank.com",1],["naturalblaze.com",1],["greatamericanrepublic.com",1],["dailysurge.com",1],["truthlion.com",1],["flagandcross.com",1],["westword.com",1],["republicbrief.com",1],["freedomfirstnetwork.com",1],["phoenixnewtimes.com",1],["designbump.com",1],["clashdaily.com",1],["madworldnews.com",1],["reviveusa.com",1],["sonsoflibertymedia.com",1],["thedesigninspiration.com",1],["videogamesblogger.com",1],["protrumpnews.com",1],["thepalmierireport.com",1],["kresy.pl",1],["thepatriotjournal.com",1],["gellerreport.com",1],["thegatewaypundit.com",1],["wltreport.com",1],["miaminewtimes.com",1],["politicalsignal.com",1],["rightwingnews.com",1],["bigleaguepolitics.com",1],["comicallyincorrect.com",1],["web.de",2],["yts.mx",5],["upornia.com",7],["pinsystem.co.uk",8],["elrellano.com",8],["tinyppt.com",8],["bharathwick.com",8],["descargaspcpro.net",8],["dx-tv.com",8],["rt3dmodels.com",8],["plc4me.com",8],["blisseyhusbands.com",8],["madaradex.org",8],["trigonevo.com",8],["franceprefecture.fr",8],["jazbaat.in",8],["aipebel.com",8],["veganab.co",8],["camdigest.com",8],["learnmany.in",8],["amanguides.com",[8,57]],["highkeyfinance.com",[8,57]],["appkamods.com",8],["techacode.com",8],["djqunjab.in",8],["downfile.site",8],["expertvn.com",8],["trangchu.news",8],["3dmodelshare.org",8],["nulleb.com",8],["asiaon.top",8],["coursesghar.com",8],["thecustomrom.com",8],["snlookup.com",8],["bingotingo.com",8],["ghior.com",8],["3dmili.com",8],["karanpc.com",8],["plc247.com",8],["apkdelisi.net",8],["javindo.eu.org",8],["chindohot.site",8],["freepasses.org",8],["tomarnarede.pt",8],["basketballbuzz.ca",8],["dribbblegraphics.com",8],["kemiox.com",8],["checkersmenu.us",8],["teksnologi.com",8],["dollareuro.live",8],["eporner.com",10],["javtiful.com",[10,13]],["germancarforum.com",11],["innateblogger.com",11],["cybercityhelp.in",11],["streamnoads.com",[12,13,47]],["bowfile.com",12],["cloudvideo.tv",[12,47]],["coloredmanga.com",12],["embedstream.me",[12,13,47]],["exeo.app",12],["hiphopa.net",[12,13]],["megaup.net",12],["olympicstreams.co",[12,47]],["tv247.us",[12,13]],["uploadhaven.com",12],["userscloud.com",[12,47]],["mdfx9dc8n.net",13],["mdzsmutpcvykb.net",13],["mixdrop21.net",13],["mixdropjmk.pw",13],["y2tube.pro",13],["123movies4u.site",13],["1337xporn.com",13],["141jav.com",13],["1bit.space",13],["1bitspace.com",13],["38dh2.top",13],["3dporndude.com",13],["4archive.org",13],["4horlover.com",13],["560pmovie.com",13],["60fps.xyz",13],["85tube.com",13],["85videos.com",13],["8xlinks.click",13],["a2zcrackworld.com",13],["aazzz.xyz",13],["acefile.co",13],["actusports.eu",13],["adclickersbot.com",13],["adricami.com",13],["adslink.pw",13],["adultstvlive.com",13],["adz7short.space",13],["aeblender.com",13],["ahdafnews.blogspot.com",13],["ak47sports.com",13],["akuma.moe",13],["allplayer.tk",13],["allstreaming.online",13],["amadoras.cf",13],["amadorasdanet.shop",13],["amateurblog.tv",13],["androidadult.com",13],["anhsexjav.xyz",13],["anidl.org",13],["anime-loads.org",13],["animeblkom.net",13],["animefire.plus",13],["animelek.me",13],["animespire.net",13],["animestotais.xyz",13],["animeyt.es",13],["anroll.net",13],["anymoviess.xyz",13],["aotonline.org",13],["asenshu.com",13],["asialiveaction.com",13],["asianclipdedhd.net",13],["askim-bg.com",13],["asumsikedaishop.com",13],["avcrempie.com",13],["avseesee.com",13],["gettapeads.com",13],["backfirstwo.com",13],["bajarjuegospcgratis.com",13],["balkanportal.net",13],["balkanteka.net",13],["bdnewszh.com",[13,47]],["belowporn.com",13],["bestclaimtrx.xyz",13],["bestgirlsexy.com",13],["bestnhl.com",13],["bestporn4free.com",13],["bestporncomix.com",13],["bet36.es",13],["bikinitryon.net",13],["birdurls.com",13],["bitsearch.to",13],["blackcockadventure.com",13],["blackcockchurch.org",13],["blackporncrazy.com",13],["blizzboygames.net",13],["blizzpaste.com",13],["blkom.com",13],["blog-peliculas.com",13],["blogtrabalhista.com",13],["blurayufr.xyz",13],["bobsvagene.club",13],["bolly4umovies.click",13],["bonusharian.pro",13],["brilian-news.id",13],["brupload.net",13],["bucitana.com",13],["cablegratis.online",13],["camchickscaps.com",13],["camgirlcum.com",13],["camgirls.casa",13],["cashurl.in",13],["castingx.net",13],["ccurl.net",[13,47]],["celebrity-leaks.net",13],["cgpelis.net",13],["charexempire.com",13],["choosingnothing.com",13],["clasico.tv",13],["clik.pw",13],["coin-free.com",[13,54]],["coins100s.fun",13],["comicsmanics.com",13],["compucalitv.com",13],["coolcast2.com",13],["cosplaytab.com",13],["countylocalnews.com",13],["cpmlink.net",13],["crackstreamshd.click",13],["crespomods.com",13],["crisanimex.com",13],["crunchyscan.fr",13],["cuevana3.fan",13],["cuevana3hd.com",13],["cumception.com",13],["curvaweb.com",13],["cutpaid.com",13],["cypherscans.xyz",[13,47]],["datawav.club",13],["daughtertraining.com",13],["deepgoretube.site",13],["deltabit.co",13],["depvailon.com",13],["derleta.com",13],["desivdo.com",13],["desixx.net",13],["detikkebumen.com",13],["deutschepornos.me",13],["diasoft.xyz",13],["directupload.net",13],["diskusscan.com",13],["dixva.com",13],["doctormalay.com",13],["dofusports.xyz",13],["dogemate.com",13],["doods.cam",13],["doodskin.lat",13],["downloadrips.com",13],["downvod.com",13],["dphunters.mom",13],["dragontranslation.com",13],["duddes.xyz",13],["dvdfullestrenos.com",13],["easylinks.in",13],["ebookbb.com",13],["ebookhunter.net",13],["egyanime.com",13],["egygost.com",13],["egyshare.cc",13],["ekasiwap.com",13],["electro-torrent.pl",13],["elil.cc",13],["embed4u.xyz",13],["eplayer.click",13],["erovoice.us",13],["eroxxx.us",13],["estrenosdoramas.net",13],["everia.club",13],["everythinginherenet.blogspot.com",13],["extrafreetv.com",13],["extremotvplay.com",13],["fapinporn.com",13],["fapptime.com",13],["fashionblog.tv",13],["fastreams.live",13],["faucethero.com",13],["fembed.com",13],["femdom-joi.com",13],["fileone.tv",13],["film1k.com",13],["filmeonline2023.net",13],["filmesonlinex.org",13],["filmesonlinexhd.biz",[13,47]],["filmovitica.com",13],["filmymaza.blogspot.com",13],["filthy.family",13],["firstmovies.to",13],["fixfinder.click",13],["flostreams.xyz",13],["flyfaucet.com",13],["footyhunter.lol",13],["footyhunter3.xyz",[13,47]],["forex-golds.com",13],["forex-trnd.com",13],["forumchat.club",13],["forumlovers.club",13],["freemoviesonline.biz",13],["freeomovie.co.in",13],["freeomovie.to",13],["freeporncomic.net",13],["freepornhdonlinegay.com",13],["freeproxy.io",13],["freeuse.me",13],["freeusexporn.com",13],["fsicomics.com",13],["gambarbogel.xyz",13],["gamepcfull.com",13],["gameronix.com",13],["gamesfullx.com",13],["gameshdlive.net",13],["gameshdlive.xyz",13],["gamesmountain.com",13],["gamesrepacks.com",13],["gamingguru.fr",13],["gamovideo.com",13],["garota.cf",13],["gaydelicious.com",13],["gaypornmasters.com",13],["gaysex69.net",13],["gemstreams.com",13],["get-to.link",13],["girlscanner.org",13],["giurgiuveanul.ro",13],["gledajcrtace.xyz",13],["gocast2.com",13],["gomo.to",13],["gostosa.cf",13],["gtlink.co",13],["gwiazdypornosow.pl",13],["haho.moe",13],["hatsukimanga.com",13],["hayhd.net",13],["hdsaprevodom.com",13],["hdstreamss.club",13],["hentais.tube",13],["hentaistream.co",13],["hentaitk.net",13],["hentaitube.online",13],["hentaiworld.tv",13],["hesgoal.tv",13],["hexupload.net",13],["hhkungfu.tv",13],["highlanderhelp.com",13],["hindimean.com",13],["hindimovies.to",[13,47]],["hiperdex.com",13],["hispasexy.org",13],["hitprn.com",13],["hoca4u.com",13],["hollymoviehd.cc",13],["hoodsite.com",13],["hopepaste.download",13],["hornylips.com",13],["hotgranny.live",13],["hotmama.live",13],["hqcelebcorner.net",13],["huren.best",13],["hwnaturkya.com",[13,47]],["hxfile.co",[13,47]],["igfap.com",13],["ihdstreams.xyz",13],["iklandb.com",13],["illink.net",13],["imgkings.com",13],["imgsex.xyz",13],["imx.to",13],["influencersgonewild.org",13],["infosgj.free.fr",13],["investnewsbrazil.com",13],["itdmusics.com",13],["itsuseful.site",13],["itunesfre.com",13],["iwatchfriendsonline.net",[13,110]],["jackstreams.com",13],["jatimupdate24.com",13],["jav-fun.cc",13],["jav-scvp.com",13],["javcl.com",13],["javf.net",13],["javhay.net",13],["javhoho.com",13],["javhun.com",13],["javleak.com",13],["javporn.best",13],["javsex.to",13],["jimdofree.com",13],["jiofiles.org",13],["jorpetz.com",13],["journalyc.online",13],["jp-films.com",13],["jpop80ss3.blogspot.com",13],["jpopsingles.eu",13],["kantotflix.net",13],["kantotinyo.com",13],["kaoskrew.org",13],["kaplog.com",13],["keralatvbox.com",13],["kickassanimes.io",13],["kimochi.info",13],["kimochi.tv",13],["kinemania.tv",13],["konstantinova.net",13],["koora-online.live",13],["kunmanga.com",13],["kutmoney.com",13],["kwithsub.com",13],["ladangreceh.xyz",13],["lat69.me",13],["latinblog.tv",13],["latinomegahd.net",13],["lazyfaucet.com",13],["leechpremium.link",13],["legendas.dev",13],["legendei.net",13],["lightdlmovies.blogspot.com",13],["lighterlegend.com",13],["linclik.com",13],["linkebr.com",13],["linkrex.net",13],["links.worldfree4u-lol.online",13],["linksfy.co",13],["lody.ink",13],["lovesomecommunity.com",13],["lulustream.com",[13,47]],["luluvdo.com",[13,47]],["luzcameraeacao.shop",13],["manga-oni.com",13],["mangaboat.com",13],["mangagenki.me",13],["mangahere.onl",13],["mangaweb.xyz",13],["mangoporn.net",13],["manhwahentai.me",13],["masahub.com",13],["masahub.net",13],["maturegrannyfuck.com",13],["mdy48tn97.com",13],["mediapemersatubangsa.com",13],["mega-mkv.com",13],["megapastes.com",13],["megapornpics.com",13],["messitv.net",13],["meusanimes.net",13],["milfmoza.com",13],["milfzr.com",13],["millionscast.com",13],["mimaletamusical.blogspot.com",13],["mitly.us",13],["mkv-pastes.com",13],["modb.xyz",13],["monaskuliner.ac.id",13],["moredesi.com",13],["movgotv.net",13],["movi.pk",13],["movierr.online",13],["movieswbb.com",13],["moviewatch.com.pk",13],["mp4upload.com",13],["mrskin.live",13],["multicanaistv.com",13],["mundowuxia.com",13],["myeasymusic.ir",13],["myonvideo.com",13],["myyouporn.com",13],["narutoget.info",13],["naughtypiss.com",13],["nerdiess.com",13],["new-fs.eu",13],["newtorrentgame.com",13],["nflstreams.me",13],["niaomea.me",[13,47]],["nicekkk.com",13],["nicesss.com",13],["nlegs.com",13],["nolive.me",[13,47]],["nopay.info",13],["nopay2.info",[13,149]],["notformembersonly.com",13],["novamovie.net",13],["novelpdf.xyz",13],["novelssites.com",[13,47]],["novelup.top",13],["nsfwr34.com",13],["nu6i-bg-net.com",13],["nudebabesin3d.com",13],["nukedfans.com",13],["nuoga.eu",13],["nzbstars.com",13],["ohjav.com",13],["ojearnovelas.com",13],["okanime.xyz",13],["olarixas.xyz",13],["oldbox.cloud",13],["olweb.tv",13],["olympicstreams.me",13],["on9.stream",13],["oncast.xyz",13],["onepiece-mangaonline.com",13],["onifile.com",13],["onionstream.live",13],["onlinesaprevodom.net",13],["onlyfullporn.video",13],["onplustv.live",13],["originporn.com",13],["ovagames.com",13],["ovamusic.com",13],["owllink.net",13],["packsporn.com",13],["pahaplayers.click",13],["palimas.org",13],["pandafiles.com",13],["papahd.club",13],["papahd1.xyz",13],["password69.com",13],["pastemytxt.com",13],["payskip.org",13],["peeplink.in",13],["peliculasmx.net",13],["pervertgirlsvideos.com",13],["pervyvideos.com",13],["phim12h.com",13],["picdollar.com",13],["pickteenz.com",13],["pics4you.net",13],["picsxxxporn.com",13],["pinayscandalz.com",13],["pinkueiga.net",13],["piratefast.xyz",13],["piratehaven.xyz",13],["pirateiro.com",13],["pirlotvonline.org",13],["playtube.co.za",13],["plugintorrent.com",13],["pmvzone.com",13],["porndish.com",13],["pornez.net",13],["pornfetishbdsm.com",13],["pornfits.com",13],["pornhd720p.com",13],["pornobr.club",13],["pornobr.ninja",13],["pornodominicano.net",13],["pornofaps.com",13],["pornoflux.com",13],["pornotorrent.com.br",13],["pornredit.com",13],["pornstarsyfamosas.es",13],["pornstreams.co",13],["porntn.com",13],["pornxbit.com",13],["pornxday.com",13],["portaldasnovinhas.shop",13],["portugues-fcr.blogspot.com",13],["poscishd.online",13],["poscitesch.com",[13,47]],["poseyoung.com",13],["pover.org",13],["proxyninja.org",13],["pubfilmz.com",13],["publicsexamateurs.com",13],["punanihub.com",13],["putlocker5movies.org",13],["pxxbay.com",13],["r18.best",13],["ragnaru.net",13],["rapbeh.net",13],["rapelust.com",13],["rapload.org",13],["read-onepiece.net",13],["retro-fucking.com",13],["retrotv.org",13],["robaldowns.com",13],["rockdilla.com",13],["rojadirectatvenvivo.com",13],["rojitadirecta.blogspot.com",13],["romancetv.site",13],["rule34.club",13],["rule34hentai.net",13],["rumahbokep-id.com",13],["safego.cc",13],["safestream.cc",13],["sakurafile.com",13],["satoshi-win.xyz",13],["scat.gold",13],["scatfap.com",13],["scatkings.com",13],["scnlog.me",13],["scripts-webmasters.net",13],["serie-turche.com",13],["serijefilmovi.com",13],["sexcomics.me",13],["sexdicted.com",13],["sexgay18.com",13],["sexofilm.co",13],["sextgem.com",13],["sextubebbw.com",13],["sgpics.net",13],["shadowrangers.live",13],["shahee4u.cam",13],["shahiid-anime.net",13],["shemale6.com",13],["shinden.pl",13],["short.es",13],["showmanga.blog.fc2.com",13],["shrt10.com",13],["shurt.pw",13],["sideplusleaks.net",13],["silverblog.tv",13],["silverpic.com",13],["sinhalasub.life",13],["sinsitio.site",13],["sinvida.me",13],["skidrowcpy.com",13],["skidrowfull.com",13],["skidrowreloaded.com",13],["slut.mom",13],["smallencode.me",13],["smoner.com",13],["smplace.com",13],["soccerinhd.com",13],["socceron.name",13],["softairbay.com",13],["sokobj.com",13],["songsio.com",13],["souexatasmais.com",13],["sportbar.live",13],["sportea.online",13],["sportskart.xyz",13],["sportstream1.cfd",13],["sporttuna.site",13],["srt.am",13],["srts.me",13],["stakes100.xyz",13],["stbemuiptv.com",13],["stockingfetishvideo.com",13],["stream.crichd.vip",13],["stream.lc",13],["stream25.xyz",13],["streambee.to",13],["streamcenter.pro",13],["streamers.watch",13],["streamgo.to",13],["streamkiste.tv",13],["streamoporn.xyz",13],["streamoupload.xyz",13],["streamservicehd.click",13],["streamvid.net",[13,19]],["subtitleporn.com",13],["subtitles.cam",13],["suicidepics.com",13],["supertelevisionhd.com",13],["supexfeeds.com",13],["swzz.xyz",13],["sxnaar.com",13],["tabooporns.com",13],["taboosex.club",13],["tapeantiads.com",13],["tapeblocker.com",13],["tapenoads.com",13],["tapewithadblock.org",[13,173]],["teamos.xyz",13],["teen-wave.com",13],["teenporncrazy.com",13],["telegramgroups.xyz",13],["telenovelasweb.com",13],["tensei-shitara-slime-datta-ken.com",13],["tfp.is",13],["tgo-tv.co",[13,47]],["thaihotmodels.com",13],["theblueclit.com",13],["thebussybandit.com",13],["theicongenerator.com",13],["thelastdisaster.vip",13],["thepiratebay0.org",13],["thepiratebay10.info",13],["thesexcloud.com",13],["thothub.today",13],["tightsexteens.com",13],["tojav.net",13],["tokyoblog.tv",13],["tonnestreamz.xyz",13],["top16.net",13],["topvideosgay.com",13],["torrage.info",13],["torrents.vip",13],["torrsexvid.com",13],["tpb-proxy.xyz",13],["trannyteca.com",13],["trendytalker.com",13],["tumanga.net",13],["turbogvideos.com",13],["turbovid.me",13],["turkishseriestv.org",13],["turksub24.net",13],["tutele.sx",13],["tutelehd3.xyz",13],["tvglobe.me",13],["tvpclive.com",13],["tvs-widget.com",13],["tvseries.video",13],["ucptt.com",13],["ufaucet.online",13],["ufcfight.online",13],["uhdgames.xyz",13],["ultrahorny.com",13],["ultraten.net",13],["unblockweb.me",13],["underhentai.net",13],["uniqueten.net",13],["upbaam.com",13],["upstream.to",13],["valeriabelen.com",13],["verdragonball.online",13],["vfxmed.com",13],["video.az",13],["videostreaming.rocks",13],["videowood.tv",13],["vidorg.net",13],["vidtapes.com",13],["vidz7.com",13],["vikistream.com",13],["vikv.net",13],["virpe.cc",13],["visifilmai.org",13],["viveseries.com",13],["vladrustov.sx",13],["volokit2.com",13],["vstorrent.org",13],["w-hentai.com",13],["watchaccordingtojimonline.com",13],["watchbrooklynnine-nine.com",13],["watchdowntonabbeyonline.com",13],["watchelementaryonline.com",13],["watcheronline.net",13],["watchgleeonline.com",13],["watchhowimetyourmother.online",13],["watchkobestreams.info",13],["watchlostonline.net",13],["watchlouieonline.com",13],["watchjavidol.com",13],["watchmadmenonline.com",13],["watchmonkonline.com",13],["watchonceuponatimeonline.com",13],["watchparksandrecreation.net",13],["watchprettylittleliarsonline.com",13],["watchrulesofengagementonline.com",13],["watchthekingofqueens.com",13],["watchthemiddleonline.com",13],["watchtvchh.xyz",13],["webcamrips.com",13],["wickedspot.org",13],["wincest.xyz",13],["witanime.best",13],["wolverdon.fun",13],["wolverdonx.com",13],["wordcounter.icu",13],["worldcupstream.pm",13],["worldmovies.store",13],["worldstreams.click",13],["wpdeployit.com",13],["wqstreams.tk",13],["wwwsct.com",13],["xanimeporn.com",13],["xblog.tv",13],["xn--verseriesespaollatino-obc.online",13],["xn--xvideos-espaol-1nb.com",13],["xpornium.net",13],["xsober.com",13],["xvip.lat",13],["xxgasm.com",13],["xxvideoss.org",13],["xxx18.uno",13],["xxxdominicana.com",13],["xxxfree.watch",13],["xxxmax.net",13],["xxxwebdlxxx.top",13],["xxxxvideo.uno",13],["y2b.wiki",13],["yabai.si",13],["yadixv.com",13],["yayanimes.net",13],["yeshd.net",13],["yodbox.com",13],["youjax.com",13],["youpits.xyz",13],["yourdailypornvideos.ws",13],["yourupload.com",13],["ytstv.me",13],["ytstvmovies.co",13],["ytstvmovies.xyz",13],["ytsyify.co",13],["ytsyifymovie.com",13],["zerion.cc",13],["zerocoin.top",13],["zitss.xyz",13],["zpaste.net",13],["zplayer.live",13],["faucet.ovh",14],["oko.sh",[15,29,65]],["bigbtc.win",16],["cryptofun.space",16],["sexo5k.com",17],["truyen-hentai.com",17],["theshedend.com",19],["zeroupload.com",19],["securenetsystems.net",19],["miniwebtool.com",19],["bchtechnologies.com",19],["spiegel.de",20],["hausbau-forum.de",21],["kiemlua.com",21],["appnee.com",22],["d0000d.com",23],["d000d.com",23],["d0o0d.com",23],["do0od.com",23],["doods.pro",23],["ds2play.com",23],["ds2video.com",23],["apkmirror.com",24],["musichq.pe",26],["sekaikomik.bio",26],["onlyfaucet.com",27],["livecamrips.com",28],["smutty.com",28],["freeadultcomix.com",28],["down.dataaps.com",28],["filmweb.pl",28],["infinityscans.xyz",[29,47]],["infinityscans.net",[29,47]],["tvi.la",[29,65]],["iir.la",[29,65]],["tii.la",[29,65]],["ckk.ai",[29,65]],["oei.la",[29,65]],["lnbz.la",[29,65]],["j8jp.com",30],["visionpapers.org",31],["fdownloader.net",32],["thehackernews.com",33],["mielec.pl",34],["camsrip.com",35],["beatsnoop.com",35],["fetchpik.com",35],["hackerranksolution.in",35],["treasl.com",36],["mrbenne.com",37],["cnpics.org",38],["ovabee.com",38],["porn4f.com",38],["cnxx.me",38],["ai18.pics",38],["cuervotv.me",[39,47]],["aliezstream.pro",39],["daddy-stream.xyz",39],["instream.pro",39],["mylivestream.pro",39],["powerover.online",39],["sportea.link",39],["sportsurge.stream",39],["ufckhabib.com",39],["ustream.pro",39],["papa4k.online",39],["streamhd247.info",39],["nowlive1.me",39],["buzter.xyz",39],["gamehdlive.online",39],["hdfungamezz.xyz",39],["kingstreamz.lol",39],["masterpro.club",39],["papahd.co",39],["sportos.co",39],["valhallas.click",39],["andhrafriends.com",40],["freeroms.com",40],["soap2day-online.com",40],["sportsonline.si",41],["fiuxy2.co",42],["rnbastreams.com",43],["4kwebplay.xyz",43],["qqwebplay.xyz",43],["totalsportek.to",43],["eztvx.to",43],["topstreams.info",43],["lewblivehdplay.ru",43],["claplivehdplay.ru",43],["viwlivehdplay.ru",43],["antennasports.ru",43],["buffstreams.app",43],["1stream.eu",43],["crackstreamer.net",43],["methstreamer.com",43],["animeunity.to",44],["auto-crypto.click",45],["iconicblogger.com",45],["tokopedia.com",46],["xn-----0b4asja7ccgu2b4b0gd0edbjm2jpa1b1e9zva7a0347s4da2797e8qri.xn--1ck2e1b",47],["6movies.net",47],["adsh.cc",47],["afilmyhouse.blogspot.com",47],["ak.sv",47],["animesultra.com",47],["api.webs.moe",47],["apkmody.io",47],["attvideo.com",47],["backfirstwo.site",[47,140]],["buffsports.me",47],["crazyblog.in",47],["divicast.com",47],["dlhd.so",47],["embed.meomeo.pw",47],["filmeserialeonline.org",47],["flexyhit.com",47],["foreverwallpapers.com",47],["french-streams.cc",47],["fslinks.org",47],["fstream365.com",47],["hdtoday.to",47],["hinatasoul.com",47],["icelz.newsrade.com",47],["igg-games.com",47],["membed.net",47],["mgnetu.com",47],["movie4kto.net",47],["mp3juice.info",47],["mp3juices.cc",47],["myflixerz.to",47],["nowmetv.net",47],["nowsportstv.com",47],["nxbrew.com",47],["oii.io",47],["paidshitforfree.com",47],["pepperlive.info",47],["playertv.net",47],["putlocker68.com",47],["roystream.com",47],["rssing.com",47],["s.to",47],["share.filesh.site",47],["sharkfish.xyz",47],["skidrowcodex.net",47],["sports-stream.site",47],["stream4free.live",47],["streamed.su",47],["tamilmobilemovies.in",47],["tapeadsenjoyer.com",47],["thewatchseries.live",47],["tnmusic.in",47],["travelplanspro.com",47],["tusfiles.com",47],["tutlehd4.com",47],["twstalker.com",47],["vid-guard.com",47],["vidco.pro",47],["video-leech.xyz",47],["vidsaver.net",47],["vidspeeds.com",47],["viralitytoday.com",47],["voiranime.stream",47],["watchdoctorwhoonline.com",47],["watchserie.online",47],["webhostingpost.com",47],["woxikon.in",47],["www-y2mate.com",47],["ylink.bid",47],["ytix.xyz",47],["remixsearch.net",48],["remixsearch.es",48],["onlineweb.tools",48],["sharing.wtf",48],["xnxxcom.xyz",49],["moonplusnews.com",[50,51]],["loanoffering.in",[50,51]],["truyentranhfull.net",51],["funkeypagali.com",52],["careersides.com",52],["nayisahara.com",52],["wikifilmia.com",52],["infinityskull.com",52],["viewmyknowledge.com",52],["iisfvirtual.in",52],["starxinvestor.com",52],["kenzo-flowertag.com",53],["mdn.lol",53],["btcbitco.in",54],["btcsatoshi.net",54],["cempakajaya.com",54],["crypto4yu.com",54],["gainl.ink",54],["manofadan.com",54],["readbitcoin.org",54],["wiour.com",54],["kienthucrangmieng.com",54],["tremamnon.com",54],["btc25.org",54],["tron-free.com",54],["bitsmagic.fun",54],["ourcoincash.xyz",54],["hynews.biz",54],["blog.cryptowidgets.net",55],["blog.insurancegold.in",55],["blog.wiki-topia.com",55],["blog.coinsvalue.net",55],["blog.cookinguide.net",55],["blog.freeoseocheck.com",55],["aylink.co",56],["sugarona.com",57],["nishankhatri.xyz",57],["cety.app",58],["exego.app",58],["cutlink.net",58],["cutsy.net",58],["cutyurls.com",58],["cutty.app",58],["cutnet.net",58],["javhdo.net",58],["tinys.click",59],["answerpython.com",59],["gsm-solution.com",59],["h-donghua.com",59],["hindisubbedacademy.com",59],["pkgovjobz.com",59],["ripexbooster.xyz",59],["serial4.com",59],["serial412.blogspot.com",59],["sigmalinks.in",59],["tutorgaming.com",59],["everydaytechvams.com",59],["dipsnp.com",59],["cccam4sat.com",59],["aiimgvlog.fun",60],["appsbull.com",61],["diudemy.com",61],["maqal360.com",61],["mphealth.online",61],["makefreecallsonline.com",61],["androjungle.com",61],["bookszone.in",61],["drakescans.com",61],["shortix.co",61],["msonglyrics.com",61],["app-sorteos.com",61],["bokugents.com",61],["client.pylexnodes.net",61],["btvplus.bg",61],["blog24.me",[62,63]],["coingraph.us",64],["impact24.us",64],["atglinks.com",66],["cinedesi.in",67],["thevouz.in",67],["tejtime24.com",67],["techishant.in",67],["kbconlinegame.com",68],["hamrojaagir.com",68],["odijob.com",68],["blogesque.net",69],["explorosity.net",69],["optimizepics.com",69],["torovalley.net",69],["simana.online",70],["unblocked.id",72],["listendata.com",73],["7xm.xyz",73],["fastupload.io",73],["azmath.info",73],["wouterplanet.com",74],["androidacy.com",75],["pillowcase.su",76],["veryfreeporn.com",77],["theporngod.com",77],["besthdgayporn.com",78],["drivenime.com",78],["javup.org",78],["shemaleup.net",78],["austiblox.net",79],["btcbunch.com",80],["teachoo.com",81],["interfootball.co.kr",82],["a-ha.io",82],["cboard.net",82],["jjang0u.com",82],["joongdo.co.kr",82],["viva100.com",82],["thephoblographer.com",82],["gamingdeputy.com",82],["thesaurus.net",82],["alle-tests.nl",82],["maketecheasier.com",82],["automobile-catalog.com",82],["allthekingz.com",82],["motorbikecatalog.com",82],["meconomynews.com",82],["brandbrief.co.kr",82],["motorgraph.com",82],["allthetests.com",83],["javatpoint.com",83],["globalrph.com",83],["carscoops.com",83],["indiatimes.com",83],["issuya.com",83],["topstarnews.net",83],["islamicfinder.org",83],["secure-signup.net",83],["worldhistory.org",84],["bitcotasks.com",85],["udvl.com",86],["www.chip.de",87],["topsporter.net",88],["sportshub.to",88],["streamcheck.link",89],["unofficialtwrp.com",90],["bitcosite.com",91],["bitzite.com",91],["easymc.io",92],["yunjiema.top",92],["hacoos.com",94],["bondagevalley.cc",95],["zefoy.com",96],["vidello.net",97],["resizer.myct.jp",98],["gametohkenranbu.sakuraweb.com",99],["jisakuhibi.jp",100],["rank1-media.com",100],["lifematome.blog",101],["fm.sekkaku.net",102],["free-avx.jp",103],["dvdrev.com",104],["betweenjpandkr.blog",105],["nft-media.net",106],["ghacks.net",107],["songspk2.info",108],["zoechip.com",109],["nectareousoverelate.com",111],["khoaiphim.com",112],["haafedk2.com",113],["fordownloader.com",113],["jovemnerd.com.br",114],["nicomanga.com",115],["totalcsgo.com",116],["vivamax.asia",117],["manysex.com",118],["gaminginfos.com",119],["tinxahoivn.com",120],["forums-fastunlock.com",121],["automoto.it",122],["codelivly.com",123],["ophim.vip",124],["touguatize.monster",125],["novelhall.com",126],["hes-goal.net",127],["abc17news.com",128],["adoredbyalex.com",128],["agrodigital.com",128],["al.com",128],["aliontherunblog.com",128],["allaboutthetea.com",128],["allmovie.com",128],["allmusic.com",128],["allthingsthrifty.com",128],["amessagewithabottle.com",128],["androidpolice.com",128],["antyradio.pl",128],["artforum.com",128],["artnews.com",128],["awkward.com",128],["awkwardmom.com",128],["bailiwickexpress.com",128],["barnsleychronicle.com",128],["becomingpeculiar.com",128],["bethcakes.com",128],["betweenenglandandiowa.com",128],["blogher.com",128],["bluegraygal.com",128],["briefeguru.de",128],["carmagazine.co.uk",128],["cattime.com",128],["cbr.com",128],["cbssports.com",128],["celiacandthebeast.com",128],["chaptercheats.com",128],["cleveland.com",128],["collider.com",128],["comingsoon.net",128],["commercialobserver.com",128],["competentedigitale.ro",128],["crafty.house",128],["dailyvoice.com",128],["decider.com",128],["didyouknowfacts.com",128],["dogtime.com",128],["dualshockers.com",128],["dustyoldthing.com",128],["faithhub.net",128],["femestella.com",128],["footwearnews.com",128],["freeconvert.com",128],["frogsandsnailsandpuppydogtail.com",128],["fsm-media.com",128],["funtasticlife.com",128],["fwmadebycarli.com",128],["gamerant.com",128],["gfinityesports.com",128],["givemesport.com",128],["gulflive.com",128],["helloflo.com",128],["homeglowdesign.com",128],["honeygirlsworld.com",128],["hotcars.com",128],["howtogeek.com",128],["insider-gaming.com",128],["insurancejournal.com",128],["jasminemaria.com",128],["kion546.com",128],["lehighvalleylive.com",128],["lettyskitchen.com",128],["lifeinleggings.com",128],["liveandletsfly.com",128],["lizzieinlace.com",128],["localnews8.com",128],["lonestarlive.com",128],["madeeveryday.com",128],["maidenhead-advertiser.co.uk",128],["makeuseof.com",128],["mardomreport.net",128],["masslive.com",128],["melangery.com",128],["milestomemories.com",128],["mlive.com",128],["modernmom.com",128],["momtastic.com",128],["mostlymorgan.com",128],["motherwellmag.com",128],["movieweb.com",128],["muddybootsanddiamonds.com",128],["musicfeeds.com.au",128],["mylifefromhome.com",128],["nationalreview.com",128],["neoskosmos.com",128],["nj.com",128],["nordot.app",128],["nothingbutnewcastle.com",128],["nsjonline.com",128],["nypost.com",128],["oakvillenews.org",128],["observer.com",128],["oregonlive.com",128],["ourlittlesliceofheaven.com",128],["pagesix.com",128],["palachinkablog.com",128],["pennlive.com",128],["pinkonthecheek.com",128],["politicususa.com",128],["predic.ro",128],["puckermom.com",128],["qtoptens.com",128],["realgm.com",128],["reelmama.com",128],["robbreport.com",128],["royalmailchat.co.uk",128],["samchui.com",128],["sandrarose.com",128],["screenrant.com",128],["sheknows.com",128],["sherdog.com",128],["sidereel.com",128],["silive.com",128],["simpleflying.com",128],["sloughexpress.co.uk",128],["spacenews.com",128],["sportsgamblingpodcast.com",128],["spotofteadesigns.com",128],["stacysrandomthoughts.com",128],["ssnewstelegram.com",128],["superherohype.com",128],["syracuse.com",128],["tablelifeblog.com",128],["thebeautysection.com",128],["thecelticblog.com",128],["thecurvyfashionista.com",128],["thefashionspot.com",128],["thegamer.com",128],["thegamescabin.com",128],["thenerdyme.com",128],["thenonconsumeradvocate.com",128],["theprudentgarden.com",128],["thethings.com",128],["timesnews.net",128],["topspeed.com",128],["toyotaklub.org.pl",128],["travelingformiles.com",128],["tutsnode.org",128],["tvline.com",128],["viralviralvideos.com",128],["wannacomewith.com",128],["wimp.com",128],["windsorexpress.co.uk",128],["woojr.com",128],["worldoftravelswithkids.com",128],["xda-developers.com",128],["cheatsheet.com",129],["pwinsider.com",129],["baeldung.com",129],["bagi.co.in",130],["keran.co",130],["biblestudytools.com",131],["christianheadlines.com",131],["ibelieve.com",131],["kuponigo.com",132],["kimcilonly.site",133],["kimcilonly.link",133],["cryptoearns.com",134],["inxxx.com",135],["ipaspot.app",136],["embedwish.com",137],["filelions.live",137],["leakslove.net",137],["jenismac.com",138],["vxetable.cn",139],["jewelavid.com",140],["nizarstream.com",140],["snapwordz.com",141],["toolxox.com",141],["rl6mans.com",141],["idol69.net",141],["plumbersforums.net",142],["123movies57.online",143],["gulio.site",144],["mediaset.es",145],["izlekolik.net",146],["donghuaworld.com",147],["letsdopuzzles.com",148],["tainio-mania.online",149],["hes-goals.io",150],["pkbiosfix.com",150],["casi3.xyz",150],["rediff.com",151],["dzapk.com",152],["darknessporn.com",153],["familyporner.com",153],["freepublicporn.com",153],["pisshamster.com",153],["punishworld.com",153],["xanimu.com",153],["pig69.com",154],["cosplay18.pics",154],["eroticmoviesonline.me",155],["teleclub.xyz",156],["ecamrips.com",157],["showcamrips.com",157],["tucinehd.com",159],["9animetv.to",160],["qiwi.gg",161],["jornadaperfecta.com",162],["loseart.com",163],["sousou-no-frieren.com",164],["intro-hd.net",165],["monacomatin.mc",165],["nodo313.net",165],["unite-guide.com",166],["sonixgvn.net",167],["thebullspen.com",168],["botcomics.com",169],["cefirates.com",169],["chandlerorchards.com",169],["comicleaks.com",169],["marketdata.app",169],["monumentmetals.com",169],["tapmyback.com",169],["ping.gg",169],["revistaferramental.com.br",169],["hawpar.com",169],["alpacafinance.org",[169,170]],["nookgaming.com",169],["enkeleksamen.no",169],["kvest.ee",169],["creatordrop.com",169],["panpots.com",169],["cybernetman.com",169],["bitdomain.biz",169],["gerardbosch.xyz",169],["fort-shop.kiev.ua",169],["accuretawealth.com",169],["resourceya.com",169],["tracktheta.com",169],["camberlion.com",169],["replai.io",169],["trybawaryjny.pl",169],["tt.live",170],["future-fortune.com",170],["abhijith.page",170],["madrigalmaps.com",170],["adventuretix.com",170],["bolighub.dk",170],["panprices.com",171],["intercity.technology",171],["freelancer.taxmachine.be",171],["adria.gg",171],["fjlaboratories.com",171],["emanualonline.com",171],["proboards.com",172],["winclassic.net",172],["financemonk.net",174],["japscan.lol",175],["client.falixnodes.net",176],["abema.tv",177]]);

const entitiesMap = new Map([["pahe",[4,13]],["soap2day",4],["hqq",6],["waaw",6],["mhdsports",8],["mhdsportstv",8],["mhdtvsports",8],["mhdtvworld",8],["mhdtvmax",8],["mhdstream",8],["reset-scans",8],["poplinks",[8,61]],["pixhost",9],["viprow",[12,13,47]],["bluemediadownload",12],["bluemediafile",12],["bluemedialink",12],["bluemediastorage",12],["bluemediaurls",12],["urlbluemedia",12],["cloudvideotv",[12,47]],["vidsrc",[12,47]],["123-movies",13],["123movieshd",13],["123movieshub",13],["123moviesme",13],["1337x",[13,25]],["1stream",13],["1tamilmv",13],["2ddl",13],["2umovies",13],["3hiidude",13],["4stream",13],["5movies",13],["7hitmovies",13],["9xmovie",13],["9xlinks",13],["aagmaal",[13,47]],["adblockeronstape",13],["adblockeronstreamtape",13],["adblockplustape",13],["adblockstreamtape",13],["adblockstrtape",13],["adblockstrtech",13],["adblocktape",13],["adcorto",13],["alexsports",13],["alexsportss",13],["alexsportz",13],["animepahe",13],["animesanka",13],["animixplay",13],["aniplay",13],["antiadtape",13],["asianclub",13],["ask4movie",13],["atomixhq",[13,47]],["atomohd",13],["beinmatch",[13,18]],["bhaai",13],["buffstreams",13],["canalesportivo",13],["clickndownload",13],["clicknupload",13],["daddylive",[13,47]],["daddylivehd",[13,47]],["ddrmovies",13],["desiremovies",13],["devlib",13],["divxtotal",13],["divxtotal1",13],["dlhd",13],["dvdplay",[13,47]],["elixx",13],["enjoy4k",13],["estrenosflix",13],["estrenosflux",13],["estrenosgo",13],["f1stream",13],["fbstream",13],["file4go",13],["filmymeet",13],["filmyzilla",[13,47]],["findav",13],["findporn",13],["flixmaza",13],["flizmovies",13],["freetvsports",13],["fullymaza",13],["g3g",13],["gotxx",13],["grantorrent",13],["hdmoviesfair",[13,47]],["hdmoviesflix",13],["hiidudemoviez",13],["imgsen",13],["imgsto",13],["incest",13],["incestflix",13],["itopmusic",13],["javmost",13],["keeplinks",13],["keepvid",13],["keralahd",13],["khatrimazaful",13],["khatrimazafull",13],["leechall",13],["linkshorts",13],["mangovideo",13],["masaporn",13],["miniurl",13],["mirrorace",13],["mixdroop",13],["mixdrop",[13,43]],["mkvcage",13],["mlbstream",13],["mlsbd",13],["mmsbee",13],["motogpstream",13],["movieplex",13],["movierulzlink",13],["movies123",13],["moviesflix",13],["moviesmeta",13],["moviessources",13],["moviesverse",13],["moviezwaphd",13],["mrunblock",13],["nbastream",13],["newmovierulz",13],["nflstream",13],["nhlstream",13],["noblocktape",13],["nocensor",13],["onlyfams",13],["ouo",13],["pctfenix",[13,47]],["pctnew",[13,47]],["peliculas24",13],["pelisplus",13],["piratebay",13],["plyjam",13],["plylive",13],["plyvdo",13],["pornhoarder",13],["prbay",13],["projectfreetv",13],["proxybit",13],["psarips",13],["racaty",13],["remaxhd",13],["rintor",13],["rnbxclusive",13],["rnbxclusive0",13],["rnbxclusive1",13],["rojadirecta",13],["rojadirectaenvivo",13],["rugbystreams",13],["sadisflix",13],["safetxt",13],["shadowrangers",13],["shahi4u",13],["shahid4u1",13],["shahid4uu",13],["shavetape",13],["shortearn",13],["shorten",13],["shorttey",13],["shortzzy",13],["skymovieshd",13],["socceronline",[13,47]],["softarchive",13],["sports-stream",13],["sshhaa",13],["stapadblockuser",13],["stape",13],["stapewithadblock",13],["starmusiq",13],["strcloud",13],["streamadblocker",[13,47]],["streamadblockplus",13],["streamcdn",13],["streamhub",13],["streamsport",13],["streamta",13],["streamtape",13],["streamtapeadblockuser",13],["strikeout",13],["strtape",13],["strtapeadblock",13],["strtapeadblocker",13],["strtapewithadblock",13],["strtpe",13],["swatchseries",13],["tabooflix",13],["tennisstreams",13],["themoviesflix",13],["thepiratebay",13],["thisav",13],["tmearn",13],["toonanime",13],["torlock",13],["tormalayalam",13],["torrentz2eu",13],["tutelehd",13],["tvply",13],["u4m",13],["ufcstream",13],["unblocknow",13],["uploadbuzz",13],["usagoals",13],["vexmoviex",13],["vidclouds",13],["vidlox",13],["vipbox",[13,47]],["vipboxtv",[13,47]],["vipleague",13],["watch-series",13],["watchseries",13],["xclusivejams",13],["xmoviesforyou",13],["youdbox",13],["ytmp3eu",13],["yts-subs",13],["yts",13],["zooqle",13],["dutchycorp",14],["dood",[23,47]],["doodstream",23],["dooood",[23,47]],["torrentdownload",26],["shrinke",28],["shrinkme",28],["daddylive1",39],["esportivos",39],["poscitechs",39],["bollyflix",39],["watchomovies",[40,47]],["wawacity",43],["123movies",47],["123moviesla",47],["123movieweb",47],["2embed",47],["720pstream",47],["9xmovies",47],["adshort",47],["allmovieshub",47],["asianplay",47],["atishmkv",47],["cricstream",47],["crictime",47],["databasegdriveplayer",47],["extramovies",47],["faselhd",47],["faselhds",47],["filemoon",47],["filmy",47],["filmyhit",47],["filmywap",47],["fmovies",47],["gdplayer",47],["gdriveplayer",47],["goku",47],["gomovies",47],["gowatchseries",47],["hdfungamezz",47],["hindilinks4u",47],["hurawatch",47],["jalshamoviezhd",47],["livecricket",47],["mhdsport",47],["mkvcinemas",47],["movies2watch",47],["moviespapa",47],["mp4moviez",47],["mydownloadtube",47],["nsw2u",47],["nuroflix",47],["o2tvseries",47],["o2tvseriesz",47],["pirlotv",47],["poscitech",47],["primewire",47],["redecanais",47],["serienstream",47],["sflix",47],["shahed4u",47],["shaheed4u",47],["speedostream",47],["sportcast",47],["sportskart",47],["streamingcommunity",47],["tamilarasan",47],["tamilfreemp3songs",47],["tamilprinthd",47],["torrentdosfilmes",47],["tubemate",47],["uploadrar",47],["uqload",47],["vidcloud9",47],["vido",47],["vidoo",47],["vudeo",47],["vumoo",47],["yesmovies",47],["mydverse",59],["stfly",69],["stly",69],["kickass",71],["cine-calidad",77],["teluguflix",93],["actvid",109],["lk21official",158],["nontondrama",158],["dropgalaxy",174]]);

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
        node.textContent = after;
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
