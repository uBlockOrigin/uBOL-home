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

const argsList = [["load","Object"],["mousedown","clientX"],["load","hard_block"],["/contextmenu|keydown/"],["","adb"],["click","ClickHandler"],["load","IsAdblockRequest"],["/^(?:click|mousedown)$/","_0x"],["error"],["load","onload"],["","BACK"],["load","getComputedStyle"],["load","adsense"],["load","(!o)"],["load","(!i)"],["","_0x"],["","Adblock"],["/^(?:click|mousedown)$/","bypassEventsInProxies"],["","window.open"],["","open"],["click","exopop"],["/^(?:load|click)$/","popMagic"],["mousedown","popundrInit"],["getexoloader"],["","pop"],["load","exoJsPop101"],["/^loadex/"],["","/exo"],["","_blank"],["mousedown","preventDefault"],["load","nextFunction"],["load","advertising"],["click","preventDefault"],["load","2000"],["/^(click|mousedown|mousemove|touchstart|touchend|touchmove)/","system.popunder"],["load","adb"],["/^(?:click|mousedown|mousemove|touchstart|touchend|touchmove)$/","system.popunder"],["","'0x"],["/DOMContentLoaded|load/","y.readyState"],["/error|canplay/","(t)"],["load","hblocked"],["error","Adblocker"],["DOMContentLoaded","adlinkfly"],["DOMContentLoaded","shortener"],["mousedown","trigger"],["","0x"],["","Pop"],["/^(?:click|mousedown)$/","popunder"],["DOMContentLoaded","preventExit"],["","adsense"],["load"],["click","pop_under"],["load","url"],["load","adverts-top-container"],["","Date"],["DOMContentLoaded","&nbsp"],["click","read_cookie"],["","midRoll"],["click","_0x"],["load","isBlanketFound"],["load","showModal"],["click","trigger"],["mouseout","clientWidth"],["load","download-wrapper"],["load","autoRecov"],["popstate","noPop"],["/^(?:click|mousedown)$/","ppu"],["click","native code"],["/^(?:mousedown|mouseup)$/","0x"],["click","popundr"],["click"],["DOMContentLoaded","compupaste"],["mousedown","!!{});"],["DOMContentLoaded","/adblock/i"],["keydown"],["DOMContentLoaded","isMobile"],["/^/","0x"],["load","PrivateMode"],["scroll","_0x"],["DOMContentLoaded","checkVPN"],["/^(?:click|mousedown|mouseup)$/","di()"],["","\\"],["popstate"],["click","my_inter_listen"],["load","appendChild"],["","bi()"],["","checkTarget"],["click","popunder"],["timeupdate"],["scroll","getElementById"],["load","undefined"],["DOMContentLoaded","scriptwz_url"],["load","0x"],["DOMContentLoaded","btoa"],["adblockActivated"],["click","saveLastEvent"],["DOMContentLoaded","offsetHeight"],["","show"],["/.?/","popMagic"],["","ads"],["click","interstitial"],["load","antiblock"],["DOMContentLoaded","adsBlocked"],["load",".appendChild"],["","btoa"],["","exopop"],["DOMContentLoaded","AdBlock"],["load","blocker"],["mouseleave","NativeDisplayAdID"],["mouseover","event.triggered"],["load","removeChild"],["load","ads"],["click","ShouldShow"],["click","clickCount"],["mousedown","localStorage"],["DOMContentLoaded","document.documentElement.lang.toLowerCase"],["/adblock/i"],["load","doTest"],["DOMContentLoaded","antiAdBlockerHandler"],["DOMContentLoaded","daadb_get_data_fetch"],["click","splashPage"],["load","detect-modal"],["DOMContentLoaded","canRedirect"],["DOMContentLoaded","adb"],["error","/\\{[a-z]\\(e\\)\\}/"],["load",".call(this"],["load","adblock"],["/touchmove|wheel/","preventDefault()"],["load","showcfkModal"],["DOMContentLoaded","/adb|fetch/i"],["click","attached","elements","div[class=\"share-embed-container\"]"],["click","fp-screen"],["DOMContentLoaded","leaderboardAd"],["DOMContentLoaded","fetch"],["mousedown","shown_at"],["click","openPopupForChapter"],["DOMContentLoaded","iframe"],["","/_blank/i"],["blur","stopCountdown"],["load","htmls"],["blur","focusOut"],["click","/handleClick|popup/"],["click","open"],["load","bypass"],["DOMContentLoaded","location.href"],["","popMagic"],["click","Popunder"],["contextmenu"],["submit","validateForm"],["blur","counter"],["click","maxclick"],["/^(?:click|mousedown)$/","latest!=="],["DOMContentLoaded",".ready"],["load","script"],["","/pop|wm|forceClick/"],["load","block"],["","/_0x|localStorage\\.getItem/"],["DOMContentLoaded","adblock"],["visibilitychange"],["load","/showModal|isBlanketFound/"],["click","shouldShow"],["","/ads|Modal/"],["DOMContentLoaded","init"],["load","Adblock"],["DOMContentLoaded","window.open"],["","vads"],["devtoolschange"],["beforeunload"],["","break;case $."],["mouseup","decodeURIComponent"],["/(?:click|touchend)/","_0x"],["","removeChild"],["click","pu_count"],["","/pop|_blank/"],["click","allclick_Public"],["","dtnoppu"],["/touchstart|mousedown|click/","latest"],["blur","native code"],["blur","event.simulate"],["click","_blank"],["DOMContentLoaded","0x"],["click","overlay"],["scroll","undefined"],["readystatechange","document.removeEventListener"],["scroll","detect"],["click","t(a)"],["","focus"],["DOMContentLoaded","deblocker"],["","preventDefault"],["click","tabunder"],["mouseup","catch"],["scroll","innerHeight"],["hashchange"],["load","/nextFunction|2000/"],["load","player"],["","document.oncontextmenu"],["","about:blank"],["click","popMagic"],["","shouldShow"],["load","popMagic"],["DOMContentLoaded","adsSrc"],["np.detect"],["click","Popup"],["","/open.*_blank/"],["scroll"],["","isBlocking"],["timeupdate","","elements",".quiver-cam-player--ad-not-running.quiver-cam-player--free video"],["","$"],["","exoJsPop101"],["/click|mousedown/","catch"],["","init"],["adb"],["scroll","modal"],["blur"],["DOMContentLoaded","clientHeight"],["click","window.focus"],["click","[native code]"],["click","event.dispatch"],["","Math"],["DOMContentLoaded","popupurls"],["","tabUnder"],["click","window.open"],["load","XMLHttpRequest"],["load","puURLstrpcht"],["load","AdBlocker"],["","showModal"],["","goog"],["load","abDetectorPro"],["","document.body"],["","modal"],["click","pop"],["click","adobeModalTestABenabled"],["blur","console.log"],["","AdB"],["load","adSession"],["load","Ads"],["DOMContentLoaded","googlesyndication"],["np.evtdetect"],["load","popunder"],["DOMContentLoaded",".clientHeight"],["scroll","function(e)"],["DOMContentLoaded","adlinkfly_url"],["mousedown"],["load","document.getElementById"],["mousedown","tabUnder"],["click","popactive"],["load","adsbygoogle"],["DOMContentLoaded","location.replace"],["load","modal_blocker"],["click","isOpened"],["mousedown","pop.doEvent"],["error","blocker"],["click","alink"],["load","[native code]"],["","daadb"],["load","google-analytics"],["","sessionStorage"],["click","form.submit"],["DOMContentLoaded","overlays"],["load","fetch"],["click","pingUrl"],["mousedown","scoreUrl"],["click","/event_callback=function\\(\\){window\\.location=t\\.getAttribute\\(\"href\"\\)/"],["DOMContentLoaded","/^_.+\\+'\\);'\\)\\( ?\\);\\}catch/"],["","Adb"]];

