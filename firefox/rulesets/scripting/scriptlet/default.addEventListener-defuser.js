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

const argsList = [["load","Object"],["mousedown","clientX"],["load","hard_block"],["/contextmenu|keydown/"],["","adb"],["click","ClickHandler"],["load","IsAdblockRequest"],["/^(?:click|mousedown)$/","_0x"],["error"],["load","onload"],["","BACK"],["load","getComputedStyle"],["load","adsense"],["load","(!o)"],["load","(!i)"],["","_0x"],["","Adblock"],["load","nextFunction"],["/^(?:click|mousedown)$/","bypassEventsInProxies"],["","window.open"],["","open"],["click","exopop"],["/^(?:load|click)$/","popMagic"],["mousedown","popundrInit"],["getexoloader"],["","pop"],["load","exoJsPop101"],["/^loadex/"],["","/exo"],["","_blank"],["",";}"],["load","BetterPop"],["mousedown","preventDefault"],["load","advertising"],["click","preventDefault"],["load","2000"],["/^(click|mousedown|mousemove|touchstart|touchend|touchmove)/","system.popunder"],["load","adb"],["/^(?:click|mousedown|mousemove|touchstart|touchend|touchmove)$/","system.popunder"],["","'0x"],["/DOMContentLoaded|load/","y.readyState"],["/error|canplay/","(t)"],["load","hblocked"],["error","Adblocker"],["DOMContentLoaded","adlinkfly"],["DOMContentLoaded","shortener"],["mousedown","trigger"],["","0x"],["","Pop"],["/^(?:click|mousedown)$/","popunder"],["DOMContentLoaded","preventExit"],["","adsense"],["load"],["click","pop_under"],["load","url"],["load","adverts-top-container"],["","Date"],["DOMContentLoaded","&nbsp"],["click","read_cookie"],["","midRoll"],["click","_0x"],["load","isBlanketFound"],["load","showModal"],["click","trigger"],["mouseout","clientWidth"],["load","download-wrapper"],["load","autoRecov"],["popstate","noPop"],["/^(?:click|mousedown)$/","ppu"],["click","native code"],["/^(?:mousedown|mouseup)$/","0x"],["click","popundr"],["click"],["DOMContentLoaded","compupaste"],["mousedown","!!{});"],["DOMContentLoaded","/adblock/i"],["keydown"],["DOMContentLoaded","isMobile"],["/^/","0x"],["load","PrivateMode"],["scroll","_0x"],["DOMContentLoaded","checkVPN"],["/^(?:click|mousedown|mouseup)$/","di()"],["","\\"],["popstate"],["click","my_inter_listen"],["load","appendChild"],["","bi()"],["","checkTarget"],["click","popunder"],["timeupdate"],["scroll","getElementById"],["load","undefined"],["DOMContentLoaded","scriptwz_url"],["load","0x"],["DOMContentLoaded","btoa"],["adblockActivated"],["click","saveLastEvent"],["DOMContentLoaded","offsetHeight"],["","show"],["/.?/","popMagic"],["","ads"],["click","interstitial"],["load","antiblock"],["DOMContentLoaded","adsBlocked"],["load",".appendChild"],["","btoa"],["","exopop"],["DOMContentLoaded","AdBlock"],["load","blocker"],["mouseleave","NativeDisplayAdID"],["mouseover","event.triggered"],["load","removeChild"],["load","ads"],["click","ShouldShow"],["click","clickCount"],["mousedown","localStorage"],["DOMContentLoaded","document.documentElement.lang.toLowerCase"],["/adblock/i"],["load","doTest"],["DOMContentLoaded","antiAdBlockerHandler"],["DOMContentLoaded","daadb_get_data_fetch"],["click","splashPage"],["load","detect-modal"],["load","_0x"],["DOMContentLoaded","canRedirect"],["DOMContentLoaded","adb"],["error","/\\{[a-z]\\(e\\)\\}/"],["load",".call(this"],["load","adblock"],["/touchmove|wheel/","preventDefault()"],["load","showcfkModal"],["DOMContentLoaded","/adb|fetch/i"],["click","attached","elements","div[class=\"share-embed-container\"]"],["click","fp-screen"],["DOMContentLoaded","leaderboardAd"],["DOMContentLoaded","fetch"],["DOMContentLoaded","iframe"],["","/_blank/i"],["load","htmls"],["blur","focusOut"],["click","/handleClick|popup/"],["load","bypass"],["DOMContentLoaded","location.href"],["","popMagic"],["click","Popunder"],["contextmenu"],["submit","validateForm"],["blur","counter"],["click","maxclick"],["/^(?:click|mousedown)$/","latest!=="],["DOMContentLoaded",".ready"],["load","script"],["","/pop|wm|forceClick/"],["load","block"],["","/_0x|localStorage\\.getItem/"],["DOMContentLoaded","adblock"],["load","head"],["visibilitychange"],["load","/showModal|isBlanketFound/"],["click","shouldShow"],["","/ads|Modal/"],["DOMContentLoaded","init"],["load","Adblock"],["DOMContentLoaded","window.open"],["","vads"],["devtoolschange"],["click","open"],["beforeunload"],["","break;case $."],["mouseup","decodeURIComponent"],["/(?:click|touchend)/","_0x"],["","removeChild"],["click","pu_count"],["","/pop|_blank/"],["click","allclick_Public"],["","dtnoppu"],["/touchstart|mousedown|click/","latest"],["blur","native code"],["blur","event.simulate"],["click","_blank"],["DOMContentLoaded","0x"],["click","overlay"],["scroll","undefined"],["readystatechange","document.removeEventListener"],["mousedown","shown_at"],["scroll","detect"],["click","t(a)"],["","focus"],["DOMContentLoaded","deblocker"],["","preventDefault"],["click","tabunder"],["mouseup","catch"],["scroll","innerHeight"],["hashchange"],["load","/nextFunction|2000/"],["load","player"],["","document.oncontextmenu"],["","about:blank"],["click","popMagic"],["load","popMagic"],["DOMContentLoaded","adsSrc"],["np.detect"],["click","Popup"],["","/open.*_blank/"],["scroll"],["","isBlocking"],["timeupdate","","elements",".quiver-cam-player--ad-not-running.quiver-cam-player--free video"],["","$"],["","exoJsPop101"],["/click|mousedown/","catch"],["","init"],["adb"],["scroll","modal"],["blur"],["DOMContentLoaded","clientHeight"],["click","window.focus"],["click","[native code]"],["click","event.dispatch"],["","Math"],["DOMContentLoaded","popupurls"],["","tabUnder"],["load","XMLHttpRequest"],["load","puURLstrpcht"],["load","AdBlocker"],["","showModal"],["","goog"],["load","abDetectorPro"],["","document.body"],["","modal"],["click","pop"],["click","adobeModalTestABenabled"],["blur","console.log"],["","AdB"],["load","adSession"],["load","Ads"],["DOMContentLoaded","googlesyndication"],["np.evtdetect"],["load","popunder"],["scroll","function(e)"],["DOMContentLoaded","adlinkfly_url"],["mousedown"],["load","document.getElementById"],["mousedown","tabUnder"],["click","popactive"],["load","adsbygoogle"],["DOMContentLoaded","location.replace"],["load","modal_blocker"],["click","isOpened"],["mousedown","pop.doEvent"],["error","blocker"],["click","alink"],["load","[native code]"],["","daadb"],["load","google-analytics"],["","sessionStorage"],["load","fetch"],["click","pingUrl"],["mousedown","scoreUrl"],["click","/event_callback=function\\(\\){window\\.location=t\\.getAttribute\\(\"href\"\\)/"],["","Adb"]];

