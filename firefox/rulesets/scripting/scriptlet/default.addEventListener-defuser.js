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

const scriptletGlobals = {}; // jshint ignore: line

const argsList = [["load","Object"],["mousedown","clientX"],["load","hard_block"],["/contextmenu|keydown/"],["","adb"],["click","ClickHandler"],["load","IsAdblockRequest"],["/^(?:click|mousedown)$/","_0x"],["error"],["load","onload"],["","BACK"],["load","getComputedStyle"],["load","adsense"],["load","(!o)"],["load","(!i)"],["","_0x"],["","Adblock"],["load","nextFunction"],["/^(?:click|mousedown)$/","bypassEventsInProxies"],["","window.open"],["","open"],["click","exopop"],["/^(?:load|click)$/","popMagic"],["mousedown","popundrInit"],["getexoloader"],["","pop"],["load","exoJsPop101"],["/^loadex/"],["","/exo"],["","_blank"],["",";}"],["load","BetterPop"],["mousedown","preventDefault"],["load","advertising"],["click","preventDefault"],["load","2000"],["/^(click|mousedown|mousemove|touchstart|touchend|touchmove)/","system.popunder"],["load","adb"],["/^(?:click|mousedown|mousemove|touchstart|touchend|touchmove)$/","system.popunder"],["","'0x"],["/DOMContentLoaded|load/","y.readyState"],["/error|canplay/","(t)"],["load","hblocked"],["error","Adblocker"],["DOMContentLoaded","adlinkfly"],["DOMContentLoaded","shortener"],["mousedown","trigger"],["","0x"],["","Pop"],["/^(?:click|mousedown)$/","popunder"],["DOMContentLoaded","preventExit"],["","adsense"],["load"],["click","pop_under"],["load","url"],["load","adverts-top-container"],["","Date"],["DOMContentLoaded","&nbsp"],["click","read_cookie"],["","midRoll"],["click","_0x"],["load","isBlanketFound"],["load","showModal"],["click","trigger"],["mouseout","clientWidth"],["load","download-wrapper"],["load","autoRecov"],["popstate","noPop"],["/^(?:click|mousedown)$/","ppu"],["click","native code"],["/^(?:mousedown|mouseup)$/","0x"],["click","popundr"],["click"],["DOMContentLoaded","compupaste"],["mousedown","!!{});"],["DOMContentLoaded","/adblock/i"],["keydown"],["DOMContentLoaded","isMobile"],["/^/","0x"],["load","PrivateMode"],["scroll","_0x"],["DOMContentLoaded","checkVPN"],["/^(?:click|mousedown|mouseup)$/","di()"],["","\\"],["popstate"],["click","my_inter_listen"],["load","appendChild"],["","bi()"],["","checkTarget"],["click","popunder"],["timeupdate"],["scroll","getElementById"],["load","undefined"],["DOMContentLoaded","scriptwz_url"],["load","0x"],["DOMContentLoaded","btoa"],["adblockActivated"],["click","saveLastEvent"],["DOMContentLoaded","offsetHeight"],["","show"],["/.?/","popMagic"],["","ads"],["click","interstitial"],["load","antiblock"],["DOMContentLoaded","adsBlocked"],["load",".appendChild"],["","btoa"],["","exopop"],["DOMContentLoaded","AdBlock"],["load","blocker"],["mouseleave","NativeDisplayAdID"],["mouseover","event.triggered"],["load","removeChild"],["load","ads"],["click","ShouldShow"],["click","clickCount"],["mousedown","localStorage"],["DOMContentLoaded","document.documentElement.lang.toLowerCase"],["/adblock/i"],["load","doTest"],["DOMContentLoaded","antiAdBlockerHandler"],["DOMContentLoaded","daadb_get_data_fetch"],["click","splashPage"],["load","detect-modal"],["load","_0x"],["DOMContentLoaded","canRedirect"],["DOMContentLoaded","adb"],["error","/\\{[a-z]\\(e\\)\\}/"],["load",".call(this"],["load","adblock"],["/touchmove|wheel/","preventDefault()"],["load","showcfkModal"],["click","attached","elements","div[class=\"share-embed-container\"]"],["click","fp-screen"],["DOMContentLoaded","iframe"],["","/_blank/i"],["load","htmls"],["blur","focusOut"],["click","/handleClick|popup/"],["load","bypass"],["DOMContentLoaded","location.href"],["","popMagic"],["click","Popunder"],["contextmenu"],["blur","counter"],["click","maxclick"],["/^(?:click|mousedown)$/","latest!=="],["DOMContentLoaded",".ready"],["load","script"],["","/pop|wm|forceClick/"],["load","block"],["","/_0x|localStorage\\.getItem/"],["DOMContentLoaded","adblock"],["load","head"],["visibilitychange"],["load","/showModal|isBlanketFound/"],["click","shouldShow"],["","/ads|Modal/"],["DOMContentLoaded","init"],["load","Adblock"],["DOMContentLoaded","window.open"],["","vads"],["devtoolschange"],["click","open"],["beforeunload"],["","break;case $."],["mouseup","decodeURIComponent"],["/(?:click|touchend)/","_0x"],["","removeChild"],["click","pu_count"],["","/pop|_blank/"],["click","allclick_Public"],["click","0x"],["/touchstart|mousedown|click/","latest"],["blur","native code"],["blur","event.simulate"],["click","_blank"],["DOMContentLoaded","0x"],["click","overlay"],["scroll","undefined"],["readystatechange","document.removeEventListener"],["mousedown","shown_at"],["scroll","detect"],["click","t(a)"],["","focus"],["DOMContentLoaded","deblocker"],["","preventDefault"],["click","tabunder"],["mouseup","catch"],["scroll","innerHeight"],["hashchange"],["load","/nextFunction|2000/"],["load","player"],["","document.oncontextmenu"],["","about:blank"],["click","popMagic"],["load","popMagic"],["DOMContentLoaded","adsSrc"],["np.detect"],["click","Popup"],["","/open.*_blank/"],["scroll"],["","isBlocking"],["timeupdate","","elements",".quiver-cam-player--ad-not-running.quiver-cam-player--free video"],["","$"],["","exoJsPop101"],["/click|mousedown/","catch"],["","init"],["adb"],["scroll","modal"],["blur"],["DOMContentLoaded","clientHeight"],["click","window.focus"],["click","[native code]"],["click","event.dispatch"],["","Math"],["DOMContentLoaded","popupurls"],["","tabUnder"],["load","XMLHttpRequest"],["load","puURLstrpcht"],["load","AdBlocker"],["","showModal"],["","goog"],["load","abDetectorPro"],["","document.body"],["","modal"],["click","pop"],["click","adobeModalTestABenabled"],["blur","console.log"],["","AdB"],["load","adSession"],["load","Ads"],["DOMContentLoaded","googlesyndication"],["np.evtdetect"],["load","popunder"],["scroll","function(e)"],["DOMContentLoaded","adlinkfly_url"],["mousedown"],["load","document.getElementById"],["mousedown","tabUnder"],["click","popactive"],["load","adsbygoogle"],["DOMContentLoaded","location.replace"],["load","modal_blocker"],["click","isOpened"],["mousedown","pop.doEvent"],["error","blocker"],["click","alink"],["load","[native code]"],["","daadb"],["load","google-analytics"],["","sessionStorage"],["load","fetch"],["click","pingUrl"],["mousedown","scoreUrl"],["click","/event_callback=function\\(\\){window\\.location=t\\.getAttribute\\(\"href\"\\)/"],["load","/function.{1,3000}$/"],["","Adb"]];

