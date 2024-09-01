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
const uBOL_addEventListenerDefuser = function() {

const scriptletGlobals = {}; // eslint-disable-line

const argsList = [["load","Object"],["mousedown","clientX"],["load","hard_block"],["/contextmenu|keydown/"],["","adb"],["click","ClickHandler"],["load","IsAdblockRequest"],["/^(?:click|mousedown)$/","_0x"],["error"],["load","onload"],["","BACK"],["load","getComputedStyle"],["load","adsense"],["load","(!o)"],["load","(!i)"],["","_0x"],["","Adblock"],["/^(?:click|mousedown)$/","bypassEventsInProxies"],["","window.open"],["","open"],["click","exopop"],["/^(?:load|click)$/","popMagic"],["mousedown","popundrInit"],["getexoloader"],["","pop"],["load","exoJsPop101"],["/^loadex/"],["","/exo"],["","_blank"],["mousedown","preventDefault"],["load","nextFunction"],["load","advertising"],["click","preventDefault"],["load","2000"],["/^(click|mousedown|mousemove|touchstart|touchend|touchmove)/","system.popunder"],["load","adb"],["/^(?:click|mousedown|mousemove|touchstart|touchend|touchmove)$/","system.popunder"],["","'0x"],["/DOMContentLoaded|load/","y.readyState"],["/error|canplay/","(t)"],["load","hblocked"],["error","Adblocker"],["DOMContentLoaded","adlinkfly"],["DOMContentLoaded","shortener"],["mousedown","trigger"],["","0x"],["","Pop"],["/^(?:click|mousedown)$/","popunder"],["DOMContentLoaded","preventExit"],["","adsense"],["load"],["click","pop_under"],["load","url"],["load","adverts-top-container"],["","Date"],["DOMContentLoaded","&nbsp"],["click","read_cookie"],["","midRoll"],["click","_0x"],["load","isBlanketFound"],["load","showModal"],["click","trigger"],["mouseout","clientWidth"],["load","download-wrapper"],["load","autoRecov"],["popstate","noPop"],["/^(?:click|mousedown)$/","ppu"],["click","native code"],["/^(?:mousedown|mouseup)$/","0x"],["click","popundr"],["click"],["DOMContentLoaded","compupaste"],["mousedown","!!{});"],["DOMContentLoaded","/adblock/i"],["keydown"],["DOMContentLoaded","isMobile"],["/^/","0x"],["load","PrivateMode"],["scroll","_0x"],["DOMContentLoaded","checkVPN"],["/^(?:click|mousedown|mouseup)$/","di()"],["","\\"],["popstate"],["click","my_inter_listen"],["load","appendChild"],["","bi()"],["","checkTarget"],["click","popunder"],["timeupdate"],["scroll","getElementById"],["load","undefined"],["DOMContentLoaded","scriptwz_url"],["load","0x"],["DOMContentLoaded","btoa"],["adblockActivated"],["click","saveLastEvent"],["DOMContentLoaded","offsetHeight"],["","show"],["/.?/","popMagic"],["","ads"],["click","interstitial"],["load","antiblock"],["DOMContentLoaded","adsBlocked"],["load",".appendChild"],["","btoa"],["","exopop"],["DOMContentLoaded","AdBlock"],["load","blocker"],["mouseleave","NativeDisplayAdID"],["mouseover","event.triggered"],["load","removeChild"],["load","ads"],["click","ShouldShow"],["click","clickCount"],["mousedown","localStorage"],["DOMContentLoaded","document.documentElement.lang.toLowerCase"],["/adblock/i"],["load","doTest"],["DOMContentLoaded","antiAdBlockerHandler"],["DOMContentLoaded","daadb_get_data_fetch"],["click","splashPage"],["load","detect-modal"],["DOMContentLoaded","canRedirect"],["DOMContentLoaded","adb"],["error","/\\{[a-z]\\(e\\)\\}/"],["load",".call(this"],["load","adblock"],["/touchmove|wheel/","preventDefault()"],["load","showcfkModal"],["DOMContentLoaded","/adb|fetch/i"],["click","attached","elements","div[class=\"share-embed-container\"]"],["click","fp-screen"],["DOMContentLoaded","leaderboardAd"],["DOMContentLoaded","fetch"],["mousedown","shown_at"],["DOMContentLoaded","iframe"],["","/_blank/i"],["load","htmls"],["blur","focusOut"],["click","/handleClick|popup/"],["click","open"],["load","bypass"],["DOMContentLoaded","location.href"],["","popMagic"],["click","Popunder"],["contextmenu"],["submit","validateForm"],["blur","counter"],["click","maxclick"],["/^(?:click|mousedown)$/","latest!=="],["DOMContentLoaded",".ready"],["load","script"],["","/pop|wm|forceClick/"],["load","block"],["","/_0x|localStorage\\.getItem/"],["DOMContentLoaded","adblock"],["visibilitychange"],["load","/showModal|isBlanketFound/"],["click","shouldShow"],["","/ads|Modal/"],["DOMContentLoaded","init"],["load","Adblock"],["DOMContentLoaded","window.open"],["","vads"],["devtoolschange"],["beforeunload"],["","break;case $."],["mouseup","decodeURIComponent"],["/(?:click|touchend)/","_0x"],["","removeChild"],["click","pu_count"],["","/pop|_blank/"],["click","allclick_Public"],["","dtnoppu"],["/touchstart|mousedown|click/","latest"],["blur","native code"],["blur","event.simulate"],["click","_blank"],["DOMContentLoaded","0x"],["click","overlay"],["scroll","undefined"],["readystatechange","document.removeEventListener"],["scroll","detect"],["click","t(a)"],["","focus"],["DOMContentLoaded","deblocker"],["","preventDefault"],["click","tabunder"],["mouseup","catch"],["scroll","innerHeight"],["hashchange"],["load","/nextFunction|2000/"],["load","player"],["","document.oncontextmenu"],["","about:blank"],["click","popMagic"],["load","popMagic"],["DOMContentLoaded","adsSrc"],["np.detect"],["click","Popup"],["","/open.*_blank/"],["scroll"],["","isBlocking"],["timeupdate","","elements",".quiver-cam-player--ad-not-running.quiver-cam-player--free video"],["","$"],["","exoJsPop101"],["/click|mousedown/","catch"],["","init"],["adb"],["scroll","modal"],["blur"],["DOMContentLoaded","clientHeight"],["click","window.focus"],["click","[native code]"],["click","event.dispatch"],["","Math"],["DOMContentLoaded","popupurls"],["","tabUnder"],["load","XMLHttpRequest"],["load","puURLstrpcht"],["load","AdBlocker"],["","showModal"],["","goog"],["load","abDetectorPro"],["","document.body"],["","modal"],["click","pop"],["click","adobeModalTestABenabled"],["blur","console.log"],["","AdB"],["load","adSession"],["load","Ads"],["DOMContentLoaded","googlesyndication"],["np.evtdetect"],["load","popunder"],["scroll","function(e)"],["DOMContentLoaded","adlinkfly_url"],["mousedown"],["load","document.getElementById"],["mousedown","tabUnder"],["click","popactive"],["load","adsbygoogle"],["DOMContentLoaded","location.replace"],["load","modal_blocker"],["click","isOpened"],["mousedown","pop.doEvent"],["error","blocker"],["click","alink"],["load","[native code]"],["","daadb"],["load","google-analytics"],["","sessionStorage"],["DOMContentLoaded","overlays"],["load","fetch"],["click","pingUrl"],["mousedown","scoreUrl"],["click","/event_callback=function\\(\\){window\\.location=t\\.getAttribute\\(\"href\"\\)/"],["","Adb"]];

const hostnamesMap = new Map([["newser.com",0],["sport1.de",2],["userscloud.com",3],["timesofindia.indiatimes.com",4],["drrtyr.mx",4],["pinoyalbums.com",4],["multiplayer.it",4],["mediafire.com",[5,6]],["pinsystem.co.uk",7],["fembed.com",7],["ancensored.com",7],["mp3fiber.com",[7,30]],["xrivonet.info",7],["afreesms.com",8],["tu.no",8],["tio.ch",8],["lavanguardia.com",8],["eplayer.click",8],["kingofdown.com",9],["radiotormentamx.com",9],["quelleestladifference.fr",9],["otakuworldsite.blogspot.com",9],["ad-itech.blogspot.com",9],["sna3talaflam.com",9],["agar.pro",9],["unlockapk.com",9],["mobdi3ips.com",9],["socks24.org",9],["interviewgig.com",9],["javaguides.net",9],["almohtarif-tech.net",9],["forum.release-apk.com",9],["devoloperxda.blogspot.com",9],["zwergenstadt.com",9],["primedeportes.es",9],["9goals.live",9],["upxin.net",9],["ciudadblogger.com",9],["ke-1.com",9],["secretsdeepweb.blogspot.com",9],["bit-shares.com",9],["itdmusics.com",9],["aspdotnet-suresh.com",9],["tudo-para-android.com",9],["urdulibrarypk.blogspot.com",9],["zerotopay.com",9],["akw.to",9],["mawsueaa.com",9],["hesgoal-live.io",9],["king-shoot.io",9],["bibme.org",13],["citationmachine.net",13],["easybib.com",14],["vermangasporno.com",15],["imgtorrnt.in",15],["picbaron.com",[15,143]],["letmejerk.com",15],["letmejerk2.com",15],["letmejerk3.com",15],["letmejerk4.com",15],["letmejerk5.com",15],["letmejerk6.com",15],["letmejerk7.com",15],["dlapk4all.com",15],["kropic.com",15],["kvador.com",15],["pdfindir.net",15],["brstej.com",15],["topwwnews.com",15],["xsanime.com",15],["vidlo.us",15],["put-locker.com",15],["youx.xxx",15],["animeindo.asia",15],["masahub.net",15],["adclickersbot.com",15],["badtaste.it",16],["shemalez.com",18],["tubepornclassic.com",18],["gotporn.com",19],["freepornrocks.com",19],["tvhai.org",19],["simpcity.su",19],["realgfporn.com",[20,21]],["titsbox.com",20],["thisvid.com",21],["xvideos-downloader.net",21],["imgspice.com",22],["vikiporn.com",23],["tnaflix.com",23],["hentai2w.com",[23,195]],["yourlust.com",23],["hotpornfile.org",23],["watchfreexxx.net",23],["vintageporntubes.com",23],["angelgals.com",23],["babesexy.com",23],["porndaa.com",23],["ganstamovies.com",23],["youngleak.com",23],["porndollz.com",23],["xnxxvideo.pro",23],["xvideosxporn.com",23],["filmpornofrancais.fr",23],["pictoa.com",[23,45]],["tubator.com",23],["adultasianporn.com",23],["nsfwmonster.com",23],["girlsofdesire.org",23],["gaytail.com",23],["fetish-bb.com",23],["rumporn.com",23],["soyoungteens.com",23],["zubby.com",23],["lesbian8.com",23],["gayforfans.com",23],["reifporn.de",23],["javtsunami.com",23],["18tube.sex",23],["xxxextreme.org",23],["amateurs-fuck.com",23],["sex-amateur-clips.com",23],["hentaiworld.tv",23],["dads-banging-teens.com",23],["home-xxx-videos.com",23],["mature-chicks.com",23],["teens-fucking-matures.com",23],["hqbang.com",23],["darknessporn.com",23],["familyporner.com",23],["freepublicporn.com",23],["pisshamster.com",23],["punishworld.com",23],["xanimu.com",23],["pornhd.com",24],["cnnamador.com",[24,34]],["cle0desktop.blogspot.com",24],["turkanime.co",24],["camclips.tv",[24,46]],["blackpornhq.com",24],["xsexpics.com",24],["ulsex.net",24],["wannafreeporn.com",24],["ytube2dl.com",24],["multiup.us",24],["protege-torrent.com",24],["pussyspace.com",[25,26]],["pussyspace.net",[25,26]],["empflix.com",27],["cpmlink.net",28],["bdsmstreak.com",28],["cutpaid.com",28],["pornforrelax.com",28],["fatwhitebutt.com",28],["mavplay.xyz",28],["short.pe",29],["totaldebrid.org",30],["neko-miku.com",30],["elsfile.org",30],["venstrike.jimdofree.com",30],["schrauben-normen.de",30],["avengerinator.blogspot.com",30],["link-to.net",30],["hanimesubth.com",30],["gsmturkey.net",30],["adshrink.it",30],["presentation-ppt.com",30],["mangacanblog.com",30],["pekalongan-cits.blogspot.com",30],["4tymode.win",30],["eurotruck2.com.br",30],["tiroalpaloes.com",30],["linkvertise.com",30],["reifenrechner.at",30],["tire-size-calculator.info",30],["linuxsecurity.com",30],["encodinghub.com",30],["itsguider.com",30],["cotravinh.blogspot.com",30],["itudong.com",30],["shortx.net",30],["lecturel.com",30],["bakai.org",30],["nar.k-ba.net",30],["tiroalpalo.org",30],["bs.to",32],["efukt.com",32],["generacionretro.net",33],["nuevos-mu.ucoz.com",33],["micloudfiles.com",33],["mimaletamusical.blogspot.com",33],["visionias.net",33],["b3infoarena.in",33],["lurdchinexgist.blogspot.com",33],["thefreedommatrix.blogspot.com",33],["hentai-vl.blogspot.com",33],["projetomotog.blogspot.com",33],["ktmx.pro",33],["lirik3satu.blogspot.com",33],["marketmovers.it",33],["pharmaguideline.com",33],["safemaru.blogspot.com",33],["mixloads.com",33],["mangaromance.eu",33],["interssh.com",33],["freesoftpdfdownload.blogspot.com",33],["cirokun.blogspot.com",33],["myadslink.com",33],["blackavelic.com",33],["server.satunivers.tv",33],["eg-akw.com",33],["xn--mgba7fjn.cc",33],["flashingjungle.com",34],["ma-x.org",35],["lavozdegalicia.es",35],["xmovies08.org",37],["globaldjmix.com",38],["zazzybabes.com",39],["haaretz.co.il",40],["haaretz.com",40],["slate.com",41],["megalinks.info",42],["megapastes.com",42],["mega-mkv.com",[42,43]],["mkv-pastes.com",42],["zpaste.net",42],["zlpaste.net",42],["9xlinks.site",42],["zona-leros.net",43],["acortarm.xyz",44],["cine.to",[45,200]],["kissasia.cc",45],["digjav.com",46],["videoszoofiliahd.com",47],["xxxtubezoo.com",48],["zooredtube.com",48],["megacams.me",50],["rlslog.net",50],["porndoe.com",51],["acienciasgalilei.com",53],["playrust.io",54],["payskip.org",55],["short-url.link",56],["tubedupe.com",57],["mcrypto.club",58],["fatgirlskinny.net",59],["polska-ie.com",59],["windowsmatters.com",59],["canaltdt.es",60],["masbrooo.com",60],["2ndrun.tv",60],["oncehelp.com",61],["queenfaucet.website",61],["curto.win",61],["smallseotools.com",62],["macwelt.de",64],["pcwelt.de",64],["capital.de",64],["geo.de",64],["allmomsex.com",65],["allnewindianporn.com",65],["analxxxvideo.com",65],["animalextremesex.com",65],["anime3d.xyz",65],["animefuckmovies.com",65],["animepornfilm.com",65],["animesexbar.com",65],["animesexclip.com",65],["animexxxsex.com",65],["animexxxfilms.com",65],["anysex.club",65],["apetube.asia",65],["asianfuckmovies.com",65],["asianfucktube.com",65],["asianporn.sexy",65],["asiansexcilps.com",65],["beeg.fund",65],["beegvideoz.com",65],["bestasiansex.pro",65],["bravotube.asia",65],["brutalanimalsfuck.com",65],["candyteenporn.com",65],["daddyfuckmovies.com",65],["desifuckonline.com",65],["exclusiveasianporn.com",65],["exteenporn.com",65],["fantasticporn.net",65],["fantasticyoungporn.com",65],["fineasiansex.com",65],["firstasianpussy.com",65],["freeindiansextube.com",65],["freepornasians.com",65],["freerealvideo.com",65],["fuck-beeg.com",65],["fuck-xnxx.com",65],["fuckasian.pro",65],["fuckfuq.com",65],["fuckundies.com",65],["gojapaneseporn.com",65],["golderotica.com",65],["goodyoungsex.com",65],["goyoungporn.com",65],["hardxxxmoms.com",65],["hdvintagetube.com",65],["hentaiporn.me",65],["hentaisexfilms.com",65],["hentaisexuality.com",65],["hot-teens-movies.mobi",65],["hotanimepornvideos.com",65],["hotanimevideos.com",65],["hotasianpussysex.com",65],["hotjapaneseshows.com",65],["hotmaturetube.com",65],["hotmilfs.pro",65],["hotorientalporn.com",65],["hotpornyoung.com",65],["hotxxxjapanese.com",65],["hotxxxpussy.com",65],["indiafree.net",65],["indianpornvideo.online",65],["japanpornclip.com",65],["japanesetube.video",65],["japansex.me",65],["japanesexxxporn.com",65],["japansporno.com",65],["japanxxx.asia",65],["japanxxxworld.com",65],["keezmovies.surf",65],["lingeriefuckvideo.com",65],["liveanimalporn.zooo.club",65],["madhentaitube.com",65],["megahentaitube.com",65],["megajapanesesex.com",65],["megajapantube.com",65],["milfxxxpussy.com",65],["momsextube.pro",65],["momxxxass.com",65],["monkeyanimalporn.com",65],["moviexxx.mobi",65],["newanimeporn.com",65],["newjapanesexxx.com",65],["nicematureporn.com",65],["nudeplayboygirls.com",65],["openxxxporn.com",65],["originalindianporn.com",65],["originalteentube.com",65],["pig-fuck.com",65],["plainasianporn.com",65],["popularasianxxx.com",65],["pornanimetube.com",65],["pornasians.pro",65],["pornhat.asia",65],["pornheed.online",65],["pornjapanesesex.com",65],["pornomovies.asia",65],["pornvintage.tv",65],["primeanimesex.com",65],["realjapansex.com",65],["realmomsex.com",65],["redsexhub.com",65],["retroporn.world",65],["retrosexfilms.com",65],["sex-free-movies.com",65],["sexanimesex.com",65],["sexanimetube.com",65],["sexjapantube.com",65],["sexmomvideos.com",65],["sexteenxxxtube.com",65],["sexxxanimal.com",65],["sexyoungtube.com",65],["sexyvintageporn.com",65],["sopornmovies.com",65],["spicyvintageporn.com",65],["sunporno.club",65],["tabooanime.club",65],["teenextrem.com",65],["teenfucksex.com",65],["teenhost.net",65],["teensexass.com",65],["tnaflix.asia",65],["totalfuckmovies.com",65],["totalmaturefuck.com",65],["txxx.asia",65],["voyeurpornsex.com",65],["warmteensex.com",65],["wetasiancreampie.com",65],["wildhentaitube.com",65],["wowyoungsex.com",65],["xhamster-art.com",65],["xmovie.pro",65],["xnudevideos.com",65],["xnxxjapon.com",65],["xpics.me",65],["xvide.me",65],["xxxanimefuck.com",65],["xxxanimevideos.com",65],["xxxanimemovies.com",65],["xxxhentaimovies.com",65],["xxxhothub.com",65],["xxxjapaneseporntube.com",65],["xxxlargeporn.com",65],["xxxmomz.com",65],["xxxpornmilf.com",65],["xxxpussyclips.com",65],["xxxpussysextube.com",65],["xxxretrofuck.com",65],["xxxsex.pro",65],["xxxsexyjapanese.com",65],["xxxteenyporn.com",65],["xxxvideo.asia",65],["xxxvideos.ink",65],["xxxyoungtv.com",65],["youjizzz.club",65],["youngpussyfuck.com",65],["bayimg.com",66],["celeb.gate.cc",67],["masterplayer.xyz",69],["pussy-hub.com",69],["porndex.com",70],["compucalitv.com",71],["diariodenavarra.es",73],["duden.de",75],["pennlive.com",77],["beautypageants.indiatimes.com",78],["01fmovies.com",79],["lnk2.cc",81],["fullhdxxx.com",82],["luscious.net",[82,143]],["classicpornbest.com",82],["xstory-fr.com",82],["1youngteenporn.com",82],["www-daftarharga.blogspot.com",[82,184]],["miraculous.to",[82,190]],["vtube.to",82],["gosexpod.com",83],["otakukan.com",84],["xcafe.com",85],["pornfd.com",85],["venusarchives.com",85],["imagehaha.com",86],["imagenpic.com",86],["imageshimage.com",86],["imagetwist.com",86],["k1nk.co",87],["watchasians.cc",87],["alexsports.xyz",87],["lulustream.com",87],["luluvdo.com",87],["web.de",88],["news18.com",89],["thelanb.com",90],["dropmms.com",90],["softwaredescargas.com",91],["cracking-dz.com",92],["anitube.ninja",93],["gazzetta.it",94],["port.hu",96],["dziennikbaltycki.pl",97],["dzienniklodzki.pl",97],["dziennikpolski24.pl",97],["dziennikzachodni.pl",97],["echodnia.eu",97],["expressbydgoski.pl",97],["expressilustrowany.pl",97],["gazetakrakowska.pl",97],["gazetalubuska.pl",97],["gazetawroclawska.pl",97],["gk24.pl",97],["gloswielkopolski.pl",97],["gol24.pl",97],["gp24.pl",97],["gra.pl",97],["gs24.pl",97],["kurierlubelski.pl",97],["motofakty.pl",97],["naszemiasto.pl",97],["nowiny24.pl",97],["nowosci.com.pl",97],["nto.pl",97],["polskatimes.pl",97],["pomorska.pl",97],["poranny.pl",97],["sportowy24.pl",97],["strefaagro.pl",97],["strefabiznesu.pl",97],["stronakobiet.pl",97],["telemagazyn.pl",97],["to.com.pl",97],["wspolczesna.pl",97],["course9x.com",97],["courseclub.me",97],["azrom.net",97],["alttyab.net",97],["esopress.com",97],["nesiaku.my.id",97],["onemanhua.com",98],["freeindianporn.mobi",98],["dr-farfar.com",99],["boyfriendtv.com",100],["brandstofprijzen.info",101],["netfuck.net",102],["blog24.me",[102,137]],["kisahdunia.com",102],["javsex.to",102],["nulljungle.com",102],["oyuncusoruyor.com",102],["pbarecap.ph",102],["sourds.net",102],["teknobalta.com",102],["tvinternetowa.info",102],["sqlserveregitimleri.com",102],["tutcourse.com",102],["readytechflip.com",102],["novinhastop.com",102],["warddogs.com",102],["dvdgayporn.com",102],["iimanga.com",102],["tinhocdongthap.com",102],["tremamnon.com",102],["423down.com",102],["brizzynovel.com",102],["jugomobile.com",102],["freecodezilla.net",102],["animekhor.xyz",102],["iconmonstr.com",102],["gay-tubes.cc",102],["rbxscripts.net",102],["comentariodetexto.com",102],["wordpredia.com",102],["livsavr.co",102],["allfaucet.xyz",[102,137]],["titbytz.tk",102],["replica-watch.info",102],["alludemycourses.com",102],["kayifamilytv.com",102],["iir.ai",103],["gameofporn.com",105],["qpython.club",106],["antifake-funko.fr",106],["dktechnicalmate.com",106],["recipahi.com",106],["e9china.net",107],["ontools.net",107],["marketbeat.com",108],["hentaipornpics.net",109],["apps2app.com",110],["alliptvlinks.com",111],["waterfall.money",111],["xvideos.com",112],["xvideos2.com",112],["homemoviestube.com",113],["sexseeimage.com",113],["jpopsingles.eu",115],["aipebel.com",115],["azmath.info",115],["downfile.site",115],["downphanmem.com",115],["expertvn.com",115],["memangbau.com",115],["trangchu.news",115],["aztravels.net",115],["ielts-isa.edu.vn",115],["techedubyte.com",[115,248]],["tubereader.me",116],["repretel.com",116],["dagensnytt.com",117],["mrproblogger.com",117],["themezon.net",117],["gfx-station.com",118],["bitzite.com",[118,137,142]],["historyofroyalwomen.com",119],["davescomputertips.com",119],["ukchat.co.uk",120],["hivelr.com",121],["skidrowcodex.net",122],["takimag.com",123],["digi.no",124],["th.gl",125],["scimagojr.com",126],["haxina.com",126],["cryptofenz.xyz",126],["twi-fans.com",127],["learn-cpp.org",128],["soccerinhd.com",129],["terashare.co",130],["pornwex.tv",131],["smithsonianmag.com",132],["homesports.net",133],["cineb.rs",134],["rawkuma.com",[134,181]],["moviesjoyhd.to",134],["upshrink.com",135],["ohionowcast.info",137],["wiour.com",137],["appsbull.com",137],["diudemy.com",137],["maqal360.com",137],["bitcotasks.com",137],["videolyrics.in",137],["manofadan.com",137],["cempakajaya.com",137],["tagecoin.com",137],["doge25.in",137],["king-ptcs.com",137],["naijafav.top",137],["ourcoincash.xyz",137],["sh.techsamir.com",137],["claimcoins.site",137],["cryptosh.pro",137],["coinsrev.com",137],["go.freetrx.fun",137],["eftacrypto.com",137],["fescrypto.com",137],["earnhub.net",137],["kiddyshort.com",137],["tronxminer.com",137],["homeairquality.org",138],["cety.app",[139,140]],["exego.app",139],["cutlink.net",139],["cutsy.net",139],["cutyurls.com",139],["cutty.app",139],["cutnet.net",139],["justin.mp3quack.lol",140],["adcrypto.net",141],["admediaflex.com",141],["aduzz.com",141],["bitcrypto.info",141],["cdrab.com",141],["datacheap.io",141],["hbz.us",141],["savego.org",141],["owsafe.com",141],["sportweb.info",141],["aiimgvlog.fun",143],["6indianporn.com",143],["amateurebonypics.com",143],["amateuryoungpics.com",143],["cinemabg.net",143],["coomer.su",143],["desimmshd.com",143],["frauporno.com",143],["givemeaporn.com",143],["hitomi.la",143],["jav-asia.top",143],["javf.net",143],["javideo.net",143],["kemono.su",143],["kr18plus.com",143],["pilibook.com",143],["pornborne.com",143],["porngrey.com",143],["qqxnxx.com",143],["sexvideos.host",143],["submilf.com",143],["subtaboo.com",143],["tktube.com",143],["xfrenchies.com",143],["moderngyan.com",144],["sattakingcharts.in",144],["freshbhojpuri.com",144],["bgmi32bitapk.in",144],["bankshiksha.in",144],["earn.mpscstudyhub.com",144],["earn.quotesopia.com",144],["money.quotesopia.com",144],["best-mobilegames.com",144],["learn.moderngyan.com",144],["bharatsarkarijobalert.com",144],["coingraph.us",145],["momo-net.com",145],["maxgaming.fi",145],["cybercityhelp.in",146],["travel.vebma.com",147],["cloud.majalahhewan.com",147],["crm.cekresi.me",147],["ai.tempatwisata.pro",147],["pinloker.com",147],["sekilastekno.com",147],["link.paid4link.com",148],["vulture.com",149],["megaplayer.bokracdn.run",150],["hentaistream.com",151],["siteunblocked.info",152],["larvelfaucet.com",153],["feyorra.top",153],["claimtrx.com",153],["moviesyug.net",154],["w4files.ws",154],["parispi.net",155],["paperzonevn.com",156],["dailyvideoreports.net",157],["lewd.ninja",158],["systemnews24.com",159],["incestvidz.com",160],["niusdiario.es",161],["playporngames.com",162],["movi.pk",[163,166]],["cutesexyteengirls.com",165],["0dramacool.net",166],["185.53.88.104",166],["185.53.88.204",166],["185.53.88.15",166],["123movies4k.net",166],["1rowsports.com",166],["4share-mp3.net",166],["9animetv.to",166],["720pstream.me",166],["aagmaal.com",166],["abysscdn.com",166],["ajkalerbarta.com",166],["akstream.xyz",166],["androidapks.biz",166],["androidsite.net",166],["animeonlinefree.org",166],["animesite.net",166],["animespank.com",166],["aniworld.to",166],["apkmody.io",166],["appsfree4u.com",166],["audioz.download",166],["awafim.tv",166],["bdnewszh.com",166],["beastlyprints.com",166],["bengalisite.com",166],["bestfullmoviesinhd.org",166],["betteranime.net",166],["blacktiesports.live",166],["buffsports.stream",166],["ch-play.com",166],["clickforhire.com",166],["cloudy.pk",166],["computercrack.com",166],["coolcast2.com",166],["crackedsoftware.biz",166],["crackfree.org",166],["cracksite.info",166],["cryptoblog24.info",166],["cuatrolatastv.blogspot.com",166],["cydiasources.net",166],["decmelfot.xyz",166],["dirproxy.com",166],["dopebox.to",166],["downloadapk.info",166],["downloadapps.info",166],["downloadgames.info",166],["downloadmusic.info",166],["downloadsite.org",166],["downloadwella.com",166],["ebooksite.org",166],["educationtips213.blogspot.com",166],["egyup.live",166],["elgoles.pro",166],["embed.meomeo.pw",166],["embed.scdn.to",166],["emulatorsite.com",166],["essaysharkwriting.club",166],["exploreera.net",166],["extrafreetv.com",166],["fakedetail.com",166],["fclecteur.com",166],["files.im",166],["flexyhit.com",166],["fmoviefree.net",166],["fmovies24.com",166],["footyhunter3.xyz",166],["freeflix.info",166],["freemoviesu4.com",166],["freeplayervideo.com",166],["freesoccer.net",166],["fseries.org",166],["gamefast.org",166],["gamesite.info",166],["gettapeads.com",166],["gmanga.me",166],["gocast123.me",166],["gogohd.net",166],["gogoplay5.com",166],["gooplay.net",166],["gostreamon.net",166],["happy2hub.org",166],["harimanga.com",166],["healthnewsreel.com",166],["hexupload.net",166],["hinatasoul.com",166],["hindisite.net",166],["holymanga.net",166],["hxfile.co",166],["isosite.org",166],["iv-soft.com",166],["januflix.expert",166],["jewelry.com.my",166],["johnwardflighttraining.com",166],["kabarportal.com",166],["kstorymedia.com",166],["la123movies.org",166],["lespassionsdechinouk.com",166],["lilymanga.net",166],["linksdegrupos.com.br",166],["linkz.wiki",166],["livestreamtv.pk",166],["macsite.info",166],["mangapt.com",166],["mangasite.org",166],["manhuascan.com",166],["megafilmeshdseries.com",166],["megamovies.org",166],["membed.net",166],["moddroid.com",166],["moviefree2.com",166],["movies-watch.com.pk",166],["moviesite.app",166],["moviesonline.fm",166],["moviesx.org",166],["msmoviesbd.com",166],["musicsite.biz",166],["myfernweh.com",166],["myviid.com",166],["nazarickol.com",166],["noob4cast.com",166],["nsw2u.com",[166,257]],["oko.sh",166],["olympicstreams.me",166],["orangeink.pk",166],["owllink.net",166],["pahaplayers.click",166],["patchsite.net",166],["pdfsite.net",166],["play1002.com",166],["player-cdn.com",166],["productkeysite.com",166],["projectfreetv.one",166],["romsite.org",166],["rufiguta.com",166],["rytmp3.io",166],["send.cm",166],["seriesite.net",166],["seriezloaded.com.ng",166],["serijehaha.com",166],["shrugemojis.com",166],["siteapk.net",166],["siteflix.org",166],["sitegames.net",166],["sitekeys.net",166],["sitepdf.com",166],["sitetorrent.com",166],["softwaresite.net",166],["sportbar.live",166],["sportkart1.xyz",166],["ssyoutube.com",166],["stardima.com",166],["stream4free.live",166],["superapk.org",166],["supermovies.org",166],["tainio-mania.online",166],["talaba.su",166],["tamilguns.org",166],["tatabrada.tv",166],["techtrendmakers.com",166],["theflixer.tv",166],["thememypc.net",166],["thetechzone.online",166],["thripy.com",166],["tonnestreamz.xyz",166],["travelplanspro.com",166],["turcasmania.com",166],["tusfiles.com",166],["tvonlinesports.com",166],["ultramovies.org",166],["uploadbank.com",166],["urdubolo.pk",166],["vidspeeds.com",166],["vumoo.to",166],["warezsite.net",166],["watchmovies2.com",166],["watchmoviesforfree.org",166],["watchofree.com",166],["watchsite.net",166],["watchsouthpark.tv",166],["watchtvch.club",166],["web.livecricket.is",166],["webseries.club",166],["worldcupstream.pm",166],["y2mate.com",166],["youapk.net",166],["youtube4kdownloader.com",166],["yts-subs.com",166],["haho.moe",167],["nicy-spicy.pw",168],["novelmultiverse.com",169],["mylegalporno.com",170],["videowood.tv",173],["thecut.com",174],["novelism.jp",175],["alphapolis.co.jp",176],["okrzone.com",177],["game3rb.com",178],["javhub.net",178],["thotvids.com",179],["berklee.edu",180],["imeteo.sk",182],["youtubemp3donusturucu.net",183],["surfsees.com",185],["vivo.st",[186,187]],["alueviesti.fi",189],["kiuruvesilehti.fi",189],["lempaala.ideapark.fi",189],["olutposti.fi",189],["urjalansanomat.fi",189],["tainhanhvn.com",191],["titantv.com",192],["3cinfo.net",193],["transportationlies.org",194],["camarchive.tv",195],["crownimg.com",195],["freejav.guru",195],["hentai2read.com",195],["icyporno.com",195],["illink.net",195],["javtiful.com",195],["m-hentai.net",195],["pornblade.com",195],["pornfelix.com",195],["pornxxxxtube.net",195],["redwap.me",195],["redwap2.com",195],["redwap3.com",195],["sunporno.com",195],["tubxporn.xxx",195],["ver-comics-porno.com",195],["ver-mangas-porno.com",195],["xanimeporn.com",195],["xxxvideohd.net",195],["zetporn.com",195],["cocomanga.com",196],["sampledrive.in",197],["mcleaks.net",198],["explorecams.com",198],["minecraft.buzz",198],["chillx.top",199],["playerx.stream",199],["m.liputan6.com",201],["stardewids.com",[201,224]],["ingles.com",202],["spanishdict.com",202],["surfline.com",203],["rureka.com",204],["bunkr.is",205],["amateur8.com",206],["freeporn8.com",206],["maturetubehere.com",206],["embedo.co",207],["corriere.it",208],["oggi.it",208],["2the.space",209],["file.gocmod.com",210],["apkcombo.com",211],["sponsorhunter.com",212],["soft98.ir",213],["novelssites.com",214],["torrentmac.net",215],["udvl.com",216],["moviezaddiction.icu",217],["dlpanda.com",218],["socialmediagirls.com",219],["ecamrips.com",219],["showcamrips.com",219],["einrichtungsbeispiele.de",220],["weadown.com",221],["molotov.tv",222],["freecoursesonline.me",223],["adelsfun.com",223],["advantien.com",223],["bailbondsfinder.com",223],["bigpiecreative.com",223],["childrenslibrarylady.com",223],["classifarms.com",223],["comtasq.ca",223],["crone.es",223],["ctrmarketingsolutions.com",223],["dropnudes.com",223],["ftuapps.dev",223],["genzsport.com",223],["ghscanner.com",223],["grsprotection.com",223],["gruporafa.com.br",223],["inmatefindcalifornia.com",223],["inmatesearchidaho.com",223],["itsonsitetv.com",223],["mfmfinancials.com",223],["myproplugins.com",223],["onehack.us",223],["ovester.com",223],["paste.bin.sx",223],["privatenudes.com",223],["renoconcrete.ca",223],["richieashbeck.com",223],["sat.technology",223],["short1ink.com",223],["stpm.co.uk",223],["wegotcookies.co",223],["mathcrave.com",223],["commands.gg",224],["smgplaza.com",225],["emturbovid.com",226],["findjav.com",226],["mmtv01.xyz",226],["stbturbo.xyz",226],["streamsilk.com",226],["freepik.com",227],["diyphotography.net",229],["bitchesgirls.com",230],["shopforex.online",231],["programmingeeksclub.com",232],["easymc.io",233],["diendancauduong.com",234],["parentcircle.com",235],["h-game18.xyz",236],["nopay.info",237],["wheelofgold.com",238],["shortlinks.tech",239],["skill4ltu.eu",241],["lifestyle.bg",242],["news.bg",242],["topsport.bg",242],["webcafe.bg",242],["freepikdownloader.com",243],["freepasses.org",244],["iusedtobeaboss.com",245],["androidpolice.com",246],["cbr.com",246],["gamerant.com",246],["howtogeek.com",246],["thegamer.com",246],["blogtruyenmoi.com",247],["igay69.com",249],["graphicget.com",250],["qiwi.gg",251],["sonixgvn.net",252],["netcine2.la",253],["idnes.cz",[254,255]],["cbc.ca",256]]);

const entitiesMap = new Map([["kisscartoon",1],["kissasian",7],["ganool",7],["pirate",7],["piratebay",7],["pirateproxy",7],["proxytpb",7],["thepiratebay",7],["limetorrents",[9,15]],["king-pes",9],["depedlps",9],["komikcast",9],["idedroidsafelink",9],["links-url",9],["ak4eg",9],["streanplay",10],["steanplay",10],["liferayiseasy",[11,12]],["pahe",15],["yts",15],["tube8",15],["topeuropix",15],["moviescounter",15],["torrent9",15],["desiremovies",15],["movs4u",15],["uwatchfree",15],["hydrax",15],["4movierulz",15],["projectfreetv",15],["arabseed",15],["btdb",[15,54]],["world4ufree",15],["streamsport",15],["rojadirectatvhd",15],["userload",15],["adyou",17],["fxporn69",20],["rexporn",24],["movies07",24],["pornocomics",24],["pornomoll",28],["gsurl",29],["freecoursesonline",30],["lordpremium",30],["todovieneok",30],["novablogitalia",30],["anisubindo",30],["btvsports",30],["mimaletadepeliculas",31],["burningseries",32],["dz4soft",33],["yoututosjeff",33],["ebookmed",33],["lanjutkeun",33],["novelasesp",33],["singingdalong",33],["doujindesu",33],["xmovies8",36],["mega-dvdrip",43],["peliculas-dvdrip",43],["desbloqueador",44],["newpelis",[45,52]],["pelix",[45,52]],["allcalidad",[45,195]],["khatrimaza",45],["camwhores",46],["camwhorestv",46],["uproxy",46],["nekopoi",49],["mirrorace",58],["mixdrp",63],["asiansex",65],["japanfuck",65],["japanporn",65],["teensex",65],["vintagetube",65],["xxxmovies",65],["zooqle",68],["hdfull",72],["mangamanga",74],["streameast",76],["thestreameast",76],["vev",80],["vidop",80],["1337x",82],["x1337x",82],["zone-telechargement",82],["megalink",87],["gmx",88],["mega1080p",93],["9hentai",95],["gaypornhdfree",102],["cinemakottaga",102],["privatemoviez",102],["apkmaven",102],["popcornstream",104],["readcomiconline",114],["azsoft",115],["fc-lc",136],["nuvid",140],["pornktube",143],["watchseries",143],["milfnut",145],["pagalmovies",154],["7starhd",154],["jalshamoviez",154],["9xupload",154],["bdupload",154],["desiupload",154],["rdxhd1",154],["moviessources",164],["0gomovie",166],["0gomovies",166],["123moviefree",166],["1kmovies",166],["1madrasdub",166],["1primewire",166],["2embed",166],["2madrasdub",166],["2umovies",166],["4anime",166],["adblockplustape",166],["altadefinizione01",166],["anitube",166],["atomixhq",166],["beinmatch",166],["brmovies",166],["cima4u",166],["clicknupload",166],["cmovies",166],["cricfree",166],["crichd",166],["databasegdriveplayer",166],["dood",166],["f1stream",166],["faselhd",166],["fbstream",166],["file4go",166],["filemoon",166],["filepress",[166,228]],["filmlinks4u",166],["filmpertutti",166],["filmyzilla",166],["fmovies",166],["french-stream",166],["fzlink",166],["gdriveplayer",166],["gofilms4u",166],["gogoanime",166],["gomoviz",166],["hdmoviefair",166],["hdmovies4u",166],["hdmovies50",166],["hdmoviesfair",166],["hh3dhay",166],["hindilinks4u",166],["hotmasti",166],["hurawatch",166],["klmanga",166],["klubsports",166],["libertestreamvf",166],["livetvon",166],["manga1000",166],["manga1001",166],["mangaraw",166],["mangarawjp",166],["mlbstream",166],["motogpstream",166],["movierulz",166],["movies123",166],["movies2watch",166],["moviesden",166],["moviezaddiction",166],["myflixer",166],["nbastream",166],["netcine",166],["nflstream",166],["nhlstream",166],["onlinewatchmoviespk",166],["pctfenix",166],["pctnew",166],["pksmovies",166],["plyjam",166],["plylive",166],["pogolinks",166],["popcorntime",166],["poscitech",166],["prmovies",166],["rugbystreams",166],["shahed4u",166],["sflix",166],["sitesunblocked",166],["solarmovies",166],["sportcast",166],["sportskart",166],["sports-stream",166],["streaming-french",166],["streamers",166],["streamingcommunity",166],["strikeout",166],["t20cup",166],["tennisstreams",166],["torrentdosfilmes",166],["toonanime",166],["tvply",166],["ufcstream",166],["uptomega",166],["uqload",166],["vudeo",166],["vidoo",166],["vipbox",166],["vipboxtv",166],["vipleague",166],["viprow",166],["yesmovies",166],["yomovies",166],["yomovies1",166],["yt2mp3s",166],["kat",166],["katbay",166],["kickass",166],["kickasshydra",166],["kickasskat",166],["kickass2",166],["kickasstorrents",166],["kat2",166],["kattracker",166],["thekat",166],["thekickass",166],["kickassz",166],["kickasstorrents2",166],["topkickass",166],["kickassgo",166],["kkickass",166],["kkat",166],["kickasst",166],["kick4ss",166],["guardaserie",171],["cine-calidad",172],["videovard",188],["gntai",195],["grantorrent",195],["mejortorrent",195],["mejortorrento",195],["mejortorrents",195],["mejortorrents1",195],["mejortorrentt",195],["shineads",197],["bg-gledai",223],["gledaitv",223],["motchill",240]]);

const exceptionsMap = new Map([["mentor.duden.de",[75]],["forum.soft98.ir",[213]]]);

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
    runAt(( ) => {
        proxyApplyFn('EventTarget.prototype.addEventListener', function(target, thisArg, args) {
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
        });
    }, extraArgs.runAt);
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
    const fnStr = fn.toString();
    const toString = (function toString() { return fnStr; }).bind(null);
    if ( fn.prototype && fn.prototype.constructor === fn ) {
        context[prop] = new Proxy(fn, {
            construct: handler,
            get(target, prop, receiver) {
                if ( prop === 'toString' ) { return toString; }
                return Reflect.get(target, prop, receiver);
            },
        });
        return (...args) => Reflect.construct(...args);
    }
    context[prop] = new Proxy(fn, {
        apply: handler,
        get(target, prop, receiver) {
            if ( prop === 'toString' ) { return toString; }
            return Reflect.get(target, prop, receiver);
        },
    });
    return (...args) => Reflect.apply(...args);
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