const hostnamesMap = new Map([["newser.com",0],["sport1.de",2],["userscloud.com",3],["timesofindia.indiatimes.com",4],["drrtyr.mx",4],["pinoyalbums.com",4],["multiplayer.it",4],["mediafire.com",[5,6]],["pinsystem.co.uk",7],["fembed.com",7],["ancensored.com",7],["mp3fiber.com",[7,30]],["xrivonet.info",7],["afreesms.com",8],["tu.no",8],["tio.ch",8],["lavanguardia.com",8],["eplayer.click",8],["kingofdown.com",9],["radiotormentamx.com",9],["quelleestladifference.fr",9],["otakuworldsite.blogspot.com",9],["ad-itech.blogspot.com",9],["sna3talaflam.com",9],["agar.pro",9],["unlockapk.com",9],["mobdi3ips.com",9],["socks24.org",9],["interviewgig.com",9],["javaguides.net",9],["almohtarif-tech.net",9],["forum.release-apk.com",9],["devoloperxda.blogspot.com",9],["zwergenstadt.com",9],["primedeportes.es",9],["9goals.live",9],["upxin.net",9],["ciudadblogger.com",9],["ke-1.com",9],["secretsdeepweb.blogspot.com",9],["bit-shares.com",9],["itdmusics.com",9],["aspdotnet-suresh.com",9],["tudo-para-android.com",9],["urdulibrarypk.blogspot.com",9],["zerotopay.com",9],["akw.to",9],["mawsueaa.com",9],["hesgoal-live.io",9],["king-shoot.io",9],["bibme.org",13],["citationmachine.net",13],["easybib.com",14],["vermangasporno.com",15],["imgtorrnt.in",15],["picbaron.com",[15,145]],["letmejerk.com",15],["letmejerk2.com",15],["letmejerk3.com",15],["letmejerk4.com",15],["letmejerk5.com",15],["letmejerk6.com",15],["letmejerk7.com",15],["dlapk4all.com",15],["kropic.com",15],["kvador.com",15],["pdfindir.net",15],["brstej.com",15],["topwwnews.com",15],["xsanime.com",15],["vidlo.us",15],["put-locker.com",15],["youx.xxx",15],["animeindo.asia",15],["masahub.net",15],["adclickersbot.com",15],["badtaste.it",16],["shemalez.com",18],["tubepornclassic.com",18],["gotporn.com",19],["freepornrocks.com",19],["tvhai.org",19],["realgfporn.com",[20,21]],["thisvid.com",21],["xvideos-downloader.net",21],["imgspice.com",22],["vikiporn.com",23],["tnaflix.com",23],["hentai2w.com",[23,197]],["yourlust.com",23],["hotpornfile.org",23],["watchfreexxx.net",23],["vintageporntubes.com",23],["angelgals.com",23],["babesexy.com",23],["porndaa.com",23],["ganstamovies.com",23],["youngleak.com",23],["porndollz.com",23],["xnxxvideo.pro",23],["xvideosxporn.com",23],["filmpornofrancais.fr",23],["pictoa.com",[23,45]],["tubator.com",23],["adultasianporn.com",23],["nsfwmonster.com",23],["girlsofdesire.org",23],["gaytail.com",23],["fetish-bb.com",23],["rumporn.com",23],["soyoungteens.com",23],["zubby.com",23],["lesbian8.com",23],["gayforfans.com",23],["reifporn.de",23],["javtsunami.com",23],["18tube.sex",23],["xxxextreme.org",23],["amateurs-fuck.com",23],["sex-amateur-clips.com",23],["hentaiworld.tv",23],["dads-banging-teens.com",23],["home-xxx-videos.com",23],["mature-chicks.com",23],["teens-fucking-matures.com",23],["hqbang.com",23],["darknessporn.com",23],["familyporner.com",23],["freepublicporn.com",23],["pisshamster.com",23],["punishworld.com",23],["xanimu.com",23],["pornhd.com",24],["cnnamador.com",[24,34]],["cle0desktop.blogspot.com",24],["turkanime.co",24],["camclips.tv",[24,46]],["blackpornhq.com",24],["xsexpics.com",24],["ulsex.net",24],["wannafreeporn.com",24],["ytube2dl.com",24],["multiup.us",24],["protege-torrent.com",24],["pussyspace.com",[25,26]],["pussyspace.net",[25,26]],["empflix.com",27],["cpmlink.net",28],["bdsmstreak.com",28],["cutpaid.com",28],["pornforrelax.com",28],["fatwhitebutt.com",28],["mavplay.xyz",28],["short.pe",29],["totaldebrid.org",30],["neko-miku.com",30],["elsfile.org",30],["venstrike.jimdofree.com",30],["schrauben-normen.de",30],["avengerinator.blogspot.com",30],["link-to.net",30],["hanimesubth.com",30],["gsmturkey.net",30],["adshrink.it",30],["presentation-ppt.com",30],["mangacanblog.com",30],["pekalongan-cits.blogspot.com",30],["4tymode.win",30],["eurotruck2.com.br",30],["tiroalpaloes.com",30],["linkvertise.com",30],["reifenrechner.at",30],["tire-size-calculator.info",30],["linuxsecurity.com",30],["encodinghub.com",30],["itsguider.com",30],["cotravinh.blogspot.com",30],["itudong.com",30],["shortx.net",30],["lecturel.com",30],["bakai.org",30],["nar.k-ba.net",30],["tiroalpalo.org",30],["bs.to",32],["efukt.com",32],["generacionretro.net",33],["nuevos-mu.ucoz.com",33],["micloudfiles.com",33],["mimaletamusical.blogspot.com",33],["visionias.net",33],["b3infoarena.in",33],["lurdchinexgist.blogspot.com",33],["thefreedommatrix.blogspot.com",33],["hentai-vl.blogspot.com",33],["projetomotog.blogspot.com",33],["ktmx.pro",33],["lirik3satu.blogspot.com",33],["marketmovers.it",33],["pharmaguideline.com",33],["safemaru.blogspot.com",33],["mixloads.com",33],["mangaromance.eu",33],["interssh.com",33],["freesoftpdfdownload.blogspot.com",33],["cirokun.blogspot.com",33],["myadslink.com",33],["blackavelic.com",33],["server.satunivers.tv",33],["eg-akw.com",33],["xn--mgba7fjn.cc",33],["flashingjungle.com",34],["ma-x.org",35],["lavozdegalicia.es",35],["xmovies08.org",37],["globaldjmix.com",38],["zazzybabes.com",39],["haaretz.co.il",40],["haaretz.com",40],["slate.com",41],["megalinks.info",42],["megapastes.com",42],["mega-mkv.com",[42,43]],["mkv-pastes.com",42],["zpaste.net",42],["zlpaste.net",42],["9xlinks.site",42],["zona-leros.net",43],["acortarm.xyz",44],["cine.to",[45,203]],["kissasia.cc",45],["digjav.com",46],["videoszoofiliahd.com",47],["xxxtubezoo.com",48],["zooredtube.com",48],["megacams.me",50],["rlslog.net",50],["porndoe.com",51],["acienciasgalilei.com",53],["playrust.io",54],["payskip.org",55],["short-url.link",56],["tubedupe.com",57],["mcrypto.club",58],["fatgirlskinny.net",59],["polska-ie.com",59],["windowsmatters.com",59],["canaltdt.es",60],["masbrooo.com",60],["2ndrun.tv",60],["oncehelp.com",61],["queenfaucet.website",61],["curto.win",61],["smallseotools.com",62],["macwelt.de",64],["pcwelt.de",64],["capital.de",64],["geo.de",64],["allmomsex.com",65],["allnewindianporn.com",65],["analxxxvideo.com",65],["animalextremesex.com",65],["anime3d.xyz",65],["animefuckmovies.com",65],["animepornfilm.com",65],["animesexbar.com",65],["animesexclip.com",65],["animexxxsex.com",65],["animexxxfilms.com",65],["anysex.club",65],["apetube.asia",65],["asianfuckmovies.com",65],["asianfucktube.com",65],["asianporn.sexy",65],["asiansexcilps.com",65],["beeg.fund",65],["beegvideoz.com",65],["bestasiansex.pro",65],["bravotube.asia",65],["brutalanimalsfuck.com",65],["candyteenporn.com",65],["daddyfuckmovies.com",65],["desifuckonline.com",65],["exclusiveasianporn.com",65],["exteenporn.com",65],["fantasticporn.net",65],["fantasticyoungporn.com",65],["fineasiansex.com",65],["firstasianpussy.com",65],["freeindiansextube.com",65],["freepornasians.com",65],["freerealvideo.com",65],["fuck-beeg.com",65],["fuck-xnxx.com",65],["fuckasian.pro",65],["fuckfuq.com",65],["fuckundies.com",65],["gojapaneseporn.com",65],["golderotica.com",65],["goodyoungsex.com",65],["goyoungporn.com",65],["hardxxxmoms.com",65],["hdvintagetube.com",65],["hentaiporn.me",65],["hentaisexfilms.com",65],["hentaisexuality.com",65],["hot-teens-movies.mobi",65],["hotanimepornvideos.com",65],["hotanimevideos.com",65],["hotasianpussysex.com",65],["hotjapaneseshows.com",65],["hotmaturetube.com",65],["hotmilfs.pro",65],["hotorientalporn.com",65],["hotpornyoung.com",65],["hotxxxjapanese.com",65],["hotxxxpussy.com",65],["indiafree.net",65],["indianpornvideo.online",65],["japanpornclip.com",65],["japanesetube.video",65],["japansex.me",65],["japanesexxxporn.com",65],["japansporno.com",65],["japanxxx.asia",65],["japanxxxworld.com",65],["keezmovies.surf",65],["lingeriefuckvideo.com",65],["liveanimalporn.zooo.club",65],["madhentaitube.com",65],["megahentaitube.com",65],["megajapanesesex.com",65],["megajapantube.com",65],["milfxxxpussy.com",65],["momsextube.pro",65],["momxxxass.com",65],["monkeyanimalporn.com",65],["moviexxx.mobi",65],["newanimeporn.com",65],["newjapanesexxx.com",65],["nicematureporn.com",65],["nudeplayboygirls.com",65],["openxxxporn.com",65],["originalindianporn.com",65],["originalteentube.com",65],["pig-fuck.com",65],["plainasianporn.com",65],["popularasianxxx.com",65],["pornanimetube.com",65],["pornasians.pro",65],["pornhat.asia",65],["pornheed.online",65],["pornjapanesesex.com",65],["pornomovies.asia",65],["pornvintage.tv",65],["primeanimesex.com",65],["realjapansex.com",65],["realmomsex.com",65],["redsexhub.com",65],["retroporn.world",65],["retrosexfilms.com",65],["sex-free-movies.com",65],["sexanimesex.com",65],["sexanimetube.com",65],["sexjapantube.com",65],["sexmomvideos.com",65],["sexteenxxxtube.com",65],["sexxxanimal.com",65],["sexyoungtube.com",65],["sexyvintageporn.com",65],["sopornmovies.com",65],["spicyvintageporn.com",65],["sunporno.club",65],["tabooanime.club",65],["teenextrem.com",65],["teenfucksex.com",65],["teenhost.net",65],["teensexass.com",65],["tnaflix.asia",65],["totalfuckmovies.com",65],["totalmaturefuck.com",65],["txxx.asia",65],["voyeurpornsex.com",65],["warmteensex.com",65],["wetasiancreampie.com",65],["wildhentaitube.com",65],["wowyoungsex.com",65],["xhamster-art.com",65],["xmovie.pro",65],["xnudevideos.com",65],["xnxxjapon.com",65],["xpics.me",65],["xvide.me",65],["xxxanimefuck.com",65],["xxxanimevideos.com",65],["xxxanimemovies.com",65],["xxxhentaimovies.com",65],["xxxhothub.com",65],["xxxjapaneseporntube.com",65],["xxxlargeporn.com",65],["xxxmomz.com",65],["xxxpornmilf.com",65],["xxxpussyclips.com",65],["xxxpussysextube.com",65],["xxxretrofuck.com",65],["xxxsex.pro",65],["xxxsexyjapanese.com",65],["xxxteenyporn.com",65],["xxxvideo.asia",65],["xxxvideos.ink",65],["xxxyoungtv.com",65],["youjizzz.club",65],["youngpussyfuck.com",65],["bayimg.com",66],["celeb.gate.cc",67],["masterplayer.xyz",69],["pussy-hub.com",69],["porndex.com",70],["compucalitv.com",71],["diariodenavarra.es",73],["duden.de",75],["pennlive.com",77],["beautypageants.indiatimes.com",78],["01fmovies.com",79],["lnk2.cc",81],["fullhdxxx.com",82],["luscious.net",[82,145]],["classicpornbest.com",82],["xstory-fr.com",82],["1youngteenporn.com",82],["www-daftarharga.blogspot.com",[82,186]],["miraculous.to",[82,192]],["vtube.to",82],["gosexpod.com",83],["otakukan.com",84],["xcafe.com",85],["pornfd.com",85],["venusarchives.com",85],["imagehaha.com",86],["imagenpic.com",86],["imageshimage.com",86],["imagetwist.com",86],["k1nk.co",87],["watchasians.cc",87],["alexsports.xyz",87],["lulustream.com",87],["luluvdo.com",87],["web.de",88],["news18.com",89],["thelanb.com",90],["dropmms.com",90],["softwaredescargas.com",91],["cracking-dz.com",92],["anitube.ninja",93],["gazzetta.it",94],["port.hu",96],["dziennikbaltycki.pl",97],["dzienniklodzki.pl",97],["dziennikpolski24.pl",97],["dziennikzachodni.pl",97],["echodnia.eu",97],["expressbydgoski.pl",97],["expressilustrowany.pl",97],["gazetakrakowska.pl",97],["gazetalubuska.pl",97],["gazetawroclawska.pl",97],["gk24.pl",97],["gloswielkopolski.pl",97],["gol24.pl",97],["gp24.pl",97],["gra.pl",97],["gs24.pl",97],["kurierlubelski.pl",97],["motofakty.pl",97],["naszemiasto.pl",97],["nowiny24.pl",97],["nowosci.com.pl",97],["nto.pl",97],["polskatimes.pl",97],["pomorska.pl",97],["poranny.pl",97],["sportowy24.pl",97],["strefaagro.pl",97],["strefabiznesu.pl",97],["stronakobiet.pl",97],["telemagazyn.pl",97],["to.com.pl",97],["wspolczesna.pl",97],["course9x.com",97],["courseclub.me",97],["azrom.net",97],["alttyab.net",97],["esopress.com",97],["nesiaku.my.id",97],["onemanhua.com",98],["freeindianporn.mobi",98],["dr-farfar.com",99],["boyfriendtv.com",100],["brandstofprijzen.info",101],["netfuck.net",102],["blog24.me",[102,139]],["kisahdunia.com",102],["javsex.to",102],["nulljungle.com",102],["oyuncusoruyor.com",102],["pbarecap.ph",102],["sourds.net",102],["teknobalta.com",102],["tvinternetowa.info",102],["sqlserveregitimleri.com",102],["tutcourse.com",102],["readytechflip.com",102],["novinhastop.com",102],["warddogs.com",102],["dvdgayporn.com",102],["iimanga.com",102],["tinhocdongthap.com",102],["tremamnon.com",102],["423down.com",102],["brizzynovel.com",102],["jugomobile.com",102],["freecodezilla.net",102],["animekhor.xyz",102],["iconmonstr.com",102],["gay-tubes.cc",102],["rbxscripts.net",102],["comentariodetexto.com",102],["wordpredia.com",102],["livsavr.co",102],["allfaucet.xyz",[102,139]],["titbytz.tk",102],["replica-watch.info",102],["alludemycourses.com",102],["kayifamilytv.com",102],["iir.ai",103],["gameofporn.com",105],["qpython.club",106],["antifake-funko.fr",106],["dktechnicalmate.com",106],["recipahi.com",106],["e9china.net",107],["ontools.net",107],["marketbeat.com",108],["hentaipornpics.net",109],["apps2app.com",110],["alliptvlinks.com",111],["waterfall.money",111],["xvideos.com",112],["xvideos2.com",112],["homemoviestube.com",113],["sexseeimage.com",113],["jpopsingles.eu",115],["aipebel.com",115],["azmath.info",115],["downfile.site",115],["downphanmem.com",115],["expertvn.com",115],["memangbau.com",115],["trangchu.news",115],["aztravels.net",115],["ielts-isa.edu.vn",115],["techedubyte.com",[115,253]],["tubereader.me",116],["repretel.com",116],["dagensnytt.com",117],["mrproblogger.com",117],["themezon.net",117],["gfx-station.com",118],["bitzite.com",[118,139,144]],["historyofroyalwomen.com",119],["davescomputertips.com",119],["ukchat.co.uk",120],["hivelr.com",121],["skidrowcodex.net",122],["takimag.com",123],["digi.no",124],["th.gl",125],["scimagojr.com",126],["haxina.com",126],["cryptofenz.xyz",126],["twi-fans.com",127],["learn-cpp.org",128],["soccerinhd.com",129],["terashare.co",130],["pornwex.tv",131],["smithsonianmag.com",132],["homesports.net",133],["cineb.rs",134],["rawkuma.com",[134,183]],["moviesjoyhd.to",134],["realmoasis.com",135],["upshrink.com",136],["fitdynamos.com",138],["ohionowcast.info",139],["wiour.com",139],["appsbull.com",139],["diudemy.com",139],["maqal360.com",139],["bitcotasks.com",139],["videolyrics.in",139],["manofadan.com",139],["cempakajaya.com",139],["tagecoin.com",139],["doge25.in",139],["king-ptcs.com",139],["naijafav.top",139],["ourcoincash.xyz",139],["sh.techsamir.com",139],["claimcoins.site",139],["cryptosh.pro",139],["coinsrev.com",139],["go.freetrx.fun",139],["eftacrypto.com",139],["fescrypto.com",139],["earnhub.net",139],["kiddyshort.com",139],["tronxminer.com",139],["homeairquality.org",140],["cety.app",[141,142]],["exego.app",141],["cutlink.net",141],["cutsy.net",141],["cutyurls.com",141],["cutty.app",141],["cutnet.net",141],["justin.mp3quack.lol",142],["adcrypto.net",143],["admediaflex.com",143],["aduzz.com",143],["bitcrypto.info",143],["cdrab.com",143],["datacheap.io",143],["hbz.us",143],["savego.org",143],["owsafe.com",143],["sportweb.info",143],["aiimgvlog.fun",145],["6indianporn.com",145],["amateurebonypics.com",145],["amateuryoungpics.com",145],["cinemabg.net",145],["coomer.su",145],["desimmshd.com",145],["frauporno.com",145],["givemeaporn.com",145],["hitomi.la",145],["jav-asia.top",145],["javf.net",145],["javideo.net",145],["kemono.su",145],["kr18plus.com",145],["pilibook.com",145],["pornborne.com",145],["porngrey.com",145],["qqxnxx.com",145],["sexvideos.host",145],["submilf.com",145],["subtaboo.com",145],["tktube.com",145],["xfrenchies.com",145],["moderngyan.com",146],["sattakingcharts.in",146],["freshbhojpuri.com",146],["bgmi32bitapk.in",146],["bankshiksha.in",146],["earn.mpscstudyhub.com",146],["earn.quotesopia.com",146],["money.quotesopia.com",146],["best-mobilegames.com",146],["learn.moderngyan.com",146],["bharatsarkarijobalert.com",146],["coingraph.us",147],["momo-net.com",147],["maxgaming.fi",147],["cybercityhelp.in",148],["travel.vebma.com",149],["cloud.majalahhewan.com",149],["crm.cekresi.me",149],["ai.tempatwisata.pro",149],["pinloker.com",149],["sekilastekno.com",149],["link.paid4link.com",150],["vulture.com",151],["megaplayer.bokracdn.run",152],["hentaistream.com",153],["siteunblocked.info",154],["larvelfaucet.com",155],["feyorra.top",155],["claimtrx.com",155],["moviesyug.net",156],["w4files.ws",156],["parispi.net",157],["paperzonevn.com",158],["dailyvideoreports.net",159],["lewd.ninja",160],["systemnews24.com",161],["incestvidz.com",162],["niusdiario.es",163],["playporngames.com",164],["movi.pk",[165,168]],["cutesexyteengirls.com",167],["0dramacool.net",168],["185.53.88.104",168],["185.53.88.204",168],["185.53.88.15",168],["123movies4k.net",168],["1rowsports.com",168],["4share-mp3.net",168],["9animetv.to",168],["720pstream.me",168],["aagmaal.com",168],["abysscdn.com",168],["ajkalerbarta.com",168],["akstream.xyz",168],["androidapks.biz",168],["androidsite.net",168],["animeonlinefree.org",168],["animesite.net",168],["animespank.com",168],["aniworld.to",168],["apkmody.io",168],["appsfree4u.com",168],["audioz.download",168],["awafim.tv",168],["bdnewszh.com",168],["beastlyprints.com",168],["bengalisite.com",168],["bestfullmoviesinhd.org",168],["betteranime.net",168],["blacktiesports.live",168],["buffsports.stream",168],["ch-play.com",168],["clickforhire.com",168],["cloudy.pk",168],["computercrack.com",168],["coolcast2.com",168],["crackedsoftware.biz",168],["crackfree.org",168],["cracksite.info",168],["cryptoblog24.info",168],["cuatrolatastv.blogspot.com",168],["cydiasources.net",168],["decmelfot.xyz",168],["dirproxy.com",168],["dopebox.to",168],["downloadapk.info",168],["downloadapps.info",168],["downloadgames.info",168],["downloadmusic.info",168],["downloadsite.org",168],["downloadwella.com",168],["ebooksite.org",168],["educationtips213.blogspot.com",168],["egyup.live",168],["elgoles.pro",168],["embed.meomeo.pw",168],["embed.scdn.to",168],["emulatorsite.com",168],["essaysharkwriting.club",168],["exploreera.net",168],["extrafreetv.com",168],["fakedetail.com",168],["fclecteur.com",168],["files.im",168],["flexyhit.com",168],["fmoviefree.net",168],["fmovies24.com",168],["footyhunter3.xyz",168],["freeflix.info",168],["freemoviesu4.com",168],["freeplayervideo.com",168],["freesoccer.net",168],["fseries.org",168],["gamefast.org",168],["gamesite.info",168],["gettapeads.com",168],["gmanga.me",168],["gocast123.me",168],["gogohd.net",168],["gogoplay5.com",168],["gooplay.net",168],["gostreamon.net",168],["happy2hub.org",168],["harimanga.com",168],["healthnewsreel.com",168],["hexupload.net",168],["hinatasoul.com",168],["hindisite.net",168],["holymanga.net",168],["hxfile.co",168],["isosite.org",168],["iv-soft.com",168],["januflix.expert",168],["jewelry.com.my",168],["johnwardflighttraining.com",168],["kabarportal.com",168],["kstorymedia.com",168],["la123movies.org",168],["lespassionsdechinouk.com",168],["lilymanga.net",168],["linksdegrupos.com.br",168],["linkz.wiki",168],["livestreamtv.pk",168],["macsite.info",168],["mangapt.com",168],["mangasite.org",168],["manhuascan.com",168],["megafilmeshdseries.com",168],["megamovies.org",168],["membed.net",168],["moddroid.com",168],["moviefree2.com",168],["movies-watch.com.pk",168],["moviesite.app",168],["moviesonline.fm",168],["moviesx.org",168],["msmoviesbd.com",168],["musicsite.biz",168],["myfernweh.com",168],["myviid.com",168],["nazarickol.com",168],["noob4cast.com",168],["nsw2u.com",[168,264]],["oko.sh",168],["olympicstreams.me",168],["orangeink.pk",168],["owllink.net",168],["pahaplayers.click",168],["patchsite.net",168],["pdfsite.net",168],["play1002.com",168],["player-cdn.com",168],["productkeysite.com",168],["projectfreetv.one",168],["romsite.org",168],["rufiguta.com",168],["rytmp3.io",168],["send.cm",168],["seriesite.net",168],["seriezloaded.com.ng",168],["serijehaha.com",168],["shrugemojis.com",168],["siteapk.net",168],["siteflix.org",168],["sitegames.net",168],["sitekeys.net",168],["sitepdf.com",168],["sitetorrent.com",168],["softwaresite.net",168],["sportbar.live",168],["sportkart1.xyz",168],["ssyoutube.com",168],["stardima.com",168],["stream4free.live",168],["superapk.org",168],["supermovies.org",168],["tainio-mania.online",168],["talaba.su",168],["tamilguns.org",168],["tatabrada.tv",168],["techtrendmakers.com",168],["theflixer.tv",168],["thememypc.net",168],["thetechzone.online",168],["thripy.com",168],["tonnestreamz.xyz",168],["travelplanspro.com",168],["turcasmania.com",168],["tusfiles.com",168],["tvonlinesports.com",168],["ultramovies.org",168],["uploadbank.com",168],["urdubolo.pk",168],["vidspeeds.com",168],["vumoo.to",168],["warezsite.net",168],["watchmovies2.com",168],["watchmoviesforfree.org",168],["watchofree.com",168],["watchsite.net",168],["watchsouthpark.tv",168],["watchtvch.club",168],["web.livecricket.is",168],["webseries.club",168],["worldcupstream.pm",168],["y2mate.com",168],["youapk.net",168],["youtube4kdownloader.com",168],["yts-subs.com",168],["haho.moe",169],["nicy-spicy.pw",170],["novelmultiverse.com",171],["mylegalporno.com",172],["videowood.tv",175],["thecut.com",176],["novelism.jp",177],["alphapolis.co.jp",178],["okrzone.com",179],["game3rb.com",180],["javhub.net",180],["thotvids.com",181],["berklee.edu",182],["imeteo.sk",184],["youtubemp3donusturucu.net",185],["surfsees.com",187],["vivo.st",[188,189]],["alueviesti.fi",191],["kiuruvesilehti.fi",191],["lempaala.ideapark.fi",191],["olutposti.fi",191],["urjalansanomat.fi",191],["tainhanhvn.com",193],["titantv.com",194],["3cinfo.net",195],["transportationlies.org",196],["camarchive.tv",197],["crownimg.com",197],["freejav.guru",197],["hentai2read.com",197],["icyporno.com",197],["illink.net",197],["javtiful.com",197],["m-hentai.net",197],["pornblade.com",197],["pornfelix.com",197],["pornxxxxtube.net",197],["redwap.me",197],["redwap2.com",197],["redwap3.com",197],["sunporno.com",197],["tubxporn.xxx",197],["ver-comics-porno.com",197],["ver-mangas-porno.com",197],["xanimeporn.com",197],["xxxvideohd.net",197],["zetporn.com",197],["simpcity.su",198],["cocomanga.com",199],["sampledrive.in",200],["sportnews.to",200],["mcleaks.net",201],["explorecams.com",201],["minecraft.buzz",201],["chillx.top",202],["playerx.stream",202],["m.liputan6.com",204],["stardewids.com",[204,228]],["ingles.com",205],["spanishdict.com",205],["surfline.com",206],["rureka.com",207],["bunkr.is",208],["amateur8.com",209],["freeporn8.com",209],["maturetubehere.com",209],["embedo.co",210],["corriere.it",211],["oggi.it",211],["2the.space",212],["file.gocmod.com",213],["apkcombo.com",214],["sponsorhunter.com",215],["soft98.ir",216],["novelssites.com",217],["torrentmac.net",218],["udvl.com",219],["moviezaddiction.icu",220],["apimate.net",221],["dlpanda.com",222],["socialmediagirls.com",223],["ecamrips.com",223],["showcamrips.com",223],["einrichtungsbeispiele.de",224],["weadown.com",225],["molotov.tv",226],["freecoursesonline.me",227],["adelsfun.com",227],["advantien.com",227],["bailbondsfinder.com",227],["bigpiecreative.com",227],["childrenslibrarylady.com",227],["classifarms.com",227],["comtasq.ca",227],["crone.es",227],["ctrmarketingsolutions.com",227],["dropnudes.com",227],["ftuapps.dev",227],["genzsport.com",227],["ghscanner.com",227],["grsprotection.com",227],["gruporafa.com.br",227],["inmatefindcalifornia.com",227],["inmatesearchidaho.com",227],["itsonsitetv.com",227],["mfmfinancials.com",227],["myproplugins.com",227],["onehack.us",227],["ovester.com",227],["paste.bin.sx",227],["privatenudes.com",227],["renoconcrete.ca",227],["richieashbeck.com",227],["sat.technology",227],["short1ink.com",227],["stpm.co.uk",227],["wegotcookies.co",227],["mathcrave.com",227],["marinetraffic.live",227],["commands.gg",228],["smgplaza.com",229],["emturbovid.com",230],["findjav.com",230],["mmtv01.xyz",230],["stbturbo.xyz",230],["streamsilk.com",230],["freepik.com",231],["diyphotography.net",233],["bitchesgirls.com",234],["shopforex.online",235],["programmingeeksclub.com",236],["easymc.io",237],["diendancauduong.com",238],["androidadult.com",239],["parentcircle.com",240],["h-game18.xyz",241],["nopay.info",242],["wheelofgold.com",243],["shortlinks.tech",244],["skill4ltu.eu",246],["lifestyle.bg",247],["news.bg",247],["topsport.bg",247],["webcafe.bg",247],["freepikdownloader.com",248],["freepasses.org",249],["iusedtobeaboss.com",250],["androidpolice.com",251],["cbr.com",251],["gamerant.com",251],["howtogeek.com",251],["thegamer.com",251],["blogtruyenmoi.com",252],["igay69.com",254],["graphicget.com",255],["qiwi.gg",[256,257]],["sonixgvn.net",258],["netcine2.la",259],["idnes.cz",[260,261]],["cbc.ca",262],["japscan.lol",263]]);

