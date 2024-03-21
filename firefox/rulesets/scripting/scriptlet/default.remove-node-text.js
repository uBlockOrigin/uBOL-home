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

const argsList = [["script","DisplayAcceptableAdIfAdblocked"],["script","/==undefined.*body/"],["script","style"],["script","Promise"],["script","Number.isSafeInteger"],["script","Reflect"],["script","document.write"],["script","self == top"],["script","/popunder|isAdBlock|admvn.src/i"],["script","deblocker"],["script","exdynsrv"],["script","/adb/i"],["script","adsbygoogle"],["script","FingerprintJS"],["script","/h=decodeURIComponent|popundersPerIP/"],["script","/adblock.php"],["script","/document\\.createElement|\\.banner-in/"],["script","/block-adb|-0x|adblock/"],["script","ExoLoader"],["script","/?key.*open/","condition","key"],["script","adblock"],["script","homad"],["script","alert"],["script","/adblock|popunder/"],["script","'.ains'"],["script","/fetch|adb/i"],["script","window.open"],["script","throw Error","condition","/^\\s*\\(?function.*\\);\\}\\}\\(\\)\\)\\);/"],["script",";break;case $."],["script","zaraz"],["script","shown_at"],["script","adblockimg"],["script","showAd"],["script","document.createElement(\"script\")"],["script","googlesyndication"],["script","justDetectAdblock"],["script","antiAdBlock"],["script","/fairAdblock|popMagic/"],["script","queue.addFile"],["script","/bypass.php"],["script","htmls"],["script","/\\/detected\\.html|Adblock/"],["script","toast"],["script","AdbModel"],["script","antiAdBlockerHandler"],["script","/ad\\s?block|adsBlocked|document\\.write\\(unescape\\('|devtool/i"],["script","onerror"],["script","location.assign"],["script","location.href"],["script","/checkAdBlocker|AdblockRegixFinder/"],["script","catch"],["script","adb_detected"],["script","Adblock"],["script",";}}};break;case $."],["style","text-decoration"],["script","push"],["script","AdBlocker"],["script","clicky"],["script","charCodeAt"],["script","popMagic"],["script","/popMagic|pop1stp/"],["script","popunder"],["script","/adblock|location\\.replace/"],["script","/downloadJSAtOnload|Object.prototype.toString.call/"],["script","numberPages"],["script","KCgpPT57bGV0IGU"],["script","error-report.com"],["script","adShield"],["script","AdblockRegixFinder"],["script","serve"],["script",".slice(0, -1); }"],["script","(Math.PI).toFixed(10).slice(0, -1);"],["script","/ConsoleBan|alert|AdBlocker/"],["script","runPop"],["script","mdpDeblocker"],["script","alert","condition","adblock"],["script","adb"],["script","await fetch"],["script","innerHTML"],["script","/'.adsbygoogle'|text-danger|warning|Adblock|_0x/"],["script","popUnder"],["#text","/スポンサーリンク|Sponsored Link|广告/"],["#text","スポンサーリンク"],["#text","スポンサードリンク"],["#text","/\\[vkExUnit_ad area=(after|before)\\]/"],["#text","【広告】"],["#text","【PR】"],["#text","関連動画"],["#text","PR:"],["script","leave_recommend"],["#text","/Advertisement/"],["script","zfgloaded"],["script","ai_adb"],["script","HTMLAllCollection"],["script","liedetector"],["script","popWin"],["script","end_click"],["script","ad blocker"],["script","closeAd"],["script","/modal|popupads/"],["script","/adconfig/i"],["script","AdblockDetector"],["script","is_antiblock_refresh"],["script","/userAgent|adb|htmls/"],["script","myModal"],["script","ad_block"],["script","app_checkext"],["script","clientHeight"],["script","/url_key|adHtml/"],["script","pop.target"],["script","/showadblock|_0x/"],["script","axios"],["script","ad block"],["script","\"v4ac1eiZr0\""],["script","admiral"],["script","/charAt|XMLHttpRequest/"],["script","AdBlockEnabled"],["script","window.location.replace"],["script","/$.*open/"],["script","Brave"],["script","egoTab"],["script","abDetectorPro"],["script","/$.*(css|oncontextmenu)/"],["script","/eval.*RegExp/"],["script","wwads"],["script","/\\[\\'push\\'\\]/"],["script","/adblock/i"],["script","/$.*adUnits/"],["script","decodeURIComponent"],["script","RegExp"],["script","adbl"],["script","doOpen"],["script","adsBlocked"],["script","chkADB"],["script","AaDetector"],["script","AdBlock"],["script","Symbol.iterator"],["script","/innerHTML.*appendChild/"],["script","Exo"],["script","detectAdBlock"],["script","popup"],["script","/window\\[\\'open\\'\\]/"],["script","Error"],["script","document.head.appendChild"],["script","Number"],["script","ad-block-activated"],["script","insertBefore"],["script","pop.doEvent"],["script","constructor"],["script","/adbl/i"],["script","detect"],["script","fetch"],["script","/join\\(\\'\\'\\)/"],["script","/join\\(\\\"\\\"\\)/"],["script","api.dataunlocker.com"],["script","vglnk"],["script","/RegExp\\(\\'/","condition","RegExp"],["script","NREUM"]];

