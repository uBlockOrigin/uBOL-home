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

const scriptletGlobals = new Map(); // jshint ignore: line

const argsList = [["script","AdDefend"],["script","/getAdUnitPath|\\.then\\(eval\\)|DisplayAcceptableAdIfAdblocked|,eval\\)\\)\\)\\;|\\.join\\(\\'\\'\\)\\}\\;/"],["script","/==undefined.*body/"],["script","style"],["script","Promise"],["script","Number.isSafeInteger"],["script","/style:last-of-type|:empty|APKM\\..+?\\.innerHTML/"],["script","Reflect"],["script","document.write"],["script","self == top"],["script","/popunder|isAdBlock|admvn.src/i"],["script","deblocker"],["script","exdynsrv"],["script","AdsBlocked"],["script","/adb/i"],["script","adsbygoogle"],["script","FingerprintJS"],["script","/check_if_blocking|XMLHttpRequest|adkiller/"],["script","popundersPerIP"],["script","/document\\.createElement|\\.banner-in/"],["script","/block-adb|-0x|adblock/"],["script","ExoLoader"],["script","/?key.*open/","condition","key"],["script","adblock"],["script","homad"],["script","alert"],["script","/adblock|popunder/"],["script","fetch"],["script","googlesyndication"],["#text","AD:"],["script","queue.addFile"],["script","htmls"],["script","/\\/detected\\.html|Adblock/"],["script","toast"],["script","/window\\.open|window\\.location\\.href|document\\.addEventListener|\\$\\(document\\)\\.ready.*show/"],["script","AdbModel"],["script","antiAdBlockerHandler"],["script","onerror"],["script","AdBlock"],["script","window.open"],["script","Adblock"],["script","break;case $."],["style","text-decoration"],["script","push"],["script","clicky"],["script","charCodeAt"],["script","checkifscript"],["script","/h=decodeURIComponent|popundersPerIP/"],["script","popMagic"],["script","/popMagic|pop1stp/"],["script","popunder"],["script","/adblock|location\\.replace/"],["script","/downloadJSAtOnload|Object.prototype.toString.call/"],["script","numberPages"],["script","KCgpPT57bGV0IGU"],["script","/ConsoleBan|alert|AdBlocker/"],["script","AdBlocker"],["script","adb_detected"],["script","adb"],["script","await fetch"],["script","innerHTML"],["script","/'.adsbygoogle'|text-danger|warning|Adblock|_0x/"],["script","popUnder"],["#text","/スポンサーリンク|Sponsored Link|广告/"],["#text","スポンサーリンク"],["#text","スポンサードリンク"],["#text","/\\[vkExUnit_ad area=(after|before)\\]/"],["#text","【広告】"],["#text","【PR】"],["#text","関連動画"],["#text","PR:"],["script","leave_recommend"],["#text","/^Advertisement$/"],["script","zfgloaded"],["script","ai_adb"],["script","HTMLAllCollection"],["script","liedetector"],["script","popWin"],["script","end_click"],["script","ad blocker"],["script","closeAd"],["script","/modal|popupads/"],["script","/adconfig/i"],["script","AdblockDetector"],["script","is_antiblock_refresh"],["script","/userAgent|adb|htmls/"],["script","myModal"],["script","ad_block"],["script","app_checkext"],["script","shown_at"],["script","clientHeight"],["script","/url_key|adHtml/"],["script","pop.target"],["script","showadblock"],["script","axios"],["script","ad block"],["script","\"v4ac1eiZr0\""],["script","admiral"],["script","/charAt|XMLHttpRequest/"],["script","AdBlockEnabled"],["script","window.location.replace"],["script","/$.*open/"],["script","Brave"],["script","egoTab"],["script","abDetectorPro"],["script","/$.*(css|oncontextmenu)/"],["script","/eval.*RegExp/"],["script","wwads"],["script","/\\[\\'push\\'\\]/"],["script","/adblock/i"],["script","/$.*adUnits/"],["script","decodeURIComponent"],["script","RegExp"],["script","adbl"],["script","doOpen"],["script","adsBlocked"],["script","chkADB"],["script","AaDetector"],["script","Symbol.iterator"],["script","catch"],["script","/innerHTML.*appendChild/"],["script","Exo"],["script","detectAdBlock"],["script","popup"],["script","/window\\[\\'open\\'\\]/"],["script","Error"],["script","document.head.appendChild"],["script","Number"],["script","ad-block-activated"],["script","insertBefore"],["script","pop.doEvent"],["script","constructor"],["script","/adbl/i"],["script","detect"],["script","btnHtml"],["script","/Adblock|_0x/i"],["script","/join\\(\\'\\'\\)/"],["script","/join\\(\\\"\\\"\\)/"],["script","api.dataunlocker.com"],["script","error-report.com"],["script","vglnk"],["script","/RegExp\\(\\'/","condition","RegExp"],["script",";break;case $."],["script","AdblockRegixFinder"],["script","\"reload\""],["script","NREUM"]];

