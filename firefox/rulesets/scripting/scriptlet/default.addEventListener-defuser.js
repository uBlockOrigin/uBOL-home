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

const argsList = [["load","Object"],["mousedown","clientX"],["load","hard_block"],["/contextmenu|keydown/"],["","adb"],["click","ClickHandler"],["load","IsAdblockRequest"],["/^(?:click|mousedown)$/","_0x"],["error"],["load","onload"],["","BACK"],["load","getComputedStyle"],["load","adsense"],["load","(!o)"],["load","(!i)"],["","_0x"],["","Adblock"],["load","nextFunction"],["/^(?:click|mousedown)$/","bypassEventsInProxies"],["","window.open"],["","open"],["click","exopop"],["/^(?:load|click)$/","popMagic"],["mousedown","popundrInit"],["getexoloader"],["","pop"],["load","exoJsPop101"],["/^loadex/"],["","/exo"],["","_blank"],["",";}"],["load","BetterPop"],["mousedown","preventDefault"],["load","advertising"],["mousedown","localStorage"],["click","preventDefault"],["load","2000"],["/^(click|mousedown|mousemove|touchstart|touchend|touchmove)/","system.popunder"],["load","adb"],["/^(?:click|mousedown|mousemove|touchstart|touchend|touchmove)$/","system.popunder"],["","'0x"],["/DOMContentLoaded|load/","y.readyState"],["/error|canplay/","(t)"],["load","hblocked"],["error","Adblocker"],["DOMContentLoaded","adlinkfly"],["DOMContentLoaded","shortener"],["mousedown","trigger"],["","0x"],["","Pop"],["/^(?:click|mousedown)$/","popunder"],["DOMContentLoaded","preventExit"],["","adsense"],["load"],["click","pop_under"],["load","url"],["load","adverts-top-container"],["","Date"],["DOMContentLoaded","&nbsp"],["click","read_cookie"],["","midRoll"],["click","_0x"],["load","isBlanketFound"],["load","showModal"],["click","trigger"],["mouseout","clientWidth"],["load","download-wrapper"],["load","autoRecov"],["popstate","noPop"],["/^(?:click|mousedown)$/","ppu"],["click","native code"],["message","data.slice"],["/^(?:mousedown|mouseup)$/","0x"],["click","popundr"],["click"],["DOMContentLoaded","compupaste"],["mousedown","!!{});"],["DOMContentLoaded","/adblock/i"],["keydown"],["DOMContentLoaded","isMobile"],["/^/","0x"],["load","PrivateMode"],["scroll","_0x"],["DOMContentLoaded","checkVPN"],["/^(?:click|mousedown|mouseup)$/","di()"],["","\\"],["popstate"],["click","my_inter_listen"],["load","appendChild"],["","bi()"],["","checkTarget"],["click","popunder"],["timeupdate"],["scroll","getElementById"],["load","undefined"],["DOMContentLoaded","scriptwz_url"],["load","0x"],["DOMContentLoaded","btoa"],["adblockActivated"],["click","saveLastEvent"],["DOMContentLoaded","offsetHeight"],["","show"],["/.?/","popMagic"],["","ads"],["click","interstitial"],["load","antiblock"],["DOMContentLoaded","adsBlocked"],["load",".appendChild"],["","btoa"],["","exopop"],["DOMContentLoaded","AdBlock"],["load","blocker"],["mouseleave","NativeDisplayAdID"],["mouseover","event.triggered"],["load","removeChild"],["load","ads"],["click","ShouldShow"],["/adblock/i"],["load","doTest"],["DOMContentLoaded","antiAdBlockerHandler"],["DOMContentLoaded","daadb_get_data_fetch"],["click","splashPage"],["load","detect-modal"],["load","_0x"],["click","clickCount"],["DOMContentLoaded","iframe"],["","/_blank/i"],["load","htmls"],["blur","focusOut"],["click","handleClick"],["DOMContentLoaded","location.href"],["","popMagic"],["contextmenu"],["blur","counter"],["/^(?:click|mousedown)$/","latest!=="],["DOMContentLoaded",".ready"],["load","script"],["","/pop|wm|forceClick/"],["load","block"],["","/_0x|localStorage\\.getItem/"],["DOMContentLoaded","adblock"],["load","head"],["visibilitychange"],["load","/showModal|isBlanketFound/"],["click","shouldShow"],["","/ads|Modal/"],["DOMContentLoaded","init"],["load","Adblock"],["DOMContentLoaded","window.open"],["","vads"],["devtoolschange"],["click","open"],["beforeunload"],["","break;case $."],["mouseup","decodeURIComponent"],["/(?:click|touchend)/","_0x"],["","removeChild"],["click","pu_count"],["","/pop|_blank/"],["click","allclick_Public"],["click","0x"],["/touchstart|mousedown|click/","latest"],["blur","native code"],["blur","event.simulate"],["click","_blank"],["DOMContentLoaded","0x"],["click","overlay"],["scroll","undefined"],["readystatechange","document.removeEventListener"],["mousedown","shown_at"],["scroll","detect"],["click","t(a)"],["","focus"],["DOMContentLoaded","deblocker"],["","preventDefault"],["click","tabunder"],["mouseup","catch"],["scroll","innerHeight"],["hashchange"],["load","/nextFunction|2000/"],["load","player"],["","document.oncontextmenu"],["","about:blank"],["click","popMagic"],["load","popMagic"],["DOMContentLoaded","adsSrc"],["np.detect"],["click","Popup"],["","/open.*_blank/"],["scroll"],["","isBlocking"],["timeupdate","","elements",".quiver-cam-player--ad-not-running.quiver-cam-player--free video"],["","$"],["","exoJsPop101"],["/click|mousedown/","catch"],["","init"],["adb"],["scroll","modal"],["DOMContentLoaded","clientHeight"],["click","window.focus"],["click","[native code]"],["click","event.dispatch"],["load","adblock"],["","Math"],["DOMContentLoaded","popupurls"],["","tabUnder"],["load","XMLHttpRequest"],["load","puURLstrpcht"],["load","AdBlocker"],["","showModal"],["","goog"],["load","abDetectorPro"],["","document.body"],["","modal"],["click","pop"],["click","adobeModalTestABenabled"],["blur","console.log"],["","AdB"],["load","adSession"],["load","Ads"],["DOMContentLoaded","googlesyndication"],["np.evtdetect"],["load","popunder"],["scroll","function(e)"],["DOMContentLoaded","adlinkfly_url"],["mousedown"],["load","document.getElementById"],["mousedown","tabUnder"],["click","popactive"],["load","adsbygoogle"],["load","modal_blocker"],["click","isOpened"],["mousedown","pop.doEvent"],["error","blocker"],["click","alink"],["","daadb"],["load","google-analytics"],["","sessionStorage"],["load","fetch"],["click","pingUrl"],["mousedown","scoreUrl"],["click","/event_callback=function\\(\\){window\\.location=t\\.getAttribute\\(\"href\"\\)/"],["","Adb"]];

