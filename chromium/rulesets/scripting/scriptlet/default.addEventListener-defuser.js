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

const argsList = [["load","Object"],["mousedown","clientX"],["load","hard_block"],["/contextmenu|keydown/"],["","adb"],["click","ClickHandler"],["load","IsAdblockRequest"],["/^(?:click|mousedown)$/","_0x"],["error"],["load","onload"],["","BACK"],["load","getComputedStyle"],["load","adsense"],["load","(!o)"],["load","(!i)"],["","_0x"],["","Adblock"],["load","nextFunction"],["/^(?:click|mousedown)$/","bypassEventsInProxies"],["","window.open"],["","open"],["click","exopop"],["/^(?:load|click)$/","popMagic"],["mousedown","popundrInit"],["getexoloader"],["","pop"],["load","exoJsPop101"],["/^loadex/"],["","/exo"],["","_blank"],["",";}"],["load","BetterPop"],["mousedown","preventDefault"],["load","advertising"],["mousedown","localStorage"],["click","preventDefault"],["load","2000"],["/^(click|mousedown|mousemove|touchstart|touchend|touchmove)/","system.popunder"],["load","adb"],["/^(?:click|mousedown|mousemove|touchstart|touchend|touchmove)$/","system.popunder"],["","'0x"],["/DOMContentLoaded|load/","y.readyState"],["/error|canplay/","(t)"],["load","hblocked"],["error","Adblocker"],["DOMContentLoaded","adlinkfly"],["DOMContentLoaded","shortener"],["mousedown","trigger"],["","0x"],["","Pop"],["/^(?:click|mousedown)$/","popunder"],["DOMContentLoaded","preventExit"],["mouseup","_blank"],["","adsense"],["load"],["click","pop_under"],["load","url"],["load","adverts-top-container"],["","Date"],["DOMContentLoaded","&nbsp"],["click","read_cookie"],["","midRoll"],["click","_0x"],["load","isBlanketFound"],["load","showModal"],["click","trigger"],["mouseout","clientWidth"],["load","download-wrapper"],["load","autoRecov"],["popstate","noPop"],["/^(?:click|mousedown)$/","ppu"],["click","native code"],["/^(?:mousedown|mouseup)$/","0x"],["click","popundr"],["click"],["DOMContentLoaded","compupaste"],["mousedown","!!{});"],["DOMContentLoaded","/adblock/i"],["keydown"],["DOMContentLoaded","isMobile"],["/^/","0x"],["load","PrivateMode"],["scroll","_0x"],["DOMContentLoaded","checkVPN"],["/^(?:click|mousedown|mouseup)$/","di()"],["","\\"],["popstate"],["click","my_inter_listen"],["load","appendChild"],["","bi()"],["","checkTarget"],["click","popunder"],["timeupdate"],["scroll","getElementById"],["load","undefined"],["DOMContentLoaded","scriptwz_url"],["load","0x"],["DOMContentLoaded","btoa"],["adblockActivated"],["click","saveLastEvent"],["DOMContentLoaded","offsetHeight"],["","show"],["/.?/","popMagic"],["","ads"],["click","interstitial"],["load","antiblock"],["DOMContentLoaded","adsBlocked"],["load",".appendChild"],["","btoa"],["","exopop"],["DOMContentLoaded","AdBlock"],["load","blocker"],["mouseleave","NativeDisplayAdID"],["mouseover","event.triggered"],["load","removeChild"],["load","ads"],["click","ShouldShow"],["click","clickCount"],["/adblock/i"],["load","doTest"],["DOMContentLoaded","antiAdBlockerHandler"],["DOMContentLoaded","daadb_get_data_fetch"],["click","splashPage"],["load","detect-modal"],["load","_0x"],["DOMContentLoaded","canRedirect"],["DOMContentLoaded","adb"],["error","/\\{[a-z]\\(e\\)\\}/"],["load","adblock"],["/touchmove|wheel/","preventDefault()"],["load","showcfkModal"],["DOMContentLoaded","iframe"],["","/_blank/i"],["load","htmls"],["blur","focusOut"],["click","handleClick"],["load","bypass"],["DOMContentLoaded","location.href"],["","popMagic"],["contextmenu"],["blur","counter"],["/^(?:click|mousedown)$/","latest!=="],["DOMContentLoaded",".ready"],["load","script"],["","/pop|wm|forceClick/"],["load","block"],["","/_0x|localStorage\\.getItem/"],["DOMContentLoaded","adblock"],["load","head"],["visibilitychange"],["load","/showModal|isBlanketFound/"],["click","shouldShow"],["","/ads|Modal/"],["DOMContentLoaded","init"],["load","Adblock"],["DOMContentLoaded","window.open"],["","vads"],["devtoolschange"],["click","open"],["beforeunload"],["","break;case $."],["mouseup","decodeURIComponent"],["/(?:click|touchend)/","_0x"],["","removeChild"],["click","pu_count"],["","/pop|_blank/"],["click","allclick_Public"],["click","0x"],["/touchstart|mousedown|click/","latest"],["blur","native code"],["blur","event.simulate"],["click","_blank"],["DOMContentLoaded","0x"],["click","overlay"],["scroll","undefined"],["readystatechange","document.removeEventListener"],["mousedown","shown_at"],["scroll","detect"],["click","t(a)"],["","focus"],["DOMContentLoaded","deblocker"],["","preventDefault"],["click","tabunder"],["mouseup","catch"],["scroll","innerHeight"],["hashchange"],["load","/nextFunction|2000/"],["load","player"],["","document.oncontextmenu"],["","about:blank"],["click","popMagic"],["load","popMagic"],["DOMContentLoaded","adsSrc"],["np.detect"],["click","Popup"],["","/open.*_blank/"],["scroll"],["","isBlocking"],["timeupdate","","elements",".quiver-cam-player--ad-not-running.quiver-cam-player--free video"],["","$"],["","exoJsPop101"],["/click|mousedown/","catch"],["","init"],["adb"],["scroll","modal"],["DOMContentLoaded","clientHeight"],["click","window.focus"],["click","[native code]"],["click","event.dispatch"],["","Math"],["DOMContentLoaded","popupurls"],["","tabUnder"],["load","XMLHttpRequest"],["load","puURLstrpcht"],["load","AdBlocker"],["","showModal"],["","goog"],["load","abDetectorPro"],["","document.body"],["","modal"],["click","pop"],["click","adobeModalTestABenabled"],["blur","console.log"],["","AdB"],["load","adSession"],["load","Ads"],["DOMContentLoaded","googlesyndication"],["np.evtdetect"],["load","popunder"],["scroll","function(e)"],["DOMContentLoaded","adlinkfly_url"],["mousedown"],["load","document.getElementById"],["mousedown","tabUnder"],["click","popactive"],["load","adsbygoogle"],["load","modal_blocker"],["click","isOpened"],["mousedown","pop.doEvent"],["error","blocker"],["click","alink"],["","daadb"],["load","google-analytics"],["","sessionStorage"],["load","fetch"],["click","pingUrl"],["mousedown","scoreUrl"],["click","/event_callback=function\\(\\){window\\.location=t\\.getAttribute\\(\"href\"\\)/"],["load","/\\('id'\\)|setTimeout/"],["","Adb"]];

