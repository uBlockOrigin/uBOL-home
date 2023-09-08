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
const uBOL_noWindowOpenIf = function() {

const scriptletGlobals = new Map(); // jshint ignore: line

const argsList = [[],["/^/","1"],["/^/","15"],["amazon-adsystem"],["|"],["given"],["!bergblock"],["//"],["!za.gl","0"],["!?safelink_redirect="],["!atomtt"],["!/download\\/|link/"],["!/^https:\\/\\/sendvid\\.com\\/[0-9a-z]+$/"],["!api?call=","10","obj"],["!/ytmp3|dropbox/"],["!gdrivedownload"],["!direct"],["!refine?search"],["!embedy"],["wapka"],["!t.me"],["!/prcf.fiyar|themes|pixsense|.jpg/"],["ppcnt"],["onclickmega"],["!dosya","1"],["!newdmn","1"],["!/^\\/d\\//"],["!dropbox"],["!yt2api"],["!clickmp3"],["bitcoins-update.blogspot.com"],["!coinsearns.com"],["youtube"],["/^/","0"],["!ytcutter.net"],["!/d/"],["!download"],["/xlirdr|hotplay\\-games|hyenadata/"],["!mtraffics"],["_blank"],["!/^\\//"],["/\\.(com|net)\\/4\\//"],["?key="],["!abyss.to","1"]];

const hostnamesMap = new Map([["rarbgmirrored.org",0],["rarbgproxy.org",0],["afreesms.com",0],["hltv.org",0],["hollaforums.com",0],["mcloud.to",0],["vidstream.pro",0],["dailyuploads.net",0],["watchparksandrecreation.net",0],["putlocker-website.com",0],["filescdn.com",0],["deportealdia.live",0],["watchmyexgf.net",0],["upload-4ever.com",0],["vortez.net",0],["porn.com",0],["katestube.com",0],["mangoporn.net",0],["nwanime.tv",0],["chooyomi.com",0],["shooshtime.com",0],["picturelol.com",0],["imgspice.com",0],["pornhd.com",0],["bigtitsxxxsex.com",0],["xvideos.com",0],["xvideos2.com",0],["vivud.com",0],["empflix.com",0],["anyporn.com",0],["magnetdl.com",0],["magnetdl.org",0],["short.pe",0],["donkparty.com",0],["dz4link.com",0],["zupload.me",0],["tubemania.org",0],["webdesigndev.com",0],["imageweb.ws",0],["vidoza.net",0],["katfile.com",0],["pelispop.net",0],["streampelis.club",0],["gamcore.com",0],["porcore.com",0],["69games.xxx",0],["vintage-erotica-forum.com",0],["momondo.com",0],["hentai2read.com",0],["lolhentai.net",0],["mangafreak.net",0],["itv.com",0],["hotscope.tv",0],["micloudfiles.com",0],["assia.tv",0],["assia4.com",0],["assia24.com",0],["seatguru.com",0],["asiananimaltube.org",0],["zoosex.pink",0],["player.cuevana.ac",0],["pornrabbit.com",0],["cartoonporno.xxx",0],["youpornru.com",0],["hubfiles.ws",0],["asus-zenfone.com",0],["uii.io",0],["likn.xyz",0],["powforums.com",0],["uploadbank.com",0],["titsbox.com",0],["zmovs.com",0],["spycock.com",0],["cut-fly.com",0],["cine24.online",0],["xrivonet.info",0],["gounlimited.to",0],["shortit.pw",0],["pornve.com",0],["sawlive.tv",0],["veekyforums.com",0],["cutpaid.com",0],["televisionlibre.net",0],["durtypass.com",0],["opjav.com",0],["nhentai.net",0],["forexlap.com",0],["cambay.tv",0],["camwhoreshd.com",0],["camwhorespy.com",0],["cwtvembeds.com",0],["videogreen.xyz",0],["zegtrends.com",0],["hpav.tv",0],["hpjav.tv",0],["fileone.tv",0],["xpics.me",0],["linksht.com",0],["milfzr.com",0],["pandamovies.pw",0],["simsdom.com",0],["cloudvideo.tv",0],["kinoger.ru",0],["xxxbunker.com",0],["clasicotas.org",0],["watchmoviesrulz.com",0],["sypl.xyz",0],["sexgalaxy.net",0],["compupaste.com",0],["wstream.to",0],["dilo.nu",0],["noticiasesports.live",0],["noweconomy.live",0],["googlvideo.com",0],["serverf4.org",0],["streamporn.pw",0],["zplayer.live",0],["faucethero.com",0],["720pxmovies.blogspot.com",0],["software-on.com",0],["cdna.tv",0],["cam4.com",0],["filerio.in",0],["ckk.ai",0],["shemalepower.xyz",0],["dlkoo.com",0],["bitcoinminingforex.blogspot.com",0],["vladan.fr",0],["losporn.org",0],["dutrag.com",0],["embedsito.com",0],["feurl.com",0],["films5k.com",0],["gaobook.review",0],["javcl.me",0],["javip.pro",0],["javlove.club",0],["luxubu.review",0],["mavlecteur.com",0],["mavplayer.xyz",0],["mrdhan.com",0],["openplayer.net",0],["playdoe.xyz",0],["playfinder.xyz",0],["playvid.host",0],["rubicstreaming.com",0],["smartshare.tv",0],["ujav.me",0],["watchgayporn.online",0],["xstreamcdn.com",0],["youtnbe.xyz",0],["tpxanime.in",0],["welovestream.xyz",0],["dreamfancy.org",0],["lewat.club",0],["pornult.com",0],["nonktube.com",0],["tusfiles.com",0],["adultdvdparadise.com",0],["freeomovie.info",0],["fullxxxmovies.me",0],["mangoparody.com",0],["mangoporn.co",0],["netflixporno.net",0],["pandamovies.me",0],["playpornfree.xyz",0],["pornkino.cc",0],["pornwatch.ws",0],["watchfreexxx.pw",0],["watchxxxfree.pw",0],["xopenload.pw",0],["xtapes.me",0],["xxxmoviestream.xyz",0],["xxxparodyhd.net",0],["xxxscenes.net",0],["xxxstream.me",0],["youwatchporn.com",0],["spankbang.com",0],["skeimg.com",0],["4share.vn",0],["0xxx.ws",0],["ucptt.com",0],["exe.io",0],["exe.app",0],["skincarie.com",0],["fullhdxxx.com",0],["viptube.com",0],["homemature.net",0],["kingsofteens.com",0],["hentaihere.com",0],["clk.ink",0],["yandexcdn.com",0],["iguarras.com",0],["peliculaspornomega.net",0],["birdurls.com",0],["adsafelink.com",0],["aii.sh",0],["czechvideo.org",0],["gfsvideos.com",0],["opensubtitles.org",0],["vupload.com",0],["series-d.com",0],["hentaihaven.xxx",0],["naughtymachinima.com",0],["porn00.org",0],["savevideo.tube",0],["tr.savefrom.net",0],["xanimeporn.com",0],["bacakomik.co",0],["porngo.com",0],["streamplusvip.xyz",0],["playembed.xyz",0],["playtemporal.xyz",0],["bitearns.com",0],["dr-farfar.com",0],["torrentmegafilmes.tv",0],["yeswegays.com",0],["youramateurtube.com",0],["webtor.io",0],["encurta.eu",0],["luscious.net",0],["makemoneywithurl.com",0],["dflix.top",0],["gomo.to",0],["cryptofuns.ru",0],["animetemaefiore.club",0],["wplink.online",0],["naniplay.com",0],["savesubs.com",0],["seriesynovelas.online",0],["interracial.com",0],["fatwhitebutt.com",0],["smplace.com",0],["slaughtergays.com",0],["sexiestpicture.com",0],["sassytube.com",0],["vipergirls.to",0],["xh.video",0],["lkc21.net",0],["freegogpcgames.com",0],["smiechawatv.pl",0],["promo-visits.site",0],["shorterall.com",0],["tudogamesbr.com",0],["dogemate.com",0],["pstream.net",0],["shurt.pw",0],["fakyutube.com",0],["l2db.info",0],["aplayer.xyz",0],["netuplay.xyz",0],["fastpeoplesearch.com",0],["onbox.me",0],["financemonk.net",0],["notube.net",0],["notube.cc",0],["leolist.cc",0],["moalm-qudwa.blogspot.com",0],["smutty.com",0],["kropic.com",0],["westmanga.info",0],["beeg.party",0],["mm9841.com",0],["mm9842.com",0],["adblockplustape.com",0],["tapewithadblock.org",0],["twistedporn.com",0],["ymp4.download",0],["xxxonlinegames.com",0],["watchpornx.com",0],["digjav.com",0],["videosporngay.net",0],["sonline.pro",0],["2conv.com",0],["flvto.biz",0],["flv2mp3.by",0],["down-paradise.com",0],["linksly.co",0],["ddownr.com",0],["keepv.id",0],["savethevideo.com",0],["savefrom.net",0],["iseekgirls.com",0],["milapercia.com",0],["windows-1.com",0],["siteunblocked.info",0],["theproxy.app",0],["watch-jav-english.live",0],["planet-streaming1.com",0],["genpas.icu",0],["deseneledublate.com",0],["wordcounter.icu",0],["imfb.xyz",0],["goossh.com",0],["shortenbuddy.com",0],["ohentai.org",0],["shpl.xyz",0],["bestsolaris.com",0],["redanimedatabase.cloud",0],["nuuuppp.online",0],["sinfoniarossini.com",0],["liveonscore.tv",0],["vpn-anbieter-vergleich-test.de",0],["gayvidsclub.com",0],["tits-guru.com",0],["mediashore.org",0],["vidxhot.net",0],["miuiku.com",0],["savelink.site",0],["vvc.vc",0],["janusnotes.com",0],["hentaidude.com",0],["opvid.net",0],["kaplog.com",0],["passgen.icu",0],["downloadtwittervideo.com",0],["kiwiexploits.com",0],["genpassword.top",0],["thejournal.ie",0],["cdnqq.net",0],["cdn1.fastvid.co",0],["gorockmovies.top",0],["kokostream.net",0],["movi.pk",0],["ncdn22.xyz",0],["netu.ac",0],["adultfun.net",0],["sanoybonito.club",0],["7misr4day.com",0],["pornlib.com",0],["wigistream.to",0],["aquiyahorajuegos.net",0],["hotflix.cc",0],["ontiva.com",0],["torrentkingnow.com",0],["gaysearch.com",0],["aniwatch.pro",0],["cararegistrasi.com",0],["booru.eu",0],["borwap.xxx",0],["centralboyssp.com.br",0],["czxxx.org",0],["filmdelisi.co",0],["filmovitica.com",0],["foxtube.com",0],["hd-xxx.me",0],["ipornxxx.net",0],["itsfuck.com",0],["javideo.pw",0],["kissanime.mx",0],["lametrofitness.net",0],["longporn.xyz",0],["matureworld.ws",0],["mp3-convert.org",0],["stilltube.com",0],["streamm4u.club",0],["teenage-nudists.net",0],["xvideos.name",0],["xxx-videos.org",0],["xxxputas.net",0],["youpornfm.com",0],["maxtubeporn.net",0],["vidsvidsvids.com",0],["hentaicomics.pro",0],["y2mate.guru",0],["javstream.top",0],["watchtodaypk.com",0],["assia1.tv",0],["msubplix.com",0],["myyouporn.com",0],["convert2mp3.club",0],["embedstream.me",0],["nolive.me",0],["vrporngalaxy.com",0],["stem-cells-news.com",0],["javynow.com",0],["yifytorrentme.com",0],["blog.aming.info",0],["toopl.xyz",0],["youtubemp3.us",0],["yt-api.com",0],["afilmyhouse.blogspot.com",0],["pagalworld.us",0],["coinurl.net",0],["spicyandventures.com",0],["hd44.com",0],["exhost.online",0],["mobileflasherbd.com",0],["kaotic.com",0],["highstream.tv",0],["crazyblog.in",0],["desitab69.sextgem.com",0],["javquick.com",0],["rechub.tv",0],["frebieesforyou.net",0],["upvideo.to",0],["shemalestube.com",0],["pussy.org",0],["analsexstars.com",0],["swatchseries.ru",0],["theicongenerator.com",0],["zentum.club",0],["cloudrls.com",0],["skiplink.org",0],["ybm.pw",0],["lordhd.com",0],["paid4.link",0],["goplayer.online",0],["serialeonline.biz",0],["pajalusta.club",0],["javhdfree.icu",0],["maxstream.video",0],["videoseyred.in",0],["www-daftarharga.blogspot.com",0],["xbox360torrent.com",0],["arenaboard.xyz",0],["go.gets4link.com",0],["lightnovelpdf.com",0],["keepvid.pw",0],["xemphimgi.net",0],["toolsolutions.top",0],["wowstream.top",0],["adbitcoin.co",0],["automotur.club",0],["link.rota.cc",0],["convert2mp3.cx",0],["mp3snow.com",0],["mp3dl.cc",0],["katflys.com",0],["video1tube.com",0],["za.uy",0],["45.87.43.43",0],["xdxdxd.xyz",0],["instaanime.com",0],["coinsparty.com",0],["fifaultimateteam.it",0],["bowfile.com",0],["1cloudfile.com",0],["gayvl.net",0],["covrhub.com",0],["fapcat.com",0],["pobre.tv",0],["pixroute.com",0],["live7v.com",0],["kinas.tv",0],["thienhatruyen.com",0],["witanime.com",0],["clk.asia",0],["rancah.com",0],["linka.click",0],["miraculous.to",0],["av01.tv",0],["bigyshare.com",0],["glotorrents.fr-proxy.com",0],["glotorrents.theproxy.ws",0],["wapsing.com",0],["apiyt.com",0],["masstamilans.com",0],["okmusi.com",0],["ytmp3x.com",0],["yofaurls.com",0],["rainurl.com",0],["snowurl.com",0],["webpornblog.com",0],["cam-video.xxx",0],["svetserialu.to",0],["blu-ray.com",0],["javporn.tv",0],["7mmtv.sx",0],["mm9845.com",0],["fitnakedgirls.com",0],["mrgay.com",0],["best-cpm.com",0],["webhostingpost.com",0],["upvizzz.xyz",0],["xvideos.wptri.com",0],["tutorialspots.com",0],["phica.net",0],["streambee.to",0],["streamers.watch",0],["emb.x179759.apl123.me",0],["emb.x187106.apl152.me",0],["techgeek.digital",0],["supersextube.pro",0],["h-flash.com",0],["ponselharian.com",0],["hakie.net",0],["vtube.to",0],["vidplaystream.top",0],["tubeload.co",0],["online123movies.live",0],["whcp4.com",0],["flixtor.stream",0],["44anime.net",0],["yourtehzeeb.com",0],["onlymp3.to",0],["hindimovies.to",0],["movieswatch24.pk",0],["watchonlinemovies15.pk",0],["loadx.ws",0],["piraproxy.app",0],["driveplayer.net",0],["hindimoviestv.com",0],["watchpk.live",0],["watchmoviesonlinepk.com",0],["mp3y.download",0],["k1nk.co",0],["y2mate.com",0],["y2mate.is",0],["watchonlinehd123.sbs",0],["acrackstreams.com",0],["pomvideo.cc",0],["steampiay.cc",0],["api.webs.moe",0],["3hentai.net",0],["imsdb.pw",0],["crownmakermacaronicism.com",0],["chromotypic.com",0],["gamoneinterrupted.com",0],["metagnathtuggers.com",0],["wolfdyslectic.com",0],["rationalityaloelike.com",0],["sizyreelingly.com",0],["simpulumlamerop.com",0],["urochsunloath.com",0],["monorhinouscassaba.com",0],["counterclockwisejacky.com",0],["35volitantplimsoles5.com",0],["scatch176duplicities.com",0],["antecoxalbobbing1010.com",0],["boonlessbestselling244.com",0],["cyamidpulverulence530.com",0],["guidon40hyporadius9.com",0],["449unceremoniousnasoseptal.com",0],["19turanosephantasia.com",0],["30sensualizeexpression.com",0],["321naturelikefurfuroid.com",0],["745mingiestblissfully.com",0],["availedsmallest.com",0],["greaseball6eventual20.com",0],["toxitabellaeatrebates306.com",0],["20demidistance9elongations.com",0],["audaciousdefaulthouse.com",0],["fittingcentermondaysunday.com",0],["fraudclatterflyingcar.com",0],["launchreliantcleaverriver.com",0],["matriculant401merited.com",0],["realfinanceblogcenter.com",0],["reputationsheriffkennethsand.com",0],["telyn610zoanthropy.com",0],["tubelessceliolymph.com",0],["tummulerviolableness.com",0],["un-block-voe.net",0],["v-o-e-unblock.com",0],["voe-un-block.com",0],["voeun-block.net",0],["voeunbl0ck.com",0],["voeunblck.com",0],["voeunblk.com",0],["voeunblock.com",0],["voeunblock1.com",0],["voeunblock2.com",0],["voeunblock3.com",0],["webloadedmovie.com",0],["embedo.co",0],["embed-player.space",0],["imdbembed.xyz",0],["gratflix.org",0],["bestcash2020.com",0],["missav.com",0],["missav123.com",0],["missav789.com",0],["lrepacks.net",0],["komikav.com",0],["bc.vc",0],["larsenik.com",0],["yout.pw",0],["veryfreeporn.com",0],["korall.xyz",0],["moonmov.pro",0],["nosteam.ro",0],["nosteamgames.ro",0],["link.paid4link.net",0],["mlb66.ir",0],["ddl-francais.com",0],["bokeponlineterbaru.xyz",0],["ier.ai",0],["komiklokal.me",0],["apl161.me",0],["moddroid.com",0],["enit.in",0],["streamservicehd.click",0],["alexsports.xyz",0],["oii.io",0],["bestlinkz.xyz",0],["divxfilmeonline.net",0],["vidscdns.com",0],["novelssites.com",0],["mdn.lol",0],["techydino.net",0],["redload.co",0],["manhwadesu.me",0],["watchanime.video",0],["repelishd.com.ar",0],["infinitehentai.com",0],["domainwheel.com",0],["adshnk.com",0],["fembed9hd.com",0],["ssyoutube.com",0],["mov18plus.cloud",0],["shareus.in",0],["videos.remilf.com",0],["uploadgig.com",0],["protege-liens.com",0],["mega4upload.com",0],["woffxxx.com",0],["sitefilme.com",0],["uberhumor.com",0],["audiotruyenfull.com",0],["emturbovid.com",0],["oxydti.xyz",0],["xxxshake.com",0],["guccihide.com",0],["dmcdn.xyz",0],["dmcdn2.xyz",0],["thisisrussia.io",0],["streamtb.me",0],["tuborstb.co",0],["filmeonline2018.net",0],["doplay.store",0],["watchtamilmv.com",0],["ntuplay.xyz",0],["nhl66.ir",0],["watchaccordingtojimonline.com",0],["watchcalifornicationonline.com",0],["watchdowntonabbeyonline.com",0],["watcheronline.net",0],["watchhouseonline.net",0],["watchmalcolminthemiddle.com",0],["watchonlyfoolsandhorses.com",0],["watchprettylittleliarsonline.com",0],["watchrulesofengagementonline.com",0],["watchsuitsonline.net",0],["watchlostonline.net",0],["sexypornpictures.org",0],["shopforex.online",0],["173.249.8.3",0],["188.166.182.72",0],["blogtechh.com",0],["tii.la",0],["hentaihd.cyou",0],["javsubindo.one",0],["freevpshere.com",0],["softwaresolutionshere.com",0],["cryptosh.pro",0],["mycloud4.online",0],["besargaji.com",0],["hanime.xxx",0],["cazztv.xyz",0],["streamvid.net",0],["sexvideos.host",0],["stagatvfiles.com",0],["vtbe.net",0],["player.gayfor.us",0],["gainl.ink",0],["embedgram.com",0],["dlupload.com",0],["telenovelas-turcas.com.es",0],["crack-status.com",0],["up-4ever.net",0],["steamcrackedgames.com",0],["jeniusplay.com",0],["furher.in",0],["vidpro.net",0],["embedaio.cc",0],["cuevana8.com",0],["kimcilonly.top",0],["suaurl.com",0],["bestx.stream",0],["moviesapi.club",0],["sekaikomik.bio",0],["kukaj.io",0],["dinnerexa.com",0],["dinneroga.com",0],["gameophobias.com",0],["hindimearticles.net",0],["solution-hub.com",0],["tnp98.xyz",0],["ophim.vip",0],["abysscdn.com",1],["freeplayervideo.com",1],["nazarickol.com",1],["player-cdn.com",1],["fc.lc",1],["javjunkies.com",1],["hihihaha1.xyz",1],["adclickersbot.com",1],["mwpaste.com",2],["twitch.tv",3],["hotpornfile.org",6],["olympicstreams.me",7],["za.gl",8],["foxseotools.com",9],["sendvid.com",12],["ytmp3.cc",14],["workink.click",16],["rentbyowner.com",17],["embedy.me",18],["sekilastekno.com",[19,41]],["underhentai.net",20],["imgair.net",21],["imgblaze.net",21],["imgfrost.net",21],["pixsera.net",21],["vestimage.site",21],["imgwia.buzz",21],["imgux.buzz",21],["imgewe.buzz",21],["imguebr.buzz",21],["imgbew.buzz",21],["imgxxxx.buzz",21],["imgeza.buzz",21],["imgzzzz.buzz",21],["imgxhfr.buzz",21],["imgqwt.buzz",21],["imgtwq.buzz",21],["imgbjryy.buzz",21],["imgjetr.buzz",21],["imgxelz.buzz",21],["imgytreq.buzz",21],["mrlzqoe.buzz",21],["utinwpqqui.buzz",21],["pyotinle.buzz",21],["velnibug.buzz",21],["optiye.buzz",21],["imgbeaw.buzz",21],["imgnfg.buzz",21],["imguqkt.buzz",21],["imgxhgh.buzz",21],["imgwelz.buzz",21],["pixnbvj.buzz",21],["imgxkhm.buzz",21],["imagepuitr.buzz",21],["imagent.buzz",21],["imgjtuq.buzz",21],["imgkixx.buzz",21],["im1.buzz",21],["imgkux.buzz",21],["imgpiluka.website",21],["imgxhtue.website",21],["imgpuloki.online",21],["imgmilu.store",21],["picliume.store",21],["pixmela.online",21],["imgpukrr.site",21],["picuekr.site",21],["pixotor.cfd",21],["imgmgh.site",21],["imgnefl.site",21],["imglekw.site",21],["imgsdi.site",21],["imgneor.store",21],["imgsdi.store",21],["imgpukxxr.site",21],["imgsdi.website",21],["imgsxo.site",21],["imgxto.store",21],["imgutkr.store",21],["imghhr.online",21],["imglaiw.store",21],["imgotw.store",21],["imgpai.online",21],["imgqyrew.store",21],["imgutkr.online",21],["imgvue.online",21],["imgxgf.store",21],["imgxqy.online",21],["imgbibam.online",21],["imgngf.online",21],["imgqaz.online",21],["imgulur.online",21],["imgurj.online",21],["imgurt.online",21],["imgwtz.online",21],["imgwxr.online",21],["imgwzr.online",21],["imgyre.online",21],["imgbak.store",21],["imgbek.store",21],["picler.store",21],["piclerx.store",21],["piclerz.store",21],["pixlev.store",21],["pixmax.store",21],["pixmex.store",21],["imgbaex.store",21],["imgbah.online",21],["imgbaie.online",21],["imgbango.store",21],["imgbier.store",21],["imgbimn.store",21],["imgbqw.store",21],["imgbuba.online",21],["imgbwe.store",21],["imgbxs.online",21],["imgcao.store",21],["imgnwe.online",21],["imgqge.store",21],["imgqxb.online",21],["imgteq.online",21],["imgtex.online",21],["imgtuta.online",21],["imgwqr.online",21],["imgwww.store",21],["imgxza.store",21],["imgezx.sbs",21],["imgbcxsb.store",21],["imgbcxs.store",21],["imgbake.cfd",21],["imgmffg.sbs",21],["imgmffgtr.sbs",21],["imgnbg.sbs",21],["imgngc.sbs",21],["imgnmh.cfd",21],["imgqte.sbs",21],["imguthes.sbs",21],["imgwag.cfd",21],["imgwang.cfd",21],["imgwety.sbs",21],["imgxuh.cfd",21],["imgxytw.cfd",21],["imgycgey.sbs",21],["imgyruy.cfd",21],["imgyusa.cfd",21],["imgyyqey.sbs",21],["imgyer.store",21],["imgxhs.store",21],["imgwekr.online",21],["imgwbfh.online",21],["imgwak.online",21],["imgutry.online",21],["imgutiyu.online",21],["imgutbbn.online",21],["imgubfd.online",21],["imgrei.online",21],["imgqec.online",21],["imgpaiou.online",21],["imgpaiki.online",21],["imgmjj.store",21],["imgfa.store",21],["imgbutrt.store",21],["imgbty.store",21],["imgbdl.store",21],["imgngh.sbs",21],["imgbbfg.pics",21],["imgjhrjjr.pics",21],["tr.link",22],["cshort.org",23],["dosya.tc",24],["cloudemb.com",26],["sbot.cf",0],["vidello.net",0],["mitedrive.com",0],["miteblog.com",0],["ythub.cc",27],["easymp3converter.com",28],["go-mp3.com",29],["lineageos18.com",30],["coinsearns.com",31],["luckydice.net",31],["ytsubme.com",32],["driveup.in",33],["mp3juices.yt",34],["chillx.top",35],["beastx.top",35],["playerx.stream",35],["1ytmp3.com",36],["bestmp3converter.com",36],["clickmp3.com",36],["hentaiworld.tv",37],["techacode.com",38],["mtraffics.com",39],["ytmates.com",39],["video-to-mp3-converter.com",40],["pinloker.com",41],["fikper.com",42],["kmo.to",43]]);

const entitiesMap = new Map([["1337x",0],["x1337x",0],["wcostream",0],["xhamster13",0],["slreamplay",0],["steamplay",0],["steanplay",0],["stemplay",0],["streamp1ay",0],["streanplay",0],["streampiay",0],["fmovies",0],["youtubedownloader",0],["kimcartoon",0],["plylive",0],["plyvdo",0],["putlockerc",0],["putlockertv",0],["vidsrc",0],["mylink",0],["my1ink",0],["myl1nk",0],["myli3k",0],["yts",0],["hqq",0],["adshort",0],["adsrt",0],["tube8",0],["europixhd",0],["topeuropix",0],["watch-series",0],["watchseries",0],["gogoanime",0],["gogoanimes",0],["gogoanimetv",0],["imgdew",0],["imgmaze",0],["imgoutlet",0],["imgtown",0],["imgview",0],["dewimg",0],["imgrock",0],["imgviu",0],["mazpic",0],["outletpic",0],["picrok",0],["capshd",0],["rojadirectatvlive",0],["1movies",0],["jkanime",0],["pelisplus",0],["pelisplushd",0],["pouvideo",0],["povvideo",0],["povvldeo",0],["povw1deo",0],["povwideo",0],["powv1deo",0],["powvibeo",0],["powvideo",0],["powvldeo",0],["arenavision",0],["ciberdvd",0],["pornfay",0],["camwhores",0],["camwhorestv",0],["redtube",0],["ettv",0],["ver-pelis",0],["newpelis",0],["pelix",0],["onlinevideoconverter",0],["adfloz",0],["movies123",0],["voirfilms",0],["vidcloud",0],["iframejav",0],["file-upload",0],["savemedia",0],["telerium",0],["9xbuddy",0],["asianclub",0],["vidmoly",0],["mixdrop",0],["mixdrp",0],["mixdroop",0],["123moviesfree",0],["yesmovies",0],["solarmovie",0],["zeefiles",0],["mega4up",0],["bdiptv",0],["cinemalibero",0],["gomovies",0],["gomoviesc",0],["cloudvideotv",0],["123movierulz",0],["7movierulz1",0],["7moviesrulz",0],["movieruls",0],["movierulz",0],["movierulzfree",0],["movierulz2free",0],["movierulzs",0],["movierulzwatch",0],["movierulzz",0],["moviesrulz",0],["moviesrulzfree",0],["topflix",0],["allfeeds",0],["daddylive",0],["sporting77",0],["teleriumtv",0],["uploadev",0],["thefmovies",0],["sk-ip",0],["keepvid",0],["ustream",0],["upvid",0],["ssrmovies",0],["moviflex",0],["fembed",0],["mavplay",0],["videobb",0],["123mkv",0],["pornhub",0],["megavideo",0],["pandamovie",0],["speedporn",0],["watchpornfree",0],["okanime",0],["linkshub",0],["tmearn",0],["filedown",0],["ffmovies",0],["beinmatch",0],["mrpiracy",0],["shorten",0],["123anime",0],["ytmp3",0],["gnula",0],["sobatkeren",0],["movieon21",0],["pelispedia24",0],["pelis28",0],["remaxhd",0],["nemenlake",0],["animeblix",0],["gosemut",0],["dropgalaxy",0],["zone-annuaire",0],["uploadhub",0],["mm9844",0],["adblockeronstape",0],["adblockstreamtape",0],["adblockstrtape",0],["adblockstrtech",0],["antiadtape",0],["shavetape",0],["stapadblockuser",0],["stape",0],["strcloud",0],["streamadblockplus",0],["streamta",0],["streamadblocker",0],["streamtape",0],["streamtapeadblock",0],["streamtapeadblockuser",0],["strtape",0],["strtapeadblock",0],["strtapeadblocker",0],["strtapewithadblock",0],["strtpe",0],["vidop",0],["seriemega",0],["isohunt",0],["megaflix",0],["drtuber",0],["ilgeniodellostreaming",0],["vid4up",0],["gototub",0],["sportbar",0],["youtubetomp3",0],["9xmovies",0],["shortzzy",0],["rojadirecta",0],["movidy",0],["downloadhub",0],["hubstream",0],["proxybit",0],["openloadmov",0],["wawacity",0],["hubdrive",0],["dl-protect",0],["0gomovies",0],["player.msmini",0],["player.sbnmp",0],["netuplayer",0],["vapley",0],["moviehdf",0],["hd21",0],["iceporn",0],["nuvid",0],["tubeon",0],["vivatube",0],["winporn",0],["yeptube",0],["streamsport",0],["ytc",0],["shahid4u",0],["watchonlinemoviespk",0],["streamhub",0],["javembed",0],["sexy-games",0],["todaypk",0],["todaypktv",0],["1todaypk",0],["usagoals",0],["uproxy",0],["oyohd",0],["720pstream",0],["inextmovies",0],["mp4moviez",0],["buffstreams",0],["4movierulz1",0],["filmygod6",0],["watchmovierulz",0],["streamsb",0],["ofilmywap",0],["kannadamasti",0],["buyjiocoin",0],["filmygod13",0],["ucanwatch",0],["userload",0],["videovard",0],["mp3juices",0],["milfnut",0],["moviemad",0],["mymp3song",0],["akoam",0],["9xmovie",0],["4stream",0],["teluguonlinemovies",0],["cricfree",0],["cricplay2",0],["primetubsub",0],["eztv",0],["theproxy",0],["filmeserialegratis",0],["fsplayer",0],["onlinewatchmoviespk",0],["younetu",0],["hdmoviesmaza",0],["voe-unblock",0],["voe",0],["apkmody",0],["extratorrent",0],["torrentstatus",0],["yts2",0],["y2mate",0],["poscitech",0],["filemoon",0],["adblockeronstreamtape",0],["financerites",0],["crichd",0],["movies2watch",0],["tirexo",0],["weloma",0],["filepress",0],["zone-telechargement",0],["pobre",0],["8xmovies",0],["adblocktape",0],["cyberleaks",0],["opvid",0],["thenextplanet1",0],["vev",1],["vidup",1],["wstream",1],["strikeout",4],["desbloqueador",5],["viprow",7],["vipstand",7],["vipboxtv",7],["atomohd",10],["atomixhq",11],["pctfenix",11],["pctnew",11],["vidstream",13],["gdriveplayer",15],["pixlev",21],["newdmn",25],["camcaps",0]]);

const exceptionsMap = new Map([]);

/******************************************************************************/

function noWindowOpenIf(
    pattern = '',
    delay = '',
    decoy = ''
) {
    const safe = safeSelf();
    const targetMatchResult = pattern.startsWith('!') === false;
    if ( targetMatchResult === false ) {
        pattern = pattern.slice(1);
    }
    const rePattern = safe.patternToRegex(pattern);
    let autoRemoveAfter = parseInt(delay);
    if ( isNaN(autoRemoveAfter) ) {
        autoRemoveAfter = -1;
    }
    const extraArgs = safe.getExtraArgs(Array.from(arguments), 3);
    const logLevel = shouldLog(extraArgs);
    const createDecoy = function(tag, urlProp, url) {
        const decoyElem = document.createElement(tag);
        decoyElem[urlProp] = url;
        decoyElem.style.setProperty('height','1px', 'important');
        decoyElem.style.setProperty('position','fixed', 'important');
        decoyElem.style.setProperty('top','-1px', 'important');
        decoyElem.style.setProperty('width','1px', 'important');
        document.body.appendChild(decoyElem);
        setTimeout(( ) => { decoyElem.remove(); }, autoRemoveAfter * 1000);
        return decoyElem;
    };
    window.open = new Proxy(window.open, {
        apply: function(target, thisArg, args) {
            const haystack = args.join(' ');
            if ( logLevel ) {
                safe.uboLog('window.open:', haystack);
            }
            if ( rePattern.test(haystack) !== targetMatchResult ) {
                return Reflect.apply(target, thisArg, args);
            }
            if ( autoRemoveAfter < 0 ) { return null; }
            const decoyElem = decoy === 'obj'
                ? createDecoy('object', 'data', ...args)
                : createDecoy('iframe', 'src', ...args);
            let popup = decoyElem.contentWindow;
            if ( typeof popup === 'object' && popup !== null ) {
                Object.defineProperty(popup, 'closed', { value: false });
            } else {
                const noopFunc = (function(){}).bind(self);
                popup = new Proxy(self, {
                    get: function(target, prop) {
                        if ( prop === 'closed' ) { return false; }
                        const r = Reflect.get(...arguments);
                        if ( typeof r === 'function' ) { return noopFunc; }
                        return target[prop];
                    },
                    set: function() {
                        return Reflect.set(...arguments);
                    },
                });
            }
            if ( logLevel ) {
                popup = new Proxy(popup, {
                    get: function(target, prop) {
                        safe.uboLog('window.open / get', prop, '===', target[prop]);
                        return Reflect.get(...arguments);
                    },
                    set: function(target, prop, value) {
                        safe.uboLog('window.open / set', prop, '=', value);
                        return Reflect.set(...arguments);
                    },
                });
            }
            return popup;
        }
    });
}

function safeSelf() {
    if ( scriptletGlobals.has('safeSelf') ) {
        return scriptletGlobals.get('safeSelf');
    }
    const self = globalThis;
    const safe = {
        'Error': self.Error,
        'Object_defineProperty': Object.defineProperty.bind(Object),
        'RegExp': self.RegExp,
        'RegExp_test': self.RegExp.prototype.test,
        'RegExp_exec': self.RegExp.prototype.exec,
        'XMLHttpRequest': self.XMLHttpRequest,
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

function shouldLog(details) {
    if ( details instanceof Object === false ) { return false; }
    return scriptletGlobals.has('canDebug') && details.log;
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
    try { noWindowOpenIf(...argsList[i]); }
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

// Not Firefox
if ( typeof wrappedJSObject !== 'object' ) {
    return uBOL_noWindowOpenIf();
}

// Firefox
{
    const page = self.wrappedJSObject;
    let script, url;
    try {
        page.uBOL_noWindowOpenIf = cloneInto([
            [ '(', uBOL_noWindowOpenIf.toString(), ')();' ],
            { type: 'text/javascript; charset=utf-8' },
        ], self);
        const blob = new page.Blob(...page.uBOL_noWindowOpenIf);
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
    delete page.uBOL_noWindowOpenIf;
}

/******************************************************************************/

// End of local scope
})();

/******************************************************************************/

void 0;
