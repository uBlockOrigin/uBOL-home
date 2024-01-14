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
const uBOL_addEventListenerDefuser = function() {

const scriptletGlobals = new Map(); // jshint ignore: line

const argsList = [["load","Object"],["mousedown","clientX"],["load","hard_block"],["/contextmenu|keydown/"],["","adb"],["load","adBlock"],["click","ClickHandler"],["load","IsAdblockRequest"],["/^(?:click|mousedown)$/","_0x"],["error"],["load","onload"],["","pop"],["","BACK"],["load","getComputedStyle"],["load","adsense"],["load","(!o)"],["load","(!i)"],["","_0x"],["","Adblock"],["load","nextFunction"],["/^(?:click|mousedown)$/","bypassEventsInProxies"],["","window.open"],["","open"],["click","exopop"],["/^(?:load|click)$/","popMagic"],["mousedown","popundrInit"],["getexoloader"],["load","exoJsPop101"],["/^loadex/"],["","/exo"],["","_blank"],["",";}"],["load","BetterPop"],["mousedown","preventDefault"],["load","advertising"],["mousedown","localStorage"],["click","preventDefault"],["load","2000"],["/^(click|mousedown|mousemove|touchstart|touchend|touchmove)/","system.popunder"],["load","adb"],["/^(?:click|mousedown|mousemove|touchstart|touchend|touchmove)$/","system.popunder"],["","'0x"],["/DOMContentLoaded|load/","y.readyState"],["/error|canplay/","(t)"],["load","hblocked"],["error","Adblocker"],["DOMContentLoaded","adlinkfly"],["DOMContentLoaded","shortener"],["mousedown","trigger"],["","0x"],["DOMContentLoaded","ads"],["","Pop"],["/^(?:click|mousedown)$/","popunder"],["DOMContentLoaded","preventExit"],["","adsense"],["load"],["click","pop_under"],["load","url"],["load","adverts-top-container"],["","Date"],["DOMContentLoaded","&nbsp"],["click","read_cookie"],["","midRoll"],["click","_0x"],["load","isBlanketFound"],["load","showModal"],["click","trigger"],["mouseout","clientWidth"],["load","download-wrapper"],["load","autoRecov"],["popstate","noPop"],["/^(?:click|mousedown)$/","ppu"],["click","native code"],["message","data.slice"],["/^(?:mousedown|mouseup)$/","0x"],["click","popundr"],["click"],["DOMContentLoaded","compupaste"],["mousedown","!!{});"],["keydown"],["DOMContentLoaded","isMobile"],["/^/","0x"],["load","PrivateMode"],["scroll","_0x"],["DOMContentLoaded","checkVPN"],["/^(?:click|mousedown|mouseup)$/","di()"],["","\\"],["popstate"],["click","my_inter_listen"],["load","appendChild"],["","bi()"],["","checkTarget"],["click","popunder"],["timeupdate"],["scroll","getElementById"],["load","undefined"],["DOMContentLoaded","scriptwz_url"],["load","0x"],["DOMContentLoaded","btoa"],["adblockActivated"],["load","ads"],["click","saveLastEvent"],["DOMContentLoaded","offsetHeight"],["","show"],["/.?/","popMagic"],["","ads"],["click","interstitial"],["load","antiblock"],["DOMContentLoaded","adsBlocked"],["load",".appendChild"],["","btoa"],["","exopop"],["DOMContentLoaded","AdBlock"],["load","blocker"],["mouseleave","NativeDisplayAdID"],["mouseover","event.triggered"],["load","removeChild"],["/adblock/i"],["DOMContentLoaded","iframe"],["mouseup","_blank"],["load","htmls"],["blur","focusOut"],["","/_blank/i"],["click","handleClick"],["DOMContentLoaded","antiAdBlockerHandler"],["DOMContentLoaded","location.href"],["","popMagic"],["contextmenu"],["/^(?:click|mousedown)$/","latest!=="],["DOMContentLoaded",".ready"],["load","script"],["","/pop|wm|forceClick/"],["load","block"],["","/_0x|localStorage\\.getItem/"],["DOMContentLoaded","adblock"],["load","head"],["/error|load/","/onerror|showModal/"],["load","doTest"],["visibilitychange"],["load","/showModal|isBlanketFound/"],["click","shouldShow"],["","/ads|Modal/"],["DOMContentLoaded","init"],["load","Adblock"],["DOMContentLoaded","window.open"],["","vads"],["devtoolschange"],["click","open"],["beforeunload"],["click","0x"],["","break;case $."],["mouseup","decodeURIComponent"],["/(?:click|touchend)/","_0x"],["click","openSite"],["","removeChild"],["click","pu_count"],["","/pop|_blank/"],["click","allclick_Public"],["/touchstart|mousedown|click/","latest"],["blur","native code"],["blur","event.simulate"],["click","_blank"],["DOMContentLoaded","0x"],["click","overlay"],["scroll","undefined"],["readystatechange","document.removeEventListener"],["mousedown","shown_at"],["scroll","detect"],["click","t(a)"],["","focus"],["DOMContentLoaded","deblocker"],["","preventDefault"],["click","tabunder"],["mouseup","catch"],["scroll","innerHeight"],["DOMContentLoaded","disableDeveloperTools"],["hashchange"],["load","/nextFunction|2000/"],["load","player"],["","document.oncontextmenu"],["","about:blank"],["click","popMagic"],["load","popMagic"],["np.detect"],["click","Popup"],["","/open.*_blank/"],["scroll"],["","isBlocking"],["","$"],["","exoJsPop101"],["/click|mousedown/","catch"],["","init"],["adb"],["scroll","modal"],["","[native code]"],["DOMContentLoaded","clientHeight"],["click","window.focus"],["click","[native code]"],["click","event.dispatch"],["load","adblock"],["","Math"],["","tabUnder"],["load","XMLHttpRequest"],["load","puURLstrpcht"],["load","AdBlocker"],["","showModal"],["","goog"],["load","abDetectorPro"],["","document.body"],["","modal"],["load","length"],["gtmloaderror"],["click","adobeModalTestABenabled"],["blur","console.log"],["blur","counter"],["","AdB"],["load","adSession"],["load","Ads"],["DOMContentLoaded","googlesyndication"],["np.evtdetect"],["load","popunder"],["scroll","function(e)"],["DOMContentLoaded","adlinkfly_url"],["mousedown"],["load","document.getElementById"],["mousedown","tabUnder"],["DOMContentLoaded","adsbygoogle"],["DOMContentLoaded","daadb_get_data_fetch"],["click","popactive"],["load","adsbygoogle"],["load","modal_blocker"],["click","isOpened"],["mousedown","pop.doEvent"],["error","blocker"],["click","alink"],["","daadb"],["load","google-analytics"],["","sessionStorage"],["load","fetch"],["click","/event_callback=function\\(\\){window\\.location=t\\.getAttribute\\(\"href\"\\)/"],["blur","event.triggered"],["","Adb"]];

const hostnamesMap = new Map([["newser.com",0],["sport1.de",2],["userscloud.com",3],["timesofindia.indiatimes.com",4],["drrtyr.mx",4],["pinoyalbums.com",4],["multiplayer.it",4],["bild.de",5],["mediafire.com",[6,7]],["pinsystem.co.uk",8],["fembed.com",8],["ancensored.com",8],["o2tvseries.com",8],["mp3fiber.com",[8,19]],["xrivonet.info",8],["afreesms.com",9],["tio.ch",9],["lavanguardia.com",9],["eplayer.click",9],["kingofdown.com",10],["radiotormentamx.com",10],["quelleestladifference.fr",10],["otakuworldsite.blogspot.com",10],["ad-itech.blogspot.com",10],["sna3talaflam.com",10],["agar.pro",10],["unlockapk.com",10],["mobdi3ips.com",10],["socks24.org",10],["interviewgig.com",10],["javaguides.net",10],["almohtarif-tech.net",10],["forum.release-apk.com",10],["devoloperxda.blogspot.com",10],["zwergenstadt.com",10],["primedeportes.es",10],["upxin.net",10],["ciudadblogger.com",10],["ke-1.com",10],["secretsdeepweb.blogspot.com",10],["bit-shares.com",10],["itdmusics.com",10],["aspdotnet-suresh.com",10],["tudo-para-android.com",10],["urdulibrarypk.blogspot.com",10],["zerotopay.com",10],["akw.to",10],["mawsueaa.com",10],["hesgoal-live.io",10],["king-shoot.io",10],["pornhd.com",11],["cnnamador.com",[11,38]],["cle0desktop.blogspot.com",11],["turkanime.co",11],["camclips.tv",[11,51]],["blackpornhq.com",11],["xsexpics.com",11],["ulsex.net",11],["wannafreeporn.com",11],["ytube2dl.com",11],["multiup.us",11],["protege-torrent.com",11],["bibme.org",15],["citationmachine.net",15],["easybib.com",16],["userupload.net",17],["vermangasporno.com",17],["imgtorrnt.in",17],["picbaron.com",[17,126]],["worldcupfootball.me",17],["letmejerk.com",17],["letmejerk2.com",17],["letmejerk3.com",17],["letmejerk4.com",17],["letmejerk5.com",17],["letmejerk6.com",17],["letmejerk7.com",17],["dlapk4all.com",17],["kropic.com",17],["kvador.com",17],["pdfindir.net",17],["brstej.com",17],["topwwnews.com",17],["xsanime.com",17],["vidlo.us",17],["put-locker.com",17],["youx.xxx",17],["animeindo.asia",17],["masahub.net",17],["adclickersbot.com",17],["badtaste.it",18],["mage.si",19],["totaldebrid.org",19],["neko-miku.com",19],["elsfile.org",19],["venstrike.jimdofree.com",19],["schrauben-normen.de",19],["avengerinator.blogspot.com",19],["link-to.net",19],["hanimesubth.com",19],["gsmturkey.net",19],["adshrink.it",19],["presentation-ppt.com",19],["mangacanblog.com",19],["pekalongan-cits.blogspot.com",19],["4tymode.win",19],["linkvertise.com",19],["reifenrechner.at",19],["tire-size-calculator.info",19],["linuxsecurity.com",19],["encodinghub.com",19],["readyssh.net",19],["itsguider.com",19],["cotravinh.blogspot.com",19],["itudong.com",19],["shortx.net",19],["comandotorrenthd.org",19],["turkdebrid.net",19],["lecturel.com",19],["bakai.org",19],["nar.k-ba.net",19],["tiroalpalo.org",19],["shemalez.com",21],["tubepornclassic.com",21],["gotporn.com",22],["freepornrocks.com",22],["tvhai.org",22],["simpcity.su",22],["realgfporn.com",[23,24]],["titsbox.com",23],["thisvid.com",24],["xvideos-downloader.net",24],["imgspice.com",25],["vikiporn.com",26],["tnaflix.com",26],["hentai2w.com",[26,181]],["yourlust.com",26],["hotpornfile.org",26],["jav789.com",26],["javbuz.com",26],["letfap.com",26],["watchfreexxx.net",26],["vintageporntubes.com",26],["angelgals.com",26],["babesexy.com",26],["porndaa.com",26],["ganstamovies.com",26],["youngleak.com",26],["porndollz.com",26],["xnxxvideo.pro",26],["xvideosxporn.com",26],["onlyhgames.com",26],["filmpornofrancais.fr",26],["pictoa.com",[26,49]],["adultasianporn.com",26],["nsfwmonster.com",26],["girlsofdesire.org",26],["gaytail.com",26],["fetish-bb.com",26],["rumporn.com",26],["soyoungteens.com",26],["zubby.com",26],["lesbian8.com",26],["gayforfans.com",26],["reifporn.de",26],["javtsunami.com",26],["18tube.sex",26],["xxxextreme.org",26],["amateurs-fuck.com",26],["sex-amateur-clips.com",26],["hentaiworld.tv",26],["dads-banging-teens.com",26],["home-xxx-videos.com",26],["mature-chicks.com",26],["teens-fucking-matures.com",26],["hqbang.com",26],["darknessporn.com",26],["familyporner.com",26],["freepublicporn.com",26],["pisshamster.com",26],["punishworld.com",26],["xanimu.com",26],["pussyspace.com",[27,28]],["pussyspace.net",[27,28]],["empflix.com",29],["cpmlink.net",30],["bdsmstreak.com",30],["cutpaid.com",30],["pornforrelax.com",30],["fatwhitebutt.com",30],["mavplay.xyz",30],["sunporno.com",[31,32,181]],["short.pe",33],["bs.to",36],["efukt.com",36],["kpopsea.com",36],["generacionretro.net",37],["nuevos-mu.ucoz.com",37],["micloudfiles.com",37],["mimaletamusical.blogspot.com",37],["visionias.net",37],["b3infoarena.in",37],["lurdchinexgist.blogspot.com",37],["thefreedommatrix.blogspot.com",37],["hentai-vl.blogspot.com",37],["projetomotog.blogspot.com",37],["ktmx.pro",37],["lirik3satu.blogspot.com",37],["marketmovers.it",37],["pharmaguideline.com",37],["safemaru.blogspot.com",37],["mixloads.com",37],["mangaromance.eu",37],["interssh.com",37],["freesoftpdfdownload.blogspot.com",37],["cirokun.blogspot.com",37],["myadslink.com",37],["blackavelic.com",37],["server.satunivers.tv",37],["eg-akw.com",37],["xn--mgba7fjn.cc",37],["flashingjungle.com",38],["ma-x.org",39],["lavozdegalicia.es",39],["xmovies08.org",41],["globaldjmix.com",42],["zazzybabes.com",43],["haaretz.co.il",44],["haaretz.com",44],["slate.com",45],["megalinks.info",46],["megapastes.com",46],["mega-mkv.com",[46,47]],["mkv-pastes.com",46],["zpaste.net",46],["zlpaste.net",46],["9xlinks.site",46],["zona-leros.net",47],["acortarm.xyz",48],["acortame.xyz",48],["cine.to",[49,185]],["kissasia.cc",49],["nzbstars.com",50],["digjav.com",51],["videoszoofiliahd.com",52],["xxxtubezoo.com",53],["zooredtube.com",53],["megacams.me",55],["rlslog.net",55],["porndoe.com",56],["acienciasgalilei.com",58],["playrust.io",59],["payskip.org",60],["short-url.link",61],["tubedupe.com",62],["fatgirlskinny.net",64],["polska-ie.com",64],["windowsmatters.com",64],["canaltdt.es",65],["masbrooo.com",65],["2ndrun.tv",65],["stfly.me",66],["oncehelp.com",66],["queenfaucet.website",66],["curto.win",66],["smallseotools.com",67],["macwelt.de",69],["pcwelt.de",69],["capital.de",69],["geo.de",69],["allmomsex.com",70],["allnewindianporn.com",70],["analxxxvideo.com",70],["animalextremesex.com",70],["anime3d.xyz",70],["animefuckmovies.com",70],["animepornfilm.com",70],["animesexbar.com",70],["animesexclip.com",70],["animexxxsex.com",70],["animexxxfilms.com",70],["anysex.club",70],["apetube.asia",70],["asianfuckmovies.com",70],["asianfucktube.com",70],["asianporn.sexy",70],["asiansexcilps.com",70],["beeg.fund",70],["beegvideoz.com",70],["bestasiansex.pro",70],["bigsexhub.com",70],["bravotube.asia",70],["brutalanimalsfuck.com",70],["candyteenporn.com",70],["daddyfuckmovies.com",70],["desifuckonline.com",70],["exclusiveasianporn.com",70],["exteenporn.com",70],["fantasticporn.net",70],["fantasticyoungporn.com",70],["fineasiansex.com",70],["firstasianpussy.com",70],["freeindiansextube.com",70],["freepornasians.com",70],["freerealvideo.com",70],["fuck-beeg.com",70],["fuck-xnxx.com",70],["fuckasian.pro",70],["fuckfuq.com",70],["fuckundies.com",70],["fullasiantube.com",70],["gojapaneseporn.com",70],["golderotica.com",70],["goodyoungsex.com",70],["goyoungporn.com",70],["hardxxxmoms.com",70],["hdvintagetube.com",70],["hentaiporn.me",70],["hentaisexfilms.com",70],["hentaisexuality.com",70],["hot-teens-movies.mobi",70],["hotanimepornvideos.com",70],["hotanimevideos.com",70],["hotasianpussysex.com",70],["hotjapaneseshows.com",70],["hotmaturetube.com",70],["hotmilfs.pro",70],["hotorientalporn.com",70],["hotpornsexvideos.com",70],["hotpornyoung.com",70],["hotxxxjapanese.com",70],["hotxxxpussy.com",70],["indiafree.net",70],["indianpornvideo.online",70],["japanpornclip.com",70],["japanesetube.video",70],["japansex.me",70],["japanesexxxporn.com",70],["japansporno.com",70],["japanxxx.asia",70],["japanxxxworld.com",70],["keezmovies.surf",70],["lingeriefuckvideo.com",70],["liveanimalporn.zooo.club",70],["madhentaitube.com",70],["megahentaitube.com",70],["megajapanesesex.com",70],["megajapantube.com",70],["milfxxxpussy.com",70],["momsextube.pro",70],["momxxxass.com",70],["monkeyanimalporn.com",70],["moviexxx.mobi",70],["newanimeporn.com",70],["newjapanesexxx.com",70],["nicematureporn.com",70],["nudeplayboygirls.com",70],["openxxxporn.com",70],["originalindianporn.com",70],["originalteentube.com",70],["pig-fuck.com",70],["plainasianporn.com",70],["popularasianxxx.com",70],["pornanimetube.com",70],["pornasians.pro",70],["pornhat.asia",70],["pornheed.online",70],["pornjapanesesex.com",70],["pornomovies.asia",70],["pornvintage.tv",70],["primeanimesex.com",70],["realjapansex.com",70],["realmomsex.com",70],["redsexhub.com",70],["retroporn.world",70],["retrosexfilms.com",70],["sex-free-movies.com",70],["sexanimesex.com",70],["sexanimetube.com",70],["sexjapantube.com",70],["sexmomvideos.com",70],["sexteenxxxtube.com",70],["sexxxanimal.com",70],["sexyoungtube.com",70],["sexyvintageporn.com",70],["sopornmovies.com",70],["spicyvintageporn.com",70],["sunporno.club",70],["tabooanime.club",70],["teenextrem.com",70],["teenfucksex.com",70],["teenhost.net",70],["teensexass.com",70],["tnaflix.asia",70],["totalfuckmovies.com",70],["totalmaturefuck.com",70],["txxx.asia",70],["voyeurpornsex.com",70],["warmteensex.com",70],["wetasiancreampie.com",70],["wildhentaitube.com",70],["wowyoungsex.com",70],["xhamster-art.com",70],["xmovie.pro",70],["xnudevideos.com",70],["xnxxjapon.com",70],["xpics.me",70],["xvide.me",70],["xxxanimefuck.com",70],["xxxanimevideos.com",70],["xxxanimemovies.com",70],["xxxhentaimovies.com",70],["xxxhothub.com",70],["xxxjapaneseporntube.com",70],["xxxlargeporn.com",70],["xxxmomz.com",70],["xxxpornmilf.com",70],["xxxpussyclips.com",70],["xxxpussysextube.com",70],["xxxretrofuck.com",70],["xxxsex.pro",70],["xxxsexyjapanese.com",70],["xxxteenyporn.com",70],["xxxvideo.asia",70],["xxxvideos.ink",70],["xxxyoungtv.com",70],["youjizzz.club",70],["youngpussyfuck.com",70],["bayimg.com",71],["celeb.gate.cc",72],["eodev.com",73],["masterplayer.xyz",75],["pussy-hub.com",75],["porndex.com",76],["compucalitv.com",77],["duden.de",80],["pennlive.com",82],["beautypageants.indiatimes.com",83],["01fmovies.com",84],["lnk2.cc",86],["fullhdxxx.com",87],["luscious.net",[87,126]],["classicpornbest.com",87],["1youngteenporn.com",87],["www-daftarharga.blogspot.com",[87,169]],["miraculous.to",[87,176]],["vtube.to",87],["gosexpod.com",88],["otakukan.com",89],["xcafe.com",90],["pornfd.com",90],["venusarchives.com",90],["imagehaha.com",91],["imagenpic.com",91],["imageshimage.com",91],["imagetwist.com",91],["deusasporno.com.br",92],["sambaporno2.com",92],["sexoamador.blog.br",92],["videospornozinhos.com",92],["videosexoquente.com",92],["xvideosf.com",92],["k1nk.co",92],["watchasians.cc",92],["alexsports.xyz",92],["lulustream.com",92],["luluvdo.com",92],["web.de",93],["news18.com",94],["thelanb.com",95],["dropmms.com",95],["softwaredescargas.com",96],["cracking-dz.com",97],["anitube.ninja",98],["gazzetta.it",99],["alliptvlinks.com",100],["waterfall.money",100],["port.hu",102],["dziennikbaltycki.pl",103],["dzienniklodzki.pl",103],["dziennikpolski24.pl",103],["dziennikzachodni.pl",103],["echodnia.eu",103],["expressbydgoski.pl",103],["expressilustrowany.pl",103],["gazetakrakowska.pl",103],["gazetalubuska.pl",103],["gazetawroclawska.pl",103],["gk24.pl",103],["gloswielkopolski.pl",103],["gol24.pl",103],["gp24.pl",103],["gra.pl",103],["gs24.pl",103],["kurierlubelski.pl",103],["motofakty.pl",103],["naszemiasto.pl",103],["nowiny24.pl",103],["nowosci.com.pl",103],["nto.pl",103],["polskatimes.pl",103],["pomorska.pl",103],["poranny.pl",103],["sportowy24.pl",103],["strefaagro.pl",103],["strefabiznesu.pl",103],["stronakobiet.pl",103],["telemagazyn.pl",103],["to.com.pl",103],["wspolczesna.pl",103],["course9x.com",103],["courseclub.me",103],["azrom.net",103],["alttyab.net",103],["esopress.com",103],["nesiaku.my.id",103],["onemanhua.com",104],["freeindianporn.mobi",104],["dr-farfar.com",105],["boyfriendtv.com",106],["brandstofprijzen.info",107],["netfuck.net",108],["blog24.me",[108,120]],["kisahdunia.com",108],["javsex.to",108],["nulljungle.com",108],["oyuncusoruyor.com",108],["pbarecap.ph",108],["sourds.net",108],["teknobalta.com",108],["tvinternetowa.info",108],["sqlserveregitimleri.com",108],["tutcourse.com",108],["readytechflip.com",108],["novinhastop.com",108],["warddogs.com",108],["dvdgayporn.com",108],["iimanga.com",108],["tinhocdongthap.com",108],["tremamnon.com",108],["423down.com",108],["brizzynovel.com",108],["jugomobile.com",108],["freecodezilla.net",108],["movieslegacy.com",108],["animekhor.xyz",108],["iconmonstr.com",108],["gay-tubes.cc",108],["rbxscripts.net",108],["comentariodetexto.com",108],["wordpredia.com",108],["livsavr.co",108],["allfaucet.xyz",[108,120]],["titbytz.tk",108],["replica-watch.info",108],["alludemycourses.com",108],["kayifamilytv.com",108],["iir.ai",109],["gameofporn.com",111],["qpython.club",112],["antifake-funko.fr",112],["e9china.net",113],["ac.ontools.net",113],["marketbeat.com",114],["hentaipornpics.net",115],["apps2app.com",116],["tubereader.me",117],["repretel.com",117],["upshrink.com",118],["loaninsurehub.com",119],["ohionowcast.info",120],["wiour.com",120],["bitzite.com",[120,124,125]],["appsbull.com",120],["diudemy.com",120],["maqal360.com",120],["bitcotasks.com",[120,240]],["videolyrics.in",120],["manofadan.com",120],["cempakajaya.com",120],["tagecoin.com",120],["doge25.in",120],["king-ptcs.com",120],["naijafav.top",120],["ourcoincash.xyz",120],["sh.techsamir.com",120],["claimcoins.site",120],["cryptosh.pro",120],["cryptoearnfaucet.com",120],["coinsrev.com",120],["go.freetrx.fun",120],["eftacrypto.com",120],["fescrypto.com",120],["earnhub.net",120],["kiddyshort.com",120],["tronxminer.com",120],["homeairquality.org",121],["fc-lc.xyz",122],["exego.app",123],["cutlink.net",123],["cutsy.net",123],["cutyurls.com",123],["cutty.app",123],["aiimgvlog.fun",126],["6indianporn.com",126],["amateurebonypics.com",126],["amateuryoungpics.com",126],["cinemabg.net",126],["desimmshd.com",126],["frauporno.com",126],["givemeaporn.com",126],["jav-asia.top",126],["javf.net",126],["javideo.net",126],["kr18plus.com",126],["pilibook.com",126],["pornborne.com",126],["porngrey.com",126],["qqxnxx.com",126],["sexvideos.host",126],["submilf.com",126],["subtaboo.com",126],["tktube.com",126],["xfrenchies.com",126],["coingraph.us",127],["momo-net.com",127],["maxgaming.fi",127],["vulture.com",128],["megaplayer.bokracdn.run",129],["hentaistream.com",130],["siteunblocked.info",131],["larvelfaucet.com",132],["feyorra.top",132],["claimtrx.com",132],["moviesyug.net",133],["w4files.ws",133],["parispi.net",134],["simkl.com",135],["sayrodigital.com",136],["mrproblogger.com",137],["themezon.net",137],["paperzonevn.com",138],["dailyvideoreports.net",139],["lewd.ninja",140],["systemnews24.com",141],["incestvidz.com",142],["niusdiario.es",143],["playporngames.com",144],["movi.pk",[145,150]],["justin.mp3quack.lol",147],["cutesexyteengirls.com",148],["asianembed.io",149],["0dramacool.net",150],["185.53.88.104",150],["185.53.88.204",150],["185.53.88.15",150],["123movies4k.net",150],["1movieshd.com",150],["1rowsports.com",150],["4share-mp3.net",150],["6movies.net",150],["9animetv.to",150],["720pstream.me",150],["aagmaal.com",150],["abysscdn.com",150],["adblockplustape.com",150],["ajkalerbarta.com",150],["akstream.xyz",150],["androidapks.biz",150],["androidsite.net",150],["animefenix.com",150],["animeonlinefree.org",150],["animesite.net",150],["animespank.com",150],["aniworld.to",150],["apkmody.io",150],["appsfree4u.com",150],["audioz.download",150],["bdnewszh.com",150],["beastlyprints.com",150],["bengalisite.com",150],["bestfullmoviesinhd.org",150],["betteranime.net",150],["blacktiesports.live",150],["buffsports.stream",150],["ch-play.com",150],["clickforhire.com",150],["cloudy.pk",150],["computercrack.com",150],["coolcast2.com",150],["crackedsoftware.biz",150],["crackfree.org",150],["cracksite.info",150],["cryptoblog24.info",150],["cuatrolatastv.blogspot.com",150],["cydiasources.net",150],["dirproxy.com",150],["dopebox.to",150],["downloadapk.info",150],["downloadapps.info",150],["downloadgames.info",150],["downloadmusic.info",150],["downloadsite.org",150],["downloadwella.com",150],["ebooksite.org",150],["educationtips213.blogspot.com",150],["egyup.live",150],["embed.meomeo.pw",150],["embed.scdn.to",150],["emulatorsite.com",150],["essaysharkwriting.club",150],["extrafreetv.com",150],["fakedetail.com",150],["fclecteur.com",150],["files.im",150],["flexyhit.com",150],["fmoviefree.net",150],["fmovies24.com",150],["footyhunter3.xyz",150],["freeflix.info",150],["freemoviesu4.com",150],["freeplayervideo.com",150],["freesoccer.net",150],["fseries.org",150],["gamefast.org",150],["gamesite.info",150],["gmanga.me",150],["gocast123.me",150],["gogohd.net",150],["gogoplay5.com",150],["gooplay.net",150],["gostreamon.net",150],["happy2hub.org",150],["harimanga.com",150],["healthnewsreel.com",150],["hexupload.net",150],["hinatasoul.com",150],["hindisite.net",150],["holymanga.net",150],["hxfile.co",150],["isosite.org",150],["iv-soft.com",150],["januflix.expert",150],["jewelry.com.my",150],["johnwardflighttraining.com",150],["kabarportal.com",150],["kstorymedia.com",150],["la123movies.org",150],["lespassionsdechinouk.com",150],["lilymanga.net",150],["linksdegrupos.com.br",150],["livestreamtv.pk",150],["macsite.info",150],["mangapt.com",150],["mangareader.to",150],["mangasite.org",150],["manhuascan.com",150],["megafilmeshdseries.com",150],["megamovies.org",150],["membed.net",150],["mgnetu.com",150],["moddroid.com",150],["moviefree2.com",150],["movies-watch.com.pk",150],["moviesite.app",150],["moviesonline.fm",150],["moviesx.org",150],["moviewatchonline.com.pk",150],["msmoviesbd.com",150],["musicsite.biz",150],["myfernweh.com",150],["myviid.com",150],["nazarickol.com",150],["newsrade.com",150],["noob4cast.com",150],["nsw2u.com",[150,241]],["oko.sh",150],["olympicstreams.me",150],["orangeink.pk",150],["owllink.net",150],["pahaplayers.click",150],["patchsite.net",150],["pdfsite.net",150],["play1002.com",150],["player-cdn.com",150],["productkeysite.com",150],["projectfreetv.one",150],["romsite.org",150],["rufiguta.com",150],["rytmp3.io",150],["send.cm",150],["seriesite.net",150],["seriezloaded.com.ng",150],["serijehaha.com",150],["shrugemojis.com",150],["siteapk.net",150],["siteflix.org",150],["sitegames.net",150],["sitekeys.net",150],["sitepdf.com",150],["sitetorrent.com",150],["softwaresite.net",150],["sportbar.live",150],["sportkart1.xyz",150],["ssyoutube.com",150],["stardima.com",150],["stream4free.live",150],["superapk.org",150],["supermovies.org",150],["tainio-mania.online",150],["talaba.su",150],["tamilguns.org",150],["tatabrada.tv",150],["theflixer.tv",150],["thememypc.net",150],["thetechzone.online",150],["thripy.com",150],["tonnestreamz.xyz",150],["travelplanspro.com",150],["turcasmania.com",150],["tusfiles.com",150],["tvonlinesports.com",150],["ultramovies.org",150],["uploadbank.com",150],["urdubolo.pk",150],["vidspeeds.com",150],["vumoo.to",150],["warezsite.net",150],["watchmovies2.com",150],["watchmoviesforfree.org",150],["watchofree.com",150],["watchsite.net",150],["watchsouthpark.tv",150],["watchtvch.club",150],["web.livecricket.is",150],["webseries.club",150],["worldcupstream.pm",150],["y2mate.com",150],["youapk.net",150],["youtube4kdownloader.com",150],["yts-subs.com",150],["haho.moe",151],["nicy-spicy.pw",152],["fap-guru.cam",153],["novelmultiverse.com",154],["mylegalporno.com",155],["thecut.com",158],["novelism.jp",159],["alphapolis.co.jp",160],["okrzone.com",161],["game3rb.com",162],["javhub.net",162],["thotvids.com",163],["berklee.edu",164],["rawkuma.com",[165,166]],["moviesjoyhd.to",166],["imeteo.sk",167],["youtubemp3donusturucu.net",168],["surfsees.com",170],["vivo.st",[171,172]],["alueviesti.fi",174],["kiuruvesilehti.fi",174],["lempaala.ideapark.fi",174],["olutposti.fi",174],["urjalansanomat.fi",174],["joyhints.com",175],["tainhanhvn.com",177],["titantv.com",178],["3cinfo.net",179],["transportationlies.org",180],["camarchive.tv",181],["crownimg.com",181],["freejav.guru",181],["hentai2read.com",181],["icyporno.com",181],["illink.net",181],["javtiful.com",181],["m-hentai.net",181],["pornblade.com",181],["pornfelix.com",181],["pornxxxxtube.net",181],["redwap.me",181],["redwap2.com",181],["redwap3.com",181],["tubxporn.xxx",181],["ver-comics-porno.com",181],["ver-mangas-porno.com",181],["xanimeporn.com",181],["xxxvideohd.net",181],["zetporn.com",181],["cocomanga.com",182],["mcleaks.net",183],["explorecams.com",183],["minecraft.buzz",183],["chillx.top",184],["playerx.stream",184],["m.liputan6.com",186],["stardewids.com",[186,208]],["ingles.com",187],["spanishdict.com",187],["rureka.com",188],["bunkr.is",189],["amateur8.com",190],["freeporn8.com",190],["maturetubehere.com",190],["embedo.co",191],["corriere.it",192],["oggi.it",192],["2the.space",193],["apkcombo.com",195],["sponsorhunter.com",196],["soft98.ir",197],["novelssites.com",198],["haxina.com",199],["cryptofenz.xyz",199],["torrentmac.net",200],["moviezaddiction.icu",201],["dlpanda.com",202],["socialmediagirls.com",203],["einrichtungsbeispiele.de",204],["weadown.com",205],["molotov.tv",206],["freecoursesonline.me",207],["adelsfun.com",207],["advantien.com",207],["bailbondsfinder.com",207],["bigpiecreative.com",207],["childrenslibrarylady.com",207],["classifarms.com",207],["comtasq.ca",207],["crone.es",207],["ctrmarketingsolutions.com",207],["dropnudes.com",207],["ftuapps.dev",207],["genzsport.com",207],["ghscanner.com",207],["grsprotection.com",207],["gruporafa.com.br",207],["inmatefindcalifornia.com",207],["inmatesearchidaho.com",207],["itsonsitetv.com",207],["mfmfinancials.com",207],["myproplugins.com",207],["onehack.us",207],["ovester.com",207],["paste.bin.sx",207],["privatenudes.com",207],["renoconcrete.ca",207],["richieashbeck.com",207],["sat.technology",207],["short1ink.com",207],["stpm.co.uk",207],["wegotcookies.co",207],["mathcrave.com",207],["commands.gg",208],["smgplaza.com",209],["autosport.com",[210,211]],["motorsport.com",[210,211]],["freepik.com",212],["pinloker.com",214],["sekilastekno.com",214],["diyphotography.net",215],["bitchesgirls.com",216],["shopforex.online",217],["programmingeeksclub.com",218],["easymc.io",219],["diendancauduong.com",220],["parentcircle.com",221],["h-game18.xyz",222],["nopay.info",223],["wheelofgold.com",224],["shortlinks.tech",225],["recipahi.com",226],["davescomputertips.com",227],["skill4ltu.eu",229],["freepikdownloader.com",230],["freepasses.org",231],["iusedtobeaboss.com",232],["androidpolice.com",233],["cbr.com",233],["dualshockers.com",233],["gamerant.com",233],["thegamer.com",233],["blogtruyenmoi.com",234],["igay69.com",235],["graphicget.com",236],["qiwi.gg",237],["netcine2.la",238],["cbc.ca",239]]);

const entitiesMap = new Map([["kisscartoon",1],["kissasian",8],["ganool",8],["pirate",8],["piratebay",8],["pirateproxy",8],["proxytpb",8],["thepiratebay",8],["limetorrents",[10,17]],["king-pes",10],["depedlps",10],["komikcast",10],["idedroidsafelink",10],["links-url",10],["eikaiwamastery",10],["ak4eg",10],["xhamster",11],["xhamster1",11],["xhamster5",11],["xhamster7",11],["rexporn",11],["movies07",11],["pornocomics",11],["streanplay",12],["steanplay",12],["liferayiseasy",[13,14]],["pahe",17],["yts",17],["tube8",17],["topeuropix",17],["moviescounter",17],["torrent9",17],["desiremovies",17],["movs4u",17],["uwatchfree",17],["hydrax",17],["4movierulz",17],["projectfreetv",17],["arabseed",17],["btdb",[17,59]],["skymovieshd",17],["world4ufree",17],["streamsport",17],["rojadirectatvhd",17],["userload",17],["freecoursesonline",19],["lordpremium",19],["todovieneok",19],["novablogitalia",19],["anisubindo",19],["btvsports",19],["adyou",20],["fxporn69",23],["sexwebvideo",30],["pornomoll",30],["gsurl",33],["mimaletadepeliculas",34],["readcomiconline",35],["burningseries",36],["dz4soft",37],["yoututosjeff",37],["ebookmed",37],["lanjutkeun",37],["novelasesp",37],["singingdalong",37],["doujindesu",37],["xmovies8",40],["mega-dvdrip",47],["peliculas-dvdrip",47],["desbloqueador",48],["newpelis",[49,57]],["pelix",[49,57]],["allcalidad",[49,181]],["khatrimaza",49],["camwhores",51],["camwhorestv",51],["uproxy",51],["nekopoi",54],["mirrorace",63],["mixdrp",68],["asiansex",70],["japanfuck",70],["japanporn",70],["teensex",70],["vintagetube",70],["xxxmovies",70],["zooqle",74],["hdfull",78],["mangamanga",79],["streameast",81],["thestreameast",81],["vev",85],["vidop",85],["zone-telechargement",87],["megalink",92],["gmx",93],["mega1080p",98],["9hentai",101],["gaypornhdfree",108],["cinemakottaga",108],["privatemoviez",108],["apkmaven",108],["popcornstream",110],["pornktube",126],["watchseries",126],["milfnut",127],["pagalmovies",133],["7starhd",133],["jalshamoviez",133],["9xupload",133],["bdupload",133],["desiupload",133],["rdxhd1",133],["moviessources",146],["nuvid",147],["goload",[149,150]],["0gomovie",150],["0gomovies",150],["123moviefree",150],["1kmovies",150],["1madrasdub",150],["1primewire",150],["2embed",150],["2madrasdub",150],["2umovies",150],["4anime",150],["9xmovies",150],["altadefinizione01",150],["anitube",150],["atomixhq",150],["beinmatch",150],["brmovies",150],["cima4u",150],["clicknupload",150],["cmovies",150],["couchtuner",150],["cricfree",150],["crichd",150],["databasegdriveplayer",150],["dood",150],["f1stream",150],["faselhd",150],["fbstream",150],["file4go",150],["filemoon",150],["filepress",[150,213]],["filmlinks4u",150],["filmpertutti",150],["filmyzilla",150],["fmovies",150],["french-stream",150],["fsapi",150],["fzlink",150],["gdriveplayer",150],["gofilms4u",150],["gogoanime",150],["gomoviefree",150],["gomoviz",150],["gowatchseries",150],["hdmoviefair",150],["hdmovies4u",150],["hdmovies50",150],["hdmoviesfair",150],["hh3dhay",150],["hindilinks4u",150],["hotmasti",150],["hurawatch",150],["klmanga",150],["klubsports",150],["libertestreamvf",150],["livetvon",150],["manga1000",150],["manga1001",150],["mangaraw",150],["mangarawjp",150],["mlbstream",150],["motogpstream",150],["movierulz",150],["movies123",150],["movies2watch",150],["moviesden",150],["moviezaddiction",150],["myflixer",150],["nbastream",150],["netcine",150],["nflstream",150],["nhlstream",150],["onlinewatchmoviespk",150],["pctfenix",150],["pctnew",150],["pksmovies",150],["plyjam",150],["plylive",150],["pogolinks",150],["popcorntime",150],["poscitech",150],["prmovies",150],["rugbystreams",150],["shahed4u",150],["sflix",150],["sitesunblocked",150],["socceronline",150],["solarmovies",150],["sportcast",150],["sportskart",150],["sports-stream",150],["streaming-french",150],["streamers",150],["streamingcommunity",150],["strikeout",150],["t20cup",150],["tennisstreams",150],["torrentdosfilmes",150],["toonanime",150],["tvply",150],["ufcstream",150],["uptomega",150],["uqload",150],["vudeo",150],["vidoo",150],["vipbox",150],["vipboxtv",150],["vipleague",150],["viprow",150],["yesmovies",150],["yomovies",150],["yomovies1",150],["yt2mp3s",150],["kat",150],["katbay",150],["kickass",150],["kickasshydra",150],["kickasskat",150],["kickass2",150],["kickasstorrents",150],["kat2",150],["kattracker",150],["thekat",150],["thekickass",150],["kickassz",150],["kickasstorrents2",150],["topkickass",150],["kickassgo",150],["kkickass",150],["kkat",150],["kickasst",150],["kick4ss",150],["guardaserie",156],["cine-calidad",157],["videovard",173],["gntai",181],["grantorrent",181],["mejortorrent",181],["mejortorrento",181],["mejortorrents",181],["mejortorrents1",181],["mejortorrentt",181],["softonic",194],["bg-gledai",207],["gledaitv",207],["motchill",228]]);

const exceptionsMap = new Map([["mentor.duden.de",[80]],["forum.soft98.ir",[197]]]);

/******************************************************************************/

function addEventListenerDefuser(
    type = '',
    pattern = ''
) {
    const safe = safeSelf();
    const extraArgs = safe.getExtraArgs(Array.from(arguments), 2);
    const reType = safe.patternToRegex(type, undefined, true);
    const rePattern = safe.patternToRegex(pattern);
    const log = shouldLog(extraArgs);
    const debug = shouldDebug(extraArgs);
    const targetSelector = extraArgs.elements || undefined;
    const shouldPrevent = (thisArg, type, handler) => {
        if ( targetSelector !== undefined ) {
            const elems = Array.from(document.querySelectorAll(targetSelector));
            if ( elems.includes(thisArg) === false ) { return false; }
        }
        const matchesType = safe.RegExp_test.call(reType, type);
        const matchesHandler = safe.RegExp_test.call(rePattern, handler);
        const matchesEither = matchesType || matchesHandler;
        const matchesBoth = matchesType && matchesHandler;
        if ( log === 1 && matchesBoth || log === 2 && matchesEither || log === 3 ) {
            safe.uboLog(`addEventListener('${type}', ${handler})`);
        }
        if ( debug === 1 && matchesBoth || debug === 2 && matchesEither ) {
            debugger; // jshint ignore:line
        }
        return matchesBoth;
    };
    const trapEddEventListeners = ( ) => {
        const eventListenerHandler = {
            apply: function(target, thisArg, args) {
                let type, handler;
                try {
                    type = String(args[0]);
                    handler = args[1] instanceof Function
                        ? String(safe.Function_toString(args[1]))
                        : String(args[1]);
                } catch(ex) {
                }
                if ( shouldPrevent(thisArg, type, handler) ) { return; }
                return Reflect.apply(target, thisArg, args);
            },
            get(target, prop, receiver) {
                if ( prop === 'toString' ) {
                    return target.toString.bind(target);
                }
                return Reflect.get(target, prop, receiver);
            },
        };
        self.EventTarget.prototype.addEventListener = new Proxy(
            self.EventTarget.prototype.addEventListener,
            eventListenerHandler
        );
    };
    runAt(( ) => {
        trapEddEventListeners();
    }, extraArgs.runAt);
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

function shouldDebug(details) {
    if ( details instanceof Object === false ) { return false; }
    return scriptletGlobals.has('canDebug') && details.debug;
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
    try { addEventListenerDefuser(...argsList[i]); }
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
    return uBOL_addEventListenerDefuser();
}

// Firefox
{
    const page = self.wrappedJSObject;
    let script, url;
    try {
        page.uBOL_addEventListenerDefuser = cloneInto([
            [ '(', uBOL_addEventListenerDefuser.toString(), ')();' ],
            { type: 'text/javascript; charset=utf-8' },
        ], self);
        const blob = new page.Blob(...page.uBOL_addEventListenerDefuser);
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
    delete page.uBOL_addEventListenerDefuser;
}

/******************************************************************************/

// End of local scope
})();

/******************************************************************************/

void 0;