const hostnamesMap = new Map([["newser.com",0],["sport1.de",2],["userscloud.com",3],["timesofindia.indiatimes.com",4],["drrtyr.mx",4],["pinoyalbums.com",4],["multiplayer.it",4],["mediafire.com",[5,6]],["pinsystem.co.uk",7],["fembed.com",7],["ancensored.com",7],["mp3fiber.com",[7,17]],["xrivonet.info",7],["afreesms.com",8],["tio.ch",8],["lavanguardia.com",8],["eplayer.click",8],["kingofdown.com",9],["radiotormentamx.com",9],["quelleestladifference.fr",9],["otakuworldsite.blogspot.com",9],["ad-itech.blogspot.com",9],["sna3talaflam.com",9],["agar.pro",9],["unlockapk.com",9],["mobdi3ips.com",9],["socks24.org",9],["interviewgig.com",9],["javaguides.net",9],["almohtarif-tech.net",9],["forum.release-apk.com",9],["devoloperxda.blogspot.com",9],["zwergenstadt.com",9],["primedeportes.es",9],["upxin.net",9],["ciudadblogger.com",9],["ke-1.com",9],["secretsdeepweb.blogspot.com",9],["bit-shares.com",9],["itdmusics.com",9],["aspdotnet-suresh.com",9],["tudo-para-android.com",9],["urdulibrarypk.blogspot.com",9],["zerotopay.com",9],["akw.to",9],["mawsueaa.com",9],["hesgoal-live.io",9],["king-shoot.io",9],["bibme.org",13],["citationmachine.net",13],["easybib.com",14],["vermangasporno.com",15],["imgtorrnt.in",15],["picbaron.com",[15,131]],["letmejerk.com",15],["letmejerk2.com",15],["letmejerk3.com",15],["letmejerk4.com",15],["letmejerk5.com",15],["letmejerk6.com",15],["letmejerk7.com",15],["dlapk4all.com",15],["kropic.com",15],["kvador.com",15],["pdfindir.net",15],["brstej.com",15],["topwwnews.com",15],["xsanime.com",15],["vidlo.us",15],["put-locker.com",15],["youx.xxx",15],["animeindo.asia",15],["masahub.net",15],["adclickersbot.com",15],["badtaste.it",16],["mage.si",17],["totaldebrid.org",17],["neko-miku.com",17],["elsfile.org",17],["venstrike.jimdofree.com",17],["schrauben-normen.de",17],["avengerinator.blogspot.com",17],["link-to.net",17],["hanimesubth.com",17],["gsmturkey.net",17],["adshrink.it",17],["presentation-ppt.com",17],["mangacanblog.com",17],["pekalongan-cits.blogspot.com",17],["4tymode.win",17],["eurotruck2.com.br",17],["linkvertise.com",17],["reifenrechner.at",17],["tire-size-calculator.info",17],["linuxsecurity.com",17],["encodinghub.com",17],["itsguider.com",17],["cotravinh.blogspot.com",17],["itudong.com",17],["shortx.net",17],["lecturel.com",17],["bakai.org",17],["nar.k-ba.net",17],["tiroalpalo.org",17],["shemalez.com",19],["tubepornclassic.com",19],["gotporn.com",20],["freepornrocks.com",20],["tvhai.org",20],["simpcity.su",20],["realgfporn.com",[21,22]],["titsbox.com",21],["thisvid.com",22],["xvideos-downloader.net",22],["imgspice.com",23],["vikiporn.com",24],["tnaflix.com",24],["hentai2w.com",[24,183]],["yourlust.com",24],["hotpornfile.org",24],["watchfreexxx.net",24],["vintageporntubes.com",24],["angelgals.com",24],["babesexy.com",24],["porndaa.com",24],["ganstamovies.com",24],["youngleak.com",24],["porndollz.com",24],["xnxxvideo.pro",24],["xvideosxporn.com",24],["onlyhgames.com",24],["filmpornofrancais.fr",24],["pictoa.com",[24,48]],["adultasianporn.com",24],["nsfwmonster.com",24],["girlsofdesire.org",24],["gaytail.com",24],["fetish-bb.com",24],["rumporn.com",24],["soyoungteens.com",24],["zubby.com",24],["lesbian8.com",24],["gayforfans.com",24],["reifporn.de",24],["javtsunami.com",24],["18tube.sex",24],["xxxextreme.org",24],["amateurs-fuck.com",24],["sex-amateur-clips.com",24],["hentaiworld.tv",24],["dads-banging-teens.com",24],["home-xxx-videos.com",24],["mature-chicks.com",24],["teens-fucking-matures.com",24],["hqbang.com",24],["darknessporn.com",24],["familyporner.com",24],["freepublicporn.com",24],["pisshamster.com",24],["punishworld.com",24],["xanimu.com",24],["pornhd.com",25],["cnnamador.com",[25,37]],["cle0desktop.blogspot.com",25],["turkanime.co",25],["camclips.tv",[25,49]],["blackpornhq.com",25],["xsexpics.com",25],["ulsex.net",25],["wannafreeporn.com",25],["ytube2dl.com",25],["multiup.us",25],["protege-torrent.com",25],["pussyspace.com",[26,27]],["pussyspace.net",[26,27]],["empflix.com",28],["cpmlink.net",29],["bdsmstreak.com",29],["cutpaid.com",29],["pornforrelax.com",29],["fatwhitebutt.com",29],["mavplay.xyz",29],["sunporno.com",[30,31,183]],["short.pe",32],["bs.to",35],["efukt.com",35],["generacionretro.net",36],["nuevos-mu.ucoz.com",36],["micloudfiles.com",36],["mimaletamusical.blogspot.com",36],["visionias.net",36],["b3infoarena.in",36],["lurdchinexgist.blogspot.com",36],["thefreedommatrix.blogspot.com",36],["hentai-vl.blogspot.com",36],["projetomotog.blogspot.com",36],["ktmx.pro",36],["lirik3satu.blogspot.com",36],["marketmovers.it",36],["pharmaguideline.com",36],["safemaru.blogspot.com",36],["mixloads.com",36],["mangaromance.eu",36],["interssh.com",36],["freesoftpdfdownload.blogspot.com",36],["cirokun.blogspot.com",36],["myadslink.com",36],["blackavelic.com",36],["server.satunivers.tv",36],["eg-akw.com",36],["xn--mgba7fjn.cc",36],["flashingjungle.com",37],["ma-x.org",38],["lavozdegalicia.es",38],["xmovies08.org",40],["globaldjmix.com",41],["zazzybabes.com",42],["haaretz.co.il",43],["haaretz.com",43],["slate.com",44],["megalinks.info",45],["megapastes.com",45],["mega-mkv.com",[45,46]],["mkv-pastes.com",45],["zpaste.net",45],["zlpaste.net",45],["9xlinks.site",45],["zona-leros.net",46],["acortarm.xyz",47],["acortame.xyz",47],["cine.to",[48,188]],["kissasia.cc",48],["digjav.com",49],["videoszoofiliahd.com",50],["xxxtubezoo.com",51],["zooredtube.com",51],["megacams.me",53],["rlslog.net",53],["porndoe.com",54],["acienciasgalilei.com",56],["playrust.io",57],["payskip.org",58],["short-url.link",59],["tubedupe.com",60],["mcrypto.club",61],["fatgirlskinny.net",62],["polska-ie.com",62],["windowsmatters.com",62],["canaltdt.es",63],["masbrooo.com",63],["2ndrun.tv",63],["stfly.me",64],["oncehelp.com",64],["queenfaucet.website",64],["curto.win",64],["smallseotools.com",65],["macwelt.de",67],["pcwelt.de",67],["capital.de",67],["geo.de",67],["allmomsex.com",68],["allnewindianporn.com",68],["analxxxvideo.com",68],["animalextremesex.com",68],["anime3d.xyz",68],["animefuckmovies.com",68],["animepornfilm.com",68],["animesexbar.com",68],["animesexclip.com",68],["animexxxsex.com",68],["animexxxfilms.com",68],["anysex.club",68],["apetube.asia",68],["asianfuckmovies.com",68],["asianfucktube.com",68],["asianporn.sexy",68],["asiansexcilps.com",68],["beeg.fund",68],["beegvideoz.com",68],["bestasiansex.pro",68],["bravotube.asia",68],["brutalanimalsfuck.com",68],["candyteenporn.com",68],["daddyfuckmovies.com",68],["desifuckonline.com",68],["exclusiveasianporn.com",68],["exteenporn.com",68],["fantasticporn.net",68],["fantasticyoungporn.com",68],["fineasiansex.com",68],["firstasianpussy.com",68],["freeindiansextube.com",68],["freepornasians.com",68],["freerealvideo.com",68],["fuck-beeg.com",68],["fuck-xnxx.com",68],["fuckasian.pro",68],["fuckfuq.com",68],["fuckundies.com",68],["gojapaneseporn.com",68],["golderotica.com",68],["goodyoungsex.com",68],["goyoungporn.com",68],["hardxxxmoms.com",68],["hdvintagetube.com",68],["hentaiporn.me",68],["hentaisexfilms.com",68],["hentaisexuality.com",68],["hot-teens-movies.mobi",68],["hotanimepornvideos.com",68],["hotanimevideos.com",68],["hotasianpussysex.com",68],["hotjapaneseshows.com",68],["hotmaturetube.com",68],["hotmilfs.pro",68],["hotorientalporn.com",68],["hotpornyoung.com",68],["hotxxxjapanese.com",68],["hotxxxpussy.com",68],["indiafree.net",68],["indianpornvideo.online",68],["japanpornclip.com",68],["japanesetube.video",68],["japansex.me",68],["japanesexxxporn.com",68],["japansporno.com",68],["japanxxx.asia",68],["japanxxxworld.com",68],["keezmovies.surf",68],["lingeriefuckvideo.com",68],["liveanimalporn.zooo.club",68],["madhentaitube.com",68],["megahentaitube.com",68],["megajapanesesex.com",68],["megajapantube.com",68],["milfxxxpussy.com",68],["momsextube.pro",68],["momxxxass.com",68],["monkeyanimalporn.com",68],["moviexxx.mobi",68],["newanimeporn.com",68],["newjapanesexxx.com",68],["nicematureporn.com",68],["nudeplayboygirls.com",68],["openxxxporn.com",68],["originalindianporn.com",68],["originalteentube.com",68],["pig-fuck.com",68],["plainasianporn.com",68],["popularasianxxx.com",68],["pornanimetube.com",68],["pornasians.pro",68],["pornhat.asia",68],["pornheed.online",68],["pornjapanesesex.com",68],["pornomovies.asia",68],["pornvintage.tv",68],["primeanimesex.com",68],["realjapansex.com",68],["realmomsex.com",68],["redsexhub.com",68],["retroporn.world",68],["retrosexfilms.com",68],["sex-free-movies.com",68],["sexanimesex.com",68],["sexanimetube.com",68],["sexjapantube.com",68],["sexmomvideos.com",68],["sexteenxxxtube.com",68],["sexxxanimal.com",68],["sexyoungtube.com",68],["sexyvintageporn.com",68],["sopornmovies.com",68],["spicyvintageporn.com",68],["sunporno.club",68],["tabooanime.club",68],["teenextrem.com",68],["teenfucksex.com",68],["teenhost.net",68],["teensexass.com",68],["tnaflix.asia",68],["totalfuckmovies.com",68],["totalmaturefuck.com",68],["txxx.asia",68],["voyeurpornsex.com",68],["warmteensex.com",68],["wetasiancreampie.com",68],["wildhentaitube.com",68],["wowyoungsex.com",68],["xhamster-art.com",68],["xmovie.pro",68],["xnudevideos.com",68],["xnxxjapon.com",68],["xpics.me",68],["xvide.me",68],["xxxanimefuck.com",68],["xxxanimevideos.com",68],["xxxanimemovies.com",68],["xxxhentaimovies.com",68],["xxxhothub.com",68],["xxxjapaneseporntube.com",68],["xxxlargeporn.com",68],["xxxmomz.com",68],["xxxpornmilf.com",68],["xxxpussyclips.com",68],["xxxpussysextube.com",68],["xxxretrofuck.com",68],["xxxsex.pro",68],["xxxsexyjapanese.com",68],["xxxteenyporn.com",68],["xxxvideo.asia",68],["xxxvideos.ink",68],["xxxyoungtv.com",68],["youjizzz.club",68],["youngpussyfuck.com",68],["bayimg.com",69],["celeb.gate.cc",70],["eodev.com",71],["masterplayer.xyz",73],["pussy-hub.com",73],["porndex.com",74],["compucalitv.com",75],["diariodenavarra.es",77],["duden.de",79],["pennlive.com",81],["beautypageants.indiatimes.com",82],["01fmovies.com",83],["lnk2.cc",85],["fullhdxxx.com",86],["luscious.net",[86,131]],["classicpornbest.com",86],["xstory-fr.com",86],["1youngteenporn.com",86],["www-daftarharga.blogspot.com",[86,172]],["miraculous.to",[86,178]],["vtube.to",86],["gosexpod.com",87],["otakukan.com",88],["xcafe.com",89],["pornfd.com",89],["venusarchives.com",89],["imagehaha.com",90],["imagenpic.com",90],["imageshimage.com",90],["imagetwist.com",90],["k1nk.co",91],["watchasians.cc",91],["alexsports.xyz",91],["lulustream.com",91],["luluvdo.com",91],["web.de",92],["news18.com",93],["thelanb.com",94],["dropmms.com",94],["softwaredescargas.com",95],["cracking-dz.com",96],["anitube.ninja",97],["gazzetta.it",98],["port.hu",100],["dziennikbaltycki.pl",101],["dzienniklodzki.pl",101],["dziennikpolski24.pl",101],["dziennikzachodni.pl",101],["echodnia.eu",101],["expressbydgoski.pl",101],["expressilustrowany.pl",101],["gazetakrakowska.pl",101],["gazetalubuska.pl",101],["gazetawroclawska.pl",101],["gk24.pl",101],["gloswielkopolski.pl",101],["gol24.pl",101],["gp24.pl",101],["gra.pl",101],["gs24.pl",101],["kurierlubelski.pl",101],["motofakty.pl",101],["naszemiasto.pl",101],["nowiny24.pl",101],["nowosci.com.pl",101],["nto.pl",101],["polskatimes.pl",101],["pomorska.pl",101],["poranny.pl",101],["sportowy24.pl",101],["strefaagro.pl",101],["strefabiznesu.pl",101],["stronakobiet.pl",101],["telemagazyn.pl",101],["to.com.pl",101],["wspolczesna.pl",101],["course9x.com",101],["courseclub.me",101],["azrom.net",101],["alttyab.net",101],["esopress.com",101],["nesiaku.my.id",101],["onemanhua.com",102],["freeindianporn.mobi",102],["dr-farfar.com",103],["boyfriendtv.com",104],["brandstofprijzen.info",105],["netfuck.net",106],["blog24.me",[106,127]],["kisahdunia.com",106],["javsex.to",106],["nulljungle.com",106],["oyuncusoruyor.com",106],["pbarecap.ph",106],["sourds.net",106],["teknobalta.com",106],["tvinternetowa.info",106],["sqlserveregitimleri.com",106],["tutcourse.com",106],["readytechflip.com",106],["novinhastop.com",106],["warddogs.com",106],["dvdgayporn.com",106],["iimanga.com",106],["tinhocdongthap.com",106],["tremamnon.com",106],["423down.com",106],["brizzynovel.com",106],["jugomobile.com",106],["freecodezilla.net",106],["movieslegacy.com",106],["animekhor.xyz",106],["iconmonstr.com",106],["gay-tubes.cc",106],["rbxscripts.net",106],["comentariodetexto.com",106],["wordpredia.com",106],["livsavr.co",106],["allfaucet.xyz",[106,127]],["titbytz.tk",106],["replica-watch.info",106],["alludemycourses.com",106],["kayifamilytv.com",106],["iir.ai",107],["gameofporn.com",109],["qpython.club",110],["antifake-funko.fr",110],["dktechnicalmate.com",110],["recipahi.com",110],["e9china.net",111],["ac.ontools.net",111],["marketbeat.com",112],["hentaipornpics.net",113],["apps2app.com",114],["alliptvlinks.com",115],["waterfall.money",115],["xvideos.com",116],["xvideos2.com",116],["tubereader.me",117],["repretel.com",117],["dagensnytt.com",118],["mrproblogger.com",118],["themezon.net",118],["gfx-station.com",119],["bitzite.com",[119,127,130]],["historyofroyalwomen.com",120],["davescomputertips.com",120],["ukchat.co.uk",121],["hivelr.com",122],["embedz.click",123],["sexseeimage.com",124],["upshrink.com",125],["ohionowcast.info",127],["wiour.com",127],["appsbull.com",127],["diudemy.com",127],["maqal360.com",127],["bitcotasks.com",127],["videolyrics.in",127],["manofadan.com",127],["cempakajaya.com",127],["tagecoin.com",127],["doge25.in",127],["king-ptcs.com",127],["naijafav.top",127],["ourcoincash.xyz",127],["sh.techsamir.com",127],["claimcoins.site",127],["cryptosh.pro",127],["coinsrev.com",127],["go.freetrx.fun",127],["eftacrypto.com",127],["fescrypto.com",127],["earnhub.net",127],["kiddyshort.com",127],["tronxminer.com",127],["homeairquality.org",128],["exego.app",129],["cutlink.net",129],["cutsy.net",129],["cutyurls.com",129],["cutty.app",129],["cutnet.net",129],["aiimgvlog.fun",131],["6indianporn.com",131],["amateurebonypics.com",131],["amateuryoungpics.com",131],["cinemabg.net",131],["desimmshd.com",131],["frauporno.com",131],["givemeaporn.com",131],["jav-asia.top",131],["javf.net",131],["javideo.net",131],["kr18plus.com",131],["pilibook.com",131],["pornborne.com",131],["porngrey.com",131],["qqxnxx.com",131],["sexvideos.host",131],["submilf.com",131],["subtaboo.com",131],["tktube.com",131],["xfrenchies.com",131],["coingraph.us",132],["momo-net.com",132],["maxgaming.fi",132],["travel.vebma.com",133],["cloud.majalahhewan.com",133],["crm.cekresi.me",133],["ai.tempatwisata.pro",133],["pinloker.com",133],["sekilastekno.com",133],["vulture.com",134],["megaplayer.bokracdn.run",135],["hentaistream.com",136],["siteunblocked.info",137],["larvelfaucet.com",138],["feyorra.top",138],["claimtrx.com",138],["moviesyug.net",139],["w4files.ws",139],["parispi.net",140],["simkl.com",141],["paperzonevn.com",142],["dailyvideoreports.net",143],["lewd.ninja",144],["systemnews24.com",145],["incestvidz.com",146],["niusdiario.es",147],["playporngames.com",148],["movi.pk",[149,153]],["justin.mp3quack.lol",151],["cutesexyteengirls.com",152],["0dramacool.net",153],["185.53.88.104",153],["185.53.88.204",153],["185.53.88.15",153],["123movies4k.net",153],["1movieshd.com",153],["1rowsports.com",153],["4share-mp3.net",153],["6movies.net",153],["9animetv.to",153],["720pstream.me",153],["aagmaal.com",153],["abysscdn.com",153],["ajkalerbarta.com",153],["akstream.xyz",153],["androidapks.biz",153],["androidsite.net",153],["animeonlinefree.org",153],["animesite.net",153],["animespank.com",153],["aniworld.to",153],["apkmody.io",153],["appsfree4u.com",153],["audioz.download",153],["awafim.tv",153],["bdnewszh.com",153],["beastlyprints.com",153],["bengalisite.com",153],["bestfullmoviesinhd.org",153],["betteranime.net",153],["blacktiesports.live",153],["buffsports.stream",153],["ch-play.com",153],["clickforhire.com",153],["cloudy.pk",153],["computercrack.com",153],["coolcast2.com",153],["crackedsoftware.biz",153],["crackfree.org",153],["cracksite.info",153],["cryptoblog24.info",153],["cuatrolatastv.blogspot.com",153],["cydiasources.net",153],["dirproxy.com",153],["dopebox.to",153],["downloadapk.info",153],["downloadapps.info",153],["downloadgames.info",153],["downloadmusic.info",153],["downloadsite.org",153],["downloadwella.com",153],["ebooksite.org",153],["educationtips213.blogspot.com",153],["egyup.live",153],["embed.meomeo.pw",153],["embed.scdn.to",153],["emulatorsite.com",153],["essaysharkwriting.club",153],["exploreera.net",153],["extrafreetv.com",153],["fakedetail.com",153],["fclecteur.com",153],["files.im",153],["flexyhit.com",153],["fmoviefree.net",153],["fmovies24.com",153],["footyhunter3.xyz",153],["freeflix.info",153],["freemoviesu4.com",153],["freeplayervideo.com",153],["freesoccer.net",153],["fseries.org",153],["gamefast.org",153],["gamesite.info",153],["gettapeads.com",153],["gmanga.me",153],["gocast123.me",153],["gogohd.net",153],["gogoplay5.com",153],["gooplay.net",153],["gostreamon.net",153],["happy2hub.org",153],["harimanga.com",153],["healthnewsreel.com",153],["hexupload.net",153],["hinatasoul.com",153],["hindisite.net",153],["holymanga.net",153],["hxfile.co",153],["isosite.org",153],["iv-soft.com",153],["januflix.expert",153],["jewelry.com.my",153],["johnwardflighttraining.com",153],["kabarportal.com",153],["kstorymedia.com",153],["la123movies.org",153],["lespassionsdechinouk.com",153],["lilymanga.net",153],["linksdegrupos.com.br",153],["livestreamtv.pk",153],["macsite.info",153],["mangapt.com",153],["mangasite.org",153],["manhuascan.com",153],["megafilmeshdseries.com",153],["megamovies.org",153],["membed.net",153],["moddroid.com",153],["moviefree2.com",153],["movies-watch.com.pk",153],["moviesite.app",153],["moviesonline.fm",153],["moviesx.org",153],["msmoviesbd.com",153],["musicsite.biz",153],["myfernweh.com",153],["myviid.com",153],["nazarickol.com",153],["noob4cast.com",153],["nsw2u.com",[153,242]],["oko.sh",153],["olympicstreams.me",153],["orangeink.pk",153],["owllink.net",153],["pahaplayers.click",153],["patchsite.net",153],["pdfsite.net",153],["play1002.com",153],["player-cdn.com",153],["productkeysite.com",153],["projectfreetv.one",153],["romsite.org",153],["rufiguta.com",153],["rytmp3.io",153],["send.cm",153],["seriesite.net",153],["seriezloaded.com.ng",153],["serijehaha.com",153],["shrugemojis.com",153],["siteapk.net",153],["siteflix.org",153],["sitegames.net",153],["sitekeys.net",153],["sitepdf.com",153],["sitetorrent.com",153],["softwaresite.net",153],["sportbar.live",153],["sportkart1.xyz",153],["ssyoutube.com",153],["stardima.com",153],["stream4free.live",153],["superapk.org",153],["supermovies.org",153],["tainio-mania.online",153],["talaba.su",153],["tamilguns.org",153],["tatabrada.tv",153],["techtrendmakers.com",153],["theflixer.tv",153],["thememypc.net",153],["thetechzone.online",153],["thripy.com",153],["tonnestreamz.xyz",153],["travelplanspro.com",153],["turcasmania.com",153],["tusfiles.com",153],["tvonlinesports.com",153],["ultramovies.org",153],["uploadbank.com",153],["urdubolo.pk",153],["vidspeeds.com",153],["vumoo.to",153],["warezsite.net",153],["watchmovies2.com",153],["watchmoviesforfree.org",153],["watchofree.com",153],["watchsite.net",153],["watchsouthpark.tv",153],["watchtvch.club",153],["web.livecricket.is",153],["webseries.club",153],["worldcupstream.pm",153],["y2mate.com",153],["youapk.net",153],["youtube4kdownloader.com",153],["yts-subs.com",153],["haho.moe",154],["nicy-spicy.pw",155],["novelmultiverse.com",156],["mylegalporno.com",157],["asianembed.io",160],["thecut.com",161],["novelism.jp",162],["alphapolis.co.jp",163],["okrzone.com",164],["game3rb.com",165],["javhub.net",165],["thotvids.com",166],["berklee.edu",167],["rawkuma.com",[168,169]],["moviesjoyhd.to",169],["imeteo.sk",170],["youtubemp3donusturucu.net",171],["surfsees.com",173],["vivo.st",[174,175]],["alueviesti.fi",177],["kiuruvesilehti.fi",177],["lempaala.ideapark.fi",177],["olutposti.fi",177],["urjalansanomat.fi",177],["tainhanhvn.com",179],["titantv.com",180],["3cinfo.net",181],["transportationlies.org",182],["camarchive.tv",183],["crownimg.com",183],["freejav.guru",183],["hentai2read.com",183],["icyporno.com",183],["illink.net",183],["javtiful.com",183],["m-hentai.net",183],["pornblade.com",183],["pornfelix.com",183],["pornxxxxtube.net",183],["redwap.me",183],["redwap2.com",183],["redwap3.com",183],["tubxporn.xxx",183],["ver-comics-porno.com",183],["ver-mangas-porno.com",183],["xanimeporn.com",183],["xxxvideohd.net",183],["zetporn.com",183],["cocomanga.com",184],["sampledrive.in",185],["mcleaks.net",186],["explorecams.com",186],["minecraft.buzz",186],["chillx.top",187],["playerx.stream",187],["m.liputan6.com",189],["stardewids.com",[189,212]],["ingles.com",190],["spanishdict.com",190],["surfline.com",191],["rureka.com",192],["bunkr.is",193],["amateur8.com",194],["freeporn8.com",194],["maturetubehere.com",194],["embedo.co",195],["corriere.it",196],["oggi.it",196],["2the.space",197],["apkcombo.com",198],["sponsorhunter.com",199],["soft98.ir",200],["novelssites.com",201],["haxina.com",202],["cryptofenz.xyz",202],["torrentmac.net",203],["udvl.com",204],["moviezaddiction.icu",205],["dlpanda.com",206],["socialmediagirls.com",207],["einrichtungsbeispiele.de",208],["weadown.com",209],["molotov.tv",210],["freecoursesonline.me",211],["adelsfun.com",211],["advantien.com",211],["bailbondsfinder.com",211],["bigpiecreative.com",211],["childrenslibrarylady.com",211],["classifarms.com",211],["comtasq.ca",211],["crone.es",211],["ctrmarketingsolutions.com",211],["dropnudes.com",211],["ftuapps.dev",211],["genzsport.com",211],["ghscanner.com",211],["grsprotection.com",211],["gruporafa.com.br",211],["inmatefindcalifornia.com",211],["inmatesearchidaho.com",211],["itsonsitetv.com",211],["mfmfinancials.com",211],["myproplugins.com",211],["onehack.us",211],["ovester.com",211],["paste.bin.sx",211],["privatenudes.com",211],["renoconcrete.ca",211],["richieashbeck.com",211],["sat.technology",211],["short1ink.com",211],["stpm.co.uk",211],["wegotcookies.co",211],["mathcrave.com",211],["commands.gg",212],["smgplaza.com",213],["emturbovid.com",214],["freepik.com",215],["diyphotography.net",217],["bitchesgirls.com",218],["shopforex.online",219],["programmingeeksclub.com",220],["easymc.io",221],["diendancauduong.com",222],["parentcircle.com",223],["h-game18.xyz",224],["nopay.info",225],["wheelofgold.com",226],["shortlinks.tech",227],["skill4ltu.eu",229],["freepikdownloader.com",230],["freepasses.org",231],["iusedtobeaboss.com",232],["androidpolice.com",233],["cbr.com",233],["dualshockers.com",233],["gamerant.com",233],["howtogeek.com",233],["thegamer.com",233],["blogtruyenmoi.com",234],["igay69.com",235],["graphicget.com",236],["qiwi.gg",237],["netcine2.la",238],["idnes.cz",[239,240]],["cbc.ca",241]]);

