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

const argsList = [["/wpsafe-|timeLeft/","*","0.001"],["wpsafe-","*","0.001"],["count","*","0.001"],["mdtimer","*","0.001"],["timer","","0.02"],["countdown","*","0.001"],["timer","*","0.001"],["counter"],["clearInterval","*","0.001"],["wait","*","0.02"],["count","*","0.02"],["counter","*","0.02"],["download","*","0.02"],["timeLeft","*","0.02"],["timeLeft","","0.02"],["/_0x|wpsafe-/","*","0.02"],["Download","*","0.02"],["counter--","*","0.02"],["count--","*","0.02"],["time","*","0.02"],["p--","","0.02"],["current()","*","0.02"],["wpsafe-","*","0.02"],["disabled","*","0.02"],["timePassed","*","0.02"],["countdown","*","0.02"],["/Seconds|download/","*","0.02"],["download_progress","*","0.02"],["count","1600","0.02"],["downloadButton","*","0.02"],["waitTime","*","0.02"],["timer","*","0.02"],["timeSec--","*","0.02"],["_0x","*","0.02"],["wpsafe-generate","*","0.02"],["document.hidden","*","0.02"],["#mdtimer","","0.02"],["updatePercentage","*","0.02"],["timePassed","","0.02"],["DOWNLOAD","*","0.02"],["Number","","0.02"],["/counter|wait/","*","0.02"],["get-link","*","0.02"],["cont","*","0.02"],[",dataType:_","1000","0.02"],["/wpsafe|count/","*","0.02"],["downloadToken","*","0.02"],["/timeLeft|wpsafe-/","*","0.02"],["cnDownloadBtn","*","0.02"],["download_link","*","0.02"],["secondsleft","*","0.02"],["countdown","","0.02"],["yuidea-","*","0.02"],["timer--","*","0.02"],["success","","0.02"],["/verify_text|isCompleted/","*","0.02"],["#timer","","0.02"],["countdownwrapper","","0.02"],["timeleft","*","0.02"],["contador","*","0.02"],["Your Link","","0.02"],["count","","0.02"],["/download|Please/","","0.02"],["downloadButton","","0.02"],["window.location.href= atob(","1000","0.02"],[".show_download_links","","0.02"],["download-btn","","0.02"],["updatePercentage","100","0.02"],["decodeURIComponent(link)","","0.02"],["/count-|-wait/","*","0.02"],["waktu--","","0.02"],[".download","","0.02"],["/base-timer-label|waktu--/","","0.02"],["curCount","","0.02"],["Please wait","","0.02"],["mdtimer","","0.02"],["gotolink","*","0.02"],["seconds--","*","0.02"],["claim_button","*","0.02"],["/Please Wait|Generating Links/","*","0.02"],["#second","","0.02"],["#countdown","","0.02"],["progressbar","30","0.02"],["#upbtn","","0.02"],["skip-btn","*","0.02"],["tp-","*","0.02"],["downloadTimer","","0.02"],["/Please Wait|Go to download/","","0.02"],["counter","","0.02"],["/counter--|downloadButton/","","0.02"],["location","","0.02"],["counter--","","0.02"],["pleasewait","","0.02"],["bb_download_delay","","0.02"],["0x","","0.02"],["timeCount","*","0.2"],["counter","2000","0.02"],["downloadLinkButton","*","0.02"],["startChecking","*","0.02"],["timer","1000","0.02"],["timeleft","","0.02"],["timeSec--","*","0.001"],["show_download_links","","0.02"],["REDIRECTING","*","0.02"],["ct","1000","0.02"],["sec--","","0.02"],["count--","","0.02"],["sec","","0.02"],["wpsafe-","","0.02"],["wpsafe-","2000","0.02"],["wpsafe-","1500","0.02"],["get-link","","0.02"],["download","2000","0.02"],["timer","1500","0.02"],["timer","2000","0.02"],["Link","550","0.02"],["#proceed","","0.02"],["counter","1800","0.02"],["downloadButton","1500","0.02"],["sp-count-down","","0.02"],["gotolink","","0.02"],["btngetlink","30","0.02"],["btn","","0.02"],["/show_download_links|downloadTimer/","","0.02"],["timeinterval","","0.02"],["countDown","1150","0.5"],["makingdifferenttimer","50","0.02"],["Link()","","0.02"],["time","","0.02"],["time","2500","0.02"],["freeRemind","","0.02"],["contador","","0.02"],["contador--","","0.02"],["counter--","1300","0.02"],["seconds","","0.02"],["downloadButton","1000","0.02"],["counter","1000","0.02"],["wpsafe-generate","","0.02"],["timerText","","0.02"],["#counter","","0.02"],["counter","1500","0.02"],["download-count-down","","0.02"],["runTimer","","0.02"],["[0x","","0.02"],["#download","","0.02"],["percentVal","30","0.02"],["wpsafe-generate","1000","0.02"],["wpsafe","","0.02"],["timer","1000","0.6"],["","1000","0.05"],["second--","","0.02"],["#bt","","0.02"],["counter--","100","0.02"],["#Download-Card","","0.02"],[".stop()","","0.02"],["Link will appear","510","0.02"],["Link will appear","1010","0.02"],["countdown","2000","0.02"],["sayimiBaslat","","0.02"],["wpsafe-link","2000","0.02"],["#eg-timer","","0.3"],["#CountDown","","0.02"],["dllink","","0.02"],["time--","","0.02"],["stop()","","0.02"],["second","1000","0.02"],["wait_seconds","","0.02"],["download-countdown","","0.02"],["current_progress","2000","0.02"],["display()","","0.02"],["get_link","","0.02"],["goToLink","2200","0.02"],[".countdown","2000","0.02"],["urll","800","0.02"],["Downloading","","0.02"],["linkDL","","0.02"],["downloadButton","2400","0.02"],["#pleasewait","","0.02"],[".fcounter span","","0.02"],["real-link","","0.02"],[".wpapks-download-link-wrapper","","0.02"],["(i-1)","","0.02"],["fcounter","","0.02"],["show_ag","","0.02"],["timer","700","0.02"],["clock()","1000","0.02"],[".countdown","","0.02"],["secondsLeft","","0.02"],["timeLeft--","","0.02"],["/_0x[\\s\\S]*?decodeURIComponent/","","0.02"],["count-","","0.02"],["#download-popup","","0.02"],[".timer","","0.02"],["#download_menu","","0.02"],["r--","","0.02"],["showDownloadButton","","0.02"],["download_link","","0.02"],["onLoop","","0.02"],["timer.remove","","0.02"],["download","","0.02"],["i--","","0.02"]];

