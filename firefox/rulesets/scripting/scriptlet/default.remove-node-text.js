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

const argsList = [["script","AdDefend"],["script","/getAdUnitPath|\\.then\\(eval\\)|DisplayAcceptableAdIfAdblocked|,eval\\)\\)\\)\\;|\\.join\\(\\'\\'\\)\\}\\;/"],["script","/==undefined.*body/"],["script","style"],["script","Promise"],["script","Number.isSafeInteger"],["script","/style:last-of-type|:empty|APKM\\..+?\\.innerHTML/"],["script","Reflect"],["script","document.write"],["script","self == top"],["script","/popunder|isAdBlock|admvn.src/i"],["script","deblocker"],["script","exdynsrv"],["script","/adb/i"],["script","FingerprintJS"],["script","/check_if_blocking|XMLHttpRequest|adkiller/"],["script","popundersPerIP"],["script","/document\\.createElement|\\.banner-in/"],["script","/block-adb|-0x|adblock/"],["script","ExoLoader"],["script","/?key.*open/","condition","key"],["script","adblock"],["script","homad"],["script","alert"],["script","/adblock|popunder/"],["script","googlesyndication"],["#text","AD:"],["script","queue.addFile"],["script","htmls"],["script","toast"],["script","/window\\.open|window\\.location\\.href|document\\.addEventListener|\\$\\(document\\)\\.ready.*show/"],["script","AdbModel"],["script","antiAdBlockerHandler"],["script","onerror"],["script","AdBlock"],["script","window.open"],["script","Adblock"],["script","break;case $."],["style","text-decoration"],["script","push"],["script","clicky"],["script","charCodeAt"],["script","checkifscript"],["script","/h=decodeURIComponent|popundersPerIP/"],["script","popMagic"],["script","/popMagic|pop1stp/"],["script","popunder"],["script","/adblock|location\\.replace/"],["script","/downloadJSAtOnload|Object.prototype.toString.call/"],["script","numberPages"],["script","KCgpPT57bGV0IGU"],["script","/ConsoleBan|alert|AdBlocker/"],["script","AdBlocker"],["script","fetch"],["script","adb_detected"],["script","adb"],["script","await fetch"],["script","innerHTML"],["script","/'.adsbygoogle'|text-danger|warning|Adblock|_0x/"],["script","popUnder"],["#text","/スポンサーリンク|Sponsored Link|广告/"],["#text","スポンサーリンク"],["#text","スポンサードリンク"],["#text","/\\[vkExUnit_ad area=(after|before)\\]/"],["#text","【広告】"],["#text","【PR】"],["#text","関連動画"],["#text","PR:"],["script","leave_recommend"],["#text","/^Advertisement$/"],["script","zfgloaded"],["script","ai_adb"],["script","HTMLAllCollection"],["script","liedetector"],["script","popWin"],["script","end_click"],["script","ad blocker"],["script","closeAd"],["script","/modal|popupads/"],["script","/adconfig/i"],["script","AdblockDetector"],["script","is_antiblock_refresh"],["script","/userAgent|adb|htmls/"],["script","myModal"],["script","ad_block"],["script","app_checkext"],["script","shown_at"],["script","clientHeight"],["script","/url_key|adHtml/"],["script","pop.target"],["script","showadblock"],["script","axios"],["script","ad block"],["script","/typeof [a-z]\\.cmd\\.unshift/","condition","cmd.unshift"],["script","admiral"],["script","/charAt|XMLHttpRequest/"],["script","AdBlockEnabled"],["script","window.location.replace"],["script","/$.*open/"],["script","Brave"],["script","egoTab"],["script","abDetectorPro"],["script","/$.*(css|oncontextmenu)/"],["script","/eval.*RegExp/"],["script","wwads"],["script","/\\[\\'push\\'\\]/"],["script","/adblock/i"],["script","/$.*adUnits/"],["script","decodeURIComponent"],["script","RegExp"],["script","adbl"],["script","doOpen"],["script","adsBlocked"],["script","chkADB"],["script","AaDetector"],["script","Symbol.iterator"],["script","catch"],["script","/innerHTML.*appendChild/"],["script","Exo"],["script","detectAdBlock"],["script","popup"],["script","/window\\[\\'open\\'\\]/"],["script","Error"],["script","document.head.appendChild"],["script","Number"],["script","ad-block-activated"],["script","insertBefore"],["script","pop.doEvent"],["script","constructor"],["script","/adbl/i"],["script","detect"],["script","btnHtml"],["script","usingAdPoweredPlugin"],["script","/join\\(\\'\\'\\)/"],["script","/join\\(\\\"\\\"\\)/"],["script","api.dataunlocker.com"],["script","vglnk"],["script","/RegExp\\(\\'/","condition","RegExp"],["script","$fetch()"],["script",";break;case $."]];