const entitiesMap = new Map([["kisscartoon",1],["kissasian",7],["ganool",7],["pirate",7],["piratebay",7],["pirateproxy",7],["proxytpb",7],["thepiratebay",7],["limetorrents",[9,15]],["king-pes",9],["depedlps",9],["komikcast",9],["idedroidsafelink",9],["links-url",9],["ak4eg",9],["streanplay",10],["steanplay",10],["liferayiseasy",[11,12]],["pahe",15],["yts",15],["tube8",15],["topeuropix",15],["moviescounter",15],["torrent9",15],["desiremovies",15],["movs4u",15],["uwatchfree",15],["hydrax",15],["4movierulz",15],["projectfreetv",15],["arabseed",15],["btdb",[15,57]],["world4ufree",15],["streamsport",15],["rojadirectatvhd",15],["userload",15],["freecoursesonline",17],["lordpremium",17],["todovieneok",17],["novablogitalia",17],["anisubindo",17],["btvsports",17],["adyou",18],["fxporn69",21],["rexporn",25],["movies07",25],["pornocomics",25],["sexwebvideo",29],["pornomoll",29],["gsurl",32],["mimaletadepeliculas",33],["readcomiconline",34],["burningseries",35],["dz4soft",36],["yoututosjeff",36],["ebookmed",36],["lanjutkeun",36],["novelasesp",36],["singingdalong",36],["doujindesu",36],["xmovies8",39],["mega-dvdrip",46],["peliculas-dvdrip",46],["desbloqueador",47],["newpelis",[48,55]],["pelix",[48,55]],["allcalidad",[48,183]],["khatrimaza",48],["camwhores",49],["camwhorestv",49],["uproxy",49],["nekopoi",52],["mirrorace",61],["mixdrp",66],["asiansex",68],["japanfuck",68],["japanporn",68],["teensex",68],["vintagetube",68],["xxxmovies",68],["zooqle",72],["hdfull",76],["mangamanga",78],["streameast",80],["thestreameast",80],["vev",84],["vidop",84],["1337x",86],["zone-telechargement",86],["megalink",91],["gmx",92],["mega1080p",97],["9hentai",99],["gaypornhdfree",106],["cinemakottaga",106],["privatemoviez",106],["apkmaven",106],["popcornstream",108],["fc-lc",126],["pornktube",131],["watchseries",131],["milfnut",132],["pagalmovies",139],["7starhd",139],["jalshamoviez",139],["9xupload",139],["bdupload",139],["desiupload",139],["rdxhd1",139],["moviessources",150],["nuvid",151],["0gomovie",153],["0gomovies",153],["123moviefree",153],["1kmovies",153],["1madrasdub",153],["1primewire",153],["2embed",153],["2madrasdub",153],["2umovies",153],["4anime",153],["9xmovies",153],["adblockplustape",153],["altadefinizione01",153],["anitube",153],["atomixhq",153],["beinmatch",153],["brmovies",153],["cima4u",153],["clicknupload",153],["cmovies",153],["couchtuner",153],["cricfree",153],["crichd",153],["databasegdriveplayer",153],["dood",153],["f1stream",153],["faselhd",153],["fbstream",153],["file4go",153],["filemoon",153],["filepress",[153,216]],["filmlinks4u",153],["filmpertutti",153],["filmyzilla",153],["fmovies",153],["french-stream",153],["fzlink",153],["gdriveplayer",153],["gofilms4u",153],["gogoanime",153],["gomoviz",153],["hdmoviefair",153],["hdmovies4u",153],["hdmovies50",153],["hdmoviesfair",153],["hh3dhay",153],["hindilinks4u",153],["hotmasti",153],["hurawatch",153],["klmanga",153],["klubsports",153],["libertestreamvf",153],["livetvon",153],["manga1000",153],["manga1001",153],["mangaraw",153],["mangarawjp",153],["mlbstream",153],["motogpstream",153],["movierulz",153],["movies123",153],["movies2watch",153],["moviesden",153],["moviezaddiction",153],["myflixer",153],["nbastream",153],["netcine",153],["nflstream",153],["nhlstream",153],["onlinewatchmoviespk",153],["pctfenix",153],["pctnew",153],["pksmovies",153],["plyjam",153],["plylive",153],["pogolinks",153],["popcorntime",153],["poscitech",153],["prmovies",153],["rugbystreams",153],["shahed4u",153],["sflix",153],["sitesunblocked",153],["solarmovies",153],["sportcast",153],["sportskart",153],["sports-stream",153],["streaming-french",153],["streamers",153],["streamingcommunity",153],["strikeout",153],["t20cup",153],["tennisstreams",153],["torrentdosfilmes",153],["toonanime",153],["tvply",153],["ufcstream",153],["uptomega",153],["uqload",153],["vudeo",153],["vidoo",153],["vipbox",153],["vipboxtv",153],["vipleague",153],["viprow",153],["yesmovies",153],["yomovies",153],["yomovies1",153],["yt2mp3s",153],["kat",153],["katbay",153],["kickass",153],["kickasshydra",153],["kickasskat",153],["kickass2",153],["kickasstorrents",153],["kat2",153],["kattracker",153],["thekat",153],["thekickass",153],["kickassz",153],["kickasstorrents2",153],["topkickass",153],["kickassgo",153],["kkickass",153],["kkat",153],["kickasst",153],["kick4ss",153],["guardaserie",158],["cine-calidad",159],["videovard",176],["gntai",183],["grantorrent",183],["mejortorrent",183],["mejortorrento",183],["mejortorrents",183],["mejortorrents1",183],["mejortorrentt",183],["shineads",185],["bg-gledai",211],["gledaitv",211],["motchill",228]]);

const exceptionsMap = new Map([["mentor.duden.de",[79]],["forum.soft98.ir",[200]]]);

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