const hostnamesMap = new Map([["newser.com",0],["sport1.de",2],["userscloud.com",3],["timesofindia.indiatimes.com",4],["drrtyr.mx",4],["pinoyalbums.com",4],["multiplayer.it",4],["mediafire.com",[5,6]],["pinsystem.co.uk",7],["fembed.com",7],["ancensored.com",7],["mp3fiber.com",[7,17]],["xrivonet.info",7],["afreesms.com",8],["tu.no",8],["tio.ch",8],["lavanguardia.com",8],["eplayer.click",8],["kingofdown.com",9],["radiotormentamx.com",9],["quelleestladifference.fr",9],["otakuworldsite.blogspot.com",9],["ad-itech.blogspot.com",9],["sna3talaflam.com",9],["agar.pro",9],["unlockapk.com",9],["mobdi3ips.com",9],["socks24.org",9],["interviewgig.com",9],["javaguides.net",9],["almohtarif-tech.net",9],["forum.release-apk.com",9],["devoloperxda.blogspot.com",9],["zwergenstadt.com",9],["primedeportes.es",9],["9goals.live",9],["upxin.net",9],["ciudadblogger.com",9],["ke-1.com",9],["secretsdeepweb.blogspot.com",9],["bit-shares.com",9],["itdmusics.com",9],["aspdotnet-suresh.com",9],["tudo-para-android.com",9],["urdulibrarypk.blogspot.com",9],["zerotopay.com",9],["akw.to",9],["mawsueaa.com",9],["hesgoal-live.io",9],["king-shoot.io",9],["bibme.org",13],["citationmachine.net",13],["easybib.com",14],["vermangasporno.com",15],["imgtorrnt.in",15],["picbaron.com",[15,144]],["letmejerk.com",15],["letmejerk2.com",15],["letmejerk3.com",15],["letmejerk4.com",15],["letmejerk5.com",15],["letmejerk6.com",15],["letmejerk7.com",15],["dlapk4all.com",15],["kropic.com",15],["kvador.com",15],["pdfindir.net",15],["brstej.com",15],["topwwnews.com",15],["xsanime.com",15],["vidlo.us",15],["put-locker.com",15],["youx.xxx",15],["animeindo.asia",15],["masahub.net",15],["adclickersbot.com",15],["badtaste.it",16],["mage.si",17],["totaldebrid.org",17],["neko-miku.com",17],["elsfile.org",17],["venstrike.jimdofree.com",17],["schrauben-normen.de",17],["avengerinator.blogspot.com",17],["link-to.net",17],["hanimesubth.com",17],["gsmturkey.net",17],["adshrink.it",17],["presentation-ppt.com",17],["mangacanblog.com",17],["pekalongan-cits.blogspot.com",17],["4tymode.win",17],["eurotruck2.com.br",17],["linkvertise.com",17],["reifenrechner.at",17],["tire-size-calculator.info",17],["linuxsecurity.com",17],["encodinghub.com",17],["itsguider.com",17],["cotravinh.blogspot.com",17],["itudong.com",17],["shortx.net",17],["lecturel.com",17],["bakai.org",17],["nar.k-ba.net",17],["tiroalpalo.org",17],["shemalez.com",19],["tubepornclassic.com",19],["gotporn.com",20],["freepornrocks.com",20],["tvhai.org",20],["simpcity.su",20],["realgfporn.com",[21,22]],["titsbox.com",21],["thisvid.com",22],["xvideos-downloader.net",22],["imgspice.com",23],["vikiporn.com",24],["tnaflix.com",24],["hentai2w.com",[24,199]],["yourlust.com",24],["hotpornfile.org",24],["watchfreexxx.net",24],["vintageporntubes.com",24],["angelgals.com",24],["babesexy.com",24],["porndaa.com",24],["ganstamovies.com",24],["youngleak.com",24],["porndollz.com",24],["xnxxvideo.pro",24],["xvideosxporn.com",24],["filmpornofrancais.fr",24],["pictoa.com",[24,47]],["tubator.com",24],["adultasianporn.com",24],["nsfwmonster.com",24],["girlsofdesire.org",24],["gaytail.com",24],["fetish-bb.com",24],["rumporn.com",24],["soyoungteens.com",24],["zubby.com",24],["lesbian8.com",24],["gayforfans.com",24],["reifporn.de",24],["javtsunami.com",24],["18tube.sex",24],["xxxextreme.org",24],["amateurs-fuck.com",24],["sex-amateur-clips.com",24],["hentaiworld.tv",24],["dads-banging-teens.com",24],["home-xxx-videos.com",24],["mature-chicks.com",24],["teens-fucking-matures.com",24],["hqbang.com",24],["darknessporn.com",24],["familyporner.com",24],["freepublicporn.com",24],["pisshamster.com",24],["punishworld.com",24],["xanimu.com",24],["pornhd.com",25],["cnnamador.com",[25,36]],["cle0desktop.blogspot.com",25],["turkanime.co",25],["camclips.tv",[25,48]],["blackpornhq.com",25],["xsexpics.com",25],["ulsex.net",25],["wannafreeporn.com",25],["ytube2dl.com",25],["multiup.us",25],["protege-torrent.com",25],["pussyspace.com",[26,27]],["pussyspace.net",[26,27]],["empflix.com",28],["cpmlink.net",29],["bdsmstreak.com",29],["cutpaid.com",29],["pornforrelax.com",29],["fatwhitebutt.com",29],["mavplay.xyz",29],["sunporno.com",[30,31,199]],["short.pe",32],["bs.to",34],["efukt.com",34],["generacionretro.net",35],["nuevos-mu.ucoz.com",35],["micloudfiles.com",35],["mimaletamusical.blogspot.com",35],["visionias.net",35],["b3infoarena.in",35],["lurdchinexgist.blogspot.com",35],["thefreedommatrix.blogspot.com",35],["hentai-vl.blogspot.com",35],["projetomotog.blogspot.com",35],["ktmx.pro",35],["lirik3satu.blogspot.com",35],["marketmovers.it",35],["pharmaguideline.com",35],["safemaru.blogspot.com",35],["mixloads.com",35],["mangaromance.eu",35],["interssh.com",35],["freesoftpdfdownload.blogspot.com",35],["cirokun.blogspot.com",35],["myadslink.com",35],["blackavelic.com",35],["server.satunivers.tv",35],["eg-akw.com",35],["xn--mgba7fjn.cc",35],["flashingjungle.com",36],["ma-x.org",37],["lavozdegalicia.es",37],["xmovies08.org",39],["globaldjmix.com",40],["zazzybabes.com",41],["haaretz.co.il",42],["haaretz.com",42],["slate.com",43],["megalinks.info",44],["megapastes.com",44],["mega-mkv.com",[44,45]],["mkv-pastes.com",44],["zpaste.net",44],["zlpaste.net",44],["9xlinks.site",44],["zona-leros.net",45],["acortarm.xyz",46],["cine.to",[47,204]],["kissasia.cc",47],["digjav.com",48],["videoszoofiliahd.com",49],["xxxtubezoo.com",50],["zooredtube.com",50],["megacams.me",52],["rlslog.net",52],["porndoe.com",53],["acienciasgalilei.com",55],["playrust.io",56],["payskip.org",57],["short-url.link",58],["tubedupe.com",59],["mcrypto.club",60],["fatgirlskinny.net",61],["polska-ie.com",61],["windowsmatters.com",61],["canaltdt.es",62],["masbrooo.com",62],["2ndrun.tv",62],["stfly.me",63],["oncehelp.com",63],["queenfaucet.website",63],["curto.win",63],["smallseotools.com",64],["macwelt.de",66],["pcwelt.de",66],["capital.de",66],["geo.de",66],["allmomsex.com",67],["allnewindianporn.com",67],["analxxxvideo.com",67],["animalextremesex.com",67],["anime3d.xyz",67],["animefuckmovies.com",67],["animepornfilm.com",67],["animesexbar.com",67],["animesexclip.com",67],["animexxxsex.com",67],["animexxxfilms.com",67],["anysex.club",67],["apetube.asia",67],["asianfuckmovies.com",67],["asianfucktube.com",67],["asianporn.sexy",67],["asiansexcilps.com",67],["beeg.fund",67],["beegvideoz.com",67],["bestasiansex.pro",67],["bravotube.asia",67],["brutalanimalsfuck.com",67],["candyteenporn.com",67],["daddyfuckmovies.com",67],["desifuckonline.com",67],["exclusiveasianporn.com",67],["exteenporn.com",67],["fantasticporn.net",67],["fantasticyoungporn.com",67],["fineasiansex.com",67],["firstasianpussy.com",67],["freeindiansextube.com",67],["freepornasians.com",67],["freerealvideo.com",67],["fuck-beeg.com",67],["fuck-xnxx.com",67],["fuckasian.pro",67],["fuckfuq.com",67],["fuckundies.com",67],["gojapaneseporn.com",67],["golderotica.com",67],["goodyoungsex.com",67],["goyoungporn.com",67],["hardxxxmoms.com",67],["hdvintagetube.com",67],["hentaiporn.me",67],["hentaisexfilms.com",67],["hentaisexuality.com",67],["hot-teens-movies.mobi",67],["hotanimepornvideos.com",67],["hotanimevideos.com",67],["hotasianpussysex.com",67],["hotjapaneseshows.com",67],["hotmaturetube.com",67],["hotmilfs.pro",67],["hotorientalporn.com",67],["hotpornyoung.com",67],["hotxxxjapanese.com",67],["hotxxxpussy.com",67],["indiafree.net",67],["indianpornvideo.online",67],["japanpornclip.com",67],["japanesetube.video",67],["japansex.me",67],["japanesexxxporn.com",67],["japansporno.com",67],["japanxxx.asia",67],["japanxxxworld.com",67],["keezmovies.surf",67],["lingeriefuckvideo.com",67],["liveanimalporn.zooo.club",67],["madhentaitube.com",67],["megahentaitube.com",67],["megajapanesesex.com",67],["megajapantube.com",67],["milfxxxpussy.com",67],["momsextube.pro",67],["momxxxass.com",67],["monkeyanimalporn.com",67],["moviexxx.mobi",67],["newanimeporn.com",67],["newjapanesexxx.com",67],["nicematureporn.com",67],["nudeplayboygirls.com",67],["openxxxporn.com",67],["originalindianporn.com",67],["originalteentube.com",67],["pig-fuck.com",67],["plainasianporn.com",67],["popularasianxxx.com",67],["pornanimetube.com",67],["pornasians.pro",67],["pornhat.asia",67],["pornheed.online",67],["pornjapanesesex.com",67],["pornomovies.asia",67],["pornvintage.tv",67],["primeanimesex.com",67],["realjapansex.com",67],["realmomsex.com",67],["redsexhub.com",67],["retroporn.world",67],["retrosexfilms.com",67],["sex-free-movies.com",67],["sexanimesex.com",67],["sexanimetube.com",67],["sexjapantube.com",67],["sexmomvideos.com",67],["sexteenxxxtube.com",67],["sexxxanimal.com",67],["sexyoungtube.com",67],["sexyvintageporn.com",67],["sopornmovies.com",67],["spicyvintageporn.com",67],["sunporno.club",67],["tabooanime.club",67],["teenextrem.com",67],["teenfucksex.com",67],["teenhost.net",67],["teensexass.com",67],["tnaflix.asia",67],["totalfuckmovies.com",67],["totalmaturefuck.com",67],["txxx.asia",67],["voyeurpornsex.com",67],["warmteensex.com",67],["wetasiancreampie.com",67],["wildhentaitube.com",67],["wowyoungsex.com",67],["xhamster-art.com",67],["xmovie.pro",67],["xnudevideos.com",67],["xnxxjapon.com",67],["xpics.me",67],["xvide.me",67],["xxxanimefuck.com",67],["xxxanimevideos.com",67],["xxxanimemovies.com",67],["xxxhentaimovies.com",67],["xxxhothub.com",67],["xxxjapaneseporntube.com",67],["xxxlargeporn.com",67],["xxxmomz.com",67],["xxxpornmilf.com",67],["xxxpussyclips.com",67],["xxxpussysextube.com",67],["xxxretrofuck.com",67],["xxxsex.pro",67],["xxxsexyjapanese.com",67],["xxxteenyporn.com",67],["xxxvideo.asia",67],["xxxvideos.ink",67],["xxxyoungtv.com",67],["youjizzz.club",67],["youngpussyfuck.com",67],["bayimg.com",68],["celeb.gate.cc",69],["masterplayer.xyz",71],["pussy-hub.com",71],["porndex.com",72],["compucalitv.com",73],["diariodenavarra.es",75],["duden.de",77],["pennlive.com",79],["beautypageants.indiatimes.com",80],["01fmovies.com",81],["lnk2.cc",83],["fullhdxxx.com",84],["luscious.net",[84,144]],["classicpornbest.com",84],["xstory-fr.com",84],["1youngteenporn.com",84],["www-daftarharga.blogspot.com",[84,188]],["miraculous.to",[84,194]],["vtube.to",84],["gosexpod.com",85],["otakukan.com",86],["xcafe.com",87],["pornfd.com",87],["venusarchives.com",87],["imagehaha.com",88],["imagenpic.com",88],["imageshimage.com",88],["imagetwist.com",88],["k1nk.co",89],["watchasians.cc",89],["alexsports.xyz",89],["lulustream.com",89],["luluvdo.com",89],["web.de",90],["news18.com",91],["thelanb.com",92],["dropmms.com",92],["softwaredescargas.com",93],["cracking-dz.com",94],["anitube.ninja",95],["gazzetta.it",96],["port.hu",98],["dziennikbaltycki.pl",99],["dzienniklodzki.pl",99],["dziennikpolski24.pl",99],["dziennikzachodni.pl",99],["echodnia.eu",99],["expressbydgoski.pl",99],["expressilustrowany.pl",99],["gazetakrakowska.pl",99],["gazetalubuska.pl",99],["gazetawroclawska.pl",99],["gk24.pl",99],["gloswielkopolski.pl",99],["gol24.pl",99],["gp24.pl",99],["gra.pl",99],["gs24.pl",99],["kurierlubelski.pl",99],["motofakty.pl",99],["naszemiasto.pl",99],["nowiny24.pl",99],["nowosci.com.pl",99],["nto.pl",99],["polskatimes.pl",99],["pomorska.pl",99],["poranny.pl",99],["sportowy24.pl",99],["strefaagro.pl",99],["strefabiznesu.pl",99],["stronakobiet.pl",99],["telemagazyn.pl",99],["to.com.pl",99],["wspolczesna.pl",99],["course9x.com",99],["courseclub.me",99],["azrom.net",99],["alttyab.net",99],["esopress.com",99],["nesiaku.my.id",99],["onemanhua.com",100],["freeindianporn.mobi",100],["dr-farfar.com",101],["boyfriendtv.com",102],["brandstofprijzen.info",103],["netfuck.net",104],["blog24.me",[104,139]],["kisahdunia.com",104],["javsex.to",104],["nulljungle.com",104],["oyuncusoruyor.com",104],["pbarecap.ph",104],["sourds.net",104],["teknobalta.com",104],["tvinternetowa.info",104],["sqlserveregitimleri.com",104],["tutcourse.com",104],["readytechflip.com",104],["novinhastop.com",104],["warddogs.com",104],["dvdgayporn.com",104],["iimanga.com",104],["tinhocdongthap.com",104],["tremamnon.com",104],["423down.com",104],["brizzynovel.com",104],["jugomobile.com",104],["freecodezilla.net",104],["animekhor.xyz",104],["iconmonstr.com",104],["gay-tubes.cc",104],["rbxscripts.net",104],["comentariodetexto.com",104],["wordpredia.com",104],["livsavr.co",104],["allfaucet.xyz",[104,139]],["titbytz.tk",104],["replica-watch.info",104],["alludemycourses.com",104],["kayifamilytv.com",104],["iir.ai",105],["gameofporn.com",107],["qpython.club",108],["antifake-funko.fr",108],["dktechnicalmate.com",108],["recipahi.com",108],["e9china.net",109],["ontools.net",109],["marketbeat.com",110],["hentaipornpics.net",111],["apps2app.com",112],["alliptvlinks.com",113],["waterfall.money",113],["xvideos.com",114],["xvideos2.com",114],["homemoviestube.com",115],["sexseeimage.com",115],["jpopsingles.eu",117],["azmath.info",117],["downfile.site",117],["downphanmem.com",117],["expertvn.com",117],["memangbau.com",117],["trangchu.news",117],["aztravels.net",117],["ielts-isa.edu.vn",117],["techedubyte.com",[117,252]],["tubereader.me",118],["repretel.com",118],["dagensnytt.com",119],["mrproblogger.com",119],["themezon.net",119],["gfx-station.com",120],["bitzite.com",[120,139,143]],["historyofroyalwomen.com",121],["davescomputertips.com",121],["ukchat.co.uk",122],["hivelr.com",123],["embedz.click",124],["skidrowcodex.net",125],["takimag.com",126],["digi.no",127],["th.gl",128],["scimagojr.com",129],["haxina.com",129],["cryptofenz.xyz",129],["twi-fans.com",130],["learn-cpp.org",131],["soccerinhd.com",132],["terashare.co",133],["pornwex.tv",134],["smithsonianmag.com",135],["homesports.net",136],["upshrink.com",137],["ohionowcast.info",139],["wiour.com",139],["appsbull.com",139],["diudemy.com",139],["maqal360.com",139],["bitcotasks.com",139],["videolyrics.in",139],["manofadan.com",139],["cempakajaya.com",139],["tagecoin.com",139],["doge25.in",139],["king-ptcs.com",139],["naijafav.top",139],["ourcoincash.xyz",139],["sh.techsamir.com",139],["claimcoins.site",139],["cryptosh.pro",139],["coinsrev.com",139],["go.freetrx.fun",139],["eftacrypto.com",139],["fescrypto.com",139],["earnhub.net",139],["kiddyshort.com",139],["tronxminer.com",139],["homeairquality.org",140],["cety.app",141],["exego.app",141],["cutlink.net",141],["cutsy.net",141],["cutyurls.com",141],["cutty.app",141],["cutnet.net",141],["adcrypto.net",142],["admediaflex.com",142],["aduzz.com",142],["bitcrypto.info",142],["cdrab.com",142],["datacheap.io",142],["hbz.us",142],["savego.org",142],["owsafe.com",142],["sportweb.info",142],["aiimgvlog.fun",144],["6indianporn.com",144],["amateurebonypics.com",144],["amateuryoungpics.com",144],["cinemabg.net",144],["coomer.su",144],["desimmshd.com",144],["frauporno.com",144],["givemeaporn.com",144],["hitomi.la",144],["jav-asia.top",144],["javf.net",144],["javideo.net",144],["kemono.su",144],["kr18plus.com",144],["pilibook.com",144],["pornborne.com",144],["porngrey.com",144],["qqxnxx.com",144],["sexvideos.host",144],["submilf.com",144],["subtaboo.com",144],["tktube.com",144],["xfrenchies.com",144],["moderngyan.com",145],["sattakingcharts.in",145],["freshbhojpuri.com",145],["bgmi32bitapk.in",145],["bankshiksha.in",145],["earn.mpscstudyhub.com",145],["earn.quotesopia.com",145],["money.quotesopia.com",145],["best-mobilegames.com",145],["learn.moderngyan.com",145],["bharatsarkarijobalert.com",145],["coingraph.us",146],["momo-net.com",146],["maxgaming.fi",146],["cybercityhelp.in",147],["travel.vebma.com",148],["cloud.majalahhewan.com",148],["crm.cekresi.me",148],["ai.tempatwisata.pro",148],["pinloker.com",148],["sekilastekno.com",148],["link.paid4link.com",149],["vulture.com",150],["megaplayer.bokracdn.run",151],["hentaistream.com",152],["siteunblocked.info",153],["larvelfaucet.com",154],["feyorra.top",154],["claimtrx.com",154],["moviesyug.net",155],["w4files.ws",155],["parispi.net",156],["simkl.com",157],["paperzonevn.com",158],["dailyvideoreports.net",159],["lewd.ninja",160],["systemnews24.com",161],["incestvidz.com",162],["niusdiario.es",163],["playporngames.com",164],["movi.pk",[165,169]],["justin.mp3quack.lol",167],["cutesexyteengirls.com",168],["0dramacool.net",169],["185.53.88.104",169],["185.53.88.204",169],["185.53.88.15",169],["123movies4k.net",169],["1movieshd.com",169],["1rowsports.com",169],["4share-mp3.net",169],["6movies.net",169],["9animetv.to",169],["720pstream.me",169],["aagmaal.com",169],["abysscdn.com",169],["ajkalerbarta.com",169],["akstream.xyz",169],["androidapks.biz",169],["androidsite.net",169],["animeonlinefree.org",169],["animesite.net",169],["animespank.com",169],["aniworld.to",169],["apkmody.io",169],["appsfree4u.com",169],["audioz.download",169],["awafim.tv",169],["bdnewszh.com",169],["beastlyprints.com",169],["bengalisite.com",169],["bestfullmoviesinhd.org",169],["betteranime.net",169],["blacktiesports.live",169],["buffsports.stream",169],["ch-play.com",169],["clickforhire.com",169],["cloudy.pk",169],["computercrack.com",169],["coolcast2.com",169],["crackedsoftware.biz",169],["crackfree.org",169],["cracksite.info",169],["cryptoblog24.info",169],["cuatrolatastv.blogspot.com",169],["cydiasources.net",169],["decmelfot.xyz",169],["dirproxy.com",169],["dopebox.to",169],["downloadapk.info",169],["downloadapps.info",169],["downloadgames.info",169],["downloadmusic.info",169],["downloadsite.org",169],["downloadwella.com",169],["ebooksite.org",169],["educationtips213.blogspot.com",169],["egyup.live",169],["elgoles.pro",169],["embed.meomeo.pw",169],["embed.scdn.to",169],["emulatorsite.com",169],["essaysharkwriting.club",169],["exploreera.net",169],["extrafreetv.com",169],["fakedetail.com",169],["fclecteur.com",169],["files.im",169],["flexyhit.com",169],["fmoviefree.net",169],["fmovies24.com",169],["footyhunter3.xyz",169],["freeflix.info",169],["freemoviesu4.com",169],["freeplayervideo.com",169],["freesoccer.net",169],["fseries.org",169],["gamefast.org",169],["gamesite.info",169],["gettapeads.com",169],["gmanga.me",169],["gocast123.me",169],["gogohd.net",169],["gogoplay5.com",169],["gooplay.net",169],["gostreamon.net",169],["happy2hub.org",169],["harimanga.com",169],["healthnewsreel.com",169],["hexupload.net",169],["hinatasoul.com",169],["hindisite.net",169],["holymanga.net",169],["hxfile.co",169],["isosite.org",169],["iv-soft.com",169],["januflix.expert",169],["jewelry.com.my",169],["johnwardflighttraining.com",169],["kabarportal.com",169],["kstorymedia.com",169],["la123movies.org",169],["lespassionsdechinouk.com",169],["lilymanga.net",169],["linksdegrupos.com.br",169],["linkz.wiki",169],["livestreamtv.pk",169],["macsite.info",169],["mangapt.com",169],["mangasite.org",169],["manhuascan.com",169],["megafilmeshdseries.com",169],["megamovies.org",169],["membed.net",169],["moddroid.com",169],["moviefree2.com",169],["movies-watch.com.pk",169],["moviesite.app",169],["moviesonline.fm",169],["moviesx.org",169],["msmoviesbd.com",169],["musicsite.biz",169],["myfernweh.com",169],["myviid.com",169],["nazarickol.com",169],["noob4cast.com",169],["nsw2u.com",[169,260]],["oko.sh",169],["olympicstreams.me",169],["orangeink.pk",169],["owllink.net",169],["pahaplayers.click",169],["patchsite.net",169],["pdfsite.net",169],["play1002.com",169],["player-cdn.com",169],["productkeysite.com",169],["projectfreetv.one",169],["romsite.org",169],["rufiguta.com",169],["rytmp3.io",169],["send.cm",169],["seriesite.net",169],["seriezloaded.com.ng",169],["serijehaha.com",169],["shrugemojis.com",169],["siteapk.net",169],["siteflix.org",169],["sitegames.net",169],["sitekeys.net",169],["sitepdf.com",169],["sitetorrent.com",169],["softwaresite.net",169],["sportbar.live",169],["sportkart1.xyz",169],["ssyoutube.com",169],["stardima.com",169],["stream4free.live",169],["superapk.org",169],["supermovies.org",169],["tainio-mania.online",169],["talaba.su",169],["tamilguns.org",169],["tatabrada.tv",169],["techtrendmakers.com",169],["theflixer.tv",169],["thememypc.net",169],["thetechzone.online",169],["thripy.com",169],["tonnestreamz.xyz",169],["travelplanspro.com",169],["turcasmania.com",169],["tusfiles.com",169],["tvonlinesports.com",169],["ultramovies.org",169],["uploadbank.com",169],["urdubolo.pk",169],["vidspeeds.com",169],["vumoo.to",169],["warezsite.net",169],["watchmovies2.com",169],["watchmoviesforfree.org",169],["watchofree.com",169],["watchsite.net",169],["watchsouthpark.tv",169],["watchtvch.club",169],["web.livecricket.is",169],["webseries.club",169],["worldcupstream.pm",169],["y2mate.com",169],["youapk.net",169],["youtube4kdownloader.com",169],["yts-subs.com",169],["haho.moe",170],["nicy-spicy.pw",171],["novelmultiverse.com",172],["mylegalporno.com",173],["videowood.tv",176],["thecut.com",177],["novelism.jp",178],["alphapolis.co.jp",179],["okrzone.com",180],["game3rb.com",181],["javhub.net",181],["thotvids.com",182],["berklee.edu",183],["rawkuma.com",[184,185]],["moviesjoyhd.to",185],["imeteo.sk",186],["youtubemp3donusturucu.net",187],["surfsees.com",189],["vivo.st",[190,191]],["alueviesti.fi",193],["kiuruvesilehti.fi",193],["lempaala.ideapark.fi",193],["olutposti.fi",193],["urjalansanomat.fi",193],["tainhanhvn.com",195],["titantv.com",196],["3cinfo.net",197],["transportationlies.org",198],["camarchive.tv",199],["crownimg.com",199],["freejav.guru",199],["hentai2read.com",199],["icyporno.com",199],["illink.net",199],["javtiful.com",199],["m-hentai.net",199],["pornblade.com",199],["pornfelix.com",199],["pornxxxxtube.net",199],["redwap.me",199],["redwap2.com",199],["redwap3.com",199],["tubxporn.xxx",199],["ver-comics-porno.com",199],["ver-mangas-porno.com",199],["xanimeporn.com",199],["xxxvideohd.net",199],["zetporn.com",199],["cocomanga.com",200],["sampledrive.in",201],["mcleaks.net",202],["explorecams.com",202],["minecraft.buzz",202],["chillx.top",203],["playerx.stream",203],["m.liputan6.com",205],["stardewids.com",[205,228]],["ingles.com",206],["spanishdict.com",206],["surfline.com",207],["rureka.com",208],["bunkr.is",209],["amateur8.com",210],["freeporn8.com",210],["maturetubehere.com",210],["embedo.co",211],["corriere.it",212],["oggi.it",212],["2the.space",213],["file.gocmod.com",214],["apkcombo.com",215],["sponsorhunter.com",216],["soft98.ir",217],["novelssites.com",218],["torrentmac.net",219],["udvl.com",220],["moviezaddiction.icu",221],["dlpanda.com",222],["socialmediagirls.com",223],["ecamrips.com",223],["showcamrips.com",223],["einrichtungsbeispiele.de",224],["weadown.com",225],["molotov.tv",226],["freecoursesonline.me",227],["adelsfun.com",227],["advantien.com",227],["bailbondsfinder.com",227],["bigpiecreative.com",227],["childrenslibrarylady.com",227],["classifarms.com",227],["comtasq.ca",227],["crone.es",227],["ctrmarketingsolutions.com",227],["dropnudes.com",227],["ftuapps.dev",227],["genzsport.com",227],["ghscanner.com",227],["grsprotection.com",227],["gruporafa.com.br",227],["inmatefindcalifornia.com",227],["inmatesearchidaho.com",227],["itsonsitetv.com",227],["mfmfinancials.com",227],["myproplugins.com",227],["onehack.us",227],["ovester.com",227],["paste.bin.sx",227],["privatenudes.com",227],["renoconcrete.ca",227],["richieashbeck.com",227],["sat.technology",227],["short1ink.com",227],["stpm.co.uk",227],["wegotcookies.co",227],["mathcrave.com",227],["commands.gg",228],["smgplaza.com",229],["emturbovid.com",230],["findjav.com",230],["mmtv01.xyz",230],["stbturbo.xyz",230],["streamsilk.com",230],["freepik.com",231],["diyphotography.net",233],["bitchesgirls.com",234],["shopforex.online",235],["programmingeeksclub.com",236],["easymc.io",237],["diendancauduong.com",238],["parentcircle.com",239],["h-game18.xyz",240],["nopay.info",241],["wheelofgold.com",242],["shortlinks.tech",243],["skill4ltu.eu",245],["lifestyle.bg",246],["news.bg",246],["topsport.bg",246],["webcafe.bg",246],["freepikdownloader.com",247],["freepasses.org",248],["iusedtobeaboss.com",249],["androidpolice.com",250],["cbr.com",250],["dualshockers.com",250],["gamerant.com",250],["howtogeek.com",250],["thegamer.com",250],["blogtruyenmoi.com",251],["igay69.com",253],["graphicget.com",254],["qiwi.gg",255],["netcine2.la",256],["idnes.cz",[257,258]],["cbc.ca",259]]);

