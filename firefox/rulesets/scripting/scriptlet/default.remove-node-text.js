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

const argsList = [["script","AdDefend"],["script","/getAdUnitPath|\\.then\\(eval\\)|DisplayAcceptableAdIfAdblocked|,eval\\)\\)\\)\\;|\\.join\\(\\'\\'\\)\\}\\;/"],["script","/==undefined.*body/"],["script","style"],["script","Promise"],["script","Number.isSafeInteger"],["script","Reflect"],["script","document.write"],["script","self == top"],["script","/popunder|isAdBlock|admvn.src/i"],["script","deblocker"],["script","exdynsrv"],["script","/adb/i"],["script","adsbygoogle"],["script","FingerprintJS"],["script","/h=decodeURIComponent|popundersPerIP/"],["script","/adblock.php"],["script","/document\\.createElement|\\.banner-in/"],["script","/block-adb|-0x|adblock/"],["script","ExoLoader"],["script","/?key.*open/","condition","key"],["script","adblock"],["script","homad"],["script","alert"],["script","/adblock|popunder/"],["script","fetch"],["script","window.open"],["script",";break;case $."],["script","zaraz"],["script","shown_at"],["script","googlesyndication"],["script","queue.addFile"],["script","/bypass.php"],["script","htmls"],["script","/\\/detected\\.html|Adblock/"],["script","toast"],["script","AdbModel"],["script","antiAdBlockerHandler"],["script","/ad\\s?block|adsBlocked|document\\.write\\(unescape\\('|devtool/i"],["script","onerror"],["script","location.assign"],["script","location.href"],["script","/checkAdBlocker|AdblockRegixFinder/"],["script","catch"],["script","adb_detected"],["script","Adblock"],["script","break;case $."],["style","text-decoration"],["script","push"],["script","AdBlocker"],["script","clicky"],["script","charCodeAt"],["script","checkifscript"],["script","popMagic"],["script","/popMagic|pop1stp/"],["script","popunder"],["script","/adblock|location\\.replace/"],["script","/downloadJSAtOnload|Object.prototype.toString.call/"],["script","numberPages"],["script","KCgpPT57bGV0IGU"],["script","error-report.com"],["script","AdblockRegixFinder"],["script","serve"],["script",".slice(0, -1); }"],["script","(Math.PI).toFixed(10).slice(0, -1);"],["script","/ConsoleBan|alert|AdBlocker/"],["script","alert","condition","adblock"],["script","adb"],["script","await fetch"],["script","innerHTML"],["script","/'.adsbygoogle'|text-danger|warning|Adblock|_0x/"],["script","popUnder"],["#text","/スポンサーリンク|Sponsored Link|广告/"],["#text","スポンサーリンク"],["#text","スポンサードリンク"],["#text","/\\[vkExUnit_ad area=(after|before)\\]/"],["#text","【広告】"],["#text","【PR】"],["#text","関連動画"],["#text","PR:"],["script","leave_recommend"],["#text","/^Advertisement$/"],["script","zfgloaded"],["script","ai_adb"],["script","HTMLAllCollection"],["script","liedetector"],["script","popWin"],["script","end_click"],["script","ad blocker"],["script","closeAd"],["script","/modal|popupads/"],["script","/adconfig/i"],["script","AdblockDetector"],["script","is_antiblock_refresh"],["script","/userAgent|adb|htmls/"],["script","myModal"],["script","ad_block"],["script","app_checkext"],["script","clientHeight"],["script","/url_key|adHtml/"],["script","pop.target"],["script","showadblock"],["script","axios"],["script","ad block"],["script","\"v4ac1eiZr0\""],["script","admiral"],["script","/charAt|XMLHttpRequest/"],["script","AdBlockEnabled"],["script","window.location.replace"],["script","/$.*open/"],["script","Brave"],["script","egoTab"],["script","abDetectorPro"],["script","/$.*(css|oncontextmenu)/"],["script","/eval.*RegExp/"],["script","wwads"],["script","/\\[\\'push\\'\\]/"],["script","/adblock/i"],["script","/$.*adUnits/"],["script","decodeURIComponent"],["script","RegExp"],["script","adbl"],["script","doOpen"],["script","adsBlocked"],["script","chkADB"],["script","AaDetector"],["script","AdBlock"],["script","Symbol.iterator"],["script","/innerHTML.*appendChild/"],["script","Exo"],["script","detectAdBlock"],["script","popup"],["script","/window\\[\\'open\\'\\]/"],["script","Error"],["script","document.head.appendChild"],["script","Number"],["script","ad-block-activated"],["script","insertBefore"],["script","pop.doEvent"],["script","constructor"],["script","/adbl/i"],["script","detect"],["script","btnHtml"],["script","/join\\(\\'\\'\\)/"],["script","/join\\(\\\"\\\"\\)/"],["script","api.dataunlocker.com"],["script","vglnk"],["script","/RegExp\\(\\'/","condition","RegExp"],["script","/\"body\"|\"bo\"\\+\"dy\"|\"bod\"\\+\"y\"|\"b\"\\+\"od\"\\+\"y\"|\"b\"\\+\"od\"\\+\"y\"|\"b\"[\\s\\S]{0,}\\+[\\s\\S]{0,}\"od\"[\\s\\S]{0,}\\+[\\s\\S]{0,}\"y\"|\"b\"[\\s\\S]{0,}\"o\"[\\s\\S]{0,}\"d\"[\\s\\S]{0,}\"y\"[\\s\\S]{0,}|`b[\\s\\S]{0,}`o[\\s\\S]{0,}`d[\\s\\S]{0,}`y[\\s\\S]{0,}|b\\$|u006f|document\\.body;|\\[\"document\"\\]|\\[[\\s\\S]{0,}\"document\"|`\\$\\{\\s*\"|mddd4ff4ded34344|\"riot\"|\"setTimeout\"|\"setT\"\\+\"imeout\"|\"r\"\\+\"iot\"|\"docu\"\\+\"ment\"|window\\s*\\.\\s*riot|\\!window\\.a_z3q3sZ1|`\\+`|`rep|\\[`re|re`|\\}r\\$/g"],["script","throw Error","condition","/^\\s*\\(?function.*\\);\\}\\}\\(\\)\\)\\);/"],["script","NREUM"]];