const hostnamesMap = new Map([["newser.com",0],["sport1.de",2],["userscloud.com",3],["timesofindia.indiatimes.com",4],["drrtyr.mx",4],["pinoyalbums.com",4],["multiplayer.it",4],["mediafire.com",[5,6]],["pinsystem.co.uk",7],["fembed.com",7],["ancensored.com",7],["mp3fiber.com",[7,17]],["xrivonet.info",7],["afreesms.com",8],["tu.no",8],["tio.ch",8],["lavanguardia.com",8],["eplayer.click",8],["kingofdown.com",9],["radiotormentamx.com",9],["quelleestladifference.fr",9],["otakuworldsite.blogspot.com",9],["ad-itech.blogspot.com",9],["sna3talaflam.com",9],["agar.pro",9],["unlockapk.com",9],["mobdi3ips.com",9],["socks24.org",9],["interviewgig.com",9],["javaguides.net",9],["almohtarif-tech.net",9],["forum.release-apk.com",9],["devoloperxda.blogspot.com",9],["zwergenstadt.com",9],["primedeportes.es",9],["9goals.live",9],["upxin.net",9],["ciudadblogger.com",9],["ke-1.com",9],["secretsdeepweb.blogspot.com",9],["bit-shares.com",9],["itdmusics.com",9],["aspdotnet-suresh.com",9],["tudo-para-android.com",9],["urdulibrarypk.blogspot.com",9],["zerotopay.com",9],["akw.to",9],["mawsueaa.com",9],["hesgoal-live.io",9],["king-shoot.io",9],["bibme.org",13],["citationmachine.net",13],["easybib.com",14],["vermangasporno.com",15],["imgtorrnt.in",15],["picbaron.com",[15,138]],["letmejerk.com",15],["letmejerk2.com",15],["letmejerk3.com",15],["letmejerk4.com",15],["letmejerk5.com",15],["letmejerk6.com",15],["letmejerk7.com",15],["dlapk4all.com",15],["kropic.com",15],["kvador.com",15],["pdfindir.net",15],["brstej.com",15],["topwwnews.com",15],["xsanime.com",15],["vidlo.us",15],["put-locker.com",15],["youx.xxx",15],["animeindo.asia",15],["masahub.net",15],["adclickersbot.com",15],["badtaste.it",16],["mage.si",17],["totaldebrid.org",17],["neko-miku.com",17],["elsfile.org",17],["venstrike.jimdofree.com",17],["schrauben-normen.de",17],["avengerinator.blogspot.com",17],["link-to.net",17],["hanimesubth.com",17],["gsmturkey.net",17],["adshrink.it",17],["presentation-ppt.com",17],["mangacanblog.com",17],["pekalongan-cits.blogspot.com",17],["4tymode.win",17],["eurotruck2.com.br",17],["linkvertise.com",17],["reifenrechner.at",17],["tire-size-calculator.info",17],["linuxsecurity.com",17],["encodinghub.com",17],["itsguider.com",17],["cotravinh.blogspot.com",17],["itudong.com",17],["shortx.net",17],["lecturel.com",17],["bakai.org",17],["nar.k-ba.net",17],["tiroalpalo.org",17],["shemalez.com",19],["tubepornclassic.com",19],["gotporn.com",20],["freepornrocks.com",20],["tvhai.org",20],["simpcity.su",20],["realgfporn.com",[21,22]],["titsbox.com",21],["thisvid.com",22],["xvideos-downloader.net",22],["imgspice.com",23],["vikiporn.com",24],["tnaflix.com",24],["hentai2w.com",[24,190]],["yourlust.com",24],["hotpornfile.org",24],["watchfreexxx.net",24],["vintageporntubes.com",24],["angelgals.com",24],["babesexy.com",24],["porndaa.com",24],["ganstamovies.com",24],["youngleak.com",24],["porndollz.com",24],["xnxxvideo.pro",24],["xvideosxporn.com",24],["filmpornofrancais.fr",24],["pictoa.com",[24,48]],["adultasianporn.com",24],["nsfwmonster.com",24],["girlsofdesire.org",24],["gaytail.com",24],["fetish-bb.com",24],["rumporn.com",24],["soyoungteens.com",24],["zubby.com",24],["lesbian8.com",24],["gayforfans.com",24],["reifporn.de",24],["javtsunami.com",24],["18tube.sex",24],["xxxextreme.org",24],["amateurs-fuck.com",24],["sex-amateur-clips.com",24],["hentaiworld.tv",24],["dads-banging-teens.com",24],["home-xxx-videos.com",24],["mature-chicks.com",24],["teens-fucking-matures.com",24],["hqbang.com",24],["darknessporn.com",24],["familyporner.com",24],["freepublicporn.com",24],["pisshamster.com",24],["punishworld.com",24],["xanimu.com",24],["pornhd.com",25],["cnnamador.com",[25,37]],["cle0desktop.blogspot.com",25],["turkanime.co",25],["camclips.tv",[25,49]],["blackpornhq.com",25],["xsexpics.com",25],["ulsex.net",25],["wannafreeporn.com",25],["ytube2dl.com",25],["multiup.us",25],["protege-torrent.com",25],["pussyspace.com",[26,27]],["pussyspace.net",[26,27]],["empflix.com",28],["cpmlink.net",29],["bdsmstreak.com",29],["cutpaid.com",29],["pornforrelax.com",29],["fatwhitebutt.com",29],["mavplay.xyz",29],["sunporno.com",[30,31,190]],["short.pe",32],["bs.to",35],["efukt.com",35],["generacionretro.net",36],["nuevos-mu.ucoz.com",36],["micloudfiles.com",36],["mimaletamusical.blogspot.com",36],["visionias.net",36],["b3infoarena.in",36],["lurdchinexgist.blogspot.com",36],["thefreedommatrix.blogspot.com",36],["hentai-vl.blogspot.com",36],["projetomotog.blogspot.com",36],["ktmx.pro",36],["lirik3satu.blogspot.com",36],["marketmovers.it",36],["pharmaguideline.com",36],["safemaru.blogspot.com",36],["mixloads.com",36],["mangaromance.eu",36],["interssh.com",36],["freesoftpdfdownload.blogspot.com",36],["cirokun.blogspot.com",36],["myadslink.com",36],["blackavelic.com",36],["server.satunivers.tv",36],["eg-akw.com",36],["xn--mgba7fjn.cc",36],["flashingjungle.com",37],["ma-x.org",38],["lavozdegalicia.es",38],["xmovies08.org",40],["globaldjmix.com",41],["zazzybabes.com",42],["haaretz.co.il",43],["haaretz.com",43],["slate.com",44],["megalinks.info",45],["megapastes.com",45],["mega-mkv.com",[45,46]],["mkv-pastes.com",45],["zpaste.net",45],["zlpaste.net",45],["9xlinks.site",45],["zona-leros.net",46],["acortarm.xyz",47],["acortame.xyz",47],["cine.to",[48,195]],["kissasia.cc",48],["digjav.com",49],["videoszoofiliahd.com",50],["xxxtubezoo.com",51],["zooredtube.com",51],["uii.io",52],["megacams.me",54],["rlslog.net",54],["porndoe.com",55],["acienciasgalilei.com",57],["playrust.io",58],["payskip.org",59],["short-url.link",60],["tubedupe.com",61],["mcrypto.club",62],["fatgirlskinny.net",63],["polska-ie.com",63],["windowsmatters.com",63],["canaltdt.es",64],["masbrooo.com",64],["2ndrun.tv",64],["stfly.me",65],["oncehelp.com",65],["queenfaucet.website",65],["curto.win",65],["smallseotools.com",66],["macwelt.de",68],["pcwelt.de",68],["capital.de",68],["geo.de",68],["allmomsex.com",69],["allnewindianporn.com",69],["analxxxvideo.com",69],["animalextremesex.com",69],["anime3d.xyz",69],["animefuckmovies.com",69],["animepornfilm.com",69],["animesexbar.com",69],["animesexclip.com",69],["animexxxsex.com",69],["animexxxfilms.com",69],["anysex.club",69],["apetube.asia",69],["asianfuckmovies.com",69],["asianfucktube.com",69],["asianporn.sexy",69],["asiansexcilps.com",69],["beeg.fund",69],["beegvideoz.com",69],["bestasiansex.pro",69],["bravotube.asia",69],["brutalanimalsfuck.com",69],["candyteenporn.com",69],["daddyfuckmovies.com",69],["desifuckonline.com",69],["exclusiveasianporn.com",69],["exteenporn.com",69],["fantasticporn.net",69],["fantasticyoungporn.com",69],["fineasiansex.com",69],["firstasianpussy.com",69],["freeindiansextube.com",69],["freepornasians.com",69],["freerealvideo.com",69],["fuck-beeg.com",69],["fuck-xnxx.com",69],["fuckasian.pro",69],["fuckfuq.com",69],["fuckundies.com",69],["gojapaneseporn.com",69],["golderotica.com",69],["goodyoungsex.com",69],["goyoungporn.com",69],["hardxxxmoms.com",69],["hdvintagetube.com",69],["hentaiporn.me",69],["hentaisexfilms.com",69],["hentaisexuality.com",69],["hot-teens-movies.mobi",69],["hotanimepornvideos.com",69],["hotanimevideos.com",69],["hotasianpussysex.com",69],["hotjapaneseshows.com",69],["hotmaturetube.com",69],["hotmilfs.pro",69],["hotorientalporn.com",69],["hotpornyoung.com",69],["hotxxxjapanese.com",69],["hotxxxpussy.com",69],["indiafree.net",69],["indianpornvideo.online",69],["japanpornclip.com",69],["japanesetube.video",69],["japansex.me",69],["japanesexxxporn.com",69],["japansporno.com",69],["japanxxx.asia",69],["japanxxxworld.com",69],["keezmovies.surf",69],["lingeriefuckvideo.com",69],["liveanimalporn.zooo.club",69],["madhentaitube.com",69],["megahentaitube.com",69],["megajapanesesex.com",69],["megajapantube.com",69],["milfxxxpussy.com",69],["momsextube.pro",69],["momxxxass.com",69],["monkeyanimalporn.com",69],["moviexxx.mobi",69],["newanimeporn.com",69],["newjapanesexxx.com",69],["nicematureporn.com",69],["nudeplayboygirls.com",69],["openxxxporn.com",69],["originalindianporn.com",69],["originalteentube.com",69],["pig-fuck.com",69],["plainasianporn.com",69],["popularasianxxx.com",69],["pornanimetube.com",69],["pornasians.pro",69],["pornhat.asia",69],["pornheed.online",69],["pornjapanesesex.com",69],["pornomovies.asia",69],["pornvintage.tv",69],["primeanimesex.com",69],["realjapansex.com",69],["realmomsex.com",69],["redsexhub.com",69],["retroporn.world",69],["retrosexfilms.com",69],["sex-free-movies.com",69],["sexanimesex.com",69],["sexanimetube.com",69],["sexjapantube.com",69],["sexmomvideos.com",69],["sexteenxxxtube.com",69],["sexxxanimal.com",69],["sexyoungtube.com",69],["sexyvintageporn.com",69],["sopornmovies.com",69],["spicyvintageporn.com",69],["sunporno.club",69],["tabooanime.club",69],["teenextrem.com",69],["teenfucksex.com",69],["teenhost.net",69],["teensexass.com",69],["tnaflix.asia",69],["totalfuckmovies.com",69],["totalmaturefuck.com",69],["txxx.asia",69],["voyeurpornsex.com",69],["warmteensex.com",69],["wetasiancreampie.com",69],["wildhentaitube.com",69],["wowyoungsex.com",69],["xhamster-art.com",69],["xmovie.pro",69],["xnudevideos.com",69],["xnxxjapon.com",69],["xpics.me",69],["xvide.me",69],["xxxanimefuck.com",69],["xxxanimevideos.com",69],["xxxanimemovies.com",69],["xxxhentaimovies.com",69],["xxxhothub.com",69],["xxxjapaneseporntube.com",69],["xxxlargeporn.com",69],["xxxmomz.com",69],["xxxpornmilf.com",69],["xxxpussyclips.com",69],["xxxpussysextube.com",69],["xxxretrofuck.com",69],["xxxsex.pro",69],["xxxsexyjapanese.com",69],["xxxteenyporn.com",69],["xxxvideo.asia",69],["xxxvideos.ink",69],["xxxyoungtv.com",69],["youjizzz.club",69],["youngpussyfuck.com",69],["bayimg.com",70],["celeb.gate.cc",71],["masterplayer.xyz",73],["pussy-hub.com",73],["porndex.com",74],["compucalitv.com",75],["diariodenavarra.es",77],["duden.de",79],["pennlive.com",81],["beautypageants.indiatimes.com",82],["01fmovies.com",83],["lnk2.cc",85],["fullhdxxx.com",86],["luscious.net",[86,138]],["classicpornbest.com",86],["xstory-fr.com",86],["1youngteenporn.com",86],["www-daftarharga.blogspot.com",[86,179]],["miraculous.to",[86,185]],["vtube.to",86],["gosexpod.com",87],["otakukan.com",88],["xcafe.com",89],["pornfd.com",89],["venusarchives.com",89],["imagehaha.com",90],["imagenpic.com",90],["imageshimage.com",90],["imagetwist.com",90],["k1nk.co",91],["watchasians.cc",91],["alexsports.xyz",91],["lulustream.com",91],["luluvdo.com",91],["web.de",92],["news18.com",93],["thelanb.com",94],["dropmms.com",94],["softwaredescargas.com",95],["cracking-dz.com",96],["anitube.ninja",97],["gazzetta.it",98],["port.hu",100],["dziennikbaltycki.pl",101],["dzienniklodzki.pl",101],["dziennikpolski24.pl",101],["dziennikzachodni.pl",101],["echodnia.eu",101],["expressbydgoski.pl",101],["expressilustrowany.pl",101],["gazetakrakowska.pl",101],["gazetalubuska.pl",101],["gazetawroclawska.pl",101],["gk24.pl",101],["gloswielkopolski.pl",101],["gol24.pl",101],["gp24.pl",101],["gra.pl",101],["gs24.pl",101],["kurierlubelski.pl",101],["motofakty.pl",101],["naszemiasto.pl",101],["nowiny24.pl",101],["nowosci.com.pl",101],["nto.pl",101],["polskatimes.pl",101],["pomorska.pl",101],["poranny.pl",101],["sportowy24.pl",101],["strefaagro.pl",101],["strefabiznesu.pl",101],["stronakobiet.pl",101],["telemagazyn.pl",101],["to.com.pl",101],["wspolczesna.pl",101],["course9x.com",101],["courseclub.me",101],["azrom.net",101],["alttyab.net",101],["esopress.com",101],["nesiaku.my.id",101],["onemanhua.com",102],["freeindianporn.mobi",102],["dr-farfar.com",103],["boyfriendtv.com",104],["brandstofprijzen.info",105],["netfuck.net",106],["blog24.me",[106,133]],["kisahdunia.com",106],["javsex.to",106],["nulljungle.com",106],["oyuncusoruyor.com",106],["pbarecap.ph",106],["sourds.net",106],["teknobalta.com",106],["tvinternetowa.info",106],["sqlserveregitimleri.com",106],["tutcourse.com",106],["readytechflip.com",106],["novinhastop.com",106],["warddogs.com",106],["dvdgayporn.com",106],["iimanga.com",106],["tinhocdongthap.com",106],["tremamnon.com",106],["423down.com",106],["brizzynovel.com",106],["jugomobile.com",106],["freecodezilla.net",106],["animekhor.xyz",106],["iconmonstr.com",106],["gay-tubes.cc",106],["rbxscripts.net",106],["comentariodetexto.com",106],["wordpredia.com",106],["livsavr.co",106],["allfaucet.xyz",[106,133]],["titbytz.tk",106],["replica-watch.info",106],["alludemycourses.com",106],["kayifamilytv.com",106],["iir.ai",107],["gameofporn.com",109],["qpython.club",110],["antifake-funko.fr",110],["dktechnicalmate.com",110],["recipahi.com",110],["e9china.net",111],["ontools.net",111],["marketbeat.com",112],["hentaipornpics.net",113],["apps2app.com",114],["alliptvlinks.com",115],["waterfall.money",115],["xvideos.com",116],["xvideos2.com",116],["homemoviestube.com",117],["sexseeimage.com",117],["tubereader.me",118],["repretel.com",118],["dagensnytt.com",119],["mrproblogger.com",119],["themezon.net",119],["gfx-station.com",120],["bitzite.com",[120,133,137]],["historyofroyalwomen.com",121],["davescomputertips.com",121],["ukchat.co.uk",122],["hivelr.com",123],["embedz.click",124],["skidrowcodex.net",125],["takimag.com",126],["digi.no",127],["scimagojr.com",128],["haxina.com",128],["cryptofenz.xyz",128],["twi-fans.com",129],["learn-cpp.org",130],["upshrink.com",131],["ohionowcast.info",133],["wiour.com",133],["appsbull.com",133],["diudemy.com",133],["maqal360.com",133],["bitcotasks.com",133],["videolyrics.in",133],["manofadan.com",133],["cempakajaya.com",133],["tagecoin.com",133],["doge25.in",133],["king-ptcs.com",133],["naijafav.top",133],["ourcoincash.xyz",133],["sh.techsamir.com",133],["claimcoins.site",133],["cryptosh.pro",133],["coinsrev.com",133],["go.freetrx.fun",133],["eftacrypto.com",133],["fescrypto.com",133],["earnhub.net",133],["kiddyshort.com",133],["tronxminer.com",133],["homeairquality.org",134],["exego.app",135],["cutlink.net",135],["cutsy.net",135],["cutyurls.com",135],["cutty.app",135],["cutnet.net",135],["adcrypto.net",136],["admediaflex.com",136],["aduzz.com",136],["bitcrypto.info",136],["cdrab.com",136],["datacheap.io",136],["hbz.us",136],["savego.org",136],["owsafe.com",136],["sportweb.info",136],["aiimgvlog.fun",138],["6indianporn.com",138],["amateurebonypics.com",138],["amateuryoungpics.com",138],["cinemabg.net",138],["coomer.su",138],["desimmshd.com",138],["frauporno.com",138],["givemeaporn.com",138],["jav-asia.top",138],["javf.net",138],["javideo.net",138],["kemono.su",138],["kr18plus.com",138],["pilibook.com",138],["pornborne.com",138],["porngrey.com",138],["qqxnxx.com",138],["sexvideos.host",138],["submilf.com",138],["subtaboo.com",138],["tktube.com",138],["xfrenchies.com",138],["coingraph.us",139],["momo-net.com",139],["maxgaming.fi",139],["travel.vebma.com",140],["cloud.majalahhewan.com",140],["crm.cekresi.me",140],["ai.tempatwisata.pro",140],["pinloker.com",140],["sekilastekno.com",140],["vulture.com",141],["megaplayer.bokracdn.run",142],["hentaistream.com",143],["siteunblocked.info",144],["larvelfaucet.com",145],["feyorra.top",145],["claimtrx.com",145],["moviesyug.net",146],["w4files.ws",146],["parispi.net",147],["simkl.com",148],["paperzonevn.com",149],["dailyvideoreports.net",150],["lewd.ninja",151],["systemnews24.com",152],["incestvidz.com",153],["niusdiario.es",154],["playporngames.com",155],["movi.pk",[156,160]],["justin.mp3quack.lol",158],["cutesexyteengirls.com",159],["0dramacool.net",160],["185.53.88.104",160],["185.53.88.204",160],["185.53.88.15",160],["123movies4k.net",160],["1movieshd.com",160],["1rowsports.com",160],["4share-mp3.net",160],["6movies.net",160],["9animetv.to",160],["720pstream.me",160],["aagmaal.com",160],["abysscdn.com",160],["ajkalerbarta.com",160],["akstream.xyz",160],["androidapks.biz",160],["androidsite.net",160],["animeonlinefree.org",160],["animesite.net",160],["animespank.com",160],["aniworld.to",160],["apkmody.io",160],["appsfree4u.com",160],["audioz.download",160],["awafim.tv",160],["bdnewszh.com",160],["beastlyprints.com",160],["bengalisite.com",160],["bestfullmoviesinhd.org",160],["betteranime.net",160],["blacktiesports.live",160],["buffsports.stream",160],["ch-play.com",160],["clickforhire.com",160],["cloudy.pk",160],["computercrack.com",160],["coolcast2.com",160],["crackedsoftware.biz",160],["crackfree.org",160],["cracksite.info",160],["cryptoblog24.info",160],["cuatrolatastv.blogspot.com",160],["cydiasources.net",160],["dirproxy.com",160],["dopebox.to",160],["downloadapk.info",160],["downloadapps.info",160],["downloadgames.info",160],["downloadmusic.info",160],["downloadsite.org",160],["downloadwella.com",160],["ebooksite.org",160],["educationtips213.blogspot.com",160],["egyup.live",160],["embed.meomeo.pw",160],["embed.scdn.to",160],["emulatorsite.com",160],["essaysharkwriting.club",160],["exploreera.net",160],["extrafreetv.com",160],["fakedetail.com",160],["fclecteur.com",160],["files.im",160],["flexyhit.com",160],["fmoviefree.net",160],["fmovies24.com",160],["footyhunter3.xyz",160],["freeflix.info",160],["freemoviesu4.com",160],["freeplayervideo.com",160],["freesoccer.net",160],["fseries.org",160],["gamefast.org",160],["gamesite.info",160],["gettapeads.com",160],["gmanga.me",160],["gocast123.me",160],["gogohd.net",160],["gogoplay5.com",160],["gooplay.net",160],["gostreamon.net",160],["happy2hub.org",160],["harimanga.com",160],["healthnewsreel.com",160],["hexupload.net",160],["hinatasoul.com",160],["hindisite.net",160],["holymanga.net",160],["hxfile.co",160],["isosite.org",160],["iv-soft.com",160],["januflix.expert",160],["jewelry.com.my",160],["johnwardflighttraining.com",160],["kabarportal.com",160],["kstorymedia.com",160],["la123movies.org",160],["lespassionsdechinouk.com",160],["lilymanga.net",160],["linksdegrupos.com.br",160],["livestreamtv.pk",160],["macsite.info",160],["mangapt.com",160],["mangasite.org",160],["manhuascan.com",160],["megafilmeshdseries.com",160],["megamovies.org",160],["membed.net",160],["moddroid.com",160],["moviefree2.com",160],["movies-watch.com.pk",160],["moviesite.app",160],["moviesonline.fm",160],["moviesx.org",160],["msmoviesbd.com",160],["musicsite.biz",160],["myfernweh.com",160],["myviid.com",160],["nazarickol.com",160],["noob4cast.com",160],["nsw2u.com",[160,249]],["oko.sh",160],["olympicstreams.me",160],["orangeink.pk",160],["owllink.net",160],["pahaplayers.click",160],["patchsite.net",160],["pdfsite.net",160],["play1002.com",160],["player-cdn.com",160],["productkeysite.com",160],["projectfreetv.one",160],["romsite.org",160],["rufiguta.com",160],["rytmp3.io",160],["send.cm",160],["seriesite.net",160],["seriezloaded.com.ng",160],["serijehaha.com",160],["shrugemojis.com",160],["siteapk.net",160],["siteflix.org",160],["sitegames.net",160],["sitekeys.net",160],["sitepdf.com",160],["sitetorrent.com",160],["softwaresite.net",160],["sportbar.live",160],["sportkart1.xyz",160],["ssyoutube.com",160],["stardima.com",160],["stream4free.live",160],["superapk.org",160],["supermovies.org",160],["tainio-mania.online",160],["talaba.su",160],["tamilguns.org",160],["tatabrada.tv",160],["techtrendmakers.com",160],["theflixer.tv",160],["thememypc.net",160],["thetechzone.online",160],["thripy.com",160],["tonnestreamz.xyz",160],["travelplanspro.com",160],["turcasmania.com",160],["tusfiles.com",160],["tvonlinesports.com",160],["ultramovies.org",160],["uploadbank.com",160],["urdubolo.pk",160],["vidspeeds.com",160],["vumoo.to",160],["warezsite.net",160],["watchmovies2.com",160],["watchmoviesforfree.org",160],["watchofree.com",160],["watchsite.net",160],["watchsouthpark.tv",160],["watchtvch.club",160],["web.livecricket.is",160],["webseries.club",160],["worldcupstream.pm",160],["y2mate.com",160],["youapk.net",160],["youtube4kdownloader.com",160],["yts-subs.com",160],["haho.moe",161],["nicy-spicy.pw",162],["novelmultiverse.com",163],["mylegalporno.com",164],["asianembed.io",167],["thecut.com",168],["novelism.jp",169],["alphapolis.co.jp",170],["okrzone.com",171],["game3rb.com",172],["javhub.net",172],["thotvids.com",173],["berklee.edu",174],["rawkuma.com",[175,176]],["moviesjoyhd.to",176],["imeteo.sk",177],["youtubemp3donusturucu.net",178],["surfsees.com",180],["vivo.st",[181,182]],["alueviesti.fi",184],["kiuruvesilehti.fi",184],["lempaala.ideapark.fi",184],["olutposti.fi",184],["urjalansanomat.fi",184],["tainhanhvn.com",186],["titantv.com",187],["3cinfo.net",188],["transportationlies.org",189],["camarchive.tv",190],["crownimg.com",190],["freejav.guru",190],["hentai2read.com",190],["icyporno.com",190],["illink.net",190],["javtiful.com",190],["m-hentai.net",190],["pornblade.com",190],["pornfelix.com",190],["pornxxxxtube.net",190],["redwap.me",190],["redwap2.com",190],["redwap3.com",190],["tubxporn.xxx",190],["ver-comics-porno.com",190],["ver-mangas-porno.com",190],["xanimeporn.com",190],["xxxvideohd.net",190],["zetporn.com",190],["cocomanga.com",191],["sampledrive.in",192],["mcleaks.net",193],["explorecams.com",193],["minecraft.buzz",193],["chillx.top",194],["playerx.stream",194],["m.liputan6.com",196],["stardewids.com",[196,218]],["ingles.com",197],["spanishdict.com",197],["surfline.com",198],["rureka.com",199],["bunkr.is",200],["amateur8.com",201],["freeporn8.com",201],["maturetubehere.com",201],["embedo.co",202],["corriere.it",203],["oggi.it",203],["2the.space",204],["apkcombo.com",205],["sponsorhunter.com",206],["soft98.ir",207],["novelssites.com",208],["torrentmac.net",209],["udvl.com",210],["moviezaddiction.icu",211],["dlpanda.com",212],["socialmediagirls.com",213],["einrichtungsbeispiele.de",214],["weadown.com",215],["molotov.tv",216],["freecoursesonline.me",217],["adelsfun.com",217],["advantien.com",217],["bailbondsfinder.com",217],["bigpiecreative.com",217],["childrenslibrarylady.com",217],["classifarms.com",217],["comtasq.ca",217],["crone.es",217],["ctrmarketingsolutions.com",217],["dropnudes.com",217],["ftuapps.dev",217],["genzsport.com",217],["ghscanner.com",217],["grsprotection.com",217],["gruporafa.com.br",217],["inmatefindcalifornia.com",217],["inmatesearchidaho.com",217],["itsonsitetv.com",217],["mfmfinancials.com",217],["myproplugins.com",217],["onehack.us",217],["ovester.com",217],["paste.bin.sx",217],["privatenudes.com",217],["renoconcrete.ca",217],["richieashbeck.com",217],["sat.technology",217],["short1ink.com",217],["stpm.co.uk",217],["wegotcookies.co",217],["mathcrave.com",217],["commands.gg",218],["smgplaza.com",219],["emturbovid.com",220],["freepik.com",221],["diyphotography.net",223],["bitchesgirls.com",224],["shopforex.online",225],["programmingeeksclub.com",226],["easymc.io",227],["diendancauduong.com",228],["parentcircle.com",229],["h-game18.xyz",230],["nopay.info",231],["wheelofgold.com",232],["shortlinks.tech",233],["skill4ltu.eu",235],["freepikdownloader.com",236],["freepasses.org",237],["iusedtobeaboss.com",238],["androidpolice.com",239],["cbr.com",239],["dualshockers.com",239],["gamerant.com",239],["howtogeek.com",239],["thegamer.com",239],["blogtruyenmoi.com",240],["igay69.com",241],["graphicget.com",242],["qiwi.gg",243],["netcine2.la",244],["idnes.cz",[245,246]],["cbc.ca",247],["japscan.lol",248]]);

