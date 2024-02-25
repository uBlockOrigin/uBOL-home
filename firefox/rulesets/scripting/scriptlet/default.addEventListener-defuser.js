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

const argsList = [["load","Object"],["mousedown","clientX"],["load","hard_block"],["/contextmenu|keydown/"],["","adb"],["click","ClickHandler"],["load","IsAdblockRequest"],["/^(?:click|mousedown)$/","_0x"],["error"],["load","onload"],["","BACK"],["load","getComputedStyle"],["load","adsense"],["load","(!o)"],["load","(!i)"],["","_0x"],["","Adblock"],["load","nextFunction"],["/^(?:click|mousedown)$/","bypassEventsInProxies"],["","window.open"],["","open"],["click","exopop"],["/^(?:load|click)$/","popMagic"],["mousedown","popundrInit"],["getexoloader"],["","pop"],["load","exoJsPop101"],["/^loadex/"],["","/exo"],["","_blank"],["",";}"],["load","BetterPop"],["mousedown","preventDefault"],["load","advertising"],["mousedown","localStorage"],["click","preventDefault"],["load","2000"],["/^(click|mousedown|mousemove|touchstart|touchend|touchmove)/","system.popunder"],["load","adb"],["/^(?:click|mousedown|mousemove|touchstart|touchend|touchmove)$/","system.popunder"],["","'0x"],["/DOMContentLoaded|load/","y.readyState"],["/error|canplay/","(t)"],["load","hblocked"],["error","Adblocker"],["DOMContentLoaded","adlinkfly"],["DOMContentLoaded","shortener"],["mousedown","trigger"],["","0x"],["DOMContentLoaded","ads"],["","Pop"],["/^(?:click|mousedown)$/","popunder"],["DOMContentLoaded","preventExit"],["","adsense"],["load"],["click","pop_under"],["load","url"],["load","adverts-top-container"],["","Date"],["DOMContentLoaded","&nbsp"],["click","read_cookie"],["","midRoll"],["click","_0x"],["load","isBlanketFound"],["load","showModal"],["click","trigger"],["mouseout","clientWidth"],["load","download-wrapper"],["load","autoRecov"],["popstate","noPop"],["/^(?:click|mousedown)$/","ppu"],["click","native code"],["message","data.slice"],["/^(?:mousedown|mouseup)$/","0x"],["click","popundr"],["click"],["DOMContentLoaded","compupaste"],["mousedown","!!{});"],["DOMContentLoaded","/adblock/i"],["keydown"],["DOMContentLoaded","isMobile"],["/^/","0x"],["load","PrivateMode"],["scroll","_0x"],["DOMContentLoaded","checkVPN"],["/^(?:click|mousedown|mouseup)$/","di()"],["","\\"],["popstate"],["click","my_inter_listen"],["load","appendChild"],["","bi()"],["","checkTarget"],["click","popunder"],["timeupdate"],["scroll","getElementById"],["load","undefined"],["DOMContentLoaded","scriptwz_url"],["load","0x"],["DOMContentLoaded","btoa"],["adblockActivated"],["load","ads"],["click","saveLastEvent"],["DOMContentLoaded","offsetHeight"],["","show"],["/.?/","popMagic"],["","ads"],["click","interstitial"],["load","antiblock"],["DOMContentLoaded","adsBlocked"],["load",".appendChild"],["","btoa"],["","exopop"],["DOMContentLoaded","AdBlock"],["load","blocker"],["mouseleave","NativeDisplayAdID"],["mouseover","event.triggered"],["load","removeChild"],["/adblock/i"],["load","doTest"],["DOMContentLoaded","antiAdBlockerHandler"],["DOMContentLoaded","daadb_get_data_fetch"],["click","splashPage"],["load","detect-modal"],["DOMContentLoaded","iframe"],["mouseup","_blank"],["","/_blank/i"],["load","htmls"],["blur","focusOut"],["click","handleClick"],["DOMContentLoaded","location.href"],["","popMagic"],["contextmenu"],["blur","counter"],["/^(?:click|mousedown)$/","latest!=="],["DOMContentLoaded",".ready"],["load","script"],["","/pop|wm|forceClick/"],["load","block"],["","/_0x|localStorage\\.getItem/"],["DOMContentLoaded","adblock"],["load","head"],["visibilitychange"],["load","/showModal|isBlanketFound/"],["click","shouldShow"],["","/ads|Modal/"],["DOMContentLoaded","init"],["load","Adblock"],["DOMContentLoaded","window.open"],["","vads"],["devtoolschange"],["click","open"],["beforeunload"],["click","0x"],["","break;case $."],["mouseup","decodeURIComponent"],["/(?:click|touchend)/","_0x"],["","removeChild"],["click","pu_count"],["","/pop|_blank/"],["click","allclick_Public"],["/touchstart|mousedown|click/","latest"],["blur","native code"],["blur","event.simulate"],["click","_blank"],["DOMContentLoaded","0x"],["click","overlay"],["scroll","undefined"],["readystatechange","document.removeEventListener"],["mousedown","shown_at"],["scroll","detect"],["click","t(a)"],["","focus"],["DOMContentLoaded","deblocker"],["","preventDefault"],["click","tabunder"],["mouseup","catch"],["scroll","innerHeight"],["hashchange"],["load","/nextFunction|2000/"],["load","player"],["","document.oncontextmenu"],["","about:blank"],["click","popMagic"],["load","popMagic"],["np.detect"],["click","Popup"],["","/open.*_blank/"],["scroll"],["","isBlocking"],["","$"],["","exoJsPop101"],["/click|mousedown/","catch"],["","init"],["adb"],["scroll","modal"],["DOMContentLoaded","clientHeight"],["click","window.focus"],["click","[native code]"],["click","event.dispatch"],["load","adblock"],["","Math"],["DOMContentLoaded","popupurls"],["","tabUnder"],["load","XMLHttpRequest"],["load","puURLstrpcht"],["load","AdBlocker"],["","showModal"],["","goog"],["load","abDetectorPro"],["","document.body"],["","modal"],["click","adobeModalTestABenabled"],["blur","console.log"],["","AdB"],["load","adSession"],["load","Ads"],["DOMContentLoaded","adsSrc"],["DOMContentLoaded","googlesyndication"],["np.evtdetect"],["load","popunder"],["scroll","function(e)"],["DOMContentLoaded","adlinkfly_url"],["mousedown"],["load","document.getElementById"],["mousedown","tabUnder"],["click","popactive"],["load","adsbygoogle"],["load","modal_blocker"],["click","isOpened"],["mousedown","pop.doEvent"],["error","blocker"],["click","alink"],["","daadb"],["load","google-analytics"],["","sessionStorage"],["load","fetch"],["click","/event_callback=function\\(\\){window\\.location=t\\.getAttribute\\(\"href\"\\)/"],["","Adb"]];

