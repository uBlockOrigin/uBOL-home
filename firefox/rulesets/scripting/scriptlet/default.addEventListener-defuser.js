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

const argsList = [["load","Object"],["mousedown","clientX"],["load","hard_block"],["/contextmenu|keydown/"],["","adb"],["click","ClickHandler"],["load","IsAdblockRequest"],["/^(?:click|mousedown)$/","_0x"],["error"],["load","onload"],["","BACK"],["load","getComputedStyle"],["load","adsense"],["load","(!o)"],["load","(!i)"],["","_0x"],["","Adblock"],["load","nextFunction"],["/^(?:click|mousedown)$/","bypassEventsInProxies"],["","window.open"],["","open"],["click","exopop"],["/^(?:load|click)$/","popMagic"],["mousedown","popundrInit"],["getexoloader"],["","pop"],["load","exoJsPop101"],["/^loadex/"],["","/exo"],["","_blank"],["",";}"],["load","BetterPop"],["mousedown","preventDefault"],["load","advertising"],["click","preventDefault"],["load","2000"],["/^(click|mousedown|mousemove|touchstart|touchend|touchmove)/","system.popunder"],["load","adb"],["/^(?:click|mousedown|mousemove|touchstart|touchend|touchmove)$/","system.popunder"],["","'0x"],["/DOMContentLoaded|load/","y.readyState"],["/error|canplay/","(t)"],["load","hblocked"],["error","Adblocker"],["DOMContentLoaded","adlinkfly"],["DOMContentLoaded","shortener"],["mousedown","trigger"],["","0x"],["","Pop"],["/^(?:click|mousedown)$/","popunder"],["DOMContentLoaded","preventExit"],["","adsense"],["load"],["click","pop_under"],["load","url"],["load","adverts-top-container"],["","Date"],["DOMContentLoaded","&nbsp"],["click","read_cookie"],["","midRoll"],["click","_0x"],["load","isBlanketFound"],["load","showModal"],["click","trigger"],["mouseout","clientWidth"],["load","download-wrapper"],["load","autoRecov"],["popstate","noPop"],["/^(?:click|mousedown)$/","ppu"],["click","native code"],["/^(?:mousedown|mouseup)$/","0x"],["click","popundr"],["click"],["DOMContentLoaded","compupaste"],["mousedown","!!{});"],["DOMContentLoaded","/adblock/i"],["keydown"],["DOMContentLoaded","isMobile"],["/^/","0x"],["load","PrivateMode"],["scroll","_0x"],["DOMContentLoaded","checkVPN"],["/^(?:click|mousedown|mouseup)$/","di()"],["","\\"],["popstate"],["click","my_inter_listen"],["load","appendChild"],["","bi()"],["","checkTarget"],["click","popunder"],["timeupdate"],["scroll","getElementById"],["load","undefined"],["DOMContentLoaded","scriptwz_url"],["load","0x"],["DOMContentLoaded","btoa"],["adblockActivated"],["click","saveLastEvent"],["DOMContentLoaded","offsetHeight"],["","show"],["/.?/","popMagic"],["","ads"],["click","interstitial"],["load","antiblock"],["DOMContentLoaded","adsBlocked"],["load",".appendChild"],["","btoa"],["","exopop"],["DOMContentLoaded","AdBlock"],["load","blocker"],["mouseleave","NativeDisplayAdID"],["mouseover","event.triggered"],["load","removeChild"],["load","ads"],["click","ShouldShow"],["click","clickCount"],["mousedown","localStorage"],["/adblock/i"],["load","doTest"],["DOMContentLoaded","antiAdBlockerHandler"],["DOMContentLoaded","daadb_get_data_fetch"],["click","splashPage"],["load","detect-modal"],["load","_0x"],["DOMContentLoaded","canRedirect"],["DOMContentLoaded","adb"],["error","/\\{[a-z]\\(e\\)\\}/"],["load",".call(this"],["load","adblock"],["/touchmove|wheel/","preventDefault()"],["load","showcfkModal"],["click","attached","elements","div[class=\"share-embed-container\"]"],["DOMContentLoaded","iframe"],["","/_blank/i"],["load","htmls"],["blur","focusOut"],["click","/handleClick|popup/"],["load","bypass"],["DOMContentLoaded","location.href"],["","popMagic"],["contextmenu"],["blur","counter"],["DOMContentLoaded","document.documentElement.lang.toLowerCase"],["/^(?:click|mousedown)$/","latest!=="],["DOMContentLoaded",".ready"],["load","script"],["","/pop|wm|forceClick/"],["load","block"],["","/_0x|localStorage\\.getItem/"],["DOMContentLoaded","adblock"],["load","head"],["visibilitychange"],["load","/showModal|isBlanketFound/"],["click","shouldShow"],["","/ads|Modal/"],["DOMContentLoaded","init"],["load","Adblock"],["DOMContentLoaded","window.open"],["","vads"],["devtoolschange"],["click","open"],["beforeunload"],["","break;case $."],["mouseup","decodeURIComponent"],["/(?:click|touchend)/","_0x"],["","removeChild"],["click","pu_count"],["","/pop|_blank/"],["click","allclick_Public"],["click","0x"],["/touchstart|mousedown|click/","latest"],["blur","native code"],["blur","event.simulate"],["click","_blank"],["DOMContentLoaded","0x"],["click","overlay"],["scroll","undefined"],["readystatechange","document.removeEventListener"],["mousedown","shown_at"],["scroll","detect"],["click","t(a)"],["","focus"],["DOMContentLoaded","deblocker"],["","preventDefault"],["click","tabunder"],["mouseup","catch"],["scroll","innerHeight"],["hashchange"],["load","/nextFunction|2000/"],["load","player"],["","document.oncontextmenu"],["","about:blank"],["click","popMagic"],["load","popMagic"],["DOMContentLoaded","adsSrc"],["np.detect"],["click","Popup"],["","/open.*_blank/"],["scroll"],["","isBlocking"],["timeupdate","","elements",".quiver-cam-player--ad-not-running.quiver-cam-player--free video"],["","$"],["","exoJsPop101"],["/click|mousedown/","catch"],["","init"],["adb"],["scroll","modal"],["DOMContentLoaded","clientHeight"],["click","window.focus"],["click","[native code]"],["click","event.dispatch"],["","Math"],["DOMContentLoaded","popupurls"],["","tabUnder"],["load","XMLHttpRequest"],["load","puURLstrpcht"],["load","AdBlocker"],["","showModal"],["","goog"],["load","abDetectorPro"],["","document.body"],["","modal"],["click","pop"],["click","adobeModalTestABenabled"],["blur","console.log"],["","AdB"],["load","adSession"],["load","Ads"],["DOMContentLoaded","googlesyndication"],["np.evtdetect"],["load","popunder"],["scroll","function(e)"],["DOMContentLoaded","adlinkfly_url"],["mousedown"],["load","document.getElementById"],["mousedown","tabUnder"],["click","popactive"],["load","adsbygoogle"],["DOMContentLoaded","location.replace"],["load","modal_blocker"],["click","isOpened"],["mousedown","pop.doEvent"],["error","blocker"],["click","alink"],["","daadb"],["load","google-analytics"],["","sessionStorage"],["load","fetch"],["click","pingUrl"],["mousedown","scoreUrl"],["click","/event_callback=function\\(\\){window\\.location=t\\.getAttribute\\(\"href\"\\)/"],["load","/function.{1,3000}$/"],["","Adb"]];

