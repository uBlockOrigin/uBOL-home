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

const argsList = [["load","Object"],["mousedown","clientX"],["load","hard_block"],["/contextmenu|keydown/"],["","adb"],["click","ClickHandler"],["load","IsAdblockRequest"],["/^(?:click|mousedown)$/","_0x"],["error"],["load","onload"],["","BACK"],["load","getComputedStyle"],["load","adsense"],["load","(!o)"],["load","(!i)"],["","_0x"],["","Adblock"],["load","nextFunction"],["/^(?:click|mousedown)$/","bypassEventsInProxies"],["","window.open"],["","open"],["click","exopop"],["/^(?:load|click)$/","popMagic"],["mousedown","popundrInit"],["getexoloader"],["","pop"],["load","exoJsPop101"],["/^loadex/"],["","/exo"],["","_blank"],["",";}"],["load","BetterPop"],["mousedown","preventDefault"],["load","advertising"],["click","preventDefault"],["load","2000"],["/^(click|mousedown|mousemove|touchstart|touchend|touchmove)/","system.popunder"],["load","adb"],["/^(?:click|mousedown|mousemove|touchstart|touchend|touchmove)$/","system.popunder"],["","'0x"],["/DOMContentLoaded|load/","y.readyState"],["/error|canplay/","(t)"],["load","hblocked"],["error","Adblocker"],["DOMContentLoaded","adlinkfly"],["DOMContentLoaded","shortener"],["mousedown","trigger"],["","0x"],["","Pop"],["/^(?:click|mousedown)$/","popunder"],["DOMContentLoaded","preventExit"],["","adsense"],["load"],["click","pop_under"],["load","url"],["load","adverts-top-container"],["","Date"],["DOMContentLoaded","&nbsp"],["click","read_cookie"],["","midRoll"],["click","_0x"],["load","isBlanketFound"],["load","showModal"],["click","trigger"],["mouseout","clientWidth"],["load","download-wrapper"],["load","autoRecov"],["popstate","noPop"],["/^(?:click|mousedown)$/","ppu"],["click","native code"],["/^(?:mousedown|mouseup)$/","0x"],["click","popundr"],["click"],["DOMContentLoaded","compupaste"],["mousedown","!!{});"],["DOMContentLoaded","/adblock/i"],["keydown"],["DOMContentLoaded","isMobile"],["/^/","0x"],["load","PrivateMode"],["scroll","_0x"],["DOMContentLoaded","checkVPN"],["/^(?:click|mousedown|mouseup)$/","di()"],["","\\"],["popstate"],["click","my_inter_listen"],["load","appendChild"],["","bi()"],["","checkTarget"],["click","popunder"],["timeupdate"],["scroll","getElementById"],["load","undefined"],["DOMContentLoaded","scriptwz_url"],["load","0x"],["DOMContentLoaded","btoa"],["adblockActivated"],["click","saveLastEvent"],["DOMContentLoaded","offsetHeight"],["","show"],["/.?/","popMagic"],["","ads"],["click","interstitial"],["load","antiblock"],["DOMContentLoaded","adsBlocked"],["load",".appendChild"],["","btoa"],["","exopop"],["DOMContentLoaded","AdBlock"],["load","blocker"],["mouseleave","NativeDisplayAdID"],["mouseover","event.triggered"],["load","removeChild"],["load","ads"],["click","ShouldShow"],["click","clickCount"],["mousedown","localStorage"],["DOMContentLoaded","document.documentElement.lang.toLowerCase"],["/adblock/i"],["load","doTest"],["DOMContentLoaded","antiAdBlockerHandler"],["DOMContentLoaded","daadb_get_data_fetch"],["click","splashPage"],["load","detect-modal"],["load","_0x"],["DOMContentLoaded","canRedirect"],["DOMContentLoaded","adb"],["error","/\\{[a-z]\\(e\\)\\}/"],["load",".call(this"],["load","adblock"],["/touchmove|wheel/","preventDefault()"],["load","showcfkModal"],["click","attached","elements","div[class=\"share-embed-container\"]"],["click","fp-screen"],["DOMContentLoaded","leaderboardAd"],["DOMContentLoaded","iframe"],["","/_blank/i"],["load","htmls"],["blur","focusOut"],["click","/handleClick|popup/"],["load","bypass"],["DOMContentLoaded","location.href"],["","popMagic"],["click","Popunder"],["contextmenu"],["blur","counter"],["click","maxclick"],["/^(?:click|mousedown)$/","latest!=="],["DOMContentLoaded",".ready"],["load","script"],["","/pop|wm|forceClick/"],["load","block"],["","/_0x|localStorage\\.getItem/"],["DOMContentLoaded","adblock"],["load","head"],["visibilitychange"],["load","/showModal|isBlanketFound/"],["click","shouldShow"],["","/ads|Modal/"],["DOMContentLoaded","init"],["load","Adblock"],["DOMContentLoaded","window.open"],["","vads"],["devtoolschange"],["click","open"],["beforeunload"],["","break;case $."],["mouseup","decodeURIComponent"],["/(?:click|touchend)/","_0x"],["","removeChild"],["click","pu_count"],["","/pop|_blank/"],["click","allclick_Public"],["","dtnoppu"],["/touchstart|mousedown|click/","latest"],["blur","native code"],["blur","event.simulate"],["click","_blank"],["DOMContentLoaded","0x"],["click","overlay"],["scroll","undefined"],["readystatechange","document.removeEventListener"],["mousedown","shown_at"],["scroll","detect"],["click","t(a)"],["","focus"],["DOMContentLoaded","deblocker"],["","preventDefault"],["click","tabunder"],["mouseup","catch"],["scroll","innerHeight"],["hashchange"],["load","/nextFunction|2000/"],["load","player"],["","document.oncontextmenu"],["","about:blank"],["click","popMagic"],["load","popMagic"],["DOMContentLoaded","adsSrc"],["np.detect"],["click","Popup"],["","/open.*_blank/"],["scroll"],["","isBlocking"],["timeupdate","","elements",".quiver-cam-player--ad-not-running.quiver-cam-player--free video"],["","$"],["","exoJsPop101"],["/click|mousedown/","catch"],["","init"],["adb"],["scroll","modal"],["blur"],["DOMContentLoaded","clientHeight"],["click","window.focus"],["click","[native code]"],["click","event.dispatch"],["","Math"],["DOMContentLoaded","popupurls"],["","tabUnder"],["load","XMLHttpRequest"],["load","puURLstrpcht"],["load","AdBlocker"],["","showModal"],["","goog"],["load","abDetectorPro"],["","document.body"],["","modal"],["click","pop"],["click","adobeModalTestABenabled"],["blur","console.log"],["","AdB"],["load","adSession"],["load","Ads"],["DOMContentLoaded","googlesyndication"],["np.evtdetect"],["load","popunder"],["scroll","function(e)"],["DOMContentLoaded","adlinkfly_url"],["mousedown"],["load","document.getElementById"],["mousedown","tabUnder"],["click","popactive"],["load","adsbygoogle"],["DOMContentLoaded","location.replace"],["load","modal_blocker"],["click","isOpened"],["mousedown","pop.doEvent"],["error","blocker"],["click","alink"],["load","[native code]"],["","daadb"],["load","google-analytics"],["","sessionStorage"],["load","fetch"],["click","pingUrl"],["mousedown","scoreUrl"],["click","/event_callback=function\\(\\){window\\.location=t\\.getAttribute\\(\"href\"\\)/"],["DOMContentLoaded","/\\)\\(\\)\\s*;\\s*\\}.{400,500}$/"],["","Adb"]];

