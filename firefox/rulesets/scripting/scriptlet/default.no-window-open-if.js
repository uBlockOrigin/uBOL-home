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
/* global cloneInto */

// ruleset: default

/******************************************************************************/

// Important!
// Isolate from global scope

// Start of local scope
(( ) => {

/******************************************************************************/

// Start of code to inject
const uBOL_noWindowOpenIf = function() {

const scriptletGlobals = {}; // eslint-disable-line

const argsList = [[],["amazon-adsystem"],["|"],["","10"],["given"],["!uploadbank","10","obj"],["!bergblock","10"],["//"],["!za.gl","0"],["!?safelink_redirect="],["adblock","1","obj"],["!atomtt"],["!/download\\/|link/"],["!/^https:\\/\\/sendvid\\.com\\/[0-9a-z]+$/"],["/^/","1"],["!api?call=","10","obj"],["!/ytmp3|dropbox/"],["!gdrivedownload"],["!refine?search"],["!embedy"],["wapka"],["!t.me"],["!/prcf.fiyar|themes|pixsense|.jpg/"],["ppcnt"],["","1"],["!direct"],["/^/","15"],["_blank"],["?key="],["!koyso.com"],["!self"],["!blogspot"],["!hidan.sh"],["!vidhidepre.com"],["shutterstock.com"],["!tubidi.buzz"],["/aff|jump/"],["php"],["tempat.org"],["","5"],["!buzzheavier.com"],["/wheceelt\\.net|shopee\\./","10","obj"],["onclickmega"],["!dosya","1"],["!newdmn","1"],["!/^\\/d\\//"],["!yt2api"],["!clickmp3"],["bitcoins-update.blogspot.com"],["!coinsearns.com"],["youtube"],["/^/","0"],["!ytcutter.net"],["!/d/"],["!download"],["/xlirdr|hotplay\\-games|hyenadata/"],["!/^\\//"],["/\\.(com|net)\\/4\\//"],["!shrdsk"],["!/^\\/download\\//"],["!abyss.to","1"],["!zuperdrive"],["","0.3","blank"]];

const hostnamesMap = new Map([["afreesms.com",0],["hltv.org",0],["mcloud.bz",0],["vidstream.pro",0],["dailyuploads.net",0],["putlocker-website.com",0],["filescdn.com",0],["deportealdia.live",0],["watchmyexgf.net",0],["upload-4ever.com",0],["vortez.net",0],["porn.com",0],["katestube.com",0],["mangoporn.net",0],["nwanime.tv",0],["chooyomi.com",0],["shooshtime.com",0],["picturelol.com",0],["imgspice.com",0],["pornhd.com",0],["bigtitsxxxsex.com",0],["vivud.com",0],["empflix.com",0],["anyporn.com",0],["magnetdl.com",0],["magnetdl.org",0],["short.pe",0],["donkparty.com",0],["dz4link.com",0],["tubemania.org",0],["webdesigndev.com",0],["imageweb.ws",0],["vidoza.net",0],["pelispop.net",0],["streampelis.club",0],["gamcore.com",0],["porcore.com",0],["69games.xxx",0],["vintage-erotica-forum.com",0],["momondo.com",0],["hentai2read.com",0],["lolhentai.net",0],["mangafreak.me",0],["hotscope.tv",0],["micloudfiles.com",0],["assia.tv",0],["assia4.com",0],["assia24.com",0],["seatguru.com",0],["asiananimaltube.org",0],["zoosex.pink",0],["pornrabbit.com",0],["cartoonporno.xxx",0],["youpornru.com",0],["hubfiles.ws",0],["uii.io",0],["powforums.com",0],["zmovs.com",0],["spycock.com",0],["cut-fly.com",0],["cine24.online",0],["xrivonet.info",0],["gounlimited.to",0],["shortit.pw",0],["pornve.com",0],["sawlive.tv",0],["veekyforums.com",0],["cutpaid.com",0],["televisionlibre.net",0],["durtypass.com",0],["opjav.com",0],["nhentai.net",0],["forexlap.com",0],["cambay.tv",0],["camwhoreshd.com",0],["camwhorespy.com",0],["cwtvembeds.com",0],["x08.ovh",0],["zegtrends.com",0],["fileone.tv",0],["mdbekjwqa.pw",0],["mdfx9dc8n.net",0],["mdzsmutpcvykb.net",0],["mixdrop21.net",0],["mixdropjmk.pw",0],["xpics.me",0],["milfzr.com",0],["pandamovies.pw",0],["simsdom.com",0],["cloudvideo.tv",0],["kinoger.ru",0],["xxxbunker.com",0],["clasicotas.org",0],["watchmoviesrulz.com",0],["sexgalaxy.net",0],["noticiasesports.live",0],["googlvideo.com",0],["streamporn.pw",0],["zplayer.live",0],["faucethero.com",0],["720pxmovies.blogspot.com",0],["software-on.com",0],["cdna.tv",0],["cam4.com",0],["filerio.in",0],["ckk.ai",0],["shemalepower.xyz",0],["dlkoo.com",0],["bitcoinminingforex.blogspot.com",0],["vladan.fr",0],["losporn.org",0],["embedsito.com",0],["films5k.com",0],["javcl.me",0],["mavlecteur.com",0],["playfinder.xyz",0],["ujav.me",0],["tpxanime.in",0],["welovestream.xyz",0],["dreamfancy.org",0],["pornult.com",0],["nonktube.com",0],["tusfiles.com",0],["adultdvdparadise.com",0],["freeomovie.info",0],["fullxxxmovies.me",0],["mangoparody.com",0],["mangoporn.co",0],["netflixporno.net",0],["pandamovies.me",0],["playpornfree.xyz",0],["pornkino.cc",0],["pornwatch.ws",0],["watchfreexxx.pw",0],["watchxxxfree.pw",0],["xopenload.pw",0],["xtapes.me",0],["xxxmoviestream.xyz",0],["xxxparodyhd.net",0],["xxxscenes.net",0],["xxxstream.me",0],["youwatchporn.com",0],["skeimg.com",0],["4share.vn",0],["0xxx.ws",0],["ucptt.com",0],["exe.io",0],["exe.app",0],["skincarie.com",0],["fullhdxxx.com",0],["viptube.com",0],["homemature.net",0],["kingsofteens.com",0],["hentaihere.com",0],["yandexcdn.com",0],["iguarras.com",0],["peliculaspornomega.net",0],["adsafelink.com",0],["aii.sh",0],["czechvideo.org",0],["gfsvideos.com",0],["imagehaha.com",0],["vupload.com",0],["series-d.com",0],["naughtymachinima.com",0],["porn00.org",0],["savevideo.tube",0],["tr.savefrom.net",0],["xanimeporn.com",0],["bacakomik.co",0],["porngo.com",0],["streamplusvip.xyz",0],["dr-farfar.com",0],["yeswegays.com",0],["youramateurtube.com",0],["webtor.io",0],["luscious.net",0],["makemoneywithurl.com",0],["dflix.top",0],["gomo.to",0],["cryptofuns.ru",0],["animetemaefiore.club",0],["naniplay.com",0],["savesubs.com",0],["seriesynovelas.online",0],["interracial.com",0],["fatwhitebutt.com",0],["smplace.com",0],["slaughtergays.com",0],["sexiestpicture.com",0],["sassytube.com",0],["vipergirls.to",0],["xh.video",0],["lkc21.net",0],["freegogpcgames.com",0],["smiechawatv.pl",0],["tudogamesbr.com",0],["dogemate.com",0],["shurt.pw",0],["d0000d.com",0],["d000d.com",0],["d0o0d.com",0],["do0od.com",0],["doods.pro",0],["ds2play.com",0],["ds2video.com",0],["fakyutube.com",0],["kokostream.net",0],["xvideos.com",0],["xvideos2.com",0],["katfile.com",0],["hentaihaven.xxx",0],["itv.com",0],["1azayf9w.xyz",0],["c4qhk0je.xyz",0],["defienietlynotme.com",0],["filemooon.top",0],["fmembed.cc",0],["fmhd.bar",0],["fmoonembed.pro",0],["rgeyyddl.skin",0],["sbnmp.bar",0],["sulleiman.com",0],["vpcxz19p.xyz",0],["an1.com",0],["forexwikitrading.com",0],["westmanga.fun",0],["getmodsapk.com",0],["nyaa.land",0],["pornx.to",0],["infinityscans.xyz",0],["infinityscans.net",0],["linkos.info",0],["photogen.hair",0],["pastetot.com",0],["movies7.to",0],["mmsmaza.com",0],["y2tube.pro",0],["player.javboys.cam",0],["ebaticalfel.com",0],["fansmega.com",0],["iedprivatedqu.com",0],["stownrusis.com",0],["sex-empire.org",0],["sexempire.xyz",0],["94.103.83.138",0],["cuervotv.me",0],["apl341.me",0],["apl323.me",0],["apl332.me",0],["apl340.me",0],["1stream.eu",0],["roystream.com",0],["kimdesene.org",0],["factorp.xyz",0],["erothots.co",0],["flvto.com.co",0],["7mm003.cc",0],["7mmtv.sx",0],["javporn.tv",0],["mm9845.com",0],["ncdnx3.xyz",0],["mp3y.info",0],["netu.frembed.fun",0],["pay4fans.com",0],["filegram.to",0],["freemp3.tube",0],["ytmp3s.nu",0],["clifnewz.online",0],["weirdwolf.net",0],["linksshub.lol",0],["girlmms.com",0],["ottxmaza.com",0],["sexmazahd.com",0],["webxmaza.com",0],["chasingthedonkey.com",0],["usgate.xyz",0],["autoembed.cc",0],["oaaxpgp3.xyz",0],["cineb.rs",0],["g-porno.com",0],["g-streaming.com",0],["giga-streaming.com",0],["giga-uqload.xyz",0],["mlbstreaming.live",0],["lovetofu.cyou",0],["alldeepfake.ink",0],["swiftuploads.com",0],["javplayer.me",0],["scoreland.biz",0],["scoreland.name",0],["get-to.link",0],["enit.in",0],["birdurls.com",0],["tmail.io",0],["gainl.ink",0],["promo-visits.site",0],["shorterall.com",0],["finish.addurl.biz",0],["financebolo.com",0],["rphost.in",0],["vedamdigi.tech",0],["cancelguider.online",0],["adsfly.in",0],["tvi.la",0],["iir.la",0],["tii.la",0],["oko.sh",0],["oei.la",0],["blogtechh.com",0],["lnbz.la",0],["techbixby.com",0],["blogmyst.com",0],["wp2host.com",0],["insmyst.com",0],["host-buzz.com",0],["oii.io",0],["sfile.mobi",0],["tutwuri.id",0],["link.paid4link.com",0],["l2db.info",0],["fastpeoplesearch.com",0],["leolist.cc",0],["smutty.com",0],["kropic.com",0],["beeg.party",0],["mm9842.com",0],["advertisertape.com",0],["gettapeads.com",0],["streamnoads.com",0],["tapeadsenjoyer.com",0],["tapeadvertisement.com",0],["tapeantiads.com",0],["tapeblocker.com",0],["tapelovesads.org",0],["tapenoads.com",0],["tapewithadblock.org",0],["gaystream.online",0],["twistedporn.com",0],["ymp4.download",0],["xxxonlinegames.com",0],["watchpornx.com",0],["wiztube.xyz",0],["digjav.com",0],["sonline.pro",0],["2conv.com",0],["flvto.biz",0],["flv2mp3.by",0],["down-paradise.com",0],["linksly.co",0],["ddownr.com",0],["keepv.id",0],["savethevideo.com",0],["savefrom.net",0],["iseekgirls.com",0],["milapercia.com",0],["windows-1.com",0],["siteunblocked.info",0],["theproxy.app",0],["watch-jav-english.live",0],["planet-streaming1.com",0],["deseneledublate.com",0],["wordcounter.icu",0],["shortenbuddy.com",0],["alleneconomicmatter.com",0],["bethshouldercan.com",0],["bradleyviewdoctor.com",0],["brookethoughi.com",0],["brucevotewithin.com",0],["cindyeyefinal.com",0],["donaldlineelse.com",0],["edwardarriveoften.com",0],["erikcoldperson.com",0],["graceaddresscommunity.com",0],["heatherdiscussionwhen.com",0],["housecardsummerbutton.com",0],["jamesstartstudent.com",0],["jamiesamewalk.com",0],["jasminetesttry.com",0],["jasonresponsemeasure.com",0],["jayservicestuff.com",0],["jessicaglassauthor.com",0],["johntryopen.com",0],["josephseveralconcern.com",0],["kathleenmemberhistory.com",0],["kennethofficialitem.com",0],["lisatrialidea.com",0],["loriwithinfamily.com",0],["lukecomparetwo.com",0],["markstyleall.com",0],["michaelapplysome.com",0],["morganoperationface.com",0],["nonesnanking.com",0],["paulkitchendark.com",0],["phenomenalityuniform.com",0],["prefulfilloverdoor.com",0],["rebeccaneverbase.com",0],["roberteachfinal.com",0],["robertplacespace.com",0],["ryanagoinvolve.com",0],["sandrataxeight.com",0],["seanshowcould.com",0],["sethniceletter.com",0],["shannonpersonalcost.com",0],["sharonwhiledemocratic.com",0],["vincentincludesuccessful.com",0],["ohentai.org",0],["nuuuppp.online",0],["sinfoniarossini.com",0],["liveonscore.tv",0],["vpn-anbieter-vergleich-test.de",0],["gayvidsclub.com",0],["tits-guru.com",0],["miuiku.com",0],["savelink.site",0],["hentaidude.com",0],["opvid.net",0],["kaplog.com",0],["downloadtwittervideo.com",0],["kiwiexploits.com",0],["thejournal.ie",0],["cdnqq.net",0],["cdn1.fastvid.co",0],["movi.pk",0],["ncdn22.xyz",0],["netu.ac",0],["adultfun.net",0],["sanoybonito.club",0],["7misr4day.com",0],["aquiyahorajuegos.net",0],["hotflix.cc",0],["ontiva.com",0],["gaysearch.com",0],["aniwatch.pro",0],["hianime.to",0],["moviekids.tv",0],["www-y2mate.com",0],["cararegistrasi.com",0],["booru.eu",0],["borwap.xxx",0],["centralboyssp.com.br",0],["czxxx.org",0],["filmdelisi.co",0],["filmovitica.com",0],["foxtube.com",0],["hd-xxx.me",0],["ipornxxx.net",0],["itsfuck.com",0],["javideo.pw",0],["lametrofitness.net",0],["longporn.xyz",0],["matureworld.ws",0],["mp3-convert.org",0],["stilltube.com",0],["streamm4u.club",0],["teenage-nudists.net",0],["xvideos.name",0],["xxx-videos.org",0],["xxxputas.net",0],["youpornfm.com",0],["maxtubeporn.net",0],["vidsvidsvids.com",0],["hentaicomics.pro",0],["y2mate.guru",0],["javstream.top",0],["watchtodaypk.com",0],["assia1.tv",0],["msubplix.com",0],["myyouporn.com",0],["convert2mp3.club",0],["embedstream.me",0],["nolive.me",0],["vrporngalaxy.com",0],["stem-cells-news.com",0],["javynow.com",0],["yifytorrentme.com",0],["blog.aming.info",0],["toopl.xyz",0],["youtubemp3.us",0],["yt-api.com",0],["afilmyhouse.blogspot.com",0],["pagalworld.us",0],["coinurl.net",0],["videowood.tv",0],["spicyandventures.com",0],["haes.tech",0],["hd44.com",0],["kaotic.com",0],["highstream.tv",0],["freeadultcomix.com",0],["crazyblog.in",0],["desitab69.sextgem.com",0],["javquick.com",0],["frebieesforyou.net",0],["shemalestube.com",0],["hxfile.co",0],["pussy.org",0],["analsexstars.com",0],["theicongenerator.com",0],["zentum.club",0],["cloudrls.com",0],["ybm.pw",0],["lordhd.com",0],["paid4.link",0],["serialeonline.biz",0],["alocdn.co",0],["pajalusta.club",0],["maxstream.video",0],["maxlinks.online",0],["videoseyred.in",0],["www-daftarharga.blogspot.com",0],["xbox360torrent.com",0],["arenaboard.xyz",0],["go.gets4link.com",0],["lightnovelpdf.com",0],["keepvid.pw",0],["toolsolutions.top",0],["wowstream.top",0],["convert2mp3.cx",0],["mp3dl.cc",0],["coinsparty.com",0],["fifaultimateteam.it",0],["bowfile.com",0],["1cloudfile.com",0],["gayvl.net",0],["covrhub.com",0],["fapcat.com",0],["pixroute.com",0],["uploady.io",0],["kinas.tv",0],["thienhatruyen.com",0],["witanime.com",0],["clk.asia",0],["linka.click",0],["miraculous.to",0],["av01.tv",0],["bigyshare.com",0],["glotorrents.fr-proxy.com",0],["glotorrents.theproxy.ws",0],["wapsing.com",0],["apiyt.com",0],["masstamilans.com",0],["okmusi.com",0],["ytmp3x.com",0],["snowurl.com",0],["webpornblog.com",0],["cam-video.xxx",0],["svetserialu.to",0],["blu-ray.com",0],["mdy48tn97.com",0],["fitnakedgirls.com",0],["mrgay.com",0],["best-cpm.com",0],["webhostingpost.com",0],["xvideos.wptri.com",0],["tutorialspots.com",0],["phica.net",0],["streambee.to",0],["streamers.watch",0],["emb.x179759.apl123.me",0],["emb.x187106.apl152.me",0],["techgeek.digital",0],["supersextube.pro",0],["h-flash.com",0],["ponselharian.com",0],["hakie.net",0],["vtube.to",0],["vidplaystream.top",0],["tubeload.co",0],["whcp4.com",0],["flixtor.stream",0],["yourtehzeeb.com",0],["onlymp3.to",0],["hindimovies.to",0],["movieswatch24.pk",0],["watchonlinemovies15.pk",0],["loadx.ws",0],["piraproxy.app",0],["driveplayer.net",0],["hindimoviestv.com",0],["watchpk.live",0],["k1nk.co",0],["watchonlinehd123.sbs",0],["acrackstreams.com",0],["3hentai.net",0],["layarkacaxxi.icu",0],["valeronevijao.com",0],["cigarlessarefy.com",0],["figeterpiazine.com",0],["yodelswartlike.com",0],["generatesnitrosate.com",0],["crownmakermacaronicism.com",0],["chromotypic.com",0],["gamoneinterrupted.com",0],["metagnathtuggers.com",0],["wolfdyslectic.com",0],["rationalityaloelike.com",0],["sizyreelingly.com",0],["simpulumlamerop.com",0],["urochsunloath.com",0],["monorhinouscassaba.com",0],["counterclockwisejacky.com",0],["35volitantplimsoles5.com",0],["scatch176duplicities.com",0],["antecoxalbobbing1010.com",0],["boonlessbestselling244.com",0],["cyamidpulverulence530.com",0],["guidon40hyporadius9.com",0],["449unceremoniousnasoseptal.com",0],["19turanosephantasia.com",0],["30sensualizeexpression.com",0],["321naturelikefurfuroid.com",0],["745mingiestblissfully.com",0],["availedsmallest.com",0],["greaseball6eventual20.com",0],["toxitabellaeatrebates306.com",0],["20demidistance9elongations.com",0],["audaciousdefaulthouse.com",0],["fittingcentermondaysunday.com",0],["fraudclatterflyingcar.com",0],["launchreliantcleaverriver.com",0],["matriculant401merited.com",0],["realfinanceblogcenter.com",0],["reputationsheriffkennethsand.com",0],["telyn610zoanthropy.com",0],["tubelessceliolymph.com",0],["tummulerviolableness.com",0],["un-block-voe.net",0],["v-o-e-unblock.com",0],["voe-un-block.com",0],["voeun-block.net",0],["voeunbl0ck.com",0],["voeunblck.com",0],["voeunblk.com",0],["voeunblock.com",0],["voeunblock1.com",0],["voeunblock2.com",0],["voeunblock3.com",0],["webloadedmovie.com",0],["embedo.co",0],["embed-player.space",0],["imdbembed.xyz",0],["gratflix.org",0],["bestcash2020.com",0],["missav123.com",0],["missav789.com",0],["myav.com",0],["komikav.com",0],["bc.vc",0],["larsenik.com",0],["yout.pw",0],["veryfreeporn.com",0],["korall.xyz",0],["moonmov.pro",0],["nosteam.ro",0],["nosteamgames.ro",0],["link.paid4file.com",0],["mlb66.ir",0],["ddl-francais.com",0],["ier.ai",0],["komiklokal.me",0],["moddroid.com",0],["streamservicehd.click",0],["alexsports.xyz",0],["divxfilmeonline.net",0],["vidscdns.com",0],["novelssites.com",0],["techydino.net",0],["redload.co",0],["manhwadesu.me",0],["watchanime.video",0],["repelishd.com.ar",0],["infinitehentai.com",0],["domainwheel.com",0],["adshnk.com",0],["fembed9hd.com",0],["ssyoutube.com",0],["apimate.net",0],["mov18plus.cloud",0],["shareus.in",0],["videos.remilf.com",0],["uploadgig.com",0],["protege-liens.com",0],["mega4upload.com",0],["peliculas8k.com",0],["woffxxx.com",0],["sitefilme.com",0],["uberhumor.com",0],["audiotruyenfull.com",0],["emturbovid.com",0],["findjav.com",0],["mmtv01.xyz",0],["stbturbo.xyz",0],["streamsilk.com",0],["xxxshake.com",0],["cdnm4m.nl",0],["guccihide.com",0],["thisisrussia.io",0],["streamtb.me",0],["stbpnetu.xyz",0],["tuborstb.co",0],["filmeonline2018.net",0],["doplay.store",0],["nhl66.ir",0],["watchaccordingtojimonline.com",0],["watchcalifornicationonline.com",0],["watchdowntonabbeyonline.com",0],["watcheronline.net",0],["watchhouseonline.net",0],["watchmalcolminthemiddle.com",0],["watchonlyfoolsandhorses.com",0],["watchprettylittleliarsonline.com",0],["watchrulesofengagementonline.com",0],["watchsuitsonline.net",0],["watchlostonline.net",0],["sexypornpictures.org",0],["shopforex.online",0],["173.249.8.3",0],["188.166.182.72",0],["hentaihd.cyou",0],["javsubindo.one",0],["hentaikai.com",0],["freevpshere.com",0],["softwaresolutionshere.com",0],["cryptosh.pro",0],["mycloud4.online",0],["besargaji.com",0],["hanime.xxx",0],["cazztv.xyz",0],["streamvid.net",0],["reshare.pm",0],["sexvideos.host",0],["stagatvfiles.com",0],["vtbe.net",0],["player.gayfor.us",0],["embedgram.com",0],["dlupload.com",0],["bembed.net",0],["elbailedeltroleo.site",0],["embedv.net",0],["fslinks.org",0],["listeamed.net",0],["v6embed.xyz",0],["vgplayer.xyz",0],["vid-guard.com",0],["vidguard.online",0],["telenovelas-turcas.com.es",0],["crack-status.com",0],["up-4ever.net",0],["steamcrackedgames.com",0],["jeniusplay.com",0],["furher.in",0],["vidpro.net",0],["embedaio.cc",0],["cuevana8.com",0],["kimcilonly.top",0],["bestx.stream",0],["moviesapi.club",0],["sekaikomik.bio",0],["designparty.sx",0],["kukaj.io",0],["dinnerexa.com",0],["dinneroga.com",0],["gameophobias.com",0],["hindimearticles.net",0],["solution-hub.com",0],["tnp98.xyz",0],["ophim.vip",0],["yt2conv.com",0],["linkz.wiki",0],["anichin.top",0],["hlsplayer.top",0],["69x.online",0],["superembeds.com",0],["embedrise.com",0],["lulustream.com",0],["luluvdo.com",0],["vtplayer.online",0],["fullassia.com",0],["newassia.com",0],["pesktop.com",0],["y2down.cc",0],["tainio-mania.online",0],["uploadsea.com",0],["sport7s01.com",0],["av-cdn.xyz",0],["niaomea.me",0],["javguard.xyz",0],["javturbo.xyz",0],["westmanga.org",0],["reality-quest.online",0],["dirtyvideo.fun",0],["fast-dl.co",0],["vidstreaming.xyz",0],["movie4night.com",0],["javggvideo.xyz",0],["player.bestrapeporn.com",0],["tinyzonetv.se",0],["metrolagu.cam",0],["player.euroxxx.net",0],["evelynthankregion.com",0],["lorimuchbenefit.com",0],["poophq.com",0],["veev.to",0],["spankbang.com",0],["spankbang.mov",0],["twitch.tv",1],["player.cuevana.ac",3],["player.tabooporns.com",3],["x69.ovh",3],["playerwatch.xyz",3],["rpdrlatino.live",3],["gaydam.net",3],["hdgay.net",3],["igay69.com",3],["tickzoo.tv",3],["qiwi.gg",3],["richhioon.eu",3],["uploadbank.com",5],["hotpornfile.org",6],["olympicstreams.me",7],["za.gl",8],["foxseotools.com",9],["uflash.tv",10],["sendvid.com",13],["fc.lc",14],["freeplayervideo.com",14],["nazarickol.com",14],["player-cdn.com",14],["playhydrax.com",14],["hihihaha1.xyz",14],["rufiguta.com",14],["adclickersbot.com",14],["ytmp3.cc",16],["rentbyowner.com",18],["embedy.me",19],["sekilastekno.com",[20,57]],["underhentai.net",21],["pixsera.net",22],["imgair.net",22],["imgblaze.net",22],["imgfrost.net",22],["vestimage.site",22],["imgwia.buzz",22],["imgbaex.store",22],["imgbah.online",22],["imgbaie.online",22],["imgbango.store",22],["imgbier.store",22],["imgbimn.store",22],["imgbqw.store",22],["imgbuba.online",22],["imgbwe.store",22],["imgbxs.online",22],["imgcao.store",22],["imgnwe.online",22],["imgqge.store",22],["imgqxb.online",22],["imgteq.online",22],["imgtex.online",22],["imgtuta.online",22],["imgwqr.online",22],["imgwww.store",22],["imgxza.store",22],["imgezx.sbs",22],["imgbcxsb.store",22],["imgbcxs.store",22],["imgbake.cfd",22],["imgmffg.sbs",22],["imgmffgtr.sbs",22],["imgnbg.sbs",22],["imgngc.sbs",22],["imgnmh.cfd",22],["imgqte.sbs",22],["imguthes.sbs",22],["imgwag.cfd",22],["imgwang.cfd",22],["imgwety.sbs",22],["imgxuh.cfd",22],["imgxytw.cfd",22],["imgycgey.sbs",22],["imgyruy.cfd",22],["imgyusa.cfd",22],["imgyyqey.sbs",22],["imgyer.store",22],["imgxhs.store",22],["imgwekr.online",22],["imgwbfh.online",22],["imgwak.online",22],["imgutry.online",22],["imgutiyu.online",22],["imgutbbn.online",22],["imgubfd.online",22],["imgrei.online",22],["imgqec.online",22],["imgpaiou.online",22],["imgpaiki.online",22],["imgmjj.store",22],["imgfa.store",22],["imgbutrt.store",22],["imgbty.store",22],["imgbdl.store",22],["imgngh.sbs",22],["imgbbfg.pics",22],["imgjhrjjr.pics",22],["imgleko.pics",22],["imgluki.pics",22],["imgnffe.pics",22],["imgnnnf.pics",22],["imgrwqz.pics",22],["imgtweqz.pics",22],["imgxzgf.pics",22],["imgyyeryt.pics",22],["picbbc.one",22],["picbbdr.one",22],["picbest.one",22],["picbhrt.one",22],["picnrrt.one",22],["picqqw.one",22],["picqr.one",22],["picqtwe.one",22],["picsjre.one",22],["piczzaq.one",22],["imgqazx.sbs",22],["imgiruyw.online",22],["picnerr.cfd",22],["pichfer.cfd",22],["picbbeq.cfd",22],["picqaxs.cfd",22],["picxxdd.cfd",22],["picqweff.cfd",22],["pickjsn.cfd",22],["piczzxsw.cfd",22],["picbbbde.cfd",22],["picbdd.cfd",22],["imgbahxg.sbs",22],["imgxune.sbs",22],["imgqklw.shop",22],["pixqkhgrt.shop",22],["pixqbngg.shop",22],["pixqwet.shop",22],["pixmos.shop",22],["imgtgd.shop",22],["imgcsxx.shop",22],["imgcssd.shop",22],["imguwjsd.sbs",22],["pictbbf.shop",22],["pixbryexa.sbs",22],["picbqqa.sbs",22],["pixbkghxa.sbs",22],["imgmgf.sbs",22],["picbcxvxa.sbs",22],["imguee.sbs",22],["imgmffmv.sbs",22],["imgbqb.sbs",22],["imgbyrev.sbs",22],["imgbncvnv.sbs",22],["pixtryab.shop",22],["imggune.shop",22],["pictryhab.shop",22],["pixbnab.shop",22],["imgbnwe.shop",22],["imgbbnhi.shop",22],["imgnbii.shop",22],["imghqqbg.shop",22],["imgyhq.shop",22],["pixnbrqwg.sbs",22],["pixnbrqw.sbs",22],["picmsh.sbs",22],["imgpke.sbs",22],["picuenr.sbs",22],["imgolemn.sbs",22],["imgoebn.sbs",22],["picnwqez.sbs",22],["imgjajhe.sbs",22],["pixjnwe.sbs",22],["pixkfjtrkf.shop",22],["pixkfkf.shop",22],["pixdfdjkkr.shop",22],["pixdfdj.shop",22],["picnft.shop",22],["pixrqqz.shop",22],["picngt.shop",22],["picjgfjet.shop",22],["picjbet.shop",22],["imgkkabm.shop",22],["imgxabm.shop",22],["imgthbm.shop",22],["imgmyqbm.shop",22],["imgwwqbm.shop",22],["imgjvmbbm.shop",22],["imgjbxzjv.shop",22],["imgjmgfgm.shop",22],["picxnkjkhdf.sbs",22],["imgxxbdf.sbs",22],["imgnngr.sbs",22],["imgjjtr.sbs",22],["imgqbbds.sbs",22],["imgbvdf.sbs",22],["imgqnnnebrf.sbs",22],["imgnnnvbrf.sbs",22],["tr.link",23],["workink.click",25],["mwpaste.com",26],["animesuge.to",27],["anix.to",27],["bflix.to",27],["bflixhd.to",27],["flixflare.to",27],["flixhive.to",27],["flixhq.bz",27],["flixtorz.to",27],["fmovies24.to",27],["hurawatch.bz",27],["hurawatch2.to",27],["losmoviesz.to",27],["mangafire.to",27],["moviestowatch.id",27],["soap2dayx.to",27],["watchseriesx.to",27],["woxmax.net",27],["terashare.co",27],["mtraffics.com",27],["jytechs.in",27],["dev.miuiflash.com",27],["djxmaza.in",27],["thecubexguide.com",27],["emb.apl305.me",27],["shrdsk.me",[27,58]],["totalcsgo.com",27],["donghuaworld.com",27],["paste-drop.com",27],["fullboys.com",28],["btcbitco.in",28],["btcsatoshi.net",28],["crypto4yu.com",28],["readbitcoin.org",28],["wiour.com",28],["fikper.com",28],["koyso.com",29],["buffsports.me",30],["kimetsujbn.blogspot.com",31],["hidan.sh",32],["vidhidepre.com",33],["seeklogo.com",34],["tubidi.buzz",35],["jokerscores.com",36],["jokersportshd.org",36],["tennis.stream",36],["cpmlink.pro",37],["crm.cekresi.me",38],["ai.tempatwisata.pro",38],["lootdest.com",39],["buzzheavier.com",40],["apkmoddone.com",41],["cshort.org",42],["dosya.tc",43],["cloudemb.com",45],["sbot.cf",0],["vidello.net",0],["mitedrive.com",0],["miteblog.com",0],["easymp3converter.com",46],["go-mp3.com",47],["lineageos18.com",48],["luckydice.net",49],["ytsubme.com",50],["driveup.in",51],["mp3juices.yt",52],["chillx.top",53],["beastx.top",53],["playerx.stream",53],["1ytmp3.com",54],["bestmp3converter.com",54],["hentaiworld.tv",55],["video-to-mp3-converter.com",56],["pinloker.com",57],["netfilm.app",57],["sharedisk.me",59],["kmo.to",60],["zuperdrive.my.id",61]]);

const entitiesMap = new Map([["wcostream",0],["kissasian",0],["slreamplay",0],["steamplay",0],["steanplay",0],["stemplay",0],["streamp1ay",0],["streanplay",0],["streampiay",0],["stre4mplay",0],["vid2faf",0],["youtubedownloader",0],["plylive",0],["plyvdo",0],["putlockerc",0],["putlockertv",0],["mylink",0],["my1ink",0],["myl1nk",0],["myli3k",0],["pahe",0],["yts",0],["hqq",0],["waaw",0],["adshort",0],["adsrt",0],["tube8",0],["europixhd",0],["topeuropix",0],["watch-series",0],["watchseries",0],["gogoanime",0],["gogoanimes",0],["gogoanimetv",0],["imgdew",0],["imgmaze",0],["imgoutlet",0],["imgtown",0],["imgview",0],["dewimg",0],["imgrock",0],["imgviu",0],["mazpic",0],["outletpic",0],["picrok",0],["capshd",0],["rojadirectatvlive",0],["1movies",0],["jkanime",0],["xmovies8",0],["pelisplus",0],["pelisplushd",0],["pouvideo",0],["povvideo",0],["povvldeo",0],["povw1deo",0],["povwideo",0],["powv1deo",0],["powvibeo",0],["powvideo",0],["powvldeo",0],["arenavision",0],["ciberdvd",0],["pornfay",0],["camwhores",0],["camwhorestv",0],["redtube",0],["ettv",0],["ver-pelis",0],["newpelis",0],["pelix",0],["onlinevideoconverter",0],["adfloz",0],["movies123",0],["voirfilms",0],["vidcloud",0],["iframejav",0],["savemedia",0],["limetorrents",0],["telerium",0],["9xbuddy",0],["asianclub",0],["vidmoly",0],["savelinks",0],["mixdroop",0],["mixdrop",0],["mixdrp",0],["123moviesfree",0],["yesmovies",0],["solarmovie",0],["zeefiles",0],["mega4up",0],["bdiptv",0],["cinemalibero",0],["gomovies",0],["gomoviesc",0],["cloudvideotv",0],["123movierulz",0],["7movierulz1",0],["7moviesrulz",0],["5movierulz2",0],["movieruls",0],["movierulz",0],["movierulzfree",0],["movierulz2free",0],["movierulzs",0],["movierulzwatch",0],["movierulzz",0],["moviesrulz",0],["moviesrulzfree",0],["topflix",0],["allfeeds",0],["daddylive",0],["sporting77",0],["teleriumtv",0],["7starhd",0],["uploadev",0],["thefmovies",0],["keepvid",0],["ustream",0],["upvid",0],["ssrmovies",0],["moviflex",0],["fembed",0],["mavplay",0],["videobb",0],["123mkv",0],["pornhub",0],["megavideo",0],["pandamovie",0],["speedporn",0],["watchpornfree",0],["okanime",0],["spankbang",0],["linkshub",0],["tmearn",0],["filedown",0],["ffmovies",0],["beinmatch",0],["mrpiracy",0],["shorten",0],["123anime",0],["ytmp3",0],["gnula",0],["sobatkeren",0],["movieon21",0],["pelispedia24",0],["pelis28",0],["remaxhd",0],["dood",0],["dooood",0],["nemenlake",0],["animeblix",0],["vidsrc",0],["binged",0],["fmovies",0],["torrentdownload",0],["file-upload",0],["mkvcinemas",0],["embedme",0],["finfang",0],["hellnaw",0],["moonembed",0],["z12z0vla",0],["sharedrive",0],["dodz",0],["doodss",0],["doood",0],["doooood",0],["kakitengah",0],["zoro",0],["m4u",0],["xprime4u",0],["uhdmovies",0],["direct-dl",0],["filmy4web",0],["desiflix",0],["clk",0],["fc-lc",0],["hubdrive",0],["gosemut",0],["zone-annuaire",0],["notube",0],["uploadhub",0],["mm9844",0],["adblockeronstape",0],["adblockplustape",0],["adblockstreamtape",0],["adblockstrtape",0],["adblockstrtech",0],["antiadtape",0],["noblocktape",0],["shavetape",0],["stapadblockuser",0],["stape",0],["strcloud",0],["streamadblocker",0],["streamadblockplus",0],["streamta",0],["streamtape",0],["streamtapeadblock",0],["streamtapeadblockuser",0],["strtape",0],["strtapeadblock",0],["strtapeadblocker",0],["strtapewithadblock",0],["strtpe",0],["vidop",0],["seriemega",0],["isohunt",0],["megaflix",0],["drtuber",0],["ilgeniodellostreaming",0],["vid4up",0],["gototub",0],["sportbar",0],["youtubetomp3",0],["9xmovies",0],["shortzzy",0],["rojadirecta",0],["movidy",0],["downloadhub",0],["hubstream",0],["proxybit",0],["openloadmov",0],["wawacity",0],["dl-protect",0],["0gomovies",0],["player.msmini",0],["player.sbnmp",0],["netuplayer",0],["vapley",0],["moviehdf",0],["hd21",0],["iceporn",0],["nuvid",0],["pornlib",0],["tubeon",0],["vivatube",0],["winporn",0],["yeptube",0],["streamsport",0],["ytc",0],["shahid4u",0],["watchonlinemoviespk",0],["streamhub",0],["moviezwap",0],["javembed",0],["kissanime",0],["sexy-games",0],["todaypk",0],["todaypktv",0],["1todaypk",0],["usagoals",0],["uproxy",0],["oyohd",0],["720pstream",0],["inextmovies",0],["mp4moviez",0],["buffstreams",0],["wolfstream",0],["4movierulz1",0],["filmygod6",0],["watchmovierulz",0],["streamsb",0],["filmywap",0],["ofilmywap",0],["kannadamasti",0],["buyjiocoin",0],["filmygod13",0],["ucanwatch",0],["userload",0],["videovard",0],["mp3juices",0],["milfnut",0],["mlsbd",0],["moviemad",0],["mymp3song",0],["akoam",0],["9xmovie",0],["himovies",0],["4stream",0],["teluguonlinemovies",0],["cricfree",0],["cricplay2",0],["primetubsub",0],["eztv",0],["theproxy",0],["filmeserialegratis",0],["fsplayer",0],["onlinewatchmoviespk",0],["younetu",0],["repelishd",0],["hdhub4u",0],["hdmoviesmaza",0],["moviesjoy",0],["voe-unblock",0],["voe",0],["apkmody",0],["extratorrent",0],["torrentstatus",0],["yts2",0],["y2mate",0],["missav",0],["poscitech",0],["embedmoon",0],["filemoon",0],["kerapoxy",0],["adblockeronstreamtape",0],["crichd",0],["movies2watch",0],["tirexo",0],["weloma",0],["zone-telechargement",0],["pobre",0],["8xmovies",0],["adblocktape",0],["cyberleaks",0],["opvid",0],["vembed",0],["thenextplanet1",0],["2embed",0],["movies4u",0],["movies4u3",0],["playfmovies",0],["viralvideotube",0],["vtlinks",0],["vvtlinks",0],["vvtplayer",0],["powstream",0],["powlideo",0],["povvvideo",0],["powvdeo",0],["filmydown",0],["poop",0],["strikeout",2],["vipbox",3],["desbloqueador",4],["viprow",7],["vipstand",7],["vipboxtv",7],["atomohd",11],["atomixhq",12],["pctfenix",12],["pctnew",12],["vev",14],["vidup",14],["vidstream",15],["gdriveplayer",17],["pixlev",22],["1337x",24],["x1337x",24],["aniwave",27],["newdmn",44],["camcaps",0],["empire-anime",62],["empire-stream",62],["empire-streaming",62],["empire-streamz",62]]);

const exceptionsMap = new Map([["notube.com",[0]]]);

/******************************************************************************/

function noWindowOpenIf(
    pattern = '',
    delay = '',
    decoy = ''
) {
    const safe = safeSelf();
    const logPrefix = safe.makeLogPrefix('no-window-open-if', pattern, delay, decoy);
    const targetMatchResult = pattern.startsWith('!') === false;
    if ( targetMatchResult === false ) {
        pattern = pattern.slice(1);
    }
    const rePattern = safe.patternToRegex(pattern);
    const autoRemoveAfter = (parseFloat(delay) || 0) * 1000;
    const setTimeout = self.setTimeout;
    const createDecoy = function(tag, urlProp, url) {
        const decoyElem = document.createElement(tag);
        decoyElem[urlProp] = url;
        decoyElem.style.setProperty('height','1px', 'important');
        decoyElem.style.setProperty('position','fixed', 'important');
        decoyElem.style.setProperty('top','-1px', 'important');
        decoyElem.style.setProperty('width','1px', 'important');
        document.body.appendChild(decoyElem);
        setTimeout(( ) => { decoyElem.remove(); }, autoRemoveAfter);
        return decoyElem;
    };
    const noopFunc = function(){};
    proxyApplyFn('open', function open(context) {
        const { callArgs } = context;
        const haystack = callArgs.join(' ');
        if ( rePattern.test(haystack) !== targetMatchResult ) {
            if ( safe.logLevel > 1 ) {
                safe.uboLog(logPrefix, `Allowed (${callArgs.join(', ')})`);
            }
            return context.reflect();
        }
        safe.uboLog(logPrefix, `Prevented (${callArgs.join(', ')})`);
        if ( delay === '' ) { return null; }
        if ( decoy === 'blank' ) {
            callArgs[0] = 'about:blank';
            const r = context.reflect();
            setTimeout(( ) => { r.close(); }, autoRemoveAfter);
            return r;
        }
        const decoyElem = decoy === 'obj'
            ? createDecoy('object', 'data', ...callArgs)
            : createDecoy('iframe', 'src', ...callArgs);
        let popup = decoyElem.contentWindow;
        if ( typeof popup === 'object' && popup !== null ) {
            Object.defineProperty(popup, 'closed', { value: false });
        } else {
            popup = new Proxy(self, {
                get: function(target, prop, ...args) {
                    if ( prop === 'closed' ) { return false; }
                    const r = Reflect.get(target, prop, ...args);
                    if ( typeof r === 'function' ) { return noopFunc; }
                    return r;
                },
                set: function(...args) {
                    return Reflect.set(...args);
                },
            });
        }
        if ( safe.logLevel !== 0 ) {
            popup = new Proxy(popup, {
                get: function(target, prop, ...args) {
                    const r = Reflect.get(target, prop, ...args);
                    safe.uboLog(logPrefix, `popup / get ${prop} === ${r}`);
                    if ( typeof r === 'function' ) {
                        return (...args) => { return r.call(target, ...args); };
                    }
                    return r;
                },
                set: function(target, prop, value, ...args) {
                    safe.uboLog(logPrefix, `popup / set ${prop} = ${value}`);
                    return Reflect.set(target, prop, value, ...args);
                },
            });
        }
        return popup;
    });
}

function proxyApplyFn(
    target = '',
    handler = ''
) {
    let context = globalThis;
    let prop = target;
    for (;;) {
        const pos = prop.indexOf('.');
        if ( pos === -1 ) { break; }
        context = context[prop.slice(0, pos)];
        if ( context instanceof Object === false ) { return; }
        prop = prop.slice(pos+1);
    }
    const fn = context[prop];
    if ( typeof fn !== 'function' ) { return; }
    if ( proxyApplyFn.CtorContext === undefined ) {
        proxyApplyFn.ctorContexts = [];
        proxyApplyFn.CtorContext = class {
            constructor(...args) {
                this.init(...args);
            }
            init(callFn, callArgs) {
                this.callFn = callFn;
                this.callArgs = callArgs;
                return this;
            }
            reflect() {
                const r = Reflect.construct(this.callFn, this.callArgs);
                this.callFn = this.callArgs = undefined;
                proxyApplyFn.ctorContexts.push(this);
                return r;
            }
            static factory(...args) {
                return proxyApplyFn.ctorContexts.length !== 0
                    ? proxyApplyFn.ctorContexts.pop().init(...args)
                    : new proxyApplyFn.CtorContext(...args);
            }
        };
        proxyApplyFn.applyContexts = [];
        proxyApplyFn.ApplyContext = class {
            constructor(...args) {
                this.init(...args);
            }
            init(callFn, thisArg, callArgs) {
                this.callFn = callFn;
                this.thisArg = thisArg;
                this.callArgs = callArgs;
                return this;
            }
            reflect() {
                const r = Reflect.apply(this.callFn, this.thisArg, this.callArgs);
                this.callFn = this.thisArg = this.callArgs = undefined;
                proxyApplyFn.applyContexts.push(this);
                return r;
            }
            static factory(...args) {
                return proxyApplyFn.applyContexts.length !== 0
                    ? proxyApplyFn.applyContexts.pop().init(...args)
                    : new proxyApplyFn.ApplyContext(...args);
            }
        };
    }
    const fnStr = fn.toString();
    const toString = (function toString() { return fnStr; }).bind(null);
    const proxyDetails = {
        apply(target, thisArg, args) {
            return handler(proxyApplyFn.ApplyContext.factory(target, thisArg, args));
        },
        get(target, prop) {
            if ( prop === 'toString' ) { return toString; }
            return Reflect.get(target, prop);
        },
    };
    if ( fn.prototype?.constructor === fn ) {
        proxyDetails.construct = function(target, args) {
            return handler(proxyApplyFn.CtorContext.factory(target, args));
        };
    }
    context[prop] = new Proxy(fn, proxyDetails);
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
    let lastLogType = '';
    let lastLogText = '';
    let lastLogTime = 0;
    safe.sendToLogger = (type, ...args) => {
        if ( args.length === 0 ) { return; }
        const text = `[${document.location.hostname || document.location.href}]${args.join(' ')}`;
        if ( text === lastLogText && type === lastLogType ) {
            if ( (Date.now() - lastLogTime) < 5000 ) { return; }
        }
        lastLogType = type;
        lastLogText = text;
        lastLogTime = Date.now();
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
}
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

const targetWorld = 'MAIN';

// Not Firefox
if ( typeof wrappedJSObject !== 'object' || targetWorld === 'ISOLATED' ) {
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