const hostnamesMap = new Map([["alpin.de",0],["boersennews.de",0],["chefkoch.de",0],["chip.de",0],["clever-tanken.de",0],["desired.de",0],["donnerwetter.de",0],["fanfiktion.de",0],["focus.de",0],["formel1.de",0],["frustfrei-lernen.de",0],["gewinnspiele.tv",0],["giga.de",0],["gut-erklaert.de",0],["kino.de",0],["messen.de",0],["nickles.de",0],["nordbayern.de",0],["spielfilm.de",0],["teltarif.de",0],["unsere-helden.com",0],["weltfussball.at",0],["aupetitparieur.com",1],["allthingsvegas.com",1],["100percentfedup.com",1],["beforeitsnews.com",1],["concomber.com",1],["conservativebrief.com",1],["conservativefiringline.com",1],["dailylol.com",1],["funnyand.com",1],["letocard.fr",1],["mamieastuce.com",1],["meilleurpronostic.fr",1],["patriotnationpress.com",1],["toptenz.net",1],["vitamiiin.com",1],["writerscafe.org",1],["populist.press",1],["dailytruthreport.com",1],["livinggospeldaily.com",1],["first-names-meanings.com",1],["welovetrump.com",1],["thehayride.com",1],["thelibertydaily.com",1],["thepoke.co.uk",1],["thepolitistick.com",1],["theblacksphere.net",1],["shark-tank.com",1],["naturalblaze.com",1],["greatamericanrepublic.com",1],["dailysurge.com",1],["truthlion.com",1],["flagandcross.com",1],["westword.com",1],["republicbrief.com",1],["freedomfirstnetwork.com",1],["phoenixnewtimes.com",1],["designbump.com",1],["clashdaily.com",1],["madworldnews.com",1],["reviveusa.com",1],["sonsoflibertymedia.com",1],["thedesigninspiration.com",1],["videogamesblogger.com",1],["protrumpnews.com",1],["thepalmierireport.com",1],["kresy.pl",1],["thepatriotjournal.com",1],["gellerreport.com",1],["thegatewaypundit.com",1],["wltreport.com",1],["miaminewtimes.com",1],["politicalsignal.com",1],["rightwingnews.com",1],["bigleaguepolitics.com",1],["comicallyincorrect.com",1],["moviepilot.de",3],["yts.mx",6],["upornia.com",8],["pinsystem.co.uk",9],["elrellano.com",9],["tinyppt.com",9],["downfile.site",9],["expertvn.com",9],["trangchu.news",9],["bharathwick.com",9],["descargaspcpro.net",9],["dx-tv.com",9],["rt3dmodels.com",9],["plc4me.com",9],["blisseyhusbands.com",9],["madaradex.org",9],["franceprefecture.fr",9],["uiiumovies.net",9],["jazbaat.in",9],["learnmany.in",9],["loaninsurehub.com",9],["amanguides.com",[9,43]],["highkeyfinance.com",[9,43]],["appkamods.com",9],["techacode.com",9],["djqunjab.in",9],["3dmodelshare.org",9],["nulleb.com",9],["asiaon.top",9],["coursesghar.com",9],["thecustomrom.com",9],["snlookup.com",9],["bingotingo.com",9],["ghior.com",9],["3dmili.com",9],["karanpc.com",9],["plc247.com",9],["hiraethtranslation.com",9],["apkdelisi.net",9],["javindo.eu.org",9],["chindohot.site",9],["freepasses.org",9],["tomarnarede.pt",9],["basketballbuzz.ca",9],["dribbblegraphics.com",9],["kemiox.com",9],["checkersmenu.us",9],["teksnologi.com",9],["dollareuro.live",9],["eporner.com",11],["germancarforum.com",12],["cybercityhelp.in",12],["streamnoads.com",[13,14,53]],["bowfile.com",13],["cloudvideo.tv",[13,53]],["coloredmanga.com",13],["embedstream.me",[13,14,53]],["exeo.app",13],["hiphopa.net",[13,14]],["megaup.net",13],["tv247.us",[13,14]],["uploadhaven.com",13],["userscloud.com",[13,53]],["mdfx9dc8n.net",14],["mdzsmutpcvykb.net",14],["mixdrop21.net",14],["mixdropjmk.pw",14],["y2tube.pro",14],["123movies4u.site",14],["1337xporn.com",14],["141jav.com",14],["1bit.space",14],["1bitspace.com",14],["38dh2.top",14],["3dporndude.com",14],["4archive.org",14],["4horlover.com",14],["560pmovie.com",14],["60fps.xyz",14],["85tube.com",14],["85videos.com",14],["8xlinks.click",14],["a2zcrackworld.com",14],["aazzz.xyz",14],["acefile.co",14],["actusports.eu",14],["adclickersbot.com",14],["adricami.com",14],["adslink.pw",14],["adultstvlive.com",14],["adz7short.space",14],["aeblender.com",14],["ahdafnews.blogspot.com",14],["ak47sports.com",14],["akuma.moe",14],["allplayer.tk",14],["allstreaming.online",14],["amadoras.cf",14],["amadorasdanet.shop",14],["amateurblog.tv",14],["androidadult.com",14],["anhsexjav.xyz",14],["anidl.org",14],["anime-loads.org",14],["animeblkom.net",14],["animefire.plus",14],["animelek.me",14],["animeshouse.net",14],["animespire.net",14],["animestotais.xyz",14],["animeyt.es",14],["anroll.net",14],["anymoviess.xyz",14],["aotonline.org",14],["asenshu.com",14],["asialiveaction.com",14],["asianclipdedhd.net",14],["askim-bg.com",14],["asumsikedaishop.com",14],["avcrempie.com",14],["avseesee.com",14],["gettapeads.com",14],["backfirstwo.com",14],["bajarjuegospcgratis.com",14],["balkanportal.net",14],["balkanteka.net",14],["bdnewszh.com",[14,53]],["belowporn.com",14],["bestclaimtrx.xyz",14],["bestgirlsexy.com",14],["bestnhl.com",14],["bestporn4free.com",14],["bestporncomix.com",14],["bet36.es",14],["bikinitryon.net",14],["birdurls.com",14],["bitsearch.to",14],["blackcockadventure.com",14],["blackcockchurch.org",14],["blackporncrazy.com",14],["blizzboygames.net",14],["blizzpaste.com",14],["blkom.com",14],["blog-peliculas.com",14],["blogtrabalhista.com",14],["blurayufr.xyz",14],["bobsvagene.club",14],["bolly4umovies.click",14],["bonusharian.pro",14],["brilian-news.id",14],["brupload.net",14],["bucitana.com",14],["cablegratis.online",14],["camchickscaps.com",14],["camgirlcum.com",14],["camgirls.casa",14],["cashurl.in",14],["castingx.net",14],["ccurl.net",[14,53]],["celebrity-leaks.net",14],["cgpelis.net",14],["charexempire.com",14],["clasico.tv",14],["clik.pw",14],["coin-free.com",[14,40]],["coins100s.fun",14],["comicsmanics.com",14],["compucalitv.com",14],["coolcast2.com",14],["cosplaytab.com",14],["countylocalnews.com",14],["cpmlink.net",14],["crackstreamshd.click",14],["crespomods.com",14],["crisanimex.com",14],["crunchyscan.fr",14],["cuevana3.fan",14],["cuevana3hd.com",14],["cumception.com",14],["curvaweb.com",14],["cutpaid.com",14],["cypherscans.xyz",[14,53]],["datawav.club",14],["daughtertraining.com",14],["deepgoretube.site",14],["deltabit.co",14],["depvailon.com",14],["derleta.com",14],["desivdo.com",14],["desixx.net",14],["detikkebumen.com",14],["deutschepornos.me",14],["diasoft.xyz",14],["directupload.net",14],["diskusscan.com",14],["dixva.com",14],["dlhd.sx",14],["doctormalay.com",14],["dofusports.xyz",14],["dogemate.com",14],["doods.cam",14],["doodskin.lat",14],["downloadrips.com",14],["downvod.com",14],["dphunters.mom",14],["dragontranslation.com",14],["duddes.xyz",14],["dvdfullestrenos.com",14],["easylinks.in",14],["ebookbb.com",14],["ebookhunter.net",14],["egyanime.com",14],["egygost.com",14],["egyshare.cc",14],["ekasiwap.com",14],["electro-torrent.pl",14],["elil.cc",14],["embed4u.xyz",14],["eplayer.click",14],["erovoice.us",14],["eroxxx.us",14],["estrenosdoramas.net",14],["everia.club",14],["everythinginherenet.blogspot.com",14],["extrafreetv.com",14],["extremotvplay.com",14],["fapinporn.com",14],["fapptime.com",14],["fashionblog.tv",14],["fastreams.live",14],["faucethero.com",14],["fembed.com",14],["femdom-joi.com",14],["fileone.tv",14],["film1k.com",14],["filmeonline2023.net",14],["filmesonlinex.org",14],["filmesonlinexhd.biz",[14,53]],["filmovitica.com",14],["filmymaza.blogspot.com",14],["filthy.family",14],["firstmovies.to",14],["fixfinder.click",14],["flostreams.xyz",14],["flyfaucet.com",14],["footyhunter.lol",14],["footyhunter3.xyz",[14,53]],["forex-golds.com",14],["forex-trnd.com",14],["forumchat.club",14],["forumlovers.club",14],["freemoviesonline.biz",14],["freeomovie.co.in",14],["freeomovie.to",14],["freeporncomic.net",14],["freepornhdonlinegay.com",14],["freeproxy.io",14],["freeuse.me",14],["freeusexporn.com",14],["fsicomics.com",14],["gambarbogel.xyz",14],["gamepcfull.com",14],["gameronix.com",14],["gamesfullx.com",14],["gameshdlive.net",14],["gameshdlive.xyz",14],["gamesmountain.com",14],["gamesrepacks.com",14],["gamingguru.fr",14],["gamovideo.com",14],["garota.cf",14],["gaydelicious.com",14],["gaypornmasters.com",14],["gaysex69.net",14],["gemstreams.com",14],["get-to.link",14],["girlscanner.org",14],["giurgiuveanul.ro",14],["gledajcrtace.xyz",14],["gocast2.com",14],["gomo.to",14],["gostosa.cf",14],["gtlink.co",14],["gwiazdypornosow.pl",14],["haho.moe",14],["hatsukimanga.com",14],["hayhd.net",14],["hdsaprevodom.com",14],["hdstreamss.club",14],["hentais.tube",14],["hentaistream.co",14],["hentaitk.net",14],["hentaitube.online",14],["hentaiworld.tv",14],["hesgoal.tv",14],["hexupload.net",14],["hhkungfu.tv",14],["highlanderhelp.com",14],["hindimean.com",14],["hindimovies.to",[14,53]],["hiperdex.com",14],["hispasexy.org",14],["hitomi.la",14],["hitprn.com",14],["hoca4u.com",14],["hollymoviehd.cc",14],["hoodsite.com",14],["hopepaste.download",14],["hornylips.com",14],["hotgranny.live",14],["hotmama.live",14],["hqcelebcorner.net",14],["huren.best",14],["hwnaturkya.com",[14,53]],["hxfile.co",[14,53]],["igfap.com",14],["ihdstreams.xyz",14],["iklandb.com",14],["illink.net",14],["imgkings.com",14],["imgsex.xyz",14],["imx.to",14],["influencersgonewild.org",14],["infosgj.free.fr",14],["investnewsbrazil.com",14],["itdmusics.com",14],["itsuseful.site",14],["itunesfre.com",14],["iwatchfriendsonline.net",[14,94]],["jackstreams.com",14],["jatimupdate24.com",14],["javcl.com",14],["javf.net",14],["javhay.net",14],["javhoho.com",14],["javhun.com",14],["javleak.com",14],["javporn.best",14],["javsex.to",14],["javtiful.com",14],["jimdofree.com",14],["jiofiles.org",14],["jorpetz.com",14],["journalyc.online",14],["jp-films.com",14],["jpop80ss3.blogspot.com",14],["jpopsingles.eu",14],["kantotflix.net",14],["kantotinyo.com",14],["kaoskrew.org",14],["kaplog.com",14],["keralatvbox.com",14],["kickassanimes.io",14],["kimochi.info",14],["kimochi.tv",14],["kinemania.tv",14],["konstantinova.net",14],["koora-online.live",14],["kunmanga.com",14],["kutmoney.com",14],["kwithsub.com",14],["ladangreceh.xyz",14],["lat69.me",14],["latinblog.tv",14],["latinomegahd.net",14],["lazyfaucet.com",14],["leechpremium.link",14],["legendas.dev",14],["legendei.net",14],["lightdlmovies.blogspot.com",14],["lighterlegend.com",14],["linclik.com",14],["linkebr.com",14],["linkrex.net",14],["links.worldfree4u-lol.online",14],["linksfy.co",14],["lody.ink",14],["lovesomecommunity.com",14],["lulustream.com",[14,53]],["luluvdo.com",[14,53]],["luzcameraeacao.shop",14],["manga-oni.com",14],["mangaboat.com",14],["mangagenki.me",14],["mangahere.onl",14],["mangaweb.xyz",14],["mangoporn.net",14],["manhwahentai.me",14],["masahub.com",14],["masahub.net",14],["maturegrannyfuck.com",14],["mdy48tn97.com",14],["mediapemersatubangsa.com",14],["mega-mkv.com",14],["megapastes.com",14],["megapornpics.com",14],["messitv.net",14],["meusanimes.net",14],["milfmoza.com",14],["milfzr.com",14],["millionscast.com",14],["mimaletamusical.blogspot.com",14],["mitly.us",14],["mkv-pastes.com",14],["modb.xyz",14],["monaskuliner.ac.id",14],["moredesi.com",14],["movgotv.net",14],["movi.pk",14],["movieswbb.com",14],["moviewatch.com.pk",14],["mp4upload.com",14],["mrskin.live",14],["multicanaistv.com",14],["mundowuxia.com",14],["myeasymusic.ir",14],["myonvideo.com",14],["myyouporn.com",14],["narutoget.info",14],["naughtypiss.com",14],["nerdiess.com",14],["new-fs.eu",14],["newtorrentgame.com",14],["nflstreams.me",14],["niaomea.me",[14,53]],["nicekkk.com",14],["nicesss.com",14],["nlegs.com",14],["nolive.me",[14,53]],["nopay.info",14],["nopay2.info",[14,134]],["notformembersonly.com",14],["novamovie.net",14],["novelpdf.xyz",14],["novelssites.com",[14,53]],["novelup.top",14],["nsfwr34.com",14],["nu6i-bg-net.com",14],["nudebabesin3d.com",14],["nukedfans.com",14],["nuoga.eu",14],["nzbstars.com",14],["ohjav.com",14],["ojearnovelas.com",14],["okanime.xyz",14],["olarixas.xyz",14],["oldbox.cloud",14],["olweb.tv",14],["olympicstreams.me",14],["on9.stream",14],["oncast.xyz",14],["onepiece-mangaonline.com",14],["onifile.com",14],["onionstream.live",14],["onlinesaprevodom.net",14],["onlyfullporn.video",14],["onplustv.live",14],["originporn.com",14],["ovagames.com",14],["ovamusic.com",14],["owllink.net",14],["packsporn.com",14],["pahaplayers.click",14],["palimas.org",14],["pandafiles.com",14],["papahd.club",14],["papahd1.xyz",14],["password69.com",14],["paste3.org",14],["pastemytxt.com",14],["payskip.org",14],["peeplink.in",14],["peliculasmx.net",14],["pervertgirlsvideos.com",14],["pervyvideos.com",14],["phim12h.com",14],["picdollar.com",14],["pickteenz.com",14],["pics4you.net",14],["picsxxxporn.com",14],["pinayscandalz.com",14],["pinkueiga.net",14],["piratefast.xyz",14],["piratehaven.xyz",14],["pirateiro.com",14],["pirlotvonline.org",14],["playtube.co.za",14],["plugintorrent.com",14],["pmvzone.com",14],["porndish.com",14],["pornez.net",14],["pornfetishbdsm.com",14],["pornfits.com",14],["pornhd720p.com",14],["pornobr.club",14],["pornobr.ninja",14],["pornodominicano.net",14],["pornofaps.com",14],["pornoflux.com",14],["pornotorrent.com.br",14],["pornredit.com",14],["pornstarsyfamosas.es",14],["pornstreams.co",14],["porntn.com",14],["pornxbit.com",14],["pornxday.com",14],["portaldasnovinhas.shop",14],["portugues-fcr.blogspot.com",14],["poscishd.online",14],["poscitesch.com",[14,53]],["poseyoung.com",14],["pover.org",14],["proxyninja.org",14],["pubfilmz.com",14],["publicsexamateurs.com",14],["punanihub.com",14],["putlocker5movies.org",14],["pxxbay.com",14],["r18.best",14],["ragnaru.net",14],["rapbeh.net",14],["rapelust.com",14],["rapload.org",14],["read-onepiece.net",14],["retro-fucking.com",14],["retrotv.org",14],["robaldowns.com",14],["rockdilla.com",14],["rojadirectatvenvivo.com",14],["rojitadirecta.blogspot.com",14],["romancetv.site",14],["rule34.club",14],["rule34hentai.net",14],["rumahbokep-id.com",14],["safego.cc",14],["sakurafile.com",14],["satoshi-win.xyz",14],["scat.gold",14],["scatfap.com",14],["scatkings.com",14],["scnlog.me",14],["scripts-webmasters.net",14],["serie-turche.com",14],["serijefilmovi.com",14],["sexcomics.me",14],["sexdicted.com",14],["sexgay18.com",14],["sexofilm.co",14],["sextgem.com",14],["sextubebbw.com",14],["sgpics.net",14],["shadowrangers.live",14],["shahee4u.cam",14],["shahiid-anime.net",14],["shemale6.com",14],["shinden.pl",14],["short.es",14],["showmanga.blog.fc2.com",14],["shrt10.com",14],["shurt.pw",14],["sideplusleaks.net",14],["silverblog.tv",14],["silverpic.com",14],["sinhalasub.life",14],["sinsitio.site",14],["sinvida.me",14],["skidrowcpy.com",14],["skidrowfull.com",14],["skidrowreloaded.com",14],["slut.mom",14],["smallencode.me",14],["smoner.com",14],["smplace.com",14],["soccerinhd.com",14],["socceron.name",14],["softairbay.com",14],["sokobj.com",14],["songsio.com",14],["souexatasmais.com",14],["sportbar.live",14],["sportea.online",14],["sportskart.xyz",14],["sportstream1.cfd",14],["sporttuna.site",14],["srt.am",14],["srts.me",14],["stakes100.xyz",14],["stbemuiptv.com",14],["stockingfetishvideo.com",14],["stream.crichd.vip",14],["stream.lc",14],["stream25.xyz",14],["streambee.to",14],["streamcenter.pro",14],["streamers.watch",14],["streamgo.to",14],["streamkiste.tv",14],["streamoporn.xyz",14],["streamoupload.xyz",14],["streamservicehd.click",14],["streamvid.net",[14,20]],["subtitleporn.com",14],["subtitles.cam",14],["suicidepics.com",14],["supertelevisionhd.com",14],["supexfeeds.com",14],["swzz.xyz",14],["sxnaar.com",14],["tabooporns.com",14],["taboosex.club",14],["tapeantiads.com",14],["tapeblocker.com",14],["tapenoads.com",14],["tapewithadblock.org",[14,156]],["teamos.xyz",14],["teen-wave.com",14],["teenporncrazy.com",14],["telegramgroups.xyz",14],["telenovelasweb.com",14],["tensei-shitara-slime-datta-ken.com",14],["tfp.is",14],["tgo-tv.co",[14,53]],["thaihotmodels.com",14],["theblueclit.com",14],["thebussybandit.com",14],["theicongenerator.com",14],["thelastdisaster.vip",14],["thepiratebay0.org",14],["thepiratebay10.info",14],["thesexcloud.com",14],["thothub.today",14],["tightsexteens.com",14],["tojav.net",14],["tokyoblog.tv",14],["tonnestreamz.xyz",14],["top16.net",14],["topvideosgay.com",14],["torrage.info",14],["torrents.vip",14],["torrsexvid.com",14],["tpb-proxy.xyz",14],["trannyteca.com",14],["trendytalker.com",14],["tumanga.net",14],["turbogvideos.com",14],["turbovid.me",14],["turkishseriestv.org",14],["turksub24.net",14],["tutele.sx",14],["tutelehd3.xyz",14],["tvglobe.me",14],["tvpclive.com",14],["tvs-widget.com",14],["tvseries.video",14],["ucptt.com",14],["ufaucet.online",14],["ufcfight.online",14],["uhdgames.xyz",14],["ultrahorny.com",14],["ultraten.net",14],["unblockweb.me",14],["underhentai.net",14],["uniqueten.net",14],["upbaam.com",14],["upstream.to",14],["valeriabelen.com",14],["verdragonball.online",14],["vfxmed.com",14],["video.az",14],["videostreaming.rocks",14],["videowood.tv",14],["vidorg.net",14],["vidtapes.com",14],["vidz7.com",14],["vikistream.com",14],["vikv.net",14],["virpe.cc",14],["visifilmai.org",14],["viveseries.com",14],["vladrustov.sx",14],["volokit2.com",14],["vstorrent.org",14],["w-hentai.com",14],["watchaccordingtojimonline.com",14],["watchbrooklynnine-nine.com",14],["watchdowntonabbeyonline.com",14],["watchelementaryonline.com",14],["watcheronline.net",14],["watchgleeonline.com",14],["watchhowimetyourmother.online",14],["watchjavidol.com",14],["watchkobestreams.info",14],["watchlostonline.net",14],["watchlouieonline.com",14],["watchmadmenonline.com",14],["watchmonkonline.com",14],["watchonceuponatimeonline.com",14],["watchparksandrecreation.net",14],["watchprettylittleliarsonline.com",14],["watchrulesofengagementonline.com",14],["watchthekingofqueens.com",14],["watchthemiddleonline.com",14],["watchtvchh.xyz",14],["webcamrips.com",14],["wickedspot.org",14],["wincest.xyz",14],["witanime.best",14],["wolverdon.fun",14],["wolverdonx.com",14],["wordcounter.icu",14],["worldcupstream.pm",14],["worldmovies.store",14],["worldstreams.click",14],["wpdeployit.com",14],["wqstreams.tk",14],["wwwsct.com",14],["xanimeporn.com",14],["xblog.tv",14],["xn--verseriesespaollatino-obc.online",14],["xn--xvideos-espaol-1nb.com",14],["xpornium.net",14],["xsober.com",14],["xvip.lat",14],["xxgasm.com",14],["xxvideoss.org",14],["xxx18.uno",14],["xxxdominicana.com",14],["xxxfree.watch",14],["xxxmax.net",14],["xxxwebdlxxx.top",14],["xxxxvideo.uno",14],["y2b.wiki",14],["yabai.si",14],["yadixv.com",14],["yayanimes.net",14],["yeshd.net",14],["yodbox.com",14],["youjax.com",14],["youpits.xyz",14],["yourdailypornvideos.ws",14],["yourupload.com",14],["ytstv.me",14],["ytstvmovies.co",14],["ytstvmovies.xyz",14],["ytsyify.co",14],["ytsyifymovie.com",14],["zerion.cc",14],["zerocoin.top",14],["zitss.xyz",14],["zpaste.net",14],["zplayer.live",14],["faucet.ovh",15],["oko.sh",16],["bigbtc.win",17],["cryptofun.space",17],["sexo5k.com",18],["truyen-hentai.com",18],["theshedend.com",20],["rsadnetworkinfo.com",20],["rsinsuranceinfo.com",20],["rsfinanceinfo.com",20],["rsgamer.app",20],["rssoftwareinfo.com",20],["rshostinginfo.com",20],["rseducationinfo.com",20],["zeroupload.com",20],["securenetsystems.net",20],["miniwebtool.com",20],["bchtechnologies.com",20],["spiegel.de",21],["appnee.com",22],["d0000d.com",23],["d000d.com",23],["d0o0d.com",23],["do0od.com",23],["doods.pro",23],["ds2play.com",23],["ds2video.com",23],["apkmirror.com",[24,65]],["onlyfaucet.com",25],["livecamrips.com",26],["smutty.com",26],["down.dataaps.com",26],["filmweb.pl",26],["infinityscans.xyz",[27,28]],["infinityscans.net",[27,28]],["j8jp.com",29],["musichq.pe",30],["sekaikomik.bio",30],["visionpapers.org",31],["fdownloader.net",32],["mielec.pl",33],["camsrip.com",34],["iisfvirtual.in",34],["starxinvestor.com",34],["beatsnoop.com",34],["fetchpik.com",34],["hackerranksolution.in",34],["stfly.xyz",35],["treasl.com",36],["mrbenne.com",37],["webhostingpost.com",[38,53]],["tophostingapp.com",38],["digitalmarktrend.com",38],["kenzo-flowertag.com",39],["mdn.lol",39],["btcbitco.in",40],["btcsatoshi.net",40],["cempakajaya.com",40],["crypto4yu.com",40],["gainl.ink",40],["manofadan.com",40],["readbitcoin.org",40],["wiour.com",40],["kienthucrangmieng.com",40],["tremamnon.com",40],["btc25.org",40],["tron-free.com",40],["bitsmagic.fun",40],["ourcoincash.xyz",40],["hynews.biz",40],["blog.cryptowidgets.net",41],["blog.insurancegold.in",41],["blog.wiki-topia.com",41],["blog.coinsvalue.net",41],["blog.cookinguide.net",41],["blog.freeoseocheck.com",41],["aylink.co",42],["sugarona.com",43],["nishankhatri.xyz",43],["tinys.click",44],["answerpython.com",44],["gsm-solution.com",44],["h-donghua.com",44],["hindisubbedacademy.com",44],["pkgovjobz.com",44],["ripexbooster.xyz",44],["serial4.com",44],["serial412.blogspot.com",44],["sigmalinks.in",44],["tutorgaming.com",44],["aiimgvlog.fun",45],["appsbull.com",46],["diudemy.com",46],["maqal360.com",46],["mphealth.online",46],["makefreecallsonline.com",46],["androjungle.com",46],["bookszone.in",46],["drakescans.com",46],["shortix.co",46],["msonglyrics.com",46],["app-sorteos.com",46],["bokugents.com",46],["client.pylexnodes.net",46],["btvplus.bg",46],["blog24.me",[47,48]],["coingraph.us",49],["impact24.us",49],["iconicblogger.com",50],["tii.la",51],["kiemlua.com",52],["6movies.net",53],["adsh.cc",53],["afilmyhouse.blogspot.com",53],["ak.sv",53],["animesultra.com",53],["api.webs.moe",53],["apkmody.io",53],["atglinks.com",53],["attvideo.com",53],["backfirstwo.site",[53,125]],["crazyblog.in",53],["divicast.com",53],["embed.meomeo.pw",53],["filmeserialeonline.org",53],["flexyhit.com",53],["foreverwallpapers.com",53],["french-streams.cc",53],["fslinks.org",53],["fstream365.com",53],["hdtoday.to",53],["hinatasoul.com",53],["igg-games.com",53],["membed.net",53],["mgnetu.com",53],["movie4kto.net",53],["mp3juice.info",53],["mp3juices.cc",53],["myflixerz.to",53],["oii.io",53],["paidshitforfree.com",53],["pepperlive.info",53],["playertv.net",53],["putlocker68.com",53],["s.to",53],["share.filesh.site",53],["sharkfish.xyz",53],["skidrowcodex.net",53],["sports-stream.site",53],["stream4free.live",53],["tamilmobilemovies.in",53],["tapeadsenjoyer.com",53],["thewatchseries.live",53],["tnmusic.in",53],["travelplanspro.com",53],["tusfiles.com",53],["unlimitmovies.com",53],["vid-guard.com",53],["vidsaver.net",53],["vidspeeds.com",53],["viralitytoday.com",53],["voiranime.stream",53],["watchdoctorwhoonline.com",53],["woxikon.in",53],["ylink.bid",53],["ytix.xyz",53],["unblocked.id",55],["listendata.com",56],["7xm.xyz",56],["fastupload.io",56],["azmath.info",56],["wouterplanet.com",57],["androidacy.com",58],["veryfreeporn.com",59],["besthdgayporn.com",60],["drivenime.com",60],["javup.org",60],["shemaleup.net",60],["freeroms.com",61],["soap2day-online.com",61],["veev.to",[61,148]],["austiblox.net",62],["btcbunch.com",63],["teachoo.com",64],["genshinlab.com",65],["fourfourtwo.co.kr",65],["interfootball.co.kr",65],["a-ha.io",65],["cboard.net",65],["jjang0u.com",65],["joongdo.co.kr",65],["viva100.com",65],["thephoblographer.com",65],["newdaily.co.kr",65],["gamingdeputy.com",65],["thesaurus.net",65],["tweaksforgeeks.com",65],["alle-tests.nl",65],["maketecheasier.com",65],["automobile-catalog.com",65],["motorbikecatalog.com",65],["meconomynews.com",65],["brandbrief.co.kr",65],["mlbpark.donga.com",65],["motorgraph.com",65],["heraldcorp.com",65],["allthetests.com",66],["issuya.com",66],["topstarnews.net",66],["worldhistory.org",67],["bitcotasks.com",68],["udvl.com",69],["www.chip.de",[70,71]],["topsporter.net",72],["sportshub.to",72],["streamcheck.link",73],["unofficialtwrp.com",74],["bitcosite.com",75],["bitzite.com",75],["easymc.io",76],["yunjiema.top",76],["hacoos.com",77],["bondagevalley.cc",78],["zefoy.com",79],["vidello.net",80],["resizer.myct.jp",81],["gametohkenranbu.sakuraweb.com",82],["jisakuhibi.jp",83],["rank1-media.com",83],["lifematome.blog",84],["fm.sekkaku.net",85],["free-avx.jp",86],["dvdrev.com",87],["betweenjpandkr.blog",88],["nft-media.net",89],["ghacks.net",90],["songspk2.info",91],["truyentranhfull.net",92],["nectareousoverelate.com",95],["khoaiphim.com",96],["haafedk2.com",97],["fordownloader.com",97],["jovemnerd.com.br",98],["nicomanga.com",99],["totalcsgo.com",100],["vivamax.asia",101],["manysex.com",102],["gaminginfos.com",103],["tinxahoivn.com",104],["forums-fastunlock.com",105],["automoto.it",106],["codelivly.com",107],["ophim.vip",108],["touguatize.monster",109],["client.falixnodes.net",110],["novelhall.com",111],["hes-goal.net",112],["abc17news.com",113],["adoredbyalex.com",113],["agrodigital.com",113],["al.com",113],["aliontherunblog.com",113],["allaboutthetea.com",113],["allmovie.com",113],["allmusic.com",113],["allthingsthrifty.com",113],["amessagewithabottle.com",113],["androidpolice.com",113],["antyradio.pl",113],["artforum.com",113],["artnews.com",113],["avherald.com",113],["awkward.com",113],["awkwardmom.com",113],["bailiwickexpress.com",113],["barnsleychronicle.com",113],["becomingpeculiar.com",113],["bethcakes.com",113],["betweenenglandandiowa.com",113],["blogher.com",113],["bluegraygal.com",113],["briefeguru.de",113],["carmagazine.co.uk",113],["cattime.com",113],["cbr.com",113],["cbssports.com",113],["celiacandthebeast.com",113],["chaptercheats.com",113],["cleveland.com",113],["collider.com",113],["comingsoon.net",113],["commercialobserver.com",113],["competentedigitale.ro",113],["crafty.house",113],["dailyvoice.com",113],["decider.com",113],["didyouknowfacts.com",113],["dogtime.com",113],["dualshockers.com",113],["dustyoldthing.com",113],["faithhub.net",113],["femestella.com",113],["footwearnews.com",113],["freeconvert.com",113],["frogsandsnailsandpuppydogtail.com",113],["fsm-media.com",113],["funtasticlife.com",113],["fwmadebycarli.com",113],["gamerant.com",113],["gfinityesports.com",113],["givemesport.com",113],["gulflive.com",113],["helloflo.com",113],["homeglowdesign.com",113],["honeygirlsworld.com",113],["hotcars.com",113],["howtogeek.com",113],["insider-gaming.com",113],["insurancejournal.com",113],["jasminemaria.com",113],["kion546.com",113],["lehighvalleylive.com",113],["lettyskitchen.com",113],["lifeinleggings.com",113],["liveandletsfly.com",113],["lizzieinlace.com",113],["localnews8.com",113],["lonestarlive.com",113],["madeeveryday.com",113],["maidenhead-advertiser.co.uk",113],["makeuseof.com",113],["mardomreport.net",113],["masslive.com",113],["melangery.com",113],["milestomemories.com",113],["mlive.com",113],["modernmom.com",113],["momtastic.com",113],["mostlymorgan.com",113],["motherwellmag.com",113],["movieweb.com",113],["muddybootsanddiamonds.com",113],["musicfeeds.com.au",113],["mylifefromhome.com",113],["nationalreview.com",113],["neoskosmos.com",113],["nj.com",113],["nordot.app",113],["nothingbutnewcastle.com",113],["nsjonline.com",113],["nypost.com",113],["oakvillenews.org",113],["observer.com",113],["oregonlive.com",113],["ourlittlesliceofheaven.com",113],["pagesix.com",113],["palachinkablog.com",113],["pennlive.com",113],["pinkonthecheek.com",113],["politicususa.com",113],["predic.ro",113],["puckermom.com",113],["qtoptens.com",113],["realgm.com",113],["reelmama.com",113],["robbreport.com",113],["royalmailchat.co.uk",113],["samchui.com",113],["sandrarose.com",113],["screenrant.com",113],["sheknows.com",113],["sherdog.com",113],["sidereel.com",113],["silive.com",113],["simpleflying.com",113],["sloughexpress.co.uk",113],["spacenews.com",113],["sportsgamblingpodcast.com",113],["spotofteadesigns.com",113],["stacysrandomthoughts.com",113],["ssnewstelegram.com",113],["superherohype.com",113],["syracuse.com",113],["tablelifeblog.com",113],["thebeautysection.com",113],["thecelticblog.com",113],["thecurvyfashionista.com",113],["thefashionspot.com",113],["thegamer.com",113],["thegamescabin.com",113],["thenerdyme.com",113],["thenonconsumeradvocate.com",113],["theprudentgarden.com",113],["thethings.com",113],["timesnews.net",113],["topspeed.com",113],["toyotaklub.org.pl",113],["travelingformiles.com",113],["tutsnode.org",113],["tvline.com",113],["viralviralvideos.com",113],["wannacomewith.com",113],["wimp.com",113],["windsorexpress.co.uk",113],["woojr.com",113],["worldoftravelswithkids.com",113],["xda-developers.com",113],["cheatsheet.com",114],["pwinsider.com",114],["baeldung.com",114],["bagi.co.in",115],["keran.co",115],["biblestudytools.com",116],["christianheadlines.com",116],["ibelieve.com",116],["kuponigo.com",117],["kimcilonly.site",118],["kimcilonly.link",118],["cryptoearns.com",119],["inxxx.com",120],["ipaspot.app",121],["embedwish.com",122],["filelions.live",122],["leakslove.net",122],["jenismac.com",123],["vxetable.cn",124],["jewelavid.com",125],["nizarstream.com",125],["snapwordz.com",126],["toolxox.com",126],["rl6mans.com",126],["idol69.net",126],["plumbersforums.net",127],["123movies57.online",128],["gulio.site",129],["mediaset.es",130],["izlekolik.net",131],["donghuaworld.com",132],["letsdopuzzles.com",133],["tainio-mania.online",134],["hes-goals.io",135],["pkbiosfix.com",135],["casi3.xyz",135],["rediff.com",136],["dzapk.com",137],["darknessporn.com",138],["familyporner.com",138],["freepublicporn.com",138],["pisshamster.com",138],["punishworld.com",138],["xanimu.com",138],["pig69.com",139],["cosplay18.pics",139],["javhdo.net",140],["eroticmoviesonline.me",141],["teleclub.xyz",142],["ecamrips.com",143],["showcamrips.com",143],["9animetv.to",144],["jornadaperfecta.com",145],["loseart.com",146],["sousou-no-frieren.com",147],["intro-hd.net",149],["monacomatin.mc",149],["nodo313.net",149],["unite-guide.com",150],["thebullspen.com",151],["botcomics.com",152],["cefirates.com",152],["chandlerorchards.com",152],["comicleaks.com",152],["marketdata.app",152],["monumentmetals.com",152],["tapmyback.com",152],["ping.gg",152],["revistaferramental.com.br",152],["hawpar.com",152],["alpacafinance.org",[152,153]],["nookgaming.com",152],["enkeleksamen.no",152],["kvest.ee",152],["creatordrop.com",152],["panpots.com",152],["cybernetman.com",152],["bitdomain.biz",152],["gerardbosch.xyz",152],["fort-shop.kiev.ua",152],["accuretawealth.com",152],["resourceya.com",152],["tracktheta.com",152],["camberlion.com",152],["tt.live",153],["future-fortune.com",153],["abhijith.page",153],["madrigalmaps.com",153],["adventuretix.com",153],["panprices.com",154],["intercity.technology",154],["freelancer.taxmachine.be",154],["adria.gg",154],["fjlaboratories.com",154],["emanualonline.com",154],["proboards.com",155],["winclassic.net",155],["abema.tv",157]]);