const hostnamesMap = new Map([["newser.com",0],["sport1.de",2],["userscloud.com",3],["timesofindia.indiatimes.com",4],["drrtyr.mx",4],["pinoyalbums.com",4],["multiplayer.it",4],["mediafire.com",[5,6]],["pinsystem.co.uk",7],["fembed.com",7],["ancensored.com",7],["o2tvseries.com",7],["mp3fiber.com",[7,17]],["xrivonet.info",7],["afreesms.com",8],["tio.ch",8],["lavanguardia.com",8],["eplayer.click",8],["free-mp3-download.net",8],["kingofdown.com",9],["radiotormentamx.com",9],["quelleestladifference.fr",9],["otakuworldsite.blogspot.com",9],["ad-itech.blogspot.com",9],["sna3talaflam.com",9],["agar.pro",9],["unlockapk.com",9],["mobdi3ips.com",9],["socks24.org",9],["interviewgig.com",9],["javaguides.net",9],["almohtarif-tech.net",9],["forum.release-apk.com",9],["devoloperxda.blogspot.com",9],["zwergenstadt.com",9],["primedeportes.es",9],["upxin.net",9],["ciudadblogger.com",9],["ke-1.com",9],["secretsdeepweb.blogspot.com",9],["bit-shares.com",9],["itdmusics.com",9],["aspdotnet-suresh.com",9],["tudo-para-android.com",9],["urdulibrarypk.blogspot.com",9],["zerotopay.com",9],["akw.to",9],["mawsueaa.com",9],["hesgoal-live.io",9],["king-shoot.io",9],["bibme.org",13],["citationmachine.net",13],["easybib.com",14],["vermangasporno.com",15],["imgtorrnt.in",15],["picbaron.com",[15,130]],["worldcupfootball.me",15],["letmejerk.com",15],["letmejerk2.com",15],["letmejerk3.com",15],["letmejerk4.com",15],["letmejerk5.com",15],["letmejerk6.com",15],["letmejerk7.com",15],["dlapk4all.com",15],["kropic.com",15],["kvador.com",15],["pdfindir.net",15],["brstej.com",15],["topwwnews.com",15],["xsanime.com",15],["vidlo.us",15],["put-locker.com",15],["youx.xxx",15],["animeindo.asia",15],["masahub.net",15],["adclickersbot.com",15],["badtaste.it",16],["mage.si",17],["totaldebrid.org",17],["neko-miku.com",17],["elsfile.org",17],["venstrike.jimdofree.com",17],["schrauben-normen.de",17],["avengerinator.blogspot.com",17],["link-to.net",17],["hanimesubth.com",17],["gsmturkey.net",17],["adshrink.it",17],["presentation-ppt.com",17],["mangacanblog.com",17],["pekalongan-cits.blogspot.com",17],["4tymode.win",17],["linkvertise.com",17],["reifenrechner.at",17],["tire-size-calculator.info",17],["linuxsecurity.com",17],["encodinghub.com",17],["itsguider.com",17],["cotravinh.blogspot.com",17],["itudong.com",17],["shortx.net",17],["comandotorrenthd.org",17],["turkdebrid.net",17],["lecturel.com",17],["bakai.org",17],["nar.k-ba.net",17],["tiroalpalo.org",17],["shemalez.com",19],["tubepornclassic.com",19],["gotporn.com",20],["freepornrocks.com",20],["tvhai.org",20],["simpcity.su",20],["realgfporn.com",[21,22]],["titsbox.com",21],["thisvid.com",22],["xvideos-downloader.net",22],["imgspice.com",23],["vikiporn.com",24],["tnaflix.com",24],["hentai2w.com",[24,182]],["yourlust.com",24],["hotpornfile.org",24],["watchfreexxx.net",24],["vintageporntubes.com",24],["angelgals.com",24],["babesexy.com",24],["porndaa.com",24],["ganstamovies.com",24],["youngleak.com",24],["porndollz.com",24],["xnxxvideo.pro",24],["xvideosxporn.com",24],["onlyhgames.com",24],["filmpornofrancais.fr",24],["pictoa.com",[24,48]],["adultasianporn.com",24],["nsfwmonster.com",24],["girlsofdesire.org",24],["gaytail.com",24],["fetish-bb.com",24],["rumporn.com",24],["soyoungteens.com",24],["zubby.com",24],["lesbian8.com",24],["gayforfans.com",24],["reifporn.de",24],["javtsunami.com",24],["18tube.sex",24],["xxxextreme.org",24],["amateurs-fuck.com",24],["sex-amateur-clips.com",24],["hentaiworld.tv",24],["dads-banging-teens.com",24],["home-xxx-videos.com",24],["mature-chicks.com",24],["teens-fucking-matures.com",24],["hqbang.com",24],["darknessporn.com",24],["familyporner.com",24],["freepublicporn.com",24],["pisshamster.com",24],["punishworld.com",24],["xanimu.com",24],["pornhd.com",25],["cnnamador.com",[25,37]],["cle0desktop.blogspot.com",25],["turkanime.co",25],["camclips.tv",[25,50]],["blackpornhq.com",25],["xsexpics.com",25],["ulsex.net",25],["wannafreeporn.com",25],["ytube2dl.com",25],["multiup.us",25],["protege-torrent.com",25],["pussyspace.com",[26,27]],["pussyspace.net",[26,27]],["empflix.com",28],["cpmlink.net",29],["bdsmstreak.com",29],["cutpaid.com",29],["pornforrelax.com",29],["fatwhitebutt.com",29],["mavplay.xyz",29],["sunporno.com",[30,31,182]],["short.pe",32],["bs.to",35],["efukt.com",35],["generacionretro.net",36],["nuevos-mu.ucoz.com",36],["micloudfiles.com",36],["mimaletamusical.blogspot.com",36],["visionias.net",36],["b3infoarena.in",36],["lurdchinexgist.blogspot.com",36],["thefreedommatrix.blogspot.com",36],["hentai-vl.blogspot.com",36],["projetomotog.blogspot.com",36],["ktmx.pro",36],["lirik3satu.blogspot.com",36],["marketmovers.it",36],["pharmaguideline.com",36],["safemaru.blogspot.com",36],["mixloads.com",36],["mangaromance.eu",36],["interssh.com",36],["freesoftpdfdownload.blogspot.com",36],["cirokun.blogspot.com",36],["myadslink.com",36],["blackavelic.com",36],["server.satunivers.tv",36],["eg-akw.com",36],["xn--mgba7fjn.cc",36],["flashingjungle.com",37],["ma-x.org",38],["lavozdegalicia.es",38],["xmovies08.org",40],["globaldjmix.com",41],["zazzybabes.com",42],["haaretz.co.il",43],["haaretz.com",43],["slate.com",44],["megalinks.info",45],["megapastes.com",45],["mega-mkv.com",[45,46]],["mkv-pastes.com",45],["zpaste.net",45],["zlpaste.net",45],["9xlinks.site",45],["zona-leros.net",46],["acortarm.xyz",47],["acortame.xyz",47],["cine.to",[48,186]],["kissasia.cc",48],["nzbstars.com",49],["digjav.com",50],["videoszoofiliahd.com",51],["xxxtubezoo.com",52],["zooredtube.com",52],["megacams.me",54],["rlslog.net",54],["porndoe.com",55],["acienciasgalilei.com",57],["playrust.io",58],["payskip.org",59],["short-url.link",60],["tubedupe.com",61],["mcrypto.club",62],["fatgirlskinny.net",63],["polska-ie.com",63],["windowsmatters.com",63],["canaltdt.es",64],["masbrooo.com",64],["2ndrun.tv",64],["stfly.me",65],["oncehelp.com",65],["queenfaucet.website",65],["curto.win",65],["smallseotools.com",66],["macwelt.de",68],["pcwelt.de",68],["capital.de",68],["geo.de",68],["allmomsex.com",69],["allnewindianporn.com",69],["analxxxvideo.com",69],["animalextremesex.com",69],["anime3d.xyz",69],["animefuckmovies.com",69],["animepornfilm.com",69],["animesexbar.com",69],["animesexclip.com",69],["animexxxsex.com",69],["animexxxfilms.com",69],["anysex.club",69],["apetube.asia",69],["asianfuckmovies.com",69],["asianfucktube.com",69],["asianporn.sexy",69],["asiansexcilps.com",69],["beeg.fund",69],["beegvideoz.com",69],["bestasiansex.pro",69],["bigsexhub.com",69],["bravotube.asia",69],["brutalanimalsfuck.com",69],["candyteenporn.com",69],["daddyfuckmovies.com",69],["desifuckonline.com",69],["exclusiveasianporn.com",69],["exteenporn.com",69],["fantasticporn.net",69],["fantasticyoungporn.com",69],["fineasiansex.com",69],["firstasianpussy.com",69],["freeindiansextube.com",69],["freepornasians.com",69],["freerealvideo.com",69],["fuck-beeg.com",69],["fuck-xnxx.com",69],["fuckasian.pro",69],["fuckfuq.com",69],["fuckundies.com",69],["fullasiantube.com",69],["gojapaneseporn.com",69],["golderotica.com",69],["goodyoungsex.com",69],["goyoungporn.com",69],["hardxxxmoms.com",69],["hdvintagetube.com",69],["hentaiporn.me",69],["hentaisexfilms.com",69],["hentaisexuality.com",69],["hot-teens-movies.mobi",69],["hotanimepornvideos.com",69],["hotanimevideos.com",69],["hotasianpussysex.com",69],["hotjapaneseshows.com",69],["hotmaturetube.com",69],["hotmilfs.pro",69],["hotorientalporn.com",69],["hotpornsexvideos.com",69],["hotpornyoung.com",69],["hotxxxjapanese.com",69],["hotxxxpussy.com",69],["indiafree.net",69],["indianpornvideo.online",69],["japanpornclip.com",69],["japanesetube.video",69],["japansex.me",69],["japanesexxxporn.com",69],["japansporno.com",69],["japanxxx.asia",69],["japanxxxworld.com",69],["keezmovies.surf",69],["lingeriefuckvideo.com",69],["liveanimalporn.zooo.club",69],["madhentaitube.com",69],["megahentaitube.com",69],["megajapanesesex.com",69],["megajapantube.com",69],["milfxxxpussy.com",69],["momsextube.pro",69],["momxxxass.com",69],["monkeyanimalporn.com",69],["moviexxx.mobi",69],["newanimeporn.com",69],["newjapanesexxx.com",69],["nicematureporn.com",69],["nudeplayboygirls.com",69],["openxxxporn.com",69],["originalindianporn.com",69],["originalteentube.com",69],["pig-fuck.com",69],["plainasianporn.com",69],["popularasianxxx.com",69],["pornanimetube.com",69],["pornasians.pro",69],["pornhat.asia",69],["pornheed.online",69],["pornjapanesesex.com",69],["pornomovies.asia",69],["pornvintage.tv",69],["primeanimesex.com",69],["realjapansex.com",69],["realmomsex.com",69],["redsexhub.com",69],["retroporn.world",69],["retrosexfilms.com",69],["sex-free-movies.com",69],["sexanimesex.com",69],["sexanimetube.com",69],["sexjapantube.com",69],["sexmomvideos.com",69],["sexteenxxxtube.com",69],["sexxxanimal.com",69],["sexyoungtube.com",69],["sexyvintageporn.com",69],["sopornmovies.com",69],["spicyvintageporn.com",69],["sunporno.club",69],["tabooanime.club",69],["teenextrem.com",69],["teenfucksex.com",69],["teenhost.net",69],["teensexass.com",69],["tnaflix.asia",69],["totalfuckmovies.com",69],["totalmaturefuck.com",69],["txxx.asia",69],["voyeurpornsex.com",69],["warmteensex.com",69],["wetasiancreampie.com",69],["wildhentaitube.com",69],["wowyoungsex.com",69],["xhamster-art.com",69],["xmovie.pro",69],["xnudevideos.com",69],["xnxxjapon.com",69],["xpics.me",69],["xvide.me",69],["xxxanimefuck.com",69],["xxxanimevideos.com",69],["xxxanimemovies.com",69],["xxxhentaimovies.com",69],["xxxhothub.com",69],["xxxjapaneseporntube.com",69],["xxxlargeporn.com",69],["xxxmomz.com",69],["xxxpornmilf.com",69],["xxxpussyclips.com",69],["xxxpussysextube.com",69],["xxxretrofuck.com",69],["xxxsex.pro",69],["xxxsexyjapanese.com",69],["xxxteenyporn.com",69],["xxxvideo.asia",69],["xxxvideos.ink",69],["xxxyoungtv.com",69],["youjizzz.club",69],["youngpussyfuck.com",69],["bayimg.com",70],["celeb.gate.cc",71],["eodev.com",72],["masterplayer.xyz",74],["pussy-hub.com",74],["porndex.com",75],["compucalitv.com",76],["diariodenavarra.es",78],["duden.de",80],["pennlive.com",82],["beautypageants.indiatimes.com",83],["01fmovies.com",84],["lnk2.cc",86],["fullhdxxx.com",87],["luscious.net",[87,130]],["classicpornbest.com",87],["1youngteenporn.com",87],["www-daftarharga.blogspot.com",[87,171]],["miraculous.to",[87,177]],["vtube.to",87],["gosexpod.com",88],["otakukan.com",89],["xcafe.com",90],["pornfd.com",90],["venusarchives.com",90],["imagehaha.com",91],["imagenpic.com",91],["imageshimage.com",91],["imagetwist.com",91],["k1nk.co",92],["watchasians.cc",92],["alexsports.xyz",92],["lulustream.com",92],["luluvdo.com",92],["web.de",93],["news18.com",94],["thelanb.com",95],["dropmms.com",95],["softwaredescargas.com",96],["cracking-dz.com",97],["anitube.ninja",98],["gazzetta.it",99],["alliptvlinks.com",100],["waterfall.money",100],["port.hu",102],["dziennikbaltycki.pl",103],["dzienniklodzki.pl",103],["dziennikpolski24.pl",103],["dziennikzachodni.pl",103],["echodnia.eu",103],["expressbydgoski.pl",103],["expressilustrowany.pl",103],["gazetakrakowska.pl",103],["gazetalubuska.pl",103],["gazetawroclawska.pl",103],["gk24.pl",103],["gloswielkopolski.pl",103],["gol24.pl",103],["gp24.pl",103],["gra.pl",103],["gs24.pl",103],["kurierlubelski.pl",103],["motofakty.pl",103],["naszemiasto.pl",103],["nowiny24.pl",103],["nowosci.com.pl",103],["nto.pl",103],["polskatimes.pl",103],["pomorska.pl",103],["poranny.pl",103],["sportowy24.pl",103],["strefaagro.pl",103],["strefabiznesu.pl",103],["stronakobiet.pl",103],["telemagazyn.pl",103],["to.com.pl",103],["wspolczesna.pl",103],["course9x.com",103],["courseclub.me",103],["azrom.net",103],["alttyab.net",103],["esopress.com",103],["nesiaku.my.id",103],["onemanhua.com",104],["freeindianporn.mobi",104],["dr-farfar.com",105],["boyfriendtv.com",106],["brandstofprijzen.info",107],["netfuck.net",108],["blog24.me",[108,126]],["kisahdunia.com",108],["javsex.to",108],["nulljungle.com",108],["oyuncusoruyor.com",108],["pbarecap.ph",108],["sourds.net",108],["teknobalta.com",108],["tvinternetowa.info",108],["sqlserveregitimleri.com",108],["tutcourse.com",108],["readytechflip.com",108],["novinhastop.com",108],["warddogs.com",108],["dvdgayporn.com",108],["iimanga.com",108],["tinhocdongthap.com",108],["tremamnon.com",108],["423down.com",108],["brizzynovel.com",108],["jugomobile.com",108],["freecodezilla.net",108],["movieslegacy.com",108],["animekhor.xyz",108],["iconmonstr.com",108],["gay-tubes.cc",108],["rbxscripts.net",108],["comentariodetexto.com",108],["wordpredia.com",108],["livsavr.co",108],["allfaucet.xyz",[108,126]],["titbytz.tk",108],["replica-watch.info",108],["alludemycourses.com",108],["kayifamilytv.com",108],["iir.ai",109],["gameofporn.com",111],["qpython.club",112],["antifake-funko.fr",112],["e9china.net",113],["ac.ontools.net",113],["marketbeat.com",114],["hentaipornpics.net",115],["apps2app.com",116],["tubereader.me",117],["repretel.com",117],["dagensnytt.com",118],["mrproblogger.com",118],["themezon.net",118],["gfx-station.com",119],["bitzite.com",[119,126,129]],["historyofroyalwomen.com",120],["davescomputertips.com",120],["ukchat.co.uk",121],["hivelr.com",122],["upshrink.com",123],["loaninsurehub.com",124],["fc-lc.xyz",125],["ohionowcast.info",126],["wiour.com",126],["appsbull.com",126],["diudemy.com",126],["maqal360.com",126],["bitcotasks.com",126],["videolyrics.in",126],["manofadan.com",126],["cempakajaya.com",126],["tagecoin.com",126],["doge25.in",126],["king-ptcs.com",126],["naijafav.top",126],["ourcoincash.xyz",126],["sh.techsamir.com",126],["claimcoins.site",126],["cryptosh.pro",126],["coinsrev.com",126],["go.freetrx.fun",126],["eftacrypto.com",126],["fescrypto.com",126],["earnhub.net",126],["kiddyshort.com",126],["tronxminer.com",126],["homeairquality.org",127],["exego.app",128],["cutlink.net",128],["cutsy.net",128],["cutyurls.com",128],["cutty.app",128],["cutnet.net",128],["aiimgvlog.fun",130],["6indianporn.com",130],["amateurebonypics.com",130],["amateuryoungpics.com",130],["cinemabg.net",130],["desimmshd.com",130],["frauporno.com",130],["givemeaporn.com",130],["jav-asia.top",130],["javf.net",130],["javideo.net",130],["kr18plus.com",130],["pilibook.com",130],["pornborne.com",130],["porngrey.com",130],["qqxnxx.com",130],["sexvideos.host",130],["submilf.com",130],["subtaboo.com",130],["tktube.com",130],["xfrenchies.com",130],["coingraph.us",131],["momo-net.com",131],["maxgaming.fi",131],["travel.vebma.com",132],["cloud.majalahhewan.com",132],["pinloker.com",132],["sekilastekno.com",132],["vulture.com",133],["megaplayer.bokracdn.run",134],["hentaistream.com",135],["siteunblocked.info",136],["larvelfaucet.com",137],["feyorra.top",137],["claimtrx.com",137],["moviesyug.net",138],["w4files.ws",138],["parispi.net",139],["simkl.com",140],["paperzonevn.com",141],["dailyvideoreports.net",142],["lewd.ninja",143],["systemnews24.com",144],["incestvidz.com",145],["niusdiario.es",146],["playporngames.com",147],["movi.pk",[148,153]],["justin.mp3quack.lol",150],["cutesexyteengirls.com",151],["asianembed.io",152],["0dramacool.net",153],["185.53.88.104",153],["185.53.88.204",153],["185.53.88.15",153],["123movies4k.net",153],["1movieshd.com",153],["1rowsports.com",153],["4share-mp3.net",153],["6movies.net",153],["9animetv.to",153],["720pstream.me",153],["aagmaal.com",153],["abysscdn.com",153],["ajkalerbarta.com",153],["akstream.xyz",153],["androidapks.biz",153],["androidsite.net",153],["animefenix.com",153],["animeonlinefree.org",153],["animesite.net",153],["animespank.com",153],["aniworld.to",153],["apkmody.io",153],["appsfree4u.com",153],["audioz.download",153],["awafim.tv",153],["bdnewszh.com",153],["beastlyprints.com",153],["bengalisite.com",153],["bestfullmoviesinhd.org",153],["betteranime.net",153],["blacktiesports.live",153],["buffsports.stream",153],["ch-play.com",153],["clickforhire.com",153],["cloudy.pk",153],["computercrack.com",153],["coolcast2.com",153],["crackedsoftware.biz",153],["crackfree.org",153],["cracksite.info",153],["cryptoblog24.info",153],["cuatrolatastv.blogspot.com",153],["cydiasources.net",153],["dirproxy.com",153],["dopebox.to",153],["downloadapk.info",153],["downloadapps.info",153],["downloadgames.info",153],["downloadmusic.info",153],["downloadsite.org",153],["downloadwella.com",153],["ebooksite.org",153],["educationtips213.blogspot.com",153],["egyup.live",153],["embed.meomeo.pw",153],["embed.scdn.to",153],["emulatorsite.com",153],["essaysharkwriting.club",153],["exploreera.net",153],["extrafreetv.com",153],["fakedetail.com",153],["fclecteur.com",153],["files.im",153],["flexyhit.com",153],["fmoviefree.net",153],["fmovies24.com",153],["footyhunter3.xyz",153],["freeflix.info",153],["freemoviesu4.com",153],["freeplayervideo.com",153],["freesoccer.net",153],["fseries.org",153],["gamefast.org",153],["gamesite.info",153],["gettapeads.com",153],["gmanga.me",153],["gocast123.me",153],["gogohd.net",153],["gogoplay5.com",153],["gooplay.net",153],["gostreamon.net",153],["happy2hub.org",153],["harimanga.com",153],["healthnewsreel.com",153],["hexupload.net",153],["hinatasoul.com",153],["hindisite.net",153],["holymanga.net",153],["hxfile.co",153],["isosite.org",153],["iv-soft.com",153],["januflix.expert",153],["jewelry.com.my",153],["johnwardflighttraining.com",153],["kabarportal.com",153],["kstorymedia.com",153],["la123movies.org",153],["lespassionsdechinouk.com",153],["lilymanga.net",153],["linksdegrupos.com.br",153],["livestreamtv.pk",153],["macsite.info",153],["mangapt.com",153],["mangareader.to",153],["mangasite.org",153],["manhuascan.com",153],["megafilmeshdseries.com",153],["megamovies.org",153],["membed.net",153],["mgnetu.com",153],["moddroid.com",153],["moviefree2.com",153],["movies-watch.com.pk",153],["moviesite.app",153],["moviesonline.fm",153],["moviesx.org",153],["moviewatchonline.com.pk",153],["msmoviesbd.com",153],["musicsite.biz",153],["myfernweh.com",153],["myviid.com",153],["nazarickol.com",153],["newsrade.com",153],["noob4cast.com",153],["nsw2u.com",[153,237]],["oko.sh",153],["olympicstreams.me",153],["orangeink.pk",153],["owllink.net",153],["pahaplayers.click",153],["patchsite.net",153],["pdfsite.net",153],["play1002.com",153],["player-cdn.com",153],["productkeysite.com",153],["projectfreetv.one",153],["romsite.org",153],["rufiguta.com",153],["rytmp3.io",153],["send.cm",153],["seriesite.net",153],["seriezloaded.com.ng",153],["serijehaha.com",153],["shrugemojis.com",153],["siteapk.net",153],["siteflix.org",153],["sitegames.net",153],["sitekeys.net",153],["sitepdf.com",153],["sitetorrent.com",153],["softwaresite.net",153],["sportbar.live",153],["sportkart1.xyz",153],["ssyoutube.com",153],["stardima.com",153],["stream4free.live",153],["superapk.org",153],["supermovies.org",153],["tainio-mania.online",153],["talaba.su",153],["tamilguns.org",153],["tatabrada.tv",153],["techtrendmakers.com",153],["theflixer.tv",153],["thememypc.net",153],["thetechzone.online",153],["thripy.com",153],["tonnestreamz.xyz",153],["travelplanspro.com",153],["turcasmania.com",153],["tusfiles.com",153],["tvonlinesports.com",153],["ultramovies.org",153],["uploadbank.com",153],["urdubolo.pk",153],["vidspeeds.com",153],["vumoo.to",153],["warezsite.net",153],["watchmovies2.com",153],["watchmoviesforfree.org",153],["watchofree.com",153],["watchsite.net",153],["watchsouthpark.tv",153],["watchtvch.club",153],["web.livecricket.is",153],["webseries.club",153],["worldcupstream.pm",153],["y2mate.com",153],["youapk.net",153],["youtube4kdownloader.com",153],["yts-subs.com",153],["haho.moe",154],["nicy-spicy.pw",155],["novelmultiverse.com",156],["mylegalporno.com",157],["thecut.com",160],["novelism.jp",161],["alphapolis.co.jp",162],["okrzone.com",163],["game3rb.com",164],["javhub.net",164],["thotvids.com",165],["berklee.edu",166],["rawkuma.com",[167,168]],["moviesjoyhd.to",168],["imeteo.sk",169],["youtubemp3donusturucu.net",170],["surfsees.com",172],["vivo.st",[173,174]],["alueviesti.fi",176],["kiuruvesilehti.fi",176],["lempaala.ideapark.fi",176],["olutposti.fi",176],["urjalansanomat.fi",176],["tainhanhvn.com",178],["titantv.com",179],["3cinfo.net",180],["transportationlies.org",181],["camarchive.tv",182],["crownimg.com",182],["freejav.guru",182],["hentai2read.com",182],["icyporno.com",182],["illink.net",182],["javtiful.com",182],["m-hentai.net",182],["pornblade.com",182],["pornfelix.com",182],["pornxxxxtube.net",182],["redwap.me",182],["redwap2.com",182],["redwap3.com",182],["tubxporn.xxx",182],["ver-comics-porno.com",182],["ver-mangas-porno.com",182],["xanimeporn.com",182],["xxxvideohd.net",182],["zetporn.com",182],["cocomanga.com",183],["mcleaks.net",184],["explorecams.com",184],["minecraft.buzz",184],["chillx.top",185],["playerx.stream",185],["m.liputan6.com",187],["stardewids.com",[187,209]],["ingles.com",188],["spanishdict.com",188],["rureka.com",189],["bunkr.is",190],["amateur8.com",191],["freeporn8.com",191],["maturetubehere.com",191],["embedo.co",192],["corriere.it",193],["oggi.it",193],["2the.space",194],["apkcombo.com",195],["sponsorhunter.com",196],["soft98.ir",197],["novelssites.com",198],["haxina.com",199],["cryptofenz.xyz",199],["torrentmac.net",200],["udvl.com",201],["moviezaddiction.icu",202],["dlpanda.com",203],["socialmediagirls.com",204],["einrichtungsbeispiele.de",205],["weadown.com",206],["molotov.tv",207],["freecoursesonline.me",208],["adelsfun.com",208],["advantien.com",208],["bailbondsfinder.com",208],["bigpiecreative.com",208],["childrenslibrarylady.com",208],["classifarms.com",208],["comtasq.ca",208],["crone.es",208],["ctrmarketingsolutions.com",208],["dropnudes.com",208],["ftuapps.dev",208],["genzsport.com",208],["ghscanner.com",208],["grsprotection.com",208],["gruporafa.com.br",208],["inmatefindcalifornia.com",208],["inmatesearchidaho.com",208],["itsonsitetv.com",208],["mfmfinancials.com",208],["myproplugins.com",208],["onehack.us",208],["ovester.com",208],["paste.bin.sx",208],["privatenudes.com",208],["renoconcrete.ca",208],["richieashbeck.com",208],["sat.technology",208],["short1ink.com",208],["stpm.co.uk",208],["wegotcookies.co",208],["mathcrave.com",208],["commands.gg",209],["smgplaza.com",210],["freepik.com",211],["diyphotography.net",213],["bitchesgirls.com",214],["shopforex.online",215],["programmingeeksclub.com",217],["easymc.io",218],["diendancauduong.com",219],["parentcircle.com",220],["h-game18.xyz",221],["nopay.info",222],["wheelofgold.com",223],["shortlinks.tech",224],["skill4ltu.eu",226],["freepikdownloader.com",227],["freepasses.org",228],["iusedtobeaboss.com",229],["androidpolice.com",230],["cbr.com",230],["dualshockers.com",230],["gamerant.com",230],["howtogeek.com",230],["thegamer.com",230],["blogtruyenmoi.com",231],["igay69.com",232],["graphicget.com",233],["qiwi.gg",234],["netcine2.la",235],["cbc.ca",236]]);

