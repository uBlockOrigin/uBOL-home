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

const argsList = [["script","AdDefend"],["script","/getAdUnitPath|\\.then\\(eval\\)|DisplayAcceptableAdIfAdblocked|,eval\\)\\)\\)\\;|\\.join\\(\\'\\'\\)\\}\\;/"],["script","/==undefined.*body/"],["script","style"],["script","Promise"],["script","Number.isSafeInteger"],["script","Reflect"],["script","document.write"],["script","self == top"],["script","/popunder|isAdBlock|admvn.src/i"],["script","deblocker"],["script","exdynsrv"],["script","/adb/i"],["script","adsbygoogle"],["script","FingerprintJS"],["script","/h=decodeURIComponent|popundersPerIP/"],["script","/adblock.php"],["script","/document\\.createElement|\\.banner-in/"],["script","/block-adb|-0x|adblock/"],["script","ExoLoader"],["script","/?key.*open/","condition","key"],["script","adblock"],["script","homad"],["script","alert"],["script","/adblock|popunder/"],["script","fetch"],["script","window.open"],["script",";break;case $."],["script","googlesyndication"],["script","queue.addFile"],["script","htmls"],["script","/\\/detected\\.html|Adblock/"],["script","toast"],["script","/window\\.open|window\\.location\\.href|document\\.addEventListener|\\$\\(document\\)\\.ready.*show/"],["script","AdbModel"],["script","antiAdBlockerHandler"],["script","onerror"],["script","/checkAdBlocker|AdblockRegixFinder/"],["script","catch"],["script","adb_detected"],["script","Adblock"],["script","break;case $."],["style","text-decoration"],["script","push"],["script","AdBlocker"],["script","clicky"],["script","charCodeAt"],["script","checkifscript"],["script","popMagic"],["script","/popMagic|pop1stp/"],["script","popunder"],["script","/adblock|location\\.replace/"],["script","/downloadJSAtOnload|Object.prototype.toString.call/"],["script","numberPages"],["script","KCgpPT57bGV0IGU"],["script","error-report.com"],["script","serve"],["script","/ConsoleBan|alert|AdBlocker/"],["script","adb"],["script","await fetch"],["script","innerHTML"],["script","/'.adsbygoogle'|text-danger|warning|Adblock|_0x/"],["script","popUnder"],["#text","/スポンサーリンク|Sponsored Link|广告/"],["#text","スポンサーリンク"],["#text","スポンサードリンク"],["#text","/\\[vkExUnit_ad area=(after|before)\\]/"],["#text","【広告】"],["#text","【PR】"],["#text","関連動画"],["#text","PR:"],["script","leave_recommend"],["#text","/^Advertisement$/"],["script","zfgloaded"],["script","ai_adb"],["script","HTMLAllCollection"],["script","liedetector"],["script","popWin"],["script","end_click"],["script","ad blocker"],["script","closeAd"],["script","/modal|popupads/"],["script","/adconfig/i"],["script","AdblockDetector"],["script","is_antiblock_refresh"],["script","/userAgent|adb|htmls/"],["script","myModal"],["script","ad_block"],["script","app_checkext"],["script","shown_at"],["script","clientHeight"],["script","/url_key|adHtml/"],["script","pop.target"],["script","showadblock"],["script","axios"],["script","ad block"],["script","\"v4ac1eiZr0\""],["script","admiral"],["script","/charAt|XMLHttpRequest/"],["script","AdBlockEnabled"],["script","window.location.replace"],["script","/$.*open/"],["script","Brave"],["script","egoTab"],["script","abDetectorPro"],["script","/$.*(css|oncontextmenu)/"],["script","/eval.*RegExp/"],["script","wwads"],["script","/\\[\\'push\\'\\]/"],["script","/adblock/i"],["script","/$.*adUnits/"],["script","decodeURIComponent"],["script","RegExp"],["script","adbl"],["script","doOpen"],["script","adsBlocked"],["script","chkADB"],["script","AaDetector"],["script","AdBlock"],["script","Symbol.iterator"],["script","/innerHTML.*appendChild/"],["script","Exo"],["script","detectAdBlock"],["script","popup"],["script","/window\\[\\'open\\'\\]/"],["script","Error"],["script","document.head.appendChild"],["script","Number"],["script","ad-block-activated"],["script","insertBefore"],["script","pop.doEvent"],["script","constructor"],["script","/adbl/i"],["script","detect"],["script","btnHtml"],["script","/join\\(\\'\\'\\)/"],["script","/join\\(\\\"\\\"\\)/"],["script","api.dataunlocker.com"],["script","vglnk"],["script","/RegExp\\(\\'/","condition","RegExp"],["script",".slice(0, -1); }"],["script","(Math.PI).toFixed(10).slice(0, -1);"],["script","AdblockRegixFinder"],["script","/(?<=if\\((\\s){0,}!window\\.(\\s){0,}[shouldExist\\d+]{1,}\\) {)([^;]+)/gms"],["script","/document\\[`(.+?)`\\]\\.innerHTML = window\\..*;/gms"],["script","/document.*.innerHTML =window\\..*;/gms"],["script","NREUM"]];

