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

const argsList = [["load","Object"],["mousedown","clientX"],["load","hard_block"],["/contextmenu|keydown/"],["","adb"],["click","ClickHandler"],["load","IsAdblockRequest"],["/^(?:click|mousedown)$/","_0x"],["error"],["load","onload"],["","BACK"],["load","getComputedStyle"],["load","adsense"],["load","(!o)"],["load","(!i)"],["","_0x"],["","Adblock"],["load","nextFunction"],["/^(?:click|mousedown)$/","bypassEventsInProxies"],["","window.open"],["","open"],["click","exopop"],["/^(?:load|click)$/","popMagic"],["mousedown","popundrInit"],["getexoloader"],["","pop"],["load","exoJsPop101"],["/^loadex/"],["","/exo"],["","_blank"],["",";}"],["load","BetterPop"],["mousedown","preventDefault"],["load","advertising"],["mousedown","localStorage"],["click","preventDefault"],["load","2000"],["/^(click|mousedown|mousemove|touchstart|touchend|touchmove)/","system.popunder"],["load","adb"],["/^(?:click|mousedown|mousemove|touchstart|touchend|touchmove)$/","system.popunder"],["","'0x"],["/DOMContentLoaded|load/","y.readyState"],["/error|canplay/","(t)"],["load","hblocked"],["error","Adblocker"],["DOMContentLoaded","adlinkfly"],["DOMContentLoaded","shortener"],["mousedown","trigger"],["","0x"],["","Pop"],["/^(?:click|mousedown)$/","popunder"],["DOMContentLoaded","preventExit"],["","adsense"],["load"],["click","pop_under"],["load","url"],["load","adverts-top-container"],["","Date"],["DOMContentLoaded","&nbsp"],["click","read_cookie"],["","midRoll"],["click","_0x"],["load","isBlanketFound"],["load","showModal"],["click","trigger"],["mouseout","clientWidth"],["load","download-wrapper"],["load","autoRecov"],["popstate","noPop"],["/^(?:click|mousedown)$/","ppu"],["click","native code"],["message","data.slice"],["/^(?:mousedown|mouseup)$/","0x"],["click","popundr"],["click"],["DOMContentLoaded","compupaste"],["mousedown","!!{});"],["DOMContentLoaded","/adblock/i"],["keydown"],["DOMContentLoaded","isMobile"],["/^/","0x"],["load","PrivateMode"],["scroll","_0x"],["DOMContentLoaded","checkVPN"],["/^(?:click|mousedown|mouseup)$/","di()"],["","\\"],["popstate"],["click","my_inter_listen"],["load","appendChild"],["","bi()"],["","checkTarget"],["click","popunder"],["timeupdate"],["scroll","getElementById"],["load","undefined"],["DOMContentLoaded","scriptwz_url"],["load","0x"],["DOMContentLoaded","btoa"],["adblockActivated"],["click","saveLastEvent"],["DOMContentLoaded","offsetHeight"],["","show"],["/.?/","popMagic"],["","ads"],["click","interstitial"],["load","antiblock"],["DOMContentLoaded","adsBlocked"],["load",".appendChild"],["","btoa"],["","exopop"],["DOMContentLoaded","AdBlock"],["load","blocker"],["mouseleave","NativeDisplayAdID"],["mouseover","event.triggered"],["load","removeChild"],["load","ads"],["click","ShouldShow"],["/adblock/i"],["load","doTest"],["DOMContentLoaded","antiAdBlockerHandler"],["DOMContentLoaded","daadb_get_data_fetch"],["click","splashPage"],["load","detect-modal"],["load","_0x"],["click","clickCount"],["DOMContentLoaded","canRedirect"],["DOMContentLoaded","adb"],["error","/\\{[a-z]\\(e\\)\\}/"],["DOMContentLoaded","iframe"],["","/_blank/i"],["load","htmls"],["blur","focusOut"],["click","handleClick"],["DOMContentLoaded","location.href"],["","popMagic"],["contextmenu"],["blur","counter"],["/^(?:click|mousedown)$/","latest!=="],["DOMContentLoaded",".ready"],["load","script"],["","/pop|wm|forceClick/"],["load","block"],["","/_0x|localStorage\\.getItem/"],["DOMContentLoaded","adblock"],["load","head"],["visibilitychange"],["load","/showModal|isBlanketFound/"],["click","shouldShow"],["","/ads|Modal/"],["DOMContentLoaded","init"],["load","Adblock"],["DOMContentLoaded","window.open"],["","vads"],["devtoolschange"],["click","open"],["beforeunload"],["","break;case $."],["mouseup","decodeURIComponent"],["/(?:click|touchend)/","_0x"],["","removeChild"],["click","pu_count"],["","/pop|_blank/"],["click","allclick_Public"],["click","0x"],["/touchstart|mousedown|click/","latest"],["blur","native code"],["blur","event.simulate"],["click","_blank"],["DOMContentLoaded","0x"],["click","overlay"],["scroll","undefined"],["readystatechange","document.removeEventListener"],["mousedown","shown_at"],["scroll","detect"],["click","t(a)"],["","focus"],["DOMContentLoaded","deblocker"],["","preventDefault"],["click","tabunder"],["mouseup","catch"],["scroll","innerHeight"],["hashchange"],["load","/nextFunction|2000/"],["load","player"],["","document.oncontextmenu"],["","about:blank"],["click","popMagic"],["load","popMagic"],["DOMContentLoaded","adsSrc"],["np.detect"],["click","Popup"],["","/open.*_blank/"],["scroll"],["","isBlocking"],["timeupdate","","elements",".quiver-cam-player--ad-not-running.quiver-cam-player--free video"],["","$"],["","exoJsPop101"],["/click|mousedown/","catch"],["","init"],["adb"],["scroll","modal"],["DOMContentLoaded","clientHeight"],["click","window.focus"],["click","[native code]"],["click","event.dispatch"],["load","adblock"],["","Math"],["DOMContentLoaded","popupurls"],["","tabUnder"],["load","XMLHttpRequest"],["load","puURLstrpcht"],["load","AdBlocker"],["","showModal"],["","goog"],["load","abDetectorPro"],["","document.body"],["","modal"],["click","pop"],["click","adobeModalTestABenabled"],["blur","console.log"],["","AdB"],["load","adSession"],["load","Ads"],["DOMContentLoaded","googlesyndication"],["np.evtdetect"],["load","popunder"],["scroll","function(e)"],["DOMContentLoaded","adlinkfly_url"],["mousedown"],["load","document.getElementById"],["mousedown","tabUnder"],["click","popactive"],["load","adsbygoogle"],["load","modal_blocker"],["click","isOpened"],["mousedown","pop.doEvent"],["error","blocker"],["click","alink"],["","daadb"],["load","google-analytics"],["","sessionStorage"],["load","fetch"],["click","pingUrl"],["mousedown","scoreUrl"],["click","/event_callback=function\\(\\){window\\.location=t\\.getAttribute\\(\"href\"\\)/"],["","Adb"]];