const entitiesMap = new Map([["kisscartoon",1],["kissasian",7],["ganool",7],["pirate",7],["piratebay",7],["pirateproxy",7],["proxytpb",7],["thepiratebay",7],["limetorrents",[9,15]],["king-pes",9],["depedlps",9],["komikcast",9],["idedroidsafelink",9],["links-url",9],["eikaiwamastery",9],["ak4eg",9],["streanplay",10],["steanplay",10],["liferayiseasy",[11,12]],["pahe",15],["yts",15],["tube8",15],["topeuropix",15],["moviescounter",15],["torrent9",15],["desiremovies",15],["movs4u",15],["uwatchfree",15],["hydrax",15],["4movierulz",15],["projectfreetv",15],["arabseed",15],["btdb",[15,58]],["skymovieshd",15],["world4ufree",15],["streamsport",15],["rojadirectatvhd",15],["userload",15],["freecoursesonline",17],["lordpremium",17],["todovieneok",17],["novablogitalia",17],["anisubindo",17],["btvsports",17],["adyou",18],["fxporn69",21],["rexporn",25],["movies07",25],["pornocomics",25],["sexwebvideo",29],["pornomoll",29],["gsurl",32],["mimaletadepeliculas",33],["readcomiconline",34],["burningseries",35],["dz4soft",36],["yoututosjeff",36],["ebookmed",36],["lanjutkeun",36],["novelasesp",36],["singingdalong",36],["doujindesu",36],["xmovies8",39],["mega-dvdrip",46],["peliculas-dvdrip",46],["desbloqueador",47],["newpelis",[48,56]],["pelix",[48,56]],["allcalidad",[48,182]],["khatrimaza",48],["camwhores",50],["camwhorestv",50],["uproxy",50],["nekopoi",53],["mirrorace",62],["mixdrp",67],["asiansex",69],["japanfuck",69],["japanporn",69],["teensex",69],["vintagetube",69],["xxxmovies",69],["zooqle",73],["hdfull",77],["mangamanga",79],["streameast",81],["thestreameast",81],["vev",85],["vidop",85],["zone-telechargement",87],["megalink",92],["gmx",93],["mega1080p",98],["9hentai",101],["gaypornhdfree",108],["cinemakottaga",108],["privatemoviez",108],["apkmaven",108],["popcornstream",110],["pornktube",130],["watchseries",130],["milfnut",131],["pagalmovies",138],["7starhd",138],["jalshamoviez",138],["9xupload",138],["bdupload",138],["desiupload",138],["rdxhd1",138],["moviessources",149],["nuvid",150],["goload",[152,153]],["0gomovie",153],["0gomovies",153],["123moviefree",153],["1kmovies",153],["1madrasdub",153],["1primewire",153],["2embed",153],["2madrasdub",153],["2umovies",153],["4anime",153],["9xmovies",153],["adblockplustape",153],["altadefinizione01",153],["anitube",153],["atomixhq",153],["beinmatch",153],["brmovies",153],["cima4u",153],["clicknupload",153],["cmovies",153],["couchtuner",153],["cricfree",153],["crichd",153],["databasegdriveplayer",153],["dood",153],["f1stream",153],["faselhd",153],["fbstream",153],["file4go",153],["filemoon",153],["filepress",[153,212]],["filmlinks4u",153],["filmpertutti",153],["filmyzilla",153],["fmovies",153],["french-stream",153],["fsapi",153],["fzlink",153],["gdriveplayer",153],["gofilms4u",153],["gogoanime",153],["gomoviefree",153],["gomoviz",153],["gowatchseries",153],["hdmoviefair",153],["hdmovies4u",153],["hdmovies50",153],["hdmoviesfair",153],["hh3dhay",153],["hindilinks4u",153],["hotmasti",153],["hurawatch",153],["klmanga",153],["klubsports",153],["libertestreamvf",153],["livetvon",153],["manga1000",153],["manga1001",153],["mangaraw",153],["mangarawjp",153],["mlbstream",153],["motogpstream",153],["movierulz",153],["movies123",153],["movies2watch",153],["moviesden",153],["moviezaddiction",153],["myflixer",153],["nbastream",153],["netcine",153],["nflstream",153],["nhlstream",153],["onlinewatchmoviespk",153],["pctfenix",153],["pctnew",153],["pksmovies",153],["plyjam",153],["plylive",153],["pogolinks",153],["popcorntime",153],["poscitech",153],["prmovies",153],["rugbystreams",153],["shahed4u",153],["sflix",153],["sitesunblocked",153],["socceronline",153],["solarmovies",153],["sportcast",153],["sportskart",153],["sports-stream",153],["streaming-french",153],["streamers",153],["streamingcommunity",153],["strikeout",153],["t20cup",153],["tennisstreams",153],["torrentdosfilmes",153],["toonanime",153],["tvply",153],["ufcstream",153],["uptomega",153],["uqload",153],["vudeo",153],["vidoo",153],["vipbox",153],["vipboxtv",153],["vipleague",153],["viprow",153],["yesmovies",153],["yomovies",153],["yomovies1",153],["yt2mp3s",153],["kat",153],["katbay",153],["kickass",153],["kickasshydra",153],["kickasskat",153],["kickass2",153],["kickasstorrents",153],["kat2",153],["kattracker",153],["thekat",153],["thekickass",153],["kickassz",153],["kickasstorrents2",153],["topkickass",153],["kickassgo",153],["kkickass",153],["kkat",153],["kickasst",153],["kick4ss",153],["guardaserie",158],["cine-calidad",159],["videovard",175],["gntai",182],["grantorrent",182],["mejortorrent",182],["mejortorrento",182],["mejortorrents",182],["mejortorrents1",182],["mejortorrentt",182],["bg-gledai",208],["gledaitv",208],["shineads",216],["motchill",225]]);

const exceptionsMap = new Map([["mentor.duden.de",[80]],["forum.soft98.ir",[197]]]);

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
            debugger; // jshint ignore:line
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