const hostnamesMap = new Map([["giga.de",0],["kino.de",0],["teltarif.de",1],["aupetitparieur.com",2],["allthingsvegas.com",2],["100percentfedup.com",2],["beforeitsnews.com",2],["concomber.com",2],["conservativebrief.com",2],["conservativefiringline.com",2],["dailylol.com",2],["funnyand.com",2],["letocard.fr",2],["mamieastuce.com",2],["meilleurpronostic.fr",2],["patriotnationpress.com",2],["toptenz.net",2],["vitamiiin.com",2],["writerscafe.org",2],["populist.press",2],["dailytruthreport.com",2],["livinggospeldaily.com",2],["first-names-meanings.com",2],["welovetrump.com",2],["thehayride.com",2],["thelibertydaily.com",2],["thepoke.co.uk",2],["thepolitistick.com",2],["theblacksphere.net",2],["shark-tank.com",2],["naturalblaze.com",2],["greatamericanrepublic.com",2],["dailysurge.com",2],["truthlion.com",2],["flagandcross.com",2],["westword.com",2],["republicbrief.com",2],["freedomfirstnetwork.com",2],["phoenixnewtimes.com",2],["designbump.com",2],["clashdaily.com",2],["madworldnews.com",2],["reviveusa.com",2],["sonsoflibertymedia.com",2],["thedesigninspiration.com",2],["videogamesblogger.com",2],["protrumpnews.com",2],["thepalmierireport.com",2],["kresy.pl",2],["thepatriotjournal.com",2],["gellerreport.com",2],["thegatewaypundit.com",2],["wltreport.com",2],["miaminewtimes.com",2],["politicalsignal.com",2],["rightwingnews.com",2],["bigleaguepolitics.com",2],["comicallyincorrect.com",2],["moviepilot.de",4],["yts.mx",7],["upornia.com",9],["pinsystem.co.uk",10],["tinyppt.com",10],["downfile.site",10],["expertvn.com",10],["trangchu.news",10],["bharathwick.com",10],["descargaspcpro.net",10],["dx-tv.com",10],["rt3dmodels.com",10],["plc4me.com",10],["blisseyhusbands.com",10],["mhdsportstv.com",10],["madaradex.org",10],["learnmany.in",10],["loaninsurehub.com",10],["appkamods.com",10],["techacode.com",10],["3dmodelshare.org",10],["nulleb.com",10],["reset-scans.us",10],["coursesghar.com",10],["thecustomrom.com",10],["bingotingo.com",10],["ghior.com",10],["3dmili.com",10],["karanpc.com",10],["plc247.com",10],["hiraethtranslation.com",10],["javindo.eu.org",10],["chindohot.site",10],["freepasses.org",10],["tomarnarede.pt",10],["basketballbuzz.ca",10],["dribbblegraphics.com",10],["kemiox.com",10],["checkersmenu.us",10],["teksnologi.com",10],["dollareuro.live",10],["eporner.com",12],["germancarforum.com",13],["cybercityhelp.in",13],["sinvida.me",[14,15]],["streamnoads.com",[14,15,41]],["bowfile.com",14],["cloudvideo.tv",[14,41]],["coloredmanga.com",14],["embedstream.me",[14,15,41]],["exeo.app",14],["hiphopa.net",[14,15]],["megaup.net",14],["tv247.us",[14,15]],["uploadhaven.com",14],["userscloud.com",[14,41]],["mdfx9dc8n.net",15],["mdzsmutpcvykb.net",15],["123movies4u.site",15],["1337xporn.com",15],["141jav.com",15],["1bit.space",15],["1bitspace.com",15],["38dh2.top",15],["3dporndude.com",15],["4archive.org",15],["4horlover.com",15],["560pmovie.com",15],["60fps.xyz",15],["85tube.com",15],["85videos.com",15],["8xlinks.click",15],["a2zcrackworld.com",15],["aazzz.xyz",15],["acefile.co",15],["actusports.eu",15],["adblockplustape.com",15],["adclickersbot.com",15],["adricami.com",15],["adslink.pw",15],["adultstvlive.com",15],["adz7short.space",15],["aeblender.com",15],["ahdafnews.blogspot.com",15],["ak47sports.com",15],["akuma.moe",15],["allplayer.tk",15],["allstreaming.online",15],["amadoras.cf",15],["amadorasdanet.shop",15],["amateurblog.tv",15],["androidadult.com",15],["anhsexjav.xyz",15],["anidl.org",15],["anime-loads.org",15],["animeblkom.net",15],["animefire.net",15],["animelek.me",15],["animeshouse.net",15],["animespire.net",15],["animestotais.xyz",15],["animeyt.es",15],["anroll.net",15],["anymoviess.xyz",15],["aotonline.org",15],["asenshu.com",15],["asialiveaction.com",15],["asianclipdedhd.net",15],["askim-bg.com",15],["asumsikedaishop.com",15],["avcrempie.com",15],["avseesee.com",15],["backfirstwo.com",15],["bajarjuegospcgratis.com",15],["balkanportal.net",15],["balkanteka.net",15],["bdnewszh.com",[15,41]],["belowporn.com",15],["bestclaimtrx.xyz",15],["bestgirlsexy.com",15],["bestnhl.com",15],["bestporn4free.com",15],["bestporncomix.com",15],["bet36.es",15],["bikinitryon.net",15],["birdurls.com",15],["bitsearch.to",15],["blackcockadventure.com",15],["blackcockchurch.org",15],["blackporncrazy.com",15],["blizzboygames.net",15],["blizzpaste.com",15],["blkom.com",15],["blog-peliculas.com",15],["blogtrabalhista.com",15],["blurayufr.xyz",15],["bobsvagene.club",15],["bolly4umovies.click",15],["bonusharian.pro",15],["brilian-news.id",15],["brupload.net",15],["bucitana.com",15],["cablegratis.online",15],["camchickscaps.com",15],["camgirlcum.com",15],["camgirls.casa",15],["cashurl.in",15],["castingx.net",15],["ccurl.net",[15,41]],["celebrity-leaks.net",15],["cgpelis.net",15],["charexempire.com",15],["clasico.tv",15],["clik.pw",15],["coin-free.com",[15,30]],["coins100s.fun",15],["comicsmanics.com",15],["compucalitv.com",15],["coolcast2.com",15],["cosplaytab.com",15],["countylocalnews.com",15],["cpmlink.net",15],["crackstreamshd.click",15],["crespomods.com",15],["crisanimex.com",15],["crunchyscan.fr",15],["cuevana3.fan",15],["cuevana3hd.com",15],["cumception.com",15],["curvaweb.com",15],["cutpaid.com",15],["datawav.club",15],["daughtertraining.com",15],["deepgoretube.site",15],["deltabit.co",15],["depvailon.com",15],["derleta.com",15],["desivdo.com",15],["desixx.net",15],["detikkebumen.com",15],["deutschepornos.me",15],["diasoft.xyz",15],["directupload.net",15],["diskusscan.com",15],["dixva.com",15],["dlhd.sx",15],["doctormalay.com",15],["dofusports.xyz",15],["dogemate.com",15],["doods.cam",15],["doodskin.lat",15],["downloadrips.com",15],["downvod.com",15],["dphunters.mom",15],["dragontranslation.com",15],["duddes.xyz",15],["dvdfullestrenos.com",15],["ebookbb.com",15],["ebookhunter.net",15],["egyanime.com",15],["egygost.com",15],["egyshare.cc",15],["ekasiwap.com",15],["electro-torrent.pl",15],["elil.cc",15],["embed4u.xyz",15],["eplayer.click",15],["erovoice.us",15],["eroxxx.us",15],["estrenosdoramas.net",15],["everia.club",15],["everythinginherenet.blogspot.com",15],["extrafreetv.com",15],["extremotvplay.com",15],["fapinporn.com",15],["fapptime.com",15],["fashionblog.tv",15],["fastreams.live",15],["faucethero.com",15],["fembed.com",15],["femdom-joi.com",15],["fileone.tv",15],["film1k.com",15],["filmeonline2023.net",15],["filmesonlinex.org",15],["filmesonlinexhd.biz",[15,41]],["filmovi.ws",[15,41]],["filmovitica.com",15],["filmymaza.blogspot.com",15],["filthy.family",15],["fixfinder.click",15],["flostreams.xyz",15],["flyfaucet.com",15],["footyhunter.lol",15],["footyhunter3.xyz",[15,41]],["forex-golds.com",15],["forex-trnd.com",15],["forumchat.club",15],["forumlovers.club",15],["freemoviesonline.biz",15],["freeomovie.co.in",15],["freeomovie.to",15],["freeporncomic.net",15],["freepornhdonlinegay.com",15],["freeproxy.io",15],["freeuse.me",15],["freeusexporn.com",15],["fsicomics.com",15],["gambarbogel.xyz",15],["gamepcfull.com",15],["gameronix.com",15],["gamesfullx.com",15],["gameshdlive.net",15],["gameshdlive.xyz",[15,41]],["gamesmountain.com",15],["gamesrepacks.com",15],["gamingguru.fr",15],["gamovideo.com",15],["garota.cf",15],["gaydelicious.com",15],["gaypornmasters.com",15],["gaysex69.net",15],["gemstreams.com",15],["get-to.link",15],["girlscanner.org",15],["giurgiuveanul.ro",15],["gledajcrtace.xyz",15],["gocast2.com",15],["gomo.to",15],["gostosa.cf",15],["gtlink.co",15],["gwiazdypornosow.pl",15],["haho.moe",15],["hatsukimanga.com",15],["hayhd.net",15],["hdsaprevodom.com",15],["hdstreamss.club",15],["hentais.tube",15],["hentaistream.co",15],["hentaitk.net",15],["hentaitube.online",15],["hentaiworld.tv",15],["hesgoal.tv",15],["hexupload.net",15],["hhkungfu.tv",15],["highlanderhelp.com",15],["hindimean.com",15],["hindimovies.to",[15,41]],["hiperdex.com",15],["hispasexy.org",15],["hitomi.la",15],["hitprn.com",15],["hoca4u.com",15],["hollymoviehd.cc",15],["hoodsite.com",15],["hopepaste.download",15],["hornylips.com",15],["hotgranny.live",15],["hotmama.live",15],["hqcelebcorner.net",15],["huren.best",15],["hwnaturkya.com",[15,41]],["hxfile.co",[15,41]],["igfap.com",15],["ihdstreams.xyz",15],["iklandb.com",15],["illink.net",15],["imgkings.com",15],["imgsex.xyz",15],["imx.to",15],["influencersgonewild.org",15],["infosgj.free.fr",15],["investnewsbrazil.com",15],["itdmusics.com",15],["itopmusic.org",15],["itsuseful.site",15],["itunesfre.com",15],["iwatchfriendsonline.net",[15,76]],["jackstreams.com",15],["jatimupdate24.com",15],["javcl.com",15],["javf.net",15],["javhay.net",15],["javhoho.com",15],["javhun.com",15],["javleak.com",15],["javporn.best",15],["javsex.to",15],["javtiful.com",15],["jimdofree.com",15],["jiofiles.org",15],["jorpetz.com",15],["journalyc.online",15],["jp-films.com",15],["jpop80ss3.blogspot.com",15],["jpopsingles.eu",15],["kantotflix.net",15],["kantotinyo.com",15],["kaoskrew.org",15],["kaplog.com",15],["keralatvbox.com",15],["kimochi.info",15],["kimochi.tv",15],["kinemania.tv",15],["konstantinova.net",15],["koora-online.live",15],["kunmanga.com",15],["kutmoney.com",15],["kwithsub.com",15],["ladangreceh.xyz",15],["lat69.me",15],["latinblog.tv",15],["latinomegahd.net",15],["lazyfaucet.com",15],["leechpremium.link",15],["legendas.dev",15],["legendei.net",15],["lightdlmovies.blogspot.com",15],["lighterlegend.com",15],["linclik.com",15],["linkebr.com",15],["linkrex.net",15],["links.worldfree4u-lol.online",15],["linksfy.co",15],["lody.ink",15],["lovesomecommunity.com",15],["lulustream.com",[15,41]],["luluvdo.com",[15,41]],["luzcameraeacao.shop",15],["manga-oni.com",15],["mangaboat.com",15],["mangagenki.me",15],["mangahere.onl",15],["mangaweb.xyz",15],["mangoporn.net",15],["manhwahentai.me",15],["masahub.com",15],["masahub.net",15],["maturegrannyfuck.com",15],["mdy48tn97.com",15],["mediapemersatubangsa.com",15],["mega-mkv.com",15],["megapastes.com",15],["megapornpics.com",15],["messitv.net",15],["meusanimes.net",15],["milfmoza.com",15],["milfzr.com",15],["millionscast.com",15],["mimaletamusical.blogspot.com",15],["mitly.us",15],["mkv-pastes.com",15],["modb.xyz",15],["monaskuliner.ac.id",15],["moredesi.com",15],["movgotv.net",15],["movi.pk",15],["movieswbb.com",15],["moviewatch.com.pk",[15,41]],["mp4upload.com",15],["mrskin.live",15],["multicanaistv.com",15],["mundowuxia.com",15],["myeasymusic.ir",15],["myonvideo.com",15],["myyouporn.com",15],["narutoget.info",15],["naughtypiss.com",15],["nerdiess.com",15],["new-fs.eu",15],["newtorrentgame.com",15],["nflstreams.me",15],["niaomea.me",[15,41]],["nicekkk.com",15],["nicesss.com",15],["nolive.me",[15,41]],["nopay.info",15],["nopay2.info",[15,117]],["notformembersonly.com",15],["novamovie.net",15],["novelpdf.xyz",15],["novelssites.com",[15,41]],["novelup.top",15],["nsfwr34.com",15],["nu6i-bg-net.com",15],["nudebabesin3d.com",15],["nukedfans.com",15],["nuoga.eu",15],["nzbstars.com",15],["ohjav.com",15],["ojearnovelas.com",15],["okanime.xyz",15],["olarixas.xyz",15],["oldbox.cloud",15],["olweb.tv",15],["olympicstreams.me",15],["on9.stream",15],["oncast.xyz",15],["onepiece-mangaonline.com",15],["onifile.com",15],["onionstream.live",15],["onlinesaprevodom.net",15],["onlyfullporn.video",15],["onplustv.live",15],["originporn.com",15],["ovagames.com",15],["ovamusic.com",15],["owllink.net",15],["packsporn.com",15],["pahaplayers.click",15],["palimas.org",15],["pandafiles.com",15],["papahd.club",15],["papahd1.xyz",15],["password69.com",15],["paste3.org",15],["pastemytxt.com",15],["payskip.org",15],["peeplink.in",15],["peliculasmx.net",15],["pervertgirlsvideos.com",15],["pervyvideos.com",15],["phim12h.com",15],["picdollar.com",15],["pickteenz.com",15],["pics4you.net",15],["picsxxxporn.com",15],["pinayscandalz.com",15],["pinkueiga.net",15],["piratefast.xyz",15],["piratehaven.xyz",15],["pirateiro.com",15],["pirlotvonline.org",15],["playtube.co.za",15],["plugintorrent.com",15],["pmvzone.com",15],["porndish.com",15],["pornez.net",15],["pornfetishbdsm.com",15],["pornfits.com",15],["pornhd720p.com",15],["pornobr.club",15],["pornobr.ninja",15],["pornodominicano.net",15],["pornofaps.com",15],["pornoflux.com",15],["pornotorrent.com.br",15],["pornredit.com",15],["pornstarsyfamosas.es",15],["pornstreams.co",15],["porntn.com",15],["pornxbit.com",15],["pornxday.com",15],["portaldasnovinhas.shop",15],["portugues-fcr.blogspot.com",15],["poscishd.online",15],["poscitesch.com",[15,41]],["poseyoung.com",15],["pover.org",15],["proxyninja.org",15],["pubfilmz.com",15],["publicsexamateurs.com",15],["punanihub.com",15],["putlocker5movies.org",15],["pxxbay.com",15],["r18.best",15],["ragnaru.net",15],["rapbeh.net",15],["rapelust.com",15],["rapload.org",15],["read-onepiece.net",15],["retro-fucking.com",15],["retrotv.org",15],["robaldowns.com",15],["rockdilla.com",15],["rojadirectatvenvivo.com",15],["rojitadirecta.blogspot.com",15],["romancetv.site",15],["rule34.club",15],["rule34hentai.net",15],["rumahbokep-id.com",15],["safego.cc",15],["sakurafile.com",15],["satoshi-win.xyz",15],["scat.gold",15],["scatfap.com",15],["scatkings.com",15],["scnlog.me",15],["scripts-webmasters.net",15],["serie-turche.com",15],["serijefilmovi.com",15],["sexcomics.me",15],["sexdicted.com",15],["sexgay18.com",15],["sexofilm.co",15],["sextgem.com",15],["sextubebbw.com",15],["sgpics.net",15],["shadowrangers.live",15],["shahee4u.cam",15],["shahiid-anime.net",15],["shemale6.com",15],["shinden.pl",15],["short.es",15],["showmanga.blog.fc2.com",15],["shrt10.com",15],["shurt.pw",15],["sideplusleaks.net",15],["silverblog.tv",15],["silverpic.com",15],["sinhalasub.life",15],["sinsitio.site",15],["skidrowcpy.com",15],["skidrowfull.com",15],["skidrowreloaded.com",15],["slut.mom",15],["smallencode.me",15],["smoner.com",15],["smplace.com",15],["soccerinhd.com",15],["socceron.name",15],["softairbay.com",15],["sokobj.com",15],["songsio.com",15],["souexatasmais.com",15],["sportbar.live",15],["sportea.online",15],["sportskart.xyz",15],["sportstream1.cfd",15],["srt.am",15],["srts.me",15],["stakes100.xyz",15],["stbemuiptv.com",15],["stockingfetishvideo.com",15],["stream.lc",15],["stream25.xyz",15],["streambee.to",15],["streamcenter.pro",15],["streamers.watch",15],["streamgo.to",15],["streamkiste.tv",15],["streamoporn.xyz",15],["streamoupload.xyz",15],["streamservicehd.click",15],["streamvid.net",[15,21]],["subtitleporn.com",15],["subtitles.cam",15],["suicidepics.com",15],["supertelevisionhd.com",15],["supexfeeds.com",15],["swzz.xyz",15],["sxnaar.com",15],["tabooporns.com",15],["taboosex.club",15],["tapeantiads.com",15],["tapeblocker.com",15],["tapenoads.com",15],["tapewithadblock.org",[15,139]],["teamos.xyz",15],["teen-wave.com",15],["teenporncrazy.com",15],["telegramgroups.xyz",15],["telenovelasweb.com",15],["tensei-shitara-slime-datta-ken.com",15],["tfp.is",15],["tgo-tv.co",[15,41]],["thaihotmodels.com",15],["theblueclit.com",15],["thebussybandit.com",15],["theicongenerator.com",15],["thelastdisaster.vip",15],["thepiratebay0.org",15],["thepiratebay10.info",15],["thesexcloud.com",15],["thothub.today",15],["tightsexteens.com",15],["tojav.net",15],["tokyoblog.tv",15],["tonnestreamz.xyz",15],["top16.net",15],["topvideosgay.com",15],["torrage.info",15],["torrents.vip",15],["torrsexvid.com",15],["tpb-proxy.xyz",15],["trannyteca.com",15],["trendytalker.com",15],["tumanga.net",15],["turbogvideos.com",15],["turbovid.me",15],["turkishseriestv.org",15],["turksub24.net",15],["tutele.sx",15],["tutelehd3.xyz",15],["tvglobe.me",15],["tvpclive.com",15],["tvs-widget.com",15],["tvseries.video",15],["ucptt.com",15],["ufaucet.online",15],["ufcfight.online",15],["uhdgames.xyz",15],["ultrahorny.com",15],["ultraten.net",15],["unblockweb.me",15],["underhentai.net",15],["uniqueten.net",15],["upbaam.com",15],["upstream.to",15],["valeriabelen.com",15],["verdragonball.online",15],["vfxmed.com",15],["video.az",15],["videostreaming.rocks",15],["videowood.tv",15],["vidorg.net",15],["vidtapes.com",15],["vidz7.com",15],["vikistream.com",15],["vikv.net",15],["virpe.cc",15],["visifilmai.org",15],["viveseries.com",15],["vladrustov.sx",15],["volokit2.com",15],["vstorrent.org",15],["w-hentai.com",15],["watchaccordingtojimonline.com",15],["watchbrooklynnine-nine.com",15],["watchdowntonabbeyonline.com",15],["watchelementaryonline.com",15],["watcheronline.net",15],["watchgleeonline.com",15],["watchjavidol.com",15],["watchkobestreams.info",15],["watchlostonline.net",15],["watchlouieonline.com",15],["watchmonkonline.com",15],["watchparksandrecreation.net",15],["watchprettylittleliarsonline.com",15],["watchrulesofengagementonline.com",15],["watchthekingofqueens.com",15],["watchthemiddleonline.com",15],["watchtvchh.xyz",15],["webcamrips.com",15],["wickedspot.org",15],["wincest.xyz",15],["witanime.best",15],["wolverdonx.com",15],["wordcounter.icu",15],["worldcupstream.pm",15],["worldmovies.store",15],["worldstreams.click",15],["wpdeployit.com",15],["wqstreams.tk",15],["wwwsct.com",15],["xanimeporn.com",15],["xblog.tv",15],["xn--verseriesespaollatino-obc.online",15],["xn--xvideos-espaol-1nb.com",15],["xpornium.net",15],["xsober.com",15],["xvip.lat",15],["xxgasm.com",15],["xxvideoss.org",15],["xxx18.uno",15],["xxxdominicana.com",15],["xxxfree.watch",15],["xxxmax.net",15],["xxxwebdlxxx.top",15],["xxxxvideo.uno",15],["y2b.wiki",15],["yabai.si",15],["yadixv.com",15],["yayanimes.net",15],["yeshd.net",15],["yodbox.com",15],["youjax.com",15],["youpits.xyz",15],["yourdailypornvideos.ws",15],["yourupload.com",15],["ytstv.me",15],["ytstvmovies.co",15],["ytstvmovies.xyz",15],["ytsyify.co",15],["ytsyifymovie.com",15],["zerion.cc",15],["zerocoin.top",15],["zitss.xyz",15],["zpaste.net",15],["zplayer.live",15],["oko.sh",17],["bigbtc.win",18],["cryptofun.space",18],["sexo5k.com",19],["truyen-hentai.com",19],["theshedend.com",21],["rsadnetworkinfo.com",21],["rsinsuranceinfo.com",21],["rsfinanceinfo.com",21],["rsgamer.app",21],["rssoftwareinfo.com",21],["rshostinginfo.com",21],["rseducationinfo.com",21],["zeroupload.com",21],["securenetsystems.net",21],["miniwebtool.com",21],["bchtechnologies.com",21],["spiegel.de",22],["appnee.com",23],["d0o0d.com",24],["do0od.com",24],["doods.pro",24],["ds2play.com",24],["ds2video.com",24],["onlyfaucet.com",25],["claimclicks.com",25],["thebullspen.com",25],["livecamrips.com",26],["smutty.com",26],["down.dataaps.com",26],["filmweb.pl",26],["infinityscans.xyz",27],["infinityscans.net",27],["iisfvirtual.in",28],["starxinvestor.com",28],["beatsnoop.com",28],["fetchpik.com",28],["hackerranksolution.in",28],["webhostingpost.com",[29,41]],["tophostingapp.com",29],["digitalmarktrend.com",29],["btcbitco.in",30],["btcsatoshi.net",30],["cempakajaya.com",30],["crypto4yu.com",30],["gainl.ink",30],["manofadan.com",30],["readbitcoin.org",30],["wiour.com",30],["kienthucrangmieng.com",30],["tremamnon.com",30],["btc25.org",30],["tron-free.com",30],["bitsmagic.fun",30],["ourcoincash.xyz",30],["hynews.biz",30],["blog.cryptowidgets.net",31],["blog.insurancegold.in",31],["blog.wiki-topia.com",31],["blog.coinsvalue.net",31],["blog.cookinguide.net",31],["blog.freeoseocheck.com",31],["aylink.co",32],["suaurl.com",33],["sugarona.com",34],["nishankhatri.xyz",34],["highkeyfinance.com",34],["amanguides.com",34],["tinys.click",35],["answerpython.com",35],["gsm-solution.com",35],["h-donghua.com",35],["hindisubbedacademy.com",35],["pkgovjobz.com",35],["ripexbooster.xyz",35],["serial4.com",35],["serial412.blogspot.com",35],["sigmalinks.in",35],["tutorgaming.com",35],["appsbull.com",36],["diudemy.com",36],["maqal360.com",36],["mphealth.online",36],["makefreecallsonline.com",36],["androjungle.com",36],["bookszone.in",36],["drakescans.com",36],["shortix.co",36],["msonglyrics.com",36],["app-sorteos.com",36],["bokugents.com",36],["btvplus.bg",36],["coingraph.us",37],["impact24.us",37],["iconicblogger.com",38],["tii.la",39],["kiemlua.com",40],["123moviefree4u.com",41],["194.163.183.129",41],["6movies.net",41],["adsh.cc",41],["afilmyhouse.blogspot.com",41],["ak.sv",41],["animefenix.com",41],["animefrenzy.net",41],["animeshouse.info",41],["animesultra.com",41],["api.webs.moe",41],["apkmody.io",41],["atglinks.com",41],["attvideo.com",41],["avimobilemovies.net",41],["backfirstwo.site",[41,108]],["cinema.cimatna.com",41],["crazyblog.in",41],["dembed1.com",41],["dembed2.com",41],["divicast.com",41],["egynow.cam",41],["embed.meomeo.pw",41],["fanproj.net",41],["filebox.click",41],["filmeserialeonline.org",41],["filmyzilla2021.xyz",41],["filmyzilla2022.com",41],["filmyzillafullmovie.waystohunt.info",41],["flexyhit.com",41],["foreverwallpapers.com",41],["french-streams.cc",41],["fslinks.org",41],["fstream365.com",41],["gdrivez.xyz",41],["hinatasoul.com",41],["hitmovies4u.com",41],["hotstar.news",41],["isaidub3.co",41],["membed.net",41],["mgnetu.com",41],["moviesdanet.com",41],["moviewatchonline.com.pk",41],["mp3juice.info",41],["mp3juices.cc",41],["neomovies.net",41],["newsrade.com",41],["nollyverse.com",41],["oii.io",41],["pepperlive.info",41],["playertv.net",41],["putlocker68.com",41],["s.to",41],["sharkfish.xyz",41],["skidrowcodex.net",41],["sports-stream.site",41],["stream4free.live",41],["tamilmobilemovies.in",41],["thewatchseries.live",41],["tnmusic.in",41],["travelplanspro.com",41],["tusfiles.com",41],["unlimitmovies.com",41],["uploadflix.org",41],["vid-guard.com",41],["vidsaver.net",41],["vidspeeds.com",41],["viralitytoday.com",41],["voiranime.stream",41],["watchdoctorwhoonline.com",41],["webseriesclub.com",41],["ylink.bid",41],["ytix.xyz",41],["unblocked.id",43],["listendata.com",44],["7xm.xyz",44],["fastupload.io",44],["azmath.info",44],["wouterplanet.com",45],["androidacy.com",46],["jytechs.in",47],["djxmaza.in",47],["miuiflash.com",47],["thecubexguide.com",47],["veryfreeporn.com",48],["besthdgayporn.com",49],["freeroms.com",50],["soap2day-online.com",50],["austiblox.net",51],["btcbunch.com",52],["teachoo.com",53],["genshinlab.com",54],["fourfourtwo.co.kr",54],["interfootball.co.kr",54],["a-ha.io",54],["cboard.net",54],["mobilitytv.co.kr",54],["mememedia.co.kr",54],["newautopost.co.kr",54],["tvreport.co.kr",54],["tenbizt.com",54],["jjang0u.com",54],["joongdo.co.kr",54],["viva100.com",54],["thephoblographer.com",54],["newdaily.co.kr",54],["dogdrip.net",54],["golf-live.at",54],["gamingdeputy.com",54],["thesaurus.net",54],["tweaksforgeeks.com",54],["alle-tests.nl",54],["apkmirror.com",54],["dotkeypress.kr",54],["viewcash.co.kr",54],["tripplus.co.kr",54],["enterdiary.com",54],["mtodayauto.com",54],["hotplacehunter.co.kr",54],["mystylezip.com",54],["majorgeeks.com",54],["poro.gg",54],["maple.gg",54],["lolchess.gg",54],["dak.gg",54],["meconomynews.com",54],["brandbrief.co.kr",54],["dfast.kr",54],["youtu.co",54],["mlbpark.donga.com",54],["capress.kr",54],["carandmore.co.kr",54],["maxmovie.kr",54],["motorgraph.com",54],["newsbell.co.kr",54],["tminews.co.kr",54],["thehousemagazine.kr",54],["hardreset.info",54],["metabattle.com",54],["maketecheasier.com",54],["motorbikecatalog.com",54],["heraldcorp.com",54],["allthetests.com",55],["issuya.com",55],["topstarnews.net",55],["udvl.com",56],["topsporter.net",57],["sportshub.to",57],["easymc.io",58],["yunjiema.top",58],["hacoos.com",59],["bondagevalley.cc",60],["zefoy.com",61],["vidello.net",62],["resizer.myct.jp",63],["gametohkenranbu.sakuraweb.com",64],["jisakuhibi.jp",65],["rank1-media.com",65],["lifematome.blog",66],["fm.sekkaku.net",67],["free-avx.jp",68],["dvdrev.com",69],["betweenjpandkr.blog",70],["nft-media.net",71],["ghacks.net",72],["songspk2.info",73],["truyentranhfull.net",74],["nectareousoverelate.com",77],["khoaiphim.com",78],["haafedk2.com",79],["fordownloader.com",79],["jovemnerd.com.br",80],["nicomanga.com",81],["totalcsgo.com",82],["vivamax.asia",83],["manysex.com",84],["gaminginfos.com",85],["tinxahoivn.com",86],["forums-fastunlock.com",87],["automoto.it",88],["sekaikomik.bio",89],["codelivly.com",90],["ophim.vip",91],["touguatize.monster",92],["client.falixnodes.net",93],["novelhall.com",94],["hes-goal.net",95],["abc17news.com",96],["adoredbyalex.com",96],["agrodigital.com",96],["al.com",96],["allaboutthetea.com",96],["allmovie.com",96],["allmusic.com",96],["allthingsthrifty.com",96],["androidpolice.com",96],["antyradio.pl",96],["artforum.com",96],["artnews.com",96],["avherald.com",96],["awkward.com",96],["awkwardmom.com",96],["bailiwickexpress.com",96],["barnsleychronicle.com",96],["becomingpeculiar.com",96],["blogher.com",96],["briefeguru.de",96],["carmagazine.co.uk",96],["cattime.com",96],["cbr.com",96],["cbssports.com",96],["chaptercheats.com",96],["cleveland.com",96],["collider.com",96],["comingsoon.net",96],["commercialobserver.com",96],["competentedigitale.ro",96],["crafty.house",96],["dailyvoice.com",96],["decider.com",96],["didyouknowfacts.com",96],["dogtime.com",96],["dualshockers.com",96],["dustyoldthing.com",96],["faithhub.net",96],["femestella.com",96],["footwearnews.com",96],["freeconvert.com",96],["frogsandsnailsandpuppydogtail.com",96],["gamerant.com",96],["gfinityesports.com",96],["givemesport.com",96],["gulflive.com",96],["helloflo.com",96],["howtogeek.com",96],["insider-gaming.com",96],["insurancejournal.com",96],["jasminemaria.com",96],["kion546.com",96],["lehighvalleylive.com",96],["lettyskitchen.com",96],["liveandletsfly.com",96],["lizzieinlace.com",96],["localnews8.com",96],["lonestarlive.com",96],["madeeveryday.com",96],["maidenhead-advertiser.co.uk",96],["makeuseof.com",96],["mardomreport.net",96],["masslive.com",96],["milestomemories.com",96],["mlive.com",96],["modernmom.com",96],["momtastic.com",96],["mostlymorgan.com",96],["movieweb.com",96],["musicfeeds.com.au",96],["nationalreview.com",96],["nj.com",96],["nordot.app",96],["nothingbutnewcastle.com",96],["nsjonline.com",96],["nypost.com",96],["oakvillenews.org",96],["observer.com",96],["oregonlive.com",96],["pagesix.com",96],["pennlive.com",96],["pinkonthecheek.com",96],["puckermom.com",96],["qtoptens.com",96],["realgm.com",96],["robbreport.com",96],["samchui.com",96],["sandrarose.com",96],["screenrant.com",96],["sheknows.com",96],["sherdog.com",96],["sidereel.com",96],["silive.com",96],["simpleflying.com",96],["spacenews.com",96],["superherohype.com",96],["syracuse.com",96],["thecelticblog.com",96],["thecurvyfashionista.com",96],["thefashionspot.com",96],["thegamer.com",96],["thegamescabin.com",96],["thenonconsumeradvocate.com",96],["timesnews.net",96],["toyotaklub.org.pl",96],["travelingformiles.com",96],["tutsnode.org",96],["tvline.com",96],["viralviralvideos.com",96],["wimp.com",96],["woojr.com",96],["xda-developers.com",96],["cheatsheet.com",97],["pwinsider.com",97],["bagi.co.in",98],["keran.co",98],["biblestudytools.com",99],["christianheadlines.com",99],["ibelieve.com",99],["kuponigo.com",100],["kimcilonly.site",101],["kimcilonly.link",101],["cryptoearns.com",102],["inxxx.com",103],["ipaspot.app",104],["embedwish.com",105],["filelions.live",105],["leakslove.net",105],["jenismac.com",106],["vxetable.cn",107],["jewelavid.com",108],["nizarstream.com",108],["snapwordz.com",109],["toolxox.com",109],["rl6mans.com",109],["idol69.net",109],["plumbersforums.net",110],["123movies57.online",111],["gulio.site",112],["mediaset.es",113],["izlekolik.net",114],["donghuaworld.com",115],["letsdopuzzles.com",116],["tainio-mania.online",117],["hes-goals.io",118],["pkbiosfix.com",118],["casi3.xyz",118],["rediff.com",119],["dzapk.com",120],["darknessporn.com",121],["familyporner.com",121],["freepublicporn.com",121],["pisshamster.com",121],["punishworld.com",121],["xanimu.com",121],["pig69.com",122],["cosplay18.pics",122],["javhdo.net",123],["eroticmoviesonline.me",124],["teleclub.xyz",125],["ecamrips.com",126],["showcamrips.com",126],["9animetv.to",127],["jornadaperfecta.com",128],["loseart.com",129],["sousou-no-frieren.com",130],["veev.to",131],["intro-hd.net",132],["monacomatin.mc",132],["nodo313.net",132],["unite-guide.com",133],["appimagehub.com",134],["gnome-look.org",134],["store.kde.org",134],["linux-apps.com",134],["opendesktop.org",134],["pling.com",134],["xfce-look.org",134],["botcomics.com",135],["cefirates.com",135],["chandlerorchards.com",135],["comicleaks.com",135],["marketdata.app",135],["monumentmetals.com",135],["tapmyback.com",135],["ping.gg",135],["revistaferramental.com.br",135],["hawpar.com",135],["alpacafinance.org",[135,136]],["nookgaming.com",135],["enkeleksamen.no",135],["kvest.ee",135],["creatordrop.com",135],["panpots.com",135],["cybernetman.com",135],["bitdomain.biz",135],["gerardbosch.xyz",135],["fort-shop.kiev.ua",135],["accuretawealth.com",135],["resourceya.com",135],["tracktheta.com",135],["tt.live",136],["future-fortune.com",136],["abhijith.page",136],["madrigalmaps.com",136],["adventuretix.com",136],["panprices.com",137],["intercity.technology",137],["freelancer.taxmachine.be",137],["adria.gg",137],["fjlaboratories.com",137],["proboards.com",138],["winclassic.net",138],["www.chip.de",[140,141]],["bitcotasks.com",142],["perchance.org",[143,144,145]],["abema.tv",146]]);