const hostnamesMap = new Map([["newser.com",0],["sport1.de",2],["userscloud.com",3],["timesofindia.indiatimes.com",4],["drrtyr.mx",4],["pinoyalbums.com",4],["multiplayer.it",4],["mediafire.com",[5,6]],["pinsystem.co.uk",7],["fembed.com",7],["ancensored.com",7],["mp3fiber.com",[7,17]],["xrivonet.info",7],["afreesms.com",8],["tu.no",8],["tio.ch",8],["lavanguardia.com",8],["eplayer.click",8],["kingofdown.com",9],["radiotormentamx.com",9],["quelleestladifference.fr",9],["otakuworldsite.blogspot.com",9],["ad-itech.blogspot.com",9],["sna3talaflam.com",9],["agar.pro",9],["unlockapk.com",9],["mobdi3ips.com",9],["socks24.org",9],["interviewgig.com",9],["javaguides.net",9],["almohtarif-tech.net",9],["forum.release-apk.com",9],["devoloperxda.blogspot.com",9],["zwergenstadt.com",9],["primedeportes.es",9],["9goals.live",9],["upxin.net",9],["ciudadblogger.com",9],["ke-1.com",9],["secretsdeepweb.blogspot.com",9],["bit-shares.com",9],["itdmusics.com",9],["aspdotnet-suresh.com",9],["tudo-para-android.com",9],["urdulibrarypk.blogspot.com",9],["zerotopay.com",9],["akw.to",9],["mawsueaa.com",9],["hesgoal-live.io",9],["king-shoot.io",9],["bibme.org",13],["citationmachine.net",13],["easybib.com",14],["vermangasporno.com",15],["imgtorrnt.in",15],["picbaron.com",[15,142]],["letmejerk.com",15],["letmejerk2.com",15],["letmejerk3.com",15],["letmejerk4.com",15],["letmejerk5.com",15],["letmejerk6.com",15],["letmejerk7.com",15],["dlapk4all.com",15],["kropic.com",15],["kvador.com",15],["pdfindir.net",15],["brstej.com",15],["topwwnews.com",15],["xsanime.com",15],["vidlo.us",15],["put-locker.com",15],["youx.xxx",15],["animeindo.asia",15],["masahub.net",15],["adclickersbot.com",15],["badtaste.it",16],["mage.si",17],["totaldebrid.org",17],["neko-miku.com",17],["elsfile.org",17],["venstrike.jimdofree.com",17],["schrauben-normen.de",17],["avengerinator.blogspot.com",17],["link-to.net",17],["hanimesubth.com",17],["gsmturkey.net",17],["adshrink.it",17],["presentation-ppt.com",17],["mangacanblog.com",17],["pekalongan-cits.blogspot.com",17],["4tymode.win",17],["eurotruck2.com.br",17],["linkvertise.com",17],["reifenrechner.at",17],["tire-size-calculator.info",17],["linuxsecurity.com",17],["encodinghub.com",17],["itsguider.com",17],["cotravinh.blogspot.com",17],["itudong.com",17],["shortx.net",17],["lecturel.com",17],["bakai.org",17],["nar.k-ba.net",17],["tiroalpalo.org",17],["shemalez.com",19],["tubepornclassic.com",19],["gotporn.com",20],["freepornrocks.com",20],["tvhai.org",20],["simpcity.su",20],["realgfporn.com",[21,22]],["titsbox.com",21],["thisvid.com",22],["xvideos-downloader.net",22],["imgspice.com",23],["vikiporn.com",24],["tnaflix.com",24],["hentai2w.com",[24,196]],["yourlust.com",24],["hotpornfile.org",24],["watchfreexxx.net",24],["vintageporntubes.com",24],["angelgals.com",24],["babesexy.com",24],["porndaa.com",24],["ganstamovies.com",24],["youngleak.com",24],["porndollz.com",24],["xnxxvideo.pro",24],["xvideosxporn.com",24],["filmpornofrancais.fr",24],["pictoa.com",[24,47]],["tubator.com",24],["adultasianporn.com",24],["nsfwmonster.com",24],["girlsofdesire.org",24],["gaytail.com",24],["fetish-bb.com",24],["rumporn.com",24],["soyoungteens.com",24],["zubby.com",24],["lesbian8.com",24],["gayforfans.com",24],["reifporn.de",24],["javtsunami.com",24],["18tube.sex",24],["xxxextreme.org",24],["amateurs-fuck.com",24],["sex-amateur-clips.com",24],["hentaiworld.tv",24],["dads-banging-teens.com",24],["home-xxx-videos.com",24],["mature-chicks.com",24],["teens-fucking-matures.com",24],["hqbang.com",24],["darknessporn.com",24],["familyporner.com",24],["freepublicporn.com",24],["pisshamster.com",24],["punishworld.com",24],["xanimu.com",24],["pornhd.com",25],["cnnamador.com",[25,36]],["cle0desktop.blogspot.com",25],["turkanime.co",25],["camclips.tv",[25,48]],["blackpornhq.com",25],["xsexpics.com",25],["ulsex.net",25],["wannafreeporn.com",25],["ytube2dl.com",25],["multiup.us",25],["protege-torrent.com",25],["pussyspace.com",[26,27]],["pussyspace.net",[26,27]],["empflix.com",28],["cpmlink.net",29],["bdsmstreak.com",29],["cutpaid.com",29],["pornforrelax.com",29],["fatwhitebutt.com",29],["mavplay.xyz",29],["sunporno.com",[30,31,196]],["short.pe",32],["bs.to",34],["efukt.com",34],["generacionretro.net",35],["nuevos-mu.ucoz.com",35],["micloudfiles.com",35],["mimaletamusical.blogspot.com",35],["visionias.net",35],["b3infoarena.in",35],["lurdchinexgist.blogspot.com",35],["thefreedommatrix.blogspot.com",35],["hentai-vl.blogspot.com",35],["projetomotog.blogspot.com",35],["ktmx.pro",35],["lirik3satu.blogspot.com",35],["marketmovers.it",35],["pharmaguideline.com",35],["safemaru.blogspot.com",35],["mixloads.com",35],["mangaromance.eu",35],["interssh.com",35],["freesoftpdfdownload.blogspot.com",35],["cirokun.blogspot.com",35],["myadslink.com",35],["blackavelic.com",35],["server.satunivers.tv",35],["eg-akw.com",35],["xn--mgba7fjn.cc",35],["flashingjungle.com",36],["ma-x.org",37],["lavozdegalicia.es",37],["xmovies08.org",39],["globaldjmix.com",40],["zazzybabes.com",41],["haaretz.co.il",42],["haaretz.com",42],["slate.com",43],["megalinks.info",44],["megapastes.com",44],["mega-mkv.com",[44,45]],["mkv-pastes.com",44],["zpaste.net",44],["zlpaste.net",44],["9xlinks.site",44],["zona-leros.net",45],["acortarm.xyz",46],["cine.to",[47,201]],["kissasia.cc",47],["digjav.com",48],["videoszoofiliahd.com",49],["xxxtubezoo.com",50],["zooredtube.com",50],["megacams.me",52],["rlslog.net",52],["porndoe.com",53],["acienciasgalilei.com",55],["playrust.io",56],["payskip.org",57],["short-url.link",58],["tubedupe.com",59],["mcrypto.club",60],["fatgirlskinny.net",61],["polska-ie.com",61],["windowsmatters.com",61],["canaltdt.es",62],["masbrooo.com",62],["2ndrun.tv",62],["stfly.me",63],["oncehelp.com",63],["queenfaucet.website",63],["curto.win",63],["smallseotools.com",64],["macwelt.de",66],["pcwelt.de",66],["capital.de",66],["geo.de",66],["allmomsex.com",67],["allnewindianporn.com",67],["analxxxvideo.com",67],["animalextremesex.com",67],["anime3d.xyz",67],["animefuckmovies.com",67],["animepornfilm.com",67],["animesexbar.com",67],["animesexclip.com",67],["animexxxsex.com",67],["animexxxfilms.com",67],["anysex.club",67],["apetube.asia",67],["asianfuckmovies.com",67],["asianfucktube.com",67],["asianporn.sexy",67],["asiansexcilps.com",67],["beeg.fund",67],["beegvideoz.com",67],["bestasiansex.pro",67],["bravotube.asia",67],["brutalanimalsfuck.com",67],["candyteenporn.com",67],["daddyfuckmovies.com",67],["desifuckonline.com",67],["exclusiveasianporn.com",67],["exteenporn.com",67],["fantasticporn.net",67],["fantasticyoungporn.com",67],["fineasiansex.com",67],["firstasianpussy.com",67],["freeindiansextube.com",67],["freepornasians.com",67],["freerealvideo.com",67],["fuck-beeg.com",67],["fuck-xnxx.com",67],["fuckasian.pro",67],["fuckfuq.com",67],["fuckundies.com",67],["gojapaneseporn.com",67],["golderotica.com",67],["goodyoungsex.com",67],["goyoungporn.com",67],["hardxxxmoms.com",67],["hdvintagetube.com",67],["hentaiporn.me",67],["hentaisexfilms.com",67],["hentaisexuality.com",67],["hot-teens-movies.mobi",67],["hotanimepornvideos.com",67],["hotanimevideos.com",67],["hotasianpussysex.com",67],["hotjapaneseshows.com",67],["hotmaturetube.com",67],["hotmilfs.pro",67],["hotorientalporn.com",67],["hotpornyoung.com",67],["hotxxxjapanese.com",67],["hotxxxpussy.com",67],["indiafree.net",67],["indianpornvideo.online",67],["japanpornclip.com",67],["japanesetube.video",67],["japansex.me",67],["japanesexxxporn.com",67],["japansporno.com",67],["japanxxx.asia",67],["japanxxxworld.com",67],["keezmovies.surf",67],["lingeriefuckvideo.com",67],["liveanimalporn.zooo.club",67],["madhentaitube.com",67],["megahentaitube.com",67],["megajapanesesex.com",67],["megajapantube.com",67],["milfxxxpussy.com",67],["momsextube.pro",67],["momxxxass.com",67],["monkeyanimalporn.com",67],["moviexxx.mobi",67],["newanimeporn.com",67],["newjapanesexxx.com",67],["nicematureporn.com",67],["nudeplayboygirls.com",67],["openxxxporn.com",67],["originalindianporn.com",67],["originalteentube.com",67],["pig-fuck.com",67],["plainasianporn.com",67],["popularasianxxx.com",67],["pornanimetube.com",67],["pornasians.pro",67],["pornhat.asia",67],["pornheed.online",67],["pornjapanesesex.com",67],["pornomovies.asia",67],["pornvintage.tv",67],["primeanimesex.com",67],["realjapansex.com",67],["realmomsex.com",67],["redsexhub.com",67],["retroporn.world",67],["retrosexfilms.com",67],["sex-free-movies.com",67],["sexanimesex.com",67],["sexanimetube.com",67],["sexjapantube.com",67],["sexmomvideos.com",67],["sexteenxxxtube.com",67],["sexxxanimal.com",67],["sexyoungtube.com",67],["sexyvintageporn.com",67],["sopornmovies.com",67],["spicyvintageporn.com",67],["sunporno.club",67],["tabooanime.club",67],["teenextrem.com",67],["teenfucksex.com",67],["teenhost.net",67],["teensexass.com",67],["tnaflix.asia",67],["totalfuckmovies.com",67],["totalmaturefuck.com",67],["txxx.asia",67],["voyeurpornsex.com",67],["warmteensex.com",67],["wetasiancreampie.com",67],["wildhentaitube.com",67],["wowyoungsex.com",67],["xhamster-art.com",67],["xmovie.pro",67],["xnudevideos.com",67],["xnxxjapon.com",67],["xpics.me",67],["xvide.me",67],["xxxanimefuck.com",67],["xxxanimevideos.com",67],["xxxanimemovies.com",67],["xxxhentaimovies.com",67],["xxxhothub.com",67],["xxxjapaneseporntube.com",67],["xxxlargeporn.com",67],["xxxmomz.com",67],["xxxpornmilf.com",67],["xxxpussyclips.com",67],["xxxpussysextube.com",67],["xxxretrofuck.com",67],["xxxsex.pro",67],["xxxsexyjapanese.com",67],["xxxteenyporn.com",67],["xxxvideo.asia",67],["xxxvideos.ink",67],["xxxyoungtv.com",67],["youjizzz.club",67],["youngpussyfuck.com",67],["bayimg.com",68],["celeb.gate.cc",69],["masterplayer.xyz",71],["pussy-hub.com",71],["porndex.com",72],["compucalitv.com",73],["diariodenavarra.es",75],["duden.de",77],["pennlive.com",79],["beautypageants.indiatimes.com",80],["01fmovies.com",81],["lnk2.cc",83],["fullhdxxx.com",84],["luscious.net",[84,142]],["classicpornbest.com",84],["xstory-fr.com",84],["1youngteenporn.com",84],["www-daftarharga.blogspot.com",[84,185]],["miraculous.to",[84,191]],["vtube.to",84],["gosexpod.com",85],["otakukan.com",86],["xcafe.com",87],["pornfd.com",87],["venusarchives.com",87],["imagehaha.com",88],["imagenpic.com",88],["imageshimage.com",88],["imagetwist.com",88],["k1nk.co",89],["watchasians.cc",89],["alexsports.xyz",89],["lulustream.com",89],["luluvdo.com",89],["web.de",90],["news18.com",91],["thelanb.com",92],["dropmms.com",92],["softwaredescargas.com",93],["cracking-dz.com",94],["anitube.ninja",95],["gazzetta.it",96],["port.hu",98],["dziennikbaltycki.pl",99],["dzienniklodzki.pl",99],["dziennikpolski24.pl",99],["dziennikzachodni.pl",99],["echodnia.eu",99],["expressbydgoski.pl",99],["expressilustrowany.pl",99],["gazetakrakowska.pl",99],["gazetalubuska.pl",99],["gazetawroclawska.pl",99],["gk24.pl",99],["gloswielkopolski.pl",99],["gol24.pl",99],["gp24.pl",99],["gra.pl",99],["gs24.pl",99],["kurierlubelski.pl",99],["motofakty.pl",99],["naszemiasto.pl",99],["nowiny24.pl",99],["nowosci.com.pl",99],["nto.pl",99],["polskatimes.pl",99],["pomorska.pl",99],["poranny.pl",99],["sportowy24.pl",99],["strefaagro.pl",99],["strefabiznesu.pl",99],["stronakobiet.pl",99],["telemagazyn.pl",99],["to.com.pl",99],["wspolczesna.pl",99],["course9x.com",99],["courseclub.me",99],["azrom.net",99],["alttyab.net",99],["esopress.com",99],["nesiaku.my.id",99],["onemanhua.com",100],["freeindianporn.mobi",100],["dr-farfar.com",101],["boyfriendtv.com",102],["brandstofprijzen.info",103],["netfuck.net",104],["blog24.me",[104,137]],["kisahdunia.com",104],["javsex.to",104],["nulljungle.com",104],["oyuncusoruyor.com",104],["pbarecap.ph",104],["sourds.net",104],["teknobalta.com",104],["tvinternetowa.info",104],["sqlserveregitimleri.com",104],["tutcourse.com",104],["readytechflip.com",104],["novinhastop.com",104],["warddogs.com",104],["dvdgayporn.com",104],["iimanga.com",104],["tinhocdongthap.com",104],["tremamnon.com",104],["423down.com",104],["brizzynovel.com",104],["jugomobile.com",104],["freecodezilla.net",104],["animekhor.xyz",104],["iconmonstr.com",104],["gay-tubes.cc",104],["rbxscripts.net",104],["comentariodetexto.com",104],["wordpredia.com",104],["livsavr.co",104],["allfaucet.xyz",[104,137]],["titbytz.tk",104],["replica-watch.info",104],["alludemycourses.com",104],["kayifamilytv.com",104],["iir.ai",105],["gameofporn.com",107],["qpython.club",108],["antifake-funko.fr",108],["dktechnicalmate.com",108],["recipahi.com",108],["e9china.net",109],["ontools.net",109],["marketbeat.com",110],["hentaipornpics.net",111],["apps2app.com",112],["alliptvlinks.com",113],["waterfall.money",113],["xvideos.com",114],["xvideos2.com",114],["homemoviestube.com",115],["sexseeimage.com",115],["jpopsingles.eu",117],["azmath.info",117],["downfile.site",117],["downphanmem.com",117],["expertvn.com",117],["memangbau.com",117],["trangchu.news",117],["aztravels.net",117],["ielts-isa.edu.vn",117],["techedubyte.com",[117,249]],["tubereader.me",118],["repretel.com",118],["dagensnytt.com",119],["mrproblogger.com",119],["themezon.net",119],["gfx-station.com",120],["bitzite.com",[120,137,141]],["historyofroyalwomen.com",121],["davescomputertips.com",121],["ukchat.co.uk",122],["hivelr.com",123],["embedz.click",124],["skidrowcodex.net",125],["takimag.com",126],["digi.no",127],["th.gl",128],["scimagojr.com",129],["haxina.com",129],["cryptofenz.xyz",129],["twi-fans.com",130],["learn-cpp.org",131],["terashare.co",132],["pornwex.tv",133],["smithsonianmag.com",134],["upshrink.com",135],["ohionowcast.info",137],["wiour.com",137],["appsbull.com",137],["diudemy.com",137],["maqal360.com",137],["bitcotasks.com",137],["videolyrics.in",137],["manofadan.com",137],["cempakajaya.com",137],["tagecoin.com",137],["doge25.in",137],["king-ptcs.com",137],["naijafav.top",137],["ourcoincash.xyz",137],["sh.techsamir.com",137],["claimcoins.site",137],["cryptosh.pro",137],["coinsrev.com",137],["go.freetrx.fun",137],["eftacrypto.com",137],["fescrypto.com",137],["earnhub.net",137],["kiddyshort.com",137],["tronxminer.com",137],["homeairquality.org",138],["cety.app",139],["exego.app",139],["cutlink.net",139],["cutsy.net",139],["cutyurls.com",139],["cutty.app",139],["cutnet.net",139],["adcrypto.net",140],["admediaflex.com",140],["aduzz.com",140],["bitcrypto.info",140],["cdrab.com",140],["datacheap.io",140],["hbz.us",140],["savego.org",140],["owsafe.com",140],["sportweb.info",140],["aiimgvlog.fun",142],["6indianporn.com",142],["amateurebonypics.com",142],["amateuryoungpics.com",142],["cinemabg.net",142],["coomer.su",142],["desimmshd.com",142],["frauporno.com",142],["givemeaporn.com",142],["hitomi.la",142],["jav-asia.top",142],["javf.net",142],["javideo.net",142],["kemono.su",142],["kr18plus.com",142],["pilibook.com",142],["pornborne.com",142],["porngrey.com",142],["qqxnxx.com",142],["sexvideos.host",142],["submilf.com",142],["subtaboo.com",142],["tktube.com",142],["xfrenchies.com",142],["moderngyan.com",143],["sattakingcharts.in",143],["freshbhojpuri.com",143],["bgmi32bitapk.in",143],["bankshiksha.in",143],["earn.mpscstudyhub.com",143],["earn.quotesopia.com",143],["money.quotesopia.com",143],["best-mobilegames.com",143],["learn.moderngyan.com",143],["bharatsarkarijobalert.com",143],["coingraph.us",144],["momo-net.com",144],["maxgaming.fi",144],["travel.vebma.com",145],["cloud.majalahhewan.com",145],["crm.cekresi.me",145],["ai.tempatwisata.pro",145],["pinloker.com",145],["sekilastekno.com",145],["link.paid4link.com",146],["vulture.com",147],["megaplayer.bokracdn.run",148],["hentaistream.com",149],["siteunblocked.info",150],["larvelfaucet.com",151],["feyorra.top",151],["claimtrx.com",151],["moviesyug.net",152],["w4files.ws",152],["parispi.net",153],["simkl.com",154],["paperzonevn.com",155],["dailyvideoreports.net",156],["lewd.ninja",157],["systemnews24.com",158],["incestvidz.com",159],["niusdiario.es",160],["playporngames.com",161],["movi.pk",[162,166]],["justin.mp3quack.lol",164],["cutesexyteengirls.com",165],["0dramacool.net",166],["185.53.88.104",166],["185.53.88.204",166],["185.53.88.15",166],["123movies4k.net",166],["1movieshd.com",166],["1rowsports.com",166],["4share-mp3.net",166],["6movies.net",166],["9animetv.to",166],["720pstream.me",166],["aagmaal.com",166],["abysscdn.com",166],["ajkalerbarta.com",166],["akstream.xyz",166],["androidapks.biz",166],["androidsite.net",166],["animeonlinefree.org",166],["animesite.net",166],["animespank.com",166],["aniworld.to",166],["apkmody.io",166],["appsfree4u.com",166],["audioz.download",166],["awafim.tv",166],["bdnewszh.com",166],["beastlyprints.com",166],["bengalisite.com",166],["bestfullmoviesinhd.org",166],["betteranime.net",166],["blacktiesports.live",166],["buffsports.stream",166],["ch-play.com",166],["clickforhire.com",166],["cloudy.pk",166],["computercrack.com",166],["coolcast2.com",166],["crackedsoftware.biz",166],["crackfree.org",166],["cracksite.info",166],["cryptoblog24.info",166],["cuatrolatastv.blogspot.com",166],["cydiasources.net",166],["dirproxy.com",166],["dopebox.to",166],["downloadapk.info",166],["downloadapps.info",166],["downloadgames.info",166],["downloadmusic.info",166],["downloadsite.org",166],["downloadwella.com",166],["ebooksite.org",166],["educationtips213.blogspot.com",166],["egyup.live",166],["embed.meomeo.pw",166],["embed.scdn.to",166],["emulatorsite.com",166],["essaysharkwriting.club",166],["exploreera.net",166],["extrafreetv.com",166],["fakedetail.com",166],["fclecteur.com",166],["files.im",166],["flexyhit.com",166],["fmoviefree.net",166],["fmovies24.com",166],["footyhunter3.xyz",166],["freeflix.info",166],["freemoviesu4.com",166],["freeplayervideo.com",166],["freesoccer.net",166],["fseries.org",166],["gamefast.org",166],["gamesite.info",166],["gettapeads.com",166],["gmanga.me",166],["gocast123.me",166],["gogohd.net",166],["gogoplay5.com",166],["gooplay.net",166],["gostreamon.net",166],["happy2hub.org",166],["harimanga.com",166],["healthnewsreel.com",166],["hexupload.net",166],["hinatasoul.com",166],["hindisite.net",166],["holymanga.net",166],["hxfile.co",166],["isosite.org",166],["iv-soft.com",166],["januflix.expert",166],["jewelry.com.my",166],["johnwardflighttraining.com",166],["kabarportal.com",166],["kstorymedia.com",166],["la123movies.org",166],["lespassionsdechinouk.com",166],["lilymanga.net",166],["linksdegrupos.com.br",166],["linkz.wiki",166],["livestreamtv.pk",166],["macsite.info",166],["mangapt.com",166],["mangasite.org",166],["manhuascan.com",166],["megafilmeshdseries.com",166],["megamovies.org",166],["membed.net",166],["moddroid.com",166],["moviefree2.com",166],["movies-watch.com.pk",166],["moviesite.app",166],["moviesonline.fm",166],["moviesx.org",166],["msmoviesbd.com",166],["musicsite.biz",166],["myfernweh.com",166],["myviid.com",166],["nazarickol.com",166],["noob4cast.com",166],["nsw2u.com",[166,258]],["oko.sh",166],["olympicstreams.me",166],["orangeink.pk",166],["owllink.net",166],["pahaplayers.click",166],["patchsite.net",166],["pdfsite.net",166],["play1002.com",166],["player-cdn.com",166],["productkeysite.com",166],["projectfreetv.one",166],["romsite.org",166],["rufiguta.com",166],["rytmp3.io",166],["send.cm",166],["seriesite.net",166],["seriezloaded.com.ng",166],["serijehaha.com",166],["shrugemojis.com",166],["siteapk.net",166],["siteflix.org",166],["sitegames.net",166],["sitekeys.net",166],["sitepdf.com",166],["sitetorrent.com",166],["softwaresite.net",166],["sportbar.live",166],["sportkart1.xyz",166],["ssyoutube.com",166],["stardima.com",166],["stream4free.live",166],["superapk.org",166],["supermovies.org",166],["tainio-mania.online",166],["talaba.su",166],["tamilguns.org",166],["tatabrada.tv",166],["techtrendmakers.com",166],["theflixer.tv",166],["thememypc.net",166],["thetechzone.online",166],["thripy.com",166],["tonnestreamz.xyz",166],["travelplanspro.com",166],["turcasmania.com",166],["tusfiles.com",166],["tvonlinesports.com",166],["ultramovies.org",166],["uploadbank.com",166],["urdubolo.pk",166],["vidspeeds.com",166],["vumoo.to",166],["warezsite.net",166],["watchmovies2.com",166],["watchmoviesforfree.org",166],["watchofree.com",166],["watchsite.net",166],["watchsouthpark.tv",166],["watchtvch.club",166],["web.livecricket.is",166],["webseries.club",166],["worldcupstream.pm",166],["y2mate.com",166],["youapk.net",166],["youtube4kdownloader.com",166],["yts-subs.com",166],["haho.moe",167],["nicy-spicy.pw",168],["novelmultiverse.com",169],["mylegalporno.com",170],["videowood.tv",173],["thecut.com",174],["novelism.jp",175],["alphapolis.co.jp",176],["okrzone.com",177],["game3rb.com",178],["javhub.net",178],["thotvids.com",179],["berklee.edu",180],["rawkuma.com",[181,182]],["moviesjoyhd.to",182],["imeteo.sk",183],["youtubemp3donusturucu.net",184],["surfsees.com",186],["vivo.st",[187,188]],["alueviesti.fi",190],["kiuruvesilehti.fi",190],["lempaala.ideapark.fi",190],["olutposti.fi",190],["urjalansanomat.fi",190],["tainhanhvn.com",192],["titantv.com",193],["3cinfo.net",194],["transportationlies.org",195],["camarchive.tv",196],["crownimg.com",196],["freejav.guru",196],["hentai2read.com",196],["icyporno.com",196],["illink.net",196],["javtiful.com",196],["m-hentai.net",196],["pornblade.com",196],["pornfelix.com",196],["pornxxxxtube.net",196],["redwap.me",196],["redwap2.com",196],["redwap3.com",196],["tubxporn.xxx",196],["ver-comics-porno.com",196],["ver-mangas-porno.com",196],["xanimeporn.com",196],["xxxvideohd.net",196],["zetporn.com",196],["cocomanga.com",197],["sampledrive.in",198],["mcleaks.net",199],["explorecams.com",199],["minecraft.buzz",199],["chillx.top",200],["playerx.stream",200],["m.liputan6.com",202],["stardewids.com",[202,225]],["ingles.com",203],["spanishdict.com",203],["surfline.com",204],["rureka.com",205],["bunkr.is",206],["amateur8.com",207],["freeporn8.com",207],["maturetubehere.com",207],["embedo.co",208],["corriere.it",209],["oggi.it",209],["2the.space",210],["file.gocmod.com",211],["apkcombo.com",212],["sponsorhunter.com",213],["soft98.ir",214],["novelssites.com",215],["torrentmac.net",216],["udvl.com",217],["moviezaddiction.icu",218],["dlpanda.com",219],["socialmediagirls.com",220],["ecamrips.com",220],["showcamrips.com",220],["einrichtungsbeispiele.de",221],["weadown.com",222],["molotov.tv",223],["freecoursesonline.me",224],["adelsfun.com",224],["advantien.com",224],["bailbondsfinder.com",224],["bigpiecreative.com",224],["childrenslibrarylady.com",224],["classifarms.com",224],["comtasq.ca",224],["crone.es",224],["ctrmarketingsolutions.com",224],["dropnudes.com",224],["ftuapps.dev",224],["genzsport.com",224],["ghscanner.com",224],["grsprotection.com",224],["gruporafa.com.br",224],["inmatefindcalifornia.com",224],["inmatesearchidaho.com",224],["itsonsitetv.com",224],["mfmfinancials.com",224],["myproplugins.com",224],["onehack.us",224],["ovester.com",224],["paste.bin.sx",224],["privatenudes.com",224],["renoconcrete.ca",224],["richieashbeck.com",224],["sat.technology",224],["short1ink.com",224],["stpm.co.uk",224],["wegotcookies.co",224],["mathcrave.com",224],["commands.gg",225],["smgplaza.com",226],["emturbovid.com",227],["findjav.com",227],["mmtv01.xyz",227],["stbturbo.xyz",227],["freepik.com",228],["diyphotography.net",230],["bitchesgirls.com",231],["shopforex.online",232],["programmingeeksclub.com",233],["easymc.io",234],["diendancauduong.com",235],["parentcircle.com",236],["h-game18.xyz",237],["nopay.info",238],["wheelofgold.com",239],["shortlinks.tech",240],["skill4ltu.eu",242],["lifestyle.bg",243],["news.bg",243],["topsport.bg",243],["webcafe.bg",243],["freepikdownloader.com",244],["freepasses.org",245],["iusedtobeaboss.com",246],["androidpolice.com",247],["cbr.com",247],["dualshockers.com",247],["gamerant.com",247],["howtogeek.com",247],["thegamer.com",247],["blogtruyenmoi.com",248],["igay69.com",250],["graphicget.com",251],["qiwi.gg",252],["netcine2.la",253],["idnes.cz",[254,255]],["cbc.ca",256],["japscan.lol",257]]);

