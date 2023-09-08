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

// ruleset: annoyances-others

/******************************************************************************/

// Important!
// Isolate from global scope

// Start of local scope
(( ) => {

/******************************************************************************/

// Start of code to inject
const uBOL_nanoSetIntervalBooster = function() {

const scriptletGlobals = new Map(); // jshint ignore: line

const argsList = [["/wpsafe-|timeLeft/","*","0.001"],["wpsafe-","*","0.001"],["count","*","0.001"],["mdtimer","*","0.001"],["timer","","0.02"],["countdown","*","0.001"],["timer","*","0.001"],["counter"],["clearInterval","*","0.001"],["wait","*","0.02"],["count","*","0.02"],["counter","*","0.02"],["download","*","0.02"],["timeLeft","*","0.02"],["timeLeft","","0.02"],["/_0x|wpsafe-/","*","0.02"],["Download","*","0.02"],["counter--","*","0.02"],["count--","*","0.02"],["time","*","0.02"],["p--","","0.02"],["current()","*","0.02"],["wpsafe-","*","0.02"],["disabled","*","0.02"],["timePassed","*","0.02"],["countdown","*","0.02"],["/Seconds|download/","*","0.02"],["download_progress","*","0.02"],["count","1600","0.02"],["downloadButton","*","0.02"],["waitTime","*","0.02"],["timer","*","0.02"],["timeSec--","*","0.02"],["_0x","*","0.02"],["wpsafe-generate","*","0.02"],["document.hidden","*","0.02"],["#mdtimer","","0.02"],["updatePercentage","*","0.02"],["timePassed","","0.02"],["DOWNLOAD","*","0.02"],["Number","","0.02"],["/counter|wait/","*","0.02"],["get-link","*","0.02"],["cont","*","0.02"],[",dataType:_","1000","0.02"],["/wpsafe|count/","*","0.02"],["downloadToken","*","0.02"],["/timeLeft|wpsafe-/","*","0.02"],["cnDownloadBtn","*","0.02"],["download_link","*","0.02"],["secondsleft","*","0.02"],["countdown","","0.02"],["yuidea-","*","0.02"],["timer--","*","0.02"],["success","","0.02"],["/verify_text|isCompleted/","*","0.02"],["#timer","","0.02"],["countdownwrapper","","0.02"],["timeleft","*","0.02"],["contador","*","0.02"],["Your Link","","0.02"],["count","","0.02"],["/download|Please/","","0.02"],["downloadButton","","0.02"],["window.location.href= atob(","1000","0.02"],[".show_download_links","","0.02"],["download-btn","","0.02"],["updatePercentage","100","0.02"],["decodeURIComponent(link)","","0.02"],["/count-|-wait/","*","0.02"],["waktu--","","0.02"],[".download","","0.02"],["/base-timer-label|waktu--/","","0.02"],["curCount","","0.02"],["Please wait","","0.02"],["mdtimer","","0.02"],["gotolink","*","0.02"],["seconds--","*","0.02"],["claim_button","*","0.02"],["/Please Wait|Generating Links/","*","0.02"],["#second","","0.02"],["#countdown","","0.02"],["progressbar","30","0.02"],["#upbtn","","0.02"],["skip-btn","*","0.02"],["tp-","*","0.02"],["downloadTimer","","0.02"],["/Please Wait|Go to download/","","0.02"],["counter","","0.02"],["/counter--|downloadButton/","","0.02"],["location","","0.02"],["/wpsafe|wait/","*","0.001"],["counter--","","0.02"],["pleasewait","","0.02"],["bb_download_delay","","0.02"],["0x","","0.02"],["timeCount","*","0.2"],["counter","2000","0.02"],["downloadLinkButton","*","0.02"],["startChecking","*","0.02"],["timer","1000","0.02"],["timeleft","","0.02"],["timeSec--","*","0.001"],["show_download_links","","0.02"],["REDIRECTING","*","0.02"],["ct","1000","0.02"],["sec--","","0.02"],["count--","","0.02"],["sec","","0.02"],["wpsafe-","","0.02"],["wpsafe-","2000","0.02"],["wpsafe-","1500","0.02"],["get-link","","0.02"],["download","2000","0.02"],["timer","1500","0.02"],["timer","2000","0.02"],["Link","550","0.02"],["#proceed","","0.02"],["counter","1800","0.02"],["downloadButton","1500","0.02"],["sp-count-down","","0.02"],["gotolink","","0.02"],["btngetlink","30","0.02"],["btn","","0.02"],["/show_download_links|downloadTimer/","","0.02"],["timeinterval","","0.02"],["countDown","1150","0.5"],["makingdifferenttimer","50","0.02"],["Link()","","0.02"],["time","","0.02"],["time","2500","0.02"],["freeRemind","","0.02"],["contador","","0.02"],["contador--","","0.02"],["counter--","1300","0.02"],["seconds","","0.02"],["downloadButton","1000","0.02"],["counter","1000","0.02"],["wpsafe-generate","","0.02"],["timerText","","0.02"],["#counter","","0.02"],["counter","1500","0.02"],["download-count-down","","0.02"],["runTimer","","0.02"],["[0x","","0.02"],["#download","","0.02"],["percentVal","30","0.02"],["wpsafe-generate","1000","0.02"],["wpsafe","","0.02"],["timer","1000","0.6"],["","1000","0.05"],["second--","","0.02"],["#bt","","0.02"],["counter--","100","0.02"],["#Download-Card","","0.02"],[".stop()","","0.02"],["Link will appear","510","0.02"],["Link will appear","1010","0.02"],["countdown","2000","0.02"],["sayimiBaslat","","0.02"],["wpsafe-link","2000","0.02"],["#eg-timer","","0.3"],["#CountDown","","0.02"],["dllink","","0.02"],["time--","","0.02"],["stop()","","0.02"],["second","1000","0.02"],["wait_seconds","","0.02"],["download-countdown","","0.02"],["current_progress","2000","0.02"],["display()","","0.02"],["get_link","","0.02"],["goToLink","2200","0.02"],[".countdown","2000","0.02"],["urll","800","0.02"],["Downloading","","0.02"],["linkDL","","0.02"],["downloadButton","2400","0.02"],["#pleasewait","","0.02"],[".fcounter span","","0.02"],["real-link","","0.02"],[".wpapks-download-link-wrapper","","0.02"],["(i-1)","","0.02"],["fcounter","","0.02"],["show_ag","","0.02"],["timer","700","0.02"],["clock()","1000","0.02"],[".countdown","","0.02"],["secondsLeft","","0.02"],["timeLeft--","","0.02"],["/_0x[\\s\\S]*?decodeURIComponent/","","0.02"],["count-","","0.02"],["#download-popup","","0.02"],[".timer","","0.02"],["#download_menu","","0.02"],["r--","","0.02"],["showDownloadButton","","0.02"],["download_link","","0.02"],["onLoop","","0.02"],["timer.remove","","0.02"],["download","","0.02"],["i--","","0.02"]];

const hostnamesMap = new Map([["theprodkeys.com",0],["forasm.com",1],["bhojpuritop.in",2],["amritadrino.com",[2,34]],["heroxcheat.cloud",3],["bloginkz.com",4],["go.freetrx.fun",4],["wpking.in",4],["yifysubtitles.me",4],["michaelemad.com",4],["shtms.co",4],["gitizle.vip",4],["ay.live",4],["techrfour.com",4],["theicongenerator.com",4],["multilinkfz.xyz",4],["yindex.xyz",4],["unityassetcollection.com",4],["earningradar.com",4],["findi.pro",4],["uzunversiyon.xyz",4],["direkizle.xyz",4],["tamindir.mobi",4],["gitlink.pro",4],["aylink.co",4],["moretvtime.com",4],["urlpay.net",4],["claim4.fun",4],["plog.com.br",5],["wellness4live.com",6],["insuranceinfos.in",6],["finsurances.co",7],["hotmediahub.com",8],["covemarkets.com",9],["finclub.in",10],["financeyogi.net",10],["trangchu.news",10],["downfile.site",10],["player.pelisgratishd.io",10],["doibihar.org",10],["educationgyani.com",10],["ffworld.xyz",10],["gawbne.com",10],["forex-trnd.com",[10,36]],["forex-golds.com",10],["cravesandflames.com",11],["novelsapps.com",11],["codesnse.com",11],["speedtorrent.ru",11],["listas.pro",11],["forexit.io",11],["healthy4pepole.com",[11,86,88]],["sitecuatui.xyz",11],["haonguyen.top",11],["androjungle.com",12],["getmodsapk.com",12],["mixrootmods.com",13],["consoleroms.com",13],["romspedia.com",13],["edummm.xyz",13],["shortlinks.tech",14],["dramaworldhd.co",14],["bitefaucet.com",14],["filmypoints.in",[15,22]],["vinstartheme.com",16],["instamod.net",16],["jenismac.com",17],["unityassets4free.com",17],["spacebin.site",17],["freemodapks.com",17],["player.repelis24.rs",18],["makimbo.xyz",19],["dyp.li",20],["linku.to",21],["oneslidephotography.com",22],["apasih.my.id",22],["financekami.com",22],["bico8.com",22],["techyinfo.in",22],["smallinfo.in",22],["techymedies.com",22],["disheye.com",22],["ufacw.com",22],["googledrivelinks.com",22],["technicalatg.com",[22,31]],["7apple.net",22],["arhplyrics.in",22],["netfile.cc",22],["jardima.com",22],["courseforfree.com",22],["tutorial.siberuang.com",22],["segurosdevida.site",22],["surl.li",23],["bankvacency.com",24],["indilinks.xyz",25],["discordbotlist.com",25],["maxsilo.in",26],["starfiles.co",27],["nguyenvanbao.com",28],["androidecuatoriano.xyz",29],["sinonimos.de",30],["atlai.club",30],["blogtechh.com",32],["vavada5com.com",32],["financerites.in",32],["financerites.com",32],["diudemy.com",33],["techboyz.xyz",33],["adslink.pw",33],["3dzip.org",35],["3rabsnews.com",36],["mobileprice.site",36],["bestmobilenew.com",36],["linkjust1.com",36],["vidtome.stream",36],["ta2deem7arbya.com",[37,75]],["eda-ah.com",[37,75]],["modzilla.in",38],["garutpos.com",38],["vrcmods.com",38],["garutexpress.id",38],["getfreecourses.co",39],["dosya.hizliresim.com",40],["vebma.com",41],["pinloker.com",41],["sekilastekno.com",41],["blogmado.com",42],["suaurl.com",43],["webhostingpost.com",44],["wikitraveltips.com",45],["naukrilelo.in",45],["fikper.com",46],["freecoursesonline.me",47],["codingnepalweb.com",[48,134]],["misirtune.blogspot.com",49],["userload.co",50],["dizimini.com",51],["mohammedkhc.com",51],["trendyoum.com",51],["dl.indexmovies.xyz",51],["cheatsquad.gg",51],["mcpedl.com",51],["filese.me",51],["linkslo.com",51],["c1ne.co",51],["pearos.xyz",51],["moddedguru.com",51],["py.md",51],["abhaydigitalmarketer.com",51],["bestshort.xyz",51],["moaplos.com",51],["nullslide.com",51],["mage.si",51],["embed.m3u-cdn.live",51],["embed.tvcdn.live",51],["mastercoria.com",51],["gaminplay.com",[52,91,111]],["gamelopte.com",52],["insurglobal.xyz",52],["sevenjournals.com",52],["digworm.io",53],["br0wsers.com",[54,184]],["hashhackers.com",55],["katdrive.net",55],["newsongs.co.in",55],["altblogger.net",56],["cashearn.cc",56],["subscene.vip",56],["safelink.omglyrics.com",56],["4download.net",56],["acortar.info",56],["kotp1000000.xyz",56],["blog.donia-tech.net",56],["anomize.xyz",56],["boardgamesonline.net",56],["freeudemycourse.com",57],["modshost.net",58],["coincity.in",58],["djxmaza.in",58],["examtadka.com",58],["proviralhost.com",58],["urbharat.xyz",58],["codenova-center.web.app",59],["minecraftalpha.net",60],["aeromods.app",61],["whatsaero.com",61],["pahe.win",61],["financeflix.in",61],["technoflip.in",61],["studyranks.in",61],["flightsim.to",61],["hikarinoakari.com",61],["hikarinoakariost.info",61],["recipesdelite.com",62],["edumaz.com",63],["blisseyhusband.in",63],["bingotingo.com",63],["compressware.in",63],["geektopia.info",63],["freecoursewebsite.com",63],["dosyayukle.biz",63],["freetutorialsus.com",63],["apkmos.com",63],["sfile.mobi",63],["notipostingt.com",64],["cmacked.com",65],["movieflixpro.com",65],["gocmod.com",66],["speedynews.xyz",67],["xmod.in",67],["tecmundo.net",67],["crazyblog.in",[67,109,110]],["studyuo.com",[67,109,110]],["sbkaise.in",67],["janusnotes.com",67],["anime-sanka.com",68],["kiemlua.com",[69,97,141]],["world-trips.net",[69,101]],["newforex.online",[69,97]],["pes-patches.com",70],["data.morsodifame.com",70],["ifile.cc",70],["filemoon.sx",71],["truongblogger.top",72],["koyi.pub",73],["thizissam.in",[74,92]],["alphaantileak.net",74],["o-pro.online",75],["mazen-ve.com",75],["animeuploader.com",75],["konstantinova.net",75],["ontools.net",76],["teknopaid.xyz",76],["asdfiles.com",77],["11bit.co.in",78],["spantechie.com",79],["paste1s.com",80],["note1s.com",80],["easylinkref.com",80],["redirect.dafontvn.com",[81,82]],["samapkstore.com",[81,82]],["andronews18.blogspot.com",[81,82]],["ph.tpaste.net",[81,82]],["sdetectives.id",81],["apps2app.com",81],["pro-bangla.com",81],["cheatermad.com",83],["streamcheck.link",84],["tinyurl.so",84],["tinyurl.is",84],["usanewstoday.club",85],["earnme.club",85],["top1iq.com",86],["sama-pro.com",86],["7misr4day.com",[86,106]],["coursefreedl.com",86],["apkmaza.net",86],["jpopsingles.eu",86],["gplinks.co",86],["mobiget.net",86],["newzflair.com",87],["newzmagic.com",87],["adlice.com",88],["yalla-shoot-now.us",88],["forexeen.us",88],["health-and.me",88],["wondervelocity.com",88],["bluetechno.net",88],["world2our.com",88],["mobi2c.com",[88,97]],["mywatchseries.fun",88],["telepisodes.org",88],["kingtalks.net",88],["maxurlz.com",88],["allcryptoz.net",88],["topcryptoz.net",88],["thaitrieuvi.live",88],["freewebcart.com",88],["safe.kangkimin.com",88],["maxservicesi.com",88],["techhelpbd.com",89],["egyfalcons.com",90],["gktech.uk",91],["worldmak.com",91],["ftuapps.dev",91],["dl.tech-story.net",91],["themorningtribune.com",91],["veganho.co",91],["veganal.co",91],["mosqam.com",91],["bimo-cash.readi.online",91],["blog.textpage.xyz",91],["claimlite.club",91],["bitcomarket.net",91],["1apple.xyz",91],["mcrypto.club",[91,138]],["gamepure.in",91],["veganab.co",91],["apkmaven.io",91],["choiceappstore.xyz",91],["pn.cgchotbox.com",91],["worldappsstore.xyz",91],["gifans.com",91],["iptvjournal.com",91],["kienthucrangmieng.com",91],["coin-free.com",91],["moddingzone.in",91],["insurance-space.xyz",91],["blognews.in",91],["noithatmyphu.vn",91],["dulichkhanhhoa.net",91],["therootdroid.com",91],["filessrc.com",92],["srcimdb.com",92],["udemycourses.me",92],["eu.tapchipi.com",92],["short.ctvb1.info",92],["citychilli.com",92],["psdly.com",92],["desitvshows.xyz",92],["katmoviehd4.com",92],["download.modsofapk.com",92],["infopedia24.com",92],["linkdecode.com",92],["short-ly.co",93],["upshrink.com",93],["jojo-themes.net",94],["diglink.blogspot.com",95],["th-world.com",95],["za.gl",96],["za.uy",96],["rezence.com",97],["techmody.io",[97,118]],["yoshare.net",97],["mikl4forex.com",[97,141]],["publicananker.com",[97,141]],["aemenstore.com",97],["cazzette.com",97],["truebrandy.com",97],["hookeaudio.com",97],["restorbio.com",97],["medcpu.com",97],["alocd.com",97],["forex-gold.net",[97,101]],["kingsleynyc.com",97],["lucidcam.com",97],["staaker.com",97],["byboe.com",97],["thegoneapp.com",97],["nousdecor.com",97],["alobuu.com",[97,141]],["rodjulian.com",[97,141]],["aloass.com",[97,141]],["taisv.com",[97,141]],["aloguy.com",[97,141]],["alohdd.com",[97,141]],["alogum.com",[97,141]],["alobyt.com",[97,141]],["aloboi.com",[97,141]],["uebnews.online",[97,141]],["aloegg.com",[97,141]],["alofps.com",[97,141]],["pennbookcenter.com",[97,141]],["samfirms.com",98],["appsmodz.com",99],["cararegistrasi.com",100],["healdad.com",101],["gamalk-sehetk.com",101],["yogablogfit.com",102],["vocalley.com",102],["howifx.com",102],["enit.in",102],["skincarie.com",102],["imperialstudy.com",102],["hamsterss.website",103],["romadd.com",103],["apkmb.com",103],["boobychristmas.com",104],["ethereumfaucet.info",105],["tutcourse.com",106],["luckydice.net",106],["coinsearns.com",106],["forexrw7.com",106],["fx-22.com",106],["forexmab.com",106],["forexwaw.club",106],["forex-articles.com",106],["linkjust.com",106],["forexlap.com",106],["gdfreak.xyz",106],["doctor-groups.com",106],["crypto-faucet.xyz",106],["mik4mob.com",106],["iklandb.com",106],["urapk.com",106],["dogemate.com",[106,152]],["shorteet.com",106],["earnbits.xyz",106],["bitearns.com",106],["girls-like.me",107],["sonixgvn.net",107],["apkcell.net",107],["runmods.com",107],["watchdoge.xyz",108],["informatikamu.id",[109,110]],["technicalatg.xyz",[109,110]],["taregna.com",[109,110]],["toolss.net",[109,110]],["tutsgalaxy.net",[109,110]],["otomi-games.com",[110,147]],["yifysub.net",112],["cdmstudy.site",113],["insurance.recipesdelite.com",113],["allbuzzin.com",[114,115]],["file.bospedia.com",116],["toptap.website",117],["adnit-tri.tk",117],["boomx5.com",117],["howtofree.org",119],["rethmic.com",120],["majidzhacker.com",[121,122]],["itscybertech.com",123],["shareappscrack.com",124],["oiipdf.com",125],["upstore.net",126],["subs4series.com",127],["gamingforecast.com",128],["icutlink.com",129],["android-apk.org",129],["semawur.com",129],["zegtrends.com",130],["littlebyte.net",131],["megadescargas.net",132],["blyts.net",132],["lawebdelprogramador.com",133],["win10.vn",135],["wildfaucets.ml",135],["faucet.cryptourl.net",135],["dogeatm.com",135],["claimbits.io",135],["i-bits.io",135],["diamondfaucet.space",135],["gobits.io",135],["russiacoin.xyz",135],["starsfaucet.com",135],["lionltcfaucet.xyz",135],["faucet.shorterall.com",135],["yellowfaucet.ovh",135],["bollypluse.in",136],["freecourseslab.com",137],["freetutorialseu.com",137],["informaxonline.com",[138,160]],["tipslearn.com",138],["androidnougatapk.com",138],["siberuang.com",138],["waaboom.com",138],["healthymaster.xyz",138],["bkksnews.xyz",138],["faucetcrypto.com",139],["techoow.com",140],["mynewsmedia.in",141],["mynewshub.co",141],["techbigs.com",142],["kiktu.com",143],["technicalegy.com",144],["wallpaperaccess.com",145],["uniqueten.net",148],["ultraten.net",148],["elil.cc",149],["game-kentang.blogspot.com",150],["upfile.us",150],["mad4wheels.com",151],["moviesdaweb.blogspot.com",153],["dlsharefile.com",154],["eco-area.com",155],["safelink.rezkozpatch.xyz",[156,157]],["onlinecoursebay.com",158],["kazanclilink.com",159],["emulatorgames.net",161],["iptv4best.com",162],["leechall.com",163],["kpopstan.com",164],["ouo.io",165],["cpmlink.net",165],["short-url.link",166],["findicons.com",167],["nulleb.com",168],["bfas237blog.info",169],["dr-farfar.net",170],["saungfirmware.id",171],["goossh.com",172],["onlinefreecourse.net",173],["site.dz4win.com",174],["thingiverse.com",175],["linkerload.com",176],["ockles.com",176],["ljutkeunvpn.blogspot.com",176],["mobilelegends.shop",176],["linksaya.com",177],["phpscripttr.com",178],["essek.gen.tr",178],["indir.turkceyama.net",178],["clicads.fr",178],["mazakony.net",178],["5mod-file.ru",179],["genlink.cc",180],["apkprofree.com",181],["zedge.net",182],["hakdisk.ru",183],["diskapk.ru",183],["softwaresde.com",184],["tr.link",185],["doods.pro",187],["dooood.com",187],["dood.yt",187],["dood.re",187],["dood.wf",187],["dood.la",187],["dood.pm",187],["dood.so",187],["dood.to",187],["dood.watch",187],["dood.ws",187],["nightfallnews.com",188],["retrostic.com",189],["shiroyasha.me",190],["bolicheintercambios.net",191],["lg-firmwares.com",192],["sfirmware.com",192],["imgqec.online",193],["imgwbfh.online",193],["imgyer.store",193],["imgxuh.cfd",193],["imgngc.sbs",193],["imgezx.sbs",193],["imgxza.store",193],["imgwqr.online",193],["imagehaha.com",193],["imgpukrr.site",193],["imagent.buzz",193],["imagepuitr.buzz",193],["imgblaze.net",193],["imgkorle.buzz",193],["imgkaka.xyz",193],["pixsera.net",193],["imgfrost.net",193],["imgair.net",193],["wallpaperplay.com",194],["lnk.parts",195],["lnk.news",195],["sammobile.com",196],["bomurl.com",197],["go.geghost.com",198],["romhustler.org",199],["a2zupload.com",200],["dl.pcgamestorrents.org",201],["get-url.com",201]]);

const entitiesMap = new Map([["lootlinks",61],["ibomma",75],["animesanka",146],["akwam",186],["bluemediafile",201],["bluemediafiles",201]]);

const exceptionsMap = new Map([]);

/******************************************************************************/

function nanoSetIntervalBooster(
    needleArg = '',
    delayArg = '',
    boostArg = ''
) {
    if ( typeof needleArg !== 'string' ) { return; }
    const safe = safeSelf();
    const reNeedle = safe.patternToRegex(needleArg);
    let delay = delayArg !== '*' ? parseInt(delayArg, 10) : -1;
    if ( isNaN(delay) || isFinite(delay) === false ) { delay = 1000; }
    let boost = parseFloat(boostArg);
    boost = isNaN(boost) === false && isFinite(boost)
        ? Math.min(Math.max(boost, 0.02), 50)
        : 0.05;
    self.setInterval = new Proxy(self.setInterval, {
        apply: function(target, thisArg, args) {
            const [ a, b ] = args;
            if (
                (delay === -1 || b === delay) &&
                reNeedle.test(a.toString())
            ) {
                args[1] = b * boost;
            }
            return target.apply(thisArg, args);
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
    try { nanoSetIntervalBooster(...argsList[i]); }
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
    return uBOL_nanoSetIntervalBooster();
}

// Firefox
{
    const page = self.wrappedJSObject;
    let script, url;
    try {
        page.uBOL_nanoSetIntervalBooster = cloneInto([
            [ '(', uBOL_nanoSetIntervalBooster.toString(), ')();' ],
            { type: 'text/javascript; charset=utf-8' },
        ], self);
        const blob = new page.Blob(...page.uBOL_nanoSetIntervalBooster);
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
    delete page.uBOL_nanoSetIntervalBooster;
}

/******************************************************************************/

// End of local scope
})();

/******************************************************************************/

void 0;