const hostnamesMap = new Map([["newser.com",0],["sport1.de",2],["userscloud.com",3],["timesofindia.indiatimes.com",4],["drrtyr.mx",4],["pinoyalbums.com",4],["multiplayer.it",4],["mediafire.com",[5,6]],["pinsystem.co.uk",7],["fembed.com",7],["ancensored.com",7],["mp3fiber.com",[7,17]],["xrivonet.info",7],["afreesms.com",8],["tu.no",8],["tio.ch",8],["lavanguardia.com",8],["eplayer.click",8],["kingofdown.com",9],["radiotormentamx.com",9],["quelleestladifference.fr",9],["otakuworldsite.blogspot.com",9],["ad-itech.blogspot.com",9],["sna3talaflam.com",9],["agar.pro",9],["unlockapk.com",9],["mobdi3ips.com",9],["socks24.org",9],["interviewgig.com",9],["javaguides.net",9],["almohtarif-tech.net",9],["forum.release-apk.com",9],["devoloperxda.blogspot.com",9],["zwergenstadt.com",9],["primedeportes.es",9],["9goals.live",9],["upxin.net",9],["ciudadblogger.com",9],["ke-1.com",9],["secretsdeepweb.blogspot.com",9],["bit-shares.com",9],["itdmusics.com",9],["aspdotnet-suresh.com",9],["tudo-para-android.com",9],["urdulibrarypk.blogspot.com",9],["zerotopay.com",9],["akw.to",9],["mawsueaa.com",9],["hesgoal-live.io",9],["king-shoot.io",9],["bibme.org",13],["citationmachine.net",13],["easybib.com",14],["vermangasporno.com",15],["imgtorrnt.in",15],["picbaron.com",[15,139]],["letmejerk.com",15],["letmejerk2.com",15],["letmejerk3.com",15],["letmejerk4.com",15],["letmejerk5.com",15],["letmejerk6.com",15],["letmejerk7.com",15],["dlapk4all.com",15],["kropic.com",15],["kvador.com",15],["pdfindir.net",15],["brstej.com",15],["topwwnews.com",15],["xsanime.com",15],["vidlo.us",15],["put-locker.com",15],["youx.xxx",15],["animeindo.asia",15],["masahub.net",15],["adclickersbot.com",15],["badtaste.it",16],["mage.si",17],["totaldebrid.org",17],["neko-miku.com",17],["elsfile.org",17],["venstrike.jimdofree.com",17],["schrauben-normen.de",17],["avengerinator.blogspot.com",17],["link-to.net",17],["hanimesubth.com",17],["gsmturkey.net",17],["adshrink.it",17],["presentation-ppt.com",17],["mangacanblog.com",17],["pekalongan-cits.blogspot.com",17],["4tymode.win",17],["eurotruck2.com.br",17],["linkvertise.com",17],["reifenrechner.at",17],["tire-size-calculator.info",17],["linuxsecurity.com",17],["encodinghub.com",17],["itsguider.com",17],["cotravinh.blogspot.com",17],["itudong.com",17],["shortx.net",17],["lecturel.com",17],["bakai.org",17],["nar.k-ba.net",17],["tiroalpalo.org",17],["shemalez.com",19],["tubepornclassic.com",19],["gotporn.com",20],["freepornrocks.com",20],["tvhai.org",20],["simpcity.su",20],["realgfporn.com",[21,22]],["titsbox.com",21],["thisvid.com",22],["xvideos-downloader.net",22],["imgspice.com",23],["vikiporn.com",24],["tnaflix.com",24],["hentai2w.com",[24,192]],["yourlust.com",24],["hotpornfile.org",24],["watchfreexxx.net",24],["vintageporntubes.com",24],["angelgals.com",24],["babesexy.com",24],["porndaa.com",24],["ganstamovies.com",24],["youngleak.com",24],["porndollz.com",24],["xnxxvideo.pro",24],["xvideosxporn.com",24],["filmpornofrancais.fr",24],["pictoa.com",[24,47]],["adultasianporn.com",24],["nsfwmonster.com",24],["girlsofdesire.org",24],["gaytail.com",24],["fetish-bb.com",24],["rumporn.com",24],["soyoungteens.com",24],["zubby.com",24],["lesbian8.com",24],["gayforfans.com",24],["reifporn.de",24],["javtsunami.com",24],["18tube.sex",24],["xxxextreme.org",24],["amateurs-fuck.com",24],["sex-amateur-clips.com",24],["hentaiworld.tv",24],["dads-banging-teens.com",24],["home-xxx-videos.com",24],["mature-chicks.com",24],["teens-fucking-matures.com",24],["hqbang.com",24],["darknessporn.com",24],["familyporner.com",24],["freepublicporn.com",24],["pisshamster.com",24],["punishworld.com",24],["xanimu.com",24],["pornhd.com",25],["cnnamador.com",[25,36]],["cle0desktop.blogspot.com",25],["turkanime.co",25],["camclips.tv",[25,48]],["blackpornhq.com",25],["xsexpics.com",25],["ulsex.net",25],["wannafreeporn.com",25],["ytube2dl.com",25],["multiup.us",25],["protege-torrent.com",25],["pussyspace.com",[26,27]],["pussyspace.net",[26,27]],["empflix.com",28],["cpmlink.net",29],["bdsmstreak.com",29],["cutpaid.com",29],["pornforrelax.com",29],["fatwhitebutt.com",29],["mavplay.xyz",29],["sunporno.com",[30,31,192]],["short.pe",32],["bs.to",34],["efukt.com",34],["generacionretro.net",35],["nuevos-mu.ucoz.com",35],["micloudfiles.com",35],["mimaletamusical.blogspot.com",35],["visionias.net",35],["b3infoarena.in",35],["lurdchinexgist.blogspot.com",35],["thefreedommatrix.blogspot.com",35],["hentai-vl.blogspot.com",35],["projetomotog.blogspot.com",35],["ktmx.pro",35],["lirik3satu.blogspot.com",35],["marketmovers.it",35],["pharmaguideline.com",35],["safemaru.blogspot.com",35],["mixloads.com",35],["mangaromance.eu",35],["interssh.com",35],["freesoftpdfdownload.blogspot.com",35],["cirokun.blogspot.com",35],["myadslink.com",35],["blackavelic.com",35],["server.satunivers.tv",35],["eg-akw.com",35],["xn--mgba7fjn.cc",35],["flashingjungle.com",36],["ma-x.org",37],["lavozdegalicia.es",37],["xmovies08.org",39],["globaldjmix.com",40],["zazzybabes.com",41],["haaretz.co.il",42],["haaretz.com",42],["slate.com",43],["megalinks.info",44],["megapastes.com",44],["mega-mkv.com",[44,45]],["mkv-pastes.com",44],["zpaste.net",44],["zlpaste.net",44],["9xlinks.site",44],["zona-leros.net",45],["acortarm.xyz",46],["acortame.xyz",46],["cine.to",[47,197]],["kissasia.cc",47],["digjav.com",48],["videoszoofiliahd.com",49],["xxxtubezoo.com",50],["zooredtube.com",50],["megacams.me",52],["rlslog.net",52],["porndoe.com",53],["acienciasgalilei.com",55],["playrust.io",56],["payskip.org",57],["short-url.link",58],["tubedupe.com",59],["mcrypto.club",60],["fatgirlskinny.net",61],["polska-ie.com",61],["windowsmatters.com",61],["canaltdt.es",62],["masbrooo.com",62],["2ndrun.tv",62],["stfly.me",63],["oncehelp.com",63],["queenfaucet.website",63],["curto.win",63],["smallseotools.com",64],["macwelt.de",66],["pcwelt.de",66],["capital.de",66],["geo.de",66],["allmomsex.com",67],["allnewindianporn.com",67],["analxxxvideo.com",67],["animalextremesex.com",67],["anime3d.xyz",67],["animefuckmovies.com",67],["animepornfilm.com",67],["animesexbar.com",67],["animesexclip.com",67],["animexxxsex.com",67],["animexxxfilms.com",67],["anysex.club",67],["apetube.asia",67],["asianfuckmovies.com",67],["asianfucktube.com",67],["asianporn.sexy",67],["asiansexcilps.com",67],["beeg.fund",67],["beegvideoz.com",67],["bestasiansex.pro",67],["bravotube.asia",67],["brutalanimalsfuck.com",67],["candyteenporn.com",67],["daddyfuckmovies.com",67],["desifuckonline.com",67],["exclusiveasianporn.com",67],["exteenporn.com",67],["fantasticporn.net",67],["fantasticyoungporn.com",67],["fineasiansex.com",67],["firstasianpussy.com",67],["freeindiansextube.com",67],["freepornasians.com",67],["freerealvideo.com",67],["fuck-beeg.com",67],["fuck-xnxx.com",67],["fuckasian.pro",67],["fuckfuq.com",67],["fuckundies.com",67],["gojapaneseporn.com",67],["golderotica.com",67],["goodyoungsex.com",67],["goyoungporn.com",67],["hardxxxmoms.com",67],["hdvintagetube.com",67],["hentaiporn.me",67],["hentaisexfilms.com",67],["hentaisexuality.com",67],["hot-teens-movies.mobi",67],["hotanimepornvideos.com",67],["hotanimevideos.com",67],["hotasianpussysex.com",67],["hotjapaneseshows.com",67],["hotmaturetube.com",67],["hotmilfs.pro",67],["hotorientalporn.com",67],["hotpornyoung.com",67],["hotxxxjapanese.com",67],["hotxxxpussy.com",67],["indiafree.net",67],["indianpornvideo.online",67],["japanpornclip.com",67],["japanesetube.video",67],["japansex.me",67],["japanesexxxporn.com",67],["japansporno.com",67],["japanxxx.asia",67],["japanxxxworld.com",67],["keezmovies.surf",67],["lingeriefuckvideo.com",67],["liveanimalporn.zooo.club",67],["madhentaitube.com",67],["megahentaitube.com",67],["megajapanesesex.com",67],["megajapantube.com",67],["milfxxxpussy.com",67],["momsextube.pro",67],["momxxxass.com",67],["monkeyanimalporn.com",67],["moviexxx.mobi",67],["newanimeporn.com",67],["newjapanesexxx.com",67],["nicematureporn.com",67],["nudeplayboygirls.com",67],["openxxxporn.com",67],["originalindianporn.com",67],["originalteentube.com",67],["pig-fuck.com",67],["plainasianporn.com",67],["popularasianxxx.com",67],["pornanimetube.com",67],["pornasians.pro",67],["pornhat.asia",67],["pornheed.online",67],["pornjapanesesex.com",67],["pornomovies.asia",67],["pornvintage.tv",67],["primeanimesex.com",67],["realjapansex.com",67],["realmomsex.com",67],["redsexhub.com",67],["retroporn.world",67],["retrosexfilms.com",67],["sex-free-movies.com",67],["sexanimesex.com",67],["sexanimetube.com",67],["sexjapantube.com",67],["sexmomvideos.com",67],["sexteenxxxtube.com",67],["sexxxanimal.com",67],["sexyoungtube.com",67],["sexyvintageporn.com",67],["sopornmovies.com",67],["spicyvintageporn.com",67],["sunporno.club",67],["tabooanime.club",67],["teenextrem.com",67],["teenfucksex.com",67],["teenhost.net",67],["teensexass.com",67],["tnaflix.asia",67],["totalfuckmovies.com",67],["totalmaturefuck.com",67],["txxx.asia",67],["voyeurpornsex.com",67],["warmteensex.com",67],["wetasiancreampie.com",67],["wildhentaitube.com",67],["wowyoungsex.com",67],["xhamster-art.com",67],["xmovie.pro",67],["xnudevideos.com",67],["xnxxjapon.com",67],["xpics.me",67],["xvide.me",67],["xxxanimefuck.com",67],["xxxanimevideos.com",67],["xxxanimemovies.com",67],["xxxhentaimovies.com",67],["xxxhothub.com",67],["xxxjapaneseporntube.com",67],["xxxlargeporn.com",67],["xxxmomz.com",67],["xxxpornmilf.com",67],["xxxpussyclips.com",67],["xxxpussysextube.com",67],["xxxretrofuck.com",67],["xxxsex.pro",67],["xxxsexyjapanese.com",67],["xxxteenyporn.com",67],["xxxvideo.asia",67],["xxxvideos.ink",67],["xxxyoungtv.com",67],["youjizzz.club",67],["youngpussyfuck.com",67],["bayimg.com",68],["celeb.gate.cc",69],["masterplayer.xyz",71],["pussy-hub.com",71],["porndex.com",72],["compucalitv.com",73],["diariodenavarra.es",75],["duden.de",77],["pennlive.com",79],["beautypageants.indiatimes.com",80],["01fmovies.com",81],["lnk2.cc",83],["fullhdxxx.com",84],["luscious.net",[84,139]],["classicpornbest.com",84],["xstory-fr.com",84],["1youngteenporn.com",84],["www-daftarharga.blogspot.com",[84,181]],["miraculous.to",[84,187]],["vtube.to",84],["gosexpod.com",85],["otakukan.com",86],["xcafe.com",87],["pornfd.com",87],["venusarchives.com",87],["imagehaha.com",88],["imagenpic.com",88],["imageshimage.com",88],["imagetwist.com",88],["k1nk.co",89],["watchasians.cc",89],["alexsports.xyz",89],["lulustream.com",89],["luluvdo.com",89],["web.de",90],["news18.com",91],["thelanb.com",92],["dropmms.com",92],["softwaredescargas.com",93],["cracking-dz.com",94],["anitube.ninja",95],["gazzetta.it",96],["port.hu",98],["dziennikbaltycki.pl",99],["dzienniklodzki.pl",99],["dziennikpolski24.pl",99],["dziennikzachodni.pl",99],["echodnia.eu",99],["expressbydgoski.pl",99],["expressilustrowany.pl",99],["gazetakrakowska.pl",99],["gazetalubuska.pl",99],["gazetawroclawska.pl",99],["gk24.pl",99],["gloswielkopolski.pl",99],["gol24.pl",99],["gp24.pl",99],["gra.pl",99],["gs24.pl",99],["kurierlubelski.pl",99],["motofakty.pl",99],["naszemiasto.pl",99],["nowiny24.pl",99],["nowosci.com.pl",99],["nto.pl",99],["polskatimes.pl",99],["pomorska.pl",99],["poranny.pl",99],["sportowy24.pl",99],["strefaagro.pl",99],["strefabiznesu.pl",99],["stronakobiet.pl",99],["telemagazyn.pl",99],["to.com.pl",99],["wspolczesna.pl",99],["course9x.com",99],["courseclub.me",99],["azrom.net",99],["alttyab.net",99],["esopress.com",99],["nesiaku.my.id",99],["onemanhua.com",100],["freeindianporn.mobi",100],["dr-farfar.com",101],["boyfriendtv.com",102],["brandstofprijzen.info",103],["netfuck.net",104],["blog24.me",[104,134]],["kisahdunia.com",104],["javsex.to",104],["nulljungle.com",104],["oyuncusoruyor.com",104],["pbarecap.ph",104],["sourds.net",104],["teknobalta.com",104],["tvinternetowa.info",104],["sqlserveregitimleri.com",104],["tutcourse.com",104],["readytechflip.com",104],["novinhastop.com",104],["warddogs.com",104],["dvdgayporn.com",104],["iimanga.com",104],["tinhocdongthap.com",104],["tremamnon.com",104],["423down.com",104],["brizzynovel.com",104],["jugomobile.com",104],["freecodezilla.net",104],["animekhor.xyz",104],["iconmonstr.com",104],["gay-tubes.cc",104],["rbxscripts.net",104],["comentariodetexto.com",104],["wordpredia.com",104],["livsavr.co",104],["allfaucet.xyz",[104,134]],["titbytz.tk",104],["replica-watch.info",104],["alludemycourses.com",104],["kayifamilytv.com",104],["iir.ai",105],["gameofporn.com",107],["qpython.club",108],["antifake-funko.fr",108],["dktechnicalmate.com",108],["recipahi.com",108],["e9china.net",109],["ontools.net",109],["marketbeat.com",110],["hentaipornpics.net",111],["apps2app.com",112],["alliptvlinks.com",113],["waterfall.money",113],["xvideos.com",114],["xvideos2.com",114],["homemoviestube.com",115],["sexseeimage.com",115],["tubereader.me",117],["repretel.com",117],["dagensnytt.com",118],["mrproblogger.com",118],["themezon.net",118],["gfx-station.com",119],["bitzite.com",[119,134,138]],["historyofroyalwomen.com",120],["davescomputertips.com",120],["ukchat.co.uk",121],["hivelr.com",122],["embedz.click",123],["skidrowcodex.net",124],["takimag.com",125],["digi.no",126],["th.gl",127],["scimagojr.com",128],["haxina.com",128],["cryptofenz.xyz",128],["twi-fans.com",129],["learn-cpp.org",130],["terashare.co",131],["upshrink.com",132],["ohionowcast.info",134],["wiour.com",134],["appsbull.com",134],["diudemy.com",134],["maqal360.com",134],["bitcotasks.com",134],["videolyrics.in",134],["manofadan.com",134],["cempakajaya.com",134],["tagecoin.com",134],["doge25.in",134],["king-ptcs.com",134],["naijafav.top",134],["ourcoincash.xyz",134],["sh.techsamir.com",134],["claimcoins.site",134],["cryptosh.pro",134],["coinsrev.com",134],["go.freetrx.fun",134],["eftacrypto.com",134],["fescrypto.com",134],["earnhub.net",134],["kiddyshort.com",134],["tronxminer.com",134],["homeairquality.org",135],["cety.app",136],["exego.app",136],["cutlink.net",136],["cutsy.net",136],["cutyurls.com",136],["cutty.app",136],["cutnet.net",136],["adcrypto.net",137],["admediaflex.com",137],["aduzz.com",137],["bitcrypto.info",137],["cdrab.com",137],["datacheap.io",137],["hbz.us",137],["savego.org",137],["owsafe.com",137],["sportweb.info",137],["aiimgvlog.fun",139],["6indianporn.com",139],["amateurebonypics.com",139],["amateuryoungpics.com",139],["cinemabg.net",139],["coomer.su",139],["desimmshd.com",139],["frauporno.com",139],["givemeaporn.com",139],["hitomi.la",139],["jav-asia.top",139],["javf.net",139],["javideo.net",139],["kemono.su",139],["kr18plus.com",139],["pilibook.com",139],["pornborne.com",139],["porngrey.com",139],["qqxnxx.com",139],["sexvideos.host",139],["submilf.com",139],["subtaboo.com",139],["tktube.com",139],["xfrenchies.com",139],["coingraph.us",140],["momo-net.com",140],["maxgaming.fi",140],["travel.vebma.com",141],["cloud.majalahhewan.com",141],["crm.cekresi.me",141],["ai.tempatwisata.pro",141],["pinloker.com",141],["sekilastekno.com",141],["azmath.info",142],["downfile.site",142],["downphanmem.com",142],["expertvn.com",142],["memangbau.com",142],["trangchu.news",142],["aztravels.net",142],["vulture.com",143],["megaplayer.bokracdn.run",144],["hentaistream.com",145],["siteunblocked.info",146],["larvelfaucet.com",147],["feyorra.top",147],["claimtrx.com",147],["moviesyug.net",148],["w4files.ws",148],["parispi.net",149],["simkl.com",150],["paperzonevn.com",151],["financemonk.net",151],["dailyvideoreports.net",152],["lewd.ninja",153],["systemnews24.com",154],["incestvidz.com",155],["niusdiario.es",156],["playporngames.com",157],["movi.pk",[158,162]],["justin.mp3quack.lol",160],["cutesexyteengirls.com",161],["0dramacool.net",162],["185.53.88.104",162],["185.53.88.204",162],["185.53.88.15",162],["123movies4k.net",162],["1movieshd.com",162],["1rowsports.com",162],["4share-mp3.net",162],["6movies.net",162],["9animetv.to",162],["720pstream.me",162],["aagmaal.com",162],["abysscdn.com",162],["ajkalerbarta.com",162],["akstream.xyz",162],["androidapks.biz",162],["androidsite.net",162],["animeonlinefree.org",162],["animesite.net",162],["animespank.com",162],["aniworld.to",162],["apkmody.io",162],["appsfree4u.com",162],["audioz.download",162],["awafim.tv",162],["bdnewszh.com",162],["beastlyprints.com",162],["bengalisite.com",162],["bestfullmoviesinhd.org",162],["betteranime.net",162],["blacktiesports.live",162],["buffsports.stream",162],["ch-play.com",162],["clickforhire.com",162],["cloudy.pk",162],["computercrack.com",162],["coolcast2.com",162],["crackedsoftware.biz",162],["crackfree.org",162],["cracksite.info",162],["cryptoblog24.info",162],["cuatrolatastv.blogspot.com",162],["cydiasources.net",162],["dirproxy.com",162],["dopebox.to",162],["downloadapk.info",162],["downloadapps.info",162],["downloadgames.info",162],["downloadmusic.info",162],["downloadsite.org",162],["downloadwella.com",162],["ebooksite.org",162],["educationtips213.blogspot.com",162],["egyup.live",162],["embed.meomeo.pw",162],["embed.scdn.to",162],["emulatorsite.com",162],["essaysharkwriting.club",162],["exploreera.net",162],["extrafreetv.com",162],["fakedetail.com",162],["fclecteur.com",162],["files.im",162],["flexyhit.com",162],["fmoviefree.net",162],["fmovies24.com",162],["footyhunter3.xyz",162],["freeflix.info",162],["freemoviesu4.com",162],["freeplayervideo.com",162],["freesoccer.net",162],["fseries.org",162],["gamefast.org",162],["gamesite.info",162],["gettapeads.com",162],["gmanga.me",162],["gocast123.me",162],["gogohd.net",162],["gogoplay5.com",162],["gooplay.net",162],["gostreamon.net",162],["happy2hub.org",162],["harimanga.com",162],["healthnewsreel.com",162],["hexupload.net",162],["hinatasoul.com",162],["hindisite.net",162],["holymanga.net",162],["hxfile.co",162],["isosite.org",162],["iv-soft.com",162],["januflix.expert",162],["jewelry.com.my",162],["johnwardflighttraining.com",162],["kabarportal.com",162],["kstorymedia.com",162],["la123movies.org",162],["lespassionsdechinouk.com",162],["lilymanga.net",162],["linksdegrupos.com.br",162],["linkz.wiki",162],["livestreamtv.pk",162],["macsite.info",162],["mangapt.com",162],["mangasite.org",162],["manhuascan.com",162],["megafilmeshdseries.com",162],["megamovies.org",162],["membed.net",162],["moddroid.com",162],["moviefree2.com",162],["movies-watch.com.pk",162],["moviesite.app",162],["moviesonline.fm",162],["moviesx.org",162],["msmoviesbd.com",162],["musicsite.biz",162],["myfernweh.com",162],["myviid.com",162],["nazarickol.com",162],["noob4cast.com",162],["nsw2u.com",[162,252]],["oko.sh",162],["olympicstreams.me",162],["orangeink.pk",162],["owllink.net",162],["pahaplayers.click",162],["patchsite.net",162],["pdfsite.net",162],["play1002.com",162],["player-cdn.com",162],["productkeysite.com",162],["projectfreetv.one",162],["romsite.org",162],["rufiguta.com",162],["rytmp3.io",162],["send.cm",162],["seriesite.net",162],["seriezloaded.com.ng",162],["serijehaha.com",162],["shrugemojis.com",162],["siteapk.net",162],["siteflix.org",162],["sitegames.net",162],["sitekeys.net",162],["sitepdf.com",162],["sitetorrent.com",162],["softwaresite.net",162],["sportbar.live",162],["sportkart1.xyz",162],["ssyoutube.com",162],["stardima.com",162],["stream4free.live",162],["superapk.org",162],["supermovies.org",162],["tainio-mania.online",162],["talaba.su",162],["tamilguns.org",162],["tatabrada.tv",162],["techtrendmakers.com",162],["theflixer.tv",162],["thememypc.net",162],["thetechzone.online",162],["thripy.com",162],["tonnestreamz.xyz",162],["travelplanspro.com",162],["turcasmania.com",162],["tusfiles.com",162],["tvonlinesports.com",162],["ultramovies.org",162],["uploadbank.com",162],["urdubolo.pk",162],["vidspeeds.com",162],["vumoo.to",162],["warezsite.net",162],["watchmovies2.com",162],["watchmoviesforfree.org",162],["watchofree.com",162],["watchsite.net",162],["watchsouthpark.tv",162],["watchtvch.club",162],["web.livecricket.is",162],["webseries.club",162],["worldcupstream.pm",162],["y2mate.com",162],["youapk.net",162],["youtube4kdownloader.com",162],["yts-subs.com",162],["haho.moe",163],["nicy-spicy.pw",164],["novelmultiverse.com",165],["mylegalporno.com",166],["asianembed.io",169],["thecut.com",170],["novelism.jp",171],["alphapolis.co.jp",172],["okrzone.com",173],["game3rb.com",174],["javhub.net",174],["thotvids.com",175],["berklee.edu",176],["rawkuma.com",[177,178]],["moviesjoyhd.to",178],["imeteo.sk",179],["youtubemp3donusturucu.net",180],["surfsees.com",182],["vivo.st",[183,184]],["alueviesti.fi",186],["kiuruvesilehti.fi",186],["lempaala.ideapark.fi",186],["olutposti.fi",186],["urjalansanomat.fi",186],["tainhanhvn.com",188],["titantv.com",189],["3cinfo.net",190],["transportationlies.org",191],["camarchive.tv",192],["crownimg.com",192],["freejav.guru",192],["hentai2read.com",192],["icyporno.com",192],["illink.net",192],["javtiful.com",192],["m-hentai.net",192],["pornblade.com",192],["pornfelix.com",192],["pornxxxxtube.net",192],["redwap.me",192],["redwap2.com",192],["redwap3.com",192],["tubxporn.xxx",192],["ver-comics-porno.com",192],["ver-mangas-porno.com",192],["xanimeporn.com",192],["xxxvideohd.net",192],["zetporn.com",192],["cocomanga.com",193],["sampledrive.in",194],["mcleaks.net",195],["explorecams.com",195],["minecraft.buzz",195],["chillx.top",196],["playerx.stream",196],["m.liputan6.com",198],["stardewids.com",[198,220]],["ingles.com",199],["spanishdict.com",199],["surfline.com",200],["rureka.com",201],["bunkr.is",202],["amateur8.com",203],["freeporn8.com",203],["maturetubehere.com",203],["embedo.co",204],["corriere.it",205],["oggi.it",205],["2the.space",206],["apkcombo.com",207],["sponsorhunter.com",208],["soft98.ir",209],["novelssites.com",210],["torrentmac.net",211],["udvl.com",212],["moviezaddiction.icu",213],["dlpanda.com",214],["socialmediagirls.com",215],["einrichtungsbeispiele.de",216],["weadown.com",217],["molotov.tv",218],["freecoursesonline.me",219],["adelsfun.com",219],["advantien.com",219],["bailbondsfinder.com",219],["bigpiecreative.com",219],["childrenslibrarylady.com",219],["classifarms.com",219],["comtasq.ca",219],["crone.es",219],["ctrmarketingsolutions.com",219],["dropnudes.com",219],["ftuapps.dev",219],["genzsport.com",219],["ghscanner.com",219],["grsprotection.com",219],["gruporafa.com.br",219],["inmatefindcalifornia.com",219],["inmatesearchidaho.com",219],["itsonsitetv.com",219],["mfmfinancials.com",219],["myproplugins.com",219],["onehack.us",219],["ovester.com",219],["paste.bin.sx",219],["privatenudes.com",219],["renoconcrete.ca",219],["richieashbeck.com",219],["sat.technology",219],["short1ink.com",219],["stpm.co.uk",219],["wegotcookies.co",219],["mathcrave.com",219],["commands.gg",220],["smgplaza.com",221],["emturbovid.com",222],["freepik.com",223],["diyphotography.net",225],["bitchesgirls.com",226],["shopforex.online",227],["programmingeeksclub.com",228],["easymc.io",229],["diendancauduong.com",230],["parentcircle.com",231],["h-game18.xyz",232],["nopay.info",233],["wheelofgold.com",234],["shortlinks.tech",235],["skill4ltu.eu",237],["lifestyle.bg",238],["news.bg",238],["topsport.bg",238],["webcafe.bg",238],["freepikdownloader.com",239],["freepasses.org",240],["iusedtobeaboss.com",241],["androidpolice.com",242],["cbr.com",242],["dualshockers.com",242],["gamerant.com",242],["howtogeek.com",242],["thegamer.com",242],["blogtruyenmoi.com",243],["igay69.com",244],["graphicget.com",245],["qiwi.gg",246],["netcine2.la",247],["idnes.cz",[248,249]],["cbc.ca",250],["japscan.lol",251]]);