const entitiesMap = new Map([["kisscartoon",1],["kissasian",7],["ganool",7],["pirate",7],["piratebay",7],["pirateproxy",7],["proxytpb",7],["thepiratebay",7],["limetorrents",[9,15]],["king-pes",9],["depedlps",9],["komikcast",9],["idedroidsafelink",9],["links-url",9],["ak4eg",9],["streanplay",10],["steanplay",10],["liferayiseasy",[11,12]],["pahe",15],["yts",15],["tube8",15],["topeuropix",15],["moviescounter",15],["torrent9",15],["desiremovies",15],["movs4u",15],["uwatchfree",15],["hydrax",15],["4movierulz",15],["projectfreetv",15],["arabseed",15],["btdb",[15,56]],["world4ufree",15],["streamsport",15],["rojadirectatvhd",15],["userload",15],["freecoursesonline",17],["lordpremium",17],["todovieneok",17],["novablogitalia",17],["anisubindo",17],["btvsports",17],["adyou",18],["fxporn69",21],["rexporn",25],["movies07",25],["pornocomics",25],["sexwebvideo",29],["pornomoll",29],["gsurl",32],["mimaletadepeliculas",33],["burningseries",34],["dz4soft",35],["yoututosjeff",35],["ebookmed",35],["lanjutkeun",35],["novelasesp",35],["singingdalong",35],["doujindesu",35],["xmovies8",38],["mega-dvdrip",45],["peliculas-dvdrip",45],["desbloqueador",46],["newpelis",[47,54]],["pelix",[47,54]],["allcalidad",[47,196]],["khatrimaza",47],["camwhores",48],["camwhorestv",48],["uproxy",48],["nekopoi",51],["mirrorace",60],["mixdrp",65],["asiansex",67],["japanfuck",67],["japanporn",67],["teensex",67],["vintagetube",67],["xxxmovies",67],["zooqle",70],["hdfull",74],["mangamanga",76],["streameast",78],["thestreameast",78],["vev",82],["vidop",82],["1337x",84],["x1337x",84],["zone-telechargement",84],["megalink",89],["gmx",90],["mega1080p",95],["9hentai",97],["gaypornhdfree",104],["cinemakottaga",104],["privatemoviez",104],["apkmaven",104],["popcornstream",106],["readcomiconline",116],["azsoft",117],["fc-lc",136],["pornktube",142],["watchseries",142],["milfnut",144],["pagalmovies",152],["7starhd",152],["jalshamoviez",152],["9xupload",152],["bdupload",152],["desiupload",152],["rdxhd1",152],["moviessources",163],["nuvid",164],["0gomovie",166],["0gomovies",166],["123moviefree",166],["1kmovies",166],["1madrasdub",166],["1primewire",166],["2embed",166],["2madrasdub",166],["2umovies",166],["4anime",166],["adblockplustape",166],["altadefinizione01",166],["anitube",166],["atomixhq",166],["beinmatch",166],["brmovies",166],["cima4u",166],["clicknupload",166],["cmovies",166],["cricfree",166],["crichd",166],["databasegdriveplayer",166],["dood",166],["f1stream",166],["faselhd",166],["fbstream",166],["file4go",166],["filemoon",166],["filepress",[166,229]],["filmlinks4u",166],["filmpertutti",166],["filmyzilla",166],["fmovies",166],["french-stream",166],["fzlink",166],["gdriveplayer",166],["gofilms4u",166],["gogoanime",166],["gomoviz",166],["hdmoviefair",166],["hdmovies4u",166],["hdmovies50",166],["hdmoviesfair",166],["hh3dhay",166],["hindilinks4u",166],["hotmasti",166],["hurawatch",166],["klmanga",166],["klubsports",166],["libertestreamvf",166],["livetvon",166],["manga1000",166],["manga1001",166],["mangaraw",166],["mangarawjp",166],["mlbstream",166],["motogpstream",166],["movierulz",166],["movies123",166],["movies2watch",166],["moviesden",166],["moviezaddiction",166],["myflixer",166],["nbastream",166],["netcine",166],["nflstream",166],["nhlstream",166],["onlinewatchmoviespk",166],["pctfenix",166],["pctnew",166],["pksmovies",166],["plyjam",166],["plylive",166],["pogolinks",166],["popcorntime",166],["poscitech",166],["prmovies",166],["rugbystreams",166],["shahed4u",166],["sflix",166],["sitesunblocked",166],["solarmovies",166],["sportcast",166],["sportskart",166],["sports-stream",166],["streaming-french",166],["streamers",166],["streamingcommunity",166],["strikeout",166],["t20cup",166],["tennisstreams",166],["torrentdosfilmes",166],["toonanime",166],["tvply",166],["ufcstream",166],["uptomega",166],["uqload",166],["vudeo",166],["vidoo",166],["vipbox",166],["vipboxtv",166],["vipleague",166],["viprow",166],["yesmovies",166],["yomovies",166],["yomovies1",166],["yt2mp3s",166],["kat",166],["katbay",166],["kickass",166],["kickasshydra",166],["kickasskat",166],["kickass2",166],["kickasstorrents",166],["kat2",166],["kattracker",166],["thekat",166],["thekickass",166],["kickassz",166],["kickasstorrents2",166],["topkickass",166],["kickassgo",166],["kkickass",166],["kkat",166],["kickasst",166],["kick4ss",166],["guardaserie",171],["cine-calidad",172],["videovard",189],["gntai",196],["grantorrent",196],["mejortorrent",196],["mejortorrento",196],["mejortorrents",196],["mejortorrents1",196],["mejortorrentt",196],["shineads",198],["bg-gledai",224],["gledaitv",224],["motchill",241]]);

const exceptionsMap = new Map([["mentor.duden.de",[77]],["forum.soft98.ir",[214]]]);

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