const entitiesMap = new Map([["kisscartoon",1],["kissasian",7],["ganool",7],["pirate",7],["piratebay",7],["pirateproxy",7],["proxytpb",7],["thepiratebay",7],["limetorrents",[9,15]],["king-pes",9],["depedlps",9],["komikcast",9],["idedroidsafelink",9],["links-url",9],["ak4eg",9],["streanplay",10],["steanplay",10],["liferayiseasy",[11,12]],["pahe",15],["yts",15],["tube8",15],["topeuropix",15],["moviescounter",15],["torrent9",15],["desiremovies",15],["movs4u",15],["uwatchfree",15],["hydrax",15],["4movierulz",15],["projectfreetv",15],["arabseed",15],["btdb",[15,56]],["world4ufree",15],["streamsport",15],["rojadirectatvhd",15],["userload",15],["freecoursesonline",17],["lordpremium",17],["todovieneok",17],["novablogitalia",17],["anisubindo",17],["btvsports",17],["adyou",18],["fxporn69",21],["rexporn",25],["movies07",25],["pornocomics",25],["sexwebvideo",29],["pornomoll",29],["gsurl",32],["mimaletadepeliculas",33],["burningseries",34],["dz4soft",35],["yoututosjeff",35],["ebookmed",35],["lanjutkeun",35],["novelasesp",35],["singingdalong",35],["doujindesu",35],["xmovies8",38],["mega-dvdrip",45],["peliculas-dvdrip",45],["desbloqueador",46],["newpelis",[47,54]],["pelix",[47,54]],["allcalidad",[47,199]],["khatrimaza",47],["camwhores",48],["camwhorestv",48],["uproxy",48],["nekopoi",51],["mirrorace",60],["mixdrp",65],["asiansex",67],["japanfuck",67],["japanporn",67],["teensex",67],["vintagetube",67],["xxxmovies",67],["zooqle",70],["hdfull",74],["mangamanga",76],["streameast",78],["thestreameast",78],["vev",82],["vidop",82],["1337x",84],["x1337x",84],["zone-telechargement",84],["megalink",89],["gmx",90],["mega1080p",95],["9hentai",97],["gaypornhdfree",104],["cinemakottaga",104],["privatemoviez",104],["apkmaven",104],["popcornstream",106],["readcomiconline",116],["azsoft",117],["fc-lc",138],["pornktube",144],["watchseries",144],["milfnut",146],["pagalmovies",155],["7starhd",155],["jalshamoviez",155],["9xupload",155],["bdupload",155],["desiupload",155],["rdxhd1",155],["moviessources",166],["nuvid",167],["0gomovie",169],["0gomovies",169],["123moviefree",169],["1kmovies",169],["1madrasdub",169],["1primewire",169],["2embed",169],["2madrasdub",169],["2umovies",169],["4anime",169],["adblockplustape",169],["altadefinizione01",169],["anitube",169],["atomixhq",169],["beinmatch",169],["brmovies",169],["cima4u",169],["clicknupload",169],["cmovies",169],["cricfree",169],["crichd",169],["databasegdriveplayer",169],["dood",169],["f1stream",169],["faselhd",169],["fbstream",169],["file4go",169],["filemoon",169],["filepress",[169,232]],["filmlinks4u",169],["filmpertutti",169],["filmyzilla",169],["fmovies",169],["french-stream",169],["fzlink",169],["gdriveplayer",169],["gofilms4u",169],["gogoanime",169],["gomoviz",169],["hdmoviefair",169],["hdmovies4u",169],["hdmovies50",169],["hdmoviesfair",169],["hh3dhay",169],["hindilinks4u",169],["hotmasti",169],["hurawatch",169],["klmanga",169],["klubsports",169],["libertestreamvf",169],["livetvon",169],["manga1000",169],["manga1001",169],["mangaraw",169],["mangarawjp",169],["mlbstream",169],["motogpstream",169],["movierulz",169],["movies123",169],["movies2watch",169],["moviesden",169],["moviezaddiction",169],["myflixer",169],["nbastream",169],["netcine",169],["nflstream",169],["nhlstream",169],["onlinewatchmoviespk",169],["pctfenix",169],["pctnew",169],["pksmovies",169],["plyjam",169],["plylive",169],["pogolinks",169],["popcorntime",169],["poscitech",169],["prmovies",169],["rugbystreams",169],["shahed4u",169],["sflix",169],["sitesunblocked",169],["solarmovies",169],["sportcast",169],["sportskart",169],["sports-stream",169],["streaming-french",169],["streamers",169],["streamingcommunity",169],["strikeout",169],["t20cup",169],["tennisstreams",169],["torrentdosfilmes",169],["toonanime",169],["tvply",169],["ufcstream",169],["uptomega",169],["uqload",169],["vudeo",169],["vidoo",169],["vipbox",169],["vipboxtv",169],["vipleague",169],["viprow",169],["yesmovies",169],["yomovies",169],["yomovies1",169],["yt2mp3s",169],["kat",169],["katbay",169],["kickass",169],["kickasshydra",169],["kickasskat",169],["kickass2",169],["kickasstorrents",169],["kat2",169],["kattracker",169],["thekat",169],["thekickass",169],["kickassz",169],["kickasstorrents2",169],["topkickass",169],["kickassgo",169],["kkickass",169],["kkat",169],["kickasst",169],["kick4ss",169],["guardaserie",174],["cine-calidad",175],["videovard",192],["gntai",199],["grantorrent",199],["mejortorrent",199],["mejortorrento",199],["mejortorrents",199],["mejortorrents1",199],["mejortorrentt",199],["shineads",201],["bg-gledai",227],["gledaitv",227],["motchill",244]]);

const exceptionsMap = new Map([["mentor.duden.de",[77]],["forum.soft98.ir",[217]]]);

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
            'loading': 1, 'asap': 1,
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