const entitiesMap = new Map([["kisscartoon",1],["kissasian",7],["ganool",7],["pirate",7],["piratebay",7],["pirateproxy",7],["proxytpb",7],["thepiratebay",7],["limetorrents",[9,15]],["king-pes",9],["depedlps",9],["komikcast",9],["idedroidsafelink",9],["links-url",9],["ak4eg",9],["streanplay",10],["steanplay",10],["liferayiseasy",[11,12]],["pahe",15],["yts",15],["tube8",15],["topeuropix",15],["moviescounter",15],["torrent9",15],["desiremovies",15],["movs4u",15],["uwatchfree",15],["hydrax",15],["4movierulz",15],["projectfreetv",15],["arabseed",15],["btdb",[15,56]],["world4ufree",15],["streamsport",15],["rojadirectatvhd",15],["userload",15],["freecoursesonline",17],["lordpremium",17],["todovieneok",17],["novablogitalia",17],["anisubindo",17],["btvsports",17],["adyou",18],["fxporn69",21],["rexporn",25],["movies07",25],["pornocomics",25],["sexwebvideo",29],["pornomoll",29],["gsurl",32],["mimaletadepeliculas",33],["burningseries",34],["dz4soft",35],["yoututosjeff",35],["ebookmed",35],["lanjutkeun",35],["novelasesp",35],["singingdalong",35],["doujindesu",35],["xmovies8",38],["mega-dvdrip",45],["peliculas-dvdrip",45],["desbloqueador",46],["newpelis",[47,54]],["pelix",[47,54]],["allcalidad",[47,192]],["khatrimaza",47],["camwhores",48],["camwhorestv",48],["uproxy",48],["nekopoi",51],["mirrorace",60],["mixdrp",65],["asiansex",67],["japanfuck",67],["japanporn",67],["teensex",67],["vintagetube",67],["xxxmovies",67],["zooqle",70],["hdfull",74],["mangamanga",76],["streameast",78],["thestreameast",78],["vev",82],["vidop",82],["1337x",84],["x1337x",84],["zone-telechargement",84],["megalink",89],["gmx",90],["mega1080p",95],["9hentai",97],["gaypornhdfree",104],["cinemakottaga",104],["privatemoviez",104],["apkmaven",104],["popcornstream",106],["readcomiconline",116],["fc-lc",133],["pornktube",139],["watchseries",139],["milfnut",140],["azsoft",142],["pagalmovies",148],["7starhd",148],["jalshamoviez",148],["9xupload",148],["bdupload",148],["desiupload",148],["rdxhd1",148],["dropgalaxy",151],["moviessources",159],["nuvid",160],["0gomovie",162],["0gomovies",162],["123moviefree",162],["1kmovies",162],["1madrasdub",162],["1primewire",162],["2embed",162],["2madrasdub",162],["2umovies",162],["4anime",162],["adblockplustape",162],["altadefinizione01",162],["anitube",162],["atomixhq",162],["beinmatch",162],["brmovies",162],["cima4u",162],["clicknupload",162],["cmovies",162],["cricfree",162],["crichd",162],["databasegdriveplayer",162],["dood",162],["f1stream",162],["faselhd",162],["fbstream",162],["file4go",162],["filemoon",162],["filepress",[162,224]],["filmlinks4u",162],["filmpertutti",162],["filmyzilla",162],["fmovies",162],["french-stream",162],["fzlink",162],["gdriveplayer",162],["gofilms4u",162],["gogoanime",162],["gomoviz",162],["hdmoviefair",162],["hdmovies4u",162],["hdmovies50",162],["hdmoviesfair",162],["hh3dhay",162],["hindilinks4u",162],["hotmasti",162],["hurawatch",162],["klmanga",162],["klubsports",162],["libertestreamvf",162],["livetvon",162],["manga1000",162],["manga1001",162],["mangaraw",162],["mangarawjp",162],["mlbstream",162],["motogpstream",162],["movierulz",162],["movies123",162],["movies2watch",162],["moviesden",162],["moviezaddiction",162],["myflixer",162],["nbastream",162],["netcine",162],["nflstream",162],["nhlstream",162],["onlinewatchmoviespk",162],["pctfenix",162],["pctnew",162],["pksmovies",162],["plyjam",162],["plylive",162],["pogolinks",162],["popcorntime",162],["poscitech",162],["prmovies",162],["rugbystreams",162],["shahed4u",162],["sflix",162],["sitesunblocked",162],["solarmovies",162],["sportcast",162],["sportskart",162],["sports-stream",162],["streaming-french",162],["streamers",162],["streamingcommunity",162],["strikeout",162],["t20cup",162],["tennisstreams",162],["torrentdosfilmes",162],["toonanime",162],["tvply",162],["ufcstream",162],["uptomega",162],["uqload",162],["vudeo",162],["vidoo",162],["vipbox",162],["vipboxtv",162],["vipleague",162],["viprow",162],["yesmovies",162],["yomovies",162],["yomovies1",162],["yt2mp3s",162],["kat",162],["katbay",162],["kickass",162],["kickasshydra",162],["kickasskat",162],["kickass2",162],["kickasstorrents",162],["kat2",162],["kattracker",162],["thekat",162],["thekickass",162],["kickassz",162],["kickasstorrents2",162],["topkickass",162],["kickassgo",162],["kkickass",162],["kkat",162],["kickasst",162],["kick4ss",162],["guardaserie",167],["cine-calidad",168],["videovard",185],["gntai",192],["grantorrent",192],["mejortorrent",192],["mejortorrento",192],["mejortorrents",192],["mejortorrents1",192],["mejortorrentt",192],["shineads",194],["bg-gledai",219],["gledaitv",219],["motchill",236]]);

const exceptionsMap = new Map([["mentor.duden.de",[77]],["forum.soft98.ir",[209]]]);

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