const hostnamesMap = new Map([["newser.com",0],["sport1.de",2],["userscloud.com",3],["timesofindia.indiatimes.com",4],["drrtyr.mx",4],["pinoyalbums.com",4],["multiplayer.it",4],["mediafire.com",[5,6]],["pinsystem.co.uk",7],["fembed.com",7],["ancensored.com",7],["mp3fiber.com",[7,17]],["xrivonet.info",7],["afreesms.com",8],["tu.no",8],["tio.ch",8],["lavanguardia.com",8],["eplayer.click",8],["kingofdown.com",9],["radiotormentamx.com",9],["quelleestladifference.fr",9],["otakuworldsite.blogspot.com",9],["ad-itech.blogspot.com",9],["sna3talaflam.com",9],["agar.pro",9],["unlockapk.com",9],["mobdi3ips.com",9],["socks24.org",9],["interviewgig.com",9],["javaguides.net",9],["almohtarif-tech.net",9],["forum.release-apk.com",9],["devoloperxda.blogspot.com",9],["zwergenstadt.com",9],["primedeportes.es",9],["upxin.net",9],["ciudadblogger.com",9],["ke-1.com",9],["secretsdeepweb.blogspot.com",9],["bit-shares.com",9],["itdmusics.com",9],["aspdotnet-suresh.com",9],["tudo-para-android.com",9],["urdulibrarypk.blogspot.com",9],["zerotopay.com",9],["akw.to",9],["mawsueaa.com",9],["hesgoal-live.io",9],["king-shoot.io",9],["bibme.org",13],["citationmachine.net",13],["easybib.com",14],["vermangasporno.com",15],["imgtorrnt.in",15],["picbaron.com",[15,134]],["letmejerk.com",15],["letmejerk2.com",15],["letmejerk3.com",15],["letmejerk4.com",15],["letmejerk5.com",15],["letmejerk6.com",15],["letmejerk7.com",15],["dlapk4all.com",15],["kropic.com",15],["kvador.com",15],["pdfindir.net",15],["brstej.com",15],["topwwnews.com",15],["xsanime.com",15],["vidlo.us",15],["put-locker.com",15],["youx.xxx",15],["animeindo.asia",15],["masahub.net",15],["adclickersbot.com",15],["badtaste.it",16],["mage.si",17],["totaldebrid.org",17],["neko-miku.com",17],["elsfile.org",17],["venstrike.jimdofree.com",17],["schrauben-normen.de",17],["avengerinator.blogspot.com",17],["link-to.net",17],["hanimesubth.com",17],["gsmturkey.net",17],["adshrink.it",17],["presentation-ppt.com",17],["mangacanblog.com",17],["pekalongan-cits.blogspot.com",17],["4tymode.win",17],["eurotruck2.com.br",17],["linkvertise.com",17],["reifenrechner.at",17],["tire-size-calculator.info",17],["linuxsecurity.com",17],["encodinghub.com",17],["itsguider.com",17],["cotravinh.blogspot.com",17],["itudong.com",17],["shortx.net",17],["lecturel.com",17],["bakai.org",17],["nar.k-ba.net",17],["tiroalpalo.org",17],["shemalez.com",19],["tubepornclassic.com",19],["gotporn.com",20],["freepornrocks.com",20],["tvhai.org",20],["simpcity.su",20],["realgfporn.com",[21,22]],["titsbox.com",21],["thisvid.com",22],["xvideos-downloader.net",22],["imgspice.com",23],["vikiporn.com",24],["tnaflix.com",24],["hentai2w.com",[24,186]],["yourlust.com",24],["hotpornfile.org",24],["watchfreexxx.net",24],["vintageporntubes.com",24],["angelgals.com",24],["babesexy.com",24],["porndaa.com",24],["ganstamovies.com",24],["youngleak.com",24],["porndollz.com",24],["xnxxvideo.pro",24],["xvideosxporn.com",24],["onlyhgames.com",24],["filmpornofrancais.fr",24],["pictoa.com",[24,48]],["adultasianporn.com",24],["nsfwmonster.com",24],["girlsofdesire.org",24],["gaytail.com",24],["fetish-bb.com",24],["rumporn.com",24],["soyoungteens.com",24],["zubby.com",24],["lesbian8.com",24],["gayforfans.com",24],["reifporn.de",24],["javtsunami.com",24],["18tube.sex",24],["xxxextreme.org",24],["amateurs-fuck.com",24],["sex-amateur-clips.com",24],["hentaiworld.tv",24],["dads-banging-teens.com",24],["home-xxx-videos.com",24],["mature-chicks.com",24],["teens-fucking-matures.com",24],["hqbang.com",24],["darknessporn.com",24],["familyporner.com",24],["freepublicporn.com",24],["pisshamster.com",24],["punishworld.com",24],["xanimu.com",24],["pornhd.com",25],["cnnamador.com",[25,37]],["cle0desktop.blogspot.com",25],["turkanime.co",25],["camclips.tv",[25,49]],["blackpornhq.com",25],["xsexpics.com",25],["ulsex.net",25],["wannafreeporn.com",25],["ytube2dl.com",25],["multiup.us",25],["protege-torrent.com",25],["pussyspace.com",[26,27]],["pussyspace.net",[26,27]],["empflix.com",28],["cpmlink.net",29],["bdsmstreak.com",29],["cutpaid.com",29],["pornforrelax.com",29],["fatwhitebutt.com",29],["mavplay.xyz",29],["sunporno.com",[30,31,186]],["short.pe",32],["bs.to",35],["efukt.com",35],["generacionretro.net",36],["nuevos-mu.ucoz.com",36],["micloudfiles.com",36],["mimaletamusical.blogspot.com",36],["visionias.net",36],["b3infoarena.in",36],["lurdchinexgist.blogspot.com",36],["thefreedommatrix.blogspot.com",36],["hentai-vl.blogspot.com",36],["projetomotog.blogspot.com",36],["ktmx.pro",36],["lirik3satu.blogspot.com",36],["marketmovers.it",36],["pharmaguideline.com",36],["safemaru.blogspot.com",36],["mixloads.com",36],["mangaromance.eu",36],["interssh.com",36],["freesoftpdfdownload.blogspot.com",36],["cirokun.blogspot.com",36],["myadslink.com",36],["blackavelic.com",36],["server.satunivers.tv",36],["eg-akw.com",36],["xn--mgba7fjn.cc",36],["flashingjungle.com",37],["ma-x.org",38],["lavozdegalicia.es",38],["xmovies08.org",40],["globaldjmix.com",41],["zazzybabes.com",42],["haaretz.co.il",43],["haaretz.com",43],["slate.com",44],["megalinks.info",45],["megapastes.com",45],["mega-mkv.com",[45,46]],["mkv-pastes.com",45],["zpaste.net",45],["zlpaste.net",45],["9xlinks.site",45],["zona-leros.net",46],["acortarm.xyz",47],["acortame.xyz",47],["cine.to",[48,191]],["kissasia.cc",48],["digjav.com",49],["videoszoofiliahd.com",50],["xxxtubezoo.com",51],["zooredtube.com",51],["megacams.me",53],["rlslog.net",53],["porndoe.com",54],["acienciasgalilei.com",56],["playrust.io",57],["payskip.org",58],["short-url.link",59],["tubedupe.com",60],["mcrypto.club",61],["fatgirlskinny.net",62],["polska-ie.com",62],["windowsmatters.com",62],["canaltdt.es",63],["masbrooo.com",63],["2ndrun.tv",63],["stfly.me",64],["oncehelp.com",64],["queenfaucet.website",64],["curto.win",64],["smallseotools.com",65],["macwelt.de",67],["pcwelt.de",67],["capital.de",67],["geo.de",67],["allmomsex.com",68],["allnewindianporn.com",68],["analxxxvideo.com",68],["animalextremesex.com",68],["anime3d.xyz",68],["animefuckmovies.com",68],["animepornfilm.com",68],["animesexbar.com",68],["animesexclip.com",68],["animexxxsex.com",68],["animexxxfilms.com",68],["anysex.club",68],["apetube.asia",68],["asianfuckmovies.com",68],["asianfucktube.com",68],["asianporn.sexy",68],["asiansexcilps.com",68],["beeg.fund",68],["beegvideoz.com",68],["bestasiansex.pro",68],["bravotube.asia",68],["brutalanimalsfuck.com",68],["candyteenporn.com",68],["daddyfuckmovies.com",68],["desifuckonline.com",68],["exclusiveasianporn.com",68],["exteenporn.com",68],["fantasticporn.net",68],["fantasticyoungporn.com",68],["fineasiansex.com",68],["firstasianpussy.com",68],["freeindiansextube.com",68],["freepornasians.com",68],["freerealvideo.com",68],["fuck-beeg.com",68],["fuck-xnxx.com",68],["fuckasian.pro",68],["fuckfuq.com",68],["fuckundies.com",68],["gojapaneseporn.com",68],["golderotica.com",68],["goodyoungsex.com",68],["goyoungporn.com",68],["hardxxxmoms.com",68],["hdvintagetube.com",68],["hentaiporn.me",68],["hentaisexfilms.com",68],["hentaisexuality.com",68],["hot-teens-movies.mobi",68],["hotanimepornvideos.com",68],["hotanimevideos.com",68],["hotasianpussysex.com",68],["hotjapaneseshows.com",68],["hotmaturetube.com",68],["hotmilfs.pro",68],["hotorientalporn.com",68],["hotpornyoung.com",68],["hotxxxjapanese.com",68],["hotxxxpussy.com",68],["indiafree.net",68],["indianpornvideo.online",68],["japanpornclip.com",68],["japanesetube.video",68],["japansex.me",68],["japanesexxxporn.com",68],["japansporno.com",68],["japanxxx.asia",68],["japanxxxworld.com",68],["keezmovies.surf",68],["lingeriefuckvideo.com",68],["liveanimalporn.zooo.club",68],["madhentaitube.com",68],["megahentaitube.com",68],["megajapanesesex.com",68],["megajapantube.com",68],["milfxxxpussy.com",68],["momsextube.pro",68],["momxxxass.com",68],["monkeyanimalporn.com",68],["moviexxx.mobi",68],["newanimeporn.com",68],["newjapanesexxx.com",68],["nicematureporn.com",68],["nudeplayboygirls.com",68],["openxxxporn.com",68],["originalindianporn.com",68],["originalteentube.com",68],["pig-fuck.com",68],["plainasianporn.com",68],["popularasianxxx.com",68],["pornanimetube.com",68],["pornasians.pro",68],["pornhat.asia",68],["pornheed.online",68],["pornjapanesesex.com",68],["pornomovies.asia",68],["pornvintage.tv",68],["primeanimesex.com",68],["realjapansex.com",68],["realmomsex.com",68],["redsexhub.com",68],["retroporn.world",68],["retrosexfilms.com",68],["sex-free-movies.com",68],["sexanimesex.com",68],["sexanimetube.com",68],["sexjapantube.com",68],["sexmomvideos.com",68],["sexteenxxxtube.com",68],["sexxxanimal.com",68],["sexyoungtube.com",68],["sexyvintageporn.com",68],["sopornmovies.com",68],["spicyvintageporn.com",68],["sunporno.club",68],["tabooanime.club",68],["teenextrem.com",68],["teenfucksex.com",68],["teenhost.net",68],["teensexass.com",68],["tnaflix.asia",68],["totalfuckmovies.com",68],["totalmaturefuck.com",68],["txxx.asia",68],["voyeurpornsex.com",68],["warmteensex.com",68],["wetasiancreampie.com",68],["wildhentaitube.com",68],["wowyoungsex.com",68],["xhamster-art.com",68],["xmovie.pro",68],["xnudevideos.com",68],["xnxxjapon.com",68],["xpics.me",68],["xvide.me",68],["xxxanimefuck.com",68],["xxxanimevideos.com",68],["xxxanimemovies.com",68],["xxxhentaimovies.com",68],["xxxhothub.com",68],["xxxjapaneseporntube.com",68],["xxxlargeporn.com",68],["xxxmomz.com",68],["xxxpornmilf.com",68],["xxxpussyclips.com",68],["xxxpussysextube.com",68],["xxxretrofuck.com",68],["xxxsex.pro",68],["xxxsexyjapanese.com",68],["xxxteenyporn.com",68],["xxxvideo.asia",68],["xxxvideos.ink",68],["xxxyoungtv.com",68],["youjizzz.club",68],["youngpussyfuck.com",68],["bayimg.com",69],["celeb.gate.cc",70],["eodev.com",71],["masterplayer.xyz",73],["pussy-hub.com",73],["porndex.com",74],["compucalitv.com",75],["diariodenavarra.es",77],["duden.de",79],["pennlive.com",81],["beautypageants.indiatimes.com",82],["01fmovies.com",83],["lnk2.cc",85],["fullhdxxx.com",86],["luscious.net",[86,134]],["classicpornbest.com",86],["xstory-fr.com",86],["1youngteenporn.com",86],["www-daftarharga.blogspot.com",[86,175]],["miraculous.to",[86,181]],["vtube.to",86],["gosexpod.com",87],["otakukan.com",88],["xcafe.com",89],["pornfd.com",89],["venusarchives.com",89],["imagehaha.com",90],["imagenpic.com",90],["imageshimage.com",90],["imagetwist.com",90],["k1nk.co",91],["watchasians.cc",91],["alexsports.xyz",91],["lulustream.com",91],["luluvdo.com",91],["web.de",92],["news18.com",93],["thelanb.com",94],["dropmms.com",94],["softwaredescargas.com",95],["cracking-dz.com",96],["anitube.ninja",97],["gazzetta.it",98],["port.hu",100],["dziennikbaltycki.pl",101],["dzienniklodzki.pl",101],["dziennikpolski24.pl",101],["dziennikzachodni.pl",101],["echodnia.eu",101],["expressbydgoski.pl",101],["expressilustrowany.pl",101],["gazetakrakowska.pl",101],["gazetalubuska.pl",101],["gazetawroclawska.pl",101],["gk24.pl",101],["gloswielkopolski.pl",101],["gol24.pl",101],["gp24.pl",101],["gra.pl",101],["gs24.pl",101],["kurierlubelski.pl",101],["motofakty.pl",101],["naszemiasto.pl",101],["nowiny24.pl",101],["nowosci.com.pl",101],["nto.pl",101],["polskatimes.pl",101],["pomorska.pl",101],["poranny.pl",101],["sportowy24.pl",101],["strefaagro.pl",101],["strefabiznesu.pl",101],["stronakobiet.pl",101],["telemagazyn.pl",101],["to.com.pl",101],["wspolczesna.pl",101],["course9x.com",101],["courseclub.me",101],["azrom.net",101],["alttyab.net",101],["esopress.com",101],["nesiaku.my.id",101],["onemanhua.com",102],["freeindianporn.mobi",102],["dr-farfar.com",103],["boyfriendtv.com",104],["brandstofprijzen.info",105],["netfuck.net",106],["blog24.me",[106,130]],["kisahdunia.com",106],["javsex.to",106],["nulljungle.com",106],["oyuncusoruyor.com",106],["pbarecap.ph",106],["sourds.net",106],["teknobalta.com",106],["tvinternetowa.info",106],["sqlserveregitimleri.com",106],["tutcourse.com",106],["readytechflip.com",106],["novinhastop.com",106],["warddogs.com",106],["dvdgayporn.com",106],["iimanga.com",106],["tinhocdongthap.com",106],["tremamnon.com",106],["423down.com",106],["brizzynovel.com",106],["jugomobile.com",106],["freecodezilla.net",106],["animekhor.xyz",106],["iconmonstr.com",106],["gay-tubes.cc",106],["rbxscripts.net",106],["comentariodetexto.com",106],["wordpredia.com",106],["livsavr.co",106],["allfaucet.xyz",[106,130]],["titbytz.tk",106],["replica-watch.info",106],["alludemycourses.com",106],["kayifamilytv.com",106],["iir.ai",107],["gameofporn.com",109],["qpython.club",110],["antifake-funko.fr",110],["dktechnicalmate.com",110],["recipahi.com",110],["e9china.net",111],["ac.ontools.net",111],["marketbeat.com",112],["hentaipornpics.net",113],["apps2app.com",114],["alliptvlinks.com",115],["waterfall.money",115],["xvideos.com",116],["xvideos2.com",116],["tubereader.me",117],["repretel.com",117],["dagensnytt.com",118],["mrproblogger.com",118],["themezon.net",118],["gfx-station.com",119],["bitzite.com",[119,130,133]],["historyofroyalwomen.com",120],["davescomputertips.com",120],["ukchat.co.uk",121],["hivelr.com",122],["embedz.click",123],["sexseeimage.com",124],["skidrowcodex.net",125],["takimag.com",126],["digi.no",127],["upshrink.com",128],["ohionowcast.info",130],["wiour.com",130],["appsbull.com",130],["diudemy.com",130],["maqal360.com",130],["bitcotasks.com",130],["videolyrics.in",130],["manofadan.com",130],["cempakajaya.com",130],["tagecoin.com",130],["doge25.in",130],["king-ptcs.com",130],["naijafav.top",130],["ourcoincash.xyz",130],["sh.techsamir.com",130],["claimcoins.site",130],["cryptosh.pro",130],["coinsrev.com",130],["go.freetrx.fun",130],["eftacrypto.com",130],["fescrypto.com",130],["earnhub.net",130],["kiddyshort.com",130],["tronxminer.com",130],["homeairquality.org",131],["exego.app",132],["cutlink.net",132],["cutsy.net",132],["cutyurls.com",132],["cutty.app",132],["cutnet.net",132],["aiimgvlog.fun",134],["6indianporn.com",134],["amateurebonypics.com",134],["amateuryoungpics.com",134],["cinemabg.net",134],["desimmshd.com",134],["frauporno.com",134],["givemeaporn.com",134],["jav-asia.top",134],["javf.net",134],["javideo.net",134],["kr18plus.com",134],["pilibook.com",134],["pornborne.com",134],["porngrey.com",134],["qqxnxx.com",134],["sexvideos.host",134],["submilf.com",134],["subtaboo.com",134],["tktube.com",134],["xfrenchies.com",134],["coingraph.us",135],["momo-net.com",135],["maxgaming.fi",135],["travel.vebma.com",136],["cloud.majalahhewan.com",136],["crm.cekresi.me",136],["ai.tempatwisata.pro",136],["pinloker.com",136],["sekilastekno.com",136],["vulture.com",137],["megaplayer.bokracdn.run",138],["hentaistream.com",139],["siteunblocked.info",140],["larvelfaucet.com",141],["feyorra.top",141],["claimtrx.com",141],["moviesyug.net",142],["w4files.ws",142],["parispi.net",143],["simkl.com",144],["paperzonevn.com",145],["dailyvideoreports.net",146],["lewd.ninja",147],["systemnews24.com",148],["incestvidz.com",149],["niusdiario.es",150],["playporngames.com",151],["movi.pk",[152,156]],["justin.mp3quack.lol",154],["cutesexyteengirls.com",155],["0dramacool.net",156],["185.53.88.104",156],["185.53.88.204",156],["185.53.88.15",156],["123movies4k.net",156],["1movieshd.com",156],["1rowsports.com",156],["4share-mp3.net",156],["6movies.net",156],["9animetv.to",156],["720pstream.me",156],["aagmaal.com",156],["abysscdn.com",156],["ajkalerbarta.com",156],["akstream.xyz",156],["androidapks.biz",156],["androidsite.net",156],["animeonlinefree.org",156],["animesite.net",156],["animespank.com",156],["aniworld.to",156],["apkmody.io",156],["appsfree4u.com",156],["audioz.download",156],["awafim.tv",156],["bdnewszh.com",156],["beastlyprints.com",156],["bengalisite.com",156],["bestfullmoviesinhd.org",156],["betteranime.net",156],["blacktiesports.live",156],["buffsports.stream",156],["ch-play.com",156],["clickforhire.com",156],["cloudy.pk",156],["computercrack.com",156],["coolcast2.com",156],["crackedsoftware.biz",156],["crackfree.org",156],["cracksite.info",156],["cryptoblog24.info",156],["cuatrolatastv.blogspot.com",156],["cydiasources.net",156],["dirproxy.com",156],["dopebox.to",156],["downloadapk.info",156],["downloadapps.info",156],["downloadgames.info",156],["downloadmusic.info",156],["downloadsite.org",156],["downloadwella.com",156],["ebooksite.org",156],["educationtips213.blogspot.com",156],["egyup.live",156],["embed.meomeo.pw",156],["embed.scdn.to",156],["emulatorsite.com",156],["essaysharkwriting.club",156],["exploreera.net",156],["extrafreetv.com",156],["fakedetail.com",156],["fclecteur.com",156],["files.im",156],["flexyhit.com",156],["fmoviefree.net",156],["fmovies24.com",156],["footyhunter3.xyz",156],["freeflix.info",156],["freemoviesu4.com",156],["freeplayervideo.com",156],["freesoccer.net",156],["fseries.org",156],["gamefast.org",156],["gamesite.info",156],["gettapeads.com",156],["gmanga.me",156],["gocast123.me",156],["gogohd.net",156],["gogoplay5.com",156],["gooplay.net",156],["gostreamon.net",156],["happy2hub.org",156],["harimanga.com",156],["healthnewsreel.com",156],["hexupload.net",156],["hinatasoul.com",156],["hindisite.net",156],["holymanga.net",156],["hxfile.co",156],["isosite.org",156],["iv-soft.com",156],["januflix.expert",156],["jewelry.com.my",156],["johnwardflighttraining.com",156],["kabarportal.com",156],["kstorymedia.com",156],["la123movies.org",156],["lespassionsdechinouk.com",156],["lilymanga.net",156],["linksdegrupos.com.br",156],["livestreamtv.pk",156],["macsite.info",156],["mangapt.com",156],["mangasite.org",156],["manhuascan.com",156],["megafilmeshdseries.com",156],["megamovies.org",156],["membed.net",156],["moddroid.com",156],["moviefree2.com",156],["movies-watch.com.pk",156],["moviesite.app",156],["moviesonline.fm",156],["moviesx.org",156],["msmoviesbd.com",156],["musicsite.biz",156],["myfernweh.com",156],["myviid.com",156],["nazarickol.com",156],["noob4cast.com",156],["nsw2u.com",[156,245]],["oko.sh",156],["olympicstreams.me",156],["orangeink.pk",156],["owllink.net",156],["pahaplayers.click",156],["patchsite.net",156],["pdfsite.net",156],["play1002.com",156],["player-cdn.com",156],["productkeysite.com",156],["projectfreetv.one",156],["romsite.org",156],["rufiguta.com",156],["rytmp3.io",156],["send.cm",156],["seriesite.net",156],["seriezloaded.com.ng",156],["serijehaha.com",156],["shrugemojis.com",156],["siteapk.net",156],["siteflix.org",156],["sitegames.net",156],["sitekeys.net",156],["sitepdf.com",156],["sitetorrent.com",156],["softwaresite.net",156],["sportbar.live",156],["sportkart1.xyz",156],["ssyoutube.com",156],["stardima.com",156],["stream4free.live",156],["superapk.org",156],["supermovies.org",156],["tainio-mania.online",156],["talaba.su",156],["tamilguns.org",156],["tatabrada.tv",156],["techtrendmakers.com",156],["theflixer.tv",156],["thememypc.net",156],["thetechzone.online",156],["thripy.com",156],["tonnestreamz.xyz",156],["travelplanspro.com",156],["turcasmania.com",156],["tusfiles.com",156],["tvonlinesports.com",156],["ultramovies.org",156],["uploadbank.com",156],["urdubolo.pk",156],["vidspeeds.com",156],["vumoo.to",156],["warezsite.net",156],["watchmovies2.com",156],["watchmoviesforfree.org",156],["watchofree.com",156],["watchsite.net",156],["watchsouthpark.tv",156],["watchtvch.club",156],["web.livecricket.is",156],["webseries.club",156],["worldcupstream.pm",156],["y2mate.com",156],["youapk.net",156],["youtube4kdownloader.com",156],["yts-subs.com",156],["haho.moe",157],["nicy-spicy.pw",158],["novelmultiverse.com",159],["mylegalporno.com",160],["asianembed.io",163],["thecut.com",164],["novelism.jp",165],["alphapolis.co.jp",166],["okrzone.com",167],["game3rb.com",168],["javhub.net",168],["thotvids.com",169],["berklee.edu",170],["rawkuma.com",[171,172]],["moviesjoyhd.to",172],["imeteo.sk",173],["youtubemp3donusturucu.net",174],["surfsees.com",176],["vivo.st",[177,178]],["alueviesti.fi",180],["kiuruvesilehti.fi",180],["lempaala.ideapark.fi",180],["olutposti.fi",180],["urjalansanomat.fi",180],["tainhanhvn.com",182],["titantv.com",183],["3cinfo.net",184],["transportationlies.org",185],["camarchive.tv",186],["crownimg.com",186],["freejav.guru",186],["hentai2read.com",186],["icyporno.com",186],["illink.net",186],["javtiful.com",186],["m-hentai.net",186],["pornblade.com",186],["pornfelix.com",186],["pornxxxxtube.net",186],["redwap.me",186],["redwap2.com",186],["redwap3.com",186],["tubxporn.xxx",186],["ver-comics-porno.com",186],["ver-mangas-porno.com",186],["xanimeporn.com",186],["xxxvideohd.net",186],["zetporn.com",186],["cocomanga.com",187],["sampledrive.in",188],["mcleaks.net",189],["explorecams.com",189],["minecraft.buzz",189],["chillx.top",190],["playerx.stream",190],["m.liputan6.com",192],["stardewids.com",[192,215]],["ingles.com",193],["spanishdict.com",193],["surfline.com",194],["rureka.com",195],["bunkr.is",196],["amateur8.com",197],["freeporn8.com",197],["maturetubehere.com",197],["embedo.co",198],["corriere.it",199],["oggi.it",199],["2the.space",200],["apkcombo.com",201],["sponsorhunter.com",202],["soft98.ir",203],["novelssites.com",204],["haxina.com",205],["cryptofenz.xyz",205],["torrentmac.net",206],["udvl.com",207],["moviezaddiction.icu",208],["dlpanda.com",209],["socialmediagirls.com",210],["einrichtungsbeispiele.de",211],["weadown.com",212],["molotov.tv",213],["freecoursesonline.me",214],["adelsfun.com",214],["advantien.com",214],["bailbondsfinder.com",214],["bigpiecreative.com",214],["childrenslibrarylady.com",214],["classifarms.com",214],["comtasq.ca",214],["crone.es",214],["ctrmarketingsolutions.com",214],["dropnudes.com",214],["ftuapps.dev",214],["genzsport.com",214],["ghscanner.com",214],["grsprotection.com",214],["gruporafa.com.br",214],["inmatefindcalifornia.com",214],["inmatesearchidaho.com",214],["itsonsitetv.com",214],["mfmfinancials.com",214],["myproplugins.com",214],["onehack.us",214],["ovester.com",214],["paste.bin.sx",214],["privatenudes.com",214],["renoconcrete.ca",214],["richieashbeck.com",214],["sat.technology",214],["short1ink.com",214],["stpm.co.uk",214],["wegotcookies.co",214],["mathcrave.com",214],["commands.gg",215],["smgplaza.com",216],["emturbovid.com",217],["freepik.com",218],["diyphotography.net",220],["bitchesgirls.com",221],["shopforex.online",222],["programmingeeksclub.com",223],["easymc.io",224],["diendancauduong.com",225],["parentcircle.com",226],["h-game18.xyz",227],["nopay.info",228],["wheelofgold.com",229],["shortlinks.tech",230],["skill4ltu.eu",232],["freepikdownloader.com",233],["freepasses.org",234],["iusedtobeaboss.com",235],["androidpolice.com",236],["cbr.com",236],["dualshockers.com",236],["gamerant.com",236],["howtogeek.com",236],["thegamer.com",236],["blogtruyenmoi.com",237],["igay69.com",238],["graphicget.com",239],["qiwi.gg",240],["netcine2.la",241],["idnes.cz",[242,243]],["cbc.ca",244]]);