const hostnamesMap = new Map([["newser.com",0],["sport1.de",2],["userscloud.com",3],["timesofindia.indiatimes.com",4],["drrtyr.mx",4],["pinoyalbums.com",4],["multiplayer.it",4],["mediafire.com",[5,6]],["pinsystem.co.uk",7],["fembed.com",7],["ancensored.com",7],["mp3fiber.com",[7,17]],["xrivonet.info",7],["afreesms.com",8],["tu.no",8],["tio.ch",8],["lavanguardia.com",8],["eplayer.click",8],["kingofdown.com",9],["radiotormentamx.com",9],["quelleestladifference.fr",9],["otakuworldsite.blogspot.com",9],["ad-itech.blogspot.com",9],["sna3talaflam.com",9],["agar.pro",9],["unlockapk.com",9],["mobdi3ips.com",9],["socks24.org",9],["interviewgig.com",9],["javaguides.net",9],["almohtarif-tech.net",9],["forum.release-apk.com",9],["devoloperxda.blogspot.com",9],["zwergenstadt.com",9],["primedeportes.es",9],["9goals.live",9],["upxin.net",9],["ciudadblogger.com",9],["ke-1.com",9],["secretsdeepweb.blogspot.com",9],["bit-shares.com",9],["itdmusics.com",9],["aspdotnet-suresh.com",9],["tudo-para-android.com",9],["urdulibrarypk.blogspot.com",9],["zerotopay.com",9],["akw.to",9],["mawsueaa.com",9],["hesgoal-live.io",9],["king-shoot.io",9],["bibme.org",13],["citationmachine.net",13],["easybib.com",14],["vermangasporno.com",15],["imgtorrnt.in",15],["picbaron.com",[15,141]],["letmejerk.com",15],["letmejerk2.com",15],["letmejerk3.com",15],["letmejerk4.com",15],["letmejerk5.com",15],["letmejerk6.com",15],["letmejerk7.com",15],["dlapk4all.com",15],["kropic.com",15],["kvador.com",15],["pdfindir.net",15],["brstej.com",15],["topwwnews.com",15],["xsanime.com",15],["vidlo.us",15],["put-locker.com",15],["youx.xxx",15],["animeindo.asia",15],["masahub.net",15],["adclickersbot.com",15],["badtaste.it",16],["mage.si",17],["totaldebrid.org",17],["neko-miku.com",17],["elsfile.org",17],["venstrike.jimdofree.com",17],["schrauben-normen.de",17],["avengerinator.blogspot.com",17],["link-to.net",17],["hanimesubth.com",17],["gsmturkey.net",17],["adshrink.it",17],["presentation-ppt.com",17],["mangacanblog.com",17],["pekalongan-cits.blogspot.com",17],["4tymode.win",17],["eurotruck2.com.br",17],["linkvertise.com",17],["reifenrechner.at",17],["tire-size-calculator.info",17],["linuxsecurity.com",17],["encodinghub.com",17],["itsguider.com",17],["cotravinh.blogspot.com",17],["itudong.com",17],["shortx.net",17],["lecturel.com",17],["bakai.org",17],["nar.k-ba.net",17],["tiroalpalo.org",17],["shemalez.com",19],["tubepornclassic.com",19],["gotporn.com",20],["freepornrocks.com",20],["tvhai.org",20],["simpcity.su",20],["realgfporn.com",[21,22]],["titsbox.com",21],["thisvid.com",22],["xvideos-downloader.net",22],["imgspice.com",23],["vikiporn.com",24],["tnaflix.com",24],["hentai2w.com",[24,195]],["yourlust.com",24],["hotpornfile.org",24],["watchfreexxx.net",24],["vintageporntubes.com",24],["angelgals.com",24],["babesexy.com",24],["porndaa.com",24],["ganstamovies.com",24],["youngleak.com",24],["porndollz.com",24],["xnxxvideo.pro",24],["xvideosxporn.com",24],["filmpornofrancais.fr",24],["pictoa.com",[24,47]],["tubator.com",24],["adultasianporn.com",24],["nsfwmonster.com",24],["girlsofdesire.org",24],["gaytail.com",24],["fetish-bb.com",24],["rumporn.com",24],["soyoungteens.com",24],["zubby.com",24],["lesbian8.com",24],["gayforfans.com",24],["reifporn.de",24],["javtsunami.com",24],["18tube.sex",24],["xxxextreme.org",24],["amateurs-fuck.com",24],["sex-amateur-clips.com",24],["hentaiworld.tv",24],["dads-banging-teens.com",24],["home-xxx-videos.com",24],["mature-chicks.com",24],["teens-fucking-matures.com",24],["hqbang.com",24],["darknessporn.com",24],["familyporner.com",24],["freepublicporn.com",24],["pisshamster.com",24],["punishworld.com",24],["xanimu.com",24],["pornhd.com",25],["cnnamador.com",[25,36]],["cle0desktop.blogspot.com",25],["turkanime.co",25],["camclips.tv",[25,48]],["blackpornhq.com",25],["xsexpics.com",25],["ulsex.net",25],["wannafreeporn.com",25],["ytube2dl.com",25],["multiup.us",25],["protege-torrent.com",25],["pussyspace.com",[26,27]],["pussyspace.net",[26,27]],["empflix.com",28],["cpmlink.net",29],["bdsmstreak.com",29],["cutpaid.com",29],["pornforrelax.com",29],["fatwhitebutt.com",29],["mavplay.xyz",29],["sunporno.com",[30,31,195]],["short.pe",32],["bs.to",34],["efukt.com",34],["generacionretro.net",35],["nuevos-mu.ucoz.com",35],["micloudfiles.com",35],["mimaletamusical.blogspot.com",35],["visionias.net",35],["b3infoarena.in",35],["lurdchinexgist.blogspot.com",35],["thefreedommatrix.blogspot.com",35],["hentai-vl.blogspot.com",35],["projetomotog.blogspot.com",35],["ktmx.pro",35],["lirik3satu.blogspot.com",35],["marketmovers.it",35],["pharmaguideline.com",35],["safemaru.blogspot.com",35],["mixloads.com",35],["mangaromance.eu",35],["interssh.com",35],["freesoftpdfdownload.blogspot.com",35],["cirokun.blogspot.com",35],["myadslink.com",35],["blackavelic.com",35],["server.satunivers.tv",35],["eg-akw.com",35],["xn--mgba7fjn.cc",35],["flashingjungle.com",36],["ma-x.org",37],["lavozdegalicia.es",37],["xmovies08.org",39],["globaldjmix.com",40],["zazzybabes.com",41],["haaretz.co.il",42],["haaretz.com",42],["slate.com",43],["megalinks.info",44],["megapastes.com",44],["mega-mkv.com",[44,45]],["mkv-pastes.com",44],["zpaste.net",44],["zlpaste.net",44],["9xlinks.site",44],["zona-leros.net",45],["acortarm.xyz",46],["acortame.xyz",46],["cine.to",[47,200]],["kissasia.cc",47],["digjav.com",48],["videoszoofiliahd.com",49],["xxxtubezoo.com",50],["zooredtube.com",50],["megacams.me",52],["rlslog.net",52],["porndoe.com",53],["acienciasgalilei.com",55],["playrust.io",56],["payskip.org",57],["short-url.link",58],["tubedupe.com",59],["mcrypto.club",60],["fatgirlskinny.net",61],["polska-ie.com",61],["windowsmatters.com",61],["canaltdt.es",62],["masbrooo.com",62],["2ndrun.tv",62],["stfly.me",63],["oncehelp.com",63],["queenfaucet.website",63],["curto.win",63],["smallseotools.com",64],["macwelt.de",66],["pcwelt.de",66],["capital.de",66],["geo.de",66],["allmomsex.com",67],["allnewindianporn.com",67],["analxxxvideo.com",67],["animalextremesex.com",67],["anime3d.xyz",67],["animefuckmovies.com",67],["animepornfilm.com",67],["animesexbar.com",67],["animesexclip.com",67],["animexxxsex.com",67],["animexxxfilms.com",67],["anysex.club",67],["apetube.asia",67],["asianfuckmovies.com",67],["asianfucktube.com",67],["asianporn.sexy",67],["asiansexcilps.com",67],["beeg.fund",67],["beegvideoz.com",67],["bestasiansex.pro",67],["bravotube.asia",67],["brutalanimalsfuck.com",67],["candyteenporn.com",67],["daddyfuckmovies.com",67],["desifuckonline.com",67],["exclusiveasianporn.com",67],["exteenporn.com",67],["fantasticporn.net",67],["fantasticyoungporn.com",67],["fineasiansex.com",67],["firstasianpussy.com",67],["freeindiansextube.com",67],["freepornasians.com",67],["freerealvideo.com",67],["fuck-beeg.com",67],["fuck-xnxx.com",67],["fuckasian.pro",67],["fuckfuq.com",67],["fuckundies.com",67],["gojapaneseporn.com",67],["golderotica.com",67],["goodyoungsex.com",67],["goyoungporn.com",67],["hardxxxmoms.com",67],["hdvintagetube.com",67],["hentaiporn.me",67],["hentaisexfilms.com",67],["hentaisexuality.com",67],["hot-teens-movies.mobi",67],["hotanimepornvideos.com",67],["hotanimevideos.com",67],["hotasianpussysex.com",67],["hotjapaneseshows.com",67],["hotmaturetube.com",67],["hotmilfs.pro",67],["hotorientalporn.com",67],["hotpornyoung.com",67],["hotxxxjapanese.com",67],["hotxxxpussy.com",67],["indiafree.net",67],["indianpornvideo.online",67],["japanpornclip.com",67],["japanesetube.video",67],["japansex.me",67],["japanesexxxporn.com",67],["japansporno.com",67],["japanxxx.asia",67],["japanxxxworld.com",67],["keezmovies.surf",67],["lingeriefuckvideo.com",67],["liveanimalporn.zooo.club",67],["madhentaitube.com",67],["megahentaitube.com",67],["megajapanesesex.com",67],["megajapantube.com",67],["milfxxxpussy.com",67],["momsextube.pro",67],["momxxxass.com",67],["monkeyanimalporn.com",67],["moviexxx.mobi",67],["newanimeporn.com",67],["newjapanesexxx.com",67],["nicematureporn.com",67],["nudeplayboygirls.com",67],["openxxxporn.com",67],["originalindianporn.com",67],["originalteentube.com",67],["pig-fuck.com",67],["plainasianporn.com",67],["popularasianxxx.com",67],["pornanimetube.com",67],["pornasians.pro",67],["pornhat.asia",67],["pornheed.online",67],["pornjapanesesex.com",67],["pornomovies.asia",67],["pornvintage.tv",67],["primeanimesex.com",67],["realjapansex.com",67],["realmomsex.com",67],["redsexhub.com",67],["retroporn.world",67],["retrosexfilms.com",67],["sex-free-movies.com",67],["sexanimesex.com",67],["sexanimetube.com",67],["sexjapantube.com",67],["sexmomvideos.com",67],["sexteenxxxtube.com",67],["sexxxanimal.com",67],["sexyoungtube.com",67],["sexyvintageporn.com",67],["sopornmovies.com",67],["spicyvintageporn.com",67],["sunporno.club",67],["tabooanime.club",67],["teenextrem.com",67],["teenfucksex.com",67],["teenhost.net",67],["teensexass.com",67],["tnaflix.asia",67],["totalfuckmovies.com",67],["totalmaturefuck.com",67],["txxx.asia",67],["voyeurpornsex.com",67],["warmteensex.com",67],["wetasiancreampie.com",67],["wildhentaitube.com",67],["wowyoungsex.com",67],["xhamster-art.com",67],["xmovie.pro",67],["xnudevideos.com",67],["xnxxjapon.com",67],["xpics.me",67],["xvide.me",67],["xxxanimefuck.com",67],["xxxanimevideos.com",67],["xxxanimemovies.com",67],["xxxhentaimovies.com",67],["xxxhothub.com",67],["xxxjapaneseporntube.com",67],["xxxlargeporn.com",67],["xxxmomz.com",67],["xxxpornmilf.com",67],["xxxpussyclips.com",67],["xxxpussysextube.com",67],["xxxretrofuck.com",67],["xxxsex.pro",67],["xxxsexyjapanese.com",67],["xxxteenyporn.com",67],["xxxvideo.asia",67],["xxxvideos.ink",67],["xxxyoungtv.com",67],["youjizzz.club",67],["youngpussyfuck.com",67],["bayimg.com",68],["celeb.gate.cc",69],["masterplayer.xyz",71],["pussy-hub.com",71],["porndex.com",72],["compucalitv.com",73],["diariodenavarra.es",75],["duden.de",77],["pennlive.com",79],["beautypageants.indiatimes.com",80],["01fmovies.com",81],["lnk2.cc",83],["fullhdxxx.com",84],["luscious.net",[84,141]],["classicpornbest.com",84],["xstory-fr.com",84],["1youngteenporn.com",84],["www-daftarharga.blogspot.com",[84,184]],["miraculous.to",[84,190]],["vtube.to",84],["gosexpod.com",85],["otakukan.com",86],["xcafe.com",87],["pornfd.com",87],["venusarchives.com",87],["imagehaha.com",88],["imagenpic.com",88],["imageshimage.com",88],["imagetwist.com",88],["k1nk.co",89],["watchasians.cc",89],["alexsports.xyz",89],["lulustream.com",89],["luluvdo.com",89],["web.de",90],["news18.com",91],["thelanb.com",92],["dropmms.com",92],["softwaredescargas.com",93],["cracking-dz.com",94],["anitube.ninja",95],["gazzetta.it",96],["port.hu",98],["dziennikbaltycki.pl",99],["dzienniklodzki.pl",99],["dziennikpolski24.pl",99],["dziennikzachodni.pl",99],["echodnia.eu",99],["expressbydgoski.pl",99],["expressilustrowany.pl",99],["gazetakrakowska.pl",99],["gazetalubuska.pl",99],["gazetawroclawska.pl",99],["gk24.pl",99],["gloswielkopolski.pl",99],["gol24.pl",99],["gp24.pl",99],["gra.pl",99],["gs24.pl",99],["kurierlubelski.pl",99],["motofakty.pl",99],["naszemiasto.pl",99],["nowiny24.pl",99],["nowosci.com.pl",99],["nto.pl",99],["polskatimes.pl",99],["pomorska.pl",99],["poranny.pl",99],["sportowy24.pl",99],["strefaagro.pl",99],["strefabiznesu.pl",99],["stronakobiet.pl",99],["telemagazyn.pl",99],["to.com.pl",99],["wspolczesna.pl",99],["course9x.com",99],["courseclub.me",99],["azrom.net",99],["alttyab.net",99],["esopress.com",99],["nesiaku.my.id",99],["onemanhua.com",100],["freeindianporn.mobi",100],["dr-farfar.com",101],["boyfriendtv.com",102],["brandstofprijzen.info",103],["netfuck.net",104],["blog24.me",[104,136]],["kisahdunia.com",104],["javsex.to",104],["nulljungle.com",104],["oyuncusoruyor.com",104],["pbarecap.ph",104],["sourds.net",104],["teknobalta.com",104],["tvinternetowa.info",104],["sqlserveregitimleri.com",104],["tutcourse.com",104],["readytechflip.com",104],["novinhastop.com",104],["warddogs.com",104],["dvdgayporn.com",104],["iimanga.com",104],["tinhocdongthap.com",104],["tremamnon.com",104],["423down.com",104],["brizzynovel.com",104],["jugomobile.com",104],["freecodezilla.net",104],["animekhor.xyz",104],["iconmonstr.com",104],["gay-tubes.cc",104],["rbxscripts.net",104],["comentariodetexto.com",104],["wordpredia.com",104],["livsavr.co",104],["allfaucet.xyz",[104,136]],["titbytz.tk",104],["replica-watch.info",104],["alludemycourses.com",104],["kayifamilytv.com",104],["iir.ai",105],["gameofporn.com",107],["qpython.club",108],["antifake-funko.fr",108],["dktechnicalmate.com",108],["recipahi.com",108],["e9china.net",109],["ontools.net",109],["marketbeat.com",110],["hentaipornpics.net",111],["apps2app.com",112],["alliptvlinks.com",113],["waterfall.money",113],["xvideos.com",114],["xvideos2.com",114],["homemoviestube.com",115],["sexseeimage.com",115],["jpopsingles.eu",117],["azmath.info",117],["downfile.site",117],["downphanmem.com",117],["expertvn.com",117],["memangbau.com",117],["trangchu.news",117],["aztravels.net",117],["ielts-isa.edu.vn",117],["techedubyte.com",[117,248]],["tubereader.me",118],["repretel.com",118],["dagensnytt.com",119],["mrproblogger.com",119],["themezon.net",119],["gfx-station.com",120],["bitzite.com",[120,136,140]],["historyofroyalwomen.com",121],["davescomputertips.com",121],["ukchat.co.uk",122],["hivelr.com",123],["embedz.click",124],["skidrowcodex.net",125],["takimag.com",126],["digi.no",127],["th.gl",128],["scimagojr.com",129],["haxina.com",129],["cryptofenz.xyz",129],["twi-fans.com",130],["learn-cpp.org",131],["terashare.co",132],["pornwex.tv",133],["upshrink.com",134],["ohionowcast.info",136],["wiour.com",136],["appsbull.com",136],["diudemy.com",136],["maqal360.com",136],["bitcotasks.com",136],["videolyrics.in",136],["manofadan.com",136],["cempakajaya.com",136],["tagecoin.com",136],["doge25.in",136],["king-ptcs.com",136],["naijafav.top",136],["ourcoincash.xyz",136],["sh.techsamir.com",136],["claimcoins.site",136],["cryptosh.pro",136],["coinsrev.com",136],["go.freetrx.fun",136],["eftacrypto.com",136],["fescrypto.com",136],["earnhub.net",136],["kiddyshort.com",136],["tronxminer.com",136],["homeairquality.org",137],["cety.app",138],["exego.app",138],["cutlink.net",138],["cutsy.net",138],["cutyurls.com",138],["cutty.app",138],["cutnet.net",138],["adcrypto.net",139],["admediaflex.com",139],["aduzz.com",139],["bitcrypto.info",139],["cdrab.com",139],["datacheap.io",139],["hbz.us",139],["savego.org",139],["owsafe.com",139],["sportweb.info",139],["aiimgvlog.fun",141],["6indianporn.com",141],["amateurebonypics.com",141],["amateuryoungpics.com",141],["cinemabg.net",141],["coomer.su",141],["desimmshd.com",141],["frauporno.com",141],["givemeaporn.com",141],["hitomi.la",141],["jav-asia.top",141],["javf.net",141],["javideo.net",141],["kemono.su",141],["kr18plus.com",141],["pilibook.com",141],["pornborne.com",141],["porngrey.com",141],["qqxnxx.com",141],["sexvideos.host",141],["submilf.com",141],["subtaboo.com",141],["tktube.com",141],["xfrenchies.com",141],["freshbhojpuri.com",142],["bgmi32bitapk.in",142],["bankshiksha.in",142],["earn.mpscstudyhub.com",142],["earn.quotesopia.com",142],["money.quotesopia.com",142],["best-mobilegames.com",142],["learn.moderngyan.com",142],["bharatsarkarijobalert.com",142],["coingraph.us",143],["momo-net.com",143],["maxgaming.fi",143],["travel.vebma.com",144],["cloud.majalahhewan.com",144],["crm.cekresi.me",144],["ai.tempatwisata.pro",144],["pinloker.com",144],["sekilastekno.com",144],["link.paid4link.com",145],["vulture.com",146],["megaplayer.bokracdn.run",147],["hentaistream.com",148],["siteunblocked.info",149],["larvelfaucet.com",150],["feyorra.top",150],["claimtrx.com",150],["moviesyug.net",151],["w4files.ws",151],["parispi.net",152],["simkl.com",153],["paperzonevn.com",154],["financemonk.net",154],["dailyvideoreports.net",155],["lewd.ninja",156],["systemnews24.com",157],["incestvidz.com",158],["niusdiario.es",159],["playporngames.com",160],["movi.pk",[161,165]],["justin.mp3quack.lol",163],["cutesexyteengirls.com",164],["0dramacool.net",165],["185.53.88.104",165],["185.53.88.204",165],["185.53.88.15",165],["123movies4k.net",165],["1movieshd.com",165],["1rowsports.com",165],["4share-mp3.net",165],["6movies.net",165],["9animetv.to",165],["720pstream.me",165],["aagmaal.com",165],["abysscdn.com",165],["ajkalerbarta.com",165],["akstream.xyz",165],["androidapks.biz",165],["androidsite.net",165],["animeonlinefree.org",165],["animesite.net",165],["animespank.com",165],["aniworld.to",165],["apkmody.io",165],["appsfree4u.com",165],["audioz.download",165],["awafim.tv",165],["bdnewszh.com",165],["beastlyprints.com",165],["bengalisite.com",165],["bestfullmoviesinhd.org",165],["betteranime.net",165],["blacktiesports.live",165],["buffsports.stream",165],["ch-play.com",165],["clickforhire.com",165],["cloudy.pk",165],["computercrack.com",165],["coolcast2.com",165],["crackedsoftware.biz",165],["crackfree.org",165],["cracksite.info",165],["cryptoblog24.info",165],["cuatrolatastv.blogspot.com",165],["cydiasources.net",165],["dirproxy.com",165],["dopebox.to",165],["downloadapk.info",165],["downloadapps.info",165],["downloadgames.info",165],["downloadmusic.info",165],["downloadsite.org",165],["downloadwella.com",165],["ebooksite.org",165],["educationtips213.blogspot.com",165],["egyup.live",165],["embed.meomeo.pw",165],["embed.scdn.to",165],["emulatorsite.com",165],["essaysharkwriting.club",165],["exploreera.net",165],["extrafreetv.com",165],["fakedetail.com",165],["fclecteur.com",165],["files.im",165],["flexyhit.com",165],["fmoviefree.net",165],["fmovies24.com",165],["footyhunter3.xyz",165],["freeflix.info",165],["freemoviesu4.com",165],["freeplayervideo.com",165],["freesoccer.net",165],["fseries.org",165],["gamefast.org",165],["gamesite.info",165],["gettapeads.com",165],["gmanga.me",165],["gocast123.me",165],["gogohd.net",165],["gogoplay5.com",165],["gooplay.net",165],["gostreamon.net",165],["happy2hub.org",165],["harimanga.com",165],["healthnewsreel.com",165],["hexupload.net",165],["hinatasoul.com",165],["hindisite.net",165],["holymanga.net",165],["hxfile.co",165],["isosite.org",165],["iv-soft.com",165],["januflix.expert",165],["jewelry.com.my",165],["johnwardflighttraining.com",165],["kabarportal.com",165],["kstorymedia.com",165],["la123movies.org",165],["lespassionsdechinouk.com",165],["lilymanga.net",165],["linksdegrupos.com.br",165],["linkz.wiki",165],["livestreamtv.pk",165],["macsite.info",165],["mangapt.com",165],["mangasite.org",165],["manhuascan.com",165],["megafilmeshdseries.com",165],["megamovies.org",165],["membed.net",165],["moddroid.com",165],["moviefree2.com",165],["movies-watch.com.pk",165],["moviesite.app",165],["moviesonline.fm",165],["moviesx.org",165],["msmoviesbd.com",165],["musicsite.biz",165],["myfernweh.com",165],["myviid.com",165],["nazarickol.com",165],["noob4cast.com",165],["nsw2u.com",[165,257]],["oko.sh",165],["olympicstreams.me",165],["orangeink.pk",165],["owllink.net",165],["pahaplayers.click",165],["patchsite.net",165],["pdfsite.net",165],["play1002.com",165],["player-cdn.com",165],["productkeysite.com",165],["projectfreetv.one",165],["romsite.org",165],["rufiguta.com",165],["rytmp3.io",165],["send.cm",165],["seriesite.net",165],["seriezloaded.com.ng",165],["serijehaha.com",165],["shrugemojis.com",165],["siteapk.net",165],["siteflix.org",165],["sitegames.net",165],["sitekeys.net",165],["sitepdf.com",165],["sitetorrent.com",165],["softwaresite.net",165],["sportbar.live",165],["sportkart1.xyz",165],["ssyoutube.com",165],["stardima.com",165],["stream4free.live",165],["superapk.org",165],["supermovies.org",165],["tainio-mania.online",165],["talaba.su",165],["tamilguns.org",165],["tatabrada.tv",165],["techtrendmakers.com",165],["theflixer.tv",165],["thememypc.net",165],["thetechzone.online",165],["thripy.com",165],["tonnestreamz.xyz",165],["travelplanspro.com",165],["turcasmania.com",165],["tusfiles.com",165],["tvonlinesports.com",165],["ultramovies.org",165],["uploadbank.com",165],["urdubolo.pk",165],["vidspeeds.com",165],["vumoo.to",165],["warezsite.net",165],["watchmovies2.com",165],["watchmoviesforfree.org",165],["watchofree.com",165],["watchsite.net",165],["watchsouthpark.tv",165],["watchtvch.club",165],["web.livecricket.is",165],["webseries.club",165],["worldcupstream.pm",165],["y2mate.com",165],["youapk.net",165],["youtube4kdownloader.com",165],["yts-subs.com",165],["haho.moe",166],["nicy-spicy.pw",167],["novelmultiverse.com",168],["mylegalporno.com",169],["asianembed.io",172],["thecut.com",173],["novelism.jp",174],["alphapolis.co.jp",175],["okrzone.com",176],["game3rb.com",177],["javhub.net",177],["thotvids.com",178],["berklee.edu",179],["rawkuma.com",[180,181]],["moviesjoyhd.to",181],["imeteo.sk",182],["youtubemp3donusturucu.net",183],["surfsees.com",185],["vivo.st",[186,187]],["alueviesti.fi",189],["kiuruvesilehti.fi",189],["lempaala.ideapark.fi",189],["olutposti.fi",189],["urjalansanomat.fi",189],["tainhanhvn.com",191],["titantv.com",192],["3cinfo.net",193],["transportationlies.org",194],["camarchive.tv",195],["crownimg.com",195],["freejav.guru",195],["hentai2read.com",195],["icyporno.com",195],["illink.net",195],["javtiful.com",195],["m-hentai.net",195],["pornblade.com",195],["pornfelix.com",195],["pornxxxxtube.net",195],["redwap.me",195],["redwap2.com",195],["redwap3.com",195],["tubxporn.xxx",195],["ver-comics-porno.com",195],["ver-mangas-porno.com",195],["xanimeporn.com",195],["xxxvideohd.net",195],["zetporn.com",195],["cocomanga.com",196],["sampledrive.in",197],["mcleaks.net",198],["explorecams.com",198],["minecraft.buzz",198],["chillx.top",199],["playerx.stream",199],["m.liputan6.com",201],["stardewids.com",[201,224]],["ingles.com",202],["spanishdict.com",202],["surfline.com",203],["rureka.com",204],["bunkr.is",205],["amateur8.com",206],["freeporn8.com",206],["maturetubehere.com",206],["embedo.co",207],["corriere.it",208],["oggi.it",208],["2the.space",209],["file.gocmod.com",210],["apkcombo.com",211],["sponsorhunter.com",212],["soft98.ir",213],["novelssites.com",214],["torrentmac.net",215],["udvl.com",216],["moviezaddiction.icu",217],["dlpanda.com",218],["socialmediagirls.com",219],["ecamrips.com",219],["showcamrips.com",219],["einrichtungsbeispiele.de",220],["weadown.com",221],["molotov.tv",222],["freecoursesonline.me",223],["adelsfun.com",223],["advantien.com",223],["bailbondsfinder.com",223],["bigpiecreative.com",223],["childrenslibrarylady.com",223],["classifarms.com",223],["comtasq.ca",223],["crone.es",223],["ctrmarketingsolutions.com",223],["dropnudes.com",223],["ftuapps.dev",223],["genzsport.com",223],["ghscanner.com",223],["grsprotection.com",223],["gruporafa.com.br",223],["inmatefindcalifornia.com",223],["inmatesearchidaho.com",223],["itsonsitetv.com",223],["mfmfinancials.com",223],["myproplugins.com",223],["onehack.us",223],["ovester.com",223],["paste.bin.sx",223],["privatenudes.com",223],["renoconcrete.ca",223],["richieashbeck.com",223],["sat.technology",223],["short1ink.com",223],["stpm.co.uk",223],["wegotcookies.co",223],["mathcrave.com",223],["commands.gg",224],["smgplaza.com",225],["emturbovid.com",226],["mmtv01.xyz",226],["stbturbo.xyz",226],["freepik.com",227],["diyphotography.net",229],["bitchesgirls.com",230],["shopforex.online",231],["programmingeeksclub.com",232],["easymc.io",233],["diendancauduong.com",234],["parentcircle.com",235],["h-game18.xyz",236],["nopay.info",237],["wheelofgold.com",238],["shortlinks.tech",239],["skill4ltu.eu",241],["lifestyle.bg",242],["news.bg",242],["topsport.bg",242],["webcafe.bg",242],["freepikdownloader.com",243],["freepasses.org",244],["iusedtobeaboss.com",245],["androidpolice.com",246],["cbr.com",246],["dualshockers.com",246],["gamerant.com",246],["howtogeek.com",246],["thegamer.com",246],["blogtruyenmoi.com",247],["igay69.com",249],["graphicget.com",250],["qiwi.gg",251],["netcine2.la",252],["idnes.cz",[253,254]],["cbc.ca",255],["japscan.lol",256]]);