const hostnamesMap = new Map([["theprodkeys.com",0],["forasm.com",1],["bhojpuritop.in",2],["amritadrino.com",[2,34]],["heroxcheat.cloud",3],["bloginkz.com",4],["go.freetrx.fun",4],["wpking.in",4],["yifysubtitles.me",4],["michaelemad.com",4],["shtms.co",4],["gitizle.vip",4],["ay.live",4],["techrfour.com",4],["theicongenerator.com",4],["multilinkfz.xyz",4],["yindex.xyz",4],["unityassetcollection.com",4],["earningradar.com",4],["findi.pro",4],["uzunversiyon.xyz",4],["direkizle.xyz",4],["tamindir.mobi",4],["gitlink.pro",4],["aylink.co",4],["moretvtime.com",4],["urlpay.net",4],["claim4.fun",4],["plog.com.br",5],["wellness4live.com",6],["insuranceinfos.in",6],["finsurances.co",7],["hotmediahub.com",8],["covemarkets.com",9],["finclub.in",10],["financeyogi.net",10],["trangchu.news",10],["downfile.site",10],["player.pelisgratishd.io",10],["doibihar.org",10],["educationgyani.com",10],["ffworld.xyz",10],["gawbne.com",10],["forex-trnd.com",[10,36]],["forex-golds.com",10],["cravesandflames.com",11],["novelsapps.com",11],["codesnse.com",11],["speedtorrent.ru",11],["listas.pro",11],["forexit.io",11],["healthy4pepole.com",[11,86,88]],["sitecuatui.xyz",11],["haonguyen.top",11],["androjungle.com",12],["getmodsapk.com",12],["mixrootmods.com",13],["consoleroms.com",13],["romspedia.com",13],["edummm.xyz",13],["shortlinks.tech",14],["dramaworldhd.co",14],["bitefaucet.com",14],["filmypoints.in",[15,22]],["vinstartheme.com",16],["instamod.net",16],["jenismac.com",17],["unityassets4free.com",17],["spacebin.site",17],["freemodapks.com",17],["player.repelis24.rs",18],["makimbo.xyz",19],["dyp.li",20],["linku.to",21],["oneslidephotography.com",22],["apasih.my.id",22],["financekami.com",22],["bico8.com",22],["techyinfo.in",22],["smallinfo.in",22],["techymedies.com",22],["disheye.com",22],["ufacw.com",22],["googledrivelinks.com",22],["technicalatg.com",[22,31]],["worldmak.com",22],["ftuapps.dev",22],["dl.tech-story.net",22],["themorningtribune.com",22],["veganho.co",22],["veganal.co",22],["mosqam.com",22],["bimo-cash.readi.online",22],["blog.textpage.xyz",22],["claimlite.club",22],["bitcomarket.net",22],["1apple.xyz",22],["mcrypto.club",[22,137]],["gamepure.in",22],["mad.goiety.com",22],["veganab.co",22],["apkmaven.io",22],["gaminplay.com",[22,52,110]],["choiceappstore.xyz",22],["pn.cgchotbox.com",22],["worldappsstore.xyz",22],["gifans.com",22],["iptvjournal.com",22],["kienthucrangmieng.com",22],["coin-free.com",22],["moddingzone.in",22],["insurance-space.xyz",22],["blognews.in",22],["noithatmyphu.vn",22],["dulichkhanhhoa.net",22],["therootdroid.com",22],["7apple.net",22],["arhplyrics.in",22],["netfile.cc",22],["jardima.com",22],["courseforfree.com",22],["tutorial.siberuang.com",22],["segurosdevida.site",22],["surl.li",23],["bankvacency.com",24],["indilinks.xyz",25],["discordbotlist.com",25],["maxsilo.in",26],["starfiles.co",27],["nguyenvanbao.com",28],["androidecuatoriano.xyz",29],["sinonimos.de",30],["atlai.club",30],["blogtechh.com",32],["vavada5com.com",32],["financerites.in",32],["financerites.com",32],["diudemy.com",33],["techboyz.xyz",33],["adslink.pw",33],["3dzip.org",35],["3rabsnews.com",36],["mobileprice.site",36],["bestmobilenew.com",36],["linkjust1.com",36],["vidtome.stream",36],["ta2deem7arbya.com",[37,75]],["eda-ah.com",[37,75]],["modzilla.in",38],["garutpos.com",38],["vrcmods.com",38],["garutexpress.id",38],["getfreecourses.co",39],["dosya.hizliresim.com",40],["vebma.com",41],["pinloker.com",41],["sekilastekno.com",41],["blogmado.com",42],["suaurl.com",43],["webhostingpost.com",44],["wikitraveltips.com",45],["naukrilelo.in",45],["fikper.com",46],["freecoursesonline.me",47],["codingnepalweb.com",[48,133]],["misirtune.blogspot.com",49],["userload.co",50],["dizimini.com",51],["mohammedkhc.com",51],["trendyoum.com",51],["dl.indexmovies.xyz",51],["cheatsquad.gg",51],["mcpedl.com",51],["filese.me",51],["linkslo.com",51],["c1ne.co",51],["pearos.xyz",51],["moddedguru.com",51],["py.md",51],["abhaydigitalmarketer.com",51],["bestshort.xyz",51],["moaplos.com",51],["nullslide.com",51],["mage.si",51],["embed.m3u-cdn.live",51],["embed.tvcdn.live",51],["mastercoria.com",51],["gamelopte.com",52],["insurglobal.xyz",52],["sevenjournals.com",52],["digworm.io",53],["br0wsers.com",[54,183]],["hashhackers.com",55],["katdrive.net",55],["newsongs.co.in",55],["altblogger.net",56],["cashearn.cc",56],["subscene.vip",56],["safelink.omglyrics.com",56],["4download.net",56],["acortar.info",56],["kotp1000000.xyz",56],["blog.donia-tech.net",56],["anomize.xyz",56],["boardgamesonline.net",56],["freeudemycourse.com",57],["modshost.net",58],["coincity.in",58],["djxmaza.in",58],["examtadka.com",58],["proviralhost.com",58],["urbharat.xyz",58],["codenova-center.web.app",59],["minecraftalpha.net",60],["aeromods.app",61],["whatsaero.com",61],["pahe.win",61],["financeflix.in",61],["technoflip.in",61],["studyranks.in",61],["flightsim.to",61],["hikarinoakari.com",61],["hikarinoakariost.info",61],["recipesdelite.com",62],["edumaz.com",63],["blisseyhusband.in",63],["bingotingo.com",63],["compressware.in",63],["geektopia.info",63],["freecoursewebsite.com",63],["dosyayukle.biz",63],["freetutorialsus.com",63],["apkmos.com",63],["sfile.mobi",63],["notipostingt.com",64],["cmacked.com",65],["movieflixpro.com",65],["gocmod.com",66],["speedynews.xyz",67],["xmod.in",67],["tecmundo.net",67],["crazyblog.in",[67,108,109]],["studyuo.com",[67,108,109]],["sbkaise.in",67],["janusnotes.com",67],["anime-sanka.com",68],["kiemlua.com",[69,96,140]],["world-trips.net",[69,100]],["newforex.online",[69,96]],["pes-patches.com",70],["data.morsodifame.com",70],["ifile.cc",70],["filemoon.sx",71],["truongblogger.top",72],["koyi.pub",73],["thizissam.in",[74,91]],["alphaantileak.net",74],["o-pro.online",75],["mazen-ve.com",75],["animeuploader.com",75],["konstantinova.net",75],["ontools.net",76],["teknopaid.xyz",76],["asdfiles.com",77],["11bit.co.in",78],["spantechie.com",79],["paste1s.com",80],["note1s.com",80],["easylinkref.com",80],["redirect.dafontvn.com",[81,82]],["samapkstore.com",[81,82]],["andronews18.blogspot.com",[81,82]],["ph.tpaste.net",[81,82]],["sdetectives.id",81],["apps2app.com",81],["pro-bangla.com",81],["cheatermad.com",83],["streamcheck.link",84],["tinyurl.so",84],["tinyurl.is",84],["usanewstoday.club",85],["earnme.club",85],["top1iq.com",86],["sama-pro.com",86],["7misr4day.com",[86,105]],["coursefreedl.com",86],["apkmaza.net",86],["jpopsingles.eu",86],["gplinks.co",86],["mobiget.net",86],["newzflair.com",87],["newzmagic.com",87],["adlice.com",88],["yalla-shoot-now.us",88],["forexeen.us",88],["health-and.me",88],["wondervelocity.com",88],["bluetechno.net",88],["world2our.com",88],["mobi2c.com",[88,96]],["mywatchseries.fun",88],["telepisodes.org",88],["kingtalks.net",88],["maxurlz.com",88],["allcryptoz.net",88],["topcryptoz.net",88],["thaitrieuvi.live",88],["freewebcart.com",88],["safe.kangkimin.com",88],["maxservicesi.com",88],["techhelpbd.com",89],["egyfalcons.com",90],["filessrc.com",91],["srcimdb.com",91],["udemycourses.me",91],["eu.tapchipi.com",91],["short.ctvb1.info",91],["citychilli.com",91],["psdly.com",91],["desitvshows.xyz",91],["katmoviehd4.com",91],["download.modsofapk.com",91],["infopedia24.com",91],["linkdecode.com",91],["short-ly.co",92],["upshrink.com",92],["jojo-themes.net",93],["diglink.blogspot.com",94],["th-world.com",94],["za.gl",95],["za.uy",95],["rezence.com",96],["techmody.io",[96,117]],["yoshare.net",96],["mikl4forex.com",[96,140]],["publicananker.com",[96,140]],["aemenstore.com",96],["cazzette.com",96],["truebrandy.com",96],["hookeaudio.com",96],["restorbio.com",96],["medcpu.com",96],["alocd.com",96],["forex-gold.net",[96,100]],["kingsleynyc.com",96],["lucidcam.com",96],["staaker.com",96],["byboe.com",96],["thegoneapp.com",96],["nousdecor.com",96],["alobuu.com",[96,140]],["rodjulian.com",[96,140]],["aloass.com",[96,140]],["taisv.com",[96,140]],["aloguy.com",[96,140]],["alohdd.com",[96,140]],["alogum.com",[96,140]],["alobyt.com",[96,140]],["aloboi.com",[96,140]],["uebnews.online",[96,140]],["aloegg.com",[96,140]],["alofps.com",[96,140]],["pennbookcenter.com",[96,140]],["samfirms.com",97],["appsmodz.com",98],["cararegistrasi.com",99],["healdad.com",100],["gamalk-sehetk.com",100],["yogablogfit.com",101],["vocalley.com",101],["howifx.com",101],["enit.in",101],["skincarie.com",101],["imperialstudy.com",101],["hamsterss.website",102],["romadd.com",102],["apkmb.com",102],["boobychristmas.com",103],["ethereumfaucet.info",104],["tutcourse.com",105],["luckydice.net",105],["coinsearns.com",105],["forexrw7.com",105],["fx-22.com",105],["forexmab.com",105],["forexwaw.club",105],["forex-articles.com",105],["linkjust.com",105],["forexlap.com",105],["gdfreak.xyz",105],["doctor-groups.com",105],["crypto-faucet.xyz",105],["mik4mob.com",105],["iklandb.com",105],["urapk.com",105],["dogemate.com",[105,151]],["shorteet.com",105],["earnbits.xyz",105],["bitearns.com",105],["girls-like.me",106],["sonixgvn.net",106],["apkcell.net",106],["runmods.com",106],["watchdoge.xyz",107],["informatikamu.id",[108,109]],["technicalatg.xyz",[108,109]],["taregna.com",[108,109]],["toolss.net",[108,109]],["tutsgalaxy.net",[108,109]],["otomi-games.com",[109,146]],["yifysub.net",111],["cdmstudy.site",112],["insurance.recipesdelite.com",112],["allbuzzin.com",[113,114]],["file.bospedia.com",115],["toptap.website",116],["adnit-tri.tk",116],["boomx5.com",116],["howtofree.org",118],["rethmic.com",119],["majidzhacker.com",[120,121]],["itscybertech.com",122],["shareappscrack.com",123],["oiipdf.com",124],["upstore.net",125],["subs4series.com",126],["gamingforecast.com",127],["icutlink.com",128],["android-apk.org",128],["semawur.com",128],["zegtrends.com",129],["littlebyte.net",130],["megadescargas.net",131],["blyts.net",131],["lawebdelprogramador.com",132],["win10.vn",134],["wildfaucets.ml",134],["faucet.cryptourl.net",134],["dogeatm.com",134],["claimbits.io",134],["i-bits.io",134],["diamondfaucet.space",134],["gobits.io",134],["russiacoin.xyz",134],["starsfaucet.com",134],["lionltcfaucet.xyz",134],["faucet.shorterall.com",134],["yellowfaucet.ovh",134],["bollypluse.in",135],["freecourseslab.com",136],["freetutorialseu.com",136],["informaxonline.com",[137,159]],["tipslearn.com",137],["androidnougatapk.com",137],["siberuang.com",137],["waaboom.com",137],["healthymaster.xyz",137],["bkksnews.xyz",137],["faucetcrypto.com",138],["techoow.com",139],["mynewsmedia.in",140],["mynewshub.co",140],["techbigs.com",141],["kiktu.com",142],["technicalegy.com",143],["wallpaperaccess.com",144],["uniqueten.net",147],["ultraten.net",147],["elil.cc",148],["game-kentang.blogspot.com",149],["upfile.us",149],["mad4wheels.com",150],["moviesdaweb.blogspot.com",152],["dlsharefile.com",153],["eco-area.com",154],["safelink.rezkozpatch.xyz",[155,156]],["onlinecoursebay.com",157],["kazanclilink.com",158],["emulatorgames.net",160],["iptv4best.com",161],["leechall.com",162],["kpopstan.com",163],["ouo.io",164],["cpmlink.net",164],["short-url.link",165],["findicons.com",166],["nulleb.com",167],["bfas237blog.info",168],["dr-farfar.net",169],["saungfirmware.id",170],["goossh.com",171],["onlinefreecourse.net",172],["site.dz4win.com",173],["thingiverse.com",174],["linkerload.com",175],["ockles.com",175],["ljutkeunvpn.blogspot.com",175],["mobilelegends.shop",175],["linksaya.com",176],["phpscripttr.com",177],["essek.gen.tr",177],["indir.turkceyama.net",177],["clicads.fr",177],["mazakony.net",177],["5mod-file.ru",178],["genlink.cc",179],["apkprofree.com",180],["zedge.net",181],["hakdisk.ru",182],["diskapk.ru",182],["softwaresde.com",183],["tr.link",184],["doods.pro",186],["dooood.com",186],["dood.yt",186],["dood.re",186],["dood.wf",186],["dood.la",186],["dood.pm",186],["dood.so",186],["dood.to",186],["dood.watch",186],["dood.ws",186],["nightfallnews.com",187],["retrostic.com",188],["shiroyasha.me",189],["bolicheintercambios.net",190],["lg-firmwares.com",191],["sfirmware.com",191],["imgqec.online",192],["imgwbfh.online",192],["imgyer.store",192],["imgxuh.cfd",192],["imgngc.sbs",192],["imgezx.sbs",192],["imgxza.store",192],["imgwqr.online",192],["imagehaha.com",192],["imgpukrr.site",192],["imagent.buzz",192],["imagepuitr.buzz",192],["imgblaze.net",192],["imgkorle.buzz",192],["imgkaka.xyz",192],["pixsera.net",192],["imgfrost.net",192],["imgair.net",192],["wallpaperplay.com",193],["lnk.parts",194],["lnk.news",194],["sammobile.com",195],["bomurl.com",196],["go.geghost.com",197],["romhustler.org",198],["a2zupload.com",199],["dl.pcgamestorrents.org",200],["get-url.com",200]]);

const entitiesMap = new Map([["lootlinks",61],["ibomma",75],["animesanka",145],["akwam",185],["bluemediafile",200],["bluemediafiles",200]]);

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
    const safe = {
        'Error': self.Error,
        'Object_defineProperty': Object.defineProperty.bind(Object),
        'RegExp': self.RegExp,
        'RegExp_test': self.RegExp.prototype.test,
        'RegExp_exec': self.RegExp.prototype.exec,
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
//   `MAIN` world not yet supported in Firefox, so we inject the code into
//   'MAIN' ourself when enviroment in Firefox.

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