const entitiesMap = new Map([["1337x",[3,15]],["kimcartoon",5],["pahe",[6,15]],["soap2day",6],["hqq",8],["waaw",8],["teluguflix",10],["pixhost",11],["viprow",[14,15,41]],["cloudvideotv",[14,41]],["vidsrc",[14,41]],["123-movies",15],["123movieshd",15],["123movieshub",15],["123moviesme",15],["1stream",15],["1tamilmv",15],["2ddl",15],["2umovies",15],["3hiidude",15],["4stream",15],["5movies",15],["7hitmovies",15],["9xmovie",15],["aagmaal",[15,41]],["adblockeronstape",15],["adblockeronstreamtape",15],["adblockstreamtape",15],["adblockstrtape",15],["adblockstrtech",15],["adblocktape",15],["adcorto",15],["alexsports",15],["alexsportss",15],["alexsportz",15],["animepahe",15],["animesanka",15],["animixplay",15],["aniplay",15],["antiadtape",15],["asianclub",15],["ask4movie",15],["atomixhq",[15,41]],["atomohd",15],["beinmatch",[15,20]],["bhaai",15],["buffstreams",15],["canalesportivo",15],["clickndownload",15],["clicknupload",15],["crackstreams",[15,41]],["daddylive",[15,41]],["daddylivehd",[15,41]],["desiremovies",15],["devlib",15],["divxtotal",15],["divxtotal1",15],["dvdplay",[15,41]],["elixx",15],["enjoy4k",15],["estrenosflix",15],["estrenosflux",15],["estrenosgo",15],["f1stream",15],["fbstream",15],["file4go",15],["filmyzilla",[15,41]],["findav",15],["findporn",15],["flixmaza",15],["flizmovies",15],["freetvsports",15],["fullymaza",15],["g3g",15],["gotxx",15],["grantorrent",15],["hdmoviesfair",[15,41]],["hdmoviesflix",15],["hiidudemoviez",15],["imgsen",15],["imgsto",15],["incest",15],["incestflix",15],["javmost",15],["keeplinks",15],["keepvid",15],["keralahd",15],["khatrimazaful",15],["khatrimazafull",15],["leechall",15],["linkshorts",15],["mangovideo",15],["masaporn",15],["miniurl",15],["mirrorace",15],["mixdroop",15],["mixdrop",15],["mkvcage",15],["mlbstream",15],["mlsbd",15],["mmsbee",15],["motogpstream",15],["movieplex",15],["movierulzlink",15],["movies123",15],["moviesflix",15],["moviesmeta",[15,41]],["moviessources",15],["moviesverse",15],["moviezwaphd",15],["mrunblock",15],["nbastream",15],["newmovierulz",15],["nflstream",15],["nhlstream",15],["noblocktape",15],["nocensor",15],["onlyfams",15],["ouo",15],["pctfenix",[15,41]],["pctnew",[15,41]],["peliculas24",15],["pelisplus",15],["piratebay",15],["plyjam",15],["plylive",15],["plyvdo",15],["pornhoarder",15],["prbay",15],["projectfreetv",15],["proxybit",15],["psarips",15],["racaty",15],["remaxhd",15],["rintor",15],["rnbxclusive",15],["rnbxclusive0",15],["rnbxclusive1",15],["rojadirecta",15],["rojadirectaenvivo",15],["rugbystreams",15],["safetxt",15],["shadowrangers",15],["shahi4u",15],["shahid4u1",15],["shahid4uu",15],["shavetape",15],["shortearn",15],["shorten",15],["shorttey",15],["shortzzy",15],["skymovieshd",15],["socceronline",15],["softarchive",15],["sports-stream",15],["sshhaa",15],["stapadblockuser",15],["stape",15],["stapewithadblock",15],["starmusiq",15],["strcloud",15],["streamadblocker",[15,41]],["streamadblockplus",15],["streamcdn",15],["streamhub",15],["streamsport",15],["streamta",15],["streamtape",15],["streamtapeadblockuser",15],["strikeout",15],["strtape",15],["strtapeadblock",15],["strtapeadblocker",15],["strtapewithadblock",15],["strtpe",15],["swatchseries",15],["tabooflix",15],["tennisstreams",15],["themoviesflix",15],["thepiratebay",15],["thisav",15],["tmearn",15],["toonanime",15],["torlock",15],["tormalayalam",15],["torrentz2eu",15],["tutelehd",15],["tvply",15],["u4m",15],["ufcstream",15],["unblocknow",15],["uploadbuzz",15],["usagoals",15],["vexmoviex",15],["vidclouds",15],["vidlox",15],["vipbox",[15,41]],["vipboxtv",[15,41]],["vipleague",15],["watch-series",15],["watchseries",15],["xclusivejams",15],["xmoviesforyou",15],["youdbox",15],["ytmp3eu",15],["yts-subs",15],["yts",15],["zooqle",15],["dutchycorp",16],["dood",[24,41]],["doodstream",24],["dooood",[24,41]],["shrinke",26],["shrinkme",26],["mydverse",35],["poplinks",36],["123movies",41],["123moviesla",41],["123movieweb",41],["2embed",41],["4hiidude",41],["720pstream",41],["9xmovies",41],["adshort",41],["allmovieshub",41],["asianplay",41],["atishmkv",41],["cricstream",41],["crictime",41],["databasegdriveplayer",41],["dloader",41],["easylinks",41],["extralinks",41],["extramovies",41],["faselhd",41],["filemoon",41],["filmy",41],["filmyhit",41],["filmywap",41],["fmovies",41],["fsapi",41],["gdplayer",41],["gdriveplayer",41],["goload",41],["gomoviefree",41],["gomovies",41],["gowatchseries",41],["hdmoviz",41],["hindilinks4u",41],["hurawatch",41],["isaidub",41],["isaidubhd",41],["jalshamoviezhd",41],["jiorockers",41],["linkshub",41],["linksme",41],["livecricket",41],["madrasdub",41],["mkvcinemas",41],["mobilemovies",41],["movies2watch",41],["moviesda1",41],["moviespapa",41],["mp4moviez",41],["mydownloadtube",41],["nsw2u",41],["nuroflix",41],["o2tvseries",41],["o2tvseriesz",41],["pirlotv",41],["poscitech",41],["primewire",41],["serienstream",41],["sflix",41],["shahed4u",41],["shaheed4u",41],["speedostream",41],["sportcast",41],["sportskart",41],["streamingcommunity",41],["tamilarasan",41],["tamilfreemp3songs",41],["tamilprinthd",41],["torrentdosfilmes",41],["uploadrar",41],["uqload",41],["vidcloud9",41],["vido",41],["vidoo",41],["vudeo",41],["vumoo",41],["watchomovies",[41,50]],["yesmovies",41],["kickass",42],["cine-calidad",48],["actvid",75]]);

const exceptionsMap = new Map([]);

/******************************************************************************/

function removeNodeText(
    nodeName,
    condition,
    ...extraArgs
) {
    replaceNodeTextFn(nodeName, '', '', 'condition', condition || '', ...extraArgs);
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
    const reCondition = safe.patternToRegex(extraArgs.condition || '', 'ms');
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
        reCondition.lastIndex = 0;
        if ( safe.RegExp_test.call(reCondition, before) === false ) { return true; }
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