const entitiesMap = new Map([["kisscartoon",1],["kissasian",7],["ganool",7],["pirate",7],["piratebay",7],["pirateproxy",7],["proxytpb",7],["thepiratebay",7],["limetorrents",[9,15]],["king-pes",9],["depedlps",9],["komikcast",9],["idedroidsafelink",9],["links-url",9],["ak4eg",9],["streanplay",10],["steanplay",10],["liferayiseasy",[11,12]],["pahe",15],["yts",15],["tube8",15],["topeuropix",15],["moviescounter",15],["torrent9",15],["desiremovies",15],["movs4u",15],["uwatchfree",15],["hydrax",15],["4movierulz",15],["projectfreetv",15],["arabseed",15],["btdb",[15,54]],["world4ufree",15],["streamsport",15],["rojadirectatvhd",15],["userload",15],["adyou",17],["fxporn69",20],["rexporn",24],["movies07",24],["pornocomics",24],["pornomoll",28],["gsurl",29],["freecoursesonline",30],["lordpremium",30],["todovieneok",30],["novablogitalia",30],["anisubindo",30],["btvsports",30],["mimaletadepeliculas",31],["burningseries",32],["dz4soft",33],["yoututosjeff",33],["ebookmed",33],["lanjutkeun",33],["novelasesp",33],["singingdalong",33],["doujindesu",33],["xmovies8",36],["mega-dvdrip",43],["peliculas-dvdrip",43],["desbloqueador",44],["newpelis",[45,52]],["pelix",[45,52]],["allcalidad",[45,197]],["khatrimaza",45],["camwhores",46],["camwhorestv",46],["uproxy",46],["nekopoi",49],["mirrorace",58],["mixdrp",63],["asiansex",65],["japanfuck",65],["japanporn",65],["teensex",65],["vintagetube",65],["xxxmovies",65],["zooqle",68],["hdfull",72],["mangamanga",74],["streameast",76],["thestreameast",76],["vev",80],["vidop",80],["1337x",82],["x1337x",82],["zone-telechargement",82],["megalink",87],["gmx",88],["mega1080p",93],["9hentai",95],["gaypornhdfree",102],["cinemakottaga",102],["privatemoviez",102],["apkmaven",102],["popcornstream",104],["readcomiconline",114],["azsoft",115],["fc-lc",137],["nuvid",142],["pornktube",145],["watchseries",145],["milfnut",147],["pagalmovies",156],["7starhd",156],["jalshamoviez",156],["9xupload",156],["bdupload",156],["desiupload",156],["rdxhd1",156],["moviessources",166],["0gomovie",168],["0gomovies",168],["123moviefree",168],["1kmovies",168],["1madrasdub",168],["1primewire",168],["2embed",168],["2madrasdub",168],["2umovies",168],["4anime",168],["adblockplustape",168],["altadefinizione01",168],["atomixhq",168],["beinmatch",168],["brmovies",168],["cima4u",168],["clicknupload",168],["cmovies",168],["cricfree",168],["crichd",168],["databasegdriveplayer",168],["dood",168],["f1stream",168],["faselhd",168],["fbstream",168],["filemoon",168],["filepress",[168,232]],["filmlinks4u",168],["filmpertutti",168],["filmyzilla",168],["fmovies",168],["french-stream",168],["fzlink",168],["gdriveplayer",168],["gofilms4u",168],["gogoanime",168],["gomoviz",168],["hdmoviefair",168],["hdmovies4u",168],["hdmovies50",168],["hdmoviesfair",168],["hh3dhay",168],["hindilinks4u",168],["hotmasti",168],["hurawatch",168],["klmanga",168],["klubsports",168],["libertestreamvf",168],["livetvon",168],["manga1000",168],["manga1001",168],["mangaraw",168],["mangarawjp",168],["mlbstream",168],["motogpstream",168],["movierulz",168],["movies123",168],["movies2watch",168],["moviesden",168],["moviezaddiction",168],["myflixer",168],["nbastream",168],["netcine",168],["nflstream",168],["nhlstream",168],["onlinewatchmoviespk",168],["pctfenix",168],["pctnew",168],["pksmovies",168],["plyjam",168],["plylive",168],["pogolinks",168],["popcorntime",168],["poscitech",168],["prmovies",168],["rugbystreams",168],["shahed4u",168],["sflix",168],["sitesunblocked",168],["solarmovies",168],["sportcast",168],["sportskart",168],["sports-stream",168],["streaming-french",168],["streamers",168],["streamingcommunity",168],["strikeout",168],["t20cup",168],["tennisstreams",168],["torrentdosfilmes",168],["toonanime",168],["tvply",168],["ufcstream",168],["uptomega",168],["uqload",168],["vudeo",168],["vidoo",168],["vipbox",168],["vipboxtv",168],["vipleague",168],["viprow",168],["yesmovies",168],["yomovies",168],["yomovies1",168],["yt2mp3s",168],["kat",168],["katbay",168],["kickass",168],["kickasshydra",168],["kickasskat",168],["kickass2",168],["kickasstorrents",168],["kat2",168],["kattracker",168],["thekat",168],["thekickass",168],["kickassz",168],["kickasstorrents2",168],["topkickass",168],["kickassgo",168],["kkickass",168],["kkat",168],["kickasst",168],["kick4ss",168],["guardaserie",173],["cine-calidad",174],["videovard",190],["gntai",197],["grantorrent",197],["mejortorrent",197],["mejortorrento",197],["mejortorrents",197],["mejortorrents1",197],["mejortorrentt",197],["shineads",200],["bg-gledai",227],["gledaitv",227],["motchill",245]]);

const exceptionsMap = new Map([["mentor.duden.de",[75]],["forum.soft98.ir",[216]]]);

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
        proxyApplyFn('EventTarget.prototype.addEventListener', function(context) {
            const { callArgs, thisArg } = context;
            let t, h;
            try {
                t = String(callArgs[0]);
                if ( typeof callArgs[1] === 'function' ) {
                    h = String(safe.Function_toString(callArgs[1]));
                } else if ( typeof callArgs[1] === 'object' && callArgs[1] !== null ) {
                    if ( typeof callArgs[1].handleEvent === 'function' ) {
                        h = String(safe.Function_toString(callArgs[1].handleEvent));
                    }
                } else {
                    h = String(callArgs[1]);
                }
            } catch(ex) {
            }
            if ( type === '' && pattern === '' ) {
                safe.uboLog(logPrefix, `Called: ${t}\n${h}\n${elementDetails(thisArg)}`);
            } else if ( shouldPrevent(thisArg, t, h) ) {
                return safe.uboLog(logPrefix, `Prevented: ${t}\n${h}\n${elementDetails(thisArg)}`);
            }
            return context.reflect();
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