const hostnamesMap = new Map([["giga.de",0],["teltarif.de",1],["aupetitparieur.com",2],["allthingsvegas.com",2],["100percentfedup.com",2],["beforeitsnews.com",2],["concomber.com",2],["conservativebrief.com",2],["conservativefiringline.com",2],["dailylol.com",2],["funnyand.com",2],["letocard.fr",2],["mamieastuce.com",2],["meilleurpronostic.fr",2],["patriotnationpress.com",2],["toptenz.net",2],["vitamiiin.com",2],["writerscafe.org",2],["populist.press",2],["dailytruthreport.com",2],["livinggospeldaily.com",2],["first-names-meanings.com",2],["welovetrump.com",2],["thehayride.com",2],["thelibertydaily.com",2],["thepoke.co.uk",2],["thepolitistick.com",2],["theblacksphere.net",2],["shark-tank.com",2],["naturalblaze.com",2],["greatamericanrepublic.com",2],["dailysurge.com",2],["truthlion.com",2],["flagandcross.com",2],["westword.com",2],["republicbrief.com",2],["freedomfirstnetwork.com",2],["phoenixnewtimes.com",2],["designbump.com",2],["clashdaily.com",2],["madworldnews.com",2],["reviveusa.com",2],["sonsoflibertymedia.com",2],["thedesigninspiration.com",2],["videogamesblogger.com",2],["protrumpnews.com",2],["thepalmierireport.com",2],["kresy.pl",2],["thepatriotjournal.com",2],["gellerreport.com",2],["thegatewaypundit.com",2],["wltreport.com",2],["miaminewtimes.com",2],["politicalsignal.com",2],["rightwingnews.com",2],["bigleaguepolitics.com",2],["comicallyincorrect.com",2],["moviepilot.de",4],["apkmirror.com",[6,50]],["yts.mx",8],["upornia.com",10],["pinsystem.co.uk",11],["tinyppt.com",11],["downfile.site",11],["expertvn.com",11],["trangchu.news",11],["bharathwick.com",11],["learnmany.in",11],["loaninsurehub.com",11],["appkamods.com",11],["3dmodelshare.org",11],["nulleb.com",11],["reset-scans.us",11],["thecustomrom.com",11],["bingotingo.com",11],["ghior.com",11],["3dmili.com",11],["techacode.com",11],["karanpc.com",11],["plc247.com",11],["hiraethtranslation.com",11],["freepasses.org",11],["porninblack.com",11],["tomarnarede.pt",11],["basketballbuzz.ca",11],["dribbblegraphics.com",11],["kemiox.com",11],["checkersmenu.us",11],["teksnologi.com",11],["dollareuro.live",11],["eporner.com",13],["sinvida.me",[14,43]],["streamnoads.com",[14,37,43]],["bowfile.com",14],["cloudvideo.tv",[14,37]],["coloredmanga.com",14],["embedstream.me",[14,37,43]],["exeo.app",14],["hiphopa.net",[14,43]],["megaup.net",14],["tv247.us",[14,43]],["uploadhaven.com",14],["userscloud.com",[14,37]],["searchenginereports.net",15],["mdfx9dc8n.net",[16,43]],["oko.sh",17],["bigbtc.win",18],["cryptofun.space",18],["sexo5k.com",19],["truyen-hentai.com",19],["theshedend.com",21],["rsadnetworkinfo.com",21],["rsinsuranceinfo.com",21],["rsfinanceinfo.com",21],["rsgamer.app",21],["rssoftwareinfo.com",21],["rshostinginfo.com",21],["rseducationinfo.com",21],["zeroupload.com",21],["streamvid.net",[21,43]],["securenetsystems.net",21],["miniwebtool.com",21],["bchtechnologies.com",21],["spiegel.de",22],["appnee.com",23],["d0o0d.com",24],["doods.pro",24],["ds2play.com",24],["ds2video.com",24],["iisfvirtual.in",25],["starxinvestor.com",25],["beatsnoop.com",25],["fetchpik.com",25],["hackerranksolution.in",25],["tech24us.com",26],["freethemesy.com",26],["webhostingpost.com",[27,37]],["tophostingapp.com",27],["digitalmarktrend.com",27],["btcbitco.in",28],["btcsatoshi.net",28],["cempakajaya.com",28],["crypto4yu.com",28],["gainl.ink",28],["manofadan.com",28],["readbitcoin.org",28],["wiour.com",28],["kienthucrangmieng.com",28],["coin-free.com",[28,43]],["tremamnon.com",28],["btc25.org",28],["tron-free.com",28],["bitsmagic.fun",28],["ourcoincash.xyz",28],["hynews.biz",28],["aylink.co",29],["suaurl.com",30],["sugarona.com",31],["nishankhatri.xyz",31],["highkeyfinance.com",31],["amanguides.com",31],["tinys.click",32],["answerpython.com",32],["gsm-solution.com",32],["h-donghua.com",32],["hindisubbedacademy.com",32],["pkgovjobz.com",32],["ripexbooster.xyz",32],["serial4.com",32],["serial412.blogspot.com",32],["sigmalinks.in",32],["tutorgaming.com",32],["appsbull.com",33],["diudemy.com",33],["maqal360.com",33],["mphealth.online",33],["makefreecallsonline.com",33],["androjungle.com",33],["bookszone.in",33],["drakescans.com",33],["shortix.co",33],["msonglyrics.com",33],["app-sorteos.com",33],["bokugents.com",33],["btvplus.bg",33],["coingraph.us",34],["bravedown.com",34],["hes-goals.io",34],["pkbiosfix.com",34],["casi3.xyz",34],["smutty.com",35],["down.dataaps.com",35],["filmweb.pl",35],["kiemlua.com",36],["ytlarge.com",36],["123moviefree4u.com",37],["194.163.183.129",37],["6movies.net",37],["adsh.cc",37],["afilmyhouse.blogspot.com",37],["ak.sv",37],["animefenix.com",37],["animefrenzy.net",37],["animeshouse.info",37],["animesultra.com",37],["api.webs.moe",37],["apkmody.io",37],["atglinks.com",37],["attvideo.com",37],["avimobilemovies.net",37],["backfirstwo.site",[37,105]],["bdnewszh.com",[37,43]],["ccurl.net",[37,43]],["cinema.cimatna.com",37],["crazyblog.in",37],["dembed1.com",37],["dembed2.com",37],["divicast.com",37],["egynow.cam",37],["embed.meomeo.pw",37],["fanproj.net",37],["filebox.click",37],["filmeserialeonline.org",37],["filmesonlinexhd.biz",[37,43]],["filmovi.ws",[37,43]],["filmyzilla2021.xyz",37],["filmyzilla2022.com",37],["filmyzillafullmovie.waystohunt.info",37],["flexyhit.com",37],["footyhunter3.xyz",[37,43]],["foreverwallpapers.com",37],["french-streams.cc",37],["fslinks.org",37],["fstream365.com",37],["gameshdlive.xyz",[37,43]],["gdrivez.xyz",37],["hinatasoul.com",37],["hindimovies.to",[37,43]],["hitmovies4u.com",37],["hotstar.news",37],["hwnaturkya.com",[37,43]],["hxfile.co",[37,43]],["isaidub3.co",37],["lulustream.com",[37,43]],["luluvdo.com",[37,43]],["membed.net",37],["mgnetu.com",37],["moviesdanet.com",37],["moviewatch.com.pk",[37,43]],["moviewatchonline.com.pk",37],["mp3juice.info",37],["mp3juices.cc",37],["neomovies.net",37],["newsrade.com",37],["niaomea.me",[37,43]],["nolive.me",[37,43]],["nollyverse.com",37],["novelssites.com",[37,43]],["oii.io",37],["pepperlive.info",37],["playertv.net",37],["poscitesch.com",[37,43]],["putlocker68.com",37],["s.to",37],["sharkfish.xyz",37],["skidrowcodex.net",37],["sports-stream.site",37],["stream4free.live",37],["tamilmobilemovies.in",37],["tgo-tv.co",[37,43]],["thewatchseries.live",37],["tnmusic.in",37],["travelplanspro.com",37],["tusfiles.com",37],["unlimitmovies.com",37],["uploadflix.org",37],["vid-guard.com",37],["vidsaver.net",37],["vidspeeds.com",37],["viralitytoday.com",37],["voiranime.stream",37],["watchdoctorwhoonline.com",37],["webseriesclub.com",37],["ylink.bid",37],["ytix.xyz",37],["unblocked.id",39],["wouterplanet.com",40],["androidacy.com",41],["djxmaza.in",42],["miuiflash.com",42],["thecubexguide.com",42],["123movies4u.site",43],["1337xporn.com",43],["141jav.com",43],["1bit.space",43],["1bitspace.com",43],["38dh2.top",43],["3dporndude.com",43],["4archive.org",43],["4horlover.com",43],["560pmovie.com",43],["60fps.xyz",43],["85tube.com",43],["85videos.com",43],["8xlinks.click",43],["a2zcrackworld.com",43],["aazzz.xyz",43],["acefile.co",43],["actusports.eu",43],["adblockplustape.com",43],["adclickersbot.com",43],["adricami.com",43],["adslink.pw",43],["adultstvlive.com",43],["adz7short.space",43],["aeblender.com",43],["ahdafnews.blogspot.com",43],["ak47sports.com",43],["akuma.moe",43],["allplayer.tk",43],["allstreaming.online",43],["amadoras.cf",43],["amateurblog.tv",43],["androidadult.com",43],["anhsexjav.xyz",43],["anidl.org",43],["anime-loads.org",43],["animeblkom.net",43],["animefire.net",43],["animelek.me",43],["animeshouse.net",43],["animespire.net",43],["animestotais.xyz",43],["animeyt.es",43],["anroll.net",43],["anymoviess.xyz",43],["aotonline.org",43],["asenshu.com",43],["asialiveaction.com",43],["asianclipdedhd.net",43],["askim-bg.com",43],["asumsikedaishop.com",43],["avcrempie.com",43],["avseesee.com",43],["backfirstwo.com",43],["bajarjuegospcgratis.com",43],["balkanportal.net",43],["balkanteka.net",43],["belowporn.com",43],["bestclaimtrx.xyz",43],["bestgirlsexy.com",43],["bestnhl.com",43],["bestporn4free.com",43],["bestporncomix.com",43],["bet36.es",43],["bikinitryon.net",43],["birdurls.com",43],["bitsearch.to",43],["blackcockadventure.com",43],["blackcockchurch.org",43],["blackporncrazy.com",43],["blizzboygames.net",43],["blizzpaste.com",43],["blkom.com",43],["blog-peliculas.com",43],["blogtrabalhista.com",43],["blurayufr.xyz",43],["bobsvagene.club",43],["bolly4umovies.click",43],["bonusharian.pro",43],["brilian-news.id",43],["brupload.net",43],["bucitana.com",43],["cablegratis.online",43],["camchickscaps.com",43],["camgirlcum.com",43],["camgirls.casa",43],["cashurl.in",43],["castingx.net",43],["celebrity-leaks.net",43],["cgpelis.net",43],["charexempire.com",43],["clasico.tv",43],["clik.pw",43],["coins100s.fun",43],["comicsmanics.com",43],["compucalitv.com",43],["coolcast2.com",43],["cosplaytab.com",43],["countylocalnews.com",43],["cpmlink.net",43],["crackstreamshd.click",43],["crespomods.com",43],["crisanimex.com",43],["crunchyscan.fr",43],["cuevana3.fan",43],["cuevana3hd.com",43],["cumception.com",43],["curvaweb.com",43],["cutpaid.com",43],["datawav.club",43],["daughtertraining.com",43],["deepgoretube.site",43],["deltabit.co",43],["depvailon.com",43],["derleta.com",43],["desivdo.com",43],["desixx.net",43],["detikkebumen.com",43],["deutschepornos.me",43],["diasoft.xyz",43],["directupload.net",43],["diskusscan.com",43],["dixva.com",43],["dlhd.sx",43],["doctormalay.com",43],["dofusports.xyz",43],["dogemate.com",43],["doods.cam",43],["downloadrips.com",43],["downvod.com",43],["dphunters.mom",43],["dragontranslation.com",43],["duddes.xyz",43],["dvdfullestrenos.com",43],["ebookbb.com",43],["ebookhunter.net",43],["egyanime.com",43],["egygost.com",43],["egyshare.cc",43],["ekasiwap.com",43],["electro-torrent.pl",43],["elil.cc",43],["embed4u.xyz",43],["eplayer.click",43],["erovoice.us",43],["eroxxx.us",43],["estrenosdoramas.net",43],["everia.club",43],["extrafreetv.com",43],["extremotvplay.com",43],["eyeshot.live",43],["fapinporn.com",43],["fapptime.com",43],["fashionblog.tv",43],["fastreams.live",43],["faucethero.com",43],["fembed.com",43],["femdom-joi.com",43],["fileone.tv",43],["film1k.com",43],["filmeonline2023.net",43],["filmesonlinex.org",43],["filmovitica.com",43],["filmymaza.blogspot.com",43],["filthy.family",43],["fixfinder.click",43],["flostreams.xyz",43],["flyfaucet.com",43],["footyhunter.lol",43],["forex-golds.com",43],["forex-trnd.com",43],["forumchat.club",43],["forumlovers.club",43],["freemoviesonline.biz",43],["freeomovie.co.in",43],["freeomovie.to",43],["freeporncomic.net",43],["freepornhdonlinegay.com",43],["freeproxy.io",43],["freeuse.me",43],["freeusexporn.com",43],["fsicomics.com",43],["fullymaza.lat",43],["gambarbogel.xyz",43],["gamepcfull.com",43],["gameronix.com",43],["gamesfullx.com",43],["gameshdlive.net",43],["gamesmountain.com",43],["gamesrepacks.com",43],["gamingguru.fr",43],["gamovideo.com",43],["garota.cf",43],["gaydelicious.com",43],["gaypornmasters.com",43],["gaysex69.net",43],["gemstreams.com",43],["get-to.link",43],["girlscanner.org",43],["giurgiuveanul.ro",43],["gledajcrtace.xyz",43],["gocast2.com",43],["gomo.to",43],["gostosa.cf",43],["gtlink.co",43],["gwiazdypornosow.pl",43],["haho.moe",43],["hatsukimanga.com",43],["hayhd.net",43],["hdsaprevodom.com",43],["hdstreamss.club",43],["hentais.tube",43],["hentaistream.co",43],["hentaitk.net",43],["hentaitube.online",43],["hentaiworld.tv",43],["hesgoal.tv",43],["hexupload.net",43],["hhkungfu.tv",43],["highlanderhelp.com",43],["hindimean.com",43],["hiperdex.com",43],["hispasexy.org",43],["hitomi.la",43],["hitprn.com",43],["hoca4u.com",43],["hollymoviehd.cc",43],["hoodsite.com",43],["hopepaste.download",43],["hornylips.com",43],["hotgranny.live",43],["hotmama.live",43],["hqcelebcorner.net",43],["huren.best",43],["igfap.com",43],["ihdstreams.xyz",43],["iklandb.com",43],["illink.net",43],["imgkings.com",43],["imgsex.xyz",43],["imx.to",43],["influencersgonewild.org",43],["infosgj.free.fr",43],["investnewsbrazil.com",43],["itdmusics.com",43],["itopmusic.org",43],["itunesfre.com",43],["iwatchfriendsonline.net",[43,73]],["iwatchtheoffice.com",43],["jackstreams.com",43],["jatimupdate24.com",43],["javcl.com",43],["javf.net",43],["javhay.net",43],["javhoho.com",43],["javhun.com",43],["javleak.com",43],["javporn.best",43],["javsex.to",43],["javtiful.com",43],["jimdofree.com",43],["jiofiles.org",43],["jorpetz.com",43],["journalyc.online",43],["jp-films.com",43],["jpop80ss3.blogspot.com",43],["jpopsingles.eu",43],["kantotflix.net",43],["kantotinyo.com",43],["kaoskrew.org",43],["kaplog.com",43],["keralatvbox.com",43],["kimochi.info",43],["kimochi.tv",43],["kinemania.tv",43],["konstantinova.net",43],["koora-online.live",43],["kunmanga.com",43],["kutmoney.com",43],["kwithsub.com",43],["ladangreceh.xyz",43],["lat69.me",43],["latinblog.tv",43],["latinomegahd.net",43],["lazyfaucet.com",43],["leechpremium.link",43],["legendas.dev",43],["legendei.net",43],["lightdlmovies.blogspot.com",43],["lighterlegend.com",43],["linclik.com",43],["linkebr.com",43],["linkrex.net",43],["links.worldfree4u-lol.online",43],["linksfy.co",43],["lody.ink",43],["lovesomecommunity.com",43],["luzcameraeacao.shop",43],["manga-oni.com",43],["mangaboat.com",43],["mangagenki.me",43],["mangahere.onl",43],["mangaweb.xyz",43],["mangoporn.net",43],["manhwahentai.me",43],["masahub.com",43],["masahub.net",43],["masaporn.xyz",43],["maturegrannyfuck.com",43],["mdy48tn97.com",43],["mediapemersatubangsa.com",43],["mega-mkv.com",43],["megapastes.com",43],["megapornpics.com",43],["messitv.net",43],["meusanimes.net",43],["milfmoza.com",43],["milfzr.com",43],["millionscast.com",43],["mimaletamusical.blogspot.com",43],["mitly.us",43],["mkv-pastes.com",43],["modb.xyz",43],["monaskuliner.ac.id",43],["moredesi.com",43],["movgotv.net",43],["movi.pk",43],["movieswbb.com",43],["mp4upload.com",43],["mrskin.live",43],["multicanaistv.com",43],["mundowuxia.com",43],["myeasymusic.ir",43],["myonvideo.com",43],["myyouporn.com",43],["narutoget.info",43],["naughtypiss.com",43],["nerdiess.com",43],["new-fs.eu",43],["newtorrentgame.com",43],["nflstreams.me",43],["nicekkk.com",43],["nicesss.com",43],["nopay.info",43],["nopay2.info",[43,114]],["notformembersonly.com",43],["novamovie.net",43],["novelpdf.xyz",43],["nozomi.la",43],["nsfwr34.com",43],["nu6i-bg-net.com",43],["nudebabesin3d.com",43],["nukedfans.com",43],["nuoga.eu",43],["nzbstars.com",43],["ohjav.com",43],["ojearnovelas.com",43],["okanime.xyz",43],["olarixas.xyz",43],["oldbox.cloud",43],["olweb.tv",43],["olympicstreams.me",43],["on9.stream",43],["oncast.xyz",43],["onepiece-mangaonline.com",43],["onifile.com",43],["onionstream.live",43],["onlinesaprevodom.net",43],["onlyfullporn.video",43],["onplustv.live",43],["originporn.com",43],["ovagames.com",43],["ovamusic.com",43],["owllink.net",43],["packsporn.com",43],["pahaplayers.click",43],["palimas.org",43],["pandafiles.com",43],["papahd.club",43],["papahd1.xyz",43],["password69.com",43],["paste3.org",43],["pastemytxt.com",43],["payskip.org",43],["peeplink.in",43],["peliculasmx.net",43],["pervertgirlsvideos.com",43],["pervyvideos.com",43],["phim12h.com",43],["picdollar.com",43],["pickteenz.com",43],["pics4you.net",43],["picsxxxporn.com",43],["pinayscandalz.com",43],["piratefast.xyz",43],["piratehaven.xyz",43],["pirateiro.com",43],["pirlotvonline.org",43],["playtube.co.za",43],["plugintorrent.com",43],["pmvzone.com",43],["porndish.com",43],["pornez.net",43],["pornfetishbdsm.com",43],["pornfits.com",43],["pornhd720p.com",43],["pornobr.club",43],["pornobr.ninja",43],["pornodominicano.net",43],["pornofaps.com",43],["pornoflux.com",43],["pornotorrent.com.br",43],["pornredit.com",43],["pornstarsyfamosas.es",43],["pornstreams.co",43],["porntn.com",43],["pornxbit.com",43],["pornxday.com",43],["portugues-fcr.blogspot.com",43],["poscishd.online",43],["poseyoung.com",43],["pover.org",43],["proxyninja.org",43],["pubfilmz.com",43],["publicsexamateurs.com",43],["punanihub.com",43],["putlocker5movies.org",43],["pxxbay.com",43],["r18.best",43],["ragnaru.net",43],["rapbeh.net",43],["rapelust.com",43],["rapload.org",43],["read-onepiece.net",43],["retro-fucking.com",43],["retrotv.org",43],["rockdilla.com",43],["rojadirectatvenvivo.com",43],["rojitadirecta.blogspot.com",43],["romancetv.site",43],["rule34.club",43],["rule34hentai.net",43],["rumahbokep-id.com",43],["safego.cc",43],["sakurafile.com",43],["satoshi-win.xyz",43],["scat.gold",43],["scatfap.com",43],["scatkings.com",43],["scnlog.me",43],["scripts-webmasters.net",43],["serie-turche.com",43],["serijefilmovi.com",43],["sexcomics.me",43],["sexdicted.com",43],["sexgay18.com",43],["sexofilm.co",43],["sextgem.com",43],["sextubebbw.com",43],["sgpics.net",43],["shadowrangers.live",43],["shahee4u.cam",43],["shahiid-anime.net",43],["shemale6.com",43],["shinden.pl",43],["short.es",43],["showmanga.blog.fc2.com",43],["shrt10.com",43],["shurt.pw",43],["sideplusleaks.net",43],["silverblog.tv",43],["silverpic.com",43],["sinhalasub.life",43],["sinsitio.site",43],["skidrowcpy.com",43],["skidrowfull.com",43],["skidrowreloaded.com",43],["slut.mom",43],["smallencode.me",43],["smoner.com",43],["smplace.com",43],["soccerinhd.com",43],["socceron.name",43],["softairbay.com",43],["sokobj.com",43],["songsio.com",43],["souexatasmais.com",43],["sportbar.live",43],["sportea.online",43],["sportskart.xyz",43],["sportstream1.cfd",43],["srt.am",43],["srts.me",43],["stakes100.xyz",43],["stbemuiptv.com",43],["stockingfetishvideo.com",43],["stream.lc",43],["stream25.xyz",43],["streambee.to",43],["streamcenter.pro",43],["streamers.watch",43],["streamgo.to",43],["streamkiste.tv",43],["streamoupload.xyz",43],["streamservicehd.click",43],["subtitleporn.com",43],["subtitles.cam",43],["suicidepics.com",43],["supertelevisionhd.com",43],["supexfeeds.com",43],["swzz.xyz",43],["sxnaar.com",43],["tabooporns.com",43],["taboosex.club",43],["tapeantiads.com",43],["tapeblocker.com",43],["tapenoads.com",43],["tapewithadblock.org",[43,137]],["teamos.xyz",43],["teen-wave.com",43],["teenporncrazy.com",43],["telegramgroups.xyz",43],["telenovelasweb.com",43],["tensei-shitara-slime-datta-ken.com",43],["tfp.is",43],["thaihotmodels.com",43],["theblueclit.com",43],["thebussybandit.com",43],["theicongenerator.com",43],["thelastdisaster.vip",43],["thepiratebay0.org",43],["thepiratebay10.info",43],["thesexcloud.com",43],["thothub.today",43],["tightsexteens.com",43],["tojav.net",43],["tokyoblog.tv",43],["tonnestreamz.xyz",43],["top16.net",43],["topvideosgay.com",43],["torrage.info",43],["torrents.vip",43],["torrsexvid.com",43],["tpb-proxy.xyz",43],["trannyteca.com",43],["trendytalker.com",43],["tumanga.net",43],["turbogvideos.com",43],["turbovid.me",43],["turkishseriestv.org",43],["turksub24.net",43],["tutele.sx",43],["tutelehd3.xyz",43],["tvglobe.me",43],["tvpclive.com",43],["tvs-widget.com",43],["tvseries.video",43],["ucptt.com",43],["ufaucet.online",43],["ufcfight.online",43],["uhdgames.xyz",43],["ultrahorny.com",43],["ultraten.net",43],["unblockweb.me",43],["underhentai.net",43],["uniqueten.net",43],["upbaam.com",43],["upstream.to",43],["valeriabelen.com",43],["verdragonball.online",43],["vfxmed.com",43],["video.az",43],["videostreaming.rocks",43],["videowood.tv",43],["vidorg.net",43],["vidtapes.com",43],["vidz7.com",43],["vikistream.com",43],["vikv.net",43],["virpe.cc",43],["visifilmai.org",43],["viveseries.com",43],["vladrustov.sx",43],["volokit2.com",43],["vstorrent.org",43],["vstplugs.com",43],["w-hentai.com",43],["watchaccordingtojimonline.com",43],["watchbrooklynnine-nine.com",43],["watchdowntonabbeyonline.com",43],["watchelementaryonline.com",43],["watcheronline.net",43],["watchgleeonline.com",43],["watchjavidol.com",43],["watchkobestreams.info",43],["watchlostonline.net",43],["watchlouieonline.com",43],["watchmonkonline.com",43],["watchparksandrecreation.net",43],["watchprettylittleliarsonline.com",43],["watchrulesofengagementonline.com",43],["watchthekingofqueens.com",43],["watchthemiddleonline.com",43],["watchtvchh.xyz",43],["webcamrips.com",43],["wickedspot.org",43],["wincest.xyz",43],["witanime.best",43],["wolverdonx.com",43],["wordcounter.icu",43],["worldcupstream.pm",43],["worldmovies.store",43],["worldstreams.click",43],["wpdeployit.com",43],["wqstreams.tk",43],["wwwsct.com",43],["xanimeporn.com",43],["xblog.tv",43],["xn--verseriesespaollatino-obc.online",43],["xn--xvideos-espaol-1nb.com",43],["xpornium.net",43],["xsober.com",43],["xvip.lat",43],["xxgasm.com",43],["xxvideoss.org",43],["xxx18.uno",43],["xxxdominicana.com",43],["xxxfree.watch",43],["xxxwebdlxxx.top",43],["xxxxvideo.uno",43],["yabai.si",43],["yadixv.com",43],["yayanimes.net",43],["yeshd.net",43],["yodbox.com",43],["youjax.com",43],["youpits.xyz",43],["yourdailypornvideos.ws",43],["yourupload.com",43],["ytstv.me",43],["ytstvmovies.co",43],["ytstvmovies.xyz",43],["ytsyify.co",43],["ytsyifymovie.com",43],["zerion.cc",43],["zerocoin.top",43],["zitss.xyz",43],["zpaste.net",43],["zplayer.live",43],["veryfreeporn.com",44],["besthdgayporn.com",45],["freeroms.com",46],["soap2day-online.com",46],["austiblox.net",47],["btcbunch.com",48],["teachoo.com",49],["genshinlab.com",50],["fourfourtwo.co.kr",50],["interfootball.co.kr",50],["a-ha.io",50],["cboard.net",50],["mobilitytv.co.kr",50],["mememedia.co.kr",50],["newautopost.co.kr",50],["tvreport.co.kr",50],["tenbizt.com",50],["jjang0u.com",50],["joongdo.co.kr",50],["viva100.com",50],["thephoblographer.com",50],["newdaily.co.kr",50],["dogdrip.net",50],["golf-live.at",50],["gamingdeputy.com",50],["thesaurus.net",50],["dotkeypress.kr",50],["viewcash.co.kr",50],["tripplus.co.kr",50],["enterdiary.com",50],["mtodayauto.com",50],["hotplacehunter.co.kr",50],["mystylezip.com",50],["majorgeeks.com",50],["poro.gg",50],["maple.gg",50],["lolchess.gg",50],["dak.gg",50],["meconomynews.com",50],["brandbrief.co.kr",50],["dfast.kr",50],["youtu.co",50],["mlbpark.donga.com",50],["capress.kr",50],["carandmore.co.kr",50],["maxmovie.kr",50],["motorgraph.com",50],["newsbell.co.kr",50],["tminews.co.kr",50],["thehousemagazine.kr",50],["hardreset.info",50],["metabattle.com",50],["maketecheasier.com",50],["topsporter.net",51],["sportshub.to",51],["7xm.xyz",52],["fastupload.io",52],["azmath.info",52],["claimclicks.com",53],["thebullspen.com",53],["tii.la",54],["easymc.io",55],["yunjiema.top",55],["hacoos.com",56],["bondagevalley.cc",57],["zefoy.com",58],["vidello.net",59],["resizer.myct.jp",60],["gametohkenranbu.sakuraweb.com",61],["jisakuhibi.jp",62],["rank1-media.com",62],["lifematome.blog",63],["fm.sekkaku.net",64],["free-avx.jp",65],["dvdrev.com",66],["betweenjpandkr.blog",67],["nft-media.net",68],["ghacks.net",69],["songspk2.info",70],["truyentranhfull.net",71],["nectareousoverelate.com",74],["khoaiphim.com",75],["haafedk2.com",76],["fordownloader.com",76],["jovemnerd.com.br",77],["nicomanga.com",78],["totalcsgo.com",79],["vivamax.asia",80],["manysex.com",81],["gaminginfos.com",82],["tinxahoivn.com",83],["forums-fastunlock.com",84],["automoto.it",85],["sekaikomik.bio",86],["codelivly.com",87],["ophim.vip",88],["touguatize.monster",89],["client.falixnodes.net",90],["novelhall.com",91],["hes-goal.net",92],["al.com",93],["allmusic.com",93],["androidpolice.com",93],["calculator-online.net",93],["cattime.com",93],["cbr.com",93],["cbssports.com",93],["chaptercheats.com",93],["cleveland.com",93],["collider.com",93],["comingsoon.net",93],["dogtime.com",93],["dualshockers.com",93],["freeconvert.com",93],["gamerant.com",93],["gfinityesports.com",93],["givemesport.com",93],["howtogeek.com",93],["insider-gaming.com",93],["liveandletsfly.com",93],["makeuseof.com",93],["milestomemories.com",93],["mlive.com",93],["momtastic.com",93],["movieweb.com",93],["musicfeeds.com.au",93],["nationalreview.com",93],["nj.com",93],["nordot.app",93],["nypost.com",93],["oregonlive.com",93],["pagesix.com",93],["qtoptens.com",93],["realgm.com",93],["screenrant.com",93],["sheknows.com",93],["sherdog.com",93],["sidereel.com",93],["superherohype.com",93],["thefashionspot.com",93],["thegamer.com",93],["timesnews.net",93],["tvline.com",93],["wimp.com",93],["xda-developers.com",93],["cheatsheet.com",94],["pwinsider.com",94],["bagi.co.in",95],["keran.co",95],["biblestudytools.com",96],["christianheadlines.com",96],["ibelieve.com",96],["kuponigo.com",97],["kimcilonly.site",98],["kimcilonly.link",98],["cryptoearns.com",99],["inxxx.com",100],["ipaspot.app",101],["embedwish.com",102],["filelions.live",102],["leakslove.net",102],["jenismac.com",103],["vxetable.cn",104],["jewelavid.com",105],["nizarstream.com",105],["snapwordz.com",106],["toolxox.com",106],["rl6mans.com",106],["idol69.net",106],["plumbersforums.net",107],["123movies800.online",108],["gulio.site",109],["mediaset.es",110],["izlekolik.net",111],["donghuaworld.com",112],["letsdopuzzles.com",113],["tainio-mania.online",114],["rediff.com",115],["iconicblogger.com",116],["dzapk.com",117],["darknessporn.com",118],["familyporner.com",118],["freepublicporn.com",118],["pisshamster.com",118],["punishworld.com",118],["xanimu.com",118],["pig69.com",119],["cosplay18.pics",119],["javhdo.net",120],["eroticmoviesonline.me",121],["teleclub.xyz",122],["ecamrips.com",123],["showcamrips.com",123],["9animetv.to",124],["jornadaperfecta.com",125],["loseart.com",126],["sousou-no-frieren.com",127],["veev.to",128],["intro-hd.net",129],["monacomatin.mc",129],["nodo313.net",129],["unite-guide.com",130],["appimagehub.com",131],["gnome-look.org",131],["store.kde.org",131],["linux-apps.com",131],["opendesktop.org",131],["pling.com",131],["xfce-look.org",131],["perchance.org",132],["botcomics.com",133],["cefirates.com",133],["chandlerorchards.com",133],["comicleaks.com",133],["marketdata.app",133],["monumentmetals.com",133],["tapmyback.com",133],["ping.gg",133],["revistaferramental.com.br",133],["hawpar.com",133],["alpacafinance.org",[133,134]],["nookgaming.com",133],["enkeleksamen.no",133],["kvest.ee",133],["creatordrop.com",133],["panpots.com",133],["cybernetman.com",133],["bitdomain.biz",133],["gerardbosch.xyz",133],["fort-shop.kiev.ua",133],["accuretawealth.com",133],["resourceya.com",133],["tracktheta.com",133],["tt.live",134],["future-fortune.com",134],["abhijith.page",134],["madrigalmaps.com",134],["adventuretix.com",134],["panprices.com",135],["intercity.technology",135],["freelancer.taxmachine.be",135],["adria.gg",135],["fjlaboratories.com",135],["proboards.com",136],["winclassic.net",136],["infinityscans.xyz",[138,139]]]);