const entitiesMap = new Map([["kisscartoon",1],["kissasian",7],["ganool",7],["pirate",7],["piratebay",7],["pirateproxy",7],["proxytpb",7],["thepiratebay",7],["limetorrents",[9,15]],["king-pes",9],["depedlps",9],["komikcast",9],["idedroidsafelink",9],["links-url",9],["ak4eg",9],["streanplay",10],["steanplay",10],["liferayiseasy",[11,12]],["pahe",15],["yts",15],["tube8",15],["topeuropix",15],["moviescounter",15],["torrent9",15],["desiremovies",15],["movs4u",15],["uwatchfree",15],["hydrax",15],["4movierulz",15],["projectfreetv",15],["arabseed",15],["btdb",[15,56]],["world4ufree",15],["streamsport",15],["rojadirectatvhd",15],["userload",15],["freecoursesonline",17],["lordpremium",17],["todovieneok",17],["novablogitalia",17],["anisubindo",17],["btvsports",17],["adyou",18],["fxporn69",21],["rexporn",25],["movies07",25],["pornocomics",25],["sexwebvideo",29],["pornomoll",29],["gsurl",32],["mimaletadepeliculas",33],["burningseries",34],["dz4soft",35],["yoututosjeff",35],["ebookmed",35],["lanjutkeun",35],["novelasesp",35],["singingdalong",35],["doujindesu",35],["xmovies8",38],["mega-dvdrip",45],["peliculas-dvdrip",45],["desbloqueador",46],["newpelis",[47,54]],["pelix",[47,54]],["allcalidad",[47,195]],["khatrimaza",47],["camwhores",48],["camwhorestv",48],["uproxy",48],["nekopoi",51],["mirrorace",60],["mixdrp",65],["asiansex",67],["japanfuck",67],["japanporn",67],["teensex",67],["vintagetube",67],["xxxmovies",67],["zooqle",70],["hdfull",74],["mangamanga",76],["streameast",78],["thestreameast",78],["vev",82],["vidop",82],["1337x",84],["x1337x",84],["zone-telechargement",84],["megalink",89],["gmx",90],["mega1080p",95],["9hentai",97],["gaypornhdfree",104],["cinemakottaga",104],["privatemoviez",104],["apkmaven",104],["popcornstream",106],["readcomiconline",116],["azsoft",117],["fc-lc",135],["pornktube",141],["watchseries",141],["milfnut",143],["pagalmovies",151],["7starhd",151],["jalshamoviez",151],["9xupload",151],["bdupload",151],["desiupload",151],["rdxhd1",151],["dropgalaxy",154],["moviessources",162],["nuvid",163],["0gomovie",165],["0gomovies",165],["123moviefree",165],["1kmovies",165],["1madrasdub",165],["1primewire",165],["2embed",165],["2madrasdub",165],["2umovies",165],["4anime",165],["adblockplustape",165],["altadefinizione01",165],["anitube",165],["atomixhq",165],["beinmatch",165],["brmovies",165],["cima4u",165],["clicknupload",165],["cmovies",165],["cricfree",165],["crichd",165],["databasegdriveplayer",165],["dood",165],["f1stream",165],["faselhd",165],["fbstream",165],["file4go",165],["filemoon",165],["filepress",[165,228]],["filmlinks4u",165],["filmpertutti",165],["filmyzilla",165],["fmovies",165],["french-stream",165],["fzlink",165],["gdriveplayer",165],["gofilms4u",165],["gogoanime",165],["gomoviz",165],["hdmoviefair",165],["hdmovies4u",165],["hdmovies50",165],["hdmoviesfair",165],["hh3dhay",165],["hindilinks4u",165],["hotmasti",165],["hurawatch",165],["klmanga",165],["klubsports",165],["libertestreamvf",165],["livetvon",165],["manga1000",165],["manga1001",165],["mangaraw",165],["mangarawjp",165],["mlbstream",165],["motogpstream",165],["movierulz",165],["movies123",165],["movies2watch",165],["moviesden",165],["moviezaddiction",165],["myflixer",165],["nbastream",165],["netcine",165],["nflstream",165],["nhlstream",165],["onlinewatchmoviespk",165],["pctfenix",165],["pctnew",165],["pksmovies",165],["plyjam",165],["plylive",165],["pogolinks",165],["popcorntime",165],["poscitech",165],["prmovies",165],["rugbystreams",165],["shahed4u",165],["sflix",165],["sitesunblocked",165],["solarmovies",165],["sportcast",165],["sportskart",165],["sports-stream",165],["streaming-french",165],["streamers",165],["streamingcommunity",165],["strikeout",165],["t20cup",165],["tennisstreams",165],["torrentdosfilmes",165],["toonanime",165],["tvply",165],["ufcstream",165],["uptomega",165],["uqload",165],["vudeo",165],["vidoo",165],["vipbox",165],["vipboxtv",165],["vipleague",165],["viprow",165],["yesmovies",165],["yomovies",165],["yomovies1",165],["yt2mp3s",165],["kat",165],["katbay",165],["kickass",165],["kickasshydra",165],["kickasskat",165],["kickass2",165],["kickasstorrents",165],["kat2",165],["kattracker",165],["thekat",165],["thekickass",165],["kickassz",165],["kickasstorrents2",165],["topkickass",165],["kickassgo",165],["kkickass",165],["kkat",165],["kickasst",165],["kick4ss",165],["guardaserie",170],["cine-calidad",171],["videovard",188],["gntai",195],["grantorrent",195],["mejortorrent",195],["mejortorrento",195],["mejortorrents",195],["mejortorrents1",195],["mejortorrentt",195],["shineads",197],["bg-gledai",223],["gledaitv",223],["motchill",240]]);