const hostnamesMap = new Map([["giga.de",0],["kino.de",0],["teltarif.de",1],["aupetitparieur.com",2],["allthingsvegas.com",2],["100percentfedup.com",2],["beforeitsnews.com",2],["concomber.com",2],["conservativebrief.com",2],["conservativefiringline.com",2],["dailylol.com",2],["funnyand.com",2],["letocard.fr",2],["mamieastuce.com",2],["meilleurpronostic.fr",2],["patriotnationpress.com",2],["toptenz.net",2],["vitamiiin.com",2],["writerscafe.org",2],["populist.press",2],["dailytruthreport.com",2],["livinggospeldaily.com",2],["first-names-meanings.com",2],["welovetrump.com",2],["thehayride.com",2],["thelibertydaily.com",2],["thepoke.co.uk",2],["thepolitistick.com",2],["theblacksphere.net",2],["shark-tank.com",2],["naturalblaze.com",2],["greatamericanrepublic.com",2],["dailysurge.com",2],["truthlion.com",2],["flagandcross.com",2],["westword.com",2],["republicbrief.com",2],["freedomfirstnetwork.com",2],["phoenixnewtimes.com",2],["designbump.com",2],["clashdaily.com",2],["madworldnews.com",2],["reviveusa.com",2],["sonsoflibertymedia.com",2],["thedesigninspiration.com",2],["videogamesblogger.com",2],["protrumpnews.com",2],["thepalmierireport.com",2],["kresy.pl",2],["thepatriotjournal.com",2],["gellerreport.com",2],["thegatewaypundit.com",2],["wltreport.com",2],["miaminewtimes.com",2],["politicalsignal.com",2],["rightwingnews.com",2],["bigleaguepolitics.com",2],["comicallyincorrect.com",2],["moviepilot.de",4],["yts.mx",7],["upornia.com",9],["pinsystem.co.uk",10],["elrellano.com",10],["tinyppt.com",10],["downfile.site",10],["expertvn.com",10],["trangchu.news",10],["bharathwick.com",10],["descargaspcpro.net",10],["dx-tv.com",10],["rt3dmodels.com",10],["plc4me.com",10],["blisseyhusbands.com",10],["madaradex.org",10],["franceprefecture.fr",10],["learnmany.in",10],["loaninsurehub.com",10],["appkamods.com",10],["techacode.com",10],["3dmodelshare.org",10],["nulleb.com",10],["asiaon.top",10],["reset-scans.us",10],["coursesghar.com",10],["thecustomrom.com",10],["snlookup.com",10],["bingotingo.com",10],["ghior.com",10],["3dmili.com",10],["karanpc.com",10],["plc247.com",10],["hiraethtranslation.com",10],["apkdelisi.net",10],["javindo.eu.org",10],["chindohot.site",10],["freepasses.org",10],["tomarnarede.pt",10],["basketballbuzz.ca",10],["dribbblegraphics.com",10],["kemiox.com",10],["checkersmenu.us",10],["teksnologi.com",10],["dollareuro.live",10],["eporner.com",12],["germancarforum.com",13],["cybercityhelp.in",13],["sinvida.me",[14,15]],["streamnoads.com",[14,15,46]],["bowfile.com",14],["cloudvideo.tv",[14,46]],["coloredmanga.com",14],["embedstream.me",[14,15,46]],["exeo.app",14],["hiphopa.net",[14,15]],["megaup.net",14],["tv247.us",[14,15]],["uploadhaven.com",14],["userscloud.com",[14,46]],["mdfx9dc8n.net",15],["mdzsmutpcvykb.net",15],["mixdrop21.net",15],["mixdropjmk.pw",15],["123movies4u.site",15],["1337xporn.com",15],["141jav.com",15],["1bit.space",15],["1bitspace.com",15],["38dh2.top",15],["3dporndude.com",15],["4archive.org",15],["4horlover.com",15],["560pmovie.com",15],["60fps.xyz",15],["85tube.com",15],["85videos.com",15],["8xlinks.click",15],["a2zcrackworld.com",15],["aazzz.xyz",15],["acefile.co",15],["actusports.eu",15],["adblockplustape.com",15],["adclickersbot.com",15],["adricami.com",15],["adslink.pw",15],["adultstvlive.com",15],["adz7short.space",15],["aeblender.com",15],["ahdafnews.blogspot.com",15],["ak47sports.com",15],["akuma.moe",15],["allplayer.tk",15],["allstreaming.online",15],["amadoras.cf",15],["amadorasdanet.shop",15],["amateurblog.tv",15],["androidadult.com",15],["anhsexjav.xyz",15],["anidl.org",15],["anime-loads.org",15],["animeblkom.net",15],["animefire.net",15],["animelek.me",15],["animeshouse.net",15],["animespire.net",15],["animestotais.xyz",15],["animeyt.es",15],["anroll.net",15],["anymoviess.xyz",15],["aotonline.org",15],["asenshu.com",15],["asialiveaction.com",15],["asianclipdedhd.net",15],["askim-bg.com",15],["asumsikedaishop.com",15],["avcrempie.com",15],["avseesee.com",15],["backfirstwo.com",15],["bajarjuegospcgratis.com",15],["balkanportal.net",15],["balkanteka.net",15],["bdnewszh.com",[15,46]],["belowporn.com",15],["bestclaimtrx.xyz",15],["bestgirlsexy.com",15],["bestnhl.com",15],["bestporn4free.com",15],["bestporncomix.com",15],["bet36.es",15],["bikinitryon.net",15],["birdurls.com",15],["bitsearch.to",15],["blackcockadventure.com",15],["blackcockchurch.org",15],["blackporncrazy.com",15],["blizzboygames.net",15],["blizzpaste.com",15],["blkom.com",15],["blog-peliculas.com",15],["blogtrabalhista.com",15],["blurayufr.xyz",15],["bobsvagene.club",15],["bolly4umovies.click",15],["bonusharian.pro",15],["brilian-news.id",15],["brupload.net",15],["bucitana.com",15],["cablegratis.online",15],["camchickscaps.com",15],["camgirlcum.com",15],["camgirls.casa",15],["cashurl.in",15],["castingx.net",15],["ccurl.net",[15,46]],["celebrity-leaks.net",15],["cgpelis.net",15],["charexempire.com",15],["clasico.tv",15],["clik.pw",15],["coin-free.com",[15,33]],["coins100s.fun",15],["comicsmanics.com",15],["compucalitv.com",15],["coolcast2.com",15],["cosplaytab.com",15],["countylocalnews.com",15],["cpmlink.net",15],["crackstreamshd.click",15],["crespomods.com",15],["crisanimex.com",15],["crunchyscan.fr",15],["cuevana3.fan",15],["cuevana3hd.com",15],["cumception.com",15],["curvaweb.com",15],["cutpaid.com",15],["datawav.club",15],["daughtertraining.com",15],["deepgoretube.site",15],["deltabit.co",15],["depvailon.com",15],["derleta.com",15],["desivdo.com",15],["desixx.net",15],["detikkebumen.com",15],["deutschepornos.me",15],["diasoft.xyz",15],["directupload.net",15],["diskusscan.com",15],["dixva.com",15],["dlhd.sx",15],["doctormalay.com",15],["dofusports.xyz",15],["dogemate.com",15],["doods.cam",15],["doodskin.lat",15],["downloadrips.com",15],["downvod.com",15],["dphunters.mom",15],["dragontranslation.com",15],["duddes.xyz",15],["dvdfullestrenos.com",15],["ebookbb.com",15],["ebookhunter.net",15],["egyanime.com",15],["egygost.com",15],["egyshare.cc",15],["ekasiwap.com",15],["electro-torrent.pl",15],["elil.cc",15],["embed4u.xyz",15],["eplayer.click",15],["erovoice.us",15],["eroxxx.us",15],["estrenosdoramas.net",15],["everia.club",15],["everythinginherenet.blogspot.com",15],["extrafreetv.com",15],["extremotvplay.com",15],["fapinporn.com",15],["fapptime.com",15],["fashionblog.tv",15],["fastreams.live",15],["faucethero.com",15],["fembed.com",15],["femdom-joi.com",15],["fileone.tv",15],["film1k.com",15],["filmeonline2023.net",15],["filmesonlinex.org",15],["filmesonlinexhd.biz",[15,46]],["filmovi.ws",[15,46]],["filmovitica.com",15],["filmymaza.blogspot.com",15],["filthy.family",15],["firstmovies.to",15],["fixfinder.click",15],["flostreams.xyz",15],["flyfaucet.com",15],["footyhunter.lol",15],["footyhunter3.xyz",[15,46]],["forex-golds.com",15],["forex-trnd.com",15],["forumchat.club",15],["forumlovers.club",15],["freemoviesonline.biz",15],["freeomovie.co.in",15],["freeomovie.to",15],["freeporncomic.net",15],["freepornhdonlinegay.com",15],["freeproxy.io",15],["freeuse.me",15],["freeusexporn.com",15],["fsicomics.com",15],["gambarbogel.xyz",15],["gamepcfull.com",15],["gameronix.com",15],["gamesfullx.com",15],["gameshdlive.net",15],["gameshdlive.xyz",[15,46]],["gamesmountain.com",15],["gamesrepacks.com",15],["gamingguru.fr",15],["gamovideo.com",15],["garota.cf",15],["gaydelicious.com",15],["gaypornmasters.com",15],["gaysex69.net",15],["gemstreams.com",15],["get-to.link",15],["girlscanner.org",15],["giurgiuveanul.ro",15],["gledajcrtace.xyz",15],["gocast2.com",15],["gomo.to",15],["gostosa.cf",15],["gtlink.co",15],["gwiazdypornosow.pl",15],["haho.moe",15],["hatsukimanga.com",15],["hayhd.net",15],["hdsaprevodom.com",15],["hdstreamss.club",15],["hentais.tube",15],["hentaistream.co",15],["hentaitk.net",15],["hentaitube.online",15],["hentaiworld.tv",15],["hesgoal.tv",15],["hexupload.net",15],["hhkungfu.tv",15],["highlanderhelp.com",15],["hindimean.com",15],["hindimovies.to",[15,46]],["hiperdex.com",15],["hispasexy.org",15],["hitomi.la",15],["hitprn.com",15],["hoca4u.com",15],["hollymoviehd.cc",15],["hoodsite.com",15],["hopepaste.download",15],["hornylips.com",15],["hotgranny.live",15],["hotmama.live",15],["hqcelebcorner.net",15],["huren.best",15],["hwnaturkya.com",[15,46]],["hxfile.co",[15,46]],["igfap.com",15],["ihdstreams.xyz",15],["iklandb.com",15],["illink.net",15],["imgkings.com",15],["imgsex.xyz",15],["imx.to",15],["influencersgonewild.org",15],["infosgj.free.fr",15],["investnewsbrazil.com",15],["itdmusics.com",15],["itsuseful.site",15],["itunesfre.com",15],["iwatchfriendsonline.net",[15,85]],["jackstreams.com",15],["jatimupdate24.com",15],["javcl.com",15],["javf.net",15],["javhay.net",15],["javhoho.com",15],["javhun.com",15],["javleak.com",15],["javporn.best",15],["javsex.to",15],["javtiful.com",15],["jimdofree.com",15],["jiofiles.org",15],["jorpetz.com",15],["journalyc.online",15],["jp-films.com",15],["jpop80ss3.blogspot.com",15],["jpopsingles.eu",15],["kantotflix.net",15],["kantotinyo.com",15],["kaoskrew.org",15],["kaplog.com",15],["keralatvbox.com",15],["kimochi.info",15],["kimochi.tv",15],["kinemania.tv",15],["konstantinova.net",15],["koora-online.live",15],["kunmanga.com",15],["kutmoney.com",15],["kwithsub.com",15],["ladangreceh.xyz",15],["lat69.me",15],["latinblog.tv",15],["latinomegahd.net",15],["lazyfaucet.com",15],["leechpremium.link",15],["legendas.dev",15],["legendei.net",15],["lightdlmovies.blogspot.com",15],["lighterlegend.com",15],["linclik.com",15],["linkebr.com",15],["linkrex.net",15],["links.worldfree4u-lol.online",15],["linksfy.co",15],["lody.ink",15],["lovesomecommunity.com",15],["lulustream.com",[15,46]],["luluvdo.com",[15,46]],["luzcameraeacao.shop",15],["manga-oni.com",15],["mangaboat.com",15],["mangagenki.me",15],["mangahere.onl",15],["mangaweb.xyz",15],["mangoporn.net",15],["manhwahentai.me",15],["masahub.com",15],["masahub.net",15],["maturegrannyfuck.com",15],["mdy48tn97.com",15],["mediapemersatubangsa.com",15],["mega-mkv.com",15],["megapastes.com",15],["megapornpics.com",15],["messitv.net",15],["meusanimes.net",15],["milfmoza.com",15],["milfzr.com",15],["millionscast.com",15],["mimaletamusical.blogspot.com",15],["mitly.us",15],["mkv-pastes.com",15],["modb.xyz",15],["monaskuliner.ac.id",15],["moredesi.com",15],["movgotv.net",15],["movi.pk",15],["movieswbb.com",15],["moviewatch.com.pk",[15,46]],["mp4upload.com",15],["mrskin.live",15],["multicanaistv.com",15],["mundowuxia.com",15],["myeasymusic.ir",15],["myonvideo.com",15],["myyouporn.com",15],["narutoget.info",15],["naughtypiss.com",15],["nerdiess.com",15],["new-fs.eu",15],["newtorrentgame.com",15],["nflstreams.me",15],["niaomea.me",[15,46]],["nicekkk.com",15],["nicesss.com",15],["nlegs.com",15],["nolive.me",[15,46]],["nopay.info",15],["nopay2.info",[15,125]],["notformembersonly.com",15],["novamovie.net",15],["novelpdf.xyz",15],["novelssites.com",[15,46]],["novelup.top",15],["nsfwr34.com",15],["nu6i-bg-net.com",15],["nudebabesin3d.com",15],["nukedfans.com",15],["nuoga.eu",15],["nzbstars.com",15],["ohjav.com",15],["ojearnovelas.com",15],["okanime.xyz",15],["olarixas.xyz",15],["oldbox.cloud",15],["olweb.tv",15],["olympicstreams.me",15],["on9.stream",15],["oncast.xyz",15],["onepiece-mangaonline.com",15],["onifile.com",15],["onionstream.live",15],["onlinesaprevodom.net",15],["onlyfullporn.video",15],["onplustv.live",15],["originporn.com",15],["ovagames.com",15],["ovamusic.com",15],["owllink.net",15],["packsporn.com",15],["pahaplayers.click",15],["palimas.org",15],["pandafiles.com",15],["papahd.club",15],["papahd1.xyz",15],["password69.com",15],["paste3.org",15],["pastemytxt.com",15],["payskip.org",15],["peeplink.in",15],["peliculasmx.net",15],["pervertgirlsvideos.com",15],["pervyvideos.com",15],["phim12h.com",15],["picdollar.com",15],["pickteenz.com",15],["pics4you.net",15],["picsxxxporn.com",15],["pinayscandalz.com",15],["pinkueiga.net",15],["piratefast.xyz",15],["piratehaven.xyz",15],["pirateiro.com",15],["pirlotvonline.org",15],["playtube.co.za",15],["plugintorrent.com",15],["pmvzone.com",15],["porndish.com",15],["pornez.net",15],["pornfetishbdsm.com",15],["pornfits.com",15],["pornhd720p.com",15],["pornobr.club",15],["pornobr.ninja",15],["pornodominicano.net",15],["pornofaps.com",15],["pornoflux.com",15],["pornotorrent.com.br",15],["pornredit.com",15],["pornstarsyfamosas.es",15],["pornstreams.co",15],["porntn.com",15],["pornxbit.com",15],["pornxday.com",15],["portaldasnovinhas.shop",15],["portugues-fcr.blogspot.com",15],["poscishd.online",15],["poscitesch.com",[15,46]],["poseyoung.com",15],["pover.org",15],["proxyninja.org",15],["pubfilmz.com",15],["publicsexamateurs.com",15],["punanihub.com",15],["putlocker5movies.org",15],["pxxbay.com",15],["r18.best",15],["ragnaru.net",15],["rapbeh.net",15],["rapelust.com",15],["rapload.org",15],["read-onepiece.net",15],["retro-fucking.com",15],["retrotv.org",15],["robaldowns.com",15],["rockdilla.com",15],["rojadirectatvenvivo.com",15],["rojitadirecta.blogspot.com",15],["romancetv.site",15],["rule34.club",15],["rule34hentai.net",15],["rumahbokep-id.com",15],["safego.cc",15],["sakurafile.com",15],["satoshi-win.xyz",15],["scat.gold",15],["scatfap.com",15],["scatkings.com",15],["scnlog.me",15],["scripts-webmasters.net",15],["serie-turche.com",15],["serijefilmovi.com",15],["sexcomics.me",15],["sexdicted.com",15],["sexgay18.com",15],["sexofilm.co",15],["sextgem.com",15],["sextubebbw.com",15],["sgpics.net",15],["shadowrangers.live",15],["shahee4u.cam",15],["shahiid-anime.net",15],["shemale6.com",15],["shinden.pl",15],["short.es",15],["showmanga.blog.fc2.com",15],["shrt10.com",15],["shurt.pw",15],["sideplusleaks.net",15],["silverblog.tv",15],["silverpic.com",15],["sinhalasub.life",15],["sinsitio.site",15],["skidrowcpy.com",15],["skidrowfull.com",15],["skidrowreloaded.com",15],["slut.mom",15],["smallencode.me",15],["smoner.com",15],["smplace.com",15],["soccerinhd.com",15],["socceron.name",15],["softairbay.com",15],["sokobj.com",15],["songsio.com",15],["souexatasmais.com",15],["sportbar.live",15],["sportea.online",15],["sportskart.xyz",15],["sportstream1.cfd",15],["srt.am",15],["srts.me",15],["stakes100.xyz",15],["stbemuiptv.com",15],["stockingfetishvideo.com",15],["stream.crichd.vip",15],["stream.lc",15],["stream25.xyz",15],["streambee.to",15],["streamcenter.pro",15],["streamers.watch",15],["streamgo.to",15],["streamkiste.tv",15],["streamoporn.xyz",15],["streamoupload.xyz",15],["streamservicehd.click",15],["streamvid.net",[15,21]],["subtitleporn.com",15],["subtitles.cam",15],["suicidepics.com",15],["supertelevisionhd.com",15],["supexfeeds.com",15],["swzz.xyz",15],["sxnaar.com",15],["tabooporns.com",15],["taboosex.club",15],["tapeantiads.com",15],["tapeblocker.com",15],["tapenoads.com",15],["tapewithadblock.org",[15,147]],["teamos.xyz",15],["teen-wave.com",15],["teenporncrazy.com",15],["telegramgroups.xyz",15],["telenovelasweb.com",15],["tensei-shitara-slime-datta-ken.com",15],["tfp.is",15],["tgo-tv.co",[15,46]],["thaihotmodels.com",15],["theblueclit.com",15],["thebussybandit.com",15],["theicongenerator.com",15],["thelastdisaster.vip",15],["thepiratebay0.org",15],["thepiratebay10.info",15],["thesexcloud.com",15],["thothub.today",15],["tightsexteens.com",15],["tojav.net",15],["tokyoblog.tv",15],["tonnestreamz.xyz",15],["top16.net",15],["topvideosgay.com",15],["torrage.info",15],["torrents.vip",15],["torrsexvid.com",15],["tpb-proxy.xyz",15],["trannyteca.com",15],["trendytalker.com",15],["tumanga.net",15],["turbogvideos.com",15],["turbovid.me",15],["turkishseriestv.org",15],["turksub24.net",15],["tutele.sx",15],["tutelehd3.xyz",15],["tvglobe.me",15],["tvpclive.com",15],["tvs-widget.com",15],["tvseries.video",15],["ucptt.com",15],["ufaucet.online",15],["ufcfight.online",15],["uhdgames.xyz",15],["ultrahorny.com",15],["ultraten.net",15],["unblockweb.me",15],["underhentai.net",15],["uniqueten.net",15],["upbaam.com",15],["upstream.to",15],["valeriabelen.com",15],["verdragonball.online",15],["vfxmed.com",15],["video.az",15],["videostreaming.rocks",15],["videowood.tv",15],["vidorg.net",15],["vidtapes.com",15],["vidz7.com",15],["vikistream.com",15],["vikv.net",15],["virpe.cc",15],["visifilmai.org",15],["viveseries.com",15],["vladrustov.sx",15],["volokit2.com",15],["vstorrent.org",15],["w-hentai.com",15],["watchaccordingtojimonline.com",15],["watchbrooklynnine-nine.com",15],["watchdowntonabbeyonline.com",15],["watchelementaryonline.com",15],["watcheronline.net",15],["watchgleeonline.com",15],["watchjavidol.com",15],["watchkobestreams.info",15],["watchlostonline.net",15],["watchlouieonline.com",15],["watchmonkonline.com",15],["watchparksandrecreation.net",15],["watchprettylittleliarsonline.com",15],["watchrulesofengagementonline.com",15],["watchthekingofqueens.com",15],["watchthemiddleonline.com",15],["watchtvchh.xyz",15],["webcamrips.com",15],["wickedspot.org",15],["wincest.xyz",15],["witanime.best",15],["wolverdon.fun",15],["wolverdonx.com",15],["wordcounter.icu",15],["worldcupstream.pm",15],["worldmovies.store",15],["worldstreams.click",15],["wpdeployit.com",15],["wqstreams.tk",15],["wwwsct.com",15],["xanimeporn.com",15],["xblog.tv",15],["xn--verseriesespaollatino-obc.online",15],["xn--xvideos-espaol-1nb.com",15],["xpornium.net",15],["xsober.com",15],["xvip.lat",15],["xxgasm.com",15],["xxvideoss.org",15],["xxx18.uno",15],["xxxdominicana.com",15],["xxxfree.watch",15],["xxxmax.net",15],["xxxwebdlxxx.top",15],["xxxxvideo.uno",15],["y2b.wiki",15],["yabai.si",15],["yadixv.com",15],["yayanimes.net",15],["yeshd.net",15],["yodbox.com",15],["youjax.com",15],["youpits.xyz",15],["yourdailypornvideos.ws",15],["yourupload.com",15],["ytstv.me",15],["ytstvmovies.co",15],["ytstvmovies.xyz",15],["ytsyify.co",15],["ytsyifymovie.com",15],["zerion.cc",15],["zerocoin.top",15],["zitss.xyz",15],["zpaste.net",15],["zplayer.live",15],["faucet.ovh",16],["oko.sh",17],["bigbtc.win",18],["cryptofun.space",18],["sexo5k.com",19],["truyen-hentai.com",19],["theshedend.com",21],["rsadnetworkinfo.com",21],["rsinsuranceinfo.com",21],["rsfinanceinfo.com",21],["rsgamer.app",21],["rssoftwareinfo.com",21],["rshostinginfo.com",21],["rseducationinfo.com",21],["zeroupload.com",21],["securenetsystems.net",21],["miniwebtool.com",21],["bchtechnologies.com",21],["spiegel.de",22],["appnee.com",23],["d0000d.com",24],["d0o0d.com",24],["do0od.com",24],["doods.pro",24],["ds2play.com",24],["ds2video.com",24],["onlyfaucet.com",25],["thebullspen.com",25],["livecamrips.com",26],["smutty.com",26],["down.dataaps.com",26],["filmweb.pl",26],["infinityscans.xyz",[27,149]],["infinityscans.net",[27,149]],["j8jp.com",28],["musichq.pe",29],["sekaikomik.bio",29],["iisfvirtual.in",30],["starxinvestor.com",30],["beatsnoop.com",30],["fetchpik.com",30],["hackerranksolution.in",30],["webhostingpost.com",[31,46]],["tophostingapp.com",31],["digitalmarktrend.com",31],["kenzo-flowertag.com",32],["mdn.lol",32],["btcbitco.in",33],["btcsatoshi.net",33],["cempakajaya.com",33],["crypto4yu.com",33],["gainl.ink",33],["manofadan.com",33],["readbitcoin.org",33],["wiour.com",33],["kienthucrangmieng.com",33],["tremamnon.com",33],["btc25.org",33],["tron-free.com",33],["bitsmagic.fun",33],["ourcoincash.xyz",33],["hynews.biz",33],["blog.cryptowidgets.net",34],["blog.insurancegold.in",34],["blog.wiki-topia.com",34],["blog.coinsvalue.net",34],["blog.cookinguide.net",34],["blog.freeoseocheck.com",34],["aylink.co",35],["sugarona.com",36],["nishankhatri.xyz",36],["highkeyfinance.com",36],["amanguides.com",36],["tinys.click",37],["answerpython.com",37],["gsm-solution.com",37],["h-donghua.com",37],["hindisubbedacademy.com",37],["pkgovjobz.com",37],["ripexbooster.xyz",37],["serial4.com",37],["serial412.blogspot.com",37],["sigmalinks.in",37],["tutorgaming.com",37],["aiimgvlog.fun",38],["appsbull.com",39],["diudemy.com",39],["maqal360.com",39],["mphealth.online",39],["makefreecallsonline.com",39],["androjungle.com",39],["bookszone.in",39],["drakescans.com",39],["shortix.co",39],["msonglyrics.com",39],["app-sorteos.com",39],["bokugents.com",39],["btvplus.bg",39],["blog24.me",[40,41]],["coingraph.us",42],["impact24.us",42],["iconicblogger.com",43],["tii.la",44],["kiemlua.com",45],["123moviefree4u.com",46],["194.163.183.129",46],["6movies.net",46],["adsh.cc",46],["afilmyhouse.blogspot.com",46],["ak.sv",46],["animefenix.com",46],["animefrenzy.net",46],["animeshouse.info",46],["animesultra.com",46],["api.webs.moe",46],["apkmody.io",46],["atglinks.com",46],["attvideo.com",46],["avimobilemovies.net",46],["backfirstwo.site",[46,116]],["cinema.cimatna.com",46],["crazyblog.in",46],["dembed1.com",46],["dembed2.com",46],["divicast.com",46],["egynow.cam",46],["embed.meomeo.pw",46],["fanproj.net",46],["filebox.click",46],["filmeserialeonline.org",46],["filmyzilla2021.xyz",46],["filmyzilla2022.com",46],["filmyzillafullmovie.waystohunt.info",46],["flexyhit.com",46],["foreverwallpapers.com",46],["french-streams.cc",46],["fslinks.org",46],["fstream365.com",46],["gdrivez.xyz",46],["hinatasoul.com",46],["hitmovies4u.com",46],["hotstar.news",46],["isaidub3.co",46],["membed.net",46],["mgnetu.com",46],["mhdtvsports.me",46],["moviesdanet.com",46],["moviewatchonline.com.pk",46],["mp3juice.info",46],["mp3juices.cc",46],["neomovies.net",46],["newsrade.com",46],["nollyverse.com",46],["oii.io",46],["pepperlive.info",46],["playertv.net",46],["putlocker68.com",46],["s.to",46],["sharkfish.xyz",46],["skidrowcodex.net",46],["sports-stream.site",46],["stream4free.live",46],["tamilmobilemovies.in",46],["thewatchseries.live",46],["tnmusic.in",46],["travelplanspro.com",46],["tusfiles.com",46],["unlimitmovies.com",46],["uploadflix.org",46],["vid-guard.com",46],["vidsaver.net",46],["vidspeeds.com",46],["viralitytoday.com",46],["voiranime.stream",46],["watchdoctorwhoonline.com",46],["webseriesclub.com",46],["ylink.bid",46],["ytix.xyz",46],["unblocked.id",48],["listendata.com",49],["7xm.xyz",49],["fastupload.io",49],["azmath.info",49],["wouterplanet.com",50],["androidacy.com",51],["jytechs.in",52],["djxmaza.in",52],["miuiflash.com",52],["thecubexguide.com",52],["veryfreeporn.com",53],["besthdgayporn.com",54],["drivenime.com",54],["freeroms.com",55],["soap2day-online.com",55],["austiblox.net",56],["btcbunch.com",57],["teachoo.com",58],["genshinlab.com",59],["fourfourtwo.co.kr",59],["interfootball.co.kr",59],["a-ha.io",59],["cboard.net",59],["mobilitytv.co.kr",59],["mememedia.co.kr",59],["newautopost.co.kr",59],["tvreport.co.kr",59],["tenbizt.com",59],["jjang0u.com",59],["joongdo.co.kr",59],["viva100.com",59],["thephoblographer.com",59],["newdaily.co.kr",59],["dogdrip.net",59],["golf-live.at",59],["gamingdeputy.com",59],["thesaurus.net",59],["tweaksforgeeks.com",59],["alle-tests.nl",59],["apkmirror.com",59],["dotkeypress.kr",59],["viewcash.co.kr",59],["tripplus.co.kr",59],["enterdiary.com",59],["mtodayauto.com",59],["hotplacehunter.co.kr",59],["mystylezip.com",59],["majorgeeks.com",59],["meconomynews.com",59],["brandbrief.co.kr",59],["dfast.kr",59],["youtu.co",59],["mlbpark.donga.com",59],["capress.kr",59],["carandmore.co.kr",59],["maxmovie.kr",59],["motorgraph.com",59],["newsbell.co.kr",59],["tminews.co.kr",59],["thehousemagazine.kr",59],["hardreset.info",59],["metabattle.com",59],["maketecheasier.com",59],["motorbikecatalog.com",59],["heraldcorp.com",59],["allthetests.com",60],["issuya.com",60],["topstarnews.net",60],["bitcotasks.com",61],["udvl.com",62],["www.chip.de",[63,64]],["topsporter.net",65],["sportshub.to",65],["bitcosite.com",66],["bitzite.com",66],["easymc.io",67],["yunjiema.top",67],["hacoos.com",68],["bondagevalley.cc",69],["zefoy.com",70],["vidello.net",71],["resizer.myct.jp",72],["gametohkenranbu.sakuraweb.com",73],["jisakuhibi.jp",74],["rank1-media.com",74],["lifematome.blog",75],["fm.sekkaku.net",76],["free-avx.jp",77],["dvdrev.com",78],["betweenjpandkr.blog",79],["nft-media.net",80],["ghacks.net",81],["songspk2.info",82],["truyentranhfull.net",83],["nectareousoverelate.com",86],["khoaiphim.com",87],["haafedk2.com",88],["fordownloader.com",88],["jovemnerd.com.br",89],["nicomanga.com",90],["totalcsgo.com",91],["vivamax.asia",92],["manysex.com",93],["gaminginfos.com",94],["tinxahoivn.com",95],["forums-fastunlock.com",96],["automoto.it",97],["codelivly.com",98],["ophim.vip",99],["touguatize.monster",100],["client.falixnodes.net",101],["novelhall.com",102],["hes-goal.net",103],["abc17news.com",104],["adoredbyalex.com",104],["agrodigital.com",104],["al.com",104],["aliontherunblog.com",104],["allaboutthetea.com",104],["allmovie.com",104],["allmusic.com",104],["allthingsthrifty.com",104],["amessagewithabottle.com",104],["androidpolice.com",104],["antyradio.pl",104],["artforum.com",104],["artnews.com",104],["avherald.com",104],["awkward.com",104],["awkwardmom.com",104],["bailiwickexpress.com",104],["barnsleychronicle.com",104],["becomingpeculiar.com",104],["bethcakes.com",104],["betweenenglandandiowa.com",104],["blogher.com",104],["bluegraygal.com",104],["briefeguru.de",104],["carmagazine.co.uk",104],["cattime.com",104],["cbr.com",104],["cbssports.com",104],["celiacandthebeast.com",104],["chaptercheats.com",104],["cleveland.com",104],["collider.com",104],["comingsoon.net",104],["commercialobserver.com",104],["competentedigitale.ro",104],["crafty.house",104],["dailyvoice.com",104],["decider.com",104],["didyouknowfacts.com",104],["dogtime.com",104],["dualshockers.com",104],["dustyoldthing.com",104],["faithhub.net",104],["femestella.com",104],["footwearnews.com",104],["freeconvert.com",104],["frogsandsnailsandpuppydogtail.com",104],["fsm-media.com",104],["funtasticlife.com",104],["fwmadebycarli.com",104],["gamerant.com",104],["gfinityesports.com",104],["givemesport.com",104],["gulflive.com",104],["helloflo.com",104],["homeglowdesign.com",104],["honeygirlsworld.com",104],["howtogeek.com",104],["insider-gaming.com",104],["insurancejournal.com",104],["jasminemaria.com",104],["kion546.com",104],["lehighvalleylive.com",104],["lettyskitchen.com",104],["lifeinleggings.com",104],["liveandletsfly.com",104],["lizzieinlace.com",104],["localnews8.com",104],["lonestarlive.com",104],["madeeveryday.com",104],["maidenhead-advertiser.co.uk",104],["makeuseof.com",104],["mardomreport.net",104],["masslive.com",104],["melangery.com",104],["milestomemories.com",104],["mlive.com",104],["modernmom.com",104],["momtastic.com",104],["mostlymorgan.com",104],["motherwellmag.com",104],["movieweb.com",104],["muddybootsanddiamonds.com",104],["musicfeeds.com.au",104],["mylifefromhome.com",104],["nationalreview.com",104],["neoskosmos.com",104],["nj.com",104],["nordot.app",104],["nothingbutnewcastle.com",104],["nsjonline.com",104],["nypost.com",104],["oakvillenews.org",104],["observer.com",104],["oregonlive.com",104],["ourlittlesliceofheaven.com",104],["pagesix.com",104],["palachinkablog.com",104],["pennlive.com",104],["pinkonthecheek.com",104],["politicususa.com",104],["predic.ro",104],["puckermom.com",104],["qtoptens.com",104],["realgm.com",104],["reelmama.com",104],["robbreport.com",104],["royalmailchat.co.uk",104],["samchui.com",104],["sandrarose.com",104],["screenrant.com",104],["sheknows.com",104],["sherdog.com",104],["sidereel.com",104],["silive.com",104],["simpleflying.com",104],["sloughexpress.co.uk",104],["spacenews.com",104],["sportsgamblingpodcast.com",104],["spotofteadesigns.com",104],["stacysrandomthoughts.com",104],["ssnewstelegram.com",104],["superherohype.com",104],["syracuse.com",104],["tablelifeblog.com",104],["thebeautysection.com",104],["thecelticblog.com",104],["thecurvyfashionista.com",104],["thefashionspot.com",104],["thegamer.com",104],["thegamescabin.com",104],["thenerdyme.com",104],["thenonconsumeradvocate.com",104],["theprudentgarden.com",104],["timesnews.net",104],["toyotaklub.org.pl",104],["travelingformiles.com",104],["tutsnode.org",104],["tvline.com",104],["viralviralvideos.com",104],["wannacomewith.com",104],["wimp.com",104],["windsorexpress.co.uk",104],["woojr.com",104],["worldoftravelswithkids.com",104],["xda-developers.com",104],["cheatsheet.com",105],["pwinsider.com",105],["baeldung.com",105],["bagi.co.in",106],["keran.co",106],["biblestudytools.com",107],["christianheadlines.com",107],["ibelieve.com",107],["kuponigo.com",108],["kimcilonly.site",109],["kimcilonly.link",109],["cryptoearns.com",110],["inxxx.com",111],["ipaspot.app",112],["embedwish.com",113],["filelions.live",113],["leakslove.net",113],["jenismac.com",114],["vxetable.cn",115],["jewelavid.com",116],["nizarstream.com",116],["snapwordz.com",117],["toolxox.com",117],["rl6mans.com",117],["idol69.net",117],["plumbersforums.net",118],["123movies57.online",119],["gulio.site",120],["mediaset.es",121],["izlekolik.net",122],["donghuaworld.com",123],["letsdopuzzles.com",124],["tainio-mania.online",125],["hes-goals.io",126],["pkbiosfix.com",126],["casi3.xyz",126],["rediff.com",127],["dzapk.com",128],["darknessporn.com",129],["familyporner.com",129],["freepublicporn.com",129],["pisshamster.com",129],["punishworld.com",129],["xanimu.com",129],["pig69.com",130],["cosplay18.pics",130],["javhdo.net",131],["eroticmoviesonline.me",132],["teleclub.xyz",133],["ecamrips.com",134],["showcamrips.com",134],["9animetv.to",135],["jornadaperfecta.com",136],["loseart.com",137],["sousou-no-frieren.com",138],["veev.to",139],["intro-hd.net",140],["monacomatin.mc",140],["nodo313.net",140],["unite-guide.com",141],["appimagehub.com",142],["gnome-look.org",142],["store.kde.org",142],["linux-apps.com",142],["opendesktop.org",142],["pling.com",142],["xfce-look.org",142],["botcomics.com",143],["cefirates.com",143],["chandlerorchards.com",143],["comicleaks.com",143],["marketdata.app",143],["monumentmetals.com",143],["tapmyback.com",143],["ping.gg",143],["revistaferramental.com.br",143],["hawpar.com",143],["alpacafinance.org",[143,144]],["nookgaming.com",143],["enkeleksamen.no",143],["kvest.ee",143],["creatordrop.com",143],["panpots.com",143],["cybernetman.com",143],["bitdomain.biz",143],["gerardbosch.xyz",143],["fort-shop.kiev.ua",143],["accuretawealth.com",143],["resourceya.com",143],["tracktheta.com",143],["tt.live",144],["future-fortune.com",144],["abhijith.page",144],["madrigalmaps.com",144],["adventuretix.com",144],["panprices.com",145],["intercity.technology",145],["freelancer.taxmachine.be",145],["adria.gg",145],["fjlaboratories.com",145],["proboards.com",146],["winclassic.net",146],["perchance.org",148],["abema.tv",150]]);