const entitiesMap = new Map([["kisscartoon",1],["kissasian",7],["ganool",7],["pirate",7],["piratebay",7],["pirateproxy",7],["proxytpb",7],["thepiratebay",7],["limetorrents",[9,15]],["king-pes",9],["depedlps",9],["komikcast",9],["idedroidsafelink",9],["links-url",9],["ak4eg",9],["streanplay",10],["steanplay",10],["liferayiseasy",[11,12]],["pahe",15],["yts",15],["tube8",15],["topeuropix",15],["moviescounter",15],["torrent9",15],["desiremovies",15],["movs4u",15],["uwatchfree",15],["hydrax",15],["4movierulz",15],["projectfreetv",15],["arabseed",15],["btdb",[15,58]],["world4ufree",15],["streamsport",15],["rojadirectatvhd",15],["userload",15],["freecoursesonline",17],["lordpremium",17],["todovieneok",17],["novablogitalia",17],["anisubindo",17],["btvsports",17],["adyou",18],["fxporn69",21],["rexporn",25],["movies07",25],["pornocomics",25],["sexwebvideo",29],["pornomoll",29],["gsurl",32],["mimaletadepeliculas",33],["readcomiconline",34],["burningseries",35],["dz4soft",36],["yoututosjeff",36],["ebookmed",36],["lanjutkeun",36],["novelasesp",36],["singingdalong",36],["doujindesu",36],["xmovies8",39],["mega-dvdrip",46],["peliculas-dvdrip",46],["desbloqueador",47],["newpelis",[48,56]],["pelix",[48,56]],["allcalidad",[48,190]],["khatrimaza",48],["camwhores",49],["camwhorestv",49],["uproxy",49],["nekopoi",53],["mirrorace",62],["mixdrp",67],["asiansex",69],["japanfuck",69],["japanporn",69],["teensex",69],["vintagetube",69],["xxxmovies",69],["zooqle",72],["hdfull",76],["mangamanga",78],["streameast",80],["thestreameast",80],["vev",84],["vidop",84],["1337x",86],["zone-telechargement",86],["megalink",91],["gmx",92],["mega1080p",97],["9hentai",99],["gaypornhdfree",106],["cinemakottaga",106],["privatemoviez",106],["apkmaven",106],["popcornstream",108],["fc-lc",132],["pornktube",138],["watchseries",138],["milfnut",139],["pagalmovies",146],["7starhd",146],["jalshamoviez",146],["9xupload",146],["bdupload",146],["desiupload",146],["rdxhd1",146],["moviessources",157],["nuvid",158],["0gomovie",160],["0gomovies",160],["123moviefree",160],["1kmovies",160],["1madrasdub",160],["1primewire",160],["2embed",160],["2madrasdub",160],["2umovies",160],["4anime",160],["adblockplustape",160],["altadefinizione01",160],["anitube",160],["atomixhq",160],["beinmatch",160],["brmovies",160],["cima4u",160],["clicknupload",160],["cmovies",160],["cricfree",160],["crichd",160],["databasegdriveplayer",160],["dood",160],["f1stream",160],["faselhd",160],["fbstream",160],["file4go",160],["filemoon",160],["filepress",[160,222]],["filmlinks4u",160],["filmpertutti",160],["filmyzilla",160],["fmovies",160],["french-stream",160],["fzlink",160],["gdriveplayer",160],["gofilms4u",160],["gogoanime",160],["gomoviz",160],["hdmoviefair",160],["hdmovies4u",160],["hdmovies50",160],["hdmoviesfair",160],["hh3dhay",160],["hindilinks4u",160],["hotmasti",160],["hurawatch",160],["klmanga",160],["klubsports",160],["libertestreamvf",160],["livetvon",160],["manga1000",160],["manga1001",160],["mangaraw",160],["mangarawjp",160],["mlbstream",160],["motogpstream",160],["movierulz",160],["movies123",160],["movies2watch",160],["moviesden",160],["moviezaddiction",160],["myflixer",160],["nbastream",160],["netcine",160],["nflstream",160],["nhlstream",160],["onlinewatchmoviespk",160],["pctfenix",160],["pctnew",160],["pksmovies",160],["plyjam",160],["plylive",160],["pogolinks",160],["popcorntime",160],["poscitech",160],["prmovies",160],["rugbystreams",160],["shahed4u",160],["sflix",160],["sitesunblocked",160],["solarmovies",160],["sportcast",160],["sportskart",160],["sports-stream",160],["streaming-french",160],["streamers",160],["streamingcommunity",160],["strikeout",160],["t20cup",160],["tennisstreams",160],["torrentdosfilmes",160],["toonanime",160],["tvply",160],["ufcstream",160],["uptomega",160],["uqload",160],["vudeo",160],["vidoo",160],["vipbox",160],["vipboxtv",160],["vipleague",160],["viprow",160],["yesmovies",160],["yomovies",160],["yomovies1",160],["yt2mp3s",160],["kat",160],["katbay",160],["kickass",160],["kickasshydra",160],["kickasskat",160],["kickass2",160],["kickasstorrents",160],["kat2",160],["kattracker",160],["thekat",160],["thekickass",160],["kickassz",160],["kickasstorrents2",160],["topkickass",160],["kickassgo",160],["kkickass",160],["kkat",160],["kickasst",160],["kick4ss",160],["guardaserie",165],["cine-calidad",166],["videovard",183],["gntai",190],["grantorrent",190],["mejortorrent",190],["mejortorrento",190],["mejortorrents",190],["mejortorrents1",190],["mejortorrentt",190],["shineads",192],["bg-gledai",217],["gledaitv",217],["motchill",234]]);

const exceptionsMap = new Map([["mentor.duden.de",[79]],["forum.soft98.ir",[207]]]);

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
        if ( elem && elem.matches && elem.matches(targetSelector) ) { return true; }
        const elems = Array.from(document.querySelectorAll(targetSelector));
        return elems.includes(elem);
    };
    const elementDetails = elem => {
        if ( elem instanceof Window ) { return 'window'; }
        if ( elem instanceof Document ) { return 'document'; }
        if ( elem instanceof Element === false ) { return '?'; }
        const parts = [];
        if ( elem.id !== '' ) { parts.push(`#${CSS.escape(elem.id)}`); }
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