const hostnamesMap = new Map([["giga.de",0],["teltarif.de",1],["aupetitparieur.com",2],["allthingsvegas.com",2],["100percentfedup.com",2],["beforeitsnews.com",2],["concomber.com",2],["conservativebrief.com",2],["conservativefiringline.com",2],["dailylol.com",2],["funnyand.com",2],["letocard.fr",2],["mamieastuce.com",2],["meilleurpronostic.fr",2],["patriotnationpress.com",2],["toptenz.net",2],["vitamiiin.com",2],["writerscafe.org",2],["populist.press",2],["dailytruthreport.com",2],["livinggospeldaily.com",2],["first-names-meanings.com",2],["welovetrump.com",2],["thehayride.com",2],["thelibertydaily.com",2],["thepoke.co.uk",2],["thepolitistick.com",2],["theblacksphere.net",2],["shark-tank.com",2],["naturalblaze.com",2],["greatamericanrepublic.com",2],["dailysurge.com",2],["truthlion.com",2],["flagandcross.com",2],["westword.com",2],["republicbrief.com",2],["freedomfirstnetwork.com",2],["phoenixnewtimes.com",2],["designbump.com",2],["clashdaily.com",2],["madworldnews.com",2],["reviveusa.com",2],["sonsoflibertymedia.com",2],["thedesigninspiration.com",2],["videogamesblogger.com",2],["protrumpnews.com",2],["thepalmierireport.com",2],["kresy.pl",2],["thepatriotjournal.com",2],["gellerreport.com",2],["thegatewaypundit.com",2],["wltreport.com",2],["miaminewtimes.com",2],["politicalsignal.com",2],["rightwingnews.com",2],["bigleaguepolitics.com",2],["comicallyincorrect.com",2],["moviepilot.de",4],["apkmirror.com",[6,54]],["yts.mx",8],["upornia.com",10],["pinsystem.co.uk",11],["tinyppt.com",11],["downfile.site",11],["expertvn.com",11],["trangchu.news",11],["bharathwick.com",11],["descargaspcpro.net",11],["dx-tv.com",11],["learnmany.in",11],["loaninsurehub.com",11],["appkamods.com",11],["3dmodelshare.org",11],["nulleb.com",11],["reset-scans.us",11],["thecustomrom.com",11],["bingotingo.com",11],["ghior.com",11],["3dmili.com",11],["techacode.com",11],["karanpc.com",11],["plc247.com",11],["hiraethtranslation.com",11],["freepasses.org",11],["porninblack.com",11],["tomarnarede.pt",11],["basketballbuzz.ca",11],["dribbblegraphics.com",11],["kemiox.com",11],["checkersmenu.us",11],["teksnologi.com",11],["dollareuro.live",11],["next-episode.net",13],["eporner.com",14],["germancarforum.com",15],["sinvida.me",[16,47]],["streamnoads.com",[16,41,47]],["bowfile.com",16],["cloudvideo.tv",[16,41]],["coloredmanga.com",16],["embedstream.me",[16,41,47]],["exeo.app",16],["hiphopa.net",[16,47]],["megaup.net",16],["tv247.us",[16,47]],["uploadhaven.com",16],["userscloud.com",[16,41]],["searchenginereports.net",17],["mdfx9dc8n.net",[18,47]],["oko.sh",19],["bigbtc.win",20],["cryptofun.space",20],["sexo5k.com",21],["truyen-hentai.com",21],["theshedend.com",23],["rsadnetworkinfo.com",23],["rsinsuranceinfo.com",23],["rsfinanceinfo.com",23],["rsgamer.app",23],["rssoftwareinfo.com",23],["rshostinginfo.com",23],["rseducationinfo.com",23],["zeroupload.com",23],["streamvid.net",[23,47]],["securenetsystems.net",23],["miniwebtool.com",23],["bchtechnologies.com",23],["spiegel.de",24],["appnee.com",25],["d0o0d.com",26],["do0od.com",26],["doods.pro",26],["ds2play.com",26],["ds2video.com",26],["onlyfaucet.com",27],["claimclicks.com",27],["thebullspen.com",27],["iisfvirtual.in",28],["starxinvestor.com",28],["beatsnoop.com",28],["fetchpik.com",28],["hackerranksolution.in",28],["tech24us.com",29],["freethemesy.com",29],["webhostingpost.com",[30,41]],["tophostingapp.com",30],["digitalmarktrend.com",30],["btcbitco.in",31],["btcsatoshi.net",31],["cempakajaya.com",31],["crypto4yu.com",31],["gainl.ink",31],["manofadan.com",31],["readbitcoin.org",31],["wiour.com",31],["kienthucrangmieng.com",31],["coin-free.com",[31,47]],["tremamnon.com",31],["btc25.org",31],["tron-free.com",31],["bitsmagic.fun",31],["ourcoincash.xyz",31],["hynews.biz",31],["blog.cryptowidgets.net",32],["blog.insurancegold.in",32],["blog.wiki-topia.com",32],["carsmania.net",32],["carstopia.net",32],["coinsvalue.net",32],["cookinguide.net",32],["freeoseocheck.com",32],["makeupguide.net",32],["aylink.co",33],["suaurl.com",34],["sugarona.com",35],["nishankhatri.xyz",35],["highkeyfinance.com",35],["amanguides.com",35],["tinys.click",36],["answerpython.com",36],["gsm-solution.com",36],["h-donghua.com",36],["hindisubbedacademy.com",36],["pkgovjobz.com",36],["ripexbooster.xyz",36],["serial4.com",36],["serial412.blogspot.com",36],["sigmalinks.in",36],["tutorgaming.com",36],["appsbull.com",37],["diudemy.com",37],["maqal360.com",37],["mphealth.online",37],["makefreecallsonline.com",37],["androjungle.com",37],["bookszone.in",37],["drakescans.com",37],["shortix.co",37],["msonglyrics.com",37],["app-sorteos.com",37],["bokugents.com",37],["btvplus.bg",37],["coingraph.us",38],["hes-goals.io",38],["pkbiosfix.com",38],["casi3.xyz",38],["smutty.com",39],["down.dataaps.com",39],["filmweb.pl",39],["kiemlua.com",40],["123moviefree4u.com",41],["194.163.183.129",41],["6movies.net",41],["adsh.cc",41],["afilmyhouse.blogspot.com",41],["ak.sv",41],["animefenix.com",41],["animefrenzy.net",41],["animeshouse.info",41],["animesultra.com",41],["api.webs.moe",41],["apkmody.io",41],["atglinks.com",41],["attvideo.com",41],["avimobilemovies.net",41],["backfirstwo.site",[41,108]],["bdnewszh.com",[41,47]],["ccurl.net",[41,47]],["cinema.cimatna.com",41],["crazyblog.in",41],["dembed1.com",41],["dembed2.com",41],["divicast.com",41],["egynow.cam",41],["embed.meomeo.pw",41],["fanproj.net",41],["filebox.click",41],["filmeserialeonline.org",41],["filmesonlinexhd.biz",[41,47]],["filmovi.ws",[41,47]],["filmyzilla2021.xyz",41],["filmyzilla2022.com",41],["filmyzillafullmovie.waystohunt.info",41],["flexyhit.com",41],["footyhunter3.xyz",[41,47]],["foreverwallpapers.com",41],["french-streams.cc",41],["fslinks.org",41],["fstream365.com",41],["gameshdlive.xyz",[41,47]],["gdrivez.xyz",41],["hinatasoul.com",41],["hindimovies.to",[41,47]],["hitmovies4u.com",41],["hotstar.news",41],["hwnaturkya.com",[41,47]],["hxfile.co",[41,47]],["isaidub3.co",41],["lulustream.com",[41,47]],["luluvdo.com",[41,47]],["membed.net",41],["mgnetu.com",41],["moviesdanet.com",41],["moviewatch.com.pk",[41,47]],["moviewatchonline.com.pk",41],["mp3juice.info",41],["mp3juices.cc",41],["neomovies.net",41],["newsrade.com",41],["niaomea.me",[41,47]],["nolive.me",[41,47]],["nollyverse.com",41],["novelssites.com",[41,47]],["oii.io",41],["pepperlive.info",41],["playertv.net",41],["poscitesch.com",[41,47]],["putlocker68.com",41],["s.to",41],["sharkfish.xyz",41],["skidrowcodex.net",41],["sports-stream.site",41],["stream4free.live",41],["tamilmobilemovies.in",41],["tgo-tv.co",[41,47]],["thewatchseries.live",41],["tnmusic.in",41],["travelplanspro.com",41],["tusfiles.com",41],["unlimitmovies.com",41],["uploadflix.org",41],["vid-guard.com",41],["vidsaver.net",41],["vidspeeds.com",41],["viralitytoday.com",41],["voiranime.stream",41],["watchdoctorwhoonline.com",41],["webseriesclub.com",41],["ylink.bid",41],["ytix.xyz",41],["unblocked.id",43],["wouterplanet.com",44],["androidacy.com",45],["djxmaza.in",46],["miuiflash.com",46],["thecubexguide.com",46],["123movies4u.site",47],["1337xporn.com",47],["141jav.com",47],["1bit.space",47],["1bitspace.com",47],["38dh2.top",47],["3dporndude.com",47],["4archive.org",47],["4horlover.com",47],["560pmovie.com",47],["60fps.xyz",47],["85tube.com",47],["85videos.com",47],["8xlinks.click",47],["a2zcrackworld.com",47],["aazzz.xyz",47],["acefile.co",47],["actusports.eu",47],["adblockplustape.com",47],["adclickersbot.com",47],["adricami.com",47],["adslink.pw",47],["adultstvlive.com",47],["adz7short.space",47],["aeblender.com",47],["ahdafnews.blogspot.com",47],["ak47sports.com",47],["akuma.moe",47],["allplayer.tk",47],["allstreaming.online",47],["amadoras.cf",47],["amadorasdanet.shop",47],["amateurblog.tv",47],["androidadult.com",47],["anhsexjav.xyz",47],["anidl.org",47],["anime-loads.org",47],["animeblkom.net",47],["animefire.net",47],["animelek.me",47],["animeshouse.net",47],["animespire.net",47],["animestotais.xyz",47],["animeyt.es",47],["anroll.net",47],["anymoviess.xyz",47],["aotonline.org",47],["asenshu.com",47],["asialiveaction.com",47],["asianclipdedhd.net",47],["askim-bg.com",47],["asumsikedaishop.com",47],["avcrempie.com",47],["avseesee.com",47],["backfirstwo.com",47],["bajarjuegospcgratis.com",47],["balkanportal.net",47],["balkanteka.net",47],["belowporn.com",47],["bestclaimtrx.xyz",47],["bestgirlsexy.com",47],["bestnhl.com",47],["bestporn4free.com",47],["bestporncomix.com",47],["bet36.es",47],["bikinitryon.net",47],["birdurls.com",47],["bitsearch.to",47],["blackcockadventure.com",47],["blackcockchurch.org",47],["blackporncrazy.com",47],["blizzboygames.net",47],["blizzpaste.com",47],["blkom.com",47],["blog-peliculas.com",47],["blogtrabalhista.com",47],["blurayufr.xyz",47],["bobsvagene.club",47],["bolly4umovies.click",47],["bonusharian.pro",47],["brilian-news.id",47],["brupload.net",47],["bucitana.com",47],["cablegratis.online",47],["camchickscaps.com",47],["camgirlcum.com",47],["camgirls.casa",47],["cashurl.in",47],["castingx.net",47],["celebrity-leaks.net",47],["cgpelis.net",47],["charexempire.com",47],["clasico.tv",47],["clik.pw",47],["coins100s.fun",47],["comicsmanics.com",47],["compucalitv.com",47],["coolcast2.com",47],["cosplaytab.com",47],["countylocalnews.com",47],["cpmlink.net",47],["crackstreamshd.click",47],["crespomods.com",47],["crisanimex.com",47],["crunchyscan.fr",47],["cuevana3.fan",47],["cuevana3hd.com",47],["cumception.com",47],["curvaweb.com",47],["cutpaid.com",47],["datawav.club",47],["daughtertraining.com",47],["deepgoretube.site",47],["deltabit.co",47],["depvailon.com",47],["derleta.com",47],["desivdo.com",47],["desixx.net",47],["detikkebumen.com",47],["deutschepornos.me",47],["diasoft.xyz",47],["directupload.net",47],["diskusscan.com",47],["dixva.com",47],["dlhd.sx",47],["doctormalay.com",47],["dofusports.xyz",47],["dogemate.com",47],["doods.cam",47],["doodskin.lat",47],["downloadrips.com",47],["downvod.com",47],["dphunters.mom",47],["dragontranslation.com",47],["duddes.xyz",47],["dvdfullestrenos.com",47],["ebookbb.com",47],["ebookhunter.net",47],["egyanime.com",47],["egygost.com",47],["egyshare.cc",47],["ekasiwap.com",47],["electro-torrent.pl",47],["elil.cc",47],["embed4u.xyz",47],["eplayer.click",47],["erovoice.us",47],["eroxxx.us",47],["estrenosdoramas.net",47],["everia.club",47],["everythinginherenet.blogspot.com",47],["extrafreetv.com",47],["extremotvplay.com",47],["eyeshot.live",47],["fapinporn.com",47],["fapptime.com",47],["fashionblog.tv",47],["fastreams.live",47],["faucethero.com",47],["fembed.com",47],["femdom-joi.com",47],["fileone.tv",47],["film1k.com",47],["filmeonline2023.net",47],["filmesonlinex.org",47],["filmovitica.com",47],["filmymaza.blogspot.com",47],["filthy.family",47],["fixfinder.click",47],["flostreams.xyz",47],["flyfaucet.com",47],["footyhunter.lol",47],["forex-golds.com",47],["forex-trnd.com",47],["forumchat.club",47],["forumlovers.club",47],["freemoviesonline.biz",47],["freeomovie.co.in",47],["freeomovie.to",47],["freeporncomic.net",47],["freepornhdonlinegay.com",47],["freeproxy.io",47],["freeuse.me",47],["freeusexporn.com",47],["fsicomics.com",47],["gambarbogel.xyz",47],["gamepcfull.com",47],["gameronix.com",47],["gamesfullx.com",47],["gameshdlive.net",47],["gamesmountain.com",47],["gamesrepacks.com",47],["gamingguru.fr",47],["gamovideo.com",47],["garota.cf",47],["gaydelicious.com",47],["gaypornmasters.com",47],["gaysex69.net",47],["gemstreams.com",47],["get-to.link",47],["girlscanner.org",47],["giurgiuveanul.ro",47],["gledajcrtace.xyz",47],["gocast2.com",47],["gomo.to",47],["gostosa.cf",47],["gtlink.co",47],["gwiazdypornosow.pl",47],["haho.moe",47],["hatsukimanga.com",47],["hayhd.net",47],["hdsaprevodom.com",47],["hdstreamss.club",47],["hentais.tube",47],["hentaistream.co",47],["hentaitk.net",47],["hentaitube.online",47],["hentaiworld.tv",47],["hesgoal.tv",47],["hexupload.net",47],["hhkungfu.tv",47],["highlanderhelp.com",47],["hindimean.com",47],["hiperdex.com",47],["hispasexy.org",47],["hitomi.la",47],["hitprn.com",47],["hoca4u.com",47],["hollymoviehd.cc",47],["hoodsite.com",47],["hopepaste.download",47],["hornylips.com",47],["hotgranny.live",47],["hotmama.live",47],["hqcelebcorner.net",47],["huren.best",47],["igfap.com",47],["ihdstreams.xyz",47],["iklandb.com",47],["illink.net",47],["imgkings.com",47],["imgsex.xyz",47],["imx.to",47],["influencersgonewild.org",47],["infosgj.free.fr",47],["investnewsbrazil.com",47],["itdmusics.com",47],["itopmusic.org",47],["itsuseful.site",47],["itunesfre.com",47],["iwatchfriendsonline.net",[47,76]],["iwatchtheoffice.com",47],["jackstreams.com",47],["jatimupdate24.com",47],["javcl.com",47],["javf.net",47],["javhay.net",47],["javhoho.com",47],["javhun.com",47],["javleak.com",47],["javporn.best",47],["javsex.to",47],["javtiful.com",47],["jimdofree.com",47],["jiofiles.org",47],["jorpetz.com",47],["journalyc.online",47],["jp-films.com",47],["jpop80ss3.blogspot.com",47],["jpopsingles.eu",47],["kantotflix.net",47],["kantotinyo.com",47],["kaoskrew.org",47],["kaplog.com",47],["keralatvbox.com",47],["kimochi.info",47],["kimochi.tv",47],["kinemania.tv",47],["konstantinova.net",47],["koora-online.live",47],["kunmanga.com",47],["kutmoney.com",47],["kwithsub.com",47],["ladangreceh.xyz",47],["lat69.me",47],["latinblog.tv",47],["latinomegahd.net",47],["lazyfaucet.com",47],["leechpremium.link",47],["legendas.dev",47],["legendei.net",47],["lightdlmovies.blogspot.com",47],["lighterlegend.com",47],["linclik.com",47],["linkebr.com",47],["linkrex.net",47],["links.worldfree4u-lol.online",47],["linksfy.co",47],["lody.ink",47],["lovesomecommunity.com",47],["luzcameraeacao.shop",47],["manga-oni.com",47],["mangaboat.com",47],["mangagenki.me",47],["mangahere.onl",47],["mangaweb.xyz",47],["mangoporn.net",47],["manhwahentai.me",47],["masahub.com",47],["masahub.net",47],["maturegrannyfuck.com",47],["mdy48tn97.com",47],["mediapemersatubangsa.com",47],["mega-mkv.com",47],["megapastes.com",47],["megapornpics.com",47],["messitv.net",47],["meusanimes.net",47],["milfmoza.com",47],["milfzr.com",47],["millionscast.com",47],["mimaletamusical.blogspot.com",47],["mitly.us",47],["mkv-pastes.com",47],["modb.xyz",47],["monaskuliner.ac.id",47],["moredesi.com",47],["movgotv.net",47],["movi.pk",47],["movieswbb.com",47],["mp4upload.com",47],["mrskin.live",47],["multicanaistv.com",47],["mundowuxia.com",47],["myeasymusic.ir",47],["myonvideo.com",47],["myyouporn.com",47],["narutoget.info",47],["naughtypiss.com",47],["nerdiess.com",47],["new-fs.eu",47],["newtorrentgame.com",47],["nflstreams.me",47],["nicekkk.com",47],["nicesss.com",47],["nopay.info",47],["nopay2.info",[47,117]],["notformembersonly.com",47],["novamovie.net",47],["novelpdf.xyz",47],["novelup.top",47],["nsfwr34.com",47],["nu6i-bg-net.com",47],["nudebabesin3d.com",47],["nukedfans.com",47],["nuoga.eu",47],["nzbstars.com",47],["ohjav.com",47],["ojearnovelas.com",47],["okanime.xyz",47],["olarixas.xyz",47],["oldbox.cloud",47],["olweb.tv",47],["olympicstreams.me",47],["on9.stream",47],["oncast.xyz",47],["onepiece-mangaonline.com",47],["onifile.com",47],["onionstream.live",47],["onlinesaprevodom.net",47],["onlyfullporn.video",47],["onplustv.live",47],["originporn.com",47],["ovagames.com",47],["ovamusic.com",47],["owllink.net",47],["packsporn.com",47],["pahaplayers.click",47],["palimas.org",47],["pandafiles.com",47],["papahd.club",47],["papahd1.xyz",47],["password69.com",47],["paste3.org",47],["pastemytxt.com",47],["payskip.org",47],["peeplink.in",47],["peliculasmx.net",47],["pervertgirlsvideos.com",47],["pervyvideos.com",47],["phim12h.com",47],["picdollar.com",47],["pickteenz.com",47],["pics4you.net",47],["picsxxxporn.com",47],["pinayscandalz.com",47],["pinkueiga.net",47],["piratefast.xyz",47],["piratehaven.xyz",47],["pirateiro.com",47],["pirlotvonline.org",47],["playtube.co.za",47],["plugintorrent.com",47],["pmvzone.com",47],["porndish.com",47],["pornez.net",47],["pornfetishbdsm.com",47],["pornfits.com",47],["pornhd720p.com",47],["pornobr.club",47],["pornobr.ninja",47],["pornodominicano.net",47],["pornofaps.com",47],["pornoflux.com",47],["pornotorrent.com.br",47],["pornredit.com",47],["pornstarsyfamosas.es",47],["pornstreams.co",47],["porntn.com",47],["pornxbit.com",47],["pornxday.com",47],["portaldasnovinhas.shop",47],["portugues-fcr.blogspot.com",47],["poscishd.online",47],["poseyoung.com",47],["pover.org",47],["proxyninja.org",47],["pubfilmz.com",47],["publicsexamateurs.com",47],["punanihub.com",47],["putlocker5movies.org",47],["pxxbay.com",47],["r18.best",47],["ragnaru.net",47],["rapbeh.net",47],["rapelust.com",47],["rapload.org",47],["read-onepiece.net",47],["retro-fucking.com",47],["retrotv.org",47],["robaldowns.com",47],["rockdilla.com",47],["rojadirectatvenvivo.com",47],["rojitadirecta.blogspot.com",47],["romancetv.site",47],["rule34.club",47],["rule34hentai.net",47],["rumahbokep-id.com",47],["safego.cc",47],["sakurafile.com",47],["satoshi-win.xyz",47],["scat.gold",47],["scatfap.com",47],["scatkings.com",47],["scnlog.me",47],["scripts-webmasters.net",47],["serie-turche.com",47],["serijefilmovi.com",47],["sexcomics.me",47],["sexdicted.com",47],["sexgay18.com",47],["sexofilm.co",47],["sextgem.com",47],["sextubebbw.com",47],["sgpics.net",47],["shadowrangers.live",47],["shahee4u.cam",47],["shahiid-anime.net",47],["shemale6.com",47],["shinden.pl",47],["short.es",47],["showmanga.blog.fc2.com",47],["shrt10.com",47],["shurt.pw",47],["sideplusleaks.net",47],["silverblog.tv",47],["silverpic.com",47],["sinhalasub.life",47],["sinsitio.site",47],["skidrowcpy.com",47],["skidrowfull.com",47],["skidrowreloaded.com",47],["slut.mom",47],["smallencode.me",47],["smoner.com",47],["smplace.com",47],["soccerinhd.com",47],["socceron.name",47],["softairbay.com",47],["sokobj.com",47],["songsio.com",47],["souexatasmais.com",47],["sportbar.live",47],["sportea.online",47],["sportskart.xyz",47],["sportstream1.cfd",47],["srt.am",47],["srts.me",47],["stakes100.xyz",47],["stbemuiptv.com",47],["stockingfetishvideo.com",47],["stream.lc",47],["stream25.xyz",47],["streambee.to",47],["streamcenter.pro",47],["streamers.watch",47],["streamgo.to",47],["streamkiste.tv",47],["streamoporn.xyz",47],["streamoupload.xyz",47],["streamservicehd.click",47],["subtitleporn.com",47],["subtitles.cam",47],["suicidepics.com",47],["supertelevisionhd.com",47],["supexfeeds.com",47],["swzz.xyz",47],["sxnaar.com",47],["tabooporns.com",47],["taboosex.club",47],["tapeantiads.com",47],["tapeblocker.com",47],["tapenoads.com",47],["tapewithadblock.org",[47,141]],["teamos.xyz",47],["teen-wave.com",47],["teenporncrazy.com",47],["telegramgroups.xyz",47],["telenovelasweb.com",47],["tensei-shitara-slime-datta-ken.com",47],["tfp.is",47],["thaihotmodels.com",47],["theblueclit.com",47],["thebussybandit.com",47],["theicongenerator.com",47],["thelastdisaster.vip",47],["thepiratebay0.org",47],["thepiratebay10.info",47],["thesexcloud.com",47],["thothub.today",47],["tightsexteens.com",47],["tojav.net",47],["tokyoblog.tv",47],["tonnestreamz.xyz",47],["top16.net",47],["topvideosgay.com",47],["torrage.info",47],["torrents.vip",47],["torrsexvid.com",47],["tpb-proxy.xyz",47],["trannyteca.com",47],["trendytalker.com",47],["tumanga.net",47],["turbogvideos.com",47],["turbovid.me",47],["turkishseriestv.org",47],["turksub24.net",47],["tutele.sx",47],["tutelehd3.xyz",47],["tvglobe.me",47],["tvpclive.com",47],["tvs-widget.com",47],["tvseries.video",47],["ucptt.com",47],["ufaucet.online",47],["ufcfight.online",47],["uhdgames.xyz",47],["ultrahorny.com",47],["ultraten.net",47],["unblockweb.me",47],["underhentai.net",47],["uniqueten.net",47],["upbaam.com",47],["upstream.to",47],["valeriabelen.com",47],["verdragonball.online",47],["vfxmed.com",47],["video.az",47],["videostreaming.rocks",47],["videowood.tv",47],["vidorg.net",47],["vidtapes.com",47],["vidz7.com",47],["vikistream.com",47],["vikv.net",47],["virpe.cc",47],["visifilmai.org",47],["viveseries.com",47],["vladrustov.sx",47],["volokit2.com",47],["vstorrent.org",47],["vstplugs.com",47],["w-hentai.com",47],["watchaccordingtojimonline.com",47],["watchbrooklynnine-nine.com",47],["watchdowntonabbeyonline.com",47],["watchelementaryonline.com",47],["watcheronline.net",47],["watchgleeonline.com",47],["watchjavidol.com",47],["watchkobestreams.info",47],["watchlostonline.net",47],["watchlouieonline.com",47],["watchmonkonline.com",47],["watchparksandrecreation.net",47],["watchprettylittleliarsonline.com",47],["watchrulesofengagementonline.com",47],["watchthekingofqueens.com",47],["watchthemiddleonline.com",47],["watchtvchh.xyz",47],["webcamrips.com",47],["wickedspot.org",47],["wincest.xyz",47],["witanime.best",47],["wolverdonx.com",47],["wordcounter.icu",47],["worldcupstream.pm",47],["worldmovies.store",47],["worldstreams.click",47],["wpdeployit.com",47],["wqstreams.tk",47],["wwwsct.com",47],["xanimeporn.com",47],["xblog.tv",47],["xn--verseriesespaollatino-obc.online",47],["xn--xvideos-espaol-1nb.com",47],["xpornium.net",47],["xsober.com",47],["xvip.lat",47],["xxgasm.com",47],["xxvideoss.org",47],["xxx18.uno",47],["xxxdominicana.com",47],["xxxfree.watch",47],["xxxmax.net",47],["xxxwebdlxxx.top",47],["xxxxvideo.uno",47],["y2b.wiki",47],["yabai.si",47],["yadixv.com",47],["yayanimes.net",47],["yeshd.net",47],["yodbox.com",47],["youjax.com",47],["youpits.xyz",47],["yourdailypornvideos.ws",47],["yourupload.com",47],["ytstv.me",47],["ytstvmovies.co",47],["ytstvmovies.xyz",47],["ytsyify.co",47],["ytsyifymovie.com",47],["zerion.cc",47],["zerocoin.top",47],["zitss.xyz",47],["zpaste.net",47],["zplayer.live",47],["veryfreeporn.com",48],["besthdgayporn.com",49],["freeroms.com",50],["soap2day-online.com",50],["austiblox.net",51],["btcbunch.com",52],["teachoo.com",53],["genshinlab.com",54],["fourfourtwo.co.kr",54],["interfootball.co.kr",54],["a-ha.io",54],["cboard.net",54],["mobilitytv.co.kr",54],["mememedia.co.kr",54],["newautopost.co.kr",54],["tvreport.co.kr",54],["tenbizt.com",54],["jjang0u.com",54],["joongdo.co.kr",54],["viva100.com",54],["thephoblographer.com",54],["newdaily.co.kr",54],["dogdrip.net",54],["golf-live.at",54],["gamingdeputy.com",54],["thesaurus.net",54],["tweaksforgeeks.com",54],["alle-tests.nl",54],["dotkeypress.kr",54],["viewcash.co.kr",54],["tripplus.co.kr",54],["enterdiary.com",54],["mtodayauto.com",54],["hotplacehunter.co.kr",54],["mystylezip.com",54],["majorgeeks.com",54],["poro.gg",54],["maple.gg",54],["lolchess.gg",54],["dak.gg",54],["meconomynews.com",54],["brandbrief.co.kr",54],["dfast.kr",54],["youtu.co",54],["mlbpark.donga.com",54],["capress.kr",54],["carandmore.co.kr",54],["maxmovie.kr",54],["motorgraph.com",54],["newsbell.co.kr",54],["tminews.co.kr",54],["thehousemagazine.kr",54],["hardreset.info",54],["metabattle.com",54],["maketecheasier.com",54],["topsporter.net",55],["sportshub.to",55],["7xm.xyz",56],["fastupload.io",56],["azmath.info",56],["tii.la",57],["easymc.io",58],["yunjiema.top",58],["hacoos.com",59],["bondagevalley.cc",60],["zefoy.com",61],["vidello.net",62],["resizer.myct.jp",63],["gametohkenranbu.sakuraweb.com",64],["jisakuhibi.jp",65],["rank1-media.com",65],["lifematome.blog",66],["fm.sekkaku.net",67],["free-avx.jp",68],["dvdrev.com",69],["betweenjpandkr.blog",70],["nft-media.net",71],["ghacks.net",72],["songspk2.info",73],["truyentranhfull.net",74],["nectareousoverelate.com",77],["khoaiphim.com",78],["haafedk2.com",79],["fordownloader.com",79],["jovemnerd.com.br",80],["nicomanga.com",81],["totalcsgo.com",82],["vivamax.asia",83],["manysex.com",84],["gaminginfos.com",85],["tinxahoivn.com",86],["forums-fastunlock.com",87],["automoto.it",88],["sekaikomik.bio",89],["codelivly.com",90],["ophim.vip",91],["touguatize.monster",92],["client.falixnodes.net",93],["novelhall.com",94],["hes-goal.net",95],["al.com",96],["allmovie.com",96],["allmusic.com",96],["androidpolice.com",96],["antyradio.pl",96],["artnews.com",96],["carmagazine.co.uk",96],["cattime.com",96],["cbr.com",96],["cbssports.com",96],["chaptercheats.com",96],["cleveland.com",96],["collider.com",96],["comingsoon.net",96],["dailyvoice.com",96],["decider.com",96],["didyouknowfacts.com",96],["dogtime.com",96],["dualshockers.com",96],["footwearnews.com",96],["freeconvert.com",96],["gamerant.com",96],["gfinityesports.com",96],["givemesport.com",96],["gulflive.com",96],["howtogeek.com",96],["insider-gaming.com",96],["insurancejournal.com",96],["lehighvalleylive.com",96],["liveandletsfly.com",96],["lonestarlive.com",96],["makeuseof.com",96],["mardomreport.net",96],["masslive.com",96],["milestomemories.com",96],["mlive.com",96],["momtastic.com",96],["movieweb.com",96],["musicfeeds.com.au",96],["nationalreview.com",96],["nj.com",96],["nordot.app",96],["nypost.com",96],["oakvillenews.org",96],["observer.com",96],["oregonlive.com",96],["pagesix.com",96],["pennlive.com",96],["qtoptens.com",96],["realgm.com",96],["robbreport.com",96],["sandrarose.com",96],["screenrant.com",96],["sheknows.com",96],["sherdog.com",96],["sidereel.com",96],["silive.com",96],["simpleflying.com",96],["spacenews.com",96],["superherohype.com",96],["syracuse.com",96],["thefashionspot.com",96],["thegamer.com",96],["thegamescabin.com",96],["timesnews.net",96],["tutsnode.org",96],["tvline.com",96],["wimp.com",96],["xda-developers.com",96],["cheatsheet.com",97],["pwinsider.com",97],["bagi.co.in",98],["keran.co",98],["biblestudytools.com",99],["christianheadlines.com",99],["ibelieve.com",99],["kuponigo.com",100],["kimcilonly.site",101],["kimcilonly.link",101],["cryptoearns.com",102],["inxxx.com",103],["ipaspot.app",104],["embedwish.com",105],["filelions.live",105],["leakslove.net",105],["jenismac.com",106],["vxetable.cn",107],["jewelavid.com",108],["nizarstream.com",108],["snapwordz.com",109],["toolxox.com",109],["rl6mans.com",109],["idol69.net",109],["plumbersforums.net",110],["123movies800.online",111],["gulio.site",112],["mediaset.es",113],["izlekolik.net",114],["donghuaworld.com",115],["letsdopuzzles.com",116],["tainio-mania.online",117],["rediff.com",118],["iconicblogger.com",119],["dzapk.com",120],["darknessporn.com",121],["familyporner.com",121],["freepublicporn.com",121],["pisshamster.com",121],["punishworld.com",121],["xanimu.com",121],["pig69.com",122],["cosplay18.pics",122],["javhdo.net",123],["eroticmoviesonline.me",124],["teleclub.xyz",125],["ecamrips.com",126],["showcamrips.com",126],["9animetv.to",127],["jornadaperfecta.com",128],["loseart.com",129],["sousou-no-frieren.com",130],["veev.to",131],["intro-hd.net",132],["monacomatin.mc",132],["nodo313.net",132],["unite-guide.com",133],["appimagehub.com",134],["gnome-look.org",134],["store.kde.org",134],["linux-apps.com",134],["opendesktop.org",134],["pling.com",134],["xfce-look.org",134],["ytlarge.com",135],["botcomics.com",136],["cefirates.com",136],["chandlerorchards.com",136],["comicleaks.com",136],["marketdata.app",136],["monumentmetals.com",136],["tapmyback.com",136],["ping.gg",136],["revistaferramental.com.br",136],["hawpar.com",136],["alpacafinance.org",[136,137]],["nookgaming.com",136],["enkeleksamen.no",136],["kvest.ee",136],["creatordrop.com",136],["panpots.com",136],["cybernetman.com",136],["bitdomain.biz",136],["gerardbosch.xyz",136],["fort-shop.kiev.ua",136],["accuretawealth.com",136],["resourceya.com",136],["tracktheta.com",136],["tt.live",137],["future-fortune.com",137],["abhijith.page",137],["madrigalmaps.com",137],["adventuretix.com",137],["panprices.com",138],["intercity.technology",138],["freelancer.taxmachine.be",138],["adria.gg",138],["fjlaboratories.com",138],["issuya.com",139],["proboards.com",140],["winclassic.net",140],["infinityscans.xyz",142],["infinityscans.net",142],["bitcotasks.com",143],["perchance.org",144],["abema.tv",145]]);