const exceptionsMap = new Map([["mentor.duden.de",[77]],["forum.soft98.ir",[213]]]);

/******************************************************************************/

function addEventListenerDefuser(
    type = '',
    pattern = ''
) {
    const safe = safeSelf();
    const extraArgs = safe.getExtraArgs(Array.from(arguments), 2);
    const logPrefix = safe.makeLogPrefix('prevent-addEventListener', type, pattern);
    const reType = safe.patternToRegex(type, undefined, true);
    const rePattern = safe.patternToRegex(pattern);
    const debug = shouldDebug(extraArgs);
    const targetSelector = extraArgs.elements || undefined;
    const elementMatches = elem => {
        if ( targetSelector === 'window' ) { return elem === window; }
        if ( targetSelector === 'document' ) { return elem === document; }
        if ( elem && elem.matches && elem.matches(targetSelector) ) { return true; }
        const elems = Array.from(document.querySelectorAll(targetSelector));
        return elems.includes(elem);
    };
    const elementDetails = elem => {
        if ( elem instanceof Window ) { return 'window'; }
        if ( elem instanceof Document ) { return 'document'; }
        if ( elem instanceof Element === false ) { return '?'; }
        const parts = [];
        // https://github.com/uBlockOrigin/uAssets/discussions/17907#discussioncomment-9871079
        const id = String(elem.id);
        if ( id !== '' ) { parts.push(`#${CSS.escape(id)}`); }
        for ( let i = 0; i < elem.classList.length; i++ ) {
            parts.push(`.${CSS.escape(elem.classList.item(i))}`);
        }
        for ( let i = 0; i < elem.attributes.length; i++ ) {
            const attr = elem.attributes.item(i);
            if ( attr.name === 'id' ) { continue; }
            if ( attr.name === 'class' ) { continue; }
            parts.push(`[${CSS.escape(attr.name)}="${attr.value}"]`);
        }
        return parts.join('');
    };
    const shouldPrevent = (thisArg, type, handler) => {
        const matchesType = safe.RegExp_test.call(reType, type);
        const matchesHandler = safe.RegExp_test.call(rePattern, handler);
        const matchesEither = matchesType || matchesHandler;
        const matchesBoth = matchesType && matchesHandler;
        if ( debug === 1 && matchesBoth || debug === 2 && matchesEither ) {
            debugger; // eslint-disable-line no-debugger
        }
        if ( matchesBoth && targetSelector !== undefined ) {
            if ( elementMatches(thisArg) === false ) { return false; }
        }
        return matchesBoth;
    };
    const trapEddEventListeners = ( ) => {
        const eventListenerHandler = {
            apply: function(target, thisArg, args) {
                let t, h;
                try {
                    t = String(args[0]);
                    if ( typeof args[1] === 'function' ) {
                        h = String(safe.Function_toString(args[1]));
                    } else if ( typeof args[1] === 'object' && args[1] !== null ) {
                        if ( typeof args[1].handleEvent === 'function' ) {
                            h = String(safe.Function_toString(args[1].handleEvent));
                        }
                    } else {
                        h = String(args[1]);
                    }
                } catch(ex) {
                }
                if ( type === '' && pattern === '' ) {
                    safe.uboLog(logPrefix, `Called: ${t}\n${h}\n${elementDetails(thisArg)}`);
                } else if ( shouldPrevent(thisArg, t, h) ) {
                    return safe.uboLog(logPrefix, `Prevented: ${t}\n${h}\n${elementDetails(thisArg)}`);
                }
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
        onIdle(fn, options) {
            if ( self.requestIdleCallback ) {
                return self.requestIdleCallback(fn, options);
            }
            return self.requestAnimationFrame(fn);
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

function shouldDebug(details) {
    if ( details instanceof Object === false ) { return false; }
    return scriptletGlobals.canDebug && details.debug;
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