const entitiesMap = new Map([["1337x",[2,14]],["kimcartoon",4],["pahe",[5,14]],["soap2day",5],["hqq",7],["waaw",7],["mhdsports",9],["mhdsportstv",9],["mhdtvsports",9],["mhdtvworld",9],["mhdtvmax",9],["reset-scans",9],["teluguflix",9],["poplinks",[9,46]],["pixhost",10],["viprow",[13,14,53]],["cloudvideotv",[13,53]],["vidsrc",[13,53]],["123-movies",14],["123movieshd",14],["123movieshub",14],["123moviesme",14],["1stream",14],["1tamilmv",14],["2ddl",14],["2umovies",14],["3hiidude",14],["4stream",14],["5movies",14],["7hitmovies",14],["9xmovie",14],["aagmaal",[14,53]],["adblockeronstape",14],["adblockeronstreamtape",14],["adblockplustape",14],["adblockstreamtape",14],["adblockstrtape",14],["adblockstrtech",14],["adblocktape",14],["adcorto",14],["alexsports",14],["alexsportss",14],["alexsportz",14],["animepahe",14],["animesanka",14],["animixplay",14],["aniplay",14],["antiadtape",14],["asianclub",14],["ask4movie",14],["atomixhq",[14,53]],["atomohd",14],["beinmatch",[14,19]],["bhaai",14],["buffstreams",14],["canalesportivo",14],["clickndownload",14],["clicknupload",14],["daddylive",[14,53]],["daddylivehd",[14,53]],["desiremovies",14],["devlib",14],["divxtotal",14],["divxtotal1",14],["dvdplay",[14,53]],["elixx",14],["enjoy4k",14],["estrenosflix",14],["estrenosflux",14],["estrenosgo",14],["f1stream",14],["fbstream",14],["file4go",14],["filmyzilla",[14,53]],["findav",14],["findporn",14],["flixmaza",14],["flizmovies",14],["freetvsports",14],["fullymaza",14],["g3g",14],["gotxx",14],["grantorrent",14],["hdmoviesfair",[14,53]],["hdmoviesflix",14],["hiidudemoviez",14],["imgsen",14],["imgsto",14],["incest",14],["incestflix",14],["itopmusic",14],["javmost",14],["keeplinks",14],["keepvid",14],["keralahd",14],["khatrimazaful",14],["khatrimazafull",14],["leechall",14],["linkshorts",14],["mangovideo",14],["masaporn",14],["miniurl",14],["mirrorace",14],["mixdroop",14],["mixdrop",14],["mkvcage",14],["mlbstream",14],["mlsbd",14],["mmsbee",14],["motogpstream",14],["movieplex",14],["movierulzlink",14],["movies123",14],["moviesflix",14],["moviesmeta",14],["moviessources",14],["moviesverse",14],["moviezwaphd",14],["mrunblock",14],["nbastream",14],["newmovierulz",14],["nflstream",14],["nhlstream",14],["noblocktape",14],["nocensor",14],["onlyfams",14],["ouo",14],["pctfenix",[14,53]],["pctnew",[14,53]],["peliculas24",14],["pelisplus",14],["piratebay",14],["plyjam",14],["plylive",14],["plyvdo",14],["pornhoarder",14],["prbay",14],["projectfreetv",14],["proxybit",14],["psarips",14],["racaty",14],["remaxhd",14],["rintor",14],["rnbxclusive",14],["rnbxclusive0",14],["rnbxclusive1",14],["rojadirecta",14],["rojadirectaenvivo",14],["rugbystreams",14],["sadisflix",14],["safetxt",14],["shadowrangers",14],["shahi4u",14],["shahid4u1",14],["shahid4uu",14],["shavetape",14],["shortearn",14],["shorten",14],["shorttey",14],["shortzzy",14],["skymovieshd",14],["socceronline",14],["softarchive",14],["sports-stream",14],["sshhaa",14],["stapadblockuser",14],["stape",14],["stapewithadblock",14],["starmusiq",14],["strcloud",14],["streamadblocker",[14,53]],["streamadblockplus",14],["streamcdn",14],["streamhub",14],["streamsport",14],["streamta",14],["streamtape",14],["streamtapeadblockuser",14],["strikeout",14],["strtape",14],["strtapeadblock",14],["strtapeadblocker",14],["strtapewithadblock",14],["strtpe",14],["swatchseries",14],["tabooflix",14],["tennisstreams",14],["themoviesflix",14],["thepiratebay",14],["thisav",14],["tmearn",14],["toonanime",14],["torlock",14],["tormalayalam",14],["torrentz2eu",14],["tutelehd",14],["tvply",14],["u4m",14],["ufcstream",14],["unblocknow",14],["uploadbuzz",14],["usagoals",14],["vexmoviex",14],["vidclouds",14],["vidlox",14],["vipbox",[14,53]],["vipboxtv",[14,53]],["vipleague",14],["watch-series",14],["watchseries",14],["xclusivejams",14],["xmoviesforyou",14],["youdbox",14],["ytmp3eu",14],["yts-subs",14],["yts",14],["zooqle",14],["dutchycorp",15],["dood",[23,53]],["doodstream",23],["dooood",[23,53]],["shrinke",26],["shrinkme",26],["mydverse",44],["123movies",53],["123moviesla",53],["123movieweb",53],["2embed",53],["720pstream",53],["9xmovies",53],["adshort",53],["allmovieshub",53],["asianplay",53],["atishmkv",53],["cricstream",53],["crictime",53],["databasegdriveplayer",53],["extramovies",53],["faselhd",53],["filemoon",53],["filmy",53],["filmyhit",53],["filmywap",53],["fmovies",53],["gdplayer",53],["gdriveplayer",53],["goku",53],["gomovies",53],["gowatchseries",53],["hindilinks4u",53],["hurawatch",53],["jalshamoviezhd",53],["livecricket",53],["mkvcinemas",53],["movies2watch",53],["moviespapa",53],["mp4moviez",53],["mydownloadtube",53],["nsw2u",53],["nuroflix",53],["o2tvseries",53],["o2tvseriesz",53],["pirlotv",53],["poscitech",53],["primewire",53],["serienstream",53],["sflix",53],["shahed4u",53],["shaheed4u",53],["speedostream",53],["sportcast",53],["sportskart",53],["streamingcommunity",53],["tamilarasan",53],["tamilfreemp3songs",53],["tamilprinthd",53],["torrentdosfilmes",53],["uploadrar",53],["uqload",53],["vidcloud9",53],["vido",53],["vidoo",53],["vudeo",53],["vumoo",53],["watchomovies",[53,61]],["yesmovies",53],["kickass",54],["cine-calidad",59],["actvid",93]]);

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