const entitiesMap = new Map([["kisscartoon",1],["kissasian",7],["ganool",7],["pirate",7],["piratebay",7],["pirateproxy",7],["proxytpb",7],["thepiratebay",7],["limetorrents",[9,15]],["king-pes",9],["depedlps",9],["komikcast",9],["idedroidsafelink",9],["links-url",9],["ak4eg",9],["streanplay",10],["steanplay",10],["liferayiseasy",[11,12]],["pahe",15],["yts",15],["tube8",15],["topeuropix",15],["moviescounter",15],["torrent9",15],["desiremovies",15],["movs4u",15],["uwatchfree",15],["hydrax",15],["4movierulz",15],["projectfreetv",15],["arabseed",15],["btdb",[15,57]],["world4ufree",15],["streamsport",15],["rojadirectatvhd",15],["userload",15],["freecoursesonline",17],["lordpremium",17],["todovieneok",17],["novablogitalia",17],["anisubindo",17],["btvsports",17],["adyou",18],["fxporn69",21],["rexporn",25],["movies07",25],["pornocomics",25],["sexwebvideo",29],["pornomoll",29],["gsurl",32],["mimaletadepeliculas",33],["readcomiconline",34],["burningseries",35],["dz4soft",36],["yoututosjeff",36],["ebookmed",36],["lanjutkeun",36],["novelasesp",36],["singingdalong",36],["doujindesu",36],["xmovies8",39],["mega-dvdrip",46],["peliculas-dvdrip",46],["desbloqueador",47],["newpelis",[48,55]],["pelix",[48,55]],["allcalidad",[48,186]],["khatrimaza",48],["camwhores",49],["camwhorestv",49],["uproxy",49],["nekopoi",52],["mirrorace",61],["mixdrp",66],["asiansex",68],["japanfuck",68],["japanporn",68],["teensex",68],["vintagetube",68],["xxxmovies",68],["zooqle",72],["hdfull",76],["mangamanga",78],["streameast",80],["thestreameast",80],["vev",84],["vidop",84],["1337x",86],["zone-telechargement",86],["megalink",91],["gmx",92],["mega1080p",97],["9hentai",99],["gaypornhdfree",106],["cinemakottaga",106],["privatemoviez",106],["apkmaven",106],["popcornstream",108],["fc-lc",129],["pornktube",134],["watchseries",134],["milfnut",135],["pagalmovies",142],["7starhd",142],["jalshamoviez",142],["9xupload",142],["bdupload",142],["desiupload",142],["rdxhd1",142],["moviessources",153],["nuvid",154],["0gomovie",156],["0gomovies",156],["123moviefree",156],["1kmovies",156],["1madrasdub",156],["1primewire",156],["2embed",156],["2madrasdub",156],["2umovies",156],["4anime",156],["9xmovies",156],["adblockplustape",156],["altadefinizione01",156],["anitube",156],["atomixhq",156],["beinmatch",156],["brmovies",156],["cima4u",156],["clicknupload",156],["cmovies",156],["cricfree",156],["crichd",156],["databasegdriveplayer",156],["dood",156],["f1stream",156],["faselhd",156],["fbstream",156],["file4go",156],["filemoon",156],["filepress",[156,219]],["filmlinks4u",156],["filmpertutti",156],["filmyzilla",156],["fmovies",156],["french-stream",156],["fzlink",156],["gdriveplayer",156],["gofilms4u",156],["gogoanime",156],["gomoviz",156],["hdmoviefair",156],["hdmovies4u",156],["hdmovies50",156],["hdmoviesfair",156],["hh3dhay",156],["hindilinks4u",156],["hotmasti",156],["hurawatch",156],["klmanga",156],["klubsports",156],["libertestreamvf",156],["livetvon",156],["manga1000",156],["manga1001",156],["mangaraw",156],["mangarawjp",156],["mlbstream",156],["motogpstream",156],["movierulz",156],["movies123",156],["movies2watch",156],["moviesden",156],["moviezaddiction",156],["myflixer",156],["nbastream",156],["netcine",156],["nflstream",156],["nhlstream",156],["onlinewatchmoviespk",156],["pctfenix",156],["pctnew",156],["pksmovies",156],["plyjam",156],["plylive",156],["pogolinks",156],["popcorntime",156],["poscitech",156],["prmovies",156],["rugbystreams",156],["shahed4u",156],["sflix",156],["sitesunblocked",156],["solarmovies",156],["sportcast",156],["sportskart",156],["sports-stream",156],["streaming-french",156],["streamers",156],["streamingcommunity",156],["strikeout",156],["t20cup",156],["tennisstreams",156],["torrentdosfilmes",156],["toonanime",156],["tvply",156],["ufcstream",156],["uptomega",156],["uqload",156],["vudeo",156],["vidoo",156],["vipbox",156],["vipboxtv",156],["vipleague",156],["viprow",156],["yesmovies",156],["yomovies",156],["yomovies1",156],["yt2mp3s",156],["kat",156],["katbay",156],["kickass",156],["kickasshydra",156],["kickasskat",156],["kickass2",156],["kickasstorrents",156],["kat2",156],["kattracker",156],["thekat",156],["thekickass",156],["kickassz",156],["kickasstorrents2",156],["topkickass",156],["kickassgo",156],["kkickass",156],["kkat",156],["kickasst",156],["kick4ss",156],["guardaserie",161],["cine-calidad",162],["videovard",179],["gntai",186],["grantorrent",186],["mejortorrent",186],["mejortorrento",186],["mejortorrents",186],["mejortorrents1",186],["mejortorrentt",186],["shineads",188],["bg-gledai",214],["gledaitv",214],["motchill",231]]);

const exceptionsMap = new Map([["mentor.duden.de",[79]],["forum.soft98.ir",[203]]]);

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