const entitiesMap = new Map([["1337x",[3,47]],["kimcartoon",5],["pahe",[7,47]],["soap2day",7],["hqq",9],["waaw",9],["teluguflix",11],["pixhost",12],["viprow",[16,41,47]],["cloudvideotv",[16,41]],["vidsrc",[16,41]],["beinmatch",[22,47]],["dood",[26,41]],["doodstream",26],["dooood",[26,41]],["mydverse",36],["poplinks",37],["shrinke",39],["shrinkme",39],["123movies",41],["123moviesla",41],["123movieweb",41],["2embed",41],["4hiidude",41],["720pstream",41],["9xmovies",41],["aagmaal",[41,47]],["adshort",41],["allmovieshub",41],["asianplay",41],["atishmkv",41],["atomixhq",[41,47]],["crackstreams",[41,47]],["cricstream",41],["crictime",41],["daddylive",[41,47]],["daddylivehd",[41,47]],["databasegdriveplayer",41],["dloader",41],["dvdplay",[41,47]],["easylinks",41],["extralinks",41],["extramovies",41],["faselhd",41],["filemoon",41],["filmy",41],["filmyhit",41],["filmywap",41],["filmyzilla",[41,47]],["fmovies",41],["fsapi",41],["gdplayer",41],["gdriveplayer",41],["goload",41],["gomoviefree",41],["gomovies",41],["gowatchseries",41],["hdmoviesfair",[41,47]],["hdmoviz",41],["hindilinks4u",41],["hurawatch",41],["isaidub",41],["isaidubhd",41],["jalshamoviezhd",41],["jiorockers",41],["linkshub",41],["linksme",41],["livecricket",41],["madrasdub",41],["mkvcinemas",41],["mobilemovies",41],["movies2watch",41],["moviesda1",41],["moviesmeta",[41,47]],["moviespapa",41],["mp4moviez",41],["mydownloadtube",41],["nsw2u",41],["nuroflix",41],["o2tvseries",41],["o2tvseriesz",41],["pctfenix",[41,47]],["pctnew",[41,47]],["pirlotv",41],["poscitech",41],["primewire",41],["serienstream",41],["sflix",41],["shahed4u",41],["shaheed4u",41],["speedostream",41],["sportcast",41],["sportskart",41],["streamadblocker",[41,47]],["streamingcommunity",41],["tamilarasan",41],["tamilfreemp3songs",41],["tamilprinthd",41],["torrentdosfilmes",41],["uploadrar",41],["uqload",41],["vidcloud9",41],["vido",41],["vidoo",41],["vipbox",[41,47]],["vipboxtv",[41,47]],["vudeo",41],["vumoo",41],["watchomovies",[41,50]],["yesmovies",41],["kickass",42],["123-movies",47],["123movieshd",47],["123movieshub",47],["123moviesme",47],["1stream",47],["1tamilmv",47],["2ddl",47],["2umovies",47],["3hiidude",47],["4stream",47],["5movies",47],["7hitmovies",47],["9xmovie",47],["adblockeronstape",47],["adblockeronstreamtape",47],["adblockstreamtape",47],["adblockstrtape",47],["adblockstrtech",47],["adblocktape",47],["adcorto",47],["alexsports",47],["alexsportss",47],["alexsportz",47],["animepahe",47],["animesanka",47],["animixplay",47],["aniplay",47],["antiadtape",47],["asianclub",47],["ask4movie",47],["atomohd",47],["bhaai",47],["buffstreams",47],["canalesportivo",47],["clickndownload",47],["clicknupload",47],["desiremovies",47],["devlib",47],["divxtotal",47],["divxtotal1",47],["elixx",47],["enjoy4k",47],["estrenosflix",47],["estrenosflux",47],["estrenosgo",47],["f1stream",47],["fbstream",47],["file4go",47],["findav",47],["findporn",47],["flixmaza",47],["flizmovies",47],["freetvsports",47],["fullymaza",47],["g3g",47],["gotxx",47],["grantorrent",47],["hdmoviesflix",47],["hiidudemoviez",47],["imgsen",47],["imgsto",47],["incest",47],["incestflix",47],["javmost",47],["keeplinks",47],["keepvid",47],["keralahd",47],["khatrimazaful",47],["khatrimazafull",47],["leechall",47],["linkshorts",47],["mangovideo",47],["masaporn",47],["miniurl",47],["mirrorace",47],["mixdroop",47],["mixdrop",47],["mkvcage",47],["mlbstream",47],["mlsbd",47],["mmsbee",47],["motogpstream",47],["movieplex",47],["movierulzlink",47],["movies123",47],["moviesflix",47],["moviessources",47],["moviesverse",47],["moviezwaphd",47],["mrunblock",47],["nbastream",47],["newmovierulz",47],["nflstream",47],["nhlstream",47],["noblocktape",47],["nocensor",47],["onlyfams",47],["ouo",47],["peliculas24",47],["pelisplus",47],["piratebay",47],["plyjam",47],["plylive",47],["plyvdo",47],["pornhoarder",47],["prbay",47],["projectfreetv",47],["proxybit",47],["psarips",47],["racaty",47],["remaxhd",47],["rintor",47],["rnbxclusive",47],["rnbxclusive0",47],["rnbxclusive1",47],["rojadirecta",47],["rojadirectaenvivo",47],["rugbystreams",47],["safetxt",47],["shadowrangers",47],["shahi4u",47],["shahid4u1",47],["shahid4uu",47],["shavetape",47],["shortearn",47],["shorten",47],["shorttey",47],["shortzzy",47],["skymovieshd",47],["socceronline",47],["softarchive",47],["sports-stream",47],["sshhaa",47],["stapadblockuser",47],["stape",47],["stapewithadblock",47],["starmusiq",47],["strcloud",47],["streamadblockplus",47],["streamcdn",47],["streamhub",47],["streamsport",47],["streamta",47],["streamtape",47],["streamtapeadblockuser",47],["strikeout",47],["strtape",47],["strtapeadblock",47],["strtapeadblocker",47],["strtapewithadblock",47],["strtpe",47],["swatchseries",47],["tabooflix",47],["tennisstreams",47],["themoviesflix",47],["thepiratebay",47],["thisav",47],["tmearn",47],["toonanime",47],["torlock",47],["tormalayalam",47],["torrentz2eu",47],["tutelehd",47],["tvply",47],["u4m",47],["ufcstream",47],["unblocknow",47],["uploadbuzz",47],["usagoals",47],["vexmoviex",47],["vidclouds",47],["vidlox",47],["vipleague",47],["watch-series",47],["watchseries",47],["xclusivejams",47],["xmoviesforyou",47],["youdbox",47],["ytmp3eu",47],["yts-subs",47],["yts",47],["zooqle",47],["cine-calidad",48],["actvid",75]]);

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
    const reNodeName = safe.patternToRegex(nodeName, 'i', true);
    const rePattern = safe.patternToRegex(pattern, 'gms');
    const extraArgs = safe.getExtraArgs(Array.from(arguments), 3);
    const shouldLog = scriptletGlobals.has('canDebug') && extraArgs.log || 0;
    const reCondition = safe.patternToRegex(extraArgs.condition || '', 'ms');
    const stop = (takeRecord = true) => {
        if ( takeRecord ) {
            handleMutations(observer.takeRecords());
        }
        observer.disconnect();
        if ( shouldLog !== 0 ) {
            safe.uboLog(`replace-node-text-core.fn: quitting "${pattern}" => "${replacement}"`);
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
        if ( shouldLog !== 0 ) {
            safe.uboLog('replace-node-text.fn before:\n', before);
            safe.uboLog('replace-node-text.fn after:\n', after);
        }
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
        if ( shouldLog !== 0 ) {
            safe.uboLog(`replace-node-text-core.fn ${count} nodes present before installing mutation observer`);
        }
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
                    re: new this.RegExp(
                        match[1],
                        match[2] || options.flags
                    ),
                    expect,
                };
            }
            if ( options.flags !== undefined ) {
                return {
                    re: new this.RegExp(pattern.replace(
                        /[.*+?^${}()|[\]\\]/g, '\\$&'),
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
            return this.Object_fromEntries(entries);
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