const entitiesMap = new Map([["1337x",[3,43]],["kimcartoon",5],["pahe",[7,43]],["soap2day",7],["hqq",9],["waaw",9],["teluguflix",11],["pixhost",12],["viprow",[14,37,43]],["cloudvideotv",[14,37]],["vidsrc",[14,37]],["beinmatch",[20,43]],["dood",[24,37]],["doodstream",24],["dooood",[24,37]],["mydverse",32],["poplinks",33],["shrinke",35],["shrinkme",35],["123movies",37],["123moviesla",37],["123movieweb",37],["2embed",37],["4hiidude",37],["720pstream",37],["9xmovies",37],["aagmaal",[37,43]],["adshort",37],["allmovieshub",37],["asianplay",37],["atishmkv",37],["atomixhq",[37,43]],["crackstreams",[37,43]],["cricstream",37],["crictime",37],["daddylive",[37,43]],["daddylivehd",[37,43]],["databasegdriveplayer",37],["dloader",37],["dropgalaxy",37],["dvdplay",[37,43]],["easylinks",37],["extralinks",37],["extramovies",37],["faselhd",37],["filemoon",37],["filmy",37],["filmyhit",37],["filmywap",37],["filmyzilla",[37,43]],["fmovies",37],["fsapi",37],["gdplayer",37],["gdriveplayer",37],["goload",37],["gomoviefree",37],["gomovies",37],["gowatchseries",37],["hdmoviesfair",[37,43]],["hdmoviz",37],["hindilinks4u",37],["hurawatch",37],["isaidub",37],["isaidubhd",37],["jalshamoviezhd",37],["jiorockers",37],["linkshub",37],["linksme",37],["livecricket",37],["madrasdub",37],["mkvcinemas",37],["mobilemovies",37],["movies2watch",37],["moviesda1",37],["moviesmeta",[37,43]],["moviespapa",37],["mp4moviez",37],["mydownloadtube",37],["nsw2u",37],["nuroflix",37],["o2tvseries",37],["o2tvseriesz",37],["pctfenix",[37,43]],["pctnew",[37,43]],["pirlotv",37],["poscitech",37],["primewire",37],["serienstream",37],["sflix",37],["shahed4u",37],["shaheed4u",37],["speedostream",37],["sportcast",37],["sportskart",37],["streamadblocker",[37,43]],["streamingcommunity",37],["tamilarasan",37],["tamilfreemp3songs",37],["tamilprinthd",37],["torrentdosfilmes",37],["uploadrar",37],["uqload",37],["vidcloud9",37],["vido",37],["vidoo",37],["vipbox",[37,43]],["vipboxtv",[37,43]],["vudeo",37],["vumoo",37],["watchomovies",[37,46]],["yesmovies",37],["kickass",38],["123-movies",43],["123movieshd",43],["123movieshub",43],["123moviesme",43],["1stream",43],["1tamilmv",43],["2ddl",43],["2umovies",43],["3hiidude",43],["4stream",43],["5movies",43],["7hitmovies",43],["9xmovie",43],["adblockeronstape",43],["adblockeronstreamtape",43],["adblockstreamtape",43],["adblockstrtape",43],["adblockstrtech",43],["adblocktape",43],["adcorto",43],["alexsports",43],["alexsportss",43],["alexsportz",43],["animepahe",43],["animesanka",43],["animixplay",43],["aniplay",43],["antiadtape",43],["asianclub",43],["ask4movie",43],["atomohd",43],["bhaai",43],["buffstreams",43],["canalesportivo",43],["clickndownload",43],["clicknupload",43],["desiremovies",43],["devlib",43],["divxtotal",43],["divxtotal1",43],["elixx",43],["enjoy4k",43],["estrenosflix",43],["estrenosflux",43],["estrenosgo",43],["f1stream",43],["fbstream",43],["file4go",43],["findav",43],["findporn",43],["flixmaza",43],["flizmovies",43],["freetvsports",43],["g3g",43],["gotxx",43],["grantorrent",43],["hdmoviesflix",43],["hiidudemoviez",43],["imgsen",43],["imgsto",43],["incest",43],["incestflix",43],["javmost",43],["keeplinks",43],["keepvid",43],["keralahd",43],["khatrimazaful",43],["khatrimazafull",43],["leechall",43],["linkshorts",43],["mangovideo",43],["miniurl",43],["mirrorace",43],["mixdroop",43],["mixdrop",43],["mkvcage",43],["mlbstream",43],["mlsbd",43],["mmsbee",43],["motogpstream",43],["movieplex",43],["movierulzlink",43],["movies123",43],["moviesflix",43],["moviessources",43],["moviesverse",43],["moviezwaphd",43],["mrunblock",43],["nbastream",43],["newmovierulz",43],["nflstream",43],["nhlstream",43],["noblocktape",43],["nocensor",43],["onlyfams",43],["ouo",43],["peliculas24",43],["pelisplus",43],["piratebay",43],["plyjam",43],["plylive",43],["plyvdo",43],["pornhoarder",43],["prbay",43],["projectfreetv",43],["proxybit",43],["psarips",43],["racaty",43],["remaxhd",43],["rintor",43],["rnbxclusive",43],["rnbxclusive0",43],["rnbxclusive1",43],["rojadirecta",43],["rojadirectaenvivo",43],["rugbystreams",43],["safetxt",43],["shadowrangers",43],["shahi4u",43],["shahid4uu",43],["shavetape",43],["shortearn",43],["shorten",43],["shorttey",43],["shortzzy",43],["skymovieshd",43],["socceronline",43],["softarchive",43],["sports-stream",43],["sshhaa",43],["stapadblockuser",43],["stape",43],["stapewithadblock",43],["starmusiq",43],["strcloud",43],["streamadblockplus",43],["streamcdn",43],["streamhub",43],["streamsport",43],["streamta",43],["streamtape",43],["streamtapeadblockuser",43],["strikeout",43],["strtape",43],["strtapeadblock",43],["strtapeadblocker",43],["strtapewithadblock",43],["strtpe",43],["swatchseries",43],["tabooflix",43],["tennisstreams",43],["themoviesflix",43],["thepiratebay",43],["thisav",43],["tmearn",43],["toonanime",43],["torlock",43],["tormalayalam",43],["torrentz2eu",43],["tutelehd",43],["tvply",43],["u4m",43],["ufcstream",43],["unblocknow",43],["uploadbuzz",43],["usagoals",43],["vexmoviex",43],["vidclouds",43],["vidlox",43],["vipleague",43],["watch-series",43],["watchseries",43],["xclusivejams",43],["xmoviesforyou",43],["youdbox",43],["ytmp3eu",43],["yts-subs",43],["yts",43],["zooqle",43],["cine-calidad",44],["actvid",72]]);

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