const entitiesMap = new Map([["1337x",[3,15]],["kimcartoon",5],["pahe",[6,15]],["soap2day",6],["hqq",8],["waaw",8],["mhdsportstv",10],["mhdtvsports",10],["mhdtvworld",10],["mhdtvmax",10],["teluguflix",10],["pixhost",11],["viprow",[14,15,46]],["cloudvideotv",[14,46]],["vidsrc",[14,46]],["123-movies",15],["123movieshd",15],["123movieshub",15],["123moviesme",15],["1stream",15],["1tamilmv",15],["2ddl",15],["2umovies",15],["3hiidude",15],["4stream",15],["5movies",15],["7hitmovies",15],["9xmovie",15],["aagmaal",[15,46]],["adblockeronstape",15],["adblockeronstreamtape",15],["adblockstreamtape",15],["adblockstrtape",15],["adblockstrtech",15],["adblocktape",15],["adcorto",15],["alexsports",15],["alexsportss",15],["alexsportz",15],["animepahe",15],["animesanka",15],["animixplay",15],["aniplay",15],["antiadtape",15],["asianclub",15],["ask4movie",15],["atomixhq",[15,46]],["atomohd",15],["beinmatch",[15,20]],["bhaai",15],["buffstreams",15],["canalesportivo",15],["clickndownload",15],["clicknupload",15],["crackstreams",[15,46]],["daddylive",[15,46]],["daddylivehd",[15,46]],["desiremovies",15],["devlib",15],["divxtotal",15],["divxtotal1",15],["dvdplay",[15,46]],["elixx",15],["enjoy4k",15],["estrenosflix",15],["estrenosflux",15],["estrenosgo",15],["f1stream",15],["fbstream",15],["file4go",15],["filmyzilla",[15,46]],["findav",15],["findporn",15],["flixmaza",15],["flizmovies",15],["freetvsports",15],["fullymaza",15],["g3g",15],["gotxx",15],["grantorrent",15],["hdmoviesfair",[15,46]],["hdmoviesflix",15],["hiidudemoviez",15],["imgsen",15],["imgsto",15],["incest",15],["incestflix",15],["itopmusic",15],["javmost",15],["keeplinks",15],["keepvid",15],["keralahd",15],["khatrimazaful",15],["khatrimazafull",15],["leechall",15],["linkshorts",15],["mangovideo",15],["masaporn",15],["miniurl",15],["mirrorace",15],["mixdroop",15],["mixdrop",15],["mkvcage",15],["mlbstream",15],["mlsbd",15],["mmsbee",15],["motogpstream",15],["movieplex",15],["movierulzlink",15],["movies123",15],["moviesflix",15],["moviesmeta",[15,46]],["moviessources",15],["moviesverse",15],["moviezwaphd",15],["mrunblock",15],["nbastream",15],["newmovierulz",15],["nflstream",15],["nhlstream",15],["noblocktape",15],["nocensor",15],["onlyfams",15],["ouo",15],["pctfenix",[15,46]],["pctnew",[15,46]],["peliculas24",15],["pelisplus",15],["piratebay",15],["plyjam",15],["plylive",15],["plyvdo",15],["pornhoarder",15],["prbay",15],["projectfreetv",15],["proxybit",15],["psarips",15],["racaty",15],["remaxhd",15],["rintor",15],["rnbxclusive",15],["rnbxclusive0",15],["rnbxclusive1",15],["rojadirecta",15],["rojadirectaenvivo",15],["rugbystreams",15],["safetxt",15],["shadowrangers",15],["shahi4u",15],["shahid4u1",15],["shahid4uu",15],["shavetape",15],["shortearn",15],["shorten",15],["shorttey",15],["shortzzy",15],["skymovieshd",15],["socceronline",15],["softarchive",15],["sports-stream",15],["sshhaa",15],["stapadblockuser",15],["stape",15],["stapewithadblock",15],["starmusiq",15],["strcloud",15],["streamadblocker",[15,46]],["streamadblockplus",15],["streamcdn",15],["streamhub",15],["streamsport",15],["streamta",15],["streamtape",15],["streamtapeadblockuser",15],["strikeout",15],["strtape",15],["strtapeadblock",15],["strtapeadblocker",15],["strtapewithadblock",15],["strtpe",15],["swatchseries",15],["tabooflix",15],["tennisstreams",15],["themoviesflix",15],["thepiratebay",15],["thisav",15],["tmearn",15],["toonanime",15],["torlock",15],["tormalayalam",15],["torrentz2eu",15],["tutelehd",15],["tvply",15],["u4m",15],["ufcstream",15],["unblocknow",15],["uploadbuzz",15],["usagoals",15],["vexmoviex",15],["vidclouds",15],["vidlox",15],["vipbox",[15,46]],["vipboxtv",[15,46]],["vipleague",15],["watch-series",15],["watchseries",15],["xclusivejams",15],["xmoviesforyou",15],["youdbox",15],["ytmp3eu",15],["yts-subs",15],["yts",15],["zooqle",15],["dutchycorp",16],["dood",[24,46]],["doodstream",24],["dooood",[24,46]],["shrinke",26],["shrinkme",26],["mydverse",37],["poplinks",39],["123movies",46],["123moviesla",46],["123movieweb",46],["2embed",46],["4hiidude",46],["720pstream",46],["9xmovies",46],["adshort",46],["allmovieshub",46],["asianplay",46],["atishmkv",46],["cricstream",46],["crictime",46],["databasegdriveplayer",46],["dloader",46],["easylinks",46],["extralinks",46],["extramovies",46],["faselhd",46],["filemoon",46],["filmy",46],["filmyhit",46],["filmywap",46],["fmovies",46],["fsapi",46],["gdplayer",46],["gdriveplayer",46],["goload",46],["gomoviefree",46],["gomovies",46],["gowatchseries",46],["hdmoviz",46],["hindilinks4u",46],["hurawatch",46],["isaidub",46],["isaidubhd",46],["jalshamoviezhd",46],["jiorockers",46],["linkshub",46],["linksme",46],["livecricket",46],["madrasdub",46],["mkvcinemas",46],["mobilemovies",46],["movies2watch",46],["moviesda1",46],["moviespapa",46],["mp4moviez",46],["mydownloadtube",46],["nsw2u",46],["nuroflix",46],["o2tvseries",46],["o2tvseriesz",46],["pirlotv",46],["poscitech",46],["primewire",46],["serienstream",46],["sflix",46],["shahed4u",46],["shaheed4u",46],["speedostream",46],["sportcast",46],["sportskart",46],["streamingcommunity",46],["tamilarasan",46],["tamilfreemp3songs",46],["tamilprinthd",46],["torrentdosfilmes",46],["uploadrar",46],["uqload",46],["vidcloud9",46],["vido",46],["vidoo",46],["vudeo",46],["vumoo",46],["watchomovies",[46,55]],["yesmovies",46],["kickass",47],["cine-calidad",53],["actvid",84]]);

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
